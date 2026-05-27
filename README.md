# MiPyme — SaaS de gestión operativa con IA para PyMEs argentinas

Sistema B2B multi-tenant para gestión de producción, inventario, pedidos y facturación. Nació como BLQ Web (sistema interno de La Blanqueada, empresa láctea) y se está convirtiendo en plataforma multi-industria.

**URL producción:** https://mi-pyme-self.vercel.app
**Proyecto Vercel:** francoadminlbs-projects/mi-pyme

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| Base de datos | Supabase (PostgreSQL + RLS + Auth) |
| IA | Anthropic Claude claude-sonnet-4-20250514, streaming manual |
| Gráficos | Recharts |
| Notificaciones | Twilio WhatsApp |
| Facturación | TusFacturasAPP (AFIP/ARCA) |
| Deploy | Vercel (Hobby plan) |
| Node.js | v20 — v24 es incompatible con Next.js 14 |

---

## Arquitectura multi-tenant

Cada organización tiene sus datos aislados vía Supabase RLS.

```
organizations       → tenant maestro (industry, plan, industry_config, fiscal_config)
profiles            → usuarios vinculados a una org (role: admin | manager | operator)
[todas las tablas]  → organization_id + RLS policy con get_user_org_id()
```

Helper estándar de aislamiento:
```sql
CREATE POLICY "tenant_isolation" ON [tabla]
  USING (organization_id = get_user_org_id());
```

`get_user_org_id()` es una función SQL que devuelve el `organization_id` del usuario autenticado desde `profiles`.

La función `getAuthContext()` en `lib/supabase/helpers.ts` es el punto de entrada para toda página del dashboard. Devuelve `{ profile, organization }` con la `industry_config` mergeada con los defaults normativos de la industria.

---

## Industrias configuradas

El tipo `Industry` cubre 21 rubros:

`tambo`, `dairy`, `ganaderia`, `frigorifico`, `bodega`, `cerveceria`, `apicultura`, `olivicultura`, `cerealera`, `agro_campo`, `avicultura`, `chacinados`, `yerbatera`, `fruticultura`, `hidroponia`, `food_manufacturing`, `panaderia`, `acuicultura`, `cosmetica`, `pesca`, `suplementos`

Cada industria tiene en `lib/industries.ts`:
- `input_label` / `output_label` — etiquetas de materia prima y producto
- `product_types` — tipos de producto disponibles
- `stages` — etapas del proceso productivo
- `custom_fields` — campos personalizados con validación normativa (`min_value`, `max_value`, `compliance_ref`)
- `product_templates` — valores por defecto por tipo de producto

Los prompts de IA están en `lib/ai/prompts/[industry].ts`. Solo `dairy` y `food_manufacturing` tienen prompt propio; el resto usa el genérico.

---

## Módulos implementados

### Auth
- Login, registro, recuperar contraseña, nueva contraseña
- Al registrarse se crea automáticamente una `organization` y un `profile` (trigger en Supabase)
- `/onboarding` — wizard de configuración inicial (obligatorio antes de acceder al dashboard)

### Dashboard — Inicio (`/inicio`)
KPIs en tiempo real: lotes en proceso, órdenes pendientes, stock bajo mínimo, completados hoy, pedidos activos. Muestra guía de primeros pasos en cuentas nuevas.

### Producción (`/produccion`)
- Registro de lotes con `batch_code` autogenerado
- Campos custom por industria (configurables en `industry_config`)
- Insumos por lote: `production_batch_inputs` (trazabilidad materia prima → producto)
- Estados: `in_progress` → `completed` | `cancelled`
- Al completar un lote: descuenta automáticamente los insumos del inventario y registra entrada del producto terminado
- Soporte para flujo de porcionado (custom_data `tipo_presentacion = "Porcionado"`)
- Acciones: editar, duplicar, ver detalle, imprimir etiqueta, eliminar
- Templates de producto: valores por defecto de campos custom por tipo de producto
- Importación masiva desde CSV

