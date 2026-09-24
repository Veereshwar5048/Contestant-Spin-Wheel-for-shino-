import React from 'react';
import type { HistoryEntry } from '../types';

interface ParticipantListProps {
  history: HistoryEntry[];
  kind: 'contestant' | 'judge';
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const ParticipantList: React.FC<ParticipantListProps> = ({ history, kind }) => {
  const title = kind === 'contestant' ? 'CONTESTANT SELECTION ORDER' : 'EVALUATION ORDER';

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '1.25rem',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <h3
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.2em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {title}
      </h3>

      {history.length === 0 ? (
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: '2rem',
          }}
        >
          No selections yet
        </p>
      ) : (
        <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {history.map((entry) => (
            <li
              key={`${entry.personId}-${entry.order}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.75rem',
                background: 'rgba(212,175,55,0.04)',
                borderRadius: '4px',
                border: '1px solid rgba(212,175,55,0.08)',
              }}
            >
              <span
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--gold)',
                  minWidth: '2rem',
                  textAlign: 'right',
                }}
              >
                {String(entry.order).padStart(2, '0')}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {entry.name}
                </p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {formatTime(entry.timestamp)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
