-- Add service_charge column to cars table
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS service_charge NUMERIC DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.cars.service_charge IS 'Optional service charge amount to be added to booking total (replaces GST)';

-- Update existing cars to have 0 service charge if null
UPDATE public.cars 
SET service_charge = 0 
WHERE service_charge IS NULL;

-- Optional index if filtering/ordering by service_charge
CREATE INDEX IF NOT EXISTS idx_cars_service_charge ON public.cars (service_charge);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';