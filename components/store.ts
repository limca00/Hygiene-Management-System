import { useState, useEffect } from 'react';
import { AuditRecord, FPR, PriorityAlert } from '../types';
import { AREAS } from '../constants';

// Storage keys
const AUDIT_STORAGE_KEY = 'auditRecords';
const ALERTS_STORAGE_KEY = 'priorityAlerts';
const FPR_STORAGE_KEY = 'fprTracker';

const API_BASE_URL = 'https://hygiene-management-system.vercel.app';

export function useStore() {
  const [records, setRecords] = useState<AuditRecord[]>(() => {
    const saved = localStorage.getItem(AUDIT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [alerts, setAlerts] = useState<PriorityAlert[]>(() => {
    const saved = localStorage.getItem(ALERTS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [fprs, setFprs] = useState<FPR[]>(() => {
    const saved = localStorage.getItem(FPR_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/audits`)
      .then(res => res.json())
      .then(data => setRecords(data))
      .catch(console.error);
    
    fetch(`${API_BASE_URL}/api/alerts`)
      .then(res => res.json())
      .then(data => setAlerts(data))
      .catch(console.error);
      
    fetch(`${API_BASE_URL}/api/fprs`)
      .then(res => res.json())
      .then(data => setFprs(data))
      .catch(console.error);
  }, []);

  const saveAudit = async (record: AuditRecord) => {
    // Optimistic UI
    setRecords(prev => {
      const existingIdx = prev.findIndex(r => r.date === record.date && r.shift === record.shift);
      let next = [...prev];
      if (existingIdx >= 0) {
        const existingRecord = next[existingIdx];
        const newAreas = [...existingRecord.areas];
        record.areas.forEach(newArea => {
          const areaIdx = newAreas.findIndex(a => a.areaId === newArea.areaId);
          if (areaIdx >= 0) newAreas[areaIdx] = newArea;
          else newAreas.push(newArea);
        });
        next[existingIdx] = { ...existingRecord, areas: newAreas };
      } else {
        next.push(record);
      }
      return next;
    });

    try {
      await fetch(`${API_BASE_URL}/api/audits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
    } catch (err) { console.error('Save audit error', err); }

    const newAlerts: PriorityAlert[] = [];
    record.areas.forEach(areaAudit => {
      const areaDef = AREAS.find(x => x.id === areaAudit.areaId);
      if (!areaDef) return;
      areaAudit.checkpoints.forEach(cp => {
        if (cp.status === 'FAIL' || cp.status === 'PARTIAL') {
          newAlerts.push({
            id: `ALERT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            recordId: record.id,
            areaId: areaAudit.areaId,
            areaName: areaDef.name,
            section: areaDef.section,
            date: record.date,
            shift: record.shift,
            auditor: record.auditor,
            checkpointName: cp.name,
            status: cp.status,
            reason: cp.reason
          });
        }
      });
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts]);
      for (const alert of newAlerts) {
        try {
          await fetch(`${API_BASE_URL}/api/alerts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alert)
          });
        } catch(err) { console.error(err); }
      }
    }
  };

  const removeAlert = async (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    try {
      await fetch(`${API_BASE_URL}/api/alerts/${alertId}`, { method: 'DELETE' });
    } catch (err) { console.error(err); }
  };

  const addFpr = async (fpr: Omit<FPR, 'id' | 'fprId'>) => {
    const newFprId = fprs.length > 0 ? Math.max(...fprs.map(f => f.fprId)) + 1 : 1;
    const newFpr = { ...fpr, id: `FPR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, fprId: newFprId };
    setFprs(prev => [...prev, newFpr]);

    try {
      await fetch(`${API_BASE_URL}/api/fprs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFpr)
      });
    } catch (err) { console.error(err); }
  };

  const updateFpr = async (id: string, updates: Partial<FPR>) => {
    setFprs(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    try {
      await fetch(`${API_BASE_URL}/api/fprs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (err) { console.error(err); }
  };

  return { records, fprs, alerts, saveAudit, addFpr, updateFpr, removeAlert };
}
