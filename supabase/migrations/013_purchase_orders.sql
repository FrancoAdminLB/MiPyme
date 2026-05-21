-- Tabla de órdenes de compra / reposición
CREATE TABLE IF NOT EXISTS purchase_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id               UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  supplier_id           UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  quantity_requested    NUMERIC(12,3) NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'sent', 'received', 'cancelled')),
  triggered_by          TEXT NOT NULL DEFAULT 'auto'
                          CHECK (triggered_by IN ('auto', 'manual')),
  stock_at_creation     NUMERIC(12,3),
  min_stock_at_creation NUMERIC(12,3),
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  sent_at               TIMESTAMPTZ,
  received_at           TIMESTAMPTZ
);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON purchase_orders
  USING (organization_id = get_user_org_id());
