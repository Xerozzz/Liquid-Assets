import express from 'express'
import { asyncHandler, ValidationError } from '../asyncHandler.js'
import { ai, MODEL } from '../gemini.js'
import { toolDeclarations, toolHandlers } from '../chatTools.js'

const router = express.Router()

const SYSTEM_INSTRUCTION = `You are the in-app assistant for "Liquid Assets", a cocktail costing and
inventory app. You can look up cocktails, ingredients, homemade ingredients, and glassware — including
each cocktail's cost, sale price, and profit margin — and you can create new
ingredients/glassware/cocktails, update an ingredient's stock status, or update a cocktail's sale
price using the provided tools. You have no delete tools — you cannot remove anything, so never
claim to. When a write tool reports unmatched ingredient names or an error, tell the user plainly
rather than pretending it succeeded. Keep replies short and conversational.`

const MAX_TOOL_TURNS = 5

router.post(
  '/',
  asyncHandler(async (req, res) => {
    if (!ai) {
      return res.status(503).json({ error: 'Chat is not configured (missing GEMINI_API_KEY)' })
    }

    const messages = Array.isArray(req.body?.messages) ? req.body.messages : []
    if (messages.length === 0) {
      throw new ValidationError('"messages" must be a non-empty array')
    }

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.text ?? '') }],
    }))

    let finalText = ''

    for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
      let response
      try {
        response = await ai.models.generateContent({
          model: MODEL,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ functionDeclarations: toolDeclarations }],
          },
        })
      } catch (e) {
        if (e?.status === 429) {
          throw new ValidationError(
            "Gemini's free-tier rate limit was hit — wait about a minute and try again.",
          )
        }
        throw e
      }

      const calls = response.functionCalls ?? []
      if (calls.length === 0) {
        finalText = response.text ?? ''
        break
      }

      contents.push({ role: 'model', parts: response.candidates[0].content.parts })

      const responseParts = []
      for (const call of calls) {
        const handler = toolHandlers[call.name]
        let result
        try {
          result = handler
            ? await handler(call.args || {})
            : { error: `Unknown tool "${call.name}"` }
        } catch (e) {
          result = { error: e instanceof ValidationError ? e.message : 'Tool execution failed' }
        }
        responseParts.push({ functionResponse: { name: call.name, response: { result } } })
      }
      contents.push({ role: 'user', parts: responseParts })
    }

    res.json({ reply: finalText || "Sorry, I couldn't complete that." })
  }, 'Chat request failed'),
)

export default router
