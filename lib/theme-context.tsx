"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { indexedDBService } from "@/lib/indexdb-service"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await indexedDBService.get<{ id: string; value: Theme }>('app_settings', 'theme')
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        const initialTheme = stored?.value || systemTheme
        setTheme(initialTheme)
        applyThemeToDOM(initialTheme)
      } catch {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        setTheme(systemTheme)
        applyThemeToDOM(systemTheme)
      }
      setMounted(true)
    }
    loadTheme()
  }, [])

  const applyThemeToDOM = (newTheme: Theme) => {
    const htmlElement = document.documentElement
    if (newTheme === "dark") {
      htmlElement.classList.add("dark")
    } else {
      htmlElement.classList.remove("dark")
    }
  }

  const applyTheme = (newTheme: Theme) => {
    applyThemeToDOM(newTheme)
    indexedDBService.set('app_settings', { id: 'theme', value: newTheme }).catch(() => {})
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  if (!mounted) {
    return <>{children}</>
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
