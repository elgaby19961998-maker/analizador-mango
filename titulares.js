// Módulo de Búsqueda y Gestión de Titulares
const TitularesModule = {
  titularSeleccionado: null,

  init() {
    this.bindEvents();
    this.cargarOperadoresFiltro();
    this.renderLista();
  },

  bindEvents() {
    // Buscador en vivo
    const searchInput = document.getElementById('search-titular');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderLista());
    }

    // Filtros
    const filterMora = document.getElementById('filter-mora');
    if (filterMora) {
      filterMora.addEventListener('change', () => this.renderLista());
    }

    const filterGestion = document.getElementById('filter-gestion');
    if (filterGestion) {
      filterGestion.addEventListener('change', () => this.renderLista());
    }

    const filterOperador = document.getElementById('filter-operador');
    if (filterOperador) {
      filterOperador.addEventListener('change', () => this.renderLista());
    }

    // Formulario de Nueva Gestión
    const formGestion = document.getElementById('form-nueva-gestion');
    if (formGestion) {
      formGestion.addEventListener('submit', (e) => this.guardarNuevaGestion(e));
    }

    // Toggle campos de promesa en modal de gestión
    const resultadoSelect = document.getElementById('gestion-resultado');
    if (resultadoSelect) {
      resultadoSelect.addEventListener('change', (e) => {
        const promesaContainer = document.getElementById('container-promesa-pago');
        if (e.target.value === 'Compromiso de Pago') {
          promesaContainer.classList.remove('hidden');
        } else {
          promesaContainer.classList.add('hidden');
        }
      });
    }

    // Formulario de Registrar Pago
    const formPago = document.getElementById('form-registrar-pago');
    if (formPago) {
      formPago.addEventListener('submit', (e) => this.guardarPago(e));
    }
  },

  cargarOperadoresFiltro() {
    const filterOperador = document.getElementById('filter-operador');
    const modalOpSelect = document.getElementById('gestion-operador');
    const modalPagoOpSelect = document.getElementById('pago-operador');
    
    if (!filterOperador) return;

    const operadores = StorageService.getOperadores();
    
    // Filtro
    let optionsHtml = '<option value="todos">Todos los Operadores</option>';
    operadores.forEach(op => {
      optionsHtml += `<option value="${op.id}">${op.nombre}</option>`;
    });
    filterOperador.innerHTML = optionsHtml;

    // Selector en modal gestión
    if (modalOpSelect) {
      let modalOptions = '';
      operadores.forEach(op => {
        modalOptions += `<option value="${op.id}">${op.nombre}</option>`;
      });
      modalOpSelect.innerHTML = modalOptions;
    }

    // Selector en modal pago
    if (modalPagoOpSelect) {
      let modalPagoOptions = '';
      operadores.forEach(op => {
        modalPagoOptions += `<option value="${op.nombre}">${op.nombre}</option>`;
      });
      modalPagoOpSelect.innerHTML = modalPagoOptions;
    }
  },

  filtrarTitulares() {
    const titulares = StorageService.getTitulares();
    const query = (document.getElementById('search-titular')?.value || '').toLowerCase().trim();
    const filterMora = document.getElementById('filter-mora')?.value || 'todos';
    const filterGestion = document.getElementById('filter-gestion')?.value || 'todos';
    const filterOperador = document.getElementById('filter-operador')?.value || 'todos';

    return titulares.filter(titular => {
      // Texto de búsqueda
      const matchText = !query || 
        titular.nombre.toLowerCase().includes(query) ||
        titular.dni.includes(query) ||
        (titular.telefono && titular.telefono.includes(query)) ||
        (titular.cuenta && titular.cuenta.toLowerCase().includes(query));

      // Filtro mora
      const matchMora = filterMora === 'todos' || titular.tramoMora === filterMora;

      // Filtro gestión
      const matchGestion = filterGestion === 'todos' || titular.estadoGestion === filterGestion;

      // Filtro operador
      const matchOperador = filterOperador === 'todos' || titular.operadorId === filterOperador;

      return matchText && matchMora && matchGestion && matchOperador;
    });
  },

  renderLista() {
    const container = document.getElementById('lista-titulares');
    const contador = document.getElementById('contador-titulares');
    if (!container) return;

    const titularesFiltrados = this.filtrarTitulares();
    const operadores = StorageService.getOperadores();

    if (contador) {
      contador.textContent = `${titularesFiltrados.length} titular(es) encontrados`;
    }

    if (titularesFiltrados.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">
          <i class="fas fa-search text-4xl mb-3 text-slate-300"></i>
          <p class="text-base font-semibold text-slate-600">No se encontraron titulares con los filtros aplicados</p>
          <p class="text-sm text-slate-400">Prueba ajustando los términos de búsqueda o limpiando los filtros.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = titularesFiltrados.map(titular => {
      const op = operadores.find(o => o.id === titular.operadorId);
      const nombreOperador = op ? op.nombre : 'Sin Asignar';
      const isSelected = this.titularSeleccionado && this.titularSeleccionado.id === titular.id;

      return `
        <div onclick="TitularesModule.seleccionarTitular('${titular.id}')" 
             class="cursor-pointer transition-all duration-150 p-4 rounded-xl border mb-3 bg-white hover:border-blue-400 hover:shadow-md ${
               isSelected ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/20' : 'border-slate-200'
             }">
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-800 text-base hover:text-blue-600">${titular.nombre}</span>
                ${Formatters.tramoBadge(titular.tramoMora)}
              </div>
              <div class="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                <span><i class="far fa-id-card mr-1 text-slate-400"></i> DNI/CUIT: <strong>${titular.dni}</strong></span>
                <span><i class="fas fa-university mr-1 text-slate-400"></i> ${titular.entidad}</span>
                <span><i class="far fa-credit-card mr-1 text-slate-400"></i> ${titular.producto}</span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs text-slate-400 uppercase font-semibold">Deuda Total</div>
              <div class="text-lg font-extrabold ${titular.deudaTotal > 0 ? 'text-red-600' : 'text-emerald-600'}">
                ${Formatters.currency(titular.deudaTotal)}
              </div>
              <div class="text-xs text-slate-500">${titular.diasMora} días en mora</div>
            </div>
          </div>

          <div class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="text-slate-400">Estado:</span>
              ${Formatters.estadoGestionBadge(titular.estadoGestion)}
              ${titular.promesaPago && titular.promesaPago.estado === 'pendiente' 
                ? `<span class="badge badge-yellow text-[11px]"><i class="far fa-calendar-check mr-1"></i> Promesa: ${Formatters.currency(titular.promesaPago.monto)} (${Formatters.date(titular.promesaPago.fecha)})</span>` 
                : ''}
            </div>
            <div class="flex items-center gap-2 text-slate-500">
              <i class="fas fa-headset text-slate-400"></i>
              <span class="font-medium">${nombreOperador}</span>
              <button class="ml-2 px-3 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg transition-colors font-medium">
                Gestionar <i class="fas fa-chevron-right ml-1"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Si no hay seleccionado o el seleccionado fue eliminado de los filtros, autoseleccionar el primero
    if (!this.titularSeleccionado && titularesFiltrados.length > 0) {
      this.seleccionarTitular(titularesFiltrados[0].id);
    }
  },

  seleccionarTitular(id) {
    const titular = StorageService.getTitularById(id);
    if (!titular) return;

    this.titularSeleccionado = titular;
    this.renderDetalleTitular();

    // Re-render lista para actualizar el highlight
    const items = document.querySelectorAll('#lista-titulares > div');
    const titulares = this.filtrarTitulares();
    titulares.forEach((t, index) => {
      if (items[index]) {
        if (t.id === id) {
          items[index].classList.add('ring-2', 'ring-blue-500', 'border-blue-500', 'bg-blue-50/20');
        } else {
          items[index].classList.remove('ring-2', 'ring-blue-500', 'border-blue-500', 'bg-blue-50/20');
        }
      }
    });
  },

  renderDetalleTitular() {
    const t = this.titularSeleccionado;
    const container = document.getElementById('detalle-titular');
    if (!t || !container) return;

    const operadores = StorageService.getOperadores();
    const op = operadores.find(o => o.id === t.operadorId);
    const nombreOperador = op ? op.nombre : 'Sin Asignar';

    // Generar mensaje predeterminado de cobranza para WhatsApp
    const mensajeWhatsApp = encodeURIComponent(
      `Estimado/a ${t.nombre}, nos comunicamos de cobranzas de ${t.entidad} por su cuenta ${t.cuenta} con un saldo pendiente de ${Formatters.currency(t.deudaTotal)}. Por favor contáctenos a la brevedad para coordinar facilidades de pago o envíenos el comprobante si ya realizó su depósito.`
    );
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${t.telefono.replace(/[^0-9]/g, '')}&text=${mensajeWhatsApp}`;

    container.innerHTML = `
      <!-- Encabezado de la Ficha -->
      <div class="bg-gradient-to-r from-slate-900 to-indigo-900 text-white p-5 rounded-2xl shadow-sm mb-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-xl font-bold">${t.nombre}</h2>
              ${Formatters.tramoBadge(t.tramoMora)}
            </div>
            <p class="text-xs text-indigo-200 mt-1">
              DNI/CUIT: <span class="font-semibold text-white">${t.dni}</span> | 
              Cuenta: <span class="font-semibold text-white">${t.cuenta}</span> | 
              ${t.entidad} (${t.producto})
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="TitularesModule.abrirModalGestion()" 
                    class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2">
              <i class="fas fa-phone-alt"></i> Registrar Gestión
            </button>
            <button onclick="TitularesModule.abrirModalPago()" 
                    class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2">
              <i class="fas fa-hand-holding-usd"></i> Registrar Pago
            </button>
          </div>
        </div>

        <!-- Botones de Acción Directa -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-indigo-800/60 text-xs">
          <a href="tel:${t.telefono}" 
             class="flex items-center justify-center gap-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors">
            <i class="fas fa-phone"></i> Llamar Directo
          </a>
          <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" 
             class="flex items-center justify-center gap-2 p-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors">
            <i class="fab fa-whatsapp text-sm"></i> WhatsApp Cobranza
          </a>
          <a href="mailto:${t.email}?subject=Aviso de Cobranza ${t.entidad}" 
             class="flex items-center justify-center gap-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors">
            <i class="far fa-envelope"></i> Enviar Email
          </a>
          <button onclick="OperadoresModule.abrirModalReasignar('${t.id}')" 
                  class="flex items-center justify-center gap-2 p-2 bg-indigo-800/80 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
            <i class="fas fa-exchange-alt"></i> Reasignar Op.
          </button>
        </div>
      </div>

      <!-- Datos de Contacto, Laborales y Desglose Financiero -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <!-- Contactos y Ubicación -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Teléfonos y Contactos</h3>
          <div class="text-xs space-y-2 text-slate-600">
            <!-- Teléfono Principal -->
            <div class="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
              <div>
                <div class="flex items-center gap-1.5 font-bold text-slate-800">
                  <i class="fas fa-phone-alt text-blue-500"></i>
                  <span>${t.telefono}</span>
                </div>
                <span class="text-[10px] text-slate-400">Principal</span>
              </div>
              <div class="flex items-center gap-1">
                <a href="tel:${t.telefono}" class="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md" title="Llamar">
                  <i class="fas fa-phone"></i>
                </a>
                <a href="${whatsappUrl}" target="_blank" class="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-md" title="WhatsApp">
                  <i class="fab fa-whatsapp"></i>
                </a>
              </div>
            </div>

            <!-- Teléfonos Adicionales (cargados masivamente o manuales) -->
            ${(t.telefonosAdicionales && t.telefonosAdicionales.length > 0) ? t.telefonosAdicionales.map(tel => {
              const wsUrl = `https://api.whatsapp.com/send?phone=${tel.numero.replace(/[^0-9]/g, '')}&text=${mensajeWhatsApp}`;
              return `
                <div class="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                  <div>
                    <div class="flex items-center gap-1.5 font-semibold text-slate-800">
                      <i class="fas fa-mobile-screen text-slate-400"></i>
                      <span>${tel.numero}</span>
                    </div>
                    <span class="text-[10px] text-slate-400">${tel.tipo} ${tel.observacion ? '• ' + tel.observacion : ''}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <a href="tel:${tel.numero}" class="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md" title="Llamar">
                      <i class="fas fa-phone"></i>
                    </a>
                    <a href="${wsUrl}" target="_blank" class="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-md" title="WhatsApp">
                      <i class="fab fa-whatsapp"></i>
                    </a>
                  </div>
                </div>
              `;
            }).join('') : ''}

            <div class="flex items-center gap-2 pt-1">
              <i class="far fa-envelope w-4 text-blue-500"></i>
              <span class="truncate">${t.email || 'No registrado'}</span>
            </div>

            ${(t.emailsAdicionales && t.emailsAdicionales.length > 0) ? t.emailsAdicionales.map(em => `
              <div class="flex items-center gap-2 text-[11px] text-slate-500 pl-6">
                <i class="fas fa-at text-slate-400"></i>
                <span class="truncate">${em.email} (${em.tipo})</span>
              </div>
            `).join('') : ''}

            <div class="flex items-start gap-2 pt-1 border-t border-slate-100">
              <i class="fas fa-map-marker-alt w-4 text-blue-500 mt-0.5"></i>
              <span>${t.direccion || 'Sin domicilio fijado'}</span>
            </div>
            <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span class="text-slate-400">Operador a cargo:</span>
              <span class="font-bold text-slate-800">${nombreOperador}</span>
            </div>
          </div>
        </div>

        <!-- Desglose de Deuda -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 space-y-3">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Composición de la Deuda</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <div class="text-[11px] text-slate-400 font-semibold">Capital Original</div>
              <div class="text-sm font-bold text-slate-700">${Formatters.currency(t.capital)}</div>
            </div>
            <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <div class="text-[11px] text-slate-400 font-semibold">Intereses Compens.</div>
              <div class="text-sm font-bold text-slate-700">${Formatters.currency(t.intereses)}</div>
            </div>
            <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <div class="text-[11px] text-slate-400 font-semibold">Gastos / Honorarios</div>
              <div class="text-sm font-bold text-slate-700">${Formatters.currency(t.gastos)}</div>
            </div>
            <div class="p-2.5 bg-red-50 rounded-lg border border-red-100">
              <div class="text-[11px] text-red-500 font-semibold">Saldo Exigible Total</div>
              <div class="text-base font-extrabold text-red-700">${Formatters.currency(t.deudaTotal)}</div>
            </div>
          </div>

          <!-- Fechas clave -->
          <div class="pt-2 border-t border-slate-100 grid grid-cols-2 text-xs text-slate-500">
            <div>
              <i class="far fa-calendar-times text-red-400 mr-1"></i>
              Vencimiento: <strong class="text-slate-700">${Formatters.date(t.fechaVencimiento)}</strong> (${t.diasMora} días)
            </div>
            <div>
              <i class="far fa-calendar-check text-emerald-500 mr-1"></i>
              Último pago: <strong class="text-slate-700">${Formatters.date(t.ultimoPago?.fecha)}</strong> (${Formatters.currency(t.ultimoPago?.monto)})
            </div>
          </div>

          <!-- Bloque de Datos Laborales -->
          <div class="pt-3 border-t border-slate-100">
            <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <i class="fas fa-briefcase text-indigo-500"></i> Datos Laborales y Empleo
            </h4>
            ${t.datosLaborales ? `
              <div class="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span class="text-slate-400 text-[10px] block">Empleador / Razón Social</span>
                  <strong class="text-slate-800">${t.datosLaborales.empleador}</strong>
                </div>
                <div>
                  <span class="text-slate-400 text-[10px] block">Cargo / Puesto</span>
                  <strong class="text-slate-800">${t.datosLaborales.cargo || '-'}</strong>
                </div>
                <div>
                  <span class="text-slate-400 text-[10px] block">Tel. Laboral</span>
                  <strong class="text-slate-800">${t.datosLaborales.telefonoLaboral || '-'}</strong>
                </div>
                <div>
                  <span class="text-slate-400 text-[10px] block">CUIT Empleador</span>
                  <strong class="text-slate-800">${t.datosLaborales.cuitEmpleador || '-'}</strong>
                </div>
              </div>
            ` : `
              <div class="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-400 text-center flex items-center justify-between">
                <span>Sin datos laborales registrados para este titular.</span>
                <button onclick="App.switchTab('operaciones')" class="text-blue-600 font-semibold hover:underline text-[11px]">
                  + Cargar datos laborales
                </button>
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Promesa de Pago Activa (si existe) -->
      ${t.promesaPago ? `
        <div class="mb-4 p-4 rounded-xl border ${
          t.promesaPago.estado === 'pendiente' 
            ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
            : t.promesaPago.estado === 'cumplida' 
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50/80 border-rose-200 text-rose-900'
        } flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 mt-0.5">
              <i class="fas fa-handshake text-lg ${
                t.promesaPago.estado === 'pendiente' ? 'text-amber-600' : t.promesaPago.estado === 'cumplida' ? 'text-emerald-600' : 'text-rose-600'
              }"></i>
            </div>
            <div>
              <div class="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <span>Compromiso de Pago:</span>
                <span class="badge ${t.promesaPago.estado === 'pendiente' ? 'badge-warning' : t.promesaPago.estado === 'cumplida' ? 'badge-success' : 'badge-danger'} capitalize">
                  ${t.promesaPago.estado}
                </span>
              </div>
              <div class="text-base font-extrabold mt-0.5">
                Monto Arreglado: ${Formatters.currency(t.promesaPago.monto)}
              </div>
              <div class="text-xs opacity-90 mt-1 flex flex-wrap items-center gap-3">
                <span><i class="far fa-clock mr-1"></i> Gestión realizada: <strong>${Formatters.date(t.promesaPago.fechaGestion || t.gestiones?.[0]?.fecha || '-')}</strong></span>
                <span><i class="far fa-calendar-alt mr-1"></i> Fecha límite pactada: <strong>${Formatters.date(t.promesaPago.fechaPromesa || t.promesaPago.fecha)}</strong></span>
                <span><i class="far fa-user mr-1"></i> Operador: <strong>${t.promesaPago.operador || nombreOperador}</strong></span>
              </div>
            </div>
          </div>
          ${t.promesaPago.estado === 'pendiente' ? `
            <button onclick="TitularesModule.abrirModalPagoConMonto(${t.promesaPago.monto})" 
                    class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors shrink-0">
              <i class="fas fa-hand-holding-usd mr-1"></i> Cobrar Promesa
            </button>
          ` : ''}
        </div>
      ` : ''}

      <!-- Historial de Gestiones y Bitácora -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <i class="fas fa-history text-blue-600"></i>
            <h3 class="font-bold text-slate-800 text-sm">Historial de Gestiones y Contactos</h3>
          </div>
          <span class="text-xs text-slate-400">${(t.gestiones || []).length} gestiones registradas</span>
        </div>

        ${(!t.gestiones || t.gestiones.length === 0) ? `
          <div class="text-center py-8 text-slate-400">
            <i class="far fa-comment-dots text-3xl mb-2 text-slate-300"></i>
            <p class="text-xs">No hay gestiones previas registradas para este titular.</p>
            <button onclick="TitularesModule.abrirModalGestion()" class="mt-2 text-xs text-blue-600 font-semibold hover:underline">
              Registrar el primer contacto
            </button>
          </div>
        ` : `
          <div class="space-y-4">
            ${t.gestiones.map(g => `
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="font-bold text-slate-800">${g.resultado}</span>
                    <span class="text-[11px] text-slate-400">${g.fecha}</span>
                  </div>
                  <div class="text-slate-600 mb-2 leading-relaxed">${g.observaciones}</div>
                  <div class="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                    <span><i class="far fa-user mr-1 text-slate-300"></i> ${g.operador}</span>
                    <span><i class="fas fa-tag mr-1 text-slate-300"></i> Canal: ${g.canal}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  abrirModalGestion() {
    if (!this.titularSeleccionado) return;
    const modal = document.getElementById('modal-gestion');
    const labelTitular = document.getElementById('modal-gestion-titular-nombre');
    const labelDeuda = document.getElementById('modal-gestion-deuda');

    if (labelTitular) labelTitular.textContent = this.titularSeleccionado.nombre;
    if (labelDeuda) labelDeuda.textContent = Formatters.currency(this.titularSeleccionado.deudaTotal);

    // Reset fields
    document.getElementById('form-nueva-gestion')?.reset();
    document.getElementById('container-promesa-pago')?.classList.add('hidden');

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  cerrarModalGestion() {
    const modal = document.getElementById('modal-gestion');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  guardarNuevaGestion(e) {
    e.preventDefault();
    if (!this.titularSeleccionado) return;

    const canal = document.getElementById('gestion-canal').value;
    const resultado = document.getElementById('gestion-resultado').value;
    const observaciones = document.getElementById('gestion-observaciones').value;
    const operadorSelect = document.getElementById('gestion-operador');
    const operadorNombre = operadorSelect.options[operadorSelect.selectedIndex].text;
    const operadorId = operadorSelect.value;

    const gestionData = {
      canal,
      resultado,
      observaciones,
      operador: operadorNombre,
      operadorId
    };

    if (resultado === 'Compromiso de Pago') {
      const montoPromesa = document.getElementById('promesa-monto').value;
      const fechaPromesa = document.getElementById('promesa-fecha').value;
      if (montoPromesa && fechaPromesa) {
        gestionData.promesaPago = {
          monto: Number(montoPromesa),
          fechaGestion: new Date().toISOString().replace('T', ' ').substring(0, 16),
          fechaPromesa: fechaPromesa,
          fecha: fechaPromesa,
          operador: operadorNombre,
          estado: 'pendiente'
        };
      }
    }

    const titularActualizado = StorageService.addGestion(this.titularSeleccionado.id, gestionData);
    if (titularActualizado) {
      this.titularSeleccionado = titularActualizado;
      this.cerrarModalGestion();
      this.renderLista();
      this.renderDetalleTitular();
      App.showToast('Gestión registrada correctamente', 'success');
      App.actualizarKPIs();
      if (window.OperadoresModule) OperadoresModule.render();
    }
  },

  abrirModalPago() {
    if (!this.titularSeleccionado) return;
    this.abrirModalPagoConMonto(this.titularSeleccionado.deudaTotal);
  },

  abrirModalPagoConMonto(montoSugerido) {
    if (!this.titularSeleccionado) return;
    const modal = document.getElementById('modal-pago');
    const labelTitular = document.getElementById('modal-pago-titular-nombre');
    const labelDeuda = document.getElementById('modal-pago-deuda-actual');
    const inputMonto = document.getElementById('pago-monto');

    if (labelTitular) labelTitular.textContent = this.titularSeleccionado.nombre;
    if (labelDeuda) labelDeuda.textContent = Formatters.currency(this.titularSeleccionado.deudaTotal);
    if (inputMonto) inputMonto.value = montoSugerido || this.titularSeleccionado.deudaTotal;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  cerrarModalPago() {
    const modal = document.getElementById('modal-pago');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  guardarPago(e) {
    e.preventDefault();
    if (!this.titularSeleccionado) return;

    const monto = Number(document.getElementById('pago-monto').value);
    const metodo = document.getElementById('pago-metodo').value;
    const operador = document.getElementById('pago-operador').value;
    const comprobante = document.getElementById('pago-comprobante').value;
    const concepto = document.getElementById('pago-concepto').value;

    if (isNaN(monto) || monto <= 0) {
      App.showToast('Por favor ingrese un monto válido', 'error');
      return;
    }

    const resultado = StorageService.registrarPago({
      titularId: this.titularSeleccionado.id,
      monto,
      metodo,
      operador,
      comprobante,
      concepto
    });

    if (resultado) {
      this.titularSeleccionado = resultado.titularActualizado;
      this.cerrarModalPago();
      this.renderLista();
      this.renderDetalleTitular();
      App.showToast(`Pago por ${Formatters.currency(monto)} registrado con éxito`, 'success');
      App.actualizarKPIs();
      if (window.OperadoresModule) OperadoresModule.render();

      // Mostrar Comprobante para Imprimir
      this.mostrarReciboImprimible(resultado.pago);
    }
  },

  mostrarReciboImprimible(pago) {
    const modal = document.getElementById('modal-recibo');
    const body = document.getElementById('recibo-body');
    if (!modal || !body) return;

    body.innerHTML = `
      <div id="printable-receipt" class="bg-white p-6 rounded-xl border border-slate-200">
        <div class="flex justify-between items-start border-b pb-4 mb-4">
          <div>
            <h1 class="text-xl font-bold text-slate-800">COBRANZAS PRO</h1>
            <p class="text-xs text-slate-500">Gestión Integral de Recupero Crediticio</p>
            <p class="text-xs text-slate-400">Av. Libertador 1250, CABA | Tel: 0800-444-COBRO</p>
          </div>
          <div class="text-right">
            <span class="badge badge-success text-xs font-bold">PAGO REGISTRADO</span>
            <div class="text-xs text-slate-500 mt-1">Comprobante N°:</div>
            <div class="text-sm font-mono font-bold text-slate-800">${pago.comprobante}</div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 text-xs mb-4">
          <div>
            <span class="text-slate-400">Titular deudor:</span>
            <p class="font-bold text-slate-800 text-sm">${pago.titularNombre}</p>
            <p class="text-slate-500">ID Cuenta: ${pago.titularId}</p>
          </div>
          <div class="text-right">
            <span class="text-slate-400">Fecha y Hora de Emisión:</span>
            <p class="font-semibold text-slate-700">${pago.fecha}</p>
            <p class="text-slate-500">Operador: ${pago.operador}</p>
          </div>
        </div>

        <div class="border rounded-lg overflow-hidden mb-4 text-xs">
          <table class="w-full text-left">
            <thead class="bg-slate-50 border-b">
              <tr>
                <th class="p-2.5 font-semibold text-slate-600">Concepto</th>
                <th class="p-2.5 font-semibold text-slate-600">Método</th>
                <th class="p-2.5 font-semibold text-slate-600 text-right">Importe Cobrado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="p-2.5 text-slate-700">${pago.concepto}</td>
                <td class="p-2.5 text-slate-600">${pago.metodo}</td>
                <td class="p-2.5 font-extrabold text-slate-800 text-right">${Formatters.currency(pago.monto)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="p-3 bg-slate-50 rounded-lg text-center text-xs text-slate-500 mb-4">
          Este recibo constituye una constancia de cobro válida sujeta a acreditación de fondos bancarios.
        </div>

        <div class="flex justify-end gap-2 no-print">
          <button onclick="window.print()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2">
            <i class="fas fa-print"></i> Imprimir Recibo
          </button>
          <button onclick="document.getElementById('modal-recibo').classList.add('hidden')" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg">
            Cerrar
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
};

window.TitularesModule = TitularesModule;
