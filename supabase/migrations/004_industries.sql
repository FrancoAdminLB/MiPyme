-- ================================================================
-- BLQ Web — Ampliar industrias para PyMEs del interior argentino
-- Migración: 004_industries
-- ================================================================

ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_industry_check;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_industry_check CHECK (industry IN (
    -- Lácteos y derivados
    'dairy',
    -- Ganadería
    'ganaderia',
    -- Frigoríficos
    'frigorifico',
    -- Vitivinicultura
    'bodega',
    -- Cervecería artesanal
    'cerveceria',
    -- Apicultura
    'apicultura',
    -- Olivicultura
    'olivicultura',
    -- Cerealeras / acopio
    'cerealera',
    -- Campos agrícolas
    'agro_campo',
    -- Avicultura
    'avicultura',
    -- Chacinados / embutidos
    'chacinados',
    -- Yerba mate / té
    'yerbatera',
    -- Fruticultura / citricultura
    'fruticultura',
    -- Hidroponía
    'hidroponia',
    -- Manufactura de alimentos (genérico)
    'food_manufacturing',
    -- Servicios de salud
    'health_services',
    -- Educación
    'education'
  ));
