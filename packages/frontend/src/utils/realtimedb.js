import { ref, set, onValue, onDisconnect, remove } from 'firebase/database';
import { rtdb } from './firebase';

/**
 * Update user presence in Realtime Database with automatic offline detection
 * 
 * This function:
 * 1. Sets up onDisconnect() to mark user as offline when they disconnect
 * 2. Marks user as online immediately
 * 
 * The onDisconnect() action is registered on Firebase servers and will execute
 * automatically when the client disconnects (close tab, internet loss, crash, etc.)
 * 
 * @param {string} userId - User ID
 * @param {Object} userData - User data (name, photo, etc.)
 */
export const updatePresenceWithDisconnect = async (userId, userData) => {
  const presenceRef = ref(rtdb, `presence/${userId}`);
  
  try {
    // 1. Configure what happens when user disconnects (executed by Firebase server)
    await onDisconnect(presenceRef).set({
      ...userData,
      online: false,
      lastSeen: Date.now(),
    });
    
    // 2. Mark user as online now (executed immediately)
    await set(presenceRef, {
      ...userData,
      online: true,
      lastSeen: Date.now(),
    });
    
    console.log('[RTDB] Presence updated with onDisconnect configured');
  } catch (error) {
    console.error('[RTDB] Error updating presence:', error);
  }
};

/**
 * Subscribe to presence changes in real-time
 * 
 * Returns ALL users (including those marked as offline)
 * Filtering should be done in the callback if needed
 * 
 * @param {Function} callback - Called with presence data whenever it changes
 * @returns {Function} Unsubscribe function
 */
export const subscribeToPresence = (callback) => {
  const presenceRef = ref(rtdb, 'presence');
  
  const unsubscribe = onValue(presenceRef, (snapshot) => {
    const users = {};
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      
      // Convert to same format as Firestore for compatibility
      // Pass ALL users (including offline) - filtering happens in callback
      Object.entries(data).forEach(([userId, userData]) => {
        users[userId] = userData;
      });
    }
    
    callback(users);
  }, (error) => {
    console.error('[RTDB] Error subscribing to presence:', error);
    callback({});
  });
  
  // Return unsubscribe function
  return unsubscribe;
};

/**
 * Remove user presence from Realtime Database
 * 
 * @param {string} userId - User ID
 */
export const removePresence = async (userId) => {
  const presenceRef = ref(rtdb, `presence/${userId}`);
  
  try {
    await remove(presenceRef);
    console.log('[RTDB] Presence removed for user:', userId);
  } catch (error) {
    console.error('[RTDB] Error removing presence:', error);
  }
};

/**
 * Cancel onDisconnect for a user (useful when explicitly signing out)
 * 
 * @param {string} userId - User ID
 */
export const cancelDisconnect = async (userId) => {
  const presenceRef = ref(rtdb, `presence/${userId}`);
  
  try {
    await onDisconnect(presenceRef).cancel();
    console.log('[RTDB] onDisconnect cancelled for user:', userId);
  } catch (error) {
    console.error('[RTDB] Error cancelling onDisconnect:', error);
  }
};

