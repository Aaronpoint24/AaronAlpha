import { t } from './i18n.js';

/**
 * Custom Dialog System for Aaron Alpha
 * Replaces standard alert, confirm, and prompt with themed UI.
 */
export class Dialog {
    static overlay = null;
    static titleEl = null;
    static bodyEl = null;
    static inputContainer = null;
    static inputEl = null;
    static btnOk = null;
    static btnCancel = null;
    static btnYes = null;
    static btnNo = null;

    static init() {
        this.overlay = document.getElementById('custom-dialog-overlay');
        this.titleEl = document.getElementById('dialog-title');
        this.bodyEl = document.getElementById('dialog-body');
        this.inputContainer = document.getElementById('dialog-input-container');
        this.inputEl = document.getElementById('dialog-input');

        this.btnOk = document.getElementById('dialog-btn-ok');
        this.btnCancel = document.getElementById('dialog-btn-cancel');
        this.btnYes = document.getElementById('dialog-btn-yes');
        this.btnNo = document.getElementById('dialog-btn-no');
    }

    static show(config) {
        if (!this.overlay) this.init();

        return new Promise((resolve) => {
            this.titleEl.textContent = config.title || 'Aaron Alpha';
            this.bodyEl.textContent = config.message || '';

            // Handle Input
            if (config.showInput) {
                this.inputContainer.style.display = 'block';
                this.inputEl.value = config.defaultValue || '';
                this.inputEl.placeholder = t('dialog.inputPlaceholder');
            } else {
                this.inputContainer.style.display = 'none';
            }

            // Button visibility
            this.btnOk.style.display = config.type === 'alert' || config.type === 'prompt' ? 'block' : 'none';
            this.btnCancel.style.display = config.type === 'prompt' ? 'block' : 'none';
            this.btnYes.style.display = config.type === 'confirm' ? 'block' : 'none';
            this.btnNo.style.display = config.type === 'confirm' || config.type === 'prompt' ? 'none' : 'none';
            // Simplified logic:
            if (config.type === 'confirm') {
                this.btnOk.style.display = 'none';
                this.btnCancel.style.display = 'none';
                this.btnYes.style.display = 'block';
                this.btnNo.style.display = 'block';
            } else if (config.type === 'prompt') {
                this.btnOk.style.display = 'block';
                this.btnCancel.style.display = 'block';
                this.btnYes.style.display = 'none';
                this.btnNo.style.display = 'none';
            } else {
                // Default Alert
                this.btnOk.style.display = 'block';
                this.btnCancel.style.display = 'none';
                this.btnYes.style.display = 'none';
                this.btnNo.style.display = 'none';
            }

            this.overlay.style.display = 'flex';

            const cleanup = () => {
                this.overlay.style.display = 'none';
                // Remove listeners to prevent memory leaks or double-firing
                this.btnOk.onclick = null;
                this.btnCancel.onclick = null;
                this.btnYes.onclick = null;
                this.btnNo.onclick = null;
            };

            this.btnOk.onclick = () => {
                const val = this.inputEl.value;
                cleanup();
                resolve(config.type === 'prompt' ? val : true);
            };
            this.btnCancel.onclick = () => {
                cleanup();
                resolve(config.type === 'prompt' ? null : false);
            };
            this.btnYes.onclick = () => {
                cleanup();
                resolve(true);
            };
            this.btnNo.onclick = () => {
                cleanup();
                resolve(false);
            };

            // Focus handle
            if (config.showInput) {
                setTimeout(() => this.inputEl.focus(), 50);
            } else {
                setTimeout(() => this.btnOk.focus() || this.btnYes.focus(), 50);
            }
        });
    }

    static async alert(message, title = 'Aaron Alpha') {
        return this.show({ type: 'alert', title, message });
    }

    static async confirm(message, title = 'Aaron Alpha') {
        return this.show({ type: 'confirm', title, message });
    }

    static async prompt(message, defaultValue = '', title = 'Aaron Alpha') {
        return this.show({ type: 'prompt', title, message, showInput: true, defaultValue });
    }
}
