import { useEffect, useRef } from 'react';
import { 
  subscribeToShapes
} from '../../../utils/firestore';
import {
  subscribeToPresence,
  updatePresenceWithDisconnect,
  removePresence
} from '../../../utils/realtimedb';

export const useMultiplayer = (currentUser, shapeManager, setOnlineUsers, sessionId, isDraggingShape) => {
  // Keep track of previous data to avoid unnecessary updates
  const previousOnlineUsersRef = useRef(null);
  
  // Extract syncFromFirestore to avoid recreating listener
  const { syncFromFirestore } = shapeManager;
  
  // Subscribe to real-time data
  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to shapes
    // During drag, filter out updates from this session to prevent feedback loop
    const unsubscribeShapes = subscribeToShapes((shapesData) => {
      // If dragging, filter out shapes from this session
      if (isDraggingShape) {
        const filteredShapes = shapesData.filter(shape => shape.sessionId !== sessionId);
        syncFromFirestore(filteredShapes);
      } else {
        syncFromFirestore(shapesData);
      }
    });

    // Subscribe to presence
    const unsubscribePresence = subscribeToPresence((allUsers) => {
      // 1️⃣ Auto-correct: If I'm marked as offline but I'm still running, fix it!
      // This handles the case where user has multiple tabs open and closes one
      if (allUsers[currentUser.uid]?.online === false) {
        console.log('[Presence] Detected self as offline, correcting to online...');
        updatePresenceWithDisconnect(currentUser.uid, {
          name: currentUser.displayName,
          photo: currentUser.photoURL,
        });
      }
      
      // 2️⃣ Filter: only show users that are online (online !== false)
      const onlineUsers = {};
      Object.entries(allUsers).forEach(([userId, userData]) => {
        if (userData.online !== false) {
          onlineUsers[userId] = userData;
        }
      });
      
      // 3️⃣ Only update if presence data actually changed (deep comparison)
      const presenceChanged = !previousOnlineUsersRef.current || 
        JSON.stringify(onlineUsers) !== JSON.stringify(previousOnlineUsersRef.current);
      
      if (presenceChanged) {
        previousOnlineUsersRef.current = onlineUsers;
        setOnlineUsers(onlineUsers);
      }
    });

    // Update presence when component mounts (with onDisconnect)
    updatePresenceWithDisconnect(currentUser.uid, {
      name: currentUser.displayName,
      photo: currentUser.photoURL,
    });

    return () => {
      unsubscribeShapes();
      unsubscribePresence();
    };
  }, [currentUser, syncFromFirestore, setOnlineUsers, sessionId, isDraggingShape]);

  // Handle cleanup when user closes window
  useEffect(() => {
    if (!currentUser) return;

    const handleBeforeUnload = () => {
      removePresence(currentUser.uid);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentUser]);
};
