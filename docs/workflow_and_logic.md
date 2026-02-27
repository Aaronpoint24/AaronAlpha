# U-2-NET Solid Core Extraction - 操作ワークフローとロジック説明

## 機能概要
AI Solid Core Extraction は、U-2-NETモデルを使用して画像から「オブジェクトのコア部分」を自動抽出する機能です。

## 操作ワークフロー
1. 画像をロード → 「不透明化」タブに切り替え
2. AIモデルが自動ロード
3. 「AI 抽出実行」ボタンをクリック
4. AI推論 → 確率マップ生成
5. Threshold (閾値1) → バイナリマスク
6. Probe (閾値2) → Erosionでマスク縮小
7. c1_baseに書き込み → c1_final合成 → 画面表示

## 閾値パラメータの役割
- **solidThreshold**: AI確率をどこでカットするか = 抽出領域の広さ
- **solidProbe**: マスクを何回縮小するか = ノイズ除去とコア抽出
