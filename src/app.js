const express = require('express');
const path = require('path');
const requestIdMiddleware = require('./middlewares/request-id');
const requestLoggerMiddleware = require('./middlewares/request-logger');
const errorHandlerMiddleware = require('./middlewares/error-handler');
const authRoutes = require('./modules/auth/auth.routes');
const licitationsRoutes = require('./modules/licitations/licitations.routes');
const bidsRoutes = require('./modules/bids/bids.routes');
const requestsRoutes = require('./modules/requests/requests.routes');
const NotFoundError = require('./errors/not-found-error');
const pool = require('./database/pool');

/**
 * Fábrica y Configuración Central de la Aplicación Express (Application Factory).
 *
 * Sigue el principio de Separación de Responsabilidades (SoC):
 * Se aísla la inicialización de middlewares y rutas de la capa de transporte TCP (server.js).
 */
const app = express();

// 1. Middlewares de análisis de cuerpo (Body Parsers)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 2. Servir archivos estáticos subidos (PDFs de propuestas)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 3. Middlewares de Observabilidad y Seguridad
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);

// 4. Endpoint de sondeo de salud (Health Check & Liveness Probe)
app.get('/health', async (req, res, next) => {
  try {
    // Comprueba la conectividad viva con PostgreSQL / Supabase
    await pool.query('SELECT 1;');
    return res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      requestId: req.id,
      database: 'CONNECTED',
    });
  } catch (err) {
    return res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      requestId: req.id,
      database: 'DISCONNECTED',
      error: err.message,
    });
  }
});

// 5. Montaje de Módulos por Dominios Funcionales (Arquitectura Modular)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/licitations', licitationsRoutes);
app.use('/api/v1/bids', bidsRoutes);
app.use('/api/v1/requests', requestsRoutes);

// 6. Manejador para rutas inexistentes (404 Not Found)
app.use((req, res, next) => {
  next(new NotFoundError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
});

// 7. Manejador Global de Errores (4-Arity Middleware) - DEBE IR AL FINAL
app.use(errorHandlerMiddleware);

module.exports = app;
