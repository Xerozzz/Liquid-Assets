const BASE_API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const apiUrl = (path) => `${BASE_API}${path}`

export async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err?.error || err?.message || res.statusText)
  }
  return res.status === 204 ? null : res.json()
}
