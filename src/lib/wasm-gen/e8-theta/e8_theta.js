/* @ts-self-types="./e8_theta.d.ts" */

export class E8Commit {
    static __wrap(ptr) {
        const obj = Object.create(E8Commit.prototype);
        obj.__wbg_ptr = ptr;
        E8CommitFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        E8CommitFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_e8commit_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get c() {
        const ret = wasm.__wbg_get_e8commit_c(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get pi1() {
        const ret = wasm.__wbg_get_e8commit_pi1(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get pi2() {
        const ret = wasm.__wbg_get_e8commit_pi2(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get pi3() {
        const ret = wasm.__wbg_get_e8commit_pi3(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set c(arg0) {
        wasm.__wbg_set_e8commit_c(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set pi1(arg0) {
        wasm.__wbg_set_e8commit_pi1(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set pi2(arg0) {
        wasm.__wbg_set_e8commit_pi2(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set pi3(arg0) {
        wasm.__wbg_set_e8commit_pi3(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) E8Commit.prototype[Symbol.dispose] = E8Commit.prototype.free;

export class E8xE8Commit {
    static __wrap(ptr) {
        const obj = Object.create(E8xE8Commit.prototype);
        obj.__wbg_ptr = ptr;
        E8xE8CommitFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        E8xE8CommitFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_e8xe8commit_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get c1_pi1() {
        const ret = wasm.e8xe8commit_c1_pi1(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get c1_pi2() {
        const ret = wasm.e8xe8commit_c1_pi2(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get c1_pi3() {
        const ret = wasm.e8xe8commit_c1_pi3(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get c2_pi1() {
        const ret = wasm.e8xe8commit_c2_pi1(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get c2_pi2() {
        const ret = wasm.e8xe8commit_c2_pi2(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get c2_pi3() {
        const ret = wasm.e8xe8commit_c2_pi3(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get c1() {
        const ret = wasm.__wbg_get_e8xe8commit_c1(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get c2() {
        const ret = wasm.__wbg_get_e8xe8commit_c2(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get combined() {
        const ret = wasm.__wbg_get_e8xe8commit_combined(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set c1(arg0) {
        wasm.__wbg_set_e8xe8commit_c1(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set c2(arg0) {
        wasm.__wbg_set_e8xe8commit_c2(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set combined(arg0) {
        wasm.__wbg_set_e8xe8commit_combined(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) E8xE8Commit.prototype[Symbol.dispose] = E8xE8Commit.prototype.free;

/**
 * @param {Float64Array} y
 * @returns {E8Commit}
 */
export function e8_commit(y) {
    const ptr0 = passArrayF64ToWasm0(y, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.e8_commit(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return E8Commit.__wrap(ret[0]);
}

/**
 * @param {Float64Array} y1
 * @param {Float64Array} y2
 * @returns {E8xE8Commit}
 */
export function e8x_e8_commit(y1, y2) {
    const ptr0 = passArrayF64ToWasm0(y1, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(y2, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.e8x_e8_commit(ptr0, len0, ptr1, len1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return E8xE8Commit.__wrap(ret[0]);
}

/**
 * @param {number} commit_c
 * @param {number} k
 * @returns {number}
 */
export function modular_weight_check(commit_c, k) {
    const ret = wasm.modular_weight_check(commit_c, k);
    return ret;
}

/**
 * @param {string} password
 * @returns {Float64Array}
 */
export function password_to_roots(password) {
    const ptr0 = passStringToWasm0(password, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.password_to_roots(ptr0, len0);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * @param {number} v
 * @returns {number}
 */
export function theta0(v) {
    const ret = wasm.theta0(v);
    return ret;
}

/**
 * theta'(0, tau=i) via symmetric finite difference — matches the C
 * reference's approach (the direct closed form misses an f'(0) cross term).
 * @returns {number}
 */
export function theta0_prime() {
    const ret = wasm.theta0_prime();
    return ret;
}

/**
 * @param {number} v
 * @returns {number}
 */
export function theta1(v) {
    const ret = wasm.theta1(v);
    return ret;
}

/**
 * @param {number} v
 * @returns {number}
 */
export function theta2(v) {
    const ret = wasm.theta2(v);
    return ret;
}

/**
 * @param {number} v
 * @returns {number}
 */
export function theta3(v) {
    const ret = wasm.theta3(v);
    return ret;
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_92b29b0548f8b746: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg___wbindgen_throw_344f42d3211c4765: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./e8_theta_bg.js": import0,
    };
}

const E8CommitFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_e8commit_free(ptr, 1));
const E8xE8CommitFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_e8xe8commit_free(ptr, 1));

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passArrayF64ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 8, 8) >>> 0;
    getFloat64ArrayMemory0().set(arg, ptr / 8);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedFloat64ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('e8_theta_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
