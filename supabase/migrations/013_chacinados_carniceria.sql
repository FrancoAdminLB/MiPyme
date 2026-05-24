-- Migración 013: Carnicería / Chacinados — campos completos
-- SENASA Res. 186/93, Res. 3274/00, CAA Art. 271, CAA Art. 302

UPDATE organizations
SET industry_config = jsonb_build_object(
  'input_label',   'Kg de carne',
  'output_label',  'Kg de producto',
  'product_types', jsonb_build_array('Asado','Lomo','Bife angosto','Bife ancho','Paleta','Vacío','Matambre','Tapa de cuadril','Ossobuco','Picada especial','Salame','Chorizo seco','Chorizo fresco','Morcilla','Jamón cocido','Bondiola','Longaniza'),
  'stages',        jsonb_build_array('Recepción hacienda','Desposte','Cámara frigorífica','Venta / Despacho','Recepción MP','Formulación','Embutido','Cocción / Ahumado','Maduración','Envasado'),
  'custom_fields', jsonb_build_array(
    -- Recepción hacienda
    jsonb_build_object('key','operario',               'label','Operario / responsable',          'type','text',   'stage','Recepción hacienda'),
    jsonb_build_object('key','dt_numero',              'label','N° DT (Documento de Tránsito)',    'type','text',   'stage','Recepción hacienda', 'required',true,  'compliance_ref','SENASA Res. 186/93 — DT obligatorio para traslado de hacienda'),
    jsonb_build_object('key','proveedor_frigorifico',  'label','Frigorífico / proveedor',          'type','text',   'stage','Recepción hacienda', 'required',true,  'compliance_ref','SENASA — trazabilidad cárnica'),
    jsonb_build_object('key','n_hab_senasa_proveedor', 'label','N° habilitación SENASA proveedor', 'type','text',   'stage','Recepción hacienda', 'required',true,  'compliance_ref','SENASA Res. 3274/00 — habilitación frigorífico'),
    jsonb_build_object('key','categoria_animal',       'label','Categoría animal',                 'type','select', 'stage','Recepción hacienda', 'options',jsonb_build_array('Novillo','Novillito','Vaquillona','Vaca','Toro','Ternero/a','Cerdo','Ovino')),
    jsonb_build_object('key','cantidad_medias',        'label','Cantidad de medias reses',         'type','number', 'stage','Recepción hacienda', 'unit','u'),
    jsonb_build_object('key','kg_media_res',           'label','Kg totales recibidos',             'type','number', 'stage','Recepción hacienda', 'unit','kg', 'required',true),
    jsonb_build_object('key','temp_recepcion_camara',  'label','Temp. al recibir',                 'type','number', 'stage','Recepción hacienda', 'unit','°C', 'required',true, 'max_value',7, 'compliance_ref','CAA Art. 271 — carnes refrigeradas máx. 7°C en recepción'),
    -- Desposte
    jsonb_build_object('key','kg_entrada_desposte',    'label','Kg entrada al desposte',           'type','number', 'stage','Desposte', 'unit','kg', 'required',true),
    jsonb_build_object('key','kg_cuarto_delantero',    'label','Kg cuarto delantero',              'type','number', 'stage','Desposte', 'unit','kg'),
    jsonb_build_object('key','kg_cuarto_trasero',      'label','Kg cuarto trasero',                'type','number', 'stage','Desposte', 'unit','kg'),
    jsonb_build_object('key','kg_asado',               'label','Kg asado',                         'type','number', 'stage','Desposte', 'unit','kg'),
    jsonb_build_object('key','kg_lomo',                'label','Kg lomo',                          'type','number', 'stage','Desposte', 'unit','kg'),
    jsonb_build_object('key','kg_bife_angosto',        'label','Kg bife angosto',                  'type','number', 'stage','Desposte', 'unit','kg'),
    jsonb_build_object('key','kg_bife_ancho',          'label','Kg bife ancho / ojo de bife',      'type','number', 'stage','Desposte', 'unit','kg'),
    jsonb_build_object('key','kg_paleta',              'label','Kg paleta',                        'type','number', 'stage','Desposte', 'unit','kg'),
    jsonb_build_object('key','kg_vacio',               'label','Kg vacío',                         'type','number', 'stage','Desposte', 'unit','kg'),
    jsonb_build_object('key','kg_tapa_cuadril',        'label','Kg tapa de cuadril',               'type','number', 'stage','Desposte', 'unit','kg'),
    jsonb_build_object('key','kg_matambre',            'label','Kg matambre',                      'type','number', 'stage','Desposte', 'unit','kg'),
    jsonb_build_object('key','kg_ossobuco',            'label','Kg ossobuco',                      'type','number', 'stage','Desposte', 'unit','kg'),
    jsonb_build_object('key','kg_picada_especial',     'label','Kg picada especial',               'type','number', 'stage','Desposte', 'unit','kg'),
    jsonb_build_object('key','kg_picada_comun',        'label','Kg picada común',                  'type','number', 'stage','Desposte', 'unit','kg'),
    jsonb_build_object('key','kg_merma_desposte',      'label','Kg merma (hueso + grasa + recorte)','type','number','stage','Desposte', 'unit','kg'),
    jsonb_build_object('key','pct_merma_desposte',     'label','% merma desposte',                 'type','number', 'stage','Desposte', 'unit','%', 'max_value',30, 'compliance_ref','BPM — rendimiento carnicería (referencia ~20–28%)'),
    jsonb_build_object('key','temp_sala_desposte',     'label','Temp. sala de desposte',           'type','number', 'stage','Desposte', 'unit','°C', 'required',true, 'max_value',12, 'compliance_ref','CAA Art. 271 — sala de desposte máx. 12°C'),
    -- Cámara frigorífica
    jsonb_build_object('key','temp_camara_fria',       'label','Temp. cámara frigorífica',         'type','number', 'stage','Cámara frigorífica', 'unit','°C', 'required',true, 'min_value',0, 'max_value',4, 'compliance_ref','CAA Art. 271 — carnes frescas conservación 0–4°C'),
    jsonb_build_object('key','temp_exhibicion',        'label','Temp. vitrina de exhibición',      'type','number', 'stage','Cámara frigorífica', 'unit','°C', 'required',true, 'min_value',0, 'max_value',7, 'compliance_ref','CAA Art. 271 — exhibición máx. 7°C'),
    jsonb_build_object('key','kg_stock_camara',        'label','Kg en cámara al cierre',           'type','number', 'stage','Cámara frigorífica', 'unit','kg'),
    jsonb_build_object('key','estado_camara',          'label','Estado cámara',                    'type','select', 'stage','Cámara frigorífica', 'required',true, 'options',jsonb_build_array('OK','Alerta temperatura','Mantenimiento'), 'compliance_ref','SENASA — plan de mantenimiento equipos de frío'),
    -- Venta / Despacho
    jsonb_build_object('key','kg_vendidos_mostrador',   'label','Kg vendidos en mostrador',        'type','number', 'stage','Venta / Despacho', 'unit','kg'),
    jsonb_build_object('key','kg_vendidos_mayorista',   'label','Kg vendidos a mayoristas',        'type','number', 'stage','Venta / Despacho', 'unit','kg'),
    jsonb_build_object('key','kg_vendidos_gastronomia', 'label','Kg vendidos a gastronomía',       'type','number', 'stage','Venta / Despacho', 'unit','kg'),
    jsonb_build_object('key','remito_numero',           'label','N° remito',                       'type','text',   'stage','Venta / Despacho'),
    -- Recepción MP (chacinados)
    jsonb_build_object('key','proveedor_carne',        'label','Proveedor de carne (chacinados)',  'type','text',   'stage','Recepción MP', 'required',true, 'compliance_ref','SENASA — trazabilidad cárnica'),
    jsonb_build_object('key','lote_carne',             'label','Lote / tropa de carne',            'type','text',   'stage','Recepción MP', 'required',true, 'compliance_ref','SENASA — trazabilidad cárnica'),
    jsonb_build_object('key','kg_carne_vacuna',        'label','Kg carne vacuna',                  'type','number', 'stage','Recepción MP', 'unit','kg'),
    jsonb_build_object('key','kg_carne_porcina',       'label','Kg carne porcina',                 'type','number', 'stage','Recepción MP', 'unit','kg'),
    jsonb_build_object('key','kg_grasa',               'label','Kg grasa',                         'type','number', 'stage','Recepción MP', 'unit','kg'),
    jsonb_build_object('key','temp_recepcion',         'label','Temp. recepción carne',            'type','number', 'stage','Recepción MP', 'unit','°C', 'required',true, 'max_value',4, 'compliance_ref','SENASA — cadena de frío cárnica'),
    -- Formulación
    jsonb_build_object('key','receta_codigo',          'label','Código de receta',                 'type','text',   'stage','Formulación', 'required',true, 'compliance_ref','SENASA / CAA — fórmula registrada'),
    jsonb_build_object('key','kg_sal',                 'label','Kg de sal',                        'type','number', 'stage','Formulación', 'unit','kg'),
    jsonb_build_object('key','lote_sal',               'label','Lote de sal',                      'type','text',   'stage','Formulación'),
    jsonb_build_object('key','kg_nitrito_sodico',      'label','Nitrito de sodio (kg)',             'type','number', 'stage','Formulación', 'unit','kg', 'compliance_ref','CAA Art. 302 — dosis máxima'),
    jsonb_build_object('key','lote_nitrito',           'label','Lote nitrito de sodio',            'type','text',   'stage','Formulación'),
    jsonb_build_object('key','nitritos_ppm',           'label','Nitritos dosificados',             'type','number', 'stage','Formulación', 'unit','ppm', 'required',true, 'max_value',150, 'compliance_ref','CAA Art. 302 — máx. 150 ppm adicionados'),
    jsonb_build_object('key','fosfatos_g_kg',          'label','Fosfatos añadidos',                'type','number', 'stage','Formulación', 'unit','g/kg', 'max_value',5, 'compliance_ref','CAA Art. 302 — máx. 5 g/kg'),
    jsonb_build_object('key','antioxidante',           'label','Antioxidante (tipo/lote)',          'type','text',   'stage','Formulación'),
    jsonb_build_object('key','especias',               'label','Especias (tipo/lote)',              'type','text',   'stage','Formulación'),
    jsonb_build_object('key','tipo_tripa',             'label','Tipo de tripa',                    'type','select', 'stage','Formulación', 'options',jsonb_build_array('Natural porcina','Natural ovina','Colágeno','Artificial fibrosa','Plástico permeable')),
    jsonb_build_object('key','diametro_tripa_mm',      'label','Diámetro de tripa',                'type','number', 'stage','Formulación', 'unit','mm'),
    -- Embutido
    jsonb_build_object('key','temp_picado',            'label','Temp. masa al picar/embutir',      'type','number', 'stage','Embutido', 'unit','°C', 'max_value',10, 'compliance_ref','BPM — higiene cárnica'),
    jsonb_build_object('key','metros_embutidos',       'label','Metros embutidos',                 'type','number', 'stage','Embutido', 'unit','m'),
    jsonb_build_object('key','calibre_embutido',       'label','Calibre embutido',                 'type','text',   'stage','Embutido'),
    -- Cocción / Ahumado
    jsonb_build_object('key','tipo_ahumado',           'label','Tipo de proceso térmico',          'type','select', 'stage','Cocción / Ahumado', 'options',jsonb_build_array('Cocción sin ahumado','Ahumado en frío','Ahumado en caliente','Sin cocción (crudo)')),
    jsonb_build_object('key','temp_interna_coccion',   'label','Temp. interna alcanzada',          'type','number', 'stage','Cocción / Ahumado', 'unit','°C', 'required',true, 'min_value',72, 'compliance_ref','CAA Art. 302 — mínimo 72°C t.i.'),
    jsonb_build_object('key','horas_coccion',          'label','Horas de cocción / ahumado',       'type','number', 'stage','Cocción / Ahumado', 'unit','hs'),
    jsonb_build_object('key','temp_camara_coccion',    'label','Temp. cámara de cocción',          'type','number', 'stage','Cocción / Ahumado', 'unit','°C'),
    -- Maduración
    jsonb_build_object('key','temp_camara',            'label','Temp. cámara de maduración',       'type','number', 'stage','Maduración', 'unit','°C', 'required',true, 'min_value',0, 'max_value',15, 'compliance_ref','SENASA — conservación chacinados'),
    jsonb_build_object('key','humedad_rel',            'label','Humedad relativa',                 'type','number', 'stage','Maduración', 'unit','%', 'min_value',70, 'max_value',90),
    jsonb_build_object('key','dias_maduracion',        'label','Días de maduración',               'type','number', 'stage','Maduración', 'unit','d'),
    jsonb_build_object('key','aw',                     'label','Actividad de agua (aw)',            'type','number', 'stage','Maduración', 'max_value',0.92, 'compliance_ref','BPM — inocuidad chacinados secos'),
    jsonb_build_object('key','nitritos_residuales',    'label','Nitritos residuales',              'type','number', 'stage','Maduración', 'unit','ppm', 'required',true, 'max_value',50, 'compliance_ref','CAA Art. 302 — máx. 50 ppm en producto final'),
    -- Envasado
    jsonb_build_object('key','kg_envasados',           'label','Kg envasados',                     'type','number', 'stage','Envasado', 'unit','kg'),
    jsonb_build_object('key','tipo_envase',            'label','Tipo de envase',                   'type','select', 'stage','Envasado', 'options',jsonb_build_array('Al vacío','Atmósfera modificada','Skin pack','Sin envase (a granel)')),
    jsonb_build_object('key','vida_util_dias',         'label','Vida útil declarada',              'type','number', 'stage','Envasado', 'unit','d', 'required',true, 'compliance_ref','ANMAT — rotulado vida útil'),
    jsonb_build_object('key','resultado_micro',        'label','Resultado microbiológico',         'type','select', 'stage','Envasado', 'required',true, 'options',jsonb_build_array('Aprobado','Observado','Rechazado'), 'compliance_ref','ANMAT / CAA — inocuidad chacinados')
  )
)
WHERE industry = 'chacinados';
