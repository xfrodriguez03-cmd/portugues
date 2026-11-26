// Pruebas del repaso espaciado. Se corren con:  node pruebas.js
const assert = require('assert');
const S = require('./srs.js');

let ok = 0;
function prueba(nombre, fn) {
  try { fn(); ok++; console.log('  ✔ ' + nombre); }
  catch (e) { console.error('  ✘ ' + nombre + '\n    ' + e.message); process.exitCode = 1; }
}

const H = '2026-11-24';
const cards = Array.from({ length: 26 }, (_, i) => ({ id: 's' + (i + 1), pt: 'pt' + i, es: 'es' + i, note: '', deck: 'Falsos amigos' }));

console.log('Fechas');
prueba('sumar días cruza el mes', () => assert.strictEqual(S.sumarDias('2026-11-30', 1), '2026-12-01'));
prueba('días hasta el viaje', () => assert.strictEqual(S.diasEntre(H, '2026-12-22'), 28));

console.log('Calificar');
prueba('"No la sabía" vuelve hoy', () => {
  const p = S.calificar(S.progresoNuevo(), 0, H);
  assert.strictEqual(p.due, H); assert.strictEqual(p.interval, 0); assert.strictEqual(p.state, 'learning');
});
prueba('"Más o menos" en nueva → mañana', () => {
  const p = S.calificar(S.progresoNuevo(), 1, H);
  assert.strictEqual(p.due, '2026-11-25'); assert.strictEqual(p.interval, 1);
});
prueba('"La sabía" en nueva → 3 días', () => {
  const p = S.calificar(S.progresoNuevo(), 2, H);
  assert.strictEqual(p.interval, 3); assert.strictEqual(p.due, '2026-11-27');
});
prueba('"La sabía" después de fallarla → mañana', () => {
  let p = S.calificar(S.progresoNuevo(), 0, H);
  p = S.calificar(p, 2, H);
  assert.strictEqual(p.interval, 1);
});
prueba('acertar seguido hace crecer el intervalo', () => {
  let p = S.calificar(S.progresoNuevo(), 2, H); // 3
  p = S.calificar(p, 2, p.due);                 // ~8
  const antes = p.interval;
  p = S.calificar(p, 2, p.due);
  assert.ok(antes > 3 && p.interval > antes, `intervalos ${antes} → ${p.interval}`);
});
prueba('fallar una de repaso cuenta como olvido y baja la facilidad', () => {
  let p = S.calificar(S.progresoNuevo(), 2, H);
  const ease = p.ease;
  p = S.calificar(p, 0, p.due);
  assert.strictEqual(p.lapses, 1); assert.ok(p.ease < ease);
});
prueba('la facilidad nunca baja de 1.3', () => {
  let p = S.progresoNuevo();
  for (let i = 0; i < 20; i++) p = S.calificar(p, 0, H);
  assert.strictEqual(p.ease, 1.3);
});

