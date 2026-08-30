import React, { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Global React Error Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛠️</div>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '0 0 8px 0' }}>
              ระบบกำลังรีสตาร์ทเพื่อความปลอดภัย
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
              ตรวจพบข้อผิดพลาดชั่วคราว ข้อมูลของคุณถูกบันทึกไว้อย่างปลอดภัยแล้ว
            </p>
            {this.state.error && (
              <div style={{
                textAlign: 'left',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '12px',
                margin: '16px 0',
                fontSize: '12px',
                color: '#b91c1c',
                maxHeight: '140px',
                overflowY: 'auto',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap'
              }}>
                <strong>ข้อผิดพลาด:</strong> {this.state.error?.message || String(this.state.error)}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '16px',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)'
                }}
              >
                🔄 รีโหลดหน้าเว็บใหม่
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('flowchart_learning_chapters');
                  localStorage.removeItem('flowchart_classrooms');
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  padding: '12px 20px',
                  borderRadius: '16px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                🧹 ล้างแคชชั่วคราว & เริ่มใหม่
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
)

// Register PWA Service Worker safely
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('ServiceWorker registration error (graceful fallback):', err);
    });
  });
}

