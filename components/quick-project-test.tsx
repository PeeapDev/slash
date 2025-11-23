"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Plus,
  Save,
  AlertCircle,
  CheckCircle,
  TestTube
} from "lucide-react"
import { offlineDB, ProjectMetadata } from "@/lib/offline-first-db"

export default function QuickProjectTest() {
  const [projectName, setProjectName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setMessage({ type: 'error', text: 'Project name is required' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      // Initialize offline DB first
      await offlineDB.init()

      // Create project object using proper ProjectMetadata structure
      const projectData = {
        projectId: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectName: projectName,
        projectCode: `PROJ-${Date.now()}`,
        description: 'Test project created via IndexedDB',
        principalInvestigator: 'Test PI',
        studyPeriod: {
          start: new Date().toISOString().split('T')[0],
          end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        targetSampleSize: 100,
        regions: ['western', 'eastern'],
        districts: ['freetown', 'kenema'],
        assignments: [],
        milestones: [],
        samplingQuotas: [],
        activeModules: ['households', 'participants', 'samples'],
        configurations: { sampleTypes: ['URINE', 'BLOOD'] }
      }

      // Store using the create method which handles BaseRecord fields
      await offlineDB.create<ProjectMetadata>('project_metadata', projectData)
      
      setMessage({ 
        type: 'success', 
        text: `Project "${projectName}" created successfully in IndexedDB!` 
      })
      setProjectName("")

      console.log('✅ Project saved to IndexedDB:', projectData)

    } catch (error) {
      console.error('❌ Error creating project:', error)
      setMessage({ 
        type: 'error', 
        text: `Failed to create project: ${(error as Error).message || 'Unknown error'}` 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestIndexedDB = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      // Test offline DB functionality
      await offlineDB.init()
      
      // Try to get all projects
      const projects = await offlineDB.getAll('project_metadata')
      
      setMessage({ 
        type: 'success', 
        text: `IndexedDB working! Found ${projects.length} projects.` 
      })

      console.log('📊 Current projects in IndexedDB:', projects)

    } catch (error) {
      console.error('❌ IndexedDB test failed:', error)
      setMessage({ 
        type: 'error', 
        text: `IndexedDB test failed: ${(error as Error).message || 'Unknown error'}` 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <TestTube className="w-5 h-5" />
        <h3 className="font-semibold">Quick Project Test (IndexedDB)</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="projectName">Project Name</Label>
          <Input
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter project name..."
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleCreateProject}
            disabled={isLoading || !projectName.trim()}
          >
            <Save className="w-4 h-4 mr-1" />
            {isLoading ? 'Creating...' : 'Create Project'}
          </Button>

          <Button 
            variant="outline"
            onClick={handleTestIndexedDB}
            disabled={isLoading}
          >
            <TestTube className="w-4 h-4 mr-1" />
            Test IndexedDB
          </Button>
        </div>

        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Enter a project name above</li>
            <li>Click "Create Project" to save directly to IndexedDB</li>
            <li>Check browser DevTools → Application → IndexedDB → SLASH_PWA_DB → projects</li>
            <li>Use "Test IndexedDB" to verify the database is working</li>
          </ol>
        </div>
      </div>
    </Card>
  )
}
