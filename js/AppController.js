/**
 * AppController.js (v5.2: Clean Unified 3-Buffer Integration)
 */
import { t, refreshHelpTooltip } from './i18n.js';
import { LassoTool } from './LassoTool.js';
import { Dialog } from './Dialog.js';

export class AppController {
    constructor(processor, renderEngine) {
        this.processor = processor;
        this.renderEngine = renderEngine;
        this.currentMode = 'basic';

        // Trash Mode State
        this._typesOfAlpha = 'hard'; // 'hard' (Binary) or 'soft' (Gradient)
        this._overlayMode = false;   // true = Show alphaB1 Color Overlay

        // Mode Specific States
        this.isTrashAlignMode = false;
        this.isMatteEditing = false;
        this.isDraggingMatte = false;
        this.matteStart = null;
        this.isSolidCustomMoving = false;
        this.isOverlayOn = false; // For Solid mode preview

        // V2 Params defaults (will be overridden by slider values)
        this.solidCoastDist = 3;
        this.solidAaThres = 128;
        this.solidDirCount = 6;

        this.penSize = 10;
        this.currentTool = 'pen';
        this.lassoTool = new LassoTool(renderEngine, processor);

        this.canvasBackground = { type: 'checker', color: '#000000' };
        this.hasEnteredTrash = false;
        this.hasEnteredSolid = false;

        // Solid Mode Visualization State
        this.solidVis = {
            pen: false,   // プレビュー (カラー透過)
            solid: true   // 不透明ビジュアライズ (緑)
        };

        this.isProcessing = false;
        this._lastMiddleClickTime = 0; // ホイール中ボタンダブルクリック判定用
        this.pendingUpdate = false;
        this._buttonsBound = false;

        this._isAuthenticated = false; // Track auth state locally for UI refreshes
        this.speedPriority = false; // 位置調整時速度優先（低画質）モード
        this.isHelpActive = false;   // トグル式ヘルプモードの状態

        this._lastScale = 1.0;
        this._lastPan = { x: 0, y: 0 };
        this._needsSmartRefresh = false; // 縮小・移動時の全域リフレッシュ要求
        this._bufferState = 'full';     // 'full' (全域計算済み) or 'partial' (ビューポート内のみ)

        this.init();
    }

    // --- Accessors ---
    get typesOfAlpha() { return this._typesOfAlpha; }
    set typesOfAlpha(val) {
        if (val !== 'hard' && val !== 'soft') return;
        this._typesOfAlpha = val;
        this.processor.updateParams('typeOfAlpha', val);
        this.updateTrashUI();
        this.updateMainView();
        // 【指示通り】解説文（ツールチップ）も即座に更新
        refreshHelpTooltip();
    }

    get trashOverlay() { return this._overlayMode; }
    set trashOverlay(val) {
        this._overlayMode = !!val;
        this.processor.updateParams('overlayMode', this._overlayMode);
        this.updateTrashUI();
        this.updateMainView();
    }

    init() {
        try {
            this.bindTabEvents();
            this.bindInputEvents();
            this.bindButtonEvents();
            this.bindDragDropEvents();
            this.bindSolidEvents();
            this.bindKeyEvents();
            this.bindCanvasEvents();

            this.setCanvasBackground('checker');
            this.updateOffsetDisplay();

            // Load settings from localStorage
            this.loadSettings();

            // ビューポート変更時：
            this.renderEngine.onViewChange = (scale, pan) => {
                // スマートリフレッシュ（全域計算）を「最初の1フレーム」で同期的に実行する
                if (this._bufferState === 'partial') {
                    const isZoomingOut = scale < this._lastScale;
                    const isPanning = Math.abs(pan.x - this._lastPan.x) > 1 || Math.abs(pan.y - this._lastPan.y) > 1;

                    if (isZoomingOut || isPanning) {
                        this._needsSmartRefresh = true;
                        // アーロン様の指示通り、非同期を介さず「その場で直撃して」更新を実行
                        // これにより1フレーム目で full 状態になり、2フレーム目以降の計算を物理的に遮断する
                        this.updateMainView();
                    }
                }
                this._lastScale = scale;
                this._lastPan = { ...pan };

                // 位置調整モード(Alignment)用の特殊フラグ（維持）
                if (this.currentMode === 'trash' && this.isTrashAlignMode && this._needsFullRefresh) {
                    this._needsFullRefresh = false;
                    this.requestUpdate();
                }
            };

            console.log('[System] AppController v5.2 initialized.');
        } catch (e) {
            console.error('[System] Init Error:', e);
        }
    }

    // ========================
    // Storage Methods
    // ========================

    loadSettings() {
        try {
            const autoAlign = localStorage.getItem('aaronAlpha_autoAlign');
            const speedPriority = localStorage.getItem('aaronAlpha_speedPriority');
            const undoLimit = localStorage.getItem('aaronAlpha_undoLimit');
            if (autoAlign !== null) {
                const el = document.getElementById('chk-auto-align');
                if (el) el.checked = (autoAlign === 'true');
            }

            if (speedPriority !== null) {
                const el = document.getElementById('chk-speed-priority');
                if (el) {
                    el.checked = (speedPriority === 'true');
                    this.speedPriority = (speedPriority === 'true');
                }
            }

            const solidExt = localStorage.getItem('aaronAlpha_solidExt');
            if (solidExt !== null) {
                const el = document.getElementById('chk-solid-ext');
                if (el) {
                    el.checked = (solidExt === 'true');
                    this.solidExtEnabled = (solidExt === 'true');
                }
            } else {
                this.solidExtEnabled = false;
            }
            // Sync initial UI state for solid extension (since bindInputEvents happens before loadSettings)
            const dp = document.getElementById('solid-v2-debug-panel');
            if (dp) dp.style.display = this.solidExtEnabled ? 'block' : 'none';

            if (undoLimit !== null) {
                const el = document.getElementById('inp-undo-limit');
                if (el) {
                    el.value = undoLimit;
                    if (this.processor) this.processor.setUndoLimit(undoLimit);
                }
            }

            console.log('[AppController/Storage] Settings loaded successfully.');
        } catch (e) {
            console.error('[AppController/Storage] Failed to load settings:', e);
        }
    }

