import React from 'react';
import { VirtualBackground } from '../../types';
import { Sparkles, Ban, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ImageWithFallback } from '../ui/ImageWithFallback';

interface VirtualBackgroundPickerProps {
  selected: VirtualBackground;
  onChange: (bg: VirtualBackground) => void;
}

export const VirtualBackgroundPicker: React.FC<VirtualBackgroundPickerProps> = ({
  selected,
  onChange,
}) => {
  const backgrounds: { id: VirtualBackground; label: string; preview: string; icon?: React.ReactNode }[] = [
    {
      id: 'none',
      label: 'None',
      preview: '',
      icon: <Ban className="w-5 h-5 text-slate-400" />,
    },
    {
      id: 'blur',
      label: 'Soft Blur',
      preview: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=200&auto=format&fit=crop&q=80',
      icon: <Eye className="w-5 h-5 text-indigo-400" />,
    },
    {
      id: 'office',
      label: 'Executive Office',
      preview: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&auto=format&fit=crop&q=80',
    },
    {
      id: 'studio',
      label: 'Creative Studio',
      preview: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=200&auto=format&fit=crop&q=80',
    },
    {
      id: 'room',
      label: 'Modern Minimalist',
      preview: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
        <Sparkles className="w-3.5 h-3.5 text-brand-400" />
        <span>Virtual Backgrounds</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
        {backgrounds.map((bg) => {
          const isSelected = selected === bg.id;

          return (
            <button
              key={bg.id}
              onClick={() => onChange(bg.id)}
              className={cn(
                'group relative rounded-xl overflow-hidden border p-1 text-center transition-all duration-200 flex flex-col items-center justify-center aspect-[4/3]',
                isSelected
                  ? 'border-brand-500 ring-2 ring-brand-500/50 bg-brand-500/10'
                  : 'border-slate-800 hover:border-slate-700 bg-surface-elevated/80'
              )}
            >
              {bg.preview ? (
                <ImageWithFallback
                  src={bg.preview}
                  alt={bg.label}
                  fallbackVariant="media"
                  fallbackText={bg.label}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center rounded-lg bg-slate-900/60">
                  {bg.icon}
                </div>
              )}
              <span className="absolute bottom-1 inset-x-1 text-[10px] font-semibold text-white bg-black/70 backdrop-blur-xs py-0.5 rounded truncate">
                {bg.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
