#!/usr/bin/env node

/**
 * Audio File Generator for PeerQuest Click Sounds
 * 
 * This script provides instructions and templates for generating 
 * click sound audio files for the PeerQuest application.
 * 
 * Usage: node generate-audio-files.js
 */

const fs = require('fs');
const path = require('path');

const audioDir = path.join(__dirname, '../public/audio');

// Sound definitions with recommended properties
const soundDefinitions = {
  'button-click.mp3': {
    description: 'Standard button click sound',
    frequency: '1000-1500 Hz',
    duration: '0.1-0.2 seconds',
    waveform: 'Square or Triangle wave',
    envelope: 'Quick attack, fast decay',
    volume: 'Medium',
    effect: 'Subtle reverb'
  },
  'nav-click.mp3': {
    description: 'Navigation menu click',
    frequency: '800-1200 Hz',
    duration: '0.15 seconds',
    waveform: 'Triangle wave',
    envelope: 'Smooth attack and decay',
    volume: 'Medium-low',
    effect: 'Light delay'
  },
  'modal-open.mp3': {
    description: 'Modal/dialog opening sound',
    frequency: '600-1000 Hz rising',
    duration: '0.3 seconds',
    waveform: 'Sine wave with harmonic',
    envelope: 'Gradual attack, sustained decay',
    volume: 'Medium',
    effect: 'Gentle echo'
  },
  'success-click.mp3': {
    description: 'Success action confirmation',
    frequency: '1200-1800 Hz',
    duration: '0.25 seconds',
    waveform: 'Sine wave',
    envelope: 'Quick attack, long decay',
    volume: 'Medium-high',
    effect: 'Bright reverb'
  },
  'error-click.mp3': {
    description: 'Error or warning sound',
    frequency: '400-600 Hz',
    duration: '0.3 seconds',
    waveform: 'Square wave',
    envelope: 'Sharp attack, quick decay',
    volume: 'Medium',
    effect: 'Slight distortion'
  },
  'hover-sound.mp3': {
    description: 'Subtle hover effect',
    frequency: '1500-2000 Hz',
    duration: '0.05 seconds',
    waveform: 'Sine wave',
    envelope: 'Very quick attack and decay',
    volume: 'Low',
    effect: 'None'
  },
  'tab-click.mp3': {
    description: 'Tab switching sound',
    frequency: '900-1300 Hz',
    duration: '0.12 seconds',
    waveform: 'Triangle wave',
    envelope: 'Medium attack, quick decay',
    volume: 'Medium-low',
    effect: 'Light filtering'
  },
  'dropdown-click.mp3': {
    description: 'Dropdown menu sound',
    frequency: '700-1100 Hz',
    duration: '0.18 seconds',
    waveform: 'Sawtooth wave',
    envelope: 'Quick attack, medium decay',
    volume: 'Medium',
    effect: 'Soft echo'
  },
  'card-click.mp3': {
    description: 'Card or item click',
    frequency: '1100-1400 Hz',
    duration: '0.15 seconds',
    waveform: 'Triangle wave',
    envelope: 'Smooth attack and decay',
    volume: 'Medium',
    effect: 'Subtle reverb'
  },
  'soft-click.mp3': {
    description: 'Soft, subtle click',
    frequency: '1300-1600 Hz',
    duration: '0.08 seconds',
    waveform: 'Sine wave',
    envelope: 'Very smooth attack and decay',
    volume: 'Low-medium',
    effect: 'Minimal processing'
  }
};

