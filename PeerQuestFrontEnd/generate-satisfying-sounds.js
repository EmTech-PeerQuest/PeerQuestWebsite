#!/usr/bin/env node

/**
 * Enhanced Audio Generator for PeerQuest Click Sounds
 * 
 * Creates more satisfying, polished click sounds with:
 * - Better frequency response
 * - Subtle reverb and depth
 * - Harmonic richness
 * - Contextual sound design
 */

const fs = require('fs');
const path = require('path');

class SatisfyingAudioGenerator {
  constructor() {
    this.sampleRate = 44100;
    this.duration = 0.15; // Slightly longer for more satisfying feel
    this.samples = Math.floor(this.sampleRate * this.duration);
  }

  // Generate more complex waveforms with harmonics
  generateComplexWave(frequency, samples, waveform = 'rich') {
    const wave = new Float32Array(samples);
    
    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      let sample = 0;
      
      switch (waveform) {
        case 'rich': // Rich harmonic content
          sample = Math.sin(2 * Math.PI * frequency * t) * 0.6 +
                  Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3 +
                  Math.sin(2 * Math.PI * frequency * 3 * t) * 0.1;
          break;
          
        case 'warm': // Warm, rounded sound
          sample = Math.sin(2 * Math.PI * frequency * t) * 0.7 +
                  Math.sin(2 * Math.PI * frequency * 0.5 * t) * 0.2 +
                  Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.1;
          break;
          
        case 'crisp': // Crisp, clean sound
          sample = Math.sin(2 * Math.PI * frequency * t) * 0.8 +
                  Math.sin(2 * Math.PI * frequency * 4 * t) * 0.15 +
                  Math.sin(2 * Math.PI * frequency * 8 * t) * 0.05;
          break;
          
        case 'soft': // Soft, gentle sound
          sample = Math.sin(2 * Math.PI * frequency * t) * 0.5 +
                  Math.sin(2 * Math.PI * frequency * 0.75 * t) * 0.3 +
                  Math.sin(2 * Math.PI * frequency * 1.25 * t) * 0.2;
          break;
      }
      
      wave[i] = sample;
    }
    
