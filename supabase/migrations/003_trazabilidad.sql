-- ================================================================
-- BLQ Web — Trazabilidad: proveedores, insumos por lote, vencimientos
-- Migración: 003_trazabilidad
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- SUPPLIERS (proveedores)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE suppliers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  cuit             TEXT,
  contact_name     TEXT,
  contact_phone    TEXT,
  contact_email    TEXT,
  category         TEXT,   -- "materia_prima", "insumo", "servicio"
  notes            TEXT,
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- INVENTORY_ITEMS — agregar columnas de trazabilidad
-- ────────────────────────────────────────────────────────────────
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS supplier_id   UUID REFERENCES suppliers(id),
  ADD COLUMN IF NOT EXISTS lot_number    TEXT,
  ADD COLUMN IF NOT EXISTS expiry_date   DATE,
  ADD COLUMN IF NOT EXISTS received_date DATE;

-- ────────────────────────────────────────────────────────────────
-- PRODUCTION_BATCH_INPUTS (insumos usados en cada lote)
-- Corazón de la trazabilidad bidireccional
-- ────────────────────────────────────────────────────────────────
CREATE TABLE production_batch_inputs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  batch_id         UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
  item_id          UUID NOT NULL REFERENCES inventory_items(id),
  quantity_used    NUMERIC(12,3) NOT NULL,
  lot_number       TEXT,     -- lote del proveedor en el momento del uso
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────────────────────────────
ALTER TABLE suppliers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batch_inputs  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_tenant_isolation" ON suppliers
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "batch_inputs_tenant_isolation" ON production_batch_inputs
  FOR ALL USING (organization_id = get_user_org_id());

-- ────────────────────────────────────────────────────────────────
-- ÍNDICES
-- ────────────────────────────────────────────────────────────────
CREATE INDEX idx_suppliers_org          ON suppliers(organization_id);
CREATE INDEX idx_batch_inputs_org       ON production_batch_inputs(organization_id);
CREATE INDEX idx_batch_inputs_batch     ON production_batch_inputs(batch_id);
CREATE INDEX idx_batch_inputs_item      ON production_batch_inputs(item_id);
CREATE INDEX idx_inventory_expiry       ON inventory_items(organization_id, expiry_date)
  WHERE expiry_date IS NOT NULL;
