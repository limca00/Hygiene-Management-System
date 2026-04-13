import React, { useState, useMemo } from 'react';
import { ArrowLeft, CheckCircle2, ChevronRight } from 'lucide-react';
import { SECTIONS, AREAS, CHECKPOINTS } from '../constants';
import { SectionName, CheckpointResult, AreaAudit, CheckpointStatus } from '../types';

interface GeneralInfo {
  date: string;
  shift: 'P' | 'Q' | 'R';
  auditor: string;
}

interface Props {
  onClose: () => void;
  onSave: (record: any) => void;
  onAddFpr: (fprData: any) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

/* Track which areas have been completed this session */
const areaCompletedInSession = new Set<string>();

export default function DataEntryDrawer({ onClose, onSave, onAddFpr, showToast }: Props) {
  const [step, setStep] = useState(1);
  const [info, setInfo] = useState<GeneralInfo>({
    date: new Date().toISOString().split('T')[0],
    shift: 'P',
    auditor: '',
  });

  const [selectedSection, setSelectedSection] = useState<SectionName | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [checkpoints, setCheckpoints] = useState<CheckpointResult[]>(
    CHECKPOINTS.map(c => ({ name: c.name, status: null }))
  );

  // Inline validation errors
  const [infoErrors, setInfoErrors] = useState({ date: false, auditor: false });
  const [cpErrors, setCpErrors] = useState<boolean[]>(CHECKPOINTS.map(() => false));
  const [reasonErrors, setReasonErrors] = useState<boolean[]>(CHECKPOINTS.map(() => false));
  const [completedAreas, setCompletedAreas] = useState<Set<string>>(new Set());

  const currentArea = useMemo(() => AREAS.find(a => a.id === selectedAreaId), [selectedAreaId]);
  const sectionAreas = useMemo(() => AREAS.filter(a => a.section === selectedSection), [selectedSection]);

  // Compute live score
  const liveScore = useMemo(() => {
    if (!currentArea) return { score: 0, max: 0, percentage: 0 };
    let score = 0;
    checkpoints.forEach(cp => {
      const weight = CHECKPOINTS.find(c => c.name === cp.name)?.weightage || 0;
      if (cp.status === 'PASS') score += 1.0 * weight * currentArea.weightage;
      if (cp.status === 'PARTIAL') score += 0.5 * weight * currentArea.weightage;
    });
    const percentage = currentArea.weightage > 0 ? (score / currentArea.weightage) * 100 : 0;
    return { score, max: currentArea.weightage, percentage };
  }, [checkpoints, currentArea]);

  const scoreColor = liveScore.percentage >= 80
    ? '#22c55e'
    : liveScore.percentage >= 60
      ? '#f59e0b'
      : '#ef4444';

  /* ── STEP 1: Validate and advance ── */
  const handleNextStep1 = () => {
    const errors = {
      date: !info.date,
      auditor: !info.auditor.trim(),
    };
    setInfoErrors(errors);
    if (errors.date || errors.auditor) return;
    setStep(2);
  };

  /* ── STEP 2: Pick section → step 3 ── */
  const handleSelectSection = (section: SectionName) => {
    setSelectedSection(section);
    setStep(3);
  };

  /* ── STEP 3: Pick area → step 4 ── */
  const handleSelectArea = (areaId: string) => {
    setSelectedAreaId(areaId);
    setCheckpoints(CHECKPOINTS.map(c => ({ name: c.name, status: null })));
    setCpErrors(CHECKPOINTS.map(() => false));
    setReasonErrors(CHECKPOINTS.map(() => false));
    setStep(4);
  };

  /* ── Checkpoint handlers ── */
  const handleCheckpointStatus = (idx: number, status: CheckpointStatus) => {
    const newCp = [...checkpoints];
    newCp[idx].status = status;
    if (status === 'PASS') newCp[idx].reason = '';
    setCheckpoints(newCp);
    const newCpErrors = [...cpErrors];
    newCpErrors[idx] = false;
    setCpErrors(newCpErrors);
    const newReasonErrors = [...reasonErrors];
    if (status === 'PASS') newReasonErrors[idx] = false;
    setReasonErrors(newReasonErrors);
  };

  const handleCheckpointReason = (idx: number, reason: string) => {
    const newCp = [...checkpoints];
    newCp[idx].reason = reason;
    setCheckpoints(newCp);
    if (reason.trim()) {
      const newReasonErrors = [...reasonErrors];
      newReasonErrors[idx] = false;
      setReasonErrors(newReasonErrors);
    }
  };

  /* ── SAVE AREA ── */
  const handleSaveArea = () => {
    // Validate all checkpoints answered
    const newCpErrors = checkpoints.map(c => c.status === null);
    setCpErrors(newCpErrors);

    // Validate reasons for PARTIAL/FAIL
    const newReasonErrors = checkpoints.map(c =>
      (c.status === 'PARTIAL' || c.status === 'FAIL') && (!c.reason || !c.reason.trim())
    );
    setReasonErrors(newReasonErrors);

    if (newCpErrors.some(Boolean)) {
      showToast?.('Please complete all 6 checkpoints before saving', 'error');
      return;
    }
    if (newReasonErrors.some(Boolean)) {
      showToast?.('Please describe the issue for all PARTIAL or FAIL checkpoints', 'error');
      return;
    }

    const areaAudit: AreaAudit = {
      areaId: selectedAreaId!,
      checkpoints: [...checkpoints],
      areaScore: liveScore.score,
      areaPercentage: liveScore.percentage,
    };

    onSave({
      id: `${info.date}_${info.shift}_uid`,
      date: info.date,
      shift: info.shift,
      auditor: info.auditor,
      areas: [areaAudit],
    });

    setCompletedAreas(prev => new Set([...prev, selectedAreaId!]));
    showToast?.(`✅ ${currentArea?.name} audit saved`, 'success');
    setStep(3);
  };

  /* ── Step breadcrumb ── */
  const steps = ['Info', 'Section', 'Area', 'Audit'];

  /* ── Shared input style ── */
  const inputStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '48px',
    padding: '12px 16px',
    backgroundColor: '#1a2a3a',
    border: '1.5px solid #334155',
    borderRadius: '10px',
    color: '#e2e8f0',
    fontSize: '16px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
  };

