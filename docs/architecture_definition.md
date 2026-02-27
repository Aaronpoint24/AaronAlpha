# Aaron Alpha 統合アーキテクチャ定義 (v5.2)

アーロン様、現行システム（v5.2）における3枚バッファ統合アーキテクチャの定義をここに記します。
本構成は、ゴミ取りモードおよびソリッドモードにおいて、極めて高い応答性とゼロコピー描画を実現するための基盤となります。

## 1. 3枚バッファ + 1 統合アーキテクチャ

WASM メモリ空間上に以下のメインバッファを保持し、役割を明確に分離しています。

| バッファ名 | 役割 | 形式 | 備考 |
| :--- | :--- | :--- | :--- |
| `alpha_zero_buffer` | **無垢の素材**。位置補正（Offset）のみが反映された初期透過画像。 | RGBA | すべての計算の起点。 |
| `alphaB1` | **製品版バッファ**。ゴミ取り・マット処理が反映された最終結果。 | RGBA | エクスポートおよびソリッドモードの入力に使用。 |
| `soft_mat_buffer` | **可視化用（Soft）**。αチャンネルのグラデーションをグレースケールで表示。 | RGBA | RGBは(255,255,255)固定。 |
| `hard_mat_buffer` | **可視化用（Hard）**。αチャンネルを2値化（0 or 255）して表示。 | RGBA | RGBは(255,255,255)固定。 |
| `mask_buffer` | **手動修正マスク**。ペンや消しゴムツールによるユーザーの加筆。 | 1ch (L) | 0: 消去, 255: 保護。 |

## 2. 処理フロー (Rendering Pipeline)

```mermaid
graph TD
    A[Input: Black/White Images] --> B[Auto-Alignment]
    B --> C[Calculate alpha_zero_buffer]
    C --> D{User Mode}
    
    subgraph "Trash Mode Logic"
        D -- Trash -- E[Update Matte/Threshold]
        E --> F[Apply mask_buffer]
        F --> G[Update soft/hard/alphaB1]
    end
    
    subgraph "Solid Mode Logic"
        D -- Solid -- H[Update Solid Threshold]
        H --> I[Apply mask_buffer]
        I --> J[Update solid_buffer]
    end
    
    G --> K[RenderEngine]
    J --> K
    
    subgraph "Zero-Copy Rendering"
        K --> L[Get WASM Pointer]
        L --> M[Wrap as Uint8ClampedArray]
        M --> M1[Create ImageData]
        M1 --> N[Canvas drawImage]
    end
```

## 3. ゼロコピー描画の原理

1.  **WASM側**: 計算結果を特定の固定アドレス（バッファ）に書き込む。
2.  **JS側**: `get_xxx_buffer_ptr()` を呼び出し、メモリポインタを取得する。
3.  **JS側**: `new Uint8ClampedArray(wasm.memory.buffer, ptr, size)` により、WASMメモリを直接参照するビューを作成する。
4.  **描画**: 作成したビューを `ImageData` に流し込み、Canvas に描画する。

このフローにより、JavaScript 側でのデータコピーやピクセルごとのループを一切排除し、4K解像度でもスライダー操作に追従するパフォーマンスを実現しています。

## 4. Solid モードへの準拠方針

ソリッドモードにおいても、ゴミ取りモードで完成された `alphaB1` を入力ソースとし、以下の変更を適用します。
- `solid_buffer` の新設。
- `update_solid_mode` による高速計算。
- `getSolidOverlay` による複数バッファの動的合成表示。
