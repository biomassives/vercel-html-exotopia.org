/* eslint-env node */
import { configure } from 'quasar/wrappers'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { join, extname, dirname } from 'path'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

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
  const STATIC_PREFIXES = ['/gallery/', '/reportal/', '/print/']

  return {
    name: 'static-html-passthrough',
    configureServer (server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        const isLegacyPath = STATIC_PREFIXES.some(p => url.startsWith(p))
        if (!isLegacyPath) return next()

        // Check public/ first (Quasar convention), then project root.
        // Also try appending .html so clean URLs like /print/foo resolve to
        // /print/foo.html — matching what Vercel's cleanUrls:true does in prod.
        const root = process.cwd()
        const candidates = [
          join(root, 'public', url),
          join(root, 'public', url + '.html'),
          join(root, url),
          join(root, url + '.html'),
        ]
        const filePath = candidates.find(p => existsSync(p))
        if (!filePath) return next()

        const ext = filePath.split('.').pop()?.toLowerCase()
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

export default configure(function (/* ctx */) {
  return {
    // Boot files run before the app component is mounted
    boot: ['pinia', 'member', 'error-reporting'],

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

      vueRouterMode: 'history',

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
      workboxMode: 'GenerateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,

      // Manifest identity/icons/shortcuts live in src-pwa/manifest.json.
      // @quasar/app-vite (the Vite-based CLI this repo uses) merges that file
      // over package.json-derived defaults — it does not read a `manifest:`
      // object here (that's the older webpack `@quasar/app` config shape).
      // See node_modules/@quasar/app-vite/lib/modes/pwa/utils.js:injectPwaManifest.

      // Same story for runtime caching: this version has no static
      // `workboxOptions` key — only the extendGenerateSWOptions() callback
      // below is read (node_modules/@quasar/app-vite/types/configuration/pwa-conf.d.ts).
      // skipWaiting/clientsClaim already default to true here, no need to set them.
      extendGenerateSWOptions (cfg) {
        cfg.runtimeCaching = [

          // OpenStreetMap tiles — CacheFirst, 30-day TTL, max 1500 tiles (~15MB)
          {
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.+\.png$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles-v1',
              expiration: {
                maxEntries: 1500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // Supabase REST API — NetworkFirst, 3s timeout, falls back to cache
          // Covers site list, monitoring records, country standards
          {
            urlPattern: new RegExp('^https://.+\\.supabase\\.co/rest/v1/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-v1',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24, // 24h stale-while-revalidate
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // Supabase Storage (photos, exports, print docs) — CacheFirst
          {
            urlPattern: new RegExp('^https://.+\\.supabase\\.co/storage/v1/object/public/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-v1',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // Monitoring record POST — NetworkOnly with Background Sync queue
          // When offline, POST is queued and retried when connection returns
          {
            urlPattern: new RegExp('^https://.+\\.supabase\\.co/rest/v1/eco_ops\\.monitoring_records'),
            method: 'POST',
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'monitoring-submit-queue',
                options: {
                  maxRetentionTime: 60 * 24, // retry for up to 24h
                },
              },
            },
          },

          // Water quality obs POST — same Background Sync treatment
          {
            urlPattern: new RegExp('^https://.+\\.supabase\\.co/rest/v1/eco_ops\\.water_quality_obs'),
            method: 'POST',
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'monitoring-submit-queue', // same queue — processes in order
                options: { maxRetentionTime: 60 * 24 },
              },
            },
          },

          // Settlement-profile admin moderation (archive/restore) — NetworkOnly
          // with Background Sync, but ONLY when the admin has opted in via the
          // autosync toggle on AdminSettlementProfilesPage.vue (settlement-
          // profiles.ts's setProfileStatusAsAdmin sets this header per-request,
          // using a raw fetch rather than the shared supabase-js client so a
          // per-call header is possible at all). Default (no header) falls
          // through unmatched, so a PATCH just fails immediately offline —
          // same as community_nodes' admin moderation today. This is
          // deliberately scoped to this one table/action, not a blanket
          // "all admin writes queue offline" policy.
          {
            urlPattern: ({ url, request }) =>
              request.method === 'PATCH' &&
              /\/rest\/v1\/settlement_profiles(\?|$)/.test(url.pathname + url.search) &&
              request.headers.get('X-Exo-Admin-Autosync') === '1',
            method: 'PATCH',
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'admin-settlement-mod-queue',
                options: { maxRetentionTime: 60 * 24 }, // retry for up to 24h
              },
            },
          },

          // IPFS gateway — CacheFirst (content-addressed, immutable)
          {
            urlPattern: /^https:\/\/[^/]+\.ipfs\.(io|dweb\.link|cloudflare-ipfs\.com)\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ipfs-content-v1',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year — content is immutable
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // Universe data — sky/star-system/cluster/oracle JSON. Effectively
          // static (regenerated by datagathering/ scripts on a real refresh, not
          // per-request), but was previously re-fetched every session with no
          // caching at all — CacheFirst, same reasoning as the IPFS rule above.
          // Split into two cache names (many small per-system files vs. a
          // handful of large catalogs) so either can be pruned/inspected on its
          // own later. See SPEC_PWA_DATA_RETENTION.md §5.
          {
            urlPattern: /\/(sky|star-systems|clusters|galaxy-oracle)\/.+\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'exotopia-static-data-v1',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 14, // 14 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/(exoplanets-viz|topo-params)\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'exotopia-catalog-v1',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 14, // 14 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

        ] // end runtimeCaching
      }, // end extendGenerateSWOptions
    },
  }
})
