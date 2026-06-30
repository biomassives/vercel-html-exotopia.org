/* eslint-env node */
const { configure } = require('quasar/wrappers')
const { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } = require('fs')
const { join, extname } = require('path')
const { spawnSync } = require('child_process')

/**
 * Vite plugin: transform .md files into ES modules that export the raw text.
 * Enables import.meta.globEager('../../blog-*.md') in src/data/blog-posts.ts.
 */
function markdownPlugin () {
  return {
    name: 'raw-markdown',
    transform (src, id) {
      if (!id.endsWith('.md')) return null
      return { code: `export default ${JSON.stringify(src)}`, map: null }
    },
  }
}

/**
 * Vite plugin: serve any path under /gallery/, /reportal/, or other legacy
 * HTML directories as raw static files, bypassing Vite's transformIndexHtml
 * pipeline.  Those files contain data: URIs and injected scripts that confuse
 * Vite's HTML parser.
 */
function staticPassthroughPlugin () {
  const STATIC_PREFIXES = ['/gallery/', '/reportal/']

  return {
    name: 'static-html-passthrough',
    configureServer (server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        const isLegacyPath = STATIC_PREFIXES.some(p => url.startsWith(p))
        if (!isLegacyPath) return next()

        const filePath = join(process.cwd(), url)
        if (!existsSync(filePath)) return next()

        const ext = url.split('.').pop()?.toLowerCase()
        const mime = {
          html: 'text/html',
          js:   'text/javascript',
          css:  'text/css',
          json: 'application/json',
          png:  'image/png',
          jpg:  'image/jpeg',
          gif:  'image/gif',
          svg:  'image/svg+xml',
          woff2:'font/woff2',
        }[ext] ?? 'application/octet-stream'

        res.setHeader('Content-Type', mime + (mime.startsWith('text') ? '; charset=utf-8' : ''))
        res.end(readFileSync(filePath))
      })
    },
  }
}

const ECO_IMG_DIR = 'public/eco-images'
const IMG_EXTS    = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'])

/**
 * Dev-only plugin: three endpoints for the eco-library editor.
 *  POST /api/save-library         — write ot6a.json + git commit + push
 *  POST /api/upload-image?name=x  — save image to public/eco-images/
 *  GET  /api/eco-images           — list images already in public/eco-images/
 */
function ecoLibrarySavePlugin () {
  return {
    name: 'eco-library-save',
    configureServer (server) {

      // ── save-library ──────────────────────────────────────────────
      server.middlewares.use('/api/save-library', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('Method Not Allowed'); return }

        let body = ''
        req.setEncoding('utf8')
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          res.setHeader('Content-Type', 'application/json')
          try {
            const data = JSON.parse(body)
            const filePath = join(process.cwd(), 'public', 'ot6a.json')
            writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n')

            const cwd = process.cwd()
            spawnSync('git', ['add', 'public/ot6a.json'], { cwd })
            const commit = spawnSync('git', ['commit', '-m', 'chore: update eco-library'], { cwd, encoding: 'utf8' })
            const push   = spawnSync('git', ['push'], { cwd, encoding: 'utf8' })

            const committed = !(commit.stdout ?? '').includes('nothing to commit')
            res.end(JSON.stringify({
              ok: true, committed,
              commitMsg: (commit.stdout ?? commit.stderr ?? '').trim().split('\n')[0],
              pushMsg:   (push.stdout  ?? push.stderr  ?? '').trim().split('\n')[0],
            }))
          } catch (e) {
            res.statusCode = 500
            res.end(JSON.stringify({ ok: false, error: String(e) }))
          }
        })
      })

      // ── upload-image ──────────────────────────────────────────────
      server.middlewares.use('/api/upload-image', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('Method Not Allowed'); return }

        const url    = new URL(req.url, 'http://x')
        const raw    = url.searchParams.get('name') ?? `img-${Date.now()}.jpg`
        const safe   = raw.replace(/[^a-z0-9._-]/gi, '_').toLowerCase()
        const ext    = extname(safe)
        const imgDir = join(process.cwd(), ECO_IMG_DIR)
        mkdirSync(imgDir, { recursive: true })

        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', () => {
          res.setHeader('Content-Type', 'application/json')
          try {
            if (!IMG_EXTS.has(ext)) throw new Error(`Unsupported extension: ${ext}`)
            writeFileSync(join(imgDir, safe), Buffer.concat(chunks))
            res.end(JSON.stringify({ ok: true, url: `/eco-images/${safe}` }))
          } catch (e) {
            res.statusCode = 400
            res.end(JSON.stringify({ ok: false, error: String(e) }))
          }
        })
      })

      // ── eco-images listing ────────────────────────────────────────
      server.middlewares.use('/api/eco-images', (req, res) => {
        if (req.method !== 'GET') { res.statusCode = 405; res.end('Method Not Allowed'); return }
        res.setHeader('Content-Type', 'application/json')
        try {
          const imgDir = join(process.cwd(), ECO_IMG_DIR)
          mkdirSync(imgDir, { recursive: true })
          const files = readdirSync(imgDir)
            .filter(f => IMG_EXTS.has(extname(f).toLowerCase()))
            .map(f => `/eco-images/${f}`)
          res.end(JSON.stringify({ ok: true, images: files }))
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ ok: false, error: String(e) }))
        }
      })

    },
  }
}

module.exports = configure(function (/* ctx */) {
  return {
    // Boot files run before the app component is mounted
    boot: ['pinia', 'member'],

    css: ['app.scss'],

    extras: [
      'material-icons',
      'mdi-v7',
      'roboto-font',
    ],

    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node20',
      },

      vueRouterMode: 'hash',

      // Help Vite pre-bundle the large Three.js package
      extendViteConf (viteConf) {
        viteConf.optimizeDeps = viteConf.optimizeDeps || {}
        viteConf.optimizeDeps.include = [
          ...(viteConf.optimizeDeps.include || []),
          'three',
        ]

        // Allow Vite to serve files from the project root and the workspace-level
        // node_modules where @quasar/extras (fonts, icons) lives.
        // Setting fs.allow explicitly drops Vite's implicit project-root entry,
        // so we must list both the project dir and the parent node_modules.
        viteConf.server = viteConf.server || {}
        viteConf.server.fs = {
          strict: true,
          allow: [
            __dirname,                              // project root + .quasar generated files
            join(__dirname, '..', 'node_modules'),  // workspace-level @quasar/extras
          ],
        }

        // Serve legacy HTML directories as static files (bypasses HTML parser)
        viteConf.plugins = viteConf.plugins || []
        viteConf.plugins.push(markdownPlugin())
        viteConf.plugins.push(staticPassthroughPlugin())
        viteConf.plugins.push(ecoLibrarySavePlugin())
      },
    },

    devServer: {
      open: true,
    },

    framework: {
      config: {
        dark: true,
        brand: {
          primary:   '#1a73e8',
          secondary: '#26a69a',
          accent:    '#9c27b0',
          dark:      '#0a0f1e',
          positive:  '#21ba45',
          negative:  '#c10015',
          info:      '#31ccec',
          warning:   '#f2c037',
        },
        notify: { position: 'bottom-right' },
      },

      plugins: ['Notify', 'Dialog', 'Loading'],
    },

    animations: ['fadeIn', 'fadeOut'],

    pwa: {
      workboxMode: 'generateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,
    },
  }
})
