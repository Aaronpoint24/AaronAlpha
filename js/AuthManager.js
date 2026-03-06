import { t } from './i18n.js';
import { authenticate, is_authenticated, set_auth_state } from '../pkg/rcore.js';
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
        this.onAuthChange = null;
    }

    setOnAuthChange(callback) {
        this.onAuthChange = callback;
    }

    notifyChange(isAuthenticated) {
        if (this.onAuthChange) {
            this.onAuthChange(isAuthenticated);
        }
    }

    async init() {
        const storedKey = localStorage.getItem(this.storageKey);
        this.bindHeaderLinks();

        // 開発中のため、初期状態では未認証として扱う
        this.notifyChange(false);
    }

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

    async checkFirstVisit() {
        // 現在は無効化
    }

    /**
     * 認証発行ボタンの動作 (現在は無効)
     */
    async openPolarShop() {
        console.log('[AuthManager] Auth issuance is currently disabled.');
        // 何もしない
    }

    async promptUser() {
        // 現在は無効
    }

    async login(key) {
        // 開発中のため、現在は常に失敗または何もしない状態とする
        this.notifyChange(false);
        return false;
    }

    updateKey(key) {
        return this.login(key);
    }

    logout() {
        localStorage.removeItem(this.storageKey);
        try {
            set_auth_state(false);
        } catch (e) { }
        this.notifyChange(false);
    }

    isAuthenticated() {
        try {
            return is_authenticated();
        } catch (e) {
            return false;
        }
    }
}
