'use client'

import { useEffect } from 'react'

export function CopyProtect() {
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault()

    function blockDevKeys(e: KeyboardEvent) {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
        (e.ctrlKey && ['U', 'S', 'A', 'P'].includes(e.key.toUpperCase()))
      ) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    document.addEventListener('contextmenu', prevent)
    document.addEventListener('dragstart', prevent)
    document.addEventListener('keydown', blockDevKeys, true)
    return () => {
      document.removeEventListener('contextmenu', prevent)
      document.removeEventListener('dragstart', prevent)
      document.removeEventListener('keydown', blockDevKeys, true)
    }
  }, [])

  return null
}
