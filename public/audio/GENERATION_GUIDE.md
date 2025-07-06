# PeerQuest Click Sounds Generation Guide

This guide provides specifications for creating audio files for the PeerQuest click sound system.

## Quick Generation Options

### Option 1: Online Generators
- **sfxr.me**: Simple 8-bit style sound generator
- **freesound.org**: Search for "click", "button", "ui" sounds
- **myinstants.com**: Find and download short UI sounds

### Option 2: Audio Software
- **Audacity** (Free): Generate tones and apply effects
- **GarageBand** (Mac): Use built-in synthesizers
- **FL Studio** or **Ableton Live**: Professional audio production

### Option 3: Code Generation
- **Web Audio API**: Generate sounds programmatically
- **Tone.js**: JavaScript audio library for web apps

## Sound Specifications

### button-click.mp3
**Description**: Standard button click sound
**Frequency**: 1000-1500 Hz
**Duration**: 0.1-0.2 seconds
**Waveform**: Square or Triangle wave
**Envelope**: Quick attack, fast decay
**Volume**: Medium
**Effect**: Subtle reverb

### nav-click.mp3
**Description**: Navigation menu click
**Frequency**: 800-1200 Hz
**Duration**: 0.15 seconds
**Waveform**: Triangle wave
**Envelope**: Smooth attack and decay
**Volume**: Medium-low
**Effect**: Light delay

### modal-open.mp3
**Description**: Modal/dialog opening sound
**Frequency**: 600-1000 Hz rising
**Duration**: 0.3 seconds
**Waveform**: Sine wave with harmonic
**Envelope**: Gradual attack, sustained decay
**Volume**: Medium
**Effect**: Gentle echo

### success-click.mp3
**Description**: Success action confirmation
**Frequency**: 1200-1800 Hz
**Duration**: 0.25 seconds
**Waveform**: Sine wave
**Envelope**: Quick attack, long decay
**Volume**: Medium-high
**Effect**: Bright reverb

### error-click.mp3
**Description**: Error or warning sound
**Frequency**: 400-600 Hz
**Duration**: 0.3 seconds
**Waveform**: Square wave
**Envelope**: Sharp attack, quick decay
**Volume**: Medium
**Effect**: Slight distortion

### hover-sound.mp3
**Description**: Subtle hover effect
**Frequency**: 1500-2000 Hz
**Duration**: 0.05 seconds
**Waveform**: Sine wave
**Envelope**: Very quick attack and decay
**Volume**: Low
**Effect**: None

### tab-click.mp3
**Description**: Tab switching sound
**Frequency**: 900-1300 Hz
**Duration**: 0.12 seconds
**Waveform**: Triangle wave
**Envelope**: Medium attack, quick decay
**Volume**: Medium-low
**Effect**: Light filtering

### dropdown-click.mp3
**Description**: Dropdown menu sound
**Frequency**: 700-1100 Hz
**Duration**: 0.18 seconds
**Waveform**: Sawtooth wave
**Envelope**: Quick attack, medium decay
**Volume**: Medium
**Effect**: Soft echo

### card-click.mp3
**Description**: Card or item click
**Frequency**: 1100-1400 Hz
**Duration**: 0.15 seconds
**Waveform**: Triangle wave
**Envelope**: Smooth attack and decay
**Volume**: Medium
**Effect**: Subtle reverb

### soft-click.mp3
**Description**: Soft, subtle click
**Frequency**: 1300-1600 Hz
**Duration**: 0.08 seconds
**Waveform**: Sine wave
**Envelope**: Very smooth attack and decay
**Volume**: Low-medium
**Effect**: Minimal processing

## Web Audio API Example

```javascript
// Example: Generate a button click sound
function generateButtonClick() {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
  oscillator.type = "triangle";
  
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.15);
}
```

## File Requirements

- **Format**: MP3 (best browser compatibility)
- **Sample Rate**: 44.1kHz recommended
- **Bit Rate**: 128kbps minimum
- **File Size**: Keep under 50KB each
- **Naming**: Use exact filenames as specified

## Testing Your Sounds

1. Place audio files in `/public/audio/` directory
2. Start the development server
3. Go to Settings > Audio & Sounds
4. Enable click sounds and test different UI elements
5. Adjust volume and check for audio loading errors in console
