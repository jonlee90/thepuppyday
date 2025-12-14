'use client';

/**
 * PhotoUploadSection Component
 * Section containing before and after photo uploads for report cards
 */

import { PhotoUpload } from './PhotoUpload';

interface PhotoUploadSectionProps {
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  onBeforePhotoChange: (url: string) => void;
  onAfterPhotoChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
}

export function PhotoUploadSection({
  beforePhotoUrl,
  afterPhotoUrl,
  onBeforePhotoChange,
  onAfterPhotoChange,
  onUpload,
}: PhotoUploadSectionProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-[#434E54] mb-6">
        Photos
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Before Photo (Optional) */}
        <PhotoUpload
          label="Before Photo"
          required={false}
          value={beforePhotoUrl}
          onChange={onBeforePhotoChange}
          onUpload={onUpload}
        />

        {/* After Photo (Required) */}
        <PhotoUpload
          label="After Photo"
          required={true}
          value={afterPhotoUrl}
          onChange={onAfterPhotoChange}
          onUpload={onUpload}
        />
      </div>

      <p className="text-sm text-gray-500 mt-4">
        Photos will be compressed automatically to ensure fast loading. After photo is required.
      </p>
    </div>
  );
}
