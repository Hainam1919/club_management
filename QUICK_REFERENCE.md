# 📚 Club Management AI System - Quick Reference Guide

## 🚀 Getting Started

### Prerequisites
```bash
# Python 3.11+
python --version

# Virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Running the Application
```bash
# Development server
python -m uvicorn app.main:app --reload --port 9000

# Or direct
cd /Users/hainam1919/claude_code/club_management
./venv/bin/python -m uvicorn app.main:app --reload
```

### Running Tests
```bash
# All tests
pytest tests/ -v

# Specific test file
pytest tests/test_ai_thought_engine.py -v

# With coverage
pytest tests/ --cov=app --cov-report=html

# Single test
pytest tests/test_ai_thought_engine.py::test_extract_thinking_with_tags -v
```

---

## 📁 Core File Structure

```
club_management/
├── app/
│   ├── ai/                          # 🧠 AI Cognitive System
│   │   ├── thought_engine.py       # Core 4-stage reasoning pipeline
│   │   ├── tools.py                # Tool registry + execution
│   │   ├── rag_service.py          # Vector search service
│   │   └── agents/                 # 4 Specialized Agents
│   │       ├── mentor_agent.py     # Career & skill mentoring
│   │       ├── strategist_agent.py # Club growth strategy
│   │       ├── event_architect_agent.py # Event planning
│   │       └── media_agent.py      # Content creation
│   │
│   ├── routers/                     # 🛣️ API Endpoints (14 routers)
│   │   ├── ai.py                   # Base AI endpoints
│   │   ├── ai_advanced.py          # Advanced AI + agents
│   │   ├── auth.py                 # Authentication
│   │   ├── clubs.py                # Club management
│   │   ├── events.py               # Event management
│   │   └── ... (11 more)
│   │
│   ├── models.py                    # 📊 Database models (23+ models)
│   ├── schemas.py                   # Pydantic request/response
│   ├── database.py                  # SQLAlchemy setup
│   ├── security.py                  # JWT & password hashing
│   ├── ai_service.py               # AI orchestration layer
│   ├── seed.py                      # Database seeding
│   └── main.py                      # FastAPI application
│
├── tests/                           # ✅ Test Suite (42 tests)
│   ├── conftest.py                 # Pytest fixtures & config
│   ├── test_ai_thought_engine.py   # 6 tests
│   ├── test_ai_agents.py           # 5 tests
│   ├── test_ai_endpoints.py        # 5 tests
│   ├── test_auth.py                # 12 tests
│   └── test_clubs.py               # 14 tests
│
├── frontend/                        # 🎨 Frontend (Next.js)
│   ├── js/
│   │   ├── pages.js                # Page components
│   │   ├── api-client.js           # API integration
│   │   └── stream-handler.js       # SSE streaming
│   └── css/
│       └── style.css               # Styling
│
├── requirements.txt                 # Dependencies
├── pytest.ini                       # Pytest configuration
├── TEST_SUMMARY.md                 # Test results summary
└── IMPLEMENTATION_STATUS.md        # This project status
```

---

## 🧠 AI System Architecture

### 1. Cognitive Thought Engine (`app/ai/thought_engine.py`)

**Purpose**: Multi-step reasoning with thinking traces

**Key Methods**:
```python
# Extract thinking from response
thinking_text, clean_response = thought_engine.extract_thinking(response)

# Run full reasoning pipeline
result = await thought_engine.think_and_solve(
    user_message="How to improve my skills?",
    history=[...],
    context="career",
    user_profile={...},
    db=db_session
)

# Fallback local reasoning (no LLM needed)
result = thought_engine.cognitive_fallback(
    message="Recommend clubs for me",
    user_profile={"skills": "Python", "interests": "AI"},
    db=db_session
)
```

**4-Stage Pipeline**:
1. `Deconstruct & Understand` - Parse goals & constraints
2. `Evidence & Tool Retrieval` - Fetch data from DB/RAG
3. `Critical Reflection` - Self-critique & risk analysis
4. `Strategic Synthesis` - Generate actionable recommendations

---

### 2. Tool Registry (`app/ai/tools.py`)

**Purpose**: Structured tool execution for agents

**Available Tools**:
```python
# Search clubs by keywords
result = await registry.execute("search_clubs", {
    "query": "Python AI",
    "limit": 5
}, db=db_session)

