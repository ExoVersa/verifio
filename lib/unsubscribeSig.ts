import { createHmac, timingSafeEqual } from 'crypto'

/** Signature HMAC (hex) pour liens de désinscription surveillance — secret serveur requis. */
export function signUnsubscribe(email: string, siret: string, secret: string): string {
  return createHmac('sha256', secret).update(`${email}|${siret}`).digest('hex')
}

export function verifyUnsubscribeSig(email: string, siret: string, sig: string, secret: string): boolean {
  try {
    const expected = signUnsubscribe(email, siret, secret)
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function unsubscribeSecret(): string | undefined {
  return process.env.CRON_SECRET || process.env.UNSUBSCRIBE_SECRET
}
