import { NuevaContrasenaForm } from '@/components/modules/auth/nueva-contrasena-form'

export default function NuevaContrasenaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Nueva contraseña</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Elegí una contraseña nueva para tu cuenta
          </p>
        </div>
        <NuevaContrasenaForm />
      </div>
    </div>
  )
}
