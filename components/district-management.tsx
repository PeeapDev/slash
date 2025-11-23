"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2 } from "lucide-react"

export default function DistrictManagement() {
  const [districts, setDistricts] = useState([
    { id: 1, name: "Nakodwe", region: "Northern Region", code: "NK", population: 45000, status: "active" },
    { id: 2, name: "Kanem", region: "Northern Region", code: "KN", population: 38000, status: "active" },
    { id: 3, name: "Mayo-Kebbi", region: "Southern Region", code: "MK", population: 52000, status: "active" },
    { id: 4, name: "Salamat", region: "Eastern Region", code: "SL", population: 28000, status: "active" },
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Admin / District Management</div>
          <h1 className="text-2xl font-bold mt-1">District Management</h1>
          <p className="text-sm text-muted-foreground mt-1">View and manage all districts across regions</p>
        </div>
        <Button className="gap-2">
          <Plus size={18} />
          Add District
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left py-3 px-6 font-semibold">District Name</th>
              <th className="text-left py-3 px-6 font-semibold">Region</th>
              <th className="text-left py-3 px-6 font-semibold">Code</th>
              <th className="text-right py-3 px-6 font-semibold">Population</th>
              <th className="text-center py-3 px-6 font-semibold">Status</th>
              <th className="text-center py-3 px-6 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {districts.map((district) => (
              <tr key={district.id} className="border-b border-border hover:bg-muted/50">
                <td className="py-4 px-6 font-medium">{district.name}</td>
                <td className="py-4 px-6 text-muted-foreground">{district.region}</td>
                <td className="py-4 px-6 text-muted-foreground">{district.code}</td>
                <td className="py-4 px-6 text-right">{district.population.toLocaleString()}</td>
                <td className="py-4 px-6 text-center">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {district.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-1 hover:bg-muted rounded">
                      <Edit2 size={16} />
                    </button>
                    <button className="p-1 hover:bg-muted rounded">
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
