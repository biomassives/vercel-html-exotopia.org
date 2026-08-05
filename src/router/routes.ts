/**
 * Spatial URL API — query-param conventions shared across all viz pages
 * ──────────────────────────────────────────────────────────────────────
 *   ?at=<scope>              — named camera preset (see src/lib/spatial-scopes.ts)
 *   ?cam=x,y,z,tx,ty,tz,fov — exact camera override (1 dp, comma-separated)
 *
 * Scope hierarchy  (colon-delimited, most specific wins):
 *   cosmos                        L1 cosmic web entry
 *   surface | surface:orbit | surface:zenith | surface:horizon
 *   settlement:dome[:interior|:exterior|:centre]
 *   settlement:library | :courtyard | :water[:surface] | :garden[:ground]
 *   settlement:gateway | :stones[:altar] | :pyramid[:chamber]
 *   settlement:orb:<slug>    slug = fana-ka | ot-kulcha | uni-kibaoni-shg
 *                                   glipish-dj | am-lunchmeat
 *
 * Examples:
 *   /surface/kepler-452/kepler-452b?at=settlement:pyramid:chamber
 *   /surface/kepler-452/kepler-452b?at=settlement:orb:fana-ka
 *   /surface/kepler-452/kepler-452b?cam=0,-6,-115,0,-4,-125,40
 */
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    children: [
      {
        // Root = CosmicPage — the single unified cosmic visualization entry point.
        // CosmosPage (formerly WelcomePage) is no longer the root to avoid having
        // two separate 3D scenes that cause jarring transitions when clicking through.
        path: '',
        name: 'cosmic',
        component: () => import('src/pages/CosmicPage.vue'),
        meta: { title: 'Exotopia — Navigable Universe' },
      },
      {
        // Backward-compat: /welcome and /cosmic both redirect to root
        path: 'welcome',
        redirect: '/',
      },
      {
        path: 'cosmic',
        redirect: '/',
      },
      {
        // CosmosPage kept accessible for dev comparison; not linked from UI
        path: 'cosmos-entry',
        name: 'cosmos-entry',
        component: () => import('src/pages/CosmosPage.vue'),
        meta: { title: 'Cosmos Entry (dev)' },
      },
      {
        path: 'galaxy',
        name: 'galaxy',
        component: () => import('src/pages/GalaxyPage.vue'),
        meta: { title: 'Milky Way · Star Systems' },
      },
      {
        // Galactic Center — Sgr A* and the Nuclear Star Cluster scene
        path: 'galactic-center',
        name: 'galactic-center',
        component: () => import('src/pages/GalacticCenterPage.vue'),
        meta: { title: 'Galactic Center · Sagittarius A*' },
      },
      {
        // Black hole orbital scene (generic route for the catalog beyond Sgr A*)
        path: 'bh/:bhId/:zone?',
        name: 'bh-orbital',
        component: () => import('src/pages/GalacticCenterPage.vue'),
        meta: { title: 'Black Hole Orbital Scene' },
      },
      {
        path: 'black-holes',
        name: 'black-holes',
        component: () => import('src/pages/BlackHolesPage.vue'),
        meta: { title: 'Black Holes · Exotopia' },
      },
      {
        path: 'clusters',
        name: 'clusters',
        component: () => import('src/pages/GalaxyClustersPage.vue'),
        meta: { title: 'Galaxy Clusters' },
      },
      {
        path: 'planet-systems',
        name: 'planet-systems',
        component: () => import('src/pages/PlanetSystemsPage.vue'),
        meta: { title: 'Planet Systems · Settlement Guide' },
      },
      {
        // Surface view: /surface/:hostname/:planetName
        // Add ?parent=PlanetName for moon surface view
        path: 'surface/:hostname/:planetName',
        name: 'surface',
        component: () => import('src/pages/SurfaceViewPage.vue'),
        meta: { title: 'Surface View' },
        props: true,
      },
      {
        // Dome interior: first-person view inside the settlement dome with item management
        path: 'surface/:hostname/:planetName/interior',
        name: 'dome-interior',
        component: () => import('src/pages/DomeInteriorPage.vue'),
        meta: { title: 'Settlement Interior' },
        props: true,
      },
      {
        // Cluster interior: navigate member galaxies within a named cluster
        path: 'cluster-interior/:slug',
        name: 'cluster-interior',
        component: () => import('src/pages/ClusterInteriorPage.vue'),
        meta: { title: 'Cluster Interior' },
        props: true,
      },
      {
        // Cosmic void interior: sparse particle view for great voids
        path: 'void/:voidId',
        name: 'void-interior',
        component: () => import('src/pages/VoidInteriorPage.vue'),
        meta: { title: 'Void Interior' },
        props: true,
      },
      {
        // Void galaxy interior: star systems within a void galaxy (click from VoidInteriorPage)
        path: 'void-galaxy/:voidId/:gid',
        name: 'void-galaxy',
        component: () => import('src/pages/VoidGalaxyPage.vue'),
        meta: { title: 'Void Galaxy' },
        props: true,
      },
      {
        // X-ray cluster interior: oracle-generated galaxy field for Takey2013 clusters
        path: 'xcluster/:xid',
        name: 'xcluster',
        component: () => import('src/pages/XClusterPage.vue'),
        meta: { title: 'X-Ray Cluster' },
        props: true,
      },
      {
        // Cluster galaxy interior: enter a member galaxy from the cosmic cluster view
        path: 'cluster-galaxy/:clusterSlug/:memberId',
        name: 'cluster-galaxy',
        component: () => import('src/pages/ClusterGalaxyPage.vue'),
        meta: { title: 'Galaxy Interior' },
        props: true,
      },
      {
        // Cluster star system view: orrery of a single star + planets before descending
        path: 'cluster-system/:clusterSlug/:memberId/:systemIdx',
        name: 'cluster-system',
        component: () => import('src/pages/ClusterSystemPage.vue'),
        meta: { title: 'Star System · Local View' },
        props: true,
      },
      {
        // Cluster world surface: planet surface generated from cluster member galaxy star system
        path: 'cluster-surface/:clusterSlug/:memberId/:systemIdx',
        name: 'cluster-surface',
        component: () => import('src/pages/ClusterSurfacePage.vue'),
        meta: { title: 'Cluster World' },
        props: true,
      },
      {
        path: 'gallery',
        name: 'gallery',
        component: () => import('src/pages/GalleryPage.vue'),
        meta: { title: 'Orbital Gallery' },
      },
      {
        // Public settlement page — see supabase/migrations/012_settlement_profiles.sql
        path: 'settlement/:slug',
        name: 'settlement-profile',
        component: () => import('src/pages/SettlementProfilePage.vue'),
        meta: { title: 'Settlement' },
        props: true,
      },
      {
        // A single published community_nodes row, clicked from a gallery marker
        // in DefenderNav.vue (which already builds this exact path) — was 404ing
        // since this route never existed.
        path: 'gallery/:hostname/:galleryId',
        name: 'gallery-node',
        component: () => import('src/pages/GalleryNodePage.vue'),
        meta: { title: 'Community Listing' },
        props: true,
      },
      {
        path: 'account',
        name: 'account',
        component: () => import('src/pages/AccountPage.vue'),
        meta: { title: 'Account & Privacy' },
      },
      {
        path: 'my-listings',
        name: 'community-nodes',
        component: () => import('src/pages/CommunityNodesPage.vue'),
        meta: { title: 'My Listings' },
      },
      {
        path: 'station/:stationId?',
        name: 'station',
        component: () => import('src/pages/StationPage.vue'),
        meta: { title: 'Station Builder' },
        props: true,
      },
      {
        // Twin-cylinder station interior — bodyless orbital addresses (exo-orbital-v1,
        // exo-stellar-orbital-v1, exo-lunar-orbital-v1, black-hole zones) and real
        // no-solid-crust planets (gas giants, magma-ocean/lava worlds) land here
        // instead of SurfaceViewPage's flat-terrain dome scene.
        path: 'station-interior/:hostname/:refName?',
        name: 'station-interior',
        component: () => import('src/pages/StationInteriorPage.vue'),
        meta: { title: 'Station Interior' },
        props: true,
      },
      {
        path: 'mint',
        name: 'mint',
        component: () => import('src/pages/MintPage.vue'),
        meta: { title: 'Mint NFT' },
      },
      {
        path: 'mint-style',
        name: 'mint-style',
        component: () => import('src/pages/MintStylePage.vue'),
        meta: { title: 'Minting Style Builder' },
      },
      {
        path: 'cve_alerts',
        name: 'cve_alerts',
        component: () => import('src/pages/SecAlertsQueuePage.vue'),
        meta: { title: 'CVEs · ALERTS RELAY' },
      },
      {
        path: 'glossary',
        name: 'glossary',
        component: () => import('src/pages/GlossaryPage.vue'),
        meta: { title: 'Glossary' },
      },
      {
        path: 'eco-ops/:area?',
        name: 'eco-ops',
        component: () => import('src/pages/EcoOpsPage.vue'),
        meta: { title: 'Eco Ops' },
      },
      {
        path: 'eco-library',
        name: 'eco-library',
        component: () => import('src/pages/EcoLibrary.vue'),
        meta: { title: 'Eco Library' },
      },
      {
        path: 'eco-ledger',
        name: 'eco-ledger',
        component: () => import('src/pages/EcoLedgerPage.vue'),
        meta: { title: 'Eco Ledger · Field Record' },
      },
      {
        path: 'onboard',
        name: 'onboard',
        component: () => import('src/pages/OnboardPage.vue'),
        meta: { title: 'Get Started · Exotopia' },
      },
      {
        path: 'data-coverage',
        name: 'data-coverage',
        component: () => import('src/pages/DataCoveragePage.vue'),
        meta: { title: 'Data Coverage · Exotopia' },
      },
      {
        path: 'admin',
        name: 'admin',
        component: () => import('src/pages/AdminPage.vue'),
        meta: { title: 'Admin · Configuration' },
      },
      {
        path: 'admin/community-nodes',
        name: 'admin-community-nodes',
        component: () => import('src/pages/AdminNodesPage.vue'),
        meta: { title: 'Admin · Community Nodes' },
      },
      {
        path: 'admin/video-suggestions',
        name: 'admin-video-suggestions',
        component: () => import('src/pages/AdminVideoSuggestionsPage.vue'),
        meta: { title: 'Admin · Video Suggestions' },
      },
      {
        path: 'admin/error-log',
        name: 'admin-error-log',
        component: () => import('src/pages/AdminErrorLogPage.vue'),
        meta: { title: 'Admin · Error Log' },
      },
      {
        path: 'learn',
        name: 'learn',
        component: () => import('src/pages/LearnPage.vue'),
        meta: { title: 'Knowledge Quizzes' },
      },
      {
        path: 'rewards',
        name: 'rewards',
        component: () => import('src/pages/RewardsPage.vue'),
        meta: { title: 'Rewards & Settlement Incentives' },
      },
      {
        path: 'rewards-guide',
        name: 'rewards-guide',
        component: () => import('src/pages/RewardsGuidePage.vue'),
        meta: { title: 'How Rewards Work · Exotopia' },
      },
      {
        path: 'pfas-citizen-science',
        name: 'pfas-citizen-science',
        component: () => import('src/pages/PfasCitizenSciencePage.vue'),
        meta: { title: 'PFAS/PFOA Citizen Science · Exotopia' },
      },
      {
        path: 'ecology-citizen-science',
        name: 'ecology-citizen-science',
        component: () => import('src/pages/EcologyCitizenSciencePage.vue'),
        meta: { title: 'Ecology & Biodiversity Citizen Science · Exotopia' },
      },
      {
        path: 'method-proposals',
        name: 'method-proposals',
        component: () => import('src/pages/MethodProposalsPage.vue'),
        meta: { title: 'Method Proposals · Exotopia' },
      },
      {
        path: 'knowledge-keepers',
        name: 'knowledge-keepers',
        component: () => import('src/pages/KnowledgeKeepersPage.vue'),
        meta: { title: 'Wisdom from Elders · Exotopia' },
      },
      {
        path: 'docs',
        name: 'docs',
        component: () => import('src/pages/DocPage0.vue'),
        meta: { title: 'Docs' },
      },
      {
        path: 'sky-lessons',
        name: 'sky-lessons',
        component: () => import('src/pages/SkyLessonsPage.vue'),
        meta: { title: 'Sky Generation — Educational Lessons' },
      },
      {
        path: 'void-math',
        name: 'void-math',
        component: () => import('src/pages/VoidMathPage.vue'),
        meta: { title: 'Void Architecture — Conduit Mathematics' },
      },
      {
        path: 'platform',
        name: 'platform',
        component: () => import('src/pages/PlatformPage.vue'),
        meta: { title: 'Platform Status & Roadmap · Exotopia' },
      },
      {
        path: 'blog',
        name: 'blog',
        component: () => import('src/pages/BlogIndexPage.vue'),
        meta: { title: 'Working Notes & Blog — SCD Hub' },
      },
      {
        path: 'blog/:slug',
        name: 'blog-post',
        component: () => import('src/pages/BlogPostPage.vue'),
        meta: { title: 'Blog — SCD Hub' }, // actual title set dynamically in BlogPostPage.vue
      },
      {
        path: 'terms',
        name: 'terms',
        component: () => import('src/pages/LegalDocPage.vue'),
        meta: { docKey: 'terms', title: 'Terms of Service — Exotopia' },
      },
      {
        path: 'privacy',
        name: 'privacy',
        component: () => import('src/pages/LegalDocPage.vue'),
        meta: { docKey: 'privacy', title: 'Privacy Policy — Exotopia' },
      },
      {
        path: 'community-guidelines',
        name: 'community-guidelines',
        component: () => import('src/pages/LegalDocPage.vue'),
        meta: { docKey: 'community-guidelines', title: 'Community Guidelines — Exotopia' },
      },
      {
        path: 'pon-ink',
        name: 'pon-ink',
        component: () => import('src/pages/PonInkPage.vue'),
        meta: { title: 'PON.INK · Settlement Registry' },
      },
      {
        path: 'print/eco-ops-decisions',
        name: 'print-eco-ops-decisions',
        component: () => import('src/pages/PrintDecisionsPage.vue'),
        meta: { title: 'Eco Ops API — 8 Decisions · Discussion' },
      },
      // Catch-all — must be inside MainLayout so ErrorNotFound gets a QLayout ancestor
      {
        path: ':catchAll(.*)*',
        component: () => import('src/pages/ErrorNotFound.vue'),
      },
    ],
  },
]

export default routes
