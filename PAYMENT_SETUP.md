# Payment Integration Setup Guide

## Overview
Azure Drive Hub now includes a fully functional payment system with support for both Razorpay and Stripe payment gateways, specifically optimized for Indian car rental businesses.

## Features Implemented

### ✅ 1. Admin Dashboard: Car Management Improvements
- **Multiple Image Upload**: Admins can now upload multiple images per car with live preview
- **Real-time Updates**: New cars automatically appear on both admin and user dashboards
- **Enhanced UI**: Professional image preview with delete functionality
- **Image Management**: Easy removal of individual images before saving

### ✅ 2. Booking Duration Validation
- **Minimum Duration**: Enforces 12-hour minimum booking requirement
- **Smart Billing**: Rounds up to 12-hour or 24-hour increments
- **Clear Validation**: Shows error messages for invalid durations
- **Duration Display**: Shows actual vs billing hours for transparency

### ✅ 3. Fixed GST Calculation
- **Correct Rate**: Uses 18% GST as per Indian car rental regulations
- **Clear Breakdown**: Shows subtotal, GST, and total separately
- **Proper Labeling**: Uses "Taxes & Fees (18% GST)" for clarity

### ✅ 4. Functional Payment System
- **Razorpay Integration**: Full Indian payment gateway support
- **Stripe Integration**: International payment option
- **Multiple Payment Methods**: UPI, Cards, Net Banking (via Razorpay)
- **Secure Processing**: Backend payment confirmation and validation
- **Real-time Status**: Live payment status updates

## Setup Instructions

### 1. Environment Configuration
Create a `.env` file based on `.env.example`:

```bash
# Copy the example file
cp .env.example .env

# Edit with your actual credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 2. Razorpay Setup
1. Sign up at [https://razorpay.com](https://razorpay.com)
2. Get your Test/Live API keys
3. Add keys to your `.env` file
4. Configure webhook endpoints in Razorpay dashboard

### 3. Supabase Functions
The following functions are already configured:
- `create-payment`: Creates payment sessions
- `create-payment-intent`: Handles payment intents
- `confirm-payment`: Confirms successful payments
- `payment-webhook`: Processes gateway webhooks

### 4. Database Schema
Ensure your Supabase database has these tables:
- `cars`: Vehicle inventory
- `bookings`: Booking records
- `payments`: Payment transactions
- `users`: User accounts

## Usage Flow

### For Admins:
1. **Add Cars**: Upload multiple images, set pricing, add details
2. **Manage Inventory**: View real-time bookings and availability
3. **Monitor Payments**: Track payment status and confirmations

### For Users:
1. **Browse Cars**: View available vehicles with multiple images
2. **Book Vehicle**: Select dates with duration validation
3. **Complete Payment**: Choose Razorpay/Stripe and pay securely
4. **Track Booking**: View confirmed bookings in dashboard

## Payment Flow
1. User selects car and dates
2. System validates minimum 12-hour duration
3. Calculates pricing with 18% GST
4. User chooses payment gateway
5. Secure payment processing
6. Booking confirmation and dashboard update

## Security Features
- Backend payment validation
- Webhook verification
- User authentication required
- Secure API endpoints
- Real-time conflict detection

## Testing
- Use Razorpay test keys for development
- Test different duration scenarios
- Verify GST calculations
- Test payment success/failure flows

## Production Deployment
1. Replace test keys with live keys
2. Configure production webhooks
3. Set up SSL certificates
4. Monitor payment analytics

## Support
For payment integration issues:
- Check Supabase function logs
- Verify webhook configurations
- Test with different payment methods
- Monitor database transaction logs

This implementation provides a complete, production-ready payment system for the Azure Drive Hub car rental platform.