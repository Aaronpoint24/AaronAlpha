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
        try {
            console.log('[AuthManager] Verifying key with Cloudflare Worker...');
            const res = await fetch(VERIFY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });
            if (res.ok) {
                const data = await res.json();
                console.log('[AuthManager] Server response received.');

                if (data.valid === true && data.token) {
                    // [SECURITY] トークンを Rust 側に渡して署名検証
                    console.log('[AuthManager] Received signed token, passing to Rust for verification...');
                    const rustResult = verify_auth_token(data.token);
                    console.log(`[AuthManager] Rust verify_auth_token result: ${rustResult}`);
                    return rustResult;
                } else {
                    console.warn('[AuthManager] Server rejected key (valid=false or no token).');
                    return false;
                }
            } else {
                console.warn(`[AuthManager] Server returned status ${res.status}`);
                return false;
            }
        } catch (e) {
            console.error('[AuthManager] Network error during verification:', e);
            // ネットワークエラー時は認証失敗とする（フォールバックなし）
            console.warn('[AuthManager] Network error - authentication denied for security.');
            return false;
        }
    }

    async init() {
        const storedKey = localStorage.getItem(this.storageKey);

        // Bind Header Links
        this.bindHeaderLinks();

        if (storedKey) {
            console.log('[AuthManager] Found stored key, verifying with server...');
            try {
                const isValid = await this.verifyWithServer(storedKey);
                if (isValid) {
                    console.log('[AuthManager] Auto-authentication successful (server + Rust verified).');
                    this.notifyChange(true);
                } else {
                    console.warn('[AuthManager] Stored key is invalid (server/Rust rejected).');
                    this.notifyChange(false);
                    this.checkFirstVisit();
                }
            } catch (e) {
                console.error('[AuthManager] Error during init verification:', e);
                this.notifyChange(false);
            }
        } else {
            console.log('[AuthManager] No stored key found.');
            this.notifyChange(false);
            this.checkFirstVisit();
        }
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
        const hasVisited = localStorage.getItem(this.visitKey);
        if (!hasVisited) {
            localStorage.setItem(this.visitKey, 'true');

            // Show welcome dialog with 2 buttons
            const res = await Dialog.show({
                title: t('auth.welcomeTitle'),
                message: t('auth.welcomeMsg'),
                type: 'confirm',
                yesLabel: t('auth.btnGoAuth'),
                noLabel: t('auth.btnTry')
            });

            if (res === true) {
                // "Go to Auth" -> Open settings
                const btnSettings = document.getElementById('btn-settings');
                if (btnSettings) btnSettings.click();

                const inpKey = document.getElementById('inp-auth-key');
                if (inpKey) {
                    setTimeout(() => inpKey.focus(), 300);
                }
            } else {
                // "Try it out" -> Do nothing, stay on basic
                console.log('[AuthManager] User chose to try out first.');
            }
        }
    }

    /**
     * Open Polar Shop with guidance if Japanese
     */
    async openPolarShop() {
        const lang = getCurrentLang();
        if (lang === 'ja') {
            const confirmed = await Dialog.confirm(
                "決済システム（Polar.sh）は英語表記となっています。\n決済手順の解説画像を表示しますか？",
                "Polar.sh 決済のご案内"
            );
            if (confirmed) {
                // Show guide image
                await Dialog.show({
                    title: "Polar.sh 決済手順",
                    message: "1. 決済ページでメールアドレスを入力\n2. カード情報を入力\n3. 完了後に表示（またはメール）されるキーをコピーしてください。\n\n※この後ショップページを開きます。",
                    imagePath: "image/polar_sh_guide_jp.png",
                    type: 'alert',
                    wideMode: true
                });
            }
        }

        // Open shop in new tab
        window.open('https://polar.sh/Aaronpoint', '_blank');
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
        try {
            return is_authenticated();
        } catch (e) {
            return false;
        }
    }
}
