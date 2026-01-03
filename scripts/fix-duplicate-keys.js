#!/usr/bin/env node

/**
 * Fix duplicate "options" keys in bundled handler.mjs from @floating-ui library
 * This script patches the generated OpenNext handler before wrangler deploys it
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const handlerPath = resolve(__dirname, '../.open-next/server-functions/default/handler.mjs')

if (!existsSync(handlerPath)) {
  console.log('⚠️  Handler file not found, skipping duplicate key fix')
  process.exit(0)
}

console.log('🔧 Fixing duplicate "options" keys in handler.mjs...')

let content = readFileSync(handlerPath, 'utf-8')
let fixCount = 0

// Pattern: ...}},options:[c2,e2]} where the options:[...] is a duplicate
// Fix: Remove the duplicate ",options:[...]" that appears after }}

// Simple pattern: match "}},options:[...]" and replace with just "}}"
// This removes the duplicate options array notation
const duplicatePattern = /\}\},options:\[[^\]]+\]/g

content = content.replace(duplicatePattern, (match) => {
  fixCount++
  return '}}'
})

if (fixCount > 0) {
  writeFileSync(handlerPath, content, 'utf-8')
  console.log(`✅ Fixed ${fixCount} duplicate "options" keys`)
} else {
  console.log('✅ No duplicate keys found (already fixed or pattern changed)')
}
