import { apiUrl, handleResponse } from './base'
import { mapGlassware } from './mappers'

export const getGlassware = async () => {
  const res = await fetch(apiUrl('/api/glassware'))
  const data = await handleResponse(res)
  return Array.isArray(data) ? data.map(mapGlassware) : data
}

export const getGlasswareById = async (id) => {
  const res = await fetch(apiUrl(`/api/glassware/${id}`))
  const data = await handleResponse(res)
  return mapGlassware(data)
}

export const createGlassware = async (brand, model, volume, volume_fill) => {
  const res = await fetch(apiUrl('/api/glassware'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brand, model, volume, volumeWIce: volume_fill }),
  })
  const data = await handleResponse(res)
  return mapGlassware(data)
}

export const updateGlassware = async (brand, model, volume, volume_fill, glass_id) => {
  const res = await fetch(apiUrl(`/api/glassware/${glass_id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brand, model, volume, volumeWIce: volume_fill }),
  })
  const data = await handleResponse(res)
  return mapGlassware(data)
}

export const deleteGlassware = async (glass_id) => {
  const res = await fetch(apiUrl(`/api/glassware/${glass_id}`), { method: 'DELETE' })
  return handleResponse(res)
}

export const createMultipleGlassware = async (rows) => {
  if (!rows || rows.length === 0) return []
  return Promise.all(rows.map((r) => createGlassware(r.brand, r.model, r.volume, r.volume_w_ice)))
}
