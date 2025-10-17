import { useEffect, useRef } from 'react';
import { 
  subscribeToShapes, 
  subscribeToPresence,
  updatePresence,
  removePresence
} from '../../../utils/firestore';

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
    const unsubscribePresence = subscribeToPresence((presenceData) => {
      // Only update if presence data actually changed (deep comparison)
      const presenceChanged = !previousOnlineUsersRef.current || 
        JSON.stringify(presenceData) !== JSON.stringify(previousOnlineUsersRef.current);
      
      if (presenceChanged) {
        previousOnlineUsersRef.current = presenceData;
        setOnlineUsers(presenceData);
      }
    });

    // Update presence when component mounts
    updatePresence(currentUser.uid, {
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
