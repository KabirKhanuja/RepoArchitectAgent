# RepoArchitectAgent

> Analyze a code repository, generate Mermaid architecture diagrams, and propose CI configs + PRs.

## Structure

```
repoarchitectagent/
├─ .github/
│  └─ workflows/
│     └─ deploy.yml
├─ kestra/
│  └─ blueprint_repo_analysis.yml
├─ api/
│  ├─ analyze_repo.py
│  ├─ generate_mermaid.js
│  ├─ generate_ci.js
│  ├─ open_pr.js
│  └─ helpers/
│     └─ repo_parsers.py
├─ web/
│  ├─ package.json
│  ├─ next.config.js
│  ├─ pages/
│  │  ├─ index.js
│  │  └─ api/
│  │     └─ analyze.js
│  ├─ components/
│  │  └─ MermaidViewer.jsx
│  └─ public/
├─ docs/
│  ├─ PRD.md
│  ├─ DEMO.md
│  └─ OUMI_PROMPTS.md
├─ runs/
├─ .coderabbit.yml
├─ README.md
```

## Quickstart

Install web dependencies and start the Next.js dev server:

```bash
cd web
npm install
npm run dev
```

Run a local repo analysis and generate artifacts:

```bash
cd ..
python api/analyze_repo.py --repo . --out runs/$(date +%Y%m%d%H%M%S)/repo_shape.json
node api/generate_mermaid.js runs/$(date +%Y%m%d%H%M%S)/repo_shape.json runs/$(date +%Y%m%d%H%M%S)/diagram.mmd
node api/generate_ci.js runs/$(date +%Y%m%d%H%M%S)/repo_shape.json runs/$(date +%Y%m%d%H%M%S)/generated-ci.yml
```

See `docs/DEMO.md` for a more narrative demo flow.
