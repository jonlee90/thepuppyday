/**
 * GET /api/admin/customers/[id]/pets
 * Fetch all pets for a specific customer
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;

    // TODO: Replace with actual database query when Supabase is integrated
    // For now, return mock data
    const mockPets = [
      {
        id: 'pet-1',
        name: 'Max',
        breed_id: 'breed-1',
        breed_name: 'Golden Retriever',
        size: 'large' as const,
        weight: 65,
        customer_id: customerId,
      },
      {
        id: 'pet-2',
        name: 'Bella',
        breed_id: 'breed-2',
        breed_name: 'Poodle',
        size: 'small' as const,
        weight: 12,
        customer_id: customerId,
      },
    ];

    return NextResponse.json({
      success: true,
      pets: mockPets,
    });
  } catch (error) {
    console.error('GET /api/admin/customers/[id]/pets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer pets' },
      { status: 500 }
    );
  }
}
