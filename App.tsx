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
  const { records, fprs, alerts, saveAudit, addFpr, updateFpr, removeAlert } = useStore();
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
    await saveAudit(record);
    showToast('✅ Area audit saved successfully', 'success');
  }, [saveAudit, showToast]);

  const handleAddFpr = useCallback((fprData: any, alertId?: string) => {
    addFpr(fprData);
    if (alertId) removeAlert(alertId);
    showToast(`📋 FPR assigned to ${fprData.assignPerson}`, 'info');
  }, [addFpr, removeAlert, showToast]);

  const handleUpdateFpr = useCallback((id: string, updates: any) => {
    updateFpr(id, updates);
    if (updates.status === 'CLOSED') {
      showToast('✅ FPR closed successfully', 'success');
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

        {/* Dashboard */}
        <Dashboard
          records={records}
          fprs={fprs}
          alerts={alerts}
          onUpdateFpr={handleUpdateFpr}
          onAddFpr={handleAddFpr}
          onRemoveAlert={handleRemoveAlert}
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

      </div>
    </ToastContext.Provider>
  );
}