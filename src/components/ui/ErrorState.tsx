import React from 'react';
import { AlertCircle, RotateCcw, Settings, ArrowLeft } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onSettings?: () => void;
  onBack?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Hardware Permission or Device Error',
  message,
  onRetry,
  onSettings,
  onBack,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-2xl bg-rose-950/20 border border-rose-900/40 text-slate-100',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-rose-200">{title}</h4>
      <p className="text-xs text-rose-300/80 max-w-sm mt-1 mb-5 leading-relaxed">
        {message}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Retry Access
          </Button>
        )}
        {onSettings && (
          <Button
            onClick={onSettings}
            variant="outline"
            size="sm"
            leftIcon={<Settings className="w-3.5 h-3.5" />}
          >
            Settings
          </Button>
        )}
        {onBack && (
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Go Back
          </Button>
        )}
      </div>
    </div>
  );
};
