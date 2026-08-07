/* tslint:disable */
/* eslint-disable */

export class E8Commit {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    c: number;
    pi1: number;
    pi2: number;
    pi3: number;
}

export class E8xE8Commit {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    readonly c1_pi1: number;
    readonly c1_pi2: number;
    readonly c1_pi3: number;
    readonly c2_pi1: number;
    readonly c2_pi2: number;
    readonly c2_pi3: number;
    c1: number;
    c2: number;
    combined: number;
}

export function e8_commit(y: Float64Array): E8Commit;

export function e8x_e8_commit(y1: Float64Array, y2: Float64Array): E8xE8Commit;

export function modular_weight_check(commit_c: number, k: number): number;

export function password_to_roots(password: string): Float64Array;

export function theta0(v: number): number;

/**
 * theta'(0, tau=i) via symmetric finite difference — matches the C
 * reference's approach (the direct closed form misses an f'(0) cross term).
 */
export function theta0_prime(): number;

export function theta1(v: number): number;

export function theta2(v: number): number;

export function theta3(v: number): number;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_e8commit_free: (a: number, b: number) => void;
    readonly __wbg_e8xe8commit_free: (a: number, b: number) => void;
    readonly __wbg_get_e8commit_c: (a: number) => number;
    readonly __wbg_get_e8commit_pi1: (a: number) => number;
    readonly __wbg_get_e8commit_pi2: (a: number) => number;
    readonly __wbg_get_e8commit_pi3: (a: number) => number;
    readonly __wbg_get_e8xe8commit_c2: (a: number) => number;
    readonly __wbg_get_e8xe8commit_combined: (a: number) => number;
    readonly __wbg_set_e8commit_c: (a: number, b: number) => void;
    readonly __wbg_set_e8commit_pi1: (a: number, b: number) => void;
    readonly __wbg_set_e8commit_pi2: (a: number, b: number) => void;
    readonly __wbg_set_e8commit_pi3: (a: number, b: number) => void;
    readonly __wbg_set_e8xe8commit_c2: (a: number, b: number) => void;
    readonly __wbg_set_e8xe8commit_combined: (a: number, b: number) => void;
    readonly e8_commit: (a: number, b: number) => [number, number, number];
    readonly e8x_e8_commit: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly e8xe8commit_c1_pi1: (a: number) => number;
    readonly e8xe8commit_c1_pi2: (a: number) => number;
    readonly e8xe8commit_c1_pi3: (a: number) => number;
    readonly e8xe8commit_c2_pi1: (a: number) => number;
    readonly e8xe8commit_c2_pi2: (a: number) => number;
    readonly e8xe8commit_c2_pi3: (a: number) => number;
    readonly modular_weight_check: (a: number, b: number) => number;
    readonly password_to_roots: (a: number, b: number) => [number, number];
    readonly theta0: (a: number) => number;
    readonly theta1: (a: number) => number;
    readonly theta2: (a: number) => number;
    readonly theta3: (a: number) => number;
    readonly __wbg_set_e8xe8commit_c1: (a: number, b: number) => void;
    readonly __wbg_get_e8xe8commit_c1: (a: number) => number;
    readonly theta0_prime: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
