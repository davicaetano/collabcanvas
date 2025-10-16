import { useEffect, useRef } from 'react';
import { 
  subscribeToShapes, 
  subscribeToCursors,
  subscribeToPresence,
  updatePresence,
  removePresence,
  removeCursor
} from '../../../utils/firestore';

export const useMultiplayer = (currentUser, setShapes, setCursors, setOnlineUsers, sessionId, isDraggingShape) => {
  // Keep track of previous data to avoid unnecessary updates
  const previousCursorsRef = useRef(null);
  const previousOnlineUsersRef = useRef(null);
  
  // Subscribe to real-time data
  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to shapes
    // During drag, filter out updates from this session to prevent feedback loop
    const unsubscribeShapes = subscribeToShapes((shapesData) => {
      // If dragging, filter out shapes from this session
      if (isDraggingShape) {
        const filteredShapes = shapesData.filter(shape => shape.sessionId !== sessionId);
        setShapes(filteredShapes);
      } else {
        setShapes(shapesData);
      }
    });

    // Subscribe to cursors (filter out own cursor to prevent unnecessary re-renders)
    const unsubscribeCursors = subscribeToCursors((cursorsData) => {
      // Remove own cursor from the data - we don't need to see our own cursor!
      const { [currentUser.uid]: _, ...otherCursors } = cursorsData;
      
      // Only update if cursors actually changed (deep comparison)
      // This prevents re-renders when Firestore sends duplicate data
      const cursorsChanged = !previousCursorsRef.current || 
        JSON.stringify(otherCursors) !== JSON.stringify(previousCursorsRef.current);
      
      if (cursorsChanged) {
        previousCursorsRef.current = otherCursors;
        setCursors(otherCursors);
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
