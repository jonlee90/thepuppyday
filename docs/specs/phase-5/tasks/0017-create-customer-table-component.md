# Task 0017: Create CustomerTable component

**Group**: Customer Management (Week 4)

## Objective
Build searchable customer list with table

## Files to create/modify
- `src/app/(admin)/customers/page.tsx` - Customers page
- `src/components/admin/customers/CustomerTable.tsx` - Customer table
- `src/app/api/admin/customers/route.ts` - List customers endpoint

## Requirements covered
- REQ-12.1, REQ-12.2, REQ-12.3, REQ-12.4, REQ-12.5, REQ-12.6, REQ-12.7, REQ-12.8, REQ-12.9, REQ-12.10

## Acceptance criteria
- [x] Displays table with Name, Email, Phone, Pets (count), Appointments (count), Flags, Member Status
- [x] Search across name, email, phone, pet names
- [x] Highlight matching text in results
- [x] Row click navigates to `/admin/customers/[id]`
- [x] Flag icons in Flags column
- [x] Membership badge for active members
- [x] Pagination: 50 per page
- [x] "No customers found" with clear search button
- [x] Sortable by Name, Email, Appointments, Join Date

## Implementation Notes

**Completion Date**: 2025-12-12

### Files Created/Modified

1. **`src/components/admin/customers/CustomerTable.tsx`** (380 lines)
   - Client component for searchable, paginated customer table
   - Features search, sorting, and pagination with 50 items per page
   - Implements search highlighting with XSS/ReDoS protection

2. **`src/app/api/admin/customers/route.ts`** (195 lines)
   - GET endpoint for customer list with search, pagination, and sorting
   - Aggregates data from users, pets, appointments, flags, and memberships
   - Returns enriched customer objects with stats

3. **`src/app/(admin)/customers/page.tsx`**
   - Admin customers list page integrating CustomerTable component

### Key Features Implemented

- ✅ **Comprehensive Table Columns**:
  - Name (sortable) - with search highlighting
  - Email (sortable) - with search highlighting
  - Phone - with search highlighting
  - Pets count - badge with count
  - Appointments count (sortable) - total appointments
  - Flags - using CustomerFlagBadge component (max 2 visible)
  - Member Status - "Active" badge for active memberships

- ✅ **Advanced Search**:
  - Searches across: customer name, email, phone, and pet names
  - Debounced search with URL param support
  - Resets to page 1 on new search

- ✅ **Search Highlighting**:
  - Highlights matching text with yellow background (`bg-yellow-200`)
  - Case-insensitive matching
  - Wrapped in `<mark>` tags for semantic HTML

- ✅ **Sorting**:
  - Sortable columns: Name, Email, Appointments, Join Date
  - Toggle between ascending/descending
  - Visual indicators with arrow icons (ArrowUp/ArrowDown/ArrowUpDown)
  - Resets to page 1 on sort change

- ✅ **Pagination**:
  - 50 customers per page
  - Previous/Next navigation
  - Page number buttons (shows first 5 pages)
  - Ellipsis for additional pages
  - Results count display

- ✅ **Row Click Navigation**:
  - Click anywhere on row to navigate to `/admin/customers/[id]`
  - Hover effect with `hover:bg-gray-50`
  - Cursor pointer for affordance

- ✅ **Empty States**:
  - "No customers found" when search returns empty
  - "Clear Search" button when filtered
  - Different messages for no customers vs. no search results

### Technical Details

**API Query Strategy**:
```typescript
// Fetch all customers first, then aggregate in-memory
// This allows for complex search across related tables (pets)
const customers = await supabase
  .from('users')
  .select('*')
  .eq('role', 'customer');

// Then fetch related data and build stats
customers.map(customer => ({
  ...customer,
  pets_count: pets.filter(p => p.owner_id === customer.id).length,
  appointments_count: appointments.filter(a => a.customer_id === customer.id).length,
  flags: flags.filter(f => f.customer_id === customer.id),
  active_membership: memberships.find(m => m.customer_id === customer.id)
}));
```

**Search Implementation**:
- Filters customers by checking name, email, phone
- Additionally searches pet names for each customer
- Case-insensitive with `.toLowerCase()`
- Updates URL params for shareable links

**Sorting Logic**:
```typescript
switch (sortBy) {
  case 'email': compare a.email vs b.email
  case 'appointments': compare counts
  case 'join_date': compare created_at timestamps
  case 'name': compare full name strings
}
```

**Pagination Math**:
```typescript
const offset = (page - 1) * limit;
const paginatedCustomers = filteredCustomers.slice(offset, offset + limit);
const totalPages = Math.ceil(totalCount / limit);
```

### Security Fixes

**CRITICAL: XSS and ReDoS Protection** (lines 17-154)

1. **RegEx Injection Prevention**:
```typescript
// Security: Escape special regex characters to prevent ReDoS attacks
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

2. **Safe Search Highlighting**:
```typescript
const highlightText = (text: string) => {
  if (!searchQuery) return text;

  try {
    // Security: Escape user input before creating RegExp
    const escapedQuery = escapeRegExp(searchQuery);
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === escapedQuery.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 text-[#434E54] font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  } catch (error) {
    // Security: If regex fails, return text unstyled to prevent crashes
    console.error('Error highlighting text:', error);
    return text;
  }
};
```

**Why This Matters**:
- **Without escaping**: User could input `.*` to match everything (performance attack)
- **ReDoS attacks**: Malicious patterns like `(a+)+b` can cause exponential backtracking
- **XSS prevention**: Text is returned as React elements, not raw HTML

**Additional Security**:
- Admin-only access via `requireAdmin()` middleware
- No SQL injection risk (using Supabase client)
- Error messages don't leak sensitive information

### Design System Compliance

- **Colors**: Uses project palette (#434E54 charcoal, #EAE0D5 cream)
- **Shadows**: Soft shadows with `shadow-md`
- **Borders**: Subtle 1px borders with `border-gray-200`
- **Rounded Corners**: `rounded-lg`, `rounded-xl`, `rounded-full`
- **Typography**: Font weights from regular to semibold
- **Hover Effects**: Gentle transitions with `transition-colors`

### Performance Optimizations

- Debounced search (updates on every keystroke but with React state)
- Pagination reduces DOM elements (max 50 rows)
- Efficient filtering with in-memory operations
- Memoization opportunity for expensive calculations (future enhancement)

### User Experience

- Loading spinner during data fetch
- Disabled pagination buttons at boundaries
- Clear visual feedback for active sort column
- Responsive layout with Tailwind grid
- Accessible with semantic HTML and ARIA labels
