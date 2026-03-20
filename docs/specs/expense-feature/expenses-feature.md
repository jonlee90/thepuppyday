# Expenses Feature Design Document
## Dog Grooming Shop Management Application

**Document Version:** 1.0  
**Date:** March 2026  
**Purpose:** Claude Code Agent Implementation Reference  
**Feature Scope:** Expenses Module — Full feature design for expense tracking, receipt management, analytics, and reporting tailored for dog grooming businesses

***

## 1. Executive Summary

This document defines the complete design specification for an **Expenses Feature** within a dog grooming shop management application. The feature covers expense entry, AI-powered receipt scanning, categorization, vendor management, analytics, and tax-ready reporting.

Research across the top dog grooming platforms — MoeGo, Gingr, Groomsoft, GrooMore, and DaySmart — reveals a significant product gap: no platform delivers a best-in-class expense UX comparable to dedicated tools like Expensify or Zoho Expense. MoeGo's accounting module handles revenue-side transactions well but lacks AI receipt scanning for external purchases. Groomsoft offers basic expense category management but no OCR or visual analytics. This design document defines a purpose-built expenses feature that fills these gaps with grooming-specific categories, AI-powered capture, and a modern mobile-first UX.[^1][^2][^3][^4][^5]

***

## 2. Market Research Summary

### 2.1 Top Dog Grooming Platforms (2026)

| Platform | Price/mo | Expense Tracking | Receipt Scan | Analytics | QuickBooks Sync |
|---|---|---|---|---|---|
| MoeGo | $49–$239 | Auto (in-platform only) | ❌ | Basic P&L | ✅ |
| Gingr | Custom | Revenue/expense reports | ❌ | Basic | ✅ |
| DaySmart | $29+ | Minimal | ❌ | Basic | Partial |
| GrooMore | Low | Basic + payroll | ❌ | Limited | ✅ [^6] |
| Groomsoft | Low | Categories + vendors | ❌ | Category reports | Limited [^3] |
| Groomer.io | Custom | ❌ | ❌ | ❌ | ❌ |

**Key Finding:** No current dog grooming app offers AI receipt scanning, grooming-specific pre-loaded expense categories, mileage tracking, visual expense analytics, or budget vs. actual tracking. This is a clear competitive differentiator opportunity.[^7][^8]

### 2.2 Best-in-Class Expense Features (Cross-Industry)

The following features from leading expense apps define the gold standard:[^9][^10]

- **Expensify SmartScan**: AI OCR extracts merchant, date, amount from a receipt photo in seconds[^11][^12]
- **Zoho Expense**: AI auto-categorization, duplicate receipt detection, policy compliance flags, multi-currency[^13][^14]
- **ReceiptIn**: GPT-4 Vision extraction, smart category learning, daily spending calendar[^15]
- **Expense AI**: Natural language report generation ("Show me this month vs last month")[^16][^17]
- **MobilExpense 2026 trend**: Zero-touch expenses — AI reads, validates, categorizes; humans only review flagged exceptions[^18]

### 2.3 Dog Grooming Expense Categories (Tax-Compliant)

Pre-loaded categories based on IRS Schedule C deductions for grooming businesses:[^19][^20][^21]

| Category | Subcategories |
|---|---|
| Grooming Supplies | Shampoos, conditioners, ear cleaner, nail trimmers, towels |
| Grooming Tools | Scissors, clippers, dryers, combs, brushes |
| Rent & Utilities | Salon rent, electricity, water, internet |
| Payroll & Labor | Employee wages, contractor payments, payroll taxes |
| Vehicle & Mileage | Fuel, insurance, repairs, mileage (mobile groomers) |
| Advertising & Marketing | Social media ads, flyers, website |
| Insurance | Business, liability, vehicle |
| Software & Subscriptions | This app, payment processing, scheduling tools |
| Bank Fees | Processing fees, wire transfers |
| Licenses & Permits | Business licenses, grooming certifications |
| Meals & Entertainment | Client/team meals |
| Office & Admin | Printing, office supplies |
| Other / Miscellaneous | Custom categories |

***

## 3. Feature Architecture

### 3.1 Module Overview

```
Expenses Module
├── Dashboard (Overview)
│   ├── P&L summary card
│   ├── Expense vs Revenue chart
│   ├── Top categories breakdown (donut chart)
│   └── Recent expense list
├── Expense Entry
│   ├── Receipt Camera (AI Scan)
│   ├── Manual Entry Form
│   └── Recurring Expense Setup
├── Expense List
│   ├── Filter / Search / Sort
│   ├── Swipe actions (edit/delete)
│   └── Bulk actions
├── Vendors
│   ├── Vendor directory
│   ├── Vendor detail + expense history
│   └── Add/Edit vendor
├── Analytics
│   ├── Category breakdown
│   ├── Monthly trend chart
│   ├── Budget vs Actual
│   └── Tax summary view
└── Reports & Export
    ├── P&L Report
    ├── Expense by Category Report
    ├── Tax-ready export (CSV/PDF)
    └── QuickBooks / Xero sync
```

### 3.2 Data Models

