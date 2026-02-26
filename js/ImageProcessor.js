import initWasm, {
    load_images,
    init_trash_mode,
    update_trash_mode,
    finalize_trash_mode,
    update_alignment_alpha_only,
    confirm_offset,
    get_alphaB1_buffer_ptr,
    get_soft_mat_buffer_ptr,
    get_hard_mat_buffer_ptr,
    get_mask_buffer_ptr,
    get_solid_buffer_ptr,
    get_alpha_zero_buffer_ptr,
    get_c1s_buffer_ptr,
    get_final_buffer_ptr,
    set_calc_mode,
    get_offset_x,
    get_offset_y,
    set_offset,
    fill_polygon,
    update_solid_params,
    execute_solid_shot,
    build_solid_overlay,
    reset_solid_mode,
    get_solid_base_buffer_ptr,
    get_solid_export_buffer_ptr,
    build_solid_base_image,
    finalize_solid_mode,
    build_solid_preview,
    load_solid_source_temp,
    move_solid_source_temp,
    preview_solid_source_temp,
    commit_solid_source_temp,
    process_export,
    copy_c1s_to_solid_buffer,
    apply_solid_to_alpha_zero,
    clear_solid_applied_flag
} from '../pkg/rcore.js';

/**
 * ImageProcessor.js (v5.1: 3-Buffer Architecture Integration)
 */
export class ImageProcessor {
    constructor() {
        this.wasm = null;
        this.memory = null;
        this.width = 0;
        this.height = 0;

        // Pointers
        this.alphaZeroPtr = 0;
        this.alphaB1Ptr = 0;
        this.softMatPtr = 0;
        this.hardMatPtr = 0;
        this.solidPtr = 0;
        this.maskPtr = 0;
        this.c1sPtr = 0;
        this.finalPtr = 0;

        this.params = {
            threshold: 5,
            erode: 0,
            calcMode: 'avg',
            typeOfAlpha: 'hard', // 'hard' (0) or 'soft' (1)
            overlayMode: false   // true (1) or false (0)
        };

        this.offset = { x: 0, y: 0 };
        this.garbageMatte = { t: 0, b: 0, l: 0, r: 0 };

        this.blackFileName = 'image';

        // Storage for Bitmaps (Rust input)
        this.blackBitmap = null;
        this.whiteBitmap = null;
        this.inputBlackSource = null; // Expose for preview

        // Undo Stack ({ mode, data } snapshots)
        this.undoStack = [];
        this.undoLimit = parseInt(localStorage.getItem('aaronAlpha_undoLimit')) || 3;
    }

    async init() {
        this.wasm = await initWasm();
        this.memory = this.wasm.memory;
        console.log('[System] ImageProcessor (v5.2) initialized.');
    }

