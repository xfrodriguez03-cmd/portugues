/*
 * srs.js — el "cerebro" del repaso espaciado (SM-2 simplificado).
 *
 * Cada tarjeta se estudia en dos direcciones (pt-es y es-pt). Cada dirección
 * es un "ítem" con su propio progreso:
 *   { state, due, interval, ease, reps, lapses, seen, last }
 *   - state:    'new' | 'learning' | 'review'
 *   - due:      fecha (AAAA-MM-DD) en la que te la vuelve a mostrar
 *   - interval: cuántos días hasta el próximo repaso
 *   - ease:     qué tan fácil es para vos (sube si la sabés, baja si no)
 *
 * Calificaciones: 0 = "No la sabía", 1 = "Más o menos", 2 = "La sabía".
 *
 * Este archivo no toca la pantalla: así se puede probar con Node
 * (ver pruebas.js).
 */
(function (root) {
  'use strict';

  const DIRS = ['pt-es', 'es-pt'];
  const EASE_INICIAL = 2.5;
  const EASE_MIN = 1.3;
  const EASE_MAX = 3.0;
  const INTERVALO_MAX = 120; // días
  const APRENDIDA_DESDE = 3;  // días de intervalo para contarla como "aprendida"

  // ---------- Fechas (siempre en hora local, formato AAAA-MM-DD) ----------
  function hoy(d) {
    d = d || new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + dia;
  }

  function sumarDias(fecha, n) {
    const [a, m, d] = fecha.split('-').map(Number);
    return hoy(new Date(a, m - 1, d + n));
  }

  function diasEntre(desde, hasta) {
    const [a1, m1, d1] = desde.split('-').map(Number);
    const [a2, m2, d2] = hasta.split('-').map(Number);
    return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000);
  }

  // ---------- Progreso ----------
  function progresoNuevo() {
    return { state: 'new', due: null, interval: 0, ease: EASE_INICIAL, reps: 0, lapses: 0, seen: null, last: null };
  }

  function clave(cardId, dir) {
    return cardId + ':' + dir;
  }

  // Devuelve el progreso nuevo después de calificar (no modifica el original).
  function calificar(p, nota, fecha) {
    const q = Object.assign(progresoNuevo(), p);
    const eraNueva = q.state === 'new';
    if (eraNueva) q.seen = fecha;
    q.last = fecha;

    if (nota === 0) {
      // No la sabía: vuelve hoy mismo (más tarde en la sesión).
      if (!eraNueva && q.state === 'review') q.lapses += 1;
      q.reps = 0;
      q.interval = 0;
      q.ease = Math.max(EASE_MIN, q.ease - 0.2);
      q.state = 'learning';
      q.due = fecha;
    } else if (nota === 1) {
      // Más o menos: avanza poquito.
      q.ease = Math.max(EASE_MIN, q.ease - 0.15);
      q.interval = q.interval < 1 ? 1 : Math.max(q.interval + 1, Math.round(q.interval * 1.2));
      q.reps += 1;
      q.state = 'review';
    } else {
      // La sabía: avanza según la facilidad.
      if (q.interval < 1) {
        // Si la sabías de entrada, 3 días; si la venías aprendiendo, mañana.
        q.interval = eraNueva ? 3 : 1;
      } else {
        q.interval = Math.max(q.interval + 1, Math.round(q.interval * q.ease));
      }
      q.ease = Math.min(EASE_MAX, q.ease + 0.05);
      q.reps += 1;
      q.state = 'review';
    }

    if (nota > 0) {
      q.interval = Math.min(q.interval, INTERVALO_MAX);
      q.due = sumarDias(fecha, q.interval);
    }
    return q;
  }

  // Texto corto para mostrar en cada botón: "hoy", "1 d", "2 sem"...
  function textoIntervalo(dias) {
    if (dias <= 0) return 'hoy';
    if (dias === 1) return 'mañana';
    if (dias < 14) return dias + ' días';
    if (dias < 60) return Math.round(dias / 7) + ' sem';
    return Math.round(dias / 30) + ' meses';
  }

  // ---------- Armar la sesión del día ----------
  // opts: { fecha, dirs: ['pt-es','es-pt'], limiteNuevas, nuevasHoy, mazo (null = todos) }
  function armarCola(cards, progress, opts) {
    const fecha = opts.fecha;
    const dirs = opts.dirs && opts.dirs.length ? opts.dirs : DIRS;
    const ambas = dirs.length > 1;
    const lista = cards.filter(c => !opts.mazo || c.deck === opts.mazo);

    const repasos = [];
    const nuevasPosibles = [];

    // Las nuevas van primero en pt-es (todas), después es-pt.
    for (const dir of dirs) {
      for (const card of lista) {
        const p = progress[clave(card.id, dir)];
        if (p && p.state !== 'new') {
          if (p.due && p.due <= fecha) repasos.push({ card, dir });
        } else {
          nuevasPosibles.push({ card, dir });
        }
      }
    }

    const enCola = new Set(repasos.map(i => i.card.id));
    const libres = Math.max(0, (opts.limiteNuevas || 0) - (opts.nuevasHoy || 0));
    const nuevas = [];
    for (const item of nuevasPosibles) {
      if (nuevas.length >= libres) break;
      // Nunca las dos direcciones de la misma tarjeta el mismo día.
      if (enCola.has(item.card.id)) continue;
      // Con ambas direcciones, es-pt aparece recién cuando ya viste pt-es otro día.
      if (ambas && item.dir === 'es-pt') {
        const ida = progress[clave(item.card.id, 'pt-es')];
        if (!ida || ida.state === 'new' || !ida.seen || ida.seen >= fecha) continue;
      }
      nuevas.push(item);
      enCola.add(item.card.id);
    }

    return { repasos: mezclar(repasos), nuevas };
  }

  // ---------- Práctica libre (cuando ya terminaste lo del día) ----------
  // Elige tarjetas que ya viste, primero las que más te cuestan (facilidad baja,
  // olvidos, falladas hace poco), con un poco de azar para que no sea siempre igual.
  // Si todavía no viste ninguna, usa tarjetas nuevas en portugués → español.
  // Una sola dirección por tarjeta, así una no te "sopla" la otra.
  // opts: { dirs, mazo, cantidad, rng }
  function armarPractica(cards, progress, opts) {
    const rng = opts.rng || Math.random;
    const dirs = opts.dirs && opts.dirs.length ? opts.dirs : DIRS;
    const lista = cards.filter(c => !opts.mazo || c.deck === opts.mazo);
    const cantidad = opts.cantidad || 15;
    let items = [];
    for (const card of lista) {
      for (const dir of dirs) {
        const p = progress[clave(card.id, dir)];
        if (!p || p.state === 'new') continue;
        const dificultad = (EASE_MAX - p.ease) + p.lapses * 0.5 + (p.state === 'learning' ? 1 : 0) + rng() * 0.6;
        items.push({ card, dir, dificultad });
      }
    }
    if (!items.length) {
      const dir = dirs.includes('pt-es') ? 'pt-es' : dirs[0];
      items = lista.map(card => ({ card, dir, dificultad: rng() }));
    }
    items.sort((a, b) => b.dificultad - a.dificultad);
    const usadas = new Set();
    const elegidas = [];
    for (const it of items) {
      if (elegidas.length >= cantidad) break;
      if (usadas.has(it.card.id)) continue;
      usadas.add(it.card.id);
      elegidas.push({ card: it.card, dir: it.dir });
    }
    return mezclar(elegidas, rng);
  }

  // Una tarjeta está "aprendida" cuando todas sus direcciones activas
  // ya tienen un intervalo de 3 días o más.
  function estaAprendida(card, progress, dirs) {
    dirs = dirs && dirs.length ? dirs : DIRS;
    return dirs.every(dir => {
      const p = progress[clave(card.id, dir)];
      return p && p.state === 'review' && p.interval >= APRENDIDA_DESDE;
    });
  }

  // Racha: días seguidos estudiando. Si hoy todavía no estudiaste,
  // la racha sigue viva si estudiaste ayer.
  function racha(dias, fecha) {
    const set = new Set(dias || []);
    let dia = set.has(fecha) ? fecha : sumarDias(fecha, -1);
    let n = 0;
    while (set.has(dia)) {
      n += 1;
      dia = sumarDias(dia, -1);
    }
    return n;
  }

  // ---------- Quiz: 4 opciones ----------
  function respuesta(card, dir) {
    return dir === 'pt-es' ? card.es : card.pt;
  }

  function opcionesQuiz(card, dir, cards, rng) {
    const correcta = respuesta(card, dir);
    const norm = s => String(s).trim().toLowerCase();
    const vistas = new Set([norm(correcta)]);
    const candidatas = [];
    // Primero del mismo mazo, después del resto.
    const orden = mezclar(cards.filter(c => c.deck === card.deck), rng)
      .concat(mezclar(cards.filter(c => c.deck !== card.deck), rng));
    for (const c of orden) {
      if (c.id === card.id) continue;
      const r = respuesta(c, dir);
      if (!r || vistas.has(norm(r))) continue;
      vistas.add(norm(r));
      candidatas.push(r);
      if (candidatas.length === 3) break;
    }
    return mezclar([correcta].concat(candidatas), rng);
  }

  // ---------- Importar texto "portugués | español | nota" ----------
  function parsearTexto(texto) {
    const tarjetas = [];
    const errores = [];
    String(texto).split(/\r?\n/).forEach((linea, i) => {
      const limpia = linea.trim();
      if (!limpia || limpia.startsWith('#')) return;
      const partes = limpia.split('|').map(s => s.trim());
      if (partes.length < 2 || !partes[0] || !partes[1]) {
        errores.push(i + 1);
        return;
      }
      // portugués | español | nota | ejemplo | traducción del ejemplo
      tarjetas.push({ pt: partes[0], es: partes[1], note: partes[2] || '', ex: partes[3] || '', exEs: partes.slice(4).join(' | ').trim() });
    });
    return { tarjetas, errores };
  }

  // ---------- Sincronización: combinar los datos de dos aparatos ----------
  // a y b: { cards, progress, days, log, borradas, reinicio }. Devuelve la combinación,
  // sin perder nada: da lo mismo el orden (combinar(a,b) = combinar(b,a)) y repetirlo.
  //  - Tarjetas: se suman las de los dos lados. Si la misma tarjeta se editó en los dos,
  //    gana la edición más nueva (campo mod). Las borradas (con su fecha) no vuelven.
  //  - Progreso: de cada tarjeta y dirección gana el repaso más reciente.
  //  - Días estudiados: se suman. Contadores del día: el mayor de cada uno.
  function combinarDatos(a, b) {
    a = a || {}; b = b || {};
    const comoTexto = x => JSON.stringify(x);
    const borradas = {};
    for (const src of [a.borradas || {}, b.borradas || {}]) {
      for (const [id, t] of Object.entries(src)) borradas[id] = Math.max(borradas[id] || 0, Number(t) || 0);
    }
    const reinicio = Math.max(Number(a.reinicio) || 0, Number(b.reinicio) || 0);

    // Tarjetas: unión por id
    const porId = new Map();
    for (const c of (a.cards || []).concat(b.cards || [])) {
      if (!c || !c.id) continue;
      const ya = porId.get(c.id);
      if (!ya || (c.mod || 0) > (ya.mod || 0) || ((c.mod || 0) === (ya.mod || 0) && comoTexto(c) > comoTexto(ya))) porId.set(c.id, c);
    }

    // Progreso: el más reciente
    const progress = {};
    const pa = a.progress || {}, pb = b.progress || {};
    for (const k of new Set(Object.keys(pa).concat(Object.keys(pb)))) {
      const p = progresoMasNuevo(pa[k], pb[k]);
      if (p && !(reinicio && (p.ts || 0) < reinicio)) progress[k] = p;
    }

    // Sacar las borradas
    let cards = Array.from(porId.values()).filter(c => !(borradas[c.id] && borradas[c.id] >= (c.mod || 0)));

    // La misma tarjeta cargada por separado en los dos aparatos (ids distintos): queda una,
    // la que más estudiaste.
    const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
    const estudio = c => DIRS.reduce((n, d) => { const p = progress[clave(c.id, d)]; return n + (p ? (p.reps || 0) + (p.lapses || 0) : 0); }, 0);
    const grupos = new Map();
    for (const c of cards) {
      const k = norm(c.deck) + '|' + norm(c.pt) + '|' + norm(c.es);
      if (!grupos.has(k)) grupos.set(k, []);
      grupos.get(k).push(c);
    }
    cards = [];
    for (const grupo of grupos.values()) {
      grupo.sort((x, y) => estudio(y) - estudio(x) || (x.created || 0) - (y.created || 0) || (x.id < y.id ? -1 : 1));
      cards.push(grupo[0]);
    }
    cards.sort((x, y) => (x.created || 0) - (y.created || 0) || (x.id < y.id ? -1 : 1));

    // Progreso de tarjetas que ya no existen: afuera
    const ids = new Set(cards.map(c => c.id));
    for (const k of Object.keys(progress)) if (!ids.has(k.split(':')[0])) delete progress[k];

    const diaReinicio = reinicio ? hoy(new Date(reinicio)) : '';
    const days = Array.from(new Set((a.days || []).concat(b.days || []))).filter(d => d >= diaReinicio).sort();
    const log = {};
    for (const src of [a.log || {}, b.log || {}]) {
      for (const [dia, r] of Object.entries(src)) {
        if (dia < diaReinicio) continue;
        const ya = log[dia] || { nuevas: 0, repasos: 0, extra: 0 };
        log[dia] = { nuevas: Math.max(ya.nuevas, r.nuevas || 0), repasos: Math.max(ya.repasos, r.repasos || 0), extra: Math.max(ya.extra, r.extra || 0) };
      }
    }
    return { cards, progress, days, log, borradas, reinicio };
  }

  function progresoMasNuevo(p, q) {
    if (!p) return q || null;
    if (!q) return p;
    if ((p.ts || 0) !== (q.ts || 0)) return (p.ts || 0) > (q.ts || 0) ? p : q;
    if ((p.last || '') !== (q.last || '')) return (p.last || '') > (q.last || '') ? p : q;
    const rp = (p.reps || 0) + (p.lapses || 0), rq = (q.reps || 0) + (q.lapses || 0);
    if (rp !== rq) return rp > rq ? p : q;
    return JSON.stringify(p) >= JSON.stringify(q) ? p : q;
  }

  // ---------- Utilidades ----------
  function mezclar(arr, rng) {
    rng = rng || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const SRS = {
    DIRS, APRENDIDA_DESDE,
    hoy, sumarDias, diasEntre,
    progresoNuevo, clave, calificar, textoIntervalo,
    armarCola, armarPractica, estaAprendida, racha,
    respuesta, opcionesQuiz, parsearTexto, mezclar, combinarDatos,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = SRS;
  else root.SRS = SRS;
})(typeof self !== 'undefined' ? self : this);