# Get upcoming events
result = await registry.execute("get_upcoming_events", {
    "limit": 10
}, db=db_session)

# Evaluate skill fit
result = await registry.execute("evaluate_skill_fit", {
    "user_id": 123,
    "club_id": 456
}, db=db_session)

# Check schedule conflicts
result = await registry.execute("analyze_schedule_conflicts", {
    "date_str": "2026-09-15"
}, db=db_session)
```

---

### 3. Specialized Agents

#### Career Mentor Agent
```python
from app.ai.agents import mentor_agent

result = await mentor_agent.analyze_and_plan(
    user_id=123,
    target_role="AI Engineer",
    db=db_session
)

# Returns:
# {
#   "overall_readiness_score": 85,
#   "strengths": [...],
#   "skill_gaps": [...],
#   "recommended_clubs": [...],
#   "six_month_roadmap": [...]
# }
```

#### Club Strategist Agent
```python
from app.ai.agents import strategist_agent

result = await strategist_agent.diagnose_and_strategize(
    club_id=456,
    db=db_session
)

# Returns club health analysis & growth recommendations
```

#### Event Architect Agent
```python
from app.ai.agents import event_architect_agent

result = await event_architect_agent.design_event_blueprint(
    title="Hackathon 2026",
    concept="AI programming competition",
    expected_attendees=200,
    estimated_budget_vnd=20000000,
    db=db_session
)

# Returns event timeline, budget breakdown, risk matrix
```

#### Media Producer Agent
```python
from app.ai.agents import media_agent

result = await media_agent.create_multi_channel_content(
    title="Club Recruitment Campaign",
    topic_details="Join our amazing club!",
    target_audience="All students",
    tone="genz_energetic"  # or: "academic", "inspiring"
)

# Returns: facebook_post, email_invitation, mc_script, hashtags
```

---

## 🔌 API Endpoints

### Base AI Endpoints (`/api/ai/`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/status` | GET | Check AI system status |
| `/chat` | POST | Regular chat (non-streaming) |
| `/chat/stream` | POST | Streaming chat with thought steps |
| `/analyze-club` | POST | Analyze club info & generate tags |
| `/sentiment` | POST | Analyze text sentiment |
| `/recommendations` | GET | Get personalized club recommendations |
| `/extract-keywords` | POST | Extract keywords from text |
| `/chat-history` | GET | Retrieve chat history |
| `/club-insights/{club_id}` | GET | Deep club analytics |
| `/smart-matching` | GET | Find compatible club members |
| `/club-report/{club_id}` | GET | Generate club summary report |

### Advanced AI Endpoints (`/api/ai-pro/`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/mentor-plan` | POST | Career & skill mentoring |
| `/club-strategy` | POST | Club growth analysis |
| `/event-blueprint` | POST | Event planning |
| `/media-kit` | POST | Content creation |
| `/generate-image` | POST | SVG image generation |
| `/images` | GET | List generated images |
| `/predictive-insights` | GET | Predictive analytics |

---

## 💬 Using the Streaming API

### Frontend Integration (JavaScript)
```javascript
// Connect to streaming endpoint
const response = await fetch('/api/ai/chat/stream', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        message: 'Recommend clubs for me',
        context: 'career'
    })
});

// Process Server-Sent Events
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    lines.forEach(line => {
        if (line.startsWith('data: ')) {
            const event = JSON.parse(line.slice(6));
            
            if (event.type === 'thought_step') {
                // Display thinking step
                console.log(`🤔 ${event.title}: ${event.content}`);
            } else if (event.type === 'token') {
                // Display response token
                console.log(event.content);
            }
        }
    });
}
```

---

## 📊 Database Models

### User Model
```python
class User(Base):
    id: int
    username: str (unique)
    email: str (unique)
    full_name: str
    role: str  # admin, leader, member
    faculty: str
    skills: str (comma-separated)
    interests: str (comma-separated)
    points: UserPoints (relationship)
    memberships: [Membership] (relationship)
```

