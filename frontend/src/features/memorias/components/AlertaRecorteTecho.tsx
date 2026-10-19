import React from 'react';
import { EstadoTechoArea } from '../../../services/presupuestoService';
import { AlertTriangle, CheckCircle2, TrendingDown, Send, ShieldAlert, Lock, Scissors, Sparkles } from 'lucide-react';
import { Button } from '../../../components/commons/Button';

interface AlertaRecorteTechoProps {
  estadoTecho: EstadoTechoArea;
  onEnviarPaseDirecto: () => void;
  actionLoading?: boolean;
}

export const AlertaRecorteTecho: React.FC<AlertaRecorteTechoProps> = ({
  estadoTecho,
  onEnviarPaseDirecto,
  actionLoading = false,
}) => {
  const formatMoney = (val: string | number) =>
    new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(Number(val) || 0);

  const techoNum = parseFloat(estadoTecho.techo_asignado || '0');
  const incluidoNum = parseFloat(estadoTecho.total_incluido || '0');
  const diferenciaNum = parseFloat(estadoTecho.diferencia || '0');
  const deficitNum = parseFloat(estadoTecho.deficit_recorte || '0');
  const metaCumplida = diferenciaNum >= 0 && incluidoNum > 0;

  return (
    <div className="mb-6 rounded-2xl border-2 border-rose-500/40 bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-rose-500/15 p-4 sm:p-6 shadow-md transition-all">
      {/* Encabezado Principal de Alerta */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500 text-white shadow-md shrink-0 animate-pulse">
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-xs">
                Alerta Obligatoria de Formulación
              </span>
              <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-300">
                {estadoTecho.area_codigo} — {estadoTecho.area_nombre}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-theme-main mt-1">
              Techo Presupuestario Reducido por Presupuestos (Lic. Acha)
            </h3>
            <p className="text-xs text-theme-muted mt-0.5">
              El techo asignado para el POA de su gerencia ha sido reducido formalmente. Debe adecuar
              sus Memorias de Cálculo reduciendo montos o excluyendo memorias hasta cumplir con la meta.
            </p>
          </div>
        </div>

        {/* Motivo registrado si existe */}
        {estadoTecho.motivo_reduccion && (
          <div className="sm:max-w-xs p-3 rounded-xl bg-theme-surface/80 border border-theme-border text-xs shadow-xs">
            <span className="text-[10px] uppercase font-bold text-theme-muted block mb-0.5">
              Motivo del Recorte:
            </span>
            <p className="text-theme-main font-medium italic line-clamp-3">
              "{estadoTecho.motivo_reduccion}"
            </p>
          </div>
        )}
      </div>

      {/* Grid de Métricas y Meta de Reducción */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
        {/* Tarjeta 1: Nuevo Techo */}
        <div className="p-3.5 rounded-xl bg-theme-surface border border-theme-border shadow-xs">
          <span className="text-[11px] font-semibold text-theme-muted uppercase block">
            Nuevo Techo Asignado
          </span>
          <p className="text-xl sm:text-2xl font-black text-theme-main mt-0.5">
            {formatMoney(techoNum)}
          </p>
          <span className="text-[11px] text-theme-muted mt-1 block">
            Límite presupuestario oficial POA
          </span>
        </div>

        {/* Tarjeta 2: Formulado Activo */}
        <div className="p-3.5 rounded-xl bg-theme-surface border border-theme-border shadow-xs">
          <span className="text-[11px] font-semibold text-theme-muted uppercase block">
            Total en Memorias Activas
          </span>
          <p className="text-xl sm:text-2xl font-black text-theme-main mt-0.5">
            {formatMoney(incluidoNum)}
          </p>
          <span className="text-[11px] text-theme-muted mt-1 block">
            Sumatoria de memorias seleccionadas
          </span>
        </div>

        {/* Tarjeta 3: Meta de Reducción / Déficit */}
        <div
          className={`p-3.5 rounded-xl border shadow-xs transition-colors ${
            metaCumplida
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-100'
              : 'bg-rose-500/15 border-rose-500/50 text-rose-950 dark:text-rose-100'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block">
            {metaCumplida ? 'Meta de Reducción Cumplida' : 'Excedente a Recortar (Meta)'}
          </span>
          <p className="text-xl sm:text-2xl font-black mt-0.5 flex items-center gap-1.5">
            {metaCumplida ? (
              <>
                <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  +{formatMoney(Math.abs(diferenciaNum))}
                </span>
              </>
            ) : (
              <>
                <TrendingDown size={20} className="text-rose-600 dark:text-rose-400" />
                <span className="text-rose-600 dark:text-rose-400">
                  -{formatMoney(deficitNum)}
                </span>
              </>
            )}
          </p>
          <span className="text-[11px] opacity-90 mt-1 block font-medium">
            {metaCumplida
              ? 'Margen disponible dentro del nuevo techo'
              : 'Déficit que debe reducirse para habilitar el envío'}
          </span>
        </div>
      </div>

      {/* Reglas de Negocio en Reajuste */}
      <div className="mt-4 p-3.5 rounded-xl bg-theme-surface/70 border border-theme-border text-xs grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <div className="flex items-start gap-2">
          <Lock size={15} className="text-amber-500 shrink-0 mt-0.5" />
          <span>
            <strong>Operaciones POA bloqueadas:</strong> No se permite alterar la planificación estratégica asignada.
          </span>
        </div>
        <div className="flex items-start gap-2">
          <ShieldAlert size={15} className="text-rose-500 shrink-0 mt-0.5" />
          <span>
            <strong>Sin nuevas memorias:</strong> Solo se permite modificar ítems existentes o desmarcar memorias.
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Sparkles size={15} className="text-theme-primary shrink-0 mt-0.5" />
          <span>
            <strong>Pase Directo a Aprobado:</strong> Al cumplir la meta, el envío sube directamente sin revisiones intermedias.
          </span>
        </div>
      </div>

      {/* Footer con Estado y Botón de Pase Directo */}
      <div className="mt-4 pt-3.5 border-t border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs">
          {metaCumplida ? (
            <p className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5">
              <CheckCircle2 size={16} />
              El total formulado cumple con el nuevo techo presupuestario. Puede confirmar y enviar con Pase Directo.
            </p>
          ) : (
            <p className="text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1.5">
              <Scissors size={15} />
              Reduzca cantidades/precios en sus memorias o desmarque la casilla "Incluir en POA" en la tabla inferior para llegar a la meta.
            </p>
          )}
        </div>

        <Button
          type="button"
          variant={metaCumplida ? 'primary' : 'outline'}
          size="sm"
          disabled={!metaCumplida || actionLoading}
          loading={actionLoading}
          onClick={onEnviarPaseDirecto}
          className="shadow-md font-bold whitespace-nowrap"
        >
          <Send size={15} />
          Enviar Adecuación de Techo (Pase Directo)
        </Button>
      </div>
    </div>
  );
};
