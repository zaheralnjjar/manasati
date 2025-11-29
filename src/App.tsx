import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Shopping from './pages/Shopping';
import Budget from './pages/Budget';
import Worship from './pages/Worship';
import Settings from './pages/Settings';
import Masari from './pages/Masari';
import Development from './pages/Development';
import ErrorBoundary from './components/ErrorBoundary';
import ConfirmDialogProvider from './components/ConfirmDialogProvider';
import VoiceAssistant from './components/voice/VoiceAssistant';
import AuthPage from './components/auth/AuthPage'; // Import AuthPage

import { useAppStore } from './store/useAppStore';
import { useMasariStore } from './store/useMasariStore';
import { storage } from './utils/storage';
import { autoBackup } from './utils/autoBackup';
import './App.css';
import { Loader2 } from 'lucide-react';

function App() {
  const { currentPage, setCurrentPage, initialize, session, isLoading } = useAppStore();
  const [darkMode, setDarkMode] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    // Initialize Auto Backup
    autoBackup.init();

    // Initialize App Store (Settings & Auth) - async
    initialize();

    const savedDarkMode = storage.get<boolean>('darkMode');
    if (savedDarkMode !== null) setDarkMode(savedDarkMode);
  }, []);

  useEffect(() => {
    storage.set('darkMode', darkMode);

    // Apply dark mode class to html element
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Global Location Tracking
  const { updateLocation } = useMasariStore();

  useEffect(() => {
    if (!navigator.geolocation) return;

    // Get initial position immediately
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation({
          id: Date.now().toString() + Math.random().toString(36).substring(2),
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp,
          speed: position.coords.speed || 0,
          heading: position.coords.heading || 0,
          accuracy: position.coords.accuracy
        });
      },
      (error) => console.error('Error getting initial position:', error),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        updateLocation({
          id: Date.now().toString() + Math.random().toString(36).substring(2),
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp,
          speed: position.coords.speed || 0,
          heading: position.coords.heading || 0,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.error('Error watching position:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 1000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);



  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'prayer':
        return <Worship />;
      case 'tasks':
        return <Tasks />;
      case 'shopping':
        return <Shopping />;
      case 'budget':
        return <Budget />;
      case 'settings':
        return <Settings />;
      case 'worship':
        return <Worship />;
      case 'masari':
        return <Masari />;
      case 'development':
        return <Development />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-500" size={48} />
      </div>
    );
  }

  if (!session && !useAppStore.getState().isGuest) {
    return <AuthPage />;
  }

  return (
    <Layout
      darkMode={darkMode}
      onToggleDarkMode={handleToggleDarkMode}
    >
      <ErrorBoundary>
        {renderPage()}
      </ErrorBoundary>
      <ConfirmDialogProvider />
      <VoiceAssistant />
    </Layout>
  );
}

export default App;
