import React, { useState, useMemo } from 'react';
import { Archive, FilterX } from 'lucide-react';
import { AuditRecord } from '../../types';
import { AREAS, CHECKPOINTS } from '../../constants';

export default function AuditHistoryTable({ records, selectedSection }: {
  records: AuditRecord[];
  selectedSection: string;
}) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const defaultFrom = thirtyDaysAgo.toISOString().split('T')[0];
  const defaultTo = new Date().toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [selectedAreaId, setSelectedAreaId] = useState('ALL');
  const [failedCheckpointFilter, setFailedCheckpointFilter] = useState('ALL');
  const [shiftFilter, setShiftFilter] = useState<'All' | 'P' | 'Q' | 'R'>('All');

  const validAreas = useMemo(() => AREAS.filter(a => a.section === selectedSection), [selectedSection]);

  const filteredRows = useMemo(() => {
    let rows = records.flatMap(record => {
      return record.areas.map(areaAudit => {
        const areaDef = AREAS.find(x => x.id === areaAudit.areaId);
        const fails = areaAudit.checkpoints.filter(c => c.status === 'FAIL' || c.status === 'PARTIAL');
        return {
          id: `${record.id}_${areaAudit.areaId}`,
          date: record.date,
          shift: record.shift,
          auditor: areaAudit.auditor || record.auditor,
          areaId: areaAudit.areaId,
          areaName: areaDef?.name || 'Unknown',
          section: areaDef?.section || 'Unknown',
          areaScore: areaAudit.areaScore,
          scorePercentage: areaAudit.areaPercentage,
          fails,
        };
      });
    });

    rows = rows.filter(r => r.section === selectedSection);
    rows = rows.filter(r => r.date >= fromDate && r.date <= toDate);
    if (shiftFilter !== 'All') rows = rows.filter(r => r.shift === shiftFilter);
    if (selectedAreaId !== 'ALL') rows = rows.filter(r => r.areaId === selectedAreaId);
    if (failedCheckpointFilter !== 'ALL') {
      rows = rows.filter(r => r.fails.some(f => f.name === failedCheckpointFilter));
    }
    return rows.sort((a, b) => b.date.localeCompare(a.date));
  }, [records, selectedSection, fromDate, toDate, shiftFilter, selectedAreaId, failedCheckpointFilter]);

  const resetFilters = () => {
    setFromDate(defaultFrom);
    setToDate(defaultTo);
    setSelectedAreaId('ALL');
    setFailedCheckpointFilter('ALL');
    setShiftFilter('All');
  };

  const getScoreStyle = (pct: number) => {
    if (pct >= 80) return { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' };
    if (pct >= 60) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' };
    return { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' };
  };

  return (
    <div style={{ backgroundColor: '#1a2a3a', border: '1px solid #1e3a4a', borderRadius: '14px', padding: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '10px' }}>
        <Archive color="#00bcd4" size={22} />
        <h2 style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: 700, flex: 1, margin: 0 }}>Full Audit Records</h2>
        <button
          onClick={resetFilters}
          style={{
            background: 'none',
            border: 'none',
            color: '#475569',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            padding: '4px 8px',
            borderRadius: '6px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <FilterX size={15} /> Reset
        </button>
      </div>

      {/* ── FILTERS ── */}
      <div style={{ backgroundColor: '#0d1b2a', border: '1px solid #1a2a3a', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>

        {/* Date range: side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              From
            </label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="mobile-input" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              To
            </label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="mobile-input" />
          </div>
        </div>

        {/* Shift toggles */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Shift
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {(['All', 'P', 'Q', 'R'] as const).map(s => (
              <button
                key={s}
                onClick={() => setShiftFilter(s)}
                style={{
                  minHeight: '44px',
                  backgroundColor: shiftFilter === s ? '#00bcd4' : '#0d1b2a',
                  color: shiftFilter === s ? '#0d1b2a' : '#94a3b8',
                  border: `1.5px solid ${shiftFilter === s ? '#00bcd4' : '#334155'}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Area dropdown */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Area ({selectedSection})
          </label>
          <select value={selectedAreaId} onChange={e => setSelectedAreaId(e.target.value)} className="mobile-input">
            <option value="ALL">All Areas</option>
            {validAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        {/* Failed checkpoint */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Failed Checkpoint
          </label>
          <select value={failedCheckpointFilter} onChange={e => setFailedCheckpointFilter(e.target.value)} className="mobile-input">
            <option value="ALL">Any (Show All)</option>
            {CHECKPOINTS.map(cp => <option key={cp.name} value={cp.name}>{cp.name}</option>)}
          </select>
        </div>
      </div>

      {/* Results count */}
      <p style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
        {filteredRows.length} record{filteredRows.length !== 1 ? 's' : ''} found
      </p>

      {/* ── CARD LIST ── */}
      {filteredRows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p className="empty-state-text">No audit data found for the selected filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredRows.map(row => {
            const scoreStyle = getScoreStyle(row.scorePercentage);

            return (
              <div key={row.id} className="audit-record-card">
                {/* Row 1: Date + Shift + Auditor */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#64748b' }}>{row.date}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', backgroundColor: '#1a2a3a', padding: '1px 6px', borderRadius: '4px' }}>
                      Shift {row.shift}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{row.auditor}</span>
                  </div>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '13px',
                    fontWeight: 800,
                    border: `1px solid ${scoreStyle.border}`,
                    backgroundColor: scoreStyle.bg,
                    color: scoreStyle.color,
                  }}>
                    {row.scorePercentage.toFixed(1)}%
                    {row.scorePercentage >= 80 ? ' 🟢' : row.scorePercentage >= 60 ? ' 🟡' : ' 🔴'}
                  </span>
                </div>

                {/* Row 2: Area */}
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', margin: '0 0 8px', wordBreak: 'break-word' }}>
                  {row.areaName}
                </p>

                {/* Row 3: Failed checkpoints */}
                {row.fails.length > 0 && (
                  <div style={{ backgroundColor: '#1a2a3a', borderRadius: '8px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px' }}>
                      Issues
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {row.fails.map((f, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: f.status === 'FAIL' ? '#ef4444' : '#f59e0b',
                            wordBreak: 'break-word',
                          }}>
                            {f.status === 'FAIL' ? '❌' : '⚠️'} {f.name}
                          </span>
                          {f.reason && (
                            <span style={{ fontSize: '12px', color: '#475569', paddingLeft: '20px', wordBreak: 'break-word' }}>
                              {f.reason}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {row.fails.length === 0 && (
                  <p style={{ fontSize: '13px', color: '#334155', fontStyle: 'italic' }}>
                    ✅ No failed checkpoints
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
