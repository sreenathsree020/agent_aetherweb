import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { WorkflowBuilder } from './pages/WorkflowBuilder';
import { CallHistory } from './pages/CallHistory';
import { GmailIntegration } from './pages/GmailIntegration';
import { WhatsAppIntegration } from './pages/WhatsAppIntegration';
import { DatabaseIntegration } from './pages/DatabaseIntegration';
import { Settings } from './pages/Settings';
import { AuthModal } from './pages/AuthModal';
import { LLMSetupModal } from './components/modals/LLMSetupModal';
import { TelephonySetupModal } from './components/modals/TelephonySetupModal';
import { useThemeStore } from './stores/useThemeStore';

export const App: React.FC = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const { theme } = useThemeStore();

  // Apply theme class to <html>
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <Router>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-main)] font-sans transition-colors duration-150">
        <Navbar onOpenAuth={() => setAuthOpen(true)} />
        
        <div className="flex flex-1 overflow-hidden bg-[var(--bg-app)]">
          <Sidebar />
          
          <main className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] relative">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/builder" element={<WorkflowBuilder />} />
              <Route path="/calls" element={<CallHistory />} />
              <Route path="/addons/database" element={<DatabaseIntegration />} />
              <Route path="/addons/whatsapp" element={<WhatsAppIntegration />} />
              <Route path="/addons/gmail" element={<GmailIntegration />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>

        {/* Global LLM Setup Modal Popup */}
        <LLMSetupModal />

        {/* Global Telephony (Exotel / Twilio) Setup Modal Popup */}
        <TelephonySetupModal />

        {/* Global Auth Modal */}
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    </Router>
  );
};
