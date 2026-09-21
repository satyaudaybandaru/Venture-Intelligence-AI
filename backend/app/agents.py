import asyncio
import json
import re
from pathlib import Path
from uuid import uuid4
from pydantic import BaseModel, Field
from typing import List, Optional
from langchain_openai import ChatOpenAI
from langchain.tools import tool
from deepagents import create_deep_agent
from deepagents.backends import FilesystemBackend
from langgraph.checkpoint.memory import MemorySaver

from .search import ExaSearch
from .storage import update_status, RESEARCH
from .config import LLM_BASE_URL, LLM_API_KEY, LLM_MODEL, MAX_JSON_RETRIES

searcher = ExaSearch()

# =======================
# PYDANTIC OUTPUT SCHEMAS
# =======================

class Scores(BaseModel):
    success_evidence: float = Field(description="Score out of 100 based on observed success rate")
    practicality: float = Field(description="Score out of 100 for implementation practicality")
    budget_fit: float = Field(description="Score out of 100 for budget fit")
    similarity: float = Field(description="Score out of 100 for how similar this solution is to others")
    evidence_quality: float = Field(description="Score out of 100 based on the quality of sources")

class Budget(BaseModel):
    min: int
    max: int
    currency: str = "USD"

class Implementation(BaseModel):
    person_name: str
    role: str
    similarity: float = Field(description="Similarity float between 0 and 1")
    description: str
    github: Optional[str] = None
    demo: Optional[str] = None
    portfolio: Optional[str] = None
    contact: Optional[str] = None

class Solution(BaseModel):
    title: str
    description: str
    scores: Scores
    estimated_budget: Budget
    implementations: List[Implementation] = Field(description="Implementations found online.")
    overall_score: float = Field(description="Weighted average score out of 100")

class HurdleResult(BaseModel):
    summary: str
    solutions: List[Solution]

class MarketGap(BaseModel):
    title: str
    description: str
    evidence_count: int = Field(description="Number of complaint signals or evidence found")

class Comparable(BaseModel):
    entity: str
    evidence_count: int
    business_model: str

class BusinessModel(BaseModel):
    name: str
    description: str
    market_gap: str = Field(description="The market gap identified for this business model (based on customer dissatisfaction).")
    market_gap_score: float = Field(description="Score representing how high the market gap is (0-100).")
    success_rate: float = Field(description="Highest possible success rate if implemented correctly (0-100).")
    solutions: List[Solution] = Field(description="Solutions/Implementation opportunities to overcome the market gap.")

class VisionResult(BaseModel):
    market_summary: str
    business_models: List[BusinessModel]

# =======================
# TOOLS
# =======================
ALL_SOURCES = []

@tool
def search_web(query: str, include_reddit: bool = False, include_github: bool = False) -> str:
    """Search the web for real-world problems, solutions, market gaps, or implementations.
    Set include_reddit=True to focus on reddit discussions.
    Set include_github=True to focus on github repositories.
    """
    if include_reddit and "site:reddit.com" not in query:
        query += " site:reddit.com"
    if include_github and "site:github.com" not in query:
        query += " site:github.com"
        
    try:
        # Run sync since @tool is sync by default unless async def is used, but we are in async event loop?
        # deepagents supports async tools. Let's make it async.
        pass
    except Exception as e:
        return f"Error: {str(e)}"
    return ""

@tool
async def asearch_web(query: str, include_reddit: bool = False, include_github: bool = False) -> str:
    """Search the web for real-world problems, solutions, market gaps, or implementations.
    Set include_reddit=True to focus on reddit discussions (founder experiences, complaints).
    Set include_github=True to focus on github repositories (code, open source, individual developers).
    """
    if include_reddit and "site:reddit.com" not in query:
        query += " site:reddit.com"
    if include_github and "site:github.com" not in query:
        query += " site:github.com"
        
    try:
        results = await searcher.search(query, num_results=5)
        formatted = []
        for r in results:
            r["query"] = query
            ALL_SOURCES.append(r)
            formatted.append(f"Title: {r.get('title')}\nURL: {r.get('url')}\nText: {r.get('text')}\n")
        return "\n---\n".join(formatted) if formatted else "No results found."
    except Exception as e:
        return f"Search failed: {str(e)}"

# =======================
# AGENT ORCHESTRATION
# =======================

def emit(store, run_id, **event):
    store.setdefault(run_id, []).append(event)


