-- ─── Migración 011: Industria Tambo / Producción lechera ─────────────────────

UPDATE organizations SET industry_config = industry_config || jsonb_build_object('custom_fields', jsonb_build_array(
  jsonb_build_object('key','vacas_ordeñe',     'label','Vacas en ordeñe',           'type','number','unit','cab.',     'stage','Ordeñe'),
  jsonb_build_object('key','litros_totales',   'label','Litros totales',            'type','number','unit','L',        'stage','Ordeñe'),
  jsonb_build_object('key','litros_vaca',      'label','Litros por vaca',           'type','number','unit','L/vaca',   'stage','Ordeñe',            'compliance_ref','Referencia productiva'),
  jsonb_build_object('key','grasa',            'label','Tenor graso',               'type','number','unit','%',        'stage','Control de calidad','min_value',3.0,'compliance_ref','CAA Art. 554'),
  jsonb_build_object('key','proteina',         'label','Proteína',                  'type','number','unit','%',        'stage','Control de calidad','min_value',2.9,'compliance_ref','CAA Art. 554'),
  jsonb_build_object('key','acidez',           'label','Acidez titulable',          'type','number','unit','°D',       'stage','Control de calidad','min_value',14,'max_value',18,'compliance_ref','CAA Art. 554'),
  jsonb_build_object('key','densidad',         'label','Densidad',                  'type','number','unit','g/mL',     'stage','Control de calidad','min_value',1.028,'max_value',1.034,'compliance_ref','CAA Art. 554'),
  jsonb_build_object('key','ccs',              'label','Células somáticas (CCS)',   'type','number','unit','x1000/mL', 'stage','Control de calidad','max_value',400,'compliance_ref','CAA Art. 554 — SENASA'),
  jsonb_build_object('key','ufc',              'label','Recuento bacteriano (UFC)', 'type','number','unit','UFC/mL',   'stage','Control de calidad','max_value',100000,'compliance_ref','CAA Art. 554'),
  jsonb_build_object('key','temp_enfriado',    'label','Temperatura de enfriado',   'type','number','unit','°C',       'stage','Enfriado',          'max_value',4,'compliance_ref','CAA Art. 556'),
  jsonb_build_object('key','litros_entregados','label','Litros entregados',         'type','number','unit','L',        'stage','Entrega'),
  jsonb_build_object('key','destino',          'label','Destino',                   'type','text',                     'stage','Entrega')
)) WHERE industry = 'tambo';
