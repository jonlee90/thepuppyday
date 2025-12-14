# Gallery Management System Architecture

## Component Hierarchy

```
/admin/gallery (page.tsx)
└── GalleryGrid.tsx
    ├── GalleryUploadModal.tsx
    ├── GalleryImageEditModal.tsx
    └── SortableImageCard (internal)
        └── Image with metadata display

ReportCardAddToGallery.tsx (standalone component)
└── Embedded in report card views
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Gallery Management                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│   Upload     │    │     Edit     │    │    Reorder      │
│   Photos     │    │    Photo     │    │    Photos       │
└──────────────┘    └──────────────┘    └──────────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│   Upload     │    │   Edit       │    │   Drag-Drop     │
│   Modal      │    │   Modal      │    │   Handler       │
└──────────────┘    └──────────────┘    └──────────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────────────────────────────────────────────────────┐
│                       API Layer                              │
├──────────────────────────────────────────────────────────────┤
│ POST /api/admin/gallery/upload                              │
│ GET /api/admin/gallery?filter=                              │
│ GET /api/admin/gallery/[id]                                 │
│ PATCH /api/admin/gallery/[id]                               │
│ DELETE /api/admin/gallery/[id]                              │
│ GET /api/admin/breeds                                       │
└──────────────────────────────────────────────────────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
├──────────────────────────────────────────────────────────────┤
│ Supabase PostgreSQL                                         │
│  - gallery_images table                                     │
│  - breeds table                                             │
│                                                             │
│ Supabase Storage                                            │
│  - gallery-images bucket                                    │
└──────────────────────────────────────────────────────────────┘
```

