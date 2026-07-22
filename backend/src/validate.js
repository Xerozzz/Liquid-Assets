import { ValidationError } from './asyncHandler.js'

export function requireString(body, field) {
  const value = body[field]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`"${field}" is required`)
  }
  return value
}

export function requireNumber(body, field) {
  const value = Number(body[field])
  if (!Number.isFinite(value)) {
    throw new ValidationError(`"${field}" must be a number`)
  }
  return value
}
