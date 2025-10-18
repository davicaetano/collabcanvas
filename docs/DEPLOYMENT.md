# CollabCanvas Deployment Guide

Complete guide for deploying the CollabCanvas AI application to production.

## Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Frontend      │────────▶│   Backend       │────────▶│   OpenAI        │
│   (Vercel)      │◀────────│   (Render.com)  │◀────────│   GPT-4o        │
│   React + Vite  │         │   FastAPI       │         │                 │
└────────┬────────┘         └─────────────────┘         └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Firebase      │
│   Firestore     │
│   Auth          │
└─────────────────┘
```

## Prerequisites

Before deploying, ensure you have:

- ✅ Firebase project with Firestore and Auth configured
- ✅ OpenAI API key
- ✅ GitHub account (for deployment)
- ✅ Vercel account (frontend hosting)
- ✅ Render.com account (backend hosting)

---

## Part 1: Backend Deployment (Render.com)

### Step 1: Prepare Backend

Ensure your backend is ready:

```bash
cd packages/backend

# Test locally first
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main.py

# Test health endpoint
curl http://localhost:8000/health
```

### Step 2: Push to GitHub

```bash
# From project root
git add .
git commit -m "Add AI backend for deployment"
git push origin main
```

### Step 3: Create Render Web Service

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
- **Name**: `collabcanvas-ai-backend`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `packages/backend`
- **Runtime**: `Python 3`

**Build Settings:**
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

Or simply use the `Procfile` (Render detects it automatically).

### Step 4: Configure Environment Variables

In Render dashboard, add these environment variables:

```
OPENAI_API_KEY=your-actual-openai-api-key-here
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app
ENVIRONMENT=production
PORT=8000
HOST=0.0.0.0
```

**⚠️ IMPORTANT**: Replace `your-frontend.vercel.app` with your actual Vercel domain (you'll get this in Part 2).

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (takes 2-5 minutes)
3. Once deployed, you'll get a URL like: `https://collabcanvas-ai-backend.onrender.com`

### Step 6: Test Backend

```bash
# Test health endpoint
curl https://your-backend.onrender.com/health

# Should return:
# {
#   "status": "healthy",
#   "environment": "production",
#   "openai_configured": true,
#   "model": "gpt-4o"
# }

# Test AI command
curl -X POST https://your-backend.onrender.com/api/ai/command \
  -H "Content-Type: application/json" \
  -d '{
    "command": "create a blue rectangle",
    "canvas_id": "test",
    "user_id": "test"
  }'
```

---

## Part 2: Frontend Deployment (Vercel)

### Step 1: Update Frontend Environment

Create `.env.production` in `packages/frontend/`:

```bash
# Firebase Configuration (same as your .env)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# AI Backend URL (from Part 1)
VITE_AI_BACKEND_URL=https://your-backend.onrender.com
```

### Step 2: Create `vercel.json` Configuration

Create or update `vercel.json` in project root:

```json
{
  "buildCommand": "cd packages/frontend && npm install && npm run build",
  "outputDirectory": "packages/frontend/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 3: Deploy to Vercel

**Option A: Via Vercel Dashboard**

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `packages/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variables (from `.env.production`)
6. Click **"Deploy"**

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from project root
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set root directory to packages/frontend
# - Accept build settings
```

### Step 4: Get Vercel URL

After deployment, Vercel will provide a URL like:
`https://collabcanvas-xyz123.vercel.app`

### Step 5: Update Backend CORS

Go back to Render.com dashboard:

1. Open your backend service
2. Go to **"Environment"**
3. Update `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://your-actual-frontend.vercel.app
   ```
4. Save changes (backend will auto-redeploy)

---

## Part 3: Firebase Configuration

### Update Firebase Auth Domains

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add your Vercel domain:
   ```
   your-frontend.vercel.app
   ```

### Update Firestore Security Rules

Deploy the firestore rules from `packages/frontend/firestore.rules`:

```bash
# Install Firebase CLI if not already
npm install -g firebase-tools

# Login
firebase login

# Initialize (if not already)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

Or manually copy rules from `firestore.rules` to Firebase Console.

---

## Part 4: Testing Production Deployment

### Complete End-to-End Test

1. **Open your Vercel URL** in browser
2. **Login** with Google OAuth
3. **Test Canvas Features**:
   - Create shapes manually
   - Test real-time sync (open in 2+ browser tabs)
   - Test multiplayer cursors
4. **Test AI Agent**:
   - Open AI Panel (bottom left)
   - Try: "create a blue rectangle"
   - Try: "create a 3x3 grid"
   - Try: "create a login form"
5. **Verify**:
   - All shapes appear immediately
   - Other users see AI-generated shapes
   - No console errors
   - Performance is acceptable (<2s for AI commands)

### Multi-User Test

1. Open app in **Chrome** (logged in as User A)
2. Open app in **Firefox/Incognito** (logged in as User B)
3. User A: Execute AI command "create a red circle"
4. User B: Should see the red circle appear immediately
5. Both users: Should see each other's cursors and presence

---

## Monitoring and Maintenance

### Backend Logs (Render)

- View logs in Render dashboard
- Check for errors or performance issues
- Monitor OpenAI API usage

### Frontend Logs (Vercel)

- View build logs in Vercel dashboard
- Use browser console for runtime errors
- Check Vercel Analytics for performance

### OpenAI Usage

- Monitor at https://platform.openai.com/usage
- Set up usage alerts
- Typical cost: ~$0.01-0.05 per command

### Firestore Usage

- Monitor at Firebase Console
- Check read/write counts
- Free tier: 50K reads/20K writes per day

---

## Troubleshooting

### "CORS Error" in Console

**Problem**: Frontend can't reach backend

**Solution**:
1. Check `ALLOWED_ORIGINS` in Render includes your Vercel URL
2. Make sure URL has `https://` prefix
3. No trailing slash in URL
4. Redeploy backend after changes

### "OpenAI API key not configured"

**Problem**: Backend can't access OpenAI

**Solution**:
1. Check `OPENAI_API_KEY` in Render environment variables
2. Make sure it's the actual key, not the template text
3. Regenerate key if exposed: https://platform.openai.com/api-keys
4. Redeploy backend

### AI Commands Return No Shapes

**Problem**: Commands execute but nothing appears

**Solution**:
1. Check browser console for errors
2. Check Firestore rules allow writes
3. Check user authentication is working
4. Verify shapes collection exists in Firestore
5. Check backend logs in Render

### Deployment Build Fails

**Problem**: Vercel or Render build fails

**Solution**:
1. Check build logs for specific error
2. Verify all dependencies in `package.json`/`requirements.txt`
3. Test build locally first
4. Check Node/Python version compatibility

### "Failed to fetch" or Network Errors

**Problem**: Backend is unreachable

**Solution**:
1. Check backend is running in Render dashboard
2. Test health endpoint directly
3. Check `VITE_AI_BACKEND_URL` in Vercel environment variables
4. Verify no typos in URL

---

## Environment Variables Checklist

### Backend (Render.com)

- [ ] `OPENAI_API_KEY` - Your OpenAI API key
- [ ] `ALLOWED_ORIGINS` - Your Vercel URL
- [ ] `ENVIRONMENT` - Set to "production"
- [ ] `PORT` - Set to 8000 (or use `$PORT`)
- [ ] `HOST` - Set to 0.0.0.0

### Frontend (Vercel)

- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`
- [ ] `VITE_AI_BACKEND_URL` - Your Render URL

---

## Performance Optimization

### Frontend
- Vercel automatically handles CDN and caching
- Enable Vercel Analytics for insights
- Consider upgrading Vercel plan for better performance

### Backend
- Render free tier may cold-start (15s delay after inactivity)
- Consider Render paid tier for always-on instances
- Use Render's "Autoscale" for high traffic

### Firestore
- Optimize queries with indexes
- Use batch operations where possible
- Monitor quota usage

---

## Security Best Practices

### API Keys
- ✅ Never commit `.env` files
- ✅ Rotate keys regularly
- ✅ Use different keys for dev/prod
- ✅ Set up usage alerts on OpenAI

### CORS
- ✅ Only allow specific origins
- ✅ Don't use wildcards (*) in production
- ✅ Keep origin list minimal

### Firestore
- ✅ Use security rules (not open to public)
- ✅ Require authentication for writes
- ✅ Validate data structure
- ✅ Limit query sizes

### Firebase Auth
- ✅ Only add necessary authorized domains
- ✅ Configure OAuth correctly
- ✅ Monitor authentication logs

---

## Rollback Procedure

If deployment fails or has issues:

### Rollback Backend (Render)
1. Go to Render dashboard
2. Select your service
3. Go to "Deploys" tab
4. Click "Rollback" on previous working deploy

### Rollback Frontend (Vercel)
1. Go to Vercel dashboard
2. Select your project
3. Go to "Deployments" tab
4. Find previous working deployment
5. Click "..." → "Promote to Production"

---

## Next Steps After Deployment

1. **Add Custom Domain** (optional)
   - Vercel: Add custom domain in project settings
   - Update CORS and Firebase accordingly

2. **Set Up Monitoring**
   - Render: Enable email alerts
   - Vercel: Enable Analytics
   - OpenAI: Set usage limits

3. **Performance Testing**
   - Test with multiple users
   - Monitor response times
   - Check for memory leaks

4. **User Feedback**
   - Share app with test users
   - Collect feedback on AI commands
   - Iterate on UX

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Firebase Docs**: https://firebase.google.com/docs
- **OpenAI Docs**: https://platform.openai.com/docs
- **LangChain Docs**: https://python.langchain.com/docs/

---

🎉 **Congratulations!** Your CollabCanvas AI application is now deployed and ready for users!

