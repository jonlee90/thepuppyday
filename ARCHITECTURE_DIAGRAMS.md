# Architecture Diagrams - The Puppy Day

## Database Schema Diagram

```mermaid
erDiagram
    auth_users ||--|| users : "extends"
    users ||--o{ pets : "owns"
    users ||--o{ appointments : "books"
    users ||--|| customer_loyalty : "has"
    users ||--o{ customer_memberships : "subscribes"

    pets }o--|| breeds : "belongs to"
    pets ||--o{ appointments : "scheduled for"

    appointments }o--|| services : "uses"
    appointments }o--|| users : "groomed by"
    appointments ||--o{ appointment_addons : "includes"
    appointments ||--o| report_cards : "generates"
    appointments ||--o{ loyalty_punches : "earns"

    services ||--o{ service_prices : "priced by size"
    addons ||--o{ appointment_addons : "added to"

    customer_loyalty ||--o{ loyalty_punches : "tracks"
    customer_loyalty ||--o{ loyalty_redemptions : "redeems"

    memberships ||--o{ customer_memberships : "subscribed by"

    users {
        uuid id PK
        text email UK
        text first_name
        text last_name
        text role
        jsonb preferences
    }

    pets {
        uuid id PK
        uuid owner_id FK
        text name
        uuid breed_id FK
        text size
        decimal weight_lbs
    }

    appointments {
        uuid id PK
        uuid customer_id FK
        uuid pet_id FK
        uuid service_id FK
        timestamptz scheduled_at
        text status
        decimal total_price
    }

    services {
        uuid id PK
        text name
        integer duration_minutes
    }

    service_prices {
        uuid id PK
        uuid service_id FK
        text size
        decimal price
    }

    report_cards {
        uuid id PK
        uuid appointment_id FK
        text mood
        text coat_condition
        integer rating
    }

    customer_loyalty {
        uuid id PK
        uuid customer_id FK
        integer current_punches
        integer total_visits
        integer free_washes_earned
    }
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant N as Next.js Server
    participant S as Supabase Auth
    participant D as Database

    U->>B: Navigate to /login
    B->>N: Request login page
    N->>B: Render login form

    U->>B: Enter credentials
    B->>S: signInWithPassword()

    alt Valid Credentials
        S->>D: Verify user
        D->>S: User data
        S->>B: Session + JWT
        B->>B: Store session cookie

        B->>N: Request /dashboard
        N->>S: Verify session
        S->>N: User authenticated
        N->>D: Fetch user data
        D->>N: User profile
        N->>B: Render dashboard
        B->>U: Show dashboard
    else Invalid Credentials
        S->>B: Error: Invalid credentials
        B->>U: Show error message
    end
```

## Customer Portal Data Flow

```mermaid
flowchart TD
    Start([User visits /dashboard]) --> Auth{Authenticated?}

    Auth -->|No| Login[Redirect to /login]
    Login --> SignIn[Sign in with email/password]
    SignIn --> SetSession[Set session cookie]
    SetSession --> Dashboard

    Auth -->|Yes| Dashboard[Load Dashboard Page]

    Dashboard --> FetchUser[Fetch user from public.users]
    Dashboard --> FetchPets[Fetch pets]
    Dashboard --> FetchAppts[Fetch appointments]
    Dashboard --> FetchLoyalty[Fetch loyalty data]
    Dashboard --> FetchMembership[Fetch membership]

    FetchUser --> RLS1{RLS Check}
    FetchPets --> RLS2{RLS Check}
    FetchAppts --> RLS3{RLS Check}
    FetchLoyalty --> RLS4{RLS Check}
    FetchMembership --> RLS5{RLS Check}

    RLS1 -->|auth.uid matches| UserData[User profile data]
    RLS2 -->|owner_id matches| PetsData[User's pets]
    RLS3 -->|customer_id matches| ApptsData[User's appointments]
    RLS4 -->|customer_id matches| LoyaltyData[Loyalty status]
    RLS5 -->|customer_id matches| MemberData[Membership info]

    UserData --> Render[Render Dashboard]
    PetsData --> Render
    ApptsData --> Render
    LoyaltyData --> Render
    MemberData --> Render

    Render --> Display([Show dashboard to user])
```

## Row Level Security (RLS) Flow

