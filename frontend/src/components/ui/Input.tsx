import React from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export type InputSize = "sm" | "md" | "lg";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  helperText?: string;
  error?: string;
  size?: InputSize;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const sizeStyles: Record<InputSize, string> = {
  sm: "px-3 py-2 text-caption",
  md: "px-4 py-3 text-body",
  lg: "px-5 py-4 text-body-lg",
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      size = "md",
      leftIcon,
      rightElement,
      className = "",
      type,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputType = type === "password" && showPassword ? "text" : type;
    const hasError = !!error;

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className="block text-body-sm font-medium text-[color:var(--color-text-primary)] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-tertiary)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`
              w-full rounded-lg
              bg-[color:var(--color-bg-secondary)] text-[color:var(--color-text-primary)]
              border
              placeholder:text-[color:var(--color-text-tertiary)]
              transition-all duration-150 ease-default
              focus:outline-none focus:ring-2 focus:ring-primary-500/20
              disabled:opacity-50 disabled:cursor-not-allowed
              dark:bg-dark-surface
              ${hasError ? "border-semantic-error-500 focus:border-semantic-error-500" : "border-[color:var(--color-border)] focus:border-primary-500"}
              ${leftIcon ? "pl-10" : ""}
              ${rightElement || type === "password" ? "pr-10" : ""}
              ${sizeStyles[size]}
            `}
            {...props}
          />
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-text-secondary)]"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          {rightElement && type !== "password" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {hasError ? (
          <div className="flex items-center gap-1 mt-1.5 text-semantic-error-500 text-caption">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        ) : helperText ? (
          <p className="mt-1.5 text-caption text-[color:var(--color-text-tertiary)]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
