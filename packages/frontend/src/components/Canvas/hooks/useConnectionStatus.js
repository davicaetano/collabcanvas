import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../utils/firebase';

/**
 * Custom hook to monitor Firestore connection status
 * 
 * Single source of truth for connection state across the app.
 * Uses a real-time listener on the shapes collection to detect connectivity.
 * 
 * States:
 * - Connected: Successfully receiving Firestore updates
 * - Connecting: Initial connection or reconnecting
 * - Disconnected: No connection to Firestore (changes queued locally)
 * 
 * @returns {Object} { isConnected: boolean, isConnecting: boolean }
 * 
 * @example
 * const { isConnected, isConnecting } = useConnectionStatus();
 * 
 * if (isConnected) {
 *   updateCursor(...);  // Only send when online
 * }
 */
export const useConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine); // Browser online status

  useEffect(() => {
    // Listen to browser online/offline events for IMMEDIATE detection
    const handleOnline = () => {
      console.log('[Connection] Browser online');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      console.log('[Connection] Browser offline');
      setIsOnline(false);
      setIsConnected(false); // Immediately mark as disconnected
      setIsConnecting(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen to shapes collection to detect Firestore connectivity
    const shapesRef = collection(db, 'canvases', 'main-canvas', 'shapes');
    
    const unsubscribe = onSnapshot(
      shapesRef,
      (snapshot) => {
        // Successfully received update - we're connected
        // But only if browser is also online
        if (isOnline) {
          setIsConnected(true);
          setIsConnecting(false);
        }
      },
      (error) => {
        // Error receiving update - we're disconnected
        setIsConnected(false);
        setIsConnecting(false);
      }
    );

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, [isOnline]);

  // Final connection status: online AND connected to Firestore
  const finalIsConnected = isOnline && isConnected;

  return { 
    isConnected: finalIsConnected, 
    isConnecting: isOnline && isConnecting 
  };
};

