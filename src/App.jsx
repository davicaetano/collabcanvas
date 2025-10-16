import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Canvas from './components/Canvas';
import TestInputs from './components/Canvas/properties/TestInputs';
import './index.css';

const AppContent = () => {
  const { currentUser, loading } = useAuth();

  // Check for test mode via URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const testMode = urlParams.get('test');

  // Render test page if test=inputs in URL
  if (testMode === 'inputs') {
    return <TestInputs />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return currentUser ? <Canvas /> : <Login />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;