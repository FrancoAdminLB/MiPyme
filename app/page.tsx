import Link from 'next/link'
import {
  ArrowUpRight, BarChart3,
  FlaskConical, Bot, ShieldCheck, Zap,
} from 'lucide-react'
import { IndustryDemoSection } from '@/components/modules/landing/industry-demo-section'

const REGULATORS = ['SENASA', 'CAA', 'INV', 'INYM', 'ANMAT', 'ONCCA', 'SAGyP']

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F7F4] text-gray-950 font-sans">

      {/* Nav */}
      <header className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="text-lg font-bold tracking-tight">MiPyme</span>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-gray-500 hover:text-gray-900 transition-colors">
            Ingresar
          </Link>
          <Link
            href="/registro"
            className="bg-gray-950 text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            Empezar gratis
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        <div className="flex items-start justify-between gap-8 mb-2">
          <div className="flex-1">
            <p className="text-sm text-gray-400 font-medium tracking-widest uppercase mb-6">
              Gestión operativa con IA — PyMEs argentinas
            </p>
            <h1 className="text-[clamp(2.8rem,6vw,5rem)] font-bold leading-[1.05] tracking-tight max-w-3xl">
              Tu operación bajo control,{' '}
              <em className="not-italic text-gray-400">sin planillas de Excel.</em>
            </h1>
          </div>
        </div>

        <div className="flex items-end justify-between mt-10 gap-8 flex-wrap">
          <p className="text-lg text-gray-500 max-w-lg leading-relaxed">
            Producción, inventario y cumplimiento normativo en una sola plataforma.
            Con inteligencia artificial integrada y los límites de SENASA, CAA e INV ya cargados.
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/registro"
              className="flex items-center gap-2 bg-gray-950 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Empezar gratis <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 rounded-full text-sm font-medium border border-gray-300 hover:border-gray-500 transition-colors"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* Divider con stats */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="border-t border-gray-200 pt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { n: '20', label: 'industrias configuradas' },
            { n: '7', label: 'entes reguladores integrados' },
            { n: '5 min', label: 'para estar operativo' },
            { n: '100%', label: 'en español argentino' },
          ].map(({ n, label }) => (
            <div key={label}>
              <p className="text-4xl font-bold tracking-tight">{n}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bento grid */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 grid-rows-auto gap-4">

          {/* Card grande — IA */}
          <div className="col-span-12 md:col-span-7 bg-gray-950 text-white rounded-2xl p-8 flex flex-col justify-between min-h-[280px]">
            <div>
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Asistente IA integrado</h3>
              <p className="text-gray-400 leading-relaxed max-w-sm">
                Preguntale en lenguaje natural sobre tu operación y te responde con los datos reales de tu empresa. Sin dashboards complicados.
              </p>
            </div>
            <div className="mt-8 bg-white/5 rounded-xl p-4 font-mono text-sm">
              <p className="text-gray-500 mb-1">vos</p>
              <p className="text-white mb-3">¿Qué lotes están cerca de vencer este mes?</p>
              <p className="text-gray-500 mb-1">MiPyme IA</p>
              <p className="text-blue-400">Tenés 3 lotes con vencimiento en los próximos 7 días. El más urgente es el Lote #2841, vence el jueves.</p>
            </div>
          </div>

          {/* Card — Normativa */}
          <div className="col-span-12 md:col-span-5 bg-white rounded-2xl p-8 border border-gray-100 flex flex-col justify-between min-h-[280px]">
            <div>
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Cumplimiento en tiempo real</h3>
              <p className="text-gray-500 leading-relaxed">
                Cargás un parámetro y ves al instante si estás dentro de la norma. Sin consultar manuales.
              </p>
            </div>
            <div className="mt-6 space-y-2">
              {[
                { label: 'Temp. cocción interna', value: '74°C', ok: true, ref: 'CAA Art. 302 ≥72°C — Chacinados' },
                { label: 'Humedad miel', value: '22%', ok: false, ref: 'CAA Art. 782 ≤20% — Apicultura' },
                { label: 'SO₂ libre vino', value: '180 mg/L', ok: true, ref: 'INV Res. C.35 ≤200 mg/L — Bodega' },
              ].map(({ label, value, ok, ref }) => (
                <div key={label} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <div>
                    <p className="font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400">{ref}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold">{value}</span>
                    <span className={`w-2 h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card — Producción */}
          <div className="col-span-12 md:col-span-4 bg-white rounded-2xl p-8 border border-gray-100">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
              <FlaskConical className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Control de producción</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Lotes, etapas del proceso y trazabilidad completa. Cada industria tiene sus propias etapas y campos.
            </p>
            <div className="mt-6 space-y-2">
              {[
                { industry: 'Panadería', stages: 'Amasado → Fermentación → Horneado' },
                { industry: 'Bodega', stages: 'Cosecha → Fermentación → Guarda' },
                { industry: 'Pesca', stages: 'Recepción → Procesado → Congelado' },
              ].map(({ industry, stages }) => (
                <div key={industry} className="text-xs">
                  <span className="font-medium text-gray-700">{industry}: </span>
                  <span className="text-gray-400">{stages}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card — Automatización */}
          <div className="col-span-12 md:col-span-4 bg-white rounded-2xl p-8 border border-gray-100">
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center mb-6">
              <Zap className="h-5 w-5 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Automatización de procesos</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              El sistema actúa solo: descuenta insumos, genera órdenes de compra y actualiza el stock sin que toques nada.
            </p>
            <div className="mt-6 space-y-2">
              {[
                { label: 'Insumo registrado', action: '→ stock descontado' },
                { label: 'Stock bajo mínimo', action: '→ orden generada' },
                { label: 'Lote completado', action: '→ producto al stock' },
              ].map(({ label, action }) => (
                <div key={label} className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 font-medium">{label}</span>
                  <span className="text-yellow-600 font-medium">{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card — Reportes */}
          <div className="col-span-12 md:col-span-4 bg-white rounded-2xl p-8 border border-gray-100">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Dashboard y reportes</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              KPIs de producción, rendimiento y alertas configurables. Todo en una pantalla, siempre actualizado.
            </p>
            <div className="mt-6 flex items-end gap-1 h-12">
              {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-purple-100 rounded-sm"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Industries */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-start justify-between gap-8 mb-8 flex-wrap">
          <div>
            <h2 className="text-3xl font-bold">20 industrias, una sola plataforma</h2>
            <p className="text-gray-500 mt-2">
              Hacé clic en tu rubro para ver cómo funciona y qué dolores te resuelve.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {REGULATORS.map(r => (
              <span key={r} className="text-xs px-3 py-1.5 border border-gray-300 rounded-full text-gray-600 font-medium">
                {r}
              </span>
            ))}
          </div>
        </div>
        <IndustryDemoSection />
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-2">Precios</h2>
        <p className="text-gray-500 mb-10">En pesos argentinos, sin sorpresas. Cancelás cuando querés.</p>

        <div className="space-y-3">
          <div className="hidden md:grid grid-cols-12 text-xs text-gray-400 uppercase tracking-widest px-6 pb-2">
            <div className="col-span-3">Plan</div>
            <div className="col-span-2">Precio</div>
            <div className="col-span-5">Incluye</div>
            <div className="col-span-2"></div>
          </div>

          {[
            {
              name: 'Free',
              price: 'Gratis',
              features: 'Producción · Inventario · Reportes de KPIs · 1 usuario',
              cta: 'Empezar',
              highlight: false,
            },
            {
              name: 'Starter',
              price: '$29.900 / mes',
              features: 'Todo lo de Free · Gráficos históricos · Asistente IA · Cumplimiento normativo · Órdenes automáticas',
              cta: 'Empezar',
              highlight: true,
            },
            {
              name: 'Pro',
              price: '$59.900 / mes',
              features: 'Todo lo de Starter · Motor de alertas · Configuración avanzada · Soporte prioritario',
              cta: 'Contactar',
              highlight: false,
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`grid grid-cols-12 items-center px-6 py-5 rounded-2xl gap-4 ${
                plan.highlight
                  ? 'bg-gray-950 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="col-span-12 md:col-span-3">
                <p className={`font-bold text-lg ${plan.highlight ? 'text-white' : ''}`}>{plan.name}</p>
              </div>
              <div className="col-span-12 md:col-span-2">
                <p className={`font-mono font-semibold ${plan.highlight ? 'text-white' : 'text-gray-800'}`}>
                  {plan.price}
                </p>
              </div>
              <div className="col-span-12 md:col-span-5">
                <p className={`text-sm ${plan.highlight ? 'text-gray-400' : 'text-gray-500'}`}>{plan.features}</p>
              </div>
              <div className="col-span-12 md:col-span-2 md:text-right">
                <Link
                  href="/registro"
                  className={`inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full transition-colors ${
                    plan.highlight
                      ? 'bg-white text-gray-950 hover:bg-gray-100'
                      : 'bg-gray-950 text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.cta} <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-white border border-gray-200 rounded-2xl p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-4xl font-bold mb-3">¿Empezamos?</h2>
            <p className="text-gray-500 text-lg">Dos minutos para crear tu cuenta. Sin tarjeta.</p>
          </div>
          <Link
            href="/registro"
            className="flex items-center gap-2 bg-gray-950 text-white px-8 py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-colors shrink-0"
          >
            Crear cuenta gratis <ArrowUpRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-8 border-t border-gray-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span className="font-bold text-gray-950">MiPyme</span>
          <span>Gestión operativa con IA para PyMEs argentinas</span>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-gray-600 transition-colors">Ingresar</Link>
            <Link href="/registro" className="hover:text-gray-600 transition-colors">Registrarse</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