#### Expense Record
```typescript
interface Expense {
  id: string;                          // UUID
  amount: number;                      // In cents (avoid float errors)
  currency: string;                    // Default: "USD"
  date: string;                        // ISO 8601: "2026-03-19"
  categoryId: string;                  // FK → ExpenseCategory
  vendorId?: string;                   // FK → Vendor (optional)
  vendorName?: string;                 // Free-text fallback if no vendor record
  description?: string;                // Notes
  receiptImageUrl?: string;            // S3/storage URL
  receiptThumbnailUrl?: string;        // Compressed preview
  paymentMethod: PaymentMethod;        // cash | card | check | bank_transfer | other
  isRecurring: boolean;
  recurringConfig?: RecurringConfig;
  isTaxDeductible: boolean;            // Default: true
  taxCategoryNote?: string;            // e.g., "Schedule C Line 22"
  aiExtracted: boolean;                // Was this auto-filled by AI?
  aiConfidenceScore?: number;          // 0–1 confidence from AI extraction
  status: ExpenseStatus;               // draft | confirmed | flagged
  createdAt: string;                   // ISO timestamp
  updatedAt: string;
  createdBy: string;                   // Staff user ID
  shopId: string;                      // Multi-location support
}

type PaymentMethod = "cash" | "card" | "check" | "bank_transfer" | "other";
type ExpenseStatus = "draft" | "confirmed" | "flagged";
```

#### Expense Category
```typescript
interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;                        // Icon identifier (emoji or icon name)
  color: string;                       // Hex color for charts
  description?: string;
  isDefault: boolean;                  // Pre-loaded grooming categories
  isTaxDeductible: boolean;
  scheduleC_line?: string;             // IRS Schedule C mapping (e.g., "Line 8 - Advertising")
  parentCategoryId?: string;           // For subcategory nesting (max 1 level deep)
  displayOrder: number;
  shopId?: string;                     // null = global default; string = shop-specific custom
}
```

#### Vendor
```typescript
interface Vendor {
  id: string;
  name: string;
  category: string;                    // Default expense category for this vendor
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  notes?: string;
  logoUrl?: string;
  totalSpent: number;                  // Computed from expense records
  lastExpenseDate?: string;
  isActive: boolean;
  shopId: string;
}
```

#### Recurring Config
```typescript
interface RecurringConfig {
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "annually";
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  reminderDaysBefore: number;          // Default: 3
  isActive: boolean;
}
```

#### Budget
```typescript
interface ExpenseBudget {
  id: string;
  categoryId: string;                  // null = overall budget
  periodType: "monthly" | "quarterly" | "annual";
  amount: number;                      // In cents
  startDate: string;
  shopId: string;
}
```

***

## 4. Screen Specifications

### 4.1 Expenses Dashboard Screen

**Route:** `/expenses` or tab: `Expenses`  
**Purpose:** High-level financial health overview

#### Layout (Mobile — Primary Platform)

```
┌─────────────────────────────────────┐
│  ← Expenses          [Filter] [+]   │  ← Header
├─────────────────────────────────────┤
│  [This Month ▼]   [Week] [Month] [Year] │  ← Period Selector (segmented)
├─────────────────────────────────────┤
│ ┌───────────────────────────────┐   │
│ │  💰 Net Profit                │   │  ← Summary Card (elevated)
│ │  $4,280.00                    │   │
│ │  Revenue: $7,100 ↑ 12%       │   │
│ │  Expenses: $2,820 ↑ 4%       │   │
│ └───────────────────────────────┘   │
├─────────────────────────────────────┤
│  Revenue vs Expenses                │
│  [Bar Chart: 12 weeks/months]       │  ← Animated bar chart
│   🟢 Revenue  🔴 Expenses           │
├─────────────────────────────────────┤
│  Expenses by Category               │
│  [Donut Chart] [Legend list]        │  ← Tap slice to drill down
│   🟠 Supplies 38%                   │
│   🟣 Payroll  29%                   │
│   🔵 Rent     18%                   │
│   ⚪ Other    15%                   │
├─────────────────────────────────────┤
│  Recent Expenses              [All] │
│  ┌─────────────────────────────┐   │
│  │ 🧴 PetEdge Supplies  -$124  │   │  ← Expense row
│  │    Grooming Supplies · Today │   │
│  ├─────────────────────────────┤   │
│  │ 🏠 Salon Rent        -$1,200│   │
│  │    Rent & Utilities · Mar 1  │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  ⚠️ Budget Alert: Supplies 87% used │  ← Budget warning banner
└─────────────────────────────────────┘
│  [Home] [Calendar] [💰 Expenses] [Clients] [More] │  ← Bottom nav
```

#### Component Details

- **Period Selector**: Segmented control with `Week / Month / Quarter / Year / Custom`. Defaults to current month.
- **Summary Card**: Shows Net Profit in large font, Revenue and Expenses below with delta indicators (↑/↓ vs prior period). Background: white card with subtle shadow. Green tint if profitable, red tint if loss.
- **Bar Chart**: 12-bar group chart (revenue bar in `#22c55e`, expense bar in `#ef4444`). Tap a bar to see day/week tooltip. Animate on load with staggered reveal.
- **Donut Chart**: Interactive. Tap any slice to filter the expense list below. Center shows total.
- **Expense Row**: Left icon (category emoji/icon), merchant name (bold), category + date (secondary), amount right-aligned in red. Swipe left to reveal Edit/Delete. Swipe right to mark as reviewed.
- **Budget Alert Banner**: Sticky at bottom of scrollable content. Orange background with ⚠️ icon. Tappable — navigates to Budget view.

#### Floating Action Button (FAB)
- Position: Bottom-right, 16px from edges, above bottom nav
- Icon: `+` (Camera icon on press-and-hold expands to: 📷 Scan Receipt | ✏️ Manual Entry | 🔄 Add Recurring)
- Style: `#4F46E5` indigo (primary brand color), white icon, 56px circle, shadow elevation

