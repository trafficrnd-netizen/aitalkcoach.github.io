'use client'

import { useEffect, useRef } from 'react'

interface Props {
  email: string
}

/**
 * 캔버스로 타일을 생성해 반복 배경으로 사용하는 워터마크.
 * DOM 요소 하나를 제거해도 배경 이미지로 남아 스크린샷에도 표시됨.
 */
export function Watermark({ email }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay || !email) return

    // 타일 캔버스 생성
    const canvas = document.createElement('canvas')
    const W = 420
    const H = 180
    canvas.width = W
    canvas.height = H

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.save()
    ctx.clearRect(0, 0, W, H)
    ctx.translate(W / 2, H / 2)
    ctx.rotate(-Math.PI / 7) // -약 25도 기울기

    ctx.font = '600 11.5px "SF Mono", "Fira Code", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(30, 47, 82, 0.07)'

    ctx.fillText(email, 0, -9)
    ctx.fillText('ai-traffic.kr', 0, 9)
    ctx.restore()

    const dataUrl = canvas.toDataURL('image/png')

    overlay.style.backgroundImage = `url(${dataUrl})`
    overlay.style.backgroundRepeat = 'repeat'
    overlay.style.backgroundSize = `${W}px ${H}px`
  }, [email])

  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      className="fixed inset-0 z-[9998] pointer-events-none select-none"
    />
  )
}
