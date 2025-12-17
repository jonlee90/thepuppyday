# Gallery Management Quick Reference

## API Endpoints Cheat Sheet

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/admin/gallery?filter={filter}` | List gallery images | Admin |
| POST | `/api/admin/gallery` | Create gallery entry (report card) | Admin |
| POST | `/api/admin/gallery/upload` | Upload multiple files | Admin |
| GET | `/api/admin/gallery/[id]` | Get single image | Admin |
| PATCH | `/api/admin/gallery/[id]` | Update image metadata | Admin |
| DELETE | `/api/admin/gallery/[id]` | Delete image | Admin |
| GET | `/api/admin/breeds` | List breeds for dropdown | Admin |

## Component Import Paths

```typescript
// Main Grid
import { GalleryGrid } from '@/components/admin/gallery/GalleryGrid';

// Upload Modal
import { GalleryUploadModal } from '@/components/admin/gallery/GalleryUploadModal';

// Edit Modal
import { GalleryImageEditModal } from '@/components/admin/gallery/GalleryImageEditModal';

// Report Card Integration
import { ReportCardAddToGallery } from '@/components/admin/gallery/ReportCardAddToGallery';
```

## Validation Functions

```typescript
import {
  validateImageFile,    // File type & size validation
  validatePetName,      // Pet name (max 100 chars)
  validateCaption,      // Caption (max 200 chars)
  validateTags,         // Tags array (max 10, 50 chars each)
  isValidImageUrl,      // URL protocol validation
  sanitizeText,         // Remove HTML tags
  isValidUUID,          // UUID format validation
} from '@/lib/utils/validation';
```

## Database Schema Quick Reference

```typescript
interface GalleryImage {
  id: string;                    // UUID
  created_at: string;            // ISO timestamp
  image_url: string;             // Full URL to image
  dog_name: string | null;       // Pet name (UI: "Pet Name")
  breed: string | null;          // Breed ID (UUID)
  caption: string | null;        // Max 200 chars
  tags: string[];                // JSONB array
  category: GalleryCategory;     // 'before_after' | 'regular' | 'featured'
  is_before_after: boolean;
  before_image_url: string | null;
  display_order: number;         // For drag-drop ordering
  is_published: boolean;         // Public visibility
}
```

## Common Request/Response Examples

### Upload Images
```typescript
// Request
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);

// Response
{
  images: [...],      // Successfully uploaded images
  errors: [...],      // Failed uploads (if any)
  success: 2,         // Count
  failed: 0           // Count
}
```

### Update Image
```typescript
// Request
PATCH /api/admin/gallery/[id]
{
  dog_name: "Buddy",
  breed_id: "uuid-123",
  caption: "Fresh cut!",
  tags: ["grooming", "summer"],
  is_published: true
}

// Response
{
  image: { /* updated gallery image */ }
}
```

### Filter Images
```typescript
// All images
GET /api/admin/gallery?filter=all

// Published only
GET /api/admin/gallery?filter=published

// Unpublished only
GET /api/admin/gallery?filter=unpublished
```

## File Upload Constraints

| Constraint | Value |
|------------|-------|
| Max File Size | 10MB per file |
| Allowed Types | JPEG, PNG, WebP |
| Storage Bucket | `gallery-images` |
| Filename Format | UUID + extension |
| Multiple Upload | Yes (unlimited) |

## UI Element Quick Reference

### Status Badges
```tsx
// Unpublished badge (yellow)
<div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
  Unpublished
</div>

// Published indicator (implicit - no badge)
```

### Button Styles
```tsx
// Primary button (charcoal)
className="bg-[#434E54] text-white hover:bg-[#363F44]"

// Secondary button (outlined)
className="border border-gray-200 text-[#434E54] hover:bg-gray-50"

// Delete button (red)
className="text-red-600 hover:bg-red-50"
```

## Color Palette

| Element | Color | Hex Code |
|---------|-------|----------|
| Primary/Buttons | Charcoal | #434E54 |
| Primary Hover | Darker Charcoal | #363F44 |
| Secondary | Lighter Cream | #EAE0D5 |
| Background | Warm Cream | #F8EEE5 |
| Cards | White | #FFFFFF |
| Text Primary | Charcoal | #434E54 |
| Text Secondary | Gray | #6B7280 |

## Drag-Drop Implementation

```typescript
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core';

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

