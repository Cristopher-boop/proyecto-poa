{showModalMemoria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl bg-theme-surface">
            <div className="p-5 border-b border-theme-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="text-theme-primary" size={24} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-theme-main">
                      {editingMemoria ? 'Editar Memoria de Cálculo' : 'Formular Nueva Memoria de Cálculo'}
                    </h3>
                    <span className="font-mono font-bold text-xs bg-theme-base px-2 py-0.5 rounded border border-theme-border text-theme-main">
                      {formMemoria.codigo || 'MEM-AUTO'}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-theme-base border border-theme-border text-theme-main">
                      {secciones.find((s) => s.id === Number(formMemoria.seccionId))?.area_nombre || user?.area_nombre || 'Área'}
                    </span>
                  </div>
                  <p className="text-xs text-theme-muted mt-0.5">
                    Gestión {activeGestion?.anio} • Planificación presupuestaria operativa
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const prev = editingMemoria;
                  setShowModalMemoria(false);
                  if (prev) setFichaMemoria(prev);
                }}
                className="text-theme-muted hover:text-theme-main text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarMemoria} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* PASO 1: Asignación de Parámetros Base */}
              <div className="p-4 rounded-xl bg-theme-base/60 border border-theme-border space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-theme-main flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-theme-primary text-theme-primaryText flex items-center justify-center text-[10px] font-bold">1</span>
                    Parámetros Base de la Memoria (Partida, Operación y Contratación)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* 1. Partida Presupuestaria */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-theme-muted mb-1">
                      1. Partida Presupuestaria de Egreso *
                    </label>

                    {/* Combobox selector de partida */}
                    <div className="relative" ref={partidaSelectorRef}>
                      {(() => {
                        const selected =
                          egresoLeafs.find((p) => p.id === Number(formMemoria.partidaId)) ||
                          partidas.find((p) => p.id === Number(formMemoria.partidaId));
                        return (
                          <button
                            type="button"
                            onClick={() => setPartidaSelectorOpen(!partidaSelectorOpen)}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left ${selected
                              ? 'border-theme-border bg-theme-surface hover:border-theme-primary'
                              : 'border-amber-500/50 bg-amber-500/5 hover:border-amber-500'
                              }`}
                          >
                            {selected ? (
                              <span className="flex-1 min-w-0">
                                <span className="font-mono font-bold text-xs text-theme-primary mr-2">
                                  {selected.codigo}
                                </span>
                                <span className="text-xs text-theme-main line-clamp-1">{selected.nombre}</span>
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                <AlertCircle size={14} className="shrink-0" />
                                Seleccionar partida de egreso obligatoria...
                              </span>
                            )}
                            <svg
                              className={`w-4 h-4 shrink-0 text-theme-muted transition-transform ${partidaSelectorOpen ? 'rotate-180' : ''}`}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        );
                      })()}

                      {/* Dropdown con búsqueda y lista */}
                      {partidaSelectorOpen && (
                        <div className="absolute z-50 mt-1 w-full bg-theme-surface border border-theme-border rounded-xl shadow-xl overflow-hidden flex flex-col"
                          style={{ maxHeight: '300px' }}>
                          <div className="p-2 border-b border-theme-border sticky top-0 bg-theme-surface z-10">
                            <div className="relative">
                              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-muted" />
                              <input
                                autoFocus
                                type="text"
                                value={searchPartidaQuery}
                                onChange={(e) => setSearchPartidaQuery(e.target.value)}
                                placeholder="Buscar por código, nombre o grupo..."
                                className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-theme-border bg-theme-base focus:outline-none focus:border-theme-primary text-theme-main placeholder:text-theme-muted"
                              />
                            </div>
                            <p className="text-[10px] text-theme-muted mt-1 ml-1">
                              {filteredPartidas.length} partidas seleccionables (solo hojas de egreso)
                            </p>
                          </div>

                          {/* Lista de resultados agrupados */}
                          <div className="overflow-y-auto" style={{ maxHeight: '240px' }}>
                            {filteredPartidas.length === 0 ? (
                              <div className="py-8 text-center text-theme-muted text-xs">
                                No se encontraron partidas de egreso
                              </div>
                            ) : (
                              groupedPartidas.map((group, gIdx) => (
                                <div key={gIdx} className="border-b border-theme-border/40 last:border-0">
                                  {group.parent && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-theme-base border-b border-theme-border/60">
                                      <span className="font-mono text-[10px] font-bold text-theme-muted/80 bg-theme-border/60 px-1 rounded">
                                        {group.parent.codigo}
                                      </span>
                                      <span className="text-[10px] font-semibold text-theme-muted uppercase tracking-wide line-clamp-1">
                                        {group.parent.nombre}
                                      </span>
                                    </div>
                                  )}

                                  {group.leafs.map((p) => {
                                    const isActive = p.id === Number(formMemoria.partidaId);
                                    const parent = parentMap.get(p.codigo);
                                    return (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => {
                                          setFormMemoria({ ...formMemoria, partidaId: p.id });
                                          setPartidaSelectorOpen(false);
                                          setSearchPartidaQuery('');
                                        }}
                                        className={`w-full flex items-start gap-3 pl-5 pr-3 py-2 text-left transition-colors border-b border-theme-border/30 last:border-0 ${isActive
                                          ? 'bg-theme-primary/10 hover:bg-theme-primary/15'
                                          : 'hover:bg-theme-border/30'
                                          }`}
                                      >
                                        <span className="shrink-0 flex items-start pt-0.5">
                                          <span className="w-3 h-px bg-theme-border/70 mt-2 mr-1" />
                                        </span>

                                        <span
                                          className={`shrink-0 font-mono font-bold text-[11px] px-1.5 py-0.5 rounded-md ${isActive
                                            ? 'bg-theme-primary text-theme-primaryText'
                                            : 'bg-theme-base text-theme-primary border border-theme-border'
                                            }`}
                                        >
                                          {p.codigo}
                                        </span>

                                        <div className="flex-1 min-w-0">
                                          <p className={`text-xs leading-tight ${isActive ? 'font-semibold text-theme-main' : 'text-theme-main'}`}>
                                            {p.nombre}
                                          </p>
                                          {searchPartidaQuery.trim() && parent && (
                                            <p className="text-[10px] text-theme-muted mt-0.5 flex items-center gap-1">
                                              <span className="font-mono">{parent.codigo}</span>
                                              <span className="opacity-50">›</span>
                                              <span className="line-clamp-1">{parent.nombre}</span>
                                            </p>
                                          )}
                                        </div>

                                        {isActive && (
                                          <Check size={14} className="shrink-0 text-theme-primary mt-0.5" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      <input
                        type="text"
                        required
                        readOnly
                        tabIndex={-1}
                        value={formMemoria.partidaId}
                        className="absolute opacity-0 h-0 w-0 pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* 2. Operación POA */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold uppercase text-theme-muted">
                        2. Operación POA Institucional *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowQuickOperacion(!showQuickOperacion)}
                        className="text-[11px] font-semibold text-theme-primary hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} /> {showQuickOperacion ? 'Ocultar' : 'Nueva Operación'}
                      </button>
                    </div>

                    {/* Combobox selector de operación (sin buscador, solo selección de lista) */}
                    <div className="relative" ref={operacionSelectorRef}>
                      {(() => {
                        const sec = secciones.find((s) => s.id === Number(formMemoria.seccionId));
                        const areaId = (editingMemoria as any)?.area_id || (sec ? (sec.area || (sec as any).area_id) : (user?.area_id || null));
                        let opsFiltradas = areaId
                          ? operaciones.filter((o) => Number(o.area || (o as any).area_id) === Number(areaId))
                          : operaciones;

                        if (opsFiltradas.length === 0) {
                          opsFiltradas = operaciones;
                        }

                        if (formMemoria.operacionId && !opsFiltradas.some((o) => o.id === Number(formMemoria.operacionId))) {
                          const opActual = operaciones.find((o) => o.id === Number(formMemoria.operacionId));
                          if (opActual) {
                            opsFiltradas = [opActual, ...opsFiltradas];
                          }
                        }

                        const selectedOp = operaciones.find((o) => o.id === Number(formMemoria.operacionId));

                        return (
                          <>
                            <button
                              type="button"
                              onClick={() => setOperacionSelectorOpen(!operacionSelectorOpen)}
                              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left ${selectedOp
                                ? 'border-theme-border bg-theme-surface hover:border-theme-primary'
                                : 'border-amber-500/50 bg-amber-500/5 hover:border-amber-500'
                                }`}
                            >
                              {selectedOp ? (
                                <span className="flex-1 min-w-0">
                                  <span className="font-mono font-bold text-xs text-theme-primary mr-2">
                                    {selectedOp.codigo}
                                  </span>
                                  <span className="text-xs text-theme-main line-clamp-1">{selectedOp.descripcion}</span>
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                  <AlertCircle size={14} className="shrink-0" />
                                  Seleccione Operación POA institucional...
                                </span>
                              )}
                              <svg
                                className={`w-4 h-4 shrink-0 text-theme-muted transition-transform ${operacionSelectorOpen ? 'rotate-180' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {/* Dropdown lista de operaciones sin buscador */}
                            {operacionSelectorOpen && (
                              <div
                                className="absolute z-50 mt-1 w-full bg-theme-surface border border-theme-border rounded-xl shadow-xl overflow-hidden flex flex-col"
                                style={{ maxHeight: '240px' }}
                              >
                                <div className="overflow-y-auto" style={{ maxHeight: '240px' }}>
                                  {opsFiltradas.length === 0 ? (
                                    <div className="py-6 text-center text-theme-muted text-xs">
                                      No existen operaciones disponibles para su área.
                                    </div>
                                  ) : (
                                    opsFiltradas.map((op) => {
                                      const isActive = op.id === Number(formMemoria.operacionId);
                                      return (
                                        <button
                                          key={op.id}
                                          type="button"
                                          onClick={() => {
                                            setFormMemoria({
                                              ...formMemoria,
                                              operacionId: op.id,
                                              es_contratacion: op.es_contratacion ?? formMemoria.es_contratacion,
                                            });
                                            setOperacionSelectorOpen(false);
                                          }}
                                          className={`w-full flex items-start gap-3 px-3 py-2 text-left transition-colors border-b border-theme-border/30 last:border-0 ${isActive
                                            ? 'bg-theme-primary/10 hover:bg-theme-primary/15'
                                            : 'hover:bg-theme-border/30'
                                            }`}
                                        >
                                          <span
                                            className={`shrink-0 font-mono font-bold text-[11px] px-1.5 py-0.5 rounded-md ${isActive
                                              ? 'bg-theme-primary text-theme-primaryText'
                                              : 'bg-theme-base text-theme-primary border border-theme-border'
                                              }`}
                                          >
                                            {op.codigo}
                                          </span>

                                          <div className="flex-1 min-w-0">
                                            <p className={`text-xs leading-tight ${isActive ? 'font-semibold text-theme-main' : 'text-theme-main'}`}>
                                              {op.descripcion}
                                            </p>
                                          </div>

                                          {isActive && (
                                            <Check size={14} className="shrink-0 text-theme-primary mt-0.5" />
                                          )}
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            )}

                            <input
                              type="text"
                              required
                              readOnly
                              tabIndex={-1}
                              value={formMemoria.operacionId}
                              className="absolute opacity-0 h-0 w-0 pointer-events-none"
                            />
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Subformulario quick operación si está abierto */}
                {showQuickOperacion && (
                  <div className="p-3.5 rounded-xl bg-theme-surface border border-theme-border space-y-3 shadow-sm animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-theme-main flex items-center gap-1.5">
                        <Building2 size={14} className="text-theme-primary" /> Registrar Nueva Operación para su Área
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase text-theme-muted mb-1">
                          Código de Operación *
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. OP-INF-08"
                          value={quickOpForm.codigo}
                          onChange={(e) => setQuickOpForm({ ...quickOpForm, codigo: e.target.value })}
                          className="input-theme text-xs py-1.5 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold uppercase text-theme-muted mb-1">
                          Acción a Corto Plazo (ACP Padre) *
                        </label>
                        <select
                          value={quickOpForm.acp_id}
                          onChange={(e) => setQuickOpForm({ ...quickOpForm, acp_id: Number(e.target.value) })}
                          className="input-theme text-xs py-1.5 bg-theme-surface text-theme-main"
                        >
                          <option value="" className="bg-white text-slate-900 dark:bg-[#272B33] dark:text-white">Seleccione ACP...</option>
                          {accionesCortoPlazo.map((acp) => (
                            <option key={acp.id} value={acp.id} className="bg-white text-slate-900 dark:bg-[#272B33] dark:text-white">
                              {acp.codigo} - {acp.descripcion.slice(0, 45)}...
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold uppercase text-theme-muted mb-1">
                          Descripción de la Operación *
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Fortalecimiento de la Infraestructura de Servidores..."
                          value={quickOpForm.descripcion}
                          onChange={(e) => setQuickOpForm({ ...quickOpForm, descripcion: e.target.value })}
                          className="input-theme text-xs py-1.5"
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowQuickOperacion(false)}
                          className="px-2.5 py-1 text-xs text-theme-muted hover:text-theme-main"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveQuickOperacion}
                          className="btn-primary text-xs px-3.5 py-1"
                        >
                          Guardar y Vincular
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Checkbox Contratación */}
                <div className="flex items-center gap-2 pt-1 border-t border-theme-border/60">
                  <input
                    type="checkbox"
                    id="chk-es-contratacion"
                    checked={formMemoria.es_contratacion}
                    onChange={(e) => setFormMemoria({ ...formMemoria, es_contratacion: e.target.checked })}
                    className="w-4 h-4 rounded text-theme-primary focus:ring-theme-primary cursor-pointer"
                  />
                  <label htmlFor="chk-es-contratacion" className="text-xs font-semibold text-theme-main cursor-pointer select-none">
                    Aplica a Contrataciones
                  </label>
                </div>
              </div>

              {/* PASO 2: Despliegue de Datos y Formulación Oficial (50% Tabla / 50% Justificación) */}
              {(editingMemoria || (formMemoria.partidaId && formMemoria.operacionId)) ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Formato Oficial: Desglose de Ítems a la izquierda (50%) + Justificación Amplia a la derecha (50%) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                    {/* Columna Izquierda: Tabla de Renglones / Ítems (6 cols - 50%) */}
                    <div className="lg:col-span-6 flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-theme-main">
                            Desglose de Ítems / Renglones
                          </span>
                          <button
                            type="button"
                            onClick={handleAddRenglon}
                            className="btn-primary text-xs px-2.5 py-1 flex items-center gap-1"
                          >
                            <Plus size={13} /> Agregar ítem
                          </button>
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
                                <th className="py-2 px-1 w-6 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-theme-border">
                              {formMemoria.renglones.map((renglon, idx) => {
                                const subtotal = (Number(renglon.cantidad) || 0) * (Number(renglon.precio_unitario) || 0);
                                return (
                                  <tr key={idx} className="hover:bg-theme-border/10 transition-colors">
                                    <td className="py-1.5 px-1.5 text-center font-bold text-theme-muted text-[11px]">{idx + 1}</td>
                                    <td className="py-1.5 px-2">
                                      <input
                                        type="text"
                                        required
                                        placeholder="Descripción..."
                                        value={renglon.descripcion}
                                        onChange={(e) => handleUpdateRenglon(idx, 'descripcion', e.target.value)}
                                        className="w-full bg-transparent border-b border-theme-border/60 focus:border-theme-primary px-1 py-0.5 focus:outline-none text-theme-main text-xs uppercase"
                                      />
                                    </td>
                                    <td className="py-1.5 px-1.5">
                                      <input
                                        type="text"
                                        required
                                        placeholder="Unidad..."
                                        value={renglon.unidad_medida}
                                        onChange={(e) => handleUpdateRenglon(idx, 'unidad_medida', e.target.value)}
                                        className="w-full bg-transparent border-b border-theme-border/60 focus:border-theme-primary px-1 py-0.5 focus:outline-none text-theme-main text-xs uppercase"
                                      />
                                    </td>
                                    <td className="py-1.5 px-1.5 text-right">
                                      <input
                                        type="number"
                                        required
                                        min="0.01"
                                        step="any"
                                        value={renglon.cantidad === 0 || renglon.cantidad === '0' ? '' : renglon.cantidad}
                                        onChange={(e) => handleUpdateRenglon(idx, 'cantidad', e.target.value)}
                                        className="w-full bg-transparent border-b border-theme-border/60 focus:border-theme-primary px-1 py-0.5 text-right focus:outline-none text-theme-main text-xs font-semibold"
                                      />
                                    </td>
                                    <td className="py-1.5 px-1.5 text-right">
                                      <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={renglon.precio_unitario === 0 || renglon.precio_unitario === '0' ? '' : renglon.precio_unitario}
                                        onChange={(e) => handleUpdateRenglon(idx, 'precio_unitario', e.target.value)}
                                        className="w-full bg-transparent border-b border-theme-border/60 focus:border-theme-primary px-1 py-0.5 text-right focus:outline-none text-theme-main text-xs font-semibold"
                                      />
                                    </td>
                                    <td className="py-1.5 px-2 text-right font-bold text-theme-main font-mono text-xs">{formatMoney(subtotal)}</td>
                                    <td className="py-1.5 px-1 text-center">
                                      {formMemoria.renglones.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveRenglon(idx)}
                                          className="text-theme-muted hover:text-rose-500 p-0.5 transition-colors"
                                          title="Eliminar renglón"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex justify-end items-center gap-3 pt-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-theme-muted">
                          Total Proyectado:
                        </span>
                        <span className="text-base font-bold text-theme-primary font-mono">{formatMoney(totalCalculadoMemoria)}</span>
                      </div>
                    </div>

                    {/* Columna Derecha: Justificación amplia a la misma altura (6 cols - 50%) */}
                    <div className="lg:col-span-6 flex flex-col space-y-2 h-full">
                      <label className="block text-xs font-bold uppercase tracking-wider text-theme-main">
                        Justificación Técnica y Sustento *
                      </label>
                      <div className="flex-1 flex flex-col justify-between rounded-xl border border-theme-border bg-theme-surface p-3.5 space-y-2 min-h-[260px]">
                        <textarea
                          required
                          value={formMemoria.justificacion}
                          onChange={(e) => setFormMemoria({ ...formMemoria, justificacion: e.target.value })}
                          placeholder="Detalle los objetivos operativos, necesidad institucional y justificación técnica del gasto..."
                          className="w-full flex-1 min-h-[200px] h-full bg-transparent resize-none focus:outline-none text-xs text-theme-main uppercase leading-relaxed placeholder:normal-case placeholder:text-theme-muted overflow-y-auto"
                        />
                        <div className="text-[10px] text-theme-muted border-t border-theme-border/60 pt-1.5 flex justify-between">
                          <span>Sustento Auditoría POA</span>
                          <span>{formMemoria.justificacion.length} caracteres</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-xl border border-dashed border-theme-border text-center text-theme-muted space-y-1.5">
                  <Layers className="mx-auto text-theme-muted opacity-50 mb-1" size={28} />
                  <p className="text-xs font-semibold text-theme-main">Paso 2: Seleccione la Partida y la Operación POA para continuar</p>
                  <p className="text-[11px]">Una vez asignados ambos parámetros, se desplegará el desglose de ítems y la justificación técnica de la memoria.</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-theme-border">
                <button
                  type="button"
                  onClick={() => {
                    const prev = editingMemoria;
                    setShowModalMemoria(false);
                    if (prev) setFichaMemoria(prev);
                  }}
                  className="px-4 py-2 rounded-xl border border-theme-border text-xs font-semibold text-theme-muted hover:text-theme-main"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || (!editingMemoria && (!formMemoria.partidaId || !formMemoria.operacionId))}
                  className="btn-primary text-xs px-6 py-2"
                >
                  {editingMemoria ? 'Guardar Cambios' : 'Registrar Memoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}