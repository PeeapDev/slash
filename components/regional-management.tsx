"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2, ChevronDown } from "lucide-react"

export default function RegionalManagement() {
  const [regions, setRegions] = useState([
    {
      id: 1,
      name: "Northern Region",
      code: "NR",
      districts: ["Nakodwe", "Kanem", "Lac"],
      supervisors: 3,
      status: "active",
      expanded: false,
      lastSync: "2024-01-15 14:32",
    },
    {
      id: 2,
      name: "Southern Region",
      code: "SR",
      districts: ["Mayo-Kebbi", "Logone"],
      supervisors: 2,
      status: "active",
      expanded: false,
      lastSync: "2024-01-15 13:45",
    },
    {
      id: 3,
      name: "Eastern Region",
      code: "ER",
      districts: ["Salamat", "Ouaddai", "Wadi Fira"],
      supervisors: 4,
      status: "active",
      expanded: false,
      lastSync: "2024-01-15 15:12",
    },
    { id: 4, name: "Western Region", code: "WR", districts: 5, supervisors: 3, status: "active" },
  ])

  const [supervisors, setSupervisors] = useState([
    { id: 1, name: "Ahmed Hassan", region: "Northern Region", status: "active" },
    { id: 2, name: "Maria Santos", region: "Southern Region", status: "active" },
    { id: 3, name: "Grace Okoye", region: "Eastern Region", status: "active" },
  ])

  const toggleExpand = (id: number) => {
    setRegions(regions.map((r) => (r.id === id ? { ...r, expanded: !r.expanded } : r)))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Admin / Regional Setup</div>
          <h1 className="text-2xl font-bold mt-1">Regional Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage regions, districts, and supervisor assignments</p>
        </div>
        <Button className="gap-2">
          <Plus size={18} />
          Add Region
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Regions</div>
          <div className="text-2xl font-bold mt-1">4</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Districts</div>
          <div className="text-2xl font-bold mt-1">18</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Active Supervisors</div>
          <div className="text-2xl font-bold mt-1">12</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-semibold">Regional Breakdown</h2>
        </div>
        <div className="divide-y divide-border">
          {regions.map((region) => (
            <div key={region.id}>
              <button
                onClick={() => toggleExpand(region.id)}
                className="w-full p-6 hover:bg-muted flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <ChevronDown size={20} className={`transition-transform ${region.expanded ? "rotate-180" : ""}`} />
                  <div className="text-left">
                    <div className="font-semibold">{region.name}</div>
                    <div className="text-xs text-muted-foreground">{region.code}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <div className="font-medium">{region.districts.length} districts</div>
                    <div className="text-xs text-muted-foreground">{region.supervisors} supervisors</div>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {region.status}
                  </span>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-muted rounded">
                      <Edit2 size={16} />
                    </button>
                    <button className="p-1 hover:bg-muted rounded">
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </button>

              {region.expanded && (
                <div className="bg-muted/50 p-6 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-sm mb-3">Districts</h4>
                      <div className="space-y-2">
                        {region.districts.map((district, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span>{district}</span>
                            <button className="text-xs text-blue-600 hover:underline">Edit</button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full mt-2 gap-1 bg-transparent">
                          <Plus size={14} />
                          Add District
                        </Button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-3">Region Settings</h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <label className="block text-muted-foreground text-xs mb-1">Last Sync</label>
                          <p className="font-medium">{region.lastSync}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                            Pre-cache Metadata
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                            Manage Supervisors
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Assign Supervisors to Regions</h2>
        <div className="space-y-3">
          {supervisors.map((sup) => (
            <div key={sup.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <div className="font-medium">{sup.name}</div>
                <div className="text-xs text-muted-foreground">{sup.region}</div>
              </div>
              <Button variant="outline" size="sm">
                Change Assignment
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Offline Location Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Region for Offline Cache</label>
            <select className="w-full border border-border rounded-lg px-4 py-2">
              <option>-- Select Region --</option>
              {regions.map((r) => (
                <option key={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Select District</label>
            <select className="w-full border border-border rounded-lg px-4 py-2">
              <option>-- Select District --</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted rounded">
              <div className="text-xs text-muted-foreground">Cache Status</div>
              <div className="font-semibold">Not Cached</div>
            </div>
            <Button className="w-full">Cache Region/District</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
