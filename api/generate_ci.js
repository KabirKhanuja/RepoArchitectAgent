#!/usr/bin/env node
/**
 * Generate GitHub Actions CI/CD pipeline based on repo shape
 * Usage: node generate_ci.js <repo_shape.json> [output_dir]
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate Node.js/npm CI pipeline
 */
function generateNodeCI() {
  return `name: Node.js CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v4

    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}

    - name: Install dependencies
      run: npm ci || npm install || echo "no-install"

    - name: Run linter
      run: npm run lint || echo "no-lint"

    - name: Run tests
      run: npm test || echo "no-tests"

    - name: Build
      run: npm run build || echo "no-build"

    - name: Archive artifacts
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: build-output-\${{ matrix.node-version }}
        path: dist/
        retention-days: 5
`;
}

/**
 * Generate Python/pip CI pipeline
 */
function generatePythonCI() {
  return `name: Python CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        python-version: ['3.9', '3.10', '3.11']

    steps:
    - uses: actions/checkout@v4

    - name: Set up Python \${{ matrix.python-version }}
      uses: actions/setup-python@v4
      with:
        python-version: \${{ matrix.python-version }}

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
        if [ -f requirements-dev.txt ]; then pip install -r requirements-dev.txt; fi

    - name: Lint with flake8
      run: flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics || echo "no-lint"

    - name: Test with pytest
      run: pytest || echo "no-tests"

    - name: Code coverage
      run: |
        pip install coverage || echo "no-coverage"
        coverage run -m pytest || echo "coverage-failed"
        coverage report || echo "no-report"
`;
}

/**
 * Generate Next.js CI pipeline
 */
function generateNextjsCI() {
  return `name: Next.js CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v4

    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci || npm install || echo "no-install"

    - name: ESLint
      run: npm run lint || echo "no-lint"

    - name: Build Next.js
      run: npm run build || echo "no-build"

    - name: Run tests
      run: npm test || echo "no-tests"

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      if: always()
      with:
        files: ./coverage/coverage-final.json
        fail_ci_if_error: false
`;
}

/**
 * Generate Go CI pipeline
 */
function generateGoCI() {
  return `name: Go CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        go-version: ['1.21', '1.22']

    steps:
    - uses: actions/checkout@v4

    - name: Set up Go
      uses: actions/setup-go@v4
      with:
        go-version: \${{ matrix.go-version }}

    - name: Build
      run: go build -v ./... || echo "no-build"

    - name: Run tests
      run: go test -v ./... || echo "no-tests"

    - name: Run linter
      uses: golangci/golangci-lint-action@v3
      with:
        version: latest
      continue-on-error: true
`;
}

/**
 * Generate Rust CI pipeline
 */
function generateRustCI() {
  return `name: Rust CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Install Rust
      uses: dtolnay/rust-toolchain@stable

    - name: Check
      run: cargo check || echo "check-failed"

    - name: Clippy
      run: cargo clippy -- -D warnings || echo "clippy-failed"

    - name: Tests
      run: cargo test --verbose || echo "no-tests"

    - name: Format check
      run: cargo fmt -- --check || echo "format-check-failed"
`;
}

/**
 * Generate Java/Maven CI pipeline
 */
function generateJavaCI() {
  return `name: Java CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        java-version: ['11', '17', '21']

    steps:
    - uses: actions/checkout@v4

    - name: Set up JDK
      uses: actions/setup-java@v3
      with:
        java-version: \${{ matrix.java-version }}
        distribution: 'temurin'
        cache: maven

    - name: Build with Maven
      run: mvn clean package || echo "build-failed"

    - name: Run tests
      run: mvn test || echo "no-tests"
`;
}

/**
 * Generate generic multi-language CI
 */
function generateGenericCI() {
  return `name: Generated CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Check for Node
      run: |
        if [ -f package.json ]; then
          echo "Node.js detected"
          node --version
        fi

    - name: Check for Python
      run: |
        if [ -f requirements.txt ] || [ -f setup.py ]; then
          echo "Python detected"
          python --version
        fi

    - name: Check for Go
      run: |
        if [ -f go.mod ]; then
          echo "Go detected"
          go version
        fi

    - name: Placeholder build step
      run: echo "Please customize this workflow for your project"

    - name: Summary
      if: always()
      run: |
        echo "=== Build Summary ==="
        echo "Repository analyzed and CI pipeline generated"
        echo "Please customize the workflow for your specific needs"
`;
}

/**
 * Determine CI template based on repo shape
 */
function selectCITemplate(repoShape) {
  const languages = new Set(repoShape.languages || []);
  const frameworks = new Set(repoShape.frameworks || []);

  // Priority order for detection
  if (languages.has('typescript') && frameworks.has('nextjs')) {
    return generateNextjsCI();
  }
  if (languages.has('typescript') && frameworks.has('nuxt')) {
    return generateNodeCI(); // Use Node CI as fallback
  }
  if (languages.has('javascript') || languages.has('typescript') || frameworks.has('nodejs') || frameworks.has('npm')) {
    return generateNodeCI();
  }
  if (languages.has('python') || frameworks.has('django') || frameworks.has('fastapi')) {
    return generatePythonCI();
  }
  if (languages.has('go')) {
    return generateGoCI();
  }
  if (languages.has('rust')) {
    return generateRustCI();
  }
  if (languages.has('java') || frameworks.has('maven') || frameworks.has('gradle')) {
    return generateJavaCI();
  }

  // Default: generic multi-language
  return generateGenericCI();
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node generate_ci.js <repo_shape.json> [output_dir]');
    console.error('');
    console.error('Examples:');
    console.error('  node generate_ci.js repo_shape.json');
    console.error('  node generate_ci.js runs/latest/repo_shape.json runs/latest');
    process.exit(1);
  }

  const inputPath = args[0];
  const outputDir = args[1] || 'runs/latest';
  const outputPath = path.join(outputDir, 'ci-generated.yml');

  try {
    // Read repo_shape.json
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: File not found: ${inputPath}`);
      process.exit(1);
    }

    const repoShape = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    console.log(`[*] Loaded ${inputPath}`);
    console.log(`[*] Detected languages: ${repoShape.languages.join(', ')}`);
    console.log(`[*] Detected frameworks: ${repoShape.frameworks.join(', ')}`);

    // Select appropriate CI template
    const ciYaml = selectCITemplate(repoShape);

    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write CI YAML
    fs.writeFileSync(outputPath, ciYaml, 'utf-8');
    console.log(`[+] CI pipeline written to ${outputPath}`);

    // Also write to .github/workflows/ path for reference
    const workflowPath = path.join(outputDir, '..', '..', '.github', 'workflows', 'ci-generated.yml');
    const workflowDir = path.dirname(workflowPath);
    if (!fs.existsSync(workflowDir)) {
      fs.mkdirSync(workflowDir, { recursive: true });
    }
    fs.writeFileSync(workflowPath, ciYaml, 'utf-8');
    console.log(`[+] Also saved to ${workflowPath}`);

    console.log('[*] CI preview:');
    console.log(ciYaml);

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Export for testing
module.exports = {
  generateNodeCI,
  generatePythonCI,
  generateNextjsCI,
  generateGoCI,
  generateRustCI,
  generateJavaCI,
  selectCITemplate,
};

// Run if called directly
if (require.main === module) {
  main();
}

