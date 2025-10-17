# CollabCanvas AI Backend

AI-powered backend for CollabCanvas using FastAPI, LangChain, and OpenAI GPT-4o.

## Features

- **Natural Language Canvas Manipulation**: Interpret commands like "create a blue rectangle" or "make a login form"
- **6+ AI Commands**: Creation, manipulation, layout, and complex commands
- **LangChain Integration**: Structured tool calling with OpenAI GPT-4o
- **FastAPI**: Modern, fast Python web framework
- **CORS Configured**: Ready for frontend integration

## Quick Start

### 1. Installation

```bash
cd packages/backend
pip install -r requirements.txt
```

Or use a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configuration

Create a `.env` file in the `backend/` directory:

```bash
# CRITICAL: Never commit this file to Git!
OPENAI_API_KEY=your-actual-openai-api-key-here

# Server Configuration
PORT=8000
HOST=0.0.0.0

# CORS Origins (add your frontend URLs)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://your-vercel-app.vercel.app

# Environment
ENVIRONMENT=development
```

**⚠️ SECURITY WARNING**: The `.env` file contains sensitive API keys. It is already in `.gitignore` and should NEVER be committed to Git!

### 3. Run Development Server

```bash
# Make sure you're in the backend directory
cd packages/backend

# Activate virtual environment if using one
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run the server
python main.py
```

Or use uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### 4. Test the API

Test with curl:

```bash
# Health check
curl http://localhost:8000/health

# Execute AI command
curl -X POST http://localhost:8000/api/ai/command \
  -H "Content-Type: application/json" \
  -d '{
    "command": "create a blue rectangle",
    "canvas_id": "test-canvas",
    "user_id": "test-user"
  }'
```

Or visit http://localhost:8000/docs to use the interactive API documentation.

## AI Commands Supported

### Creation Commands (2 tools)
- `create_shape`: Create rectangles and circles
  - *"Create a blue rectangle"*
  - *"Make a red circle at 300, 200"*
  
- `create_text`: Add text to canvas
  - *"Add text that says Hello World"*
  - *"Create text 'Welcome' at position 500, 300"*

### Manipulation Commands (2 tools)
- `move_shape`: Move existing shapes
  - *"Move the blue rectangle to the center"*
  - *"Move the circle to position 400, 400"*
  
- `resize_shape`: Change shape dimensions
  - *"Make the rectangle bigger"*
  - *"Resize the circle to 200 pixels"*

### Layout Commands (1 tool)
- `create_grid`: Generate organized grids
  - *"Create a 3x3 grid of squares"*
  - *"Make a grid of 5 rows and 4 columns"*

### Complex Commands (1 tool)
- `create_form`: Build multi-element forms
  - *"Create a login form"*
  - *"Build a signup form"*

**Total: 6 distinct commands covering all rubric categories ✅**

## API Endpoints

### `GET /`
Root endpoint with API information.

### `GET /health`
Health check endpoint. Returns:
```json
{
  "status": "healthy",
  "environment": "development",
  "openai_configured": true,
  "model": "gpt-4o"
}
```

### `POST /api/ai/command`
Execute AI commands. 

**Request:**
```json
{
  "command": "create a blue rectangle",
  "canvas_id": "optional-canvas-id",
  "user_id": "optional-user-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully executed command: create a blue rectangle",
  "shapes": [
    {
      "id": "uuid-here",
      "type": "rectangle",
      "x": 600,
      "y": 400,
      "width": 100,
      "height": 100,
      "fill": "#0000FF",
      "rotation": 0,
      "stroke": "#000000",
      "strokeWidth": 2,
      "isAIGenerated": true
    }
  ]
}
```

## Project Structure

```
packages/backend/
├── agents/
│   ├── __init__.py
│   ├── tools.py           # LangChain tools (6 canvas tools)
│   ├── prompts.py         # System prompts for AI agent
│   └── canvas_agent.py    # Agent executor and command handler
├── main.py                # FastAPI application
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (DO NOT COMMIT!)
├── .env.example          # Template for .env
├── .gitignore            # Git ignore file (includes .env)
├── Procfile              # Render.com deployment config
└── README.md             # This file
```

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────▶│   FastAPI    │─────▶│   OpenAI    │
│   (React)   │◀─────│  + LangChain │◀─────│   GPT-4o    │
└─────────────┘      └──────────────┘      └─────────────┘
                           │
                           ▼
                     6 Canvas Tools
                     (create_shape, etc.)