***

### 4.2 Add Expense — Receipt Scan Flow

**Trigger:** FAB → "Scan Receipt" or `+` button  
**Priority:** This is the PRIMARY expense entry method

#### Step 1: Camera Screen
```
┌─────────────────────────────────────┐
│  ✕ Cancel                           │
│                                     │
│    ┌───────────────────────────┐    │
│    │                           │    │
│    │   [Camera Viewfinder]     │    │
│    │                           │    │
│    │  [ Align receipt here ]   │    │
│    │                           │    │
│    └───────────────────────────┘    │
│                                     │
│    📁 From Library                  │
│                                     │
│         ⭕ [Shutter Button]         │
└─────────────────────────────────────┘
```

- Auto-crop and edge detection guides (green border when receipt detected)
- Supports: photo capture, gallery import, drag-drop image (web)
- After capture: shows review screen with crop/rotate tools before processing

#### Step 2: AI Processing Screen
```
┌─────────────────────────────────────┐
│  Processing Receipt...              │
│                                     │
│         [Receipt thumbnail]         │
│                                     │
│    ⠿ Extracting merchant...  ✅     │
│    ⠿ Reading amount...       ✅     │
│    ⠿ Detecting date...       ✅     │
│    ⠿ Categorizing expense... ⏳     │
└─────────────────────────────────────┘
```

- Animated step-by-step progress gives transparency
- If OCR fails or confidence < 0.7: shows partial results with fields highlighted for manual correction
- Processing time target: < 3 seconds

#### Step 3: Review & Confirm (Bottom Sheet — slides up)

```
┌─────────────────────────────────────┐
│  ────                               │  ← Drag handle
│  Review Expense             [Save]  │
├─────────────────────────────────────┤
│  [Receipt thumbnail  🔍 View full]  │
├─────────────────────────────────────┤
│  Amount *                           │
│  ┌─────────────────────────────┐   │
│  │  $ 124.50                   │   │  ← Large numeric input
│  └─────────────────────────────┘   │
│                                     │
│  Date *                             │
│  [ Mar 15, 2026           📅 ]     │
│                                     │
│  Category *                [✏️ AI] │
│  [ 🧴 Grooming Supplies    ▼ ]     │  ← AI badge shows auto-categorized
│                                     │
│  Vendor                             │
│  [ PetEdge                 ▼ ]     │  ← Autocomplete from vendor DB
│                                     │
│  Payment Method                     │
│  [ 💳 Card                 ▼ ]     │
│                                     │
│  Notes                              │
│  [ Shampoo and conditioner bulk ]  │
│                                     │
│  ☑ Tax Deductible                   │
│  ☐ Recurring                        │
│                                     │
│  [  Cancel  ]    [  Save Expense  ] │
└─────────────────────────────────────┘
```

**Key behaviors:**
- AI-filled fields shown with subtle purple `🤖 AI` badge; user can tap to override
- Category picker opens a full-screen category selector (see Section 4.3)
- Vendor field autocompletes from existing vendor list; "Add new vendor" option at bottom of dropdown
- "Tax Deductible" toggle defaults to ON with the category's default setting
- Toggling "Recurring" expands a sub-form for frequency/start date/end date

***

### 4.3 Manual Expense Entry Form

**Trigger:** FAB → "Manual Entry"  
**Identical to Step 3 above** but without the receipt thumbnail and AI badges.  
- Amount field shows a custom **numeric keyboard** (large keys, dollar sign prefix)
- Date defaults to today
- Category is blank until selected

***

### 4.4 Category Picker Screen

**Trigger:** Tapping Category field in expense entry

```
┌─────────────────────────────────────┐
│  ← Select Category                  │
│  [🔍 Search categories...        ] │
├─────────────────────────────────────┤
│  Recently Used                      │
│  [🧴 Supplies] [🏠 Rent] [💰 Payroll] │  ← Horizontal chip scroll
├─────────────────────────────────────┤
│  All Categories                     │
│  ┌─────────────────────────────┐   │
│  │ 🧴  Grooming Supplies       │   │
│  │ 🔧  Grooming Tools          │   │
│  │ 🏠  Rent & Utilities        │   │
│  │ 👥  Payroll & Labor         │   │
│  │ 🚗  Vehicle & Mileage       │   │
│  │ 📢  Advertising             │   │
│  │ 🛡️  Insurance               │   │
│  │ 💻  Software & Subscriptions│   │
│  │ 🏦  Bank Fees               │   │
│  │ 📋  Licenses & Permits      │   │
│  │ 🍽️  Meals & Entertainment   │   │
│  │ 📦  Office & Admin          │   │
│  │ ➕  Other / Custom           │   │
│  └─────────────────────────────┘   │
│                                     │
│  [+ Create Custom Category]         │
└─────────────────────────────────────┘
```

- Tapping a category with subcategories expands inline (accordion)
- "Create Custom Category" opens a mini-form: name, icon picker (emoji selector), color picker, tax deductible toggle
- Selected category shows checkmark ✅

***

### 4.5 Expense List Screen

**Route:** `/expenses/list`

