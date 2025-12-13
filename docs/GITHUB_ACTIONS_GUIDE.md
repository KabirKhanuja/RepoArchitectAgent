# Step 12: GitHub Actions Workflows Guide

## Overview

Two production-ready GitHub Actions workflows for RepoArchitectAgent:

1. **analyze-repo.yml** — Main analysis pipeline
2. **deploy-vercel.yml** — Vercel deployment automation

---

## Workflow 1: Analyze Repository (`analyze-repo.yml`)

### What It Does

```
On every push/PR to main:
  1. Checkout code
  2. Install Python & Node.js
  3. Run api/analyze_repo.py (repository structure analysis)
  4. Generate diagram via api/generate_mermaid.js
  5. Create summary via api/generate_summary.js
  6. Generate CI template via api/generate_ci.js
  7. Create analysis report (markdown)
  8. Upload artifacts (all results)
  9. Comment on PRs with diagram preview
```

### Key Features

✅ **Automatic on every push/PR**
✅ **Uploads results as artifacts** (downloadable for 30 days)
✅ **Comments on PRs** with architecture diagram preview
✅ **Graceful fallbacks** (if summary fails, analysis still completes)
✅ **Supports external repos** (via `workflow_dispatch` input)
✅ **GitHub Step Summary** (results visible in Actions UI)

### Triggers

| Trigger | Behavior |
|---------|----------|
| `push` to main/develop | Full analysis |
| `pull_request` to main | Full analysis + PR comment |
| `workflow_dispatch` | Manual run (optionally analyze external repo) |

### Usage in Actions UI

1. Go to **Actions** tab in your repo
2. Select **Analyze Repository** workflow
3. Click **Run workflow** (optional: input external repo URL)
4. Watch the job execute in real-time
5. Download artifacts when complete

### Manual Trigger (External Repo)

```yaml
# In Actions UI, click "Run workflow" and enter:
target_repo: https://github.com/some/other-repo
```

The workflow will analyze that repo instead of the current one.

### Outputs

Stored as **artifacts** (Actions → Latest Run → Artifacts):

| File | Purpose |
|------|---------|
| `analysis_result.json` | Full repo structure analysis |
| `diagram.mmd` | Mermaid diagram (can view in any Mermaid renderer) |
| `summary.json` | AI summary + insights (optional, skipped if no API key) |
| `ci_template.yml` | Generated CI/CD workflow |
| `analysis_report.md` | Combined markdown report |

Example artifact download:
```bash
# After workflow completes, download from Actions UI
# Or use GitHub API:
gh run download <RUN_ID> -n analysis-results
```

### Environment Variables Required

In **GitHub Secrets** (Settings → Secrets and Variables → Actions):

```
GITHUB_TOKEN         [auto-provided by GitHub]
OPENROUTER_API_KEY   [optional, for summaries]
```

---

## Workflow 2: Deploy to Vercel (`deploy-vercel.yml`)

### What It Does

```
On every push to main:
  1. Checkout code
  2. Install Node.js + Vercel CLI
  3. npm install & npm run build
  4. Deploy to Vercel production
  5. Comment on PRs with preview URL

On PRs:
  1. Build Next.js app
  2. Deploy preview to Vercel
  3. Post preview URL as PR comment
```

### Key Features

✅ **Zero-manual-deploy** (automatic on push to main)
✅ **Preview deployments on PRs** (test changes before merge)
✅ **Auto-comments PR** with live preview link
✅ **Production deploy** on main branch
✅ **Linting checks** (optional, non-blocking)

### Setup Required

Before first deploy, configure Vercel secrets:

1. **Get Vercel tokens:**
   ```bash
   # Login to Vercel dashboard
   # Settings → Tokens → Create token
   # Copy: VERCEL_TOKEN
   
   # For your project:
   # Settings → General → Project ID & Org ID
   # Copy: VERCEL_PROJECT_ID, VERCEL_ORG_ID
   ```

2. **Add to GitHub Secrets** (Settings → Secrets → Actions):
   ```
   VERCEL_TOKEN       = vercel_XXXXXXX...
   VERCEL_ORG_ID      = XXXXXXX
   VERCEL_PROJECT_ID  = XXXXXXX
   ```

3. **Verify build** locally:
   ```bash
   cd web
   npm run build
   # Should complete without errors
   ```

### Usage

