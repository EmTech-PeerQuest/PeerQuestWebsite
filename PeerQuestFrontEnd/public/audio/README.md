# 🎵 PeerQuest Click Sound Files

This directory contains professionally generated click sound files for the PeerQuest tavern experience. Each sound is carefully crafted with specific frequencies and characteristics to match different interaction types.

## 🔊 Generated Sound Files

### Core Interaction Sounds
- **`button-click.wav`** (800Hz, 120ms) - Standard button clicks, crisp and confident
- **`nav-click.wav`** (600Hz, 150ms) - Navigation sounds, smooth and directional  
- **`success-click.wav`** (1000Hz, 200ms) - Success actions, bright and positive
- **`error-click.wav`** (300Hz, 180ms) - Error/warning sounds, lower and serious
- **`soft-click.wav`** (400Hz, 100ms) - Subtle interactions, gentle and understated

### Specialized Sounds
- **`tab-click.wav`** (700Hz, 90ms) - Tab switching, medium pitch and quick
- **`modal-open.wav`** (500Hz+, 250ms) - Modal opening, ascending harmonic tone
- **`hover-sound.wav`** (1200Hz, 50ms) - Hover feedback, very subtle
- **`dropdown-click.wav`** (900Hz, 80ms) - Dropdown interactions, crisp and quick
- **`card-click.wav`** (650Hz, 130ms) - Card selection, warm and inviting

## 🎨 Sound Characteristics

Each sound file includes:
- **Primary frequency** - Main tone for the interaction type
- **Harmonic layers** - Additional frequencies for richness and character
- **Envelope shaping** - Smooth attack and decay for pleasant audio experience
- **Optimized duration** - Quick enough to not interfere with rapid interactions

## 🔧 Technical Details

- **Format**: WAV (44.1kHz, 16-bit)
- **File sizes**: 4KB - 22KB per file
- **Total package**: ~120KB for all sounds
- **Browser support**: All modern browsers support WAV
- **Fallback**: System handles missing files gracefully

## 🎯 Usage in Components

### Auto-detection (Recommended)
```tsx
<Button onClick={handleClick} variant="default">
  Click me
</Button>
// Automatically plays 'button' sound
```

### Manual sound type
```tsx
<Button onClick={handleClick} soundType="success">
  Save Changes
</Button>
// Plays 'success' sound
```

### Programmatic trigger
```tsx
const { playSound } = useClickSound()
playSound('nav') // Plays navigation sound
```

## 🔄 Regenerating Sounds

To regenerate or modify sounds:
1. Edit `generate-click-sounds.js` in the project root
2. Modify frequency, duration, or harmonic settings
3. Run: `node generate-click-sounds.js`
4. New files will overwrite existing ones

## 🎵 Sound Design Philosophy

**Tavern-themed Audio Experience:**
- Sounds feel medieval/fantasy appropriate
- Non-intrusive but satisfying feedback
- Distinct sounds for different interaction contexts
- Professional quality without being distracting

**Accessibility Considerations:**
- Users can disable sounds globally
- Volume controls available
- Sounds are optional enhancement, not required for functionality
- Short durations to not interfere with screen readers

---

*Generated by PeerQuest Click Sound System - Bringing your tavern to life!* 🏰
