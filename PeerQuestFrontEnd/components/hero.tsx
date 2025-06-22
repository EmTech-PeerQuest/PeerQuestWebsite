"use client"

import { useState } from "react"
import type { User } from "@/lib/types"

interface HeroProps {
  currentUser: User | null
  openAuthModal: () => void
  openRegisterModal: () => void
  navigateToSection: (section: string) => void
}

export function Hero({ currentUser, openAuthModal, openRegisterModal, navigateToSection }: HeroProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <section className="relative bg-[#2C1A1D] text-white min-h-[80vh] flex items-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-[url('/placeholder.svg?height=100&width=100')] bg-repeat"></div>
      </div>

      <div className="container mx-auto px-6 py-12 relative z-10">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-serif">
              Welcome to <span className="text-[#CDAA7D]">PeerQuest Tavern</span>
            </h1>
            <p className="text-xl mb-8 text-gray-300">
              A collaborative platform where adventurers gather to share skills, complete quests, and form guilds.
            </p>

            <div className="flex flex-wrap gap-4">
              {!currentUser ? (
                <>
                  <button
                    onClick={openAuthModal}
                    className="px-6 py-3 bg-[#CDAA7D] text-[#2C1A1D] font-bold rounded-lg hover:bg-[#BF9B6E] transition-colors"
                  >
                    JOIN THE TAVERN
                  </button>
                  <button
                    onClick={openRegisterModal}
                    className="px-6 py-3 border-2 border-[#CDAA7D] text-[#CDAA7D] font-bold rounded-lg hover:bg-[#CDAA7D] hover:text-[#2C1A1D] transition-colors"
                  >
                    LEARN MORE
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigateToSection("quest-board")}
                    className="px-6 py-3 bg-[#CDAA7D] text-[#2C1A1D] font-bold rounded-lg hover:bg-[#BF9B6E] transition-colors"
                  >
                    BROWSE QUESTS
                  </button>
                  <button
                    onClick={() => navigateToSection("guild-hall")}
                    className="px-6 py-3 border-2 border-[#CDAA7D] text-[#CDAA7D] font-bold rounded-lg hover:bg-[#CDAA7D] hover:text-[#2C1A1D] transition-colors"
                  >
                    VISIT GUILD HALL
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="md:w-1/2 flex justify-center">
            <div
              className="relative w-80 h-80 bg-[#8B75AA] rounded-lg overflow-hidden transform transition-transform duration-500"
              style={{
                transform: isHovered ? "rotate(5deg)" : "rotate(0deg)",
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=400')] bg-cover bg-center opacity-30"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <span className="text-6xl mb-4">🏆</span>
                <h3 className="text-2xl font-bold mb-2">Join the Adventure</h3>
                <p className="text-sm">
                  Connect with skilled peers, showcase your talents, and earn rewards by completing quests.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12 font-serif">Why Join Our Tavern?</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Skill Showcase */}
            <div className="bg-[#3C2A2D] p-6 rounded-lg text-center hover:transform hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-[#CDAA7D] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🔧</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Skill Showcase</h3>
              <p className="text-gray-300">
                Display your talents through completed quests and build a portfolio that showcases your abilities to
                potential collaborators.
              </p>
            </div>

            {/* Guild System */}
            <div className="bg-[#3C2A2D] p-6 rounded-lg text-center hover:transform hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-[#CDAA7D] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Guild System</h3>
              <p className="text-gray-300">
                Join specialized guilds to connect with like-minded individuals, share resources, and collaborate on
                larger projects.
              </p>
            </div>

            {/* Reputation System */}
            <div className="bg-[#3C2A2D] p-6 rounded-lg text-center hover:transform hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-[#CDAA7D] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Reputation System</h3>
              <p className="text-gray-300">
                Earn badges and increase your reputation by successfully completing quests and receiving positive
                feedback from other adventurers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
