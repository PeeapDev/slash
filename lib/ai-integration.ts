"use client"

import { AIProvider, getDefaultProvider, getActiveProviders, getAISettings, saveAISettings, testAIProvider } from './ai-store'

export interface AIResponse {
  success: boolean
  data?: any
  error?: string
  provider?: string
}

export interface AIAnalysisRequest {
  type: 'data-validation' | 'missing-data' | 'anomaly-detection' | 'summary'
  data: any
  context?: string
}

// Main AI analysis function with auto-provider selection
export const performAIAnalysis = async (request: AIAnalysisRequest): Promise<AIResponse> => {
  const provider = await getOptimalProvider()
  
  if (!provider) {
    return {
      success: false,
      error: 'No active AI provider configured. Please set up API credentials in AI Settings.'
    }
  }

  try {
    switch (provider.id) {
      case 'openai':
        return await analyzeWithOpenAI(provider, request)
      case 'claude':
        return await analyzeWithClaude(provider, request)
      case 'deepseek':
        return await analyzeWithDeepSeek(provider, request)
      default:
        return {
          success: false,
          error: `Unknown AI provider: ${provider.id}`
        }
    }
  } catch (error) {
    // If primary provider fails, try fallback
    const fallbackProvider = await getOptimalProvider(provider.id)
    if (fallbackProvider && fallbackProvider.id !== provider.id) {
      console.log(`Primary provider ${provider.id} failed, trying fallback ${fallbackProvider.id}`)
      return performAIAnalysis(request) // Recursive call with new optimal provider
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI analysis failed',
      provider: provider.id
    }
  }
}

// Get the optimal AI provider based on availability and success rate
export const getOptimalProvider = async (excludeProvider?: string): Promise<AIProvider | null> => {
  const activeProviders = getActiveProviders().filter(p => p.id !== excludeProvider)
  
  if (activeProviders.length === 0) {
    return null
  }

  // Priority order: successful providers first, then untested, then failed
  const priorityOrder = ['success', 'untested', 'failed']
  
  for (const status of priorityOrder) {
    const providersWithStatus = activeProviders.filter(p => p.testStatus === status)
    
    if (providersWithStatus.length > 0) {
      // Return the first provider with this status
      // In the future, this could be enhanced with load balancing or response time metrics
      return providersWithStatus[0]
    }
  }

  // Fallback to any active provider
  return activeProviders[0] || null
}

// Enhanced provider testing with automatic selection
export const testAndSelectOptimalProvider = async (): Promise<AIProvider | null> => {
  const activeProviders = getActiveProviders()
  
  if (activeProviders.length === 0) {
    return null
  }

  // Test all providers and update their status
  const testResults = await Promise.allSettled(
    activeProviders.map(async (provider) => {
      try {
        const result = await testAIProvider(provider)
        return { provider, success: result.success }
      } catch (error) {
        return { provider, success: false }
      }
    })
  )

  // Find the best working provider
  const workingProviders = testResults
    .filter((result): result is PromiseFulfilledResult<{provider: AIProvider, success: boolean}> => 
      result.status === 'fulfilled' && result.value.success
    )
    .map(result => result.value.provider)

  if (workingProviders.length > 0) {
    // Set the first working provider as default
    const optimalProvider = workingProviders[0]
    const settings = getAISettings()
    
    // Update default provider
    const updatedProviders = settings.providers.map(p => ({
      ...p,
      isDefault: p.id === optimalProvider.id
    }))
    
    saveAISettings({ ...settings, providers: updatedProviders })
    return optimalProvider
  }

  return null
}

// OpenAI Analysis
const analyzeWithOpenAI = async (provider: AIProvider, request: AIAnalysisRequest): Promise<AIResponse> => {
  const prompt = buildPrompt(request)
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a data analyst specializing in health research data validation and analysis. Provide clear, actionable insights.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI API Error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  return {
    success: true,
    data: data.choices[0]?.message?.content || 'No response',
    provider: 'openai'
  }
}

