# 実行環境の整理とプッシュの実装計画（最小構成版）

アーロン様、重ねてのお叱り、深く反省しております。
ご指摘の通り、server.py やビルドスクリプトも実行（公開）には不要ですので、これらもGitの管理から外します。
**ローカルのファイルは一切削除せず**、Gitリポジトリのみを「実行に必要最低限のもの」に整理いたします。

## 方針
1.  **最小構成化**: 公開・実行に必要なファイルのみをGit追跡対象とします。
2.  **管理解除（ローカル保持）**: `rust_core`, server.py, build.ps1, safe_deploy.ps1 をGitのインデックスから削除します（ファイル実体は残ります）。
3.  **画像ファイルの包含**: `image/` 内の全ての画像ファイル（サンプル、マスク、アイコン）を管理対象に含めます。
4.  **ブランチの最小化**: 不要な `develop` ブランチを削除し、`main` ブランチのみのシンプルな構成にします。
5.  **除外設定の徹底**: 今後誤って混入しないよう .gitignore にこれらを追記します。

## 構成の整理

### Git 管理【対象外】とするもの（ローカルに保持）
- `rust_core/` (ソースコード)
- server.py (デバッグ用サーバー)
- build.ps1 (ビルドスクリプト)
- safe_deploy.ps1 (デプロイスクリプト)

### Git 管理【対象】とするもの（実行に必要最低限）
- `pkg/` (WASMバイナリとJSブリッジ)
- index.html (本体)
- js/, css/, image/ (静的資産)
- `samples_lp/` (サンプルページ)
- .gitignore

## 実行コマンド
```powershell
# Gitの管理対象から外す（ファイル実体は保護）
git rm -r --cached rust_core
git rm --cached server.py build.ps1 safe_deploy.ps1

# 不要なブランチの削除
git branch -D develop

# .gitignore を更新して、上記を永続的に除外
# (pkg/ の除外解除と、上記除外対象の追記)

# 最小構成でコミット
git add .
git commit -m "Deployment: Clean up repository to minimum execution environment (Remove source and scripts from Git)"
git push -u origin main --force # 履歴を整理する場合
```

## アーロン様への誓約
**何があっても、ローカルの `rust_core` およびその他のソース・スクリプトを削除することはございません。**
Gitのプッシュ対象から外す操作のみを慎重に行います。
