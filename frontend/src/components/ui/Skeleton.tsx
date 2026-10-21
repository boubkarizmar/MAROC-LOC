import React from "react";

interface SkeletonProps {
  className?: string;
  circle?: boolean;
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  circle = false,
  width,
  height,
}) => {
  return (
    <div
      className={`
        animate-shimmer shimmer
        ${circle ? "rounded-full" : "rounded-md"}
        ${className}
      `}
      style={{
        width: width,
        height: height,
      }}
    />
  );
};

export const PropertyCardSkeleton: React.FC = () => (
  <div className="bg-[color:var(--color-surface)] rounded-xl border border-[color:var(--color-border)] p-0 overflow-hidden">
    <Skeleton width="100%" height={200} className="rounded-none" />
    <div className="p-5 space-y-3">
      <Skeleton width="70%" height={20} />
      <Skeleton width="50%" height={16} />
      <div className="flex gap-2 pt-2">
        <Skeleton width={80} height={28} circle />
        <Skeleton width={80} height={28} circle />
      </div>
    </div>
  </div>
);

export const PropertyListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <PropertyCardSkeleton key={i} />
    ))}
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-[color:var(--color-surface)] rounded-xl border border-[color:var(--color-border)] p-6 space-y-3">
          <Skeleton width={40} height={40} circle />
          <Skeleton width="60%" height={24} />
          <Skeleton width="40%" height={16} />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-[color:var(--color-surface)] rounded-xl border border-[color:var(--color-border)] p-6 space-y-4">
        <Skeleton width="40%" height={24} />
        <Skeleton width="100%" height={300} />
      </div>
      <div className="bg-[color:var(--color-surface)] rounded-xl border border-[color:var(--color-border)] p-6 space-y-4">
        <Skeleton width="60%" height={24} />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={48} />
        ))}
      </div>
    </div>
  </div>
);
