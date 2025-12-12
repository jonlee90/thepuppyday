/**
 * Admin API - Gallery Image Upload
 * POST /api/admin/gallery/upload - Upload multiple images to gallery
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { GalleryImage } from '@/types/database';
import { validateImageFile } from '@/lib/utils/validation';

/**
 * POST /api/admin/gallery/upload
 * Upload multiple images to Supabase Storage and create gallery entries
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate all files first
    const validationErrors: Record<string, string> = {};
    files.forEach((file, index) => {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        validationErrors[`file_${index}`] = validation.error || 'Invalid file';
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        { error: 'File validation failed', errors: validationErrors },
        { status: 400 }
      );
    }

    // Get the starting display_order
    const { data: existingImages } = (await (supabase as any)
      .from('gallery_images')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)) as {
      data: { display_order: number }[] | null;
    };

    let display_order = existingImages?.[0]?.display_order
      ? existingImages[0].display_order + 1
      : 1;

    const uploadedImages: GalleryImage[] = [];
    const uploadErrors: Array<{ fileName: string; error: string }> = [];

    // Process each file
    for (const file of files) {
      try {
        // Generate UUID for file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Convert File to ArrayBuffer then to Uint8Array for Supabase
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await (supabase as any)
          .storage
          .from('gallery-images')
          .upload(filePath, uint8Array, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('[Upload] Storage error:', uploadError);
          uploadErrors.push({
            fileName: file.name,
            error: uploadError.message || 'Upload failed',
          });
          continue;
        }

        // Get public URL
        const { data: urlData } = (supabase as any)
          .storage
          .from('gallery-images')
          .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
          uploadErrors.push({
            fileName: file.name,
            error: 'Failed to get public URL',
          });
          continue;
        }

        // Create gallery image entry
        const { data: galleryImage, error: galleryError } = (await (supabase as any)
          .from('gallery_images')
          .insert({
            image_url: urlData.publicUrl,
            dog_name: null,
            breed: null,
            caption: null,
            tags: [],
            category: 'regular',
            is_before_after: false,
            before_image_url: null,
            display_order: display_order++,
            is_published: false, // Default to unpublished
          })
          .select()
          .single()) as {
          data: GalleryImage | null;
          error: Error | null;
        };

        if (galleryError || !galleryImage) {
          console.error('[Upload] Database error:', galleryError);
          uploadErrors.push({
            fileName: file.name,
            error: galleryError?.message || 'Failed to create database entry',
          });

          // Clean up uploaded file
          await (supabase as any)
            .storage
            .from('gallery-images')
            .remove([filePath]);

          continue;
        }

        uploadedImages.push(galleryImage);
      } catch (fileError) {
        console.error('[Upload] Error processing file:', fileError);
        uploadErrors.push({
          fileName: file.name,
          error: fileError instanceof Error ? fileError.message : 'Unknown error',
        });
      }
    }

    // Return results
    if (uploadedImages.length === 0 && uploadErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'All uploads failed',
          errors: uploadErrors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      images: uploadedImages,
      errors: uploadErrors.length > 0 ? uploadErrors : undefined,
      success: uploadedImages.length,
      failed: uploadErrors.length,
    }, { status: 201 });
  } catch (error) {
    console.error('[Admin API] Error uploading gallery images:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload images';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
