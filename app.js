/*
 * app.js — la interfaz. Usa SRS (srs.js) para decidir qué tarjeta mostrar.
 * Todo se guarda en localStorage, en una sola clave.
 */
(function () {
  'use strict';

  const CLAVE = 'tarjetas-portugues-v1';
  const MAZO_INICIAL = 'Falsos amigos';
  const SEMILLA = `esquisito | raro | exquisito = delicioso
embaraçado | avergonzado | embarazada = grávida
polvo | pulpo | polvo = pó
pelado | desnudo | pelado = careca
largo | ancho | largo = comprido
apelido | apodo | apellido = sobrenome
oficina | taller mecánico | oficina = escritório
cena | escena | cena = jantar
rato | ratón | un rato = um tempinho
copo | vaso para tomar | vaso = maceta / inodoro
presunto | jamón | presunto = suposto
propina | soborno | propina = gorjeta
sobremesa | postre |
chato | aburrido, pesado | plano = achatado
esperto | vivo, astuto | experto = especialista
ligar | llamar por teléfono |
puxar / empurrar | tirar / empujar (puertas) |
todavia | sin embargo | todavía = ainda
logo | enseguida | luego = depois
acordar | despertarse | acordar = combinar
fechar | cerrar |
pegar | agarrar, tomar | pegar o ônibus = tomar el colectivo
brincar | jugar, bromear | brincar = pular
mala | valija | mala = ruim
roxo | violeta | rojo = vermelho
legal | bueno, copado |`;

  const AJUSTES_BASE = { newPerDay: 15, dirs: 'ambas', modo: 'tarjeta', mazo: '', viaje: '2026-12-22', audio: false, lastBackup: null };

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // ================= Guardado =================
  function tarjetasSemilla() {
    return SRS.parsearTexto(SEMILLA).tarjetas.map((t, i) => ({ id: 's' + (i + 1), pt: t.pt, es: t.es, note: t.note, deck: MAZO_INICIAL, created: i }));
  }

  function normalizar(d) {
    return {
      version: 1,
      cards: Array.isArray(d.cards) ? d.cards.filter(c => c && c.id && c.pt && c.es).map(c => ({ id: String(c.id), pt: String(c.pt), es: String(c.es), note: String(c.note || ''), deck: String(c.deck || MAZO_INICIAL), created: Number(c.created) || 0 })) : [],
      progress: d.progress && typeof d.progress === 'object' ? d.progress : {},
      days: Array.isArray(d.days) ? d.days : [],
      log: d.log && typeof d.log === 'object' ? d.log : {},
      settings: Object.assign({}, AJUSTES_BASE, d.settings || {}),
    };
  }

  function cargar() {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return normalizar({ cards: tarjetasSemilla() });
    try {
      return normalizar(JSON.parse(crudo));
    } catch (e) {
      // Si algo se rompió, guardo la copia vieja aparte y arranco de nuevo.
      localStorage.setItem(CLAVE + '-roto-' + Date.now(), crudo);
      setTimeout(() => aviso('Había un problema con los datos guardados. Arranqué de cero.'), 500);
      return normalizar({ cards: tarjetasSemilla() });
    }
  }

  let estado = cargar();

  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
    } catch (e) {
      aviso('⚠️ No se pudo guardar. Exportá un backup.');
    }
  }
  guardar();

  // ================= Ayudas =================
  const hoy = () => SRS.hoy();
  const aj = () => estado.settings;
  const dirsActivas = () => (aj().dirs === 'ambas' ? ['pt-es', 'es-pt'] : [aj().dirs]);
  const mazos = () => Array.from(new Set(estado.cards.map(c => c.deck))).sort((a, b) => (a === MAZO_INICIAL ? -1 : b === MAZO_INICIAL ? 1 : a.localeCompare(b, 'es')));
  const sinTildes = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const nuevoId = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function registroHoy() {
    const f = hoy();
    if (!estado.log[f]) estado.log[f] = { nuevas: 0, repasos: 0, extra: 0 };
    return estado.log[f];
  }

  function el(tag, clase, texto) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto != null) e.textContent = texto;
    return e;
  }

  let timerAviso;
  function aviso(texto) {
    const t = $('#toast');
    t.textContent = texto;
    t.classList.add('visible');
    clearTimeout(timerAviso);
    timerAviso = setTimeout(() => t.classList.remove('visible'), 2600);
  }

  function colaDeHoy(limiteExtra) {
    const log = estado.log[hoy()] || { nuevas: 0, extra: 0 };
    return SRS.armarCola(estado.cards, estado.progress, {
      fecha: hoy(),
      dirs: dirsActivas(),
      limiteNuevas: limiteExtra != null ? limiteExtra : aj().newPerDay + (log.extra || 0),
      nuevasHoy: log.nuevas || 0,
      mazo: aj().mazo || null,
    });
  }

  // ================= Voz (pronunciación) =================
  const hayVoz = 'speechSynthesis' in window;
  let vozPt = null;
  function buscarVoz() {
    const voces = speechSynthesis.getVoices();
    vozPt = voces.find(v => v.lang === 'pt-BR') || voces.find(v => /^pt[-_]br/i.test(v.lang)) || voces.find(v => /^pt/i.test(v.lang)) || null;
  }
  if (hayVoz) {
    buscarVoz();
    speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', buscarVoz);
  } else {
    document.body.classList.add('sin-voz');
  }
  function hablar(texto) {
    if (!hayVoz || !texto) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto.replace(/\//g, ','));
    u.lang = 'pt-BR';
    if (vozPt) u.voice = vozPt;
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  // ================= Navegación =================
  function mostrarVista(nombre) {
    $$('.vista').forEach(v => v.classList.toggle('activa', v.id === 'vista-' + nombre));
    $$('#pestanas button').forEach(b => b.classList.toggle('activa', b.dataset.vista === nombre));
    document.body.classList.toggle('estudiando', nombre === 'estudio');
    if (nombre === 'inicio') pintarInicio();
    if (nombre === 'tarjetas') pintarLista();
    if (nombre === 'ajustes') pintarAjustes();
    window.scrollTo(0, 0);
  }
  $('#pestanas').addEventListener('click', e => {
    const b = e.target.closest('button[data-vista]');
    if (b) mostrarVista(b.dataset.vista);
  });

  // ================= Inicio =================
  function pintarInicio() {
    // Cuenta regresiva del viaje
    const chip = $('#viaje');
    if (aj().viaje) {
      const d = SRS.diasEntre(hoy(), aj().viaje);
      chip.textContent = d > 1 ? `✈️ Faltan ${d} días` : d === 1 ? '✈️ ¡Mañana viajás!' : d === 0 ? '🇧🇷 ¡Hoy viajás!' : '🇧🇷 Boa viagem!';
      chip.hidden = false;
    } else chip.hidden = true;

    // Mazo
    const lista = mazos();
    if (aj().mazo && !lista.includes(aj().mazo)) { aj().mazo = ''; guardar(); }
    const sel = $('#sel-mazo');
    sel.replaceChildren(new Option('Todos los mazos', ''), ...lista.map(m => new Option(m, m)));
    sel.value = aj().mazo;
    $('#campo-mazo').hidden = lista.length < 2;

    // Modo
    $$('.segmentado button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.modo === aj().modo)));

    // Para hoy
    const cola = colaDeHoy();
    const total = cola.repasos.length + cola.nuevas.length;
    $('#hoy-total').textContent = total;
    const partes = [];
    partes.push(cola.repasos.length === 1 ? '1 repaso' : cola.repasos.length + ' repasos');
    partes.push(cola.nuevas.length === 1 ? '1 nueva' : cola.nuevas.length + ' nuevas');
    $('#hoy-detalle').textContent = total ? partes.join(' · ') : (estado.cards.length ? '¡Hiciste todo lo de hoy! 🎉' : 'Todavía no tenés tarjetas');
    const btn = $('#btn-empezar');
    btn.disabled = total === 0;
    btn.textContent = total ? 'Empezar' : 'Volvé mañana';
    const quedanNuevas = colaDeHoy(9999).nuevas.length > 0;
    $('#btn-mas-nuevas').hidden = !(total === 0 && quedanNuevas);

    // Racha y aprendidas
    $('#racha').textContent = SRS.racha(estado.days, hoy());
    const aprendidas = estado.cards.filter(c => SRS.estaAprendida(c, estado.progress, dirsActivas())).length;
    $('#aprendidas').textContent = aprendidas;
    $('#aprendidas-txt').textContent = `de ${estado.cards.length} aprendidas`;

    // Recordatorio de backup
    const av = $('#backup-aviso');
    const ultimo = aj().lastBackup;
    const diasSin = ultimo ? SRS.diasEntre(ultimo, hoy()) : null;
    if (estado.days.length >= 2 && (diasSin === null || diasSin >= 7)) {
      av.textContent = diasSin === null ? '💾 Todavía no hiciste ningún backup. Hacelo en Ajustes.' : `💾 Hace ${diasSin} días que no hacés backup. Hacelo en Ajustes.`;
      av.hidden = false;
    } else av.hidden = true;
  }

  $('#sel-mazo').addEventListener('change', e => { aj().mazo = e.target.value; guardar(); pintarInicio(); });
  $('.segmentado').addEventListener('click', e => {
    const b = e.target.closest('button[data-modo]');
    if (!b) return;
    aj().modo = b.dataset.modo; guardar(); pintarInicio();
  });
  $('#btn-mas-nuevas').addEventListener('click', () => {
    registroHoy().extra += 5; guardar(); pintarInicio();
    aviso('Listo, 5 nuevas más para hoy');
  });
  $('#btn-empezar').addEventListener('click', empezar);

  // ================= Estudio =================
  let sesion = null;

  function intercalar(repasos, nuevas) {
    // Dos repasos, una nueva, dos repasos, una nueva...
    const out = [];
    let i = 0, j = 0;
    while (i < repasos.length || j < nuevas.length) {
      if (i < repasos.length) out.push(repasos[i++]);
      if (i < repasos.length) out.push(repasos[i++]);
      if (j < nuevas.length) out.push(nuevas[j++]);
    }
    return out;
  }

  function empezar() {
    const c = colaDeHoy();
    const cola = intercalar(c.repasos, c.nuevas);
    if (!cola.length) return;
    sesion = { cola, total: cola.length, terminadas: 0, resultados: [0, 0, 0], modo: aj().modo };
    $('#fin').hidden = true;
    mostrarVista('estudio');
    mostrarActual();
  }

  function salirDelEstudio() {
    if (hayVoz) speechSynthesis.cancel();
    sesion = null;
    mostrarVista('inicio');
  }
  $('#btn-salir').addEventListener('click', salirDelEstudio);
  $('#btn-volver').addEventListener('click', salirDelEstudio);

  function textos(item) {
    const { card, dir } = item;
    return dir === 'pt-es'
      ? { pregunta: card.pt, respuesta: card.es, pt: card.pt }
      : { pregunta: card.es, respuesta: card.pt, pt: card.pt };
  }

  function mostrarActual() {
    const s = sesion;
    $('#barra-progreso').style.width = (s.terminadas / s.total) * 100 + '%';
    $('#contador').textContent = `${s.terminadas}/${s.total}`;
    $('#calificar').hidden = true;
    $('#seguir').hidden = true;

    if (!s.cola.length) return terminar();

    const item = s.cola[0];
    const p = estado.progress[SRS.clave(item.card.id, item.dir)] || SRS.progresoNuevo();
    const t = textos(item);
    const etiqueta = p.state === 'new' ? 'Nueva' : p.state === 'learning' ? 'Otra vez' : 'Repaso';
    $('#direccion').textContent = item.dir === 'pt-es' ? '🇧🇷 Portugués → Español 🇦🇷' : '🇦🇷 Español → Portugués 🇧🇷';

    // Lo que dice cada botón: cuándo vuelve
    $$('#calificar small').forEach(sm => {
      const nota = Number(sm.dataset.int);
      sm.textContent = nota === 0 ? 'en un rato' : SRS.textoIntervalo(SRS.calificar(p, nota, hoy()).interval);
    });

    const modoQuiz = s.modo === 'quiz' && estado.cards.length >= 2;
    $('#zona-tarjeta').hidden = modoQuiz;
    $('#zona-quiz').hidden = !modoQuiz;

    if (modoQuiz) {
      const badge = $('#badge-quiz');
      badge.textContent = etiqueta; badge.classList.toggle('nueva', p.state === 'new');
      $('#quiz-pregunta').textContent = t.pregunta;
      $('[data-hablar=quiz]').hidden = item.dir !== 'pt-es';
      $('#quiz-nota').textContent = '';
      const cont = $('#quiz-opciones');
      cont.replaceChildren(...SRS.opcionesQuiz(item.card, item.dir, estado.cards).map(op => {
        const b = el('button', 'opcion', op);
        b.type = 'button';
        b.dataset.correcta = String(op === t.respuesta);
        return b;
      }));
    } else {
      const tarjeta = $('#tarjeta');
      tarjeta.classList.add('sin-animacion');
      tarjeta.classList.remove('girada');
      const badge = $('#badge-frente');
      badge.textContent = etiqueta; badge.classList.toggle('nueva', p.state === 'new');
      $('#frente-texto').textContent = t.pregunta;
      $('#dorso-pregunta').textContent = t.pregunta;
      $('#dorso-texto').textContent = t.respuesta;
      $('#dorso-nota').textContent = item.card.note ? '💡 ' + item.card.note : '';
      $('[data-hablar=frente]').hidden = item.dir !== 'pt-es';
      $('[data-hablar=dorso]').hidden = item.dir !== 'es-pt';
    }
    if (aj().audio && item.dir === 'pt-es') hablar(t.pt);
  }

  function voltear() {
    if (!sesion || !sesion.cola.length) return;
    const tarjeta = $('#tarjeta');
    const estabaDeFrente = !tarjeta.classList.contains('girada');
    tarjeta.classList.remove('sin-animacion');
    tarjeta.classList.toggle('girada');
    if (estabaDeFrente && $('#calificar').hidden) {
      $('#calificar').hidden = false;
      const item = sesion.cola[0];
      if (aj().audio && item.dir === 'es-pt') hablar(item.card.pt);
    }
  }
  $('#tarjeta').addEventListener('click', e => {
    if (e.target.closest('.btn-audio')) return;
    voltear();
  });

  // Botones 🔊
  document.addEventListener('click', e => {
    const b = e.target.closest('.btn-audio');
    if (!b || !sesion || !sesion.cola.length) return;
    e.stopPropagation();
    hablar(sesion.cola[0].card.pt);
  });

  // Quiz: elegir una opción
  $('#quiz-opciones').addEventListener('click', e => {
    const b = e.target.closest('.opcion');
    if (!b || b.disabled) return;
    const botones = $$('#quiz-opciones .opcion');
    botones.forEach(x => {
      x.disabled = true;
      if (x.dataset.correcta === 'true') x.classList.add('correcta');
    });
    const item = sesion.cola[0];
    if (item.card.note) $('#quiz-nota').textContent = '💡 ' + item.card.note;
    if (aj().audio && item.dir === 'es-pt') hablar(item.card.pt);
    if (b.dataset.correcta === 'true') {
      $('#calificar').hidden = false; // acertaste: decís si la sabías o fue suerte
    } else {
      b.classList.add('incorrecta');
      $('#seguir').hidden = false;    // erraste: cuenta como "No la sabía"
    }
  });
  $('#btn-seguir').addEventListener('click', () => calificarActual(0));

  $('#calificar').addEventListener('click', e => {
    const b = e.target.closest('button[data-nota]');
    if (b) calificarActual(Number(b.dataset.nota));
  });

  function calificarActual(nota) {
    const s = sesion;
    if (!s || !s.cola.length) return;
    const item = s.cola.shift();
    const k = SRS.clave(item.card.id, item.dir);
    const p = estado.progress[k] || SRS.progresoNuevo();
    const f = hoy();
    const log = registroHoy();
    if (p.state === 'new') log.nuevas += 1; else log.repasos += 1;
    estado.progress[k] = SRS.calificar(p, nota, f);
    if (!estado.days.includes(f)) estado.days.push(f);
    s.resultados[nota] += 1;
    if (nota === 0) {
      // Vuelve en la misma sesión, 3 tarjetas más adelante.
      s.cola.splice(Math.min(3, s.cola.length), 0, item);
    } else {
      s.terminadas += 1;
    }
    guardar();
    mostrarActual();
  }

  function terminar() {
    $('#zona-tarjeta').hidden = true;
    $('#zona-quiz').hidden = true;
    $('#direccion').textContent = '';
    $('#fin').hidden = false;
    const [mal, medio, bien] = sesion.resultados;
    const racha = SRS.racha(estado.days, hoy());
    $('#fin-resumen').textContent = `✅ ${bien} la sabía · 🤔 ${medio} más o menos · ❌ ${mal} no la sabía. Racha: ${racha} ${racha === 1 ? 'día' : 'días'} 🔥`;
  }

  // Teclado (para probar en la compu): espacio da vuelta, 1-2-3 califica
  document.addEventListener('keydown', e => {
    if (!document.body.classList.contains('estudiando') || !sesion || !sesion.cola.length) return;
    if (document.querySelector('dialog[open]')) return;
    if (e.key === ' ' || e.key === 'Enter') {
      if (!$('#zona-tarjeta').hidden) { e.preventDefault(); voltear(); }
      else if (!$('#seguir').hidden) { e.preventDefault(); calificarActual(0); }
    } else if (['1', '2', '3'].includes(e.key) && !$('#calificar').hidden) {
      calificarActual(Number(e.key) - 1);
    } else if (e.key === 'Escape') salirDelEstudio();
  });

  // ================= Lista de tarjetas =================
  function estadoTarjeta(card) {
    const ps = dirsActivas().map(d => estado.progress[SRS.clave(card.id, d)]).filter(p => p && p.state !== 'new');
    if (!ps.length) return { texto: 'Nueva', clase: '' };
    const prox = ps.map(p => p.due).sort()[0];
    const dias = SRS.diasEntre(hoy(), prox);
    if (dias <= 0) return { texto: 'Hoy', clase: 'hoy-toca' };
    const ok = SRS.estaAprendida(card, estado.progress, dirsActivas());
    return { texto: (ok ? '✓ ' : '') + (dias === 1 ? 'mañana' : `en ${dias} días`), clase: ok ? 'ok' : '' };
  }

  function pintarLista() {
    const q = sinTildes($('#buscar').value.trim());
    $('#total-tarjetas').textContent = estado.cards.length === 1 ? '1 tarjeta' : `${estado.cards.length} tarjetas`;
    $('#lista-mazos').replaceChildren(...mazos().map(m => new Option(m)));
    const cont = $('#lista');
    cont.replaceChildren();
    let hay = false;
    for (const mazo of mazos()) {
      const cards = estado.cards
        .filter(c => c.deck === mazo)
        .filter(c => !q || sinTildes(c.pt + ' ' + c.es + ' ' + c.note).includes(q))
        .sort((a, b) => a.created - b.created);
      if (!cards.length) continue;
      hay = true;
      const titulo = el('div', 'grupo-titulo');
      titulo.append(el('span', null, mazo), el('span', null, String(cards.length)));
      cont.append(titulo);
      for (const c of cards) {
        const b = el('button', 'item');
        b.type = 'button';
        b.dataset.id = c.id;
        const textosItem = el('div', 'item-textos');
        textosItem.append(el('p', 'item-pt', c.pt), el('p', 'item-es', c.es));
        if (c.note) textosItem.append(el('p', 'item-nota', c.note));
        const est = estadoTarjeta(c);
        b.append(textosItem, el('span', 'estado ' + est.clase, est.texto));
        cont.append(b);
      }
    }
    if (!hay) cont.append(el('p', 'vacio', q ? 'No encontré ninguna tarjeta con eso.' : 'No tenés tarjetas. Agregá una o pegá una tanda.'));
  }
  $('#buscar').addEventListener('input', pintarLista);
  $('#lista').addEventListener('click', e => {
    const b = e.target.closest('.item');
    if (b) abrirEditar(b.dataset.id);
  });

  // ----- Agregar / editar -----
  let editando = null;
  const dlgT = $('#dlg-tarjeta');
  const formT = $('#form-tarjeta');

  function abrirNueva() {
    editando = null;
    formT.reset();
    formT.deck.value = aj().mazo || MAZO_INICIAL;
    $('#dlg-tarjeta-titulo').textContent = 'Nueva tarjeta';
    $('#dlg-tarjeta-estado').textContent = '';
    $('#btn-borrar').hidden = true;
    dlgT.showModal();
  }

  function abrirEditar(id) {
    const c = estado.cards.find(x => x.id === id);
    if (!c) return;
    editando = id;
    formT.pt.value = c.pt; formT.es.value = c.es; formT.note.value = c.note; formT.deck.value = c.deck;
    $('#dlg-tarjeta-titulo').textContent = 'Editar tarjeta';
    const vistas = dirsActivas().map(d => estado.progress[SRS.clave(c.id, d)]).filter(Boolean).reduce((n, p) => n + p.reps + p.lapses, 0);
    $('#dlg-tarjeta-estado').textContent = `Estado: ${estadoTarjeta(c).texto}${vistas ? ` · la acertaste ${vistas === 1 ? '1 vez' : vistas + ' veces'}` : ''}. Editarla no borra el progreso.`;
    $('#btn-borrar').hidden = false;
    dlgT.showModal();
  }

  $('#btn-agregar').addEventListener('click', abrirNueva);

  formT.addEventListener('submit', e => {
    e.preventDefault();
    const datos = { pt: formT.pt.value.trim(), es: formT.es.value.trim(), note: formT.note.value.trim(), deck: formT.deck.value.trim() || MAZO_INICIAL };
    if (!datos.pt || !datos.es) return aviso('Completá portugués y español');
    const repetida = estado.cards.find(c => c.id !== editando && c.deck === datos.deck && sinTildes(c.pt) === sinTildes(datos.pt) && sinTildes(c.es) === sinTildes(datos.es));
    if (repetida) return aviso('Esa tarjeta ya está en el mazo');
    if (editando) {
      Object.assign(estado.cards.find(c => c.id === editando), datos);
      aviso('Tarjeta guardada');
    } else {
      estado.cards.push(Object.assign({ id: nuevoId(), created: Date.now() }, datos));
      aviso('Tarjeta agregada');
    }
    guardar();
    dlgT.close();
    pintarLista();
  });

  $('#btn-borrar').addEventListener('click', () => {
    const c = estado.cards.find(x => x.id === editando);
    if (!c || !confirm(`¿Borrar "${c.pt}"? También se borra su progreso.`)) return;
    estado.cards = estado.cards.filter(x => x.id !== c.id);
    SRS.DIRS.forEach(d => delete estado.progress[SRS.clave(c.id, d)]);
    guardar();
    dlgT.close();
    pintarLista();
    aviso('Tarjeta borrada');
  });

  $$('[data-cerrar]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
  // Tocar afuera de la ventana la cierra
  $$('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

  // ----- Pegar tanda -----
  const dlgI = $('#dlg-importar');
  const formI = $('#form-importar');

  function analizarTanda() {
    const { tarjetas, errores } = SRS.parsearTexto(formI.texto.value);
    const deck = formI.deck.value.trim() || MAZO_INICIAL;
    const existentes = new Set(estado.cards.filter(c => c.deck === deck).map(c => sinTildes(c.pt) + '|' + sinTildes(c.es)));
    const nuevas = [];
    let repetidas = 0;
    for (const t of tarjetas) {
      const k = sinTildes(t.pt) + '|' + sinTildes(t.es);
      if (existentes.has(k)) { repetidas++; continue; }
      existentes.add(k);
      nuevas.push(t);
    }
    return { nuevas, repetidas, errores, deck };
  }

  function vistaPreviaTanda() {
    const r = analizarTanda();
    const partes = [];
    if (r.nuevas.length) partes.push(`Se van a agregar ${r.nuevas.length} ${r.nuevas.length === 1 ? 'tarjeta' : 'tarjetas'}`);
    if (r.repetidas) partes.push(`${r.repetidas} ya estaban`);
    if (r.errores.length) partes.push(`líneas sin "|" o incompletas: ${r.errores.join(', ')}`);
    $('#importar-vista').textContent = partes.join(' · ');
  }

  $('#btn-importar-texto').addEventListener('click', () => {
    formI.reset();
    formI.deck.value = aj().mazo || MAZO_INICIAL;
    $('#importar-vista').textContent = '';
    dlgI.showModal();
  });
  formI.texto.addEventListener('input', vistaPreviaTanda);
  formI.deck.addEventListener('input', vistaPreviaTanda);

  formI.addEventListener('submit', e => {
    e.preventDefault();
    const r = analizarTanda();
    if (!r.nuevas.length) return aviso(r.repetidas ? 'Esas tarjetas ya estaban' : 'No encontré tarjetas para agregar');
    const base = Date.now();
    r.nuevas.forEach((t, i) => estado.cards.push({ id: nuevoId() + i, pt: t.pt, es: t.es, note: t.note, deck: r.deck, created: base + i }));
    guardar();
    dlgI.close();
    pintarLista();
    aviso(`Agregué ${r.nuevas.length} ${r.nuevas.length === 1 ? 'tarjeta' : 'tarjetas'} a "${r.deck}"`);
  });

  // ================= Ajustes =================
  function pintarAjustes() {
    $('#aj-nuevas').value = aj().newPerDay;
    $('#aj-dir').value = aj().dirs;
    $('#aj-viaje').value = aj().viaje || '';
    $('#aj-audio').checked = !!aj().audio;
    $('#aj-audio').closest('label').hidden = !hayVoz;
    const u = aj().lastBackup;
    $('#ultimo-backup').textContent = u ? `Último backup: ${u.split('-').reverse().join('/')}` : 'Todavía no hiciste ningún backup.';
  }

  $('#aj-nuevas').addEventListener('change', e => {
    const n = Math.max(0, Math.min(200, Math.round(Number(e.target.value)) || 0));
    aj().newPerDay = n; e.target.value = n; guardar(); aviso(`${n} nuevas por día`);
  });
  $('#aj-dir').addEventListener('change', e => { aj().dirs = e.target.value; guardar(); aviso('Dirección guardada'); });
  $('#aj-viaje').addEventListener('change', e => { aj().viaje = e.target.value; guardar(); aviso('Fecha guardada'); });
  $('#aj-audio').addEventListener('change', e => { aj().audio = e.target.checked; guardar(); if (e.target.checked) hablar('Olá! Tudo bem?'); });

  // ----- Backup -----
  async function exportar() {
    const datos = JSON.stringify(Object.assign({ app: 'tarjetas-portugues', exportado: new Date().toISOString() }, estado), null, 2);
    const nombre = `backup-portugues-${hoy()}.json`;
    const archivo = new File([datos], nombre, { type: 'application/json' });
    const marcar = () => { aj().lastBackup = hoy(); guardar(); pintarAjustes(); };
    // En el iPhone abre el menú "Compartir" (Guardar en Archivos, WhatsApp, Mail...)
    const esCelular = matchMedia('(pointer: coarse)').matches;
    if (esCelular && navigator.canShare && navigator.canShare({ files: [archivo] })) {
      try {
        await navigator.share({ files: [archivo], title: nombre });
        marcar(); aviso('Backup listo ✅');
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    const url = URL.createObjectURL(archivo);
    const a = el('a');
    a.href = url; a.download = nombre;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    marcar(); aviso('Backup descargado ✅');
  }
  $('#btn-exportar').addEventListener('click', exportar);

  $('#btn-importar').addEventListener('click', () => $('#archivo-backup').click());
  $('#archivo-backup').addEventListener('change', async e => {
    const archivo = e.target.files[0];
    e.target.value = '';
    if (!archivo) return;
    let datos;
    try {
      datos = JSON.parse(await archivo.text());
    } catch (err) {
      return aviso('Ese archivo no es un backup válido');
    }
    if (!datos || !Array.isArray(datos.cards) || typeof datos.progress !== 'object') return aviso('Ese archivo no es un backup de esta app');
    const fecha = datos.exportado ? new Date(datos.exportado).toLocaleDateString('es-AR') : 'fecha desconocida';
    if (!confirm(`Este backup tiene ${datos.cards.length} tarjetas (del ${fecha}).\nReemplaza TODO lo que tenés ahora en la app. ¿Seguimos?`)) return;
    estado = normalizar(datos);
    guardar();
    pintarAjustes();
    aviso('Backup importado ✅');
  });

  // ----- Zona peligrosa -----
  $('#btn-reiniciar').addEventListener('click', () => {
    if (!confirm('¿Reiniciar todo el progreso? Las tarjetas quedan, pero vuelven a ser nuevas y se pierde la racha.')) return;
    estado.progress = {}; estado.days = []; estado.log = {};
    guardar(); aviso('Progreso reiniciado');
  });
  $('#btn-restaurar').addEventListener('click', () => {
    const ids = new Set(estado.cards.map(c => c.id));
    const faltan = tarjetasSemilla().filter(c => !ids.has(c.id));
    if (!faltan.length) return aviso('Ya tenés todas las tarjetas del mazo inicial');
    estado.cards.push(...faltan);
    guardar(); aviso(`Recuperé ${faltan.length} ${faltan.length === 1 ? 'tarjeta' : 'tarjetas'}`);
  });

  // ================= Arranque =================
  // Si la app quedó abierta de un día para el otro, refresca "para hoy" al volver.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && $('#vista-inicio').classList.contains('activa')) pintarInicio();
  });

  // Pedirle al navegador que no borre los datos si le falta espacio
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  // Service worker: guarda la app en el teléfono para que ande sin internet
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  pintarInicio();
})();
