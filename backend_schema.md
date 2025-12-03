# Backend Specification

This document outlines the architecture for the Python FastAPI backend required to support the React Frontend.

## Technology Stack
- **Framework:** FastAPI (Python 3.10+)
- **Database:** PostgreSQL 15+
- **ORM:** SQLAlchemy (Async) + Pydantic
- **Auth:** OAuth2 with Password Flow (JWT)
- **Task Queue:** Celery + Redis (for Email & Semaphore Polling)

## Database Schema (SQLAlchemy Models)

```python
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum("ADMIN", "TESTER", "VIEWER"))
    is_active = Column(Boolean, default=True)

class Board(Base):
    __tablename__ = "boards"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    ip_address = Column(String)
    status = Column(Enum("ONLINE", "OFFLINE", "BUSY"))
    reserved_by = Column(Integer, ForeignKey("users.id"), nullable=True)

class TestJob(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True)
    semaphore_id = Column(String, nullable=True)
    status = Column(Enum("PENDING", "RUNNING", "PASSED", "FAILED"))
    started_at = Column(DateTime)
    finished_at = Column(DateTime)
    logs_path = Column(String) # Path to local storage or S3
    
class AIInsight(Base):
    __tablename__ = "ai_insights"
    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    summary = Column(Text)
    prediction = Column(Text)
```

## API Endpoints

### Auth
- `POST /token`: Login
- `POST /users`: Signup (sends email to admin)

### Boards
- `GET /boards`: List all boards
- `POST /boards/{id}/reserve`: Reserve a board

### Automation (Semaphore)
- `POST /jobs`: Trigger new test
    - Payload: `{ boards: [], test_id: string, vars: {} }`
    - Logic: Calls Semaphore API webhook, creates DB entry.
- `GET /jobs/{id}`: Get status
- `GET /jobs/{id}/logs`: Stream logs (WebSocket supported)

### AI
- `POST /jobs/{id}/analyze`: Trigger Gemini API analysis on stored logs.

## Deployment (Docker Compose)

```yaml
version: '3.8'
services:
  web:
    build: .
    command: uvicorn main:app --host 0.0.0.0 --port 8000
    env_file: .env
    depends_on:
      - db
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: intel_user
      POSTGRES_DB: lab_manager
  redis:
    image: redis:alpine
  worker:
    build: .
    command: celery -A worker.app worker --loglevel=info
```
