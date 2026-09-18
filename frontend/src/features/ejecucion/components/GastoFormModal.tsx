import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button } from '../../../components/commons';
import { formatMoney } from '../../../utils/formatters';
import { Gasto } from '../../../services/presupuestoService';
import { Receipt, Search, AlertCircle, Check } from 'lucide-react';

interface GastoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  gastoToEdit?: Gasto | null;
  memoriasDisponibles: Array<{
    memoriaId: number;
    codigo: string;
    areaNombre: string;
    seccionNombre: string;
    partidasString: string;
    saldoDisponible: number;
  }>;
  onSave: (payload: {
    memoria: number;
    monto_ejecutado: number;
    fecha_gasto: string;
    comprobante_num?: string;
    observacion?: string;
  }) => Promise<boolean>;
  loading?: boolean;
}

export const GastoFormModal: React.FC<GastoFormModalProps> = ({
  isOpen,
  onClose,
  gastoToEdit,
  memoriasDisponibles,
  onSave,
  loading = false,
}) => {
  const isEditing = Boolean(gastoToEdit);

  const [selectedMemoriaId, setSelectedMemoriaId] = useState<number | ''>('');
  const [monto, setMonto] = useState<number | ''>('');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [comprobante, setComprobante] = useState<string>('');
  const [observacion, setObservacion] = useState<string>('');

  const [searchMemoria, setSearchMemoria] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inicializar estado cuando se abre para editar o crear
  useEffect(() => {
    if (gastoToEdit) {
      setSelectedMemoriaId(gastoToEdit.memoria);
      setMonto(
        typeof gastoToEdit.monto_ejecutado === 'string'
          ? parseFloat(gastoToEdit.monto_ejecutado)
          : gastoToEdit.monto_ejecutado
      );
      setFecha(gastoToEdit.fecha_gasto);
      setComprobante(gastoToEdit.comprobante_num || '');
      setObservacion(gastoToEdit.observacion || '');
    } else {
      setSelectedMemoriaId('');
      setMonto('');
      setFecha(new Date().toISOString().split('T')[0]);
      setComprobante('');
      setObservacion('');
    }
    setErrorMsg(null);
    setSearchMemoria('');
  }, [gastoToEdit, isOpen]);

  // Memoria seleccionada actualmente
  const selectedMemoria = useMemo(() => {
    return memoriasDisponibles.find((m) => m.memoriaId === Number(selectedMemoriaId)) || null;
  }, [memoriasDisponibles, selectedMemoriaId]);

  // Saldo disponible efectivo (si estamos editando, re-sumamos el monto actual del gasto)
  const saldoMaximoPermitido = useMemo(() => {
    if (!selectedMemoria) return 0;
    let base = selectedMemoria.saldoDisponible;
    if (isEditing && gastoToEdit && gastoToEdit.memoria === selectedMemoria.memoriaId) {
      base += parseFloat(String(gastoToEdit.monto_ejecutado) || '0');
    }
    return base;
  }, [selectedMemoria, isEditing, gastoToEdit]);

  // Memorias filtradas en el selector
  const memoriasFiltradas = useMemo(() => {
    const term = searchMemoria.toLowerCase().trim();
    return memoriasDisponibles.filter((m) => {
      // Si estamos editando y esta memoria es la del gasto, incluirla siempre
      if (isEditing && gastoToEdit && m.memoriaId === gastoToEdit.memoria) return true;
      if (!term) return m.saldoDisponible > 0;
      return (
        m.codigo.toLowerCase().includes(term) ||
        m.areaNombre.toLowerCase().includes(term) ||
        m.seccionNombre.toLowerCase().includes(term) ||
        m.partidasString.toLowerCase().includes(term)
      );
    });
  }, [memoriasDisponibles, searchMemoria, isEditing, gastoToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedMemoriaId) {
      setErrorMsg('Debe seleccionar una memoria de cálculo aprobada.');
      return;
    }

    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) {
      setErrorMsg('El monto ejecutado debe ser un número mayor a Bs. 0,00.');
      return;
    }

    if (montoNum > saldoMaximoPermitido) {
      setErrorMsg(
        `El monto (Bs. ${montoNum.toLocaleString('es-BO', { minimumFractionDigits: 2 })}) supera el saldo disponible restante (Bs. ${saldoMaximoPermitido.toLocaleString('es-BO', { minimumFractionDigits: 2 })}).`
      );
      return;
    }

    if (!fecha) {
      setErrorMsg('Debe especificar la fecha de la ejecución.');
      return;
    }

    const success = await onSave({
      memoria: Number(selectedMemoriaId),
      monto_ejecutado: montoNum,
      fecha_gasto: fecha,
      comprobante_num: comprobante.trim() || undefined,
      observacion: observacion.trim() || undefined,
    });

    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Modificar Gasto Ejecutado' : 'Registrar Nueva Ejecución Presupuestaria'}
      subtitle="Imputación directa de fondos contra una Memoria de Cálculo aprobada por Finanzas"
      icon={<Receipt size={22} className="text-rose-600 dark:text-rose-400" />}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            loading={loading}
            disabled={!selectedMemoriaId || !monto || Number(monto) > saldoMaximoPermitido}
            className="shadow-md shadow-rose-600/20 font-bold"
          >
            {isEditing ? 'Guardar Cambios' : 'Confirmar Registro de Gasto'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Paso 1: Selección de Memoria */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-theme-main mb-1.5">
            1. Memoria de Cálculo Aprobada (Destino del Gasto) *
          </label>

          <div className="border border-theme-border rounded-xl p-3 bg-theme-base/40 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
              <input
                type="text"
                placeholder="Filtrar memoria por código, área o partida..."
                value={searchMemoria}
                onChange={(e) => setSearchMemoria(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-theme-surface border border-theme-border rounded-lg text-theme-main outline-none focus:border-rose-500"
              />
            </div>

            <div className="max-h-44 overflow-y-auto divide-y divide-theme-border/50 border border-theme-border/50 rounded-lg bg-theme-surface">
              {memoriasFiltradas.length === 0 ? (
                <div className="py-6 text-center text-xs text-theme-muted">
                  No se encontraron memorias disponibles con saldo.
                </div>
              ) : (
                memoriasFiltradas.map((m) => {
                  const isSelected = m.memoriaId === Number(selectedMemoriaId);
                  return (
                    <button
                      key={m.memoriaId}
                      type="button"
                      onClick={() => {
                        setSelectedMemoriaId(m.memoriaId);
                        setErrorMsg(null);
                      }}
                      className={`w-full p-2.5 text-left flex items-center justify-between gap-3 text-xs transition-colors ${
                        isSelected
                          ? 'bg-rose-500/10 border-l-4 border-l-rose-600 font-medium'
                          : 'hover:bg-theme-border/20'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-theme-main">
                            {m.codigo}
                          </span>
                          <span className="text-[10px] text-theme-muted truncate">
                            {m.areaNombre} • {m.seccionNombre}
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-mono truncate">
                          Partida: {m.partidasString || 'N/A'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-theme-muted block">Disponible</span>
                        <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          {formatMoney(m.saldoDisponible)}
                        </span>
                      </div>

                      {isSelected && <Check size={16} className="text-rose-600 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Panel de Saldo de la Memoria Seleccionada */}
        {selectedMemoria && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-theme-main">Memoria seleccionada:</span>{' '}
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{selectedMemoria.codigo}</span>
              <span className="text-theme-muted ml-2 truncate">({selectedMemoria.areaNombre})</span>
            </div>
            <div className="text-right font-mono font-bold text-emerald-700 dark:text-emerald-300">
              Saldo Máximo: {formatMoney(saldoMaximoPermitido)}
            </div>
          </div>
        )}

        {/* Paso 2: Detalles del Gasto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-1">
              2. Monto Ejecutado (Bs.) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-600 dark:text-rose-400 font-mono font-bold text-sm">
                Bs.
              </span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={monto}
                onChange={(e) => {
                  setMonto(e.target.value === '' ? '' : parseFloat(e.target.value));
                  setErrorMsg(null);
                }}
                placeholder="0.00"
                className="w-full pl-11 pr-3 py-2 text-base font-mono font-black bg-theme-base border-2 border-rose-300 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-300 outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-main mb-1">
              3. Fecha del Gasto *
            </label>
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-theme-base border border-theme-border rounded-xl text-theme-main outline-none focus:ring-2 focus:ring-theme-primary/40 focus:border-theme-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-theme-main mb-1">
            4. Nº de Comprobante / Preventivo / Factura (Opcional)
          </label>
          <input
            type="text"
            value={comprobante}
            onChange={(e) => setComprobante(e.target.value)}
            placeholder="Ej: COMP-2026-0045 o FACT-889"
            className="w-full px-3 py-2 text-xs bg-theme-base border border-theme-border rounded-xl text-theme-main outline-none focus:ring-2 focus:ring-theme-primary/40 focus:border-theme-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-theme-main mb-1">
            5. Objeto / Observación del Gasto (Opcional)
          </label>
          <textarea
            rows={2}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Describa el bien o servicio ejecutado según la memoria técnica..."
            className="w-full px-3 py-2 text-xs bg-theme-base border border-theme-border rounded-xl text-theme-main outline-none focus:ring-2 focus:ring-theme-primary/40 focus:border-theme-primary resize-none"
          />
        </div>
      </form>
    </Modal>
  );
};
