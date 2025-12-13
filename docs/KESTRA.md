# Kestra Orchestration Guide

## Overview

**Kestra** is an open-source workflow orchestration platform that automates complex pipelines. 

This project includes a complete Kestra blueprint (`kestra/blueprint_repo_analysis.yml`) that orchestrates the entire RepoArchitectAgent pipeline:

```
Input (GitHub URL)
    ↓
Clone Repository (shallow)
    ↓
Analyze Repository Structure
    ↓
Generate Mermaid Diagram ──┐
    ↓                       ├──→ Archive Results
Generate CI Pipeline ──────┤
    ↓                       ├──→ Generate Report
Generate LLM Summary ──────┘
    ↓
Open Pull Request
```

## Installation

### 1. Install Kestra

#### Option A: Docker (Recommended)
```bash
docker run -d \
  -p 8080:8080 \
  -v kestra-data:/var/lib/kestra/data \
  kestra/kestra:latest
```

Then access the UI at: http://localhost:8080

#### Option B: Standalone Binary
```bash
# Download from https://releases.kestra.io/
wget https://github.com/kestra-io/kestra/releases/download/v0.13.0/kestra-0.13.0-linux-x86_64.zip
unzip kestra-*.zip
./kestra-*/bin/kestra server standalone
```

#### Option C: Local Development (Java Required)
```bash
git clone https://github.com/kestra-io/kestra
cd kestra
./gradlew bootRun
```

### 2. Register the Blueprint

**Option A: Via Web UI**
1. Open http://localhost:8080
2. Click **"Flows"** → **"Create"**
3. Copy/paste contents of `kestra/blueprint_repo_analysis.yml`
4. Click **"Save"**

**Option B: Via CLI**
```bash
kestra flow create --file kestra/blueprint_repo_analysis.yml
```

**Option C: Via API**
```bash
curl -X POST http://localhost:8080/api/v1/flows \
  -H "Content-Type: application/yaml" \
  -d @kestra/blueprint_repo_analysis.yml
```

## Blueprint Structure

### Inputs
```yaml
inputs:
  - name: repo_url
    type: STRING
    description: GitHub repository URL
    required: true
    
  - name: github_token
    type: STRING
    description: GitHub personal access token (for PR creation)
    required: false
    
  - name: run_timestamp
    type: STRING
    default: "{{ now | date('yyyyMMdd-HHmmss') }}"
```

### Tasks (8 Sequential Steps)

#### 1️⃣ **clone_repo** - Clone Repository
- **Type**: Git Clone
- **Timeout**: 5 minutes
- **Output**: Shallow clone of repository
- **Purpose**: Fetch the target repo locally

```yaml
type: io.kestra.plugin.git.Clone
url: "{{ inputs.repo_url }}"
depth: 1  # Shallow clone for speed
```

#### 2️⃣ **analyze_repo** - Analyze Repository
- **Type**: Python Script
- **Timeout**: Inherited (30 min total)
- **Runs**: `api/analyze_repo.py`
- **Output**: `repo_shape.json`
- **Purpose**: Extract languages, frameworks, dependencies, APIs

```yaml
type: io.kestra.plugin.scripts.python.Script
containerImage: python:3.11-slim
script: |
  python api/analyze_repo.py {{ inputs.repo_url }} {{ variables.run_dir }}
```

#### 3️⃣ **generate_diagram** - Generate Mermaid Diagram
- **Type**: Node Script
- **Runs**: `api/generate_mermaid.js`
- **Input**: `repo_shape.json`
- **Output**: `diagram.mmd`
- **Purpose**: Create visual architecture diagram

```yaml
type: io.kestra.plugin.scripts.node.Script
containerImage: node:18-alpine
script: |
  node api/generate_mermaid.js {{ variables.run_dir }}/repo_shape.json
```

#### 4️⃣ **generate_ci** - Generate CI Pipeline
- **Type**: Node Script
- **Runs**: `api/generate_ci.js`
- **Input**: `repo_shape.json`
- **Output**: `ci-generated.yml`
- **Purpose**: Create GitHub Actions workflow based on repo type

```yaml
type: io.kestra.plugin.scripts.node.Script
script: |
  node api/generate_ci.js {{ variables.run_dir }}/repo_shape.json
```

