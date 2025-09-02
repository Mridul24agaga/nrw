"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Home, Heart, Users, Camera, Quote } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-blue-50">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-purple-100">
        <div className="flex items-center p-4 max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center text-purple-600 hover:text-purple-800 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline font-medium">Back</span>
            </Link>
            <div className="h-4 w-px bg-purple-200" />
            <Link href="/" className="flex items-center text-purple-600 hover:text-purple-800 transition-colors">
              <Home className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline font-medium">Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-4 py-12 sm:py-16 max-w-5xl mx-auto">
        <article className="space-y-16">
          {/* Hero Section */}
          <section className="text-center space-y-8">
            <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Our Story
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Where memories become timeless treasures
            </p>
          </section>

          {/* Family Image Section */}
          <section className="relative transition-transform duration-300 ease-in-out hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 transform rotate-1 rounded-3xl" />
            <div className="relative bg-white p-6 sm:p-8 rounded-3xl shadow-xl">
              <Image
                src="/pic.png"
                alt="A loving family gathered under a 'HOME' sign, representing our commitment to preserving family memories"
                width={1200}
                height={800}
                className="rounded-2xl w-full object-cover"
                priority
              />
              <div className="mt-6 text-center">
                <p className="text-lg text-gray-600 italic">&ldquo;Where life begins &amp; love never ends&rdquo;</p>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="grid sm:grid-cols-3 gap-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">Honoring Legacies</h3>
              <p className="text-gray-600 text-center">
                Create a digital sanctuary where the essence of your loved ones lives on, vibrant and ever-present.
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="h-12 w-12 bg-rose-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Users className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">Connecting Hearts</h3>
              <p className="text-gray-600 text-center">
                Bridge distances and generations, allowing family and friends to come together in remembrance.
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="h-12 w-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Camera className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">Capturing Moments</h3>
              <p className="text-gray-600 text-center">
                Preserve the fleeting instants that defined a life, from milestone achievements to quiet joys.
              </p>
            </div>
          </section>

          {/* Mission Section */}
          <section className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 sm:p-12 shadow-xl space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Our Heartfelt Mission</h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              We&apos;re on a journey to transform the way we remember and celebrate lives. MemoriesLived.com is more than a
              platform; it&apos;s a compassionate space where grief finds solace, where joy resurfaces in shared stories, and
              where the legacy of those we&apos;ve lost continues to inspire and guide us.
            </p>
            <p className="text-gray-600 leading-relaxed text-lg">
              Our mission is to make the act of remembering as beautiful, personal, and enduring as the lives we honor.
            </p>
          </section>

          {/* Quote Section */}
          <section className="relative py-12">
            <div className="absolute left-4 top-0">
              <Quote className="h-12 w-12 text-purple-200" />
            </div>
            <blockquote className="text-center">
              <p className="text-2xl sm:text-3xl font-medium text-gray-900 max-w-3xl mx-auto">
                &ldquo;To live in hearts we leave behind is not to die.&rdquo;
              </p>
              <footer className="mt-4 text-gray-600">
                <cite className="font-medium">Thomas Campbell</cite>
              </footer>
            </blockquote>
          </section>

          {/* Company Info */}
          <section className="text-center space-y-4">
            <p className="text-gray-600">MemoriesLived.com is lovingly crafted by CJM Ashton LLC</p>
            <p className="text-sm text-gray-500">Based in Austin, TX</p>
          </section>
        </article>
      </main>
    </div>
  )
}

