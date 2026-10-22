import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRightLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { Area, MemoriaCalculo, CrearModificacionPayload } from '../../../services/presupuestoService';
import { Modal, Button, Dropdown, DropdownItem } from '../../../components/commons';
import alertService from '../../../utils/alerts';

interface FilaItem {
  id: string;
  memoriaId: number | '';
  monto: number | '';
}

interface NuevaModificacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CrearModificacionPayload) => Promise<void>;
  areas: Area[];
  memorias: MemoriaCalculo[];
  selectedGestionId: number | null;
  gestionAnio?: number;
  isGestionBloqueada: boolean;
  userAreaId?: number | null;
  userAreaNombre?: string | null;
  isAdmin: boolean;
  isGerente: boolean;
  actionLoading?: boolean;
}

export const NuevaModificacionModal: React.FC<NuevaModificacionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  areas,
  memorias,
  selectedGestionId,
  gestionAnio,
  isGestionBloqueada,
  userAreaId,
  userAreaNombre,
  isAdmin,
  isGerente,
  actionLoading = false,
}) => {
  const [modalAreaId, setModalAreaId] = useState<number | ''>('');
  const [motivo, setMotivo] = useState<string>('');
  const [filasOrigen, setFilasOrigen] = useState<FilaItem[]>([
    { id: 'orig-1', memoriaId: '', monto: '' },
  ]);
  const [filasDestino, setFilasDestino] = useState<FilaItem[]>([
    { id: 'dest-1', memoriaId: '', monto: '' },
  ]);

  // Inicializar área al abrir
  useEffect(() => {
    if (isOpen) {
      if (isGerente && !isAdmin) {
        setModalAreaId(userAreaId || '');
      } else {
        setModalAreaId(areas[0]?.id || '');
      }
      setMotivo('');
      setFilasOrigen([{ id: `orig-${Date.now()}-1`, memoriaId: '', monto: '' }]);
      setFilasDestino([{ id: `dest-${Date.now()}-1`, memoriaId: '', monto: '' }]);
    }
  }, [isOpen, isGerente, isAdmin, userAreaId, areas]);

  const formatMoney = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 2 }).format(num || 0);
  };

  const getSaldo = (m?: MemoriaCalculo | null) => {
    if (!m) return 0;
    return parseFloat(m.saldo_disponible || m.total_disponible || '0');
  };

  // Memorias Aprobadas del Área seleccionada
  const memoriasAreaModal = useMemo(() => {
    if (!modalAreaId) return [];
    const areaSeleccionada = areas.find((a) => a.id === Number(modalAreaId));
    return (Array.isArray(memorias) ? memorias : []).filter((m) => {
      const matchArea =
        m.area_id === Number(modalAreaId) ||
        (areaSeleccionada &&
          m.area_nombre &&
          m.area_nombre.trim().toLowerCase() === areaSeleccionada.nombre.trim().toLowerCase());
      const matchEstado = ['APROBADO_FINANZAS', 'APROBADO_GERENCIA', 'APROBADO_PLANIFICACION'].includes(m.estado);
      return matchArea && matchEstado;
    });
  }, [memorias, modalAreaId, areas]);

  // Items formateados para el componente Dropdown de Áreas
  const areaDropdownItems: DropdownItem[] = useMemo(() => {
    return areas.map((a) => ({
      id: a.id,
      label: a.nombre,
      badge: a.codigo,
      badgeClassName: 'bg-theme-border/60 text-theme-main font-mono text-[10px]',
      sublabel: `${a.tipo || 'Área'} institucional`,
    }));
  }, [areas]);

  // Items formateados para el componente Dropdown de Memorias Cedentes
  const memoriasCedentesItems: DropdownItem[] = useMemo(() => {
    return memoriasAreaModal.map((m) => {
      const d = getSaldo(m);
      return {
        id: m.id,
        label: `Partida ${m.partida_codigo || 'S/P'}${m.partida_nombre ? ` - ${m.partida_nombre}` : ''}`,
        badge: m.codigo,
        badgeClassName: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 font-mono text-[10px] font-bold',
        sublabel: `Saldo disponible: ${formatMoney(d)}`,
      };
    });
  }, [memoriasAreaModal]);

  // Items formateados para el componente Dropdown de Memorias Receptoras
  const memoriasReceptorasItems: DropdownItem[] = useMemo(() => {
    return memoriasAreaModal.map((m) => {
      const d = getSaldo(m);
      return {
        id: m.id,
        label: `Partida ${m.partida_codigo || 'S/P'}${m.partida_nombre ? ` - ${m.partida_nombre}` : ''}`,
        badge: m.codigo,
        badgeClassName: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-bold',
        sublabel: `Saldo actual: ${formatMoney(d)}`,
      };
    });
  }, [memoriasAreaModal]);

  // Totales de comprobación en vivo
  const totalCedido = useMemo(() => {
    return filasOrigen.reduce((acc, f) => acc + (parseFloat(String(f.monto)) || 0), 0);
  }, [filasOrigen]);

  const totalRecibido = useMemo(() => {
    return filasDestino.reduce((acc, f) => acc + (parseFloat(String(f.monto)) || 0), 0);
  }, [filasDestino]);

  const diferencia = useMemo(() => {
    return Math.abs(totalCedido - totalRecibido);
  }, [totalCedido, totalRecibido]);

  const isCuadrado = useMemo(() => {
    return totalCedido > 0 && totalRecibido > 0 && diferencia < 0.01;
  }, [totalCedido, totalRecibido, diferencia]);

  function handleAddFilaOrigen() {
    setFilasOrigen((prev) => [...prev, { id: `orig-${Date.now()}-${prev.length + 1}`, memoriaId: '', monto: '' }]);
  }

  function handleRemoveFilaOrigen(id: string) {
    if (filasOrigen.length <= 1) {
      alertService.warning('Validación', 'Debe haber al menos una partida cedente.');
      return;
    }
    setFilasOrigen((prev) => prev.filter((f) => f.id !== id));
  }

  function handleAddFilaDestino() {
    setFilasDestino((prev) => [...prev, { id: `dest-${Date.now()}-${prev.length + 1}`, memoriaId: '', monto: '' }]);
  }

  function handleRemoveFilaDestino(id: string) {
    if (filasDestino.length <= 1) {
      alertService.warning('Validación', 'Debe haber al menos una partida receptora.');
      return;
    }
    setFilasDestino((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isGestionBloqueada) {
      alertService.error('Error', 'Solo se pueden realizar modificaciones en gestiones En Ejecución.');
      return;
    }
    if (!modalAreaId) {
      alertService.error('Validación', 'Selecciona el área organizacional.');
      return;
    }
    if (!motivo.trim()) {
      alertService.error('Validación', 'Ingresa la justificación técnica de la modificación presupuestaria.');
      return;
    }

    // Validar orígenes
    for (let i = 0; i < filasOrigen.length; i++) {
      const f = filasOrigen[i];
      if (!f.memoriaId) {
        alertService.error('Validación', `Selecciona la partida y memoria cedente en la fila ${i + 1}.`);
        return;
      }
      const montoNum = parseFloat(String(f.monto));
      if (!montoNum || montoNum <= 0) {
        alertService.error('Validación', `Ingresa un monto válido mayor a 0 en la partida cedente ${i + 1}.`);
        return;
      }
      const memObj = memoriasAreaModal.find((m) => m.id === Number(f.memoriaId));
      const disp = getSaldo(memObj);
      if (montoNum > disp) {
        alertService.error(
          'Saldo Insuficiente',
          `El monto en la partida cedente ${i + 1} (${formatMoney(montoNum)}) excede el saldo disponible (${formatMoney(disp)}).`
        );
        return;
      }
    }

    // Validar destinos
    for (let i = 0; i < filasDestino.length; i++) {
      const f = filasDestino[i];
      if (!f.memoriaId) {
        alertService.error('Validación', `Selecciona la partida y memoria receptora en la fila ${i + 1}.`);
        return;
      }
      const montoNum = parseFloat(String(f.monto));
      if (!montoNum || montoNum <= 0) {
        alertService.error('Validación', `Ingresa un monto válido mayor a 0 en la partida receptora ${i + 1}.`);
        return;
      }
    }

    // Validar duplicados y solapamientos
    const origMemIds = filasOrigen.map((f) => Number(f.memoriaId));
    const destMemIds = filasDestino.map((f) => Number(f.memoriaId));

    if (new Set(origMemIds).size !== origMemIds.length) {
      alertService.error('Validación', 'No puedes repetir la misma memoria o partida cedente.');
      return;
    }
    if (new Set(destMemIds).size !== destMemIds.length) {
      alertService.error('Validación', 'No puedes repetir la misma memoria o partida receptora.');
      return;
    }

    const solapadas = origMemIds.filter((id) => destMemIds.includes(id));
    if (solapadas.length > 0) {
      alertService.error('Validación', 'Una memoria no puede ser simultáneamente cedente y receptora en la misma modificación.');
      return;
    }

    // Validar suma cero
    if (!isCuadrado) {
      alertService.error(
        'Operación Descuadrada',
        `Total Cedido (${formatMoney(totalCedido)}) ≠ Total Recibido (${formatMoney(totalRecibido)}). Diferencia: ${formatMoney(diferencia)}.`
      );
      return;
    }

    const confirm = await alertService.confirm({
      title: 'Confirmar Solicitud a Presupuestos',
      text: `¿Desea enviar esta solicitud por un importe compensado de ${formatMoney(
        totalCedido
      )}? Quedará "En Espera" hasta el visto bueno de Presupuestos (Lic. Acha).`,
      icon: 'question',
      confirmButtonText: 'Sí, enviar a Presupuestos',
    });
    if (!confirm) return;

    await onSubmit({
      gestion_id: Number(selectedGestionId),
      area_id: Number(modalAreaId),
      motivo: motivo.trim(),
      origenes: filasOrigen.map((f) => ({
        memoria_id: Number(f.memoriaId),
        monto: parseFloat(String(f.monto)),
      })),
      destinos: filasDestino.map((f) => ({
        memoria_id: Number(f.memoriaId),
        monto: parseFloat(String(f.monto)),
      })),
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Solicitud de Modificación Presupuestaria Intra-Área"
      subtitle={`Reasignación compensada de saldos entre partidas • Gestión ${gestionAnio || 'Actual'}`}
      icon={<ArrowRightLeft className="text-theme-primary" size={24} />}
      size="3xl"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={actionLoading || !isCuadrado}
            loading={actionLoading}
            icon={<CheckCircle2 size={16} />}
          >
            Enviar a Presupuestos (En Espera)
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner Explicativo del Flujo Directo */}
        <div className="p-3.5 rounded-xl bg-theme-primary/10 border border-theme-primary/20 text-theme-main text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-theme-primary">
            <ShieldCheck size={16} />
            <span>Flujo Directo Área ➔ Presupuestos</span>
          </div>
          <p className="text-[11px] text-theme-muted">
            Esta modificación es solicitada directamente por la Gerencia de Área hacia Presupuestos (Lic. Acha). Una vez
            registrada, quedará en estado <strong>En Espera</strong> hasta su aprobación oficial definitiva. Los saldos no se
            moverán hasta que Presupuestos dé su visto bueno.
          </p>
        </div>

        {/* 1. Área Organizacional Solicitante */}
        <div>
          <label className="block text-xs font-semibold uppercase text-theme-muted mb-1.5">
            1. Área Organizacional Solicitante *
          </label>
          {isGerente && !isAdmin ? (
            <div className="p-3 rounded-xl border border-theme-border bg-theme-base/60 text-xs font-semibold text-theme-main flex items-center justify-between">
              <span>{areas.find((a) => a.id === Number(modalAreaId))?.nombre || userAreaNombre || 'Área del Gerente'}</span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-theme-border/60">
                {areas.find((a) => a.id === Number(modalAreaId))?.codigo || 'ÁREA'}
              </span>
            </div>
          ) : (
            <Dropdown
              items={areaDropdownItems}
              value={modalAreaId}
              onChange={(val) => {
                setModalAreaId(val ? Number(val) : '');
                setFilasOrigen([{ id: `orig-${Date.now()}-1`, memoriaId: '', monto: '' }]);
                setFilasDestino([{ id: `dest-${Date.now()}-1`, memoriaId: '', monto: '' }]);
              }}
              placeholder="Seleccionar Área Organizacional..."
              searchable={true}
              searchPlaceholder="Buscar área..."
            />
          )}
        </div>

        {/* 2. Paneles Dobles con Dropdowns Institucionales: Cedentes (-) vs Receptoras (+) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Panel Izquierdo: Orígenes / Cedentes */}
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.02] flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-theme-border mb-3">
                <div>
                  <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                    <span>(-) Partidas Cedentes (Salida)</span>
                  </h4>
                  <p className="text-[10px] text-theme-muted">De qué partidas y memorias se disminuye saldo</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddFilaOrigen}
                  className="text-[11px] font-semibold text-theme-primary hover:underline flex items-center gap-1"
                >
                  <Plus size={13} /> Agregar Partida
                </button>
              </div>

              <div className="space-y-3">
                {filasOrigen.map((fila, idx) => {
                  const memSeleccionada = memoriasAreaModal.find((m) => m.id === Number(fila.memoriaId));
                  const disp = getSaldo(memSeleccionada);
                  const montoNum = parseFloat(String(fila.monto)) || 0;
                  const excede = montoNum > disp;

                  return (
                    <div key={fila.id} className="p-3 rounded-lg border border-theme-border bg-theme-surface space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                          Partida Cedente #{idx + 1}
                        </span>
                        {filasOrigen.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFilaOrigen(fila.id)}
                            className="text-rose-500 hover:text-rose-700 transition-colors p-1"
                            title="Eliminar fila"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Dropdown Desplegable Institucional para Seleccionar Partida/Memoria */}
                      <Dropdown
                        items={memoriasCedentesItems}
                        value={fila.memoriaId || null}
                        onChange={(val) => {
                          const numVal = val ? Number(val) : '';
                          setFilasOrigen((prev) =>
                            prev.map((f) => (f.id === fila.id ? { ...f, memoriaId: numVal } : f))
                          );
                        }}
                        placeholder="Seleccionar Partida y Memoria..."
                        searchable={true}
                        searchPlaceholder="Buscar por código de memoria o partida..."
                        emptyMessage="No hay memorias disponibles en esta área"
                        size="sm"
                      />

                      {memSeleccionada && (
                        <div className="flex items-center justify-between text-[11px] px-1">
                          <span className="text-theme-muted font-mono">
                            Saldo Disponible: <strong className="text-emerald-600">{formatMoney(disp)}</strong>
                          </span>
                          {excede && (
                            <span className="text-rose-600 font-bold text-[10px]">¡Excede saldo disponible!</span>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-semibold text-theme-muted uppercase mb-1">
                          Monto a Ceder (Bs.) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={fila.monto}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                            setFilasOrigen((prev) =>
                              prev.map((f) => (f.id === fila.id ? { ...f, monto: val } : f))
                            );
                          }}
                          className={`input-theme text-xs font-mono font-bold ${
                            excede ? 'border-rose-500 focus:border-rose-500' : ''
                          }`}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subtotal Cedido */}
            <div className="mt-4 pt-3 border-t border-theme-border flex items-center justify-between font-bold text-xs">
              <span className="text-theme-muted">Total Cedido:</span>
              <span className="font-mono text-rose-600 text-sm">{formatMoney(totalCedido)}</span>
            </div>
          </div>

          {/* Panel Derecho: Destinos / Receptores */}
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-theme-border mb-3">
                <div>
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                    <span>(+) Partidas Receptoras (Ingreso)</span>
                  </h4>
                  <p className="text-[10px] text-theme-muted">A qué partidas y memorias se transferirá el saldo</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddFilaDestino}
                  className="text-[11px] font-semibold text-theme-primary hover:underline flex items-center gap-1"
                >
                  <Plus size={13} /> Agregar Partida
                </button>
              </div>

              <div className="space-y-3">
                {filasDestino.map((fila, idx) => {
                  const memSeleccionada = memoriasAreaModal.find((m) => m.id === Number(fila.memoriaId));
                  const disp = getSaldo(memSeleccionada);

                  return (
                    <div key={fila.id} className="p-3 rounded-lg border border-theme-border bg-theme-surface space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                          Partida Receptora #{idx + 1}
                        </span>
                        {filasDestino.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFilaDestino(fila.id)}
                            className="text-rose-500 hover:text-rose-700 transition-colors p-1"
                            title="Eliminar fila"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Dropdown Desplegable Institucional para Seleccionar Partida/Memoria */}
                      <Dropdown
                        items={memoriasReceptorasItems}
                        value={fila.memoriaId || null}
                        onChange={(val) => {
                          const numVal = val ? Number(val) : '';
                          setFilasDestino((prev) =>
                            prev.map((f) => (f.id === fila.id ? { ...f, memoriaId: numVal } : f))
                          );
                        }}
                        placeholder="Seleccionar Partida y Memoria..."
                        searchable={true}
                        searchPlaceholder="Buscar por código de memoria o partida..."
                        emptyMessage="No hay memorias disponibles en esta área"
                        size="sm"
                      />

                      {memSeleccionada && (
                        <p className="text-[11px] text-theme-muted font-mono px-1">
                          Saldo Actual: <strong className="text-theme-main">{formatMoney(disp)}</strong>
                        </p>
                      )}

                      <div>
                        <label className="block text-[10px] font-semibold text-theme-muted uppercase mb-1">
                          Monto a Incrementar (Bs.) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={fila.monto}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                            setFilasDestino((prev) =>
                              prev.map((f) => (f.id === fila.id ? { ...f, monto: val } : f))
                            );
                          }}
                          className="input-theme text-xs font-mono font-bold"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subtotal Recibido */}
            <div className="mt-4 pt-3 border-t border-theme-border flex items-center justify-between font-bold text-xs">
              <span className="text-theme-muted">Total Recibido:</span>
              <span className="font-mono text-emerald-600 text-sm">{formatMoney(totalRecibido)}</span>
            </div>
          </div>
        </div>

        {/* 3. Barra de Cuadre en Tiempo Real (Suma Cero) */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
            isCuadrado
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
          }`}
        >
          <div className="flex items-center gap-3">
            {isCuadrado ? (
              <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={24} className="text-amber-600 shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">
                {isCuadrado ? '¡Operación Compensada Cuadrada!' : 'Diferencia en Cuadre Presupuestario'}
              </p>
              <p className="text-[11px] opacity-90 mt-0.5">
                {isCuadrado
                  ? 'El total cedido coincide exactamente con el total recibido (suma cero).'
                  : totalCedido > totalRecibido
                  ? `Sobran Bs. ${diferencia.toFixed(2)} por asignar en las partidas receptoras.`
                  : totalRecibido > totalCedido
                  ? `Faltan Bs. ${diferencia.toFixed(2)} por debitar en las partidas cedentes.`
                  : 'Ingresa los montos en ambas columnas.'}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase font-bold text-theme-muted">Diferencia</p>
            <p className="text-base font-mono font-bold">{formatMoney(diferencia)}</p>
          </div>
        </div>

        {/* 4. Justificación Técnica / Motivo */}
        <div>
          <label className="block text-xs font-semibold uppercase text-theme-muted mb-1">
            2. Justificación Técnica Institucional *
          </label>
          <textarea
            required
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="input-theme text-xs"
            placeholder="Explica la necesidad técnica y el respaldo de la modificación presupuestaria para la Lic. Acha..."
          />
        </div>
      </form>
    </Modal>
  );
};
