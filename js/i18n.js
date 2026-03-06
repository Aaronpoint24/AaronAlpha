// ============================================================
// i18n.js — Internationalization Module for Aaron Alpha
// ============================================================

const dictionaries = {
    en: {
        // Tabs
        'tab.basic': 'Basic',
        'tab.trash': 'Trash',
        'tab.solid': 'Solid',

        // Basic
        'basic.title': 'Basic mode(Beginner)',
        'basic.inputImages': 'Input Images',
        'basic.logicMax': 'Logic: Max',
        'basic.logicAvg': 'Logic: Avg',
        'basic.logicLum': 'Logic: Lum',
        'basic.blackInput': 'Black Input',
        'basic.whiteInput': 'White Input',
        'basic.background': 'Background',
        'basic.checker': '🏁 Checker',
        'basic.color': '🎨 Color',
        'basic.export': 'Export PNG',
        'basic.correction': 'Correction',
        'basic.resetAll': '↺ Reset',

        // Curve (Solid & Translucent Protection)
        'basic.curveTitle': 'Solid & Translucent Protection Curve',
        'basic.curveSolid': 'Fix Line (S)',
        'basic.curvePreserve': 'Protection Power (P)',

        // Trash
        'trash.title': 'Trash mode(Intermediate)',
        'trash.adjustPos': '📍 Adjust Position',
        'trash.adjustMsg1': '↑↓←→ to adjust\nPress ENTER or click to confirm',
        'trash.btnTrash': '🔳 Mask',
        'trash.btnAlpha': 'Alpha',
        'trash.btnShowBasic': '◎ Preview',
        'trash.btnShowBasicOn': '👀 Preview',
        'trash.threshold': 'Noise Threshold',
        'trash.editMatte': '📐 Garbage mat',
        'trash.matteMsg1': 'Drag to select area\nPress ENTER or click to confirm',
        'trash.top': 'Top',
        'trash.bottom': 'Bottom',
        'trash.left': 'Left',
        'trash.right': 'Right',
        'trash.penSize': 'Pen Size',
        'trash.antiAlias': '🌗 Anti-alias',
        'trash.applySolid': '⚡ Apply Solid',
        'trash.reset': '↺ Reset',
        'trash.export': 'Export PNG',

        // Solid
        'solid.title': 'Solid Mode(Advanced)',
        'solid.dropMatte': '✍Drop Custom Matte',
        'solid.adjustMsg1': '↑↓←→ to adjust\nPress ENTER or click to confirm',
        'solid.viewMode': 'View Mode',
        'solid.compositeOff': '◎ Preview',
        'solid.compositeOn': ' 👀Preview',
        'solid.vizActions': 'Visualization & Actions',
        'solid.solidViz': '👀 Visualize',
        'solid.rayFill': '🎯 Ray Fill',
        'solid.solidLevel': 'Opacity Threshold',
        'solid.rayDist': 'Raycast Distance',
        'solid.raycast': 'Expand/Shrink',
        'solid.penSize': 'Pen Size',
        'solid.antiAlias': '🌗 Anti-alias',
        'solid.background': 'Background',
        'solid.checker': '🏁 Checker',
        'solid.color': '🎨 Color',
        'solid.reset': '↺ Reset',
        'solid.export': 'Export PNG',
        'solid.extCoastlineLogic': '[Ext] Coastline Logic',
        'solid.aaWidth': 'Anti-alias Width',
        'solid.aaThres': 'Anti-alias Threshold',

        // Background
        'bg.label': 'Background',
        'bg.checker': '🏁 Transparent',
        'bg.color': '🎨 Color',
        'bg.comparison': 'Comparison',

        // Alerts
        'alert.noImage': 'Please load an image first.',
        'alert.imageOnly': 'Image files only.',
        'alert.solidReset': 'Solid Mode state has been reset.',
        'alert.alphaUpdateConfirm': 'Are you sure you want to revert to the generated alpha?\n\n* Manual edits like lasso or Ray Fill will be reset.\n(Garbage matte exclusion will be maintained)',
        'alert.alphaUpdateSuccess': 'Alpha state has been updated to the generated original.',
        'alert.resetSettingsConfirm': 'Are you sure you want to reset all settings? (Auth key will be kept)',

        // Settings
        'settings.title': 'Settings',
        'settings.language': 'Language',
        'settings.authKey': 'Auth Key',
        'settings.save': 'Save',
        'settings.speedPriority': 'Speed Priority (Low Quality Alignment)',
        'settings.autoAlign': 'Auto Align',
        'settings.solidExt': 'Hidden Features',
        'settings.undoLimit': 'Lasso Undo Limit (3-10)',
        'settings.resetAll': 'Reset All Settings',
        'settings.issueAuthBtn': 'Issue Auth Key',
        'settings.helpBtn': 'Help',

        'auth.welcomeTitle': 'Auth & Trial Guide',
        'auth.welcomeMsg': 'You can try all features without authentication, but PNG export is limited outside Basic mode.',
        'auth.btnTry': 'Try it out',
        'auth.btnGoAuth': 'Go to Auth',
        'auth.promptTitle': 'Authentication Required',
        'auth.prompt': 'Please enter a valid Auth Key.',
        'auth.success': 'Authentication Successful',
        'auth.failed': 'Authentication Failed',
        'auth.verified': 'Verified',
        'auth.unverified': 'Unverified',
        'settings.solidExt': 'Hidden Features',
        'settings.undoLimit': 'Lasso Undo Limit (3-10)',
        'settings.resetAll': 'Reset All Settings',
        'settings.issueAuthBtn': 'Issue Auth Key',
        'settings.helpBtn': 'Help',

        'terms.link': 'ToS',
        'privacy.link': 'Privacy',
        'refund.link': 'Refund',

        // Errors
        'error.sizeMismatch': 'Image dimension mismatch ({{w1}}x{{h1}} vs {{w2}}x{{h2}}).',
        'error.unsupportedFormat': 'Unsupported format. Use PNG, JPEG, or WebP.',
        'error.loadFailed': 'Failed to load image: {{msg}}',
        'error.exportFailed': 'Export failed: {{msg}}',
        'error.noExportData': 'No data to export.',

        // Custom Dialogs
        'dialog.ok': 'OK',
        'dialog.cancel': 'Cancel',
        'dialog.yes': 'Yes',
        'dialog.no': 'No',
        'dialog.inputPlaceholder': 'Enter Auth Key...',
        'dialog.openFull': 'Open in full page',
        'dialog.close': 'Close',

        // Help (Bento Cards - Right Side)
        'help.btn': 'Usage',
        'help.bento.intro.title': '<h3 class="help-title">● Tool Introduction</h3>',
        'help.bento.intro.desc': '<p>Have you ever wanted to extract images that use semi-transparency or glow effects?<br>Even with AI background removal, semi-transparency and glows are still difficult to extract.<br>Nanobanana and Midjourney cannot generate transparent PNGs.</p><p>This tool uses black and white background images generated by AI to <br><span class="help-highlight">output clean transparent PNGs with semi-transparency</span>.<br><strong class="help-warn">※ This tool cannot generate input images.</strong><br>It operates locally, and your images are never uploaded to a server.</p><p>※ When creating images you want to make transparent:<br>"Make the background solid black (#000000). Please faithfully reproduce it without moving the position or size."<br>In addition, adding notes like "this part is semi-transparent" or "this part has a glow effect" will help generate them better.<br>AI can be fickle, and positions, colors, or scales may vary. Adjust as needed.</p>',
        'help.bento.basic.keys.title': '<h3 class="help-title">● Shortcuts</h3>',
        'help.bento.basic.keys.desc': '<p>Mouse Wheel: Zoom<br>Space + Left Drag or Wheel Click Drag: Scroll<br>Space + Right Click or Wheel Double Click: Fit to Screen<br>[A] key to invert the background setting.</p>',

        'help.bento.basic.steps.title': '<h3 class="help-title">● Quick Steps</h3>',
        'help.bento.basic.steps.desc': '<p>Drag and drop black/white images.<br>Press the PNG Export button. That is it.<br><strong class="help-warn">※ In guest mode, noise removal features are disabled.</strong><br>If you want to refine it, <span class="help-highlight">go to Trash Mode.</span></p>',

        'help.bento.trash.intro.title': '<h3 class="help-title">● What is Trash Mode?</h3>',
        'help.bento.trash.intro.desc': '<p>AI images look clean at first glance, but they contain a lot of noise.<br>Adjust the noise threshold to force <span class="help-highlight">background noise to transparency</span>.<br>Be careful not to overdo it, or you will erase necessary parts.<p>The noise-removed alpha is reflected in the Basic Mode image.<br>Return to Basic Mode to export.<br>If you want to refine further, <span class="help-highlight">go to Solid Mode.</span></p>',
        'help.bento.trash.keys.title': '<h3 class="help-title">● Shortcuts</h3>',
        'help.bento.trash.keys.desc': '<p>Mouse Wheel: Zoom<br>Space + Left Drag or Wheel Click Drag: Scroll<br>Space + Right Click or Wheel Double Click: Fit to Screen<br>[A] key to invert the background setting.</p><h4>Lasso</h4><p>Left Drag: Erase alpha<br>Right Drag: Restore<br>Alt + Click: Draw straight lines<br>[Z] key to use Lasso while using multipliers.</p>',

        'help.bento.solid.intro.title': '<h3 class="help-title">● What is Solid Mode?</h3>',
        'help.bento.solid.intro.desc': '<p>Extraction via black-and-white comparison leaves transparency even in solid (should-be-opaque) areas.<br>Adjust the opacity threshold to force <span class="help-highlight">solid areas to complete opacity</span>.<br>Overdoing it will also make semi-transparent or glow areas opaque, so avoid over-adjusting.<p>Press the Fill button to fill in missed spots.<br>Capture and export using the Lasso tool.<br>PNG output button for completion.</p><p>Since you edit the white mask, it is recommended to edit with Visualization ON.<br>If you are used to it, you can turn on Preview and Comparison and just fix the parts you care about while comparing images.</p><h4 class="help-title no-border">● Finally</h4>If you want to know more, please click the icon in the top left.',
        'help.bento.solid.keys.title': '<h3 class="help-title">● Shortcuts</h3>',
        'help.bento.solid.keys.desc': '<p>Mouse Wheel: Zoom<br>Space + Left Drag or Wheel Click Drag: Scroll<br>Space + Right Click or Wheel Double Click: Fit to Screen<br>[A] key to invert the background setting.</p><h4>Lasso</h4><p>Left Drag: Make opaque<br>Right Drag: Restore<br>Alt + Click: Draw straight lines<br>[Z] key to use Lasso while using multipliers.</p>',

        'help.bento.settings.intro.title': '● Settings Window',
        'help.bento.settings.intro.desc': '<p>Configure application-wide settings and enable hidden features here.<br>Settings are saved in the browser.</p>',

        'help.bento.basic.samples.title': '<h3 class="help-title" style="display:flex; align-items:center; gap:10px;">●Sample Images<a href="./samples_lp/index.html" target="_blank" class="help-lp-link">Check extraction samples here</a></h3>',
        'help.bento.basic.samples.desc': '<p class="sample-intro">You can download sample images here that can be used as input images.</p>' +
            '<div class="sample-grid">' +
            '<div class="sample-item"><img src="./image/Sample01_Thms.jpg" loading="lazy"><div><span>01:Jellyfish(Trans)</span><a href="./image/Sample01_Black.jpg" download>Download Black BG</a><a href="./image/Sample01_White.jpg" download>Download White BG</a></div></div>' +
            '<div class="sample-item"><img src="./image/Sample02_Thms.jpg" loading="lazy"><div><span>02:Trans/Glow/Solid</span><a href="./image/Sample02_Black.jpg" download>Download Black BG</a><a href="./image/Sample02_White.jpg" download>Download White BG</a><a href="./image/Sample02_mask.png" download style="color: #ffeb3b; font-weight: bold;">Download Custom Matte</a></div></div>' +
            '<div class="sample-item"><img src="./image/Sample03_Tthms.jpg" loading="lazy"><div><span>03:Hair</span><a href="./image/Sample03_Black.jpg" download>Download Black BG</a><a href="./image/Sample03_White.jpg" download>Download White BG</a></div></div>' +
            '<div class="sample-item"><img src="./image/Sample04_Thms.jpg" loading="lazy"><div><span>04:Art(Trans)</span><a href="./image/Sample04_Black.jpg" download>Download Black BG</a><a href="./image/Sample04_White.jpg" download>Download White BG</a></div></div>' +
            '<div class="sample-item"><img src="./image/Sample05_Thms.jpg" loading="lazy"><div><span>05:Lace</span><a href="./image/Sample05_Black.jpg" download>Download Black BG</a><a href="./image/Sample05_White.jpg" download>Download White BG</a></div></div>' +
            '<div class="sample-item"><img src="./image/Sample06_Thms.jpg" loading="lazy"><div><span>06:Icon</span><a href="./image/Sample06_Black.jpg" download>Download Black BG</a><a href="./image/Sample06_White.jpg" download>Download White BG</a></div></div>' +
            '</div>',

        // Help (Tooltips - Left Side)
        'help.tip.basic.input': '<p>Drag and drop black and white background images of the same size.<br>Misalignments will be automatically corrected.</p>',
        'help.tip.basic.logic': '<p><strong>Avg:</strong> Provides general and natural results.<br><strong>Max/Lum:</strong> Use these if the brightness or color changes slightly.</p>',
        'help.tip.basic.correction': '<p>Displays the automatically corrected offset values.</p>',
        'help.tip.basic.compare': '<p>You can compare with the original image using the slider.</p>',
        'help.tip.basic.bg': '<p>Allows you to select the preview background color.</p>',
        'help.tip.basic.reset': '<p>Reset this mode.</p>',
        'help.tip.basic.export': '<p>Outputs a transparent PNG.<br>※ Trash mode logic is disabled when unauthenticated.</p>',

        'help.tip.basic.curveSolid': '<p>Alpha values above this threshold will be forced to fully opaque.</p>',
        'help.tip.basic.curvePreserve': '<p>The higher the value, the more strongly semi-transparent areas are protected.</p>',

        'help.tip.trash.thres': '<p>Removes noise that is close to transparent.</p>',
        'help.tip.trash.align': '<p>Manually adjust the alignment.<br>If images are misaligned, dark spots will appear in opaque areas.<br>Adjust so the overall image becomes as white as possible.</p>',
        'help.tip.trash.matte': '<p>Areas outside the selection become entirely transparent.<br>Garbage matte feature.</p>',
        'help.tip.trash.matteNudge': '<p>Fine-tune the garbage matte area.</p>',
        'help.tip.trash.binary': '<p>Visualizes any existing dots, even a single one, as white.</p>',
        'help.tip.trash.alpha': '<p>Visualizes the alpha state.</p>',
        'help.tip.trash.preview': '<p>Displays the image with alpha applied.<br>In Binary mode, it overlays on white.</p>',
        'help.tip.trash.applySolid': '<p>Bakes the solid areas edited in Solid Mode into the alpha.<br>Normally, there is no need to use this.</p>',
        'help.tip.trash.aa': '<p>Smooths the lasso boundary with anti-aliasing.</p>',
        'help.tip.trash.reset': '<p>Reset this mode.</p>',
        'help.tip.trash.bg': '<p>Choose the background color.</p>',
        'help.tip.trash.compare': '<p>Compare with original image using the slider.</p>',
        'help.tip.trash.export': '<p>Outputs a black/white matte (Binary) or alpha matte (Alpha).<br>Use as a custom matte or underlay in external tools.<br>※ Export is not available when unauthenticated.</p>',

        'help.tip.solid.level': '<p>Force near-opaque areas to complete opacity.<br>Adjust until it is filled with [Blue] to some extent.</p>',
        'help.tip.solid.custom': '<p>I assume you are an advanced user if you are here.<br>Optionally load a custom matte image.</p>',
        'help.tip.solid.preview': '<p>Displays the image with alpha applied.</p>',
        'help.tip.solid.viz': '<p>Visualizes completely opaque areas in [Green].</p>',
        'help.tip.solid.fill': '<p>Automatically fills missing areas.<br>Executing turns [Blue] into [Green].<br>Fix remaining holes using the lasso tool.</p>',
        'help.tip.solid.dist': '<p>For the fill logic.<br>Be careful as too large a value may fill outside the solid areas.</p>',
        'help.tip.solid.reset': '<p>Reset this mode.</p>',
        'help.tip.solid.bg': '<p>Choose the background color.</p>',
        'help.tip.solid.compare': '<p>Compare with original image using the slider.</p>',
        'help.tip.solid.aaWidth': '<p>Width of the outline to secure for anti-aliasing.</p>',
        'help.tip.solid.aaThres': '<p>Alpha threshold recognized as anti-aliasing.<br>Press [S] key to set alpha from the cursor position.</p>',
        'help.tip.solid.export': '<p>Outputs the image with opaque areas applied.<br>※ Export is not available when unauthenticated.</p>',

        'help.tip.settings.lang': '<strong>Language</strong><p>Switch between Japanese and English.</p>',
        'help.tip.settings.issueAuth': '<strong>Issue Auth</strong><p>Issue an authentication key.</p>',
        'help.tip.settings.auth': '<strong>Auth Key</strong><p>Unlock high-quality export features.</p>',
        'help.tip.settings.speed': '<strong>Speed Priority</strong><p>For low-spec PCs. Reduces quality during alignment for faster feedback.</p>',
        'help.tip.settings.auto': '<strong>Auto Align</strong><p>Automatically detects and corrects image offsets.</p>',
        'help.tip.settings.ext': '<strong>Solid Extension</strong><p>Enables experimental Solid Mode features.</p>',
        'help.tip.settings.undo': '<strong>Undo Limit</strong><p>Set the number of steps to keep for Lasso undo.</p>',
        'help.tip.settings.reset': '<strong>Reset All</strong><p>Clear all settings to factory defaults.</p>',
    },
    ja: {
        // Tabs
        'tab.basic': '基本',
        'tab.trash': 'ゴミ取り',
        'tab.solid': '不透明化',

        // Basic
        'basic.title': '基本モード（初心者）',
        'basic.inputImages': '入力画像',
        'basic.logicMax': 'Logic:Max法',
        'basic.logicAvg': 'Logic:平均法',
        'basic.logicLum': 'Logic:Lum法',
        'basic.blackInput': '黒背景',
        'basic.whiteInput': '白背景',
        'basic.background': '背景',
        'basic.checker': '🏁 透明',
        'basic.color': '🎨 カラー',
        'basic.export': 'PNG出力',
        'basic.correction': '補正値',
        'basic.resetAll': '↺ リセット',

        // カーブ（ソリッド＆半透明保護）
        'basic.curveTitle': 'ソリッド＆半透明保護カーブ',
        'basic.curveSolid': '定着ライン (S)',
        'basic.curvePreserve': '保護パワー (P)',

        // Trash
        'trash.title': 'ゴミ取りモード（中級者）',
        'trash.adjustPos': '📍 位置調整',
        'trash.adjustMsg1': '↑↓←→ で位置調整\nENTER or ここをクリックで確定',
        'trash.btnTrash': '🔳 2値表示',
        'trash.btnAlpha': 'アルファ表示',
        'trash.btnShowBasic': '◎ プレビュー',
        'trash.btnShowBasicOn': '👀 プレビュー',
        'trash.threshold': 'ノイズ閾値',
        'trash.editMatte': '📐 除外範囲設定',
        'trash.matteMsg1': 'ドラッグで範囲選択\nENTER or ここをクリックで確定',
        'trash.top': '上',
        'trash.bottom': '下',
        'trash.left': '左',
        'trash.right': '右',
        'trash.penSize': 'ペンサイズ',
        'trash.antiAlias': '🌗 アンチエイリアス',
        'trash.applySolid': '⚡ ソリッド焼付',
        'trash.reset': '↺ リセット',
        'trash.export': 'PNG出力',

        // Solid
        'solid.title': 'ソリッドモード（上級者）',
        'solid.dropMatte': '✍自作マットをロード',
        'solid.adjustMsg1': '↑↓←→ で位置調整\nENTER or ここをクリックで確定',
        'solid.viewMode': '表示モード',
        'solid.compositeOff': '◎プレビュー',
        'solid.compositeOn': '👀プレビュー',
        'solid.vizActions': '可視化 & 充填',
        'solid.solidViz': '👀 可視化',
        'solid.rayFill': '🎯 充填',
        'solid.solidLevel': '不透明度閾値',
        'solid.rayDist': '探索距離',
        'solid.raycast': '拡張・縮小',
        'solid.penSize': 'ペンサイズ',
        'solid.antiAlias': '🌗 アンチエイリアス',
        'solid.background': '背景',
        'solid.checker': '🏁 透明',
        'solid.color': '🎨 カラー',
        'solid.reset': '↺ リセット',
        'solid.export': 'PNG出力',
        'solid.extCoastlineLogic': '[拡張] Coastline Logic',
        'solid.aaWidth': 'アンチエイリアス幅',
        'solid.aaThres': 'アンチエイリアス閾値',

        // Background
        'bg.label': '背景設定',
        'bg.checker': '🏁 透明',
        'bg.color': '🎨 カラー',
        'bg.comparison': '比較',

        // Alerts
        'alert.noImage': '画像を読み込んでください。',
        'alert.imageOnly': '画像ファイルのみ対応',
        'alert.solidReset': 'ソリッド状態（手動で読み込んだ被り画像含む）をリセットしました。',
        'alert.alphaUpdateConfirm': '生成時アルファに戻してもよろしいですか？\n\n※投げ縄やソリッドのRay充填等で手動編集されたアルファ領域は、生成時の状態にリセットされます。\n（除外範囲で削った部分は維持されます）',
        'alert.alphaUpdateSuccess': 'アルファ状態を生成時に更新しました。',
        'alert.resetSettingsConfirm': 'すべてのアプリケーション設定を初期状態にリセットしてもよろしいですか？（認証キーは保持されます）',

        // Settings
        'settings.title': '設定',
        'settings.language': '言語',
        'settings.authKey': '認証キー',
        'settings.save': '保存',
        'settings.speedPriority': '手動位置調整速度優先（低画質）',
        'settings.autoAlign': '位置自動補正',
        'settings.solidExt': '隠れ機能',
        'settings.undoLimit': '投縄Undo(3～10)',
        'settings.resetAll': '全ての設定を初期化',
        'settings.issueAuthBtn': '認証発行 ',
        'settings.helpBtn': '説明',

        'terms.link': '利用規約',
        'privacy.link': 'プライバシーポリシー',
        'refund.link': '返金について',

        'auth.welcomeTitle': '認証と試用のご案内',
        'auth.welcomeMsg': '未認証状態でもすべての機能を試用いただけますが、\n基本モード以外のPNG出力に制限がかかります。',
        'auth.btnTry': 'とりあえず触る',
        'auth.btnGoAuth': '認証に行く',
        'auth.promptTitle': '認証が必要です',
        'auth.prompt': '有効な認証キーを入力してください。',
        'auth.success': '認証に成功しました',
        'auth.failed': '認証に失敗しました',
        'auth.verified': '認証済み',
        'auth.unverified': '未認証',
        'auth.reqAuth': '認証が必要',
        'auth.statusAuthenticated': '認証済',
        'auth.statusLocked': '未認証 (期間限定無料で試せます)',
        'auth.resetAuth': '認証リセット',
        'auth.confirmReset': '認証情報を削除してリロードしますか？',
        'auth.promptMsg': 'この操作には認証が必要です。',

        // Errors
        'error.sizeMismatch': '画像サイズが一致しません ({{w1}}x{{h1}} vs {{w2}}x{{h2}})。同じサイズの画像を使用してください。',
        'error.unsupportedFormat': '未対応の画像形式です。PNG, JPEG, WebP等を使用してください。',
        'error.loadFailed': '画像の読み込みに失敗しました: {{msg}}',
        'error.exportFailed': 'エクスポートに失敗しました: {{msg}}',
        'error.noExportData': 'エクスポートするデータがありません。',

        // Custom Dialogs
        'dialog.ok': 'OK',
        'dialog.cancel': 'キャンセル',
        'dialog.yes': 'はい',
        'dialog.no': 'いいえ',
        'dialog.inputPlaceholder': '認証キーを入力してください。',
        'dialog.openFull': '全画面で表示',
        'dialog.close': '閉じる',

        // Help (Bento Cards - Right Side)
        'help.btn': '使い方',
        'settings.helpBtn': '説明',

        'help.bento.intro.title': '<h3 class="help-title">●ツール紹介</h3>',
        'help.bento.intro.desc': '<p>半透明やグロー効果（発光）を含んだ画像を、<span class="help-highlight">綺麗に切り抜きたい</span>と思ったことはありませんか？<br>AI背景除去を使っても、依然として半透明部分の抽出は困難です。<br>NanobananaやMidjourneyは透過PNGを生成できません。</p><p>このツールは、同じ被写体の黒/白背景画像から、<span class="help-highlight">半透明を綺麗に抜くPNG出力ツール</span>です。<br><strong class="help-warn">※このツール自体に入力画像を生成する機能はありません。</strong><br>ブラウザ（ローカル）で完結し、画像がサーバに送信されることはありません。</p><p>※入力画像を生成するコツ<br>「背景を黒単色（#000000）にして下さい。位置や大きさなどは動かさず忠実に再現して下さい」<br>さらに「xxの部分は半透明」「xxにはグロー効果が掛かっている」などと補足すると精度が上がります。<br>AIは気まぐれで、位置や色味、縮尺が異る場合があります。ご注意下さい。</p>',
        'help.bento.basic.keys.title': '<h3 class="help-title">●キー・マウス操作一覧</h3>',
        'help.bento.basic.keys.desc': '<p>ホイールで拡大縮小します。<br>スペース＋左ドラッグ（またはホイールクリック）でスクロール<br>スペース＋右クリック（またはホイールダブルクリック）で画面フィット<br>[A]キーを押している間は背景設定が一時的に反転します。</p>',

        'help.bento.basic.steps.title': '<h3 class="help-title">●手順概要</h3>',
        'help.bento.basic.steps.desc': '<p>黒背景・白背景の2枚の画像をD&D（ドラッグ＆ドロップ）。<br>「PNG出力」ボタンを押す。以上。<br><strong class="help-warn">※未認証の状態では、ノイズ除去機能は適用されません。</strong><br>さらに細かく調整したい場合は<span class="help-highlight">ゴミ取りモードへ。</span></p>',

        'help.bento.trash.intro.title': '<h3 class="help-title">●ゴミ取りモードとは</h3>',
        'help.bento.trash.intro.desc': '<p>一見綺麗に見えるAI画像も、背景には微細なノイズが大量に残っています。<br>ここではノイズ閾値を調整し<span class="help-highlight">背景ノイズを透明に追い込みます。</span><br>数値を上げすぎると、必要なディテールまで削れるため注意してください。</p><p>除去した結果は基本モードに反映されます。<br>調整が終わったら、基本モードに戻って出力してください。<br>さらに不透明部分を補正したい場合は<span class="help-highlight">ソリッドモードへ。</span></p>',
        'help.bento.trash.keys.title': '<h3 class="help-title">●キー・マウス操作一覧</h3>',
        'help.bento.trash.keys.desc': '<p>ホイールで拡大縮小します。<br>スペース＋左ドラッグ（またはホイールクリック）でスクロール<br>スペース＋右クリック（またはホイールダブルクリック）で画面フィット<br>[A]キーを押している間は背景設定が一時的に反転します。</p><h4>投縄</h4><p>左ドラッグでアルファを削ります。<br>右ドラッグで元に戻します。<br>Altを押しながらクリックすると多角形で囲めます。<br>[Z]キーを押している間は、比較スライダー操作中も投げ縄機能を強制的にオンにします。<br>Ctrl+ZでUndoできます。</p>',

        'help.bento.solid.intro.title': '<h3 class="help-title">●ソリッドモードとは...</h3>',
        'help.bento.solid.intro.desc': '<p>黒白比較の抽出では、本来ソリッド（完全な不透明）であるべき部分にも透過情報が残ります。<br>不透明度閾値を調整して<span class="help-highlight">ソリッド部分を完全な不透明に追い込みます。</span></p><p>下げすぎると半透明やグロー、アンチエイリアスの部分まで不透明にしてしまうので、やり過ぎは禁物です。<br>そもそも半透明が主体の場合はココの編集は不要です。</p><p>「充填」ボタンで塗り残しを自動補正し、細かい部分は「投げ縄」で修正してください。<br>PNG出力ボタンで完成です。</p><p>白を編集するので、可視化オンで編集するのがオススメです。<br>慣れてきたらプレビューと比較をオンにして、比較しながら気になる所だけ修正するのがオススメです。</p><h4 class="help-title no-border">●最後に</h4>もっと詳しく知りたい方は、左上のアイコンからどうぞ。',
        'help.bento.solid.keys.title': '<h3 class="help-title">●キー・マウス操作一覧</h3>',
        'help.bento.solid.keys.desc': '<p>ホイールで拡大縮小します。<br>スペース＋左ドラッグ（またはホイールクリック）でスクロール<br>スペース＋右クリック（またはホイールダブルクリック）で画面フィット<br>[A]キーを押している間は背景設定が一時的に反転します。</p><h4>投縄</h4><p>左ドラッグで不透明にします。<br>右ドラッグで元に戻します。<br>Altを押しながらクリックすると多角形で囲めます。<br>[Z]キーを押している間は、比較スライダー操作中も投げ縄機能を強制的にオンにします。<br>Ctrl+ZでUndoできます。</p>',

        'help.bento.basic.samples.title': '<h3 class="help-title" style="display:flex; align-items:center; gap:10px;">●サンプル画像<a href="./samples_lp/index.html" target="_blank" class="help-lp-link">切り抜きサンプルはこちらから</a></h3>',
        'help.bento.basic.samples.desc': '<p class="sample-intro">入力画像のサンプルをダウンロードすることができます。</p>' +
            '<div class="sample-grid">' +
            '<div class="sample-item"><img src="./image/Sample01_Thms.jpg" loading="lazy"><div><span>01:クラゲ(半透明)</span><a href="./image/Sample01_Black.jpg" download>黒背景ダウンロード</a><a href="./image/Sample01_White.jpg" download>白背景ダウンロード</a></div></div>' +
            '<div class="sample-item"><img src="./image/Sample02_Thms.jpg" loading="lazy"><div><span>02:半透明、グロー、ソリッド混在</span><a href="./image/Sample02_Black.jpg" download>黒背景ダウンロード</a><a href="./image/Sample02_White.jpg" download>白背景ダウンロード</a><a href="./image/Sample02_mask.png" download style="color: #ffeb3b; font-weight: bold;">自作マットダウンロード</a></div></div>' +
            '<div class="sample-item"><img src="./image/Sample03_Tthms.jpg" loading="lazy"><div><span>03:髪の毛</span><a href="./image/Sample03_Black.jpg" download>黒背景ダウンロード</a><a href="./image/Sample03_White.jpg" download>白背景ダウンロード</a></div></div>' +
            '<div class="sample-item"><img src="./image/Sample04_Thms.jpg" loading="lazy"><div><span>04:創作物(半透明)</span><a href="./image/Sample04_Black.jpg" download>黒背景ダウンロード</a><a href="./image/Sample04_White.jpg" download>白背景ダウンロード</a></div></div>' +
            '<div class="sample-item"><img src="./image/Sample05_Thms.jpg" loading="lazy"><div><span>05:レース</span><a href="./image/Sample05_Black.jpg" download>黒背景ダウンロード</a><a href="./image/Sample05_White.jpg" download>白背景ダウンロード</a></div></div>' +
            '<div class="sample-item"><img src="./image/Sample06_Thms.jpg" loading="lazy"><div><span>06:アイコン</span><a href="./image/Sample06_Black.jpg" download>黒背景ダウンロード</a><a href="./image/Sample06_White.jpg" download>白背景ダウンロード</a></div></div>' +
            '</div>',

        'help.bento.settings.intro.title': '●設定画面',
        'help.bento.settings.intro.desc': '<p>アプリケーション全体の動作設定や隠し機能の有効化を行います。<br>設定内容はブラウザに保存されます。</p>',

        // Help (Tooltips - Left Side)
        'help.tip.basic.input': '<p>同サイズの黒/白背景画像をD&Dして下さい。<br>ズレがある場合は自動で補正します。</p>',
        'help.tip.basic.logic': '<p><strong>平均法:</strong>一般的で自然な結果が得られます。<br><strong>Max法/Lum法:</strong>輝度や色味が少し変化します。</p>',
        'help.tip.basic.correction': '<p>自動で補正された値を表示します。</p>',
        'help.tip.basic.compare': '<p>スライダーで元画像と比較できます。</p>',
        'help.tip.basic.bg': '<p>背景色を選択できます。</p>',
        'help.tip.basic.reset': '<p>このモードをリセットします。</p>',
        'help.tip.basic.export': '<p>透過PNGを出力します。<br>※未認証時はゴミ取りが無効になります。</p>',

        'help.tip.basic.curveSolid': '<p>この閾値以上のアルファが完全不透明に引き上げられます。</p>',
        'help.tip.basic.curvePreserve': '<p>値が高いほど半透明部分が強く保護されます。</p>',

        'help.tip.trash.thres': '<p>透明に近いノイズを除去します。</p>',
        'help.tip.trash.align': '<p>手動で位置を調整します。<br>画像がズレていると不透明部分に暗い場所が沢山できます。<br>なるべく全体が白くなるように調整して下さい。</p>',
        'help.tip.trash.matte': '<p>D&D範囲外が全て透明になります。<br>ガベージマット機能。</p>',
        'help.tip.trash.matteNudge': '<p>ガベージマットの微調整ができます。</p>',
        'help.tip.trash.binary': '<p>1ドットでも存在している場所を白で視覚化します。</p>',
        'help.tip.trash.alpha': '<p>アルファの状態を視覚化します。</p>',
        'help.tip.trash.preview': '<p>アルファを適用した画像を表示します。<br>二値の場合は白の上に乗せます。</p>',
        'help.tip.trash.applySolid': '<p>ソリッドモードで編集したソリッド部分をアルファに焼き付けます。<br>通常利用する必要はありません。</p>',
        'help.tip.trash.aa': '<p>投縄の境界を滑らかにします。</p>',
        'help.tip.trash.reset': '<p>このモードをリセットします。</p>',
        'help.tip.trash.bg': '<p>背景色を選択できます。</p>',
        'help.tip.trash.compare': '<p>スライダーで元画像と比較できます。</p>',
        'help.tip.trash.export': '<p>二値の場合は白黒マット。<br>アルファの場合はアルファマットを出力します。<br>外部ツールで自作マットや下敷きとしてご活用ください。<br>※未認証時は出力できません。</p>',

        'help.tip.solid.level': '<p>不透明に近い場所を完全な不透明に追い込みます。<br>ある程度[青]で埋まるまで調整して下さい。</p>',
        'help.tip.solid.custom': '<p>ここを触っている人は上級者ですよね。<br>任意で自作マットをロードできます。</p>',
        'help.tip.solid.preview': '<p>アルファが適用された画像を表示します。</p>',
        'help.tip.solid.viz': '<p>完全不透明部分を[緑]で可視化します。</p>',
        'help.tip.solid.fill': '<p>漏れた部分を自動で埋めます。<br>ショットすると[青]が[緑]に変わります。<br>埋まりきらない部分を投縄で修正して下さい。</p>',
        'help.tip.solid.dist': '<p>穴埋めロジック用。<br>あまり大きくするとソリッド外まで塗り潰してしまうので注意が必要です。</p>',
        'help.tip.solid.reset': '<p>このモードをリセットします。</p>',
        'help.tip.solid.bg': '<p>背景色を選択できます。</p>',
        'help.tip.solid.compare': '<p>スライダーで元画像と比較できます。</p>',
        'help.tip.solid.aaWidth': '<p>アンチエイリアスとして確保する輪郭の幅。',
        'help.tip.solid.aaThres': '<p>アンチエイリアスとして認識する透明度。<br>[S]キーでカーソルのアルファ値が設定されます。',
        'help.tip.solid.export': '<p>不透明部分が適用された画像を出力します。<br>※未認証時は出力できません。</p>',

        'help.tip.settings.lang': '<p>言語を切り替えます。</p>',
        'help.tip.settings.issueAuth': '<p>認証キーを発行します。</p>',
        'help.tip.settings.auth': '<p>個別キーで認証を行います。<br>未認証でも全ての機能が使えますが、基本モード以外のPNG出力が制限されます。</p>',
        'help.tip.settings.speed': '<p>低スペックPC用。<br>手動位置補正時、低画質で速度を優先します。</p>',
        'help.tip.settings.ext': '<p>隠れ機能をonにします。</p>',
        'help.tip.settings.auto': '<p>自動で位置を補正します。</p>',
        'help.tip.settings.undo': '<p>Undo回数を設定します。</p>',
        'help.tip.settings.reset': '<p>認証キーは残ります。</p>',
    }
};

