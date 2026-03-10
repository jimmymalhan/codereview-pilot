import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import 'dotenv/config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())
app.use(express.static(join(__dirname, 'www')))

// API Routes
app.get('/api-reference.html', (req, res) => {
  res.sendFile(join(__dirname, 'www', 'api-reference.html'))
})

app.post('/api/diagnose', async (req, res) => {
  const { incident } = req.body

  if (!incident || incident.length < 10) {
    return res.status(400).json({
      error: 'invalid_input',
      message: 'Incident description must be at least 10 characters',
      status: 400
    })
  }

  try {
    // Placeholder for actual diagnosis logic
    res.json({
      status: 'success',
      message: 'Diagnosis endpoint available',
      data: { incident }
    })
  } catch (error) {
    res.status(500).json({
      error: 'server_error',
      message: error.message,
      status: 500
    })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Claude Debug Copilot Server`)
  console.log(`📍 Running at http://localhost:${PORT}`)
})
