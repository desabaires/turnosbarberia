// Genera un PDF demo de TurnosBarbería — 8 páginas estilo brochure.
// Run: node scripts/generate-demo-pdf.mjs
// Output: ./TurnosBarberia-Demo.pdf

import PDFDocument from 'pdfkit';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), 'TurnosBarberia-Demo.pdf');

const COLORS = {
  bg:       '#F5F3EE',
  card:     '#FFFFFF',
  line:     '#E3DFD6',
  ink:      '#0E0E0E',
  muted:    '#7A766E',
  accent:   '#B6754C',
  dark:     '#1A1815',
  darkCard: '#26221C',
  darkLine: '#3A352D',
  darkMuted:'#8C8A83',
  bgLight:  '#F5F3EE'
};

const A4 = { w: 595.28, h: 841.89 };

const doc = new PDFDocument({
  size: 'A4',
  margin: 0,
  bufferPages: true,
  info: {
    Title: 'TurnosBarbería — Demo',
    Author: 'didigital studio',
    Subject: 'Plataforma SaaS para barberías',
    Keywords: 'turnos, barberia, agenda, saas'
  }
});

doc.pipe(fs.createWriteStream(OUT));

// ── Helpers ────────────────────────────────────────────────────────────────

function fillBg(color) {
  doc.save().rect(0, 0, A4.w, A4.h).fill(color).restore();
}

function pageHeader(label) {
  doc.save();
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.muted)
     .text(label.toUpperCase(), 56, 40, { characterSpacing: 2 });
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted)
     .text('TurnosBarbería · Demo', 0, 40, { width: A4.w - 56, align: 'right' });
  doc.moveTo(56, 56).lineTo(A4.w - 56, 56).strokeColor(COLORS.line).lineWidth(0.5).stroke();
  doc.restore();
}

function pageFooter(num) {
  doc.save();
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted)
     .text(`${num} / 8`, 56, A4.h - 36)
     .text('didigitalstudio.com', 0, A4.h - 36, { width: A4.w - 56, align: 'right' });
  doc.restore();
}

function h1(text, y) {
  doc.font('Times-Roman').fontSize(40).fillColor(COLORS.ink)
     .text(text, 56, y, { width: A4.w - 112, lineGap: -4 });
  return doc.y;
}

function h2(text, y) {
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.accent)
     .text(text.toUpperCase(), 56, y, { characterSpacing: 2.5 });
  return doc.y + 6;
}

function p(text, y, opts = {}) {
  doc.font('Helvetica').fontSize(opts.size || 11).fillColor(opts.color || COLORS.ink)
     .text(text, opts.x ?? 56, y, { width: opts.width || (A4.w - 112), lineGap: 4, align: opts.align || 'left' });
  return doc.y;
}

function bullet(text, y, opts = {}) {
  const x = opts.x ?? 56;
  const w = opts.width || (A4.w - 112 - 18);
  doc.save();
  doc.circle(x + 4, y + 6, 2.5).fill(COLORS.accent);
  doc.restore();
  doc.font('Helvetica').fontSize(11).fillColor(COLORS.ink)
     .text(text, x + 18, y, { width: w, lineGap: 4 });
  return doc.y + 4;
}

function card(x, y, w, h, color = COLORS.card) {
  doc.save();
  doc.roundedRect(x, y, w, h, 12).fill(color);
  doc.restore();
}

function tag(text, x, y) {
  const w = doc.widthOfString(text, { font: 'Helvetica-Bold', size: 8 }) + 16;
  doc.save();
  doc.roundedRect(x, y, w, 18, 9).fill(COLORS.ink);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.bg)
     .text(text, x + 8, y + 5, { characterSpacing: 1 });
  doc.restore();
  return w;
}

// ── Page 1 — Cover ─────────────────────────────────────────────────────────

fillBg(COLORS.ink);

// círculos decorativos como en la landing
doc.save();
doc.circle(A4.w + 60, -60, 220).strokeColor(COLORS.darkLine).lineWidth(1).stroke();
doc.circle(A4.w + 20, 30, 140).strokeColor(COLORS.darkLine).lineWidth(1).stroke();
doc.restore();

doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.darkMuted)
   .text('TURNOSBARBERÍA · DEMO 2026', 56, 80, { characterSpacing: 3 });

doc.font('Times-Roman').fontSize(64).fillColor(COLORS.bg)
   .text('Tu barbería,', 56, 220, { lineGap: -10 });
doc.font('Times-Italic').fontSize(64).fillColor(COLORS.accent)
   .text('sin teléfono.', 56, doc.y, { lineGap: -10 });

