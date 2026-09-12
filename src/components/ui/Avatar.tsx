import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: 'online' | 'in_meeting' | 'offline';
  isSpeaking?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  status,
  isSpeaking = false,
  className,
}) => {
  const [imageError, setImageError] = useState(false);

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-24 h-24 text-2xl',
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
    '2xl': 'w-5 h-5',
  };

  const statusColors = {
    online: 'bg-emerald-400',
    in_meeting: 'bg-amber-400',
    offline: 'bg-slate-500',
  };

  // Extract initials and deterministic gradient
  const initials = (name || 'User')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'U';

  const GRADIENTS = [
    'from-emerald-600 to-teal-800',
    'from-indigo-600 to-blue-800',
    'from-purple-600 to-indigo-800',
    'from-rose-600 to-pink-800',
    'from-amber-600 to-orange-800',
    'from-cyan-600 to-blue-800',
  ];

  const gradientClass = GRADIENTS[
    (name || 'User')
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0) % GRADIENTS.length
  ];

  return (
    <div className="relative inline-block select-none">
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full overflow-hidden font-semibold text-slate-100 bg-gradient-to-tr border border-slate-700/50 transition-all duration-300',
          gradientClass,
          sizes[size],
          isSpeaking && 'ring-2 ring-brand-400 ring-offset-2 ring-offset-background shadow-glow-sm',
          className
        )}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-bold tracking-tight text-white">{initials}</span>
        )}
      </div>

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-background',
            statusSizes[size],
            statusColors[status]
          )}
          title={`Status: ${status.replace('_', ' ')}`}
        />
      )}
    </div>
  );
};