```mermaid
flowchart LR
    Query[Database Query] --> RLS{RLS Enabled?}

    RLS -->|Yes| CheckAuth{User Authenticated?}
    RLS -->|No| DirectQuery[Direct Query]

    CheckAuth -->|No| Reject[Return Empty/Error]
    CheckAuth -->|Yes| GetUID[Get auth.uid from JWT]

    GetUID --> CheckPolicy{Check RLS Policy}

    CheckPolicy -->|Customer| CustomerPolicy[Filter: owner_id = auth.uid]
    CheckPolicy -->|Admin| AdminPolicy[No filter - see all]
    CheckPolicy -->|Public Table| PublicPolicy[Filter: is_active = true]

    CustomerPolicy --> FilteredData[Return filtered data]
    AdminPolicy --> AllData[Return all data]
    PublicPolicy --> PublicData[Return public data]

    DirectQuery --> AllData
    Reject --> Empty([Empty result set])
    FilteredData --> Result([Query result])
    AllData --> Result
    PublicData --> Result
```

## Booking Flow (Future - Phase 3)

```mermaid
sequenceDiagram
    participant C as Customer
    participant UI as Booking Widget
    participant API as Next.js API
    participant DB as Supabase DB
    participant Email as Email Service

    C->>UI: Start booking
    UI->>API: GET /api/services
    API->>DB: Fetch services & prices
    DB->>API: Services data
    API->>UI: Display services

    C->>UI: Select service
    UI->>API: GET /api/availability?date=X
    API->>DB: Check appointments
    DB->>API: Available slots
    API->>UI: Display time slots

    C->>UI: Select time & confirm
    UI->>API: POST /api/appointments
    API->>DB: Check availability again

    alt Slot Available
        DB->>API: Confirmed
        API->>DB: Create appointment
        DB->>API: Appointment created
        API->>Email: Send confirmation
        Email->>C: Confirmation email
        API->>UI: Success
        UI->>C: Show confirmation
    else Slot Taken
        DB->>API: Conflict
        API->>UI: Slot unavailable
        UI->>C: Offer waitlist
    end
```

## Loyalty System Flow

```mermaid
stateDiagram-v2
    [*] --> NewCustomer: First visit

    NewCustomer --> Active: Create loyalty record
    Active --> Punches: Earn punches

    Punches --> Punches: Visit (punch < threshold)
    Punches --> Earned: Visit (punch = threshold)

    Earned --> Earned: Additional visits
    Earned --> Redeemed: Redeem free wash

    Redeemed --> Active: Reset cycle

    state Punches {
        [*] --> Punch1: Visit 1
        Punch1 --> Punch2: Visit 2
        Punch2 --> Punch3: Visit 3
        Punch3 --> Punch9: ...
        Punch9 --> [*]: Visit 9
    }

    state Earned {
        note right of Earned: Customer has free wash available
    }
```

## Application Architecture

```mermaid
graph TB
    subgraph "Client Side (Browser)"
        UI[React Components]
        Client[Supabase Client]
        Auth[useAuth Hook]
    end

    subgraph "Server Side (Next.js)"
        Server[Server Components]
        API[API Routes]
        ServerClient[Supabase Server Client]
        Middleware[Auth Middleware]
    end

    subgraph "Supabase"
        AuthService[Auth Service]
        Database[(PostgreSQL)]
        Storage[Storage]
        Realtime[Realtime]
    end

    UI --> Client
    UI --> Server
    Server --> ServerClient
    API --> ServerClient
    Client --> AuthService
    ServerClient --> AuthService
    ServerClient --> Database
    Client --> Database
    Middleware --> AuthService

    AuthService --> Database
    Storage --> Database

    style UI fill:#e1f5ff
    style Server fill:#ffe1f5
    style Database fill:#f5ffe1
```

## Customer Portal Page Structure

