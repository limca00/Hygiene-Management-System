import { useState, useEffect } from 'react';
import { AuditRecord, FPR, PriorityAlert } from '../types';
import { AREAS } from '../constants';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function useStore() {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [alerts, setAlerts] = useState<PriorityAlert[]>([]);
  const [fprs, setFprs] = useState<FPR[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [auditsRes, alertsRes, openFprsRes, closedFprsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/audits`),
          fetch(`${API_BASE_URL}/alerts`),
          fetch(`${API_BASE_URL}/fprs?status=OPEN`),
          fetch(`${API_BASE_URL}/fprs?status=CLOSED&limit=10`),
        ]);

        if (!auditsRes.ok || !alertsRes.ok || !openFprsRes.ok || !closedFprsRes.ok) {
          throw new Error('One or more API requests failed');
        }

        const [auditsData, alertsData, openFprsData, closedFprsData] = await Promise.all([
          auditsRes.json(),
          alertsRes.json(),
          openFprsRes.json(),
          closedFprsRes.json()
        ]);

        setRecords(Array.isArray(auditsData) ? auditsData : []);
        setAlerts(Array.isArray(alertsData) ? alertsData : []);
        
        const openFprs = Array.isArray(openFprsData) ? openFprsData : [];
        const closedFprs = Array.isArray(closedFprsData) ? closedFprsData : [];
        setFprs([...openFprs, ...closedFprs]);
        
        setApiConnected(true);
      } catch (err) {
        console.error('Initial data fetch failed:', err);
        setApiConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const saveAudit = async (record: AuditRecord) => {
    try {
      const response = await fetch(`${API_BASE_URL}/audits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to save. Please check your connection. (${response.status})`);
      }
      
      const savedRecord = await response.json();

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
        for (const alert of newAlerts) {
          const alertResponse = await fetch(`${API_BASE_URL}/alerts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alert)
          });
          if (alertResponse.ok) {
            const savedAlert = await alertResponse.json();
            setAlerts(prev => [...prev, savedAlert]);
          } else {
            console.error('Failed to save alert', alert);
          }
        }
      }
      return savedRecord;
    } catch (err) {
      console.error('Fetch failed:', err);
      throw err;
    }
  };

  const removeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAssigned: true })
      });
      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      console.error('Fetch failed:', err);
    }
  };

  const addFpr = async (fpr: Omit<FPR, 'id' | 'fprId'>) => {
    try {
      const newFprId = fprs.length > 0 ? Math.max(...fprs.map(f => f.fprId)) + 1 : 1;
      const newFpr = { ...fpr, id: `FPR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, fprId: newFprId };
      
      const response = await fetch(`${API_BASE_URL}/fprs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFpr)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`API failed: ${response.status}`);
      }
      
      const savedFpr = await response.json();
      setFprs(prev => [...prev, savedFpr]);
      return savedFpr;
    } catch (err) {
      console.error('Fetch failed:', err);
      throw err;
    }
  };

  const updateFpr = async (id: string, updates: Partial<FPR>) => {
    try {
      let response;
      if (updates.status === 'CLOSED') {
        response = await fetch(`${API_BASE_URL}/fprs/${id}/close`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actionTaken: updates.actionTaken || 'Closed via dashboard' })
        });
      } else {
        response = await fetch(`${API_BASE_URL}/fprs/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`API failed: ${response.status}`);
      }
      
      const updatedFpr = await response.json();
      setFprs(prev => prev.map(f => f.id === id ? { ...f, ...updatedFpr } : f));
      return updatedFpr;
    } catch (err) {
      console.error('Fetch failed:', err);
      throw err;
    }
  };

  return { records, fprs, alerts, saveAudit, addFpr, updateFpr, removeAlert, isLoading, apiConnected };
}