```
┌─────────────────────────────────────┐
│  ← All Expenses  [🔍] [Filter] [Sort]│
├─────────────────────────────────────┤
│  [🔍 Search expenses...           ] │
├─────────────────────────────────────┤
│  Filters: [All ✕] [Supplies ✕]      │  ← Active filter chips
├─────────────────────────────────────┤
│  March 2026               $2,820.00 │  ← Month header with total
│  ┌─────────────────────────────┐   │
│  │ 🧴 PetEdge Supplies        │   │
│  │    Grooming Supplies        │   │
│  │    Mar 15 · Card            │   │  -$124.50
│  ├─────────────────────────────┤   │
│  │ 🏠 Salon Rent               │   │
│  │    Rent & Utilities         │   │
│  │    Mar 1 · Bank Transfer    │   │  -$1,200.00
│  └─────────────────────────────┘   │
│                                     │
│  February 2026            $2,710.00 │
│  ...                                │
└─────────────────────────────────────┘
```

**Swipe actions on expense row:**
- Swipe LEFT → reveals `✏️ Edit` (indigo) and `🗑️ Delete` (red)
- Swipe RIGHT → reveals `✅ Mark Confirmed` (green) for draft expenses
- Long press → multi-select mode with bulk actions (Delete, Export, Change Category)

**Filter panel (bottom sheet):**
- Date range picker (preset: Today / This Week / This Month / Custom)
- Category multi-select
- Vendor multi-select
- Payment method checkboxes
- Amount range slider
- Status: All / Confirmed / Draft / Flagged

**Sort options:** Date (newest first default) / Amount (high to low) / Category (A–Z) / Vendor (A–Z)

***

### 4.6 Expense Detail Screen

**Route:** `/expenses/:id`

```
┌─────────────────────────────────────┐
│  ← Expense Detail      [✏️ Edit]    │
├─────────────────────────────────────┤
│  [Receipt Image — full width]       │
│  [🔍 Pinch to zoom]                │
├─────────────────────────────────────┤
│  $124.50                            │  ← Large amount
│  Grooming Supplies                  │
│  Mar 15, 2026                       │
├─────────────────────────────────────┤
│  Vendor      PetEdge                │
│  Payment     💳 Credit Card         │
│  Status      ✅ Confirmed           │
│  Tax         ✅ Deductible          │
│  Notes       Shampoo bulk order     │
│  Added by    Sarah (Staff)          │
├─────────────────────────────────────┤
│  [  🗑️ Delete Expense  ]           │
└─────────────────────────────────────┘
```

***

### 4.7 Vendor Management Screen

**Route:** `/expenses/vendors`

```
┌─────────────────────────────────────┐
│  ← Vendors                    [+]   │
│  [🔍 Search vendors...           ] │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ 🛍️ PetEdge                  │   │
│  │    Grooming Supplies · 12 expenses│
│  │    Total spent: $1,840      │   │
│  ├─────────────────────────────┤   │
│  │ 🏠 Main Street Properties   │   │
│  │    Rent · 3 expenses         │   │
│  │    Total spent: $3,600      │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Vendor Detail:** Shows contact info, total spent, expense history for that vendor, default category.

***

### 4.8 Analytics Screen

**Route:** `/expenses/analytics`

```
┌─────────────────────────────────────┐
│  ← Analytics           [Export]     │
│  [Month ▼] [Q1 2026 ▼]             │
├─────────────────────────────────────┤
│  P&L Summary                        │
│  Revenue:   $7,100   ████████████  │
│  Expenses:  $2,820   ████████      │
│  Net:       $4,280  ↑ 18% vs prior │
├─────────────────────────────────────┤
│  Expenses by Category               │
│  [Donut Chart]                      │
│  🧴 Supplies       $1,072  38%     │
│  👥 Payroll        $819    29%     │
│  🏠 Rent           $508    18%     │
│  🚗 Vehicle        $282    10%     │
│  📢 Advertising    $141    5%      │
├─────────────────────────────────────┤
│  Monthly Trend (12 months)          │
│  [Line chart: expenses over time]   │
├─────────────────────────────────────┤
│  Budget vs Actual                   │
│  🧴 Supplies   $1,072/$1,200 ██░  89%│
│  👥 Payroll    $819/$900     ███░  91%│
│  🏠 Rent       $508/$600     ████  85%│
├─────────────────────────────────────┤
│  Tax Summary                        │
│  Deductible expenses: $2,710        │
│  Non-deductible:      $110          │
│  [Download Tax Report PDF]          │
└─────────────────────────────────────┘
```

***

### 4.9 Recurring Expenses Screen

**Route:** `/expenses/recurring`

```
┌─────────────────────────────────────┐
│  ← Recurring Expenses          [+]  │
├─────────────────────────────────────┤
│  Active (3)                         │
│  ┌─────────────────────────────┐   │
│  │ 🏠 Salon Rent    $1,200/mo  │   │
│  │    Next: Apr 1, 2026   [⏸]  │   │
│  ├─────────────────────────────┤   │
│  │ 💻 MoeGo Sub.    $99/mo    │   │
│  │    Next: Apr 5, 2026   [⏸]  │   │
│  ├─────────────────────────────┤   │
│  │ 🛡️ Liability Ins. $150/mo   │   │
│  │    Next: Apr 1, 2026   [⏸]  │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  Upcoming this month                │
│  Apr 1 — Salon Rent      -$1,200   │
│  Apr 1 — Liability Ins.  -$150     │
│  Apr 5 — MoeGo Sub.      -$99      │
└─────────────────────────────────────┘
```

***

### 4.10 Reports & Export Screen

**Route:** `/expenses/reports`

#### Available Reports

1. **Profit & Loss Report** — Revenue vs. expenses, net profit, by period
2. **Expense by Category** — Category-level breakdown with totals
3. **Expense by Vendor** — Top vendors by spend
4. **Tax-Ready Report** — All deductible expenses grouped by Schedule C line
5. **Monthly Comparison** — Side-by-side months

#### Export Options
- **PDF** — Formatted report with logo, date range, charts
- **CSV** — Raw data for import into QuickBooks / Xero / Excel
- **Email Report** — Send PDF to owner's email directly from app

***

## 5. Mileage Tracking Sub-Feature (Mobile Groomers)

Mobile groomers are a significant user segment and require vehicle expense tracking.[^22][^3]

### 5.1 Data Model

```typescript
interface MileageEntry {
  id: string;
  date: string;
  startLocation?: string;            // Address or "Salon"
  endLocation?: string;              // Client address
  miles: number;
  purpose: string;                   // e.g., "Client visit - Rex (Lab)"
  appointmentId?: string;            // FK → Appointment (if linked)
  ratePerMile: number;               // IRS standard rate (default: $0.67 for 2024)
  deductibleAmount: number;          // Computed: miles * ratePerMile
  trackingMethod: "manual" | "gps";
  shopId: string;
}
```

### 5.2 Mileage Entry UI

- **Quick log**: From appointment card → swipe action "Log Mileage" → pre-fills client address
- **Manual entry**: Enter start/end address or just miles
- **GPS mode** (optional, future): Start/stop trip recording from app
- **IRS rate auto-update**: App updates rate annually (currently $0.67/mile for 2024)

***

## 6. AI Receipt Processing — Technical Specification

### 6.1 Processing Pipeline

```
User captures receipt image
        ↓
