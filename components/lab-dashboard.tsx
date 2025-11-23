"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2 } from "lucide-react"

export default function LabDashboard() {
  const [pendingSamples, setPendingSamples] = useState<any[]>([])
  const [completedResults, setCompletedResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSamples()
  }, [])

  const loadSamples = async () => {
    try {
      console.log('🧪 Loading samples from IndexedDB for Lab Queue...')
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      const allSamples = await offlineDB.getAll('samples')
      console.log(`✅ Loaded ${allSamples.length} samples from IndexedDB`)
      
      // Filter pending samples (collected but not analyzed)
      const pending = allSamples.filter((s: any) => 
        s.status === 'collected' || s.status === 'pending' || s.status === 'in_transit'
      ).map((s: any) => ({
        id: s.sampleCode || s.sampleId,
        participantId: s.participantId,
        type: s.sampleType,
        submittedDate: new Date(s.collectionTimestamp || s.createdAt).toLocaleDateString(),
        status: s.status
      }))
      
      // Filter completed samples
      const completed = allSamples.filter((s: any) => 
        s.status === 'analyzed' || s.status === 'completed' || s.status === 'lab_completed'
      ).map((s: any) => ({
        id: s.sampleCode || s.sampleId,
        participantId: s.participantId,
        type: s.sampleType,
        completedDate: new Date(s.updatedAt).toLocaleDateString(),
        status: s.status
      }))
      
      setPendingSamples(pending)
      setCompletedResults(completed)
      
      console.log(`📊 Lab Queue: ${pending.length} pending, ${completed.length} completed`)
    } catch (error) {
      console.error('❌ Error loading samples:', error)
      setPendingSamples([])
      setCompletedResults([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Lab Dashboard</h2>
        <p className="text-muted-foreground">Manage sample testing and analysis</p>
      </div>

      {/* Quick Search */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="Search by Sample ID or Participant ID..." />
            <Button className="bg-blue-600 hover:bg-blue-700">Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pending Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{pendingSamples.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Samples awaiting analysis</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Completed Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completedResults.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Analysis completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Samples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Samples Pending Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Sample ID</th>
                  <th className="text-left py-2 px-2">Participant ID</th>
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-left py-2 px-2">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {pendingSamples.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No pending samples. Collect samples to see them here.
                    </td>
                  </tr>
                ) : (
                  pendingSamples.map((sample) => (
                    <tr key={sample.id} className="border-b hover:bg-slate-50">
                      <td className="py-2 px-2 font-mono">{sample.id}</td>
                      <td className="py-2 px-2">{sample.participantId}</td>
                      <td className="py-2 px-2">
                        <Badge variant="outline">{sample.type}</Badge>
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">{sample.submittedDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Completed Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Completed Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Sample ID</th>
                  <th className="text-left py-2 px-2">Participant ID</th>
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-left py-2 px-2">Completed</th>
                </tr>
              </thead>
              <tbody>
                {completedResults.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No completed results yet.
                    </td>
                  </tr>
                ) : (
                  completedResults.map((result) => (
                    <tr key={result.id} className="border-b hover:bg-slate-50">
                      <td className="py-2 px-2 font-mono">{result.id}</td>
                      <td className="py-2 px-2">{result.participantId}</td>
                      <td className="py-2 px-2">
                        <Badge className="bg-green-100 text-green-800">{result.type}</Badge>
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">{result.completedDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
