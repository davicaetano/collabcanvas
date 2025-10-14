import { useEffect } from 'react';
import { 
  subscribeToShapes, 
  subscribeToCursors,
  subscribeToPresence,
  updatePresence,
  removePresence,
  removeCursor
} from '../../../utils/firestore';

export const useMultiplayer = (currentUser, setShapes, setCursors, setOnlineUsers) => {
  // Subscribe to real-time data
  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to shapes
    const unsubscribeShapes = subscribeToShapes((shapesData) => {
      setShapes(shapesData);
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
  }, [currentUser, setShapes, setCursors, setOnlineUsers]);

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
