'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/nueva-contrasena'

    if (!code) {
      setErrorMsg('No se recibió código en la URL')
      return
    }

    const supabase = createClient()

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setErrorMsg(`Error: ${error.message} (status: ${error.status})`)
      } else {
        router.replace(next)
      }
    })
  }, [router, searchParams])

  if (errorMsg) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-destructive">{errorMsg}</p>
        <a href="/recuperar" className="text-sm text-primary underline">Solicitar nuevo link</a>
      </div>
    )
  }

  return <p className="text-sm text-muted-foreground">Verificando link...</p>
}

export default function CallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
        <CallbackHandler />
      </Suspense>
    </div>
  )
}
