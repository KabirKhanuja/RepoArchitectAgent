
## File Structure 

```
RepoArchitectAgent/
│
├── web/                         # Frontend 
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── public/
│   ├── package.json
│   └── next.config.js
│
├── api/                         # Backend orchestration + analysis
│   ├── index.py                 # Single API entry (FastAPI / Flask)
│   │
│   ├── orchestration/           # Pipeline controller (NO logic)
│   │   ├── analyze_repo.py      # end-to-end flow
│   │   └── actions.py           # PR + CI triggering
│   │
│   ├── ingestion/               # Repo fetching
│   │   ├── clone_repo.py        # git clone --depth=1
│   │   └── github_meta.py       # GitHub REST (repo info, PRs)
│   │
│   ├── analysis/                # Deterministic parsing (NO LLM)
│   │   ├── detect_stack.py      # Next.js, Flask, FastAPI, etc.
│   │   ├── parse_structure.py   # folders, entry points
│   │   ├── dependencies.py      # package.json, requirements.txt
│   │   └── risks.py             # missing CI, tests, envs
│   │
│   ├── ir/                      # Intermediate Representation (KEY)
│   │   ├── schema.py            # IR shape definition
│   │   └── builder.py           # converts analysis → IR JSON
│   │
│   ├── llm/                     # Reasoning layer
│   │   ├── summarize.py         # onboarding + explanation
│   │   ├── generate_mermaid.py  # architecture diagram
│   │   └── generate_ci.py       # CI YAML suggestion
│   │
│   ├── utils/
│   │   ├── fs.py                # file helpers
│   │   ├── git.py               # clone helpers
│   │   └── cleanup.py           # temp dir cleanup
│   │
│   └── config.py                # API keys, limits, settings
│
├── docs/                        # (optional) future
│
├── .github/
│   └── workflows/
│       └── deploy.yml           # optional backend deploy
│
├── requirements.txt             # backend deps
├── vercel.json                  # API routing → /api/*
├── README.md
└── .env.example

```