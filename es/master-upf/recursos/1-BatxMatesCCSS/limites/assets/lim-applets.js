/* =====================================================================
   lim-applets.js — LÍMITES DE UNA FUNCIÓN · 1r Batx Mates CCSS
   Módulo 1: sucesiones, cálculo de límites, operaciones con límites,
             indeterminaciones y su resolución.

   INSERCIÓN EN EL .qmd
     <div data-applet-lim="clave"></div>

   El módulo de ampliación lim-applets-extra.js usa data-applet-limx
   y cubre límite en el infinito, límite en un punto, asíntotas
   y continuidad. Publica su API en window.LIM.

   CONVENIOS DE FORMATO, heredados del tema de números reales
     nt()   sintaxis KaTeX, con la coma entre llaves. SOLO dentro de T().
     num()  texto plano, para HTML normal.
     plain() limpia notación KaTeX en las etiquetas de los SVG.

   CLAVES DE ESTE MÓDULO
     sucesion · monotonia · limsuc · sierpinski
     limpot · limpoli · limcoc · operlim
     tablaops · clasifind · indinfinf · indrestas
     indcero · indceroinf · numeroe · ind1inf · diagnostico
   ===================================================================== */

(function () {
  'use strict';

  var LI = {};

  /* =================================================================
     0. KATEX Y PRESENTACIÓN
     ================================================================= */

  var KOPT = {
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
      try { window.renderMathInElement(node, KOPT); } catch (e) { }
    }
  }
  function T(t) { return '$' + t + '$'; }
  function TD(t) { return '$$' + t + '$$'; }

  function head(title, bullets) {
    return '<div class="ap-head"><h4 class="ap-title">' + title + '</h4><ul class="ap-help">' +
      bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul></div>';
  }
  function errBox(m) { return '<div class="ap-err">Aviso: ' + m + '</div>'; }
  function step(h) { return '<div class="ap-step">' + h + '</div>'; }
  function warnStep(h) { return '<div class="ap-step ap-warn">' + h + '</div>'; }
  function key(t) { return '<span class="ap-key">' + t + '</span>'; }
  function ok(t) { return '<span class="ap-ok">' + t + '</span>'; }
  function bad(t) { return '<span class="ap-bad">' + t + '</span>'; }
  function note(t) { return '<span class="ap-note">' + t + '</span>'; }
  function chip(t, b) { return '<span class="ap-chip' + (b ? ' ap-chip-bad' : '') + '">' + t + '</span>'; }

  /* Símbolos del tema, comprobados en KaTeX. */
  var INF = '\\infty';
  var TO = '\\to';
  function LIMT(varname, to, body) {
    return '\\lim_{' + varname + ' ' + TO + ' ' + to + '}' + body;
  }

  /* =================================================================
     1. FORMATO NUMÉRICO
     ================================================================= */

  function nz(x) { return Math.abs(x) < 1e-12 ? 0 : x; }

  function nt(x, d) {
    if (x === null || x === undefined) return '\\text{no definido}';
    if (x === Infinity) return '+' + INF;
    if (x === -Infinity) return '-' + INF;
    if (typeof x === 'number' && !isFinite(x)) return '\\text{no existe}';
    var k = (d === undefined ? 6 : d);
    var r = Math.round(nz(x) * Math.pow(10, k)) / Math.pow(10, k);
    return Number.isInteger(r) ? String(r) : String(r).replace('.', '{,}');
  }
  function num(x, d) {
    if (x === Infinity) return '+\u221E';
    if (x === -Infinity) return '\u2212\u221E';
    if (x === null || x === undefined || (typeof x === 'number' && !isFinite(x))) return 'no existe';
    return nt(x, d).replace(/\{,\}/g, ',').replace(/^-/, '\u2212');
  }
  function plain(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/\{,\}/g, ',')
      .replace(/\\infty/g, '\u221E')
      .replace(/\\to/g, '\u2192')
      .replace(/\\overline\{([^}]*)\}/g, '$1')
      .replace(/\\text\{([^}]*)\}/g, '$1')
      .replace(/\\sqrt/g, '\u221A')
      .replace(/\\pi/g, '\u03C0')
      .replace(/[{}$\\]/g, '');
  }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a; }
  function fracTex(n, d) {
    if (d === 0) return '\\text{no definido}';
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(Math.round(n * 1e6), Math.round(d * 1e6));
    if (Number.isInteger(n) && Number.isInteger(d)) {
      var g2 = gcd(n, d) || 1;
      n = n / g2; d = d / g2;
      if (d === 1) return String(n);
      return (n < 0 ? '-' : '') + '\\dfrac{' + Math.abs(n) + '}{' + d + '}';
    }
    return nt(n / d, 6);
  }

  /* =================================================================
     2. POLINOMIOS  (coeficientes en orden descendente)
     ================================================================= */

  function polParse(s) {
    var parts = String(s).replace(/\s/g, '').split(/[,;]/).filter(function (t) { return t !== ''; });
    if (!parts.length) throw new Error('escribe los coeficientes separados por comas, por ejemplo <code>3,-5,3</code>.');
    var c = parts.map(function (t) {
      var v = parseFloat(t.replace(',', '.'));
      if (!isFinite(v)) throw new Error('el coeficiente <code>' + t + '</code> no es un n\u00famero.');
      return v;
    });
    while (c.length > 1 && Math.abs(c[0]) < 1e-12) c.shift();
    return c;
  }
  function polDeg(c) { return c.length - 1; }
  function polLead(c) { return c[0]; }
  function polEval(c, x) {
    var r = 0;
    for (var i = 0; i < c.length; i++) r = r * x + c[i];
    return r;
  }
  function polTex(c, v) {
    v = v || 'x';
    var n = polDeg(c), out = '';
    for (var i = 0; i < c.length; i++) {
      var a = c[i], p = n - i;
      if (Math.abs(a) < 1e-12) continue;
      var sgn = a < 0 ? '-' : (out ? '+' : '');
      var abs = Math.abs(a);
      var co = (abs === 1 && p > 0) ? '' : nt(abs);
      var vv = p === 0 ? '' : (p === 1 ? v : v + '^{' + p + '}');
      out += sgn + co + vv;
    }
    return out || '0';
  }
  /* División entera de polinomios: devuelve {q, r}. */
  function polDiv(a, b) {
    var q = [], r = a.slice();
    var db = polDeg(b), lb = polLead(b);
    while (polDeg(r) >= db && !(r.length === 1 && Math.abs(r[0]) < 1e-12)) {
      var f = polLead(r) / lb;
      q.push(f);
      for (var i = 0; i <= db; i++) r[i] -= f * b[i];
      r.shift();
      if (!r.length) { r = [0]; break; }
    }
    if (!q.length) q = [0];
    while (r.length > 1 && Math.abs(r[0]) < 1e-12) r.shift();
    return { q: q, r: r };
  }
  /* Raíces racionales sencillas y numéricas por barrido, para asíntotas. */
  function polRoots(c) {
    var n = polDeg(c), out = [];
    if (n === 1) { out.push(-c[1] / c[0]); }
    else if (n === 2) {
      var A = c[0], B = c[1], C = c[2], D = B * B - 4 * A * C;
      if (D > 1e-12) { out.push((-B - Math.sqrt(D)) / (2 * A)); out.push((-B + Math.sqrt(D)) / (2 * A)); }
      else if (Math.abs(D) <= 1e-12) out.push(-B / (2 * A));
    } else if (n >= 3) {
      var prev = polEval(c, -40), x;
      for (x = -40 + 0.01; x <= 40; x += 0.01) {
        var cur = polEval(c, x);
        if (prev === 0) out.push(Math.round((x - 0.01) * 1e6) / 1e6);
        else if (prev * cur < 0) {
          var lo = x - 0.01, hi = x, m;
          for (var k = 0; k < 60; k++) {
            m = (lo + hi) / 2;
            if (polEval(c, lo) * polEval(c, m) <= 0) hi = m; else lo = m;
          }
          out.push(Math.round(m * 1e6) / 1e6);
        }
        prev = cur;
      }
    }
    /* elimina duplicados */
    var uniq = [];
    out.sort(function (p, q2) { return p - q2; }).forEach(function (r) {
      if (!uniq.length || Math.abs(uniq[uniq.length - 1] - r) > 1e-6) uniq.push(r);
    });
    return uniq;
  }

  /* =================================================================
     3. EVALUADOR DE EXPRESIONES  f(x)
     ================================================================= */

  function tokenize(s) {
    s = String(s).replace(/\s/g, '').replace(/,/g, '.').replace(/\u2212/g, '-');
    var t = [], i = 0;
    var names = ['sqrt', 'abs', 'ln', 'log', 'exp', 'sin', 'cos', 'tan', 'pi'];
    while (i < s.length) {
      var c = s[i];
      if (/[0-9.]/.test(c)) {
        var j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++;
        t.push({ t: 'n', v: parseFloat(s.slice(i, j)) }); i = j; continue;
      }
      var matched = null;
      for (var k = 0; k < names.length; k++) {
        if (s.startsWith(names[k], i)) { matched = names[k]; break; }
      }
      if (matched) { t.push({ t: matched === 'pi' ? 'c' : 'f', v: matched }); i += matched.length; continue; }
      if (c === 'x') { t.push({ t: 'x' }); i++; continue; }
      if (c === 'e') { t.push({ t: 'c', v: 'e' }); i++; continue; }
      if ('+-*/^()'.indexOf(c) >= 0) { t.push({ t: c }); i++; continue; }
      throw new Error('no entiendo el car\u00e1cter <code>' + c + '</code>. Usa <code>x</code>, n\u00fameros y las funciones <code>sqrt</code>, <code>ln</code>, <code>log</code>, <code>exp</code>, <code>abs</code>.');
    }
    return t;
  }
  function parse(src) {
    var t = tokenize(src), p = 0;
    function peek() { return t[p]; }
    function eat(k) { if (t[p] && t[p].t === k) { p++; return true; } return false; }
    function expr() {
      var v = term();
      while (peek() && (peek().t === '+' || peek().t === '-')) {
        var op = t[p++].t, r = term();
        v = op === '+' ? add(v, r) : sub(v, r);
      }
      return v;
    }
    function term() {
      var v = unary();
      while (peek() && (peek().t === '*' || peek().t === '/')) {
        var op = t[p++].t, r = unary();
        v = op === '*' ? mul(v, r) : div(v, r);
      }
      return v;
    }
    function unary() {
      if (eat('-')) { var u = unary(); return function (x) { return -u(x); }; }
      if (eat('+')) return unary();
      return power();
    }
    function power() {
      var b = atom();
      if (eat('^')) { var e = unary(); return function (x) { return Math.pow(b(x), e(x)); }; }
      return b;
    }
    function atom() {
      var k = peek();
      if (!k) throw new Error('la expresi\u00f3n est\u00e1 incompleta.');
      if (k.t === 'n') { p++; return function () { return k.v; }; }
      if (k.t === 'x') { p++; return function (x) { return x; }; }
      if (k.t === 'c') { p++; return function () { return k.v === 'e' ? Math.E : Math.PI; }; }
      if (k.t === 'f') {
        p++;
        if (!eat('(')) throw new Error('falta el par\u00e9ntesis tras <code>' + k.v + '</code>.');
        var a = expr();
        if (!eat(')')) throw new Error('falta cerrar un par\u00e9ntesis.');
        return function (x) {
          var v = a(x);
          switch (k.v) {
            case 'sqrt': return v < 0 ? NaN : Math.sqrt(v);
            case 'abs': return Math.abs(v);
            case 'ln': return v <= 0 ? NaN : Math.log(v);
            case 'log': return v <= 0 ? NaN : Math.log10(v);
            case 'exp': return Math.exp(v);
            case 'sin': return Math.sin(v);
            case 'cos': return Math.cos(v);
            case 'tan': return Math.tan(v);
          }
          return NaN;
        };
      }
      if (k.t === '(') {
        p++;
        var v2 = expr();
        if (!eat(')')) throw new Error('falta cerrar un par\u00e9ntesis.');
        return v2;
      }
      throw new Error('no esperaba ese s\u00edmbolo en la expresi\u00f3n.');
    }
    function add(a, b) { return function (x) { return a(x) + b(x); }; }
    function sub(a, b) { return function (x) { return a(x) - b(x); }; }
    function mul(a, b) { return function (x) { return a(x) * b(x); }; }
    function div(a, b) { return function (x) { return a(x) / b(x); }; }

    var f = expr();
    if (p < t.length) throw new Error('sobra algo al final de la expresi\u00f3n. Recuerda escribir el producto con <code>*</code>, por ejemplo <code>2*x</code>.');
    return f;
  }

  /* Límite numérico por aproximación, con detección de infinito. */
  function limitAt(f, a, side) {
    var hs = [0.1, 0.01, 0.001, 1e-4, 1e-5, 1e-6, 1e-7], vals = [];
    hs.forEach(function (h) {
      var x = side === '-' ? a - h : a + h;
      var v = f(x);
      if (isFinite(v)) vals.push(v);
    });
    if (vals.length < 3) return { v: null, kind: 'nd' };
    var last = vals[vals.length - 1], prev = vals[vals.length - 2];
    if (Math.abs(last) > 1e6 && Math.abs(last) > Math.abs(prev)) {
      return { v: last > 0 ? Infinity : -Infinity, kind: 'inf' };
    }
    return { v: last, kind: 'fin' };
  }
  function limitInf(f, sgn) {
    var xs = [10, 100, 1e3, 1e4, 1e5, 1e6, 1e7], vals = [];
    xs.forEach(function (x) {
      var v = f(sgn * x);
      if (isFinite(v)) vals.push({ x: x, v: v });
    });
    if (vals.length < 3) return { v: null, kind: 'nd' };
    var last = vals[vals.length - 1], prev = vals[vals.length - 2];
    /* Divergencia: el valor sigue creciendo en valor absoluto y ya es grande. */
    var crece = Math.abs(last.v) > Math.abs(prev.v) * 1.05;
    if (crece && Math.abs(last.v) > 1e4) {
      return { v: last.v > 0 ? Infinity : -Infinity, kind: 'inf' };
    }
    /* Convergencia: los dos últimos valores casi coinciden. */
    if (Math.abs(last.v - prev.v) < Math.max(1e-6, Math.abs(last.v) * 1e-6)) {
      return { v: last.v, kind: 'fin' };
    }
    return { v: last.v, kind: 'fin' };
  }

  /* =================================================================
     4. FIGURAS
     ================================================================= */

  /* Gráfica cartesiana de una o varias funciones, con asíntotas. */
  function plotSVG(o) {
    var W = 520, H = o.H || 300, pad = 34;
    var x0 = o.x0, x1 = o.x1, y0 = o.y0, y1 = o.y1;
    function px(x) { return pad + (x - x0) / (x1 - x0) * (W - 2 * pad); }
    function py(y) { return H - pad - (y - y0) / (y1 - y0) * (H - 2 * pad); }
    var g = '';

    /* rejilla */
    var stepx = niceStep(x1 - x0), stepy = niceStep(y1 - y0), t;
    for (t = Math.ceil(x0 / stepx) * stepx; t <= x1; t += stepx) {
      g += '<line x1="' + px(t).toFixed(1) + '" y1="' + pad + '" x2="' + px(t).toFixed(1) +
        '" y2="' + (H - pad) + '" stroke="#eef2f7"/>';
    }
    for (t = Math.ceil(y0 / stepy) * stepy; t <= y1; t += stepy) {
      g += '<line x1="' + pad + '" y1="' + py(t).toFixed(1) + '" x2="' + (W - pad) +
        '" y2="' + py(t).toFixed(1) + '" stroke="#eef2f7"/>';
    }
    /* ejes */
    if (y0 <= 0 && y1 >= 0) {
      g += '<line x1="' + pad + '" y1="' + py(0).toFixed(1) + '" x2="' + (W - pad) + '" y2="' +
        py(0).toFixed(1) + '" stroke="#94a3b8" stroke-width="1.6"/>';
    }
    if (x0 <= 0 && x1 >= 0) {
      g += '<line x1="' + px(0).toFixed(1) + '" y1="' + pad + '" x2="' + px(0).toFixed(1) +
        '" y2="' + (H - pad) + '" stroke="#94a3b8" stroke-width="1.6"/>';
    }
    /* marcas numéricas */
    for (t = Math.ceil(x0 / stepx) * stepx; t <= x1; t += stepx) {
      if (Math.abs(t) < 1e-9) continue;
      g += '<text x="' + px(t).toFixed(1) + '" y="' + (Math.min(H - 8, py(0) + 14)).toFixed(1) +
        '" font-size="10.5" text-anchor="middle" fill="#64748b">' + plain(num(t, 3)) + '</text>';
    }
    for (t = Math.ceil(y0 / stepy) * stepy; t <= y1; t += stepy) {
      if (Math.abs(t) < 1e-9) continue;
      g += '<text x="' + (Math.max(4, px(0) - 6)).toFixed(1) + '" y="' + (py(t) + 3.5).toFixed(1) +
        '" font-size="10.5" text-anchor="end" fill="#64748b">' + plain(num(t, 3)) + '</text>';
    }
    /* asíntotas */
    (o.vasym || []).forEach(function (a) {
      if (a < x0 || a > x1) return;
      g += '<line x1="' + px(a).toFixed(1) + '" y1="' + pad + '" x2="' + px(a).toFixed(1) +
        '" y2="' + (H - pad) + '" stroke="#e63946" stroke-width="1.6" stroke-dasharray="6 4"/>';
    });
    (o.hasym || []).forEach(function (a) {
      if (a < y0 || a > y1) return;
      g += '<line x1="' + pad + '" y1="' + py(a).toFixed(1) + '" x2="' + (W - pad) + '" y2="' +
        py(a).toFixed(1) + '" stroke="#2a9d8f" stroke-width="1.6" stroke-dasharray="6 4"/>';
    });
    (o.oasym || []).forEach(function (r) {
      var ya = r.m * x0 + r.n, yb = r.m * x1 + r.n;
      g += '<line x1="' + px(x0).toFixed(1) + '" y1="' + py(ya).toFixed(1) + '" x2="' + px(x1).toFixed(1) +
        '" y2="' + py(yb).toFixed(1) + '" stroke="#8e44ad" stroke-width="1.6" stroke-dasharray="6 4"/>';
    });

    /* curvas */
    (o.curves || []).forEach(function (cv) {
      var N = 900, d = '', open = false;
      for (var i = 0; i <= N; i++) {
        var x = x0 + (x1 - x0) * i / N, y;
        try { y = cv.f(x); } catch (e) { y = NaN; }
        var inside = isFinite(y) && y >= y0 - (y1 - y0) * 2 && y <= y1 + (y1 - y0) * 2;
        var brk = false;
        (o.vasym || []).forEach(function (a) { if (Math.abs(x - a) < (x1 - x0) / N * 1.2) brk = true; });
        if (!inside || brk) { open = false; continue; }
        var X = px(x).toFixed(1), Y = py(Math.max(y0 - (y1 - y0), Math.min(y1 + (y1 - y0), y))).toFixed(1);
        d += (open ? 'L' : 'M') + X + ' ' + Y + ' ';
        open = true;
      }
      g += '<path d="' + d + '" fill="none" stroke="' + (cv.color || '#2a76dd') +
        '" stroke-width="' + (cv.w || 2.4) + '" clip-path="url(#lim-clip)"/>';
    });

    /* puntos y huecos */
    (o.points || []).forEach(function (pt) {
      if (pt.x < x0 || pt.x > x1 || pt.y < y0 || pt.y > y1) return;
      g += '<circle cx="' + px(pt.x).toFixed(1) + '" cy="' + py(pt.y).toFixed(1) + '" r="5.5" fill="' +
        (pt.open ? '#ffffff' : (pt.color || '#e63946')) + '" stroke="' + (pt.color || '#e63946') +
        '" stroke-width="2.4"/>';
      if (pt.lbl) {
        g += '<text x="' + px(pt.x).toFixed(1) + '" y="' + (py(pt.y) - 13).toFixed(1) +
        '" font-size="11.5" text-anchor="middle" fill="#334155" paint-order="stroke"' +
        ' stroke="#ffffff" stroke-width="4" stroke-linejoin="round">' + plain(pt.lbl) + '</text>';
      }
    });

    return '<svg class="ap-fig" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="gr\u00e1fica">' +
      '<defs><clipPath id="lim-clip"><rect x="' + pad + '" y="' + pad + '" width="' + (W - 2 * pad) +
      '" height="' + (H - 2 * pad) + '"/></clipPath></defs>' + g + '</svg>';
  }
  function niceStep(range) {
    var raw = range / 8, e = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / e;
    return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * e;
  }

  /* Diagrama de puntos de una sucesión. */
  function seqSVG(terms, lim) {
    var W = 520, H = 220, pad = 36;
    var n = terms.length;
    var vals = terms.filter(function (v) { return isFinite(v); });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if (isFinite(lim)) { lo = Math.min(lo, lim); hi = Math.max(hi, lim); }
    if (hi - lo < 1e-9) { hi = lo + 1; lo -= 1; }
    var m = (hi - lo) * 0.15; lo -= m; hi += m;
    function px(i) { return pad + i / Math.max(1, n - 1) * (W - 2 * pad); }
    function py(v) { return H - pad - (v - lo) / (hi - lo) * (H - 2 * pad); }
    var g = '';
    g += '<line x1="' + pad + '" y1="' + (H - pad) + '" x2="' + (W - pad) + '" y2="' + (H - pad) +
      '" stroke="#94a3b8"/>';
    if (isFinite(lim)) {
      g += '<line x1="' + pad + '" y1="' + py(lim).toFixed(1) + '" x2="' + (W - pad) + '" y2="' +
        py(lim).toFixed(1) + '" stroke="#2a9d8f" stroke-width="1.8" stroke-dasharray="6 4"/>';
      g += '<text x="' + (W - pad - 2) + '" y="' + (py(lim) - 6).toFixed(1) +
        '" font-size="11.5" text-anchor="end" fill="#2a9d8f">l\u00edmite ' + plain(num(lim, 4)) + '</text>';
    }
    terms.forEach(function (v, i) {
      if (!isFinite(v)) return;
      var Y = Math.max(pad, Math.min(H - pad, py(v)));
      g += '<circle cx="' + px(i).toFixed(1) + '" cy="' + Y.toFixed(1) + '" r="4" fill="#2a76dd"/>';
    });
    g += '<text x="' + pad + '" y="' + (H - 10) + '" font-size="10.5" fill="#64748b">n = 1</text>';
    g += '<text x="' + (W - pad) + '" y="' + (H - 10) + '" font-size="10.5" text-anchor="end" fill="#64748b">n = ' +
      n + '</text>';
    return '<svg class="ap-fig" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="sucesi\u00f3n">' + g + '</svg>';
  }

  /* =================================================================
     5. INTERFAZ
     ================================================================= */

  function rowText(role, label, value) {
    return '<div class="ap-row"><label class="ap-lab">' + label + '</label>' +
      '<input class="ap-in" type="text" data-role="' + role + '" value="' + value + '"></div>';
  }
  function mini(role, label, value, stp) {
    return '<label class="ap-lab">' + label + '</label>' +
      '<input class="ap-in ap-mini" type="number" data-role="' + role + '" value="' + value +
      '" step="' + (stp || 1) + '">';
  }
  function sel(role, label, opts, value) {
    return '<label class="ap-lab">' + label + '</label><select class="ap-sel" data-role="' + role + '">' +
      opts.map(function (o) {
        return '<option value="' + o[0] + '"' + (String(o[0]) === String(value) ? ' selected' : '') +
          '>' + o[1] + '</option>';
      }).join('') + '</select>';
  }
  function get(r, k) { return r.querySelector('[data-role="' + k + '"]'); }
  function val(r, k) { return get(r, k).value; }
  function nv(r, k) { return parseFloat(get(r, k).value); }
  function iv(r, k) { return parseInt(get(r, k).value, 10); }

  function live(root, out, fn) {
    function run() {
      try { out.innerHTML = fn(); }
      catch (e) { out.innerHTML = errBox(e && e.message ? e.message : String(e)); }
      kt(out);
    }
    Array.prototype.forEach.call(root.querySelectorAll('input,select'), function (el) {
      el.addEventListener('input', run); el.addEventListener('change', run);
    });
    run();
  }
  function shell(root, title, bullets, controls) {
    root.classList.add('applet');
    root.innerHTML = head(title, bullets) + controls + '<div class="ap-out" data-role="out"></div>';
    kt(root);
    return get(root, 'out');
  }
  function tbl(headers, rows) {
    return '<table class="ap-tbl"><tr>' + headers.map(function (h) { return '<th>' + h + '</th>'; }).join('') +
      '</tr>' + rows.map(function (r) {
        return '<tr' + (r.mark ? ' class="ap-sel-row"' : '') + '>' +
          (r.cells || r).map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
      }).join('') + '</table>';
  }

  /* =================================================================
     6. APPLETS · SUCESIONES
     ================================================================= */

  RXsuc();
  function RXsuc() {

    LI.sucesion = function (root) {
      var out = shell(root, 'Applet \u00b7 T\u00e9rminos y t\u00e9rmino general', [
        'Una sucesi\u00f3n es un conjunto de n\u00fameros reales que se pueden numerar. El <b>t\u00e9rmino general</b> $a_{n}$ permite calcular cualquier t\u00e9rmino sabiendo el lugar que ocupa.',
        'Escribe el t\u00e9rmino general usando <code>n</code>: por ejemplo <code>3*n</code>, <code>1/n</code>, <code>n^2-1</code>, <code>(-1)^n*n</code>, <code>(3*n-1)/(2*n+5)</code>.',
        'Ejemplo del libro: la sucesi\u00f3n 3, 6, 9, 12, 15, 18, ... tiene $a_{n}=3n$, luego $a_{10}=30$ y $a_{62}=186$.',
        'Cambia el t\u00e9rmino que quieres consultar y observa la lista y el diagrama de puntos.'
      ],
        rowText('an', 'a\u2099 en funci\u00f3n de n', '3*n') +
        '<div class="ap-row">' + mini('k', 'consultar a\u2096 con k =', 10) + mini('N', 'cu\u00e1ntos mostrar', 12) + '</div>');

      live(root, out, function () {
        var src = val(root, 'an'), k = iv(root, 'k'), N = Math.max(3, Math.min(40, iv(root, 'N')));
        var f = parse(src.replace(/n/g, 'x'));
        var terms = [], i;
        for (i = 1; i <= N; i++) terms.push(f(i));
        var h = step(key('T\u00e9rmino general: ') + T('a_{n}=' + texify(src)));
        h += step(key('Primeros t\u00e9rminos: ') + terms.slice(0, Math.min(10, N)).map(function (v) {
          return chip(num(v, 4));
        }).join(''));
        if (k >= 1 && k <= 100000) {
          h += step(T('a_{' + k + '}=' + nt(f(k), 6)) + ' ' + note('sustituyendo n por ' + k));
        }
        h += step(note('Una sucesi\u00f3n se puede ver como una funci\u00f3n que asocia a cada natural $n$ un n\u00famero real $a_{n}$. Por eso todo lo que aprendas aqu\u00ed servir\u00e1 luego para funciones.'));
        h += seqSVG(terms, NaN);
        return h;
      });
    };

    LI.monotonia = function (root) {
      var out = shell(root, 'Applet \u00b7 Monoton\u00eda y acotaci\u00f3n', [
        'Si cada t\u00e9rmino es mayor que el anterior, $a_{n}<a_{n+1}$, la sucesi\u00f3n es <b>mon\u00f3tona creciente</b>. Si $a_{n}>a_{n+1}$, es <b>mon\u00f3tona decreciente</b>.',
        'Si todos los t\u00e9rminos son menores que un n\u00famero y a la vez mayores que otro, la sucesi\u00f3n est\u00e1 <b>acotada</b>.',
        'Prueba <code>n</code> creciente y acotada inferiormente; <code>(-1)^n</code> no mon\u00f3tona y acotada; <code>1/n</code> decreciente y acotada; <code>n^2</code> creciente y no acotada.',
        'El applet analiza los primeros t\u00e9rminos y busca cotas. Pregunta clave: \u00bftoda sucesi\u00f3n acotada tiene l\u00edmite?'
      ], rowText('an', 'a\u2099', '(-1)^n*3/n'));

      live(root, out, function () {
        var src = val(root, 'an'), f = parse(src.replace(/n/g, 'x'));
        var terms = [], i;
        for (i = 1; i <= 60; i++) terms.push(f(i));
        var vals = terms.filter(isFinite);
        if (vals.length < 5) throw new Error('la sucesi\u00f3n no toma valores finitos suficientes.');
        var cre = true, dec = true;
        for (i = 1; i < vals.length; i++) {
          if (!(vals[i] > vals[i - 1] - 1e-12)) cre = false;
          if (!(vals[i] < vals[i - 1] + 1e-12)) dec = false;
        }
        var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
        var creceSinFin = Math.abs(vals[vals.length - 1]) > Math.abs(vals[10]) * 3;
        var h = step(key('T\u00e9rmino general: ') + T('a_{n}=' + texify(src)));
        h += step(key('Primeros t\u00e9rminos: ') + terms.slice(0, 8).map(function (v) { return chip(num(v, 4)); }).join(''));
        h += step(key('Monoton\u00eda: ') + (cre && !dec ? ok('mon\u00f3tona creciente')
          : dec && !cre ? ok('mon\u00f3tona decreciente')
          : cre && dec ? note('constante')
          : bad('no es mon\u00f3tona')) + ' ' + note('(analizando los 60 primeros t\u00e9rminos)'));
        h += step(key('Cotas observadas: ') + 'valor menor ' + chip(num(lo, 4)) + ' y valor mayor ' + chip(num(hi, 4)) +
          '. ' + (creceSinFin ? bad('Parece no acotada') : ok('Parece acotada')) + '.');
        h += step(note('Cuidado: el applet solo mira una parte de la sucesi\u00f3n. Comprobar los primeros t\u00e9rminos <b>no es una demostraci\u00f3n</b>. Es una conjetura que despu\u00e9s hay que justificar con \u00e1lgebra.'));
        h += seqSVG(terms.slice(0, 40), NaN);
        return h;
      });
    };

    LI.limsuc = function (root) {
      var out = shell(root, 'Applet \u00b7 L\u00edmite de una sucesi\u00f3n', [
        'El l\u00edmite de una sucesi\u00f3n es el n\u00famero real al que se aproximan sus t\u00e9rminos cuando $n$ toma valores muy grandes. Se escribe $\\lim_{n \\to \\infty} a_{n}=a$.',
        'Prueba los cuatro casos del libro: <code>1/n</code> tiende a 0; <code>n^2-1</code> tiende a infinito; <code>-2^n</code> tiende a menos infinito; <code>(-1)^n*n</code> no tiene l\u00edmite.',
        'Tambi\u00e9n <code>(1+1/n)^n</code>, que tiende al n\u00famero $e$, y <code>(3*n-1)/(2*n+5)</code>, que tiende a $3/2$.',
        'Observa la tabla: el l\u00edmite no es un t\u00e9rmino de la sucesi\u00f3n, es el valor al que se acercan.'
      ], rowText('an', 'a\u2099', '(3*n-1)/(2*n+5)'));

      live(root, out, function () {
        var src = val(root, 'an'), f = parse(src.replace(/n/g, 'x'));
        var probes = [1, 5, 10, 50, 100, 1000, 10000, 100000, 1000000];
        var rows = probes.map(function (n) {
          return { cells: [String(n), T(nt(f(n), 8))], mark: n >= 100000 };
        });
        var lim = limitInf(f, 1);
        var terms = [], i;
        for (i = 1; i <= 40; i++) terms.push(f(i));

        var h = step(key('Sucesi\u00f3n: ') + T('a_{n}=' + texify(src)));
        h += tbl(['n', 'a\u2099'], rows);
        var alterna = false;
        for (i = 20; i < 30; i++) { if (terms[i] * terms[i + 1] < 0 && Math.abs(terms[i]) > 0.5) alterna = true; }
        if (alterna && lim.kind !== 'fin') {
          h += step(key('Conclusi\u00f3n: ') + bad('la sucesi\u00f3n no tiene l\u00edmite') +
            '. Los t\u00e9rminos alternan de signo sin acercarse a ning\u00fan valor.');
          h += step(note('Es el caso de $a_{n}=(-1)^{n}n$: los pares son positivos y los impares negativos, y no se puede predecir el valor de un t\u00e9rmino muy avanzado.'));
        } else if (lim.kind === 'inf') {
          h += step(key('Conclusi\u00f3n: ') + T(LIMT('n', '+' + INF, 'a_{n}') + '=' + (lim.v > 0 ? '+' : '-') + INF) +
            ' ' + note('la sucesi\u00f3n crece o decrece indefinidamente'));
          h += step(note('Como el infinito no es un n\u00famero real, tambi\u00e9n se dice que en este caso el l\u00edmite no existe, aunque conozcamos perfectamente el comportamiento.'));
        } else if (lim.kind === 'fin') {
          h += step(key('Conclusi\u00f3n: ') + T(LIMT('n', '+' + INF, 'a_{n}') + '=' + nt(lim.v, 6)) + ' ' + chip(num(lim.v, 6)));
          h += step(note('El l\u00edmite de una sucesi\u00f3n, si existe, es \u00fanico.'));
        } else {
          h += step(bad('No se puede estimar el l\u00edmite') + ' con estos valores. Revisa la expresi\u00f3n.');
        }
        h += seqSVG(terms, lim.kind === 'fin' ? lim.v : NaN);
        return h;
      });
    };

    LI.sierpinski = function (root) {
      var out = shell(root, 'Applet \u00b7 Tri\u00e1ngulos infinitos de Sierpinski', [
        'El tri\u00e1ngulo de Sierpinski se construye partiendo de un tri\u00e1ngulo equil\u00e1tero, uniendo los puntos medios de sus lados y quitando el color al tri\u00e1ngulo central. El proceso se repite en cada tri\u00e1ngulo coloreado.',
        'En cada iteraci\u00f3n quedan <b>3 de cada 4</b> tri\u00e1ngulos, luego el \u00e1rea coloreada se multiplica por $3/4$.',
        'Mueve el n\u00famero de iteraciones y observa qu\u00e9 le ocurre al \u00e1rea. Este es el reto de apertura del tema.',
        'Pregunta final: si el proceso se repite infinitas veces, \u00bfcu\u00e1nto mide el \u00e1rea coloreada?'
      ], '<div class="ap-row">' + mini('k', 'iteraciones', 5) + '</div>');

      live(root, out, function () {
        var k = Math.max(0, Math.min(30, iv(root, 'k')));
        var rows = [], i;
        for (i = 0; i <= Math.min(k, 12); i++) {
          rows.push({
            cells: [String(i), String(Math.pow(3, i)), T(nt(Math.pow(0.75, i), 8)),
                    T(nt(1 - Math.pow(0.75, i), 8))],
            mark: i === Math.min(k, 12)
          });
        }
        var A = Math.pow(0.75, k);
        var h = step(key('Modelo: ') + 'si el \u00e1rea inicial es 1, tras $n$ iteraciones el \u00e1rea coloreada es ' +
          T('A_{n}=\\left(\\dfrac{3}{4}\\right)^{n}') + '.');
        h += tbl(['Iteraci\u00f3n', 'Tri\u00e1ngulos', '\u00c1rea verde', '\u00c1rea blanca'], rows);
        h += step('Con ' + key(String(k)) + ' iteraciones el \u00e1rea coloreada es ' + chip(num(A, 8)) +
          ', es decir un ' + chip(num(A * 100, 4) + ' %') + ' del tri\u00e1ngulo inicial.');
        h += step(key('L\u00edmite: ') + T(LIMT('n', '+' + INF, '\\left(\\dfrac{3}{4}\\right)^{n}') + '=0') +
          ' ' + note('porque la base cumple $0<3/4<1$'));
        h += step(key('Conclusi\u00f3n sorprendente: ') + 'el tri\u00e1ngulo de Sierpinski tiene \u00e1rea ' + ok('cero') +
          ', y sin embargo contiene infinitos puntos. ' +
          note('El infinito obliga a revisar la intuici\u00f3n: es el aviso con el que arranca este tema.'));
        h += seqSVG((function () { var t = [], j; for (j = 0; j <= 20; j++) t.push(Math.pow(0.75, j)); return t; })(), 0);
        return h;
      });
    };
  }

  /* Convierte la entrada del alumno en LaTeX legible. */
  function texify(s) {
    var t = String(s).replace(/\s/g, '');
    t = t.replace(/\*(?=[a-zA-Z(])/g, '');
    t = t.replace(/\*/g, '\\cdot ');
    t = t.replace(/sqrt\(([^()]*)\)/g, '\\sqrt{$1}');
    t = t.replace(/\^(\{[^}]*\}|\([^)]*\)|-?\w+)/g, function (m, g1) {
      var inner = g1.replace(/^\(/, '').replace(/\)$/, '').replace(/^\{/, '').replace(/\}$/, '');
      return '^{' + inner + '}';
    });
    /* fracción simple a/b cuando toda la expresión es un cociente de paréntesis */
    var mm = /^\(([^()]*|\([^()]*\)[^()]*)\)\/\(([^()]*|\([^()]*\)[^()]*)\)$/.exec(String(s).replace(/\s/g, ''));
    if (mm) return '\\dfrac{' + texify(mm[1]) + '}{' + texify(mm[2]) + '}';
    t = t.replace(/\//g, '/');
    return t;
  }

  /* =================================================================
     7. APPLETS · CÁLCULO DE LÍMITES
     ================================================================= */

  LI.limpot = function (root) {
    var out = shell(root, 'Applet \u00b7 L\u00edmite de potencias', [
      'Dos familias muy distintas. Con la <b>base variable</b>: $\\lim_{n \\to \\infty} n^{k}$ vale $+\\infty$ si $k>0$, vale $1$ si $k=0$ y vale $0$ si $k<0$.',
      'Con el <b>exponente variable</b>: $\\lim_{n \\to \\infty} k^{n}$ vale $+\\infty$ si $k>1$, vale $1$ si $k=1$, vale $0$ si $-1<k<1$ y no existe si $k\\leq-1$.',
      'Prueba $n^{2}$, $n^{-2}$, $2^{n}$, $\\left(\\tfrac{1}{2}\\right)^{n}$ y $(-2)^{n}$.',
      'El caso $k\\leq-1$ es el m\u00e1s interesante: los t\u00e9rminos alternan de signo y crecen, luego no hay l\u00edmite.'
    ],
      '<div class="ap-row">' + sel('t', 'tipo', [['nk', 'n elevado a k'], ['kn', 'k elevado a n']], 'kn') +
      mini('k', 'valor de k', 2, 0.5) + '</div>');

    live(root, out, function () {
      var t = val(root, 't'), k = nv(root, 'k');
      if (!isFinite(k)) throw new Error('escribe un valor num\u00e9rico para k.');
      var f = t === 'nk' ? function (n) { return Math.pow(n, k); } : function (n) { return Math.pow(k, n); };
      var probes = [1, 2, 5, 10, 20, 50];
      var rows = probes.map(function (n) {
        return { cells: [String(n), T(nt(f(n), 6))], mark: n === 50 };
      });
      var h = step(key('L\u00edmite estudiado: ') +
        TD(LIMT('n', '+' + INF, t === 'nk' ? 'n^{' + nt(k) + '}' : nt(k) + '^{\\,n}')));
      h += tbl(['n', 'a\u2099'], rows);
      var res, why;
      if (t === 'nk') {
        if (k > 0) { res = '+' + INF; why = 'porque el exponente es positivo y la base crece sin l\u00edmite'; }
        else if (k === 0) { res = '1'; why = 'porque cualquier n\u00famero elevado a cero vale uno'; }
        else { res = '0'; why = 'porque $n^{k}=\\dfrac{1}{n^{|k|}}$ y el denominador crece sin l\u00edmite'; }
      } else {
        if (k > 1) { res = '+' + INF; why = 'porque la base es mayor que uno y al multiplicarla por s\u00ed misma crece'; }
        else if (k === 1) { res = '1'; why = 'porque uno elevado a cualquier exponente vale uno'; }
        else if (k > -1) { res = '0'; why = 'porque la base est\u00e1 entre menos uno y uno, y las potencias se hacen cada vez m\u00e1s peque\u00f1as'; }
        else if (k === -1) { res = '\\text{no existe}'; why = 'porque la sucesi\u00f3n es $-1,1,-1,1,\\ldots$ y no se acerca a ning\u00fan valor'; }
        else { res = '\\text{no existe}'; why = 'porque los t\u00e9rminos alternan de signo y crecen en valor absoluto'; }
      }
      h += step(key('Resultado: ') + T(res) + ', ' + why + '.');
      h += step(note('Estas dos tablas son la base de todo el c\u00e1lculo de l\u00edmites del tema. Merece la pena entenderlas en lugar de memorizarlas.'));
      var terms = [], i;
      for (i = 1; i <= 25; i++) terms.push(f(i));
      h += seqSVG(terms, res === '0' ? 0 : (res === '1' ? 1 : NaN));
      return h;
    });
  };

  LI.limpoli = function (root) {
    var out = shell(root, 'Applet \u00b7 L\u00edmite de un polinomio', [
      'El l\u00edmite de un polinomio en el infinito coincide con el l\u00edmite de su <b>monomio de mayor grado</b>. Los dem\u00e1s t\u00e9rminos son despreciables.',
      'Escribe los coeficientes en orden descendente separados por comas. Por ejemplo <code>3,-5,3</code> significa $3n^{2}-5n+3$.',
      'Ejemplos del libro: $3n^{2}-5n+3$ tiende a $+\\infty$; $-2n^{2}-5n+3$ tiende a $-\\infty$.',
      'Cambia el signo del coeficiente principal y observa que solo \u00e9l decide el resultado.'
    ], rowText('p', 'coeficientes', '3,-5,3'));

    live(root, out, function () {
      var c = polParse(val(root, 'p')), n = polDeg(c), a = polLead(c);
      var probes = [1, 10, 100, 1000];
      var rows = probes.map(function (x) {
        return {
          cells: [String(x), T(nt(polEval(c, x), 4)), T(nt(a * Math.pow(x, n), 4)),
                  T(nt(polEval(c, x) / (a * Math.pow(x, n)), 6))],
          mark: x === 1000
        };
      });
      var h = step(key('Polinomio: ') + T('P(n)=' + polTex(c, 'n')) + ' \u00b7 grado ' + key(String(n)) +
        ' \u00b7 coeficiente principal ' + key(num(a)));
      h += step(key('Regla: ') + TD(LIMT('n', '+' + INF, 'P(n)') + '=' + LIMT('n', '+' + INF, nt(a) + 'n^{' + n + '}')));
      h += tbl(['n', 'P(n)', 'monomio principal', 'cociente'], rows);
      h += step(note('Mira la \u00faltima columna: el cociente entre el polinomio y su monomio principal tiende a uno. Eso es exactamente lo que significa que los dem\u00e1s t\u00e9rminos sean despreciables.'));
      var res = n === 0 ? nt(a) : (a > 0 ? '+' + INF : '-' + INF);
      h += step(key('Resultado: ') + chip(T(res)));
      return h;
    });
  };

  LI.limcoc = function (root) {
    var out = shell(root, 'Applet \u00b7 Cociente de polinomios en el infinito', [
      'Todo depende de <b>comparar los grados</b>. Si el grado de arriba es mayor, el l\u00edmite es infinito. Si es menor, el l\u00edmite es cero. Si son iguales, el l\u00edmite es el cociente de los coeficientes principales.',
      'Escribe cada polinomio con sus coeficientes en orden descendente. Por ejemplo <code>3,-5,0</code> y <code>4,-5</code>.',
      'Ejemplos del libro: $\\dfrac{3n^{2}-5n}{4n-5}$ tiende a $+\\infty$; $\\dfrac{3n^{2}-5}{4n^{2}}$ tiende a $\\tfrac{3}{4}$; $\\dfrac{3n-4}{4n^{2}-5}$ tiende a $0$.',
      'Prueba a igualar los grados y a cambiar el signo de un coeficiente principal.'
    ],
      rowText('P', 'numerador', '3,-5,0') + rowText('Q', 'denominador', '4,-5'));

    live(root, out, function () {
      var P = polParse(val(root, 'P')), Q = polParse(val(root, 'Q'));
      var m = polDeg(P), k = polDeg(Q), a = polLead(P), b = polLead(Q);
      if (Math.abs(b) < 1e-12) throw new Error('el coeficiente principal del denominador no puede ser cero.');
      var f = function (x) { return polEval(P, x) / polEval(Q, x); };
      var probes = [1, 10, 100, 1000, 10000];
      var rows = probes.map(function (x) {
        return { cells: [String(x), T(nt(f(x), 6))], mark: x === 10000 };
      });
      var h = step(key('Cociente: ') + TD('\\dfrac{' + polTex(P, 'n') + '}{' + polTex(Q, 'n') + '}'));
      h += step('Grado del numerador ' + key(String(m)) + ' \u00b7 grado del denominador ' + key(String(k)));
      h += step(key('Simplificando con los monomios principales: ') +
        T('\\dfrac{' + nt(a) + 'n^{' + m + '}}{' + nt(b) + 'n^{' + k + '}}' +
          (m === k ? '=' + fracTex(a, b) : '=' + fracTex(a, b) + 'n^{' + (m - k) + '}')));
      var res;
      if (m > k) {
        res = (a / b > 0 ? '+' : '-') + INF;
        h += step(key('Caso grado mayor arriba: ') + 'el l\u00edmite es ' + chip(T(res)) +
          ', con el signo del cociente ' + T(fracTex(a, b)) + '.');
      } else if (m === k) {
        res = fracTex(a, b);
        h += step(key('Caso grados iguales: ') + 'el l\u00edmite es el cociente de los coeficientes principales, ' +
          chip(T(res)) + ' ' + note('valor aproximado ' + num(a / b, 6)));
      } else {
        res = '0';
        h += step(key('Caso grado mayor abajo: ') + 'el l\u00edmite es ' + chip(T('0')) +
          ', porque el denominador crece mucho m\u00e1s deprisa.');
      }
      h += tbl(['n', 'valor'], rows);
      h += step(note('Fija la atenci\u00f3n en la tabla: la convergencia puede ser lenta. Que un l\u00edmite valga cero no significa que los t\u00e9rminos sean peque\u00f1os desde el principio.'));
      return h;
    });
  };

  LI.operlim = function (root) {
    var out = shell(root, 'Applet \u00b7 Operaciones con l\u00edmites', [
      'Si los dos l\u00edmites existen y la operaci\u00f3n entre ellos est\u00e1 definida, el l\u00edmite de la suma es la suma de los l\u00edmites, y lo mismo con la resta, el producto, el cociente, la potencia, la ra\u00edz y el logaritmo.',
      'Escribe dos sucesiones con <code>n</code>, por ejemplo <code>(4*n+1)/(2*n)</code> y <code>3*n^2/(n^2-3)</code>.',
      'Ejemplo del libro: la suma de esas dos vale $2+3=5$.',
      'Cuidado: si alguno de los l\u00edmites es infinito, la operaci\u00f3n puede ser una indeterminaci\u00f3n. El applet te avisa cuando eso ocurre.'
    ],
      rowText('a', 'primera sucesi\u00f3n', '(4*n+1)/(2*n)') +
      rowText('b', 'segunda sucesi\u00f3n', '3*n^2/(n^2-3)') +
      '<div class="ap-row">' + sel('op', 'operaci\u00f3n', [['+', 'suma'], ['-', 'resta'], ['*', 'producto'], ['/', 'cociente'], ['^', 'potencia']], '+') + '</div>');

    live(root, out, function () {
      var fa = parse(val(root, 'a').replace(/n/g, 'x'));
      var fb = parse(val(root, 'b').replace(/n/g, 'x'));
      var op = val(root, 'op');
      var La = limitInf(fa, 1), Lb = limitInf(fb, 1);
      function comb(x) {
        var A = fa(x), B = fb(x);
        return op === '+' ? A + B : op === '-' ? A - B : op === '*' ? A * B :
               op === '/' ? A / B : Math.pow(A, B);
      }
      var Lc = limitInf(comb, 1);
      var opTex = op === '+' ? '+' : op === '-' ? '-' : op === '*' ? '\\cdot' : op === '/' ? ':' : '\\text{ elevado a }';
      var h = step(key('L\u00edmites por separado: ') + T(LIMT('n', '+' + INF, 'a_{n}') + '=' + nt(La.v, 6)) + ' y ' +
        T(LIMT('n', '+' + INF, 'b_{n}') + '=' + nt(Lb.v, 6)));
      var indet = isIndet(La.v, Lb.v, op);
      if (indet) {
        h += warnStep(key('Atenci\u00f3n: ') + 'la operaci\u00f3n entre los dos l\u00edmites da ' + bad(indet) +
          ', que es una ' + key('indeterminaci\u00f3n') + '. No se puede aplicar la regla directamente.');
        h += step('Pero el l\u00edmite s\u00ed puede existir. Estimado num\u00e9ricamente: ' + chip(num(Lc.v, 6)) + ' ' +
          note('para determinarlo con rigor hay que operar antes, como en el apartado de resoluci\u00f3n de indeterminaciones'));
      } else {
        h += step(key('Aplicando la propiedad: ') + T(nt(La.v, 6) + opTex + nt(Lb.v, 6) + '=' + nt(Lc.v, 6)));
        h += step(key('Comprobaci\u00f3n num\u00e9rica del l\u00edmite conjunto: ') + chip(num(Lc.v, 6)) + ' ' + ok('coincide'));
      }
      h += tbl(['n', 'a\u2099', 'b\u2099', 'resultado'],
        [10, 100, 1000, 10000].map(function (x) {
          return { cells: [String(x), T(nt(fa(x), 5)), T(nt(fb(x), 5)), T(nt(comb(x), 5))], mark: x === 10000 };
        }));
      h += step(note('Tambi\u00e9n valen para el logaritmo y la ra\u00edz: $\\lim \\ln a_{n}=\\ln \\lim a_{n}$ y $\\lim \\sqrt{a_{n}}=\\sqrt{\\lim a_{n}}$, siempre que el resultado tenga sentido.'));
      return h;
    });
  };

  function isIndet(A, B, op) {
    var iA = A === Infinity || A === -Infinity, iB = B === Infinity || B === -Infinity;
    if (op === '+' && iA && iB && (A > 0) !== (B > 0)) return '\u221E \u2212 \u221E';
    if (op === '-' && iA && iB && (A > 0) === (B > 0)) return '\u221E \u2212 \u221E';
    if (op === '*' && ((iA && B === 0) || (iB && A === 0))) return '0 \u00b7 \u221E';
    if (op === '/' && iA && iB) return '\u221E / \u221E';
    if (op === '/' && A === 0 && B === 0) return '0 / 0';
    if (op === '^' && Math.abs(A - 1) < 1e-9 && iB) return '1 elevado a \u221E';
    if (op === '^' && A === 0 && B === 0) return '0 elevado a 0';
    if (op === '^' && iA && B === 0) return '\u221E elevado a 0';
    return null;
  }

  /* =================================================================
     8. APPLETS · INDETERMINACIONES
     ================================================================= */

  LI.tablaops = function (root) {
    var out = shell(root, 'Applet \u00b7 Operaciones con infinito y con cero', [
      'Con n\u00fameros reales no hay problema, pero con el infinito algunas operaciones s\u00ed tienen resultado y otras no.',
      'Elige la operaci\u00f3n y los dos valores. El applet dice si el resultado est\u00e1 determinado o si es una indeterminaci\u00f3n.',
      'Recuerda: indeterminado <b>no</b> significa que el l\u00edmite no exista. Significa que hace falta trabajar m\u00e1s para saberlo.',
      'Recorre las siete indeterminaciones del tema y comprueba cu\u00e1ndo aparece cada una.'
    ],
      '<div class="ap-row">' + sel('A', 'primer valor', [['inf', '+\u221E'], ['minf', '\u2212\u221E'], ['cero', '0'], ['k', 'un n\u00famero k distinto de 0'], ['uno', '1']], 'inf') +
      sel('op', 'operaci\u00f3n', [['+', 'suma'], ['-', 'resta'], ['*', 'producto'], ['/', 'cociente'], ['^', 'potencia']], '-') +
      sel('B', 'segundo valor', [['inf', '+\u221E'], ['minf', '\u2212\u221E'], ['cero', '0'], ['k', 'un n\u00famero k distinto de 0'], ['uno', '1']], 'inf') + '</div>');

    live(root, out, function () {
      var A = val(root, 'A'), B = val(root, 'B'), op = val(root, 'op');
      function tx(s) {
        return s === 'inf' ? '+' + INF : s === 'minf' ? '-' + INF : s === 'cero' ? '0' : s === 'uno' ? '1' : 'k';
      }
      var opT = op === '+' ? '+' : op === '-' ? '-' : op === '*' ? '\\cdot' : op === '/' ? ':' : '';
      var expr = op === '^' ? '\\left(' + tx(A) + '\\right)^{' + tx(B) + '}' : tx(A) + opT + tx(B);
      var h = step(key('Operaci\u00f3n: ') + TD(expr));
      var r = decide(A, op, B);
      h += step(r.ind
        ? bad('Es una indeterminaci\u00f3n') + ' del tipo ' + chip(r.ind) + '. ' + r.why
        : ok('Resultado determinado') + ': ' + chip(T(r.res)) + '. ' + r.why);
      h += step(note('Las siete indeterminaciones del curso son: $\\infty-\\infty$, $0\\cdot\\infty$, $\\dfrac{0}{0}$, $\\dfrac{\\infty}{\\infty}$, $1^{\\infty}$, $0^{0}$ y $\\infty^{0}$.'));
      h += '<table class="ap-tbl"><tr><th>S\u00ed est\u00e1 determinado</th><th>Es indeterminaci\u00f3n</th></tr>' +
        '<tr><td>' + T('k+' + INF + '=+' + INF) + '</td><td>' + T('+' + INF + '-(+' + INF + ')') + '</td></tr>' +
        '<tr><td>' + T('k\\cdot' + INF + '=' + INF + '\\ (k\\neq 0)') + '</td><td>' + T('0\\cdot' + INF) + '</td></tr>' +
        '<tr><td>' + T('\\dfrac{k}{' + INF + '}=0') + '</td><td>' + T('\\dfrac{' + INF + '}{' + INF + '}') + '</td></tr>' +
        '<tr><td>' + T('\\dfrac{k}{0}=' + INF + '\\ (k\\neq 0)') + '</td><td>' + T('\\dfrac{0}{0}') + '</td></tr>' +
        '<tr><td>' + T('k^{+' + INF + '}=+' + INF + '\\ (k>1)') + '</td><td>' + T('1^{' + INF + '}') + '</td></tr>' +
        '<tr><td>' + T('k^{+' + INF + '}=0\\ (0<k<1)') + '</td><td>' + T('0^{0}') + '\\ y\\ ' + T(INF + '^{0}') + '</td></tr></table>';
      return h;
    });

    function decide(A, op, B) {
      var iA = A === 'inf' || A === 'minf', iB = B === 'inf' || B === 'minf';
      var sA = A === 'inf' ? 1 : A === 'minf' ? -1 : 0, sB = B === 'inf' ? 1 : B === 'minf' ? -1 : 0;
      if (op === '+') {
        if (iA && iB) return sA === sB
          ? { res: (sA > 0 ? '+' : '-') + INF, why: 'Dos infinitos del mismo signo se suman sin conflicto.' }
          : { ind: '\u221E \u2212 \u221E', why: 'Depende de lo grande que sea cada infinito, as\u00ed que hace falta operar antes.' };
        if (iA || iB) return { res: (iA ? (sA > 0 ? '+' : '-') : (sB > 0 ? '+' : '-')) + INF, why: 'Un n\u00famero sumado al infinito no lo cambia.' };
        return { res: 'k', why: 'Es una suma de n\u00fameros reales, sin ninguna dificultad.' };
      }
      if (op === '-') {
        if (iA && iB) return sA !== sB
          ? { res: (sA > 0 ? '+' : '-') + INF, why: 'Restar un infinito de signo contrario equivale a sumar.' }
          : { ind: '\u221E \u2212 \u221E', why: 'Los dos infinitos son del mismo signo y compiten: hay que resolver la indeterminaci\u00f3n.' };
        if (iA) return { res: (sA > 0 ? '+' : '-') + INF, why: 'Restar un n\u00famero al infinito no lo cambia.' };
        if (iB) return { res: (sB > 0 ? '-' : '+') + INF, why: 'Al restar un infinito el resultado es infinito de signo contrario.' };
        return { res: 'k', why: 'Es una resta de n\u00fameros reales.' };
      }
      if (op === '*') {
        if ((iA && B === 'cero') || (iB && A === 'cero')) {
          return { ind: '0 \u00b7 \u221E', why: 'El cero tira hacia abajo y el infinito hacia arriba: gana quien lo haga m\u00e1s deprisa.' };
        }
        if (iA || iB) return { res: INF, why: 'Un n\u00famero distinto de cero por infinito da infinito.' };
        if (A === 'cero' || B === 'cero') return { res: '0', why: 'Cualquier n\u00famero por cero da cero.' };
        return { res: 'k', why: 'Producto de n\u00fameros reales.' };
      }
      if (op === '/') {
        if (iA && iB) return { ind: '\u221E / \u221E', why: 'Los dos crecen sin l\u00edmite: hay que comparar a qu\u00e9 velocidad.' };
        if (A === 'cero' && B === 'cero') return { ind: '0 / 0', why: 'Los dos se acercan a cero: hay que comparar a qu\u00e9 velocidad.' };
        if (iB) return { res: '0', why: 'Dividir entre algo que crece sin l\u00edmite da cero.' };
        if (iA) return { res: INF, why: 'Dividir el infinito entre un n\u00famero sigue dando infinito.' };
        if (B === 'cero') return { res: INF, why: 'Dividir un n\u00famero distinto de cero entre algo que tiende a cero da infinito.' };
        return { res: 'k', why: 'Cociente de n\u00fameros reales con denominador no nulo.' };
      }
      /* potencia */
      if (A === 'uno' && iB) return { ind: '1 elevado a \u221E', why: 'La base se acerca a uno pero no es uno, y el exponente crece: aqu\u00ed nace el n\u00famero $e$.' };
      if (A === 'cero' && B === 'cero') return { ind: '0 elevado a 0', why: 'Se resuelve tomando logaritmos.' };
      if (iA && B === 'cero') return { ind: '\u221E elevado a 0', why: 'Se resuelve tomando logaritmos.' };
      if (A === 'uno') return { res: '1', why: 'Uno elevado a cualquier n\u00famero vale uno.' };
      if (B === 'cero') return { res: '1', why: 'Cualquier base distinta de cero elevada a cero vale uno.' };
      if (A === 'cero' && iB) return { res: sB > 0 ? '0' : '+' + INF, why: 'Cero elevado a m\u00e1s infinito da cero; a menos infinito, infinito.' };
      return { res: 'k', why: 'Potencia determinada.' };
    }
  };

  LI.clasifind = function (root) {
    var out = shell(root, 'Applet \u00b7 \u00bfEs una indeterminaci\u00f3n?', [
      'Escribe una sucesi\u00f3n con <code>n</code> y el applet sustituye, detecta si aparece una indeterminaci\u00f3n, la clasifica y estima el l\u00edmite real.',
      'Prueba los ejemplos del libro: <code>n^2/(2*n)-（1-2*n^3)/(n^2+2)</code> no; mejor <code>n^2/(2*n)+(1-2*n^3)/(n^2+2)</code>.',
      'Otros: <code>(1/2)^n*(2*n+1)</code> del tipo cero por infinito; <code>2^n/n</code> del tipo infinito partido infinito; <code>((n+1)/n)^n</code> del tipo uno elevado a infinito.',
      'Comprueba la idea esencial: indeterminado significa <b>todav\u00eda no determinado</b>, no que el l\u00edmite no exista.'
    ], rowText('an', 'a\u2099', '(1/2)^n*(2*n+1)'));

    live(root, out, function () {
      var src = val(root, 'an'), f = parse(src.replace(/n/g, 'x'));
      var L = limitInf(f, 1);
      var h = step(key('Sucesi\u00f3n: ') + T('a_{n}=' + texify(src)));
      h += tbl(['n', 'a\u2099'], [1, 5, 10, 50, 100, 1000, 100000].map(function (x) {
        return { cells: [String(x), T(nt(f(x), 8))], mark: x === 100000 };
      }));
      h += step(key('Estimaci\u00f3n del l\u00edmite: ') + chip(num(L.v, 6)));
      h += step(note('Al sustituir directamente, expresiones como esta suelen dar una de las siete indeterminaciones. La tabla muestra que el l\u00edmite s\u00ed existe: solo hab\u00eda que trabajar un poco m\u00e1s.'));
      h += step(key('Estrategia seg\u00fan el tipo: ') +
        'para ' + T(INF + '-' + INF) + ' se opera o se multiplica por el conjugado; para ' +
        T('\\dfrac{' + INF + '}{' + INF + '}') + ' se divide entre la mayor potencia; para ' +
        T('\\dfrac{0}{0}') + ' se factoriza y se simplifica; para ' + T('1^{' + INF + '}') + ' se busca el n\u00famero $e$.');
      return h;
    });
  };

  LI.indinfinf = function (root) {
    var out = shell(root, 'Applet \u00b7 Indeterminaci\u00f3n infinito partido infinito', [
      'Aparece en cocientes de polinomios y, sobre todo, cuando hay <b>radicales</b>. Se resuelve dividiendo numerador y denominador entre la <b>mayor potencia de $n$ del denominador</b>.',
      'Truco imprescindible: el exponente de las $n$ que est\u00e1n bajo una ra\u00edz queda dividido entre el \u00edndice. As\u00ed, $\\sqrt{n^{3}}$ tiene grado $\\tfrac{3}{2}$.',
      'Ejemplos del libro: $\\dfrac{2n-1}{\\sqrt[3]{n^{2}-3n+1}}$ tiende a $+\\infty$; $\\dfrac{\\sqrt{n^{3}+5n^{2}}}{n^{2}+3}$ tiende a $0$.',
      'Escribe el grado de cada parte y el applet compara. Tambi\u00e9n puedes usar la expresi\u00f3n completa para ver la tabla.'
    ],
      rowText('an', 'expresi\u00f3n con n', 'sqrt(n^3+5*n^2)/(n^2+3)') +
      '<div class="ap-row">' + mini('gp', 'grado del numerador', 1.5, 0.5) +
      mini('gq', 'grado del denominador', 2, 0.5) + '</div>');

    live(root, out, function () {
      var src = val(root, 'an'), gp = nv(root, 'gp'), gq = nv(root, 'gq');
      var f = parse(src.replace(/n/g, 'x'));
      var L = limitInf(f, 1);
      var h = step(key('L\u00edmite: ') + TD(LIMT('n', '+' + INF, texify(src))));
      h += step(key('Paso 1. ') + 'Al sustituir se obtiene ' + T('\\dfrac{' + INF + '}{' + INF + '}') +
        ', que es indeterminado.');
      h += step(key('Paso 2. ') + 'Comparamos grados: numerador ' + key(num(gp)) + ' y denominador ' + key(num(gq)) +
        '. ' + note('recuerda dividir el exponente entre el \u00edndice de la ra\u00edz'));
      h += step(key('Paso 3. ') + 'Dividimos numerador y denominador entre ' + T('n^{' + num(gq) + '}') +
        ' y pasamos al l\u00edmite.');
      var res = gp > gq ? '\\pm' + INF : gp === gq ? '\\text{cociente de coeficientes}' : '0';
      h += step(key('Conclusi\u00f3n te\u00f3rica: ') + (gp > gq
        ? 'gana el numerador, luego el l\u00edmite es ' + chip(T('\\pm' + INF))
        : gp === gq
          ? 'empatan, luego el l\u00edmite es el ' + chip('cociente de los coeficientes principales')
          : 'gana el denominador, luego el l\u00edmite es ' + chip(T('0'))));
      h += tbl(['n', 'valor'], [10, 100, 1000, 10000, 100000].map(function (x) {
        return { cells: [String(x), T(nt(f(x), 8))], mark: x === 100000 };
      }));
      h += step(key('Comprobaci\u00f3n num\u00e9rica: ') + chip(num(L.v, 6)) + ' ' +
        ((gp < gq && Math.abs(L.v) < 0.01) || (gp > gq && !isFinite(L.v)) || gp === gq ? ok('coherente') : note('compara con la teor\u00eda')));
      h += step(note('Con radicales conviene escribir el grado como fracci\u00f3n: $\\sqrt{n^{3}}=n^{3/2}$ y $\\sqrt[3]{n^{2}}=n^{2/3}$. Todo el apartado se reduce a comparar dos fracciones.'));
      return h;
    });
  };

  LI.indrestas = function (root) {
    var out = shell(root, 'Applet \u00b7 Indeterminaci\u00f3n infinito menos infinito', [
      'Aparece en dos situaciones. Con <b>diferencia de cocientes</b> se hace la resta de fracciones. Con <b>diferencia de radicales</b> se multiplica y divide por el <b>conjugado</b>.',
      'Escribe la expresi\u00f3n con <code>n</code>. Ejemplos: <code>2*n^2/(2*n+1)-n^3/(n^2+1)</code>; <code>sqrt(n^2+4)-sqrt(n^2-3)</code>; <code>2*n-sqrt(n^2-1)</code>.',
      'Resultados del libro: el primero tiende a $-\\tfrac{1}{2}$ y el segundo tiende a $0$.',
      'Aviso importante: la indeterminaci\u00f3n solo aparece de verdad si las dos expresiones tienen el <b>mismo grado</b>.'
    ],
      rowText('an', 'expresi\u00f3n con n', 'sqrt(n^2+4)-sqrt(n^2-3)') +
      '<div class="ap-row">' + sel('m', 'm\u00e9todo', [['conj', 'multiplicar por el conjugado'], ['frac', 'restar fracciones']], 'conj') + '</div>');

    live(root, out, function () {
      var src = val(root, 'an'), m = val(root, 'm');
      var f = parse(src.replace(/n/g, 'x'));
      var L = limitInf(f, 1);
      var h = step(key('L\u00edmite: ') + TD(LIMT('n', '+' + INF, texify(src))));
      h += step(key('Paso 1. ') + 'Al sustituir se obtiene ' + T(INF + '-' + INF) + ', indeterminado.');
      if (m === 'conj') {
        h += step(key('Paso 2. ') + 'Multiplicamos y dividimos por el conjugado, es decir, por la ' +
          key('suma') + ' de los radicales. As\u00ed en el numerador aparece una diferencia de cuadrados y desaparecen las ra\u00edces:');
        h += step(TD('\\sqrt{A}-\\sqrt{B}=\\dfrac{\\left(\\sqrt{A}-\\sqrt{B}\\right)\\left(\\sqrt{A}+\\sqrt{B}\\right)}{\\sqrt{A}+\\sqrt{B}}=\\dfrac{A-B}{\\sqrt{A}+\\sqrt{B}}'));
        h += step(key('Paso 3. ') + 'La nueva expresi\u00f3n suele ser del tipo ' + T('\\dfrac{' + INF + '}{' + INF + '}') +
          ', que ya sabemos resolver comparando grados.');
        h += step('En el ejemplo del libro, ' + T('\\sqrt{n^{2}+4}-\\sqrt{n^{2}-3}=\\dfrac{7}{\\sqrt{n^{2}+4}+\\sqrt{n^{2}-3}}') +
          ', cuyo l\u00edmite es ' + chip(T('0')) + ' porque el numerador es constante y el denominador crece.');
      } else {
        h += step(key('Paso 2. ') + 'Hacemos la resta de fracciones buscando denominador com\u00fan, y despu\u00e9s comparamos grados.');
        h += step('En el ejemplo del libro, ' +
          T('\\dfrac{2n^{2}}{2n+1}-\\dfrac{n^{3}}{n^{2}+1}=\\dfrac{-n^{3}+2n^{2}}{2n^{3}+n^{2}+2n+1}') +
          ', cuyo l\u00edmite es ' + chip(T('-\\dfrac{1}{2}')) + ' por tener el mismo grado arriba y abajo.');
      }
      h += tbl(['n', 'valor'], [10, 100, 1000, 10000, 100000].map(function (x) {
        return { cells: [String(x), T(nt(f(x), 8))], mark: x === 100000 };
      }));
      h += step(key('Comprobaci\u00f3n num\u00e9rica: ') + chip(num(L.v, 6)));
      h += warnStep('Ojo con la aritm\u00e9tica del ordenador: en estas restas se pierden cifras significativas, y para $n$ muy grande la tabla puede dar valores extra\u00f1os. Es un ejemplo real de por qu\u00e9 el c\u00e1lculo simb\u00f3lico es m\u00e1s fiable que el num\u00e9rico.');
      return h;
    });
  };

  LI.indcero = function (root) {
    var out = shell(root, 'Applet \u00b7 Indeterminaci\u00f3n cero partido cero', [
      'Aparece en cocientes de polinomios $\\dfrac{P(x)}{Q(x)}$ en un punto $c$ donde $P(c)=0$ y $Q(c)=0$. Se resuelve <b>factorizando y simplificando</b>.',
      'La clave es un resultado del tema de polinomios: si $P(c)=0$, entonces $P(x)$ es divisible entre $x-c$.',
      'Escribe los coeficientes de cada polinomio y el punto. Ejemplo del libro: $\\dfrac{x^{2}-1}{x^{3}-1}$ en $x=1$, cuyo l\u00edmite es $\\tfrac{2}{3}$.',
      'Prueba tambi\u00e9n <code>1,-2,-3</code> entre <code>1,1,-2</code> en $x=-1$, que da $\\tfrac{4}{3}$.'
    ],
      rowText('P', 'numerador', '1,0,-1') + rowText('Q', 'denominador', '1,0,0,-1') +
      '<div class="ap-row">' + mini('c', 'punto c', 1, 0.5) + '</div>');

    live(root, out, function () {
      var P = polParse(val(root, 'P')), Q = polParse(val(root, 'Q')), c = nv(root, 'c');
      var pc = polEval(P, c), qc = polEval(Q, c);
      var h = step(key('L\u00edmite: ') + TD(LIMT('x', nt(c), '\\dfrac{' + polTex(P) + '}{' + polTex(Q) + '}')));
      h += step(key('Paso 1. ') + 'Sustituimos: ' + T('\\dfrac{P(' + nt(c) + ')}{Q(' + nt(c) + ')}=\\dfrac{' +
        nt(pc, 6) + '}{' + nt(qc, 6) + '}'));
      if (Math.abs(pc) > 1e-9 || Math.abs(qc) > 1e-9) {
        if (Math.abs(qc) > 1e-9) {
          h += step(ok('No hay indeterminaci\u00f3n') + ': el l\u00edmite es directamente ' + chip(T(nt(pc / qc, 6))) + '.');
        } else {
          h += step(key('Caso distinto: ') + 'el numerador no se anula y el denominador s\u00ed, luego el l\u00edmite es ' +
            chip(T('\\pm' + INF)) + '. ' + note('Habr\u00e1 que estudiar los l\u00edmites laterales para saber el signo, y habr\u00e1 una as\u00edntota vertical.'));
        }
        return h;
      }
      h += step(bad('Es la indeterminaci\u00f3n cero partido cero') + '. Los dos polinomios se anulan en ' + T('x=' + nt(c)) +
        ', luego los dos son divisibles entre ' + T('x-' + nt(c)) + '.');
      var dp = polDiv(P, [1, -c]), dq = polDiv(Q, [1, -c]);
      h += step(key('Paso 2. ') + 'Dividimos, por ejemplo con la regla de Ruffini: ' +
        T('\\dfrac{' + polTex(P) + '}{' + polTex(Q) + '}=\\dfrac{\\left(x-' + nt(c) + '\\right)\\left(' + polTex(dp.q) +
        '\\right)}{\\left(x-' + nt(c) + '\\right)\\left(' + polTex(dq.q) + '\\right)}'));
      h += step(key('Paso 3. ') + 'Simplificamos el factor com\u00fan y volvemos a sustituir: ' +
        T(LIMT('x', nt(c), '\\dfrac{' + polTex(dp.q) + '}{' + polTex(dq.q) + '}')));
      var a2 = polEval(dp.q, c), b2 = polEval(dq.q, c);
      if (Math.abs(b2) < 1e-9 && Math.abs(a2) < 1e-9) {
        h += warnStep('Sigue saliendo cero partido cero: hay un factor repetido. Habr\u00eda que dividir otra vez entre ' +
          T('x-' + nt(c)) + '.');
      } else if (Math.abs(b2) < 1e-9) {
        h += step(key('Resultado: ') + chip(T('\\pm' + INF)) + ' ' + note('con as\u00edntota vertical en ese punto'));
      } else {
        h += step(key('Resultado: ') + chip(T('\\dfrac{' + nt(a2, 6) + '}{' + nt(b2, 6) + '}=' + fracTex(a2, b2))) +
          ' ' + note('valor aproximado ' + num(a2 / b2, 6)));
      }
      var f = function (x) { return polEval(P, x) / polEval(Q, x); };
      h += tbl(['x', 'valor'], [c - 0.1, c - 0.01, c - 0.001, c + 0.001, c + 0.01, c + 0.1].map(function (x) {
        return { cells: [num(x, 4), T(nt(f(x), 8))], mark: Math.abs(x - c) < 0.002 };
      }));
      h += step(note('Fundamental: la funci\u00f3n <b>no existe</b> en $x=' + num(c) + '$, pero el l\u00edmite s\u00ed. El l\u00edmite habla de los alrededores del punto, nunca del punto mismo.'));
      return h;
    });
  };

  LI.indceroinf = function (root) {
    var out = shell(root, 'Applet \u00b7 Indeterminaci\u00f3n cero por infinito', [
      'Suele darse en productos $f(x)\\cdot g(x)$ donde uno tiende a cero y el otro a infinito. Se resuelve <b>operando y simplificando</b> hasta convertirla en otra indeterminaci\u00f3n conocida.',
      'Escribe la expresi\u00f3n con <code>x</code> o con <code>n</code>. Ejemplo del libro: <code>(x^2+6*x+9)*(1/(3*x+9))</code> cuando $x$ tiende a $-3$.',
      'Otro caso frecuente: <code>(1/2)^n*(2*n+1)</code> cuando $n$ tiende a infinito, que vale $0$.',
      'La estrategia es siempre la misma: factorizar y ver qui\u00e9n gana, el que tira hacia cero o el que tira hacia infinito.'
    ],
      rowText('an', 'expresi\u00f3n', '(x^2+6*x+9)*(1/(3*x+9))') +
      '<div class="ap-row">' + sel('modo', 'tiende a', [['pt', 'un punto'], ['inf', 'infinito']], 'pt') +
      mini('c', 'punto c', -3, 0.5) + '</div>');

    live(root, out, function () {
      var src = val(root, 'an'), modo = val(root, 'modo'), c = nv(root, 'c');
      var f = parse(src.replace(/n/g, 'x'));
      var h = step(key('L\u00edmite: ') + TD(LIMT('x', modo === 'inf' ? '+' + INF : nt(c), texify(src))));
      h += step(key('Paso 1. ') + 'Al sustituir, un factor tiende a cero y el otro a infinito: ' +
        T('0\\cdot' + INF) + ', ' + bad('indeterminado') + '.');
      h += step(key('Paso 2. ') + 'Se factoriza y se simplifica. En el ejemplo del libro, ' +
        T('x^{2}+6x+9=\\left(x+3\\right)^{2}') + ' y ' + T('3x+9=3\\left(x+3\\right)') + ', luego la expresi\u00f3n queda ' +
        T('\\dfrac{\\left(x+3\\right)^{2}}{3\\left(x+3\\right)}=\\dfrac{x+3}{3}') + '.');
      h += step(key('Paso 3. ') + 'Ahora se sustituye sin problema.');
      var L = modo === 'inf' ? limitInf(f, 1) : { v: (limitAt(f, c, '-').v + limitAt(f, c, '+').v) / 2, kind: 'fin' };
      var rows = modo === 'inf'
        ? [10, 100, 1000, 10000].map(function (x) { return { cells: [String(x), T(nt(f(x), 8))], mark: x === 10000 }; })
        : [c - 0.1, c - 0.01, c - 0.001, c + 0.001, c + 0.01, c + 0.1].map(function (x) {
            return { cells: [num(x, 4), T(nt(f(x), 8))], mark: Math.abs(x - c) < 0.002 };
          });
      h += tbl(['x', 'valor'], rows);
      h += step(key('Estimaci\u00f3n del l\u00edmite: ') + chip(num(L.v, 6)));
      h += step(note('Una forma \u00fatil de verlo: $0\\cdot\\infty$ siempre se puede reescribir como $\\dfrac{0}{0}$ o como $\\dfrac{\\infty}{\\infty}$, pasando uno de los factores al denominador.'));
      return h;
    });
  };

  LI.numeroe = function (root) {
    var out = shell(root, 'Applet \u00b7 El n\u00famero e', [
      'El n\u00famero $e$ se define precisamente como un l\u00edmite del tipo uno elevado a infinito:',
      'Definici\u00f3n: $e=\\lim_{n \\to \\infty}\\left(1+\\dfrac{1}{n}\\right)^{n}\\approx 2{,}718282$.',
      'Observa la tabla: la base se acerca a uno y el exponente crece, y el resultado no es uno ni infinito, sino un n\u00famero irracional muy concreto.',
      'Comprueba tambi\u00e9n que $\\lim_{n \\to \\infty}\\left(1-\\dfrac{1}{n}\\right)^{n}=e^{-1}$, y que cambiar el $1$ del numerador por una $k$ da $e^{k}$.'
    ],
      '<div class="ap-row">' + mini('k', 'numerador k', 1, 0.5) + sel('s', 'signo', [['1', '+'], ['-1', '\u2212']], '1') + '</div>');

    live(root, out, function () {
      var k = nv(root, 'k'), s = parseInt(val(root, 's'), 10);
      var f = function (n) { return Math.pow(1 + s * k / n, n); };
      var rows = [1, 2, 10, 100, 1000, 10000, 100000, 1000000].map(function (n) {
        return { cells: [String(n), T(nt(1 + s * k / n, 8)), T(nt(f(n), 8))], mark: n === 1000000 };
      });
      var h = step(key('Sucesi\u00f3n: ') + TD('a_{n}=\\left(1' + (s > 0 ? '+' : '-') + '\\dfrac{' + nt(k) + '}{n}\\right)^{n}'));
      h += tbl(['n', 'base', 'a\u2099'], rows);
      h += step(key('L\u00edmite: ') + chip(T('e^{' + nt(s * k) + '}')) + ' ' + note('valor aproximado ' + num(Math.exp(s * k), 8)));
      h += step('Estimaci\u00f3n num\u00e9rica con ' + T('n=10^{6}') + ': ' + chip(num(f(1e6), 8)) + ' ' + ok('coherente'));
      h += step(key('Por qu\u00e9 no vale uno: ') + 'la base ' + key('no es') + ' uno, solo se acerca. Y el exponente crece tan deprisa que compensa esa peque\u00f1a diferencia. De ese equilibrio nace ' + T('e') + '.');
      h += step(note('Se trata de una sucesi\u00f3n siempre creciente y acotada, y por eso tiene l\u00edmite. Su valor, $2{,}718281828\\ldots$, es irracional y adem\u00e1s trascendente.'));
      var terms = [], i;
      for (i = 1; i <= 40; i++) terms.push(f(i));
      h += seqSVG(terms, Math.exp(s * k));
      return h;
    });
  };

  LI.ind1inf = function (root) {
    var out = shell(root, 'Applet \u00b7 Indeterminaci\u00f3n uno elevado a infinito', [
      'Se reconoce porque la <b>base tiende a uno</b> y el <b>exponente tiende a infinito</b>. Se resuelve transformando la expresi\u00f3n hasta que aparezca la definici\u00f3n del n\u00famero $e$.',
      'F\u00f3rmula r\u00e1pida, muy \u00fatil en los ex\u00e1menes: $\\lim f(x)^{g(x)}=e^{\\lim g(x)\\left[f(x)-1\\right]}$ cuando la base tiende a uno.',
      'Escribe la base y el exponente por separado. Ejemplo del libro: base <code>(2*x+3)/(2*x)</code> y exponente <code>3*x-2</code>, cuyo resultado es $e^{9/2}$.',
      'Otro cl\u00e1sico: base <code>(x+3)/(x+1)</code> y exponente <code>x-2</code>, que da $e^{2}$.'
    ],
      rowText('b', 'base f(x)', '(2*x+3)/(2*x)') + rowText('e', 'exponente g(x)', '3*x-2'));

    live(root, out, function () {
      var fb = parse(val(root, 'b')), fe = parse(val(root, 'e'));
      var Lb = limitInf(fb, 1), Le = limitInf(fe, 1);
      var h = step(key('L\u00edmite: ') + TD(LIMT('x', '+' + INF, '\\left(' + texify(val(root, 'b')) + '\\right)^{' +
        texify(val(root, 'e')) + '}')));
      h += step(key('Paso 1. ') + 'La base tiende a ' + T(nt(Lb.v, 6)) + ' y el exponente tiende a ' + T(nt(Le.v, 6)) + '.');
      if (Math.abs(Lb.v - 1) > 1e-6) {
        h += step(note('Aqu\u00ed la base no tiende a uno, luego no hay indeterminaci\u00f3n de este tipo: basta aplicar la propiedad de la potencia.'));
        h += step(key('Resultado: ') + chip(num(Math.pow(Lb.v, Le.v), 6)));
        return h;
      }
      h += step(bad('Es la indeterminaci\u00f3n uno elevado a infinito') + '.');
      var expo = function (x) { return fe(x) * (fb(x) - 1); };
      var E = limitInf(expo, 1);
      h += step(key('Paso 2. ') + 'Aplicamos la f\u00f3rmula: ' +
        TD('e^{\\lim g(x)\\left[f(x)-1\\right]}'));
      h += tbl(['x', 'base', 'g(x)\u00b7[f(x)\u22121]'], [10, 100, 1000, 10000, 100000].map(function (x) {
        return { cells: [String(x), T(nt(fb(x), 8)), T(nt(expo(x), 8))], mark: x === 100000 };
      }));
      h += step(key('Paso 3. ') + 'El exponente tiende a ' + chip(num(E.v, 6)) + ', luego el l\u00edmite es ' +
        chip(T('e^{' + nt(E.v, 4) + '}')) + ' ' + note('valor aproximado ' + num(Math.exp(E.v), 6)));
      var direct = function (x) { return Math.pow(fb(x), fe(x)); };
      h += step(key('Comprobaci\u00f3n directa con ') + T('x=10^{5}') + ': ' + chip(num(direct(1e5), 6)) + ' ' + ok('coincide'));
      h += step(note('El m\u00e9todo largo consiste en escribir la base como $1+\\dfrac{1}{\\text{algo}}$ y forzar que el exponente sea igual a ese algo. Multiplicar y dividir por lo mismo: no cambias nada, pero lo cambias todo.'));
      return h;
    });
  };

  /* =================================================================
     9. DIAGNÓSTICO Y ARRANQUE
     ================================================================= */

  LI.diagnostico = function (root) {
    var out = shell(root, 'Applet \u00b7 Diagn\u00f3stico del m\u00f3dulo', [
      'Applet de servicio: comprueba KaTeX, el s\u00edmbolo de infinito, la flecha de l\u00edmite, el analizador de expresiones y las dos figuras.',
      'Si todas las l\u00edneas salen en verde, el tema est\u00e1 listo para el aula.'
    ], rowText('f', 'funci\u00f3n de prueba', '(x^2-1)/(x^3-1)'));

    live(root, out, function () {
      var src = val(root, 'f'), f = parse(src);
      var h = step('KaTeX: ' + (window.katex ? ok('cargado') : bad('no cargado')) + ' \u00b7 autorenderizado: ' +
        (window.renderMathInElement ? ok('disponible') : bad('no disponible')));
      h += step('M\u00f3dulo de ampliaci\u00f3n: ' + (window.LIMX ? ok('cargado') : note('no cargado en esta p\u00e1gina')));
      h += step('S\u00edmbolos del tema: ' + T(LIMT('x', '+' + INF, 'f(x)') + '=L') + ' \u00b7 ' +
        T(LIMT('x', '-' + INF, 'f(x)') + '=-' + INF) + ' \u00b7 ' +
        T(LIMT('x', '2^{-}', 'f(x)') + '\\neq' + LIMT('x', '2^{+}', 'f(x)')) + ' ' + ok('correcto'));
      h += step('Texto plano, sin llaves: ' + chip(num(2 / 3, 4)) + chip(num(-1.5, 2)) + chip(num(Infinity)) +
        chip(num(-Infinity)) + ' ' + ok('correcto'));
      h += step('Analizador: ' + T('f(x)=' + texify(src)) + ' \u00b7 ' + T('f(2)=' + nt(f(2), 6)) + ' \u00b7 ' +
        T(LIMT('x', '1', 'f(x)') + '\\approx ' + nt(limitAt(f, 1, '+').v, 6)) + ' ' + ok('correcto'));
      h += step('Polinomios: ' + T('P(x)=' + polTex([1, 0, -1])) + ' entre ' + T('Q(x)=' + polTex([1, 0, 0, -1])) +
        ' \u00b7 cociente ' + T(polTex(polDiv([1, 0, -1], [1, -1]).q)) + ' entre ' +
        T(polTex(polDiv([1, 0, 0, -1], [1, -1]).q)));
      h += step('Gr\u00e1fica con as\u00edntotas:');
      h += plotSVG({
        x0: -4, x1: 4, y0: -6, y1: 6,
        vasym: [1], hasym: [0],
        curves: [{ f: function (x) { return 1 / (x - 1); } }],
        points: [{ x: 0, y: -1, lbl: 'f(0) = \u22121' }]
      });
      h += step('Diagrama de sucesi\u00f3n:');
      h += seqSVG((function () { var t = [], i; for (i = 1; i <= 30; i++) t.push((3 * i - 1) / (2 * i + 5)); return t; })(), 1.5);
      return h;
    });
  };

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-applet-lim]'), function (node) {
      var k = node.getAttribute('data-applet-lim');
      if (typeof LI[k] === 'function') {
        try { LI[k](node); }
        catch (e) {
          node.classList.add('applet');
          node.innerHTML = errBox('el applet \u00ab' + k + '\u00bb no ha podido iniciarse: ' +
            (e && e.message ? e.message : e));
        }
      } else {
        node.classList.add('applet');
        node.innerHTML = errBox('no existe ning\u00fan applet con la clave \u00ab' + k + '\u00bb en este m\u00f3dulo.');
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    setTimeout(boot, 0);
  }

  /* API pública para el módulo de ampliación. */
  window.LIM = {
    kt: kt, T: T, TD: TD, INF: INF, TO: TO, LIMT: LIMT,
    head: head, errBox: errBox, step: step, warnStep: warnStep,
    key: key, ok: ok, bad: bad, note: note, chip: chip, tbl: tbl,
    nt: nt, num: num, plain: plain, gcd: gcd, fracTex: fracTex,
    polParse: polParse, polDeg: polDeg, polLead: polLead, polEval: polEval,
    polTex: polTex, polDiv: polDiv, polRoots: polRoots,
    parse: parse, texify: texify, limitAt: limitAt, limitInf: limitInf,
    plotSVG: plotSVG, seqSVG: seqSVG, niceStep: niceStep,
    rowText: rowText, mini: mini, sel: sel, get: get, val: val, nv: nv, iv: iv,
    live: live, shell: shell, applets: LI
  };
})();
