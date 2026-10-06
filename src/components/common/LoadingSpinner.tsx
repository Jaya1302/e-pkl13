import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Memuat data...',
  size = 'md',
  fullScreen = false,
  className,
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3 p-8 text-center', className)}>
      <Loader2 className={cn('animate-spin text-brand-600', sizes[size])} />
      {label && <p className="text-xs font-medium text-slate-500">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-xs">
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
