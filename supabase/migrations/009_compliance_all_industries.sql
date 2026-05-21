-- ─── Migración 009: Parámetros reglamentarios — todas las industrias ─────────

-- GANADERÍA — SENASA
UPDATE organizations SET industry_config = industry_config || jsonb_build_object('custom_fields', '[
  {"key":"cabezas",       "label":"Cantidad de cabezas",           "type":"number","unit":"cab.",   "stage":"Recría"},
  {"key":"potrero",       "label":"Potrero / lote",                "type":"text",                   "stage":"Recría"},
  {"key":"peso_promedio", "label":"Peso promedio",                 "type":"number","unit":"kg",     "stage":"Engorde","min_value":180,"max_value":550},
  {"key":"gdp",           "label":"Ganancia diaria de peso (GDP)", "type":"number","unit":"kg/día", "stage":"Engorde","min_value":0.4,"max_value":1.5,"compliance_ref":"SENASA — referencia productiva"},
  {"key":"peso_final",    "label":"Peso final promedio",           "type":"number","unit":"kg",     "stage":"Terminación","min_value":380,"compliance_ref":"SENASA Res. 57/1996 (peso mín. faena)"},
  {"key":"destino_venta", "label":"Destino de venta",              "type":"text",                   "stage":"Venta"}
]'::jsonb) WHERE industry = 'ganaderia';

-- CERVECERÍA — ANMAT + CAA
UPDATE organizations SET industry_config = industry_config || jsonb_build_object('custom_fields', '[
  {"key":"temp_macerado",    "label":"Temperatura macerado",    "type":"number","unit":"°C",  "stage":"Maceración",   "min_value":62, "max_value":78},
  {"key":"tiempo_macerado",  "label":"Tiempo de macerado",      "type":"number","unit":"min", "stage":"Maceración",   "min_value":45, "max_value":90},
  {"key":"og",               "label":"Densidad original (OG)",  "type":"number",              "stage":"Cocción",      "min_value":1.030,"max_value":1.110},
  {"key":"ibu",              "label":"Amargor (IBU)",           "type":"number","unit":"IBU", "stage":"Cocción"},
  {"key":"temp_fermentacion","label":"Temp. fermentación",      "type":"number","unit":"°C",  "stage":"Fermentación", "min_value":10,  "max_value":25,  "compliance_ref":"CAA Art. 1082"},
  {"key":"fg",               "label":"Densidad final (FG)",     "type":"number",              "stage":"Fermentación", "min_value":1.005,"max_value":1.025},
  {"key":"abv",              "label":"Alcohol (ABV)",           "type":"number","unit":"%",   "stage":"Maduración",   "min_value":0.5, "max_value":12,  "compliance_ref":"CAA Art. 1082"},
  {"key":"dias_maduracion",  "label":"Días de maduración",      "type":"number","unit":"d",   "stage":"Maduración"},
  {"key":"litros_envasados", "label":"Litros envasados",        "type":"number","unit":"L",   "stage":"Envasado"}
]'::jsonb) WHERE industry = 'cerveceria';

-- APICULTURA — SENASA + CAA
UPDATE organizations SET industry_config = industry_config || jsonb_build_object('custom_fields', '[
  {"key":"colmenas_cosechadas","label":"Colmenas cosechadas","type":"number","unit":"unid.", "stage":"Cosecha"},
  {"key":"flora",              "label":"Flora predominante", "type":"text",                  "stage":"Cosecha"},
  {"key":"rendimiento_colmena","label":"Kg por colmena",     "type":"number","unit":"kg",    "stage":"Extracción","min_value":5,"max_value":40},
  {"key":"humedad",            "label":"Humedad de la miel", "type":"number","unit":"%",     "stage":"Extracción","max_value":20,"compliance_ref":"CAA Art. 782"},
  {"key":"brix_miel",          "label":"Brix",               "type":"number","unit":"°Brix", "stage":"Decantación","min_value":78,"compliance_ref":"CAA Art. 782"},
  {"key":"kg_fraccionados",    "label":"Kg fraccionados",    "type":"number","unit":"kg",    "stage":"Fraccionamiento"}
]'::jsonb) WHERE industry = 'apicultura';

-- OLIVICULTURA — SENASA + CAA
UPDATE organizations SET industry_config = industry_config || jsonb_build_object('custom_fields', '[
  {"key":"variedad",          "label":"Variedad",          "type":"text",                     "stage":"Recepción aceituna"},
  {"key":"indice_madurez",    "label":"Índice de madurez", "type":"number",                   "stage":"Recepción aceituna","min_value":1,"max_value":5},
  {"key":"temp_molino",       "label":"Temperatura",       "type":"number","unit":"°C",       "stage":"Molido","max_value":27,"compliance_ref":"CAA Art. 519 (extracción en frío)"},
  {"key":"rendimiento_graso", "label":"Rendimiento graso", "type":"number","unit":"%",        "stage":"Centrifugado","min_value":15,"max_value":25},
  {"key":"acidez",            "label":"Acidez",            "type":"number","unit":"% oleico", "stage":"Filtrado","max_value":0.8,"compliance_ref":"CAA Art. 519 (extra virgen)"},
  {"key":"litros_envasados",  "label":"Litros envasados",  "type":"number","unit":"L",        "stage":"Envasado"}
]'::jsonb) WHERE industry = 'olivicultura';

