import React, { useState } from 'react';
import { Film, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackVariant?: 'recording' | 'avatar' | 'media' | 'default';
  fallbackText?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = 'Image',
  className,
  fallbackVariant = 'default',
  fallbackText,
  onError,
  ...rest
}) => {
  const [hasError, setHasError] = useState(!src);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // If it was an external image that failed, fallback to local avatar if available
    const nameLower = (fallbackText || alt || '').toLowerCase();
    const target = e.target as HTMLImageElement;
    if (nameLower.includes('hardik') && !target.src.includes('/avatars/hardik.jpg')) {
      target.src = '/avatars/hardik.jpg';
      return;
    }
    if (nameLower.includes('elena') && !target.src.includes('/avatars/elena.jpg')) {
      target.src = '/avatars/elena.jpg';
      return;
    }
    if (nameLower.includes('marcus') && !target.src.includes('/avatars/marcus.jpg')) {
      target.src = '/avatars/marcus.jpg';
      return;
    }
    if (nameLower.includes('sarah') && !target.src.includes('/avatars/sarah.jpg')) {
      target.src = '/avatars/sarah.jpg';
      return;
    }

    setHasError(true);
    if (onError) onError(e);
  };

  if (hasError || !src) {
    if (fallbackVariant === 'recording') {
      return (
        <div
          className={cn(
            'w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-[#15191F] to-[#0B0D10] text-slate-400 p-4 select-none border border-slate-800/80',
            className
          )}
        >
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-2">
            <Film className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold text-slate-300 text-center line-clamp-1">
            {fallbackText || alt || 'CALLIVO Recording'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5">MP4 • 1080p HD</span>
        </div>
      );
    }

    if (fallbackVariant === 'avatar') {
      const nameLower = (fallbackText || alt || '').toLowerCase();
      let localSrc = '';
      if (nameLower.includes('hardik')) localSrc = '/avatars/hardik.jpg';
      else if (nameLower.includes('elena')) localSrc = '/avatars/elena.jpg';
      else if (nameLower.includes('marcus')) localSrc = '/avatars/marcus.jpg';
      else if (nameLower.includes('sarah')) localSrc = '/avatars/sarah.jpg';

      if (localSrc) {
        return (
          <img
            src={localSrc}
            alt={alt}
            className={className}
            {...rest}
          />
        );
      }

      const initials = (fallbackText || alt || 'User')
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      return (
        <div
          className={cn(
            'w-full h-full flex items-center justify-center bg-gradient-to-tr from-brand-600 to-indigo-800 text-white font-bold select-none text-xs',
            className
          )}
        >
          <span>{initials}</span>
        </div>
      );
    }

    // Default media placeholder
    return (
      <div
        className={cn(
          'w-full h-full flex flex-col items-center justify-center bg-surface-elevated text-slate-400 p-4 select-none',
          className
        )}
      >
        <ImageIcon className="w-6 h-6 text-slate-500 mb-1" />
        <span className="text-[10px] text-slate-400 text-center">{fallbackText || alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={handleError}
      className={className}
      {...rest}
    />
  );
};
