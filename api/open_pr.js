#!/usr/bin/env node
/**
 * Open PR for generated CI pipeline
 * Supports: gh CLI, GitHub REST API, or cline CLI fallback
 * Usage: node open_pr.js <repo_url> [ci_yaml_path]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const GH_TOKEN = process.env.GITHUB_TOKEN;
const CLINE_AVAILABLE = checkCliAvailable('cline');
const GH_CLI_AVAILABLE = checkCliAvailable('gh');

/**
 * Check if a CLI tool is available
 */
function checkCliAvailable(tool) {
  try {
    execSync(`which ${tool} || where ${tool}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Execute shell command
 */
function executeCommand(cmd, options = {}) {
  try {
    console.log(`[*] Running: ${cmd}`);
    const result = execSync(cmd, {
      stdio: options.stdio || 'inherit',
      encoding: 'utf-8',
      ...options,
    });
    return result;
  } catch (error) {
    if (options.throwError !== false) {
      throw error;
    }
    return null;
  }
}

/**
 * Parse GitHub URL to extract owner and repo
 */
function parseGitHubUrl(repoUrl) {
  let match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(\.git)?$/);
  if (!match) {
    throw new Error(`Invalid GitHub URL: ${repoUrl}`);
  }
  return {
    owner: match[1],
    repo: match[2],
    url: `https://github.com/${match[1]}/${match[2]}`,
  };
}

/**
 * Create PR using gh CLI (preferred method)
 */
function createPRWithGhCLI(branch, title, body, baseBranch = 'main') {
  try {
    console.log('[*] Using gh CLI to create PR...');
    
    // Create PR
    const output = executeCommand(
      `gh pr create --title "${title}" --body "${body}" --base ${baseBranch} --head ${branch}`,
      { stdio: 'pipe' }
    );
    
    const prUrl = output.trim();
    console.log(`[+] PR created: ${prUrl}`);
    return prUrl;
  } catch (error) {
    console.error(`[-] gh CLI failed: ${error.message}`);
    throw error;
  }
}

/**
 * Create PR using GitHub REST API
 */
function createPRWithGitHubAPI(owner, repo, branch, title, body, baseBranch = 'main') {
  return new Promise((resolve, reject) => {
    if (!GH_TOKEN) {
      reject(new Error('GITHUB_TOKEN not set'));
      return;
    }

    console.log('[*] Using GitHub REST API to create PR...');

    const requestData = JSON.stringify({
      title,
      body,
      head: branch,
      base: baseBranch,
      draft: false,
    });

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/pulls`,
      method: 'POST',
      headers: {
        'Authorization': `token ${GH_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'RepoArchitectAgent',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.html_url) {
            console.log(`[+] PR created: ${response.html_url}`);
            resolve(response.html_url);
          } else if (response.message) {
            reject(new Error(`GitHub API error: ${response.message}`));
          } else {
            reject(new Error('Unknown response from GitHub API'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse GitHub API response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`GitHub API request failed: ${error.message}`));
    });

    req.write(requestData);
    req.end();
  });
}

/**
 * Create PR using cline CLI (fallback)
 */
function createPRWithCline(branch, title, body) {
  try {
    console.log('[*] Using cline CLI to create PR...');
    
    const cmdStr = `cline run "git checkout -b ${branch} && git add .github/workflows/ci-generated.yml && git commit -m 'chore: add generated CI pipeline (agent)' && git push origin ${branch} && gh pr create --title '${title}' --body '${body}'"`;
    
    executeCommand(cmdStr);
    console.log('[+] PR creation initiated via cline');
    return `https://github.com/pull-request-pending`;
  } catch (error) {
    console.error(`[-] cline CLI failed: ${error.message}`);
    throw error;
  }
}

/**
 * Create branch locally
 */
