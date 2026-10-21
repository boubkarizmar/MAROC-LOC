import React from 'react';
import { RADIUS } from '../../design-system/radius';

interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helper?: string;
}

export const AppInput = React.forwardRef<HTMLInputElement, AppInputProps>(
  ({ label, error, icon, helper, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full
              ${icon ? 'pl-10' : 'px-4'} py-3 pr-4
              bg-slate-50 dark:bg-slate-700
              text-slate-900 dark:text-slate-100
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              border ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/20'}
              ${RADIUS.sm}
              outline-none
              transition-all duration-fast
              focus:ring-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helper && !error && (
          <p className="mt-1 text-sm text-slate-500">{helper}</p>
        )}
      </div>
    );
  }
);

AppInput.displayName = 'AppInput';
