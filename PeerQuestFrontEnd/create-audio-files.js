#!/usr/bin/env node

/**
 * Audio File Generator for Click Sound System
 * 
 * This script creates silent placeholder MP3 files for the click sound system.
 * Replace these with actual sound files when you have them.
 */

const fs = require('fs');
const path = require('path');

// Audio files needed by the click sound system
const audioFiles = [
  'button-click.mp3',
  'nav-click.mp3', 
  'success-click.mp3',
  'error-click.mp3',
  'soft-click.mp3',
  'tab-click.mp3',
  'modal-open.mp3',
  'hover-sound.mp3',
  'dropdown-click.mp3',
  'card-click.mp3'
];

const audioDir = path.join(__dirname, 'public', 'audio');

// Ensure audio directory exists
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
  console.log('📁 Created audio directory');
}

// Base64 encoded silent MP3 (very short, ~0.1 seconds)
const silentMp3Base64 = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA';

function createSilentMp3(filename) {
  const filePath = path.join(audioDir, filename);
  
  if (fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${filename} (already exists)`);
    return;
  }
  
  try {
    const buffer = Buffer.from(silentMp3Base64, 'base64');
    fs.writeFileSync(filePath, buffer);
    console.log(`✅ Created ${filename}`);
  } catch (error) {
    console.error(`❌ Failed to create ${filename}:`, error.message);
  }
}

console.log('🎵 Creating placeholder audio files...\n');

audioFiles.forEach(createSilentMp3);

console.log('\n📊 Summary:');
console.log(`Created placeholder files in: ${audioDir}`);
console.log('\n💡 Next steps:');
console.log('1. Replace these silent files with actual sound effects');
console.log('2. Keep file names the same for the system to work');
console.log('3. Recommended: Short (0.1-0.5s), clear click sounds');
console.log('4. Test the audio system in your browser');

console.log('\n🎯 File purposes:');
console.log('- button-click.mp3: Standard button interactions');
console.log('- nav-click.mp3: Navigation menu items');
console.log('- success-click.mp3: Success actions (save, submit)');
console.log('- error-click.mp3: Error/warning actions');
console.log('- soft-click.mp3: Subtle interactions (cancel, close)');
console.log('- tab-click.mp3: Tab switching');
console.log('- modal-open.mp3: Modal opening/closing');
console.log('- hover-sound.mp3: Hover feedback (optional)');
console.log('- dropdown-click.mp3: Dropdown menus');
console.log('- card-click.mp3: Card interactions');

console.log('\n🚀 Audio system ready! No more 404 errors.');
