import { useCallback } from 'react';
import { updateCursor } from '../../../utils/firestore';
import { getUserColor } from '../../../utils/colors';
import { CURSOR_UPDATE_THROTTLE } from '../../../utils/canvas';

/**
 * Hook to handle cursor position tracking for multiplayer
 * Tracks and broadcasts cursor position to other users with throttling
 * 
 * @param {Object} currentUser - Current authenticated user
 * @returns {Function} - Cursor tracking function
 */
export const useCursorTracking = (currentUser) => {
  // Track cursor position (throttled for performance)
  const trackCursor = useCallback((canvasPos) => {
    if (!currentUser) return;
    
    const now = Date.now();
    if (now - (trackCursor.lastUpdate || 0) > CURSOR_UPDATE_THROTTLE) {
      updateCursor(currentUser.uid, {
        x: canvasPos.x,
        y: canvasPos.y,
        name: currentUser.displayName,
        color: getUserColor(currentUser.uid),
      });
      trackCursor.lastUpdate = now;
    }
  }, [currentUser]);

  return trackCursor;
};

