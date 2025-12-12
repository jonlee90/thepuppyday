/**
 * Admin Gallery Management Page
 * Upload, edit, and manage gallery images
 */

import { GalleryGrid } from '@/components/admin/gallery/GalleryGrid';

export default function GalleryPage() {
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
      <GalleryGrid />
    </div>
  );
}
