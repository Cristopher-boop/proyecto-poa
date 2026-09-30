import React from 'react';

export interface PageHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  tag?: string;
  extraInfo?: string;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  title,
  subtitle,
  tag,
  extraInfo,
  actions,
  className = '',
  children,
}) => {
  return (
    <div
      className={`rounded-2xl border border-theme-border bg-theme-surface p-5 sm:p-6 shadow-sm relative ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {icon && (
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-500 border border-brand-200 dark:bg-brand-900/40 dark:text-brand-200 dark:border-brand-600 flex items-center justify-center shadow-sm shrink-0">
              {icon}
            </div>
          )}

          <div>
            {(tag || extraInfo) && (
              <div className="flex items-center gap-2 mb-1">
                {tag && (
                  <span className="px-2.5 py-0.5 rounded-md bg-theme-primary/10 text-theme-primary text-[10px] font-bold uppercase tracking-wider">
                    {tag}
                  </span>
                )}
                {extraInfo && (
                  <span className="text-[11px] font-medium text-theme-muted">
                    {extraInfo}
                  </span>
                )}
              </div>
            )}

            <h1 className="text-xl sm:text-2xl font-bold font-display text-theme-main tracking-tight">
              {title}
            </h1>

            {subtitle && (
              <p className="text-xs text-theme-muted mt-0.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            {actions}
          </div>
        )}
      </div>

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

