# archive/lib

Unused app-specific wallet/minting UI, kept rather than deleted. Removed from
the active app when the settlement/mint journey moved off blockchain minting
onto IPFS pinning (see `src/lib/ipfs-pinning.ts`, `SETTLEMENT_ADDRESS_API.md`).

Unlike `/lib/chains` (portable, chain-interaction code with no app
dependencies, meant for reuse in other projects), everything here is
Exotopia-app-specific UI that nothing currently imports:

- **`wallet.ts`** — a Pinia store for Solana/Algorand wallet connection state.
  Was already a stub before removal (`connectSolana`/`connectAlgorand` were
  never actually called anywhere in the app) — only consumer was
  `MainLayout.vue`'s top-bar wallet indicator, which is also gone now.
- **`browser-wallet.ts`** — a real, carefully-built in-browser EVM wallet
  (encrypted keystore, scrypt-hardened password, anti-phishing word,
  session-timeout key clearing — see its own header for the full threat
  model). Genuinely more developed than the store above, but built for a
  wallet-based mint flow that no longer exists in this app.
- **`WalletOnboardingGuide.vue`, `BrowserWalletUnlock.vue`,
  `BrowserWalletCreate.vue`** — the onboarding/unlock/creation UI for the
  wallet above.
- **`MintPathwayWizard.vue`** — a pathway-selection component shown above the
  old mint forms. Its `@select` handler was never actually implemented
  (`onPathwaySelect` didn't exist), so it was non-functional even before this
  removal.
- **`mint-config.ts`** — chain/pathway configuration (`FREE_MINT`,
  `DEFAULT_CHAIN`, `ENABLED_PATHWAY_IDS`) for the old mint forms.

Internal imports between these files were fixed to be relative (`./...`)
rather than reaching back into `src/`, so this folder — like `/lib/chains` —
can be copied elsewhere if a future project wants a working in-browser EVM
wallet implementation.
