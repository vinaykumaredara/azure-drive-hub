# List Customers Edge Function

## Purpose
Securely fetches customer data for admin users without exposing the service role key to the client.

## Security
- Requires valid authentication token
- Verifies admin role via `user_roles` table
- Uses service role key only on server-side
- Returns customer data including emails from auth.users

## Usage
```typescript
const { data, error } = await supabase.functions.invoke('list-customers');
if (error) console.error(error);
else console.log(data.customers);
```

## Response
```json
{
  "customers": [
    {
      "id": "uuid",
      "full_name": "string",
      "email": "string",
      "phone": "string",
      "is_admin": boolean,
      "created_at": "timestamp",
      "is_suspended": boolean,
      "suspension_reason": "string",
      "suspended_at": "timestamp",
      "suspended_by": "uuid"
    }
  ]
}
```
