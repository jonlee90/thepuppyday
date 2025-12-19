/**
 * Admin API - Banner Image Upload
 * Task 0172: Banner image upload
 *
 * POST /api/admin/settings/banners/upload - Upload banner image to Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import sharp from 'sharp';

// Banner image requirements
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const RECOMMENDED_WIDTH = 1200;
const RECOMMENDED_HEIGHT = 300;
const BUCKET_NAME = 'banner-images';

/**
 * Validate banner image file
 */
async function validateBannerImage(
  file: File
): Promise<{ valid: boolean; error?: string; width?: number; height?: number }> {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File must be JPEG, PNG, WebP, or GIF',
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size must be under 2MB (current: ${sizeMB}MB)`,
    };
  }

  // Check image dimensions using sharp
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const metadata = await sharp(buffer).metadata();

    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // Note: We don't enforce minimum dimensions, just return them for info
    // Recommended dimensions are 1200x300px but we allow flexibility
    return {
      valid: true,
      width,
      height,
    };
  } catch (error) {
    console.error('[Banner Image Upload] Error reading image metadata:', error);
    return {
      valid: false,
      error: 'Failed to read image metadata. Please ensure the file is a valid image.',
    };
  }
}

/**
 * Ensure banner-images bucket exists
 * Creates bucket with public access if it doesn't exist
 */
async function ensureBucketExists(supabase: any): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('[Banner Image Upload] Error listing buckets:', listError);
      return { success: false, error: 'Failed to check storage buckets' };
    }

    const bucketExists = buckets?.some((bucket: any) => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
      console.log('[Banner Image Upload] Creating banner-images bucket');
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_TYPES,
      });

      if (createError) {
        console.error('[Banner Image Upload] Error creating bucket:', createError);
        return { success: false, error: 'Failed to create storage bucket' };
      }

      console.log('[Banner Image Upload] Bucket created successfully');
    }

    return { success: true };
  } catch (error) {
    console.error('[Banner Image Upload] Error ensuring bucket exists:', error);
    return { success: false, error: 'Failed to initialize storage' };
  }
}

/**
 * POST /api/admin/settings/banners/upload
 * Upload banner image to Supabase Storage
 *
 * Form data:
 * - file: Image file (jpeg, png, webp, gif)
 *
 * Returns:
 * {
 *   url: string;          // Public URL of uploaded image
 *   width: number;        // Image width in pixels
 *   height: number;       // Image height in pixels
 *   is_recommended_size: boolean; // Whether image matches recommended 1200x300
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Banner Image Upload] Starting upload process');

    // Use regular client for auth check
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);
    console.log('[Banner Image Upload] Admin authentication successful');

    // Use service role client for storage operations (bypasses RLS)
    const serviceSupabase = createServiceRoleClient();
    console.log('[Banner Image Upload] Service role client created');

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(
      `[Banner Image Upload] Received file: ${file.name}, size: ${file.size}, type: ${file.type}`
    );

    // Validate file
    const validation = await validateBannerImage(file);
    if (!validation.valid) {
      console.log('[Banner Image Upload] Validation failed:', validation.error);
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    console.log(
      `[Banner Image Upload] Validation passed. Dimensions: ${validation.width}x${validation.height}`
    );

    // Check if dimensions match recommended size
    const isRecommendedSize =
      validation.width === RECOMMENDED_WIDTH && validation.height === RECOMMENDED_HEIGHT;

    if (!isRecommendedSize) {
      console.log(
        `[Banner Image Upload] Image dimensions (${validation.width}x${validation.height}) differ from recommended (${RECOMMENDED_WIDTH}x${RECOMMENDED_HEIGHT})`
      );
    }

    // Ensure bucket exists
    const bucketCheck = await ensureBucketExists(serviceSupabase);
    if (!bucketCheck.success) {
      return NextResponse.json(
        { error: bucketCheck.error || 'Storage initialization failed' },
        { status: 500 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = fileName;

    console.log(`[Banner Image Upload] Uploading to bucket '${BUCKET_NAME}' with path: ${filePath}`);

    // Convert File to ArrayBuffer then to Uint8Array for Supabase
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: uploadData, error: uploadError } = await (serviceSupabase as any).storage
      .from(BUCKET_NAME)
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[Banner Image Upload] Storage error:', uploadError);
      return NextResponse.json(
        { error: uploadError.message || 'Upload failed' },
        { status: 500 }
      );
    }

    console.log(`[Banner Image Upload] Upload successful: ${uploadData.path}`);

    // Get public URL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: urlData } = (serviceSupabase as any).storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      console.error('[Banner Image Upload] Failed to get public URL');
      return NextResponse.json({ error: 'Failed to get public URL' }, { status: 500 });
    }

    console.log(`[Banner Image Upload] Got public URL: ${urlData.publicUrl}`);

    // Return success response
    return NextResponse.json(
      {
        url: urlData.publicUrl,
        width: validation.width,
        height: validation.height,
        is_recommended_size: isRecommendedSize,
        recommended_dimensions: {
          width: RECOMMENDED_WIDTH,
          height: RECOMMENDED_HEIGHT,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Banner Image Upload] Error uploading banner image:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
