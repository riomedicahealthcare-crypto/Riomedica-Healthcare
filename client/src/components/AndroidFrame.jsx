// client/src/components/AndroidFrame.jsx
import React, { useState, useEffect } from 'react';
import { Smartphone, MonitorPlay } from 'lucide-react';

export default function AndroidFrame({ children }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [time, setTime] = useState('');

  // Update clock in phone status bar
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      minutes = minutes < 10 ? '0' + minutes : minutes;
      setTime(`${hours}:${minutes}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isFullscreen) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#090d16' }}>
        {/* Floating return button in fullscreen */}
        <button
          onClick={() => setIsFullscreen(false)}
          style={{
            position: 'fixed',
            top: '12px',
            right: '12px',
            zIndex: 9999,
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: '600',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Smartphone size={16} /> Exit Fullscreen
        </button>
        {children}
      </div>
    );
  }

  return (
    <div className="device-frame-container">
      <div className="device-frame-header">
        <div>
          <h2>Riomedica Mobile Detailing</h2>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Android Mockup Preview</span>
        </div>
        <button className="btn-toggle-fullscreen" onClick={() => setIsFullscreen(true)}>
          <MonitorPlay size={16} /> Fullscreen Mode
        </button>
      </div>

      <div className="android-phone">
        {/* Notch / Speaker */}
        <div className="phone-notch">
          <div className="phone-camera"></div>
        </div>

        {/* Custom Status Bar */}
        <div
          style={{
            height: '32px',
            background: '#090d16',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 24px',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#fff',
            userSelect: 'none',
            zIndex: 999,
            borderBottom: '1px solid rgba(255,255,255,0.02)'
          }}
        >
          <span>{time}</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Signal SVG */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c-1.2 0-2.4.2-3.6.7L12 18.2l3.6-14.5c-1.2-.5-2.4-.7-3.6-.7m0-2c2 0 4 .5 5.8 1.4L12 23 6.2 2.4C8 1.5 10 1 12 1z" />
            </svg>
            {/* Battery Icon */}
            <div style={{ width: '20px', height: '10px', border: '1px solid #fff', borderRadius: '2px', padding: '1px', position: 'relative' }}>
              <div style={{ width: '100%', height: '100%', background: '#10b981' }}></div>
              <div style={{ width: '2px', height: '4px', background: '#fff', position: 'absolute', right: '-3px', top: '2px' }}></div>
            </div>
          </div>
        </div>

        {/* Render Mobile Client App */}
        <div className="phone-screen">
          {children}
        </div>

        {/* Android Virtual Bottom Navigation Bar */}
        <div
          style={{
            height: '24px',
            background: '#000',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '0 80px',
            zIndex: 999
          }}
        >
          {/* Back Icon */}
          <div style={{ width: '10px', height: '10px', borderLeft: '2px solid #555', borderBottom: '2px solid #555', transform: 'rotate(45deg)' }}></div>
          {/* Home Icon */}
          <div style={{ width: '10px', height: '10px', border: '2px solid #555', borderRadius: '50%' }}></div>
          {/* Recents Icon */}
          <div style={{ width: '10px', height: '10px', border: '2px solid #555', borderRadius: '2px' }}></div>
        </div>
      </div>
    </div>
  );
}
