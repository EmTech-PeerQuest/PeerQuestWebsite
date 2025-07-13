'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Volume2, VolumeX, Play } from 'lucide-react'
import { useAudioContext } from '@/context/audio-context'
import { useClickSound, ClickSoundType } from '@/hooks/use-click-sound'

const soundDescriptions = {
  button: 'Crisp with warm resonance - perfect for primary actions',
  success: 'Rising chord progression - satisfying completion sound',
  nav: 'Smooth frequency sweep - seamless navigation feel',
  error: 'Clear descending tones - noticeable but not harsh',
  soft: 'Gentle, rounded tone - subtle interactions',
  tab: 'Balanced two-tone harmony - smooth switching',
  modal: 'Bell-like attention tone - draws focus gracefully',
  hover: 'Very subtle feedback - light touch response',
  dropdown: 'Soft interaction - menu and list selections',
  card: 'Satisfying card selection - engaging content interaction'
}

export function SatisfyingSoundPreview() {
  const { soundEnabled, volume, setSoundEnabled, setVolume } = useAudioContext()
  const { playSound } = useClickSound({ enabled: true, volume })

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    // Play a sample sound when adjusting volume
    playSound('button')
  }

  const testSound = (soundType: ClickSoundType) => {
    playSound(soundType)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#2C1A1D] mb-4">
          🎵 Satisfying Click Sounds Preview
        </h2>
        <p className="text-[#8B75AA] text-lg">
          Experience the enhanced audio design with rich harmonics, smooth envelopes, and subtle reverb
        </p>
      </div>

      {/* Audio Controls */}
      <div className="bg-gradient-to-r from-[#8B75AA]/10 to-[#CDAA7D]/10 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-center gap-6 mb-4">
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant={soundEnabled ? "default" : "outline"}
            className="flex items-center gap-2"
            soundType="soft"
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            {soundEnabled ? 'Sounds On' : 'Sounds Off'}
          </Button>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-32"
            />
            <span className="text-sm text-gray-600 w-8">{Math.round(volume * 100)}%</span>
          </div>
        </div>
        
        <p className="text-center text-sm text-gray-600">
          {soundEnabled 
            ? `Audio system active at ${Math.round(volume * 100)}% volume` 
            : 'Audio system disabled'
          }
        </p>
      </div>

      {/* Sound Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(soundDescriptions).map(([soundType, description]) => (
          <div
            key={soundType}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-[#2C1A1D] capitalize">
                  {soundType} Sound
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {description}
                </p>
              </div>
              <Button
                onClick={() => testSound(soundType as ClickSoundType)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={!soundEnabled}
                soundType={soundType as ClickSoundType}
              >
                <Play size={16} />
                Test
              </Button>
            </div>
            
            {/* Usage Examples */}
            <div className="text-xs text-gray-500 mt-2">
              <strong>Used for:</strong>{' '}
              {soundType === 'button' && 'Primary buttons, submit actions'}
              {soundType === 'success' && 'Form submissions, quest completions'}
              {soundType === 'nav' && 'Menu items, page navigation'}
              {soundType === 'error' && 'Error messages, validation failures'}
              {soundType === 'soft' && 'Cancel buttons, close actions'}
              {soundType === 'tab' && 'Tab switching, section changes'}
              {soundType === 'modal' && 'Modal opening, important notifications'}
              {soundType === 'hover' && 'Hover feedback (very subtle)'}
              {soundType === 'dropdown' && 'Dropdown menus, select options'}
              {soundType === 'card' && 'Card selections, quest cards'}
            </div>
          </div>
        ))}
      </div>

      {/* Technical Details */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-[#2C1A1D]">
          🎨 Enhanced Audio Design Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Sound Engineering:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>✅ Rich harmonic content for warmth</li>
              <li>✅ Smooth ADSR envelopes for natural feel</li>
              <li>✅ Subtle reverb for depth and space</li>
              <li>✅ Contextual frequencies for each interaction</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">User Experience:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>✅ 150ms duration for responsiveness</li>
              <li>✅ Non-intrusive but satisfying</li>
              <li>✅ Consistent volume levels</li>
              <li>✅ Graceful fallback when disabled</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Integration Examples */}
      <div className="mt-6 bg-[#F4F0E6] rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-[#2C1A1D]">
          🛠️ Try the Enhanced Button Component
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button soundType="button">Primary Action</Button>
          <Button variant="destructive" soundType="error">Delete Item</Button>
          <Button variant="outline" soundType="soft">Cancel</Button>
          <Button variant="secondary" soundType="tab">Switch Tab</Button>
          <Button variant="ghost" soundType="nav">Navigate</Button>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          The enhanced Button component automatically plays appropriate sounds based on the variant and soundType prop.
        </p>
      </div>
    </div>
  )
}
