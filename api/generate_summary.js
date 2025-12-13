#!/usr/bin/env node
/**
 * Generate AI-powered repository summary
 * Tries Oumi API first, falls back to OpenAI
 * Usage: node generate_summary.js <repo_shape.json> [output_dir]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUMI_API_KEY = process.env.OUMI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OUMI_API_URL = 'https://api.oumi.ai/v1/chat/completions';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Make HTTPS request
 */
function makeHttpsRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...options.headers,
      },
    };

    const req = https.request(requestOptions, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Call Oumi API
 */
async function callOumiAPI(systemPrompt, userPrompt) {
  if (!OUMI_API_KEY) {
    console.log('[!] OUMI_API_KEY not set, skipping Oumi');
    return null;
  }

  try {
    console.log('[*] Calling Oumi API...');

    const payload = JSON.stringify({
      model: 'oumi-1',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = await makeHttpsRequest(OUMI_API_URL, {
      headers: {
        'Authorization': `Bearer ${OUMI_API_KEY}`,
      },
    }, payload);

    if (response.status === 200 && response.data.choices && response.data.choices[0]) {
      const content = response.data.choices[0].message.content;
      console.log('[+] Oumi API response received');
      return {
        provider: 'oumi',
        content,
        usage: response.data.usage,
      };
    } else {
      console.log(`[!] Oumi API error: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.log(`[!] Oumi API failed: ${error.message}`);
    return null;
  }
}

/**
 * Call OpenAI API (fallback)
 */
async function callOpenAIAPI(systemPrompt, userPrompt) {
  if (!OPENAI_API_KEY) {
    console.log('[!] OPENAI_API_KEY not set, skipping OpenAI');
    return null;
  }

  try {
    console.log('[*] Calling OpenAI API (fallback)...');

    const payload = JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = await makeHttpsRequest(OPENAI_API_URL, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
    }, payload);

    if (response.status === 200 && response.data.choices && response.data.choices[0]) {
      const content = response.data.choices[0].message.content;
      console.log('[+] OpenAI API response received');
      return {
        provider: 'openai',
        content,
        usage: response.data.usage,
      };
    } else {
      console.log(`[!] OpenAI API error: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.log(`[!] OpenAI API failed: ${error.message}`);
    return null;
  }
}

/**
 * Generate system prompt
 */
function generateSystemPrompt() {
  return `You are an expert software architect and code reviewer. Your task is to analyze GitHub repositories and provide concise, actionable insights.

Respond in the following format:

## Summary
[3-sentence high-level overview of the project]

## Top 5 Hotspots
1. [Issue/area 1 with brief explanation]
2. [Issue/area 2 with brief explanation]
3. [Issue/area 3 with brief explanation]
4. [Issue/area 4 with brief explanation]
5. [Issue/area 5 with brief explanation]

## Onboarding Checklist
- [ ] [Step 1 to get started with the codebase]
- [ ] [Step 2 to understand the architecture]
- [ ] [Step 3 to make your first contribution]

Be specific, technical, and actionable. Focus on maintainability, performance, and best practices.`;
}

/**
 * Generate user prompt from repo shape
 */
function generateUserPrompt(repoShape) {
  const languages = repoShape.languages || [];
  const frameworks = repoShape.frameworks || [];
  const dependencies = repoShape.dependencies || {};
  const apiEndpoints = repoShape.api_endpoints || {};
  const topDirs = repoShape.top_level_directories || [];

  let prompt = `Please analyze this GitHub repository:\n\n`;

  prompt += `**Repository URL:** ${repoShape.url}\n\n`;

  prompt += `**Languages Detected:** ${languages.join(', ')}\n`;
  prompt += `**Frameworks:** ${frameworks.join(', ')}\n`;
  prompt += `**File Count:** ${repoShape.file_count}\n`;
  prompt += `**Has Dockerfile:** ${repoShape.has_dockerfile ? 'Yes' : 'No'}\n`;
  prompt += `**Top-level Directories:** ${topDirs.join(', ')}\n\n`;

  if (Object.keys(dependencies).length > 0) {
    prompt += `**Dependencies:**\n`;
    for (const [pkgMgr, deps] of Object.entries(dependencies)) {
      if (deps && deps.length > 0) {
        prompt += `- ${pkgMgr}: ${deps.slice(0, 10).join(', ')}${deps.length > 10 ? ` (+${deps.length - 10} more)` : ''}\n`;
      }
    }
    prompt += '\n';
  }

  if (Object.keys(apiEndpoints).length > 0) {
    prompt += `**API Endpoints:**\n`;
    for (const [type, endpoints] of Object.entries(apiEndpoints)) {
      if (endpoints && endpoints.length > 0) {
        prompt += `- ${type}: ${endpoints.slice(0, 5).join(', ')}${endpoints.length > 5 ? ` (+${endpoints.length - 5} more)` : ''}\n`;
      }
    }
    prompt += '\n';
  }

  prompt += `Based on this information, please provide:\n`;
  prompt += `1. A 3-sentence high-level summary\n`;
  prompt += `2. Top 5 hotspots (issues, areas for improvement, or interesting patterns)\n`;
  prompt += `3. A 3-step onboarding checklist for new developers\n`;

  return prompt;
}

/**
 * Parse summary response
 */
function parseSummaryResponse(content) {
  const sections = {
    summary: '',
    hotspots: [],
    onboarding: [],
    raw: content,
  };

  try {
    // Extract summary
    const summaryMatch = content.match(/##\s*Summary\n([\s\S]*?)(?=##|$)/);
    if (summaryMatch) {
      sections.summary = summaryMatch[1].trim();
    }

    // Extract hotspots
    const hotspotsMatch = content.match(/##\s*Top\s*5\s*Hotspots\n([\s\S]*?)(?=##|$)/);
    if (hotspotsMatch) {
      const hotspotsText = hotspotsMatch[1];
      const items = hotspotsText.match(/^\d+\.\s*(.+)$/gm);
      if (items) {
        sections.hotspots = items.map((item) => item.replace(/^\d+\.\s*/, '').trim());
      }
    }

    // Extract onboarding
    const onboardingMatch = content.match(/##\s*Onboarding\s*Checklist\n([\s\S]*?)(?=##|$)/);
    if (onboardingMatch) {
      const onboardingText = onboardingMatch[1];
      const items = onboardingText.match(/^\s*-\s*\[\s*\]\s*(.+)$/gm);
      if (items) {
        sections.onboarding = items.map((item) => item.replace(/^\s*-\s*\[\s*\]\s*/, '').trim());
      }
    }
  } catch (error) {
    console.log('[!] Error parsing response:', error.message);
  }

  return sections;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node generate_summary.js <repo_shape.json> [output_dir]');
    console.error('');
    console.error('Examples:');
    console.error('  node generate_summary.js repo_shape.json');
    console.error('  node generate_summary.js runs/latest/repo_shape.json runs/latest');
    console.error('');
    console.error('Environment Variables:');
    console.error('  OUMI_API_KEY - Oumi API key (primary)');
    console.error('  OPENAI_API_KEY - OpenAI API key (fallback)');
    process.exit(1);
  }

  const inputPath = args[0];
  const outputDir = args[1] || path.dirname(inputPath);
  const outputPath = path.join(outputDir, 'summary.json');
  const prompPath = path.join(outputDir, 'prompts.md');

  try {
    // Read repo_shape.json
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: File not found: ${inputPath}`);
      process.exit(1);
    }

    const repoShape = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    console.log(`[*] Loaded ${inputPath}`);

    // Check for API keys
    if (!OUMI_API_KEY && !OPENAI_API_KEY) {
      console.log('[!] No API keys found (OUMI_API_KEY or OPENAI_API_KEY)');
      console.log('[*] Skipping summary generation');
      console.log('');
      console.log('To enable LLM summaries, set one of:');
      console.log('  export OUMI_API_KEY=oumi_sk_xxxxx');
      console.log('  export OPENAI_API_KEY=sk-proj-xxxxx');
      process.exit(0);
    }

    // Generate prompts
    const systemPrompt = generateSystemPrompt();
    const userPrompt = generateUserPrompt(repoShape);

    console.log('[*] Generated prompts');

    // Try Oumi first, fallback to OpenAI
    let result = await callOumiAPI(systemPrompt, userPrompt);
    if (!result) {
      result = await callOpenAIAPI(systemPrompt, userPrompt);
    }

    if (!result) {
      throw new Error('All LLM APIs failed');
    }

    // Parse response
    const parsed = parseSummaryResponse(result.content);

    // Create output
    const output = {
      timestamp: new Date().toISOString(),
      repository: repoShape.url,
      provider: result.provider,
      summary: parsed.summary,
      hotspots: parsed.hotspots,
      onboarding: parsed.onboarding,
      usage: result.usage || {},
      raw_response: result.content,
    };

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write summary JSON
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`[+] Summary written to ${outputPath}`);

    // Write prompts documentation
    const promptsDoc = `# LLM Summary Generation - ${repoShape.url}

Generated on: ${new Date().toISOString()}
Provider: ${result.provider}

## System Prompt

\`\`\`
${systemPrompt}
\`\`\`

## User Prompt

\`\`\`
${userPrompt}
\`\`\`

## Response

\`\`\`
${result.content}
\`\`\`

## Parsed Output

### Summary
${parsed.summary}

### Top Hotspots
${parsed.hotspots.map((h, i) => `${i + 1}. ${h}`).join('\n')}

### Onboarding Checklist
${parsed.onboarding.map((o) => `- [ ] ${o}`).join('\n')}

---

**Provider:** ${result.provider}
**Timestamp:** ${new Date().toISOString()}
`;

    fs.writeFileSync(prompPath, promptsDoc, 'utf-8');
    console.log(`[+] Prompts documentation written to ${prompPath}`);

    // Print summary
    console.log('\n=== Generated Summary ===\n');
    console.log(result.content);
    console.log('\n=== End Summary ===\n');

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Export for testing
module.exports = {
  callOumiAPI,
  callOpenAIAPI,
  generateSystemPrompt,
  generateUserPrompt,
  parseSummaryResponse,
};

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}
