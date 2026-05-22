import { LoginForm } from '@/components/modules/auth/login-form'

interface Props {
  searchParams: { error?: string }
}

export default function LoginPage({ searchParams }: Props) {
  const errorMsg = searchParams.error === 'link_invalido'
    ? 'El link de recuperación expiró o ya fue usado. Solicitá uno nuevo.'
    : null

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">MiPyme</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ingresá a tu cuenta
        </p>
      </div>
      {errorMsg && (
        <p className="text-sm text-destructive text-center bg-destructive/10 rounded-md px-4 py-3">
          {errorMsg}
        </p>
      )}
      <LoginForm />
    </div>
  )
}
