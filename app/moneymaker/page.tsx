"use client"

import React, { useState, useCallback, useEffect, useRef } from "react"
import { useDropzone } from "react-dropzone"
import html2canvas from "html2canvas"

interface CollageImage {
  id: string
  src: string
  rotation: number
  brightness: number
  contrast: number
  blur: number
}

interface Toast {
  id: string
  title: string
  description: string
  variant: 'default' | 'destructive'
}

interface CollageLayout {
  id: string
  name: string
  imageCount: number
  gridTemplate: string
}

const MAX_IMAGES = 20
const MAX_IMAGE_SIZE = 1024 * 1024 // 1MB

const COLLAGE_LAYOUTS: CollageLayout[] = [
  { id: '2x2', name: '4 Images (2x2)', imageCount: 4, gridTemplate: 'grid-cols-2 grid-rows-2' },
  { id: '3x2', name: '6 Images (3x2)', imageCount: 6, gridTemplate: 'grid-cols-3 grid-rows-2' },
  { id: '3x3', name: '9 Images (3x3)', imageCount: 9, gridTemplate: 'grid-cols-3 grid-rows-3' },
  { id: '4x3', name: '12 Images (4x3)', imageCount: 12, gridTemplate: 'grid-cols-4 grid-rows-3' },
]

export default function MemoryMakerPage() {
  const [images, setImages] = useState<CollageImage[]>([])
  const [selectedImage, setSelectedImage] = useState<CollageImage | null>(null)
  const [selectedLayout, setSelectedLayout] = useState<CollageLayout>(COLLAGE_LAYOUTS[0])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [collageBackgroundColor, setCollageBackgroundColor] = useState('#ffffff')
  const collageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedImages = localStorage.getItem('memory_maker_images')
    if (savedImages) {
      setImages(JSON.parse(savedImages))
    }
  }, [])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const saveImages = useCallback((imagesToSave: CollageImage[]) => {
    try {
      localStorage.setItem('memory_maker_images', JSON.stringify(imagesToSave))
    } catch (error) {
      console.error("Error saving images:", error)
      showToast({
        title: "Warning",
        description: "Failed to save all images. Try removing some images or clearing old data.",
        variant: "destructive",
      })
    }
  }, [showToast])

  const compressImage = useCallback((src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }
        const scaleFactor = Math.sqrt(MAX_IMAGE_SIZE / (img.width * img.height))
        canvas.width = img.width * scaleFactor
        canvas.height = img.height * scaleFactor
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL("image/jpeg", 0.7))
      }
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = src
    })
  }, [])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (images.length >= MAX_IMAGES) {
        showToast({
          title: "Limit Reached",
          description: `You can only add up to ${MAX_IMAGES} images.`,
          variant: "destructive",
        })
        return
      }

      for (const file of acceptedFiles) {
        if (images.length >= MAX_IMAGES) break

        const reader = new FileReader()
        reader.onload = async (e) => {
          if (e.target && typeof e.target.result === "string") {
            try {
              const compressedSrc = await compressImage(e.target.result)
              const newImage: CollageImage = {
                id: Date.now().toString(),
                src: compressedSrc,
                rotation: 0,
                brightness: 100,
                contrast: 100,
                blur: 0,
              }
              setImages((prevImages) => {
                const updatedImages = [...prevImages, newImage]
                saveImages(updatedImages)
                return updatedImages
              })
            } catch (error) {
              console.error("Error processing image:", error)
              showToast({
                title: "Error",
                description: "Failed to process image. Please try again.",
                variant: "destructive",
              })
            }
          }
        }
        reader.readAsDataURL(file)
      }
    },
    [images, saveImages, compressImage, showToast],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] } })

  const handleRemove = (id: string) => {
    const updatedImages = images.filter((img) => img.id !== id)
    setImages(updatedImages)
    saveImages(updatedImages)
    if (selectedImage?.id === id) {
      setSelectedImage(null)
    }
  }

  const handleImageClick = (image: CollageImage) => {
    setSelectedImage(image)
  }

  const handleRotate = () => {
    if (selectedImage) {
      const updatedImage = { ...selectedImage, rotation: (selectedImage.rotation + 90) % 360 }
      updateImage(updatedImage)
    }
  }

  const handleImageChange = (property: keyof CollageImage, value: number) => {
    if (selectedImage) {
      const updatedImage = { ...selectedImage, [property]: value }
      updateImage(updatedImage)
    }
  }

  const updateImage = (updatedImage: CollageImage) => {
    const updatedImages = images.map((img) => (img.id === updatedImage.id ? updatedImage : img))
    setImages(updatedImages)
    setSelectedImage(updatedImage)
    saveImages(updatedImages)
  }

  const handleLayoutChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLayout = COLLAGE_LAYOUTS.find(layout => layout.id === event.target.value)
    if (newLayout) {
      setSelectedLayout(newLayout)
    }
  }

  const handleSave = () => {
    showToast({
      title: "Success",
      description: "Memory collage saved successfully!",
      variant: "default",
    })
  }

  const handleDownload = async () => {
    if (collageRef.current) {
      try {
        const canvas = await html2canvas(collageRef.current)
        const dataUrl = canvas.toDataURL("image/png")
        const link = document.createElement("a")
        link.download = "memory-collage.png"
        link.href = dataUrl
        link.click()
      } catch (error) {
        console.error("Error downloading collage:", error)
        showToast({
          title: "Error",
          description: "Failed to download collage. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const renderCollage = () => {
    const collageImages = images.slice(0, selectedLayout.imageCount)
    return (
      <div 
        ref={collageRef}
        className={`grid gap-2 p-4 ${selectedLayout.gridTemplate}`} 
        style={{ backgroundColor: collageBackgroundColor }}
      >
        {collageImages.map((image, index) => (
          <div key={image.id} className="relative aspect-square overflow-hidden">
            <img
              src={image.src || "/placeholder.svg"}
              alt={`Collage image ${index + 1}`}
              className="w-full h-full object-cover cursor-pointer"
              style={{
                transform: `rotate(${image.rotation}deg)`,
                filter: `brightness(${image.brightness}%) contrast(${image.contrast}%) blur(${image.blur}px)`,
              }}
              onClick={() => handleImageClick(image)}
            />
          </div>
        ))}
        {Array.from({ length: selectedLayout.imageCount - collageImages.length }).map((_, index) => (
          <div key={`empty-${index}`} className="bg-gray-200 aspect-square" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-64 border-r p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Memory Maker</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="layout-select" className="block mb-2">Choose Layout</label>
            <select
              id="layout-select"
              value={selectedLayout.id}
              onChange={handleLayoutChange}
              className="w-full p-2 border rounded"
            >
              {COLLAGE_LAYOUTS.map((layout) => (
                <option key={layout.id} value={layout.id}>
                  {layout.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="bg-color" className="block mb-2">Background Color</label>
            <input
              id="bg-color"
              type="color"
              value={collageBackgroundColor}
              onChange={(e) => setCollageBackgroundColor(e.target.value)}
              className="w-full p-1 border rounded"
            />
          </div>
          <div 
            {...getRootProps()} 
            className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer"
          >
            <input {...getInputProps()} />
            <p className="text-sm">
              {isDragActive
                ? "Drop the images here ..."
                : "Drag 'n' drop images, or click to select"}
            </p>
          </div>
        </div>
        <button 
          onClick={handleSave} 
          className="w-full mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save Collage
        </button>
      </div>
      <main className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Your Collage</h1>
          <button 
            onClick={handleDownload} 
            className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Download Collage
          </button>
        </div>
        {renderCollage()}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">All Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.src || "/placeholder.svg"}
                  alt="Memory"
                  className="w-full h-40 object-cover rounded cursor-pointer transition-transform transform hover:scale-105"
                  style={{
                    transform: `rotate(${image.rotation}deg)`,
                    filter: `brightness(${image.brightness}%) contrast(${image.contrast}%) blur(${image.blur}px)`,
                  }}
                  onClick={() => handleImageClick(image)}
                />
                <button
                  onClick={() => handleRemove(image.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>
        {selectedImage && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Edit Image</h3>
            <div className="space-y-4">
              <button 
                onClick={handleRotate} 
                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Rotate
              </button>
              <div>
                <label htmlFor="brightness" className="block mb-2">Brightness</label>
                <input
                  id="brightness"
                  type="range"
                  min={0}
                  max={200}
                  value={selectedImage.brightness}
                  onChange={(e) => handleImageChange('brightness', Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="contrast" className="block mb-2">Contrast</label>
                <input
                  id="contrast"
                  type="range"
                  min={0}
                  max={200}
                  value={selectedImage.contrast}
                  onChange={(e) => handleImageChange('contrast', Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="blur" className="block mb-2">Blur</label>
                <input
                  id="blur"
                  type="range"
                  min={0}
                  max={10}
                  step={0.1}
                  value={selectedImage.blur}
                  onChange={(e) => handleImageChange('blur', Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            <img
              src={selectedImage.src || "/placeholder.svg"}
              alt="Selected Memory"
              className="w-full max-h-60 object-contain rounded mt-4"
              style={{
                transform: `rotate(${selectedImage.rotation}deg)`,
                filter: `brightness(${selectedImage.brightness}%) contrast(${selectedImage.contrast}%) blur(${selectedImage.blur}px)`,
              }}
            />
          </div>
        )}
      </main>
      <div className="fixed bottom-4 right-4 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg ${
              toast.variant === 'destructive' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
            }`}
          >
            <h4 className="font-bold">{toast.title}</h4>
            <p>{toast.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}