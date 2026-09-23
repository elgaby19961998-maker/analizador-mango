// ==========================================================================
// MangoAnalyzerModule - Motor de Análisis, Auditoría y KPIs de CRM Mango
// CobranzasPro - Analizador de Gestiones, Promesas y Monitoreo de Operadores
// ==========================================================================

const MangoAnalyzerModule = {
  // Estado interno de datos
  datosCrudos: [],
  datosFiltrados: [],
  operadoresMap: {},
  dnisMap: {},
  kpis: {},
  auditoria: {},
  filtros: {
    entidad: 'TODAS',
    operador: 'TODOS',
    canal: 'TODOS',
    resultado: 'TODOS',
    fechaDesde: '',
    fechaHasta: ''
  },
  operadorSeleccionado: null,
  graficos: {},

  init() {
    this.bindEvents();
    // Si no hay datos cargados, podemos verificar si hay datos en localStorage o iniciar vacío
    const cached = localStorage.getItem('mango_analyzer_last_data');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.procesarDatos(parsed, false);
          return;
        }
      } catch (e) {
        console.warn('Error leyendo caché de Mango CRM:', e);
      }
    }
  },

  bindEvents() {
    // Input de archivo Excel / CSV
    const fileInput = document.getElementById('mango-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    // Drag and drop zone
    const dropZone = document.getElementById('mango-drop-zone');
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-blue-500', 'bg-blue-50/50');
      });
      dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500', 'bg-blue-50/50');
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500', 'bg-blue-50/50');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.leerArchivo(e.dataTransfer.files[0]);
        }
      });
      dropZone.addEventListener('click', () => {
        if (fileInput) fileInput.click();
      });
    }

    // Botón de Cargar Ejemplo Demo 1-Clic
    const btnDemo = document.getElementById('btn-mango-cargar-demo');
    if (btnDemo) {
      btnDemo.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.cargarDatosEjemploMango();
      });
    }

    // Filtros
    const selectEntidad = document.getElementById('mango-filtro-entidad');
    if (selectEntidad) {
      selectEntidad.addEventListener('change', (e) => {
        this.filtros.entidad = e.target.value;
        this.aplicarFiltros();
      });
    }

    const selectOperador = document.getElementById('mango-filtro-operador');
    if (selectOperador) {
      selectOperador.addEventListener('change', (e) => {
        this.filtros.operador = e.target.value;
        this.aplicarFiltros();
      });
    }

    const selectCanal = document.getElementById('mango-filtro-canal');
    if (selectCanal) {
      selectCanal.addEventListener('change', (e) => {
        this.filtros.canal = e.target.value;
        this.aplicarFiltros();
      });
    }

    const selectResultado = document.getElementById('mango-filtro-resultado');
    if (selectResultado) {
      selectResultado.addEventListener('change', (e) => {
        this.filtros.resultado = e.target.value;
        this.aplicarFiltros();
      });
    }

    // Tipo / Criterio de Fecha (Gestión vs Próxima Acción)
    const selectTipoFecha = document.getElementById('mango-filtro-tipo-fecha');
    if (selectTipoFecha) {
      selectTipoFecha.addEventListener('change', () => this.aplicarFiltros());
    }

    const inputDesde = document.getElementById('mango-filtro-fecha-desde');
    const inputHasta = document.getElementById('mango-filtro-fecha-hasta');
    if (inputDesde) {
      inputDesde.removeAttribute('min');
      inputDesde.removeAttribute('max');
      inputDesde.addEventListener('change', () => this.aplicarFiltros());
      inputDesde.addEventListener('input', () => this.aplicarFiltros());
    }
    if (inputHasta) {
      inputHasta.removeAttribute('min');
      inputHasta.removeAttribute('max');
      inputHasta.addEventListener('change', () => this.aplicarFiltros());
      inputHasta.addEventListener('input', () => this.aplicarFiltros());
    }

    // Botón de Acción Principal "Aplicar Filtros"
    const btnAplicarFiltros = document.getElementById('btn-mango-aplicar-filtros');
    if (btnAplicarFiltros) {
      btnAplicarFiltros.addEventListener('click', (e) => {
        e.preventDefault();
        this.aplicarFiltros();
      });
    }

    // Botones de Restablecer Filtros
    const btnLimpiarFiltros = document.getElementById('btn-mango-limpiar-filtros');
    if (btnLimpiarFiltros) {
      btnLimpiarFiltros.addEventListener('click', () => this.limpiarFiltros());
    }
    const btnLimpiarBar = document.getElementById('btn-mango-limpiar-filtros-bar');
    if (btnLimpiarBar) {
      btnLimpiarBar.addEventListener('click', () => this.limpiarFiltros());
    }

    // Atajos Rápidos de Rango de Fecha (Hoy, 7 días, Mes, Todo)
    document.querySelectorAll('.btn-mango-atajo-fecha').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const rango = btn.getAttribute('data-rango');
        this.establecerRangoFecha(rango);
      });
    });

    // Buscador universal de DNI
    const inputBuscarDni = document.getElementById('mango-buscar-dni-global');
    if (inputBuscarDni) {
      inputBuscarDni.addEventListener('input', (e) => this.buscarDniGlobal(e.target.value));
    }

    // Buscador de DNI dentro del operador seleccionado
    const inputBuscarDniOp = document.getElementById('mango-op-buscar-dni');
    if (inputBuscarDniOp) {
      inputBuscarDniOp.addEventListener('input', (e) => this.filtrarDnisOperador(e.target.value));
    }

    // Filtro de resultado dentro del operador
    const selectOpResultado = document.getElementById('mango-op-filtro-resultado');
    if (selectOpResultado) {
      selectOpResultado.addEventListener('change', () => {
        const query = inputBuscarDniOp ? inputBuscarDniOp.value : '';
        this.filtrarDnisOperador(query);
      });
    }

    // Botones de exportación
    const btnExportarOperadores = document.getElementById('btn-mango-exportar-operadores');
    if (btnExportarOperadores) {
      btnExportarOperadores.addEventListener('click', () => this.exportarRankingOperadores());
    }

    const btnExportarDnisOp = document.getElementById('btn-mango-exportar-dnis-op');
    if (btnExportarDnisOp) {
      btnExportarDnisOp.addEventListener('click', () => this.exportarDnisOperador());
    }

    // Buscador en Modal de Diagnóstico / Auditoría
    const inputBuscarAuditoria = document.getElementById('mango-auditoria-modal-buscar');
    if (inputBuscarAuditoria) {
      inputBuscarAuditoria.addEventListener('input', (e) => this.filtrarCasosAuditoria(e.target.value));
    }
  },

  handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
      this.leerArchivo(file);
    }
  },

  leerArchivo(file) {
    const fileName = file.name;
    const extension = fileName.split('.').pop().toLowerCase();

    // Actualizar UI del dropzone con estado de carga
    const dropText = document.getElementById('mango-drop-text');
    if (dropText) {
      dropText.innerHTML = `<span class="text-blue-600 font-bold"><i class="fas fa-spinner fa-spin mr-2"></i> Procesando archivo: ${fileName}...</span>`;
    }

    if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          this.procesarDatos(json, true, fileName);
        } catch (err) {
          console.error('Error al procesar Excel:', err);
          alert('Error al leer el archivo Excel. Asegúrate de que sea un archivo válido exportado de Mango CRM.');
          this.restablecerDropZone();
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (extension === 'csv' || extension === 'txt') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const json = this.parseCSVToJSON(text);
          this.procesarDatos(json, true, fileName);
        } catch (err) {
          console.error('Error al procesar CSV:', err);
          alert('Error al leer el archivo CSV. Revisa el delimitador.');
          this.restablecerDropZone();
        }
      };
      reader.readAsText(file, 'ISO-8859-1'); // o UTF-8
    } else {
      alert('Formato no soportado. Por favor sube un archivo Excel (.xlsx, .xls) o CSV.');
      this.restablecerDropZone();
    }
  },

  parseCSVToJSON(csvText) {
    const lines = csvText.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    // Detectar separador (; o , o \t)
    const firstLine = lines[0];
    let delimiter = ';';
    if ((firstLine.match(/;/g) || []).length < (firstLine.match(/,/g) || []).length) {
      delimiter = ',';
    }
    if ((firstLine.match(/\t/g) || []).length > (firstLine.match(new RegExp(delimiter, 'g')) || []).length) {
      delimiter = '\t';
    }

    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] !== undefined ? values[idx] : '';
      });
      result.push(row);
    }
    return result;
  },

  // ==========================================================================
  // UTILIDADES DE FECHAS (ISO YYYY-MM-DD) Y ATAJOS
  // ==========================================================================
  normalizarFechaISO(raw) {
    if (!raw && raw !== 0) return '';
    
    // Si ya es un objeto Date
    if (raw instanceof Date) {
      if (isNaN(raw.getTime())) return '';
      const y = raw.getFullYear();
      const m = String(raw.getMonth() + 1).padStart(2, '0');
      const d = String(raw.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // Si es un número serial de Excel (ej: 45556 o 46286.482)
    if (typeof raw === 'number' || (!isNaN(raw) && !String(raw).includes('/') && !String(raw).includes('-'))) {
      const num = parseFloat(raw);
      if (num > 20000 && num < 70000) {
        const utc_days = Math.floor(num - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        const y = date_info.getUTCFullYear();
        const m = String(date_info.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date_info.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }

    const str = String(raw).trim();
    if (!str) return '';

    // Formato YYYY-MM-DD o YYYY/MM/DD o YYYY.MM.DD (ej: 2026-09-21)
    const matchYMD = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
    if (matchYMD) {
      const y = matchYMD[1];
      const m = String(parseInt(matchYMD[2], 10)).padStart(2, '0');
      const d = String(parseInt(matchYMD[3], 10)).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // Formato DD/MM/YYYY o DD-MM-YYYY o DD.MM.YYYY (ej: 21/09/2026 o 21/09/2026 14:30:00)
    const matchDMY = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
    if (matchDMY) {
      let d = parseInt(matchDMY[1], 10);
      let m = parseInt(matchDMY[2], 10);
      let y = parseInt(matchDMY[3], 10);
      if (y < 100) y += 2000;
      const dStr = String(d).padStart(2, '0');
      const mStr = String(m).padStart(2, '0');
      return `${y}-${mStr}-${dStr}`;
    }

    return str;
  },

  formatearFechaDisplay(fechaISO) {
    if (!fechaISO) return '';
    const match = String(fechaISO).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }
    return String(fechaISO);
  },

  establecerRangoFecha(tipo) {
    const inputDesde = document.getElementById('mango-filtro-fecha-desde');
    const inputHasta = document.getElementById('mango-filtro-fecha-hasta');
    if (!inputDesde || !inputHasta) return;

    // Asegurar que no existan restricciones min/max en el navegador
    inputDesde.removeAttribute('min');
    inputDesde.removeAttribute('max');
    inputHasta.removeAttribute('min');
    inputHasta.removeAttribute('max');

    const pad = (n) => String(n).padStart(2, '0');
    const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    // Obtener la fecha más representativa según los datos cargados o la fecha actual
    const fechasDatos = (this.datosCrudos || []).map(d => d.fechaISO).filter(Boolean).sort();
    const ultimaFecha = fechasDatos.length > 0 ? fechasDatos[fechasDatos.length - 1] : null;

    let fechaRef = new Date();
    if (ultimaFecha) {
      const p = ultimaFecha.split('-');
      if (p.length === 3) {
        fechaRef = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
      }
    }

    if (tipo === 'hoy') {
      const fechaHoy = ultimaFecha || toISO(new Date());
      inputDesde.value = fechaHoy;
      inputHasta.value = fechaHoy;
    } else if (tipo === '7dias') {
      const sieteDiasAtras = new Date(fechaRef);
      sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);
      inputDesde.value = toISO(sieteDiasAtras);
      inputHasta.value = toISO(fechaRef);
    } else if (tipo === 'mes') {
      const primerDia = new Date(fechaRef.getFullYear(), fechaRef.getMonth(), 1);
      inputDesde.value = toISO(primerDia);
      inputHasta.value = toISO(fechaRef);
    } else if (tipo === 'todo') {
      inputDesde.value = '';
      inputHasta.value = '';
    }

    this.aplicarFiltros();
  },

  actualizarResumenFiltrosUI() {
    const elResumen = document.getElementById('mango-filtros-resumen');
    if (!elResumen) return;

    const total = this.datosCrudos.length;
    const filtrados = this.datosFiltrados.length;
    const hayFiltros = filtrados < total || this.filtros.fechaDesde || this.filtros.fechaHasta || 
                       (this.filtros.operador && this.filtros.operador !== 'TODOS') || 
                       (this.filtros.entidad && this.filtros.entidad !== 'TODAS' && this.filtros.entidad !== 'TODOS');

    if (hayFiltros) {
      elResumen.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold animate-fadeIn shadow-sm">
          <i class="fas fa-filter text-emerald-600"></i>
          Filtro aplicado: ${filtrados.toLocaleString('es-AR')} de ${total.toLocaleString('es-AR')} gestiones
        </span>
      `;
    } else {
      elResumen.innerHTML = `
        <span class="text-slate-400 text-xs font-medium">
          Mostrando todas las gestiones (${total.toLocaleString('es-AR')})
        </span>
      `;
    }
  },

  // ==========================================================================
  // HELPERS DE PARSEO DE MONTOS Y ACUERDOS (CRM MANGO)
  // ==========================================================================
  limpiarNumeroMonto(str) {
    if (!str) return 0;
    let s = String(str).trim();
    // Si viene formato 50.000,00 -> 50000.00
    if (/^\d{1,3}(?:\.\d{3})*,\d{1,2}$/.test(s)) {
      s = s.replace(/\./g, '').replace(',', '.');
    }
    // Si viene formato 50.000 -> 50000
    else if (/^\d{1,3}\.\d{3}$/.test(s)) {
      s = s.replace(/\./g, '');
    }
    // Si tiene coma como decimal: 1500,50 -> 1500.50
    else if (/,\d+$/.test(s)) {
      s = s.replace(',', '.');
    }
    // Quitar cualquier caracter residual no numérico excepto el punto
    s = s.replace(/[^\d.]/g, '');
    const num = parseFloat(s) || 0;
    return (num > 0 && num < 1000000000) ? num : 0;
  },

  extraerMontoDeObservacion(obs) {
    if (!obs) return 0;

    // 1. Monto de cuota (ej: Monto de cuota: 143016 ó 336.611,00)
    let m = obs.match(/monto\s+de\s+cuota\s*[:=\$\?\s\u00A0]*(?:AR\$)?\s*([0-9\.,]+)/i);
    if (m && m[1]) {
      const val = this.limpiarNumeroMonto(m[1]);
      if (val > 0) return val;
    }

    // 2. Monto del anticipo (ej: Monto del anticipo: 50000)
    m = obs.match(/monto\s+del\s+anticipo\s*[:=\$\?\s\u00A0]*(?:AR\$)?\s*([0-9\.,]+)/i);
    if (m && m[1]) {
      const val = this.limpiarNumeroMonto(m[1]);
      if (val > 0) return val;
    }

    // 3. Monto de pago / Monto general (ej: Monto de pago: 43057, Monto: ?50.000,00, Monto: $250.000)
    m = obs.match(/monto(?:\s+de\s+pago)?\s*[:=\$\?\s\u00A0]*(?:AR\$)?\s*([0-9\.,]+)/i);
    if (m && m[1]) {
      const val = this.limpiarNumeroMonto(m[1]);
      if (val > 0) return val;
    }

    // 4. cuotas de $ XXX o pagos sueltos de $ XXX / plan de X cuotas de $ Y
    m = obs.match(/(?:cuotas?|pagos?\s+sueltos?)\s+(?:de\s+)?[:=\$\?\s\u00A0]*(?:AR\$)?\s*([0-9\.,]+)/i);
    if (m && m[1]) {
      const val = this.limpiarNumeroMonto(m[1]);
      if (val > 0) return val;
    }

    // 5. cancelacion min de $ XXX / pago de $ XXX / abona... de $ XXX
    m = obs.match(/(?:cancelaci[oó]n|pago|abona(?:r)?)\s+(?:min(?:ima)?\s+)?(?:de\s+)?[:=\$\?\s\u00A0]*(?:AR\$)?\s*([0-9\.,]+)/i);
    if (m && m[1]) {
      const val = this.limpiarNumeroMonto(m[1]);
      if (val > 0) return val;
    }

    // 6. Deuda minima / Deuda total si no hay otro monto de cuota
    m = obs.match(/(?:deuda\s*(?:m[ií]nima\s*total|total))\s*[:=\$\?\s\u00A0]*(?:AR\$)?\s*([0-9\.,]+)/i);
    if (m && m[1]) {
      const val = this.limpiarNumeroMonto(m[1]);
      if (val > 0) return val;
    }

    // 7. Simbolo pesos general
    m = obs.match(/\$\s*([0-9\.,]+)/);
    if (m && m[1]) {
      const val = this.limpiarNumeroMonto(m[1]);
      if (val > 0) return val;
    }

    return 0;
  },

  extraerDetalleAcuerdo(obs) {
    if (!obs) return { plan: '', cuota: '', vcto: '' };
    let plan = '';
    let cuota = '';
    let vcto = '';

    // Cantidad de cuotas: "Cantidad de cuota/s: 6", "acuerdo de 10 cuotas", "plan en 12 cuotas"
    const mPlan = obs.match(/(?:cantidad\s+de\s+cuotas?\/s?\s*[:=]\s*(\d+)|(?:acuerdo|plan)\s+(?:de\s+|en\s+)?(\d+)\s*cuotas?)/i);
    if (mPlan) plan = `${mPlan[1] || mPlan[2]} cuotas`;

    // Cuota que abona / cuota actual: "debe abonar su cuota N9", "cuota N4", "este mes abono su cuota N5", "ultima cuota"
    const mCuota = obs.match(/(?:cuota\s+(?:n[°º]?\s*)?(\d+)|([uú]ltima\s+cuota))/i);
    if (mCuota) cuota = mCuota[1] ? `Cuota N${mCuota[1]}` : 'Última cuota';

    // Vencimiento del acuerdo / cuota:
    // "Primer vencimiento: 01/09/2026", "Fecha vencimiento: 22/09/2026", "Fecha del anticipo: 14/09/2026", "con vcto 05/09", "vto: 03/09"
    const mVcto = obs.match(/(?:primer\s+vencimiento|fecha\s+(?:de\s+)?vencimiento|fecha\s+del\s+anticipo|fecha\s+anticipo|1er\s+vto|vcto(?:\.\s+del\s+anticipo)?|vcto|vto)\s*[:=\s]\s*([0-9]{1,2}[\/\-][0-9]{1,2}(?:[\/\-][0-9]{2,4})?)/i);
    if (mVcto) {
      vcto = mVcto[1].trim().replace(/-/g, '/');
      if (vcto.length <= 5 && vcto.includes('/')) {
        vcto += '/2026';
      }
    }

    return { plan, cuota, vcto };
  },

  // ==========================================================================
  // NORMALIZACIÓN DE COLUMNAS DE CRM MANGO
  // ==========================================================================
  normalizarFila(row) {
    // Buscar propiedades con orden estricto de prioridad por patrón y exclusión opcional
    const buscarValor = (patrones, excludes = []) => {
      const keys = Object.keys(row);
      for (const p of patrones) {
        const pClean = p.toLowerCase();
        for (const key of keys) {
          const cleanKey = key.toLowerCase().trim();
          
          // Verificar exclusiones (ej: evitar columnas que contengan 'id')
          const isExcluded = excludes.some(ex => cleanKey.includes(ex.toLowerCase()));
          if (isExcluded) continue;

          if (cleanKey.includes(pClean)) {
            const val = row[key];
            if (val !== undefined && val !== null && String(val).trim() !== '') {
              return val;
            }
          }
        }
      }
      return '';
    };

    const idEntidad = buscarValor(['identidad', 'entidad.id']);
    const entidad = buscarValor(['entidades.cdescripcio', 'entidades.cdescr', 'entidad', 'cartera', 'cliente']) || 'Sin Cartera';
    const idPersona = buscarValor(['idpersona', 'persona.id']);
    const tipoDoc = buscarValor(['tipodocu.cdescripcio', 'tipodocu.cdescripci', 'tipodoc']) || 'DNI';
    const dni = String(buscarValor(['personas.nnumedocu', 'nnumedocu', 'nrodoc', 'numerodocumento', 'personas.nn', 'personas.nnu', 'dni', 'documento'])).trim();
    const titular = buscarValor(['personas.ccontacto', 'ccontacto', 'personas.cdescripcio', 'personas.cdescr', 'personas.cnombre', 'titular', 'nombre', 'apellido']) || 'No Registrado';
    const idGestion = buscarValor(['idgestion', 'gestion.id']);
    
    // Fecha de gestión realizada (gestiones.dtFechHora)
    const fechaRaw = buscarValor(['gestiones.dtfechhora', 'dtfechhora', 'fechhora', 'gestiones.dfecha', 'dfecha', 'fecha']);
    const fechaISO = this.normalizarFechaISO(fechaRaw);
    const fechaDisplay = this.formatearFechaDisplay(fechaISO) || String(fechaRaw || '').trim();

    // Fecha de próxima acción / rellamada (gestiones.dtProxAcci)
    const fechaProxRaw = buscarValor(['gestiones.dtproxacci', 'dtproxacci', 'proxacci', 'dproxaccion', 'fechaprox', 'fechaproxima']);
    const fechaProxISO = this.normalizarFechaISO(fechaProxRaw);
    const fechaProxDisplay = this.formatearFechaDisplay(fechaProxISO) || String(fechaProxRaw || '').trim();

    const tipoContacto = buscarValor(['tipocont.cdescripcio', 'tipocont.cdescripci', 'tipocontacto', 'contacto']) || 'Sin Especificar';
    const canal = buscarValor(['entrgest.cdescripcio', 'entrgest.cdescripci', 'canal', 'entrgest', 'medio']) || 'Llamada';
    const idUsuario = buscarValor(['idusuario', 'usuario.id', 'gestiones.idusuario']);

    // ========================================================================
    // EXTRACCIÓN PRECISA DEL OPERADOR (APELLIDO.NOMBRE)
    // En Mango CRM la columna es: 'usuarios.cNombUsua' / 'usuarios.cNombUs' (ej: altamirano.sofia)
    // Se debe evitar estrictamente tomar 'gestiones.idUsuario' (ej: 163, 205)
    // ========================================================================
    let operador = '';
    const patronesOperador = [
      'usuarios.cnombusua',
      'usuarios.cnombus',
      'usuarios.cnomb',
      'cnombusua',
      'cnombus',
      'nombus',
      'usuarios.cnombre',
      'usuarios.cusuario',
      'usuarios.capellido',
      'coperador',
      'nombreoperador',
      'cobrador'
    ];

    // 1. Buscar en columnas de nombre/usuario excluyendo 'id' y validando que no sea solo número
    for (const p of patronesOperador) {
      for (const key of Object.keys(row)) {
        const cleanKey = key.toLowerCase().trim();
        if (cleanKey.includes('idusuario') || cleanKey.includes('id_usuario') || cleanKey.startsWith('id.') || cleanKey === 'id') {
          continue;
        }
        if (cleanKey.includes(p)) {
          const val = String(row[key] || '').trim();
          // Validar que no sea puramente numérico (ej: "163")
          if (val && !/^\d+$/.test(val)) {
            operador = val;
            break;
          }
        }
      }
      if (operador) break;
    }

    // 2. Si no se encontró, buscar cualquier columna con 'usuario' o 'nomb' que NO contenga 'id'
    if (!operador) {
      for (const key of Object.keys(row)) {
        const cleanKey = key.toLowerCase().trim();
        if (!cleanKey.includes('id') && (cleanKey.includes('usuario') || cleanKey.includes('nomb') || cleanKey.includes('operador'))) {
          const val = String(row[key] || '').trim();
          if (val && !/^\d+$/.test(val)) {
            operador = val;
            break;
          }
        }
      }
    }

    // 3. Fallback final si todas eran numéricas
    if (!operador) {
      const valFallback = buscarValor(['usuarios.cnombusua', 'usuarios.cnombus', 'usuarios.cnombre', 'usuarios.cusuario', 'operador', 'idusuario', 'usuario']);
      operador = String(valFallback || 'Sin Asignar').trim();
    }

    const resultado = (buscarValor(['resultados.cdescripcio', 'resultados.cdescripci', 'resultado', 'estado_gestion', 'tipificacion']) || 'Sin Resultado').trim();
    const proxAccion = buscarValor(['proxacci.cdescripcio', 'proxacci.cdescripci', 'proxaccion', 'proxima_accion']) || '';
    const fechaProxAccion = fechaProxDisplay;
    const telefono = buscarValor(['gestiones.cteldiscad', 'cteldiscad', 'telefono', 'ntelefono', 'celular']) || '';
    const observacion = buscarValor(['gestiones.cobservaci', 'cobservaci', 'observacion', 'cobservacion', 'comentario', 'detalle']) || '';
    
    // ========================================================================
    // MONTO DE PROMESA / COMPROMISO / ACUERDO
    // ========================================================================
    let montoRaw = buscarValor(
      ['gestiones.nmonto', 'nmonto', 'monto', 'importe', 'compromiso', 'valor', 'acuerdo', 'arreglo'],
      ['id', 'telefono', 'fecha', 'dni', 'documento', 'observacion']
    );
    let monto = 0;
    if (montoRaw) {
      monto = this.limpiarNumeroMonto(montoRaw);
    }

    // Fallback inteligente: si monto es 0 pero la observación especifica un monto de cuota, pago o acuerdo
    if (monto === 0 && observacion) {
      monto = this.extraerMontoDeObservacion(observacion);
    }

    const conArchivo = buscarValor(['con archivo', 'archivo', 'bconarchivo']) || 'No';
    const hipervinculo = buscarValor(['hipervinculo', 'link', 'url']) || '';

    // Clasificación de si es promesa, acuerdo o pago a imputar
    const resUpper = resultado.toUpperCase();
    const esAcuerdo = resUpper.includes('ACUERDO') || resUpper.includes('CONVENIO');
    const esPagoImputar = resUpper.includes('PAGO A IMPUTAR') || (resUpper.includes('PAGO') && !resUpper.includes('SIN'));
    const esPromesa = esPagoImputar || 
                      resUpper.includes('PROMESA') || 
                      resUpper.includes('COMPROMISO') || 
                      esAcuerdo ||
                      monto > 0;

    // Extracción de datos específicos de acuerdo (plan de cuotas, cuota actual, vcto)
    const acuerdoInfo = this.extraerDetalleAcuerdo(observacion);
    const fechaVencimiento = acuerdoInfo.vcto || (esAcuerdo && fechaProxDisplay ? fechaProxDisplay.split(' ')[0] : '');

    // Clasificación de contacto efectivo
    const tcUpper = tipoContacto.toUpperCase();
    const esContactoEfectivo = tcUpper.includes('TITULAR') || 
                              resUpper.includes('CONTACTADO') || 
                              resUpper.includes('PAGO') || 
                              resUpper.includes('TITULAR') || 
                              resUpper.includes('ACUERDO');

    return {
      idEntidad,
      entidad,
      idPersona,
      tipoDoc,
      dni: dni.replace(/[^0-9]/g, '') || dni,
      titular,
      idGestion,
      fecha: fechaDisplay,
      fechaISO: fechaISO,
      fechaProxAccion: fechaProxDisplay,
      fechaProxISO: fechaProxISO,
      fechaVencimiento,
      tipoContacto,
      canal,
      idUsuario,
      operador: operador || 'Operador Desconocido',
      resultado,
      proxAccion,
      telefono,
      observacion,
      monto,
      montoHeredado: false,
      conArchivo,
      hipervinculo,
      esAcuerdo,
      esPagoImputar,
      acuerdoInfo,
      esPromesa,
      esContactoEfectivo
    };
  },

  // ==========================================================================
  // PROCESAMIENTO Y AGREGACIONES
  // ==========================================================================
  procesarDatos(filas, guardarCache = true, nombreArchivo = 'Archivo Mango') {
    if (!filas || filas.length === 0) {
      alert('El archivo no contiene filas o está vacío.');
      this.restablecerDropZone();
      return;
    }

    // Pasada 1: Normalización de filas
    this.datosCrudos = filas.map(f => this.normalizarFila(f)).filter(f => f.dni || f.operador);

    // ========================================================================
    // PASADA 2: INTELIGENCIA DE ACUERDOS Y RENOVACIONES POR DNI (CROSS-REFERENCING)
    // "Tiene un acuerdo y viene abonando, siguen siendo acuerdos que se van renovando por mes"
    // ========================================================================
    const mapaAcuerdosPorDni = {};
    this.datosCrudos.forEach(r => {
      if (!r.dni) return;
      if ((r.esAcuerdo || r.esPagoImputar) && (r.monto > 0 || r.acuerdoInfo?.vcto)) {
        if (!mapaAcuerdosPorDni[r.dni] || (mapaAcuerdosPorDni[r.dni].monto < r.monto)) {
          mapaAcuerdosPorDni[r.dni] = {
            monto: r.monto,
            plan: r.acuerdoInfo?.plan || '',
            cuota: r.acuerdoInfo?.cuota || '',
            vcto: r.fechaVencimiento || r.acuerdoInfo?.vcto || '',
            fecha: r.fecha
          };
        } else if (!mapaAcuerdosPorDni[r.dni].vcto && (r.fechaVencimiento || r.acuerdoInfo?.vcto)) {
          mapaAcuerdosPorDni[r.dni].vcto = r.fechaVencimiento || r.acuerdoInfo?.vcto || '';
        }
      }
    });

    // Si un DNI tiene una gestión de acuerdo (ej: WhatsApp Acuerdo libre) y su monto es 0,
    // o viene abonando cuotas según otra gestión del mismo DNI, hereda el monto y vencimiento del acuerdo activo:
    this.datosCrudos.forEach(r => {
      if (!r.dni) return;
      if (mapaAcuerdosPorDni[r.dni]) {
        const info = mapaAcuerdosPorDni[r.dni];
        if (!r.fechaVencimiento && info.vcto) {
          r.fechaVencimiento = info.vcto;
          if (r.acuerdoInfo && !r.acuerdoInfo.vcto) r.acuerdoInfo.vcto = info.vcto;
        }
        if (r.esAcuerdo && (!r.monto || r.monto <= 0)) {
          r.monto = info.monto;
          r.montoHeredado = true;
          if (!r.acuerdoInfo.plan && info.plan) {
            r.acuerdoInfo.plan = info.plan;
          }
          if (!r.acuerdoInfo.cuota && info.cuota) {
            r.acuerdoInfo.cuota = info.cuota;
          }
        }
      }
    });

    if (guardarCache) {
      try {
        localStorage.setItem('mango_analyzer_last_data', JSON.stringify(filas.slice(0, 5000))); // guardar muestra representativa
      } catch (e) {
        console.warn('Almacenamiento local lleno, omitiendo persistencia.');
      }
    }

    // Actualizar UI del dropzone con éxito
    const dropText = document.getElementById('mango-drop-text');
    if (dropText) {
      dropText.innerHTML = `
        <div class="text-emerald-700 font-bold flex items-center justify-center gap-2">
          <i class="fas fa-check-circle text-emerald-500 text-lg"></i>
          <span>${nombreArchivo} cargado exitosamente (${this.datosCrudos.length.toLocaleString('es-AR')} gestiones)</span>
        </div>
        <p class="text-xs text-slate-500 mt-1">Haz clic o arrastra otro archivo para reemplazar</p>
      `;
    }

    // Mostrar contenedor de análisis y ocultar placeholder si existe
    const container = document.getElementById('mango-analisis-container');
    if (container) container.classList.remove('hidden');

    // Poblar selectores de filtros
    this.poblarFiltros();

    // Aplicar filtros iniciales (todos)
    this.aplicarFiltros();
  },

  poblarFiltros() {
    const entidades = new Set();
    const operadores = new Set();
    const canales = new Set();
    const resultados = new Set();

    this.datosCrudos.forEach(d => {
      if (d.entidad) entidades.add(d.entidad);
      if (d.operador) operadores.add(d.operador);
      if (d.canal) canales.add(d.canal);
      if (d.resultado) resultados.add(d.resultado);
    });

    const llenarSelect = (id, valores, defaultText) => {
      const el = document.getElementById(id);
      if (!el) return;
      const currentVal = el.value;
      el.innerHTML = `<option value="TODOS">${defaultText}</option>`;
      Array.from(valores).sort().forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        el.appendChild(opt);
      });
      if (valores.has(currentVal)) {
        el.value = currentVal;
      }
    };

    llenarSelect('mango-filtro-entidad', entidades, 'Todas las Carteras/Entidades');
    llenarSelect('mango-filtro-operador', operadores, 'Todos los Operadores');
    llenarSelect('mango-filtro-canal', canales, 'Todos los Canales');
    llenarSelect('mango-filtro-resultado', resultados, 'Todos los Resultados');

    // Garantizar que los selectores de fecha NUNCA tengan límites min/max que bloqueen días en el calendario
    const inputDesde = document.getElementById('mango-filtro-fecha-desde');
    const inputHasta = document.getElementById('mango-filtro-fecha-hasta');
    if (inputDesde) {
      inputDesde.removeAttribute('min');
      inputDesde.removeAttribute('max');
    }
    if (inputHasta) {
      inputHasta.removeAttribute('min');
      inputHasta.removeAttribute('max');
    }
  },

  limpiarFiltros() {
    this.filtros = {
      entidad: 'TODAS',
      operador: 'TODOS',
      canal: 'TODOS',
      resultado: 'TODOS',
      fechaDesde: '',
      fechaHasta: ''
    };

    const sE = document.getElementById('mango-filtro-entidad');
    const sO = document.getElementById('mango-filtro-operador');
    const sC = document.getElementById('mango-filtro-canal');
    const sR = document.getElementById('mango-filtro-resultado');
    const fD = document.getElementById('mango-filtro-fecha-desde');
    const fH = document.getElementById('mango-filtro-fecha-hasta');

    if (sE) sE.value = 'TODOS';
    if (sO) sO.value = 'TODOS';
    if (sC) sC.value = 'TODOS';
    if (sR) sR.value = 'TODOS';
    const sTF = document.getElementById('mango-filtro-tipo-fecha');
    if (sTF) sTF.value = 'GESTION';
    if (fD) {
      fD.value = '';
      fD.removeAttribute('min');
      fD.removeAttribute('max');
    }
    if (fH) {
      fH.value = '';
      fH.removeAttribute('min');
      fH.removeAttribute('max');
    }

    this.aplicarFiltros();
  },

  aplicarFiltros() {
    const sE = document.getElementById('mango-filtro-entidad');
    const sO = document.getElementById('mango-filtro-operador');
    const sC = document.getElementById('mango-filtro-canal');
    const sR = document.getElementById('mango-filtro-resultado');
    const fD = document.getElementById('mango-filtro-fecha-desde');
    const fH = document.getElementById('mango-filtro-fecha-hasta');

    if (sE) this.filtros.entidad = sE.value;
    if (sO) this.filtros.operador = sO.value;
    if (sC) this.filtros.canal = sC.value;
    if (sR) this.filtros.resultado = sR.value;

    const selectTipoFecha = document.getElementById('mango-filtro-tipo-fecha');
    const tipoFecha = selectTipoFecha ? selectTipoFecha.value : 'GESTION';

    let dDesde = fD && fD.value ? this.normalizarFechaISO(fD.value) : '';
    let dHasta = fH && fH.value ? this.normalizarFechaISO(fH.value) : '';

    // Si ambas fechas están ingresadas y 'Desde' es posterior a 'Hasta', ordenarlas inteligentemente
    if (dDesde && dHasta && dDesde > dHasta) {
      const temp = dDesde;
      dDesde = dHasta;
      dHasta = temp;
      if (fD) fD.value = dDesde;
      if (fH) fH.value = dHasta;
    }

    this.filtros.fechaDesde = dDesde;
    this.filtros.fechaHasta = dHasta;

    this.datosFiltrados = this.datosCrudos.filter(row => {
      if (this.filtros.entidad !== 'TODAS' && this.filtros.entidad !== 'TODOS' && row.entidad !== this.filtros.entidad) {
        return false;
      }
      if (this.filtros.operador !== 'TODOS' && row.operador !== this.filtros.operador) {
        return false;
      }
      if (this.filtros.canal !== 'TODOS' && row.canal !== this.filtros.canal) {
        return false;
      }
      if (this.filtros.resultado !== 'TODOS' && row.resultado !== this.filtros.resultado) {
        return false;
      }

      // Filtrado por fecha (Gestión realizada vs Próxima Acción agendada)
      if (this.filtros.fechaDesde || this.filtros.fechaHasta) {
        const fGest = row.fechaISO;
        const fProx = row.fechaProxISO;

        if (tipoFecha === 'PROXIMA') {
          const f = fProx || fGest;
          if (!f) return false;
          if (this.filtros.fechaDesde && f < this.filtros.fechaDesde) return false;
          if (this.filtros.fechaHasta && f > this.filtros.fechaHasta) return false;
        } else if (tipoFecha === 'AMBAS') {
          const cumpleGest = fGest && (!this.filtros.fechaDesde || fGest >= this.filtros.fechaDesde) && (!this.filtros.fechaHasta || fGest <= this.filtros.fechaHasta);
          const cumpleProx = fProx && (!this.filtros.fechaDesde || fProx >= this.filtros.fechaDesde) && (!this.filtros.fechaHasta || fProx <= this.filtros.fechaHasta);
          if (!cumpleGest && !cumpleProx) return false;
        } else {
          // GESTION (Predeterminado)
          const f = fGest || fProx;
          if (!f) return false;
          if (this.filtros.fechaDesde && f < this.filtros.fechaDesde) return false;
          if (this.filtros.fechaHasta && f > this.filtros.fechaHasta) return false;
        }
      }
      return true;
    });

    this.calcularMetricas();
    this.ejecutarAuditoria();
    this.renderKPIs();
    this.renderGraficos();
    this.renderAuditoriaUI();
    this.renderRankingOperadores();
    this.renderSelectorOperadorDetalle();
    this.actualizarResumenFiltrosUI();
  },

  // ==========================================================================
  // CÁLCULO DE MÉTRICAS Y AGREGACIONES
  // ==========================================================================
  calcularMetricas() {
    const totalGestiones = this.datosFiltrados.length;
    const dnisUnicosSet = new Set();
    const dnisPorOperador = {};
    const operadoresMap = {};
    const canalesMap = {};
    const resultadosMap = {};
    let totalPromesas = 0;
    let montoTotalPromesas = 0;
    let totalContactados = 0;
    let totalAcuerdosVigentes = 0;
    let totalPagosImputar = 0;
    let montoTotalAcuerdos = 0;
    let montoTotalPagos = 0;

    this.datosFiltrados.forEach(row => {
      const dni = row.dni;
      const op = row.operador;
      if (dni) dnisUnicosSet.add(dni);

      // Mapa de Canales
      canalesMap[row.canal] = (canalesMap[row.canal] || 0) + 1;

      // Mapa de Resultados
      resultadosMap[row.resultado] = (resultadosMap[row.resultado] || 0) + 1;

      if (row.esPromesa) {
        totalPromesas++;
        montoTotalPromesas += row.monto;
      }

      if (row.esAcuerdo) {
        totalAcuerdosVigentes++;
        montoTotalAcuerdos += row.monto;
      }

      if (row.esPagoImputar) {
        totalPagosImputar++;
        montoTotalPagos += row.monto;
      }

      if (row.esContactoEfectivo) {
        totalContactados++;
      }

      // Estructura por operador
      if (!operadoresMap[op]) {
        operadoresMap[op] = {
          nombre: op,
          gestiones: 0,
          dnisSet: new Set(),
          contactados: 0,
          promesas: 0,
          acuerdos: 0,
          pagosImputar: 0,
          montoTotal: 0,
          montoAcuerdos: 0,
          canales: {},
          resultados: {},
          gestionesSinNota: 0,
          gestionesNotaCorta: 0,
          promesasSinMonto: 0,
          promesasSinFecha: 0,
          fechasSet: new Set(),
          dnisDetalle: {} // mapa dni -> info
        };
      }

      const opData = operadoresMap[op];
      opData.gestiones++;
      if (dni) opData.dnisSet.add(dni);
      if (row.esContactoEfectivo) opData.contactados++;
      if (row.esPromesa) {
        opData.promesas++;
        opData.montoTotal += row.monto;
        if (!row.esAcuerdo && row.monto <= 0) opData.promesasSinMonto++;
        if (!row.fechaProxAccion) opData.promesasSinFecha++;
      }
      if (row.esAcuerdo) {
        opData.acuerdos = (opData.acuerdos || 0) + 1;
        opData.montoAcuerdos = (opData.montoAcuerdos || 0) + row.monto;
      }
      if (row.esPagoImputar) {
        opData.pagosImputar = (opData.pagosImputar || 0) + 1;
      }

      // Canales del operador
      opData.canales[row.canal] = (opData.canales[row.canal] || 0) + 1;
      // Resultados del operador
      opData.resultados[row.resultado] = (opData.resultados[row.resultado] || 0) + 1;

      const fDia = row.fechaISO || (row.fecha ? row.fecha.split(' ')[0] : '');
      if (fDia) opData.fechasSet.add(fDia);

      // Calidad de notas
      const obs = (row.observacion || '').trim();
      if (!obs) {
        opData.gestionesSinNota++;
      } else if (obs.length < 15 || obs.toLowerCase().includes('observacion corta')) {
        opData.gestionesNotaCorta++;
      }

      // Trazabilidad de DNIs para este operador
      if (dni) {
        if (!opData.dnisDetalle[dni]) {
          opData.dnisDetalle[dni] = {
            dni: dni,
            titular: row.titular,
            entidad: row.entidad,
            cantidadToques: 0,
            ultimoResultado: row.resultado,
            ultimoCanal: row.canal,
            ultimaFecha: row.fecha,
            fechaVencimiento: row.fechaVencimiento || '',
            montoPromesa: 0,
            observaciones: [],
            hipervinculo: row.hipervinculo,
            tienePromesa: false,
            esAcuerdo: false,
            tienePagoImputar: false,
            montoPagoImputar: 0,
            acuerdoInfo: null
          };
        }
        const dniInfo = opData.dnisDetalle[dni];
        dniInfo.cantidadToques++;
        dniInfo.ultimoResultado = row.resultado;
        dniInfo.ultimoCanal = row.canal;
        dniInfo.ultimaFecha = row.fecha;
        if (row.fechaVencimiento && !dniInfo.fechaVencimiento) {
          dniInfo.fechaVencimiento = row.fechaVencimiento;
        }
        if (row.observacion) dniInfo.observaciones.push(row.observacion);
        if (row.monto > 0) dniInfo.montoPromesa = Math.max(dniInfo.montoPromesa, row.monto);
        if (row.esPromesa) dniInfo.tienePromesa = true;
        if (row.esAcuerdo) dniInfo.esAcuerdo = true;
        if (row.esPagoImputar) {
          dniInfo.tienePagoImputar = true;
          if (row.monto > 0) dniInfo.montoPagoImputar = Math.max(dniInfo.montoPagoImputar, row.monto);
        }
        if (row.acuerdoInfo && row.acuerdoInfo.plan) dniInfo.acuerdoInfo = row.acuerdoInfo;
        if (row.hipervinculo) dniInfo.hipervinculo = row.hipervinculo;
      }
    });

    // Mapeo cruzado de pagos a imputar y acuerdos para toda la base (por DNI)
    const dnisConPagoGlobal = new Set();
    const dnisConAcuerdoGlobal = new Set();
    this.datosCrudos.forEach(r => {
      if (!r.dni) return;
      if (r.esPagoImputar) dnisConPagoGlobal.add(r.dni);
      if (r.esAcuerdo) dnisConAcuerdoGlobal.add(r.dni);
    });

    // Calcular días trabajados, promedio diario de DNIs (Meta: 60) y vincular pago a imputar por DNI
    Object.values(operadoresMap).forEach(op => {
      const dias = Math.max(1, op.fechasSet.size);
      const dnis = op.dnisSet.size;
      op.diasTrabajados = dias;
      op.promedioDnisDia = dnis / dias;
      op.cumplimientoMeta60 = (op.promedioDnisDia / 60) * 100;

      Object.values(op.dnisDetalle).forEach(d => {
        d.tienePagoImputar = dnisConPagoGlobal.has(d.dni);
        if (dnisConAcuerdoGlobal.has(d.dni)) d.esAcuerdo = true;
      });
    });

    const fechasGlobales = new Set(this.datosFiltrados.map(r => r.fechaISO || (r.fecha ? r.fecha.split(' ')[0] : '')).filter(Boolean));
    const diasGlobales = Math.max(1, fechasGlobales.size);
    const cantOperadores = Math.max(1, Object.keys(operadoresMap).length);
    const promedioDnisDiariosGlobal = dnisUnicosSet.size / (diasGlobales * cantOperadores);

    this.operadoresMap = operadoresMap;
    this.kpis = {
      totalGestiones,
      dnisUnicos: dnisUnicosSet.size,
      totalPromesas,
      montoTotalPromesas,
      totalContactados,
      totalAcuerdosVigentes,
      totalPagosImputar,
      montoTotalAcuerdos,
      montoTotalPagos,
      diasGlobales,
      promedioDnisDiariosGlobal,
      tasaContactabilidad: totalGestiones > 0 ? (totalContactados / totalGestiones) * 100 : 0,
      tasaConversionGlobal: totalGestiones > 0 ? (totalPromesas / totalGestiones) * 100 : 0,
      tasaConversionContactados: totalContactados > 0 ? (totalPromesas / totalContactados) * 100 : 0,
      ticketPromedio: totalPromesas > 0 ? (montoTotalPromesas / totalPromesas) : 0,
      promedioGestionesPorDni: dnisUnicosSet.size > 0 ? (totalGestiones / dnisUnicosSet.size) : 0,
      canalesMap,
      resultadosMap
    };
  },

  // ==========================================================================
  // MOTOR DE AUDITORÍA Y CALIDAD DE DATOS (EN QUÉ MEJORAR)
  // ==========================================================================
  ejecutarAuditoria() {
    const alertas = [];
    const totalGestiones = this.kpis.totalGestiones;
    if (totalGestiones === 0) {
      this.auditoria = { score: 100, alertas: [], recomendaciones: [] };
      return;
    }

    let deducciones = 0;

    // 1. Auditoría de Observaciones Vacías o Genéricas
    const filasSinNota = this.datosFiltrados.filter(r => !r.observacion || r.observacion.trim() === '');
    const totalSinNota = filasSinNota.length;
    const pctSinNota = totalGestiones > 0 ? (totalSinNota / totalGestiones) * 100 : 0;

    const filasNotaCorta = this.datosFiltrados.filter(r => r.observacion && r.observacion.trim().length > 0 && (r.observacion.trim().length <= 15 || r.observacion.toLowerCase().includes('observacion corta')));
    const totalNotaCorta = filasNotaCorta.length;
    const pctNotaCorta = totalGestiones > 0 ? (totalNotaCorta / totalGestiones) * 100 : 0;

    if (pctSinNota > 20) {
      deducciones += 25;
      alertas.push({
        id: 'sin-nota',
        tipo: 'danger',
        titulo: 'Alto porcentaje de gestiones sin observación',
        descripcion: `El ${pctSinNota.toFixed(1)}% de las gestiones (${totalSinNota.toLocaleString('es-AR')} registros) no tienen ninguna nota escrita. Los cobradores deben registrar siempre qué respondió el titular o qué motivo dio.`,
        icono: 'fa-triangle-exclamation',
        filas: filasSinNota,
        recomendacion: 'Exigir al equipo registrar en cada gestión el motivo manifestado por el titular (falta de fondos, desconocimiento, promesa, reclamo) para evitar perder el historial de negociación.'
      });
    } else if (pctSinNota > 5) {
      deducciones += 10;
      alertas.push({
        id: 'sin-nota',
        tipo: 'warning',
        titulo: 'Gestiones sin notas registradas',
        descripcion: `Hay ${totalSinNota.toLocaleString('es-AR')} gestiones (${pctSinNota.toFixed(1)}%) sin observación. Se sugiere capacitar al equipo para documentar cada contacto.`,
        icono: 'fa-circle-exclamation',
        filas: filasSinNota,
        recomendacion: 'Capacitar a los operadores para que ninguna gestión quede sin nota de cierre.'
      });
    }

    if (pctNotaCorta > 15 || totalNotaCorta > 20) {
      deducciones += 15;
      alertas.push({
        id: 'nota-corta',
        tipo: 'warning',
        titulo: 'Abundancia de notas escuetas o automáticas',
        descripcion: `Se detectaron ${totalNotaCorta.toLocaleString('es-AR')} gestiones (${pctNotaCorta.toFixed(1)}%) con observaciones de menos de 15 caracteres o textos genéricos ("Observacion corta"). Requiere incentivar descripciones con acuerdos concretos.`,
        icono: 'fa-pen-to-square',
        filas: filasNotaCorta,
        recomendacion: 'Reemplazar plantillas genéricas por comentarios personalizados que indiquen fecha exacta de pago, importe acordado y número de cuota.'
      });
    }

    // 2. Auditoría de Promesas sin Monto o sin Próxima Acción
    // NOTA: Se excluyen los titulares con convenios / acuerdos en cuotas vigentes ("acuerdos que se van renovando por mes")
    const filasPromesasSinMonto = this.datosFiltrados.filter(r => !r.esAcuerdo && r.esPromesa && (!r.monto || r.monto <= 0));
    const promesasSinMontoTotal = filasPromesasSinMonto.length;

    if (this.kpis.totalPromesas > 0 && promesasSinMontoTotal > 0) {
      const pctPromesasSinMonto = (promesasSinMontoTotal / this.kpis.totalPromesas) * 100;
      if (pctPromesasSinMonto > 10 || promesasSinMontoTotal >= 5) {
        deducciones += 20;
        alertas.push({
          id: 'promesas-sin-monto',
          tipo: 'danger',
          titulo: 'Promesas de pago registradas sin monto pactado',
          descripcion: `${promesasSinMontoTotal.toLocaleString('es-AR')} promesas (${pctPromesasSinMonto.toFixed(1)}% del total) tienen monto en $0. Se excluyen los deudores en convenio o planes en cuotas vigentes, que se auditan por separado con sus cuotas mensuales activas.`,
          icono: 'fa-dollar-sign',
          filas: filasPromesasSinMonto,
          recomendacion: 'Verificar con los cobradores el comprobante o acuerdo telefónico de cada promesa en $0 y asentar el importe real comprometido.'
        });
      }
    }

    // 3. Sobre-gestión / Quema de Base (DNIs tocados excesivamente en el mismo día)
    const mapDniFechas = {};
    this.datosFiltrados.forEach(r => {
      if (!r.dni) return;
      const f = r.fechaISO || (r.fecha ? r.fecha.split(' ')[0] : '');
      if (!f) return;
      const key = `${r.dni}_${f}`;
      mapDniFechas[key] = (mapDniFechas[key] || 0) + 1;
    });

    const filasSobreGestion = this.datosFiltrados.filter(r => {
      if (!r.dni) return false;
      const f = r.fechaISO || (r.fecha ? r.fecha.split(' ')[0] : '');
      return mapDniFechas[`${r.dni}_${f}`] > 3;
    });

    const setCasosSobreGestion = new Set();
    Object.keys(mapDniFechas).forEach(k => {
      if (mapDniFechas[k] > 3) setCasosSobreGestion.add(k);
    });
    const dnisSobreGestionados = setCasosSobreGestion.size;

    if (dnisSobreGestionados > 0) {
      deducciones += 15;
      alertas.push({
        id: 'sobre-gestion',
        tipo: 'warning',
        titulo: 'Detección de Sobre-gestión y Quema de Números',
        descripcion: `Se detectaron ${dnisSobreGestionados.toLocaleString('es-AR')} casos donde un DNI fue gestionado más de 3 veces en un mismo día (${filasSobreGestion.length.toLocaleString('es-AR')} intentos en total). Esto genera fatiga telefónica y posibles bloqueos en WhatsApp.`,
        icono: 'fa-fire',
        filas: filasSobreGestion,
        recomendacion: 'Implementar regla de reintentos máximos (tope 3 llamadas diarias) y alternar días y horarios para no quemar los teléfonos del deudor.'
      });
    }

    // 4. Sub-gestión (DNIs tocados 1 sola vez y abandonados)
    const toquesPorDni = {};
    const contactosPorDni = {};
    this.datosFiltrados.forEach(r => {
      if (!r.dni) return;
      toquesPorDni[r.dni] = (toquesPorDni[r.dni] || 0) + 1;
      if (r.esContactoEfectivo) contactosPorDni[r.dni] = true;
    });

    const dnisSubGestionSet = new Set();
    Object.keys(toquesPorDni).forEach(dni => {
      if (toquesPorDni[dni] === 1 && !contactosPorDni[dni]) {
        dnisSubGestionSet.add(dni);
      }
    });

    const filasSubGestion = this.datosFiltrados.filter(r => dnisSubGestionSet.has(r.dni));
    const dnisUnSoloToqueNoContactado = dnisSubGestionSet.size;

    const pctUnSoloToque = this.kpis.dnisUnicos > 0 ? (dnisUnSoloToqueNoContactado / this.kpis.dnisUnicos) * 100 : 0;
    if (pctUnSoloToque > 30 || dnisUnSoloToqueNoContactado > 10) {
      deducciones += 10;
      alertas.push({
        id: 'sub-gestion',
        tipo: 'info',
        titulo: 'Oportunidad de recupero: DNIs tocados 1 sola vez sin contacto',
        descripcion: `${dnisUnSoloToqueNoContactado.toLocaleString('es-AR')} cuentas (${pctUnSoloToque.toFixed(1)}% de la base) tuvieron un único intento fallido y no fueron rellamadas. Se recomienda generar una cola de barrido con canal alternativo.`,
        icono: 'fa-recycle',
        filas: filasSubGestion,
        recomendacion: 'Exportar este listado de cuentas sub-gestionadas para programar un barrido masivo matutino por WhatsApp o SMS.'
      });
    }

    // 5. Desbalance de Canales en Operadores
    const operadoresSoloLlaman = [];
    Object.values(this.operadoresMap).forEach(op => {
      if (op.gestiones < 10) return;
      const tieneLlamadas = Object.keys(op.canales).some(c => c.toLowerCase().includes('llamada'));
      const tieneWhatsapp = Object.keys(op.canales).some(c => c.toLowerCase().includes('whatsapp'));
      if (tieneLlamadas && !tieneWhatsapp) operadoresSoloLlaman.push(op.nombre);
    });

    if (operadoresSoloLlaman.length > 0) {
      const filasDesbalance = this.datosFiltrados.filter(r => operadoresSoloLlaman.includes(r.operador));
      alertas.push({
        id: 'desbalance-canales',
        tipo: 'info',
        titulo: 'Operadores sin uso de canal WhatsApp',
        descripcion: `Operadores como ${operadoresSoloLlaman.slice(0, 3).join(', ')} están utilizando únicamente llamadas telefónicas.`,
        icono: 'fa-comments',
        filas: filasDesbalance,
        recomendacion: 'Capacitar a los operadores que solo llaman en el uso de plantillas de WhatsApp oficial para contactar titulares en horario laboral.'
      });
    }

    // 6. Monitoreo de Acuerdos Vigentes & Convenios Activos (Renovación Mensual)
    const filasAcuerdos = this.datosFiltrados.filter(r => r.esAcuerdo);
    const dnisConAcuerdo = new Set(filasAcuerdos.map(r => r.dni).filter(Boolean));
    let montoTotalAcuerdos = 0;
    filasAcuerdos.forEach(r => { montoTotalAcuerdos += (r.monto || 0); });

    if (filasAcuerdos.length > 0) {
      alertas.push({
        id: 'acuerdos-renovacion',
        tipo: 'success',
        titulo: 'Acuerdos Vigentes & Planes en Cuotas (Renovación Mensual)',
        descripcion: `Se identificaron ${filasAcuerdos.length.toLocaleString('es-AR')} gestiones en ${dnisConAcuerdo.size.toLocaleString('es-AR')} titulares con convenios activos o cuotas mensuales que se renuevan mes a mes (Monto en cuotas asignadas: $${montoTotalAcuerdos.toLocaleString('es-AR')}).`,
        icono: 'fa-handshake',
        filas: filasAcuerdos,
        recomendacion: 'Dar seguimiento continuo a las fechas de vencimiento de cada cuota para acompañar al titular en su pago mensual y verificar que el cobrador registre el comprobante como Pago a imputar.'
      });
    }

    // 7. Pagos a Imputar / Rendiciones del Período
    const filasPagos = this.datosFiltrados.filter(r => r.esPagoImputar);
    let montoTotalPagos = 0;
    filasPagos.forEach(r => { montoTotalPagos += (r.monto || 0); });

    if (filasPagos.length > 0) {
      alertas.push({
        id: 'pagos-imputar',
        tipo: 'info',
        titulo: 'Pagos Rendidos / Pagos a Imputar del Período',
        descripcion: `Se registraron ${filasPagos.length.toLocaleString('es-AR')} gestiones con pagos informados o cuotas rendidas por un total de $${montoTotalPagos.toLocaleString('es-AR')}.`,
        icono: 'fa-receipt',
        filas: filasPagos,
        recomendacion: 'Monitorear la imputación bancaria y verificar con administración que los comprobantes adjuntos correspondan a las cuotas del acuerdo.'
      });
    }

    // 8. Acuerdos y Convenios sin Pago a Imputar (Cuotas Pendientes de Cobro)
    // Titulares que tienen un acuerdo activo pero NO registran pago a imputar en el período
    const dnisConPagoEnBase = new Set();
    this.datosCrudos.forEach(r => {
      if (r.esPagoImputar && r.dni) dnisConPagoEnBase.add(r.dni);
    });

    const filasAcuerdosSinPago = this.datosFiltrados.filter(r => {
      return r.esAcuerdo && r.dni && !dnisConPagoEnBase.has(r.dni);
    });
    const dnisAcuerdoSinPagoSet = new Set(filasAcuerdosSinPago.map(r => r.dni));
    let montoPendienteAcuerdos = 0;
    filasAcuerdosSinPago.forEach(r => { montoPendienteAcuerdos += (r.monto || 0); });

    if (filasAcuerdosSinPago.length > 0) {
      alertas.push({
        id: 'acuerdos-sin-pago',
        tipo: 'warning',
        titulo: 'Acuerdos Vigentes sin Pago a Imputar (Cuotas Pendientes)',
        descripcion: `Hay ${filasAcuerdosSinPago.length.toLocaleString('es-AR')} gestiones en ${dnisAcuerdoSinPagoSet.size.toLocaleString('es-AR')} titulares con convenios activos que aún NO registran su Pago a imputar en el período (Monto pendiente: $${montoPendienteAcuerdos.toLocaleString('es-AR')}).`,
        icono: 'fa-hourglass-half',
        filas: filasAcuerdosSinPago,
        recomendacion: 'Hacer seguimiento prioritario por WhatsApp o llamada a estos titulares para confirmar transferencia bancaria y solicitar el comprobante para imputar la cuota.'
      });
    }

    // 9. Auditoría de Ritmo Diario de Operadores (Meta: 60 DNIs/día)
    const operadoresBajoMeta = Object.values(this.operadoresMap).filter(op => op.gestiones > 15 && op.promedioDnisDia < 60);
    if (operadoresBajoMeta.length > 0) {
      const filasBajoMeta = this.datosFiltrados.filter(r => operadoresBajoMeta.some(o => o.nombre === r.operador));
      alertas.push({
        id: 'bajo-ritmo-dnis',
        tipo: 'info',
        titulo: 'Monitoreo de Productividad: Meta 60 DNIs diarios',
        descripcion: `Operadores como ${operadoresBajoMeta.slice(0, 3).map(o => `${o.nombre} (${o.promedioDnisDia.toFixed(1)} DNIs/día - ${o.cumplimientoMeta60.toFixed(0)}%)`).join(', ')} se encuentran por debajo del piso sugerido de 60 cuentas únicas diarias.`,
        icono: 'fa-gauge-simple-high',
        filas: filasBajoMeta,
        recomendacion: 'Optimizar los tiempos de marcación telefónica, implementar plantillas masivas de WhatsApp y ampliar la asignación de base para que cada operador alcance el estándar de 60 DNIs/día.'
      });
    }

    // Score final de Calidad (base 100)
    const score = Math.max(20, Math.min(100, Math.round(100 - deducciones)));

    this.auditoria = {
      score,
      totalSinNota,
      totalNotaCorta,
      promesasSinMontoTotal,
      dnisSobreGestionados,
      dnisUnSoloToqueNoContactado,
      alertas
    };
  },

  // ==========================================================================
  // RENDERIZADO DE LA INTERFAZ
  // ==========================================================================
  renderKPIs() {
    const k = this.kpis;
    const setTexto = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setTexto('mango-kpi-gestiones', k.totalGestiones.toLocaleString('es-AR'));
    setTexto('mango-kpi-dnis', k.dnisUnicos.toLocaleString('es-AR'));
    setTexto('mango-kpi-promesas', k.totalPromesas.toLocaleString('es-AR'));
    setTexto('mango-kpi-conversion', `${k.tasaConversionGlobal.toFixed(1)}%`);
    setTexto('mango-kpi-monto', `$${k.montoTotalPromesas.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);
    setTexto('mango-kpi-contactabilidad', `${k.tasaContactabilidad.toFixed(1)}%`);
    setTexto('mango-kpi-intensidad', `${k.promedioGestionesPorDni.toFixed(2)} toques/DNI`);
    setTexto('mango-kpi-ticket', `$${Math.round(k.ticketPromedio).toLocaleString('es-AR')}`);
    setTexto('mango-kpi-promedio-dnis-dia', `${k.promedioDnisDiariosGlobal ? k.promedioDnisDiariosGlobal.toFixed(1) : '0'} DNIs/día (Meta: 60)`);
  },

  renderAuditoriaUI() {
    const aud = this.auditoria;
    const elScore = document.getElementById('mango-auditoria-score');
    const elScoreBar = document.getElementById('mango-auditoria-score-bar');
    const elScoreBadge = document.getElementById('mango-auditoria-score-badge');

    if (elScore) elScore.textContent = `${aud.score}/100`;
    if (elScoreBar) {
      elScoreBar.style.width = `${aud.score}%`;
      elScoreBar.className = `h-2.5 rounded-full transition-all duration-500 ${
        aud.score >= 80 ? 'bg-emerald-500' : aud.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
      }`;
    }
    if (elScoreBadge) {
      if (aud.score >= 80) {
        elScoreBadge.innerHTML = '<span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs"><i class="fas fa-check-circle mr-1"></i> Calidad Alta</span>';
      } else if (aud.score >= 60) {
        elScoreBadge.innerHTML = '<span class="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-xs"><i class="fas fa-triangle-exclamation mr-1"></i> Calidad Media (Mejorable)</span>';
      } else {
        elScoreBadge.innerHTML = '<span class="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full font-bold text-xs"><i class="fas fa-circle-xmark mr-1"></i> Calidad Crítica</span>';
      }
    }

    const containerAlertas = document.getElementById('mango-auditoria-alertas-lista');
    if (!containerAlertas) return;

    if (!aud.alertas || aud.alertas.length === 0) {
      containerAlertas.innerHTML = `
        <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <i class="fas fa-circle-check text-xl text-emerald-600"></i>
          <div>
            <p class="text-xs font-bold">¡Excelente calidad de datos!</p>
            <p class="text-[11px] text-emerald-700">Todas las gestiones poseen observaciones documentadas, las promesas registran montos válidos y no se observan patrones de sobre-gestión.</p>
          </div>
        </div>
      `;
      return;
    }

    containerAlertas.innerHTML = aud.alertas.map(a => {
      let bg = 'bg-amber-50/70 border-amber-200/90 hover:border-amber-400 text-amber-950 shadow-sm hover:shadow-md';
      let iconColor = 'text-amber-600';
      let iconBg = 'bg-amber-100/90';
      let tagBg = 'bg-amber-100 text-amber-800';

      if (a.tipo === 'danger') {
        bg = 'bg-rose-50/70 border-rose-200/90 hover:border-rose-400 text-rose-950 shadow-sm hover:shadow-md';
        iconColor = 'text-rose-600';
        iconBg = 'bg-rose-100/90';
        tagBg = 'bg-rose-100 text-rose-800';
      } else if (a.tipo === 'success') {
        bg = 'bg-emerald-50/70 border-emerald-200/90 hover:border-emerald-400 text-emerald-950 shadow-sm hover:shadow-md';
        iconColor = 'text-emerald-600';
        iconBg = 'bg-emerald-100/90';
        tagBg = 'bg-emerald-100 text-emerald-800';
      } else if (a.tipo === 'info') {
        bg = 'bg-blue-50/70 border-blue-200/90 hover:border-blue-400 text-blue-950 shadow-sm hover:shadow-md';
        iconColor = 'text-blue-600';
        iconBg = 'bg-blue-100/90';
        tagBg = 'bg-blue-100 text-blue-800';
      }

      const totalCasos = a.filas ? a.filas.length : 0;
      let tagTexto = `${totalCasos.toLocaleString('es-AR')} gestiones a corregir`;
      if (a.tipo === 'success') {
        tagTexto = `${totalCasos.toLocaleString('es-AR')} gestiones en acuerdo activo`;
      } else if (a.id === 'pagos-imputar') {
        tagTexto = `${totalCasos.toLocaleString('es-AR')} pagos registrados`;
      } else if (a.tipo === 'info') {
        tagTexto = `${totalCasos.toLocaleString('es-AR')} casos a revisar`;
      }

      return `
        <div onclick="MangoAnalyzerModule.abrirModalAuditoria('${a.id}')"
             class="group cursor-pointer p-4 rounded-2xl border ${bg} transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between relative select-none">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <i class="fas ${a.icono} text-sm ${iconColor}"></i>
            </div>
            <div class="flex-1 pr-1">
              <div class="flex items-center justify-between gap-2">
                <h4 class="text-xs font-bold leading-tight group-hover:text-emerald-700 transition-colors">${a.titulo}</h4>
              </div>
              <p class="text-[11px] opacity-90 mt-1 leading-relaxed">${a.descripcion}</p>
            </div>
          </div>
          
          <div class="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between text-[11px] font-bold">
            <span class="px-2.5 py-0.5 rounded-lg ${tagBg} text-[10px] flex items-center gap-1.5 font-bold">
              <i class="fas fa-list-check"></i>
              <span>${tagTexto}</span>
            </span>
            <span class="text-slate-500 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all text-[11px] flex items-center gap-1">
              Ver gestiones <i class="fas fa-chevron-right text-[9px]"></i>
            </span>
          </div>
        </div>
      `;
    }).join('');
  },

  // ==========================================================================
  // MODAL DE DETALLE Y GESTIONES A MEJORAR (AUDITORÍA / DIAGNÓSTICO)
  // ==========================================================================
  alertaActualDetalle: null,
  filasAuditoriaFiltradas: [],

  abrirModalAuditoria(alertaId) {
    const alerta = (this.auditoria.alertas || []).find(a => a.id === alertaId);
    if (!alerta) return;

    this.alertaActualDetalle = alerta;
    this.filasAuditoriaFiltradas = alerta.filas || [];

    const modal = document.getElementById('mango-modal-auditoria-detalle');
    if (!modal) return;

    const elTitulo = document.getElementById('mango-auditoria-modal-titulo');
    const elBadge = document.getElementById('mango-auditoria-modal-badge');
    const elIcono = document.getElementById('mango-auditoria-modal-icono');
    const elRecomendacion = document.getElementById('mango-auditoria-modal-recomendacion');
    const elBuscar = document.getElementById('mango-auditoria-modal-buscar');

    if (elTitulo) elTitulo.textContent = alerta.titulo;
    if (elBadge) elBadge.textContent = `${alerta.filas.length.toLocaleString('es-AR')} gestiones`;
    if (elIcono) {
      elIcono.className = `w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${
        alerta.tipo === 'danger' ? 'bg-rose-100 text-rose-600' :
        alerta.tipo === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
      }`;
      elIcono.innerHTML = `<i class="fas ${alerta.icono}"></i>`;
    }
    if (elRecomendacion) {
      elRecomendacion.innerHTML = `
        <div class="p-3.5 rounded-2xl border ${
          alerta.tipo === 'danger' ? 'bg-rose-50 border-rose-200 text-rose-900' :
          alerta.tipo === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-blue-50 border-blue-200 text-blue-900'
        } text-xs flex items-start gap-2.5">
          <i class="fas fa-lightbulb mt-0.5 shrink-0"></i>
          <div>
            <span class="font-bold">Qué mejorar:</span> ${alerta.recomendacion || alerta.descripcion}
          </div>
        </div>
      `;
    }

    if (elBuscar) elBuscar.value = '';

    this.renderFilasAuditoriaModal(this.filasAuditoriaFiltradas);
    modal.classList.remove('hidden');
  },

  renderFilasAuditoriaModal(filas) {
    const tbody = document.getElementById('mango-auditoria-modal-tbody');
    const contador = document.getElementById('mango-auditoria-modal-contador');
    if (contador) {
      contador.textContent = `Mostrando ${filas.length.toLocaleString('es-AR')} de ${(this.alertaActualDetalle?.filas || []).length.toLocaleString('es-AR')} gestiones`;
    }
    if (!tbody) return;

    if (!filas || filas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="p-8 text-center text-slate-400 text-xs">
            <i class="fas fa-search text-2xl mb-2 block opacity-40"></i>
            No se encontraron gestiones con el criterio de búsqueda.
          </td>
        </tr>
      `;
      return;
    }

    // Renderizar hasta 350 filas para fluidez
    const limit = Math.min(filas.length, 350);
    const html = filas.slice(0, limit).map((r) => {
      const link = r.hipervinculo ? 
        `<a href="${r.hipervinculo}" target="_blank" class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[10px] inline-flex items-center gap-1 transition-colors">
          <span>Abrir Mango</span> <i class="fas fa-arrow-up-right-from-square text-[9px]"></i>
        </a>` : '<span class="text-slate-300">-</span>';

      const obsTexto = r.observacion && r.observacion.trim() ? 
        `<span class="text-slate-700 font-medium text-[11px] line-clamp-2" title="${r.observacion.replace(/"/g, '&quot;')}">${r.observacion}</span>` : 
        `<span class="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md font-bold text-[10px]"><i class="fas fa-ban mr-1"></i>Sin Observación</span>`;

      let montoBadge = '<span class="text-slate-300">-</span>';
      if (r.esAcuerdo && r.monto > 0) {
        montoBadge = `<span class="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md font-bold text-[11px] inline-flex items-center gap-1" title="${r.montoHeredado ? 'Monto vinculado al plan de pagos activo del titular' : 'Cuota mensual del acuerdo'}"><i class="fas fa-handshake text-[10px]"></i> $${r.monto.toLocaleString('es-AR')} ${r.acuerdoInfo?.cuota ? `<span class="opacity-75 font-normal text-[10px]">(${r.acuerdoInfo.cuota})</span>` : ''}</span>`;
      } else if (r.esPagoImputar && r.monto > 0) {
        montoBadge = `<span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-[11px] inline-flex items-center gap-1"><i class="fas fa-receipt text-[10px]"></i> $${r.monto.toLocaleString('es-AR')} <span class="opacity-75 font-normal text-[10px]">(Abonado)</span></span>`;
      } else if (r.monto > 0) {
        montoBadge = `<span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-[11px]">$${r.monto.toLocaleString('es-AR')}</span>`;
      } else if (r.esAcuerdo) {
        montoBadge = `<span class="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md font-bold text-[10px]">En Convenio</span>`;
      } else if (r.esPromesa) {
        montoBadge = `<span class="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md font-bold text-[10px]">Monto $0</span>`;
      }

      let resBadgeClass = 'bg-slate-100 text-slate-600';
      if (r.esAcuerdo) {
        resBadgeClass = 'bg-purple-100 text-purple-800 font-bold';
      } else if (r.esPagoImputar) {
        resBadgeClass = 'bg-emerald-100 text-emerald-800 font-bold';
      } else if (r.esPromesa) {
        resBadgeClass = 'bg-teal-100 text-teal-800 font-bold';
      } else if (r.esContactoEfectivo) {
        resBadgeClass = 'bg-blue-100 text-blue-800 font-semibold';
      }

      const resDetalle = r.esAcuerdo && r.acuerdoInfo?.plan ? ` · ${r.acuerdoInfo.plan}` : '';

      return `
        <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-xs">
          <td class="p-3 font-mono font-bold text-slate-800 whitespace-nowrap">
            <button onclick="MangoAnalyzerModule.buscarTrazabilidadDni('${r.dni}')" class="text-emerald-600 hover:underline hover:text-emerald-800 text-left font-bold">
              ${r.dni}
            </button>
          </td>
          <td class="p-3 text-slate-800 font-medium max-w-[140px] truncate" title="${r.titular || ''}">
            ${r.titular || 'No Registrado'}
          </td>
          <td class="p-3 text-slate-700 font-semibold whitespace-nowrap">
            <span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[11px]">${r.operador}</span>
          </td>
          <td class="p-3 text-slate-500 whitespace-nowrap text-[11px]">
            ${r.fecha || '-'}
          </td>
          <td class="p-3 whitespace-nowrap">
            <span class="text-[11px] font-medium text-slate-600">${r.canal || '-'}</span>
          </td>
          <td class="p-3 whitespace-nowrap">
            <span class="px-2 py-0.5 rounded-lg text-[10px] ${resBadgeClass}">${r.resultado || 'Sin Resultado'}${resDetalle}</span>
          </td>
          <td class="p-3 text-center whitespace-nowrap">
            ${(r.fechaVencimiento || r.acuerdoInfo?.vcto) ? 
              `<span class="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold text-[11px] font-mono border border-purple-200/70 inline-flex items-center gap-1 shadow-sm">
                <i class="fas fa-calendar-day text-[10px] text-purple-500"></i> ${r.fechaVencimiento || r.acuerdoInfo?.vcto}
               </span>` : 
              (r.fechaProxAccion ? `<span class="text-slate-500 font-mono text-[10px]">${r.fechaProxAccion.split(' ')[0]}</span>` : '<span class="text-slate-300 text-xs">-</span>')
            }
          </td>
          <td class="p-3 max-w-[240px]">
            ${obsTexto}
          </td>
          <td class="p-3 text-center whitespace-nowrap">
            ${montoBadge}
          </td>
          <td class="p-3 text-center whitespace-nowrap">
            ${link}
          </td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = html;
  },

  filtrarCasosAuditoria(query) {
    if (!this.alertaActualDetalle || !this.alertaActualDetalle.filas) return;
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      this.filasAuditoriaFiltradas = this.alertaActualDetalle.filas;
    } else {
      this.filasAuditoriaFiltradas = this.alertaActualDetalle.filas.filter(r => {
        return (r.dni && String(r.dni).includes(q)) ||
               (r.titular && r.titular.toLowerCase().includes(q)) ||
               (r.operador && r.operador.toLowerCase().includes(q)) ||
               (r.observacion && r.observacion.toLowerCase().includes(q)) ||
               (r.resultado && r.resultado.toLowerCase().includes(q)) ||
               (r.fechaVencimiento && r.fechaVencimiento.includes(q));
      });
    }
    this.renderFilasAuditoriaModal(this.filasAuditoriaFiltradas);
  },

  exportarCasosAuditoria() {
    if (!this.alertaActualDetalle || !this.filasAuditoriaFiltradas || this.filasAuditoriaFiltradas.length === 0) {
      alert('No hay gestiones para exportar.');
      return;
    }

    const data = this.filasAuditoriaFiltradas.map((r, idx) => ({
      '#': idx + 1,
      'DNI': r.dni,
      'Titular': r.titular,
      'Operador': r.operador,
      'Cartera / Entidad': r.entidad,
      'Fecha Gestión': r.fecha,
      'Fecha Vencimiento Acuerdo': r.fechaVencimiento || r.acuerdoInfo?.vcto || (r.esAcuerdo && r.fechaProxAccion ? r.fechaProxAccion.split(' ')[0] : '-'),
      'Detalle Cuota / Plan': r.acuerdoInfo?.plan ? `${r.acuerdoInfo.cuota || ''} (${r.acuerdoInfo.plan})`.trim() : (r.esAcuerdo ? 'Acuerdo Activo' : '-'),
      'Próxima Acción': r.proxAccion,
      'Fecha Próx. Acción': r.fechaProxAccion,
      'Canal': r.canal,
      'Resultado': r.resultado,
      'Monto Promesa ($)': r.monto || 0,
      'Teléfono': r.telefono,
      'Observación': r.observacion,
      'Enlace Mango CRM': r.hipervinculo
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    const sheetName = (this.alertaActualDetalle.id || 'Auditoria').substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const nombreArchivo = `Auditoria_${this.alertaActualDetalle.id || 'Casos'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  },

  // ==========================================================================
  // GRÁFICOS INTERACTIVOS (CHART.JS)
  // ==========================================================================
  renderGraficos() {
    this.renderGraficoOperadores();
    this.renderGraficoCanales();
    this.renderGraficoResultados();
  },

  destruirGrafico(key) {
    if (this.graficos[key]) {
      this.graficos[key].destroy();
      this.graficos[key] = null;
    }
  },

  renderGraficoOperadores() {
    const canvas = document.getElementById('mango-chart-operadores');
    if (!canvas) return;
    this.destruirGrafico('operadores');

    const ops = Object.values(this.operadoresMap).sort((a, b) => b.gestiones - a.gestiones).slice(0, 10);
    const labels = ops.map(o => o.nombre);
    const dataGestiones = ops.map(o => o.gestiones);
    const dataPromesas = ops.map(o => o.promesas);

    this.graficos['operadores'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Gestiones Realizadas',
            data: dataGestiones,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: '#2563eb',
            borderWidth: 1,
            borderRadius: 6
          },
          {
            label: 'Promesas Conseguidas',
            data: dataPromesas,
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: '#059669',
            borderWidth: 1,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              afterBody: (context) => {
                const idx = context[0].dataIndex;
                const op = ops[idx];
                const conv = op.gestiones > 0 ? ((op.promesas / op.gestiones) * 100).toFixed(1) : '0';
                return `Efectividad: ${conv}%\nDNIs tocados: ${op.dnisSet.size}\nMonto: $${op.montoTotal.toLocaleString('es-AR')}`;
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } }
        }
      }
    });
  },

  renderGraficoCanales() {
    const canvas = document.getElementById('mango-chart-canales');
    if (!canvas) return;
    this.destruirGrafico('canales');

    const canales = this.kpis.canalesMap || {};
    const labels = Object.keys(canales);
    const data = Object.values(canales);

    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'
    ];

    this.graficos['canales'] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['Sin datos'],
        datasets: [{
          data: data.length > 0 ? data : [1],
          backgroundColor: colors.slice(0, Math.max(1, labels.length)),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 } } }
        },
        cutout: '65%'
      }
    });
  },

  renderGraficoResultados() {
    const canvas = document.getElementById('mango-chart-resultados');
    if (!canvas) return;
    this.destruirGrafico('resultados');

    const resMap = this.kpis.resultadosMap || {};
    const sorted = Object.entries(resMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const labels = sorted.map(s => s[0]);
    const data = sorted.map(s => s[1]);

    this.graficos['resultados'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cantidad',
          data: data,
          backgroundColor: labels.map(l => {
            const u = l.toUpperCase();
            if (u.includes('PAGO') || u.includes('PROMESA')) return '#10b981';
            if (u.includes('CONTACTADO')) return '#3b82f6';
            if (u.includes('NO CONTESTA') || u.includes('OCUPADO')) return '#f87171';
            return '#94a3b8';
          }),
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
          y: { grid: { display: false }, ticks: { font: { size: 10 } } }
        }
      }
    });
  },

  // ==========================================================================
  // RANKING COMPARATIVO DE OPERADORES
  // ==========================================================================
  renderRankingOperadores() {
    const tbody = document.getElementById('mango-tabla-operadores-tbody');
    if (!tbody) return;

    const operadores = Object.values(this.operadoresMap).sort((a, b) => b.promesas - a.promesas || b.gestiones - a.gestiones);

    if (operadores.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" class="text-center py-6 text-slate-400 text-xs">No hay datos que coincidan con los filtros</td></tr>`;
      return;
    }

    tbody.innerHTML = operadores.map((op, idx) => {
      const conv = op.gestiones > 0 ? ((op.promesas / op.gestiones) * 100).toFixed(1) : '0.0';
      const cont = op.gestiones > 0 ? ((op.contactados / op.gestiones) * 100).toFixed(1) : '0.0';
      const intensidad = op.dnisSet.size > 0 ? (op.gestiones / op.dnisSet.size).toFixed(1) : '0.0';
      
      // Canal principal
      let canalTop = '-';
      let maxCanal = 0;
      Object.entries(op.canales).forEach(([c, cant]) => {
        if (cant > maxCanal) { maxCanal = cant; canalTop = c; }
      });

      // Score individual de calidad de datos
      let deduccionOp = 0;
      if (op.gestiones > 0) {
        deduccionOp += (op.gestionesSinNota / op.gestiones) * 40;
        deduccionOp += (op.gestionesNotaCorta / op.gestiones) * 20;
        if (op.promesas > 0) {
          deduccionOp += (op.promesasSinMonto / op.promesas) * 30;
        }
      }
      const scoreOp = Math.max(10, Math.min(100, Math.round(100 - deduccionOp)));

      // Medalla para top 3
      let medalla = `<span class="font-bold text-slate-400 text-xs">${idx + 1}</span>`;
      if (idx === 0) medalla = `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-600 font-black text-xs shadow-sm">🥇</span>`;
      if (idx === 1) medalla = `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-black text-xs shadow-sm">🥈</span>`;
      if (idx === 2) medalla = `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-700 font-black text-xs shadow-sm">🥉</span>`;

      // Badge ritmo vs Meta 60 DNIs/día
      const badgeMeta = op.promedioDnisDia >= 60 
        ? 'bg-emerald-100 text-emerald-800' 
        : (op.promedioDnisDia >= 45 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800');

      return `
        <tr class="hover:bg-blue-50/40 transition-colors border-b border-slate-100 text-xs">
          <td class="px-3 py-3 text-center">${medalla}</td>
          <td class="px-3 py-3">
            <div class="font-bold text-slate-800">${op.nombre}</div>
            <div class="text-[10px] text-slate-400">${op.fechasSet.size} días trabajados en el período</div>
          </td>
          <td class="px-3 py-3 text-center font-bold text-blue-600 bg-blue-50/30 rounded-lg">${op.gestiones.toLocaleString('es-AR')}</td>
          <td class="px-3 py-3 text-center">
            <span class="font-bold text-slate-700">${op.dnisSet.size.toLocaleString('es-AR')}</span>
            <span class="text-[10px] text-slate-400 block">(${intensidad} toques/DNI)</span>
          </td>
          <td class="px-3 py-3 text-center">
            <span class="font-extrabold text-slate-800">${op.promedioDnisDia.toFixed(1)} / día</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeMeta} block mt-0.5">
              ${op.cumplimientoMeta60.toFixed(0)}% meta (60)
            </span>
          </td>
          <td class="px-3 py-3 text-center">
            <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold ${parseFloat(cont) >= 40 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}">${cont}%</span>
          </td>
          <td class="px-3 py-3 text-center">
            <span class="font-extrabold text-emerald-600 text-sm">${op.promesas}</span>
            <span class="text-[10px] text-slate-500 block">Conv: ${conv}%</span>
          </td>
          <td class="px-3 py-3 text-right font-black text-slate-800">
            $${op.montoTotal.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
          </td>
          <td class="px-3 py-3 text-center">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
              scoreOp >= 80 ? 'bg-emerald-100 text-emerald-800' : scoreOp >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
            }">${scoreOp}/100</span>
          </td>
          <td class="px-3 py-3 text-center">
            <button class="btn-ver-detalle-op px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 mx-auto shadow-sm" data-operador="${op.nombre}">
              <i class="fas fa-address-book"></i> Ver DNIs (${op.dnisSet.size})
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Listener para los botones "Ver DNIs"
    tbody.querySelectorAll('.btn-ver-detalle-op').forEach(btn => {
      btn.addEventListener('click', () => {
        const nombreOp = btn.getAttribute('data-operador');
        this.seleccionarOperador(nombreOp);
      });
    });
  },

  // ==========================================================================
  // DETALLE DEL OPERADOR Y TRAZABILIDAD DE DNIs TOCADOS
  // ==========================================================================
  renderSelectorOperadorDetalle() {
    const select = document.getElementById('mango-selector-op-detalle');
    if (!select) return;

    const operadores = Object.keys(this.operadoresMap).sort();
    select.innerHTML = `<option value="">-- Selecciona un operador para auditar sus DNIs --</option>`;
    operadores.forEach(op => {
      const opt = document.createElement('option');
      opt.value = op;
      opt.textContent = `${op} (${this.operadoresMap[op].dnisSet.size} DNIs tocados - ${this.operadoresMap[op].promesas} promesas)`;
      select.appendChild(opt);
    });

    select.onchange = (e) => {
      if (e.target.value) {
        this.seleccionarOperador(e.target.value);
      }
    };

    // Si ya había uno seleccionado, mantenerlo; sino seleccionar el top 1
    if (this.operadorSeleccionado && this.operadoresMap[this.operadorSeleccionado]) {
      select.value = this.operadorSeleccionado;
      this.seleccionarOperador(this.operadorSeleccionado);
    } else if (operadores.length > 0) {
      // Auto seleccionar el primero
      this.seleccionarOperador(operadores[0]);
      select.value = operadores[0];
    }
  },

  seleccionarOperador(nombreOp) {
    this.operadorSeleccionado = nombreOp;
    const select = document.getElementById('mango-selector-op-detalle');
    if (select) select.value = nombreOp;

    const opData = this.operadoresMap[nombreOp];
    if (!opData) return;

    // Mostrar sección de detalle
    const secDetalle = document.getElementById('mango-seccion-operador-detalle');
    if (secDetalle) secDetalle.classList.remove('hidden');

    // Scroll suave hacia la sección de detalle
    secDetalle.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Header del Operador
    const elNombre = document.getElementById('mango-op-nombre-header');
    if (elNombre) elNombre.textContent = nombreOp;

    // Métricas del operador
    const conv = opData.gestiones > 0 ? ((opData.promesas / opData.gestiones) * 100).toFixed(1) : '0';
    const cont = opData.gestiones > 0 ? ((opData.contactados / opData.gestiones) * 100).toFixed(1) : '0';
    const intensidad = opData.dnisSet.size > 0 ? (opData.gestiones / opData.dnisSet.size).toFixed(1) : '0';

    const setT = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setT('mango-op-kpi-gestiones', opData.gestiones.toLocaleString('es-AR'));
    setT('mango-op-kpi-dnis', opData.dnisSet.size.toLocaleString('es-AR'));
    setT('mango-op-kpi-dnis-dia', `${opData.promedioDnisDia.toFixed(1)} / día (${opData.cumplimientoMeta60.toFixed(0)}% de 60)`);
    setT('mango-op-kpi-promesas', opData.promesas.toLocaleString('es-AR'));
    setT('mango-op-kpi-monto', `$${opData.montoTotal.toLocaleString('es-AR')}`);
    setT('mango-op-kpi-contactabilidad', `${cont}%`);
    setT('mango-op-kpi-conversion', `${conv}%`);
    setT('mango-op-kpi-intensidad', `${intensidad} por DNI`);

    // Puntos a mejorar específicos de este operador
    this.renderDiagnosticoIndividual(opData);

    // Renderizar tabla de DNIs tocados por este operador
    this.filtrarDnisOperador('');
  },

  renderDiagnosticoIndividual(opData) {
    const container = document.getElementById('mango-op-diagnostico-container');
    if (!container) return;

    const puntos = [];

    // Meta 60 DNIs/día
    if (opData.promedioDnisDia < 60 && opData.gestiones > 10) {
      puntos.push({
        tipo: opData.promedioDnisDia < 45 ? 'danger' : 'warning',
        texto: `Ritmo diario: toca en promedio <strong>${opData.promedioDnisDia.toFixed(1)} DNIs/día</strong> (${opData.cumplimientoMeta60.toFixed(0)}% del objetivo de 60 DNIs/día). Se aconseja agilizar la marcación telefónica e intensificar envíos por WhatsApp para alcanzar las 60 cuentas diarias.`
      });
    }

    // Acuerdos y convenios sin Pago a Imputar para este operador
    const acuerdosSinPagoOp = Object.values(opData.dnisDetalle).filter(d => d.esAcuerdo && !d.tienePagoImputar).length;
    if (acuerdosSinPagoOp > 0) {
      puntos.push({
        tipo: 'warning',
        texto: `Tiene <strong>${acuerdosSinPagoOp} titulares con acuerdos activos sin Pago a imputar</strong> en el período. Revisar estos casos prioritariamente con el deudor para confirmar transferencias o solicitar comprobantes.`
      });
    }

    // Notas vacías
    if (opData.gestionesSinNota > 0) {
      const pct = ((opData.gestionesSinNota / opData.gestiones) * 100).toFixed(1);
      puntos.push({
        tipo: pct > 15 ? 'danger' : 'warning',
        texto: `Tiene <strong>${opData.gestionesSinNota} gestiones sin notas (${pct}%)</strong>. Exigirle detallar el resultado de la llamada o mensaje.`
      });
    }

    // Promesas sin monto
    if (opData.promesasSinMonto > 0) {
      puntos.push({
        tipo: 'danger',
        texto: `Registró <strong>${opData.promesasSinMonto} promesas sin monto ($0)</strong>. Es fundamental que ingrese el importe exacto acordado.`
      });
    }

    // Canal predominante
    const canales = Object.entries(opData.canales);
    if (canales.length === 1) {
      puntos.push({
        tipo: 'info',
        texto: `Usa exclusivamente <strong>${canales[0][0]}</strong>. Recomendarle diversificar con otro canal cuando no logra contactar.`
      });
    }

    // Contactabilidad baja
    const cont = opData.gestiones > 0 ? (opData.contactados / opData.gestiones) * 100 : 0;
    if (cont < 25 && opData.gestiones > 15) {
      puntos.push({
        tipo: 'warning',
        texto: `Contactabilidad baja (<strong>${cont.toFixed(1)}%</strong>). Revisar horarios en los que realiza las gestiones para contactar en franjas más productivas.`
      });
    }

    if (puntos.length === 0) {
      container.innerHTML = `
        <div class="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <i class="fas fa-star text-emerald-500"></i>
          <span><strong>Excelente desempeño y disciplina de datos:</strong> Buen registro de observaciones, promesas respaldadas y adecuado uso de canales.</span>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="space-y-2">
        <h5 class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <i class="fas fa-lightbulb text-amber-500"></i> Oportunidades de mejora para ${opData.nombre}:
        </h5>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${puntos.map(p => `
            <div class="p-2.5 rounded-lg text-xs flex items-start gap-2 ${
              p.tipo === 'danger' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
              p.tipo === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
              'bg-blue-50 text-blue-800 border border-blue-200'
            }">
              <i class="fas fa-circle-dot mt-1 text-[10px]"></i>
              <div>${p.texto}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  filtrarDnisOperador(query = '') {
    if (!this.operadorSeleccionado) return;
    const opData = this.operadoresMap[this.operadorSeleccionado];
    if (!opData) return;

    const selectResultado = document.getElementById('mango-op-filtro-resultado');
    const filtroRes = selectResultado ? selectResultado.value : 'TODOS';

    const tbody = document.getElementById('mango-tabla-dnis-op-tbody');
    const countBadge = document.getElementById('mango-op-dnis-count-badge');
    if (!tbody) return;

    const cleanQuery = query.trim().toLowerCase();
    const dnisArray = Object.values(opData.dnisDetalle);

    const filtrados = dnisArray.filter(d => {
      // Filtro texto (DNI o Titular o Cartera)
      const matchText = !cleanQuery || 
        d.dni.toLowerCase().includes(cleanQuery) || 
        d.titular.toLowerCase().includes(cleanQuery) || 
        d.entidad.toLowerCase().includes(cleanQuery);

      if (!matchText) return false;

      // Filtro resultado y estado de pago
      if (filtroRes === 'ACUERDOS_SIN_PAGO') return d.esAcuerdo && !d.tienePagoImputar;
      if (filtroRes === 'SIN_PAGO_IMPUTAR') return !d.tienePagoImputar;
      if (filtroRes === 'CON_PAGO_IMPUTAR') return d.tienePagoImputar;
      if (filtroRes === 'PROMESAS') return d.tienePromesa;
      if (filtroRes === 'CONTACTADOS') {
        const u = d.ultimoResultado.toUpperCase();
        return u.includes('CONTACTADO') || u.includes('PAGO') || u.includes('TITULAR');
      }
      if (filtroRes === 'NO_CONTACTADOS') {
        const u = d.ultimoResultado.toUpperCase();
        return u.includes('NO CONTESTA') || u.includes('OCUPADO') || u.includes('SIN CONTACTO');
      }
      return true;
    });

    if (countBadge) countBadge.textContent = `${filtrados.length} de ${dnisArray.length} DNIs`;

    if (filtrados.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" class="text-center py-6 text-slate-400 text-xs">No se encontraron DNIs que coincidan con la búsqueda</td></tr>`;
      return;
    }

    tbody.innerHTML = filtrados.map(d => {
      let badgeResultado = 'bg-slate-100 text-slate-700';
      const u = d.ultimoResultado.toUpperCase();
      if (u.includes('ACUERDO') || u.includes('CONVENIO')) badgeResultado = 'bg-purple-100 text-purple-800 font-bold';
      else if (u.includes('PAGO') || u.includes('PROMESA')) badgeResultado = 'bg-emerald-100 text-emerald-800 font-bold';
      else if (u.includes('CONTACTADO')) badgeResultado = 'bg-blue-100 text-blue-800 font-semibold';
      else if (u.includes('NO CONTESTA') || u.includes('OCUPADO')) badgeResultado = 'bg-rose-100 text-rose-800';

      // Badge Estado de Pago
      let badgePago = '<span class="px-2 py-0.5 rounded-full text-[10px] text-slate-500 bg-slate-100 font-semibold">Sin Pago</span>';
      if (d.tienePagoImputar) {
        badgePago = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800"><i class="fas fa-check-circle mr-1"></i>Imputado ${d.montoPagoImputar > 0 ? '($' + d.montoPagoImputar.toLocaleString('es-AR') + ')' : ''}</span>`;
      } else if (d.esAcuerdo) {
        badgePago = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800"><i class="fas fa-clock mr-1"></i>Pendiente Cuota ${d.montoPromesa > 0 ? '($' + d.montoPromesa.toLocaleString('es-AR') + ')' : ''}</span>`;
      }

      const linkHtml = d.hipervinculo ? `
        <a href="${d.hipervinculo}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline" title="Abrir en CRM Mango">
          <i class="fas fa-external-link-alt"></i> Mango
        </a>
      ` : '<span class="text-slate-400 text-[10px]">-</span>';

      const ultObservacion = d.observaciones.length > 0 ? d.observaciones[d.observaciones.length - 1] : '<em class="text-slate-400">Sin nota</em>';

      return `
        <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 text-xs">
          <td class="px-3 py-2.5 font-mono font-bold text-slate-800">
            <span class="cursor-pointer text-blue-600 hover:underline" onclick="MangoAnalyzerModule.buscarDniGlobal('${d.dni}')" title="Ver trazabilidad global de este DNI">
              ${d.dni}
            </span>
          </td>
          <td class="px-3 py-2.5 font-medium text-slate-700">${d.titular}</td>
          <td class="px-3 py-2.5 text-slate-500">${d.entidad}</td>
          <td class="px-3 py-2.5 text-center">
            <span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${d.cantidadToques > 3 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}">
              ${d.cantidadToques} toques
            </span>
          </td>
          <td class="px-3 py-2.5">
            <span class="px-2 py-0.5 rounded-full text-[11px] inline-block ${badgeResultado}">
              ${d.ultimoResultado}${d.acuerdoInfo?.plan ? ` (${d.acuerdoInfo.plan})` : ''}
            </span>
            <span class="text-[10px] text-slate-400 block mt-0.5">${d.ultimoCanal} · ${d.ultimaFecha}</span>
          </td>
          <td class="px-3 py-2.5 text-center">
            ${badgePago}
          </td>
          <td class="px-3 py-2.5 text-center whitespace-nowrap">
            ${(d.fechaVencimiento || d.acuerdoInfo?.vcto) ? 
              `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 font-mono inline-flex items-center gap-1">
                <i class="fas fa-calendar-day text-[9px] text-purple-600"></i>${d.fechaVencimiento || d.acuerdoInfo?.vcto}
               </span>` : 
              '<span class="text-slate-300 text-xs">-</span>'
            }
          </td>
          <td class="px-3 py-2.5 text-right font-black ${d.montoPromesa > 0 ? (d.esAcuerdo ? 'text-purple-700' : 'text-emerald-600') : 'text-slate-400'}">
            ${d.montoPromesa > 0 ? (d.esAcuerdo ? '<span class="text-[10px] text-purple-600 font-normal mr-1">Cuota</span>' : '') + '$' + d.montoPromesa.toLocaleString('es-AR') : '-'}
          </td>
          <td class="px-3 py-2.5 text-slate-600 max-w-xs truncate" title="${ultObservacion}">
            ${ultObservacion}
          </td>
          <td class="px-3 py-2.5 text-center">
            ${linkHtml}
          </td>
        </tr>
      `;
    }).join('');
  },

  // ==========================================================================
  // BUSCADOR GLOBAL DE DNIs (TRAZABILIDAD MULTI-OPERADOR)
  // ==========================================================================
  buscarDniGlobal(dniQuery) {
    const input = document.getElementById('mango-buscar-dni-global');
    if (input && input.value !== dniQuery) input.value = dniQuery;

    const modal = document.getElementById('mango-modal-trazabilidad-dni');
    const container = document.getElementById('mango-trazabilidad-dni-resultado');
    if (!container) return;

    const cleanDni = String(dniQuery).replace(/[^0-9]/g, '');
    if (!cleanDni || cleanDni.length < 5) {
      if (modal) modal.classList.add('hidden');
      return;
    }

    // Filtrar todas las gestiones de ese DNI
    const historial = this.datosCrudos.filter(d => d.dni && d.dni.includes(cleanDni));

    if (modal) modal.classList.remove('hidden');

    if (historial.length === 0) {
      container.innerHTML = `
        <div class="p-6 text-center text-slate-400">
          <i class="fas fa-id-card text-3xl mb-2 text-slate-300"></i>
          <p class="text-xs">No se encontraron gestiones registradas para el DNI <strong>${cleanDni}</strong></p>
        </div>
      `;
      return;
    }

    const primerReg = historial[0];
    const operadoresQueTocaron = Array.from(new Set(historial.map(h => h.operador)));
    const tieneConvenio = historial.some(h => h.esAcuerdo || h.esPagoImputar);

    container.innerHTML = `
      <div class="p-4 bg-slate-900 text-white rounded-2xl mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded font-mono text-xs font-bold">${primerReg.dni}</span>
            <h3 class="font-bold text-sm">${primerReg.titular}</h3>
            ${tieneConvenio ? `<span class="px-2 py-0.5 bg-purple-500/30 text-purple-300 border border-purple-400/30 rounded font-bold text-[10px]"><i class="fas fa-handshake mr-1"></i> En Convenio / Renovación Mensual</span>` : ''}
          </div>
          <p class="text-xs text-slate-400 mt-0.5">Cartera: <strong>${primerReg.entidad}</strong></p>
        </div>
        <div class="flex items-center gap-3 text-xs">
          <div class="px-3 py-1.5 bg-slate-800 rounded-xl">
            <span class="text-slate-400 block text-[10px]">Total Gestiones</span>
            <span class="font-bold text-blue-400 text-sm">${historial.length}</span>
          </div>
          <div class="px-3 py-1.5 bg-slate-800 rounded-xl">
            <span class="text-slate-400 block text-[10px]">Operadores</span>
            <span class="font-bold text-emerald-400 text-sm">${operadoresQueTocaron.length} (${operadoresQueTocaron.join(', ')})</span>
          </div>
        </div>
      </div>

      <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <i class="fas fa-clock-rotate-left text-blue-600"></i> Historial Cronológico de Gestiones Mango:
      </h4>

      <div class="space-y-2 max-h-80 overflow-y-auto pr-1">
        ${historial.map((h, i) => `
          <div class="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all text-xs flex items-start justify-between gap-3">
            <div class="space-y-1 flex-1">
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-800">${h.operador}</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">${h.canal}</span>
                <span class="text-[11px] text-slate-400">${h.fecha}</span>
              </div>
              <div class="text-[11px] text-slate-600">
                Resultado: <strong class="${h.esAcuerdo ? 'text-purple-600' : h.esPromesa ? 'text-emerald-600' : 'text-slate-800'}">${h.resultado}</strong>
                ${(h.fechaVencimiento || h.acuerdoInfo?.vcto) ? ` · <span class="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-bold"><i class="fas fa-calendar-day mr-1"></i>Vcto: ${h.fechaVencimiento || h.acuerdoInfo?.vcto}</span>` : ''}
                ${h.monto > 0 ? ` · ${h.esAcuerdo ? 'Cuota Acuerdo' : h.esPagoImputar ? 'Pago Rendido' : 'Promesa'}: <strong class="${h.esAcuerdo ? 'text-purple-700' : 'text-emerald-700'}">$${h.monto.toLocaleString('es-AR')}</strong>` : ''}
                ${h.acuerdoInfo?.cuota ? ` · <span class="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-bold">${h.acuerdoInfo.cuota}${h.acuerdoInfo.plan ? ` (${h.acuerdoInfo.plan})` : ''}</span>` : ''}
                ${h.fechaProxAccion ? ` · Prox: <em>${h.proxAccion} (${h.fechaProxAccion})</em>` : ''}
              </div>
              ${h.observacion ? `<div class="p-2 bg-slate-50 rounded-lg text-slate-700 text-[11px] mt-1 border border-slate-100">${h.observacion}</div>` : ''}
            </div>
            ${h.hipervinculo ? `
              <a href="${h.hipervinculo}" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-[11px] font-bold shrink-0">
                Ver en CRM
              </a>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  },

  // ==========================================================================
  // EXPORTACIÓN A EXCEL
  // ==========================================================================
  exportarRankingOperadores() {
    if (!this.operadoresMap || Object.keys(this.operadoresMap).length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const data = Object.values(this.operadoresMap).map((op, idx) => {
      const conv = op.gestiones > 0 ? ((op.promesas / op.gestiones) * 100).toFixed(1) + '%' : '0%';
      const cont = op.gestiones > 0 ? ((op.contactados / op.gestiones) * 100).toFixed(1) + '%' : '0%';
      return {
        'Posición': idx + 1,
        'Operador': op.nombre,
        'Días Trabajados': op.diasTrabajados,
        'DNIs/Día Promedio': Number(op.promedioDnisDia.toFixed(1)),
        '% Cumplimiento Meta 60': `${op.cumplimientoMeta60.toFixed(1)}%`,
        'Total Gestiones': op.gestiones,
        'DNIs Únicos Tocados': op.dnisSet.size,
        'Contactados': op.contactados,
        '% Contactabilidad': cont,
        'Promesas Conseguidas': op.promesas,
        '% Conversión': conv,
        'Monto Total Prometido ($)': op.montoTotal,
        'Gestiones Sin Observación': op.gestionesSinNota,
        'Promesas Sin Monto': op.promesasSinMonto
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ranking Operadores');
    XLSX.writeFile(workbook, `Reporte_Operadores_MangoCRM_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  exportarDnisOperador() {
    if (!this.operadorSeleccionado || !this.operadoresMap[this.operadorSeleccionado]) {
      alert('Selecciona un operador primero.');
      return;
    }

    const opData = this.operadoresMap[this.operadorSeleccionado];
    const data = Object.values(opData.dnisDetalle).map(d => ({
      'DNI': d.dni,
      'Titular': d.titular,
      'Cartera / Entidad': d.entidad,
      'Cantidad Toques': d.cantidadToques,
      'Último Resultado': d.ultimoResultado,
      'Estado Pago': d.tienePagoImputar ? 'Pago Imputado' : (d.esAcuerdo ? 'Acuerdo Pendiente de Pago' : 'Sin Pago'),
      'Fecha Vencimiento Acuerdo': d.fechaVencimiento || d.acuerdoInfo?.vcto || '-',
      'Monto Pago Imputar': d.montoPagoImputar || 0,
      'Último Canal': d.ultimoCanal,
      'Última Fecha': d.ultimaFecha,
      'Monto Promesa / Cuota': d.montoPromesa,
      'Tiene Promesa': d.tienePromesa ? 'SI' : 'NO',
      'Tiene Acuerdo': d.esAcuerdo ? 'SI' : 'NO',
      'Detalle Acuerdo': d.acuerdoInfo?.plan ? `${d.acuerdoInfo.cuota || ''} (${d.acuerdoInfo.plan})` : '',
      'Última Observación': d.observaciones.length > 0 ? d.observaciones[d.observaciones.length - 1] : '',
      'Enlace Mango': d.hipervinculo
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `DNIs_${opData.nombre}`);
    XLSX.writeFile(workbook, `DNIs_Operador_${opData.nombre}_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  restablecerDropZone() {
    const dropText = document.getElementById('mango-drop-text');
    if (dropText) {
      dropText.innerHTML = `
        <span class="text-blue-600 font-bold hover:underline cursor-pointer">Sube o arrastra el archivo Excel (.xlsx / .xls) o CSV</span> de Mango CRM
        <p class="text-xs text-slate-500 mt-1">Exportación estándar de gestiones (negociatudeuda.com.ar)</p>
      `;
    }
  },

  // ==========================================================================
  // DATOS DE EJEMPLO IDÉNTICOS A LA FOTO DE MANGO CRM (1 CLIC DEMO)
  // ==========================================================================
  cargarDatosEjemploMango() {
    // Generar dataset realista fiel a la captura de pantalla provista por el usuario
    const muestra = [
      {
        'personas.idEntidad': 11,
        'entidades.cDescripcion': 'MONI ONLINE',
        'personas.idPersona': 39981,
        'tipodocu.cDescripcion': 'Documento Nacional de Identidad',
        'personas.nNumeroDocumento': '29447843',
        'personas.cDescripcion': 'Ramirez Pedro Antonio',
        'gestiones.idGestion': 1230972,
        'gestiones.dFecha': '01/09/2026',
        'tipocont.cDescripcion': 'Titular',
        'entrgest.cDescripcion': 'Llamada saliente',
        'gestiones.idUsuario': 163,
        'usuarios.cNombUs': 'altamirano.sofia',
        'resultados.cDescripcion': 'Contactado',
        'proxacci.cDescripcion': 'Rellamar',
        'gestiones.dProxAccion': '01/09/2026',
        'gestiones.cObservacion': 'Observacion corta: titular confirma que abona hoy por transferencia',
        'gestiones.nMonto': '',
        'Con archivo': 'No',
        'Hipervinculo': 'https://negociatudeuda.com.ar/cgf/servicios/gestiones.html?id=1230972'
      },
      {
        'personas.idEntidad': 11,
        'entidades.cDescripcion': 'MONI ONLINE',
        'personas.idPersona': 37339,
        'tipodocu.cDescripcion': 'Documento Nacional de Identidad',
        'personas.nNumeroDocumento': '34508184',
        'personas.cDescripcion': 'Musso Emanuel Darío',
        'gestiones.idGestion': 1230982,
        'gestiones.dFecha': '01/09/2026',
        'tipocont.cDescripcion': 'Titular',
        'entrgest.cDescripcion': 'Llamada saliente',
        'gestiones.idUsuario': 163,
        'usuarios.cNombUs': 'altamirano.sofia',
        'resultados.cDescripcion': 'Pago a imputar',
        'proxacci.cDescripcion': 'Rellamar',
        'gestiones.dProxAccion': '30/09/2026',
        'gestiones.cObservacion': 'Monto de $847 pactado para fin de mes con descuento',
        'gestiones.nMonto': 847,
        'Con archivo': 'Si',
        'Hipervinculo': 'https://negociatudeuda.com.ar/cgf/servicios/gestiones.html?id=1230982'
      },
      {
        'personas.idEntidad': 11,
        'entidades.cDescripcion': 'MONI ONLINE',
        'personas.idPersona': 41221,
        'tipodocu.cDescripcion': 'Documento Nacional de Identidad',
        'personas.nNumeroDocumento': '40424510',
        'personas.cDescripcion': 'Condori Ivana Belén',
        'gestiones.idGestion': 1230988,
        'gestiones.dFecha': '01/09/2026',
        'tipocont.cDescripcion': 'Titular',
        'entrgest.cDescripcion': 'Llamada saliente',
        'gestiones.idUsuario': 163,
        'usuarios.cNombUs': 'altamirano.sofia',
        'resultados.cDescripcion': 'Pago a imputar',
        'proxacci.cDescripcion': 'Rellamar',
        'gestiones.dProxAccion': '30/09/2026',
        'gestiones.cObservacion': 'Monto de compromiso $850 acordado. Solicita comprobante.',
        'gestiones.nMonto': 850,
        'Con archivo': 'Si',
        'Hipervinculo': 'https://negociatudeuda.com.ar/cgf/servicios/gestiones.html?id=1230988'
      },
      {
        'personas.idEntidad': 21,
        'entidades.cDescripcion': 'Anticipo/Ubgot',
        'personas.idPersona': 213225,
        'tipodocu.cDescripcion': 'Documento Nacional de Identidad',
        'personas.nNumeroDocumento': '13970146',
        'personas.cDescripcion': 'SALVI MIRTA SUSANA',
        'gestiones.idGestion': 1230995,
        'gestiones.dFecha': '01/09/2026',
        'tipocont.cDescripcion': 'Titular',
        'entrgest.cDescripcion': 'Llamada saliente',
        'gestiones.idUsuario': 163,
        'usuarios.cNombUs': 'altamirano.sofia',
        'resultados.cDescripcion': 'Pago a imputar',
        'proxacci.cDescripcion': 'Rellamar',
        'gestiones.dProxAccion': '30/09/2026',
        'gestiones.cObservacion': 'Monto de promesa acordado $852. Paga por Pago Fácil.',
        'gestiones.nMonto': 852,
        'Con archivo': 'Si',
        'Hipervinculo': 'https://negociatudeuda.com.ar/cgf/servicios/gestiones.html?id=1230995'
      },
      {
        'personas.idEntidad': 11,
        'entidades.cDescripcion': 'MONI ONLINE',
        'personas.idPersona': 119030,
        'tipodocu.cDescripcion': 'Documento Nacional de Identidad',
        'personas.nNumeroDocumento': '36999967',
        'personas.cDescripcion': 'Cortez Matias Ezequiel',
        'gestiones.idGestion': 1231001,
        'gestiones.dFecha': '01/09/2026',
        'tipocont.cDescripcion': 'Sin contacto',
        'entrgest.cDescripcion': 'Llamada saliente',
        'gestiones.idUsuario': 163,
        'usuarios.cNombUs': 'altamirano.sofia',
        'resultados.cDescripcion': 'Mensaje con tercero',
        'proxacci.cDescripcion': 'Rellamar',
        'gestiones.dProxAccion': '01/09/2026',
        'gestiones.cObservacion': 'Atiende familiar, indica que llega a las 18hs',
        'gestiones.nMonto': '',
        'Con archivo': 'No',
        'Hipervinculo': 'https://negociatudeuda.com.ar/cgf/servicios/gestiones.html?id=1231001'
      },
      {
        'personas.idEntidad': 11,
        'entidades.cDescripcion': 'MONI ONLINE',
        'personas.idPersona': 36013,
        'tipodocu.cDescripcion': 'Documento Nacional de Identidad',
        'personas.nNumeroDocumento': '31320337',
        'personas.cDescripcion': 'Ovejero Victor Hugo',
        'gestiones.idGestion': 1231016,
        'gestiones.dFecha': '01/09/2026',
        'tipocont.cDescripcion': 'Sin contacto',
        'entrgest.cDescripcion': 'Llamada saliente',
        'gestiones.idUsuario': 163,
        'usuarios.cNombUs': 'altamirano.sofia',
        'resultados.cDescripcion': 'Ocupado',
        'proxacci.cDescripcion': 'Rellamar',
        'gestiones.dProxAccion': '01/09/2026',
        'gestiones.cObservacion': '',
        'gestiones.nMonto': '',
        'Con archivo': 'No',
        'Hipervinculo': 'https://negociatudeuda.com.ar/cgf/servicios/gestiones.html?id=1231016'
      },
      {
        'personas.idEntidad': 11,
        'entidades.cDescripcion': 'MONI ONLINE',
        'personas.idPersona': 36013,
        'tipodocu.cDescripcion': 'Documento Nacional de Identidad',
        'personas.nNumeroDocumento': '31320337',
        'personas.cDescripcion': 'Ovejero Victor Hugo',
        'gestiones.idGestion': 1231021,
        'gestiones.dFecha': '01/09/2026',
        'tipocont.cDescripcion': 'Titular',
        'entrgest.cDescripcion': 'Whatsapp',
        'gestiones.idUsuario': 163,
        'usuarios.cNombUs': 'altamirano.sofia',
        'resultados.cDescripcion': 'Contactado',
        'proxacci.cDescripcion': 'Rellamar',
        'gestiones.dProxAccion': '01/09/2026',
        'gestiones.cObservacion': 'Observacion corta: responde wsp pidiendo link de pago',
        'gestiones.nMonto': '',
        'Con archivo': 'No',
        'Hipervinculo': 'https://negociatudeuda.com.ar/cgf/servicios/gestiones.html?id=1231021'
      },
      {
        'personas.idEntidad': 11,
        'entidades.cDescripcion': 'MONI ONLINE',
        'personas.idPersona': 36977,
        'tipodocu.cDescripcion': 'Documento Nacional de Identidad',
        'personas.nNumeroDocumento': '20410660',
        'personas.cDescripcion': 'Aranda Marcela Fabiana',
        'gestiones.idGestion': 1231023,
        'gestiones.dFecha': '01/09/2026',
        'tipocont.cDescripcion': 'Sin contacto',
        'entrgest.cDescripcion': 'Llamada saliente',
        'gestiones.idUsuario': 163,
        'usuarios.cNombUs': 'altamirano.sofia',
        'resultados.cDescripcion': 'No contesta',
        'proxacci.cDescripcion': 'Rellamar',
        'gestiones.dProxAccion': '01/09/2026',
        'gestiones.cObservacion': '',
        'gestiones.nMonto': '',
        'Con archivo': 'No',
        'Hipervinculo': 'https://negociatudeuda.com.ar/cgf/servicios/gestiones.html?id=1231023'
      },
      {
        'personas.idEntidad': 11,
        'entidades.cDescripcion': 'MONI ONLINE',
        'personas.idPersona': 36977,
        'tipodocu.cDescripcion': 'Documento Nacional de Identidad',
        'personas.nNumeroDocumento': '20410660',
        'personas.cDescripcion': 'Aranda Marcela Fabiana',
        'gestiones.idGestion': 1231027,
        'gestiones.dFecha': '01/09/2026',
        'tipocont.cDescripcion': 'Titular',
        'entrgest.cDescripcion': 'Whatsapp',
        'gestiones.idUsuario': 163,
        'usuarios.cNombUs': 'altamirano.sofia',
        'resultados.cDescripcion': 'Contactado',
        'proxacci.cDescripcion': 'Rellamar',
        'gestiones.dProxAccion': '01/09/2026',
        'gestiones.cObservacion': 'Observacion corta: notificada por whatsapp',
        'gestiones.nMonto': '',
        'Con archivo': 'No',
        'Hipervinculo': 'https://negociatudeuda.com.ar/cgf/servicios/gestiones.html?id=1231027'
      },
      {
        'personas.idEntidad': 11,
        'entidades.cDescripcion': 'MONI ONLINE',
        'personas.idPersona': 162458,
        'tipodocu.cDescripcion': 'Documento Nacional de Identidad',
        'personas.nNumeroDocumento': '33609044',
        'personas.cDescripcion': 'Dungel Karina Andrea',
        'gestiones.idGestion': 1231030,
        'gestiones.dFecha': '01/09/2026',
        'tipocont.cDescripcion': 'Sin contacto',
        'entrgest.cDescripcion': 'Llamada saliente',
        'gestiones.idUsuario': 163,
        'usuarios.cNombUs': 'altamirano.sofia',
        'resultados.cDescripcion': 'Mensaje con tercero',
        'proxacci.cDescripcion': 'Rellamar',
        'gestiones.dProxAccion': '01/09/2026',
        'gestiones.cObservacion': 'Se deja mensaje con compañero de trabajo',
        'gestiones.nMonto': '',
        'Con archivo': 'No',
        'Hipervinculo': 'https://negociatudeuda.com.ar/cgf/servicios/gestiones.html?id=1231030'
      },
      {
        'personas.idEntidad': 11,
        'entidades.cDescripcion': 'MONI ONLINE',
        'personas.idPersona': 162458,
        'tipodocu.cDescripcion': 'Documento Nacional de Identidad',
        'personas.nNumeroDocumento': '33609044',
        'personas.cDescripcion': 'Dungel Karina Andrea',
        'gestiones.idGestion': 1231036,
        'gestiones.dFecha': '01/09/2026',
        'tipocont.cDescripcion': 'Titular',
        'entrgest.cDescripcion': 'Whatsapp',
        'gestiones.idUsuario': 163,
        'usuarios.cNombUs': 'altamirano.sofia',
        'resultados.cDescripcion': 'Contactado',
        'proxacci.cDescripcion': 'Rellamar',
        'gestiones.dProxAccion': '01/09/2026',
        'gestiones.cObservacion': 'Observacion corta: coordinando fecha de cancelación',
        'gestiones.nMonto': '',
        'Con archivo': 'No',
        'Hipervinculo': 'https://negociatudeuda.com.ar/cgf/servicios/gestiones.html?id=1231036'
      },
      {
        'personas.idEntidad': 11,
        'entidades.cDescripcion': 'MONI ONLINE',
        'personas.idPersona': 119247,
        'tipodocu.cDescripcion': 'Documento Nacional de Identidad',
        'personas.nNumeroDocumento': '23484144',
        'personas.cDescripcion': 'Martinez Patricia Noemí',
        'gestiones.idGestion': 1231051,
        'gestiones.dFecha': '01/09/2026',
        'tipocont.cDescripcion': 'Titular',
        'entrgest.cDescripcion': 'Whatsapp',
        'gestiones.idUsuario': 163,
        'usuarios.cNombUs': 'altamirano.sofia',
        'resultados.cDescripcion': 'Contactado',
        'proxacci.cDescripcion': 'Rellamar',
        'gestiones.dProxAccion': '01/09/2026',
        'gestiones.cObservacion': 'Observacion corta: promete pago el fin de semana',
        'gestiones.nMonto': '',
        'Con archivo': 'No',
        'Hipervinculo': 'https://negociatudeuda.com.ar/cgf/servicios/gestiones.html?id=1231051'
      },
      {
        'personas.idEntidad': 10,
        'entidades.cDescripcion': 'Waynimovil',
        'personas.idPersona': 195904,
        'tipodocu.cDescripcion': 'Documento Nacional de Identidad',
        'personas.nNumeroDocumento': '38427097',
        'personas.cDescripcion': 'AZORIN FLORENCIA NATALIA',
        'gestiones.idGestion': 1231094,
        'gestiones.dFecha': '01/09/2026',
        'tipocont.cDescripcion': 'Sin contacto',
        'entrgest.cDescripcion': 'Llamada saliente',
        'gestiones.idUsuario': 205,
        'usuarios.cNombUs': 'altamirano.kiara',
        'resultados.cDescripcion': 'Ocupado',
        'proxacci.cDescripcion': 'Rellamar',
        'gestiones.dProxAccion': '02/09/2026',
        'gestiones.cObservacion': '',
        'gestiones.nMonto': '',
        'Con archivo': 'No',
        'Hipervinculo': 'https://negociatudeuda.com.ar/cgf/servicios/gestiones.html?id=1231094'
      },
      {
        'personas.idEntidad': 10,
        'entidades.cDescripcion': 'Waynimovil',
        'personas.idPersona': 195859,
        'tipodocu.cDescripcion': 'Documento Nacional de Identidad',
        'personas.nNumeroDocumento': '28518299',
        'personas.cDescripcion': 'LOPEZ MATIAS SEBASTIAN',
        'gestiones.idGestion': 1231632,
        'gestiones.dFecha': '01/09/2026',
        'tipocont.cDescripcion': 'Sin contacto',
        'entrgest.cDescripcion': 'Llamada saliente',
        'gestiones.idUsuario': 205,
        'usuarios.cNombUs': 'altamirano.kiara',
        'resultados.cDescripcion': 'No contesta',
        'proxacci.cDescripcion': 'Rellamar',
        'gestiones.dProxAccion': '02/09/2026',
        'gestiones.cObservacion': '',
        'gestiones.nMonto': '',
        'Con archivo': 'No',
        'Hipervinculo': 'https://negociatudeuda.com.ar/cgf/servicios/gestiones.html?id=1231632'
      },
      {
        'personas.idEntidad': 10,
        'entidades.cDescripcion': 'Waynimovil',
        'personas.idPersona': 110474,
        'tipodocu.cDescripcion': 'Documento Nacional de Identidad',
        'personas.nNumeroDocumento': '20698724',
        'personas.cDescripcion': 'LOPEZ SUSANA BEATRIZ',
        'gestiones.idGestion': 1231663,
        'gestiones.dFecha': '01/09/2026',
        'tipocont.cDescripcion': 'Titular',
        'entrgest.cDescripcion': 'Llamada saliente',
        'gestiones.idUsuario': 163,
        'usuarios.cNombUs': 'altamirano.sofia',
        'resultados.cDescripcion': 'Pago a imputar',
        'proxacci.cDescripcion': 'Rellamar',
        'gestiones.dProxAccion': '01/09/2026',
        'gestiones.cObservacion': 'Monto de $867 acordado. Paga por RapiPago.',
        'gestiones.nMonto': 867,
        'Con archivo': 'Si',
        'Hipervinculo': 'https://negociatudeuda.com.ar/cgf/servicios/gestiones.html?id=1231663'
      },
      {
        'personas.idEntidad': 11,
        'entidades.cDescripcion': 'MONI ONLINE',
        'personas.idPersona': 39006,
        'tipodocu.cDescripcion': 'Documento Nacional de Identidad',
        'personas.nNumeroDocumento': '41556306',
        'personas.cDescripcion': 'Gruti Lautaro Nicolás',
        'gestiones.idGestion': 1289875,
        'gestiones.dFecha': '01/09/2026',
        'tipocont.cDescripcion': 'Sin contacto',
        'entrgest.cDescripcion': 'Llamada saliente',
        'gestiones.idUsuario': 163,
        'usuarios.cNombUs': 'altamirano.sofia',
        'resultados.cDescripcion': 'Mensaje con tercero',
        'proxacci.cDescripcion': 'Rellamar',
        'gestiones.dProxAccion': '01/09/2026',
        'gestiones.cObservacion': 'Deja mensaje con la madre para que devuelva llamada',
        'gestiones.nMonto': '',
        'Con archivo': 'No',
        'Hipervinculo': 'https://negociatudeuda.com.ar/cgf/servicios/gestiones.html?id=1289875'
      },
      // Registros adicionales de otros operadores para ranking enriquecido
      {
        'personas.idEntidad': 10,
        'entidades.cDescripcion': 'Waynimovil',
        'personas.idPersona': 195860,
        'tipodocu.cDescripcion': 'Documento Nacional de Identidad',
        'personas.nNumeroDocumento': '32991044',
        'personas.cDescripcion': 'Ferreira Gisela Paola',
        'gestiones.idGestion': 1231670,
        'gestiones.dFecha': '01/09/2026',
        'tipocont.cDescripcion': 'Titular',
        'entrgest.cDescripcion': 'Llamada saliente',
        'gestiones.idUsuario': 181,
        'usuarios.cNombUs': 'benitez.antonella',
        'resultados.cDescripcion': 'Pago a imputar',
        'proxacci.cDescripcion': 'Rellamar',
        'gestiones.dProxAccion': '05/09/2026',
        'gestiones.cObservacion': 'Compromiso de pago por $1.250 pactado con envío de comprobante',
        'gestiones.nMonto': 1250,
        'Con archivo': 'Si',
        'Hipervinculo': 'https://negociatudeuda.com.ar/cgf/servicios/gestiones.html?id=1231670'
      },
      {
        'personas.idEntidad': 21,
        'entidades.cDescripcion': 'Anticipo/Ubgot',
        'personas.idPersona': 213300,
        'tipodocu.cDescripcion': 'Documento Nacional de Identidad',
        'personas.nNumeroDocumento': '27881900',
        'personas.cDescripcion': 'Benitez Juan Carlos',
        'gestiones.idGestion': 1231685,
        'gestiones.dFecha': '01/09/2026',
        'tipocont.cDescripcion': 'Titular',
        'entrgest.cDescripcion': 'Whatsapp',
        'gestiones.idUsuario': 181,
        'usuarios.cNombUs': 'benitez.antonella',
        'resultados.cDescripcion': 'Pago a imputar',
        'proxacci.cDescripcion': 'Rellamar',
        'gestiones.dProxAccion': '10/09/2026',
        'gestiones.cObservacion': 'Acuerdo de pago total $980 cancelatorio',
        'gestiones.nMonto': 980,
        'Con archivo': 'Si',
        'Hipervinculo': 'https://negociatudeuda.com.ar/cgf/servicios/gestiones.html?id=1231685'
      },
      {
        'personas.idEntidad': 10,
        'entidades.cDescripcion': 'Waynimovil',
        'personas.idPersona': 195910,
        'tipodocu.cDescripcion': 'Documento Nacional de Identidad',
        'personas.nNumeroDocumento': '39112450',
        'personas.cDescripcion': 'Soria Rodrigo Alejandro',
        'gestiones.idGestion': 1231710,
        'gestiones.dFecha': '01/09/2026',
        'tipocont.cDescripcion': 'Titular',
        'entrgest.cDescripcion': 'Whatsapp',
        'gestiones.idUsuario': 205,
        'usuarios.cNombUs': 'altamirano.kiara',
        'resultados.cDescripcion': 'Contactado',
        'proxacci.cDescripcion': 'Rellamar',
        'gestiones.dProxAccion': '02/09/2026',
        'gestiones.cObservacion': 'Pide que lo llamen después de las 19 hs',
        'gestiones.nMonto': '',
        'Con archivo': 'No',
        'Hipervinculo': 'https://negociatudeuda.com.ar/cgf/servicios/gestiones.html?id=1231710'
      }
    ];

    this.procesarDatos(muestra, true, 'Datos de Ejemplo CRM Mango (Simulación Foto)');
  }
};

window.MangoAnalyzerModule = MangoAnalyzerModule;
