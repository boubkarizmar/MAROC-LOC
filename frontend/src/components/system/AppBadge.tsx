import React from 'react';

interface AppBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

const variantClasses: Record<string, string> = {
  primary:  'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300',
  accent:   'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300',
  success:  'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300',
  warning:  'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300',
  error:    'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300',
  neutral:  'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
};

export const AppBadge: React.FC<AppBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
};
