/** Etiquetas de visualización para cada estado (template literals + objetos). */
const ESTADOS = { pendiente: 'Pendiente', 'en-progreso': 'En progreso', completada: 'Completada' };

/** Orden en que se ciclan los estados al hacer clic. */
const ORDEN_ESTADOS = ['pendiente', 'en-progreso', 'completada'];

/**
 * Normaliza una tarea cruda de la API (DummyJSON, traducidas al español)
 * al formato interno. Aplica destructuring y arrow functions (Requerimiento 2).
 */
const desdeApiTodo = ({ id, title, completed }) => ({
  id: `api-${id}`,
  descripcion: title,
  estado: completed ? 'completada' : 'pendiente',
  fechaCreacion: new Date(),
});

/**
 * Controlador principal de la aplicación.
 * Requerimiento 3: eventos y manipulación del DOM.
 * Requerimiento 4: asincronía (setTimeout / setInterval).
 */
class TaskFlowApp {
  constructor() {
    this.gestor = new GestorTareas();
    this.storage = new StorageService();
    this.filtro = '';

    this.refs = {
      form: document.querySelector('#form-tarea'),
      descripcion: document.querySelector('#descripcion'),
      fechaLimite: document.querySelector('#fechaLimite'),
      btnAgregar: document.querySelector('#btn-agregar'),
      buscador: document.querySelector('#buscador'),
      lista: document.querySelector('#lista-tareas'),
      vacio: document.querySelector('#vacio'),
      resumen: document.querySelector('#resumen'),
      notificaciones: document.querySelector('#notificaciones'),
      btnNotificacion: document.querySelector('#btn-notificacion'),
      btnCargarApi: document.querySelector('#btn-cargar-api'),
      btnGuardarApi: document.querySelector('#btn-guardar-api'),
      btnLimpiar: document.querySelector('#btn-limpiar'),
    };

    this.init();
  }

  init() {
    this.cargarTareasGuardadas();
    this.bindEventos();
    this.renderizar();
    this.actualizarBotonAgregar();
    // Contador regresivo: actualiza cada segundo las tareas con fecha límite.
    setInterval(() => this.actualizarContadores(), 1000);
  }

  /* ---------------- Eventos ---------------- */

  bindEventos() {
    const { form, descripcion, buscador, lista, btnNotificacion, btnCargarApi, btnGuardarApi, btnLimpiar } = this.refs;

    form.addEventListener('submit', (evento) => this.manejarSubmit(evento));
    descripcion.addEventListener('keyup', () => this.actualizarBotonAgregar());
    buscador.addEventListener('keyup', () => this.filtrarYRenderizar());
    lista.addEventListener('click', (evento) => this.manejarClickLista(evento));
    lista.addEventListener('mouseover', (evento) => this.manejarMouseover(evento));
    lista.addEventListener('mouseout', (evento) => this.manejarMouseout(evento));

    btnNotificacion.addEventListener('click', () =>
      this.notificar('Recordatorio: revisá tus tareas pendientes 🔔', 'info')
    );
    btnCargarApi.addEventListener('click', () => this.cargarDesdeApi());
    btnGuardarApi.addEventListener('click', () => this.guardarEnApi());
    btnLimpiar.addEventListener('click', () => this.vaciarLista());
  }

  /** Evento keyup: habilita/deshabilita el botón de agregar según haya texto. */
  actualizarBotonAgregar() {
    this.refs.btnAgregar.disabled = !this.refs.descripcion.value.trim();
  }

  /**
   * Evento submit del formulario: crea una tarea con retardo simulado.
   * setTimeout simula el tiempo de guardado (Requerimiento 4).
   */
  manejarSubmit(evento) {
    evento.preventDefault();

    // Destructuring sobre el FormData del formulario.
    const { descripcion, fechaLimite } = Object.fromEntries(new FormData(this.refs.form));
    if (!descripcion.trim()) return;

    const { btnAgregar } = this.refs;
    btnAgregar.disabled = true;
    btnAgregar.textContent = 'Guardando...';

    setTimeout(() => {
      const tarea = this.gestor.agregarTarea({ descripcion, fechaLimite });
      this.persistir();
      this.refs.form.reset();
      this.renderizar();
      this.actualizarBotonAgregar();

      btnAgregar.disabled = false;
      btnAgregar.textContent = 'Agregar tarea';

      // Notificación de confirmación (aparece 2 s después de agregar la tarea).
      this.notificar(`Tarea agregada: "${tarea.descripcion}"`, 'exito');
    }, 1200);
  }

  /** Delegación de eventos: un único listener de click para toda la lista. */
  manejarClickLista(evento) {
    const boton = evento.target.closest('[data-accion]');
    if (!boton) return;

    const fila = boton.closest('[data-id]');
    const id = fila.dataset.id;

    if (boton.dataset.accion === 'eliminar') {
      this.eliminarTarea(id);
    } else if (boton.dataset.accion === 'estado') {
      this.ciclarEstado(id);
    }
  }

  /** Avanza el estado de una tarea al siguiente del ciclo. */
  ciclarEstado(id) {
    const tarea = this.gestor.buscarTarea(id);
    if (!tarea) return;

    const indice = ORDEN_ESTADOS.indexOf(tarea.estado);
    const proximoEstado = ORDEN_ESTADOS[(indice + 1) % ORDEN_ESTADOS.length];

    tarea.cambiarEstado(proximoEstado);
    this.persistir();
    this.renderizar();
  }

  eliminarTarea(id) {
    this.gestor.eliminarTarea(id);
    this.persistir();
    this.renderizar();
    this.notificar('Tarea eliminada', 'info');
  }