console.log('Sesión del día');
prueba('día 1: 15 nuevas, todas portugués → español', () => {
  const c = S.armarCola(cards, {}, { fecha: H, limiteNuevas: 15, nuevasHoy: 0 });
  assert.strictEqual(c.nuevas.length, 15); assert.strictEqual(c.repasos.length, 0);
  assert.ok(c.nuevas.every(i => i.dir === 'pt-es'));
});
prueba('respeta las nuevas ya hechas hoy', () => {
  const c = S.armarCola(cards, {}, { fecha: H, limiteNuevas: 15, nuevasHoy: 10 });
  assert.strictEqual(c.nuevas.length, 5);
});
prueba('español → portugués aparece recién otro día', () => {
  const prog = {};
  cards.forEach(c => { prog[S.clave(c.id, 'pt-es')] = S.calificar(S.progresoNuevo(), 2, H); });
  const mismoDia = S.armarCola(cards, prog, { fecha: H, limiteNuevas: 15, nuevasHoy: 0 });
  assert.strictEqual(mismoDia.nuevas.length, 0);
  const otroDia = S.armarCola(cards, prog, { fecha: '2026-11-25', limiteNuevas: 15, nuevasHoy: 0 });
  assert.strictEqual(otroDia.nuevas.length, 15);
  assert.ok(otroDia.nuevas.every(i => i.dir === 'es-pt'));
});
prueba('incluye todos los repasos vencidos, sin límite', () => {
  const prog = {};
  cards.forEach(c => { prog[S.clave(c.id, 'pt-es')] = S.calificar(S.progresoNuevo(), 1, H); });
  const c = S.armarCola(cards, prog, { fecha: '2026-11-26', limiteNuevas: 15, nuevasHoy: 0 });
  assert.strictEqual(c.repasos.length, 26);
  // y no mete la otra dirección de una tarjeta que ya está en repaso
  assert.strictEqual(c.nuevas.length, 0);
});
prueba('solo una dirección (es-pt) no espera a la otra', () => {
  const c = S.armarCola(cards, {}, { fecha: H, dirs: ['es-pt'], limiteNuevas: 15, nuevasHoy: 0 });
  assert.strictEqual(c.nuevas.length, 15); assert.ok(c.nuevas.every(i => i.dir === 'es-pt'));
});
prueba('filtra por mazo', () => {
  const mix = cards.concat([{ id: 'x1', pt: 'oi', es: 'hola', note: '', deck: 'Saludos' }]);
  const c = S.armarCola(mix, {}, { fecha: H, limiteNuevas: 15, nuevasHoy: 0, mazo: 'Saludos' });
  assert.strictEqual(c.nuevas.length, 1);
});

console.log('Práctica libre');
prueba('practica solo tarjetas ya vistas, hasta 15', () => {
  const prog = {};
  cards.slice(0, 20).forEach(c => { prog[S.clave(c.id, 'pt-es')] = S.calificar(S.progresoNuevo(), 2, H); });
  const p = S.armarPractica(cards, prog, { cantidad: 15 });
  assert.strictEqual(p.length, 15);
  assert.ok(p.every(i => prog[S.clave(i.card.id, i.dir)]));
});
prueba('primero las que más te cuestan', () => {
  const prog = {};
  cards.forEach(c => { prog[S.clave(c.id, 'pt-es')] = S.calificar(S.progresoNuevo(), 2, H); });
  let dificil = S.calificar(S.progresoNuevo(), 2, H);
  for (let i = 0; i < 4; i++) dificil = S.calificar(dificil, 0, H);
  prog['s7:pt-es'] = dificil;
  for (let i = 0; i < 20; i++) {
    assert.ok(S.armarPractica(cards, prog, { cantidad: 3 }).some(x => x.card.id === 's7'));
  }
});
prueba('una sola dirección por tarjeta', () => {
  const prog = {};
  cards.forEach(c => S.DIRS.forEach(d => { prog[S.clave(c.id, d)] = S.calificar(S.progresoNuevo(), 1, H); }));
  const p = S.armarPractica(cards, prog, { cantidad: 26 });
  assert.strictEqual(new Set(p.map(i => i.card.id)).size, p.length);
});
prueba('sin nada visto usa tarjetas en portugués → español', () => {
  const p = S.armarPractica(cards, {}, { cantidad: 15 });
  assert.strictEqual(p.length, 15); assert.ok(p.every(i => i.dir === 'pt-es'));
});
prueba('no modifica el progreso', () => {
  const prog = { 's1:pt-es': S.calificar(S.progresoNuevo(), 2, H) };
  const copia = JSON.stringify(prog);
  S.armarPractica(cards, prog, { cantidad: 15 });
  assert.strictEqual(JSON.stringify(prog), copia);
});

