import React from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-brand-50',
  iconColor = 'text-brand-600',
  trend,
  className,
  onClick,
}) => {
  return (
    <Card
      hoverable={Boolean(onClick)}
      className={cn('flex flex-col justify-between relative overflow-hidden', className)}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-500 block">{title}</span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
          )}
        </div>

        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100/80 shadow-xs',
            iconBgColor,
            iconColor
          )}
        >
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs">
          {trend.isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
          )}
          <span
            className={cn(
              'font-bold',
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            )}
          >
            {trend.value}
          </span>
          <span className="text-slate-400">vs periode lalu</span>
        </div>
      )}
    </Card>
  );
};
