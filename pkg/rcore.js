/* @ts-self-types="./rcore.d.ts" */

export class ExportResult {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ExportResult.prototype);
        obj.__wbg_ptr = ptr;
        ExportResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ExportResultFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_exportresult_free(ptr, 0);
    }
    /**
     * @returns {Uint8Array}
     */
    get data() {
        const ret = wasm.exportresult_data(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    get filename() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.exportresult_filename(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) ExportResult.prototype[Symbol.dispose] = ExportResult.prototype.free;

export function apply_solid_to_alpha_zero() {
    wasm.apply_solid_to_alpha_zero();
}

/**
 * @param {string} key
 * @returns {boolean}
 */
export function authenticate(key) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.authenticate(ptr0, len0);
    return ret !== 0;
}

export function build_solid_base_image() {
    wasm.build_solid_base_image();
}

/**
 * 可視化オーバーレイをfinal_bufferに構築する
 */
export function build_solid_overlay() {
    wasm.build_solid_overlay();
}

export function build_solid_preview() {
    wasm.build_solid_preview();
}

export function burn_in_trash_mask() {
    wasm.burn_in_trash_mask();
}

export function clear_solid_applied_flag() {
    wasm.clear_solid_applied_flag();
}

export function clear_solid_edits_only() {
    wasm.clear_solid_edits_only();
}

export function commit_solid_source_temp() {
    wasm.commit_solid_source_temp();
}

/**
 * @param {number} ox
 * @param {number} oy
 */
export function confirm_offset(ox, oy) {
    wasm.confirm_offset(ox, oy);
}

export function copy_c1s_to_solid_buffer() {
    wasm.copy_c1s_to_solid_buffer();
}

/**
 * 充填（ショット）を実行。c1s_bufferに書き込む
 */
export function execute_solid_shot() {
    wasm.execute_solid_shot();
}

/**
 * ポリゴン塗りつぶし (Lassoツール用)
 * points_flat: [x0, y0, x1, y1, ...] のフラット配列
 * value: 書き込む値 (0-255)
 * is_subtract: true なら 0 で塗る (消しゴム)
 * use_aa: true ならアンチエイリアス（4x サブラインサンプリング）
 * target_mode: 0=mask_buffer(trash), 1=c1s_buffer(solid)
 * @param {Float32Array} points_flat
 * @param {number} value
 * @param {boolean} is_subtract
 * @param {boolean} use_aa
 * @param {number} target_mode
 */
export function fill_polygon(points_flat, value, is_subtract, use_aa, target_mode) {
    const ptr0 = passArrayF32ToWasm0(points_flat, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.fill_polygon(ptr0, len0, value, is_subtract, use_aa, target_mode);
}

export function finalize_solid_mode() {
    wasm.finalize_solid_mode();
}

/**
 * @param {number} threshold
 * @param {number} t
 * @param {number} b
 * @param {number} l
 * @param {number} r
 * @param {number} offset_x
 * @param {number} offset_y
 */
export function finalize_trash_mode(threshold, t, b, l, r, offset_x, offset_y) {
    wasm.finalize_trash_mode(threshold, t, b, l, r, offset_x, offset_y);
}

/**
 * @returns {number}
 */
export function get_alphaB1_buffer_ptr() {
    const ret = wasm.get_alphaB1_buffer_ptr();
    return ret >>> 0;
}

/**
 * @returns {number}
 */
export function get_alpha_zero_buffer_ptr() {
    const ret = wasm.get_alpha_zero_buffer_ptr();
    return ret >>> 0;
}

/**
 * c1s_buffer (投縄バッファ) のポインタ取得
 * @returns {number}
 */
export function get_c1s_buffer_ptr() {
    const ret = wasm.get_c1s_buffer_ptr();
    return ret >>> 0;
}

/**
 * final_buffer のポインタ取得
 * @returns {number}
 */
export function get_final_buffer_ptr() {
    const ret = wasm.get_final_buffer_ptr();
    return ret >>> 0;
}

/**
 * @returns {number}
 */
export function get_hard_mat_buffer_ptr() {
    const ret = wasm.get_hard_mat_buffer_ptr();
    return ret >>> 0;
}

/**
 * @returns {number}
 */
export function get_mask_buffer_ptr() {
    const ret = wasm.get_mask_buffer_ptr();
    return ret >>> 0;
}

/**
 * @returns {number}
 */
export function get_offset_x() {
    const ret = wasm.get_offset_x();
    return ret;
}

/**
 * @returns {number}
 */
export function get_offset_y() {
    const ret = wasm.get_offset_y();
    return ret;
}

/**
 * @returns {number}
 */
export function get_soft_mat_buffer_ptr() {
    const ret = wasm.get_soft_mat_buffer_ptr();
    return ret >>> 0;
}

/**
 * @returns {number}
 */
export function get_solid_base_buffer_ptr() {
    const ret = wasm.get_solid_base_buffer_ptr();
    return ret >>> 0;
}

/**
 * @returns {number}
 */
export function get_solid_buffer_ptr() {
    const ret = wasm.get_solid_buffer_ptr();
    return ret >>> 0;
}

/**
 * @returns {number}
 */
export function get_solid_export_buffer_ptr() {
    const ret = wasm.get_solid_export_buffer_ptr();
    return ret >>> 0;
}

export function init_rust() {
    wasm.init_rust();
}

export function init_trash_mode() {
    wasm.init_trash_mode();
}

/**
 * @returns {boolean}
 */
export function is_authenticated() {
    const ret = wasm.is_authenticated();
    return ret !== 0;
}

/**
 * @param {number} width
 * @param {number} height
 * @param {Uint8Array} black_data
 * @param {Uint8Array} white_data
 * @param {boolean} auto_align
 */
export function load_images(width, height, black_data, white_data, auto_align) {
    const ptr0 = passArray8ToWasm0(black_data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(white_data, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    wasm.load_images(width, height, ptr0, len0, ptr1, len1, auto_align);
}

/**
 * @param {number} w
 * @param {number} h
 * @param {Uint8Array} data
 * @param {number} init_x
 * @param {number} init_y
 */
export function load_solid_source_temp(w, h, data, init_x, init_y) {
    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.load_solid_source_temp(w, h, ptr0, len0, init_x, init_y);
}

/**
 * @param {number} dx
 * @param {number} dy
 */
export function move_solid_source_temp(dx, dy) {
    wasm.move_solid_source_temp(dx, dy);
}

export function preview_solid_source_temp() {
    wasm.preview_solid_source_temp();
}

/**
 * @param {string} mode
 * @param {string | null | undefined} bg_color_hex
 * @param {string} base_filename
 * @returns {ExportResult}
 */
export function process_export(mode, bg_color_hex, base_filename) {
    const ptr0 = passStringToWasm0(mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    var ptr1 = isLikeNone(bg_color_hex) ? 0 : passStringToWasm0(bg_color_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(base_filename, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.process_export(ptr0, len0, ptr1, len1, ptr2, len2);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ExportResult.__wrap(ret[0]);
}

/**
 * ソリッドモードをリセットする
 */
export function reset_solid_mode() {
    wasm.reset_solid_mode();
}

export function reset_trash_mask() {
    wasm.reset_trash_mask();
}

/**
 * @param {number} mode
 */
export function set_calc_mode(mode) {
    wasm.set_calc_mode(mode);
}

/**
 * @param {number} ox
 * @param {number} oy
 */
export function set_offset(ox, oy) {
    wasm.set_offset(ox, oy);
}

/**
 * @param {number} offset_x
 * @param {number} offset_y
 * @param {number} t
 * @param {number} b
 * @param {number} l
 * @param {number} r
 * @param {number} margin
 * @param {number} vp_x
 * @param {number} vp_y
 * @param {number} vp_w
 * @param {number} vp_h
 * @param {boolean} speed_priority
 * @param {number} threshold
 */
export function update_alignment_alpha_only(offset_x, offset_y, t, b, l, r, margin, vp_x, vp_y, vp_w, vp_h, speed_priority, threshold) {
    wasm.update_alignment_alpha_only(offset_x, offset_y, t, b, l, r, margin, vp_x, vp_y, vp_w, vp_h, speed_priority, threshold);
}

/**
 * ソリッドモードのパラメータを更新し、solid_bufferを再計算する
 * @param {number} solid_level
 * @param {number} edge_thres
 * @param {number} ray_dist
 * @param {number} gm_t
 * @param {number} gm_b
 * @param {number} gm_l
 * @param {number} gm_r
 */
export function update_solid_params(solid_level, edge_thres, ray_dist, gm_t, gm_b, gm_l, gm_r) {
    wasm.update_solid_params(solid_level, edge_thres, ray_dist, gm_t, gm_b, gm_l, gm_r);
}

/**
 * @param {number} threshold
 * @param {number} type_of_alpha
 * @param {number} overlay_mode
 * @param {number} t
 * @param {number} b
 * @param {number} l
 * @param {number} r
 * @param {number} vp_x
 * @param {number} vp_y
 * @param {number} vp_w
 * @param {number} vp_h
 */
export function update_trash_mode(threshold, type_of_alpha, overlay_mode, t, b, l, r, vp_x, vp_y, vp_w, vp_h) {
    wasm.update_trash_mode(threshold, type_of_alpha, overlay_mode, t, b, l, r, vp_x, vp_y, vp_w, vp_h);
}

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_throw_be289d5034ed271b: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_log_0001d66dd92e0c42: function(arg0, arg1) {
            console.log(getStringFromWasm0(arg0, arg1));
        },
        __wbg_log_cf9d593f0c4ad66f: function(arg0, arg1, arg2, arg3) {
            console.log(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
        },
        __wbg_now_a3af9a2f4bbaa4d1: function() {
            const ret = Date.now();
            return ret;
        },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
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
        "./rcore_bg.js": import0,
    };
}

const ExportResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_exportresult_free(ptr >>> 0, 1));

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedFloat32ArrayMemory0 = null;
function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayF32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getFloat32ArrayMemory0().set(arg, ptr / 4);
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

let wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    wasmModule = module;
    cachedFloat32ArrayMemory0 = null;
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
        module_or_path = new URL('rcore_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
