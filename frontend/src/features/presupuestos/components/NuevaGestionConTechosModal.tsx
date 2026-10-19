import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  WalletCards,
  CheckCircle2,
  AlertCircle,
  Search,
  Lock,
  ArrowRight,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { Modal } from '../../../components/commons/Modal';
import { Button } from '../../../components/commons/Button';
import {
  Gestion,
  AreaInfoConfiguracion,
  getSiguienteAnioGestion,
  crearGestionConTechos,
  asignarTechosGestion,
  getPresupuestosArea,
} from '../../../services/presupuestoService';
import alertService from '../../../utils/alerts';

interface NuevaGestionConTechosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (nuevaGestionId: number) => void;
  gestionParaEditar?: Gestion | null;
  gestionesExistentes?: Gestion[];
}

export const NuevaGestionConTechosModal: React.FC<NuevaGestionConTechosModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  gestionParaEditar,
}) => {
  const isEditing = Boolean(gestionParaEditar);

  const [loadingInit, setLoadingInit] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [anio, setAnio] = useState<number>(new Date().getFullYear() + 1);
  const [techoGeneral, setTechoGeneral] = useState<string>('');
  const [areas, setAreas] = useState<AreaInfoConfiguracion[]>([]);
  const [distribucion, setDistribucion] = useState<Record<number, string>>({});
  const [busqueda, setBusqueda] = useState<string>('');

  // Inicializar datos al abrir el modal
  useEffect(() => {
    if (!isOpen) return;

    const initData = async () => {
      setLoadingInit(true);
      try {
        if (isEditing && gestionParaEditar) {
          setAnio(gestionParaEditar.anio);
          setTechoGeneral(gestionParaEditar.techo_general ? String(gestionParaEditar.techo_general) : '');
          const infoSiguiente = await getSiguienteAnioGestion();
          setAreas(infoSiguiente.areas || []);

          // Cargar montos existentes
          const techosExistentes = await getPresupuestosArea({ gestion: gestionParaEditar.id });
          const mapDist: Record<number, string> = {};
          (infoSiguiente.areas || []).forEach((a) => {
            const match = techosExistentes.find((t) => t.area === a.id);
            mapDist[a.id] = match ? String(match.monto_inicial || '0') : '0';
          });
          setDistribucion(mapDist);
        } else {
          const res = await getSiguienteAnioGestion();
          setAnio(res.siguiente_anio);
          setAreas(res.areas || []);
          setTechoGeneral('');

          const initialMap: Record<number, string> = {};
          (res.areas || []).forEach((a) => {
            initialMap[a.id] = '0';
          });
          setDistribucion(initialMap);
        }
      } catch (err) {
        console.error('Error al inicializar techos:', err);
        alertService.error('Error', 'No se pudieron cargar los datos de áreas para la gestión.');
      } finally {
        setLoadingInit(false);
      }
    };

    initData();
  }, [isOpen, isEditing, gestionParaEditar]);

  const handleMontoAreaChange = (areaId: number, val: string) => {
    setDistribucion((prev) => ({
      ...prev,
      [areaId]: val,
    }));
  };

  // Cálculos matemáticos en vivo
  const techoGeneralNum = parseFloat(techoGeneral || '0') || 0;
  const totalDistribuidoNum = useMemo(() => {
    return Object.values(distribucion).reduce((sum, val) => {
      const n = parseFloat(val || '0');
      return sum + (isNaN(n) ? 0 : n);
    }, 0);
  }, [distribucion]);

  const saldoRestante = techoGeneralNum - totalDistribuidoNum;
  const esExcedente = saldoRestante < -0.01;
  const esCuadrado = Math.abs(saldoRestante) <= 0.01 && techoGeneralNum > 0;
  const porcentajeAsignado =
    techoGeneralNum > 0
      ? Math.min(100, Math.max(0, (totalDistribuidoNum / techoGeneralNum) * 100))
      : 0;

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(val);

  // Filtro de búsqueda minimalista
  const areasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return areas;
    const q = busqueda.toLowerCase().trim();
    return areas.filter(
      (a) =>
        a.codigo.toLowerCase().includes(q) ||
        a.nombre.toLowerCase().includes(q) ||
        (a.programa_nombre && a.programa_nombre.toLowerCase().includes(q))
    );
  }, [areas, busqueda]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (techoGeneralNum <= 0) {
      alertService.warning('Techo Requerido', 'Debe registrar un Techo General del POA mayor a Bs. 0,00.');
      return;
    }

    if (esExcedente) {
      alertService.error(
        'Exceso de Techo',
        `La suma de techos asignados (${formatMoney(totalDistribuidoNum)}) excede el Techo General (${formatMoney(techoGeneralNum)}) por ${formatMoney(Math.abs(saldoRestante))}.`
      );
      return;
    }

    const distribucionPayload = areas.map((a) => {
      const rawVal = distribucion[a.id];
      const valNum = parseFloat(rawVal || '0');
      return {
        area_id: a.id,
        monto_inicial: isNaN(valNum) ? 0 : valNum,
      };
    });

    const hayVaciosOInvalidos = distribucionPayload.some((d) => isNaN(d.monto_inicial) || d.monto_inicial < 0);
    if (hayVaciosOInvalidos) {
      alertService.error('Valores Inválidos', 'Todas las gerencias deben tener un monto asignado válido (mayor o igual a cero).');
      return;
    }

    if (saldoRestante > 0.01) {
      const proceed = await alertService.confirm({
        title: '¿Confirmar Asignación Parcial?',
        text: `El Techo General es de ${formatMoney(techoGeneralNum)} y se han asignado ${formatMoney(totalDistribuidoNum)}. Quedan ${formatMoney(saldoRestante)} como reserva. ¿Desea continuar?`,
        icon: 'question',
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Revisar',
      });
      if (!proceed) return;
    }

    setActionLoading(true);
    try {
      if (isEditing && gestionParaEditar) {
        const res = await asignarTechosGestion(gestionParaEditar.id, {
          techo_general: techoGeneralNum,
          distribucion: distribucionPayload,
        });
        alertService.success('Techos Asignados', res.message);
        onSuccess(gestionParaEditar.id);
        onClose();
      } else {
        const res = await crearGestionConTechos({
          anio,
          techo_general: techoGeneralNum,
          distribucion: distribucionPayload,
        });
        alertService.success('Formulación Habilitada', res.message);
        onSuccess(res.gestion.id);
        onClose();
      }
    } catch (err: any) {
      console.error('Error al guardar techos:', err);
      alertService.error(
        'Error',
        err?.response?.data?.error || 'Ocurrió un error al fijar los techos presupuestarios.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? `Ajustar Techos POA — Gestión ${anio}`
          : `Habilitar Formulación POA — Gestión ${anio}`
      }
      subtitle={
        isEditing
          ? 'Modifique el Techo Presupuestario General y redistribuya los techos para cada Gerencia.'
          : `Fije el Techo Presupuestario General y asigne los techos por Gerencia para habilitar la formulación del POA ${anio}.`
      }
      icon={<WalletCards className="w-5 h-5 text-theme-primary" />}
      size="lg"
    >
      {loadingInit ? (
        <div className="py-12 text-center text-theme-muted">
          <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-theme-primary" />
          <p className="text-xs font-semibold">Cargando gerencias...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bloque Superior: Techo General y Métricas en Línea */}
          <div className="p-4 rounded-xl bg-theme-base/60 border border-theme-border space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Input Techo General */}
              <div className="flex-1 max-w-xs">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-theme-muted mb-1">
                  Techo General del POA (Bs) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-theme-muted">
                    Bs
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={techoGeneral}
                    onChange={(e) => setTechoGeneral(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-theme-border bg-theme-surface font-mono font-bold text-sm text-theme-main focus:ring-2 focus:ring-theme-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Métricas Compactas de Balance */}
              <div className="flex items-center gap-4 text-xs font-semibold self-end sm:self-center">
                <div>
                  <span className="text-[10px] text-theme-muted block uppercase font-bold">Distribuido</span>
                  <span className="font-mono font-bold text-theme-main text-sm">
                    {formatMoney(totalDistribuidoNum)}
                  </span>
                </div>

                <div className="h-7 w-px bg-theme-border"></div>

                <div>
                  <span className="text-[10px] text-theme-muted block uppercase font-bold">
                    {esExcedente ? 'Exceso' : esCuadrado ? 'Estado' : 'Por Asignar'}
                  </span>
                  <span
                    className={`font-mono font-bold text-sm flex items-center gap-1 ${
                      esExcedente
                        ? 'text-rose-600 dark:text-rose-400'
                        : esCuadrado
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-theme-primary'
                    }`}
                  >
                    {esCuadrado && <CheckCircle2 size={13} />}
                    {esExcedente && <AlertCircle size={13} />}
                    {esCuadrado ? 'Exacto (100%)' : formatMoney(Math.abs(saldoRestante))}
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de Progreso Minimalista */}
            <div className="space-y-1">
              <div className="w-full h-1.5 rounded-full bg-theme-border overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    esExcedente
                      ? 'bg-rose-500'
                      : esCuadrado
                      ? 'bg-emerald-500'
                      : 'bg-theme-primary'
                  }`}
                  style={{ width: `${Math.min(100, porcentajeAsignado)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Barra de Búsqueda y Conteo de Gerencias */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted">
              Gerencias ({areas.length})
            </span>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por código o nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-theme-border bg-theme-surface text-xs text-theme-main focus:ring-1 focus:ring-theme-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Lista Interactiva de Gerencias */}
          <div className="rounded-xl border border-theme-border overflow-hidden max-h-[340px] overflow-y-auto divide-y divide-theme-border">
            {areasFiltradas.length === 0 ? (
              <div className="py-8 text-center text-theme-muted text-xs">
                No se encontraron gerencias con el criterio de búsqueda.
              </div>
            ) : (
              areasFiltradas.map((a) => {
                const monto = distribucion[a.id] ?? '0';
                const tieneMonto = parseFloat(monto) > 0;

                return (
                  <div
                    key={a.id}
                    className={`flex items-center justify-between px-3.5 py-2.5 transition-colors gap-3 ${
                      tieneMonto ? 'bg-theme-surface hover:bg-theme-base/40' : 'bg-theme-surface/70 hover:bg-theme-base/20'
                    }`}
                  >
                    {/* Código y Nombre */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-theme-base border border-theme-border text-theme-main shrink-0">
                        {a.codigo}
                      </span>
                      <p className="text-xs font-semibold text-theme-main truncate" title={a.nombre}>
                        {a.nombre}
                      </p>
                    </div>

                    {/* Input de Asignación */}
                    <div className="relative w-36 shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-theme-muted">
                        Bs
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={monto}
                        onChange={(e) => handleMontoAreaChange(a.id, e.target.value)}
                        className={`w-full pl-8 pr-2.5 py-1 rounded-lg border text-right font-mono font-bold text-xs text-theme-main focus:ring-2 focus:ring-theme-primary focus:outline-none transition-colors ${
                          tieneMonto
                            ? 'border-theme-primary/40 bg-theme-surface'
                            : 'border-theme-border bg-theme-base/30'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Minimalista */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-theme-border">
            <span className="text-[11px] text-theme-muted">
              {esExcedente ? (
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  La suma excede el techo general. Reduzca montos.
                </span>
              ) : (
                `Los techos asignados definirán el límite de formulación de cada gerencia para la Gestión ${anio}.`
              )}
            </span>

            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={actionLoading}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={actionLoading}
                disabled={actionLoading || esExcedente || techoGeneralNum <= 0}
                className="font-bold shadow-sm"
              >
                {isEditing ? 'Guardar Techos' : `Habilitar Formulación y Fijar Techos`}
                <ArrowRight size={13} />
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
