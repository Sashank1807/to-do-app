from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class SubTaskSchema(BaseModel):
    id: str
    title: str
    completed: bool = False


class TodoBase(BaseModel):
    title: str
    description: Optional[str] = ""
    category: Optional[str] = "Personal"
    priority: Optional[str] = "Medium"  # Low, Medium, High
    due_date: Optional[str] = ""
    completed: bool = False
    pinned: bool = False
    subtasks: List[SubTaskSchema] = []


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    completed: Optional[bool] = None
    pinned: Optional[bool] = None
    subtasks: Optional[List[SubTaskSchema]] = None


class TodoResponse(TodoBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    total: int
    completed: int
    pending: int
    completion_rate: float
    by_category: dict
    by_priority: dict
