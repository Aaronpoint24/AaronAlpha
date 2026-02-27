# アルファ計算ロジック解説

本ドキュメントでは、Aaron Alpha におけるアルファ値（透過度）の抽出および計算プロセスについて解説します。

## 1. データフローと使用リソース

### 使用バッファ (rust_core/src/lib.rs: ImageContext 構造体)
- `input_black`: 黒背景で撮影された画像データのバイト列 (RGBA)。
- `input_white`: 白背景で撮影された画像データのバイト列 (RGBA)。
- `alpha_zero_buffer`: 計算結果（復元RGB + アルファ）を格納するプライマリバッファ。

### 主要な関数 (rust_core/src/lib.rs)
- `load_images`: JSからデータを受け取り、バッファを初期化する。
- `calculate_alpha_zero`: 本ロジックの核心。黒白の差分からアルファを抽出し、色を復元する。

### 処理プロセス
1.  **フロントエンド画像読み込み (JS)**:
    - ユーザが `Black背景画像` と `White背景画像` をドロップ。
    - `AppController` が画像ファイルをキャッチし、`ImageProcessor.loadInputImage` を呼び出す。

2.  **データ形式の変換 (JS)**:
    - `ImageProcessor.getImageData` が RGBA 形式の 1次元 `Uint8Array` へ展開。

3.  **WASM への転送 (JS -> Rust)**:
    - `rcore.load_images` を実行し、Rust 側の `input_black` および `input_white` ベクタへ格納。

## 2. 3つのアルファ計算手法 (calc_mode)

差分 $Diff$ の算出方法が 3種類あります。
基本式: $Alpha_{u8} = 255.0 - Diff$

- **A. Max モード (mode: 0)**: $Diff = \max(|W_R - B_R|, |W_G - B_G|, |W_B - B_B|)$
- **B. Avg モード (mode: 1)**: $Diff = (|W_R - B_R| + |W_G - B_G| + |W_B - B_B|) / 3.0$
- **C. Lum モード (mode: 2)**: $Diff = 0.299 \times |W_R - B_R| + 0.587 \times |W_G - B_G| + 0.114 \times |W_B - B_B|$

## 3. ストレートRGBの復元と背景色の前提

### 「背景色が黒 (B=0)」の前提
黒背景画像のピクセル値 $B_{raw}$ は、本来の被写体の色 $C$ とアルファ $\alpha$ を用いて以下の式で表されます。
$$B_{raw} = C \times \alpha + Background \times (1 - \alpha)$$
ここで、**背景が完全な黒 ($Background = 0$) であることを前提とする** ことで、式は $B_{raw} = C \times \alpha$ と簡略化されます。これにより、本来の色 $C$ を求める際に背景色の寄与分を考慮せず、単純な商で復元が可能になります。

### 復元式と正規化 (Normalization)
$$C_{straight} = \frac{B_{raw}}{\frac{Alpha}{255.0}}$$
ここで `255.0` で割っているのは、整数であるアルファ値を 0.0〜1.0 の実数範囲に正規化するためです。

### 精度保持とエラー回避（重要）
Rust 内での計算において、以下の 3 点を厳守します。

1. **ゼロ除算 (Zero Divide) の回避**:
   アルファ値が 0（完全透過）の場合、除算は定義されず、結果が `Infinity` となります。これを避けるため、計算前、もしくは計算結果に対して `Alpha > 0` のガードを設けます。`Alpha = 0` のピクセルについては計算をスキップし、RGB 0 を割り当てます。

2. **理論値を超えるケースへの対応 (Clamping)**:
   理論上は $B_{raw} \le Alpha$ ですが、実画像のノイズや圧縮ノイズにより、稀に計算結果が 255.0 を超える（例: 255.6）場合があります。

3. **「丸め」と「キャップ」の併用**:
   単なる `.round()` だけでは、結果が `256.0` になり、`u8` 型へのキャスト時にオーバーフロー（ラップして 0 になる、あるいはパニックする）を引き起こす危険があります。
   したがって、以下の式のように **「キャップを掛けてからキャストする」** ロジックを採用します。
   $$\text{Result}_{u8} = \min(255.0, (C_{straight}).round()) \text{ as u8}$$
   これにより、精度を保ちつつ、安全に 0-255 の範囲に収めます。