doc.font('Helvetica').fontSize(13).fillColor(COLORS.darkMuted)
   .text(
     'Reservas online, agenda con drag & drop, comisiones automáticas, caja y stock. '
   + 'Pensado para barberías chicas y medianas en Argentina.',
     56, doc.y + 30, { width: 420, lineGap: 5 }
   );

// pie con tag
const tagW = tag('PLATAFORMA SAAS', 56, A4.h - 130);
tag('MULTI-SEDE', 56 + tagW + 8, A4.h - 130);

doc.font('Helvetica').fontSize(9).fillColor(COLORS.darkMuted)
   .text('didigital studio', 56, A4.h - 70)
   .text('didigitalstudio.com / TurnosBarbería', 0, A4.h - 70, { width: A4.w - 56, align: 'right' });

// ── Page 2 — Problema ──────────────────────────────────────────────────────

doc.addPage();
fillBg(COLORS.bg);
pageHeader('01 · El problema');

let y = 90;
y = h1('El día a día de una\nbarbería sin sistema.', y);

y = h2('Lo que pasa hoy', y + 24);
y = bullet('Turnos por WhatsApp, anotaciones en cuaderno y llamadas perdidas a las 9 PM.', y + 6);
y = bullet('Clientes que no se presentan y nadie sabe a tiempo para liberar el horario.', y + 4);
y = bullet('Cierre de mes a mano: contar cortes, calcular comisiones de cada barbero.', y + 4);
y = bullet('Sin historial de cliente, sin ticket promedio, sin idea de quién factura más.', y + 4);

card(56, y + 24, A4.w - 112, 110);
doc.font('Times-Italic').fontSize(20).fillColor(COLORS.ink)
   .text('"Pierdo turnos cada vez que no contesto el WhatsApp. Y al fin de mes calculo comisiones con la calculadora del celular."', 80, y + 44, { width: A4.w - 160, lineGap: 2 });
doc.font('Helvetica').fontSize(10).fillColor(COLORS.muted)
   .text('— Dueño de barbería · Buenos Aires', 80, y + 110);

pageFooter(2);

// ── Page 3 — Reservas online ────────────────────────────────────────────────

doc.addPage();
fillBg(COLORS.bg);
pageHeader('02 · Reservas online');

y = 90;
y = h1('Tu link público.\nReservan solos.', y);

y = h2('Cómo funciona', y + 24);
y = p('Cada barbería tiene un link único — turnosbarberia.com/tu-barberia. Lo pegan en Instagram, Google Maps o WhatsApp Business. El cliente entra desde el celular, elige servicio, barbero, día y horario en 4 toques. Sin descargar nada, sin contraseña al entrar.', y + 4, { size: 11 });

// mockup card simulando el flow móvil
const mx = 56, my = y + 24, mw = A4.w - 112;
card(mx, my, mw, 280, COLORS.ink);
doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.darkMuted)
   .text('CLIENTE · MOBILE', mx + 24, my + 24, { characterSpacing: 2 });
doc.font('Times-Roman').fontSize(28).fillColor(COLORS.bg)
   .text('Reservá tu turno.', mx + 24, my + 44);

// pasos
const steps = [
  ['1', 'Elegí el servicio', 'Corte clásico · 30 min · $6.000'],
  ['2', 'Elegí el barbero', 'Tomás · Iván · Nico · o Cualquiera'],
  ['3', 'Elegí día y horario', 'Hoy · Mañ · 11:00, 11:30, 12:00…'],
  ['4', 'Confirmá tus datos', 'Nombre, email y teléfono — listo']
];
let sy = my + 92;
for (const [n, title, sub] of steps) {
  doc.save();
  doc.circle(mx + 40, sy + 8, 11).strokeColor(COLORS.accent).lineWidth(1).stroke();
  doc.font('Times-Roman').fontSize(13).fillColor(COLORS.accent)
     .text(n, mx + 36, sy + 2);
  doc.restore();
  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.bg)
     .text(title, mx + 64, sy);
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.darkMuted)
     .text(sub, mx + 64, sy + 14);
  sy += 38;
}

y = my + 280 + 24;
y = h2('Email automático de confirmación', y);
y = p('El cliente recibe el ticket por mail al toque (vía Resend). Si reagenda o cancela 2 hs antes, el horario queda libre para otro.', y + 4);

pageFooter(3);

// ── Page 4 — Agenda con drag & drop ────────────────────────────────────────

doc.addPage();
fillBg(COLORS.bg);
pageHeader('03 · Agenda admin');

y = 90;
y = h1('Tu agenda en una\npantalla. Movés con\nel mouse.', y);

