// Módulo de Operaciones, Cargas Masivas y Gestión de Usuarios para CobranzasPro
const OperacionesModule = {
  operacionActiva: 'stock', // 'stock', 'gestiones', 'telefonos', 'mails', 'laborales', 'usuarios'
  datosPrevisualizados: [],
  usuarioEnEdicionId: null,

  configuraciones: {
    stock: {
      titulo: 'Carga de Stock de Carteras',
      descripcion: 'Importa nuevos titulares o actualiza deudas existentes en la cartera activa.',
      columnas: ['DNI', 'Nombre', 'Entidad', 'Cuenta', 'Producto', 'DeudaTotal', 'Capital', 'Intereses', 'Gastos', 'DiasMora', 'TramoMora', 'OperadorId'],
      plantillaHeader: 'DNI;Nombre;Entidad;Cuenta;Producto;DeudaTotal;Capital;Intereses;Gastos;DiasMora;TramoMora;OperadorId',
      ejemplo: '40123456;García Andrés Marcelo;Banco Metropolitano;CTA-9921-00;Préstamo Personal;180000;140000;30000;10000;35;mora_31_60;OP01\r\n29988776;Sánchez Claudia Beatriz;Tarjeta Dorada;CTA-4412-11;Tarjeta de Crédito;75000;60000;11000;4000;20;mora_1_30;OP02'
    },
    gestiones: {
      titulo: 'Carga de Gestiones Masivas',
      descripcion: 'Importa lotes de gestiones telefónicas, SMS o campañas masivas asociadas por DNI a titulares existentes.',
      columnas: ['DNI', 'Operador', 'Canal', 'Resultado', 'Observaciones', 'MontoPromesa', 'FechaPromesa'],
      plantillaHeader: 'DNI;Operador;Canal;Resultado;Observaciones;MontoPromesa;FechaPromesa',
      ejemplo: '32415890;Carlos Martínez;Llamada telefónica;Compromiso de Pago;Acuerda abonar saldo;90000;2026-09-15\r\n28910455;Valentina Soto;WhatsApp;Mensaje recordatorio enviado;Se envía estado de deuda;;'
    },
    telefonos: {
      titulo: 'Carga Masiva de Teléfonos',
      descripcion: 'Enriquece y agrega nuevos números de contacto a los titulares buscados por DNI.',
      columnas: ['DNI', 'NumeroTelefono', 'Tipo', 'Observacion'],
      plantillaHeader: 'DNI;NumeroTelefono;Tipo;Observacion',
      ejemplo: '32415890;+5491166778899;Celular Alternativo;WhatsApp directo\r\n36789123;+5491144332211;Laboral;Conmutador interno 204\r\n28910455;+5491199887766;Familiar;Hermano'
    },
    mails: {
      titulo: 'Carga Masiva de Correos Electrónicos',
      descripcion: 'Agrega direcciones de email adicionales a las fichas de los titulares por DNI.',
      columnas: ['DNI', 'Email', 'Tipo'],
      plantillaHeader: 'DNI;Email;Tipo',
      ejemplo: '32415890;juan.perez.laboral@empresa.com;Laboral\r\n28910455;roberto_gomez88@hotmail.com;Personal'
    },
    laborales: {
      titulo: 'Carga de Datos Laborales',
      descripcion: 'Incorpora información de empleadores, cargos, teléfonos laborales y sueldos por DNI.',
      columnas: ['DNI', 'Empleador', 'CuitEmpleador', 'Cargo', 'TelefonoLaboral', 'SueldoEstimado'],
      plantillaHeader: 'DNI;Empleador;CuitEmpleador;Cargo;TelefonoLaboral;SueldoEstimado',
      ejemplo: '32415890;Cervecería Quilmes SA;30-50001234-9;Jefe de Logística;+5491143445500;950000\r\n36789123;Comercio Central SRL;30-68119922-3;Vendedora de Mostrador;+5491147889911;450000'
    },
    usuarios: {
      titulo: 'Gestión de Usuarios y Accesos',
      descripcion: 'Administra, crea, edita o da de baja usuarios con formato simple nombre.apellido y roles de acceso.',
      columnas: ['Nombre Completo', 'Usuario (nombre.apellido)', 'Rol de Acceso', 'Contraseña', 'Estado', 'Acciones']
    }
  },

  init() {
    this.bindEvents();
    this.cambiarOperacion('stock');
  },

  bindEvents() {
    // Botones de sub-operación
    document.querySelectorAll('.btn-sub-operacion').forEach(btn => {
      btn.addEventListener('click', () => {
        const op = btn.getAttribute('data-operacion');
        this.cambiarOperacion(op);
      });
    });

    // Botón descargar plantilla
    const btnDescargar = document.getElementById('btn-descargar-plantilla');
    if (btnDescargar) {
      btnDescargar.addEventListener('click', () => this.descargarPlantilla());
    }

    // Botón cargar ejemplo
    const btnCargarEjemplo = document.getElementById('btn-cargar-ejemplo');
    if (btnCargarEjemplo) {
      btnCargarEjemplo.addEventListener('click', () => this.cargarEjemploEnTexto());
    }

    // Botón analizar / previsualizar
    const btnAnalizar = document.getElementById('btn-analizar-datos');
    if (btnAnalizar) {
      btnAnalizar.addEventListener('click', () => this.analizarEntrada());
    }

    // File input change
    const fileInput = document.getElementById('input-archivo-csv');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.leerArchivo(e));
    }

    // Botón confirmar importación
    const btnConfirmar = document.getElementById('btn-confirmar-importacion');
    if (btnConfirmar) {
      btnConfirmar.addEventListener('click', () => this.ejecutarImportacion());
    }

    // Formulario de Usuario (Crear/Editar)
    const formUsuario = document.getElementById('form-modal-usuario');
    if (formUsuario) {
      formUsuario.addEventListener('submit', (e) => this.guardarUsuario(e));
    }

    // Búsqueda de usuarios
    const searchUsuarios = document.getElementById('search-usuarios');
    if (searchUsuarios) {
      searchUsuarios.addEventListener('input', () => this.renderUsuarios());
    }
  },

  cambiarOperacion(op) {
    if (!this.configuraciones[op]) return;
    this.operacionActiva = op;
    this.datosPrevisualizados = [];

    // Estilos de botones
    document.querySelectorAll('.btn-sub-operacion').forEach(btn => {
      if (btn.getAttribute('data-operacion') === op) {
        btn.classList.add('bg-blue-600', 'text-white', 'shadow-sm');
        btn.classList.remove('bg-white', 'text-slate-600', 'border-slate-200');
      } else {
        btn.classList.remove('bg-blue-600', 'text-white', 'shadow-sm');
        btn.classList.add('bg-white', 'text-slate-600', 'border-slate-200');
      }
    });

    const conf = this.configuraciones[op];
    const elTitulo = document.getElementById('op-modulo-titulo');
    const elDesc = document.getElementById('op-modulo-desc');
    const panelLotes = document.getElementById('op-panel-lotes');
    const panelUsuarios = document.getElementById('op-panel-usuarios');
    const previewContainer = document.getElementById('op-preview-container');

    if (elTitulo) elTitulo.textContent = conf.titulo;
    if (elDesc) elDesc.textContent = conf.descripcion;
    if (previewContainer) previewContainer.classList.add('hidden');

    if (op === 'usuarios') {
      if (panelLotes) panelLotes.classList.add('hidden');
      if (panelUsuarios) panelUsuarios.classList.remove('hidden');
      this.renderUsuarios();
    } else {
      if (panelUsuarios) panelUsuarios.classList.add('hidden');
      if (panelLotes) panelLotes.classList.remove('hidden');

      const elColumnas = document.getElementById('op-modulo-columnas');
      const txtInput = document.getElementById('textarea-datos-masivos');
      if (txtInput) txtInput.value = '';

      if (elColumnas && conf.columnas) {
        elColumnas.innerHTML = conf.columnas.map(c => `
          <span class="px-2 py-1 bg-slate-100 text-slate-700 rounded-md font-mono text-[11px] font-semibold border border-slate-200">
            ${c}
          </span>
        `).join('');
      }
    }
  },

  // ==========================================
  // GESTIÓN DE USUARIOS (SUBMÓDULO)
  // ==========================================
  renderUsuarios() {
    const tbody = document.getElementById('tabla-usuarios-tbody');
    const contador = document.getElementById('contador-usuarios');
    if (!tbody || !window.AuthService) return;

    let usuarios = AuthService.getUsuarios();
    const query = (document.getElementById('search-usuarios')?.value || '').toLowerCase().trim();

    if (query) {
      usuarios = usuarios.filter(u => 
        u.nombre.toLowerCase().includes(query) || 
        u.usuario.toLowerCase().includes(query) ||
        u.rol.toLowerCase().includes(query)
      );
    }

    if (contador) contador.textContent = `${usuarios.length} usuario(s) registrados`;

    if (usuarios.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400 text-xs">No se encontraron usuarios coincidentes.</td></tr>`;
      return;
    }

    const sesionActual = AuthService.getCurrentUser();

    tbody.innerHTML = usuarios.map(u => {
      const isMe = sesionActual && sesionActual.id === u.id;
      return `
        <tr class="border-b hover:bg-slate-50/80 text-xs text-slate-700">
          <td class="p-3">
            <div class="flex items-center gap-3">
              <img src="${u.avatar}" class="w-9 h-9 rounded-full object-cover border border-slate-200" />
              <div>
                <strong class="text-slate-800 font-bold">${u.nombre}</strong>
                ${isMe ? '<span class="ml-1.5 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">Tú</span>' : ''}
              </div>
            </div>
          </td>
          <td class="p-3">
            <span class="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">${u.usuario}</span>
          </td>
          <td class="p-3">
            ${AuthService.getRolBadge(u.rol)}
          </td>
          <td class="p-3 font-mono text-slate-500">
            ••••••••
          </td>
          <td class="p-3">
            <span class="badge ${u.estado === 'activo' ? 'badge-success' : 'badge-danger'} uppercase text-[10px]">
              ${u.estado || 'activo'}
            </span>
          </td>
          <td class="p-3 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="OperacionesModule.abrirModalEditarUsuario('${u.id}')" 
                      class="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600 font-semibold transition-colors flex items-center gap-1">
                <i class="fas fa-edit text-xs"></i> Editar
              </button>
              ${!isMe ? `
                <button onclick="OperacionesModule.eliminarUsuario('${u.id}')" 
                        class="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-600 font-semibold transition-colors flex items-center gap-1">
                  <i class="fas fa-trash-alt text-xs"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  abrirModalCrearUsuario() {
    this.usuarioEnEdicionId = null;
    const modal = document.getElementById('modal-usuario');
    const titulo = document.getElementById('modal-usuario-titulo');
    const form = document.getElementById('form-modal-usuario');

    if (titulo) titulo.textContent = 'Crear Nuevo Usuario';
    if (form) form.reset();

    const inputUser = document.getElementById('usuario-input-login');
    if (inputUser) inputUser.readOnly = false;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  abrirModalEditarUsuario(id) {
    const usuarios = AuthService.getUsuarios();
    const user = usuarios.find(u => u.id === id);
    if (!user) return;

    this.usuarioEnEdicionId = id;
    const modal = document.getElementById('modal-usuario');
    const titulo = document.getElementById('modal-usuario-titulo');

    if (titulo) titulo.textContent = `Editar Usuario: ${user.nombre}`;

    document.getElementById('usuario-input-nombre').value = user.nombre;
    document.getElementById('usuario-input-login').value = user.usuario;
    document.getElementById('usuario-input-password').value = user.password || '';
    document.getElementById('usuario-input-rol').value = user.rol;
    document.getElementById('usuario-input-estado').value = user.estado || 'activo';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  cerrarModalUsuario() {
    const modal = document.getElementById('modal-usuario');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    this.usuarioEnEdicionId = null;
  },

  guardarUsuario(e) {
    e.preventDefault();
    const nombre = document.getElementById('usuario-input-nombre').value.trim();
    const usuario = document.getElementById('usuario-input-login').value.trim();
    const password = document.getElementById('usuario-input-password').value.trim();
    const rol = document.getElementById('usuario-input-rol').value;
    const estado = document.getElementById('usuario-input-estado').value;

    if (!nombre || !usuario) {
      App.showToast('Nombre y Usuario son obligatorios', 'error');
      return;
    }

    if (this.usuarioEnEdicionId) {
      // Editar
      const res = AuthService.editarUsuario(this.usuarioEnEdicionId, {
        nombre,
        usuario,
        password: password || '123',
        rol,
        estado
      });
      if (res.success) {
        App.showToast(`Usuario ${res.usuario.usuario} actualizado correctamente`, 'success');
        this.cerrarModalUsuario();
        this.renderUsuarios();
        App.actualizarHeaderUsuario();
      } else {
        App.showToast(res.message, 'error');
      }
    } else {
      // Crear
      const res = AuthService.crearUsuario({
        nombre,
        usuario,
        password: password || '123',
        rol,
        estado
      });
      if (res.success) {
        App.showToast(`Usuario ${res.usuario.usuario} creado con éxito`, 'success');
        this.cerrarModalUsuario();
        this.renderUsuarios();
      } else {
        App.showToast(res.message, 'error');
      }
    }
  },

  eliminarUsuario(id) {
    const user = AuthService.getUsuarios().find(u => u.id === id);
    if (!user) return;

    if (confirm(`¿Estás seguro de que deseas eliminar el acceso al usuario "${user.usuario}" (${user.nombre})?`)) {
      const res = AuthService.eliminarUsuario(id);
      if (res.success) {
        App.showToast('Usuario eliminado correctamente', 'info');
        this.renderUsuarios();
      } else {
        App.showToast(res.message, 'error');
      }
    }
  },

  // ==========================================
  // CARGAS MASIVAS (CSV / EXCEL)
  // ==========================================
  descargarPlantilla() {
    const conf = this.configuraciones[this.operacionActiva];
    if (!conf.plantillaHeader) return;
    const contenido = '\uFEFF' + conf.plantillaHeader + '\r\n' + (conf.ejemplo || '');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Plantilla_${this.operacionActiva}_CobranzasPro.csv`;
    link.click();
    App.showToast(`Plantilla descargada: Plantilla_${this.operacionActiva}.csv`, 'success');
  },

  cargarEjemploEnTexto() {
    const conf = this.configuraciones[this.operacionActiva];
    const txtInput = document.getElementById('textarea-datos-masivos');
    if (txtInput && conf.plantillaHeader) {
      txtInput.value = conf.plantillaHeader + '\n' + (conf.ejemplo || '');
      this.analizarEntrada();
      App.showToast('Datos de ejemplo cargados en el área de texto', 'info');
    }
  },

  leerArchivo(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const contenido = event.target.result;
      const txtInput = document.getElementById('textarea-datos-masivos');
      if (txtInput) {
        txtInput.value = contenido;
        this.analizarEntrada();
      }
    };
    reader.readAsText(file, 'UTF-8');
  },

  analizarEntrada() {
    const texto = (document.getElementById('textarea-datos-masivos')?.value || '').trim();
    if (!texto) {
      App.showToast('Por favor ingrese o pegue los datos para procesar', 'error');
      return;
    }

    const lineas = texto.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lineas.length === 0) return;

    const primeraLinea = lineas[0];
    let separador = ';';
    if (primeraLinea.includes('\t')) separador = '\t';
    else if (primeraLinea.includes(';') && !primeraLinea.includes('\t')) separador = ';';
    else if (primeraLinea.includes(',') && !primeraLinea.includes(';')) separador = ',';

    const encabezados = lineas[0].split(separador).map(h => h.trim().replace(/^["']|["']$/g, ''));
    const conf = this.configuraciones[this.operacionActiva];
    const tieneCabecera = encabezados.some(h => conf.columnas.some(c => c.toLowerCase() === h.toLowerCase()));
    const lineasDatos = tieneCabecera ? lineas.slice(1) : lineas;

    const registros = [];
    const titularesActuales = StorageService.getTitulares();

    lineasDatos.forEach(linea => {
      const celdas = linea.split(separador).map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (celdas.length < 2) return;

      const filaObj = {};
      conf.columnas.forEach((col, idx) => {
        filaObj[col] = celdas[idx] || '';
      });

      const cleanDni = String(filaObj['DNI'] || '').replace(/[^0-9]/g, '');
      const titularMatch = titularesActuales.find(t => String(t.dni).replace(/[^0-9]/g, '') === cleanDni);
      filaObj._titularExiste = !!titularMatch;
      filaObj._titularNombre = titularMatch ? titularMatch.nombre : 'No encontrado';

      registros.push(filaObj);
    });

    this.datosPrevisualizados = registros;
    this.renderPrevisualizacion();
  },

  renderPrevisualizacion() {
    const container = document.getElementById('op-preview-container');
    const thead = document.getElementById('op-preview-thead');
    const tbody = document.getElementById('op-preview-tbody');
    const badgeCount = document.getElementById('op-preview-count');
    const conf = this.configuraciones[this.operacionActiva];

    if (!container || !thead || !tbody) return;

    if (this.datosPrevisualizados.length === 0) {
      container.classList.add('hidden');
      App.showToast('No se detectaron registros válidos en los datos', 'error');
      return;
    }

    if (badgeCount) {
      badgeCount.textContent = `${this.datosPrevisualizados.length} registros listos`;
    }

    let thHtml = `<th class="p-2.5 text-slate-600 font-semibold text-center w-12">#</th>`;
    thHtml += `<th class="p-2.5 text-slate-600 font-semibold">Estado Titular</th>`;
    conf.columnas.forEach(col => {
      thHtml += `<th class="p-2.5 text-slate-600 font-semibold">${col}</th>`;
    });
    thead.innerHTML = `<tr class="bg-slate-50 border-b text-xs">${thHtml}</tr>`;

    const previewFilas = this.datosPrevisualizados.slice(0, 15);
    tbody.innerHTML = previewFilas.map((row, idx) => {
      let tdHtml = `<td class="p-2 text-center text-slate-400 font-mono text-xs">${idx + 1}</td>`;
      
      if (this.operacionActiva === 'stock') {
        tdHtml += `<td class="p-2"><span class="badge ${row._titularExiste ? 'badge-warning' : 'badge-success'}">${row._titularExiste ? 'Actualizar' : 'Nuevo'}</span></td>`;
      } else {
        tdHtml += `<td class="p-2"><span class="badge ${row._titularExiste ? 'badge-success' : 'badge-danger'}">${row._titularExiste ? 'Existe (' + row._titularNombre.split(' ')[0] + ')' : 'DNI No Encontrado'}</span></td>`;
      }

      conf.columnas.forEach(col => {
        tdHtml += `<td class="p-2 text-xs text-slate-700 truncate max-w-[150px]">${row[col] || '-'}</td>`;
      });

      return `<tr class="border-b hover:bg-slate-50/80">${tdHtml}</tr>`;
    }).join('');

    container.classList.remove('hidden');
    container.scrollIntoView({ behavior: 'smooth' });
  },

  ejecutarImportacion() {
    if (this.datosPrevisualizados.length === 0) {
      App.showToast('No hay datos para importar', 'error');
      return;
    }

    let resultado = 0;
    const op = this.operacionActiva;

    if (op === 'stock') {
      const mapeados = this.datosPrevisualizados.map(r => ({
        dni: r['DNI'],
        nombre: r['Nombre'],
        entidad: r['Entidad'],
        cuenta: r['Cuenta'],
        producto: r['Producto'],
        deudaTotal: Number(r['DeudaTotal'] || 0),
        capital: Number(r['Capital'] || 0),
        intereses: Number(r['Intereses'] || 0),
        gastos: Number(r['Gastos'] || 0),
        diasMora: Number(r['DiasMora'] || 30),
        tramoMora: r['TramoMora'] || 'mora_1_30',
        operadorId: r['OperadorId'] || 'OP01'
      }));
      resultado = StorageService.importarStockCartera(mapeados);

    } else if (op === 'gestiones') {
      const mapeados = this.datosPrevisualizados.map(r => ({
        dni: r['DNI'],
        operador: r['Operador'],
        canal: r['Canal'],
        resultado: r['Resultado'],
        observaciones: r['Observaciones'],
        montoPromesa: r['MontoPromesa'],
        fechaPromesa: r['FechaPromesa']
      }));
      resultado = StorageService.importarGestionesMasivas(mapeados);

    } else if (op === 'telefonos') {
      const mapeados = this.datosPrevisualizados.map(r => ({
        dni: r['DNI'],
        numero: r['NumeroTelefono'],
        tipo: r['Tipo'],
        observacion: r['Observacion']
      }));
      resultado = StorageService.importarTelefonos(mapeados);

    } else if (op === 'mails') {
      const mapeados = this.datosPrevisualizados.map(r => ({
        dni: r['DNI'],
        email: r['Email'],
        tipo: r['Tipo']
      }));
      resultado = StorageService.importarMails(mapeados);

    } else if (op === 'laborales') {
      const mapeados = this.datosPrevisualizados.map(r => ({
        dni: r['DNI'],
        empleador: r['Empleador'],
        cuitEmpleador: r['CuitEmpleador'],
        cargo: r['Cargo'],
        telefonoLaboral: r['TelefonoLaboral'],
        sueldoEstimado: r['SueldoEstimado']
      }));
      resultado = StorageService.importarDatosLaborales(mapeados);
    }

    App.showToast(`¡Operación completada! Se procesaron ${resultado} registros con éxito.`, 'success');
    
    document.getElementById('textarea-datos-masivos').value = '';
    document.getElementById('op-preview-container').classList.add('hidden');
    this.datosPrevisualizados = [];

    if (window.TitularesModule) TitularesModule.renderLista();
    if (window.ReportesModule) ReportesModule.generarReporte();
    if (window.OperadoresModule) OperadoresModule.render();
    App.actualizarKPIs();
  }
};

window.OperacionesModule = OperacionesModule;
