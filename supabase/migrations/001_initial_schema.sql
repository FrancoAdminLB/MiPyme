-- ================================================================
-- BLQ Web — Schema inicial con multi-tenancy
-- Migración: 001_initial_schema
-- ================================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────────
-- ORGANIZATIONS (tabla maestra de tenants)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE organizations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  industry         TEXT NOT NULL CHECK (industry IN ('dairy','food_manufacturing','health_services','education')),
  plan             TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','starter','pro','enterprise')),
  industry_config  JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- PROFILES (usuarios — extensión de auth.users)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email            TEXT NOT NULL,
  full_name        TEXT,
  role             TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin','manager','operator')),
  avatar_url       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- PRODUCTION_BATCHES (lotes de producción)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE production_batches (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  batch_code          TEXT NOT NULL,
  product_name        TEXT NOT NULL,
  product_type        TEXT NOT NULL,
  quantity_kg         NUMERIC(10,3) NOT NULL DEFAULT 0,
  milk_liters_used    NUMERIC(10,3) NOT NULL DEFAULT 0,
  yield_percentage    NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN milk_liters_used > 0
    THEN ROUND((quantity_kg / milk_liters_used) * 100, 2)
    ELSE 0 END
  ) STORED,
  start_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date            DATE,
  status              TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','cancelled')),
  notes               TEXT,
  custom_data         JSONB DEFAULT '{}',
  created_by          UUID NOT NULL REFERENCES profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, batch_code)
);

-- ────────────────────────────────────────────────────────────────
-- INVENTORY_ITEMS (catálogo de ítems de inventario)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE inventory_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  sku              TEXT,
  category         TEXT NOT NULL,
  unit             TEXT NOT NULL DEFAULT 'kg',
  current_stock    NUMERIC(12,3) NOT NULL DEFAULT 0,
  min_stock        NUMERIC(12,3) NOT NULL DEFAULT 0,
  max_stock        NUMERIC(12,3),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, sku)
);

-- ────────────────────────────────────────────────────────────────
-- INVENTORY_MOVEMENTS (entradas/salidas/ajustes)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE inventory_movements (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id          UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  movement_type    TEXT NOT NULL CHECK (movement_type IN ('entrada','salida','ajuste')),
  quantity         NUMERIC(12,3) NOT NULL,
  reference        TEXT,
  notes            TEXT,
  created_by       UUID NOT NULL REFERENCES profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Actualizar stock automáticamente al registrar un movimiento
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.movement_type = 'entrada' THEN
    UPDATE inventory_items SET current_stock = current_stock + NEW.quantity WHERE id = NEW.item_id;
  ELSIF NEW.movement_type = 'salida' THEN
    UPDATE inventory_items SET current_stock = current_stock - NEW.quantity WHERE id = NEW.item_id;
  ELSIF NEW.movement_type = 'ajuste' THEN
    UPDATE inventory_items SET current_stock = NEW.quantity WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_inventory_stock
AFTER INSERT ON inventory_movements
FOR EACH ROW EXECUTE FUNCTION update_inventory_stock();

-- ────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────
ALTER TABLE organizations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches   ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements  ENABLE ROW LEVEL SECURITY;

-- Helper function para obtener organization_id del usuario autenticado
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Organizations: solo ver la propia
CREATE POLICY "org_select_own" ON organizations
  FOR SELECT USING (id = get_user_org_id());

-- Profiles: solo ver perfiles de la propia org
CREATE POLICY "profiles_tenant_isolation" ON profiles
  FOR ALL USING (organization_id = get_user_org_id());

-- Production batches: tenant isolation
CREATE POLICY "production_batches_tenant_isolation" ON production_batches
  FOR ALL USING (organization_id = get_user_org_id());

-- Inventory items: tenant isolation
CREATE POLICY "inventory_items_tenant_isolation" ON inventory_items
  FOR ALL USING (organization_id = get_user_org_id());

-- Inventory movements: tenant isolation
CREATE POLICY "inventory_movements_tenant_isolation" ON inventory_movements
  FOR ALL USING (organization_id = get_user_org_id());

-- ────────────────────────────────────────────────────────────────
-- INDICES para performance
-- ────────────────────────────────────────────────────────────────
CREATE INDEX idx_profiles_org           ON profiles(organization_id);
CREATE INDEX idx_production_batches_org ON production_batches(organization_id);
CREATE INDEX idx_production_batches_status ON production_batches(organization_id, status);
CREATE INDEX idx_inventory_items_org    ON inventory_items(organization_id);
CREATE INDEX idx_inventory_movements_org ON inventory_movements(organization_id);
CREATE INDEX idx_inventory_movements_item ON inventory_movements(item_id);

-- ────────────────────────────────────────────────────────────────
-- TRIGGER: crear profile automáticamente al registrarse un usuario
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crea el profile si viene organization_id en los metadatos
  IF NEW.raw_user_meta_data->>'organization_id' IS NOT NULL THEN
    INSERT INTO profiles (id, organization_id, email, full_name, role)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'organization_id')::UUID,
      NEW.email,
      NEW.raw_user_meta_data->>'full_name',
      COALESCE(NEW.raw_user_meta_data->>'role', 'operator')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
