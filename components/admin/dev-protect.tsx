'use client'

import { useEffect, useState } from 'react'

export function AdminDevProtect() {
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    function blockKey(e: KeyboardEvent) {
      // F12, Ctrl+Shift+I/J/C, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    function blockContext(e: MouseEvent) {
      e.preventDefault()
    }

    document.addEventListener('keydown', blockKey, true)
    document.addEventListener('contextmenu', blockContext)

    // Detect devtools by checking window size difference
    const threshold = 160
    function checkDevTools() {
      const widthDiff = window.outerWidth - window.innerWidth
      const heightDiff = window.outerHeight - window.innerHeight
      if (widthDiff > threshold || heightDiff > threshold) {
        setBlocked(true)
      } else {
        setBlocked(false)
      }
    }

    const interval = setInterval(checkDevTools, 1000)

    return () => {
      document.removeEventListener('keydown', blockKey, true)
      document.removeEventListener('contextmenu', blockContext)
      clearInterval(interval)
    }
  }, [])

  if (!blocked) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/95">
      <div className="text-center text-white">
        <p className="text-2xl font-bold mb-2">접근 불가</p>
        <p className="text-gray-400">개발자 도구를 닫아주세요.</p>
      </div>
    </div>
  )
}
