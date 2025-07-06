# 🎵 PeerQuest Click Sound System

A comprehensive audio feedback system for the PeerQuest Tavern application that provides immersive click sounds for UI interactions.

## ✨ Features

- **Multiple Sound Types**: 10 different sound categories for various UI interactions
- **Global Audio Controls**: Volume control, mute/unmute, and enable/disable sounds
- **Persistent Settings**: Audio preferences saved to localStorage
- **Performance Optimized**: Efficient audio loading and playback
- **TypeScript Support**: Fully typed components and hooks
- **Easy Integration**: Simple hooks and wrapper components for existing UI

## 🔧 Installation & Setup

The click sound system is already integrated into the PeerQuest application. No additional installation required.

### Audio Files

1. Navigate to `/public/audio/` directory
2. Add the required MP3 files (see `GENERATION_GUIDE.md` for specifications)
3. Or run the audio generator: `node generate-audio-files.js`

## 🎯 Sound Types

| Sound Type | Use Case | Description |
|------------|----------|-------------|
| `button` | Standard buttons | General button click sound |
| `nav` | Navigation | Menu and navigation interactions |
| `modal` | Modals/Dialogs | Opening modals and dialogs |
| `success` | Success actions | Confirmation and success feedback |
| `error` | Error actions | Error alerts and warnings |
| `hover` | Hover effects | Subtle hover interactions |
| `tab` | Tab switching | Tab and accordion interactions |
| `dropdown` | Dropdowns | Dropdown menu interactions |
| `card` | Cards/Items | Card and item selection |
| `soft` | Subtle clicks | Gentle, minimal interactions |

## 🚀 Usage

### Method 1: Enhanced Button Component

```tsx
import { Button } from '@/components/ui/button-with-sound'

// Automatic sound based on button variant
<Button variant="destructive">Delete Item</Button>

// Custom sound type
<Button soundType="success" playClickSound={true}>
  Save Changes
</Button>

// Disable sounds for specific button
<Button playClickSound={false}>Silent Button</Button>
```

### Method 2: Click Sound Wrapper

```tsx
import { ClickSoundWrapper } from '@/components/ui/with-click-sound'

// Wrap any element to add click sounds
<ClickSoundWrapper soundType="card" as="div">
  <div className="clickable-card">
    Your content here
  </div>
</ClickSoundWrapper>

// Pre-configured components
import { ClickSoundButton, ClickSoundDiv } from '@/components/ui/with-click-sound'

<ClickSoundButton soundType="nav">
  Navigation Item
</ClickSoundButton>
```

### Method 3: Custom Hook

```tsx
import { useClickSound } from '@/hooks/use-click-sound'

function MyComponent() {
  const { playSound, isEnabled, setEnabled } = useClickSound()
  
  const handleClick = () => {
    playSound('button')
    // Your click logic here
  }
  
  const handleSpecialAction = () => {
    playSound('success')
    // Success action logic
  }
  
  return (
    <div>
      <button onClick={handleClick}>Regular Click</button>
      <button onClick={handleSpecialAction}>Success Action</button>
    </div>
  )
}
```

### Method 4: Global Audio Context

```tsx
import { useAudioContext } from '@/context/audio-context'

function AudioControls() {
  const { 
    soundEnabled, 
    volume, 
    setSoundEnabled, 
    setVolume,
    isMuted,
    setMuted 
  } = useAudioContext()
  
  return (
    <div>
      <button onClick={() => setSoundEnabled(!soundEnabled)}>
        {soundEnabled ? 'Disable' : 'Enable'} Sounds
      </button>
      <input 
        type="range" 
        min="0" 
        max="1" 
        step="0.1"
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
      />
    </div>
  )
}
```

## 🎛️ Audio Settings Component

Add audio controls to your settings page:

```tsx
import { AudioSettings } from '@/components/ui/audio-settings'

// Full settings panel
<AudioSettings />

// Compact controls
<AudioSettings compact showTitle={false} />
```

## 🔗 Integration with Existing Components

### Navbar Integration

The navbar already includes click sounds for navigation items:

```tsx
// Navigation clicks automatically play 'nav' sound
const handleNavigation = (section: string) => {
  playSound('nav')
  // Navigation logic
}
```

### Settings Integration

Audio settings are automatically included in the Settings page under the "Audio & Sounds" tab.

## 🎨 Customization

### Custom Sound Files

```tsx
// Use custom sound file
const { playSound } = useClickSound({ 
  customSound: '/audio/my-custom-sound.mp3' 
})

// Or with wrapper
<ClickSoundWrapper customSound="/audio/special-sound.mp3">
  Custom Sound Element
</ClickSoundWrapper>
```

### Volume Control

```tsx
// Set custom volume for specific component
const { playSound } = useClickSound({ 
  volume: 0.5, // 50% volume
  soundType: 'button'
})
```

## 📱 Testing

1. **Demo Page**: Visit `/demo` to test all sound types
2. **Settings Page**: Go to Settings > Audio & Sounds to adjust preferences
3. **Console**: Check browser console for audio loading errors
4. **Volume**: Test at different volume levels

## 🐛 Troubleshooting

### No Sound Playing

1. Check if audio files exist in `/public/audio/` directory
2. Verify sound is enabled in Settings > Audio & Sounds
3. Check browser volume and audio permissions
4. Look for console errors related to audio loading

### Performance Issues

1. Ensure audio files are optimized (< 50KB each)
2. Check if preloading is causing memory issues
3. Consider disabling sounds on mobile devices

### File Loading Errors

```tsx
// Handle audio loading errors
const { playSound, isEnabled } = useClickSound({
  enabled: true,
  volume: 0.3
})

// Audio files will fail gracefully if missing
// Check console for specific error messages
```

## 🌐 Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support  
- **Safari**: Full support (may require user interaction)
- **Edge**: Full support
- **Mobile**: Supported (may be limited by device policies)

## 📁 File Structure

```
/hooks/
  use-audio.tsx          # Basic audio playback hook
  use-click-sound.tsx    # Click sound specific hook

/context/
  audio-context.tsx      # Global audio settings context

/components/ui/
  audio-settings.tsx     # Audio settings component
  button-with-sound.tsx  # Enhanced button component
  with-click-sound.tsx   # HOC and wrapper components

/public/audio/
  *.mp3                  # Audio files
  README.md              # Audio file specifications
  GENERATION_GUIDE.md    # How to create audio files

/app/demo/
  page.tsx               # Demo page for testing sounds
```

## 🎵 Audio File Specifications

- **Format**: MP3 (best browser compatibility)
- **Duration**: 0.05-0.3 seconds
- **Sample Rate**: 44.1kHz
- **Bit Rate**: 128kbps minimum
- **File Size**: < 50KB each
- **Volume**: Normalized, app controls playback volume

## 💡 Best Practices

1. **Selective Usage**: Don't add sounds to every single interaction
2. **Volume Levels**: Keep sounds subtle and non-intrusive  
3. **User Control**: Always provide option to disable sounds
4. **Performance**: Preload frequently used sounds only
5. **Accessibility**: Provide visual feedback alternatives
6. **Testing**: Test on different devices and browsers

## 🔮 Future Enhancements

- Dynamic sound themes (medieval, sci-fi, etc.)
- Sound visualization effects
- Spatial audio for immersive experience
- Sound effect customization
- Community sound packs

---

**Happy clicking!** 🎉 The PeerQuest Tavern now provides rich audio feedback for an immersive user experience.
