-- Migration 012: Architecture fixes
-- 1. Update industry CHECK constraint (add new industries, remove health_services/education)
-- 2. Rename milk_liters_used → input_quantity in production_batches

-- ─── 1. Industry constraint ───────────────────────────────────────────────────

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_industry_check;

ALTER TABLE organizations ADD CONSTRAINT organizations_industry_check
  CHECK (industry IN (
    'dairy',
    'tambo',
    'ganaderia',
    'frigorifico',
    'bodega',
    'cerveceria',
    'apicultura',
    'olivicultura',
    'cerealera',
    'agro_campo',
    'avicultura',
    'chacinados',
    'yerbatera',
    'fruticultura',
    'hidroponia',
    'food_manufacturing',
    'panaderia',
    'acuicultura',
    'cosmetica',
    'pesca'
  ));

-- ─── 2. Rename milk_liters_used → input_quantity ──────────────────────────────
-- The computed column yield_percentage references milk_liters_used;
-- must drop it first, rename, then recreate.

ALTER TABLE production_batches DROP COLUMN IF EXISTS yield_percentage;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'production_batches'
      AND column_name = 'milk_liters_used'
  ) THEN
    ALTER TABLE production_batches RENAME COLUMN milk_liters_used TO input_quantity;
  END IF;
END $$;

-- Recreate computed column with generic name
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS yield_percentage NUMERIC(5,2)
  GENERATED ALWAYS AS (
    CASE
      WHEN input_quantity > 0 THEN ROUND((quantity_kg / input_quantity) * 100, 2)
      ELSE 0
    END
  ) STORED;
