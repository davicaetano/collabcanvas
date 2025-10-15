# CollabCanvas MVP - Task List

## Phase 0: Setup & Configuration (1-2 hours)

### Project Initialization
- [ ] Create React app with Vite or Create React App
- [ ] Install dependencies (react-konva, konva, firebase, tailwindcss)
- [ ] Setup Tailwind CSS configuration
- [ ] Create basic project structure (components, hooks, utils folders)

### Firebase Setup
- [ ] Create Firebase project in console
- [ ] Enable Firestore Database
- [ ] Enable Firebase Authentication
- [ ] Enable Google OAuth provider in Authentication
- [ ] Copy Firebase config credentials
- [ ] Create Firebase initialization file in project
- [ ] Setup Firestore security rules (basic rules for authenticated users)

### Deployment Setup
- [ ] Create GitHub repository
- [ ] Push initial commit
- [ ] Create Vercel account (if needed)
- [ ] Connect Vercel to GitHub repo
- [ ] Configure environment variables in Vercel
- [ ] Deploy initial "Hello World" version
- [ ] Verify deployment works

---

## Phase 1: Authentication (2-3 hours)

### Google Auth Implementation
- [ ] Create Login page component
- [ ] Implement "Sign in with Google" button
- [ ] Setup Firebase signInWithPopup with GoogleAuthProvider
- [ ] Create AuthContext for managing user state
- [ ] Implement auth state listener (onAuthStateChanged)
- [ ] Create ProtectedRoute wrapper component
- [ ] Add sign out functionality
- [ ] Store user info (name, photo, uid) in state

### UI for Auth
- [ ] Create simple login page UI
- [ ] Add user info display in header (name + photo)
- [ ] Add "Sign Out" button
- [ ] Test login/logout flow in browser
- [ ] Deploy and test authentication on production URL

---

## Phase 2: Basic Canvas (2-3 hours)

### Canvas Setup
- [ ] Create Canvas component with react-konva Stage and Layer
- [ ] Setup canvas size (large workspace, e.g., 3000x3000)
- [ ] Implement viewport state (x, y, scale)
- [ ] Add pan functionality (click-drag on empty space)
- [ ] Add zoom functionality (mouse wheel)
- [ ] Add visual grid or background
- [ ] Test pan/zoom performance (should be smooth)

### Shape Creation
- [ ] Choose ONE shape type (rectangle recommended for simplicity)
- [ ] Create Shape component (react-konva Rect/Circle/Text)
- [ ] Add "Create Shape" button in toolbar
- [ ] Implement click-to-create shape at cursor position
- [ ] Generate unique IDs for each shape
- [ ] Store shapes in local state array
- [ ] Render all shapes on canvas

### Shape Manipulation
- [ ] Make shapes draggable (Konva draggable prop)
- [ ] Update shape position in state on dragEnd
- [ ] Add visual feedback on hover (cursor change)
- [ ] Test creating 10+ shapes and moving them
- [ ] Verify 60 FPS with 100+ shapes (test performance)

---

## Phase 3: Firestore Integration (2-3 hours)

### Firestore Collections Setup
- [ ] Design Firestore data structure:
  - `canvases/{canvasId}/shapes/{shapeId}`
  - `canvases/{canvasId}/cursors/{userId}`
  - `canvases/{canvasId}/presence/{userId}`
- [ ] Create default canvas or canvas selection logic
- [ ] Implement function to save shape to Firestore
- [ ] Implement function to update shape in Firestore
- [ ] Implement function to delete shape from Firestore

### Real-time Shape Sync
- [ ] Setup Firestore real-time listener for shapes collection
- [ ] Update local state when shapes change in Firestore
- [ ] Implement onCreate: save to Firestore + update local state
- [ ] Implement onDrag: update Firestore on dragEnd
- [ ] Handle shape updates from other users
- [ ] Test with 2 browser windows - create shape in one, see in other
- [ ] Verify sync latency (<100ms)

### State Persistence
- [ ] Load all shapes from Firestore on canvas mount
- [ ] Test: refresh browser, shapes should persist
- [ ] Test: close all browsers, reopen, shapes should persist
- [ ] Handle loading state (spinner while fetching shapes)

---

## Phase 4: Multiplayer Cursors (2-3 hours)

### Cursor Tracking
- [ ] Create Cursor component (react-konva Group with Circle + Text)
- [ ] Track local mouse position on canvas
- [ ] Convert screen coordinates to canvas coordinates
- [ ] Debounce/throttle cursor updates (update every ~50ms)
- [ ] Save cursor position to Firestore `cursors/{userId}`
- [ ] Include user name and color in cursor data

