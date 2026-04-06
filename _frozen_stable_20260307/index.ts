/**
 * AaronAlpha Cloudflare Workers - Polar.sh License & Auth Manager
 */
import { Webhook } from 'standardwebhooks';

export interface Env {
    AUTH_KV: KVNamespace;
    POLAR_WEBHOOK_SECRET: string;
    POLAR_ORGANIZATION_ID: string;
    POLAR_ACCESS_TOKEN: string;
    AUTH_SECRET: string; // HMAC-SHA256 署名用の共通鍵
}

// CORS Headers for allowing requests from the AaronAlpha local app
const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Required for local file:// usage
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// =============================================
// HMAC-SHA256 署名ユーティリティ
// =============================================

/**
 * HMAC-SHA256 署名を生成する (Cloudflare Workers の Web Crypto API を使用)
 */
async function createHmacSignature(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(payload);

    const key = await crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, msgData);
    const sigArray = new Uint8Array(signature);

    // バイト列を16進文字列に変換
    return Array.from(sigArray).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 署名付きトークンを生成する
 * 形式: Base64("{payload_json}.{signature_hex}")
 */
async function createSignedToken(key: string, secret: string): Promise<string> {
    const ts = Math.floor(Date.now() / 1000); // UNIX タイムスタンプ (秒)
    const payloadJson = JSON.stringify({ key, ts });
    const signatureHex = await createHmacSignature(payloadJson, secret);
    const tokenRaw = `${payloadJson}.${signatureHex}`;
    return btoa(tokenRaw); // Base64 エンコード
}

// =============================================
// メインルーター
// =============================================

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);

        // 1. Handle CORS Preflight (OPTIONS request)
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // 2. Routing
        if (request.method === 'POST') {
            if (url.pathname === '/webhook/polar') {
                return await handlePolarWebhook(request, env);
            } else if (url.pathname === '/verify') {
                return await handleVerify(request, env);
            }
        } else if (request.method === 'GET') {
            if (url.pathname === '/success') {
                return await handleSuccess(request, env);
            } else if (url.pathname === '/check-status') {
                return await handleCheckStatus(request, env);
            } else if (url.pathname === '/config') {
                return await handleConfig(request, env);
            } else if (url.pathname === '/test-kv') {
                await env.AUTH_KV.put('debug:sanity-check', 'IT WORKS!');
                return new Response('KV put executed', { status: 200 });
            }
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });
    },
};

/**
 * Handle Config Request
 */
