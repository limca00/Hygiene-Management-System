import React, { useState, useMemo } from 'react';
import { AuditRecord, FPR, PriorityAlert } from '../types';
import { SECTIONS, AREAS, CHECKPOINTS } from '../constants';
import PriorityAlertPanel from './DashboardWidgets/PriorityAlertPanel';
import FPRTracker from './DashboardWidgets/FPRTracker';
import SectionHealthCards from './DashboardWidgets/SectionHealthCards';
import ChartsWidget from './DashboardWidgets/ChartsWidget';
import AuditHistoryTable from './DashboardWidgets/AuditHistoryTable';

interface DashboardProps {
  records: AuditRecord[];
  fprs: FPR[];
  alerts: PriorityAlert[];
  onUpdateFpr: (id: string, updates: Partial<FPR>) => void;
  onAddFpr: (fpr: Omit<FPR, 'id' | 'fprId'>) => void;
  onRemoveAlert: (id: string) => void;
  apiConnected: boolean;
}

export default function Dashboard({ records, fprs, alerts, onUpdateFpr, onAddFpr, onRemoveAlert, apiConnected }: DashboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentShift, setCurrentShift] = useState<'P' | 'Q' | 'R'>('P');
  const [currentSection, setCurrentSection] = useState<any>('BISCUIT');

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  // Filter records for Charts
  const selectedDateRecords = useMemo(() => {
    return records.filter(r => r.date === currentDate);
  }, [records, currentDate]);

  // Section Health
  const sectionHealth = useMemo(() => {
    const health: Record<string, { scoreSum: number, maxSum: number, openFprs: number, areaCount: number, shiftCount: number }> = {};
    const shiftsBySection: Record<string, Set<string>> = {};

    SECTIONS.forEach(s => {
      health[s] = { scoreSum: 0, maxSum: 0, openFprs: 0, areaCount: 0, shiftCount: 0 };
      shiftsBySection[s] = new Set();
    });

    selectedDateRecords.forEach(r => {
      const sectionsInThisRecord = new Set<string>();
      r.areas.forEach(a => {
        const areaDef = AREAS.find(x => x.id === a.areaId);
        if (areaDef) {
          health[areaDef.section].scoreSum += a.areaScore;
          health[areaDef.section].maxSum += areaDef.weightage;
          health[areaDef.section].areaCount++;
          sectionsInThisRecord.add(areaDef.section);
        }
      });
      sectionsInThisRecord.forEach(sect => shiftsBySection[sect].add(r.shift));
    });

    SECTIONS.forEach(s => {
      health[s].shiftCount = shiftsBySection[s].size;
    });

    fprs.filter(f => f.status !== 'CLOSED').forEach(f => {
      if (health[f.section]) {
        health[f.section].openFprs++;
      }
    });

    return health;
  }, [selectedDateRecords, fprs]);

  // Priority Alerts
  const priorityItems = useMemo(() => {
    let filteredItems = alerts.filter(i => i.section === currentSection);
    filteredItems.sort((a, b) => {
      if (a.status === 'FAIL' && b.status === 'PARTIAL') return -1;
      if (a.status === 'PARTIAL' && b.status === 'FAIL') return 1;
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.shift.localeCompare(b.shift);
    });
    return filteredItems;
  }, [alerts, currentSection]);

  // Chronic Issues
  const chronicIssues = useMemo(() => {
    const issues = new Set<string>();
    const sortedRecords = [...records].sort((a, b) => `${a.date}${a.shift}`.localeCompare(`${b.date}${b.shift}`));
    AREAS.forEach(area => {
      CHECKPOINTS.forEach(cp => {
        let consecutiveFails = 0;
        for (const record of sortedRecords) {
          const areaAudit = record.areas.find(a => a.areaId === area.id);
          if (areaAudit) {
            const checkpoint = areaAudit.checkpoints.find(c => c.name === cp.name);
            if (checkpoint && (checkpoint.status === 'FAIL' || checkpoint.status === 'PARTIAL')) {
              consecutiveFails++;
              if (consecutiveFails >= 3) {
                issues.add(`${area.id}_${cp.name}`);
              }
            } else {
              consecutiveFails = 0;
            }
          }
        }
      });
    });
    return issues;
  }, [records]);

  return (
    <div style={{ paddingBottom: '96px' }}>

      {/* ── STICKY HEADER ── */}
      <div className="sticky-header">
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ color: '#00bcd4', fontSize: '18px', fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
                Hygiene Audit System
              </h1>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: apiConnected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${apiConnected ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: apiConnected ? '#22c55e' : '#ef4444'
                }} />
                <span style={{ fontSize: '10px', fontWeight: 600, color: apiConnected ? '#22c55e' : '#ef4444' }}>
                  {apiConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <p style={{ color: '#64748b', fontSize: '12px', margin: 0, marginTop: '2px' }}>
              {today}
            </p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Reset all data? This cannot be undone.')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              border: '1.5px solid #ef4444',
              color: '#ef4444',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Reset DB
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ padding: '16px', maxWidth: '900px', margin: '0 auto' }}>

        {/* ── FILTER BAR ── */}
        <div style={{
          backgroundColor: '#1a2a3a',
          border: '1px solid #1e3a4a',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <h2 style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
            Dashboard Filters
          </h2>

          {/* Date — full width */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Date
            </label>
            <input
              type="date"
              value={currentDate}
              onChange={e => setCurrentDate(e.target.value)}
              className="mobile-input"
            />
          </div>

          {/* Shift — 3 large toggle buttons */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Shift
            </label>
            <div className="shift-toggle-group">
              {(['P', 'Q', 'R'] as const).map(s => (
                <button
                  key={s}
                  className={`shift-toggle-btn ${currentShift === s ? 'active' : ''}`}
                  onClick={() => setCurrentShift(s)}
                >
                  {s} Shift
                </button>
              ))}
            </div>
          </div>

          {/* Section — horizontally scrollable chips */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Section
            </label>
            <div className="section-chips-row">
              {SECTIONS.map(s => (
                <button
                  key={s}
                  className={`section-chip ${currentSection === s ? 'active' : ''}`}
                  onClick={() => setCurrentSection(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="divider" />

        {/* ── SECTION HEALTH CARDS ── */}
        <SectionHealthCards
          health={sectionHealth}
          activeSection={currentSection}
          selectedDate={currentDate}
          onSectionClick={(s: string) => setCurrentSection(s)}
        />

        <div className="divider" style={{ marginTop: '20px' }} />

        {/* ── PRIORITY ALERTS + FPR TRACKER ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <PriorityAlertPanel
            items={priorityItems}
            chronicIssues={chronicIssues}
            onAssignFpr={(fprData: any, alertId: string) => {
              onAddFpr(fprData);
              onRemoveAlert(alertId);
            }}
          />
          <FPRTracker fprs={fprs} onUpdate={onUpdateFpr} selectedSection={currentSection} />
        </div>

        <div className="divider" style={{ marginTop: '20px' }} />

        {/* ── CHARTS ── */}
        <ChartsWidget 
          records={records} 
          selectedDate={currentDate} 
          selectedSection={currentSection} 
        />

        <div className="divider" style={{ marginTop: '20px' }} />

        {/* ── AUDIT HISTORY ── */}
        <AuditHistoryTable records={records} selectedSection={currentSection} />

      </div>
    </div>
  );
}
