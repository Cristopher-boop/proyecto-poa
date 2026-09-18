import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  className = '',
  ...props
}) => {
  const isIconOnly = !children && Boolean(icon);
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variantStyles = {
    primary: 'bg-theme-primary text-theme-primaryText hover:brightness-110 shadow-sm shadow-theme-primary/25 focus:ring-theme-primary',
    secondary: 'bg-theme-base border border-theme-border text-theme-main hover:bg-theme-border/20 focus:ring-theme-border',
    outline: 'border border-theme-primary text-theme-primary hover:bg-theme-primary/10 focus:ring-theme-primary',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/25 focus:ring-rose-500',
    ghost: 'text-theme-muted hover:text-theme-main hover:bg-theme-border/20 focus:ring-theme-border',
  };

  const sizeStyles = {
    sm: isIconOnly ? 'p-1.5' : 'text-xs px-2.5 py-1.5 gap-1.5',
    md: isIconOnly ? 'p-2' : 'text-xs px-4 py-2 gap-2',
    lg: isIconOnly ? 'p-2.5' : 'text-sm px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
