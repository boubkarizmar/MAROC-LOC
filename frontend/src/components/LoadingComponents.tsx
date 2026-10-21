import React from 'react';
import { Loader, Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'button' | 'overlay';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  message,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const Icon = variant === 'button' ? Loader : Loader2;

  if (variant === 'overlay') {
    return (
      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}>
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 shadow-xl">
          <Icon className={`${sizeClasses[size]} text-primary-500 animate-spin`} />
          {message && (
            <p className="text-sm text-gray-600 text-center">{message}</p>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Icon className={`${sizeClasses[size]} animate-spin`} />
        {message && <span className="text-sm">{message}</span>}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <Icon className={`${sizeClasses[size]} text-primary-500 animate-spin`} />
      {message && (
        <p className="text-sm text-gray-600 text-center">{message}</p>
      )}
    </div>
  );
};

interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className = ''
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';

  const variantClasses = {
    text: 'h-4',
    rectangular: 'rounded-lg',
    circular: 'rounded-full'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

interface PropertyCardSkeletonProps {
  className?: string;
}

export const PropertyCardSkeleton: React.FC<PropertyCardSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`}>
      <Skeleton variant="rectangular" height={200} className="w-full" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <Skeleton variant="text" width="80%" height={20} />
            <Skeleton variant="text" width="60%" height={16} />
          </div>
          <Skeleton variant="text" width={60} height={20} />
        </div>
        <Skeleton variant="text" width="70%" height={16} />
        <div className="flex gap-4">
          <Skeleton variant="text" width={40} height={16} />
          <Skeleton variant="text" width={40} height={16} />
          <Skeleton variant="text" width={40} height={16} />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton variant="rectangular" width={80} height={32} className="rounded-xl" />
          <Skeleton variant="rectangular" width={80} height={32} className="rounded-xl" />
        </div>
      </div>
    </div>
  );
};

interface SearchSkeletonProps {
  className?: string;
}

export const SearchSkeleton: React.FC<SearchSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <Skeleton variant="rectangular" height={56} className="w-full rounded-2xl" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" width={80} height={36} className="rounded-xl flex-shrink-0" />
        ))}
      </div>
      <Skeleton variant="text" width={120} height={16} />
    </div>
  );
};