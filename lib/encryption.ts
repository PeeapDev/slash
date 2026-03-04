"use client"

// AES-256-GCM encryption via Web Crypto API
// No external libraries needed

// Fields that should be encrypted when encryption is enabled
export const SENSITIVE_FIELDS = {
  participants: ['fullName', 'phoneNumber', 'medicalHistory', 'currentMedications'],
  households: ['headOfHousehold', 'address', 'phoneNumber'],
  surveys: ['responses'],
} as const

const PBKDF2_ITERATIONS = 600_000
const SALT_BYTES = 16
const IV_BYTES = 12
const ENCRYPTION_SETTINGS_KEY = 'slash_encryption_settings'

// In-memory key — lost on page reload
let sessionKey: CryptoKey | null = null

function getSubtle(): SubtleCrypto {
  if (typeof globalThis.crypto?.subtle === 'undefined') {
    throw new Error('Web Crypto API not available')
  }
  return globalThis.crypto.subtle
}

// Derive an AES-256-GCM key from a passphrase + salt
export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const subtle = getSubtle()
  const enc = new TextEncoder()

  const keyMaterial = await subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_BYTES))
}

// Encrypt plaintext → { ciphertext, iv } (both base64)
export async function encrypt(plaintext: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const subtle = getSubtle()
  const enc = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))

  const encrypted = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  )

  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(iv),
  }
}

// Decrypt ciphertext (base64) + iv (base64) → plaintext
export async function decrypt(ciphertext: string, iv: string, key: CryptoKey): Promise<string> {
  const subtle = getSubtle()
  const dec = new TextDecoder()

  const decrypted = await subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBuffer(iv) },
    key,
    base64ToBuffer(ciphertext)
  )

  return dec.decode(decrypted)
}

// Encrypt specific fields in an object
export async function encryptObject<T extends Record<string, any>>(
  obj: T,
  fields: readonly string[],
  key: CryptoKey
): Promise<T> {
  const result = { ...obj }
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      const plaintext = typeof result[field] === 'string'
        ? result[field]
        : JSON.stringify(result[field])
      const encrypted = await encrypt(plaintext, key)
      ;(result as any)[field] = `__enc__${encrypted.iv}:${encrypted.ciphertext}`
    }
  }
  return result
}

// Decrypt specific fields in an object
export async function decryptObject<T extends Record<string, any>>(
  obj: T,
  fields: readonly string[],
  key: CryptoKey
): Promise<T> {
  const result = { ...obj }
  for (const field of fields) {
    const value = result[field]
    if (typeof value === 'string' && value.startsWith('__enc__')) {
      const raw = value.slice(7) // strip __enc__
      const colonIndex = raw.indexOf(':')
      if (colonIndex === -1) continue
      const iv = raw.slice(0, colonIndex)
      const ciphertext = raw.slice(colonIndex + 1)
      try {
        const plaintext = await decrypt(ciphertext, iv, key)
        // Try to parse JSON; if it fails, keep as string
        try {
          ;(result as any)[field] = JSON.parse(plaintext)
        } catch {
          ;(result as any)[field] = plaintext
        }
      } catch {
        // Decryption failed — leave field as-is
        console.warn(`Failed to decrypt field "${field}"`)
      }
    }
  }
  return result
}

// Initialize encryption: generate salt, store settings, save test value
export async function initializeEncryption(passphrase: string): Promise<void> {
  const salt = generateSalt()
  const key = await deriveKey(passphrase, salt)

  // Encrypt a known test value so we can verify the passphrase later
  const testValue = await encrypt('SLASH_ENCRYPTION_TEST', key)

  const settings = {
    salt: bufferToBase64(salt),
    testCiphertext: testValue.ciphertext,
    testIv: testValue.iv,
    createdAt: new Date().toISOString(),
  }

  // Store in IndexedDB via the settings store
  await storeEncryptionSettings(settings)

  // Hold key in memory
  sessionKey = key
}

// Unlock encryption: load salt, derive key, verify with test value
export async function unlockEncryption(passphrase: string): Promise<boolean> {
  const settings = await loadEncryptionSettings()
  if (!settings) {
    throw new Error('Encryption not initialized. Set up encryption first.')
  }

  const salt = base64ToBuffer(settings.salt)
  const key = await deriveKey(passphrase, new Uint8Array(salt))

  // Verify with test value
  try {
    const decrypted = await decrypt(settings.testCiphertext, settings.testIv, key)
    if (decrypted !== 'SLASH_ENCRYPTION_TEST') {
      return false
    }
  } catch {
    return false
  }

  sessionKey = key
  return true
}

// Lock encryption (clear the in-memory key)
export function lockEncryption(): void {
  sessionKey = null
}

// Get the current session key
export function getSessionKey(): CryptoKey | null {
  return sessionKey
}

// Check if encryption is unlocked this session
export function isEncryptionUnlocked(): boolean {
  return sessionKey !== null
}

// Check if encryption has been set up (settings exist in IndexedDB)
export async function isEncryptionInitialized(): Promise<boolean> {
  const settings = await loadEncryptionSettings()
  return settings !== null
}

// --- IndexedDB helpers for encryption settings ---

interface EncryptionSettings {
  salt: string
  testCiphertext: string
  testIv: string
  createdAt: string
}

async function storeEncryptionSettings(settings: EncryptionSettings): Promise<void> {
  if (typeof window === 'undefined') return
  const { indexedDBService } = await import('./indexdb-service')
  await indexedDBService.set('app_settings', {
    id: ENCRYPTION_SETTINGS_KEY,
    value: settings,
  })
}

async function loadEncryptionSettings(): Promise<EncryptionSettings | null> {
  if (typeof window === 'undefined') return null
  try {
    const { indexedDBService } = await import('./indexdb-service')
    const stored = await indexedDBService.get<{ id: string; value: EncryptionSettings }>(
      'app_settings',
      ENCRYPTION_SETTINGS_KEY
    )
    return stored?.value ?? null
  } catch {
    return null
  }
}

// --- Base64 helpers ---

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
