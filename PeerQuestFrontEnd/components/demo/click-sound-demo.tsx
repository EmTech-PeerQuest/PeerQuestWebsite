'use client'

import React from 'react'
import { Button } from '@/components/ui/button-with-sound'
import { ClickSoundWrapper, ClickSoundButton, ClickSoundDiv } from '@/components/ui/with-click-sound'
import { AudioSettings } from '@/components/ui/audio-settings'
import { useClickSound } from '@/hooks/use-click-sound'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ClickSoundDemo() {
  const { playSound } = useClickSound()

  const soundTypes = [
    { type: 'button', label: 'Button Click', description: 'Standard button interaction' },
    { type: 'nav', label: 'Navigation', description: 'Menu and navigation sounds' },
    { type: 'modal', label: 'Modal Open', description: 'Dialog and modal opening' },
    { type: 'success', label: 'Success', description: 'Successful action confirmation' },
    { type: 'error', label: 'Error', description: 'Error or warning alert' },
    { type: 'hover', label: 'Hover', description: 'Subtle hover effect' },
    { type: 'tab', label: 'Tab Switch', description: 'Tab switching sound' },
    { type: 'dropdown', label: 'Dropdown', description: 'Dropdown menu interaction' },
    { type: 'card', label: 'Card Click', description: 'Card or item selection' },
    { type: 'soft', label: 'Soft Click', description: 'Subtle, gentle interaction' },
  ] as const

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#2C1A1D] mb-4">
          🎵 PeerQuest Click Sounds Demo
        </h1>
        <p className="text-lg text-[#8B75AA] max-w-2xl mx-auto">
          Experience interactive audio feedback throughout the PeerQuest Tavern. 
          Click the buttons below to test different sound types and adjust your audio preferences.
        </p>
      </div>

      {/* Audio Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Audio Settings</CardTitle>
          <CardDescription>
            Control your audio experience and test volume levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AudioSettings compact showTitle={false} />
        </CardContent>
      </Card>

      {/* Sound Type Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Sound Type Testing</CardTitle>
          <CardDescription>
            Click each button to hear different types of click sounds used throughout the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {soundTypes.map(({ type, label, description }) => (
              <div key={type} className="p-4 border rounded-lg hover:bg-[#F4F0E6] transition-colors">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-[#2C1A1D]">{label}</h3>
                  <p className="text-sm text-[#8B75AA]">{description}</p>
                  <Button
                    soundType={type}
                    onClick={() => playSound(type)}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Play {label} Sound
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Component Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Component Examples</CardTitle>
          <CardDescription>
            Examples of different components with integrated click sounds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Standard Buttons */}
          <div className="space-y-2">
            <h3 className="font-semibold text-[#2C1A1D]">Enhanced Buttons</h3>
            <div className="flex flex-wrap gap-2">
              <Button soundType="button">Primary Button</Button>
              <Button variant="outline" soundType="soft">Outline Button</Button>
              <Button variant="destructive" soundType="error">Destructive Button</Button>
              <Button variant="secondary" soundType="tab">Secondary Button</Button>
              <Button variant="ghost" soundType="hover">Ghost Button</Button>
            </div>
          </div>

          {/* Click Sound Wrapper Examples */}
          <div className="space-y-2">
            <h3 className="font-semibold text-[#2C1A1D]">Clickable Elements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ClickSoundWrapper
                soundType="card"
                className="p-4 border-2 border-dashed border-[#CDAA7D] rounded-lg cursor-pointer hover:bg-[#CDAA7D]/10 transition-colors"
              >
                <div className="text-center">
                  <h4 className="font-medium text-[#2C1A1D]">Clickable Card</h4>
                  <p className="text-sm text-[#8B75AA]">Click anywhere on this card</p>
                </div>
              </ClickSoundWrapper>

              <ClickSoundDiv
                soundType="nav"
                className="p-4 border-2 border-dashed border-[#8B75AA] rounded-lg cursor-pointer hover:bg-[#8B75AA]/10 transition-colors"
              >
                <div className="text-center">
                  <h4 className="font-medium text-[#2C1A1D]">Navigation Element</h4>
                  <p className="text-sm text-[#8B75AA]">With navigation sound</p>
                </div>
              </ClickSoundDiv>
            </div>
          </div>

          {/* Interactive Elements */}
          <div className="space-y-2">
            <h3 className="font-semibold text-[#2C1A1D]">Interactive Elements</h3>
            <div className="flex flex-wrap gap-2">
              <ClickSoundButton
                soundType="success"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                Success Action
              </ClickSoundButton>
              
              <ClickSoundButton
                soundType="dropdown"
                className="bg-[#CDAA7D] hover:bg-[#B8941F] text-[#2C1A1D] px-4 py-2 rounded"
              >
                Dropdown Menu
              </ClickSoundButton>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Guide</CardTitle>
          <CardDescription>
            How to add click sounds to your components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-[#2C1A1D] mb-2">Method 1: Enhanced Button Component</h4>
              <pre className="bg-[#F4F0E6] p-3 rounded text-sm overflow-x-auto">
                <code>{`import { Button } from '@/components/ui/button-with-sound'

<Button soundType="success" playClickSound={true}>
  Save Changes
</Button>`}</code>
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-[#2C1A1D] mb-2">Method 2: Click Sound Wrapper</h4>
              <pre className="bg-[#F4F0E6] p-3 rounded text-sm overflow-x-auto">
                <code>{`import { ClickSoundWrapper } from '@/components/ui/with-click-sound'

<ClickSoundWrapper soundType="card" as="div">
  <div>Your clickable content</div>
</ClickSoundWrapper>`}</code>
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-[#2C1A1D] mb-2">Method 3: Custom Hook</h4>
              <pre className="bg-[#F4F0E6] p-3 rounded text-sm overflow-x-auto">
                <code>{`import { useClickSound } from '@/hooks/use-click-sound'

function MyComponent() {
  const { playSound } = useClickSound()
  
  const handleClick = () => {
    playSound('button')
    // Your click logic here
  }
  
  return <button onClick={handleClick}>Click me</button>
}`}</code>
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
