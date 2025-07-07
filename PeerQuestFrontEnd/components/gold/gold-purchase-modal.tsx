"use client"

import { X, CircleDollarSign, Shield } from "lucide-react"
import type { User } from "@/lib/types"

interface GoldPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: User | null
  setCurrentUser: (user: User | ((prev: User) => User)) => void
  showToast: (message: string, type?: string) => void
}

export function GoldPurchaseModal({ isOpen, onClose, currentUser, setCurrentUser, showToast }: GoldPurchaseModalProps) {
  if (!isOpen) return null

  const purchaseGold = (amount: number, price: number) => {
    if (!currentUser) {
      showToast("Please log in to purchase gold", "error")
      return
    }

    setCurrentUser((prev) => ({
      ...prev,
      gold: (prev.gold || 0) + amount,
    }))

    onClose()
    showToast(`Successfully purchased ${amount} gold!`)
  }

  const packages = [
    { amount: 100, price: 50, popular: false },
    { amount: 250, price: 120, popular: true },
    { amount: 500, price: 230, popular: false },
    { amount: 1000, price: 450, popular: false },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-tavern-brown/10">
          <h2 className="text-2xl font-bold font-medieval">Purchase Gold</h2>
          <button onClick={onClose} className="p-1 hover:bg-tavern-brown/10 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="mb-6 text-center text-tavern-brown/80">
            Choose a gold package to enhance your questing experience
          </p>

          <div className="space-y-4">
            {packages.map((pkg) => (
              <div
                key={pkg.amount}
                className={`card p-5 cursor-pointer relative transition-all hover:shadow-lg ${
                  pkg.popular ? "border-2 border-tavern-purple" : ""
                }`}
                onClick={() => purchaseGold(pkg.amount, pkg.price)}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-tavern-purple text-white px-3 py-1 rounded-full text-xs font-bold">
                    Most Popular
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <CircleDollarSign size={32} className="text-tavern-gold" />
                    <div>
                      <div className="text-xl font-bold">{pkg.amount} Gold</div>
                      <div className="text-sm text-tavern-brown/70">₱{pkg.price} PHP</div>
                    </div>
                  </div>
                  <div className="text-sm text-tavern-purple font-semibold">
                    ₱{(pkg.price / pkg.amount).toFixed(2)} per gold
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-tavern-purple/10 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-tavern-purple" />
              <span className="font-semibold text-sm">Secure Payment</span>
            </div>
            <p className="text-xs text-tavern-brown/70">
              All transactions are secured with industry-standard encryption. Gold will be added to your account
              immediately after payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
