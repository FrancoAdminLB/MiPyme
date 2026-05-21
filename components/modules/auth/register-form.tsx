'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import { INDUSTRY_GROUPS, INDUSTRIES } from '@/lib/industries'
import type { Industry } from '@/types'

export function RegisterForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [industry, setIndustry] = useState<Industry>('dairy')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // 1. Crear org + usuario via API route (usa service_role, bypasea RLS)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgName, fullName, email, password, industry }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al crear la cuenta')
      setLoading(false)
      return
    }

    // 2. Login automático con las credenciales
    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Nombre de la empresa</Label>
            <Input
              id="orgName"
              placeholder="Mi Empresa S.A."
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Tipo de empresa</Label>
            <select
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value as Industry)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {INDUSTRY_GROUPS.map(group => (
                <optgroup key={group.label} label={group.label}>
                  {group.items.map(value => (
                    <option key={value} value={value}>{INDUSTRIES[value].label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Tu nombre completo</Label>
            <Input
              id="fullName"
              placeholder="Juan Pérez"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Ingresá
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