### Inventario (`/inventario`)
- Ítems categorizados: `materia_prima`, `producto_terminado`, `material_empaque`, `insumo`
- Campos de trazabilidad: proveedor, lote del proveedor, fecha recepción, fecha vencimiento
- Movimientos: `entrada`, `salida`, `ajuste`
- Trigger en Supabase actualiza `current_stock` automáticamente al insertar en `inventory_movements`
- Alertas de vencimiento: ítems que vencen en 30 días
- Alertas de stock bajo mínimo
- Importación masiva desde CSV

### Reportes (`/reportes`)
- Gráficos Recharts: producción por período, rendimiento, stock por categoría
- Panel de alertas operativas activas

### Asistente IA (`/asistente`)
- Chat con streaming usando Anthropic SDK directamente (sin Vercel AI SDK)
- Contexto en tiempo real: últimos 10 lotes, órdenes pendientes, stock crítico, reglas de alerta
- System prompt por industria
- Modelo: `claude-sonnet-4-20250514`, max_tokens: 1000
- Límite: 40 mensajes por sesión, 4000 chars por mensaje

### Órdenes de compra (`/ordenes`)
- Creación manual o automática por stock bajo mínimo
- Estados: `pending` → `sent` → `received` | `cancelled`
- Al recibir: registra entrada en inventario automáticamente
- Impresión de orden

### Pedidos de clientes (`/pedidos`)
- Pipeline: `pending` → `confirmed` → `preparing` → `ready` → `delivered` | `cancelled`
- Ítems de pedido vinculados a `inventory_items` (para descuento de stock al entregar)
- Al entregar: registra salida de inventario automáticamente
- Datos de cliente: nombre, CUIT, email, teléfono, fecha de entrega

### Facturación AFIP (`/configuracion` → Fiscal)
- Integración con TusFacturasAPP
- Tabla `invoices` con CAE, vencimiento, tipo de comprobante (A/B/C)
- Credenciales TusFacturasAPP por tenant en `organizations.fiscal_config` (JSONB)
- `lib/integrations/tusfacturas.ts`

### Proveedores (`/proveedores`)
- CUIT, contacto, categoría, notas, estado activo/inactivo
- Importación masiva desde CSV
- Vinculados a ítems de inventario

### Configuración (`/configuracion`)
- Editar datos de la organización
- Selector de plan
- Configuración fiscal (TusFacturasAPP)
- `AreaSetupBanner`: banner contextual que aparece en cada módulo si el área no está configurada

### Alertas operativas
- Motor en `lib/alerts/engine.ts`
- Reglas configurables por tenant en tabla `alert_rules`
- Cron diario a las 8am (Vercel): `GET /api/alertas/notify`
- Notificaciones por WhatsApp vía Twilio si hay alertas críticas
- Requiere `CRON_SECRET` en env de Vercel para autenticar el cron

### Super Admin
- Campo `is_super_admin` en `profiles`
- Selector de organización activa en el sidebar
- `GET /api/admin/switch-org` — cambia la org activa del super admin
- Permite ver y operar cualquier tenant

---

## Schema de base de datos

```
organizations           id, name, slug, industry, plan, industry_config (JSONB),
                        fiscal_config (JSONB), onboarding_completed, notification_phone

profiles                id, organization_id, email, full_name, role,
                        is_super_admin, super_admin_active_org

production_batches      id, organization_id, batch_code, product_name, product_type,
                        quantity_kg, input_quantity, yield_percentage,
                        start_date, end_date, status, custom_data (JSONB)

production_batch_inputs id, organization_id, batch_id, item_id,
                        quantity_used, lot_number

inventory_items         id, organization_id, name, sku, category, unit,
                        current_stock, min_stock, max_stock,
                        supplier_id, lot_number, expiry_date, received_date

inventory_movements     id, organization_id, item_id, movement_type,
                        quantity, reference, notes
                        [TRIGGER: actualiza current_stock automáticamente]

suppliers               id, organization_id, name, cuit, contact_name,
                        contact_phone, contact_email, category, active

purchase_orders         id, organization_id, item_id, quantity_requested,
                        status, supplier_id

alert_rules             id, organization_id, name, metric, operator,
                        threshold, active

sales_orders            id, organization_id, order_number, client_name,
                        client_cuit, client_email, client_phone,
                        status, delivery_date, total_amount

sales_order_items       id, organization_id, order_id, product_name,
                        quantity, unit, unit_price, subtotal (GENERATED),
                        item_id (→ inventory_items, para descuento automático)

invoices                id, organization_id, sales_order_id,
                        tipo_comprobante, punto_venta, numero,
                        cuit_receptor, razon_social, total_amount,
                        cae, cae_vencimiento, status, raw_response (JSONB)
```

