import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, AlertCircle, X } from 'lucide-react';

export interface DropdownItem {
  id: string | number;
  label: string;
  badge?: string;
  sublabel?: string;
  group?: string;
  groupBadge?: string;
  disabled?: boolean;
}

export interface DropdownProps {
  items: DropdownItem[];
  value: string | number | null | undefined;
  onChange: (value: any, item?: DropdownItem) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  error?: boolean;
  emptyMessage?: string;
  icon?: React.ReactNode;
  maxHeight?: string;
  size?: 'sm' | 'md';
}

export const Dropdown: React.FC<DropdownProps> = ({
  items = [],
  value,
  onChange,
  placeholder = 'Seleccionar opción...',
  label,
  required = false,
  searchable,
  searchPlaceholder = 'Buscar...',
  disabled = false,
  className = '',
  triggerClassName = '',
  error = false,
  emptyMessage = 'No se encontraron opciones',
  icon,
  maxHeight = '260px',
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Activar buscador si es explícito o si hay más de 6 elementos
  const isSearchEnabled = searchable !== undefined ? searchable : items.length > 6;

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Autofoco en búsqueda al abrir
  useEffect(() => {
    if (isOpen && isSearchEnabled) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, isSearchEnabled]);

  // Tecla Escape para cerrar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Elemento seleccionado
  const selectedItem = useMemo(() => {
    if (value === null || value === undefined || value === '') return null;
    return items.find((it) => String(it.id) === String(value)) || null;
  }, [items, value]);

  // Filtrado de opciones
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        (it.badge && it.badge.toLowerCase().includes(q)) ||
        (it.sublabel && it.sublabel.toLowerCase().includes(q)) ||
        (it.group && it.group.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  // Agrupamiento si los items definen `group`
  const groupedItems = useMemo(() => {
    const hasGroups = items.some((it) => !!it.group);
    if (!hasGroups) return null;

    const map = new Map<string, { group: string; groupBadge?: string; items: DropdownItem[] }>();
    filteredItems.forEach((it) => {
      const gName = it.group || 'Otras';
      if (!map.has(gName)) {
        map.set(gName, { group: gName, groupBadge: it.groupBadge, items: [] });
      }
      map.get(gName)!.items.push(it);
    });
    return Array.from(map.values());
  }, [items, filteredItems]);

  const handleSelect = (item: DropdownItem) => {
    if (item.disabled) return;
    onChange(item.id, item);
    setIsOpen(false);
    setSearchQuery('');
  };

  const isInvalid = error || (required && !selectedItem);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-theme-muted mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Botón Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 rounded-xl border transition-all text-left ${
          size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs'
        } ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-theme-base border-theme-border'
            : isInvalid
            ? 'border-amber-500/50 bg-amber-500/5 hover:border-amber-500'
            : selectedItem
            ? 'border-theme-border bg-theme-surface hover:border-theme-primary'
            : 'border-theme-border bg-theme-surface hover:border-theme-primary/70'
        } ${isOpen ? 'ring-2 ring-theme-primary/30 border-theme-primary' : ''} ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon && <span className="text-theme-muted shrink-0">{icon}</span>}
          {selectedItem ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {selectedItem.badge && (
                <span className="shrink-0 font-mono font-bold text-[11px] text-theme-primary bg-theme-base px-1.5 py-0.5 rounded border border-theme-border">
                  {selectedItem.badge}
                </span>
              )}
              <span className="flex-1 min-w-0 font-semibold text-theme-main line-clamp-1">
                {selectedItem.label}
              </span>
            </div>
          ) : (
            <span
              className={`flex items-center gap-1.5 line-clamp-1 ${
                isInvalid
                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                  : 'text-theme-muted'
              }`}
            >
              {isInvalid && <AlertCircle size={13} className="shrink-0 text-amber-500" />}
              {placeholder}
            </span>
          )}
        </div>

        <ChevronDown
          size={16}
          className={`shrink-0 text-theme-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-theme-primary' : ''
          }`}
        />
      </button>

      {/* Menú Desplegable Flotante */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 z-50 mt-1.5 bg-theme-surface border border-theme-border rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
          style={{ minWidth: '220px' }}
        >
          {/* Barra de Búsqueda */}
          {isSearchEnabled && (
            <div className="p-2 border-b border-theme-border sticky top-0 bg-theme-surface z-10">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-muted"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-7 pr-7 py-1.5 text-xs rounded-lg border border-theme-border bg-theme-base focus:outline-none focus:border-theme-primary text-theme-main placeholder:text-theme-muted"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Lista de Opciones */}
          <div className="overflow-y-auto divide-y divide-theme-border/30" style={{ maxHeight }}>
            {filteredItems.length === 0 ? (
              <div className="py-6 px-4 text-center text-theme-muted text-xs">
                {emptyMessage}
              </div>
            ) : groupedItems ? (
              groupedItems.map((g, gIdx) => (
                <div key={gIdx} className="border-b border-theme-border/40 last:border-0">
                  {/* Encabezado del Grupo */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-theme-base/80 border-b border-theme-border/40 sticky top-0 z-[5]">
                    {g.groupBadge && (
                      <span className="font-mono text-[10px] font-bold text-theme-muted bg-theme-border/60 px-1 rounded">
                        {g.groupBadge}
                      </span>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted line-clamp-1">
                      {g.group}
                    </span>
                  </div>

                  {/* Items del Grupo */}
                  {g.items.map((it) => {
                    const isSelected = String(it.id) === String(value);
                    return (
                      <button
                        key={it.id}
                        type="button"
                        disabled={it.disabled}
                        onClick={() => handleSelect(it)}
                        className={`w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors ${
                          isSelected
                            ? 'bg-theme-primary/10 hover:bg-theme-primary/15'
                            : it.disabled
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:bg-theme-border/30'
                        }`}
                      >
                        {it.badge && (
                          <span
                            className={`shrink-0 font-mono font-bold text-[11px] px-1.5 py-0.5 rounded-md ${
                              isSelected
                                ? 'bg-theme-primary text-theme-primaryText'
                                : 'bg-theme-base text-theme-primary border border-theme-border'
                            }`}
                          >
                            {it.badge}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs leading-tight ${
                              isSelected ? 'font-bold text-theme-main' : 'text-theme-main'
                            }`}
                          >
                            {it.label}
                          </p>
                          {it.sublabel && (
                            <p className="text-[10px] text-theme-muted mt-0.5 line-clamp-1">
                              {it.sublabel}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <Check size={14} className="shrink-0 text-theme-primary mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            ) : (
              filteredItems.map((it) => {
                const isSelected = String(it.id) === String(value);
                return (
                  <button
                    key={it.id}
                    type="button"
                    disabled={it.disabled}
                    onClick={() => handleSelect(it)}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 text-left transition-colors ${
                      isSelected
                        ? 'bg-theme-primary/10 hover:bg-theme-primary/15'
                        : it.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-theme-border/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {it.badge && (
                        <span
                          className={`shrink-0 font-mono font-bold text-[11px] px-1.5 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-theme-primary text-theme-primaryText'
                              : 'bg-theme-base text-theme-primary border border-theme-border'
                          }`}
                        >
                          {it.badge}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs leading-tight ${
                            isSelected ? 'font-bold text-theme-main' : 'text-theme-main'
                          }`}
                        >
                          {it.label}
                        </p>
                        {it.sublabel && (
                          <p className="text-[10px] text-theme-muted mt-0.5 line-clamp-1">
                            {it.sublabel}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={14} className="shrink-0 text-theme-primary" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
