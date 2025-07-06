'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type ClickSoundType = 
  | 'button' 
  | 'nav' 
  | 'modal' 
  | 'success' 
  | 'error' 
  | 'hover'
  | 'tab'
  | 'dropdown'
  | 'card'
  | 'soft'

export interface ClickSoundConfig {
  enabled?: boolean
  volume?: number
  soundType?: ClickSoundType
  customSound?: string
}

export interface UseClickSoundReturn {
  playSound: (type?: ClickSoundType) => void
  setEnabled: (enabled: boolean) => void
  setVolume: (volume: number) => void
  isEnabled: boolean
  volume: number
}

// Map of sound types to their file paths
const SOUND_MAP: Record<ClickSoundType, string> = {
  button: '/audio/button-click.wav',
  nav: '/audio/nav-click.wav',
  modal: '/audio/modal-open.wav',
  success: '/audio/success-click.wav',
  error: '/audio/error-click.wav',
  hover: '/audio/hover-sound.wav',
  tab: '/audio/tab-click.wav',
  dropdown: '/audio/dropdown-click.wav',
  card: '/audio/card-click.wav',
  soft: '/audio/soft-click.wav',
}

export function useClickSound(config: ClickSoundConfig = {}): UseClickSoundReturn {
  const {
    enabled = true,
    volume = 0.3,
    soundType = 'button',
    customSound,
  } = config

  const [isEnabled, setIsEnabled] = useState(enabled)
  const [currentVolume, setCurrentVolume] = useState(volume)
  const audioInstancesRef = useRef<Map<string, HTMLAudioElement>>(new Map())

  // Initialize audio instances
  useEffect(() => {
    if (typeof window !== 'undefined' && isEnabled) {
      // Create audio instances for each sound type
      Object.entries(SOUND_MAP).forEach(([type, path]) => {
        if (!audioInstancesRef.current.has(type)) {
          const audio = new Audio(path)
          audio.volume = currentVolume
          audio.preload = 'auto'
          audioInstancesRef.current.set(type, audio)
        }
      })

      // Create custom sound instance if provided
      if (customSound && !audioInstancesRef.current.has('custom')) {
        const audio = new Audio(customSound)
        audio.volume = currentVolume
        audio.preload = 'auto'
        audioInstancesRef.current.set('custom', audio)
      }
    }

    return () => {
      // Cleanup audio instances
      audioInstancesRef.current.forEach((audio) => {
        audio.pause()
        audio.src = ''
      })
      audioInstancesRef.current.clear()
    }
  }, [isEnabled, customSound, currentVolume])

  // Update volume for all audio instances
  useEffect(() => {
    audioInstancesRef.current.forEach((audio) => {
      audio.volume = currentVolume
    })
  }, [currentVolume])

  const playSound = useCallback((type: ClickSoundType = soundType) => {
    if (!isEnabled) return

    const soundKey = customSound ? 'custom' : type
    const audio = audioInstancesRef.current.get(soundKey)
    
    if (audio) {
      // Reset audio to beginning and play
      audio.currentTime = 0
      audio.play().catch((error) => {
        console.warn(`Failed to play ${type} sound:`, error)
      })
    }
  }, [isEnabled, soundType, customSound])

  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled)
  }, [])

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    setCurrentVolume(clampedVolume)
  }, [])

  return {
    playSound,
    setEnabled,
    setVolume,
    isEnabled,
    volume: currentVolume,
  }
}

// Create a simple click sound function for quick use
export function createClickSoundHandler(type: ClickSoundType = 'button', volume: number = 0.3) {
  return (callback?: () => void) => {
    if (typeof window !== 'undefined') {
      const audio = new Audio(SOUND_MAP[type])
      audio.volume = volume
      audio.play().catch((error) => {
        console.warn(`Failed to play ${type} sound:`, error)
      })
    }
    callback?.()
  }
}
