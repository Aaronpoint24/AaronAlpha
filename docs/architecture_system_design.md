# AaronAlpha 全体システムアーキテクチャ・設計資料

本ドキュメントでは、AaronAlphaの全体像、JavaScriptとWebAssembly(WASM/Rust)の相互作用、および画像処理のパイプラインについて解説します。

## 1. システム全体像

AaronAlphaは、高負荷な画像処理計算をWebAssemblyで行い、ユーザーインターフェースと描画管理をJavaScriptで行うハイブリッドアーキテクチャを採用しています。

### コンポーネント構成
-   **JavaScript Frontend (Main Thread)**
    -   `AppController.js`: アプリケーションの動作、UIイベント、状態遷移の管理。
    -   `ImageProcessor.js`: JSからWASMへの命令の橋渡しと、非同期処理の実行。
    -   `RenderEngine.js`: WebGL/Canvasを用いたバッファの高速描画とズーム・パン管理。
    -   `I18n.js`: 多言語対応およびユーザーメッセージの集中管理。
-   **Rust Core (WebAssembly)**
    -   `lib.rs`: 画像処理アルゴリズムの本体、全バッファのメモリ管理。
    -   `find_auto_offset`: ORB/BRIEFアルゴリズムによる画像の高速自動位置合わせ。

## 2. 通信・データ共有モデル

### ゼロコピー・メモリアクセス
JavaScriptとWASM間のデータ転送コストを最小化するため、以下の手法を採用しています。
1.  WASM側で巨大なメモリ空間（`Linear Memory`）を確保。
2.  JS側は `wasm.memory.buffer` を通じてそのアドレスを直接参照。
3.  描画時（JS）はWASGのバッファポインタを取得し、JS側の `Uint8ClampedArray` としてラッピングしてCanvasの `putImageData` やWebGLテクスチャとして流し込みます。

### ライフサイクル
1.  `JS`: 画像を `ArrayBuffer` としてロード。
2.  `JS`: WASMの `calculate_alpha_zero` 等を呼び出し、ポインタを渡す。
3.  `Rust`: メモリ内のデータを直接加工し、結果バッファを更新。
4.  `JS`: 結果バッファのポインタから描画を実行。

## 3. レンダリング・パイプライン

各モードにおける計算結果は、最終的に `final_buffer` またはモード固有のプレビューバッファに集約されます。

### スマート・リフレッシュ (Optimization)
位置調整中などの高負荷時には、以下の高速化手順が踏まれます：
-   **部分更新 (`partial` 更新)**: ビューポート（画面に見えている範囲）のみをWASMに渡し、その範囲の計算・描画のみを実行することで、4K解像度等でもリアルタイム性を確保します。
-   **全域更新 (`full` 更新)**: ズーム操作の開始時や、位置調整後の確定時、モード切替時にバックグラウンドで全域を再計算します。

## 4. Undo/Redo システム

Undo機能は **「ステート・ベース」** で実装されています。
-   `ImageProcessor.js` 内に `undoStack` を保持。
-   主要な操作（焼き付け、位置調整、ショット等）の前に、WASM側の主要な入力・計算バッファ（例：`alpha_zero_buffer`, `mask_buffer`, `solid_burn_mask`）のコピーをJS側に退避。
-   Undo実行時は、JS側のバックアップをWASMのメモリへ書き戻し、再計算（`process`）をトリガーします。

## 5. 留意点
-   WASM側のメモリはスレッドローカルな `CONTEXT` (RefCell) に格納されているため、画像読み込みの度に `new` して過去のバッファを明示的に解放・再確保する必要があります。
-   JS側の描画ループは `requestAnimationFrame` に同期されますが、WASM計算が重い場合は `isProcessing` フラグを用いて再入（Re-entrancy）を防止しています。
