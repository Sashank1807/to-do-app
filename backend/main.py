import os
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from . import schemas, crud, models

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Animated Todo Web App API",
    description="Backend API for Todo App",
    version="1.0.0",
)

# Enable CORS for convenience
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/todos", response_model=List[schemas.TodoResponse])
def read_todos(
    category: Optional[str] = None,
    search: Optional[str] = None,
    completed: Optional[bool] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return crud.get_todos(
        db,
        category=category,
        search=search,
        completed=completed,
        priority=priority,
    )


@app.post(
    "/api/todos",
    response_model=schemas.TodoResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_todo(todo: schemas.TodoCreate, db: Session = Depends(get_db)):
    return crud.create_todo(db, todo)


@app.get("/api/todos/{todo_id}", response_model=schemas.TodoResponse)
def read_todo(todo_id: int, db: Session = Depends(get_db)):
    db_todo = crud.get_todo_by_id(db, todo_id)
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return db_todo


@app.put("/api/todos/{todo_id}", response_model=schemas.TodoResponse)
def update_todo(
    todo_id: int, todo_update: schemas.TodoUpdate, db: Session = Depends(get_db)
):
    db_todo = crud.update_todo(db, todo_id, todo_update)
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return db_todo


@app.patch("/api/todos/{todo_id}/toggle", response_model=schemas.TodoResponse)
def toggle_todo(todo_id: int, db: Session = Depends(get_db)):
    db_todo = crud.toggle_todo(db, todo_id)
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return db_todo


@app.delete("/api/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    success = crud.delete_todo(db, todo_id)
    if not success:
        raise HTTPException(status_code=404, detail="Todo not found")
    return None


@app.delete("/api/todos/action/clear-completed")
def clear_completed(db: Session = Depends(get_db)):
    count = crud.clear_completed_todos(db)
    return {"cleared": count}


@app.get("/api/stats", response_model=schemas.StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    return crud.get_stats(db)


# Serve Static Files
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")

if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

    @app.get("/")
    def read_root():
        index_file = os.path.join(static_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "Todo API is running. Frontend static files missing."}
