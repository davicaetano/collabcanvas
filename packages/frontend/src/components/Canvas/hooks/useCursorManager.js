import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { updateCursor, removeCursor, subscribeToCursors } from '../../../utils/firestore';
import { getUserColor } from '../../../utils/colors';
import { useConnectionStatus } from './useConnectionStatus';

/**
 * Central Cursor Manager Hook
 * 
 * This hook is the single source of truth for all cursor-related operations.
 * It manages cursor state, user presence, and Firestore synchronization.
 * 
 * Features:
 * - Manages online users and their cursor positions
 * - Handles cursor updates (throttled)
 * - Manages user presence (join/leave)
 * - Syncs with Firestore in real-time
 * - Only sends cursor updates when connected (prevents queue buildup)
 * 
 * @param {Object} currentUser - Current authenticated user
 * @param {string} sessionId - Unique session ID for this browser tab
 * @returns {Object} Cursor manager API
 */
export const useCursorManager = (currentUser, sessionId) => {
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
  const { isConnected } = useConnectionStatus();
  
  // ==================== STATE ====================
  
  // All cursors from other users (excluding own cursor)
  const [cursors, setCursors] = useState({});
  
  // Online users presence data
  const [onlineUsers, setOnlineUsers] = useState({});
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup logic if needed
    };
  }, []);
  
  // ==================== CURSOR OPERATIONS ====================
  
  // Track last update time for throttling
  const lastUpdateRef = useRef(0);
  const CURSOR_UPDATE_THROTTLE = 50; // ms
  
  /**
   * Track cursor position from stage coordinates
   * Converts stage position to canvas position and updates cursor in Firestore
   * 
   * ONLY sends updates when connected - prevents queue buildup when offline
   * 
   * @param {Object} params - Parameters object
   * @param {Object} params.stageRef - Stage ref
   * @param {number} params.stageX - Stage X offset
   * @param {number} params.stageY - Stage Y offset
   * @param {number} params.stageScale - Stage scale (zoom)
   */
  const trackCursorFromStage = useCallback(({ stageRef, stageX, stageY, stageScale }) => {
    if (!currentUser) return;
    
    // 🚫 Don't send cursor updates when offline
    if (!isConnected) return;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    // Convert stage position to canvas position (accounting for zoom/pan)
    const canvasPos = {
      x: (pos.x - stageX) / stageScale,
      y: (pos.y - stageY) / stageScale,
    };
    
    // Update cursor in Firestore (only when online!)
    updateCursor(currentUser.uid, {
      x: canvasPos.x,
      y: canvasPos.y,
      name: currentUser.displayName,
      color: getUserColor(currentUser.uid),
    });
  }, [currentUser, isConnected]);
  
  /**
   * Track cursor position from canvas coordinates (already converted)
   * Updates cursor in Firestore with throttling for performance
   * 
   * ONLY sends updates when connected - prevents queue buildup when offline
   * 
   * @param {Object} canvasPos - Canvas position {x, y}
   */
  const trackCursorPosition = useCallback((canvasPos) => {
    if (!currentUser) return;
    
    // 🚫 Don't send cursor updates when offline
    if (!isConnected) return;
    
    // Throttle updates for performance
    const now = Date.now();
    if (now - lastUpdateRef.current < CURSOR_UPDATE_THROTTLE) {
      return;
    }
    lastUpdateRef.current = now;
    
    // Update cursor in Firestore (only when online!)
    updateCursor(currentUser.uid, {
      x: canvasPos.x,
      y: canvasPos.y,
      name: currentUser.displayName,
      color: getUserColor(currentUser.uid),
    });
  }, [currentUser, isConnected]);
  
  /**
   * Cleanup cursor data from Firestore
   * Called when user closes window/tab or component unmounts
   */
  const cleanup = useCallback(() => {
    if (!currentUser) return;
    
    removeCursor(currentUser.uid);
  }, [currentUser]);
  
  // ==================== PRESENCE OPERATIONS ====================
  
  // TODO: Implement presence operations (join/leave)
  
  // ==================== FIRESTORE SYNCHRONIZATION ====================
  
  // Track previous cursors to avoid unnecessary updates
  const previousCursorsRef = useRef(null);
  
  // Subscribe to cursors in Firestore
  useEffect(() => {
    if (!currentUser) return;
    
    const unsubscribe = subscribeToCursors((cursorsData) => {
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
    
    return () => {
      unsubscribe();
    };
  }, [currentUser]);
  
  // Handle cleanup when user closes window/tab
  useEffect(() => {
    if (!currentUser) return;
    
    const handleBeforeUnload = () => {
      removeCursor(currentUser.uid);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentUser]);
  
  // ==================== PUBLIC API ====================
  
  // Memoize the returned object to prevent unnecessary re-renders
  return useMemo(() => ({
    // State
    cursors,
    onlineUsers,
    
    // Cursor operations
    trackCursorFromStage,
    trackCursorPosition,
    cleanup,
    
    // TODO: Add presence operations here
  }), [
    cursors,
    onlineUsers,
    trackCursorFromStage,
    trackCursorPosition,
    cleanup,
  ]);
};

