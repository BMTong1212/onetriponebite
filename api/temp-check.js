const PAYPAL_API_PROD = 'https://api-m.paypal.com';
const PAYPAL_API_SANDBOX = 'https://api-m.sandbox.paypal.com';

async function testAuth(apiBase, clientId, clientSecret) {
  if (!clientId || !clientSecret) return { error: 'Credentials not configured' };
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  try {
    const res = await fetch(`${apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  } catch (e) {
    return { error: e.message };
  }
}

export default async function handler(req, res) {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  const prodResult = await testAuth(PAYPAL_API_PROD, clientId, clientSecret);
  const sandboxResult = await testAuth(PAYPAL_API_SANDBOX, clientId, clientSecret);
  
  res.status(200).json({
    prod: { status: prodResult.status, ok: prodResult.ok, error: prodResult.error, hasToken: !!prodResult.data?.access_token },
    sandbox: { status: sandboxResult.status, ok: sandboxResult.ok, error: sandboxResult.error, hasToken: !!sandboxResult.data?.access_token }
  });
}
