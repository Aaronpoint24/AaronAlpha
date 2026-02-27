# ゴミ取りモードの極致最適化（ゼロコピー・ビューポート限定）実装計画書 (v3)

## 1. 目的
ノイズ閾値スライダー操作時の「重み」を完全に排除し、高解像度画像でも爆速なレスポンスを実現します。同時に、無駄なメモリコピーと全域計算を廃止し、アーロン様の設計思想に沿った効率的なパイプラインを構築します。

## 2. 最適化の柱

### ① ビューポート限定計算 (Calculation Limiting)
- **Rust側**: `update_trash_mode` にビューポート座標（`vp_x, vp_y, vp_w, vp_h`）を追加。
- **ロジック**: `計算対象 = (ガーベージマット矩形) ∩ (可視領域ビューポート)`
- **メリット**: 拡大表示中、画面外の数百万ピクセルの計算とバッファクリアをスキップ。

### ② 表示レイヤー限定更新 (Selective Buffer Update)
- **Rust側**: `type_of_alpha` と `overlay_mode` に基づき、`soft`, `hard`, `alphaB1` のうち**現在表示に必要な1つのみ**を更新する。
- **メリット**: 常に3つのバッファを書き換える無駄（416万回×3層）を1/3に削減。

### ③ ゼロコピー描画 (Zero-Copy Implementation)
- **JS側**: `ImageProcessor.js` のコピー処理（`Uint8ClampedArray` の再確保）を廃止。
- **ロジック**: WASMメモリの `ArrayBuffer` を直接 `ImageData` に渡し、`putImageData` する。
- **メモ管理**: WASMメモリ拡張時の `Detached Buffer` エラーは `RenderEngine` 側の既存の try-catch で安全に吸収。

### ④ RGB領域の維持
- **仕様**: `soft`, `hard`, `alphaB1` の RGB 値は `init_trash_mode` または `finalize_trash_mode` 時に 255 (単色) で初期設定済み。
- **最適化**: スライダー操作（`update_trash_matte_fast`）時は**アルファ値のみ**を書き換え、RGB 領域の全域クリアを廃止。

---

## 3. 実装ロードマップ

### Phase 1: Rust Core (lib.rs)
1. `update_trash_mode` の引数にビューポート情報を追加。
2. `update_trash_matte_fast` を改修：
    - クリア範囲をビューポート内に限定。
    - 更新対象のバッファを 1 つに絞るロジックを導入。
3. `finalize_trash_matte` での Vec 確保を廃止。

### Phase 2: JavaScript (ImageProcessor.js / AppController.js)
1. `ImageProcessor.js`: `process()` に `zeroCopy` オプションを追加。
2. `AppController.js`: 閾値変更時に `renderEngine.getViewPort()` を取得し、プロセッサへ伝達。

### Phase 3: Verification
1. 拡大表示中のレスポンス改善を確認（ログの ms 計測）。
2. 表示モード（soft/hard/overlay）切り替え時の挙動確認。

---

## 4. アーロン様への根拠説明
- **全域クリアの廃止**: 見える場所だけ掃除する戦略に切り替えます。
- **3バッファ更新の廃止**: 非表示レイヤーの計算は純粋なリソースの浪費であるため、動的選択を導入します。
- **ゼロコピー**: メモリコピーによるオーバーヘッド（1〜5ms）を排除し、WASMメモリの真価を引き出します。