### Render Other Users' Cursors
- [ ] Setup real-time listener for cursors collection
- [ ] Filter out current user's cursor
- [ ] Render cursor components for other users
- [ ] Display username label next to cursor
- [ ] Assign unique colors to each user
- [ ] Test with 2+ browser windows - see all cursors moving
- [ ] Verify cursor latency (<50ms)

### Cursor Cleanup
- [ ] Remove cursor from Firestore on user disconnect
- [ ] Use Firestore onDisconnect() or cleanup in useEffect
- [ ] Handle stale cursors (remove after timeout)

---

## Phase 5: Presence System (1-2 hours)

### Online Users List
- [ ] Create presence document for each user on join
- [ ] Store: userId, userName, userPhoto, timestamp
- [ ] Setup real-time listener for presence collection
- [ ] Display online users list in UI (sidebar or header)
- [ ] Show user avatars and names
- [ ] Show count of online users

### Presence Management
- [ ] Update presence timestamp on activity (heartbeat)
- [ ] Remove presence on disconnect
- [ ] Handle browser close/refresh gracefully
- [ ] Test: open 3+ browsers, verify all appear in presence list
- [ ] Test: close browser, verify user removed from list

---

## Phase 6: Conflict Resolution & Polish (1-2 hours)

### Conflict Handling
- [ ] Document conflict resolution strategy (last-write-wins)
- [ ] Test: 2 users move same shape simultaneously
- [ ] Verify no crashes or broken state
- [ ] Add optimistic updates for better UX (update local state immediately)

### Performance Testing
- [ ] Create 100+ shapes programmatically
- [ ] Test pan/zoom performance (should maintain 60 FPS)
- [ ] Test with 5 concurrent users
- [ ] Use Chrome DevTools Performance tab
- [ ] Optimize if needed (memoization, virtualization)

### UI Polish
- [ ] Add simple toolbar with create button
- [ ] Add color options (3-5 hardcoded colors)
- [ ] Add basic styling with Tailwind
- [ ] Add loading states
- [ ] Add error handling (Firebase errors)
- [ ] Improve visual feedback (selected state, hover effects)

---

## Phase 7: Final Testing & Deployment (1-2 hours)

### Testing Scenarios
- [ ] Test: 2 users in different browsers editing simultaneously
- [ ] Test: User A creates shape, User B sees it instantly
- [ ] Test: User A moves shape, User B sees movement in real-time
- [ ] Test: User refreshes mid-edit, canvas state persists
- [ ] Test: All users disconnect, reconnect, work still there
- [ ] Test: Create/move shapes rapidly, verify sync performance
- [ ] Test: Network throttling (Chrome DevTools)

### Pre-submission Checklist
- [ ] Verify all MVP requirements are met (check PRD)
- [ ] Test authentication flow end-to-end
- [ ] Test on production URL (not just localhost)
- [ ] Verify 5+ concurrent users work without issues
- [ ] Check console for errors
- [ ] Verify mobile responsiveness (basic check)

### Documentation
- [ ] Update README with setup instructions
- [ ] Add deployed URL to README
- [ ] Document architecture decisions
- [ ] Add screenshots/GIFs to README
- [ ] Document conflict resolution approach

### Final Deployment
- [ ] Commit and push all changes
- [ ] Verify Vercel auto-deploys
- [ ] Test production URL one final time
- [ ] Share URL with team/evaluators

---

## Emergency Debugging Tasks (Use if needed)

### If Real-time Sync Breaks
- [ ] Check Firestore security rules
- [ ] Verify Firebase listeners are attached
- [ ] Check browser console for errors
- [ ] Verify Firestore collections/documents structure
- [ ] Test with Firebase Emulator locally

### If Performance Issues
- [ ] Reduce shape count for testing
- [ ] Check for unnecessary re-renders (React DevTools)
- [ ] Verify only changed shapes re-render
- [ ] Simplify shape rendering
- [ ] Remove animations if needed

### If Auth Issues
- [ ] Verify Google OAuth is enabled in Firebase Console
- [ ] Check authorized domains in Firebase
- [ ] Verify Firebase config is correct
- [ ] Test in incognito window
- [ ] Clear cookies and try again

---

## Time Allocation Guide

- **Setup**: 1-2 hours
- **Authentication**: 2-3 hours
- **Basic Canvas**: 2-3 hours
- **Firestore Integration**: 2-3 hours
- **Multiplayer Cursors**: 2-3 hours
- **Presence System**: 1-2 hours
- **Polish & Testing**: 2-3 hours

**Total: 12-19 hours** (leaves buffer for debugging)

---

## Priority Order (If Running Out of Time)

1. **CRITICAL**: Cursor sync + Object sync (core multiplayer)
2. **CRITICAL**: State persistence
3. **HIGH**: Presence awareness
4. **MEDIUM**: UI polish
5. **LOW**: Multiple colors, extra features

**Remember**: A simple canvas with bulletproof multiplayer beats a feature-rich canvas with broken sync!