# CollabCanvas Quick Start Guide

Get up and running with CollabCanvas AI in under 10 minutes!

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Firebase account
- OpenAI API key

---

## Step 1: Clone and Install (2 minutes)

```bash
# Clone repository
git clone <your-repo-url>
cd collabcanvas

# Install frontend dependencies
cd packages/frontend
npm install
cd ../..

# Setup backend
cd packages/backend
bash setup.sh
# This creates virtual environment and installs Python dependencies
```

---

## Step 2: Configure Backend (2 minutes)

```bash
cd packages/backend

# Create .env file from template
cp .env.template .env

# Edit .env and add your OpenAI API key
# nano .env  # or use your preferred editor
```

**`.env` contents:**
```bash
OPENAI_API_KEY=sk-your-actual-key-here  # ← Add your key here!
PORT=8000
HOST=0.0.0.0
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
ENVIRONMENT=development
```

**🔑 Get OpenAI API Key:**
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy and paste into `.env`

---

## Step 3: Configure Frontend (3 minutes)

```bash
cd packages/frontend

# Create .env file
touch .env
```

**Add your Firebase configuration to `.env`:**

```bash
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Backend URL (local development)
VITE_AI_BACKEND_URL=http://localhost:8000
```

**🔥 Get Firebase Config:**
1. Go to https://console.firebase.google.com/
2. Select your project (or create new)
3. Go to Project Settings → General
4. Scroll to "Your apps" → Web app
5. Copy configuration values

**Enable Firebase Services:**
1. **Authentication**: Enable Google provider
2. **Firestore**: Create database in test mode
3. **Firestore Rules**: Deploy from `firestore.rules`

---

## Step 4: Start Backend (1 minute)

```bash
# Open first terminal
cd packages/backend

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Start backend server
python main.py
```

**Expected output:**
```
============================================================
CollabCanvas AI Backend Starting...
============================================================
Environment: development
Port: 8000
Allowed Origins: ['http://localhost:5173', 'http://localhost:3000']
✓ OpenAI API Key: Configured
============================================================
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Test it:**
```bash
# In another terminal
curl http://localhost:8000/health
# Should return: {"status": "healthy", "openai_configured": true, ...}
```

---

## Step 5: Start Frontend (1 minute)

```bash
# Open second terminal
cd packages/frontend

# Start development server
npm run dev
```

**Expected output:**
```
  VITE v7.1.7  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## Step 6: Test Everything! (1 minute)

### 1. Open App
- Go to http://localhost:5173/
- Login with Google

### 2. Test Canvas
- Create a shape (click rectangle tool, click canvas)
- Drag to move
- Open in another browser tab - see real-time sync ✨

### 3. Test AI Agent
- Find the **AI Panel** in bottom-left corner
- Try these commands:
  - ✅ `create a blue rectangle`
  - ✅ `create a 3x3 grid`
  - ✅ `create a login form`
  - ✅ `make a big red circle at 500, 400`

**Success indicators:**
- ✅ Shapes appear on canvas immediately
- ✅ Other browser tabs see the same shapes
- ✅ AI Panel shows "Created X shape(s)" message
- ✅ No errors in console

---

## Common Issues and Fixes

### ❌ "OpenAI API key not configured"

**Fix:**
1. Check `.env` in `packages/backend/`
2. Make sure `OPENAI_API_KEY` has your actual key
3. Restart backend server

### ❌ "CORS error" in browser console

**Fix:**
1. Check backend is running on `http://localhost:8000`
2. Check frontend is running on `http://localhost:5173`
3. Verify `ALLOWED_ORIGINS` in backend `.env` includes frontend URL
4. Restart both servers

### ❌ Firebase authentication fails

**Fix:**
1. Check Firebase config in frontend `.env`
2. Verify Google auth is enabled in Firebase Console
3. Add `localhost` to authorized domains in Firebase Console

### ❌ AI commands return no shapes

**Fix:**
1. Check backend terminal for errors
2. Test backend health: `curl http://localhost:8000/health`
3. Check `openai_configured: true` in health response
4. Verify Firestore rules allow writes

