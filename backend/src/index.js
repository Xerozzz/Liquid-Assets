import express from 'express'
import cors from 'cors'
import ingredientsRouter from './routes/ingredients.js'
import glasswareRouter from './routes/glassware.js'
import hmIngredientsRouter from './routes/hmIngredients.js'
import hmIngredientComponentsRouter from './routes/hmIngredientComponents.js'
import recipeIngredientsRouter from './routes/recipeIngredients.js'
import recipeHmIngredientsRouter from './routes/recipeHmIngredients.js'
import cocktailsRouter from './routes/cocktails.js'
import imagesRouter from './routes/images.js'
import chatRouter from './routes/chat.js'
import prisma from './prisma.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json({ limit: '2mb' }))

// Liveness: the process is up (no dependencies checked).
app.get('/health', (req, res) => res.json({ status: 'ok' }))

// Readiness: reachable through the nginx `/api/` proxy and verifies the database
// is actually connectable — so external uptime monitoring catches DB outages
// (like the auth failure that silently took the app down), not just a live port.
// Exempt from Basic Auth in nginx so a monitor can poll it without credentials.
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', db: 'ok' })
  } catch {
    res.status(503).json({ status: 'error', db: 'down' })
  }
})

// Basic Auth for every API route below (the two /health routes above stay public so uptime
// monitors can reach them). No-op if the env vars aren't set. The SPA collects the
// credentials via a login screen and sends them as an Authorization header — this lives here
// rather than in Vercel Edge Middleware, which doesn't run in the multi-service layout.
app.use((req, res, next) => {
  const user = process.env.BASIC_AUTH_USER
  const pass = process.env.BASIC_AUTH_PASSWORD
  if (!user || !pass) return next()
  const [scheme, encoded] = (req.headers.authorization || '').split(' ')
  if (scheme === 'Basic' && encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8')
    const idx = decoded.indexOf(':')
    if (idx !== -1 && decoded.slice(0, idx) === user && decoded.slice(idx + 1) === pass) {
      return next()
    }
  }
  res.set('WWW-Authenticate', 'Basic realm="Liquid Assets"')
  return res.status(401).json({ error: 'Authentication required' })
})

// Lightweight credential check for the login screen (protected by the middleware above).
app.get('/api/auth-check', (req, res) => res.json({ ok: true }))

app.use('/api/ingredients', ingredientsRouter)
app.use('/api/glassware', glasswareRouter)
app.use('/api/hm-ingredients', hmIngredientsRouter)
app.use('/api/hm-ingredient-components', hmIngredientComponentsRouter)
app.use('/api/recipe-ingredients', recipeIngredientsRouter)
app.use('/api/recipe-hm-ingredients', recipeHmIngredientsRouter)
app.use('/api/cocktails', cocktailsRouter)
app.use('/api/images', imagesRouter)
app.use('/api/chat', chatRouter)

// Skip listening only under the test runner (vitest sets NODE_ENV=test) so tests can
// import `app` and drive it via supertest. Everywhere else — Docker and Vercel's Express
// service alike — bind the port (Vercel provides process.env.PORT).
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`)
  })
}

export default app
