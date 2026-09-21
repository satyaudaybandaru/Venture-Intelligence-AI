import asyncio
from uuid import uuid4
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .config import CORS_ORIGINS, REDDIT_ENABLED, GITHUB_ENABLED
from .models import ItemCreate
from .storage import load, add, update_status
from .agents import run_research

app = FastAPI(title="Venture Intelligence Demo", version="0.2.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])
RUNS = {}
TASKS = {}

DAEMON_ACTIVE = False
_LAST_DAEMON_KIND = "vision"

class DaemonStatus(BaseModel):
    active: bool

@app.get("/api/daemon")
def get_daemon():
    return {"active": DAEMON_ACTIVE}

@app.post("/api/daemon")
def set_daemon(status: DaemonStatus):
    global DAEMON_ACTIVE
    DAEMON_ACTIVE = status.active
    return {"active": DAEMON_ACTIVE}

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(daemon_loop())

async def daemon_loop():
    global _LAST_DAEMON_KIND
    while True:
        await asyncio.sleep(5)
        if not DAEMON_ACTIVE:
            continue
        
        # Check if any task is currently running
        if any(t.get("status") == "running" for t in TASKS.values()):
            continue
            
        hurdles = [h for h in load("hurdles") if h.get("status") == "not_started"]
        visions = [v for v in load("visions") if v.get("status") == "not_started"]
        
        target_kind = None
        target_item = None
        
        if _LAST_DAEMON_KIND == "vision" and hurdles:
            target_kind = "hurdle"
            target_item = hurdles[0]
        elif _LAST_DAEMON_KIND == "hurdle" and visions:
            target_kind = "vision"
            target_item = visions[0]
        elif hurdles:
            target_kind = "hurdle"
            target_item = hurdles[0]
        elif visions:
            target_kind = "vision"
            target_item = visions[0]
            
        if target_item:
            _LAST_DAEMON_KIND = target_kind
            _start_research(target_kind, target_item["id"])


def _start_research(kind: str, item_id: str):
    rows = load("hurdles" if kind == "hurdle" else "visions")
    item = next((x for x in rows if x["id"] == item_id), None)
    if not item: return None
    run_id = f"run_{uuid4().hex[:10]}"
    RUNS[run_id] = []
    async def progress(p, msg):
        RUNS[run_id].append({"type":"progress", "progress":p, "message":msg})
    async def task():
        try:
            result = await run_research(item, kind, run_id, RUNS, progress)
            TASKS[run_id] = {"status":"completed", "result":result}
        except Exception as exc:
            TASKS[run_id] = {"status":"failed", "error":str(exc)}
            RUNS[run_id].append({"type":"error", "progress":100, "message":str(exc)})
            update_status("hurdles" if kind == "hurdle" else "visions", item["id"], "failed")
    asyncio.create_task(task())
    TASKS[run_id] = {"status":"running"}
    return run_id

@app.get("/api/health")
def health():
    return {"status":"ok", "search_provider":"exa", "reddit_enabled": REDDIT_ENABLED, "github_enabled": GITHUB_ENABLED}

@app.get("/api/hurdles")
def get_hurdles(): return load("hurdles")
@app.get("/api/visions")
def get_visions(): return load("visions")

@app.post("/api/hurdles")
def create_hurdle(data: ItemCreate): return add("hurdles", data)
@app.post("/api/visions")
def create_vision(data: ItemCreate): return add("visions", data)

@app.delete("/api/{kind}/{item_id}")
def delete_item(kind: str, item_id: str):
    from .storage import save
    rows = load(kind)
    rows = [r for r in rows if r["id"] != item_id]
    save(kind, rows)
    return {"status": "ok"}

@app.get("/api/research/{kind}/{item_id}")
def get_item_research(kind: str, item_id: str, run_id: str = None):
    import json
    from .storage import RESEARCH, load
    
    k = "hurdles" if kind == "hurdle" else "visions"
    rows = load(k)
    item = next((r for r in rows if r["id"] == item_id), None)
    if not item: raise HTTPException(404, "Item not found")
    
    executions = item.get("executions", [])
    
    if run_id:
        p = RESEARCH / f"{item_id}_{run_id}.json"
    elif executions:
        p = RESEARCH / f"{item_id}_{executions[-1]}.json"
    else:
        p = RESEARCH / f"{item_id}.json"
        
    if not p.exists():
        return {"status": "error", "executions": executions, "message": "Research execution file not found"}
        
    return {"status": "completed", "executions": executions, **json.loads(p.read_text(encoding="utf-8"))}

@app.post("/api/research/{kind}/{item_id}")
async def research(kind: str, item_id: str):
    if kind not in ("hurdle", "vision"): raise HTTPException(400, "kind must be hurdle or vision")
    run_id = _start_research(kind, item_id)
    if not run_id: raise HTTPException(404, "Item not found")
    return {"run_id": run_id}

@app.get("/api/research/{run_id}")
def get_run(run_id: str):
    if run_id not in RUNS: raise HTTPException(404, "Run not found")
    return {"events": RUNS[run_id], "meta": TASKS.get(run_id, {"status":"running"})}

@app.websocket("/ws/research/{run_id}")
async def ws_research(websocket: WebSocket, run_id: str):
    await websocket.accept()
    index = 0
    try:
        while True:
            events = RUNS.get(run_id)
            if events is None:
                await websocket.send_json({"type":"error", "message":"Run not found"}); return
            while index < len(events):
                await websocket.send_json(events[index]); index += 1
            meta = TASKS.get(run_id, {})
            if meta.get("status") in ("completed", "failed"):
                await websocket.send_json({"type":"terminal", **meta})
                return
            await asyncio.sleep(.25)
    except WebSocketDisconnect:
        return
