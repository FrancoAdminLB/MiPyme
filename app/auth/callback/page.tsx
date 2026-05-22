'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')

  useEffect(() => {
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/nueva-contrasena'

    if (!code) {
      router.replace('/login?error=link_invalido')
      return
    }

    const supabase = createClient()

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setStatus('error')
        router.replace('/login?error=link_invalido')
      } else {
        router.replace(next)
      }
    })
  }, [router, searchParams])

  if (status === 'error') return null

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
