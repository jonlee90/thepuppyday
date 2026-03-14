/**
 * Admin Staff Detail API Route
 * GET /api/admin/settings/staff/[id] - Get staff member detail
 * PUT /api/admin/settings/staff/[id] - Update staff member
 * DELETE /api/admin/settings/staff/[id] - Soft delete staff member (set is_active=false)
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse, after } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { logSettingsChange } from '@/lib/admin/audit-log';
import { z } from 'zod';
import type { User, StaffCommission } from '@/types/database';

const updateStaffSchema = z.object({
  first_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(['groomer', 'admin']).optional(),
  is_active: z.boolean().optional(),
});

interface StaffDetailResponse {
  profile: User;
  stats: {
    completed_appointments: number;
    upcoming_appointments: number;
    avg_rating: number | null;
  };
  recent_appointments: any[];
  commission_settings: StaffCommission | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();
    await requireAdmin(supabase);

    const { id: staffId } = await params;

    // In mock mode, query from mock store
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { getMockStore } = await import('@/mocks/supabase/store');
      const store = getMockStore();

      // Get staff profile
      const profile = store.selectById('users', staffId) as User | null;

      if (!profile) {
        return NextResponse.json(
          { error: 'Staff member not found' },
          { status: 404 }
        );
      }

      // Verify user is staff
      if (profile.role !== 'admin' && profile.role !== 'groomer') {
        return NextResponse.json(
          { error: 'User is not a staff member' },
          { status: 400 }
        );
      }

      // Get all appointments for this groomer
      const allAppointments = store.select('appointments', {}) as any[];
      const staffAppointments = allAppointments.filter(
        (apt: any) => apt.groomer_id === staffId
      );

      // Count completed appointments
      const completedAppointments = staffAppointments.filter(
        (apt: any) => apt.status === 'completed'
      );
      const completed_appointments = completedAppointments.length;

      // Count upcoming appointments (next 7 days)
      const now = new Date();
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(now.getDate() + 7);

      const upcomingAppointments = staffAppointments.filter((apt: any) => {
        const aptDate = new Date(apt.scheduled_at);
        return (
          (apt.status === 'pending' || apt.status === 'confirmed') &&
          aptDate >= now &&
          aptDate <= sevenDaysFromNow
        );
      });
      const upcoming_appointments = upcomingAppointments.length;

      // Calculate average rating from report cards
      const reportCards = store.select('report_cards', {}) as any[];
      const staffReportCards = reportCards.filter((rc: any) => {
        const appointment = staffAppointments.find((apt: any) => apt.id === rc.appointment_id);
        return appointment && rc.rating != null;
      });

      const avg_rating = staffReportCards.length > 0
        ? staffReportCards.reduce((sum: number, rc: any) => sum + (rc.rating || 0), 0) / staffReportCards.length
        : null;

      // Get recent appointments (last 10)
      const recentAppointments = staffAppointments
        .sort((a: any, b: any) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
        .slice(0, 10)
        .map((apt: any) => ({
          ...apt,
          customer: store.selectById('users', apt.customer_id),
          pet: store.selectById('pets', apt.pet_id),
          service: store.selectById('services', apt.service_id),
        }));

      // Get commission settings
      const commissions = store.select('staff_commissions', {}) as unknown as StaffCommission[];
      const commission_settings = commissions.find(
        (c) => c.groomer_id === staffId
      ) || null;

      const response: StaffDetailResponse = {
        profile,
        stats: {
          completed_appointments,
          upcoming_appointments,
          avg_rating: avg_rating ? Math.round(avg_rating * 10) / 10 : null,
        },
        recent_appointments: recentAppointments,
        commission_settings,
      };


      return NextResponse.json({ data: response });
    }

    // Production Supabase query
    // Get staff profile
    const { data: profile, error: profileError } = await (serviceClient as any)
      .from('users')
      .select('*')
      .eq('id', staffId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Verify user is staff
    if (profile.role !== 'admin' && profile.role !== 'groomer') {
      return NextResponse.json(
        { error: 'User is not a staff member' },
        { status: 400 }
      );
    }

    // Count completed appointments
    const { count: completedCount } = await (serviceClient as any)
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('groomer_id', staffId)
      .eq('status', 'completed');

    // Count upcoming appointments (next 7 days)
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const { count: upcomingCount } = await (serviceClient as any)
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('groomer_id', staffId)
      .in('status', ['pending', 'confirmed'])
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', sevenDaysFromNow.toISOString());

    // Get average rating
    const { data: reportCards } = await (serviceClient as any)
      .from('report_cards')
      .select('rating, appointment_id')
      .not('rating', 'is', null);

    const { data: staffAppointments } = await (serviceClient as any)
      .from('appointments')
      .select('id')
      .eq('groomer_id', staffId);

    const staffAppointmentIds = new Set(
      (staffAppointments || []).map((apt: any) => apt.id)
    );

    const staffRatings = (reportCards || [])
      .filter((rc: any) => staffAppointmentIds.has(rc.appointment_id))
      .map((rc: any) => rc.rating);

    const avg_rating = staffRatings.length > 0
      ? staffRatings.reduce((sum: number, rating: number) => sum + rating, 0) / staffRatings.length
      : null;

    // Get recent appointments (last 10)
    const { data: recentAppointments } = await (serviceClient as any)
      .from('appointments')
      .select(`
        *,
        customer:users!customer_id(*),
        pet:pets(*),
        service:services(*)
      `)
      .eq('groomer_id', staffId)
      .order('scheduled_at', { ascending: false })
      .limit(10);

    // Get commission settings
    const { data: commissionData } = await (serviceClient as any)
      .from('staff_commissions')
      .select('*')
      .eq('groomer_id', staffId)
      .single();

    const response: StaffDetailResponse = {
      profile,
      stats: {
        completed_appointments: completedCount || 0,
        upcoming_appointments: upcomingCount || 0,
        avg_rating: avg_rating ? Math.round(avg_rating * 10) / 10 : null,
      },
      recent_appointments: recentAppointments || [],
      commission_settings: commissionData || null,
    };


    return NextResponse.json({ data: response });
  } catch (error) {
    console.error('[Staff Detail API] Error in GET route:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();
    const { user: adminUser } = await requireAdmin(supabase);

    const { id: staffId } = await params;
    const body = await request.json();
    const validation = updateStaffSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // Verify staff exists
    const { data: existing, error: fetchError } = await (serviceClient as any)
      .from('users')
      .select('id, email, first_name, last_name, role, is_active')
      .eq('id', staffId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Check email uniqueness (excluding self)
    if (updates.email && updates.email !== existing.email) {
      const { data: emailConflict } = await (serviceClient as any)
        .from('users')
        .select('id')
        .eq('email', updates.email)
        .neq('id', staffId)
        .single();

      if (emailConflict) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        );
      }
    }

    const { data: updatedStaff, error: updateError } = await (serviceClient as any)
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', staffId)
      .select()
      .single();

    if (updateError) {
      console.error('[Staff API] Error updating staff:', updateError);
      return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 });
    }

    after(() => logSettingsChange(
      supabase,
      adminUser.id,
      'staff',
      `staff.${staffId}`,
      existing,
      updates
    ));

    return NextResponse.json({ data: updatedStaff });
  } catch (error) {
    console.error('[Staff API] Error in PUT route:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();
    const { user: adminUser } = await requireAdmin(supabase);

    const { id: staffId } = await params;

    // Verify staff exists
    const { data: existing, error: fetchError } = await (serviceClient as any)
      .from('users')
      .select('id, first_name, last_name, email, role, is_active')
      .eq('id', staffId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Count upcoming appointments as a warning
    const now = new Date();
    const { count: upcomingCount } = await (serviceClient as any)
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('groomer_id', staffId)
      .in('status', ['pending', 'confirmed'])
      .gte('scheduled_at', now.toISOString());

    // Soft delete: set is_active = false
    const { error: updateError } = await (serviceClient as any)
      .from('users')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', staffId);

    if (updateError) {
      console.error('[Staff API] Error deactivating staff:', updateError);
      return NextResponse.json({ error: 'Failed to deactivate staff member' }, { status: 500 });
    }

    after(() => logSettingsChange(
      supabase,
      adminUser.id,
      'staff',
      `staff.${staffId}`,
      { is_active: true },
      { is_active: false }
    ));

    return NextResponse.json({
      data: { id: staffId, upcoming_appointments: upcomingCount || 0 },
      message: 'Staff member deactivated',
    });
  } catch (error) {
    console.error('[Staff API] Error in DELETE route:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
