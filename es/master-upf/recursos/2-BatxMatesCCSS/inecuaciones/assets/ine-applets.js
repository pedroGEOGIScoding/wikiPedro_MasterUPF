/* =====================================================================
   ine-applets.js — MOTOR DEL TEMA 4 INECUACIONES Y PROGRAMACIÓN LINEAL
   2.º Batx Mates CCSS
   Ubicación: 2-BatxMatesCCSS/inecuaciones/assets/ine-applets.js

   QUÉ ES
     Motor propio en JavaScript plano, sin OJS y sin dependencias de red.
     Expone window.INE con dos bloques:

       a) Aritmética EXACTA de fracciones, igual que en los temas 1, 2
          y 3. Aquí es imprescindible porque los vértices de una región
          factible salen casi siempre fraccionarios.

       b) TRAZADOR SVG propio, novedad de este tema. Genera el dibujo
          como texto SVG y lo inyecta en el applet: rejilla, ejes,
          rectas, semiplanos, región factible, vértices y rectas de
          nivel. Sin librerías externas, así que funciona sin conexión.

   DEPENDENCIAS (vía assets/_scripts.html)
     ../assets/applets.css · assets/ine-applets.css
     ../assets/katex/katex.min.css · ../assets/katex/katex.min.js

   INSERCIÓN EN EL .qmd
     <div data-applet-ine="clave"></div>

   CLAVES DE ESTE ARCHIVO (partes 1, 2 y 3)
     ine1g · ine2g · sisune
     semiplano · metodos · recta
     region · tiposregion · vertices

   ARRANQUE
     DOMContentLoaded + setTimeout(boot, 0), con guarda data-mounted.
   ===================================================================== */

