#!/usr/bin/env node

/**
 * RedDrill - Deployment Script
 *
 * This script handles the complete deployment process:
 * 0. Update wrangler to latest version
 * 1. Load environment variables from .env
 * 2. Check/create D1 database
 * 3. Generate wrangler.toml from template
 * 4. Run database migrations
 * 5. Build the application
 * 6. Deploy to Cloudflare
 */

import { execSync, spawnSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = resolve(__dirname, '..')

// Parse command line flags
const args = process.argv.slice(2)
const skipMigrations = args.includes('--skip-migrations')
const skipBuild = args.includes('--skip-build')
const dryRun = args.includes('--dry-run')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logStep(step, message) {
  log(`\n${colors.bright}[${step}]${colors.reset} ${message}`, 'cyan')
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green')
}

function logWarning(message) {
  log(`  ⚠ ${message}`, 'yellow')
}

function logError(message) {
  log(`  ✗ ${message}`, 'red')
}

function exec(command, options = {}) {
  try {
    return execSync(command, {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    })
  } catch (error) {
    if (options.ignoreError) {
      return error.stdout || ''
    }
    throw error
  }
}

function execJson(command) {
  try {
    const output = execSync(command, {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return JSON.parse(output)
  } catch (error) {
    logWarning(`execJson failed for "${command}": ${error.message}`)
    return null
  }
}

// Update wrangler in root directory
function updateWrangler() {
  logStep('0/6', 'Updating wrangler to latest version...')

  try {
    exec('npm update wrangler', { silent: true })
    logSuccess('Updated wrangler')
  } catch (error) {
    logWarning(`Failed to update wrangler: ${error.message}`)
  }
}

// Load .env file
function loadEnv() {
  const envPath = resolve(ROOT_DIR, '.env')

  if (!existsSync(envPath)) {
    logWarning('.env file not found, using defaults')
    return {}
  }

  const envContent = readFileSync(envPath, 'utf-8')
  const env = {}

  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim()
      }
    }
  }

  return env
}

// Check if D1 database exists, create if not
async function ensureDatabase(env) {
  logStep('2/6', 'Checking D1 database...')

  const dbName = 'reddrill-audit'
  let dbId = env.D1_DATABASE_ID

  // If database ID is already configured, verify it exists
  if (dbId) {
    logSuccess(`Using configured database ID: ${dbId}`)
    return dbId
  }

  // List existing databases
  const listOutput = execJson('wrangler d1 list --json')

  if (listOutput && Array.isArray(listOutput)) {
    const existingDb = listOutput.find(db => db.name === dbName)
    if (existingDb) {
      dbId = existingDb.uuid
      logSuccess(`Database "${dbName}" exists (ID: ${dbId})`)
      return dbId
    }
  }

  // Create database if not found
  logWarning(`Database "${dbName}" not found, creating...`)

  try {
    const createOutput = exec(`wrangler d1 create ${dbName}`, { silent: true })
    // Parse the database ID from output
    const match = createOutput.match(/database_id\s*=\s*"([^"]+)"/)
    if (match) {
      dbId = match[1]
      logSuccess(`Created database "${dbName}" (ID: ${dbId})`)
    }
  } catch (error) {
    // If creation failed because it already exists, try to get the ID again
    if (error.message.includes('already exists')) {
      logWarning('Database already exists, fetching ID...')
      const retryList = execJson('wrangler d1 list --json')
      if (retryList && Array.isArray(retryList)) {
        const db = retryList.find(d => d.name === dbName)
        if (db) {
          dbId = db.uuid
          logSuccess(`Found existing database (ID: ${dbId})`)
          return dbId
        }
      }
    }
    logError(`Failed to create database: ${error.message}`)
    process.exit(1)
  }

  return dbId
}

