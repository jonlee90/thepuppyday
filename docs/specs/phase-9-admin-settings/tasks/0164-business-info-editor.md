# Task 0164: Business info editor component

## Description
Build the business information editor component for managing business name, address, phone, email, and social links.

## Acceptance Criteria
- [ ] Create `BusinessInfoEditor` component with form fields
- [ ] Implement business name text input
- [ ] Implement address fields: street address, city, state, zip
- [ ] Implement phone number input with mask: (XXX) XXX-XXXX
- [ ] Implement email input with validation
- [ ] Implement social links section: Instagram URL, Facebook URL, Yelp URL
- [ ] Add "View in Google Maps" link that opens map with address
- [ ] Display preview of how info appears in footer/contact sections
- [ ] Implement unsaved changes indicator
- [ ] Save button calls site content API with section='business_info'
- [ ] Display success toast on save

## Implementation Notes
- File: `src/components/admin/settings/site-content/BusinessInfoEditor.tsx`
- Use react-hook-form for form management
- Phone mask using react-input-mask or similar
- Google Maps link format: `https://maps.google.com/?q=ADDRESS`

## References
- Req 3.1, Req 3.2, Req 3.5, Req 3.8
- Design: Business Info section

## Complexity
Medium

## Category
UI

## Dependencies
- 0159 (Site content API)
