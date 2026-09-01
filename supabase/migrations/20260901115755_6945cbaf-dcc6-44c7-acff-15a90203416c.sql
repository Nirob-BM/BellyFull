ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS ingredients text[],
  ADD COLUMN IF NOT EXISTS allergens text[],
  ADD COLUMN IF NOT EXISTS spice_level smallint NOT NULL DEFAULT 0 CHECK (spice_level BETWEEN 0 AND 3),
  ADD COLUMN IF NOT EXISTS prep_time_minutes integer CHECK (prep_time_minutes IS NULL OR prep_time_minutes > 0);