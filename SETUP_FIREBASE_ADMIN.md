# Firebase Admin SDK Setup Guide

## 🎉 Implementation Complete!

The AI agent can now **read and manipulate** existing shapes on the canvas! This includes:
- ✅ Moving shapes
- ✅ Resizing shapes
- ✅ Changing colors
- ✅ Deleting shapes
- ✅ Reading canvas state

---

## 📥 Required: Download Firebase Service Account

Before the backend works, you need to download the Firebase Service Account credentials:

### Step-by-Step Instructions:

1. **Go to Firebase Console**: https://console.firebase.google.com

2. **Select your project** (the same one used in the frontend)

3. **Navigate to Project Settings**:
   - Click the ⚙️ (gear icon) in the top left
   - Select **"Project Settings"**

4. **Go to Service Accounts tab**:
   - Click on the **"Service Accounts"** tab
   - You should see "Firebase Admin SDK" section

5. **Generate New Private Key**:
   - Click the button **"Generate New Private Key"**
   - Confirm in the popup dialog
   - A JSON file will be downloaded (e.g., `your-project-firebase-adminsdk-xxxxx.json`)

6. **Rename and Move the File**:
   ```bash
   # Rename the downloaded file
   mv ~/Downloads/your-project-firebase-adminsdk-xxxxx.json firebase-service-account.json
   
   # Move it to the backend directory
   mv firebase-service-account.json "/Users/davicaetano/My Drive/pessoais/education/gauntlet/canvas/collabcanvas/packages/backend/"
   ```

7. **⚠️ CRITICAL**: This file contains **secret credentials**! 
   - It's already in `.gitignore` so it won't be committed
   - **NEVER** commit this file to git
   - **NEVER** share this file publicly

---

## 🔧 Backend Setup

### 1. Install New Dependencies

```bash
cd "collabcanvas/packages/backend"

# Activate virtual environment
source venv/bin/activate

# Install firebase-admin
pip install firebase-admin==6.5.0

# Or install all dependencies
pip install -r requirements.txt
```

### 2. Update Your `.env` File

The `.env.template` has been updated with Firebase variables. If you need to recreate your `.env`:

```bash
cp .env.template .env
```

Then edit `.env` and add your Firebase credentials (same as frontend):

```bash
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
```

### 3. Start the Backend

```bash
cd "collabcanvas/packages/backend"
source venv/bin/activate
python main.py
```

You should see:
```
✓ Firebase Admin SDK initialized successfully
✓ OpenAI API Key: Configured
```

---

## 🧪 Testing

### Test 1: Backend Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "environment": "development",
  "openai_configured": true,
  "model": "gpt-4o"
}
```

### Test 2: Create a Shape (via Frontend)

1. Start frontend: `cd packages/frontend && npm run dev`
2. Open browser: http://localhost:5173
3. In AI Panel: "create a blue rectangle"
4. ✅ Shape should appear on canvas

### Test 3: Manipulate Existing Shapes

**Test Move:**
1. Ensure you have a blue rectangle on the canvas
2. In AI Panel: "move the blue rectangle to the right"
3. ✅ The rectangle should move to the right

**Test Resize:**
1. In AI Panel: "make the rectangle bigger"
2. ✅ The rectangle should increase in size

**Test Color Change:**
1. In AI Panel: "change the rectangle to red"
2. ✅ The rectangle should turn red

**Test Delete:**
1. In AI Panel: "delete the rectangle"
2. ✅ The rectangle should disappear

**Test Read:**
1. In AI Panel: "what shapes are on the canvas?"
2. ✅ The AI should describe all shapes

---

## 🆕 New Features

### New Tools Available:

1. **`get_canvas_shapes()`** - Read all shapes from Firestore
2. **`move_shape(shape_id, x, y)`** - Move shape by ID
3. **`resize_shape(shape_id, width, height)`** - Resize shape by ID  
4. **`change_shape_color(shape_id, color)`** - Change color by ID
5. **`delete_shape_by_id(shape_id)`** - Delete shape by ID

### How It Works:

```
User: "move the blue rectangle to the right"
    ↓
1. AI calls get_canvas_shapes()
   → Finds: {id: "abc123", type: "rectangle", fill: "#0000FF", x: 100, y: 200}
    ↓
