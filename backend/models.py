import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from .database import Base


class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True, default="")
    category = Column(String, default="Personal", index=True)
    priority = Column(String, default="Medium", index=True)  # Low, Medium, High
    due_date = Column(String, nullable=True, default="")
    completed = Column(Boolean, default=False, index=True)
    subtasks_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def subtasks(self):
        try:
            return json.loads(self.subtasks_json) if self.subtasks_json else []
        except Exception:
            return []

    @subtasks.setter
    def subtasks(self, value):
        self.subtasks_json = json.dumps(value if isinstance(value, list) else [])
