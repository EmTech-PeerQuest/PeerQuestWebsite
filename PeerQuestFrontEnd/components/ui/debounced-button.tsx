'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useDebounce, useThrottle } from '@/hooks/use-debounce'
import { useClickSound } from '@/hooks/use-click-sound'

interface DebouncedButtonProps extends React.ComponentProps<typeof Button> {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>
  debounceMs?: number
  throttleMs?: number
  preventDuplicates?: boolean
  loadingText?: string
  successText?: string
  errorText?: string
  resetTextAfter?: number
  soundType?: 'button' | 'success' | 'error' | 'soft' | 'nav' | 'tab' | 'modal' | 'dropdown' | 'card' | 'hover'
}

/**
 * Enhanced Button component with spam prevention, loading states, and audio feedback
 */
export const DebouncedButton: React.FC<DebouncedButtonProps> = ({
  onClick,
  debounceMs = 300,
  throttleMs,
  preventDuplicates = true,
  loadingText = 'Loading...',
  successText,
  errorText,
  resetTextAfter = 2000,
  soundType = 'button',
  children,
  disabled,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [buttonState, setButtonState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [displayText, setDisplayText] = useState<React.ReactNode>(children)
  const { playSound } = useClickSound()

  const resetButtonState = useCallback(() => {
    setButtonState('idle')
    setDisplayText(children)
  }, [children])

  const handleClick = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!onClick || isLoading || (preventDuplicates && buttonState === 'loading')) {
      return
    }

    // Play click sound
    playSound(soundType)

    setIsLoading(true)
    setButtonState('loading')
    setDisplayText(loadingText)

    try {
      await onClick(event)
      
      if (successText) {
        setButtonState('success')
        setDisplayText(successText)
        setTimeout(resetButtonState, resetTextAfter)
      } else {
        resetButtonState()
      }
    } catch (error) {      
      if (errorText) {
        setButtonState('error')
        setDisplayText(errorText)
        setTimeout(resetButtonState, resetTextAfter)
      } else {
        resetButtonState()
      }
    } finally {
      setIsLoading(false)
    }
  }, [
    onClick,
    isLoading,
    preventDuplicates,
    buttonState,
    soundType,
    loadingText,
    successText,
    errorText,
    resetTextAfter,
    resetButtonState,
    playSound,
  ])

  // Apply debounce or throttle based on props
  const debouncedClick = useDebounce(handleClick, debounceMs)
  const throttledClick = useThrottle(handleClick, throttleMs || debounceMs)
  
  const finalClickHandler = throttleMs ? throttledClick : debouncedClick

  const getButtonVariant = () => {
    switch (buttonState) {
      case 'success':
        return 'default' // or 'success' if you have that variant
      case 'error':
        return 'destructive'
      case 'loading':
        return 'secondary'
      default:
        return props.variant || 'default'
    }
  }

  return (
    <Button
      {...props}
      variant={getButtonVariant()}
      disabled={disabled || isLoading || buttonState === 'loading'}
      onClick={finalClickHandler}
    >
      {displayText}
    </Button>
  )
}

/**
 * Quick preset for form submit buttons
 */
export const SubmitButton: React.FC<Omit<DebouncedButtonProps, 'soundType' | 'debounceMs'>> = (props) => (
  <DebouncedButton
    {...props}
    soundType="success"
    debounceMs={500}
    preventDuplicates={true}
    loadingText="Saving..."
    successText="Saved!"
    errorText="Error!"
  />
)

/**
 * Quick preset for navigation buttons
 */
export const NavButton: React.FC<Omit<DebouncedButtonProps, 'soundType' | 'debounceMs'>> = (props) => (
  <DebouncedButton
    {...props}
    soundType="nav"
    debounceMs={200}
    preventDuplicates={true}
  />
)

/**
 * Quick preset for dangerous actions (delete, etc.)
 */
export const DangerButton: React.FC<Omit<DebouncedButtonProps, 'soundType' | 'debounceMs'>> = (props) => (
  <DebouncedButton
    {...props}
    soundType="error"
    debounceMs={600}
    preventDuplicates={true}
    variant="destructive"
  />
)
