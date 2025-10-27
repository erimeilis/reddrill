#!/usr/bin/env node

/**
 * Fix duplicate "options" keys in bundled handler.mjs from @floating-ui library
 * This script patches the generated OpenNext handler before wrangler deploys it
 */

const fs = require('fs');
const path = require('path');

const handlerPath = path.join(__dirname, '../.open-next/server-functions/default/handler.mjs');

if (!fs.existsSync(handlerPath)) {
  console.log('⚠️  Handler file not found, skipping duplicate key fix');
  process.exit(0);
}

console.log('🔧 Fixing duplicate "options" keys in handler.mjs...');

let content = fs.readFileSync(handlerPath, 'utf-8');
let fixCount = 0;

// Pattern: ...}},options:[c2,e2]} where the options:[...] is a duplicate
// Fix: Remove the duplicate ",options:[...]" that appears after }}

// Simple pattern: match "}},options:[...]" and replace with just "}}"
// This removes the duplicate options array notation
const duplicatePattern = /\}\},options:\[[^\]]+\]/g;

content = content.replace(duplicatePattern, (match) => {
  fixCount++;
  return '}}';
});

if (fixCount > 0) {
  fs.writeFileSync(handlerPath, content, 'utf-8');
  console.log(`✅ Fixed ${fixCount} duplicate "options" keys`);
} else {
  console.log('✅ No duplicate keys found (already fixed or pattern changed)');
}
