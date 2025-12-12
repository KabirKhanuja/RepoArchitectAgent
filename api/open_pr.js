#!/usr/bin/env node
const { execSync } = require('child_process');

function main() {
  const title = process.env.PR_TITLE || 'RepoArchitectAgent Update';
  const body = process.env.PR_BODY || 'Automated PR opened by script.';
  try {
    execSync('git checkout -b chore/auto-pr', { stdio: 'inherit' });
  } catch {}
  execSync('git add -A', { stdio: 'inherit' });
  execSync("git commit -m 'chore: automated changes' || true", { stdio: 'inherit' });
  execSync(`gh pr create --fill --title \"${title}\" --body \"${body}\"`, { stdio: 'inherit' });
}

if (require.main === module) main();
