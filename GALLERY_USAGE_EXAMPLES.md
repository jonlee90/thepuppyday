# Gallery Management Usage Examples

## For Developers

### Example 1: Using ReportCardAddToGallery in Report Card Views

```tsx
import { ReportCardAddToGallery } from '@/components/admin/gallery/ReportCardAddToGallery';

// In your report card component
function ReportCardView({ appointment, reportCard }: Props) {
  return (
    <div className="report-card">
      {/* Before Photo */}
      {reportCard.before_photo_url && (
        <div className="photo-container">
          <img src={reportCard.before_photo_url} alt="Before" />

          {/* Add to Gallery Button */}
          <ReportCardAddToGallery
            imageUrl={reportCard.before_photo_url}
            appointment={appointment}
            isBeforeAfter={true}
            onSuccess={() => console.log('Added to gallery!')}
          />
        </div>
      )}

      {/* After Photo */}
      {reportCard.after_photo_url && (
        <div className="photo-container">
          <img src={reportCard.after_photo_url} alt="After" />

          <ReportCardAddToGallery
            imageUrl={reportCard.after_photo_url}
            appointment={appointment}
            isBeforeAfter={true}
            onSuccess={() => console.log('Added to gallery!')}
          />
        </div>
      )}
    </div>
  );
}
```

### Example 2: Fetching Gallery Images with Filter

```typescript
// Fetch all images
const response = await fetch('/api/admin/gallery?filter=all');
const data = await response.json();
console.log(data.images); // Array of all gallery images

// Fetch only published images
const response = await fetch('/api/admin/gallery?filter=published');
const data = await response.json();
console.log(data.images); // Array of published images only

// Fetch only unpublished images
const response = await fetch('/api/admin/gallery?filter=unpublished');
const data = await response.json();
console.log(data.images); // Array of unpublished images only
```

### Example 3: Uploading Images Programmatically

```typescript
async function uploadImagesToGallery(files: File[]) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch('/api/admin/gallery/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  console.log(`Uploaded ${data.success} images`);
  console.log(`Failed ${data.failed} images`);

  if (data.errors && data.errors.length > 0) {
    console.error('Upload errors:', data.errors);
  }

  return data.images; // Array of successfully uploaded images
}
```

### Example 4: Updating Image Metadata

