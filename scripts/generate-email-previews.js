#!/usr/bin/env node

/**
 * Generate email template previews
 * Run: node scripts/generate-email-previews.js
 */

const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('🎨 Generating email template previews...\n');

  const scriptPath = path.join(
    __dirname,
    '../src/lib/notifications/generate-email-previews.ts'
  );

  execSync(`npx tsx "${scriptPath}"`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

} catch (error) {
  console.error('❌ Error generating previews:', error.message);
  process.exit(1);
}
