# Task 0025: Admin Manual Send/Resend Controls - Implementation Plan

**Author**: DaisyUI Expert Agent
**Date**: 2025-12-13
**Task Group**: Report Card Automation (Week 2)
**Objective**: Create admin UI components for manually sending and resending report cards

---

## Overview

This task implements the admin control interface for manually triggering report card sends and resends. This gives admins the ability to override the automatic sending system (REQ-6.4.3).

The component will be used in two contexts:
1. On the report card form page (after submission)
2. On appointment detail pages (for already-submitted report cards)

---

## File to Create

### **Primary Component**

**File**: `src/components/admin/report-cards/ReportCardActions.tsx`

**Purpose**: Provides send/resend controls with confirmation modals and toast notifications

---

## Component Design Specification

### Component Props

```typescript
interface ReportCardActionsProps {
  reportCardId: string;
  reportCard: {
    id: string;
    sent_at: string | null;
    is_draft: boolean;
    dont_send: boolean;
  };
  onSendSuccess?: () => void;
}
```

### Component States

The component manages several UI states:

1. **Not Sent State** (`sent_at === null && !is_draft && !dont_send`)
   - Shows "Send Now" button
   - Allows sending for the first time

2. **Already Sent State** (`sent_at !== null`)
   - Shows "Resend" button
   - Allows re-sending to customer

3. **Draft State** (`is_draft === true`)
   - Hides send buttons
   - Shows warning alert explaining draft status

4. **Don't Send State** (`dont_send === true`)
   - Disables send button
   - Shows info alert explaining send is disabled

5. **Loading State** (during API call)
   - Shows loading spinner
   - Disables all buttons

---

## DaisyUI Component Architecture

### Button Design

**Send Now Button** (Primary Action):
- **DaisyUI Classes**: `btn btn-primary gap-2`
- **Icon**: `Send` from Lucide React
- **Text**: "Send Report Card"
- **Touch Target**: Min height 44px (DaisyUI btn already meets this)
- **States**: Normal, Hover, Loading, Disabled

**Resend Button** (Secondary Action):
- **DaisyUI Classes**: `btn btn-outline btn-primary gap-2`
- **Icon**: `RefreshCw` from Lucide React
- **Text**: "Resend Report Card"
- **Touch Target**: Min height 44px
- **States**: Normal, Hover, Loading, Disabled

### Alert Design

**Draft Warning** (when `is_draft === true`):
- **DaisyUI Classes**: `alert alert-warning`
- **Icon**: `AlertCircle` from Lucide React
- **Text**: "Report card is still a draft. Finish editing before sending."
- **Styling**: Uses DaisyUI alert component for consistency

**Don't Send Info** (when `dont_send === true`):
- **DaisyUI Classes**: `alert alert-info`
- **Icon**: `Info` from Lucide React
- **Text**: "Sending disabled for this report card. Update preferences to enable."
- **Note**: Button still shown but disabled state

### Modal Design

**DaisyUI Modal Structure**:

The project already has a `ConfirmationModal` component at `src/components/ui/ConfirmationModal.tsx` that uses Framer Motion for animations. We will **reuse this component** instead of creating a native DaisyUI modal.

**Modal Configuration for Send Action**:
```typescript
<ConfirmationModal
  isOpen={showSendModal}
  onClose={() => setShowSendModal(false)}
  onConfirm={handleSendConfirm}
  title="Send Report Card?"
  description="This will send SMS and email notifications to the customer with a link to view the report card."
  confirmText="Send Now"
  cancelText="Cancel"
  variant="default"
  isLoading={isSending}
/>
```

**Modal Configuration for Resend Action**:
```typescript
<ConfirmationModal
  isOpen={showResendModal}
  onClose={() => setShowResendModal(false)}
  onConfirm={handleResendConfirm}
  title="Resend Report Card?"
  description="This will send the report card again. The customer will receive new SMS and email notifications."
  confirmText="Resend Now"
  cancelText="Cancel"
  variant="default"
  isLoading={isSending}
/>
```

**Important**: The existing `ConfirmationModal` component already includes:
- Backdrop with click-to-close
- Escape key handling
- Focus trap
- Loading states with spinner
- Framer Motion animations
- Clean & Elegant Professional design system colors

---

## Toast Notification System

**Existing Toast System**:

The project has a global toast notification system:
- Hook: `src/hooks/use-toast.ts`
- Component: `src/components/ui/toast.tsx`
- Toaster: `src/components/ui/toaster.tsx`

**Toast Usage**:

```typescript
import { toast } from '@/hooks/use-toast';

// Success notification
toast.success('Report card sent successfully!', {
  description: 'The customer will receive SMS and email notifications.',
});

// Error notification
toast.error('Failed to send report card', {
  description: error.message || 'Please try again.',
});
```

