// Vercel Edge Middleware — HTTP Basic Auth for the whole site (static frontend AND
// API), replacing the nginx .htpasswd we used on Docker/GCP. It's a no-op unless both
// BASIC_AUTH_USER and BASIC_AUTH_PASSWORD are set, matching the opt-in behaviour there.
//
// /api/health is exempt so an external uptime monitor can poll it without credentials.
export const config = {
  matcher: ['/((?!api/health|_vercel|favicon.ico).*)'],
}

export default function middleware(req) {
  const user = process.env.BASIC_AUTH_USER
  const pass = process.env.BASIC_AUTH_PASSWORD
  if (!user || !pass) return // auth not configured -> allow through

  const header = req.headers.get('authorization') || ''
  const [scheme, encoded] = header.split(' ')
  if (scheme === 'Basic' && encoded) {
    const decoded = atob(encoded)
    const idx = decoded.indexOf(':')
    if (idx !== -1 && decoded.slice(0, idx) === user && decoded.slice(idx + 1) === pass) {
      return // authorized -> continue to the app
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Liquid Assets"' },
  })
}
