# Oumi & OpenAI LLM Integration Guide

## Overview

RepoArchitectAgent integrates with **Oumi AI** (primary) and **OpenAI** (fallback) to generate intelligent repository summaries.

The integration:
- Analyzes repository structure from `repo_shape.json`
- Generates tailored prompts based on detected languages/frameworks
- Calls Oumi API first, falls back to OpenAI if unavailable
- Produces: 3-sentence summary, top-5 hotspots, 3-step onboarding checklist
- Saves prompts and responses for verification

## Setup

### 1. Get API Keys

#### Oumi API Key
1. Visit: https://www.oumi.ai/
2. Sign up for free trial or paid account
3. Create API key in dashboard
4. Key format: `oumi_sk_xxxxxxxxxxxxxx`

#### OpenAI API Key (Fallback)
1. Visit: https://platform.openai.com/
2. Sign up or log in
3. Go to **API keys** section
4. Create new secret key
5. Key format: `sk-proj-xxxxxxxxxxxxxx`

### 2. Set Environment Variables

```bash
# Linux/Mac
export OUMI_API_KEY="oumi_sk_your_key_here"
export OPENAI_API_KEY="sk-proj-your_key_here"

# Windows PowerShell
$env:OUMI_API_KEY = "oumi_sk_your_key_here"
$env:OPENAI_API_KEY = "sk-proj-your_key_here"

# Windows CMD
set OUMI_API_KEY=oumi_sk_your_key_here
set OPENAI_API_KEY=sk-proj-your_key_here
```

### 3. Verify Setup

```bash
# Test Oumi connection
node api/generate_summary.js runs/latest/repo_shape.json

# Should output: "[+] Summary written to runs/latest/summary.json"
```

## Usage

### Command Line

```bash
# Basic usage
node api/generate_summary.js repo_shape.json

# With custom output directory
node api/generate_summary.js runs/latest/repo_shape.json runs/latest

# From web API (automatic)
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"repoUrl": "https://github.com/owner/repo"}'
```

### From Next.js API

The `/api/analyze` endpoint automatically calls summary generation:

```typescript
// web/pages/api/analyze.ts
const { stdout } = await execAsync(
  `node "${mermaidScript}" "${shapeFile}"`,
  { timeout: 30000 }
);

// Later:
const summaryScript = path.join(process.cwd(), '..', 'api', 'generate_summary.js');
const { stdout: summaryStdout } = await execAsync(
  `node "${summaryScript}" "${shapeFile}" "${runsDir}"`,
  { timeout: 60000 }
);
```

## Prompts

### System Prompt

The system prompt sets the context for the LLM:

```
You are an expert software architect and code reviewer. Your task is to analyze GitHub repositories and provide concise, actionable insights.

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

Be specific, technical, and actionable. Focus on maintainability, performance, and best practices.
```

### User Prompt (Dynamic)

Generated from `repo_shape.json`:

```
Please analyze this GitHub repository:

**Repository URL:** https://github.com/owner/repo
**Languages Detected:** python, typescript
**Frameworks:** fastapi, react
**File Count:** 245
**Has Dockerfile:** Yes
**Top-level Directories:** src, tests, api, web

**Dependencies:**
- pip: fastapi, sqlalchemy, pydantic, pytest, black, +15 more
- npm: react, typescript, axios, tailwindcss, +20 more

**API Endpoints:**
- nextjs: /api/analyze, /api/generate-mermaid, /api/generate-ci
- fastapi: GET /repos, POST /analyze, GET /results

Based on this information, please provide:
1. A 3-sentence high-level summary
2. Top 5 hotspots (issues, areas for improvement, or interesting patterns)
3. A 3-step onboarding checklist for new developers
```

## Example Responses

### Example 1: Node.js Project

**Repository:** https://github.com/lodash/lodash

**Summary:**
Lodash is a production-ready utility library providing ~300 composable functions for common JavaScript operations. The codebase is exceptionally well-tested with comprehensive documentation and broad browser/Node.js compatibility. The project prioritizes backward compatibility and performance across diverse runtime environments.

