import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "gold" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-primary text-white shadow-primary-sm hover:shadow-primary hover:scale-[1.02] active:scale-[0.98]",
  secondary:
    "bg-[color:var(--color-bg-secondary)] text-[color:var(--color-text-primary)] border border-[color:var(--color-border)] hover:bg-[color:var(--color-bg-tertiary)] active:scale-[0.98]",
  ghost:
    "text-primary-600 hover:bg-primary-50 hover:text-primary-700 dark:text-primary-400 dark:hover:bg-primary-900/30 active:scale-[0.98]",
  gold:
    "bg-gradient-gold text-gray-900 shadow-gold-sm hover:shadow-gold hover:scale-[1.02] active:scale-[0.98]",
  danger:
    "bg-semantic-error-500 text-white hover:bg-semantic-error-600 active:scale-[0.98]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-caption gap-1.5",
  md: "px-6 py-3 text-button gap-2",
  lg: "px-8 py-4 text-body-sm gap-2.5",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        whileTap={isDisabled ? {} : { scale: 0.97 }}
        whileHover={isDisabled ? {} : { scale: 1.01 }}
        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
        className={`
          inline-flex items-center justify-center
          rounded-lg font-semibold
          transition-all duration-150 ease-default
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        )}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
