# archive/lib/SECURITY_MODEL_NOTES.md

Security-model documentation that used to live in `src/pages/DocPage0.vue`'s
"Technical Specifications" and "Security" sections, removed from the live
docs when the wallet/on-chain-minting flow moved off blockchain minting onto
IPFS pinning (see `README.md` in this folder). Not deleted outright — this is
genuinely useful reference material if a future chain module (here or in
another project built on `/archive/chains`) needs an in-browser wallet or an
on-chain threat model again.

---

## Browser wallet security model

Applied to the wallet implemented in `browser-wallet.ts` /
`BrowserWalletCreate.vue` / `BrowserWalletUnlock.vue` (no extension required):

- Key generation uses `crypto.getRandomValues()` — never `Math.random()`.
- Encryption: ethers v6 `encryptKeystoreJson` with scrypt `N=131072`
  (~128 MB RAM per brute-force attempt).
- Storage: IndexedDB `'exo_wallet'` — not localStorage, not cookies.
- Session: 30-minute inactivity lock, private key nulled on lock.
- Anti-phishing word: a user-set word shown on every unlock screen, so a
  spoofed unlock UI is detectable.
- Mnemonic: displayed once, quiz-verified, then cleared from JS memory.

Browser wallets built this way are suitable for testnet and small amounts —
for real funds, a hardware wallet is still the recommendation. Never ask the
user for their seed phrase, anywhere in the flow.

## Smart contract risk reference

Common vulnerability classes affecting NFT contracts and wallets, and the
mitigations this app used to apply:

- **Reentrancy** — malicious contract calls back into the victim before state
  updates. Prevention: checks-effects-interactions pattern; `nonReentrant`
  modifier on all value-transferring functions. Origin: 2016 TheDAO hack.
- **Front-running / MEV** — bots reorder mempool transactions to extract
  value. NFT-specific: mint sniping, reveal reordering. Prevention:
  commitment-reveal for randomness; fixed-price minting.
- **Honeypot contracts** — appear mintable/tradeable but trap funds via
  hidden transfer restrictions. Detection: verify contract source; check for
  asymmetric buy/sell history.
- **Rug pull** — liquidity withdrawn or project abandoned by design.
  Prevention: time-locked liquidity, multisig treasury, DAO-governed
  contract ownership.
- **Phishing / address poisoning** — fake sites harvesting seed phrases;
  fake addresses planted in transaction history. Prevention: bookmark URLs;
  an anti-phishing word on wallet unlock; verify the full address before
  every signing.

This app's contracts (when it had them) used `nonReentrant` on all value
transfers, fixed-price minting (no MEV surface), and DAO-governed contract
ownership.

## mule-bot API wallet-signature auth (superseded)

The mule-bot local API (`localhost:8888`) used to authenticate via wallet
signature rather than an account session:

```
Header: X-Settlement-Auth: {wallet_address}.{timestamp}.{signature}
Signature = sign(wallet, "{exoloc_address}:{timestamp}")
```

This assumed wallet-based identity end to end, so it doesn't carry over as-is
now that accounts don't involve a wallet — kept here as a reference pattern
(signed, timestamped, address-scoped header) in case a future auth scheme
wants the same shape with a different signing key. The CORS, rate-limiting,
and path-encoding protections documented alongside it in the live docs are
unrelated to wallets and are still current — see `DocPage0.vue`'s
"API & mule-bot Security" section.
