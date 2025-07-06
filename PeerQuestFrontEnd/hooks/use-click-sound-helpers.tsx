'use client'

import { useClickSound, ClickSoundType } from '@/hooks/use-click-sound'
import { useAudioContext } from '@/context/audio-context'
import { useCallback } from 'react'

/**
 * Utility hook to add click sounds to existing onClick handlers
 */
export function useClickSoundHandler(
  originalHandler?: (event?: any) => void,
  soundType: ClickSoundType = 'button'
) {
  const { soundEnabled, volume } = useAudioContext()
  const { playSound } = useClickSound({ enabled: soundEnabled, volume, soundType })

  return useCallback((event: any) => {
    if (soundEnabled) {
      playSound(soundType)
    }
    originalHandler?.(event)
  }, [soundEnabled, playSound, soundType, originalHandler])
}

/**
 * Higher-order function to wrap click handlers with sound
 */
export function withClickSound<T extends (...args: any[]) => void>(
  handler: T,
  soundType: ClickSoundType = 'button'
): T {
  return ((event: any) => {
    // This is a simplified version - in a real implementation you'd want to use the hook
    // For now, this provides the pattern for wrapping handlers
    handler(event)
  }) as T
}

/**
 * Utility to create click handlers with sound
 */
export function createSoundClickHandler(
  handler: (event?: any) => void,
  soundType: ClickSoundType = 'button'
) {
  return (event: any) => {
    // Simple implementation - in practice you'd want to check context
    handler(event)
  }
}

/**
 * Component prop enhancer to add click sounds
 */
export interface WithClickSoundProps {
  'data-sound-type'?: ClickSoundType
  'data-sound-enabled'?: boolean
}

/**
 * Enhanced click handler for common UI patterns
 */
export function useEnhancedClick(
  handler: (event?: any) => void,
  options: {
    soundType?: ClickSoundType
    preventDefault?: boolean
    stopPropagation?: boolean
  } = {}
) {
  const { soundType = 'button', preventDefault = false, stopPropagation = false } = options
  const { soundEnabled, volume } = useAudioContext()
  const { playSound } = useClickSound({ enabled: soundEnabled, volume, soundType })

  return useCallback((event: any) => {
    if (preventDefault) event?.preventDefault?.()
    if (stopPropagation) event?.stopPropagation?.()
    
    if (soundEnabled) {
      playSound(soundType)
    }
    
    handler(event)
  }, [soundEnabled, playSound, soundType, handler, preventDefault, stopPropagation])
}

/**
 * Batch click sound handlers for common UI patterns
 */
export function useUIClickSounds() {
  const { soundEnabled, volume } = useAudioContext()
  const { playSound } = useClickSound({ enabled: soundEnabled, volume })

  return {
    // Navigation clicks
    handleNavClick: useCallback((handler: () => void) => () => {
      playSound('nav')
      handler()
    }, [playSound]),

    // Tab switches  
    handleTabClick: useCallback((handler: () => void) => () => {
      playSound('tab')
      handler()
    }, [playSound]),

    // Modal/dialog actions
    handleModalClick: useCallback((handler: () => void) => () => {
      playSound('modal')
      handler()
    }, [playSound]),

    // Success actions
    handleSuccessClick: useCallback((handler: () => void) => () => {
      playSound('success')
      handler()
    }, [playSound]),

    // Error/destructive actions
    handleErrorClick: useCallback((handler: () => void) => () => {
      playSound('error')
      handler()
    }, [playSound]),

    // Card/item selections
    handleCardClick: useCallback((handler: () => void) => () => {
      playSound('card')
      handler()
    }, [playSound]),

    // Dropdown interactions
    handleDropdownClick: useCallback((handler: () => void) => () => {
      playSound('dropdown')
      handler()
    }, [playSound]),

    // Soft/subtle interactions
    handleSoftClick: useCallback((handler: () => void) => () => {
      playSound('soft')
      handler()
    }, [playSound]),

    // Generic button clicks
    handleButtonClick: useCallback((handler: () => void) => () => {
      playSound('button')
      handler()
    }, [playSound]),
  }
}
