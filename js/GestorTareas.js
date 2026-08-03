/**
 * Clase GestorTareas: administra la colección de tareas.
 * Centraliza la lógica de negocio: alta, baja, búsqueda, filtros y conteos.
 * Requerimiento 1: Orientación a objetos en JavaScript.
 * Requerimiento 2: ES6+ (arrow functions, destructuring, spread/rest).
 */
class GestorTareas {
  /**
   * @param {Array<Object|Tarea>} tareas - Lista inicial (objetos planos o instancias).
   */
  constructor(tareas = []) {
    this.tareas = [];
    this.reemplazarTareas(tareas);
  }

  /**
   * Crea una Tarea y la agrega a la lista.
   * @param {Object} datos - `{ descripcion, fechaLimite }` (destructuring).
   * @returns {Tarea} la tarea recién creada.
   */
  agregarTarea({ descripcion, fechaLimite }) {
    const tarea = new Tarea({ descripcion, fechaLimite });
    this.tareas.push(tarea);
    return tarea;
  }

  /** Agrega varias tareas a la vez (uso del operador rest). */
  agregarMuchas(...tareas) {
    tareas.forEach((datos) => {
      const tarea = datos instanceof Tarea ? datos : new Tarea(datos);
      this.tareas.push(tarea);
    });
    return tareas.length;
  }

  /** Devuelve la tarea cuyo id coincide (arrow function + find). */
  buscarTarea(id) {
    return this.tareas.find((tarea) => tarea.id === id);
  }

  /**
   * Elimina una tarea por id. Delega la marca de borrado en Tarea.eliminar().
   */
  eliminarTarea(id) {
    const tarea = this.buscarTarea(id);
    if (tarea) tarea.eliminar();
    this.tareas = this.tareas.filter((tarea) => tarea.id !== id);
  }

  /** Vacía por completo la lista. */
  limpiar() {
    this.tareas = [];
  }

  /**
   * Reemplaza la lista completa, normalizando los datos en instancias de Tarea.
   * Útil al cargar desde localStorage o desde una API.
   */
  reemplazarTareas(datos) {
    this.tareas = datos.map((dato) => (dato instanceof Tarea ? dato : new Tarea(dato)));
  }

  /** Devuelve una copia de la lista (operador spread para no mutar el original). */
  obtenerTodas() {
    return [...this.tareas];
  }

  /** Filtra tareas cuyo texto de descripción contenga el término buscado. */
  buscarPorTexto(texto) {
    if (!texto) return [...this.tareas];

    const normalizado = texto.toLowerCase();
    return this.tareas.filter((tarea) =>
      tarea.descripcion.toLowerCase().includes(normalizado)
    );
  }

  /**
   * Cuenta tareas por estado.
   * @returns {Object} ej. `{ pendiente: 3, 'en-progreso': 1, completada: 5 }`
   */
  contarPorEstado() {
    return this.tareas.reduce((conteo, tarea) => {
      conteo[tarea.estado] = (conteo[tarea.estado] || 0) + 1;
      return conteo;
    }, {});
  }
}
