import express from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'

const router = express.Router()

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads'
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin'
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`
    cb(null, name)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'))
    }
    cb(null, true)
  },
})

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  res.status(201).json({ filename: req.file.filename })
})

router.get('/:name', (req, res) => {
  const name = path.basename(req.params.name)
  const full = path.join(UPLOAD_DIR, name)
  fs.stat(full, (err) => {
    if (err) return res.status(404).json({ error: 'Not found' })
    res.sendFile(full)
  })
})

router.delete('/:name', (req, res) => {
  const name = path.basename(req.params.name)
  const full = path.join(UPLOAD_DIR, name)
  fs.unlink(full, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error(err)
      return res.status(500).json({ error: 'Failed to delete image' })
    }
    res.status(204).end()
  })
})

export default router
