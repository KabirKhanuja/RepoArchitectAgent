import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  prLink?: string;
  ciYaml?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { repoShape } = req.body;

  if (!repoShape) {
    return res.status(400).json({ error: 'Missing repoShape' });
  }

  try {
    // Placeholder: In a real implementation, this would:
    // 1. Call api/generate_ci.js to create CI YAML
    // 2. Clone the target repo
    // 3. Create a branch, commit, push
    // 4. Open a PR using GitHub API or gh CLI
    // 5. Return the PR link

    // For now, return a placeholder response
    const prLink = `https://github.com/example/repo/pull/1`;
    const ciYaml = `# Generated CI will be created in next step`;

    return res.status(200).json({
      prLink,
      ciYaml,
    });
  } catch (error: any) {
    console.error('Error in /api/generate-ci:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate CI',
    });
  }
}
