import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Skip session handling for auth callback to preserve PKCE verifier cookies
  if (request.nextUrl.pathname.startsWith('/auth/callback')) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Interceptar ?code= que Supabase manda al Site URL raíz
  // y redirigirlo al callback handler correcto
  const code = request.nextUrl.searchParams.get('code')
  if (code && (pathname === '/' || pathname === '/login')) {
    const callbackUrl = request.nextUrl.clone()
    callbackUrl.pathname = '/auth/callback'
    callbackUrl.searchParams.set('code', code)
    callbackUrl.searchParams.delete('next')
    return NextResponse.redirect(callbackUrl)
  }
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/registro') || pathname.startsWith('/auth/')
  const isDashboardRoute =
    pathname.startsWith('/produccion') ||
    pathname.startsWith('/inventario') ||
    pathname.startsWith('/reportes') ||
    pathname.startsWith('/asistente') ||
    pathname.startsWith('/configuracion') ||
    pathname.startsWith('/proveedores') ||
    pathname.startsWith('/onboarding')

  if (!user && isDashboardRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  if (user && isAuthRoute) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/reportes'
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}