// Use with GalleryGrid component (already implemented)
```

## Common Tags

| Tag | Purpose |
|-----|---------|
| `report-card` | Added from report cards |
| `before-after` | Transformation photos |
| `grooming` | Grooming service photos |
| `daycare` | Daycare photos |
| Breed names | `goldendoodle`, `poodle`, etc. |
| Seasonal | `summer-2025`, `holiday-2024` |

## Error Codes

| Status | Meaning | Common Cause |
|--------|---------|--------------|
| 400 | Bad Request | Validation failure |
| 401 | Unauthorized | Not logged in / not admin |
| 404 | Not Found | Image/breed doesn't exist |
| 409 | Conflict | Cannot delete (has dependencies) |
| 500 | Server Error | Database/storage failure |

## Security Checklist

- ✅ UUID validation on all ID parameters
- ✅ Input sanitization (remove HTML tags)
- ✅ Image URL protocol validation (HTTP/HTTPS only)
- ✅ File type whitelist (JPEG, PNG, WebP)
- ✅ File size limit (10MB)
- ✅ Admin authentication required
- ✅ CSRF protection (Next.js built-in)
- ✅ XSS prevention (sanitizeText)

## Performance Tips

1. **Optimize Images**: Compress before upload (use JPEG for photos)
2. **Lazy Loading**: Images load on scroll (handled by browser)
3. **Pagination**: Consider for large galleries (future enhancement)
4. **CDN**: Supabase Storage provides CDN (automatic)
5. **Caching**: API responses cached by Next.js (automatic)

## Accessibility Features

- ✅ Keyboard navigation (drag-drop)
- ✅ Alt text on images
- ✅ Focus states on interactive elements
- ✅ Semantic HTML
- ✅ ARIA labels where needed
- ✅ Color contrast meets WCAG AA

## Mobile Responsiveness

| Breakpoint | Grid Columns | Sidebar |
|------------|--------------|---------|
| Mobile (<768px) | 2 columns | Hidden |
| Tablet (768-1024px) | 3 columns | Hidden |
| Desktop (>1024px) | 4 columns | Visible |

## Testing Checklist

### Upload Flow
- [ ] Single file upload works
- [ ] Multiple file upload works
- [ ] Invalid file type rejected
- [ ] Oversized file rejected
- [ ] Preview displays correctly
- [ ] Progress indicator shows
- [ ] Success message displays
- [ ] Grid refreshes after upload

### Edit Flow
- [ ] Modal opens on click
- [ ] Image preview loads
- [ ] Form pre-fills correctly
- [ ] Breed dropdown populates
- [ ] Caption counter works
- [ ] Tags parse correctly
- [ ] Save updates database
- [ ] Success message shows
- [ ] Grid refreshes after save

### Delete Flow
- [ ] Delete button shows
- [ ] Confirmation dialog appears
- [ ] Cancel works
- [ ] Confirm deletes image
- [ ] Storage file removed
- [ ] Grid refreshes after delete

### Reorder Flow
- [ ] Drag initiates
- [ ] Drop completes
- [ ] UI updates immediately
- [ ] Server persists order
- [ ] Error reverts to server state

### Filter Flow
- [ ] All tab works
- [ ] Published tab works
- [ ] Unpublished tab works
- [ ] Grid updates on filter change

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Upload fails | Check file size/type, check Storage bucket exists |
| Images don't appear | Check filter tab, verify is_published status |
| Drag-drop broken | Desktop only, check @dnd-kit packages installed |
| Delete fails | Check if image URL is valid, check Storage permissions |
| Breed dropdown empty | Run breeds seed script, check API endpoint |
| Modal won't close | Check state management, ensure onClose is called |

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Test
npm run test
```

## File Locations

```
src/
├── app/
│   ├── (admin)/
│   │   └── gallery/
│   │       └── page.tsx                    # Gallery page
│   └── api/
│       └── admin/
│           ├── gallery/
│           │   ├── route.ts                # GET/POST gallery
│           │   ├── upload/
│           │   │   └── route.ts            # POST upload
│           │   └── [id]/
│           │       └── route.ts            # GET/PATCH/DELETE
│           └── breeds/
│               └── route.ts                # GET breeds
│
├── components/
│   └── admin/
│       └── gallery/
│           ├── GalleryGrid.tsx             # Main grid component
│           ├── GalleryUploadModal.tsx      # Upload modal
│           ├── GalleryImageEditModal.tsx   # Edit modal
│           └── ReportCardAddToGallery.tsx  # Report card button
│
├── lib/
│   └── utils/
│       └── validation.ts                   # Validation functions
│
└── types/
    └── database.ts                         # GalleryImage type
```

## Next Steps (Future Enhancements)

1. Add source_type and source_id columns for better report card tracking
2. Implement search functionality
3. Add bulk actions (publish/delete multiple)
4. Create public gallery page for customers
5. Add image cropping/editing tools
6. Implement category-based filtering
7. Add analytics (view counts, popular images)
8. Create gallery widget for marketing site
