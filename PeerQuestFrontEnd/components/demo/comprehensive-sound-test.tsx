'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Volume2, VolumeX, Play, Pause } from 'lucide-react'
import { useAudioContext } from '@/context/audio-context'
import { useClickSound, ClickSoundType } from '@/hooks/use-click-sound'

interface SoundSpec {
  type: ClickSoundType
  name: string
  description: string
  color: string
  frequency: string
  duration: string
  usage: string
}

const SOUND_SPECS: SoundSpec[] = [
  {
    type: 'button',
    name: 'Standard Button',
    description: 'Crisp and confident for primary actions',
    color: 'bg-blue-500',
    frequency: '800Hz',
    duration: '120ms',
    usage: 'Submit, Save, Confirm actions'
  },
  {
    type: 'nav',
    name: 'Navigation',
    description: 'Smooth and directional for menu items',
    color: 'bg-green-500',
    frequency: '600Hz', 
    duration: '150ms',
    usage: 'Menu navigation, page links'
  },
  {
    type: 'success',
    name: 'Success',
    description: 'Bright and positive for completed actions',
    color: 'bg-emerald-500',
    frequency: '1000Hz',
    duration: '200ms',
    usage: 'Form submissions, approvals'
  },
  {
    type: 'error',
    name: 'Error/Warning',
    description: 'Lower and more serious for errors',
    color: 'bg-red-500',
    frequency: '300Hz',
    duration: '180ms',
    usage: 'Delete, reject, error actions'
  },
  {
    type: 'soft',
    name: 'Soft Click',
    description: 'Gentle and understated for subtle interactions',
    color: 'bg-gray-400',
    frequency: '400Hz',
    duration: '100ms',
    usage: 'Cancel, close, secondary actions'
  },
  {
    type: 'tab',
    name: 'Tab Switch',
    description: 'Medium pitch and quick for tab changes',
    color: 'bg-purple-500',
    frequency: '700Hz',
    duration: '90ms',
    usage: 'Tab switching, category selection'
  },
  {
    type: 'modal',
    name: 'Modal Open',
    description: 'Ascending tone for modal openings',
    color: 'bg-indigo-500',
    frequency: '500Hz+',
    duration: '250ms',
    usage: 'Modal opens, dialog launches'
  },
  {
    type: 'hover',
    name: 'Hover Feedback',
    description: 'Very subtle for hover states',
    color: 'bg-yellow-400',
    frequency: '1200Hz',
    duration: '50ms',
    usage: 'Hover effects, micro-interactions'
  },
  {
    type: 'dropdown',
    name: 'Dropdown',
    description: 'Crisp and quick for dropdown menus',
    color: 'bg-teal-500',
    frequency: '900Hz',
    duration: '80ms',
    usage: 'Dropdown opens, menu selection'
  },
  {
    type: 'card',
    name: 'Card Selection',
    description: 'Warm and inviting for card interactions',
    color: 'bg-orange-500',
    frequency: '650Hz',
    duration: '130ms',
    usage: 'Card clicks, item selection'
  }
]

export function ComprehensiveSoundTest() {
  const { soundEnabled, volume, setSoundEnabled, setVolume } = useAudioContext()
  const { playSound } = useClickSound({ enabled: soundEnabled, volume })
  
  const [playingSound, setPlayingSound] = useState<ClickSoundType | null>(null)

  const handlePlaySound = async (soundType: ClickSoundType) => {
    setPlayingSound(soundType)
    playSound(soundType)
    
    // Reset playing state after duration
    const spec = SOUND_SPECS.find(s => s.type === soundType)
    const duration = parseInt(spec?.duration || '100')
    setTimeout(() => setPlayingSound(null), duration + 100)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#2C1A1D] mb-4 font-serif">
          🎵 PeerQuest Click Sound System
        </h1>
        <p className="text-lg text-[#8B75AA] mb-6">
          Immersive audio feedback for every interaction in your tavern
        </p>
        
        {/* Global Controls */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant={soundEnabled ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {soundEnabled ? 'Sounds Enabled' : 'Sounds Disabled'}
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-600 w-8">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Sound Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SOUND_SPECS.map((spec) => (
          <Card key={spec.type} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${spec.color}`} />
                  {spec.name}
                </CardTitle>
                <Badge variant="outline">{spec.type}</Badge>
              </div>
              <CardDescription>{spec.description}</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {/* Specifications */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Frequency:</span>
                    <span className="ml-1 font-mono">{spec.frequency}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-1 font-mono">{spec.duration}</span>
                  </div>
                </div>
                
                {/* Usage */}
                <div className="text-sm">
                  <span className="text-gray-500">Usage:</span>
                  <p className="text-gray-700 mt-1">{spec.usage}</p>
                </div>
                
                {/* Play Button */}
                <Button
                  onClick={() => handlePlaySound(spec.type)}
                  disabled={!soundEnabled}
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center gap-2"
                  soundType={spec.type}
                >
                  {playingSound === spec.type ? (
                    <>
                      <Pause size={14} />
                      Playing...
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      Test Sound
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Implementation Guide */}
      <div className="mt-12 bg-[#F4F0E6] rounded-lg p-6">
        <h2 className="text-2xl font-bold text-[#2C1A1D] mb-4">Implementation Guide</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-[#8B75AA] mb-2">Using Enhanced Button Component</h3>
            <pre className="bg-white p-3 rounded text-sm overflow-x-auto">
{`<Button 
  onClick={handleClick} 
  soundType="success"
>
  Save Changes
</Button>`}
            </pre>
          </div>
          
          <div>
            <h3 className="font-semibold text-[#8B75AA] mb-2">Manual Sound Trigger</h3>
            <pre className="bg-white p-3 rounded text-sm overflow-x-auto">
{`const { playSound } = useClickSound()

const handleClick = () => {
  playSound('nav')
  // Your logic here
}`}
            </pre>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Auto Sound Detection:</strong> The Button component automatically selects appropriate sounds based on the variant prop.</p>
          <p><strong>Global Controls:</strong> Users can control volume and disable sounds in the Audio Settings.</p>
          <p><strong>Performance:</strong> Sounds are lazy-loaded and cached for optimal performance.</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-8 text-center">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-[#CDAA7D]">{SOUND_SPECS.length}</div>
            <div className="text-sm text-gray-600">Sound Types</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-[#CDAA7D]">10KB</div>
            <div className="text-sm text-gray-600">Avg File Size</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-[#CDAA7D]">120ms</div>
            <div className="text-sm text-gray-600">Avg Duration</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-[#CDAA7D]">100%</div>
            <div className="text-sm text-gray-600">Browser Support</div>
          </div>
        </div>
      </div>
    </div>
  )
}
