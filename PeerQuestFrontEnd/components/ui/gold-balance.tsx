'use client';

import { useGoldBalance } from '@/context/GoldBalanceContext';
import { Loader2, Coins } from 'lucide-react';
import { useEffect, useState } from 'react';

interface GoldBalanceProps {
  openGoldPurchaseModal: () => void;
}

export function GoldBalance({ openGoldPurchaseModal }: GoldBalanceProps) {
  const { goldBalance, loading, refreshBalance } = useGoldBalance();
  const [animateValue, setAnimateValue] = useState(0);
  const [prevBalance, setPrevBalance] = useState(0);

  // Animate gold value when it changes
  useEffect(() => {
    if (goldBalance !== prevBalance) {
      // If value increased, animate from prev to new
      const start = prevBalance;
      const end = goldBalance;
      const duration = 1000; // 1 second animation
      const startTime = Date.now();
      
      setPrevBalance(goldBalance);
      
      const animateFrame = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentValue = start + (end - start) * easeOutCubic;
        
        setAnimateValue(Math.round(currentValue));
        
        if (progress < 1) {
          requestAnimationFrame(animateFrame);
        }
      };
      
      requestAnimationFrame(animateFrame);
    } else {
      setAnimateValue(goldBalance);
    }
  }, [goldBalance, prevBalance]);

  return (
    <div className="flex items-center">
      {loading ? (
        <div className="flex items-center">
          <Loader2 className="w-4 h-4 text-[#CDAA7D] mr-2 animate-spin" />
          <span className="text-[#CDAA7D] font-medium">Loading...</span>
        </div>
      ) : (
        <div className="flex items-center">
          <Coins className="w-4 h-4 text-[#CDAA7D] mr-1.5" />
          <span className="text-[#CDAA7D] font-semibold mr-1">
            {animateValue.toLocaleString()}
          </span>
          <span className="text-[#CDAA7D] font-medium">Gold</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openGoldPurchaseModal();
              refreshBalance(); // Refresh after purchase
            }}
            className="ml-2 text-xs bg-[#CDAA7D] text-white px-2 py-0.5 rounded hover:bg-[#B89A6D] transition-colors"
            aria-label="Buy gold"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
