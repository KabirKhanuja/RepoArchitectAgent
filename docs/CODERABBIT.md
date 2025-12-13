# CodeRabbit Integration Guide

## Overview

**CodeRabbit** is an AI-powered code review tool that automatically reviews pull requests and provides intelligent suggestions for improvements.

This project includes a `.coderabbit.yml` configuration that enables automated code review with focus on:
- Security vulnerabilities
- Performance optimizations
- Code maintainability
- Best practices
- Test coverage
- Documentation

## Setup Instructions

### 1. Install CodeRabbit

CodeRabbit is available as a GitHub App. To enable it:

1. Visit: https://github.com/apps/coderabbit
2. Click **"Install"** and select your repository
3. Grant necessary permissions (code access, PR comments)

### 2. Configuration

The `.coderabbit.yml` file in the repository root contains all settings:

```yaml
# Main configuration file for CodeRabbit
# Located at: ./.coderabbit.yml

version: 1
enabled: true
reviews:
  auto_review: true
  pull_request: true
checks:
  complexity: true
  duplication: true
  security: true
  performance: true
  maintainability: true
```

### 3. How It Works

#### Automatic Review Trigger
- CodeRabbit reviews **every PR** automatically
- Runs in parallel with GitHub Actions
- No additional configuration needed

#### Review Scope
- **Files analyzed**: All files except those in `skip_patterns`
- **Skipped**: node_modules, dist, build, .next, venv, test files
- **Max files**: Up to 50 files per PR (configurable)

#### Review Focus Areas
1. **Security** 🔒
   - Hardcoded credentials
   - Known vulnerabilities
   - Unsafe patterns

2. **Performance** ⚡
   - Inefficient algorithms
   - Memory leaks
   - N+1 query patterns

3. **Maintainability** 📚
   - Code duplication
   - Cyclomatic complexity
   - Naming conventions
   - Documentation gaps

4. **Best Practices** ✅
   - Language idioms
   - Framework patterns
   - Error handling
   - Type safety

5. **Testing** 🧪
   - Test coverage for changes
   - Missing test cases
   - Test quality

## Features

### 1. Automated Comments
CodeRabbit posts PR comments with:
- Issue severity (critical, high, medium, low)
- Specific file and line references
- Actionable suggestions
- Code examples (when applicable)

**Example comment:**
```
🔍 Code Review by CodeRabbit

**Critical Issues** (1)
- Line 42: Hardcoded API key detected. Move to environment variable.

**High Priority** (2)
- Line 15: Missing error handling in async function
- Line 88: Potential N+1 query pattern

**Medium Priority** (1)
- Line 23: Code duplication (also appears in file2.js)

**Suggestions** (3)
- Add JSDoc for function at line 10
- Consider extracting repeated logic
```

### 2. Customizable Rules

Rules are defined in `.coderabbit.yml`:

```yaml
rules:
  - name: no-console-in-prod
    description: Avoid console logs in production
    files: ["web/**", "api/**"]
    patterns:
      - "console\\.(log|warn|error)"
    severity: "medium"

  - name: no-hardcoded-credentials
    description: Do not commit API keys
    patterns:
      - "(password|api_key|secret)\\s*=\\s*['\"]"
    severity: "critical"
```

### 3. Language Support

CodeRabbit provides specialized reviews for:
- **JavaScript/TypeScript** - ESLint rules, async/await patterns, type checking
- **Python** - PEP 8 compliance, async patterns, type hints
- **Java** - Spring patterns, Maven best practices
- **Go** - Goroutine safety, error handling
- **Rust** - Ownership patterns, unsafe blocks
- **SQL** - Query optimization, SQL injection prevention

## Customization

### Skip Certain Files
Edit `.coderabbit.yml`:

```yaml
skip_patterns:
  - "node_modules/"
  - "dist/"
  - "**/*.generated.js"  # Add custom patterns
```