    return wave;
  }

  // Apply envelope for more natural sound
  applyEnvelope(wave, attack = 0.02, decay = 0.05, sustain = 0.3, release = 0.08) {
    const samples = wave.length;
    const attackSamples = Math.floor(attack * this.sampleRate);
    const decaySamples = Math.floor(decay * this.sampleRate);
    const releaseSamples = Math.floor(release * this.sampleRate);
    const sustainSamples = samples - attackSamples - decaySamples - releaseSamples;
    
    for (let i = 0; i < samples; i++) {
      let envelope = 1;
      
      if (i < attackSamples) {
        // Attack phase - smooth fade in
        envelope = Math.pow(i / attackSamples, 0.5);
      } else if (i < attackSamples + decaySamples) {
        // Decay phase
        const decayProgress = (i - attackSamples) / decaySamples;
        envelope = 1 - decayProgress * (1 - sustain);
      } else if (i < attackSamples + decaySamples + sustainSamples) {
        // Sustain phase
        envelope = sustain;
      } else {
        // Release phase - smooth fade out
        const releaseProgress = (i - attackSamples - decaySamples - sustainSamples) / releaseSamples;
        envelope = sustain * (1 - Math.pow(releaseProgress, 0.3));
      }
      
      wave[i] *= envelope;
    }
    
    return wave;
  }

  // Add subtle reverb/echo for depth
  addReverb(wave, delayMs = 15, feedback = 0.15, wetness = 0.2) {
    const delaySamples = Math.floor((delayMs / 1000) * this.sampleRate);
    const output = new Float32Array(wave.length);
    
    for (let i = 0; i < wave.length; i++) {
      output[i] = wave[i];
      
      if (i >= delaySamples) {
        output[i] += output[i - delaySamples] * feedback * wetness;
      }
    }
    
    return output;
  }

  // Generate satisfying button click (main interaction)
  generateButtonClick() {
    // Two-tone click: initial click + subtle resonance
    const click = this.generateComplexWave(1200, Math.floor(this.samples * 0.3), 'crisp');
    const resonance = this.generateComplexWave(800, Math.floor(this.samples * 0.7), 'warm');
    
    const combined = new Float32Array(this.samples);
    
    // Combine click and resonance
    for (let i = 0; i < this.samples; i++) {
      if (i < click.length) {
        combined[i] = click[i] * 0.8;
      }
      if (i >= Math.floor(this.samples * 0.2) && i < Math.floor(this.samples * 0.2) + resonance.length) {
        const resonanceIndex = i - Math.floor(this.samples * 0.2);
        if (resonanceIndex < resonance.length) {
          combined[i] += resonance[resonanceIndex] * 0.4;
        }
      }
    }
    
    this.applyEnvelope(combined, 0.005, 0.02, 0.4, 0.12);
    return this.addReverb(combined, 12, 0.1, 0.15);
  }

  // Generate success sound (satisfying completion)
  generateSuccessSound() {
    // Rising chord progression
    const freq1 = this.generateComplexWave(523, this.samples, 'rich'); // C5
    const freq2 = this.generateComplexWave(659, this.samples, 'rich'); // E5
    const freq3 = this.generateComplexWave(784, this.samples, 'rich'); // G5
    
    const combined = new Float32Array(this.samples);
    
    for (let i = 0; i < this.samples; i++) {
      combined[i] = (freq1[i] * 0.4 + freq2[i] * 0.35 + freq3[i] * 0.25);
    }
    
    this.applyEnvelope(combined, 0.02, 0.04, 0.5, 0.15);
    return this.addReverb(combined, 20, 0.2, 0.25);
  }

  // Generate navigation sound (smooth transition)
  generateNavSound() {
    // Smooth sweep with pleasant harmonics
    const baseFreq = 440;
    const wave = new Float32Array(this.samples);
    
    for (let i = 0; i < this.samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / this.samples;
      
      // Slight frequency sweep for movement feel
      const freq = baseFreq + (progress * 100);
      
      wave[i] = Math.sin(2 * Math.PI * freq * t) * 0.6 +
               Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.25 +
               Math.sin(2 * Math.PI * freq * 2 * t) * 0.15;
    }
    
    this.applyEnvelope(wave, 0.015, 0.03, 0.4, 0.1);
    return this.addReverb(wave, 10, 0.12, 0.18);
  }

  // Generate error sound (clear but not harsh)
  generateErrorSound() {
    // Two quick descending tones
    const tone1 = this.generateComplexWave(700, Math.floor(this.samples * 0.4), 'crisp');
    const tone2 = this.generateComplexWave(500, Math.floor(this.samples * 0.4), 'crisp');
    
    const combined = new Float32Array(this.samples);
    
    // First tone
    for (let i = 0; i < tone1.length; i++) {
      combined[i] = tone1[i] * 0.7;
    }
    
    // Second tone with slight delay
    const delay = Math.floor(this.samples * 0.25);
    for (let i = 0; i < tone2.length; i++) {
      if (i + delay < combined.length) {
        combined[i + delay] += tone2[i] * 0.5;
      }
    }
    
    this.applyEnvelope(combined, 0.008, 0.02, 0.3, 0.08);
    return this.addReverb(combined, 8, 0.08, 0.12);
  }

  // Generate soft click (subtle interactions)
  generateSoftClick() {
    const wave = this.generateComplexWave(350, this.samples, 'soft');
    this.applyEnvelope(wave, 0.02, 0.04, 0.5, 0.1);
    return this.addReverb(wave, 8, 0.08, 0.1);
  }

  // Generate tab switch (smooth transition)
  generateTabSound() {
    // Gentle two-tone
    const wave1 = this.generateComplexWave(600, this.samples, 'warm');
    const wave2 = this.generateComplexWave(800, this.samples, 'warm');
    
    const combined = new Float32Array(this.samples);
    for (let i = 0; i < this.samples; i++) {
      combined[i] = wave1[i] * 0.6 + wave2[i] * 0.4;
    }
    
    this.applyEnvelope(combined, 0.02, 0.03, 0.5, 0.12);
    return this.addReverb(combined, 12, 0.1, 0.15);
  }

  // Generate modal sound (attention-getting but pleasant)
  generateModalSound() {
    // Bell-like tone
    const fundamental = this.generateComplexWave(880, this.samples, 'rich');
    const harmonic = this.generateComplexWave(1320, this.samples, 'rich'); // 1.5x
    
    const combined = new Float32Array(this.samples);
    for (let i = 0; i < this.samples; i++) {
      combined[i] = fundamental[i] * 0.7 + harmonic[i] * 0.3;
    }
    
    this.applyEnvelope(combined, 0.01, 0.05, 0.6, 0.18);
    return this.addReverb(combined, 25, 0.25, 0.3);
  }

  // Generate hover sound (very subtle)
  generateHoverSound() {
    const wave = this.generateComplexWave(1000, Math.floor(this.samples * 0.5), 'soft');
    this.applyEnvelope(wave, 0.02, 0.02, 0.3, 0.06);
    return this.addReverb(wave, 5, 0.05, 0.08);
  }

  // Convert audio data to WAV format
  createWavFile(audioData) {
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
    view.setUint32(24, this.sampleRate, true);
    view.setUint32(28, this.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Convert float samples to 16-bit integers
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
    
    return Buffer.from(buffer);
  }

  generateAllSounds() {
    const audioDir = path.join(__dirname, 'public', 'audio');
    
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const sounds = {
      'button-click.wav': this.generateButtonClick(),
      'success-click.wav': this.generateSuccessSound(),
      'nav-click.wav': this.generateNavSound(),
      'error-click.wav': this.generateErrorSound(),
      'soft-click.wav': this.generateSoftClick(),
      'tab-click.wav': this.generateTabSound(),
      'modal-open.wav': this.generateModalSound(),
      'hover-sound.wav': this.generateHoverSound(),
      'dropdown-click.wav': this.generateSoftClick(), // Reuse soft click
      'card-click.wav': this.generateButtonClick(), // Reuse button click
    };

    console.log('🎵 Generating satisfying click sounds...\n');

    Object.entries(sounds).forEach(([filename, audioData]) => {
      const filePath = path.join(audioDir, filename);
      const wavBuffer = this.createWavFile(audioData);
      
      fs.writeFileSync(filePath, wavBuffer);
      console.log(`✅ Created ${filename} (${(wavBuffer.length / 1024).toFixed(1)}KB)`);
    });

    console.log('\n🎯 Sound Design Features:');
    console.log('✅ Rich harmonic content for warmth');
    console.log('✅ Smooth ADSR envelopes for natural feel');
    console.log('✅ Subtle reverb for depth and space');
    console.log('✅ Contextual frequencies for each interaction');
    console.log('✅ Optimized duration (150ms) for responsiveness');
    
    console.log('\n🎨 Sound Characteristics:');
    console.log('- button-click: Crisp with warm resonance');
    console.log('- success-click: Rising chord progression');
    console.log('- nav-click: Smooth frequency sweep');
    console.log('- error-click: Clear descending tones');
    console.log('- soft-click: Gentle, rounded tone');
    console.log('- tab-click: Balanced two-tone harmony');
    console.log('- modal-open: Bell-like attention tone');
    console.log('- hover-sound: Very subtle feedback');

    console.log('\n🚀 Ready to create a more satisfying user experience!');
  }
}

// Generate the enhanced sounds
const generator = new SatisfyingAudioGenerator();
generator.generateAllSounds();