    /**
     * Helper to extract Uint8Array (RGBA) from ImageBitmap/HTMLImageElement
     */
    getImageData(img) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, img.width, img.height).data;
    }

    hasImages() {
        return !!(this.blackBitmap && this.whiteBitmap);
    }

    async loadInputImage(type, file) {
        if (!file) return null;
        console.log(`[ImageProcessor] Loading ${type} image: ${file.name} (${file.size} bytes)`);

        try {
            // Use createImageBitmap for memory efficiency as in v4.0
            const bitmap = await createImageBitmap(file);
            console.log(`[ImageProcessor] Bitmap created for ${type}: ${bitmap.width}x${bitmap.height}`);

            // [V06] Size Check: Ensure dimensions match existing image
            if (this.blackBitmap && type === 'white') {
                const w1 = this.blackBitmap.width;
                const h1 = this.blackBitmap.height;
                const w2 = bitmap.width;
                const h2 = bitmap.height;

                console.log(`[ImageProcessor] Size Check (Black vs White): ${w1}x${h1} vs ${w2}x${h2}`);

                if (w2 !== w1 || h2 !== h1) {
                    bitmap.close();
                    throw {
                        code: 'SIZE_MISMATCH',
                        w1: w1, h1: h1,
                        w2: w2, h2: h2
                    };
                }
            } else if (this.whiteBitmap && type === 'black') {
                const w1 = this.whiteBitmap.width;
                const h1 = this.whiteBitmap.height;
                const w2 = bitmap.width;
                const h2 = bitmap.height;

                console.log(`[ImageProcessor] Size Check (White vs Black): ${w1}x${h1} vs ${w2}x${h2}`);

                if (w2 !== w1 || h2 !== h1) {
                    bitmap.close();
                    throw {
                        code: 'SIZE_MISMATCH',
                        w1: w1, h1: h1,
                        w2: w2, h2: h2
                    };
                }
            }

            // Auto Align Setting
            const chkAutoAlign = document.getElementById('chk-auto-align');
            const autoAlign = chkAutoAlign ? chkAutoAlign.checked : true;

            if (type === 'black') {
                this.blackBitmap = bitmap;
                this.inputBlackSource = bitmap;
                this.width = bitmap.width;
                this.height = bitmap.height;
                this.blackFileName = file.name.split('.')[0];
            } else if (type === 'white') {
                this.whiteBitmap = bitmap;
            }

            const url = URL.createObjectURL(file);

            // If both images are present, auto-initialize Rust core
            // ONLY if loading basic images. solid-source should NOT trigger reset.
            if ((type === 'black' || type === 'white') && this.blackBitmap && this.whiteBitmap) {
                console.log(`[ImageProcessor] Both images present, triggering Rust processing... (AutoAlign: ${autoAlign})`);
                await this.sendImagesToRust(autoAlign);
            } else {
                console.log(`[ImageProcessor] Waiting for other image. (Black: ${!!this.blackBitmap}, White: ${!!this.whiteBitmap})`);
            }

            return url;
        } catch (e) {
            console.error(`[ImageProcessor] Error loading ${type} image:`, e);
            throw e;
        }
    }

    async sendImagesToRust(autoAlign = true) {
        if (!this.wasm) {
            console.error('[Error] WASM not initialized');
            return;
        }

        console.log(`[ImageProcessor/Log] >>> START: sendImagesToRust (Width: ${this.width}, Height: ${this.height}, AutoAlign: ${autoAlign})`);
        const t0 = performance.now();

        const blackData = this.getImageData(this.blackBitmap);
        const whiteData = this.getImageData(this.whiteBitmap);

        load_images(this.width, this.height, blackData, whiteData, autoAlign);

        const t1 = performance.now();
        console.log(`[ImageProcessor/Log] --- WASM: load_images executed (Time: ${(t1 - t0).toFixed(2)}ms)`);

        this.alphaZeroPtr = get_alpha_zero_buffer_ptr();
        this.alphaB1Ptr = get_alphaB1_buffer_ptr();
        this.softMatPtr = get_soft_mat_buffer_ptr();
        this.hardMatPtr = get_hard_mat_buffer_ptr();
        this.solidPtr = get_solid_buffer_ptr();
        this.maskPtr = get_mask_buffer_ptr();
        this.c1sPtr = get_c1s_buffer_ptr();
        this.finalPtr = get_final_buffer_ptr();
        this.solidBasePtr = get_solid_base_buffer_ptr();
        this.solidExportPtr = get_solid_export_buffer_ptr();

        // Synchronize auto-calculated offsets & save initial values
        this.offset.x = get_offset_x();
        this.offset.y = get_offset_y();
        this.autoOffset = { x: this.offset.x, y: this.offset.y };
        console.log(`[ImageProcessor/Log] Auto-Offset Synced & Saved: (${this.offset.x}, ${this.offset.y})`);

        console.log(`[ImageProcessor/Log] <<< END: Pointers synced (Alpha0: ${this.alphaZeroPtr !== 0}, AlphaB1: ${this.alphaB1Ptr !== 0}, Soft: ${this.softMatPtr !== 0}, Hard: ${this.hardMatPtr !== 0})`);
        console.log(`[ImageProcessor/Log] Auth Status Check: ${this.alphaB1Ptr !== 0 ? 'AUTHENTICATED' : 'GUEST'}`);

        this.updateTrashMode();
    }

    updateParams(key, value) {
        if (this.params.hasOwnProperty(key)) {
            this.params[key] = value;
            if (key === 'calcMode') {
                const modes = { 'max': 0, 'avg': 1, 'lum': 2 };
                set_calc_mode(modes[value] !== undefined ? modes[value] : 1);
            }
            return true;
        }
        return false;
    }

    updateGarbageMatte(key, value) {
        this.garbageMatte[key] = value;
    }

    resetToAutoAlign() {
        const ax = this.autoOffset ? this.autoOffset.x : 0;
        const ay = this.autoOffset ? this.autoOffset.y : 0;
        this.offset = { x: ax, y: ay };
        console.log(`[ImageProcessor] resetToAutoAlign: Restored to auto-offset (${ax}, ${ay})`);
    }

    // [NEW] Initialize trash mode buffers via WASM
    initTrashMode() {
        if (!this.wasm) return;
        init_trash_mode();
        console.log('[ImageProcessor] initTrashMode: WASM buffers re-initialized');
    }

    updateTrashMode() {
        if (!this.wasm) return;
        const p = this.params;
        const g = this.garbageMatte;

        const typeVal = (p.typeOfAlpha === 'soft') ? 1 : 0;
        const overlayVal = (p.overlayMode) ? 1 : 0;

        console.log(`[ImageProcessor/Log] >>> CALL: update_trash_mode (Thres: ${p.threshold}, Type: ${p.typeOfAlpha}, Overlay: ${p.overlayMode})`);

        update_trash_mode(
            p.threshold,
            typeVal,
            overlayVal,
            g.t, g.b, g.l, g.r
        );
        console.log(`[ImageProcessor/Log] <<< FINISH: update_trash_mode`);
    }

    updateAlignmentAlphaOnly(offX, offY, garbageMatte, margin = 12, viewPort = null, speedPriority = false) {
        if (!this.wasm) return;
        this.offset.x = offX;
        this.offset.y = offY;
        set_offset(offX, offY); // offset値のみ保存（calculate_alpha_zero は呼ばない）

        const g = garbageMatte || { t: 0, b: 0, l: 0, r: 0 };
        const vp = viewPort || { x: 0, y: 0, w: 0, h: 0 }; // Default: No viewport limit (0,0,0,0) -> handled in Rust

        update_alignment_alpha_only(
            offX, offY,
            g.t, g.b, g.l, g.r, margin,
            vp.x, vp.y, vp.w, vp.h,
            speedPriority
        );
    }

    confirmOffset(offX, offY) {
        if (!this.wasm) return;
        this.offset.x = offX;
        this.offset.y = offY;
        confirm_offset(offX, offY); // 確定時のみ全再計算（ストレートRGB含む）
    }

    finalizeTrashMode() {
        if (!this.wasm) return;
        const p = this.params;
        const g = this.garbageMatte;
        const off = this.offset;

        finalize_trash_mode(
            p.threshold,
            g.t, g.b, g.l, g.r,
            off.x, off.y
        );
    }

    process(targetBuffer, skipUpdate = false) {
        if (!this.width || !this.height || !this.wasm) {
            console.warn(`[ImageProcessor/Log] process aborted: Not ready (Width: ${this.width}, Height: ${this.height}, WASM: ${!!this.wasm})`);
            return null;
        }

        const w = this.width;
        const h = this.height;
        const size = w * h * 4;

        console.log(`[ImageProcessor/Log] >>> START: process("${targetBuffer}") skipUpdate=${skipUpdate}`);

        if (!skipUpdate && (targetBuffer === 'alphaB1' || targetBuffer === 'soft' || targetBuffer === 'hard')) {
            this.updateTrashMode();
        }

        let ptr = 0;
        switch (targetBuffer) {
            case 'alphaB1': ptr = this.alphaB1Ptr; break;
            case 'soft': ptr = this.softMatPtr; break;
            case 'hard': ptr = this.hardMatPtr; break;
            case 'basic': ptr = this.alphaZeroPtr; break;
            case 'solid': ptr = this.solidPtr; break;
            case 'mask': ptr = this.maskPtr; break;
            case 'solid_integrated':
                build_solid_base_image();
                ptr = this.solidBasePtr;
                break;
            case 'solid_export':
                finalize_solid_mode();
                ptr = this.solidExportPtr;
                break;
            case 'solid_preview':
                build_solid_preview();
                ptr = this.solidExportPtr;
                break;
            case 'solid_source_preview':
                preview_solid_source_temp();
                ptr = this.finalPtr; // Rust writes to final_buffer now
                break;
        }

        if (ptr === 0) {
            console.warn(`[ImageProcessor/Log] process failed: NULL pointer for "${targetBuffer}"`);
            return null;
        }

        const view = new Uint8ClampedArray(this.memory.buffer, ptr, size);
        // Create a copy to prevent "detached buffer" errors when WASM memory grows
        const dataCopy = new Uint8ClampedArray(view);
        const result = new ImageData(dataCopy, w, h);
        console.log(`[ImageProcessor/Log] <<< END: process("${targetBuffer}") - Generated ImageData ${w}x${h} (Copied)`);
        return result;
    }

    // JS-side helpers for Export
    createOffsetImage(srcData, offX, offY) {
        const w = this.width;
        const h = this.height;
        const newData = new Uint8ClampedArray(srcData.data.length);
        const data = srcData.data;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const sx = x - offX;
                const sy = y - offY;
                const dstIdx = (y * w + x) * 4;

                if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
                    const srcIdx = (sy * w + sx) * 4;
                    newData[dstIdx] = data[srcIdx];
                    newData[dstIdx + 1] = data[srcIdx + 1];
                    newData[dstIdx + 2] = data[srcIdx + 2];
                    newData[dstIdx + 3] = data[srcIdx + 3];
                }
            }
        }
        return new ImageData(newData, w, h);
    }

    applyMatte(srcData, t, b, l, r) {
        const w = this.width;
        const h = this.height;
        const newData = new Uint8ClampedArray(srcData.data);

        for (let y = 0; y < h; y++) {
            const inY = (y < t) || (y >= h - b);
            for (let x = 0; x < w; x++) {
                const inX = (x < l) || (x >= w - r);
                if (inY || inX) {
                    const idx = (y * w + x) * 4;
                    newData[idx + 3] = 0;
                }
            }
        }
        return new ImageData(newData, w, h);
    }

    // ====== Solid Mode Methods ======

    /** ソリッドモードのパラメータ更新（閾値変更時に呼ぶ） */
    updateSolidMode(solidLevel, edgeThres = 64, rayDist = 5, coastDist = 3, aaThres = 128, dirCount = 6) {
        if (!this.wasm) return;
        const gm = this.garbageMatte || { t: 0, b: 0, l: 0, r: 0 };
        update_solid_params(solidLevel, edgeThres, rayDist, coastDist, aaThres, dirCount, gm.t, gm.b, gm.l, gm.r);
        // ポインタが変わる可能性はないが念のため取得
        this.solidPtr = get_solid_buffer_ptr();
        console.log(`[ImageProcessor] updateSolidMode: level=${solidLevel}, coastDist=${coastDist}, aaThres=${aaThres}, dirCount=${dirCount}, gm=[${gm.t},${gm.b},${gm.l},${gm.r}]`);
    }

    /** 充填（ショット）を実行 */
    executeSolidShot() {
        if (!this.wasm) return;
        execute_solid_shot();
        console.log('[ImageProcessor] executeSolidShot completed');
    }

    /** c1s_buffer を solid_buffer にコピー（二次ショット対策） */
    copyC1sToSolidBuffer() {
        if (!this.wasm) return;
        copy_c1s_to_solid_buffer();
        console.log('[ImageProcessor] copyC1sToSolidBuffer completed');
    }

    /** 可視化オーバーレイを取得（緑マスク） */
    getSolidOverlay() {
        if (!this.wasm || !this.width || !this.height) return null;
        build_solid_overlay();
        this.finalPtr = get_final_buffer_ptr();
        if (!this.finalPtr) return null;
        const size = this.width * this.height * 4;
        const view = new Uint8ClampedArray(this.memory.buffer, this.finalPtr, size);
        const copy = new Uint8ClampedArray(view); // Create copy to prevent context detachment
        return new ImageData(copy, this.width, this.height);
    }

    /** ソリッドモードのリセット */
    resetSolidMode() {
        if (!this.wasm) return;
        reset_solid_mode();
        console.log('[ImageProcessor] resetSolidMode completed');
    }

    // --- Undo Management ---

    setUndoLimit(limit) {
        this.undoLimit = Math.max(0, parseInt(limit) || 3);
        // Trim stack if needed
        while (this.undoStack.length > this.undoLimit) {
            this.undoStack.shift();
        }
        console.log(`[ImageProcessor] Undo limit set to ${this.undoLimit}`);
    }

    /**
     * 現在のバッファ（モード別）のスナップショットを Undo スタックに保存
     */
    pushUndoState(mode) {
        if (!this.wasm || !this.width || !this.height) return;

        let ptr = 0;
        let size = this.width * this.height; // 1ch

        if (mode === 'trash') {
            ptr = this.maskPtr;
        } else if (mode === 'solid') {
            ptr = this.c1sPtr;
        } else {
            console.warn(`[ImageProcessor] pushUndoState: Unknown mode ${mode}`);
            return;
        }

        if (!ptr) return;

        const view = new Uint8Array(this.memory.buffer, ptr, size);
        const snapshot = new Uint8Array(view); // コピー
        this.undoStack.push({ mode: mode, data: snapshot });

        if (this.undoStack.length > this.undoLimit) {
            this.undoStack.shift();
        }
        console.log(`[ImageProcessor] pushUndoState(${mode}): stack size = ${this.undoStack.length} (Limit: ${this.undoLimit})`);
    }

    /**
     * Undo スタックから直前の状態を復元
     * @returns {string|null} 復元したモード名（'trash' or 'solid'）、失敗ならnull
     */
    popUndoState() {
        if (!this.undoStack.length || !this.wasm) {
            console.log('[ImageProcessor] popUndoState: Nothing to undo');
            return null;
        }

        const state = this.undoStack.pop();
        let ptr = 0;
        if (state.mode === 'trash') {
            ptr = this.maskPtr;
        } else if (state.mode === 'solid') {
            ptr = this.c1sPtr;
        }

        if (!ptr) return null;

        const size = this.width * this.height;
        const view = new Uint8Array(this.memory.buffer, ptr, size);
        view.set(state.data);
        console.log(`[ImageProcessor] popUndoState: Restored ${state.mode}. stack size = ${this.undoStack.length}`);
        return state.mode;
    }

    /**
     * ポリゴン塗りつぶし (Lassoツールから呼び出される)
     * @param {Array<{x: number, y: number}>} points
     * @param {number} value
     * @param {boolean} isSubtract
     * @param {boolean} useAA - 未使用（将来拡張用）
     * @param {string} targetMode - 'trash' or 'solid'
     */
    fillPolygon(points, value, isSubtract, useAA, targetMode) {
        if (!this.wasm || points.length < 3) return;

        // Undo のために現在の状態を保存
        this.pushUndoState(targetMode);

        // points を flat array に変換: [x0, y0, x1, y1, ...]
        const flat = new Float32Array(points.length * 2);
        for (let i = 0; i < points.length; i++) {
            flat[i * 2] = points[i].x;
            flat[i * 2 + 1] = points[i].y;
        }

        fill_polygon(flat, value, isSubtract, useAA, targetMode === 'solid' ? 1 : 0);
        console.log(`[ImageProcessor] fillPolygon: ${points.length} points, mode=${targetMode}, subtract=${isSubtract}, aa=${useAA}`);
    }
    // [V06] Solid Source Adjustment Methods
    async loadSolidSourceTemp(file) {
        // 1. Create Bitmap
        const bitmap = await createImageBitmap(file);

        // 2. Create Red Overlay Bitmap for High Perf Preview
        this.solidSourceBmp = await this.createRedOverlayBitmap(bitmap);

        // 3. Send to Rust (for commit logic)
        const w = bitmap.width;
        const h = bitmap.height;
        const canvas = new OffscreenCanvas(w, h); // Use OffscreenCanvas if available
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        const imgData = ctx.getImageData(0, 0, w, h);

        // Initial Center in Main Image
        const initialX = Math.floor((this.width - w) / 2);
        const initialY = Math.floor((this.height - h) / 2);

        // Pass TypedArray directly (wasm-bindgen handles allocation/copy)
        load_solid_source_temp(w, h, imgData.data, initialX, initialY);

        console.log(`[ImageProcessor] loadSolidSourceTemp: ${w}x${h} @ (${initialX}, ${initialY})`);

        return { w, h, initialX, initialY };
    }

    async createRedOverlayBitmap(srcBitmap) {
        if (!srcBitmap) return null;
        try {
            const w = srcBitmap.width;
            const h = srcBitmap.height;
            const off = new OffscreenCanvas(w, h);
            const ctx = off.getContext('2d');

            ctx.drawImage(srcBitmap, 0, 0);

            // Mask with Red
            ctx.globalCompositeOperation = 'source-in';
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, 0, w, h);

            return await createImageBitmap(off);
        } catch (e) {
            console.error('[ImageProcessor] createRedOverlayBitmap failed:', e);
            return null;
        }
    }

    moveSolidSourceTemp(dx, dy) {
        if (!this.wasm) return;
        move_solid_source_temp(dx, dy);
    }

    commitSolidSourceTemp() {
        if (!this.wasm) return;
        commit_solid_source_temp();
    }

    applySolidToAlphaZero() {
        if (!this.wasm) return;
        apply_solid_to_alpha_zero();
        console.log('[ImageProcessor] Applied Solid to AlphaZero');
    }

    clearSolidAppliedFlag() {
        if (!this.wasm) return;
        clear_solid_applied_flag();
    }

    /**
     * エクスポート処理 (Rust側で実行)
     * @param {string} mode - 'basic', 'trash_hard', 'trash_alpha', 'solid'
     * @param {string|null} bgColorHex - '#RRGGBB' or null
     * @param {string} baseFilename - Base filename
     * @returns {{data: Uint8Array, filename: string}|null}
     */
    processExport(mode, bgColorHex, baseFilename) {
        if (!this.wasm) return null;
        try {
            console.log(`[ImageProcessor] processExport: mode=${mode}, bg=${bgColorHex}, base=${baseFilename}`);

            // [Fix] Ensure solid_export_buffer is populated even if preview is off
            if (mode === 'solid') {
                finalize_solid_mode();
            }

            const result = process_export(mode, bgColorHex, baseFilename);

            // ExportResult struct: { data, filename }
            // data is implicitly a getter that returns Uint8Array matching Vec<u8>
            const data = result.data;
            const filename = result.filename;

            // Copy data to ensure it persists after result is freed?
            // wasm-bindgen generated getters for Vec<u8> typically return a copy (Uint8Array).
            // Let's use it as is.

            const output = {
                data: data,
                filename: filename
            };

            result.free(); // Free the Rust struct wrapper
            return output;
        } catch (e) {
            console.error('[ImageProcessor] processExport failed:', e);
            return null;
        }
    }
}