console.log('Sincronización (combinar dos aparatos)');
const semilla = cards.map((c, i) => Object.assign({}, c, { created: i }));
const propias = Array.from({ length: 15 }, (_, i) => ({ id: 'c' + i, pt: 'propia' + i, es: 'mía' + i, note: '', deck: 'Falsos amigos', created: 1000 + i, mod: 5000 + i }));
prueba('celu con 41 + compu con 26 → 41, sin perder nada', () => {
  const celu = { cards: semilla.concat(propias), progress: { 's1:pt-es': Object.assign(S.calificar(S.progresoNuevo(), 2, H), { ts: 100 }) }, days: [H], log: { [H]: { nuevas: 15, repasos: 0, extra: 0 } } };
  const compu = { cards: semilla, progress: {}, days: [], log: {} };
  const r = S.combinarDatos(celu, compu);
  assert.strictEqual(r.cards.length, 41);
  assert.ok(r.progress['s1:pt-es']); assert.deepStrictEqual(r.days, [H]);
  assert.strictEqual(r.log[H].nuevas, 15);
});
prueba('da lo mismo el orden', () => {
  const a = { cards: semilla.slice(0, 10).concat(propias.slice(0, 3)), progress: { 's2:pt-es': { state: 'review', ts: 5, reps: 1 } }, days: ['2026-11-20'] };
  const b = { cards: semilla.slice(5), progress: { 's2:pt-es': { state: 'review', ts: 9, reps: 2 } }, days: [H] };
  assert.strictEqual(JSON.stringify(S.combinarDatos(a, b)), JSON.stringify(S.combinarDatos(b, a)));
});
prueba('combinar dos veces da lo mismo', () => {
  const a = { cards: semilla.concat(propias), progress: {}, days: [H] };
  const r1 = S.combinarDatos(a, { cards: semilla });
  assert.strictEqual(JSON.stringify(S.combinarDatos(r1, r1)), JSON.stringify(r1));
});
prueba('gana el repaso más reciente', () => {
  const viejo = { state: 'review', interval: 3, ts: 100, last: '2026-11-20' };
  const nuevo = { state: 'review', interval: 8, ts: 200, last: '2026-11-24' };
  assert.strictEqual(S.combinarDatos({ cards: semilla, progress: { 's1:pt-es': viejo } }, { cards: semilla, progress: { 's1:pt-es': nuevo } }).progress['s1:pt-es'].interval, 8);
});
prueba('gana la edición más nueva de una tarjeta', () => {
  const v1 = Object.assign({}, semilla[0], { es: 'raro', mod: 10 });
  const v2 = Object.assign({}, semilla[0], { es: 'extraño', mod: 20 });
  assert.strictEqual(S.combinarDatos({ cards: [v1] }, { cards: [v2] }).cards[0].es, 'extraño');
});
prueba('una tarjeta borrada en un aparato no vuelve desde el otro', () => {
  const a = { cards: semilla.slice(1), borradas: { s1: 300 }, progress: {} };
  const b = { cards: semilla, progress: { 's1:pt-es': { state: 'review', ts: 50 } } };
  const r = S.combinarDatos(a, b);
  assert.ok(!r.cards.some(c => c.id === 's1')); assert.ok(!r.progress['s1:pt-es']);
  assert.strictEqual(r.cards.length, 25);
});
prueba('la misma tarjeta cargada en los dos (ids distintos) queda una sola', () => {
  const x = { id: 'cA', pt: 'Saudade', es: 'nostalgia', deck: 'Extra', created: 1 };
  const y = { id: 'cB', pt: 'saudade', es: 'nostalgia', deck: 'Extra', created: 2 };
  const r = S.combinarDatos({ cards: [x], progress: {} }, { cards: [y], progress: { 'cB:pt-es': { state: 'review', reps: 3, ts: 1 } } });
  assert.strictEqual(r.cards.length, 1); assert.strictEqual(r.cards[0].id, 'cB');
});
prueba('reiniciar el progreso en un aparato no lo resucita desde el otro', () => {
  const reinicio = new Date(2026, 10, 20, 12).getTime();
  const a = { cards: semilla, progress: {}, days: [], reinicio };
  const b = { cards: semilla, progress: { 's1:pt-es': { state: 'review', ts: reinicio - 1000 }, 's2:pt-es': { state: 'review', ts: reinicio + 1000 } }, days: ['2026-11-10', '2026-11-21'] };
  const r = S.combinarDatos(a, b);
  assert.ok(!r.progress['s1:pt-es']); assert.ok(r.progress['s2:pt-es']);
  assert.deepStrictEqual(r.days, ['2026-11-21']);
});
prueba('nube vacía (primera vez) no rompe nada', () => {
  const r = S.combinarDatos({ cards: semilla, progress: {}, days: [H] }, null);
  assert.strictEqual(r.cards.length, 26);
});

