/**
 * Admin Staff Management API Route
 * GET /api/admin/settings/staff - List all staff members
 * POST /api/admin/settings/staff - Create new staff member
 * Task 0203: Staff List & Create API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { logSettingsChange } from '@/lib/admin/audit-log';
import type { User, StaffCommission } from '@/types/database';
import { z } from 'zod';

// Validation schema for creating staff
const createStaffSchema = z.object({
  email: z.string().email('Invalid email address'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: z.enum(['groomer', 'admin'], {
    errorMap: () => ({ message: 'Role must be either groomer or admin' }),
  }),
});

interface StaffMemberResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
  appointment_count: number;
  upcoming_appointments: number;
  avg_rating: number | null;
  commission_settings: StaffCommission | null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user: adminUser } = await requireAdmin(supabase);

    console.log('[Staff API] GET - Admin user:', adminUser.email);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const roleFilter = searchParams.get('role') || 'all';
    const statusFilter = searchParams.get('status') || 'active';

    console.log('[Staff API] Filters - role:', roleFilter, 'status:', statusFilter);

    // In mock mode, query from mock store
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { getMockStore } = await import('@/mocks/supabase/store');
      const store = getMockStore();

      // Get all users with admin or groomer role
      let staff = store.select('users', {}) as unknown as User[];

      // Filter by role
      if (roleFilter === 'groomer') {
        staff = staff.filter((u) => u.role === 'groomer');
      } else if (roleFilter === 'admin') {
        staff = staff.filter((u) => u.role === 'admin');
      } else {
        // All staff (admin + groomer)
        staff = staff.filter((u) => u.role === 'admin' || u.role === 'groomer');
      }

      console.log('[Staff API] Found', staff.length, 'staff members');

      // Enrich with stats
      const enrichedStaff: StaffMemberResponse[] = staff.map((staffMember) => {
        // Get all appointments for this groomer
        const allAppointments = store.select('appointments', {}) as any[];
        const staffAppointments = allAppointments.filter(
          (apt: any) => apt.groomer_id === staffMember.id
        );

        // Count completed appointments
        const completedAppointments = staffAppointments.filter(
          (apt: any) => apt.status === 'completed'
        );
        const appointment_count = completedAppointments.length;

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
          const appointment = allAppointments.find((apt: any) => apt.id === rc.appointment_id);
          return appointment && appointment.groomer_id === staffMember.id && rc.rating != null;
        });

        const avg_rating = staffReportCards.length > 0
          ? staffReportCards.reduce((sum: number, rc: any) => sum + (rc.rating || 0), 0) / staffReportCards.length
          : null;

        // Get commission settings
        const commissions = store.select('staff_commissions', {}) as unknown as StaffCommission[];
        const commission_settings = commissions.find(
          (c) => c.groomer_id === staffMember.id
        ) || null;

        return {
          id: staffMember.id,
          email: staffMember.email,
          first_name: staffMember.first_name,
          last_name: staffMember.last_name,
          phone: staffMember.phone,
          role: staffMember.role,
          avatar_url: staffMember.avatar_url,
          created_at: staffMember.created_at,
          appointment_count,
          upcoming_appointments,
          avg_rating: avg_rating ? Math.round(avg_rating * 10) / 10 : null,
          commission_settings,
        };
      });

      // Sort by role DESC (admin first), then by last_name ASC
      enrichedStaff.sort((a, b) => {
        if (a.role !== b.role) {
          return a.role === 'admin' ? -1 : 1;
        }
        return a.last_name.localeCompare(b.last_name);
      });

      console.log('[Staff API] Returning', enrichedStaff.length, 'enriched staff members');

      return NextResponse.json({
        data: enrichedStaff,
      });
    }

    // Production Supabase query
    let query = (supabase as any)
      .from('users')
      .select('*')
      .in('role', roleFilter === 'all' ? ['admin', 'groomer'] : [roleFilter]);

    const { data: staffData, error: staffError } = await query;

    if (staffError) {
      console.error('[Staff API] Error fetching staff:', staffError);
      return NextResponse.json(
        { error: 'Failed to fetch staff members' },
        { status: 500 }
      );
    }

    // Enrich with stats
    const enrichedStaff: StaffMemberResponse[] = await Promise.all(
      (staffData || []).map(async (staffMember: User) => {
        // Count completed appointments
        const { count: appointmentCount } = await (supabase as any)
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('groomer_id', staffMember.id)
          .eq('status', 'completed');

        // Count upcoming appointments (next 7 days)
        const now = new Date();
        const sevenDaysFromNow = new Date(now);
        sevenDaysFromNow.setDate(now.getDate() + 7);

        const { count: upcomingCount } = await (supabase as any)
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('groomer_id', staffMember.id)
          .in('status', ['pending', 'confirmed'])
          .gte('scheduled_at', now.toISOString())
          .lte('scheduled_at', sevenDaysFromNow.toISOString());

        // Get average rating
        const { data: reportCards } = await (supabase as any)
          .from('report_cards')
          .select('rating, appointment_id')
          .not('rating', 'is', null);

        const { data: staffAppointments } = await (supabase as any)
          .from('appointments')
          .select('id')
          .eq('groomer_id', staffMember.id);

        const staffAppointmentIds = new Set(
          (staffAppointments || []).map((apt: any) => apt.id)
        );

        const staffRatings = (reportCards || [])
          .filter((rc: any) => staffAppointmentIds.has(rc.appointment_id))
          .map((rc: any) => rc.rating);

        const avg_rating = staffRatings.length > 0
          ? staffRatings.reduce((sum: number, rating: number) => sum + rating, 0) / staffRatings.length
          : null;

        // Get commission settings
        const { data: commissionData } = await (supabase as any)
          .from('staff_commissions')
          .select('*')
          .eq('groomer_id', staffMember.id)
          .single();

        return {
          id: staffMember.id,
          email: staffMember.email,
          first_name: staffMember.first_name,
          last_name: staffMember.last_name,
          phone: staffMember.phone,
          role: staffMember.role,
          avatar_url: staffMember.avatar_url,
          created_at: staffMember.created_at,
          appointment_count: appointmentCount || 0,
          upcoming_appointments: upcomingCount || 0,
          avg_rating: avg_rating ? Math.round(avg_rating * 10) / 10 : null,
          commission_settings: commissionData || null,
        };
      })
    );

    // Sort by role DESC (admin first), then by last_name ASC
    enrichedStaff.sort((a, b) => {
      if (a.role !== b.role) {
        return a.role === 'admin' ? -1 : 1;
      }
      return a.last_name.localeCompare(b.last_name);
    });

    return NextResponse.json({
      data: enrichedStaff,
    });
  } catch (error) {
    console.error('[Staff API] Error in GET route:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user: adminUser } = await requireAdmin(supabase);

    console.log('[Staff API] POST - Admin user:', adminUser.email);

    // Parse and validate request body
    const body = await request.json();
    const validation = createStaffSchema.safeParse(body);

    if (!validation.success) {
      console.log('[Staff API] Validation failed:', validation.error.errors);
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, first_name, last_name, phone, role } = validation.data;

    // Check if email already exists
    const { data: existingUser } = await (supabase as any)
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      console.log('[Staff API] Email already exists:', email);
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // In mock mode, use mock store
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { getMockStore } = await import('@/mocks/supabase/store');
      const store = getMockStore();
      const { generateId } = await import('@/lib/utils');

      const newStaff: User = {
        id: generateId(),
        email,
        first_name,
        last_name,
        phone: phone || null,
        role: role as 'admin' | 'groomer',
        avatar_url: null,
        preferences: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      store.insert('users', newStaff);

      console.log('[Staff API] Created staff member:', newStaff.id);

      // Log audit entry
      await logSettingsChange(
        supabase,
        adminUser.id,
        'staff',
        `staff.${newStaff.id}`,
        null,
        { email, first_name, last_name, phone, role }
      );

      return NextResponse.json(
        { data: newStaff },
        { status: 201 }
      );
    }

    // Production Supabase insert
    const { data: newStaff, error: insertError } = await (supabase as any)
      .from('users')
      .insert({
        email,
        first_name,
        last_name,
        phone: phone || null,
        role,
        avatar_url: null,
        preferences: {},
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Staff API] Error creating staff:', insertError);
      return NextResponse.json(
        { error: 'Failed to create staff member' },
        { status: 500 }
      );
    }

    console.log('[Staff API] Created staff member:', newStaff.id);

    // Log audit entry
    await logSettingsChange(
      supabase,
      adminUser.id,
      'staff',
      `staff.${newStaff.id}`,
      null,
      { email, first_name, last_name, phone, role }
    );

    return NextResponse.json(
      { data: newStaff },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Staff API] Error in POST route:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
