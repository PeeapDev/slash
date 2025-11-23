"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

export default function SampleSearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState("sample_id")
  const [searchResult, setSearchResult] = useState(null)

  const mockData = {
    S001: {
      sampleId: "S001",
      participantId: "PT001",
      type: "Urine",
      collectionDate: "2024-01-15",
      collectionTime: "09:30",
      condition: "Good",
      notes: "Sample collected successfully",
    },
    PT001: {
      participantId: "PT001",
      name: "John Doe",
      age: 35,
      sex: "Male",
      samples: ["S001", "S045"],
    },
  }

  const handleSearch = () => {
    if (!searchQuery) return
    const key = searchType === "sample_id" ? searchQuery : searchQuery
    if (mockData[key]) {
      setSearchResult(mockData[key])
    } else {
      setSearchResult(null)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold mb-2">Sample Search</h2>
        <p className="text-muted-foreground">Find samples by ID or participant information</p>
      </div>

      {/* Search Box */}
      <Card>
        <CardHeader>
          <CardTitle>Search Samples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search By</label>
            <select
              className="w-full p-2 border border-input rounded-lg mb-4"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="sample_id">Sample ID</option>
              <option value="participant_id">Participant ID</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder={searchType === "sample_id" ? "Enter Sample ID (e.g., S001)..." : "Enter Participant ID..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 px-6">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Result */}
      {searchResult && (
        <Card>
          <CardHeader>
            <CardTitle>Search Result</CardTitle>
          </CardHeader>
          <CardContent>
            {searchResult.sampleId ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Sample ID</p>
                    <p className="font-mono font-semibold">{searchResult.sampleId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Participant ID</p>
                    <p className="font-mono">{searchResult.participantId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sample Type</p>
                    <Badge>{searchResult.type}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Condition</p>
                    <p className="font-medium">{searchResult.condition}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Collection Date</p>
                    <p>{searchResult.collectionDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Collection Time</p>
                    <p>{searchResult.collectionTime}</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="mt-1">{searchResult.notes}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Participant ID</p>
                  <p className="font-mono font-semibold">{searchResult.participantId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p>{searchResult.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p>{searchResult.age} years</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sex</p>
                  <p>{searchResult.sex}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Associated Samples</p>
                  <div className="flex gap-2 mt-2">
                    {searchResult.samples.map((id) => (
                      <Badge key={id} variant="secondary">
                        {id}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
