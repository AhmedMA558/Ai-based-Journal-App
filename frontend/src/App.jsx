import React, { useState, useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Header from './components/Header';
import AuthView from './components/AuthView';
import CommandPalette from './components/CommandPalette';
import NotificationsDrawer from './components/NotificationsDrawer';
import SettingsModal from './components/SettingsModal';
import AchievementsModal from './components/AchievementsModal';
import Toast from './components/Toast';
import { authService } from './services/authService';

// Lazy Loaded View Components for Dynamic Code Splitting & Performance
const DashboardView = lazy(() => import('./components/DashboardView'));
const JournalEditor = lazy(() => import('./components/JournalEditor'));
const JournalFeed = lazy(() => import('./components/JournalFeed'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const AIChatView = lazy(() => import('./components/AIChatView'));
const SearchView = lazy(() => import('./components/SearchView'));
const AnalyticsView = lazy(() => import('./components/AnalyticsView'));

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);

  // Modals & Drawers state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Global Keyboard Shortcuts (Cmd+K, Cmd+N, Cmd+A, Cmd+J)
  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  // Active 10-Minute Session Expiry Watcher
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const valid = authService.isAuthenticated();
      if (!valid) {
        setIsAuthenticated(false);
        showToast('Session expired after 10 minutes. Please log in again.', 'warning');
      }
    }, 10000);

    return () => clearInterval(checkInterval);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setActiveTab('dashboard');
    showToast('Logged in successfully! 10-Minute Session Active.', 'success');
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    showToast('Logged out.', 'info');
  };

  const handleNewJournal = () => {
    setSelectedJournal(null);
    setIsEditing(true);
  };

  const handleEditJournal = (journal) => {
    setSelectedJournal(journal);
    setIsEditing(true);
  };

  const handleSaveSuccess = () => {
    setIsEditing(false);
    setSelectedJournal(null);
    setActiveTab('journals');
  };

  const handleCommandPaletteAction = (actionId) => {
    if (actionId === 'new-journal') {
      handleNewJournal();
    } else if (actionId === 'ai-chat') {
      setIsEditing(false);
      setActiveTab('ai-chat');
    } else if (actionId === 'journals') {
      setIsEditing(false);
      setActiveTab('journals');
    } else if (actionId === 'calendar') {
      setIsEditing(false);
      setActiveTab('calendar');
    } else if (actionId === 'search') {
      setIsEditing(false);
      setActiveTab('search');
    } else if (actionId === 'analytics') {
      setIsEditing(false);
      setActiveTab('analytics');
    } else if (actionId === 'toggle-theme') {
      toggleTheme();
    } else if (actionId === 'voice-dictation') {
      handleNewJournal();
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <AuthView onLoginSuccess={handleLoginSuccess} />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Global Modals & Drawers */}
      <Toast toast={toast} onClose={() => setToast(null)} />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectAction={handleCommandPaletteAction}
      />
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onMarkAllRead={() => showToast('All notifications marked as read', 'info')}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
      />

      {/* Sidebar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setIsEditing(false);
          setActiveTab(tab);
        }}
        onLogout={handleLogout}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main App Section */}
      <div className="main-wrapper">
        {/* Top Header */}
        <Header
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onToggleTheme={toggleTheme}
          theme={theme}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Dynamic Route Content with Lazy Loading Suspense */}
        <main className="main-content">
          <Suspense fallback={
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-panel skeleton-pulse" style={{ height: '180px', borderRadius: '20px' }}></div>
              <div className="glass-panel skeleton-pulse" style={{ height: '300px', borderRadius: '20px' }}></div>
            </div>
          }>
            {isEditing ? (
              <JournalEditor
                initialData={selectedJournal}
                onClose={() => setIsEditing(false)}
                onSaveSuccess={handleSaveSuccess}
                showToast={showToast}
              />
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <DashboardView
                    onNewJournal={handleNewJournal}
                    onSelectJournal={(journal) => handleEditJournal(journal)}
                    showToast={showToast}
                  />
                )}
                {activeTab === 'journals' && (
                  <JournalFeed
                    onNewJournal={handleNewJournal}
                    onEditJournal={(journal) => handleEditJournal(journal)}
                    showToast={showToast}
                  />
                )}
                {activeTab === 'calendar' && (
                  <CalendarView
                    onSelectJournal={(journal) => handleEditJournal(journal)}
                  />
                )}
                {activeTab === 'ai-chat' && <AIChatView />}
                {activeTab === 'search' && <SearchView />}
                {activeTab === 'analytics' && <AnalyticsView />}
              </>
            )}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
