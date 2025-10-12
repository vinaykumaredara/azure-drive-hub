# 🚗 RP cars - Premium Car Rental Platform

A modern, full-stack car rental platform built with React, TypeScript, and Supabase. Features real-time booking, secure payments, admin dashboard, and WhatsApp integration.

## ✨ Features

### 🌟 **User Features**
- **Modern Car Catalog**: Browse cars with multi-image galleries and detailed specifications
- **Smart Booking System**: Duration validation with 12/24-hour minimum requirements
- **Secure Payments**: Razorpay (India) and Stripe (International) integration
- **Promo Code System**: Apply discount codes with real-time validation
- **WhatsApp Integration**: Direct communication with car rental service
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Real-time Updates**: Live inventory and booking status
- **Enhanced Booking Flow**: Complete booking workflow with phone collection, license upload, and terms acceptance
- **Advance Booking**: Reserve cars with 10% upfront payment
- **License Management**: Upload driver's license for verification
- **Persistent Booking Intent**: Automatically resumes booking after sign-in

### 🛠️ **Admin Features**
- **Comprehensive Dashboard**: Real-time analytics and metrics
- **Car Management**: Add, edit, delete vehicles with multi-image upload (up to 6 images per car)
- **Booking Management**: Track and manage all reservations with real-time updates
- **Promo Code Manager**: Create and manage discount campaigns
- **License Verification**: AI-assisted driver's license validation with verification status
- **User Management**: Customer account administration
- **Analytics**: Revenue tracking and performance insights
- **Enhanced Booking Views**: See phone numbers, license status, payment status, and total costs

### 🔧 **Technical Features**
- **Real-time Sync**: Instant updates across all dashboards
- **Secure Authentication**: Row-level security with Supabase Auth
- **Payment Processing**: Dual gateway support for global transactions
- **Image Management**: Supabase storage with optimized delivery and multi-image support
- **Mobile-First**: Progressive Web App capabilities
- **Performance Optimized**: Lazy loading and code splitting
- **Type Safety**: Full TypeScript implementation
- **Atomic Booking**: Thread-safe booking operations to prevent double bookings
- **Booking Intent Persistence**: Survives page reloads and OAuth redirects

## 🏗️ Tech Stack

- **Frontend**: React 18.3.1, TypeScript 5.8.3, Vite 5.4.19
- **UI/UX**: Tailwind CSS, shadcn/ui, Framer Motion, Lottie
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Payments**: Razorpay, Stripe
- **Deployment**: Vercel (recommended), Netlify, AWS Amplify
- **Development**: ESLint, TypeScript, Vitest

## 🚀 Quick Start

### Development Setup
```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd rp-cars

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Update .env with your configuration

# Start development server
npm run dev
```

### Quick Deployment
```bash
# Windows
./deploy-prep.bat

# Mac/Linux
./deploy-prep.sh
```

📖 **Complete Guide**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## 🔧 Environment Variables

