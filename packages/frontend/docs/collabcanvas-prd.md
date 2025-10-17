# CollabCanvas MVP - Product Requirements Document

## Project Overview

CollabCanvas is a real-time collaborative design tool that allows multiple users to work together on a shared canvas, creating and manipulating basic shapes with live cursor tracking and presence awareness. This MVP focuses exclusively on establishing rock-solid collaborative infrastructure.

**Timeline**: 24 hours to MVP checkpoint
**Hard Gates**: Must pass ALL MVP requirements to proceed

---

## User Stories

### Primary User: Designer/Collaborator
- As a user, I want to create an account and log in so that I have a persistent identity in the workspace
- As a user, I want to see a large canvas where I can pan and zoom smoothly so that I can navigate my workspace
- As a user, I want to create basic shapes (rectangles, circles, or text) so that I can start designing
- As a user, I want to move shapes around the canvas so that I can arrange my design
- As a user, I want to see other users' cursors with their names in real-time so that I know where they're working
- As a user, I want to see who else is currently online so that I know who I'm collaborating with
- As a user, I want changes I make to appear instantly for other users so that we can work together seamlessly
- As a user, I want to refresh my browser and still see all the work we've done so that nothing gets lost

---

## MVP Key Features

### 1. Authentication System
- Google OAuth sign-in (one-click authentication)
- Persistent user identity (name and photo from Google profile)
- Session management
- Automatic username from Google account

### 2. Canvas Infrastructure
- Large workspace (doesn't need to be infinite, but spacious)
- Smooth pan (click-drag to move viewport)
- Smooth zoom (scroll wheel)
- 60 FPS performance target
- Canvas coordinate system established

### 3. Shape Creation & Manipulation
- At least ONE shape type working perfectly (choose: rectangle, circle, OR text)
- Click-to-create or button-to-create workflow
- Click-and-drag to move shapes
- Shape properties: position (x, y), size, color

### 4. Real-Time Collaboration
- Live cursor positions for all connected users
- Cursor labels showing username
- Shape creation/movement syncs across all clients in <100ms
- Cursor position updates in <50ms
- Presence awareness (online user list)
- Handles 2+ concurrent users editing simultaneously

### 5. Conflict Resolution
- Define and document your approach (last-write-wins is acceptable)
- System doesn't break when two users edit the same object

### 6. State Persistence
- Canvas state saves to backend
- Users can refresh and see the same canvas state
- Handles disconnects gracefully
- State persists even if all users disconnect

### 7. Deployment
- Publicly accessible URL
- Works in multiple browsers simultaneously
- Supports 5+ concurrent users without degradation

---

## Tech Stack

### Frontend
- **React** - UI framework
- **react-konva** - Canvas rendering library
- **Tailwind CSS** - Styling

### Backend
- **Firebase Firestore** - Real-time database and state sync
- **Firebase Auth** - User authentication

### Deployment
- **Vercel** - Frontend hosting

---

## Explicitly NOT in MVP

### Canvas Features
- Multiple shape types (pick ONE for MVP)
- Shape resizing
- Shape rotation
- Multi-select
- Copy/paste
- Undo/redo
- Layer management
- Color picker UI (hardcode a few colors)
- Shape styling beyond solid colors
- Groups/nesting

### Collaboration Features
- Locking/claiming objects
- User permissions
- Comments or chat
- Version history
- User avatars

### AI Features
- Natural language commands
- AI agent manipulation
- Function calling

### Performance
- Support for 1000+ objects (target 500+)
- 10+ concurrent users (target 5+)

### Polish
- Onboarding flow
- Keyboard shortcuts
- Responsive mobile design
- Accessibility features

---

## Critical Pitfalls to Avoid

1. **Overbuilding Before Sync Works** - Don't add multiple shape types until ONE shape syncs perfectly across users

2. **Canvas Performance Issues** - Test with 100+ shapes early. If FPS drops below 30, optimize before adding more features

3. **Network Testing Neglect** - Use Chrome DevTools network throttling. Test with 3-4 browser windows simultaneously

4. **State Management Chaos** - Define your single source of truth immediately and stick to it

5. **Authentication Complexity** - Keep auth simple. Email/password is fine for MVP

6. **Deployment as Afterthought** - Deploy something broken on hour 1. Fix it iteratively

---

## MVP Success Criteria Checklist

- [ ] Two users in different browsers can see each other's cursors
- [ ] One user creates a shape, the other user sees it appear instantly
- [ ] One user moves a shape, the other user sees it move in real-time
- [ ] Users see who else is online
- [ ] User refreshes browser, canvas state persists
- [ ] All users disconnect, canvas state persists
- [ ] Canvas maintains 60 FPS with 100+ objects
- [ ] Publicly deployed and accessible via URL
- [ ] Users have accounts/names
- [ ] Pan and zoom work smoothly

---

## Build Strategy

**Build Vertically - Complete one layer at a time:**

1. Cursor sync
2. Object sync
3. Transformations
4. State persistence

**Remember:** A simple canvas with bulletproof multiplayer beats a feature-rich canvas with broken sync. Focus on making ONE shape sync perfectly before adding anything else.