#### 5️⃣ **generate_summary** - Generate LLM Summary
- **Type**: Node Script
- **Timeout**: 2 minutes
- **Allows Failure**: Yes (optional, requires API keys)
- **Purpose**: Generate AI summary using Oumi or OpenAI

#### 6️⃣ **open_pr** - Open Pull Request
- **Type**: Node Script
- **Runs**: `api/open_pr.js`
- **Allows Failure**: Yes (requires GitHub credentials)
- **Purpose**: Create branch, commit, and open PR

#### 7️⃣ **archive_results** - Archive Artifacts
- **Type**: Archive Task
- **Output**: `artifacts.tar.gz`
- **Contains**:
  - repo_shape.json
  - diagram.mmd
  - ci-generated.yml

#### 8️⃣ **generate_report** - Generate Summary Report
- **Type**: Bash Script
- **Output**: Console report
- **Purpose**: Display summary and next steps

## Running the Blueprint

### Via Web UI

1. Navigate to **Flows** → **repo_architect_agent**
2. Click **"Execute"**
3. Fill in inputs:
   ```
   repo_url: https://github.com/owner/repo
   github_token: (optional) ghp_xxxxx
   run_timestamp: (auto-generated)
   ```
4. Click **"Execute"**
5. Monitor progress in real-time

### Via CLI

```bash
kestra execute flow repo_architect_agent repoarchitectagent \
  --inputs repo_url="https://github.com/owner/repo" \
  --inputs github_token="ghp_xxxxx"
```

### Via REST API

```bash
curl -X POST http://localhost:8080/api/v1/executions \
  -H "Content-Type: application/json" \
  -d '{
    "flowId": "repo_architect_agent",
    "namespace": "repoarchitectagent",
    "inputs": {
      "repo_url": "https://github.com/owner/repo",
      "github_token": "ghp_xxxxx"
    }
  }'
```

## Monitoring Execution

### Via Web UI
- **Execution ID**: Displayed after start
- **Live Logs**: Stream output from each task
- **Task Status**: Visual progress indicator
- **Outputs**: View generated artifacts

### Via CLI
```bash
# List all executions
kestra execution list --namespace repoarchitectagent

# Watch specific execution
kestra execution watch --execution-id <exec-id>

# Get execution details
kestra execution describe --execution-id <exec-id>
```

## Output Artifacts

After successful execution, outputs are available in `runs/{timestamp}/`:

```
runs/20250112-143022/
├── repo_shape.json          # Repository structure analysis
├── diagram.mmd              # Mermaid architecture diagram
├── ci-generated.yml         # GitHub Actions pipeline
├── artifacts.tar.gz         # Archive of all above
└── pr_info.json             # PR creation metadata
```

## Configuration Customization

### Modify Task Docker Images
```yaml
- id: analyze_repo
  type: io.kestra.plugin.scripts.python.Script
  containerImage: python:3.12-slim  # Change Python version
  script: |
    python api/analyze_repo.py ...
```

### Add Task Retries
```yaml
- id: generate_ci
  type: io.kestra.plugin.scripts.node.Script
  retry:
    type: exponential
    interval: 5s
    max_attempts: 3
  script: |
    node api/generate_ci.js ...
```

### Add Task Conditions
```yaml
- id: open_pr
  type: io.kestra.plugin.scripts.node.Script
  conditions:
    - type: allMatch
      expression: "{{ execution.trigger.type == 'webhook' }}"
  script: |
    node api/open_pr.js ...
```

### Add Alerts/Notifications
```yaml
- id: send_notification
  type: io.kestra.plugin.notifications.slack.SlackExecution
  dependsOn:
    - archive_results
  url: "{{ secret('slack_webhook') }}"
```

## Variables & Templating

### Available Variables
```yaml
variables:
  run_dir: "runs/{{ inputs.run_timestamp }}"
  api_dir: "./api"
```

### Kestra Functions
```
{{ now | date('yyyyMMdd-HHmmss') }}    # Current timestamp
{{ inputs.repo_url }}                   # User input
{{ taskrun.outputs.result }}            # Task output
{{ execution.id }}                      # Execution ID
{{ secret('github_token') }}            # From secrets
```

## Secrets Management

