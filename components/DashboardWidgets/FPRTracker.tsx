import React, { useState } from 'react';
import { ClipboardList, Download, CheckCircle, Clock } from 'lucide-react';
import { FPR } from '../../types';
import * as XLSX from 'xlsx';

export default function FPRTracker({ fprs, onUpdate, selectedSection }: any) {
  const [tab, setTab] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [areaFilter, setAreaFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [actionTexts, setActionTexts] = useState<Record<string, string>>({});
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set());

  const sectionFprs = fprs
    .filter((f: FPR) => f.section === selectedSection)
    .sort((a: FPR, b: FPR) => a.openDate.localeCompare(b.openDate));

  const openFiltered = sectionFprs.filter((f: FPR) => {
    if (f.status === 'CLOSED') return false;
    if (areaFilter && !f.area.toLowerCase().includes(areaFilter.toLowerCase())) return false;
    if (assigneeFilter && !f.assignPerson.toLowerCase().includes(assigneeFilter.toLowerCase())) return false;
    return true;
  });

  const resolvedFprs = sectionFprs
    .filter((f: FPR) => {
      if (f.status !== 'CLOSED') return false;
      if (areaFilter && !f.area.toLowerCase().includes(areaFilter.toLowerCase())) return false;
      if (assigneeFilter && !f.assignPerson.toLowerCase().includes(assigneeFilter.toLowerCase())) return false;
      return true;
    })
    .sort((a: FPR, b: FPR) => (b.closeDate || '').localeCompare(a.closeDate || ''))
    .slice(0, 10);

  const handleActionChange = (id: string, text: string) => {
    setActionTexts(prev => ({ ...prev, [id]: text }));
    const newErrors = new Set(errorIds);
    newErrors.delete(id);
    setErrorIds(newErrors);
  };

  const handleClose = (fpr: FPR) => {
    const text = actionTexts[fpr.id] || fpr.actionTaken;
    if (!text || !text.trim()) {
      const newErrors = new Set(errorIds);
      newErrors.add(fpr.id);
      setErrorIds(newErrors);
      return;
    }
    onUpdate(fpr.id, {
      status: 'CLOSED',
      actionTaken: text.trim(),
      closeDate: new Date().toISOString()
    });
    const newActionTexts = { ...actionTexts };
    delete newActionTexts[fpr.id];
    setActionTexts(newActionTexts);
  };

  const exportExcel = () => {
    const data = sectionFprs.map((fpr: FPR) => ({
      'Serial No': fpr.fprId,
      'Area': fpr.area,
      'Issue': fpr.issue,
      'Assign Person': fpr.assignPerson,
      'Target Date': fpr.targetDate,
      'Status': fpr.status,
      'Action Taken': fpr.actionTaken || '',
      'Open Date': fpr.openDate,
      'Close Date': fpr.closeDate || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'FPRs');
    XLSX.writeFile(wb, `FPR_Tracker_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ backgroundColor: '#1a2a3a', border: '1px solid #1e3a4a', borderRadius: '14px', padding: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <ClipboardList color="#00bcd4" size={22} />
        <h2 style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: 700, flex: 1, margin: 0 }}>FPR Tracker</h2>
      </div>

      {/* Tabs + Export */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'stretch' }}>
        <button
          onClick={() => setTab('OPEN')}
          style={{
            flex: 1,
            minHeight: '48px',
            backgroundColor: tab === 'OPEN' ? '#00bcd4' : '#0d1b2a',
            color: tab === 'OPEN' ? '#0d1b2a' : '#94a3b8',
            border: `1.5px solid ${tab === 'OPEN' ? '#00bcd4' : '#334155'}`,
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <Clock size={16} /> OPEN
        </button>
        <button
          onClick={() => setTab('CLOSED')}
          style={{
            flex: 1,
            minHeight: '48px',
            backgroundColor: tab === 'CLOSED' ? '#00bcd4' : '#0d1b2a',
            color: tab === 'CLOSED' ? '#0d1b2a' : '#94a3b8',
            border: `1.5px solid ${tab === 'CLOSED' ? '#00bcd4' : '#334155'}`,
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <CheckCircle size={16} /> RESOLVED
        </button>
        <button
          onClick={exportExcel}
          style={{
            minWidth: '48px',
            minHeight: '48px',
            backgroundColor: '#0d1b2a',
            border: '1.5px solid #334155',
            color: '#94a3b8',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
          title="Export to Excel"
        >
          <Download size={18} />
        </button>
      </div>

      {/* Filters — stacked vertical */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid #1a2a3a' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Filter by Area
          </label>
          <input
            type="text"
            placeholder="e.g. Scrap Room"
            value={areaFilter}
            onChange={e => setAreaFilter(e.target.value)}
            className="mobile-input"
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Filter by Assigned Person
          </label>
          <input
            type="text"
            placeholder="e.g. Saikumar"
            value={assigneeFilter}
            onChange={e => setAssigneeFilter(e.target.value)}
            className="mobile-input"
          />
        </div>
      </div>

      {/* ── OPEN TAB ── */}
      {tab === 'OPEN' && (
        <div>
          {openFiltered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p className="empty-state-text">No open FPRs for this section.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {openFiltered.map((fpr: FPR) => {
                const isError = errorIds.has(fpr.id);
                const issueParts = fpr.issue.split(' - ');
                const cpName = issueParts[0] || 'Unknown';
                const cpReason = issueParts.slice(1).join(' - ') || '';
                const isOverdue = fpr.targetDate && fpr.targetDate < today;

                return (
                  <div key={fpr.id} className="fpr-card">
                    {/* Card header */}
                    <div className="fpr-card-header">
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#475569', display: 'block', marginBottom: '2px' }}>
                            #{String(fpr.fprId).padStart(3, '0')}
                          </span>
                          <p style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', margin: 0, wordBreak: 'break-word' }}>
                            {fpr.area}
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                          <span className="badge-section">{fpr.section}</span>
                          <span style={{
                            fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
                            backgroundColor: fpr.status === 'IN PROGRESS' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                            color: fpr.status === 'IN PROGRESS' ? '#f59e0b' : '#ef4444',
                          }}>
                            🔴 {fpr.status}
                          </span>
                        </div>
                      </div>

                      {/* Issue */}
                      <div style={{ backgroundColor: '#1a2a3a', borderRadius: '8px', padding: '8px 10px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', margin: '0 0 2px' }}>
                          {cpName}
                        </p>
                        {cpReason && (
                          <p style={{ fontSize: '13px', color: '#64748b', margin: 0, wordBreak: 'break-word' }}>
                            {cpReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="fpr-card-body">
                      {/* Assigned + Target */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '8px' }}>
                        <div>
                          <p style={{ fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 2px' }}>
                            Assigned To
                          </p>
                          <p style={{ fontSize: '14px', fontWeight: 700, color: '#00bcd4', margin: 0 }}>{fpr.assignPerson}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 2px' }}>
                            Target Date
                          </p>
                          <p style={{
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: isOverdue ? '#ef4444' : '#94a3b8',
                            margin: 0,
                          }}>
                            {fpr.targetDate}
                          </p>
                          {isOverdue && (
                            <span className="overdue-label">OVERDUE</span>
                          )}
                        </div>
                      </div>

                      {/* Status selector */}
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Update Status
                        </label>
                        <select
                          value={fpr.status}
                          onChange={e => onUpdate(fpr.id, { status: e.target.value as any })}
                          className="mobile-input"
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="IN PROGRESS">IN PROGRESS</option>
                        </select>
                      </div>

                      {/* Action Taken */}
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Action Taken
                        </label>
                        <textarea
                          placeholder="Describe the action taken to resolve this issue..."
                          value={actionTexts[fpr.id] ?? (fpr.actionTaken || '')}
                          onChange={e => handleActionChange(fpr.id, e.target.value)}
                          className={`mobile-input ${isError ? 'input-error' : ''}`}
                          style={{ minHeight: '100px', resize: 'vertical', lineHeight: '1.5' }}
                        />
                        {isError && (
                          <p className="validation-msg">Please describe the action taken before closing.</p>
                        )}
                      </div>

                      {/* Close Button */}
                      <button
                        onClick={() => handleClose(fpr)}
                        style={{
                          width: '100%',
                          minHeight: '48px',
                          backgroundColor: '#22c55e',
                          color: '#0d1b2a',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '15px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        <CheckCircle size={18} />
                        Close FPR
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── RESOLVED TAB ── */}
      {tab === 'CLOSED' && (
        <div>
          {resolvedFprs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <p className="empty-state-text">No resolved FPRs found for this section.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {resolvedFprs.map((fpr: FPR) => {
                const issueParts = fpr.issue.split(' - ');
                const cpName = issueParts[0] || 'Unknown';
                const cpReason = issueParts.slice(1).join(' - ') || '';
                const closedOn = fpr.closeDate
                  ? new Date(fpr.closeDate).toISOString().split('T')[0]
                  : '-';

                return (
                  <div key={fpr.id} style={{
                    backgroundColor: '#0d1b2a',
                    border: '1px solid #1e3a4a',
                    borderLeft: '4px solid #22c55e',
                    borderRadius: '12px',
                    padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '11px', color: '#475569', fontFamily: 'monospace' }}>#{String(fpr.fprId).padStart(3, '0')}</span>
                        <p style={{ fontSize: '15px', fontWeight: 700, color: '#94a3b8', margin: '2px 0 0', wordBreak: 'break-word' }}>
                          {fpr.area}
                        </p>
                      </div>
                      <span style={{
                        fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px',
                        backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e', flexShrink: 0,
                      }}>
                        ✅ CLOSED
                      </span>
                    </div>

                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', margin: '0 0 2px' }}>{cpName}</p>
                    {cpReason && (
                      <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 8px', wordBreak: 'break-word' }}>{cpReason}</p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        Assigned to: <strong style={{ color: '#94a3b8' }}>{fpr.assignPerson}</strong>
                      </span>
                      <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#475569' }}>
                        Closed: {closedOn}
                      </span>
                    </div>

                    {fpr.actionTaken && (
                      <div style={{ backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', padding: '10px 12px' }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#22c55e', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Action Taken
                        </p>
                        <p style={{ fontSize: '14px', color: '#4ade80', margin: 0, wordBreak: 'break-word', lineHeight: '1.5' }}>
                          "{fpr.actionTaken}"
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
