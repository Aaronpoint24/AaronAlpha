import { t } from './i18n.js';
import { authenticate, is_authenticated } from '../pkg/rcore.js';
import { Dialog } from './Dialog.js';
import { legalTexts } from './legal_pages.js';
import { getCurrentLang } from './i18n.js';

/**
 * Authentication Manager
 * Handles local key storage and communication with Rust core.
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
     * Initialize authentication flow.
     * Checks if key exists in storage, if so, tries to authenticate.
     * If not, prompts user.
     */
    async init() {
        const storedKey = localStorage.getItem(this.storageKey);

        // Bind Header Links
        this.bindHeaderLinks();

        if (storedKey) {
            console.log('[AuthManager] Found stored key, attempting authentication...');
            try {
                const result = authenticate(storedKey);
                if (result) {
                    console.log('[AuthManager] Auto-authentication successful.');
                    this.notifyChange(true);
                } else {
                    console.warn('[AuthManager] Stored key is invalid.');
                    this.notifyChange(false);
                    // On error, we continue to show welcome if it's really the first time
                    this.checkFirstVisit();
                }
            } catch (e) {
                console.error('[AuthManager] Error calling Rust verify:', e);
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
     * (Kept for legacy or specific manual triggers)
     */
    async promptUser() {
        // ... (Already covered by checkFirstVisit and settings UI)
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
            console.log(`[AuthManager] Attempting login with key: [${trimmedKey}]`);
            const success = authenticate(trimmedKey);
            console.log(`[AuthManager] Rust authenticate result: ${success}`);

            if (success) {
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
        localStorage.removeItem(this.visitKey); // Reset visit status to allow re-prompt on refresh

        // Also call rust to reset state
        try {
            authenticate(""); // Force reset in Rust
        } catch (e) { }
        this.notifyChange(false);
    }

    isAuthenticated() {
        try {
            const res = is_authenticated();
            return res;
        } catch (e) {
            console.error('[AuthManager] Error calling Rust is_authenticated:', e);
            return false;
        }
    }
}
