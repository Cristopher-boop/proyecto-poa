import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/commons/Modal';
import { Button } from '../../../components/commons/Button';
import { PresupuestoArea, ajustarTechoArea } from '../../../services/presupuestoService';
import alertService from '../../../utils/alerts';
import { Wallet, AlertTriangle, CheckCircle2, TrendingDown, ArrowRight } from 'lucide-react';

interface AjustarTechoModalProps {
  isOpen: boolean;
  onClose: () => void;
  presupuesto: PresupuestoArea | null;
  onSuccess: () => void;
}

export const AjustarTechoModal: React.FC<AjustarTechoModalProps> = ({
  isOpen,
  onClose,
  presupuesto,
  onSuccess,
}) => {
  const [nuevoTecho, setNuevoTecho] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (presupuesto) {
      setNuevoTecho(presupuesto.monto_inicial || '');
      setMotivo(presupuesto.motivo_reduccion || '');
    } else {
      setNuevoTecho('');
      setMotivo('');
    }
  }, [presupuesto, isOpen]);

  if (!presupuesto) return null;

  const techoActualNum = parseFloat(presupuesto.monto_inicial || '0');
  const nuevoTechoNum = parseFloat(nuevoTecho || '0');
  const esReduccion = !isNaN(nuevoTechoNum) && nuevoTechoNum < techoActualNum;
  const diferencia = nuevoTechoNum - techoActualNum;

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(nuevoTechoNum) || nuevoTechoNum < 0) {
      alertService.error('Monto Inválido', 'El nuevo techo debe ser un número mayor o igual a cero.');
      return;
    }

    if (esReduccion) {
      const confirmed = await alertService.confirm({
        title: '¿Confirmar Reducción de Techo?',
        text: `Está reduciendo el techo de ${presupuesto.area_nombre} de ${formatMoney(techoActualNum)} a ${formatMoney(nuevoTechoNum)} (Recorte de ${formatMoney(Math.abs(diferencia))}). Se enviará una alerta obligatoria a la gerencia para que adecúe sus Memorias de Cálculo con Pase Directo.`,
        icon: 'warning',
        confirmButtonText: 'Sí, aplicar reducción',
        cancelButtonText: 'Cancelar',
        isDanger: true,
      });
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      const res = await ajustarTechoArea(presupuesto.id, {
        monto_inicial: nuevoTechoNum,
        motivo_reduccion: motivo.trim() || (esReduccion ? 'Ajuste / Recorte de techo presupuestario POA' : undefined),
      });
      alertService.success('Techo Actualizado', res.message);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error ajustando techo:', err);
      alertService.error(
        'Error',
        err?.response?.data?.error || 'No se pudo actualizar el techo presupuestario.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Fijar / Ajustar Techo Presupuestario"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cabecera Informativa del Área */}
        <div className="p-3.5 rounded-xl bg-theme-base/60 border border-theme-border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
              {presupuesto.area_codigo}
            </span>
            <h4 className="text-sm font-bold text-theme-main mt-1">{presupuesto.area_nombre}</h4>
            <p className="text-xs text-theme-muted">Gestión fiscal {presupuesto.gestion_anio}</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-theme-muted uppercase font-semibold">Techo Actual</span>
            <p className="text-base font-bold text-theme-main">{formatMoney(techoActualNum)}</p>
          </div>
        </div>

        {/* Campo Nuevo Techo */}
        <div>
          <label className="block text-xs font-bold text-theme-main mb-1.5">
            Nuevo Techo Presupuestario (Bs.) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-bold text-theme-muted">Bs.</span>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={nuevoTecho}
              onChange={(e) => setNuevoTecho(e.target.value)}
              placeholder="0.00"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-theme-border bg-theme-surface text-theme-main focus:outline-none focus:ring-2 focus:ring-theme-primary transition-all font-semibold"
            />
          </div>
        </div>

        {/* Indicador Dinámico de Variación */}
        {nuevoTecho && !isNaN(nuevoTechoNum) && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
              esReduccion
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                : nuevoTechoNum > techoActualNum
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-theme-base/40 border-theme-border text-theme-muted'
            }`}
          >
            {esReduccion ? (
              <TrendingDown size={18} className="shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            ) : nuevoTechoNum > techoActualNum ? (
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            ) : (
              <Wallet size={18} className="shrink-0 text-theme-muted mt-0.5" />
            )}
            <div>
              <p className="font-bold">
                {esReduccion
                  ? `Recorte de Presupuesto: -${formatMoney(Math.abs(diferencia))}`
                  : nuevoTechoNum > techoActualNum
                  ? `Incremento de Techo: +${formatMoney(diferencia)}`
                  : 'Sin variación en el techo presupuestario'}
              </p>
              {esReduccion && (
                <p className="text-[11px] opacity-90 mt-0.5">
                  ⚠️ Se activará la <strong>Alerta Obligatoria de Reducción</strong> para la gerencia.
                  No podrán formular nuevas memorias ni cambiar operaciones POA; deberán recortar gastos
                  o excluir memorias para acceder al <strong>Pase Directo</strong>.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Motivo o Justificación del Cambio */}
        <div>
          <label className="block text-xs font-bold text-theme-main mb-1.5">
            Motivo / Instrucción de Ajuste {esReduccion && <span className="text-rose-500">*</span>}
          </label>
          <textarea
            rows={2}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder={
              esReduccion
                ? 'Ej: Directiva ministerial de reducción del techo general POA 2027...'
                : 'Observación o respaldo del techo asignado...'
            }
            className="w-full px-3 py-2 text-xs rounded-xl border border-theme-border bg-theme-surface text-theme-main focus:outline-none focus:ring-2 focus:ring-theme-primary transition-all resize-none"
          />
        </div>

        {/* Acciones del Modal */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-theme-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant={esReduccion ? 'danger' : 'primary'}
            size="sm"
            loading={loading}
          >
            {esReduccion ? 'Aplicar Reducción de Techo' : 'Guardar Techo Asignado'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
