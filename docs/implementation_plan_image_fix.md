# サンプルページの画像表示不具合に関する修正計画

アーロン様、GitHub Pagesで画像が表示されない原因を特定いたしました。

## 原因の追求・検証結果
1.  **参照パスの不一致**: samples_lp/index.html が参照している画像（抽出後の透過PNG）が、Git管理対象の image/ フォルダ内に存在していませんでした。
2.  **ファイルの所在**: 必要な画像ファイル（Sample01_Black_AaronAlpha_Solid.png 等）は、現在Gitから除外されている deploy_final/image/ フォルダ内にのみ存在しています。
3.  **除外設定の干渉**: .gitignore において、*_AaronAlpha_Solid.png という形式のファイルが「重いテスト出力」として一括除外されていました。

## 修正内容
1.  **画像の配置**: deploy_final/image/ にある抽出後画像を、ルートの image/ フォルダへコピーします。
    - **絶対に既存のソースコードやスクリプトは削除・移動いたしません。**
2.  **除外設定の解除**: .gitignore から image/*_AaronAlpha_Solid.png の行を削除し、これらの画像がGitで追跡されるようにします。
3.  **Gitへの追加と再プッシュ**: 不足していた画像をGitに追加し、リモートへ反映させます。

## 実施コマンド
```powershell
# 画像を適切な場所へコピー（実体保護のためコピーを使用）
Copy-Item "deploy_final/image/*_AaronAlpha_Solid.png" "image/"

# .gitignore の修正（除外設定の削除）

# Gitへの追加とプッシュ
git add image/*_AaronAlpha_Solid.png
git add .gitignore
git commit -m "Fix: Add missing sample images for landing page and update .gitignore"
git push origin main
```

## アーロン様へのご確認
この手順で、不足している画像を image/ フォルダに配置し、公開設定を修正してよろしいでしょうか。
ご確認をお願い申し上げます。
