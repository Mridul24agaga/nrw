"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, Palette } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeColor {
  name: string
  color: string
  hoverColor: string
  lightColor: string
  superLightColor: string
  textColor: string
}

const predefinedThemes: ThemeColor[] = [
  {
    name: "purple",
    color: "bg-purple-600",
    hoverColor: "hover:bg-purple-700",
    lightColor: "bg-purple-100",
    superLightColor: "bg-purple-50",
    textColor: "text-purple-600",
  },
  {
    name: "blue",
    color: "bg-blue-600",
    hoverColor: "hover:bg-blue-700",
    lightColor: "bg-blue-100",
    superLightColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    name: "green",
    color: "bg-emerald-600",
    hoverColor: "hover:bg-emerald-700",
    lightColor: "bg-emerald-100",
    superLightColor: "bg-emerald-50",
    textColor: "text-emerald-600",
  },
  {
    name: "red",
    color: "bg-rose-600",
    hoverColor: "hover:bg-rose-700",
    lightColor: "bg-rose-100",
    superLightColor: "bg-rose-50",
    textColor: "text-rose-600",
  },
  {
    name: "amber",
    color: "bg-amber-600",
    hoverColor: "hover:bg-amber-700",
    lightColor: "bg-amber-100",
    superLightColor: "bg-amber-50",
    textColor: "text-amber-600",
  },
  {
    name: "gray",
    color: "bg-gray-600",
    hoverColor: "hover:bg-gray-700",
    lightColor: "bg-gray-100",
    superLightColor: "bg-gray-50",
    textColor: "text-gray-600",
  },
]

interface ThemeCustomizerProps {
  onThemeChange: (theme: ThemeColor) => void
  currentTheme: ThemeColor
}

export function ThemeCustomizer({ onThemeChange, currentTheme }: ThemeCustomizerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed border-gray-300 gap-1">
          <Palette className="h-3.5 w-3.5" />
          <span>Theme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Choose a theme color</h4>
            <p className="text-xs text-gray-500">Select a color theme for this memorial page.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {predefinedThemes.map((theme) => (
              <Button
                key={theme.name}
                variant="outline"
                size="sm"
                onClick={() => {
                  onThemeChange(theme)
                  setOpen(false)
                }}
                className={cn(
                  "justify-start gap-1 border-gray-200",
                  currentTheme.name === theme.name && "border-2 border-black",
                )}
              >
                <span className={`h-4 w-4 rounded-full ${theme.color}`} />
                <span className="capitalize text-xs">{theme.name}</span>
                {currentTheme.name === theme.name && <Check className="ml-auto h-3.5 w-3.5" />}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Custom color</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3 flex items-center gap-2">
                <input
                  type="color"
                  className="h-8 w-8 cursor-pointer appearance-none overflow-hidden rounded-full border border-gray-200"
                  value="#9333ea" // Default to purple
                  onChange={(e) => {
                    const hexColor = e.target.value
                    // This is a simplified approach - in a real app you'd need to generate all the color variants
                    const customTheme: ThemeColor = {
                      name: "custom",
                      color: `bg-[${hexColor}]`,
                      hoverColor: `hover:bg-[${hexColor}]`,
                      lightColor: `bg-[${hexColor}]/10`,
                      superLightColor: `bg-[${hexColor}]/5`,
                      textColor: `text-[${hexColor}]`,
                    }
                    onThemeChange(customTheme)
                  }}
                />
                <span className="text-xs text-gray-500">Choose a custom color (experimental)</span>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
