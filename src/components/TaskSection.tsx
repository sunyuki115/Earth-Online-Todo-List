"use client"

import { useState } from "react"

export function TaskSection({
  icon,
  title,
  count,
  defaultOpen = true,
  storageKey,
  children,
}: {
  icon: string
  title: string
  count?: string
  defaultOpen?: boolean
  storageKey: string
  children: React.ReactNode
}) {
  const fullKey = `earth_online_section_${storageKey}`
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return defaultOpen
    try {
      const stored = localStorage.getItem(fullKey)
      if (stored !== null) return stored === "true"
    } catch {}
    return defaultOpen
  })

  const toggle = () => {
    const next = !isOpen
    setIsOpen(next)
    try { localStorage.setItem(fullKey, String(next)) } catch {}
  }

  return (
    <div className="pixel-card p-4 sm:p-5 mb-4">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={toggle}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <h2 className="text-sm text-earth-brown cn-font">
            {title}
            {count && <span className="text-earth-text-light ml-1">({count})</span>}
          </h2>
        </div>
        <span className="text-earth-text-light text-xs">{isOpen ? "▼" : "▶"}</span>
      </div>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  )
}
