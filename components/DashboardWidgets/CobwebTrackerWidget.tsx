import React, { useState, useMemo } from 'react';
import { ClipboardList, PlusCircle, Sparkles, X, Search, Calendar, ChevronRight, Upload, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

interface CobwebTrackerProps {
  cobwebSchedules: any[];
  cobwebAudits: any[];
  onSaveCobwebAudit: (audit: any) => Promise<any>;
  alerts: any[];
  currentDate: string; // YYYY-MM-DD
}

export default function CobwebTrackerWidget({
  cobwebSchedules,
  cobwebAudits,
  onSaveCobwebAudit,
  alerts,
  currentDate
}: CobwebTrackerProps) {
  // Convert currentDate (YYYY-MM-DD) to schedule date format (DD-MM-YYYY)
  const todayScheduleDate = useMemo(() => {
    if (!currentDate) return '';
    const [yyyy, mm, dd] = currentDate.split('-');
    return `${dd}-${mm}-${yyyy}`;
  }, [currentDate]);

  // Modal / Drawer state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [auditor, setAuditor] = useState<string>('');
  const [inspectionTime, setInspectionTime] = useState<string>('');
  const [score, setScore] = useState<number>(100);
  const [remarks, setRemarks] = useState<string>('');
  const [beforePhoto, setBeforePhoto] = useState<string>('');
  const [afterPhoto, setAfterPhoto] = useState<string>('');
  const [auditorError, setAuditorError] = useState(false);

  // Photo viewer modal state
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Filters state for History Table
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterArea, setFilterArea] = useState('ALL');
  const [filterScore, setFilterScore] = useState('ALL');

  // Today's schedule info
  const todaySchedule = useMemo(() => {
    return cobwebSchedules.find(s => s.date === todayScheduleDate);
  }, [cobwebSchedules, todayScheduleDate]);

  const todayAreas = todaySchedule ? todaySchedule.areas : [];

  // Today's audits
  const todayAudits = useMemo(() => {
    return cobwebAudits.filter(a => a.date === todayScheduleDate);
  }, [cobwebAudits, todayScheduleDate]);

  // Total pending today
  const pendingCount = useMemo(() => {
    const auditedAreaNames = todayAudits.map(a => a.areaName);
    return todayAreas.filter((area: string) => !auditedAreaNames.includes(area)).length;
  }, [todayAreas, todayAudits]);

  // General metrics calculations
  const metrics = useMemo(() => {
    // 1. Today's Scheduled Areas
    const scheduledToday = todayAreas.length;

    // 2. Today's Audited Areas
    const auditedToday = new Set(todayAudits.map(a => a.areaName)).size;

    // 3. Average Cleaning Score
    const totalScore = cobwebAudits.reduce((acc, curr) => acc + curr.score, 0);
    const avgScore = cobwebAudits.length > 0 ? Math.round(totalScore / cobwebAudits.length) : 0;

    // 4. Open Re-cleaning Actions (unresolved alerts from PriorityAlerts with cobweb areaId)
    const openReclean = alerts.filter(a => a.areaId === 'cobweb_recleaning').length;

    // 5. Best & Worst Performing Area
    const areaStats: Record<string, { sum: number; count: number }> = {};
    cobwebAudits.forEach(audit => {
      if (!areaStats[audit.areaName]) {
        areaStats[audit.areaName] = { sum: 0, count: 0 };
      }
      areaStats[audit.areaName].sum += audit.score;
      areaStats[audit.areaName].count += 1;
    });

    let bestArea = '-';
    let bestAvg = -1;
    let worstArea = '-';
    let worstAvg = 101;

    Object.entries(areaStats).forEach(([area, stat]) => {
      const avg = stat.sum / stat.count;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestArea = area;
      }
      if (avg < worstAvg) {
        worstAvg = avg;
        worstArea = area;
      }
    });

    return {
      scheduledToday,
      auditedToday,
      avgScore,
      openReclean,
      bestArea: bestArea === '-' ? '-' : `${bestArea} (${Math.round(bestAvg)})`,
      worstArea: worstArea === '-' ? '-' : `${worstArea} (${Math.round(worstAvg)})`
    };
  }, [cobwebAudits, todayAreas, todayAudits, alerts]);

  // Status badges mapping for Today's Scheduled list
  const getAreaStatus = (areaName: string) => {
    const areaAudits = todayAudits.filter(a => a.areaName === areaName);
    if (areaAudits.length === 0) {
      return { label: 'Pending', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' };
    }
    const hasEffective = areaAudits.some(a => a.score >= 80);
    if (hasEffective) {
      return { label: 'Completed', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' };
    }
    return { label: 'Audited', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
  };

  // Open audit dialog
  const openAuditDrawer = (areaName: string) => {
    setSelectedArea(areaName);
    setAuditor('');
    // Default inspection time to HH:MM format
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    setInspectionTime(timeStr);
    setScore(100);
    setRemarks('');
    setBeforePhoto('');
    setAfterPhoto('');
    setAuditorError(false);
    setModalOpen(true);
  };

  // Handle Photo input
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Str = reader.result as string;
      if (type === 'before') setBeforePhoto(base64Str);
      else setAfterPhoto(base64Str);
    };
    reader.readAsDataURL(file);
  };

  // Submit Audit
  const handleSubmitAudit = async () => {
    if (!auditor.trim()) {
      setAuditorError(true);
      return;
    }

    let status = 'Recleaning Required';
    if (score >= 80) status = 'Effective Cleaning';
    else if (score >= 60) status = 'Needs Improvement';

    const auditData = {
      date: todayScheduleDate,
      areaName: selectedArea,
      auditor: auditor.trim(),
      inspectionTime,
      score,
      status,
      remarks: remarks.trim(),
      beforePhoto,
      afterPhoto
    };

    try {
      await onSaveCobwebAudit(auditData);
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Get score border colors
  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 90) return '#22c55e'; // Green
    if (scoreValue >= 70) return '#84cc16'; // Light Green
    if (scoreValue >= 50) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  // History Table computed items
  const uniqueAreas = useMemo(() => {
    return Array.from(new Set(cobwebAudits.map(a => a.areaName))).sort();
  }, [cobwebAudits]);

  const filteredHistory = useMemo(() => {
    return cobwebAudits.filter(item => {
      // 1. Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesArea = item.areaName.toLowerCase().includes(query);
        const matchesAuditor = item.auditor.toLowerCase().includes(query);
        const matchesRemarks = item.remarks.toLowerCase().includes(query);
        if (!matchesArea && !matchesAuditor && !matchesRemarks) return false;
      }
      // 2. Date Filter
      if (filterDate) {
        // Convert YYYY-MM-DD from input to DD-MM-YYYY
        const [y, m, d] = filterDate.split('-');
        const targetDateStr = `${d}-${m}-${y}`;
        if (item.date !== targetDateStr) return false;
      }
      // 3. Area Filter
      if (filterArea !== 'ALL' && item.areaName !== filterArea) return false;
      // 4. Score Filter
      if (filterScore !== 'ALL') {
        if (filterScore === 'EFFECTIVE' && item.score < 80) return false;
        if (filterScore === 'IMPROVEMENT' && (item.score < 60 || item.score >= 80)) return false;
        if (filterScore === 'RECLEANING' && item.score >= 60) return false;
      }
      return true;
    });
  }, [cobwebAudits, searchQuery, filterDate, filterArea, filterScore]);

  /* ═══════════ ANALYTICS DATA CALCULATIONS ═══════════ */

  // 1. Daily Compliance Trend (Last 7 days/dates that have audits)
  const complianceTrendData = useMemo(() => {
    const dateGroups: Record<string, { sum: number; count: number }> = {};
    // Sort audits chronologically by raw created timestamp
    const sortedAudits = [...cobwebAudits].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    sortedAudits.forEach(a => {
      if (!dateGroups[a.date]) {
        dateGroups[a.date] = { sum: 0, count: 0 };
      }
      dateGroups[a.date].sum += a.score;
      dateGroups[a.date].count += 1;
    });

    const labels = Object.keys(dateGroups).slice(-7);
    const data = labels.map(date => Math.round(dateGroups[date].sum / dateGroups[date].count));

    return {
      labels,
      datasets: [{
        label: 'Compliance Score Trend (%)',
        data,
        borderColor: '#00bcd4',
        backgroundColor: 'rgba(0,188,212,0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#00bcd4',
        pointBorderColor: '#0d1b2a',
        pointBorderWidth: 2,
        pointRadius: 5
      }]
    };
  }, [cobwebAudits]);

  // 2. Average Score by Area (Top 5)
  const avgScoreByAreaData = useMemo(() => {
    const areaStats: Record<string, { sum: number; count: number }> = {};
    cobwebAudits.forEach(a => {
      if (!areaStats[a.areaName]) {
        areaStats[a.areaName] = { sum: 0, count: 0 };
      }
      areaStats[a.areaName].sum += a.score;
      areaStats[a.areaName].count += 1;
    });

    const sorted = Object.entries(areaStats)
      .map(([area, stat]) => ({ area, avg: Math.round(stat.sum / stat.count) }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);

    return {
      labels: sorted.map(x => x.area),
      datasets: [{
        label: 'Avg Score (%)',
        data: sorted.map(x => x.avg),
        backgroundColor: '#22c55e',
        borderRadius: 6
      }]
    };
  }, [cobwebAudits]);

  // 3. Areas Requiring Most Re-cleaning (Score < 60 count)
  const recleanCountByAreaData = useMemo(() => {
    const recleanStats: Record<string, number> = {};
    cobwebAudits.filter(a => a.score < 60).forEach(a => {
      recleanStats[a.areaName] = (recleanStats[a.areaName] || 0) + 1;
    });

    const sorted = Object.entries(recleanStats)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      labels: sorted.map(x => x.area),
      datasets: [{
        label: 'Re-cleanings Required',
        data: sorted.map(x => x.count),
        backgroundColor: '#ef4444',
        borderRadius: 6
      }]
    };
  }, [cobwebAudits]);

  // 4. Monthly Compliance %
  const monthlyComplianceRate = useMemo(() => {
    if (cobwebAudits.length === 0) return 0;
    const effectiveCount = cobwebAudits.filter(a => a.score >= 80).length;
    return Math.round((effectiveCount / cobwebAudits.length) * 100);
  }, [cobwebAudits]);

  // Chart configurations
  const barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#1a2a3a' },
        ticks: { color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  const lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: '#1a2a3a' },
        ticks: { color: '#94a3b8', callback: (v: any) => `${v}%` }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── METRICS DASHBOARD CARDS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px'
      }}>
        {[
          { label: 'Today Scheduled', value: metrics.scheduledToday, color: '#00bcd4' },
          { label: 'Today Audited', value: metrics.auditedToday, color: '#22c55e' },
          { label: 'Average Score', value: `${metrics.avgScore}%`, color: metrics.avgScore >= 80 ? '#22c55e' : metrics.avgScore >= 60 ? '#f59e0b' : '#ef4444' },
          { label: 'Open Re-cleaning', value: metrics.openReclean, color: metrics.openReclean > 0 ? '#ef4444' : '#94a3b8' },
          { label: 'Best Performing', value: metrics.bestArea, color: '#22c55e', cols: 2 },
          { label: 'Worst Performing', value: metrics.worstArea, color: '#ef4444', cols: 2 }
        ].map((m, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#1a2a3a',
              border: '1px solid #1e3a4a',
              borderRadius: '12px',
              padding: '14px 16px',
              gridColumn: m.cols ? `span ${m.cols}` : 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
              {m.label}
            </span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: m.color, wordBreak: 'break-all' }}>
              {m.value}
            </span>
          </div>
        ))}
      </div>

      {/* ── TODAY'S SCHEDULE PANEL ── */}
      <div style={{ backgroundColor: '#1a2a3a', border: '1px solid #1e3a4a', borderRadius: '14px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Sparkles color="#00bcd4" size={22} />
          <h2 style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: 700, flex: 1, margin: 0 }}>
            Today's Cobweb Cleaning Schedule
          </h2>
          {pendingCount > 0 && (
            <span style={{
              backgroundColor: 'rgba(245,158,11,0.15)',
              color: '#f59e0b',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 800
            }}>
              {pendingCount} Pending
            </span>
          )}
        </div>

        {todayAreas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-text">No Cobweb Cleaning Scheduled Today</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {todayAreas.map((area: string, idx: number) => {
              const status = getAreaStatus(area);
              return (
                <button
                  key={idx}
                  onClick={() => openAuditDrawer(area)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0d1b2a',
                    border: '1px solid #1e3a4a',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', margin: '0 0 2px' }}>
                      {area}
                    </h3>
                    <span style={{ fontSize: '11px', color: '#475569', display: 'block' }}>
                      Date: {todayScheduleDate}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      backgroundColor: status.bg,
                      color: status.color,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      {status.label}
                    </span>
                    <ChevronRight size={18} color="#475569" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ANALYTICS SECTION ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Compliance Trend */}
        <div style={{ backgroundColor: '#1a2a3a', border: '1px solid #1e3a4a', borderRadius: '14px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <TrendingUp color="#00bcd4" size={18} />
            <h3 style={{ color: '#00bcd4', fontSize: '15px', fontWeight: 700, margin: 0 }}>
              Daily Cleaning Compliance Trend
            </h3>
          </div>
          <div style={{ height: '240px', position: 'relative' }}>
            {cobwebAudits.length === 0 ? (
              <div className="empty-state" style={{ height: '100%' }}>
                <p className="empty-state-text">No audit history available yet.</p>
              </div>
            ) : (
              <Line data={complianceTrendData} options={lineChartOptions} />
            )}
          </div>
        </div>

        {/* Avg score by Area */}
        <div style={{ backgroundColor: '#1a2a3a', border: '1px solid #1e3a4a', borderRadius: '14px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <BarChart3 color="#00bcd4" size={18} />
            <h3 style={{ color: '#00bcd4', fontSize: '15px', fontWeight: 700, margin: 0 }}>
              Average Cleaning Score by Area (Top 5)
            </h3>
          </div>
          <div style={{ height: '240px', position: 'relative' }}>
            {cobwebAudits.length === 0 ? (
              <div className="empty-state" style={{ height: '100%' }}>
                <p className="empty-state-text">No area statistics available yet.</p>
              </div>
            ) : (
              <Bar data={avgScoreByAreaData} options={barChartOptions} />
            )}
          </div>
        </div>

        {/* Areas Requiring Most Recleaning */}
        <div style={{ backgroundColor: '#1a2a3a', border: '1px solid #1e3a4a', borderRadius: '14px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertTriangle color="#ef4444" size={18} />
            <h3 style={{ color: '#00bcd4', fontSize: '15px', fontWeight: 700, margin: 0 }}>
              Areas Requiring Most Re-cleaning
            </h3>
          </div>
          <div style={{ height: '240px', position: 'relative' }}>
            {cobwebAudits.filter(a => a.score < 60).length === 0 ? (
              <div className="empty-state" style={{ height: '100%' }}>
                <p className="empty-state-text">No re-cleaning actions recorded.</p>
              </div>
            ) : (
              <Bar data={recleanCountByAreaData} options={barChartOptions} />
            )}
          </div>
        </div>

        {/* Monthly Compliance Gauge */}
        <div style={{
          backgroundColor: '#1a2a3a',
          border: '1px solid #1e3a4a',
          borderRadius: '14px',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '15px', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Overall Compliance Rate
          </h3>
          <div style={{ position: 'relative', width: '120px', height: '120px' }}>
            {/* Pure SVG Circle Gauge */}
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#0d1b2a" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke={monthlyComplianceRate >= 80 ? '#22c55e' : monthlyComplianceRate >= 60 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - monthlyComplianceRate / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#e2e8f0' }}>{monthlyComplianceRate}%</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Standard</span>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', margin: 0 }}>
            Percentage of cleaning audits that met the compliance threshold (Score &ge; 80)
          </p>
        </div>
      </div>

      {/* ── HISTORY TABLE LOGS ── */}
      <div style={{ backgroundColor: '#1a2a3a', border: '1px solid #1e3a4a', borderRadius: '14px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <ClipboardList color="#00bcd4" size={22} />
          <h2 style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: 700, margin: 0, flex: 1 }}>
            Cobweb Cleaning History
          </h2>
        </div>

        {/* History Filters */}
        <div style={{
          backgroundColor: '#0d1b2a',
          border: '1px solid #1e3a4a',
          borderRadius: '10px',
          padding: '14px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Search bar */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '5px', textTransform: 'uppercase' }}>
              Search Area or Inspector
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="mobile-input"
                style={{ paddingLeft: '38px' }}
              />
              <Search size={18} color="#475569" style={{ position: 'absolute', left: '12px', top: '15px' }} />
            </div>
          </div>

          {/* Date range filter */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '5px', textTransform: 'uppercase' }}>
              Filter by Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="mobile-input"
            />
          </div>

          {/* Area filter dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '5px', textTransform: 'uppercase' }}>
              Filter by Area
            </label>
            <select
              value={filterArea}
              onChange={e => setFilterArea(e.target.value)}
              className="mobile-input"
            >
              <option value="ALL">All Areas</option>
              {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Score filter dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '5px', textTransform: 'uppercase' }}>
              Filter by Score / Status
            </label>
            <select
              value={filterScore}
              onChange={e => setFilterScore(e.target.value)}
              className="mobile-input"
            >
              <option value="ALL">Any Status</option>
              <option value="EFFECTIVE">Effective (Score &ge; 80)</option>
              <option value="IMPROVEMENT">Needs Improvement (60-79)</option>
              <option value="RECLEANING">Recleaning Required (&lt; 60)</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <p style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
          {filteredHistory.length} record{filteredHistory.length !== 1 ? 's' : ''} found
        </p>

        {/* Table Cards */}
        {filteredHistory.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">No cobweb logs matching filters.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredHistory.map((row) => {
              const borderCol = getScoreColor(row.score);
              return (
                <div
                  key={row.id}
                  style={{
                    backgroundColor: '#0d1b2a',
                    border: '1px solid #1e3a4a',
                    borderLeft: `4px solid ${borderCol}`,
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#475569' }}>
                        {row.date} · {row.inspectionTime}
                      </span>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', margin: '2px 0 0' }}>
                        {row.areaName}
                      </h3>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: row.score >= 80 ? 'rgba(34,197,94,0.15)' : row.score >= 60 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                      color: row.score >= 80 ? '#22c55e' : row.score >= 60 ? '#f59e0b' : '#ef4444'
                    }}>
                      {row.score} Score
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                    Auditor: <strong style={{ color: '#00bcd4' }}>{row.auditor}</strong>
                  </div>

                  {row.remarks && (
                    <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#64748b' }}>
                      "{row.remarks}"
                    </div>
                  )}

                  {/* Photos Preview */}
                  {(row.beforePhoto || row.afterPhoto) && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      {row.beforePhoto && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ fontSize: '10px', color: '#475569', fontWeight: 600 }}>BEFORE</span>
                          <img
                            src={row.beforePhoto}
                            alt="Before"
                            onClick={() => setPreviewPhoto(row.beforePhoto!)}
                            style={{ width: '64px', height: '64px', borderRadius: '6px', objectFit: 'cover', cursor: 'pointer', border: '1px solid #1e3a4a' }}
                          />
                        </div>
                      )}
                      {row.afterPhoto && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ fontSize: '10px', color: '#475569', fontWeight: 600 }}>AFTER</span>
                          <img
                            src={row.afterPhoto}
                            alt="After"
                            onClick={() => setPreviewPhoto(row.afterPhoto!)}
                            style={{ width: '64px', height: '64px', borderRadius: '6px', objectFit: 'cover', cursor: 'pointer', border: '1px solid #1e3a4a' }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── AUDIT DIALOG / DRAWER ── */}
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
            zIndex: 200
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
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ width: '40px', height: '4px', backgroundColor: '#334155', borderRadius: '9999px', margin: '0 auto 16px', flexShrink: 0 }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexShrink: 0 }}>
              <h3 style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles color="#00bcd4" size={20} />
                Audit Cobweb Cleaning
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Context Summary */}
              <div style={{ backgroundColor: '#1a2a3a', border: '1px solid #1e3a4a', borderRadius: '10px', padding: '12px' }}>
                <p style={{ color: '#64748b', fontSize: '11px', fontFamily: 'monospace', margin: '0 0 2px' }}>
                  DATE: {todayScheduleDate}
                </p>
                <p style={{ color: '#e2e8f0', fontSize: '15px', fontWeight: 700, margin: 0 }}>
                  {selectedArea}
                </p>
              </div>

              {/* Auditor Input */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Auditor / Inspector Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={auditor}
                  onChange={e => { setAuditor(e.target.value); setAuditorError(false); }}
                  className={`mobile-input ${auditorError ? 'input-error' : ''}`}
                />
                {auditorError && <p className="validation-msg">Please enter the auditor name</p>}
              </div>

              {/* Inspection Time */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Inspection Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10:30 AM"
                  value={inspectionTime}
                  onChange={e => setInspectionTime(e.target.value)}
                  className="mobile-input"
                />
              </div>

              {/* Score Indicator & Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
                  Cleaning Score
                </label>

                {/* Score gauge circular preview */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                  <div style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    border: `6px solid ${getScoreColor(score)}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(13,27,42,0.6)'
                  }}>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: '#e2e8f0' }}>{score}</span>
                    <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      {score >= 80 ? 'Effective' : score >= 60 ? 'Fair' : 'Reclean'}
                    </span>
                  </div>
                </div>

                {/* Score Buttons Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { val: 100, label: 'Excellent' },
                    { val: 80, label: 'Good' },
                    { val: 60, label: 'Fair' },
                    { val: 40, label: 'Poor' },
                    { val: 20, label: 'V. Poor' },
                    { val: 0, label: 'Not Cleaned' }
                  ].map(item => (
                    <button
                      key={item.val}
                      onClick={() => setScore(item.val)}
                      style={{
                        minHeight: '44px',
                        backgroundColor: score === item.val ? getScoreColor(item.val) : '#1a2a3a',
                        color: score === item.val ? '#0d1b2a' : '#94a3b8',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1.2
                      }}
                    >
                      <strong>{item.val}</strong>
                      <span style={{ fontSize: '8px', opacity: 0.8 }}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Remarks textarea */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Inspector Remarks (Optional)
                </label>
                <textarea
                  placeholder="e.g. Cleaned properly, minor webs near piping..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="mobile-input"
                  style={{ minHeight: '80px', resize: 'vertical', fontSize: '14px', lineHeight: '1.4' }}
                />
              </div>

              {/* Photo Upload elements */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* Before Photo */}
                <div>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                    Before Photo
                  </span>
                  <div style={{ position: 'relative' }}>
                    <label style={{
                      height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: '#1a2a3a', border: '1.5px dashed #334155', borderRadius: '10px', cursor: 'pointer',
                      fontSize: '11px', color: '#64748b', gap: '4px'
                    }}>
                      {beforePhoto ? (
                        <img src={beforePhoto} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                      ) : (
                        <>
                          <Upload size={16} />
                          <span>Upload Before</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handlePhotoUpload(e, 'before')}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {beforePhoto && (
                      <button
                        onClick={() => setBeforePhoto('')}
                        style={{
                          position: 'absolute', right: '-4px', top: '-4px', width: '20px', height: '20px', borderRadius: '50%',
                          backgroundColor: '#ef4444', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', fontSize: '10px'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* After Photo */}
                <div>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                    After Photo
                  </span>
                  <div style={{ position: 'relative' }}>
                    <label style={{
                      height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: '#1a2a3a', border: '1.5px dashed #334155', borderRadius: '10px', cursor: 'pointer',
                      fontSize: '11px', color: '#64748b', gap: '4px'
                    }}>
                      {afterPhoto ? (
                        <img src={afterPhoto} alt="After" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                      ) : (
                        <>
                          <Upload size={16} />
                          <span>Upload After</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handlePhotoUpload(e, 'after')}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {afterPhoto && (
                      <button
                        onClick={() => setAfterPhoto('')}
                        style={{
                          position: 'absolute', right: '-4px', top: '-4px', width: '20px', height: '20px', borderRadius: '50%',
                          backgroundColor: '#ef4444', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', fontSize: '10px'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Actions Footer */}
            <div style={{ display: 'flex', gap: '10px', flexShrink: 0, borderTop: '1px solid #1a2a3a', paddingTop: '16px' }}>
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
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAudit}
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
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                Submit Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PHOTO LIGHTBOX / FULL PREVIEW MODAL ── */}
      {previewPhoto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
            padding: '20px'
          }}
          onClick={() => setPreviewPhoto(null)}
        >
          <button
            onClick={() => setPreviewPhoto(null)}
            style={{
              position: 'absolute', right: '20px', top: '20px', background: 'rgba(26,42,58,0.5)', border: 'none',
              borderRadius: '50%', width: '40px', height: '40px', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <X size={24} />
          </button>
          <img
            src={previewPhoto}
            alt="Preview"
            style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '10px', border: '1.5px solid #334155' }}
          />
        </div>
      )}

    </div>
  );
}
