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
  className = '',
  dropdownClassName = '',
  triggerClassName = '',
  disabled = false,
}) => {
  const items = useMemo((): DropdownItem[] => {
    return gestiones.map((g) => ({
      id: g.id,
      label: `Gestión ${g.anio}`,
      triggerLabel: `Gestión ${g.anio}`,
      badge: g.estado_display || undefined,
      sublabel: g.estado_display ? `Estado: ${g.estado_display}` : undefined,
    }));
  }, [gestiones]);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-theme-border bg-theme-base text-theme-main hover:bg-theme-border/20 transition-all shadow-sm shrink-0 ${className}`}
    >
      <Calendar size={14} className="text-theme-muted shrink-0" />
      <span className="text-xs font-semibold text-theme-muted shrink-0 select-none">
        {label}:
      </span>
      <Dropdown
        items={items}
        value={selectedGestionId}
        onChange={(val) => onSelectGestion(Number(val))}
        placeholder="Seleccionar..."
        size={size}
        disabled={disabled}
        searchable={false}
        menuMinWidth="210px"
        className={dropdownClassName || 'w-auto'}
        triggerClassName={`!border-0 !bg-transparent !p-0 font-bold text-xs text-theme-main !shadow-none !ring-0 hover:text-theme-primary cursor-pointer ${triggerClassName}`}
      />
    </div>
  );
};
