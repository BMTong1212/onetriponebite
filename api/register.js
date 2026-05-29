// ============================================================
// Vercel Serverless Function — Register Client (Proxy to GAS)
// Route: POST /api/register
// Env vars: GAS_URL (optional, falls back to default)
// ============================================================

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GAS_URL = process.env.GAS_URL || 'https://script.google.com/macros/s/AKfycbw-aHSJi-t1mxF-nSGO3tQqoTcIQLh060hVA6pUCof9sQmby0abzjFjy89DE9J0tOU/exec';

  try {
    const { name, email, phone, method, action, product } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Missing name or email' });
    }

    const gasRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: action || 'register',
        name,
        email,
        phone: phone || '',
        method: method || 'paypal',
        product: product || ''
      })
    });

    let gasData;
    try {
      gasData = await gasRes.json();
    } catch (_) {
      console.error('GAS returned non-JSON response, status:', gasRes.status);
      return res.status(502).json({ success: false, error: 'Invalid response from backend database' });
    }

    if (gasRes.ok && gasData) {
      return res.status(200).json(gasData);
    } else {
      return res.status(gasRes.status || 400).json(gasData || { success: false, error: 'Registration failed' });
    }

  } catch (err) {
    console.error('Register proxy error:', err.toString());
    return res.status(500).json({ success: false, error: err.message });
  }
}
