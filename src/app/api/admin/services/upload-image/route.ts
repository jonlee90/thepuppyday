/**
 * Admin API - Service Image Upload
 * POST /api/admin/services/upload-image - Upload service image to Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { validateImageFile } from '@/lib/utils/validation';

/**
 * POST /api/admin/services/upload-image
 * Upload a single service image to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid file' },
        { status: 400 }
      );
    }

    try {
      // Generate UUID for file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `services/${fileName}`;

      // Convert File to ArrayBuffer then to Uint8Array for Supabase
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await (supabase as any)
        .storage
        .from('service-images')
        .upload(filePath, uint8Array, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('[Service Image Upload] Storage error:', uploadError);
        return NextResponse.json(
          { error: uploadError.message || 'Upload failed' },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: urlData } = (supabase as any)
        .storage
        .from('service-images')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        return NextResponse.json(
          { error: 'Failed to get public URL' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        url: urlData.publicUrl,
        path: filePath,
      }, { status: 200 });
    } catch (fileError) {
      console.error('[Service Image Upload] Error processing file:', fileError);
      return NextResponse.json(
        { error: fileError instanceof Error ? fileError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Admin API] Error uploading service image:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
