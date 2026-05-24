/**
 * Cliente para TusFacturasAPP API v2
 * Documentación: https://www.tusfacturas.app/api-factura-electronica-afip.html
 */

const BASE_URL = 'https://www.tusfacturas.app/app/api/v2'

export interface FiscalConfig {
  cuit: string
  razon_social: string
  punto_venta: number
  tipo_comprobante_default: 'A' | 'B' | 'C'
  condicion_iva: 'RI' | 'MT' | 'EX' | 'CF'
  tusfacturas_apikey: string
  tusfacturas_usertoken: string
  tusfacturas_apikey_empresas: string
}

export interface InvoiceItem {
  product_name: string
  quantity: number
  unit_price_con_iva: number  // precio con IVA incluido
  iva_alicuota?: 21 | 10.5 | 27 | 0  // default 21
  unit?: string
  sku?: string
}

export interface EmitInvoiceParams {
  fiscalConfig: FiscalConfig
  tipoComprobante?: 'A' | 'B' | 'C'
  clientCuit?: string | null
  clientRazonSocial: string
  items: InvoiceItem[]
  fecha?: string  // YYYYMMDD, default hoy
}

export interface TusFacturasResponse {
  cae: string
  cae_vencimiento: string
  comprobante_nro: string
  comprobante_tipo: string
  punto_venta: number
}

export interface TusFacturasError {
  error: 'S'
  errores: string[]
}

/** Convierte precio con IVA a precio sin IVA */
function sinIva(precioConIva: number, alicuota: number): number {
  return Math.round((precioConIva / (1 + alicuota / 100)) * 100) / 100
}

/** Formatea fecha a YYYYMMDD */
function fechaAfip(date?: string): string {
  const d = date ? new Date(date) : new Date()
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

export async function emitirFactura(
  params: EmitInvoiceParams
): Promise<TusFacturasResponse> {
  const { fiscalConfig, items, clientCuit, clientRazonSocial } = params
  const tipo = params.tipoComprobante ?? fiscalConfig.tipo_comprobante_default
  const fecha = fechaAfip(params.fecha)

  // Vencimiento: 30 días
  const venc = new Date()
  venc.setDate(venc.getDate() + 30)
  const vencimiento = fechaAfip(venc.toISOString().slice(0, 10))

  // Tipo de doc receptor
  const tipoDocReceptor = clientCuit ? 'CUIT' : 'DNI'
  const nroDocReceptor = clientCuit ?? '0'

  // Condición IVA receptor
  const condIvaReceptor = tipo === 'A' ? fiscalConfig.condicion_iva : 'CF'

  const detalle = items.map(item => {
    const alicuota = item.iva_alicuota ?? 21
    const precioSinIva = sinIva(item.unit_price_con_iva, alicuota)

    // Código de unidad medida AFIP: 7 = "unidades", 1 = "kg", 2 = "L"
    const unidadMedida = item.unit === 'kg' ? '1' : item.unit === 'L' ? '2' : '7'

    return {
      cantidad: item.quantity,
      afecta_stock: 'N',
      actualiza_precio: 'N',
      bonificacion_porcentaje: 0,
      producto: {
        descripcion: item.product_name,
        unidad_bulto: 1,
        lista_precios: 'Lista 1',
        codigo: item.sku ?? item.product_name.slice(0, 20).toUpperCase().replace(/\s/g, '-'),
        precio_unitario_sin_iva: precioSinIva,
        alicuota,
        unidad_medida: unidadMedida,
      },
      leyenda: '',
    }
  })

  const body = {
    usertoken:        fiscalConfig.tusfacturas_usertoken,
    apikey:           fiscalConfig.tusfacturas_apikey,
    apikey_empresas:  fiscalConfig.tusfacturas_apikey_empresas,
    requests: {
      tipo_doc:              `FACTURA ${tipo}`,
      operacion:             'C',
      punto_vta:             fiscalConfig.punto_venta,
      tipo_doc_receptor:     tipoDocReceptor,
      nro_doc_receptor:      nroDocReceptor,
      condicion_pago:        1,   // 1 = contado
      condicion_iva_receptor: condIvaReceptor,
      fecha,
      vencimiento,
      moneda: { id: 'PES', cotizacion: 1 },
      detalle,
      rg_especiales: [],
      datos_opcionales: [],
    },
  }

  const res = await fetch(`${BASE_URL}/facturacion/nuevo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`TusFacturasAPP HTTP ${res.status}`)
  }

  const json = await res.json() as { error: string; errores?: string[]; response?: TusFacturasResponse }

  if (json.error === 'S' || !json.response) {
    const msgs = (json.errores ?? []).join(' | ')
    throw new Error(msgs || 'Error desconocido de TusFacturasAPP')
  }

  return json.response
}