y = h2('Vista día y semana', y + 16);
y = p('Una columna por barbero (vista día) o una columna por día (vista semana). Línea de "ahora" en vivo. Click vacío en una celda = nuevo turno con servicio y barbero pre-seleccionados.', y + 4);

// mock de la grilla
const gx = 56, gy = y + 20, gw = A4.w - 112, gh = 200;
card(gx, gy, gw, gh, COLORS.ink);

// header
doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.bg)
   .text('Tomás', gx + 70, gy + 14)
   .text('Iván',  gx + 70 + (gw - 70) / 3, gy + 14)
   .text('Nico',  gx + 70 + 2 * (gw - 70) / 3, gy + 14);
doc.moveTo(gx, gy + 36).lineTo(gx + gw, gy + 36).strokeColor(COLORS.darkLine).lineWidth(0.5).stroke();

// filas horarias
const hours = ['10:00', '11:00', '12:00', '13:00'];
hours.forEach((hh, i) => {
  const ry = gy + 50 + i * 38;
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.darkMuted).text(hh, gx + 12, ry - 4);
  doc.moveTo(gx + 56, ry).lineTo(gx + gw, ry).strokeColor(COLORS.darkLine).lineWidth(0.3).stroke();
});

// columnas
[0, 1, 2].forEach(i => {
  const cx = gx + 70 + i * (gw - 70) / 3 - 10;
  if (i > 0) doc.moveTo(cx, gy + 36).lineTo(cx, gy + gh).strokeColor(COLORS.darkLine).lineWidth(0.3).stroke();
});

// bloque turno
function apptBlock(col, row, label, name, hue) {
  const cx = gx + 70 + col * (gw - 70) / 3;
  const ry = gy + 50 + row * 38;
  const w = (gw - 80) / 3;
  doc.save();
  doc.roundedRect(cx, ry + 2, w - 4, 32, 4).fill(`#3a2d24`);
  doc.rect(cx, ry + 2, 3, 32).fill(COLORS.accent);
  doc.font('Helvetica').fontSize(8).fillColor('#cfc6b8').text(label, cx + 8, ry + 6);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.bg).text(name, cx + 8, ry + 17);
  doc.restore();
}
apptBlock(2, 1, '11:00', 'Lucas', 320);
apptBlock(0, 2, '12:00', 'Mariano', 50);
apptBlock(1, 2, '12:00', 'Pablo', 200);

// flecha de drag
doc.save();
doc.lineWidth(1).strokeColor(COLORS.accent).dash(3, { space: 2 });
doc.moveTo(gx + 70 + 2 * (gw - 70) / 3 + 30, gy + 50 + 38 + 14)
   .lineTo(gx + 70 + (gw - 70) / 3 + 30, gy + 50 + 2 * 38 + 14).stroke();
doc.undash();
doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.accent)
   .text('arrastrás →', gx + 70 + (gw - 70) / 3 + 60, gy + 60 + 38 + 6);
doc.restore();

y = gy + gh + 24;
y = h2('Drag & drop estilo Google Calendar', y);
y = p('Arrastrás vertical para cambiar la hora (snap 15 min). Horizontal cambia barbero (vista día) o día (vista semana). Si el destino está ocupado o fuera de horario, el sistema rechaza y vuelve al lugar original.', y + 4);

pageFooter(4);

// ── Page 5 — Equipo y comisiones ───────────────────────────────────────────

doc.addPage();
fillBg(COLORS.bg);
pageHeader('04 · Equipo y comisiones');

y = 90;
y = h1('Cierre de mes\nautomático.', y);

y = h2('Cuánto le pagás a cada uno', y + 16);
y = p('Cada barbero tiene su % de comisión configurable inline. El sistema cuenta los cortes COMPLETADOS del mes corriente, suma el revenue, y muestra el monto exacto a pagarle. Editás el % en la card y el "a pagar" se recalcula al toque.', y + 4);

