import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  clickable?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = false,
  clickable = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const content = (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Dynamic Geometric Brand Icon */}
      <div className={`relative ${iconSizes[size]} flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-[1.5px] shadow-glow-sm`}>
        <div className="w-full h-full bg-surface-elevated/90 backdrop-blur-sm rounded-[10px] flex items-center justify-center overflow-hidden relative">
          {/* Subtle glowing radial background */}
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20" />
          
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-3/5 h-3/5 relative z-10 text-white"
          >
            {/* Hexagonal aperture / meeting chamber icon */}
            <path
              d="M12 2L20 6.5V17.5L12 22L4 17.5V6.5L12 2Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-70"
            />
            {/* Dynamic camera / connection focal point */}
            <circle cx="12" cy="12" r="3.2" fill="#34D399" />
            <path
              d="M15 12L19 9.5V14.5L15 12Z"
              fill="#10B981"
            />
          </svg>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-bold tracking-tight text-white font-sans ${textSizes[size]}`}>
            CALLIVO
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
        </div>
        {showTagline && (
          <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400 -mt-0.5">
            Meet. Connect. Collaborate.
          </span>
        )}
      </div>
    </div>
  );

  if (clickable) {
    return (
      <Link to="/" className="inline-flex hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
};
