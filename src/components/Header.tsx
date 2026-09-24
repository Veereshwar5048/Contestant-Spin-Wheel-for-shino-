import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { LogoPlaceholder } from './LogoPlaceholder';
import type { Settings } from '../types';
import { initAudio } from '../utils/sound';

interface HeaderProps {
  settings: Settings;
  onToggleSound: () => void;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ settings, onToggleSound, subtitle }) => {
  return (
    <header
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
      className="px-6 py-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <LogoPlaceholder size="sm" />
        {subtitle && (
          <div
            style={{
              borderLeft: '1px solid var(--border-subtle)',
              paddingLeft: '1rem',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {settings.contestName && (
          <span
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.7rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {settings.contestName}
          </span>
        )}
        <button
          onClick={() => {
            initAudio();
            onToggleSound();
          }}
          aria-label={settings.soundOn ? 'Mute sound' : 'Enable sound'}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            color: settings.soundOn ? 'var(--gold)' : 'var(--text-muted)',
            borderRadius: '6px',
            padding: '6px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {settings.soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>
    </header>
  );
};
