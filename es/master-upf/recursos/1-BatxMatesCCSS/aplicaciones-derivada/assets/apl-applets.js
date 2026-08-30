/* =====================================================================
   apl-applets.js — APLICACIONES DE LA DERIVADA · 1r Batx Mates CCSS
   Motor unico del tema. Apartados 1 a 5: crecimiento, curvatura,
   representacion de funciones, polinomicas y racionales.

   UBICACION
     es/master-upf/recursos/1-BatxMatesCCSS/aplicaciones-derivada/assets/apl-applets.js

   API PUBLICA
     window.APL.reg(clave, fn)   registra un applet nuevo
     window.APL.boot()           vuelve a barrer el documento
     window.APL.core             nucleo reutilizable por un modulo de ampliacion

   ARRANQUE
     Se carga con defer. Con readyState 'loading' espera el evento; en
     cualquier otro estado cede el turno con setTimeout(boot, 0) para que
     los demas scripts diferidos terminen de registrar sus applets antes
     del barrido. Es el criterio unificado de los siete motores del curso.

   ALCANCE MATEMATICO
     Polinomios de cualquier grado y funciones racionales cociente de dos
     polinomios. Cubre todo lo que pide el curriculo de 1 de bachillerato
     en este tema. Las raices se localizan por muestreo y biseccion, lo
     que es exacto a efectos practicos y evita depender de factorizacion.

   CONVENIOS DE FORMATO
     T()     envuelve TeX y lo pasa por KaTeX.
     key()   resalta un termino con .ap-key.
     Nunca se numeran los titulos de los applets: llevan nombre propio,
     por ejemplo «Applet · Monotonia y signo de la derivada».
   ===================================================================== */

