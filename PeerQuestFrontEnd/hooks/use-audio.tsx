'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface AudioConfig {
  volume?: number
  playbackRate?: number
  loop?: boolean
  preload?: boolean
}

export interface UseAudioReturn {
  play: () => void
  pause: () => void
  stop: () => void
  isPlaying: boolean
  isLoaded: boolean
  volume: number
  setVolume: (volume: number) => void
  duration: number
  currentTime: number
}

export function useAudio(src: string, config: AudioConfig = {}): UseAudioReturn {
  const {
    volume = 0.5,
    playbackRate = 1,
    loop = false,
    preload = true,
  } = config

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentVolume, setCurrentVolume] = useState(volume)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio(src)
      audioRef.current.volume = currentVolume
      audioRef.current.playbackRate = playbackRate
      audioRef.current.loop = loop
      if (preload) {
        audioRef.current.preload = 'auto'
      }

      const audio = audioRef.current

      // Event listeners
      const handleCanPlay = () => setIsLoaded(true)
      const handlePlay = () => setIsPlaying(true)
      const handlePause = () => setIsPlaying(false)
      const handleEnded = () => setIsPlaying(false)
      const handleLoadedMetadata = () => setDuration(audio.duration)
      const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
      const handleError = (e: Event) => {
        console.warn(`Audio failed to load: ${src}`, e)
        setIsLoaded(false)
      }

      audio.addEventListener('canplay', handleCanPlay)
      audio.addEventListener('play', handlePlay)
      audio.addEventListener('pause', handlePause)
      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('error', handleError)

      return () => {
        audio.removeEventListener('canplay', handleCanPlay)
        audio.removeEventListener('play', handlePlay)
        audio.removeEventListener('pause', handlePause)
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('error', handleError)
      }
    }
  }, [src, currentVolume, playbackRate, loop, preload])

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      
      // Add slight volume fade-in for smoother playback
      const originalVolume = audioRef.current.volume
      audioRef.current.volume = originalVolume * 0.1
      
      audioRef.current.play().then(() => {
        // Quick fade-in to full volume for more satisfying feel
        const fadeSteps = 5
        let step = 0
        const fadeInterval = setInterval(() => {
          step++
          if (audioRef.current && step <= fadeSteps) {
            audioRef.current.volume = originalVolume * (0.1 + (0.9 * step / fadeSteps))
          }
          if (step >= fadeSteps) {
            clearInterval(fadeInterval)
          }
        }, 2)
      }).catch((error) => {
        console.warn('Audio play failed:', error)
        // Reset volume in case of error
        if (audioRef.current) {
          audioRef.current.volume = originalVolume
        }
      })
    }
  }, [])

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [])

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    setCurrentVolume(clampedVolume)
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume
    }
  }, [])

  return {
    play,
    pause,
    stop,
    isPlaying,
    isLoaded,
    volume: currentVolume,
    setVolume,
    duration,
    currentTime,
  }
}
