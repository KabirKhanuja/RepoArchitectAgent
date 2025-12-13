import type { NextApiRequest, NextApiResponse } from "next";
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

type ResponseData = {
  repoShape?: any;
  diagram?: string;
  summary?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { repoUrl } = req.body as { repoUrl?: string };
  if (!repoUrl) {
    return res.status(400).json({ error: "Missing repoUrl" });
  }

  try {
    // Call the Python script
    const pythonScript = path.join(process.cwd(), '..', 'api', 'analyze_repo.py');
    const runsDir = path.join(process.cwd(), '..', 'runs', 'latest');

    // Ensure runs directory exists
    if (!fs.existsSync(runsDir)) {
      fs.mkdirSync(runsDir, { recursive: true });
    }

    // Run Python analysis
    console.log(`Executing: python ${pythonScript} "${repoUrl}" ${runsDir}`);
    try {
      const { stdout, stderr } = await execAsync(
        `python "${pythonScript}" "${repoUrl}" "${runsDir}"`,
        { timeout: 60000 }
      );

      if (stderr) {
        console.error('Python stderr:', stderr);
      }
      console.log('Python stdout:', stdout);
    } catch (execError: any) {
      // Python script may exit with code 1 even on success due to cleanup issues
      // Check if the output file was created; if so, continue
      const shapeFile = path.join(runsDir, 'repo_shape.json');
      if (!fs.existsSync(shapeFile)) {
        console.error('Python execution error:', execError.message);
        throw execError;
      }
      console.warn('Python exited with error but repo_shape.json was created; continuing...');
    }

    // Read the generated repo_shape.json
    const shapeFile = path.join(runsDir, 'repo_shape.json');
    if (!fs.existsSync(shapeFile)) {
      return res.status(500).json({ error: 'Failed to generate repo_shape.json' });
    }

    const repoShape = JSON.parse(fs.readFileSync(shapeFile, 'utf-8'));

    // Generate Mermaid diagram
    const mermaidScript = path.join(process.cwd(), '..', 'api', 'generate_mermaid.js');
    const { stdout: mermaidStdout } = await execAsync(
      `node "${mermaidScript}" "${shapeFile}"`,
      { timeout: 30000 }
    );
    console.log('Mermaid output:', mermaidStdout);

    // Read the generated diagram
    const diagramFile = path.join(runsDir, 'diagram.mmd');
    let diagram = '';
    if (fs.existsSync(diagramFile)) {
      diagram = fs.readFileSync(diagramFile, 'utf-8');
    }

    // Generate LLM summary (optional)
    let summary = '';
    try {
      const summaryScript = path.join(process.cwd(), '..', 'api', 'generate_summary.js');
      console.log(`Executing: node ${summaryScript} "${shapeFile}" "${runsDir}"`);
      const { stdout: summaryStdout } = await execAsync(
        `node "${summaryScript}" "${shapeFile}" "${runsDir}"`,
        { timeout: 60000 }
      );
      console.log('Summary output:', summaryStdout);

      // Try to read the generated summary
      const summaryFile = path.join(runsDir, 'summary.json');
      if (fs.existsSync(summaryFile)) {
        const summaryData = JSON.parse(fs.readFileSync(summaryFile, 'utf-8'));
        summary = `${summaryData.summary}\n\n### Top Hotspots\n${summaryData.hotspots.map((h: string, i: number) => `${i + 1}. ${h}`).join('\n')}\n\n### Onboarding\n${summaryData.onboarding.map((o: string) => `- [ ] ${o}`).join('\n')}`;
      }
    } catch (error: any) {
      console.warn('Summary generation failed (non-critical):', error.message);
      // Don't fail the entire request if summary generation fails
    }

    return res.status(200).json({
      repoShape,
      diagram,
      summary,
    });
  } catch (error: any) {
    console.error('Error in /api/analyze:', error);
    return res.status(500).json({
      error: error.message || 'Failed to analyze repository',
    });
  }
}
