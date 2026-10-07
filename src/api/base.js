// Same-origin by default in production (Vercel and the nginx/Docker build both serve the API
// under /api on the same host). Only fall back to the local backend during `vite dev`. An
// explicit VITE_API_URL still wins. Using same-origin also keeps the auth token on the request
// (a cross-origin absolute URL would drop it / trigger CORS).
const BASE_API =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000' : '')

export const apiUrl = (path) => `${BASE_API}${path}`

export async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err?.error || err?.message || res.statusText)
  }
  return res.status === 204 ? null : res.json()
}
