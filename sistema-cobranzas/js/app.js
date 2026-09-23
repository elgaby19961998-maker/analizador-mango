// Archivo principal de la aplicación CobranzasPro con control de autenticación y roles
const App = {
  activeTab: 'dashboard',

  init() {
    StorageService.init();
    if (window.AuthService) AuthService.init();

    this.bindAuthEvents();
    this.verificarSesion();

    // Evento de reseteo de datos
    const btnReset = document.getElementById('btn-reset-demo-data');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('¿Deseas restablecer todos los datos iniciales de prueba? Se reiniciarán pagos, titulares y usuarios creados.')) {
          StorageService.resetToDefaults();
          localStorage.removeItem('cobranzaspro_usuarios_db');
          location.reload();
        }
      });
    }

    console.log('CobranzasPro inicializado con éxito');
  },

  bindAuthEvents() {
    // Formulario tradicional de login
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const userInput = document.getElementById('login-usuario').value;
        const passInput = document.getElementById('login-password').value;

        const res = AuthService.login(userInput, passInput);
        if (res.success) {
          this.verificarSesion();
          this.showToast(`¡Bienvenido/a, ${res.user.nombre}!`, 'success');
        } else {
          this.showToast(res.message, 'error');
        }
      });
    }

    // Botones de ingreso rápido por rol (1 clic)
    document.querySelectorAll('.btn-login-rapido').forEach(btn => {
      btn.addEventListener('click', () => {
        const rol = btn.getAttribute('data-role');
        const res = AuthService.loginRapido(rol);
        if (res.success) {
          this.verificarSesion();
          this.showToast(`Ingresaste como ${res.user.nombre} (${res.user.rol.toUpperCase()})`, 'success');
        } else {
          this.showToast(res.message, 'error');
        }
      });
    });

    // Botón de cerrar sesión
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        if (confirm('¿Deseas cerrar tu sesión actual?')) {
          AuthService.logout();
        }
      });
    }
  },

  verificarSesion() {
    const user = AuthService.getCurrentUser();
    const viewLogin = document.getElementById('view-login');
    const appShell = document.getElementById('app-shell');

    if (!user) {
      // Mostrar login, ocultar aplicación
      if (viewLogin) viewLogin.classList.remove('hidden');
      if (appShell) appShell.classList.add('hidden');
      return;
    }

    // Usuario autenticado
    if (viewLogin) viewLogin.classList.add('hidden');
    if (appShell) appShell.classList.remove('hidden');

    this.actualizarHeaderUsuario();
    this.aplicarPermisosRol(user.rol);

    // Inicializar módulos y datos
    this.bindTabNavigation();
    this.actualizarKPIs();
    this.renderAlertasDashboard();

    if (window.TitularesModule) TitularesModule.init();
    if (window.OperacionesModule) OperacionesModule.init();
    if (window.ReportesModule) ReportesModule.init();
    if (window.OperadoresModule) OperadoresModule.init();
    if (window.MangoAnalyzerModule) MangoAnalyzerModule.init();

    // Redirigir a pestaña por defecto del rol
    const tabDefault = AuthService.getPestanaDefault(user.rol);
    this.switchTab(tabDefault);
  },

  actualizarHeaderUsuario() {
    const user = AuthService.getCurrentUser();
    if (!user) return;

    const elNombre = document.getElementById('header-user-nombre');
    const elUser = document.getElementById('header-user-login');
    const elBadge = document.getElementById('header-user-badge');
    const elAvatar = document.getElementById('header-user-avatar');

    if (elNombre) elNombre.textContent = user.nombre;
    if (elUser) elUser.textContent = `@${user.usuario}`;
    if (elBadge) elBadge.innerHTML = AuthService.getRolBadge(user.rol);
    if (elAvatar) elAvatar.src = user.avatar;
  },

  aplicarPermisosRol(rol) {
    const navButtons = document.querySelectorAll('.nav-tab-btn');

    navButtons.forEach(btn => {
      const tabId = btn.getAttribute('data-tab');
      const canAccess = AuthService.canAccessTab(tabId, rol);

      if (canAccess) {
        btn.classList.remove('hidden');
      } else {
        btn.classList.add('hidden');
      }
    });

    // Barra de bienvenida con rol para el operador
    const opBanner = document.getElementById('operador-personal-banner');
    if (opBanner) {
      if (rol === 'operador') {
        opBanner.classList.remove('hidden');
        const user = AuthService.getCurrentUser();
        document.getElementById('op-banner-nombre').textContent = user.nombre;
      } else {
        opBanner.classList.add('hidden');
      }
    }
  },

  bindTabNavigation() {
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    tabButtons.forEach(btn => {
      // Evitar duplicar listeners
      btn.onclick = () => {
        const tabId = btn.getAttribute('data-tab');
        const user = AuthService.getCurrentUser();
        if (user && !AuthService.canAccessTab(tabId, user.rol)) {
          this.showToast('Acceso no autorizado para tu categoría de usuario', 'error');
          return;
        }
        this.switchTab(tabId);
      };
    });
  },

  switchTab(tabId) {
    const user = AuthService.getCurrentUser();
    if (user && !AuthService.canAccessTab(tabId, user.rol)) {
      tabId = AuthService.getPestanaDefault(user.rol);
    }

    this.activeTab = tabId;

    // Actualizar botones del menú
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Actualizar paneles de contenido
    document.querySelectorAll('.tab-pane').forEach(pane => {
      if (pane.id === `tab-${tabId}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // Triggers específicos por pestaña
    if (tabId === 'reportes' && window.ReportesModule) {
      ReportesModule.generarReporte();
    } else if (tabId === 'operadores' && window.OperadoresModule) {
      OperadoresModule.render();
    } else if (tabId === 'titulares' && window.TitularesModule) {
      TitularesModule.renderLista();
    } else if (tabId === 'operaciones' && window.OperacionesModule) {
      OperacionesModule.cambiarOperacion(OperacionesModule.operacionActiva || 'stock');
    } else if (tabId === 'mango' && window.MangoAnalyzerModule) {
      if (MangoAnalyzerModule.datosCrudos.length > 0) {
        MangoAnalyzerModule.renderGraficos();
      }
    } else if (tabId === 'dashboard') {
      this.actualizarKPIs();
      this.renderAlertasDashboard();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  actualizarKPIs() {
    const titulares = StorageService.getTitulares();
    const pagos = StorageService.getPagos();
    const operadores = StorageService.getOperadores();

    // 1. Total Cartera Gestionada
    const totalDeuda = titulares.reduce((sum, t) => sum + (t.deudaTotal || 0), 0);
    const elDeuda = document.getElementById('kpi-total-deuda');
    if (elDeuda) elDeuda.textContent = Formatters.currency(totalDeuda);

    // 2. Total Recuperado (Pagos)
    const totalCobrado = pagos.reduce((sum, p) => sum + (p.monto || 0), 0);
    const elCobrado = document.getElementById('kpi-total-cobrado');
    if (elCobrado) elCobrado.textContent = Formatters.currency(totalCobrado);

    // 3. Promesas del día / Total promesas
    const promesas = titulares.filter(t => t.promesaPago);
    const promesasCumplidas = promesas.filter(t => t.promesaPago.estado === 'cumplida').length;
    const pctEfectividad = promesas.length > 0 ? Math.round((promesasCumplidas / promesas.length) * 100) : 0;
    const elEfectividad = document.getElementById('kpi-efectividad');
    if (elEfectividad) elEfectividad.textContent = `${pctEfectividad}%`;

    // 4. Operadores Conectados
    const operadoresActivos = operadores.filter(o => o.estado !== 'pausa' && o.estado !== 'inactivo').length;
    const elOperadores = document.getElementById('kpi-operadores-activos');
    if (elOperadores) elOperadores.textContent = `${operadoresActivos} / ${operadores.length}`;

    // Meta global
    const metaMes = 4000000;
    const pctAvanceMes = Math.min(100, Math.round((totalCobrado / metaMes) * 100));
    const elBarraMeta = document.getElementById('dash-meta-barra');
    const elTextoMeta = document.getElementById('dash-meta-texto');
    if (elBarraMeta) elBarraMeta.style.width = `${pctAvanceMes}%`;
    if (elTextoMeta) elTextoMeta.textContent = `${pctAvanceMes}% de la meta mensual (${Formatters.currency(metaMes)})`;
  },

  renderAlertasDashboard() {
    const titulares = StorageService.getTitulares();
    const alertContainer = document.getElementById('dash-alertas-container');
    if (!alertContainer) return;

    const alertas = [];
    titulares.forEach(t => {
      if (t.promesaPago && t.promesaPago.estado === 'pendiente') {
        alertas.push({
          tipo: 'pendiente',
          titular: t,
          mensaje: `Promesa pendiente de ${Formatters.currency(t.promesaPago.monto)} para el ${Formatters.date(t.promesaPago.fechaPromesa || t.promesaPago.fecha)}.`
        });
      } else if (t.promesaPago && t.promesaPago.estado === 'caida') {
        alertas.push({
          tipo: 'caida',
          titular: t,
          mensaje: `ALERTA: Compromiso caído de ${Formatters.currency(t.promesaPago.monto)}. Requiere reclamo urgente.`
        });
      }
    });

    if (alertas.length === 0) {
      alertContainer.innerHTML = `
        <div class="p-4 bg-slate-50 text-slate-400 rounded-xl text-xs text-center">
          No hay compromisos pendientes de vencimiento inmediato.
        </div>
      `;
      return;
    }

    alertContainer.innerHTML = alertas.slice(0, 5).map(a => `
      <div class="p-3 rounded-xl border flex items-center justify-between text-xs mb-2 ${
        a.tipo === 'caida' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-amber-50 border-amber-200 text-amber-900'
      }">
        <div class="flex items-center gap-3">
          <i class="fas ${a.tipo === 'caida' ? 'fa-exclamation-triangle text-red-600' : 'fa-bell text-amber-600'} text-base"></i>
          <div>
            <span class="font-bold">${a.titular.nombre} (${a.titular.cuenta})</span>
            <div class="text-[11px] opacity-90">${a.mensaje}</div>
          </div>
        </div>
        <button onclick="App.irAGestionTitular('${a.titular.id}')" 
                class="px-3 py-1 bg-white/80 hover:bg-white text-slate-800 rounded-lg font-bold shadow-sm transition-colors text-[11px]">
          Contactar
        </button>
      </div>
    `).join('');
  },

  irAGestionTitular(titularId) {
    this.switchTab('titulares');
    TitularesModule.seleccionarTitular(titularId);
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `
      <i class="fas ${icon} text-lg"></i>
      <span class="font-medium">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

window.App = App;

// Auto-iniciar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
