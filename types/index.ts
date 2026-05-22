// ─── Tenant / Auth ───────────────────────────────────────────────
export type Industry =
  | 'tambo'
  | 'dairy'
  | 'ganaderia'
  | 'frigorifico'
  | 'bodega'
  | 'cerveceria'
  | 'apicultura'
  | 'olivicultura'
  | 'cerealera'
  | 'agro_campo'
  | 'avicultura'
  | 'chacinados'
  | 'yerbatera'
  | 'fruticultura'
  | 'hidroponia'
  | 'food_manufacturing'
  | 'panaderia'
  | 'acuicultura'
  | 'cosmetica'
  | 'pesca'
  | 'suplementos'
export type Plan = 'free' | 'starter' | 'pro' | 'enterprise'
export type UserRole = 'admin' | 'manager' | 'operator'

export interface Organization {
  id: string
  name: string
  slug: string
  industry: Industry
  plan: Plan
  industry_config: IndustryConfig
  onboarding_completed: boolean
  created_at: string
}

export interface Profile {
  id: string
  organization_id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
}

// Configuración custom por industria (guardada como JSONB en organizations)
export interface IndustryConfig {
  currency?: string
  units?: Record<string, string>
  custom_fields?: CustomField[]   // Campos de producción por industria
  features?: string[]
  input_label?: string            // Ej: "Litros de leche", "Kg de harina"
  output_label?: string           // Ej: "Kg producidos", "Unidades"
  product_types?: string[]        // Ej: ["Gouda", "Sardo"]
  stages?: string[]               // Etapas del proceso productivo
  language?: 'es_AR' | 'en'      // Idioma de la interfaz
}

export interface CustomField {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'select'
  unit?: string
  options?: string[]
  required?: boolean
  stage?: string          // Si está definido, solo se muestra cuando la etapa coincide
  min_value?: number      // Límite mínimo reglamentario
  max_value?: number      // Límite máximo reglamentario
  compliance_ref?: string // Referencia normativa (ej: "CAA Art. 560")
}

// ─── Producción ───────────────────────────────────────────────────
export interface ProductionBatch {
  id: string
  organization_id: string
  batch_code: string
  product_name: string
  product_type: string
  quantity_kg: number
  input_quantity: number
  yield_percentage: number
  start_date: string
  end_date: string | null
  status: 'in_progress' | 'completed' | 'cancelled'
  notes: string | null
  custom_data: Record<string, unknown> | null
  created_by: string
  created_at: string
}

// ─── Inventario ───────────────────────────────────────────────────
export type MovementType = 'entrada' | 'salida' | 'ajuste'

export interface InventoryItem {
  id: string
  organization_id: string
  name: string
  sku: string | null
  category: string
  unit: string
  current_stock: number
  min_stock: number
  max_stock: number | null
  supplier_id: string | null
  lot_number: string | null
  expiry_date: string | null
  received_date: string | null
  created_at: string
}

export interface InventoryMovement {
  id: string
  organization_id: string
  item_id: string
  movement_type: MovementType
  quantity: number
  reference: string | null
  notes: string | null
  created_by: string
  created_at: string
}

// ─── Proveedores ──────────────────────────────────────────────────
export interface Supplier {
  id: string
  organization_id: string
  name: string
  cuit: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  category: string | null
  notes: string | null
  active: boolean
  created_at: string
}

// ─── Trazabilidad ─────────────────────────────────────────────────
export interface ProductionBatchInput {
  id: string
  organization_id: string
  batch_id: string
  item_id: string
  quantity_used: number
  lot_number: string | null
  notes: string | null
  created_at: string
  // joins
  inventory_items?: InventoryItem
}

// ─── UI helpers ───────────────────────────────────────────────────
export interface NavItem {
  title: string
  href: string
  icon: string
}
