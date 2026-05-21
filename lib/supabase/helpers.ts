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
    // El default aporta compliance (min_value, max_value, compliance_ref)
    // El stored aporta personalizaciones del tenant (label, required, etc.)
    return { ...defaultField, ...(stored ?? {}) }
  })

  // Agregar campos custom del tenant que no están en los defaults
  const extraFields = storedFields.filter(sf => !defaultFields.find(df => df.key === sf.key))

  return {
    input_label:   storedConfig.input_label   ?? defaults.input_label,
    output_label:  storedConfig.output_label  ?? defaults.output_label,
    product_types: storedConfig.product_types ?? defaults.product_types,
    stages:        storedConfig.stages        ?? defaults.stages,
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
    .select('*, organizations(id, name, slug, industry, plan, industry_config, onboarding_completed, created_at)')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.organizations) return null

  const org = Array.isArray(profile.organizations)
    ? profile.organizations[0]
    : profile.organizations

  // Mergear con defaults de la industria para garantizar compliance data
  const mergedOrg = {
    ...org,
    industry_config: mergeWithIndustryDefaults(
      org.industry as Industry,
      (org.industry_config ?? {}) as IndustryConfig
    ),
  }

  return {
    profile: profile as unknown as Profile,
    organization: mergedOrg as unknown as Organization,
  }
}
