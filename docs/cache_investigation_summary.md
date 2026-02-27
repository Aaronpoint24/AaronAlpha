# ブラウザキャッシュ問題の調査報告書

## 概要
開発中のWebアプリケーションにおいて、JavaScriptファイルの変更がブラウザに反映されず、強力なキャッシュが維持され続ける現象が発生。
`Ctrl + Shift + R` でも解決せず、ファイル名の変更等でのみ解消。

## 環境
- **Server**: Python http.server (Custom Script)
- **Headers**: COOP: same-origin, COEP: require-corp
- **Cache-Control**: no-cache, no-store, must-revalidate

## 発生した事象
- メソッド名を変更したが、ブラウザ上では変更前のメソッド名で動作し続け、古いファイルが使われ続けていた。
- クエリパラメータ付与（?v=2.1）などで物理的に読み込みパスを変えると反映される。

## 技術的要因の疑い
1. SES / LockdownJS の影響
2. COOP/COEP とキャッシュの相互作用
3. Python http.server のラストモディファイド判断
