import React, { useState } from 'react';
import { AlertCircle, PlusCircle, X } from 'lucide-react';

export default function PriorityAlertPanel({ items, chronicIssues, onAssignFpr }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [targetItem, setTargetItem] = useState<any>(null);
  const [assignee, setAssignee] = useState('');
  const [date, setDate] = useState('');
  const [assigneeError, setAssigneeError] = useState(false);
  const [dateError, setDateError] = useState(false);

  const openAssignModal = (item: any) => {
    setTargetItem(item);
    setAssignee('');
    setDate('');
    setAssigneeError(false);
    setDateError(false);
    setModalOpen(true);
  };

  const handleAssign = () => {
    const ae = !assignee.trim();
    const de = !date;
    setAssigneeError(ae);
    setDateError(de);
    if (ae || de) return;

    onAssignFpr({
      area: targetItem.areaName,
      section: targetItem.section,
      issue: `${targetItem.checkpointName} - ${targetItem.reason || 'No description provided'}`,
      checkpointStatus: targetItem.status,
      assignPerson: assignee,
      targetDate: date,
      status: 'OPEN',
      actionTaken: '',
      openDate: new Date().toISOString().split('T')[0],
      closeDate: null,
      shift: targetItem.shift,
      auditor: targetItem.auditor,
      date: targetItem.date,
    }, targetItem.id);
    setModalOpen(false);
  };

  return (
    <div style={{ backgroundColor: '#1a2a3a', border: '1px solid #1e3a4a', borderRadius: '14px', padding: '16px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <AlertCircle color="#ef4444" size={22} />
        <h2 style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: 700, flex: 1, margin: 0 }}>
          Priority Alerts
        </h2>
        <span style={{
          backgroundColor: 'rgba(239,68,68,0.15)',
          color: '#ef4444',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '9999px',
          padding: '3px 10px',
          fontSize: '13px',
          fontWeight: 800,
        }}>
          {items.length} Pending
        </span>
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <p className="empty-state-text">No pending issues. All areas are in good shape!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((item: any, idx: number) => {
            const isFail = item.status === 'FAIL';
            const isChronic = chronicIssues.has(`${item.areaId}_${item.checkpointName}`);

            return (
              <div
                key={`${item.recordId}-${item.areaId}-${item.checkpointName}-${idx}`}
                style={{
                  backgroundColor: '#0d1b2a',
                  border: `1px solid ${isFail ? '#ef4444' : '#f59e0b'}`,
                  borderLeft: `4px solid ${isFail ? '#ef4444' : '#f59e0b'}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Line 1: Area + Status badge */}
                <div style={{
                  padding: '12px 14px 10px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '10px',
                  borderBottom: '1px solid #1a2a3a',
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#e2e8f0',
                    margin: 0,
                    flex: 1,
                    wordBreak: 'break-word',
                  }}>
                    {item.areaName}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                    <span className={isFail ? 'badge-fail' : 'badge-partial'}>
                      {item.status}
                    </span>
                    {isChronic && (
                      <span style={{
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '9999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }} className="chronic-badge">
                        🔴 Chronic
                      </span>
                    )}
                  </div>
                </div>

                {/* Line 2: Section + Shift + Date */}
                <div style={{ padding: '8px 14px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', borderBottom: '1px solid #0f1e2e' }}>
                  <span className="badge-section">{item.section}</span>
                  <span className="badge-section">Shift {item.shift}</span>
                  <span style={{ color: '#475569', fontSize: '12px', fontFamily: 'monospace' }}>{item.date}</span>
                </div>

                {/* Line 3: Checkpoint name */}
                <div style={{
                  padding: '8px 14px',
                  backgroundColor: isFail ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)',
                  borderBottom: '1px solid #0f1e2e',
                }}>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: isFail ? '#f87171' : '#fbbf24',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    {isFail ? '❌' : '⚠️'} {item.checkpointName}
                  </p>
                </div>

                {/* Line 4: Issue description */}
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #0f1e2e' }}>
                  <p style={{
                    fontSize: '14px',
                    color: '#94a3b8',
                    lineHeight: '1.6',
                    margin: 0,
                    wordBreak: 'break-word',
                  }}>
                    {item.reason
                      ? `"${item.reason}"`
                      : <span style={{ fontStyle: 'italic', color: '#475569' }}>No specific reason provided by auditor.</span>
                    }
                  </p>
                </div>

                {/* Line 5: Assign FPR button */}
                <div style={{ padding: '10px 14px' }}>
                  <button
                    onClick={() => openAssignModal(item)}
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      backgroundColor: '#00bcd4',
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
                    <PlusCircle size={18} />
                    Assign FPR
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ASSIGN MODAL ── */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 200,
            padding: '0',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div style={{
            backgroundColor: '#0f1e2e',
            border: '1px solid #1a3a4a',
            borderRadius: '20px 20px 0 0',
            padding: '20px 20px 32px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
          }}>
            {/* Handle */}
            <div style={{ width: '40px', height: '4px', backgroundColor: '#334155', borderRadius: '9999px', margin: '0 auto 16px' }} />

            {/* Title */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle color="#00bcd4" size={20} />
                Assign FPR Tracker
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Context */}
            <div style={{
              backgroundColor: '#1a2a3a',
              border: '1px solid #1e3a4a',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '16px',
            }}>
              <p style={{ color: '#64748b', fontSize: '12px', fontFamily: 'monospace', margin: '0 0 4px' }}>
                {targetItem?.areaName}
              </p>
              <p style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                {targetItem?.checkpointName}
              </p>
            </div>

            {/* Assign Person */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Assign Person
              </label>
              <input
                type="text"
                placeholder="e.g. Saikumar"
                value={assignee}
                onChange={e => { setAssignee(e.target.value); setAssigneeError(false); }}
                className={`mobile-input ${assigneeError ? 'input-error' : ''}`}
              />
              {assigneeError && <p className="validation-msg">Please enter the assignee name</p>}
            </div>

            {/* Target Date */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Target Completion Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => { setDate(e.target.value); setDateError(false); }}
                className={`mobile-input ${dateError ? 'input-error' : ''}`}
              />
              {dateError && <p className="validation-msg">Please select a target date</p>}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  flex: 1,
                  minHeight: '48px',
                  backgroundColor: 'transparent',
                  border: '1.5px solid #334155',
                  color: '#94a3b8',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                style={{
                  flex: 2,
                  minHeight: '48px',
                  backgroundColor: '#00bcd4',
                  border: 'none',
                  color: '#0d1b2a',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
