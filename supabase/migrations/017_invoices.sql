-- Facturas emitidas — registro de comprobantes AFIP via TusFacturasAPP
CREATE TABLE invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sales_order_id   UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
  tipo_comprobante TEXT NOT NULL DEFAULT 'B',
  punto_venta      INTEGER NOT NULL,
  numero           INTEGER,
  cuit_receptor    TEXT,
  razon_social     TEXT,
  total_amount     NUMERIC(12,2) NOT NULL,
  cae              TEXT,
  cae_vencimiento  DATE,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','issued','error')),
  error_message    TEXT,
  issued_at        TIMESTAMPTZ,
  raw_response     JSONB,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON invoices
  USING (organization_id = get_user_org_id());

CREATE INDEX idx_invoices_org   ON invoices(organization_id);
CREATE INDEX idx_invoices_order ON invoices(sales_order_id);
