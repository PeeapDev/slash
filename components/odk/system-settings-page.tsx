"use client"

import BrandingSettings from "@/components/branding-settings"
import SyncSettings from "@/components/sync-settings"
import AppConfiguration from "@/components/app-configuration"
import AICredentials from "@/components/ai-credentials"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function SystemSettingsPage() {
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold">System Settings</h1>

      <Accordion type="multiple" defaultValue={["branding", "sync", "app", "ai"]} className="space-y-2">
        <AccordionItem value="branding" className="border rounded-lg px-4">
          <AccordionTrigger className="text-base font-semibold">
            Branding
          </AccordionTrigger>
          <AccordionContent>
            <BrandingSettings />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sync" className="border rounded-lg px-4">
          <AccordionTrigger className="text-base font-semibold">
            Sync Settings
          </AccordionTrigger>
          <AccordionContent>
            <SyncSettings />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="app" className="border rounded-lg px-4">
          <AccordionTrigger className="text-base font-semibold">
            App Configuration
          </AccordionTrigger>
          <AccordionContent>
            <AppConfiguration />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ai" className="border rounded-lg px-4">
          <AccordionTrigger className="text-base font-semibold">
            AI Integration
          </AccordionTrigger>
          <AccordionContent>
            <AICredentials />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
