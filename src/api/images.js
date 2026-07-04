import { apiUrl, handleResponse } from './base'

export const uploadImage = async (file) => {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(apiUrl('/api/images'), { method: 'POST', body: form })
  const data = await handleResponse(res)
  return data?.filename
}

export const imageUrl = (filename) => {
  if (!filename) return null
  if (/^https?:|^data:|^blob:/.test(filename)) return filename
  return apiUrl(`/api/images/${encodeURIComponent(filename)}`)
}

export const deleteImage = async (filename) => {
  if (!filename) return
  await fetch(apiUrl(`/api/images/${encodeURIComponent(filename)}`), { method: 'DELETE' })
}
