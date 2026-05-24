'use client'

import { useState } from 'react'
import { X, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Metric {
  label: string
  value: string
  sub: string
  alert?: boolean
}

interface IndustryDemo {
  regulator: string
  tagline: string
  description: string
  pains: string[]         // Dolores actuales del cliente
  gains: string[]         // Resultados que el cliente quiere lograr
  painRelievers: string[] // Cómo MiPyme alivia esos dolores
  gainCreators: string[]  // Cómo MiPyme crea esos beneficios
  metrics: Metric[]
  stages: string[]
}

const DEMOS: Record<string, IndustryDemo> = {
  Tambo: {
    regulator: 'SENASA + CAA',
    tagline: 'Cada ordeñe registrado, cada litro trazado.',
    description: 'El tambo genera datos críticos dos veces por día: litros, CCS, UFC, temperatura de enfriado. Hoy esos datos quedan en cuadernos o planillas desconectadas. MiPyme los centraliza, los valida contra CAA Art. 554/556 en tiempo real y te muestra en segundos si estás dentro de norma.',
    pains: [
      'Los litros y parámetros de calidad se anotan en un cuaderno, sin historial ni análisis de tendencias',
      'No te enterás de que el CCS subió hasta que el precio de la leche ya bajó',
      'Para una inspección SENASA buscás datos en papeles, planillas y mensajes de WhatsApp al mismo tiempo',
    ],
    gains: [
      'Saber en tiempo real si la leche está dentro de los parámetros CAA antes de despacharla',
      'Tener el historial completo de producción y calidad disponible para negociar mejor precio con la usina',
      'Pasar cualquier inspección SENASA sin preparación previa ni búsqueda de documentación',
    ],
    painRelievers: [
      'Registrás litros, CCS, UFC y temperatura por ordeñe en segundos desde el celular, sin papel',
      'Alerta automática cuando el recuento bacteriano supera el límite CAA Art. 554 (400k CCS / 100k UFC)',
      'Documentación centralizada y lista para SENASA en cualquier momento, sin preparación previa',
    ],
    gainCreators: [
      'Dashboard diario con producción, calidad y tendencia semanal para negociar precio con datos en la mano',
      'Comparativo de producción entre ordeñes, entre vacas y entre semanas para tomar decisiones de manejo',
      'Reporte mensual automático que muestra la evolución de CCS y UFC para demostrar mejora continua a la usina',
    ],
    metrics: [
      { label: 'Producción hoy', value: '12.400 L', sub: '+3% vs ayer' },
      { label: 'Litros / vaca', value: '24.8 L', sub: 'Promedio del rodeo' },
      { label: 'CCS', value: '180 k/mL', sub: 'Dentro de norma ✓' },
    ],
    stages: ['Ordeñe', 'Control calidad', 'Enfriado', 'Entrega'],
  },

  Lácteos: {
    regulator: 'SENASA + CAA',
    tagline: 'De la tina al queso, con trazabilidad completa.',
    description: 'La elaboración de quesos involucra temperatura, acidez, tiempos de prensado, salinidad y semanas de maduración. Cada variable afecta el rendimiento final y el cumplimiento CAA. MiPyme registra cada parámetro por lote, calcula el rendimiento litros/kg automáticamente y mantiene la trazabilidad completa desde la leche recibida hasta el queso despachado.',
    pains: [
      'Los datos de cada lote se pierden entre papeles y planillas, sin historial comparativo',
      'No conocés el rendimiento real litros/kg por lote hasta que ya es tarde para corregir el proceso',
      'Una inspección SENASA genera horas de búsqueda de documentación dispersa en cuadernos y carpetas',
    ],
    gains: [
      'Conocer el rendimiento exacto de cada lote por producto para optimizar el proceso y reducir pérdidas',
      'Tener trazabilidad completa de cada queso para responder a cualquier auditoría o reclamo en segundos',
      'Identificar qué parámetros del proceso producen el mejor queso para poder replicarlo sistemáticamente',
    ],
    painRelievers: [
      'Cada lote registra temperatura de pasteurización, pH, tiempos y parámetros CAA validados en tiempo real',
      'Trazabilidad completa lista para auditoría: desde la recepción de leche hasta la maduración de cada queso',
      'Alertas cuando acidez, temperatura u otro parámetro sale del rango óptimo definido para cada tipo de queso',
    ],
    gainCreators: [
      'Rendimiento litros/kg visible por lote, por producto y por semana con comparativo histórico para optimizar la elaboración',
      'Dashboard de producción que muestra en un vistazo qué lotes están en cada etapa del proceso',
      'Análisis de qué variables de proceso correlacionan con mejor rendimiento para mejorar la receta del maestro quesero',
    ],
    metrics: [
      { label: 'Rendimiento', value: '11.4%', sub: '+0.8% vs mes anterior' },
      { label: 'Lotes activos', value: '8', sub: '3 en maduración' },
      { label: 'Stock cuajo', value: '2.1 L', sub: 'Stock bajo — reponer', alert: true },
    ],
    stages: ['Recepción', 'Pasteurización', 'Elaboración', 'Prensado', 'Salmuera', 'Maduración'],
  },

  Ganadería: {
    regulator: 'SENASA',
    tagline: 'Controlá tu rodeo como los grandes, sin los costos de los grandes.',
    description: 'Llevar el control de un rodeo con planillas de Excel o cuadernos no escala. La ganancia diaria de peso, el plan sanitario y la trazabilidad animal son datos que hoy se pierden o se calculan tarde. MiPyme los centraliza por categoría y por potrero para que puedas tomar decisiones de venta y manejo con datos reales.',
    pains: [
      'No tenés registro claro de GDP por lote ni potrero, entonces no sabés cuándo están listos para vender',
      'La trazabilidad animal genera papeles duplicados que nadie ordena ni actualiza',
      'Tomás decisiones de venta sin datos reales de peso ni sanidad, dejando plata sobre la mesa',
    ],
    gains: [
      'Saber exactamente el peso promedio de cada lote y cuándo alcanza el peso objetivo de venta',
      'Tener el plan sanitario SENASA al día sin depender de recordatorios informales',
      'Demostrar el historial sanitario y productivo de la hacienda para negociar mejor precio',
    ],
    painRelievers: [
      'Seguimiento de GDP y peso promedio por categoría y potrero, con alerta cuando alcanza el peso objetivo',
      'Registro sanitario integrado: vacunaciones, tratamientos, caravanas y movimientos en un solo lugar',
      'Documentación SENASA (DTA, certificados sanitarios) organizada y lista para presentar sin burocracia',
    ],
    gainCreators: [
      'Historial de performance por potrero para identificar qué pasturas o manejos generan mejores resultados productivos',
      'Comparativo de GDP entre lotes y entre categorías para optimizar la estrategia de engorde temporada a temporada',
      'Reporte de rentabilidad por lote que muestra el costo de producción vs el precio de venta en tiempo real',
    ],
    metrics: [
      { label: 'GDP promedio', value: '0.92 kg/d', sub: 'Lote Engorde Norte' },
      { label: 'Cabezas activas', value: '340', sub: '12 potreros' },
      { label: 'Peso promedio', value: '387 kg', sub: '▲ 18 kg este mes' },
    ],
    stages: ['Recría', 'Engorde', 'Terminación', 'Venta'],
  },

  Frigorífico: {
    regulator: 'SENASA Res. 4238',
    tagline: 'De la tropa al despacho, con control sanitario total.',
    description: 'En un frigorífico el rendimiento de res, la temperatura de cámara y la trazabilidad de tropa son los tres datos críticos. Un desvío de temperatura no registrado puede generar una devolución millonaria. MiPyme registra cada variable por turno, valida contra SENASA Res. 4238 y permite reconstruir la cadena completa en segundos.',
    pains: [
      'El rendimiento de res varía entre tropas sin poder identificar si el problema es el proveedor, la faena o el operario',
      'La temperatura de cámara se controla manual sin registro histórico ni alertas automáticas de desvío',
      'Reconstruir la trazabilidad de una tropa a un corte final lleva horas ante cualquier no conformidad',
    ],
    gains: [
      'Conocer el rendimiento de res por proveedor y por turno para negociar mejor y optimizar la faena',
      'Tener registro continuo de temperatura de cámara para responder ante auditorías sin fricciones',
      'Poder rastrear cualquier corte hasta el campo de origen en segundos ante un reclamo de cliente',
    ],
    painRelievers: [
      'Rendimiento de res por tropa, por establecimiento de origen y por turno con historial comparativo automático',
      'Registro continuo de temperatura de cámara con alertas inmediatas de desvío por encima de los límites SENASA',
      'Trazabilidad completa: de qué campo provino cada media res y en qué camión fue despachada',
    ],
    gainCreators: [
      'Comparativo de rendimiento por proveedor para fundamentar negociaciones de precio de compra de tropa con datos',
      'Análisis de eficiencia por turno y operario para identificar qué prácticas maximizan el rendimiento de faena',
      'Dashboard en tiempo real de faena diaria que permite tomar decisiones operativas sin esperar informes manuales',
    ],
    metrics: [
      { label: 'Rendimiento res', value: '54.2%', sub: 'SENASA ref: 45–65% ✓' },
      { label: 'Temp. cámara', value: '2°C', sub: 'Dentro de norma ✓' },
      { label: 'Faena hoy', value: '128 cab.', sub: '3 establecimientos' },
    ],
    stages: ['Recepción tropa', 'Faena', 'Oreo', 'Desposte', 'Despacho'],
  },

  Bodega: {
    regulator: 'INV',
    tagline: 'Cada botella con la historia completa de su añada.',
    description: 'Una bodega gestiona simultáneamente cosecha, fermentación, clarificación, guarda y despacho de múltiples varietales. El INV exige registros precisos de SO₂, densidad y movimientos de vino. MiPyme organiza toda esa información por cuba y por añada, valida los parámetros INV automáticamente y genera los reportes regulatorios con un clic.',
    pains: [
      'Los parámetros de fermentación se anotan en cuadernos separados por finca o encargado, sin historial consolidado',
      'El stock de vino en guarda no está actualizado en tiempo real, generando errores en remitos y pedidos',
      'El INV pide datos que tardás horas en consolidar antes de cada inspección o presentación',
    ],
    gains: [
      'Comparar cómo fermentó el mismo varietal en distintas añadas para mejorar el proceso año a año',
      'Tener el stock exacto de vino por varietal, etapa y destino disponible en el celular en cualquier momento',
      'Cumplir todas las exigencias del INV sin trabajo burocrático extra antes de cada auditoría',
    ],
    painRelievers: [
      'Seguimiento de densidad, temperatura y SO₂ libre por cuba con validación automática INV Res. C.35 (≤200 mg/L)',
      'Stock en tiempo real: litros por varietal, por etapa y por destino actualizado con cada movimiento',
      'Reportes INV exportables con un clic, sin consolidación manual antes de cada presentación',
    ],
    gainCreators: [
      'Comparativo de fermentaciones por añada y por cuba para identificar las condiciones que producen el mejor vino',
      'Trazabilidad de finca a botella que abre las puertas a mercados premium que exigen origen certificado',
      'Análisis de rendimiento por varietal y por año para optimizar la compra de uva y la gestión de guarda',
    ],
    metrics: [
      { label: 'Fermentando', value: '4 cubas', sub: 'Malbec 2026' },
      { label: 'SO₂ libre', value: '165 mg/L', sub: 'INV ≤200 ✓' },
      { label: 'En guarda', value: '48.000 L', sub: '6 varietales' },
    ],
    stages: ['Recepción uva', 'Fermentación', 'Clarificación', 'Guarda', 'Embotellado'],
  },

  Cervecería: {
    regulator: 'CAA + ANMAT',
    tagline: 'Más tiempo buscando el sabor perfecto, menos tiempo buscando datos.',
    description: 'En una cervecería artesanal el proceso es repetible solo si tenés los datos de cada cocción. OG, FG, temperatura de fermentación y lote de ingredientes determinan el resultado. MiPyme registra cada variable por fermentador, vincula el lote de malta y lúpulo a cada receta y calcula el costo por litro automáticamente.',
    pains: [
      'Densidades, temperaturas y tiempos de fermentación se anotan en pizarras o cuadernos que nadie pasa en limpio',
      'No sabés qué lote de malta o qué receta específica dio el mejor resultado para poder reproducirlo',
      'El costo real por litro producido es imposible de calcular entre insumos, mermas y tiempo de fermentador',
    ],
    gains: [
      'Poder reproducir exactamente el lote que salió perfecto, con la misma receta y los mismos insumos',
      'Conocer el costo real por litro de cada estilo para poner precios con margen calculado, no estimado',
      'Tener los registros CAA en orden para no frenar el crecimiento por problemas de habilitación',
    ],
    painRelievers: [
      'Registrás OG, FG, ABV e IBU por fermentador con historial completo de cada cocción y lote de ingredientes',
      'Trazabilidad de receta más lote de malta y lúpulo para poder reproducir exactamente los mejores resultados',
      'Registros de proceso digitales listos para cualquier inspección CAA Art. 1082 sin preparación extra',
    ],
    gainCreators: [
      'Costo por litro calculado automáticamente por lote, incluyendo insumos, merma y ocupación de fermentador',
      'Comparativo de fermentaciones por receta para identificar las variables que producen el mejor resultado sensorial',
      'Historial de producción que facilita la escala: si crecés, tenés los datos para repetir el proceso en mayor volumen',
    ],
    metrics: [
      { label: 'ABV promedio', value: '5.2%', sub: 'CAA ≤12% ✓' },
      { label: 'Fermentando', value: '3 lotes', sub: 'IPA · Stout · Lager' },
      { label: 'Stock malta', value: '280 kg', sub: '~5 cocciones' },
    ],
    stages: ['Maceración', 'Cocción', 'Fermentación', 'Maduración', 'Envasado'],
  },

  Apicultura: {
    regulator: 'SENASA + CAA',
    tagline: 'De la colmena al frasco, con calidad certificada.',
    description: 'La apicultura tiene parámetros de calidad estrictos: humedad de la miel no puede superar el 20% (CAA Art. 782). SENASA exige trazabilidad desde el apiario. MiPyme registra cada extracción con sus parámetros, valida contra el CAA en tiempo real y centraliza la documentación para que puedas crecer con la operación en regla.',
    pains: [
      'La humedad y Brix se miden en cada extracción pero no quedan registrados por cosecha ni apiario',
      'Ante una devolución no podés saber de qué colmena o apiario proviene la partida afectada',
      'Las habilitaciones SENASA vencen sin que nadie lo advierta a tiempo, poniendo en riesgo la operación',
    ],
    gains: [
      'Poder certificar la calidad de la miel con datos verificables para acceder a mercados premium y de exportación',
      'Tener trazabilidad de colmena a frasco para resolver cualquier reclamo en segundos y proteger la marca',
      'Mantener todas las habilitaciones SENASA al día sin depender de la memoria de nadie',
    ],
    painRelievers: [
      'Registro de humedad y Brix por extracción con validación automática CAA Art. 782 (humedad ≤20%)',
      'Trazabilidad completa desde la colmena y la flora melífera hasta el frasco final y el cliente',
      'Alertas automáticas de vencimiento de habilitaciones SENASA con anticipación configurable',
    ],
    gainCreators: [
      'Producción por colmena y por apiario visible en tiempo real para tomar decisiones de manejo durante la temporada',
      'Historial de calidad por cosecha y apiario que sustenta la diferenciación premium y los precios más altos',
      'Documentación de trazabilidad lista para cumplir los requisitos de supermercados y mercados de exportación',
    ],
    metrics: [
      { label: 'Kg cosecha', value: '1.840 kg', sub: 'Temporada actual' },
      { label: 'Humedad miel', value: '18.2%', sub: 'CAA ≤20% ✓' },
      { label: 'Colmenas activas', value: '320', sub: '8 apiarios' },
    ],
    stages: ['Cosecha', 'Extracción', 'Decantación', 'Fraccionamiento'],
  },

  Olivicultura: {
    regulator: 'CAA + SENASA',
    tagline: 'Extra virgen de verdad: datos que lo demuestran.',
    description: 'Certificar un aceite como "extra virgen" exige demostrar acidez ≤0.8%, extracción en frío (≤27°C) y origen trazable. Sin registros continuos de temperatura de molino y acidez por partida, esa certificación no se sostiene ante una auditoría. MiPyme registra cada variable en tiempo real y vincula cada bidón al origen exacto.',
    pains: [
      'La acidez se mide pero no queda vinculada al lote de aceituna ni a la finca de origen',
      'No podés certificar extracción en frío sin registros continuos de temperatura de molino durante el proceso',
      'La trazabilidad desde la finca hasta el frasco envasado es manual e imposible de auditar para exportación',
    ],
    gains: [
      'Certificar extra virgen con datos verificables para acceder a los mercados premium que mejor precio pagan',
      'Demostrar extracción en frío y origen trazable para cumplir los requisitos de exportación a Europa y EE.UU.',
      'Entender qué variedad y qué finca produce el mejor aceite para optimizar la compra de aceituna',
    ],
    painRelievers: [
      'Registro de acidez, índice de peróxidos y temperatura de molino vinculado a la finca y variedad de origen',
      'Certificación automática de extracción en frío según CAA Art. 519 (temperatura del proceso ≤27°C)',
      'Trazabilidad completa desde la variedad de aceituna hasta el lote envasado, lista para exportación',
    ],
    gainCreators: [
      'Comparativo de rendimiento graso por variedad y por año para optimizar el momento de cosecha y maximizar el litrado',
      'Documentación de calidad por partida que sustenta la diferenciación premium y abre puertas a mercados internacionales',
      'Análisis de qué finca produce la mejor materia prima para fundamentar las decisiones de compra con datos objetivos',
    ],
    metrics: [
      { label: 'Acidez', value: '0.31%', sub: 'CAA ≤0.8% extra virgen ✓' },
      { label: 'Rendimiento', value: '19.4%', sub: 'Vs 18% año anterior' },
      { label: 'Litros envasados', value: '8.200 L', sub: 'Campaña 2026' },
    ],
    stages: ['Recepción aceituna', 'Molido', 'Centrifugado', 'Filtrado', 'Envasado'],
  },

  Chacinados: {
    regulator: 'SENASA + CAA + Municipio',
    tagline: 'De la media res al mostrador, todo trazado.',
    description: 'Una carnicería con chacinados tiene dos flujos críticos: el desposte (trazabilidad del DT SENASA al corte final con % de merma) y la elaboración de embutidos (CAA Art. 302 — temperatura interna ≥72°C, nitritos ≤150 ppm). Más la cámara frigorífica monitoreada 0–4°C y la vitrina de exhibición ≤7°C. MiPyme registra todo, valida en tiempo real y te deja listo para cualquier inspección municipal o SENASA.',
    pains: [
      'El desposte queda sin registro: no sabés cuánto entró, cuánto salió por corte ni cuál fue la merma real del día',
      'La temperatura de cámara se controla manualmente; si hay un desvío nocturno, te enterás cuando el producto ya está comprometido',
      'Las temperaturas de cocción interna de los embutidos no quedan documentadas por lote con fecha y responsable',
    ],
    gains: [
      'Saber exactamente cuántos kg de cada corte entraron a la cámara y cuántos salieron por venta en el día',
      'Pasar cualquier inspección SENASA o municipal con historial digital de temperatura de cámara y proceso de elaboración',
      'Conocer el % de merma real de cada desposte para negociar mejor con el frigorífico y fijar precios con datos',
    ],
    painRelievers: [
      'Registro de desposte por media res: cortes obtenidos, kg de merma y % de rendimiento automático',
      'Control de temperatura de cámara (0–4°C) y vitrina (≤7°C) con compliance CAA Art. 271 y estado visible en el dashboard',
      'Temperatura interna de cocción por lote con validación automática CAA Art. 302 (≥72°C) y alerta de incumplimiento',
    ],
    gainCreators: [
      'Historial de merma por proveedor y categoría de animal para identificar de dónde viene la mejor carne y negociar con datos',
      'Desglose de ventas por canal (mostrador, mayoristas, gastronomía) para entender dónde está el margen real',
      'Toda la documentación de trazabilidad (DT SENASA, habilitación frigorífico, lotes) disponible en segundos ante una auditoría',
    ],
    metrics: [
      { label: 'Merma desposte', value: '22%', sub: 'Referencia normal ✓' },
      { label: 'Temp. cámara', value: '2.8°C', sub: 'CAA ≤4°C ✓' },
      { label: 'Temp. cocción', value: '74°C', sub: 'CAA ≥72°C ✓' },
    ],
    stages: ['Recepción hacienda', 'Desposte', 'Cámara frigorífica', 'Venta / Despacho', 'Formulación', 'Envasado'],
  },

  Cerealera: {
    regulator: 'SENASA + ONCCA',
    tagline: 'Cada silo bajo control, cada despacho documentado.',
    description: 'Una cerealera maneja múltiples silos, múltiples productores y múltiples especies con calidades diferentes. Humedad, proteína y peso hectolítrico determinan el precio. Sin registros claros por camión y por silo es imposible negociar mejor ni responder ante reclamos de compradores.',
    pains: [
      'La humedad y proteína de cada camión se registran en papel sin vincularlo al silo específico de descarga',
      'No tenés historial de calidad por productor para negociar precio en función de su performance histórica',
      'El stock total por especie y silo nunca está actualizado en tiempo real, generando incertidumbre operativa',
    ],
    gains: [
      'Negociar el precio de compra de granos con datos históricos de calidad por productor en la mano',
      'Tener el stock exacto por silo y por especie disponible en tiempo real para no perder oportunidades comerciales',
      'Despachar con documentación SENASA y ONCCA en orden para no frenar operaciones por papeles',
    ],
    painRelievers: [
      'Registro de humedad, proteína y peso hectolítrico por camión, por productor y por silo al momento de descarga',
      'Control de stock en tiempo real por silo y por especie, actualizado con cada movimiento de entrada y salida',
      'Remitos digitales de despacho que eliminan la transcripción manual y los errores asociados',
    ],
    gainCreators: [
      'Historial de calidad por productor exportable para fundamentar negociaciones de precio con datos objetivos y concretos',
      'Comparativo de calidad entre campañas y entre variedades para optimizar las decisiones de compra y almacenamiento',
      'Dashboard de operaciones que muestra en tiempo real el estado de todos los silos sin necesitar recorrerlos físicamente',
    ],
    metrics: [
      { label: 'Stock total', value: '4.800 tn', sub: '12 silos activos' },
      { label: 'Humedad prom.', value: '13.1%', sub: 'SENASA ≤14.5% ✓' },
      { label: 'Despachado hoy', value: '320 tn', sub: '4 camiones' },
    ],
    stages: ['Recepción', 'Secado', 'Almacenado', 'Despacho'],
  },

  Campo: {
    regulator: 'SENASA',
    tagline: 'Cada lote de campo gestionado como una empresa.',
    description: 'Un productor agropecuario toma decisiones de millones de pesos por campaña muchas veces sin datos históricos claros. Rinde por hectárea, costo de insumos por lote y comparativo entre variedades son datos que existen pero están dispersos. MiPyme los centraliza por potrero y por campaña para que el análisis de rentabilidad sea simple y accesible.',
    pains: [
      'Los rindes por hectárea quedan en el cuaderno del cosechador y nunca se analizan históricamente por lote',
      'Los costos de insumos por campaña son imposibles de calcular correctamente por potrero sin horas de planillas',
      'No podés comparar el rendimiento entre lotes ni entre campañas para optimizar la rotación y la inversión',
    ],
    gains: [
      'Conocer la rentabilidad real por potrero al cierre de cada campaña sin armar planillas manualmente',
      'Comparar rendimiento entre variedades y entre años para tomar mejores decisiones agronómicas',
      'Tener toda la documentación SENASA de aplicaciones y labores al día sin esfuerzo adicional',
    ],
    painRelievers: [
      'Registro de rinde, humedad y costos por hectárea, por potrero y por campaña con análisis de rentabilidad automático',
      'Seguimiento de labores culturales con historial por potrero disponible para SENASA en cualquier momento',
      'Resumen de campaña listo al cierre con rentabilidad por potrero, sin necesidad de armar planillas desde cero',
    ],
    gainCreators: [
      'Comparativo de rendimiento por variedad, por año y por lote para fundamentar las decisiones de siembra próxima temporada',
      'Análisis de correlación entre inversión en insumos y rinde por potrero para optimizar el presupuesto de campaña',
      'Histórico de performance que aumenta el valor de la empresa ante bancos, inversores o compradores potenciales',
    ],
    metrics: [
      { label: 'Rinde promedio', value: '42.3 qq/ha', sub: 'Campaña 2025/26' },
      { label: 'Ha sembradas', value: '1.200 ha', sub: '8 lotes' },
      { label: 'Costo por ha', value: '$280.000', sub: 'ARS — proyectado' },
    ],
    stages: ['Siembra', 'Labores culturales', 'Cosecha', 'Comercialización'],
  },

  Avicultura: {
    regulator: 'SENASA',
    tagline: 'Cada galpón bajo control, desde el día 1 hasta la faena.',
    description: 'Un lote de pollos dura entre 38 y 45 días. En ese tiempo la mortalidad, la conversión alimenticia y el peso promedio determinan si el lote es rentable. Un desvío de FCR de 0.2 puntos puede representar miles de pesos en alimento desperdiciado. MiPyme registra estos indicadores diariamente y genera alertas tempranas para corregir a tiempo.',
    pains: [
      'La mortalidad diaria se registra en papel sin alertas automáticas cuando supera el umbral crítico',
      'La conversión alimenticia (FCR) se calcula al final del lote cuando ya no podés intervenir para mejorarla',
      'El plan sanitario se maneja con recordatorios informales que a veces se olvidan o se aplican tarde',
    ],
    gains: [
      'Detectar a tiempo cualquier desvío de mortalidad o FCR para intervenir y salvar la rentabilidad del lote',
      'Tener el plan sanitario SENASA automatizado para que ninguna vacuna se olvide ni se aplique tarde',
      'Comparar el performance entre galpones para identificar qué prácticas generan los mejores resultados',
    ],
    painRelievers: [
      'Mortalidad, peso y consumo registrados por galpón diariamente con alerta automática si supera el 5% (SENASA)',
      'FCR calculado en tiempo real para ajustar la alimentación y reducir el desperdicio antes del cierre del lote',
      'Calendario sanitario con recordatorios automáticos por vacuna y por lote de aves',
    ],
    gainCreators: [
      'Comparativo de performance entre galpones y entre lotes para identificar y replicar las mejores prácticas operativas',
      'Análisis de correlación entre condiciones de galpón y FCR para optimizar la ventilación, temperatura y densidad',
      'Reportes de cierre de lote automáticos con rentabilidad, FCR y mortalidad para presentar a la integradora o el banco',
    ],
    metrics: [
      { label: 'Mortalidad', value: '2.8%', sub: 'Referencia ≤5% ✓' },
      { label: 'Conversión FCR', value: '1.81', sub: 'Referencia 1.5–2.2 ✓' },
      { label: 'Peso promedio', value: '2.34 kg', sub: 'Día 38' },
    ],
    stages: ['Recría', 'Engorde', 'Control sanitario', 'Faena', 'Procesado'],
  },

  Yerbatera: {
    regulator: 'INYM',
    tagline: 'Del sapecado al paquete, con cada dato que el INYM necesita.',
    description: 'La yerba mate tiene una regulación específica del INYM: estacionamiento mínimo de 9 meses, humedad final ≤10% y documentación de cada movimiento. Los cupos y declaraciones son obligatorios. MiPyme gestiona automáticamente el cumplimiento del estacionamiento y genera los reportes INYM sin trabajo extra.',
    pains: [
      'El tiempo de estacionamiento de cada lote no se controla con fecha exacta, lo que puede generar incumplimientos INYM',
      'La humedad final varía entre lotes sin quedar documentado con parámetros comparables entre secaderos',
      'Los cupos y declaraciones INYM se gestionan con planillas Excel siempre desactualizadas o incompletas',
    ],
    gains: [
      'Garantizar que ningún lote sale antes del estacionamiento mínimo legal para no tener problemas con el INYM',
      'Tener los reportes de producción INYM siempre listos sin consolidar datos manualmente antes de cada presentación',
      'Calcular el rendimiento y las mermas por etapa para optimizar el proceso y reducir las pérdidas de peso',
    ],
    painRelievers: [
      'Control automático de estacionamiento mínimo por lote (9 meses — INYM Res. 1/2002) con alerta de habilitación para molienda',
      'Temperatura y humedad por etapa con validación automática de parámetros INYM',
      'Reportes de producción y movimientos listos para presentar al INYM sin consolidación manual',
    ],
    gainCreators: [
      'Cálculo de rendimiento y pérdidas de peso por etapa para identificar dónde están las mayores ineficiencias del proceso',
      'Comparativo de calidad entre secaderos y entre cosechas para tomar mejores decisiones de compra de hoja verde',
      'Documentación completa que facilita las certificaciones de calidad (orgánico, denominación de origen) para acceder a mercados premium',
    ],
    metrics: [
      { label: 'En estacionamiento', value: '180 tn', sub: '4 lotes activos' },
      { label: 'Humedad final', value: '8.9%', sub: 'INYM ≤10% ✓' },
      { label: 'Meses promedio', value: '11.2 m', sub: 'Mín. legal: 9 ✓' },
    ],
    stages: ['Sapecado', 'Secado', 'Canchado', 'Estacionamiento', 'Molienda'],
  },

  Fruticultura: {
    regulator: 'SENASA',
    tagline: 'De la chacra al contenedor, con trazabilidad de exportación.',
    description: 'Exportar fruta implica cumplir protocolos fitosanitarios SENASA, mantener la cadena de frío y demostrar el origen de cada caja. Un error de temperatura o la falta de un certificado puede detener un despacho completo. MiPyme registra la cadena de frío, el proceso de empaque y la trazabilidad de chacra a contenedor para que la exportación fluya sin fricciones.',
    pains: [
      'El calibre y categoría por lote no quedan registrados con fecha para comparar entre partidas y detectar variaciones',
      'La temperatura de cámara se anota en papel sin historial continuo ni alertas automáticas de desvío',
      'Los certificados fitosanitarios SENASA se piden a último momento generando demoras costosas en el despacho',
    ],
    gains: [
      'Poder demostrar la cadena de frío ininterrumpida para cumplir los protocolos de mercados de exportación exigentes',
      'Tener la documentación fitosanitaria SENASA siempre lista para no frenar despachos por papeles de último momento',
      'Rastrear qué caja provino de qué chacra para resolver reclamos de calidad del importador en minutos',
    ],
    painRelievers: [
      'Registro de calibre, Brix y categoría por partida de cosecha con fecha y chacra de origen para trazabilidad de exportación',
      'Histórico continuo de temperatura de cámara con alertas automáticas de desvíos que comprometan la calidad',
      'Documentación fitosanitaria SENASA organizada y accesible en segundos para no frenar despachos',
    ],
    gainCreators: [
      'Trazabilidad de chacra a contenedor que cumple los protocolos de los mercados de exportación sin trabajo burocrático extra',
      'Comparativo de calidad y mermas por variedad y por temporada para optimizar el proceso de selección y empaque',
      'Análisis de rendimiento por chacra para fundamentar las decisiones de compra de materia prima con datos objetivos',
    ],
    metrics: [
      { label: 'Cajas embaladas', value: '4.200', sub: 'Esta semana' },
      { label: 'Temp. cámara', value: '1°C', sub: 'SENASA ✓' },
      { label: 'Merma selección', value: '8.3%', sub: 'Ref. ≤15% ✓' },
    ],
    stages: ['Cosecha', 'Selección', 'Empaque', 'Cámara frío', 'Despacho'],
  },

  Hidroponía: {
    regulator: 'SENASA',
    tagline: 'Cada variable del agua bajo control, ciclo a ciclo.',
    description: 'En hidroponía el agua es el factor de producción más crítico. pH fuera de rango bloquea la absorción de nutrientes. CE demasiado alta quema las raíces. Estas variables se miden varias veces al día pero raramente se registran sistemáticamente. MiPyme las centraliza por turno y sistema para que puedas optimizar ciclo a ciclo con datos reales.',
    pains: [
      'pH y CE se miden varias veces al día pero los datos se anotan en papel o no se registran, perdiendo el historial',
      'No podés comparar el rendimiento entre ciclos ni detectar qué variable de nutrición o temperatura lo afectó',
      'El costo real por kg producido es manual, tardío y generalmente incompleto en insumos y energía',
    ],
    gains: [
      'Detectar a tiempo cualquier desvío de pH o CE para corregirlo antes de que afecte el cultivo y la cosecha',
      'Entender qué condiciones de ciclo producen el mejor rendimiento para replicarlas sistemáticamente',
      'Calcular el costo real por kg con todos los insumos incluidos para poner precios con margen correcto',
    ],
    painRelievers: [
      'Registro de pH, CE y temperatura de solución por turno y por sistema con historial completo y alertas de desvío',
      'Comparativo de rendimiento por ciclo, por especie y por época del año para identificar las condiciones óptimas',
      'Costo por kg calculado automáticamente incluyendo solución nutritiva, semillas, energía y mano de obra',
    ],
    gainCreators: [
      'Alertas en tiempo real cuando un parámetro sale del rango para intervenir antes de que afecte el cultivo durante la noche',
      'Análisis de correlación entre condiciones de solución y rendimiento para optimizar las fórmulas nutritivas ciclo a ciclo',
      'Documentación de producción lista para certificaciones orgánicas o premium que justifican precios diferenciados',
    ],
    metrics: [
      { label: 'pH solución', value: '6.1', sub: 'Rango 5.5–6.5 ✓' },
      { label: 'CE', value: '2.3 mS/cm', sub: 'Rango 1.5–3.5 ✓' },
      { label: 'Kg cosechados', value: '840 kg', sub: 'Ciclo actual' },
    ],
    stages: ['Siembra', 'Trasplante', 'Crecimiento', 'Cosecha'],
  },

  Alimentos: {
    regulator: 'ANMAT + SENASA',
    tagline: 'Producción de alimentos con trazabilidad desde el primer ingrediente.',
    description: 'La manufactura de alimentos exige trazabilidad bidireccional: qué materias primas entraron en cada lote y qué lotes contienen un insumo específico. ANMAT y SENASA lo exigen. Sin un sistema digital esto es prácticamente imposible. MiPyme lo resuelve vinculando automáticamente insumos a lotes en cada registro de producción.',
    pains: [
      'Los lotes de producción no están vinculados a los lotes de materia prima, haciendo imposible un retiro selectivo de producto',
      'La temperatura de proceso no queda registrada por lote con la referencia normativa, lo que expone ante ANMAT',
      'Una no conformidad es difícil de investigar porque no hay registros claros de qué, cuándo y quién produjo cada lote',
    ],
    gains: [
      'Poder hacer un retiro selectivo de producto en minutos, afectando solo el lote con problema y no toda la producción',
      'Pasar cualquier inspección ANMAT con documentación de proceso y temperatura disponible en segundos por lote',
      'Reducir la merma identificando en qué turno o proceso se producen las mayores pérdidas de rendimiento',
    ],
    painRelievers: [
      'Trazabilidad completa: qué lote de materia prima entró en cada lote de producto terminado, en ambas direcciones',
      'Temperatura de proceso registrada por lote con validación automática contra el rango normativo CAA/ANMAT',
      'Registro de no conformidades vinculado al lote afectado para investigación y mejora continua documentada',
    ],
    gainCreators: [
      'Análisis de rendimiento y mermas por turno y por producto en tiempo real para detectar desvíos antes del cierre del mes',
      'Comparativo de performance entre turnos y operarios para identificar y replicar las mejores prácticas de producción',
      'Documentación de trazabilidad que cumple los requisitos de grandes cadenas y supermercados que la exigen como condición',
    ],
    metrics: [
      { label: 'Lotes del mes', value: '38', sub: '2 no conformes', alert: true },
      { label: 'Temp. proceso', value: '75°C', sub: 'CAA ≥60°C ✓' },
      { label: 'Merma prom.', value: '7.2%', sub: 'Ref. ≤20% ✓' },
    ],
    stages: ['Preparación', 'Producción', 'Control calidad', 'Envasado'],
  },

  Panadería: {
    regulator: 'CAA + ANMAT',
    tagline: 'El mismo sabor de siempre, ahora con los registros en orden.',
    description: 'Una panadería produce dos o tres veces por día con variaciones de temperatura, tiempos de fermentación y cantidades de insumos. CAA Art. 726 regula temperatura interna de cocción. Sin registros por turno es imposible calcular el costo real del pan ni responder ante una inspección ANMAT.',
    pains: [
      'No sabés cuánta harina, levadura o manteca consumiste realmente en cada turno hasta que ya falta stock',
      'La merma por lote nunca se registra, haciendo imposible calcular el costo real y el margen por producto',
      'Una inspección ANMAT siempre encuentra los registros de temperatura y proceso desorganizados o inexistentes',
    ],
    gains: [
      'Conocer el costo real por kg de cada producto para poner precios con margen calculado, no estimado',
      'Tener los registros de temperatura de horno y proceso listos para cualquier inspección CAA sin preparación previa',
      'Identificar en qué turno y con qué parámetros se produce el mejor rendimiento para estandarizar el proceso',
    ],
    painRelievers: [
      'Consumo de harina, levadura y manteca registrado por lote y por turno con rendimiento automático (kg entrada vs kg salida)',
      'Historial de temperaturas de horneado por lote listo para cualquier inspección CAA Art. 726, sin preparación previa',
      'Merma visible por proceso y por turno para calcular el costo real de cada producto',
    ],
    gainCreators: [
      'Costo real por kg de cada producto calculado automáticamente incluyendo todos los insumos y la merma real del proceso',
      'Comparativo de rendimiento por turno y por encargado para identificar y replicar las mejores prácticas operativas',
      'Alertas de stock que avisan cuando la harina u otro insumo crítico está a punto de agotarse, antes de que sea urgente',
    ],
    metrics: [
      { label: 'Kg producidos hoy', value: '380 kg', sub: 'Pan + facturas' },
      { label: 'Merma', value: '9.4%', sub: 'Ref. ≤15% ✓' },
      { label: 'Stock harina 000', value: '180 kg', sub: '~2 días', alert: true },
    ],
    stages: ['Pesado', 'Amasado', 'Fermentación', 'Horneado', 'Enfriado', 'Envasado'],
  },

  Acuicultura: {
    regulator: 'SENASA',
    tagline: 'Cada jaula monitoreada, cada pez trazado hasta el comprador.',
    description: 'En acuicultura las variables del agua determinan la sobrevivencia y el crecimiento. Oxígeno disuelto por debajo de 6 mg/L puede matar un lote completo en horas. MiPyme registra estas variables por jaula, genera alertas tempranas y calcula el FCR en tiempo real para que puedas optimizar la alimentación durante el ciclo.',
    pains: [
      'Oxígeno disuelto y temperatura del agua se miden pero no se registran sistemáticamente, impidiendo detectar tendencias de deterioro',
      'El FCR solo se calcula al cierre del ciclo, cuando ya no podés ajustar la alimentación para mejorar la rentabilidad',
      'SENASA pide registros del ciclo completo para la habilitación y siempre hay datos de parámetros que faltan',
    ],
    gains: [
      'Detectar a tiempo cualquier deterioro de las condiciones del agua para intervenir antes de que afecte la sobrevivencia',
      'Optimizar la ración de alimento durante el ciclo en base al FCR real para reducir el costo de producción por kg',
      'Tener el historial completo del ciclo listo para SENASA y para demostrar origen a compradores de exportación',
    ],
    painRelievers: [
      'Registro de O₂, pH y temperatura por jaula con alertas inmediatas si bajan de los umbrales críticos SENASA',
      'FCR calculado en tiempo real para ajustar la ración y reducir el costo de alimento por kg producido',
      'Historial completo del ciclo por jaula para certificación SENASA y para compradores de exportación',
    ],
    gainCreators: [
      'Comparativo de performance entre jaulas y entre ciclos para identificar las condiciones que maximizan el crecimiento',
      'Análisis de correlación entre parámetros del agua y FCR para optimizar el manejo nutricional del ciclo siguiente',
      'Documentación de trazabilidad que cumple los requisitos de exportación a mercados que exigen origen certificado',
    ],
    metrics: [
      { label: 'Oxígeno disuelto', value: '8.2 mg/L', sub: 'SENASA ≥6 ✓' },
      { label: 'FCR actual', value: '1.42', sub: 'Ref. 1.0–2.0 ✓' },
      { label: 'Mortalidad', value: '1.8%', sub: 'Ref. ≤5% ✓' },
    ],
    stages: ['Siembra', 'Crecimiento', 'Control sanitario', 'Cosecha', 'Procesado'],
  },

  Cosmética: {
    regulator: 'ANMAT',
    tagline: 'Cada crema con el lote, la fórmula y la liberación en regla.',
    description: 'Fabricar cosméticos en Argentina exige cumplir ANMAT Disp. 4622/12: control de pH, ensayos microbiológicos y liberación formal antes de despachar. Sin un sistema que registre y organice esos controles por lote, la liberación se convierte en un cuello de botella manual que retrasa el despacho.',
    pains: [
      'El control de pH y microbiología se realiza pero los resultados no quedan vinculados al lote con fecha y responsable',
      'La liberación de lotes ANMAT es un proceso manual que retrasa el despacho por documentación siempre incompleta',
      'Rastrear el lote de materia prima ante una devolución puede llevar horas o días por falta de trazabilidad',
    ],
    gains: [
      'Liberar lotes más rápido con un proceso digital que no dependa de encontrar carpetas físicas con cada documento',
      'Poder rastrear cualquier materia prima a producto terminado en segundos para resolver reclamos sin fricción',
      'Tener toda la documentación ANMAT organizada para que el director técnico pueda liberar desde cualquier lugar',
    ],
    painRelievers: [
      'pH y resultado microbiológico vinculados al lote con fecha, analista y referencia ANMAT Disp. 4622/12',
      'Workflow de liberación digital con registro del director técnico que agiliza el proceso y elimina documentación en papel',
      'Trazabilidad de materia prima a producto terminado en segundos para resolver reclamos o devoluciones sin demoras',
    ],
    gainCreators: [
      'Fórmula con número de versión vinculada a cada lote para cumplir los requisitos de trazabilidad ANMAT y demostrar consistencia',
      'Comparativo de parámetros de calidad entre lotes para detectar tendencias de desvío antes de que generen un problema',
      'Documentación de liberación digital que facilita la auditoría ANMAT y las inspecciones sin preparación previa',
    ],
    metrics: [
      { label: 'pH promedio', value: '6.3', sub: 'ANMAT 4.5–8.5 ✓' },
      { label: 'Lotes liberados', value: '14', sub: 'Este mes' },
      { label: 'Unidades envasadas', value: '8.400', sub: '3 SKUs activos' },
    ],
    stages: ['Formulación', 'Mezclado', 'Control de calidad', 'Envasado', 'Liberación'],
  },

  Pesca: {
    regulator: 'SENASA + SAGyP',
    tagline: 'De la embarcación al contenedor, con trazabilidad de exportación.',
    description: 'El procesamiento pesquero está bajo control estricto de SENASA y SAGyP. La cadena de frío es crítica y la temperatura de recepción no puede superar los 4°C. Para exportar, cada contenedor debe demostrar trazabilidad hasta la embarcación de origen. MiPyme registra todo esto automáticamente sin agregar burocracia al piso de planta.',
    pains: [
      'La temperatura de recepción no se registra sistemáticamente por especie ni por barco, exponiendo ante auditorías SENASA',
      'El rendimiento de fileteado varía entre turnos y operarios pero no hay datos para identificar la causa y corregirla',
      'Los certificados SENASA para exportación siempre se solicitan con urgencia porque la documentación no está organizada',
    ],
    gains: [
      'Poder demostrar la cadena de frío completa a cualquier importador o auditor sin búsquedas en papel',
      'Identificar qué turno u operario tiene mejor rendimiento de proceso para estandarizar y mejorar la eficiencia',
      'Tener la documentación SENASA y SAGyP siempre lista para no frenar despachos de exportación por papeles',
    ],
    painRelievers: [
      'Temperatura de recepción por especie y embarcación con validación automática SENASA (≤4°C) y alerta de incumplimiento',
      'Rendimiento de proceso por especie, turno y operario para detectar desvíos y mejorar la eficiencia productiva',
      'Documentación SENASA y SAGyP organizada en segundos para despachos sin demoras de último momento',
    ],
    gainCreators: [
      'Trazabilidad completa de barco a contenedor que cumple los protocolos de mercados internacionales sin trabajo burocrático extra',
      'Comparativo de rendimiento por especie y por temporada para optimizar la planificación de la temporada de pesca',
      'Historial de calidad por embarcación que permite negociar mejor precio de compra de materia prima con datos objetivos',
    ],
    metrics: [
      { label: 'Temp. recepción', value: '2°C', sub: 'SENASA ≤4°C ✓' },
      { label: 'Rendimiento', value: '61.4%', sub: 'Langostino pelado' },
      { label: 'Temp. congelado', value: '-22°C', sub: 'SENASA ≤-18°C ✓' },
    ],
    stages: ['Recepción', 'Clasificación', 'Procesado', 'Congelado', 'Envasado', 'Despacho'],
  },
}

export function IndustryDemoSection() {
  const [selected, setSelected] = useState<string | null>(null)
  const keys = Object.keys(DEMOS)
  const demo = selected ? (DEMOS[selected] ?? null) : null
  const currentIdx = selected ? keys.indexOf(selected) : -1

  function prev() {
    if (currentIdx > 0) setSelected(keys[currentIdx - 1]!)
  }
  function next() {
    if (currentIdx < keys.length - 1) setSelected(keys[currentIdx + 1]!)
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {keys.map((ind) => (
          <button
            key={ind}
            onClick={() => setSelected(ind)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-950 hover:text-white hover:border-gray-950 transition-all cursor-pointer"
          >
            {ind}
          </button>
        ))}
      </div>

      {selected && demo && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-8 pb-6 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">{selected}</h2>
                  <span className="text-xs px-2.5 py-1 bg-gray-100 rounded-full text-gray-500 font-medium">
                    {demo.regulator}
                  </span>
                </div>
                <p className="text-gray-800 font-medium mb-3">{demo.tagline}</p>
                <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">{demo.description}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-700 transition-colors ml-4 mt-1 shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Value Proposition Canvas — 4 cuadrantes */}
            <div className="p-8 grid md:grid-cols-2 gap-6 border-b border-gray-100">

              {/* Pains */}
              <div className="bg-red-50 rounded-xl p-5">
                <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-3">Dolores actuales</p>
                <ul className="space-y-2.5">
                  {demo.pains.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-red-700">
                      <span className="w-4 h-4 rounded-full bg-red-100 text-red-400 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">✕</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gains */}
              <div className="bg-blue-50 rounded-xl p-5">
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">Lo que querés lograr</p>
                <ul className="space-y-2.5">
                  {demo.gains.map((g) => (
                    <li key={g} className="flex items-start gap-2.5 text-sm text-blue-700">
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">→</span>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pain Relievers */}
              <div className="bg-green-50 rounded-xl p-5">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-3">Cómo MiPyme alivia los dolores</p>
                <ul className="space-y-2.5">
                  {demo.painRelievers.map((r) => (
                    <li key={r} className="flex items-start gap-2.5 text-sm text-green-700">
                      <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">✓</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gain Creators */}
              <div className="bg-purple-50 rounded-xl p-5">
                <p className="text-xs font-semibold text-purple-500 uppercase tracking-widest mb-3">Cómo MiPyme crea los beneficios</p>
                <ul className="space-y-2.5">
                  {demo.gainCreators.map((c) => (
                    <li key={c} className="flex items-start gap-2.5 text-sm text-purple-700">
                      <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-500 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">↑</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Fake dashboard preview */}
            <div className="p-8 bg-[#F8F7F4]">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">Vista previa del dashboard</p>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {demo.metrics.map((m) => (
                  <div
                    key={m.label}
                    className={`bg-white rounded-xl p-4 border ${m.alert ? 'border-red-200' : 'border-gray-100'}`}
                  >
                    <p className="text-xs text-gray-400 mb-1">{m.label}</p>
                    <p className={`text-xl font-bold tracking-tight ${m.alert ? 'text-red-500' : 'text-gray-900'}`}>{m.value}</p>
                    <p className={`text-xs mt-0.5 ${m.alert ? 'text-red-400' : 'text-gray-400'}`}>{m.sub}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">Etapas del proceso</p>
                <div className="flex flex-wrap gap-2">
                  {demo.stages.map((stage, i) => (
                    <span
                      key={stage}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
                        i === 0
                          ? 'bg-gray-950 text-white'
                          : i === 1
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-white border border-gray-200 text-gray-400'
                      }`}
                    >
                      <span className="opacity-50">{i + 1}</span> {stage}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer CTA + navegación */}
            <div className="px-8 py-6 flex items-center justify-between border-t border-gray-100">
              <div className="flex items-center gap-3">
                <button
                  onClick={prev}
                  disabled={currentIdx === 0}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-gray-400">{currentIdx + 1} / {keys.length}</span>
                <button
                  onClick={next}
                  disabled={currentIdx === keys.length - 1}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <span className="text-xs text-gray-300 ml-1">— Sin tarjeta. 5 minutos.</span>
              </div>
              <Link
                href="/registro"
                onClick={() => setSelected(null)}
                className="flex items-center gap-2 bg-gray-950 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Empezar gratis <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
