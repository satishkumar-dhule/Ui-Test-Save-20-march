import React, { useCallback, useRef, useEffect } from 'react'

export function useAnnounce() {
  const liveRegionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!liveRegionRef.current) {
      const region = document.createElement('div')
      region.setAttribute('role', 'status')
      region.setAttribute('aria-live', 'polite')
      region.setAttribute('aria-atomic', 'true')
      region.className = 'sr-only'
      region.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;'
      document.body.appendChild(region)
      liveRegionRef.current = region
    }
    return () => {
      if (liveRegionRef.current) {
        document.body.removeChild(liveRegionRef.current)
        liveRegionRef.current = null
      }
    }
  }, [])

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority)
      liveRegionRef.current.textContent = ''
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = message
        }
      }, 50)
    }
  }, [])

  const announcePageChange = useCallback((title: string, position: string) => {
    announce(`${title}, ${position}`)
  }, [announce])

  return { announce, announcePageChange }
}

export function SkipLink({ targetId, children }: { targetId: string; children: React.ReactNode }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:font-semibold focus:text-sm"
    >
      {children}
    </a>
  )
}

export function LiveRegion() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  )
}
