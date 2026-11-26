/*
 * Servidor de sincronización de la app de tarjetas.
 *
 * Guarda UNA copia de los datos (tarjetas + progreso) por código de sincronización.
 * No hay usuarios ni contraseñas: el código es la llave. En la base no se guarda el
 * código sino su "huella" (SHA-256), así que mirando la base no se puede sacar el código.
 *
 *   GET  /datos   (encabezado X-Codigo)  → devuelve los datos guardados, o null
 *   PUT  /datos   (encabezado X-Codigo)  → guarda los datos (JSON) que manda la app
 *
 * Quien combina los datos de los dos aparatos es la app (srs.js → combinarDatos).
 */
const ORIGENES = [
  'https://xfrodriguez03-cmd.github.io',
  'http://localhost:8095',
  'http://127.0.0.1:8095',
];
const CODIGO_VALIDO = /^[a-hjkmnp-z2-9]{16}$/; // 16 caracteres, sin 0/o/1/l/i para no confundirse
const MAXIMO = 2 * 1024 * 1024; // 2 MB alcanza para miles de tarjetas

export default {
  async fetch(req, env) {
    const origen = req.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ORIGENES.includes(origen) ? origen : ORIGENES[0],
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Codigo',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };
    const responder = (cuerpo, estado = 200) =>
      new Response(typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo), {
        status: estado,
        headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      });

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(req.url);
    if (url.pathname !== '/datos') return responder({ error: 'no encontrado' }, 404);

    const codigo = (req.headers.get('X-Codigo') || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!CODIGO_VALIDO.test(codigo)) return responder({ error: 'código inválido' }, 400);
    const clave = 'v1:' + (await huella(codigo));

    if (req.method === 'GET') {
      const guardado = await env.SYNC.get(clave);
      return responder(guardado || 'null');
    }

    if (req.method === 'PUT') {
      const texto = await req.text();
      if (texto.length > MAXIMO) return responder({ error: 'demasiado grande' }, 413);
      let datos;
      try { datos = JSON.parse(texto); } catch { return responder({ error: 'no es JSON' }, 400); }
      if (!datos || !Array.isArray(datos.cards) || typeof datos.progress !== 'object') {
        return responder({ error: 'formato inválido' }, 400);
      }
      await env.SYNC.put(clave, texto);
      return responder({ ok: true, guardado: new Date().toISOString() });
    }

    return responder({ error: 'método no permitido' }, 405);
  },
};

async function huella(texto) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('portugues-tarjetas:' + texto));
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}
