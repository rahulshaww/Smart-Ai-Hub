const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Trust proxy for reverse proxies (Render, Railway, Heroku, Cloudflare)
app.set('trust proxy', 1);

let AIBrain;
try {
  AIBrain = require('./js/ai-brain.js');
} catch (e) {
  AIBrain = null;
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',').map(origin => origin.trim()).filter(Boolean);

app.use((req, res, next) => {
  cors({
    origin(origin, callback) {
      // 1. Allow requests with no origin (mobile app webviews, curl, server-to-server)
      if (!origin) return callback(null, true);

      // 2. Allow explicitly configured origins in environment
      if (allowedOrigins.includes(origin) || (origin === 'null' && allowedOrigins.includes('null'))) {
        return callback(null, true);
      }

      // 3. Dynamically allow same-host requests (app calling its own backend in production)
      try {
        const originHost = new URL(origin).host;
        const reqHost = req.headers.host;
        if (reqHost && (originHost === reqHost || originHost === reqHost.split(':')[0])) {
          return callback(null, true);
        }
        // Allow localhost and standard PaaS deployment subdomains
        if (
          originHost === 'localhost' ||
          originHost.startsWith('127.0.0.1') ||
          originHost.endsWith('.onrender.com') ||
          originHost.endsWith('.up.railway.app') ||
          originHost.endsWith('.vercel.app')
        ) {
          return callback(null, true);
        }
      } catch (_) {}

      // Reject all unauthorized third-party origins
      return callback(new Error('Origin not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
  })(req, res, next);
});
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(express.json({ limit: '1mb' }));

// Rate Limiters for Abuse Prevention
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // 60 requests per 15 mins per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Sensitive File Block Middleware (prevents leaking .env, .git, package.json, server.js)
app.use((req, res, next) => {
  const cleanPath = req.path.toLowerCase();
  if (
    cleanPath.startsWith('/.') || 
    cleanPath.includes('/.env') || 
    cleanPath.endsWith('.env') ||
    cleanPath.endsWith('package.json') ||
    cleanPath.endsWith('package-lock.json') ||
    cleanPath.endsWith('server.js')
  ) {
    return res.status(403).json({ error: 'Access forbidden.' });
  }
  next();
});

// Favicon handler to avoid 404
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Serve static frontend files safely
app.use(express.static(__dirname, {
  dotfiles: 'deny',
  index: 'index.html',
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
}));

// Apply Rate Limiters to API endpoints
app.use('/api/generate', apiLimiter);
app.use('/api/chat', apiLimiter);

// Auto-detect provider based on key format
function detectProvider(apiKey) {
  if (!apiKey) return 'none';
  const key = apiKey.trim();
  if (key.startsWith('AIzaSy') || key.startsWith('AQ.')) return 'gemini';
  if (key.startsWith('gsk_')) return 'groq';
  if (key.startsWith('sk-ant-')) return 'anthropic';
  if (key.startsWith('sk-proj-') || key.startsWith('sk-')) return 'openai';
  return 'none';
}

function getActiveApiKey() {
  const envKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GROQ_API_KEY,
    process.env.OPENAI_API_KEY,
    process.env.ANTHROPIC_API_KEY
  ];
  for (const k of envKeys) {
    if (k && k.trim().length > 5 && !k.includes('your_') && !k.includes('here')) {
      return k.trim();
    }
  }
  return '';
}

function validateText(value, field, maxLength) {
  if (typeof value !== 'string' || !value.trim()) return `${field} is required.`;
  if (value.length > maxLength) return `${field} is too long.`;
  return null;
}

function safeAIError(res, status = 502) {
  return res.status(status).json({ error: 'The AI service is temporarily unavailable. Please try again shortly.' });
}

// Health Check
app.get('/api/health', (req, res) => {
  const apiKey = getActiveApiKey();
  const provider = detectProvider(apiKey);
  res.json({
    status: 'ok',
    apiKeyConfigured: Boolean(apiKey && provider !== 'none'),
    provider: provider
  });
});

// Helper for extracting topic from prompt string
function extractTopic(userPrompt) {
  const match = userPrompt.match(/about "(.*?)"/i) || 
                userPrompt.match(/topic: "(.*?)"/i) || 
                userPrompt.match(/for "(.*?)"/i) || 
                userPrompt.match(/role: "(.*?)"/i) ||
                userPrompt.match(/position at "(.*?)"/i);
  if (match && match[1] && match[1].trim()) {
    return match[1].trim();
  }
  return userPrompt.split('\n')[0].replace(/Write a|Generate|Blog post|Resume|for|about/gi, '').trim() || 'your topic';
}

// Helper for Dynamic Rich Mock Response
function generateMockResponse(systemPrompt, userPrompt) {
  const promptLower = userPrompt.toLowerCase();
  const sysLower = (systemPrompt || '').toLowerCase();
  const topic = extractTopic(userPrompt);
  
  // RESUME (Strictly Grounded JSON conforming to ResumeData)
  if (promptLower.includes('resume') || sysLower.includes('resume')) {
    const nameMatch = userPrompt.match(/candidate\s+([^.\n\r]+)/i) || userPrompt.match(/for\s+([^,.\n]+)\s+applying/i) || userPrompt.match(/fullname:\s*([^\n]+)/i);
    const roleMatch = userPrompt.match(/target role:\s*([^\n\r]+)/i) || userPrompt.match(/applying for\s+([^\n\r]+)/i) || userPrompt.match(/role:\s*([^\n\r]+)/i);
    const emailMatch = userPrompt.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
    const phoneMatch = userPrompt.match(/(\+?[0-9()\s-]{7,20})/);
    const locMatch = userPrompt.match(/\|\s*([^|\n]+(?:city|state|country|[A-Z]{2}|India|USA|UK|Canada|Australia|CA|NY|TX|IL)[^|\n]*)/i) || userPrompt.match(/location:\s*([^\n|]+)/i);
    const expMatch = userPrompt.match(/provided information[^:]*:\s*([\s\S]+)$/i) || userPrompt.match(/background:\s*([\s\S]+)$/i) || userPrompt.match(/experience:\s*([\s\S]+)$/i);

    const name = nameMatch ? nameMatch[1].trim() : 'Alex Morgan';
    const role = roleMatch ? roleMatch[1].trim() : (topic || 'Professional');
    const email = emailMatch ? emailMatch[1].trim() : 'alex.morgan@example.com';
    const phone = phoneMatch ? phoneMatch[1].trim() : '+1 (555) 234-5678';
    const location = locMatch ? locMatch[1].trim() : 'Chicago, IL';
    const expProvided = expMatch ? expMatch[1].trim() : '';

    const cleanRole = role.charAt(0).toUpperCase() + role.slice(1);
    
    // Extract skills from provided text
    const cleanExp = expProvided.replace(/Dedicated,?\s+high-performing\s+[^.]+\./gi, '')
                                .replace(/with\s+a\s+proven\s+track\s+record\s+of\s+excellence\.?/gi, '')
                                .trim();
    const rawSkills = cleanExp.split(/[,;\n•|\/]/)
                              .map(s => s.replace(/^(skills?|technologies|tools|languages):\s*/i, '').trim())
                              .filter(s => s.length >= 2 && s.length <= 40);
    const skills = [...new Set(rawSkills)];

    const summary = expProvided.length > 20
      ? `Dedicated, high-performing ${cleanRole} with a proven track record of excellence. ${skills.length > 0 ? skills.join(', ') + '.' : expProvided.slice(0, 180)}`
      : `Accomplished and results-driven ${cleanRole} recognized for core capabilities and commitment to quality deliverables.`;

    const sections = [];
    if (skills.length > 0) {
      sections.push({
        id: "sec_skills",
        title: "Technical Skills & Core Competencies",
        type: "skills",
        items: skills
      });
    }

    const suggestions = [
      "+ Add work history if applicable",
      "+ Add education credentials if applicable",
      "+ Add certifications if applicable"
    ];

    const resumeJSON = {
      candidate: {
        name: name,
        role: cleanRole,
        email: email,
        phone: phone,
        location: location,
        links: [
          { label: "LinkedIn", url: `linkedin.com/in/${name.toLowerCase().replace(/[^a-z0-9]/g, '')}` }
        ]
      },
      summary: summary,
      sections: sections,
      suggestions: suggestions
    };

    return JSON.stringify(resumeJSON, null, 2);
  }

  // ESSAY
  if (promptLower.includes('essay') || sysLower.includes('essay')) {
    return `# Comprehensive Essay: ${topic}

## Introduction
The topic of **${topic}** holds significant importance in contemporary discussion. As society and technology evolve, understanding the nuances and broader implications of ${topic} becomes essential for academic and practical progress.

## Core Discussion & Analytical Insights
First, examining ${topic} reveals critical underlying factors that influence outcomes. Research indicates that structured methodology and strategic perspective lead to sustainable results.

Second, the practical application of principles surrounding ${topic} demonstrates that adaptability and continuous learning play pivotal roles in overcoming key challenges.

## Conclusion
In summary, **${topic}** remains a vital area of focus. By synthesizing analytical insights with thoughtful execution, future efforts can achieve meaningful advancement and lasting impact.`;
  }

  return `### Detailed Breakdown: ${topic}\n\n1. **Overview**: Strategic approaches for ${topic}.\n2. **Execution Protocol**: Practical recommendations and actionable steps.\n3. **Quality Optimization**: Key metrics to measure and iterate upon.`;
}

// Tool Generation Endpoint
app.post('/api/generate', async (req, res) => {
  const { systemPrompt, userPrompt } = req.body;

  const userPromptError = validateText(userPrompt, 'User prompt', 12000);
  const systemPromptError = systemPrompt === undefined || systemPrompt === null ? null : validateText(systemPrompt, 'System prompt', 16000);
  if (userPromptError || systemPromptError) {
    return res.status(400).json({ error: userPromptError || systemPromptError });
  }

  const apiKey = getActiveApiKey();
  const provider = detectProvider(apiKey);

  if (provider === 'none') {
    const mock = generateMockResponse(systemPrompt || '', userPrompt);
    return res.json({ result: mock, reply: mock, mock: true });
  }

  try {
    if (provider === 'gemini') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) return res.json({ result: text, reply: text });
      }
    }

    if (provider === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
            { role: 'user', content: userPrompt }
          ]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        if (text) return res.json({ result: text, reply: text });
      }
    }

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt || 'You are a helpful AI productivity assistant.' },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        if (text) return res.json({ result: text, reply: text });
      }
    } 

    if (provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1200,
          system: systemPrompt || 'You are a helpful AI productivity assistant.',
          messages: [{ role: 'user', content: userPrompt }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const textBlock = data.content && data.content.find(c => c.type === 'text');
        const text = textBlock ? textBlock.text : '';
        if (text) return res.json({ result: text, reply: text });
      }
    }

    return safeAIError(res);
  } catch (err) {
    return safeAIError(res, 503);
  }
});

// Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const { systemPrompt, messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }
  if (messages.length > 40 || messages.some(message => !message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string' || !message.content.trim() || message.content.length > 12000)) {
    return res.status(400).json({ error: 'Messages are invalid or too long.' });
  }
  if (systemPrompt !== undefined && systemPrompt !== null && validateText(systemPrompt, 'System prompt', 16000)) {
    return res.status(400).json({ error: 'System prompt is invalid or too long.' });
  }

  const apiKey = getActiveApiKey();
  const provider = detectProvider(apiKey);
  const lastUserMsg = messages[messages.length - 1]?.content || '';

  const personaMatch = (systemPrompt || '').match(/Persona:\s*([A-Za-z\s]+)/i);
  const persona = personaMatch ? personaMatch[1].trim() : 'Concise Assistant';

  if (provider === 'none') {
    const reply = AIBrain ? AIBrain.generateChatResponse(persona, messages) : `### 💡 Smart AI Assistant\n\nRegarding **"${lastUserMsg}"**: Review your core goals and take structured action!`;
    return res.json({ reply: reply, result: reply, mock: true });
  }

  try {
    if (provider === 'gemini') {
      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
          contents
        })
      });
      if (response.ok) {
        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (replyText) return res.json({ reply: replyText, result: replyText });
      }
    }

    if (provider === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt || 'You are a helpful AI assistant.' },
            ...messages
          ]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const replyText = data.choices?.[0]?.message?.content || '';
        if (replyText) return res.json({ reply: replyText, result: replyText });
      }
    }

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt || 'You are a helpful AI assistant.' },
            ...messages
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const replyText = data.choices?.[0]?.message?.content || '';
        if (replyText) return res.json({ reply: replyText, result: replyText });
      }
    }

    if (provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          system: systemPrompt || 'You are a helpful AI assistant.',
          messages: messages
        })
      });

      if (response.ok) {
        const data = await response.json();
        const textBlock = data.content && data.content.find(c => c.type === 'text');
        const replyText = textBlock ? textBlock.text : '';
        if (replyText) return res.json({ reply: replyText, result: replyText });
      }
    }

    return safeAIError(res);
  } catch (err) {
    return safeAIError(res, 503);
  }
});

// Keep rejected CORS requests predictable and free of Express error pages.
app.use((err, req, res, next) => {
  if (err && err.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ error: 'Origin is not allowed.' });
  }
  return next(err);
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Smart AI Hub Server running at: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

// Graceful shutdown for cloud orchestrators (Render, Railway, Docker, K8s)
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: gracefully shutting down HTTP server');
  server.close(() => {
    console.log('HTTP server closed cleanly');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing server');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