Migraciones en `supabase/migrations/` (001 a 018). No hay CLI configurado — aplicar manualmente vía SQL Editor del Dashboard de Supabase.

---

## API Routes

| Ruta | Descripción |
|---|---|
| `POST /api/chat` | IA streaming — recibe `{ messages }`, devuelve stream de texto |
| `GET /api/alertas/notify` | Cron alertas — evalúa todas las orgs y envía WhatsApp |
| `POST /api/auth/register` | Registro de nuevo usuario + org |
| `POST /api/facturas` | Emitir factura via TusFacturasAPP |
| `GET /api/inventory/check-reorder` | Detectar ítems bajo mínimo para reorder automático |
| `POST /api/inventory/import` | Importación masiva de inventario desde CSV |
| `POST /api/onboarding/complete` | Marcar onboarding como completado |
| `PATCH /api/organizations/config` | Guardar industry_config del tenant |
| `PATCH /api/organizations/fiscal-config` | Guardar fiscal_config (TusFacturasAPP) |
| `PATCH /api/organizations/plan` | Cambiar plan del tenant |
| `PATCH /api/organizations/update` | Actualizar datos de la organización |
| `POST /api/pedidos/deliver` | Marcar pedido como entregado + movimiento de inventario |
| `POST /api/production/import` | Importación masiva de lotes desde CSV |
| `POST /api/suppliers/import` | Importación masiva de proveedores desde CSV |
| `POST /api/admin/switch-org` | Super admin: cambiar org activa |

---

## Variables de entorno

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# IA
ANTHROPIC_API_KEY=

# Alertas (cron Vercel)
CRON_SECRET=

# Notificaciones WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=

# Facturación AFIP (credenciales globales — también se guardan por tenant en fiscal_config)
TUSFACTURAS_API_KEY=
TUSFACTURAS_USER_TOKEN=
```

---

## Desarrollo local

```bash
# Requiere Node.js v20
nvm use 20

npm install
npm run dev          # http://localhost:3000
npm run build        # build de producción
npm run type-check   # verificar tipos TypeScript
```

---

## Convenciones

- Archivos: `kebab-case.tsx`
- Componentes: `PascalCase`
- Funciones/variables: `camelCase`
- Tablas Supabase: `snake_case`
- Constantes: `UPPER_SNAKE_CASE`
- TypeScript estricto — no usar `any`
- Server Components por default; Client Components solo cuando hay interactividad
- Toda query a Supabase filtra por `organization_id`
- Commits en español: `feat: agregar política RLS para tabla inventario`
- No instalar librerías nuevas sin evaluar impacto en bundle

---

## Roadmap

### Fase 1 — completada
- Multi-tenancy con RLS
- Auth + onboarding
- Producción, inventario, órdenes de compra, pedidos de clientes
- Asistente IA con contexto operativo
- Alertas operativas + cron + WhatsApp
- Facturación AFIP (TusFacturasAPP)

### Fase 2 — próximo
- CRON_SECRET configurado en Vercel (pendiente)
- MercadoPago suscripciones — billing automático de la plataforma
- Landing page pública con pricing
- Onboarding self-service para clientes externos
