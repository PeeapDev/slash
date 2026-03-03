"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  Type,
  Hash,
  List,
  Circle,
  CheckSquare,
  Calendar,
  Clock,
  Upload,
  Mail,
  Phone,
  MapPin,
  BarChart3,
  FileText,
  Star,
  SlidersHorizontal,
  QrCode,
  Calculator,
  ImageIcon,
  Search,
} from "lucide-react"
import { FormField } from "@/lib/form-store"
import { cn } from "@/lib/utils"

interface TypeCategory {
  name: string
  types: { type: FormField["type"]; label: string; icon: any; description: string }[]
}

const categories: TypeCategory[] = [
  {
    name: "Text",
    types: [
      { type: "text", label: "Text", icon: Type, description: "Single or multi-line text" },
      { type: "integer", label: "Integer", icon: Hash, description: "Whole numbers" },
      { type: "decimal", label: "Decimal", icon: Hash, description: "Decimal numbers" },
    ],
  },
  {
    name: "Choice",
    types: [
      { type: "select", label: "Select One", icon: List, description: "Single choice dropdown" },
      { type: "radio", label: "Radio Buttons", icon: Circle, description: "Single choice buttons" },
      { type: "checkbox", label: "Select Multiple", icon: CheckSquare, description: "Multiple choices" },
    ],
  },
  {
    name: "Date & Time",
    types: [
      { type: "date", label: "Date", icon: Calendar, description: "Date picker" },
      { type: "time", label: "Time", icon: Clock, description: "Time picker" },
    ],
  },
  {
    name: "Media",
    types: [
      { type: "image", label: "Image", icon: ImageIcon, description: "Photo capture or upload" },
      { type: "file", label: "File Upload", icon: Upload, description: "File attachment" },
    ],
  },
  {
    name: "Location",
    types: [
      { type: "gps", label: "GPS Location", icon: MapPin, description: "GPS coordinates" },
    ],
  },
  {
    name: "Advanced",
    types: [
      { type: "calculate", label: "Calculate", icon: Calculator, description: "Computed field" },
      { type: "barcode", label: "Barcode / QR", icon: QrCode, description: "Scan barcode or QR" },
      { type: "note", label: "Note", icon: FileText, description: "Read-only text/instructions" },
      { type: "rating", label: "Rating", icon: Star, description: "Star rating (1-5)" },
      { type: "range", label: "Range Slider", icon: SlidersHorizontal, description: "Numeric range slider" },
      { type: "likert", label: "Likert Scale", icon: BarChart3, description: "Agreement scale" },
      { type: "email", label: "Email", icon: Mail, description: "Email address with validation" },
      { type: "phone", label: "Phone", icon: Phone, description: "Phone number with validation" },
    ],
  },
]

interface OdkQuestionTypePickerProps {
  onSelectType: (type: FormField["type"]) => void
}

export default function OdkQuestionTypePicker({ onSelectType }: OdkQuestionTypePickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filteredCategories = categories
    .map(cat => ({
      ...cat,
      types: cat.types.filter(
        t => t.label.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(cat => cat.types.length > 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="default" size="sm" className="gap-1.5 h-8">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Question</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search field types..."
              className="h-8 text-sm pl-7"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="max-h-[400px]">
          <div className="p-1">
            {filteredCategories.map((cat, catIdx) => (
              <div key={cat.name}>
                {catIdx > 0 && <Separator className="my-1" />}
                <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {cat.name}
                </div>
                {cat.types.map(t => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.type}
                      onClick={() => {
                        onSelectType(t.type)
                        setOpen(false)
                        setSearch("")
                      }}
                      className={cn(
                        "flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-left",
                        "hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
                      )}
                    >
                      <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm leading-tight">{t.label}</div>
                        <div className="text-[11px] text-muted-foreground leading-tight">{t.description}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}
            {filteredCategories.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">No matching field types</div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
