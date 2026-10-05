import { PrismaClient } from '@prisma/client'

// Reuse a single client across (warm) invocations — important on serverless so each
// function instance doesn't open a fresh pool. Use a pooled DATABASE_URL (e.g. Neon's
// pgbouncer connection string) in that environment. See docs/VERCEL.md.
const prisma = globalThis.__prisma || new PrismaClient()
globalThis.__prisma = prisma

export default prisma
