/**
 * Lazy-loaded Heavy Components
 * Task 0226: Implement dynamic imports for heavy components
 *
 * Code-splits large third-party libraries to reduce initial bundle size
 */

'use client';

import dynamic from 'next/dynamic';

/**
 * Loading skeletons for various component types
 */

function ModalSkeleton() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="h-32 bg-gray-100 rounded mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="border border-gray-300 rounded-lg p-4 h-64 bg-gray-50 animate-pulse">
      <div className="h-full flex items-center justify-center text-gray-400">
        Loading editor...
      </div>
    </div>
  );
}

function DatePickerSkeleton() {
  return (
    <div className="w-full">
      <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="w-full h-96 bg-gray-50 border border-gray-300 rounded-lg animate-pulse">
      <div className="p-4 space-y-3">
        <div className="h-8 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Lazy-loaded components
 */

// Rich Text Editor (e.g., TipTap, Draft.js, Quill)
// Typically 100-300KB
export const RichTextEditor = dynamic(
  () => import('./RichTextEditor').then((mod) => mod.RichTextEditor),
  {
    loading: () => <EditorSkeleton />,
    ssr: false, // Editors often use browser-only APIs
  }
);

// Date Picker with advanced features
// react-day-picker or similar is ~50-100KB
export const AdvancedDatePicker = dynamic(
  () => import('./AdvancedDatePicker').then((mod) => mod.AdvancedDatePicker),
  {
    loading: () => <DatePickerSkeleton />,
    ssr: false,
  }
);

// Full Calendar component (for admin appointment management)
// FullCalendar library is 200-400KB
export const FullCalendar = dynamic(
  () => import('./FullCalendar').then((mod) => mod.FullCalendar),
  {
    loading: () => <CalendarSkeleton />,
    ssr: false,
  }
);

// Image Cropper (for profile photos, gallery uploads)
// react-easy-crop or similar is ~100KB
export const ImageCropper = dynamic(
  () => import('./ImageCropper').then((mod) => mod.ImageCropper),
  {
    loading: () => (
      <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-gray-400">Loading image editor...</div>
      </div>
    ),
    ssr: false,
  }
);

// PDF Viewer (for report cards, receipts)
// react-pdf is ~200KB
export const PDFViewer = dynamic(
  () => import('./PDFViewer').then((mod) => mod.PDFViewer),
  {
    loading: () => (
      <div className="w-full h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-gray-400">Loading PDF...</div>
      </div>
    ),
    ssr: false,
  }
);

// Color Picker (for customization features)
// react-colorful is ~5KB but good example
export const ColorPicker = dynamic(
  () => import('./ColorPicker').then((mod) => mod.ColorPicker),
  {
    loading: () => (
      <div className="w-16 h-16 bg-gray-200 rounded animate-pulse"></div>
    ),
    ssr: false,
  }
);

// Markdown Editor (for notification templates, content management)
export const MarkdownEditor = dynamic(
  () => import('./MarkdownEditor').then((mod) => mod.MarkdownEditor),
  {
    loading: () => <EditorSkeleton />,
    ssr: false,
  }
);

// Data Table with advanced features (sorting, filtering, pagination)
// TanStack Table + virtualization can be heavy
export const AdvancedDataTable = dynamic(
  () => import('./AdvancedDataTable').then((mod) => mod.AdvancedDataTable),
  {
    loading: () => (
      <div className="w-full h-64 border border-gray-300 rounded-lg bg-gray-50 animate-pulse">
        <div className="p-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    ),
    ssr: false,
  }
);

// QR Code Generator (for check-in systems, loyalty cards)
export const QRCodeGenerator = dynamic(
  () => import('./QRCodeGenerator').then((mod) => mod.QRCodeGenerator),
  {
    loading: () => (
      <div className="w-48 h-48 bg-gray-200 rounded animate-pulse flex items-center justify-center">
        <div className="text-gray-400">Generating QR...</div>
      </div>
    ),
    ssr: false,
  }
);

/**
 * Defer Stripe.js loading until checkout
 * Task 0226: Defer Stripe.js loading until checkout step
 */
export const StripePaymentForm = dynamic(
  () => import('../payment/StripePaymentForm').then((mod) => mod.StripePaymentForm),
  {
    loading: () => (
      <div className="w-full p-6 bg-gray-50 border border-gray-300 rounded-lg animate-pulse">
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    ),
    ssr: false,
  }
);
