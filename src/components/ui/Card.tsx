import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface CardProps extends HTMLMotionProps<'div'> {
  interactive?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  className,
  interactive = false,
  glow = false,
  children,
  ...props
}) => {
  return (
    <motion.div
      whileHover={
        interactive
          ? {
              y: -4,
              transition: { duration: 0.2, ease: 'easeOut' },
            }
          : undefined
      }
      className={cn(
        'relative rounded-2xl bg-surface/90 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 p-5 transition-all duration-300 shadow-sm',
        interactive && 'hover:border-slate-400 dark:hover:border-slate-700/80 hover:shadow-lg hover:shadow-slate-900/5 dark:hover:shadow-black/50 cursor-pointer',
        glow && 'hover:border-brand-500/40 hover:shadow-glow-sm',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
