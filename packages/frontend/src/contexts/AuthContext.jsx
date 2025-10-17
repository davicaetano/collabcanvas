import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { auth, googleProvider } from '../utils/firebase';
import { removePresence, removeCursor } from '../utils/firestore';

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
      console.error('Sign-in error:', error.code, error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clean up presence and cursor data before signing out
      if (currentUser) {
        await Promise.all([
          removePresence(currentUser.uid),
          removeCursor(currentUser.uid)
        ]);
      }
      
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If user was signed out (user is null) and we had a previous user, clean up
      if (!user && currentUser) {
        try {
          await Promise.all([
            removePresence(currentUser.uid),
            removeCursor(currentUser.uid)
          ]);
        } catch (error) {
          console.error('Error cleaning up on auth state change:', error);
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
