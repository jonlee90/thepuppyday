/**
 * Admin Staff Management API Route
 * GET /api/admin/settings/staff - List all staff members
 * POST /api/admin/settings/staff - Create new staff member
 * Task 0203: Staff List & Create API
 */

import { NextRequest, NextResponse, after } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
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
    const serviceClient = createServiceRoleClient();
    const { user: adminUser } = await requireAdmin(supabase);


    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const roleFilter = searchParams.get('role') || 'all';
    const statusFilter = searchParams.get('status') || 'active';


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


      return NextResponse.json({
        data: enrichedStaff,
      });
    }

    // Production Supabase query
    const query = (serviceClient as any)
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

    // Batch all stats queries (constant number of queries regardless of staff count)
    const staffIds = (staffData || []).map((s: User) => s.id);

    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);

    // Run all 4 batch queries in parallel
    const [
      { data: completedRows },
      { data: upcomingRows },
      { data: ratingRows },
      { data: commissionRows },
    ] = await Promise.all([
      // 1. Completed appointments per groomer
      (serviceClient as any)
        .from('appointments')
        .select('groomer_id')
        .in('groomer_id', staffIds)
        .eq('status', 'completed'),

      // 2. Upcoming appointments per groomer (next 7 days)
      (serviceClient as any)
        .from('appointments')
        .select('groomer_id')
        .in('groomer_id', staffIds)
        .in('status', ['pending', 'confirmed'])
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', sevenDaysFromNow.toISOString()),

      // 3. All report card ratings joined through appointments for these groomers
      (serviceClient as any)
        .from('appointments')
        .select('groomer_id, report_cards(rating)')
        .in('groomer_id', staffIds)
        .not('report_cards', 'is', null),

      // 4. All commission settings for these groomers
      (serviceClient as any)
        .from('staff_commissions')
        .select('*')
        .in('groomer_id', staffIds),
    ]);

    // Build lookup maps from batch results
    const completedCountMap = new Map<string, number>();
    for (const row of completedRows || []) {
      completedCountMap.set(row.groomer_id, (completedCountMap.get(row.groomer_id) || 0) + 1);
    }

    const upcomingCountMap = new Map<string, number>();
    for (const row of upcomingRows || []) {
      upcomingCountMap.set(row.groomer_id, (upcomingCountMap.get(row.groomer_id) || 0) + 1);
    }

    const ratingsMap = new Map<string, number[]>();
    for (const row of ratingRows || []) {
      // report_cards is returned as an array from the join; each entry has a rating
      const cards = Array.isArray(row.report_cards) ? row.report_cards : [row.report_cards];
      for (const card of cards) {
        if (card && card.rating != null) {
          const existing = ratingsMap.get(row.groomer_id) || [];
          existing.push(card.rating);
          ratingsMap.set(row.groomer_id, existing);
        }
      }
    }

    const commissionMap = new Map<string, StaffCommission>();
    for (const row of commissionRows || []) {
      commissionMap.set(row.groomer_id, row);
    }

    // Assemble enriched staff from lookup maps
    const enrichedStaff: StaffMemberResponse[] = (staffData || []).map((staffMember: User) => {
      const ratings = ratingsMap.get(staffMember.id);
      const avg_rating = ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : null;

      return {
        id: staffMember.id,
        email: staffMember.email,
        first_name: staffMember.first_name,
        last_name: staffMember.last_name,
        phone: staffMember.phone,
        role: staffMember.role,
        avatar_url: staffMember.avatar_url,
        created_at: staffMember.created_at,
        appointment_count: completedCountMap.get(staffMember.id) || 0,
        upcoming_appointments: upcomingCountMap.get(staffMember.id) || 0,
        avg_rating: avg_rating ? Math.round(avg_rating * 10) / 10 : null,
        commission_settings: commissionMap.get(staffMember.id) || null,
      };
    });

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
    const serviceClient = createServiceRoleClient();
    const { user: adminUser } = await requireAdmin(supabase);


    // Parse and validate request body
    const body = await request.json();
    const validation = createStaffSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, first_name, last_name, phone, role } = validation.data;

    // Check if email already exists
    const { data: existingUser } = await (serviceClient as any)
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
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


      // Log audit entry (non-blocking)
      after(() => logSettingsChange(
        supabase,
        adminUser.id,
        'staff',
        `staff.${newStaff.id}`,
        null,
        { email, first_name, last_name, phone, role }
      ));

      return NextResponse.json(
        { data: newStaff },
        { status: 201 }
      );
    }

    // Production Supabase insert
    const { data: newStaff, error: insertError } = await (serviceClient as any)
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


    // Log audit entry (non-blocking)
    after(() => logSettingsChange(
      supabase,
      adminUser.id,
      'staff',
      `staff.${newStaff.id}`,
      null,
      { email, first_name, last_name, phone, role }
    ));

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
