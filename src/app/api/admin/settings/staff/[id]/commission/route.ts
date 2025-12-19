/**
 * Admin Staff Commission Settings API Route
 * GET /api/admin/settings/staff/[id]/commission - Get commission settings
 * PUT /api/admin/settings/staff/[id]/commission - Update commission settings
 * Task 0207: Commission Settings API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { logSettingsChange } from '@/lib/admin/audit-log';
import type { StaffCommission, ServiceOverride } from '@/types/database';
import { z } from 'zod';

// Validation schema for service override
const serviceOverrideSchema = z.object({
  service_id: z.string().uuid('Invalid service ID'),
  rate: z.number().min(0, 'Rate must be non-negative'),
});

// Validation schema for commission settings
const commissionSettingsSchema = z.object({
  rate_type: z.enum(['percentage', 'flat_rate'], {
    errorMap: () => ({ message: 'Rate type must be either percentage or flat_rate' }),
  }),
  rate: z.number().min(0, 'Rate must be non-negative'),
  include_addons: z.boolean(),
  service_overrides: z.array(serviceOverrideSchema).optional(),
}).refine((data) => {
  // If rate_type is percentage, rate should be <= 100
  if (data.rate_type === 'percentage' && data.rate > 100) {
    return false;
  }
  return true;
}, {
  message: 'Percentage rate cannot exceed 100',
  path: ['rate'],
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    const { id: staffId } = await params;
    console.log('[Commission API] GET - Staff ID:', staffId);

    // Verify staff exists
    const { data: staffUser, error: staffError } = await (supabase as any)
      .from('users')
      .select('id, role')
      .eq('id', staffId)
      .single();

    if (staffError || !staffUser) {
      console.log('[Commission API] Staff not found:', staffId);
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // In mock mode, query from mock store
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { getMockStore } = await import('@/mocks/supabase/store');
      const store = getMockStore();

      const commissions = store.select('staff_commissions', {}) as unknown as StaffCommission[];
      const commission_settings = commissions.find(
        (c) => c.groomer_id === staffId
      ) || null;

      // Return default if not set
      const defaultSettings = {
        rate_type: 'percentage' as const,
        rate: 0,
        include_addons: false,
        service_overrides: null,
      };

      console.log('[Commission API] Returning commission settings for:', staffId);

      return NextResponse.json({
        data: commission_settings || defaultSettings,
      });
    }

    // Production Supabase query
    const { data: commissionData, error: commissionError } = await (supabase as any)
      .from('staff_commissions')
      .select('*')
      .eq('groomer_id', staffId)
      .single();

    // If not found, return default settings
    if (commissionError && commissionError.code === 'PGRST116') {
      const defaultSettings = {
        rate_type: 'percentage' as const,
        rate: 0,
        include_addons: false,
        service_overrides: null,
      };

      console.log('[Commission API] No commission settings found, returning default');

      return NextResponse.json({
        data: defaultSettings,
      });
    }

    if (commissionError) {
      console.error('[Commission API] Error fetching commission settings:', commissionError);
      return NextResponse.json(
        { error: 'Failed to fetch commission settings' },
        { status: 500 }
      );
    }

    console.log('[Commission API] Returning commission settings for:', staffId);

    return NextResponse.json({
      data: commissionData,
    });
  } catch (error) {
    console.error('[Commission API] Error in GET route:', error);

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
    const { user: adminUser } = await requireAdmin(supabase);

    const { id: staffId } = await params;
    console.log('[Commission API] PUT - Staff ID:', staffId, 'Admin:', adminUser.email);

    // Parse and validate request body
    const body = await request.json();
    const validation = commissionSettingsSchema.safeParse(body);

    if (!validation.success) {
      console.log('[Commission API] Validation failed:', validation.error.errors);
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { rate_type, rate, include_addons, service_overrides } = validation.data;

    // Verify staff exists
    const { data: staffUser, error: staffError } = await (supabase as any)
      .from('users')
      .select('id, role')
      .eq('id', staffId)
      .single();

    if (staffError || !staffUser) {
      console.log('[Commission API] Staff not found:', staffId);
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Validate service_overrides if provided
    if (service_overrides && service_overrides.length > 0) {
      // Verify all service IDs exist
      const serviceIds = service_overrides.map((so) => so.service_id);
      const { data: services, error: servicesError } = await (supabase as any)
        .from('services')
        .select('id')
        .in('id', serviceIds);

      if (servicesError) {
        console.error('[Commission API] Error validating services:', servicesError);
        return NextResponse.json(
          { error: 'Failed to validate service IDs' },
          { status: 500 }
        );
      }

      const validServiceIds = new Set((services || []).map((s: any) => s.id));
      const invalidServiceIds = serviceIds.filter((id) => !validServiceIds.has(id));

      if (invalidServiceIds.length > 0) {
        console.log('[Commission API] Invalid service IDs:', invalidServiceIds);
        return NextResponse.json(
          { error: `Invalid service IDs: ${invalidServiceIds.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // In mock mode, use mock store
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { getMockStore } = await import('@/mocks/supabase/store');
      const store = getMockStore();
      const { generateId } = await import('@/lib/utils');

      // Get existing commission settings
      const commissions = store.select('staff_commissions', {}) as unknown as StaffCommission[];
      const existingCommission = commissions.find((c) => c.groomer_id === staffId);

      let updatedCommission: StaffCommission;

      if (existingCommission) {
        // Update existing
        updatedCommission = {
          ...existingCommission,
          rate_type,
          rate,
          include_addons,
          service_overrides: service_overrides || null,
          updated_at: new Date().toISOString(),
        };

        store.update('staff_commissions', existingCommission.id, updatedCommission);
        console.log('[Commission API] Updated commission settings:', existingCommission.id);
      } else {
        // Insert new
        updatedCommission = {
          id: generateId(),
          groomer_id: staffId,
          rate_type,
          rate,
          include_addons,
          service_overrides: service_overrides || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        store.insert('staff_commissions', updatedCommission);
        console.log('[Commission API] Created commission settings:', updatedCommission.id);
      }

      // Log audit entry
      await logSettingsChange(
        supabase,
        adminUser.id,
        'staff',
        `staff.${staffId}.commission`,
        existingCommission || null,
        { rate_type, rate, include_addons, service_overrides }
      );

      return NextResponse.json({ data: updatedCommission });
    }

    // Production Supabase upsert
    const { data: updatedCommission, error: upsertError } = await (supabase as any)
      .from('staff_commissions')
      .upsert(
        {
          groomer_id: staffId,
          rate_type,
          rate,
          include_addons,
          service_overrides: service_overrides || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'groomer_id',
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('[Commission API] Error upserting commission settings:', upsertError);
      return NextResponse.json(
        { error: 'Failed to update commission settings' },
        { status: 500 }
      );
    }

    console.log('[Commission API] Updated commission settings for:', staffId);

    // Log audit entry (get old value first)
    const { data: oldCommission } = await (supabase as any)
      .from('staff_commissions')
      .select('*')
      .eq('groomer_id', staffId)
      .single();

    await logSettingsChange(
      supabase,
      adminUser.id,
      'staff',
      `staff.${staffId}.commission`,
      oldCommission || null,
      { rate_type, rate, include_addons, service_overrides }
    );

    return NextResponse.json({ data: updatedCommission });
  } catch (error) {
    console.error('[Commission API] Error in PUT route:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
