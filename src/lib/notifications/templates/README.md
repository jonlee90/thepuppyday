# Email Base Template System

## Overview

This directory contains the responsive HTML email base template for The Puppy Day notification system. The base template follows the **Clean & Elegant Professional** design system.

## Files

### `email-base.html`

The master HTML template that wraps all email content. Features:

- **Responsive Design**: Works across mobile and desktop email clients
- **Email Client Compatibility**: Table-based layouts, inline CSS, MSO conditional comments
- **Clean & Elegant Professional Design**:
  - Warm cream background (#F8EEE5)
  - Charcoal primary color (#434E54)
  - White cards (#FFFFFF) with soft shadows
  - Professional typography
  - Subtle borders and rounded corners
- **Consistent Branding**:
  - The Puppy Day logo placeholder in header
  - Business contact information in footer
  - Social media links (Instagram)
  - Unsubscribe link placeholder
- **Reusable Components**:
  - Card containers
  - Content boxes (cream background)
  - Alert boxes (info, warning, error, success)
  - Buttons (primary and secondary)
  - Info rows for structured data

## Template Placeholders

The base template uses two placeholders that are replaced at runtime:

- `{{CONTENT}}` - Replaced with the email-specific content
- `{{UNSUBSCRIBE_LINK}}` - Replaced with the unsubscribe URL

## Usage

The base template is loaded and processed by `email-base.ts`. Do not use this template directly. Instead, use the wrapper functions:

```typescript
import { wrapEmailContent, createCard, createButton } from '@/lib/notifications/email-base';

// Generate your content
const content = createCard(`
  <h2>Welcome to The Puppy Day!</h2>
  <p>Your content here...</p>
  ${createButton('Book Appointment', 'https://example.com')}
`);

// Wrap in base template
const { html, text } = wrapEmailContent(content, {
  unsubscribeLink: 'https://example.com/unsubscribe/abc123'
});
```

## Design System Colors

```css
/* Background */
--background: #F8EEE5;          /* Warm cream */
--background-light: #FFFBF7;    /* Lighter cream */

/* Primary */
--primary: #434E54;              /* Charcoal */
--primary-hover: #363F44;
--primary-light: #5A6670;

/* Secondary */
--secondary: #EAE0D5;            /* Lighter cream */
--secondary-hover: #DCD2C7;

/* Cards & Containers */
--card-bg: #FFFFFF;              /* White */
--content-box-bg: #FFFBF7;       /* Light cream */

/* Semantic Colors */
--success: #6BCB77;
--warning: #FFB347;
--error: #EF4444;
--info: #74B9FF;
```

## Component Styles

### Buttons

**Primary Button:**
```css
background-color: #434E54;
color: #ffffff;
padding: 14px 28px;
border-radius: 8px;
font-weight: 500;
```

**Secondary Button:**
```css
background-color: transparent;
color: #434E54;
border: 1px solid #434E54;
padding: 14px 28px;
border-radius: 8px;
```

### Cards

```css
background-color: #ffffff;
border-radius: 12px;
padding: 24px;
box-shadow: 0 2px 8px rgba(67, 78, 84, 0.08);
```

### Alert Boxes

- **Info**: Light blue background (#EFF6FF)
- **Warning**: Light orange background (#FFF4E6) with orange left border
- **Error**: Light red background (#FEF2F2) with red left border
- **Success**: Light green background (#F0FDF4)

## Email Client Testing

The template has been designed for compatibility with:

- Gmail (Desktop & Mobile)
- Outlook 2016+ (Windows)
- Outlook.com
- Apple Mail (macOS & iOS)
- Yahoo Mail
- Mobile email clients (iOS Mail, Android Gmail)

## Responsive Breakpoints

Mobile styles apply at `max-width: 600px`:

- Wrapper becomes 100% width
- Cards reduce padding
- Headings reduce font size
- Buttons become full-width blocks

## Maintenance

When updating the base template:

1. Test across multiple email clients
2. Validate HTML with email-specific validators
3. Ensure inline CSS is used (no external stylesheets)
4. Avoid unsupported CSS properties (flexbox, grid, transitions)
5. Test unsubscribe link functionality
6. Verify mobile responsiveness

## Related Files

- `../email-base.ts` - TypeScript wrapper functions
- `../email-templates.ts` - Email template implementations
- `../__tests__/email-templates.test.ts` - Template tests
