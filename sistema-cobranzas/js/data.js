// Base de datos inicial para CobranzasPro
window.INITIAL_DATA = {
  operadores: [
    {
      id: 'OP01',
      nombre: 'Carlos Martínez',
      email: 'carlos.m@cobranzaspro.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      estado: 'en_llamada',
      titularActual: 'Juan Pérez (DNI: 32.415.890)',
      llamadasHoy: 42,
      promesasHoy: 7,
      recaudadoHoy: 345000,
      metaDiaria: 400000,
      efectividad: 68,
      tiempoEstado: '08:24'
    },
    {
      id: 'OP02',
      nombre: 'Lucía Fernández',
      email: 'lucia.f@cobranzaspro.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      estado: 'disponible',
      titularActual: 'Esperando asignación',
      llamadasHoy: 56,
      promesasHoy: 11,
      recaudadoHoy: 512000,
      metaDiaria: 400000,
      efectividad: 82,
      tiempoEstado: '02:15'
    },
    {
      id: 'OP03',
      nombre: 'Martín Romero',
      email: 'martin.r@cobranzaspro.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      estado: 'gestionando',
      titularActual: 'Distribuidora Norte SRL (CUIT: 30-71234567-8)',
      llamadasHoy: 31,
      promesasHoy: 4,
      recaudadoHoy: 190000,
      metaDiaria: 400000,
      efectividad: 54,
      tiempoEstado: '14:40'
    },
    {
      id: 'OP04',
      nombre: 'Valentina Soto',
      email: 'valentina.s@cobranzaspro.com',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      estado: 'en_llamada',
      titularActual: 'Roberto Gómez (DNI: 28.910.455)',
      llamadasHoy: 48,
      promesasHoy: 9,
      recaudadoHoy: 430000,
      metaDiaria: 400000,
      efectividad: 75,
      tiempoEstado: '05:10'
    },
    {
      id: 'OP05',
      nombre: 'Esteban Morales',
      email: 'esteban.m@cobranzaspro.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      estado: 'pausa',
      titularActual: 'En refrigerio',
      llamadasHoy: 27,
      promesasHoy: 3,
      recaudadoHoy: 140000,
      metaDiaria: 400000,
      efectividad: 48,
      tiempoEstado: '21:05'
    }
  ],

  titulares: [
    {
      id: 'TIT-1001',
      nombre: 'Juan Ignacio Pérez',
      dni: '32415890',
      telefono: '+5491145892301',
      telefonosAdicionales: [
        { numero: '+5491149982311', tipo: 'Laboral', observacion: 'Directo oficina' },
        { numero: '+5491133091144', tipo: 'Familiar', observacion: 'Cónyuge' }
      ],
      email: 'juan.perez@email.com',
      emailsAdicionales: [
        { email: 'jperez@logisticalatina.com', tipo: 'Laboral' }
      ],
      direccion: 'Av. Corrientes 2450, Piso 4 B, CABA',
      datosLaborales: {
        empleador: 'Logística Latina SA',
        cuitEmpleador: '30-68112233-4',
        cargo: 'Jefe de Depósito y Despacho',
        telefonoLaboral: '+5491149982311',
        sueldoEstimado: 850000
      },
      cuenta: 'CTA-8849-01',
      entidad: 'Banco Metropolitano',
      producto: 'Préstamo Personal',
      deudaTotal: 185000,
      capital: 140000,
      intereses: 32000,
      gastos: 13000,
      diasMora: 45,
      tramoMora: 'mora_31_60',
      fechaVencimiento: '2026-07-20',
      ultimoPago: { fecha: '2026-06-15', monto: 35000 },
      operadorId: 'OP01',
      estadoGestion: 'compromiso_pago',
      promesaPago: {
        monto: 90000,
        fechaGestion: '2026-09-04 11:30',
        fechaPromesa: '2026-09-08',
        operador: 'Carlos Martínez',
        estado: 'pendiente'
      },
      gestiones: [
        {
          id: 'G-01',
          fecha: '2026-09-04 11:30',
          operador: 'Carlos Martínez',
          canal: 'Llamada telefónica',
          resultado: 'Compromiso de Pago',
          observaciones: 'El titular se compromete a transferir $90.000 el día 08/09. Solicita que no se envíe aviso judicial.'
        },
        {
          id: 'G-02',
          fecha: '2026-08-28 16:15',
          operador: 'Carlos Martínez',
          canal: 'WhatsApp',
          resultado: 'Mensaje leído sin respuesta',
          observaciones: 'Se envió recordatorio con liquidación actualizada y link de pago.'
        }
      ]
    },
    {
      id: 'TIT-1002',
      nombre: 'Distribuidora Norte SRL',
      dni: '30-71234567-8',
      telefono: '+5491158229910',
      telefonosAdicionales: [
        { numero: '+5491147881020', tipo: 'Fijo Empresa', observacion: 'Conmutador Central' }
      ],
      email: 'finanzas@distribuidoranorte.com',
      emailsAdicionales: [
        { email: 'gerencia@distribuidoranorte.com', tipo: 'Corporativo' }
      ],
      direccion: 'Ruta 8 Km 54, Parque Industrial Pilar',
      datosLaborales: {
        empleador: 'Distribuidora Norte SRL',
        cuitEmpleador: '30-71234567-8',
        cargo: 'Persona Jurídica / Comercio',
        telefonoLaboral: '+5491147881020',
        sueldoEstimado: 0
      },
      cuenta: 'CTA-5520-99',
      entidad: 'Comercial Financiera',
      producto: 'Línea de Crédito Comercial',
      deudaTotal: 1250000,
      capital: 1000000,
      intereses: 180000,
      gastos: 70000,
      diasMora: 88,
      tramoMora: 'mora_61_90',
      fechaVencimiento: '2026-06-08',
      ultimoPago: { fecha: '2026-05-10', monto: 200000 },
      operadorId: 'OP03',
      estadoGestion: 'en_negociacion',
      promesaPago: null,
      gestiones: [
        {
          id: 'G-03',
          fecha: '2026-09-05 14:10',
          operador: 'Martín Romero',
          canal: 'Llamada telefónica',
          resultado: 'En negociación con Gerente',
          observaciones: 'Conversé con el Lic. Rossi. Proponen entregar 3 cheques diferidos por $400.000 c/u. Se eleva a supervisor.'
        }
      ]
    },
    {
      id: 'TIT-1003',
      nombre: 'Roberto Carlos Gómez',
      dni: '28910455',
      telefono: '+5491133445566',
      telefonosAdicionales: [],
      email: 'roberto.gomez@gmail.com',
      emailsAdicionales: [],
      direccion: 'Calle San Martín 892, Morón, Buenos Aires',
      datosLaborales: {
        empleador: 'Talleres Metalúrgicos Morón',
        cuitEmpleador: '30-55998811-2',
        cargo: 'Operario Especializado',
        telefonoLaboral: '+5491146298800',
        sueldoEstimado: 620000
      },
      cuenta: 'CTA-1092-44',
      entidad: 'Tarjeta Dorada',
      producto: 'Tarjeta de Crédito',
      deudaTotal: 94500,
      capital: 75000,
      intereses: 14500,
      gastos: 5000,
      diasMora: 22,
      tramoMora: 'mora_1_30',
      fechaVencimiento: '2026-08-14',
      ultimoPago: { fecha: '2026-07-14', monto: 18000 },
      operadorId: 'OP04',
      estadoGestion: 'compromiso_pago',
      promesaPago: {
        monto: 94500,
        fechaGestion: '2026-09-02 09:20',
        fechaPromesa: '2026-09-05',
        operador: 'Valentina Soto',
        estado: 'cumplida'
      },
      gestiones: [
        {
          id: 'G-04',
          fecha: '2026-09-05 10:15',
          operador: 'Valentina Soto',
          canal: 'Llamada telefónica',
          resultado: 'Pago Registrado',
          observaciones: 'El titular envió comprobante de transferencia bancaria por cancelación total de $94.500.'
        }
      ]
    },
    {
      id: 'TIT-1004',
      nombre: 'Mariana Soledad Díaz',
      dni: '36789123',
      telefono: '+5491167884433',
      telefonosAdicionales: [],
      email: 'mariana.diaz88@hotmail.com',
      emailsAdicionales: [],
      direccion: 'Av. Belgrano 1130, Avellaneda',
      datosLaborales: {
        empleador: 'Independiente / Sin Empleo Fijo',
        cuitEmpleador: '27-36789123-4',
        cargo: 'Comercio Informal',
        telefonoLaboral: '-',
        sueldoEstimado: 250000
      },
      cuenta: 'CTA-9021-12',
      entidad: 'Banco Metropolitano',
      producto: 'Préstamo Automotor',
      deudaTotal: 420000,
      capital: 350000,
      intereses: 55000,
      gastos: 15000,
      diasMora: 115,
      tramoMora: 'judicial',
      fechaVencimiento: '2026-05-12',
      ultimoPago: { fecha: '2026-04-10', monto: 45000 },
      operadorId: 'OP02',
      estadoGestion: 'negativa',
      promesaPago: null,
      gestiones: [
        {
          id: 'G-05',
          fecha: '2026-09-02 09:40',
          operador: 'Lucía Fernández',
          canal: 'Llamada telefónica',
          resultado: 'Negativa de Pago',
          observaciones: 'Refiere encontrarse sin empleo y rechaza plan de quita del 20%. Se sugiere pasar a intimación letrada.'
        }
      ]
    },
    {
      id: 'TIT-1005',
      nombre: 'Estudio Jurídico Albarracín & Asoc.',
      dni: '30-65489122-3',
      telefono: '+5491148721100',
      telefonosAdicionales: [
        { numero: '+5491148721101', tipo: 'Fijo Estudio', observacion: 'Mesa de entradas' }
      ],
      email: 'administracion@albarracin.com.ar',
      emailsAdicionales: [],
      direccion: 'Lavalle 1420, Piso 9, CABA',
      datosLaborales: {
        empleador: 'Estudio Jurídico Albarracín & Asoc.',
        cuitEmpleador: '30-65489122-3',
        cargo: 'Estudio Profesional',
        telefonoLaboral: '+5491148721100',
        sueldoEstimado: 1200000
      },
      cuenta: 'CTA-3319-87',
      entidad: 'Comercial Financiera',
      producto: 'Cuenta Corriente Especial',
      deudaTotal: 310000,
      capital: 260000,
      intereses: 38000,
      gastos: 12000,
      diasMora: 18,
      tramoMora: 'mora_1_30',
      fechaVencimiento: '2026-08-18',
      ultimoPago: { fecha: '2026-07-20', monto: 120000 },
      operadorId: 'OP02',
      estadoGestion: 'compromiso_pago',
      promesaPago: {
        monto: 310000,
        fechaGestion: '2026-09-04 15:20',
        fechaPromesa: '2026-09-10',
        operador: 'Lucía Fernández',
        estado: 'pendiente'
      },
      gestiones: [
        {
          id: 'G-06',
          fecha: '2026-09-04 15:20',
          operador: 'Lucía Fernández',
          canal: 'WhatsApp',
          resultado: 'Compromiso de Pago',
          observaciones: 'Dra. Albarracín confirma que el 10/09 cobran honorarios y cancelan la totalidad.'
        }
      ]
    },
    {
      id: 'TIT-1007',
      nombre: 'Florencia Antonella Rivas',
      dni: '38901234',
      telefono: '+5491165432109',
      telefonosAdicionales: [],
      email: 'flor.rivas.moda@gmail.com',
      emailsAdicionales: [],
      direccion: 'Gascón 1205, Palermo, CABA',
      datosLaborales: {
        empleador: 'Boutique Palermo Chic',
        cuitEmpleador: '27-38901234-8',
        cargo: 'Encargada de Local',
        telefonoLaboral: '+5491148665544',
        sueldoEstimado: 580000
      },
      cuenta: 'CTA-4491-30',
      entidad: 'Banco Metropolitano',
      producto: 'Préstamo Personal',
      deudaTotal: 156000,
      capital: 120000,
      intereses: 26000,
      gastos: 10000,
      diasMora: 12,
      tramoMora: 'mora_1_30',
      fechaVencimiento: '2026-08-24',
      ultimoPago: { fecha: '2026-07-24', monto: 25000 },
      operadorId: 'OP04',
      estadoGestion: 'acuerdo',
      promesaPago: {
        monto: 78000,
        fechaGestion: '2026-09-05 11:00',
        fechaPromesa: '2026-09-06',
        operador: 'Valentina Soto',
        estado: 'pendiente'
      },
      gestiones: [
        {
          id: 'G-08',
          fecha: '2026-09-05 11:00',
          operador: 'Valentina Soto',
          canal: 'Llamada telefónica',
          resultado: 'Plan de 2 Cuotas Acordado',
          observaciones: 'Aceptó refinanciación en 2 pagos de $78.000. Primer vencimiento mañana 06/09.'
        }
      ]
    },
    {
      id: 'TIT-1008',
      nombre: 'Claudio Marcelo Benítez',
      dni: '25410988',
      telefono: '+5491122334455',
      telefonosAdicionales: [],
      email: 'cbenitez.transportes@gmail.com',
      emailsAdicionales: [],
      direccion: 'Camino de Cintura 3400, San Justo',
      datosLaborales: {
        empleador: 'Transportes Benítez & Hijos',
        cuitEmpleador: '20-25410988-3',
        cargo: 'Titular / Chofer',
        telefonoLaboral: '+5491144887711',
        sueldoEstimado: 750000
      },
      cuenta: 'CTA-9902-88',
      entidad: 'Comercial Financiera',
      producto: 'Leasing de Camiones',
      deudaTotal: 890000,
      capital: 750000,
      intereses: 105000,
      gastos: 35000,
      diasMora: 75,
      tramoMora: 'mora_61_90',
      fechaVencimiento: '2026-06-21',
      ultimoPago: { fecha: '2026-05-18', monto: 110000 },
      operadorId: 'OP05',
      estadoGestion: 'compromiso_pago',
      promesaPago: {
        monto: 300000,
        fechaGestion: '2026-08-29 10:00',
        fechaPromesa: '2026-09-05',
        operador: 'Esteban Morales',
        estado: 'caida'
      },
      gestiones: [
        {
          id: 'G-09',
          fecha: '2026-08-29 10:00',
          operador: 'Esteban Morales',
          canal: 'Llamada telefónica',
          resultado: 'Promesa Caída',
          observaciones: 'Se comprometió para el 05/09 por $300.000 pero no ingresó el pago. Requiere reclamo urgente.'
        }
      ]
    },
    {
      id: 'TIT-1010',
      nombre: 'Agropecuaria El Ombú SA',
      dni: '30-58992144-7',
      telefono: '+5491177889900',
      telefonosAdicionales: [],
      email: 'cobranzas@elombuagro.com.ar',
      emailsAdicionales: [],
      direccion: 'Acceso Oeste Km 45, Moreno',
      datosLaborales: {
        empleador: 'Agropecuaria El Ombú SA',
        cuitEmpleador: '30-58992144-7',
        cargo: 'Producción Agrícola',
        telefonoLaboral: '+5491177889900',
        sueldoEstimado: 2500000
      },
      cuenta: 'CTA-1120-76',
      entidad: 'Banco Metropolitano',
      producto: 'Warrant Agrícola',
      deudaTotal: 2150000,
      capital: 1800000,
      intereses: 250000,
      gastos: 100000,
      diasMora: 140,
      tramoMora: 'judicial',
      fechaVencimiento: '2026-04-18',
      ultimoPago: { fecha: '2026-03-15', monto: 350000 },
      operadorId: 'OP03',
      estadoGestion: 'compromiso_pago',
      promesaPago: {
        monto: 600000,
        fechaGestion: '2026-09-04 12:00',
        fechaPromesa: '2026-09-12',
        operador: 'Martín Romero',
        estado: 'pendiente'
      },
      gestiones: [
        {
          id: 'G-10',
          fecha: '2026-09-04 12:00',
          operador: 'Martín Romero',
          canal: 'Visita / Reunión presencial',
          resultado: 'Compromiso de Pago',
          observaciones: 'Reunión con el apoderado legal. Firman compromiso de entrega de $600.000 el 12/09 con liquidación de cosecha.'
        }
      ]
    },
    {
      id: 'TIT-1012',
      nombre: 'Laura Marcela Toledo',
      dni: '35890112',
      telefono: '+5491188776655',
      telefonosAdicionales: [],
      email: 'lau.toledo@gmail.com',
      emailsAdicionales: [],
      direccion: 'Alberti 1430, Mar del Plata',
      datosLaborales: {
        empleador: 'Clínica Mar del Plata',
        cuitEmpleador: '30-61223344-9',
        cargo: 'Enfermera Universitaria',
        telefonoLaboral: '+5492234901122',
        sueldoEstimado: 720000
      },
      cuenta: 'CTA-2244-90',
      entidad: 'Banco Metropolitano',
      producto: 'Préstamo Personal',
      deudaTotal: 230000,
      capital: 190000,
      intereses: 30000,
      gastos: 10000,
      diasMora: 29,
      tramoMora: 'mora_1_30',
      fechaVencimiento: '2026-08-07',
      ultimoPago: { fecha: '2026-07-05', monto: 32000 },
      operadorId: 'OP04',
      estadoGestion: 'compromiso_pago',
      promesaPago: {
        monto: 115000,
        fechaGestion: '2026-09-03 14:30',
        fechaPromesa: '2026-09-07',
        operador: 'Valentina Soto',
        estado: 'pendiente'
      },
      gestiones: [
        {
          id: 'G-11',
          fecha: '2026-09-03 14:30',
          operador: 'Valentina Soto',
          canal: 'Llamada telefónica',
          resultado: 'Compromiso de Pago',
          observaciones: 'Indica que cobra el sueldo y transfiere el 50% de la deuda el lunes 07/09.'
        }
      ]
    }
  ],

  pagos: [
    {
      id: 'PAG-5001',
      titularId: 'TIT-1003',
      titularNombre: 'Roberto Carlos Gómez',
      monto: 94500,
      fecha: '2026-09-05 10:15',
      metodo: 'Transferencia Bancaria',
      operador: 'Valentina Soto',
      comprobante: 'TR-994821',
      concepto: 'Cancelación Total de Deuda'
    },
    {
      id: 'PAG-5002',
      titularId: 'TIT-1001',
      titularNombre: 'Juan Ignacio Pérez',
      monto: 35000,
      fecha: '2026-09-04 16:30',
      metodo: 'Mercado Pago / QR',
      operador: 'Carlos Martínez',
      comprobante: 'MP-881293',
      concepto: 'Pago a cuenta de intereses'
    },
    {
      id: 'PAG-5003',
      titularId: 'TIT-1005',
      titularNombre: 'Estudio Jurídico Albarracín & Asoc.',
      monto: 120000,
      fecha: '2026-09-03 11:20',
      metodo: 'Transferencia Bancaria',
      operador: 'Lucía Fernández',
      comprobante: 'TR-440219',
      concepto: 'Pago Parcial Cuota 1'
    },
    {
      id: 'PAG-5004',
      titularId: 'TIT-1007',
      titularNombre: 'Florencia Antonella Rivas',
      monto: 25000,
      fecha: '2026-09-02 14:45',
      metodo: 'Tarjeta de Débito',
      operador: 'Valentina Soto',
      comprobante: 'TD-331002',
      concepto: 'Refinanciación / Cuota inicial'
    },
    {
      id: 'PAG-5005',
      titularId: 'TIT-1002',
      titularNombre: 'Distribuidora Norte SRL',
      monto: 200000,
      fecha: '2026-09-01 09:30',
      metodo: 'Cheque Electrónico ECHEQ',
      operador: 'Martín Romero',
      comprobante: 'ECH-00192',
      concepto: 'Entrega por acuerdo de pago'
    }
  ]
};