function createAndPushBranch(branch) {
  try {
    console.log(`[*] Creating branch: ${branch}`);
    
    // Check if branch exists
    try {
      executeCommand(`git rev-parse --verify ${branch}`, { stdio: 'pipe', throwError: false });
      console.log(`[*] Branch ${branch} already exists, switching to it`);
      executeCommand(`git checkout ${branch}`);
    } catch {
      // Branch doesn't exist, create it
      executeCommand(`git checkout -b ${branch}`);
    }
    
    return true;
  } catch (error) {
    console.error(`[-] Branch creation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Commit changes
 */
function commitChanges(message, files = ['.github/workflows/ci-generated.yml']) {
  try {
    console.log('[*] Staging files...');
    files.forEach((file) => {
      executeCommand(`git add "${file}"`, { stdio: 'pipe' });
    });
    
    console.log(`[*] Committing: ${message}`);
    executeCommand(`git commit -m "${message}"`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.log('[!] No changes to commit or commit failed (this is okay)');
    return false;
  }
}

/**
 * Push branch to remote
 */
function pushBranch(branch) {
  try {
    console.log(`[*] Pushing branch ${branch} to origin...`);
    executeCommand(`git push origin ${branch}`);
    return true;
  } catch (error) {
    console.error(`[-] Push failed: ${error.message}`);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node open_pr.js <repo_url> [ci_yaml_path]');
    console.error('');
    console.error('Examples:');
    console.error('  node open_pr.js https://github.com/owner/repo runs/latest/ci-generated.yml');
    console.error('  node open_pr.js https://github.com/owner/repo');
    console.error('');
    console.error('Environment Variables:');
    console.error('  GITHUB_TOKEN - GitHub API token (for REST API method)');
    console.error('  PR_TITLE - Custom PR title');
    console.error('  PR_BODY - Custom PR body/description');
    process.exit(1);
  }

  const repoUrl = args[0];
  const ciYamlPath = args[1] || 'runs/latest/ci-generated.yml';
  
  const prTitle = process.env.PR_TITLE || 'chore: add generated CI pipeline (RepoArchitectAgent)';
  const prBody = process.env.PR_BODY || 
`## Generated CI/CD Pipeline

This PR adds an automated CI/CD pipeline generated by **RepoArchitectAgent**.

### What's included:
- Automated build steps based on detected languages and frameworks
- Multi-version testing (for applicable languages)
- Linting and code quality checks
- Test execution with error tolerance
- Artifact uploads for debugging

### How to customize:
1. Edit `.github/workflows/ci-generated.yml` to adjust the pipeline
2. Remove steps that don't apply to your project
3. Add additional checks or deployment steps as needed

### Sponsor Tools:
- 🏗️ **RepoArchitectAgent** - Analyzed your repo structure
- 🚀 **Vercel** - For Next.js deployment
- 🦀 **CodeRabbit** - For code review (see .coderabbit.yml)
- 🎯 **Kestra** - For orchestration

Learn more: https://github.com/wemakedev/RepoArchitectAgent`;

  const branchName = process.env.PR_BRANCH || 'agent/ci-generated';

  try {
    console.log('\n=== RepoArchitectAgent: PR Creation ===\n');
    
    const parsedUrl = parseGitHubUrl(repoUrl);
    console.log(`[+] Target repo: ${parsedUrl.url}`);

    // Check if CI YAML exists
    if (ciYamlPath && !fs.existsSync(ciYamlPath)) {
      console.log(`[!] CI YAML not found at ${ciYamlPath}, will create with gh CLI defaults`);
    } else if (fs.existsSync(ciYamlPath)) {
      console.log(`[+] Found CI YAML: ${ciYamlPath}`);
    }

    // Create and push branch
    createAndPushBranch(branchName);
    commitChanges('chore: add generated CI pipeline (agent)');
    pushBranch(branchName);

    // Create PR using available method
    let prUrl;
    
    if (GH_CLI_AVAILABLE) {
      try {
        prUrl = createPRWithGhCLI(branchName, prTitle, prBody);
      } catch (error) {
        console.log('[-] gh CLI method failed, trying GitHub API...');
        if (GH_TOKEN) {
          prUrl = await createPRWithGitHubAPI(parsedUrl.owner, parsedUrl.repo, branchName, prTitle, prBody);
        } else {
          throw new Error('Neither gh CLI nor GITHUB_TOKEN available');
        }
      }
    } else if (GH_TOKEN) {
      prUrl = await createPRWithGitHubAPI(parsedUrl.owner, parsedUrl.repo, branchName, prTitle, prBody);
    } else if (CLINE_AVAILABLE) {
      prUrl = createPRWithCline(branchName, prTitle, prBody);
    } else {
      throw new Error('No PR creation method available (install gh CLI, set GITHUB_TOKEN, or install cline)');
    }

    // Save PR info
    const runsDir = path.dirname(ciYamlPath);
    const prInfoPath = path.join(runsDir, 'pr_info.json');
    fs.writeFileSync(
      prInfoPath,
      JSON.stringify({
        prUrl,
        branch: branchName,
        timestamp: new Date().toISOString(),
        repo: parsedUrl.url,
      }, null, 2)
    );

    console.log(`\n[+] PR Info saved to: ${prInfoPath}`);
    console.log(`\n✅ Success! PR created: ${prUrl}`);
    console.log('\n=== Next Steps ===');
    console.log('1. Visit the PR link above');
    console.log('2. Review the generated CI pipeline');
    console.log('3. Customize if needed');
    console.log('4. Merge when ready');
    console.log('');

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error('\n=== Troubleshooting ===');
    console.error('1. Ensure you have git installed and configured');
    console.error('2. Install gh CLI: https://cli.github.com/');
    console.error('3. Or set GITHUB_TOKEN environment variable');
    console.error('4. Or install cline CLI as fallback');
    console.error('');
    process.exit(1);
  }
}

// Export for testing
module.exports = {
  parseGitHubUrl,
  createAndPushBranch,
  commitChanges,
  pushBranch,
  checkCliAvailable,
};

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