**For PRs:**
- Create a PR to main
- GitHub Actions automatically deploys preview
- Comment appears with live preview URL
- Test your changes
- Merge when ready

**For Production:**
- Push to main
- Vercel CLI auto-deploys to production
- Your live site updates

### Outputs

**In Actions UI:**
```
✅ Build passed
✅ Preview/Production deployed
📋 Summary visible in workflow
```

**For PRs:**
Auto-comment with preview URL:
```
🚀 Preview Deployment Ready!
View your changes: https://[your-project]-pr-123.vercel.app
```

### Troubleshooting

**Build fails:**
```bash
cd web
npm install --legacy-peer-deps
npm run build
# Check errors locally before pushing
```

**Vercel deployment fails:**
- Verify `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` in GitHub Secrets
- Test locally: `vercel --help`

**No PR comment:**
- Ensure GitHub token has `pull-requests: write` permission (auto-granted)
- Check workflow logs for errors

---

## Complete Setup Checklist

### Prerequisites
- [ ] Repository pushed to GitHub
- [ ] GitHub token available (auto-provided in Actions)

### For Analysis Workflow (analyze-repo.yml)
- [ ] `.github/workflows/analyze-repo.yml` created ✅
- [ ] Optional: Add `OPENROUTER_API_KEY` to GitHub Secrets for summaries
- [ ] Test: Push code or manually trigger in Actions

### For Deployment Workflow (deploy-vercel.yml)
- [ ] `.github/workflows/deploy-vercel.yml` created ✅
- [ ] Vercel project created (https://vercel.com/new)
- [ ] Add `VERCEL_TOKEN` to GitHub Secrets
- [ ] Add `VERCEL_ORG_ID` to GitHub Secrets
- [ ] Add `VERCEL_PROJECT_ID` to GitHub Secrets
- [ ] Test: Push to main branch

### Test First Deploy

```bash
# 1. Make a small change to your code
echo "# Update" >> README.md

# 2. Commit and push
git add .
git commit -m "Test deploy"
git push origin main

# 3. Watch GitHub Actions
# https://github.com/YOUR/REPO/actions

# 4. Check Vercel dashboard for live site
# https://vercel.com/dashboard
```

---

## Real-World Example: Analysis Workflow Output

**When you push code:**

```
📥 Checkout repository                  ✓
🔧 Set up Python                        ✓
🔧 Set up Node.js                       ✓
📦 Install dependencies                 ✓
📊 Analyze repository structure          ✓
  → Found: 12 .js files, 5 .py scripts, Next.js project
🎨 Generate Mermaid diagram             ✓
  → Created: diagram.mmd (98 lines)
🤖 Generate AI summary                  ✓
  → Created: summary.json (1200 chars)
🔄 Generate CI pipeline                 ✓
  → Created: ci_template.yml (280 lines)
📋 Create analysis report               ✓
  → Created: analysis_report.md (500 lines)
📤 Upload artifacts                     ✓
  → 5 files ready for download (30-day retention)
💬 Comment on PR                        ✓
  → Posted architecture preview comment
✅ Workflow Summary                     ✓
```

**PR Comment Example:**

```markdown
## 📊 RepoArchitectAgent Analysis

### 🎨 Architecture Diagram
[diagram preview in mermaid format]

### 📝 Key Insights
- This is a Next.js full-stack project with Python backend
- Main dependencies: React, Tailwind CSS, Mermaid.js
- 8 API endpoints detected
- Suitable for cloud deployment

### 📦 Full Results
Check the artifacts for complete analysis (diagram, summary, CI template, and more).
```

---

## Next Steps

1. **Commit workflows** to your repo:
   ```bash
   git add .github/workflows/
   git commit -m "Add GitHub Actions workflows (Step 12)"
   git push origin main
   ```

2. **Verify workflows** run in Actions tab
3. **Download artifacts** to see results
4. **Set up Vercel** secrets for deployment
5. **Test a PR** to see preview deployment

---

## Common Commands

### View latest workflow run locally
```bash
gh run list --repo YOUR/REPO --limit 5
gh run view <RUN_ID>
```

### Download artifacts
```bash
gh run download <RUN_ID> -n analysis-results -D ./results/
```

### Manually trigger workflow
```bash
gh workflow run analyze-repo.yml --repo YOUR/REPO
```

### View workflow logs
```bash
gh run view <RUN_ID> --log
```

---

**Step 12 Complete!** ✅

Next: Step 13 (Demo runs & artifacts collection)
