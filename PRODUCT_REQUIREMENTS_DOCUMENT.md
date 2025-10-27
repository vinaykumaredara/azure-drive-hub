# Product Requirements Document (PRD)
## RP CARS - Car Rental Platform

**Version:** 1.0  
**Last Updated:** October 26, 2025  
**Project Status:** Production Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [Storage Buckets](#storage-buckets)
5. [Design System & Color Palette](#design-system--color-palette)
6. [User Roles & Permissions](#user-roles--permissions)
7. [Booking Workflow](#booking-workflow)
8. [Feature Specifications](#feature-specifications)
9. [Security & Compliance](#security--compliance)
10. [API Endpoints](#api-endpoints)
11. [Technical Stack](#technical-stack)

---

## Executive Summary

**RP CARS** is a full-stack car rental platform built with modern web technologies, featuring real-time updates, secure authentication, role-based access control, and a seamless booking experience. The platform serves two primary user types: **Customers** (renters) and **Admins** (car rental business owners/managers).

### Key Features:
- **Real-time car availability updates**
- **Multi-step booking flow with payment integration**
- **Admin dashboard for comprehensive business management**
- **Secure license verification with OCR**
- **Multi-currency support (INR primary)**
- **Promo code system**
- **Communication center with chat functionality**
- **Financial management and analytics**

---

## System Architecture

### Tech Stack

**Frontend:**
- **Framework:** React 18.3.1 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** TanStack Query (React Query) v5.90.2
- **Routing:** React Router v6.30.1
- **Animations:** Framer Motion v12.23.22
- **Icons:** Lucide React v0.462.0

**Backend:**
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth (Email/Password + Google OAuth)
- **Storage:** Supabase Storage
- **Edge Functions:** Deno-based serverless functions
- **Real-time:** Supabase Realtime (WebSocket)

**Payment Integrations:**
- Stripe
- Razorpay

---

## Database Schema

### 1. **users** Table
Stores user profile information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | - | Primary key, references auth.users |
| created_at | timestamptz | Yes | now() | Account creation timestamp |
| full_name | text | Yes | - | User's full name |
| phone | text | Yes | - | Contact phone number |

**RLS Policies:**
- Users can insert their own profile
- Users can view their own profile or admins can view all
- Users can update their own profile or admins can update all

---

### 2. **user_roles** Table
Role-based access control system.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | References auth.users(id) |
| role | app_role | No | - | Enum: 'admin', 'moderator', 'user' |
| created_at | timestamptz | Yes | now() | Role assignment timestamp |

**Unique Constraint:** (user_id, role)

**RLS Policies:**
- Only admins can insert/update/delete roles
- Users can view their own roles, admins can view all

---

### 3. **cars** Table
Central table for vehicle inventory.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| title | text | No | - | Car display name |
| make | text | Yes | - | Manufacturer (e.g., Toyota) |
| model | text | Yes | - | Model name (e.g., Camry) |
| year | integer | Yes | - | Manufacturing year |
| seats | integer | Yes | - | Seating capacity |
| fuel_type | text | Yes | - | Petrol/Diesel/Electric/Hybrid |
| transmission | text | Yes | - | Manual/Automatic |
| price_per_day | numeric | No | - | Daily rental price |
| price_per_hour | numeric | Yes | - | Hourly rental price |
| price_in_paise | bigint | Yes | - | Price in smallest currency unit |
| service_charge | numeric | Yes | 0 | Service charge amount |
| currency | text | Yes | 'INR' | Currency code (ISO 4217) |
| description | text | Yes | - | Car description |
| location_city | text | Yes | - | Availability location |
| status | text | Yes | 'active' | 'active', 'published', 'draft', 'maintenance' |
| booking_status | text | Yes | 'available' | 'available' or 'booked' |
| booked_by | uuid | Yes | - | User who booked the car |
| booked_at | timestamptz | Yes | - | Booking timestamp |
| image_urls | text[] | Yes | - | Public URLs of car images |
| image_paths | text[] | Yes | ARRAY[]::text[] | Storage paths for images |
| created_at | timestamptz | Yes | now() | Record creation timestamp |

**Indexes:**
- `idx_cars_booking_status` on booking_status
- `idx_cars_booked_by` on booked_by
- `idx_cars_booked_at` on booked_at
- `idx_cars_price_in_paise` on price_in_paise
- `idx_cars_status` on status
- `idx_cars_currency` on currency

**RLS Policies:**
- Public users can SELECT published cars
- Admins have ALL privileges

---

### 4. **bookings** Table
Stores all booking records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | Yes | - | Customer who made booking |
| car_id | uuid | Yes | - | Booked car reference |
| start_datetime | timestamptz | No | - | Rental start time |
| end_datetime | timestamptz | No | - | Rental end time |
| hold_expires_at | timestamptz | Yes | - | Temporary hold expiration |
| total_amount | numeric | Yes | - | Total booking cost |
| total_amount_in_paise | bigint | Yes | - | Total in smallest currency unit |
| status | text | No | 'pending' | 'pending', 'confirmed', 'cancelled', 'completed' |
| payment_id | text | Yes | - | External payment reference |
| currency | text | Yes | 'INR' | Currency code |
| created_at | timestamptz | Yes | now() | Booking creation timestamp |

**Indexes:**
- `idx_bookings_currency` on currency

**RLS Policies:**
- Users can INSERT their own bookings
- Users can SELECT their own bookings, admins can view all
- Users/admins can UPDATE their own bookings
- Admins can DELETE bookings

---

### 5. **payments** Table
Payment transaction records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| booking_id | uuid | Yes | - | Associated booking |
| amount | numeric | Yes | - | Payment amount |
| amount_in_paise | bigint | Yes | - | Amount in smallest unit |
| status | text | Yes | - | 'pending', 'completed', 'failed', 'refunded' |
| gateway | text | Yes | - | 'stripe' or 'razorpay' |
| provider_transaction_id | text | Yes | - | External payment ID |
| currency | text | Yes | 'INR' | Currency code |
| created_at | timestamptz | Yes | now() | Payment timestamp |

**Indexes:**
- `idx_payments_currency` on currency

**RLS Policies:**
- Authenticated users can INSERT payments
- Users can view payments for their bookings, admins view all

---

### 6. **licenses** Table
Driver license information and verification.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | Yes | - | License owner |
| storage_path | text | Yes | - | Path in Supabase Storage |
| ocr_text | text | Yes | - | Extracted text from OCR |
| ocr_confidence | numeric | Yes | - | OCR confidence score (0-100) |
| expires_at | date | Yes | - | License expiration date |
| verified | boolean | Yes | false | Admin verification status |
| created_at | timestamptz | Yes | now() | Upload timestamp |

**RLS Policies:**
- Users can INSERT/UPDATE their own licenses
- Users can view their own licenses, admins view all
- Admins can DELETE licenses

---

### 7. **promo_codes** Table
Promotional discount codes.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| code | text | No | - | Unique promo code |
| discount_percent | integer | Yes | - | Percentage discount (0-100) |
| discount_flat | numeric | Yes | - | Flat discount amount |
| valid_from | date | Yes | - | Code activation date |
| valid_to | date | Yes | - | Code expiration date |
| active | boolean | Yes | true | Whether code is active |
| usage_limit | integer | Yes | 0 | Max usage count (0 = unlimited) |
| times_used | integer | Yes | 0 | Current usage count |
| last_used_at | timestamptz | Yes | - | Last usage timestamp |
| created_at | timestamptz | Yes | now() | Code creation timestamp |

**Indexes:**
- Unique constraint on `code`

**RLS Policies:**
- Only admins can SELECT/INSERT/UPDATE/DELETE promo codes

**Database Function:**
- `validate_promo_code(code_input text)` - Validates and returns promo code details

---

### 8. **messages** Table
Communication/chat system.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| room_id | text | No | - | Chat room identifier |
| sender_id | uuid | Yes | - | Message sender |
| message | text | Yes | - | Message content |
| attachments | text[] | Yes | - | Attachment URLs |
| created_at | timestamptz | Yes | now() | Message timestamp |

**RLS Policies:**
- Authenticated users can INSERT messages
- Users can view messages in their rooms (support: or booking:)
- Admins can view all messages

---

### 9. **complaints** Table
Customer complaint/issue tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | Yes | - | Complainant user |
| booking_id | uuid | Yes | - | Related booking (optional) |
| issue | text | Yes | - | Complaint description |
| status | text | Yes | 'open' | 'open', 'in_progress', 'resolved', 'closed' |
| admin_note | text | Yes | - | Admin response/notes |
| created_at | timestamptz | Yes | now() | Complaint creation timestamp |

**RLS Policies:**
- Users can manage their own complaints
- Admins can manage all complaints

---

### 10. **maintenance** Table
Vehicle maintenance scheduling.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| car_id | uuid | Yes | - | Car under maintenance |
| start_date | timestamptz | No | - | Maintenance start |
| end_date | timestamptz | No | - | Maintenance end |
| notes | text | Yes | - | Maintenance details |
| created_at | timestamptz | Yes | now() | Record creation timestamp |

**RLS Policies:**
- Only admins can SELECT/INSERT/UPDATE/DELETE maintenance records

---

### 11. **audit_logs** Table
System audit trail for compliance and security.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | Yes | - | User who performed action |
| action | text | No | - | Action type (e.g., 'car_booked') |
| description | text | Yes | - | Human-readable description |
| metadata | jsonb | Yes | - | Additional data |
| timestamp | timestamptz | Yes | now() | Action timestamp |

**RLS Policies:**
- Users can view their own audit logs
- Admins can view all audit logs
- Authenticated users can INSERT logs (for self)
- Admins can UPDATE/DELETE logs

---

### 12. **idempotency_keys** Table
Prevents duplicate operations (payments, bookings).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| key | text | No | - | Primary key - unique idempotency key |
| user_id | uuid | Yes | - | User who initiated request |
| request_body | jsonb | Yes | - | Original request payload |
| response_body | jsonb | Yes | - | Cached response |
| status_code | integer | Yes | - | HTTP status code |
| created_at | timestamptz | Yes | now() | Key creation timestamp |
| expires_at | timestamptz | Yes | now() + 7 days | Key expiration |

**RLS Policies:**
- Users can view their own keys
- Service role manages all keys

**Database Function:**
- `cleanup_expired_idempotency_keys()` - Removes expired keys

---

## Storage Buckets

### 1. **cars-photos** (Public Bucket)
**Purpose:** Store car images for public display

**Configuration:**
- Public access: Yes
- Max file size: 10MB
- Allowed formats: JPG, PNG, WEBP
- Folder structure: `/{car_id}/{image_filename}`

**RLS Policies:**
- Anyone can SELECT (public read)
- Admins can INSERT/UPDATE/DELETE

**Usage:**
```typescript
// Upload car image
const { data, error } = await supabase.storage
  .from('cars-photos')
  .upload(`${carId}/${file.name}`, file);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('cars-photos')
  .getPublicUrl(`${carId}/${file.name}`);
```

---

### 2. **license-uploads** (Private Bucket)
**Purpose:** Store driver license documents for verification

**Configuration:**
- Public access: No
- Max file size: 5MB
- Allowed formats: JPG, PNG, PDF
- Folder structure: `/{user_id}/{license_id}`

**RLS Policies:**
- Users can upload their own licenses
- Users can view their own licenses
- Admins can view all licenses

**Usage:**
```typescript
// Upload license
const { data, error } = await supabase.storage
  .from('license-uploads')
  .upload(`${userId}/${licenseId}.jpg`, file);

// Get signed URL (temporary access)
const { data: { signedUrl } } = await supabase.storage
  .from('license-uploads')
  .createSignedUrl(`${userId}/${licenseId}.jpg`, 3600); // 1 hour
```

---

### 3. **chat-attachments** (Private Bucket)
**Purpose:** Store file attachments in customer-admin communications

**Configuration:**
- Public access: No
- Max file size: 20MB
- Allowed formats: JPG, PNG, PDF, DOC, DOCX, TXT
- Folder structure: `/{room_id}/{message_id}/{filename}`

**RLS Policies:**
- Users can upload to their own chat rooms
- Users can view their own room attachments
- Admins can view all attachments

**Usage:**
```typescript
// Upload attachment
const { data, error } = await supabase.storage
  .from('chat-attachments')
  .upload(`${roomId}/${messageId}/${file.name}`, file);

// Generate signed URL
const { data: { signedUrl } } = await supabase.storage
  .from('chat-attachments')
  .createSignedUrl(`${roomId}/${messageId}/${file.name}`, 3600);
```

---

## Design System & Color Palette

### Brand Identity
**Theme:** Blue & Purple (Trust, Speed, Premium)

### Color System (HSL Format)

#### Primary Colors

| Color Name | HSL Value | Hex | Usage |
|------------|-----------|-----|-------|
| **Primary (Indigo)** | `hsl(250, 84%, 60%)` | `#6366F1` | Main brand color, CTAs, links |
| **Primary Foreground** | `hsl(0, 0%, 100%)` | `#FFFFFF` | Text on primary background |
| **Primary Hover** | `hsl(250, 84%, 55%)` | - | Hover state for primary elements |
| **Primary Light** | `hsl(250, 84%, 96%)` | - | Light backgrounds, highlights |

#### Accent Colors

| Color Name | HSL Value | Hex | Usage |
|------------|-----------|-----|-------|
| **Accent Purple (Violet)** | `hsl(262, 100%, 65%)` | `#8B5CF6` | Secondary actions, gradients |
| **Accent Purple Foreground** | `hsl(0, 0%, 100%)` | `#FFFFFF` | Text on accent backgrounds |

#### Semantic Colors

| Color Name | HSL Value | Purpose |
|------------|-----------|---------|
| **Success** | `hsl(142, 76%, 36%)` | Successful actions, confirmations |
| **Success Foreground** | `hsl(0, 0%, 100%)` | Text on success backgrounds |
| **Warning** | `hsl(38, 92%, 50%)` | Warnings, cautions |
| **Warning Foreground** | `hsl(0, 0%, 100%)` | Text on warning backgrounds |
| **Destructive** | `hsl(0, 84%, 60%)` | Errors, delete actions |
| **Destructive Foreground** | `hsl(0, 0%, 100%)` | Text on destructive backgrounds |

#### Neutral Colors

| Color Name | HSL Value | Usage |
|------------|-----------|-------|
| **Background** | `hsl(0, 0%, 100%)` | Page background |
| **Foreground** | `hsl(230, 15%, 15%)` | Primary text |
| **Card** | `hsl(0, 0%, 100%)` | Card backgrounds |
| **Card Foreground** | `hsl(230, 15%, 15%)` | Text on cards |
| **Muted** | `hsl(210, 17%, 96%)` | Disabled states, subtle backgrounds |
| **Muted Foreground** | `hsl(215, 13%, 55%)` | Secondary text |
| **Border** | `hsl(214, 32%, 91%)` | Element borders |
| **Input** | `hsl(214, 32%, 91%)` | Input borders |
| **Ring** | `hsl(217, 100%, 56%)` | Focus rings |

### Gradients

```css
--gradient-primary: linear-gradient(135deg, hsl(250deg 84% 60%) 0%, hsl(262deg 100% 65%) 100%);
--gradient-hero: linear-gradient(135deg, hsl(250deg 84% 60%) 0%, hsl(262deg 100% 65%) 50%, hsl(270deg 100% 50%) 100%);
--gradient-card: linear-gradient(145deg, hsl(0deg 0% 100%) 0%, hsl(250deg 20% 98%) 100%);
--gradient-glass: linear-gradient(145deg, hsl(250deg 84% 60% / 10%) 0%, hsl(262deg 100% 65% / 5%) 100%);
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 hsl(217deg 100% 56% / 5%);
--shadow-md: 0 4px 6px -1px hsl(217deg 100% 56% / 10%), 0 2px 4px -1px hsl(217deg 100% 56% / 6%);
--shadow-lg: 0 10px 15px -3px hsl(217deg 100% 56% / 10%), 0 4px 6px -2px hsl(217deg 100% 56% / 5%);
--shadow-xl: 0 20px 25px -5px hsl(217deg 100% 56% / 10%), 0 10px 10px -5px hsl(217deg 100% 56% / 4%);
--shadow-card: 0 4px 20px -2px hsl(217deg 100% 56% / 8%);
--shadow-hover: 0 8px 30px -4px hsl(217deg 100% 56% / 15%);
```

### Typography

**Font Family:** Inter, system-ui, sans-serif

**Font Weights:**
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Spacing Scale

```
4px   -> 1
8px   -> 2
12px  -> 3
16px  -> 4
20px  -> 5
24px  -> 6
32px  -> 8
40px  -> 10
48px  -> 12
```

### Border Radius

```css
--radius: 0.5rem; (8px)
lg: var(--radius)
md: calc(var(--radius) - 2px) (6px)
sm: calc(var(--radius) - 4px) (4px)
```

### Animations

**Timing Functions:**
```css
--animate-fast: 150ms
--animate-normal: 200ms
--animate-slow: 300ms
--animate-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
--animate-smooth: cubic-bezier(0.4, 0, 0.2, 1)
```

**Keyframe Animations:**
- `fade-in`: Opacity 0→1 with translateY
- `slide-up`: Slide up with opacity
- `scale-in`: Scale 0.95→1 with opacity
- `bounce-in`: Bounce effect with scale
- `accordion-down/up`: Smooth accordion animation

### Dark Mode

The system includes full dark mode support with inverted colors:

```css
.dark {
  --background: hsl(222.2, 84%, 4.9%);
  --foreground: hsl(210, 40%, 98%);
  --primary: hsl(210, 40%, 98%);
  /* ... additional dark mode variables */
}
```

---

## User Roles & Permissions

### Role Types (Enum: app_role)

1. **admin** - Full system access
2. **moderator** - Limited admin functions
3. **user** - Standard customer

### Role-Based Access Control (RBAC)

#### Admin Role Permissions

**Car Management:**
- ✅ Create new cars
- ✅ Update any car
- ✅ Delete cars
- ✅ View all cars (including drafts)
- ✅ Manage car images

**Booking Management:**
- ✅ View all bookings
- ✅ Update booking status
- ✅ Cancel any booking
- ✅ Delete bookings

**User Management:**
- ✅ View all users
- ✅ Assign/remove roles
- ✅ View user licenses
- ✅ Verify licenses

**Financial:**
- ✅ View all payments
- ✅ Generate financial reports
- ✅ Create/manage promo codes

**System:**
- ✅ View audit logs
- ✅ Manage maintenance schedules
- ✅ Access analytics dashboard

#### User Role Permissions

**Browsing:**
- ✅ View published cars
- ✅ Search and filter cars

**Booking:**
- ✅ Create bookings for available cars
- ✅ View own bookings
- ✅ Cancel own bookings (before start date)

**Profile:**
- ✅ Update own profile
- ✅ Upload driver license
- ✅ View own license status

**Communication:**
- ✅ Send messages in own chat rooms
- ✅ Create complaints
- ✅ View own complaints

### Role Assignment

Roles are assigned through the `user_roles` table with the following logic:

**Automatic Role Assignment:**
- New users automatically receive `user` role via database trigger
- User `rpcars2025@gmail.com` automatically receives `admin` role on signup

**Manual Role Assignment:**
```sql
-- Grant admin role
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin'::app_role);
```

**Role Checking Functions:**

```sql
-- Check if user has specific role
SELECT public.has_role('user-uuid', 'admin'::app_role);

-- Check if current user is admin
SELECT public.is_admin();
```

---

## Booking Workflow

### Overview

The booking system follows a **4-step process** with temporary holds, payment integration, and confirmation.

### Step-by-Step Flow

#### **Step 1: Date & Time Selection**

**User Actions:**
1. Select pickup date
2. Select return date
3. Choose pickup time (hourly slots: 00:00 - 23:00)
4. Choose return time

**System Calculations:**
- Calculate rental duration in days (minimum 1 day)
- Calculate base rental cost: `pricePerDay × totalDays`
- Display estimated total

**Validation:**
- Start date ≥ today
- End date > start date
- Selected times must be valid (00:00 - 23:00)

**API Call:**
- None at this stage (client-side only)

---

#### **Step 2: Add Extras (Add-ons)**

**Available Extras:**

| Add-on | Price per Day | Description |
|--------|---------------|-------------|
| Professional Driver | ₹500 | Experienced driver for your trip |
| GPS Navigation | ₹200 | Built-in GPS with latest maps |
| Child Safety Seat | ₹150 | Safety seat for children |
| Premium Insurance | ₹300 | Comprehensive coverage (Recommended) |

**System Behavior:**
- **Create Booking Hold** when user proceeds from Step 1
- Hold expires after **10 minutes**
- Display hold expiration countdown timer
- Car is temporarily unavailable to other users

**Hold Creation API:**
```typescript
POST /api/create-hold
Body: {
  carId: string,
  startDate: string,
  endDate: string,
  userId: string
}
Response: {
  holdId: string,
  holdExpiry: string,
  bookingId: string
}
```

**Calculation:**
```typescript
// Add-ons total
addonsTotal = sum(selectedAddons.map(addon => addon.price × totalDays))

// Subtotal
subtotal = baseRental + addonsTotal

// Service charge (5% of subtotal)
serviceCharge = subtotal × 0.05

// Total
total = subtotal + serviceCharge
```

---

#### **Step 3: Payment Details**

**User Input:**
- Cardholder name
- Card number
- Expiry date (MM/YY)
- CVV

**Phone Number Collection:**
- If user doesn't have phone number in profile, show phone modal
- Validate phone number format
- Save phone number to user profile

**License Verification:**
- Check if user has uploaded and verified driver license
- If not verified, prompt license upload
- OCR processing extracts license details
- Admin manual verification required

**Payment Summary Display:**
```
Base Rental (X days)         ₹X,XXX
+ Professional Driver         ₹XXX
+ GPS Navigation             ₹XXX
+ Child Safety Seat          ₹XXX
+ Premium Insurance          ₹XXX
--------------------------------
Subtotal                     ₹X,XXX
Service Charge (5%)          ₹XXX
================================
TOTAL AMOUNT                 ₹X,XXX
```

**Payment Mode Options:**

1. **Full Payment:**
   - Charge 100% of total amount
   - Booking confirmed immediately

2. **Advance Payment (Hold Mode):**
   - Charge 10% of total amount
   - Remaining amount due before pickup
   - Hold converted to confirmed booking

**Payment Processing API:**
```typescript
POST /api/create-payment-intent
Body: {
  bookingId: string,
  amount: number,
  currency: 'INR',
  paymentMode: 'full' | 'hold'
}
Response: {
  paymentIntentId: string,
  clientSecret: string
}
```

**Payment Gateway Integration:**
- Primary: **Razorpay** (Indian market)
- Secondary: **Stripe** (International)

**Security Measures:**
- PCI-DSS compliant payment handling
- No card details stored in database
- Payment tokens stored in `payments` table
- 3D Secure authentication for high-value transactions

---

#### **Step 4: Confirmation**

**Success Actions:**
1. Release booking hold
2. Update booking status to `confirmed`
3. Create payment record
4. Update car `booking_status` to `booked`
5. Send confirmation email (future feature)
6. Generate booking ID

**Confirmation Display:**
```
✅ Booking Confirmed!

Booking ID: BK123456
Car: Toyota Camry 2023
Pickup: Jan 15, 2025 at 10:00 AM
Return: Jan 18, 2025 at 06:00 PM
Total Amount: ₹15,300

[View Booking Details] [Close]
```

**Database Updates:**
```sql
-- Update booking
UPDATE bookings 
SET status = 'confirmed', 
    payment_id = 'payment_xyz'
WHERE id = 'booking_id';

-- Update car
UPDATE cars 
SET booking_status = 'booked',
    booked_by = 'user_id',
    booked_at = NOW()
WHERE id = 'car_id';

-- Insert payment
INSERT INTO payments (booking_id, amount, status, gateway, ...)
VALUES (...);

-- Insert audit log
INSERT INTO audit_logs (action, user_id, metadata)
VALUES ('booking_confirmed', 'user_id', jsonb_build_object(...));
```

---

### Booking Hold System

**Purpose:** Prevent race conditions where multiple users try to book the same car simultaneously.

**Implementation:**

1. **Hold Creation:**
   - When user proceeds from Step 1 to Step 2
   - Creates temporary booking record with `status = 'hold'`
   - Sets `hold_expires_at` to `NOW() + 10 minutes`
   - Car becomes unavailable in search results

2. **Hold Expiration:**
   - Edge function runs every minute: `cleanup-expired-holds`
   - Deletes bookings where `hold_expires_at < NOW()` and `status = 'hold'`
   - Frees up car for other users

3. **Hold Conversion:**
   - Upon successful payment, status changes from `hold` to `confirmed`
   - `hold_expires_at` set to NULL

**Edge Function:**
```typescript
// supabase/functions/cleanup-expired-holds/index.ts
Deno.serve(async (req) => {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .delete()
    .eq('status', 'hold')
    .lt('hold_expires_at', new Date().toISOString());
  
  return new Response(JSON.stringify({ deleted: data?.length }));
});
```

---

### Booking States

| Status | Description | User Actions | Admin Actions |
|--------|-------------|--------------|---------------|
| `hold` | Temporary reservation (10 min) | Continue to payment | Can cancel |
| `pending` | Awaiting payment confirmation | Complete payment | Mark as confirmed |
| `confirmed` | Booking confirmed & paid | View details, cancel (24h before) | Cancel, modify |
| `active` | Currently in use (pickup completed) | - | Mark as completed |
| `completed` | Rental finished | Rate & review | - |
| `cancelled` | Booking cancelled | - | View refund details |

---

### Booking Cancellation Policy

**User-Initiated Cancellation:**
- **> 24 hours before pickup:** Full refund
- **< 24 hours before pickup:** 50% refund
- **After pickup:** No refund

**Admin-Initiated Cancellation:**
- Full refund to user
- Admin provides cancellation reason
- Logged in audit_logs

**Cancellation API:**
```typescript
POST /supabase/functions/cancel-booking
Body: {
  bookingId: string,
  reason: string
}
Response: {
  success: boolean,
  refundAmount: number,
  refundStatus: 'pending' | 'completed'
}
```

---

## Feature Specifications

### 1. Car Listing (Public)

**Features:**
- Display all published cars with status `published` and `booking_status = 'available'`
- Real-time updates via Supabase Realtime subscriptions
- Image carousel with navigation dots
- Filter by: make, model, seats, fuel type, transmission, price range
- Sort by: price (low/high), year, seats
- Pagination with virtual scrolling for performance

**Components:**
- `CarListing.tsx` - Main listing container
- `CarCard.tsx` - Individual car card
- `ImageCarousel.tsx` - Car image gallery
- `CarFilters.tsx` - Filter sidebar

---

### 2. Admin Dashboard

**Sections:**

#### 2.1 Car Management
- **Create Car:** Form with image upload (multi-file)
- **Edit Car:** Update car details and images
- **Delete Car:** Soft delete with confirmation dialog
- **Car List:** Table/card view with search and filters
- **Image Management:** Add/remove car images

#### 2.2 Booking Management
- **View All Bookings:** Table with filters (status, date range, user)
- **Booking Details:** Full booking information
- **Update Status:** Change booking status (pending → confirmed → active → completed)
- **Cancel Booking:** Refund processing

#### 2.3 Customer Management
- **User List:** All registered users
- **User Details:** Profile, bookings, payments, complaints
- **License Verification:** View and verify uploaded licenses

#### 2.4 Financial Management
- **Revenue Dashboard:** Total revenue, revenue by month/year
- **Payment History:** All payment transactions
- **Refund Management:** Process refunds

#### 2.5 Promo Code Management
- **Create Promo Codes:** Set percentage/flat discounts
- **Active Codes:** View and manage active codes
- **Usage Statistics:** Track promo code performance

#### 2.6 Analytics Dashboard
- **Key Metrics:**
  - Total bookings
  - Revenue (today, week, month, year)
  - Active rentals
  - Utilization rate
  - Top performing cars
- **Charts:** Line charts (revenue trend), bar charts (bookings by car)

#### 2.7 Communication Center
- **Chat Rooms:** Support chats with customers
- **Complaints:** View and respond to complaints
- **Notifications:** Real-time booking/payment alerts

#### 2.8 Maintenance Scheduler
- **Schedule Maintenance:** Set maintenance periods
- **Car Unavailability:** Auto-block cars during maintenance
- **Maintenance History:** View past maintenance records

---

### 3. User Dashboard

**Sections:**

#### 3.1 My Bookings
- **Upcoming Bookings:** Confirmed future rentals
- **Active Rentals:** Currently renting
- **Past Bookings:** Completed rentals with rating option
- **Cancelled Bookings:** View cancellation details

#### 3.2 My Profile
- **Edit Profile:** Update name, phone, email
- **License Upload:** Upload and verify driver license
- **Password Change:** Update password

#### 3.3 Payment History
- **All Payments:** Transaction history
- **Refunds:** View refund status

---

### 4. Authentication System

**Sign Up:**
- Email + Password
- Google OAuth
- Auto-create profile in `users` table via trigger
- Auto-assign `user` role

**Sign In:**
- Email + Password
- Google OAuth
- Redirect based on role:
  - Admin → `/admin/dashboard`
  - User → `/dashboard`

**Password Reset:**
- Email-based reset flow
- Supabase Auth handles token generation

**Session Management:**
- JWT tokens with 1 hour expiration
- Refresh tokens with 7 day expiration
- Auto-refresh before expiration

---

### 5. License Verification

**Upload Flow:**
1. User uploads license image (JPG/PNG/PDF)
2. File stored in `license-uploads` bucket
3. Edge function triggers OCR processing
4. Extract: name, license number, expiration date, address
5. Store OCR data in `licenses` table
6. Admin reviews and verifies manually
7. User can book only after verification

**OCR Edge Function:**
```typescript
// supabase/functions/ocr-license/index.ts
import Tesseract from 'tesseract.js';

Deno.serve(async (req) => {
  const { licenseId } = await req.json();
  
  // Download image from storage
  const { data: file } = await supabaseAdmin.storage
    .from('license-uploads')
    .download(filePath);
  
  // OCR processing
  const { data: { text, confidence } } = await Tesseract.recognize(file);
  
  // Update license record
  await supabaseAdmin
    .from('licenses')
    .update({ ocr_text: text, ocr_confidence: confidence })
    .eq('id', licenseId);
  
  return new Response(JSON.stringify({ success: true }));
});
```

---

### 6. Real-Time Features

**Implemented via Supabase Realtime:**

1. **Car Availability:**
   - When car is booked, status updates in real-time for all users
   - Booked cars disappear from search results instantly

2. **Booking Updates:**
   - Admin updates booking status → User sees update immediately

3. **Chat Messages:**
   - Real-time message delivery in communication center

**Implementation:**
```typescript
// Real-time subscription
useEffect(() => {
  const subscription = supabase
    .channel('cars-changes')
    .on('postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: 'cars' },
      (payload) => {
        // Update UI with new car data
        updateCarInList(payload.new);
      }
    )
    .subscribe();
  
  return () => subscription.unsubscribe();
}, []);
```

---

## Security & Compliance

### Row-Level Security (RLS)

**All tables have RLS enabled** with policies enforcing:
- Users can only access their own data
- Admins have elevated permissions
- Public users can only view published content

### Authentication Security

- **Password Requirements:**
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 number
  - At least 1 special character

- **OAuth Security:**
  - Only verified Google accounts
  - Email verification required

- **Session Security:**
  - HTTP-only cookies
  - CSRF protection
  - Rate limiting on auth endpoints

### Payment Security

- **PCI-DSS Compliance:**
  - No card data stored in database
  - Payment tokens only
  - Tokenization via Stripe/Razorpay

- **Idempotency:**
  - Prevent duplicate payments via `idempotency_keys` table
  - Each payment request has unique key
  - Duplicate requests return cached response

### Data Protection

- **Encryption:**
  - All data encrypted at rest (Supabase default)
  - SSL/TLS for data in transit

- **Sensitive Data:**
  - Driver licenses stored in private bucket
  - Signed URLs with expiration for temporary access
  - Phone numbers hashed (future enhancement)

### Audit Logging

- All critical actions logged in `audit_logs` table
- Logged events:
  - User registration/login
  - Car creation/update/delete
  - Booking creation/cancellation
  - Payment transactions
  - License uploads/verification
  - Role assignments

---

## API Endpoints

### Supabase Edge Functions

#### 1. **create-hold**
```typescript
POST /functions/v1/create-hold
Body: { carId, userId, startDate, endDate }
Response: { holdId, bookingId, holdExpiry }
```

#### 2. **cleanup-expired-holds**
```typescript
POST /functions/v1/cleanup-expired-holds
Body: {}
Response: { deletedCount }
```

#### 3. **create-payment-intent**
```typescript
POST /functions/v1/create-payment-intent
Body: { bookingId, amount, currency, paymentMode }
Response: { paymentIntentId, clientSecret }
```

#### 4. **complete-payment**
```typescript
POST /functions/v1/complete-payment
Body: { bookingId, paymentIntentId, status }
Response: { success, booking }
```

#### 5. **cancel-booking**
```typescript
POST /functions/v1/cancel-booking
Body: { bookingId, reason }
Response: { success, refundAmount, refundStatus }
```

#### 6. **ocr-license**
```typescript
POST /functions/v1/ocr-license
Body: { licenseId }
Response: { success, ocrText, confidence }
```

#### 7. **payment-webhook**
```typescript
POST /functions/v1/payment-webhook
Headers: { stripe-signature | razorpay-signature }
Body: { event data from payment provider }
Response: { received: true }
```

#### 8. **delete-car**
```typescript
DELETE /functions/v1/delete-car
Body: { carId }
Response: { success, deletedImages }
```

---

## Technical Stack Summary

### Frontend Technologies
- **React 18.3.1** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **TanStack Query** - Data fetching/caching
- **React Router** - Client-side routing
- **Framer Motion** - Animations
- **Zod** - Schema validation
- **React Hook Form** - Form management

### Backend Technologies
- **Supabase PostgreSQL** - Database
- **Supabase Auth** - Authentication
- **Supabase Storage** - File storage
- **Supabase Realtime** - WebSocket connections
- **Deno** - Edge function runtime
- **PostgREST** - Auto-generated REST API

### Payment Integrations
- **Stripe** - International payments
- **Razorpay** - Indian market payments

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing
- **Playwright** - E2E testing

---

## Performance Optimizations

### Frontend Optimizations
1. **Lazy Loading:** Code splitting with React.lazy()
2. **Virtual Scrolling:** Large lists rendered efficiently
3. **Image Optimization:** 
   - Lazy loading images with IntersectionObserver
   - WebP format with fallbacks
   - Responsive images
4. **Query Caching:** TanStack Query for intelligent caching
5. **Memoization:** React.memo, useMemo, useCallback

### Database Optimizations
1. **Indexes:** Strategic indexes on frequently queried columns
2. **Query Optimization:** Selective field fetching
3. **Connection Pooling:** Supabase Pooler for scalability
4. **Pagination:** Limit/offset queries

### Backend Optimizations
1. **Edge Functions:** Deployed globally for low latency
2. **CDN:** Static assets served via CDN
3. **Caching:** API response caching with TTL

---

## Future Enhancements

### Phase 2 Features
1. **Email Notifications:** Booking confirmations, reminders
2. **SMS Notifications:** Payment confirmations, booking reminders
3. **Rating & Review System:** Allow users to rate cars and service
4. **Favorites/Wishlist:** Save cars for later
5. **Multi-language Support:** i18n implementation
6. **Mobile Apps:** React Native iOS/Android apps
7. **Push Notifications:** Real-time alerts
8. **Advanced Analytics:** Machine learning for demand forecasting
9. **Dynamic Pricing:** Surge pricing based on demand
10. **Loyalty Program:** Reward frequent customers

---

## Deployment Information

### Production Environment
- **Frontend:** Netlify / Vercel
- **Database:** Supabase Cloud (Production instance)
- **CDN:** Cloudflare
- **Domain:** rpcars.com (example)

### Environment Variables
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (server-only)
STRIPE_SECRET_KEY=sk_live_...
RAZORPAY_SECRET_KEY=rzp_live_...
```

---

## Support & Documentation

**Project Repository:** (Internal)  
**API Documentation:** Auto-generated via Supabase  
**Admin Guide:** Separate document  
**User Guide:** In-app help center  

---

**Document Version:** 1.0  
**Last Updated:** October 26, 2025  
**Prepared By:** RP CARS Development Team
