import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import JournalEditor from './components/JournalEditor';
import JournalFeed from './components/JournalFeed';
import CalendarView from './components/CalendarView';
import AIChatView from './components/AIChatView';
import SearchView from './components/SearchView';
import AnalyticsView from './components/AnalyticsView';
import Toast from './components/Toast';
import { authService } from './services/authService';

export default function App() {
  // Synchronous state initialization for instant session check on page refresh
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Active 10-minute session expiry watcher: checks every 10s if 10 mins have elapsed
    const checkInterval = setInterval(() => {
      const valid = authService.isAuthenticated();
      if (!valid) {
        setIsAuthenticated(false);
        showToast('Session expired after 10 minutes. Please log in again.', 'warning');
      }
    }, 10000);

    return () => clearInterval(checkInterval);
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const handleLoginSuccess = () => {
    authService.setSession('jwt_access_token_valid', '1', 'Journaler');
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
      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Sidebar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setIsEditing(false);
          setActiveTab(tab);
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main style={{ overflowY: 'auto', minHeight: '100vh' }}>
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
      </main>
    </div>
  );
}
