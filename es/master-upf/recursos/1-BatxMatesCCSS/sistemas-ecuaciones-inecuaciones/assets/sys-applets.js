/* =====================================================================
   sys-applets.js — SISTEMAS DE ECUACIONES E INECUACIONES
   1r Batx Mates CCSS · notacion LaTeX compuesta por KaTeX

   REUTILIZACION
     · window.POLY  (tema de polinomios)  -> parse, sub, factorize...
     · assets/applets.css del tema de ecuaciones e inecuaciones
     · KaTeX + auto-render, igual que en el tema anterior

   INSERCION EN EL .qmd
     <div data-applet-sys="clave"></div>

   CLAVES
     sustitucion · igualacion · reduccion · grafico · discusion
     parametro   · gauss      · parabola  · conica  · radicales
     semiplano   · recinto    · optimiza  · diagnostico

   NOTA TECNICA
   La region factible de un recinto NO se dibuja muestreando pixeles.
   Se recorta el rectangulo de la ventana por cada semiplano con el
   algoritmo de Sutherland-Hodgman: es exacto, rapido y ademas devuelve
   los vertices del recinto, que es justo lo que interesa en clase.
   ===================================================================== */

(function () {
  'use strict';

  var SY = {};
  var P = (typeof window !== 'undefined' && window.POLY) ? window.POLY : null;

  /* =================================================================
     0. KATEX Y PRESENTACION
     ================================================================= */

  var KATEX_OPTS = {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false }
    ],
    throwOnError: false,
    errorColor: '#e63946',
    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option']
  };

  function kt(node) {
    if (window.renderMathInElement) {
      try { window.renderMathInElement(node, KATEX_OPTS); } catch (e) { }
    }
  }

  function T(tex) { return '$' + tex + '$'; }
  function TD(tex) { return '$$' + tex + '$$'; }

  function head(title, bullets) {
    var li = bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('');
    return '<div class="ap-head"><h4 class="ap-title">' + title + '</h4>' +
           '<ul class="ap-help">' + li + '</ul></div>';
  }
  function errBox(m) { return '<div class="ap-err">Aviso: ' + m + '</div>'; }
  function step(h) { return '<div class="ap-step">' + h + '</div>'; }
  function warnStep(h) { return '<div class="ap-step ap-warn">' + h + '</div>'; }
  function key(t) { return '<span class="ap-key">' + t + '</span>'; }
  function ok(t) { return '<span class="ap-ok">' + t + '</span>'; }
  function bad(t) { return '<span class="ap-bad">' + t + '</span>'; }
  function note(t) { return '<span class="ap-note">' + t + '</span>'; }
  function chip(t, b) { return '<span class="ap-chip' + (b ? ' ap-chip-bad' : '') + '">' + t + '</span>'; }

  /* =================================================================
     1. NUMEROS EN LATEX
     ================================================================= */

  function nz(x) { return Math.abs(x) < 1e-11 ? 0 : x; }

  function nt(x) {
    if (!isFinite(x)) return '\\text{no definido}';
    var y = nz(x), r = Math.round(y * 1e6) / 1e6;
    return Number.isInteger(r) ? String(r) : String(r).replace('.', '{,}');
  }

  function qt(x) {
    var y = nz(x);
    if (Number.isInteger(y)) return String(y);
    for (var d = 2; d <= 48; d++) {
      var p = y * d;
      if (Math.abs(p - Math.round(p)) < 1e-9) {
        p = Math.round(p);
        return (p < 0 ? '-' : '') + '\\dfrac{' + Math.abs(p) + '}{' + d + '}';
      }
    }
    return nt(y);
  }

  /* Envuelve los negativos en parentesis, para sustituir valores en formulas. */
  function par(x) { return x < 0 ? '\\left(' + qt(x) + '\\right)' : qt(x); }

  function snap(x) {
    for (var d = 1; d <= 48; d++) {
      var p = x * d;
      if (Math.abs(p - Math.round(p)) < 1e-8) return Math.round(p) / d;
    }
    return x;
  }

  /* Coeficiente delante de una incognita: omite el 1 y el -1. */
  function coefV(a, v) {
    if (a === 1) return v;
    if (a === -1) return '-' + v;
    return qt(a) + v;
  }

  /* Fraccion que se simplifica cuando el denominador vale 1 o -1. */
  function fracT(num, den) {
    if (den === 1) return num;
    if (den === -1) return '-\\left(' + num + '\\right)';
    return '\\dfrac{' + num + '}{' + den + '}';
  }

  /* Numerador del tipo c-av, con los signos ya compuestos. */
  function numAisla(c, a, v) {
    v = v || 'x';
    if (nz(a) === 0) return qt(c);
    var aa = Math.abs(a), t = (aa === 1 ? v : qt(aa) + v);
    if (nz(c) === 0) return (a > 0 ? '-' : '') + t;
    return qt(c) + (a > 0 ? '-' : '+') + t;
  }

  /* Producto de un coeficiente por un parentesis, con signo delante. */
  function prodT(k, cuerpo) {
    var ak = Math.abs(k), sg = (k < 0 ? '-' : '+');
    return sg + (ak === 1 ? '' : qt(ak) + '\\cdot') + '\\left(' + cuerpo + '\\right)';
  }
  /* Termino lineal con signo, para escribir ax+by=c con buen aspecto. */
  function lin2(a, b, c) {
    var s = '';
    if (nz(a) !== 0) s += (a === 1 ? '' : a === -1 ? '-' : qt(a)) + 'x';
    if (nz(b) !== 0) {
      if (s) s += (b > 0 ? '+' : '-');
      else if (b < 0) s += '-';
      var ab = Math.abs(b);
      s += (ab === 1 ? '' : qt(ab)) + 'y';
    }
    if (!s) s = '0';
    return s + '=' + qt(c);
  }

  function sysTex(a1, b1, c1, a2, b2, c2) {
    return '\\left\\{\\begin{array}{l}' + lin2(a1, b1, c1) + '\\\\' + lin2(a2, b2, c2) + '\\end{array}\\right.';
  }

  /* =================================================================
     2. ALGEBRA DE SISTEMAS 2x2
     ================================================================= */

  function classify(a1, b1, c1, a2, b2, c2) {
    var det = a1 * b2 - a2 * b1;
    if (Math.abs(det) > 1e-12) {
      return {
        type: 'CD', det: det,
        x: snap((c1 * b2 - c2 * b1) / det),
        y: snap((a1 * c2 - a2 * c1) / det)
      };
    }
    /* Rectas paralelas o coincidentes. */
    var d1 = a1 * c2 - a2 * c1, d2 = b1 * c2 - b2 * c1;
    if (Math.abs(d1) < 1e-12 && Math.abs(d2) < 1e-12) return { type: 'CI', det: 0 };
    return { type: 'INC', det: 0 };
  }

  function classifyText(cl) {
    if (cl.type === 'CD') return ok('compatible determinado') + ': una \u00fanica soluci\u00f3n. Las rectas se cortan.';
    if (cl.type === 'CI') return ok('compatible indeterminado') + ': infinitas soluciones. Las rectas son coincidentes.';
    return bad('incompatible') + ': no hay soluci\u00f3n. Las rectas son paralelas.';
  }

  /* =================================================================
     3. GEOMETRIA: RECORTE DE SEMIPLANOS
     ================================================================= */

  /* Recorta el poligono convexo por el semiplano a*x + b*y <= c. */
  function clipHalf(poly, a, b, c) {
    if (!poly.length) return [];
    var out = [], n = poly.length, eps = 1e-9;
    function f(pt) { return a * pt[0] + b * pt[1] - c; }
    for (var i = 0; i < n; i++) {
      var A = poly[i], B = poly[(i + 1) % n];
      var fa = f(A), fb = f(B);
      if (fa <= eps) out.push(A);
      if ((fa > eps && fb < -eps) || (fa < -eps && fb > eps)) {
        var t = fa / (fa - fb);
        out.push([A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])]);
      }
    }
    return out;
  }

  function windowPoly(w) {
    return [[w.xmin, w.ymin], [w.xmax, w.ymin], [w.xmax, w.ymax], [w.xmin, w.ymax]];
  }

  /* Constraint: {a,b,c,op} con op '<=' o '>='. Se normaliza a <=. */
  function normalize(k) {
    return (k.op === '>=' || k.op === '>')
      ? { a: -k.a, b: -k.b, c: -k.c, strict: k.op === '>' }
      : { a: k.a, b: k.b, c: k.c, strict: k.op === '<' };
  }

  function feasible(cons, w) {
    var poly = windowPoly(w);
    cons.forEach(function (k) {
      var m = normalize(k);
      poly = clipHalf(poly, m.a, m.b, m.c);
    });
    return poly;
  }

  /* Vertices verdaderos del recinto: los que no estan sobre el borde
     de la ventana, es decir, los que provienen de cortar restricciones. */
  function realVertices(poly, w) {
    var e = 1e-7;
    return poly.filter(function (p) {
      return Math.abs(p[0] - w.xmin) > e && Math.abs(p[0] - w.xmax) > e &&
             Math.abs(p[1] - w.ymin) > e && Math.abs(p[1] - w.ymax) > e;
    }).map(function (p) { return [snap(p[0]), snap(p[1])]; });
  }

  /* =================================================================
     4. DIBUJO EN EL PLANO
     ================================================================= */

  function planeSVG(items, w, opts) {
    opts = opts || {};
    var W = 520, H = 380, pad = 30;
    function sx(x) { return pad + (x - w.xmin) / (w.xmax - w.xmin) * (W - 2 * pad); }
    function sy(y) { return H - pad - (y - w.ymin) / (w.ymax - w.ymin) * (H - 2 * pad); }

    var g = '';

    /* rejilla */
    var stepX = niceStep(w.xmax - w.xmin), stepY = niceStep(w.ymax - w.ymin), t;
    for (t = Math.ceil(w.xmin / stepX) * stepX; t <= w.xmax; t += stepX) {
      g += '<line x1="' + sx(t).toFixed(1) + '" y1="' + pad + '" x2="' + sx(t).toFixed(1) +
        '" y2="' + (H - pad) + '" stroke="#eef2f7"/>';
    }
    for (t = Math.ceil(w.ymin / stepY) * stepY; t <= w.ymax; t += stepY) {
      g += '<line x1="' + pad + '" y1="' + sy(t).toFixed(1) + '" x2="' + (W - pad) +
        '" y2="' + sy(t).toFixed(1) + '" stroke="#eef2f7"/>';
    }

    /* ejes */
    g += '<line x1="' + pad + '" y1="' + sy(0).toFixed(1) + '" x2="' + (W - pad) +
      '" y2="' + sy(0).toFixed(1) + '" stroke="#94a3b8" stroke-width="1.6"/>';
    g += '<line x1="' + sx(0).toFixed(1) + '" y1="' + pad + '" x2="' + sx(0).toFixed(1) +
      '" y2="' + (H - pad) + '" stroke="#94a3b8" stroke-width="1.6"/>';

    /* elementos */
    items.forEach(function (it) {
      if (!it) return;
      if (it.type === 'poly' && it.pts && it.pts.length > 2) {
        g += '<polygon points="' + it.pts.map(function (p) {
          return sx(p[0]).toFixed(1) + ',' + sy(p[1]).toFixed(1);
        }).join(' ') + '" fill="' + (it.fill || '#2a76dd') + '" fill-opacity="' +
          (it.opacity || 0.22) + '" stroke="' + (it.stroke || 'none') + '"/>';
      }
      if (it.type === 'line') {
        var seg = clipLine(it.a, it.b, it.c, w);
        if (seg) {
          g += '<line x1="' + sx(seg[0][0]).toFixed(1) + '" y1="' + sy(seg[0][1]).toFixed(1) +
            '" x2="' + sx(seg[1][0]).toFixed(1) + '" y2="' + sy(seg[1][1]).toFixed(1) +
            '" stroke="' + (it.color || '#2a76dd') + '" stroke-width="' + (it.width || 2.4) + '"' +
            (it.dash ? ' stroke-dasharray="6 4"' : '') + '/>';
        }
      }
      if (it.type === 'curve') {
        var d = '', pen = false;
        for (var i = 0; i <= 400; i++) {
          var x = w.xmin + (w.xmax - w.xmin) * i / 400;
          var ys = it.fn(x);
          if (ys === null || !isFinite(ys) || ys < w.ymin - 2 || ys > w.ymax + 2) { pen = false; continue; }
          d += (pen ? 'L' : 'M') + sx(x).toFixed(1) + ',' + sy(ys).toFixed(1) + ' ';
          pen = true;
        }
        g += '<path d="' + d + '" fill="none" stroke="' + (it.color || '#8e44ad') +
          '" stroke-width="2.4"/>';
      }
      if (it.type === 'points') {
        (it.pts || []).forEach(function (p) {
          g += '<circle cx="' + sx(p[0]).toFixed(1) + '" cy="' + sy(p[1]).toFixed(1) +
            '" r="5.5" fill="' + (it.fill || '#e63946') + '" stroke="#fff" stroke-width="1.5"/>';
          if (it.labels !== false) {
            g += '<text x="' + (sx(p[0]) + 8).toFixed(1) + '" y="' + (sy(p[1]) - 8).toFixed(1) +
              '" font-size="12" fill="#334155">(' + nice(p[0]) + ', ' + nice(p[1]) + ')</text>';
          }
        });
      }
    });

    return '<svg class="ap-fig" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
      (opts.alt || 'representaci\u00f3n en el plano') + '">' + g + '</svg>';
  }

  function nice(v) { return String(Math.round(v * 100) / 100).replace('.', ','); }

  function niceStep(range) {
    var raw = range / 10, mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var n = raw / mag;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
  }

  function clipLine(a, b, c, w) {
    var pts = [];
    if (Math.abs(b) > 1e-12) {
      [w.xmin, w.xmax].forEach(function (x) {
        var y = (c - a * x) / b;
        if (y >= w.ymin - 1e-9 && y <= w.ymax + 1e-9) pts.push([x, y]);
      });
    }
    if (Math.abs(a) > 1e-12) {
      [w.ymin, w.ymax].forEach(function (y) {
        var x = (c - b * y) / a;
        if (x >= w.xmin - 1e-9 && x <= w.xmax + 1e-9) pts.push([x, y]);
      });
    }
    if (pts.length < 2) return null;
    return [pts[0], pts[pts.length - 1]];
  }

  /* =================================================================
     5. INTERFAZ
     ================================================================= */

  function mini(role, label, value, stp) {
    return '<label class="ap-lab">' + label + '</label>' +
      '<input class="ap-in ap-mini" type="number" data-role="' + role + '" value="' + value +
      '" step="' + (stp || 1) + '">';
  }
  function selOp(role, value) {
    return '<select class="ap-sel" data-role="' + role + '">' +
      '<option value="<="' + (value === '<=' ? ' selected' : '') + '>\u2264</option>' +
      '<option value=">="' + (value === '>=' ? ' selected' : '') + '>\u2265</option></select>';
  }
  function get(r, role) { return r.querySelector('[data-role="' + role + '"]'); }
  function val(r, role) { return get(r, role).value; }
  function nv(r, role) { return parseFloat(get(r, role).value); }

  function live(root, out, fn) {
    function run() {
      try { out.innerHTML = fn(); }
      catch (e) { out.innerHTML = errBox(e && e.message ? e.message : String(e)); }
      kt(out);
    }
    Array.prototype.forEach.call(root.querySelectorAll('input,select'), function (el) {
      el.addEventListener('input', run);
      el.addEventListener('change', run);
    });
    run();
  }

  function shell(root, title, bullets, controls) {
    root.classList.add('applet');
    root.innerHTML = head(title, bullets) + controls + '<div class="ap-out" data-role="out"></div>';
    kt(root);
    return get(root, 'out');
  }

  /* Fila de controles para un sistema 2x2. */
  function sysControls(def) {
    def = def || [1, 1, 1, 2, -3, 2];
    return '<div class="ap-row">' + mini('a1', 'a\u2081', def[0]) + mini('b1', 'b\u2081', def[1]) +
      mini('c1', 'c\u2081', def[2]) + '</div>' +
      '<div class="ap-row">' + mini('a2', 'a\u2082', def[3]) + mini('b2', 'b\u2082', def[4]) +
      mini('c2', 'c\u2082', def[5]) + '</div>';
  }
  function readSys(r) {
    return [nv(r, 'a1'), nv(r, 'b1'), nv(r, 'c1'), nv(r, 'a2'), nv(r, 'b2'), nv(r, 'c2')];
  }
  var WIN = { xmin: -8, xmax: 8, ymin: -8, ymax: 8 };

  /* =================================================================
     6. APPLETS · SISTEMAS LINEALES
     ================================================================= */

  /* ---------- Applet · Metodo de sustitucion ---------- */
  SY.sustitucion = function (root) {
    var out = shell(root, 'Applet \u00b7 M\u00e9todo de sustituci\u00f3n', [
      'El sistema es $\\left\\{a_{1}x+b_{1}y=c_{1};\\ a_{2}x+b_{2}y=c_{2}\\right.$. El applet a\u00edsla una inc\u00f3gnita en la primera ecuaci\u00f3n y la sustituye en la segunda.',
      'Ejemplo del libro: $a_{1}=1$, $b_{1}=1$, $c_{1}=1$, $a_{2}=2$, $b_{2}=-3$, $c_{2}=2$, cuya soluci\u00f3n es $x=1$, $y=0$.',
      'Prueba $a_{1}=3$, $b_{1}=-5$, $c_{1}=2$, $a_{2}=-2$, $b_{2}=3$, $c_{2}=5$ y observa que aparecen fracciones: sustituci\u00f3n no siempre es el m\u00e9todo m\u00e1s c\u00f3modo.',
      'Pon $b_{1}=0$: entonces no se puede aislar $y$ en la primera ecuaci\u00f3n y el applet aisla $x$. Ese cambio de estrategia es parte del m\u00e9todo.'
    ], sysControls());

    live(root, out, function () {
      var v = readSys(root), a1 = v[0], b1 = v[1], c1 = v[2], a2 = v[3], b2 = v[4], c2 = v[5];
      var h = step('Sistema: ' + T(sysTex(a1, b1, c1, a2, b2, c2)));
      var cl = classify(a1, b1, c1, a2, b2, c2);

      if (Math.abs(b1) > 1e-12) {
        var numY = numAisla(c1, a1), fracY = fracT(numY, b1);
        h += step('Aislamos ' + T('y') + ' en la primera: ' + T('y=' + fracY));
        h += step('Sustituimos en la segunda: ' +
          T((nz(a2) === 0 ? '' : coefV(a2, 'x')) +
            (nz(b2) === 0 ? '' : prodT(b2, fracY)) + '=' + qt(c2)));
        var A = a2 * b1 - b2 * a1, B = c2 * b1 - b2 * c1;
        h += step('Multiplicando por ' + T(qt(b1)) + ' y agrupando: ' + T(qt(A) + 'x=' + qt(B)));
        if (Math.abs(A) < 1e-12) {
          h += step(Math.abs(B) < 1e-12
            ? ok('Se obtiene $0=0$') + ': el sistema es compatible indeterminado.'
            : bad('Se obtiene una contradicci\u00f3n') + ': el sistema es incompatible.');
        } else {
          var x = snap(B / A), y = snap((c1 - a1 * x) / b1);
          h += step('Despejamos: ' + T('x=' + qt(x)) + ', y volviendo atr\u00e1s ' + T('y=' + qt(y)));
          h += step(key('Soluci\u00f3n: ') + chip(T('x=' + qt(x))) + chip(T('y=' + qt(y))));
          h += step('Comprobaci\u00f3n en las dos ecuaciones: ' +
            T(nt(a1 * x + b1 * y) + '=' + qt(c1)) + ' y ' + T(nt(a2 * x + b2 * y) + '=' + qt(c2)));
        }
      } else if (Math.abs(a1) > 1e-12) {
        h += warnStep('Como ' + T('b_{1}=0') + ', no se puede aislar ' + T('y') +
          ' en la primera ecuaci\u00f3n. Aislamos ' + T('x') + '.');
        var x0 = snap(c1 / a1);
        h += step(T('x=' + qt(x0)) + '. Sustituyendo en la segunda: ' +
          T(qt(b2) + 'y=' + qt(c2) + '-' + qt(a2 * x0)));
        if (Math.abs(b2) < 1e-12) {
          h += step(bad('No se puede continuar') + ': la segunda ecuaci\u00f3n no contiene ' + T('y') + '.');
        } else {
          var y0 = snap((c2 - a2 * x0) / b2);
          h += step(key('Soluci\u00f3n: ') + chip(T('x=' + qt(x0))) + chip(T('y=' + qt(y0))));
        }
      } else {
        h += step(bad('La primera ecuaci\u00f3n no tiene inc\u00f3gnitas') + ': revisa los coeficientes.');
      }
      h += step('Clasificaci\u00f3n: ' + classifyText(cl));
      return h;
    });
  };

  /* ---------- Applet · Metodo de igualacion ---------- */
  SY.igualacion = function (root) {
    var out = shell(root, 'Applet \u00b7 M\u00e9todo de igualaci\u00f3n', [
      'Se a\u00edsla la <b>misma</b> inc\u00f3gnita en las dos ecuaciones y se igualan las dos expresiones obtenidas.',
      'Ejemplo: $a_{1}=1$, $b_{1}=1$, $c_{1}=1$, $a_{2}=2$, $b_{2}=-3$, $c_{2}=2$. Se aisla $y$ en ambas y se igualan.',
      'Este m\u00e9todo es c\u00f3modo cuando una inc\u00f3gnita tiene coeficiente $1$ o $-1$ en las dos ecuaciones.',
      'Si alguno de los coeficientes de $y$ es cero, el applet avisa: no se puede aislar la misma inc\u00f3gnita en las dos.'
    ], sysControls());

    live(root, out, function () {
      var v = readSys(root), a1 = v[0], b1 = v[1], c1 = v[2], a2 = v[3], b2 = v[4], c2 = v[5];
      var h = step('Sistema: ' + T(sysTex(a1, b1, c1, a2, b2, c2)));
      if (Math.abs(b1) < 1e-12 || Math.abs(b2) < 1e-12) {
        return h + warnStep('No se puede aislar ' + T('y') +
          ' en las dos ecuaciones, porque alg\u00fan coeficiente de ' + T('y') +
          ' es cero. Usa sustituci\u00f3n o reducci\u00f3n.');
      }
      h += step('Aislamos ' + T('y') + ' en las dos: ' +
        T('y=' + fracT(numAisla(c1, a1), b1)) + ' y ' +
        T('y=' + fracT(numAisla(c2, a2), b2)));
      h += step('Igualamos las dos expresiones y multiplicamos en cruz:');
      var Ax = a2 * b1 - a1 * b2, Bx = c2 * b1 - c1 * b2;
      h += step(T(coefV(b2, '\\left(' + numAisla(c1, a1) + '\\right)') + '=' +
        coefV(b1, '\\left(' + numAisla(c2, a2) + '\\right)')));
      h += step('Agrupando: ' + T(qt(Ax) + 'x=' + qt(Bx)));
      if (Math.abs(Ax) < 1e-12) {
        h += step(Math.abs(Bx) < 1e-12
          ? ok('Identidad $0=0$') + ': infinitas soluciones, las rectas son coincidentes.'
          : bad('Contradicci\u00f3n') + ': no hay soluci\u00f3n, las rectas son paralelas.');
      } else {
        var x = snap(Bx / Ax), y = snap((c1 - a1 * x) / b1);
        h += step(key('Soluci\u00f3n: ') + chip(T('x=' + qt(x))) + chip(T('y=' + qt(y))));
        h += step('Las dos expresiones de ' + T('y') + ' deben coincidir: ' +
          T(nt((c1 - a1 * x) / b1)) + ' y ' + T(nt((c2 - a2 * x) / b2)) + ' ' + ok('(coinciden)'));
      }
      return h;
    });
  };

  /* ---------- Applet · Metodo de reduccion ---------- */
  SY.reduccion = function (root) {
    var out = shell(root, 'Applet \u00b7 M\u00e9todo de reducci\u00f3n', [
      'Se igualan los coeficientes de una inc\u00f3gnita multiplicando cada ecuaci\u00f3n por un n\u00famero, y despu\u00e9s se suman o se restan para eliminarla.',
      'Ejemplo: $a_{1}=1$, $b_{1}=1$, $c_{1}=1$, $a_{2}=2$, $b_{2}=-3$, $c_{2}=2$. Multiplicando la primera por $-2$ desaparece la $x$.',
      'Es el m\u00e9todo m\u00e1s conveniente cuando los coeficientes de una inc\u00f3gnita son iguales o m\u00faltiplos uno del otro. Prueba $a_{1}=3$, $a_{2}=6$.',
      'Elige con el selector qu\u00e9 inc\u00f3gnita quieres eliminar y compara el n\u00famero de operaciones.'
    ], sysControls() +
       '<div class="ap-row"><label class="ap-lab">Eliminar</label>' +
       '<select class="ap-sel" data-role="elim"><option value="x">la inc\u00f3gnita x</option>' +
       '<option value="y">la inc\u00f3gnita y</option></select></div>');

    live(root, out, function () {
      var v = readSys(root), a1 = v[0], b1 = v[1], c1 = v[2], a2 = v[3], b2 = v[4], c2 = v[5];
      var elim = val(root, 'elim');
      var h = step('Sistema: ' + T(sysTex(a1, b1, c1, a2, b2, c2)));
      var m1, m2, lab;
      if (elim === 'x') { m1 = a2; m2 = -a1; lab = 'x'; }
      else { m1 = b2; m2 = -b1; lab = 'y'; }
      if (Math.abs(m1) < 1e-12 && Math.abs(m2) < 1e-12) {
        return h + warnStep('Ninguna ecuaci\u00f3n contiene ' + T(lab) + ': no hay nada que eliminar.');
      }
      h += step('Multiplicamos la primera por ' + T(qt(m1)) + ' y la segunda por ' + T(qt(m2)) +
        ', de modo que los coeficientes de ' + T(lab) + ' sean opuestos.');
      var A = m1 * a1 + m2 * a2, B = m1 * b1 + m2 * b2, C = m1 * c1 + m2 * c2;
      h += step('Sumando las dos ecuaciones: ' + T(lin2(A, B, C)));
      if (Math.abs(A) < 1e-12 && Math.abs(B) < 1e-12) {
        h += step(Math.abs(C) < 1e-12
          ? ok('Queda $0=0$') + ': compatible indeterminado, infinitas soluciones.'
          : bad('Queda una contradicci\u00f3n') + ': incompatible, sin soluci\u00f3n.');
        return h;
      }
      var cl = classify(a1, b1, c1, a2, b2, c2);
      if (cl.type === 'CD') {
        h += step('De ah\u00ed sale una de las inc\u00f3gnitas, y sustituyendo en cualquier ecuaci\u00f3n original obtenemos la otra.');
        h += step(key('Soluci\u00f3n: ') + chip(T('x=' + qt(cl.x))) + chip(T('y=' + qt(cl.y))));
        h += step('Comprobaci\u00f3n: ' + T(nt(a1 * cl.x + b1 * cl.y) + '=' + qt(c1)) + ' y ' +
          T(nt(a2 * cl.x + b2 * cl.y) + '=' + qt(c2)));
      } else {
        h += step('Clasificaci\u00f3n: ' + classifyText(cl));
      }
      return h;
    });
  };

  /* ---------- Applet · Metodo grafico ---------- */
  SY.grafico = function (root) {
    var out = shell(root, 'Applet \u00b7 M\u00e9todo gr\u00e1fico', [
      'Cada ecuaci\u00f3n lineal con dos inc\u00f3gnitas es una <b>recta</b>. La soluci\u00f3n del sistema es el punto o los puntos de corte.',
      'Ejemplo: $a_{1}=1$, $b_{1}=1$, $c_{1}=1$ y $a_{2}=2$, $b_{2}=-3$, $c_{2}=2$ se cortan en $(1,0)$.',
      'Haz que las rectas sean paralelas: $a_{1}=1$, $b_{1}=1$, $c_{1}=1$, $a_{2}=2$, $b_{2}=2$, $c_{2}=6$. No hay corte, el sistema es incompatible.',
      'Haz que sean coincidentes: $a_{2}=2$, $b_{2}=2$, $c_{2}=2$. Toda la recta es soluci\u00f3n.',
      'Recuerda que la soluci\u00f3n $x=1$, $y=0$ se expresa como el punto del plano $(1,0)$.'
    ], sysControls());

    live(root, out, function () {
      var v = readSys(root), a1 = v[0], b1 = v[1], c1 = v[2], a2 = v[3], b2 = v[4], c2 = v[5];
      var cl = classify(a1, b1, c1, a2, b2, c2);
      var h = step('Sistema: ' + T(sysTex(a1, b1, c1, a2, b2, c2)));

      h += step('Despejadas: ' +
        (Math.abs(b1) > 1e-12 ? T('y=' + qt(-a1 / b1) + 'x+' + qt(c1 / b1)) : T('x=' + qt(c1 / a1)) + ' (recta vertical)') +
        ' y ' +
        (Math.abs(b2) > 1e-12 ? T('y=' + qt(-a2 / b2) + 'x+' + qt(c2 / b2)) : T('x=' + qt(c2 / a2)) + ' (recta vertical)'));

      h += step('Clasificaci\u00f3n: ' + classifyText(cl));
      if (cl.type === 'CD') {
        h += step(key('Punto de corte: ') + chip(T('\\left(' + qt(cl.x) + ',\\ ' + qt(cl.y) + '\\right)')));
      }
      h += step('Criterio de los cocientes: ' +
        T('\\dfrac{a_{1}}{a_{2}}') + ', ' + T('\\dfrac{b_{1}}{b_{2}}') + ' y ' + T('\\dfrac{c_{1}}{c_{2}}') +
        '. Si los dos primeros difieren hay corte; si los tres coinciden las rectas son la misma; si los dos primeros coinciden pero el tercero no, son paralelas.');

      h += planeSVG([
        { type: 'line', a: a1, b: b1, c: c1, color: '#2a76dd' },
        { type: 'line', a: a2, b: b2, c: c2, color: '#e63946' },
        cl.type === 'CD' ? { type: 'points', pts: [[cl.x, cl.y]] } : null
      ], WIN, { alt: 'dos rectas en el plano' });
      return h;
    });
  };

  /* ---------- Applet · Discusion del sistema ---------- */
  SY.discusion = function (root) {
    var out = shell(root, 'Applet \u00b7 Discusi\u00f3n del sistema', [
      'Discutir un sistema es clasificarlo seg\u00fan el n\u00famero de soluciones, sin necesidad de resolverlo del todo.',
      'Prueba los tres casos del libro: $\\left\\{x+y=1;\\ 2x+y=2\\right.$ es determinado; $\\left\\{x+y=1;\\ 2x+2y=2\\right.$ es indeterminado; $\\left\\{x+y=1;\\ x+y=2\\right.$ es incompatible.',
      'Observa el valor de $a_{1}b_{2}-a_{2}b_{1}$. Cuando no es cero hay soluci\u00f3n \u00fanica; cuando es cero hay que mirar los t\u00e9rminos independientes.',
      'En el caso indeterminado el applet escribe la soluci\u00f3n con un par\u00e1metro $\\lambda$, tal como se hace en los apuntes.'
    ], sysControls([1, 1, 1, 2, 1, 2]));

    live(root, out, function () {
      var v = readSys(root), a1 = v[0], b1 = v[1], c1 = v[2], a2 = v[3], b2 = v[4], c2 = v[5];
      var cl = classify(a1, b1, c1, a2, b2, c2);
      var h = step('Sistema: ' + T(sysTex(a1, b1, c1, a2, b2, c2)));
      h += step('Determinante de los coeficientes: ' +
        T('a_{1}b_{2}-a_{2}b_{1}=' + par(a1) + '\\cdot' + par(b2) + '-' + par(a2) + '\\cdot' + par(b1) +
          '=' + nt(a1 * b2 - a2 * b1)));
      h += step(key('Diagn\u00f3stico: ') + classifyText(cl));

      if (cl.type === 'CD') {
        h += step(key('Soluci\u00f3n \u00fanica: ') + chip(T('x=' + qt(cl.x))) + chip(T('y=' + qt(cl.y))));
      } else if (cl.type === 'CI') {
        h += step('Las dos ecuaciones dan la misma informaci\u00f3n. Tomamos una y expresamos la soluci\u00f3n con un par\u00e1metro:');
        if (Math.abs(b1) > 1e-12) {
          h += step(TD('x=\\lambda,\\qquad y=' + fracT(numAisla(c1, a1, '\\lambda'), b1) + ',\\qquad \\lambda\\in\\mathbb{R}'));
        } else if (Math.abs(a1) > 1e-12) {
          h += step(TD('x=' + qt(c1 / a1) + ',\\qquad y=\\lambda,\\qquad \\lambda\\in\\mathbb{R}'));
        } else {
          h += step('Ambas ecuaciones son triviales: cualquier punto del plano es soluci\u00f3n.');
        }
        h += step('Dando valores concretos a ' + T('\\lambda') + ' se obtienen soluciones particulares. Prueba con ' + T('\\lambda=0') + ' y ' + T('\\lambda=1') + '.');
      } else {
        h += step('Las ecuaciones se contradicen: si ' + T(lin2(a1, b1, c1)) +
          ', no puede ocurrir a la vez ' + T(lin2(a2, b2, c2)) + '.');
      }

      h += planeSVG([
        { type: 'line', a: a1, b: b1, c: c1, color: '#2a76dd' },
        { type: 'line', a: a2, b: b2, c: c2, color: '#e63946', dash: cl.type === 'CI' },
        cl.type === 'CD' ? { type: 'points', pts: [[cl.x, cl.y]] } : null
      ], WIN);
      return h;
    });
  };

  /* ---------- Applet · Sistema con parametro ---------- */
  SY.parametro = function (root) {
    var out = shell(root, 'Applet \u00b7 Sistema con par\u00e1metro', [
      'El sistema es $\\left\\{a_{1}x+b_{1}y=c_{1};\\ mx+b_{2}y=c_{2}\\right.$, donde el coeficiente $m$ es el par\u00e1metro que puedes mover.',
      'Mueve $m$ y observa el valor cr\u00edtico: aquel para el que el determinante se anula y el sistema deja de tener soluci\u00f3n \u00fanica.',
      'Ejemplo del libro: $\\left\\{-2x+ay=12;\\ x+2y=1\\right.$ tiene soluci\u00f3n salvo cuando $a=-4$.',
      'Este es el germen de la discusi\u00f3n de sistemas que har\u00e1s en segundo con matrices y determinantes.'
    ],
      '<div class="ap-row">' + mini('a1', 'a\u2081', -2) + mini('b1', 'b\u2081', 4) + mini('c1', 'c\u2081', 12) + '</div>' +
      '<div class="ap-row">' + mini('a2', 'b\u2082', 2) + mini('c2', 'c\u2082', 1) + '</div>' +
      '<div class="ap-row"><label class="ap-lab">par\u00e1metro m</label>' +
      '<input class="ap-in ap-range" type="range" data-role="m" min="-6" max="6" step="0.25" value="1"></div>');

    live(root, out, function () {
      var a1 = nv(root, 'a1'), b1 = nv(root, 'b1'), c1 = nv(root, 'c1');
      var b2 = nv(root, 'a2'), c2 = nv(root, 'c2'), m = nv(root, 'm');
      var h = step('Sistema: ' + T(sysTex(a1, b1, c1, m, b2, c2)));
      var det = a1 * b2 - m * b1;
      h += step('Determinante: ' + T('a_{1}b_{2}-m\\,b_{1}=' + qt(a1) + '\\cdot' + qt(b2) + '-m\\cdot' + qt(b1) + '=' + nt(det)));
      if (Math.abs(b1) > 1e-12) {
        var mc = snap(a1 * b2 / b1);
        h += step(key('Valor cr\u00edtico: ') + T('m=' + qt(mc)) +
          '. Para cualquier otro valor el sistema es compatible determinado.');
      }
      var cl = classify(a1, b1, c1, m, b2, c2);
      h += step('Con ' + T('m=' + nt(m)) + ' el sistema es ' + classifyText(cl));
      if (cl.type === 'CD') {
        h += step(key('Soluci\u00f3n: ') + chip(T('x=' + qt(cl.x))) + chip(T('y=' + qt(cl.y))));
        h += step(note('Observa c\u00f3mo se disparan los valores cuando $m$ se acerca al valor cr\u00edtico: las rectas tienden a ser paralelas.'));
      }
      h += planeSVG([
        { type: 'line', a: a1, b: b1, c: c1, color: '#2a76dd' },
        { type: 'line', a: m, b: b2, c: c2, color: '#e63946' },
        cl.type === 'CD' ? { type: 'points', pts: [[cl.x, cl.y]] } : null
      ], WIN);
      return h;
    });
  };

  /* ---------- Applet · Metodo de Gauss ---------- */
  SY.gauss = function (root) {
    var out = shell(root, 'Applet \u00b7 M\u00e9todo de Gauss', [
      'Sistema de tres ecuaciones con tres inc\u00f3gnitas, escrito en forma matricial. El applet triangula por filas y discute mirando la \u00faltima fila.',
      'Ejemplo del libro: $\\left\\{2x+y-2z=7;\\ x+y+z=0;\\ 3x+2y+2z=1\\right.$, cuya soluci\u00f3n es $x=1$, $y=1$, $z=-2$.',
      'Las transformaciones permitidas son intercambiar dos filas y sustituir una fila por ella misma m\u00e1s otra multiplicada por un n\u00famero.',
      'Si la \u00faltima fila queda toda de ceros con t\u00e9rmino independiente distinto de cero, el sistema es incompatible. Si queda toda de ceros, es indeterminado.'
    ],
      '<div class="ap-row">' + mini('a', 'a\u2081', 2) + mini('b', 'b\u2081', 1) + mini('c', 'c\u2081', -2) + mini('d', 'd\u2081', 7) + '</div>' +
      '<div class="ap-row">' + mini('e', 'a\u2082', 1) + mini('f', 'b\u2082', 1) + mini('g', 'c\u2082', 1) + mini('h', 'd\u2082', 0) + '</div>' +
      '<div class="ap-row">' + mini('i', 'a\u2083', 3) + mini('j', 'b\u2083', 2) + mini('k', 'c\u2083', 2) + mini('l', 'd\u2083', 1) + '</div>');

    live(root, out, function () {
      var M = [
        [nv(root, 'a'), nv(root, 'b'), nv(root, 'c'), nv(root, 'd')],
        [nv(root, 'e'), nv(root, 'f'), nv(root, 'g'), nv(root, 'h')],
        [nv(root, 'i'), nv(root, 'j'), nv(root, 'k'), nv(root, 'l')]
      ];
      function mtex(A) {
        return '\\left(\\begin{array}{ccc|c}' + A.map(function (r) {
          return r.map(qt).join(' & ');
        }).join('\\\\') + '\\end{array}\\right)';
      }
      var h = step('Forma matricial: ' + T(mtex(M)));
      var steps = [];

      /* Triangulacion con pivoteo parcial. */
      var A = M.map(function (r) { return r.slice(); }), i, j, k;
      for (i = 0; i < 3; i++) {
        var piv = i;
        for (k = i + 1; k < 3; k++) if (Math.abs(A[k][i]) > Math.abs(A[piv][i])) piv = k;
        if (Math.abs(A[piv][i]) < 1e-12) continue;
        if (piv !== i) {
          var t = A[i]; A[i] = A[piv]; A[piv] = t;
          steps.push('Intercambiamos ' + T('E_{' + (i + 1) + '}\\leftrightarrow E_{' + (piv + 1) + '}') +
            ' para tener un pivote c\u00f3modo: ' + T(mtex(A)));
        }
        for (k = i + 1; k < 3; k++) {
          if (Math.abs(A[k][i]) < 1e-12) continue;
          var f = A[k][i] / A[i][i];
          for (j = 0; j < 4; j++) A[k][j] = snap(A[k][j] - f * A[i][j]);
          steps.push(T('E_{' + (k + 1) + '}\\rightarrow E_{' + (k + 1) + '}-' + qt(f) +
            'E_{' + (i + 1) + '}') + ': ' + T(mtex(A)));
        }
      }
      steps.forEach(function (s) { h += step(s); });

      /* Discusion */
      var last = A[2];
      var zeros = Math.abs(last[0]) < 1e-10 && Math.abs(last[1]) < 1e-10 && Math.abs(last[2]) < 1e-10;
      if (zeros && Math.abs(last[3]) > 1e-10) {
        h += step(key('Discusi\u00f3n: ') + bad('sistema incompatible') +
          '. La \u00faltima fila dice ' + T('0=' + qt(last[3])) + ', que es imposible.');
        return h;
      }
      if (zeros) {
        h += step(key('Discusi\u00f3n: ') + ok('sistema compatible indeterminado') +
          '. La \u00faltima fila es toda de ceros, luego hay infinitas soluciones y la respuesta depende de un par\u00e1metro.');
        return h;
      }
      h += step(key('Discusi\u00f3n: ') + ok('sistema compatible determinado') +
        '. Alg\u00fan coeficiente de la \u00faltima fila no es cero, luego la soluci\u00f3n es \u00fanica.');
      var z = snap(last[3] / last[2]);
      var y = Math.abs(A[1][1]) > 1e-12 ? snap((A[1][3] - A[1][2] * z) / A[1][1]) : 0;
      var x = Math.abs(A[0][0]) > 1e-12 ? snap((A[0][3] - A[0][1] * y - A[0][2] * z) / A[0][0]) : 0;
      h += step('Sustituci\u00f3n hacia atr\u00e1s: ' + T('z=' + qt(z)) + ', ' + T('y=' + qt(y)) + ', ' + T('x=' + qt(x)));
      h += step(key('Soluci\u00f3n: ') + chip(T('x=' + qt(x))) + chip(T('y=' + qt(y))) + chip(T('z=' + qt(z))));
      h += step('Comprobaci\u00f3n en la primera ecuaci\u00f3n original: ' +
        T(nt(M[0][0] * x + M[0][1] * y + M[0][2] * z) + '=' + qt(M[0][3])));
      return h;
    });
  };

  /* =================================================================
     7. APPLETS · SISTEMAS NO LINEALES
     ================================================================= */

  /* ---------- Applet · Recta y parabola ---------- */
  SY.parabola = function (root) {
    var out = shell(root, 'Applet \u00b7 Recta y par\u00e1bola', [
      'Sistema no lineal formado por una recta $y=mx+n$ y una par\u00e1bola $y=ax^{2}+bx+c$. Se resuelve por sustituci\u00f3n.',
      'Ejemplos: $m=1$, $n=0$ con $a=1$, $b=0$, $c=-2$ da dos puntos; ajusta $n$ hasta que la recta sea tangente y quede una sola soluci\u00f3n doble.',
      'Sube $n$ un poco m\u00e1s y la recta dejar\u00e1 de cortar: el sistema no tiene soluci\u00f3n real, y eso se ve tanto en el dibujo como en el discriminante.',
      'La clave conceptual: un sistema no lineal puede tener dos soluciones, una o ninguna, a diferencia de los lineales.'
    ],
      '<div class="ap-row">' + mini('m', 'm', 1) + mini('n', 'n', 0) + '</div>' +
      '<div class="ap-row">' + mini('a', 'a', 1) + mini('b', 'b', 0) + mini('c', 'c', -2) + '</div>');

    live(root, out, function () {
      var m = nv(root, 'm'), n = nv(root, 'n');
      var a = nv(root, 'a'), b = nv(root, 'b'), c = nv(root, 'c');
      if (Math.abs(a) < 1e-12) throw new Error('con $a=0$ la segunda ecuaci\u00f3n no es una par\u00e1bola, sino una recta.');
      var h = step('Sistema: ' + T('\\left\\{\\begin{array}{l}y=' + qt(m) + 'x+' + qt(n) +
        '\\\\y=' + qt(a) + 'x^{2}+' + qt(b) + 'x+' + qt(c) + '\\end{array}\\right.'));
      h += step('Igualamos las dos expresiones de ' + T('y') + ' y pasamos todo a un miembro:');
      var A = a, B = b - m, C = c - n, D = B * B - 4 * A * C;
      h += step(T(qt(A) + 'x^{2}+' + qt(B) + 'x+' + qt(C) + '=0') + ', con ' + T('\\Delta=' + nt(D)));
      var pts = [];
      if (D > 1e-10) {
        var r1 = snap((-B - Math.sqrt(D)) / (2 * A)), r2 = snap((-B + Math.sqrt(D)) / (2 * A));
        [r1, r2].forEach(function (x) { pts.push([x, snap(m * x + n)]); });
        h += step(ok('Dos soluciones') + ': ' + pts.map(function (p) {
          return chip(T('\\left(' + qt(p[0]) + ',\\ ' + qt(p[1]) + '\\right)'));
        }).join(''));
      } else if (Math.abs(D) <= 1e-10) {
        var x0 = snap(-B / (2 * A));
        pts.push([x0, snap(m * x0 + n)]);
        h += step(ok('Una soluci\u00f3n doble') + ': la recta es <b>tangente</b> a la par\u00e1bola en ' +
          chip(T('\\left(' + qt(x0) + ',\\ ' + qt(pts[0][1]) + '\\right)')));
      } else {
        h += step(bad('Sin soluciones reales') + ': ' + T('\\Delta<0') +
          ', la recta no llega a cortar la par\u00e1bola.');
      }
      h += step('Comprobaci\u00f3n: cada soluci\u00f3n debe verificar <b>las dos</b> ecuaciones a la vez, no solo una.');
      h += planeSVG([
        { type: 'curve', fn: function (x) { return a * x * x + b * x + c; }, color: '#8e44ad' },
        { type: 'line', a: -m, b: 1, c: n, color: '#2a76dd' },
        { type: 'points', pts: pts }
      ], WIN);
      return h;
    });
  };

  /* ---------- Applet · Recta y conica ---------- */
  SY.conica = function (root) {
    var out = shell(root, 'Applet \u00b7 Recta y c\u00f3nica', [
      'Sistema formado por una recta $y=mx+n$ y una c\u00f3nica $Ax^{2}+By^{2}=C$. Seg\u00fan los signos obtienes una circunferencia, una elipse o una hip\u00e9rbola.',
      'Circunferencia: $A=1$, $B=1$, $C=25$. Elipse: $A=1$, $B=4$, $C=16$. Hip\u00e9rbola: $A=1$, $B=-1$, $C=9$.',
      'Ejemplo del libro con hip\u00e9rbola: la recta $x-3y=12$ junto con $x^{2}-y^{2}=80$ tiene soluciones $(9,-1)$ y $(-12,-8)$.',
      'Mueve $n$ para pasar de dos cortes a uno tangente y a ninguno. El discriminante te lo anticipa antes de dibujar.'
    ],
      '<div class="ap-row">' + mini('m', 'm', 0.3333, 0.05) + mini('n', 'n', -4) + '</div>' +
      '<div class="ap-row">' + mini('A', 'A', 1) + mini('B', 'B', -1) + mini('C', 'C', 80) + '</div>');

    live(root, out, function () {
      var m = nv(root, 'm'), n = nv(root, 'n');
      var A = nv(root, 'A'), B = nv(root, 'B'), C = nv(root, 'C');
      var h = step('Sistema: ' + T('\\left\\{\\begin{array}{l}y=' + qt(m) + 'x+' + qt(n) +
        '\\\\' + qt(A) + 'x^{2}+' + qt(B) + 'y^{2}=' + qt(C) + '\\end{array}\\right.'));
      var tipo = (A > 0 && B > 0) ? (Math.abs(A - B) < 1e-9 ? 'circunferencia' : 'elipse')
        : (A * B < 0 ? 'hip\u00e9rbola' : 'curva sin puntos reales');
      h += step('La segunda ecuaci\u00f3n representa una ' + key(tipo) + '.');
      h += step('Sustituimos ' + T('y=' + qt(m) + 'x+' + qt(n)) + ' en la c\u00f3nica:');
      var a2 = A + B * m * m, b2 = 2 * B * m * n, c2 = B * n * n - C;
      h += step(T(qt(a2) + 'x^{2}+' + qt(b2) + 'x+' + qt(c2) + '=0'));
      var pts = [];
      if (Math.abs(a2) < 1e-12) {
        if (Math.abs(b2) > 1e-12) {
          var xl = snap(-c2 / b2);
          pts.push([xl, snap(m * xl + n)]);
          h += step('El t\u00e9rmino cuadr\u00e1tico se anula: queda una ecuaci\u00f3n lineal con una sola soluci\u00f3n.');
        } else {
          h += step(bad('Caso degenerado') + ': no hay soluci\u00f3n o hay infinitas.');
        }
      } else {
        var D = b2 * b2 - 4 * a2 * c2;
        h += step('Discriminante: ' + T('\\Delta=' + nt(D)));
        if (D > 1e-10) {
          [snap((-b2 - Math.sqrt(D)) / (2 * a2)), snap((-b2 + Math.sqrt(D)) / (2 * a2))]
            .forEach(function (x) { pts.push([x, snap(m * x + n)]); });
          h += step(ok('Dos puntos de corte'));
        } else if (Math.abs(D) <= 1e-10) {
          var x0 = snap(-b2 / (2 * a2));
          pts.push([x0, snap(m * x0 + n)]);
          h += step(ok('Un punto') + ': la recta es tangente a la c\u00f3nica.');
        } else {
          h += step(bad('Ning\u00fan punto real de corte'));
        }
      }
      if (pts.length) {
        h += step(key('Soluciones: ') + pts.map(function (p) {
          return chip(T('\\left(' + qt(p[0]) + ',\\ ' + qt(p[1]) + '\\right)'));
        }).join(''));
        h += step('Comprobaci\u00f3n en la c\u00f3nica: ' + pts.map(function (p) {
          return T(nt(A * p[0] * p[0] + B * p[1] * p[1]) + '=' + qt(C));
        }).join(' y '));
      }
      var W2 = { xmin: -14, xmax: 14, ymin: -12, ymax: 12 };
      h += planeSVG([
        { type: 'curve', fn: function (x) { var q = (C - A * x * x) / B; return q < 0 ? null : Math.sqrt(q); }, color: '#8e44ad' },
        { type: 'curve', fn: function (x) { var q = (C - A * x * x) / B; return q < 0 ? null : -Math.sqrt(q); }, color: '#8e44ad' },
        { type: 'line', a: -m, b: 1, c: n, color: '#2a76dd' },
        { type: 'points', pts: pts }
      ], W2);
      return h;
    });
  };

  /* ---------- Applet · Sistema con radicales ---------- */
  SY.radicales = function (root) {
    var out = shell(root, 'Applet \u00b7 Sistema con radicales', [
      'Sistema $\\left\\{\\sqrt{px+qy}=x+k;\\ x-y=d\\right.$. Se a\u00edsla el radical, se eleva al cuadrado y <b>se comprueban</b> las soluciones.',
      'Ejemplo: $p=1$, $q=2$, $k=1$, $d=-1$ corresponde a $\\sqrt{y+2x}=x+1$ junto con $x-y=-1$.',
      'Al elevar al cuadrado pueden aparecer soluciones extra\u00f1as. El applet marca en rojo las que no pasan la comprobaci\u00f3n.',
      'Recuerda las dos condiciones: el radicando no puede ser negativo y el miembro derecho tampoco.'
    ],
      '<div class="ap-row">' + mini('p', 'p', 2) + mini('q', 'q', 1) + mini('k', 'k', 1) + mini('d', 'd', -1) + '</div>');

    live(root, out, function () {
      var p = nv(root, 'p'), q = nv(root, 'q'), k = nv(root, 'k'), d = nv(root, 'd');
      var h = step('Sistema: ' + T('\\left\\{\\begin{array}{l}\\sqrt{' + qt(p) + 'x+' + qt(q) +
        'y}=x+' + qt(k) + '\\\\x-y=' + qt(d) + '\\end{array}\\right.'));
      h += step('De la segunda ecuaci\u00f3n: ' + T('y=x-' + qt(d)));
      h += step('Sustituimos en el radicando: ' + T('\\sqrt{' + qt(p + q) + 'x-' + qt(q * d) + '}=x+' + qt(k)));
      /* (p+q)x - q d = (x+k)^2  ->  x^2 + (2k - p - q) x + k^2 + q d = 0 */
      var B = 2 * k - (p + q), C = k * k + q * d, D = B * B - 4 * C;
      h += step('Elevando al cuadrado: ' + T('x^{2}+' + qt(B) + 'x+' + qt(C) + '=0') +
        ', con ' + T('\\Delta=' + nt(D)));
      if (D < -1e-10) return h + step(bad('No hay candidatos reales.'));
      var xs = Math.abs(D) <= 1e-10 ? [snap(-B / 2)]
        : [snap((-B - Math.sqrt(D)) / 2), snap((-B + Math.sqrt(D)) / 2)];
      h += step('Candidatos en ' + T('x') + ': ' + xs.map(function (x) { return T(qt(x)); }).join(', '));
      var good = [];
      xs.forEach(function (x) {
        var y = snap(x - d), rad = p * x + q * y, rhs = x + k;
        var fine = rad >= -1e-9 && rhs >= -1e-9 && Math.abs(Math.sqrt(Math.max(0, rad)) - rhs) < 1e-6;
        if (fine) good.push([x, y]);
        h += step(T('\\left(' + qt(x) + ',\\ ' + qt(y) + '\\right)') + ': radicando ' + T(nt(rad)) +
          ', miembro derecho ' + T(nt(rhs)) + ' ' + T('\\Rightarrow') + ' ' +
          (fine ? ok('v\u00e1lida') : bad('soluci\u00f3n extra\u00f1a')));
      });
      h += step(key('Soluciones: ') + (good.length ? good.map(function (pp) {
        return chip(T('\\left(' + qt(pp[0]) + ',\\ ' + qt(pp[1]) + '\\right)'));
      }).join('') : chip(T('\\varnothing'), true)));
      return h;
    });
  };

  /* =================================================================
     8. APPLETS · INECUACIONES CON DOS INCOGNITAS
     ================================================================= */

  /* ---------- Applet · Semiplano ---------- */
  SY.semiplano = function (root) {
    var out = shell(root, 'Applet \u00b7 Semiplano', [
      'Una inecuaci\u00f3n lineal con dos inc\u00f3gnitas, $ax+by\\leq c$, tiene como soluci\u00f3n un <b>semiplano</b>: la mitad del plano que queda a un lado de la recta frontera.',
      'M\u00e9todo: se dibuja la recta $ax+by=c$ y se prueba un punto cualquiera que no est\u00e9 en ella, normalmente el origen. Si lo cumple, el semiplano bueno es el suyo.',
      'Ejemplos: $2x+3y\\leq 6$; $x-y\\geq 0$; $y\\leq 2$ con $a=0$, $b=1$, $c=2$; $x\\geq -1$ con $a=1$, $b=0$, $c=-1$.',
      'Cambia el signo de la desigualdad y observa que el semiplano salta al otro lado sin mover la recta.',
      'La frontera se dibuja continua porque la desigualdad admite el igual. Con desigualdad estricta se dibujar\u00eda a trazos y no formar\u00eda parte de la soluci\u00f3n.'
    ],
      '<div class="ap-row">' + mini('a', 'a', 2) + mini('b', 'b', 3) +
      '<label class="ap-lab">signo</label>' + selOp('op', '<=') + mini('c', 'c', 6) + '</div>' +
      '<div class="ap-row">' + mini('px', 'prueba x', 0) + mini('py', 'prueba y', 0) + '</div>');

    live(root, out, function () {
      var a = nv(root, 'a'), b = nv(root, 'b'), c = nv(root, 'c'), op = val(root, 'op');
      var px = nv(root, 'px'), py = nv(root, 'py');
      if (Math.abs(a) < 1e-12 && Math.abs(b) < 1e-12) {
        throw new Error('si $a=0$ y $b=0$ no hay inc\u00f3gnitas: no es una inecuaci\u00f3n con dos variables.');
      }
      var opT = op === '<=' ? '\\leq' : '\\geq';
      var h = step('Inecuaci\u00f3n: ' + T(lin2(a, b, 0).replace('=0', '') + opT + qt(c)));
      h += step('Recta frontera: ' + T(lin2(a, b, c)) +
        (Math.abs(b) > 1e-12 ? ', o despejada ' + T('y=' + qt(-a / b) + 'x+' + qt(c / b)) : ' (vertical)'));
      var lhs = a * px + b * py;
      var holds = op === '<=' ? lhs <= c + 1e-9 : lhs >= c - 1e-9;
      h += step('Punto de prueba ' + T('\\left(' + qt(px) + ',\\ ' + qt(py) + '\\right)') + ': ' +
        T(qt(a) + '\\cdot' + qt(px) + '+' + qt(b) + '\\cdot' + qt(py) + '=' + nt(lhs)) + ', y ' +
        T(nt(lhs) + opT + qt(c)) + ' es ' + (holds ? ok('cierto') : bad('falso')));
      h += step(holds
        ? 'Luego el semiplano soluci\u00f3n es ' + key('el que contiene al punto de prueba') + '.'
        : 'Luego el semiplano soluci\u00f3n es ' + key('el contrario al del punto de prueba') + '.');
      var poly = feasible([{ a: a, b: b, c: c, op: op }], WIN);
      h += planeSVG([
        { type: 'poly', pts: poly, fill: '#2a76dd', opacity: 0.2 },
        { type: 'line', a: a, b: b, c: c, color: '#1d4ed8' },
        { type: 'points', pts: [[px, py]], fill: holds ? '#2a9d8f' : '#e63946' }
      ], WIN, { alt: 'semiplano soluci\u00f3n' });
      h += step(note('La zona sombreada es infinita: se extiende m\u00e1s all\u00e1 de lo que muestra el dibujo.'));
      return h;
    });
  };

  /* ---------- Applet · Recinto ---------- */
  SY.recinto = function (root) {
    var out = shell(root, 'Applet \u00b7 Recinto', [
      'Un sistema de inecuaciones lineales con dos inc\u00f3gnitas define un <b>recinto</b>: la intersecci\u00f3n de todos los semiplanos.',
      'Cada fila es una restricci\u00f3n $ax+by\\leq c$. Desactiva las que no quieras usar con la casilla de la izquierda.',
      'Prueba el recinto cl\u00e1sico: $x\\geq 0$, $y\\geq 0$, $x+y\\leq 6$, $2x+y\\leq 8$. Aparecen cuatro v\u00e9rtices.',
      'Cambia una restricci\u00f3n hasta que el recinto se quede vac\u00edo: el sistema ser\u00e1 entonces incompatible.',
      'Distingue recinto <b>acotado</b>, que cabe dentro de un c\u00edrculo, de recinto <b>no acotado</b>, que se escapa al infinito.'
    ],
      [0, 1, 2, 3].map(function (i) {
        var def = [[1, 0, 0, '>='], [0, 1, 0, '>='], [1, 1, 6, '<='], [2, 1, 8, '<=']][i];
        return '<div class="ap-row">' +
          '<label class="ap-lab"><input type="checkbox" data-role="on' + i + '" checked> R' + (i + 1) + '</label>' +
          mini('a' + i, 'a', def[0]) + mini('b' + i, 'b', def[1]) +
          selOp('op' + i, def[3]) + mini('c' + i, 'c', def[2]) + '</div>';
      }).join(''));

    live(root, out, function () {
      var cons = [], i;
      for (i = 0; i < 4; i++) {
        if (!get(root, 'on' + i).checked) continue;
        var a = nv(root, 'a' + i), b = nv(root, 'b' + i), c = nv(root, 'c' + i), op = val(root, 'op' + i);
        if (Math.abs(a) < 1e-12 && Math.abs(b) < 1e-12) continue;
        cons.push({ a: a, b: b, c: c, op: op });
      }
      if (!cons.length) throw new Error('activa al menos una restricci\u00f3n con coeficientes no nulos.');

      var h = step('Sistema de inecuaciones: ' + T('\\left\\{\\begin{array}{l}' +
        cons.map(function (k) {
          return lin2(k.a, k.b, 0).replace('=0', '') + (k.op === '<=' ? '\\leq' : '\\geq') + qt(k.c);
        }).join('\\\\') + '\\end{array}\\right.'));

      h += step('Se resuelve cada inecuaci\u00f3n por separado, obteniendo un semiplano, y despu\u00e9s se toma la ' +
        key('intersecci\u00f3n') + ' de todos ellos.');

      var W3 = { xmin: -4, xmax: 10, ymin: -4, ymax: 10 };
      var poly = feasible(cons, W3);
      if (poly.length < 3) {
        h += step(key('Recinto: ') + bad('vac\u00edo') +
          '. No existe ning\u00fan punto que cumpla todas las restricciones a la vez, luego el sistema es incompatible.');
        h += planeSVG(cons.map(function (k) {
          return { type: 'line', a: k.a, b: k.b, c: k.c, color: '#94a3b8' };
        }), W3);
        return h;
      }

      var verts = realVertices(poly, W3);
      var touchesBorder = poly.length !== verts.length;
      h += step(key('Recinto: ') + ok('no vac\u00edo') + '. ' +
        (touchesBorder ? 'Parece ' + key('no acotado') + ': se prolonga fuera de la ventana del dibujo.'
                       : 'Es ' + key('acotado') + ': queda encerrado por las rectas.'));
      if (verts.length) {
        h += step('V\u00e9rtices, que son cortes de dos rectas frontera: ' +
          verts.map(function (p) {
            return chip(T('\\left(' + qt(p[0]) + ',\\ ' + qt(p[1]) + '\\right)'));
          }).join(''));
      }
      h += planeSVG([{ type: 'poly', pts: poly, fill: '#2a9d8f', opacity: 0.25 }]
        .concat(cons.map(function (k, idx) {
          return { type: 'line', a: k.a, b: k.b, c: k.c, color: ['#2a76dd', '#e63946', '#8e44ad', '#f4a261'][idx % 4] };
        }))
        .concat(verts.length ? [{ type: 'points', pts: verts }] : []), W3, { alt: 'recinto soluci\u00f3n' });
      h += step(note('Los v\u00e9rtices son la clave de la programaci\u00f3n lineal que estudiar\u00e1s en segundo de Bachillerato.'));
      return h;
    });
  };

  /* ---------- Applet · Optimizar sobre el recinto ---------- */
  SY.optimiza = function (root) {
    var out = shell(root, 'Applet \u00b7 Optimizar sobre el recinto', [
      'Anticipo de la programaci\u00f3n lineal. Sobre un recinto acotado evaluamos una funci\u00f3n $F(x,y)=\\alpha x+\\beta y$ en cada v\u00e9rtice.',
      'El recinto de partida es $x\\geq 0$, $y\\geq 0$, $x+y\\leq 6$, $2x+y\\leq 8$. Cambia $\\alpha$ y $\\beta$ y observa d\u00f3nde se alcanza el m\u00e1ximo.',
      'Prueba $\\alpha=1$, $\\beta=1$; luego $\\alpha=3$, $\\beta=1$; luego $\\alpha=1$, $\\beta=3$. El v\u00e9rtice ganador cambia.',
      'Idea potente: si el recinto es acotado, el m\u00e1ximo y el m\u00ednimo de una funci\u00f3n lineal se alcanzan siempre en un v\u00e9rtice.'
    ],
      '<div class="ap-row">' + mini('al', '\u03b1', 3) + mini('be', '\u03b2', 1) + '</div>' +
      '<div class="ap-row">' + mini('c3', 'x+y \u2264', 6) + mini('c4', '2x+y \u2264', 8) + '</div>');

    live(root, out, function () {
      var al = nv(root, 'al'), be = nv(root, 'be'), c3 = nv(root, 'c3'), c4 = nv(root, 'c4');
      var cons = [
        { a: 1, b: 0, c: 0, op: '>=' },
        { a: 0, b: 1, c: 0, op: '>=' },
        { a: 1, b: 1, c: c3, op: '<=' },
        { a: 2, b: 1, c: c4, op: '<=' }
      ];
      var W3 = { xmin: -2, xmax: 10, ymin: -2, ymax: 10 };
      var poly = feasible(cons, W3);
      var h = step('Recinto: ' + T('\\left\\{\\begin{array}{l}x\\geq 0\\\\y\\geq 0\\\\x+y\\leq ' +
        qt(c3) + '\\\\2x+y\\leq ' + qt(c4) + '\\end{array}\\right.'));
      h += step('Funci\u00f3n objetivo: ' + T('F(x,y)=' + qt(al) + 'x+' + qt(be) + 'y'));
      if (poly.length < 3) return h + step(bad('El recinto es vac\u00edo') + ': no hay nada que optimizar.');

      var verts = poly.map(function (p) { return [snap(p[0]), snap(p[1])]; });
      var rows = verts.map(function (p) {
        var F = al * p[0] + be * p[1];
        return { p: p, F: F };
      });
      var maxF = Math.max.apply(null, rows.map(function (r) { return r.F; }));
      var minF = Math.min.apply(null, rows.map(function (r) { return r.F; }));

      h += '<table class="ap-tbl"><tr><th>V\u00e9rtice</th><th>' + T('F(x,y)') + '</th><th></th></tr>' +
        rows.map(function (r) {
          var tag = Math.abs(r.F - maxF) < 1e-9 ? ok('m\u00e1ximo')
            : Math.abs(r.F - minF) < 1e-9 ? note('m\u00ednimo') : '';
          return '<tr class="' + (Math.abs(r.F - maxF) < 1e-9 ? 'ap-sel-row' : '') + '"><td>' +
            T('\\left(' + qt(r.p[0]) + ',\\ ' + qt(r.p[1]) + '\\right)') + '</td><td>' +
            T(nt(r.F)) + '</td><td>' + tag + '</td></tr>';
        }).join('') + '</table>';

      h += step(key('M\u00e1ximo: ') + T(nt(maxF)) + ' \u00b7 ' + key('M\u00ednimo: ') + T(nt(minF)));
      h += planeSVG([{ type: 'poly', pts: poly, fill: '#2a9d8f', opacity: 0.22 }]
        .concat(cons.map(function (k, i) {
          return { type: 'line', a: k.a, b: k.b, c: k.c, color: ['#94a3b8', '#94a3b8', '#2a76dd', '#e63946'][i] };
        }))
        .concat([{ type: 'points', pts: verts }]), W3);
      return h;
    });
  };

  /* ---------- Applet · Diagnostico ---------- */
  SY.diagnostico = function (root) {
    var out = shell(root, 'Applet \u00b7 Diagn\u00f3stico del m\u00f3dulo', [
      'Applet de servicio: comprueba que KaTeX y <code>window.POLY</code> est\u00e1n disponibles y que el recorte de semiplanos funciona.',
      'Si las tres l\u00edneas salen en verde, el tema est\u00e1 listo para el aula.'
    ], '<div class="ap-row">' + mini('t', 'prueba c', 6) + '</div>');

    live(root, out, function () {
      var c = nv(root, 't');
      var h = step('KaTeX: ' + (window.katex ? ok('cargado') : bad('no cargado')) +
        ' \u00b7 autorenderizado: ' + (window.renderMathInElement ? ok('disponible') : bad('no disponible')));
      h += step('window.POLY: ' + (P ? ok('detectado') : note('no necesario en este tema')));
      var poly = feasible([
        { a: 1, b: 0, c: 0, op: '>=' }, { a: 0, b: 1, c: 0, op: '>=' },
        { a: 1, b: 1, c: c, op: '<=' }
      ], { xmin: -2, xmax: 10, ymin: -2, ymax: 10 });
      h += step('Recorte de semiplanos: ' + (poly.length >= 3 ? ok('correcto') : bad('fallo')) +
        ', pol\u00edgono con ' + poly.length + ' v\u00e9rtices.');
      h += step('Prueba de notaci\u00f3n: ' + T(sysTex(1, 1, 1, 2, -3, 2)) + ' y ' +
        T('\\left(-\\infty,5\\right]\\cup\\left[7,+\\infty\\right)'));
      return h;
    });
  };

  /* =================================================================
     9. ARRANQUE
     ================================================================= */

  function boot() {
    var nodes = document.querySelectorAll('[data-applet-sys]');
    Array.prototype.forEach.call(nodes, function (node) {
      var k = node.getAttribute('data-applet-sys');
      if (typeof SY[k] === 'function') {
        try { SY[k](node); }
        catch (e) {
          node.classList.add('applet');
          node.innerHTML = errBox('el applet \u00ab' + k + '\u00bb no ha podido iniciarse: ' +
            (e && e.message ? e.message : e));
        }
      } else {
        node.classList.add('applet');
        node.innerHTML = errBox('no existe ning\u00fan applet con la clave \u00ab' + k + '\u00bb.');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.SYSAPP = {
    classify: classify, feasible: feasible, clipHalf: clipHalf,
    vertices: realVertices, applets: SY, engine: P
  };
})();
