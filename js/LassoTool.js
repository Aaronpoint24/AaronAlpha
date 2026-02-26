/**
 * LassoTool.js
 * 投げ縄ツール (Trash Mode / Solid Mode 兼用)
 */
export class LassoTool {
    /**
     * @param {RenderEngine} renderEngine
     * @param {ImageProcessor} processor
     */
    constructor(renderEngine, processor) {
        this.renderEngine = renderEngine;
        this.processor = processor;

        this.points = [];          // {x, y}
        this.isDrawing = false;
        this.isSubtract = false;   // true = Erase (Right Click)
        this.isPolygonMode = false; // Alt key hold
        this.lastPoint = null;
        this.targetMode = 'trash';
    }

    /**
     * 描画開始
     * @param {number} x
     * @param {number} y
     * @param {boolean} isErase - 右クリックならtrue
     * @param {string} targetMode - 'trash' or 'solid'
     * @param {boolean} isAltDown - Altキー押下状態
     */
    start(x, y, isErase = false, targetMode = 'trash', isAltDown = false) {
        this.isDrawing = true;
        this.isSubtract = isErase;
        this.targetMode = targetMode;
        this.isPolygonMode = isAltDown; // Alt押下なら多角形モードで開始
        this.points = [{ x, y }];
        this.lastPoint = { x, y };
        console.log(`[LassoTool] start: Mode=${targetMode}, Erase=${isErase}, Alt=${isAltDown}`);
        this.updatePreview(null);
    }

    /**
     * 描画中
     * @param {number} x
     * @param {number} y
     * @param {boolean} isAltDown - Altキー押下状態
     */
    move(x, y, isAltDown) {
        if (!this.isDrawing) return;

        // Altが押されている間は「多角形モード」として直線プレビューのみ更新し、軌跡は追加しない
        if (isAltDown) {
            this.isPolygonMode = true;
            this.updatePreview({ x, y }); // 現在位置を仮の終点として表示
            return;
        }

        // Altが離されている場合
        // 直前が多角形モードだった場合、フリーハンドに戻る
        // ここでは単純に「距離が離れたら追加」
        const dist = Math.hypot(x - this.lastPoint.x, y - this.lastPoint.y);
        if (dist > 2) {
            this.points.push({ x, y });
            this.lastPoint = { x, y };
            this.updatePreview(null); // カーソルへの直線はなし
        }
    }

    /**
     * マウスアップ（確定 or 頂点追加）
     * @param {number} x
     * @param {number} y
     * @param {boolean} isAltDown
     * @returns {boolean} true=確定処理完了, false=継続
     */
    up(x, y, isAltDown) {
        if (!this.isDrawing) return false;

        if (isAltDown) {
            // 多角形モード：頂点確定（まだ終わらない）
            this.points.push({ x, y });
            this.lastPoint = { x, y };
            this.updatePreview({ x, y }); // カーソル位置への線は継続
            return false;
        }

        // Altなし：確定
        this.end();
        return true;
    }

    end() {
        if (!this.isDrawing) return;
        this.isDrawing = false;

        // プレビュー消去
        this.renderEngine.setLassoPath(null, null, null);

        if (this.points.length > 2) {
            console.log(`[LassoTool] end: Points=${this.points.length}, Mode=${this.targetMode}, IsSubtract=${this.isSubtract}`);

            // Value determination
            const value = 255;

            let useAA = false;
            // AA only for Solid Mode -> Now also for Trash Mode
            if (this.targetMode === 'solid') {
                const chkAA = document.getElementById('chk-tool-aa');
                useAA = chkAA ? chkAA.checked : true;
            } else if (this.targetMode === 'trash') {
                const chkAA = document.getElementById('chk-trash-aa');
                useAA = chkAA ? chkAA.checked : false;
            }

            console.log(`[LassoTool] Calling fillPolygon. useAA=${useAA}, isSubtract=${this.isSubtract}`);
            this.processor.fillPolygon(this.points, value, this.isSubtract, useAA, this.targetMode);
        }

        this.points = [];
        this.lastPoint = null;
    }

    cancel() {
        this.isDrawing = false;
        this.points = [];
        this.renderEngine.setLassoPath(null, null, null);
    }

    updatePreview(currentMousePos) {
        // 色: Add=赤(半透明), Subtract=青(半透明)
        const color = this.isSubtract ? 'rgba(0, 100, 255, 0.5)' : 'rgba(255, 50, 50, 0.5)';
        this.renderEngine.setLassoPath(this.points, color, currentMousePos);
    }
}