-- CEREALERA — SENASA + ONCCA
UPDATE organizations SET industry_config = industry_config || jsonb_build_object('custom_fields', '[
  {"key":"humedad_entrada","label":"Humedad entrada",     "type":"number","unit":"%",    "stage":"Recepción", "max_value":14.5,"compliance_ref":"SENASA / Norma comercial"},
  {"key":"ph_hecto",       "label":"Peso hectolítrico",  "type":"number","unit":"kg/hl","stage":"Recepción", "min_value":74,  "compliance_ref":"Norma comercial trigo"},
  {"key":"humedad_salida", "label":"Humedad post-secado","type":"number","unit":"%",    "stage":"Secado",    "max_value":14,  "compliance_ref":"SENASA / Norma comercial"},
  {"key":"temp_secado",    "label":"Temperatura secado", "type":"number","unit":"°C",   "stage":"Secado",    "max_value":110, "compliance_ref":"Referencia técnica"},
  {"key":"silo",           "label":"Silo / celda",       "type":"text",                 "stage":"Almacenado"},
  {"key":"destino",        "label":"Destino despacho",   "type":"text",                 "stage":"Despacho"}
]'::jsonb) WHERE industry = 'cerealera';

-- AGRO CAMPO — SENASA
UPDATE organizations SET industry_config = industry_config || jsonb_build_object('custom_fields', '[
  {"key":"lote",           "label":"Lote / potrero",       "type":"text",                  "stage":"Siembra"},
  {"key":"has_sembradas",  "label":"Hectáreas sembradas",  "type":"number","unit":"ha",    "stage":"Siembra"},
  {"key":"anio_campana",   "label":"Campaña",              "type":"text",                  "stage":"Siembra"},
  {"key":"precipitaciones","label":"Precipitaciones",      "type":"number","unit":"mm",    "stage":"Labores culturales"},
  {"key":"rinde_ha",       "label":"Rinde por ha",         "type":"number","unit":"tn/ha", "stage":"Cosecha"},
  {"key":"humedad",        "label":"Humedad cosecha",      "type":"number","unit":"%",     "stage":"Cosecha","max_value":14,"compliance_ref":"Norma comercial"},
  {"key":"precio_tn",      "label":"Precio por tn",        "type":"number","unit":"ARS",   "stage":"Comercialización"}
]'::jsonb) WHERE industry = 'agro_campo';

-- AVICULTURA — SENASA
UPDATE organizations SET industry_config = industry_config || jsonb_build_object('custom_fields', '[
  {"key":"cantidad_aves",  "label":"Cantidad de aves",       "type":"number","unit":"aves","stage":"Recría"},
  {"key":"mortalidad",     "label":"Mortalidad",             "type":"number","unit":"%",   "stage":"Recría","max_value":5,"compliance_ref":"SENASA — referencia productiva"},
  {"key":"peso_promedio",  "label":"Peso promedio",          "type":"number","unit":"kg",  "stage":"Engorde","min_value":0.5,"max_value":4},
  {"key":"conversion",     "label":"Conversión alimenticia", "type":"number",              "stage":"Engorde","min_value":1.5,"max_value":2.2,"compliance_ref":"Referencia productiva"},
  {"key":"rendimiento_res","label":"Rendimiento de res",     "type":"number","unit":"%",   "stage":"Faena","min_value":70,"compliance_ref":"SENASA"},
  {"key":"kg_procesados",  "label":"Kg procesados",          "type":"number","unit":"kg",  "stage":"Procesado"}
]'::jsonb) WHERE industry = 'avicultura';

-- CHACINADOS — SENASA + CAA
UPDATE organizations SET industry_config = industry_config || jsonb_build_object('custom_fields', '[
  {"key":"receta",           "label":"Receta / formulación",        "type":"text",               "stage":"Formulación"},
  {"key":"aditivos",         "label":"Aditivos usados",             "type":"text",               "stage":"Formulación"},
  {"key":"metros_embutidos", "label":"Metros embutidos",            "type":"number","unit":"m",  "stage":"Embutido"},
  {"key":"temp_coccion",     "label":"Temperatura interna cocción", "type":"number","unit":"°C", "stage":"Cocción / Ahumado","min_value":72,"compliance_ref":"CAA Art. 302"},
  {"key":"horas_coccion",    "label":"Horas de cocción / ahumado",  "type":"number","unit":"hs", "stage":"Cocción / Ahumado"},
  {"key":"temp_camara",      "label":"Temp. cámara maduración",     "type":"number","unit":"°C", "stage":"Maduración","min_value":0,"max_value":4,"compliance_ref":"SENASA"},
  {"key":"humedad_rel",      "label":"Humedad relativa",            "type":"number","unit":"%",  "stage":"Maduración","min_value":75,"max_value":85},
  {"key":"dias_maduracion",  "label":"Días de maduración",          "type":"number","unit":"d",  "stage":"Maduración"},
  {"key":"kg_envasados",     "label":"Kg envasados",                "type":"number","unit":"kg", "stage":"Envasado"}
]'::jsonb) WHERE industry = 'chacinados';

