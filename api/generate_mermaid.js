#!/usr/bin/env node
/**
 * Generates Mermaid diagrams from repo_shape.json
 * Usage: node generate_mermaid.js <repo_shape.json> [output_dir]
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate a Mermaid diagram from repo shape data
 * @param {Object} repoShape - Parsed repo_shape.json data
 * @returns {string} - Mermaid diagram syntax
 */
function generateMermaidDiagram(repoShape) {
  const lines = [];
  
  // Start with graph
  lines.push('graph TD');
  lines.push('');
  
  // Main repository node
  const repoName = repoShape.url.split('/').pop();
  lines.push(`  Repo["📦 ${repoName}"]`);
  lines.push('');
  
  // Languages subgraph
  if (repoShape.languages && repoShape.languages.length > 0) {
    lines.push('  subgraph Languages');
    const langNodes = repoShape.languages.map((lang, i) => {
      const icon = getLanguageIcon(lang);
      return `    Lang${i}["${icon} ${lang}"]`;
    });
    lines.push(langNodes.join('\n'));
    lines.push('  end');
    lines.push('');
    
    // Connect repo to languages
    repoShape.languages.forEach((_, i) => {
      lines.push(`  Repo --> Lang${i}`);
    });
    lines.push('');
  }
  
  // Frameworks subgraph
  if (repoShape.frameworks && repoShape.frameworks.length > 0) {
    lines.push('  subgraph Frameworks');
    const frameworkNodes = repoShape.frameworks.map((fw, i) => {
      const icon = getFrameworkIcon(fw);
      return `    FW${i}["${icon} ${fw}"]`;
    });
    lines.push(frameworkNodes.join('\n'));
    lines.push('  end');
    lines.push('');
    
    // Connect repo to frameworks
    repoShape.frameworks.forEach((_, i) => {
      lines.push(`  Repo --> FW${i}`);
    });
    lines.push('');
  }
  
  // Top-level structure
  if (repoShape.top_level_directories && repoShape.top_level_directories.length > 0) {
    lines.push('  subgraph Structure');
    const dirs = repoShape.top_level_directories.slice(0, 8); // Limit to 8 for readability
    const dirNodes = dirs.map((dir, i) => {
      return `    Dir${i}["📁 ${dir}"]`;
    });
    lines.push(dirNodes.join('\n'));
    lines.push('  end');
    lines.push('');
    
    dirs.forEach((_, i) => {
      lines.push(`  Repo --> Dir${i}`);
    });
    lines.push('');
  }
  
  // API Endpoints
  if (repoShape.api_endpoints && Object.keys(repoShape.api_endpoints).length > 0) {
    lines.push('  subgraph APIs');
    let apiCounter = 0;
    for (const [type, endpoints] of Object.entries(repoShape.api_endpoints)) {
      if (!endpoints || endpoints.length === 0) continue;
      
      const displayEndpoints = endpoints.slice(0, 3); // Show up to 3
      displayEndpoints.forEach((endpoint, i) => {
        const sanitized = endpoint.replace(/"/g, '').substring(0, 30);
        lines.push(`    API${apiCounter}["🔌 ${sanitized}"]`);
        lines.push(`    Repo --> API${apiCounter}`);
        apiCounter++;
      });
      
      if (endpoints.length > 3) {
        lines.push(`    APIMore${apiCounter}["... +${endpoints.length - 3} more"]`);
        lines.push(`    Repo --> APIMore${apiCounter}`);
        apiCounter++;
      }
    }
    lines.push('  end');
    lines.push('');
  }
  
  // Dependencies (if any)
  if (repoShape.dependencies && Object.keys(repoShape.dependencies).length > 0) {
    lines.push('  subgraph Dependencies');
    let depCounter = 0;
    for (const [pkgMgr, deps] of Object.entries(repoShape.dependencies)) {
      if (!deps || deps.length === 0) continue;
      
      const displayDeps = deps.slice(0, 3); // Show up to 3 per manager
      displayDeps.forEach((dep, i) => {
        lines.push(`    Dep${depCounter}["📦 ${dep}"]`);
        depCounter++;
      });
      
      if (deps.length > 3) {
        lines.push(`    DepMore${depCounter}["... +${deps.length - 3} ${pkgMgr}"]`);
        depCounter++;
      }
    }
    lines.push('  end');
    lines.push('');
    
    // Connect to a dependency node
    if (depCounter > 0) {
      lines.push(`  Repo -.Dependencies.- Dep0`);
    }
    lines.push('');
  }
  
  // Docker
  if (repoShape.has_dockerfile) {
    lines.push('  Docker["🐳 Docker"]');
    lines.push('  Repo --> Docker');
    lines.push('');
  }
  
  // File count info
  if (repoShape.file_count) {
    lines.push(`  Stats["📊 ${repoShape.file_count} files"]`);
    lines.push('  Repo -.-> Stats');
  }
  
  // Styling
  lines.push('');
  lines.push('  classDef repo fill:#4f46e5,color:#fff,stroke:#312e81,stroke-width:2px');
  lines.push('  classDef category fill:#10b981,color:#fff,stroke:#065f46,stroke-width:1px');
  lines.push('  class Repo repo');
  
  return lines.join('\n');
}

/**
 * Get emoji icon for programming language
 */
function getLanguageIcon(lang) {
  const icons = {
    'javascript': '📜',
    'typescript': '📘',
    'python': '🐍',
    'java': '☕',
    'go': '🐹',
    'rust': '🦀',
    'ruby': '💎',
    'php': '🐘',
    'csharp': '#️⃣',
    'cpp': '⚙️',
    'c': '🔧',
  };
  return icons[lang] || '💻';
}

/**
 * Get emoji icon for framework
 */
function getFrameworkIcon(fw) {
  const icons = {
    'react': '⚛️',
    'vue': '💚',
    'angular': '🅰️',
    'nextjs': '▲',
    'nuxt': '🟢',
    'express': '🚂',
    'fastapi': '⚡',
    'django': '🦜',
    'docker': '🐳',
    'docker-compose': '🐳',
    'github-actions': '⚙️',
    'gitlab-ci': '🦊',
    'kubernetes': '☸️',
    'nodejs': '📦',
    'npm': '📦',
    'yarn': '🧶',
    'pip': '🐍',
    'maven': '🔨',
    'gradle': '🔨',
    'webpack': '📦',
    'vite': '⚡',
  };
  return icons[fw] || '🔧';
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node generate_mermaid.js <repo_shape.json> [output_dir]');
    console.error('');
    console.error('Examples:');
    console.error('  node generate_mermaid.js repo_shape.json');
    console.error('  node generate_mermaid.js repo_shape.json runs/latest');
    process.exit(1);
  }
  
  const inputPath = args[0];
  const outputDir = args[1] || path.dirname(inputPath);
  const outputPath = path.join(outputDir, 'diagram.mmd');
  
  try {
    // Read repo_shape.json
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: File not found: ${inputPath}`);
      process.exit(1);
    }
    
    const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    console.log(`[*] Loaded ${inputPath}`);
    
    // Generate Mermaid diagram
    const diagram = generateMermaidDiagram(data);
    
    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write diagram
    fs.writeFileSync(outputPath, diagram, 'utf-8');
    console.log(`[+] Mermaid diagram written to ${outputPath}`);
    
    // Also print to stdout for debugging
    console.log('[*] Diagram preview:');
    console.log(diagram);
    
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Export for testing
module.exports = { generateMermaidDiagram };

// Run if called directly
if (require.main === module) {
  main();
}

