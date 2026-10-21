import React from "react";

export type BadgeVariant =
  | "primary"
  | "gold"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";
export type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary:
    "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300",
  gold:
    "bg-gold-50 text-gold-700 dark:bg-gold-900/20 dark:text-gold-300",
  success: "bg-semantic-success-50 text-semantic-success-600",
  warning: "bg-semantic-warning-50 text-semantic-warning-600",
  error: "bg-semantic-error-50 text-semantic-error-600",
  info: "bg-semantic-info-50 text-semantic-info-600",
  neutral:
    "bg-[color:var(--color-bg-tertiary)] text-[color:var(--color-text-secondary)]",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px] gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  dot = false,
}) => {
  const dotColors: Record<BadgeVariant, string> = {
    primary: "bg-primary-500",
    gold: "bg-gold-500",
    success: "bg-semantic-success-500",
    warning: "bg-semantic-warning-500",
    error: "bg-semantic-error-500",
    info: "bg-semantic-info-500",
    neutral: "bg-gray-400",
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-semibold
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`}
        />
      )}
      {children}
    </span>
  );
};
