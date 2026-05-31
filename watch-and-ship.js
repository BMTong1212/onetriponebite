const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

const WATCH_DIR = __dirname;
let debounceTimer = null;
let isPrompting = false;

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
console.log('👀 File Watcher Active');
console.log('Monitoring for edits in the project...');
console.log('================================================\n');

fs.watch(WATCH_DIR, { recursive: true }, (eventType, filename) => {
  if (!filename || shouldIgnore(filename)) return;

  // Debounce changes (wait 1.5 seconds after the last save before prompting)
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (isPrompting) return;
    triggerPrompt(filename);
  }, 1500);
});

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