function generateAudioGuide() {
  console.log('🎵 PeerQuest Audio File Generator\n');
  console.log('This script will help you create click sound audio files.\n');

  // Create audio directory if it doesn't exist
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
    console.log(`✅ Created audio directory: ${audioDir}\n`);
  }

  // Generate guide file
  let guide = '# PeerQuest Click Sounds Generation Guide\n\n';
  guide += 'This guide provides specifications for creating audio files for the PeerQuest click sound system.\n\n';
  
  guide += '## Quick Generation Options\n\n';
  guide += '### Option 1: Online Generators\n';
  guide += '- **sfxr.me**: Simple 8-bit style sound generator\n';
  guide += '- **freesound.org**: Search for "click", "button", "ui" sounds\n';
  guide += '- **myinstants.com**: Find and download short UI sounds\n\n';
  
  guide += '### Option 2: Audio Software\n';
  guide += '- **Audacity** (Free): Generate tones and apply effects\n';
  guide += '- **GarageBand** (Mac): Use built-in synthesizers\n';
  guide += '- **FL Studio** or **Ableton Live**: Professional audio production\n\n';
  
  guide += '### Option 3: Code Generation\n';
  guide += '- **Web Audio API**: Generate sounds programmatically\n';
  guide += '- **Tone.js**: JavaScript audio library for web apps\n\n';
  
  guide += '## Sound Specifications\n\n';

  Object.entries(soundDefinitions).forEach(([filename, spec]) => {
    guide += `### ${filename}\n`;
    guide += `**Description**: ${spec.description}\n`;
    guide += `**Frequency**: ${spec.frequency}\n`;
    guide += `**Duration**: ${spec.duration}\n`;
    guide += `**Waveform**: ${spec.waveform}\n`;
    guide += `**Envelope**: ${spec.envelope}\n`;
    guide += `**Volume**: ${spec.volume}\n`;
    guide += `**Effect**: ${spec.effect}\n\n`;
  });

  guide += '## Web Audio API Example\n\n';
  guide += '```javascript\n';
  guide += '// Example: Generate a button click sound\n';
  guide += 'function generateButtonClick() {\n';
  guide += '  const audioContext = new AudioContext();\n';
  guide += '  const oscillator = audioContext.createOscillator();\n';
  guide += '  const gainNode = audioContext.createGain();\n';
  guide += '  \n';
  guide += '  oscillator.connect(gainNode);\n';
  guide += '  gainNode.connect(audioContext.destination);\n';
  guide += '  \n';
  guide += '  oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);\n';
  guide += '  oscillator.type = "triangle";\n';
  guide += '  \n';
  guide += '  gainNode.gain.setValueAtTime(0, audioContext.currentTime);\n';
  guide += '  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);\n';
  guide += '  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);\n';
  guide += '  \n';
  guide += '  oscillator.start(audioContext.currentTime);\n';
  guide += '  oscillator.stop(audioContext.currentTime + 0.15);\n';
  guide += '}\n';
  guide += '```\n\n';

  guide += '## File Requirements\n\n';
  guide += '- **Format**: MP3 (best browser compatibility)\n';
  guide += '- **Sample Rate**: 44.1kHz recommended\n';
  guide += '- **Bit Rate**: 128kbps minimum\n';
  guide += '- **File Size**: Keep under 50KB each\n';
  guide += '- **Naming**: Use exact filenames as specified\n\n';

  guide += '## Testing Your Sounds\n\n';
  guide += '1. Place audio files in `/public/audio/` directory\n';
  guide += '2. Start the development server\n';
  guide += '3. Go to Settings > Audio & Sounds\n';
  guide += '4. Enable click sounds and test different UI elements\n';
  guide += '5. Adjust volume and check for audio loading errors in console\n';

  // Write guide to file
  const guideFile = path.join(audioDir, 'GENERATION_GUIDE.md');
  fs.writeFileSync(guideFile, guide);

  console.log(`📖 Generated audio guide: ${guideFile}`);
  console.log('\n🔧 Next Steps:');
  console.log('1. Read the generation guide');
  console.log('2. Create audio files using your preferred method');
  console.log('3. Place files in the /public/audio/ directory');
  console.log('4. Test the sounds in your application');
  console.log('\n✨ Happy sound designing!');
}

// Run the generator
generateAudioGuide();