**Top 5 Hotspots:**
1. Large bundle size (~70KB minified) - consider tree-shaking improvements or incremental imports
2. Legacy browser support (IE8+) - constrains modern syntax adoption
3. Extensive method duplication across different implementations - refactor for DRY
4. Performance benchmarks could be automated and tracked in CI
5. Opportunity for TypeScript migration to improve type safety

**Onboarding Checklist:**
- [ ] Run test suite: `npm test` and review core utility functions in src/
- [ ] Study the architecture: understand lazy vs eager evaluation patterns
- [ ] Start with a simple PR: add a test or improve documentation for existing functions

### Example 2: Python Project

**Repository:** https://github.com/fastapi/fastapi

**Summary:**
FastAPI is a modern Python web framework enabling rapid API development with automatic OpenAPI documentation and validation. It leverages Pydantic for data validation and Starlette for async HTTP handling, offering excellent developer experience and performance. The project has strong community adoption and clear dependency management.

**Top 5 Hotspots:**
1. Dependency on Pydantic v2 - ensure migration guide is clear for upgrading users
2. Complex type hints can impact IDE performance in some editors
3. Async/await patterns require careful understanding for contributors
4. Documentation is extensive but could benefit from video tutorials
5. Security considerations for dependency pinning in production

**Onboarding Checklist:**
- [ ] Install dependencies: `pip install -e ".[dev]"` and run tests: `pytest`
- [ ] Read async Python documentation and review examples/ directory
- [ ] Try creating a simple API and auto-generated docs at /docs

### Example 3: Full-Stack Project

**Repository:** https://github.com/wemakedev/RepoArchitectAgent

**Summary:**
RepoArchitectAgent is an intelligent system for analyzing GitHub repositories and generating CI/CD pipelines, using shallow cloning for performance and LLM-powered insights. It combines Python analysis, Node.js generation, and Next.js frontend with Kestra orchestration. The project demonstrates end-to-end integration of multiple technologies with sponsor tool usage.

**Top 5 Hotspots:**
1. Error handling in API calls could be more robust (timeouts, retries)
2. Rate limiting needed for public API to prevent abuse
3. Mermaid diagram generation could be optimized for large repositories
4. LLM API key exposure risk - verify secret management
5. No caching layer - consider Redis for frequently analyzed repos

**Onboarding Checklist:**
- [ ] Clone and set up environment: `npm install` in web/, `pip install -r api/requirements.txt`
- [ ] Run analyze on a small public repo: `python api/analyze_repo.py <url>`
- [ ] Review generated diagram and CI YAML in runs/ directory

## Output Files

### summary.json
```json
{
  "timestamp": "2025-01-12T14:30:22.000Z",
  "repository": "https://github.com/owner/repo",
  "provider": "oumi",
  "summary": "The project is...",
  "hotspots": [
    "Issue 1...",
    "Issue 2...",
    "..."
  ],
  "onboarding": [
    "Step 1...",
    "Step 2...",
    "Step 3"
  ],
  "usage": {
    "prompt_tokens": 450,
    "completion_tokens": 320,
    "total_tokens": 770
  },
  "raw_response": "## Summary\n..."
}
```

### prompts.md
Documents the exact prompts sent and responses received (for audit trail).

## Provider Fallback Strategy

The integration tries Oumi first, then falls back to OpenAI:

```javascript
// Try Oumi first
let result = await callOumiAPI(systemPrompt, userPrompt);

// If Oumi fails or no key, try OpenAI
if (!result) {
  result = await callOpenAIAPI(systemPrompt, userPrompt);
}

// If both fail, skip summary generation
if (!result) {
  console.log('[!] All LLM APIs failed');
  process.exit(0);  // Don't fail the entire pipeline
}
```

### Decision Tree

```
Request Summary Generation
  ↓
OUMI_API_KEY set? → YES → Call Oumi API → Success? → YES → Return ✓
  ↓ NO                                    ↓ NO
OPENAI_API_KEY set? → YES → Call OpenAI API → Success? → YES → Return ✓
  ↓ NO                                     ↓ NO
Neither key set? → Skip summary, exit gracefully
```

## Cost Optimization

### Oumi Pricing (Approximate)
- Free tier: Limited API calls (typically $5-10 credits)
- Pay-as-you-go: ~$0.001-0.01 per 1K tokens
- Monthly subscription: ~$20-100

