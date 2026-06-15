// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Smartphone, Shield } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < 768 || !!window.Capacitor
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768 || !!window.Capacitor);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

function MainAppRoutes({ appId }) {
  const isMobile = useIsMobile();

  if (appId === 'com.riomedica.admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
        <Routes>
          <Route path="/" element={<AdminLayout />} />
          <Route path="/index.html" element={<AdminLayout />} />
          <Route path="/admin" element={<AdminLayout />} />
        </Routes>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
        <Routes>
          <Route path="/" element={<MobileApp />} />
          <Route path="/index.html" element={<MobileApp />} />
          <Route path="/admin" element={<AdminLayout />} />
        </Routes>
      </div>
    );
  }

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
          <Route 
            path="/index.html" 
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
  const [appId, setAppId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getAppId() {
      if (window.Capacitor) {
        try {
          const info = await CapApp.getInfo();
          setAppId(info.id);
        } catch (e) {
          console.error("Capacitor App info error:", e);
          setAppId('com.riomedica.healthcare');
        }
      } else {
        setAppId('web');
      }
      setLoading(false);
    }
    getAppId();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0f1e' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(16, 185, 129, 0.1)', borderTop: '4px solid #10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <MainAppRoutes appId={appId} />
    </BrowserRouter>
  );
}
