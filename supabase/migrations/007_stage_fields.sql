-- ─── Migración 007: Campos por etapa en producción ───────────────────────────
-- Actualiza industry_config de todas las orgs "dairy" con:
--   1. stages: array de etapas del proceso
--   2. custom_fields: campos con propiedad "stage" por etapa
-- También aplica a las demás industrias con sus respectivas etapas y campos.

-- ──────────────────────────────────────────────────────────────────────────────
-- DAIRY
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE organizations
SET industry_config = industry_config
  || jsonb_build_object(
    'stages', '["Recepción de leche","Pasteurización","Elaboración","Moldeado","Prensado","Salmuera","Maduración"]'::jsonb,
    'custom_fields', '[
      {"key":"temp_leche",             "label":"Temperatura leche",      "type":"number","unit":"°C",   "stage":"Recepción de leche"},
      {"key":"acidez_recepcion",       "label":"Acidez titulable",       "type":"number","unit":"°D",   "stage":"Recepción de leche"},
      {"key":"densidad_leche",         "label":"Densidad",               "type":"number","unit":"g/mL", "stage":"Recepción de leche"},
      {"key":"temp_pasteurizacion",    "label":"Temperatura",            "type":"number","unit":"°C",   "stage":"Pasteurización"},
      {"key":"tiempo_pasteurizacion",  "label":"Tiempo",                 "type":"number","unit":"seg",  "stage":"Pasteurización"},
      {"key":"temp_cuba",              "label":"Temperatura de cuba",    "type":"number","unit":"°C",   "stage":"Elaboración"},
      {"key":"ph_inicial",             "label":"pH inicial",             "type":"number","unit":"pH",   "stage":"Elaboración"},
      {"key":"cuajo_ml",               "label":"Cuajo",                  "type":"number","unit":"mL",   "stage":"Elaboración"},
      {"key":"fermento_g",             "label":"Fermento láctico",       "type":"number","unit":"g",    "stage":"Elaboración"},
      {"key":"cloruro_calcio_g",       "label":"Cloruro de calcio",      "type":"number","unit":"g",    "stage":"Elaboración"},
      {"key":"cantidad_moldes",        "label":"Cantidad de moldes",     "type":"number","unit":"unid.","stage":"Moldeado"},
      {"key":"peso_molde_kg",          "label":"Peso por molde",         "type":"number","unit":"kg",   "stage":"Moldeado"},
      {"key":"tiempo_prensado_hs",     "label":"Tiempo de prensado",     "type":"number","unit":"hs",   "stage":"Prensado"},
      {"key":"presion_bar",            "label":"Presión",                "type":"number","unit":"bar",  "stage":"Prensado"},
      {"key":"tiempo_salmuera_hs",     "label":"Tiempo en salmuera",     "type":"number","unit":"hs",   "stage":"Salmuera"},
      {"key":"concentracion_salmuera", "label":"Concentración",          "type":"number","unit":"%",    "stage":"Salmuera"},
      {"key":"temp_salmuera",          "label":"Temperatura salmuera",   "type":"number","unit":"°C",   "stage":"Salmuera"},
      {"key":"dias_maduracion",        "label":"Días de maduración",     "type":"number","unit":"días", "stage":"Maduración"},
      {"key":"temp_camara",            "label":"Temperatura cámara",     "type":"number","unit":"°C",   "stage":"Maduración"},
      {"key":"humedad_camara",         "label":"Humedad cámara",         "type":"number","unit":"%",    "stage":"Maduración"}
    ]'::jsonb
  )
WHERE industry = 'dairy';

-- ──────────────────────────────────────────────────────────────────────────────
-- GANADERIA
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE organizations
SET industry_config = industry_config
  || jsonb_build_object(
    'stages', '["Recría","Engorde","Terminación","Venta"]'::jsonb,
    'custom_fields', '[
      {"key":"cabezas",       "label":"Cantidad de cabezas",          "type":"number","unit":"cab.", "stage":"Recría"},
      {"key":"potrero",       "label":"Potrero / lote",               "type":"text",                 "stage":"Recría"},
      {"key":"peso_promedio", "label":"Peso promedio",                "type":"number","unit":"kg",   "stage":"Engorde"},
      {"key":"gdp",           "label":"GDP",                          "type":"number","unit":"kg/día","stage":"Engorde"},
      {"key":"peso_final",    "label":"Peso final promedio",          "type":"number","unit":"kg",   "stage":"Terminación"},
      {"key":"destino_venta", "label":"Destino de venta",             "type":"text",                 "stage":"Venta"}
    ]'::jsonb
  )
WHERE industry = 'ganaderia';

