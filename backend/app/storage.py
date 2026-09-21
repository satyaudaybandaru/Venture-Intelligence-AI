import json
from pathlib import Path
from uuid import uuid4
from .models import ItemCreate

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
RESEARCH = DATA / "research"
DATA.mkdir(exist_ok=True)
RESEARCH.mkdir(exist_ok=True)


def path(kind: str) -> Path:
    return DATA / f"{kind}.json"


def load(kind: str) -> list[dict]:
    p = path(kind)
    if not p.exists():
        p.write_text("[]", encoding="utf-8")
    return json.loads(p.read_text(encoding="utf-8"))


def save(kind: str, rows: list[dict]):
    path(kind).write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")


def add(kind: str, data: ItemCreate):
    rows = load(kind)
    priority = min(max(1, data.priority), len(rows) + 1)
    for r in rows:
        if r["priority"] >= priority:
            r["priority"] += 1
    prefix = "hurdle" if kind == "hurdles" else "vision"
    row = {"id": f"{prefix}_{uuid4().hex[:8]}", **data.model_dump(), "priority": priority, "status": "not_started", "executions": []}
    rows.append(row)
    rows.sort(key=lambda x: x["priority"])
    save(kind, rows)
    return row

def update_status(kind: str, item_id: str, status: str, run_id: str = None):
    rows = load(kind)
    for r in rows:
        if r["id"] == item_id:
            r["status"] = status
            if run_id:
                r["run_id"] = run_id
                if "executions" not in r: r["executions"] = []
                if run_id not in r["executions"]:
                    r["executions"].append(run_id)
            save(kind, rows)
            return r
    return None
