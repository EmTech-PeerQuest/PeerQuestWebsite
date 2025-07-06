#!/usr/bin/env node

/**
 * Audio File Generator for PeerQuest Click Sounds
 * 
 * This script generates actual audio files with different characteristics for each interaction type.
 * Uses Web Audio API techniques to create distinct, pleasant click sounds.
 */

const fs = require('fs');
const path = require('path');

// Audio specifications for different click types
const SOUND_SPECS = {
  'button-click': {
    description: 'Standard button click - crisp and confident',
    frequency: 800,        // Primary frequency (Hz)
    duration: 120,         // Duration in milliseconds
    volume: 0.6,           // Volume (0-1)
    attack: 10,            // Attack time (ms)
    decay: 80,             // Decay time (ms)
    waveform: 'sine',      // Waveform type
    harmonics: [1200, 400] // Additional harmonics
  },
  
  'nav-click': {
    description: 'Navigation click - smooth and directional',
    frequency: 600,
    duration: 150,
    volume: 0.5,
    attack: 15,
    decay: 100,
    waveform: 'triangle',
    harmonics: [900, 300]
  },
  
  'success-click': {
    description: 'Success action - bright and positive',
    frequency: 1000,
    duration: 200,
    volume: 0.7,
    attack: 5,
    decay: 120,
    waveform: 'sine',
    harmonics: [1500, 500, 2000] // More harmonics for richness
  },
  
  'error-click': {
    description: 'Error/warning - lower and more serious',
    frequency: 300,
    duration: 180,
    volume: 0.6,
    attack: 20,
    decay: 140,
    waveform: 'square',
    harmonics: [600, 150]
  },
  
  'soft-click': {
    description: 'Subtle interaction - gentle and understated',
    frequency: 400,
    duration: 100,
    volume: 0.3,
    attack: 25,
    decay: 60,
    waveform: 'sine',
    harmonics: [800]
  },
  
  'tab-click': {
    description: 'Tab switching - medium pitch, quick',
    frequency: 700,
    duration: 90,
    volume: 0.5,
    attack: 8,
    decay: 50,
    waveform: 'triangle',
    harmonics: [1050, 350]
  },
  
  'modal-open': {
    description: 'Modal opening - ascending tone',
    frequency: 500,
    duration: 250,
    volume: 0.6,
    attack: 30,
    decay: 180,
    waveform: 'sine',
    harmonics: [750, 1000, 1250] // Ascending harmonics
  },
  
  'hover-sound': {
    description: 'Hover feedback - very subtle',
    frequency: 1200,
    duration: 50,
    volume: 0.2,
    attack: 5,
    decay: 30,
    waveform: 'sine',
    harmonics: [1800]
  },
  
  'dropdown-click': {
    description: 'Dropdown interaction - crisp and quick',
    frequency: 900,
    duration: 80,
    volume: 0.4,
    attack: 5,
    decay: 40,
    waveform: 'triangle',
    harmonics: [1350]
  },
  
  'card-click': {
    description: 'Card selection - warm and inviting',
    frequency: 650,
    duration: 130,
    volume: 0.5,
    attack: 12,
    decay: 90,
    waveform: 'sine',
    harmonics: [975, 325]
  }
};

// Generate WAV file data using Web Audio API principles
function generateWAVData(spec) {
  const sampleRate = 44100;
  const totalSamples = Math.floor(sampleRate * spec.duration / 1000);
  const attackSamples = Math.floor(sampleRate * spec.attack / 1000);
  const decaySamples = Math.floor(sampleRate * spec.decay / 1000);
  
  // Create audio buffer
  const buffer = new Float32Array(totalSamples);
  
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    let amplitude = spec.volume;
    
    // Envelope (ADSR - simplified to just Attack and Decay)
    if (i < attackSamples) {
      amplitude *= i / attackSamples; // Attack
    } else if (i > totalSamples - decaySamples) {
      amplitude *= (totalSamples - i) / decaySamples; // Decay
    }
    
    // Generate primary frequency
    let sample = 0;
    
    // Primary frequency
    sample += Math.sin(2 * Math.PI * spec.frequency * time) * amplitude;
    
    // Add harmonics for richness
    spec.harmonics.forEach((harmonic, index) => {
      const harmonicAmplitude = amplitude * (0.3 / (index + 1)); // Decreasing amplitude
      sample += Math.sin(2 * Math.PI * harmonic * time) * harmonicAmplitude;
    });
    
    // Apply waveform shaping
    if (spec.waveform === 'square') {
      sample = sample > 0 ? amplitude : -amplitude;
    } else if (spec.waveform === 'triangle') {
      sample = (2 / Math.PI) * Math.asin(sample);
    }
    
    // Clamp to prevent distortion
    buffer[i] = Math.max(-1, Math.min(1, sample));
  }
  
  return buffer;
}

// Convert Float32Array to WAV file format
function createWAVFile(audioData, sampleRate = 44100) {
  const length = audioData.length;
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);
  
  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }
  
  return buffer;
}

// Generate all sound files
function generateAllSounds() {
  const audioDir = path.join(__dirname, 'public', 'audio');
  
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }
  
  console.log('🎵 Generating PeerQuest Click Sounds...\n');
  console.log('=' .repeat(50));
  
  Object.entries(SOUND_SPECS).forEach(([soundName, spec]) => {
    console.log(`\n🔊 Creating ${soundName}.mp3`);
    console.log(`   📝 ${spec.description}`);
    console.log(`   🎼 Frequency: ${spec.frequency}Hz, Duration: ${spec.duration}ms`);
    
    try {
      // Generate audio data
      const audioData = generateWAVData(spec);
      
      // Create WAV file
      const wavBuffer = createWAVFile(audioData);
      
      // Save as .wav file (browsers support WAV well)
      const fileName = `${soundName}.wav`;
      const filePath = path.join(audioDir, fileName);
      
      fs.writeFileSync(filePath, Buffer.from(wavBuffer));
      
      console.log(`   ✅ Generated: ${fileName} (${Math.round(wavBuffer.byteLength / 1024)}KB)`);
      
    } catch (error) {
      console.log(`   ❌ Error generating ${soundName}: ${error.message}`);
    }
  });
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎉 Click sound generation complete!');
  console.log('\n📋 Generated files:');
  
  // List generated files
  try {
    const files = fs.readdirSync(audioDir);
    files.forEach(file => {
      const filePath = path.join(audioDir, file);
      const stats = fs.statSync(filePath);
      console.log(`   • ${file} (${Math.round(stats.size / 1024)}KB)`);
    });
  } catch (error) {
    console.log('   Could not list files:', error.message);
  }
  
  console.log('\n💡 Next steps:');
  console.log('1. Test sounds in your app');
  console.log('2. Adjust volumes in audio-context.tsx if needed');
  console.log('3. Consider converting to MP3 for smaller file sizes');
  console.log('4. Add more sound variations if desired');
  
  console.log('\n🏰 Your tavern now has immersive click sounds!');
}

// Run the generator
generateAllSounds();
