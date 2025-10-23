# Deployment Guide

This guide will help you deploy RedDrill to Cloudflare Workers.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Already installed via npm dependencies
3. **Node.js**: 20+ or 24+

## Initial Setup

### 1. Authenticate with Cloudflare

```bash
npx wrangler login
```

This will open a browser window for you to authenticate.

### 2. Get Your Account ID

```bash
npx wrangler whoami
```

Copy your `Account ID` from the output.

### 3. Configure wrangler.toml

Edit `wrangler.toml` and uncomment/set your account ID:

```toml
account_id = "your-account-id-here"
```

## Deployment

### First-Time Deployment

```bash
npm run build:full
npm run deploy
```

This will:
1. Build the Next.js application
2. Generate the Cloudflare Worker bundle
3. Deploy to Cloudflare Workers

### Subsequent Deployments

```bash
npm run deploy
```

This runs the full build and deploys in one command.

### Production Deployment

For production environment:

```bash
npm run deploy:production
```

## Environment Configuration

### Adding Environment Variables

Edit `wrangler.toml` to add environment-specific variables:

```toml
# Default environment
[env.production]
name = "reddrill-production"
vars = { ENVIRONMENT = "production" }

# Optional: different account for production
# account_id = "production-account-id"
```

## Custom Domains

### Option 1: Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Workers & Pages → reddrill
3. Click "Triggers" → "Add Custom Domain"
4. Enter your domain (must be on Cloudflare)

### Option 2: wrangler.toml

Add routes to `wrangler.toml`:

```toml
routes = [
  { pattern = "reddrill.yourdomain.com", custom_domain = true }
]
```

## Monitoring & Logs

### View Logs

```bash
npx wrangler tail
```

### View Deployment Info

```bash
npx wrangler deployments list
```

### Check Worker Status

```bash
npx wrangler whoami
```

## Local Preview

Test your worker locally before deployment:

```bash
npm run preview
```

This starts Wrangler dev server at `http://localhost:8787`

## Troubleshooting

### Build Errors

If the build fails:

```bash
# Clean build artifacts
rm -rf .next .open-next

# Rebuild
npm run build:full
```

### Authentication Issues

If deployment fails with auth errors:

```bash
# Re-authenticate
npx wrangler logout
npx wrangler login
```

### Asset Loading Issues

If static assets don't load:

1. Check `.open-next/assets` directory exists after build
2. Verify `wrangler.toml` has correct assets configuration
3. Clear Cloudflare cache in dashboard

## Performance

### Caching

Cloudflare automatically caches static assets. For dynamic content, consider:

1. **KV for Cache**: Add KV namespace for Next.js ISR cache
2. **Edge Cache**: Leverage Cloudflare's CDN
3. **Asset Optimization**: Already handled by Next.js build

### Monitoring

Enable observability in `wrangler.toml`:

```toml
[observability]
enabled = true
```

View metrics in Cloudflare Dashboard → Workers & Pages → reddrill → Metrics

## Cost Estimation

Cloudflare Workers Free Tier:
- **Requests**: 100,000/day
- **Duration**: 10ms CPU time per invocation
- **Bundled**: Yes (included with every account)

For higher traffic, see [Cloudflare Workers Pricing](https://workers.cloudflare.com/pricing)

## Rollback

To rollback to a previous deployment:

```bash
# List deployments
npx wrangler deployments list

# Rollback to specific deployment
npx wrangler rollback [deployment-id]
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build:full
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

Add `CLOUDFLARE_API_TOKEN` to your GitHub repository secrets.

## Security Checklist

- [ ] Set `account_id` in wrangler.toml
- [ ] Never commit API tokens to git
- [ ] Use environment variables for secrets
- [ ] Enable observability for monitoring
- [ ] Set up custom domain with HTTPS
- [ ] Review Cloudflare WAF rules
- [ ] Enable rate limiting if needed

## Support

- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **Wrangler CLI Docs**: https://developers.cloudflare.com/workers/wrangler/
- **OpenNext.js for Cloudflare**: https://opennext.js.org/cloudflare
