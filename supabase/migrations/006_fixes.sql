-- ================================================================
-- BLQ Web — Fixes de seguridad, índices y validaciones
-- Migración: 006_fixes
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- RLS explícita para suppliers
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "suppliers_tenant_isolation" ON suppliers;

CREATE POLICY "suppliers_select" ON suppliers
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "suppliers_insert" ON suppliers
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "suppliers_update" ON suppliers
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "suppliers_delete" ON suppliers
  FOR DELETE USING (organization_id = get_user_org_id());

-- ────────────────────────────────────────────────────────────────
-- RLS explícita para production_batch_inputs
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "batch_inputs_tenant_isolation" ON production_batch_inputs;

CREATE POLICY "batch_inputs_select" ON production_batch_inputs
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "batch_inputs_insert" ON production_batch_inputs
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "batch_inputs_update" ON production_batch_inputs
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "batch_inputs_delete" ON production_batch_inputs
  FOR DELETE USING (organization_id = get_user_org_id());

-- ────────────────────────────────────────────────────────────────
-- Índice compuesto para trazabilidad
-- ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_batch_inputs_org_batch
  ON production_batch_inputs(organization_id, batch_id);

-- ────────────────────────────────────────────────────────────────
-- Validación de fechas en production_batches
-- ────────────────────────────────────────────────────────────────
ALTER TABLE production_batches
  DROP CONSTRAINT IF EXISTS check_batch_dates;

ALTER TABLE production_batches
  ADD CONSTRAINT check_batch_dates
  CHECK (end_date IS NULL OR end_date >= start_date);
