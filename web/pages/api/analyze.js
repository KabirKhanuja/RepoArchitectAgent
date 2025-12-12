export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { repo } = req.body || {};
  if (!repo) return res.status(400).json({ error: 'Missing repo' });
  // Placeholder: call Python script via serverless or external service
  return res.status(200).json({ ok: true, repo });
}
