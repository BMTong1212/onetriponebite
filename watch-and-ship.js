const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

const WATCH_DIR = __dirname;
let debounceTimer = null;
let isPrompting = false;
let isShipping = false;
const isAuto = process.argv.includes('--auto') || process.argv.includes('-a');

// Folders and files to ignore
const IGNORE_LIST = [
  '.git',
  'node_modules',
  '.vercel',
  '.DS_Store',
  'watch-and-ship.js',
  '.env.local',
  '.env.production.local',
  '.env.development.local'
];

function shouldIgnore(filePath) {
  const parts = filePath.split(path.sep);
  return IGNORE_LIST.some(item => parts.includes(item) || filePath.endsWith(item));
}

console.log('================================================');
console.log(`👀 File Watcher Active [Mode: ${isAuto ? 'AUTO' : 'INTERACTIVE'}]`);
if (isAuto) {
  console.log('Monitoring for edits. Changes will be deployed automatically.');
} else {
  console.log('Monitoring for edits. You will be prompted before deployment.');
}
console.log('================================================\n');

fs.watch(WATCH_DIR, { recursive: true }, (eventType, filename) => {
  if (!filename || shouldIgnore(filename)) return;

  // Debounce changes (wait 1.5 seconds after the last save)
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (isPrompting || isShipping) return;
    if (isAuto) {
      shipAutomatically(filename);
    } else {
      triggerPrompt(filename);
    }
  }, 1500);
});

function shipAutomatically(changedFile) {
  isShipping = true;
  console.log(`\n🔔 Change detected in: ${changedFile}`);
  console.log('🚢 Auto-shipping changes (Vercel, GitHub, Google Apps Script)...\n');

  const commitMsg = `Auto-update: ${changedFile} saved`;
  const child = spawn('./ship.sh', [commitMsg], { stdio: 'inherit' });

  child.on('close', (code) => {
    isShipping = false;
    console.log('\n================================================');
    console.log('👀 Watching for file changes (Auto-mode)...');
    console.log('================================================\n');
  });
}

function triggerPrompt(changedFile) {
  isPrompting = true;
  console.log(`\n🔔 Change detected in: ${changedFile}`);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('🚀 Do you want to ship these changes now? (y/n): ', (answer) => {
    rl.close();
    isPrompting = false;

    if (answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes') {
      console.log('\n🚢 Starting ship.sh...\n');
      
      // Spawn ship.sh in inherit mode so it takes user inputs for the commit message
      const child = spawn('./ship.sh', [], { stdio: 'inherit' });
      
      child.on('close', (code) => {
        console.log('\n================================================');
        console.log('👀 Watching for file changes...');
        console.log('================================================\n');
      });
    } else {
      console.log('Skipped. Continuing to watch for changes...');
    }
  });
}
