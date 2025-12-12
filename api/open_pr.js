#!/usr/bin/env node
const { execSync } = require('child_process');

function main() {
  const title = process.env.PR_TITLE || 'RepoArchitectAgent Update';
  const body = process.env.PR_BODY || 'Automated PR opened by script.';
  const branch = process.env.PR_BRANCH || 'chore/auto-pr';
  const commitMessage = process.env.PR_COMMIT_MESSAGE || 'chore: automated changes';

  try {
    execSync(`git checkout -b ${branch}`, { stdio: 'inherit' });
  } catch {}

  execSync('git add -A', { stdio: 'inherit' });
  execSync(`git commit -m "${commitMessage}" || true`, { stdio: 'inherit' });
  execSync(`gh pr create --fill --title "${title}" --body "${body}"`, { stdio: 'inherit' });
}

if (require.main === module) main();
