import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { auth, googleProvider } from '../utils/firebase';
import { removeCursor } from '../utils/firestore';
import { removePresence, cancelDisconnect } from '../utils/realtimedb';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clean up presence and cursor data before signing out
      if (currentUser) {
        await Promise.all([
          cancelDisconnect(currentUser.uid),  // Cancel onDisconnect before removing
          removePresence(currentUser.uid),     // Remove from Realtime Database
          removeCursor(currentUser.uid)        // Remove from Firestore
        ]);
      }
      
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If user was signed out (user is null) and we had a previous user, clean up
      if (!user && currentUser) {
        try {
          await Promise.all([
            cancelDisconnect(currentUser.uid),  // Cancel onDisconnect before removing
            removePresence(currentUser.uid),     // Remove from Realtime Database
            removeCursor(currentUser.uid)        // Remove from Firestore
          ]);
        } catch (error) {
          // Error cleaning up
        }
      }
      
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const value = {
    currentUser,
    signInWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
