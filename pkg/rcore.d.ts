/* tslint:disable */
/* eslint-disable */

export class ExportResult {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    readonly data: Uint8Array;
    readonly filename: string;
}

export function apply_solid_to_alpha_zero(): void;

export function authenticate(key: string): boolean;

export function build_solid_base_image(): void;

/**
 * 可視化オーバーレイをfinal_bufferに構築する
 */
export function build_solid_overlay(): void;

export function build_solid_preview(): void;

export function burn_in_trash_mask(): void;

export function clear_solid_applied_flag(): void;

export function clear_solid_edits_only(): void;

export function commit_solid_source_temp(): void;

export function confirm_offset(ox: number, oy: number): void;

export function copy_c1s_to_solid_buffer(): void;

/**
 * 充填（ショット）を実行。c1s_bufferに書き込む
 */
export function execute_solid_shot(): void;

/**
 * ポリゴン塗りつぶし (Lassoツール用)
 * points_flat: [x0, y0, x1, y1, ...] のフラット配列
 * value: 書き込む値 (0-255)
 * is_subtract: true なら 0 で塗る (消しゴム)
 * use_aa: true ならアンチエイリアス（4x サブラインサンプリング）
 * target_mode: 0=mask_buffer(trash), 1=c1s_buffer(solid)
 */
export function fill_polygon(points_flat: Float32Array, value: number, is_subtract: boolean, use_aa: boolean, target_mode: number): void;

export function finalize_solid_mode(): void;

export function finalize_trash_mode(threshold: number, t: number, b: number, l: number, r: number, offset_x: number, offset_y: number): void;

export function get_alphaB1_buffer_ptr(): number;

export function get_alpha_zero_buffer_ptr(): number;

/**
 * c1s_buffer (投縄バッファ) のポインタ取得
 */
export function get_c1s_buffer_ptr(): number;

/**
 * final_buffer のポインタ取得
 */
export function get_final_buffer_ptr(): number;

export function get_hard_mat_buffer_ptr(): number;

export function get_mask_buffer_ptr(): number;

export function get_offset_x(): number;

export function get_offset_y(): number;

export function get_soft_mat_buffer_ptr(): number;

export function get_solid_base_buffer_ptr(): number;

export function get_solid_buffer_ptr(): number;

export function get_solid_export_buffer_ptr(): number;

export function init_rust(): void;

export function init_trash_mode(): void;

export function is_authenticated(): boolean;

export function load_images(width: number, height: number, black_data: Uint8Array, white_data: Uint8Array, auto_align: boolean): void;

export function load_solid_source_temp(w: number, h: number, data: Uint8Array, init_x: number, init_y: number): void;

export function move_solid_source_temp(dx: number, dy: number): void;

export function preview_solid_source_temp(): void;

export function process_export(mode: string, bg_color_hex: string | null | undefined, base_filename: string): ExportResult;

/**
 * ソリッドモードをリセットする
 */
export function reset_solid_mode(): void;

export function reset_trash_mask(): void;

export function set_calc_mode(mode: number): void;

export function set_offset(ox: number, oy: number): void;

export function update_alignment_alpha_only(offset_x: number, offset_y: number, t: number, b: number, l: number, r: number, margin: number, vp_x: number, vp_y: number, vp_w: number, vp_h: number, speed_priority: boolean, threshold: number): void;

/**
 * ソリッドモードのパラメータを更新し、solid_bufferを再計算する
 */
export function update_solid_params(solid_level: number, edge_thres: number, ray_dist: number, gm_t: number, gm_b: number, gm_l: number, gm_r: number): void;

export function update_trash_mode(threshold: number, type_of_alpha: number, overlay_mode: number, t: number, b: number, l: number, r: number, vp_x: number, vp_y: number, vp_w: number, vp_h: number): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_exportresult_free: (a: number, b: number) => void;
    readonly apply_solid_to_alpha_zero: () => void;
    readonly authenticate: (a: number, b: number) => number;
    readonly build_solid_base_image: () => void;
    readonly build_solid_overlay: () => void;
    readonly build_solid_preview: () => void;
    readonly burn_in_trash_mask: () => void;
    readonly clear_solid_applied_flag: () => void;
    readonly clear_solid_edits_only: () => void;
    readonly commit_solid_source_temp: () => void;
    readonly confirm_offset: (a: number, b: number) => void;
    readonly copy_c1s_to_solid_buffer: () => void;
    readonly execute_solid_shot: () => void;
    readonly exportresult_data: (a: number) => [number, number];
    readonly exportresult_filename: (a: number) => [number, number];
    readonly fill_polygon: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly finalize_solid_mode: () => void;
    readonly finalize_trash_mode: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly get_alphaB1_buffer_ptr: () => number;
    readonly get_alpha_zero_buffer_ptr: () => number;
    readonly get_c1s_buffer_ptr: () => number;
    readonly get_final_buffer_ptr: () => number;
    readonly get_hard_mat_buffer_ptr: () => number;
    readonly get_mask_buffer_ptr: () => number;
    readonly get_offset_x: () => number;
    readonly get_offset_y: () => number;
    readonly get_soft_mat_buffer_ptr: () => number;
    readonly get_solid_base_buffer_ptr: () => number;
    readonly get_solid_buffer_ptr: () => number;
    readonly get_solid_export_buffer_ptr: () => number;
    readonly init_trash_mode: () => void;
    readonly is_authenticated: () => number;
    readonly load_images: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly load_solid_source_temp: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly move_solid_source_temp: (a: number, b: number) => void;
    readonly preview_solid_source_temp: () => void;
    readonly process_export: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly reset_solid_mode: () => void;
    readonly reset_trash_mask: () => void;
    readonly set_calc_mode: (a: number) => void;
    readonly set_offset: (a: number, b: number) => void;
    readonly update_alignment_alpha_only: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => void;
    readonly update_solid_params: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly update_trash_mode: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => void;
    readonly init_rust: () => void;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
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