(function () {
  'use strict';

  /* ---------------------------------------------------------------- */
  /* 1. REGISTRO                                                      */
  /* ---------------------------------------------------------------- */

  var REG = {};
  function reg(k, fn) { REG[k] = fn; }

  /* ---------------------------------------------------------------- */
  /* 2. FORMATO                                                       */
  /* ---------------------------------------------------------------- */

  function T(tex) {
    if (typeof window.katex === 'undefined') return '<code>' + tex + '</code>';
    try {
      return window.katex.renderToString(tex, { throwOnError: false });
    } catch (e) {
      return '<code>' + tex + '</code>';
    }
  }

  function key(s) { return '<span class="ap-key">' + s + '</span>'; }
  function ok(s) { return '<span class="ap-ok">' + s + '</span>'; }
  function bad(s) { return '<span class="ap-bad">' + s + '</span>'; }
  function chip(s) { return '<span class="ap-chip">' + s + '</span>'; }

  /* Numero legible: entero si lo es, tres decimales si no. */
  function num(x) {
    if (!isFinite(x)) return '\\text{no definido}';
    var r = Math.round(x);
    if (Math.abs(x - r) < 1e-9) return String(r);
    return String(Math.round(x * 1000) / 1000);
  }

  /* ---------------------------------------------------------------- */
  /* 3. POLINOMIOS. Un polinomio es un array de coeficientes donde    */
  /*    el indice es el exponente: [2,0,1] representa x^2 + 2.        */
  /* ---------------------------------------------------------------- */

  function parsePoly(s) {
    s = String(s).replace(/\s+/g, '').replace(/\u2212/g, '-').replace(/\*/g, '');
    if (!s) return null;
    if (s.charAt(0) !== '-' && s.charAt(0) !== '+') s = '+' + s;
    var re = /([+-])([^+-]+)/g, m, c = [], usado = 0;
    while ((m = re.exec(s)) !== null) {
      usado += m[0].length;
      var sg = (m[1] === '-') ? -1 : 1, t = m[2], coef, pw;
      var i = t.indexOf('x');
      if (i < 0) {
        coef = parseFloat(t); pw = 0;
      } else {
        var a = t.slice(0, i), b = t.slice(i + 1);
        coef = (a === '') ? 1 : parseFloat(a);
        if (b === '') pw = 1;
        else if (b.charAt(0) === '^') pw = parseInt(b.slice(1), 10);
        else return null;
      }
      if (!isFinite(coef) || !isFinite(pw) || pw < 0 || pw > 12) return null;
      c[pw] = (c[pw] || 0) + sg * coef;
    }
    if (usado !== s.length) return null;
    for (var k = 0; k < c.length; k++) if (c[k] === undefined) c[k] = 0;
    while (c.length > 1 && c[c.length - 1] === 0) c.pop();
    return c.length ? c : null;
  }

  function polyEval(c, x) {
    var y = 0;
    for (var i = c.length - 1; i >= 0; i--) y = y * x + c[i];
    return y;
  }

  function polyDeriv(c) {
    if (c.length <= 1) return [0];
    var d = [];
    for (var i = 1; i < c.length; i++) d[i - 1] = c[i] * i;
    return d;
  }

  function polyTex(c) {
    var partes = [], i, a;
    for (i = c.length - 1; i >= 0; i--) {
      a = c[i];
      if (a === 0) continue;
      var sg = a < 0 ? '-' : '+';
      var abs = Math.abs(a);
      var co = (abs === 1 && i > 0) ? '' : num(abs);
      var vx = i === 0 ? '' : (i === 1 ? 'x' : 'x^{' + i + '}');
      partes.push((partes.length === 0 ? (a < 0 ? '-' : '') : sg) + co + vx);
    }
    if (!partes.length) return '0';
    return partes.join('');
  }

  function polyGrado(c) { return c.length - 1; }

  /* Division entera de polinomios, para la asintota oblicua. */
  function polyDiv(n, d) {
    var r = n.slice(), q = [], i, k, f;
    var gd = polyGrado(d);
    for (i = polyGrado(r) - gd; i >= 0; i--) {
      f = r[i + gd] / d[gd];
      q[i] = f;
      for (k = 0; k <= gd; k++) r[i + k] -= f * d[k];
    }
    for (i = 0; i < q.length; i++) if (q[i] === undefined) q[i] = 0;
    while (r.length > 1 && Math.abs(r[r.length - 1]) < 1e-12) r.pop();
    return { q: q.length ? q : [0], r: r };
  }

  /* Raices reales por muestreo y biseccion. Robusto y suficiente. */
  function polyRaices(c, xmin, xmax) {
    if (polyGrado(c) < 1) return [];
    xmin = (xmin === undefined) ? -40 : xmin;
    xmax = (xmax === undefined) ? 40 : xmax;
    var paso = (xmax - xmin) / 8000, res = [], x, y0, y1, a, b, ym, j;
    y0 = polyEval(c, xmin);
    if (Math.abs(y0) < 1e-12) res.push(xmin);
    for (x = xmin; x < xmax; x += paso) {
      y1 = polyEval(c, x + paso);
      if (Math.abs(y1) < 1e-12) { res.push(x + paso); y0 = y1; continue; }
      if (y0 * y1 < 0) {
        a = x; b = x + paso;
        for (j = 0; j < 80; j++) {
          ym = (a + b) / 2;
          if (polyEval(c, a) * polyEval(c, ym) <= 0) b = ym; else a = ym;
        }
        res.push((a + b) / 2);
      }
      y0 = y1;
    }
    /* Redondeo suave y eliminacion de duplicados. */
    var lim = [], i;
    res.sort(function (p, q2) { return p - q2; });
    for (i = 0; i < res.length; i++) {
      var v = res[i];
      var rr = Math.round(v);
      if (Math.abs(v - rr) < 1e-6) v = rr;
      if (!lim.length || Math.abs(v - lim[lim.length - 1]) > 1e-6) lim.push(v);
    }
    return lim;
  }

  /* ---------------------------------------------------------------- */
  /* 4. FUNCIONES RACIONALES: cociente de dos polinomios.             */
  /* ---------------------------------------------------------------- */

  function parseRac(s) {
    s = String(s).replace(/\s+/g, '');
    var prof = 0, corte = -1, i, ch;
    for (i = 0; i < s.length; i++) {
      ch = s.charAt(i);
      if (ch === '(') prof++;
      else if (ch === ')') prof--;
      else if (ch === '/' && prof === 0) { corte = i; break; }
    }
    var quita = function (t) {
      t = t.replace(/\s+/g, '');
      while (t.charAt(0) === '(' && t.charAt(t.length - 1) === ')') t = t.slice(1, -1);
      return t;
    };
    if (corte < 0) {
      var p = parsePoly(s);
      return p ? { n: p, d: [1] } : null;
    }
    var n = parsePoly(quita(s.slice(0, corte)));
    var d = parsePoly(quita(s.slice(corte + 1)));
    if (!n || !d) return null;
    return { n: n, d: d };
  }

  function racEval(f, x) {
    var dd = polyEval(f.d, x);
    if (Math.abs(dd) < 1e-12) return NaN;
    return polyEval(f.n, x) / dd;
  }

  function racTex(f) {
    if (f.d.length === 1 && f.d[0] === 1) return polyTex(f.n);
    return '\\dfrac{' + polyTex(f.n) + '}{' + polyTex(f.d) + '}';
  }

  /* Derivada por la regla del cociente, devuelta como racional. */
  function racDeriv(f) {
    if (f.d.length === 1 && f.d[0] === 1) return { n: polyDeriv(f.n), d: [1] };
    var np = polyDeriv(f.n), dp = polyDeriv(f.d);
    var A = polyMul(np, f.d), B = polyMul(f.n, dp);
    return { n: polySub(A, B), d: polyMul(f.d, f.d) };
  }

  function polyMul(a, b) {
    var r = [], i, j;
    for (i = 0; i < a.length + b.length - 1; i++) r[i] = 0;
    for (i = 0; i < a.length; i++)
      for (j = 0; j < b.length; j++) r[i + j] += a[i] * b[j];
    while (r.length > 1 && Math.abs(r[r.length - 1]) < 1e-12) r.pop();
    return r;
  }

  function polySub(a, b) {
    var n2 = Math.max(a.length, b.length), r = [], i;
    for (i = 0; i < n2; i++) r[i] = (a[i] || 0) - (b[i] || 0);
    while (r.length > 1 && Math.abs(r[r.length - 1]) < 1e-12) r.pop();
    return r;
  }

  /* ---------------------------------------------------------------- */
  /* 5. ESQUELETO DE UN APPLET                                        */
  /* ---------------------------------------------------------------- */

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function shell(node, titulo, ayudas) {
    node.innerHTML = '';
    var caja = el('div', 'applet');
    var cab = el('div', 'ap-head');
    cab.appendChild(el('div', 'ap-title', titulo));
    if (ayudas && ayudas.length) {
      var ul = el('ul', 'ap-help'), i;
      for (i = 0; i < ayudas.length; i++) ul.appendChild(el('li', null, ayudas[i]));
      cab.appendChild(ul);
    }
    caja.appendChild(cab);
    var ctr = el('div', null);
    var salida = el('div', 'ap-out');
    caja.appendChild(ctr);
    caja.appendChild(salida);
    node.appendChild(caja);
    return { caja: caja, ctr: ctr, out: salida };
  }

  function fila(padre, etiqueta, control) {
    var f = el('div', 'ap-row');
    f.appendChild(el('span', 'ap-lab', etiqueta));
    f.appendChild(control);
    padre.appendChild(f);
    return f;
  }

  function entrada(valor, mini) {
    var i = el('input', 'ap-in' + (mini ? ' ap-mini' : ''));
    i.type = 'text';
    i.value = valor;
    i.spellcheck = false;
    return i;
  }

  function boton(texto) {
    var b = el('button', 'ap-btn', texto);
    b.type = 'button';
    return b;
  }

  function selector(opciones) {
    var s = el('select', 'ap-sel'), i, o;
    for (i = 0; i < opciones.length; i++) {
      o = el('option', null, opciones[i][1]);
      o.value = opciones[i][0];
      s.appendChild(o);
    }
    return s;
  }

  function paso(padre, html, aviso) {
    padre.appendChild(el('div', 'ap-step' + (aviso ? ' ap-warn' : ''), html));
  }

  /* Ejecuta fn cada vez que el usuario cambia algo. */
  function vivo(controles, fn) {
    var i;
    for (i = 0; i < controles.length; i++) {
      controles[i].addEventListener('input', fn);
      controles[i].addEventListener('change', fn);
    }
    fn();
  }

  /* ---------------------------------------------------------------- */
  /* 6. GRAFICA sobre canvas                                          */
  /* ---------------------------------------------------------------- */

  function lienzo(ancho, alto) {
    var c = el('canvas');
    c.width = ancho; c.height = alto;
    c.style.maxWidth = '100%';
    c.style.height = 'auto';
    c.style.display = 'block';
    c.style.margin = '0.6rem auto';
    return c;
  }

  /* opts: {xmin,xmax,ymin,ymax, curvas:[{f,color,grosor}], puntos:[{x,y,color,etiqueta}],
            vlineas:[{x,color}], hlineas:[{y,color}], rectas:[{m,b,color}] } */
  function dibuja(cv, opts) {
    var g = cv.getContext('2d');
    var W = cv.width, H = cv.height;
    var xmin = opts.xmin, xmax = opts.xmax, ymin = opts.ymin, ymax = opts.ymax;
    var X = function (x) { return (x - xmin) / (xmax - xmin) * W; };
    var Y = function (y) { return H - (y - ymin) / (ymax - ymin) * H; };

    g.clearRect(0, 0, W, H);
    g.fillStyle = '#fff';
    g.fillRect(0, 0, W, H);

    /* Rejilla en pasos enteros. */
    g.strokeStyle = '#eee'; g.lineWidth = 1;
    var i;
    for (i = Math.ceil(xmin); i <= Math.floor(xmax); i++) {
      g.beginPath(); g.moveTo(X(i), 0); g.lineTo(X(i), H); g.stroke();
    }
    for (i = Math.ceil(ymin); i <= Math.floor(ymax); i++) {
      g.beginPath(); g.moveTo(0, Y(i)); g.lineTo(W, Y(i)); g.stroke();
    }

    /* Ejes. */
    g.strokeStyle = '#666'; g.lineWidth = 1.5;
    if (ymin < 0 && ymax > 0) { g.beginPath(); g.moveTo(0, Y(0)); g.lineTo(W, Y(0)); g.stroke(); }
    if (xmin < 0 && xmax > 0) { g.beginPath(); g.moveTo(X(0), 0); g.lineTo(X(0), H); g.stroke(); }

    /* Asintotas verticales. */
    var j;
    if (opts.vlineas) for (j = 0; j < opts.vlineas.length; j++) {
      g.strokeStyle = opts.vlineas[j].color || '#c0392b';
      g.lineWidth = 1.5;
      g.setLineDash([6, 4]);
      g.beginPath(); g.moveTo(X(opts.vlineas[j].x), 0); g.lineTo(X(opts.vlineas[j].x), H); g.stroke();
      g.setLineDash([]);
    }
    if (opts.hlineas) for (j = 0; j < opts.hlineas.length; j++) {
      g.strokeStyle = opts.hlineas[j].color || '#2980b9';
      g.lineWidth = 1.5;
      g.setLineDash([6, 4]);
      g.beginPath(); g.moveTo(0, Y(opts.hlineas[j].y)); g.lineTo(W, Y(opts.hlineas[j].y)); g.stroke();
      g.setLineDash([]);
    }
    if (opts.rectas) for (j = 0; j < opts.rectas.length; j++) {
      var R = opts.rectas[j];
      g.strokeStyle = R.color || '#8e44ad';
      g.lineWidth = 1.5;
      g.setLineDash([6, 4]);
      g.beginPath();
      g.moveTo(X(xmin), Y(R.m * xmin + R.b));
      g.lineTo(X(xmax), Y(R.m * xmax + R.b));
      g.stroke();
      g.setLineDash([]);
    }

    /* Curvas, con corte del trazo en los saltos grandes. */
    var N = 1400;
    if (opts.curvas) for (j = 0; j < opts.curvas.length; j++) {
      var C = opts.curvas[j];
      g.strokeStyle = C.color || '#1f6feb';
      g.lineWidth = C.grosor || 2.2;
      g.beginPath();
      var arranca = true, xp = 0, yp = 0, k, x, y;
      for (k = 0; k <= N; k++) {
        x = xmin + (xmax - xmin) * k / N;
        y = C.f(x);
        if (!isFinite(y) || y < ymin - (ymax - ymin) * 4 || y > ymax + (ymax - ymin) * 4) {
          arranca = true; continue;
        }
        if (!arranca && Math.abs(Y(y) - yp) > H * 0.6) arranca = true;
        if (arranca) { g.moveTo(X(x), Y(y)); arranca = false; }
        else g.lineTo(X(x), Y(y));
        xp = X(x); yp = Y(y);
      }
      g.stroke();
    }

    /* Puntos destacados. */
    if (opts.puntos) for (j = 0; j < opts.puntos.length; j++) {
      var P = opts.puntos[j];
      if (!isFinite(P.y)) continue;
      g.fillStyle = P.color || '#c0392b';
      g.beginPath(); g.arc(X(P.x), Y(P.y), 4.5, 0, Math.PI * 2); g.fill();
      if (P.etiqueta) {
        g.fillStyle = '#333';
        g.font = '12px sans-serif';
        g.fillText(P.etiqueta, X(P.x) + 7, Y(P.y) - 7);
      }
    }
  }

  /* Rango vertical automatico a partir de una muestra. */
  function rangoY(f, xmin, xmax) {
    var vs = [], k, x, y;
    for (k = 0; k <= 400; k++) {
      x = xmin + (xmax - xmin) * k / 400;
      y = f(x);
      if (isFinite(y)) vs.push(y);
    }
    if (!vs.length) return { ymin: -5, ymax: 5 };
    vs.sort(function (a, b) { return a - b; });
    var lo = vs[Math.floor(vs.length * 0.04)], hi = vs[Math.floor(vs.length * 0.96)];
    if (!isFinite(lo) || !isFinite(hi) || hi - lo < 1e-6) { lo = lo - 3; hi = hi + 3; }
    var m = (hi - lo) * 0.18;
    return { ymin: lo - m, ymax: hi + m };
  }

  /* ---------------------------------------------------------------- */
  /* 7. TABLA DE SIGNOS                                               */
  /* ---------------------------------------------------------------- */

  /* puntos: valores que parten la recta. eval: funcion a evaluar.
     Devuelve HTML de tabla con el signo en cada intervalo. */
  function tablaSignos(puntos, evalF, etiquetaFn, etiquetaEfecto) {
    var ps = puntos.slice().sort(function (a, b) { return a - b; });
    var cortes = [-Infinity].concat(ps).concat([Infinity]);
    var filas1 = '<tr><th>Intervalo</th>';
    var filas2 = '<tr><td>' + etiquetaFn + '</td>';
    var filas3 = '<tr><td>' + etiquetaEfecto[0] + '</td>';
    var i, a, b, mid, s;
    for (i = 0; i < cortes.length - 1; i++) {
      a = cortes[i]; b = cortes[i + 1];
      if (a === -Infinity && b === Infinity) mid = 0;
      else if (a === -Infinity) mid = b - 1;
      else if (b === Infinity) mid = a + 1;
      else mid = (a + b) / 2;
      s = evalF(mid);
      var iv = '(' + (a === -Infinity ? '-\\infty' : num(a)) + ',\\ ' +
               (b === Infinity ? '+\\infty' : num(b)) + ')';
      filas1 += '<th>' + T(iv) + '</th>';
      filas2 += '<td>' + (s > 0 ? ok('+') : (s < 0 ? bad('-') : '0')) + '</td>';
      filas3 += '<td>' + (s > 0 ? etiquetaEfecto[1] : (s < 0 ? etiquetaEfecto[2] : '?')) + '</td>';
    }
    return '<table class="ap-tabla">' + filas1 + '</tr>' + filas2 + '</tr>' + filas3 + '</tr></table>';
  }

  /* ---------------------------------------------------------------- */
  /* 8. AYUDAS DE SINTAXIS, comunes a todos los applets               */
  /* ---------------------------------------------------------------- */

  var SINTAXIS = [
    'Escribe la potencia con el acento circunflejo: <code>x^3</code> es ' + T('x^{3}') + '.',
    'El producto por un numero va pegado: <code>3x^2</code>, <code>-2x</code>, <code>5</code>.',
    'Suma y resta los terminos sin espacios ni parentesis: <code>x^3-3x^2+2</code>.',
    'Para una funcion racional usa la barra: <code>(x^2-1)/(x-2)</code>.',
    'Si escribes algo que no entiende, el applet te avisa y no cambia la grafica.'
  ];

  function leePoly(campo, salida) {
    var c = parsePoly(campo.value);
    if (!c) {
      paso(salida, 'No entiendo <code>' + campo.value + '</code>. Revisa la sintaxis.', true);
      return null;
    }
    return c;
  }

  function leeRac(campo, salida) {
    var f = parseRac(campo.value);
    if (!f) {
      paso(salida, 'No entiendo <code>' + campo.value + '</code>. Revisa la sintaxis.', true);
      return null;
    }
    return f;
  }

  /* ================================================================ */
  /* APPLETS DEL APARTADO 1: CRECIMIENTO Y DECRECIMIENTO              */
  /* ================================================================ */

  reg('monotonia', function (node) {
    var o = shell(node, 'Applet \u00b7 Monotonia y signo de la derivada', [
      'Escribe una funcion polinomica y el applet calcula ' + T("f'(x)") +
        ', busca donde se anula y construye la ' + key('tabla de signos') + '.',
      'La grafica pinta en ' + ok('verde') + ' los tramos crecientes y en ' +
        bad('rojo') + ' los decrecientes, para que veas la relacion de un golpe.',
      'Empieza con <code>x^3-3x</code>: la derivada es ' + T("3x^{2}-3") +
        ', que se anula en ' + T('x=-1') + ' y ' + T('x=1') + '.',
      'Prueba <code>x^3</code>: la derivada se anula en ' + T('x=0') +
        ' pero la funcion no deja de crecer. Ese caso importa.',
      'Prueba <code>x^2</code>, <code>-x^2+4x</code> y <code>x^4-2x^2</code>.'
    ].concat(SINTAXIS));

    var cf = entrada('x^3-3x');
    fila(o.ctr, 'f(x) =', cf);
    var cv = lienzo(720, 380);
    o.caja.insertBefore(cv, o.out);

    vivo([cf], function () {
      o.out.innerHTML = '';
      var c = leePoly(cf, o.out);
      if (!c) return;
      var d = polyDeriv(c);
      var raices = polyRaices(d, -20, 20);

      paso(o.out, 'Funcion: ' + T('f(x)=' + polyTex(c)));
      paso(o.out, 'Derivada: ' + T("f'(x)=" + polyTex(d)));

      if (!raices.length) {
        paso(o.out, 'La derivada no se anula en ningun punto, asi que ' +
          'mantiene el signo en todo ' + T('\\mathbb{R}') + '.');
      } else {
        var lista = raices.map(function (r) { return T('x=' + num(r)); }).join(', ');
        paso(o.out, 'La derivada se anula en ' + lista +
          '. Estos son los ' + key('puntos criticos') + '.');
      }

      paso(o.out, tablaSignos(raices, function (x) { return polyEval(d, x); },
        T("f'(x)"), ['f(x)', ok('crece'), bad('decrece')]));

      /* Clasificacion por cambio de signo. */
      var i, cls = [];
      for (i = 0; i < raices.length; i++) {
        var r = raices[i];
        var iz = polyEval(d, r - 0.01), de = polyEval(d, r + 0.01);
        var tipo;
        if (iz > 0 && de < 0) tipo = 'maximo relativo';
        else if (iz < 0 && de > 0) tipo = 'minimo relativo';
        else tipo = 'no es extremo, solo tangente horizontal';
        cls.push(T('x=' + num(r)) + ': ' + key(tipo) +
          ', con ' + T('f(' + num(r) + ')=' + num(polyEval(c, r))));
      }
      if (cls.length) paso(o.out, cls.join('<br>'));

      var rg = rangoY(function (x) { return polyEval(c, x); }, -5, 5);
      var curvas = [];
      /* Un tramo por intervalo de signo constante, con su color. */
      var cortes = [-6].concat(raices).concat([6]);
      for (i = 0; i < cortes.length - 1; i++) {
        (function (a, b) {
          var mid = (a + b) / 2;
          var sg = polyEval(d, mid);
          curvas.push({
            color: sg >= 0 ? '#1e8449' : '#c0392b',
            grosor: 2.6,
            f: function (x) { return (x >= a && x <= b) ? polyEval(c, x) : NaN; }
          });
        })(cortes[i], cortes[i + 1]);
      }
      dibuja(cv, {
        xmin: -5, xmax: 5, ymin: rg.ymin, ymax: rg.ymax,
        curvas: curvas,
        puntos: raices.map(function (r) {
          return { x: r, y: polyEval(c, r), etiqueta: 'x=' + num(r) };
        })
      });
    });
  });

  reg('extremos2', function (node) {
    var o = shell(node, 'Applet \u00b7 Extremos con la segunda derivada', [
      'El criterio de la segunda derivada evita construir la tabla de signos: ' +
        'basta evaluar ' + T("f''") + ' en cada punto critico.',
      'Si ' + T("f''(a)>0") + ' hay ' + key('minimo') + '. Si ' + T("f''(a)<0") +
        ' hay ' + key('maximo') + '. Si ' + T("f''(a)=0") + ' el criterio no decide.',
      'Prueba <code>x^3-3x</code> y compara con el applet anterior.',
      'Prueba <code>x^4</code>: aqui ' + T("f''(0)=0") + ' y el criterio falla, ' +
        'aunque hay minimo. Es el caso que hay que conocer.',
      'Prueba <code>x^3-6x^2+9x</code> y <code>-x^3+3x^2</code>.'
    ].concat(SINTAXIS));

    var cf = entrada('x^3-6x^2+9x');
    fila(o.ctr, 'f(x) =', cf);
    var cv = lienzo(720, 380);
    o.caja.insertBefore(cv, o.out);

    vivo([cf], function () {
      o.out.innerHTML = '';
      var c = leePoly(cf, o.out);
      if (!c) return;
      var d1 = polyDeriv(c), d2 = polyDeriv(d1);
      var crit = polyRaices(d1, -20, 20);

      paso(o.out, T('f(x)=' + polyTex(c)) + '<br>' +
        T("f'(x)=" + polyTex(d1)) + '<br>' + T("f''(x)=" + polyTex(d2)));

      if (!crit.length) {
        paso(o.out, 'Sin puntos criticos: la funcion es monotona y no tiene extremos relativos.');
      }
      var i, pts = [];
      for (i = 0; i < crit.length; i++) {
        var a = crit[i], v2 = polyEval(d2, a), y = polyEval(c, a);
        var txt = T("f''(" + num(a) + ')=' + num(v2)) + ' \u2192 ';
        var color = '#c0392b';
        if (Math.abs(v2) < 1e-9) {
          var iz = polyEval(d1, a - 0.01), de = polyEval(d1, a + 0.01);
          txt += 'el criterio ' + bad('no decide') + '. Volviendo al signo de ' + T("f'") + ': ';
          if (iz > 0 && de < 0) txt += key('maximo');
          else if (iz < 0 && de > 0) txt += key('minimo');
          else txt += key('no hay extremo');
        } else if (v2 > 0) { txt += key('minimo relativo'); color = '#1e8449'; }
        else { txt += key('maximo relativo'); }
        txt += ' en ' + T('(' + num(a) + ',\\ ' + num(y) + ')');
        paso(o.out, txt);
        pts.push({ x: a, y: y, color: color, etiqueta: 'x=' + num(a) });
      }

      var rg = rangoY(function (x) { return polyEval(c, x); }, -5, 6);
      dibuja(cv, {
        xmin: -5, xmax: 6, ymin: rg.ymin, ymax: rg.ymax,
        curvas: [{ f: function (x) { return polyEval(c, x); }, color: '#1f6feb' }],
        puntos: pts
      });
    });
  });

  reg('trescurvas', function (node) {
    var o = shell(node, 'Applet \u00b7 Comparador de f, f prima y f segunda', [
      'Las tres graficas comparten el eje horizontal, asi que puedes leer ' +
        'en vertical que le pasa a cada una en el mismo valor de ' + T('x') + '.',
      'Fijate en la regla clave: donde ' + T("f'") + ' cruza el cero, ' + T('f') +
        ' tiene un pico o un valle.',
      'Y en la segunda: donde ' + T("f''") + ' cruza el cero, ' + T('f') +
        ' cambia de curvatura.',
      'Prueba <code>x^3-3x</code>, <code>x^4-2x^2</code> y <code>x^3</code>.'
    ].concat(SINTAXIS));

    var cf = entrada('x^4-2x^2');
    fila(o.ctr, 'f(x) =', cf);
    var c1 = lienzo(720, 200), c2 = lienzo(720, 200), c3 = lienzo(720, 200);
    o.caja.insertBefore(c1, o.out);
    o.caja.insertBefore(c2, o.out);
    o.caja.insertBefore(c3, o.out);

    vivo([cf], function () {
      o.out.innerHTML = '';
      var c = leePoly(cf, o.out);
      if (!c) return;
      var d1 = polyDeriv(c), d2 = polyDeriv(d1);
      var xr = 3;

      var pinta = function (cv, coef, color, etiqueta) {
        var rg = rangoY(function (x) { return polyEval(coef, x); }, -xr, xr);
        dibuja(cv, {
          xmin: -xr, xmax: xr, ymin: rg.ymin, ymax: rg.ymax,
          curvas: [{ f: function (x) { return polyEval(coef, x); }, color: color }],
          puntos: polyRaices(coef, -xr, xr).map(function (r) {
            return { x: r, y: 0, color: color, etiqueta: '' };
          })
        });
        paso(o.out, etiqueta);
      };

      paso(o.out, 'Arriba ' + chip('f') + ', en medio ' + chip("f'") +
        ', abajo ' + chip("f''") + '. Los puntos marcan los ceros de cada una.');
      pinta(c1, c, '#1f6feb', T('f(x)=' + polyTex(c)));
      pinta(c2, d1, '#1e8449', T("f'(x)=" + polyTex(d1)));
      pinta(c3, d2, '#8e44ad', T("f''(x)=" + polyTex(d2)));
    });
  });

  reg('partes', function (node) {
    var o = shell(node, 'Applet \u00b7 Monotonia de una funcion definida por partes', [
      'Escribe dos ramas polinomicas y el punto donde se separan. El applet ' +
        'estudia la monotonia en cada trozo por separado.',
      'Ademas comprueba si las dos ramas ' + key('empalman') +
        ', comparando los valores laterales en el punto de corte.',
      'Prueba rama izquierda <code>x^2</code>, rama derecha <code>2x-1</code> y corte <code>1</code>: ' +
        'empalman y tambien coinciden las pendientes.',
      'Prueba <code>x^2</code> y <code>-x+3</code> con corte <code>1</code>: ' +
        'empalman en el valor pero no en la pendiente, y ahi no hay derivada.'
    ].concat(SINTAXIS));

    var ci = entrada('x^2', true), cd = entrada('2x-1', true), cc = entrada('1', true);
    fila(o.ctr, 'rama izquierda, para x < c', ci);
    fila(o.ctr, 'rama derecha, para x \u2265 c', cd);
    fila(o.ctr, 'punto de corte c =', cc);
    var cv = lienzo(720, 360);
    o.caja.insertBefore(cv, o.out);

    vivo([ci, cd, cc], function () {
      o.out.innerHTML = '';
      var pi = leePoly(ci, o.out); if (!pi) return;
      var pd = leePoly(cd, o.out); if (!pd) return;
      var c0 = parseFloat(cc.value);
      if (!isFinite(c0)) { paso(o.out, 'El punto de corte debe ser un numero.', true); return; }

      var vi = polyEval(pi, c0), vd = polyEval(pd, c0);
      var di = polyDeriv(pi), dd = polyDeriv(pd);
      var mi = polyEval(di, c0), md = polyEval(dd, c0);

      paso(o.out, 'Rama izquierda: ' + T('f(x)=' + polyTex(pi)) +
        ', con derivada ' + T(polyTex(di)));
      paso(o.out, 'Rama derecha: ' + T('f(x)=' + polyTex(pd)) +
        ', con derivada ' + T(polyTex(dd)));

      if (Math.abs(vi - vd) < 1e-9) {
        paso(o.out, ok('Las ramas empalman') + ': los dos valores en ' +
          T('x=' + num(c0)) + ' coinciden y valen ' + T(num(vi)) + '.');
        if (Math.abs(mi - md) < 1e-9) {
          paso(o.out, ok('Y las pendientes tambien coinciden') + ', ' +
            T(num(mi)) + ' por los dos lados, asi que la funcion ' +
            key('es derivable') + ' en el punto de corte.');
        } else {
          paso(o.out, bad('Pero las pendientes no coinciden') + ': ' +
            T(num(mi)) + ' por la izquierda y ' + T(num(md)) + ' por la derecha. ' +
            'La funcion es continua pero ' + key('no derivable') +
            ' ahi: hay un pico.', true);
        }
      } else {
        paso(o.out, bad('Las ramas no empalman') + ': ' + T(num(vi)) +
          ' por la izquierda y ' + T(num(vd)) + ' por la derecha. ' +
          'Hay un ' + key('salto') + ', asi que no es continua ni derivable.', true);
      }

      var rzi = polyRaices(di, -8, c0), rzd = polyRaices(dd, c0, 8);
      paso(o.out, 'En la rama izquierda, ' + T("f'") + ' se anula en ' +
        (rzi.length ? rzi.map(function (r) { return T('x=' + num(r)); }).join(', ') : 'ningun punto del tramo') + '.');
      paso(o.out, 'En la rama derecha, ' + T("f'") + ' se anula en ' +
        (rzd.length ? rzd.map(function (r) { return T('x=' + num(r)); }).join(', ') : 'ningun punto del tramo') + '.');

      var F = function (x) { return x < c0 ? polyEval(pi, x) : polyEval(pd, x); };
      var rg = rangoY(F, -4, 4);
      dibuja(cv, {
        xmin: -4, xmax: 4, ymin: rg.ymin, ymax: rg.ymax,
        curvas: [
          { f: function (x) { return x < c0 ? polyEval(pi, x) : NaN; }, color: '#1f6feb' },
          { f: function (x) { return x >= c0 ? polyEval(pd, x) : NaN; }, color: '#e67e22' }
        ],
        vlineas: [{ x: c0, color: '#999' }],
        puntos: [{ x: c0, y: vd, etiqueta: 'corte' }]
      });
    });
  });

  reg('optimiza', function (node) {
    var o = shell(node, 'Applet \u00b7 Problemas de optimizacion', [
      'Un problema de optimizacion se resuelve en tres pasos: escribir la ' +
        key('funcion objetivo') + ', derivar, y buscar donde se anula.',
      'Elige un problema y mueve el dato del enunciado. El applet plantea la ' +
        'funcion, la deriva y localiza el optimo.',
      'Observa que el punto donde la derivada se anula es siempre el mismo ' +
        'tipo de punto: el maximo o el minimo que pide el enunciado.'
    ]);

    var sel = selector([
      ['cerca', 'Rectangulo de area maxima con perimetro fijo'],
      ['caja', 'Caja sin tapa de volumen maximo a partir de una carton cuadrado'],
      ['coste', 'Coste minimo de produccion'],
      ['suma', 'Dos numeros de suma fija y producto maximo']
    ]);
    var dato = entrada('20', true);
    fila(o.ctr, 'problema', sel);
    fila(o.ctr, 'dato del enunciado', dato);
    var cv = lienzo(720, 360);
    o.caja.insertBefore(cv, o.out);

    vivo([sel, dato], function () {
      o.out.innerHTML = '';
      var p = parseFloat(dato.value);
      if (!isFinite(p) || p <= 0) { paso(o.out, 'El dato debe ser un numero positivo.', true); return; }
      var tipo = sel.value, coef, enun, varn, xmin = 0, xmax = p, extra = '';

      if (tipo === 'cerca') {
        enun = 'Un rectangulo tiene perimetro ' + T('P=' + num(p)) +
          '. Si un lado mide ' + T('x') + ', el otro mide ' + T('\\dfrac{' + num(p) + '}{2}-x') + '.';
        coef = [0, p / 2, -1];
        varn = 'A(x)';
        xmax = p / 2;
        extra = 'El optimo sale siempre en el cuadrado: cuando los dos lados son iguales.';
      } else if (tipo === 'caja') {
        enun = 'De un carton cuadrado de lado ' + T(num(p)) +
          ' se recortan esquinas de lado ' + T('x') + ' y se dobla. La base mide ' +
          T(num(p) + '-2x') + ' y la altura ' + T('x') + '.';
        coef = [0, p * p, -4 * p, 4];
        varn = 'V(x)';
        xmax = p / 2;
        extra = 'El optimo esta siempre en ' + T('x=\\dfrac{L}{6}') + ', un sexto del lado.';
      } else if (tipo === 'coste') {
        enun = 'El coste de fabricar ' + T('x') + ' unidades es ' +
          T('C(x)=x^{2}-' + num(p) + 'x+' + num(p * p / 2)) + '. Buscamos el minimo.';
        coef = [p * p / 2, -p, 1];
        varn = 'C(x)';
        xmax = p * 1.5;
        extra = 'Aqui buscamos un minimo, no un maximo, pero el metodo es identico.';
      } else {
        enun = 'Dos numeros suman ' + T(num(p)) + '. Si uno es ' + T('x') +
          ', el otro es ' + T(num(p) + '-x') + ' y su producto es ' + T('x(' + num(p) + '-x)') + '.';
        coef = [0, p, -1];
        varn = 'P(x)';
        extra = 'El producto maximo se da siempre cuando los dos numeros son iguales.';
      }

      var d1 = polyDeriv(coef), d2 = polyDeriv(d1);
      var crit = polyRaices(d1, xmin - 1, xmax + 1).filter(function (r) {
        return r > xmin - 1e-9 && r < xmax + 1e-9;
      });

      paso(o.out, enun);
      paso(o.out, 'Funcion objetivo: ' + T(varn + '=' + polyTex(coef)));
      paso(o.out, 'Derivamos: ' + T(varn.charAt(0) + "'(x)=" + polyTex(d1)));

      var pts = [];
      if (!crit.length) {
        paso(o.out, 'La derivada no se anula dentro del intervalo con sentido fisico.', true);
      } else {
        var i;
        for (i = 0; i < crit.length; i++) {
          var a = crit[i], y = polyEval(coef, a), v2 = polyEval(d2, a);
          paso(o.out, 'Se anula en ' + T('x=' + num(a)) + '. Como ' +
            T(varn.charAt(0) + "''=" + num(v2)) + ', se trata de un ' +
            key(v2 < 0 ? 'maximo' : 'minimo') + ', con valor optimo ' +
            T(num(y)) + '.');
          pts.push({ x: a, y: y, etiqueta: 'optimo' });
        }
      }
      paso(o.out, '<span class="ap-note">' + extra + '</span>');

      var rg = rangoY(function (x) { return polyEval(coef, x); }, xmin, xmax);
      dibuja(cv, {
        xmin: xmin, xmax: xmax, ymin: rg.ymin, ymax: rg.ymax,
        curvas: [{ f: function (x) { return polyEval(coef, x); }, color: '#1f6feb' }],
        puntos: pts
      });
    });
  });

  /* ================================================================ */
  /* APPLETS DEL APARTADO 2: CONCAVIDAD Y CONVEXIDAD                  */
  /* ================================================================ */

  reg('curvatura', function (node) {
    var o = shell(node, 'Applet \u00b7 Curvatura y puntos de inflexion', [
      'La segunda derivada mide como gira la tangente. Si ' + T("f''>0") +
        ' la curva es ' + key('convexa') + ', con forma de valle. Si ' + T("f''<0") +
        ' es ' + key('concava') + ', con forma de loma.',
      'Donde ' + T("f''") + ' cambia de signo hay un ' + key('punto de inflexion') + '.',
      'Prueba <code>x^3</code>: inflexion en ' + T('x=0') + ', el caso mas limpio.',
      'Prueba <code>x^4-6x^2</code>: dos puntos de inflexion.',
      'Prueba <code>x^4</code>: aqui ' + T("f''(0)=0") + ' pero ' + bad('no') +
        ' hay inflexion, porque no cambia de signo. Anular la segunda derivada no basta.'
    ].concat(SINTAXIS));

    var cf = entrada('x^4-6x^2');
    fila(o.ctr, 'f(x) =', cf);
    var cv = lienzo(720, 380);
    o.caja.insertBefore(cv, o.out);

    vivo([cf], function () {
      o.out.innerHTML = '';
      var c = leePoly(cf, o.out);
      if (!c) return;
      var d1 = polyDeriv(c), d2 = polyDeriv(d1);
      var cand = polyRaices(d2, -20, 20);

      paso(o.out, T('f(x)=' + polyTex(c)) + '<br>' + T("f''(x)=" + polyTex(d2)));

      if (!cand.length) {
        paso(o.out, 'La segunda derivada no se anula: la curvatura no cambia en todo ' +
          T('\\mathbb{R}') + '.');
      }
      paso(o.out, tablaSignos(cand, function (x) { return polyEval(d2, x); },
        T("f''(x)"), ['forma', ok('convexa'), bad('concava')]));

      var i, pts = [];
      for (i = 0; i < cand.length; i++) {
        var a = cand[i];
        var iz = polyEval(d2, a - 0.01), de = polyEval(d2, a + 0.01);
        if (iz * de < 0) {
          paso(o.out, T('x=' + num(a)) + ' es ' + key('punto de inflexion') +
            ', porque la segunda derivada cambia de signo. El punto es ' +
            T('(' + num(a) + ',\\ ' + num(polyEval(c, a)) + ')') +
            ' y la pendiente ahi vale ' + T(num(polyEval(d1, a))) + '.');
          pts.push({ x: a, y: polyEval(c, a), color: '#8e44ad', etiqueta: 'inflexion' });
        } else {
          paso(o.out, 'En ' + T('x=' + num(a)) + ' la segunda derivada se anula ' +
            'pero ' + bad('no cambia de signo') + ', asi que ' + key('no') +
            ' es punto de inflexion.', true);
        }
      }

      var rg = rangoY(function (x) { return polyEval(c, x); }, -4, 4);
      dibuja(cv, {
        xmin: -4, xmax: 4, ymin: rg.ymin, ymax: rg.ymax,
        curvas: [{ f: function (x) { return polyEval(c, x); }, color: '#1f6feb' }],
        puntos: pts
      });
    });
  });

  reg('tangentecurva', function (node) {
    var o = shell(node, 'Applet \u00b7 La tangente por encima o por debajo', [
      'Aqui se ve por que las palabras concava y convexa significan lo que ' +
        'significan. Mueve el punto y observa donde queda la recta tangente.',
      'Si la curva es ' + key('convexa') + ', la tangente queda ' + ok('por debajo') + '.',
      'Si es ' + key('concava') + ', la tangente queda ' + bad('por encima') + '.',
      'En un punto de inflexion la tangente ' + key('atraviesa') + ' la curva.',
      'Prueba <code>x^3</code> con el punto en <code>0</code>: es el caso de la tangente que cruza.'
    ].concat(SINTAXIS));

    var cf = entrada('x^3-3x', true), ca = entrada('1', true);
    fila(o.ctr, 'f(x) =', cf);
    fila(o.ctr, 'punto a =', ca);
    var cv = lienzo(720, 380);
    o.caja.insertBefore(cv, o.out);

    vivo([cf, ca], function () {
      o.out.innerHTML = '';
      var c = leePoly(cf, o.out); if (!c) return;
      var a = parseFloat(ca.value);
      if (!isFinite(a)) { paso(o.out, 'El punto debe ser un numero.', true); return; }
      var d1 = polyDeriv(c), d2 = polyDeriv(d1);
      var y0 = polyEval(c, a), m = polyEval(d1, a), v2 = polyEval(d2, a);

      paso(o.out, 'Punto de tangencia: ' + T('(' + num(a) + ',\\ ' + num(y0) + ')') +
        ', pendiente ' + T("f'(" + num(a) + ')=' + num(m)) + '.');
      paso(o.out, 'Recta tangente: ' + T('y=' + num(y0) + (m >= 0 ? '+' : '') + num(m) +
        '(x-' + num(a) + ')'));
      if (Math.abs(v2) < 1e-9) {
        paso(o.out, T("f''(" + num(a) + ')=0') + '. Si ademas cambia de signo, ' +
          'estas en un ' + key('punto de inflexion') + ' y la tangente cruza la curva.');
      } else if (v2 > 0) {
        paso(o.out, T("f''(" + num(a) + ')=' + num(v2)) + ' es positiva: la curva es ' +
          key('convexa') + ' aqui y la tangente queda ' + ok('por debajo') + '.');
      } else {
        paso(o.out, T("f''(" + num(a) + ')=' + num(v2)) + ' es negativa: la curva es ' +
          key('concava') + ' aqui y la tangente queda ' + bad('por encima') + '.');
      }

      var rg = rangoY(function (x) { return polyEval(c, x); }, -4, 4);
      dibuja(cv, {
        xmin: -4, xmax: 4, ymin: rg.ymin, ymax: rg.ymax,
        curvas: [{ f: function (x) { return polyEval(c, x); }, color: '#1f6feb' }],
        rectas: [{ m: m, b: y0 - m * a, color: '#e67e22' }],
        puntos: [{ x: a, y: y0, etiqueta: 'a=' + num(a) }]
      });
    });
  });

  /* ================================================================ */
  /* APPLETS DEL APARTADO 3: REPRESENTACION, PASO A PASO              */
  /* ================================================================ */

  reg('guion', function (node) {
    var o = shell(node, 'Applet \u00b7 El guion completo de representacion', [
      'Este applet recorre el guion entero sobre la funcion que escribas, ' +
        'en el mismo orden que debes seguir en el examen.',
      'Acepta polinomios y funciones racionales: <code>x^3-3x</code> o ' +
        '<code>(x^2+1)/(x-1)</code>.',
      'Ve marcando los apartados y comparalos con lo que habias deducido tu.',
      'Prueba <code>(x^2)/(x^2-1)</code>, que tiene simetria par, dos asintotas ' +
        'verticales y una horizontal.'
    ].concat(SINTAXIS));

    var cf = entrada('(x^2)/(x^2-1)');
    fila(o.ctr, 'f(x) =', cf);
    var cv = lienzo(720, 400);
    o.caja.insertBefore(cv, o.out);

    vivo([cf], function () {
      o.out.innerHTML = '';
      var f = leeRac(cf, o.out); if (!f) return;
      var F = function (x) { return racEval(f, x); };
      var polos = polyRaices(f.d, -30, 30);
      var esPoli = (f.d.length === 1);

      paso(o.out, '<b>Funcion.</b> ' + T('f(x)=' + racTex(f)));

      /* 1. Dominio. */
      if (esPoli) {
        paso(o.out, '<b>1. Dominio.</b> Es un polinomio, asi que ' +
          T('\\mathrm{Dom}(f)=\\mathbb{R}') + '.');
      } else if (!polos.length) {
        paso(o.out, '<b>1. Dominio.</b> El denominador no se anula nunca, luego ' +
          T('\\mathrm{Dom}(f)=\\mathbb{R}') + '.');
      } else {
        paso(o.out, '<b>1. Dominio.</b> El denominador se anula en ' +
          polos.map(function (r) { return T('x=' + num(r)); }).join(', ') +
          ', asi que hay que excluir esos valores.');
      }

      /* 2. Cortes con los ejes. */
      var ceros = polyRaices(f.n, -30, 30).filter(function (r) {
        return Math.abs(polyEval(f.d, r)) > 1e-9;
      });
      var y0 = F(0);
      paso(o.out, '<b>2. Cortes.</b> Con el eje ' + T('X') + ': ' +
        (ceros.length ? ceros.map(function (r) { return T('(' + num(r) + ',0)'); }).join(', ')
                      : 'no corta') +
        '. Con el eje ' + T('Y') + ': ' +
        (isFinite(y0) ? T('(0,\\ ' + num(y0) + ')') : 'no corta, porque 0 no esta en el dominio') + '.');

      /* 3. Simetria. */
      var par = true, impar = true, i, xs = [0.7, 1.3, 2.1, 3.4];
      for (i = 0; i < xs.length; i++) {
        var v1 = F(xs[i]), v2 = F(-xs[i]);
        if (!isFinite(v1) || !isFinite(v2)) continue;
        if (Math.abs(v1 - v2) > 1e-7) par = false;
        if (Math.abs(v1 + v2) > 1e-7) impar = false;
      }
      paso(o.out, '<b>3. Simetria.</b> ' +
        (par ? 'Es ' + key('par') + ', simetrica respecto del eje ' + T('Y') + '.'
             : (impar ? 'Es ' + key('impar') + ', simetrica respecto del origen.'
                      : 'No tiene simetria par ni impar.')));

      /* 4. Asintotas. */
      var asin = [], vl = [], hl = [], rc = [];
      if (!esPoli) {
        for (i = 0; i < polos.length; i++) {
          if (Math.abs(polyEval(f.n, polos[i])) > 1e-9) {
            asin.push('vertical en ' + T('x=' + num(polos[i])));
            vl.push({ x: polos[i] });
          }
        }
        var gn = polyGrado(f.n), gd = polyGrado(f.d);
        if (gn < gd) {
          asin.push('horizontal ' + T('y=0'));
          hl.push({ y: 0 });
        } else if (gn === gd) {
          var L = f.n[gn] / f.d[gd];
          asin.push('horizontal ' + T('y=' + num(L)));
          hl.push({ y: L });
        } else if (gn === gd + 1) {
          var dv = polyDiv(f.n, f.d);
          var m = dv.q[1] || 0, b = dv.q[0] || 0;
          asin.push('oblicua ' + T('y=' + num(m) + 'x' + (b >= 0 ? '+' : '') + num(b)));
          rc.push({ m: m, b: b });
        } else {
          asin.push('sin asintota horizontal ni oblicua, porque el numerador ' +
            'supera al denominador en mas de un grado');
        }
      }
      paso(o.out, '<b>4. Asintotas.</b> ' + (asin.length ? asin.join('; ') + '.'
        : 'Un polinomio no tiene asintotas.'));

      /* 5. Monotonia. */
      var df = racDeriv(f);
      var crit = polyRaices(df.n, -30, 30).filter(function (r) {
        return Math.abs(polyEval(f.d, r)) > 1e-9;
      });
      paso(o.out, '<b>5. Monotonia.</b> ' + T("f'(x)=" + racTex(df)) +
        '. Se anula en ' + (crit.length ? crit.map(function (r) { return T('x=' + num(r)); }).join(', ')
                                        : 'ningun punto') + '.');
      var partes1 = crit.concat(polos);
      paso(o.out, tablaSignos(partes1, function (x) {
        var dd = polyEval(df.d, x);
        return Math.abs(dd) < 1e-14 ? 0 : polyEval(df.n, x) / dd;
      }, T("f'(x)"), ['f(x)', ok('crece'), bad('decrece')]));

      var pts = [];
      for (i = 0; i < crit.length; i++) {
        var a2 = crit[i];
        var iz = polyEval(df.n, a2 - 0.01) / polyEval(df.d, a2 - 0.01);
        var de = polyEval(df.n, a2 + 0.01) / polyEval(df.d, a2 + 0.01);
        var tp = (iz > 0 && de < 0) ? 'maximo' : ((iz < 0 && de > 0) ? 'minimo' : 'ni maximo ni minimo');
        paso(o.out, '&nbsp;&nbsp;En ' + T('x=' + num(a2)) + ' hay ' + key(tp) +
          ', con ' + T('f(' + num(a2) + ')=' + num(F(a2))));
        pts.push({ x: a2, y: F(a2), etiqueta: tp });
      }

      /* 6. Curvatura, solo si es polinomio, para no cargar la salida. */
      if (esPoli) {
        var d2 = polyDeriv(polyDeriv(f.n));
        var infl = polyRaices(d2, -30, 30).filter(function (r) {
          return polyEval(d2, r - 0.01) * polyEval(d2, r + 0.01) < 0;
        });
        paso(o.out, '<b>6. Curvatura.</b> ' + T("f''(x)=" + polyTex(d2)) +
          '. Puntos de inflexion: ' +
          (infl.length ? infl.map(function (r) { return T('x=' + num(r)); }).join(', ') : 'ninguno') + '.');
        for (i = 0; i < infl.length; i++) {
          pts.push({ x: infl[i], y: F(infl[i]), color: '#8e44ad', etiqueta: 'inflexion' });
        }
      }

      paso(o.out, '<b>7. Grafica.</b> Con todo lo anterior ya se puede dibujar. ' +
        'Compara tu esbozo con el de abajo.');

      var xr = 5;
      var rg = rangoY(F, -xr, xr);
      dibuja(cv, {
        xmin: -xr, xmax: xr, ymin: rg.ymin, ymax: rg.ymax,
        curvas: [{ f: F, color: '#1f6feb' }],
        vlineas: vl, hlineas: hl, rectas: rc, puntos: pts
      });
    });
  });

  reg('reconstruye', function (node) {
    var o = shell(node, 'Applet \u00b7 Dibujar a partir de las caracteristicas', [
      'Aqui se invierte el ejercicio: no partes de la formula, sino de una ' +
        'lista de condiciones, y tienes que imaginar la grafica.',
      'Elige un reto, piensa tu esbozo en papel, y solo entonces pulsa ' +
        chip('mostrar') + ' para comparar.',
      'Es el ejercicio que mas aparece en los examenes con el enunciado ' +
        '«dibuja una funcion que cumpla...».'
    ]);

    var retos = [
      { n: 'Creciente siempre, sin extremos', f: 'x^3+2x',
        c: ['El dominio es todo ' + T('\\mathbb{R}'),
            T("f'(x)>0") + ' para todo ' + T('x'),
            'Corta a los ejes en el origen'] },
      { n: 'Un maximo y un minimo', f: 'x^3-3x',
        c: ['Maximo relativo en ' + T('x=-1'),
            'Minimo relativo en ' + T('x=1'),
            'Punto de inflexion en ' + T('x=0'),
            'Simetrica respecto del origen'] },
      { n: 'Dos asintotas verticales y una horizontal', f: '(x^2)/(x^2-4)',
        c: ['Asintotas verticales en ' + T('x=-2') + ' y ' + T('x=2'),
            'Asintota horizontal ' + T('y=1'),
            'Minimo en el origen',
            'Simetrica respecto del eje ' + T('Y')] },
      { n: 'Con asintota oblicua', f: '(x^2+1)/x',
        c: ['Dominio ' + T('\\mathbb{R}-\\{0\\}'),
            'Asintota vertical ' + T('x=0'),
            'Asintota oblicua ' + T('y=x'),
            'Minimo en ' + T('x=1') + ' y maximo en ' + T('x=-1'),
            'No corta a los ejes'] }
    ];

    var sel = selector(retos.map(function (r, i) { return [String(i), r.n]; }));
    var btn = boton('mostrar la grafica');
    fila(o.ctr, 'reto', sel);
    fila(o.ctr, '', btn);
    var cv = lienzo(720, 380);
    cv.style.display = 'none';
    o.caja.insertBefore(cv, o.out);

    var pinta = function (mostrar) {
      o.out.innerHTML = '';
      var R = retos[parseInt(sel.value, 10)];
      paso(o.out, '<b>Condiciones que debe cumplir.</b>');
      var i;
      for (i = 0; i < R.c.length; i++) paso(o.out, '&nbsp;&nbsp;\u2022 ' + R.c[i]);
      if (!mostrar) {
        cv.style.display = 'none';
        paso(o.out, '<span class="ap-note">Dibuja tu esbozo en papel antes de pulsar el boton.</span>');
        return;
      }
      var f = parseRac(R.f);
      var F = function (x) { return racEval(f, x); };
      var rg = rangoY(F, -5, 5);
      var polos = polyRaices(f.d, -20, 20);
      cv.style.display = 'block';
      dibuja(cv, {
        xmin: -5, xmax: 5, ymin: rg.ymin, ymax: rg.ymax,
        curvas: [{ f: F, color: '#1f6feb' }],
        vlineas: polos.map(function (p) { return { x: p }; })
      });
      paso(o.out, 'Una funcion que las cumple es ' + T('f(x)=' + racTex(f)) +
        '. No es la unica: cualquier grafica con esas caracteristicas vale.');
    };

    sel.addEventListener('change', function () { pinta(false); });
    btn.addEventListener('click', function () { pinta(true); });
    pinta(false);
  });

  /* ================================================================ */
  /* APPLETS DEL APARTADO 4: FUNCIONES POLINOMICAS                    */
  /* ================================================================ */

  reg('repoli', function (node) {
    var o = shell(node, 'Applet \u00b7 Representacion de funciones polinomicas', [
      'Un polinomio no tiene asintotas ni puntos excluidos del dominio, ' +
        'asi que el guion se reduce a cuatro cosas: cortes, ramas infinitas, ' +
        'extremos y curvatura.',
      'El applet resuelve las cuatro y las explica en orden.',
      'Prueba <code>x^3-3x^2+2</code>, <code>x^4-2x^2</code>, <code>-x^3+3x</code>.',
      'Fijate en como el ' + key('grado') + ' y el ' + key('signo del coeficiente principal') +
        ' deciden por si solos hacia donde se van las ramas.'
    ].concat(SINTAXIS));

    var cf = entrada('x^3-3x^2+2');
    fila(o.ctr, 'f(x) =', cf);
    var cv = lienzo(720, 400);
    o.caja.insertBefore(cv, o.out);

    vivo([cf], function () {
      o.out.innerHTML = '';
      var c = leePoly(cf, o.out); if (!c) return;
      var g = polyGrado(c), ap = c[g];
      var d1 = polyDeriv(c), d2 = polyDeriv(d1);

      paso(o.out, T('f(x)=' + polyTex(c)) + ', de grado ' + key(String(g)) +
        ' y coeficiente principal ' + key(num(ap)) + '.');

      var ceros = polyRaices(c, -30, 30);
      paso(o.out, '<b>Cortes con los ejes.</b> Con ' + T('X') + ': ' +
        (ceros.length ? ceros.map(function (r) { return T('(' + num(r) + ',0)'); }).join(', ')
                      : 'no corta') + '. Con ' + T('Y') + ': ' + T('(0,\\ ' + num(c[0]) + ')') + '.');

      var izq, der;
      if (g % 2 === 0) { izq = der = (ap > 0 ? '+\\infty' : '-\\infty'); }
      else { izq = (ap > 0 ? '-\\infty' : '+\\infty'); der = (ap > 0 ? '+\\infty' : '-\\infty'); }
      paso(o.out, '<b>Ramas infinitas.</b> Como el grado es ' +
        (g % 2 === 0 ? 'par' : 'impar') + ' y el coeficiente principal es ' +
        (ap > 0 ? 'positivo' : 'negativo') + ': ' +
        T('\\lim_{x\\to-\\infty}f(x)=' + izq) + ' y ' +
        T('\\lim_{x\\to+\\infty}f(x)=' + der) + '.');

      var crit = polyRaices(d1, -30, 30);
      paso(o.out, '<b>Extremos.</b> ' + T("f'(x)=" + polyTex(d1)) + '.');
      var pts = [], i;
      for (i = 0; i < crit.length; i++) {
        var a = crit[i], v2 = polyEval(d2, a);
        var tp = Math.abs(v2) < 1e-9
          ? (polyEval(d1, a - 0.01) * polyEval(d1, a + 0.01) < 0 ? 'extremo' : 'tangente horizontal sin extremo')
          : (v2 > 0 ? 'minimo' : 'maximo');
        paso(o.out, '&nbsp;&nbsp;' + T('x=' + num(a)) + ': ' + key(tp) + ', ' +
          T('f(' + num(a) + ')=' + num(polyEval(c, a))));
        pts.push({ x: a, y: polyEval(c, a), etiqueta: tp });
      }
      if (!crit.length) paso(o.out, '&nbsp;&nbsp;No hay extremos: la funcion es monotona.');

      var infl = polyRaices(d2, -30, 30).filter(function (r) {
        return polyEval(d2, r - 0.01) * polyEval(d2, r + 0.01) < 0;
      });
      paso(o.out, '<b>Curvatura.</b> ' + T("f''(x)=" + polyTex(d2)) + '.');
      paso(o.out, tablaSignos(infl, function (x) { return polyEval(d2, x); },
        T("f''(x)"), ['forma', ok('convexa'), bad('concava')]));
      for (i = 0; i < infl.length; i++) {
        pts.push({ x: infl[i], y: polyEval(c, infl[i]), color: '#8e44ad', etiqueta: 'inflexion' });
      }

      var rg = rangoY(function (x) { return polyEval(c, x); }, -4, 4);
      dibuja(cv, {
        xmin: -4, xmax: 4, ymin: rg.ymin, ymax: rg.ymax,
        curvas: [{ f: function (x) { return polyEval(c, x); }, color: '#1f6feb' }],
        puntos: pts
      });
    });
  });

  reg('familia', function (node) {
    var o = shell(node, 'Applet \u00b7 Familia de cubicas', [
      'Mueve los coeficientes de ' + T('f(x)=ax^{3}+bx^{2}+cx+d') +
        ' y observa como cambia la forma.',
      'Sube y baja ' + T('a') + ': el signo decide hacia donde se van las ramas.',
      'Con ' + T('b=c=0') + ' la cubica es simetrica respecto del origen.',
      'Busca valores donde la cubica pase de tener dos extremos a no tener ' +
        'ninguno. Ocurre cuando ' + T('b^{2}-3ac') + ' cambia de signo.'
    ]);

    var ca = entrada('1', true), cb = entrada('0', true),
        cc = entrada('-3', true), cd = entrada('0', true);
    fila(o.ctr, 'a =', ca);
    fila(o.ctr, 'b =', cb);
    fila(o.ctr, 'c =', cc);
    fila(o.ctr, 'd =', cd);
    var cv = lienzo(720, 380);
    o.caja.insertBefore(cv, o.out);

    vivo([ca, cb, cc, cd], function () {
      o.out.innerHTML = '';
      var a = parseFloat(ca.value), b = parseFloat(cb.value),
          c2 = parseFloat(cc.value), d = parseFloat(cd.value);
      if (!isFinite(a) || !isFinite(b) || !isFinite(c2) || !isFinite(d)) {
        paso(o.out, 'Los cuatro coeficientes deben ser numeros.', true); return;
      }
      var P = [d, c2, b, a];
      while (P.length > 1 && P[P.length - 1] === 0) P.pop();
      var d1 = polyDeriv(P);
      var disc = b * b - 3 * a * c2;

      paso(o.out, T('f(x)=' + polyTex(P)));
      paso(o.out, T("f'(x)=" + polyTex(d1)));
      if (a === 0) {
        paso(o.out, 'Con ' + T('a=0') + ' ya no es una cubica.', true);
      } else if (disc > 1e-9) {
        paso(o.out, T('b^{2}-3ac=' + num(disc)) + ' es positivo: hay ' +
          key('dos extremos') + ', un maximo y un minimo.');
      } else if (Math.abs(disc) < 1e-9) {
        paso(o.out, T('b^{2}-3ac=0') + ': los dos extremos se juntan en uno solo, ' +
          'con ' + key('tangente horizontal') + ' pero sin cambio de crecimiento.');
      } else {
        paso(o.out, T('b^{2}-3ac=' + num(disc)) + ' es negativo: ' +
          key('no hay extremos') + ' y la funcion es monotona.');
      }
      var crit = polyRaices(d1, -20, 20);
      var rg = rangoY(function (x) { return polyEval(P, x); }, -4, 4);
      dibuja(cv, {
        xmin: -4, xmax: 4, ymin: rg.ymin, ymax: rg.ymax,
        curvas: [{ f: function (x) { return polyEval(P, x); }, color: '#1f6feb' }],
        puntos: crit.map(function (r) { return { x: r, y: polyEval(P, r), etiqueta: '' }; })
      });
    });
  });

  /* ================================================================ */
  /* APPLETS DEL APARTADO 5: FUNCIONES RACIONALES                     */
  /* ================================================================ */

  reg('asintotas', function (node) {
    var o = shell(node, 'Applet \u00b7 Buscador de asintotas', [
      'Escribe una funcion racional y el applet localiza las tres clases ' +
        'de asintota, explicando de donde sale cada una.',
      'Las ' + key('verticales') + ' salen de los ceros del denominador que ' +
        'no anulan tambien el numerador.',
      'La ' + key('horizontal') + ' o la ' + key('oblicua') +
        ' se deciden comparando los grados del numerador y del denominador.',
      'Prueba <code>(x^2-1)/(x-2)</code>: grado 2 sobre grado 1, sale oblicua.',
      'Prueba <code>(2x+1)/(x-3)</code>: grados iguales, horizontal en el cociente ' +
        'de los coeficientes principales.',
      'Prueba <code>(x-1)/(x^2-1)</code>: cuidado, en ' + T('x=1') +
        ' se anulan los dos y ' + bad('no') + ' hay asintota, solo un hueco.'
    ].concat(SINTAXIS));

    var cf = entrada('(x^2-1)/(x-2)');
    fila(o.ctr, 'f(x) =', cf);
    var cv = lienzo(720, 400);
    o.caja.insertBefore(cv, o.out);

    vivo([cf], function () {
      o.out.innerHTML = '';
      var f = leeRac(cf, o.out); if (!f) return;
      var F = function (x) { return racEval(f, x); };
      var gn = polyGrado(f.n), gd = polyGrado(f.d);
      var polos = polyRaices(f.d, -30, 30);
      var vl = [], hl = [], rc = [], i;

      paso(o.out, T('f(x)=' + racTex(f)) + ', con numerador de grado ' + key(String(gn)) +
        ' y denominador de grado ' + key(String(gd)) + '.');

      if (!polos.length) {
        paso(o.out, '<b>Verticales.</b> El denominador no se anula nunca, luego no hay.');
      } else {
        for (i = 0; i < polos.length; i++) {
          var p = polos[i];
          if (Math.abs(polyEval(f.n, p)) > 1e-9) {
            var izq = F(p - 0.001), der = F(p + 0.001);
            paso(o.out, '<b>Vertical</b> en ' + T('x=' + num(p)) +
              '. Por la izquierda la funcion se va a ' +
              T(izq > 0 ? '+\\infty' : '-\\infty') + ' y por la derecha a ' +
              T(der > 0 ? '+\\infty' : '-\\infty') + '.');
            vl.push({ x: p });
          } else {
            paso(o.out, 'En ' + T('x=' + num(p)) + ' se anulan numerador y ' +
              'denominador a la vez: no hay asintota, solo un ' + key('hueco') +
              ' en la grafica.', true);
          }
        }
      }

      if (gn < gd) {
        paso(o.out, '<b>Horizontal.</b> El grado de arriba es menor, asi que la ' +
          'funcion tiende a cero: ' + T('y=0') + '.');
        hl.push({ y: 0 });
      } else if (gn === gd) {
        var L = f.n[gn] / f.d[gd];
        paso(o.out, '<b>Horizontal.</b> Los grados son iguales, asi que la asintota ' +
          'es el cociente de los coeficientes principales: ' + T('y=' + num(L)) + '.');
        hl.push({ y: L });
      } else if (gn === gd + 1) {
        var dv = polyDiv(f.n, f.d);
        var m = dv.q[1] || 0, b2 = dv.q[0] || 0;
        paso(o.out, '<b>Oblicua.</b> El numerador supera al denominador en un grado. ' +
          'Dividiendo se obtiene ' + T('y=' + num(m) + 'x' + (b2 >= 0 ? '+' : '') + num(b2)) +
          ', y el resto ' + T(polyTex(dv.r)) + ' se hace despreciable al alejarse.');
        rc.push({ m: m, b: b2 });
      } else {
        paso(o.out, '<b>Ni horizontal ni oblicua.</b> El numerador supera al ' +
          'denominador en ' + key(String(gn - gd)) + ' grados, y las ramas crecen ' +
          'mas rapido que cualquier recta.');
      }

      var rg = rangoY(F, -6, 6);
      dibuja(cv, {
        xmin: -6, xmax: 6, ymin: rg.ymin, ymax: rg.ymax,
        curvas: [{ f: F, color: '#1f6feb' }],
        vlineas: vl, hlineas: hl, rectas: rc
      });
    });
  });

  reg('reprac', function (node) {
    var o = shell(node, 'Applet \u00b7 Representacion de funciones racionales', [
      'El guion completo aplicado a un cociente de polinomios, que es el tipo ' +
        'de funcion que mas aparece en los examenes de este tema.',
      'Sigue el orden: dominio, cortes, simetria, asintotas, monotonia y grafica.',
      'Prueba <code>(x^2+1)/x</code>, la mas clasica: asintota vertical en cero, ' +
        'oblicua ' + T('y=x') + ', un maximo y un minimo.',
      'Prueba <code>1/(x^2-4)</code>, <code>(x)/(x^2+1)</code> y ' +
        '<code>(x^2-4)/(x^2-1)</code>.'
    ].concat(SINTAXIS));

    var cf = entrada('(x^2+1)/x');
    fila(o.ctr, 'f(x) =', cf);
    var cv = lienzo(720, 400);
    o.caja.insertBefore(cv, o.out);

    vivo([cf], function () {
      o.out.innerHTML = '';
      var f = leeRac(cf, o.out); if (!f) return;
      if (f.d.length === 1) {
        paso(o.out, 'Eso es un polinomio, no una funcion racional. Usa una barra, ' +
          'por ejemplo <code>(x^2+1)/x</code>.', true);
      }
      var F = function (x) { return racEval(f, x); };
      var polos = polyRaices(f.d, -30, 30);
      var gn = polyGrado(f.n), gd = polyGrado(f.d);

      paso(o.out, '<b>Dominio.</b> ' + (polos.length
        ? T('\\mathbb{R}-\\{' + polos.map(num).join(',\\ ') + '\\}')
        : T('\\mathbb{R}')));

      var ceros = polyRaices(f.n, -30, 30).filter(function (r) {
        return Math.abs(polyEval(f.d, r)) > 1e-9;
      });
      var v0 = F(0);
      paso(o.out, '<b>Cortes.</b> Eje ' + T('X') + ': ' +
        (ceros.length ? ceros.map(function (r) { return T('(' + num(r) + ',0)'); }).join(', ') : 'ninguno') +
        '. Eje ' + T('Y') + ': ' + (isFinite(v0) ? T('(0,\\ ' + num(v0) + ')') : 'ninguno') + '.');

      var par = true, impar = true, i, xs = [0.6, 1.7, 2.9];
      for (i = 0; i < xs.length; i++) {
        var A = F(xs[i]), B = F(-xs[i]);
        if (!isFinite(A) || !isFinite(B)) continue;
        if (Math.abs(A - B) > 1e-7) par = false;
        if (Math.abs(A + B) > 1e-7) impar = false;
      }
      paso(o.out, '<b>Simetria.</b> ' + (par ? key('par') : (impar ? key('impar') : 'ninguna')));

      var vl = [], hl = [], rc = [], txt = [];
      for (i = 0; i < polos.length; i++) {
        if (Math.abs(polyEval(f.n, polos[i])) > 1e-9) {
          txt.push('vertical ' + T('x=' + num(polos[i])));
          vl.push({ x: polos[i] });
        }
      }
      if (gn < gd) { txt.push('horizontal ' + T('y=0')); hl.push({ y: 0 }); }
      else if (gn === gd) {
        var L = f.n[gn] / f.d[gd];
        txt.push('horizontal ' + T('y=' + num(L)));
        hl.push({ y: L });
      } else if (gn === gd + 1) {
        var dv = polyDiv(f.n, f.d);
        var m = dv.q[1] || 0, b2 = dv.q[0] || 0;
        txt.push('oblicua ' + T('y=' + num(m) + 'x' + (b2 >= 0 ? '+' : '') + num(b2)));
        rc.push({ m: m, b: b2 });
      }
      paso(o.out, '<b>Asintotas.</b> ' + (txt.length ? txt.join('; ') : 'ninguna'));

      var df = racDeriv(f);
      var crit = polyRaices(df.n, -30, 30).filter(function (r) {
        return Math.abs(polyEval(f.d, r)) > 1e-9;
      });
      paso(o.out, '<b>Monotonia.</b> ' + T("f'(x)=" + racTex(df)) +
        '. Como el denominador esta al cuadrado, ' + key('nunca es negativo') +
        ', asi que el signo de la derivada lo decide solo el numerador.');
      paso(o.out, tablaSignos(crit.concat(polos), function (x) {
        var dd = polyEval(df.d, x);
        return Math.abs(dd) < 1e-14 ? 0 : polyEval(df.n, x) / dd;
      }, T("f'(x)"), ['f(x)', ok('crece'), bad('decrece')]));

      var pts = [];
      for (i = 0; i < crit.length; i++) {
        var a = crit[i];
        var iz = polyEval(df.n, a - 0.01) / polyEval(df.d, a - 0.01);
        var de = polyEval(df.n, a + 0.01) / polyEval(df.d, a + 0.01);
        var tp = (iz > 0 && de < 0) ? 'maximo' : ((iz < 0 && de > 0) ? 'minimo' : 'sin extremo');
        paso(o.out, '&nbsp;&nbsp;' + T('x=' + num(a)) + ': ' + key(tp) + ', ' +
          T('f(' + num(a) + ')=' + num(F(a))));
        pts.push({ x: a, y: F(a), etiqueta: tp });
      }

      var rg = rangoY(F, -6, 6);
      dibuja(cv, {
        xmin: -6, xmax: 6, ymin: rg.ymin, ymax: rg.ymax,
        curvas: [{ f: F, color: '#1f6feb' }],
        vlineas: vl, hlineas: hl, rectas: rc, puntos: pts
      });
    });
  });

  reg('huecos', function (node) {
    var o = shell(node, 'Applet \u00b7 Asintota o hueco', [
      'Un cero del denominador no siempre produce una asintota. Si el ' +
        'numerador se anula en el mismo punto, lo que hay es un ' + key('hueco') + '.',
      'Cambia el numerador y observa la diferencia entre ' +
        '<code>(x-1)/(x^2-1)</code> y <code>(x+1)/(x^2-1)</code>.',
      'En el primero, ' + T('x=1') + ' da hueco y ' + T('x=-1') + ' da asintota.',
      'Es el error mas frecuente del tema: dar por asintota todo cero del denominador.'
    ].concat(SINTAXIS));

    var cf = entrada('(x-1)/(x^2-1)');
    fila(o.ctr, 'f(x) =', cf);
    var cv = lienzo(720, 360);
    o.caja.insertBefore(cv, o.out);

    vivo([cf], function () {
      o.out.innerHTML = '';
      var f = leeRac(cf, o.out); if (!f) return;
      var polos = polyRaices(f.d, -20, 20), i;
      if (!polos.length) {
        paso(o.out, 'El denominador no se anula: ni asintotas verticales ni huecos.');
      }
      var vl = [], pts = [];
      for (i = 0; i < polos.length; i++) {
        var p = polos[i], vn = polyEval(f.n, p);
        if (Math.abs(vn) > 1e-9) {
          paso(o.out, T('x=' + num(p)) + ': el numerador vale ' + T(num(vn)) +
            ', distinto de cero, luego hay ' + key('asintota vertical') + '.');
          vl.push({ x: p });
        } else {
          var lim = racEval(f, p + 1e-6);
          paso(o.out, T('x=' + num(p)) + ': se anulan los dos, luego hay ' +
            key('hueco') + '. La funcion se acerca al valor ' + T(num(lim)) +
            ' pero no esta definida ahi.');
          pts.push({ x: p, y: lim, color: '#8e44ad', etiqueta: 'hueco' });
        }
      }
      var F = function (x) { return racEval(f, x); };
      var rg = rangoY(F, -5, 5);
      dibuja(cv, {
        xmin: -5, xmax: 5, ymin: rg.ymin, ymax: rg.ymax,
        curvas: [{ f: F, color: '#1f6feb' }],
        vlineas: vl, puntos: pts
      });
    });
  });

  /* ---------------------------------------------------------------- */
  /* 9. BARRIDO Y ARRANQUE                                            */
  /* ---------------------------------------------------------------- */

  function boot() {
    var nodos = document.querySelectorAll('[data-applet-apl]');
    var total = 0, montados = 0;
    Array.prototype.forEach.call(nodos, function (node) {
      total++;
      if (node.getAttribute('data-apl-listo') === '1') { montados++; return; }
      var k = node.getAttribute('data-applet-apl');
      var fn = REG[k];
      if (typeof fn !== 'function') {
        node.innerHTML = '<div class="applet"><div class="ap-err">' +
          'No existe el applet <code>' + k + '</code>. ' +
          'Revisa la clave en el .qmd o el registro en apl-applets.js.</div></div>';
        node.setAttribute('data-apl-listo', '1');
        return;
      }
      try {
        fn(node);
        node.setAttribute('data-apl-listo', '1');
        montados++;
      } catch (e) {
        node.innerHTML = '<div class="applet"><div class="ap-err">' +
          'El applet <code>' + k + '</code> ha fallado al montarse: ' +
          e.message + '</div></div>';
        node.setAttribute('data-apl-listo', '1');
      }
    });
    console.info('[aplicaciones] applets en la pagina: ' + total + ', montados: ' + montados + '.');
  }

  window.APL = {
    reg: reg,
    boot: boot,
    core: {
      T: T, key: key, ok: ok, bad: bad, chip: chip, num: num,
      shell: shell, fila: fila, entrada: entrada, boton: boton,
      selector: selector, paso: paso, vivo: vivo,
      lienzo: lienzo, dibuja: dibuja, rangoY: rangoY,
      parsePoly: parsePoly, polyEval: polyEval, polyDeriv: polyDeriv,
      polyTex: polyTex, polyRaices: polyRaices, polyGrado: polyGrado,
      polyDiv: polyDiv, polyMul: polyMul, polySub: polySub,
      parseRac: parseRac, racEval: racEval, racTex: racTex, racDeriv: racDeriv,
      tablaSignos: tablaSignos, SINTAXIS: SINTAXIS
    }
  };

  console.info('[aplicaciones] apl-applets.js cargado: ' +
    Object.keys(REG).length + ' applets registrados.');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    setTimeout(boot, 0);
  }
})();
