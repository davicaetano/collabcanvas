# PRD: CollabCanvas AI Agent - MVP Implementation

## Objective

Implement the AI Agent for CollabCanvas focusing on having a **functional and deployed MVP** as quickly as possible, validating the entire infrastructure before adding complex features.

---

## MVP Principles

1. **Deploy First**: Validate that backend + frontend + Firebase work together in production
2. **Simplicity**: Only essential commands that prove the concept
3. **End-to-End Validation**: One command working perfectly is worth more than 10 half-done
4. **Rapid Iteration**: Implement → Deploy → Test → Iterate

---

## High-Level Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────▶│   Backend    │─────▶│   OpenAI    │
│   (React)   │◀─────│  (FastAPI +  │◀─────│   GPT-4     │
│             │      │  LangChain)  │      │             │
└──────┬──────┘      └──────┬───────┘      └─────────────┘
       │                    │
       │                    │
       ▼                    ▼
┌──────────────────────────────┐
│     Firebase Firestore       │
│   (Real-time sync shapes)    │
└──────────────────────────────┘
```

**Flow:**
1. User types command in frontend
2. Frontend sends to Python backend
3. Backend uses LangChain + OpenAI GPT-4 to interpret
4. GPT-4 calls tools (function calling) that return shapes
5. Backend returns shapes to frontend
6. Frontend saves to Firestore
7. All users see via real-time sync

---

## Implementation Roadmap

### Phase 0: Base Structure (15 min)
**Goal:** Create backend structure without breaking frontend

**Deliverables:**
- `packages/backend/` directory with folder structure
- Config files: `requirements.txt`, `.env.example`, `.gitignore`
- Automated setup scripts
- Updated root `.gitignore`

**Validation:** Frontend continues working normally

---

### Phase 1: Mock Backend (45 min)
**Goal:** Basic FastAPI API running locally

**Implement:**
- **`main.py`**: FastAPI app with CORS configured
- **Endpoints:**
  - `GET /` - API info
  - `GET /health` - Health check
  - `POST /api/ai/command` - Receives command, returns **mocked** shape
- **Pydantic Models:**
  - `AICommandRequest`: command, canvas_id, user_id
  - `Shape`: id, type, x, y, width, height, fill
  - `AICommandResponse`: success, message, shapes[]

**Validation:** 
- Backend runs on localhost:8000
- `/docs` shows Swagger UI
- Endpoint returns hardcoded mock shape

---

### Phase 2: Frontend Integration (45 min)
**Goal:** Frontend connects to backend and displays UI

**Implement:**
- **`useAIAgent` Hook**: 
  - Sends POST to `/api/ai/command`
  - Manages loading/error states
  - Returns shapes to component
  
- **`AIPanel` Component**:
  - Input for command
  - "Execute" button with loading state
  - Error display
  - Example commands list
  
- **App Integration**:
  - Add `<AIPanel />` to main canvas
  - `onShapesCreated` handler that logs shapes to console

**Validation:**
- AIPanel appears on canvas
- Clicking "Execute" makes request to backend
- Console shows received shapes
- Loading/errors work

---

### Phase 3: Firestore Sync (30 min)
**Goal:** AI-created shapes appear on canvas for everyone

**Implement:**
- **`aiFirestore.js` Utility**:
  - Function `saveAIShapesToFirestore(canvasId, userId, shapes)`
  - Adds metadata: `isAIGenerated: true`, `createdBy`, timestamps
  - Batch write for multiple shapes

- **Update App handler**:
  - Call `saveAIShapesToFirestore` when shapes arrive
  - Add try/catch and logging

**Validation:**
- Shapes appear in Firestore Console
- Canvas renders shapes automatically (via existing listener)
- Multiple users see the same shapes
- `isAIGenerated` flag present in documents

---

### Phase 4: LangChain + OpenAI (1h 30min)
**Goal:** Replace mock with real AI with 1 working command

**Implement:**

**Backend:**
- **Add dependencies**: `langchain`, `langchain-openai` to requirements.txt

- **`agents/tools.py`**:
  - Tool `create_shape(shape_type, x, y, width, height, color)` 
  - Returns dict with shape data
  - Supports only "rectangle" and "circle" (MVP)

- **`agents/prompts.py`**:
  - System prompt explaining canvas, colors, positions
  - Instructions for agent: defaults, color conversion, etc

- **`agents/canvas_agent.py`**:
  - Function `create_canvas_agent()`: creates AgentExecutor with GPT-4
  - Uses `ChatOpenAI(model="gpt-4-turbo-preview")`
  - Function `execute_canvas_command()`: executes command, extracts shapes

- **Update `main.py`**:
  - Import `execute_canvas_command`
  - `/api/ai/command` endpoint calls real agent
  - Add OPENAI_API_KEY validation

**Configuration:**
- Create `.env` with `OPENAI_API_KEY`
- Update `/health` to show if API key is configured

**Validation:**
- Backend starts without import errors
- Command "create a blue rectangle" → blue shape created
- Command "make a red circle" → red circle created
- Shapes appear on canvas via Firestore
- Logs show agent execution

---

### Phase 5: Deploy (1h)
**Goal:** MVP running in production end-to-end

**Backend (Render.com):**
- Create `Procfile` for Render
- Configure environment variables in dashboard
- Deploy and test public `/health` endpoint

**Frontend (Vercel):**
- Update `.env.production` with backend URL
- Configure `vercel.json` pointing to `packages/frontend`
- Deploy and test commands in production

**Integrations:**
- Update CORS in backend with Vercel domain
- Test complete flow: command → backend → shapes → Firestore → canvas
- Validate real-time sync between multiple devices

**Validation:**
- Public URLs working
- AI command executes end-to-end in production
- Multiple users see synced shapes

---

## Supported Commands in MVP

### MVP - Phase 4 (1 command)
✅ **"create a [color] [shape]"**
- Examples: "create a blue rectangle", "make a red circle"
- Only 2 shapes: rectangle, circle
- Only basic colors: red, blue, green, yellow, purple, pink

### Post-MVP (expand later)
- "create a [shape] at x, y"
- "make a [size] [color] [shape]"
- "create text that says..."
- "arrange in a grid"
- "create a login form"

---

## Final File Structure

```
packages/backend/
├── agents/
│   ├── __init__.py
│   ├── tools.py              # LangChain tools (create_shape)
│   ├── prompts.py            # System prompts
│   └── canvas_agent.py       # Agent executor
├── services/
│   └── __init__.py
├── models/
│   └── __init__.py
├── main.py                   # FastAPI app
├── requirements.txt          # Dependencies
├── .env                      # API keys (gitignored)
├── .env.example             # Template (OPENAI_API_KEY)
├── .gitignore
├── Procfile                 # Render deploy
└── README.md