console.log('Racha y aprendidas');
prueba('racha de 3 días', () => assert.strictEqual(S.racha(['2026-11-22', '2026-11-23', H], H), 3));
prueba('la racha sigue viva si estudiaste ayer', () => assert.strictEqual(S.racha(['2026-11-22', '2026-11-23'], H), 2));
prueba('la racha se corta si salteaste un día', () => assert.strictEqual(S.racha(['2026-11-21', '2026-11-22'], H), 0));
prueba('aprendida = ambas direcciones con 3+ días', () => {
  const prog = { 's1:pt-es': S.calificar(S.progresoNuevo(), 2, H) };
  assert.strictEqual(S.estaAprendida(cards[0], prog, ['pt-es', 'es-pt']), false);
  prog['s1:es-pt'] = S.calificar(S.progresoNuevo(), 2, H);
  assert.strictEqual(S.estaAprendida(cards[0], prog, ['pt-es', 'es-pt']), true);
});

console.log('Quiz');
prueba('4 opciones distintas, una correcta', () => {
  for (let i = 0; i < 50; i++) {
    const ops = S.opcionesQuiz(cards[0], 'pt-es', cards);
    assert.strictEqual(ops.length, 4);
    assert.strictEqual(new Set(ops).size, 4);
    assert.ok(ops.includes('es0'));
  }
});
prueba('dirección es-pt ofrece palabras en portugués', () => {
  const ops = S.opcionesQuiz(cards[3], 'es-pt', cards);
  assert.ok(ops.includes('pt3') && ops.every(o => o.startsWith('pt')));
});
prueba('con pocas tarjetas no se rompe', () => {
  assert.strictEqual(S.opcionesQuiz(cards[0], 'pt-es', cards.slice(0, 2)).length, 2);
});

console.log('Importar texto');
prueba('lee "portugués | español | nota" y nota vacía', () => {
  const r = S.parsearTexto('esquisito | raro | exquisito = delicioso\nsobremesa | postre | \n\n# comentario\nmal formada');
  assert.strictEqual(r.tarjetas.length, 2);
  assert.deepStrictEqual(r.tarjetas[1], { pt: 'sobremesa', es: 'postre', note: '', ex: '', exEs: '' });
  assert.deepStrictEqual(r.errores, [5]);
});
prueba('lee ejemplo y traducción (columnas 4 y 5)', () => {
  const r = S.parsearTexto('mala | valija | mala = ruim | Minha mala não chegou. | Mi valija no llegó.\nlogo | enseguida | | Volto logo. | Vuelvo enseguida.');
  assert.deepStrictEqual(r.tarjetas[0], { pt: 'mala', es: 'valija', note: 'mala = ruim', ex: 'Minha mala não chegou.', exEs: 'Mi valija no llegó.' });
  assert.strictEqual(r.tarjetas[1].note, ''); assert.strictEqual(r.tarjetas[1].ex, 'Volto logo.');
});
prueba('respeta las barras "/" dentro del texto', () => {
  const r = S.parsearTexto('puxar / empurrar | tirar / empujar (puertas) |');
  assert.strictEqual(r.tarjetas[0].pt, 'puxar / empurrar');
});

console.log(`\n${ok} pruebas pasaron${process.exitCode ? ', hay fallas' : ''}.`);
