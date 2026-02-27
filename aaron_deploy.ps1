# AaronAlpha One-Click Deploy Script (v1.0)
# アーロン様専用：安全デプロイ・ボタン

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   🌹 AaronAlpha デプロイ・エスコート 🌹" -ForegroundColor Cyan
Write-Host "========================================`n"

# 1. 変更内容の聞き取り
$DefaultMsg = "アーロン様による自動デプロイ ($(Get-Date -Format 'yyyy/MM/dd HH:mm'))"
$CommitMsg = Read-Host "今回の変更内容を簡単に入力してください (空欄でデフォルト使用)"
if ([string]::IsNullOrWhiteSpace($CommitMsg)) {
    $CommitMsg = $DefaultMsg
}

# 2. 安全確認スクリプトの実行 (機密混入の防止)
Write-Host "`n[Step 1/3] 安全性の最終チェックを実行します..." -ForegroundColor Yellow
try {
    # 内部で OK を待機する safe_deploy.ps1 を呼び出す
    # (既に safe_deploy.ps1 側で機密ファイルの排除と公開用フォルダの作成が行われる)
    .\safe_deploy.ps1 $CommitMsg
} catch {
    Write-Host "`n[中止] 安全チェックで問題が見つかりました。デプロイを中断します。" -ForegroundColor Red
    exit 1
}

# 3. Git操作の実行
Write-Host "`n[Step 2/3] GitHubへプッシュします..." -ForegroundColor Yellow

# 変更をステージング
git add .

# コミット実行
git commit -m $CommitMsg

# プッシュ実行
try {
    git push origin main
} catch {
    Write-Host "`n[失敗] GitHubへの送信中にエラーが発生しました。ネットワーク等を確認してください。" -ForegroundColor Red
    exit 1
}

# 4. 完了報告
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   ✨ デプロイが正常に完了いたしました ✨" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "世界へ最新の変更が送信されました。お疲れ様でございました、アーロン様。`n"
