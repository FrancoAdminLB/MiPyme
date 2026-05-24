-- Pedidos de clientes (ventas)
CREATE TABLE sales_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  order_number    TEXT NOT NULL,
  client_name     TEXT NOT NULL,
  client_cuit     TEXT,
  client_email    TEXT,
  client_phone    TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','preparing','ready','delivered','cancelled')),
  delivery_date   DATE,
  notes           TEXT,
  total_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_by      UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  confirmed_at    TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  UNIQUE(organization_id, order_number)
);

CREATE TABLE sales_order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  order_id        UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_name    TEXT NOT NULL,
  quantity        NUMERIC(12,3) NOT NULL,
  unit            TEXT NOT NULL DEFAULT 'kg',
  unit_price      NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal        NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  notes           TEXT
);

ALTER TABLE sales_orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON sales_orders
  USING (organization_id = get_user_org_id());

CREATE POLICY "tenant_isolation" ON sales_order_items
  USING (organization_id = get_user_org_id());

CREATE INDEX idx_sales_orders_org    ON sales_orders(organization_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(organization_id, status);
CREATE INDEX idx_sales_order_items   ON sales_order_items(order_id);

-- Config fiscal del tenant (CUIT, punto de venta, credenciales TusFacturasAPP)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS fiscal_config JSONB NOT NULL DEFAULT '{}';
