# CollabCanvas

A real-time collaborative design tool built with React, Firebase, and Konva.

## Features

- Real-time collaboration with multiple users
- Canvas with pan and zoom
- Shape creation and manipulation
- Live cursor tracking
- User presence awareness
- Google OAuth authentication

## Quick Start

### 1. Clone and Install

```bash
cd collabcanvas
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication and select Google as a provider
3. Enable Firestore Database
4. Copy your Firebase configuration
5. Create a `.env` file in the root directory:

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Deploy to Vercel

1. Push to GitHub
2. Connect your GitHub repo to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

## Tech Stack

- **Frontend**: React + Vite
- **Canvas**: react-konva
- **Styling**: Tailwind CSS
- **Backend**: Firebase Firestore
- **Auth**: Firebase Auth (Google OAuth)
- **Deployment**: Vercel

## Architecture

```
React App ←→ Firebase Auth (Google OAuth)
    ↓
react-konva Canvas ←→ Firestore Database
    ↓                     ↓
Real-time Shapes    Real-time Cursors
```

## Development Status

✅ Basic project setup  
✅ Authentication system  
✅ Canvas with pan/zoom  
✅ Basic shape creation  
🔄 Real-time Firestore sync (in progress)  
⏳ Cursor tracking  
⏳ Presence system  
⏳ Production deployment  

## MVP Requirements

- [x] Google OAuth authentication
- [x] Canvas with pan/zoom functionality
- [x] Shape creation (rectangles)
- [x] Shape manipulation (drag to move)
- [ ] Real-time shape synchronization
- [ ] Live cursor tracking
- [ ] Presence awareness (online users)
- [ ] State persistence
- [ ] Conflict resolution
- [ ] Production deployment

## Next Steps

1. Integrate Firestore for real-time shape sync
2. Implement cursor tracking system
3. Add user presence indicators
4. Deploy to production
5. Performance testing with multiple users