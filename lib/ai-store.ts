"use client"

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
  }
]

const STORAGE_KEY = 'slash-ai-settings'

// Get AI settings from localStorage
export const getAISettings = (): AISettings => {
  if (typeof window === 'undefined') {
    return { providers: defaultProviders, lastUpdated: new Date().toISOString() }
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const settings = JSON.parse(stored)
      // Merge with defaults to ensure all providers exist
      const mergedProviders = defaultProviders.map(defaultProvider => {
        const existingProvider = settings.providers?.find((p: AIProvider) => p.id === defaultProvider.id)
        return existingProvider ? { ...defaultProvider, ...existingProvider } : defaultProvider
      })
      
      return {
        ...settings,
        providers: mergedProviders
      }
    }
  } catch (error) {
    console.error('Error loading AI settings:', error)
  }
  
  return { providers: defaultProviders, lastUpdated: new Date().toISOString() }
}

// Save AI settings to localStorage
export const saveAISettings = (settings: AISettings): void => {
  if (typeof window === 'undefined') return
  
  try {
    const updatedSettings = {
      ...settings,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings))
  } catch (error) {
    console.error('Error saving AI settings:', error)
  }
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
    // Update provider with testing status
    updateAIProvider(provider.id, { 
      testStatus: 'untested',
      testMessage: 'Testing connection...'
    })

    const testResult = await performAITest(provider)
    
    // Update provider with test result
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
  const testPrompt = "Hello, this is a test message. Please respond with 'Test successful' if you can read this."
  
  try {
    switch (provider.id) {
      case 'openai':
        return await testOpenAI(provider.apiKey, testPrompt)
      case 'claude':
        return await testClaude(provider.apiKey, testPrompt)
      case 'deepseek':
        return await testDeepSeek(provider.apiKey, testPrompt)
      default:
        return { success: false, message: 'Unknown provider' }
    }
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Connection test failed' 
    }
  }
}

// Test OpenAI connection
const testOpenAI = async (apiKey: string, prompt: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50
    })
  })

  if (!response.ok) {
    const error = await response.json()
    return { success: false, message: `OpenAI API Error: ${error.error?.message || 'Unknown error'}` }
  }

  const data = await response.json()
  return { 
    success: true, 
    message: `Connection successful! Model: ${data.model || 'gpt-3.5-turbo'}` 
  }
}

// Test Claude connection
const testClaude = async (apiKey: string, prompt: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 50,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    const error = await response.json()
    return { success: false, message: `Claude API Error: ${error.error?.message || 'Unknown error'}` }
  }

  const data = await response.json()
  return { 
    success: true, 
    message: `Connection successful! Model: ${data.model || 'claude-3-sonnet'}` 
  }
}

// Test DeepSeek connection
const testDeepSeek = async (apiKey: string, prompt: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50
    })
  })

  if (!response.ok) {
    const error = await response.json()
    return { success: false, message: `DeepSeek API Error: ${error.error?.message || 'Unknown error'}` }
  }

  const data = await response.json()
  return { 
    success: true, 
    message: `Connection successful! Model: ${data.model || 'deepseek-chat'}` 
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
  
  // Return first active provider if no default set
  const activeProviders = getActiveProviders()
  return activeProviders.length > 0 ? activeProviders[0] : null
}
