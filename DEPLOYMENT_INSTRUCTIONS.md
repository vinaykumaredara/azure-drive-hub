# RP CARS Deployment Instructions

## Overview
This document provides step-by-step instructions for deploying the updated RP CARS application with all admin functionality.

## Prerequisites
1. Supabase project with project ID: `rcpkhtlvfvafympulywx`
2. Supabase service role key (for admin operations)
3. Node.js and npm installed
4. Git repository access

## Deployment Steps

### 1. Environment Setup

Create a `.env.local` file with the following variables:
```env
# Supabase Configuration
SUPABASE_URL=https://rcpkhtlvfvafympulywx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Payment Gateway Configuration (if needed for production)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
```

### 2. Apply Database Migrations

Navigate to the project directory and apply migrations:
```bash
cd /path/to/azure-drive-hub
npx supabase migration up
```

Or if using the Supabase CLI directly:
```bash
supabase db push
```

### 3. Verify Database Schema

Run the following SQL queries to verify the schema:

```sql
-- Check cars table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cars' 
AND column_name IN ('price_in_paise', 'currency');

-- Check users table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('is_suspended', 'suspension_reason', 'suspended_at', 'suspended_by');

-- Check system_settings table
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'system_settings';

-- Check audit_logs table
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'audit_logs';
```

### 4. Make Admin User

Run the admin script to make the specified user an admin:
```bash
node scripts/make-admin.js rpcars2025@gmail.com
```

Verify the admin status:
```sql
SELECT id, email, is_admin 
FROM public.users 
WHERE email = 'rpcars2025@gmail.com';
```

### 5. Build and Deploy Application

Install dependencies and build the application:
```bash
npm install
npm run build
```

Deploy using your preferred method (Netlify, Vercel, etc.)

### 6. Verification Testing

Run the verification scripts to ensure everything is working:

```bash
# Test TypeScript compilation
npx tsc --noEmit

# Test admin functionality
node scripts/test-admin-functionality.js

# Test currency conversion
node scripts/test-currency-conversion.js
```

### 7. Manual Verification

#### a) Admin Car Management
1. Login as admin (rpcars2025@gmail.com)
2. Navigate to Admin Dashboard → Car Management
3. Create a new car with:
   - Title: "Deployment Test Car"
   - Price: 3500 INR per day
   - Status: "published"
   - Upload an image
4. Verify the car appears in the public dashboard
5. Verify price displays as ₹3,500.00

#### b) Customer Management
1. In Admin Dashboard → Customer Management
2. Find a test user
3. Suspend the user with a reason
4. Verify the user appears suspended
5. Check audit logs for the suspension action

#### c) System Settings
1. In Admin Dashboard → System Settings
2. Change "site_name" to "RP Cars Deployment Test"
3. Save settings
4. Verify the change is reflected
5. Check audit logs for the settings update

#### d) Security & Compliance
1. In Admin Dashboard → Security & Compliance
2. Verify audit logs are displayed
3. Test CSV export functionality
4. Verify different action types are shown

### 8. Post-Deployment Checklist

- [ ] Database migrations applied successfully
- [ ] Admin user (rpcars2025@gmail.com) has admin privileges
- [ ] Application builds without errors
- [ ] All verification scripts pass
- [ ] Manual testing completed successfully
- [ ] Storage bucket configured correctly
- [ ] RLS policies working as expected
- [ ] All environment variables set

## Troubleshooting

### Common Issues and Solutions

#### 1. Permission Denied Errors
**Issue**: Database operations fail with permission errors
**Solution**: Ensure you're using the service role key for admin operations

#### 2. Missing Tables/Columns
**Issue**: Database queries fail due to missing tables or columns
**Solution**: Verify all migration scripts have been applied

#### 3. Image Upload Failures
**Issue**: Car images fail to upload
**Solution**: Check storage bucket exists and policies are correct

#### 4. Audit Log Errors
**Issue**: Audit logs are not being created
**Solution**: Verify audit_logs table exists with correct schema

### Database Verification Queries

```sql
-- Check for cars with proper pricing
SELECT id, title, price_in_paise, currency, status 
FROM public.cars 
WHERE price_in_paise IS NOT NULL 
AND currency = 'INR' 
AND status = 'published'
LIMIT 5;

-- Check for audit logs
SELECT action, description, timestamp 
FROM public.audit_logs 
ORDER BY timestamp DESC 
LIMIT 10;

-- Check system settings
SELECT key, value 
FROM public.system_settings;

-- Check suspended users
SELECT id, email, is_suspended, suspension_reason 
FROM public.users 
WHERE is_suspended = true;
```

## Rollback Procedures

If issues are encountered during deployment:

### 1. Database Rollback
Apply rollback migrations in reverse order:
```bash
# Apply rollback migrations (if needed)
supabase migration down  # Repeat for each migration to rollback
```

### 2. Code Rollback
Revert to previous commit:
```bash
git checkout previous-commit-hash
```

### 3. Configuration Rollback
Restore previous environment variables and configuration files.

## Monitoring and Maintenance

### 1. Regular Monitoring
- Monitor audit logs for security events
- Check application performance
- Verify database backups are working

### 2. Maintenance Tasks
- Regular database backups
- Security audits
- Performance optimization
- Dependency updates

## Support and Contact

For issues with deployment or functionality:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all migration scripts have been applied
4. Contact the development team for assistance

## Success Metrics

✅ Application deploys without errors
✅ Admin functionality works as expected
✅ All verification tests pass
✅ Users can access the application
✅ Cars are properly displayed with correct pricing
✅ Admin actions are logged in audit trails
✅ System settings are configurable
✅ Customer management functions correctly

## Next Steps After Deployment

1. **User Training**: Provide training for admin users
2. **Documentation**: Update user guides and documentation
3. **Monitoring Setup**: Implement monitoring and alerting
4. **Performance Testing**: Conduct load testing
5. **Security Review**: Perform security audit
6. **Feedback Collection**: Gather user feedback for improvements