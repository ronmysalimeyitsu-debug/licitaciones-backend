# 🏛️ Backend API - Sistema de Licitaciones

API REST desarrollada con **Node.js**, **Express** y **PostgreSQL (Supabase)**, diseñada bajo una **Arquitectura Modular por Dominios**, orientada a cumplir con los más rigurosos estándares de desarrollo backend: Separación de Responsabilidades (SoC), Principio de Responsabilidad Única (SRP), Patrón Fail-Fast, Máquina de Estados Finitos inmutable (FSM), transaccionalidad ACID y observabilidad segura.

---

## 🚀 Tecnologías y Estándares
* **Node.js & Express:** Runtime y framework web modular.
* **PostgreSQL (Supabase):** Base de datos relacional conectada mediante `pg.Pool` con escucha de errores en nodos inactivos y transacciones ACID.
* **JWT (JSON Web Tokens):** Autenticación sin estado para empresas proveedoras.
* **bcryptjs:** Hashing unidireccional con salt para resguardo de contraseñas.
* **Multer:** Manejo seguro de subida de propuestas y pliegos en formato PDF.
* **Distributed Tracing (X-Request-ID):** Trazabilidad unívoca mediante UUID v4 verificado por RegExp.
* **Secure Request Logger:** Registro de eventos con lista blanca (*Allowlist*) para prevenir la filtración de datos sensibles.
* **4-Arity Global Error Handler:** Enmascaramiento de errores internos 500 para evitar la fuga de información técnica (*Information Disclosure* / CWE-209).

---

## 📂 Arquitectura del Proyecto

```plaintext
project/
├── database/
│   ├── migrate.js            # Runner de migraciones automáticas
│   └── migrations/           # Archivos SQL incrementales (001, 002, 003...)
├── src/
│   ├── database/
│   │   └── pool.js           # Gestión del pool de conexiones PostgreSQL
│   ├── errors/
│   │   ├── app-error.js      # Clase base para errores operacionales
│   │   ├── bad-request-error.js    # Código HTTP 400
│   │   ├── unauthorized-error.js   # Código HTTP 401
│   │   ├── forbidden-error.js      # Código HTTP 403
│   │   ├── not-found-error.js      # Código HTTP 404
│   │   └── conflict-error.js       # Código HTTP 409
│   ├── middlewares/
│   │   ├── auth.middleware.js      # Validación de Bearer Token JWT
│   │   ├── request-id.js           # Trazabilidad unívoca (X-Request-ID)
│   │   ├── request-logger.js       # Registro seguro con lista blanca
│   │   └── error-handler.js        # Manejador global de errores (4-Arity)
│   ├── modules/
│   │   ├── auth/             # Dominio de Autenticación y Empresas
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.service.js
│   │   │   ├── companies.store.js
│   │   │   └── company.mapper.js
│   │   ├── licitations/      # Dominio de Licitaciones Públicas
│   │   │   ├── licitations.routes.js
│   │   │   ├── licitations.service.js
│   │   │   ├── licitations.store.js
│   │   │   └── licitation.mapper.js
│   │   ├── bids/             # Dominio de Postulaciones y Ofertas
│   │   │   ├── bids.routes.js
│   │   │   ├── bids.service.js
│   │   │   ├── bids.store.js
│   │   │   ├── bid.mapper.js
│   │   │   └── upload.middleware.js # Subida controlada de PDFs
│   │   └── requests/         # Dominio Solicitudes (FSM y Transacciones ACID)
│   │       ├── requests.routes.js
│   │       ├── requests.service.js
│   │       ├── requests.store.js
│   │       ├── request-status.js    # FSM con Object.freeze()
│   │       └── request.mapper.js
│   ├── app.js                # Fábrica de Express y middlewares globales
│   └── server.js             # Punto de arranque y apagado grácil (Graceful Shutdown)
├── tests/                    # Suite de pruebas automatizadas
│   ├── domain.test.js        # Pruebas de FSM y transacciones ACID
│   ├── http.test.js          # Pruebas de la capa HTTP y observabilidad
│   └── licitaciones-flow.test.js # Flujo End-to-End completo
├── uploads/                  # Directorio de propuestas PDF
├── package.json
├── .env.example              # Plantilla sin credenciales
└── .env                      # Configuración local (no versionada)
```

---

## ⚙️ Comandos del Sistema

### 1. Instalación de dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Copia `.env.example` a `.env` y completa `DATABASE_URL` con la conexión de PostgreSQL/Supabase. Genera un valor aleatorio propio para `SECRET_KEY`; no reutilices la clave de ejemplo ni publiques el archivo `.env`.

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Ejecutar Migraciones SQL en Supabase
```bash
npm run migrate
```

### 4. Ejecutar la Suite de Pruebas Automatizadas
```bash
npm test
```

### 5. Iniciar el Servidor en Desarrollo (con recarga automática)
```bash
npm run dev
```

### 6. Iniciar en Producción
```bash
npm start
```

### 7. Ejecutar el frontend Expo
En otra terminal, configura la URL pública de la API y arranca Expo:

```bash
cd frontend
copy .env.example .env
npm install
npm start
```

Edita `frontend/.env` antes de iniciar Expo:

* Expo Web o simulador iOS: `EXPO_PUBLIC_API_URL=http://localhost:3000`
* Emulador Android: `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`
* Expo Go en un teléfono: usa la IP local de la computadora, por ejemplo `http://192.168.1.50:3000`. El teléfono y la computadora deben estar en la misma red.

La aplicación utiliza `/api/v1/auth` para registrarse e iniciar sesión, `/api/v1/licitations` para cargar oportunidades y `/api/v1/bids` para enviar y consultar postulaciones. Para Expo Web, `FRONTEND_ORIGINS` en el `.env` del backend debe incluir el origen que muestra Expo, por ejemplo `http://localhost:8081`.

---

## 📡 Endpoints de la API

### Salud del Sistema
* `GET /health`: Sondeo de vida y verificación de conectividad activa a PostgreSQL / Supabase.

### Autenticación y Empresas (`/api/v1/auth`)
* `POST /api/v1/auth/register`: Registro de empresa proveedora (hashing con `bcrypt`).
* `POST /api/v1/auth/login`: Autenticación y emisión de token JWT.
* `GET /api/v1/auth/me`: Perfil de la empresa autenticada (`Authorization: Bearer <token>`).

### Licitaciones (`/api/v1/licitations`)
* `GET /api/v1/licitations`: Consulta licitaciones activas y vigentes.
* `GET /api/v1/licitations/:id`: Detalle de una licitación por UUID.
* `POST /api/v1/licitations`: Publicación de nueva licitación con fecha límite.

### Ofertas y Postulaciones (`/api/v1/bids`)
* `POST /api/v1/bids`: Envío de propuesta técnica en PDF (`multipart/form-data`) autenticado con JWT.
* `GET /api/v1/bids/my-bids`: Consulta el histórico de ofertas enviadas por la empresa autenticada.
* `GET /api/v1/bids/licitation/:licitationId`: Consulta las ofertas presentadas para una licitación.

### Solicitudes y FSM (`/api/v1/requests`)
* `GET /api/v1/requests`: Listado de solicitudes.
* `GET /api/v1/requests/:id`: Detalle y trazabilidad histórica de estados.
* `POST /api/v1/requests`: Creación atómica ACID con auditoría multi-escritura.
* `PATCH /api/v1/requests/:id/status`: Transición de estado evaluada por la FSM (bloqueo 409 Conflict ante estados terminales).