## Report Card Integration Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Report Card View (Admin)                        │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Report Card Photo                               │      │
│  │  ┌──────────────────────────────────────┐        │      │
│  │  │                                      │        │      │
│  │  │        [Before Photo]                │        │      │
│  │  │                                      │        │      │
│  │  └──────────────────────────────────────┘        │      │
│  │                                                  │      │
│  │  [Add to Gallery] ← ReportCardAddToGallery     │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ onClick
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         POST /api/admin/gallery                             │
│                                                             │
│  {                                                          │
│    image_url: reportCard.before_photo_url,                 │
│    dog_name: appointment.pet.name,                         │
│    breed_id: appointment.pet.breed_id,                     │
│    tags: ["report-card", "before-after"],                  │
│    is_published: false                                     │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         gallery_images table                                │
│                                                             │
│  - No file upload (uses existing URL)                      │
│  - Pre-filled metadata from appointment                    │
│  - Tagged as "report-card"                                 │
│  - Unpublished by default                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         Gallery Grid (appears in admin gallery)             │
└─────────────────────────────────────────────────────────────┘
```

## Upload Flow Detail

```
┌─────────────────────────────────────────────────────────────┐
│  User Action: Click "Add Photos" button                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  GalleryUploadModal Opens                                   │
│                                                             │
│  1. User drags/selects files                               │
│  2. Client-side validation (type, size)                    │
│  3. Preview generation                                     │
│  4. Display valid/invalid files                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ Click "Upload X Photos"
┌─────────────────────────────────────────────────────────────┐
│  Upload Process (for each valid file)                       │
│                                                             │
│  1. Generate UUID filename                                 │
│  2. Convert File → ArrayBuffer → Uint8Array                │
│  3. Upload to Supabase Storage (gallery-images)            │
│  4. Get public URL                                         │
│  5. Insert to gallery_images table                         │
│  6. Return created image or error                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Response                                                   │
│                                                             │
│  {                                                          │
│    images: [...],           // Successfully uploaded       │
│    errors: [...],           // Failed uploads (if any)     │
│    success: 5,              // Count of successes          │
│    failed: 1                // Count of failures           │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Success Message → Close Modal → Refresh Grid               │
└─────────────────────────────────────────────────────────────┘
```

## Edit Flow Detail

```
┌─────────────────────────────────────────────────────────────┐
│  User Action: Click image card in grid                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  GET /api/admin/gallery/[id]                                │
│                                                             │
│  - Fetch image metadata                                    │
│  - Fetch breed name if breed_id exists                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  GalleryImageEditModal Opens                                │
│                                                             │
│  Left: Full image preview                                  │
│  Right: Edit form (pre-filled)                             │
│    - Pet Name                                              │
│    - Breed (dropdown)                                      │
│    - Caption (textarea with counter)                       │
│    - Tags (comma-separated)                                │
│    - Published (toggle)                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ User edits & clicks "Save"
┌─────────────────────────────────────────────────────────────┐
│  PATCH /api/admin/gallery/[id]                              │
│                                                             │
│  {                                                          │
│    dog_name: "Buddy",                                      │
│    breed_id: "uuid-123",                                   │
│    caption: "Looking fresh!",                              │
│    tags: ["grooming", "goldendoodle"],                     │
│    is_published: true                                      │
│  }                                                          │
│                                                             │
│  - Validate and sanitize inputs                            │
│  - Update gallery_images row                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Success Message → Close Modal → Refresh Grid               │
└─────────────────────────────────────────────────────────────┘
```

## Drag-Drop Reorder Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User Action: Drag image card to new position               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  @dnd-kit DragEndEvent                                      │
│                                                             │
│  - Get old index and new index                             │
│  - Use arrayMove() to reorder locally                      │
│  - Update display_order for all images                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PATCH /api/admin/gallery/[id]                              │
│                                                             │
│  {                                                          │
│    display_order: 5  // New position                       │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Optimistic UI Update (immediate visual feedback)           │
│  Server persists new order                                  │
│  On error: revert to server state                          │
└─────────────────────────────────────────────────────────────┘
```

## Delete Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User Action: Click "Delete" in edit modal                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Confirmation Dialog                                        │
│  "Are you sure? This cannot be undone."                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ Click "Yes, Delete"
┌─────────────────────────────────────────────────────────────┐
│  DELETE /api/admin/gallery/[id]                             │
│                                                             │
│  1. Fetch image to get URL                                 │
│  2. Delete from gallery_images table                       │
│  3. Parse URL to extract file path                         │
│  4. Check if from gallery-images bucket                    │
│  5. If yes: delete from Supabase Storage                   │
│     If no: skip (e.g., report card image)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Close Modal → Refresh Grid → Image removed                 │
└─────────────────────────────────────────────────────────────┘
```

## State Management

```
GalleryGrid Component State:
┌─────────────────────────────────────────────────────────────┐
│  - images: GalleryImageWithBreed[]                          │
│  - isLoading: boolean                                       │
│  - filter: 'all' | 'published' | 'unpublished'             │
│  - showUploadModal: boolean                                │
│  - editImageId: string | null                              │
└─────────────────────────────────────────────────────────────┘

GalleryUploadModal State:
┌─────────────────────────────────────────────────────────────┐
│  - files: FileWithPreview[]                                 │
│  - isDragging: boolean                                      │
│  - isUploading: boolean                                     │
│  - uploadProgress: string                                   │
│  - uploadError: string                                      │
└─────────────────────────────────────────────────────────────┘

GalleryImageEditModal State:
┌─────────────────────────────────────────────────────────────┐
│  - image: GalleryImageWithBreed | null                      │
│  - breeds: Breed[]                                          │
│  - isLoading: boolean                                       │
│  - isSaving: boolean                                        │
│  - isDeleting: boolean                                      │
│  - showDeleteConfirm: boolean                               │
│  - error: string                                            │
│  - successMessage: string                                   │
│  - petName: string                                          │
│  - breedId: string                                          │
│  - caption: string                                          │
│  - tagsInput: string                                        │
│  - isPublished: boolean                                     │
└─────────────────────────────────────────────────────────────┘

ReportCardAddToGallery State:
┌─────────────────────────────────────────────────────────────┐
│  - isAdding: boolean                                        │
│  - success: boolean                                         │
│  - error: string                                            │
└─────────────────────────────────────────────────────────────┘
```

## Validation Pipeline

```
Client-Side Validation:
┌─────────────────────────────────────────────────────────────┐
│  File Upload:                                               │
│  - validateImageFile()                                      │
│    → Check type (JPEG, PNG, WebP)                          │
│    → Check size (max 10MB)                                 │
│                                                             │
│  Form Inputs:                                               │
│  - Caption: max 200 chars                                  │
│  - Tags: comma-separated, parsed to array                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
Server-Side Validation:
┌─────────────────────────────────────────────────────────────┐
│  All API Routes:                                            │
│  - isValidUUID() - Prevent SQL injection                   │
│  - validatePetName() - Sanitize, max 100 chars             │
│  - validateCaption() - Sanitize, max 200 chars             │
│  - validateTags() - Sanitize array, max 10 tags            │
│  - isValidImageUrl() - Prevent XSS via protocol check      │
│  - sanitizeText() - Remove HTML tags                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
Database Layer:
┌─────────────────────────────────────────────────────────────┐
│  - Type enforcement (PostgreSQL schema)                     │
│  - Required fields validation                               │
│  - Foreign key constraints (breed_id)                      │
└─────────────────────────────────────────────────────────────┘
```

## Filtering Logic

```
Filter Tabs:
┌─────────────────────────────────────────────────────────────┐
│  [All] [Published] [Unpublished]                           │
└─────────────────────────────────────────────────────────────┘
        │         │           │
        │         │           │
        ▼         ▼           ▼
    ┌────┐   ┌────────┐  ┌──────────┐
    │All │   │ WHERE  │  │  WHERE   │
    │    │   │is_pub- │  │is_pub-   │
    │    │   │lished  │  │lished    │
    │    │   │= true  │  │= false   │
    └────┘   └────────┘  └──────────┘
        │         │           │
        └─────────┴───────────┘
                  │
                  ▼
        GET /api/admin/gallery?filter={filter}
                  │
                  ▼
        Returns filtered images
```

## Security Flow

```
Request → Admin Auth Middleware → Validation → Business Logic → Response

┌─────────────────────────────────────────────────────────────┐
│  1. Admin Auth (requireAdmin)                               │
│     - Check session                                         │
│     - Verify user role (admin or groomer)                  │
│     - Reject if unauthorized                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. UUID Validation                                         │
│     - Validate all ID parameters                           │
│     - Prevent SQL injection                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Input Sanitization                                      │
│     - Remove HTML tags                                     │
│     - Trim whitespace                                      │
│     - Validate data types                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Business Logic                                          │
│     - Process request                                      │
│     - Database operations                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Response                                                │
│     - Return success or error                              │
│     - Include sanitized data                               │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Strategy

```
Component Level:
┌─────────────────────────────────────────────────────────────┐
│  - Try/catch blocks around API calls                        │
│  - Display inline error messages                           │
│  - Maintain UI state on error                              │
│  - Provide user-friendly error messages                    │
└─────────────────────────────────────────────────────────────┘

API Level:
┌─────────────────────────────────────────────────────────────┐
│  - Validation errors → 400 Bad Request                      │
│  - Not found errors → 404 Not Found                         │
│  - Auth errors → 401 Unauthorized                          │
│  - Server errors → 500 Internal Server Error               │
│  - Log all errors to console                               │
└─────────────────────────────────────────────────────────────┘

Upload Specific:
┌─────────────────────────────────────────────────────────────┐
│  - Per-file error handling                                  │
│  - Continue with successful uploads                         │
│  - Return both successes and failures                       │
│  - Clean up on error (delete uploaded files)               │
└─────────────────────────────────────────────────────────────┘
```
