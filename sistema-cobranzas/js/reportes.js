// Módulo de Operaciones y Reportes
const ReportesModule = {
  chartRecaudacion: null,
  chartMora: null,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const selectTipo = document.getElementById('reporte-tipo');
    const selectFecha = document.getElementById('reporte-rango');

    if (selectTipo) selectTipo.addEventListener('change', () => this.generarReporte());
    if (selectFecha) selectFecha.addEventListener('change', () => this.generarReporte());

    const btnExportar = document.getElementById('btn-exportar-csv');
    if (btnExportar) btnExportar.addEventListener('click', () => this.exportarCSV());

    const btnImprimir = document.getElementById('btn-imprimir-reporte');
    if (btnImprimir) btnImprimir.addEventListener('click', () => window.print());
  },

  generarReporte() {
    const tipo = document.getElementById('reporte-tipo')?.value || 'recaudacion';
    const rango = document.getElementById('reporte-rango')?.value || 'mes';

    this.renderResumenMetricas();
    this.renderGraficos();
    this.renderTabla(tipo, rango);
  },

  renderResumenMetricas() {
    const pagos = StorageService.getPagos();
    const titulares = StorageService.getTitulares();

    const totalRecaudado = pagos.reduce((sum, p) => sum + (p.monto || 0), 0);
    const totalDeuda = titulares.reduce((sum, t) => sum + (t.deudaTotal || 0), 0);

    const promesas = titulares.filter(t => t.promesaPago);
    const promesasCumplidas = promesas.filter(t => t.promesaPago.estado === 'cumplida').length;
    const tasaPromesas = promesas.length > 0 ? Math.round((promesasCumplidas / promesas.length) * 100) : 0;

    const elTotalRecaudado = document.getElementById('rep-kpi-recaudado');
    const elTotalDeuda = document.getElementById('rep-kpi-deuda');
    const elEfectividad = document.getElementById('rep-kpi-efectividad');
    const elPagosRegistrados = document.getElementById('rep-kpi-pagos');

    if (elTotalRecaudado) elTotalRecaudado.textContent = Formatters.currency(totalRecaudado);
    if (elTotalDeuda) elTotalDeuda.textContent = Formatters.currency(totalDeuda);
    if (elEfectividad) elEfectividad.textContent = `${tasaPromesas}%`;
    if (elPagosRegistrados) elPagosRegistrados.textContent = `${pagos.length} transacciones`;
  },

  renderGraficos() {
    if (typeof Chart === 'undefined') return;

    const pagos = StorageService.getPagos();
    const titulares = StorageService.getTitulares();

    // 1. Gráfico de Recaudación Diaria / Métodos
    const ctxRec = document.getElementById('chart-recaudacion-canvas')?.getContext('2d');
    if (ctxRec) {
      if (this.chartRecaudacion) this.chartRecaudacion.destroy();

      // Agrupar pagos por día o por método
      const metodos = {};
      pagos.forEach(p => {
        const m = p.metodo || 'Otros';
        metodos[m] = (metodos[m] || 0) + p.monto;
      });

      this.chartRecaudacion = new Chart(ctxRec, {
        type: 'bar',
        data: {
          labels: Object.keys(metodos),
          datasets: [{
            label: 'Monto Recaudado ($)',
            data: Object.values(metodos),
            backgroundColor: [
              'rgba(37, 99, 235, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(139, 92, 246, 0.8)',
              'rgba(236, 72, 153, 0.8)'
            ],
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '$' + (value / 1000) + 'k';
                }
              }
            }
          }
        }
      });
    }

    // 2. Gráfico de Tramos de Mora (Aging)
    const ctxMora = document.getElementById('chart-mora-canvas')?.getContext('2d');
    if (ctxMora) {
      if (this.chartMora) this.chartMora.destroy();

      const tramos = {
        'Al Día': 0,
        '1 - 30 días': 0,
        '31 - 60 días': 0,
        '61 - 90 días': 0,
        'Judicial (+90d)': 0
      };

      titulares.forEach(t => {
        if (t.tramoMora === 'al_dia') tramos['Al Día'] += t.deudaTotal;
        else if (t.tramoMora === 'mora_1_30') tramos['1 - 30 días'] += t.deudaTotal;
        else if (t.tramoMora === 'mora_31_60') tramos['31 - 60 días'] += t.deudaTotal;
        else if (t.tramoMora === 'mora_61_90') tramos['61 - 90 días'] += t.deudaTotal;
        else if (t.tramoMora === 'judicial') tramos['Judicial (+90d)'] += t.deudaTotal;
      });

      this.chartMora = new Chart(ctxMora, {
        type: 'doughnut',
        data: {
          labels: Object.keys(tramos),
          datasets: [{
            data: Object.values(tramos),
            backgroundColor: [
              '#10b981',
              '#fbbf24',
              '#f97316',
              '#ef4444',
              '#8b5cf6'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                font: { size: 11 }
              }
            }
          }
        }
      });
    }
  },

  renderTabla(tipo, rango) {
    const thead = document.getElementById('reporte-tabla-head');
    const tbody = document.getElementById('reporte-tabla-body');
    const title = document.getElementById('reporte-tabla-titulo');
    if (!thead || !tbody) return;

    if (tipo === 'recaudacion') {
      title.textContent = 'Detalle de Cobranzas y Recaudación';
      thead.innerHTML = `
        <tr class="bg-slate-50 text-slate-600 text-xs font-semibold border-b">
          <th class="p-3 text-left">Comprobante</th>
          <th class="p-3 text-left">Titular</th>
          <th class="p-3 text-left">Fecha y Hora</th>
          <th class="p-3 text-left">Método de Pago</th>
          <th class="p-3 text-left">Operador</th>
          <th class="p-3 text-left">Concepto</th>
          <th class="p-3 text-right">Monto</th>
        </tr>
      `;

      const pagos = StorageService.getPagos();
      if (pagos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400">No hay pagos registrados.</td></tr>`;
        return;
      }

      tbody.innerHTML = pagos.map(p => `
        <tr class="border-b hover:bg-slate-50 text-xs text-slate-700">
          <td class="p-3 font-mono font-bold text-blue-600">${p.comprobante}</td>
          <td class="p-3 font-semibold">${p.titularNombre}</td>
          <td class="p-3 text-slate-500">${p.fecha}</td>
          <td class="p-3"><span class="badge badge-slate">${p.metodo}</span></td>
          <td class="p-3">${p.operador}</td>
          <td class="p-3 text-slate-500">${p.concepto}</td>
          <td class="p-3 font-bold text-emerald-600 text-right">${Formatters.currency(p.monto)}</td>
        </tr>
      `).join('');

    } else if (tipo === 'promesas') {
      title.textContent = 'Reporte de Compromisos y Promesas de Pago (Detalle de Acuerdos)';
      thead.innerHTML = `
        <tr class="bg-slate-50 text-slate-600 text-xs font-semibold border-b">
          <th class="p-3 text-left">Titular y DNI</th>
          <th class="p-3 text-left">Cuenta</th>
          <th class="p-3 text-left bg-blue-50/60 font-bold text-blue-900">Fecha de Gestión</th>
          <th class="p-3 text-left bg-amber-50/60 font-bold text-amber-900">Fecha Promesa Pactada</th>
          <th class="p-3 text-left bg-indigo-50/60 font-bold text-indigo-900">Operador que Gestionó</th>
          <th class="p-3 text-right bg-emerald-50/60 font-extrabold text-emerald-900">Monto Arreglado</th>
          <th class="p-3 text-right text-slate-500">Deuda Total</th>
          <th class="p-3 text-center">Estado</th>
        </tr>
      `;

      const titulares = StorageService.getTitulares().filter(t => t.promesaPago);
      const operadores = StorageService.getOperadores();

      if (titulares.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-400">No hay promesas de pago registradas.</td></tr>`;
        return;
      }

      const totalMontoArreglado = titulares.reduce((sum, t) => sum + Number(t.promesaPago.monto || 0), 0);

      tbody.innerHTML = titulares.map(t => {
        const op = operadores.find(o => o.id === t.operadorId);
        const opNombre = t.promesaPago.operador || (op ? op.nombre : 'Sin asignar');
        const fechaGestion = t.promesaPago.fechaGestion || (t.gestiones && t.gestiones[0] ? t.gestiones[0].fecha : '-');
        const fechaPromesa = t.promesaPago.fechaPromesa || t.promesaPago.fecha;
        const st = t.promesaPago.estado;
        const badge = st === 'cumplida' 
          ? '<span class="badge badge-success">Cumplida</span>'
          : st === 'pendiente' 
          ? '<span class="badge badge-warning">Pendiente</span>'
          : '<span class="badge badge-danger">Caída / Vencida</span>';

        return `
          <tr class="border-b hover:bg-slate-50 text-xs text-slate-700">
            <td class="p-3">
              <span class="font-bold text-slate-900">${t.nombre}</span>
              <span class="block text-[11px] text-slate-400">DNI: ${t.dni}</span>
            </td>
            <td class="p-3 text-slate-500 font-mono">${t.cuenta}</td>
            <td class="p-3 bg-blue-50/30 font-semibold text-blue-800">
              <i class="far fa-clock text-blue-500 mr-1"></i>${Formatters.date(fechaGestion)}
            </td>
            <td class="p-3 bg-amber-50/30 font-bold text-amber-800">
              <i class="far fa-calendar-alt text-amber-500 mr-1"></i>${Formatters.date(fechaPromesa)}
            </td>
            <td class="p-3 bg-indigo-50/30 font-semibold text-indigo-900">
              <i class="fas fa-headset text-indigo-400 mr-1"></i>${opNombre}
            </td>
            <td class="p-3 bg-emerald-50/30 font-extrabold text-emerald-700 text-right text-sm">
              ${Formatters.currency(t.promesaPago.monto)}
            </td>
            <td class="p-3 text-slate-500 text-right font-medium">${Formatters.currency(t.deudaTotal)}</td>
            <td class="p-3 text-center">${badge}</td>
          </tr>
        `;
      }).join('') + `
        <tr class="bg-slate-100 font-bold text-xs text-slate-800 border-t-2 border-slate-300">
          <td colspan="5" class="p-3 text-right text-slate-600 uppercase">Total Monto Arreglado en Promesas:</td>
          <td class="p-3 text-right text-emerald-700 font-extrabold text-sm">${Formatters.currency(totalMontoArreglado)}</td>
          <td colspan="2"></td>
        </tr>
      `;

    } else if (tipo === 'aging') {
      title.textContent = 'Distribución de Cartera por Antigüedad de Mora (Aging)';
      thead.innerHTML = `
        <tr class="bg-slate-50 text-slate-600 text-xs font-semibold border-b">
          <th class="p-3 text-left">Tramo de Mora</th>
          <th class="p-3 text-center">Cant. Titulares</th>
          <th class="p-3 text-right">Capital</th>
          <th class="p-3 text-right">Intereses</th>
          <th class="p-3 text-right">Total Deuda</th>
          <th class="p-3 text-right">% Cartera Total</th>
        </tr>
      `;

      const titulares = StorageService.getTitulares();
      const totalGeneral = titulares.reduce((sum, t) => sum + (t.deudaTotal || 0), 0) || 1;

      const buckets = [
        { label: 'Al Día (0 días)', tramo: 'al_dia', badge: 'badge-success' },
        { label: 'Mora Temprana (1 - 30 días)', tramo: 'mora_1_30', badge: 'badge-warning' },
        { label: 'Mora Media (31 - 60 días)', tramo: 'mora_31_60', badge: 'badge-orange' },
        { label: 'Mora Tardía (61 - 90 días)', tramo: 'mora_61_90', badge: 'badge-danger' },
        { label: 'Prejudicial / Judicial (+90 días)', tramo: 'judicial', badge: 'badge-purple' }
      ];

      tbody.innerHTML = buckets.map(b => {
        const filtrados = titulares.filter(t => t.tramoMora === b.tramo);
        const cant = filtrados.length;
        const capital = filtrados.reduce((sum, t) => sum + (t.capital || 0), 0);
        const intereses = filtrados.reduce((sum, t) => sum + (t.intereses || 0) + (t.gastos || 0), 0);
        const total = filtrados.reduce((sum, t) => sum + (t.deudaTotal || 0), 0);
        const porcentaje = ((total / totalGeneral) * 100).toFixed(1);

        return `
          <tr class="border-b hover:bg-slate-50 text-xs text-slate-700">
            <td class="p-3 font-semibold"><span class="badge ${b.badge}">${b.label}</span></td>
            <td class="p-3 text-center font-bold text-slate-800">${cant}</td>
            <td class="p-3 text-right text-slate-600">${Formatters.currency(capital)}</td>
            <td class="p-3 text-right text-slate-600">${Formatters.currency(intereses)}</td>
            <td class="p-3 text-right font-extrabold text-red-600">${Formatters.currency(total)}</td>
            <td class="p-3 text-right font-bold text-slate-800">${porcentaje}%</td>
          </tr>
        `;
      }).join('');

    } else if (tipo === 'operadores') {
      title.textContent = 'Productividad y Rendimiento por Operador';
      thead.innerHTML = `
        <tr class="bg-slate-50 text-slate-600 text-xs font-semibold border-b">
          <th class="p-3 text-left">Operador</th>
          <th class="p-3 text-center">Estado Actual</th>
          <th class="p-3 text-center">Llamadas Hoy</th>
          <th class="p-3 text-center">Promesas Hoy</th>
          <th class="p-3 text-center">Efectividad</th>
          <th class="p-3 text-right">Recaudado Hoy</th>
          <th class="p-3 text-right">Meta Diaria</th>
          <th class="p-3 text-right">% Cumplimiento</th>
        </tr>
      `;

      const operadores = StorageService.getOperadores();
      tbody.innerHTML = operadores.map(op => {
        const cumplimiento = Math.min(100, Math.round(((op.recaudadoHoy || 0) / (op.metaDiaria || 1)) * 100));

        return `
          <tr class="border-b hover:bg-slate-50 text-xs text-slate-700">
            <td class="p-3 font-bold text-slate-800">${op.nombre}</td>
            <td class="p-3 text-center">${Formatters.operadorEstadoBadge(op.estado)}</td>
            <td class="p-3 text-center font-semibold">${op.llamadasHoy || 0}</td>
            <td class="p-3 text-center font-semibold text-blue-600">${op.promesasHoy || 0}</td>
            <td class="p-3 text-center font-bold">${op.efectividad || 0}%</td>
            <td class="p-3 text-right font-bold text-emerald-600">${Formatters.currency(op.recaudadoHoy)}</td>
            <td class="p-3 text-right text-slate-500">${Formatters.currency(op.metaDiaria)}</td>
            <td class="p-3 text-right font-extrabold ${cumplimiento >= 100 ? 'text-emerald-600' : 'text-blue-600'}">
              ${cumplimiento}%
            </td>
          </tr>
        `;
      }).join('');
    }
  },

  exportarCSV() {
    const tipo = document.getElementById('reporte-tipo')?.value || 'recaudacion';
    let csvContent = '\uFEFF'; // UTF-8 BOM para Excel
    let filename = `Reporte_${tipo}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (tipo === 'recaudacion') {
      csvContent += 'Comprobante;Titular;Fecha;Metodo;Operador;Concepto;Monto\r\n';
      const pagos = StorageService.getPagos();
      pagos.forEach(p => {
        csvContent += `"${p.comprobante}";"${p.titularNombre}";"${p.fecha}";"${p.metodo}";"${p.operador}";"${p.concepto}";"${p.monto}"\r\n`;
      });
    } else if (tipo === 'promesas') {
      csvContent += 'Titular;DNI;Cuenta;Fecha_Gestion;Fecha_Promesa_Pactada;Operador;Monto_Arreglado;Deuda_Total;Estado\r\n';
      const titulares = StorageService.getTitulares().filter(t => t.promesaPago);
      const operadores = StorageService.getOperadores();
      titulares.forEach(t => {
        const op = operadores.find(o => o.id === t.operadorId);
        const opNombre = t.promesaPago.operador || (op ? op.nombre : 'Sin asignar');
        const fechaGestion = t.promesaPago.fechaGestion || (t.gestiones && t.gestiones[0] ? t.gestiones[0].fecha : '-');
        const fechaPromesa = t.promesaPago.fechaPromesa || t.promesaPago.fecha;
        csvContent += `"${t.nombre}";"${t.dni}";"${t.cuenta}";"${fechaGestion}";"${fechaPromesa}";"${opNombre}";"${t.promesaPago.monto}";"${t.deudaTotal}";"${t.promesaPago.estado}"\r\n`;
      });
    } else if (tipo === 'operadores') {
      csvContent += 'Operador;Estado;Llamadas;Promesas;Efectividad;Recaudado;Meta\r\n';
      const operadores = StorageService.getOperadores();
      operadores.forEach(o => {
        csvContent += `"${o.nombre}";"${o.estado}";"${o.llamadasHoy}";"${o.promesasHoy}";"${o.efectividad}%";"${o.recaudadoHoy}";"${o.metaDiaria}"\r\n`;
      });
    } else {
      csvContent += 'Titular;DNI;Cuenta;Entidad;Deuda Total;Mora Dias;Tramo\r\n';
      const titulares = StorageService.getTitulares();
      titulares.forEach(t => {
        csvContent += `"${t.nombre}";"${t.dni}";"${t.cuenta}";"${t.entidad}";"${t.deudaTotal}";"${t.diasMora}";"${t.tramoMora}"\r\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    App.showToast(`Reporte exportado exitosamente (${filename})`, 'success');
  }
};

window.ReportesModule = ReportesModule;
