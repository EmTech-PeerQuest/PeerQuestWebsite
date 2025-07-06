'use client'

import { useRef, useCallback } from 'react'

/**
 * Custom hook for debouncing function calls
 * Prevents rapid successive calls to the same function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        func(...args)
      }, delay)
    },
    [func, delay]
  )

  return debouncedFunction
}

/**
 * Custom hook for throttling function calls
 * Ensures function is called at most once per specified interval
 */
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastCallRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const throttledFunction = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      const timeSinceLastCall = now - lastCallRef.current

      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now
        func(...args)
      } else {
        // Schedule the function to be called after the remaining delay
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now()
          func(...args)
        }, delay - timeSinceLastCall)
      }
    },
    [func, delay]
  )

  return throttledFunction
}

/**
 * Custom hook for preventing duplicate API calls
 * Ensures only one instance of a function runs at a time
 */
export function usePreventDuplicates<T extends (...args: any[]) => Promise<any>>(
  func: T
): [(...args: Parameters<T>) => Promise<void>, boolean] {
  const isRunningRef = useRef(false)

  const wrappedFunction = useCallback(
    async (...args: Parameters<T>) => {
      if (isRunningRef.current) {
        return // Prevent duplicate calls
      }

      isRunningRef.current = true
      try {
        await func(...args)
      } finally {
        isRunningRef.current = false
      }
    },
    [func]
  )

  return [wrappedFunction, isRunningRef.current]
}
