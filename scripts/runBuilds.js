const { execSync } = require('child_process');
const fs = require('fs');

const logFile = 'build-execution.log';

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(logFile, logMessage);
}

function runCommand(command, description) {
  log(`\n=== ${description} ===`);
  log(`Command: ${command}`);
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd()
    });
    log(`Output:\n${output}`);
    log(`✓ Success`);
    return { success: true, output };
  } catch (error) {
    log(`✗ Error: ${error.message}`);
    if (error.stdout) log(`Stdout: ${error.stdout}`);
    if (error.stderr) log(`Stderr: ${error.stderr}`);
    log(`Exit Code: ${error.status}`);
    return { success: false, error: error.message, exitCode: error.status };
  }
}

log('========================================');
log('Starting EAS Builds');
log('========================================\n');

// Check authentication
log('Step 1: Checking EAS Authentication...');
const authCheck = runCommand('npx eas-cli whoami', 'Check Authentication');
if (!authCheck.success) {
  log('\n⚠ WARNING: Not authenticated. Builds may fail.');
  log('Run: npx eas-cli login');
}

// Start Android build
log('\n\nStep 2: Starting Android Build...');
const androidResult = runCommand(
  'npx eas-cli build --platform android --profile preview --non-interactive',
  'Android Build'
);

// Start iOS build
log('\n\nStep 3: Starting iOS Build...');
const iosResult = runCommand(
  'npx eas-cli build --platform ios --profile preview --non-interactive',
  'iOS Build'
);

// Check build status
log('\n\nStep 4: Checking Build Status...');
setTimeout(() => {
  runCommand('npx eas-cli build:list --platform all --limit 5', 'Build List');
  
  log('\n\n========================================');
  log('Build Summary:');
  log(`Android: ${androidResult.success ? '✓ Started' : '✗ Failed'}`);
  log(`iOS: ${iosResult.success ? '✓ Started' : '✗ Failed'}`);
  log('========================================');
  log('\nMonitor builds at:');
  log('https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds');
  log('\nFull log saved to: build-execution.log');
}, 10000);



















