export class ValidationError extends Error {}

export const asyncHandler =
  (fn, errorMessage = 'Something went wrong') =>
  async (req, res) => {
    try {
      await fn(req, res)
    } catch (e) {
      if (e instanceof ValidationError) {
        return res.status(400).json({ error: e.message })
      }
      console.error(e)
      res.status(500).json({ error: errorMessage })
    }
  }