(function () {
  'use strict';

  /* ==================================================================
     1. FRACCIONES EXACTAS
     ================================================================== */

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = a % b; a = b; b = t; }
    return a || 1;
  }

  function R(n, d) {
    if (d === undefined) d = 1;
    if (d === 0) return { n: 0, d: 1, bad: true };
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d);
    return { n: n / g, d: d / g };
  }

  var F = {
    add: function (a, b) { return R(a.n * b.d + b.n * a.d, a.d * b.d); },
    sub: function (a, b) { return R(a.n * b.d - b.n * a.d, a.d * b.d); },
    mul: function (a, b) { return R(a.n * b.n, a.d * b.d); },
    div: function (a, b) { return b.n === 0 ? R(0, 0) : R(a.n * b.d, a.d * b.n); },
    neg: function (a) { return R(-a.n, a.d); },
    isZero: function (a) { return a.n === 0; },
    eq: function (a, b) { return a.n * b.d === b.n * a.d; },
    lt: function (a, b) { return a.n * b.d < b.n * a.d; },
    le: function (a, b) { return a.n * b.d <= b.n * a.d; },
    num: function (a) { return a.n / a.d; },
    str: function (a) { return a.d === 1 ? String(a.n) : a.n + '/' + a.d; },
    tex: function (a) {
      if (a.d === 1) return String(a.n);
      return (a.n < 0 ? '-' : '') + '\\tfrac{' + Math.abs(a.n) + '}{' + a.d + '}';
    }
  };

  function parseEntry(s) {
    s = String(s).trim();
    if (!s.length) return null;
    if (/^[+-]?\d+$/.test(s)) return R(parseInt(s, 10), 1);
    var fr = s.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
    if (fr) { var d = parseInt(fr[2], 10); return d === 0 ? null : R(parseInt(fr[1], 10), d); }
    var de = s.match(/^([+-]?)(\d*)\.(\d+)$/);
    if (de) {
      var den = Math.pow(10, de[3].length);
      var num = (de[2] === '' ? 0 : parseInt(de[2], 10)) * den + parseInt(de[3], 10);
      return R(de[1] === '-' ? -num : num, den);
    }
    return null;
  }

  /* ==================================================================
     2. LECTURA DE INECUACIONES
     Formato: a b c signo   →   ax + by (signo) c
     El signo se escribe <=, >=, < o >
     ================================================================== */

  function parseIne(txt) {
    var s = String(txt == null ? '' : txt).trim();
    if (!s.length) return { err: 'Escribe una inecuaci\u00f3n.' };
    var m = s.match(/^(.+?)\s*(<=|>=|=<|=>|<|>)\s*(.+)$/);
    if (!m) {
      return { err: 'Falta el signo de desigualdad. Escribe los dos coeficientes, el signo y el t\u00e9rmino: ' +
        'por ejemplo <code>2 1 &lt;= 8</code> para ' + esc('2x + y ≤ 8') + '.' };
    }
    var izq = m[1].trim().split(/[\s,]+/).filter(function (c) { return c.length; });
    if (izq.length !== 2) {
      return { err: 'A la izquierda del signo van <b>dos</b> coeficientes, el de ' +
        'x y el de y, separados por un espacio. Si una inc\u00f3gnita no aparece, escribe <code>0</code>.' };
    }
    var a = parseEntry(izq[0]), b = parseEntry(izq[1]), c = parseEntry(m[3].trim());
    if (!a || !b || !c) return { err: 'Alg\u00fan n\u00famero no se entiende. Usa enteros, decimales con punto o fracciones como 3/4.' };
    var sg = m[2].replace('=<', '<=').replace('=>', '>=');
    if (F.isZero(a) && F.isZero(b)) {
      return { err: 'Los dos coeficientes son cero, as\u00ed que no hay inecuaci\u00f3n lineal: queda ' +
        'una comparaci\u00f3n entre n\u00fameros.' };
    }
    return { a: a, b: b, c: c, sg: sg, estricta: (sg === '<' || sg === '>') };
  }

  function parseSis(txt) {
    var lineas = String(txt == null ? '' : txt).trim().split(/[\n;]+/)
      .map(function (r) { return r.trim(); })
      .filter(function (r) { return r.length > 0; });
    if (!lineas.length) return { err: 'Escribe al menos una inecuaci\u00f3n, una por l\u00ednea.' };
    var res = [];
    for (var i = 0; i < lineas.length; i++) {
      var p = parseIne(lineas[i]);
      if (p.err) return { err: 'En la inecuaci\u00f3n ' + (i + 1) + ': ' + p.err };
      res.push(p);
    }
    return { L: res, m: res.length };
  }

  /* Normaliza a la forma ax + by ≤ c, para trabajar siempre igual */
  function normal(ine) {
    if (ine.sg === '<=' || ine.sg === '<') return { a: ine.a, b: ine.b, c: ine.c, estricta: ine.estricta };
    return { a: F.neg(ine.a), b: F.neg(ine.b), c: F.neg(ine.c), estricta: ine.estricta };
  }

  /* ¿Cumple el punto (x,y) la inecuación? */
  function cumple(ine, x, y) {
    var v = F.add(F.mul(ine.a, x), F.mul(ine.b, y));
    if (ine.sg === '<=') return F.le(v, ine.c);
    if (ine.sg === '<') return F.lt(v, ine.c);
    if (ine.sg === '>=') return F.le(ine.c, v);
    return F.lt(ine.c, v);
  }

  function cumpleTodas(L, x, y) {
    for (var i = 0; i < L.length; i++) if (!cumple(L[i], x, y)) return false;
    return true;
  }

  /* Corte de dos rectas ax+by=c. Devuelve null si son paralelas */
  function corte(i1, i2) {
    var det = F.sub(F.mul(i1.a, i2.b), F.mul(i1.b, i2.a));
    if (F.isZero(det)) return null;
    var x = F.div(F.sub(F.mul(i1.c, i2.b), F.mul(i1.b, i2.c)), det);
    var y = F.div(F.sub(F.mul(i1.a, i2.c), F.mul(i1.c, i2.a)), det);
    return { x: x, y: y };
  }

  /* VÉRTICES de la región factible: cortes que cumplen todas las inecuaciones */
  function vertices(L) {
    var V = [];
    for (var i = 0; i < L.length; i++) {
      for (var j = i + 1; j < L.length; j++) {
        var p = corte(L[i], L[j]);
        if (!p) continue;
        /* Comprobamos con desigualdades amplias: el vértice está en la frontera */
        var ok = true;
        for (var k = 0; k < L.length; k++) {
          var v = F.add(F.mul(L[k].a, p.x), F.mul(L[k].b, p.y));
          var amplio = (L[k].sg === '<=' || L[k].sg === '<') ? F.le(v, L[k].c) : F.le(L[k].c, v);
          if (!amplio) { ok = false; break; }
        }
        if (!ok) continue;
        var rep = false;
        for (var q = 0; q < V.length; q++) if (F.eq(V[q].x, p.x) && F.eq(V[q].y, p.y)) { rep = true; break; }
        if (!rep) V.push({ x: p.x, y: p.y, de: [i, j] });
      }
    }
    /* Orden angular respecto del centroide, para poder dibujar el polígono */
    if (V.length > 2) {
      var cx = 0, cy = 0;
      V.forEach(function (v) { cx += F.num(v.x); cy += F.num(v.y); });
      cx /= V.length; cy /= V.length;
      V.sort(function (p, q) {
        return Math.atan2(F.num(p.y) - cy, F.num(p.x) - cx) - Math.atan2(F.num(q.y) - cy, F.num(q.x) - cx);
      });
    }
    return V;
  }

  /* ¿La región es acotada? Heurística: muestreo en un radio grande */
  function acotada(L, lim) {
    lim = lim || 400;
    var pasos = 72;
    for (var t = 0; t < pasos; t++) {
      var ang = 2 * Math.PI * t / pasos;
      var x = R(Math.round(lim * Math.cos(ang)));
      var y = R(Math.round(lim * Math.sin(ang)));
      if (cumpleTodas(L, x, y)) return false;
    }
    return true;
  }

  /* ¿Existe algún punto que cumpla todas? Muestreo + vértices */
  function noVacia(L, lim) {
    lim = lim || 40;
    var V = vertices(L);
    if (V.length) {
      /* Si hay vértices, comprobamos el centroide o un punto interior cercano */
      if (V.length === 1) return cumpleTodasAmplio(L, V[0].x, V[0].y);
      var cx = 0, cy = 0;
      V.forEach(function (v) { cx += F.num(v.x); cy += F.num(v.y); });
      cx /= V.length; cy /= V.length;
      var p = parseEntry(String(Math.round(cx * 1000) / 1000));
      var q = parseEntry(String(Math.round(cy * 1000) / 1000));
      if (p && q && cumpleTodasAmplio(L, p, q)) return true;
    }
    for (var i = -lim; i <= lim; i++) {
      for (var j = -lim; j <= lim; j++) {
        if (cumpleTodas(L, R(i), R(j))) return true;
      }
    }
    return false;
  }

  function cumpleTodasAmplio(L, x, y) {
    for (var k = 0; k < L.length; k++) {
      var v = F.add(F.mul(L[k].a, x), F.mul(L[k].b, y));
      var amplio = (L[k].sg === '<=' || L[k].sg === '<') ? F.le(v, L[k].c) : F.le(L[k].c, v);
      if (!amplio) return false;
    }
    return true;
  }

  /* ==================================================================
     3. TRAZADOR SVG
     ================================================================== */

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* Crea un lienzo con su transformación de coordenadas */
  function lienzo(opts) {
    opts = opts || {};
    var W = opts.W || 340, H = opts.H || 300;
    var xmin = (opts.xmin === undefined) ? -2 : opts.xmin;
    var xmax = (opts.xmax === undefined) ? 10 : opts.xmax;
    var ymin = (opts.ymin === undefined) ? -2 : opts.ymin;
    var ymax = (opts.ymax === undefined) ? 10 : opts.ymax;
    var mL = 30, mR = 12, mT = 12, mB = 24;
    var iw = W - mL - mR, ih = H - mT - mB;
    function X(x) { return mL + (x - xmin) / (xmax - xmin) * iw; }
    function Y(y) { return mT + (ymax - y) / (ymax - ymin) * ih; }
    return {
      W: W, H: H, xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax,
      X: X, Y: Y, partes: [],
      add: function (s) { this.partes.push(s); return this; }
    };
  }

  function ejes(L) {
    var h = '';
    /* Rejilla */
    var paso = (L.xmax - L.xmin > 40) ? 10 : ((L.xmax - L.xmin > 16) ? 5 : 1);
    for (var x = Math.ceil(L.xmin / paso) * paso; x <= L.xmax; x += paso) {
      var cls = (x % (paso * 5) === 0) ? 'plot-grid-5' : 'plot-grid';
      h += '<line class="' + cls + '" x1="' + L.X(x).toFixed(1) + '" y1="' + L.Y(L.ymin).toFixed(1) +
        '" x2="' + L.X(x).toFixed(1) + '" y2="' + L.Y(L.ymax).toFixed(1) + '"/>';
    }
    var pasoY = (L.ymax - L.ymin > 40) ? 10 : ((L.ymax - L.ymin > 16) ? 5 : 1);
    for (var y = Math.ceil(L.ymin / pasoY) * pasoY; y <= L.ymax; y += pasoY) {
      var cls2 = (y % (pasoY * 5) === 0) ? 'plot-grid-5' : 'plot-grid';
      h += '<line class="' + cls2 + '" x1="' + L.X(L.xmin).toFixed(1) + '" y1="' + L.Y(y).toFixed(1) +
        '" x2="' + L.X(L.xmax).toFixed(1) + '" y2="' + L.Y(y).toFixed(1) + '"/>';
    }
    /* Ejes */
    var y0 = Math.max(L.ymin, Math.min(L.ymax, 0));
    var x0 = Math.max(L.xmin, Math.min(L.xmax, 0));
    h += '<line class="plot-axis" x1="' + L.X(L.xmin).toFixed(1) + '" y1="' + L.Y(y0).toFixed(1) +
      '" x2="' + L.X(L.xmax).toFixed(1) + '" y2="' + L.Y(y0).toFixed(1) + '"/>';
    h += '<line class="plot-axis" x1="' + L.X(x0).toFixed(1) + '" y1="' + L.Y(L.ymin).toFixed(1) +
      '" x2="' + L.X(x0).toFixed(1) + '" y2="' + L.Y(L.ymax).toFixed(1) + '"/>';
    /* Etiquetas de los ejes */
    h += '<text class="plot-lab-ax" x="' + (L.X(L.xmax) - 10) + '" y="' + (L.Y(y0) + 15) + '">x</text>';
    h += '<text class="plot-lab-ax" x="' + (L.X(x0) + 6) + '" y="' + (L.Y(L.ymax) + 12) + '">y</text>';
    /* Marcas numéricas, pocas para no saturar */
    var pasoT = paso * ((L.xmax - L.xmin > 16) ? 2 : 2);
    for (var xt = Math.ceil(L.xmin / pasoT) * pasoT; xt <= L.xmax; xt += pasoT) {
      if (xt === 0) continue;
      h += '<text class="plot-lab" text-anchor="middle" x="' + L.X(xt).toFixed(1) + '" y="' +
        (L.Y(y0) + 13) + '">' + xt + '</text>';
    }
    var pasoTY = pasoY * ((L.ymax - L.ymin > 16) ? 2 : 2);
    for (var yt = Math.ceil(L.ymin / pasoTY) * pasoTY; yt <= L.ymax; yt += pasoTY) {
      if (yt === 0) continue;
      h += '<text class="plot-lab" text-anchor="end" x="' + (L.X(x0) - 4) + '" y="' +
        (L.Y(yt) + 3.5).toFixed(1) + '">' + yt + '</text>';
    }
    return L.add(h);
  }

  /* Dibuja la recta ax+by=c recortada al lienzo */
  function recta(L, ine, cls) {
    var a = F.num(ine.a), b = F.num(ine.b), c = F.num(ine.c);
    var pts = [];
    if (Math.abs(b) > 1e-12) {
      pts.push({ x: L.xmin, y: (c - a * L.xmin) / b });
      pts.push({ x: L.xmax, y: (c - a * L.xmax) / b });
    }
    if (Math.abs(a) > 1e-12) {
      pts.push({ x: (c - b * L.ymin) / a, y: L.ymin });
      pts.push({ x: (c - b * L.ymax) / a, y: L.ymax });
    }
    var dentro = pts.filter(function (p) {
      return p.x >= L.xmin - 1e-9 && p.x <= L.xmax + 1e-9 && p.y >= L.ymin - 1e-9 && p.y <= L.ymax + 1e-9;
    });
    if (dentro.length < 2) return L;
    var p1 = dentro[0], p2 = dentro[dentro.length - 1];
    var clase = (cls || 'plot-line') + (ine.estricta ? '-dash' : '');
    if (ine.estricta) clase = 'plot-line-dash' + (cls && cls !== 'plot-line' ? ' ' + cls : '');
    else clase = 'plot-line' + (cls && cls !== 'plot-line' ? ' ' + cls : '');
    return L.add('<line class="' + clase + '" x1="' + L.X(p1.x).toFixed(1) + '" y1="' + L.Y(p1.y).toFixed(1) +
      '" x2="' + L.X(p2.x).toFixed(1) + '" y2="' + L.Y(p2.y).toFixed(1) + '"/>');
  }

  /* Sombrea el semiplano de una inecuación, recortado al lienzo */
  function semiplano(L, ine) {
    /* Recortamos el rectángulo del lienzo contra la inecuación (Sutherland-Hodgman) */
    var poly = [
      { x: L.xmin, y: L.ymin }, { x: L.xmax, y: L.ymin },
      { x: L.xmax, y: L.ymax }, { x: L.xmin, y: L.ymax }
    ];
    var nn = normal(ine);
    var a = F.num(nn.a), b = F.num(nn.b), c = F.num(nn.c);
    function f(p) { return a * p.x + b * p.y - c; }
    var out = [];
    for (var i = 0; i < poly.length; i++) {
      var P = poly[i], Q = poly[(i + 1) % poly.length];
      var fp = f(P), fq = f(Q);
      if (fp <= 1e-12) out.push(P);
      if ((fp <= 1e-12) !== (fq <= 1e-12)) {
        var t = fp / (fp - fq);
        out.push({ x: P.x + t * (Q.x - P.x), y: P.y + t * (Q.y - P.y) });
      }
    }
    if (out.length < 3) return L;
    var d = out.map(function (p) { return L.X(p.x).toFixed(1) + ',' + L.Y(p.y).toFixed(1); }).join(' ');
    return L.add('<polygon class="plot-half" points="' + d + '"/>');
  }

  /* Dibuja el polígono de la región factible a partir de sus vértices */
  function region(L, V) {
    if (!V || V.length < 3) return L;
    var d = V.map(function (v) {
      return L.X(F.num(v.x)).toFixed(1) + ',' + L.Y(F.num(v.y)).toFixed(1);
    }).join(' ');
    return L.add('<polygon class="plot-region" points="' + d + '"/>');
  }

  /* Región no acotada: recorta el lienzo contra todas las inecuaciones */
  function regionRecorte(L, Ls) {
    var poly = [
      { x: L.xmin, y: L.ymin }, { x: L.xmax, y: L.ymin },
      { x: L.xmax, y: L.ymax }, { x: L.xmin, y: L.ymax }
    ];
    Ls.forEach(function (ine) {
      var nn = normal(ine);
      var a = F.num(nn.a), b = F.num(nn.b), c = F.num(nn.c);
      function f(p) { return a * p.x + b * p.y - c; }
      var out = [];
      for (var i = 0; i < poly.length; i++) {
        var P = poly[i], Q = poly[(i + 1) % poly.length];
        var fp = f(P), fq = f(Q);
        if (fp <= 1e-9) out.push(P);
        if ((fp <= 1e-9) !== (fq <= 1e-9)) {
          var t = fp / (fp - fq);
          out.push({ x: P.x + t * (Q.x - P.x), y: P.y + t * (Q.y - P.y) });
        }
      }
      poly = out;
    });
    if (poly.length < 3) return L;
    var d = poly.map(function (p) { return L.X(p.x).toFixed(1) + ',' + L.Y(p.y).toFixed(1); }).join(' ');
    return L.add('<polygon class="plot-region" points="' + d + '"/>');
  }

  function puntos(L, V, optIdx) {
    var h = '', letras = 'ABCDEFGH';
    V.forEach(function (v, i) {
      var cx = L.X(F.num(v.x)), cy = L.Y(F.num(v.y));
      if (cx < 0 || cx > L.W || cy < 0 || cy > L.H) return;
      var cls = (optIdx !== undefined && optIdx.indexOf(i) >= 0) ? 'plot-vertex-opt' : 'plot-vertex';
      h += '<circle class="' + cls + '" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="4.5"/>';
      h += '<text class="plot-vlab" x="' + (cx + 7).toFixed(1) + '" y="' + (cy - 5).toFixed(1) + '">' +
        (letras[i] || String(i + 1)) + '</text>';
    });
    return L.add(h);
  }

  /* Recta de nivel px+qy=k */
  function nivel(L, p, q, k, cls) {
    var pts = [];
    if (Math.abs(q) > 1e-12) {
      pts.push({ x: L.xmin, y: (k - p * L.xmin) / q });
      pts.push({ x: L.xmax, y: (k - p * L.xmax) / q });
    }
    if (Math.abs(p) > 1e-12) {
      pts.push({ x: (k - q * L.ymin) / p, y: L.ymin });
      pts.push({ x: (k - q * L.ymax) / p, y: L.ymax });
    }
    var dentro = pts.filter(function (pt) {
      return pt.x >= L.xmin - 1e-9 && pt.x <= L.xmax + 1e-9 && pt.y >= L.ymin - 1e-9 && pt.y <= L.ymax + 1e-9;
    });
    if (dentro.length < 2) return L;
    var A = dentro[0], B = dentro[dentro.length - 1];
    return L.add('<line class="' + (cls || 'plot-level') + '" x1="' + L.X(A.x).toFixed(1) +
      '" y1="' + L.Y(A.y).toFixed(1) + '" x2="' + L.X(B.x).toFixed(1) + '" y2="' + L.Y(B.y).toFixed(1) + '"/>');
  }

  function svg(L) {
    return '<div class="plot-box"><svg width="' + L.W + '" height="' + L.H +
      '" viewBox="0 0 ' + L.W + ' ' + L.H + '" role="img">' + L.partes.join('') + '</svg></div>';
  }

  /* Ventana automática a partir de los vértices */
  function ventana(V, extra) {
    extra = extra || 2;
    if (!V || !V.length) return { xmin: -2, xmax: 10, ymin: -2, ymax: 10 };
    var xs = V.map(function (v) { return F.num(v.x); });
    var ys = V.map(function (v) { return F.num(v.y); });
    var x0 = Math.min.apply(null, xs.concat([0])), x1 = Math.max.apply(null, xs.concat([0]));
    var y0 = Math.min.apply(null, ys.concat([0])), y1 = Math.max.apply(null, ys.concat([0]));
    var dx = Math.max(1, x1 - x0), dy = Math.max(1, y1 - y0);
    var mx = Math.max(dx, dy) * 0.15 + extra;
    return {
      xmin: Math.floor(x0 - mx), xmax: Math.ceil(x1 + mx),
      ymin: Math.floor(y0 - mx), ymax: Math.ceil(y1 + mx)
    };
  }

  function leyenda(items) {
    var h = '<div class="plot-key">';
    items.forEach(function (it) {
      h += '<div><span class="chip ' + it[0] + '"></span>' + it[1] + '</div>';
    });
    return h + '</div>';
  }

  /* ==================================================================
     4. SALIDA CON KaTeX, SIN AUTO-RENDER
     ================================================================== */

  function k(tex) { return '<span data-tex="' + esc(tex) + '"></span>'; }
  function kd(tex) { return '<span data-tex="' + esc(tex) + '" data-display="1"></span>'; }

  function renderTex(root) {
    if (!window.katex) return;
    var nodes = root.querySelectorAll('[data-tex]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.getAttribute('data-done') === '1') continue;
      try {
        window.katex.render(el.getAttribute('data-tex'), el, {
          throwOnError: false, displayMode: el.hasAttribute('data-display'), output: 'html'
        });
        el.setAttribute('data-done', '1');
      } catch (e) { el.textContent = el.getAttribute('data-tex'); }
    }
  }

  var SG = { '<=': '\\leq', '>=': '\\geq', '<': '<', '>': '>' };

  function texIne(ine) {
    var t = '';
    if (!F.isZero(ine.a)) {
      var ca = ine.a;
      t += (F.eq(ca, R(1)) ? '' : (F.eq(ca, R(-1)) ? '-' : F.tex(ca))) + 'x';
    }
    if (!F.isZero(ine.b)) {
      var cb = ine.b;
      if (t !== '') t += (F.num(cb) < 0 ? ' - ' : ' + ');
      var ab = F.num(cb) < 0 ? F.neg(cb) : cb;
      t += (F.eq(ab, R(1)) ? '' : F.tex(ab)) + 'y';
    }
    if (t === '') t = '0';
    return t + ' ' + SG[ine.sg] + ' ' + F.tex(ine.c);
  }

  function texSis(L) {
    return '\\left\\{\\begin{aligned}' + L.map(function (i) {
      return texIne(i).replace(/(\\leq|\\geq|<|>)/, '&\\;$1\\;');
    }).join(' \\\\ ') + '\\end{aligned}\\right.';
  }

  function texPunto(v) { return '\\left(' + F.tex(v.x) + ',\\; ' + F.tex(v.y) + '\\right)'; }

  function ok(m) { return '<div class="mx-ok">' + m + '</div>'; }
  function info(m) { return '<div class="mx-info">' + m + '</div>'; }
  function warn(m) { return '<div class="mx-warn">' + m + '</div>'; }
  function err(m) { return '<div class="mx-bad ap-err">' + m + '</div>'; }

  /* ==================================================================
     5. CONSTRUCTOR DE APPLETS
     ================================================================== */

  var registry = {};
  function reg(key, fn) { registry[key] = fn; }

  function build(node, title, instr, fields, compute) {
    node.classList.add('applet');
    node.innerHTML = '<h4 class="mx-title">' + title + '</h4>' +
      (instr ? '<div class="mx-instr">' + instr + '</div>' : '') +
      '<div class="mx-inputs"></div><div class="mx-out ap-out"></div>';
    var box = node.querySelector('.mx-inputs');
    var out = node.querySelector('.mx-out');
    var ctl = {};

    fields.forEach(function (f) {
      var wrap = document.createElement('label');
      wrap.className = 'mx-field';
      var cap = document.createElement('span');
      cap.textContent = f.label;
      wrap.appendChild(cap);
      var el;
      if (f.type === 'select') {
        el = document.createElement('select');
        f.options.forEach(function (o) {
          var op = document.createElement('option');
          op.value = o; op.textContent = o; el.appendChild(op);
        });
        if (f.value) el.value = f.value;
      } else if (f.type === 'range') {
        el = document.createElement('input');
        el.type = 'range'; el.min = f.min; el.max = f.max;
        el.step = f.step || 1; el.value = f.value;
      } else if (f.type === 'text') {
        el = document.createElement('input');
        el.type = 'text'; el.value = f.value || '';
      } else {
        el = document.createElement('textarea');
        el.rows = f.rows || 3; el.value = f.value || ''; el.spellcheck = false;
      }
      el.className = 'mx-in';
      wrap.appendChild(el);
      if (f.type === 'range') {
        var live = document.createElement('span');
        live.className = 'mx-mono';
        live.textContent = f.value;
        el.addEventListener('input', function () { live.textContent = el.value; });
        wrap.appendChild(live);
      }
      box.appendChild(wrap);
      ctl[f.id] = el;
      el.addEventListener('input', run);
      el.addEventListener('change', run);
    });

    function run() {
      var v = {};
      for (var key in ctl) v[key] = ctl[key].value;
      var html;
      try { html = compute(v); }
      catch (e) { html = err('Error inesperado en el applet: ' + e.message); }
      out.innerHTML = html;
      renderTex(out);
    }
    run();
    return { out: out, ctl: ctl, run: run };
  }

  /* Texto de formato, reutilizado en casi todos los applets */
  var FORMATO = 'Escribe cada inecuaci\u00f3n como <b>dos coeficientes, el signo y el t\u00e9rmino</b>: ' +
    'primero el coeficiente de ' + k('x') + ', luego el de ' + k('y') + ', despu\u00e9s <code>&lt;=</code>, ' +
    '<code>&gt;=</code>, <code>&lt;</code> o <code>&gt;</code>, y por \u00faltimo el n\u00famero. ' +
    'Si una inc\u00f3gnita no aparece, escribe <code>0</code>.<br>' +
    'Ejemplos: ' + k('2x+y \\leq 8') + ' se escribe <code>2 1 &lt;= 8</code> \u00b7 ' +
    k('x \\geq 0') + ' se escribe <code>1 0 &gt;= 0</code> \u00b7 ' +
    k('y < 3') + ' se escribe <code>0 1 &lt; 3</code>.';

  var FORMATO_SIS = FORMATO + '<br><b>Una inecuaci\u00f3n por l\u00ednea.</b>';

  /* ==================================================================
     PARTE 1 · INECUACIONES
     ================================================================== */

  reg('ine1g', function (node) {
    build(node, 'Applet \u00b7 Inecuaci\u00f3n de primer grado',
      'Escribe una inecuaci\u00f3n con <b>una sola inc\u00f3gnita</b>: coeficiente, signo y t\u00e9rmino. ' +
      'Por ejemplo <code>3 &lt;= 9</code> representa ' + k('3x \\leq 9') + '. ' +
      'Prueba con coeficiente <b>negativo</b>, como <code>-3 &lt;= 9</code>, y observa qu\u00e9 le pasa al signo.',
      [
        { id: 'a', label: 'Coeficiente de x', type: 'text', value: '3' },
        { id: 'sg', label: 'Signo', type: 'select', value: '<=', options: ['<=', '>=', '<', '>'] },
        { id: 'c', label: 'T\u00e9rmino independiente', type: 'text', value: '9' }
      ],
      function (v) {
        var a = parseEntry(v.a), c = parseEntry(v.c);
        if (!a) return err('El coeficiente no vale. Usa un entero, un decimal con punto o una fracci\u00f3n.');
        if (!c) return err('El t\u00e9rmino independiente no vale.');
        var h = '<div class="mx-flex">' + kd(F.tex(a) + 'x \\;' + SG[v.sg] + '\\; ' + F.tex(c)) + '</div>';
        if (F.isZero(a)) {
          var cierto = (v.sg === '<=') ? F.le(R(0), c) : (v.sg === '<') ? F.lt(R(0), c)
            : (v.sg === '>=') ? F.le(c, R(0)) : F.lt(c, R(0));
          return h + (cierto
            ? warn('El coeficiente es cero, as\u00ed que la inecuaci\u00f3n queda ' +
              k('0 \\;' + SG[v.sg] + '\\; ' + F.tex(c)) + ', que es <b>cierta</b>. ' +
              'La cumple cualquier valor de ' + k('x') + ': la soluci\u00f3n es todo ' + k('\\mathbb{R}') + '.')
            : err('El coeficiente es cero y la inecuaci\u00f3n queda ' +
              k('0 \\;' + SG[v.sg] + '\\; ' + F.tex(c)) + ', que es <b>falsa</b>. ' +
              'No hay ning\u00fan valor de ' + k('x') + ' que la cumpla.'));
        }
        var q = F.div(c, a);
        var neg = F.num(a) < 0;
        var sgFinal = v.sg;
        if (neg) {
          sgFinal = (v.sg === '<=') ? '>=' : (v.sg === '>=') ? '<=' : (v.sg === '<') ? '>' : '<';
        }
        h += '<p><b>Paso 1.</b> Despejamos ' + k('x') + ' dividiendo entre ' + k(F.tex(a)) + ':</p>';
        h += kd('x \\;' + SG[sgFinal] + '\\; \\frac{' + F.tex(c) + '}{' + F.tex(a) + '} = ' + F.tex(q));
        if (neg) {
          h += warn('<b>Atenci\u00f3n al signo.</b> Como hemos dividido entre un n\u00famero <b>negativo</b>, ' +
            'la desigualdad ha <b>cambiado de sentido</b>: de ' + k(SG[v.sg]) + ' ha pasado a ' + k(SG[sgFinal]) + '.');
        } else {
          h += ok('El coeficiente es positivo, as\u00ed que la desigualdad <b>mantiene</b> su sentido.');
        }
        var abierto = (sgFinal === '<' || sgFinal === '>');
        var sol = (sgFinal === '<=' || sgFinal === '<')
          ? '\\left(-\\infty,\\; ' + F.tex(q) + (abierto ? '\\right)' : '\\right]')
          : (abierto ? '\\left(' : '\\left[') + F.tex(q) + ',\\; +\\infty\\right)';
        h += '<p><b>Soluci\u00f3n:</b></p>' + kd(sol);
        /* Recta real */
        var Lz = lienzo({ W: 340, H: 90, xmin: F.num(q) - 6, xmax: F.num(q) + 6, ymin: -1, ymax: 1 });
        var hh = '';
        var paso = 1;
        for (var xx = Math.ceil(Lz.xmin); xx <= Lz.xmax; xx += paso) {
          hh += '<line class="plot-tick" x1="' + Lz.X(xx).toFixed(1) + '" y1="' + (Lz.Y(0) - 4) +
            '" x2="' + Lz.X(xx).toFixed(1) + '" y2="' + (Lz.Y(0) + 4) + '"/>';
          hh += '<text class="plot-lab" text-anchor="middle" x="' + Lz.X(xx).toFixed(1) + '" y="' +
            (Lz.Y(0) + 17) + '">' + xx + '</text>';
        }
        hh += '<line class="plot-axis" x1="' + Lz.X(Lz.xmin) + '" y1="' + Lz.Y(0) +
          '" x2="' + Lz.X(Lz.xmax) + '" y2="' + Lz.Y(0) + '"/>';
        var qn = F.num(q);
        var x1 = (sgFinal === '<=' || sgFinal === '<') ? Lz.xmin : qn;
        var x2 = (sgFinal === '<=' || sgFinal === '<') ? qn : Lz.xmax;
        hh += '<line style="stroke:#2e7d32;stroke-width:5;opacity:.55" x1="' + Lz.X(x1).toFixed(1) +
          '" y1="' + Lz.Y(0) + '" x2="' + Lz.X(x2).toFixed(1) + '" y2="' + Lz.Y(0) + '"/>';
        hh += '<circle cx="' + Lz.X(qn).toFixed(1) + '" cy="' + Lz.Y(0) + '" r="5" fill="' +
          (abierto ? '#fff' : '#c62828') + '" stroke="#c62828" stroke-width="2"/>';
        Lz.add(hh);
        h += '<div class="plot-wrap">' + svg(Lz) +
          leyenda([['chip-region', 'Intervalo soluci\u00f3n'],
            ['chip-' + (abierto ? 'vertex' : 'opt'), abierto ? 'Extremo <b>abierto</b>: no entra' : 'Extremo <b>cerrado</b>: s\u00ed entra']]) + '</div>';
        h += info('Regla que hay que tener siempre presente: al multiplicar o dividir los dos miembros ' +
          'de una inecuaci\u00f3n por un n\u00famero <b>negativo</b>, el signo de la desigualdad se invierte. ' +
          'Con las ecuaciones eso no pasaba, y es el error m\u00e1s frecuente al empezar el tema.');
        return h;
      });
  });

  reg('ine2g', function (node) {
    build(node, 'Applet \u00b7 Inecuaci\u00f3n de segundo grado',
      'Escribe los tres coeficientes de ' + k('ax^2+bx+c') + ' y elige el signo. El applet resuelve la ' +
      'ecuaci\u00f3n asociada, divide la recta real en intervalos y comprueba cada uno. ' +
      'Ejemplos del libro: <code>1 -1 -2</code> con ' + k('\\leq 0') + ' \u00b7 <code>1 -2 1</code> con ' +
      k('\\geq 0') + ' \u00b7 <code>1 2 3</code> con ' + k('< 0') + ', que no tiene soluci\u00f3n.',
      [
        { id: 'abc', label: 'Coeficientes a b c', type: 'text', value: '1 -1 -2' },
        { id: 'sg', label: 'Signo', type: 'select', value: '<=', options: ['<=', '>=', '<', '>'] }
      ],
      function (v) {
        var p = String(v.abc).trim().split(/[\s,]+/).filter(function (s) { return s.length; });
        if (p.length !== 3) return err('Escribe <b>tres</b> coeficientes separados por espacios: a, b y c.');
        var a = parseEntry(p[0]), b = parseEntry(p[1]), c = parseEntry(p[2]);
        if (!a || !b || !c) return err('Alg\u00fan coeficiente no se entiende.');
        if (F.isZero(a)) return err('Si ' + k('a = 0') + ' no es de segundo grado. Usa el applet anterior.');
        var h = '<div class="mx-flex">' + kd(F.tex(a) + 'x^2 ' + (F.num(b) < 0 ? '-' : '+') + ' ' +
          F.tex(F.num(b) < 0 ? F.neg(b) : b) + 'x ' + (F.num(c) < 0 ? '-' : '+') + ' ' +
          F.tex(F.num(c) < 0 ? F.neg(c) : c) + ' \\;' + SG[v.sg] + '\\; 0') + '</div>';
        var an = F.num(a), bn = F.num(b), cn = F.num(c);
        var disc = bn * bn - 4 * an * cn;
        h += '<p><b>Paso 1.</b> Resolvemos la ecuaci\u00f3n asociada. Discriminante:</p>';
        h += kd('\\Delta = b^2-4ac = ' + String(Math.round(disc * 10000) / 10000));
        var raices = [];
        if (disc > 1e-12) {
          var r1 = (-bn - Math.sqrt(disc)) / (2 * an), r2 = (-bn + Math.sqrt(disc)) / (2 * an);
          raices = [Math.min(r1, r2), Math.max(r1, r2)];
          h += ok('Hay <b>dos</b> ra\u00edces: ' + raices.map(function (r) {
            return k('x = ' + String(Math.round(r * 10000) / 10000));
          }).join(' y ') + '. La recta real queda dividida en <b>tres</b> intervalos.');
        } else if (Math.abs(disc) < 1e-12) {
          raices = [-bn / (2 * an)];
          h += ok('Hay <b>una</b> ra\u00edz doble: ' + k('x = ' + String(Math.round(raices[0] * 10000) / 10000)) +
            '. La recta real queda dividida en <b>dos</b> intervalos.');
        } else {
          h += warn('El discriminante es <b>negativo</b>: no hay ra\u00edces reales. La par\u00e1bola no corta ' +
            'al eje ' + k('X') + ', as\u00ed que la recta real es un <b>\u00fanico</b> intervalo y el signo ' +
            'de la expresi\u00f3n es siempre el mismo.');
        }
        /* Intervalos y comprobación */
        var cortes = raices.slice();
        var tramos = [];
        var xs = [cortes.length ? cortes[0] - 2 : 0];
        for (var i = 0; i < cortes.length; i++) {
          if (i + 1 < cortes.length) xs.push((cortes[i] + cortes[i + 1]) / 2);
        }
        xs.push(cortes.length ? cortes[cortes.length - 1] + 2 : 0);
        function fx(x) { return an * x * x + bn * x + cn; }
        function testa(val) {
          if (v.sg === '<=') return val <= 1e-12;
          if (v.sg === '<') return val < -1e-12;
          if (v.sg === '>=') return val >= -1e-12;
          return val > 1e-12;
        }
        h += '<p><b>Paso 2.</b> Probamos un punto de cada intervalo:</p><div class="mx-steps">';
        var buenos = [];
        for (var t = 0; t < xs.length; t++) {
          var val = fx(xs[t]);
          var bien = testa(val);
          if (bien) buenos.push(t);
          h += '<div class="mx-step"><span class="mx-step-lab">' +
            k('x = ' + String(Math.round(xs[t] * 100) / 100)) + '</span>' +
            k('f(x) = ' + String(Math.round(val * 10000) / 10000)) +
            '<span class="mx-mono" style="color:' + (bien ? '#1b5e20' : '#b71c1c') + '">' +
            (bien ? '\u2714 el intervalo entra' : '\u2717 el intervalo no entra') + '</span></div>';
        }
        h += '</div>';
        /* Extremos */
        var incluye = (v.sg === '<=' || v.sg === '>=');
        if (cortes.length && incluye) {
          h += ok('Y como la desigualdad <b>incluye el igual</b>, las ra\u00edces tambi\u00e9n son soluci\u00f3n: ' +
            'en ellas la expresi\u00f3n vale exactamente cero.');
        } else if (cortes.length) {
          h += warn('La desigualdad es <b>estricta</b>, as\u00ed que las ra\u00edces <b>no</b> son soluci\u00f3n: ' +
            'en ellas la expresi\u00f3n vale cero, y cero no es estrictamente mayor ni menor que cero.');
        }
        if (!buenos.length) {
          h += err('Ning\u00fan intervalo cumple la inecuaci\u00f3n: <b>no tiene soluci\u00f3n</b>.');
        } else if (buenos.length === xs.length && !cortes.length) {
          h += ok('Todos los puntos cumplen la inecuaci\u00f3n: la soluci\u00f3n es <b>todo</b> ' + k('\\mathbb{R}') + '.');
        }
        /* Dibujo de la parábola */
        var xc = cortes.length ? (cortes[0] + cortes[cortes.length - 1]) / 2 : -bn / (2 * an);
        var rad = cortes.length > 1 ? Math.max(3, (cortes[1] - cortes[0])) : 4;
        var Lp = lienzo({ W: 340, H: 260, xmin: Math.floor(xc - rad - 2), xmax: Math.ceil(xc + rad + 2),
          ymin: -8, ymax: 8 });
        ejes(Lp);
        var d = '';
        for (var xx = Lp.xmin; xx <= Lp.xmax; xx += (Lp.xmax - Lp.xmin) / 160) {
          var yy = fx(xx);
          if (yy < Lp.ymin - 5 || yy > Lp.ymax + 5) { d += ' M '; continue; }
          d += (d === '' || d.slice(-2) === 'M ' ? 'M ' : 'L ') + Lp.X(xx).toFixed(1) + ' ' + Lp.Y(yy).toFixed(1) + ' ';
        }
        Lp.add('<path class="plot-line" d="' + d + '"/>');
        cortes.forEach(function (r) {
          Lp.add('<circle class="plot-vertex' + (incluye ? '-opt' : '') + '" cx="' + Lp.X(r).toFixed(1) +
            '" cy="' + Lp.Y(0).toFixed(1) + '" r="4.5"/>');
        });
        h += '<div class="plot-wrap">' + svg(Lp) + leyenda([
          ['chip-half', 'La par\u00e1bola ' + k('y = ax^2+bx+c')],
          ['chip-' + (incluye ? 'opt' : 'vertex'), 'Ra\u00edces, donde vale cero']
        ]) + '</div>';
        h += info('La lectura gr\u00e1fica lo aclara todo: resolver ' + k('ax^2+bx+c < 0') +
          ' es preguntar <b>d\u00f3nde la par\u00e1bola queda por debajo del eje</b> ' + k('X') +
          '. Y con ' + k('> 0') + ', por encima. Si dibujas la par\u00e1bola, la respuesta se ve sin calcular nada.');
        return h;
      });
  });

  reg('sisune', function (node) {
    build(node, 'Applet \u00b7 Sistema con una inc\u00f3gnita',
      'Un sistema de inecuaciones con una inc\u00f3gnita pide que se cumplan <b>todas a la vez</b>, ' +
      'as\u00ed que la soluci\u00f3n es la <b>intersecci\u00f3n</b> de los intervalos. ' +
      'Escribe una por l\u00ednea, con el formato <code>coeficiente signo t\u00e9rmino</code>. ' +
      'Ejemplo: <code>1 &lt;= 5<br>1 &gt;= -2<br>2 &lt; 8</code>.',
      [{ id: 'S', label: 'Sistema', rows: 4, value: '1 <= 5\n1 >= -2\n2 < 8' }],
      function (v) {
        var lineas = String(v.S).trim().split(/[\n;]+/).map(function (r) { return r.trim(); })
          .filter(function (r) { return r.length; });
        if (!lineas.length) return err('Escribe al menos una inecuaci\u00f3n.');
        var tramos = [], h = '<div class="mx-steps">';
        var lo = -Infinity, hi = Infinity, loAb = false, hiAb = false;
        for (var i = 0; i < lineas.length; i++) {
          var m = lineas[i].match(/^(.+?)\s*(<=|>=|=<|=>|<|>)\s*(.+)$/);
          if (!m) return err('En la l\u00ednea ' + (i + 1) + ' falta el signo de desigualdad.');
          var a = parseEntry(m[1].trim()), c = parseEntry(m[3].trim());
          if (!a || !c) return err('En la l\u00ednea ' + (i + 1) + ' hay un n\u00famero que no se entiende.');
          var sg = m[2].replace('=<', '<=').replace('=>', '>=');
          if (F.isZero(a)) return err('En la l\u00ednea ' + (i + 1) + ' el coeficiente es cero.');
          var q = F.div(c, a), qn = F.num(q), neg = F.num(a) < 0;
          var sgF = neg ? ((sg === '<=') ? '>=' : (sg === '>=') ? '<=' : (sg === '<') ? '>' : '<') : sg;
          var abierto = (sgF === '<' || sgF === '>');
          if (sgF === '<=' || sgF === '<') {
            if (qn < hi || (qn === hi && abierto)) { hi = qn; hiAb = abierto; }
          } else {
            if (qn > lo || (qn === lo && abierto)) { lo = qn; loAb = abierto; }
          }
          h += '<div class="mx-step"><span class="mx-step-lab">' +
            k(F.tex(a) + 'x \\;' + SG[sg] + '\\; ' + F.tex(c)) + '</span>' +
            k('x \\;' + SG[sgF] + '\\; ' + F.tex(q)) +
            (neg ? '<span class="mx-mono" style="color:#ef6c00">signo invertido</span>' : '') + '</div>';
        }
        h += '</div>';
        var vacio = (lo > hi) || (lo === hi && (loAb || hiAb));
        h += '<p><b>Intersecci\u00f3n de todos los intervalos:</b></p>';
        if (vacio) {
          h += err('La intersecci\u00f3n es <b>vac\u00eda</b>: no hay ning\u00fan valor de ' + k('x') +
            ' que cumpla todas las inecuaciones a la vez. El sistema no tiene soluci\u00f3n.');
          return h;
        }
        var izq = (lo === -Infinity) ? '\\left(-\\infty' : (loAb ? '\\left(' : '\\left[') + String(Math.round(lo * 10000) / 10000);
        var der = (hi === Infinity) ? '+\\infty\\right)' : String(Math.round(hi * 10000) / 10000) + (hiAb ? '\\right)' : '\\right]');
        h += kd(izq + ',\\; ' + der);
        /* Recta real */
        var cLo = (lo === -Infinity) ? (hi === Infinity ? -5 : hi - 6) : lo;
        var cHi = (hi === Infinity) ? cLo + 12 : hi;
        var Lz = lienzo({ W: 340, H: 90, xmin: Math.floor(cLo - 2), xmax: Math.ceil(cHi + 2), ymin: -1, ymax: 1 });
        var hh = '';
        for (var xx = Math.ceil(Lz.xmin); xx <= Lz.xmax; xx++) {
          hh += '<line class="plot-tick" x1="' + Lz.X(xx).toFixed(1) + '" y1="' + (Lz.Y(0) - 4) +
            '" x2="' + Lz.X(xx).toFixed(1) + '" y2="' + (Lz.Y(0) + 4) + '"/>';
          if (xx % 2 === 0) {
            hh += '<text class="plot-lab" text-anchor="middle" x="' + Lz.X(xx).toFixed(1) + '" y="' +
              (Lz.Y(0) + 17) + '">' + xx + '</text>';
          }
        }
        hh += '<line class="plot-axis" x1="' + Lz.X(Lz.xmin) + '" y1="' + Lz.Y(0) +
          '" x2="' + Lz.X(Lz.xmax) + '" y2="' + Lz.Y(0) + '"/>';
        var a1 = (lo === -Infinity) ? Lz.xmin : lo, a2 = (hi === Infinity) ? Lz.xmax : hi;
        hh += '<line style="stroke:#2e7d32;stroke-width:5;opacity:.55" x1="' + Lz.X(a1).toFixed(1) +
          '" y1="' + Lz.Y(0) + '" x2="' + Lz.X(a2).toFixed(1) + '" y2="' + Lz.Y(0) + '"/>';
        if (lo !== -Infinity) hh += '<circle cx="' + Lz.X(lo).toFixed(1) + '" cy="' + Lz.Y(0) +
          '" r="5" fill="' + (loAb ? '#fff' : '#c62828') + '" stroke="#c62828" stroke-width="2"/>';
        if (hi !== Infinity) hh += '<circle cx="' + Lz.X(hi).toFixed(1) + '" cy="' + Lz.Y(0) +
          '" r="5" fill="' + (hiAb ? '#fff' : '#c62828') + '" stroke="#c62828" stroke-width="2"/>';
        Lz.add(hh);
        h += '<div class="plot-wrap">' + svg(Lz) +
          leyenda([['chip-region', 'Soluci\u00f3n del sistema'], ['chip-vertex', 'Extremo abierto'],
            ['chip-opt', 'Extremo cerrado']]) + '</div>';
        h += info('En lugar de pintar lo que <b>s\u00ed</b> es soluci\u00f3n de cada ' +
          'inecuaci\u00f3n y buscar lo que se ha pintado todas las veces, pinta lo que <b>no</b> es. ' +
          'As\u00ed la soluci\u00f3n es lo que ha quedado <b>sin pintar ninguna vez</b>, y con cinco ' +
          'inecuaciones eso es much\u00edsimo m\u00e1s f\u00e1cil de ver.');
        return h;
      });
  });

  /* ==================================================================
     PARTE 2 · INECUACIONES LINEALES CON DOS INCÓGNITAS
     ================================================================== */

  reg('semiplano', function (node) {
    build(node, 'Applet \u00b7 Semiplano soluci\u00f3n',
      FORMATO + '<br>Ejemplo del libro: ' + k('2x+y > 3') + ' se escribe <code>2 1 &gt; 3</code>. ' +
      'Prueba tambi\u00e9n <code>1 -1 &lt;= 0</code> y <code>0 1 &gt;= 2</code>.',
      [{ id: 'I', label: 'Inecuaci\u00f3n', type: 'text', value: '2 1 > 3' }],
      function (v) {
        var p = parseIne(v.I);
        if (p.err) return err(p.err);
        var h = '<div class="mx-flex">' + kd(texIne(p)) + '</div>';
        /* Dos puntos de la recta */
        var an = F.num(p.a), bn = F.num(p.b), cn = F.num(p.c);
        h += '<p><b>Paso 1.</b> Dibujamos la recta ' + k(texIne(p).replace(SG[p.sg], '=')) + ', ' +
          'que divide el plano en <b>dos semiplanos</b>.</p>';
        var Lz = lienzo({ W: 340, H: 300, xmin: -4, xmax: 8, ymin: -4, ymax: 8 });
        ejes(Lz);
        semiplano(Lz, p);
        recta(Lz, p);
        h += '<p><b>Paso 2.</b> Tomamos un punto cualquiera que no est\u00e9 en la recta y comprobamos ' +
          'si cumple la inecuaci\u00f3n. Probamos con el origen:</p>';
        var vale = F.add(F.mul(p.a, R(0)), F.mul(p.b, R(0)));
        var origenOk = cumple(p, R(0), R(0));
        var enRecta = F.eq(vale, p.c);
        if (enRecta) {
          h += warn('El origen est\u00e1 <b>sobre</b> la recta, as\u00ed que no sirve para decidir. ' +
            'Probamos con otro punto.');
          var probado = null;
          var cand = [[1, 0], [0, 1], [1, 1], [2, 0], [0, 2], [-1, 0]];
          for (var t = 0; t < cand.length; t++) {
            var xx = R(cand[t][0]), yy = R(cand[t][1]);
            if (!F.eq(F.add(F.mul(p.a, xx), F.mul(p.b, yy)), p.c)) {
              probado = { x: cand[t][0], y: cand[t][1], ok: cumple(p, xx, yy) };
              break;
            }
          }
          if (probado) {
            h += '<p>Con el punto ' + k('(' + probado.x + ',\\;' + probado.y + ')') + ': ' +
              (probado.ok ? 'la <b>cumple</b>' : 'la <b>incumple</b>') + '.</p>';
            h += ok('Por tanto el semiplano soluci\u00f3n es el que ' +
              (probado.ok ? 'contiene' : '<b>no</b> contiene') + ' a ese punto, ' +
              'que es el sombreado en el dibujo.');
          }
        } else {
          h += kd(F.tex(p.a) + '\\cdot 0 + ' + F.tex(p.b) + '\\cdot 0 = 0 \\;' +
            (origenOk ? SG[p.sg] : (p.sg === '<=' || p.sg === '<' ? '\\not' + SG[p.sg] : '\\not' + SG[p.sg])) +
            '\\; ' + F.tex(p.c));
          h += origenOk
            ? ok('El origen <b>s\u00ed</b> cumple la inecuaci\u00f3n, as\u00ed que el semiplano soluci\u00f3n es ' +
              'el que <b>contiene</b> al origen: el sombreado del dibujo.')
            : ok('El origen <b>no</b> cumple la inecuaci\u00f3n, as\u00ed que el semiplano soluci\u00f3n es ' +
              '<b>el otro</b>: el sombreado del dibujo.');
        }
        h += '<div class="plot-wrap">' + svg(Lz) + leyenda([
          ['chip-half', 'Semiplano soluci\u00f3n'],
          ['chip-region', p.estricta ? 'Recta <b>discontinua</b>: no entra' : 'Recta <b>continua</b>: s\u00ed entra']
        ]) + '</div>';
        h += p.estricta
          ? warn('La desigualdad es <b>estricta</b>, as\u00ed que la recta <b>no</b> forma parte de la ' +
            'soluci\u00f3n: el recinto es <b>abierto</b>. Por eso se dibuja discontinua.')
          : ok('La desigualdad <b>incluye el igual</b>, as\u00ed que la recta <b>s\u00ed</b> forma parte de ' +
            'la soluci\u00f3n: el recinto es <b>cerrado</b>. Por eso se dibuja continua.');
        h += info('El segundo m\u00e9todo del libro, m\u00e1s r\u00e1pido cuando se domina: analizar el signo ' +
          'de los coeficientes. Con ' + k('a > 0') + ' y la desigualdad apuntando a la derecha, ' +
          'el semiplano es el de la derecha. Basta analizar <b>un</b> signo, y conviene elegir el positivo.');
        return h;
      });
  });

  reg('metodos', function (node) {
    build(node, 'Applet \u00b7 Los dos m\u00e9todos comparados',
      'El libro da dos formas de decidir qu\u00e9 semiplano es la soluci\u00f3n. Aqu\u00ed se aplican <b>las dos</b> ' +
      'a la vez sobre la misma inecuaci\u00f3n, para que compruebes que coinciden y elijas la que prefieras. ' +
      FORMATO,
      [{ id: 'I', label: 'Inecuaci\u00f3n', type: 'text', value: '3 -2 >= 6' }],
      function (v) {
        var p = parseIne(v.I);
        if (p.err) return err(p.err);
        var h = '<div class="mx-flex">' + kd(texIne(p)) + '</div>';
        h += '<table class="ap-tbl"><thead><tr><th>M\u00e9todo</th><th>C\u00f3mo se aplica</th><th>Conclusi\u00f3n</th></tr></thead><tbody>';
        /* Método 1 */
        var origenOk = cumple(p, R(0), R(0));
        var enRecta = F.eq(F.add(F.mul(p.a, R(0)), F.mul(p.b, R(0))), p.c);
        var m1 = enRecta ? 'el origen est\u00e1 en la recta, hay que probar otro punto'
          : (origenOk ? 'el semiplano <b>del origen</b>' : 'el semiplano <b>contrario al origen</b>');
        h += '<tr><td><b>1. Probar un punto</b></td><td>Sustituimos ' + k('(0,0)') + ' y vemos si cumple</td><td>' + m1 + '</td></tr>';
        /* Método 2 */
        var an = F.num(p.a), bn = F.num(p.b);
        var haciaMenor = (p.sg === '<=' || p.sg === '<');
        var m2 = '';
        if (Math.abs(an) > 1e-12) {
          var derecha = haciaMenor ? (an < 0) : (an > 0);
          m2 = 'con ' + k('a = ' + F.tex(p.a)) + (an > 0 ? ' positivo' : ' negativo') +
            ' y desigualdad ' + k(SG[p.sg]) + ', el semiplano es el de la <b>' +
            (derecha ? 'derecha' : 'izquierda') + '</b>';
        } else {
          var arriba = haciaMenor ? (bn < 0) : (bn > 0);
          m2 = 'con ' + k('b = ' + F.tex(p.b)) + (bn > 0 ? ' positivo' : ' negativo') +
            ' y desigualdad ' + k(SG[p.sg]) + ', el semiplano es el de <b>' +
            (arriba ? 'arriba' : 'abajo') + '</b>';
        }
        h += '<tr><td><b>2. Analizar signos</b></td><td>Miramos el signo de un coeficiente y el sentido de la desigualdad</td><td>' + m2 + '</td></tr>';
        h += '</tbody></table>';
        var Lz = lienzo({ W: 340, H: 300, xmin: -4, xmax: 8, ymin: -4, ymax: 8 });
        ejes(Lz); semiplano(Lz, p); recta(Lz, p);
        h += '<div class="plot-wrap">' + svg(Lz) + leyenda([
          ['chip-half', 'Semiplano soluci\u00f3n'],
          ['chip-region', p.estricta ? 'Frontera abierta' : 'Frontera cerrada']
        ]) + '</div>';
        h += ok('Los dos m\u00e9todos deben coincidir <b>siempre</b>. Si en un ejercicio te dan resultados ' +
          'distintos, has cometido un error en uno de los dos y merece la pena averiguar en cu\u00e1l.');
        h += info('Recomendaci\u00f3n pr\u00e1ctica: usa el <b>m\u00e9todo 1</b> mientras aprendes, porque es ' +
          'imposible equivocarse si se sustituye con cuidado. El <b>m\u00e9todo 2</b> es m\u00e1s r\u00e1pido, ' +
          'y conviene dominarlo para los problemas con muchas restricciones.');
        return h;
      });
  });

  reg('recta', function (node) {
    build(node, 'Applet \u00b7 Pendiente y recta frontera',
      'Antes de dibujar semiplanos hay que saber dibujar la recta. Este applet muestra la recta ' +
      k('y = mx + n') + ' junto con su pendiente y su \u00e1ngulo, y una tabla de valores. ' +
      'Prueba <code>2</code> y <code>-2</code> como pendiente, y observa el signo del \u00e1ngulo.',
      [
        { id: 'm', label: 'Pendiente m', type: 'text', value: '2' },
        { id: 'n', label: 'Ordenada n', type: 'text', value: '-2' }
      ],
      function (v) {
        var m = parseEntry(v.m), n = parseEntry(v.n);
        if (!m || !n) return err('Los dos valores deben ser n\u00fameros: enteros, decimales con punto o fracciones.');
        var mn = F.num(m), nn = F.num(n);
        var h = '<div class="mx-flex">' + kd('y = ' + F.tex(m) + 'x ' + (nn < 0 ? '-' : '+') + ' ' +
          F.tex(nn < 0 ? F.neg(n) : n)) + '</div>';
        h += '<p>La recta corta al eje ' + k('Y') + ' en el punto ' + k('(0,\\; ' + F.tex(n) + ')') +
          ', porque al hacer ' + k('x = 0') + ' queda ' + k('y = n') + '.</p>';
        h += '<p><b>Pendiente:</b> ' + k('m = ' + F.tex(m)) + '. Significa que por cada unidad que ' +
          'avanza ' + k('x') + ', la ' + k('y') + ' ' + (mn > 0 ? 'sube' : (mn < 0 ? 'baja' : 'no cambia')) +
          ' ' + Math.abs(mn) + ' unidad' + (Math.abs(mn) === 1 ? '' : 'es') + '.</p>';
        var ang = Math.atan(mn) * 180 / Math.PI;
        h += kd('\\alpha = \\arctan(' + F.tex(m) + ') \\approx ' + String(Math.round(ang * 100) / 100) + '^\\circ');
        /* Tabla de valores */
        h += '<table class="ap-tbl"><thead><tr><th>' + k('x') + '</th><th>' + k('y = mx+n') + '</th></tr></thead><tbody>';
        for (var i = -2; i <= 3; i++) {
          var y = F.add(F.mul(m, R(i)), n);
          h += '<tr><td>' + i + '</td><td>' + k(F.tex(y)) + '</td></tr>';
        }
        h += '</tbody></table>';
        var Lz = lienzo({ W: 340, H: 300, xmin: -5, xmax: 7, ymin: -6, ymax: 8 });
        ejes(Lz);
        recta(Lz, { a: R(-mn * 1000, 1000), b: R(1), c: n, estricta: false, sg: '<=' });
        for (var q = -2; q <= 3; q++) {
          var yq = mn * q + nn;
          if (yq >= Lz.ymin && yq <= Lz.ymax) {
            Lz.add('<circle class="plot-vertex" cx="' + Lz.X(q).toFixed(1) + '" cy="' + Lz.Y(yq).toFixed(1) + '" r="3.5"/>');
          }
        }
        h += '<div class="plot-wrap">' + svg(Lz) + leyenda([
          ['chip-half', 'La recta ' + k('y = mx+n')],
          ['chip-vertex', 'Puntos de la tabla']
        ]) + '</div>';
        h += info('Dos formas de dibujar una recta: con una <b>tabla de valores</b>, que es lo m\u00e1s ' +
          'directo, o partiendo del punto ' + k('(0,n)') + ' y usando la <b>pendiente</b> para avanzar. ' +
          'La segunda es m\u00e1s r\u00e1pida cuando la pendiente es un entero peque\u00f1o.');
        h += warn('Cuidado con las pendientes fraccionarias. Si ' + k('m = -\\tfrac{4}{3}') +
          ', conviene avanzar <b>3</b> unidades en ' + k('x') + ' y bajar <b>4</b> en ' + k('y') +
          ', para caer siempre en puntos de coordenadas enteras.');
        return h;
      });
  });

  /* ==================================================================
     PARTE 3 · SISTEMAS DE INECUACIONES CON DOS INCÓGNITAS
     ================================================================== */

  reg('region', function (node) {
    build(node, 'Applet \u00b7 Regi\u00f3n factible',
      FORMATO_SIS + '<br>Ejemplos del libro: <code>1 0 &gt;= 0<br>0 1 &gt;= 0<br>1 1 &lt;= 10<br>1 2 &lt;= 8</code> \u00b7 ' +
      'la del ejemplo de los aviones: <code>1 0 &gt;= 0<br>0 1 &gt;= 0<br>1 1 &lt;= 80<br>30 20 &lt;= 1800</code>.',
      [{ id: 'S', label: 'Sistema de inecuaciones', rows: 6, value: '1 0 >= 0\n0 1 >= 0\n1 1 <= 80\n30 20 <= 1800' }],
      function (v) {
        var p = parseSis(v.S);
        if (p.err) return err(p.err);
        var L = p.L;
        var h = '<div class="mx-flex">' + kd(texSis(L)) + '</div>';
        var V = vertices(L);
        var vac = !noVacia(L);
        var aco = acotada(L);
        var win = ventana(V, 2);
        var Lz = lienzo({ W: 360, H: 320, xmin: win.xmin, xmax: win.xmax, ymin: win.ymin, ymax: win.ymax });
        ejes(Lz);
        if (!vac) {
          if (aco && V.length >= 3) region(Lz, V);
          else regionRecorte(Lz, L);
        }
        var clases = ['plot-line', 'plot-line-2', 'plot-line-3', 'plot-line-4', 'plot-line-5'];
        L.forEach(function (ine, i) { recta(Lz, ine, clases[i % clases.length]); });
        if (!vac) puntos(Lz, V);
        h += '<div class="plot-wrap">' + svg(Lz) + leyenda([
          ['chip-region', 'Regi\u00f3n factible'],
          ['chip-half', 'Rectas frontera'],
          ['chip-vertex', 'V\u00e9rtices']
        ]) + '</div>';
        if (vac) {
          h += err('<b>No existe regi\u00f3n factible.</b> Las condiciones no pueden satisfacerse ' +
            'simult\u00e1neamente: las inecuaciones son inconsistentes entre s\u00ed.');
          return h;
        }
        h += aco
          ? ok('<b>Soluci\u00f3n acotada.</b> Los puntos de la regi\u00f3n factible est\u00e1n encerrados por ' +
            'un pol\u00edgono convexo, con ' + V.length + ' v\u00e9rtice' + (V.length === 1 ? '' : 's') + '.')
          : warn('<b>Soluci\u00f3n no acotada.</b> La regi\u00f3n se extiende hasta el infinito. ' +
            'Tiene ' + V.length + ' v\u00e9rtice' + (V.length === 1 ? '' : 's') + ', pero no est\u00e1 cerrada.');
        if (V.length) {
          h += '<table class="ap-tbl"><thead><tr><th>V\u00e9rtice</th><th>Coordenadas</th></tr></thead><tbody>';
          var letras = 'ABCDEFGH';
          V.forEach(function (vv, i) {
            h += '<tr><td>' + (letras[i] || (i + 1)) + '</td><td>' + k(texPunto(vv)) + '</td></tr>';
          });
          h += '</tbody></table>';
        }
        h += info('Los tres tipos de soluci\u00f3n que se pueden encontrar, seg\u00fan el libro: ' +
          '<b>acotada</b>, cuando la regi\u00f3n queda encerrada por un pol\u00edgono convexo; ' +
          '<b>no acotada</b>, cuando se extiende al infinito; y <b>sin soluci\u00f3n</b>, cuando las ' +
          'condiciones se contradicen.');
        h += warn('Se podría llamar a la regi\u00f3n factible, cari\u00f1osamente, <b>corralito</b>. ' +
          'Y un dato importante: es un conjunto <b>convexo</b>, lo que significa que dados dos ' +
          'puntos cualesquiera de la regi\u00f3n, el segmento que los une est\u00e1 tambi\u00e9n dentro. ' +
          'Cada punto \u00abve\u00bb a todos los dem\u00e1s.');
        return h;
      });
  });

  reg('tiposregion', function (node) {
    build(node, 'Applet \u00b7 Los tres tipos de regi\u00f3n',
      'Elige uno de los tres sistemas del libro y observa la diferencia. Despu\u00e9s modifica los n\u00fameros ' +
      'y busca t\u00fa el punto exacto en el que una regi\u00f3n acotada se vuelve no acotada, o desaparece.',
      [
        { id: 'cual', label: 'Ejemplo', type: 'select', value: 'Acotada',
          options: ['Acotada', 'No acotada', 'Sin soluci\u00f3n', 'Un solo punto', 'Una recta'] }
      ],
      function (v) {
        var sistemas = {
          'Acotada': { s: '1 0 >= 0\n0 1 >= 0\n1 1 <= 10\n1 2 <= 8', t: 'Cuatro restricciones que se cierran entre s\u00ed.' },
          'No acotada': { s: '1 0 >= 0\n0 1 >= 0\n1 1 >= 6\n1 2 >= 3', t: 'Las desigualdades apuntan hacia fuera: la regi\u00f3n crece sin l\u00edmite.' },
          'Sin soluci\u00f3n': { s: '1 1 <= 2\n1 1 >= 8', t: 'Dos condiciones incompatibles: la suma no puede ser a la vez menor que 2 y mayor que 8.' },
          'Un solo punto': { s: '1 0 >= 2\n1 0 <= 2\n0 1 >= 3\n0 1 <= 3', t: 'Cuatro restricciones que aprietan hasta dejar un \u00fanico punto.' },
          'Una recta': { s: '1 0 >= 0\n1 0 <= 5\n0 1 >= 2\n0 1 <= 2', t: 'La regi\u00f3n se reduce a un segmento: un caso l\u00edmite entre acotada y degenerada.' }
        };
        var elegido = sistemas[v.cual];
        var p = parseSis(elegido.s);
        var L = p.L;
        var h = '<p>' + elegido.t + '</p>';
        h += '<div class="mx-flex">' + kd(texSis(L)) + '</div>';
        var V = vertices(L);
        var vac = !noVacia(L);
        var aco = acotada(L);
        var win = ventana(V, 3);
        var Lz = lienzo({ W: 360, H: 320, xmin: win.xmin, xmax: win.xmax, ymin: win.ymin, ymax: win.ymax });
        ejes(Lz);
        if (!vac) { if (aco && V.length >= 3) region(Lz, V); else regionRecorte(Lz, L); }
        var clases = ['plot-line', 'plot-line-2', 'plot-line-3', 'plot-line-4', 'plot-line-5'];
        L.forEach(function (ine, i) { recta(Lz, ine, clases[i % clases.length]); });
        if (!vac) puntos(Lz, V);
        h += '<div class="plot-wrap">' + svg(Lz) + leyenda([
          ['chip-region', 'Regi\u00f3n factible'], ['chip-vertex', 'V\u00e9rtices']
        ]) + '</div>';
        if (vac) h += err('Sin soluci\u00f3n: la intersecci\u00f3n es vac\u00eda.');
        else if (!aco) h += warn('Regi\u00f3n <b>no acotada</b>, con ' + V.length + ' v\u00e9rtices.');
        else h += ok('Regi\u00f3n <b>acotada</b>, con ' + V.length + ' v\u00e9rtice' + (V.length === 1 ? '' : 's') + '.');
        h += info('Los casos <b>un solo punto</b> y <b>una recta</b> no suelen aparecer en los libros, ' +
          'y merece la pena verlos: son la frontera entre lo normal y lo degenerado. ' +
          'En ellos la programaci\u00f3n lineal sigue funcionando, pero la respuesta es forzada: ' +
          'si hay un \u00fanico punto factible, ese es el \u00f3ptimo sin necesidad de calcular nada.');
        return h;
      });
  });

  reg('vertices', function (node) {
    build(node, 'Applet \u00b7 Determinar los v\u00e9rtices',
      'Los v\u00e9rtices son los cortes entre las rectas frontera, <b>pero no todos los cortes son ' +
      'v\u00e9rtices</b>: solo los que cumplen <b>todas</b> las restricciones. Este applet los calcula ' +
      'todos y descarta los que no valen, explicando por qu\u00e9. ' + FORMATO_SIS,
      [{ id: 'S', label: 'Sistema', rows: 6, value: '1 0 >= 0\n0 1 >= 0\n1 1 <= 80\n30 20 <= 1800' }],
      function (v) {
        var p = parseSis(v.S);
        if (p.err) return err(p.err);
        var L = p.L;
        var h = '<div class="mx-flex">' + kd(texSis(L)) + '</div>';
        h += '<p><b>Paso 1.</b> Calculamos <b>todos</b> los cortes entre parejas de rectas frontera:</p>';
        var todos = [], letras = 'ABCDEFGHIJKL', idx = 0;
        for (var i = 0; i < L.length; i++) {
          for (var j = i + 1; j < L.length; j++) {
            var pt = corte(L[i], L[j]);
            if (!pt) { continue; }
            var falla = -1;
            for (var q = 0; q < L.length; q++) {
              var val = F.add(F.mul(L[q].a, pt.x), F.mul(L[q].b, pt.y));
              var amplio = (L[q].sg === '<=' || L[q].sg === '<') ? F.le(val, L[q].c) : F.le(L[q].c, val);
              if (!amplio) { falla = q; break; }
            }
            todos.push({ p: pt, de: [i + 1, j + 1], falla: falla, nom: letras[idx++] });
          }
        }
        if (!todos.length) return h + err('No hay ning\u00fan corte entre las rectas: son todas paralelas.');
        h += '<table class="ap-tbl"><thead><tr><th>Punto</th><th>Corte de</th><th>Coordenadas</th>' +
          '<th>\u00bfEs v\u00e9rtice?</th></tr></thead><tbody>';
        todos.forEach(function (t) {
          var esV = (t.falla < 0);
          h += '<tr' + (esV ? ' class="mx-opt-row"' : '') + '><td>' + t.nom + '</td><td>ecuaciones ' +
            t.de[0] + ' y ' + t.de[1] + '</td><td>' + k(texPunto(t.p)) + '</td><td>' +
            (esV ? '\u2714 s\u00ed' : '\u2717 no, incumple la restricci\u00f3n ' + (t.falla + 1)) + '</td></tr>';
        });
        h += '</tbody></table>';
        var buenos = todos.filter(function (t) { return t.falla < 0; });
        var malos = todos.filter(function (t) { return t.falla >= 0; });
        h += ok('De los <b>' + todos.length + '</b> cortes calculados, solo <b>' + buenos.length +
          '</b> son v\u00e9rtices de la regi\u00f3n factible.');
        if (malos.length) {
          h += warn('Los <b>' + malos.length + '</b> descartados son cortes reales entre dos rectas, ' +
            'pero quedan <b>fuera</b> de la regi\u00f3n porque incumplen alguna de las otras restricciones. ' +
            'Ese es justamente el aviso del libro: los v\u00e9rtices cumplen <b>todas</b> las restricciones, ' +
            'no solo las dos que los definen.');
        }
        var V = vertices(L);
        var win = ventana(V, 3);
        var Lz = lienzo({ W: 360, H: 320, xmin: win.xmin, xmax: win.xmax, ymin: win.ymin, ymax: win.ymax });
        ejes(Lz);
        if (acotada(L) && V.length >= 3) region(Lz, V); else regionRecorte(Lz, L);
        var clases = ['plot-line', 'plot-line-2', 'plot-line-3', 'plot-line-4', 'plot-line-5'];
        L.forEach(function (ine, i) { recta(Lz, ine, clases[i % clases.length]); });
        /* Dibujamos todos los cortes, distinguiendo válidos de descartados */
        var hh = '';
        todos.forEach(function (t) {
          var cx = Lz.X(F.num(t.p.x)), cy = Lz.Y(F.num(t.p.y));
          if (cx < 0 || cx > Lz.W || cy < 0 || cy > Lz.H) return;
          hh += '<circle class="' + (t.falla < 0 ? 'plot-vertex-opt' : 'plot-vertex') + '" cx="' +
            cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="4.5"/>';
          hh += '<text class="plot-vlab" x="' + (cx + 7).toFixed(1) + '" y="' + (cy - 5).toFixed(1) +
            '">' + t.nom + '</text>';
        });
        Lz.add(hh);
        h += '<div class="plot-wrap">' + svg(Lz) + leyenda([
          ['chip-region', 'Regi\u00f3n factible'],
          ['chip-opt', 'V\u00e9rtices verdaderos'],
          ['chip-vertex', 'Cortes descartados']
        ]) + '</div>';
        h += info('Truco pr\u00e1ctico: si dibujas primero la regi\u00f3n, ver\u00e1s a simple vista cu\u00e1les ' +
          'de los cortes son v\u00e9rtices y te ahorrar\u00e1s comprobar uno por uno. Representar ' +
          'gr\u00e1ficamente ahorra tiempo; evaluar despu\u00e9s la funci\u00f3n es m\u00e1s preciso. ' +
          'Lo mejor es <b>combinar</b> ambas cosas.');
        return h;
      });
  });

  /* ==================================================================
     6. API PÚBLICA Y ARRANQUE
     ================================================================== */

  window.INE = {
    F: F, R: R, parseEntry: parseEntry, parseIne: parseIne, parseSis: parseSis,
    normal: normal, cumple: cumple, cumpleTodas: cumpleTodas, cumpleTodasAmplio: cumpleTodasAmplio,
    corte: corte, vertices: vertices, acotada: acotada, noVacia: noVacia,
    lienzo: lienzo, ejes: ejes, recta: recta, semiplano: semiplano,
    region: region, regionRecorte: regionRecorte, puntos: puntos, nivel: nivel,
    svg: svg, ventana: ventana, leyenda: leyenda,
    k: k, kd: kd, SG: SG, texIne: texIne, texSis: texSis, texPunto: texPunto,
    renderTex: renderTex, esc: esc,
    ok: ok, info: info, warn: warn, err: err,
    build: build, FORMATO: FORMATO, FORMATO_SIS: FORMATO_SIS,
    reg: reg, registry: registry, log: []
  };

  var booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    var nodes = document.querySelectorAll('[data-applet-ine]');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.getAttribute('data-mounted') === '1') continue;
      var key = node.getAttribute('data-applet-ine');
      var fn = registry[key];
      node.setAttribute('data-mounted', '1');
      if (!fn) {
        node.classList.add('applet');
        node.innerHTML = '<div class="mx-bad ap-err">No existe ning\u00fan applet con la clave <code>' +
          esc(key) + '</code>. Claves disponibles: <code>' +
          Object.keys(registry).sort().join('</code>, <code>') + '</code>.</div>';
        window.INE.log.push({ clave: key, error: 'clave inexistente' });
        continue;
      }
      try { fn(node); }
      catch (e) {
        node.classList.add('applet');
        node.innerHTML = '<div class="mx-bad ap-err">El applet <code>' + esc(key) +
          '</code> no ha podido montarse: ' + esc(e.message) + '</div>';
        window.INE.log.push({ clave: key, error: e.message, stack: e.stack });
      }
    }
  }

  window.INE.boot = boot;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); });
  } else {
    setTimeout(boot, 0);
  }
})();
