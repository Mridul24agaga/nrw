"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Home } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#ff9a9e] to-[#a18cd1]">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
        <div className="flex items-center p-4 max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="h-4 w-px bg-gray-300" />
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <Home className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-4 py-8 sm:py-12 max-w-4xl mx-auto">
        <article className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-10 space-y-12">
          {/* Our Story Section */}
          <section className="text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">Our Story</h1>
            <h2 className="text-2xl sm:text-3xl font-semibold text-rose-600">Weaving Threads of Remembrance</h2>
            <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
              At MemoriesLived.com, we believe that every life tells a unique and beautiful story. Our platform is a
              digital tapestry where the threads of cherished memories, shared laughter, and enduring love come together
              to create a lasting tribute to those who have touched our hearts.
            </p>
          </section>

          {/* Features Grid */}
          <section className="grid sm:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <h3 className="text-xl font-semibold text-gray-900">Honoring Legacies</h3>
              <p className="text-gray-600">
                Create a digital sanctuary where the essence of your loved ones lives on, vibrant and ever-present.
              </p>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-xl font-semibold text-gray-900">Connecting Hearts</h3>
              <p className="text-gray-600">
                Bridge distances and generations, allowing family and friends to come together in remembrance and
                celebration.
              </p>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-xl font-semibold text-gray-900">Capturing Moments</h3>
              <p className="text-gray-600">
                Preserve the fleeting instants that defined a life, from milestone achievements to quiet, everyday joys.
              </p>
            </div>
          </section>

          {/* Mission Section */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 text-center">Our Heartfelt Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              We're on a journey to transform the way we remember and celebrate lives. MemoriesLived.com is more than a
              platform; it's a compassionate space where grief finds solace, where joy resurfaces in shared stories, and
              where the legacy of those we've lost continues to inspire and guide us. Our mission is to make the act of
              remembering as beautiful, personal, and enduring as the lives we honor.
            </p>
          </section>

          {/* Founder Section */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center">Meet Our Founder</h2>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-1/3 aspect-square relative">
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <Image
                    src="/placeholder.svg?height=400&width=400"
                    alt="Founder"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              </div>
              <div className="w-full md:w-2/3 space-y-4">
                <h3 className="text-2xl font-semibold text-gray-900">Jane Doe</h3>
                <p className="text-gray-600 italic">Founder & CEO</p>
                <p className="text-gray-600 leading-relaxed">
                  With a deep understanding of loss and the power of remembrance, Jane founded MemoriesLived.com to
                  create a space where memories could be preserved and shared with dignity and grace. Her vision has
                  shaped every aspect of our platform, ensuring it serves as a meaningful tribute to those we hold dear.
                </p>
              </div>
            </div>
          </section>

          {/* Labor of Love Section */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 text-center">A Labor of Love</h2>
            <p className="text-gray-600 leading-relaxed">
              MemoriesLived.com is lovingly crafted by CJM Ashton LLC, based in the heart of Austin, TX. We pour our
              passion into creating a platform that respects the delicate nature of loss while celebrating the enduring
              power of memory. Every feature, every pixel is designed with care, understanding that we're not just
              building a website, but a home for your most treasured recollections.
            </p>
          </section>

          {/* Quote */}
          <blockquote className="text-center italic text-gray-600 border-t border-b border-gray-200 py-6">
            "To live in hearts we leave behind is not to die."
            <footer className="text-sm mt-2 font-medium">- Thomas Campbell</footer>
          </blockquote>
        </article>
      </main>
    </div>
  )
}