let currentLang = localStorage.getItem('aaronAlpha_lang') || 'ja';
let activeTooltipElement = null;

/**
 * Get translated text for a key
 * @param {string} key - Translation key
 * @returns {string} Translated text
 */
export function t(key, params = {}) {
    const dict = dictionaries[currentLang] || dictionaries.ja;
    let text = dict[key] || key;

    // Replace placeholders: {{key}} -> value
    if (params) {
        Object.keys(params).forEach(k => {
            const needle = `{{${k}}}`;
            // Use split/join for simple replaceAll behavior
            text = text.split(needle).join(params[k]);
        });
    }

    return text;
}

/**
 * Get current language code
 * @returns {string} 'en' or 'ja'
 */
export function getCurrentLang() {
    return currentLang;
}

/**
 * Set language and update all [data-i18n] elements in the DOM
 * @param {string} lang - 'en' or 'ja'
 */
export function setLang(lang) {
    if (!dictionaries[lang]) return;
    currentLang = lang;
    localStorage.setItem('aaronAlpha_lang', lang);
    applyAll();
}

/**
 * Strip HTML tags and convert <br>/<p> to newlines for title attributes
 */
function stripHtmlForTitle(html) {
    let text = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n');
    // 【指示通り】「。」で改行を入れる
    text = text.replace(/。/g, '。\n');
    const tmp = document.createElement('DIV');
    tmp.innerHTML = text;
    // 3つ以上の改行を2つに絞る。文末の空白を消す。
    return (tmp.textContent || tmp.innerText || '').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Show global help tooltip at specific position
 */
function showGlobalTooltip(text, targetEl) {
    const tooltip = document.getElementById('global-help-tooltip');
    if (!tooltip || !text) return;

    let styledText = text.replace(/\n/g, '<br>');

    // 【指示通り】着色処理
    styledText = styledText.split('<br>').map(line => {
        const trimmed = line.startsWith('<strong>') ? line.substring(line.indexOf('>') + 1, line.indexOf('</strong')) : line.trim();
        // ※で始まる行を赤色にする
        if (trimmed.startsWith('※')) {
            return `<span style="color: #ff4c4c; font-weight: bold;">${line}</span>`;
        }
        return line;
    }).join('<br>');

    // 【指示通り】[青] [Blue] を青色、[緑] [Green] を緑色、その他 [S] などを太字強調にする
    styledText = styledText.replace(/\[(青|Blue)\]/g, '<span style="color: #3b82f6; font-weight: bold;">[$1]</span>');
    styledText = styledText.replace(/\[(緑|Green)\]/g, '<span style="color: #22c55e; font-weight: bold;">[$1]</span>');
    styledText = styledText.replace(/\[(S|Z|A)\]/g, '<span style="font-weight: bold; color: #ffeb3b;">[$1]</span>'); // キー名は黄色で強調

    tooltip.innerHTML = styledText;
    tooltip.style.display = 'block';

    const rect = targetEl.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    // デフォルト位置: 要素の上中央
    let top = rect.top - tooltipRect.height - 10;
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

    // 画面上部からはみ出す場合は、要素の下に表示
    if (top < 10) {
        top = rect.bottom + 10;
    }

    // 画面左右からはみ出さないように調整
    const padding = 10;
    if (left < padding) left = padding;
    if (left + tooltipRect.width > window.innerWidth - padding) {
        left = window.innerWidth - tooltipRect.width - padding;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
}

/**
 * Hide global help tooltip
 */
function hideGlobalTooltip() {
    activeTooltipElement = null;
    const tooltip = document.getElementById('global-help-tooltip');
    if (tooltip) tooltip.style.display = 'none';
}

/**
 * Refresh current active tooltip (used when state changes)
 */
export function refreshHelpTooltip() {
    if (!activeTooltipElement || !document.body.classList.contains('help-active')) return;

    // 現在の要素に対してmouseenterと同じロジックを実行
    let key = activeTooltipElement.getAttribute('data-help-key');
    if (!key) return;

    // ゴミ取りモードの二値/アルファ切り替え対応
    if (key === 'help.tip.trash.binary') {
        const isAlpha = (activeTooltipElement.getAttribute('data-i18n') === 'trash.btnAlpha' || activeTooltipElement.classList.contains('active'));
        if (isAlpha) key = 'help.tip.trash.alpha';
    }

    const text = stripHtmlForTitle(t(key));
    showGlobalTooltip(text, activeTooltipElement);
}

/**
 * Apply translations to all [data-i18n] elements
 */
export function applyAll() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const text = t(key);
        // For <option>, <button>, <span>, <label> etc — set textContent
        // For <input placeholder>, set placeholder
        if (el.tagName === 'OPTION') {
            el.textContent = text;
        } else if (el.hasAttribute('data-i18n-attr')) {
            const attr = el.getAttribute('data-i18n-attr');
            el.setAttribute(attr, text);
        } else {
            el.textContent = text;
        }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const text = stripHtmlForTitle(t(key));
        el.setAttribute('data-tooltip', text); // 互換性のために残す
        el.removeAttribute('title');

        // グローバルツールチップのバインド
        el.addEventListener('mouseenter', () => {
            showGlobalTooltip(text, el);
        });
        el.addEventListener('mouseleave', hideGlobalTooltip);
    });

    // 【新仕様】ヘルプ用ツールチップの生成（グローバル方式）
    document.querySelectorAll('[data-help-key]').forEach(el => {
        el.addEventListener('mouseenter', () => {
            // AppController.isHelpActive を直接見るのは難しい(i18nは独立)ため、
            // body.help-active クラスの有無で判断する
            if (document.body.classList.contains('help-active')) {
                activeTooltipElement = el; // アクティブな要素を記録

                let key = el.getAttribute('data-help-key');

                // 【指示通り】ゴミ取りモードの二値/アルファ切り替え対応
                if (key === 'help.tip.trash.binary') {
                    // ボタンの textContent または data-i18n で状態を判断
                    const isAlpha = (el.getAttribute('data-i18n') === 'trash.btnAlpha' || el.classList.contains('active'));
                    // 実際には btn-show-alpha クリックでクラスが制御されているはず
                    if (isAlpha) key = 'help.tip.trash.alpha';
                }

                const text = stripHtmlForTitle(t(key));
                showGlobalTooltip(text, el);
            }
        });
        el.addEventListener('mouseleave', hideGlobalTooltip);
    });
}