```

**Flow:**
1. Frontend sends natural language command
2. FastAPI receives and validates request
3. LangChain agent interprets command
4. GPT-4o selects and executes appropriate tools
5. Tools return shape data
6. FastAPI sends shapes back to frontend
7. Frontend saves to Firestore
8. All users see updates via real-time sync

## Deployment to Render.com

### 1. Create Render Account
Sign up at https://render.com

### 2. Create New Web Service
- Connect your GitHub repository
- Select the `packages/backend` directory
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

Or use the `Procfile` (automatically detected by Render).

### 3. Configure Environment Variables
In Render dashboard, add these environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `ALLOWED_ORIGINS`: Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)
- `ENVIRONMENT`: `production`

### 4. Deploy
Render will automatically deploy your backend. You'll get a URL like:
`https://your-app.onrender.com`

### 5. Update Frontend
Update your frontend `.env.production` with the backend URL:
```
VITE_AI_BACKEND_URL=https://your-app.onrender.com
```

## Development Tips

### Enable Verbose Logging
The agent executor has `verbose=True` by default, which logs all tool calls and reasoning. Check your terminal output to debug commands.

### Test Individual Tools
You can import and test tools directly:

```python
from agents.tools import create_shape, create_grid

# Test single shape
shape = create_shape.invoke({
    "shape_type": "rectangle",
    "x": 100,
    "y": 100,
    "color": "blue"
})
print(shape)

# Test grid
grid = create_grid.invoke({
    "rows": 3,
    "cols": 3,
    "color": "red"
})
print(f"Created {len(grid)} shapes")
```

### Monitor API Usage
Keep an eye on your OpenAI API usage at https://platform.openai.com/usage

GPT-4o costs:
- Input: $2.50 per 1M tokens
- Output: $10 per 1M tokens

Typical command uses ~500-1000 tokens, so costs are minimal for testing.

## Troubleshooting

### "OpenAI API key is not configured"
- Make sure you created a `.env` file in `packages/backend/`
- Verify `OPENAI_API_KEY` is set correctly
- Restart the server after adding environment variables

### "CORS error" from frontend
- Add your frontend URL to `ALLOWED_ORIGINS` in `.env`
- Format: `http://localhost:5173,https://your-vercel-app.vercel.app`
- Restart the server

### Agent returns no shapes
- Check terminal logs for agent reasoning
- Verify the command is clear and specific
- Try a simpler command first (e.g., "create a blue rectangle")

### Import errors
- Make sure you're in the backend directory
- Activate your virtual environment
- Reinstall requirements: `pip install -r requirements.txt`

## Security Notes

🔒 **CRITICAL SECURITY PRACTICES:**

1. **Never commit `.env` file** - It's in `.gitignore`, keep it that way
2. **Rotate API keys regularly** - Generate new keys if exposed
3. **Use environment variables** - Never hardcode API keys in source code
4. **Limit CORS origins** - Only allow trusted frontend domains
5. **Monitor API usage** - Set up usage alerts on OpenAI dashboard

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Health check returns `openai_configured: true`
- [ ] Swagger UI accessible at `/docs`
- [ ] Can execute simple command: "create a blue rectangle"
- [ ] Can execute complex command: "create a login form"
- [ ] All 6 command types work
- [ ] CORS allows frontend requests
- [ ] Shapes have proper structure and IDs

## Next Steps

After getting backend running:

1. **Create Frontend Components** (Phase 2)
   - `useAIAgent` hook
   - `AIPanel` component

2. **Integrate with Firestore** (Phase 3)
   - `aiFirestore.js` utility
   - Save AI shapes to database

3. **Deploy to Production** (Phase 5)
   - Deploy backend to Render
   - Deploy frontend to Vercel
   - Test end-to-end in production

## Resources

- **LangChain Docs**: https://python.langchain.com/docs/
- **OpenAI API**: https://platform.openai.com/docs/
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Render Deploy**: https://render.com/docs

---

Built with ❤️ for CollabCanvas

