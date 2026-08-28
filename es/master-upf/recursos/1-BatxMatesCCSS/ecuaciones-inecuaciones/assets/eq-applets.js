/* =====================================================================
   eq-applets.js — ECUACIONES E INECUACIONES · 1r Batx Mates CCSS
   VERSION 2 — sin dependencia de MathJax en la salida de los applets.

   Reutiliza el motor algebraico exacto del tema de polinomios a traves
   de su API publica window.POLY (parse, tex, add, sub, mul, divmod,
   eval, factorize, factorTex, gcd, lcm, simplifyFraction, R).
   Por eso _scripts.html DEBE cargar primero poly-applets.js.

   CAMBIO CLAVE RESPECTO A LA VERSION 1
   Los applets ya NO escriben \( ... \) en su salida. Toda la notacion
   matematica se genera en HTML con Unicode y con <sup>, porque la
   salida se reescribe en cada pulsacion de tecla y no se puede
   depender de que MathJax vuelva a pasar por ella. En la prosa de los
   .qmd se sigue usando LaTeX normal, que MathJax compone sin problema.

   Los applets se marcan en el .qmd con  data-applet-eq="clave"
   (atributo propio, para no pisar nunca el data-applet de polinomios).

   Claves disponibles:
     cuadratica · sumaproducto · bicuadrada · productonulo · racional
     irracional · exponencial · logaritmica · inecuacion1 · inecuacion2
     intervalos · diagnostico
   ===================================================================== */

