# Venture Intelligence (Demo Version)

Welcome to Venture Intelligence, an automated pipeline that leverages an AI Agent to autonomously research "Hurdles" and strategic "Visions."

> **Note:** This is currently a **Demo Version**. The project is actively being developed further to include **Direct Reddit API and GitHub native integration**, deeper agent flows, and multi-agent coordination.

---

## 🧭 Core Concepts

- **Hurdles:** Any problem that is making company day to day operations less effective, taking time, slowing down progress, or using resources heavy. We find solutions to overcome it, making the process go smoother and more efficient by listing down the most practical solutions and providing direct leads to contact.

- **Visions:** A product/service to build outside the company. We prioritize something special than other competitors in the same space with absolute practically possible scores and evaluation, listing out potentially possible points to start and the exact persons to contact.

---

## 🎯 Our Philosophy: Reality Over Theory

Venture Intelligence is built on a core philosophy: **We value practical solutions over abstract theories.** Every step of the research loop is driven by **real data and real experiences**. Rather than generating hypothetical ideas, the agent is strictly instructed to scour the web for tangible evidence:

- **Reddit (via Web Search):** To find raw, unfiltered customer complaints, founder experiences, and actual market gaps.
- **GitHub:** To find open-source proof, technical implementations, and real individual developers who have already solved the problem.
- **Real Business Valuations:** We anchor our vision strategies in existing products that have proven market value.

By prioritizing practical, implemented solutions, Venture Intelligence provides the exact blueprints needed to overcome a hurdle or develop a useful product.

---

## 🎯 How It Works

The platform acts as an automated researcher assigned to solve complex problems (Hurdles) or invent new product strategies (Visions). It features two distinct research loops:

### 1. The Hurdle Loop

Designed to help overcome technical or business roadblocks by finding and analyzing how others have practically solved them.

**Flow:**

1. **Search web, GitHub, and Reddit**: The agent formulates targeted queries based on the hurdle, pulling real experiences and code repositories.
2. **Discover solutions & implementations**: It finds how others actually overcame the exact problem in the real world.
3. **Extract developers & portfolios**: It zeroes in on who implemented it. _(Rule: 60% preference for Individual Developers, with the remaining 40% completely unreserved)._
4. **Score success, budget, & similarity**: Every solution is ranked by its success probability, practicality, and budget fit based on real-world evidence.
5. **Generate actionable steps**: The AI stores the data, allowing the user to view detailed contact info (GitHub, Portfolios, Demo links) to reach out or replicate their practical success.

### 2. The Vision Loop

Designed to brainstorm and formulate robust business ideas and strategies by analyzing real market gaps and finding developers who can build the solutions.

**Flow:**

1. **Search for related real products**: Finds existing products with real business value.
2. **Analyze market value vs models**: Extracts the different business models used by those products.
3. **Find customer market gaps**: Analyzes actual customer dissatisfaction and complaints (primarily on Reddit) to identify true market gaps.
4. **Generate solutions to overcome gaps**: Treats the market gap as a hurdle and finds practical solutions for it.
5. **Extract developer implementations**: Identifies real people who have built these solutions. _(Rule: 100% strictly individual developers, to allow building/inventing the solution internally without relying on established competitors)._

When viewing a Vision, the UI provides a deep dive: `Vision -> Business Model (Highest Market Gap & Success Rate) -> Solutions -> Specific Developer Implementations`.

---

## 📊 Structured Scoring System

We do not rely on AI guesswork. Every solution and implementation is rigorously evaluated through a highly structured scoring matrix enforced by rigid data schemas (Pydantic).

### 1. Solution Scoring

Every proposed solution is graded across five distinct metrics (0-100) before being presented:

- **Success Evidence:** Based on the observed, real-world success rate of the solution.
- **Practicality:** How feasible and realistic it is to actually build or implement.
- **Budget Fit:** How well the solution aligns with realistic budget constraints.
- **Similarity:** How directly this solution maps to the core hurdle or market gap you are trying to solve.
- **Evidence Quality:** The reliability of the sources (e.g., a highly upvoted GitHub repo vs. a random blog post).

These metrics are mathematically combined into an **Overall Score** to rank the best paths forward.

### 2. Candidate (Implementation) Scoring

When real people are found who built the solution, they are scored individually using a **Similarity Metric** (rendered as a percentage). This tells you instantly whether a developer's specific GitHub repository or live demo is a near-exact match to the architecture you need to build, or just tangentially related.

---

## 🚀 Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) (for the frontend)
- [Python 3.10+](https://www.python.org/) (for the backend)
- [uv](https://github.com/astral-sh/uv) (for ultra-fast Python package management)

### 1. Backend Setup

Navigate to the `backend` directory:

```bash
cd backend
```

Install the dependencies using `uv` (or standard `pip`):

```bash
uv pip install -r requirements.txt
# OR
pip install -r requirements.txt
```

Set up the environment variables. Copy `.env.example` to `.env` (or create a `.env` file):

```bash
cp .env.example .env
```

**Required API Keys in `.env`:**

- `EXA_API_KEY`: Required for the AI to perform deep web searches.
- `LLM_API_KEY`: The API key for the LLM being used (e.g., OpenAI).
- `LLM_BASE_URL`: The base URL for the LLM (if using a local/custom OpenAI-compatible endpoint).
- `LLM_MODEL`: The model string (e.g., `gpt-4o-mini`, `gemma4:e4b`).

Run the backend server (FastAPI):

```bash
uv run uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

Navigate to the `frontend` directory:

```bash
cd frontend
```

Install Node dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The app should now be running at `http://localhost:5173`.

---

## 🔮 Planned Additions

- **Native Integrations:** Dedicated API pipelines for GitHub, Reddit, and Discord data rather than relying solely on web search.
- **Deeper Multi-Agent Workflows:** Creating specialized sub-agents (e.g., a dedicated "Scoring Agent", a dedicated "Contact Finder Agent") to increase data accuracy.
- **Direct Outreach:** Automating the drafting of outreach emails to the found developers directly from the dashboard.
- **Exporting Data:** Exporting all found implementations and solutions to CSV or Notion.
