import { NextResponse } from 'next/server'
import { z } from 'zod'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'

// MongoDB connection
let cachedClient = null
let cachedDb = null

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const client = new MongoClient(process.env.MONGO_URL)
  await client.connect()
  const db = client.db(process.env.DB_NAME)

  cachedClient = client
  cachedDb = db
  return { client, db }
}

// Validation schemas
const hdGenerationSchema = z.object({
  prompt: z.string().min(1),
  modelVersion: z.string().default('2.2'),
  numResults: z.number().int().min(1).max(4).default(1),
  aspectRatio: z.string().default('1:1'),
  sync: z.boolean().default(true),
  seed: z.number().int().optional(),
  negativePrompt: z.string().optional(),
  stepsNum: z.number().int().min(20).max(50).optional(),
  textGuidanceScale: z.number().min(1).max(10).optional(),
  medium: z.enum(['photography', 'art']).optional(),
  promptEnhancement: z.boolean().default(false),
  enhanceImage: z.boolean().default(false),
  contentModeration: z.boolean().default(true),
  ipSignal: z.boolean().default(false)
})

const promptEnhanceSchema = z.object({
  prompt: z.string().min(1)
})

const lifestyleByTextSchema = z.object({
  prompt: z.string().min(1),
  productImageUrl: z.string().url(),
  numResults: z.number().int().min(1).max(4).default(1),
  sync: z.boolean().default(true)
})

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

