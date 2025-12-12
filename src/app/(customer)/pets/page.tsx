/**
 * Pets List Page
 * Shows all customer's pets with options to add/edit
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { PetCardSkeletonGrid } from '@/components/ui/skeletons';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Fetch pets
async function getPets(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: pets } = await (supabase as any)
    .from('pets')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  return pets || [];
}

// Get user info from session
async function getUserInfo() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const { data: userData } = await (supabase as any)
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return userData;
}

// Size to label mapping
const sizeLabels: Record<string, string> = {
  small: 'Small (0-18 lbs)',
  medium: 'Medium (19-35 lbs)',
  large: 'Large (36-65 lbs)',
  xlarge: 'X-Large (66+ lbs)',
};

export default async function PetsPage() {
  const userData = await getUserInfo();

  if (!userData) {
    return null;
  }

  const pets = await getPets(userData.id);

  return (
    <Suspense fallback={<PetCardSkeletonGrid count={4} />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#434E54]">My Pets</h1>
            <p className="text-[#434E54]/60 mt-1">
              Manage your furry family members
            </p>
          </div>
          <Link
            href="/pets/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                     bg-[#434E54] text-white font-semibold text-sm
                     hover:bg-[#434E54]/90 transition-all duration-200
                     shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Pet
          </Link>
        </div>

        {pets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
            <EmptyState
              icon="dog"
              title="No Pets Yet"
              description="Add your first pet to start booking grooming appointments!"
              action={{
                label: 'Add Pet',
                href: '/pets/new',
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet: any) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        )}
      </div>
    </Suspense>
  );
}

// Pet Card Component
function PetCard({ pet }: { pet: any }) {
  return (
    <Link
      href={`/pets/${pet.id}`}
      className="block bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden
               hover:shadow-md transition-all duration-200"
    >
      {/* Pet image */}
      <div className="aspect-square bg-[#EAE0D5] relative">
        {pet.photo_url ? (
          <img
            src={pet.photo_url}
            alt={pet.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-24 h-24 text-[#434E54]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5c-1.5 0-3 .5-4 1.5l-2 2c-.5.5-1 1.5-1 2.5v5c0 1 .5 2 1.5 2.5l1.5 1 1-2h6l1 2 1.5-1c1-.5 1.5-1.5 1.5-2.5v-5c0-1-.5-2-1-2.5l-2-2c-1-1-2.5-1.5-4-1.5z" />
              <circle cx="9" cy="11" r="1" fill="currentColor" />
              <circle cx="15" cy="11" r="1" fill="currentColor" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 15h4" />
            </svg>
          </div>
        )}
      </div>

      {/* Pet info */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-[#434E54] mb-1">{pet.name}</h3>
        <p className="text-sm text-[#434E54]/60 mb-2">
          {pet.breed_name || 'Breed not specified'}
        </p>
        <div className="flex items-center gap-3 text-xs text-[#434E54]/50">
          {pet.weight_lbs && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              {pet.weight_lbs} lbs
            </span>
          )}
          {pet.size && (
            <span className="px-2 py-0.5 rounded-full bg-[#EAE0D5] capitalize">
              {pet.size}
            </span>
          )}
          {pet.gender && (
            <span className="capitalize">{pet.gender}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
