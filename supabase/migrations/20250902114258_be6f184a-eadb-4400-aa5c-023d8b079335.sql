-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cars table
CREATE TABLE IF NOT EXISTS public.cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  seats INTEGER,
  fuel_type TEXT,
  transmission TEXT,
  description TEXT,
  price_per_day NUMERIC NOT NULL,
  price_per_hour NUMERIC,
  location_city TEXT,
  status TEXT DEFAULT 'active', -- active, maintenance, retired
  image_urls TEXT[], -- array of public URLs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  car_id UUID REFERENCES public.cars(id),
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, completed, cancelled, refunded
  hold_expires_at TIMESTAMPTZ,
  total_amount NUMERIC,
  payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create licenses table
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  storage_path TEXT,
  ocr_text TEXT,
  ocr_confidence NUMERIC,
  expires_at DATE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_percent INTEGER,
  discount_flat NUMERIC,
  valid_from DATE,
  valid_to DATE,
  active BOOLEAN DEFAULT TRUE,
  usage_limit INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create maintenance table
CREATE TABLE IF NOT EXISTS public.maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES public.cars(id),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create complaints table
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  booking_id UUID REFERENCES public.bookings(id),
  issue TEXT,
  status TEXT DEFAULT 'open',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table (for chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL, -- "booking:{bookingId}" or "support:{userId}"
  sender_id UUID REFERENCES public.users(id),
  message TEXT,
  attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id),
  gateway TEXT,
  provider_transaction_id TEXT,
  amount NUMERIC,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- RLS Policies for users
CREATE POLICY "users_select_own_or_admin" ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own_or_admin" ON public.users
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- RLS Policies for cars
CREATE POLICY "cars_select_public" ON public.cars
  FOR SELECT USING (TRUE);

CREATE POLICY "cars_modify_admin" ON public.cars
  FOR ALL USING (public.is_admin());

-- RLS Policies for bookings
CREATE POLICY "bookings_select_owner_or_admin" ON public.bookings
  FOR SELECT USING (public.is_admin() OR user_id = auth.uid());

CREATE POLICY "bookings_insert_authenticated" ON public.bookings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "bookings_update_owner_or_admin" ON public.bookings
  FOR UPDATE USING (public.is_admin() OR user_id = auth.uid());

CREATE POLICY "bookings_delete_admin" ON public.bookings
  FOR DELETE USING (public.is_admin());

-- RLS Policies for licenses
CREATE POLICY "licenses_owner_admin" ON public.licenses
  FOR ALL USING (public.is_admin() OR user_id = auth.uid());

-- RLS Policies for promo_codes
CREATE POLICY "promo_codes_select_all" ON public.promo_codes
  FOR SELECT USING (TRUE);

CREATE POLICY "promo_codes_modify_admin" ON public.promo_codes
  FOR ALL USING (public.is_admin());

-- RLS Policies for maintenance
CREATE POLICY "maintenance_admin_only" ON public.maintenance
  FOR ALL USING (public.is_admin());

-- RLS Policies for complaints
CREATE POLICY "complaints_owner_admin" ON public.complaints
  FOR ALL USING (public.is_admin() OR user_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "messages_room_participant" ON public.messages
  FOR SELECT USING (
    public.is_admin() OR 
    room_id LIKE CONCAT('support:', auth.uid()::TEXT) OR 
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.user_id = auth.uid() AND room_id = CONCAT('booking:', b.id::TEXT)
    )
  );

CREATE POLICY "messages_insert_authenticated" ON public.messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for payments
CREATE POLICY "payments_owner_admin" ON public.payments
  FOR SELECT USING (
    public.is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = booking_id AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "payments_insert_system" ON public.payments
  FOR INSERT WITH CHECK (TRUE); -- Edge functions will handle this

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('cars-photos', 'cars-photos', TRUE),
  ('license-uploads', 'license-uploads', FALSE),
  ('chat-attachments', 'chat-attachments', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for cars-photos (public bucket)
CREATE POLICY "cars_photos_select_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'cars-photos');

CREATE POLICY "cars_photos_insert_admin" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'cars-photos' AND public.is_admin());

CREATE POLICY "cars_photos_update_admin" ON storage.objects
  FOR UPDATE USING (bucket_id = 'cars-photos' AND public.is_admin());

CREATE POLICY "cars_photos_delete_admin" ON storage.objects
  FOR DELETE USING (bucket_id = 'cars-photos' AND public.is_admin());

-- Storage policies for license-uploads (private bucket)
CREATE POLICY "license_uploads_select_owner_admin" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'license-uploads' AND 
    (public.is_admin() OR auth.uid()::TEXT = (storage.foldername(name))[1])
  );

CREATE POLICY "license_uploads_insert_owner" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'license-uploads' AND 
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- Storage policies for chat-attachments (private bucket)
CREATE POLICY "chat_attachments_select_participant" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-attachments' AND 
    (public.is_admin() OR auth.uid()::TEXT = (storage.foldername(name))[1])
  );

CREATE POLICY "chat_attachments_insert_authenticated" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-attachments' AND 
    auth.role() = 'authenticated'
  );

-- Enable realtime for messages
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for bookings (for admin dashboard)
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    CASE WHEN NEW.email = 'rpcars2025@gmail.com' THEN TRUE ELSE FALSE END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sample cars data
INSERT INTO public.cars (title, make, model, year, seats, fuel_type, transmission, description, price_per_day, price_per_hour, location_city, image_urls) VALUES
('Maruti Swift Dzire 2023', 'Maruti', 'Swift Dzire', 2023, 5, 'Petrol', 'Manual', 'Comfortable sedan perfect for city drives', 2500, 300, 'Mumbai', ARRAY['https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800']),
('Honda City 2022', 'Honda', 'City', 2022, 5, 'Petrol', 'Automatic', 'Premium sedan with advanced features', 3200, 400, 'Delhi', ARRAY['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800']),
('Mahindra XUV500', 'Mahindra', 'XUV500', 2021, 7, 'Diesel', 'Manual', 'Spacious SUV for family trips', 4500, 550, 'Bangalore', ARRAY['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800']),
('Tata Nexon EV', 'Tata', 'Nexon EV', 2023, 5, 'Electric', 'Automatic', 'Eco-friendly electric SUV', 3800, 450, 'Pune', ARRAY['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800']),
('Hyundai Creta', 'Hyundai', 'Creta', 2022, 5, 'Petrol', 'Automatic', 'Stylish compact SUV', 3500, 420, 'Chennai', ARRAY['https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800']),
('Toyota Innova Crysta', 'Toyota', 'Innova Crysta', 2021, 8, 'Diesel', 'Manual', 'Premium MPV for large groups', 5200, 650, 'Hyderabad', ARRAY['https://images.unsplash.com/photo-1613294055763-7c5bf415cb32?w=800']),
('BMW 3 Series', 'BMW', '3 Series', 2020, 5, 'Petrol', 'Automatic', 'Luxury sedan for premium experience', 8500, 1100, 'Mumbai', ARRAY['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800']),
('Maruti Ertiga', 'Maruti', 'Ertiga', 2022, 7, 'Petrol', 'Manual', 'Affordable family car', 2800, 350, 'Kolkata', ARRAY['https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800']);

-- Sample promo codes
INSERT INTO public.promo_codes (code, discount_percent, valid_from, valid_to, usage_limit) VALUES
('WELCOME20', 20, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 100),
('SUMMER15', 15, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', 50),
('NEWUSER', 25, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 200);