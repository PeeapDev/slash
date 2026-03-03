"use client"

import { useState, useEffect } from "react"
import { type Form } from "@/lib/form-store"
import { odkStore } from "@/lib/odk-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, ClipboardList, Calendar, Hash, CircleDot } from "lucide-react"
import { format } from "date-fns"

export default function FormOverviewTab({ form }: { form: Form }) {
  const [subCount, setSubCount] = useState(0)

  useEffect(() => {
    odkStore.getSubmissions(form.id).then((s) => setSubCount(s.length))
  }, [form.id])

  const pubStatus = form.publishStatus || 'draft'

  const stats = [
    {
      label: "Total Submissions",
      value: subCount,
      icon: ClipboardList,
    },
    {
      label: "Publish Status",
      value: pubStatus,
      icon: CircleDot,
      badge: true,
    },
    {
      label: "Form Status",
      value: (form.odkStatus || "open").charAt(0).toUpperCase() + (form.odkStatus || "open").slice(1),
      icon: FileText,
    },
    {
      label: "Created",
      value: format(new Date(form.createdAt), "MMM d, yyyy"),
      icon: Calendar,
    },
    {
      label: "Current Version",
      value: form.versions?.length
        ? `v${form.versions[form.versions.length - 1].version}`
        : "v1",
      icon: Hash,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {s.label}
            </CardTitle>
            <s.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {'badge' in s && s.badge ? (
              <Badge
                className={
                  s.value === 'published'
                    ? 'bg-green-100 text-green-700 border-green-300 text-base'
                    : 'bg-amber-100 text-amber-700 border-amber-300 text-base'
                }
              >
                {s.value === 'published' ? 'Published' : 'Draft'}
              </Badge>
            ) : (
              <div className="text-2xl font-bold">{s.value}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
