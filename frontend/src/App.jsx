import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Header from './components/Header';
import AuthView from './components/AuthView';
import CommandPalette from './components/CommandPalette';
import NotificationsDrawer from './components/NotificationsDrawer';
import SettingsModal from './components/SettingsModal';
import AchievementsModal from './components/AchievementsModal';
import Toast from './components/Toast';
import { authService } from './services/authService';
import { journalService } from './services/journalService';

function EditJournalRoute({ onSaveSuccess, showToast }) {
  const { journalId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(location.state?.journal ?? null);
  const [loading, setLoading] = useState(!location.state?.journal);

  useEffect(() => {
    if (location.state?.journal) return;
    let cancelled = false;
    journalService.getJournalById(journalId)
      .then((res) => {
        if (!cancelled) setInitialData(res?.data?.data ?? null);
      })
      .catch(() => {
        showToast('Could not load that journal entry.', 'error');
        navigate('/journals', { replace: true });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalId]);

  if (loading) return null;
  return (
    <JournalEditor
      initialData={initialData}
      onClose={() => navigate('/journals')}
      onSaveSuccess={onSaveSuccess}
      showToast={showToast}
    />
  );
}

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
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

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
        showToast('Session expired. Please log in again.', 'warning');
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
    navigate('/dashboard');
    showToast('Logged in successfully!', 'success');
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    showToast('Logged out.', 'info');
  };

  const handleNewJournal = () => {
    navigate('/journals/new');
  };

  const handleEditJournal = (journal) => {
    navigate(`/journals/${journal.id}/edit`, { state: { journal } });
  };

  const handleSaveSuccess = () => {
    navigate('/journals');
  };

  const handleCommandPaletteAction = (actionId) => {
    if (actionId === 'new-journal') {
      handleNewJournal();
    } else if (actionId === 'ai-chat') {
      navigate('/ai-chat');
    } else if (actionId === 'journals') {
      navigate('/journals');
    } else if (actionId === 'calendar') {
      navigate('/calendar');
    } else if (actionId === 'search') {
      navigate('/search');
    } else if (actionId === 'analytics') {
      navigate('/analytics');
    } else if (actionId === 'toggle-theme') {
      toggleTheme();
    } else if (actionId === 'voice-dictation') {
      handleNewJournal();
    }
  };

  const activeTab = location.pathname.startsWith('/journals') ? 'journals' : location.pathname.slice(1) || 'dashboard';

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
        setActiveTab={(tab) => navigate(`/${tab}`)}
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
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <DashboardView
                    onNewJournal={handleNewJournal}
                    onSelectJournal={(journal) => handleEditJournal(journal)}
                    showToast={showToast}
                  />
                }
              />
              <Route
                path="/journals"
                element={
                  <JournalFeed
                    onNewJournal={handleNewJournal}
                    onEditJournal={(journal) => handleEditJournal(journal)}
                    showToast={showToast}
                  />
                }
              />
              <Route
                path="/journals/new"
                element={
                  <JournalEditor
                    initialData={null}
                    onClose={() => navigate('/journals')}
                    onSaveSuccess={handleSaveSuccess}
                    showToast={showToast}
                  />
                }
              />
              <Route
                path="/journals/:journalId/edit"
                element={<EditJournalRoute onSaveSuccess={handleSaveSuccess} showToast={showToast} />}
              />
              <Route
                path="/calendar"
                element={<CalendarView onSelectJournal={(journal) => handleEditJournal(journal)} />}
              />
              <Route path="/ai-chat" element={<AIChatView />} />
              <Route path="/search" element={<SearchView />} />
              <Route path="/analytics" element={<AnalyticsView />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
