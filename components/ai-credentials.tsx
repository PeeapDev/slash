"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Eye, 
  EyeOff, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock,
  Key,
  Settings,
  Loader2,
  AlertCircle
} from "lucide-react"
import { 
  AIProvider, 
  getAISettings, 
  updateAIProvider, 
  testAIProvider,
  saveAISettings 
} from "@/lib/ai-store"

export default function AICredentials() {
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({})
  const [testing, setTesting] = useState<{ [key: string]: boolean }>({})
  const [tempKeys, setTempKeys] = useState<{ [key: string]: string }>({})
  const [defaultProvider, setDefaultProvider] = useState<string>('')

  useEffect(() => {
    const settings = getAISettings()
    setProviders(settings.providers)
    setDefaultProvider(settings.defaultProvider || '')
    
    // Initialize temp keys with existing keys
    const keys: { [key: string]: string } = {}
    settings.providers.forEach(provider => {
      keys[provider.id] = provider.apiKey
    })
    setTempKeys(keys)
  }, [])

  const toggleKeyVisibility = (providerId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }))
  }

  const handleKeyChange = (providerId: string, key: string) => {
    setTempKeys(prev => ({
      ...prev,
      [providerId]: key
    }))
  }

  const saveKey = (providerId: string) => {
    const newKey = tempKeys[providerId] || ''
    const updatedProvider = updateAIProvider(providerId, { 
      apiKey: newKey,
      testStatus: 'untested',
      testMessage: undefined,
      lastTested: undefined
    })
    
    setProviders(updatedProvider.providers)
  }

  const handleTest = async (provider: AIProvider) => {
    setTesting(prev => ({ ...prev, [provider.id]: true }))
    
    try {
      const result = await testAIProvider(provider)
      
      // Refresh providers to get updated test status
      const settings = getAISettings()
      setProviders(settings.providers)
      
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      setTesting(prev => ({ ...prev, [provider.id]: false }))
    }
  }

  const toggleProviderActive = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId)
    if (!provider) return

    if (!provider.apiKey) {
      alert('Please add an API key before activating this provider')
      return
    }

    const updatedProvider = updateAIProvider(providerId, { 
      isActive: !provider.isActive 
    })
    setProviders(updatedProvider.providers)
  }

  const handleSetDefault = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId)
    if (!provider?.isActive || !provider.apiKey) {
      alert('Provider must be active and have a valid API key to be set as default')
      return
    }

    const settings = getAISettings()
    const updatedSettings = { ...settings, defaultProvider: providerId }
    saveAISettings(updatedSettings)
    setDefaultProvider(providerId)
  }

  const maskApiKey = (key: string) => {
    if (!key) return 'Not configured'
    if (key.length <= 8) return '*'.repeat(key.length)
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4)
  }

  const getStatusIcon = (provider: AIProvider) => {
    switch (provider.testStatus) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (provider: AIProvider) => {
    if (testing[provider.id]) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Testing...
        </Badge>
      )
    }

    switch (provider.testStatus) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Untested</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-muted-foreground">Settings / AI Integration</div>
        <h1 className="text-2xl font-bold mt-1">AI Provider Credentials</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure API keys for AI providers. Keys are stored locally and used for data analysis and processing.
        </p>
      </div>

      {/* Provider Configuration Cards */}
      <div className="space-y-4">
        {providers.map((provider) => (
          <Card key={provider.id} className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Key className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{provider.name}</h3>
                    <p className="text-sm text-muted-foreground">{provider.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(provider)}
                  {provider.isActive && (
                    <Badge variant="secondary">Active</Badge>
                  )}
                  {defaultProvider === provider.id && (
                    <Badge className="bg-blue-100 text-blue-800">Default</Badge>
                  )}
                </div>
              </div>

              {/* API Key Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showKeys[provider.id] ? "text" : "password"}
                      value={tempKeys[provider.id] || ''}
                      onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                      placeholder="Enter your API key..."
                      className="pr-10"
                    />
                    <button
                      onClick={() => toggleKeyVisibility(provider.id)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKeys[provider.id] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <Button 
                    onClick={() => saveKey(provider.id)}
                    disabled={tempKeys[provider.id] === provider.apiKey}
                    variant="outline"
                  >
                    Save
                  </Button>
                </div>
                
                {provider.apiKey && !showKeys[provider.id] && (
                  <p className="text-xs text-muted-foreground">
                    Current key: {maskApiKey(provider.apiKey)}
                  </p>
                )}
              </div>

              {/* Test Status */}
              {provider.testMessage && (
                <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                  {getStatusIcon(provider)}
                  <div className="flex-1">
                    <p className="text-sm">{provider.testMessage}</p>
                    {provider.lastTested && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last tested: {new Date(provider.lastTested).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  onClick={() => handleTest(provider)}
                  disabled={!provider.apiKey || testing[provider.id]}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {testing[provider.id] ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4" />
                  )}
                  Test Connection
                </Button>

                <Button
                  onClick={() => toggleProviderActive(provider.id)}
                  disabled={!provider.apiKey}
                  variant={provider.isActive ? "destructive" : "default"}
                  size="sm"
                >
                  {provider.isActive ? 'Deactivate' : 'Activate'}
                </Button>

                {provider.isActive && provider.apiKey && provider.testStatus === 'success' && (
                  <Button
                    onClick={() => handleSetDefault(provider.id)}
                    disabled={defaultProvider === provider.id}
                    variant="outline"
                    size="sm"
                  >
                    {defaultProvider === provider.id ? 'Default Provider' : 'Set as Default'}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Help Section */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Getting API Keys</h3>
            <div className="text-sm text-blue-800 mt-2 space-y-2">
              <p><strong>OpenAI:</strong> Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" className="underline">platform.openai.com/api-keys</a></p>
              <p><strong>Claude (Anthropic):</strong> Get your API key from <a href="https://console.anthropic.com/" target="_blank" className="underline">console.anthropic.com</a></p>
              <p><strong>DeepSeek:</strong> Get your API key from <a href="https://platform.deepseek.com/" target="_blank" className="underline">platform.deepseek.com</a></p>
            </div>
            <p className="text-xs text-blue-700 mt-3">
              <strong>Note:</strong> API keys are stored locally in your browser and are used to communicate with AI services for data analysis and processing.
            </p>
          </div>
        </div>
      </Card>

      {/* Active Providers Summary */}
      {providers.some(p => p.isActive) && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Active AI Providers</h3>
          <div className="space-y-2">
            {providers
              .filter(p => p.isActive)
              .map(provider => (
                <div key={provider.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(provider)}
                      <span className="font-medium">{provider.name}</span>
                      {defaultProvider === provider.id && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">Default</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {provider.testStatus === 'success' ? 'Ready' : 'Connection issue'}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  )
}
