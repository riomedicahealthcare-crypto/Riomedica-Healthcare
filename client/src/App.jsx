// client/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Smartphone, Shield } from 'lucide-react';
import AndroidFrame from './components/AndroidFrame';
import MobileApp from './components/MobileApp';
import AdminLayout from './components/AdminLayout';

// Switcher Bar that only displays on desktop to switch views easily
function ViewSwitcher() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div
      style={{
        height: '50px',
        background: '#090d16',
        borderBottom: '1px solid #1f2b45',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        color: '#fff',
        zIndex: 1000,
        position: 'sticky',
        top: 0,
        fontFamily: 'var(--font-primary)'
      }}
      className="view-switcher-bar"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.5px' }}>RIOMEDICA HEALTHCARE</span>
        <span style={{ fontSize: '0.65rem', background: '#10b981', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
          DEVELOPER CONSOLE
        </span>
      </div>
      
      <div style={{ display: 'flex', gap: '12px' }}>
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textDecoration: 'none',
            fontSize: '0.8rem',
            fontWeight: '700',
            color: !isAdmin ? '#fff' : '#94a3b8',
            background: !isAdmin ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            border: '1px solid',
            borderColor: !isAdmin ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
            padding: '6px 12px',
            borderRadius: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          <Smartphone size={14} /> Representative App
        </Link>
        <Link
          to="/admin"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textDecoration: 'none',
            fontSize: '0.8rem',
            fontWeight: '700',
            color: isAdmin ? '#fff' : '#94a3b8',
            background: isAdmin ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            border: '1px solid',
            borderColor: isAdmin ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
            padding: '6px 12px',
            borderRadius: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          <Shield size={14} /> Admin Portal
        </Link>
      </div>
    </div>
  );
}

function MainAppRoutes() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ViewSwitcher />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route 
            path="/" 
            element={
              <AndroidFrame>
                <MobileApp />
              </AndroidFrame>
            } 
          />
          <Route path="/admin" element={<AdminLayout />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainAppRoutes />
    </BrowserRouter>
  );
}
