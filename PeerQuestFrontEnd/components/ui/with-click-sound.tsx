'use client'

import React, { forwardRef, useCallback } from 'react'
import { useClickSound, ClickSoundType } from '@/hooks/use-click-sound'
import { useAudioContext } from '@/context/audio-context'

export interface WithClickSoundProps {
  soundType?: ClickSoundType
  playOnClick?: boolean
  playOnHover?: boolean
  disabled?: boolean
  customSound?: string
}

// Utility component for adding click sounds to any element
export interface ClickSoundWrapperProps extends WithClickSoundProps {
  children: React.ReactNode
  as?: React.ElementType
  className?: string
  onClick?: (event: React.MouseEvent) => void
  onMouseEnter?: (event: React.MouseEvent) => void
  [key: string]: any
}

export const ClickSoundWrapper = forwardRef<HTMLElement, ClickSoundWrapperProps>(
  ({ 
    children, 
    as: Component = 'div', 
    soundType = 'button',
    playOnClick = true,
    playOnHover = false,
    disabled = false,
    customSound,
    className,
    onClick,
    onMouseEnter,
    ...props 
  }, ref) => {
    const { soundEnabled, volume } = useAudioContext()
    const { playSound } = useClickSound({ 
      enabled: soundEnabled && !disabled, 
      volume,
      soundType,
      customSound
    })

    const handleClick = useCallback((event: React.MouseEvent) => {
      if (playOnClick && soundEnabled && !disabled) {
        playSound(soundType)
      }
      onClick?.(event)
    }, [playOnClick, soundEnabled, disabled, soundType, playSound, onClick])

    const handleMouseEnter = useCallback((event: React.MouseEvent) => {
      if (playOnHover && soundEnabled && !disabled) {
        playSound('hover')
      }
      onMouseEnter?.(event)
    }, [playOnHover, soundEnabled, disabled, playSound, onMouseEnter])

    return (
      <Component
        ref={ref}
        className={className}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

ClickSoundWrapper.displayName = 'ClickSoundWrapper'

// Pre-configured components for common use cases
export const ClickSoundButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & WithClickSoundProps>(
  ({ soundType = 'button', playOnClick = true, playOnHover = false, disabled = false, customSound, onClick, onMouseEnter, ...props }, ref) => {
    const { soundEnabled, volume } = useAudioContext()
    const { playSound } = useClickSound({ 
      enabled: soundEnabled && !disabled, 
      volume,
      soundType,
      customSound
    })

    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (playOnClick && soundEnabled && !disabled) {
        playSound(soundType)
      }
      onClick?.(event)
    }, [playOnClick, soundEnabled, disabled, soundType, playSound, onClick])

    const handleMouseEnter = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (playOnHover && soundEnabled && !disabled) {
        playSound('hover')
      }
      onMouseEnter?.(event)
    }, [playOnHover, soundEnabled, disabled, playSound, onMouseEnter])

    return (
      <button
        ref={ref}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        disabled={disabled}
        {...props}
      />
    )
  }
)

ClickSoundButton.displayName = 'ClickSoundButton'

export const ClickSoundDiv = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & WithClickSoundProps>(
  ({ soundType = 'soft', playOnClick = true, playOnHover = false, disabled = false, customSound, onClick, onMouseEnter, ...props }, ref) => {
    const { soundEnabled, volume } = useAudioContext()
    const { playSound } = useClickSound({ 
      enabled: soundEnabled && !disabled, 
      volume,
      soundType,
      customSound
    })

    const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
      if (playOnClick && soundEnabled && !disabled) {
        playSound(soundType)
      }
      onClick?.(event)
    }, [playOnClick, soundEnabled, disabled, soundType, playSound, onClick])

    const handleMouseEnter = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
      if (playOnHover && soundEnabled && !disabled) {
        playSound('hover')
      }
      onMouseEnter?.(event)
    }, [playOnHover, soundEnabled, disabled, playSound, onMouseEnter])

    return (
      <div
        ref={ref}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        {...props}
      />
    )
  }
)

ClickSoundDiv.displayName = 'ClickSoundDiv'
