import { PrismaClient } from '@prisma/client'

// On serverless (Vercel) with Neon's POOLED connection, Prisma must disable prepared
// statements — pgbouncer in transaction-pooling mode doesn't support them, which breaks
// every non-trivial query (a simple `SELECT 1` can slip through, so /health looks fine while
// real queries fail). Append `pgbouncer=true` at runtime, but only for the pooled `-pooler`
// host — so we don't depend on the integration-managed DATABASE_URL carrying it, and a
// direct, non-pooled connection (Docker/GCP) is left exactly as-is.
function resolveDbUrl() {
  const url = process.env.DATABASE_URL
  if (!url || !url.includes('-pooler') || url.includes('pgbouncer=')) return url
  return url + (url.includes('?') ? '&' : '?') + 'pgbouncer=true'
}

const url = resolveDbUrl()

// Reuse a single client across (warm) invocations so each instance doesn't open a new pool.
const prisma =
  globalThis.__prisma || new PrismaClient(url ? { datasources: { db: { url } } } : undefined)
globalThis.__prisma = prisma

export default prisma
