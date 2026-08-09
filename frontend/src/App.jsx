import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

import { API_BASE_URL } from './config/api';

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  // Check Spring Boot Backend health / connection status
  const checkBackendStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${API_BASE_URL}/api/resumes`, {
        method: "GET",
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        setIsBackendOnline(true);
      } else {
        setIsBackendOnline(false);
      }
    } catch (error) {
      setIsBackendOnline(false);
    }
  };

  useEffect(() => {
    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex antialiased selection:bg-cyan-500 selection:text-slate-950">
        
        {/* Toast Notification Container */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            },
          }}
        />

        {/* Persistent Navigation Sidebar */}
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          isBackendOnline={isBackendOnline}
        />

        {/* Main Application Container */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'pl-20' : 'pl-72'}`}>
          
          {/* Top Header Navbar */}
          <Header
            isBackendOnline={isBackendOnline}
            checkBackendStatus={checkBackendStatus}
          />

          {/* Page Route Views */}
          <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/candidate" element={<CandidateDashboard isBackendOnline={isBackendOnline} />} />
              <Route path="/recruiter" element={<RecruiterDashboard isBackendOnline={isBackendOnline} />} />
              <Route path="/analytics" element={<AnalyticsDashboard isBackendOnline={isBackendOnline} />} />
              <Route path="/" element={<Navigate to="/candidate" replace />} />
              <Route path="*" element={<Navigate to="/candidate" replace />} />
            </Routes>
          </main>

        </div>
      </div>
    </BrowserRouter>
  );
}
