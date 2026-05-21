-- ─── Migración 008: Parámetros reglamentarios por ente regulador ─────────────
-- Agrega min_value, max_value y compliance_ref a los custom_fields
-- de las industrias dairy, frigorifico y bodega.

-- ──────────────────────────────────────────────────────────────────────────────
-- DAIRY — SENASA + CAA
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE organizations
SET industry_config = industry_config
  || jsonb_build_object(
    'custom_fields', '[
      {"key":"temp_leche",             "label":"Temperatura leche",      "type":"number","unit":"°C",    "stage":"Recepción de leche", "max_value":10,                    "compliance_ref":"CAA Art. 556"},
      {"key":"acidez_recepcion",       "label":"Acidez titulable",       "type":"number","unit":"°D",    "stage":"Recepción de leche", "min_value":14,  "max_value":18,    "compliance_ref":"CAA Art. 554"},
      {"key":"densidad_leche",         "label":"Densidad",               "type":"number","unit":"g/mL",  "stage":"Recepción de leche", "min_value":1.028,"max_value":1.034,"compliance_ref":"CAA Art. 554"},
      {"key":"temp_pasteurizacion",    "label":"Temperatura (HTST)",     "type":"number","unit":"°C",    "stage":"Pasteurización",     "min_value":72,                    "compliance_ref":"CAA Art. 560"},
      {"key":"tiempo_pasteurizacion",  "label":"Tiempo (HTST)",          "type":"number","unit":"seg",   "stage":"Pasteurización",     "min_value":15,                    "compliance_ref":"CAA Art. 560"},
      {"key":"temp_cuba",              "label":"Temperatura de cuba",    "type":"number","unit":"°C",    "stage":"Elaboración",        "min_value":28,  "max_value":38},
      {"key":"ph_inicial",             "label":"pH inicial",             "type":"number","unit":"pH",    "stage":"Elaboración",        "min_value":6.5, "max_value":6.8},
      {"key":"cuajo_ml",               "label":"Cuajo",                  "type":"number","unit":"mL",    "stage":"Elaboración"},
      {"key":"fermento_g",             "label":"Fermento láctico",       "type":"number","unit":"g",     "stage":"Elaboración"},
      {"key":"cloruro_calcio_g",       "label":"Cloruro de calcio",      "type":"number","unit":"g",     "stage":"Elaboración"},
      {"key":"cantidad_moldes",        "label":"Cantidad de moldes",     "type":"number","unit":"unid.", "stage":"Moldeado"},
      {"key":"peso_molde_kg",          "label":"Peso por molde",         "type":"number","unit":"kg",    "stage":"Moldeado"},
      {"key":"tiempo_prensado_hs",     "label":"Tiempo de prensado",     "type":"number","unit":"hs",    "stage":"Prensado"},
      {"key":"presion_bar",            "label":"Presión",                "type":"number","unit":"bar",   "stage":"Prensado"},
      {"key":"tiempo_salmuera_hs",     "label":"Tiempo en salmuera",     "type":"number","unit":"hs",    "stage":"Salmuera"},
      {"key":"concentracion_salmuera", "label":"Concentración",          "type":"number","unit":"%",     "stage":"Salmuera",           "min_value":18,  "max_value":22},
      {"key":"temp_salmuera",          "label":"Temperatura salmuera",   "type":"number","unit":"°C",    "stage":"Salmuera",           "min_value":10,  "max_value":14},
      {"key":"dias_maduracion",        "label":"Días de maduración",     "type":"number","unit":"días",  "stage":"Maduración"},
      {"key":"temp_camara",            "label":"Temperatura cámara",     "type":"number","unit":"°C",    "stage":"Maduración",         "min_value":8,   "max_value":14,    "compliance_ref":"SENASA Res. 47/2018"},
      {"key":"humedad_camara",         "label":"Humedad cámara",         "type":"number","unit":"%",     "stage":"Maduración",         "min_value":80,  "max_value":95}
    ]'::jsonb
  )
WHERE industry = 'dairy';

-- ──────────────────────────────────────────────────────────────────────────────
-- FRIGORIFICO — SENASA Res. 4238
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE organizations
SET industry_config = industry_config
  || jsonb_build_object(
    'custom_fields', '[
      {"key":"cabezas_tropa",    "label":"Cabezas en tropa",       "type":"number","unit":"cab.", "stage":"Recepción tropa"},
      {"key":"establecimiento",  "label":"Establecimiento origen", "type":"text",                 "stage":"Recepción tropa"},
      {"key":"rendimiento_res",  "label":"Rendimiento de res",     "type":"number","unit":"%",    "stage":"Faena",   "min_value":45,"max_value":65,"compliance_ref":"SENASA Res. 4238"},
      {"key":"temp_camara",      "label":"Temp. cámara",           "type":"number","unit":"°C",   "stage":"Oreo",    "min_value":0, "max_value":4, "compliance_ref":"SENASA Res. 4238"},
      {"key":"horas_oreo",       "label":"Horas de oreo",          "type":"number","unit":"hs",   "stage":"Oreo",    "min_value":24,               "compliance_ref":"SENASA Res. 4238"},
      {"key":"cortes_obtenidos", "label":"Cortes obtenidos",       "type":"text",                 "stage":"Desposte"},
      {"key":"destino",          "label":"Destino",                "type":"text",                 "stage":"Despacho"}
    ]'::jsonb
  )
WHERE industry = 'frigorifico';

-- ──────────────────────────────────────────────────────────────────────────────
-- BODEGA — INV (Instituto Nacional de Vitivinicultura)
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE organizations
SET industry_config = industry_config
  || jsonb_build_object(
    'custom_fields', '[
      {"key":"brix_inicial",       "label":"Densidad inicial",   "type":"number","unit":"°Brix","stage":"Recepción uva", "min_value":18,"max_value":28, "compliance_ref":"INV"},
      {"key":"anada",              "label":"Añada",              "type":"number",               "stage":"Recepción uva"},
      {"key":"temp_fermentacion",  "label":"Temp. fermentación", "type":"number","unit":"°C",   "stage":"Fermentación",  "min_value":15,"max_value":28, "compliance_ref":"INV"},
      {"key":"brix_final",         "label":"Densidad final",     "type":"number","unit":"°Brix","stage":"Fermentación",  "max_value":4},
      {"key":"ph",                 "label":"pH",                 "type":"number","unit":"pH",   "stage":"Clarificación", "min_value":3.0,"max_value":3.8,"compliance_ref":"INV"},
      {"key":"so2_libre",          "label":"SO₂ libre",          "type":"number","unit":"mg/L", "stage":"Guarda",        "max_value":200,              "compliance_ref":"INV Res. C.35/06"},
      {"key":"meses_guarda",       "label":"Meses de guarda",    "type":"number","unit":"meses","stage":"Guarda"},
      {"key":"botellas_obtenidas", "label":"Botellas obtenidas", "type":"number","unit":"unid.","stage":"Embotellado"}
    ]'::jsonb
  )
WHERE industry = 'bodega';
