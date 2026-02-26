/**
 * RenderEngine.js
 * 描画エンジン (Overlay 100% 表示対応)
 */
export class RenderEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.scale = 1.0;
        this.pan = { x: 0, y: 0 };
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };
        this.isSpacePressed = false;

        this.currentImage = null;
        this.overlayImage = null; // オーバーレイ画像
        this.garbageMatte = null;
        this.dragRect = null;
        this.cursor = { x: 0, y: 0, size: 0, visible: false };

        // Lasso Tool State
        this.lassoPath = null;    // Array of {x, y}
        this.lassoColor = null;   // string (rgba)
        this.lassoCursor = null;  // {x, y} for polygon preview

        // Comparison Mode State
        this.comparisonImage = null; // Before Image (Black Input)
        this.isComparisonMode = false;
        this.splitPosition = 0.5; // 0.0 to 1.0
        this.isDraggingSplitter = false;

        this.onViewChange = null; // コールバック: (scale, pan) => {}

        this.solidSourceLayer = null; // { image: ImageBitmap, x: 0, y: 0 }

        this.resize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.bindEvents();
    }

    setSolidSourceLayer(image, x, y) {
        if (!image) {
            this.solidSourceLayer = null;
        } else {
            this.solidSourceLayer = { image, x: x || 0, y: y || 0 };
        }
        this.requestRender();
    }

    setSolidSourceLayerPosition(x, y) {
        if (this.solidSourceLayer) {
            this.solidSourceLayer.x = x;
            this.solidSourceLayer.y = y;
            this.requestRender();
        }
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.requestRender();
    }

    setImage(image, resetView = true) {
        this.currentImage = image;
        if (resetView) this.fitToScreen();
        this.requestRender();
    }

    // オーバーレイ画像の設定
    setOverlay(image) {
        this.overlayImage = image;
        this.requestRender();
    }

    setGarbageMatte(matteInfo) {
        this.garbageMatte = matteInfo;
        this.requestRender();
    }

    setMatteRect(rect) {
        this.dragRect = rect;
        this.requestRender();
    }

    setComparisonImage(image) {
        this.comparisonImage = image;
        this.requestRender();
    }

    setComparisonMode(enabled) {
        console.log(`[RenderEngine/Log] Comparison Mode changed to: ${enabled}`);
        this.isComparisonMode = enabled;
        this.requestRender();
    }

    updateCursor(x, y, size, visible) {
        this.cursor = { x, y, size, visible };
        this.requestRender();
    }

    setLassoPath(points, color, currentMousePos) {
        this.lassoPath = points;
        this.lassoColor = color;
        this.lassoCursor = currentMousePos;
        this.requestRender();
    }

    fitToScreen() {
        if (!this.currentImage) return;
        const imgW = this.currentImage.width;
        const imgH = this.currentImage.height;
        const canW = this.canvas.width;
        const canH = this.canvas.height;

        console.log(`[RenderEngine/Log] FitToScreen: Img(${imgW}x${imgH}) into Can(${canW}x${canH})`);

        const scaleW = (canW / imgW);
        const scaleH = (canH / imgH);

        // Exact 100% fit (no margin)
        this.scale = Math.min(scaleW, scaleH);
        this.pan.x = (canW - imgW * this.scale) / 2;
        this.pan.y = (canH - imgH * this.scale) / 2;

        console.log(`[RenderEngine/Log] Result: Scale=${(this.scale * 100).toFixed(1)}%`);
    }

    /**
     * 現在のビューポート（画像座標系）を取得
     * @returns {{x: number, y: number, w: number, h: number}}
     */
    getViewPort() {
        if (!this.currentImage) return { x: 0, y: 0, w: 0, h: 0 };

        // 画面の (0,0) -> 画像座標
        const x1 = -this.pan.x / this.scale;
        const y1 = -this.pan.y / this.scale;

        // 画面の (w,h) -> 画像座標
        const x2 = (this.canvas.width - this.pan.x) / this.scale;
        const y2 = (this.canvas.height - this.pan.y) / this.scale;

        return {
            x: Math.floor(x1),
            y: Math.floor(y1),
            w: Math.ceil(x2 - x1),
            h: Math.ceil(y2 - y1)
        };
    }

    requestRender() {
        requestAnimationFrame(() => this.render());
    }

    setImageOffset(offset) {
        this.imageOffset = offset || { x: 0, y: 0 };
        this.requestRender();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Safety check: if comparison is on but no images, treat as off effectively (or render empty)
        if (!this.currentImage && !this.comparisonImage) return;

        const w = this.canvas.width;
        const h = this.canvas.height;
        const splitX = this.isComparisonMode ? w * this.splitPosition : 0;

        // --- 1. Left Side: Before Image (Comparison Mode Only) ---
        if (this.isComparisonMode && this.comparisonImage) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.rect(0, 0, splitX, h); // Clip Left (Screen Space)
            this.ctx.clip();

            // Apply Transform for Content (World Space)
            this.ctx.save();
            this.ctx.imageSmoothingEnabled = this.scale < 4.0;
            this.ctx.translate(this.pan.x, this.pan.y);
            this.ctx.scale(this.scale, this.scale);

            // Draw Before Image (No Offset)
            this.drawImageToCtx(this.comparisonImage);

            this.ctx.restore(); // End Transform
            this.ctx.restore(); // End Left Clip
        }

        // --- 2. Right Side: After/Current Image ---
        this.ctx.save();
        if (this.isComparisonMode) {
            this.ctx.beginPath();
            this.ctx.rect(splitX, 0, w - splitX, h); // Clip Right (Screen Space)
            this.ctx.clip();
        }

        // Apply Transform for Main Content
        this.ctx.imageSmoothingEnabled = this.scale < 4.0;
        this.ctx.translate(this.pan.x, this.pan.y);
        this.ctx.scale(this.scale, this.scale);

        // Apply Image Offset (Alignment adjustment)
        if (this.imageOffset) {
            this.ctx.translate(this.imageOffset.x, this.imageOffset.y);
        }

        // Draw Main Image (After)
        if (this.currentImage) {
            this.drawImageToCtx(this.currentImage);
        }

        // Draw Solid Source Layer (Red Overlay)
        if (this.solidSourceLayer && this.solidSourceLayer.image) {
            const { image, x, y } = this.solidSourceLayer;
            this.ctx.globalAlpha = 0.5; // Semi-transparent
            try {
                this.ctx.drawImage(image, x, y);
            } catch (e) {
                console.warn('[RenderEngine] Failed to draw solid layer:', e);
            }
            this.ctx.globalAlpha = 1.0;
        }

        // --- 3. Draw Garbage Matte (Fixed Overlay) ---
        // Must undo ImageOffset but keep Pan/Scale
        if (this.imageOffset) {
            this.ctx.translate(-this.imageOffset.x, -this.imageOffset.y);
        }

        if (this.garbageMatte) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; // Semi-transparent black for feedback, or solid?
            // User said "White background moves", implying Matte stays.
            // Usually Matte is "Cut out", so it should be represented as "Black/Masked".
            // Let's draw Black Rectangles.

            const gm = this.garbageMatte;
            const w = this.canvas.width / this.scale; // logical width? No, canvas size.
            // Wait, coordinate system is scaled/panned.
            // (0,0) is top-left of the IMAGE space (because we are inside Pan/Scale transform but outside ImageOffset)

            // We need image dimensions.
            if (this.currentImage) {
                const iw = this.currentImage.width;
                const ih = this.currentImage.height;

                this.ctx.fillStyle = '#000000';

                // Top
                if (gm.t > 0) this.ctx.fillRect(0, 0, iw, gm.t);
                // Bottom
                if (gm.b > 0) this.ctx.fillRect(0, ih - gm.b, iw, gm.b);
                // Left
                if (gm.l > 0) this.ctx.fillRect(0, 0, gm.l, ih);
                // Right
                if (gm.r > 0) this.ctx.fillRect(iw - gm.r, 0, gm.r, ih);
            }
        }

        // Draw Overlay (After)
        if (this.overlayImage) {
            this.drawImageToCtx(this.overlayImage);
        }

        // Draw Garbage Matte
        if (this.garbageMatte && this.currentImage) {
            const imgW = this.currentImage.width;
            const imgH = this.currentImage.height;
            const { t, b, l, r } = this.garbageMatte;
            this.ctx.fillStyle = 'rgba(255, 50, 50, 0.3)';
            if (t > 0) this.ctx.fillRect(0, 0, imgW, t);
            if (b > 0) this.ctx.fillRect(0, imgH - b, imgW, b);
            if (l > 0) this.ctx.fillRect(0, 0, l, imgH);
            if (r > 0) this.ctx.fillRect(imgW - r, 0, r, imgH);
        }

        // Draw Drag Rect
        if (this.dragRect) {
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 2 / this.scale;
            this.ctx.setLineDash([5 / this.scale, 5 / this.scale]);
            this.ctx.strokeRect(this.dragRect.x, this.dragRect.y, this.dragRect.w, this.dragRect.h);
            this.ctx.setLineDash([]);
        }

        // Draw Lasso
        if (this.lassoPath && this.lassoPath.length > 0) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.moveTo(this.lassoPath[0].x, this.lassoPath[0].y);
            for (let i = 1; i < this.lassoPath.length; i++) {
                this.ctx.lineTo(this.lassoPath[i].x, this.lassoPath[i].y);
            }
            if (this.lassoCursor) {
                this.ctx.lineTo(this.lassoCursor.x, this.lassoCursor.y);
            } else {
                this.ctx.closePath();
            }
            this.ctx.fillStyle = this.lassoColor || 'rgba(255, 0, 0, 0.3)';
            this.ctx.strokeStyle = this.lassoColor ? this.lassoColor.replace('0.5', '0.8') : 'rgba(255, 0, 0, 0.8)';
            this.ctx.lineWidth = 2 / this.scale;
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.restore();
        }

        // Draw Cursor (Only on Right Side? Or both? Usually follow mouse, so both is fine, clip will cut it)
        if (this.cursor.visible && this.cursor.size > 0) {
            this.ctx.beginPath();
            this.ctx.arc(this.cursor.x, this.cursor.y, this.cursor.size, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.lineWidth = 1 / this.scale;
            this.ctx.stroke();
        }

        this.ctx.restore(); // End Clip or Transform

        // --- 3. Split Line & Handle (Screen Space) ---
        if (this.isComparisonMode) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.moveTo(splitX, 0);
            this.ctx.lineTo(splitX, h);
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
            this.ctx.shadowBlur = 4;
            this.ctx.stroke();

            // Handle Circle
            const cy = h / 2;
            this.ctx.beginPath();
            this.ctx.arc(splitX, cy, 15, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fill();

            // Arrows
            this.ctx.fillStyle = '#333333';
            this.ctx.beginPath();
            this.ctx.moveTo(splitX - 5, cy);
            this.ctx.lineTo(splitX - 2, cy - 4);
            this.ctx.lineTo(splitX - 2, cy + 4);
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.moveTo(splitX + 5, cy);
            this.ctx.lineTo(splitX + 2, cy - 4);
            this.ctx.lineTo(splitX + 2, cy + 4);
            this.ctx.fill();

            this.ctx.restore();
        }

        const zoomEl = document.getElementById('info-zoom');
        if (zoomEl) zoomEl.textContent = Math.round(this.scale * 100) + '%';
    }

    drawImageToCtx(imgDataOrElement) {
        try {
            if (imgDataOrElement instanceof ImageData) {
                // OffscreenCanvasを使ってDOMアクセスを回避
                if (!this._offscreen ||
                    this._offscreen.width !== imgDataOrElement.width ||
                    this._offscreen.height !== imgDataOrElement.height) {
                    this._offscreen = new OffscreenCanvas(imgDataOrElement.width, imgDataOrElement.height);
                    this._offscreenCtx = this._offscreen.getContext('2d');
                }
                this._offscreenCtx.putImageData(imgDataOrElement, 0, 0);
                this.ctx.drawImage(this._offscreen, 0, 0);
            } else {
                this.ctx.drawImage(imgDataOrElement, 0, 0);
            }
        } catch (e) {
            // WASM メモリー拡張で ImageData がデタッチされた場合は安全にスキップ
            console.warn('[RenderEngine] drawImageToCtx skipped (detached buffer):', e.message);
        }
    }

    bindEvents() {
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.handleZoom(e);
        }, { passive: false });

        this.canvas.addEventListener('mousedown', (e) => {
            // Priority: Splitter > Space/Middle Click > Lasso

            // Check Splitter Hit
            if (this.isComparisonMode) {
                const rect = this.canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const splitX = this.canvas.width * this.splitPosition;
                if (Math.abs(mx - splitX) < 15) { // Hit test
                    this.isDraggingSplitter = true;
                    this.canvas.style.cursor = 'col-resize';
                    return;
                }
            }

            if (this.isSpacePressed || e.button === 1) {
                this.isDragging = true;
                this.lastMouse = { x: e.clientX, y: e.clientY };
                this.canvas.style.cursor = 'grabbing';
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isDraggingSplitter) {
                const rect = this.canvas.getBoundingClientRect();
                let x = e.clientX - rect.left;
                x = Math.max(0, Math.min(rect.width, x));
                this.splitPosition = x / rect.width;
                this.requestRender();
                return;
            }

            if (this.isDragging) {
                const dx = e.clientX - this.lastMouse.x;
                const dy = e.clientY - this.lastMouse.y;
                this.pan.x += dx;
                this.pan.y += dy;
                this.lastMouse = { x: e.clientX, y: e.clientY };
                this.requestRender();
                if (this.onViewChange) this.onViewChange(this.scale, this.pan);
                return;
            }

            if (this.isComparisonMode && !this.isDragging) {
                // Update Cursor for hover
                const rect = this.canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const splitX = this.canvas.width * this.splitPosition;
                if (Math.abs(mx - splitX) < 15) {
                    this.canvas.style.cursor = 'col-resize';
                } else if (!this.isSpacePressed) {
                    this.canvas.style.cursor = 'default';
                }
            }
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.isDraggingSplitter = false;
            if (!this.isSpacePressed) {
                this.canvas.style.cursor = 'default';
            } else {
                this.canvas.style.cursor = 'grab';
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat) {
                this.isSpacePressed = true;
                this.canvas.style.cursor = 'grab';
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.isSpacePressed = false;
                this.isDragging = false;
                this.canvas.style.cursor = 'default';
            }
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.isSpacePressed) {
                this.fitToScreen();
                this.requestRender();
            }
        });
    }

    handleZoom(e) {
        const zoomIntensity = 0.1;
        const delta = -Math.sign(e.deltaY);
        let newScale = this.scale * (1 + delta * zoomIntensity);
        newScale = Math.max(0.05, Math.min(newScale, 50.0));

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const imgX = (mouseX - this.pan.x) / this.scale;
        const imgY = (mouseY - this.pan.y) / this.scale;

        this.pan.x = mouseX - imgX * newScale;
        this.pan.y = mouseY - imgY * newScale;
        this.scale = newScale;
        this.requestRender();
        if (this.onViewChange) this.onViewChange(this.scale, this.pan);
    }
}