```mermaid
graph TD
    Root[Root Layout] --> CustomerLayout[Customer Layout]

    CustomerLayout --> Auth{useAuth Check}

    Auth -->|Not Authenticated| LoginRedirect[Redirect to /login]
    Auth -->|Not Customer Role| RoleRedirect[Redirect by role]
    Auth -->|Authenticated Customer| Pages[Customer Pages]

    Pages --> Dashboard[Dashboard Page]
    Pages --> Appointments[Appointments Page]
    Pages --> Pets[Pets Page]
    Pages --> Loyalty[Loyalty Page]
    Pages --> Membership[Membership Page]
    Pages --> Profile[Profile Page]
    Pages --> ReportCards[Report Cards Page]

    Dashboard --> DashboardData[Fetch: appointments, loyalty, pets, membership]
    Appointments --> AppointmentsData[Fetch: appointments with joins]
    Pets --> PetsData[Fetch: pets with breeds]
    Loyalty --> LoyaltyData[Fetch: loyalty, punches, redemptions]
    Membership --> MembershipData[Fetch: memberships, current subscription]
    Profile --> ProfileData[Fetch: user profile, preferences]
    ReportCards --> ReportCardsData[Fetch: report cards with appointments]

    style CustomerLayout fill:#ffcccc
    style Pages fill:#ccffcc
    style Auth fill:#ffcc99
```

## RLS Policy Structure

```mermaid
graph LR
    Table[Database Table] --> RLS[RLS Enabled]

    RLS --> Policy1[SELECT Policy]
    RLS --> Policy2[INSERT Policy]
    RLS --> Policy3[UPDATE Policy]
    RLS --> Policy4[DELETE Policy]

    Policy1 --> Check1{Who can SELECT?}
    Policy2 --> Check2{Who can INSERT?}
    Policy3 --> Check3{Who can UPDATE?}
    Policy4 --> Check4{Who can DELETE?}

    Check1 --> Customer1[Customers: Own data]
    Check1 --> Admin1[Admins: All data]
    Check1 --> Public1[Public: Active items]

    Check2 --> Customer2[Customers: Own records]
    Check2 --> Admin2[Admins: All records]

    Check3 --> Customer3[Customers: Own records]
    Check3 --> Admin3[Admins: All records]

    Check4 --> Customer4[Customers: Own records]
    Check4 --> Admin4[Admins: All records]

    Customer1 --> Filter1[USING owner_id = auth.uid]
    Customer2 --> Filter2[WITH CHECK owner_id = auth.uid]
    Customer3 --> Filter3[USING owner_id = auth.uid]
    Customer4 --> Filter4[USING owner_id = auth.uid]

    Admin1 --> Filter5[USING role IN admin, groomer]
    Admin2 --> Filter6[WITH CHECK role = admin]
    Admin3 --> Filter7[USING role = admin]
    Admin4 --> Filter8[USING role = admin]

    style RLS fill:#ffcccc
    style Policy1 fill:#ccffcc
    style Policy2 fill:#ccccff
    style Policy3 fill:#ffffcc
    style Policy4 fill:#ffccff
```

## Deployment Architecture (Future)

```mermaid
graph TB
    subgraph "Production Environment"
        Vercel[Vercel Edge Network]
        NextApp[Next.js Application]
        Supabase[Supabase Production]
        Stripe[Stripe API]
        Resend[Resend Email]
        Twilio[Twilio SMS]
    end

    subgraph "CDN & Edge"
        CDN[CloudFlare CDN]
        Edge[Edge Functions]
    end

    Users[Users] --> CDN
    CDN --> Vercel
    Vercel --> NextApp

    NextApp --> Supabase
    NextApp --> Stripe
    NextApp --> Resend
    NextApp --> Twilio

    Supabase --> DB[(PostgreSQL)]
    Supabase --> Storage[Object Storage]
    Supabase --> Auth[Auth Service]

    Edge --> NextApp
    Edge --> Supabase

    style Users fill:#e1f5ff
    style NextApp fill:#ffe1f5
    style Supabase fill:#f5ffe1
```

## Summary

These diagrams illustrate:

1. **Database Schema** - All tables and relationships
2. **Authentication Flow** - How users sign in and get authenticated
3. **Customer Portal Data Flow** - How data is fetched and filtered
4. **RLS Flow** - How Row Level Security protects data
5. **Booking Flow** - Future booking system implementation
6. **Loyalty System** - State machine for punch card system
7. **Application Architecture** - Client/Server/Database layers
8. **Page Structure** - Customer portal page hierarchy
9. **RLS Policy Structure** - How policies are organized
10. **Deployment Architecture** - Production infrastructure (future)

All diagrams use Mermaid syntax and can be viewed in:
- GitHub (automatic rendering)
- VS Code (with Mermaid preview extension)
- Online tools (mermaid.live)
