import React, { useState, useEffect, useCallback } from 'react';
import { Menu, ChevronUp } from 'lucide-react';
import Dashboard from './components/Dashboard';
import DataEntryDrawer from './components/DataEntryDrawer';
import { useStore } from './components/store';

/* ============================================================
   TOAST SYSTEM
   ============================================================ */
export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = React.createContext<ToastContextValue>({
  showToast: () => {}
});

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */
export default function App() {
  const { records, fprs, alerts, saveAudit, addFpr, updateFpr, removeAlert, isLoading, apiConnected } = useStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  /* ---- Toast helpers ---- */
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  /* ---- Back-to-top scroll detection ---- */
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ---- Lock body scroll when drawer open ---- */
  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isDrawerOpen]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  /* ---- Wrapped handlers with toast feedback ---- */
  const handleSaveAudit = useCallback(async (record: any) => {
    try {
      await saveAudit(record);
      showToast('✅ Area audit saved successfully', 'success');
    } catch (err) {
      showToast('❌ Failed to save. Please check your connection.', 'error');
    }
  }, [saveAudit, showToast]);

  const handleAddFpr = useCallback(async (fprData: any, alertId?: string) => {
    try {
      await addFpr(fprData, alertId);
      if (alertId) removeAlert(alertId);
      showToast(`📋 FPR assigned to ${fprData.assignPerson}`, 'info');
    } catch (err) {
      showToast('❌ Failed to assign FPR', 'error');
    }
  }, [addFpr, removeAlert, showToast]);

  const handleUpdateFpr = useCallback(async (id: string, updates: any) => {
    try {
      await updateFpr(id, updates);
      if (updates.status === 'CLOSED') {
        showToast('✅ FPR closed successfully', 'success');
      }
    } catch (err) {
      showToast('❌ Failed to update FPR', 'error');
    }
  }, [updateFpr, showToast]);

  const handleRemoveAlert = useCallback((id: string) => {
    removeAlert(id);
  }, [removeAlert]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <div className="min-h-screen bg-[#0d1b2a] text-[#e2e8f0]" style={{ overflowX: 'hidden' }}>

        {/* Toast notifications */}
        <ToastContainer toasts={toasts} />

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #00bcd4', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '16px', color: '#94a3b8', fontSize: '14px' }}>Loading data...</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {/* Dashboard */}
            <Dashboard
              records={records}
              fprs={fprs}
              alerts={alerts}
              onUpdateFpr={handleUpdateFpr}
              onAddFpr={handleAddFpr}
              onRemoveAlert={handleRemoveAlert}
              apiConnected={apiConnected}
            />

        {/* Floating FAB — Data Entry */}
        <button
          id="fab-open-drawer"
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Open Data Entry"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '56px',
            height: '56px',
            borderRadius: '9999px',
            backgroundColor: '#00bcd4',
            color: '#0d1b2a',
            border: 'none',
            cursor: 'pointer',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,188,212,0.4)',
          }}
        >
          <Menu size={26} strokeWidth={2.5} />
        </button>

        {/* Back to Top */}
        <button
          className={`back-to-top ${showBackToTop ? 'visible' : ''}`}
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          <ChevronUp size={20} />
        </button>

        {/* Bottom Sheet Overlay */}
        {isDrawerOpen && (
          <div
            className="fixed inset-0 bg-black/70 z-50"
            style={{ backdropFilter: 'blur(4px)' }}
            onClick={() => setIsDrawerOpen(false)}
          />
        )}

        {/* Bottom Sheet Drawer */}
        <div
          className={`bottom-sheet ${isDrawerOpen ? 'open' : ''}`}
          style={{ zIndex: 60 }}
        >
          <div className="drag-handle" />
          <div style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' as any }}>
            {isDrawerOpen && (
              <DataEntryDrawer
                onClose={() => setIsDrawerOpen(false)}
                onSave={handleSaveAudit}
                onAddFpr={handleAddFpr}
                showToast={showToast}
              />
            )}
          </div>
        </div>

          </>
        )}

      </div>
    </ToastContext.Provider>
  );
}