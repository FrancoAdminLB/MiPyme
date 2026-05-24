-- Vincular ítems de pedido con ítems de inventario para descuento automático de stock
ALTER TABLE sales_order_items
  ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_order_items_item ON sales_order_items(item_id);
