// Módulo de Monitoreo de Operadores y Supervisión
const OperadoresModule = {
  simulacionInterval: null,
  isSimulando: false,

  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    const btnSimular = document.getElementById('btn-toggle-simulacion');
    if (btnSimular) {
      btnSimular.addEventListener('click', () => this.toggleSimulacion());
    }

    const formReasignar = document.getElementById('form-reasignar-titular');
    if (formReasignar) {
      formReasignar.addEventListener('submit', (e) => this.guardarReasignacion(e));
    }
  },

  render() {
    const operadores = StorageService.getOperadores();
    const titulares = StorageService.getTitulares();
    const container = document.getElementById('grid-operadores');
    const rankingContainer = document.getElementById('ranking-operadores');
    if (!container) return;

    // Resumen global de supervisión
    const activos = operadores.filter(o => o.estado !== 'pausa' && o.estado !== 'inactivo').length;
    const llamadasTotales = operadores.reduce((sum, o) => sum + (o.llamadasHoy || 0), 0);
    const promesasTotales = operadores.reduce((sum, o) => sum + (o.promesasHoy || 0), 0);
    const recaudadoTotal = operadores.reduce((sum, o) => sum + (o.recaudadoHoy || 0), 0);
    const metaGlobal = operadores.reduce((sum, o) => sum + (o.metaDiaria || 0), 0);
    const pctMeta = metaGlobal > 0 ? Math.round((recaudadoTotal / metaGlobal) * 100) : 0;

    const elActivos = document.getElementById('sup-ops-activos');
    const elLlamadas = document.getElementById('sup-ops-llamadas');
    const elPromesas = document.getElementById('sup-ops-promesas');
    const elRecaudado = document.getElementById('sup-ops-recaudado');
    const elProgreso = document.getElementById('sup-ops-progreso-barra');
    const elPctMeta = document.getElementById('sup-ops-pct-meta');

    if (elActivos) elActivos.textContent = `${activos} / ${operadores.length} Activos`;
    if (elLlamadas) elLlamadas.textContent = llamadasTotales;
    if (elPromesas) elPromesas.textContent = promesasTotales;
    if (elRecaudado) elRecaudado.textContent = Formatters.currency(recaudadoTotal);
    if (elProgreso) elProgreso.style.width = `${Math.min(100, pctMeta)}%`;
    if (elPctMeta) elPctMeta.textContent = `${pctMeta}% de meta ($${(metaGlobal/1000).toFixed(0)}k)`;

    // Render tarjetas individuales de operadores
    container.innerHTML = operadores.map(op => {
      const carteraAsignada = titulares.filter(t => t.operadorId === op.id);
      const deudaAsignada = carteraAsignada.reduce((sum, t) => sum + t.deudaTotal, 0);
      const pctCumplimiento = Math.min(100, Math.round(((op.recaudadoHoy || 0) / (op.metaDiaria || 1)) * 100));

      return `
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <!-- Borde lateral de estado -->
          <div class="absolute left-0 top-0 bottom-0 w-1.5 ${
            op.estado === 'en_llamada' ? 'bg-rose-500' :
            op.estado === 'disponible' ? 'bg-emerald-500' :
            op.estado === 'gestionando' ? 'bg-blue-500' : 'bg-amber-500'
          }"></div>

          <!-- Cabecera de la tarjeta del operador -->
          <div class="flex items-start justify-between gap-3 mb-4">
            <div class="flex items-center gap-3">
              <img src="${op.avatar}" alt="${op.nombre}" class="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-sm" />
              <div>
                <h3 class="font-bold text-slate-800 text-base leading-tight">${op.nombre}</h3>
                <div class="text-xs text-slate-400 mt-0.5">${op.email}</div>
                <div class="text-[11px] text-slate-500 mt-0.5 font-medium">
                  Cartera: <strong>${carteraAsignada.length} titulares</strong> (${Formatters.currency(deudaAsignada)})
                </div>
              </div>
            </div>
            <div class="text-right">
              ${Formatters.operadorEstadoBadge(op.estado)}
              <div class="text-[11px] text-slate-400 mt-1 font-mono">
                <i class="far fa-clock mr-1"></i>${op.tiempoEstado || '00:00'}
              </div>
            </div>
          </div>

          <!-- Actividad en tiempo real -->
          <div class="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100 text-xs">
            <div class="text-slate-400 font-semibold mb-1 flex items-center justify-between">
              <span>Gestión en curso:</span>
              <span class="text-[10px] uppercase font-bold text-blue-600">${op.estado.replace('_', ' ')}</span>
            </div>
            <div class="font-medium text-slate-700 truncate">
              <i class="fas fa-user-circle mr-1 text-slate-400"></i> ${op.titularActual || 'En espera de llamado'}
            </div>
          </div>

          <!-- Métricas de Productividad Hoy -->
          <div class="grid grid-cols-3 gap-2 text-center text-xs mb-4">
            <div class="p-2 bg-slate-50 rounded-lg">
              <div class="text-slate-400 font-medium text-[11px]">Llamadas</div>
              <div class="text-sm font-bold text-slate-800">${op.llamadasHoy || 0}</div>
            </div>
            <div class="p-2 bg-blue-50/50 rounded-lg">
              <div class="text-blue-500 font-medium text-[11px]">Promesas</div>
              <div class="text-sm font-bold text-blue-700">${op.promesasHoy || 0}</div>
            </div>
            <div class="p-2 bg-emerald-50/50 rounded-lg">
              <div class="text-emerald-600 font-medium text-[11px]">Efectividad</div>
              <div class="text-sm font-bold text-emerald-700">${op.efectividad || 0}%</div>
            </div>
          </div>

          <!-- Barra de Meta Diaria de Cobranza -->
          <div class="space-y-1 mb-4">
            <div class="flex justify-between text-xs font-semibold">
              <span class="text-slate-500">Recuperado Hoy:</span>
              <span class="text-emerald-600 font-bold">${Formatters.currency(op.recaudadoHoy)}</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div class="h-2.5 rounded-full transition-all duration-500 ${
                pctCumplimiento >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
              }" style="width: ${pctCumplimiento}%"></div>
            </div>
            <div class="flex justify-between text-[11px] text-slate-400">
              <span>Meta: ${Formatters.currency(op.metaDiaria)}</span>
              <span class="font-bold text-slate-600">${pctCumplimiento}%</span>
            </div>
          </div>

          <!-- Acciones de Supervisión Rápida -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-1">
              <button onclick="OperadoresModule.cambiarEstado('${op.id}', 'disponible')" 
                      title="Poner Disponible" 
                      class="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-medium text-[11px]">
                Disp.
              </button>
              <button onclick="OperadoresModule.cambiarEstado('${op.id}', 'en_llamada')" 
                      title="Simular llamada" 
                      class="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded font-medium text-[11px]">
                Llamar
              </button>
              <button onclick="OperadoresModule.cambiarEstado('${op.id}', 'pausa')" 
                      title="Poner en pausa" 
                      class="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded font-medium text-[11px]">
                Pausa
              </button>
            </div>
            <button onclick="OperadoresModule.verCarteraOperador('${op.id}')" 
                    class="px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg text-slate-700 font-medium transition-colors">
              Ver Cartera <i class="fas fa-chevron-right ml-1"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Ranking de Operadores (Top Cobradores)
    if (rankingContainer) {
      const ranking = [...operadores].sort((a, b) => (b.recaudadoHoy || 0) - (a.recaudadoHoy || 0));
      rankingContainer.innerHTML = ranking.map((op, idx) => {
        const medalla = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
        return `
          <div class="flex items-center justify-between p-3 rounded-xl ${
            idx === 0 ? 'bg-amber-50/70 border border-amber-200' : 'bg-white border border-slate-100'
          } mb-2">
            <div class="flex items-center gap-3">
              <span class="text-base font-bold w-6 text-center">${medalla}</span>
              <img src="${op.avatar}" class="w-8 h-8 rounded-full object-cover" />
              <div>
                <div class="font-bold text-slate-800 text-xs">${op.nombre}</div>
                <div class="text-[10px] text-slate-400">${op.promesasHoy} promesas logradas</div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-bold text-emerald-600 text-xs">${Formatters.currency(op.recaudadoHoy)}</div>
              <div class="text-[10px] text-slate-400">${op.efectividad}% efect.</div>
            </div>
          </div>
        `;
      }).join('');
    }
  },

  cambiarEstado(opId, nuevoEstado) {
    const titulares = StorageService.getTitulares();
    let titularActual = 'Disponible para nueva cuenta';

    if (nuevoEstado === 'en_llamada') {
      const opTitulares = titulares.filter(t => t.operadorId === opId);
      if (opTitulares.length > 0) {
        const randomTitular = opTitulares[Math.floor(Math.random() * opTitulares.length)];
        titularActual = `${randomTitular.nombre} (${randomTitular.cuenta})`;
      } else {
        titularActual = 'En llamada de seguimiento';
      }
    } else if (nuevoEstado === 'pausa') {
      titularActual = 'Refrigerio / Pausa de descanso';
    } else if (nuevoEstado === 'gestionando') {
      titularActual = 'Redactando notificación y liquidación';
    }

    StorageService.updateOperadorEstado(opId, nuevoEstado, titularActual);
    this.render();
    App.showToast(`Estado de operador actualizado a: ${nuevoEstado}`, 'info');
  },

  verCarteraOperador(opId) {
    // Cambiar a pestaña titulares con filtro del operador
    App.switchTab('titulares');
    const filterOperador = document.getElementById('filter-operador');
    if (filterOperador) {
      filterOperador.value = opId;
      TitularesModule.renderLista();
    }
  },

  abrirModalReasignar(titularId) {
    const titular = StorageService.getTitularById(titularId);
    if (!titular) return;

    const modal = document.getElementById('modal-reasignar');
    const select = document.getElementById('reasignar-nuevo-operador');
    const nombreTitular = document.getElementById('reasignar-titular-nombre');
    const hiddenId = document.getElementById('reasignar-titular-id');

    if (nombreTitular) nombreTitular.textContent = titular.nombre;
    if (hiddenId) hiddenId.value = titular.id;

    if (select) {
      const operadores = StorageService.getOperadores();
      select.innerHTML = operadores.map(op => `
        <option value="${op.id}" ${op.id === titular.operadorId ? 'selected' : ''}>
          ${op.nombre} (${op.id === titular.operadorId ? 'Actual' : 'Reasignar'})
        </option>
      `).join('');
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  cerrarModalReasignar() {
    const modal = document.getElementById('modal-reasignar');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  guardarReasignacion(e) {
    e.preventDefault();
    const titularId = document.getElementById('reasignar-titular-id').value;
    const nuevoOperadorId = document.getElementById('reasignar-nuevo-operador').value;

    if (StorageService.reasignarTitular(titularId, nuevoOperadorId)) {
      this.cerrarModalReasignar();
      TitularesModule.renderLista();
      if (TitularesModule.titularSeleccionado?.id === titularId) {
        TitularesModule.seleccionarTitular(titularId);
      }
      this.render();
      App.showToast('Titular reasignado exitosamente al nuevo operador', 'success');
    }
  },

  toggleSimulacion() {
    const btn = document.getElementById('btn-toggle-simulacion');
    if (this.isSimulando) {
      clearInterval(this.simulacionInterval);
      this.isSimulando = false;
      if (btn) {
        btn.innerHTML = '<i class="fas fa-play mr-2"></i> Iniciar Simulación en Vivo';
        btn.className = 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2';
      }
      App.showToast('Simulación de actividad en vivo pausada', 'info');
    } else {
      this.isSimulando = true;
      if (btn) {
        btn.innerHTML = '<i class="fas fa-pause mr-2"></i> Pausar Simulación';
        btn.className = 'px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 animate-pulse';
      }
      App.showToast('Simulación activa: monitoreando llamadas y avances en tiempo real', 'success');

      // Cada 4 segundos simula un evento de un operador al azar
      this.simulacionInterval = setInterval(() => {
        const operadores = StorageService.getOperadores();
        const randomOp = operadores[Math.floor(Math.random() * operadores.length)];
        const estados = ['disponible', 'en_llamada', 'gestionando'];
        const nuevoEstado = estados[Math.floor(Math.random() * estados.length)];

        // Si pasa a disponible desde llamada, sumar una llamada realizada
        if (randomOp.estado === 'en_llamada' && nuevoEstado === 'disponible') {
          randomOp.llamadasHoy = (randomOp.llamadasHoy || 0) + 1;
        }

        randomOp.estado = nuevoEstado;
        if (nuevoEstado === 'en_llamada') {
          randomOp.titularActual = `Llamando a titular (${Math.floor(1000 + Math.random() * 9000)})`;
        } else if (nuevoEstado === 'disponible') {
          randomOp.titularActual = 'Listo para asignación';
        }

        StorageService.saveOperadores(operadores);
        this.render();
      }, 4000);
    }
  }
};

window.OperadoresModule = OperadoresModule;
