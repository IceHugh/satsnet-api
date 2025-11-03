#!/usr/bin/env node

/**
 * Cloudflare Build Post-processing Script
 * This script processes the build output for Cloudflare Pages compatibility
 */

import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');

console.log('🚀 Post-processing build for Cloudflare Pages...');

// Read the built index.js file
const indexPath = path.join(distDir, 'index.js');
if (!fs.existsSync(indexPath)) {
  console.error('❌ Built index.js not found');
  process.exit(1);
}

let content = fs.readFileSync(indexPath, 'utf8');

// Add environment detection at the top of the file
const environmentDetection = `
// Cloudflare Pages environment detection
if (typeof globalThis !== 'undefined' && globalThis.fetch) {
  globalThis.__CLOUDFLARE_PAGES__ = true;
}

// Polyfill for Node.js globals if needed
if (typeof Buffer === 'undefined') {
  globalThis.Buffer = require('buffer').Buffer;
}

if (typeof process === 'undefined') {
  globalThis.process = { env: {}, versions: {} };
}
`;

content = environmentDetection + content;

// Add export for Cloudflare Pages
const exportStatement = `
// Export for Cloudflare Pages
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SatsNetClient, createClient, satsnet };
}
`;

content += exportStatement;

// Write the processed content back
fs.writeFileSync(indexPath, content);

// Create a separate web bundle
const webBundlePath = path.join(distDir, 'web.js');
fs.copyFileSync(indexPath, webBundlePath);

console.log('✅ Cloudflare Pages post-processing complete');
console.log('📁 Processed files:');
console.log(`   - ${indexPath}`);
console.log(`   - ${webBundlePath}`);
