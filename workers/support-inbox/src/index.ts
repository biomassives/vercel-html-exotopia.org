import { MESSAGE_TYPES, TEMPLATES, adminAlertSubject, adminAlertBody, type MessageType } from './emailTemplates'

export interface Env {
  RATE_LIMIT_KV: KVNamespace
  ALLOWED_ORIGIN: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  RESEND_API_KEY: string
  RESEND_FROM_EMAIL: string
  SUPPORT_REPLY_TO: string
  TURNSTILE_SECRET_KEY: string
  ADMIN_ALERT_EMAIL: string
}

interface SubmitPayload {
  name: string
  email: string
  messageType: MessageType
  subject?: string
  body: string
  turnstileToken: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60 // 1 hour

function corsHeaders(env: Env, origin: string | null): Record<string, string> {
  const allowed = env.ALLOWED_ORIGIN.split(',').map((o) => o.trim())
  const allowOrigin = origin && allowed.includes(origin) ? origin : allowed[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

function json(data: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function validatePayload(body: unknown): { ok: true; value: SubmitPayload } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'Invalid request body' }
  const b = body as Record<string, unknown>

  const name = typeof b.name === 'string' ? b.name.trim() : ''
  const email = typeof b.email === 'string' ? b.email.trim() : ''
  const messageType = typeof b.messageType === 'string' ? (b.messageType as MessageType) : undefined
  const subject = typeof b.subject === 'string' ? b.subject.trim() : ''
  const messageBody = typeof b.body === 'string' ? b.body.trim() : ''
  const turnstileToken = typeof b.turnstileToken === 'string' ? b.turnstileToken : ''

  if (name.length < 1 || name.length > 200) return { ok: false, error: 'Name is required (max 200 chars)' }
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'A valid email is required' }
  if (!messageType || !MESSAGE_TYPES.includes(messageType)) return { ok: false, error: 'Invalid message type' }
  if (subject.length > 200) return { ok: false, error: 'Subject too long' }
  if (messageBody.length < 1 || messageBody.length > 5000) return { ok: false, error: 'Message is required (max 5000 chars)' }
  if (!turnstileToken) return { ok: false, error: 'Missing verification token' }

  return {
    ok: true,
    value: { name, email, messageType, subject: subject || undefined, body: messageBody, turnstileToken },
  }
}

async function verifyTurnstile(token: string, ip: string, secret: string): Promise<boolean> {
  const form = new FormData()
  form.append('secret', secret)
  form.append('response', token)
  form.append('remoteip', ip)
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  })
  if (!res.ok) return false
  const result = (await res.json()) as { success: boolean }
  return result.success === true
}

async function checkRateLimit(env: Env, ipHash: string): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10)
  const key = `rl:${ipHash}:${day}`
  const current = await env.RATE_LIMIT_KV.get(key)
  const count = current ? parseInt(current, 10) : 0
  if (count >= RATE_LIMIT_MAX) return false
  await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: RATE_LIMIT_WINDOW_SECONDS })
  return true
}

async function insertMessage(
  env: Env,
  payload: SubmitPayload,
  ipHash: string,
  userAgent: string,
): Promise<{ ok: boolean }> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/support_messages`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      message_type: payload.messageType,
      name: payload.name,
      email: payload.email,
      subject: payload.subject ?? null,
      body: payload.body,
      ip_hash: ipHash,
      user_agent: userAgent,
    }),
  })
  return { ok: res.ok }
}

async function sendEmail(
  env: Env,
  to: string,
  subject: string,
  text: string,
  replyTo?: string,
): Promise<void> {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: [to],
      subject,
      text,
      reply_to: replyTo,
    }),
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')
    const headers = corsHeaders(env, origin)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers })
    }

    const allowedOrigins = env.ALLOWED_ORIGIN.split(',').map((o) => o.trim())
    if (!origin || !allowedOrigins.includes(origin)) {
      return json({ error: 'Origin not allowed' }, 403, headers)
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, headers)
    }

    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return json({ error: 'Invalid JSON' }, 400, headers)
    }

    const validated = validatePayload(rawBody)
    if (!validated.ok) {
      return json({ error: validated.error }, 400, headers)
    }
    const payload = validated.value

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
    const ipHash = await sha256Hex(ip)

    const turnstileOk = await verifyTurnstile(payload.turnstileToken, ip, env.TURNSTILE_SECRET_KEY)
    if (!turnstileOk) {
      return json({ error: 'Verification failed' }, 400, headers)
    }

    const withinLimit = await checkRateLimit(env, ipHash)
    if (!withinLimit) {
      return json({ error: 'Too many messages — please try again later' }, 429, headers)
    }

    try {
      const inserted = await insertMessage(env, payload, ipHash, request.headers.get('User-Agent') ?? '')
      if (!inserted.ok) {
        return json({ error: 'Something went wrong — please try again' }, 500, headers)
      }

      const template = TEMPLATES[payload.messageType]
      await sendEmail(
        env,
        payload.email,
        template.autoReplySubject,
        template.autoReplyBody(payload.name),
        env.SUPPORT_REPLY_TO,
      )

      if (template.urgent) {
        await sendEmail(
          env,
          env.ADMIN_ALERT_EMAIL,
          adminAlertSubject(payload.messageType),
          adminAlertBody(payload.messageType, payload.name, payload.email, payload.subject ?? null, payload.body),
        )
      }

      return json({ ok: true }, 200, headers)
    } catch {
      return json({ error: 'Something went wrong — please try again' }, 500, headers)
    }
  },
}
