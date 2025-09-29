# Delete Car Edge Function

This Edge Function provides a secure way to delete cars and their associated images from the Supabase Storage.

## Deployment

To deploy this function, run:

```bash
supabase functions deploy delete-car
```

## Environment Variables

The function requires the following environment variables to be set in the Supabase dashboard:

- `SUPABASE_SERVICE_ROLE_KEY` - The service role key for accessing Supabase with full privileges

## API Endpoint

Once deployed, the function will be available at:
```
https://<project-ref>.supabase.co/functions/v1/delete-car
```

## Usage

Make a POST request to the endpoint with the following JSON body:

```json
{
  "carId": "car-id-to-delete"
}
```

The request must include a valid admin JWT token in the Authorization header:

```
Authorization: Bearer <admin-jwt-token>
```

## Response

On success:
```json
{
  "success": true,
  "carId": "car-id",
  "imagesDeleted": true,
  "message": "Car successfully deleted with all associated images"
}
```

On error:
```json
{
  "error": "Error message",
  "details": "Error details"
}
```