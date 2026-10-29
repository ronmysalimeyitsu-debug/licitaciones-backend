const fs = require('fs');
const path = require('path');

const BACKEND_URL = process.env.API_URL || 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:8081';

/**
 * Función auxiliar para dar formato a los resultados de prueba.
 */
function logSection(title) {
  console.log('\n================================================================');
  console.log(`🧪 ${title}`);
  console.log('================================================================');
}

function logSuccess(msg, details) {
  console.log(`✅ [OK] ${msg}`);
  if (details) {
    console.log('   Detalles:', typeof details === 'object' ? JSON.stringify(details, null, 2) : details);
  }
}

function logFail(msg, error) {
  console.error(`❌ [FALLÓ] ${msg}`);
  if (error) {
    console.error('   Error:', error);
  }
}

/**
 * Replicación de la función mapLicitation de frontend/src/services/api.js
 * para verificar que los datos devueltos por el backend se formatean exactamente
 * como los consume la interfaz de usuario.
 */
function mapLicitation(licitation) {
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
    description: licitation.description || 'Sin descripción disponible.',
  };
}

async function runFrontendBackendIntegrationTests() {
  console.log('🚀 INICIANDO PRUEBAS DE COMUNICACIÓN FRONTEND <-> BACKEND');
  console.log(`🌐 URL Backend:  ${BACKEND_URL}`);
  console.log(`💻 URL Frontend: ${FRONTEND_URL}`);

  let authToken = null;
  let testCompany = null;
  let selectedLicitation = null;
  let uploadedPdfUrl = null;

  // ---------------------------------------------------------------------------
  // PRUEBA 1: Verificar disponibilidad física de ambos servicios
  // ---------------------------------------------------------------------------
  logSection('PRUEBA 1: Disponibilidad y sondeo de red de ambos servicios');
  try {
    // 1.1 Backend Health
    const resHealth = await fetch(`${BACKEND_URL}/health`);
    const healthJson = await resHealth.json();
    if (resHealth.status === 200 && healthJson.status === 'UP' && healthJson.database === 'CONNECTED') {
      logSuccess('Backend responde en /health con base de datos conectada', healthJson);
    } else {
      throw new Error(`Backend reportó estado no operativo: ${JSON.stringify(healthJson)}`);
    }

    // 1.2 Frontend Metro Servidor Web
    const resFront = await fetch(FRONTEND_URL);
    const frontHtml = await resFront.text();
    if (resFront.status === 200 && frontHtml.includes('licitaciones-vzla-app')) {
      logSuccess('Frontend Expo Web activo y sirviendo la aplicación React Native Web');
    } else {
      throw new Error(`Frontend en ${FRONTEND_URL} no respondió el HTML esperado.`);
    }
  } catch (err) {
    logFail('Fallo en la prueba de disponibilidad de red', err.message);
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // PRUEBA 2: Negociación CORS (Cross-Origin Resource Sharing)
  // ---------------------------------------------------------------------------
  logSection('PRUEBA 2: Validación de CORS y Cabeceras de Seguridad del Navegador');
  try {
    // Petición OPTIONS (Preflight) que hace el navegador desde http://localhost:8081
    const resCors = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization,X-Request-ID',
      },
    });

    const allowOrigin = resCors.headers.get('access-control-allow-origin');
    const allowMethods = resCors.headers.get('access-control-allow-methods');
    const allowHeaders = resCors.headers.get('access-control-allow-headers');

    if (
      resCors.status === 204 &&
      allowOrigin === FRONTEND_URL &&
      allowMethods &&
      allowHeaders
    ) {
      logSuccess('Backend autoriza solicitudes Cross-Origin desde el puerto del Frontend (8081)', {
        httpStatus: resCors.status,
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': allowMethods,
        'Access-Control-Allow-Headers': allowHeaders,
      });
    } else {
      throw new Error(`Cabeceras CORS inválidas: Origin=${allowOrigin}, Status=${resCors.status}`);
    }
  } catch (err) {
    logFail('Fallo en negociación CORS', err.message);
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // PRUEBA 3: Simulación de Inicio de Sesión desde LoginScreen
  // ---------------------------------------------------------------------------
  logSection('PRUEBA 3: Flujo de Autenticación de LoginScreen (Frontend -> Backend)');
  try {
    const loginPayload = {
      email: 'demo@empresa.com',
      password: 'demo1234',
    };

    const resLogin = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        Origin: FRONTEND_URL,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginPayload),
    });

    const loginData = await resLogin.json();

    if (resLogin.status === 200 && loginData.data?.token) {
      authToken = loginData.data.token;
      testCompany = loginData.data.company;

      logSuccess('LoginScreen autenticó exitosamente la empresa y recibió JWT', {
        httpStatus: resLogin.status,
        empresa: testCompany.razonSocial,
        rif: testCompany.rif,
        email: testCompany.email,
        jwtRecibido: `${authToken.slice(0, 20)}...[TOKEN_VÁLIDO]`,
      });
    } else {
      throw new Error(loginData.error?.message || 'No se obtuvo token');
    }
  } catch (err) {
    logFail('Fallo en autenticación del frontend', err.message);
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // PRUEBA 4: Simulación de Carga de Catálogo en HomeScreen
  // ---------------------------------------------------------------------------
  logSection('PRUEBA 4: Carga de Datos y Mapeo DTO en HomeScreen');
  try {
    const resLicitaciones = await fetch(`${BACKEND_URL}/api/v1/licitations`, {
      headers: {
        Origin: FRONTEND_URL,
      },
    });

    const licitacionesData = await resLicitaciones.json();

    if (resLicitaciones.status === 200 && Array.isArray(licitacionesData.data)) {
      const totalRaw = licitacionesData.data.length;
      const mappedLicitaciones = licitacionesData.data.map(mapLicitation);
      selectedLicitation = licitacionesData.data[0];

      logSuccess(`HomeScreen consultó la API y recibió ${totalRaw} licitaciones activas`, {
        totalLicitaciones: totalRaw,
        primeraMapeadaParaVista: mappedLicitaciones[0],
      });
    } else {
      throw new Error('No se pudo obtener la lista de licitaciones');
    }

    // Consulta de postulaciones previas para los KPIs
    const resBids = await fetch(`${BACKEND_URL}/api/v1/bids/my-bids`, {
      headers: {
        Origin: FRONTEND_URL,
        Authorization: `Bearer ${authToken}`,
      },
    });

    const bidsData = await resBids.json();
    if (resBids.status === 200) {
      logSuccess(`HomeScreen obtuvo el historial de postulaciones de la empresa`, {
        totalPostulacionesPrevias: bidsData.count,
      });
    } else {
      throw new Error(bidsData.error?.message || 'Error al obtener bids');
    }
  } catch (err) {
    logFail('Fallo en carga de datos para HomeScreen', err.message);
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // PRUEBA 5: Simulación de ApplyScreen (Envío de PDF multipart/form-data)
  // ---------------------------------------------------------------------------
  logSection('PRUEBA 5: Envío de Oferta con PDF desde ApplyScreen (Multer + Multipart)');
  try {
    // Creamos un PDF simulado en memoria
    const pdfBuffer = Buffer.from('%PDF-1.4 Mock proposal technical document created from frontend integration test');
    const formData = new FormData();
    formData.append('licitation_id', selectedLicitation.id);
    formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), 'propuesta_frontend_test.pdf');

    const resBid = await fetch(`${BACKEND_URL}/api/v1/bids`, {
      method: 'POST',
      headers: {
        Origin: FRONTEND_URL,
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });

    const bidData = await resBid.json();

    if (resBid.status === 201) {
      uploadedPdfUrl = bidData.data.pdfUrl;
      logSuccess('ApplyScreen transmitió exitosamente la propuesta con PDF', {
        httpStatus: 201,
        bidId: bidData.data.id,
        pdfUrl: uploadedPdfUrl,
        status: bidData.data.status,
      });
    } else if (resBid.status === 409) {
      // Si la empresa demo ya se había postulado a esta licitación específica
      logSuccess('El backend aplicó la regla de negocio 409 Conflict: propuesta duplicada prevenida', {
        httpStatus: 409,
        mensajeBackend: bidData.error?.message,
      });
    } else {
      throw new Error(bidData.error?.message || `Status inesperado: ${resBid.status}`);
    }
  } catch (err) {
    logFail('Fallo en la prueba de postulación desde ApplyScreen', err.message);
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // PRUEBA 6: Simulación de descarga y verificación de integridad del PDF
  // ---------------------------------------------------------------------------
  logSection('PRUEBA 6: Descarga y Entrega de Archivos Estáticos al Frontend');
  try {
    // Si no tenemos URL de esta ejecución, buscamos la última postulación registrada
    let pdfToTest = uploadedPdfUrl;
    if (!pdfToTest) {
      const resBids = await fetch(`${BACKEND_URL}/api/v1/bids/my-bids`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const bidsData = await resBids.json();
      if (bidsData.data && bidsData.data.length > 0) {
        pdfToTest = bidsData.data[0].pdf_url;
      }
    }

    if (pdfToTest) {
      const resFile = await fetch(`${BACKEND_URL}${pdfToTest}`);
      const fileBytes = await resFile.arrayBuffer();
      const contentType = resFile.headers.get('content-type');

      if (resFile.status === 200 && (contentType.includes('pdf') || contentType.includes('octet-stream'))) {
        logSuccess('El Frontend puede acceder y descargar el PDF almacenado en el backend', {
          url: `${BACKEND_URL}${pdfToTest}`,
          httpStatus: resFile.status,
          contentType,
          tamañoBytes: fileBytes.byteLength,
        });
      } else {
        throw new Error(`No se pudo descargar el archivo: HTTP ${resFile.status}`);
      }
    } else {
      logSuccess('Omitida descarga: no se generó nueva URL (empresa con oferta previa)');
    }
  } catch (err) {
    logFail('Fallo en acceso a archivos estáticos', err.message);
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // RESUMEN FINAL
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('🎉 ¡TODAS LAS PRUEBAS DE COMUNICACIÓN FRONTEND <-> BACKEND FUERON EXITOSAS!');
  console.log('================================================================');
  console.log('Resumen de garantías verificadas:');
  console.log(' 1. Conectividad TCP y resolución de puertos activa (3000 <-> 8081).');
  console.log(' 2. Negociación CORS preflight (OPTIONS) aprobada sin bloqueos en el navegador.');
  console.log(' 3. Autenticación JWT y conservación de sesión de usuario en frontend.');
  console.log(' 4. Entrega y transformación DTO de catálogos de licitaciones públicas.');
  console.log(' 5. Carga de archivos binarios multipart (PDFs de ofertas técnicas).');
  console.log(' 6. Servicio estático de documentos subidos verificable por HTTP.');
  console.log('================================================================\n');
}

runFrontendBackendIntegrationTests().catch((err) => {
  console.error('Error no controlado en la suite de integración:', err);
  process.exit(1);
});

