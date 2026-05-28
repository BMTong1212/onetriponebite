// ============================================================
// Vercel Serverless Function — Check Payment Status (Proxy to GAS)
// Route: GET /api/check-payment
// Env vars: GAS_URL (optional, falls back to default)
// ============================================================

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GAS_URL = process.env.GAS_URL || 'https://script.google.com/macros/s/AKfycbzLpOS-rfBF0luOIRBs4z8KyffbG5CWwGljEbv7wrSjH0MalcLzLdSmoD7Cbxd_UG-9/exec';
  const { ref } = req.query || {};

  if (!ref) {
    return res.status(400).json({ error: 'Missing ref code' });
  }

  try {
    const url = `${GAS_URL}?action=check&ref=${encodeURIComponent(ref)}`;
    const gasRes = await fetch(url);

    let gasData;
    try {
      gasData = await gasRes.json();
    } catch (_) {
      console.error('GAS returned non-JSON response, status:', gasRes.status);
      return res.status(502).json({ error: 'Invalid response from backend database' });
    }

    return res.status(200).json(gasData);

  } catch (err) {
    console.error('Check payment proxy error:', err.toString());
    return res.status(500).json({ error: err.message });
  }
}