Client-side: Image compression (max 2MB, JPEG quality 0.85)
        ↓
Upload to backend → POST /api/expenses/scan-receipt
        ↓
Backend: Call AI Vision API (OpenAI GPT-4o Vision or Google Vision)
        ↓
Extract structured data:
  - merchant_name (string)
  - total_amount (float)
  - date (ISO 8601)
  - line_items (array, optional)
  - currency (string)
        ↓
Confidence scoring (0.0–1.0 per field)
        ↓
Category suggestion engine:
  1. Merchant name lookup in vendor DB
  2. If vendor found → use vendor.defaultCategory
  3. If not found → keyword matching against categories
  4. ML classifier (train on historical expenses)
        ↓
Return: ExtractedExpenseData + confidence scores
        ↓
Pre-fill form. Fields with confidence < 0.75 → highlighted for user review
```

### 6.2 API Contract

**Request:**
```
POST /api/expenses/scan-receipt
Content-Type: multipart/form-data

{
  image: File,       // JPEG/PNG, max 10MB original
  shopId: string
}
```

**Response:**
```typescript
interface ScanReceiptResponse {
  success: boolean;
  data: {
    merchantName?: string;
    amount?: number;
    date?: string;
    currency?: string;
    suggestedCategoryId?: string;
    suggestedVendorId?: string;
    confidence: {
      merchantName: number;
      amount: number;
      date: number;
      category: number;
    };
    rawText?: string;              // Full OCR text for debugging
  };
  receiptImageUrl: string;        // Stored URL
  error?: string;
}
```

### 6.3 Fallback Behavior

- If AI extraction fails entirely → show manual entry form with receipt image attached
- If confidence < 0.5 for amount → leave amount blank, show warning: "Amount unclear — please enter manually"
- If API timeout (> 10s) → save receipt image and process async; notify user with push notification when ready

***

## 7. Budget Management

### 7.1 Budget Setup

- Owners can set monthly budgets per category
- Optional: overall monthly expense budget
- Configured in: Settings → Budget Setup

### 7.2 Budget Alerts

| Threshold | Alert Type |
|---|---|
| 75% used | Yellow banner on dashboard |
| 90% used | Orange push notification |
| 100% used | Red push notification + in-app modal |
| Overbudget | Persistent red badge on Expenses tab icon |

### 7.3 Budget Data Model

```typescript
interface ExpenseBudget {
  id: string;
  shopId: string;
  categoryId: string | null;           // null = global budget
  periodType: "monthly" | "quarterly" | "annual";
  amount: number;                      // In cents
  alertThresholds: number[];           // e.g., [0.75, 0.90, 1.0]
  isActive: boolean;
  startDate: string;
}
```

***

## 8. Integrations

### 8.1 QuickBooks Online Integration

**Sync direction:** One-way push (app → QuickBooks)

**Mapped fields:**
| App Field | QuickBooks Field |
|---|---|
| category.name | Expense Account |
| vendor.name | Vendor |
| amount | Amount |
| date | Transaction Date |
| paymentMethod | Payment Method |
| description | Memo |

**Sync trigger:** Manual ("Sync to QuickBooks" button) and automatic daily at midnight.

### 8.2 Xero Integration

Same mapping structure as QuickBooks; uses Xero OAuth 2.0 flow.

### 8.3 Bank Connection (Future Phase)

- Connect bank/credit card via Plaid
- Auto-import transactions
- Match imported transactions to existing expense records or flag as unmatched for review
- This mirrors MoeGo's bank reconciliation feature[^2]

***

## 9. Notifications

| Trigger | Channel | Message |
|---|---|---|
| Recurring expense due in 3 days | Push + in-app | "🏠 Salon Rent ($1,200) is due in 3 days" |
| Budget 90% used | Push | "⚠️ Supplies budget is 90% used this month" |
| Budget exceeded | Push + in-app modal | "🚨 Supplies budget exceeded by $72" |
| Receipt scan complete (async) | Push | "✅ Your receipt has been processed — tap to review" |
| Monthly expense summary | Push (optional) | "📊 February recap: $2,820 in expenses. Net profit: $4,280" |

***

## 10. Permissions & Multi-User Access

| Role | View Expenses | Add Expenses | Edit/Delete | View Analytics | Export Reports | Budget Settings |
|---|---|---|---|---|---|---|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ (own) | ✅ | ✅ | ❌ |
| Groomer/Staff | ✅ (limited) | ✅ (own) | ❌ | ❌ | ❌ | ❌ |

***

## 11. API Endpoints

### Expenses CRUD

```
GET    /api/expenses                     — List expenses (with filters)
POST   /api/expenses                     — Create expense
GET    /api/expenses/:id                 — Get expense detail
PUT    /api/expenses/:id                 — Update expense
DELETE /api/expenses/:id                 — Delete expense
POST   /api/expenses/bulk-delete         — Bulk delete
POST   /api/expenses/scan-receipt        — AI receipt scan
```

### Categories

```
GET    /api/expense-categories           — List all categories for shop
POST   /api/expense-categories           — Create custom category
PUT    /api/expense-categories/:id       — Update category
DELETE /api/expense-categories/:id       — Delete (if no expenses)
```

### Vendors

```
GET    /api/vendors                      — List vendors
POST   /api/vendors                      — Create vendor
GET    /api/vendors/:id                  — Get vendor + expense history
PUT    /api/vendors/:id                  — Update vendor
DELETE /api/vendors/:id                  — Delete vendor
```

### Analytics & Reports

```
GET    /api/analytics/expenses/summary   — Dashboard summary card data
GET    /api/analytics/expenses/by-category — Category breakdown
GET    /api/analytics/expenses/trend     — Monthly trend data
GET    /api/analytics/expenses/budget    — Budget vs actual
GET    /api/reports/expenses             — Generate report
GET    /api/reports/expenses/export      — Export PDF or CSV
```

### Recurring

```
GET    /api/expenses/recurring           — List recurring expenses
POST   /api/expenses/recurring           — Create recurring template
PUT    /api/expenses/recurring/:id       — Update recurring
DELETE /api/expenses/recurring/:id       — Delete recurring
POST   /api/expenses/recurring/:id/pause — Pause/resume
```

### Mileage

```
GET    /api/mileage                      — List mileage entries
POST   /api/mileage                      — Log mileage
PUT    /api/mileage/:id                  — Update
DELETE /api/mileage/:id                  — Delete
```

### Budgets

```
GET    /api/budgets                      — List budgets
POST   /api/budgets                      — Create/update budget
DELETE /api/budgets/:id                  — Delete budget
```

### Integrations

```
POST   /api/integrations/quickbooks/connect    — OAuth flow
DELETE /api/integrations/quickbooks/disconnect — Disconnect
POST   /api/integrations/quickbooks/sync       — Manual sync
GET    /api/integrations/quickbooks/status     — Sync status
```

***

## 12. State Management (Frontend)

### Store Slices Required

```typescript
// expensesSlice
interface ExpensesState {
  expenses: Expense[];
  selectedExpense: Expense | null;
  isLoading: boolean;
  isScanning: boolean;
  scanResult: ScanReceiptResponse | null;
  filters: ExpenseFilters;
  pagination: PaginationState;
  error: string | null;
}

