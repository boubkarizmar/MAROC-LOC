import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  hover?: boolean;
  glow?: "none" | "primary" | "gold";
  padding?: "none" | "sm" | "md" | "lg";
}

const glowStyles = {
  none: "",
  primary: "hover:shadow-primary hover:border-primary-200",
  gold: "hover:shadow-gold hover:border-gold-200",
};

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { children, hover = true, glow = "none", padding = "md", className = "", ...props },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        whileHover={
          hover
            ? { y: -4, transition: { duration: 0.25 } }
            : {}
        }
        className={`
          bg-[color:var(--color-surface)] rounded-xl
          border border-[color:var(--color-border)]
          shadow-md
          transition-shadow duration-250 ease-default
          ${hover ? "cursor-pointer" : ""}
          ${glowStyles[glow]}
          ${paddingStyles[padding]}
          ${className}
        `}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

export const CardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <h3 className={`text-h4 text-[color:var(--color-text-primary)] ${className}`}>
    {children}
  </h3>
);

export const CardDescription: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <p className={`text-body-sm text-[color:var(--color-text-secondary)] mt-1 ${className}`}>
    {children}
  </p>
);

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`mt-4 pt-4 border-t border-[color:var(--color-border)] ${className}`}>
    {children}
  </div>
);
