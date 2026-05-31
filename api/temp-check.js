export default function handler(req, res) {
  res.status(200).json({
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET ? process.env.PAYPAL_CLIENT_SECRET.substring(0, 8) + '...' : 'not set'
  });
}
