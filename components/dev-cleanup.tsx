"use client"

import { useEffect } from "react"

export default function DevCleanup() {
  useEffect(() => {
    const isDev = process.env.NODE_ENV !== "production"
    const host = typeof window !== "undefined" ? window.location.hostname : ""
    const isLocal = host === "localhost" || host === "127.0.0.1"

    if (!(isDev || isLocal)) return

    ;(async () => {
      try {
        // Unregister all service workers
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations()
          await Promise.all(regs.map((r) => r.unregister()))
          // Tell the active controller to stop controlling this page
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" })
          }
          // Clear caches
          if ("caches" in window) {
            const keys = await caches.keys()
            await Promise.all(keys.map((k) => caches.delete(k)))
          }
          // Extra: clear _next cache entries via cache storage
          console.log("🧹 DevCleanup: Unregistered SWs and cleared caches")
        }
      } catch (e) {
        console.warn("DevCleanup: cleanup failed (ignored)", e)
      }
    })()
  }, [])

  return null
}
