import { useEffect } from 'react';
import { 
  subscribeToShapes, 
  subscribeToCursors,
  subscribeToPresence,
  updatePresence,
  removePresence,
  removeCursor
} from '../../../utils/firestore';

export const useMultiplayer = (currentUser, setShapes, setCursors, setOnlineUsers, sessionId, isDraggingShape) => {
  // Subscribe to real-time data
  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to shapes
    // During drag, filter out updates from this session to prevent feedback loop
    const unsubscribeShapes = subscribeToShapes((shapesData) => {
      console.log('[MULTIPLAYER] 📥 Shapes update received:', { 
        numShapes: shapesData.length, 
        isDragging: isDraggingShape,
        sessionId 
      });
      
      // If dragging, filter out shapes from this session
      if (isDraggingShape) {
        const filteredShapes = shapesData.filter(shape => shape.sessionId !== sessionId);
        console.log('[MULTIPLAYER] 🔍 Filtering during drag:', { 
          original: shapesData.length, 
          filtered: filteredShapes.length 
        });
        setShapes(filteredShapes);
      } else {
        setShapes(shapesData);
      }
    });

    // Subscribe to cursors
    const unsubscribeCursors = subscribeToCursors((cursorsData) => {
      setCursors(cursorsData);
    });

    // Subscribe to presence
    const unsubscribePresence = subscribeToPresence((presenceData) => {
      setOnlineUsers(presenceData);
    });

    // Update presence when component mounts
    updatePresence(currentUser.uid, {
      name: currentUser.displayName,
      photo: currentUser.photoURL,
    });

    return () => {
      unsubscribeShapes();
      unsubscribeCursors();
      unsubscribePresence();
    };
  }, [currentUser, setShapes, setCursors, setOnlineUsers, sessionId, isDraggingShape]);

  // Handle cleanup when user closes window
  useEffect(() => {
    if (!currentUser) return;

    const handleBeforeUnload = () => {
      removePresence(currentUser.uid);
      removeCursor(currentUser.uid);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentUser]);
};
