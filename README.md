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
✅ Authentication system (Google OAuth)  
✅ Canvas with pan/zoom functionality  
✅ Basic shape creation and manipulation  
✅ Real-time Firestore synchronization  
✅ Live cursor tracking  
✅ User presence system  
🔄 Production deployment (next step)  
⏳ Performance testing and polish  

## MVP Requirements Checklist

- [x] Google OAuth authentication
- [x] Canvas with pan/zoom functionality  
- [x] Shape creation (rectangles)
- [x] Shape manipulation (drag to move)
- [x] Real-time shape synchronization between users
- [x] Live cursor tracking with user names
- [x] Presence awareness (online users list)
- [x] State persistence via Firestore
- [x] Conflict resolution (last-write-wins via Firestore)
- [ ] Production deployment on Vercel
- [ ] Performance testing with 5+ concurrent users

## Current Features

### ✅ Implemented
- **Authentication**: Google OAuth login/logout
- **Canvas**: Smooth pan (drag) and zoom (scroll wheel) 
- **Shapes**: Click to create rectangles, drag to move
- **Real-time Sync**: All changes appear instantly for other users
- **Live Cursors**: See other users' mouse cursors with names
- **Presence**: View who's online with avatars
- **State Persistence**: Refresh browser, canvas state persists

### 🚀 Ready for Testing
The application is fully functional for the MVP requirements. You can:
1. Set up Firebase credentials
2. Test with multiple browser windows
3. Deploy to Vercel for public access

## Next Steps

### For Production Deployment:
1. **Firebase Setup**: Create Firebase project and add credentials to `.env`
2. **Vercel Deployment**: Push to GitHub and connect to Vercel
3. **Performance Testing**: Test with 5+ concurrent users
4. **Security Rules**: Apply the included `firestore.rules` to Firebase

### Future Enhancements (Post-MVP):
- Multiple shape types (circles, text)
- Shape resizing and rotation
- Color picker for shapes
- Undo/redo functionality
- Shape selection and multi-select
- Export/import canvas data