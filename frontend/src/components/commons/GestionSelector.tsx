import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Dropdown, type DropdownItem } from './Dropdown';

export interface BaseGestion {
  id: number;
  anio: number;
  estado?: string;
  estado_display?: string;
}

export interface GestionSelectorProps {
  gestiones: BaseGestion[];
  selectedGestionId: number | null | undefined;
  onSelectGestion: (id: number) => void;
  label?: string;
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
  className?: string;
  dropdownClassName?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

export const GestionSelector: React.FC<GestionSelectorProps> = ({
  gestiones = [],
  selectedGestionId,
  onSelectGestion,
  label = 'Gestión',
  size = 'sm',
  align = 'right',
  className = '',
  dropdownClassName = '',
  triggerClassName = '',
  disabled = false,
}) => {
  const getBadgeStyle = (estado?: string) => {
    switch (estado) {
      case 'EN_EJECUCION':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25';
      case 'FORMULACION':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25';
      case 'CERRADO_FORMULACION':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25';
      case 'FINALIZADO':
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/25';
    }
  };

  const items = useMemo((): DropdownItem[] => {
    return gestiones.map((g) => ({
      id: g.id,
      label: `Gestión ${g.anio}`,
      triggerLabel: `${g.anio}`,
      badge: g.estado_display || (g.estado ? g.estado.replace(/_/g, ' ') : undefined),
      badgeClassName: getBadgeStyle(g.estado),
      badgePosition: 'end',
    }));
  }, [gestiones]);

  return (
    <Dropdown
      items={items}
      value={selectedGestionId}
      onChange={(val) => onSelectGestion(Number(val))}
      placeholder="Seleccionar..."
      icon={<Calendar size={14} className="text-theme-muted shrink-0" />}
      prefix={label ? <span className="text-xs font-semibold text-theme-muted select-none">{label}:</span> : undefined}
      size={size}
      disabled={disabled}
      searchable={false}
      align={align}
      badgePosition="end"
      menuMinWidth="270px"
      className={`inline-block shrink-0 ${className} ${dropdownClassName}`}
      triggerClassName={`!border-theme-border !bg-theme-base hover:!bg-theme-border/20 font-bold text-xs text-theme-main shadow-xs rounded-xl cursor-pointer ${triggerClassName}`}
    />
  );
};
