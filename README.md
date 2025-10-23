<div align="center">
  <img src="app/icon.svg" alt="RedDrill Icon" width="200" height="200">

  # RedDrill 🔧

  **Mandrill Template Manager for the modern web**

  Built with Next.js 16 • Deployed on Cloudflare Workers ⚡

  [![Deployed on Cloudflare Workers](https://img.shields.io/badge/Deployed%20on-Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.dev)
  [![GitHub](https://img.shields.io/badge/GitHub-erimeilis/reddrill-181717?logo=github)](https://github.com/erimeilis/reddrill)
</div>

---

## ✨ Features

### 📧 Templates (Fully Implemented ✅)
- **Tree & Table Views** - Switch between hierarchical tree and flat table views
- **Visual HTML Editor** - GrapesJS integration for WYSIWYG editing
- **Multisite & Multilanguage Support** - Organize templates by site (labels) and locale
- **Smart Naming Pattern** - `{theme}_{locale}` pattern for easy organization
- **AI-Powered Translation** - Translate templates between languages with 4 providers
- **Real-time Editing** - Live preview and instant updates
- **Theme & Locale Filtering** - Filter templates by theme, label, and locale
- **Clone & Delete** - Duplicate templates and manage lifecycle

### 🌍 Translation System
- **4 Translation Providers** - Cloudflare Workers AI (free), Google Cloud Translation, Azure Translator, Crowdin
- **Row-by-Row Translation** - Preserves HTML structure while translating text
- **Visual Comparison** - Side-by-side original and translated text review
- **One-Click Localization** - Translate and save as new locale variant
- **IndexedDB Storage** - Translation settings stored securely client-side

### 🏷️ Tags (Under Development 🚧)
- Analytics with reputation scores
- Delete tags from UI
- Track opens, clicks, bounces, unsubscribes

### 📤 Senders (Under Development 🚧)
- Monitor sender performance
- DKIM/SPF validation status
- 7-day & 30-day metrics

### 🎨 UX
- 🌓 Dark/Light mode with system detection
- 📱 Fully responsive design
- 🔍 Real-time search & filtering
- 💾 Settings stored in IndexedDB
- ⚡ Loading states & skeletons
- 🎯 Parallel routes for simultaneous views
- 🎨 Custom teal scrollbars throughout

---

## 📋 Template Organization Pattern

RedDrill is designed for **multisite and multilanguage** email template management using a smart naming convention:

### Naming Pattern: `{theme}_{locale}`

**Example:**
- `welcome_en` - Welcome template in English
- `welcome_es` - Welcome template in Spanish
- `newsletter_de` - Newsletter template in German
- `receipt_fr` - Receipt template in French

### Multisite Support with Labels

Templates can be organized by **site** using Mandrill's label system:

**Example Organization:**
- **Label:** `site-shop` → Templates: `welcome_en`, `welcome_es`, `order_en`, `order_es`
- **Label:** `site-blog` → Templates: `newsletter_en`, `newsletter_de`, `digest_en`, `digest_de`
- **Label:** `site-app` → Templates: `reset_en`, `reset_fr`, `verify_en`, `verify_fr`

### Tree View Construction

The tree view intelligently organizes templates using this pattern:

**Mode 1: Theme → Label → Locale**
```
├── welcome (theme)
│   ├── site-shop (label)
│   │   ├── 🇬🇧 en
│   │   └── 🇪🇸 es
│   └── site-app (label)
│       ├── 🇬🇧 en
│       └── 🇫🇷 fr
└── newsletter (theme)
    └── site-blog (label)
        ├── 🇬🇧 en
        └── 🇩🇪 de
```

**Mode 2: Label → Theme → Locale**
```
├── site-shop (label)
│   ├── welcome (theme)
│   │   ├── 🇬🇧 en
│   │   └── 🇪🇸 es
│   └── order (theme)
│       ├── 🇬🇧 en
│       └── 🇪🇸 es
└── site-blog (label)
    ├── newsletter (theme)
    │   ├── 🇬🇧 en
    │   └── 🇩🇪 de
    └── digest (theme)
        ├── 🇬🇧 en
        └── 🇩🇪 de
```

### Features:
- **Smart Flattening** - Single-child nodes automatically flattened for cleaner hierarchy
- **Flag Icons** - Locale displayed with country flags (🇬🇧, 🇪🇸, 🇩🇪, etc.)
- **Counters** - Shows number of templates at each level
- **Sorting** - Default templates appear last for better organization
- **Expand/Collapse All** - Quick navigation controls

---

## 🌍 Translation Provider Setup

RedDrill supports 4 translation providers. Choose based on your needs:

### 1. Cloudflare Workers AI (Recommended - Free!)

**✅ Default Provider** - No configuration needed when deployed to Cloudflare Workers

**Pricing:**
- **Free Tier:** 10,000 neurons/day (~322 translations)
- **Model:** @cf/meta/m2m100-1.2b (multilingual translation)
- **Languages:** 100+ language pairs supported

**Setup:**
1. Deploy RedDrill to Cloudflare Workers (already configured in `wrangler.toml`)
2. That's it! Translation works out-of-the-box 🎉

**Note:** Only works when deployed to Cloudflare Workers, not in local development.

---

### 2. Google Cloud Translation API

**Pricing:**
- **$20 per 1 million characters**
- First 500,000 characters free per month
- Pay-as-you-go, no monthly commitments

**Setup Instructions:**

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com

2. **Create or Select Project**
   - Click project dropdown → "New Project"
   - Enter project name → "Create"

3. **Enable Cloud Translation API**
   - Search for "Cloud Translation API" in top search bar
   - Click "Cloud Translation API"
   - Click "Enable"
   - Or direct link: https://console.cloud.google.com/apis/library/translate.googleapis.com

4. **Create API Key**
   - Go to: APIs & Services → Credentials
   - Click "Create Credentials" → "API Key"
   - Copy the generated API key (save it securely!)

5. **Restrict API Key (Recommended)**
   - Click on the created key to edit
   - Under "API restrictions":
     - Select "Restrict key"
     - Choose "Cloud Translation API" only
   - Under "Application restrictions":
     - Choose "HTTP referrers (web sites)"
     - Add your domain (e.g., `https://your-app.workers.dev/*`)
   - Click "Save"

6. **Configure in RedDrill**
   - Go to Settings → Translation Provider Settings
   - Select "Google Cloud Translation"
   - Paste your API Key
   - Set as primary provider (optional)
   - Click "Save Provider Settings"

---

### 3. Microsoft Azure Translator

**Pricing:**
- **Free Tier:** 2 million characters per month (F0 tier)
- **Paid:** $10 per 1 million characters (S1 tier)
- Includes 50+ languages

**Setup Instructions:**

1. **Go to Azure Portal**
   - Visit: https://portal.azure.com
   - Sign in with Microsoft account

2. **Create Translator Resource**
   - Click "Create a resource" (top left)
   - Search for "Translator"
   - Select "Translator" → Click "Create"

3. **Configure Resource**
   - **Subscription:** Select your Azure subscription
   - **Resource Group:** Create new or select existing
   - **Region:** Choose closest to your users (e.g., East US, West Europe)
   - **Name:** Enter unique name (e.g., `reddrill-translator`)
   - **Pricing Tier:**
     - **F0 (Free):** 2M characters/month
     - **S1 (Standard):** Pay-as-you-go, $10/1M chars

4. **Get API Key and Region**
   - Wait for deployment to complete
   - Click "Go to resource"
   - Click "Keys and Endpoint" in left menu
   - Copy **KEY 1** or **KEY 2** (either works)
   - Note the **Location/Region** (e.g., `eastus`, `westeurope`)

5. **Configure in RedDrill**
   - Go to Settings → Translation Provider Settings
   - Select "Microsoft Azure Translator"
   - Paste **Subscription Key** (KEY 1 or KEY 2)
   - Enter **Region** (e.g., `eastus`, `westeurope`, or `global`)
   - Set as primary provider (optional)
   - Click "Save Provider Settings"

**Direct Link:** https://portal.azure.com/#create/Microsoft.CognitiveServicesTextTranslation

---

### 4. Crowdin

**Pricing:**
- **Paid plans only** - Includes machine translation credits
- **Open Source:** Free for qualifying projects
- **Team:** Starting at $40/month
- **Enterprise:** Custom pricing

**Setup Instructions:**

1. **Create Crowdin Account**
   - Visit: https://crowdin.com
   - Sign up or log in

2. **Create or Select Project**
   - Go to your Crowdin dashboard
   - Create new project or select existing one
   - Note: Project must support machine translation

3. **Get Project ID**
   - Go to project Settings → General
   - Find **Project ID** (numeric ID in URL or settings)
   - Example: In URL `https://crowdin.com/project/12345`, the ID is `12345`

4. **Generate Personal Access Token**
   - Go to: Account Settings → API
   - Direct link: https://crowdin.com/settings#api-key
   - Click "New Token"
   - Enter token name (e.g., "RedDrill Translation")
   - Select scopes:
     - ✅ `projects` (read)
     - ✅ `translations` (read/write)
   - Click "Create"
   - **Copy the token immediately** (shown only once!)

5. **Configure in RedDrill**
   - Go to Settings → Translation Provider Settings
   - Select "Crowdin"
   - Paste **Personal Access Token**
   - Enter **Project ID** (numeric)
   - Set as primary provider (optional)
   - Click "Save Provider Settings"

**Note:** Crowdin uses your project's configured languages and translation memory.

---

### Translation Provider Comparison

| Provider | Free Tier | Paid Pricing | Languages | Best For |
|----------|-----------|-------------|-----------|----------|
| **Cloudflare Workers AI** | 10K neurons/day (~322 translations) | N/A | 100+ | **Default choice**, deployed apps |
| **Google Cloud Translation** | 500K chars/month | $20/1M chars | 130+ | High volume, best quality |
| **Azure Translator** | 2M chars/month | $10/1M chars | 50+ | Microsoft ecosystem, free tier |
| **Crowdin** | Open Source projects | $40+/month | 100+ | Professional localization workflows |

### Translation Features

All providers support:
- ✅ **Row-by-Row Translation** - Preserves HTML structure
- ✅ **Text-Only Translation** - HTML tags and variables preserved
- ✅ **Side-by-Side Review** - Compare original and translated text
- ✅ **One-Click Save** - Create new locale variant instantly

---

## 🛠️ Tech Stack

**Frontend:** Next.js 16.0 • React 19.2 • TypeScript 5.9 • Tailwind CSS 4 • Radix UI • Zustand 5

**Editor:** GrapesJS • CodeMirror

**Translation:** Cloudflare Workers AI • Google Cloud Translation • Azure Translator • Crowdin

**Performance:** React Compiler • Cache Components • Turbopack File System Caching

**Deployment:** Cloudflare Workers • OpenNext.js

**Dev Tools:** ESLint 9 • Next.js DevTools MCP • Turbopack

**Storage:** IndexedDB (idb) for client-side settings and translation cache

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ or 24+
- [Mandrill API Key](https://mandrillapp.com/)
- (Optional) Translation provider API keys

### Installation

```bash
# Clone repository
git clone https://github.com/erimeilis/reddrill.git
cd reddrill

# Install dependencies
npm install

# Configure Mandrill API key in UI (Settings page)

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

**Note:** Cloudflare Workers AI translation only works when deployed to Cloudflare Workers, not in local development. Use Google, Azure, or Crowdin for local testing.

---

## 📦 Deployment

### Deploy to Cloudflare Workers

```bash
# Build for Cloudflare Workers
npm run build:full

# Preview locally with Cloudflare environment
npm run preview

# Deploy to production
npm run deploy
```

### Configuration

1. **Get Cloudflare Account ID:**
   ```bash
   npx wrangler whoami
   ```

2. **Update `wrangler.toml`:**
   ```toml
   account_id = "your-account-id"
   name = "reddrill"
   compatibility_date = "2025-10-01"

   [ai]
   binding = "AI"  # Enables Cloudflare Workers AI
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

4. **Configure API Keys:**
   - Open your deployed app URL
   - Go to Settings
   - Enter Mandrill API key
   - (Optional) Configure translation providers

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

---

## 📁 Project Structure

```
reddrill/
├── app/                           # Next.js App Router
│   ├── @entity/                  # Entity details parallel route
│   │   └── templates/[slug]/     # Template edit form
│   ├── @structure/               # List views parallel route
│   │   ├── templates/            # Template list (table/tree)
│   │   ├── tags/                 # Tags list
│   │   └── senders/              # Senders list
│   ├── api/
│   │   └── translate/            # Translation API route
│   ├── globals.css               # Global styles + custom scrollbar
│   └── layout.tsx                # Root layout with parallel routes
│
├── components/
│   ├── ui/                       # Reusable Radix UI components
│   ├── templates/
│   │   ├── template-edit-form.tsx       # GrapesJS editor
│   │   ├── template-tree-view.tsx       # Hierarchical tree view
│   │   ├── templates-page.tsx           # Table view
│   │   └── tree-node.tsx                # Tree node component
│   ├── translation/
│   │   ├── translate-template-dialog.tsx  # Translation UI
│   │   └── translation-settings.tsx       # Provider configuration
│   ├── tags/                     # Tag components
│   └── senders/                  # Sender components
│
├── lib/
│   ├── api/
│   │   └── mandrill.ts           # Mandrill API client
│   ├── db/
│   │   └── translation-settings-db.ts  # IndexedDB for settings
│   ├── hooks/                    # Custom React hooks
│   ├── store/                    # Zustand state stores
│   └── utils/
│       ├── html-translator.ts    # HTML parsing for translation
│       ├── template-parser.ts    # Parse {theme}_{locale} pattern
│       └── template-tree.ts      # Build tree from templates
│
├── types/                        # TypeScript type definitions
├── wrangler.toml                 # Cloudflare Workers config
└── next.config.ts                # Next.js configuration
```

---

## 🔐 Security

- 🔒 **API keys stored in IndexedDB** (not localStorage)
- 🌐 **HTTPS-only API calls** to Mandrill and translation services
- 🚫 **No server-side secrets** - all credentials client-side
- 🔕 **No logging of sensitive data** (API keys, email content)
- 🛡️ **CSP headers** for XSS protection
- 🔐 **API key restrictions** recommended for all providers

---

## ⚡ Performance

- 🌍 **Edge deployment** on Cloudflare's global network (300+ cities)
- 📦 **Static generation** with Next.js App Router
- ⚡ **Sub-100ms response times** from edge locations
- 🎯 **Code splitting** - Only load what you need
- 💾 **Client-side caching** with IndexedDB
- 🚀 **Turbopack** for fast builds
- ⚛️ **React Compiler** for optimized renders

---

## 🌐 Browser Support

✅ Chrome 120+ • Edge 120+ • Firefox 120+ • Safari 17+ • iOS Safari 17+ • Chrome Mobile 120+

**Requirements:**
- ES2022 support
- IndexedDB support
- CSS Grid & Flexbox
- CSS Custom Properties

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork the repository**
2. **Create feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit changes:** `git commit -m 'Add amazing feature'`
4. **Push to branch:** `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines

- Use TypeScript for all new code
- Follow existing code style (ESLint)
- Add tests for new features
- Update documentation as needed
- Keep commits atomic and descriptive

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

### Core Technologies
- [Mandrill](https://mandrillapp.com/) - Email infrastructure by Mailchimp
- [Next.js](https://nextjs.org/) - React framework by Vercel
- [Cloudflare Workers](https://workers.cloudflare.com/) - Edge compute platform
- [OpenNext.js](https://opennext.js.org/) - Next.js adapter for serverless

### UI & Components
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Tabler Icons](https://tabler-icons.io/) - Beautiful icon library
- [GrapesJS](https://grapesjs.com/) - Web builder framework

### Translation
- [Cloudflare Workers AI](https://ai.cloudflare.com/) - Edge AI inference
- [Google Cloud Translation](https://cloud.google.com/translate) - Neural machine translation
- [Azure Translator](https://azure.microsoft.com/en-us/services/cognitive-services/translator/) - Microsoft translation service
- [Crowdin](https://crowdin.com/) - Localization management platform

### State & Data
- [Zustand](https://zustand-demo.pmnd.rs/) - Lightweight state management
- [idb](https://github.com/jakearchibald/idb) - IndexedDB wrapper

---

**Made with 💙💛 using Next.js and Cloudflare Workers**
