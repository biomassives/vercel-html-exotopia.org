# zk-e8 — E8 theta-function math, compiled to WebAssembly

`src/lib.rs` is a Rust port of the FoodBank project's `crypto/e8_theta.c` —
Jacobi theta functions evaluated at the fixed modular point τ = i, used to
build an "E8 commitment" from 8 real-valued Chern roots. The port is verified
bit-for-bit against a native build of the original C file (see
`cross_check::matches_c_reference_at_v_0_3` in `src/lib.rs`, and
`jacobi_derivative_identity_holds` for the genuine Jacobi derivative identity
check).

**What this is:** real, correctly-computed mathematics.
**What this is not:** a reviewed cryptographic primitive. See the module-level
doc comment in `src/lib.rs` and `SPEC_ZK_E8_PLONK.md` for the (separately,
honestly labeled as unbuilt) design that would need real cryptographic review
before any security claim could be made about this. `passwordToRoots` in
particular is explicitly test-only — not a key-derivation function.

The compiled output is consumed by the app via `src/lib/e8-theta.ts` (project
root, not this directory), which fetches the `.wasm` file from
`public/wasm/e8_theta_bg.wasm`.

## Rebuilding

One-time setup (per machine):

```sh
rustup target add wasm32-unknown-unknown
cargo install wasm-bindgen-cli --version 0.2.126   # must match the wasm-bindgen version in Cargo.toml
```

Run the test suite (fast — pure native Rust, no WASM involved):

```sh
cd zk-e8
cargo test
```

Rebuild the WASM bindings and copy the output into the app:

```sh
cd zk-e8
cargo build --release --target wasm32-unknown-unknown
wasm-bindgen --target web --out-dir pkg target/wasm32-unknown-unknown/release/e8_theta.wasm

cp pkg/e8_theta_bg.wasm                ../public/wasm/e8_theta_bg.wasm
cp pkg/e8_theta.js                     ../src/lib/wasm-gen/e8-theta/e8_theta.js
cp pkg/e8_theta.d.ts                   ../src/lib/wasm-gen/e8-theta/e8_theta.d.ts
cp pkg/e8_theta_bg.wasm.d.ts           ../src/lib/wasm-gen/e8-theta/e8_theta_bg.wasm.d.ts
```

`target/` and `pkg/` are gitignored — only the copied files under
`src/lib/wasm-gen/` and `public/wasm/` are committed, so the app build doesn't
need a Rust toolchain available (Vercel's build environment doesn't have one).
Re-run the copy step above any time `src/lib.rs` changes.