// 3 cards de barbero
const cardW = (A4.w - 112 - 16) / 3;
const cardY = y + 20;
const barberStats = [
  { name: 'Tomás Aguirre', initials: 'TA', hue: '#5b3f2c', count: 42, revenue: '$252.000', pct: 50, pay: '$126.000' },
  { name: 'Iván Vargas',   initials: 'IV', hue: '#3f4a5b', count: 36, revenue: '$216.000', pct: 45, pay: '$97.200'  },
  { name: 'Nico Cruz',     initials: 'NC', hue: '#5b3f4a', count: 28, revenue: '$168.000', pct: 50, pay: '$84.000'  }
];
barberStats.forEach((b, i) => {
  const x = 56 + i * (cardW + 8);
  card(x, cardY, cardW, 200, COLORS.darkCard);
  // avatar
  doc.save();
  doc.circle(x + 24, cardY + 24, 14).fill(b.hue);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.bg).text(b.initials, x + 18, cardY + 20);
  doc.restore();
  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.bg).text(b.name, x + 46, cardY + 14, { width: cardW - 56 });
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.darkMuted).text('Senior · 5 años', x + 46, cardY + 28);

  // mes en curso
  const my2 = cardY + 60;
  doc.save();
  doc.roundedRect(x + 12, my2, cardW - 24, 120, 6).fill(COLORS.dark);
  doc.font('Helvetica-Bold').fontSize(7).fillColor(COLORS.darkMuted)
     .text('MES EN CURSO', x + 22, my2 + 12, { characterSpacing: 1.5 });
  doc.font('Helvetica').fontSize(7).fillColor(COLORS.darkMuted)
     .text(`${b.pct}%`, x + cardW - 40, my2 + 12);
  doc.font('Times-Roman').fontSize(22).fillColor(COLORS.bg).text(String(b.count), x + 22, my2 + 30);
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.darkMuted).text(`cortes · ${b.revenue}`, x + 22, my2 + 60);

  doc.font('Times-Roman').fontSize(22).fillColor(COLORS.accent)
     .text(b.pay, x + 22, my2 + 78, { width: cardW - 44, align: 'right' });
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.darkMuted)
     .text('a pagar', x + 22, my2 + 104, { width: cardW - 44, align: 'right' });
  doc.restore();
});

y = cardY + 220;
y = h2('Setup en segundos', y);
y = p('Agregás un barbero, le ponés su comisión (default 50%) y listo. Si después decidís bajarla al 45%, lo cambiás desde la misma card y el monto se recalcula automáticamente.', y + 4);

pageFooter(5);

// ── Page 6 — Caja y stock ──────────────────────────────────────────────────

doc.addPage();
fillBg(COLORS.bg);
pageHeader('05 · Caja y stock');

y = 90;
y = h1('Plata que entra,\nplata que sale.', y);

// dos columnas
const col1x = 56, col2x = 56 + (A4.w - 112) / 2 + 12;
const colW = (A4.w - 112) / 2 - 12;

// caja
card(col1x, y + 20, colW, 230, COLORS.card);
doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.accent)
   .text('CAJA DEL DÍA', col1x + 20, y + 36, { characterSpacing: 2 });
doc.font('Times-Roman').fontSize(34).fillColor(COLORS.ink)
   .text('$84.500', col1x + 20, y + 56);
doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted)
   .text('14 ventas · ticket prom $6.035', col1x + 20, y + 96);

// línea
doc.moveTo(col1x + 20, y + 122).lineTo(col1x + colW - 20, y + 122).strokeColor(COLORS.line).stroke();

const txns = [
  ['11:30', 'Corte · Tomás',     '$6.000'],
  ['12:15', 'Corte+barba · Nico','$8.500'],
  ['13:00', 'Pomada (stock)',    '$4.500'],
  ['14:30', 'Corte · Iván',      '$6.000']
];
let ty = y + 138;
txns.forEach(([t, label, amt]) => {
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted).text(t, col1x + 20, ty);
  doc.font('Helvetica').fontSize(10).fillColor(COLORS.ink).text(label, col1x + 60, ty);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.ink).text(amt, col1x + 20, ty, { width: colW - 40, align: 'right' });
  ty += 18;
});

// stock
card(col2x, y + 20, colW, 230, COLORS.card);
doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.accent)
   .text('STOCK', col2x + 20, y + 36, { characterSpacing: 2 });
doc.font('Times-Roman').fontSize(34).fillColor(COLORS.ink)
   .text('38 ítems', col2x + 20, y + 56);
doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted)
   .text('3 en bajo stock', col2x + 20, y + 96);
doc.moveTo(col2x + 20, y + 122).lineTo(col2x + colW - 20, y + 122).strokeColor(COLORS.line).stroke();

const items = [
  ['Pomada matte',   '12', '$4.500'],
  ['Cera fijación',  '8',  '$3.800'],
  ['Shampoo barba',  '2',  '$5.200'],
  ['Spray fijador',  '14', '$3.500']
];
let iy = y + 138;
items.forEach(([n, q, pr]) => {
  doc.font('Helvetica').fontSize(10).fillColor(COLORS.ink).text(n, col2x + 20, iy);
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted).text(`${q} u`, col2x + 20, iy, { width: 100, align: 'right' });
  doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.ink).text(pr, col2x + 20, iy, { width: colW - 40, align: 'right' });
  iy += 18;
});

