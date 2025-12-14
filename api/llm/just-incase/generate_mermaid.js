const fs = require('fs');

function toMermaid(data) {
  const files = data.files || [];
  const lines = ['graph TD'];
  files.slice(0, 50).forEach((f, i) => {
    lines.push(`A --> F${i}(${f.replace(/`/g, '')})`);
  });
  return lines.join('\n');
}

function main() {
  const [inPath, outPath] = process.argv.slice(2);
  if (!inPath || !outPath) {
    console.error('Usage: node generate_mermaid.js <input.json> <output.mmd>');
    process.exit(1);
  }
  const json = JSON.parse(fs.readFileSync(inPath, 'utf8'));
  const mmd = toMermaid(json);
  fs.mkdirSync(require('path').dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, mmd, 'utf8');
  console.log('Wrote', outPath);
}

if (require.main === module) main();
