# 実装計画書：認証緩和とファイル出力仕様変更

## 1. 概要
ユーザーの利便性を向上させるため、認証による機能制限を緩和し、ファイル出力処理をRust（WASM）に移行することで機能強化とパフォーマンス向上を図る。

## 2. 認証仕様の変更

### 変更前
- 未認証ユーザーは「Trash」「Solid」タブへの切り替えが不可。
- 未認証状態で制限モードに入ると強制的に「Basic」モードへリセットされる。

### 変更後
- **タブ切り替え**: 未認証ユーザーでも全モード（Basic, Trash, Solid）のタブ切り替えと操作が可能。
- **エクスポート制限**: 未認証ユーザーは「Trash」「Solid」モードでのファイル出力（Export）のみ実行不可。
- **UI表示**: 
    - Exportボタンは表示されるが押下不可（Disabled）。
    - マウスオーバー時にツールチップで「Basic認証が必要です」と表示。

## 3. ファイル出力仕様の変更

### 3.1 処理基盤の移行
- 従来JavaScriptで行っていた画像加工・出力処理を、Rust（WASM）の `process_export` 関数に集約。
- 高速化とメモリ管理の安全性向上を実現。

### 3.2 ファイル名生成ルール
出力ファイル名は以下の形式で自動生成される。
```
[BaseFileName]_[ModeSuffix]_[BG?].png
```
- **BaseFileName**: 読み込んだ黒背景画像のベースファイル名。
- **ModeSuffix**:
    - Basicモード: `_AaronAlpha_Basic`
    - Trashモード (Hard): `_AaronAlpha_Trash`
    - Trashモード (Alpha): `_AaronAlpha_Alpha`
    - Solidモード: `_AaronAlpha_Solid`
- **BG?**: 背景色が指定されている場合のみ `_BG` が付与される。

### 3.3 モード別出力挙動

#### Basicモード
- **出力内容**: `final_buffer`（マスク適用済み画像）。
- **背景**: 指定色がある場合、Rust側で合成。

#### Trashモード
- **出力内容**:
    - **Hard (Trash Type)**: `alphaB1` (または再計算されたHard結果)。**ガーベージマットは無視され、フルサイズで出力される**。
    - **Soft (Alpha Type)**: `alpha_zero_buffer` (初期Alpha計算結果)。**ガーベージマット無視**。
- **変更点**: エクスポート時のみ一時的にガーベージマット設定を無効化（0設定）し、全領域を出力する仕様に変更。

#### Solidモード
- **出力内容**: `solid_export_buffer`（Solid Integrated Previewと同等）。
- **特徴**: プレビュー表示の状態（Solid化された結果）をそのまま出力。

## 4. 技術的変更点

### Rust (lib.rs)
- `process_export` 関数の追加。
    - 引数: `mode`, `bg_color_hex`, `base_filename`
    - 戻り値: `ExportResult` 構造体 (`data`: 画像データ, `filename`: 生成ファイル名)
- `ExportResult` 構造体の定義とWASM公開。

### JavaScript
- `ImageProcessor.js`: 
    - `baseFileName` の取得ロジック追加。
    - `processExport` メソッドの実装（WASM呼び出しとメモリ解放）。
- `AppController.js`:
    - `handleExportBasic`, `handleExportTrash`, `handleExportSolid` の改修。
    - Trashモード出力時の「ガーベージマット一時無効化 -> 復元」ロジックの実装。
    - `downloadImage` がRustから返されたファイル名を使用するように変更。