  const errorInputStyle: React.CSSProperties = {
    ...inputStyle,
    borderColor: '#ef4444',
    boxShadow: '0 0 0 2px rgba(239,68,68,0.2)',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '0',
      color: '#e2e8f0',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* ── HEADER ── */}
      <div style={{
        padding: '16px 20px 14px',
        borderBottom: '1px solid #1a2a3a',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h2 style={{ color: '#00bcd4', fontSize: '18px', fontWeight: 800, margin: 0 }}>Data Entry</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '4px', fontSize: '13px', fontWeight: 600 }}
          >
            ✕ Close
          </button>
        </div>

        {/* Step breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {steps.map((label, i) => (
            <React.Fragment key={label}>
              <span style={{
                fontSize: '12px',
                fontWeight: step >= i + 1 ? 700 : 400,
                color: step === i + 1 ? '#00bcd4' : step > i + 1 ? '#22c55e' : '#334155',
              }}>
                {step > i + 1 ? '✓' : `${i + 1}.`} {label}
              </span>
              {i < steps.length - 1 && (
                <ChevronRight size={12} color="#334155" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', WebkitOverflowScrolling: 'touch' as any }}>

        {/* ═══════════════════════════
            STEP 1 — General Info
        ═══════════════════════════ */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Date */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Date
              </label>
              <input
                type="date"
                value={info.date}
                onChange={e => { setInfo({ ...info, date: e.target.value }); setInfoErrors(p => ({ ...p, date: false })); }}
                style={infoErrors.date ? errorInputStyle : inputStyle}
              />
              {infoErrors.date && <p className="validation-msg">Please select a date</p>}
            </div>

            {/* Shift — toggle buttons */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Shift
              </label>
              <div className="shift-toggle-group">
                {(['P', 'Q', 'R'] as const).map(s => (
                  <button
                    key={s}
                    className={`shift-toggle-btn ${info.shift === s ? 'active' : ''}`}
                    onClick={() => setInfo({ ...info, shift: s })}
                  >
                    {s} Shift
                  </button>
                ))}
              </div>
            </div>

            {/* Auditor Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Auditor Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={info.auditor}
                onChange={e => { setInfo({ ...info, auditor: e.target.value }); setInfoErrors(p => ({ ...p, auditor: false })); }}
                style={infoErrors.auditor ? errorInputStyle : inputStyle}
              />
              {infoErrors.auditor && <p className="validation-msg">Please enter your name</p>}
            </div>

            <button
              onClick={handleNextStep1}
              style={{
                width: '100%',
                minHeight: '56px',
                backgroundColor: '#00bcd4',
                color: '#0d1b2a',
                border: 'none',
                borderRadius: '12px',
                fontSize: '17px',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              Next Step <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* ═══════════════════════════
            STEP 2 — Section Selection
        ═══════════════════════════ */}
        {step === 2 && (
          <div>
            <button
              onClick={() => setStep(1)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', marginBottom: '20px', padding: 0, fontFamily: 'Inter, sans-serif' }}
            >
              <ArrowLeft size={16} /> Back to Info
            </button>

            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Select the section you are auditing:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {SECTIONS.map(s => {
                const isAvailable = s === 'BISCUIT' || s === 'PC' || s === 'COMMON' || s === 'UTILITY';
                return (
                  <button
                    key={s}
                    onClick={() => handleSelectSection(s as SectionName)}
                    style={{
                      minHeight: '100px',
                      backgroundColor: '#1a2a3a',
                      border: `1.5px solid ${selectedSection === s ? '#00bcd4' : '#334155'}`,
                      borderRadius: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#e2e8f0' }}>{s}</span>
                    <span style={{ fontSize: '11px', color: '#475569' }}>
                      {AREAS.filter(a => a.section === s).length} areas
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════
            STEP 3 — Area Selection
        ═══════════════════════════ */}
        {step === 3 && (
          <div>
            <button
              onClick={() => setStep(2)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', marginBottom: '16px', padding: 0, fontFamily: 'Inter, sans-serif' }}
            >
              <ArrowLeft size={16} /> Back to Sections
            </button>

            <h3 style={{ color: '#00bcd4', fontSize: '16px', fontWeight: 700, margin: '0 0 4px' }}>
              {selectedSection} Areas
            </h3>
            <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 16px' }}>
              {completedAreas.size} completed this session
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '80px' }}>
              {sectionAreas.map(area => {
                const isDone = completedAreas.has(area.id);
                return (
                  <button
                    key={area.id}
                    onClick={() => handleSelectArea(area.id)}
                    style={{
                      width: '100%',
                      minHeight: '64px',
                      backgroundColor: isDone ? 'rgba(34,197,94,0.08)' : '#1a2a3a',
                      border: `1.5px solid ${isDone ? '#22c55e' : '#334155'}`,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: isDone ? '#4ade80' : '#e2e8f0', margin: '0 0 2px', wordBreak: 'break-word' }}>
                        {area.name}
                      </p>
                      <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
                        Max Score: {area.weightage}
                      </p>
                    </div>
                    {isDone ? (
                      <CheckCircle2 size={24} color="#22c55e" style={{ flexShrink: 0, marginLeft: '10px' }} />
                    ) : (
                      <ChevronRight size={20} color="#475569" style={{ flexShrink: 0, marginLeft: '10px' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════
            STEP 4 — Audit Checklist
        ═══════════════════════════ */}
        {step === 4 && currentArea && (
          <div>
            <button
              onClick={() => setStep(3)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', marginBottom: '16px', padding: 0, fontFamily: 'Inter, sans-serif' }}
            >
              <ArrowLeft size={16} /> Back to Areas
            </button>

            <h3 style={{ color: '#e2e8f0', fontSize: '17px', fontWeight: 700, margin: '0 0 2px', wordBreak: 'break-word' }}>
              {currentArea.name}
            </h3>
            <p style={{ fontSize: '13px', color: '#00bcd4', margin: '0 0 20px' }}>
              Weightage: {currentArea.weightage}
            </p>

            {/* Checkpoints */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '180px' }}>
              {checkpoints.map((cp, idx) => {
                const weightPct = (CHECKPOINTS.find(c => c.name === cp.name)?.weightage || 0) * 100;
                const hasError = cpErrors[idx];
                const hasReasonError = reasonErrors[idx];

                return (
                  <div
                    key={cp.name}
                    style={{
                      border: `1.5px solid ${hasError ? '#ef4444' : '#1e3a4a'}`,
                      borderRadius: '14px',
                      overflow: 'hidden',
                      backgroundColor: '#1a2a3a',
                    }}
                  >
                    {/* Checkpoint name + weight */}
                    <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid #0f1e2e' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', margin: 0, flex: 1, wordBreak: 'break-word' }}>
                          {cp.name}
                        </h4>
                        <span style={{
                          fontSize: '11px',
                          backgroundColor: '#0d1b2a',
                          color: '#64748b',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          flexShrink: 0,
                          fontWeight: 600,
                        }}>
                          {weightPct.toFixed(0)}% wgt
                        </span>
                      </div>
                    </div>

                    {/* PASS / PARTIAL / FAIL buttons */}
                    <div style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {(['PASS', 'PARTIAL', 'FAIL'] as const).map(status => {
                        const isSelected = cp.status === status;
                        const colors: Record<string, { bg: string; text: string; border: string; activeBg: string }> = {
                          PASS: {
                            bg: '#0d1b2a', text: '#64748b', border: '#334155',
                            activeBg: '#22c55e',
                          },
                          PARTIAL: {
                            bg: '#0d1b2a', text: '#64748b', border: '#334155',
                            activeBg: '#f59e0b',
                          },
                          FAIL: {
                            bg: '#0d1b2a', text: '#64748b', border: '#334155',
                            activeBg: '#ef4444',
                          },
                        };
                        const c = colors[status];
                        return (
                          <button
                            key={status}
                            onClick={() => handleCheckpointStatus(idx, status)}
                            style={{
                              minHeight: '48px',
                              backgroundColor: isSelected ? c.activeBg : c.bg,
                              color: isSelected ? (status === 'FAIL' ? '#fff' : '#0d1b2a') : c.text,
                              border: `1.5px solid ${isSelected ? c.activeBg : c.border}`,
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: 'Inter, sans-serif',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>

                    {/* Reason textarea (PARTIAL/FAIL) */}
                    {(cp.status === 'PARTIAL' || cp.status === 'FAIL') && (
                      <div style={{ padding: '0 12px 12px' }}>
                        <textarea
                          placeholder="Describe the issue and exact location within the area..."
                          value={cp.reason || ''}
                          onChange={e => handleCheckpointReason(idx, e.target.value)}
                          style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '10px 12px',
                            backgroundColor: '#0d1b2a',
                            border: `1.5px solid ${hasReasonError ? '#ef4444' : '#334155'}`,
                            borderRadius: '8px',
                            color: '#e2e8f0',
                            fontSize: '14px',
                            fontFamily: 'Inter, sans-serif',
                            resize: 'vertical',
                            outline: 'none',
                            lineHeight: '1.5',
                            boxShadow: hasReasonError ? '0 0 0 2px rgba(239,68,68,0.2)' : 'none',
                          }}
                        />
                        {hasReasonError && (
                          <p className="validation-msg">
                            Please describe the issue before saving
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── FIXED FOOTER FOR STEP 4 ── */}
      {step === 4 && currentArea && (
        <div style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#0f1e2e',
          borderTop: '1px solid #1a2a3a',
          padding: '14px 20px',
          flexShrink: 0,
        }}>
          {/* Live score */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span className="live-score-number" style={{ color: scoreColor }}>
                {liveScore.percentage.toFixed(0)}%
              </span>
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Live Score
              </span>
            </div>
            <div style={{ width: '1px', height: '36px', backgroundColor: '#1a2a3a' }} />
            <div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>
                {liveScore.score.toFixed(1)}
              </span>
              <span style={{ fontSize: '13px', color: '#475569' }}>
                {' '}/ {liveScore.max}
              </span>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSaveArea}
            style={{
              width: '100%',
              minHeight: '56px',
              backgroundColor: '#00bcd4',
              color: '#0d1b2a',
              border: 'none',
              borderRadius: '12px',
              fontSize: '17px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <CheckCircle2 size={20} /> Save This Area
          </button>
        </div>
      )}

      {/* ── FIXED FOOTER FOR STEP 3 (Submit button) ── */}
      {step === 3 && (
        <div style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#0f1e2e',
          borderTop: '1px solid #1a2a3a',
          padding: '14px 20px',
          flexShrink: 0,
        }}>
          <button
            onClick={() => setStep(2)}
            style={{
              width: '100%',
              minHeight: '56px',
              backgroundColor: '#22c55e',
              color: '#0d1b2a',
              border: 'none',
              borderRadius: '12px',
              fontSize: '17px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            ✅ Done with {selectedSection}
          </button>
        </div>
      )}
    </div>
  );
}
