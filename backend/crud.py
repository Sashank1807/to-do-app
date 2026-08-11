import json
from sqlalchemy.orm import Session
from sqlalchemy import or_
from . import models, schemas


def get_todos(
    db: Session,
    category: str = None,
    search: str = None,
    completed: bool = None,
    priority: str = None,
):
    query = db.query(models.Todo)

    if category and category.lower() != "all":
        query = query.filter(models.Todo.category == category)

    if priority and priority.lower() != "all":
        query = query.filter(models.Todo.priority == priority)

    if completed is not None:
        query = query.filter(models.Todo.completed == completed)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                models.Todo.title.ilike(search_fmt),
                models.Todo.description.ilike(search_fmt),
                models.Todo.category.ilike(search_fmt),
            )
        )

    # Order by pinned first, then uncompleted, then latest created
    return query.order_by(
        models.Todo.pinned.desc(), models.Todo.completed.asc(), models.Todo.id.desc()
    ).all()


def create_todo(db: Session, todo: schemas.TodoCreate):
    """Create a new todo item in SQLite database."""
    subtasks_data = [s.model_dump() for s in todo.subtasks] if todo.subtasks else []
    db_todo = models.Todo(
        title=todo.title,
        description=todo.description or "",
        category=todo.category or "Personal",
        priority=todo.priority or "Medium",
        due_date=todo.due_date or "",
        completed=todo.completed,
        pinned=todo.pinned,
        subtasks_json=json.dumps(subtasks_data),
    )
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo


def get_todo_by_id(db: Session, todo_id: int):
    return db.query(models.Todo).filter(models.Todo.id == todo_id).first()


def update_todo(db: Session, todo_id: int, todo_update: schemas.TodoUpdate):
    db_todo = get_todo_by_id(db, todo_id)
    if not db_todo:
        return None

    update_data = todo_update.model_dump(exclude_unset=True)
    if "subtasks" in update_data and update_data["subtasks"] is not None:
        subtasks_list = [
            s.model_dump() if hasattr(s, "model_dump") else s
            for s in update_data.pop("subtasks")
        ]
        db_todo.subtasks_json = json.dumps(subtasks_list)

    for field, value in update_data.items():
        if hasattr(db_todo, field):
            setattr(db_todo, field, value)

    db.commit()
    db.refresh(db_todo)
    return db_todo


def toggle_todo(db: Session, todo_id: int):
    db_todo = get_todo_by_id(db, todo_id)
    if not db_todo:
        return None

    db_todo.completed = not db_todo.completed
    db.commit()
    db.refresh(db_todo)
    return db_todo


def toggle_pin_todo(db: Session, todo_id: int):
    db_todo = get_todo_by_id(db, todo_id)
    if not db_todo:
        return None

    db_todo.pinned = not db_todo.pinned
    db.commit()
    db.refresh(db_todo)
    return db_todo


def delete_todo(db: Session, todo_id: int):
    db_todo = get_todo_by_id(db, todo_id)
    if not db_todo:
        return False

    db.delete(db_todo)
    db.commit()
    return True


def clear_completed_todos(db: Session):
    count = db.query(models.Todo).filter(models.Todo.completed == True).delete()
    db.commit()
    return count


def get_stats(db: Session):
    todos = db.query(models.Todo).all()
    total = len(todos)
    completed = sum(1 for t in todos if t.completed)
    pending = total - completed
    rate = round((completed / total * 100), 1) if total > 0 else 0.0

    by_category = {}
    by_priority = {"High": 0, "Medium": 0, "Low": 0}

    for t in todos:
        cat = t.category or "Personal"
        by_category[cat] = by_category.get(cat, 0) + 1

        prio = t.priority or "Medium"
        by_priority[prio] = by_priority.get(prio, 0) + 1

    return {
        "total": total,
        "completed": completed,
        "pending": pending,
        "completion_rate": rate,
        "by_category": by_category,
        "by_priority": by_priority,
    }
