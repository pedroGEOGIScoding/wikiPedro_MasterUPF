/* =====================================================================
   eq-applets-c.js · Módulo C del Tema 3 Ecuaciones e inecuaciones
   Applets de:
     - circunferencia goniométrica y razones de los ángulos notables
     - ecuaciones trigonométricas elementales (familias y primer giro)
     - ecuaciones trigonométricas reducibles a una cuadrática
     - ecuaciones trigonométricas resueltas con identidades
     - laboratorio de propiedades de las desigualdades
     - inecuaciones de primer grado, dobles desigualdades y sistemas
     - signo de la parábola, tabla de signos, inecuaciones racionales
     - inecuaciones con valor absoluto
     - generador de ejercicios con corrección y autoevaluación final
   Depende de eq-applets.js (window.EQ). Se carga después.
   ===================================================================== */
(function () {
  'use strict';
  var S = window.EQ;
  if (!S) { console.error('[ecuaciones] eq-applets-c.js sin núcleo'); return; }
  var R = S.registry, K = S.K, KD = S.KD, F = S.Frac;
  /* Red de seguridad: el armazón anota los avisos en window.RE.log. */
  if (!window.RE) window.RE = { log: [] };

  var COL = S.COL, Conj = S.Conj, RELS = S.RELS, PI = Math.PI;
  var TXT = { sen: '\\operatorname{sen}', cos: '\\cos', tg: '\\operatorname{tg}' };
  var FUN = { sen: Math.sin, cos: Math.cos, tg: Math.tan };

  /* ==================================================================
     0 · utilidades comunes del módulo
     ================================================================== */
  function fr(n, d) { return new F(n, d === undefined ? 1 : d); }

  /* Cadena de transformaciones equivalentes. */
  function cadena(filas) {
    return '<div class="eq-cadena">' + filas.map(function (f) {
      var cuerpo = f.html !== undefined ? f.html : KD(f.tex);
      return '<div class="eq-fila' + (f.clase ? ' ' + f.clase : '') + '">' +
        '<div class="eq-rot">' + S.esc(f.rot) + '</div>' +
        '<div class="eq-mat">' + cuerpo + '</div></div>';
    }).join('') + '</div>';
  }

  function cajas(items) {                       /* rejilla de fichas */
    return '<div class="eq-check">' + items.map(function (i) {
      return '<div class="eq-check-caja' + (i.clase ? ' ' + i.clase : '') + '">' + i.html + '</div>';
    }).join('') + '</div>';
  }

  function aviso(t) { return '<div class="mx-info">' + t + '</div>'; }

  /* Recta real con varios conjuntos apilados y una escala común. */
  function rectaMulti(list, opts) {
    opts = opts || {};
    var pts = [];
    list.forEach(function (it) {
      it.C.t.forEach(function (i) {
        if (isFinite(i.a)) pts.push(i.a);
        if (isFinite(i.b)) pts.push(i.b);
      });
    });
    (opts.marcas || []).forEach(function (v) { if (isFinite(v)) pts.push(v); });
    if (!pts.length) pts = [0];
    var min = Math.min.apply(null, pts), max = Math.max.apply(null, pts);
    if (max - min < 2) { var c0 = (min + max) / 2; min = c0 - 2.5; max = c0 + 2.5; }
    var pad = (max - min) * 0.28 + 0.5;
    min = Math.floor(min - pad); max = Math.ceil(max + pad);
    var W = 1000, alto = 98, top = opts.titulo ? 52 : 22;
    var H = top + alto * list.length + 20, mx = 210;
    function X(v) {
      var w = Math.min(Math.max(v, min), max);
      return mx + (w - min) / (max - min) * (W - mx - 56);
    }
    var pasoE = Math.max(1, Math.round((max - min) / 12));
    var b = '';
    list.forEach(function (it, idx) {
      var yy = top + alto * idx + alto / 2;
      var col = it.col || COL.azul;
      it.C.t.forEach(function (i) {
        if (i.a === i.b) return;
        var x1 = X(i.a), x2 = X(i.b);
        b += S.rect(x1, yy - 15, Math.max(x2 - x1, 1), 30, 'rgba(25,118,210,.17)', 'none', { r: 5 });
        b += S.line(x1, yy, x2, yy, col, 7);
      });
      b += S.line(mx - 26, yy, W - 34, yy, '#455a64', 2.2);
      b += S.poly([[W - 34, yy], [W - 50, yy - 8], [W - 50, yy + 8]], '#455a64', '#455a64');
      b += S.poly([[mx - 26, yy], [mx - 10, yy - 8], [mx - 10, yy + 8]], '#455a64', '#455a64');
      for (var v = Math.ceil(min); v <= max; v += pasoE) {
        b += S.line(X(v), yy - 7, X(v), yy + 7, '#90a4ae', 1.4);
        b += S.txt(X(v), yy + 30, S.etq(v, 0), { size: 17, fill: '#546e7a' });
      }
      it.C.t.forEach(function (i) {
        [[i.a, i.ai], [i.b, i.bi]].forEach(function (par) {
          if (!isFinite(par[0])) return;
          b += par[1] ? S.circle(X(par[0]), yy, 10, col, '#fff', 3)
            : S.circle(X(par[0]), yy, 10, '#fff', col, 3.2);
          b += S.txt(X(par[0]), yy - 24, S.etq(par[0], 2), { size: 18, fill: col, weight: '700' });
        });
      });
      if (it.C.esVacio()) b += S.txt((mx + W) / 2, yy - 24, 'conjunto vacío', { size: 19, fill: COL.rojo, weight: '700' });
      else if (it.C.esTodo()) b += S.txt((mx + W) / 2, yy - 26, 'toda la recta real', { size: 18, fill: COL.verde, weight: '700' });
      b += S.txt(mx - 42, yy + 7, S.esc(it.rot || ''), { size: 19, anchor: 'end', fill: '#263238', weight: '600' });
    });
    if (opts.titulo) b = S.txt(W / 2, 32, S.esc(opts.titulo), { size: 21, weight: '700', fill: COL.azulOsc }) + b;
    return S.svgWrap(b, W, H, opts.label || 'Conjuntos solución sobre la recta real', opts.cap);
  }

  /* Ejes con rango vertical automático. */
  function ejesAuto(curvas, xmin, xmax, opts) {
    opts = opts || {};
    var lo = Infinity, hi = -Infinity;
    for (var i = 0; i <= 240; i++) {
      var x = xmin + (xmax - xmin) * i / 240;
      curvas.forEach(function (c) {
        var y;
        try { y = c.f(x); } catch (e) { y = NaN; }
        if (isFinite(y)) { if (y < lo) lo = y; if (y > hi) hi = y; }
      });
    }
    if (!isFinite(lo) || !isFinite(hi)) { lo = -5; hi = 5; }
    var tope = opts.tope === undefined ? 1e9 : opts.tope;
    lo = Math.max(lo, -tope); hi = Math.min(hi, tope);
    lo = Math.min(lo, -1); hi = Math.max(hi, 1);
    var m = (hi - lo) * 0.14 + 0.6;
    return S.ejes({
      xmin: xmin, xmax: xmax,
      ymin: Math.floor(lo - m), ymax: Math.ceil(hi + m),
      W: 1000, H: opts.H || 520, curvas: curvas,
      puntos: opts.puntos || [], paso: opts.paso, pasoY: opts.pasoY,
      label: opts.label || 'Gráfica', cap: opts.cap
    });
  }

  /* Lectura de una inecuación escrita en una línea: 2x-1>3 */
  function leeInec(t, nombre) {
    var s = String(t || '').trim()
      .replace(/≥/g, '>=').replace(/≤/g, '<=')
      .replace(/=>/g, '>=').replace(/=</g, '<=');
    if (!s) throw Error('Escribe una inecuación completa, por ejemplo 2x-1>3.');
    var rel = null, pos = -1;
    ['>=', '<=', '>', '<'].some(function (r) {
      var k = s.indexOf(r);
      if (k > 0) { rel = r; pos = k; return true; }
      return false;
    });
    if (!rel) throw Error('Falta el signo de desigualdad en «' + s + '». Escribe >, <, >= o <=.');
    var izq = S.parsePol(s.slice(0, pos), 'x', (nombre || 'el primer miembro'));
    var der = S.parsePol(s.slice(pos + rel.length), 'x', (nombre || 'el segundo miembro'));
    return { izq: izq, der: der, rel: rel, txt: s };
  }

  /* Inecuación de primer grado a partir de los dos miembros. */
  function inecDe(izq, der, rel) {
    var D = S.pRecorta(S.pResta(izq, der));
    var g = S.pGrado(D);
    if (g > 1) throw Error('Al pasar todo a un miembro queda un polinomio de grado ' + g +
      '. Esta inecuación no es de primer grado: usa el applet de la tabla de signos.');
    var a = g === 1 ? D[1] : fr(0);
    var b = D[0];
    return { D: D, a: a, b: b, grado: g, I: S.inecLineal(a, b, rel) };
  }

  function relTex(rel) { return RELS[rel].tex; }
  function relGira(rel) { return { '>': '<', '<': '>', '>=': '<=', '<=': '>=' }[rel]; }

  /* --- razones exactas de los ángulos notables ---------------------- */
  var BASE = {
    0: ['0', '1', '0'],
    30: ['\\dfrac{1}{2}', '\\dfrac{\\sqrt{3}}{2}', '\\dfrac{\\sqrt{3}}{3}'],
    45: ['\\dfrac{\\sqrt{2}}{2}', '\\dfrac{\\sqrt{2}}{2}', '1'],
    60: ['\\dfrac{\\sqrt{3}}{2}', '\\dfrac{1}{2}', '\\sqrt{3}'],
    90: ['1', '0', null]
  };
  function razonesTex(deg) {
    var d = ((deg % 360) + 360) % 360;
    if (Math.abs(d - Math.round(d)) > 1e-9) return null;
    d = Math.round(d);
    var ref, ss, sc;
    if (d <= 90) { ref = d; ss = 1; sc = 1; }
    else if (d <= 180) { ref = 180 - d; ss = 1; sc = -1; }
    else if (d <= 270) { ref = d - 180; ss = -1; sc = -1; }
    else { ref = 360 - d; ss = -1; sc = 1; }
    var b = BASE[ref];
    if (!b) return null;
    function sg(s, sign) { return (s === null || s === '0') ? s : (sign < 0 ? '-' + s : s); }
    var st = sg(b[0], ss), ct = sg(b[1], sc);
    var tt = (b[2] === null || ct === '0') ? null : sg(b[2], ss * sc);
    return { sen: st, cos: ct, tg: tt, ref: ref, cuad: d === 0 ? 0 : Math.floor(d / 90) + (d % 90 === 0 ? 0 : 1) };
  }
  function cuadranteTxt(deg) {
    var d = ((deg % 360) + 360) % 360;
    if (Math.abs(d % 90) < 1e-9) return 'sobre un eje';
    if (d < 90) return 'primer cuadrante';
    if (d < 180) return 'segundo cuadrante';
    if (d < 270) return 'tercer cuadrante';
    return 'cuarto cuadrante';
  }

  /* --- circunferencia goniométrica ---------------------------------- */
  function circulo(angs, opts) {
    opts = opts || {};
    var W = 1000, H = 560, cx = W / 2, cy = H / 2, Rr = 198;
    function PX(t) { return cx + Rr * Math.cos(t); }
    function PY(t) { return cy - Rr * Math.sin(t); }
    var b = '';
    b += S.line(cx - Rr - 96, cy, cx + Rr + 96, cy, '#607d8b', 2);
    b += S.line(cx, cy + Rr + 74, cx, cy - Rr - 74, '#607d8b', 2);
    b += S.txt(cx + Rr + 78, cy - 14, 'eje del coseno', { size: 17, fill: '#78909c', anchor: 'middle' });
    b += S.txt(cx + 104, cy - Rr - 56, 'eje del seno', { size: 17, fill: '#78909c' });
    b += S.circle(cx, cy, Rr, 'none', '#90a4ae', 2.2);
    b += S.txt(cx + Rr + 4, cy + 26, '1', { size: 17, fill: '#78909c' });
    b += S.txt(cx - Rr - 4, cy + 26, '−1', { size: 17, fill: '#78909c' });
    b += S.txt(cx - 22, cy - Rr - 6, '1', { size: 17, fill: '#78909c' });
    b += S.txt(cx - 26, cy + Rr + 22, '−1', { size: 17, fill: '#78909c' });

    if (opts.notables !== false) {
      S.NOTABLES.forEach(function (n) {
        var t = n.rad;
        b += S.line(cx + 0.955 * Rr * Math.cos(t), cy - 0.955 * Rr * Math.sin(t),
          cx + 1.045 * Rr * Math.cos(t), cy - 1.045 * Rr * Math.sin(t), '#b0bec5', 1.8);
        var g = Math.round(n.v * 180);
        if (g % 30 === 0 || g % 45 === 0) {
          b += S.txt(cx + (Rr + 26) * Math.cos(t), cy - (Rr + 26) * Math.sin(t) + 6,
            g + '°', { size: 14, fill: '#90a4ae' });
        }
      });
    }
    if (opts.tg) {
      b += S.line(cx + Rr, cy - Rr - 64, cx + Rr, cy + Rr + 64, '#cfd8dc', 2, '6 5');
      b += S.txt(cx + Rr + 66, cy + Rr + 56, 'recta tangente', { size: 15, fill: '#90a4ae' });
    }

    angs.forEach(function (A, idx) {
      var t2 = ((A.rad % (2 * PI)) + 2 * PI) % (2 * PI);
      var col = A.col || COL.azul;
      var px = PX(t2), py = PY(t2);
      var rr = 58 + idx * 20;
      if (t2 > 0.02) {
        var grande = t2 > PI ? 1 : 0;
        b += S.path('M ' + (cx + rr) + ' ' + cy + ' A ' + rr + ' ' + rr + ' 0 ' + grande + ' 0 ' +
          (cx + rr * Math.cos(t2)).toFixed(1) + ' ' + (cy - rr * Math.sin(t2)).toFixed(1), col, 2.6, 'none', '7 5');
      }
      if (opts.proy) {
        b += S.line(px, py, px, cy, col, 1.8, '5 5');
        b += S.line(px, py, cx, py, col, 1.8, '5 5');
        b += S.line(cx, cy + 4, px, cy + 4, COL.naranja, 7);
        b += S.line(cx - 4, cy, cx - 4, py, COL.verde, 7);
        /* El rótulo del coseno se aparta al lado libre: si el seno es
           negativo el punto está abajo, así que el rótulo sube. Y se
           separa del eje vertical para no pisar el segmento del seno. */
        var yCos = Math.sin(t2) < 0 ? cy - 20 : cy + 36;
        var xCos = (cx + px) / 2 + (px >= cx ? 44 : -44);
        b += S.txt(xCos, yCos, 'cos = ' + S.etq(Math.cos(t2), 3), { size: 18, fill: COL.naranja, weight: '700' });
        var yLab = (cy + py) / 2 + (Math.abs(py - cy) < 34 ? (py <= cy ? -26 : 26) : 6);
        b += S.txt(cx - 74, yLab, 'sen = ' + S.etq(Math.sin(t2), 3), { size: 18, fill: COL.verde, weight: '700' });
      }
      if (opts.tg && Math.abs(Math.cos(t2)) > 0.045) {
        var tv = Math.tan(t2);
        if (Math.abs(tv) <= 2.1) {
          var yt = cy - Rr * tv;
          b += S.line(cx, cy, cx + Rr, yt, col, 1.8, '4 4');
          b += S.circle(cx + Rr, yt, 8, COL.morado, '#fff', 2.4);
          b += S.txt(cx + Rr + 78, yt + 6, 'tg = ' + S.etq(tv, 3), { size: 17, fill: COL.morado, weight: '700' });
        }
      }
      b += S.line(cx, cy, px, py, col, 3.4);
      b += S.circle(px, py, 9.5, col, '#fff', 2.6);
      if (A.rot) {
        b += S.txt(cx + (Rr + 62) * Math.cos(t2), cy - (Rr + 62) * Math.sin(t2) + 7,
          S.esc(A.rot), { size: 20, fill: col, weight: '700' });
      }
    });
    return S.svgWrap(b, W, H, opts.label || 'Circunferencia goniométrica', opts.cap);
  }

  /* --- familias y soluciones de una ecuación elemental -------------- */
  function famHTML(Tr) {
    return '<div class="eq-fam">' + Tr.familia.map(function (f) {
      return '<span class="eq-fam-item">' + K('x = ' + f.tex) + '</span>';
    }).join('') + '</div>';
  }
  function solsTabla(Tr, fn) {
    var filas = Tr.enRango.map(function (a, i) {
      return ['x_{' + (i + 1) + '}', K(S.anguloTex(a)), K(S.gradTex(a)),
        K(TXT[fn] + ' x = ' + S.kf(FUN[fn](a), 3))];
    }).map(function (f) { return [K(f[0]), f[1], f[2], f[3]]; });
    return S.tabla(['Solución', 'En radianes', 'En grados', 'Comprobación'], filas);
  }

  /* Resuelve  razón = valor  y devuelve el bloque completo de salida. */
  function bloqueElemental(fn, valorTex, valor, opts) {
    opts = opts || {};
    var Tr = S.solTrig(fn, valor);
    var h = '';
    if (Tr.imposible) {
      h += cadena([
        { rot: 'Ecuación', tex: TXT[fn] + ' x = ' + valorTex },
        { rot: 'Recorrido de la razón', tex: '-1 \\leq ' + TXT[fn] + ' x \\leq 1', clase: 'eq-clave' },
        { rot: 'Conclusión', tex: '\\left|' + valorTex + '\\right| > 1 \\;\\Longrightarrow\\; \\text{sin solución}', clase: 'eq-mal' }
      ]);
      h += '<p>' + S.badge('sin solución', 'no') + ' El seno y el coseno de un ángulo son coordenadas de un punto de la ' +
        'circunferencia de radio 1, así que nunca se salen del intervalo $[-1,1]$. La recta horizontal ' +
        'de altura ' + K(valorTex) + ' no corta a la curva.</p>';
      h += ejesAuto([
        { f: FUN[fn], col: COL.azul, label: 'y = \\operatorname{' + (fn === 'cos' ? 'cos' : 'sen') + '} x' },
        { f: function () { return valor; }, col: COL.rojo, dash: '7 5', label: 'y = ' + valorTex }
      ], 0, 2 * PI, { paso: 1, cap: 'La recta y la curva no se cortan: ninguna abscisa cumple la ecuación.' });
      return h;
    }
    var base = Tr.base[0];
    var pasos = [{ rot: 'Ecuación elemental', tex: TXT[fn] + ' x = ' + valorTex }];
    if (fn === 'tg') {
      pasos.push({ rot: 'Ángulo base (arco tangente)', tex: '\\alpha = \\operatorname{arctg}\\left(' + valorTex + '\\right) = ' + S.anguloTex(base) + ' = ' + S.gradTex(base) });
      pasos.push({ rot: 'La tangente se repite cada media vuelta', tex: 'x = ' + S.anguloTex(base) + ' + k\\pi, \\quad k \\in \\mathbb{Z}', clase: 'eq-clave' });
    } else if (fn === 'sen') {
      pasos.push({ rot: 'Ángulo base (arco seno)', tex: '\\alpha = \\operatorname{arcsen}\\left(' + valorTex + '\\right) = ' + S.anguloTex(base) + ' = ' + S.gradTex(base) });
      pasos.push({ rot: 'Simetría respecto del eje vertical', tex: '\\operatorname{sen}(\\pi - \\alpha) = \\operatorname{sen}\\alpha \\;\\Longrightarrow\\; x = ' + S.anguloTex(Tr.base[1]) });
      pasos.push({ rot: 'Dos familias, periodo $2\\pi$', tex: 'x = ' + Tr.familia[0].tex + ' \\quad\\text{o}\\quad x = ' + Tr.familia[1].tex, clase: 'eq-clave' });
    } else {
      pasos.push({ rot: 'Ángulo base (arco coseno)', tex: '\\alpha = \\arccos\\left(' + valorTex + '\\right) = ' + S.anguloTex(base) + ' = ' + S.gradTex(base) });
      pasos.push({ rot: 'Simetría respecto del eje horizontal', tex: '\\cos(2\\pi - \\alpha) = \\cos\\alpha \\;\\Longrightarrow\\; x = ' + S.anguloTex(Tr.base[1]) });
      pasos.push({ rot: 'Dos familias, periodo $2\\pi$', tex: 'x = ' + Tr.familia[0].tex + ' \\quad\\text{o}\\quad x = ' + Tr.familia[1].tex, clase: 'eq-clave' });
    }
    pasos.push({
      rot: 'Soluciones del primer giro',
      tex: Tr.enRango.map(function (a) { return S.anguloTex(a); }).join(', \\quad ') || '\\varnothing',
      clase: 'eq-bien'
    });
    h += cadena(pasos);
    h += '<p><b>Familias (todas las soluciones):</b></p>' + famHTML(Tr);
    h += solsTabla(Tr, fn);
    h += circulo(Tr.enRango.map(function (a, i) {
      return { rad: a, rot: S.gradTex(a).replace('^{\\circ}', '°'), col: i === 0 ? COL.azul : COL.rojo };
    }), {
      proy: opts.proy !== false, tg: fn === 'tg',
      cap: 'Las soluciones del primer giro, marcadas sobre la circunferencia. Cada una arrastra infinitas más, ' +
        'sumando vueltas completas.'
    });
    if (fn !== 'tg') {
      h += ejesAuto([
        { f: FUN[fn], col: COL.azul, label: 'y = ' + TXT[fn] + ' x' },
        { f: function () { return valor; }, col: COL.rojo, dash: '7 5', label: 'y = ' + valorTex }
      ], 0, 2 * PI, {
        paso: 1,
        puntos: Tr.enRango.map(function (a) { return { x: a, y: valor, col: COL.verde }; }),
        cap: 'Resolver la ecuación es cortar la curva con la recta horizontal de altura ' + S.nc(valor, 3) + '.'
      });
    }
    return h;
  }

  /* Resuelve una cuadrática en t = razón trigonométrica. */
  function bloqueCuadEnT(a, b, c, fn, cabecera) {
    var Q = S.solCuadratica(a, b, c);
    var vt = fn === 'sen' ? 'sen x' : (fn === 'cos' ? '\\cos x' : '\\operatorname{tg} x');
    var h = cadena(cabecera.concat([
      { rot: 'Cambio de variable', tex: 't = ' + TXT[fn] + ' x \\;\\Longrightarrow\\; ' + S.pTex(S.pDe([c, b, a]), 't') + ' = 0' },
      {
        rot: 'Discriminante', tex: '\\Delta = ' + Q.b + '^2 - 4\\cdot(' + Q.a + ')\\cdot(' + Q.c + ') = ' + Q.disc,
        clase: Q.disc < 0 ? 'eq-mal' : 'eq-clave'
      }
    ]));
    if (Q.tipo === 'ninguna') {
      return h + '<p>' + S.badge('sin solución', 'no') + ' La cuadrática auxiliar no tiene raíces reales, ' +
        'así que no hay ningún valor posible de ' + K(vt) + ' y la ecuación trigonométrica no tiene solución.</p>';
    }
    if (Q.tipo === 'lineal') {
      if (Q.sol.tipo !== 'unica') {
        return h + '<p>' + S.badge('caso degenerado', 'avi') + ' Con ' + K('a = 0') + ' y ' + K('b = 0') +
          ' no queda una ecuación en ' + K('t') + ': revisa los coeficientes.</p>';
      }
      Q.raices = [new S.Irr(Number(Q.sol.x.n), 0, 1, Number(Q.sol.x.d))];
    }
    var filas = [], validas = [];
    Q.raices.forEach(function (r, i) {
      var v = r.val();
      var fuera = fn !== 'tg' && Math.abs(v) > 1 + 1e-12;
      filas.push([
        K('t_{' + (i + 1) + '} = ' + r.tex()),
        K(S.kf(v, 4)),
        fuera ? S.badge('se descarta', 'no') : S.badge('válida', 'si'),
        fuera ? 'Está fuera del intervalo $[-1,1]$: ningún ángulo tiene esa razón.'
          : 'Da lugar a una ecuación elemental ' + K(TXT[fn] + ' x = ' + r.tex()) + '.'
      ]);
      if (!fuera) validas.push(r);
    });
    h += S.tabla(['Raíz auxiliar', 'Valor aproximado', 'Filtro $-1 \\leq t \\leq 1$', 'Consecuencia'], filas);
    if (!validas.length) {
      return h + '<p>' + S.badge('sin solución', 'no') + ' Las dos raíces auxiliares quedan fuera del recorrido ' +
        'de la razón trigonométrica: la ecuación no tiene solución.</p>';
    }
    var todas = [];
    validas.forEach(function (r, i) {
      var Tr = S.solTrig(fn, r.val());
      h += '<h5 class="eq-expr-lab">Ecuación elemental ' + (i + 1) + ': ' + K(TXT[fn] + ' x = ' + r.tex()) + '</h5>';
      h += famHTML(Tr);
      h += solsTabla(Tr, fn);
      Tr.enRango.forEach(function (a) { todas.push(a); });
    });
    todas = todas.filter(function (v, i, A) {
      return A.findIndex(function (w) { return Math.abs(w - v) < 1e-9; }) === i;
    }).sort(function (u, v) { return u - v; });
    h += S.expr('Todas las soluciones del primer giro',
      todas.map(function (a) { return S.anguloTex(a); }).join(', \\quad ') || '\\varnothing');
    h += circulo(todas.map(function (a, i) {
      return { rad: a, rot: S.gradTex(a).replace('^{\\circ}', '°'), col: [COL.azul, COL.rojo, COL.verde, COL.morado][i % 4] };
    }), { proy: false, cap: 'Las ' + todas.length + ' soluciones del intervalo $[0,2\\pi)$ sobre la circunferencia.' });
    return h;
  }

  /* ==================================================================
     1 · circunferencia goniométrica interactiva
     ================================================================== */
  R.circunGonio = function (node) {
    S.shell(node, 'Circunferencia goniométrica y razones del ángulo',
      'Mueve el deslizador del ángulo (en grados) y observa el punto que recorre la circunferencia de radio 1. ' +
      'La abscisa del punto es el <code>coseno</code>, la ordenada es el <code>seno</code> y la tangente se lee ' +
      'sobre la recta vertical <code>x = 1</code>. Los botones de escenario llevan directamente a ángulos notables ' +
      'como <code>30</code>, <code>135</code> o <code>240</code>.',
      [
        { id: 'g', label: 'Ángulo en grados', type: 'range', min: 0, max: 360, step: 1, value: 30 },
        { id: 'proy', label: 'Ver las proyecciones', type: 'check', value: true },
        { id: 'tg', label: 'Ver la tangente', type: 'check', value: true },
        {
          type: 'presets', list: [
            { label: '30°', apply: function (c) { c.g.value = 30; } },
            { label: '45°', apply: function (c) { c.g.value = 45; } },
            { label: '90°', apply: function (c) { c.g.value = 90; } },
            { label: '135°', apply: function (c) { c.g.value = 135; } },
            { label: '180°', apply: function (c) { c.g.value = 180; } },
            { label: '240°', apply: function (c) { c.g.value = 240; } },
            { label: '315°', apply: function (c) { c.g.value = 315; } }
          ]
        }
      ],
      function (v) {
        var g = S.real(v.g, 0, 360, 'El ángulo');
        var rad = g * PI / 180;
        var ex = razonesTex(g);
        var sn = Math.sin(rad), cs = Math.cos(rad), tg = Math.cos(rad) === 0 ? null : Math.tan(rad);
        if (Math.abs(Math.cos(rad)) < 1e-12) tg = null;
        var h = '';
        h += S.kvs([
          'Ángulo: ' + K(S.etq(g, 0).replace('−', '-') + '^{\\circ}'),
          'En radianes: ' + K(ex ? S.anguloTex(rad) : S.kf(rad, 4) + '\\ \\text{rad}'),
          'Posición: ' + cuadranteTxt(g),
          'Punto: ' + K('P\\left(' + S.kf(cs, 3) + ',\\; ' + S.kf(sn, 3) + '\\right)')
        ]);
        h += S.tabla(['Razón', 'Valor exacto', 'Valor aproximado', 'Signo'], [
          [K(TXT.sen + ' ' + (ex ? S.anguloTex(rad) : 'x')), K(ex ? ex.sen : S.kf(sn, 4)), K(S.kf(sn, 4)),
            sn > 1e-12 ? S.badge('positivo', 'si') : (sn < -1e-12 ? S.badge('negativo', 'no') : S.badge('nulo', 'info'))],
          [K(TXT.cos + ' ' + (ex ? S.anguloTex(rad) : 'x')), K(ex ? ex.cos : S.kf(cs, 4)), K(S.kf(cs, 4)),
            cs > 1e-12 ? S.badge('positivo', 'si') : (cs < -1e-12 ? S.badge('negativo', 'no') : S.badge('nulo', 'info'))],
          [K(TXT.tg + ' ' + (ex ? S.anguloTex(rad) : 'x')),
            tg === null ? 'no existe' : K(ex && ex.tg ? ex.tg : S.kf(tg, 4)),
            tg === null ? 'no existe' : K(S.kf(tg, 4)),
            tg === null ? S.badge('no definida', 'avi')
              : (tg > 0 ? S.badge('positivo', 'si') : (tg < 0 ? S.badge('negativo', 'no') : S.badge('nulo', 'info')))]
        ]);
        if (tg === null) {
          h += aviso('En ' + K('90^{\\circ}') + ' y en ' + K('270^{\\circ}') + ' el coseno vale $0$, y la tangente, ' +
            'que es el cociente $\\dfrac{\\operatorname{sen} x}{\\cos x}$, no está definida. La recta que contiene al radio ' +
            'es paralela a la recta tangente y no la corta.');
        }
        h += S.expr('Relación fundamental, comprobada con estos valores',
          '\\operatorname{sen}^2 x + \\cos^2 x = ' + S.kf(sn * sn, 4) + ' + ' + S.kf(cs * cs, 4) + ' = ' + S.kf(sn * sn + cs * cs, 4));
        h += circulo([{ rad: rad, rot: S.etq(g, 0) + '°', col: COL.azul }], {
          proy: v.proy, tg: v.tg,
          cap: 'El radio de la circunferencia vale 1. Por eso el seno y el coseno son directamente las coordenadas del punto, ' +
            'y por eso ninguno de los dos puede pasar de 1 ni bajar de −1.'
        });
        h += S.leyenda([[COL.naranja, 'coseno: proyección sobre el eje horizontal'],
          [COL.verde, 'seno: proyección sobre el eje vertical'],
          [COL.morado, 'tangente: medida sobre la recta x = 1']]);
        return h;
      });
  };

  /* ==================================================================
     2 · resolutor de sen x = k, cos x = k, tg x = k
     ================================================================== */
  R.trigElemental = function (node) {
    S.shell(node, 'Ecuaciones elementales: sen x = k, cos x = k, tg x = k',
      'Elige la razón y escribe el valor de <code>k</code>. Admite enteros, decimales con coma (<code>0,5</code>), ' +
      'fracciones (<code>1/2</code>), raíces (<code>sqrt3/2</code>, <code>raiz(2)/2</code>) y valores imposibles ' +
      'como <code>2</code> para que veas qué ocurre cuando <code>|k| &gt; 1</code>.',
      [
        {
          id: 'fn', label: 'Razón trigonométrica', type: 'select', value: 'sen',
          options: [{ value: 'sen', label: 'seno' }, { value: 'cos', label: 'coseno' }, { value: 'tg', label: 'tangente' }]
        },
        { id: 'k', label: 'Valor de k', type: 'text', value: '1/2', ancho: '10rem' },
        {
          type: 'presets', list: [
            { label: 'sen x = 1/2', apply: function (c) { c.fn.value = 'sen'; c.k.value = '1/2'; } },
            { label: 'cos x = √3/2', apply: function (c) { c.fn.value = 'cos'; c.k.value = 'sqrt3/2'; } },
            { label: 'sen x = −1', apply: function (c) { c.fn.value = 'sen'; c.k.value = '-1'; } },
            { label: 'cos x = 0', apply: function (c) { c.fn.value = 'cos'; c.k.value = '0'; } },
            { label: 'tg x = 1', apply: function (c) { c.fn.value = 'tg'; c.k.value = '1'; } },
            { label: 'tg x = −√3', apply: function (c) { c.fn.value = 'tg'; c.k.value = '-sqrt3'; } },
            { label: 'sen x = 2 (imposible)', apply: function (c) { c.fn.value = 'sen'; c.k.value = '2'; } },
            { label: 'cos x = 0,4', apply: function (c) { c.fn.value = 'cos'; c.k.value = '0,4'; } }
          ]
        }
      ],
      function (v) {
        var fn = v.fn === 'cos' ? 'cos' : (v.fn === 'tg' ? 'tg' : 'sen');
        var kk = S.valorSimbolico(v.k);
        return bloqueElemental(fn, kk.tex, kk.v, {});
      });
  };

  /* ==================================================================
     3 · ecuación trigonométrica reducible a una cuadrática
     ================================================================== */
  R.trigCuadratica = function (node) {
    S.shell(node, 'Ecuación trigonométrica reducible a una cuadrática',
      'Resuelve <code>a·r² + b·r + c = 0</code>, donde <code>r</code> es la razón elegida. Escribe los coeficientes ' +
      'como enteros o fracciones: <code>2</code>, <code>-1</code>, <code>3/2</code>. Prueba también los casos en los que ' +
      'una raíz se sale del intervalo <code>[-1,1]</code> y hay que descartarla.',
      [
        {
          id: 'fn', label: 'Razón', type: 'select', value: 'sen',
          options: [{ value: 'sen', label: 'seno' }, { value: 'cos', label: 'coseno' }]
        },
        { id: 'a', label: 'Coeficiente a', type: 'text', value: '2', ancho: '8rem' },
        { id: 'b', label: 'Coeficiente b', type: 'text', value: '-1', ancho: '8rem' },
        { id: 'c', label: 'Coeficiente c', type: 'text', value: '-1', ancho: '8rem' },
        {
          type: 'presets', list: [
            { label: '2sen²x − sen x − 1 = 0', apply: function (c) { c.fn.value = 'sen'; c.a.value = '2'; c.b.value = '-1'; c.c.value = '-1'; } },
            { label: '2cos²x − 3cos x + 1 = 0', apply: function (c) { c.fn.value = 'cos'; c.a.value = '2'; c.b.value = '-3'; c.c.value = '1'; } },
            { label: 'sen²x − 1 = 0', apply: function (c) { c.fn.value = 'sen'; c.a.value = '1'; c.b.value = '0'; c.c.value = '-1'; } },
            { label: 'cos²x + cos x = 0', apply: function (c) { c.fn.value = 'cos'; c.a.value = '1'; c.b.value = '1'; c.c.value = '0'; } },
            { label: 'sen²x − 4 = 0 (raíces fuera)', apply: function (c) { c.fn.value = 'sen'; c.a.value = '1'; c.b.value = '0'; c.c.value = '-4'; } },
            { label: '2cos²x + 3cos x + 4 = 0 (Δ < 0)', apply: function (c) { c.fn.value = 'cos'; c.a.value = '2'; c.b.value = '3'; c.c.value = '4'; } },
            { label: '4sen²x − 3 = 0', apply: function (c) { c.fn.value = 'sen'; c.a.value = '4'; c.b.value = '0'; c.c.value = '-3'; } }
          ]
        }
      ],
      function (v) {
        var fn = v.fn === 'cos' ? 'cos' : 'sen';
        var a = S.fraccionTxt(v.a, 'El coeficiente a');
        var b = S.fraccionTxt(v.b, 'El coeficiente b');
        var c = S.fraccionTxt(v.c, 'El coeficiente c');
        if (a.n === 0n && b.n === 0n) throw Error('Con a = 0 y b = 0 no hay ecuación: pon algún coeficiente distinto de 0.');
        var pot = TXT[fn] + '^{2} x';
        var izq = S.pTex(S.pDe([c, b, a]), 't')
          .replace(/t\^\{2\}/g, pot).replace(/([^a-zA-Z])t/g, '$1' + TXT[fn] + ' x').replace(/^t/, TXT[fn] + ' x');
        return bloqueCuadEnT(a, b, c, fn, [{ rot: 'Ecuación de partida', tex: izq + ' = 0' }]);
      });
  };

  /* ==================================================================
     4 · ecuaciones que se reducen con identidades
     ================================================================== */
  R.trigIdentidad = function (node) {
    S.shell(node, 'Reducir con identidades: sen² + cos² = 1 y el ángulo doble',
      'Cada tipo mezcla dos razones distintas y hay que unificarlas con una identidad antes de resolver. ' +
      'Escribe los coeficientes como enteros o fracciones (<code>2</code>, <code>-3</code>, <code>1/2</code>) ' +
      'y usa los escenarios para ver los casos típicos de examen.',
      [
        {
          id: 'tipo', label: 'Tipo de ecuación', type: 'select', value: 'sen2',
          options: [
            { value: 'sen2', label: 'a·sen²x + b·cos x + c = 0' },
            { value: 'cos2', label: 'a·cos²x + b·sen x + c = 0' },
            { value: 'dobleCos', label: 'a·cos 2x + b·cos x + c = 0' },
            { value: 'dobleSen', label: 'a·sen 2x + b·sen x = 0' }
          ]
        },
        { id: 'a', label: 'Coeficiente a', type: 'text', value: '2', ancho: '8rem' },
        { id: 'b', label: 'Coeficiente b', type: 'text', value: '1', ancho: '8rem' },
        { id: 'c', label: 'Coeficiente c', type: 'text', value: '-1', ancho: '8rem' },
        {
          type: 'presets', list: [
            { label: '2sen²x + cos x − 1 = 0', apply: function (c) { c.tipo.value = 'sen2'; c.a.value = '2'; c.b.value = '1'; c.c.value = '-1'; } },
            { label: 'sen²x − cos x − 1 = 0', apply: function (c) { c.tipo.value = 'sen2'; c.a.value = '1'; c.b.value = '-1'; c.c.value = '-1'; } },
            { label: '2cos²x + sen x − 2 = 0', apply: function (c) { c.tipo.value = 'cos2'; c.a.value = '2'; c.b.value = '1'; c.c.value = '-2'; } },
            { label: 'cos 2x + cos x = 0', apply: function (c) { c.tipo.value = 'dobleCos'; c.a.value = '1'; c.b.value = '1'; c.c.value = '0'; } },
            { label: 'cos 2x + 3cos x + 2 = 0', apply: function (c) { c.tipo.value = 'dobleCos'; c.a.value = '1'; c.b.value = '3'; c.c.value = '2'; } },
            { label: 'sen 2x − sen x = 0', apply: function (c) { c.tipo.value = 'dobleSen'; c.a.value = '1'; c.b.value = '-1'; c.c.value = '0'; } },
            { label: 'sen 2x = 0', apply: function (c) { c.tipo.value = 'dobleSen'; c.a.value = '1'; c.b.value = '0'; c.c.value = '0'; } }
          ]
        }
      ],
      function (v) {
        var a = S.fraccionTxt(v.a, 'El coeficiente a');
        var b = S.fraccionTxt(v.b, 'El coeficiente b');
        var c = S.fraccionTxt(v.c, 'El coeficiente c');
        var uno = fr(1), h = '';
        if (v.tipo === 'sen2' || v.tipo === 'cos2') {
          var esSen = v.tipo === 'sen2';
          var cuadrada = esSen ? 'sen' : 'cos';       /* la que está al cuadrado */
          var lineal = esSen ? 'cos' : 'sen';         /* la que aparece en grado 1 */
          if (a.n === 0n) throw Error('Con a = 0 no hay término al cuadrado: la ecuación ya es elemental, usa el applet anterior.');
          /* a(1 - u²) + b·u + c = 0  ->  -a u² + b u + (a+c) = 0 */
          var A2 = a.opuesto(), B2 = b, C2 = a.mas(c);
          var cab = [
            { rot: 'Ecuación de partida', tex: a.tex(true) + TXT[cuadrada] + '^{2} x + ' + b.tex(true) + TXT[lineal] + ' x + ' + c.tex(true) + ' = 0' },
            { rot: 'Identidad fundamental', tex: '\\operatorname{sen}^{2} x + \\cos^{2} x = 1 \\;\\Longrightarrow\\; ' + TXT[cuadrada] + '^{2} x = 1 - ' + TXT[lineal] + '^{2} x', clase: 'eq-clave' },
            { rot: 'Sustituyendo, todo queda en ' + (lineal === 'sen' ? 'seno' : 'coseno'), tex: A2.tex(true) + TXT[lineal] + '^{2} x + ' + B2.tex(true) + TXT[lineal] + ' x + ' + C2.tex(true) + ' = 0' }
          ];
          h += bloqueCuadEnT(A2, B2, C2, lineal, cab);
          h += aviso('Fíjate en el orden: <b>primero</b> se unifican las razones con la identidad y <b>después</b> ' +
            'se hace el cambio de variable. Si intentas resolver con dos razones distintas a la vez, no hay ninguna ' +
            'cuadrática que resolver.');
          return h;
        }
        if (v.tipo === 'dobleCos') {
          if (a.n === 0n) throw Error('Con a = 0 desaparece el ángulo doble: elige otro coeficiente o otro tipo.');
          /* a(2cos²x - 1) + b cos x + c = 0  ->  2a cos² + b cos + (c - a) = 0 */
          var A3 = a.por(fr(2)), B3 = b, C3 = c.menos(a);
          var cab3 = [
            { rot: 'Ecuación de partida', tex: a.tex(true) + '\\cos 2x + ' + b.tex(true) + '\\cos x + ' + c.tex(true) + ' = 0' },
            { rot: 'Fórmula del ángulo doble', tex: '\\cos 2x = \\cos^{2} x - \\operatorname{sen}^{2} x = 2\\cos^{2} x - 1', clase: 'eq-clave' },
            { rot: 'Sustituyendo queda todo en coseno', tex: A3.tex(true) + '\\cos^{2} x + ' + B3.tex(true) + '\\cos x + ' + C3.tex(true) + ' = 0' }
          ];
          h += bloqueCuadEnT(A3, B3, C3, 'cos', cab3);
          h += aviso('La fórmula $\\cos 2x = 2\\cos^{2}x - 1$ es la versión de la identidad del ángulo doble que deja ' +
            'todo en cosenos; la versión $\\cos 2x = 1 - 2\\operatorname{sen}^{2}x$ lo deja todo en senos. Se elige la que ' +
            'coincide con la otra razón de la ecuación.');
          return h;
        }
        /* dobleSen:  a·sen 2x + b·sen x = 0  ->  sen x (2a cos x + b) = 0 */
        if (a.n === 0n) throw Error('Con a = 0 no hay ángulo doble que transformar.');
        h += cadena([
          { rot: 'Ecuación de partida', tex: a.tex(true) + '\\operatorname{sen} 2x + ' + b.tex(true) + '\\operatorname{sen} x = 0' },
          { rot: 'Ángulo doble del seno', tex: '\\operatorname{sen} 2x = 2\\operatorname{sen} x \\cos x', clase: 'eq-clave' },
          { rot: 'Sustituyendo', tex: (a.por(fr(2))).tex(true) + '\\operatorname{sen} x \\cos x + ' + b.tex(true) + '\\operatorname{sen} x = 0' },
          { rot: 'Factor común (nunca dividas por sen x)', tex: '\\operatorname{sen} x \\left(' + (a.por(fr(2))).tex(true) + '\\cos x + ' + b.tex(true) + '\\right) = 0', clase: 'eq-clave' }
        ]);
        h += aviso('<b>Aquí está el error clásico:</b> dividir los dos miembros entre $\\operatorname{sen} x$. ' +
          'Al hacerlo se pierden todas las soluciones con $\\operatorname{sen} x = 0$, porque solo se puede dividir ' +
          'entre una cantidad distinta de cero. Se saca factor común y se anula cada factor por separado.');
        var todas = [];
        h += '<h5 class="eq-expr-lab">Primer factor: ' + K('\\operatorname{sen} x = 0') + '</h5>';
        var T1 = S.solTrig('sen', 0);
        h += famHTML(T1) + solsTabla(T1, 'sen');
        T1.enRango.forEach(function (x) { todas.push(x); });
        var kc = b.opuesto().entre(a.por(fr(2)));
        h += '<h5 class="eq-expr-lab">Segundo factor: ' + K('\\cos x = ' + kc.tex(true)) + '</h5>';
        if (Math.abs(kc.val()) > 1) {
          h += '<p>' + S.badge('sin solución', 'no') + ' El valor ' + K(kc.tex(true)) + ' está fuera de $[-1,1]$: ' +
            'este factor no aporta ninguna solución.</p>';
        } else {
          var T2 = S.solTrig('cos', kc.val());
          h += famHTML(T2) + solsTabla(T2, 'cos');
          T2.enRango.forEach(function (x) { todas.push(x); });
        }
        todas = todas.filter(function (x, i, A) {
          return A.findIndex(function (y) { return Math.abs(x - y) < 1e-9; }) === i;
        }).sort(function (u, v2) { return u - v2; });
        h += S.expr('Todas las soluciones del primer giro',
          todas.map(function (x) { return S.anguloTex(x); }).join(', \\quad ') || '\\varnothing');
        h += circulo(todas.map(function (x, i) {
          return { rad: x, rot: S.gradTex(x).replace('^{\\circ}', '°'), col: [COL.azul, COL.rojo, COL.verde, COL.morado, COL.naranja][i % 5] };
        }), { proy: false, cap: 'Reunión de las soluciones de los dos factores.' });
        return h;
      });
  };

  /* ==================================================================
     5 · laboratorio de propiedades de las desigualdades
     ================================================================== */
  R.desigLab = function (node) {
    var OPS = {
      mas: { et: 'sumar c a los dos miembros', f: function (x, c) { return x + c; }, giro: false, regla: 'a < b \\;\\Longrightarrow\\; a + c < b + c' },
      menos: { et: 'restar c a los dos miembros', f: function (x, c) { return x - c; }, giro: false, regla: 'a < b \\;\\Longrightarrow\\; a - c < b - c' },
      por: { et: 'multiplicar los dos miembros por c', f: function (x, c) { return x * c; }, giro: null, regla: 'a < b,\\; c > 0 \\;\\Longrightarrow\\; ac < bc \\qquad a < b,\\; c < 0 \\;\\Longrightarrow\\; ac > bc' },
      entre: { et: 'dividir los dos miembros entre c', f: function (x, c) { return x / c; }, giro: null, regla: 'a < b,\\; c > 0 \\;\\Longrightarrow\\; \\dfrac{a}{c} < \\dfrac{b}{c} \\qquad a < b,\\; c < 0 \\;\\Longrightarrow\\; \\dfrac{a}{c} > \\dfrac{b}{c}' },
      opuesto: { et: 'cambiar de signo (multiplicar por −1)', f: function (x) { return -x; }, giro: true, regla: 'a < b \\;\\Longrightarrow\\; -a > -b' },
      inverso: { et: 'tomar el inverso de cada miembro', f: function (x) { return 1 / x; }, giro: null, regla: '0 < a < b \\;\\Longrightarrow\\; \\dfrac{1}{a} > \\dfrac{1}{b}' },
      cuadrado: { et: 'elevar al cuadrado cada miembro', f: function (x) { return x * x; }, giro: null, regla: '0 \\leq a < b \\;\\Longrightarrow\\; a^{2} < b^{2}' }
    };
    S.shell(node, 'Laboratorio de propiedades de las desigualdades',
      'Elige dos números con <code>a &lt; b</code>, aplica una operación a los dos miembros y observa si la ' +
      'desigualdad sigue siendo cierta o si el sentido ha girado. Los números se escriben con coma decimal: ' +
      '<code>-2,5</code>, <code>3</code>, <code>0,5</code>.',
      [
        { id: 'a', label: 'Primer número a', type: 'text', value: '-3', ancho: '8rem' },
        { id: 'b', label: 'Segundo número b', type: 'text', value: '5', ancho: '8rem' },
        {
          id: 'op', label: 'Operación', type: 'select', value: 'por',
          options: Object.keys(OPS).map(function (k) { return { value: k, label: OPS[k].et }; })
        },
        { id: 'c', label: 'Valor de c', type: 'text', value: '-2', ancho: '8rem' },
        {
          type: 'presets', list: [
            { label: 'multiplicar por −2', apply: function (c) { c.a.value = '-3'; c.b.value = '5'; c.op.value = 'por'; c.c.value = '-2'; } },
            { label: 'multiplicar por 3', apply: function (c) { c.a.value = '-3'; c.b.value = '5'; c.op.value = 'por'; c.c.value = '3'; } },
            { label: 'dividir entre −4', apply: function (c) { c.a.value = '-8'; c.b.value = '12'; c.op.value = 'entre'; c.c.value = '-4'; } },
            { label: 'sumar −7', apply: function (c) { c.a.value = '2'; c.b.value = '6'; c.op.value = 'mas'; c.c.value = '-7'; } },
            { label: 'cambiar de signo', apply: function (c) { c.a.value = '1'; c.b.value = '4'; c.op.value = 'opuesto'; c.c.value = '1'; } },
            { label: 'cuadrado con negativos', apply: function (c) { c.a.value = '-5'; c.b.value = '2'; c.op.value = 'cuadrado'; c.c.value = '1'; } },
            { label: 'inversos de positivos', apply: function (c) { c.a.value = '2'; c.b.value = '5'; c.op.value = 'inverso'; c.c.value = '1'; } },
            { label: 'multiplicar por 0', apply: function (c) { c.a.value = '-3'; c.b.value = '5'; c.op.value = 'por'; c.c.value = '0'; } }
          ]
        }
      ],
      function (v) {
        var a = S.real(v.a, undefined, undefined, 'El número a');
        var b = S.real(v.b, undefined, undefined, 'El número b');
        var c = S.real(v.c, undefined, undefined, 'El valor de c');
        var op = OPS[v.op] ? v.op : 'por';
        if (a === b) throw Error('Elige dos números distintos: con a = b no hay desigualdad que estudiar.');
        var lo = Math.min(a, b), hi = Math.max(a, b);
        if (op === 'entre' && c === 0) throw Error('No se puede dividir entre 0. Elige otro valor de c.');
        if (op === 'inverso' && (lo === 0 || hi === 0)) throw Error('El inverso de 0 no existe. Elige números distintos de 0.');
        var A = OPS[op].f(lo, c), B = OPS[op].f(hi, c);
        var h = '';
        h += cadena([
          { rot: 'Desigualdad de partida', tex: S.kf(lo, 3) + ' < ' + S.kf(hi, 3) + ' \\quad\\text{(cierta)}' },
          { rot: 'Operación aplicada a los dos miembros', tex: '\\text{' + OPS[op].et.replace('c', '') + '}\\;' + (op === 'por' || op === 'entre' ? 'c = ' + S.kf(c, 3) : ''), clase: 'eq-clave' },
          {
            rot: 'Resultado', tex: S.kf(A, 4) + (A < B ? ' < ' : (A > B ? ' > ' : ' = ')) + S.kf(B, 4),
            clase: A < B ? 'eq-bien' : (A > B ? 'eq-mal' : 'eq-clave')
          }
        ]);
        var estado;
        if (A === B) estado = S.badge('la desigualdad se ha destruido', 'avi') +
          ' Los dos miembros han quedado iguales: multiplicar por $0$ convierte cualquier desigualdad en una igualdad, ' +
          'y por eso <b>nunca</b> se puede multiplicar una inecuación por una expresión que pueda valer cero.';
        else if (A < B) estado = S.badge('mismo sentido', 'si') + ' El orden se conserva: la operación es creciente en este caso.';
        else estado = S.badge('el sentido ha girado', 'no') + ' El orden se invierte: la operación es decreciente en este caso.';
        h += cajas([
          { clase: A < B ? 'eq-ok' : (A > B ? 'eq-ko' : ''), html: '<b>Lectura del experimento</b><br>' + estado },
          { html: '<b>Regla general</b><br>' + KD(OPS[op].regla) }
        ]);
        if (op === 'cuadrado' && lo < 0) {
          h += aviso('El cuadrado solo respeta el orden cuando los dos números son positivos. Con negativos ' +
            'de por medio no hay regla fija: por eso una inecuación <b>no</b> se puede elevar al cuadrado sin discutir signos.');
        }
        if (op === 'inverso' && lo * hi < 0) {
          h += aviso('Cuando $a$ y $b$ tienen signos distintos, el paso al inverso no gira ni conserva el orden ' +
            'de manera previsible: hay un salto en $0$. Es el mismo motivo por el que en las inecuaciones racionales ' +
            'no se puede multiplicar en cruz.');
        }
        h += rectaMulti([
          { C: Conj.puntos([lo, hi]), rot: 'antes', col: COL.gris },
          { C: Conj.puntos([A, B]), rot: 'después', col: A < B ? COL.verde : COL.rojo }
        ], {
          marcas: [0], titulo: 'Posición de los dos números antes y después de la operación',
          cap: 'Si el punto que estaba a la izquierda pasa a estar a la derecha, el sentido de la desigualdad ha girado.'
        });
        h += S.expr('Justificación de la regla del signo negativo',
          'a < b \\iff b - a > 0 \\iff -c\\,(b-a) < 0 \\;(c<0) \\iff -cb + ca < 0 \\iff ca > cb');
        return h;
      });
  };

  /* ==================================================================
     6 · resolutor de inecuaciones de primer grado
     ================================================================== */
  R.inecPrimerGrado = function (node) {
    S.shell(node, 'Inecuación de primer grado paso a paso',
      'Escribe la inecuación completa en una sola casilla, con <code>&gt;</code>, <code>&lt;</code>, <code>&gt;=</code> ' +
      'o <code>&lt;=</code>. Se admiten paréntesis y denominadores: <code>3x-5&gt;x+7</code>, ' +
      '<code>2(x-1)&lt;=5x+4</code>, <code>x/2-1&gt;=x/3</code>.',
      [
        { id: 'ine', label: 'Inecuación', type: 'text', value: '3x-5>x+7', ancho: '22rem' },
        { id: 'graf', label: 'Ver la interpretación gráfica', type: 'check', value: true },
        {
          type: 'presets', list: [
            { label: '3x−5 > x+7', apply: function (c) { c.ine.value = '3x-5>x+7'; } },
            { label: '2(x−1) ≤ 5x+4', apply: function (c) { c.ine.value = '2(x-1)<=5x+4'; } },
            { label: '−2x+6 > 0 (giro)', apply: function (c) { c.ine.value = '-2x+6>0'; } },
            { label: 'x/2−1 ≥ x/3', apply: function (c) { c.ine.value = 'x/2-1>=x/3'; } },
            { label: '2x+1 > 2x (siempre)', apply: function (c) { c.ine.value = '2x+1>2x'; } },
            { label: '2x+1 < 2x (nunca)', apply: function (c) { c.ine.value = '2x+1<2x'; } },
            { label: '5(x−2) ≤ 5x−10', apply: function (c) { c.ine.value = '5(x-2)<=5x-10'; } }
          ]
        }
      ],
      function (v) {
        var L = leeInec(v.ine);
        var E = inecDe(L.izq, L.der, L.rel);
        var I = E.I, h = '';
        var pasos = [
          { rot: 'Inecuación de partida', tex: S.pTex(L.izq) + ' ' + relTex(L.rel) + ' ' + S.pTex(L.der) },
          { rot: 'Todo a un miembro (transposición)', tex: S.pTex(E.D) + ' ' + relTex(L.rel) + ' 0' }
        ];
        if (E.grado <= 0) {
          pasos.push({
            rot: 'Ha desaparecido la incógnita', tex: S.pTex(E.D) + ' ' + relTex(L.rel) + ' 0',
            clase: 'eq-clave'
          });
          pasos.push({
            rot: 'Conjunto solución', tex: I.conj.esTodo() ? 'x \\in \\mathbb{R}' : '\\varnothing',
            clase: I.conj.esTodo() ? 'eq-bien' : 'eq-mal'
          });
          h += cadena(pasos);
          h += '<p>' + (I.conj.esTodo()
            ? S.badge('se cumple siempre', 'si') + ' La desigualdad numérica que queda es cierta, y no depende de $x$: ' +
              'cualquier número real es solución. El conjunto solución es toda la recta.'
            : S.badge('no se cumple nunca', 'no') + ' La desigualdad numérica que queda es falsa, y tampoco depende de $x$: ' +
              'no hay ningún valor que la cumpla. El conjunto solución es vacío.') + '</p>';
          h += rectaMulti([{ C: I.conj, rot: 'solución', col: I.conj.esTodo() ? COL.verde : COL.rojo }],
            { marcas: [-3, 3], cap: 'Caso degenerado: la inecuación no separa la recta en dos partes.' });
          return h;
        }
        var a = E.a, b = E.b;
        pasos.push({ rot: 'Coeficiente de la incógnita', tex: 'a = ' + a.tex(true) + ', \\quad b = ' + b.tex(true) });
        if (I.giro) {
          pasos.push({
            rot: 'Al dividir entre un número negativo, gira el sentido',
            tex: 'x ' + relTex(I.relFinal) + ' \\dfrac{' + b.opuesto().tex(true) + '}{' + a.tex(true) + '} = ' + I.x.tex(true),
            clase: 'eq-clave'
          });
        } else {
          pasos.push({
            rot: 'Se divide entre un número positivo: el sentido se mantiene',
            tex: 'x ' + relTex(I.relFinal) + ' ' + I.x.tex(true)
          });
        }
        pasos.push({ rot: 'Conjunto solución', tex: I.conj.tex(), clase: 'eq-bien' });
        h += cadena(pasos);
        h += S.kvs([
          'Con desigualdades: ' + K(I.conj.desig('x')),
          'Con intervalos: ' + K(I.conj.tex()),
          'Frontera: ' + K('x = ' + I.x.tex(true)),
          I.giro ? S.badge('el sentido gira', 'no') : S.badge('el sentido se mantiene', 'si'),
          RELS[L.rel].cerrada ? 'Extremo ' + S.badge('incluido', 'si') : 'Extremo ' + S.badge('excluido', 'no')
        ]);
        var xv = I.frontera;
        var muestra = [xv - 2, xv - 0.5, xv, xv + 0.5, xv + 2];
        h += S.tabla(['Valor de prueba', 'Primer miembro', 'Segundo miembro', '¿Se cumple?'],
          muestra.map(function (x) {
            var li = S.pEvalNum(L.izq, x), ld = S.pEvalNum(L.der, x);
            var ok = RELS[L.rel].ok(li - ld) || (RELS[L.rel].cerrada && Math.abs(li - ld) < 1e-12);
            return [K('x = ' + S.kf(x, 3)), K(S.kf(li, 3)), K(S.kf(ld, 3)), ok ? S.badge('sí', 'si') : S.badge('no', 'no')];
          }));
        h += rectaMulti([{ C: I.conj, rot: 'solución', col: COL.azul }], {
          marcas: [0], cap: 'Círculo relleno: el extremo pertenece al conjunto. Círculo hueco: no pertenece.'
        });
        if (v.graf) {
          var af = a.val(), bf = b.val();
          h += ejesAuto([
            { f: function (x) { return af * x + bf; }, col: COL.azul, label: 'y = ' + S.pTex(E.D) },
            { f: function () { return 0; }, col: COL.gris, dash: '6 5' }
          ], Math.floor(xv - 5), Math.ceil(xv + 5), {
            puntos: [{ x: xv, y: 0, col: COL.rojo, tex: 'x = ' + I.x.tex(true) }],
            cap: 'Resolver la inecuación es preguntar dónde está la recta por encima (o por debajo) del eje horizontal. ' +
              'El punto de corte con el eje separa las dos zonas.'
          });
        }
        return h;
      });
  };

  /* ==================================================================
     7 · dobles desigualdades
     ================================================================== */
  R.dobleDesigualdad = function (node) {
    S.shell(node, 'Dobles desigualdades encadenadas',
      'Escribe los dos extremos y la expresión central de primer grado. Ejemplos de la expresión: ' +
      '<code>2x-1</code>, <code>3-x</code>, <code>x/2+1</code>. Los extremos admiten enteros, decimales con coma ' +
      'y fracciones: <code>-3</code>, <code>0,5</code>, <code>7/2</code>.',
      [
        { id: 'lo', label: 'Extremo izquierdo', type: 'text', value: '-3', ancho: '7rem' },
        {
          id: 'r1', label: 'Primera relación', type: 'select', value: '<',
          options: [{ value: '<', label: 'menor que' }, { value: '<=', label: 'menor o igual que' }]
        },
        { id: 'ex', label: 'Expresión central', type: 'text', value: '2x-1', ancho: '10rem' },
        {
          id: 'r2', label: 'Segunda relación', type: 'select', value: '<=',
          options: [{ value: '<', label: 'menor que' }, { value: '<=', label: 'menor o igual que' }]
        },
        { id: 'hi', label: 'Extremo derecho', type: 'text', value: '5', ancho: '7rem' },
        {
          type: 'presets', list: [
            { label: '−3 < 2x−1 ≤ 5', apply: function (c) { c.lo.value = '-3'; c.r1.value = '<'; c.ex.value = '2x-1'; c.r2.value = '<='; c.hi.value = '5'; } },
            { label: '1 ≤ 3−x < 4 (giro)', apply: function (c) { c.lo.value = '1'; c.r1.value = '<='; c.ex.value = '3-x'; c.r2.value = '<'; c.hi.value = '4'; } },
            { label: '0 < x/2+1 < 2', apply: function (c) { c.lo.value = '0'; c.r1.value = '<'; c.ex.value = 'x/2+1'; c.r2.value = '<'; c.hi.value = '2'; } },
            { label: '5 < 2x < 3 (vacío)', apply: function (c) { c.lo.value = '5'; c.r1.value = '<'; c.ex.value = '2x'; c.r2.value = '<'; c.hi.value = '3'; } },
            { label: '−1 ≤ −3x+2 ≤ 8', apply: function (c) { c.lo.value = '-1'; c.r1.value = '<='; c.ex.value = '-3x+2'; c.r2.value = '<='; c.hi.value = '8'; } },
            { label: '2 < 4 (sin incógnita)', apply: function (c) { c.lo.value = '2'; c.r1.value = '<'; c.ex.value = '3'; c.r2.value = '<'; c.hi.value = '4'; } }
          ]
        }
      ],
      function (v) {
        var lo = S.valorSimbolico(v.lo), hi = S.valorSimbolico(v.hi);
        var P = S.parsePol(v.ex, 'x', 'la expresión central');
        if (S.pGrado(P) > 1) throw Error('La expresión central debe ser de primer grado como máximo.');
        var r1 = v.r1 === '<=' ? '<=' : '<', r2 = v.r2 === '<=' ? '<=' : '<';
        /* lo r1 P  <=>  P - lo (>= o >) 0 ;  P r2 hi  <=>  P - hi (<= o <) 0 */
        var rel1 = r1 === '<=' ? '>=' : '>', rel2 = r2;
        var E1 = inecDe(P, S.pDe([lo.v]), rel1);
        var E2 = inecDe(P, S.pDe([hi.v]), rel2);
        var C1 = E1.I.conj, C2 = E2.I.conj, CF = C1.inter(C2);
        var h = '';
        var izqTex = lo.tex + ' ' + relTex(r1) + ' ' + S.pTex(P) + ' ' + relTex(r2) + ' ' + hi.tex;
        var pasos = [{ rot: 'Doble desigualdad', tex: izqTex }];
        if (lo.v > hi.v) {
          pasos.push({ rot: 'Los extremos están al revés', tex: lo.tex + ' > ' + hi.tex, clase: 'eq-mal' });
        }
        pasos.push({
          rot: 'Equivale a un sistema de dos inecuaciones',
          tex: '\\begin{cases} ' + S.pTex(P) + ' ' + relTex(rel1) + ' ' + lo.tex + ' \\\\ ' +
            S.pTex(P) + ' ' + relTex(rel2) + ' ' + hi.tex + ' \\end{cases}', clase: 'eq-clave'
        });
        pasos.push({ rot: 'Primera condición', tex: C1.esVacio() ? '\\varnothing' : C1.desig('x') });
        pasos.push({ rot: 'Segunda condición', tex: C2.esVacio() ? '\\varnothing' : C2.desig('x') });
        pasos.push({
          rot: 'Intersección de los dos conjuntos', tex: CF.tex(),
          clase: CF.esVacio() ? 'eq-mal' : 'eq-bien'
        });
        h += cadena(pasos);
        if (E1.grado === 1 && E1.I.giro) {
          h += aviso('El coeficiente de $x$ es negativo: al despejar hay que <b>girar los dos signos a la vez</b>. ' +
            'Si trabajas con la cadena entera sin separarla, la desigualdad ' + K('a < P(x) < b') +
            ' se convierte en ' + K('a\' > x > b\'') + ', que se reescribe leyéndola de derecha a izquierda.');
        }
        h += rectaMulti([
          { C: C1, rot: 'condición 1', col: COL.azul },
          { C: C2, rot: 'condición 2', col: COL.naranja },
          { C: CF, rot: 'intersección', col: CF.esVacio() ? COL.rojo : COL.verde }
        ], {
          titulo: 'Las dos condiciones y su parte común',
          cap: 'La solución de una doble desigualdad es la zona en la que se solapan las dos condiciones.'
        });
        h += S.kvs([
          'Solución: ' + K(CF.esVacio() ? '\\varnothing' : CF.tex()),
          CF.esVacio() ? S.badge('sin solución', 'no') : 'Con desigualdades: ' + K(CF.desig('x'))
        ]);
        if (CF.esVacio()) {
          h += aviso('Las dos condiciones son incompatibles: no hay ningún número que cumpla las dos a la vez. ' +
            'Comprueba si los extremos están en el orden correcto, porque una cadena como $5 < 2x < 3$ exige ' +
            'que $2x$ sea a la vez mayor que 5 y menor que 3.');
        }
        return h;
      });
  };

  /* ==================================================================
     8 · sistemas de inecuaciones con una incógnita
     ================================================================== */
  R.sistemaInec = function (node) {
    S.shell(node, 'Sistema de inecuaciones con una incógnita',
      'Escribe entre dos y cuatro inecuaciones separadas por punto y coma: ' +
      '<code>3x-6&gt;0; x-5&lt;0</code>. Cada una se resuelve por separado y el sistema se resuelve ' +
      'quedándose con la <b>intersección</b> de todos los conjuntos.',
      [
        { id: 'sis', label: 'Inecuaciones (separadas por ;)', type: 'text', value: '3x-6>0; x-5<0', ancho: '26rem' },
        {
          type: 'presets', list: [
            { label: '3x−6>0 ; x−5<0', apply: function (c) { c.sis.value = '3x-6>0; x-5<0'; } },
            { label: 'x>2 ; x<0 (vacío)', apply: function (c) { c.sis.value = 'x>2; x<0'; } },
            { label: '2x+1≥3 ; x≤4', apply: function (c) { c.sis.value = '2x+1>=3; x<=4'; } },
            { label: 'tres condiciones', apply: function (c) { c.sis.value = 'x+1>0; 2x-8<0; x-1>=0'; } },
            { label: 'con denominadores', apply: function (c) { c.sis.value = 'x/2-1<3; -x+2<0'; } },
            { label: 'una semirrecta', apply: function (c) { c.sis.value = 'x-1>0; x-4>0'; } },
            { label: 'con giro de signo', apply: function (c) { c.sis.value = '-2x+6>0; -x-4<0'; } }
          ]
        }
      ],
      function (v) {
        var partes = String(v.sis || '').split(/[;\n]+/).map(function (s) { return s.trim(); }).filter(Boolean);
        if (partes.length < 2) throw Error('Escribe al menos dos inecuaciones separadas por punto y coma.');
        if (partes.length > 4) throw Error('Como máximo cuatro inecuaciones, para que la figura se lea bien.');
        var filas = [], lista = [], CF = Conj.todo();
        partes.forEach(function (p, i) {
          var L = leeInec(p, 'la inecuación ' + (i + 1));
          var E = inecDe(L.izq, L.der, L.rel);
          var C = E.I.conj;
          CF = CF.inter(C);
          filas.push([
            K(S.pTex(L.izq) + ' ' + relTex(L.rel) + ' ' + S.pTex(L.der)),
            K(S.pTex(E.D) + ' ' + relTex(L.rel) + ' 0'),
            E.grado === 1 ? (E.I.giro ? S.badge('gira', 'no') : S.badge('no gira', 'si')) : S.badge('sin incógnita', 'avi'),
            K(C.esVacio() ? '\\varnothing' : C.tex())
          ]);
          lista.push({ C: C, rot: 'condición ' + (i + 1), col: [COL.azul, COL.naranja, COL.morado, COL.teal][i % 4] });
        });
        var h = S.tabla(['Inecuación', 'Reducida', '¿Gira el signo?', 'Conjunto solución'], filas);
        lista.push({ C: CF, rot: 'sistema', col: CF.esVacio() ? COL.rojo : COL.verde });
        h += rectaMulti(lista, {
          titulo: 'Cada condición y la intersección final',
          cap: 'La solución del sistema es la parte común a todas las bandas. Basta que una condición falle ' +
            'para que el número quede fuera.'
        });
        h += S.expr('Solución del sistema', CF.esVacio() ? '\\varnothing' : CF.tex());
        if (!CF.esVacio()) h += S.expr('La misma solución con desigualdades', CF.desig('x'));
        else h += '<p>' + S.badge('sistema incompatible', 'no') + ' Los conjuntos no se solapan: no hay ningún número ' +
          'que cumpla todas las condiciones a la vez.</p>';
        var pr = [];
        if (!CF.esVacio()) {
          var t0 = CF.t[0];
          var centro = isFinite(t0.a) && isFinite(t0.b) ? (t0.a + t0.b) / 2 : (isFinite(t0.a) ? t0.a + 1 : t0.b - 1);
          pr.push(centro);
          pr.push(isFinite(t0.a) ? t0.a - 1 : t0.b + 1);
        } else { pr.push(0); pr.push(1); }
        h += S.tabla(['Número de prueba', '¿Está en la solución del sistema?'],
          pr.map(function (x) {
            return [K('x = ' + S.kf(x, 3)), CF.contiene(x) ? S.badge('sí', 'si') : S.badge('no', 'no')];
          }));
        return h;
      });
  };

  /* ==================================================================
     9 · el signo de la parábola
     ================================================================== */
  R.signoParabola = function (node) {
    S.shell(node, 'El signo de la parábola: los seis casos',
      'Mueve los deslizadores de <code>a</code>, <code>b</code> y <code>c</code> y elige la relación. ' +
      'La combinación del <b>signo de a</b> con el <b>signo del discriminante</b> da los seis casos posibles, ' +
      'y el applet resalta en cuál te encuentras.',
      [
        { id: 'a', label: 'Coeficiente a', type: 'range', min: -3, max: 3, step: 0.5, value: 1 },
        { id: 'b', label: 'Coeficiente b', type: 'range', min: -8, max: 8, step: 1, value: -5 },
        { id: 'c', label: 'Coeficiente c', type: 'range', min: -9, max: 9, step: 1, value: 6 },
        {
          id: 'rel', label: 'Relación', type: 'select', value: '>',
          options: [{ value: '>', label: 'mayor que 0' }, { value: '>=', label: 'mayor o igual que 0' },
            { value: '<', label: 'menor que 0' }, { value: '<=', label: 'menor o igual que 0' }]
        },
        {
          type: 'presets', list: [
            { label: 'x²−5x+6>0', apply: function (c) { c.a.value = 1; c.b.value = -5; c.c.value = 6; c.rel.value = '>'; } },
            { label: 'x²−5x+6≤0', apply: function (c) { c.a.value = 1; c.b.value = -5; c.c.value = 6; c.rel.value = '<='; } },
            { label: 'x²−4x+4>0 (Δ=0)', apply: function (c) { c.a.value = 1; c.b.value = -4; c.c.value = 4; c.rel.value = '>'; } },
            { label: 'x²+x+3>0 (Δ<0)', apply: function (c) { c.a.value = 1; c.b.value = 1; c.c.value = 3; c.rel.value = '>'; } },
            { label: 'x²+x+3<0 (vacío)', apply: function (c) { c.a.value = 1; c.b.value = 1; c.c.value = 3; c.rel.value = '<'; } },
            { label: '−x²+4≥0', apply: function (c) { c.a.value = -1; c.b.value = 0; c.c.value = 4; c.rel.value = '>='; } },
            { label: '−x²−1<0 (siempre)', apply: function (c) { c.a.value = -1; c.b.value = 0; c.c.value = -1; c.rel.value = '<'; } }
          ]
        }
      ],
      function (v) {
        var av = S.real(v.a, -3, 3, 'El coeficiente a');
        var bv = S.real(v.b, -8, 8, 'El coeficiente b');
        var cv = S.real(v.c, -9, 9, 'El coeficiente c');
        var rel = RELS[v.rel] ? v.rel : '>';
        var a = fr(Math.round(av * 2), 2), b = fr(Math.round(bv), 1), c = fr(Math.round(cv), 1);
        var p = S.pDe([c, b, a]);
        var h = '';
        if (a.n === 0n) {
          var E = inecDe(p, S.pDe([0]), rel);
          h += aviso('Con $a = 0$ el término de segundo grado desaparece y ya no hay parábola, sino una recta: ' +
            'la inecuación es de primer grado. Mueve el deslizador de $a$ para volver al caso cuadrático.');
          h += S.expr('Inecuación (de primer grado)', S.pTex(p) + ' ' + relTex(rel) + ' 0');
          h += S.expr('Conjunto solución', E.I.conj.esVacio() ? '\\varnothing' : E.I.conj.tex());
          h += rectaMulti([{ C: E.I.conj, rot: 'solución', col: COL.azul }], { marcas: [0] });
          return h;
        }
        var Q = S.solCuadratica(a, b, c);
        var T = S.tablaSignos(p, rel);
        var pos = a.val() > 0;
        var caso = (Q.disc > 0 ? 0 : (Q.disc === 0 ? 1 : 2)) + (pos ? 0 : 3);
        var TXTCASO = [
          ['a > 0 y Δ > 0', 'Parábola hacia arriba que corta al eje en dos puntos: es negativa <b>entre</b> las raíces y positiva fuera.'],
          ['a > 0 y Δ = 0', 'Parábola hacia arriba tangente al eje: es positiva en todas partes salvo en la raíz doble, donde vale 0.'],
          ['a > 0 y Δ < 0', 'Parábola hacia arriba que no corta al eje: es positiva para todo valor de x.'],
          ['a < 0 y Δ > 0', 'Parábola hacia abajo que corta al eje en dos puntos: es positiva <b>entre</b> las raíces y negativa fuera.'],
          ['a < 0 y Δ = 0', 'Parábola hacia abajo tangente al eje: es negativa en todas partes salvo en la raíz doble, donde vale 0.'],
          ['a < 0 y Δ < 0', 'Parábola hacia abajo que no corta al eje: es negativa para todo valor de x.']
        ];
        h += S.expr('Inecuación', S.pTex(p) + ' ' + relTex(rel) + ' 0');
        h += S.kvs([
          'Discriminante: ' + K('\\Delta = ' + Q.b + '^2 - 4\\cdot' + Q.a + '\\cdot' + Q.c + ' = ' + Q.disc),
          'Ramas: ' + (pos ? 'hacia arriba' : 'hacia abajo'),
          'Vértice: ' + K('\\left(' + S.kf(Q.vertice.x, 3) + ',\\; ' + S.kf(Q.vertice.y, 3) + '\\right)'),
          Q.tipo === 'dos' ? 'Dos raíces' : (Q.tipo === 'doble' ? 'Raíz doble' : 'Sin raíces reales')
        ]);
        h += '<div class="eq-disc">' + TXTCASO.map(function (t, i) {
          return '<div class="eq-disc-caja' + (i === caso ? ' eq-on' : '') + '"><b>' + t[0] + '</b>' + t[1] + '</div>';
        }).join('') + '</div>';
        if (Q.raices.length) {
          h += S.expr('Raíces (fronteras del signo)',
            Q.raices.map(function (r, i) { return 'x_' + (i + 1) + ' = ' + r.tex(); }).join(', \\quad '));
        }
        h += S.tablaSignosHTML(T, S.pTex(p));
        h += S.expr('Conjunto solución', T.conj.esVacio() ? '\\varnothing' : T.conj.tex());
        if (!T.conj.esVacio() && !T.conj.esTodo()) h += S.expr('Con desigualdades', T.conj.desig('x'));
        var af = a.val(), bf = b.val(), cf = c.val();
        var centro = Q.vertice.x;
        h += ejesAuto([{ f: function (x) { return af * x * x + bf * x + cf; }, col: COL.azul, label: 'y = ' + S.pTex(p) }],
          Math.floor(centro - 6), Math.ceil(centro + 6), {
            puntos: Q.raices.map(function (r) { return { x: r.val(), y: 0, col: COL.rojo, tex: 'x = ' + r.aprox(2) }; }),
            tope: 40,
            cap: 'La inecuación pregunta por los tramos del eje horizontal donde la parábola está por encima ' +
              '(valores positivos) o por debajo (valores negativos).'
          });
        h += rectaMulti([{ C: T.conj, rot: 'solución', col: COL.azul }], { marcas: [0] });
        return h;
      });
  };

  /* ==================================================================
     10 · tabla de signos de grado cualquiera
     ================================================================== */
  R.tablaSignosPol = function (node) {
    S.shell(node, 'Tabla de signos e inecuaciones de grado superior',
      'Escribe el polinomio, desarrollado o factorizado, y elige la relación. Ejemplos válidos: ' +
      '<code>x^3-x</code>, <code>(x-1)(x+2)(x-3)</code>, <code>x^4-5x^2+4</code>, <code>(x-2)^2(x+1)</code>. ' +
      'Se compara siempre con 0: si tu inecuación no está igualada a cero, pasa todo a un miembro antes.',
      [
        { id: 'p', label: 'Polinomio', type: 'text', value: 'x^3-x', ancho: '18rem' },
        {
          id: 'rel', label: 'Relación', type: 'select', value: '>',
          options: [{ value: '>', label: 'mayor que 0' }, { value: '>=', label: 'mayor o igual que 0' },
            { value: '<', label: 'menor que 0' }, { value: '<=', label: 'menor o igual que 0' }]
        },
        {
          type: 'presets', list: [
            { label: 'x³−x > 0', apply: function (c) { c.p.value = 'x^3-x'; c.rel.value = '>'; } },
            { label: '(x−1)(x+2)(x−3) ≤ 0', apply: function (c) { c.p.value = '(x-1)(x+2)(x-3)'; c.rel.value = '<='; } },
            { label: 'x²−4x+4 ≥ 0', apply: function (c) { c.p.value = 'x^2-4x+4'; c.rel.value = '>='; } },
            { label: '(x−2)²(x+1) > 0', apply: function (c) { c.p.value = '(x-2)^2(x+1)'; c.rel.value = '>'; } },
            { label: 'x⁴−5x²+4 < 0', apply: function (c) { c.p.value = 'x^4-5x^2+4'; c.rel.value = '<'; } },
            { label: '−x³+x < 0', apply: function (c) { c.p.value = '-x^3+x'; c.rel.value = '<'; } },
            { label: 'x²+1 < 0 (vacío)', apply: function (c) { c.p.value = 'x^2+1'; c.rel.value = '<'; } }
          ]
        }
      ],
      function (v) {
        var p = S.parsePol(v.p, 'x', 'el polinomio');
        if (S.pEsCero(p)) throw Error('El polinomio nulo no sirve aquí: escribe un polinomio no nulo.');
        var g = S.pGrado(p);
        if (g > 5) throw Error('Como máximo grado 5 en este applet.');
        var rel = RELS[v.rel] ? v.rel : '>';
        var Fz = S.factorizaPol(p);
        var T = S.tablaSignos(p, rel);
        var h = '';
        h += S.expr('Inecuación', S.pTex(p) + ' ' + relTex(rel) + ' 0');
        h += S.expr('Factorización', S.factorizaTexPol(Fz) + (Fz.cuads.length ? '' : ''));
        if (!T.ceros.length) {
          h += aviso('El polinomio no tiene raíces reales: no cambia de signo en ningún punto, así que su signo ' +
            'es el mismo en toda la recta. Basta evaluarlo en un solo número para decidir.');
        } else {
          h += S.tabla(['Raíz', 'Multiplicidad', '¿Cambia el signo al pasar?'],
            T.ceros.map(function (z) {
              var m = 1;
              Fz.lineales.forEach(function (L) { if (Math.abs(L.raiz.val() - z.v) < 1e-9) m = L.mult; });
              return [K('x = ' + z.tex), String(m),
                m % 2 === 1 ? S.badge('sí, cambia', 'si') : S.badge('no, se mantiene', 'no')];
            }));
        }
        h += S.tablaSignosHTML(T, S.pTex(p));
        h += S.tabla(['Intervalo', 'Número de prueba', 'Valor del polinomio', 'Signo'],
          T.trozos.map(function (t) {
            return [K(S.intervTex(t)), K(S.kf(t.muestra, 3)), K(S.kf(t.valor, 4)),
              t.signo === '+' ? S.badge('positivo', 'si') : S.badge('negativo', 'no')];
          }));
        h += S.expr('Conjunto solución', T.conj.esVacio() ? '\\varnothing' : T.conj.tex());
        h += rectaMulti([{ C: T.conj, rot: 'solución', col: COL.azul }], {
          marcas: [0], cap: 'Los extremos se rellenan solo cuando la desigualdad admite la igualdad.'
        });
        var lo = Math.floor(Math.min.apply(null, [-2].concat(T.ceros.map(function (z) { return z.v; }))) - 2);
        var hi = Math.ceil(Math.max.apply(null, [2].concat(T.ceros.map(function (z) { return z.v; }))) + 2);
        h += ejesAuto([{ f: function (x) { return S.pEvalNum(p, x); }, col: COL.azul, label: 'y = ' + S.pTex(p) }],
          lo, hi, {
            tope: 60,
            puntos: T.ceros.map(function (z) { return { x: z.v, y: 0, col: COL.rojo }; }),
            cap: 'Entre dos raíces consecutivas el polinomio no puede cambiar de signo: por eso basta un único ' +
              'número de prueba por intervalo.'
          });
        return h;
      });
  };

  /* ==================================================================
     11 · inecuaciones racionales
     ================================================================== */
  R.inecRacionalPolos = function (node) {
    S.shell(node, 'Inecuaciones racionales y valores excluidos',
      'Escribe el numerador, el denominador y el número con el que se compara la fracción. Ejemplos: ' +
      'numerador <code>x-1</code>, denominador <code>x+2</code>, comparación <code>0</code>; o bien ' +
      '<code>1</code> / <code>x-3</code> comparado con <code>2</code>. La comparación admite enteros y fracciones.',
      [
        { id: 'n', label: 'Numerador', type: 'text', value: 'x-1', ancho: '10rem' },
        { id: 'd', label: 'Denominador', type: 'text', value: 'x+2', ancho: '10rem' },
        {
          id: 'rel', label: 'Relación', type: 'select', value: '>',
          options: [{ value: '>', label: 'mayor que' }, { value: '>=', label: 'mayor o igual que' },
            { value: '<', label: 'menor que' }, { value: '<=', label: 'menor o igual que' }]
        },
        { id: 'k', label: 'Se compara con', type: 'text', value: '0', ancho: '7rem' },
        {
          type: 'presets', list: [
            { label: '(x−1)/(x+2) > 0', apply: function (c) { c.n.value = 'x-1'; c.d.value = 'x+2'; c.rel.value = '>'; c.k.value = '0'; } },
            { label: '(x−1)/(x+2) ≤ 0', apply: function (c) { c.n.value = 'x-1'; c.d.value = 'x+2'; c.rel.value = '<='; c.k.value = '0'; } },
            { label: '1/(x−3) < 2', apply: function (c) { c.n.value = '1'; c.d.value = 'x-3'; c.rel.value = '<'; c.k.value = '2'; } },
            { label: '(x+1)/(x−2) ≥ 1', apply: function (c) { c.n.value = 'x+1'; c.d.value = 'x-2'; c.rel.value = '>='; c.k.value = '1'; } },
            { label: '(x²−1)/x ≤ 0', apply: function (c) { c.n.value = 'x^2-1'; c.d.value = 'x'; c.rel.value = '<='; c.k.value = '0'; } },
            { label: 'x/(x²−4) > 0', apply: function (c) { c.n.value = 'x'; c.d.value = 'x^2-4'; c.rel.value = '>'; c.k.value = '0'; } },
            { label: '(x²+1)/(x−1) > 0', apply: function (c) { c.n.value = 'x^2+1'; c.d.value = 'x-1'; c.rel.value = '>'; c.k.value = '0'; } }
          ]
        }
      ],
      function (v) {
        var N0 = S.parsePol(v.n, 'x', 'el numerador');
        var D = S.parsePol(v.d, 'x', 'el denominador');
        if (S.pGrado(D) < 1) throw Error('El denominador debe llevar la incógnita: si no, la inecuación es polinómica.');
        var k = S.fraccionTxt(v.k, 'El número de comparación');
        var rel = RELS[v.rel] ? v.rel : '>';
        var N = k.n === 0n ? N0 : S.pResta(N0, S.pEscala(D, k));
        var Tr = S.inecRacional(N, D, rel);
        var polos = S.raicesDe(D);
        var h = '';
        h += S.expr('Inecuación de partida', '\\dfrac{' + S.pTex(N0) + '}{' + S.pTex(D) + '} ' + relTex(rel) + ' ' + k.tex(true));
        var pasos = [];
        pasos.push({
          rot: 'Valores que hay que excluir del dominio',
          tex: polos.length ? polos.map(function (r) { return 'x \\neq ' + r.tex(true); }).join(', \\quad ') : '\\text{ninguno}',
          clase: 'eq-clave'
        });
        if (k.n !== 0n) {
          pasos.push({ rot: 'Se pasa todo a un miembro (nunca se multiplica en cruz)', tex: '\\dfrac{' + S.pTex(N0) + '}{' + S.pTex(D) + '} - ' + k.tex(true) + ' ' + relTex(rel) + ' 0' });
          pasos.push({ rot: 'Una sola fracción, con denominador común', tex: '\\dfrac{' + S.pTex(N) + '}{' + S.pTex(D) + '} ' + relTex(rel) + ' 0', clase: 'eq-clave' });
        }
        pasos.push({
          rot: 'Se estudia el signo del cociente',
          tex: '\\text{ceros del numerador y polos del denominador}'
        });
        h += cadena(pasos);
        h += aviso('<b>Por qué no se puede multiplicar en cruz:</b> multiplicar los dos miembros por ' +
          K(S.pTex(D)) + ' exige conocer su signo, y ese signo cambia según el valor de $x$. Si el denominador ' +
          'es negativo, la desigualdad giraría; si es positivo, no. Al no saberlo, el paso no está justificado: ' +
          'lo correcto es dejar la fracción comparada con cero y estudiar el signo del cociente.');
        var filas = Tr.ceros.map(function (z) {
          return [K('x = ' + z.tex), z.tipo === 'polo' ? S.badge('polo (denominador nulo)', 'no') : S.badge('cero (numerador nulo)', 'si'),
            z.tipo === 'polo' ? 'Nunca puede pertenecer a la solución: la fracción no existe ahí.'
              : (RELS[rel].cerrada ? 'Pertenece a la solución, porque la desigualdad admite la igualdad.'
                : 'No pertenece, porque la desigualdad es estricta.')];
        });
        h += S.tabla(['Valor frontera', 'Tipo', 'Qué ocurre con él'], filas);
        h += S.tablaSignosHTML(Tr, '\\dfrac{' + S.pTex(N) + '}{' + S.pTex(D) + '}');
        h += S.expr('Conjunto solución', Tr.conj.esVacio() ? '\\varnothing' : Tr.conj.tex());
        h += rectaMulti([{ C: Tr.conj, rot: 'solución', col: COL.azul }], {
          marcas: polos.map(function (r) { return r.val(); }),
          cap: 'Los polos aparecen siempre como extremos abiertos, incluso cuando la desigualdad no es estricta.'
        });
        var pruebas = Tr.trozos.map(function (t) { return t.muestra; });
        h += S.tabla(['Número de prueba', 'Valor de la fracción', '¿Cumple la desigualdad?'],
          pruebas.map(function (x) {
            var dv = S.pEvalNum(D, x);
            var val = dv === 0 ? null : S.pEvalNum(N0, x) / dv;
            var ok = Tr.conj.contiene(x);
            return [K('x = ' + S.kf(x, 3)), val === null ? 'no existe' : K(S.kf(val, 4)),
              ok ? S.badge('sí', 'si') : S.badge('no', 'no')];
          }));
        return h;
      });
  };

  /* ==================================================================
     12 · inecuaciones con valor absoluto
     ================================================================== */

  /* --- utilidades de lectura y comparación de conjuntos -------------
     Se usan para corregir las respuestas del generador de ejercicios. */
  function leeConj(txt) {
    var s = String(txt || '').trim().toLowerCase()
      .replace(/\s+/g, '')
      .replace(/≥/g, '>=').replace(/≤/g, '<=')
      .replace(/=>/g, '>=').replace(/=</g, '<=')
      .replace(/∪/g, 'u').replace(/∞/g, 'inf')
      .replace(/\[/g, '[').replace(/\]/g, ']');
    if (!s) return null;
    if (s === 'r' || s === 'todor' || s === 'todos') return Conj.todo();
    if (s === 'vacio' || s === 'vacío' || s === '0conjunto' || s === 'sinsolucion' ||
      s === 'sinsolución' || s === '{}' || s === 'nohaysolucion') return Conj.vacio();

    var partes = s.split(/u(?![a-z])/).filter(Boolean);
    var total = Conj.vacio(), alguno = false;
    for (var i = 0; i < partes.length; i++) {
      var C = leeTrozo(partes[i]);
      if (!C) return null;
      total = total.union(C);
      alguno = true;
    }
    return alguno ? total : null;
  }
  function leeNum(t) {
    var s = String(t).trim();
    if (/^[+-]?inf(inito)?$/.test(s)) return s.charAt(0) === '-' ? -Infinity : Infinity;
    try { return S.valorSimbolico(s).v; } catch (e) { return null; }
  }
  function leeTrozo(s) {
    /* intervalo: (a,b)  [a,b)  ]a,b]  con , o ;  */
    var mi = s.match(/^([\[\]\(])([^,;]+)[,;]([^,;]+)([\[\]\)])$/);
    if (mi) {
      var a = leeNum(mi[2]), b = leeNum(mi[3]);
      if (a === null || b === null || !(a < b)) return null;
      var ai = mi[1] === '[' && isFinite(a);
      var bi = mi[4] === ']' && isFinite(b);
      return Conj.intervalo(a, b, ai, bi);
    }
    /* desigualdad: x>3, x<=-1/2, 3<x  */
    var md = s.match(/^x(>=|<=|>|<|=)(.+)$/);
    if (md) {
      var v = leeNum(md[2]);
      if (v === null) return null;
      if (md[1] === '=') return Conj.punto(v);
      if (md[1] === '>') return Conj.intervalo(v, Infinity, false, false);
      if (md[1] === '>=') return Conj.intervalo(v, Infinity, true, false);
      if (md[1] === '<') return Conj.intervalo(-Infinity, v, false, false);
      return Conj.intervalo(-Infinity, v, false, true);
    }
    var mr = s.match(/^(.+?)(>=|<=|>|<)x$/);
    if (mr) {
      var w = leeNum(mr[1]);
      if (w === null) return null;
      if (mr[2] === '>') return Conj.intervalo(-Infinity, w, false, false);
      if (mr[2] === '>=') return Conj.intervalo(-Infinity, w, false, true);
      if (mr[2] === '<') return Conj.intervalo(w, Infinity, false, false);
      return Conj.intervalo(w, Infinity, true, false);
    }
    /* doble desigualdad: -2<x<=5 */
    var mm = s.match(/^(.+?)(>=|<=|<|>)x(>=|<=|<|>)(.+)$/);
    if (mm) {
      var p = leeNum(mm[1]), q = leeNum(mm[4]);
      if (p === null || q === null) return null;
      var izqMenor = mm[2] === '<' || mm[2] === '<=';
      var lo = izqMenor ? p : q, hi = izqMenor ? q : p;
      var li = izqMenor ? mm[2] === '<=' : mm[3] === '>=';
      var hi2 = izqMenor ? mm[3] === '<=' : mm[2] === '>=';
      if (!(lo < hi)) return null;
      return Conj.intervalo(lo, hi, li && isFinite(lo), hi2 && isFinite(hi));
    }
    return null;
  }
  function mismoConj(A, B) {
    if (!A || !B) return false;
    if (A.t.length !== B.t.length) return false;
    for (var i = 0; i < A.t.length; i++) {
      var u = A.t[i], w = B.t[i];
      if (!casiIgual(u.a, w.a) || !casiIgual(u.b, w.b)) return false;
      if (!!u.ai !== !!w.ai || !!u.bi !== !!w.bi) return false;
    }
    return true;
  }
  function casiIgual(x, y) {
    if (x === y) return true;
    if (!isFinite(x) || !isFinite(y)) return false;
    return Math.abs(x - y) < 1e-7 * Math.max(1, Math.abs(x), Math.abs(y));
  }

  R.inecAbsoluto = function (node) {
    S.shell(node, 'Inecuaciones con valor absoluto',
      'Resuelve <code>|P(x)|</code> comparado con un número. Dentro de las barras escribe una expresión de ' +
      'primer grado: <code>2x-1</code>, <code>x+3</code>, <code>3-x</code>. El número de comparación admite ' +
      'enteros, decimales con coma y fracciones, y también valores negativos o cero para ver los casos degenerados.',
      [
        { id: 'p', label: 'Dentro del valor absoluto', type: 'text', value: '2x-1', ancho: '11rem' },
        {
          id: 'rel', label: 'Relación', type: 'select', value: '<',
          options: [{ value: '<', label: 'menor que' }, { value: '<=', label: 'menor o igual que' },
            { value: '>', label: 'mayor que' }, { value: '>=', label: 'mayor o igual que' }]
        },
        { id: 'k', label: 'Se compara con', type: 'text', value: '3', ancho: '7rem' },
        {
          type: 'presets', list: [
            { label: '|2x−1| < 3', apply: function (c) { c.p.value = '2x-1'; c.rel.value = '<'; c.k.value = '3'; } },
            { label: '|2x−1| ≥ 3', apply: function (c) { c.p.value = '2x-1'; c.rel.value = '>='; c.k.value = '3'; } },
            { label: '|x+2| ≤ 1/2', apply: function (c) { c.p.value = 'x+2'; c.rel.value = '<='; c.k.value = '1/2'; } },
            { label: '|3−x| > 4', apply: function (c) { c.p.value = '3-x'; c.rel.value = '>'; c.k.value = '4'; } },
            { label: '|x−1| < −2 (imposible)', apply: function (c) { c.p.value = 'x-1'; c.rel.value = '<'; c.k.value = '-2'; } },
            { label: '|x−1| > −2 (siempre)', apply: function (c) { c.p.value = 'x-1'; c.rel.value = '>'; c.k.value = '-2'; } },
            { label: '|x−4| > 0', apply: function (c) { c.p.value = 'x-4'; c.rel.value = '>'; c.k.value = '0'; } },
            { label: '|x−4| ≤ 0', apply: function (c) { c.p.value = 'x-4'; c.rel.value = '<='; c.k.value = '0'; } }
          ]
        }
      ],
      function (v) {
        var P = S.parsePol(v.p, 'x', 'la expresión de dentro del valor absoluto');
        var g = S.pGrado(P);
        if (g !== 1) throw Error('Escribe dentro del valor absoluto una expresión de primer grado, ' +
          'del tipo 2x-1 o 3-x. Ahora mismo el grado es ' + (isFinite(g) ? g : 0) + '.');
        var k = S.fraccionTxt(v.k, 'El número de comparación');
        var rel = RELS[v.rel] ? v.rel : '<';
        var kv = k.val(), cerrada = RELS[rel].cerrada;
        var menor = rel === '<' || rel === '<=';
        var af = P[1].val(), bf = P[0].val(), centro = -bf / af;
        var Ptex = S.pTex(P), absTex = '\\left|' + Ptex + '\\right|';

        var h = S.expr('Inecuación', absTex + ' ' + relTex(rel) + ' ' + k.tex(true));
        h += aviso('Recuerda la lectura geométrica: ' + K(absTex) + ' es la <b>distancia</b> del número ' +
          K(Ptex) + ' al cero. Por eso una inecuación con valor absoluto siempre se traduce a una condición ' +
          'sobre distancias, y esa condición se rompe en dos desigualdades sin barras.');

        var pasos = [], C, tipo;
        if (kv < 0) {
          tipo = menor ? 'vacio' : 'todo';
          C = menor ? Conj.vacio() : Conj.todo();
          pasos.push({ rot: 'El segundo miembro es negativo', tex: k.tex(true) + ' < 0', clase: 'eq-clave' });
          pasos.push({
            rot: 'Un valor absoluto nunca es negativo',
            tex: absTex + ' \\geq 0 > ' + k.tex(true)
          });
          pasos.push({
            rot: menor ? 'Ninguna distancia puede ser menor que un número negativo'
              : 'Toda distancia es mayor que un número negativo',
            tex: menor ? '\\text{no hay solución}' : 'x \\in \\mathbb{R}',
            clase: menor ? 'eq-mal' : 'eq-bien'
          });
          h += cadena(pasos);
        } else if (kv === 0) {
          var raiz = P[0].opuesto().entre(P[1]);
          pasos.push({ rot: 'El segundo miembro es cero', tex: absTex + ' ' + relTex(rel) + ' 0', clase: 'eq-clave' });
          pasos.push({ rot: 'El valor absoluto vale 0 solo en la raíz', tex: Ptex + ' = 0 \\iff x = ' + raiz.tex(true) });
          if (rel === '<') { C = Conj.vacio(); tipo = 'vacio'; pasos.push({ rot: 'Ninguna distancia es menor que cero', tex: '\\text{no hay solución}', clase: 'eq-mal' }); }
          else if (rel === '<=') { C = Conj.punto(raiz.val()); tipo = 'punto'; pasos.push({ rot: 'Solo sirve el valor que anula el interior', tex: 'x = ' + raiz.tex(true), clase: 'eq-bien' }); }
          else if (rel === '>') { C = Conj.todo().quita([raiz.val()]); tipo = 'agujero'; pasos.push({ rot: 'Vale todo salvo la raíz', tex: 'x \\neq ' + raiz.tex(true), clase: 'eq-bien' }); }
          else { C = Conj.todo(); tipo = 'todo'; pasos.push({ rot: 'Toda distancia es mayor o igual que cero', tex: 'x \\in \\mathbb{R}', clase: 'eq-bien' }); }
          h += cadena(pasos);
        } else if (menor) {
          tipo = 'intervalo';
          var D1 = inecDe(P, S.pDe([k.opuesto()]), cerrada ? '>=' : '>').I.conj;
          var D2 = inecDe(P, S.pDe([k]), cerrada ? '<=' : '<').I.conj;
          C = D1.inter(D2);
          pasos.push({
            rot: 'Distancia pequeña: una sola doble desigualdad',
            tex: '-' + k.tex(true) + ' ' + relTex(rel) + ' ' + Ptex + ' ' + relTex(rel) + ' ' + k.tex(true),
            clase: 'eq-clave'
          });
          pasos.push({ rot: 'Se resuelven las dos condiciones a la vez', tex: D1.desig('x') + ' \\quad\\text{y}\\quad ' + D2.desig('x') });
          pasos.push({ rot: 'Intersección', tex: C.esVacio() ? '\\varnothing' : C.tex(), clase: 'eq-bien' });
          h += cadena(pasos);
          h += rectaMulti([
            { C: D1, rot: 'condición 1', col: COL.azul },
            { C: D2, rot: 'condición 2', col: COL.naranja },
            { C: C, rot: 'solución', col: COL.verde }
          ], { titulo: 'Intersección de las dos condiciones' });
        } else {
          tipo = 'union';
          var E1 = inecDe(P, S.pDe([k.opuesto()]), cerrada ? '<=' : '<').I.conj;
          var E2 = inecDe(P, S.pDe([k]), cerrada ? '>=' : '>').I.conj;
          C = E1.union(E2);
          pasos.push({
            rot: 'Distancia grande: dos casos unidos por «o»',
            tex: Ptex + ' ' + relTex(relGira(rel)) + ' -' + k.tex(true) + ' \\quad\\text{o}\\quad ' +
              Ptex + ' ' + relTex(rel) + ' ' + k.tex(true),
            clase: 'eq-clave'
          });
          pasos.push({ rot: 'Se resuelve cada caso por separado', tex: E1.desig('x') + ' \\quad\\text{o}\\quad ' + E2.desig('x') });
          pasos.push({ rot: 'Unión', tex: C.esVacio() ? '\\varnothing' : C.tex(), clase: 'eq-bien' });
          h += cadena(pasos);
          h += rectaMulti([
            { C: E1, rot: 'caso 1', col: COL.azul },
            { C: E2, rot: 'caso 2', col: COL.naranja },
            { C: C, rot: 'solución', col: COL.verde }
          ], { titulo: 'Unión de los dos casos' });
        }

        h += S.expr('Conjunto solución', C.esVacio() ? '\\varnothing' : C.tex());
        if (tipo === 'vacio' || tipo === 'todo' || tipo === 'punto' || tipo === 'agujero') {
          h += rectaMulti([{ C: C, rot: 'solución', col: COL.verde }], {
            marcas: [centro],
            cap: 'Caso degenerado: la respuesta no es un intervalo cualquiera, sino el conjunto vacío, ' +
              'toda la recta, un único punto o la recta con un agujero.'
          });
        }
        h += cajas([
          { html: '<b>Centro</b><br>' + K('x = ' + S.kf(centro, 4)) + '<br><span class="ap-nota">valor que anula el interior</span>' },
          { html: '<b>Radio</b><br>' + K(k.tex(true) + ' / \\left|' + S.fmt(af, 4).replace('.', '{,}') + '\\right|') +
              '<br><span class="ap-nota">semiamplitud del entorno</span>' },
          { html: '<b>Forma de la solución</b><br>' + S.badge(
            tipo === 'intervalo' ? 'un intervalo' : tipo === 'union' ? 'dos semirrectas' :
              tipo === 'todo' ? 'toda la recta' : tipo === 'vacio' ? 'conjunto vacío' :
                tipo === 'punto' ? 'un solo punto' : 'la recta sin un punto',
            tipo === 'vacio' ? 'no' : 'si') }
        ]);
        h += ejesAuto([
          { f: function (x) { return Math.abs(af * x + bf); }, col: COL.azul, label: 'y = ' + absTex },
          { f: function () { return kv; }, col: COL.rojo, dash: '7 5', label: 'y = ' + k.tex(true) }
        ], Math.floor(centro - 6), Math.ceil(centro + 6), {
          tope: 30,
          cap: 'La gráfica de ' + S.esc('|ax+b|') + ' es una uve con el vértice en la raíz. La solución de la ' +
            'inecuación es el conjunto de abscisas donde la uve queda por debajo (o por encima) de la recta horizontal.'
        });
        return h;
      });
  };

  /* ==================================================================
     13 · generador de ejercicios con corrección automática
     ================================================================== */
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function rsig() { return Math.random() < 0.5 ? -1 : 1; }
  function elige(L) { return L[Math.floor(Math.random() * L.length)]; }
  function noCero(a, b) { var v = ri(a, b); return v === 0 ? (b > 0 ? 1 : -1) : v; }

  var TIPOS = {
    lin: 'Ecuación de primer grado',
    cuad: 'Ecuación de segundo grado',
    trig: 'Ecuación trigonométrica elemental',
    i1: 'Inecuación de primer grado',
    i2: 'Inecuación de segundo grado'
  };

  /* Genera un enunciado del tipo y nivel pedidos.
     Devuelve { tipo, nivel, tex, modo, conj, lista, pista, resuelve() }   */
  function generaEj(tipo, nivel) {
    if (tipo === 'lin') return genLin(nivel);
    if (tipo === 'cuad') return genCuad(nivel);
    if (tipo === 'trig') return genTrig(nivel);
    if (tipo === 'i1') return genI1(nivel);
    return genI2(nivel);
  }

  function genLin(nivel) {
    var a = noCero(-6, 6), c = noCero(-6, 6);
    while (a === c) c = noCero(-6, 6);
    var x0 = nivel === 1 ? ri(-6, 6) : ri(-9, 9);
    var b = ri(-9, 9);
    var d = (a - c) * x0 + b;                       /* fuerza la solución x0 */
    var Iz = S.pDe([fr(b), fr(a)]), De = S.pDe([fr(d), fr(c)]);
    var izqTxt = S.pTex(Iz), derTxt = S.pTex(De);
    if (nivel === 3) {                              /* con denominadores */
      var m = elige([2, 3, 4, 6]);
      Iz = S.pEscala(Iz, fr(1, m));
      izqTxt = '\\dfrac{' + S.pTex(S.pEscala(Iz, fr(m))) + '}{' + m + '}';
    }
    var Dif = S.pRecorta(S.pResta(Iz, De));
    var sol = S.solLineal(Dif[1] || fr(0), Dif[0]);
    return {
      tipo: 'lin', nivel: nivel, modo: 'num',
      tex: izqTxt + ' = ' + derTxt,
      lista: sol.x ? [sol.x.val()] : [],
      conj: sol.conj,
      pista: 'Pasa las incógnitas a un miembro y los números al otro, y despeja dividiendo por el coeficiente de $x$.',
      resuelve: function () {
        var P = S.pRecorta(S.pResta(Iz, De));
        var h = S.expr('Ecuación', izqTxt + ' = ' + derTxt);
        var pasos = [{ rot: 'Todo al primer miembro', tex: S.pTex(P) + ' = 0' }];
        if (S.pGrado(P) === 1) {
          pasos.push({ rot: 'Incógnitas a un lado, números al otro', tex: P[1].tex(true) + 'x = ' + P[0].opuesto().tex(true) });
          pasos.push({ rot: 'Despejo dividiendo', tex: 'x = \\dfrac{' + P[0].opuesto().tex(true) + '}{' + P[1].tex(true) + '} = ' + sol.x.tex(true), clase: 'eq-bien' });
        }
        h += cadena(pasos);
        if (sol.x) {
          var xv = sol.x.val(), cm = S.comprueba(Iz, De, xv);
          h += cajas([{
            clase: cm.ok ? 'eq-ok' : 'eq-ko',
            html: '<b>Comprobación</b><br>' + K('x = ' + sol.x.tex(true)) + '<br>' +
              'primer miembro: ' + K(S.kf(cm.izq, 4)) + '<br>segundo miembro: ' + K(S.kf(cm.der, 4)) +
              '<br>' + S.badge(cm.ok ? 'los dos miembros coinciden' : 'no coinciden', cm.ok ? 'si' : 'no')
          }]);
        }
        return h;
      }
    };
  }

  function genCuad(nivel) {
    var a = nivel === 3 ? elige([1, 1, 2, -1]) : 1;
    var P, r1, r2, sinSol = false;
    if (nivel === 3 && Math.random() < 0.25) {       /* sin solución real */
      var b3 = ri(-4, 4), c3 = ri(3, 9);
      P = S.pDe([fr(c3 + b3 * b3), fr(b3), fr(1)]);
      sinSol = true;
    } else {
      r1 = ri(-6, 6);
      r2 = nivel === 1 ? ri(-6, 6) : (Math.random() < 0.2 ? r1 : ri(-8, 8));
      P = S.pMult(S.pDe([fr(-r1), fr(1)]), S.pDe([fr(-r2), fr(1)]));
      if (a !== 1) P = S.pEscala(P, fr(a));
    }
    var Q = S.solCuadratica(P[2], P[1] || fr(0), P[0]);
    var raices = Q.raices ? Q.raices.map(function (r) { return r.val(); }) : [];
    return {
      tipo: 'cuad', nivel: nivel, modo: 'num',
      tex: S.pTex(P) + ' = 0',
      lista: sinSol ? [] : raices,
      conj: Q.conj,
      pista: 'Calcula el discriminante ' + K('\\Delta = b^2 - 4ac') + ' y aplica la fórmula. Si ' +
        K('\\Delta < 0') + ', la ecuación no tiene solución real.',
      resuelve: function () {
        var h = S.expr('Ecuación', S.pTex(P) + ' = 0');
        h += cadena([
          { rot: 'Coeficientes', tex: 'a = ' + Q.a + ', \\quad b = ' + Q.b + ', \\quad c = ' + Q.c },
          { rot: 'Discriminante', tex: '\\Delta = (' + Q.b + ')^2 - 4\\cdot(' + Q.a + ')\\cdot(' + Q.c + ') = ' + Q.disc, clase: 'eq-clave' },
          {
            rot: Q.disc > 0 ? 'Dos soluciones distintas' : Q.disc === 0 ? 'Una solución doble' : 'Ninguna solución real',
            tex: S.raicesTex(Q), clase: Q.disc < 0 ? 'eq-mal' : 'eq-bien'
          }
        ]);
        h += ejesAuto([{ f: function (x) { return S.pEvalNum(P, x); }, col: COL.azul, label: 'y = ' + S.pTex(P) }],
          Math.floor(Math.min.apply(null, raices.concat([0])) - 3),
          Math.ceil(Math.max.apply(null, raices.concat([0])) + 3),
          { tope: 60, cap: 'Las soluciones de la ecuación son los puntos de corte de la parábola con el eje horizontal.' });
        return h;
      }
    };
  }

  function genTrig(nivel) {
    var fn = elige(nivel === 1 ? ['sen', 'cos'] : ['sen', 'cos', 'tg']);
    var opciones = nivel === 1
      ? [{ k: 0.5, tex: '\\dfrac{1}{2}' }, { k: 0, tex: '0' }, { k: 1, tex: '1' }, { k: -1, tex: '-1' }]
      : [{ k: 0.5, tex: '\\dfrac{1}{2}' }, { k: -0.5, tex: '-\\dfrac{1}{2}' },
        { k: Math.sqrt(2) / 2, tex: '\\dfrac{\\sqrt{2}}{2}' }, { k: -Math.sqrt(3) / 2, tex: '-\\dfrac{\\sqrt{3}}{2}' },
        { k: Math.sqrt(3), tex: '\\sqrt{3}' }, { k: 0, tex: '0' }];
    var o = elige(opciones);
    if (nivel === 3 && fn !== 'tg' && Math.random() < 0.25) o = { k: 2, tex: '2' };  /* imposible */
    var Tr = S.solTrig(fn, o.k);
    var grados = Tr.enRango ? Tr.enRango.map(function (r) { return Math.round(r * 180 / PI * 100) / 100; }) : [];
    return {
      tipo: 'trig', nivel: nivel, modo: 'grados',
      tex: TXT[fn] + ' x = ' + o.tex,
      lista: Tr.imposible ? [] : grados,
      pista: 'Busca el ángulo del primer cuadrante y después los demás ángulos con la misma razón. ' +
        'Se piden las soluciones del primer giro, en grados.',
      resuelve: function () {
        var h = S.expr('Ecuación', TXT[fn] + ' x = ' + o.tex);
        if (Tr.imposible) {
          h += cadena([
            { rot: 'Recorrido de la función', tex: '-1 \\leq ' + TXT[fn] + ' x \\leq 1', clase: 'eq-clave' },
            { rot: 'El valor pedido se sale del recorrido', tex: '\\left|' + o.tex + '\\right| > 1' },
            { rot: 'Conclusión', tex: '\\text{no hay solución}', clase: 'eq-mal' }
          ]);
          return h;
        }
        h += famHTML(Tr);
        h += solsTabla(Tr, fn);
        h += circulo(Tr.enRango.map(function (a, i) {
          return { rad: a, col: i === 0 ? COL.azul : COL.naranja, rot: 'x_' + (i + 1) };
        }), { label: 'Soluciones del primer giro', cap: 'Cada solución del primer giro es un punto de la circunferencia goniométrica.' });
        return h;
      }
    };
  }

  function genI1(nivel) {
    var a = noCero(nivel === 1 ? 1 : -6, 6), b = ri(-8, 8);
    var c = nivel === 1 ? 0 : noCero(-4, 4), d = ri(-8, 8);
    while (a === c) c = noCero(-5, 5);
    var rel = elige(['>', '<', '>=', '<=']);
    var Iz = S.pDe([fr(b), fr(a)]), De = S.pDe([fr(d), fr(c)]);
    var In = inecDe(Iz, De, rel);
    return {
      tipo: 'i1', nivel: nivel, modo: 'conj',
      tex: S.pTex(Iz) + ' ' + relTex(rel) + ' ' + S.pTex(De),
      conj: In.I.conj,
      pista: 'Pasa todo a un miembro y despeja. Si divides por un número negativo, gira el sentido de la desigualdad.',
      resuelve: function () {
        var h = S.expr('Inecuación', S.pTex(Iz) + ' ' + relTex(rel) + ' ' + S.pTex(De));
        var P = In.D, I = In.I;
        var pasos = [{ rot: 'Todo al primer miembro', tex: S.pTex(P) + ' ' + relTex(rel) + ' 0' }];
        if (I.grado === 1) {
          pasos.push({ rot: 'Aíslo el término con la incógnita', tex: P[1].tex(true) + 'x ' + relTex(rel) + ' ' + P[0].opuesto().tex(true) });
          pasos.push({
            rot: I.giro ? 'Divido por un número negativo: el sentido gira' : 'Divido por un número positivo: el sentido se conserva',
            tex: 'x ' + relTex(I.relFinal) + ' ' + I.x.tex(true), clase: I.giro ? 'eq-clave' : ''
          });
        } else {
          pasos.push({ rot: 'La incógnita desaparece', tex: I.conj.esTodo() ? '\\text{desigualdad siempre cierta}' : '\\text{desigualdad nunca cierta}', clase: 'eq-clave' });
        }
        pasos.push({ rot: 'Conjunto solución', tex: I.conj.esVacio() ? '\\varnothing' : I.conj.tex(), clase: 'eq-bien' });
        h += cadena(pasos);
        h += rectaMulti([{ C: I.conj, rot: 'solución', col: COL.azul }], {});
        return h;
      }
    };
  }

  function genI2(nivel) {
    var r1 = ri(-5, 5), r2 = nivel === 1 ? ri(-5, 5) : ri(-7, 7);
    if (r1 > r2) { var t = r1; r1 = r2; r2 = t; }
    var a = nivel === 3 ? elige([1, 1, -1, 2]) : 1;
    var P = S.pEscala(S.pMult(S.pDe([fr(-r1), fr(1)]), S.pDe([fr(-r2), fr(1)])), fr(a));
    var rel = elige(['>', '<', '>=', '<=']);
    var T = S.tablaSignos(P, rel);
    return {
      tipo: 'i2', nivel: nivel, modo: 'conj',
      tex: S.pTex(P) + ' ' + relTex(rel) + ' 0',
      conj: T.conj,
      pista: 'Halla las raíces, dibuja la parábola teniendo en cuenta el signo de $a$ y lee en qué intervalos ' +
        'la gráfica queda por encima o por debajo del eje.',
      resuelve: function () {
        var h = S.expr('Inecuación', S.pTex(P) + ' ' + relTex(rel) + ' 0');
        h += cadena([
          { rot: 'Raíces del polinomio', tex: T.ceros.length ? T.ceros.map(function (z) { return 'x = ' + z.tex; }).join(', \\quad ') : '\\text{no tiene raíces reales}' },
          { rot: 'Signo del coeficiente principal', tex: 'a = ' + S.pLider(P).tex(true) + (S.pLider(P).val() > 0 ? ' > 0 \\;\\text{(parábola hacia arriba)}' : ' < 0 \\;\\text{(parábola hacia abajo)}'), clase: 'eq-clave' },
          { rot: 'Conjunto solución', tex: T.conj.esVacio() ? '\\varnothing' : T.conj.tex(), clase: 'eq-bien' }
        ]);
        h += S.tablaSignosHTML(T, S.pTex(P));
        h += rectaMulti([{ C: T.conj, rot: 'solución', col: COL.azul }], {});
        h += ejesAuto([{ f: function (x) { return S.pEvalNum(P, x); }, col: COL.azul, label: 'y = ' + S.pTex(P) }],
          r1 - 3, r2 + 3, { tope: 60 });
        return h;
      }
    };
  }

  /* Corrección de la respuesta escrita por el alumno. */
  function corrige(ej, txt) {
    var s = String(txt || '').trim();
    if (!s) return null;
    var vacio = /^(vac[ií]o|sin\s*soluci[oó]n|no\s*tiene|ninguna|nada|\{\}|∅)$/i.test(s);
    if (ej.modo === 'conj') {
      var C = vacio ? Conj.vacio() : leeConj(s);
      if (!C) {
        return { ok: false, leido: null, msg: 'No he sabido leer tu respuesta. Escríbela como intervalo, ' +
          'por ejemplo <code>(2,+inf)</code>, <code>[-1,3)</code>, <code>(-inf,0)u(4,+inf)</code>, o como ' +
          'desigualdad, <code>x&gt;2</code>. Si no hay solución escribe <code>vacio</code>.' };
      }
      return { ok: mismoConj(C, ej.conj), leido: C.esVacio() ? '\\varnothing' : C.tex() };
    }
    if (vacio) return { ok: ej.lista.length === 0, leido: '\\varnothing' };
    var nums;
    try {
      nums = S.listaReales(s, 'tu respuesta', 8).map(function (r) { return r.v; });
    } catch (e) {
      return { ok: false, leido: null, msg: 'No he sabido leer tu respuesta. Escribe los valores separados ' +
        'por espacios o comas, por ejemplo <code>-2 3</code> o <code>1/2</code>. Si no hay solución escribe <code>vacio</code>.' };
    }
    var esperados = ej.lista.slice().sort(function (u, w) { return u - w; });
    var dados = nums.slice().sort(function (u, w) { return u - w; });
    var tol = ej.modo === 'grados' ? 0.6 : 1e-6;
    var ok = esperados.length === dados.length;
    if (ok) for (var i = 0; i < esperados.length; i++) if (Math.abs(esperados[i] - dados[i]) > tol) ok = false;
    return { ok: ok, leido: dados.length ? dados.map(function (x) { return S.kf(x, 4); }).join(',\\; ') : '\\varnothing' };
  }

  R.generaEjercicio = function (node) {
    var est = null, verSol = false, marcador = { bien: 0, total: 0 }, corregido = null;
    S.shell(node, 'Entrenador de ecuaciones e inecuaciones',
      'Elige el tipo de ejercicio y el nivel, pulsa <b>Nuevo ejercicio</b> y escribe tu respuesta. ' +
      'Las soluciones numéricas se escriben separadas por espacios (<code>-2 3</code>); los conjuntos, ' +
      'como intervalos (<code>(2,+inf)</code>, <code>[-1,3)</code>, <code>(-inf,0)u(4,+inf)</code>) o como ' +
      'desigualdades (<code>x&gt;2</code>). Si no hay solución escribe <code>vacio</code>. ' +
      'En las trigonométricas se piden los ángulos del primer giro en grados.',
      [
        {
          id: 'tipo', label: 'Tipo', type: 'select', value: 'lin',
          options: Object.keys(TIPOS).map(function (k) { return { value: k, label: TIPOS[k] }; })
        },
        {
          id: 'nivel', label: 'Nivel', type: 'select', value: '1',
          options: [{ value: '1', label: '1 · básico' }, { value: '2', label: '2 · medio' }, { value: '3', label: '3 · avanzado' }]
        },
        { id: 'resp', label: 'Tu respuesta', type: 'text', value: '', place: 'escribe aquí', ancho: '13rem' },
        { id: 'bNuevo', type: 'button', label: 'Nuevo ejercicio', click: function (c) { est = null; verSol = false; corregido = null; c.resp.value = ''; } },
        { id: 'bVer', type: 'button', label: 'Ver la solución', click: function () { verSol = true; } },
        {
          type: 'presets', list: [
            { label: 'Primer grado · nivel 1', apply: function (c) { c.tipo.value = 'lin'; c.nivel.value = '1'; c.resp.value = ''; est = null; verSol = false; corregido = null; } },
            { label: 'Segundo grado · nivel 2', apply: function (c) { c.tipo.value = 'cuad'; c.nivel.value = '2'; c.resp.value = ''; est = null; verSol = false; corregido = null; } },
            { label: 'Trigonométrica · nivel 2', apply: function (c) { c.tipo.value = 'trig'; c.nivel.value = '2'; c.resp.value = ''; est = null; verSol = false; corregido = null; } },
            { label: 'Inecuación 1.er grado · nivel 2', apply: function (c) { c.tipo.value = 'i1'; c.nivel.value = '2'; c.resp.value = ''; est = null; verSol = false; corregido = null; } },
            { label: 'Inecuación 2.º grado · nivel 3', apply: function (c) { c.tipo.value = 'i2'; c.nivel.value = '3'; c.resp.value = ''; est = null; verSol = false; corregido = null; } },
            { label: 'Reiniciar el marcador', apply: function (c) { marcador = { bien: 0, total: 0 }; est = null; verSol = false; corregido = null; c.resp.value = ''; } }
          ]
        }
      ],
      function (v) {
        var nivel = Number(v.nivel) || 1;
        var tipo = TIPOS[v.tipo] ? v.tipo : 'lin';
        if (!est || est.tipo !== tipo || est.nivel !== nivel) {
          est = generaEj(tipo, nivel);
          verSol = false; corregido = null;
        }
        var h = '<div class="ap-enun"><b>' + TIPOS[tipo] + ' · nivel ' + nivel + '</b><br>' +
          'Resuelve: ' + KD(est.tex) + '</div>';
        h += aviso('<b>Qué se pide:</b> ' +
          (est.modo === 'conj' ? 'el conjunto solución, escrito como intervalo o como desigualdad.'
            : est.modo === 'grados' ? 'las soluciones del primer giro, en grados y separadas por espacios.'
              : 'todas las soluciones, separadas por espacios.'));

        var res = corrige(est, v.resp);
        if (res) {
          if (res.msg) {
            h += '<div class="eq-check"><div class="eq-check-caja eq-ko">' + res.msg + '</div></div>';
          } else {
            if (corregido !== res.ok) { marcador.total++; if (res.ok) marcador.bien++; corregido = res.ok; }
            h += cajas([{
              clase: res.ok ? 'eq-ok' : 'eq-ko',
              html: '<b>' + (res.ok ? 'Correcto' : 'Todavía no') + '</b><br>He leído ' + K(res.leido) + '<br>' +
                '<span class="ap-nota">' + (res.ok ? 'Coincide con el conjunto solución.'
                  : 'Revisa el signo, los extremos abiertos o cerrados y si falta alguna solución.') + '</span>'
            }]);
          }
        } else {
          corregido = null;
          h += aviso('Escribe tu respuesta en la casilla y se corregirá sola. ' +
            '<b>Pista:</b> ' + est.pista);
        }
        if (verSol) {
          h += '<h5 class="ap-sub">Solución paso a paso</h5>';
          h += est.resuelve();
        }
        h += S.kvs(['Intentos: ' + marcador.total, 'Aciertos: ' + marcador.bien,
          'Porcentaje: ' + (marcador.total ? Math.round(100 * marcador.bien / marcador.total) : 0) + ' %']);
        return h;
      });
  };

  /* ==================================================================
     14 · autoevaluación final del tema
     ================================================================== */
  var QUIZ = [
    {
      p: 'La ecuación $\\operatorname{sen} x = \\dfrac{1}{2}$, en todos los números reales, tiene…',
      ops: ['dos soluciones', 'cuatro soluciones', 'infinitas soluciones'],
      ok: 2,
      expl: 'Las razones trigonométricas son periódicas: cada solución del primer giro genera una familia ' +
        'entera al sumarle $2k\\pi$. Hay infinitas soluciones, aunque solo dos estén en $[0,2\\pi)$.'
    },
    {
      p: 'La ecuación $\\cos x = \\dfrac{3}{2}$…',
      ops: ['tiene dos soluciones', 'no tiene solución', 'tiene una sola solución'],
      ok: 1,
      expl: 'El coseno de un ángulo es la abscisa de un punto de la circunferencia de radio 1, así que ' +
        'siempre está entre $-1$ y $1$. Como $\\dfrac{3}{2} > 1$, no hay ningún ángulo posible.'
    },
    {
      p: 'Las soluciones de $\\cos x = 0$ en el primer giro $[0,2\\pi)$ son…',
      ops: ['\\(0\\) y \\(\\pi\\)', '\\(\\pi/2\\) y \\(3\\pi/2\\)', 'solo \\(\\pi/2\\)'],
      ok: 1,
      expl: 'El coseno se anula en los dos puntos de la circunferencia que están sobre el eje vertical: ' +
        '$x = \\dfrac{\\pi}{2}$ y $x = \\dfrac{3\\pi}{2}$.'
    },
    {
      p: 'La familia de soluciones de $\\operatorname{tg} x = 1$ es…',
      ops: ['\\(\\pi/4 + 2k\\pi\\)', '\\(\\pi/4 + k\\pi\\)', '\\(\\pi/4 + 2k\\pi\\) y \\(3\\pi/4 + 2k\\pi\\)'],
      ok: 1,
      expl: 'La tangente tiene periodo $\\pi$, no $2\\pi$: por eso las soluciones se agrupan en una sola ' +
        'familia con $+k\\pi$.'
    },
    {
      p: 'Si $-2x > 6$, entonces…',
      ops: ['\\(x > -3\\)', '\\(x < -3\\)', '\\(x > 3\\)'],
      ok: 1,
      expl: 'Al dividir los dos miembros entre $-2$, que es negativo, el sentido de la desigualdad gira: ' +
        'queda $x < -3$.'
    },
    {
      p: 'El conjunto solución de $0\\cdot x > 5$ es…',
      ops: ['\\(\\mathbb{R}\\)', 'el conjunto vacío', '\\(x > 5\\)'],
      ok: 1,
      expl: 'Al desaparecer la incógnita queda $0 > 5$, que es falso: ningún número la cumple.'
    },
    {
      p: 'En la inecuación $\\dfrac{x-1}{x+2} \\geq 0$, el valor $x = -2$…',
      ops: ['pertenece a la solución', 'no pertenece, porque anula el denominador', 'pertenece solo si la desigualdad no es estricta'],
      ok: 1,
      expl: 'En $x=-2$ la fracción no existe. Los polos se excluyen siempre, aunque la desigualdad admita ' +
        'la igualdad; por eso aparecen como extremos abiertos.'
    },
    {
      p: 'El conjunto solución de $x^2 + 1 > 0$ es…',
      ops: ['\\(\\mathbb{R}\\)', 'el conjunto vacío', '\\((-1,1)\\)'],
      ok: 0,
      expl: 'El discriminante es negativo y $a>0$: la parábola queda entera por encima del eje, así que la ' +
        'desigualdad se cumple siempre.'
    },
    {
      p: 'El conjunto solución de $x^2 - 4 \\leq 0$ es…',
      ops: ['\\((-\\infty,-2] \\cup [2,+\\infty)\\)', '\\([-2,2]\\)', '\\((-2,2)\\)'],
      ok: 1,
      expl: 'Las raíces son $-2$ y $2$, y la parábola está por debajo del eje entre ellas. Como la ' +
        'desigualdad admite la igualdad, los extremos entran: $[-2,2]$.'
    },
    {
      p: 'El conjunto solución de $|x-3| < 2$ es…',
      ops: ['\\((1,5)\\)', '\\((-\\infty,1) \\cup (5,+\\infty)\\)', '\\([1,5]\\)'],
      ok: 0,
      expl: 'Se lee como una distancia: los números que distan de $3$ menos de $2$ forman el intervalo ' +
        'abierto $(1,5)$, es decir, $1 < x < 5$.'
    }
  ];

  /* Texto plano de cada opción, para los desplegables y para el enunciado. */
  function opcionTxt(t) {
    return t.replace(/\\\(|\\\)/g, '')
      .replace(/\\dfrac/g, '').replace(/\\pi/g, 'π').replace(/\\infty/g, '∞')
      .replace(/\\cup/g, '∪').replace(/\\mathbb/g, '').replace(/\\leq/g, '≤').replace(/\\geq/g, '≥')
      .replace(/[{}]/g, '').replace(/-/g, '−').replace(/\s+/g, ' ').trim();
  }
  QUIZ.forEach(function (q) { q.limpio = q.ops.map(opcionTxt); });

  R.autoevaluacion = function (node) {
    var verTodo = false;
    var campos = QUIZ.map(function (q, i) {
      var ops = [{ value: '', label: '— elige —' }];
      q.limpio.forEach(function (t, j) {
        ops.push({ value: String(j), label: String.fromCharCode(97 + j) + ') ' + t });
      });
      return { id: 'q' + i, label: 'Pregunta ' + (i + 1), type: 'select', value: '', options: ops, ancho: '13rem' };
    });
    campos.push({ id: 'bVer', type: 'button', label: 'Ver todas las respuestas comentadas', click: function () { verTodo = true; } });
    campos.push({
      type: 'presets', list: [
        { label: 'Vaciar respuestas', apply: function (c) { verTodo = false; QUIZ.forEach(function (q, i) { c['q' + i].value = ''; }); } },
        { label: 'Ocultar los comentarios', apply: function () { verTodo = false; } }
      ]
    });

    S.shell(node, 'Autoevaluación del tema',
      'Diez preguntas de repaso sobre ecuaciones trigonométricas e inecuaciones. Elige una respuesta en cada ' +
      'desplegable: la corrección aparece al instante. El botón de abajo muestra todos los comentarios, ' +
      'úsalo solo después de haberlo intentado.',
      campos,
      function (v) {
        var bien = 0, contestadas = 0;
        var h = '';
        var filas = QUIZ.map(function (q, i) {
          var sel = v['q' + i];
          var elegida = sel === '' || sel === undefined ? null : Number(sel);
          var acierto = elegida === q.ok;
          if (elegida !== null) { contestadas++; if (acierto) bien++; }
          var enun = '<b>' + (i + 1) + '.</b> ' + q.p +
            '<div class="ap-nota">' + q.limpio.map(function (t, j) {
              return String.fromCharCode(97 + j) + ') ' + S.esc(t);
            }).join(' &nbsp;·&nbsp; ') + '</div>';
          var estado = elegida === null ? S.badge('sin contestar', 'info')
            : acierto ? S.badge('correcta', 'si') : S.badge('incorrecta', 'no');
          var coment = (verTodo || (elegida !== null && !acierto))
            ? '<div class="ap-nota">' + (elegida !== null && !acierto
              ? 'La respuesta buena es la <b>' + String.fromCharCode(97 + q.ok) + '</b>. ' : '') + q.expl + '</div>'
            : (elegida !== null && acierto ? '<div class="ap-nota">' + q.expl + '</div>' : '');
          return [enun, estado + coment];
        });
        h += S.tabla(['Pregunta', 'Corrección'], filas, { thPrimera: false });
        var pct = contestadas ? Math.round(100 * bien / contestadas) : 0;
        h += S.resultado(bien + ' / ' + QUIZ.length, 'respuestas correctas');
        h += S.kvs(['Contestadas: ' + contestadas + ' de ' + QUIZ.length, 'Aciertos: ' + bien,
          'Porcentaje sobre lo contestado: ' + pct + ' %']);
        h += aviso(contestadas < QUIZ.length
          ? 'Todavía te quedan preguntas por contestar. Ninguna pregunta pide cálculos largos: todas se ' +
            'responden razonando sobre el tipo de ecuación o de inecuación.'
          : (bien === QUIZ.length
            ? 'Test completo y sin fallos. Pasa al entrenador de ejercicios y trabaja el nivel 3.'
            : 'Repasa los apartados de las preguntas falladas antes de seguir con los ejercicios propuestos.'));
        return h;
      });
  };

  S.extraC = true;
  if (S.monta) S.monta();
})();
