-- Migración 019: Agregar costo unitario a ítems de inventario
-- Requerido para el módulo de Finanzas: cálculo de costo de producción por lote

ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(12, 2) DEFAULT NULL;

COMMENT ON COLUMN inventory_items.unit_cost IS 'Costo unitario de compra en ARS. Usado para calcular el costo de producción por lote.';
