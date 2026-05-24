'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronsUpDown, Check, Building2 } from 'lucide-react'

interface OrgOption {
  id: string
  name: string
  industry: string
}

interface OrgSwitcherProps {
  currentOrgId: string
  orgs: OrgOption[]
}

const INDUSTRY_LABELS: Record<string, string> = {
  dairy:             'Lácteos',
  chacinados:        'Carnicería / Chacinados',
  tambo:             'Tambo',
  bodega:            'Bodega',
  cerveceria:        'Cervecería',
  panaderia:         'Panadería',
  food_manufacturing:'Alimentos',
  chacinados_carni:  'Carnicería',
  frigorifico:       'Frigorífico',
  apicultura:        'Apicultura',
  olivicultura:      'Olivicultura',
  avicultura:        'Avicultura',
  acuicultura:       'Acuicultura',
  cosmetica:         'Cosmética',
  suplementos:       'Suplementos',
  hidroponia:        'Hidroponía',
}

export function OrgSwitcher({ currentOrgId, orgs }: OrgSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const current = orgs.find(o => o.id === currentOrgId)

  async function switchOrg(orgId: string) {
    if (orgId === currentOrgId) { setOpen(false); return }
    setLoading(true)
    await fetch('/api/admin/switch-org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId }),
    })
    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs bg-muted/60 hover:bg-muted transition-colors disabled:opacity-50"
      >
        <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left truncate font-medium">{current?.name ?? '—'}</span>
        <ChevronsUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
          {orgs.map(org => (
            <button
              key={org.id}
              onClick={() => switchOrg(org.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{org.name}</p>
                <p className="text-muted-foreground">{INDUSTRY_LABELS[org.industry] ?? org.industry}</p>
              </div>
              {org.id === currentOrgId && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
