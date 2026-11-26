/*
 * app.js — la interfaz. Usa SRS (srs.js) para decidir qué tarjeta mostrar.
 * Todo se guarda en localStorage, en una sola clave.
 */
(function () {
  'use strict';

  const CLAVE = 'tarjetas-portugues-v1';
  const MAZO_INICIAL = 'Falsos amigos';
  // Formato: portugués | español | nota | ejemplo en portugués | traducción del ejemplo
  const SEMILLA = `esquisito | raro | exquisito = delicioso | Que cheiro esquisito! Acho que o leite estragou. | ¡Qué olor raro! Creo que la leche se echó a perder.
embaraçado | avergonzado | embarazada = grávida | Fiquei embaraçado quando errei o nome dela. | Me dio vergüenza cuando me equivoqué con su nombre.
polvo | pulpo | polvo = pó | O polvo grelhado desse restaurante é uma delícia. | El pulpo a la parrilla de este restaurante es una delicia.
pelado | desnudo | pelado = careca | Ele saiu do banho e andou pelado pela casa. | Salió de la ducha y anduvo desnudo por la casa.
largo | ancho | largo = comprido | O corredor é largo, cabem duas pessoas lado a lado. | El pasillo es ancho, entran dos personas una al lado de la otra.
apelido | apodo | apellido = sobrenome | O apelido dele é Juninho, mas o nome é João. | Su apodo es Juninho, pero se llama João.
oficina | taller mecánico | oficina = escritório | Levei o carro na oficina porque o freio estava fazendo barulho. | Llevé el auto al taller porque el freno hacía ruido.
cena | escena | cena = jantar | Essa cena do filme me fez chorar. | Esa escena de la película me hizo llorar.
rato | ratón | un rato = um tempinho | Vi um rato correndo na cozinha! | ¡Vi un ratón corriendo en la cocina!
copo | vaso para tomar | vaso = maceta / inodoro | Me vê um copo de água, por favor? | ¿Me das un vaso de agua, por favor?
presunto | jamón | presunto = suposto | Quero um sanduíche de presunto e queijo. | Quiero un sándwich de jamón y queso.
propina | soborno | propina = gorjeta | O policial foi preso por aceitar propina. | El policía fue detenido por aceptar un soborno.
sobremesa | postre | | De sobremesa, vou querer pudim. | De postre, voy a querer flan.
chato | aburrido, pesado | plano = achatado | Esse filme é muito chato, vamos trocar? | Esta película es muy aburrida, ¿cambiamos?
esperto | vivo, astuto | experto = especialista | Ele é muito esperto, sempre acha um jeito de resolver tudo. | Es muy vivo, siempre encuentra la forma de resolver todo.
ligar | llamar por teléfono | | Vou te ligar quando chegar no hotel. | Te voy a llamar cuando llegue al hotel.
puxar / empurrar | tirar / empujar (puertas) | | Essa porta é de puxar, não de empurrar. | Esta puerta es para tirar, no para empujar.
todavia | sin embargo | todavía = ainda | O hotel é caro; todavia, fica perto da praia. | El hotel es caro; sin embargo, queda cerca de la playa.
logo | enseguida | luego = depois | Espera um pouco, eu volto logo. | Esperá un poco, vuelvo enseguida.
acordar | despertarse | acordar = combinar | Amanhã preciso acordar às seis para pegar o voo. | Mañana tengo que despertarme a las seis para tomar el vuelo.
fechar | cerrar | | A que horas a farmácia vai fechar? | ¿A qué hora va a cerrar la farmacia?
pegar | agarrar, tomar | pegar o ônibus = tomar el colectivo | Vamos pegar um táxi até o aeroporto. | Tomemos un taxi hasta el aeropuerto.
brincar | jugar, bromear | brincar = pular | As crianças querem brincar na areia. | Los chicos quieren jugar en la arena.
mala | valija | mala = ruim | Minha mala não chegou no aeroporto. | Mi valija no llegó al aeropuerto.
roxo | violeta | rojo = vermelho | Ela comprou um vestido roxo na feira. | Ella se compró un vestido violeta en la feria.
legal | bueno, copado | | Que legal! Então vamos juntos. | ¡Qué bueno! Entonces vamos juntos.`;

  const AJUSTES_BASE = { newPerDay: 15, dirs: 'ambas', modo: 'tarjeta', mazo: '', viaje: '2026-12-22', audio: false, lastBackup: null };

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // ================= Guardado =================
  function tarjetasSemilla() {
    return SRS.parsearTexto(SEMILLA).tarjetas.map((t, i) => ({ id: 's' + (i + 1), pt: t.pt, es: t.es, note: t.note, ex: t.ex, exEs: t.exEs, deck: MAZO_INICIAL, created: i }));
  }

  // Las tarjetas del mazo inicial que no tienen ejemplo lo reciben de SEMILLA
  // (para quien instaló la app antes de que existieran los ejemplos).
  function completarEjemplos(cards) {
    const semilla = new Map(tarjetasSemilla().map(c => [c.id, c]));
    for (const c of cards) {
      const s = semilla.get(c.id);
      if (s && !c.ex && c.pt.trim().toLowerCase() === s.pt.toLowerCase()) { c.ex = s.ex; c.exEs = s.exEs; }
    }
    return cards;
  }

  function normalizar(d) {
    return {
      version: 1,
      cards: Array.isArray(d.cards) ? completarEjemplos(d.cards.filter(c => c && c.id && c.pt && c.es).map(c => ({ id: String(c.id), pt: String(c.pt), es: String(c.es), note: String(c.note || ''), ex: String(c.ex || ''), exEs: String(c.exEs || ''), deck: String(c.deck || MAZO_INICIAL), created: Number(c.created) || 0, mod: Number(c.mod) || 0 }))) : [],
      progress: d.progress && typeof d.progress === 'object' ? d.progress : {},
      days: Array.isArray(d.days) ? d.days : [],
      log: d.log && typeof d.log === 'object' ? d.log : {},
      borradas: d.borradas && typeof d.borradas === 'object' ? d.borradas : {}, // id → cuándo se borró (para la sincronización)
      reinicio: Number(d.reinicio) || 0,
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
  // 1) Si la palabra tiene audio grabado (carpeta audio/), suena ese archivo:
  //    anda igual en la PC y en el iPhone, en modo silencio y sin internet.
  // 2) Si no tiene (por ejemplo, una tarjeta que agregaste vos), usa la voz
  //    en portugués del dispositivo. Si no hay, avisa qué hacer.
  const AUDIOS = new Set(self.AUDIOS || []);
  const reproductor = new Audio();
  const hayVoz = 'speechSynthesis' in window;
  const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let vozPt = null;
  let ultimaFrase = null; // se guarda para que el navegador no la descarte a mitad de camino

  function buscarVoz() {
    const voces = speechSynthesis.getVoices();
    vozPt = voces.find(v => v.lang === 'pt-BR') || voces.find(v => /^pt[-_]br/i.test(v.lang)) || voces.find(v => /^pt/i.test(v.lang)) || null;
  }
  if (hayVoz) {
    buscarVoz();
    speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', buscarVoz);
  }
  // iPhone con iOS 17 o más: que el audio suene aunque esté en modo silencio
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* no pasa nada */ }

  // Igual que nombre_archivo() en generar_audios.py
  const nombreAudio = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  function hablar(texto) {
    if (!texto) return;
    const nombre = nombreAudio(texto);
    if (!AUDIOS.has(nombre)) return hablarConVoz(texto);
    if (hayVoz && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
    reproductor.pause();
    reproductor.src = 'audio/' + nombre + '.mp3';
    const p = reproductor.play();
    if (p && p.catch) p.catch(() => hablarConVoz(texto));
  }

  function hablarConVoz(texto) {
    if (!hayVoz) return aviso('Esto no tiene audio grabado y este navegador no puede leer en voz alta.');
    if (!vozPt) buscarVoz();
    if (!vozPt && speechSynthesis.getVoices().length) {
      return aviso(esIOS
        ? 'Falta la voz en portugués: Ajustes › Accesibilidad › Contenido leído › Voces › Portugués (Brasil).'
        : 'Esto no tiene audio grabado y la compu no tiene voz en portugués.');
    }
    reproductor.pause();
    const u = new SpeechSynthesisUtterance(texto.replace(/\s*\/\s*/g, ', '));
    u.lang = 'pt-BR';
    if (vozPt) u.voice = vozPt;
    u.rate = 0.9;
    let arranco = false;
    u.onstart = () => { arranco = true; };
    u.onerror = e => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') aviso('No pude leer la palabra en voz alta.');
    };
    ultimaFrase = u;
    // Safari a veces descarta lo que se pide justo después de cancelar: si estaba hablando, espero un poquito.
    const hablando = speechSynthesis.speaking || speechSynthesis.pending;
    speechSynthesis.resume(); // Chrome a veces queda "en pausa" y no dice nada
    if (hablando) {
      speechSynthesis.cancel();
      setTimeout(() => speechSynthesis.speak(u), 120);
    } else {
      speechSynthesis.speak(u);
    }
    setTimeout(() => {
      if (!arranco && ultimaFrase === u) aviso(esIOS ? '¿No se escucha? Sacá el iPhone del modo silencio y subí el volumen.' : 'No pude leer la palabra en voz alta.');
    }, 2500);
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
    $('#btn-practicar').hidden = !(total === 0 && hayParaPracticar());
    $('#practica-info').hidden = $('#btn-practicar').hidden;
    btn.hidden = !$('#btn-practicar').hidden; // con todo hecho, el botón grande pasa a ser "Seguir practicando"

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
  $('#btn-empezar').addEventListener('click', () => empezar(false));
  $('#btn-practicar').addEventListener('click', () => empezar(true));
  $('#btn-practicar-mas').addEventListener('click', () => empezar(true));

  const hayParaPracticar = () => estado.cards.some(c => !aj().mazo || c.deck === aj().mazo);

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

  // practica = true: práctica libre. Repasa tarjetas que ya viste sin cambiar
  // las fechas del repaso espaciado (así no se desarma el calendario).
  function empezar(practica) {
    let cola;
    if (practica) {
      cola = SRS.armarPractica(estado.cards, estado.progress, { dirs: dirsActivas(), mazo: aj().mazo || null, cantidad: 15 });
    } else {
      const c = colaDeHoy();
      cola = intercalar(c.repasos, c.nuevas);
    }
    if (!cola.length) return;
    sesion = { cola, total: cola.length, terminadas: 0, resultados: [0, 0, 0], modo: aj().modo, practica: !!practica };
    $('#fin').hidden = true;
    mostrarVista('estudio');
    mostrarActual();
  }

  function salirDelEstudio() {
    if (hayVoz) speechSynthesis.cancel();
    reproductor.pause();
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
    $('#explicacion').hidden = true;

    if (!s.cola.length) return terminar();

    const item = s.cola[0];
    const p = estado.progress[SRS.clave(item.card.id, item.dir)] || SRS.progresoNuevo();
    const t = textos(item);
    const etiqueta = s.practica ? 'Práctica' : p.state === 'new' ? 'Nueva' : p.state === 'learning' ? 'Otra vez' : 'Repaso';
    $('#direccion').textContent = item.dir === 'pt-es' ? '🇧🇷 Portugués → Español 🇦🇷' : '🇦🇷 Español → Portugués 🇧🇷';

    // Lo que dice cada botón: cuándo vuelve (en práctica las fechas no cambian)
    $$('#calificar small').forEach(sm => {
      const nota = Number(sm.dataset.int);
      sm.textContent = nota === 0 ? 'en un rato' : s.practica ? 'listo' : SRS.textoIntervalo(SRS.calificar(p, nota, hoy()).interval);
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
  // Botón 🔊 y dar vuelta la tarjeta.
  // Safari en el iPhone a veces le pasa el toque a la cara escondida de la tarjeta
  // (por el efecto 3D) en vez de al botón. Por eso, además de mirar qué elemento
  // recibió el toque, miro DÓNDE apoyaste el dedo: si cae sobre el 🔊 visible, suena.
  function botonAudioVisible() {
    let b;
    if (!$('#zona-quiz').hidden) b = $('[data-hablar=quiz]');
    else if (!$('#zona-tarjeta').hidden) b = $('#tarjeta').classList.contains('girada') ? $('[data-hablar=dorso]') : $('[data-hablar=frente]');
    return b && !b.hidden ? b : null;
  }
  function tocoElAudio(e) {
    const b = botonAudioVisible();
    if (!b) return false;
    if (e.target.closest && e.target.closest('.btn-audio') === b) return true;
    if (!e.clientX && !e.clientY) return false; // toque sin posición (teclado)
    const r = b.getBoundingClientRect();
    const margen = 10; // un poco de margen para el dedo
    return e.clientX >= r.left - margen && e.clientX <= r.right + margen && e.clientY >= r.top - margen && e.clientY <= r.bottom + margen;
  }
  $('#vista-estudio').addEventListener('click', e => {
    if (!sesion || !sesion.cola.length) return;
    if (tocoElAudio(e)) {
      hablar(sesion.cola[0].card.pt);
      return;
    }
    if (e.target.closest('.btn-audio')) return; // un 🔊 escondido: no hago nada
    if (e.target.closest('#tarjeta')) voltear();
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
    const f = hoy();
    if (!s.practica) {
      const k = SRS.clave(item.card.id, item.dir);
      const p = estado.progress[k] || SRS.progresoNuevo();
      const log = registroHoy();
      if (p.state === 'new') log.nuevas += 1; else log.repasos += 1;
      estado.progress[k] = Object.assign(SRS.calificar(p, nota, f), { ts: Date.now() });
    }
    if (!estado.days.includes(f)) estado.days.push(f);
    s.resultados[nota] += 1;
    if (nota === 0) {
      // Vuelve en la misma sesión, 3 tarjetas más adelante.
      s.cola.splice(Math.min(3, s.cola.length), 0, item);
    } else {
      s.terminadas += 1;
    }
    guardar();
    if (nota === 0) mostrarExplicacion(item.card); // no la sabías: antes de seguir, un ejemplo
    else mostrarActual();
  }

  // ----- Explicación con ejemplo (después de "No la sabía") -----
  function resaltar(contenedor, frase, palabra) {
    contenedor.replaceChildren();
    const partes = palabra.split('/').map(w => w.trim()).filter(Boolean).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    let re;
    try {
      re = new RegExp('(?<![\\p{L}])(' + partes.join('|') + ')(?![\\p{L}])', 'giu');
    } catch (e) {
      contenedor.textContent = frase; // navegador viejo: sin resaltado
      return;
    }
    let ultimo = 0;
    for (const m of frase.matchAll(re)) {
      contenedor.append(frase.slice(ultimo, m.index), el('mark', null, m[0]));
      ultimo = m.index + m[0].length;
    }
    contenedor.append(frase.slice(ultimo));
  }

  let explicando = null;
  function mostrarExplicacion(card) {
    explicando = card;
    $('#zona-tarjeta').hidden = true;
    $('#zona-quiz').hidden = true;
    $('#calificar').hidden = true;
    $('#seguir').hidden = true;
    $('#exp-pt').textContent = card.pt;
    $('#exp-es').textContent = card.es;
    $('#exp-nota').textContent = card.note ? '💡 ' + card.note : '';
    const hayEjemplo = !!card.ex;
    $('#exp-ejemplo').hidden = !hayEjemplo;
    $('#exp-sin').hidden = hayEjemplo;
    if (hayEjemplo) {
      resaltar($('#exp-ex'), card.ex, card.pt);
      $('#exp-exes').textContent = card.exEs || '';
    }
    $('#explicacion').hidden = false;
    window.scrollTo(0, 0);
    if (aj().audio) hablar(hayEjemplo ? card.ex : card.pt);
  }
  $('#btn-entendido').addEventListener('click', () => mostrarActual());
  $('#exp-audio-pt').addEventListener('click', () => explicando && hablar(explicando.pt));
  $('#exp-audio-ex').addEventListener('click', () => explicando && hablar(explicando.ex));

  function terminar() {
    $('#zona-tarjeta').hidden = true;
    $('#zona-quiz').hidden = true;
    $('#direccion').textContent = '';
    $('#fin').hidden = false;
    const [mal, medio, bien] = sesion.resultados;
    const racha = SRS.racha(estado.days, hoy());
    const c = colaDeHoy();
    const quedanHoy = c.repasos.length + c.nuevas.length;
    $('#fin-titulo').textContent = sesion.practica ? '¡Buena práctica!' : quedanHoy ? '¡Tanda terminada!' : '¡Terminaste por hoy!';
    $('#fin-resumen').textContent = `✅ ${bien} la sabía · 🤔 ${medio} más o menos · ❌ ${mal} no la sabía. Racha: ${racha} ${racha === 1 ? 'día' : 'días'} 🔥`;
    $('#btn-practicar-mas').hidden = quedanHoy > 0 || !hayParaPracticar();
    $('#btn-practicar-mas').textContent = sesion.practica ? '🔁 Otra tanda de práctica' : '🔁 Seguir practicando';
    sincronizar();
  }

  // Teclado (para probar en la compu): espacio da vuelta, 1-2-3 califica
  document.addEventListener('keydown', e => {
    if (!document.body.classList.contains('estudiando') || !sesion || !sesion.cola.length) return;
    if (document.querySelector('dialog[open]')) return;
    if (!$('#explicacion').hidden) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); mostrarActual(); }
      return;
    }
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
    formT.ex.value = c.ex || ''; formT.exEs.value = c.exEs || '';
    $('#dlg-tarjeta-titulo').textContent = 'Editar tarjeta';
    const vistas = dirsActivas().map(d => estado.progress[SRS.clave(c.id, d)]).filter(Boolean).reduce((n, p) => n + p.reps + p.lapses, 0);
    $('#dlg-tarjeta-estado').textContent = `Estado: ${estadoTarjeta(c).texto}${vistas ? ` · la acertaste ${vistas === 1 ? '1 vez' : vistas + ' veces'}` : ''}. Editarla no borra el progreso.`;
    $('#btn-borrar').hidden = false;
    dlgT.showModal();
  }

  $('#btn-agregar').addEventListener('click', abrirNueva);

  formT.addEventListener('submit', e => {
    e.preventDefault();
    const datos = { pt: formT.pt.value.trim(), es: formT.es.value.trim(), note: formT.note.value.trim(), ex: formT.ex.value.trim(), exEs: formT.exEs.value.trim(), deck: formT.deck.value.trim() || MAZO_INICIAL };
    if (!datos.pt || !datos.es) return aviso('Completá portugués y español');
    const repetida = estado.cards.find(c => c.id !== editando && c.deck === datos.deck && sinTildes(c.pt) === sinTildes(datos.pt) && sinTildes(c.es) === sinTildes(datos.es));
    if (repetida) return aviso('Esa tarjeta ya está en el mazo');
    if (editando) {
      Object.assign(estado.cards.find(c => c.id === editando), datos, { mod: Date.now() });
      aviso('Tarjeta guardada');
    } else {
      estado.cards.push(Object.assign({ id: nuevoId(), created: Date.now(), mod: Date.now() }, datos));
      aviso('Tarjeta agregada');
    }
    guardar();
    dlgT.close();
    pintarLista();
    sincronizarPronto();
  });

  $('#btn-borrar').addEventListener('click', () => {
    const c = estado.cards.find(x => x.id === editando);
    if (!c || !confirm(`¿Borrar "${c.pt}"? También se borra su progreso.`)) return;
    estado.cards = estado.cards.filter(x => x.id !== c.id);
    estado.borradas[c.id] = Date.now(); // para que no vuelva desde el otro aparato
    SRS.DIRS.forEach(d => delete estado.progress[SRS.clave(c.id, d)]);
    guardar();
    dlgT.close();
    pintarLista();
    aviso('Tarjeta borrada');
    sincronizarPronto();
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
    const existentes = new Map(estado.cards.filter(c => c.deck === deck).map(c => [sinTildes(c.pt) + '|' + sinTildes(c.es), c]));
    const nuevas = [];
    const conEjemplo = []; // ya estaban pero no tenían ejemplo: se lo agrego
    const vistas = new Set();
    let repetidas = 0;
    for (const t of tarjetas) {
      const k = sinTildes(t.pt) + '|' + sinTildes(t.es);
      if (vistas.has(k)) { repetidas++; continue; }
      vistas.add(k);
      const ya = existentes.get(k);
      if (ya) {
        if (t.ex && !ya.ex) conEjemplo.push({ card: ya, t });
        else repetidas++;
        continue;
      }
      nuevas.push(t);
    }
    return { nuevas, conEjemplo, repetidas, errores, deck };
  }

  function vistaPreviaTanda() {
    const r = analizarTanda();
    const partes = [];
    if (r.nuevas.length) partes.push(`Se van a agregar ${r.nuevas.length} ${r.nuevas.length === 1 ? 'tarjeta' : 'tarjetas'}`);
    if (r.conEjemplo.length) partes.push(`${r.conEjemplo.length} que ya tenías reciben su ejemplo`);
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
    if (!r.nuevas.length && !r.conEjemplo.length) return aviso(r.repetidas ? 'Esas tarjetas ya estaban' : 'No encontré tarjetas para agregar');
    const base = Date.now();
    r.nuevas.forEach((t, i) => estado.cards.push({ id: nuevoId() + i, pt: t.pt, es: t.es, note: t.note, ex: t.ex, exEs: t.exEs, deck: r.deck, created: base + i, mod: base }));
    r.conEjemplo.forEach(({ card, t }) => { card.ex = t.ex; card.exEs = t.exEs; if (!card.note && t.note) card.note = t.note; card.mod = base; });
    guardar();
    dlgI.close();
    pintarLista();
    const partes = [];
    if (r.nuevas.length) partes.push(`Agregué ${r.nuevas.length} ${r.nuevas.length === 1 ? 'tarjeta' : 'tarjetas'} a "${r.deck}"`);
    if (r.conEjemplo.length) partes.push(`${r.conEjemplo.length} con ejemplo nuevo`);
    aviso(partes.join(' · '));
    sincronizarPronto();
  });

  // ================= Ajustes =================
  function pintarAjustes() {
    $('#aj-nuevas').value = aj().newPerDay;
    $('#aj-dir').value = aj().dirs;
    $('#aj-viaje').value = aj().viaje || '';
    $('#aj-audio').checked = !!aj().audio;
    const u = aj().lastBackup;
    $('#ultimo-backup').textContent = u ? `Último backup: ${u.split('-').reverse().join('/')}` : 'Todavía no hiciste ningún backup.';
    pintarSync();
  }

  $('#aj-nuevas').addEventListener('change', e => {
    const n = Math.max(0, Math.min(200, Math.round(Number(e.target.value)) || 0));
    aj().newPerDay = n; e.target.value = n; guardar(); aviso(`${n} nuevas por día`);
  });
  $('#aj-dir').addEventListener('change', e => { aj().dirs = e.target.value; guardar(); aviso('Dirección guardada'); });
  $('#aj-viaje').addEventListener('change', e => { aj().viaje = e.target.value; guardar(); aviso('Fecha guardada'); });
  $('#aj-audio').addEventListener('change', e => { aj().audio = e.target.checked; guardar(); if (e.target.checked) hablar('Olá! Tudo bem?'); });
  $('#btn-probar-audio').addEventListener('click', () => hablar('Olá! Tudo bem?'));

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
    const syncDeEsteAparato = aj().sync;
    estado = normalizar(datos);
    estado.settings.sync = syncDeEsteAparato; // el vínculo de sincronización es de cada aparato
    guardar();
    pintarAjustes();
    aviso('Backup importado ✅');
    sincronizar();
  });

  // ----- Zona peligrosa -----
  $('#btn-reiniciar').addEventListener('click', () => {
    if (!confirm('¿Reiniciar todo el progreso? Las tarjetas quedan, pero vuelven a ser nuevas y se pierde la racha.')) return;
    estado.progress = {}; estado.days = []; estado.log = {};
    estado.reinicio = Date.now(); // así el otro aparato tampoco trae el progreso viejo
    guardar(); aviso('Progreso reiniciado');
    sincronizar();
  });
  $('#btn-restaurar').addEventListener('click', () => {
    const ids = new Set(estado.cards.map(c => c.id));
    const faltan = tarjetasSemilla().filter(c => !ids.has(c.id));
    if (!faltan.length) return aviso('Ya tenés todas las tarjetas del mazo inicial');
    const ahora = Date.now();
    faltan.forEach(c => { c.mod = ahora; delete estado.borradas[c.id]; });
    estado.cards.push(...faltan);
    guardar(); aviso(`Recuperé ${faltan.length} ${faltan.length === 1 ? 'tarjeta' : 'tarjetas'}`);
    sincronizar();
  });

  // ================= Sincronización entre aparatos =================
  // Cada aparato baja lo que hay en la nube, lo combina con lo suyo (SRS.combinarDatos,
  // que no pierde nada) y sube el resultado. El código de sincronización es la llave.
  const URL_SYNC = 'https://portugues-sync.precio-claro-app.workers.dev/datos';
  const LETRAS_CODIGO = 'abcdefghjkmnpqrstuvwxyz23456789'; // sin 0/o/1/l/i
  const codigoSync = () => (aj().sync && aj().sync.codigo) || '';
  const limpiarCodigo = t => String(t).toLowerCase().replace(/[^a-z0-9]/g, '');
  const codigoValido = c => c.length === 16 && [...c].every(x => LETRAS_CODIGO.includes(x));
  const mostrarCodigo = c => c.toUpperCase().match(/.{1,4}/g).join('-');
  const datosSync = e => ({ cards: e.cards, progress: e.progress, days: e.days, log: e.log, borradas: e.borradas || {}, reinicio: e.reinicio || 0 });

  function codigoNuevo() {
    const azar = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(azar, b => LETRAS_CODIGO[b % LETRAS_CODIGO.length]).join('');
  }

  async function pedirNube(metodo, codigo, cuerpo) {
    const r = await fetch(URL_SYNC, {
      method: metodo,
      headers: Object.assign({ 'X-Codigo': codigo }, cuerpo ? { 'Content-Type': 'application/json' } : {}),
      body: cuerpo,
      cache: 'no-store',
      keepalive: metodo === 'PUT' && cuerpo && cuerpo.length < 60000,
    });
    if (!r.ok) throw new Error('El servidor respondió ' + r.status);
    return r.json();
  }

  let sincEnCurso = null;
  let sincOtraVez = false;
  let estadoSync = '';

  function sincronizar() {
    const codigo = codigoSync();
    if (!codigo) return Promise.resolve();
    if (sincEnCurso) { sincOtraVez = true; return sincEnCurso; }
    sincEnCurso = (async () => {
      estadoSync = 'Sincronizando…';
      pintarSync();
      try {
        const remoto = await pedirNube('GET', codigo);
        // Combino con lo que hay AHORA (por si estudiaste mientras bajaba)
        const local = datosSync(estado);
        const antes = estado.cards.length;
        const combinado = SRS.combinarDatos(local, remoto);
        const cambioLocal = JSON.stringify(combinado) !== JSON.stringify(SRS.combinarDatos(local, null));
        Object.assign(estado, combinado);
        completarEjemplos(estado.cards);
        aj().sync.ultima = Date.now();
        guardar();
        const nubeIgual = remoto && JSON.stringify(combinado) === JSON.stringify(SRS.combinarDatos(remoto, null));
        if (!nubeIgual) await pedirNube('PUT', codigo, JSON.stringify(Object.assign({ app: 'tarjetas-portugues', actualizado: new Date().toISOString() }, combinado)));
        estadoSync = '';
        if (cambioLocal) {
          const dif = estado.cards.length - antes;
          aviso(dif === 1 ? '☁️ Llegó 1 tarjeta del otro aparato' : dif > 1 ? `☁️ Llegaron ${dif} tarjetas del otro aparato` : '☁️ Se actualizó con el otro aparato');
          repintar();
        }
      } catch (e) {
        estadoSync = navigator.onLine === false ? 'Sin internet: se sincroniza cuando vuelva la conexión.' : 'No se pudo sincronizar (' + e.message + '). Se reintenta solo.';
      } finally {
        sincEnCurso = null;
        pintarSync();
        if (sincOtraVez) { sincOtraVez = false; sincronizar(); }
      }
    })();
    return sincEnCurso;
  }

  // Después de editar tarjetas espero un poquito, por si hacés varios cambios seguidos
  let timerSync;
  function sincronizarPronto() {
    clearTimeout(timerSync);
    timerSync = setTimeout(sincronizar, 2500);
  }

  function repintar() {
    if (document.body.classList.contains('estudiando')) return; // no interrumpo una tanda
    if ($('#vista-inicio').classList.contains('activa')) pintarInicio();
    if ($('#vista-tarjetas').classList.contains('activa')) pintarLista();
  }

  function haceCuanto(ms) {
    const s = Math.round((Date.now() - ms) / 1000);
    if (s < 60) return 'recién';
    if (s < 3600) return `hace ${Math.round(s / 60)} min`;
    if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
    return `hace ${Math.round(s / 86400)} días`;
  }

  function pintarSync() {
    const codigo = codigoSync();
    $('#sync-off').hidden = !!codigo;
    $('#sync-on').hidden = !codigo;
    if (!codigo) return;
    $('#sync-codigo-ver').textContent = mostrarCodigo(codigo);
    const u = aj().sync.ultima;
    $('#sync-estado').textContent = estadoSync || (u ? `☁️ Sincronizado ${haceCuanto(u)}.` : 'Todavía no se sincronizó.');
  }

  $('#btn-sync-crear').addEventListener('click', async () => {
    aj().sync = { codigo: codigoNuevo(), ultima: 0 };
    guardar();
    pintarSync();
    await sincronizar();
    aviso('Listo: escribí este código en el otro aparato');
  });

  $('#btn-sync-vincular').addEventListener('click', async () => {
    const codigo = limpiarCodigo($('#sync-codigo').value);
    if (!codigoValido(codigo)) return aviso('Ese código no es válido: son 16 letras y números');
    const boton = $('#btn-sync-vincular');
    boton.disabled = true;
    try {
      const remoto = await pedirNube('GET', codigo);
      if (!remoto && !confirm('Ese código todavía no tiene datos guardados. ¿Lo escribiste bien? Tocá Aceptar para usarlo igual.')) return;
      aj().sync = { codigo, ultima: 0 };
      guardar();
      $('#sync-codigo').value = '';
      await sincronizar();
      aviso('☁️ Vinculado: tus tarjetas se combinaron con las del otro aparato');
    } catch (e) {
      aviso('No pude conectarme. Revisá internet y probá de nuevo.');
    } finally {
      boton.disabled = false;
    }
  });

  $('#btn-sync-ahora').addEventListener('click', () => sincronizar());

  $('#btn-sync-copiar').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(mostrarCodigo(codigoSync()));
      aviso('Código copiado');
    } catch (e) {
      aviso('No pude copiarlo: anotalo a mano');
    }
  });

  $('#btn-sync-salir').addEventListener('click', () => {
    if (!confirm('¿Desvincular este aparato? Tus tarjetas quedan acá, pero deja de sincronizarse con el otro.')) return;
    delete aj().sync;
    guardar();
    pintarSync();
    aviso('Este aparato ya no se sincroniza');
  });

  // ================= Arranque =================
  // Al volver a la app: refresca "para hoy" y sincroniza. Al salir: sube lo último.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if ($('#vista-inicio').classList.contains('activa')) pintarInicio();
      sincronizar();
    } else {
      sincronizar();
    }
  });
  window.addEventListener('online', () => sincronizar());

  // Pedirle al navegador que no borre los datos si le falta espacio
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  // Service worker: guarda la app en el teléfono para que ande sin internet
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  pintarInicio();
  pintarSync();
  setTimeout(sincronizar, 800);
})();
