"use client"

import { useEffect, useRef } from "react"

interface FlowerAnimationProps {
  senderName: string
}

export function FlowerAnimation({ senderName }: FlowerAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Animation logic
    let frame = 0
    const animate = () => {
      frame++
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw flowers
      for (let i = 0; i < 10; i++) {
        const x = Math.sin(frame * 0.05 + i) * 100 + canvas.width / 2
        const y = frame * 2 + i * 20 - 200
        drawFlower(ctx, x, y)
      }

      // Draw sender name in rainbow colors
      const fontSize = 30
      ctx.font = `${fontSize}px Arial`
      ctx.textAlign = "center"
      const letters = senderName.split("")
      letters.forEach((letter, index) => {
        const hue = (frame + index * 30) % 360
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
        ctx.fillText(letter, canvas.width / 2 + (index - letters.length / 2) * fontSize, canvas.height - 50)
      })

      if (frame < 300) {
        requestAnimationFrame(animate)
      }
    }

    animate()
  }, [senderName])

  return <canvas ref={canvasRef} className="fixed inset-0 z-50" />
}

function drawFlower(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const petalColors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"]
  const petalCount = 5

  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2
    const petalX = x + Math.cos(angle) * 20
    const petalY = y + Math.sin(angle) * 20

    ctx.beginPath()
    ctx.ellipse(petalX, petalY, 15, 10, angle, 0, Math.PI * 2)
    ctx.fillStyle = petalColors[i % petalColors.length]
    ctx.fill()
  }

  ctx.beginPath()
  ctx.arc(x, y, 10, 0, Math.PI * 2)
  ctx.fillStyle = "#FFD700"
  ctx.fill()
}

