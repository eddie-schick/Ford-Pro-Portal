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
    <div className="mb-12">
      <div className="hero-band border rounded-lg px-4 py-12 sm:py-16 text-center">
        <div className="hero-content">
          <h1 className="font-bold text-gray-900 leading-tight text-[2.5rem] sm:text-5xl md:text-6xl text-center">
            <span className="relative inline-block align-baseline headline-offset">
              <span className="text-blue-900 whitespace-nowrap">Ford X</span>
              <span className="absolute top-0 left-full ml-2 h-[1em] w-[16ch] sm:w-[18ch] text-left">
                {words.map((word, index) => (
                  <span
                    key={word}
                    className="absolute inset-0 opacity-0 rotate-word text-blue-900"
                    style={{ animationDelay: `${index * 3}s` }}
                  >
                    {word}
                  </span>
                ))}
              </span>
            </span>
          </h1>

          <p className="mt-4 text-gray-900 text-lg sm:text-xl">
            One platform. Every stage of commercial vehicle procurement.
          </p>

          <p className="mt-2 text-gray-800 max-w-3xl mx-auto text-sm sm:text-base">
            Seamlessly connecting customers through upfitting, logistics, and beyond. Real-time tracking, intelligent recommendations, and automated documentation in a unified ecosystem.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AnimatedHeader


