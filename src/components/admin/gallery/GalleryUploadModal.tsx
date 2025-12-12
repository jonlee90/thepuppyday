'use client';

/**
 * GalleryUploadModal Component
 * Multi-file upload modal for gallery images
 */

import { useState, useRef, DragEvent } from 'react';
import { X, Upload, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { validateImageFile } from '@/lib/utils/validation';

interface GalleryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FileWithPreview {
  file: File;
  preview: string;
  error?: string;
}

export function GalleryUploadModal({ isOpen, onClose, onSuccess }: GalleryUploadModalProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileWithPreview[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const validation = validateImageFile(file);

      if (!validation.valid) {
        newFiles.push({
          file,
          preview: '',
          error: validation.error,
        });
        return;
      }

      // Create preview URL
      const preview = URL.createObjectURL(file);

      newFiles.push({
        file,
        preview,
        error: undefined,
      });
    });

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      // Revoke preview URL
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleUpload = async () => {
    const validFiles = files.filter((f) => !f.error);

    if (validFiles.length === 0) {
      setUploadError('No valid files to upload');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadProgress(`Uploading ${validFiles.length} file(s)...`);

    try {
      const formData = new FormData();
      validFiles.forEach((f) => {
        formData.append('files', f.file);
      });

      const response = await fetch('/api/admin/gallery/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadProgress(
        `Successfully uploaded ${data.success} file(s)${
          data.failed > 0 ? `, ${data.failed} failed` : ''
        }`
      );

      // Clean up preview URLs
      files.forEach((f) => {
        if (f.preview) {
          URL.revokeObjectURL(f.preview);
        }
      });

      // Wait a moment to show success message
      setTimeout(() => {
        setFiles([]);
        setUploadProgress('');
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      setUploadProgress('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Clean up preview URLs
    files.forEach((f) => {
      if (f.preview) {
        URL.revokeObjectURL(f.preview);
      }
    });
    setFiles([]);
    setUploadError('');
    setUploadProgress('');
    onClose();
  };

  const validFilesCount = files.filter((f) => !f.error).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#434E54]">Upload Gallery Photos</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isUploading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Dropzone */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${
                isDragging
                  ? 'border-[#434E54] bg-[#F8EEE5]'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
          >
            <Upload
              className={`w-12 h-12 mx-auto mb-4 ${
                isDragging ? 'text-[#434E54]' : 'text-gray-400'
              }`}
            />
            <p className="text-[#434E54] font-medium mb-2">
              Drop images here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports JPEG, PNG, WebP up to 10MB per file
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>

          {/* File Previews */}
          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-[#434E54] mb-3">
                Selected Files ({validFilesCount} valid)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {files.map((fileItem, index) => (
                  <div
                    key={index}
                    className={`
                      relative bg-gray-50 rounded-lg overflow-hidden
                      ${fileItem.error ? 'border-2 border-red-300' : ''}
                    `}
                  >
                    {fileItem.preview ? (
                      <img
                        src={fileItem.preview}
                        alt={fileItem.file.name}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center bg-gray-200">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}

                    {/* File name and error */}
                    <div className="p-2">
                      <p className="text-xs text-gray-600 truncate">
                        {fileItem.file.name}
                      </p>
                      {fileItem.error && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fileItem.error}
                        </p>
                      )}
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                      disabled={isUploading}
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-800">{uploadProgress}</p>
            </div>
          )}

          {/* Upload Error */}
          {uploadError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">{uploadError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-[#434E54] font-medium rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={validFilesCount === 0 || isUploading}
            className="
              px-6 py-2 bg-[#434E54] text-white font-medium rounded-lg
              hover:bg-[#363F44] transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isUploading ? 'Uploading...' : `Upload ${validFilesCount} Photo${validFilesCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
