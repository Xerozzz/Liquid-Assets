import supertest from 'supertest'
import app from '../src/index.js'

// Shared supertest instance — every test file talks to the real Express app
// wired to the real (dockerized) Postgres, since there's no separate test DB.
export const api = supertest(app)