y = y + 270;
y = h2('Caja integrada con la agenda', y);
y = p('Cuando un turno se marca como completado, la caja registra el servicio automáticamente. Productos del stock se descuentan al venderse. Cierre de día con un click.', y + 4);

pageFooter(6);

// ── Page 7 — Multi-sede + planes ───────────────────────────────────────────

doc.addPage();
fillBg(COLORS.bg);
pageHeader('06 · Planes');

y = 90;
y = h1('Empezá gratis.\nCrecé sin migrar.', y);

y = p('Dos planes, mismo producto. Pasás de uno a otro sin perder data.', y + 16);

// dos cards de plan
const planY = y + 20;
const planW = (A4.w - 112 - 16) / 2;

card(56, planY, planW, 320, COLORS.card);
doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.muted)
   .text('STARTER', 76, planY + 24, { characterSpacing: 2 });
doc.font('Times-Roman').fontSize(36).fillColor(COLORS.ink).text('Gratis', 76, planY + 44);
doc.font('Helvetica').fontSize(10).fillColor(COLORS.muted).text('para arrancar', 76, planY + 88);

let py = planY + 120;
['1 sede','Hasta 3 barberos','Reservas online ilimitadas','Agenda + drag & drop','Equipo + comisiones','Caja del día']
  .forEach(item => { py = bullet(item, py, { x: 76, width: planW - 40 }); });

card(56 + planW + 16, planY, planW, 320, COLORS.ink);
doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.darkMuted)
   .text('PRO', 76 + planW + 16, planY + 24, { characterSpacing: 2 });
doc.font('Times-Roman').fontSize(36).fillColor(COLORS.bg).text('$ a definir', 76 + planW + 16, planY + 44);
doc.font('Helvetica').fontSize(10).fillColor(COLORS.darkMuted).text('por sede / mes', 76 + planW + 16, planY + 88);

py = planY + 120;
[
  'Sedes ilimitadas',
  'Barberos ilimitados',
  'Stock con bajo-stock alerts',
  'Reportes mensuales por barbero',
  'Email recordatorios 24 hs antes',
  'Soporte prioritario'
].forEach(item => {
  doc.save();
  doc.circle(76 + planW + 16 + 4, py + 6, 2.5).fill(COLORS.accent);
  doc.restore();
  doc.font('Helvetica').fontSize(11).fillColor(COLORS.bg)
     .text(item, 76 + planW + 16 + 18, py, { width: planW - 40, lineGap: 4 });
  py = doc.y + 4;
});

pageFooter(7);

// ── Page 8 — Cierre / Contacto ─────────────────────────────────────────────

doc.addPage();
fillBg(COLORS.ink);

doc.save();
doc.circle(-50, A4.h + 40, 200).strokeColor(COLORS.darkLine).lineWidth(1).stroke();
doc.circle(-30, A4.h + 100, 140).strokeColor(COLORS.darkLine).lineWidth(1).stroke();
doc.restore();

doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.darkMuted)
   .text('07 · LISTO PARA ARRANCAR', 56, 80, { characterSpacing: 3 });

doc.font('Times-Roman').fontSize(56).fillColor(COLORS.bg)
   .text('Probala con', 56, 200);
doc.font('Times-Italic').fontSize(56).fillColor(COLORS.accent)
   .text('tu barbería.', 56, doc.y);

doc.font('Helvetica').fontSize(13).fillColor(COLORS.darkMuted)
   .text('Setup en 10 minutos. Sin tarjeta. Tu link público listo para mandar al WhatsApp del local.', 56, doc.y + 30, { width: 420, lineGap: 5 });

// CTA box
const ctaY = 480;
card(56, ctaY, A4.w - 112, 110, COLORS.darkCard);
doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.darkMuted)
   .text('CÓMO EMPEZAR', 76, ctaY + 22, { characterSpacing: 2 });
doc.font('Times-Roman').fontSize(22).fillColor(COLORS.bg)
   .text('turnosbarberia.com/registro', 76, ctaY + 42);
doc.font('Helvetica').fontSize(10).fillColor(COLORS.darkMuted)
   .text('Te creamos la cuenta, configuramos servicios y barberos, y te dejamos el link público listo para compartir.',
     76, ctaY + 76, { width: A4.w - 152, lineGap: 3 });

// pie
doc.font('Helvetica').fontSize(9).fillColor(COLORS.darkMuted)
   .text('didigital studio', 56, A4.h - 70)
   .text('hola@didigitalstudio.com · didigitalstudio.com', 0, A4.h - 70, { width: A4.w - 56, align: 'right' });

// final
doc.end();

doc.on('end', () => {
  console.log(`PDF generado: ${OUT}`);
});
