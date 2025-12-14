import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { SegmentCriteria, SegmentPreview } from '@/types/marketing';

/**
 * POST /api/admin/campaigns/segment-preview
 * Preview the audience for a campaign based on segment criteria
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Require admin authentication
    await requireAdmin(supabase);

    const body = await request.json();
    const criteria: SegmentCriteria = body.criteria || {};

    // Check if we're in mock mode
    const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

    if (useMocks) {
      // Mock implementation
      const mockPreview = generateMockSegmentPreview(criteria);
      return NextResponse.json({ data: mockPreview });
    }

    // Production implementation - build dynamic query
    let query = (supabase as any)
      .from('users')
      .select(
        `
        id,
        full_name,
        email,
        phone,
        appointments:appointments(
          id,
          scheduled_at,
          created_at
        )
      `
      )
      .eq('role', 'customer');

    // Apply filters based on criteria
    // Note: Some complex filters may need to be done in-memory after fetching
    const { data: customers, error } = await query;

    if (error) {
      console.error('Error fetching segment preview:', error);
      return NextResponse.json(
        { error: 'Failed to fetch segment preview' },
        { status: 500 }
      );
    }

    // Apply in-memory filters for complex criteria
    const filteredCustomers = applySegmentFilters(customers || [], criteria);

    // Calculate metrics
    const preview: SegmentPreview = {
      total_customers: filteredCustomers.length,
      customers: filteredCustomers.slice(0, 5).map((customer: any) => {
        const appointments = customer.appointments || [];
        const lastAppointment = appointments.sort(
          (a: any, b: any) =>
            new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
        )[0];

        return {
          id: customer.id,
          name: customer.full_name,
          email: customer.email,
          phone: customer.phone,
          last_visit: lastAppointment?.scheduled_at || null,
          total_visits: appointments.length,
        };
      }),
    };

    return NextResponse.json({ data: preview });
  } catch (error) {
    console.error('Segment preview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Apply segment filters to customer data
 */
function applySegmentFilters(customers: any[], criteria: SegmentCriteria): any[] {
  return customers.filter((customer) => {
    const appointments = customer.appointments || [];

    // Filter by appointment count
    if (criteria.min_appointments !== undefined && appointments.length < criteria.min_appointments) {
      return false;
    }
    if (criteria.max_appointments !== undefined && appointments.length > criteria.max_appointments) {
      return false;
    }

    // Filter by last visit
    if (criteria.last_visit_days !== undefined) {
      const lastAppointment = appointments.sort(
        (a: any, b: any) =>
          new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
      )[0];

      if (lastAppointment) {
        const daysSinceVisit =
          (Date.now() - new Date(lastAppointment.scheduled_at).getTime()) /
          (1000 * 60 * 60 * 24);
        if (daysSinceVisit > criteria.last_visit_days) {
          return false;
        }
      }
    }

    // Filter by not visited since
    if (criteria.not_visited_since) {
      const cutoffDate = new Date(criteria.not_visited_since);
      const lastAppointment = appointments.sort(
        (a: any, b: any) =>
          new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
      )[0];

      if (!lastAppointment || new Date(lastAppointment.scheduled_at) > cutoffDate) {
        return false;
      }
    }

    // Filter by upcoming appointments
    if (criteria.has_upcoming_appointment !== undefined) {
      const hasUpcoming = appointments.some(
        (apt: any) => new Date(apt.scheduled_at) > new Date()
      );
      if (criteria.has_upcoming_appointment !== hasUpcoming) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Generate mock segment preview data
 */
function generateMockSegmentPreview(criteria: SegmentCriteria): SegmentPreview {
  const mockCustomers = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      phone: '(555) 123-4567',
      last_visit: '2024-11-15',
      total_visits: 8,
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'mchen@example.com',
      phone: '(555) 234-5678',
      last_visit: '2024-11-28',
      total_visits: 3,
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily.r@example.com',
      phone: '(555) 345-6789',
      last_visit: '2024-12-05',
      total_visits: 12,
    },
    {
      id: '4',
      name: 'David Park',
      email: 'dpark@example.com',
      phone: '(555) 456-7890',
      last_visit: '2024-10-20',
      total_visits: 5,
    },
    {
      id: '5',
      name: 'Jessica Williams',
      email: 'jwilliams@example.com',
      phone: '(555) 567-8901',
      last_visit: '2024-12-01',
      total_visits: 15,
    },
  ];

  // Apply simple filtering for mock data
  let filtered = [...mockCustomers];

  if (criteria.min_appointments !== undefined) {
    filtered = filtered.filter((c) => c.total_visits >= criteria.min_appointments!);
  }

  if (criteria.max_appointments !== undefined) {
    filtered = filtered.filter((c) => c.total_visits <= criteria.max_appointments!);
  }

  // Calculate total (simulate larger audience)
  const baseCount = filtered.length;
  const totalCustomers = baseCount > 0 ? Math.floor(Math.random() * 50) + baseCount : 0;

  return {
    total_customers: totalCustomers,
    customers: filtered.slice(0, 5),
  };
}
