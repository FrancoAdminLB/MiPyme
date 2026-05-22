'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export function RecuperarForm() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback`

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    setLoading(false)
    if (error) {
      setError('No pudimos enviar el email. Verificá la dirección.')
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-3">
          <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
          <p className="font-semibold">Email enviado</p>
          <p className="text-sm text-muted-foreground">
            Revisá tu bandeja de entrada y hacé clic en el link para crear una nueva contraseña.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/login" className="text-sm text-primary hover:underline">
            Volver al login
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email de tu cuenta</Label>
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
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar link de recuperación'}
          </Button>
          <Link href="/login" className="text-sm text-muted-foreground hover:underline text-center">
            Volver al login
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
