"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Clock, Eye } from "lucide-react"

interface LabResult {
  id: string
  sampleId: string
  participantId: string
  sampleType: string
  resultData: any
  status: 'draft' | 'completed' | 'needs_review' | 'reviewed' | 'flagged'
  reviewStatus?: 'pending' | 'approved' | 'rejected'
  reviewNotes?: string
  reviewedBy?: string
  reviewedAt?: string
  flaggedReason?: string
  technician: string
  enteredAt: string
}

export default function LabReviewAnalytics() {
  const [needsReview, setNeedsReview] = useState<LabResult[]>([])
  const [flaggedResults, setFlaggedResults] = useState<LabResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedResult, setSelectedResult] = useState<LabResult | null>(null)

  useEffect(() => {
    loadReviewItems()
  }, [])

  const loadReviewItems = async () => {
    try {
      console.log('🔍 Loading items needing review from IndexedDB...')
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      // Load all lab results
      const allResults = await offlineDB.getAll('lab_results')
      console.log(`✅ Loaded ${allResults.length} lab results`)
      
      // Filter results needing review
      const needsReviewFiltered = allResults.filter((r: any) => 
        r.status === 'needs_review' || r.reviewStatus === 'pending'
      ).map((r: any) => ({
        id: r.id,
        sampleId: r.sampleId,
        participantId: r.participantId,
        sampleType: r.sampleType || 'Unknown',
        resultData: r.resultData || r.results,
        status: r.status,
        reviewStatus: r.reviewStatus,
        reviewNotes: r.reviewNotes,
        reviewedBy: r.reviewedBy,
        reviewedAt: r.reviewedAt,
        flaggedReason: r.flaggedReason,
        technician: r.technicianId || r.collectorId,
        enteredAt: r.createdAt
      }))
      
      // Filter flagged results
      const flaggedFiltered = allResults.filter((r: any) => 
        r.status === 'flagged'
      ).map((r: any) => ({
        id: r.id,
        sampleId: r.sampleId,
        participantId: r.participantId,
        sampleType: r.sampleType || 'Unknown',
        resultData: r.resultData || r.results,
        status: r.status,
        reviewStatus: r.reviewStatus,
        reviewNotes: r.reviewNotes,
        flaggedReason: r.flaggedReason,
        technician: r.technicianId || r.collectorId,
        enteredAt: r.createdAt
      }))
      
      setNeedsReview(needsReviewFiltered)
      setFlaggedResults(flaggedFiltered)
      
      console.log(`📊 Review Analytics: ${needsReviewFiltered.length} pending, ${flaggedFiltered.length} flagged`)
    } catch (error) {
      console.error('❌ Error loading review items:', error)
      setNeedsReview([])
      setFlaggedResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleReview = (result: LabResult) => {
    setSelectedResult(result)
  }

  const handleApprove = async (resultId: string) => {
    try {
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      const result = await offlineDB.get('lab_results', resultId)
      if (result) {
        await offlineDB.update('lab_results', resultId, {
          ...result,
          reviewStatus: 'approved',
          status: 'reviewed',
          reviewedBy: 'current_user',
          reviewedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        
        console.log(`✅ Approved lab result: ${resultId}`)
        loadReviewItems() // Refresh
        setSelectedResult(null)
      }
    } catch (error) {
      console.error('❌ Error approving result:', error)
    }
  }

  const handleReject = async (resultId: string, notes: string) => {
    try {
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      const result = await offlineDB.get('lab_results', resultId)
      if (result) {
        await offlineDB.update('lab_results', resultId, {
          ...result,
          reviewStatus: 'rejected',
          status: 'needs_review',
          reviewNotes: notes,
          reviewedBy: 'current_user',
          reviewedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        
        console.log(`⚠️ Rejected lab result: ${resultId}`)
        loadReviewItems() // Refresh
        setSelectedResult(null)
      }
    } catch (error) {
      console.error('❌ Error rejecting result:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">Loading review queue...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Lab Review & Quality Control</h2>
        <p className="text-muted-foreground">Review lab results marked for review or flagged for quality issues</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{needsReview.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Results awaiting review</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Flagged Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{flaggedResults.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Flagged for quality issues</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Review Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">95%</div>
            <p className="text-sm text-muted-foreground mt-1">Results reviewed on time</p>
          </CardContent>
        </Card>
      </div>

      {/* Results Needing Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Results Needing Review ({needsReview.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {needsReview.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No results pending review. All caught up! 🎉
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Sample ID</th>
                    <th className="text-left py-2 px-2">Participant</th>
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-left py-2 px-2">Technician</th>
                    <th className="text-left py-2 px-2">Entered</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {needsReview.map((result) => (
                    <tr key={result.id} className="border-b hover:bg-slate-50">
                      <td className="py-2 px-2 font-mono text-xs">{result.sampleId}</td>
                      <td className="py-2 px-2">{result.participantId}</td>
                      <td className="py-2 px-2">
                        <Badge variant="outline">{result.sampleType}</Badge>
                      </td>
                      <td className="py-2 px-2 text-xs">{result.technician}</td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">
                        {new Date(result.enteredAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-2">
                        <Badge className="bg-orange-100 text-orange-800">
                          {result.reviewStatus || 'Pending'}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(result)}
                          className="gap-2"
                        >
                          <Eye className="w-3 h-3" />
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flagged Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Flagged Results ({flaggedResults.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {flaggedResults.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No flagged results. Quality standards being met! ✅
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Sample ID</th>
                    <th className="text-left py-2 px-2">Participant</th>
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-left py-2 px-2">Reason</th>
                    <th className="text-left py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedResults.map((result) => (
                    <tr key={result.id} className="border-b hover:bg-slate-50">
                      <td className="py-2 px-2 font-mono text-xs">{result.sampleId}</td>
                      <td className="py-2 px-2">{result.participantId}</td>
                      <td className="py-2 px-2">
                        <Badge variant="outline">{result.sampleType}</Badge>
                      </td>
                      <td className="py-2 px-2 text-xs text-red-600">
                        {result.flaggedReason || 'Quality issue detected'}
                      </td>
                      <td className="py-2 px-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(result)}
                          className="gap-2"
                        >
                          <Eye className="w-3 h-3" />
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4">
            <CardHeader>
              <CardTitle>Review Lab Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-semibold">Sample ID:</label>
                  <p className="font-mono">{selectedResult.sampleId}</p>
                </div>
                <div>
                  <label className="font-semibold">Participant ID:</label>
                  <p>{selectedResult.participantId}</p>
                </div>
                <div>
                  <label className="font-semibold">Sample Type:</label>
                  <p>{selectedResult.sampleType}</p>
                </div>
                <div>
                  <label className="font-semibold">Technician:</label>
                  <p>{selectedResult.technician}</p>
                </div>
              </div>
              
              <div>
                <label className="font-semibold block mb-2">Result Data:</label>
                <pre className="bg-slate-100 p-3 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(selectedResult.resultData, null, 2)}
                </pre>
              </div>
              
              {selectedResult.flaggedReason && (
                <div className="bg-red-50 border border-red-200 p-3 rounded">
                  <p className="font-semibold text-red-800">Flagged Reason:</p>
                  <p className="text-sm text-red-700">{selectedResult.flaggedReason}</p>
                </div>
              )}
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSelectedResult(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedResult.id, 'Needs correction')}
                >
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedResult.id)}
                >
                  Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
