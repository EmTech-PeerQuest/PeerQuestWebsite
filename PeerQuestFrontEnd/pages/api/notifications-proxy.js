const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

export default async function handler(req, res) {
  const token = req.headers.authorization || '';
  let backendRes;
  if (req.method === 'POST' && req.query.clear_all !== undefined) {
    // Clear all notifications
    backendRes = await fetch(`${BACKEND_API_URL}/api/notifications/clear_all/`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    });
  } else {
    // Get notifications
    backendRes = await fetch(`${BACKEND_API_URL}/api/notifications/`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    });
  }
  // Handle no-content responses (204) directly
  if (backendRes.status === 204) {
    return res.status(204).end();
  }
  // Try to parse as JSON, fallback to text for non-JSON responses
  let data;
  const contentType = backendRes.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await backendRes.json();
      return res.status(backendRes.status).json(data);
    } catch (e) {
      // Empty JSON or invalid, send status only
      return res.status(backendRes.status).end();
    }
  } else {
    data = await backendRes.text();
    return res.status(backendRes.status)
      .setHeader('Content-Type', contentType || 'text/plain')
      .send(data);
  }
}
