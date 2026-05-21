import { AsitenteChat } from '@/components/modules/asistente/asistente-chat'

export default function AsistentePage() {
  return (
    <div className="p-8 h-full flex flex-col" style={{ height: 'calc(100vh - 0px)' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Asistente IA</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Preguntá sobre producción, inventario, órdenes o alertas — con tus datos en tiempo real
        </p>
      </div>
      <AsitenteChat />
    </div>
  )
}
