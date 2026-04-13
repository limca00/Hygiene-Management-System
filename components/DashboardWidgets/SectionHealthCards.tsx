import React, { useState, useEffect } from 'react';
import { SECTIONS } from '../../constants';

interface Props {
  health: any;
  activeSection: string;
  selectedDate: string;
  onSectionClick: (section: string) => void;
}

export default function SectionHealthCards({ health, activeSection, selectedDate, onSectionClick }: Props) {

  const getColors = (pct: number, hasData: boolean) => {
    if (!hasData) return { border: '#334155', text: '#64748b', bg: 'rgba(51,65,85,0.1)' };
    if (pct >= 80) return { border: '#22c55e', text: '#22c55e', bg: 'rgba(34,197,94,0.08)' };
    if (pct >= 60) return { border: '#f59e0b', text: '#f59e0b', bg: 'rgba(245,158,11,0.08)' };
    return { border: '#ef4444', text: '#ef4444', bg: 'rgba(239,68,68,0.08)' };
  };

  return (
    <div>
      <p style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
        Section Health — {selectedDate}
      </p>

      {/* 2-column grid using flexbox for universal compat */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
      }}>
        {SECTIONS.map(s => {
          const data = health[s] || { scoreSum: 0, maxSum: 0, openFprs: 0, areaCount: 0, shiftCount: 0 };
          const hasData = data.areaCount > 0;
          const pct = hasData && data.maxSum > 0 ? (data.scoreSum / data.maxSum) * 100 : 0;
          const colors = getColors(pct, hasData);
          const isActive = s === activeSection;

          return (
            <button
              key={s}
              onClick={() => onSectionClick(s)}
              style={{
                minHeight: '110px',
                backgroundColor: isActive ? '#1a2a3a' : colors.bg,
                border: `2px solid ${isActive ? '#00bcd4' : colors.border}`,
                borderRadius: '14px',
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 0 16px rgba(0,188,212,0.25)' : 'none',
                fontFamily: 'Inter, sans-serif',
                textAlign: 'center',
                width: '100%',
              }}
              aria-label={`${s} section — ${hasData ? pct.toFixed(0) + '%' : 'No data'}`}
            >
              {/* Active indicator dot */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#00bcd4',
                }} />
              )}

              {/* Section name */}
              <span style={{
                fontSize: '12px',
                fontWeight: 800,
                color: isActive ? '#e2e8f0' : '#94a3b8',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                {s}
              </span>

              {/* Score % — large */}
              <span style={{
                fontSize: '30px',
                fontWeight: 900,
                color: hasData ? colors.text : '#334155',
                lineHeight: 1,
                fontFeatureSettings: '"tnum"',
              }}>
                {hasData && data.maxSum > 0 ? `${pct.toFixed(0)}%` : 'N/A'}
              </span>

              {/* Open FPRs badge */}
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: data.openFprs > 0 ? '#f59e0b' : '#334155',
                backgroundColor: data.openFprs > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(51,65,85,0.1)',
                padding: '2px 8px',
                borderRadius: '9999px',
                whiteSpace: 'nowrap',
              }}>
                {data.openFprs > 0 ? `⚠ ${data.openFprs} Open` : '✓ No FPRs'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
