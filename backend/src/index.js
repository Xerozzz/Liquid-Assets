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

app.use('/api/ingredients', ingredientsRouter)
app.use('/api/glassware', glasswareRouter)
app.use('/api/hm-ingredients', hmIngredientsRouter)
app.use('/api/hm-ingredient-components', hmIngredientComponentsRouter)
app.use('/api/recipe-ingredients', recipeIngredientsRouter)
app.use('/api/recipe-hm-ingredients', recipeHmIngredientsRouter)
app.use('/api/cocktails', cocktailsRouter)
app.use('/api/images', imagesRouter)
app.use('/api/chat', chatRouter)

// Skip listening under the test runner so tests can import `app` and drive it via supertest
// without also binding the port (vitest sets NODE_ENV=test by default).
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`)
  })
}

export default app
