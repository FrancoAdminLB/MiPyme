import { RegisterForm } from '@/components/modules/auth/register-form'

export default function RegistroPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">MiPyme</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Crear nueva cuenta
        </p>
      </div>
      <RegisterForm />
    </div>
  )
}