-- ──────────────────────────────────────────────────────────────────────────────
-- FRIGORIFICO
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE organizations
SET industry_config = industry_config
  || jsonb_build_object(
    'stages', '["Recepción tropa","Faena","Oreo","Desposte","Despacho"]'::jsonb,
    'custom_fields', '[
      {"key":"cabezas_tropa",   "label":"Cabezas en tropa",      "type":"number","unit":"cab.","stage":"Recepción tropa"},
      {"key":"establecimiento", "label":"Establecimiento origen","type":"text",                "stage":"Recepción tropa"},
      {"key":"rendimiento_res", "label":"Rendimiento de res",    "type":"number","unit":"%",   "stage":"Faena"},
      {"key":"temp_camara",     "label":"Temp. cámara",          "type":"number","unit":"°C",  "stage":"Oreo"},
      {"key":"horas_oreo",      "label":"Horas de oreo",         "type":"number","unit":"hs",  "stage":"Oreo"},
      {"key":"cortes_obtenidos","label":"Cortes obtenidos",      "type":"text",                "stage":"Desposte"},
      {"key":"destino",         "label":"Destino",               "type":"text",                "stage":"Despacho"}
    ]'::jsonb
  )
WHERE industry = 'frigorifico';

-- ──────────────────────────────────────────────────────────────────────────────
-- BODEGA
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE organizations
SET industry_config = industry_config
  || jsonb_build_object(
    'stages', '["Recepción uva","Fermentación","Clarificación","Guarda","Embotellado"]'::jsonb,
    'custom_fields', '[
      {"key":"brix_inicial",       "label":"Densidad inicial",   "type":"number","unit":"°Brix","stage":"Recepción uva"},
      {"key":"anada",              "label":"Añada",              "type":"number",               "stage":"Recepción uva"},
      {"key":"temp_fermentacion",  "label":"Temp. fermentación", "type":"number","unit":"°C",   "stage":"Fermentación"},
      {"key":"brix_final",         "label":"Densidad final",     "type":"number","unit":"°Brix","stage":"Fermentación"},
      {"key":"ph",                 "label":"pH",                 "type":"number","unit":"pH",   "stage":"Clarificación"},
      {"key":"so2_libre",          "label":"SO₂ libre",          "type":"number","unit":"mg/L", "stage":"Guarda"},
      {"key":"meses_guarda",       "label":"Meses de guarda",    "type":"number","unit":"meses","stage":"Guarda"},
      {"key":"botellas_obtenidas", "label":"Botellas obtenidas", "type":"number","unit":"unid.","stage":"Embotellado"}
    ]'::jsonb
  )
WHERE industry = 'bodega';

-- ──────────────────────────────────────────────────────────────────────────────
-- CERVECERIA
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE organizations
SET industry_config = industry_config
  || jsonb_build_object(
    'stages', '["Maceración","Cocción","Fermentación","Maduración","Envasado"]'::jsonb,
    'custom_fields', '[
      {"key":"temp_macerado",    "label":"Temperatura macerado",   "type":"number","unit":"°C", "stage":"Maceración"},
      {"key":"tiempo_macerado",  "label":"Tiempo de macerado",     "type":"number","unit":"min","stage":"Maceración"},
      {"key":"og",               "label":"Densidad original (OG)", "type":"number",             "stage":"Cocción"},
      {"key":"ibu",              "label":"Amargor (IBU)",          "type":"number","unit":"IBU","stage":"Cocción"},
      {"key":"temp_fermentacion","label":"Temp. fermentación",     "type":"number","unit":"°C", "stage":"Fermentación"},
      {"key":"fg",               "label":"Densidad final (FG)",    "type":"number",             "stage":"Fermentación"},
      {"key":"abv",              "label":"Alcohol (ABV)",          "type":"number","unit":"%",  "stage":"Maduración"},
      {"key":"dias_maduracion",  "label":"Días de maduración",     "type":"number","unit":"d",  "stage":"Maduración"},
      {"key":"litros_envasados", "label":"Litros envasados",       "type":"number","unit":"L",  "stage":"Envasado"}
    ]'::jsonb
  )
WHERE industry = 'cerveceria';

-- ──────────────────────────────────────────────────────────────────────────────
-- APICULTURA
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE organizations
SET industry_config = industry_config
  || jsonb_build_object(
    'stages', '["Cosecha","Extracción","Decantación","Fraccionamiento"]'::jsonb,
    'custom_fields', '[
      {"key":"colmenas_cosechadas", "label":"Colmenas cosechadas","type":"number","unit":"unid.","stage":"Cosecha"},
      {"key":"flora",               "label":"Flora predominante", "type":"text",                 "stage":"Cosecha"},
      {"key":"rendimiento_colmena", "label":"Kg por colmena",     "type":"number","unit":"kg",   "stage":"Extracción"},
      {"key":"humedad",             "label":"Humedad de la miel", "type":"number","unit":"%",    "stage":"Extracción"},
      {"key":"brix_miel",           "label":"Brix",               "type":"number","unit":"°Brix","stage":"Decantación"},
      {"key":"kg_fraccionados",     "label":"Kg fraccionados",    "type":"number","unit":"kg",   "stage":"Fraccionamiento"}
    ]'::jsonb
  )
WHERE industry = 'apicultura';

-- ──────────────────────────────────────────────────────────────────────────────
-- Las demás industrias siguen el mismo patrón.
-- Ejecutar después de validar dairy en producción.
-- ──────────────────────────────────────────────────────────────────────────────
