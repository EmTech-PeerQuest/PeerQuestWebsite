'use client'

import React from 'react'
import { Volume2, VolumeX, Volume1 } from 'lucide-react'
import { useAudioContext } from '@/context/audio-context'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export interface AudioSettingsProps {
  className?: string
  showTitle?: boolean
  compact?: boolean
}

export function AudioSettings({ className, showTitle = true, compact = false }: AudioSettingsProps) {
  const { soundEnabled, volume, setSoundEnabled, setVolume, isMuted, setMuted } = useAudioContext()

  const handleVolumeChange = (values: number[]) => {
    setVolume(values[0])
  }

  const toggleMute = () => {
    setMuted(!isMuted)
  }

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="h-4 w-4" />
    } else if (volume < 0.5) {
      return <Volume1 className="h-4 w-4" />
    } else {
      return <Volume2 className="h-4 w-4" />
    }
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          title={isMuted ? "Unmute sounds" : "Mute sounds"}
        >
          {getVolumeIcon()}
        </Button>
        <div className="flex items-center gap-2 min-w-[100px]">
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={1}
            step={0.1}
            className="flex-1"
            disabled={!soundEnabled}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={soundEnabled}
            onCheckedChange={setSoundEnabled}
            id="sound-enabled"
          />
          <Label htmlFor="sound-enabled" className="text-sm font-medium">
            Sound
          </Label>
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio Settings
          </CardTitle>
          <CardDescription>
            Control click sounds and audio feedback for the application
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sound-enabled">Enable Click Sounds</Label>
            <p className="text-sm text-muted-foreground">
              Play sound effects when interacting with buttons and UI elements
            </p>
          </div>
          <Switch
            checked={soundEnabled}
            onCheckedChange={setSoundEnabled}
            id="sound-enabled"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="volume">Volume</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="h-8 w-8 p-0"
            >
              {getVolumeIcon()}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Slider
              value={[isMuted ? 0 : volume]}
              onValueChange={handleVolumeChange}
              max={1}
              step={0.1}
              className="flex-1"
              disabled={!soundEnabled}
            />
            <span className="text-sm text-muted-foreground w-10 text-right">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Adjust the volume level for click sounds
          </p>
        </div>

        {soundEnabled && (
          <div className="text-sm text-muted-foreground">
            <p>
              💡 <strong>Tip:</strong> Different UI elements play different sounds:
            </p>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• Buttons: Standard click sound</li>
              <li>• Navigation: Menu navigation sound</li>
              <li>• Success actions: Success confirmation sound</li>
              <li>• Error actions: Error alert sound</li>
              <li>• Hover effects: Subtle hover sound</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
