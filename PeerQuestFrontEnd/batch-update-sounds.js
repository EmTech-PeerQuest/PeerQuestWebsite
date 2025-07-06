#!/usr/bin/env node

/**
 * Mass Update Script for Click Sounds
 * 
 * This script provides a systematic approach to add click sounds to multiple components.
 * Run this after you've tested the foundational system on a few components.
 */

const fs = require('fs');
const path = require('path');

// Template for adding imports to components
const IMPORTS_TO_ADD = `
import { Button } from "@/components/ui/button"
import { useClickSound } from "@/hooks/use-click-sound"
import { useAudioContext } from "@/context/audio-context"
`;

// Template for adding hook usage
const HOOK_USAGE = `
  const { soundEnabled, volume } = useAudioContext()
  const { playSound } = useClickSound({ enabled: soundEnabled, volume })
`;

// Common button replacement patterns
const BUTTON_REPLACEMENTS = [
  {
    // Simple close button
    from: /<button[^>]*onClick=\{onClose\}[^>]*>\s*<X[^>]*\/>\s*<\/button>/g,
    to: `<Button onClick={onClose} variant="ghost" size="icon" soundType="modal" className="text-gray-400 hover:text-gray-600">
      <X size={20} />
    </Button>`
  },
  {
    // Cancel button
    from: /<button[^>]*onClick=\{[^}]*close[^}]*\}[^>]*>\s*Cancel\s*<\/button>/g,
    to: `<Button onClick={onClose} variant="outline" soundType="soft">Cancel</Button>`
  },
  {
    // Confirm/Submit button  
    from: /<button[^>]*type="submit"[^>]*>/g,
    to: `<Button type="submit" variant="default" soundType="success"`
  }
];

// Priority files to update (most important user interactions)
const PRIORITY_FILES = [
  'components/auth/auth-modal.tsx',
  'components/modals/confirmation-modal.tsx', 
  'components/modals/report-details-modal.tsx',
  'components/quests/quest-details-modal.tsx',
  'components/quests/post-quest-modal.tsx',
  'components/guilds/guild-overview-modal.tsx',
  'components/gold/gold-purchase-modal.tsx',
  'components/messaging/messaging-modal.tsx',
];

function updateComponent(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Check if already has imports
  const hasButtonImport = content.includes('from "@/components/ui/button"');
  const hasClickSoundImport = content.includes('useClickSound');
  
  let updated = false;
  
  // Add imports if missing
  if (!hasButtonImport || !hasClickSoundImport) {
    const importIndex = content.indexOf('\n\n');
    if (importIndex > 0) {
      content = content.slice(0, importIndex) + IMPORTS_TO_ADD + content.slice(importIndex);
      updated = true;
    }
  }
  
  // Add hook usage if missing
  if (!content.includes('useClickSound({')) {
    const functionStart = content.indexOf('export function') || content.indexOf('export default function');
    if (functionStart > 0) {
      const openBrace = content.indexOf('{', functionStart);
      const insertPoint = content.indexOf('\n', openBrace) + 1;
      content = content.slice(0, insertPoint) + HOOK_USAGE + content.slice(insertPoint);
      updated = true;
    }
  }
  
  // Apply button replacements
  BUTTON_REPLACEMENTS.forEach(replacement => {
    const newContent = content.replace(replacement.from, replacement.to);
    if (newContent !== content) {
      content = newContent;
      updated = true;
    }
  });
  
  // Count remaining raw buttons
  const remainingButtons = (content.match(/<button[^>]*onClick/g) || []).length;
  
  if (updated && content !== originalContent) {
    // Backup original
    fs.writeFileSync(filePath + '.backup', originalContent);
    // Write updated content
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filePath}`);
    console.log(`   📊 Remaining raw buttons: ${remainingButtons}`);
    return true;
  }
  
  console.log(`ℹ️  No changes needed: ${filePath}`);
  return false;
}

function batchUpdate() {
  console.log('🚀 Starting batch update for click sounds...\n');
  
  let updated = 0;
  let total = 0;
  
  console.log('📋 Processing priority files:');
  console.log('='.repeat(40));
  
  PRIORITY_FILES.forEach(file => {
    total++;
    const fullPath = path.join(__dirname, file);
    if (updateComponent(fullPath)) {
      updated++;
    }
  });
  
  console.log(`\n📊 Batch Update Summary:`);
  console.log(`=`.repeat(25));
  console.log(`Files processed: ${total}`);
  console.log(`Files updated: ${updated}`);
  console.log(`Success rate: ${((updated/total) * 100).toFixed(1)}%`);
  
  if (updated > 0) {
    console.log(`\n💾 Backups created with .backup extension`);
    console.log(`\n🧪 Next steps:`);
    console.log(`1. Test the updated components`);
    console.log(`2. Run error checking: npm run build`);
    console.log(`3. Check for any manual fixes needed`);
    console.log(`4. Commit changes when satisfied`);
    console.log(`5. Continue with remaining files`);
  }
  
  console.log(`\n🎵 Click sound system deployment in progress!`);
}

// Run the batch update
batchUpdate();
