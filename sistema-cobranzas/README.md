# CobranzasPro - Sistema Integral de Gestión de Cobranzas y Monitoreo de Operadores

**CobranzasPro** es una aplicación web moderna diseñada para la gestión operativa, financiera, enriquecimiento masivo de datos y supervisión de equipos de cobranza y recupero crediticio.

---

## 🚀 ¿Cómo abrir la aplicación?

No requiere instalación de servidores, Node.js ni bases de datos. 

1. Abre tu explorador de archivos en la carpeta:
   `C:\Users\Evelyn\.gemini\antigravity\scratch\sistema-cobranzas`
2. Haz doble clic en el archivo **`index.html`** (se abrirá automáticamente en Google Chrome, Microsoft Edge o tu navegador predeterminado).
3. ¡Listo! Puedes interactuar con todos los módulos de inmediato.

---

## 📑 Módulos y Pestañas Disponibles

### 1. Dashboard General
- **KPIs en tiempo real**: Total de cartera en mora, montos recuperados, porcentaje de efectividad de promesas de pago y operadores activos.
- **Barra de Progreso**: Cumplimiento de la meta mensual colectiva.
- **Alertas Prioritarias**: Notificaciones de compromisos de pago del día y alertas de promesas caídas para reclamo urgente.
- **Accesos Rápidos**: Atajos directos para buscar titulares, generar reportes o supervisar operadores.

### 2. Titulares y Cobranzas
- **Buscador Inteligente Multinivel**: Búsqueda instantánea en tiempo real por Nombre, DNI/CUIT, Teléfono o Número de Cuenta.
- **Filtros Avanzados**: Filtrado por tramos de mora (Al día, 1-30 días, 31-60 días, 61-90 días, Judicial) y por operador asignado.
- **Ficha Integral del Deudor**:
  - **Teléfonos y Contactos**: Lista de teléfonos registrados (principal y alternativos cargados masivamente), con botón de llamada directa y botón de WhatsApp individual para cada número.
  - **Datos Laborales**: Tarjeta con nombre del empleador/empresa, CUIT empleador, cargo, teléfono laboral y sueldo estimado.
  - **Correos Electrónicos**: Emails personales y laborales.
  - **Desglose financiero**: Capital original, intereses compensatorios, recargos/gastos y saldo exigible total.
  - **Vencimientos**: Días de atraso y fecha de último pago registrado.
  - **Historial cronológico de gestiones**: Línea de tiempo con todas las llamadas, compromisos y cobros.
- **Acciones Directas**:
  - **WhatsApp Directo**: Abre WhatsApp Web con mensaje personalizado de cobranza ya redactado con los datos de la deuda.
  - **Llamada Telefónica**: Enlace de discado directo.
  - **Registrar Gestión**: Modal para ingresar resultado del contacto y registrar promesas con fecha y monto.
  - **Registrar Pago**: Modal para registrar cobranzas parciales o totales con emisión de **recibo imprimible** y comprobante oficial.
  - **Reasignar Operador**: Permite transferir la cuenta a otro cobrador del equipo con un clic.

### 3. Operaciones (Cargas Masivas y Procesamiento por Lotes)
Módulo especializado para la ingesta y enriquecimiento masivo de bases de datos desde archivos CSV o copiando celdas directamente de Excel:
1. **Carga de Stock de Carteras**: Importación masiva de nuevos deudores o actualización de cuentas y deudas.
2. **Carga de Gestiones Masivas**: Ingesta en lote de gestiones telefónicas, SMS, IVR o campañas externas asociadas por DNI con resultado y fecha.
3. **Carga de Teléfonos**: Enriquecimiento masivo de números de contacto por DNI (celulares, fijos, laborales, familiares).
4. **Carga de Mails**: Enriquecimiento de correos electrónicos adicionales vinculados por DNI.
5. **Carga de Datos Laborales**: Carga masiva de empleador, CUIT de la empresa, cargo, teléfono laboral y sueldo estimado por DNI.

*Cada sub-operación incluye:*
- Descarga de plantilla CSV compatible con Excel.
- Botón de carga de datos de ejemplo para pruebas rápidas.
- Previsualización y validación automática de registros antes de confirmar la importación.

### 4. Reportes y Estadísticas
- **Reporte de Compromisos y Promesas de Pago**:
  Diseñado específicamente con las columnas requeridas:
  - **Fecha en que se realizó la gestión**: Cuándo se habló con el titular.
  - **Fecha Promesa Pactada**: Día pactado límite para realizar el pago.
  - **Operador que Gestionó**: Nombre del cobrador que cerró el acuerdo.
  - **Monto Arreglado**: Importe de la promesa de pago acordado.
  - **Titular, DNI y Cuenta**: Identificación completa.
  - **Deuda Total y Estado**: Pendiente, Cumplida o Caída.
  - **Totalizador**: Sumatoria del monto total arreglado en promesas.
