'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export function PrintButton() {
  useEffect(() => {
    // Auto-print si viene de un botón de impresión directa
    const url = new URL(window.location.href)
    if (url.searchParams.get('autoprint') === '1') {
      setTimeout(() => window.print(), 500)
    }
  }, [])

  return (
    <div className="flex justify-end gap-3 p-4 border-b print:hidden bg-white sticky top-0 z-10">
      <Button variant="outline" onClick={() => window.close()}>Cerrar</Button>
      <Button onClick={() => window.print()}>
        <Printer className="h-4 w-4 mr-2" /> Imprimir / Guardar PDF
      </Button>
    </div>
  )
}
