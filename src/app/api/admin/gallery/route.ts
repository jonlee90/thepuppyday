/**
 * Admin API - Gallery Management
 * GET /api/admin/gallery - List gallery images with filtering
 * POST /api/admin/gallery - Create gallery image (for report card integration)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { GalleryImage, Breed } from '@/types/database';
import {
  isValidImageUrl,
  validatePetName,
  validateCaption,
  validateTags,
} from '@/lib/utils/validation';

interface GalleryImageWithBreed extends GalleryImage {
  breed_name?: string | null;
}

/**
 * GET /api/admin/gallery
 * List all gallery images with optional filtering
 * Query params: filter=all|published|unpublished
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    // Build query
    let query = (supabase as any)
      .from('gallery_images')
      .select('*')
      .order('display_order', { ascending: true });

    // Apply filter
    if (filter === 'published') {
      query = query.eq('is_published', true);
    } else if (filter === 'unpublished') {
      query = query.eq('is_published', false);
    }

    const { data: images, error: imagesError } = (await query) as {
      data: GalleryImage[] | null;
      error: Error | null;
    };

    if (imagesError) {
      throw imagesError;
    }

    if (!images || images.length === 0) {
      return NextResponse.json({ images: [] });
    }

    // Fetch all breeds for lookup
    const { data: breeds, error: breedsError } = (await (supabase as any)
      .from('breeds')
      .select('id, name')) as {
      data: Breed[] | null;
      error: Error | null;
    };

    if (breedsError) {
      throw breedsError;
    }

    // Create breed lookup map
    const breedMap = new Map<string, string>();
    if (breeds) {
      breeds.forEach((breed) => {
        breedMap.set(breed.id, breed.name);
      });
    }

    // Enhance images with breed names
    const imagesWithBreeds: GalleryImageWithBreed[] = images.map((image) => ({
      ...image,
      breed_name: image.breed ? breedMap.get(image.breed) : null,
    }));

    return NextResponse.json({ images: imagesWithBreeds });
  } catch (error) {
    console.error('[Admin API] Error fetching gallery images:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch gallery images';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/gallery
 * Create gallery image (typically from report card integration)
 * This endpoint is for adding existing images (from report cards) to gallery
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    const body = await request.json();
    const {
      image_url,
      dog_name,
      breed_id,
      caption,
      tags = [],
      category = 'regular',
      is_before_after = false,
      before_image_url = null,
      is_published = false,
      source_type = null,
      source_id = null,
    } = body;

    // Security: Validate image URL
    if (!image_url || !isValidImageUrl(image_url)) {
      return NextResponse.json(
        { error: 'Valid image URL is required' },
        { status: 400 }
      );
    }

    // Security: Validate and sanitize pet name
    const petNameValidation = validatePetName(dog_name);
    if (!petNameValidation.valid) {
      return NextResponse.json(
        { error: petNameValidation.error },
        { status: 400 }
      );
    }

    // Security: Validate and sanitize caption
    const captionValidation = validateCaption(caption);
    if (!captionValidation.valid) {
      return NextResponse.json(
        { error: captionValidation.error },
        { status: 400 }
      );
    }

    // Security: Validate and sanitize tags
    const tagsValidation = validateTags(Array.isArray(tags) ? tags : []);
    if (!tagsValidation.valid) {
      return NextResponse.json(
        { error: tagsValidation.error },
        { status: 400 }
      );
    }

    // Validate before_image_url if provided
    if (before_image_url && !isValidImageUrl(before_image_url)) {
      return NextResponse.json(
        { error: 'Invalid before image URL format' },
        { status: 400 }
      );
    }

    // Get the next display_order
    const { data: existingImages } = (await (supabase as any)
      .from('gallery_images')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)) as {
      data: { display_order: number }[] | null;
    };

    const display_order = existingImages?.[0]?.display_order
      ? existingImages[0].display_order + 1
      : 1;

    // Create gallery image
    const { data: galleryImage, error: galleryError } = (await (supabase as any)
      .from('gallery_images')
      .insert({
        image_url,
        dog_name: petNameValidation.sanitized || null,
        breed: breed_id || null,
        caption: captionValidation.sanitized || null,
        tags: tagsValidation.sanitized,
        category,
        is_before_after,
        before_image_url,
        display_order,
        is_published,
        // Note: These fields might not exist in the schema yet
        // source_type,
        // source_id,
      })
      .select()
      .single()) as {
      data: GalleryImage | null;
      error: Error | null;
    };

    if (galleryError || !galleryImage) {
      throw galleryError || new Error('Failed to create gallery image');
    }

    return NextResponse.json({ image: galleryImage }, { status: 201 });
  } catch (error) {
    console.error('[Admin API] Error creating gallery image:', error);
    const message = error instanceof Error ? error.message : 'Failed to create gallery image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