packages/frontend/src/
├── hooks/
│   └── useAIAgent.js        # Hook to call API
├── components/
│   └── Canvas/
│       └── AIPanel.jsx      # AI UI
├── utils/
│   └── aiFirestore.js       # Save shapes to Firestore
└── ...

scripts/
├── setup.sh                 # Automated setup
└── start-dev.sh            # Start dev servers
```

---

## MVP Validation Checklist

### ✅ Backend
- [ ] FastAPI runs without errors
- [ ] Swagger UI accessible at `/docs`
- [ ] Health check returns status
- [ ] LangChain + OpenAI GPT-4 integrated
- [ ] `create_shape` tool works
- [ ] Clear logs during execution
- [ ] Deployed on Render.com

### ✅ Frontend  
- [ ] `useAIAgent` hook connects to backend
- [ ] `AIPanel` component renders
- [ ] Loading/error states work
- [ ] Example commands clickable
- [ ] Deployed on Vercel

### ✅ Integration
- [ ] Command → Backend → GPT-4 → Shapes
- [ ] Shapes saved to Firestore
- [ ] Canvas renders shapes automatically
- [ ] Real-time sync between users works
- [ ] CORS configured correctly

### ✅ Deploy
- [ ] Public URLs accessible
- [ ] Environment variables configured
- [ ] End-to-end works in production
- [ ] Acceptable performance (<2s per command)

---

## MVP Success Criteria

**Must work:**
1. User types "create a blue rectangle" in AIPanel
2. Backend receives, processes with GPT-4 via LangChain
3. Blue shape is created and returned
4. Frontend saves to Firestore
5. All connected users see the shape appear
6. All this works in production (deployed)

**Performance:**
- Latency < 2 seconds for simple commands
- Real-time sync < 100ms

**Quality:**
- Clean and organized code
- Informative logs
- Basic error handling
- Updated README documentation

---

## Time Estimate

| Phase | Time | Focus |
|------|-------|------|
| 0. Structure | 15min | Initial setup |
| 1. Mock Backend | 45min | Functional API |
| 2. Frontend | 45min | UI + integration |
| 3. Firestore | 30min | Persistence |
| 4. LangChain | 1h30min | Real AI |
| 5. Deploy | 1h | Production |
| **TOTAL MVP** | **4h 45min** | |

---

## Risks and Mitigations

| Risk | Mitigation |
|-------|-----------|
| API key doesn't work | Test with curl before integrating |
| CORS issues in prod | Configure origins explicitly |
| LangChain incompatible version | Pin exact versions in requirements.txt |
| Firestore rules block writes | Validate rules allow authenticated users |
| Deploy fails | Test locally first, use logs |

---

## Post-MVP Next Steps

1. **More Tools** (6 total commands for rubric):
   - `create_text`
   - `move_shape` 
   - `resize_shape`
   - `create_grid`

2. **Complex Commands**:
   - "create a login form" → multiple elements
   - "arrange in a 3x3 grid"

3. **UX Improvements**:
   - Command history
   - Smart suggestions
   - Preview before creating

4. **Optimizations**:
   - Cache common commands
   - Batch operations
   - Better error messages

---

## Important Notes

- **OpenAI API Key**: You already have a key ✅ - configure in `.env` for Phase 4
- **Model**: Use `gpt-4-turbo-preview` or `gpt-4` (best function calling)
- **Git**: Never commit `.env` with real keys
- **Testing**: Test each phase before advancing
- **Logs**: Keep verbose logs during development for debugging
- **Documentation**: Update README as you implement

---

## Resources

- **LangChain Docs**: https://python.langchain.com/docs/
- **OpenAI API**: https://platform.openai.com/docs/
- **OpenAI Function Calling**: https://platform.openai.com/docs/guides/function-calling
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Render Deploy**: https://render.com/docs
- **Vercel Deploy**: https://vercel.com/docs