// categoriesSlice
interface CategoriesState {
  categories: ExpenseCategory[];
  isLoading: boolean;
}

// vendorsSlice
interface VendorsState {
  vendors: Vendor[];
  isLoading: boolean;
}

// analyticsSlice
interface AnalyticsState {
  summary: ExpenseSummary | null;
  byCategory: CategoryBreakdown[];
  trend: MonthlyTrend[];
  budgetStatus: BudgetStatus[];
  selectedPeriod: Period;
  isLoading: boolean;
}

// budgetsSlice
interface BudgetsState {
  budgets: ExpenseBudget[];
  isLoading: boolean;
}
```

***

## 13. Design Tokens & Styling

### Colors

```css
/* Primary */
--color-primary: #4F46E5;         /* Indigo — FAB, primary buttons */
--color-primary-light: #EEF2FF;   /* Indigo tint — category chips */

/* Semantic */
--color-expense: #EF4444;         /* Red — expense amounts */
--color-income: #22C55E;          /* Green — revenue amounts */
--color-profit: #10B981;          /* Emerald — net profit */
--color-warning: #F59E0B;         /* Amber — budget alerts 75% */
--color-danger: #EF4444;          /* Red — budget alerts 100% */

/* Neutral */
--color-surface: #FFFFFF;
--color-background: #F9FAFB;
--color-border: #E5E7EB;
--color-text-primary: #111827;
--color-text-secondary: #6B7280;
--color-text-disabled: #D1D5DB;
```

### Typography

```css
/* Amounts */
.amount-large  { font-size: 32px; font-weight: 700; }
.amount-medium { font-size: 20px; font-weight: 600; }
.amount-small  { font-size: 16px; font-weight: 500; }

/* Labels */
.label-primary   { font-size: 15px; font-weight: 600; }
.label-secondary { font-size: 13px; font-weight: 400; color: var(--color-text-secondary); }

