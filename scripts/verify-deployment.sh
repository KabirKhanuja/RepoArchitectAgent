#!/bin/bash

# RepoArchitectAgent - Vercel Deployment Checklist
# Run this script to verify everything is ready for Vercel deployment

set -e

echo "🚀 RepoArchitectAgent Deployment Checklist"
echo "========================================="
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "  Found: $NODE_VERSION"
else
    echo "  ✗ Node.js not installed"
    exit 1
fi

# Check npm
echo "✓ Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "  Found: $NPM_VERSION"
else
    echo "  ✗ npm not installed"
    exit 1
fi

# Check git
echo "✓ Checking Git..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo "  Found: $GIT_VERSION"
else
    echo "  ✗ Git not installed"
    exit 1
fi

# Check GitHub token
echo "✓ Checking environment variables..."
if [ -z "$GITHUB_TOKEN" ]; then
    echo "  ⚠️  GITHUB_TOKEN not set (required for PR creation)"
else
    echo "  ✓ GITHUB_TOKEN is set"
fi

if [ -z "$OUMI_API_KEY" ]; then
    echo "  ⚠️  OUMI_API_KEY not set (optional, for AI summaries)"
else
    echo "  ✓ OUMI_API_KEY is set"
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "  ⚠️  OPENAI_API_KEY not set (optional, fallback LLM)"
else
    echo "  ✓ OPENAI_API_KEY is set"
fi

# Check web directory
echo "✓ Checking project structure..."
if [ -f "web/package.json" ]; then
    echo "  ✓ web/package.json found"
else
    echo "  ✗ web/package.json not found"
    exit 1
fi

if [ -f "web/next.config.js" ]; then
    echo "  ✓ web/next.config.js found"
else
    echo "  ✗ web/next.config.js not found"
    exit 1
fi

# Check vercel.json
echo "✓ Checking Vercel configuration..."
if [ -f "vercel.json" ]; then
    echo "  ✓ vercel.json found"
else
    echo "  ⚠️  vercel.json not found (will use defaults)"
fi

# Check GitHub workflow
echo "✓ Checking GitHub Actions..."
if [ -f ".github/workflows/deploy.yml" ]; then
    echo "  ✓ deploy.yml found"
else
    echo "  ⚠️  .github/workflows/deploy.yml not found"
fi

# Test build
echo "✓ Testing Next.js build..."
cd web
npm ci > /dev/null 2>&1 || npm install > /dev/null 2>&1
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "  ✓ Build successful"
else
    echo "  ✗ Build failed - check logs above"
    cd ..
    exit 1
fi
cd ..

echo ""
echo "========================================="
echo "✅ All checks passed!"
echo ""
echo "Next steps:"
echo "1. Push code to GitHub: git push origin main"
echo "2. Go to https://vercel.com/dashboard"
echo "3. Import your GitHub repository"
echo "4. Set environment variables:"
echo "   - GITHUB_TOKEN (required)"
echo "   - OUMI_API_KEY (optional)"
echo "   - OPENAI_API_KEY (optional)"
echo "5. Deploy!"
echo ""
echo "📖 See docs/VERCEL.md for detailed instructions"
echo ""
