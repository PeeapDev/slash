"use client"

import { indexedDBService } from './indexdb-service'

export interface AIProvider {
  id: string
  name: string
  description: string
  apiKey: string
  isActive: boolean
  lastTested?: string
  testStatus?: 'success' | 'failed' | 'untested'
  testMessage?: string
}

export interface AISettings {
  id?: string
  providers: AIProvider[]
  defaultProvider?: string
  lastUpdated: string
}

// Default AI providers
const defaultProviders: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models for text analysis and processing',
    apiKey: '',
    isActive: false,
    testStatus: 'untested'
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    description: 'Advanced AI for complex analysis and reasoning',
    apiKey: '',
    isActive: false,
    testStatus: 'untested'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'High-performance AI for research and analysis',
    apiKey: '',
    isActive: false,
    testStatus: 'untested'
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast inference via Groq (OpenAI-compatible API)',
    apiKey: '',
    isActive: false,
    testStatus: 'untested'
  }
]

// IDB store key for AI settings

// ─── Write-behind cache ───
let _aiSettingsCache: AISettings | null = null

// Hydrate from IDB on module load
if (typeof window !== 'undefined') {
  (async () => {
    try {
      const stored = await indexedDBService.get<AISettings>('ai_settings', 'main')
      if (stored && !_aiSettingsCache) {
        _aiSettingsCache = stored
      }
    } catch { /* ignore */ }
  })()
}

function persistAISettingsToIDB(settings: AISettings) {
  indexedDBService.set('ai_settings', { ...settings, id: 'main' }).catch(e =>
    console.warn('IDB ai_settings persist failed:', e)
  )
}

// Get AI settings
export const getAISettings = (): AISettings => {
  if (typeof window === 'undefined') {
    return { providers: defaultProviders, lastUpdated: new Date().toISOString() }
  }

  if (_aiSettingsCache) {
    // Merge with defaults to ensure all providers exist
    const mergedProviders = defaultProviders.map(defaultProvider => {
      const existingProvider = _aiSettingsCache!.providers?.find((p: AIProvider) => p.id === defaultProvider.id)
      return existingProvider ? { ...defaultProvider, ...existingProvider } : defaultProvider
    })
    return { ..._aiSettingsCache, providers: mergedProviders }
  }

  // No fallback — IDB is the only source of truth

  _aiSettingsCache = { providers: defaultProviders, lastUpdated: new Date().toISOString() }
  return _aiSettingsCache
}

// Save AI settings
export const saveAISettings = (settings: AISettings): void => {
  if (typeof window === 'undefined') return

  const updatedSettings = {
    ...settings,
    lastUpdated: new Date().toISOString()
  }
  _aiSettingsCache = updatedSettings
  persistAISettingsToIDB(updatedSettings)
}

// Update a specific provider
export const updateAIProvider = (providerId: string, updates: Partial<AIProvider>): AISettings => {
  const settings = getAISettings()
  const updatedProviders = settings.providers.map(provider =>
    provider.id === providerId ? { ...provider, ...updates } : provider
  )

  const updatedSettings = { ...settings, providers: updatedProviders }
  saveAISettings(updatedSettings)
  return updatedSettings
}

// Test AI provider connection
export const testAIProvider = async (provider: AIProvider): Promise<{ success: boolean; message: string }> => {
  if (!provider.apiKey) {
    return { success: false, message: 'API key is required' }
  }

  try {
    updateAIProvider(provider.id, {
      testStatus: 'untested',
      testMessage: 'Testing connection...'
    })

    const testResult = await performAITest(provider)

    updateAIProvider(provider.id, {
      testStatus: testResult.success ? 'success' : 'failed',
      testMessage: testResult.message,
      lastTested: new Date().toISOString()
    })

    return testResult
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    updateAIProvider(provider.id, {
      testStatus: 'failed',
      testMessage: errorMessage,
      lastTested: new Date().toISOString()
    })

    return { success: false, message: errorMessage }
  }
}

// Perform actual AI provider test
const performAITest = async (provider: AIProvider): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('/api/ai/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        providerId: provider.id,
        apiKey: provider.apiKey
      })
    })

    const data = await response.json().catch(() => null)

    if (!response.ok || !data?.success) {
      return {
        success: false,
        message: data?.error || 'Connection test failed'
      }
    }

    return {
      success: true,
      message: `Connection successful! Provider: ${provider.name}`
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection test failed'
    }
  }
}

// Get active AI providers
export const getActiveProviders = (): AIProvider[] => {
  const settings = getAISettings()
  return settings.providers.filter(provider => provider.isActive && provider.apiKey)
}

// Get default provider
export const getDefaultProvider = (): AIProvider | null => {
  const settings = getAISettings()
  const defaultId = settings.defaultProvider

  if (defaultId) {
    const provider = settings.providers.find(p => p.id === defaultId)
    if (provider && provider.isActive && provider.apiKey) {
      return provider
    }
  }

  const activeProviders = getActiveProviders()
  return activeProviders.length > 0 ? activeProviders[0] : null
}
