import { createClient } from './server'
import type { Profile, Organization, Industry, IndustryConfig } from '@/types'
import { INDUSTRIES } from '@/lib/industries'

/**
 * Mergea la config guardada en el DB con los defaults de la industria.
 * Los defaults de la industria tienen los parámetros normativos (min_value, max_value, compliance_ref).
 * La config del DB puede tener customizaciones del tenant que se respetan si existen.
 */
function mergeWithIndustryDefaults(industry: Industry, storedConfig: IndustryConfig): IndustryConfig {
  const defaults = INDUSTRIES[industry]?.defaultConfig
  if (!defaults) return storedConfig

  // Mergear custom_fields: los defaults tienen compliance data, la config del DB puede tener personalizaciones
  const defaultFields = defaults.custom_fields ?? []
  const storedFields  = storedConfig.custom_fields ?? []

  const mergedFields = defaultFields.map(defaultField => {
    const stored = storedFields.find(f => f.key === defaultField.key)
    // El tenant puede personalizar label y required.
    // stage, type, unit, min_value, max_value, compliance_ref, options siempre
    // vienen del default (son parte de la plantilla de industria, no del tenant).
    return {
      ...defaultField,
      ...(stored ? { label: stored.label, required: stored.required } : {}),
    }
  })

  // Agregar campos custom del tenant que no están en los defaults
  const extraFields = storedFields.filter(sf => !defaultFields.find(df => df.key === sf.key))

  return {
    input_label:   storedConfig.input_label   ?? defaults.input_label,
    output_label:  storedConfig.output_label  ?? defaults.output_label,
    product_types: storedConfig.product_types ?? defaults.product_types,
    stages:        defaults.stages,   // siempre los stages actuales de la industria
    custom_fields: [...mergedFields, ...extraFields],
    currency:      storedConfig.currency,
    units:         storedConfig.units,
    features:      storedConfig.features,
    language:      storedConfig.language,
  }
}

/**
 * Obtiene el perfil del usuario autenticado junto con su organización.
 * La industry_config devuelta siempre incluye los parámetros normativos de la industria.
 */
export async function getAuthContext(): Promise<{
  profile: Profile
  organization: Organization
} | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  // Super admin: usar la org activa si está seleccionada, si no la propia
  const orgId = (!!profile.is_super_admin && profile.super_admin_active_org)
    ? profile.super_admin_active_org
    : profile.organization_id

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, industry, plan, industry_config, onboarding_completed, created_at')
    .eq('id', orgId)
    .single()

  // Fallback a org propia si la activa no es accesible
  const finalOrg = org ?? (orgId !== profile.organization_id
    ? await supabase
        .from('organizations')
        .select('id, name, slug, industry, plan, industry_config, onboarding_completed, created_at')
        .eq('id', profile.organization_id)
        .single()
        .then(r => r.data)
    : null)

  if (!finalOrg) return null

  // Mergear con defaults de la industria para garantizar compliance data
  const mergedOrg = {
    ...finalOrg,
    industry_config: mergeWithIndustryDefaults(
      finalOrg.industry as Industry,
      (finalOrg.industry_config ?? {}) as IndustryConfig
    ),
  }

  return {
    profile: profile as unknown as Profile,
    organization: mergedOrg as unknown as Organization,
  }
}