    saveSetting(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn(`[AppController/Storage] Could not save setting ${key}:`, e);
        }
    }

    resetSettings() {
        const keys = [
            'aaronAlpha_lang',
            'aaronAlpha_speedPriority',
            'aaronAlpha_autoAlign',
            'aaronAlpha_solidExt',
            'aaronAlpha_undoLimit'
        ];
        keys.forEach(k => {
            try { localStorage.removeItem(k); } catch (e) { }
        });

        // [FIX] Undoリミットをデフォルト(3)に強制リセット
        const undoInp = document.getElementById('inp-undo-limit');
        if (undoInp) {
            undoInp.value = 3;
            if (this.processor) this.processor.setUndoLimit(3);
        }

        console.log('[AppController/Storage] Settings reset (Auth keys preserved).');
        location.reload();
    }

    /**
     * 位置調整プレビューの高速更新（αのみ、ビューポート限定）
     */
    requestAlignmentUpdate() {
        if (!this.processor?.hasImages()) return;
        const vp = this.renderEngine.getViewPort();
        this.processor.updateAlignmentAlphaOnly(
            this.processor.offset.x, this.processor.offset.y,
            this.processor.garbageMatte, 12,
            vp, this.speedPriority
        );

        // [Fix] Refresh image data explicitly because ImageData is now a copy
        let img = null;
        // This method is primarily used in Trash Alignment
        // Note: process(targetBuffer, skipUpdate) -> set true to skip updateTrashMode
        if (this.typesOfAlpha === 'soft') {
            img = this.processor.process('soft', true);
        } else {
            img = this.processor.process('hard', true);
            // Update overlay if active
            if (this.trashOverlay) {
                const overlay = this.processor.process('alphaB1', true);
                this.renderEngine.setOverlay(overlay);
            }
        }

        if (img) {
            // false = do not reset view (keep pan/zoom)
            this.renderEngine.setImage(img, false);
        }

        this._needsFullRefresh = true;
    }

    refreshI18nTexts() {
        const btnShowAlpha = document.getElementById('btn-show-alpha');
        if (btnShowAlpha) {
            btnShowAlpha.textContent = (this.typesOfAlpha === 'soft') ? t('trash.btnAlpha') : t('trash.btnTrash');
        }
        const btnOvBasic = document.getElementById('btn-ov-basic');
        if (btnOvBasic) {
            btnOvBasic.textContent = this.trashOverlay ? t('trash.btnShowBasicOn') : t('trash.btnShowBasic');
        }
        const btnOv = document.getElementById('btn-overlay-mode');
        if (btnOv) {
            btnOv.textContent = (this.solidVis && this.solidVis.pen) ? t('solid.compositeOn') : t('solid.compositeOff');
        }
        // Update Auth Status text
        this.updateAuthUI(this._isAuthenticated);

        // Re-render help if showing
        const overlay = document.getElementById('help-overlay');
        if (overlay && overlay.style.display === 'flex' && this._currentHelpMode) {
            this.showHelp(this._currentHelpMode);
        }
    }

    updateTrashUI() {
        this.refreshI18nTexts();
        const btnShowAlpha = document.getElementById('btn-show-alpha');
        if (btnShowAlpha) {
            btnShowAlpha.classList.toggle('active', this.typesOfAlpha === 'soft');
        }
        const btnOvBasic = document.getElementById('btn-ov-basic');
        if (btnOvBasic) {
            btnOvBasic.classList.toggle('active', this.trashOverlay);
        }
    }

    updateAuthUI(isAuthenticated) {
        this._isAuthenticated = isAuthenticated;
        const statusEl = document.getElementById('auth-status');
        if (statusEl) {
            statusEl.textContent = isAuthenticated ? t('auth.statusAuthenticated') : t('auth.statusLocked');
            statusEl.classList.toggle('verified', isAuthenticated);
            statusEl.classList.toggle('unverified', !isAuthenticated);

            // Inline style override to ensure visibility
            statusEl.style.backgroundColor = isAuthenticated ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)';
            statusEl.style.color = isAuthenticated ? '#00ff00' : '#ff0000';
            statusEl.style.border = isAuthenticated ? '1px solid #00ff00' : '1px solid #ff0000';

            // 未認証時のみクリック可能（設定を開く）にする
            if (!isAuthenticated) {
                statusEl.style.cursor = 'pointer';
                statusEl.onclick = () => {
                    const settingsModal = document.getElementById('settings-modal');
                    if (settingsModal) {
                        settingsModal.style.display = 'flex';
                        // 設定キーの入力を促すため、インプットにフォーカス
                        const inpKey = document.getElementById('inp-auth-key');
                        if (inpKey) {
                            inpKey.value = localStorage.getItem('aaronAlpha_auth_key') || '';
                            inpKey.focus();
                        }
                    }
                };
            } else {
                statusEl.style.cursor = 'default';
                statusEl.onclick = null;
            }
        }

        // Lock/Unlock Tabs -> Allow tabs, only restrict export
        // "未認証時でもモード切り替えは可能。出力のみ抑制。"
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            // Always enable tabs
            tab.classList.remove('btn-disabled');
            tab.style.pointerEvents = 'auto';
            tab.style.opacity = '1';
            tab.removeAttribute('title');
        });

        // Update Export Buttons
        const btns = [
            document.getElementById('btn-export-b'), // Trash
            document.getElementById('btn-export-c')  // Solid
        ];
        btns.forEach(btn => {
            if (!btn) return;
            btn.disabled = !isAuthenticated;
            if (isAuthenticated) {
                btn.classList.remove('btn-disabled');
                btn.removeAttribute('data-disabled-msg');
                btn.removeAttribute('title');
            } else {
                btn.classList.add('btn-disabled');
                btn.setAttribute('data-disabled-msg', t('auth.reqAuth'));
                btn.setAttribute('title', t('auth.promptMsg') || 'Basic認証が必要です');
            }
        });

        // 新設の「認証発行」ボタン制御
        const btnIssueAuth = document.getElementById('btn-issue-auth');
        if (btnIssueAuth) {
            btnIssueAuth.disabled = isAuthenticated;
            if (isAuthenticated) {
                btnIssueAuth.style.opacity = '0.5';
                btnIssueAuth.style.cursor = 'not-allowed';
                btnIssueAuth.style.filter = 'grayscale(100%)';
            } else {
                btnIssueAuth.style.opacity = '1';
                btnIssueAuth.style.cursor = 'pointer';
                btnIssueAuth.style.filter = 'none';
            }
        }

        console.log(`[AppController] Auth UI updated: ${isAuthenticated}`);

        // Force switch removed.
    }

    requestUpdate(recalc = false) {
        if (recalc) this._needsSmartRefresh = true;
        if (this.pendingUpdate) return;
        this.pendingUpdate = true;
        requestAnimationFrame(() => {
            this.pendingUpdate = false;
            if (this.isProcessing) return;
            this.isProcessing = true;
            this.updateMainView();
            this.isProcessing = false;
        });
    }

    updateMainView(skipUpdate = false) {
        if (!this.processor.hasImages()) {
            console.log('[AppController/Log] updateMainView skipped: No images available.');
            return;
        }

        console.log(`[AppController/Log] >>> START: updateMainView (Mode: ${this.currentMode}, skipUpdate: ${skipUpdate})`);
        const p = this.processor;
        const re = this.renderEngine;
        let img = null;
        let overlayImg = null;

        try {
            if (this.currentMode === 'basic') {
                if (this.hasEnteredTrash) {
                    // trash モード経験済み: mask_buffer を反映した結果を表示
                    console.log('[AppController/Log] --- Path: basic (with mask applied via alphaB1)');
                    img = p.process('alphaB1', skipUpdate);
                } else {
                    console.log('[AppController/Log] --- Path: basic extraction');
                    img = p.process('basic', skipUpdate);
                }
            } else if (this.currentMode === 'trash') {
                const vp = re.getViewPort();
                // バッファが 'full' の場合は計算を完全にスキップして描画のみ行う
                // (ただし、スライダー操作等により calcVP がセットされる場合は計算が必要)

                let calcVP = vp;
                if (this._needsSmartRefresh) {
                    console.log('[AppController/Log] --- Smart Refresh Triggered (State: full-sync)');
                    calcVP = null; // 全域計算
                    this._needsSmartRefresh = false;
                    this._bufferState = 'full'; // 全域計算したので 'full' に
                }

                if (this.isTrashAlignMode) {
                    console.log('[AppController/Log] --- Path: trash alignment (Soft Alpha)');
                    // 位置調整モード中でも、必要があれば全域・不要ならビューポート限定
                    if (!skipUpdate) {
                        p.updateAlignmentAlphaOnly(
                            p.offset.x, p.offset.y,
                            p.garbageMatte, 12,
                            calcVP, this.speedPriority
                        );
                    }
                    img = p.process('soft', true); // 引数で skipUpdate=true (既に呼んだか、あるいは意図的なスキップ)
                } else {
                    // 通常モード
                    p._lastVP = calcVP;
                    if (this.typesOfAlpha === 'soft') {
                        // アルファ表示: プレビューON時は alphaB1 ととの「差し替え」
                        if (this.trashOverlay) {
                            img = p.process('alphaB1', skipUpdate);
                        } else {
                            img = p.process('soft', skipUpdate);
                        }
                    } else {
                        // 二値表示: プレビューON時は二値の上に alphaB1 を「表示（かぶせる）」
                        img = p.process('hard', skipUpdate);
                        if (this.trashOverlay) {
                            overlayImg = p.process('alphaB1', skipUpdate);
                        }
                    }
                }
            } else if (this.currentMode === 'solid') {
                console.log('[AppController/Log] --- Path: solid extraction');

                if (this.isSolidSourceAdjusting) {
                    // Rust側での合成をやめ、RenderEngineのオーバーレイ機能を使うので、
                    // ベースである solid_integrated を描画するだけで良い。
                    // RenderEngineには別途 setSolidSourceLayer で赤マットが渡されている。
                    console.log('[AppController/Log] --- Path: solid source adjustment (RenderEngine Layer)');
                    img = p.process('solid_integrated');
                }
                // Solid Mode での統合表示 (Layer 2 + 3 + 4)
                else if (this.solidVis && this.solidVis.pen) {
                    img = p.process('solid_preview');
                } else {
                    img = p.process('solid_integrated');
                }

                if (!this.isSolidSourceAdjusting && this.solidVis && this.solidVis.solid) {
                    overlayImg = p.getSolidOverlay();
                }
            }

            if (img) {
                console.log(`[AppController/Log] --- Action: Syncing to RenderEngine.`);
                // alpha_zero_bufferは黒基準でα反映済み。描画オフセットは不要
                re.setImageOffset({ x: 0, y: 0 });
                re.setImage(img, false);

                if (overlayImg) {
                    console.log('[AppController/Log] --- Action: Applying Overlay');
                    re.setOverlay(overlayImg);
                } else {
                    re.setOverlay(null);
                }

                // Comparison Mode Sync
                if (re.isComparisonMode && p.inputBlackSource) {
                    re.setComparisonImage(p.inputBlackSource);
                }
                console.log('[AppController/Log] --- RenderEngine Update Request Sent');
            } else {
                console.warn(`[AppController/Log] !!! FAILED: Processor returned null for "${this.currentMode}"`);
            }
        } catch (err) {
            console.error('[AppController/Log] !!! ERROR during updateMainView:', err);
        }

        re.requestRender();
        this.updateOffsetDisplay();
        console.log('[AppController/Log] <<< END: updateMainView');
    }

    setAdjustmentUIState(locked) {
        if (locked) {
            // Force disable comparison mode
            document.querySelectorAll('.chk-comparison-mode').forEach(chk => chk.checked = false);
            if (this.renderEngine) this.renderEngine.setComparisonMode(false);
        }
    }

    handleApplySolidToAlpha() {
        if (!this.processor.hasImages()) return;

        // 1. WASM function call (Apply mask & recalculate display buffers)
        this.processor.applySolidToAlphaZero();

        // 2. Refresh display in Trash mode
        this.updateTrashUI();
        this.requestUpdate(true);

        // 3. Visual effect (flash blue)
        const btn = document.getElementById('btn-apply-solid');
        if (btn) {
            btn.classList.add('active'); // Use active for accent color
            setTimeout(() => {
                btn.classList.remove('active');
            }, 300);
        }
    }

    startTrashAdjustment() {
        this.isTrashAlignMode = true;
        this._backupAlphaType = this.typesOfAlpha;
        this._backupOverlay = this.trashOverlay;
        this.typesOfAlpha = 'soft';
        this.trashOverlay = false;

        document.getElementById('ui-blocker').style.display = 'block';
        document.querySelector('#btn-align-mode .adjust-message').style.display = 'block';
        const vp = document.getElementById('viewport-container');
        vp.style.position = 'relative'; // Ensure z-index works
        vp.style.zIndex = '10001';
        document.getElementById('btn-align-mode').classList.add('adjust-mode');
        this.setAdjustmentUIState(true);
        this.updateMainView();
    }

    endTrashAdjustment() {
        this.isTrashAlignMode = false;

        // 確定時: alpha_zero_bufferを全再計算（ストレートRGB含む）
        this.processor.confirmOffset(this.processor.offset.x, this.processor.offset.y);

        // 再計算されたalpha_zero_bufferからバッファ初期化
        this.processor.initTrashMode();

        // Restore previous view state
        if (this._backupAlphaType) this._typesOfAlpha = this._backupAlphaType;
        if (this._backupOverlay !== undefined) this._overlayMode = this._backupOverlay;
        this.processor.updateParams('typeOfAlpha', this._typesOfAlpha);
        this.processor.updateParams('overlayMode', this._overlayMode);

        document.getElementById('ui-blocker').style.display = 'none';
        const adjustMsg = document.querySelector('#btn-align-mode .adjust-message');
        if (adjustMsg) adjustMsg.style.display = 'none';
        const vp = document.getElementById('viewport-container');
        if (vp) {
            vp.style.zIndex = '';
            vp.style.position = '';
        }
        document.getElementById('btn-align-mode')?.classList.remove('adjust-mode');
        this.setAdjustmentUIState(false);
        this.updateTrashUI();

        // 【重要】確定時は必ず全域を同期して見た目の齟齬を無くす
        this._needsSmartRefresh = true;
        this.updateMainView();
    }

    startMatteEditing() {
        this.isMatteEditing = true;
        document.getElementById('ui-blocker').style.display = 'block';
        document.querySelector('#btn-mode-matte .matte-message').style.display = 'block';
        const viewport = document.getElementById('viewport-container');
        if (viewport) {
            viewport.style.position = 'relative';
            viewport.style.zIndex = '10001';
        }
        document.getElementById('btn-mode-matte').classList.add('adjust-mode');
        this.setAdjustmentUIState(true);
    }

    endMatteEditing() {
        // Apply matte from drag rect if available (from check version L300-328)
        const rect = this.renderEngine.dragRect;
        if (rect && rect.w !== 0 && rect.h !== 0) {
            this.applyMatteFromRect(rect);
        }
        this.renderEngine.setMatteRect(null);

        this.isMatteEditing = false;
        this.isDraggingMatte = false;

        document.getElementById('ui-blocker').style.display = 'none';
        document.querySelector('#btn-mode-matte .matte-message').style.display = 'none';
        const viewport = document.getElementById('viewport-container');
        if (viewport) {
            viewport.style.zIndex = '';
            viewport.style.position = '';
        }
        document.getElementById('btn-mode-matte').classList.remove('adjust-mode');
    }

    updateMatteInputs() {
        const gm = this.processor.garbageMatte;
        const ids = ['in-matte-t', 'in-matte-b', 'in-matte-l', 'in-matte-r'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = gm[id.split('-')[2]];
        });
    }

    updateMatteInputsFromUI() {
        const gm = this.processor.garbageMatte;
        ['t', 'b', 'l', 'r'].forEach(k => {
            const el = document.getElementById(`in-matte-${k}`);
            if (el) this.processor.updateGarbageMatte(k, parseInt(el.value, 10) || 0);
        });
        this.renderEngine.setGarbageMatte(this.processor.garbageMatte);
        this.requestUpdate(true);
    }

    bindTabEvents() {
        const tabs = document.querySelectorAll('.tab-btn');
        const panels = document.querySelectorAll('.panel-page');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const targetId = tab.getAttribute('data-target');
                panels.forEach(p => p.classList.remove('active'));
                document.getElementById(targetId).classList.add('active');

                // ゴミ取りモードから離れる際は、現在の状態を確定（alphaB1にストレートRGBを構築）する
                if (this.currentMode === 'trash' && targetId !== 'panel-trash') {
                    if (this.processor.hasImages()) {
                        this.processor.finalizeTrashMode();
                    }
                }

                this.currentMode = targetId.replace('panel-', '');

                // ソリッドモードに切り替えた際、Rust側の update_solid_mode を発動させ、
                // ガベージマット範囲外の c1s_buffer / solid_buffer をクリアする。
                // これにより、後続の build_solid_base_image / build_solid_overlay が
                // 古い範囲外データを参照しなくなる。
                if (this.currentMode === 'solid' && this.processor.hasImages()) {
                    const slLevel = document.getElementById('rng-solid-level');
                    const val = slLevel ? parseInt(slLevel.value) : 255;
                    this.processor.updateSolidMode(val);
                }

                // --- 画像未入力時のガードレール ---
                if (!this.processor.hasImages()) {
                    if (this.currentMode !== 'basic') {
                        this.updateNoImageLock(true);
                    } else {
                        this.updateNoImageLock(false);
                    }

                    // アーロン様のご要望: 画像未入力・操作ロック状態であっても、
                    // ヘルプがONの場合は現在のタブに合わせたヘルプテキストを表示させる。
                    if (this.isHelpActive) {
                        this.updatePreviewHelp();
                    }

                    // 未入力時はタブの見た目だけ切り替え、初期化系ロジックはスキップする
                    return;
                } else {
                    this.updateNoImageLock(false);
                }

                // --- 赤枠の表示制御: ゴミ取りモードのみ表示 ---
                if (this.currentMode === 'trash') {
                    this.renderEngine.setGarbageMatte(this.processor.garbageMatte);
                } else {
                    // basic・solid では赤枠を非表示（内部値は保持）
                    this.renderEngine.setGarbageMatte(null);
                }

                if (this.currentMode === 'trash' && !this.hasEnteredTrash) {
                    // First entry: force black background
                    this.setCanvasBackground('color', '#000000');
                    this.hasEnteredTrash = true;
                    const chk = document.getElementById('chk-bg-trash-color');
                    if (chk) chk.checked = true;
                    // Enable color picker since we switched to color mode
                    const cp = document.querySelector('#panel-trash .bg-common-color-picker');
                    if (cp) cp.disabled = false;
                    // 初回のみ: バッファ初期化と設定リセット
                    this.processor.initTrashMode();
                    this._typesOfAlpha = 'hard';
                    this._overlayMode = false;
                    this.processor.updateParams('typeOfAlpha', 'hard');
                    this.processor.updateParams('overlayMode', false);
                    this.updateTrashUI();
                }

                if (this.currentMode === 'solid' && !this.hasEnteredSolid) {
                    this.hasEnteredSolid = true;
                    // 初回突入時のズーム・パンリセットは削除 (前回の状態を維持)

                    // 初回のみ：背景を透明（checker）に強制して初心者の書き出しミスを防ぐ
                    this.setCanvasBackground('checker');
                    ['chk-bg-basic-color', 'chk-bg-trash-color', 'chk-bg-solid-color'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.checked = false;
                    });

                    // 比較モードを解除（全パネル）
                    document.querySelectorAll('.chk-comparison-mode').forEach(chk => chk.checked = false);
                    this.renderEngine.setComparisonMode(false);
                    // 表示フラグ初期化
                    this.solidVis = { pen: false, solid: true };
                    // UIボタンの状態を同期
                    const btnPreview = document.getElementById('btn-overlay-mode');
                    if (btnPreview) btnPreview.classList.remove('active');
                    const btnSolid = document.getElementById('btn-view-solid');
                    if (btnSolid) btnSolid.classList.add('active');
                }

                this.updateTrashUI();
                this.updateMainView();

                // ヘルプ表示を更新（プレビュー上のチップ用）
                if (this.isHelpActive) {
                    this.updatePreviewHelp();
                }
            });
        });
    }

    bindInputEvents() {
        const linkSlider = (sliderId, valId, param) => {
            const el = document.getElementById(sliderId);
            const valEl = document.getElementById(valId);
            if (!el) return;
            const updateValue = (val) => {
                el.value = val;
                if (valEl) valEl.textContent = val;
                this.processor.updateParams(param, parseInt(val));
                this._bufferState = 'partial'; // パラメータが変わったのでバッファは「部分的」になる
                this.requestUpdate(true);
            };
            el.addEventListener('input', (e) => updateValue(e.target.value));
            // Wheel support for sliders
            el.addEventListener('wheel', (e) => {
                e.preventDefault();
                let val = parseInt(el.value);
                val += (e.deltaY < 0 ? 1 : -1);
                val = Math.max(parseInt(el.min), Math.min(parseInt(el.max), val));
                updateValue(val);
            });
        };
        linkSlider('rng-threshold', 'val-threshold', 'threshold');

        // V2 Param Sliders
        linkSlider('rng-coast-dist', 'val-coast-dist', 'solidCoastDist');
        linkSlider('rng-aa-thres', 'val-aa-thres', 'solidAaThres');
        // dirCount is now hardcoded to 6 in Rust/ImageProcessor

        ['in-matte-t', 'in-matte-b', 'in-matte-l', 'in-matte-r'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                this._bufferState = 'partial'; // ガーベージマット変更も部分的
                this.updateMatteInputsFromUI();
            });
        });

        // Background & Comparison Toggles
        document.querySelectorAll('.chk-comparison-mode').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const state = e.target.checked;
                console.log(`[AppController/Log] Comparison Mode Toggled: ${state}`);
                this.renderEngine.setComparisonMode(state);
                // Also update others to sync UI
                document.querySelectorAll('.chk-comparison-mode').forEach(c => c.checked = state);
                this.updateMainView();
            });
        });

        // Solid Ext Toggle
        const chkSolidExt = document.getElementById('chk-solid-ext');
        if (chkSolidExt) {
            chkSolidExt.addEventListener('change', (e) => {
                const state = e.target.checked;
                console.log(`[AppController/Log] Solid Ext Toggled: ${state}`);
                this.solidExtEnabled = state;
                localStorage.setItem('aaronAlpha_solidExt', state);
                const dp = document.getElementById('solid-v2-debug-panel');
                if (dp) dp.style.display = state ? 'block' : 'none';

                // Switch off floating debug panel if disabled
                if (!state) {
                    const dbgPanel = document.getElementById('debug-panel');
                    if (dbgPanel) dbgPanel.style.display = 'none';
                    this.currentSmValue = undefined;
                }
            });
            // Initial UI sync
            const dp = document.getElementById('solid-v2-debug-panel');
            if (dp) dp.style.display = chkSolidExt.checked ? 'block' : 'none';
        }

        // Speed Priority Toggle (Manual Alignment)
        const chkSpeedPriority = document.getElementById('chk-speed-priority');
        if (chkSpeedPriority) {
            chkSpeedPriority.addEventListener('change', (e) => {
                const state = e.target.checked;
                console.log(`[AppController/Log] Speed Priority Toggled: ${state}`);
                this.speedPriority = state;
                this.saveSetting('aaronAlpha_speedPriority', state);
                // Optionally request an update if in trash/align mode
                if (this.currentMode === 'trash' && this.isTrashAlignMode) {
                    this.requestUpdate(true);
                }
            });
        }

        // Auto Align Toggle
        const chkAutoAlign = document.getElementById('chk-auto-align');
        if (chkAutoAlign) {
            chkAutoAlign.addEventListener('change', (e) => {
                this.saveSetting('aaronAlpha_autoAlign', e.target.checked);
            });
        }

        // Undo Limit Input
        const inpUndoLimit = document.getElementById('inp-undo-limit');
        if (inpUndoLimit) {
            inpUndoLimit.addEventListener('change', (e) => {
                const val = parseInt(e.target.value);
                if (this.processor) this.processor.setUndoLimit(val);
                this.saveSetting('aaronAlpha_undoLimit', val);
            });
        }

        // Calc Mode Selector
        const selCalcMode = document.getElementById('sel-calc-mode');
        if (selCalcMode) {
            selCalcMode.addEventListener('change', (e) => {
                const val = e.target.value;
                console.log(`[AppController/Log] Calc Mode Changed: ${val}`);
                if (this.processor.updateParams('calcMode', val)) {
                    this.requestUpdate(true);
                }
            });
        }

        const syncBG = (chkId) => {
            const chk = document.getElementById(chkId);
            if (!chk) return;
            chk.addEventListener('change', (e) => {
                const type = e.target.checked ? 'color' : 'checker';
                this.setCanvasBackground(type);
            });
        };
        syncBG('chk-bg-basic-color');
        syncBG('chk-bg-trash-color');
        syncBG('chk-bg-solid-color');

        // Wheel support for matte number inputs
        ['in-matte-t', 'in-matte-b', 'in-matte-l', 'in-matte-r'].forEach(id => {
            const input = document.getElementById(id);
            if (!input) return;
            input.addEventListener('wheel', (e) => {
                e.preventDefault();
                let val = parseInt(input.value) || 0;
                val += (e.deltaY < 0 ? 1 : -1);
                val = Math.max(0, val);
                input.value = val;
                this.updateMatteInputsFromUI();
            });
        });

        document.querySelectorAll('.bg-common-color-picker').forEach(cp => {
            // Input: Change background color live
            cp.addEventListener('input', (e) => {
                this.setCanvasBackground('color', e.target.value);
            });
            // Click/Focus: Auto-switch to color mode if not already
            const autoSwitch = () => {
                if (this.canvasBackground.type !== 'color') {
                    this.setCanvasBackground('color', cp.value);
                    // Sync toggles immediately
                    ['chk-bg-basic-color', 'chk-bg-trash-color', 'chk-bg-solid-color'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.checked = true;
                    });
                }
            };
            cp.addEventListener('click', autoSwitch);
            cp.addEventListener('focus', autoSwitch);
        });
    }

    bindButtonEvents() {
        if (this._buttonsBound) return;
        this._buttonsBound = true;

        document.getElementById('btn-show-alpha')?.addEventListener('click', () => {
            this.typesOfAlpha = (this.typesOfAlpha === 'hard') ? 'soft' : 'hard';
        });
        document.getElementById('btn-ov-basic')?.addEventListener('click', () => {
            this.trashOverlay = !this.trashOverlay;
        });
        document.getElementById('btn-align-mode')?.addEventListener('click', () => {
            if (this.isTrashAlignMode) this.endTrashAdjustment();
            else this.startTrashAdjustment();
        });
        document.getElementById('btn-apply-solid')?.addEventListener('click', () => {
            this.handleApplySolidToAlpha();
        });
        document.getElementById('btn-mode-matte')?.addEventListener('click', () => {
            if (this.isMatteEditing) this.endMatteEditing();
            else this.startMatteEditing();
        });
        document.getElementById('btn-reset-trash')?.addEventListener('click', () => {
            // [UX改善] リセット前に現在の消しゴム範囲をベイクから削り取る（ゾンビ現象解消）
            this.processor.burnInTrashMask();

            // ガーベージマットをリセット
            this.processor.updateGarbageMatte('t', 0); this.processor.updateGarbageMatte('b', 0);
            this.processor.updateGarbageMatte('l', 0); this.processor.updateGarbageMatte('r', 0);
            this.updateMatteInputs();
            this.renderEngine.setGarbageMatte(this.processor.garbageMatte);
            // バッファ再初期化
            this.processor.resetTrashMask(); // 明示的に投げ縄マスクをリセット
            this.processor.initTrashMode();

            // 位置調整のオフセットを自動計算値にリセット
            this.processor.resetToAutoAlign();
            this.processor.confirmOffset(this.processor.offset.x, this.processor.offset.y); // WASM側の土台も再計算
            this.updateOffsetDisplay();
            this._needsSmartRefresh = true; // 画面外のズレを完璧に塗り直すため強制全域同期
            this.updateMainView(); // 見た目もリセット後の状態（ストレートRGB）に即時反映させる

            // 表示モードリセット
            this._typesOfAlpha = 'hard';
            this._overlayMode = false;
            this.processor.updateParams('typeOfAlpha', 'hard');
            this.processor.updateParams('overlayMode', false);
            // 閾値をデフォルト(5)に戻す
            this.processor.updateParams('threshold', 5);
            const thSlider = document.getElementById('rng-threshold');
            if (thSlider) { thSlider.value = 5; }
            const thVal = document.getElementById('val-threshold');
            if (thVal) { thVal.textContent = '5'; }

            // --- AA状態の初期化 ---
            this.processor.updateParams('aa', true);
            const chkTrashAA = document.getElementById('chk-trash-aa');
            if (chkTrashAA) chkTrashAA.checked = true;
            document.getElementById('btn-trash-aa')?.classList.add('active');

            // 背景色リセット(透明=checker) & 全モード同期
            this.resetBackgroundSettings();

            // 比較モードOFF (UI sync)
            this.renderEngine.setComparisonMode(false);
            document.querySelectorAll('.chk-comparison-mode').forEach(c => c.checked = false);
            // ズーム・パンをリセット
            this.renderEngine.fitToScreen();
            this._bufferState = 'full'; // リセット時は全域
            this._lastScale = this.renderEngine.scale;
            this._lastPan = { ...this.renderEngine.pan };
            this.updateTrashUI();
            this.requestUpdate(true);
        });

        document.getElementById('btn-export-a')?.addEventListener('click', () => this.handleExportBasic());
        document.getElementById('btn-export-b')?.addEventListener('click', () => this.handleExportTrash());
        document.getElementById('btn-export-c')?.addEventListener('click', () => this.handleExportSolid());

        // Basic Mode Reset All Button
        document.getElementById('btn-reset-all')?.addEventListener('click', () => {
            this.handleAppReset();
        });

        // Auth Related Buttons
        document.getElementById('btn-issue-auth')?.addEventListener('click', () => {
            if (window.authManager) window.authManager.openPolarShop();
        });

        document.getElementById('btn-save-auth-key')?.addEventListener('click', () => {
            const inp = document.getElementById('inp-auth-key');
            if (inp && window.authManager) {
                window.authManager.login(inp.value);
            }
        });

        document.getElementById('btn-reset-auth')?.addEventListener('click', async () => {
            if (window.authManager) {
                const ok = await Dialog.confirm(t('auth.confirmReset'), t('auth.resetAuth'));
                if (ok) {
                    window.authManager.logout();
                    location.reload();
                }
            }
        });

        // AA ボタン連動 (Trash)
        document.getElementById('btn-trash-aa')?.addEventListener('click', () => {
            const chk = document.getElementById('chk-trash-aa');
            if (chk) {
                chk.checked = !chk.checked;
                document.getElementById('btn-trash-aa')?.classList.toggle('active', chk.checked);
                console.log(`[AppController] Trash AA toggled: ${chk.checked}`);
            }
        });

        // AA ボタン連動 (Solid)
        document.getElementById('btn-solid-aa')?.addEventListener('click', () => {
            const chk = document.getElementById('chk-tool-aa');
            if (chk) {
                chk.checked = !chk.checked;
                document.getElementById('btn-solid-aa')?.classList.toggle('active', chk.checked);
                console.log(`[AppController] Solid AA toggled: ${chk.checked}`);
            }
        });

        // Help Toggle Handler
        document.querySelectorAll('.btn-help').forEach(btn => {
            btn.addEventListener('click', () => {
                this.toggleHelpMode();
            });
        });
        document.getElementById('btn-close-help')?.addEventListener('click', () => {
            this.hideHelp();
        });
        document.getElementById('help-overlay')?.addEventListener('click', (e) => {
            // オーバーレイ内のどこをクリックしても（Bentoカード上や文章上でも）閉じるように条件を撤廃
            this.hideHelp();
        });
    }

    // Help Overlay Methods were moved/simplified to avoid deadlock and locking.

    bindDragDropEvents() {
        this.setupFileHandling('drop-zone-black', 'file-black', 'black');
        this.setupFileHandling('drop-zone-white', 'file-white', 'white');
        this.setupFileHandling('drop-zone-solid-source', 'file-solid-source', 'solid-source');
        console.log('[AppController] Drag & Drop events bound (v5.2 Rebuilt)');
    }

    setupFileHandling(zoneId, inputId, type) {
        const zone = document.getElementById(zoneId);
        const input = document.getElementById(inputId);
        if (!zone || !input) return;

        // Click on zone triggers hidden file input
        zone.onclick = () => input.click();

        input.onchange = (e) => {
            if (e.target.files && e.target.files.length > 0) {
                this.handleFileDrop(type, e.target.files[0], zone);
            }
            input.value = ''; // Reset for re-uploading same file
        };
        this.setupDropZone(zoneId, type);
    }

    setupDropZone(elementId, type) {
        const zone = document.getElementById(elementId);
        if (!zone) return;
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
            zone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
        zone.addEventListener('dragover', () => zone.classList.add('dragover'));
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', (e) => {
            zone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileDrop(type, files[0], zone);
            }
        });
    }

    async handleFileDrop(type, file, zoneElement) {
        // [V06] Strict File Type Check
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/bmp'];
        if (!file.type.startsWith('image/') || !allowedTypes.includes(file.type)) {
            console.warn('[AppController] Unsupported file type:', file.type);
            Dialog.alert(t('error.unsupportedFormat'));
            return;
        }


        // [V06] Save Base Filename from Black Image
        if (type === 'black') {
            this.baseFileName = file.name.replace(/\.[^/.]+$/, "");
            console.log(`[AppController] Base Filename set: ${this.baseFileName} `);
        }

        console.log(`[AppController] File load start: ${type} - ${file.name} `);
        const loader = document.getElementById('loading-overlay');
        const msgEl = document.getElementById('auto-align-msg');

        // Check if this drop will trigger processing (i.e. we will have both images)
        let willProcess = false;
        if (type === 'solid-source') {
            willProcess = false; // Solid source just switches tab
        } else if (type === 'black') {
            willProcess = !!this.processor.whiteBitmap;
        } else if (type === 'white') {
            willProcess = !!this.processor.blackBitmap;
        }

        // Show "Calculating..." message BEFORE overlay if we are going to process
        if (willProcess && msgEl) {
            msgEl.style.display = 'inline';
        }

        if (loader) loader.classList.add('visible');

        try {
            // [V06] Solid Source Adjustment
            if (type === 'solid-source') {
                console.log('[AppController] Starting Solid Source Adjustment...');
                const res = await this.processor.loadSolidSourceTemp(file);
                this.solidSourceOffset = { x: res.initialX, y: res.initialY };
                this.startSolidSourceAdjustment();
                return; // Stop here
            }

            // Processing in ImageProcessor
            const url = await this.processor.loadInputImage(type, file);

            if (zoneElement) {
                const thumb = zoneElement.querySelector('.preview-thumb');
                if (thumb) {
                    thumb.style.backgroundImage = `url(${url})`;
                    zoneElement.classList.add('has-image');
                }
            }

            if (this.processor.hasImages()) { // willProcess should be true here
                console.log('[AppController] Images ready. Keeping overlay active for processing...');

                // Give browser a moment to render the message (even though overlay is up)
                // Overlay z-index is 10000, Message z-index is 10002.
                setTimeout(() => {
                    try {
                        if (type === 'solid-source') {
                            const solidTab = document.querySelector('.tab-btn[data-target="panel-solid"]');
                            if (solidTab) solidTab.click();
                        } else {
                            console.log('[AppController] Starting heavy processing...');
                            const result = this.processor.process('basic');
                            if (result) {
                                this.renderEngine.setImage(result, true);
                                this.requestUpdate(true);
                                console.log('[AppController] Initial render & Fit applied.');
                            }
                        }
                    } catch (err) {
                        console.error('[AppController] Error during delayed processing:', err);
                    } finally {
                        // Cleanup processing UI
                        if (msgEl) msgEl.style.display = 'none';
                        if (loader) loader.classList.remove('visible');
                    }
                }, 50); // Small delay to ensure UI update
            } else {
                console.log('[AppController] First image loaded, waiting for second...');
                // If not processing, hide loader here (handled in finally/conditional below)
            }
        } catch (e) {
            console.error(`[AppController] File load error(${type}): `, e);

            let msg = `Error: ${e.message} `;
            if (e.code === 'SIZE_MISMATCH') {
                // Use imported 't' function for translation
                try {
                    msg = t('error.sizeMismatch', {
                        w1: e.w1, h1: e.h1,
                        w2: e.w2, h2: e.h2
                    });
                } catch (i18nErr) {
                    console.error('i18n error:', i18nErr);
                    // Fallback
                    msg = `Image dimension mismatch(${e.w1}x${e.h1} vs ${e.w2}x${e.h2}).`;
                }
            } else {
                // Generic Load Error
                try {
                    msg = t('error.loadFailed', { msg: e.message });
                } catch (err) {
                    msg = `Error: ${e.message} `;
                }
            }

            Dialog.alert(msg);

            // Error case cleanup
            if (msgEl) msgEl.style.display = 'none';
            if (loader) loader.classList.remove('visible');
        } finally {
            // Only hide loader here IF WE ARE NOT GOING TO PROCESS
            // If we are processing, the setTimeout above handles hiding it.
            if (!this.processor.hasImages() && type !== 'solid-source') {
                if (loader) loader.classList.remove('visible');
            }
            // For solid-source, we might want to hide it too, logic below handles basics.
            if (!willProcess && type === 'solid-source') {
                if (loader) loader.classList.remove('visible');
            }
            console.log(`[AppController] File load end: ${type} `);
        }
    }

    bindSolidEvents() {
        // --- Solid Level スライダー ---
        const slLevel = document.getElementById('rng-solid-level');
        const valLevel = document.getElementById('val-solid-level');
        if (slLevel) {
            const updateLevel = (val) => {
                slLevel.value = val;
                if (valLevel) valLevel.textContent = val;
                const rayDist = parseInt(document.getElementById('rng-raycast-dist')?.value || '5');
                this.processor.updateSolidMode(parseInt(val), 64, rayDist);
                this.updateMainView();
            };
            slLevel.addEventListener('input', (e) => updateLevel(e.target.value));
            slLevel.addEventListener('wheel', (e) => {
                e.preventDefault();
                let v = parseInt(slLevel.value);
                v += (e.deltaY < 0 ? 1 : -1);
                v = Math.max(0, Math.min(255, v));
                updateLevel(v);
            });
        }

        // --- Raycast Distance スライダー ---
        const slRay = document.getElementById('rng-raycast-dist');
        const valRay = document.getElementById('val-raycast-dist');
        if (slRay) {
            const updateRay = (val) => {
                slRay.value = val;
                if (valRay) valRay.textContent = val + 'px';
            };
            slRay.addEventListener('input', (e) => updateRay(e.target.value));
            slRay.addEventListener('wheel', (e) => {
                e.preventDefault();
                let v = parseInt(slRay.value);
                v += (e.deltaY < 0 ? 1 : -1);
                v = Math.max(0, Math.min(50, v));
                updateRay(v);
            });
        }

        // --- 充填ボタン ---
        const btnRaycast = document.getElementById('btn-exec-raycast');
        if (btnRaycast) {
            btnRaycast.addEventListener('click', () => {
                if (this.isProcessing) return;
                console.log('[AppController] Executing Raycast Fill...');

                // 1. UI Lock
                this.setUILock(true);
                this.isProcessing = true;

                // 視覚的フィードバック（緑色にフラッシュ）
                const origBg = btnRaycast.style.backgroundColor;
                const origColor = btnRaycast.style.color;
                btnRaycast.style.transition = 'background-color 0.1s, color 0.1s';
                btnRaycast.style.backgroundColor = '#4CAF50'; // Green
                btnRaycast.style.color = '#fff';

                // Give browser time to render lock UI before heavy WASM calculation
                setTimeout(() => {
                    btnRaycast.style.backgroundColor = '';
                    btnRaycast.style.color = '';
                    setTimeout(() => {
                        btnRaycast.style.transition = ''; // reset transition
                    }, 200);

                    // Collect Params
                    const level = parseInt(document.getElementById('rng-solid-level')?.value || '255');
                    const rayDist = parseInt(document.getElementById('rng-raycast-dist')?.value || '5');
                    const coastDist = parseInt(document.getElementById('rng-coast-dist')?.value || '3');
                    const aaThres = parseInt(document.getElementById('rng-aa-thres')?.value || '128');
                    const dirCount = 6; // Hardcoded to 6 (Fixed encirclement threshold)

                    // Update Params first (this recalculates solid_buffer from soft_mat_buffer)
                    this.processor.updateSolidMode(level, 64, rayDist, coastDist, aaThres, dirCount);

                    this.processor.pushUndoState('solid'); // Undo用の状態保存

                    // 3. Execute Shot
                    this.processor.executeSolidShot();

                    // 充填後: スライダーを255にリセット
                    const slLevel = document.getElementById('rng-solid-level');
                    const valLevel = document.getElementById('val-solid-level');
                    if (slLevel) { slLevel.value = 255; if (valLevel) valLevel.textContent = '255'; }
                    this.processor.updateSolidMode(255, 64, rayDist, coastDist, aaThres, dirCount);

                    // 4. Update View & Unlock UI
                    this.isProcessing = false; // フラグを解除しないと updateMainView がブロックされる
                    this._bufferState = 'partial';
                    this.updateMainView();     // requestUpdateではなく即時実行して確実に画面へ反映させる

                    // Allow final render to complete before unlocking UI
                    requestAnimationFrame(() => {
                        this.setUILock(false);
                    });
                }, 50); // Short delay for lock UI rendering
            });
        }
        // --- プレビュートグル ---
        const btnPreview = document.getElementById('btn-overlay-mode');
        if (btnPreview) {
            btnPreview.addEventListener('click', () => {
                this.solidVis.pen = !this.solidVis.pen;
                btnPreview.classList.toggle('active', this.solidVis.pen);
                console.log(`[AppController] Solid Preview: ${this.solidVis.pen} `);
                this.refreshI18nTexts();
                this.updateMainView();
            });
            btnPreview.classList.toggle('active', this.solidVis.pen);
        }

        // --- 不透明ビジュアライズトグル ---
        const btnSolid = document.getElementById('btn-view-solid');
        if (btnSolid) {
            btnSolid.addEventListener('click', () => {
                this.solidVis.solid = !this.solidVis.solid;
                btnSolid.classList.toggle('active', this.solidVis.solid);
                console.log(`[AppController] Solid Viz: ${this.solidVis.solid} `);
                this.updateMainView();
            });
            btnSolid.classList.toggle('active', this.solidVis.solid);
        }

        // --- リセットボタン ---
        document.getElementById('btn-reset-solid')?.addEventListener('click', () => {
            // 【指示通り】リセット時にヘルプモードをOFFにする
            if (this.isHelpActive) {
                this.toggleHelpMode();
            }

            console.log('[AppController] Resetting Solid Mode (Keeping Bake)...');
            // ベイクを残し、Live編集(C1s)だけをクリアする
            this.processor.clearSolidEditsOnly();
            // オーバーレイ表示をクリア
            this.renderEngine.setOverlay(null);
            // スライダーもリセット
            if (slLevel) { slLevel.value = 255; if (valLevel) valLevel.textContent = '255'; }
            if (slRay) { slRay.value = 5; if (valRay) valRay.textContent = '5px'; }

            // --- AA状態の初期化 ---
            this.processor.updateParams('aa_solid', true);
            const chkSolidAA = document.getElementById('chk-tool-aa');
            if (chkSolidAA) chkSolidAA.checked = true;
            document.getElementById('btn-solid-aa')?.classList.add('active');

            // 背景色リセット(透明=checker) & 全モード同期
            this.resetBackgroundSettings();

            // 比較モードOFF (UI sync)
            this.renderEngine.setComparisonMode(false);
            document.querySelectorAll('.chk-comparison-mode').forEach(chk => chk.checked = false);

            // ズーム・パンをリセット
            this.renderEngine.fitToScreen();

            // 表示状態を初期化
            this.solidVis = { pen: false, solid: true };
            const btnPreview = document.getElementById('btn-overlay-mode');
            if (btnPreview) btnPreview.classList.remove('active');
            const btnSolid = document.getElementById('btn-view-solid');
            if (btnSolid) btnSolid.classList.add('active');

            this._bufferState = 'full'; // リセット時は全域
            this.updateMainView();
        });
    }

    bindKeyEvents() {
        // --- keydown ---
        window.addEventListener('keydown', (e) => {
            if (!this.processor.hasImages()) return;

            // Z key - Free Lasso override in comparison mode
            if (e.code === 'KeyZ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                this.isZKeyPressed = true;
            }

            // Quick Preview (A) - Toggle background (replaces Ctrl)
            if (e.code === 'KeyA' && !e.repeat && !this.tempBgType && !e.ctrlKey && !e.metaKey) {
                if (this.isTrashAlignMode || this.isMatteEditing || this.isSolidSourceAdjusting) return;
                this.tempBgType = this.canvasBackground.type;
                const newType = (this.tempBgType === 'checker') ? 'color' : 'checker';
                this.setCanvasBackground(newType);
                const bgToggles = ['chk-bg-basic-color', 'chk-bg-trash-color', 'chk-bg-solid-color'];
                bgToggles.forEach(id => {
                    const chk = document.getElementById(id);
                    if (chk) chk.checked = (newType === 'color');
                });
                this.updateMainView();
                return;
            }


            // Enter key for Matte Edit Mode
            if (e.code === 'Enter' && this.isMatteEditing) {
                this.endMatteEditing();
                return;
            }


            // [V06] Solid Source Adjustment Keys
            if (this.isSolidSourceAdjusting) {
                if (e.code === 'Enter') {
                    e.preventDefault();
                    this.endSolidSourceAdjustment(true);
                    return;
                }
                if (e.code === 'Escape') {
                    e.preventDefault();
                    this.endSolidSourceAdjustment(false);
                    return;
                }
                if (e.code.startsWith('Arrow')) {
                    e.preventDefault();
                    const step = e.shiftKey ? 10 : 1;
                    let dx = 0, dy = 0;
                    if (e.code === 'ArrowUp') dy = -step;
                    if (e.code === 'ArrowDown') dy = step;
                    if (e.code === 'ArrowLeft') dx = -step;
                    if (e.code === 'ArrowRight') dx = step;
                    const t0 = performance.now();

                    // 1. Update Rust Offset (for commit/calculations)
                    this.processor.moveSolidSourceTemp(dx, dy);

                    // 2. Update Local Offset for RenderEngine (Fast Preview)
                    this.solidSourceOffset.x += dx;
                    this.solidSourceOffset.y += dy;
                    this.renderEngine.setSolidSourceLayerPosition(this.solidSourceOffset.x, this.solidSourceOffset.y);

                    // this.updateMainView(); // Too heavy, just request render
                    // updateMainView reconstructs base image etc.
                    // But wait, RenderEngine.requestRender() might not draw base image if not set?
                    // Base image is already set in RenderEngine.currentImage.
                    // We just need to trigger a redraw.
                    // setSolidSourceLayerPosition already calls requestRender().

                    const t1 = performance.now();
                    console.log(`[Performance] Move Solid Source: ${(t1 - t0).toFixed(2)} ms`);
                    return;
                }
            }

            // F key - Trigger Ray Fill in Solid Mode
            if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                if (this.currentMode === 'solid') {
                    document.getElementById('btn-exec-raycast')?.click();
                }
            }

            // Arrow keys for Trash Alignment
            if (this.currentMode === 'trash' && this.isTrashAlignMode) {
                // 矢印キーのみ反応させ、Spaceキー等の無関係なオートリピートが計算ループを回すのを物理的に遮断
                if (e.code.startsWith('Arrow')) {
                    const step = e.shiftKey ? 10 : 1;
                    if (e.code === 'ArrowUp') this.processor.offset.y += step;
                    if (e.code === 'ArrowDown') this.processor.offset.y -= step;
                    if (e.code === 'ArrowLeft') this.processor.offset.x += step;
                    if (e.code === 'ArrowRight') this.processor.offset.x -= step;

                    this._bufferState = 'partial'; // 位置が変わったので部分的
                    this.requestAlignmentUpdate();
                    this.updateOffsetDisplay();
                }
            }

            // Enter key for confirming Trash Alignment
            if (e.code === 'Enter' && this.isTrashAlignMode) {
                this.endTrashAdjustment();
            }
        });

        // --- keyup ---
        window.addEventListener('keyup', (e) => {
            if (e.code === 'KeyZ') {
                this.isZKeyPressed = false;
            }

            // Quick Preview (A) - Revert background
            if (e.code === 'KeyA') {
                if (this.isTrashAlignMode || this.isMatteEditing || this.isSolidSourceAdjusting) return;
                if (this.tempBgType) {
                    this.setCanvasBackground(this.tempBgType);
                    const bgToggles = ['chk-bg-basic-color', 'chk-bg-trash-color', 'chk-bg-solid-color'];
                    bgToggles.forEach(id => {
                        const chk = document.getElementById(id);
                        if (chk) chk.checked = (this.tempBgType === 'color');
                    });
                    this.tempBgType = null;
                    this.updateMainView();
                }
            }
        });
    }

    bindCanvasEvents() {
        const c = this.renderEngine.canvas;
        c.addEventListener('wheel', (e) => { e.preventDefault(); }, { passive: false });

        // Helper: convert screen coordinates to image coordinates
        const getImgPos = (e) => {
            const rect = c.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const re = this.renderEngine;
            const x = (mx - re.pan.x) / re.scale;
            const y = (my - re.pan.y) / re.scale;
            return { x, y };
        };

        // --- Matte Rect: mousedown ---
        c.addEventListener('mousedown', (e) => {
            // ホイール中ボタン (button === 1) のダブルクリック判定
            if (e.button === 1) {
                e.preventDefault();
                const now = Date.now();
                if (now - this._lastMiddleClickTime < 300) {
                    // ダブルクリック → fitToScreen
                    if (this.renderEngine) {
                        this.renderEngine.fitToScreen();
                        this.requestUpdate(false);
                        console.log('[AppController] Middle button double-click → fitToScreen');
                    }
                }
                this._lastMiddleClickTime = now;
                return;
            }

            if (this.renderEngine.isSpacePressed) return;

            // [V06] Solid Source Adjustment: Ignore All Clicks on Canvas
            if (this.isSolidSourceAdjusting) {
                return;
            }

            if (this.isMatteEditing) {
                if (e.button !== 0) return;
                this.isDraggingMatte = true;
                const pos = getImgPos(e);
                this.matteStart = pos;
                this.renderEngine.setMatteRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
                return;
            }

            // Trash/Solid: Lasso start
            if (this.currentMode === 'trash' || this.currentMode === 'solid') {
                if (this.renderEngine.isComparisonMode && !this.isZKeyPressed) return;
                if (this.isTrashAlignMode || this.isMatteEditing) return;
                if (this.isSolidCustomMoving) return;
                if (this.lassoTool.isDrawing) return;
                if (e.button === 0 || e.button === 2) {
                    let isErase;
                    if (this.currentMode === 'solid') {
                        // ソリッドモード: 左=塗りつぶし(追加), 右=取消し(削除)
                        isErase = (e.button === 2);
                    } else {
                        // ゴミ取りモード: 左=マスク(削る), 右=復活
                        isErase = (e.button === 0);
                    }
                    const pos = getImgPos(e);
                    this.lassoTool.start(pos.x, pos.y, isErase, this.currentMode, e.altKey);
                }
            }
        });

        // --- Matte Rect + Lasso: mousemove ---
        window.addEventListener('mousemove', (e) => {
            const pos = getImgPos(e);

            // --- Debug Panel Update (Solid Mode Only) ---
            const dbgPanel = document.getElementById('debug-panel');
            if (this.currentMode === 'solid' && this.solidExtEnabled && this.processor?.wasm && this.processor?.width > 0) {
                if (dbgPanel) {
                    dbgPanel.style.display = 'block';
                    dbgPanel.style.left = (e.clientX + 10) + 'px';
                    dbgPanel.style.top = (e.clientY + 20) + 'px';
                    dbgPanel.style.bottom = 'auto';
                    dbgPanel.style.right = 'auto';
                    dbgPanel.style.margin = '0';
                }

                const imgX = Math.floor(pos.x);
                const imgY = Math.floor(pos.y);
                const w = this.processor.width;
                const h = this.processor.height;

                const elX = document.getElementById('dbg-x');
                const elY = document.getElementById('dbg-y');
                const elSoft = document.getElementById('dbg-soft');

                if (elX) elX.textContent = imgX;
                if (elY) elY.textContent = imgY;

                if (imgX >= 0 && imgX < w && imgY >= 0 && imgY < h) {
                    const pi = imgY * w + imgX;
                    const ri = pi * 4;
                    const wasm = this.processor.wasm;
                    const memory = new Uint8Array(wasm.memory.buffer);

                    try {
                        // Soft Mat (RGBA)
                        const softPtr = wasm.get_soft_mat_buffer_ptr();
                        if (softPtr) {
                            const val = memory[softPtr + ri + 3];
                            if (elSoft) elSoft.textContent = val;
                            this.currentSmValue = val;
                        }
                    } catch (err) {
                        console.warn("Debug panel read error:", err);
                    }
                } else {
                    if (elSoft) elSoft.textContent = '-';
                    this.currentSmValue = undefined;
                }
            } else {
                if (dbgPanel) dbgPanel.style.display = 'none';
                this.currentSmValue = undefined;
            }

            // [V06] Solid Source Adjustment: Ignore mouse move (prevent lasso)
            if (this.isSolidSourceAdjusting) {
                return;
            }

            // Lasso move
            if ((this.currentMode === 'trash' || this.currentMode === 'solid') &&
                this.lassoTool && this.lassoTool.isDrawing) {
                this.lassoTool.move(pos.x, pos.y, e.altKey);
                return;
            }

            // Matte rect drag
            if (this.isDraggingMatte && this.matteStart) {
                const w = pos.x - this.matteStart.x;
                const h = pos.y - this.matteStart.y;
                this.renderEngine.setMatteRect({ x: this.matteStart.x, y: this.matteStart.y, w, h });
                return;
            }

            // Cursor update
            this.renderEngine.updateCursor(0, 0, 0, false);
        });

        // --- Matte Rect + Lasso: mouseup ---
        const endInteraction = (e) => {
            this.isDraggingMatte = false;

            // Lasso end check
            if ((this.currentMode === 'trash' || this.currentMode === 'solid') &&
                this.lassoTool && this.lassoTool.isDrawing) {
                const pos = getImgPos(e);
                const finished = this.lassoTool.up(pos.x, pos.y, e.altKey);
                this.requestUpdate(false);
                if (finished) {
                    console.log('[Lasso] Finished. Mode:', this.currentMode);
                    this._bufferState = 'partial'; // 投げ縄で不透明度が変わったため partial
                    if (this.currentMode === 'solid') this.requestUpdate(true);
                }
            }
        };
        window.addEventListener('mouseup', endInteraction);

        // [s] shortcut for Solid AA Threshold
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 's' && this.currentMode === 'solid' && this.solidExtEnabled && this.currentSmValue !== undefined) {
                const aaThresInput = document.getElementById('rng-aa-thres');
                const aaThresVal = document.getElementById('val-aa-thres');
                if (aaThresInput) {
                    aaThresInput.value = this.currentSmValue;
                    if (aaThresVal) aaThresVal.textContent = this.currentSmValue;
                    this.processor.updateParams('solidAaThres', parseInt(this.currentSmValue));
                    // Note: Intentionally NOT triggering this.requestUpdate(true) here
                    // to prevent filling over existing bad fills. User will shoot again manually.
                }
            }
        });

        // Alt Release to Finalize Polygon Mode
        window.addEventListener('keyup', (e) => {
            if (e.key === 'Alt') {
                if ((this.currentMode === 'trash' || this.currentMode === 'solid') &&
                    this.lassoTool && this.lassoTool.isDrawing && this.lassoTool.isPolygonMode) {
                    console.log('[Lasso] Alt Released -> Finalize');
                    this.lassoTool.end();
                    this._bufferState = 'partial';
                    this.requestUpdate(true);
                }
            }
        });

        c.addEventListener('mouseleave', () => {
            endInteraction(new MouseEvent('mouseup'));
            this.renderEngine.updateCursor(0, 0, 0, false);
        });

        // Ctrl+Z Undo
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault();
                if (typeof this.processor.popUndoState === 'function') {
                    const restoredMode = this.processor.popUndoState();
                    this._bufferState = 'partial'; // Undoで画像が戻ったので partial
                    if (restoredMode === 'trash') {
                        this.requestUpdate(true);
                    } else if (restoredMode === 'solid') {
                        this.updateMainView();
                    }
                }
            }
        });

        // Right-click prevention
        c.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // --- Matte Rect → Margin Values ---
    applyMatteFromRect(rect) {
        if (!this.processor.hasImages()) return;
        const imgW = this.processor.width;
        const imgH = this.processor.height;
        let x = rect.x; let y = rect.y; let w = rect.w; let h = rect.h;
        if (w < 0) { x += w; w = -w; }
        if (h < 0) { y += h; h = -h; }
        x = Math.max(0, Math.min(imgW, x));
        y = Math.max(0, Math.min(imgH, y));
        w = Math.min(w, imgW - x);
        h = Math.min(h, imgH - y);
        const t = Math.floor(y);
        const l = Math.floor(x);
        const b = Math.floor(imgH - (y + h));
        const r = Math.floor(imgW - (x + w));
        this.processor.updateGarbageMatte('t', t);
        this.processor.updateGarbageMatte('b', b);
        this.processor.updateGarbageMatte('l', l);
        this.processor.updateGarbageMatte('r', r);
        this.updateMatteInputs();
        this.renderEngine.setGarbageMatte(this.processor.garbageMatte);
        this._bufferState = 'partial'; // マット移動後の再計算は部分的で開始する
        this.requestUpdate(false);
    }

    setCanvasBackground(type, colorVal = null) {
        if (!this.renderEngine?.canvas) return;

        console.log(`[AppController / Log] >>> CALL: setCanvasBackground(Type: ${type}, Color: ${colorVal})`);
        this.canvasBackground.type = type;
        if (colorVal) this.canvasBackground.color = colorVal;

        const s = this.renderEngine.canvas.style;
        const color = this.canvasBackground.color;

        if (type === 'checker') {
            s.backgroundColor = '';
            this.renderEngine.canvas.classList.remove('bg-solid');
            console.log(`[AppController / Log]-- - Background: Checkerboard enabled`);
        } else {
            s.backgroundColor = color;
            this.renderEngine.canvas.classList.add('bg-solid');
            console.log(`[AppController / Log]-- - Background: Solid color(${color}) enabled`);
        }

        // --- 全ピッカー・チェックボックスの同期 ---
        const pickers = document.querySelectorAll('.bg-common-color-picker');
        pickers.forEach(p => {
            if (color) p.value = color;
            p.disabled = false; // Always enabled to allow click-to-switch
        });

        const chks = ['chk-bg-basic-color', 'chk-bg-trash-color', 'chk-bg-solid-color'];
        chks.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.checked = (type === 'color');
        });

        this.renderEngine.requestRender();
    }

    handleExportBasic() {
        // エクスポート前にゴミ取り結果を確定させ、最新のストレートRGBを構築する
        if (this.processor.hasImages() && this.hasEnteredTrash) {
            this.processor.finalizeTrashMode();
        }

        const bgColor = (this.canvasBackground.type === 'color') ? this.canvasBackground.color : null;
        const result = this.processor.processExport('basic', bgColor, this.baseFileName || 'image');
        if (result) {
            this.downloadImage(result.data, result.filename);
        }

        // エクスポート完了後（WASMメモリ拡張後）にプレビューを再取得して再描画
        // この時、WASM側での再計算をスキップして、確定済みのバッファをそのまま表示する
        this.updateMainView(true);
    }

    handleExportTrash() {
        // エクスポート前に画面外（ビューポート外）も含めた全域のバッファをフルリフレッシュする
        if (this.processor.hasImages()) {
            this.processor.finalizeTrashMode();
        }

        // Determine mode based on Alpha Type setting (Hard or Soft)
        // Note: trashOverlay is view-only, export depends on the underlying mode.
        const mode = (this.typesOfAlpha === 'soft') ? 'trash_alpha' : 'trash_hard';
        const bgColor = (this.canvasBackground.type === 'color') ? this.canvasBackground.color : null;

        const result = this.processor.processExport(mode, bgColor, this.baseFileName || 'image');
        if (result) {
            this.downloadImage(result.data, result.filename);
        }

        // エクスポート完了後（WASMメモリ拡張後）にプレビューを再取得して再描画
        this.updateMainView(true);
    }

    handleExportSolid() {
        const bgColor = (this.canvasBackground.type === 'color') ? this.canvasBackground.color : null;
        // Solid mode always exports "Solid Integrated" view
        const result = this.processor.processExport('solid', bgColor, this.baseFileName || 'image');
        if (result) {
            this.downloadImage(result.data, result.filename);
        }

        // エクスポート完了後（WASMメモリ拡張後）にプレビューを再取得して再描画
        this.updateMainView(true);
    }

    downloadImage(uint8Data, filename) {
        const canvas = document.createElement('canvas');
        canvas.width = this.processor.width;
        canvas.height = this.processor.height;
        const ctx = canvas.getContext('2d');
        const img = new ImageData(new Uint8ClampedArray(uint8Data), canvas.width, canvas.height);
        ctx.putImageData(img, 0, 0);
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = filename;
        link.click();
    }

    updateOffsetDisplay() {
        // DOM 要素を初回のみ検索してキャッシュ
        if (!this._offsetEls) {
            this._offsetEls = {
                ox: document.getElementById('val-offset-x'),
                oy: document.getElementById('val-offset-y'),
                oxT: document.getElementById('val-offset-x-trash'),
                oyT: document.getElementById('val-offset-y-trash'),
            };
        }
        const e = this._offsetEls;

        // Trash/Basic Offset
        if (this.processor?.offset) {
            const vx = -this.processor.offset.x;
            const vy = -this.processor.offset.y;
            if (e.ox) e.ox.textContent = vx;
            if (e.oy) e.oy.textContent = vy;
            if (e.oxT) e.oxT.textContent = vx;
            if (e.oyT) e.oyT.textContent = vy;
        }
    }
    // [V06] Solid Source Adjustment Control
    startSolidSourceAdjustment() {
        this.isSolidSourceAdjusting = true;
        this.setAdjustmentUIState(true);

        // Show Solid Tab
        const solidTab = document.querySelector('.tab-btn[data-target="panel-solid"]');
        if (solidTab) solidTab.click();

        const btn = document.getElementById('drop-zone-solid-source');
        if (btn) {
            btn.classList.add('adjust-mode');
            // Click to Commit instead of Open File
            btn.onclick = (e) => {
                e.stopPropagation(); // Prevent bubbling if needed
                this.endSolidSourceAdjustment(true);
            };
        }

        // Lock UI (Trash Mode Style: Full Blocker)
        const blocker = document.getElementById('ui-blocker');
        if (blocker) blocker.style.display = 'block';

        // Ensure Viewport & Button are above blocker
        const vp = document.getElementById('viewport-container');
        if (vp) {
            vp.style.position = 'relative';
            vp.style.zIndex = '10001';
        }

        // Set RenderEngine Layer
        // Initialize solidSourceOffset if not already
        if (!this.solidSourceOffset) {
            this.solidSourceOffset = { x: 0, y: 0 };
        }
        if (this.processor.solidSourceBmp) {
            this.renderEngine.setSolidSourceLayer(
                this.processor.solidSourceBmp,
                this.solidSourceOffset.x,
                this.solidSourceOffset.y
            );
        }

        const msgEl = document.getElementById('auto-align-msg');
        if (msgEl) {
            // Updated Message Logic: Just use the button's internal message
            // or trash-style message if needed. 
            // Current drop-zone has .adjust-message inside it.
            // Let's rely on CSS .adjust-mode to show it.
        }

        // Lock Lasso etc. by flag check in bindCanvasEvents

        // Update View
        this.processor.process('solid_source_preview');
        this.updateMainView();
    }

    endSolidSourceAdjustment(commit) {
        if (!this.isSolidSourceAdjusting) return;
        this.isSolidSourceAdjusting = false;
        this.setAdjustmentUIState(false);

        const btn = document.getElementById('drop-zone-solid-source');
        if (btn) {
            btn.classList.remove('adjust-mode');
            // Restore File Input Click
            btn.onclick = () => {
                const input = document.getElementById('file-solid-source');
                if (input) input.click();
            };
        }

        const blocker = document.getElementById('ui-blocker');
        if (blocker) blocker.style.display = 'none';

        const vp = document.getElementById('viewport-container');
        if (vp) {
            vp.style.zIndex = '';
            vp.style.position = '';
        }

        this.renderEngine.setSolidSourceLayer(null);

        if (commit) {
            console.log('[AppController] Committing Solid Source...');
            this.processor.commitSolidSourceTemp();
        } else {
            console.log('[AppController] Cancelled Solid Source Adjustment');
        }

        // Restore View
        this.processor.process('solid_preview');
        this.updateMainView();
    }

    // --- UI Lock for V2 Processing ---
    setUILock(isLocked) {
        const lockEl = document.getElementById('global-ui-lock');
        if (lockEl) {
            lockEl.style.display = isLocked ? 'block' : 'none';
        }
    }

    // --- No Image Guardrail Overlay ---
    updateNoImageLock(isLocked = null) {
        const pOverlay = document.getElementById('no-image-panel-overlay');
        const cOverlay = document.getElementById('no-image-canvas-overlay');
        const content = document.querySelector('.controls-content');
        const viewport = document.getElementById('viewport-container');

        let shouldLock = isLocked;
        if (shouldLock === null) {
            shouldLock = !this.processor.hasImages() && this.currentMode !== 'basic';
        }

        if (shouldLock) {
            if (pOverlay) {
                if (content && pOverlay.parentElement !== content) content.appendChild(pOverlay);
                pOverlay.style.display = 'block';
            }
            if (cOverlay) {
                if (viewport && cOverlay.parentElement !== viewport) viewport.appendChild(cOverlay);
                cOverlay.style.display = 'flex';
            }
        } else {
            if (pOverlay) pOverlay.style.display = 'none';
            if (cOverlay) cOverlay.style.display = 'none';
        }
    }

    // --- Toggle Tooltip Help Implementation ---
    toggleHelpMode() {
        this.isHelpActive = !this.isHelpActive;
        document.body.classList.toggle('help-active', this.isHelpActive);

        // Synchronize button active state
        document.querySelectorAll('.btn-help').forEach(btn => {
            btn.classList.toggle('active', this.isHelpActive);
        });

        console.log(`[AppController] Help Mode active: ${this.isHelpActive}`);

        // ヘルプが有効になった際に内容を更新
        if (this.isHelpActive) {
            this.updatePreviewHelp();
        }
    }

    /**
     * プレビュー画面左上の操作ヒント（チップ）を更新
     */
    updatePreviewHelp() {
        const boxTopLeft = document.getElementById('help-box-top-left');
        const boxBottomLeft = document.getElementById('help-box-bottom-left');
        const boxTopRight = document.getElementById('help-box-top-right');
        const boxSamples = document.getElementById('help-box-samples');

        if (!boxTopLeft || !boxBottomLeft || !boxTopRight || !boxSamples) return;

        // コンテンツのリセット
        boxTopLeft.innerHTML = '';
        boxBottomLeft.innerHTML = '';
        boxTopRight.innerHTML = '';
        boxSamples.innerHTML = '';
        boxSamples.style.display = 'none';

        const mode = this.currentMode; // 'basic', 'trash', 'solid'

        // 右上（ツール紹介）は基本モードのみ
        if (mode === 'basic') {
            boxTopRight.innerHTML = t('help.bento.intro.title') + t('help.bento.intro.desc');
            boxTopLeft.innerHTML = t('help.bento.basic.steps.title') + t('help.bento.basic.steps.desc');
            // サンプル画像セクションを独立した枠に表示
            boxSamples.innerHTML = t('help.bento.basic.samples.title') + t('help.bento.basic.samples.desc');
            boxSamples.style.display = 'block';
        } else if (mode === 'trash') {
            boxTopLeft.innerHTML = t('help.bento.trash.intro.title') + t('help.bento.trash.intro.desc');
        } else if (mode === 'solid') {
            boxTopLeft.innerHTML = t('help.bento.solid.intro.title') + t('help.bento.solid.intro.desc');
        }

        // 左下（キー・マウス操作一覧）
        boxBottomLeft.innerHTML = t(`help.bento.${mode}.keys.title`) + t(`help.bento.${mode}.keys.desc`);
    }

    showHelp(mode) {
        // [legacy]
        console.log(`[AppController] showHelp(legacy) trigger: ${mode}`);
        if (this.isHelpActive) this.updatePreviewHelp();
    }

    hideHelp() {
        // [legacy]
        console.log(`[AppController] hideHelp(legacy)`);
    }

    // --- App Reset Logic ---
    handleAppReset() {
        console.log('[AppController] Executing Full App Reset...');

        // 【指示通り】リセット時にヘルプモードをOFFにする
        if (this.isHelpActive) {
            this.toggleHelpMode();
        }

        // 1. 各モードのリセットボタンのクリックイベントをシミュレート発火
        document.getElementById('btn-reset-trash')?.click();
        document.getElementById('btn-reset-solid')?.click();

        // 2. 各モードの初回進入フラグをリセット
        this.hasEnteredTrash = false;
        this.hasEnteredSolid = false;

        // 3. 基本モード固有の初期化（画像消去・UI・ロジック）
        // メモリ解放と画像データの完全破棄
        this.processor.clearSolidAppliedFlag(); // WASM側の適用フラグを初期化
        if (this.processor.blackBitmap) { this.processor.blackBitmap.close(); this.processor.blackBitmap = null; }
        if (this.processor.whiteBitmap) { this.processor.whiteBitmap.close(); this.processor.whiteBitmap = null; }
        if (this.processor.inputBlackSource) { this.processor.inputBlackSource = null; }
        if (this.processor.solidSourceBmp) { this.processor.solidSourceBmp.close(); this.processor.solidSourceBmp = null; }
        this.processor.width = 0;
        this.processor.height = 0;

        // オフセットとUndo履歴の消去
        this.processor.undoStack = [];
        this.processor.offset = { x: 0, y: 0 };
        this.processor.autoOffset = { x: 0, y: 0 };

        // btn-reset-trashで戻しきれないUI部分の0クリア
        document.getElementById('val-offset-x').textContent = '0';
        document.getElementById('val-offset-y').textContent = '0';
        document.getElementById('val-offset-x-trash').textContent = '0';
        document.getElementById('val-offset-y-trash').textContent = '0';

        // プレビューサムネ等のUIリセット
        document.querySelectorAll('.preview-thumb').forEach(el => el.style.backgroundImage = 'none');
        document.querySelectorAll('.drop-zone').forEach(el => el.classList.remove('has-image'));
        document.getElementById('file-black').value = '';
        document.getElementById('file-white').value = '';
        document.getElementById('label-dim')?.remove();

        const selLogic = document.getElementById('sel-calc-mode');
        if (selLogic) selLogic.value = 'avg';

        // キャンバスのクリア（※ズーム異常防止のため手動で1.0セット）
        const emptyData = new ImageData(1, 1);
        this.renderEngine.setImage(emptyData, false);
        this.renderEngine.scale = 1.0;
        this.renderEngine.pan = { x: 0, y: 0 };
        // 背景の確実なリセット
        this.resetBackgroundSettings();

        this.renderEngine.requestRender();

        console.log('[AppController] Reset Complete.');
    }

    /**
     * 全モード共通の背景リセット処理
     */
    resetBackgroundSettings() {
        this.setCanvasBackground('checker', '#000000');
    }
}