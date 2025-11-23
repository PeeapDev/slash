"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"

export default function BatchEntryPage() {
  const [entries, setEntries] = useState([{ id: 1, sampleId: "", hemoglobin: "", hematocrit: "", status: "pending" }])

  const addEntry = () => {
    const newId = Math.max(...entries.map((e) => e.id), 0) + 1
    setEntries([...entries, { id: newId, sampleId: "", hemoglobin: "", hematocrit: "", status: "pending" }])
  }

  const removeEntry = (id) => {
    setEntries(entries.filter((e) => e.id !== id))
  }

  const updateEntry = (id, field, value) => {
    setEntries(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  const handleSubmit = () => {
    console.log("Batch submitted:", entries)
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold mb-2">Batch Entry Mode</h2>
        <p className="text-muted-foreground">Enter results for multiple samples quickly</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batch Results Entry</CardTitle>
          <CardDescription>Table-like input for quick multi-sample entry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left py-3 px-3">Sample ID</th>
                  <th className="text-left py-3 px-3">Hemoglobin</th>
                  <th className="text-left py-3 px-3">Hematocrit</th>
                  <th className="text-left py-3 px-3">Status</th>
                  <th className="text-center py-3 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-3">
                      <Input
                        placeholder="S001"
                        value={entry.sampleId}
                        onChange={(e) => updateEntry(entry.id, "sampleId", e.target.value)}
                        className="text-sm"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        placeholder="g/dL"
                        value={entry.hemoglobin}
                        onChange={(e) => updateEntry(entry.id, "hemoglobin", e.target.value)}
                        className="text-sm"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        placeholder="%"
                        value={entry.hematocrit}
                        onChange={(e) => updateEntry(entry.id, "hematocrit", e.target.value)}
                        className="text-sm"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <select
                        className="w-full p-1 border border-input rounded text-sm"
                        value={entry.status}
                        onChange={(e) => updateEntry(entry.id, "status", e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button onClick={() => removeEntry(entry.id)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={addEntry}
              className="flex items-center gap-2 bg-transparent"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              Submit Batch
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
