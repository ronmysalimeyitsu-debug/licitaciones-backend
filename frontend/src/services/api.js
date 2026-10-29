import { Platform } from 'react-native';

const defaultApiUrl = Platform.OS === 'android'
  ? 'http://10.0.2.2:3000'
  : 'http://localhost:3000';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || defaultApiUrl).replace(/\/+$/, '');

export async function apiRequest(path, { token, ...options } = {}) {
  const headers = { ...options.headers };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(`${API_URL}/api/v1${path}`, { ...options, headers });
  } catch (error) {
    const err = new Error(`No se pudo conectar con el backend en ${API_URL}. Verifica que el servidor esté iniciado.`);
    err.status = 0;
    err.statusCode = 0;
    err.type = 'NetworkConnectionError';
    err.requestId = 'N/A';
    err.displayMessage = `[RED / CONEXIÓN]: No se pudo contactar al backend en ${API_URL}.`;
    throw err;
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    const err = new Error(`El servidor respondió con un formato inesperado (HTTP ${response.status}).`);
    err.status = response.status;
    err.statusCode = response.status;
    err.type = 'InvalidFormatError';
    err.requestId = response.headers.get('x-request-id') || 'N/A';
    err.displayMessage = `[HTTP ${response.status} InvalidFormat]: Respuesta no estructurada.`;
    throw err;
  }

  if (!response.ok) {
    const backendMessage = payload.error?.message || payload.message || `La solicitud falló (HTTP ${response.status}).`;
    const backendType = payload.error?.type || (
      response.status === 400 ? 'BadRequestError' :
      response.status === 401 ? 'UnauthorizedError' :
      response.status === 403 ? 'ForbiddenError' :
      response.status === 404 ? 'NotFoundError' :
      response.status === 409 ? 'ConflictError' :
      response.status >= 500 ? 'InternalServerError' : 'HttpError'
    );
    const requestId = payload.error?.requestId || response.headers.get('x-request-id') || 'N/A';

    const err = new Error(backendMessage);
    err.status = response.status;
    err.statusCode = response.status;
    err.type = backendType;
    err.requestId = requestId;
    err.backendError = payload.error || null;
    err.displayMessage = `[HTTP ${response.status} ${backendType}]: ${backendMessage}`;
    throw err;
  }

  return payload.data;
}

export function mapLicitation(licitation) {
  const closingDate = licitation.closingDate ? new Date(licitation.closingDate) : null;
  const daysLeft = closingDate
    ? Math.max(0, Math.ceil((closingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const budget = Number(licitation.budget);

  return {
    id: licitation.id,
    title: licitation.title,
    organization: licitation.organization || 'Organismo no especificado',
    sector: licitation.sector || 'General',
    status: licitation.status === 'active' ? 'Abierta' : licitation.status,
    deadline: closingDate
      ? closingDate.toLocaleDateString('es-VE')
      : 'Sin fecha límite',
    daysLeft,
    budget: Number.isFinite(budget) && budget > 0
      ? new Intl.NumberFormat('es-VE', { maximumFractionDigits: 2 }).format(budget)
      : 'No especificado',
    budgetUsd: null,
    location: licitation.location || 'No especificada',
    description: licitation.description || 'Sin descripción disponible.',
    requirements: licitation.requirements || [],
    attachments: licitation.attachments || [],
  };
}
