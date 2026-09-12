import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'control' | 'control-active';
  size?: 'sm' | 'md' | 'lg';
  label: string; // for accessibility
  badge?: number | string;
  isActive?: boolean;
  children: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = 'secondary',
      size = 'md',
      label,
      badge,
      isActive,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'relative inline-flex items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none select-none';

    const variants = {
      primary: 'bg-brand-600 hover:bg-brand-500 text-white shadow-sm shadow-brand-600/20',
      secondary: 'bg-surface-elevated hover:bg-surface-hover text-slate-300 hover:text-white border border-slate-700/60',
      ghost: 'bg-transparent hover:bg-surface-hover text-slate-400 hover:text-slate-100',
      danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/20',
      control: 'bg-surface-elevated/90 hover:bg-surface-hover text-slate-200 border border-slate-700/60 backdrop-blur-md',
      'control-active': 'bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-500/60 backdrop-blur-md shadow-sm',
    };

    const sizes = {
      sm: 'w-8 h-8 p-1.5',
      md: 'w-10 h-10 p-2',
      lg: 'w-12 h-12 p-3',
    };

    const activeStyle = isActive ? 'ring-2 ring-brand-500 bg-brand-500/20 text-brand-300' : '';

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled ? 1 : 0.94 }}
        aria-label={label}
        title={label}
        className={cn(baseStyles, variants[variant], sizes[size], activeStyle, className)}
        disabled={disabled}
        {...props}
      >
        {children}
        {badge !== undefined && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-brand-500 text-white rounded-full flex items-center justify-center border-2 border-background shadow-sm">
            {badge}
          </span>
        )}
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';
