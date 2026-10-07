// App-level Basic Auth credential store (session-scoped).
//
// The backend protects every /api/* route with Basic Auth; the login screen collects the
// username/password and stores the base64 token here, and a fetch wrapper (main.js) sends it
// on every API request. We do this in-app rather than via Vercel Edge Middleware because the
// multi-service deployment layout doesn't run root middleware.
const KEY = 'la_auth'

export function getAuthToken() {
  try {
    return sessionStorage.getItem(KEY) || ''
  } catch {
    return ''
  }
}

export function setAuthToken(username, password) {
  try {
    sessionStorage.setItem(KEY, btoa(`${username}:${password}`))
  } catch {
    // sessionStorage blocked — auth won't survive a reload, but works for this session.
  }
}

export function clearAuthToken() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

export function hasAuthToken() {
  return !!getAuthToken()
}
