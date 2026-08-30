/* =====================================================================
   eq-applets.js — ECUACIONES E INECUACIONES · 1r Batx Mates CCSS
   VERSION 3 — DEFINITIVA. Notacion en LaTeX compuesta por KaTeX.

   POR QUE KATEX
   MathJax esta pensado para procesar la pagina una vez y exige llamar
   a typeset cada vez que se inyecta contenido nuevo. Estos applets
   reescriben su salida en cada pulsacion de tecla, asi que ese modelo
   es fragil. KaTeX compone de forma sincrona y sin reflujo, de modo que
   basta llamar a renderMathInElement despues de escribir el HTML.
   Resultado: un unico lenguaje, LaTeX, tanto en la prosa de los .qmd
   como en la salida de los applets.

   DEPENDENCIAS (las carga assets/_scripts.html, en este orden)
     1) katex.min.css
     2) katex.min.js
     3) contrib/auto-render.min.js   -> define window.renderMathInElement
     4) ../polinomios/assets/poly-applets.js  -> define window.POLY
     5) este archivo                 -> define window.EQAPP

   MOTOR ALGEBRAICO
   Se reutiliza window.POLY del tema de polinomios: parse, sub, mul,
   add, divmod, eval, factorize, factorTex, gcd, lcm, R. Los polinomios
   son arrays de racionales exactos en orden ascendente (indice = grado).
   Si window.POLY no estuviese, hay un parser de respaldo.

   INSERCION EN EL .qmd
     <div data-applet-eq="clave"></div>

   CLAVES
     cuadratica · sumaproducto · bicuadrada · productonulo · racional
     irracional · exponencial · logaritmica · inecuacion1 · inecuacion2
     intervalos · diagnostico
   ===================================================================== */