### OpenAI Pricing (Approximate)
- No free tier (but you can get $5 trial credits)
- GPT-3.5 Turbo: ~$0.0005 per 1K input, $0.0015 per 1K output
- GPT-4: ~$0.03 per 1K input, $0.06 per 1K output

### Cost per Repository Analysis
- Average repo analysis: ~450 prompt tokens + 320 completion tokens = 770 total
- Oumi estimate: $0.0008-0.008 per repo
- OpenAI estimate: $0.0003-0.012 per repo (depending on model)

### Money-Saving Tips
1. **Use Oumi for free tier** - Generally cheaper, good for MVP
2. **Implement caching** - Don't re-summarize same repos
3. **Batch analyses** - Group repositories for better throughput
4. **Use rate limiting** - Prevent duplicate/excessive API calls
5. **Monitor usage** - Set API spending alerts

## Troubleshooting

### "OUMI_API_KEY not set"
```bash
# Verify key is exported
echo $OUMI_API_KEY

# If empty, set it:
export OUMI_API_KEY="oumi_sk_xxxxx"

# Try again
node api/generate_summary.js repo_shape.json
```

### "Oumi API error: 401 Unauthorized"
- Key is invalid or expired
- Check Oumi dashboard: https://www.oumi.ai/dashboard
- Generate new key and update environment

### "Failed to parse response"
- API returned non-JSON response
- Check network connectivity
- Verify API endpoint is correct
- Check API key permissions

### "All LLM APIs failed"
- Both Oumi and OpenAI calls failed
- Check both API keys
- Verify network connectivity
- Check API status pages:
  - Oumi: https://status.oumi.ai
  - OpenAI: https://status.openai.com

### Timeout Issues
```bash
# Increase timeout in generate_summary.js
const timeout = 60000;  // 60 seconds
```

## Advanced Usage

### Custom System Prompt
Edit `api/generate_summary.js`:

```javascript
function generateSystemPrompt() {
  return `Custom prompt here...`;
}
```

### Using Different Models
```javascript
// For OpenAI - use GPT-4 instead of 3.5
const payload = {
  model: 'gpt-4',  // or 'gpt-4-turbo-preview'
  // ...
};
```

### Batch Processing
```bash
# Analyze multiple repos
for repo in "owner/repo1" "owner/repo2" "owner/repo3"; do
  node api/generate_summary.js "runs/$repo/repo_shape.json"
done
```

## Integration with CI/CD

### GitHub Actions
```yaml
name: Generate Summary

on:
  workflow_dispatch:
    inputs:
      repo_url:
        required: true

jobs:
  summarize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Generate Summary
        env:
          OUMI_API_KEY: ${{ secrets.OUMI_API_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          node api/generate_summary.js repo_shape.json runs/latest
```

### Kestra Integration
The blueprint already includes summary generation step:

```yaml
- id: generate_summary
  type: io.kestra.plugin.scripts.node.Script
  script: |
    node api/generate_summary.js {{ variables.run_dir }}/repo_shape.json
```

## Sponsorship Evidence

### Integration Points
1. **Code location**: `api/generate_summary.js`
2. **Configuration**: `docs/OUMI_PROMPTS.md` (this file)
3. **Usage**: Called from `/api/analyze` endpoint
4. **Outputs**: `runs/latest/summary.json` and `runs/latest/prompts.md`

### How to Verify
1. Run the demo: `npm run dev` in web/
2. Analyze a repo: paste GitHub URL
3. View summary output in UI
4. Check `runs/latest/` for prompt files

### Key Usage Points
- ✅ **Oumi API integration** - Primary LLM provider
- ✅ **OpenAI fallback** - Secondary provider
- ✅ **Prompt engineering** - Custom, repo-aware prompts
- ✅ **Response parsing** - Structured output extraction
- ✅ **Error handling** - Graceful degradation
- ✅ **Documentation** - Full audit trail in prompts.md

## References

- **Oumi**: https://www.oumi.ai/
- **OpenAI**: https://platform.openai.com/
- **Implementation**: [api/generate_summary.js](../api/generate_summary.js)
- **Integration**: [web/pages/api/analyze.ts](../web/pages/api/analyze.ts)
- **Pipeline**: [docs/KESTRA.md](./KESTRA.md)
