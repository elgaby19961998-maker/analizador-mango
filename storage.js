// Módulo de almacenamiento y persistencia LocalStorage para CobranzasPro
const STORAGE_KEYS = {
  TITULARES: 'cobranzaspro_titulares',
  OPERADORES: 'cobranzaspro_operadores',
  PAGOS: 'cobranzaspro_pagos'
};

const StorageService = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.TITULARES)) {
      this.resetToDefaults();
    }
  },

  resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.TITULARES, JSON.stringify(window.INITIAL_DATA.titulares));
    localStorage.setItem(STORAGE_KEYS.OPERADORES, JSON.stringify(window.INITIAL_DATA.operadores));
    localStorage.setItem(STORAGE_KEYS.PAGOS, JSON.stringify(window.INITIAL_DATA.pagos));
  },

  // TITULARES
  getTitulares() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.TITULARES)) || [];
    } catch (e) {
      console.error('Error cargando titulares:', e);
      return window.INITIAL_DATA.titulares;
    }
  },

  getTitularById(id) {
    const titulares = this.getTitulares();
    return titulares.find(t => t.id === id) || null;
  },

  getTitularByDni(dni) {
    const titulares = this.getTitulares();
    const cleanDni = String(dni).replace(/[^0-9]/g, '');
    return titulares.find(t => String(t.dni).replace(/[^0-9]/g, '') === cleanDni) || null;
  },

  saveTitulares(titulares) {
    localStorage.setItem(STORAGE_KEYS.TITULARES, JSON.stringify(titulares));
  },

  updateTitular(updatedTitular) {
    const titulares = this.getTitulares();
    const index = titulares.findIndex(t => t.id === updatedTitular.id);
    if (index !== -1) {
      titulares[index] = updatedTitular;
      this.saveTitulares(titulares);
      return true;
    }
    return false;
  },

  addGestion(titularId, gestion) {
    const titulares = this.getTitulares();
    const titular = titulares.find(t => t.id === titularId);
    if (!titular) return null;

    if (!titular.gestiones) titular.gestiones = [];
    gestion.id = 'G-' + Date.now();
    gestion.fecha = gestion.fecha || new Date().toISOString().replace('T', ' ').substring(0, 16);
    titular.gestiones.unshift(gestion);

    // Actualizar estado de gestión y promesa
    if (gestion.promesaPago && gestion.promesaPago.monto > 0) {
      titular.promesaPago = {
        monto: Number(gestion.promesaPago.monto),
        fechaGestion: gestion.fecha,
        fechaPromesa: gestion.promesaPago.fechaPromesa || gestion.promesaPago.fecha,
        operador: gestion.operador,
        estado: 'pendiente'
      };
      titular.estadoGestion = 'compromiso_pago';
    } else if (gestion.resultado.toLowerCase().includes('negativa')) {
      titular.estadoGestion = 'negativa';
    } else if (gestion.resultado.toLowerCase().includes('no contesta') || gestion.resultado.toLowerCase().includes('buzón')) {
      titular.estadoGestion = 'no_contesta';
    } else if (gestion.resultado.toLowerCase().includes('acuerdo')) {
      titular.estadoGestion = 'acuerdo';
    }

    this.saveTitulares(titulares);

    // Incrementar llamadas del operador
    if (gestion.operadorId || gestion.operador) {
      const operadores = this.getOperadores();
      const op = operadores.find(o => o.id === gestion.operadorId || o.nombre === gestion.operador);
      if (op) {
        op.llamadasHoy = (op.llamadasHoy || 0) + 1;
        if (gestion.promesaPago && gestion.promesaPago.monto > 0) {
          op.promesasHoy = (op.promesasHoy || 0) + 1;
        }
        this.saveOperadores(operadores);
      }
    }

    return titular;
  },

  // CARGAS MASIVAS (OPERACIONES)
  importarStockCartera(titularesNuevos) {
    const titulares = this.getTitulares();
    let importados = 0;

    titularesNuevos.forEach(item => {
      if (!item.dni || !item.nombre) return;

      const cleanDni = String(item.dni).replace(/[^0-9]/g, '');
      const existe = titulares.find(t => String(t.dni).replace(/[^0-9]/g, '') === cleanDni);

      const deuda = Number(item.deudaTotal || item.capital || 0);
      const cap = Number(item.capital || deuda);
      const int = Number(item.intereses || 0);
      const gas = Number(item.gastos || 0);

      if (existe) {
        // Actualizar datos de deuda y cuenta
        existe.deudaTotal = deuda > 0 ? deuda : existe.deudaTotal;
        existe.capital = cap > 0 ? cap : existe.capital;
        if (item.telefono) existe.telefono = item.telefono;
        if (item.entidad) existe.entidad = item.entidad;
        if (item.operadorId) existe.operadorId = item.operadorId;
        importados++;
      } else {
        // Alta nuevo titular
        const nuevo = {
          id: 'TIT-' + Math.floor(1000 + Math.random() * 9000),
          nombre: item.nombre,
          dni: item.dni,
          telefono: item.telefono || 'Sin teléfono',
          telefonosAdicionales: [],
          email: item.email || '',
          emailsAdicionales: [],
          direccion: item.direccion || 'Sin dirección',
          datosLaborales: null,
          cuenta: item.cuenta || 'CTA-' + Math.floor(1000 + Math.random() * 9000),
          entidad: item.entidad || 'Cartera Central',
          producto: item.producto || 'Crédito',
          deudaTotal: deuda,
          capital: cap,
          intereses: int,
          gastos: gas,
          diasMora: Number(item.diasMora || 30),
          tramoMora: item.tramoMora || 'mora_1_30',
          fechaVencimiento: item.fechaVencimiento || new Date().toISOString().slice(0, 10),
          ultimoPago: null,
          operadorId: item.operadorId || 'OP01',
          estadoGestion: 'sin_gestion',
          promesaPago: null,
          gestiones: []
        };
        titulares.push(nuevo);
        importados++;
      }
    });

    this.saveTitulares(titulares);
    return importados;
  },

  importarGestionesMasivas(gestionesNuevas) {
    const titulares = this.getTitulares();
    let procesadas = 0;

    gestionesNuevas.forEach(g => {
      if (!g.dni) return;
      const cleanDni = String(g.dni).replace(/[^0-9]/g, '');
      const titular = titulares.find(t => String(t.dni).replace(/[^0-9]/g, '') === cleanDni);
      if (!titular) return;

      if (!titular.gestiones) titular.gestiones = [];
      const fechaActual = g.fecha || new Date().toISOString().replace('T', ' ').substring(0, 16);

      titular.gestiones.unshift({
        id: 'G-' + Date.now() + '-' + Math.floor(Math.random() * 100),
        fecha: fechaActual,
        operador: g.operador || 'Campaña Automática',
        canal: g.canal || 'Llamada telefónica',
        resultado: g.resultado || 'Gestión Masiva',
        observaciones: g.observaciones || 'Carga masiva de gestión'
      });

      // Si la gestión incluye promesa de pago
      if (g.montoPromesa && Number(g.montoPromesa) > 0) {
        titular.promesaPago = {
          monto: Number(g.montoPromesa),
          fechaGestion: fechaActual,
          fechaPromesa: g.fechaPromesa || new Date().toISOString().slice(0, 10),
          operador: g.operador || 'Campaña Automática',
          estado: 'pendiente'
        };
        titular.estadoGestion = 'compromiso_pago';
      }

      procesadas++;
    });

    this.saveTitulares(titulares);
    return procesadas;
  },

  importarTelefonos(telefonosNuevos) {
    const titulares = this.getTitulares();
    let enriquecidos = 0;

    telefonosNuevos.forEach(t => {
      if (!t.dni || !t.numero) return;
      const cleanDni = String(t.dni).replace(/[^0-9]/g, '');
      const titular = titulares.find(item => String(item.dni).replace(/[^0-9]/g, '') === cleanDni);
      if (!titular) return;

      if (!titular.telefonosAdicionales) titular.telefonosAdicionales = [];
      // Evitar duplicados
      const existeTel = titular.telefonosAdicionales.some(tel => tel.numero === t.numero) || titular.telefono === t.numero;
      if (!existeTel) {
        titular.telefonosAdicionales.push({
          numero: t.numero,
          tipo: t.tipo || 'Celular',
          observacion: t.observacion || 'Carga masiva'
        });
        enriquecidos++;
      }
    });

    this.saveTitulares(titulares);
    return enriquecidos;
  },

  importarMails(mailsNuevos) {
    const titulares = this.getTitulares();
    let enriquecidos = 0;

    mailsNuevos.forEach(m => {
      if (!m.dni || !m.email) return;
      const cleanDni = String(m.dni).replace(/[^0-9]/g, '');
      const titular = titulares.find(item => String(item.dni).replace(/[^0-9]/g, '') === cleanDni);
      if (!titular) return;

      if (!titular.emailsAdicionales) titular.emailsAdicionales = [];
      const existeEmail = titular.emailsAdicionales.some(em => em.email === m.email) || titular.email === m.email;
      if (!existeEmail) {
        titular.emailsAdicionales.push({
          email: m.email,
          tipo: m.tipo || 'Personal'
        });
        enriquecidos++;
      }
    });

    this.saveTitulares(titulares);
    return enriquecidos;
  },

  importarDatosLaborales(laboralesNuevos) {
    const titulares = this.getTitulares();
    let enriquecidos = 0;

    laboralesNuevos.forEach(l => {
      if (!l.dni || !l.empleador) return;
      const cleanDni = String(l.dni).replace(/[^0-9]/g, '');
      const titular = titulares.find(item => String(item.dni).replace(/[^0-9]/g, '') === cleanDni);
      if (!titular) return;

      titular.datosLaborales = {
        empleador: l.empleador,
        cuitEmpleador: l.cuitEmpleador || '-',
        cargo: l.cargo || 'Empleado',
        telefonoLaboral: l.telefonoLaboral || '-',
        sueldoEstimado: Number(l.sueldoEstimado || 0)
      };
      enriquecidos++;
    });

    this.saveTitulares(titulares);
    return enriquecidos;
  },

  // PAGOS
  getPagos() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PAGOS)) || [];
    } catch (e) {
      console.error('Error cargando pagos:', e);
      return window.INITIAL_DATA.pagos;
    }
  },

  savePagos(pagos) {
    localStorage.setItem(STORAGE_KEYS.PAGOS, JSON.stringify(pagos));
  },

  registrarPago(pagoData) {
    const pagos = this.getPagos();
    const titulares = this.getTitulares();
    const titular = titulares.find(t => t.id === pagoData.titularId);

    if (!titular) return null;

    const monto = Number(pagoData.monto);
    const nuevoPago = {
      id: 'PAG-' + Math.floor(1000 + Math.random() * 9000),
      titularId: titular.id,
      titularNombre: titular.nombre,
      monto: monto,
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
      metodo: pagoData.metodo || 'Transferencia Bancaria',
      operador: pagoData.operador || 'Operador Central',
      comprobante: pagoData.comprobante || 'REC-' + Math.floor(100000 + Math.random() * 900000),
      concepto: pagoData.concepto || (monto >= titular.deudaTotal ? 'Cancelación Total' : 'Pago Parcial a Cuenta')
    };

    pagos.unshift(nuevoPago);
    this.savePagos(pagos);

    // Actualizar deuda del titular
    titular.deudaTotal = Math.max(0, titular.deudaTotal - monto);
    titular.ultimoPago = {
      fecha: nuevoPago.fecha.split(' ')[0],
      monto: monto
    };

    if (titular.deudaTotal === 0) {
      titular.tramoMora = 'al_dia';
      titular.estadoGestion = 'acuerdo';
      if (titular.promesaPago) titular.promesaPago.estado = 'cumplida';
    } else if (titular.promesaPago && titular.promesaPago.estado === 'pendiente') {
      if (monto >= titular.promesaPago.monto) {
        titular.promesaPago.estado = 'cumplida';
      }
    }

    if (!titular.gestiones) titular.gestiones = [];
    titular.gestiones.unshift({
      id: 'G-' + Date.now(),
      fecha: nuevoPago.fecha,
      operador: nuevoPago.operador,
      canal: 'Cobranza / Pago',
      resultado: 'Pago Registrado ($' + monto.toLocaleString('es-AR') + ')',
      observaciones: `Ingreso por ${nuevoPago.metodo}. Comprobante N° ${nuevoPago.comprobante}. ${nuevoPago.concepto}.`
    });

    this.saveTitulares(titulares);

    // Actualizar métricas del operador
    const operadores = this.getOperadores();
    const op = operadores.find(o => o.nombre === nuevoPago.operador || o.id === pagoData.operadorId);
    if (op) {
      op.recaudadoHoy = (op.recaudadoHoy || 0) + monto;
      this.saveOperadores(operadores);
    }

    return { pago: nuevoPago, titularActualizado: titular };
  },

  // OPERADORES
  getOperadores() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.OPERADORES)) || [];
    } catch (e) {
      console.error('Error cargando operadores:', e);
      return window.INITIAL_DATA.operadores;
    }
  },

  saveOperadores(operadores) {
    localStorage.setItem(STORAGE_KEYS.OPERADORES, JSON.stringify(operadores));
  },

  updateOperadorEstado(operadorId, nuevoEstado, titularActual) {
    const operadores = this.getOperadores();
    const op = operadores.find(o => o.id === operadorId);
    if (op) {
      op.estado = nuevoEstado;
      if (titularActual !== undefined) op.titularActual = titularActual;
      op.tiempoEstado = '00:01';
      this.saveOperadores(operadores);
      return op;
    }
    return null;
  },

  reasignarTitular(titularId, nuevoOperadorId) {
    const titulares = this.getTitulares();
    const operadores = this.getOperadores();
    const titular = titulares.find(t => t.id === titularId);
    const operador = operadores.find(o => o.id === nuevoOperadorId);

    if (titular && operador) {
      titular.operadorId = nuevoOperadorId;
      if (!titular.gestiones) titular.gestiones = [];
      titular.gestiones.unshift({
        id: 'G-' + Date.now(),
        fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
        operador: 'Sistema Supervisor',
        canal: 'Reasignación de Cartera',
        resultado: `Cartera reasignada a ${operador.nombre}`,
        observaciones: `El titular pasa a ser gestionado por ${operador.nombre}.`
      });
      this.saveTitulares(titulares);
      return true;
    }
    return false;
  }
};

