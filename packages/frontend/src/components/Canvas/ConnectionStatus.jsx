import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../utils/firebase';

/**
 * ConnectionStatus Component
 * 
 * Displays a small indicator showing Firestore connection status.
 * Uses a real-time listener on the shapes collection to detect connectivity.
 * 
 * States:
 * - Connected (green): Successfully receiving Firestore updates
 * - Connecting (yellow): Initial connection or reconnecting
 * - Disconnected (red): No connection to Firestore (changes queued locally)
 */
const ConnectionStatus = React.memo(() => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    setIsConnecting(true);
    
    // Listen to shapes collection to detect Firestore connectivity
    const shapesRef = collection(db, 'canvases', 'main-canvas', 'shapes');
    const unsubscribe = onSnapshot(
      shapesRef,
      (snapshot) => {
        setIsConnected(true);
        setIsConnecting(false);
      },
      (error) => {
        setIsConnected(false);
        setIsConnecting(false);
      }
    );

    return () => {
      unsubscribe();
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
    if (isConnecting) return 'Connecting';
    return isConnected ? 'Connected' : 'Disconnected';
  };

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700/80 border border-gray-600"
      title={`Firestore Status: ${getStatusText()}`}
    >
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-xs text-gray-300 font-medium">
        {getStatusText()}
      </span>
    </div>
  );
});

ConnectionStatus.displayName = 'ConnectionStatus';

export default ConnectionStatus;
