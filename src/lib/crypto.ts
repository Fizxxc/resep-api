import { createHash, randomBytes } from 'crypto'

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const prefix = randomBytes(4).toString('hex')
  const secret = randomBytes(24).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)
  const key    = `kograph_${prefix}_${secret}`
  return { key, prefix: `kograph_${prefix}`, hash: hashApiKey(key) }
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString('base64url')}`
}

export function signWebhookPayload(payload: string, secret: string): string {
  return createHash('sha256').update(`${payload}${secret}`).digest('hex')
}
