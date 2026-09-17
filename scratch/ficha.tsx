{fichaMemoria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl bg-theme-surface">
            <div className="p-5 border-b border-theme-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="text-theme-primary" size={24} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-theme-main font-mono">
                      Revisión de Memoria
                    </h3>
                    <span className="font-mono font-bold text-xs bg-theme-base px-2 py-0.5 rounded border border-theme-border text-theme-main">
                      {fichaMemoria.codigo}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-theme-base border border-theme-border text-theme-main">
                      {fichaMemoria.area_nombre}
                    </span>
                  </div>
                  <p className="text-xs text-theme-muted mt-0.5">
                    Gestión {activeGestion?.anio || fichaMemoria.gestion_anio || '2027'} • Estado: {fichaMemoria.estado.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const el = document.getElementById('printable-memoria');
                    if (!el) return;
                    const html = el.innerHTML;

                    const iframe = document.createElement('iframe');
                    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;';
                    document.body.appendChild(iframe);

                    const doc = iframe.contentWindow?.document;
                    if (!doc) { document.body.removeChild(iframe); return; }

                    doc.open();
                    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Memoria de Cálculo — ${fichaMemoria.codigo}</title>
  <style>
    @page { size: letter portrait; margin: 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; background: #fff; margin: 0; padding: 8px; }
    h1 { font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; text-align: center; margin-bottom: 4px; }
    p { margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #000; padding: 5px 6px; }
    .navy { background-color: #002060 !important; color: #fff !important; font-weight: bold; text-transform: uppercase; text-align: center; font-size: 10px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: 'Courier New', Courier, monospace; }
    .font-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    .mt-8 { margin-top: 32px; }
    .h-16 { height: 64px; }
    .bg-white { background: #fff; }
  </style>
</head>
<body>${html}</body>
</html>`);
                    doc.close();

                    setTimeout(() => {
                      iframe.contentWindow?.print();
                      setTimeout(() => document.body.removeChild(iframe), 500);
                    }, 400);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-theme-border text-theme-muted hover:text-theme-main text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Printer size={14} /> Imprimir Ficha
                </button>
                <button onClick={() => setFichaMemoria(null)} className="text-theme-muted hover:text-theme-main text-lg font-bold">
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* PASO 1: Parámetros Base de la Memoria */}
              <div className="p-4 rounded-xl bg-theme-base/60 border border-theme-border space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-theme-main flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-theme-primary text-theme-primaryText flex items-center justify-center text-[10px] font-bold">1</span>
                  Parámetros Base de la Memoria (Partida, Operación y Contratación)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Partida Presupuestaria */}
                  <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
                    <span className="text-[10px] font-semibold uppercase text-theme-muted block mb-1">
                      1. Partida Presupuestaria de Egreso
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-theme-primary bg-theme-base px-2 py-0.5 rounded border border-theme-border">
                        {fichaMemoria.partida_codigo || 'N/A'}
                      </span>
                      <span className="text-xs font-semibold text-theme-main line-clamp-1">
                        {fichaMemoria.partida_nombre || 'Sin partida asignada'}
                      </span>
                    </div>
                  </div>

                  {/* Operación POA */}
                  <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
                    <span className="text-[10px] font-semibold uppercase text-theme-muted block mb-1">
                      2. Operación POA Institucional
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-theme-main bg-theme-base px-2 py-0.5 rounded border border-theme-border">
                        {fichaMemoria.operacion_codigo ? `POA: ${fichaMemoria.operacion_codigo}` : 'Sin Operación'}
                      </span>
                      <span className="text-xs text-theme-main line-clamp-1">
                        {fichaMemoria.operacion_descripcion || (fichaMemoria.es_contratacion ? 'Contratación Institucional' : 'Gasto Corriente')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modalidad Contrataciones */}
                <div className="flex items-center gap-2 pt-1 border-t border-theme-border/60">
                  <span className="text-xs font-semibold text-theme-muted">Modalidad de Adquisición:</span>
                  <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md border border-theme-border bg-theme-border/30 text-theme-main">
                    {fichaMemoria.es_contratacion ? '✓ Aplica a Contrataciones' : 'Gasto Corriente Operativo'}
                  </span>
                </div>
              </div>

              {/* PASO 2: Despliegue de Datos Oficiales */}
              <div className="space-y-4">
                {/* Formato Oficial: Desglose de Ítems a la izquierda (50%) + Justificación Amplia a la derecha (50%) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  {/* Columna Izquierda: Tabla de Renglones / Ítems (6 cols - 50%) */}
                  <div className="lg:col-span-6 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-theme-main">
                          Desglose de Ítems / Renglones ({fichaMemoria.detalles?.length || 0} ítems)
                        </span>
                      </div>

                      <div className="border border-theme-border rounded-xl overflow-hidden bg-theme-surface">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-theme-base border-b border-theme-border font-semibold text-theme-muted text-[11px]">
                              <th className="py-2 px-1.5 w-6 text-center">#</th>
                              <th className="py-2 px-2">Descripción</th>
                              <th className="py-2 px-1.5 w-20">U. Medida</th>
                              <th className="py-2 px-1.5 w-14 text-right">Cant.</th>
                              <th className="py-2 px-1.5 w-20 text-right">P. Unit.</th>
                              <th className="py-2 px-2 w-20 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-theme-border">
                            {(fichaMemoria.detalles || []).map((d, idx) => (
                              <tr key={d.id || idx} className="hover:bg-theme-border/10 transition-colors">
                                <td className="py-2 px-1.5 text-center font-bold text-theme-muted text-[11px]">{idx + 1}</td>
                                <td className="py-2 px-2 font-medium text-theme-main">{d.descripcion}</td>
                                <td className="py-2 px-1.5 text-theme-muted">{d.unidad_medida}</td>
                                <td className="py-2 px-1.5 text-right font-semibold">{d.cantidad}</td>
                                <td className="py-2 px-1.5 text-right font-semibold">{formatMoney(d.precio_unitario)}</td>
                                <td className="py-2 px-2 text-right font-bold text-theme-main font-mono">{formatMoney(d.precio_total || (Number(d.cantidad) * Number(d.precio_unitario)))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-end items-center gap-3 pt-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-theme-muted">
                        Total Presupuesto Proyectado:
                      </span>
                      <span className="text-base font-bold text-theme-primary font-mono">{formatMoney(fichaMemoria.total_presupuesto)}</span>
                    </div>
                  </div>

                  {/* Columna Derecha: Justificación amplia a la misma altura (6 cols - 50%) */}
                  <div className="lg:col-span-6 flex flex-col space-y-2 h-full">
                    <label className="block text-xs font-bold uppercase tracking-wider text-theme-main">
                      Justificación Técnica y Sustento
                    </label>
                    <div className="flex-1 flex flex-col justify-between rounded-xl border border-theme-border bg-theme-surface p-3.5 space-y-2 min-h-[260px]">
                      <div className="flex-1 min-h-[200px] overflow-y-auto pr-1">
                        <p className="text-xs text-theme-main uppercase leading-relaxed whitespace-pre-wrap">
                          {fichaMemoria.justificacion}
                        </p>
                      </div>
                      <div className="text-[10px] text-theme-muted border-t border-theme-border/60 pt-1.5 flex justify-between">
                        <span>Sustento Auditoría POA</span>
                        <span>{fichaMemoria.justificacion?.length || 0} caracteres</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nota de Rechazo / Observación si existe */}
              {fichaMemoria.motivo_rechazo && (
                <div className={`p-3.5 rounded-xl border text-xs ${fichaMemoria.estado === 'RECHAZADO'
                  ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-200'
                  : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-200'
                  }`}>
                  <div className="flex items-center gap-2 font-bold uppercase text-[11px] tracking-wider">
                    {fichaMemoria.estado === 'RECHAZADO' ? (
                      <span className="text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                        <XCircle size={15} /> Notificación Oficial de Rechazo
                      </span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <AlertCircle size={15} /> Observación / Nota de Revisión
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 font-semibold text-xs leading-relaxed">
                    {fichaMemoria.motivo_rechazo}
                  </p>
                </div>
              )}

              {/* Registro de Control y Firmas Institucionales */}
              <div className="border-t border-theme-border pt-4">
                <span className="text-theme-muted uppercase font-semibold text-xs">Registro de Control y Firmas Institucionales:</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mt-2">
                  {/* 1. Elaborador */}
                  <div className="p-2.5 rounded-xl bg-theme-base border border-theme-border text-center">
                    <span className="text-[10px] uppercase font-bold text-theme-muted block">1. Elaborador</span>
                    <p className="font-semibold text-xs text-theme-main mt-0.5">Usuario Solicitante</p>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Formulado</span>
                  </div>

                  {/* 2. Gerencia de Área */}
                  <div className="p-2.5 rounded-xl bg-theme-base border border-theme-border text-center">
                    <span className="text-[10px] uppercase font-bold text-theme-muted block">2. Gerencia de Área</span>
                    <p className="font-semibold text-xs text-theme-main mt-0.5">Visto Bueno Área</p>
                    {fichaMemoria.estado === 'RECHAZADO' && (fichaMemoria.motivo_rechazo?.includes('[GERENCIA') || (!fichaMemoria.motivo_rechazo?.includes('[PLANIFICACI') && !fichaMemoria.motivo_rechazo?.includes('[PRESUPUESTOS'))) ? (
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">✕ Rechazado Gerencia</span>
                    ) : ['APROBADO_GERENCIA', 'PENDIENTE_PLANIFICACION', 'APROBADO_PLANIFICACION', 'APROBADO_FINANZAS'].includes(fichaMemoria.estado) ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Aprobado</span>
                    ) : fichaMemoria.estado === 'BORRADOR' ? (
                      <span className="text-[10px] text-theme-muted font-medium">⏳ Por Enviar</span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-medium">⏳ Pendiente Revisión</span>
                    )}
                  </div>

                  {/* 3. Planificación */}
                  <div className="p-2.5 rounded-xl bg-theme-base border border-theme-border text-center">
                    <span className="text-[10px] uppercase font-bold text-theme-muted block">3. Planificación (SPO)</span>
                    <p className="font-semibold text-xs text-theme-main mt-0.5">Alineación Contratación</p>
                    {fichaMemoria.es_contratacion && parseFloat(fichaMemoria.total_presupuesto || '0') >= 2000 ? (
                      fichaMemoria.estado === 'RECHAZADO' && fichaMemoria.motivo_rechazo?.includes('[PLANIFICACI') ? (
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">✕ Rechazado Planificación</span>
                      ) : ['APROBADO_GERENCIA', 'APROBADO_PLANIFICACION', 'APROBADO_FINANZAS'].includes(fichaMemoria.estado) && fichaMemoria.estado !== 'PENDIENTE_PLANIFICACION' ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Alineado</span>
                      ) : fichaMemoria.estado === 'PENDIENTE_PLANIFICACION' ? (
                        <span className="text-[10px] text-amber-600 font-medium">⏳ En Verificación</span>
                      ) : (
                        <span className="text-[10px] text-theme-muted font-medium">⏳ Por Validar</span>
                      )
                    ) : (
                      <span className="text-[10px] text-theme-muted font-medium italic">— Omitido (&lt; 2.000 Bs)</span>
                    )}
                  </div>

                  {/* 4. Presupuestos */}
                  <div className="p-2.5 rounded-xl bg-theme-base border border-theme-border text-center">
                    <span className="text-[10px] uppercase font-bold text-theme-muted block">4. Presupuestos</span>
                    <p className="font-semibold text-xs text-theme-main mt-0.5">Aprobación POA Final</p>
                    {fichaMemoria.estado === 'RECHAZADO' && fichaMemoria.motivo_rechazo?.includes('[PRESUPUESTOS') ? (
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">✕ Rechazado Presupuestos</span>
                    ) : fichaMemoria.estado === 'APROBADO_FINANZAS' ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Aprobado POA</span>
                    ) : (fichaMemoria.estado === 'APROBADO_GERENCIA' || fichaMemoria.estado === 'APROBADO_PLANIFICACION') ? (
                      <span className="text-[10px] text-amber-600 font-medium">⏳ En Revisión Final</span>
                    ) : (
                      <span className="text-[10px] text-theme-muted font-medium">⏳ Pendiente</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer con Acciones Directas de Revisión */}
            <div className="p-4 border-t border-theme-border flex items-center justify-between">
              <div>
                {!isGestionBloqueada && fichaMemoria.estado !== 'APROBADO_FINANZAS' && (isElaborador || isGerente || isPlanificador || isAprobador) && (
                  <button
                    onClick={() => {
                      const targetMem = fichaMemoria;
                      setFichaMemoria(null);
                      handleOpenEditar(targetMem);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Edit3 size={14} /> Editar Memoria
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* 1. Acción de Borrador: Enviar a Gerencia / Eliminar */}
                {fichaMemoria.estado === 'BORRADOR' && (
                  <>
                    {!isGestionBloqueada && (isElaborador || isAprobador) && (
                      <button
                        onClick={() => {
                          const targetId = fichaMemoria.id;
                          setFichaMemoria(null);
                          handleDelete(targetId);
                        }}
                        className="px-3 py-2 rounded-xl border border-rose-500/50 text-rose-600 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1"
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                    )}
                    {isElaborador && (
                      <button
                        onClick={() => handleEnviar(fichaMemoria)}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                      >
                        <Send size={14} /> Enviar a Gerencia
                      </button>
                    )}
                  </>
                )}

                {/* 2. Acción de Gerencia: Aprobar / Rechazar */}
                {(fichaMemoria.estado === 'PENDIENTE_GERENCIA' || (fichaMemoria.estado === 'BORRADOR' && isGerente)) && (isGerente || isAprobador) && (
                  <>
                    <button
                      onClick={() => handleRechazar(fichaMemoria)}
                      className="px-3 py-2 rounded-xl border border-rose-500/50 text-rose-600 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1"
                    >
                      <XCircle size={14} /> Rechazar
                    </button>
                    <button
                      onClick={() => handleAprobarGerente(fichaMemoria)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 size={14} /> Aprobar Gerencia
                    </button>
                  </>
                )}

                {/* 3. Acción de Planificación: Validar / Rechazar */}
                {fichaMemoria.estado === 'PENDIENTE_PLANIFICACION' && (isPlanificador || isAprobador) && (
                  <>
                    <button
                      onClick={() => handleRechazar(fichaMemoria)}
                      className="px-3 py-2 rounded-xl border border-rose-500/50 text-rose-600 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1"
                    >
                      <XCircle size={14} /> Rechazar
                    </button>
                    <button
                      onClick={() => handleAprobarPlanificacion(fichaMemoria)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 size={14} /> Aprobar Planificación
                    </button>
                  </>
                )}

                {/* 4. Acción de Presupuestos: Aprobar POA Final / Rechazar */}
                {(fichaMemoria.estado === 'APROBADO_GERENCIA' || fichaMemoria.estado === 'APROBADO_PLANIFICACION') && isAprobador && (
                  <>
                    <button
                      onClick={() => handleRechazar(fichaMemoria)}
                      className="px-3 py-2 rounded-xl border border-rose-500/50 text-rose-600 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1"
                    >
                      <XCircle size={14} /> Rechazar
                    </button>
                    <button
                      onClick={() => handleAprobarFinanciero(fichaMemoria)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 size={14} /> Aprobar Presupuestos (POA)
                    </button>
                  </>
                )}

                {/* 5. Acción de Rechazado: Reiniciar a Borrador */}
                {fichaMemoria.estado === 'RECHAZADO' && (canCreate || isGerente || isAprobador) && (
                  <button
                    onClick={() => handleVolverABorrador(fichaMemoria)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw size={14} /> Reiniciar a Borrador
                  </button>
                )}

                <button onClick={() => setFichaMemoria(null)} className="btn-primary text-xs px-5 py-2">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}