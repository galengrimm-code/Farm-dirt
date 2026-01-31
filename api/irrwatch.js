// Vercel serverless function to proxy IrrWatch API requests (avoids CORS)
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const IRRWATCH_BASE = 'https://api.irriwatch.hydrosat.com';

  try {
    // Get the path from query parameter
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({ error: 'Missing path parameter' });
    }

    // Build the target URL
    const targetUrl = `${IRRWATCH_BASE}${path}`;

    // Forward the request
    const fetchOptions = {
      method: req.method,
      headers: {}
    };

    // Forward Authorization header if present
    if (req.headers.authorization) {
      fetchOptions.headers['Authorization'] = req.headers.authorization;
    }

    // Forward Content-Type and body for POST requests
    if (req.method === 'POST') {
      fetchOptions.headers['Content-Type'] = req.headers['content-type'] || 'application/x-www-form-urlencoded';
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();

    // Return the response
    res.status(response.status).json(data);

  } catch (error) {
    console.error('IrrWatch proxy error:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
}
