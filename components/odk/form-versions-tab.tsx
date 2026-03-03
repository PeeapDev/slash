"use client"

import { type Form } from "@/lib/form-store"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"

export default function FormVersionsTab({ form }: { form: Form }) {
  const versions = form.versions?.length
    ? form.versions
    : [
        {
          version: 1,
          publishedBy: form.createdBy,
          publishedAt: form.createdAt,
          fieldCount: form.fields.length,
        },
      ]

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Form Versions</h2>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Version</TableHead>
              <TableHead>Published By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center w-28">Fields</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((v) => (
              <TableRow key={v.version}>
                <TableCell className="font-medium">v{v.version}</TableCell>
                <TableCell>{v.publishedBy}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(v.publishedAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-center">{v.fieldCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
