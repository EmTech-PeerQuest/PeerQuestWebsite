'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useClickSound } from '@/hooks/use-click-sound'
import { useAudioContext } from '@/context/audio-context'
import { Play, Volume2, VolumeX } from 'lucide-react'

const soundDescriptions = {
  button: {
    name: 'Primary Button',
    description: 'Crisp click with warm resonance - perfect for main actions',
    context: 'Submit, Save, Confirm buttons'
  },
  success: {
    name: 'Success Action',
    description: 'Rising chord progression - satisfying completion sound',
    context: 'Form submissions, successful purchases, quest completion'
  },
  nav: {
    name: 'Navigation',
    description: 'Smooth frequency sweep - feels like smooth movement',
    context: 'Menu items, page navigation, breadcrumbs'
  },
  error: {
    name: 'Error/Warning',
    description: 'Clear descending tones - attention-getting but not harsh',
    context: 'Form errors, failed actions, warnings'
  },
  soft: {
    name: 'Subtle Interaction',
    description: 'Gentle, rounded tone - non-intrusive feedback',
    context: 'Cancel buttons, close actions, secondary interactions'
  },
  tab: {
    name: 'Tab Switch',
    description: 'Balanced two-tone harmony - smooth transitions',
    context: 'Tab switching, category selection, filters'
  },
  modal: {
    name: 'Modal/Dialog',
    description: 'Bell-like attention tone - draws focus without being jarring',
    context: 'Modal opening, important notifications, alerts'
  },
  hover: {
    name: 'Hover Feedback',
    description: 'Very subtle feedback - barely noticeable but satisfying',
    context: 'Button hover states, interactive element preview'
  },
  dropdown: {
    name: 'Dropdown',
    description: 'Soft interaction sound - gentle menu opening',
    context: 'Dropdown menus, select boxes, expandable content'
  },
  card: {
    name: 'Card Selection',
    description: 'Card interaction sound - engaging but not overwhelming',
    context: 'Quest cards, guild cards, user profiles'
  }
}

export function SatisfyingSoundPreview() {
  const { soundEnabled, volume, setSoundEnabled, setVolume } = useAudioContext()
  const { playSound } = useClickSound({ enabled: true, volume: Math.max(volume, 0.5) })

  const handleTestSound = (soundType: keyof typeof soundDescriptions) => {
    // Always play at a good volume for testing
    playSound(soundType)
  }

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#2C1A1D] mb-2">🎵 Satisfying Click Sounds</h1>
        <p className="text-[#8B75AA] mb-4">
          Enhanced audio design with rich harmonics, smooth envelopes, and contextual frequencies
        </p>
        
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            onClick={toggleSound}
            variant={soundEnabled ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            {soundEnabled ? "Sounds Enabled" : "Sounds Disabled"}
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-sm w-8">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(soundDescriptions).map(([soundType, info]) => (
          <Card key={soundType} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-[#2C1A1D]">{info.name}</CardTitle>
                <Button
                  onClick={() => handleTestSound(soundType as keyof typeof soundDescriptions)}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 hover:bg-[#CDAA7D]/10"
                >
                  <Play size={14} />
                  Test
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-[#8B75AA] leading-relaxed">
                {info.description}
              </p>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-600">
                  <strong>Used for:</strong> {info.context}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-gradient-to-r from-[#8B75AA]/10 to-[#CDAA7D]/10 rounded-lg p-6">
        <h3 className="text-xl font-bold text-[#2C1A1D] mb-3">🎨 Audio Design Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-[#8B75AA] mb-2">Sound Design</h4>
            <ul className="space-y-1 text-gray-600">
              <li>✅ Rich harmonic content for warmth</li>
              <li>✅ Smooth ADSR envelopes for natural feel</li>
              <li>✅ Subtle reverb for depth and space</li>
              <li>✅ Contextual frequencies for each interaction</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[#8B75AA] mb-2">User Experience</h4>
            <ul className="space-y-1 text-gray-600">
              <li>✅ Optimized 150ms duration for responsiveness</li>
              <li>✅ Volume-aware mixing</li>
              <li>✅ Satisfying but not intrusive</li>
              <li>✅ Consistent audio branding</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          🏰 These enhanced sounds will make your PeerQuest tavern feel more alive and engaging!
        </p>
      </div>
    </div>
  )
}
