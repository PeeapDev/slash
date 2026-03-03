"use client"

import React from "react"
import { useNavigation } from "@/lib/navigation-context"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function OdkBreadcrumbs() {
  const { breadcrumbs } = useNavigation()

  if (breadcrumbs.length <= 1) return null

  return (
    <div className="border-b bg-muted/30 px-4 py-2">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1
            return (
              <React.Fragment key={i}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {isLast || !crumb.onClick ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      className="cursor-pointer"
                      onClick={crumb.onClick}
                    >
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}