2. AI identifies: "blue rectangle" = shape "abc123" at x=100
    ↓
3. AI calculates: moving right = x + 150 = 250
    ↓
4. AI calls move_shape(shape_id="abc123", new_x=250, new_y=200)
    ↓
5. Backend updates Firestore directly
    ↓
6. Frontend updates automatically (existing real-time sync)
```

---

## 📁 Files Modified/Created

### Backend:
- ✅ `.env.template` - Added Firebase configuration variables
- ✅ `requirements.txt` - Added `firebase-admin==6.5.0`
- ✅ `services/firebase_service.py` - NEW: Firebase Admin SDK integration
- ✅ `agents/tools.py` - Added/updated tools:
  - NEW: `get_canvas_shapes()`
  - UPDATED: `move_shape()` - now uses Firebase
  - UPDATED: `resize_shape()` - now uses Firebase
  - NEW: `change_shape_color()`
  - NEW: `delete_shape_by_id()`
- ✅ `agents/prompts.py` - Updated system prompt with manipulation instructions
- ✅ `agents/canvas_agent.py` - Added `session_id` parameter
- ✅ `main.py` - Added `session_id` to request model

### Frontend:
- ✅ `hooks/useAIAgent.js` - Added `session_id` parameter
- ✅ `components/Canvas/AIPanel.jsx` - Passes `session_id` to hook

---

## 🔒 Security Notes

1. **Service Account File**:
   - Contains admin privileges to your Firebase project
   - Already added to `.gitignore`
   - Keep it safe and never share publicly

2. **Firestore Rules**:
   - Your existing Firestore rules still apply
   - The Admin SDK bypasses rules (needed for AI operations)
   - This is normal and expected for server-side operations

3. **Production Deployment**:
   - For Render/Heroku: Use `FIREBASE_SERVICE_ACCOUNT_JSON` env var
   - Copy entire JSON content as environment variable
   - Don't upload the file directly to production server

---

## 🐛 Troubleshooting

### Error: "Firebase service account file not found"
**Solution**: Download the service account file from Firebase Console and place it in `packages/backend/`

### Error: "Module 'firebase_admin' not found"
**Solution**: Install dependencies:
```bash
cd packages/backend
source venv/bin/activate
pip install -r requirements.txt
```

### AI says "I don't see any shapes"
**Possible causes**:
- Canvas is actually empty (try creating a shape first)
- Firebase connection issue (check backend logs)
- Wrong canvas_id (should be "main-canvas")

### Shapes not updating after AI manipulation
**Possible causes**:
- Check backend logs for errors
- Verify Firestore connection is working
- Check browser console for errors
- Ensure frontend real-time listener is active

---

## 📝 Next Steps

Now you can:

1. ✅ Test all manipulation commands
2. ✅ Deploy to production (remember to set `FIREBASE_SERVICE_ACCOUNT_JSON` env var)
3. ✅ Extend with more complex commands:
   - "move all blue shapes to the right"
   - "arrange shapes in a grid"
   - "group shapes together"
4. ✅ Add undo/redo functionality
5. ✅ Add command history and suggestions

---

## 🎓 Example Commands to Try

### Reading Canvas:
- "what shapes are on the canvas?"
- "how many rectangles are there?"
- "describe what I have on the canvas"

### Moving:
- "move the blue rectangle to 500, 300"
- "move the circle to the right"
- "move all text to the top"

### Resizing:
- "make the square bigger"
- "double the size of the red circle"
- "make the rectangle 200 pixels wide"

### Color Changes:
- "change the blue rectangle to red"
- "make everything green"
- "change the text color to purple"

### Deleting:
- "delete the yellow circle"
- "remove all rectangles"
- "clear the canvas"

### Complex:
- "move the login form to the center"
- "make all blue shapes bigger than red ones"
- "arrange all circles in a horizontal line"

---

## 🚀 Ready to Test!

1. Download Firebase Service Account ✅
2. Install dependencies ✅
3. Start backend ✅
4. Start frontend ✅
5. Try: "create a blue rectangle" then "move it to the right" ✅

Enjoy your enhanced AI canvas agent! 🎨🤖

