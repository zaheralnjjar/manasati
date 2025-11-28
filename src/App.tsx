import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Shopping from './pages/Shopping';
import Budget from './pages/Budget';
import Worship from './pages/Worship';
import Settings from './pages/Settings';
import Masari from './pages/Masari';
import ErrorBoundary from './components/ErrorBoundary';
import ConfirmDialogProvider from './components/ConfirmDialogProvider';
import VoiceAssistant from './components/voice/VoiceAssistant';

import { useAppStore } from './store/useAppStore';
import { storage } from './utils/storage';
import { autoBackup } from './utils/autoBackup';
import './App.css';

function App() {
  const { currentPage, setCurrentPage, initialize } = useAppStore();
  const [darkMode, setDarkMode] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    // Initialize Auto Backup
    autoBackup.init();

    // Initialize App Store (Settings) - async
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
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

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