(function () {
  'use strict';

  var EQ = {};
  var P = (typeof window !== 'undefined' && window.POLY) ? window.POLY : null;

  /* =================================================================
     0. COMPOSICION CON KATEX
     ================================================================= */

  var KATEX_OPTS = {
    /* El orden importa: los delimitadores largos van primero. */
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
      try { window.renderMathInElement(node, KATEX_OPTS); } catch (e) { /* silencioso */ }
    }
  }

  /* Envoltorios de LaTeX. */
  function T(tex) { return '$' + tex + '$'; }
  function TD(tex) { return '$$' + tex + '$$'; }

  /* =================================================================
     1. PRESENTACION
     ================================================================= */

  function head(title, bullets) {
    var li = bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('');
    return '<div class="ap-head"><h4 class="ap-title">' + title + '</h4>' +
           '<ul class="ap-help">' + li + '</ul></div>';
  }

  function errBox(msg) { return '<div class="ap-err">Aviso: ' + msg + '</div>'; }
  function step(html) { return '<div class="ap-step">' + html + '</div>'; }
  function warnStep(html) { return '<div class="ap-step ap-warn">' + html + '</div>'; }
  function key(t) { return '<span class="ap-key">' + t + '</span>'; }
  function ok(t) { return '<span class="ap-ok">' + t + '</span>'; }
  function bad(t) { return '<span class="ap-bad">' + t + '</span>'; }
  function note(t) { return '<span class="ap-note">' + t + '</span>'; }
  function chip(t, isBad) {
    return '<span class="ap-chip' + (isBad ? ' ap-chip-bad' : '') + '">' + t + '</span>';
  }

  /* =================================================================
     2. NUMEROS Y POLINOMIOS EN LATEX
     ================================================================= */

  function nz(x) { return Math.abs(x) < 1e-11 ? 0 : x; }

  /* Numero decimal, con coma decimal a la espanola. */
  function nt(x) {
    if (!isFinite(x)) return '\\text{no definido}';
    var y = nz(x), r = Math.round(y * 1e6) / 1e6;
    return Number.isInteger(r) ? String(r) : String(r).replace('.', '{,}');
  }

  /* Numero exacto: fraccion cuando el denominador es pequeno. */
  function qt(x) {
    var y = nz(x);
    if (Number.isInteger(y)) return String(y);
    for (var d = 2; d <= 24; d++) {
      var p = y * d;
      if (Math.abs(p - Math.round(p)) < 1e-9) {
        p = Math.round(p);
        return (p < 0 ? '-' : '') + '\\dfrac{' + Math.abs(p) + '}{' + d + '}';
      }
    }
    return nt(y);
  }

  /* Entre parentesis si es negativo, para leer bien los productos. */
  function par(x) { return x < 0 ? '\\left(' + nt(x) + '\\right)' : nt(x); }

  function snap(x) {
    for (var d = 1; d <= 24; d++) {
      var p = x * d;
      if (Math.abs(p - Math.round(p)) < 1e-8) return Math.round(p) / d;
    }
    return x;
  }

  function denomOf(x, max) {
    max = max || 64;
    for (var d = 1; d <= max; d++) {
      if (Math.abs(x * d - Math.round(x * d)) < 1e-9) return d;
    }
    return 1;
  }

  /* Polinomio a LaTeX: 2x^{2}-5x-3 */
  function pt(a) {
    var p = ptrim(a), out = '', any = false;
    for (var k = p.length - 1; k >= 0; k--) {
      var c = nz(p[k]);
      if (c === 0 && p.length > 1) continue;
      var sg = c < 0 ? '-' : (any ? '+' : '');
      var abs = Math.abs(c);
      var body = (abs === 1 && k > 0) ? '' : qt(abs);
      var vv = k === 0 ? '' : (k === 1 ? 'x' : 'x^{' + k + '}');
      out += sg + body + vv;
      any = true;
    }
    return any ? out : '0';
  }

  /* =================================================================
     3. ADAPTADOR AL MOTOR window.POLY
     ================================================================= */

  function ratToNum(c) {
    if (c === null || c === undefined) return NaN;
    if (typeof c === 'number') return c;
    if (typeof c === 'object') {
      if (typeof c.n === 'number' && typeof c.d === 'number') return c.n / c.d;
      if (typeof c.num === 'number' && typeof c.den === 'number') return c.num / c.den;
      if (typeof c.p === 'number' && typeof c.q === 'number') return c.p / c.q;
      if (typeof c.valueOf === 'function') {
        var v = Number(c.valueOf());
        if (!isNaN(v)) return v;
      }
    }
    var w = Number(c);
    return isNaN(w) ? NaN : w;
  }

  function usable(arr) {
    return Array.isArray(arr) && arr.length > 0 &&
      arr.every(function (v) { return typeof v === 'number' && isFinite(v); });
  }

  function miniParse(src) {
    var s = String(src).replace(/\s+/g, '').replace(/,/g, '.');
    if (!s) throw new Error('la expresi\u00f3n est\u00e1 vac\u00eda.');
    var i = 0;

    function expr() {
      var v = term();
      while (s[i] === '+' || s[i] === '-') {
        var op = s[i++], t = term();
        v = (op === '+') ? padd(v, t) : psub(v, t);
      }
      return v;
    }
    function term() {
      var v = factor();
      for (;;) {
        if (s[i] === '*') { i++; v = pmul(v, factor()); }
        else if (s[i] === '/') {
          i++;
          var d = factor();
          if (d.length !== 1) throw new Error('solo se puede dividir entre n\u00fameros.');
          if (Math.abs(d[0]) < 1e-12) throw new Error('no se puede dividir entre cero.');
          v = pscal(v, 1 / d[0]);
        }
        else if (i < s.length && /[0-9x(]/.test(s[i])) { v = pmul(v, factor()); }
        else break;
      }
      return v;
    }
    function factor() {
      var v = base();
      if (s[i] === '^') {
        i++;
        if (s[i] === '-') throw new Error('un exponente negativo no da un polinomio.');
        var e = '';
        while (i < s.length && /[0-9]/.test(s[i])) e += s[i++];
        if (!e) throw new Error('falta el exponente despu\u00e9s de ^.');
        v = ppow(v, parseInt(e, 10));
      }
      return v;
    }
    function base() {
      if (s[i] === '-') { i++; return pscal(base(), -1); }
      if (s[i] === '+') { i++; return base(); }
      if (s[i] === '(') {
        i++;
        var v = expr();
        if (s[i] !== ')') throw new Error('falta cerrar un par\u00e9ntesis.');
        i++;
        return v;
      }
      if (s[i] === 'x' || s[i] === 'X') { i++; return [0, 1]; }
      var num = '';
      while (i < s.length && /[0-9.]/.test(s[i])) num += s[i++];
      if (!num) throw new Error('no entiendo el car\u00e1cter \u00ab' + (s[i] || 'final') + '\u00bb.');
      return [parseFloat(num)];
    }

    var out = expr();
    if (i < s.length) {
      throw new Error('no entiendo el car\u00e1cter \u00ab' + s[i] + '\u00bb en la posici\u00f3n ' + (i + 1) + '.');
    }
    return ptrim(out);
  }

  function coeffs(src) {
    if (P && typeof P.parse === 'function') {
      try {
        var raw = P.parse(src);
        if (Array.isArray(raw)) {
          var out = raw.map(ratToNum);
          if (usable(out)) return ptrim(out);
        }
      } catch (e) {
        throw new Error(e && e.message ? e.message : 'no he entendido la expresi\u00f3n.');
      }
    }
    return miniParse(src);
  }

  /* =================================================================
     4. ARITMETICA NUMERICA
     ================================================================= */

  function ptrim(a) {
    var r = a.slice();
    while (r.length > 1 && Math.abs(r[r.length - 1]) < 1e-12) r.pop();
    return r;
  }
  function padd(a, b) {
    var m = Math.max(a.length, b.length), r = [];
    for (var i = 0; i < m; i++) r[i] = (a[i] || 0) + (b[i] || 0);
    return ptrim(r);
  }
  function psub(a, b) {
    var m = Math.max(a.length, b.length), r = [];
    for (var i = 0; i < m; i++) r[i] = (a[i] || 0) - (b[i] || 0);
    return ptrim(r);
  }
  function pmul(a, b) {
    var r = new Array(a.length + b.length - 1).fill(0);
    for (var i = 0; i < a.length; i++)
      for (var j = 0; j < b.length; j++) r[i + j] += a[i] * b[j];
    return ptrim(r);
  }
  function ppow(a, k) { var r = [1]; for (var i = 0; i < k; i++) r = pmul(r, a); return r; }
  function pscal(a, k) { return ptrim(a.map(function (c) { return c * k; })); }
  function pev(a, x) { var s = 0; for (var i = a.length - 1; i >= 0; i--) s = s * x + a[i]; return s; }
  function pdeg(a) { return ptrim(a).length - 1; }

  function deflate(p, r) {
    var m = p.length - 1, qq = new Array(m).fill(0), carry = p[m];
    for (var k = m - 1; k >= 0; k--) { qq[k] = carry; carry = p[k] + carry * r; }
    return { q: ptrim(qq), rest: carry };
  }

  function quad(a, b, c) {
    if (Math.abs(a) < 1e-12) {
      if (Math.abs(b) < 1e-12) return { kind: Math.abs(c) < 1e-12 ? 'all' : 'none', D: null, roots: [] };
      return { kind: 'linear', D: null, roots: [-c / b] };
    }
    var D = b * b - 4 * a * c;
    if (D < -1e-10) return { kind: 'complex', D: D, roots: [] };
    if (Math.abs(D) <= 1e-10) return { kind: 'double', D: 0, roots: [-b / (2 * a)] };
    var s = Math.sqrt(D), r1 = (-b - s) / (2 * a), r2 = (-b + s) / (2 * a);
    return { kind: 'two', D: D, roots: [Math.min(r1, r2), Math.max(r1, r2)] };
  }

  function bisect(p, a, b) {
    for (var k = 0; k < 80; k++) {
      var m = (a + b) / 2;
      if (pev(p, a) * pev(p, m) <= 0) b = m; else a = m;
    }
    return (a + b) / 2;
  }
  function scanRoot(p) {
    var prev = pev(p, -60);
    for (var x = -59.99; x <= 60; x += 0.01) {
      var cur = pev(p, x);
      if (prev * cur < 0) return bisect(p, x - 0.01, x);
      prev = cur;
    }
    return null;
  }
  function allScan(p) {
    var out = [], prev = pev(p, -60);
    for (var x = -59.99; x <= 60; x += 0.01) {
      var cur = pev(p, x);
      if (prev * cur < 0) out.push(bisect(p, x - 0.01, x));
      prev = cur;
    }
    return out;
  }

  function realRoots(pIn) {
    var p = ptrim(pIn.slice());
    if (p.length === 1) return { roots: [], all: Math.abs(p[0]) < 1e-12 };
    var roots = [];
    while (p.length > 1 && Math.abs(p[0]) < 1e-12) { p = p.slice(1); roots.push(0); }

    function candidate() {
      for (var d = 1; d <= 12; d++) {
        for (var k = 1; k <= 60; k++) {
          if (Math.abs(pev(p, k / d)) < 1e-9) return k / d;
          if (Math.abs(pev(p, -k / d)) < 1e-9) return -k / d;
        }
      }
      return null;
    }

    var guard = 0;
    while (p.length - 1 > 2 && guard++ < 12) {
      var r = candidate();
      if (r === null) { r = scanRoot(p); if (r === null) break; }
      roots.push(snap(r));
      p = deflate(p, r).q;
    }

    var d2 = p.length - 1;
    if (d2 === 1) roots.push(snap(-p[0] / p[1]));
    else if (d2 === 2) quad(p[2], p[1], p[0]).roots.forEach(function (v) { roots.push(snap(v)); });
    else if (d2 > 2) allScan(p).forEach(function (v) { roots.push(snap(v)); });

    var uniq = [];
    roots.map(nz).sort(function (a, b) { return a - b; }).forEach(function (v) {
      if (!uniq.length || Math.abs(uniq[uniq.length - 1] - v) > 1e-7) uniq.push(v);
    });
    return { roots: uniq, all: false };
  }

  /* =================================================================
     5. DESIGUALDADES
     ================================================================= */

  var OPS = ['<', '<=', '>', '>='];
  var FLIP = { '<': '>', '<=': '>=', '>': '<', '>=': '<=' };

  function opT(op) { return op === '<' ? '<' : op === '<=' ? '\\leq' : op === '>' ? '>' : '\\geq'; }
  function opUni(op) { return op === '<' ? '<' : op === '<=' ? '\u2264' : op === '>' ? '>' : '\u2265'; }
  function opHolds(v, op) {
    return op === '<' ? v < 0 : op === '<=' ? v <= 0 : op === '>' ? v > 0 : v >= 0;
  }
  function opClosed(op) { return op === '<=' || op === '>='; }

  function splitIneq(src) {
    var s = String(src).replace(/\s+/g, '').replace(/\u2264/g, '<=').replace(/\u2265/g, '>=');
    var found = null, at = -1;
    ['<=', '>=', '<', '>'].forEach(function (o) {
      if (found) return;
      var k = s.indexOf(o);
      if (k > 0) { found = o; at = k; }
    });
    if (!found) {
      throw new Error('falta el signo de desigualdad. Usa <code>&lt;</code>, <code>&lt;=</code>, <code>&gt;</code> o <code>&gt;=</code>.');
    }
    var L = s.slice(0, at), R = s.slice(at + found.length);
    if (!R) throw new Error('falta el segundo miembro de la desigualdad.');
    return { op: found, poly: psub(coeffs(L), coeffs(R)) };
  }

  function splitEq(src) {
    var parts = String(src).split('=');
    if (parts.length !== 2) throw new Error('escribe una sola igualdad, con un \u00fanico signo <code>=</code>.');
    return psub(coeffs(parts[0]), coeffs(parts[1]));
  }

  function ivT(l, r, lc, rc) {
    var L = (l === -Infinity) ? '-\\infty' : qt(l);
    var R = (r === Infinity) ? '+\\infty' : qt(r);
    return (lc ? '\\left[' : '\\left(') + L + ',\\ ' + R + (rc ? '\\right]' : '\\right)');
  }

  function solveIneq(p, op) {
    var rs = realRoots(p).roots;
    if (!rs.length) {
      return { tex: opHolds(pev(p, 0), op) ? '\\mathbb{R}' : '\\varnothing', roots: [], pieces: [] };
    }
    var cuts = [-Infinity].concat(rs, [Infinity]), pieces = [], k;
    for (k = 0; k < cuts.length - 1; k++) {
      var a = cuts[k], b = cuts[k + 1];
      var m = (a === -Infinity) ? b - 1 : (b === Infinity) ? a + 1 : (a + b) / 2;
      var v = pev(p, m);
      pieces.push({ a: a, b: b, probe: m, val: v, okk: opHolds(v, op) });
    }
    var closed = opClosed(op), parts = [];
    k = 0;
    while (k < pieces.length) {
      if (!pieces[k].okk) { k++; continue; }
      var start = pieces[k].a, j = k;
      while (j + 1 < pieces.length && pieces[j + 1].okk && closed) j++;
      var end = pieces[j].b;
      parts.push(ivT(start, end, closed && start !== -Infinity, closed && end !== Infinity));
      k = j + 1;
    }
    if (!parts.length && closed) {
      var pts = rs.filter(function (r) { return Math.abs(pev(p, r)) < 1e-9; });
      if (pts.length) {
        return { tex: '\\left\\{' + pts.map(qt).join(',\\ ') + '\\right\\}', roots: rs, pieces: pieces };
      }
    }
    return {
      tex: parts.length ? parts.join(' \\cup ') : '\\varnothing',
      roots: rs, pieces: pieces
    };
  }

  /* =================================================================
     6. FIGURAS SVG
     ================================================================= */

  function svgCurve(p, roots, xmin, xmax) {
    var W = 500, H = 280, pad = 26, i, x, ys = [];
    for (i = 0; i <= 200; i++) {
      var v = pev(p, xmin + (xmax - xmin) * i / 200);
      if (isFinite(v)) ys.push(Math.abs(v));
    }
    var ymax = Math.max(2, Math.min(60, Math.max.apply(null, ys))), ymin = -ymax;
    function sx(t) { return pad + (t - xmin) / (xmax - xmin) * (W - 2 * pad); }
    function sy(t) { return H - pad - (t - ymin) / (ymax - ymin) * (H - 2 * pad); }

    var d = '', pen = false;
    for (i = 0; i <= 400; i++) {
      x = xmin + (xmax - xmin) * i / 400;
      var y = pev(p, x);
      if (!isFinite(y) || y > ymax * 1.35 || y < ymin * 1.35) { pen = false; continue; }
      d += (pen ? 'L' : 'M') + sx(x).toFixed(1) + ',' + sy(y).toFixed(1) + ' ';
      pen = true;
    }
    var dots = roots.map(function (r) {
      if (r < xmin || r > xmax) return '';
      return '<circle cx="' + sx(r).toFixed(1) + '" cy="' + sy(0).toFixed(1) + '" r="5" fill="#e63946"/>';
    }).join('');

    return '<svg class="ap-fig" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="gr\u00e1fica de la funci\u00f3n">' +
      '<line x1="' + pad + '" y1="' + sy(0).toFixed(1) + '" x2="' + (W - pad) + '" y2="' + sy(0).toFixed(1) + '" stroke="#94a3b8"/>' +
      '<line x1="' + sx(0).toFixed(1) + '" y1="' + pad + '" x2="' + sx(0).toFixed(1) + '" y2="' + (H - pad) + '" stroke="#94a3b8"/>' +
      '<path d="' + d + '" fill="none" stroke="#2a76dd" stroke-width="2.6"/>' + dots + '</svg>';
  }

  function svgLine(pieces, roots, closed) {
    var W = 500, H = 92, pad = 30, y = 52, lo = -10, hi = 10;
    if (roots.length) {
      lo = Math.min(-2, Math.min.apply(null, roots) - 3);
      hi = Math.max(2, Math.max.apply(null, roots) + 3);
    }
    function sx(v) { return pad + (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * (W - 2 * pad); }
    var bars = pieces.filter(function (s) { return s.okk; }).map(function (s) {
      var a = (s.a === -Infinity) ? lo : s.a, b = (s.b === Infinity) ? hi : s.b;
      return '<line x1="' + sx(a).toFixed(1) + '" y1="' + y + '" x2="' + sx(b).toFixed(1) +
             '" y2="' + y + '" stroke="#2a76dd" stroke-width="9" opacity="0.85"/>';
    }).join('');
    var dots = roots.map(function (r) {
      return '<circle cx="' + sx(r).toFixed(1) + '" cy="' + y + '" r="6.5" fill="' +
        (closed ? '#2a76dd' : '#ffffff') + '" stroke="#1d4ed8" stroke-width="2.5"/>' +
        '<text x="' + sx(r).toFixed(1) + '" y="' + (y + 26) + '" font-size="13" text-anchor="middle" fill="#334155">' +
        String(Math.round(r * 1000) / 1000).replace('.', ',') + '</text>';
    }).join('');
    return '<svg class="ap-fig" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="recta real con el conjunto soluci\u00f3n">' +
      '<line x1="' + pad + '" y1="' + y + '" x2="' + (W - pad) + '" y2="' + y + '" stroke="#94a3b8" stroke-width="2"/>' +
      '<polygon points="' + (W - pad) + ',' + y + ' ' + (W - pad - 10) + ',' + (y - 5) + ' ' + (W - pad - 10) + ',' + (y + 5) + '" fill="#94a3b8"/>' +
      bars + dots + '</svg>';
  }

  /* =================================================================
     7. INTERFAZ
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
  function selOp(role, value) {
    var o = OPS.map(function (op) {
      return '<option value="' + op + '"' + (op === value ? ' selected' : '') + '>' + opUni(op) + '</option>';
    }).join('');
    return '<label class="ap-lab">Signo</label><select class="ap-sel" data-role="' + role + '">' + o + '</select>';
  }
  function get(root, role) { return root.querySelector('[data-role="' + role + '"]'); }
  function val(root, role) { return get(root, role).value; }
  function nv(root, role) { return parseFloat(get(root, role).value); }

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

  /* =================================================================
     8. APPLETS
     ================================================================= */

  /* ---------- Applet · Ecuacion de segundo grado ---------- */
  EQ.cuadratica = function (root) {
    var out = shell(root, 'Applet \u00b7 Ecuaci\u00f3n de segundo grado', [
      'Escribe la ecuaci\u00f3n completa, con el signo <code>=</code>. El applet la reduce a la forma $ax^{2}+bx+c=0$ antes de resolverla.',
      'Ejemplos: <code>2x^2-5x-3=0</code>, <code>x^2=4</code>, <code>(x-1)(x+3)=5</code>, <code>3x^2+2x=x^2-4x-3</code>.',
      'Cuidado con la sintaxis: <code>1/2x^2</code> se lee como $1$ dividido entre $2x^{2}$. Escribe <code>(1/2)x^2</code>.',
      'Busca los tres casos del discriminante: dos ra\u00edces, una ra\u00edz doble y ninguna ra\u00edz real.'
    ], rowText('eq', 'Ecuaci\u00f3n', '2x^2-5x-3=0'));

    live(root, out, function () {
      var p = splitEq(val(root, 'eq'));
      if (pdeg(p) > 2) throw new Error('esa ecuaci\u00f3n es de grado ' + pdeg(p) + '. Usa el applet de producto nulo.');
      var a = p[2] || 0, b = p[1] || 0, c = p[0] || 0, r = quad(a, b, c);
      var h = step('Forma reducida: ' + T(pt(p) + '=0'));

      if (r.kind === 'all') return h + step(ok('Se reduce a $0=0$: cualquier n\u00famero real es soluci\u00f3n.'));
      if (r.kind === 'none') return h + step(bad('Se reduce a una contradicci\u00f3n: no hay soluci\u00f3n.'));
      if (r.kind === 'linear') {
        return h + step('No es de segundo grado: el coeficiente de ' + T('x^{2}') + ' es cero.') +
          step(key('Soluci\u00f3n \u00fanica: ') + T('x=' + qt(r.roots[0])));
      }

      h += step(T('\\Delta=b^{2}-4ac=' + par(b) + '^{2}-4\\cdot' + par(a) + '\\cdot' + par(c) + '=' + nt(r.D)));

      if (r.kind === 'complex') {
        h += step(bad('$\\Delta<0$') + ': no hay ra\u00edces reales. La par\u00e1bola no corta el eje horizontal.');
      } else if (r.kind === 'double') {
        h += step(T('\\Delta=0') + ': ra\u00edz doble ' + T('x=-\\dfrac{b}{2a}=' + qt(r.roots[0])) +
          '. La par\u00e1bola es tangente al eje.');
      } else {
        h += step(T('x=\\dfrac{-b\\pm\\sqrt{\\Delta}}{2a}=\\dfrac{' + nt(-b) + '\\pm\\sqrt{' + nt(r.D) + '}}{' + nt(2 * a) + '}') +
          ' da ' + chip(T(qt(r.roots[0]))) + chip(T(qt(r.roots[1]))));
        h += step('Factorizada: ' + T(qt(a) + '\\left(x-' + par(r.roots[0]) + '\\right)\\left(x-' + par(r.roots[1]) + '\\right)=0'));
        h += step('Comprobaci\u00f3n con las relaciones de las ra\u00edces: suma ' +
          T(nt(r.roots[0] + r.roots[1]) + '=-\\dfrac{b}{a}') + ' y producto ' +
          T(nt(r.roots[0] * r.roots[1]) + '=\\dfrac{c}{a}') + '.');
      }
      h += step('V\u00e9rtice en ' + T('x=-\\dfrac{b}{2a}=' + qt(-b / (2 * a))) + ', y con ' + T('a=' + nt(a)) +
        ' la par\u00e1bola abre hacia ' + (a > 0 ? 'arriba' : 'abajo') + '.');
      h += svgCurve(p, r.roots, -10, 10);
      return h;
    });
  };

  /* ---------- Applet · Suma y producto de raices ---------- */
  EQ.sumaproducto = function (root) {
    var out = shell(root, 'Applet \u00b7 Suma y producto de ra\u00edces', [
      'Mueve los coeficientes y comprueba $x_{1}+x_{2}=-\\dfrac{b}{a}$ y $x_{1}x_{2}=\\dfrac{c}{a}$ sin resolver la ecuaci\u00f3n.',
      'Al rev\u00e9s tambi\u00e9n funciona: si la suma es $A$ y el producto es $B$, la ecuaci\u00f3n es $x^{2}-Ax+B=0$.',
      'Ejemplos: $a=1$, $b=-5$, $c=6$ con suma $5$ y producto $6$; tambi\u00e9n $a=2$, $b=-5$, $c=-3$; y $a=1$, $b=0$, $c=-9$.'
    ], '<div class="ap-row">' + mini('a', 'a', 1) + mini('b', 'b', -5) + mini('c', 'c', 6) + '</div>');

    live(root, out, function () {
      var a = nv(root, 'a'), b = nv(root, 'b'), c = nv(root, 'c');
      if (!isFinite(a) || Math.abs(a) < 1e-12) throw new Error('el coeficiente $a$ no puede ser cero en una ecuaci\u00f3n de segundo grado.');
      var r = quad(a, b, c);
      var h = step('Ecuaci\u00f3n: ' + T(pt([c, b, a]) + '=0'));
      h += step('Sin resolver: suma ' + T('-\\dfrac{b}{a}=' + qt(-b / a)) +
        ' y producto ' + T('\\dfrac{c}{a}=' + qt(c / a)));
      if (r.roots.length) {
        var s = r.roots.length === 2 ? r.roots[0] + r.roots[1] : 2 * r.roots[0];
        var pr = r.roots.length === 2 ? r.roots[0] * r.roots[1] : r.roots[0] * r.roots[0];
        h += step('Resolviendo: ' + r.roots.map(function (v) { return chip(T(qt(v))); }).join('') +
          ' con suma ' + T(nt(s)) + ' y producto ' + T(nt(pr)) + ' ' + ok('(coincide)'));
      } else {
        h += step(T('\\Delta=' + nt(r.D) + '<0') +
          ': las ra\u00edces no son reales y, sin embargo, la suma y el producto siguen valiendo lo calculado. Es una idea potente.');
      }
      h += step('Reconstrucci\u00f3n m\u00f3nica: ' + T('x^{2}-\\left(' + nt(-b / a) + '\\right)x+\\left(' + nt(c / a) + '\\right)=0'));
      return h;
    });
  };

  /* ---------- Applet · Ecuacion bicuadrada ---------- */
  EQ.bicuadrada = function (root) {
    var out = shell(root, 'Applet \u00b7 Ecuaci\u00f3n bicuadrada', [
      'Trabajamos con $ax^{4}+bx^{2}+c=0$. El applet hace el cambio $t=x^{2}$, resuelve en $t$ y deshace el cambio.',
      'La clave est\u00e1 en el \u00faltimo paso: solo los valores $t\\geq 0$ devuelven ra\u00edces reales, porque $x=\\pm\\sqrt{t}$.',
      'Ejemplos: $a=1$, $b=-5$, $c=4$ da cuatro soluciones; $a=1$, $b=5$, $c=4$ no da ninguna; $a=1$, $b=-4$, $c=0$ da tres.'
    ], '<div class="ap-row">' + mini('a', 'a', 1) + mini('b', 'b', -5) + mini('c', 'c', 4) + '</div>');

    live(root, out, function () {
      var a = nv(root, 'a'), b = nv(root, 'b'), c = nv(root, 'c');
      if (!isFinite(a) || Math.abs(a) < 1e-12) throw new Error('si $a=0$ la ecuaci\u00f3n no es bicuadrada.');
      var r = quad(a, b, c);
      var h = step('Ecuaci\u00f3n: ' + T(pt([c, 0, b, 0, a]) + '=0'));
      h += step('Cambio ' + T('t=x^{2}') + ': ' + T(pt([c, b, a]) + '=0') + ' en la variable ' + T('t'));
      h += step(T('\\Delta=' + nt(r.D)) + '. Valores de ' + T('t') + ': ' +
        (r.roots.length ? r.roots.map(function (t) { return chip(T(nt(t)), t < 0); }).join('') : bad('ninguno real')));
      var xs = [];
      r.roots.forEach(function (t) {
        if (t > 1e-10) {
          xs.push(-Math.sqrt(t), Math.sqrt(t));
          h += step(T('t=' + nt(t) + '>0') + ' ' + T('\\Rightarrow') + ' ' +
            T('x=\\pm\\sqrt{' + nt(t) + '}=\\pm' + nt(Math.sqrt(t))));
        } else if (Math.abs(t) <= 1e-10) {
          xs.push(0);
          h += step(T('t=0') + ' ' + T('\\Rightarrow') + ' ' + T('x=0') + ' (soluci\u00f3n doble)');
        } else {
          h += step(bad(T('t=' + nt(t) + '<0')) + ': descartado, ning\u00fan cuadrado real es negativo.');
        }
      });
      xs = xs.map(snap).sort(function (u, v) { return u - v; });
      h += step(key('Soluciones: ') +
        (xs.length ? xs.map(function (v) { return chip(T(qt(v))); }).join('') : chip(T('\\varnothing'), true)));
      h += svgCurve([c, 0, b, 0, a], xs, -5, 5);
      return h;
    });
  };

  /* ---------- factorizacion exacta con POLY.factorize ---------- */

  function facMonicT(r, mult) {
    var body;
    if (Math.abs(r) < 1e-12) body = 'x';
    else body = '\\left(x' + (r > 0 ? '-' : '+') + qt(Math.abs(r)) + '\\right)';
    return mult > 1 ? body + '^{' + mult + '}' : body;
  }

  function facIntegerT(r, mult) {
    if (Math.abs(r) < 1e-12) return mult > 1 ? 'x^{' + mult + '}' : 'x';
    var d = denomOf(r);
    if (d === 1) return facMonicT(r, mult);
    var p = Math.round(r * d);
    var body = '\\left(' + d + 'x' + (p > 0 ? '-' : '+') + Math.abs(p) + '\\right)';
    return mult > 1 ? body + '^{' + mult + '}' : body;
  }

  function factorViews(f) {
    var kNum = ratToNum(f.k);
    if (!isFinite(kNum)) kNum = 1;
    var mon = '', ent = '', divisor = 1, lin = [], quads = [];

    if (f.xmult > 0) {
      var xs = f.xmult > 1 ? 'x^{' + f.xmult + '}' : 'x';
      mon += xs; ent += xs;
    }
    (f.linear || []).forEach(function (L) {
      var r = ratToNum(L.root), m = L.mult || 1;
      lin.push({ r: r, m: m });
      mon += facMonicT(r, m);
      ent += facIntegerT(r, m);
      var d = denomOf(r);
      if (d > 1) divisor *= Math.pow(d, m);
    });
    (f.quads || []).forEach(function (Q) {
      var num = (Q.poly || []).map(ratToNum);
      var txt = '\\left(' + pt(num) + '\\right)';
      quads.push({ num: num, disc: ratToNum(Q.disc), roots: Q.roots || [] });
      mon += txt; ent += txt;
    });

    var kEnt = kNum / divisor;
    return {
      monic: (Math.abs(kNum - 1) < 1e-12 ? '' : qt(kNum)) + (mon || '1'),
      integer: (Math.abs(kEnt - 1) < 1e-12 ? '' : qt(kEnt)) + (ent || '1'),
      linear: lin, quads: quads, k: kNum, kInt: kEnt, divisor: divisor,
      leftover: f.leftover && f.leftover.map ? f.leftover.map(ratToNum) : null
    };
  }

  /* ---------- Applet · Producto nulo y factorizacion ---------- */
  EQ.productonulo = function (root) {
    var out = shell(root, 'Applet \u00b7 Producto nulo y factorizaci\u00f3n', [
      'Escribe una ecuaci\u00f3n polin\u00f3mica de cualquier grado. El applet la lleva a la forma $P(x)=0$, la factoriza con aritm\u00e9tica exacta y va igualando cada factor a cero.',
      'Ejemplos: <code>2x^3-3x^2-11x+6=0</code>, <code>2x^4+4x^3-18x^2-36x=0</code>, <code>x^3-3x^2+2x=0</code>, <code>x^4-2x^3-13x^2+38x-24=0</code>, <code>-x(x-1)(x^2-2)=0</code>.',
      'Compara las dos escrituras. En <code>2x^3-3x^2-11x+6=0</code> una ra\u00edz es $\\tfrac{1}{2}$: la primera usa el factor $\\left(x-\\tfrac{1}{2}\\right)$ y la segunda $\\left(2x-1\\right)$. Multiplica y comprueba que dan el mismo polinomio.',
      'Comprueba el l\u00edmite del producto nulo con <code>(x-2)(x+1)=6</code>: igualar cada factor a $6$ no sirve, hay que desarrollar primero.',
      'Un factor cuadr\u00e1tico con discriminante negativo no aporta ninguna soluci\u00f3n real, aunque siga formando parte de la factorizaci\u00f3n.'
    ], rowText('eq', 'Ecuaci\u00f3n', '2x^3-3x^2-11x+6=0'));

    live(root, out, function () {
      var src = val(root, 'eq');
      var parts = String(src).split('=');
      if (parts.length !== 2) throw new Error('escribe una sola igualdad, con un \u00fanico signo <code>=</code>.');

      var exact = null;
      if (P && P.parse && P.sub && P.factorize) {
        try { exact = P.factorize(P.sub(P.parse(parts[0]), P.parse(parts[1]))); }
        catch (e) { exact = null; }
      }

      var pnum = psub(coeffs(parts[0]), coeffs(parts[1]));
      var d = pdeg(pnum);
      var h = step('Forma ' + T('P(x)=0') + ': ' + T(pt(pnum) + '=0') + ' (grado ' + d + ')');

      if (d < 1) {
        return h + step(Math.abs(pnum[0]) < 1e-12
          ? ok('Identidad: todo n\u00famero real es soluci\u00f3n.')
          : bad('Contradicci\u00f3n: no hay soluci\u00f3n.'));
      }

      if (!exact || exact.zero) {
        var rs0 = realRoots(pnum).roots;
        h += warnStep('Factorizaci\u00f3n aproximada: el motor exacto no est\u00e1 disponible en esta p\u00e1gina.');
        h += step(key('Ra\u00edces reales: ') +
          (rs0.length ? rs0.map(function (v) { return chip(T(nt(v))); }).join('') : chip('ninguna', true)));
        h += svgCurve(pnum, rs0, -8, 8);
        return h;
      }

      var V = factorViews(exact);
      h += step(key('Factores m\u00f3nicos: ') + T(pt(pnum) + '=' + V.monic));
      if (V.divisor !== 1) {
        h += step(key('Coeficientes enteros: ') + T(pt(pnum) + '=' + V.integer));
        h += step('Las dos escrituras son equivalentes. Al convertir cada ' +
          T('\\left(x-\\tfrac{p}{d}\\right)') + ' en ' + T('\\left(dx-p\\right)') +
          ' el producto se multiplica por ' + T(String(V.divisor)) + ', y por eso el coeficiente de delante pasa de ' +
          T(qt(V.k)) + ' a ' + T(qt(V.kInt)) + '.');
      }

      h += step('Igualamos cada factor a cero, uno a uno:');
      var sols = [];

      if (exact.xmult > 0) {
        sols.push(0);
        h += step(T((exact.xmult > 1 ? 'x^{' + exact.xmult + '}' : 'x') + '=0') + ' ' + T('\\Rightarrow') + ' ' +
          T('x=0') + (exact.xmult > 1 ? ' (multiplicidad ' + exact.xmult + ')' : ''));
      }
      V.linear.forEach(function (L) {
        sols.push(L.r);
        h += step(T(facMonicT(L.r, L.m) + '=0') + ' ' + T('\\Rightarrow') + ' ' + T('x=' + qt(L.r)) +
          (L.m > 1 ? ' (multiplicidad ' + L.m + ')' : ''));
      });
      V.quads.forEach(function (Q) {
        if (Q.disc < 0) {
          h += step(T('\\left(' + pt(Q.num) + '\\right)=0') + ': ' + T('\\Delta=' + nt(Q.disc) + '<0') +
            ' ' + T('\\Rightarrow') + ' ' + bad('no aporta soluciones reales'));
        } else {
          var qr = quad(Q.num[2] || 0, Q.num[1] || 0, Q.num[0] || 0);
          qr.roots.forEach(function (v) { sols.push(snap(v)); });
          h += step(T('\\left(' + pt(Q.num) + '\\right)=0') + ': ' + T('\\Delta=' + nt(Q.disc)) +
            ' ' + T('\\Rightarrow') + ' ' + qr.roots.map(function (v) { return chip(T(nt(v))); }).join('') +
            ' ' + note('(pueden ser irracionales y se dan aproximadas)'));
        }
      });
      if (V.leftover && V.leftover.length > 1) {
        h += warnStep('Queda un factor que el motor no ha descompuesto: ' + T(pt(V.leftover)) +
          '. Sus soluciones, si las tiene, se buscan aparte.');
      }

      var uniq = [];
      sols.map(nz).sort(function (a, b) { return a - b; }).forEach(function (v) {
        if (!uniq.length || Math.abs(uniq[uniq.length - 1] - v) > 1e-7) uniq.push(v);
      });

      h += step(key('Conjunto soluci\u00f3n: ') +
        (uniq.length ? uniq.map(function (v) { return chip(T(qt(v))); }).join('') : chip(T('\\varnothing'), true)));
      if (uniq.length) {
        h += step('Control num\u00e9rico: ' + T('P\\left(' + nt(uniq[0]) + '\\right)=' + nt(pev(pnum, uniq[0]))) +
          '. Debe salir cero, o un valor min\u00fasculo por el redondeo.');
      }
      h += step('El teorema fundamental del \u00e1lgebra garantiza ' + d +
        ' ra\u00edces contando multiplicidades y las complejas. Aqu\u00ed hay ' + uniq.length +
        ' real' + (uniq.length === 1 ? '' : 'es') + ' distinta' + (uniq.length === 1 ? '' : 's') + '.');
      h += svgCurve(pnum, uniq, -8, 8);
      return h;
    });
  };

  /* ---------- Applet · Ecuaciones racionales ---------- */
  EQ.racional = function (root) {
    var out = shell(root, 'Applet \u00b7 Ecuaciones racionales', [
      'Estudiamos $\\dfrac{A}{x-p}+\\dfrac{B}{x-q}=C$. Lo primero no es operar: es anotar los valores prohibidos $x\\neq p$ y $x\\neq q$.',
      'Ejemplos: $A=2$, $p=1$, $B=1$, $q=-1$, $C=1$; tambi\u00e9n $p=q=2$ para ver qu\u00e9 ocurre entonces.',
      'Ajusta los valores hasta que una soluci\u00f3n caiga en un valor prohibido: aparecer\u00e1 en rojo y habr\u00e1 que rechazarla.',
      'Con $C=0$ la ecuaci\u00f3n baja de grado: observa c\u00f3mo cambia el n\u00famero de candidatos.'
    ], '<div class="ap-row">' + mini('A', 'A', 2) + mini('p', 'p', 1) + mini('B', 'B', 1) +
       mini('q', 'q', -1) + mini('C', 'C', 1) + '</div>');

    live(root, out, function () {
      var A = nv(root, 'A'), p = nv(root, 'p'), B = nv(root, 'B'), q2 = nv(root, 'q'), C = nv(root, 'C');
      var poly = psub(padd(pmul([A], [-q2, 1]), pmul([B], [-p, 1])), pmul([C], pmul([-p, 1], [-q2, 1])));
      var h = step(T('\\dfrac{' + nt(A) + '}{x-' + par(p) + '}+\\dfrac{' + nt(B) + '}{x-' + par(q2) + '}=' + nt(C)));
      h += step(key('Dominio: ') + T('x\\neq ' + nt(p)) +
        (Math.abs(p - q2) > 1e-12 ? ' y ' + T('x\\neq ' + nt(q2)) : ' ' + note('(aqu\u00ed $p=q$, un solo valor prohibido)')));
      h += step('Multiplicamos por ' + T('(x-p)(x-q)') + ': ' + T(pt(poly) + '=0'));
      var rs = realRoots(poly).roots, badR = [], goodR = [];
      rs.forEach(function (r) {
        if (Math.abs(r - p) < 1e-8 || Math.abs(r - q2) < 1e-8) badR.push(r); else goodR.push(r);
      });
      h += step('Candidatos: ' + (rs.length ? rs.map(function (v) {
        return chip(T(nt(v)), badR.indexOf(v) >= 0);
      }).join('') : chip('ninguno', true)));
      if (badR.length) {
        h += step(bad('Rechazados') + ' por anular un denominador: ' +
          badR.map(function (v) { return T(nt(v)); }).join(', ') +
          '. Aparecieron al multiplicar, no eran soluciones.');
      }
      h += step(key('Soluciones v\u00e1lidas: ') +
        (goodR.length ? goodR.map(function (v) { return chip(T(nt(v))); }).join('') : chip(T('\\varnothing'), true)));
      return h;
    });
  };

  /* ---------- Applet · Ecuaciones irracionales ---------- */
  EQ.irracional = function (root) {
    var out = shell(root, 'Applet \u00b7 Ecuaciones irracionales', [
      'Estudiamos $\\sqrt{ax+b}=cx+d$. Al elevar al cuadrado pueden aparecer soluciones extra\u00f1as: el applet separa candidatos de soluciones.',
      'Ejemplos: $a=-1$, $b=2$, $c=1$, $d=0$ para $\\sqrt{2-x}=x$; tambi\u00e9n $a=1$, $b=6$, $c=1$, $d=0$; y $a=3$, $b=19$, $c=1$, $d=3$.',
      'Dos condiciones antes de aceptar un candidato: el radicando $ax+b\\geq 0$ y el miembro derecho $cx+d\\geq 0$.',
      'Busca un caso con dos candidatos y una sola soluci\u00f3n v\u00e1lida: es el error cl\u00e1sico del tema.'
    ], '<div class="ap-row">' + mini('a', 'a', -1) + mini('b', 'b', 2) + mini('c', 'c', 1) + mini('d', 'd', 0) + '</div>');

    live(root, out, function () {
      var a = nv(root, 'a'), b = nv(root, 'b'), c = nv(root, 'c'), d = nv(root, 'd');
      var poly = psub(pmul([d, c], [d, c]), [b, a]);
      var h = step(T('\\sqrt{' + pt([b, a]) + '}=' + pt([d, c])));
      h += step('Condiciones previas: ' + T(pt([b, a]) + '\\geq 0') + ' y ' + T(pt([d, c]) + '\\geq 0'));
      h += step('Elevando al cuadrado: ' + T(pt(poly) + '=0'));
      var rs = realRoots(poly).roots, good = [], badc = [];
      rs.forEach(function (x) {
        var rad = a * x + b, rhs = c * x + d;
        var fine = rad >= -1e-9 && rhs >= -1e-9 && Math.abs(Math.sqrt(Math.max(0, rad)) - rhs) < 1e-6;
        (fine ? good : badc).push({ x: x, rad: rad, rhs: rhs, fine: fine });
      });
      h += step('Candidatos y comprobaci\u00f3n en la ecuaci\u00f3n original:');
      if (!rs.length) h += step('No hay candidatos reales.');
      good.concat(badc).forEach(function (o) {
        h += step(T('x=' + nt(o.x)) + ': radicando ' + T(nt(o.rad)) + ', miembro derecho ' + T(nt(o.rhs)) +
          ' ' + T('\\Rightarrow') + ' ' + (o.fine ? ok('v\u00e1lida') : bad('soluci\u00f3n extra\u00f1a')));
      });
      h += step(key('Soluciones: ') +
        (good.length ? good.map(function (o) { return chip(T(qt(o.x))); }).join('') : chip(T('\\varnothing'), true)));
      return h;
    });
  };

  /* ---------- Applet · Ecuaciones exponenciales ---------- */
  EQ.exponencial = function (root) {
    var out = shell(root, 'Applet \u00b7 Ecuaciones exponenciales', [
      'Dos modos. Directo: $a^{mx+n}=k$. Cambio de variable: $A\\,a^{2x}+B\\,a^{x}+C=0$ con $t=a^{x}>0$.',
      'Ejemplos directos: $a=2$, $m=1$, $n=1$, $k=8$; tambi\u00e9n $a=4$, $m=1$, $n=1$, $k=1024$; y $a=0{,}5$, $m=1$, $n=0$, $k=8$.',
      'Ejemplos con cambio: $a=2$, $A=1$, $B=-5$, $C=4$ da $x=0$ y $x=2$; tambi\u00e9n $a=3$, $A=1$, $B=-10$, $C=9$.',
      'Pon $k$ negativo o cero y lee el aviso: una potencia de base positiva nunca vale cero ni un n\u00famero negativo.'
    ],
      '<div class="ap-row"><label class="ap-lab">Modo</label>' +
      '<select class="ap-sel" data-role="modo"><option value="dir">Directo</option>' +
      '<option value="cv">Cambio de variable</option></select>' + mini('a', 'base a', 2, 0.1) + '</div>' +
      '<div class="ap-row">' + mini('m', 'm', 1) + mini('n', 'n', 1) + mini('k', 'k', 8) + '</div>' +
      '<div class="ap-row">' + mini('A', 'A', 1) + mini('B', 'B', -5) + mini('C', 'C', 4) + '</div>');

    live(root, out, function () {
      var modo = val(root, 'modo'), a = nv(root, 'a');
      if (!(a > 0) || Math.abs(a - 1) < 1e-9) throw new Error('la base debe cumplir $a>0$ y $a\\neq 1$.');
      var h = '';
      if (modo === 'dir') {
        var m = nv(root, 'm'), nn = nv(root, 'n'), k = nv(root, 'k');
        h += step(T(nt(a) + '^{' + pt([nn, m]) + '}=' + nt(k)));
        if (!(k > 0)) {
          return h + step(bad('No hay soluci\u00f3n real: ') + T('a^{u}>0') +
            ' siempre, luego nunca puede valer ' + T(nt(k)) + '.');
        }
        if (Math.abs(m) < 1e-12) {
          return h + step(Math.abs(Math.pow(a, nn) - k) < 1e-9
            ? ok('Identidad: ') + 'la inc\u00f3gnita ha desaparecido y la igualdad es cierta.'
            : bad('Contradicci\u00f3n: ') + 'no hay soluci\u00f3n.');
        }
        var u = Math.log(k) / Math.log(a), x = (u - nn) / m;
        h += step('Tomamos logaritmos en base ' + T('a') + ': ' +
          T(pt([nn, m]) + '=\\log_{' + nt(a) + '}' + nt(k) + '=' + nt(u)));
        h += step(key('Soluci\u00f3n: ') + T('x=' + qt(snap(x))));
        h += step('Comprobaci\u00f3n: ' + T(nt(a) + '^{' + nt(m * x + nn) + '}=' + nt(Math.pow(a, m * x + nn))));
      } else {
        var A = nv(root, 'A'), B = nv(root, 'B'), C = nv(root, 'C');
        h += step(T(nt(A) + '\\cdot ' + nt(a) + '^{2x}' + (B >= 0 ? '+' : '') + nt(B) + '\\cdot ' +
          nt(a) + '^{x}' + (C >= 0 ? '+' : '') + nt(C) + '=0'));
        h += step('Cambio ' + T('t=' + nt(a) + '^{x}') + ', con la condici\u00f3n esencial ' + T('t>0') +
          ': ' + T(pt([C, B, A]) + '=0'));
        var r = quad(A, B, C);
        h += step('Valores de ' + T('t') + ': ' + (r.roots.length
          ? r.roots.map(function (t) { return chip(T(nt(t)), t <= 0); }).join('') : chip('ninguno real', true)));
        var xs = [];
        r.roots.forEach(function (t) {
          if (t > 1e-12) {
            var x2 = Math.log(t) / Math.log(a);
            xs.push(snap(x2));
            h += step(T(nt(a) + '^{x}=' + nt(t)) + ' ' + T('\\Rightarrow') + ' ' +
              T('x=\\log_{' + nt(a) + '}' + nt(t) + '=' + nt(snap(x2))));
          } else {
            h += step(bad(T('t=' + nt(t) + '\\leq 0')) + ': descartado, una exponencial nunca es negativa ni nula.');
          }
        });
        h += step(key('Soluciones: ') +
          (xs.length ? xs.map(function (v) { return chip(T(qt(v))); }).join('') : chip(T('\\varnothing'), true)));
      }
      return h;
    });
  };

  /* ---------- Applet · Ecuaciones logaritmicas ---------- */
  EQ.logaritmica = function (root) {
    var out = shell(root, 'Applet \u00b7 Ecuaciones logar\u00edtmicas', [
      'Dos modos. Definici\u00f3n: $\\log_{a}(px+q)=r$. Igualdad: $\\log_{a}(px+q)=\\log_{a}(sx+t)$.',
      'Ejemplos: $a=2$, $p=1$, $q=-1$, $r=3$ para $\\log_{2}(x-1)=3$; tambi\u00e9n $a=10$, $p=100$, $q=-100$ frente a $s=1$, $t=98$.',
      'El dominio no es un tr\u00e1mite final: el argumento debe ser estrictamente positivo, y esa condici\u00f3n forma parte de la ecuaci\u00f3n.',
      'Fuerza un caso sin soluci\u00f3n haciendo que el valor obtenido deje el argumento negativo.'
    ],
      '<div class="ap-row"><label class="ap-lab">Modo</label>' +
      '<select class="ap-sel" data-role="modo"><option value="def">Definici\u00f3n</option>' +
      '<option value="ig">Igualdad de logaritmos</option></select>' + mini('a', 'base a', 2, 0.1) + '</div>' +
      '<div class="ap-row">' + mini('p', 'p', 1) + mini('q', 'q', -1) + mini('r', 'r', 3) + '</div>' +
      '<div class="ap-row">' + mini('s', 's', 1) + mini('t', 't', 98) + '</div>');

    live(root, out, function () {
      var modo = val(root, 'modo'), a = nv(root, 'a');
      if (!(a > 0) || Math.abs(a - 1) < 1e-9) throw new Error('la base debe cumplir $a>0$ y $a\\neq 1$.');
      var p = nv(root, 'p'), q2 = nv(root, 'q'), h = '';
      var L = '\\log_{' + nt(a) + '}';

      if (modo === 'def') {
        var r = nv(root, 'r');
        h += step(T(L + '\\left(' + pt([q2, p]) + '\\right)=' + nt(r)));
        h += step('Condici\u00f3n de dominio: ' + T(pt([q2, p]) + '>0'));
        var target = Math.pow(a, r);
        h += step('Forma exponencial: ' + T(pt([q2, p]) + '=' + nt(a) + '^{' + nt(r) + '}=' + nt(target)));
        if (Math.abs(p) < 1e-12) {
          return h + step(Math.abs(q2 - target) < 1e-9
            ? ok('Identidad') + ': la inc\u00f3gnita ha desaparecido y la igualdad es cierta.'
            : bad('Contradicci\u00f3n') + ': no hay soluci\u00f3n.');
        }
        var x = (target - q2) / p, arg = p * x + q2;
        h += step('Candidato: ' + T('x=' + qt(snap(x))) + ', con argumento ' + T(nt(arg)));
        h += step(arg > 1e-12
          ? key('Soluci\u00f3n: ') + T('x=' + qt(snap(x))) + ' ' + ok('(argumento positivo)')
          : bad('Rechazado') + ': el argumento no es positivo, luego el logaritmo no existe. Soluci\u00f3n ' + T('\\varnothing') + '.');
      } else {
        var s = nv(root, 's'), t = nv(root, 't');
        h += step(T(L + '\\left(' + pt([q2, p]) + '\\right)=' + L + '\\left(' + pt([t, s]) + '\\right)'));
        h += step('Dominio: ' + T(pt([q2, p]) + '>0') + ' y ' + T(pt([t, s]) + '>0'));
        h += step('La funci\u00f3n logar\u00edtmica es inyectiva, luego igualamos argumentos: ' +
          T(pt([q2, p]) + '=' + pt([t, s])));
        var lin = psub([q2, p], [t, s]);
        if (pdeg(lin) < 1) {
          return h + step(Math.abs(lin[0]) < 1e-12
            ? ok('Los argumentos coinciden') + ': cualquier $x$ del dominio es soluci\u00f3n.'
            : bad('Contradicci\u00f3n') + ': no hay soluci\u00f3n.');
        }
        var x2 = snap(-lin[0] / lin[1]), a1 = p * x2 + q2, a2 = s * x2 + t;
        h += step('Candidato ' + T('x=' + qt(x2)) + ': argumentos ' + T(nt(a1)) + ' y ' + T(nt(a2)));
        h += step(a1 > 1e-12 && a2 > 1e-12
          ? key('Soluci\u00f3n: ') + T('x=' + qt(x2))
          : bad('Rechazado') + ': alg\u00fan argumento no es positivo. Soluci\u00f3n ' + T('\\varnothing') + '.');
      }
      return h;
    });
  };

  /* ---------- Applet · Inecuacion de primer grado ---------- */
  EQ.inecuacion1 = function (root) {
    var out = shell(root, 'Applet \u00b7 Inecuaci\u00f3n de primer grado', [
      'Escribe la inecuaci\u00f3n completa con <code>&lt;</code>, <code>&lt;=</code>, <code>&gt;</code> o <code>&gt;=</code>.',
      'Ejemplos: <code>-3x&lt;=9</code>, <code>5-3(2x-1)&gt;-4x-8</code>, <code>4x-1-3(x-1)&gt;=3(2x+4)</code>, <code>(1/2)x-4&gt;=3x+1</code>.',
      'Fija la atenci\u00f3n en el aviso naranja: aparece justo cuando dividimos por un n\u00famero negativo y la desigualdad cambia de sentido.',
      'El extremo se dibuja relleno con $\\leq$ y $\\geq$, y hueco con $<$ y $>$.'
    ], rowText('ine', 'Inecuaci\u00f3n', '-3x<=9'));

    live(root, out, function () {
      var o = splitIneq(val(root, 'ine')), p = o.poly, op = o.op;
      if (pdeg(p) > 1) throw new Error('esa inecuaci\u00f3n es de grado ' + pdeg(p) + '. Usa el applet de inecuaci\u00f3n cuadr\u00e1tica.');
      var a = p[1] || 0, b = p[0] || 0;
      var h = step('Forma reducida: ' + T(pt(p) + opT(op) + '0'));
      if (Math.abs(a) < 1e-12) {
        return h + step(opHolds(b, op)
          ? ok('Se cumple siempre: ') + 'soluci\u00f3n ' + T('\\mathbb{R}') + '.'
          : bad('Nunca se cumple: ') + 'soluci\u00f3n ' + T('\\varnothing') + '.');
      }
      var fin = a < 0 ? FLIP[op] : op, x0 = snap(-b / a);
      h += step('Despejamos: ' + T(qt(a) + 'x' + opT(op) + qt(-b)));
      if (a < 0) {
        h += warnStep(key('Atenci\u00f3n: ') + 'dividimos entre ' + T(nt(a)) +
          ', que es negativo, as\u00ed que la desigualdad <b>cambia de sentido</b>.');
      }
      h += step(key('Soluci\u00f3n: ') + T('x' + opT(fin) + qt(x0)));
      var lower = (fin === '>' || fin === '>=');
      var pieces = [{ a: -Infinity, b: x0, okk: !lower }, { a: x0, b: Infinity, okk: lower }];
      h += step('En intervalos: ' + T(lower
        ? ivT(x0, Infinity, opClosed(fin), false)
        : ivT(-Infinity, x0, false, opClosed(fin))));
      h += svgLine(pieces, [x0], opClosed(fin));
      return h;
    });
  };

  /* ---------- Applet · Inecuacion cuadratica ---------- */
  EQ.inecuacion2 = function (root) {
    var out = shell(root, 'Applet \u00b7 Inecuaci\u00f3n cuadr\u00e1tica', [
      'Escribe la inecuaci\u00f3n completa. El applet la reduce, resuelve la ecuaci\u00f3n asociada, construye la tabla de signos y pinta el conjunto soluci\u00f3n.',
      'Ejemplos: <code>2x^2-7x+40&gt;=x^2+5x+5</code>, <code>x^2-3x+2&lt;=0</code>, <code>-x^2+x+2&gt;0</code>, <code>x^2+2x+3&lt;0</code>, <code>4x^2-4x+1&lt;0</code>.',
      'Tambi\u00e9n acepta grados superiores factorizados: prueba <code>x(x+5)(x+3)(x-2)(x-6)&gt;=0</code>.',
      'Interpreta el resultado gr\u00e1ficamente: $P(x)>0$ pregunta d\u00f3nde la curva queda por encima del eje horizontal.'
    ], rowText('ine', 'Inecuaci\u00f3n', '2x^2-7x+40>=x^2+5x+5'));

    live(root, out, function () {
      var o = splitIneq(val(root, 'ine')), p = o.poly, op = o.op;
      var h = step('Forma reducida: ' + T(pt(p) + opT(op) + '0') + ' (grado ' + pdeg(p) + ')');
      if (pdeg(p) === 2) {
        var D = (p[1] || 0) * (p[1] || 0) - 4 * p[2] * (p[0] || 0);
        h += step('Ecuaci\u00f3n asociada: ' + T(pt(p) + '=0') + ', con ' + T('\\Delta=' + nt(D)));
      }
      var sol = solveIneq(p, op);
      if (sol.roots.length) {
        h += step('Ra\u00edces que separan la recta real: ' +
          sol.roots.map(function (v) { return chip(T(qt(v))); }).join(''));
        var rows = sol.pieces.map(function (s) {
          return '<tr class="' + (s.okk ? 'ap-sel-row' : '') + '"><td>' + T(ivT(s.a, s.b, false, false)) +
            '</td><td>' + T(nt(s.probe)) + '</td><td>' + T(nt(s.val)) + '</td><td>' +
            (s.val > 0 ? '+' : s.val < 0 ? '\u2212' : '0') + '</td><td>' +
            (s.okk ? ok('s\u00ed') : 'no') + '</td></tr>';
        }).join('');
        h += '<table class="ap-tbl"><tr><th>Intervalo</th><th>Punto de prueba</th>' +
          '<th>Valor</th><th>Signo</th><th>\u00bfCumple?</th></tr>' + rows + '</table>';
      } else {
        h += step('La ecuaci\u00f3n asociada no tiene ra\u00edces reales: hay un \u00fanico intervalo, toda la recta real, y el signo es constante.');
      }
      h += step(key('Conjunto soluci\u00f3n: ') + T(sol.tex));
      if (sol.roots.length) {
        h += step(opClosed(op)
          ? 'La desigualdad admite la igualdad, luego las ra\u00edces <b>s\u00ed</b> pertenecen a la soluci\u00f3n.'
          : 'La desigualdad es estricta, luego las ra\u00edces <b>no</b> pertenecen a la soluci\u00f3n.');
      }
      h += svgLine(sol.pieces, sol.roots, opClosed(op));
      h += svgCurve(p, sol.roots, -12, 12);
      return h;
    });
  };

  /* ---------- Applet · Recta real e intervalos ---------- */
  EQ.intervalos = function (root) {
    var out = shell(root, 'Applet \u00b7 Recta real e intervalos', [
      'Traduce entre las tres escrituras de un conjunto: desigualdad, intervalo y dibujo en la recta real.',
      'Elige los extremos y si cada uno es abierto o cerrado. Prueba $-2$ cerrado y $3$ abierto: obtienes $\\left[-2,3\\right)$.',
      'Pon el extremo izquierdo mayor que el derecho y lee el aviso: el conjunto queda vac\u00edo.',
      'Marca los dos extremos como infinitos para representar $\\mathbb{R}$.'
    ],
      '<div class="ap-row">' + mini('l', 'extremo izq.', -2) +
      '<label class="ap-lab">Tipo</label><select class="ap-sel" data-role="lc">' +
      '<option value="1">cerrado</option><option value="0">abierto</option>' +
      '<option value="i">menos infinito</option></select></div>' +
      '<div class="ap-row">' + mini('r', 'extremo der.', 3) +
      '<label class="ap-lab">Tipo</label><select class="ap-sel" data-role="rc">' +
      '<option value="0">abierto</option><option value="1">cerrado</option>' +
      '<option value="i">m\u00e1s infinito</option></select></div>');

    live(root, out, function () {
      var lcv = val(root, 'lc'), rcv = val(root, 'rc');
      var l = lcv === 'i' ? -Infinity : nv(root, 'l');
      var r = rcv === 'i' ? Infinity : nv(root, 'r');
      var lc = lcv === '1', rc = rcv === '1';
      if (l !== -Infinity && r !== Infinity && l > r) {
        throw new Error('el extremo izquierdo es mayor que el derecho: el conjunto ser\u00eda vac\u00edo.');
      }
      var h = step(key('Intervalo: ') + T(ivT(l, r, lc, rc)));
      var des;
      if (l === -Infinity && r === Infinity) des = 'x\\in\\mathbb{R}';
      else if (l === -Infinity) des = 'x' + (rc ? '\\leq' : '<') + qt(r);
      else if (r === Infinity) des = 'x' + (lc ? '\\geq' : '>') + qt(l);
      else des = qt(l) + (lc ? '\\leq' : '<') + 'x' + (rc ? '\\leq' : '<') + qt(r);
      h += step(key('Desigualdad: ') + T(des));
      h += step('Extremo izquierdo ' + (l === -Infinity ? 'infinito' : (lc ? 'incluido' : 'excluido')) +
        ', extremo derecho ' + (r === Infinity ? 'infinito' : (rc ? 'incluido' : 'excluido')) + '.');
      var marks = [];
      if (l !== -Infinity) marks.push(l);
      if (r !== Infinity) marks.push(r);
      h += svgLine([{ a: l, b: r, okk: true }], marks, lc && rc);
      return h;
    });
  };

  /* ---------- Applet · Diagnostico del motor ---------- */
  EQ.diagnostico = function (root) {
    var out = shell(root, 'Applet \u00b7 Diagn\u00f3stico del motor', [
      'Applet de servicio, no de aula: comprueba que <code>window.POLY</code> y KaTeX se han cargado.',
      'La notaci\u00f3n se escribe en LaTeX y la compone KaTeX de forma s\u00edncrona, as\u00ed que debe verse siempre.'
    ], rowText('eq', 'Prueba', '2x^2-5x-3'));

    live(root, out, function () {
      var h = step('window.POLY: ' + (P ? ok('detectado') : bad('no encontrado') + ' (parser de respaldo)'));
      h += step('KaTeX: ' + (window.katex ? ok('cargado') : bad('no cargado')) +
        ' \u00b7 autorenderizado: ' + (window.renderMathInElement ? ok('disponible') : bad('no disponible')));
      if (P) h += step('Miembros de POLY: ' + Object.keys(P).sort().join(', '));
      var c = coeffs(val(root, 'eq'));
      h += step('Coeficientes ascendentes: [' + c.map(nt).join(', ') + ']');
      h += step('Reconstrucci\u00f3n: ' + T(pt(c)));
      h += step('Valor en ' + T('x=2') + ': ' + T(nt(pev(c, 2))));
      h += step('Prueba de notaci\u00f3n: ' + T('x=\\dfrac{-b\\pm\\sqrt{b^{2}-4ac}}{2a}') + ', ' +
        T('\\left(-\\infty,5\\right]\\cup\\left[7,+\\infty\\right)') + ', ' +
        T('\\log_{2}\\left(x-1\\right)=3') + ', ' + T('\\tfrac{1}{2}\\leq x<\\sqrt{3}'));
      h += step(TD('P(x)=2\\left(x-3\\right)\\left(x+2\\right)\\left(x-\\tfrac{1}{2}\\right)'));
      return h;
    });
  };

  /* =================================================================
     9. ARRANQUE
     ================================================================= */

  function boot() {
    var nodes = document.querySelectorAll('[data-applet-eq]');
    Array.prototype.forEach.call(nodes, function (node) {
      var k = node.getAttribute('data-applet-eq');
      if (typeof EQ[k] === 'function') {
        try { EQ[k](node); }
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
    setTimeout(boot, 0);
  }

  window.EQAPP = {
    coeffs: coeffs, tex: pt, roots: realRoots, quad: quad, ineq: solveIneq,
    eval: pev, katex: kt, applets: EQ, engine: P
  };
})();
