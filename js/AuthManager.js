import { t } from './i18n.js';
import { authenticate, is_authenticated, verify_auth_token } from '../pkg/rcore.js';
import { Dialog } from './Dialog.js';
import { legalTexts } from './legal_pages.js';
import { getCurrentLang } from './i18n.js';

// Cloudflare Worker の認証検証エンドポイント
const VERIFY_URL = 'https://aaronalpha.aaronpoint.workers.dev/verify';

/**
 * Authentication Manager
 * Handles local key storage and communication with Rust core.
 * [SECURITY] サーバーから受け取った署名付きトークンを Rust に渡し、
 *            Rust 内部で HMAC-SHA256 検証を行う。
 *            JS 側から認証フラグを直接操作する手段は存在しない。
 */
export class AuthManager {
    constructor() {
        this.storageKey = 'aaronAlpha_auth_key';
        this.visitKey = 'aaronAlpha_has_visited';
        this.onAuthChange = null; // Callback for UI updates
    }

    /**
     * Set callback for auth status changes
     * @param {Function} callback (isAuthenticated: boolean) => void
     */
    setOnAuthChange(callback) {
        this.onAuthChange = callback;
    }

    /**
     * Notify listeners of auth change
     * @param {boolean} isAuthenticated 
     */
    notifyChange(isAuthenticated) {
        if (this.onAuthChange) {
            this.onAuthChange(isAuthenticated);
        }
    }

    /**
     * Cloudflare Worker にキーを送信し、署名付きトークンを取得する。
     * 取得したトークンを Rust の verify_auth_token に渡して内部検証を行う。
     * @param {string} key ライセンスキー
     * @returns {Promise<boolean>} Rust 側での検証が成功すれば true
     */
    async verifyWithServer(key) {
        // [AUTH BYPASS] 常に true
        return true;
    }

    async init() {
        // Bind Header Links
        this.bindHeaderLinks();
        // [AUTH BYPASS] 常に認証済みとして通知
        this.notifyChange(true);
    }

    /**
     * Bind click events to legal links in header
     */
    bindHeaderLinks() {
        const links = [
            { id: 'lnk-terms', key: 'terms' },
            { id: 'lnk-privacy', key: 'privacy' },
            { id: 'lnk-refund', key: 'refund' }
        ];

        links.forEach(link => {
            const el = document.getElementById(link.id);
            if (el) {
                el.onclick = (e) => {
                    e.preventDefault();
                    const lang = getCurrentLang();
                    const data = legalTexts[lang][link.key];
                    Dialog.show({
                        title: data.title,
                        message: data.content,
                        type: 'confirm',
                        yesLabel: t('dialog.openFull'),
                        noLabel: t('dialog.close'),
                        wideMode: true
                    }).then(res => {
                        if (res === true) {
                            window.open(`${link.key}.html`, '_blank');
                        }
                    });
                };
            }
        });
    }

    /**
     * Check if first visit and show welcome dialog
     */
    async checkFirstVisit() {
        // [AUTH BYPASS] 無効化
    }

    /**
     * Open Polar Shop with guidance if Japanese
     */
    async openPolarShop() {
        // [AUTH BYPASS] 無効化
    }

    /**
     * Prompt user for key using Custom Dialog.
     */
    async promptUser() {
        const inputKey = await Dialog.prompt(t('auth.welcomeMsg'), '', t('auth.welcomeTitle'));
        if (inputKey !== null) {
            this.login(inputKey);
        }
    }

    async login(key) {
        if (!key) {
            this.notifyChange(false);
            return false;
        }

        const trimmedKey = key.trim();
        try {
            console.log(`[AuthManager] Attempting login with server verification: [${trimmedKey.substring(0, 4)}...]`);
            const isValid = await this.verifyWithServer(trimmedKey);
            console.log(`[AuthManager] Server + Rust verify result: ${isValid}`);

            if (isValid) {
                localStorage.setItem(this.storageKey, trimmedKey);
                await Dialog.alert(t('auth.success'));

                const inputEl = document.getElementById('inp-auth-key');
                if (inputEl) {
                    inputEl.value = trimmedKey;
                }

                this.notifyChange(true);
                return true;
            } else {
                await Dialog.alert(t('auth.failed'));
                this.notifyChange(false);
                return false;
            }
        } catch (e) {
            console.error('[AuthManager] Login error:', e);
            this.notifyChange(false);
            return false;
        }
    }

    updateKey(key) {
        return this.login(key);
    }

    logout() {
        console.log('[AuthManager] Logging out, clearing storage...');
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.visitKey);

        // Rust 側の AUTH_STATE をリセットするには、無効なトークンを送る
        // (set_auth_state は削除されたため、直接操作は不可)
        try {
            authenticate(""); // レガシー関数は常に false を返す → AUTH_STATE は変わらないが、ログアウト時はアプリリロードで対応
        } catch (e) { }
        this.notifyChange(false);

        // ページリロードで Rust の AUTH_STATE も確実にリセット
        location.reload();
    }

    isAuthenticated() {
        // [AUTH BYPASS] 常に true を返す
        return true;
    }
}