/* Section headers */
.section-header { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
```

### Spacing

```css
--spacing-xs:  4px;
--spacing-sm:  8px;
--spacing-md:  16px;
--spacing-lg:  24px;
--spacing-xl:  32px;
--spacing-2xl: 48px;
```

### Elevation / Shadows

```css
--shadow-card: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
--shadow-fab:  0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
--shadow-sheet: 0 -4px 16px rgba(0,0,0,0.12);
```

### Border Radius

```css
--radius-sm:   6px;
--radius-md:   12px;
--radius-lg:   16px;
--radius-full: 9999px;    /* Pills, FAB */
```

***

## 14. Animation Specifications

| Element | Animation | Duration | Easing |
|---|---|---|---|
| Screen transition | Slide up / fade | 300ms | ease-out |
| Bottom sheet open | Slide up from bottom | 350ms | spring(0.7) |
| Bottom sheet close | Slide down | 250ms | ease-in |
| FAB expand (press-hold) | Scale + radial menu | 250ms | spring(0.8) |
| Chart bars on load | Grow from 0 | 600ms staggered | ease-out |
| Donut chart | Draw arc | 800ms | ease-in-out |
| Expense row swipe | Reveal actions | Real-time | — |
| Success state (scan) | Checkmark draw + scale | 400ms | spring(0.9) |
| Budget bar | Width grow | 500ms | ease-out |
| Amount input | Scale up slightly on focus | 150ms | ease |

***

## 15. Error States & Empty States

### Empty State: No Expenses Yet

```
         🧾
    No expenses yet
    
  Start tracking your business
  expenses to see insights here.
  
  [📷 Scan Receipt]  [✏️ Add Manually]
```

### Empty State: No Matching Filters

```
         🔍
    No expenses found
    
  Try adjusting your filters
  or date range.
  
  [Clear Filters]
```

### Error State: Scan Failed

```
         ❌
    Couldn't read receipt
    
  The image may be blurry or
  unclear. Try again or add
  the expense manually.
  
  [Try Again]  [Add Manually]
```

### Error State: Network Offline

- Offline banner at top: `📡 No internet — expenses will sync when reconnected`
- Allow manual entry in offline mode; queue sync on reconnect

***

## 16. Implementation Phases

### Phase 1 — Core (MVP)
- [ ] Expense CRUD (create, read, update, delete)
- [ ] Pre-loaded grooming expense categories
- [ ] Manual entry form with all fields
- [ ] Expense list with filter and sort
- [ ] Expense detail screen
- [ ] Basic dashboard: summary card + recent list
- [ ] Category management (add/edit custom categories)

### Phase 2 — Receipt Scanning & Vendors
- [ ] AI receipt scanning with camera
- [ ] Gallery import support
- [ ] OCR + AI categorization pipeline
- [ ] Vendor management (CRUD)
- [ ] Vendor autocomplete in expense form
- [ ] Vendor expense history

### Phase 3 — Analytics & Budget
- [ ] Dashboard charts (bar chart, donut chart)
- [ ] Analytics screen (trend, budget vs actual, tax summary)
- [ ] Budget setup and management
- [ ] Budget alert notifications
- [ ] Recurring expenses

### Phase 4 — Reports, Integrations & Advanced
- [ ] Report generation (P&L, Category, Tax-ready)
- [ ] PDF and CSV export
- [ ] QuickBooks Online integration
- [ ] Xero integration
- [ ] Mileage tracking
- [ ] Multi-location support
- [ ] Bank connection (Plaid) — future phase

***

## 17. Testing Requirements

### Unit Tests
- Expense amount calculations (cents arithmetic)
- Category assignment logic
- Budget threshold alerts
- Recurring expense date calculation
- Mileage deduction calculation

### Integration Tests
- POST /api/expenses — valid and invalid inputs
- POST /api/expenses/scan-receipt — mock AI response
- Budget alert trigger at 75%, 90%, 100%
- QuickBooks sync mapping

### E2E Tests (Critical Flows)
1. Scan receipt → review → save → appears in list
2. Add manual expense → appears in dashboard summary
3. Filter expense list by category
4. Set budget → add expenses until budget exceeded → see alert
5. Generate and export PDF report

### Accessibility (WCAG 2.1 AA)
- All touch targets minimum 44×44px
- Color is never the sole indicator (use text + icon alongside color)
- Screen reader labels on all interactive elements
- Sufficient color contrast: text on white ≥ 4.5:1

***

## 18. Appendix: Grooming-Specific Notes for Implementation

1. **Mobile groomer flag on shop profile:** If `shop.isM mobile === true`, show Vehicle & Mileage as the top category and surface the mileage tracker prominently.

2. **IRS mileage rate:** Store current IRS standard mileage rate in app config (not hardcoded). Update annually. Current: $0.67/mile (2024).[^20]

3. **Seasonal patterns:** Dog grooming has seasonal revenue spikes (summer, holidays). The trend chart should show a full 12-month view by default to capture seasonal variance.

4. **Supplies per-dog cost insight** (advanced): Future feature — link supply expenses to appointment volume to calculate average supply cost per groom. This is a workflow some groomers track manually.[^23]

5. **Pet loss sympathy gifts:** Add "Pet Condolences / Gifts" as a default subcategory under "Other." This is a real expense category used by grooming businesses.[^3]

6. **Staff commission tracking:** Staff payroll and commission expenses link to the payroll module. Expense records for payroll should be auto-generated from payroll run confirmations, not entered manually.

7. **Multi-location:** All queries must filter by `shopId`. Analytics should support "All Locations" aggregate view for owners with multiple shops.

---

## References

1. [The Best Pet Grooming Software of 2026: Editor's Picks](https://www.thedailygroomer.com/blog/the-best-pet-grooming-software-of-2026-editors-picks) - We reviewed dozens of pet grooming platforms to reveal the top picks for 2026.

2. [MoeGo Accounting - Comprehensive Financial Solutions](https://wiki.moego.pet/accounting/) - Yes, MoeGo provides full-service bookkeeping in addition to automated accounting features. ... accou...

3. [Tracking your pet grooming expenses in Groomsoft](https://blog.groomsoft.com/tracking-your-pet-grooming-expenses-in-groomsoft/) - Doing this allows Groomsoft to show you reports with Expenses totaled by category. This is great for...

4. [Top 10 Best Dog Grooming Business Software of 2026 - WifiTalents](https://wifitalents.com/best/dog-grooming-business-software/) - Comparison Table. This comparison table explores top dog grooming business software tools, such as G...

5. [Top 10 Best Pet Grooming Management Software of 2026 - Gitnux](https://gitnux.org/best/pet-grooming-management-software/) - This comparison table outlines top tools like Gingr, MoeGo, DaySmart Pet, ProPet Software, PetExec, ...

6. [Grooming software : r/doggrooming - Reddit](https://www.reddit.com/r/doggrooming/comments/185ztlj/grooming_software/) - • 2y ago. Check out GrooMore. By far the best bang for your buck when factoring features, price, cus...

7. [Best Dog Grooming Software for Busy Pet Professionals: 2026 Guide](https://www.moego.pet/blog/best-dog-grooming-software-2026) - Looking for the best dog grooming software? Learn the essential features, compare options, and see h...

8. [Best Pet Grooming Software 2026: Top 7 Platforms Compared for ...](https://www.animalo.com/blog/pet-grooming-software-ultimate-2026-guide-for-salons) - Pet grooming software is an all-in-one digital tool designed to help salon and mobile groomers manag...

9. [Best Expense Tracking Apps for Small Businesses in 2026 - Expensify](https://use.expensify.com/resource-center/guides/best-business-expense-tracking-app) - Expensify: Best business expense tracker app overall · Navan: Travel-focused expense platform · Ramp...

10. [6 Must-Have Features for Your Expense Reporting App - Expensify](https://use.expensify.com/blog/6-must-have-features-for-your-expense-reporting-app) - A top-tier expense reporting app should include AI-driven receipt scanning that captures details ins...

11. [The 12 Best Receipt Scanning Apps for Ultimate Expense Tracking ...](https://receiptmake.com/blog/best-receipt-scanning-apps) - Discover the best receipt scanning apps of 2026. Our guide ranks the top 12 tools for OCR accuracy, ...

12. [Top 13 Best Receipt Scanner Apps in 2025](https://nanonets.com/blog/top-receipt-scanner-apps/) - Looking for the best receipt scanner app? Compare and find out the right app in this review guide of...

13. [Zoho Expense vs Expensify: Comparison & Review (2026)](https://happay.com/blog/zoho-expense-vs-expensify/) - Using the Expensify software, you can capture receipts with a mobile device, track mileage, set expe...

14. [What are the Best Apps for Business Expenses for Mobiles](https://www.biz2credit.com/software-loans/best-apps-business-expenses-mobile) - Zoho Expense: Budget-friendly and feature-rich. Zoho Expense is another business expense app favorit...

15. [ReceiptIn - AI Receipt Scanning App & Expense Tracker | Smart ...](https://www.receiptin.com) - Track expenses effortlessly with AI-powered receipt scanning. Automatic categorization and budget in...

16. [Expense AI - Expense Tracker - Apps on Google Play](https://play.google.com/store/apps/details?id=ai.myexpense.app&hl=en_US) - Take control of your finances with Expense AI, our app uses Artificial Intelligence to help you make...

17. [Expense AI - Smart Expense Tracking with AI-Powered Receipt ...](https://expenseai.app) - Expense AI is an AI-powered expense tracking app that simplifies managing your expenses. Easily trac...

18. [Expense Management Trends for 2026: The Rise of Automation and ...](https://www.mobilexpense.com/en/blog/expense-management-trends-2026) - Discover the future of expense management with trends in automation, AI, mobile-first solutions, UX ...

19. [List of Deductible Expense Categories for a Dog Grooming Business](https://bigez.com/expense-category-list-to-use-for-your-dog-groomer-business/) - Advertising & Promotion; Bank Fees & Interest; Car & Truck; Contract Labor; Donations; Dues, Fees, L...

20. [Pet Grooming Tax Deductions Guide](https://hellobooks.ai/blog/top-tax-deductions-for-pet-grooming-business-owners) - A practical guide to pet grooming tax deductions, write offs, and recordkeeping to reduce taxable in...

21. [Accounting for Dog Groomers | Pasco Bookkeeping](https://pascobookkeeping.com/accounting-for-dog-groomers/) - Categorizing Your Costs. Breaking down expenses into categories (e.g., supplies, utilities, payroll,...

22. [Pet Grooming Scheduling Software: Buying Guide + ROI Tool - MoeGo](https://www.moego.pet/blog/pet-grooming-scheduling-software) - Best Overall: MoeGo (4.9/5) - Purpose-built for pet pros, $49-239/month · Budget Option: Basic booki...

23. [Grooming Business Costs; Parts and Labor - PetEdge](https://www.petedge.com/blog/grooming-business-costs-parts-and-labor/) - Say you do around 90 coated dogs a month. If that type of shampoo costs you $60 per gallon and you u...

