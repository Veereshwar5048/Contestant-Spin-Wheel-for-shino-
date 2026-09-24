import React from 'react';
import { Home, Users, Award, Settings, Monitor } from 'lucide-react';

interface NavProps {
  currentRoute: string;
}

const links = [
  { hash: '#/', label: 'Home', icon: Home },
  { hash: '#/contestants', label: 'Contestants', icon: Users },
  { hash: '#/judges', label: 'Evaluation Judges', icon: Award },
  { hash: '#/control', label: 'Control', icon: Settings },
  { hash: '#/present', label: 'Presentation', icon: Monitor },
];

export const Nav: React.FC<NavProps> = ({ currentRoute }) => {
  return (
    <nav
      aria-label="Main navigation"
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1rem',
        height: '48px',
        gap: '0.25rem',
      }}
    >
      {links.map(({ hash, label, icon: Icon }) => {
        const isActive = currentRoute === hash;
        return (
          <a
            key={hash}
            href={hash}
            aria-current={isActive ? 'page' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '5px',
              textDecoration: 'none',
              fontSize: '0.72rem',
              letterSpacing: '0.05em',
              fontFamily: 'Inter, sans-serif',
              color: isActive ? 'var(--gold)' : 'var(--text-muted)',
              background: isActive ? 'rgba(212,175,55,0.08)' : 'transparent',
              transition: 'color 0.15s, background 0.15s',
            }}
          >
            <Icon size={13} />
            {label}
          </a>
        );
      })}
    </nav>
  );
};
