# RepoArchitectAgent

> Analyze a code repository, generate Mermaid architecture diagrams, and propose CI configs + PRs.

## to run

from root : 

for api : 
``` uvicorn api.index:app --reload ```

for web : 
``` cd web
npm run dev ```


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

# RepoArchitectAgent

> **AI-powered repository analysis tool** that generates comprehensive architecture insights, interactive Mermaid diagrams, and actionable recommendations for any GitHub repository.

## 🚀 What It Does

RepoArchitectAgent is an intelligent code analysis platform that helps teams understand repository structure instantly. It combines static analysis, AI-powered insights (via Groq LLaMA 3.3 70B and Claude Sonnet 4), and GitHub API integration to provide:

- **📊 Architectural Visualization** - Auto-generated Mermaid diagrams showing your codebase structure
- **🔍 Smart Analysis** - AI-powered repository descriptions and key feature detection
- **✅ CodeRabbit-Style Recommendations** - GitHub API-based analysis providing actionable improvements across security, performance, architecture, best practices, and documentation
- **📦 Dependency Mapping** - Complete external and internal dependency tracking
- **🏗️ Module Breakdown** - Detailed analysis of code organization and responsibilities

## 🎯 How It Helps

### For New Contributors
- Understand project structure in minutes, not hours
- Get instant context on what each directory and module does
- See the "big picture" before diving into code

### For First-Time Readers
- Interactive architecture diagrams reveal code organization patterns
- AI-generated descriptions explain the repository's purpose and tech stack
- Clear visualization of how components connect and interact

### For Technical Onboarding
- Reduce onboarding time from days to hours
- Identify missing documentation and testing gaps
- Get security and best practice recommendations upfront
- Understand the full technology stack at a glance

## 🛠️ Technology Stack

### Backend (API)
- **FastAPI** - High-performance Python web framework
- **Groq API** (LLaMA 3.3 70B Versatile) - AI-powered analysis and diagram generation
- **Anthropic Claude Sonnet 4** - Advanced recommendation engine
- **GitHub API** - Repository metadata and CodeRabbit-style analysis
- **Python 3.9+** - Core language with modern async support

### Frontend (Web)
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality React components
- **Mermaid.js** - Interactive diagram rendering
- **Lucide Icons** - Beautiful icon system

### Analysis Features
- **CodeRabbit-Style Recommendations** - Mimics professional code review tools by analyzing:
  - Missing critical files (tests, CI/CD, documentation)
  - Security concerns (secrets management, dependency vulnerabilities)
  - Architecture improvements (modularity, separation of concerns)
  - Performance optimizations (caching, bundle size)
  - Documentation gaps (README quality, setup guides)

## 📁 Project Structure

```
repoarchitectagent/
├── api/                          # FastAPI backend
│   ├── index.py                  # Main API server with all endpoints
│   └── orchestration/
│       └── analyze_repo.py       # Core repository analysis logic
├── web/                          # Next.js frontend
│   ├── app/                      # App Router pages
│   ├── components/               # React components
│   │   ├── analysis-results.tsx  # Main results display
│   │   └── MermaidViewer.tsx     # Interactive diagram viewer
│   ├── lib/                      # Utilities and types
│   └── public/                   # Static assets
├── docs/                         # Documentation
│   ├── PRD.md                    # Product Requirements
│   ├── DEMO.md                   # Demo walkthrough
│   └── OUMI_PROMPTS.md          # AI prompt engineering
├── kestra/                       # Workflow automation
│   └── blueprint_repo_analysis.yml
└── runs/                         # Analysis output directory
```

## 🚀 Quickstart

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn
- API Keys:
  - `GROQ_API_KEY` (required)
  - `ANTHROPIC_API_KEY` (optional, for enhanced recommendations)

### 1. Clone the Repository

```bash
git clone https://github.com/KabirKhanuja/RepoArchitectAgent.git
cd RepoArchitectAgent
```

### 2. Set Up Backend

