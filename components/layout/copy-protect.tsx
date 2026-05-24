'use client'

import { useEffect } from 'react'

/** 폼 요소(input, textarea 등)인지 확인 — 복사 허용 대상 */
function isFormElement(target: EventTarget | null): boolean {
  if (!target) return false
  const el = target as HTMLElement
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.isContentEditable
  )
}

function isFormActive(): boolean {
  return isFormElement(document.activeElement)
}

export function CopyProtect() {
  useEffect(() => {
    /** 항상 차단 */
    const prevent = (e: Event) => e.preventDefault()

    /** 폼 요소가 아닐 때만 차단 */
    function preventIfNotForm(e: Event) {
      if (!isFormElement(e.target)) e.preventDefault()
    }

    /** 텍스트 선택 시작 차단 (폼 제외) */
    function onSelectStart(e: Event) {
      if (!isFormElement(e.target)) e.preventDefault()
    }

    /** 키보드 단축키 차단 */
    function blockDevKeys(e: KeyboardEvent) {
      const key = e.key.toUpperCase()

      // F12 (DevTools 열기)
      if (e.key === 'F12') {
        e.preventDefault(); e.stopPropagation(); return
      }

      // Ctrl+Shift+* — DevTools 패널
      if (e.ctrlKey && e.shiftKey) {
        if (['I', 'J', 'C', 'K', 'E', 'M', 'S', 'P', 'F', 'N', 'O'].includes(key)) {
          e.preventDefault(); e.stopPropagation(); return
        }
      }

      // Ctrl only
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        // 항상 차단 — 소스보기·저장·인쇄
        if (['U', 'S', 'P'].includes(key)) {
          e.preventDefault(); e.stopPropagation(); return
        }
        // 비폼 영역에서만 차단 — 선택·복사·오려내기
        if (['A', 'C', 'X'].includes(key) && !isFormActive()) {
          e.preventDefault(); e.stopPropagation(); return
        }
      }

      // 우클릭 메뉴 키 (ContextMenu key)
      if (e.key === 'ContextMenu') {
        e.preventDefault(); e.stopPropagation(); return
      }
    }

    // ── DevTools 창 크기 감지 ──────────────────────────────────────────
    const DEVTOOLS_THRESHOLD = 160
    let devOpen = false

    function detectDevTools() {
      const wDiff = window.outerWidth - window.innerWidth
      const hDiff = window.outerHeight - window.innerHeight
      const isOpen = wDiff > DEVTOOLS_THRESHOLD || hDiff > DEVTOOLS_THRESHOLD
      if (isOpen !== devOpen) {
        devOpen = isOpen
        document.documentElement.classList.toggle('devtools-open', isOpen)
      }
    }

    const devTimer = setInterval(detectDevTools, 800)

    // ── 이벤트 등록 ───────────────────────────────────────────────────
    document.addEventListener('contextmenu', prevent)
    document.addEventListener('dragstart', prevent)
    document.addEventListener('selectstart', onSelectStart)
    document.addEventListener('copy', preventIfNotForm)
    document.addEventListener('cut', preventIfNotForm)
    document.addEventListener('keydown', blockDevKeys, true)
    window.addEventListener('beforeprint', prevent)
    window.addEventListener('afterprint', prevent)

    return () => {
      document.removeEventListener('contextmenu', prevent)
      document.removeEventListener('dragstart', prevent)
      document.removeEventListener('selectstart', onSelectStart)
      document.removeEventListener('copy', preventIfNotForm)
      document.removeEventListener('cut', preventIfNotForm)
      document.removeEventListener('keydown', blockDevKeys, true)
      window.removeEventListener('beforeprint', prevent)
      window.removeEventListener('afterprint', prevent)
      clearInterval(devTimer)
      document.documentElement.classList.remove('devtools-open')
    }
  }, [])

  return null
}
