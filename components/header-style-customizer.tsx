"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Layout, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeaderStyle {
  name: string
  style: string
  description: string
}

const headerStyles: HeaderStyle[] = [
  {
    name: "gradient",
    style: "bg-gradient-to-r",
    description: "Gradient background",
  },
  {
    name: "solid",
    style: "bg-solid",
    description: "Solid color background",
  },
  {
    name: "image",
    style: "bg-image",
    description: "Image background",
  },
]

interface HeaderStyleCustomizerProps {
  onStyleChange: (style: HeaderStyle) => void
  currentStyle: HeaderStyle
}

export function HeaderStyleCustomizer({ onStyleChange, currentStyle }: HeaderStyleCustomizerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed border-gray-300 gap-1">
          <Layout className="h-3.5 w-3.5" />
          <span>Header</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Header Style</h4>
            <p className="text-xs text-gray-500">Choose how the memorial header should appear.</p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {headerStyles.map((style) => (
              <Button
                key={style.name}
                variant="outline"
                size="sm"
                onClick={() => {
                  onStyleChange(style)
                  setOpen(false)
                }}
                className={cn(
                  "justify-start gap-2 border-gray-200",
                  currentStyle.name === style.name && "border-2 border-black",
                )}
              >
                <span className="capitalize text-xs">{style.description}</span>
                {currentStyle.name === style.name && <Check className="ml-auto h-3.5 w-3.5" />}
              </Button>
            ))}
          </div>
          {currentStyle.name === "image" && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Background Image</h4>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" size="sm" className="justify-start text-xs">
                  Upload image...
                </Button>
                <p className="text-xs text-gray-500">Recommended size: 1200x400px. Max file size: 5MB.</p>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
