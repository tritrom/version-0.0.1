# TaskFlow · Aplicación de Gestión de Tareas

Evaluación del módulo **Programación avanzada en JavaScript**.

Aplicación web interactiva que permite **crear, editar (cambiar de estado) y eliminar tareas**, con búsqueda en vivo, contador regresivo para fechas límite, notificaciones, persistencia en `localStorage` y consumo de una API externa.

---

## Requisitos

- Navegador moderno (Chrome, Edge, Firefox).
- Conexión a internet para probar el consumo de la API.
- No requiere instalar nada ni levantar un servidor.

---

## Instalación y ejecución (ejemplos)

**Opción A — Doble clic (recomendada)**
La aplicación usa *scripts clásicos* (sin `import`/`export`), por lo que se puede abrir directamente:
1. Abrir la carpeta `MODULO 4`.
2. Hacer doble clic sobre `index.html`.
3. Se abre en el navegador y funciona de inmediato.

**Opción B — VS Code con Live Server (opcional)**
1. Abrir la carpeta en VS Code.
2. Instalar la extensión *Live Server*.
3. Clic derecho sobre `index.html` → *Open with Live Server*.

**Opción C — Python (opcional)**
```bash
cd "C:\Users\Cristian\Desktop\MODULO 4"
python -m http.server 8080
# Se abre en http://localhost:8080
```

---

## Estructura del proyecto

```
MODULO 4/
├── index.html            → Estructura: formulario, buscador, lista, panel API (carga los scripts)
├── package.json          → Configuración del proyecto
├── css/
│   └── styles.css        → Estilos de la interfaz
├── js/
│   ├── Tarea.js          → Clase Tarea (POO)
│   ├── GestorTareas.js   → Clase GestorTareas (POO + ES6+)
│   ├── StorageService.js → localStorage + consumo de API (fetch)
│   └── app.js            → Controlador: eventos, DOM, asincronía
└── README.md             → Documentación (este archivo)
```

Los `js/` se cargan en `index.html` como *scripts clásicos* en orden de dependencia:
`Tarea.js → GestorTareas.js → StorageService.js → app.js`.

---

## Funcionalidades

| Funcionalidad | Cómo se usa |
|---|---|
| Crear tarea | Completar el formulario y presionar *Agregar tarea* (tiene retardo simulado de 1,2 s). |
| Cambiar estado | Clic sobre la etiqueta de estado de la tarea: `pendiente → en-progreso → completada`. |
| Eliminar tarea | Clic sobre el botón ✕ (aparece al pasar el mouse). |
| Buscar/filtrar | Escribir en el buscador (evento `keyup`). |
| Notificaciones | Aparecen 2 s después de una acción; también hay un botón de prueba. |
| Contador regresivo | Las tareas con fecha límite muestran el tiempo restante, actualizado cada segundo. |
| API | *Cargar tareas desde la API* (GET desde DummyJSON, traducidas al español con MyMemory) y *Guardar tareas en la API* (POST a JSONPlaceholder). |
| Persistencia | La lista se guarda automáticamente en `localStorage`. |

---

## Mapa de requisitos → implementación

| Requerimiento | Archivo / línea | Detalle |
|---|---|---|
| **1. POO** | `js/Tarea.js` | Clase `Tarea` con `id`, `descripcion`, `estado`, `fechaCreacion`, `fechaLimite`; métodos `cambiarEstado()`, `marcarCompletada()`, `eliminar()`. |
| **1. POO** | `js/GestorTareas.js` | Clase `GestorTareas` que administra la lista: `agregarTarea()`, `eliminarTarea()`, `buscarTarea()`, `buscarPorTexto()`, `contarPorEstado()`. |
| **2. ES6+** | Todo el código | `let`/`const`, template literals (renderizado), arrow functions, destructuring (`Tarea` constructor, `desdeApiTodo`, `renderResumen`, `guardarLocal`), spread (`obtenerTodas()`, `agregarMuchas(...nuevas)`), rest (`agregarMuchas(...tareas)`). |
| **3. Eventos y DOM** | `js/app.js` | `submit` (crear), `click` (cambiar estado / eliminar por delegación), `mouseover`/`mouseout` (resaltar filas), `keyup` (búsqueda y habilitación del botón). Renderizado dinámico con `innerHTML`. |
| **4. Asíncrono** | `js/app.js` | `setTimeout` para el retardo al agregar y para notificaciones a los 2 s; `setInterval` (1 s) para el contador regresivo. |
| **5. Consumo de APIs** | `js/StorageService.js` | `fetch()` GET desde [DummyJSON](https://dummyjson.com/docs/todos) (`/todos`) con traducción al español vía [MyMemory](https://api.mymemory.translated.net); POST a [JSONPlaceholder](https://jsonplaceholder.typicode.com/todos); `localStorage` para guardar/recuperar y `try/catch` para manejar errores. |

---

## Registro de decisiones técnicas

1. **Scripts clásicos en archivos separados (sin servidor)**: se optó por dividir el código en archivos con responsabilidad única (una clase por archivo) y cargarlos con etiquetas `<script>` clásicas en orden de dependencia. Así la app **funciona con doble clic** sobre `index.html`, sin necesidad de servidor ni de instalar nada. Se mantienen todos los beneficios de la POO y el código queda organizado y legible.
2. **APIs utilizadas**: para **obtener** tareas se usa [DummyJSON](https://dummyjson.com/docs/todos) (`/todos`), que devuelve tareas reales, y cada una se **traduce al español** con la API pública [MyMemory](https://api.mymemory.translated.net) (sin clave). Si una traducción falla, se conserva el texto original y la app no se rompe. Para **guardar** tareas (POST) se usa [JSONPlaceholder](https://jsonplaceholder.typicode.com) (`/todos`), que permite crear elementos. Todas son gratuitas, sin clave y aptas para evaluar `fetch()` (GET y POST) y el manejo de errores con `try/catch`.
3. **`localStorage`**: clave `taskflow_tareas`. Si el navegador no permite `localStorage` o el parseo falla, se devuelve una lista vacía sin romper la app (método defensivo).
4. **Estados**: se modelan tres estados —`pendiente`, `en-progreso`, `completada`— para mostrar el ciclo de vida de una tarea. Se validan al cambiarlos (lanza error si el estado no es válido).
5. **IDs**: se usan UUID con `crypto.randomUUID()` y un respaldo (`Date.now()` + aleatorio) para entornos sin `crypto`, garantizando unicidad.
6. **Normalización de datos**: los objetos planos provenientes de la API o de `localStorage` se convierten a instancias de `Tarea` al ingresar al `GestorTareas` (`reemplazarTareas` / `agregarMuchas`), separando datos crudos de dominio.
7. **Delegación de eventos**: un único listener de `click` en la lista maneja todos los botones, más eficiente que un listener por tarea.
8. **Tolerancia a fallos de la API**: si la API no responde, la app sigue funcionando con `localStorage` y muestra una notificación de error (validación de `try/catch`).

---

## Criterios de evaluación cubiertos

- ✔️ Correcta aplicación de funciones con objetos (clases `Tarea`, `GestorTareas`).
- ✔️ Uso de ES6+ en toda la implementación.
- ✔️ Interactividad a través del manejo de eventos (`submit`, `click`, `mouseover`, `keyup`).
- ✔️ Correcto manejo de asincronía (`setTimeout`, `setInterval`, `fetch` con `async/await`).
- ✔️ Implementación y validación del consumo de APIs (`GET`/`POST` + `localStorage` + `try/catch`).
