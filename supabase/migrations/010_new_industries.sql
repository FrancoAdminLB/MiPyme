-- ─── Migración 010: Nuevas industrias — Panadería, Acuicultura, Cosmética, Pesca ───

-- PANADERÍA — CAA + ANMAT
UPDATE organizations SET industry_config = industry_config || jsonb_build_object('custom_fields', jsonb_build_array(
  jsonb_build_object('key','temp_agua',           'label','Temperatura del agua',       'type','number','unit','°C',  'stage','Amasado',            'min_value',18, 'max_value',25),
  jsonb_build_object('key','tiempo_amasado',       'label','Tiempo de amasado',          'type','number','unit','min','stage','Amasado'),
  jsonb_build_object('key','temp_fermentacion',    'label','Temperatura de fermentación','type','number','unit','°C',  'stage','Fermentación',       'min_value',24, 'max_value',28),
  jsonb_build_object('key','tiempo_fermentacion',  'label','Tiempo de fermentación',     'type','number','unit','hs', 'stage','Fermentación'),
  jsonb_build_object('key','temp_horneado',        'label','Temperatura de horneado',    'type','number','unit','°C',  'stage','Horneado',           'min_value',180,'max_value',250,'compliance_ref','CAA Art. 726'),
  jsonb_build_object('key','tiempo_horneado',      'label','Tiempo de horneado',         'type','number','unit','min','stage','Horneado'),
  jsonb_build_object('key','temp_interna',         'label','Temperatura interna final',  'type','number','unit','°C',  'stage','Horneado',           'min_value',90, 'compliance_ref','CAA — cocción completa'),
  jsonb_build_object('key','kg_producidos',        'label','Kg producidos',              'type','number','unit','kg', 'stage','Envasado'),
  jsonb_build_object('key','merma',                'label','Merma',                      'type','number','unit','%',  'stage','Envasado',           'max_value',15)
)) WHERE industry = 'panaderia';

-- ACUICULTURA — SENASA
UPDATE organizations SET industry_config = industry_config || jsonb_build_object('custom_fields', jsonb_build_array(
  jsonb_build_object('key','especie',           'label','Especie',                    'type','text',                 'stage','Siembra'),
  jsonb_build_object('key','cantidad_alevines', 'label','Cantidad de alevines',       'type','number','unit','unid.','stage','Siembra'),
  jsonb_build_object('key','densidad',          'label','Densidad de siembra',        'type','number','unit','kg/m³','stage','Siembra',            'max_value',25,'compliance_ref','SENASA — referencia productiva'),
  jsonb_build_object('key','temp_agua',         'label','Temperatura del agua',       'type','number','unit','°C',   'stage','Crecimiento',        'min_value',8,'max_value',18,'compliance_ref','Referencia técnica salmonídeos'),
  jsonb_build_object('key','oxigeno',           'label','Oxígeno disuelto',           'type','number','unit','mg/L', 'stage','Crecimiento',        'min_value',6,'compliance_ref','SENASA — mínimo vital'),
  jsonb_build_object('key','ph_agua',           'label','pH del agua',                'type','number','unit','pH',   'stage','Crecimiento',        'min_value',6.5,'max_value',8.5),
  jsonb_build_object('key','conversion',        'label','Conversión alimenticia (FCR)','type','number',              'stage','Crecimiento',        'min_value',1.0,'max_value',2.0,'compliance_ref','Referencia productiva'),
  jsonb_build_object('key','mortalidad',        'label','Mortalidad',                 'type','number','unit','%',    'stage','Control sanitario',  'max_value',5,'compliance_ref','SENASA — referencia productiva'),
  jsonb_build_object('key','peso_promedio',     'label','Peso promedio',              'type','number','unit','kg',   'stage','Cosecha'),
  jsonb_build_object('key','kg_cosechados',     'label','Kg cosechados',              'type','number','unit','kg',   'stage','Cosecha'),
  jsonb_build_object('key','temp_proceso',      'label','Temperatura de proceso',     'type','number','unit','°C',   'stage','Procesado',         'max_value',4,'compliance_ref','SENASA — cadena de frío')
)) WHERE industry = 'acuicultura';

-- COSMÉTICA — ANMAT Disp. 4622/12
UPDATE organizations SET industry_config = industry_config || jsonb_build_object('custom_fields', jsonb_build_array(
  jsonb_build_object('key','formula',            'label','Código de fórmula',         'type','text',  'stage','Formulación'),
  jsonb_build_object('key','lote_mp',            'label','Lote de materia prima',     'type','text',  'stage','Formulación'),
  jsonb_build_object('key','temp_proceso',       'label','Temperatura de proceso',    'type','number','unit','°C',    'stage','Mezclado',          'compliance_ref','Referencia técnica por fórmula'),
  jsonb_build_object('key','tiempo_mezclado',    'label','Tiempo de mezclado',        'type','number','unit','min',   'stage','Mezclado'),
  jsonb_build_object('key','ph_producto',        'label','pH del producto',           'type','number','unit','pH',    'stage','Control de calidad','min_value',4.5,'max_value',8.5,'compliance_ref','ANMAT Disp. 4622/12'),
  jsonb_build_object('key','resultado_micro',    'label','Resultado microbiológico',  'type','select','options',array['Conforme','No conforme','Pendiente'],'stage','Control de calidad','compliance_ref','ANMAT Disp. 4622/12'),
  jsonb_build_object('key','unidades_envasadas', 'label','Unidades envasadas',        'type','number','unit','unid.','stage','Envasado'),
  jsonb_build_object('key','numero_liberacion',  'label','N° de liberación ANMAT',   'type','text',  'stage','Liberación')
)) WHERE industry = 'cosmetica';

-- PESCA — SENASA + SAGyP
UPDATE organizations SET industry_config = industry_config || jsonb_build_object('custom_fields', jsonb_build_array(
  jsonb_build_object('key','especie',             'label','Especie',                  'type','text',                 'stage','Recepción'),
  jsonb_build_object('key','origen',              'label','Origen / embarcación',     'type','text',                 'stage','Recepción'),
  jsonb_build_object('key','temp_recepcion',      'label','Temperatura de recepción', 'type','number','unit','°C',   'stage','Recepción',    'max_value',4,  'compliance_ref','SENASA — cadena de frío'),
  jsonb_build_object('key','kg_recibidos',        'label','Kg recibidos',             'type','number','unit','kg',   'stage','Recepción'),
  jsonb_build_object('key','categoria',           'label','Categoría / talla',        'type','text',                 'stage','Clasificación'),
  jsonb_build_object('key','merma_clasificacion', 'label','Merma de clasificación',   'type','number','unit','%',    'stage','Clasificación','max_value',15),
  jsonb_build_object('key','temp_proceso',        'label','Temperatura de proceso',   'type','number','unit','°C',   'stage','Procesado',    'max_value',7,  'compliance_ref','SENASA Res. 4238'),
  jsonb_build_object('key','rendimiento',         'label','Rendimiento de proceso',   'type','number','unit','%',    'stage','Procesado',    'min_value',40,'max_value',70),
  jsonb_build_object('key','temp_congelado',      'label','Temperatura de congelado', 'type','number','unit','°C',   'stage','Congelado',    'max_value',-18,'compliance_ref','SENASA — congelado IQF'),
  jsonb_build_object('key','kg_envasados',        'label','Kg envasados',             'type','number','unit','kg',   'stage','Envasado'),
  jsonb_build_object('key','destino',             'label','Destino',                  'type','select','options',array['Exportación','Mercado interno','Industria'],'stage','Despacho')
)) WHERE industry = 'pesca';
