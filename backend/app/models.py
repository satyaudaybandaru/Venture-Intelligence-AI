from typing import Literal, Any
from pydantic import BaseModel, Field

Status = Literal["not_started", "queued", "researching", "completed", "failed"]

class ItemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=5000)
    priority: int = Field(ge=1)

class Item(ItemCreate):
    id: str
    status: Status = "not_started"

class ResearchRun(BaseModel):
    id: str
    item_id: str
    item_type: Literal["hurdle", "vision"]
    status: Status
    progress: int = 0
    message: str = ""
    sources_found: int = 0
    result: dict[str, Any] | None = None