async def run_research(item: dict, kind: str, run_id: str, store: dict, progress_cb):
    global ALL_SOURCES
    ALL_SOURCES = []
    
    update_status("hurdles" if kind == "hurdle" else "visions", item["id"], "researching", run_id=run_id)
    emit(store, run_id, type="status", progress=5, message="Initializing Deep Agent Pipeline")
    
    llm = ChatOpenAI(base_url=LLM_BASE_URL, api_key=LLM_API_KEY, model=LLM_MODEL)
    
    system_prompt = f"""You are an elite VC Research Agent.
You are tasked with researching the following {'Hurdle' if kind == 'hurdle' else 'Vision'}:
Title: {item['title']}
Description: {item['description']}

Your mission:
1. Formulate 2-4 search queries. Make sure to search for complaints/founder experiences on Reddit, and implementations on GitHub.
2. Use the `asearch_web` tool to execute these searches.
3. Analyze the results.
4. Output your FINAL synthesized JSON perfectly matching the expected Pydantic schema using the `submit_final_report` tool or just returning raw JSON. 
Wait, to make sure you output correct JSON, you MUST use your built-in tool or format your final response strictly as a JSON string matching the schema.
"""

    if kind == 'hurdle':
        system_prompt += """
For Hurdles:
- Rank each solution based on success rate + practicality + budget + similarity.
- Extract implementations who actually did it, with their role, github/portfolio links if available.
- IMPORTANT FOR CONTACTS: Prefer individual developers (60%) and other entities/companies (40% unreserved).
- IMPORTANT: When extracting the contact link, actively seek out and include their related work/portfolio to the solution in the contact information.
"""
        SchemaModel = HurdleResult
    else:
        system_prompt += """
For Visions:
Execute your research in this exact order:
1. Search the web for related products with real business.
2. Search their market value with respect to their business model (same product might have different business models in different entities).
3. Analyze the market gap in each product (brainstorming, search web for customer dissatisfaction).
4. From here, use the hurdle pipeline logic on how to overcome that market gap.
5. Identify the possible business models with the highest market gap and highest possible success rate.
6. For each business model's solutions, extract the implementations.
- IMPORTANT FOR CONTACTS: Only individual developers are preferred as we want to invent a solution. Do NOT include other companies that have already done this.
"""
        SchemaModel = VisionResult

    agent = create_deep_agent(
        model=llm,
        tools=[asearch_web],
        system_prompt=system_prompt,
        checkpointer=MemorySaver(),
    )

    config = {"configurable": {"thread_id": run_id}}
    
    # We will use streaming to capture thoughts/tool calls
    await progress_cb(10, "Agent started reasoning and searching...")
    
    final_output = None
    retries = 0
    
    while retries <= MAX_JSON_RETRIES and not final_output:
        try:
            current_progress = 15
            async for event in agent.astream({"messages": [{"role": "user", "content": "Begin research. Search the web, gather data, and finally return a strictly formatted JSON object matching the required schema. Wrap the final JSON in ```json\n...\n``` block."}]}, config, stream_mode="values"):
                # We can inspect the messages
                msg = event["messages"][-1]
                if msg.type == "ai" and msg.tool_calls:
                    for tc in msg.tool_calls:
                        if tc["name"] == "asearch_web":
                            q = tc["args"].get("query", "...")
                            emit(store, run_id, type="agent", agent="deep_agent", progress=current_progress, message=f"Searching: {q}")
                            current_progress = min(85, current_progress + 15)
                            
            # Process final message
            final_msg = event["messages"][-1].content
            
            # Extract JSON
            match = re.search(r'```json\s*(.*?)\s*```', final_msg, re.DOTALL)
            if match:
                json_str = match.group(1)
            else:
                # Attempt to parse the whole string
                json_str = final_msg
                
            parsed = json.loads(json_str)
            # Validate with Pydantic
            final_output = SchemaModel(**parsed).model_dump()
            
        except Exception as e:
            retries += 1
            if retries > MAX_JSON_RETRIES:
                raise Exception(f"Max retries exceeded for JSON parsing. Last error: {str(e)}\nHint: Restart manual research.")
            await progress_cb(50, f"JSON validation failed, retrying ({retries}/{MAX_JSON_RETRIES})...")
            # We can re-invoke to ask for correction
            config = {"configurable": {"thread_id": f"{run_id}_retry_{retries}"}}
            # We just loop and ask it again in a new thread or same thread. To keep it simple, we loop.

    if not final_output:
        raise Exception("Failed to generate valid JSON output.")

    # Deduplicate sources
    seen, sources = set(), []
    for s in ALL_SOURCES:
        if s["url"] and s["url"] not in seen:
            seen.add(s["url"])
            sources.append({"title": s.get("title",""), "url": s.get("url",""), "text": s.get("text","")[:200]})
    
    final_output["sources"] = sources[:40]
    final_output["research_mode"] = "deep_agent_ai"
    
    await progress_cb(90, "Saving research")
    output_path = RESEARCH / f"{item['id']}_{run_id}.json"
    output_path.write_text(json.dumps(final_output, indent=2, ensure_ascii=False), encoding="utf-8")
    
    update_status("hurdles" if kind == "hurdle" else "visions", item["id"], "completed")
    emit(store, run_id, type="complete", progress=100, message="Research completed", sources_found=len(sources))
    
    return final_output