### Store GitHub Token Securely
```bash
# Via CLI
kestra secret set github_token ghp_xxxxxxxxxxxxx

# Via REST API
curl -X POST http://localhost:8080/api/v1/secrets \
  -H "Content-Type: application/json" \
  -d '{
    "key": "github_token",
    "value": "ghp_xxxxxxxxxxxxx",
    "namespace": "repoarchitectagent"
  }'
```

### Use in Blueprint
```yaml
beforeCommands:
  - export GITHUB_TOKEN={{ secret('github_token') }}
```

## Scheduling & Triggers

### Daily Execution (via UI)
1. Edit flow
2. Click **"Triggers"** tab
3. Add **Schedule** trigger
4. Set cron: `0 0 * * *` (daily at midnight)

### Webhook Trigger
1. Add to blueprint:
```yaml
triggers:
  - id: webhook
    type: io.kestra.plugin.core.trigger.Webhook
```

2. Call via HTTP:
```bash
curl -X POST http://localhost:8080/api/v1/executions/webhook/repoarchitectagent/repo_architect_agent \
  -H "Content-Type: application/json" \
  -d '{"repo_url": "https://github.com/owner/repo"}'
```

## Troubleshooting

### Task Fails: "Container Image Not Found"
```yaml
# Ensure image is available
containerImage: python:3.11-slim
# Pull before running
beforeCommands:
  - pip install gitpython  # Install required packages
```

### Git Clone Fails: "Permission Denied"
- Ensure SSH keys are configured
- Or use HTTPS with token:
```yaml
url: "https://{{ secret('github_token') }}@github.com/owner/repo.git"
```

### PR Creation Fails: "gh CLI Not Found"
- Kestra containers may not have gh installed
- Run PR step locally instead:
```bash
GITHUB_TOKEN=ghp_xxx node api/open_pr.js https://github.com/owner/repo
```

### Large Repository Analysis Timeout
- Increase task timeout:
```yaml
- id: analyze_repo
  timeout: 15m  # Increase from default
```

## Advanced Usage

### Parallel Execution
```yaml
- id: task1
  type: ...
  
- id: task2
  type: ...
  # Both run in parallel, then:

- id: task3
  type: ...
  dependsOn:
    - task1
    - task2  # Wait for both
```

### Conditional Tasks
```yaml
- id: open_pr
  type: io.kestra.plugin.scripts.node.Script
  conditions:
    - type: allMatch
      expression: "{{ inputs.github_token != null }}"
  script: |
    # Only runs if github_token provided
```

### Error Handling
```yaml
- id: task_with_fallback
  type: io.kestra.plugin.scripts.bash.Script
  allowFailure: true  # Continue even if fails
  script: |
    command_that_might_fail || echo "fallback"
```

## Integration with CI/CD

### GitHub Actions Trigger
```yaml
# In .github/workflows/kestra-trigger.yml
name: Trigger Kestra Pipeline

on:
  workflow_dispatch:
    inputs:
      repo_url:
        description: Repository URL
        required: true

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Kestra
        run: |
          curl -X POST http://kestra-instance:8080/api/v1/executions/webhook/... \
            -H "Authorization: Bearer ${{ secrets.KESTRA_TOKEN }}" \
            -d '{"repo_url": "${{ inputs.repo_url }}"}'
```

## Performance Tips

1. **Use shallow clone**: `depth: 1` for faster cloning
2. **Parallel tasks**: Run diagram & CI generation together
3. **Skip optional tasks**: Set `allowFailure: true` for non-critical tasks
4. **Cache dependencies**: Use Docker images with pre-installed packages
5. **Archive results**: Compress artifacts for storage

## Cost Optimization

When running on cloud platforms:
- Use smaller container images (alpine, slim)
- Set appropriate timeouts
- Archive and clean up old runs
- Use spot instances for long-running tasks

## Resources

- **Documentation**: https://kestra.io/docs
- **GitHub Repository**: https://github.com/kestra-io/kestra
- **Community Forum**: https://discuss.kestra.io
- **Discord Chat**: https://discord.gg/ZkMjuzfJ3m

## See Also

- [README.md](../README.md) - Project overview
- [blueprint_repo_analysis.yml](./blueprint_repo_analysis.yml) - Full blueprint
- [api/](../api/) - Individual scripts
