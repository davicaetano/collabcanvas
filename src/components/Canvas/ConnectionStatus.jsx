import React, { useState, useEffect } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../../utils/firebase';

/**
 * ConnectionStatus Component
 * 
 * Displays a small indicator showing Firestore connection status.
 * Useful for testing offline persistence and debugging sync issues.
 * 
 * States:
 * - Connected (green): Firestore is online and syncing
 * - Disconnected (red): Firestore is offline (changes queued locally)
 * - Connecting (yellow): Initial connection or reconnecting
 */
const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    // Monitor connection by listening to the shapes collection
    // Successful snapshots indicate connection is working
    let timeoutId;
    let lastUpdate = Date.now();
    
    const unsubscribe = onSnapshot(
      collection(db, 'canvases', 'main-canvas', 'shapes'),
      () => {
        // Successful snapshot = connected
        lastUpdate = Date.now();
        setIsConnected(true);
        setIsConnecting(false);
      },
      (error) => {
        // Error = likely disconnected
        console.warn('Firestore connection issue:', error);
        setIsConnected(false);
        setIsConnecting(false);
      }
    );

    // Check connection every 5 seconds
    const intervalId = setInterval(() => {
      const timeSinceLastUpdate = Date.now() - lastUpdate;
      if (timeSinceLastUpdate > 30000) {
        // No updates for 30 seconds, might be disconnected
        setIsConnecting(true);
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, []);

  // Don't render anything in production (optional)
  // Uncomment the line below to hide in production
  // if (import.meta.env.PROD) return null;

  const getStatusColor = () => {
    if (isConnecting) return 'bg-yellow-500';
    return isConnected ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    return isConnected ? 'Online' : 'Offline';
  };

  const getStatusIcon = () => {
    if (isConnecting) return '⏳';
    return isConnected ? '●' : '○';
  };

  return (
    <div 
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/90 border border-gray-700 shadow-lg backdrop-blur-sm"
      title={`Firestore Status: ${getStatusText()}`}
    >
      <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
      <span className="text-xs text-gray-300 font-medium">
        {getStatusIcon()} {getStatusText()}
      </span>
    </div>
  );
};

export default ConnectionStatus;