**Toast Characteristics**:
- Clean design with charcoal colors (#434E54)
- Auto-dismiss after 3 seconds (success) or 5 seconds (error)
- Positioned fixed top-right
- Animated entrance/exit with Framer Motion
- Shows icon, title, and optional description

---

## API Integration

### Endpoint

**POST** `/api/admin/report-cards/[id]/send`

**Important**: This endpoint does **NOT** exist yet. It will be created separately by another agent/task.

### Request Format

```typescript
interface SendReportCardRequest {
  action: 'send' | 'resend';
}
```

### Response Format

**Success Response (200)**:
```typescript
interface SendReportCardResponse {
  success: true;
  message: string;
  sent_at: string; // ISO timestamp
}
```

**Error Response (4xx/5xx)**:
```typescript
interface ErrorResponse {
  error: string;
  details?: string;
}
```

### API Call Implementation

```typescript
const sendReportCard = async (action: 'send' | 'resend') => {
  const response = await fetch(`/api/admin/report-cards/${reportCardId}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to send report card');
  }

  return data;
};
```

---

## Component Implementation Structure

### Component File Layout

```typescript
'use client';

// Imports
import { useState } from 'react';
import { Send, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { toast } from '@/hooks/use-toast';

// Props interface
interface ReportCardActionsProps { ... }

// Component
export function ReportCardActions({ ... }) {
  // State management
  const [showSendModal, setShowSendModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // API handlers
  const handleSend = async () => { ... };
  const handleResend = async () => { ... };

  // Render logic
  return (
    <div>
      {/* Draft Warning */}
      {/* Don't Send Warning */}
      {/* Action Buttons */}
      {/* Confirmation Modals */}
    </div>
  );
}
```

### State Management

**Local Component State**:
- `showSendModal: boolean` - Controls send confirmation modal visibility
- `showResendModal: boolean` - Controls resend confirmation modal visibility
- `isSending: boolean` - Loading state during API call

**Derived State**:
- `canSend = !is_draft && sent_at === null` - Can show send button
- `canResend = sent_at !== null` - Can show resend button
- `isDisabled = dont_send || isSending` - Button disabled state

### Error Handling Strategy

1. **Network Errors**:
   - Catch fetch errors
   - Show error toast with generic message
   - Keep modal open for retry

2. **API Errors**:
   - Parse error response
   - Show error toast with specific message
   - Close modal

3. **Success Handling**:
   - Show success toast
   - Close modal
   - Call `onSendSuccess()` callback if provided
   - Update local state (if managing report card state)

---

## Integration Points

### Usage in Report Card Form

After the report card is submitted (in `ReportCardForm.tsx`), show the `ReportCardActions` component:

```typescript
// In ReportCardForm.tsx (after submission)
{submittedReportCard && (
  <div className="mt-6">
    <ReportCardActions
      reportCardId={submittedReportCard.id}
      reportCard={{
        id: submittedReportCard.id,
        sent_at: submittedReportCard.sent_at,
        is_draft: submittedReportCard.is_draft,
        dont_send: dontSend,
      }}
      onSendSuccess={() => {
        // Refresh report card data or navigate away
        router.push('/admin/appointments');
      }}
    />
  </div>
)}
```

### Usage in Appointment Detail Page

When viewing an appointment with a report card, show the actions:

```typescript
// In appointment detail page
{appointment.report_card && (
  <ReportCardActions
    reportCardId={appointment.report_card.id}
    reportCard={appointment.report_card}
    onSendSuccess={() => {
      // Refresh appointment data
      mutate();
    }}
  />
)}
```

---

## Accessibility Requirements

### Keyboard Navigation

- All buttons focusable with Tab key
- Enter/Space activates buttons
- Escape closes modals
- Focus trap within modal when open

### ARIA Labels

**Send Button**:
```html
<button
  aria-label="Send report card to customer via SMS and email"
  aria-disabled={isDisabled}
>
  <Send aria-hidden="true" />
  Send Report Card
</button>
```

**Resend Button**:
```html
<button
  aria-label="Resend report card to customer"
  aria-disabled={isSending}
>
  <RefreshCw aria-hidden="true" />
  Resend Report Card
</button>
```

**Modal** (already handled by ConfirmationModal):
- `role="alertdialog"`
- `aria-modal="true"`
- `aria-labelledby` and `aria-describedby`

### Screen Reader Support

- Alert messages announce automatically (alert role)
- Button states announced (disabled, loading)
- Modal content fully readable
- Success/error toasts announced via `aria-live="polite"`

---

## Visual Design Specification

### Colors (Clean & Elegant Professional)

**Primary Button**:
- Background: `#434E54` (charcoal)
- Hover: `#363F44` (darker charcoal)
- Text: `#FFFFFF` (white)
- Border: None

**Outline Button**:
- Background: Transparent
- Hover: `#F8EEE5` (warm cream)
- Text: `#434E54` (charcoal)
- Border: `2px solid #434E54`

**Alert Colors**:
- Warning: DaisyUI `alert-warning` (amber tones)
- Info: DaisyUI `alert-info` (blue tones)

### Typography

- Button Text: `font-medium` (semibold for primary action)
- Alert Text: `text-sm`
- Modal Title: `text-xl font-bold`
- Modal Description: Regular weight

### Spacing

- Component padding: `p-6`
- Button gap: `gap-2` (between icon and text)
- Alert margin: `mb-6`
- Card shadow: `shadow-md`

### Rounded Corners

- Buttons: `rounded-lg` (8px)
- Container: `rounded-xl` (12px)
- Alerts: `rounded-lg` (8px)

---

## Component Code Template

```typescript
'use client';

import { useState } from 'react';
import { Send, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { toast } from '@/hooks/use-toast';

interface ReportCardActionsProps {
  reportCardId: string;
  reportCard: {
    id: string;
    sent_at: string | null;
    is_draft: boolean;
    dont_send: boolean;
  };
  onSendSuccess?: () => void;
}

export function ReportCardActions({
  reportCardId,
  reportCard,
  onSendSuccess,
}: ReportCardActionsProps) {
  const [showSendModal, setShowSendModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { sent_at, is_draft, dont_send } = reportCard;

  // Determine UI state
  const canSend = !is_draft && sent_at === null;
  const canResend = sent_at !== null;
  const isDisabled = dont_send || isSending;

  // API call handler
  const sendReportCard = async (action: 'send' | 'resend') => {
    setIsSending(true);
    try {
      const response = await fetch(`/api/admin/report-cards/${reportCardId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send report card');
      }

      // Success
      toast.success(
        action === 'send' ? 'Report card sent successfully!' : 'Report card resent successfully!',
        {
          description: 'The customer will receive SMS and email notifications.',
        }
      );

      // Close modals
      setShowSendModal(false);
      setShowResendModal(false);

      // Callback
      onSendSuccess?.();
    } catch (error: any) {
      toast.error('Failed to send report card', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendConfirm = () => sendReportCard('send');
  const handleResendConfirm = () => sendReportCard('resend');

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-lg font-bold text-[#434E54] mb-4">Send Report Card</h3>

      {/* Draft Warning */}
      {is_draft && (
        <div className="alert alert-warning mb-4">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">
            Report card is still a draft. Finish editing before sending.
          </span>
        </div>
      )}

      {/* Don't Send Warning */}
      {dont_send && (
        <div className="alert alert-info mb-4">
          <Info className="w-5 h-5" />
          <span className="text-sm">
            Sending disabled for this report card. Update preferences to enable.
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {canSend && (
          <button
            onClick={() => setShowSendModal(true)}
            disabled={isDisabled}
            className="btn btn-primary gap-2 min-h-[44px]"
            aria-label="Send report card to customer via SMS and email"
          >
            <Send className="w-5 h-5" aria-hidden="true" />
            Send Report Card
          </button>
        )}

        {canResend && (
          <button
            onClick={() => setShowResendModal(true)}
            disabled={isSending}
            className="btn btn-outline btn-primary gap-2 min-h-[44px]"
            aria-label="Resend report card to customer"
          >
            <RefreshCw className="w-5 h-5" aria-hidden="true" />
            Resend Report Card
          </button>
        )}
      </div>

      {/* Send Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onConfirm={handleSendConfirm}
        title="Send Report Card?"
        description="This will send SMS and email notifications to the customer with a link to view the report card."
        confirmText="Send Now"
        cancelText="Cancel"
        variant="default"
        isLoading={isSending}
      />

      {/* Resend Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResendModal}
        onClose={() => setShowResendModal(false)}
        onConfirm={handleResendConfirm}
        title="Resend Report Card?"
        description="This will send the report card again. The customer will receive new SMS and email notifications."
        confirmText="Resend Now"
        cancelText="Cancel"
        variant="default"
        isLoading={isSending}
      />
    </div>
  );
}
```

---

## Testing Checklist

### Unit Tests (Recommended)

- [ ] Component renders with `sent_at === null` (shows Send button)
- [ ] Component renders with `sent_at !== null` (shows Resend button)
- [ ] Draft warning shows when `is_draft === true`
- [ ] Don't send warning shows when `dont_send === true`
- [ ] Send button disabled when `dont_send === true`
- [ ] Modal opens on button click
- [ ] Modal closes on cancel
- [ ] API call triggered on confirm
- [ ] Success toast shown on success
- [ ] Error toast shown on error
- [ ] Loading state prevents double-clicks

### Manual Testing

1. **Send Flow**:
   - Create report card (not draft)
   - Click "Send Report Card"
   - Confirm modal appears
   - Click "Send Now"
   - Verify API call with `action: 'send'`
   - Verify success toast
   - Verify `onSendSuccess` callback

2. **Resend Flow**:
   - Open already-sent report card
   - Click "Resend Report Card"
   - Confirm modal appears
   - Click "Resend Now"
   - Verify API call with `action: 'resend'`
   - Verify success toast

3. **Error Handling**:
   - Simulate API error (500 response)
   - Verify error toast appears
   - Verify modal stays open
   - Verify can retry

4. **Draft State**:
   - Open draft report card
   - Verify warning alert shows
   - Verify no send button

5. **Don't Send State**:
   - Enable "Don't Send" toggle
   - Submit report card
   - Verify info alert shows
   - Verify send button disabled

### Accessibility Testing

- [ ] Tab navigation works
- [ ] Escape closes modals
- [ ] Screen reader announces all text
- [ ] Focus trap in modal
- [ ] Button states announced

---

## Implementation Notes

### Important Considerations

1. **API Endpoint Dependency**:
   - The API route `/api/admin/report-cards/[id]/send` does NOT exist yet
   - This component expects it to be implemented separately
   - The component will show errors if the endpoint doesn't exist

2. **State Management**:
   - This component does NOT manage report card data
   - It only triggers send/resend actions
   - Parent component responsible for refreshing data after send

3. **DaisyUI Version**:
   - Project uses DaisyUI 5.5.8
   - All class names verified against this version
   - Native modal component not used (using existing ConfirmationModal)

4. **Existing Components Reused**:
   - `ConfirmationModal` from `src/components/ui/ConfirmationModal.tsx`
   - `toast` from `src/hooks/use-toast.ts`
   - No need to create new modal or toast systems

5. **No Build or Dev Server Running**:
   - This is a planning document only
   - Actual implementation will be done by another agent
   - No `pnpm dev` or `pnpm build` commands in this plan

6. **Clean & Elegant Professional Design**:
   - Uses charcoal (#434E54) for primary elements
   - Soft shadows (shadow-md)
   - Rounded corners (rounded-lg, rounded-xl)
   - Professional typography
   - No bold borders or chunky elements

---

## Database Schema Reference

From `src/types/database.ts`:

```typescript
export interface ReportCard extends BaseEntity {
  appointment_id: string;
  mood: ReportCardMood | null;
  coat_condition: CoatCondition | null;
  behavior: BehaviorRating | null;
  health_observations: string[];
  groomer_notes: string | null;
  before_photo_url: string | null;
  after_photo_url: string | null;
  rating: number | null;
  feedback: string | null;
  groomer_id: string | null;
  view_count: number;
  last_viewed_at: string | null;
  sent_at: string | null;        // ← Used by component
  expires_at: string | null;
  dont_send: boolean;              // ← Used by component
  is_draft: boolean;               // ← Used by component
  updated_at: string;
}
```

**Key Fields**:
- `sent_at`: Timestamp of when report card was sent (null = not sent)
- `dont_send`: Boolean flag to prevent automatic sending
- `is_draft`: Boolean flag indicating draft status

---

## Next Steps

1. **For Implementation Agent**:
   - Create `src/components/admin/report-cards/ReportCardActions.tsx` using the template above
   - Test component in isolation
   - Integrate into report card form page
   - Add to appointment detail page

2. **For API Agent**:
   - Create API route at `src/app/api/admin/report-cards/[id]/send/route.ts`
   - Implement send/resend logic
   - Integrate with notification system (SMS + Email)
   - Update `sent_at` timestamp on success

3. **For Testing Agent**:
   - Write unit tests for component
   - Write integration tests for send flow
   - Test accessibility compliance
   - Test responsive design on mobile

---

## References

- **Requirements**: `docs/specs/phase-6/requirements.md` (REQ-6.4.3)
- **Task Spec**: `docs/specs/phase-6/tasks/0025-admin-manual-send-controls.md`
- **Existing Components**:
  - ConfirmationModal: `src/components/ui/ConfirmationModal.tsx`
  - Toast Hook: `src/hooks/use-toast.ts`
  - Toast Component: `src/components/ui/toast.tsx`
- **DaisyUI Docs**: https://daisyui.com/components/
- **Design System**: CLAUDE.md (Clean & Elegant Professional)

---

## Conclusion

This implementation plan provides a complete specification for creating the `ReportCardActions` component. The component leverages existing UI infrastructure (ConfirmationModal, toast system) and follows the project's Clean & Elegant Professional design aesthetic.

The component is self-contained, handles all edge cases, provides excellent UX with confirmations and feedback, and meets all accessibility requirements.

No actual implementation is performed in this planning phase. The development agent will execute the actual coding using this specification as a guide.