  /** Evento mouseover: resalta la fila bajo el cursor. */
  manejarMouseover(evento) {
    const fila = evento.target.closest('[data-id]');
    if (fila) fila.classList.add('resaltada');
  }

  /** Evento mouseout: quita el resaltado. */
  manejarMouseout(evento) {
    const fila = evento.target.closest('[data-id]');
    if (fila) fila.classList.remove('resaltada');
  }

  /* ---------------- Renderizado del DOM ---------------- */

  filtrarYRenderizar() {
    this.filtro = this.refs.buscador.value.trim();
    this.renderizar();
  }

  /** Construye el HTML de la lista con template literals. */
  renderizar() {
    const tareas = this.gestor.buscarPorTexto(this.filtro);
    const filas = tareas.map((tarea) => this.filaTarea(tarea)).join('');

    this.refs.lista.innerHTML = filas;
    this.refs.vacio.style.display = tareas.length ? 'none' : 'block';
    this.renderResumen();
  }

  filaTarea(tarea) {
    const { id, descripcion, estado, fechaCreacion, fechaLimite } = tarea;
    const contador = fechaLimite
      ? `<span class="contador" data-contador="${id}">${tarea.tiempoRestanteTexto()}</span>`
      : '';

    return `
      <li class="tarea estado-${estado}" data-id="${id}">
        <div class="tarea-info">
          <button type="button" class="estado-boton" data-accion="estado" title="Hacé clic para cambiar el estado">
            ${ESTADOS[estado]}
          </button>
          <div class="tarea-descripcion">${descripcion}</div>
          <div class="tarea-fechas">
            <span>🗓 Creada: ${tarea.formatearFecha(fechaCreacion)}</span>
            ${fechaLimite ? `<span>⏰ Límite: ${tarea.formatearFecha(fechaLimite)}</span>` : ''}
          </div>
          ${contador}
        </div>
        <button type="button" class="btn-eliminar" data-accion="eliminar" title="Eliminar tarea">✕</button>
      </li>
    `;
  }

  /** Muestra el resumen de tareas por estado (destructuring con valores por defecto). */
  renderResumen() {
    const total = this.gestor.obtenerTodas().length;
    const { pendiente = 0, 'en-progreso': enProgreso = 0, completada = 0 } = this.gestor.contarPorEstado();

    this.refs.resumen.textContent =
      `Total: ${total} · Pendientes: ${pendiente} · En progreso: ${enProgreso} · Completadas: ${completada}`;
  }

  /** Actualiza en vivo el contador regresivo de cada tarea con fecha límite. */
  actualizarContadores() {
    this.gestor.obtenerTodas().forEach((tarea) => {
      const elemento = this.refs.lista.querySelector(`[data-contador="${tarea.id}"]`);
      if (elemento) elemento.textContent = tarea.tiempoRestanteTexto();
    });
  }

  /* ---------------- Persistencia ---------------- */

  persistir() {
    this.storage.guardarLocal(this.gestor.obtenerTodas());
  }

  cargarTareasGuardadas() {
    const guardadas = this.storage.cargarLocal();
    this.gestor.reemplazarTareas(guardadas);
  }

  /* ---------------- API ---------------- */

  /** Importa tareas desde la API externa (fetch + try/catch). */
  async cargarDesdeApi() {
    this.notificar('Obteniendo tareas de la API (en español)…', 'info');
    try {
      const datos = await this.storage.obtenerDeApi(10);
      const nuevas = datos.map(desdeApiTodo);
      // Reemplaza la lista actual para mostrar solo las tareas importadas.
      this.gestor.reemplazarTareas(nuevas);

      this.persistir();
      this.renderizar();
      this.notificar(`Se cargaron ${nuevas.length} tareas en español desde la API`, 'exito');
    } catch (error) {
      this.notificar(`Error al cargar desde la API: ${error.message}`, 'error');
    }
  }

  /** Envía todas las tareas actuales a la API. */
  async guardarEnApi() {
    const tareas = this.gestor.obtenerTodas();
    if (!tareas.length) {
      this.notificar('No hay tareas para guardar', 'error');
      return;
    }

    try {
      const cantidad = await this.storage.guardarTodasEnApi(tareas);
      this.notificar(`Se guardaron ${cantidad} tareas en la API (${this.storage.apiGuardarUrl})`, 'exito');
    } catch (error) {
      this.notificar(`Error al guardar en la API: ${error.message}`, 'error');
    }
  }

  /* ---------------- Notificaciones y utilidades ---------------- */

  vaciarLista() {
    this.gestor.limpiar();
    this.persistir();
    this.renderizar();
    this.notificar('Lista vaciada', 'info');
  }

  /**
   * Muestra una notificación tipo "toast".
   * El retardo por defecto de 2000 ms demuestra el uso de setTimeout
   * para "mostrar una notificación tras 2 segundos" (Requerimiento 4).
   */
  notificar(mensaje, tipo = 'info', retrasoMs = 2000) {
    setTimeout(() => {
      const elemento = document.createElement('div');
      elemento.className = `notificacion ${tipo}`;
      elemento.textContent = mensaje;
      this.refs.notificaciones.appendChild(elemento);

      setTimeout(() => {
        elemento.classList.add('ocultando');
        setTimeout(() => elemento.remove(), 400);
      }, 3500);
    }, retrasoMs);
  }
}

// Arranque de la aplicación cuando el DOM está listo.
document.addEventListener('DOMContentLoaded', () => {
  new TaskFlowApp();
});
