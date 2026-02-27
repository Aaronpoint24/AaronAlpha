# ゴミ取りモード：決定版アーキテクチャ定義

アーロン様、ご指導ありがとうございます。
ご提示いただいた「役割が名前で直感できる」新設計に基づき、内部の切り分けを完全に再定義いたしました。

## 1. Wasm（Rust）側：バッファ定義（改訂版）
ゴミ取り（Trash）に関連するバッファを以下の通り独立させ、名前と役割を一致させます。

| バッファ名 | 内容 | 形式 | 役割 |
| :--- | :--- | :--- | :--- |
| **`alpha_zero_buffer`** | **元祖データ** | RGBA | 全ての加工のソース（初期 Straight RGB + Alpha）。 |
| **`alphaB1`** | **カラー透過結果** | RGBA | 位置調整・閾値等を適用した、最終的なオーバーレイ用・出力用カラーPNGデータ。 |
| **`soft_mat_buffer`** | **ソフトマット** | RGBA | グラデーションを保持する可視化用。RGBは視認性のため 1 固定。 |
| **`hard_mat_buffer`** | **ハードマット** | RGBA | 0 か 255 の 2値を保持する可視化用。RGBは視認性のため 1 固定。 |

---

## 2. JavaScript（AppController）側：管理フラグ（改訂版）
不透明な `showRawAlpha` を廃止し、アーロン様の設計された直接的な命名に変更します。

| フラグ名 | 取り得る値 | 意味 |
| :--- | :--- | :--- |
| **`typesOfAlpha`** | `'soft'` / `'hard'` | 現在どちらのマスク（グラデーション / 2値）をメインで見ているか。 |
| **`overlayMode`** | `'on'` / `'off'` | 背景に対して、カラーの透過PNG (`alphaB1`) を重ねてプレビューするか。 |

---

## 3. 動作ロジックの切り分け

### A. ゴミ取りモード進入時 (Initialization)
1. **初期状態**: `typesOfAlpha = 'hard'` (2値表示), `overlayMode = false`。
2. **背景強制**: モード初回進入時のみ、背景を「黒」に固定。
3. **データ生成**: `init_trash_mode` により `alpha_zero_buffer` を `alphaB1` にコピーし、マットバッファの RGB を `1` で初期化。

### B. 描画パイプライン (Zero-Overhead Rendering)
JS 側はループを行わず、モードに応じて WASM のポインタを切り替えて `RenderEngine` に渡す。
*   `overlayMode == true` → **`alphaB1`** のポインタを使用。
*   `overlayMode == false` → `typesOfAlpha` に従い、**`soft_mat_buffer`** または **`hard_mat_buffer`** のポインタを使用。

### C. 位置調整モード (Adjustment)
*   **視認性**: 進入時に `typesOfAlpha = 'soft'` を一時的に強制し、ズレを見やすくする。
*   **物理反映**: 確定（Enter）時に `finalize_trash_mode` を実行し、オフセット後の画像を **Straight RGB** として `alphaB1` に再錬成する。

---
この体系により、バッファの役割が「物理的な意味」と一致し、JS と Rust の対話が最もシンプルかつ高速になります。