// Claude Analysis
const analyzeWithClaude = async (provider: AIProvider, request: AIAnalysisRequest): Promise<AIResponse> => {
  const prompt = buildPrompt(request)
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Claude API Error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  return {
    success: true,
    data: data.content[0]?.text || 'No response',
    provider: 'claude'
  }
}

// DeepSeek Analysis
const analyzeWithDeepSeek = async (provider: AIProvider, request: AIAnalysisRequest): Promise<AIResponse> => {
  const prompt = buildPrompt(request)
  
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a data analyst specializing in health research data validation and analysis. Provide clear, actionable insights.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`DeepSeek API Error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  return {
    success: true,
    data: data.choices[0]?.message?.content || 'No response',
    provider: 'deepseek'
  }
}

// Build analysis prompt based on request type
const buildPrompt = (request: AIAnalysisRequest): string => {
  const baseContext = request.context || 'Health research data analysis'
  
  switch (request.type) {
    case 'data-validation':
      return `
        Analyze the following health research data for validation issues:
        
        Context: ${baseContext}
        Data: ${JSON.stringify(request.data, null, 2)}
        
        Please identify:
        1. Missing or incomplete data points
        2. Data format inconsistencies
        3. Potential data entry errors
        4. Outliers or anomalous values
        5. Recommendations for data quality improvement
        
        Provide a structured response with specific findings and actionable recommendations.
      `
    
    case 'missing-data':
      return `
        Analyze the following dataset for missing data patterns:
        
        Context: ${baseContext}
        Data: ${JSON.stringify(request.data, null, 2)}
        
        Please identify:
        1. Fields with missing data
        2. Patterns in missing data (systematic vs random)
        3. Impact assessment of missing data
        4. Recommendations for handling missing data
        
        Provide specific counts and percentages where possible.
      `
    
    case 'anomaly-detection':
      return `
        Detect anomalies and outliers in the following health research data:
        
        Context: ${baseContext}
        Data: ${JSON.stringify(request.data, null, 2)}
        
        Please identify:
        1. Statistical outliers
        2. Unusual patterns or trends
        3. Data points that require investigation
        4. Potential causes of anomalies
        5. Recommendations for follow-up
        
        Focus on data quality and research integrity issues.
      `
    
    case 'summary':
      return `
        Provide a comprehensive summary and analysis of the following health research data:
        
        Context: ${baseContext}
        Data: ${JSON.stringify(request.data, null, 2)}
        
        Please provide:
        1. Overall data quality assessment
        2. Key findings and insights
        3. Data completeness statistics
        4. Notable patterns or trends
        5. Recommendations for data management
        
        Structure the response for a research team audience.
      `
    
    default:
      return `
        Analyze the following data:
        
        Context: ${baseContext}
        Data: ${JSON.stringify(request.data, null, 2)}
        
        Provide insights and recommendations for this health research dataset.
      `
  }
}

// Validate data quality using AI
export const validateDataQuality = async (data: any, context?: string): Promise<AIResponse> => {
  return performAIAnalysis({
    type: 'data-validation',
    data,
    context
  })
}

// Detect missing data patterns
export const detectMissingData = async (data: any, context?: string): Promise<AIResponse> => {
  return performAIAnalysis({
    type: 'missing-data',
    data,
    context
  })
}

// Detect anomalies in data
export const detectAnomalies = async (data: any, context?: string): Promise<AIResponse> => {
  return performAIAnalysis({
    type: 'anomaly-detection',
    data,
    context
  })
}

// Generate data summary
export const generateDataSummary = async (data: any, context?: string): Promise<AIResponse> => {
  return performAIAnalysis({
    type: 'summary',
    data,
    context
  })
}

// Get AI providers status
export const getAIStatus = () => {
  const activeProviders = getActiveProviders()
  const defaultProvider = getDefaultProvider()
  
  return {
    hasActiveProviders: activeProviders.length > 0,
    activeCount: activeProviders.length,
    defaultProvider: defaultProvider?.name || 'None',
    providers: activeProviders.map(p => ({
      id: p.id,
      name: p.name,
      status: p.testStatus,
      isDefault: p.id === defaultProvider?.id
    }))
  }
}
