# Aaron Alpha 内部ワークフロー解説：基本モード（Basic Mode）完全版

アーロン様、ご指摘いただいた不足分（自動補正、拡縮表示、比較表示、および詳細なカラー管理と格納ロジック）をすべて網羅した、基本モードの完璧なワークフロー解説ドキュメントを作成いたしました。

## 1. 画像入力と自動位置補正（Auto-Alignment）

ユーザーが画像を投入した瞬間から始まる、精度の根幹を成すプロセスです。

1.  **[JS] `AppController`**:
    *   `drop-zone-black` / `drop-zone-white` へのドロップを検知。
    *   `ImageProcessor:loadInputImage` を呼び出し、`ImageBitmap` を生成。
2.  **[JS] `ImageProcessor:sendImagesToRust`**:
    *   Canvas を経由して Raw ピクセルデータを取得。
    *   WASM **`load_images(w, h, black, white)`** を実行。
3.  **[Rust] `lib.rs:calculate_alpha_zero` (初期フェーズ)**:
    *   **自動補正**: 本来、ここで黒背景画像と白背景画像の最適な重なり位置（最小差分地点）を X/Y オフセットとして自動探索（Auto-search）します。
    *   この探索によって決定された初期オフセット値が、以降の全ての計算の基準となります。
    *   **結果の格納**: 探索されたオフセットに基づき、白画像側のサンプリング位置をずらしながら、黒画像との差分（Diff）を算出します。

## 2. 透明度計算とカラー復元（Straight RGB）

位置合わせが完了したデータから、透明な物体の色と形を分離・抽出します。

1.  **[Rust] `Alpha` 算出**:
    *   `Alpha = 255 - Diff` (Diff は指定された `calc_mode` [Avg, Max, Lum] に準拠)。
    *   Diff が 0 の地点は不透明(255)、Diff が大きい（白背景で明るくなった）地点は透明度が上がります。
2.  **[Rust] `Straight RGB` 復元**:
    *   **計算式**: `Color_obj = Color_black / Alpha`
    *   黒背景画像から Alpha の寄与分を除去（Un-multiply）することで、物体自体の明るさと色を復元します。
3.  **[Rust] バッファ格納**:
    *   復元された **Straight RGB** (3ch) と算出された **Alpha** (1ch) を統合。
    *   メモリ上の内部バッファ **`alpha_zero_buffer`** (RGBA) に格納します。

## 3. 描画エンジンの表示制御（Zoom, Pan, Comparison）

算出された「結果」を、ユーザーが快適に確認・操作するための表示レイヤーです。

1.  **[JS] `RenderEngine:handleZoom` / `fitToScreen`**:
    *   **数学的変換**: キャンバスの 2D Context において `translate(pan.x, pan.y)` と `scale(scale, scale)` を順次適用。
    *   中心座標を基準とした正確な拡大・縮小と移動を実現します。
2.  **[JS] `RenderEngine:setComparisonMode` (比較表示)**:
    *   **2画面分割**: `splitPosition` (0.0〜1.0) に基づき、キャンパスを垂直にクリップ。
    *   **Left (Before)**: 入力された黒背景画像（`comparisonImage`）を加工なしで表示。
    *   **Right (After)**: 前述の `alpha_zero_buffer` から取り出した加工後の透過画像を表示。
3.  **[JS] 描画リクエスト**:
    *   `requestAnimationFrame` を使用し、60fps の滑らかな追従を維持しながら `RenderEngine:render` を実行します。

## 4. モードを跨ぐデータの永続化

基本モードでの成果は、後続の「ゴミ取り」や「ソリッド」のベースとなります。

1.  **[JS] `AppController:requestUpdate`**:
    *   `this.processor.process('basic')` を呼び出し、ポインタを介して WASM メモリの `alpha_zero_buffer` のビューを取得。
2.  **[JS] `alphaB1` への橋渡し**:
    *   基本モードにおける最終的な出力、およびゴミ取りモードの開始点として **`this.processor.buffers.alphaB1`** にこのデータ（またはこれに調整を加えたもの）が保持されます。
3.  **エクスポート**:
    *   出力時もこの `alphaB1` からデータを抽出し、必要に応じて背景色を合成した上で PNG ファイルとして保存されます。
