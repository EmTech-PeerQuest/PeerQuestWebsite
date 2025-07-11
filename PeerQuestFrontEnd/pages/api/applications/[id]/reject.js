export default async function handler(req, res) {
  const { id } = req.query;
  const token = req.headers.authorization || '';
  // Forward to backend
  const backendRes = await fetch(`http://localhost:8000/api/applications/${id}/reject/`, {
    method: 'POST',
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req.body || {}),
  });
  const contentType = backendRes.headers.get('content-type') || 'application/json';
  const data = contentType.includes('application/json') ? await backendRes.json() : await backendRes.text();
  res.status(backendRes.status).setHeader('Content-Type', contentType).send(data);
}
