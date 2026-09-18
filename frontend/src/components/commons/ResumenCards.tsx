import React from 'react';

export interface ResumenCardItem {
  id?: string | number;
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon: React.ReactNode;
  color?: 'blue' | 'amber' | 'emerald' | 'rose' | 'indigo' | 'purple' | 'primary';
  progress?: {
    value: number; // Porcentaje de 0 a 100
    label?: string;
    maxLabel?: string;
    colorClass?: string;
  };
}

export interface ResumenCardsProps {
  items: ResumenCardItem[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export const ResumenCards: React.FC<ResumenCardsProps> = ({
  items,
  columns = 4,
  className = '',
}) => {
  const colorStyles = {
    blue: {
      bgIcon: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      textValue: 'text-theme-main',
      bar: 'bg-blue-500',
      cardBorder: 'border-theme-border',
      cardBg: '',
    },
    amber: {
      bgIcon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      textValue: 'text-amber-600 dark:text-amber-400',
      bar: 'bg-amber-500',
      cardBorder: 'border-theme-border',
      cardBg: '',
    },
    emerald: {
      bgIcon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      textValue: 'text-emerald-600 dark:text-emerald-400',
      bar: 'bg-emerald-500',
      cardBorder: 'border-theme-border',
      cardBg: '',
    },
    rose: {
      bgIcon: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      textValue: 'text-rose-600 dark:text-rose-400',
      bar: 'bg-rose-500',
      cardBorder: 'border-rose-200/80 dark:border-rose-900/40',
      cardBg: 'bg-rose-500/[0.02]',
    },
    indigo: {
      bgIcon: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      textValue: 'text-indigo-600 dark:text-indigo-400',
      bar: 'bg-indigo-500',
      cardBorder: 'border-theme-border',
      cardBg: '',
    },
    purple: {
      bgIcon: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      textValue: 'text-purple-600 dark:text-purple-400',
      bar: 'bg-purple-500',
      cardBorder: 'border-theme-border',
      cardBg: '',
    },
    primary: {
      bgIcon: 'bg-theme-primary/10 text-theme-primary',
      textValue: 'text-theme-main',
      bar: 'bg-theme-primary',
      cardBorder: 'border-theme-border',
      cardBg: '',
    },
  };

  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${colClasses[columns]} gap-3.5 mb-5 ${className}`}>
      {items.map((item, idx) => {
        const theme = colorStyles[item.color || 'primary'];
        const hasProgress = Boolean(item.progress);

        return (
          <div
            key={item.id ?? idx}
            className={`card p-3.5 sm:p-4 bg-theme-surface border ${theme.cardBorder || 'border-theme-border'} ${theme.cardBg || ''} rounded-2xl shadow-sm flex flex-col justify-between`}
          >
            {/* Cabecera de la tarjeta: Título e Ícono */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted">
                {item.title}
              </span>
              <div className={`p-1.5 rounded-lg ${theme.bgIcon}`}>
                {item.icon}
              </div>
            </div>

            {/* Monto Principal */}
            <p className={`text-xl sm:text-2xl font-bold ${theme.textValue} mt-2 tracking-tight whitespace-nowrap overflow-x-auto no-scrollbar`}>
              {item.value}
            </p>
            {item.subtitle && (
              <p className="text-xs text-theme-muted mt-0.5 whitespace-nowrap">
                {item.subtitle}
              </p>
            )}

            {/* Barra de Progreso opcional */}
            {hasProgress && item.progress && (
              <div className="mt-2">
                <div className="w-full bg-theme-border/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`${item.progress.colorClass || theme.bar} h-full rounded-full transition-all duration-500`}
                    style={{
                      width: `${Math.min(100, Math.max(0, item.progress.value))}%`,
                    }}
                  />
                </div>
                {(item.progress.label || item.progress.maxLabel) && (
                  <div className="flex justify-between text-[10px] text-theme-muted mt-0.5 font-mono">
                    <span>{item.progress.label || '0%'}</span>
                    <span>{item.progress.maxLabel || '100%'}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
