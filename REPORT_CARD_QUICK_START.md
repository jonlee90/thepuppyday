# Report Card Form - Quick Start Guide

## Access the Form

Navigate to: `/admin/appointments/[appointment-id]/report-card`

Example: `http://localhost:3000/admin/appointments/abc123/report-card`

---

## Form Sections

### 1. Photos
- **Before Photo**: Optional
- **After Photo**: Required ✅
- Drag-drop or click to upload
- Auto-compressed to 1200px max width
- Stored in Supabase Storage bucket: `report-card-photos`

### 2. Assessment
Choose at least one (required for submission):
- **Mood**: Happy, Nervous, Calm, Energetic
- **Coat Condition**: Excellent, Good, Matted, Needs Attention
- **Behavior**: Great, Some Difficulty, Required Extra Care

### 3. Health Observations
Optional checkboxes:
- Skin Irritation
- **Ear Infection Signs** (critical)
- Fleas/Ticks
- **Lumps** (critical)
- Overgrown Nails
- Dental Issues

Critical issues show red warning banner and suggest using "Don't Send"

### 4. Groomer Notes
- Optional text area
- 500 character limit
- Character counter changes color near limit

### 5. Don't Send Toggle
- Prevents automatic email delivery
- Use for sensitive observations

---

## Auto-Save

- Saves every 5 seconds automatically
- LocalStorage fallback for offline
- Shows "Saving..." / "Saved X minutes ago" indicator

---

## Submission

### Save Draft
- Stores as draft (`is_draft=true`)
- Can continue editing later

### Submit Report Card
- Final submission (`is_draft=false`)
- Validates:
  - After photo required
  - At least one assessment field
- Editable for 24 hours

---

## File Structure

```
src/
├── app/
│   ├── admin/appointments/[id]/report-card/
│   │   └── page.tsx                          # Main page
│   └── api/admin/report-cards/
│       ├── route.ts                           # CRUD endpoints
│       └── upload/route.ts                    # Photo upload
├── components/admin/report-cards/
│   ├── AssessmentSection.tsx                  # Container for all selectors
│   ├── BehaviorSelector.tsx                   # 3 behavior options
│   ├── CoatConditionSelector.tsx              # 4 coat conditions
│   ├── DontSendToggle.tsx                     # Toggle component
│   ├── GroomerNotesSection.tsx                # Notes + toggle
│   ├── HealthObservationsSection.tsx          # 6 checkboxes
│   ├── MoodSelector.tsx                       # 4 mood options
│   ├── PhotoUpload.tsx                        # Single photo upload
│   ├── PhotoUploadSection.tsx                 # Before/After container
│   ├── ReportCardForm.tsx                     # Main form orchestrator
│   └── SubmitActions.tsx                      # Save/Submit buttons
├── hooks/admin/
│   └── use-report-card-form.ts                # Form state + auto-save
└── lib/
    ├── admin/report-card-validation.ts        # Validation logic
    └── utils/image-compression.ts             # Image compression
```

---

## API Endpoints

### GET `/api/admin/report-cards?appointment_id={id}`
Fetch existing report card

### POST `/api/admin/report-cards`
Create or update report card
```json
{
  "formState": { ... },
  "isDraft": true/false
}
```

### POST `/api/admin/report-cards/upload`
Upload photo (FormData with `file` field)

---

## Database Setup Required

### Supabase Storage Bucket
Create bucket: `report-card-photos`
- Public read access
- Authenticated uploads only
- Allowed types: JPEG, PNG, WebP
- Max size: 10MB

### Table: `report_cards`
Already exists in schema ✅

---

## Design System

All components follow **Clean & Elegant Professional**:
- Warm cream background (#F8EEE5)
- Charcoal primary (#434E54)
- Soft shadows
- Rounded corners
- 44x44px minimum tap targets
- Tablet-optimized

---

## Testing Checklist

- [ ] Create Supabase Storage bucket `report-card-photos`
- [ ] Navigate to report card page
- [ ] Upload before/after photos
- [ ] Select assessments
- [ ] Check health observations
- [ ] Add groomer notes
- [ ] Toggle "Don't Send"
- [ ] Verify auto-save indicator
- [ ] Save as draft
- [ ] Submit report card
- [ ] Check validation errors
- [ ] Test critical issue warning

---

## Next Steps

1. **Create Storage Bucket**: Set up `report-card-photos` in Supabase
2. **Test Upload Flow**: Verify photos upload correctly
3. **Email Integration**: Connect report card sending to email service
4. **Customer View**: Create public-facing report card page

---

## Support

All components are fully implemented and ready to use!
The form is tablet-optimized, auto-saves, and follows The Puppy Day design system.
