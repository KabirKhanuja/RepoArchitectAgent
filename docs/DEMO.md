# 🎬 RepoArchitectAgent - 2-Minute Demo Guide

**Total Time: 2 minutes** | **Required Setup: 2 minutes** | **Total: 4 minutes**

---

## 🎯 What You'll See

By the end of this demo, you'll see:
1. **Repository Analysis** - Languages, frameworks, dependencies extracted in seconds
2. **Architecture Diagram** - Beautiful Mermaid flowchart of repo structure
3. **AI Summary** - Intelligent insights about the codebase
4. **CI Pipeline** - Auto-generated GitHub Actions workflow tailored to tech stack
5. **Pull Request** - Automatic PR creation with generated CI config (optional)

---

## 📋 Prerequisites (Setup: 2 minutes)

### Required
- ✅ Node.js 18+ installed
- ✅ Python 3.9+ installed
- ✅ Git installed

### Optional (for PR creation)
- 📌 GitHub token (`GITHUB_TOKEN` env var)
- 📌 Oumi API key (`OUMI_API_KEY` env var) - for AI summaries
- 📌 OpenAI API key (`OPENAI_API_KEY` env var) - for AI summary fallback

### Verify Installation

```bash
# Check Node.js
node --version        # Should be v18.0.0+

# Check Python
python --version      # Should be 3.9+

# Check Git
git --version         # Should be 2.x+
```

---

## 🚀 Quick Start (2 minutes)

### Step 1: Install Dependencies (30 seconds)

```bash
cd web
npm install
```

Expected output:
```
✓ added XXX packages in X.XXs
```

### Step 2: Start Dev Server (30 seconds)

```bash
npm run dev
```

Expected output:
```
▲ Next.js 14.2.0
- Local:        http://localhost:3000
```

### Step 3: Open Browser (15 seconds)

Click the link or open: **http://localhost:3000**

You should see:
- Input field: "Enter GitHub Repository URL"
- "Analyze Repository" button
- Results panel (empty)

---

## 📊 Demo Run: Analyzing `lodash` Repository

### Sample Repos for Testing
| Repo | Language | Best For |
|------|----------|----------|
| https://github.com/lodash/lodash | JavaScript | Simple, popular |
| https://github.com/pallets/flask | Python | Python experts |
| https://github.com/vercel/next.js | TypeScript/React | Full-stack demo |
| https://github.com/golang/go | Go | Systems programmers |
| https://github.com/tokio-rs/tokio | Rust | Async systems |

### Step 1: Input Repository URL (15 seconds)

1. Click on the input field
2. Paste: `https://github.com/lodash/lodash`
3. Click "Analyze Repository"

Expected UI:
```
[https://github.com/lodash/lodash] [Analyze Repository]
```

### Step 2: Watch Progress (30 seconds)

You'll see real-time progress updates:

```
📊 Analyzing repository...
📊 Generating diagram...
📊 Generating summary...
✅ Analysis complete!
```

During this time, the backend is:
1. ✓ Cloning the repo (shallow, ~2 seconds)
2. ✓ Analyzing structure (detect languages, frameworks, deps)
3. ✓ Generating Mermaid diagram
4. ✓ Querying LLM for summary (if API key set)

### Step 3: View Repository Shape (30 seconds)

After analysis, you'll see a **collapsible JSON panel**:

```json
{
  "url": "https://github.com/lodash/lodash",
  "languages": ["javascript"],
  "frameworks": ["node", "webpack"],
  "dependencies": {
    "npm": ["lodash-es", "chalk", "commander", ...],
    "pip": [],
    "bundler": []
  },
  "api_endpoints": { ... },
  "directories": ["lib", "test", "docs", "dist", ...],
  "has_dockerfile": false,
  "file_count": 1234
}
```

**What This Shows**:
- ✓ Detected language: JavaScript
- ✓ Detected framework: Node.js
- ✓ Top dependencies extracted
- ✓ Folder structure identified

### Step 4: View Architecture Diagram (30 seconds)

Below the JSON, you'll see a **beautiful Mermaid diagram**:

```
📦 lodash
├─ 🐍 Languages
│  └─ 🟡 JavaScript
├─ 🏗️ Frameworks
│  └─ ⚛️ Node.js
├─ 📁 Directories
│  ├─ lib/ (main)
│  ├─ test/ (tests)
│  ├─ docs/ (docs)
│  └─ dist/ (build)
├─ 📦 Dependencies (npm)
│  ├─ lodash-es
│  ├─ chalk
│  └─ +17 more
└─ File Count: 1234 files
```