```bash
# Install Python dependencies
pip install -r requirements.txt

# Create .env file (or use web/.env.local)
echo "GROQ_API_KEY=your_groq_key_here" >> web/.env.local
echo "ANTHROPIC_API_KEY=your_anthropic_key_here" >> web/.env.local  # Optional

# Start FastAPI server from root directory
uvicorn api.index:app --reload
```

The API will be available at `http://localhost:8000`

### 3. Set Up Frontend

```bash
cd web

# Install dependencies
npm install

# The .env.local file should already have API keys from step 2
# Add the API URL if not present
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" >> .env.local

# Start Next.js development server
npm run dev
```

The web interface will be available at `http://localhost:3000`

### 4. Analyze a Repository

Open your browser to `http://localhost:3000` and paste any public GitHub repository URL:

```
https://github.com/username/repository
```

Click **Analyze Repository** and watch the magic happen! ✨

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/analyze` | POST | Main analysis endpoint - accepts GitHub URL |
| `/api/generate-description` | POST | Generate AI-powered repository description |
| `/api/generate-mermaid` | POST | Create comprehensive Mermaid architecture diagram |
| `/api/generate-directory-descriptions` | POST | Generate descriptions for specific directories |
| `/api/generate-recommendations` | POST | CodeRabbit-style analysis with actionable recommendations |

## 🔧 Configuration

### Environment Variables

**Backend & Frontend (`web/.env.local`):**
```bash
GROQ_API_KEY=gsk_...                    # Required: Groq API key
ANTHROPIC_API_KEY=sk-ant-...            # Optional: Claude API key
NEXT_PUBLIC_API_URL=http://localhost:8000  # Backend API URL
```

## 📖 Usage Examples

### Analyze Local Repository (CLI)

```bash
# Generate repository analysis JSON
python api/orchestration/analyze_repo.py \
  --repo . \
  --out runs/$(date +%Y%m%d%H%M%S)/repo_shape.json
```

### Analyze via Web Interface

1. Navigate to `http://localhost:3000`
2. Paste GitHub repository URL
3. Click "Analyze Repository"
4. Explore tabs:
   - **Overview** - AI description and key features
   - **Visualization** - Interactive Mermaid diagram
   - **Architecture** - Folder structure and patterns
   - **Modules** - Component breakdown
   - **Dependencies** - External and internal deps
   - **Recommendations** - CodeRabbit-style insights

## 🎨 Features

### AI-Powered Analysis
- **Intelligent Repository Descriptions** - Context-aware summaries generated by LLaMA 3.3 70B
- **Key Feature Detection** - Automatically identifies architectural patterns and design choices
- **Smart Directory Descriptions** - Explains the purpose of each folder based on content analysis

### Interactive Visualizations
- **Dynamic Mermaid Diagrams** - Click-to-explore architecture visualizations
- **Real-time Regeneration** - Update diagrams with a single click
- **Responsive Design** - Works seamlessly on desktop and mobile

### CodeRabbit-Style Recommendations
Our recommendation system follows the CodeRabbit approach by:
- Analyzing repository structure via GitHub API
- Identifying missing critical files (tests, CI/CD, security policies)
- Detecting security vulnerabilities and best practice violations
- Providing prioritized, actionable improvement suggestions
- Explaining the impact and benefit of each recommendation

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq** for blazing-fast LLaMA inference
- **Anthropic** for Claude's advanced reasoning capabilities
- **GitHub** for comprehensive API access
- **CodeRabbit** for inspiration on automated code review
- **Mermaid.js** for beautiful diagram rendering
- **Vercel** for Next.js and excellent developer experience

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/KabirKhanuja/RepoArchitectAgent/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/KabirKhanuja/RepoArchitectAgent/discussions)
- 📧 **Email**: Open an issue for support requests

## 🗺️ Roadmap

- [ ] Support for private repositories with authentication
- [ ] Code quality metrics and complexity analysis
- [ ] Integration with popular project management tools
- [ ] Automated PR generation for recommended improvements
- [ ] Support for monorepos and multi-language projects
- [ ] Export analysis reports in PDF/Markdown formats
- [ ] Real-time collaboration features
- [ ] Custom analysis templates and rules

---

**Built with ❤️ for developers who love understanding code architecture**

*Star ⭐ this repo if you find it helpful!*