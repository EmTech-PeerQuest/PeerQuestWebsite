'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface AudioContextValue {
  soundEnabled: boolean
  volume: number
  setSoundEnabled: (enabled: boolean) => void
  setVolume: (volume: number) => void
  isMuted: boolean
  setMuted: (muted: boolean) => void
  audioQuality: 'standard' | 'enhanced'
  setAudioQuality: (quality: 'standard' | 'enhanced') => void
}

const AudioContext = createContext<AudioContextValue | undefined>(undefined)

export interface AudioProviderProps {
  children: ReactNode
}

export function AudioProvider({ children }: AudioProviderProps) {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [volume, setVolume] = useState(0.3)
  const [isMuted, setMuted] = useState(false)
  const [audioQuality, setAudioQuality] = useState<'standard' | 'enhanced'>('enhanced')

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('peerquest-audio-settings')
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings)
          setSoundEnabled(settings.soundEnabled ?? true)
          setVolume(settings.volume ?? 0.3)
          setMuted(settings.isMuted ?? false)
          setAudioQuality(settings.audioQuality ?? 'enhanced')
        } catch (error) {
          console.warn('Failed to load audio settings:', error)
        }
      }
    }
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const settings = {
        soundEnabled,
        volume,
        isMuted,
        audioQuality,
      }
      localStorage.setItem('peerquest-audio-settings', JSON.stringify(settings))
    }
  }, [soundEnabled, volume, isMuted, audioQuality])

  const value: AudioContextValue = {
    soundEnabled,
    volume: isMuted ? 0 : volume,
    setSoundEnabled,
    setVolume,
    isMuted,
    setMuted,
    audioQuality,
    setAudioQuality,
  }

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  )
}

export function useAudioContext() {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error('useAudioContext must be used within an AudioProvider')
  }
  return context
}
