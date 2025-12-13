/**
 * Admin Gallery Management Page
 * Upload, edit, and manage gallery images
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { GalleryGrid } from '@/components/admin/gallery/GalleryGrid';

export default async function GalleryPage() {
  const supabase = await createServerSupabaseClient();
  // Note: Admin access is already verified by the layout

  // Fetch initial gallery images server-side
  const { data: initialImages } = (await (supabase as any)
    .from('gallery_images')
    .select(`
      *,
      breed:breeds(name)
    `)
    .order('display_order')) as { data: any[] | null; error: Error | null };

  // Transform data to include breed name
  const imagesWithBreed = (initialImages || []).map(image => ({
    ...image,
    breed_name: image.breed?.name || null,
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#434E54] mb-2">Gallery Management</h1>
        <p className="text-gray-600">
          Upload, edit, and organize photos for the public gallery. Drag and drop to reorder images.
        </p>
      </div>

      {/* Gallery Grid */}
      <GalleryGrid initialImages={imagesWithBreed} />
    </div>
  );
}
