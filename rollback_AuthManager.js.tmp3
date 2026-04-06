import { t } from './i18n.js';
import { authenticate, is_authenticated } from '../pkg/rcore.js';
import { Dialog } from './Dialog.js';

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
                    // Invalid key stored, maybe prompt again or let user fix in settings
                    // For now, prompt again to be friendly
                    this.promptUser();
                }
            } catch (e) {
                console.error('[AuthManager] Error calling Rust verify:', e);
                this.notifyChange(false);
            }
        } else {
            console.log('[AuthManager] No stored key found.');
            this.notifyChange(false);

            // Only prompt on first visit
            const hasVisited = localStorage.getItem(this.visitKey);
            if (!hasVisited) {
                localStorage.setItem(this.visitKey, 'true');
                this.promptUser();
            }
        }
    }

    /**
     * Prompt user for key using Custom Dialog.
     */
    async promptUser() {
        // Delay slightly to ensure UI is ready
        setTimeout(async () => {
            const currentAuth = this.isAuthenticated();
            if (currentAuth) {
                this.notifyChange(true);
                return;
            }

            const title = t('auth.welcomeTitle');
            const msg = t('auth.welcomeMsg');
            const inputKey = await Dialog.prompt(msg, '', title);

            if (inputKey !== null) {
                this.login(inputKey);
            } else {
                console.log('[AuthManager] Prompt cancelled by user.');
                this.notifyChange(false);
            }
        }, 800);
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
