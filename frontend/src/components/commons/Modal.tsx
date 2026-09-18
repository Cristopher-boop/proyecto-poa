import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '5xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  icon,
  size = 'lg',
  children,
  footer,
  className = '',
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    '3xl': 'max-w-6xl',
    '5xl': 'max-w-7xl',
    full: 'max-w-[96vw]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full ${sizeClasses[size]} max-h-[92vh] flex flex-col rounded-2xl shadow-2xl bg-theme-surface border border-theme-border overflow-hidden ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-theme-border flex items-center justify-between shrink-0 bg-theme-surface">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="p-2.5 rounded-xl bg-theme-primary/10 text-theme-primary shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-theme-main tracking-tight truncate">
                  {title}
                </h3>
                {badge}
              </div>
              {subtitle && (
                <p className="text-xs text-theme-muted mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-border/30 transition-colors shrink-0"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="p-4 sm:p-5 border-t border-theme-border flex items-center justify-end gap-3 shrink-0 bg-theme-base/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