- **Otros Reportes**:
  - *Recaudación y Cobros*: Detalle de transacciones, métodos de pago, operadores y comprobantes.
  - *Antigüedad de Cartera (Aging)*: Concentración de deuda por tramo de mora.
  - *Rendimiento por Operador*: Productividad, llamadas, promesas y recaudación individual vs meta.
- **Visualizaciones Gráficas**: Gráficos interactivos de barra y donut con Chart.js.
- **Exportación**:
  - Botón **Exportar a Excel (CSV)** con codificación UTF-8 compatible con Microsoft Excel en español.
  - Botón **Imprimir / Guardar en PDF**.

### 5. Monitoreo de Operadores (Panel de Supervisión)
- **Matriz de Operadores en Vivo**:
  - Estado en tiempo real: 🟢 *Disponible*, 🔴 *En Llamada*, 🔵 *En Gestión*, 🟡 *Pausa*.
  - Titular y cuenta que cada operador está contactando en este momento.
  - Cronómetro del tiempo transcurrido en el estado actual.
- **Productividad del Día**: Llamadas realizadas hoy, promesas conseguidas, tasa de efectividad (%) y monto recuperado frente a la meta diaria individual con barra de progreso.
- **Ranking de Cobradores**: Podio con medallas de los mejores recaudadores de la jornada.
- **Simulación en Vivo**: Botón para activar un simulador que actualiza estados y suma llamadas automáticamente para demostraciones y monitoreo dinámico.

### 6. Analizador Mango CRM (Auditoría & Rendimiento de Operadores)
Módulo especializado para procesar y auditar archivos exportados desde **CRM Mango** (`negociatudeuda.com.ar`):
- **Carga de Archivos Excel (.xlsx, .xls) y CSV**: Ingesta y lectura local en el navegador mediante SheetJS sin intermediación de servidores externos.
- **Botón Demo 1-Clic**: Permite cargar una muestra idéntica a la vista oficial de Mango CRM para demostraciones instantáneas.
- **Indicadores en qué mejorar los datos (Auditoría de Calidad)**:
  - *Score de Calidad (0 a 100)*: Diagnóstico general y por operador.
  - *Gestiones sin notas / notas escuetas*: Detección de observaciones vacías o genéricas (*"Observacion corta"*).
  - *Promesas sin monto ni fecha*: Identificación de acuerdos registrados sin respaldo monetario o sin fecha de próxima acción.
  - *Sobre-gestión / Quema de base*: Alerta de DNIs llamados más de 3 veces el mismo día.
  - *Sub-gestión*: Detección de cuentas abandonadas tras un único intento fallido.
  - *Desbalance de canales*: Detección de operadores que no utilizan canales alternativos (WhatsApp / llamadas).
- **Métricas de Operadores**:
  - Total de gestiones realizadas.
  - DNIs únicos tocados e intensidad (toques/DNI).
  - Tasa de contactabilidad y efectividad de promesas (conversión global y sobre contactados).
  - Monto total prometido ($) y ticket promedio.
- **Trazabilidad Exhaustiva de DNIs Tocados por Operador**:
  - Selector individual para ver la lista completa de todos los DNIs trabajados por un operador.
  - Búsqueda en vivo por DNI o Titular, filtros por resultado y enlace directo a la ficha del CRM en Mango.
  - Exportación de la lista de DNIs del operador a Excel.
  - **Buscador Universal de DNI**: Historial cronológico de cualquier DNI en la base para verificar si varios cobradores se pisaron la gestión.

---

## ⚡ Herramienta Standalone: `analizador-mango.html`
Si deseas abrir **únicamente** la herramienta de análisis de Mango CRM sin pasar por el inicio de sesión ni los otros módulos de CobranzasPro:
1. Haz doble clic en el archivo **`analizador-mango.html`**.
2. ¡Listo! Puedes arrastrar tu archivo Excel de Mango o presionar el botón de prueba en 1 clic.

---

## 💾 Persistencia de Datos (LocalStorage)

Todos los registros que crees (nuevas gestiones, compromisos de pago, cobros, cargas masivas de stock, teléfonos o datos laborales) se guardan en el almacenamiento local de tu navegador (`localStorage`). 
Si deseas volver a los datos de prueba iniciales, simplemente presiona el botón **"Reiniciar Demo"** ubicado en la barra superior derecha.
