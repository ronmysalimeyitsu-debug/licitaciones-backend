# Plataforma de Licitaciones - Backend REST API & Core Domain

![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.style)
![Express](https://img.shields.io/badge/Express-v4-blue.style)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v15%2B-blue.style)
![Architecture](https://img.shields.io/badge/Architecture-Modular%20Domain--Driven-orange.style)

Documentación técnica y especificaciones de arquitectura del sistema backend para la gestión de licitaciones públicas y privadas en Venezuela. Este desarrollo desacoplado (*Headless Backend*) da soporte a clientes Web, iOS y Android, implementando las mejores prácticas de la industria y cubriendo los temas impartidos durante la asignatura de Desarrollo Backend.

---

## 📋 Tabla de Contenidos

1. [Resumen de Capacidades e Integración de Contenidos](#1-resumen-de-capacidades-e-integración-de-contenidos)
2. [Arquitectura del Sistema y Principios de Diseño](#2-arquitectura-del-sistema-y-principios-de-diseño)
3. [Estructura del Proyecto en VS Code](#3-estructura-del-proyecto-en-vs-code)
4. [Flujos del Dominio y Reglas de Negocio](#4-flujos-del-dominio-y-reglas-de-negocio)
5. [Modelado de Datos, Persistencia y Transacciones ACID](#5-modelado-de-datos-persistencia-y-transacciones-acid)
6. [Manejo de Errores, Resiliencia y Observabilidad](#6-manejo-de-errores-resiliencia-y-observabilidad)
7. [Guía de Ejecución, Pruebas y Comandos](#7-guía-de-ejecución-pruebas-y-comandos)

---

## 1. Resumen de Capacidades e Integración de Contenidos

El backend demuestra la aplicación de los siguientes conceptos del trimestre:

| Módulo / Tema de la Materia | Implementación en el Proyecto | Ubicación / Referencia |
| :--- | :--- | :--- |
| **Arquitectura Desacoplada y REST API** | Separación estricta entre capa de presentación y API RESTful con soporte para clientes multiplataforma (Web, iOS, Android). | `src/app.js`, `src/modules/*/` |
| **Separación de Responsabilidades (SoC)** | Estructura modular dividida en Rutas (Frontera), Servicios (Negocio) y Store/Persistence (Datos). | `src/modules/requests/` |
| **Autenticación Stateless & JWT** | Emisión y validación de tokens de sesión para control de acceso seguro. | `src/modules/auth/` |
| **Gestión de Formularios Multi-parte** | Procesamiento seguro de archivos PDF adjuntos en postulaciones con `Multer`. | `src/modules/bids/` |
| **Máquina de Estados Finitos (FSM)** | Control estricto e inmutable de transiciones de estados mediante `Object.freeze()`. | `src/modules/requests/request-status.js` |
| **Garantías ACID y Bloqueo Pesimista** | Transacciones explícitas (`BEGIN`, `COMMIT`, `ROLLBACK`) y locking con `FOR UPDATE`. | `src/modules/requests/requests.store.js` |
| **Manejo Global de Errores (4-Arity)** | Middleware interceptor de 4 parámetros para prevenir la fuga de información sensible (*Information Disclosure*). | `src/middlewares/error-handler.js` |
| **Observabilidad y Trazabilidad** | Asignación y propagación de UUID único por solicitud (`X-Request-ID`) con registros seguros (*Allowlist*). | `src/middlewares/request-id.js` |
| **Procesos de Salud Operativa** | Endpoints de monitoreo (*Liveness* y *Readiness*) para infraestructura. | `src/routes/health.routes.js` |

---

## 2. Arquitectura del Sistema y Principios de Diseño

La arquitectura adopta un enfoque **Modular por Dominios (Domain-Driven Organization)**, desacoplando la fábrica de Express de la capa de conexión de red para facilitar las pruebas unitarias y de integración sin necesidad de levantar sockets TCP.

```
       [ Client App ] (Web / iOS / Android)
             │
             ▼
   [ Boundary Layer ]  --->  Middleware Stack (X-Request-ID, Allowlist Logger, Body Parser)
             │
             ▼
    [ Controller/Route ] ---> Validaciones Fail-Fast (Tipos, Formatos)
             │
             ▼
     [ Service Layer ]  ---> Máquina de Estados Finitos (FSM - Rules)
             │
             ▼
    [ Persistence/Store] ---> Pool de PostgreSQL (Transacciones ACID + Row Locking)
             │
             ▼
     [ Database Layer ] ---> PostgreSQL / Supabase DB
```

### Principios Fundamentales:
1. **Principio de Responsabilidad Única (SRP):** Cada módulo maneja únicamente su ciclo de vida y responsabilidades.
2. **Patrón Fail-Fast:** Validación inmediata de datos a la entrada de las peticiones para descartar solicitudes inválidas antes de consumir recursos de base de datos.
3. **Resiliencia de Conexión:** Gestión eficiente mediante pool de conexiones para prevenir el agotamiento de sockets (*Connection Leaks*).

---

## 3. Estructura del Proyecto en VS Code

```text
project/
├── database/
│   └── migrations/           # Scripts SQL de migraciones (001_initial_schema.sql)
├── src/
│   ├── database/
│   │   └── pool.js           # Cliente del pool de PostgreSQL (Supabase)
│   ├── errors/
│   │   ├── app-error.js      # Clase base para errores operacionales
│   │   └── bad-request-error.js # Manejador de error HTTP 400
│   ├── middlewares/
│   │   ├── error-handler.js  # Interceptor global de errores (4-Arity)
│   │   ├── request-id.js     # Middleware para inyección de X-Request-ID
│   │   └── request-logger.js # Registro seguro de eventos (Allowlist)
│   ├── modules/
│   │   └── requests/         # Módulo principal del dominio
│   │       ├── request-status.js   # Definición de la FSM inmutable
│   │       ├── request.mapper.js   # Transformadores DTO
│   │       ├── requests.routes.js  # Definición de endpoints REST
│   │       ├── requests.service.js # Orquestación de lógica de negocio
│   │       └── requests.store.js   # Operaciones de persistencia transaccional
│   ├── routes/
│   │   └── health.routes.js  # Endpoints de diagnóstico (/health, /ready)
│   ├── app.js                # Configuración global de Express y Middlewares
│   └── server.js             # Punto de entrada y escuchador HTTP
├── tests/
│   ├── domain.test.js        # Pruebas de dominio, ACID y FSM
│   ├── http.test.js          # Pruebas de capa HTTP y manejador de errores
│   └── licitaciones-flow.test.js # Flujo de integración E2E completo
├── .env.example              # Plantilla de variables de entorno
├── package.json
└── README.md
```

---

## 4. Flujos del Dominio y Reglas de Negocio

### Máquina de Estados Finitos (FSM)
El ciclo de vida de las licitaciones y solicitudes está controlado por una FSM inmutable implementada con `Object.freeze()` para evitar alteraciones en tiempo de ejecución.

```
       ┌─────────────┐
       │   DRAFT     │
       └──────┬──────┘
              │
              ▼
       ┌─────────────┐
       │   ACTIVE    ├────────────────┐
       └──────┬──────┘                │
              │                       ▼
              ▼               ┌──────────────┐
       ┌─────────────┐        │ CANCELLED    │
       │  EVALUATION │        │ (Soft Delete)│
       └──────┬──────┘        └──────────────┘
              │                       ▲
              ▼                       │
       ┌─────────────┐                │
       │   CLOSED    ├────────────────┘
       └─────────────┘
```

#### Transiciones Permitidas:
* `DRAFT` $\rightarrow$ `ACTIVE`, `CANCELLED`
* `ACTIVE` $\rightarrow$ `EVALUATION`, `CANCELLED`
* `EVALUATION` $\rightarrow$ `CLOSED`, `CANCELLED`
* **Estados Terminales:** `CLOSED` y `CANCELLED` no permiten transiciones subsecuentes.

Cualquier intento de violar la FSM genera un error de conflicto semántico (`409 Conflict`).

---

## 5. Modelado de Datos, Persistencia y Transacciones ACID

Toda interacción con PostgreSQL se ejecuta a través de **consultas parametrizadas** (`$1, $2...`), anulando riesgos de Inyección SQL.

### Garantías Transaccionales en Operaciones Multi-Escritura
Para operaciones críticas (ej. registro de licitación o actualización de estado con auditoría), se aplica un bloque de unidad de trabajo atómico:

```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  // Bloqueo pesimista para evitar condiciones de carrera
  const res = await client.query('SELECT * FROM licitaciones WHERE id = $1 FOR UPDATE', [id]);
  
  // Procesamiento y mutación
  await client.query('UPDATE licitaciones SET status = $1 WHERE id = $2', [newStatus, id]);
  await client.query('INSERT INTO audit_logs (licitacion_id, action) VALUES ($1, $2)', [id, 'STATUS_CHANGE']);
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release(); // Liberación incondicional del cliente al pool
}
```

---

## 6. Manejo de Errores, Resiliencia y Observabilidad

### 1. Interceptor Global de Errores (4-Arity)
El middleware de errores captura excepciones no controladas y formatea la respuesta en un JSON uniforme sin exponer stack traces internos en entornos de producción:

```javascript
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const correlationId = req.headers['x-request-id'] || 'N/A';
  
  // Registro estructurado para el equipo de operaciones
  console.error(`[ERROR] [${correlationId}]`, err);

  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: statusCode === 500 ? 'Ha ocurrido un error interno en el servidor.' : err.message,
      correlationId
    }
  });
});
```

### 2. Trazabilidad Unívoca (`X-Request-ID`)
Cada solicitud es etiquetada con un identificador único (UUID). Si el cliente envía la cabecera `X-Request-ID`, esta es sanitizada; de lo contrario, el servidor la genera automáticamente.

### 3. Sondas Operativas (*Healthchecks*)
* `GET /health` (*Liveness Probe*): Verifica la disponibilidad del bucle de eventos (*Event Loop*) del servidor web.
* `GET /ready` (*Readiness Probe*): Verifica la conexión activa contra la base de datos PostgreSQL mediante un query de prueba (`SELECT 1`).

---

## 7. Guía de Ejecución, Pruebas y Comandos

### Requisitos Previos
* Node.js v18.0.0 o superior
* Instancia de PostgreSQL o proyecto en Supabase

### Instalar Dependencias
```bash
npm install
```

### Variables de Entorno Configuration (`.env`)
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://usuario:password@localhost:5432/licitaciones_db
JWT_SECRET=tu_clave_secreta_super_segura
```

### Ejecutar Servidor en Modo Desarrollo
```bash
npm run dev
```

### Ejecución de Suites de Pruebas Automatizadas
El proyecto incluye tres suites de pruebas unitarias e integración:

```bash
# Ejecutar todas las pruebas de integración
npm test

# Salida esperada de los tests:
# ✅ tests/domain.test.js: Transacciones ACID, bloqueo pesimista y FSM inmutable.
# ✅ tests/http.test.js: Trazabilidad X-Request-ID, Fail-Fast 400 y manejador 4-Arity.
# ✅ tests/licitaciones-flow.test.js: Flujo end-to-end completo (Auth -> Licitación -> PDF -> 409 Dup).
```