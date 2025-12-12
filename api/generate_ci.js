#!/usr/bin/env node
const fs = require('fs');

function generateYaml(data) {
  return `name: Generated CI\n\non: [push]\n\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 18\n      - run: echo \'Found ${data.files?.length || 0} files\'\n`;
}

function main() {
  const [inPath, outPath] = process.argv.slice(2);
  if (!inPath || !outPath) {
    console.error('Usage: node generate_ci.js <input.json> <output.yml>');
    process.exit(1);
  }
  const json = JSON.parse(fs.readFileSync(inPath, 'utf8'));
  const yaml = generateYaml(json);
  fs.mkdirSync(require('path').dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, yaml, 'utf8');
  console.log('Wrote', outPath);
}

if (require.main === module) main();
