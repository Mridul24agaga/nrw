import Image from "next/image"

export default function WelcomePost() {
  return (
    <div className="border-b bg-yellow-50 p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Image
          src="/chris.webp"
          alt="Profile"
          width={48}
          height={48}
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full self-start"
        />
        <div className="flex-1 space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-black">Welcome to MemoriesLived.com!</h2>
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            Welcome to MemoriesLived.com! This idea came to me after my father-in-law, Larry Knoll, was cremated,
            leaving us no physical place to remember him. I created this thoughtful space so anyone can grieve, laugh,
            love, and celebrate those they've lost—anytime, anywhere. Take a moment to explore, create a Memorial Page,
            and share the stories and memories that keep your loved ones alive in your heart.
          </p>
        </div>
      </div>
    </div>
  )
}

