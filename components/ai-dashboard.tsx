"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Bot, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3, 
  PieChart, 
  Activity,
  Users,
  Zap,
  Brain,
  Target,
  Lightbulb
} from "lucide-react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Cell, LineChart, Line, AreaChart, Area, Pie } from 'recharts'
import { getAIStatus, performAIAnalysis, generateDataSummary } from "@/lib/ai-integration"
import { getHouseholdData, getSampleCollectionData } from "@/lib/data-store"

export default function AIDashboard() {
  const [aiStatus, setAiStatus] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [dataQuality, setDataQuality] = useState<any>(null)
  const [anomalies, setAnomalies] = useState<any>(null)
  const [riskAssessment, setRiskAssessment] = useState<any>(null)
  const [insights, setInsights] = useState<any>(null)
  const [autoAnalysisEnabled, setAutoAnalysisEnabled] = useState(true)

  useEffect(() => {
    const initializeAI = async () => {
      const status = getAIStatus()
      setAiStatus(status)
      
      // Auto-run analysis on component mount if AI is available
      if (status?.hasActiveProviders && autoAnalysisEnabled) {
        try {
          await runComprehensiveAnalysis()
        } catch (error) {
          console.log('AI analysis initialization failed:', error)
        }
      }
    }
    
    initializeAI()
  }, [])

  const runComprehensiveAnalysis = async () => {
    if (!aiStatus?.hasActiveProviders) {
      return
    }

    setIsAnalyzing(true)
    try {
      // Gather all data
      const households = getHouseholdData()
      const samples = getSampleCollectionData()
      
      const allData = {
        households,
        samples,
        totalRecords: households.length + samples.length
      }

      // Run different types of analysis
      const [qualityResult, anomalyResult, summaryResult] = await Promise.all([
        performAIAnalysis({
          type: 'data-validation',
          data: allData,
          context: 'Comprehensive data quality assessment across all modules'
        }),
        performAIAnalysis({
          type: 'anomaly-detection', 
          data: allData,
          context: 'Health research anomaly detection across households, samples, and surveys'
        }),
        generateDataSummary(allData, 'Complete health research dataset analysis')
      ])

      setDataQuality(qualityResult)
      setAnomalies(anomalyResult)
      setInsights(summaryResult)
      
      // Generate risk assessment based on the data
      const riskData = generateRiskAssessment(allData)
      setRiskAssessment(riskData)

    } catch (error) {
      console.error('Comprehensive analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateRiskAssessment = (data: any) => {
    // Generate mock risk assessment data based on actual data
    const totalParticipants = data.households.length + data.samples.length
    
    return {
      highRisk: Math.floor(totalParticipants * 0.15),
      mediumRisk: Math.floor(totalParticipants * 0.25), 
      lowRisk: Math.floor(totalParticipants * 0.60),
      categories: [
        { name: 'High Risk', value: Math.floor(totalParticipants * 0.15), color: '#ef4444' },
        { name: 'Medium Risk', value: Math.floor(totalParticipants * 0.25), color: '#f59e0b' },
        { name: 'Low Risk', value: Math.floor(totalParticipants * 0.60), color: '#10b981' }
      ]
    }
  }

  // Mock data for charts when AI is not available
  const mockDataQualityChart = [
    { name: 'Complete', value: 85, color: '#10b981' },
    { name: 'Partial', value: 12, color: '#f59e0b' },
    { name: 'Missing', value: 3, color: '#ef4444' }
  ]

  const mockAnomalyTrend = [
    { month: 'Jan', anomalies: 5, resolved: 4 },
    { month: 'Feb', anomalies: 8, resolved: 7 },
    { month: 'Mar', anomalies: 3, resolved: 3 },
    { month: 'Apr', anomalies: 12, resolved: 10 },
    { month: 'May', anomalies: 7, resolved: 6 },
    { month: 'Jun', anomalies: 4, resolved: 4 }
  ]

  const mockRegionalData = [
    { region: 'North', quality: 92, anomalies: 2, risk: 15 },
    { region: 'South', quality: 88, anomalies: 5, risk: 22 },
    { region: 'East', quality: 95, anomalies: 1, risk: 8 },
    { region: 'West', quality: 87, anomalies: 7, risk: 28 },
    { region: 'Central', quality: 91, anomalies: 3, risk: 18 }
  ]

  if (!aiStatus?.hasActiveProviders) {
    return (
      <div className="space-y-6">
        <div>
          <div className="text-sm text-muted-foreground">Admin / AI Dashboard</div>
          <h1 className="text-2xl font-bold mt-1 flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-600" />
            AI-Powered Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive AI analysis of your health research data
          </p>
        </div>

        <Card className="p-8 text-center">
          <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI Dashboard Not Available</h3>
          <p className="text-muted-foreground mb-4">
            Configure AI providers in Configuration → AI Integration to unlock AI-powered analytics
          </p>
          <Button onClick={() => window.location.hash = '#config'} variant="outline">
            Configure AI Providers
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-muted-foreground">Admin / AI Dashboard</div>
        <h1 className="text-2xl font-bold mt-1 flex items-center gap-2">
          <Brain className="w-6 h-6 text-blue-600" />
          AI-Powered Analytics Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Comprehensive AI analysis of your health research data
        </p>
      </div>

      {/* AI Status & Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium">AI Analysis Active</span>
            </div>
            <Badge variant="secondary">
              Provider: {aiStatus.defaultProvider}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={runComprehensiveAnalysis} 
              disabled={isAnalyzing}
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              {isAnalyzing ? 'Analyzing...' : 'Generate Insights'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Target className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <div className="text-sm font-medium">Data Quality</div>
            <div className="text-xs text-muted-foreground">Auto-validates surveys</div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <Activity className="w-6 h-6 text-orange-600 mx-auto mb-1" />
            <div className="text-sm font-medium">Anomaly Detection</div>
            <div className="text-xs text-muted-foreground">Flags abnormal values</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-1" />
            <div className="text-sm font-medium">Risk Assessment</div>
            <div className="text-xs text-muted-foreground">Prioritizes participants</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <Lightbulb className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <div className="text-sm font-medium">Insights</div>
            <div className="text-xs text-muted-foreground">AI recommendations</div>
          </div>
        </div>
      </Card>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Quality Overview */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Data Quality Analysis
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={mockDataQualityChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                >
                  {mockDataQualityChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {dataQuality?.success && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">AI Quality Assessment:</h4>
              <p className="text-xs text-muted-foreground">
                {dataQuality.data.substring(0, 200)}...
              </p>
            </div>
          )}
        </Card>

        {/* Risk Assessment */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-red-600" />
            Participant Risk Distribution
          </h3>
          
          {riskAssessment && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{riskAssessment.highRisk}</div>
                  <div className="text-xs text-muted-foreground">High Risk</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{riskAssessment.mediumRisk}</div>
                  <div className="text-xs text-muted-foreground">Medium Risk</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{riskAssessment.lowRisk}</div>
                  <div className="text-xs text-muted-foreground">Low Risk</div>
                </div>
              </div>

              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={riskAssessment.categories}
                      cx="50%"
                      cy="50%"
                      outerRadius={50}
                      dataKey="value"
                    >
                      {riskAssessment.categories.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </Card>

        {/* Anomaly Detection Trends */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-600" />
            Anomaly Detection Trends
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockAnomalyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="anomalies" 
                  stackId="1"
                  stroke="#f59e0b" 
                  fill="#fbbf24" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="resolved" 
                  stackId="2"
                  stroke="#10b981" 
                  fill="#34d399" 
                  fillOpacity={0.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {anomalies?.success && (
            <div className="mt-4 p-3 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">AI Anomaly Analysis:</h4>
              <p className="text-xs text-muted-foreground">
                {anomalies.data.substring(0, 200)}...
              </p>
            </div>
          )}
        </Card>

        {/* Regional Performance */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Regional Performance Metrics
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockRegionalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quality" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* AI Insights Panel */}
      {insights?.success && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-green-600" />
            AI-Generated Insights & Recommendations
          </h3>
          
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
            <div className="flex items-start gap-3">
              <Bot className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium mb-3">AI Analysis Summary:</h4>
                <div className="prose prose-sm text-muted-foreground">
                  <pre className="whitespace-pre-wrap font-sans">
                    {insights.data}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" size="sm">
            Export Analysis Report
          </Button>
          <Button variant="outline" size="sm">
            Schedule Automated Analysis  
          </Button>
          <Button variant="outline" size="sm">
            Configure Alert Thresholds
          </Button>
          <Button variant="outline" size="sm">
            View Detailed Recommendations
          </Button>
        </div>
      </Card>
    </div>
  )
}