(function () {
  'use strict';

  var EQ = {};
  var P = (typeof window !== 'undefined' && window.POLY) ? window.POLY : null;

  /* Simbolos Unicode usados en toda la notacion. */
  var MINUS = '\u2212';   /* menos matematico */
  var LE = '\u2264';
  var GE = '\u2265';
  var NE = '\u2260';
  var PM = '\u00b1';
  var INF = '\u221e';
  var EMPTY = '\u2205';
  var REALS = '\u211d';
  var DELTA = '\u0394';
  var CDOT = '\u00b7';
  var ARROW = '\u2192';
  var CUP = '\u222a';
  var SQRT = '\u221a';

  /* =================================================================
     0. UTILIDADES DE PRESENTACION
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
  function chip(t, isBad) {
    return '<span class="ap-chip' + (isBad ? ' ap-chip-bad' : '') + '">' + t + '</span>';
  }
  function mth(html) { return '<span class="ap-m">' + html + '</span>'; }

  function sup(s) { return '<sup>' + s + '</sup>'; }
  function sub(s) { return '<sub>' + s + '</sub>'; }

  function fracH(a, b) {
    return '<span class="ap-frac"><span class="ap-num">' + a +
           '</span><span class="ap-den">' + b + '</span></span>';
  }

  function radH(inner) {
    return '<span class="ap-rad">' + SQRT + '<span class="ap-radc">' + inner + '</span></span>';
  }

  function nz(x) { return Math.abs(x) < 1e-11 ? 0 : x; }

  /* Numero con signo menos matematico y coma decimal. */
  function n(x) {
    if (!isFinite(x)) return 'no definido';
    var y = nz(x);
    var r = Math.round(y * 1e6) / 1e6;
    var s = Number.isInteger(r) ? String(r) : String(r).replace('.', ',');
    return s.replace('-', MINUS);
  }

  /* Numero exacto: fraccion si el denominador es pequeno. */
  function q(x) {
    var y = nz(x);
    if (Number.isInteger(y)) return String(y).replace('-', MINUS);
    for (var d = 2; d <= 24; d++) {
      var p = y * d;
      if (Math.abs(p - Math.round(p)) < 1e-9) {
        p = Math.round(p);
        return (p < 0 ? MINUS : '') + fracH(String(Math.abs(p)), String(d));
      }
    }
    return n(y);
  }

  function snap(x) {
    for (var d = 1; d <= 24; d++) {
      var p = x * d;
      if (Math.abs(p - Math.round(p)) < 1e-8) return Math.round(p) / d;
    }
    return x;
  }

  /* Un numero entre parentesis si es negativo, para leer bien productos. */
  function par(x) { return x < 0 ? '(' + n(x) + ')' : n(x); }

  /* =================================================================
     1. ADAPTADOR AL MOTOR window.POLY
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

  /* Parser de respaldo: polinomios en x con + - * / ^ y parentesis. */
  function miniParse(src) {
    var s = String(src).replace(/\s+/g, '').replace(/,/g, '.').replace(/\u2212/g, '-');
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
     2. ARITMETICA POLINOMICA NUMERICA
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

  /* Polinomio a HTML: 2x² − 5x − 3 */
  function ph(a) {
    var p = ptrim(a), out = '', any = false;
    for (var k = p.length - 1; k >= 0; k--) {
      var c = nz(p[k]);
      if (c === 0 && p.length > 1) continue;
      var sg = c < 0 ? (any ? ' ' + MINUS + ' ' : MINUS) : (any ? ' + ' : '');
      var abs = Math.abs(c);
      var body = (abs === 1 && k > 0) ? '' : q(abs);
      var vv = k === 0 ? '' : (k === 1 ? 'x' : 'x' + sup(k));
      out += sg + body + vv;
      any = true;
    }
    return mth(out || '0');
  }

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
     3. DESIGUALDADES
     ================================================================= */

  var OPS = ['<', '<=', '>', '>='];
  function opH(op) { return op === '<' ? '<' : op === '<=' ? LE : op === '>' ? '>' : GE; }
  function opHolds(v, op) {
    return op === '<' ? v < 0 : op === '<=' ? v <= 0 : op === '>' ? v > 0 : v >= 0;
  }
  function opClosed(op) { return op === '<=' || op === '>='; }
  var FLIP = { '<': '>', '<=': '>=', '>': '<', '>=': '<=' };

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

  function ivH(l, r, lc, rc) {
    var L = (l === -Infinity) ? MINUS + INF : q(l);
    var R = (r === Infinity) ? '+' + INF : q(r);
    return mth((lc ? '[' : '(') + L + ', ' + R + (rc ? ']' : ')'));
  }

  function solveIneq(p, op) {
    var rs = realRoots(p).roots;
    if (!rs.length) {
      return { html: mth(opHolds(pev(p, 0), op) ? REALS : EMPTY), roots: [], pieces: [] };
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
      parts.push(ivH(start, end, closed && start !== -Infinity, closed && end !== Infinity));
      k = j + 1;
    }
    if (!parts.length && closed) {
      var pts = rs.filter(function (r) { return Math.abs(pev(p, r)) < 1e-9; });
      if (pts.length) {
        return {
          html: mth('{ ' + pts.map(q).join(', ') + ' }'),
          roots: rs, pieces: pieces
        };
      }
    }
    return {
      html: parts.length ? parts.join(' ' + CUP + ' ') : mth(EMPTY),
      roots: rs, pieces: pieces
    };
  }

  /* =================================================================
     4. FIGURAS SVG
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

    return '<svg class="ap-fig" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="gr\u00e1fica">' +
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
    var bars = pieces.filter(function (s) { return s.okk || s.ok; }).map(function (s) {
      var a = (s.a === -Infinity) ? lo : s.a, b = (s.b === Infinity) ? hi : s.b;
      return '<line x1="' + sx(a).toFixed(1) + '" y1="' + y + '" x2="' + sx(b).toFixed(1) +
             '" y2="' + y + '" stroke="#2a76dd" stroke-width="9" opacity="0.85"/>';
    }).join('');
    var dots = roots.map(function (r) {
      return '<circle cx="' + sx(r).toFixed(1) + '" cy="' + y + '" r="6.5" fill="' +
        (closed ? '#2a76dd' : '#ffffff') + '" stroke="#1d4ed8" stroke-width="2.5"/>' +
        '<text x="' + sx(r).toFixed(1) + '" y="' + (y + 26) + '" font-size="13" text-anchor="middle" fill="#334155">' +
        n(r) + '</text>';
    }).join('');
    return '<svg class="ap-fig" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="recta real">' +
      '<line x1="' + pad + '" y1="' + y + '" x2="' + (W - pad) + '" y2="' + y + '" stroke="#94a3b8" stroke-width="2"/>' +
      '<polygon points="' + (W - pad) + ',' + y + ' ' + (W - pad - 10) + ',' + (y - 5) + ' ' + (W - pad - 10) + ',' + (y + 5) + '" fill="#94a3b8"/>' +
      bars + dots + '</svg>';
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
  function selOp(role, value) {
    var o = OPS.map(function (op) {
      return '<option value="' + op + '"' + (op === value ? ' selected' : '') + '>' + opH(op) + '</option>';
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
    return get(root, 'out');
  }

  /* =================================================================
     6. APPLETS
     ================================================================= */

  /* ---------- Applet · Ecuacion de segundo grado ---------- */
  EQ.cuadratica = function (root) {
    var out = shell(root, 'Applet \u00b7 Ecuaci\u00f3n de segundo grado', [
      'Escribe la ecuaci\u00f3n completa, con el signo <code>=</code>. El applet la reduce a la forma <code>ax^2+bx+c=0</code> antes de resolverla.',
      'Ejemplos: <code>2x^2-5x-3=0</code>, <code>x^2=4</code>, <code>(x-1)(x+3)=5</code>, <code>3x^2+2x=x^2-4x-3</code>.',
      'Cuidado con la sintaxis: <code>1/2x^2</code> se lee como 1 dividido entre 2x' + sup(2) + '. Escribe <code>(1/2)x^2</code>.',
      'Busca los tres casos del discriminante: dos ra\u00edces, una ra\u00edz doble y ninguna ra\u00edz real.'
    ], rowText('eq', 'Ecuaci\u00f3n', '2x^2-5x-3=0'));

    live(root, out, function () {
      var p = splitEq(val(root, 'eq'));
      if (pdeg(p) > 2) throw new Error('esa ecuaci\u00f3n es de grado ' + pdeg(p) + '. Usa el applet de producto nulo.');
      var a = p[2] || 0, b = p[1] || 0, c = p[0] || 0, r = quad(a, b, c);
      var h = step('Forma reducida: ' + ph(p) + mth(' = 0'));

      if (r.kind === 'all') return h + step(ok('Se reduce a 0 = 0: cualquier n\u00famero real es soluci\u00f3n.'));
      if (r.kind === 'none') return h + step(bad('Se reduce a una contradicci\u00f3n: no hay soluci\u00f3n.'));
      if (r.kind === 'linear') {
        return h + step('No es de segundo grado: el coeficiente de ' + mth('x' + sup(2)) + ' es cero.') +
          step(key('Soluci\u00f3n \u00fanica: ') + mth('x = ' + q(r.roots[0])));
      }

      h += step(mth(DELTA + ' = b' + sup(2) + ' ' + MINUS + ' 4ac = ' + par(b) + sup(2) +
        ' ' + MINUS + ' 4' + CDOT + par(a) + CDOT + par(c) + ' = ' + n(r.D)));

      if (r.kind === 'complex') {
        h += step(bad(DELTA + ' < 0') + ': no hay ra\u00edces reales. La par\u00e1bola no corta el eje horizontal.');
      } else if (r.kind === 'double') {
        h += step(mth(DELTA + ' = 0') + ': ra\u00edz doble ' +
          mth('x = ' + MINUS + fracH('b', '2a') + ' = ' + q(r.roots[0])) +
          '. La par\u00e1bola es tangente al eje.');
      } else {
        h += step(mth('x = ' + fracH(MINUS + 'b ' + PM + ' ' + radH(DELTA), '2a')) + ' da ' +
          chip(n(r.roots[0])) + chip(n(r.roots[1])));
        h += step('Factorizada: ' + mth(q(a) + '(x ' + MINUS + ' ' + par(r.roots[0]) + ')(x ' +
          MINUS + ' ' + par(r.roots[1]) + ') = 0'));
      }
      h += step('V\u00e9rtice en ' + mth('x = ' + MINUS + fracH('b', '2a') + ' = ' + q(-b / (2 * a))) +
        ', y con ' + mth('a = ' + n(a)) + ' la par\u00e1bola abre hacia ' + (a > 0 ? 'arriba' : 'abajo') + '.');
      h += svgCurve(p, r.roots, -10, 10);
      return h;
    });
  };

  /* ---------- Applet · Suma y producto de raices ---------- */
  EQ.sumaproducto = function (root) {
    var out = shell(root, 'Applet \u00b7 Suma y producto de ra\u00edces', [
      'Mueve los coeficientes y comprueba que la suma de las ra\u00edces vale ' + MINUS + 'b/a y su producto vale c/a, sin resolver la ecuaci\u00f3n.',
      'Al rev\u00e9s tambi\u00e9n funciona: si la suma es A y el producto es B, la ecuaci\u00f3n es x' + sup(2) + ' ' + MINUS + ' Ax + B = 0.',
      'Ejemplos: a = 1, b = ' + MINUS + '5, c = 6 (suma 5, producto 6); a = 2, b = ' + MINUS + '5, c = ' + MINUS + '3; a = 1, b = 0, c = ' + MINUS + '9.'
    ], '<div class="ap-row">' + mini('a', 'a', 1) + mini('b', 'b', -5) + mini('c', 'c', 6) + '</div>');

    live(root, out, function () {
      var a = nv(root, 'a'), b = nv(root, 'b'), c = nv(root, 'c');
      if (!isFinite(a) || Math.abs(a) < 1e-12) throw new Error('el coeficiente a no puede ser cero en una ecuaci\u00f3n de segundo grado.');
      var r = quad(a, b, c);
      var h = step('Ecuaci\u00f3n: ' + ph([c, b, a]) + mth(' = 0'));
      h += step('Sin resolver: suma ' + mth('= ' + MINUS + fracH('b', 'a') + ' = ' + q(-b / a)) +
        ' y producto ' + mth('= ' + fracH('c', 'a') + ' = ' + q(c / a)));
      if (r.roots.length) {
        var s = r.roots.length === 2 ? r.roots[0] + r.roots[1] : 2 * r.roots[0];
        var pr = r.roots.length === 2 ? r.roots[0] * r.roots[1] : r.roots[0] * r.roots[0];
        h += step('Resolviendo: ' + r.roots.map(function (v) { return chip(n(v)); }).join('') +
          ' con suma ' + n(s) + ' y producto ' + n(pr) + ' ' + ok('(coincide)'));
      } else {
        h += step(mth(DELTA + ' = ' + n(r.D) + ' < 0') +
          ': las ra\u00edces no son reales y, sin embargo, la suma y el producto siguen valiendo lo calculado. Es una idea potente.');
      }
      h += step('Reconstrucci\u00f3n m\u00f3nica: ' + mth('x' + sup(2) + ' ' + MINUS + ' (' + n(-b / a) +
        ')x + (' + n(c / a) + ') = 0'));
      return h;
    });
  };

  /* ---------- Applet · Ecuacion bicuadrada ---------- */
  EQ.bicuadrada = function (root) {
    var out = shell(root, 'Applet \u00b7 Ecuaci\u00f3n bicuadrada', [
      'Trabajamos con ax' + sup(4) + ' + bx' + sup(2) + ' + c = 0. El applet hace el cambio t = x' + sup(2) + ', resuelve en t y deshace el cambio.',
      'La clave est\u00e1 en el \u00faltimo paso: solo los valores t ' + GE + ' 0 devuelven ra\u00edces reales, porque x = ' + PM + radH('t') + '.',
      'Ejemplos: a = 1, b = ' + MINUS + '5, c = 4 da cuatro soluciones; a = 1, b = 5, c = 4 no da ninguna; a = 1, b = ' + MINUS + '4, c = 0 da tres.'
    ], '<div class="ap-row">' + mini('a', 'a', 1) + mini('b', 'b', -5) + mini('c', 'c', 4) + '</div>');

    live(root, out, function () {
      var a = nv(root, 'a'), b = nv(root, 'b'), c = nv(root, 'c');
      if (!isFinite(a) || Math.abs(a) < 1e-12) throw new Error('si a = 0 la ecuaci\u00f3n no es bicuadrada.');
      var r = quad(a, b, c);
      var h = step('Ecuaci\u00f3n: ' + ph([c, 0, b, 0, a]) + mth(' = 0'));
      h += step('Cambio ' + mth('t = x' + sup(2)) + ': ' + ph([c, b, a]) + mth(' = 0') + ' en la variable t');
      h += step(mth(DELTA + ' = ' + n(r.D)) + '. Valores de t: ' +
        (r.roots.length ? r.roots.map(function (t) { return chip(n(t), t < 0); }).join('') : bad('ninguno real')));
      var xs = [];
      r.roots.forEach(function (t) {
        if (t > 1e-10) {
          xs.push(-Math.sqrt(t), Math.sqrt(t));
          h += step(mth('t = ' + n(t) + ' > 0') + '  ' + ARROW + '  ' + mth('x = ' + PM + radH(n(t)) + ' = ' + PM + n(Math.sqrt(t))));
        } else if (Math.abs(t) <= 1e-10) {
          xs.push(0);
          h += step(mth('t = 0') + '  ' + ARROW + '  ' + mth('x = 0') + ' (soluci\u00f3n doble)');
        } else {
          h += step(bad('t = ' + n(t) + ' < 0') + ': descartado, ning\u00fan cuadrado real es negativo.');
        }
      });
      xs = xs.map(snap).sort(function (u, v) { return u - v; });
      h += step(key('Soluciones: ') +
        (xs.length ? xs.map(function (v) { return chip(n(v)); }).join('') : chip(EMPTY, true)));
      h += svgCurve([c, 0, b, 0, a], xs, -5, 5);
      return h;
    });
  };

  /* ---------- Applet · Producto nulo y factorizacion ---------- */
  EQ.productonulo = function (root) {
    var out = shell(root, 'Applet \u00b7 Producto nulo y factorizaci\u00f3n', [
      'Escribe una ecuaci\u00f3n polin\u00f3mica de cualquier grado. El applet la lleva a la forma P(x) = 0, busca las ra\u00edces y muestra la factorizaci\u00f3n.',
      'Ejemplos: <code>2x^4+4x^3-18x^2-36x=0</code>, <code>x^3-3x^2+2x=0</code>, <code>-x(x-1)(x^2-2)=0</code>, <code>x^4-2x^3-13x^2+38x-24=0</code>.',
      'Comprueba el l\u00edmite del principio del producto nulo: escribe <code>(x-2)(x+1)=6</code>. Igualar cada factor a 6 no sirve; hay que desarrollar primero.',
      'El n\u00famero de ra\u00edces reales distintas nunca supera el grado.'
    ], rowText('eq', 'Ecuaci\u00f3n', '2x^4+4x^3-18x^2-36x=0'));

    live(root, out, function () {
      var src = val(root, 'eq');
      var p = splitEq(src);
      var d = pdeg(p);
      var h = step('Forma P(x) = 0: ' + ph(p) + mth(' = 0') + '  (grado ' + d + ')');
      if (d < 1) {
        return h + step(Math.abs(p[0]) < 1e-12
          ? ok('Identidad: todo n\u00famero real es soluci\u00f3n.')
          : bad('Contradicci\u00f3n: no hay soluci\u00f3n.'));
      }
      var rs = realRoots(p).roots;
      h += step(key('Ra\u00edces reales: ') +
        (rs.length ? rs.map(function (v) { return chip(n(v)); }).join('') : chip('ninguna', true)));
      if (rs.length) {
        var facs = rs.map(function (r) {
          return r === 0 ? 'x' : '(x ' + (r > 0 ? MINUS : '+') + ' ' + q(Math.abs(r)) + ')';
        }).join('');
        h += step('Cada ra\u00edz aporta un factor: ' + mth(facs) + ' divide a P(x).');
        h += step('Comprobaci\u00f3n de una ra\u00edz: ' + mth('P(' + n(rs[0]) + ') = ' + n(pev(p, rs[0]))));
      }
      h += step('Igualamos cada factor a cero, uno a uno. Ese es todo el secreto del producto nulo.');
      h += svgCurve(p, rs, -8, 8);
      return h;
    });
  };

  /* ---------- Applet · Ecuaciones racionales ---------- */
  EQ.racional = function (root) {
    var out = shell(root, 'Applet \u00b7 Ecuaciones racionales', [
      'Estudiamos ' + mth(fracH('A', 'x ' + MINUS + ' p') + ' + ' + fracH('B', 'x ' + MINUS + ' q') + ' = C') +
        '. Lo primero no es operar: es anotar los valores prohibidos x ' + NE + ' p y x ' + NE + ' q.',
      'Ejemplos: A = 2, p = 1, B = 1, q = ' + MINUS + '1, C = 1; tambi\u00e9n p = q = 2 para ver qu\u00e9 ocurre entonces.',
      'Ajusta los valores hasta que una soluci\u00f3n caiga justo en un valor prohibido: aparecer\u00e1 en rojo y habr\u00e1 que rechazarla.',
      'Con C = 0 la ecuaci\u00f3n baja de grado: observa c\u00f3mo cambia el n\u00famero de candidatos.'
    ], '<div class="ap-row">' + mini('A', 'A', 2) + mini('p', 'p', 1) + mini('B', 'B', 1) +
       mini('q', 'q', -1) + mini('C', 'C', 1) + '</div>');

    live(root, out, function () {
      var A = nv(root, 'A'), p = nv(root, 'p'), B = nv(root, 'B'), q2 = nv(root, 'q'), C = nv(root, 'C');
      var left = padd(pmul([A], [-q2, 1]), pmul([B], [-p, 1]));
      var right = pmul([C], pmul([-p, 1], [-q2, 1]));
      var poly = psub(left, right);
      var h = step(mth(fracH(n(A), 'x ' + MINUS + ' ' + par(p)) + ' + ' +
        fracH(n(B), 'x ' + MINUS + ' ' + par(q2)) + ' = ' + n(C)));
      h += step(key('Dominio: ') + mth('x ' + NE + ' ' + n(p)) +
        (Math.abs(p - q2) > 1e-12 ? ' y ' + mth('x ' + NE + ' ' + n(q2))
                                  : ' (aqu\u00ed p = q, un solo valor prohibido)'));
      h += step('Multiplicamos por ' + mth('(x ' + MINUS + ' p)(x ' + MINUS + ' q)') + ': ' + ph(poly) + mth(' = 0'));
      var rs = realRoots(poly).roots, badR = [], goodR = [];
      rs.forEach(function (r) {
        if (Math.abs(r - p) < 1e-8 || Math.abs(r - q2) < 1e-8) badR.push(r); else goodR.push(r);
      });
      h += step('Candidatos: ' + (rs.length ? rs.map(function (v) {
        return chip(n(v), badR.indexOf(v) >= 0);
      }).join('') : chip('ninguno', true)));
      if (badR.length) {
        h += step(bad('Rechazados') + ' por anular un denominador: ' + badR.map(n).join(', ') +
          '. Aparecieron al multiplicar, no eran soluciones.');
      }
      h += step(key('Soluciones v\u00e1lidas: ') +
        (goodR.length ? goodR.map(function (v) { return chip(n(v)); }).join('') : chip(EMPTY, true)));
      return h;
    });
  };

  /* ---------- Applet · Ecuaciones irracionales ---------- */
  EQ.irracional = function (root) {
    var out = shell(root, 'Applet \u00b7 Ecuaciones irracionales', [
      'Estudiamos ' + mth(radH('ax + b') + ' = cx + d') + '. Al elevar al cuadrado pueden aparecer soluciones extra\u00f1as: el applet separa candidatos de soluciones.',
      'Ejemplos: a = ' + MINUS + '1, b = 2, c = 1, d = 0 para ' + mth(radH('2 ' + MINUS + ' x') + ' = x') +
        '; a = 1, b = 6, c = 1, d = 0; a = 3, b = 19, c = 1, d = 3.',
      'Dos condiciones antes de aceptar un candidato: el radicando ax + b ' + GE + ' 0 y el miembro derecho cx + d ' + GE + ' 0.',
      'Busca un caso con dos candidatos y una sola soluci\u00f3n v\u00e1lida: es el error cl\u00e1sico del tema.'
    ], '<div class="ap-row">' + mini('a', 'a', -1) + mini('b', 'b', 2) + mini('c', 'c', 1) + mini('d', 'd', 0) + '</div>');

    live(root, out, function () {
      var a = nv(root, 'a'), b = nv(root, 'b'), c = nv(root, 'c'), d = nv(root, 'd');
      var poly = psub(pmul([d, c], [d, c]), [b, a]);
      var h = step(mth(radH(ph([b, a]).replace(/<\/?span[^>]*>/g, '')) + ' = ') + ph([d, c]));
      h += step('Condiciones previas: ' + ph([b, a]) + mth(' ' + GE + ' 0') + ' y ' + ph([d, c]) + mth(' ' + GE + ' 0'));
      h += step('Elevando al cuadrado: ' + ph(poly) + mth(' = 0'));
      var rs = realRoots(poly).roots, good = [], badc = [];
      rs.forEach(function (x) {
        var rad = a * x + b, rhs = c * x + d;
        var fine = rad >= -1e-9 && rhs >= -1e-9 && Math.abs(Math.sqrt(Math.max(0, rad)) - rhs) < 1e-6;
        (fine ? good : badc).push({ x: x, rad: rad, rhs: rhs, fine: fine });
      });
      h += step('Candidatos y comprobaci\u00f3n en la ecuaci\u00f3n original:');
      if (!rs.length) h += step('No hay candidatos reales.');
      good.concat(badc).forEach(function (o) {
        h += step(mth('x = ' + n(o.x)) + ': radicando = ' + n(o.rad) + ', miembro derecho = ' + n(o.rhs) +
          '  ' + ARROW + '  ' + (o.fine ? ok('v\u00e1lida') : bad('soluci\u00f3n extra\u00f1a')));
      });
      h += step(key('Soluciones: ') +
        (good.length ? good.map(function (o) { return chip(n(o.x)); }).join('') : chip(EMPTY, true)));
      return h;
    });
  };

  /* ---------- Applet · Ecuaciones exponenciales ---------- */
  EQ.exponencial = function (root) {
    var out = shell(root, 'Applet \u00b7 Ecuaciones exponenciales', [
      'Dos modos. Directo: a' + sup('mx+n') + ' = k. Cambio de variable: A' + CDOT + 'a' + sup('2x') +
        ' + B' + CDOT + 'a' + sup('x') + ' + C = 0 con t = a' + sup('x') + ' > 0.',
      'Ejemplos directos: a = 2, m = 1, n = 1, k = 8; a = 4, m = 1, n = 1, k = 1024; a = 0,5, m = 1, n = 0, k = 8.',
      'Ejemplos con cambio: a = 2, A = 1, B = ' + MINUS + '5, C = 4 da x = 0 y x = 2; a = 3, A = 1, B = ' + MINUS + '10, C = 9.',
      'Pon k negativo o cero y lee el aviso: una potencia de base positiva nunca vale cero ni un n\u00famero negativo.'
    ],
      '<div class="ap-row"><label class="ap-lab">Modo</label>' +
      '<select class="ap-sel" data-role="modo"><option value="dir">Directo</option>' +
      '<option value="cv">Cambio de variable</option></select>' + mini('a', 'base a', 2, 0.1) + '</div>' +
      '<div class="ap-row">' + mini('m', 'm', 1) + mini('n', 'n', 1) + mini('k', 'k', 8) + '</div>' +
      '<div class="ap-row">' + mini('A', 'A', 1) + mini('B', 'B', -5) + mini('C', 'C', 4) + '</div>');

    live(root, out, function () {
      var modo = val(root, 'modo'), a = nv(root, 'a');
      if (!(a > 0) || Math.abs(a - 1) < 1e-9) throw new Error('la base debe cumplir a &gt; 0 y a ' + NE + ' 1.');
      var h = '';
      if (modo === 'dir') {
        var m = nv(root, 'm'), nn = nv(root, 'n'), k = nv(root, 'k');
        h += step(mth(n(a) + sup(ph([nn, m]).replace(/<\/?span[^>]*>/g, '')) + ' = ' + n(k)));
        if (!(k > 0)) {
          return h + step(bad('No hay soluci\u00f3n real: ') + 'a' + sup('u') +
            ' &gt; 0 siempre, luego nunca puede valer ' + n(k) + '.');
        }
        if (Math.abs(m) < 1e-12) {
          return h + step(Math.abs(Math.pow(a, nn) - k) < 1e-9
            ? ok('Identidad: ') + 'la inc\u00f3gnita ha desaparecido y la igualdad es cierta.'
            : bad('Contradicci\u00f3n: ') + 'no hay soluci\u00f3n.');
        }
        var u = Math.log(k) / Math.log(a), x = (u - nn) / m;
        h += step('Tomamos logaritmos en base a: ' + ph([nn, m]) +
          mth(' = log' + sub(n(a)) + ' ' + n(k) + ' = ' + n(u)));
        h += step(key('Soluci\u00f3n: ') + mth('x = ' + n(snap(x))));
        h += step('Comprobaci\u00f3n: ' + mth(n(a) + sup(n(m * x + nn)) + ' = ' + n(Math.pow(a, m * x + nn))));
      } else {
        var A = nv(root, 'A'), B = nv(root, 'B'), C = nv(root, 'C');
        h += step(mth(n(A) + CDOT + n(a) + sup('2x') + (B >= 0 ? ' + ' : ' ' + MINUS + ' ') +
          n(Math.abs(B)) + CDOT + n(a) + sup('x') + (C >= 0 ? ' + ' : ' ' + MINUS + ' ') + n(Math.abs(C)) + ' = 0'));
        h += step('Cambio ' + mth('t = ' + n(a) + sup('x')) + ', con la condici\u00f3n esencial ' +
          mth('t > 0') + ': ' + ph([C, B, A]) + mth(' = 0'));
        var r = quad(A, B, C);
        h += step('Valores de t: ' + (r.roots.length
          ? r.roots.map(function (t) { return chip(n(t), t <= 0); }).join('') : chip('ninguno real', true)));
        var xs = [];
        r.roots.forEach(function (t) {
          if (t > 1e-12) {
            var x2 = Math.log(t) / Math.log(a);
            xs.push(snap(x2));
            h += step(mth(n(a) + sup('x') + ' = ' + n(t)) + '  ' + ARROW + '  ' +
              mth('x = log' + sub(n(a)) + ' ' + n(t) + ' = ' + n(snap(x2))));
          } else {
            h += step(bad('t = ' + n(t) + ' ' + LE + ' 0') +
              ': descartado, una exponencial nunca es negativa ni nula.');
          }
        });
        h += step(key('Soluciones: ') +
          (xs.length ? xs.map(function (v) { return chip(n(v)); }).join('') : chip(EMPTY, true)));
      }
      return h;
    });
  };

  /* ---------- Applet · Ecuaciones logaritmicas ---------- */
  EQ.logaritmica = function (root) {
    var out = shell(root, 'Applet \u00b7 Ecuaciones logar\u00edtmicas', [
      'Dos modos. Definici\u00f3n: log' + sub('a') + '(px + q) = r. Igualdad: log' + sub('a') +
        '(px + q) = log' + sub('a') + '(sx + t).',
      'Ejemplos: a = 2, p = 1, q = ' + MINUS + '1, r = 3 para log' + sub('2') + '(x ' + MINUS + ' 1) = 3; ' +
        'a = 10, p = 100, q = ' + MINUS + '100 frente a s = 1, t = 98.',
      'El dominio no es un tr\u00e1mite final: el argumento de un logaritmo debe ser estrictamente positivo, y esa condici\u00f3n forma parte de la ecuaci\u00f3n.',
      'Fuerza un caso sin soluci\u00f3n haciendo que el valor obtenido deje el argumento negativo.'
    ],
      '<div class="ap-row"><label class="ap-lab">Modo</label>' +
      '<select class="ap-sel" data-role="modo"><option value="def">Definici\u00f3n</option>' +
      '<option value="ig">Igualdad de logaritmos</option></select>' + mini('a', 'base a', 2, 0.1) + '</div>' +
      '<div class="ap-row">' + mini('p', 'p', 1) + mini('q', 'q', -1) + mini('r', 'r', 3) + '</div>' +
      '<div class="ap-row">' + mini('s', 's', 1) + mini('t', 't', 98) + '</div>');

    live(root, out, function () {
      var modo = val(root, 'modo'), a = nv(root, 'a');
      if (!(a > 0) || Math.abs(a - 1) < 1e-9) throw new Error('la base debe cumplir a &gt; 0 y a ' + NE + ' 1.');
      var p = nv(root, 'p'), q2 = nv(root, 'q'), h = '';
      var L = 'log' + sub(n(a));

      if (modo === 'def') {
        var r = nv(root, 'r');
        h += step(mth(L + '(') + ph([q2, p]) + mth(') = ' + n(r)));
        h += step('Condici\u00f3n de dominio: ' + ph([q2, p]) + mth(' > 0'));
        var target = Math.pow(a, r);
        h += step('Forma exponencial: ' + ph([q2, p]) + mth(' = ' + n(a) + sup(n(r)) + ' = ' + n(target)));
        if (Math.abs(p) < 1e-12) {
          return h + step(Math.abs(q2 - target) < 1e-9
            ? ok('Identidad') + ': la inc\u00f3gnita ha desaparecido y la igualdad es cierta.'
            : bad('Contradicci\u00f3n') + ': no hay soluci\u00f3n.');
        }
        var x = (target - q2) / p, arg = p * x + q2;
        h += step('Candidato: ' + mth('x = ' + n(snap(x))) + ', con argumento ' + n(arg));
        h += step(arg > 1e-12
          ? key('Soluci\u00f3n: ') + mth('x = ' + n(snap(x))) + ' ' + ok('(argumento positivo)')
          : bad('Rechazado') + ': el argumento no es positivo, luego el logaritmo no existe. Soluci\u00f3n ' + mth(EMPTY) + '.');
      } else {
        var s = nv(root, 's'), t = nv(root, 't');
        h += step(mth(L + '(') + ph([q2, p]) + mth(') = ' + L + '(') + ph([t, s]) + mth(')'));
        h += step('Dominio: ' + ph([q2, p]) + mth(' > 0') + ' y ' + ph([t, s]) + mth(' > 0'));
        h += step('La funci\u00f3n logar\u00edtmica es inyectiva, luego igualamos argumentos: ' +
          ph([q2, p]) + mth(' = ') + ph([t, s]));
        var lin = psub([q2, p], [t, s]);
        if (pdeg(lin) < 1) {
          return h + step(Math.abs(lin[0]) < 1e-12
            ? ok('Los argumentos coinciden') + ': cualquier x del dominio es soluci\u00f3n.'
            : bad('Contradicci\u00f3n') + ': no hay soluci\u00f3n.');
        }
        var x2 = snap(-lin[0] / lin[1]), a1 = p * x2 + q2, a2 = s * x2 + t;
        h += step('Candidato ' + mth('x = ' + n(x2)) + ': argumentos ' + n(a1) + ' y ' + n(a2));
        h += step(a1 > 1e-12 && a2 > 1e-12
          ? key('Soluci\u00f3n: ') + mth('x = ' + n(x2))
          : bad('Rechazado') + ': alg\u00fan argumento no es positivo. Soluci\u00f3n ' + mth(EMPTY) + '.');
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
      'El extremo se dibuja relleno con ' + LE + ' y ' + GE + ', y hueco con &lt; y &gt;.'
    ], rowText('ine', 'Inecuaci\u00f3n', '-3x<=9'));

    live(root, out, function () {
      var o = splitIneq(val(root, 'ine')), p = o.poly, op = o.op;
      if (pdeg(p) > 1) throw new Error('esa inecuaci\u00f3n es de grado ' + pdeg(p) + '. Usa el applet de inecuaci\u00f3n cuadr\u00e1tica.');
      var a = p[1] || 0, b = p[0] || 0;
      var h = step('Forma reducida: ' + ph(p) + mth(' ' + opH(op) + ' 0'));
      if (Math.abs(a) < 1e-12) {
        return h + step(opHolds(b, op)
          ? ok('Se cumple siempre: ') + 'soluci\u00f3n ' + mth(REALS) + '.'
          : bad('Nunca se cumple: ') + 'soluci\u00f3n ' + mth(EMPTY) + '.');
      }
      var fin = a < 0 ? FLIP[op] : op, x0 = snap(-b / a);
      h += step('Despejamos: ' + mth(q(a) + 'x ' + opH(op) + ' ' + q(-b)));
      if (a < 0) {
        h += warnStep(key('Atenci\u00f3n: ') + 'dividimos entre ' + n(a) +
          ', que es negativo, as\u00ed que la desigualdad <b>cambia de sentido</b>.');
      }
      h += step(key('Soluci\u00f3n: ') + mth('x ' + opH(fin) + ' ' + q(x0)));
      var lower = (fin === '>' || fin === '>=');
      var pieces = [{ a: -Infinity, b: x0, okk: !lower }, { a: x0, b: Infinity, okk: lower }];
      h += step('En intervalos: ' + (lower
        ? ivH(x0, Infinity, opClosed(fin), false)
        : ivH(-Infinity, x0, false, opClosed(fin))));
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
      'Interpreta el resultado gr\u00e1ficamente: P(x) &gt; 0 pregunta d\u00f3nde la curva queda por encima del eje horizontal.'
    ], rowText('ine', 'Inecuaci\u00f3n', '2x^2-7x+40>=x^2+5x+5'));

    live(root, out, function () {
      var o = splitIneq(val(root, 'ine')), p = o.poly, op = o.op;
      var h = step('Forma reducida: ' + ph(p) + mth(' ' + opH(op) + ' 0') + '  (grado ' + pdeg(p) + ')');
      if (pdeg(p) === 2) {
        var D = (p[1] || 0) * (p[1] || 0) - 4 * p[2] * (p[0] || 0);
        h += step('Ecuaci\u00f3n asociada: ' + ph(p) + mth(' = 0') + ', con ' + mth(DELTA + ' = ' + n(D)));
      }
      var sol = solveIneq(p, op);
      if (sol.roots.length) {
        h += step('Ra\u00edces que separan la recta real: ' +
          sol.roots.map(function (v) { return chip(n(v)); }).join(''));
        var rows = sol.pieces.map(function (s) {
          return '<tr class="' + (s.okk ? 'ap-sel-row' : '') + '"><td>' +
            ivH(s.a, s.b, false, false) + '</td><td>' + n(s.probe) + '</td><td>' + n(s.val) +
            '</td><td>' + (s.val > 0 ? '+' : s.val < 0 ? MINUS : '0') + '</td><td>' +
            (s.okk ? ok('s\u00ed') : 'no') + '</td></tr>';
        }).join('');
        h += '<table class="ap-tbl"><tr><th>Intervalo</th><th>Punto de prueba</th>' +
          '<th>Valor</th><th>Signo</th><th>\u00bfCumple?</th></tr>' + rows + '</table>';
      } else {
        h += step('La ecuaci\u00f3n asociada no tiene ra\u00edces reales: hay un \u00fanico intervalo, toda la recta real, y el signo es constante.');
      }
      h += step(key('Conjunto soluci\u00f3n: ') + sol.html);
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
      'Elige los extremos y si cada uno es abierto o cerrado. Prueba ' + MINUS + '2 cerrado y 3 abierto: obtienes [' + MINUS + '2, 3).',
      'Pon el extremo izquierdo mayor que el derecho y lee el aviso: el conjunto queda vac\u00edo.',
      'Marca los dos extremos como infinitos para representar ' + REALS + '.'
    ],
      '<div class="ap-row">' + mini('l', 'extremo izq.', -2) +
      '<label class="ap-lab">Tipo</label><select class="ap-sel" data-role="lc">' +
      '<option value="1">cerrado</option><option value="0">abierto</option>' +
      '<option value="i">' + MINUS + INF + '</option></select></div>' +
      '<div class="ap-row">' + mini('r', 'extremo der.', 3) +
      '<label class="ap-lab">Tipo</label><select class="ap-sel" data-role="rc">' +
      '<option value="0">abierto</option><option value="1">cerrado</option>' +
      '<option value="i">+' + INF + '</option></select></div>');

    live(root, out, function () {
      var lcv = val(root, 'lc'), rcv = val(root, 'rc');
      var l = lcv === 'i' ? -Infinity : nv(root, 'l');
      var r = rcv === 'i' ? Infinity : nv(root, 'r');
      var lc = lcv === '1', rc = rcv === '1';
      if (l !== -Infinity && r !== Infinity && l > r) {
        throw new Error('el extremo izquierdo es mayor que el derecho: el conjunto ser\u00eda vac\u00edo.');
      }
      var h = step(key('Intervalo: ') + ivH(l, r, lc, rc));
      var des;
      if (l === -Infinity && r === Infinity) des = 'x ' + '\u2208 ' + REALS;
      else if (l === -Infinity) des = 'x ' + (rc ? LE : '<') + ' ' + q(r);
      else if (r === Infinity) des = 'x ' + (lc ? GE : '>') + ' ' + q(l);
      else des = q(l) + ' ' + (lc ? LE : '<') + ' x ' + (rc ? LE : '<') + ' ' + q(r);
      h += step(key('Desigualdad: ') + mth(des));
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
      'Applet de servicio, no de aula: comprueba que <code>window.POLY</code> se ha cargado y que el adaptador lee bien los coeficientes.',
      'La notaci\u00f3n de esta versi\u00f3n se genera en HTML, sin depender de MathJax, as\u00ed que debe verse compuesta siempre.'
    ], rowText('eq', 'Prueba', '2x^2-5x-3'));

    live(root, out, function () {
      var h = step('window.POLY: ' + (P ? ok('detectado') : bad('no encontrado') +
        ' (se usa el parser de respaldo)'));
      if (P) h += step('Miembros visibles: ' + Object.keys(P).sort().join(', '));
      var c = coeffs(val(root, 'eq'));
      h += step('Coeficientes ascendentes le\u00eddos: [' + c.map(n).join(', ') + ']');
      h += step('Reconstrucci\u00f3n: ' + ph(c));
      h += step('Valor en ' + mth('x = 2') + ': ' + n(pev(c, 2)));
      h += step('Prueba de notaci\u00f3n: ' +
        mth('x = ' + fracH(MINUS + 'b ' + PM + ' ' + radH(DELTA), '2a')) +
        ' con ' + mth(DELTA + ' = b' + sup(2) + ' ' + MINUS + ' 4ac') +
        ', y ' + mth('(' + MINUS + INF + ', 5] ' + CUP + ' [7, +' + INF + ')'));
      return h;
    });
  };

  /* =================================================================
     7. ARRANQUE
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
    boot();
  }

  window.EQAPP = {
    coeffs: coeffs, html: ph, roots: realRoots, quad: quad,
    ineq: solveIneq, eval: pev, applets: EQ, engine: P
  };
})();