// Helper functions
async function callBriaAPI(endpoint, data, method = 'POST') {
  try {
    const response = await fetch(`https://engine.prod.bria-api.com${endpoint}`, {
      method,
      headers: {
        'api_token': process.env.BRIA_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    const responseText = await response.text()
    
    if (!response.ok) {
      console.error(`Bria API Error: ${response.status} - ${responseText}`)
      return {
        error: true,
        status: response.status,
        message: responseText || 'Bria API Error'
      }
    }

    return JSON.parse(responseText)
  } catch (error) {
    console.error('Bria API Call Error:', error)
    return {
      error: true,
      status: 500,
      message: error.message || 'API Call Failed'
    }
  }
}

async function saveJob(db, userId, jobType, input, output = null, status = 'pending') {
  const job = {
    id: uuidv4(),
    userId,
    jobType,
    input,
    output,
    status,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  await db.collection('jobs').insertOne(job)
  return job
}

async function hashPassword(password) {
  // Simple hash for demo - use bcrypt in production
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'neonframe_salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Main API handler
export async function GET(request) {
  const { pathname, searchParams } = new URL(request.url)
  const segments = pathname.replace('/api/', '').split('/').filter(Boolean)

  try {
    const { db } = await connectToDatabase()

    // Get user jobs
    if (segments[0] === 'jobs' && segments[1] === 'user') {
      const userId = searchParams.get('userId')
      if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 })
      }

      const jobs = await db.collection('jobs')
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray()

      return NextResponse.json({ jobs })
    }

    // Check URL status (for async results)
    if (segments[0] === 'check-url') {
      const url = searchParams.get('url')
      if (!url) {
        return NextResponse.json({ error: 'URL required' }, { status: 400 })
      }

      try {
        const response = await fetch(url, { method: 'HEAD' })
        return NextResponse.json({ ready: response.ok })
      } catch {
        return NextResponse.json({ ready: false })
      }
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  const { pathname } = new URL(request.url)
  const segments = pathname.replace('/api/', '').split('/').filter(Boolean)

  try {
    const { db } = await connectToDatabase()
    const body = await request.json()

    // User registration
    if (segments[0] === 'auth' && segments[1] === 'register') {
      const input = userSchema.parse(body)
      
      // Check if user exists
      const existingUser = await db.collection('users').findOne({ email: input.email })
      if (existingUser) {
        return NextResponse.json({ error: 'User already exists' }, { status: 409 })
      }

      // Create user
      const hashedPassword = await hashPassword(input.password)
      const user = {
        id: uuidv4(),
        email: input.email,
        password: hashedPassword,
        name: input.name || input.email.split('@')[0],
        createdAt: new Date(),
        credits: 100 // Free credits
      }

      await db.collection('users').insertOne(user)
      const { password, ...userResponse } = user
      return NextResponse.json({ user: userResponse })
    }

    // User login
    if (segments[0] === 'auth' && segments[1] === 'login') {
      const input = loginSchema.parse(body)
      const hashedPassword = await hashPassword(input.password)
      
      const user = await db.collection('users').findOne({
        email: input.email,
        password: hashedPassword
      })

      if (!user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const { password, ...userResponse } = user
      return NextResponse.json({ user: userResponse })
    }

    // HD Image Generation
    if (segments[0] === 'bria' && segments[1] === 'hd-generation') {
      const input = hdGenerationSchema.parse(body)
      const userId = body.userId || 'anonymous'

      const briaData = {
        prompt: input.prompt,
        num_results: input.numResults,
        sync: input.sync,
        negative_prompt: input.negativePrompt || '',
        aspect_ratio: input.aspectRatio,
        seed: input.seed,
        steps_num: input.stepsNum,
        text_guidance_scale: input.textGuidanceScale,
        medium: input.medium,
        prompt_enhancement: input.promptEnhancement || undefined,
        enhance_image: input.enhanceImage || undefined,
        content_moderation: input.contentModeration || undefined,
        ip_signal: input.ipSignal || undefined
      }

      const result = await callBriaAPI(`/v1/text-to-image/hd/${input.modelVersion}`, briaData)
      
      if (result.error) {
        return NextResponse.json({ error: result.message }, { status: result.status })
      }

      // Save job to database
      const job = await saveJob(db, userId, 'hd-generation', input, result, 'completed')
      
      // Format response to match expected structure
      const response = {
        result_urls: result.result && result.result[0] && result.result[0].urls ? result.result[0].urls : [],
        enhanced_prompt: result.result && result.result[0] && result.result[0].enhanced_prompt ? result.result[0].enhanced_prompt : input.prompt,
        jobId: job.id,
        seed: result.result && result.result[0] && result.result[0].seed ? result.result[0].seed : null,
        uuid: result.result && result.result[0] && result.result[0].uuid ? result.result[0].uuid : null
      }
      
      return NextResponse.json(response)
    }

    // Prompt Enhancement
    if (segments[0] === 'bria' && segments[1] === 'prompt-enhance') {
      const input = promptEnhanceSchema.parse(body)
      const userId = body.userId || 'anonymous'

      const result = await callBriaAPI('/v1/prompt_enhancer', { prompt: input.prompt })
      
      if (result.error) {
        return NextResponse.json({ error: result.message }, { status: result.status })
      }

      // Save job to database
      await saveJob(db, userId, 'prompt-enhance', input, result, 'completed')
      
      // Format response to match expected structure
      const response = {
        enhanced_prompt: result['prompt variations'] || result.enhanced_prompt || input.prompt
      }
      
      return NextResponse.json(response)
    }

    // Lifestyle by Text
    if (segments[0] === 'bria' && segments[1] === 'lifestyle-text') {
      const input = lifestyleByTextSchema.parse(body)
      const userId = body.userId || 'anonymous'

      const briaData = {
        image_url: input.productImageUrl,
        scene_description: input.prompt,
        num_results: input.numResults,
        sync: input.sync
      }

      const result = await callBriaAPI('/v1/product/lifestyle_shot_by_text', briaData)
      
      if (result.error) {
        return NextResponse.json({ error: result.message }, { status: result.status })
      }

      // Debug: Log the raw result
      console.log('Lifestyle API Raw Result:', JSON.stringify(result, null, 2))

      // Save job to database
      const job = await saveJob(db, userId, 'lifestyle-text', input, result, 'completed')
      
      // Format response to match expected structure
      let resultUrls = []
      if (result.result && Array.isArray(result.result)) {
        resultUrls = result.result.map(item => {
          if (Array.isArray(item) && item.length > 0) {
            return item[0] // First element is the URL
          }
          return null
        }).filter(url => url !== null)
      }
      
      const response = {
        result_urls: resultUrls,
        jobId: job.id
      }
      
      return NextResponse.json(response)
    }

    // Erase Foreground
    if (segments[0] === 'bria' && segments[1] === 'erase-foreground') {
      const { imageUrl, userId = 'anonymous' } = body
      
      if (!imageUrl) {
        return NextResponse.json({ error: 'Image URL required' }, { status: 400 })
      }

      const result = await callBriaAPI('/v1/erase_foreground', {
        image_url: imageUrl,
        sync: true
      })
      
      if (result.error) {
        return NextResponse.json({ error: result.message }, { status: result.status })
      }

      // Save job to database
      const job = await saveJob(db, userId, 'erase-foreground', { imageUrl }, result, 'completed')
      
      // Format response to match expected structure
      const response = {
        result_urls: result.result_url ? [result.result_url] : [],
        jobId: job.id
      }
      
      return NextResponse.json(response)
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request) {
  return NextResponse.json({ error: 'Method not implemented' }, { status: 501 })
}

export async function DELETE(request) {
  return NextResponse.json({ error: 'Method not implemented' }, { status: 501 })
}