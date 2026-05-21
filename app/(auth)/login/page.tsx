import { LoginForm } from '@/components/modules/auth/login-form'

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">MiPyme</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ingresá a tu cuenta
        </p>
      </div>
      <LoginForm />
    </div>
  )
}