**What This Shows**:
- ✓ Tech stack at a glance
- ✓ Directory structure
- ✓ Dependencies visualized
- ✓ Professional diagram style

### Step 5: View AI Summary (Optional - requires API key)

If you have `OUMI_API_KEY` or `OPENAI_API_KEY` set:

```markdown
## Lodash Library Summary

Lodash is a popular JavaScript utility library providing helpful functions 
for working with arrays, objects, and other data structures. It's a foundational 
dependency in thousands of npm packages, offering composable functional utilities 
with comprehensive documentation and strong type support.

### Top Hotspots to Review

1. **Large lib/ directory** → Consider splitting by module category
2. **Many peer dependencies** → Review compatibility matrix
3. **Test suite organization** → Could benefit from test categorization
4. **Documentation coverage** → 95% complete; maintain parity

### 3-Step Onboarding Checklist

1. Clone and `npm install` → Review package.json and CONTRIBUTING.md
2. Explore lib/ structure → Understand exported function organization
3. Run tests → `npm test` to verify your development environment
```

---

## 🔧 Advanced Demo (Optional): Generate CI & Open PR

### Prerequisites for PR Creation
- 📌 Set environment variable: `GITHUB_TOKEN=ghp_xxxxx`
- 📌 Fork a test repository to your account
- 📌 Use your fork URL instead of official repo

### Step 1: Generate CI Workflow

Click **"Generate CI & Open PR"** button (if visible)

Expected output:
```
✓ CI workflow generated
✓ Branch created: agent/ci-generated
✓ Commit pushed
✓ PR opened!
```

### Step 2: View Generated CI

The generated `.github/workflows/ci-generated.yml` includes:
```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm run lint || echo "no-lint"
      - run: npm test || echo "no-test"
      - run: npm run build
```

### Step 3: View Pull Request

You'll see:
```
🔗 PR Created!
Branch: agent/ci-generated
URL: https://github.com/your-fork/ci-PR-123
Title: feat: add auto-generated CI workflow
```

Click the link to see the PR on GitHub. It will include:
- ✓ Generated CI configuration
- ✓ Auto-generated description
- ✓ Links to relevant documentation

---

## 🧪 Testing Different Repository Types

### Test 1: Python Repository (Flask)

```bash
# Input: https://github.com/pallets/flask
# Expected detections:
# - Language: Python
# - Frameworks: Flask, Werkzeug
# - Generated CI: Python test matrix (3.9, 3.10, 3.11, 3.12)
# - Commands: pip install, pytest, flake8
```

### Test 2: Full-Stack TypeScript (Next.js)

```bash
# Input: https://github.com/vercel/next.js
# Expected detections:
# - Languages: TypeScript, JavaScript
# - Frameworks: Next.js, React, Node.js
# - Generated CI: Node.js matrix + build optimization
# - Commands: npm ci, lint, test, build
```

### Test 3: Systems Programming (Rust)

```bash
# Input: https://github.com/tokio-rs/tokio
# Expected detections:
# - Language: Rust
# - Frameworks: Tokio (async runtime)
# - Generated CI: Cargo with clippy, fmt, test
# - Commands: cargo build, cargo test, cargo clippy
```

### Test 4: Go Service (Gin)

```bash
# Input: https://github.com/gin-gonic/gin
# Expected detections:
# - Language: Go
# - Frameworks: Gin
# - Generated CI: Go build matrix
# - Commands: go build, golangci-lint, go test
```

---

## 🐛 Troubleshooting

### Issue: "Port 3000 already in use"
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID <PID> /F

# Or use different port
PORT=3001 npm run dev
```

### Issue: Python not found
```bash
# Install Python from https://www.python.org/
# Add to PATH
# Verify:
python --version
```

### Issue: npm dependencies failed
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Git clone fails
```bash
# Verify internet connectivity
git clone --depth 1 https://github.com/lodash/lodash

# Check git is installed
git --version
```

### Issue: LLM summary not showing
```bash
# Check API keys are set (optional - summary is non-blocking)
echo $OUMI_API_KEY
echo $OPENAI_API_KEY