// Generate wrangler.toml from template
function generateWranglerConfig(env, dbId) {
  logStep('3/6', 'Generating wrangler.toml from template...')

  const templatePath = resolve(ROOT_DIR, 'wrangler.toml.template')
  const outputPath = resolve(ROOT_DIR, 'wrangler.toml')

  if (!existsSync(templatePath)) {
    logError('wrangler.toml.template not found!')
    process.exit(1)
  }

  let content = readFileSync(templatePath, 'utf-8')

  // Replace D1 database ID
  content = content.replace(/\{\{D1_DATABASE_ID\}\}/g, dbId)

  // Generate routes from CUSTOM_DOMAIN
  let routes = '# No custom domain configured - using workers.dev subdomain'
  if (env.CUSTOM_DOMAIN && env.CUSTOM_DOMAIN.trim()) {
    routes = `[[routes]]
pattern = "${env.CUSTOM_DOMAIN.trim()}"
custom_domain = true`
  }
  content = content.replace(/\{\{ROUTES\}\}/g, routes)

  writeFileSync(outputPath, content)
  logSuccess('Generated wrangler.toml')

  if (env.CUSTOM_DOMAIN) {
    logSuccess(`Custom domain: ${env.CUSTOM_DOMAIN}`)
  }
}

// Run database migrations
async function runMigrations() {
  if (skipMigrations) {
    logStep('4/6', 'Skipping database migrations (--skip-migrations)')
    return
  }

  logStep('4/6', 'Running database migrations...')

  try {
    exec('wrangler d1 migrations apply reddrill-audit --remote', { silent: false })
    logSuccess('Migrations applied successfully')
  } catch (error) {
    logError(`Migration failed: ${error.message}`)
    process.exit(1)
  }
}

// Build the application
async function buildApp() {
  if (skipBuild) {
    logStep('5/6', 'Skipping build (--skip-build)')
    return
  }

  logStep('5/6', 'Building application...')

  try {
    // Build Next.js
    log('\n  Building Next.js...', 'blue')
    exec('npm run build', { silent: false })
    logSuccess('Next.js build complete')

    // Build worker
    log('\n  Building Cloudflare Worker...', 'blue')
    exec('npm run build:worker', { silent: false })
    logSuccess('Worker build complete')

    // Fix duplicate keys
    log('\n  Fixing duplicate keys...', 'blue')
    exec('npm run build:fix', { silent: false })
    logSuccess('Duplicate keys fixed')
  } catch (error) {
    logError(`Build failed: ${error.message}`)
    process.exit(1)
  }
}

// Deploy to Cloudflare
async function deploy() {
  logStep('6/6', 'Deploying to Cloudflare...')

  if (dryRun) {
    logWarning('Dry run mode - skipping actual deployment')
    return
  }

  try {
    exec('wrangler deploy', { silent: false })
    logSuccess('Deployment complete')
  } catch (error) {
    logError(`Deployment failed: ${error.message}`)
    process.exit(1)
  }
}

// Main deployment flow
async function main() {
  log('\n========================================', 'bright')
  log('  RedDrill - Deployment Script', 'bright')
  log('========================================\n', 'bright')

  if (dryRun) {
    logWarning('Running in dry-run mode - no changes will be deployed')
  }

  // Step 0: Update wrangler
  updateWrangler()

  // Step 1: Load environment
  logStep('1/6', 'Loading environment configuration...')
  const env = loadEnv()
  logSuccess('Loaded .env configuration')

  // Step 2: Ensure database exists
  const dbId = await ensureDatabase(env)

  // Step 3: Generate wrangler.toml from template
  generateWranglerConfig(env, dbId)

  // Step 4: Run migrations
  await runMigrations()

  // Step 5: Build application
  await buildApp()

  // Step 6: Deploy
  await deploy()

  log('\n========================================', 'bright')
  log('  Deployment Complete!', 'green')
  log('========================================\n', 'bright')

  if (env.CUSTOM_DOMAIN) {
    log(`  URL: https://${env.CUSTOM_DOMAIN}`, 'cyan')
  } else {
    log(`  URL: https://reddrill.<your-subdomain>.workers.dev`, 'cyan')
  }
  log('')
}

main().catch(error => {
  logError(`Deployment failed: ${error.message}`)
  process.exit(1)
})
