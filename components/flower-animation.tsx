"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Image from "next/image"

interface FlowerAnimationProps {
  senderName: string
}

export const FlowerAnimation: React.FC<FlowerAnimationProps> = ({ senderName }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const animationDuration = 5000 // 5 seconds
    const framesPerSecond = 60
    const totalFrames = (animationDuration / 1000) * framesPerSecond
    let frame = 0

    const startX = Math.random() * window.innerWidth
    const startY = window.innerHeight

    const animateFlower = () => {
      if (frame < totalFrames) {
        setPosition({
          x: startX + (Math.random() - 0.5) * 100, // Add some horizontal movement
          y: startY - startY * (frame / totalFrames),
        })
        frame++
        requestAnimationFrame(animateFlower)
      }
    }

    animateFlower()

    return () => {
      // Clean up if needed
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div
        className="absolute transition-all duration-100 ease-linear"
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      >
        <Image src="/flower.png" alt="Flower" width={50} height={50} />
      </div>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded shadow">
        <p className="text-sm">{senderName} sent a flower</p>
      </div>
    </div>
  )
}

