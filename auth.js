// Módulo de Autenticación y Control de Acceso basado en Roles (RBAC)
const AUTH_STORAGE_KEYS = {
  SESSION: 'cobranzaspro_sesion_activa',
  USUARIOS: 'cobranzaspro_usuarios_db'
};

const AuthService = {
  // Usuarios iniciales predefinidos con formato simple nombre.apellido
  usuariosDefault: [
    {
      id: 'USR-01',
      usuario: 'roberto.valdez',
      nombre: 'Roberto Valdez',
      password: '123',
      rol: 'gerente', // 'gerente', 'supervisor', 'operador', 'backoffice'
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      estado: 'activo'
    },
    {
      id: 'USR-02',
      usuario: 'laura.menendez',
      nombre: 'Laura Menéndez',
      password: '123',
      rol: 'supervisor',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      estado: 'activo'
    },
    {
      id: 'USR-03',
      usuario: 'carlos.martinez',
      nombre: 'Carlos Martínez',
      password: '123',
      rol: 'operador',
      operadorId: 'OP01',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      estado: 'activo'
    },
    {
      id: 'USR-04',
      usuario: 'lucia.fernandez',
      nombre: 'Lucía Fernández',
      password: '123',
      rol: 'operador',
      operadorId: 'OP02',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      estado: 'activo'
    },
    {
      id: 'USR-05',
      usuario: 'marcos.cesare',
      nombre: 'Marcos Cesare',
      password: '123',
      rol: 'backoffice',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      estado: 'activo'
    }
  ],

  init() {
    if (!localStorage.getItem(AUTH_STORAGE_KEYS.USUARIOS)) {
      localStorage.setItem(AUTH_STORAGE_KEYS.USUARIOS, JSON.stringify(this.usuariosDefault));
    }
  },

  getUsuarios() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEYS.USUARIOS)) || this.usuariosDefault;
    } catch (e) {
      console.error('Error al cargar usuarios:', e);
      return this.usuariosDefault;
    }
  },

  saveUsuarios(usuarios) {
    localStorage.setItem(AUTH_STORAGE_KEYS.USUARIOS, JSON.stringify(usuarios));
  },

  getCurrentUser() {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEYS.SESSION);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  login(usuarioInput, passwordInput) {
    const usuarios = this.getUsuarios();
    const cleanUser = usuarioInput.trim().toLowerCase();

    const user = usuarios.find(u => 
      (u.usuario.toLowerCase() === cleanUser || (u.email && u.email.toLowerCase() === cleanUser)) && 
      u.password === passwordInput
    );

    if (user) {
      if (user.estado === 'inactivo') {
        return { success: false, message: 'El usuario se encuentra inactivo. Consulte al administrador.' };
      }
      localStorage.setItem(AUTH_STORAGE_KEYS.SESSION, JSON.stringify(user));
      return { success: true, user };
    }

    return { success: false, message: 'Usuario o contraseña incorrectos. Recuerde el formato tipo nombre.apellido (ej: roberto.valdez).' };
  },

  loginRapido(rol) {
    const usuarios = this.getUsuarios();
    const user = usuarios.find(u => u.rol === rol && u.estado !== 'inactivo');
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEYS.SESSION, JSON.stringify(user));
      return { success: true, user };
    }
    return { success: false, message: `No hay usuario disponible con rol ${rol}` };
  },

  logout() {
    localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
    location.reload();
  },

  // Matriz de permisos por rol
  canAccessTab(tabId, userRole) {
    if (!userRole) return false;

    // Gerente tiene acceso total a todo
    if (userRole === 'gerente') return true;

    // Supervisor: Dashboard, Titulares, Reportes, Operadores, Mango CRM
    if (userRole === 'supervisor') {
      return ['dashboard', 'titulares', 'reportes', 'operadores', 'mango'].includes(tabId);
    }

    // Operador: Exclusivamente Titulares y Cobranzas
    if (userRole === 'operador') {
      return ['titulares'].includes(tabId);
    }

    // Backoffice: Operaciones (Cargas masivas & usuarios), Titulares y Mango CRM
    if (userRole === 'backoffice') {
      return ['operaciones', 'titulares', 'mango'].includes(tabId);
    }

    return false;
  },

  getPestanaDefault(userRole) {
    switch (userRole) {
      case 'operador':
        return 'titulares';
      case 'backoffice':
        return 'operaciones';
      case 'supervisor':
      case 'gerente':
      default:
        return 'dashboard';
    }
  },

  // CRUD de usuarios
  crearUsuario(data) {
    const usuarios = this.getUsuarios();
    const cleanUser = (data.usuario || '').trim().toLowerCase();

    if (usuarios.some(u => u.usuario.toLowerCase() === cleanUser)) {
      return { success: false, message: 'El usuario ya existe. Elija otro nombre.apellido' };
    }

    const nuevo = {
      id: 'USR-' + Math.floor(1000 + Math.random() * 9000),
      usuario: cleanUser,
      nombre: data.nombre.trim(),
      password: data.password || '123',
      rol: data.rol || 'operador',
      avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      estado: data.estado || 'activo'
    };

    usuarios.push(nuevo);
    this.saveUsuarios(usuarios);

    // Si es operador, registrarlo también en la lista de operadores del call center
    if (nuevo.rol === 'operador' && window.StorageService) {
      const operadores = StorageService.getOperadores();
      if (!operadores.some(o => o.nombre.toLowerCase() === nuevo.nombre.toLowerCase())) {
        operadores.push({
          id: 'OP-' + Math.floor(100 + Math.random() * 900),
          nombre: nuevo.nombre,
          email: `${nuevo.usuario}@cobranzaspro.com`,
          avatar: nuevo.avatar,
          estado: 'disponible',
          titularActual: 'Listo para asignación',
          llamadasHoy: 0,
          promesasHoy: 0,
          recaudadoHoy: 0,
          metaDiaria: 400000,
          efectividad: 0,
          tiempoEstado: '00:00'
        });
        StorageService.saveOperadores(operadores);
      }
    }

    return { success: true, usuario: nuevo };
  },

  editarUsuario(id, data) {
    const usuarios = this.getUsuarios();
    const idx = usuarios.findIndex(u => u.id === id);
    if (idx === -1) return { success: false, message: 'Usuario no encontrado' };

    const cleanUser = (data.usuario || '').trim().toLowerCase();
    // Validar duplicados si cambió el username
    if (usuarios.some(u => u.id !== id && u.usuario.toLowerCase() === cleanUser)) {
      return { success: false, message: 'El nombre de usuario ya está en uso por otro agente' };
    }

    usuarios[idx].usuario = cleanUser;
    usuarios[idx].nombre = data.nombre.trim();
    usuarios[idx].rol = data.rol;
    if (data.password) usuarios[idx].password = data.password;
    if (data.avatar) usuarios[idx].avatar = data.avatar;
    if (data.estado) usuarios[idx].estado = data.estado;

    this.saveUsuarios(usuarios);

    // Si editamos el usuario actual en sesión, actualizar sesión
    const sesion = this.getCurrentUser();
    if (sesion && sesion.id === id) {
      localStorage.setItem(AUTH_STORAGE_KEYS.SESSION, JSON.stringify(usuarios[idx]));
    }

    return { success: true, usuario: usuarios[idx] };
  },

  eliminarUsuario(id) {
    const sesion = this.getCurrentUser();
    if (sesion && sesion.id === id) {
      return { success: false, message: 'No puedes eliminar tu propio usuario en sesión activa' };
    }

    let usuarios = this.getUsuarios();
    usuarios = usuarios.filter(u => u.id !== id);
    this.saveUsuarios(usuarios);
    return { success: true };
  },

  getRolBadge(rol) {
    switch (rol) {
      case 'gerente':
        return '<span class="badge badge-purple"><i class="fas fa-crown mr-1"></i> Gerente</span>';
      case 'supervisor':
        return '<span class="badge badge-blue"><i class="fas fa-shield-alt mr-1"></i> Supervisor</span>';
      case 'operador':
        return '<span class="badge badge-success"><i class="fas fa-headset mr-1"></i> Operador</span>';
      case 'backoffice':
        return '<span class="badge badge-orange"><i class="fas fa-database mr-1"></i> Backoffice</span>';
      default:
        return '<span class="badge badge-slate">' + rol + '</span>';
    }
  }
};

window.AuthService = AuthService;
