import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import JournalEditor from './components/JournalEditor';
import JournalFeed from './components/JournalFeed';
import AIChatView from './components/AIChatView';
import SearchView from './components/SearchView';
import AnalyticsView from './components/AnalyticsView';
import { authService } from './services/authService';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Check if token exists in Browser Cookie
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
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
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
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
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                onNewJournal={handleNewJournal}
                onSelectJournal={(journal) => handleEditJournal(journal)}
              />
            )}
            {activeTab === 'journals' && (
              <JournalFeed
                onNewJournal={handleNewJournal}
                onEditJournal={(journal) => handleEditJournal(journal)}
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
