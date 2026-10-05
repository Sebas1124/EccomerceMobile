import { p256 } from '@noble/curves/nist.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import * as Crypto from 'expo-crypto'
import { secureSession } from './secure-session'

/**
 * Clave P-256 del dispositivo para pruebas DPoP (compatible con Expo Go, sin módulos nativos extra).
 * La clave privada se guarda solo en SecureStore; el backend conoce la pública al registrar el dispositivo.
 */

let cachedSecret: Uint8Array | null = null

async function getSecretKey(): Promise<Uint8Array> {
  if (cachedSecret) return cachedSecret
  const stored = await secureSession.getDeviceKey()
  if (stored) return (cachedSecret = hexToBytes(stored))
  const secret = p256.utils.randomSecretKey(Crypto.getRandomBytes(48))
  await secureSession.setDeviceKey(bytesToHex(secret))
  return (cachedSecret = secret)
}

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

const encodeJson = (value: unknown) => b64url(new TextEncoder().encode(JSON.stringify(value)))

export async function getPublicJwk() {
  const publicKey = p256.getPublicKey(await getSecretKey(), false) // 0x04 || X(32) || Y(32)
  return { kty: 'EC', crv: 'P-256', x: b64url(publicKey.slice(1, 33)), y: b64url(publicKey.slice(33, 65)) }
}

/** Cabecera DPoP (RFC 9449) firmada con ES256 para la petición indicada. */
export async function createDpopProof(method: string, url: string, accessToken?: string): Promise<string> {
  const header = { typ: 'dpop+jwt', alg: 'ES256', jwk: await getPublicJwk() }
  const payload: Record<string, unknown> = {
    htm: method.toUpperCase(),
    htu: url.split('?')[0],
    iat: Math.floor(Date.now() / 1000),
    jti: Crypto.randomUUID(),
  }
  if (accessToken) payload.ath = b64url(sha256(new TextEncoder().encode(accessToken)))

  const signingInput = `${encodeJson(header)}.${encodeJson(payload)}`
  // prehash por defecto: firma sha256(signingInput), formato compacto r||s como exige JWS.
  const signature = p256.sign(new TextEncoder().encode(signingInput), await getSecretKey())
  return `${signingInput}.${b64url(signature)}`
}
