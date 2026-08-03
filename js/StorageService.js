/**
 * Servicio de almacenamiento: localStorage + API externa.
 * Requerimiento 5: Consumo de APIs y almacenamiento en localStorage.
 * - fetch() (GET) desde una API pública de tareas (DummyJSON) y
 *   traducción de sus textos al español con la API MyMemory.
 * - fetch() (POST) para guardar tareas en la API (JSONPlaceholder).
 * - localStorage para persistencia local.
 * - try/catch para el manejo de errores en peticiones asincrónicas.
 */
const CLAVE_LOCALSTORAGE = 'taskflow_tareas';

class StorageService {
  constructor() {
    // API de tareas (en inglés) y API pública de traducción al español.
    this.apiTareasUrl = 'https://dummyjson.com/todos';
    this.apiTraduccionUrl = 'https://api.mymemory.translated.net/get';
    // API para guardar tareas (POST).
    this.apiGuardarUrl = 'https://jsonplaceholder.typicode.com/todos';
  }

  /* ---------------- localStorage ---------------- */

  /**
   * Guarda la lista de tareas en localStorage.
   * Utiliza destructuring para serializar solo las propiedades relevantes.
   */
  guardarLocal(tareas) {
    const datos = tareas.map(({ id, descripcion, estado, fechaCreacion, fechaLimite }) => ({
      id,
      descripcion,
      estado,
      fechaCreacion,
      fechaLimite,
    }));
    localStorage.setItem(CLAVE_LOCALSTORAGE, JSON.stringify(datos));
  }

  /** Recupera la lista guardada en localStorage. Devuelve [] si no hay datos. */
  cargarLocal() {
    try {
      const crudo = localStorage.getItem(CLAVE_LOCALSTORAGE);
      return crudo ? JSON.parse(crudo) : [];
    } catch (error) {
      console.error('No se pudo leer localStorage:', error);
      return [];
    }
  }

  /* ---------------- API externa (fetch) ---------------- */

  /**
   * Obtiene tareas desde la API.
   * @param {number} limite - Cantidad máxima de tareas a traer.
   * @returns {Promise<Array>} lista de tareas crudas devueltas por la API.
   */
  async obtenerDeApi(limite = 10) {
    const respuesta = await fetch(`${this.apiTareasUrl}?limit=${limite}`);
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    const datos = await respuesta.json();
    const lista = datos.todos ?? [];
    const tareas = lista.map(({ id, todo, completed }) => ({
      id: `todo-${id}`,
      title: todo,
      completed,
    }));
    return this.traducirTodas(tareas);
  }

  /**
   * Traduce al español todas las tareas de la lista (de forma concurrente).
   */
  async traducirTodas(tareas) {
    const resultados = await Promise.all(
      tareas.map(async (tarea) => ({
        ...tarea,
        title: await this.traducirAlEspanol(tarea.title),
      }))
    );
    return resultados;
  }

  /**
   * Traduce un texto del inglés al español usando la API MyMemory.
   * Si falla la traducción, devuelve el texto original para no romper la app.
   */
  async traducirAlEspanol(texto) {
    try {
      const url = `${this.apiTraduccionUrl}?q=${encodeURIComponent(texto)}&langpair=en|es`;
      const respuesta = await fetch(url);
      if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
      const datos = await respuesta.json();
      const traducido = datos?.responseData?.translatedText;
      return traducido && traducido !== texto ? traducido : texto;
    } catch (error) {
      console.warn('No se pudo traducir el texto, se mantiene el original:', error);
      return texto;
    }
  }

  /**
   * Guarda una tarea en la API (POST).
   * @param {Tarea} tarea - Tarea a enviar.
   * @returns {Promise<Object>} el objeto creado por la API.
   */
  async guardarEnApi(tarea) {
    const respuesta = await fetch(this.apiGuardarUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: tarea.descripcion,
        completed: tarea.estado === 'completada',
      }),
    });
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return respuesta.json();
  }

  /**
   * Envía toda la lista a la API de forma concurrente.
   * @returns {Promise<number>} cantidad de tareas guardadas correctamente.
   */
  async guardarTodasEnApi(tareas) {
    const resultados = await Promise.all(tareas.map((tarea) => this.guardarEnApi(tarea)));
    return resultados.length;
  }
}
