'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CallbackPage() {
  const router = useRouter()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Implicit flow: Supabase parses the URL hash and fires PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        subscription.unsubscribe()
        router.replace('/nueva-contrasena')
      }
    })

    const timeout = setTimeout(() => {
      setErrorMsg('El link expiró o ya fue usado. Solicitá uno nuevo.')
      subscription.unsubscribe()
    }, 6000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [router])

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-sm text-destructive">{errorMsg}</p>
          <a href="/recuperar" className="text-sm text-primary underline">Solicitar nuevo link</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Verificando link...</p>
    </div>
  )
}