### ❌ Shapes don't sync between tabs

**Fix:**
1. Check Firestore is enabled in Firebase Console
2. Check Firestore rules allow reads
3. Open browser console and check for errors
4. Verify both tabs are logged in with same user

---

## Development Workflow

### Running Both Servers

**Terminal 1 - Backend:**
```bash
cd packages/backend
source venv/bin/activate
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd packages/frontend
npm run dev
```

### Making Changes

**Backend changes:**
- Edit files in `packages/backend/`
- Backend auto-reloads on save (if using `--reload` flag)

**Frontend changes:**
- Edit files in `packages/frontend/src/`
- Vite hot-reloads automatically

**Adding new AI commands:**
1. Add tool to `packages/backend/agents/tools.py`
2. Export it in `ALL_TOOLS` list
3. Update prompts if needed
4. Restart backend

---

## Testing with Multiple Users

### Method 1: Multiple Browser Windows
- Open app in Chrome (User A)
- Open app in Incognito/Private window (User B)
- Login with different Google accounts

### Method 2: Different Browsers
- Open app in Chrome (User A)
- Open app in Firefox (User B)
- Login with different accounts

**Test scenarios:**
- ✅ Create shape in A → appears in B instantly
- ✅ Move shape in A → B sees movement
- ✅ AI command in A → B sees results
- ✅ See each other's cursors
- ✅ See online users list

---

## Project Structure Reference

```
collabcanvas/
├── packages/
│   ├── backend/              # Python FastAPI backend
│   │   ├── agents/          # LangChain tools and agent
│   │   │   ├── tools.py     # 6 canvas tools
│   │   │   ├── prompts.py   # System prompts
│   │   │   └── canvas_agent.py
│   │   ├── main.py          # FastAPI app
│   │   ├── requirements.txt
│   │   └── .env             # ← Your API keys (gitignored!)
│   │
│   └── frontend/            # React + Vite frontend
│       ├── src/
│       │   ├── components/
│       │   │   └── Canvas/
│       │   │       ├── AIPanel.jsx      # AI UI
│       │   │       └── index.jsx        # Main canvas
│       │   ├── hooks/
│       │   │   └── useAIAgent.js        # AI API client
│       │   └── utils/
│       │       └── aiFirestore.js       # Firestore integration
│       ├── .env             # ← Your Firebase config (gitignored!)
│       └── package.json
│
├── QUICKSTART.md            # ← You are here!
├── DEPLOYMENT.md            # Production deployment guide
└── README.md                # Project overview
```

---

## Next Steps

### For Development:
1. **Read the code**:
   - Backend: `packages/backend/agents/tools.py` - See how tools work
   - Frontend: `packages/frontend/src/components/Canvas/AIPanel.jsx` - AI UI

2. **Add new commands**:
   - Follow examples in `tools.py`
   - Test locally first
   - Update prompts if needed

3. **Customize UI**:
   - Edit `AIPanel.jsx` for different layout
   - Add more example commands
   - Style with Tailwind CSS

### For Production:
1. **Follow DEPLOYMENT.md** for step-by-step production setup
2. **Test thoroughly** with multiple users
3. **Monitor costs** on OpenAI dashboard
4. **Set up analytics** on Vercel

---

## Useful Commands

### Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Run server
python main.py

# Run with auto-reload
uvicorn main:app --reload

# Test health
curl http://localhost:8000/health

# View API docs
open http://localhost:8000/docs
```

### Frontend
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing
```bash
# Test AI command
curl -X POST http://localhost:8000/api/ai/command \
  -H "Content-Type: application/json" \
  -d '{"command": "create a blue rectangle"}'
```

---

## Support

- **Backend Issues**: Check `packages/backend/README.md`
- **Frontend Issues**: Check `packages/frontend/README.md`
- **Deployment**: Check `DEPLOYMENT.md`
- **OpenAI Docs**: https://platform.openai.com/docs
- **LangChain Docs**: https://python.langchain.com/docs

---

🎉 **You're all set!** Happy coding with CollabCanvas AI! 🚀