// Formateadores globales
window.Formatters = {
  currency(amount) {
    return '$ ' + Number(amount || 0).toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  },

  date(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split(' ')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  },

  tramoBadge(tramo) {
    switch (tramo) {
      case 'al_dia':
        return '<span class="badge badge-success">Al Día</span>';
      case 'mora_1_30':
        return '<span class="badge badge-warning">Mora 1-30d</span>';
      case 'mora_31_60':
        return '<span class="badge badge-orange">Mora 31-60d</span>';
      case 'mora_61_90':
        return '<span class="badge badge-danger">Mora 61-90d</span>';
      case 'judicial':
        return '<span class="badge badge-purple">Judicial (+90d)</span>';
      default:
        return '<span class="badge badge-slate">' + (tramo || 'Sin tramificación') + '</span>';
    }
  },

  estadoGestionBadge(estado) {
    switch (estado) {
      case 'compromiso_pago':
        return '<span class="badge badge-blue"><i class="fas fa-handshake mr-1"></i> Compromiso Pago</span>';
      case 'acuerdo':
        return '<span class="badge badge-success"><i class="fas fa-check-circle mr-1"></i> Acuerdo / Al día</span>';
      case 'negativa':
        return '<span class="badge badge-danger"><i class="fas fa-times-circle mr-1"></i> Negativa de Pago</span>';
      case 'no_contesta':
        return '<span class="badge badge-orange"><i class="fas fa-phone-slash mr-1"></i> No Contesta</span>';
      case 'en_negociacion':
        return '<span class="badge badge-yellow"><i class="fas fa-comments mr-1"></i> En Negociación</span>';
      default:
        return '<span class="badge badge-slate"><i class="fas fa-clock mr-1"></i> Sin Gestión</span>';
    }
  },

  operadorEstadoBadge(estado) {
    switch (estado) {
      case 'disponible':
        return '<span class="status-indicator status-online"><span class="dot"></span> Disponible</span>';
      case 'en_llamada':
        return '<span class="status-indicator status-busy"><span class="dot animate-ping"></span> En Llamada</span>';
      case 'gestionando':
        return '<span class="status-indicator status-working"><span class="dot"></span> En Gestión</span>';
      case 'pausa':
        return '<span class="status-indicator status-pause"><span class="dot"></span> Pausa / Refrigerio</span>';
      default:
        return '<span class="status-indicator status-offline"><span class="dot"></span> Inactivo</span>';
    }
  }
};

window.StorageService = StorageService;
