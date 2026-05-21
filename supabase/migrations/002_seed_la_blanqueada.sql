-- ================================================================
-- BLQ Web — Seed: La Blanqueada como primer tenant
-- Migración: 002_seed_la_blanqueada
-- ================================================================

INSERT INTO organizations (id, name, slug, industry, plan, industry_config)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'La Blanqueada Lácteos',
  'la-blanqueada',
  'dairy',
  'pro',
  '{
    "currency": "ARS",
    "units": {
      "production": "kg",
      "milk": "litros",
      "temperature": "°C"
    },
    "features": ["production", "inventory", "reports", "ai_assistant"],
    "custom_fields": [
      {
        "key": "maduración_días",
        "label": "Días de maduración",
        "type": "number",
        "required": false
      },
      {
        "key": "tipo_leche",
        "label": "Tipo de leche",
        "type": "select",
        "options": ["entera", "descremada", "semidescremada"],
        "required": true
      }
    ]
  }'::JSONB
)
ON CONFLICT (slug) DO NOTHING;

-- Seed de ítems de inventario base para lácteos
INSERT INTO inventory_items (organization_id, name, sku, category, unit, current_stock, min_stock)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Leche cruda', 'MP-LECHE-001', 'materia_prima', 'litros', 0, 1000),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Sal fina', 'MP-SAL-001', 'materia_prima', 'kg', 0, 50),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Cuajo líquido', 'MP-CUAJO-001', 'materia_prima', 'litros', 0, 5),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Fermento láctico', 'MP-FERMENTO-001', 'materia_prima', 'kg', 0, 2),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Gouda x kg', 'PT-GOUDA-001', 'producto_terminado', 'kg', 0, 50),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Sardo x kg', 'PT-SARDO-001', 'producto_terminado', 'kg', 0, 30),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Provoleta x kg', 'PT-PROVOLETA-001', 'producto_terminado', 'kg', 0, 20),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Cremoso x kg', 'PT-CREMOSO-001', 'producto_terminado', 'kg', 0, 40),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Muzzarella x kg', 'PT-MUZZA-001', 'producto_terminado', 'kg', 0, 50)
ON CONFLICT DO NOTHING;