async function handleConfig(request: Request, env: Env): Promise<Response> {
    try {
        const mode = await env.AUTH_KV.get('APP_MODE') || 'free';
        return new Response(JSON.stringify({ mode }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ mode: 'free' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Handle Webhooks from Polar.sh
 */
async function handlePolarWebhook(request: Request, env: Env): Promise<Response> {
    try {
        const bodyText = await request.text();

        // --- EMERGENCY DEBUG STRATEGY ---
        const payload = JSON.parse(bodyText);
        await env.AUTH_KV.put(`debug:webhook:${payload.type}:${Date.now()}`, bodyText, { expirationTtl: 3600 * 24 });

        // 1. Verify Signature
        const isVerified = await verifyPolarSignature(request, bodyText, env.POLAR_WEBHOOK_SECRET);
        if (!isVerified) {
            await env.AUTH_KV.put('debug:verify_status', 'FAILED', { expirationTtl: 3600 });
            console.error('Webhook Error: Invalid signature');
            return new Response('Invalid signature', { status: 401 });
        }

        await env.AUTH_KV.put('debug:verify_status', 'SUCCESS', { expirationTtl: 3600 });

        // 2. Process Event
        const eventType = payload.type;
        console.log(`[Polar Webhook] Received event: ${eventType} (ID: ${payload.id || 'N/A'})`);

        if (eventType === 'benefit_grant.created' || eventType === 'benefit_grant.updated') {
            const displayKey = payload.data?.properties?.display_key;
            const licenseKeyId = payload.data?.properties?.license_key_id;
            const orderId = payload.data?.order_id;
            const customerEmail = payload.data?.customer?.email || 'unknown';

            if (!licenseKeyId) {
                console.log('[Polar Webhook] No license_key_id found in properties. Skipping.');
                return new Response('Event processed, no license key action required', { status: 200 });
            }

            console.log(`[Polar Webhook] Found License Grant for key ID: ${licenseKeyId}, Order: ${orderId}. Fetching full key...`);

            let fullLicenseKey: string | null = null;
            let checkoutId: string | null = null;

            // Step 1: Fetch full license key from API
            if (env.POLAR_ACCESS_TOKEN) {
                try {
                    const keyRes = await fetch(`https://api.polar.sh/v1/license-keys/${licenseKeyId}`, {
                        headers: {
                            'Authorization': `Bearer ${env.POLAR_ACCESS_TOKEN}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (keyRes.ok) {
                        const keyData = await keyRes.json() as any;
                        if (keyData.key) {
                            fullLicenseKey = keyData.key;
                            console.log('[Polar Webhook] Successfully fetched full license key from API.');
                        }
                    }
                } catch (e) {
                    console.error(`[Polar Webhook] Error fetching full key: ${e}`);
                }
            }

            // Step 2: Resolve Checkout ID using Order API
            if (orderId && env.POLAR_ACCESS_TOKEN) {
                try {
                    console.log(`[Polar Webhook] Attempting ROYAL ROAD mapping for Order ${orderId}...`);
                    const orderRes = await fetch(`https://api.polar.sh/v1/orders/${orderId}`, {
                        headers: {
                            'Authorization': `Bearer ${env.POLAR_ACCESS_TOKEN}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (orderRes.ok) {
                        const orderData = await orderRes.json() as any;
                        checkoutId = orderData.checkout_id;
                        console.log(`[Polar Webhook] Successfully mapped Order ${orderId} -> Checkout ${checkoutId} via API.`);
                    } else {
                        console.error(`[Polar Webhook] API Order fetch failed (${orderRes.status}). Check token scopes.`);
                    }
                } catch (e) {
                    console.error(`[Polar Webhook] Error resolving order: ${e}`);
                }
            }

            if (!fullLicenseKey) {
                fullLicenseKey = displayKey || 'ERROR-FETCHING-KEY';
            }

            if (checkoutId) {
                const successInfo = {
                    key: fullLicenseKey,
                    email: customerEmail,
                    raw_date: payload.data?.created_at || new Date().toISOString()
                };
                await env.AUTH_KV.put(`checkout:${checkoutId}`, JSON.stringify(successInfo), { expirationTtl: 3600 });
            }

            if (fullLicenseKey && !fullLicenseKey.includes('****')) {
                await env.AUTH_KV.put(fullLicenseKey, JSON.stringify({
                    valid: true,
                    createdAt: new Date().toISOString(),
                    polar_grant_id: payload.data?.id,
                    email: customerEmail
                }));
            }

            return new Response('Webhook processed successfully', { status: 200 });
        } else if (eventType === 'order.created') {
            console.log(`[Polar Webhook] Order ${payload.data?.id} created.`);
            return new Response('Order logged', { status: 200 });
        }

        return new Response('Event processed, no action required', { status: 200 });

    } catch (error) {
        console.error('Webhook Error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

/**
 * Handle Verify Request from AaronAlpha App
 * [SECURITY UPDATE] 認証成功時に HMAC-SHA256 署名付きトークンを返却する。
 * 旧来の { valid: true } だけでなく、token フィールドを追加。
 */
async function handleVerify(request: Request, env: Env): Promise<Response> {
    try {
        const { key } = await request.json() as { key?: string };
        if (!key) return new Response(JSON.stringify({ valid: false, error: 'Key not provided' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        // 共通鍵: 環境変数から取得 (Rust 側と同一の鍵)
        const authSecret = env.AUTH_SECRET || 'AaronAlpha_SecureAuth_2026_SharedKey';

        // Step 1: KV キャッシュ確認
        const value = await env.AUTH_KV.get(key);
        if (value) {
            let isValid = false;
            try {
                const data = JSON.parse(value);
                if (data === true || (typeof data === 'object' && data !== null && data.valid === true)) isValid = true;
            } catch (e) {
                if (value === 'true' || value === key) isValid = true;
            }
            if (isValid) {
                // [NEW] 署名付きトークンを発行
                const token = await createSignedToken(key, authSecret);
                return new Response(JSON.stringify({ valid: true, token, message: 'Authentication successful' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }

        // Step 2: JIT Verification (Polar API)
        const polarRes = await fetch('https://api.polar.sh/v1/customer-portal/license-keys/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, organization_id: env.POLAR_ORGANIZATION_ID }),
        });

        if (polarRes.ok) {
            const polarData = await polarRes.json() as any;
            if (polarData.status === 'granted' || polarData.status === 'active' || polarData.key) {
                await env.AUTH_KV.put(key, JSON.stringify({ valid: true, jit_at: new Date().toISOString(), polar_id: polarData.id || 'jit-verified' }));
                // [NEW] 署名付きトークンを発行
                const token = await createSignedToken(key, authSecret);
                return new Response(JSON.stringify({ valid: true, token, message: 'Authentication successful (JIT Verified)' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }

        return new Response(JSON.stringify({ valid: false, error: 'Invalid or revoked key' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (error) {
        return new Response(JSON.stringify({ valid: false, error: `Server error: ${error}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
}

/**
 * Utility: Verify Polar Signature
 */
async function verifyPolarSignature(request: Request, payload: string, secret: string): Promise<boolean> {
    if (!secret) return false;
    try {
        const msgId = request.headers.get('webhook-id');
        const msgTimestamp = request.headers.get('webhook-timestamp');
        const signatureHeader = request.headers.get('webhook-signature');
        if (!msgId || !msgTimestamp || !signatureHeader) return false;

        const base64Secret = btoa(secret);
        const wh = new Webhook(base64Secret);
        try {
            wh.verify(payload, { 'webhook-id': msgId, 'webhook-timestamp': msgTimestamp, 'webhook-signature': signatureHeader });
            return true;
        } catch (whError) { return false; }
    } catch (e) { return false; }
}

/**
 * Handle Success Landing Page (GET /success)
 */
async function handleSuccess(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const checkoutId = url.searchParams.get('checkout_id');
    const appMode = await env.AUTH_KV.get('APP_MODE') || 'free';
    const greeting = appMode === 'purchase' ? '🎉 ご購入ありがとうございます！' : 'ご登録ありがとうございます。';

    const html = `
	<!DOCTYPE html>
	<html lang="ja">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>AaronAlpha - ${appMode === 'purchase' ? 'Success' : 'Registration'}</title>
		<style>
			:root { --bg-color: #0f172a; --card-bg: #1e293b; --text-main: #f8fafc; --text-dim: #94a3b8; --accent: #38bdf8; --success: #22c55e; }
			body { font-family: 'Inter', sans-serif; background: var(--bg-color); color: var(--text-main); display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
			.card { background: var(--card-bg); padding: 2.5rem; border-radius: 1.5rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); max-width: 450px; width: 90%; text-align: center; border: 1px solid rgba(255,255,255,0.1); }
			h1 { color: var(--accent); margin-bottom: 0.5rem; font-size: 1.75rem; }
			p { color: var(--text-dim); line-height: 1.6; margin-bottom: 1.5rem; }
			.status-msg { font-size: 0.95rem; color: var(--accent); margin-bottom: 2rem; }
			.key-box { background: rgba(0,0,0,0.3); padding: 1.25rem; border-radius: 0.75rem; font-family: monospace; font-size: 1.1rem; word-break: break-all; border: 1px solid var(--accent); margin: 1.5rem 0; display: none; color: #fff; text-shadow: 0 0 10px rgba(56,189,248,0.5); }
			.info-table { width: 100%; text-align: left; margin: 1.5rem 0; font-size: 0.9rem; border-collapse: collapse; display: none; }
			.info-table td { padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
			.info-label { color: var(--text-dim); width: 80px; }
			.info-value { color: var(--text-main); font-family: monospace; }
			.loader { border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid var(--accent); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
			@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
			.btn-group { display: flex; gap: 10px; justify-content: center; margin-top: 1.5rem; }
			.btn { background: var(--accent); color: #0f172a; border: none; padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s; text-decoration: none; }
			.btn:hover { opacity: 0.9; transform: translateY(-2px); }
			.btn-secondary { background: rgba(255,255,255,0.1); color: var(--text-main); }
			.footer-note { font-size: 0.85rem; color: var(--text-dim); margin-top: 2rem; }
		</style>
	</head>
	<body>
		<div class="card">
			<h1>${greeting}</h1>
			<div id="loading-zone">
				<p class="status-msg">現在、ライセンスキーを発行しています...<br>この画面のまましばらくお待ちください。</p>
				<div class="loader"></div>
			</div>
			<div id="success-zone" style="display: none;">
				<p style="color: var(--success); font-weight: bold; margin-bottom: 0.5rem;">ライセンスキーの発行が完了しました</p>
				<div id="key-display" class="key-box"></div>
				<table class="info-table" id="info-table">
					<tr><td class="info-label">Email:</td><td class="info-value" id="val-email"></td></tr>
					<tr><td class="info-label">Time:</td><td class="info-value" id="val-time"></td></tr>
				</table>
				<p class="footer-note">上記のキーはコピーして、大切に保存してください。<br>メールでもご案内しています。</p>
				<div class="btn-group">
					<button class="btn btn-secondary" onclick="copyKey()">キーをコピー</button>
					<button class="btn" onclick="goBack()">OK</button>
				</div>
			</div>
		</div>
		<script>
			const checkoutId = "${checkoutId}";
			const successZone = document.getElementById('success-zone');
			const loadingZone = document.getElementById('loading-zone');
			const keyDisplay = document.getElementById('key-display');
			const infoTable = document.getElementById('info-table');
			const valEmail = document.getElementById('val-email');
			const valTime = document.getElementById('val-time');

			async function checkStatus() {
				if (!checkoutId) {
					loadingZone.innerHTML = "<p style='color:#ef4444'>エラー: 注文IDが見つかりません</p>";
					return;
				}
				try {
					const res = await fetch("/check-status?checkout_id=" + checkoutId);
					if (res.ok) {
						const data = await res.json();
						if (data.key) {
							keyDisplay.textContent = data.key;
							valEmail.textContent = data.email || 'N/A';
							valTime.textContent = data.raw_date || new Date().toISOString();
							loadingZone.style.display = 'none';
							successZone.style.display = 'block';
							keyDisplay.style.display = 'block';
							infoTable.style.display = 'table';
							localStorage.setItem('aaronAlpha_auth_key', data.key);
							return;
						}
					}
				} catch (e) {}
				setTimeout(checkStatus, 2000);
			}

			function copyKey() {
				navigator.clipboard.writeText(keyDisplay.textContent);
				alert('コピーしました！');
			}

			function goBack() { window.location.href = '/'; }
			checkStatus();
		</script>
	</body>
	</html>
	`;

    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}

/**
 * Check Status for success page polling (GET /check-status)
 */
async function handleCheckStatus(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const checkoutId = url.searchParams.get('checkout_id');
    if (!checkoutId) return new Response('Missing checkout_id', { status: 400 });

    const rawData = await env.AUTH_KV.get(`checkout:${checkoutId}`);
    if (rawData) {
        try {
            const parsed = JSON.parse(rawData);
            return new Response(JSON.stringify(parsed), { headers: corsHeaders });
        } catch (e) {
            return new Response(JSON.stringify({ key: rawData }), { headers: corsHeaders });
        }
    }
    return new Response(JSON.stringify({ key: null }), { headers: corsHeaders });
}