# If not set, run without them (other features work fine)
```

### Issue: Diagram not rendering
```bash
# Check browser console for errors
# Press F12 → Console tab
# Look for Mermaid syntax errors
# Try different repo if specific one has issue
```

---

## 📺 Demo Script (Copy-Paste)

Use this script for a polished demo:

```bash
# 1. Install & start (say "Installing dependencies...")
cd web
npm install
npm run dev

# 2. Wait for server to start, then say "Opening browser..."
# → Browser opens to http://localhost:3000

# 3. Say "Let me analyze a popular open-source project..."
# → Click input field
# → Paste: https://github.com/lodash/lodash
# → Click "Analyze Repository"

# 4. While analyzing, say:
# "The system is now:
#  - Cloning the repository (shallow, just latest commit)
#  - Detecting technologies: languages, frameworks, dependencies
#  - Analyzing the structure and API endpoints
#  - Generating a visual architecture diagram
#  - Querying an LLM for intelligent insights"

# 5. After analysis, say:
# "Here's what we found:
#  - Programming language: JavaScript
#  - Framework: Node.js
#  - Top dependencies: [read from JSON]
#  - Beautiful architecture diagram shows structure at a glance
#  - AI summary provides onboarding checklist"

# 6. Click "Generate CI & Open PR" if enabled, say:
# "With one more click, we can:
#  - Generate a GitHub Actions workflow tailored to this tech stack
#  - Automatically create a pull request
#  - Start CI/CD pipeline immediately"
```

---

## 🎁 Key Features to Highlight

| Feature | Demo Highlight | User Benefit |
|---------|-----------------|--------------|
| **Speed** | "Analysis in <5 seconds" | No waiting, real-time |
| **Accuracy** | "Correctly identifies 10+ languages" | Reliable detection |
| **Visuals** | "Beautiful Mermaid diagram" | Understand at a glance |
| **AI Insights** | "LLM-powered summary" | Expert recommendations |
| **Automation** | "One-click CI/CD" | Minutes instead of hours |
| **Flexible** | "Works on any public repo" | No setup per-repo |

---

## 🎤 Talking Points

### Problem
> "Developers spend hours exploring new codebases, manually identifying technologies, and setting up CI/CD workflows. This slows onboarding and reduces productivity."

### Solution
> "RepoArchitectAgent automatically analyzes any GitHub repo and generates diagrams, summaries, and CI/CD pipelines in seconds. One command, complete understanding."

### Impact
> "What took 3 hours now takes 3 minutes. Better onboarding, faster development, standard CI/CD across projects."

### Tech
> "Built with Next.js for the UI, Python for analysis, Node.js for orchestration, Kestra for scheduling, and Oumi AI for intelligent summaries."

### Integration
> "Showcases Kestra for orchestration, Oumi for efficient LLM costs, CodeRabbit for automated code review, and Vercel for frictionless deployment."

---

## ✅ Demo Checklist

- [ ] All prerequisites installed (Node, Python, Git)
- [ ] Browser ready (http://localhost:3000)
- [ ] Sample repo URLs copied
- [ ] API keys set (optional but recommended)
- [ ] Microphone tested
- [ ] Screen recording ready (if recording)
- [ ] Backup repo URL in case network issue
- [ ] Troubleshooting guide reviewed

---

## 🎬 Record Your Demo

**Recommended Tool**: OBS Studio (free)

**Recording Settings**:
- Resolution: 1920x1080 (or 1280x720)
- FPS: 30
- Codec: H.264

**Recording Tips**:
1. Close unnecessary browser tabs
2. Zoom to 125% for better visibility
3. Use clear, deliberate clicking
4. Speak clearly and at steady pace
5. Pause before/after key steps for emphasis

**Edit Your Video**:
- Use DaVinci Resolve (free) or similar
- Add title card: "RepoArchitectAgent Demo"
- Add captions for clarity
- Target length: 2-3 minutes
- Upload to YouTube unlisted

---

## 🚀 Next Steps

After the demo:
1. Deploy to Vercel: [README.md](../README.md#deployment)
2. Test end-to-end on more repos
3. Collect user feedback
4. Polish error messages
5. Add more framework templates
6. Consider batch processing feature

---

**Happy demoing! 🎉**

Questions? See [README.md](../README.md) or [docs/](../docs/) for full documentation.
