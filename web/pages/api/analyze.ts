import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { repo } = req.body as { repo?: string };
  if (!repo) {
    return res.status(400).json({ error: "Missing repo" });
  }

  // TODO: Invoke Python analyzer via a backend job or adapter.
  return res.status(200).json({ ok: true, repo });
}
