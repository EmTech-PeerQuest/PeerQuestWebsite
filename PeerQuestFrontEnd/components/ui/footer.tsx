import { Star } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-[#2C1A1D] text-[#F4F0E6] py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* PeerQuest Tavern */}
          <div>
            <div className="flex items-center mb-4">
              <Star className="text-[#CDAA7D] mr-2" />
              <h3 className="text-xl font-bold">PeerQuest Tavern</h3>
            </div>
            <p className="text-sm text-[#F4F0E6]/80 mb-4">
              A fantasy-themed platform where adventurers can connect, collaborate, and share skills through quests and
              guilds.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[#CDAA7D] font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-[#F4F0E6]/80 hover:text-[#CDAA7D] transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="text-[#F4F0E6]/80 hover:text-[#CDAA7D] transition-colors">
                  Quest Board
                </a>
              </li>
              <li>
                <a href="#" className="text-[#F4F0E6]/80 hover:text-[#CDAA7D] transition-colors">
                  Guild Hall
                </a>
              </li>
              <li>
                <a href="#" className="text-[#F4F0E6]/80 hover:text-[#CDAA7D] transition-colors">
                  About
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[#CDAA7D] font-bold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="/terms-of-service" className="text-[#F4F0E6]/80 hover:text-[#CDAA7D] transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/privacy-policy" className="text-[#F4F0E6]/80 hover:text-[#CDAA7D] transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/cookie-policy" className="text-[#F4F0E6]/80 hover:text-[#CDAA7D] transition-colors">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-[#CDAA7D] font-bold mb-4">Connect</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://discord.gg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F4F0E6]/80 hover:text-[#CDAA7D] transition-colors"
                >
                  Discord
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F4F0E6]/80 hover:text-[#CDAA7D] transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F4F0E6]/80 hover:text-[#CDAA7D] transition-colors"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://reddit.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F4F0E6]/80 hover:text-[#CDAA7D] transition-colors"
                >
                  Reddit
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#CDAA7D]/20 mt-8 pt-8 text-center text-sm text-[#F4F0E6]/60">
          <p>© 2023 PeerQuest Tavern. All rights reserved. | Made with ❤️ by the PeerQuest Team</p>
        </div>
      </div>
    </footer>
  )
}