Create `.env` (development) or `.env.production` (production):

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Payment Gateways
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# App Configuration
VITE_WHATSAPP_NUMBER=8897072640
VITE_APP_URL=http://localhost:5173
```

## 💰 Hosting & Costs

### Recommended Production Setup
- **Domain**: $12-20/year (Namecheap, GoDaddy)
- **Vercel Pro**: $20/month
- **Supabase Pro**: $25/month
- **Total**: ~$47/month

### Free Development Setup
- **Vercel Hobby**: Free
- **Supabase Free Tier**: Free (up to 50MB)
- **Domain**: Use .vercel.app subdomain

## 📊 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Bundle Size**: <200KB gzipped
- **Load Time**: <2s on 3G networks
- **Core Web Vitals**: Optimized for excellent UX

## 🔄 Booking Workflow

### 1. **Booking Flow Initialization**
When a user clicks "Book Now" on a car card:
- If not signed in, redirected to Sign In/Sign Up page
- After login, collect phone number if not already stored
- Save phone number in user database and associate with booking

### 2. **Date, Time, and Cost Calculation**
- Display date & time picker with constraints (12 hours min, 1 month max)
- Compute total cost based on car price and duration
- Show total cost dynamically to user
- **Advance Booking Option**: Allow users to block/book a car by paying 10% upfront

### 3. **Terms and Conditions**
- Display Terms & Conditions modal with checkbox
- Booking cannot proceed without accepting terms

### 4. **License Upload**
- Prompt user to upload driver's license
- Options: Upload from device or camera
- Save license file and associate with user account + booking

### 5. **Payment Integration**
- Redirect to PhonePe/Razorpay/Stripe Payment Gateway
- On successful payment, mark booking as Confirmed
- Update status in both user dashboard and admin dashboard in real time

### 6. **Admin Dashboard**
- Show phone number, license status, total cost, and booking status in real time
- All bookings (pending, advance, confirmed) show up in real-time

### 7. **User Dashboard**
- "My Bookings" section shows booking history and payments
- Payment Successful → Confirmed Booking Flow completely functional

## 🛠️ Recent Improvements

### Multi-Image Upload Fix
We've implemented a comprehensive fix for the car image upload system:

**Problems Solved:**
- Admins can now upload up to 6 images per car
- All images are displayed correctly in both Admin and User views
- Images are stored as canonical public URLs
- Fixed race conditions during parallel uploads
- Added client-side validation and error handling
- Implemented atomic operations with rollback on failure

**Key Components:**
- `src/utils/imageUtils.ts`: New utility functions for image handling
- `src/components/AdminImage.tsx`: Resilient image component with fallbacks
- `src/components/ImageCarousel.tsx`: Enhanced carousel for multiple images
- `scripts/repair-image-urls.js`: Database repair script for existing entries

For detailed information, see [IMAGE_UPLOAD_FIX_SUMMARY.md](./IMAGE_UPLOAD_FIX_SUMMARY.md)

### Production-Ready Architecture Refactoring
We've successfully refactored the application into a modern, production-ready architecture:

**Key Improvements:**
- **Component Architecture**: Broke down monolithic components into smaller, focused modules
- **Business Logic Separation**: Created dedicated service layer and custom hooks
- **State Management**: Integrated React Query for optimized data fetching and caching
- **UI Component Library**: Built reusable UI components for consistent design
- **Performance Optimization**: Implemented code splitting and lazy loading
- **Type Safety**: Enhanced TypeScript typing throughout the codebase
- **Error Handling**: Centralized error handling and validation

**Architecture Benefits:**
- Improved maintainability with modular components (<200 lines each)
- Better scalability through separation of concerns
- Enhanced performance with optimized data fetching
- Consistent UI/UX with reusable component library
- Reduced runtime errors with strong typing
- Better developer experience with clear documentation

For detailed information, see [REFCTORING_COMPLETE.md](./REFCTORING_COMPLETE.md)

### Enhanced Booking System
We've implemented a complete booking workflow with all required features:

**Key Improvements:**
- **Phone Number Collection**: Automatic collection and storage of user phone numbers
- **Advance Booking**: 10% upfront payment option for future reservations
- **Terms & Conditions**: Mandatory acceptance before booking completion
- **License Upload**: Integrated driver's license verification system
- **Payment Integration**: Secure payment processing with multiple gateways
- **Admin Dashboard Enhancements**: Real-time display of all booking details
- **User Dashboard Updates**: Complete booking history with payment status
- **Booking Intent Persistence**: Automatically resumes booking after sign-in

For detailed information, see [FINAL_IMPLEMENTATION_REPORT.md](./FINAL_IMPLEMENTATION_REPORT.md)

## 📋 How Booking Flow Works

The new booking flow implementation provides a seamless user experience with the following steps:

1. **User Authentication Flow**
   - When a user clicks "Book Now" on any car card:
     - If not signed in, a sign-in modal appears (or redirects to auth page)
     - After successful authentication, check if phone number exists
     - If no phone number, prompt user to enter phone number
     - Save phone number to user profile before proceeding

2. **Multi-Step Booking Modal**
   - **Step 1: Date & Time Selection**
     - Select start and end dates with validation
     - Choose pickup and return times
     - Dynamic cost calculation based on duration
   - **Step 2: Terms & Conditions**
     - Display comprehensive terms that must be accepted
     - Checkbox validation to proceed
   - **Step 3: License Upload**
     - Camera capture support for mobile users
     - File upload option for desktop users
     - Validation for image files (JPG, PNG) under 5MB
     - Upload to Supabase Storage and save URL to booking record
   - **Step 4: Payment Options**
     - Choice between 10% hold or full payment
     - For 10% hold: Create booking with "held" status and hold_until timestamp
     - For full payment: Process payment and create booking with "confirmed" status
   - **Step 5: Confirmation**
     - Display booking confirmation with all details
     - Show license URL, user phone, times, status, and payment info

3. **Database & Security**
   - All booking creation happens via Edge Functions for transactional safety
   - EXCLUDE constraint prevents overlapping bookings at database level
   - License documents stored securely in Supabase Storage
   - Phone numbers stored in user profiles for future bookings

4. **Admin Dashboard Integration**
   - Real-time display of all bookings with complete information
   - View license documents, user phone numbers, booking times, and payment status
   - Manage booking status (approve, cancel, complete)

## 🧪 How to Test

### Unit Tests
Run the unit tests for the booking flow hooks:
```bash
npm run test:unit
```

Key test files:
- `src/__tests__/hooks/useBookingFlow.test.ts` - Tests for booking flow state management
- `src/__tests__/functions/createBooking.test.ts` - Tests for Edge Function integration
- `src/__tests__/utils/bookingIntentUtils.test.ts` - Tests for booking intent persistence

### Integration Tests
Run integration tests for the booking system:
```bash
npm run test:integration
```

### End-to-End Tests
Run end-to-end tests for the complete booking flow:
```bash
npm run test:e2e
```

### Manual Testing Steps
1. **Authentication Flow**
   - Log out and click "Book Now" on any car
   - Verify sign-in modal appears or redirection to auth page
   - After login, if no phone number exists, verify phone collection modal appears
   - Enter phone number and verify it's saved to profile

2. **Booking Modal Flow**
   - Click "Book Now" on any available car
   - Complete Date & Time selection with valid dates
   - Accept Terms & Conditions
   - Upload a license image (test both camera and file upload)
   - Choose payment option (10% hold or full payment)
   - Verify booking confirmation appears

3. **Validation Testing**
   - Try to proceed without selecting dates (should show error)
   - Try to proceed without accepting terms (should show error)
   - Try to upload non-image files (should show error)
   - Try to select end date before start date (should show error)

4. **Admin Dashboard Verification**
   - Log in as admin
   - Navigate to Booking Management section
   - Verify all booking details are displayed correctly:
     - License URL with clickable link
     - User phone number
     - Booking times and duration
     - Status and payment information

5. **Database Verification**
   - Check that bookings are created with correct status
   - Verify license documents are stored in Supabase Storage
   - Confirm phone numbers are saved in user profiles
   - Test that overlapping bookings are prevented by database constraints

6. **Booking Intent Persistence**
   - Click "Book Now" while signed out
   - Verify pending intent is saved to localStorage
   - Complete sign-in process
   - Verify booking modal automatically opens for the intended car
   - Verify localStorage intent is cleared after successful resume

## 📈 Performance & UX

### Lazy Loading
- Booking modal and heavy components are lazy-loaded for faster initial page load
- Code splitting implemented for optimal bundle size

### User Experience
- Smooth animations and transitions between booking steps
- Clear progress indicators showing current step
- Disabled "Next" buttons until validations pass
- Loading spinners during async operations
- Toast notifications for errors and success messages
- Mobile-friendly design with camera capture support

### Error Handling
- Defensive programming with comprehensive error handling
- Visible error toasts for all user actions
- No silent failures - every action shows feedback
- Graceful degradation for network issues

## 🔒 Security

### Authentication
- All booking operations require authenticated users
- Phone number collection secured through Supabase Auth
- Profile updates protected by RLS policies

### Data Protection
- License documents stored in private Supabase Storage bucket
- Database constraints prevent data integrity issues
- Edge Functions ensure server-side validation and transactional operations

### Payment Security
- Payment processing handled by trusted third-party providers
- No sensitive payment data stored in application database
- Edge Functions provide secure server-side booking creation

## 🔄 Booking Intent Persistence

### How It Works
The booking intent persistence feature ensures that users never lose their booking progress, even when they need to sign in first:

1. **Intent Storage**: When an unauthenticated user clicks "Book Now", the system saves the booking intent to localStorage with the car ID and timestamp.

2. **Sign-In Handling**: The user is redirected to the sign-in page with a clear message that their booking will be resumed automatically.

3. **Resume Logic**: After successful authentication, the system automatically:
   - Retrieves the saved intent from localStorage
   - Fetches the car details from the database
   - Opens the booking modal for that specific car
   - Clears the saved intent to prevent duplicate bookings

4. **Cross-Flow Support**: Works with both modal sign-ins and OAuth redirects, ensuring consistent behavior across all authentication methods.

### Technical Implementation
- **Utility Functions**: `src/utils/bookingIntentUtils.ts` contains all logic for saving, retrieving, and resuming booking intents
- **Component Integration**: `NewBookNowButton` handles intent saving before redirecting to sign-in
- **App-Level Resume**: `App.tsx` includes a component that listens for authentication state changes and resumes intents when the user becomes authenticated
- **Error Handling**: Graceful handling of cases where the car is no longer available or other errors occur during resume

### Benefits
- **Seamless UX**: Users don't need to remember which car they wanted to book
- **Robust**: Works across page reloads, OAuth redirects, and different sign-in methods
- **Secure**: Only stores minimal information (car ID) without sensitive data
- **Transparent**: Users are informed when their booking is being resumed