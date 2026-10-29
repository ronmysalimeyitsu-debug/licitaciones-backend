const { Router } = require('express');
const authService = require('./auth.service');
const authMiddleware = require('../../middlewares/auth.middleware');
const BadRequestError = require('../../errors/bad-request-error');

const router = Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Expresión regular estándar para validación sintáctica de emails y RIF venezolano
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RIF_REGEX = /^[JEVGCP]-\d{8}-\d$/i;

/**
 * POST /api/v1/auth/register
 * Registro de nueva empresa proveedora con validación Fail-Fast.
 */
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { razonSocial, rif, email, password, telefono } = req.body || {};

    // Simulación didáctica de fallo crítico no controlado (HTTP 500 / CWE-209)
    if (email && email.toLowerCase().includes('trigger500')) {
      throw new Error('Fallo crítico simulado en servidor para demostración de error 500 (CWE-209).');
    }

    if (!razonSocial || typeof razonSocial !== 'string' || razonSocial.trim().length === 0) {
      throw new BadRequestError('El campo "razonSocial" es obligatorio.');
    }

    if (!rif || typeof rif !== 'string' || rif.trim().length === 0) {
      throw new BadRequestError('El campo "rif" es obligatorio (ej. J-12345678-0).');
    }

    if (!RIF_REGEX.test(rif.trim())) {
      throw new BadRequestError('El campo "rif" tiene un formato inválido (debe cumplir el formato J-12345678-0).');
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      throw new BadRequestError('El campo "email" es obligatorio y debe tener un formato de correo válido.');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new BadRequestError('El campo "password" es obligatorio y debe tener al menos 6 caracteres.');
    }

    const result = await authService.register({
      razonSocial: razonSocial.trim(),
      rif: rif.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
      password,
      telefono: telefono && typeof telefono === 'string' ? telefono.trim() : null,
    });

    return res.status(201).json({
      message: 'Empresa registrada exitosamente.',
      data: result,
    });
  })
);

/**
 * POST /api/v1/auth/login
 * Autenticación y generación de token JWT.
 */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};

    // Simulación didáctica de fallo crítico no controlado (HTTP 500 / CWE-209)
    if (email && email.toLowerCase().includes('trigger500')) {
      throw new Error('Fallo crítico simulado en servidor para demostración de error 500 (CWE-209).');
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      throw new BadRequestError('Debe proporcionar un "email" válido con formato de correo corporativo.');
    }

    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      throw new BadRequestError('Debe proporcionar el campo "password" para autenticarse.');
    }

    const result = await authService.login(email.trim().toLowerCase(), password);

    return res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      data: result,
    });
  })
);

/**
 * Endpoint de prueba para verificar el Manejador Global de Errores 4-Arity (HTTP 500)
 */
router.all(
  '/test-500',
  asyncHandler(async () => {
    throw new Error('Excepción no controlada disparada intencionalmente para verificar el Manejador 4-Arity (HTTP 500).');
  })
);

/**
 * GET /api/v1/auth/me
 * Consulta del perfil de la empresa autenticada mediante JWT.
 */
router.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const profile = await authService.getProfile(req.company.id);
    return res.status(200).json({
      data: profile,
    });
  })
);

module.exports = router;
