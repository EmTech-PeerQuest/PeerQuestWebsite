'use client';

import { useGoldBalance } from '@/context/GoldBalanceContext';
import { Loader2, Coins } from 'lucide-react';
import { useEffect, useState } from 'react';

interface GoldBalanceProps {
  openGoldPurchaseModal: () => void;
}

// Function to format numbers with k/M abbreviations
function formatLargeNumber(num: number): string {
  // Debug logging - remove this after testing
  console.log('formatLargeNumber called with:', num, typeof num);
  
  if (num >= 1000000) {
    const millions = Math.floor(num / 100000) / 10; // Truncate to 1 decimal place
    console.log('Using millions format:', millions);
    return millions % 1 === 0 ? millions.toString() + 'M' : millions.toFixed(1) + 'M';
  }
  if (num >= 10000) {
    const thousands = Math.floor(num / 100) / 10; // Truncate to 1 decimal place  
    console.log('Using thousands format:', thousands);
    return thousands % 1 === 0 ? thousands.toString() + 'k' : thousands.toFixed(1) + 'k';
  }
  console.log('Using normal format');
  return num.toLocaleString();
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
        
        setAnimateValue(Math.floor(currentValue)); // Use Math.floor to prevent rounding up
        
        if (progress < 1) {
          requestAnimationFrame(animateFrame);
        }
      };
      
      requestAnimationFrame(animateFrame);
    } else {
      setAnimateValue(goldBalance);
    }
  }, [goldBalance, prevBalance]);

  // Create a completely isolated click handler
  const handleGoldButtonClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Log to sessionStorage to persist through page refresh
    const logMessage = `ISOLATED Gold button clicked at ${new Date().toISOString()}`;
    sessionStorage.setItem('goldButtonLog', logMessage);
    
    // COMPLETELY STOP ALL EVENT PROPAGATION WITH MAXIMUM FORCE
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent?.preventDefault();
    e.nativeEvent?.stopPropagation();
    e.nativeEvent?.stopImmediatePropagation();
    
    // Use requestAnimationFrame to ensure we're outside the current event loop
    requestAnimationFrame(() => {
      try {
        openGoldPurchaseModal();
        sessionStorage.setItem('goldButtonLog', logMessage + ' - Modal opened successfully via RAF');
      } catch (error) {
        sessionStorage.setItem('goldButtonLog', logMessage + ' - Error: ' + error);
      }
    });
    
    return false;
  };

  return (
    <div 
      className="flex items-center"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {loading ? (
        <div className="flex items-center">
          <Loader2 className="w-4 h-4 text-[#CDAA7D] mr-2 animate-spin" />
          <span className="text-[#CDAA7D] font-medium">Loading...</span>
        </div>
      ) : (
        <div className="flex items-center">
          <Coins className="w-4 h-4 text-[#CDAA7D] mr-1.5" />
          <span className="text-[#CDAA7D] font-semibold mr-1">
            {formatLargeNumber(animateValue)}
          </span>
          <span className="text-[#CDAA7D] font-medium">Gold</span>
          <div
            role="button"
            tabIndex={0}
            onMouseDown={handleGoldButtonClick}
            onClick={handleGoldButtonClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleGoldButtonClick(e as any);
              }
            }}
            className="ml-2 text-xs bg-[#CDAA7D] text-white px-2 py-0.5 rounded hover:bg-[#B89A6D] transition-colors cursor-pointer select-none"
            aria-label="Buy gold"
          >
            +
          </div>
        </div>
      )}
    </div>
  );
}
