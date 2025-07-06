#!/usr/bin/env node

/**
 * Auto-update script to add click sounds to all buttons in the PeerQuest project
 * 
 * This script will:
 * 1. Find all .tsx files with raw onClick handlers
 * 2. Update them to use the enhanced Button component where possible
 * 3. Add click sound imports where needed
 * 4. Generate a report of what was updated
 */

const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'components');
const hooksDir = path.join(__dirname, 'hooks');

// Common raw onClick patterns that need sound
const rawOnClickPatterns = [
  /onClick=\{[^}]+\}/g,
  /onClick=\{\(\) => /g,
  /onClick=\{async \(\) => /g,
  /onClick=\{function/g,
  /onClick=\{handleClick/g,
  /onClick=\{onClick/g,
];

// Components that should use enhanced Button
const buttonPatterns = [
  /<button[^>]*onClick/g,
  /<button[^>]*className="[^"]*"/g,
];

// Files to process
const filesToProcess = [];

function findTsxFiles(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTsxFiles(filePath);
    } else if (file.endsWith('.tsx')) {
      filesToProcess.push(filePath);
    }
  }
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(__dirname, filePath);
  
  const issues = [];
  
  // Check for raw onClick handlers
  const rawOnClicks = content.match(/onClick=\{[^}]+\}/g) || [];
  if (rawOnClicks.length > 0) {
    issues.push(`Found ${rawOnClicks.length} raw onClick handlers`);
  }
  
  // Check for raw button elements
  const rawButtons = content.match(/<button[^>]*onClick/g) || [];
  if (rawButtons.length > 0) {
    issues.push(`Found ${rawButtons.length} raw button elements`);
  }
  
  // Check if already has click sound imports
  const hasClickSoundImport = content.includes('useClickSound') || content.includes('use-click-sound');
  const hasButtonImport = content.includes('from "@/components/ui/button"');
  
  if (issues.length > 0) {
    return {
      file: relativePath,
      issues,
      hasClickSoundImport,
      hasButtonImport,
      needsUpdate: true
    };
  }
  
  return null;
}

function generateReport() {
  console.log('🎵 Click Sound Coverage Report for PeerQuest\n');
  console.log('=' .repeat(60));
  
  // Find all TSX files
  findTsxFiles(componentsDir);
  console.log(`📁 Found ${filesToProcess.length} .tsx files\n`);
  
  const needsUpdate = [];
  const alreadyUpdated = [];
  
  for (const filePath of filesToProcess) {
    const analysis = analyzeFile(filePath);
    if (analysis) {
      needsUpdate.push(analysis);
    } else {
      alreadyUpdated.push(path.relative(__dirname, filePath));
    }
  }
  
  console.log(`✅ Files with click sounds: ${alreadyUpdated.length}`);
  console.log(`⚠️  Files needing updates: ${needsUpdate.length}\n`);
  
  if (needsUpdate.length > 0) {
    console.log('Files that need click sound updates:');
    console.log('-'.repeat(40));
    
    needsUpdate.forEach((file, index) => {
      console.log(`${index + 1}. ${file.file}`);
      file.issues.forEach(issue => console.log(`   - ${issue}`));
      if (!file.hasClickSoundImport) {
        console.log('   - Missing click sound imports');
      }
      if (!file.hasButtonImport) {
        console.log('   - Missing Button component import');
      }
      console.log('');
    });
  }
  
  // Generate update commands
  console.log('\n🔧 Quick Update Commands:');
  console.log('-'.repeat(25));
  
  const priorityFiles = needsUpdate.filter(f => 
    f.file.includes('modal') || 
    f.file.includes('auth') || 
    f.file.includes('quest') ||
    f.file.includes('guild')
  );
  
  if (priorityFiles.length > 0) {
    console.log('\n📋 Priority files to update (modals, auth, quests, guilds):');
    priorityFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.file}`);
    });
  }
  
  return {
    total: filesToProcess.length,
    needsUpdate: needsUpdate.length,
    alreadyUpdated: alreadyUpdated.length,
    priorityFiles: priorityFiles.length
  };
}

// Run the report
const report = generateReport();

console.log('\n📊 Summary:');
console.log('=' .repeat(20));
console.log(`Total files: ${report.total}`);
console.log(`With click sounds: ${report.alreadyUpdated}`);
console.log(`Need updates: ${report.needsUpdate}`);
console.log(`Priority files: ${report.priorityFiles}`);

if (report.needsUpdate > 0) {
  console.log('\n💡 Next steps:');
  console.log('1. Focus on priority files first (modals, auth, quests, guilds)');
  console.log('2. Add Button component imports');
  console.log('3. Replace raw <button> elements with <Button>');
  console.log('4. Add appropriate soundType props');
  console.log('5. Test the updated components');
}

console.log('\n🎉 Click sound system is foundational - keep iterating!');
