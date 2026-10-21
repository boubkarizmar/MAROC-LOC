import React from 'react';

interface ScoreMeterProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export const ScoreMeter: React.FC<ScoreMeterProps> = ({
  score,
  size = 48,
  strokeWidth = 4,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return 'var(--color-success-500)';
    if (s >= 60) return 'var(--color-gold-400)';
    if (s >= 40) return 'var(--color-warning-500)';
    return 'var(--color-error-500)';
  };

  const color = getColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-gray-700 dark:text-gray-300">
        {score}
      </span>
    </div>
  );
};
