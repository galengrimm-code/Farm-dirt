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

    // Forward the request with redirect following enabled
    const fetchOptions = {
      method: req.method,
      headers: {},
      redirect: 'follow' // Explicitly follow redirects (302)
    };

    // Forward Authorization header if present
    if (req.headers.authorization) {
      fetchOptions.headers['Authorization'] = req.headers.authorization;
    }

    // Forward Content-Type and body for POST requests
    if (req.method === 'POST') {
      const contentType = req.headers['content-type'] || 'application/x-www-form-urlencoded';
      fetchOptions.headers['Content-Type'] = contentType;

      // Handle different content types
      if (typeof req.body === 'string') {
        fetchOptions.body = req.body;
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        // Convert parsed object back to URL-encoded format
        fetchOptions.body = new URLSearchParams(req.body).toString();
      } else {
        fetchOptions.body = JSON.stringify(req.body);
      }
    }

    const response = await fetch(targetUrl, fetchOptions);

    // Handle different response types
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      // Non-JSON response (could be error page, redirect, etc.)
      const text = await response.text();
      res.status(response.status).json({
        error: 'Non-JSON response',
        status: response.status,
        statusText: response.statusText,
        body: text.substring(0, 500) // First 500 chars for debugging
      });
    }

  } catch (error) {
    console.error('IrrWatch proxy error:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
}
