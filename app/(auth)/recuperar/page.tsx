import { RecuperarForm } from '@/components/modules/auth/recuperar-form'

export default function RecuperarPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Recuperar contraseña</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Te enviamos un link para resetear tu contraseña
          </p>
        </div>
        <RecuperarForm />
      </div>
    </div>
  )
}
