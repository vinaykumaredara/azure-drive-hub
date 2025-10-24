// Extended booking types with proper join relationships

export interface BookingWithRelations {
  id: string;
  status: string;
  total_amount: number | null;
  start_datetime: string;
  end_datetime: string;
  hold_expires_at: string | null;
  created_at: string;
  user_id: string | null;
  car_id: string | null;
  users: {
    full_name: string | null;
    email?: string;
  } | null;
  cars: {
    title: string;
    make?: string | null;
    model?: string | null;
    image_urls?: string[] | null;
  } | null;
}
