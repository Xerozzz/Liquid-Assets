import { GoogleGenAI } from '@google/genai'

export const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest'

export const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null
