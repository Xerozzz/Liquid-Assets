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

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/ingredients', ingredientsRouter)
app.use('/api/glassware', glasswareRouter)
app.use('/api/hm-ingredients', hmIngredientsRouter)
app.use('/api/hm-ingredient-components', hmIngredientComponentsRouter)
app.use('/api/recipe-ingredients', recipeIngredientsRouter)
app.use('/api/recipe-hm-ingredients', recipeHmIngredientsRouter)
app.use('/api/cocktails', cocktailsRouter)
app.use('/api/images', imagesRouter)

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`)
})
