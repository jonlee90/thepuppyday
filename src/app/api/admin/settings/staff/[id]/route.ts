/**
 * Admin Staff Detail API Route
 * GET /api/admin/settings/staff/[id] - Get staff member detail
 * Task 0206: Staff Detail API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { User, Appointment, StaffCommission } from '@/types/database';

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
    await requireAdmin(supabase);

    const { id: staffId } = await params;
    console.log('[Staff Detail API] GET - Staff ID:', staffId);

    // In mock mode, query from mock store
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { getMockStore } = await import('@/mocks/supabase/store');
      const store = getMockStore();

      // Get staff profile
      const profile = store.selectById('users', staffId) as User | null;

      if (!profile) {
        console.log('[Staff Detail API] Staff not found:', staffId);
        return NextResponse.json(
          { error: 'Staff member not found' },
          { status: 404 }
        );
      }

      // Verify user is staff
      if (profile.role !== 'admin' && profile.role !== 'groomer') {
        console.log('[Staff Detail API] User is not staff:', staffId);
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

      console.log('[Staff Detail API] Returning staff detail:', {
        id: staffId,
        completed_appointments,
        upcoming_appointments,
        avg_rating: avg_rating ? Math.round(avg_rating * 10) / 10 : null,
      });

      return NextResponse.json({ data: response });
    }

    // Production Supabase query
    // Get staff profile
    const { data: profile, error: profileError } = await (supabase as any)
      .from('users')
      .select('*')
      .eq('id', staffId)
      .single();

    if (profileError || !profile) {
      console.log('[Staff Detail API] Staff not found:', staffId);
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Verify user is staff
    if (profile.role !== 'admin' && profile.role !== 'groomer') {
      console.log('[Staff Detail API] User is not staff:', staffId);
      return NextResponse.json(
        { error: 'User is not a staff member' },
        { status: 400 }
      );
    }

    // Count completed appointments
    const { count: completedCount } = await (supabase as any)
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('groomer_id', staffId)
      .eq('status', 'completed');

    // Count upcoming appointments (next 7 days)
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const { count: upcomingCount } = await (supabase as any)
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('groomer_id', staffId)
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
    const { data: recentAppointments } = await (supabase as any)
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
    const { data: commissionData } = await (supabase as any)
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

    console.log('[Staff Detail API] Returning staff detail:', {
      id: staffId,
      completed_appointments: completedCount || 0,
      upcoming_appointments: upcomingCount || 0,
      avg_rating: avg_rating ? Math.round(avg_rating * 10) / 10 : null,
    });

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
