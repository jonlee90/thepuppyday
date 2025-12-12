/**
 * Admin API - Gallery Image Detail Management
 * GET /api/admin/gallery/[id] - Get single gallery image
 * PATCH /api/admin/gallery/[id] - Update gallery image metadata
 * DELETE /api/admin/gallery/[id] - Delete gallery image
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { GalleryImage } from '@/types/database';
import {
  isValidUUID,
  validatePetName,
  validateCaption,
  validateTags,
} from '@/lib/utils/validation';

/**
 * GET /api/admin/gallery/[id]
 * Get single gallery image with breed name
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);
    const { id } = await params;

    // Security: Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid image ID format' }, { status: 400 });
    }

    // Fetch gallery image
    const { data: image, error: imageError } = (await (supabase as any)
      .from('gallery_images')
      .select('*')
      .eq('id', id)
      .single()) as {
      data: GalleryImage | null;
      error: Error | null;
    };

    if (imageError || !image) {
      return NextResponse.json({ error: 'Gallery image not found' }, { status: 404 });
    }

    // Fetch breed name if breed is set
    let breed_name = null;
    if (image.breed) {
      const { data: breed, error: breedError } = (await (supabase as any)
        .from('breeds')
        .select('name')
        .eq('id', image.breed)
        .single()) as {
        data: { name: string } | null;
        error: Error | null;
      };

      if (!breedError && breed) {
        breed_name = breed.name;
      }
    }

    return NextResponse.json({
      image: {
        ...image,
        breed_name,
      },
    });
  } catch (error) {
    console.error('[Admin API] Error fetching gallery image:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch gallery image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/gallery/[id]
 * Update gallery image metadata
 * Can also quick toggle is_published or update display_order
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);
    const { id } = await params;

    // Security: Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid image ID format' }, { status: 400 });
    }

    const body = await request.json();
    const {
      dog_name,
      breed_id,
      caption,
      tags,
      is_published,
      display_order,
    } = body;

    // Build update object
    const imageUpdate: Partial<GalleryImage> = {};

    if (dog_name !== undefined) {
      // Security: Validate and sanitize pet name
      const petNameValidation = validatePetName(dog_name);
      if (!petNameValidation.valid) {
        return NextResponse.json(
          { error: petNameValidation.error },
          { status: 400 }
        );
      }
      imageUpdate.dog_name = petNameValidation.sanitized || null;
    }

    if (breed_id !== undefined) {
      // Validate breed exists if provided
      if (breed_id) {
        if (!isValidUUID(breed_id)) {
          return NextResponse.json(
            { error: 'Invalid breed ID format' },
            { status: 400 }
          );
        }

        const { data: breed, error: breedError } = (await (supabase as any)
          .from('breeds')
          .select('id')
          .eq('id', breed_id)
          .single()) as {
          data: { id: string } | null;
          error: Error | null;
        };

        if (breedError || !breed) {
          return NextResponse.json(
            { error: 'Breed not found' },
            { status: 404 }
          );
        }
      }
      imageUpdate.breed = breed_id || null;
    }

    if (caption !== undefined) {
      // Security: Validate and sanitize caption
      const captionValidation = validateCaption(caption);
      if (!captionValidation.valid) {
        return NextResponse.json(
          { error: captionValidation.error },
          { status: 400 }
        );
      }
      imageUpdate.caption = captionValidation.sanitized || null;
    }

    if (tags !== undefined) {
      // Security: Validate and sanitize tags
      const tagsValidation = validateTags(Array.isArray(tags) ? tags : []);
      if (!tagsValidation.valid) {
        return NextResponse.json(
          { error: tagsValidation.error },
          { status: 400 }
        );
      }
      imageUpdate.tags = tagsValidation.sanitized;
    }

    if (is_published !== undefined) {
      imageUpdate.is_published = is_published;
    }

    if (display_order !== undefined) {
      imageUpdate.display_order = display_order;
    }

    // Update gallery image
    const { data: updatedImage, error: updateError } = (await (supabase as any)
      .from('gallery_images')
      .update(imageUpdate)
      .eq('id', id)
      .select()
      .single()) as {
      data: GalleryImage | null;
      error: Error | null;
    };

    if (updateError || !updatedImage) {
      return NextResponse.json(
        { error: 'Gallery image not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ image: updatedImage });
  } catch (error) {
    console.error('[Admin API] Error updating gallery image:', error);
    const message = error instanceof Error ? error.message : 'Failed to update gallery image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/gallery/[id]
 * Delete gallery image and remove from Supabase Storage
 * Note: Does NOT delete if image is from a report card (source_type check)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);
    const { id } = await params;

    // Security: Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid image ID format' }, { status: 400 });
    }

    // Fetch the image first to get the URL
    const { data: image, error: fetchError } = (await (supabase as any)
      .from('gallery_images')
      .select('*')
      .eq('id', id)
      .single()) as {
      data: GalleryImage | null;
      error: Error | null;
    };

    if (fetchError || !image) {
      return NextResponse.json(
        { error: 'Gallery image not found' },
        { status: 404 }
      );
    }

    // Delete from database first
    const { error: deleteError } = await (supabase as any)
      .from('gallery_images')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    // Extract file path from URL and delete from storage
    // Only delete if it's from gallery-images bucket (not report card images)
    try {
      const url = new URL(image.image_url);
      const pathParts = url.pathname.split('/');

      // Check if this is from gallery-images bucket
      if (pathParts.includes('gallery-images')) {
        // Get the file name (last part of path)
        const fileName = pathParts[pathParts.length - 1];

        // Delete from storage
        const { error: storageError } = await (supabase as any)
          .storage
          .from('gallery-images')
          .remove([fileName]);

        if (storageError) {
          console.error('[Delete] Storage deletion failed:', storageError);
          // Continue anyway - database entry is already deleted
        }
      }
    } catch (urlError) {
      console.error('[Delete] Error parsing URL or deleting from storage:', urlError);
      // Continue anyway - database entry is already deleted
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin API] Error deleting gallery image:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete gallery image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