-- YERBATERA — INYM + SENASA
UPDATE organizations SET industry_config = industry_config || jsonb_build_object('custom_fields', '[
  {"key":"temp_sapecado",  "label":"Temperatura sapecado",     "type":"number","unit":"°C",    "stage":"Sapecado",        "min_value":280,"max_value":350,"compliance_ref":"Referencia técnica"},
  {"key":"humedad_entrada","label":"Humedad hoja entrada",     "type":"number","unit":"%",     "stage":"Sapecado",        "min_value":65, "max_value":80},
  {"key":"temp_secado",    "label":"Temperatura secado",       "type":"number","unit":"°C",    "stage":"Secado",          "max_value":120,"compliance_ref":"Referencia técnica"},
  {"key":"humedad_final",  "label":"Humedad final",            "type":"number","unit":"%",     "stage":"Secado",          "max_value":10, "compliance_ref":"INYM Res. 1/2002"},
  {"key":"rendimiento",    "label":"Rendimiento seco",         "type":"number","unit":"%",     "stage":"Canchado",        "min_value":35, "max_value":55},
  {"key":"meses_estacion", "label":"Meses de estacionamiento", "type":"number","unit":"meses", "stage":"Estacionamiento", "min_value":9,  "compliance_ref":"INYM — mínimo legal"},
  {"key":"granulometria",  "label":"Granulometría",            "type":"text",                  "stage":"Molienda"}
]'::jsonb) WHERE industry = 'yerbatera';

-- FRUTICULTURA — SENASA
UPDATE organizations SET industry_config = industry_config || jsonb_build_object('custom_fields', '[
  {"key":"calibre",        "label":"Calibre promedio","type":"text",                  "stage":"Cosecha"},
  {"key":"brix",           "label":"Brix (dulzor)",   "type":"number","unit":"°Brix", "stage":"Cosecha"},
  {"key":"merma",          "label":"Merma selección", "type":"number","unit":"%",     "stage":"Selección","max_value":15},
  {"key":"cajas_embaladas","label":"Cajas embaladas", "type":"number","unit":"unid.", "stage":"Empaque"},
  {"key":"destino",        "label":"Destino",         "type":"select","options":["Mercado interno","Exportación","Industria"],"stage":"Empaque"},
  {"key":"temp_camara",    "label":"Temp. cámara",    "type":"number","unit":"°C",    "stage":"Cámara frío","min_value":0,"max_value":4,"compliance_ref":"SENASA"},
  {"key":"dias_camara",    "label":"Días en cámara",  "type":"number","unit":"d",     "stage":"Cámara frío"},
  {"key":"transportista",  "label":"Transportista",   "type":"text",                  "stage":"Despacho"}
]'::jsonb) WHERE industry = 'fruticultura';

-- HIDROPONÍA — SENASA (referencia técnica)
UPDATE organizations SET industry_config = industry_config || jsonb_build_object('custom_fields', '[
  {"key":"cantidad_plantas","label":"Cantidad de plantas",    "type":"number","unit":"unid.", "stage":"Siembra"},
  {"key":"ph_solucion",     "label":"pH solución",            "type":"number","unit":"pH",    "stage":"Trasplante", "min_value":5.5,"max_value":6.5,"compliance_ref":"Referencia técnica"},
  {"key":"ce",              "label":"Conductividad eléctrica","type":"number","unit":"mS/cm", "stage":"Crecimiento","min_value":1.5,"max_value":3.5,"compliance_ref":"Referencia técnica"},
  {"key":"temp_agua",       "label":"Temperatura del agua",   "type":"number","unit":"°C",    "stage":"Crecimiento","min_value":18, "max_value":24, "compliance_ref":"Referencia técnica"},
  {"key":"dias_ciclo",      "label":"Días del ciclo",         "type":"number","unit":"d",     "stage":"Cosecha"},
  {"key":"kg_cosechados",   "label":"Kg cosechados",          "type":"number","unit":"kg",    "stage":"Cosecha"}
]'::jsonb) WHERE industry = 'hidroponia';

-- FOOD MANUFACTURING — ANMAT + SENASA
UPDATE organizations SET industry_config = industry_config || jsonb_build_object('custom_fields', '[
  {"key":"receta",      "label":"Receta / formulación",   "type":"text",                 "stage":"Preparación"},
  {"key":"temp_proceso","label":"Temperatura de proceso", "type":"number","unit":"°C",   "stage":"Producción","min_value":60,"compliance_ref":"CAA / ANMAT — temperatura de cocción"},
  {"key":"merma",       "label":"Merma",                  "type":"number","unit":"%",    "stage":"Control calidad","max_value":20},
  {"key":"unidades",    "label":"Unidades producidas",    "type":"number","unit":"unid.","stage":"Envasado"}
]'::jsonb) WHERE industry = 'food_manufacturing';
