import React from 'react'

export function AnimatedHeader() {
  const words = [
    'Customers',
    'Upfitters',
    'Logistics',
    'Order Tracking',
    'Documentation',
    'Recommendations',
  ]

  return (
    <div className="mb-8">
      <div className="hero-band border rounded-lg px-4 py-6 sm:py-8 text-center w-full mx-auto">
        <div className="hero-content">
          <h1 className="font-bold text-gray-900 leading-tight text-[2.5rem] sm:text-5xl md:text-6xl text-center">
            <span className="block text-blue-900">Ford</span>
            <span className="block text-blue-900 text-[0.65em] leading-none my-1 sm:my-2">x</span>
            <span className="relative block h-[1.2em] mt-0 w-full">
              {words.map((word, index) => (
                <span
                  key={word}
                  className="absolute inset-0 w-full opacity-0 rotate-word text-blue-900 flex items-center justify-center"
                  style={{ animationDelay: `${index * 3}s` }}
                >
                  {word}
                </span>
              ))}
            </span>
          </h1>

          <p className="mt-3 text-gray-900 text-lg sm:text-xl">
            One platform. Every stage of commercial vehicle procurement.
          </p>

          <p className="mt-1 text-gray-800 max-w-3xl mx-auto text-sm sm:text-base">
            Seamlessly connecting customers through upfitting, logistics, and beyond. Real-time tracking, intelligent recommendations, and automated documentation in a unified ecosystem.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AnimatedHeader