### Modify Review Severity
```yaml
enforcement:
  security_check:
    enabled: true
    fail_on_critical: true  # Block merge on critical issues
```

### Disable Specific Rules
```yaml
rules:
  - name: performance-improvements
    enabled: false  # Won't flag performance issues
```

### Add Custom Prompt
```yaml
custom_prompt: |
  Focus on:
  1. Security vulnerabilities
  2. Performance improvements
  3. Error handling patterns
```

## Integration with CI/CD

### GitHub Actions Integration
CodeRabbit runs **in parallel** with your GitHub Actions workflows:

```
PR Created
├── GitHub Actions (your CI)
│   └── Tests, Build, Lint
└── CodeRabbit Review
    └── AI-powered suggestions
```

No additional configuration needed - both run automatically.

### PR Merge Protection (Optional)
You can require CodeRabbit approval before merge:

In **GitHub Repository Settings** → **Branch Protection Rules**:
1. Add rule for `main` branch
2. Under **Require approvals**, add "CodeRabbit" as required reviewer
3. CodeRabbit will approve automatically if issues found are low-priority

## Sponsorship Evidence

### Integration Points with RepoArchitectAgent

1. **Configuration in Repo**
   - File: `.coderabbit.yml`
   - Demonstrates: Code review automation setup

2. **Generated PRs**
   - CodeRabbit reviews all agent-generated CI PRs
   - Validates CI YAML syntax
   - Suggests improvements to generated pipelines

3. **Security Checks**
   - Prevents hardcoded credentials
   - Validates generated CI doesn't expose secrets
   - Checks GitHub Actions workflow security

4. **Documentation**
   - This file: `docs/CODERABBIT.md`
   - Proves: Integration documentation

### How to See Evidence
1. Open any PR in the repository
2. Look for **CodeRabbit** comments
3. See automated suggestions and checks
4. Check `.coderabbit.yml` for configuration

## Troubleshooting

### CodeRabbit Not Commenting on PRs
1. Verify CodeRabbit app is installed (Settings → Apps → Installed apps)
2. Check repository is in allowed list
3. Ensure `.coderabbit.yml` exists and is valid
4. Check PR comment permissions are granted

### Too Many Comments/Noise
Adjust in `.coderabbit.yml`:
```yaml
enforcement:
  duplication:
    threshold: 0.15  # Increase threshold
  
  documentation:
    enabled: false  # Disable if too strict
```

### Slow Reviews
Optimize:
```yaml
reviews:
  max_files_to_review: 30  # Reduce from 50
  
skip_patterns:
  - "**/*.test.js"  # Skip test files
  - "coverage/"     # Skip generated files
```

## Advanced Usage

### Blocking Merges on Critical Issues
In `.coderabbit.yml`:
```yaml
enforcement:
  security_check:
    fail_on_critical: true  # Blocks merge
```

### Custom Integration with Slack
```yaml
integrations:
  slack:
    enabled: true
    webhook_url: "${SLACK_WEBHOOK_URL}"
```

Then in GitHub Actions:
```bash
export SLACK_WEBHOOK_URL=${{ secrets.SLACK_WEBHOOK_URL }}
```

### Team-Specific Rules
Create branch-specific configs:
```yaml
rules:
  - name: api-security-check
    files: ["api/**"]
    severity: "critical"
    branches: ["main"]
```

## Cost & Limits

- **Free tier**: Limited reviews per month
- **Pro tier**: Unlimited reviews, custom rules
- **Enterprise**: Custom prompts, SLA

More info: https://coderabbit.ai/pricing

## Resources

- **Documentation**: https://docs.coderabbit.ai
- **GitHub App**: https://github.com/apps/coderabbit
- **Issues & Support**: https://github.com/coderabbit-ai/coderabbit

## See Also

- [README.md](../README.md) - Project overview
- [.coderabbit.yml](../.coderabbit.yml) - Configuration file
- [GitHub Actions](.github/workflows) - CI/CD pipelines
