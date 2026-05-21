-- Motor de alertas configurables
CREATE TABLE IF NOT EXISTS alert_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  module          TEXT NOT NULL CHECK (module IN ('produccion', 'inventario')),
  metric          TEXT NOT NULL,
  -- produccion: yield_percentage, days_in_progress
  -- inventario: stock_below_min, stock_absolute
  operator        TEXT NOT NULL CHECK (operator IN ('lt', 'gt', 'lte', 'gte')),
  threshold       NUMERIC NOT NULL,
  item_id         UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  -- NULL = aplica a todos los ítems / lotes
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON alert_rules
  USING (organization_id = get_user_org_id());
