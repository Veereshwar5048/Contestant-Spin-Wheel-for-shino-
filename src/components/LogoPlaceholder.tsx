import React from 'react';

interface LogoPlaceholderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LogoPlaceholder: React.FC<LogoPlaceholderProps> = ({
  className = '',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'text-xs tracking-[0.2em]',
    md: 'text-sm tracking-[0.25em]',
    lg: 'text-base tracking-[0.3em]',
  };

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      {/* Logo placeholder — drop in official asset here */}
      <div
        className={`font-playfair font-bold text-gold uppercase ${sizeMap[size]}`}
        style={{ color: 'var(--gold)', letterSpacing: '0.2em' }}
      >
        TOASTMASTERS
        <span
          style={{
            display: 'block',
            fontSize: '0.65em',
            letterSpacing: '0.3em',
            color: 'var(--text-muted)',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
          }}
        >
          INTERNATIONAL
        </span>
      </div>
    </div>
  );
};
