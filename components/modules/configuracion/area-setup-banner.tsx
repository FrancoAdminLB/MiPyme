'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCog, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface AreaSetupBannerProps {
  area: keyof import('@/types').AreaResponsables
  areaLabel: string
  orgId: string
  currentConfig: import('@/types').IndustryConfig
}

export function AreaSetupBanner({ area, areaLabel, currentConfig }: AreaSetupBannerProps) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  if (dismissed || currentConfig.area_responsables?.[area]) return null

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    await fetch('/api/organizations/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...currentConfig,
        area_responsables: {
          ...(currentConfig.area_responsables ?? {}),
          [area]: name.trim(),
        },
      }),
    })
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-primary/20 bg-primary/5 text-sm">
      <UserCog className="h-4 w-4 text-primary shrink-0" />
      {editing ? (
        <div className="flex items-center gap-2 flex-1">
          <span className="text-muted-foreground shrink-0">Encargado de {areaLabel}:</span>
          <Input
            autoFocus
            placeholder="Nombre y apellido"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="h-7 text-sm max-w-48"
          />
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1">
          <span className="text-muted-foreground">¿Quién es el encargado de {areaLabel}?</span>
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Configurar
          </button>
        </div>
      )}
      <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