### Club Model
```python
class Club(Base):
    id: int
    name: str
    slug: str (unique)
    category: str
    description: str
    member_count: int
    president_id: int (FK to User)
    ai_summary: str
    ai_tags: str
    members: [Membership] (relationship)
    events: [Event] (relationship)
```

### Event Model
```python
class Event(Base):
    id: int
    title: str
    description: str
    club_id: int (FK)
    start_time: datetime
    end_time: datetime
    location: str
    max_participants: int
    current_participants: int
    status: str  # upcoming, ongoing, completed
    ai_success_score: float
```

---

## 🔐 Authentication

### Login
```bash
curl -X POST http://localhost:9000/api/auth/login \
  -d "username=admin&password=admin123"

# Response:
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": { "id": 1, "username": "admin", "role": "admin" }
}
```

### Protected Endpoints
```bash
curl -X GET http://localhost:9000/api/auth/me \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## 🧪 Testing

### Run All Tests
```bash
pytest tests/ -v
```

### Run Specific Test File
```bash
pytest tests/test_ai_thought_engine.py -v
pytest tests/test_ai_agents.py -v
pytest tests/test_ai_endpoints.py -v
```

### Run with Output
```bash
pytest tests/ -v -s  # Show print statements
```

### Coverage Report
```bash
pytest tests/ --cov=app --cov-report=html
open htmlcov/index.html
```

---

## 🔧 Development Tips

### Add New AI Tool
1. Create function in `app/ai/tools.py`
2. Decorate with `@ai_tool("description")`
3. Register with `registry.register()`
4. Use in agents via `await registry.execute()`

### Add New Agent
1. Create file in `app/ai/agents/`
2. Inherit from base or create class
3. Implement `async def main_method(...)`
4. Export in `app/ai/agents/__init__.py`
5. Create endpoint in `app/routers/ai_advanced.py`

### Test Coverage
- Add test file in `tests/`
- Use fixtures from `conftest.py`
- Mock database with `db_session`
- Use `auth_headers` for authenticated endpoints

---

## 📈 Performance Optimization

### Database
- Use SQLite for development
- PostgreSQL for production
- Add indexes on frequently queried columns
- Use eager loading for relationships

### Caching
- Redis for session storage
- Langchain for LLM response caching
- Browser caching for static assets

### Async
- Use `async/await` for I/O operations
- Use `gather()` for parallel tasks
- Limit concurrent connections

---

## 🐛 Debugging

### Enable Verbose Logging
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Database Debugging
```bash
# View database schema
sqlite3 club_management.db ".schema"

# Query database
sqlite3 club_management.db "SELECT * FROM user LIMIT 5;"
```

### API Testing
```bash
# Use HTTPie
http POST localhost:9000/api/ai/chat \
  message="Test message" \
  context="general"

# Or curl
curl -X POST http://localhost:9000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message"}'
```

---

## 📞 Support & Resources

### API Documentation
- Interactive Docs: `http://localhost:9000/docs`
- ReDoc: `http://localhost:9000/redoc`

### Key Files for Learning
- `app/ai/thought_engine.py` - Reasoning pipeline
- `app/ai_service.py` - LLM orchestration
- `tests/test_ai_agents.py` - Agent usage examples
- `app/routers/ai_advanced.py` - Endpoint patterns

### Common Commands
```bash
# Seed database
python -m app.seed

# Run dev server
python -m uvicorn app.main:app --reload

# Run tests
pytest tests/ -v

# Format code
black app/ tests/

# Type check
mypy app/
```

---

## ✅ Verification Checklist

Before deployment:
- [ ] All 42 tests passing
- [ ] `pytest tests/ -v` shows 100% pass
- [ ] API docs accessible at `/docs`
- [ ] No console errors in browser
- [ ] Database initialized and seeded
- [ ] Environment variables set correctly
- [ ] CORS configured for frontend domain
- [ ] Rate limiting tested

---

**Version**: 2.5.0  
**Last Updated**: 2026-09-12  
**Status**: ✅ Production Ready
