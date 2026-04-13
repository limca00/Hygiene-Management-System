import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { AuditRecord } from '../../types';
import { AREAS } from '../../constants';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Detect if screen is narrow
const isMobile = () => window.innerWidth < 640;

export default function ChartsWidget({ records, selectedDate, selectedSection }: {
  records: AuditRecord[];
  selectedDate: string;
  selectedSection: string;
}) {

  /* ---- Shift Comparison ---- */
  const shiftChartData = useMemo(() => {
    const shiftRecords = records.filter(r => r.date === selectedDate);
    const validAreaIds = new Set(AREAS.filter(a => a.section === selectedSection).map(a => a.id));

    const analyzeShift = (shift: string) => {
      const recordsForShift = shiftRecords.filter(r => r.shift === shift);
      if (recordsForShift.length === 0) return { avg: 0, hasData: false };
      let scoreSum = 0;
      let maxSum = 0;
      let hasData = false;
      recordsForShift.forEach(r => {
        r.areas.forEach(a => {
          if (validAreaIds.has(a.areaId)) {
            const areaDef = AREAS.find(x => x.id === a.areaId);
            if (areaDef) { scoreSum += a.areaScore; maxSum += areaDef.weightage; hasData = true; }
          }
        });
      });
      return { avg: maxSum > 0 ? (scoreSum / maxSum) * 100 : 0, hasData };
    };

    const p = analyzeShift('P');
    const q = analyzeShift('Q');
    const r = analyzeShift('R');

    return {
      labels: [
        p.hasData ? 'P Shift' : 'P (No Data)',
        q.hasData ? 'Q Shift' : 'Q (No Data)',
        r.hasData ? 'R Shift' : 'R (No Data)',
      ],
      datasets: [{
        label: `${selectedSection} Avg Score (%)`,
        data: [p.avg, q.avg, r.avg],
        backgroundColor: ['#00bcd4', '#0097a7', '#006978'],
        borderRadius: 6,
      }]
    };
  }, [records, selectedDate, selectedSection]);

  const shiftChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: '#1a2a3a' },
        ticks: { color: '#94a3b8', font: { size: 12 }, callback: (v: any) => `${v}%` },
        border: { color: '#334155' },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 12 } },
        border: { color: '#334155' },
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1a2a3a',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        callbacks: {
          label: (ctx: any) => ` Score: ${ctx.raw.toFixed(1)}%`
        }
      },
      // Custom plugin to show value on top of each bar
      datalabels: false,
    },
  };

  /* ---- 7-Day Area Performance ---- */
  const areaPerformanceData = useMemo(() => {
    const end = new Date(selectedDate);
    const start = new Date(end);
    start.setDate(end.getDate() - 7);
    const endDateStr = end.toISOString().split('T')[0];
    const startDateStr = start.toISOString().split('T')[0];

    const recentRecords = records.filter(r => r.date >= startDateStr && r.date <= endDateStr);
    const validAreas = AREAS.filter(a => a.section === selectedSection);
    const areaStats: Record<string, { scoreSum: number; maxSum: number }> = {};
    validAreas.forEach(a => (areaStats[a.id] = { scoreSum: 0, maxSum: 0 }));

    recentRecords.forEach(r => {
      r.areas.forEach(a => {
        if (areaStats[a.areaId]) {
          const areaDef = AREAS.find(x => x.id === a.areaId);
          if (areaDef) {
            areaStats[a.areaId].scoreSum += a.areaScore;
            areaStats[a.areaId].maxSum += areaDef.weightage;
          }
        }
      });
    });

    const labels: string[] = [];
    const data: number[] = [];
    let hasAnyData = false;

    validAreas.forEach(a => {
      // Truncate long names for mobile labels
      const shortName = a.name.length > 14 ? a.name.substring(0, 12) + '…' : a.name;
      labels.push(shortName);
      const val = areaStats[a.id].maxSum > 0
        ? (areaStats[a.id].scoreSum / areaStats[a.id].maxSum) * 100
        : 0;
      data.push(val);
      if (areaStats[a.id].maxSum > 0) hasAnyData = true;
    });

    return {
      hasAnyData,
      chartData: {
        labels,
        datasets: [{
          label: '7-Day Avg Score (%)',
          data,
          backgroundColor: data.map(v =>
            v === 0 ? '#1e3a4a' : v >= 80 ? '#22c55e' : v >= 60 ? '#f59e0b' : '#ef4444'
          ),
          borderRadius: 5,
        }]
      }
    };
  }, [records, selectedDate, selectedSection]);

  /* Vertical bar chart for area performance on mobile */
  const areaChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: '#1a2a3a' },
        ticks: { color: '#94a3b8', font: { size: 11 }, callback: (v: any) => `${v}%` },
        border: { color: '#334155' },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 10 },
          maxRotation: 45,
          minRotation: 30,
        },
        border: { color: '#334155' },
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: '#64748b',
          font: { size: 12 },
          padding: 12,
          boxWidth: 12,
        }
      },
      tooltip: {
        backgroundColor: '#1a2a3a',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        callbacks: {
          label: (ctx: any) => ` Avg: ${ctx.raw.toFixed(1)}%`
        }
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Shift Comparison */}
      <div style={{
        backgroundColor: '#1a2a3a',
        border: '1px solid #1e3a4a',
        borderRadius: '14px',
        padding: '16px',
      }}>
        <h3 style={{ color: '#00bcd4', fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>
          Daily Shift Comparison
        </h3>
        <p style={{ color: '#475569', fontSize: '12px', margin: '0 0 14px' }}>
          {selectedSection} section · {selectedDate}
        </p>
        <div className="chart-container-mobile">
          <Bar data={shiftChartData} options={shiftChartOptions} />
        </div>
      </div>

      {/* 7-Day Area Performance */}
      <div style={{
        backgroundColor: '#1a2a3a',
        border: '1px solid #1e3a4a',
        borderRadius: '14px',
        padding: '16px',
      }}>
        <h3 style={{ color: '#00bcd4', fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>
          7-Day Area Performance
        </h3>
        <p style={{ color: '#475569', fontSize: '12px', margin: '0 0 14px' }}>
          {selectedSection} section · Last 7 days
        </p>
        <div className="chart-container-area">
          {!areaPerformanceData.hasAnyData ? (
            <div className="empty-state" style={{ height: '100%' }}>
              <div className="empty-state-icon">📊</div>
              <p className="empty-state-text">No data available for this section yet.</p>
            </div>
          ) : (
            <Bar data={areaPerformanceData.chartData} options={areaChartOptions} />
          )}
        </div>
        {/* Color legend */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px', justifyContent: 'center' }}>
          {[
            { color: '#22c55e', label: '≥80% (Good)' },
            { color: '#f59e0b', label: '60–79% (Fair)' },
            { color: '#ef4444', label: '<60% (Poor)' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: color, flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: '#64748b' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
