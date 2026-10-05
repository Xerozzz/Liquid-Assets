// Vercel serverless entry point.
//
// The whole Express API is served as a single function. vercel.json rewrites every
// `/api/*` request here, and Express (imported from the existing backend) routes it —
// so we keep one codebase that runs both as a long-lived container (Docker/GCP) and as
// a Vercel function. backend/src/index.js skips app.listen() when VERCEL is set and
// exports the app, which Vercel invokes as the request handler.
import app from '../backend/src/index.js'

export default app
