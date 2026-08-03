/**
 * Clase Tarea: representa una tarea individual.
 * Aplica conceptos de POO: encapsulamiento de datos y comportamiento.
 * Requerimiento 1: Orientación a objetos en JavaScript.
 */
class Tarea {
  /**
   * @param {Object} opciones - Datos iniciales de la tarea (destructuring).
   * @param {string} [opciones.id]
   * @param {string} opciones.descripcion
   * @param {'pendiente'|'en-progreso'|'completada'} [opciones.estado]
   * @param {Date|string} [opciones.fechaCreacion]
   * @param {Date|string|null} [opciones.fechaLimite]
   */
  constructor({ id, descripcion, estado = 'pendiente', fechaCreacion = new Date(), fechaLimite = null } = {}) {
    this.id = id ?? this.generarId();
    this.descripcion = descripcion;
    this.estado = estado;
    this.fechaCreacion = new Date(fechaCreacion);
    this.fechaLimite = fechaLimite ? new Date(fechaLimite) : null;
  }

  /** Genera un identificador único (con respaldo para entornos sin crypto). */
  generarId() {
    return globalThis.crypto?.randomUUID?.()
      ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  /**
   * Cambia el estado de la tarea validando el valor recibido.
   * @param {'pendiente'|'en-progreso'|'completada'} nuevoEstado
   * @returns {Tarea} la propia instancia (encadenamiento de métodos).
   */
  cambiarEstado(nuevoEstado) {
    const estadosValidos = ['pendiente', 'en-progreso', 'completada'];
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error(`Estado inválido: "${nuevoEstado}"`);
    }
    this.estado = nuevoEstado;
    return this;
  }

  /** Método de conveniencia: marca la tarea como completada. */
  marcarCompletada() {
    return this.cambiarEstado('completada');
  }

  /**
   * Método de eliminación: marca la tarea como eliminada.
   * @returns {boolean} `true` indica que la tarea debe quitarse de la lista.
   */
  eliminar() {
    this.estado = 'eliminada';
    return true;
  }

  /** Indica si la tarea superó su fecha límite sin estar completada. */
  esVencida() {
    return Boolean(
      this.fechaLimite
      && this.estado !== 'completada'
      && new Date() > this.fechaLimite
    );
  }

  /**
   * Devuelve el tiempo restante hasta la fecha límite con formato legible.
   * Se usa junto con setInterval() para el contador regresivo (Requerimiento 4).
   */
  tiempoRestanteTexto() {
    if (!this.fechaLimite || this.estado === 'completada') return '';

    const ahora = new Date();
    const diferencia = this.fechaLimite - ahora;

    if (diferencia <= 0) return '⚠️ Vencida';

    const segundos = Math.floor(diferencia / 1000) % 60;
    const minutos = Math.floor(diferencia / 60000) % 60;
    const horas = Math.floor(diferencia / 3600000) % 24;
    const dias = Math.floor(diferencia / 86400000);

    return `⏳ Quedan ${dias} d ${horas} h ${minutos} m ${segundos} s`;
  }

  /** Formatea una fecha con la configuración regional local. */
  formatearFecha(fecha = this.fechaCreacion) {
    return new Date(fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
  }
}