```typescript
async function updateGalleryImage(imageId: string) {
  const response = await fetch(`/api/admin/gallery/${imageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dog_name: 'Max',
      breed_id: 'breed-uuid-123',
      caption: 'Looking fresh after grooming!',
      tags: ['grooming', 'goldendoodle', 'summer-2025'],
      is_published: true,
    }),
  });

  const data = await response.json();
  console.log('Updated image:', data.image);
}
```

### Example 5: Quick Publish/Unpublish Toggle

```typescript
async function togglePublishStatus(imageId: string, currentStatus: boolean) {
  const response = await fetch(`/api/admin/gallery/${imageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      is_published: !currentStatus,
    }),
  });

  const data = await response.json();
  console.log('Toggled publish status:', data.image.is_published);
}
```

### Example 6: Reordering Images

```typescript
async function moveImageToPosition(imageId: string, newPosition: number) {
  const response = await fetch(`/api/admin/gallery/${imageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      display_order: newPosition,
    }),
  });

  const data = await response.json();
  console.log('Updated display order:', data.image.display_order);
}
```

### Example 7: Deleting an Image

```typescript
async function deleteGalleryImage(imageId: string) {
  const confirmed = confirm('Are you sure? This cannot be undone.');

  if (!confirmed) {
    return;
  }

  const response = await fetch(`/api/admin/gallery/${imageId}`, {
    method: 'DELETE',
  });

  if (response.ok) {
    console.log('Image deleted successfully');
  } else {
    const data = await response.json();
    console.error('Delete failed:', data.error);
  }
}
```

### Example 8: Adding Report Card Image to Gallery

```typescript
async function addReportCardToGallery(appointment: Appointment, imageUrl: string) {
  const response = await fetch('/api/admin/gallery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      dog_name: appointment.pet?.name || null,
      breed_id: appointment.pet?.breed_id || null,
      caption: null,
      tags: ['report-card'],
      category: 'regular',
      is_before_after: false,
      before_image_url: null,
      is_published: false,
    }),
  });

  const data = await response.json();
  console.log('Added to gallery:', data.image);
}
```

## For End Users (Admin Panel)

### Scenario 1: Uploading New Gallery Photos

**Steps:**
1. Log in to admin panel
2. Navigate to **Configuration** → **Gallery**
3. Click **"Add Photos"** button
4. Either:
   - Click the dropzone to browse files, OR
   - Drag and drop images directly onto the dropzone
5. Review the previews (valid files show thumbnails, invalid files show errors)
6. Remove any unwanted files by clicking the X button
7. Click **"Upload X Photos"** button
8. Wait for upload to complete
9. See success message showing how many files uploaded
10. Photos appear in the grid (unpublished by default)

**Tips:**
- Maximum 10MB per file
- Supported formats: JPEG, PNG, WebP
- Can upload multiple files at once
- Invalid files are shown with red border and error message
- Can remove individual files before uploading

### Scenario 2: Editing Photo Details

**Steps:**
1. Navigate to **Gallery** page
2. Click on any photo card in the grid
3. Edit modal opens showing:
   - Full size preview (left)
   - Edit form (right)
4. Fill in details:
   - **Pet Name**: Enter the dog's name (optional)
   - **Breed**: Select from dropdown (optional)
   - **Caption**: Write a description (max 200 characters)
   - **Tags**: Enter comma-separated tags (e.g., "grooming, summer, golden-doodle")
   - **Published**: Check to make visible on public gallery
5. Click **"Save Changes"**
6. See success message
7. Modal closes automatically
8. Grid refreshes with updated info

**Tips:**
- Caption has a live character counter
- Tags are automatically trimmed and cleaned
- Photos default to unpublished for moderation
- Can leave all fields blank if desired

### Scenario 3: Publishing Photos to Public Gallery

**Steps:**
1. Navigate to **Gallery** page
2. Click **"Unpublished"** tab to filter
3. Click a photo to edit
4. Check the **"Published"** checkbox
5. Click **"Save Changes"**
6. Photo is now visible on public gallery
7. Photo moves to "Published" filter

**Tips:**
- Always review photo details before publishing
- Unpublished photos won't appear on customer-facing site
- Can unpublish at any time by unchecking the box

### Scenario 4: Reordering Gallery Photos

**Steps:**
1. Navigate to **Gallery** page
2. Select desired filter (All, Published, or Unpublished)
3. Click and drag any photo card
4. Drop it in the desired position
5. Order updates automatically
6. New order is saved to database

**Tips:**
- Drag-drop works on desktop only
- Order determines how photos appear on public gallery
- Can reorder within any filter view
- Changes save immediately

### Scenario 5: Deleting Unwanted Photos

**Steps:**
1. Navigate to **Gallery** page
2. Click the photo you want to delete
3. Edit modal opens
4. Click **"Delete"** button (red, bottom-left)
5. Confirm deletion in dialog: **"Are you sure? This cannot be undone."**
6. Click **"Yes, Delete"**
7. Photo is removed from database and storage
8. Modal closes
9. Grid refreshes

**Warning:**
- Deletion is permanent and cannot be undone
- Photo is removed from both database and file storage
- If photo was added from a report card, the original report card photo is NOT deleted

### Scenario 6: Adding Report Card Photos to Gallery

**Steps:**
1. Navigate to an appointment with a report card
2. View the report card
3. Find the before/after photos
4. Click **"Add to Gallery"** button below the photo
5. See success message: "Added to Gallery"
6. Photo is added to gallery with auto-filled details:
   - Pet name from appointment
   - Breed from pet profile
   - Tagged as "report-card"
   - Set to unpublished
7. Navigate to **Gallery** page to edit/publish

**Tips:**
- Can add both before and after photos
- Photos are tagged automatically for easy filtering
- Original report card photos are never deleted from gallery actions
- Added photos appear in "Unpublished" tab

### Scenario 7: Filtering Gallery Views

**Steps:**
1. Navigate to **Gallery** page
2. Click filter tabs at top:
   - **All**: See all photos
   - **Published**: See only public photos
   - **Unpublished**: See only private photos
3. Grid updates to show filtered results
4. Can drag-reorder within any filter view

**Tips:**
- Filter selection persists while on page
- Useful for bulk moderation of unpublished photos
- Published filter shows what customers see

### Scenario 8: Finding Photos by Tags

**Steps:**
1. Navigate to **Gallery** page
2. Click a photo to view details
3. Check the "Tags" field to see what tags are applied
4. Photos with common tags can be identified visually
5. Use tags like:
   - "report-card" - Added from report cards
   - "before-after" - Transformation photos
   - Breed names - "goldendoodle", "poodle"
   - Seasonal - "summer-2025", "holiday"
   - Service type - "grooming", "daycare"

**Tips:**
- Tags are searchable (future feature)
- Use consistent tag names
- Can add multiple tags separated by commas
- Tags help organize large galleries

## Common Workflows

### Workflow 1: Weekly Gallery Update

1. **Filter unpublished photos** → Click "Unpublished" tab
2. **Review each photo** → Click to edit
3. **Add details** → Pet name, breed, caption, tags
4. **Publish best photos** → Check "Published" checkbox
5. **Delete unwanted photos** → Use delete button
6. **Reorder published photos** → Drag-drop to arrange
7. **Result**: Fresh, curated public gallery

### Workflow 2: Post-Appointment Gallery Addition

1. **Complete appointment** → Create report card
2. **Add report card photos** → Click "Add to Gallery" on best shots
3. **Navigate to Gallery** → Go to gallery page
4. **Click "Unpublished" tab** → Find recently added photos
5. **Edit details** → Add caption, verify pet info
6. **Publish** → Make visible to public
7. **Result**: Showcase recent work to potential customers

### Workflow 3: Seasonal Gallery Cleanup

1. **Review all photos** → Click "All" tab
2. **Check dates/relevance** → Look for outdated content
3. **Unpublish outdated photos** → Uncheck "Published"
4. **Delete very old photos** → Use delete button
5. **Upload new seasonal photos** → Click "Add Photos"
6. **Tag appropriately** → "summer-2025", "holiday-2024"
7. **Reorder** → Put seasonal photos first
8. **Result**: Gallery stays fresh and relevant

## Troubleshooting

### Issue: Upload fails with "File too large"
**Solution:**
- Check file size (max 10MB per file)
- Compress images before uploading
- Use JPEG for photos (smaller than PNG)

### Issue: Upload fails with "Invalid file type"
**Solution:**
- Only JPEG, PNG, WebP are supported
- Check file extension
- Don't upload GIF, BMP, or other formats

### Issue: Can't see uploaded photos
**Solution:**
- Photos default to unpublished
- Click "Unpublished" tab to see them
- Check "Published" box to make visible

### Issue: Drag-drop reordering not working
**Solution:**
- Ensure using desktop browser (not mobile)
- Try refreshing the page
- Check that JavaScript is enabled

### Issue: Deleted photo still appears in report card
**Solution:**
- This is correct behavior
- Gallery deletion doesn't affect report cards
- Report card photos are separate from gallery

### Issue: Can't find a specific photo
**Solution:**
- Use filter tabs (All/Published/Unpublished)
- Check tags in edit modal
- Photos added from report cards are tagged "report-card"

## Best Practices

### Photo Quality
- Use high-quality, well-lit photos
- Show clear before/after transformations
- Feature happy, well-groomed dogs
- Avoid blurry or dark images

### Metadata
- Always add pet name and breed
- Write descriptive, friendly captions
- Use consistent tagging system
- Tag report card photos appropriately

### Publishing
- Review all details before publishing
- Only publish best-quality photos
- Keep gallery focused and curated
- Update regularly with fresh content

### Organization
- Use display_order to highlight best work
- Group similar photos with tags
- Unpublish outdated seasonal content
- Delete poor-quality uploads promptly

### Privacy
- Get owner permission for identifiable pets
- Don't publish photos with sensitive info
- Respect customer preferences
- Default to unpublished for moderation
