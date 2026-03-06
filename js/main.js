import { AppController } from './AppController.js';
import { ImageProcessor } from './ImageProcessor.js';
import { RenderEngine } from './RenderEngine.js';
import { applyAll as applyI18n, setLang, getCurrentLang, t } from './i18n.js';
import { AuthManager } from './AuthManager.js';
import { Dialog } from './Dialog.js';

// --- WASM & Initialization ---
import init, { init_rust } from '../pkg/rcore.js';

// DOM読み込み完了後に起動
document.addEventListener('DOMContentLoaded', async () => {
    console.log('=== Aaron Alpha v2.0 Starting ===');

    // 1. Initialize WASM
    // (Note: In a pure module setup without bundler, this might need dynamic import or path adjustment if pkg is not at relative root)
    // Assuming standard correct path relative to js/main.js -> ../pkg/rcore.js
    await init();
    init_rust();

    // 2. Initialize Auth Manager
    const authManager = new AuthManager();

    // 0. Apply i18n translations
    applyI18n();

    // 3. 各モジュールのインスタンス化
    const renderEngine = new RenderEngine('main-canvas');
    const imageProcessor = new ImageProcessor();
    await imageProcessor.init();

    // 4. 依存関係の注入 (Controllerは両方を知っている必要がある)
    const app = new AppController(imageProcessor, renderEngine);

    // Expose for debugging or cross-module access
    window.aaronAlpha = {
        app,
        authManager
    };

    // 5. Start Auth Flow
    // We do this after app init so UI is ready if we need it
    authManager.setOnAuthChange((isAuth) => {
        if (app) app.updateAuthUI(isAuth);
    });
    await authManager.init();

    // 6. Settings Modal
    const btnSettings = document.getElementById('btn-settings');
    const settingsModal = document.getElementById('settings-modal');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const selLanguage = document.getElementById('sel-language');

    // Set dropdown to current language
    if (selLanguage) selLanguage.value = getCurrentLang();

    if (btnSettings) btnSettings.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
        // Populate key input if available
        const inpKey = document.getElementById('inp-auth-key');
        if (inpKey) {
            inpKey.value = localStorage.getItem('aaronAlpha_auth_key') || '';
        }
    });

    // Save Auth Key Button
    const btnSaveKey = document.getElementById('btn-save-auth-key');
    if (btnSaveKey) {
        btnSaveKey.addEventListener('click', () => {
            const inpKey = document.getElementById('inp-auth-key');
            if (inpKey) {
                const key = inpKey.value.trim();
                // updateKey internally calls login and alerts/notifies
                if (authManager.updateKey(key)) {
                    settingsModal.style.display = 'none';
                }
            }
        });
    }

    // Reset Settings Button
    const btnResetSettings = document.getElementById('btn-reset-settings');
    if (btnResetSettings) {
        btnResetSettings.addEventListener('click', async () => {
            if (await Dialog.confirm(t('alert.resetSettingsConfirm'))) {
                app.resetSettings();
                location.reload();
            }
        });
    }

    if (btnCloseSettings) btnCloseSettings.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });
    // Click outside to close
    if (settingsModal) settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.style.display = 'none';
    });
    if (selLanguage) selLanguage.addEventListener('change', () => {
        setLang(selLanguage.value);
        // Also update dynamic texts in AppController
        app.refreshI18nTexts();
    });

    // Speed Priority Checkbox
    const chkSpeed = document.getElementById('chk-speed-priority');
    if (chkSpeed) {
        chkSpeed.addEventListener('change', () => {
            app.speedPriority = chkSpeed.checked;
            localStorage.setItem('aaronAlpha_speedPriority', chkSpeed.checked);
        });
    }

    // Undo Limit
    const inpUndoLimit = document.getElementById('inp-undo-limit');
    if (inpUndoLimit) {
        inpUndoLimit.value = localStorage.getItem('aaronAlpha_undoLimit') || '3';
        inpUndoLimit.addEventListener('change', () => {
            let val = parseInt(inpUndoLimit.value);
            if (isNaN(val) || val < 3) val = 3;
            if (val > 10) val = 10;
            inpUndoLimit.value = val;
            localStorage.setItem('aaronAlpha_undoLimit', val);
            imageProcessor.setUndoLimit(val);
        });
    }

    // Reset Auth Button
    const btnResetAuth = document.getElementById('btn-reset-auth');
    if (btnResetAuth) {
        btnResetAuth.addEventListener('click', async () => {
            if (await Dialog.confirm(t('auth.confirmReset'))) {
                authManager.logout();
                location.reload();
            }
        });
    }

    // 4. ウィンドウリサイズ対応 (キャンバスサイズ調整)
    const resizeCanvas = () => {
        const wrapper = document.querySelector('.canvas-wrapper');
        if (wrapper) {
            renderEngine.resize(wrapper.clientWidth, wrapper.clientHeight);
        }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // 初回実行
});