/**
 * src/lib/e8-theta.ts
 *
 * Real Jacobi theta-function math for the E8 lattice, running as WebAssembly
 * compiled from a Rust port of the FoodBank project's `e8_theta.c` (see
 * `zk-e8/src/lib.rs` for the source and `zk-e8/README.md` for how to rebuild
 * it). The math itself is genuine and verified — `zk-e8`'s test suite checks
 * the port against the original C binary's own output, bit for bit.
 *
 * What this module is NOT: a cryptographic primitive. `e8Commit`/`e8xE8Commit`
 * evaluate a real function correctly, but nothing here has a proven binding
 * or hiding property, and `passwordToRoots` is explicitly a test-only,
 * non-cryptographic hash (see its own doc comment). Do not use this module to
 * make a security claim to users — see SPEC_ZK_E8_PLONK.md and the
 * e8-art-hash-zkp blog post for what a reviewed version of this idea would
 * actually require.
 */

import init, {
  theta0 as _theta0,
  theta1 as _theta1,
  theta2 as _theta2,
  theta3 as _theta3,
  theta0_prime as _theta0Prime,
  e8_commit as _e8Commit,
  e8x_e8_commit as _e8xE8Commit,
  modular_weight_check as _modularWeightCheck,
  password_to_roots as _passwordToRoots,
  type E8Commit,
  type E8xE8Commit,
} from './wasm-gen/e8-theta/e8_theta.js'

export type { E8Commit, E8xE8Commit }

let readyPromise: Promise<void> | null = null

/** Fetches and instantiates the WASM module. Safe to call more than once — subsequent calls reuse the same in-flight/completed init. */
export function ensureE8ThetaReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = init(new URL('/wasm/e8_theta_bg.wasm', import.meta.url)).then(() => undefined)
  }
  return readyPromise
}

function assertReady() {
  if (!readyPromise) {
    throw new Error('e8-theta.ts: call ensureE8ThetaReady() (and await it) before using theta functions.')
  }
}

export function theta0(v: number): number { assertReady(); return _theta0(v) }
export function theta1(v: number): number { assertReady(); return _theta1(v) }
export function theta2(v: number): number { assertReady(); return _theta2(v) }
export function theta3(v: number): number { assertReady(); return _theta3(v) }
export function theta0Prime(): number { assertReady(); return _theta0Prime() }

/** y must have exactly 8 entries (the E8 Chern roots). */
export function e8Commit(y: number[]): E8Commit {
  assertReady()
  if (y.length !== 8) throw new Error('e8Commit expects exactly 8 Chern roots')
  return _e8Commit(Float64Array.from(y))
}

export function e8xE8Commit(y1: number[], y2: number[]): E8xE8Commit {
  assertReady()
  if (y1.length !== 8 || y2.length !== 8) throw new Error('e8xE8Commit expects two sets of exactly 8 Chern roots')
  return _e8xE8Commit(Float64Array.from(y1), Float64Array.from(y2))
}

export function modularWeightCheck(commitC: number, k: number): number {
  assertReady()
  return _modularWeightCheck(commitC, k)
}

/**
 * TEST-ONLY deterministic string -> 8 Chern roots. Not a cryptographic key
 * derivation function — see this file's header and the Rust source's own
 * comment. Useful for demos/reproducible examples, not for anything where
 * the derivation needs to resist a determined attacker.
 */
export function passwordToRoots(input: string): number[] {
  assertReady()
  return Array.from(_passwordToRoots(input) as Float64Array)
}
