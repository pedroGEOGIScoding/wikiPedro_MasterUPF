/* =====================================================================
   fn-applets.js — FUNCIONES · 1r Batx Mates CCSS
   Notacion LaTeX compuesta por KaTeX. Sin OJS, sin MathJax.

   INSERCION EN EL .qmd
     <div data-applet-fn="clave"></div>

   CLAVES
     maquina · esfuncion · dominio · recorrido · simetria
     polinomica · afin · rectados · cuadratica · canonica
     interlineal · intercuadratica · racional · radical · inversa
     trozos · absoluto · parteentera · operaciones · composicion
     transformaciones · diagnostico

   MOTOR PROPIO
   A diferencia de los temas de algebra, aqui no basta window.POLY:
   necesitamos evaluar expresiones cualesquiera (raices, logaritmos,
   valor absoluto, cocientes). Por eso este archivo incluye un
   compilador de expresiones que devuelve una funcion JavaScript, mas
   utilidades de dominio, recorrido y dibujo con deteccion de asintotas.

   DEPENDENCIAS (via assets/_scripts.html)
     applets.css  ·  katex.min.css  ·  katex.min.js  ·  auto-render
   ===================================================================== */

(function () {
  'use strict';

  var FN = {};

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

  /* =================================================================
     1. NUMEROS
     ================================================================= */

  function nz(x) { return Math.abs(x) < 1e-11 ? 0 : x; }

  function nt(x) {
    if (x === null || x === undefined || !isFinite(x)) return '\\text{no definido}';
    var y = nz(x), r = Math.round(y * 1e4) / 1e4;
    return Number.isInteger(r) ? String(r) : String(r).replace('.', '{,}');
  }

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

  function snap(x) {
    for (var d = 1; d <= 24; d++) {
      var p = x * d;
      if (Math.abs(p - Math.round(p)) < 1e-8) return Math.round(p) / d;
    }
    return x;
  }

  /* Expresion de usuario a LaTeX aproximado, para mostrarla bonita. */
  function toTex(src) {
    var s = String(src);
    s = s.replace(/\bsqrt\(([^()]*)\)/g, '\\sqrt{$1}');
    s = s.replace(/\bcbrt\(([^()]*)\)/g, '\\sqrt[3]{$1}');
    s = s.replace(/\babs\(([^()]*)\)/g, '\\left|$1\\right|');
    s = s.replace(/\bln\(/g, '\\ln(').replace(/\blog\(/g, '\\log(');
    s = s.replace(/\bexp\(/g, '\\exp(');
    s = s.replace(/\bpi\b/g, '\\pi');
    s = s.replace(/\*/g, '\\cdot ');
    s = s.replace(/\^\(([^()]*)\)/g, '^{$1}');
    s = s.replace(/\^(-?\d+(?:\.\d+)?)/g, '^{$1}');
    s = s.replace(/(\d)\/(\d)/g, '\\dfrac{$1}{$2}');
    return s;
  }

  /* =================================================================
     2. COMPILADOR DE EXPRESIONES
     Devuelve una funcion f(x). Lanza error con mensaje didactico.
     ================================================================= */

  var FUNCS = {
    sqrt: function (v) { return v < 0 ? NaN : Math.sqrt(v); },
    cbrt: function (v) { return Math.cbrt(v); },
    abs: Math.abs,
    ln: function (v) { return v <= 0 ? NaN : Math.log(v); },
    log: function (v) { return v <= 0 ? NaN : Math.log10(v); },
    log2: function (v) { return v <= 0 ? NaN : Math.log2(v); },
    exp: Math.exp,
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    floor: Math.floor, round: Math.round, sign: Math.sign
  };

  function compile(src) {
    var s = String(src).replace(/\s+/g, '').replace(/,/g, '.');
    if (!s) throw new Error('la expresi\u00f3n est\u00e1 vac\u00eda.');
    var i = 0;

    function expr() {
      var v = term();
      for (;;) {
        if (s[i] === '+') { i++; v = bin(v, term(), function (a, b) { return a + b; }); }
        else if (s[i] === '-') { i++; v = bin(v, term(), function (a, b) { return a - b; }); }
        else return v;
      }
    }
    function term() {
      var v = unary();
      for (;;) {
        if (s[i] === '*') { i++; v = bin(v, unary(), function (a, b) { return a * b; }); }
        else if (s[i] === '/') {
          i++;
          v = bin(v, unary(), function (a, b) { return Math.abs(b) < 1e-14 ? NaN : a / b; });
        }
        else if (i < s.length && /[0-9x(a-z]/i.test(s[i]) && s[i] !== 'e' || (s[i] === 'e' && !/[0-9]/.test(s[i - 1] || ''))) {
          /* producto implicito: 2x, 3(x+1), xsqrt(x) */
          if (/[0-9x(a-z]/i.test(s[i])) { v = bin(v, unary(), function (a, b) { return a * b; }); }
          else return v;
        }
        else return v;
      }
    }
    function unary() {
      if (s[i] === '-') { i++; var u = unary(); return function (x) { return -u(x); }; }
      if (s[i] === '+') { i++; return unary(); }
      return power();
    }
    function power() {
      var b = atom();
      if (s[i] === '^') {
        i++;
        var e = unary();
        return function (x) {
          var bb = b(x), ee = e(x);
          if (bb < 0 && !Number.isInteger(ee)) return NaN;
          return Math.pow(bb, ee);
        };
      }
      return b;
    }
    function atom() {
      if (s[i] === '(') {
        i++;
        var v = expr();
        if (s[i] !== ')') throw new Error('falta cerrar un par\u00e9ntesis.');
        i++;
        return v;
      }
      if (s[i] === '|') {
        i++;
        var w = expr();
        if (s[i] !== '|') throw new Error('falta cerrar la barra del valor absoluto.');
        i++;
        return function (x) { return Math.abs(w(x)); };
      }
      /* nombre: funcion, constante o variable */
      var m = /^[a-zA-Z][a-zA-Z0-9]*/.exec(s.slice(i));
      if (m) {
        var name = m[0];
        if (name === 'x') { i += 1; return function (x) { return x; }; }
        if (name === 'pi') { i += 2; return function () { return Math.PI; }; }
        if (name === 'e' && s[i + 1] !== '^') { i += 1; return function () { return Math.E; }; }
        if (FUNCS[name]) {
          i += name.length;
          if (s[i] !== '(') throw new Error('despu\u00e9s de <code>' + name + '</code> hace falta un par\u00e9ntesis.');
          i++;
          var arg = expr();
          if (s[i] !== ')') throw new Error('falta cerrar el par\u00e9ntesis de <code>' + name + '</code>.');
          i++;
          var g = FUNCS[name];
          return function (x) { return g(arg(x)); };
        }
        if (name === 'e') { i += 1; return function () { return Math.E; }; }
        throw new Error('no conozco <code>' + name + '</code>. Usa <code>sqrt</code>, <code>cbrt</code>, <code>abs</code>, <code>ln</code>, <code>log</code>, <code>exp</code>.');
      }
      var num = /^\d+(\.\d+)?/.exec(s.slice(i));
      if (num) { i += num[0].length; var val = parseFloat(num[0]); return function () { return val; }; }
      throw new Error('no entiendo el car\u00e1cter \u00ab' + (s[i] || 'final') + '\u00bb en la posici\u00f3n ' + (i + 1) + '.');
    }
    function bin(a, b, op) { return function (x) { return op(a(x), b(x)); }; }

    var f = expr();
    if (i < s.length) throw new Error('sobra el car\u00e1cter \u00ab' + s[i] + '\u00bb en la posici\u00f3n ' + (i + 1) + '.');
    /* prueba de humo */
    try { f(1); } catch (e) { throw new Error('la expresi\u00f3n no se puede evaluar.'); }
    return f;
  }

  function safe(f, x) {
    var v;
    try { v = f(x); } catch (e) { return NaN; }
    return (typeof v === 'number' && isFinite(v)) ? v : NaN;
  }

  /* =================================================================
     3. DOMINIO, RECORRIDO, CORTES, SIMETRIA
     ================================================================= */

  function scan(f, a, b, n) {
    n = n || 1200;
    var pts = [];
    for (var k = 0; k <= n; k++) {
      var x = a + (b - a) * k / n;
      pts.push({ x: x, y: safe(f, x) });
    }
    return pts;
  }

  /* Intervalos donde la funcion NO esta definida, aproximados. */
  function gaps(pts) {
    var out = [], run = null;
    pts.forEach(function (p) {
      if (isNaN(p.y)) { if (!run) run = { a: p.x, b: p.x }; else run.b = p.x; }
      else if (run) { out.push(run); run = null; }
    });
    if (run) out.push(run);
    return out;
  }

  function rangeOf(pts) {
    var vals = pts.filter(function (p) { return !isNaN(p.y); }).map(function (p) { return p.y; });
    if (!vals.length) return null;
    return { min: Math.min.apply(null, vals), max: Math.max.apply(null, vals) };
  }

  function zeros(f, a, b) {
    var out = [], prev = safe(f, a), n = 2000;
    for (var k = 1; k <= n; k++) {
      var x = a + (b - a) * k / n, cur = safe(f, x);
      if (!isNaN(prev) && !isNaN(cur) && prev * cur < 0) {
        var lo = a + (b - a) * (k - 1) / n, hi = x;
        for (var j = 0; j < 60; j++) {
          var m = (lo + hi) / 2;
          if (safe(f, lo) * safe(f, m) <= 0) hi = m; else lo = m;
        }
        out.push(snap((lo + hi) / 2));
      }
      prev = cur;
    }
    return out;
  }

  function symmetry(f) {
    var par = true, impar = true, tested = 0;
    [0.37, 0.9, 1.4, 2.1, 3.3, 4.7].forEach(function (x) {
      var a = safe(f, x), b = safe(f, -x);
      if (isNaN(a) || isNaN(b)) return;
      tested++;
      if (Math.abs(a - b) > 1e-6) par = false;
      if (Math.abs(a + b) > 1e-6) impar = false;
    });
    if (!tested) return 'sin datos';
    if (par && impar) return 'nula';
    if (par) return 'par';
    if (impar) return 'impar';
    return 'ninguna';
  }

  /* =================================================================
     4. DIBUJO
     ================================================================= */

  var W0 = { xmin: -8, xmax: 8, ymin: -6, ymax: 6 };

  function plot(items, w, opts) {
    w = w || W0; opts = opts || {};
    var W = 520, H = 380, pad = 30;
    function sx(x) { return pad + (x - w.xmin) / (w.xmax - w.xmin) * (W - 2 * pad); }
    function sy(y) { return H - pad - (y - w.ymin) / (w.ymax - w.ymin) * (H - 2 * pad); }
    var g = '', t;

    var stepX = niceStep(w.xmax - w.xmin), stepY = niceStep(w.ymax - w.ymin);
    for (t = Math.ceil(w.xmin / stepX) * stepX; t <= w.xmax; t += stepX)
      g += '<line x1="' + sx(t).toFixed(1) + '" y1="' + pad + '" x2="' + sx(t).toFixed(1) + '" y2="' + (H - pad) + '" stroke="#eef2f7"/>';
    for (t = Math.ceil(w.ymin / stepY) * stepY; t <= w.ymax; t += stepY)
      g += '<line x1="' + pad + '" y1="' + sy(t).toFixed(1) + '" x2="' + (W - pad) + '" y2="' + sy(t).toFixed(1) + '" stroke="#eef2f7"/>';

    g += '<line x1="' + pad + '" y1="' + sy(0).toFixed(1) + '" x2="' + (W - pad) + '" y2="' + sy(0).toFixed(1) + '" stroke="#94a3b8" stroke-width="1.6"/>';
    g += '<line x1="' + sx(0).toFixed(1) + '" y1="' + pad + '" x2="' + sx(0).toFixed(1) + '" y2="' + (H - pad) + '" stroke="#94a3b8" stroke-width="1.6"/>';

    items.forEach(function (it) {
      if (!it) return;
      if (it.type === 'fn') {
        var d = '', pen = false, prevY = null, N = 700;
        for (var k = 0; k <= N; k++) {
          var x = w.xmin + (w.xmax - w.xmin) * k / N;
          var y = safe(it.f, x);
          var outOf = isNaN(y) || y < w.ymin - (w.ymax - w.ymin) || y > w.ymax + (w.ymax - w.ymin);
          var jump = (prevY !== null && !isNaN(y) && Math.abs(y - prevY) > (w.ymax - w.ymin) * 0.6);
          if (outOf || jump) { pen = false; prevY = isNaN(y) ? null : y; continue; }
          d += (pen ? 'L' : 'M') + sx(x).toFixed(1) + ',' + sy(y).toFixed(1) + ' ';
          pen = true; prevY = y;
        }
        g += '<path d="' + d + '" fill="none" stroke="' + (it.color || '#2a76dd') +
          '" stroke-width="' + (it.width || 2.5) + '"' + (it.dash ? ' stroke-dasharray="6 4"' : '') + '/>';
      }
      if (it.type === 'vline') {
        g += '<line x1="' + sx(it.x).toFixed(1) + '" y1="' + pad + '" x2="' + sx(it.x).toFixed(1) +
          '" y2="' + (H - pad) + '" stroke="' + (it.color || '#e63946') + '" stroke-width="1.6" stroke-dasharray="5 4"/>';
      }
      if (it.type === 'hline') {
        g += '<line x1="' + pad + '" y1="' + sy(it.y).toFixed(1) + '" x2="' + (W - pad) +
          '" y2="' + sy(it.y).toFixed(1) + '" stroke="' + (it.color || '#e63946') + '" stroke-width="1.6" stroke-dasharray="5 4"/>';
      }
      if (it.type === 'seg') {
        g += '<line x1="' + sx(it.x1).toFixed(1) + '" y1="' + sy(it.y1).toFixed(1) +
          '" x2="' + sx(it.x2).toFixed(1) + '" y2="' + sy(it.y2).toFixed(1) +
          '" stroke="' + (it.color || '#2a9d8f') + '" stroke-width="' + (it.width || 9) +
          '" opacity="' + (it.opacity === undefined ? 0.85 : it.opacity) + '"' +
          (it.dash ? ' stroke-dasharray="5 4"' : '') + ' stroke-linecap="butt"/>';
      }
      if (it.type === 'points') {
        (it.pts || []).forEach(function (p) {
          g += '<circle cx="' + sx(p[0]).toFixed(1) + '" cy="' + sy(p[1]).toFixed(1) + '" r="5" fill="' +
            (it.fill || '#e63946') + '" stroke="#fff" stroke-width="1.4"/>';
          if (it.labels) {
            g += '<text x="' + (sx(p[0]) + 7).toFixed(1) + '" y="' + (sy(p[1]) - 7).toFixed(1) +
              '" font-size="11.5" fill="#334155">(' + nice(p[0]) + ', ' + nice(p[1]) + ')</text>';
          }
        });
      }
    });
    return '<svg class="ap-fig" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
      (opts.alt || 'gr\u00e1fica de la funci\u00f3n') + '">' + g + '</svg>';
  }

  function nice(v) { return String(Math.round(v * 100) / 100).replace('.', ','); }
  function niceStep(r) {
    var raw = r / 10, mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), n = raw / mag;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
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
      '<input class="ap-in ap-mini" type="number" data-role="' + role + '" value="' + value + '" step="' + (stp || 1) + '">';
  }
  function range(role, label, min, max, value, stp) {
    return '<div class="ap-row"><label class="ap-lab">' + label + '</label>' +
      '<input class="ap-in ap-range" type="range" data-role="' + role + '" min="' + min + '" max="' + max +
      '" step="' + (stp || 1) + '" value="' + value + '"></div>';
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

  var SINTAXIS = 'Sintaxis: <code>x^2</code>, <code>3x</code>, <code>1/x</code>, <code>sqrt(x)</code>, <code>cbrt(x)</code>, <code>abs(x)</code> o <code>|x|</code>, <code>ln(x)</code>, <code>log(x)</code>, <code>exp(x)</code>, <code>pi</code>, <code>e</code>.';

  /* =================================================================
     6. APPLETS · CONCEPTO, DOMINIO Y RECORRIDO
     ================================================================= */

  FN.maquina = function (root) {
    var out = shell(root, 'Applet \u00b7 M\u00e1quina de funciones', [
      'Una funci\u00f3n es una m\u00e1quina: entra un valor $x$, la variable independiente, y sale un \u00fanico valor $y=f(x)$, la variable dependiente.',
      'Escribe la expresi\u00f3n y el valor de entrada. El applet construye la tabla de valores y marca el punto en la gr\u00e1fica.',
      'Ejemplos: <code>7.5x</code> para el precio de la tela a $7{,}50$ euros el metro; <code>2x-1</code>; <code>x^2-3</code>; <code>1/x</code>.',
      SINTAXIS
    ], rowText('f', 'f(x) =', '2x-1') +
       '<div class="ap-row">' + mini('x0', 'entrada x', 3) + mini('paso', 'paso tabla', 1) + '</div>');

    live(root, out, function () {
      var src = val(root, 'f'), f = compile(src), x0 = nv(root, 'x0'), p = nv(root, 'paso') || 1;
      var y0 = safe(f, x0);
      var h = step('Funci\u00f3n: ' + T('f(x)=' + toTex(src)));
      h += step(key('Entrada ') + T('x=' + nt(x0)) + ' ' + T('\\longrightarrow') + ' ' +
        key('salida ') + (isNaN(y0) ? bad('no existe: $x$ no est\u00e1 en el dominio')
                                    : T('f(' + nt(x0) + ')=' + nt(y0))));
      var rows = '';
      for (var k = -3; k <= 3; k++) {
        var x = snap(x0 + k * p), y = safe(f, x);
        rows += '<tr class="' + (k === 0 ? 'ap-sel-row' : '') + '"><td>' + T(nt(x)) + '</td><td>' +
          (isNaN(y) ? bad('no existe') : T(nt(y))) + '</td></tr>';
      }
      h += '<table class="ap-tbl"><tr><th>' + T('x') + '</th><th>' + T('y=f(x)') + '</th></tr>' + rows + '</table>';
      h += step(note('Una tabla de valores es solo una aproximaci\u00f3n: no sabemos qu\u00e9 ocurre entre dos puntos consecutivos.'));
      h += plot([{ type: 'fn', f: f }, isNaN(y0) ? null : { type: 'points', pts: [[x0, y0]], labels: true }], W0);
      return h;
    });
  };

  FN.esfuncion = function (root) {
    var out = shell(root, 'Applet \u00b7 \u00bfEs una funci\u00f3n?', [
      'Criterio de la recta vertical: una gr\u00e1fica representa una funci\u00f3n si <b>ninguna</b> recta vertical la corta en m\u00e1s de un punto.',
      'Elige una relaci\u00f3n y mueve la recta vertical. El applet cuenta cu\u00e1ntos puntos de la curva encuentra.',
      'La circunferencia y la relaci\u00f3n $\\pm\\sqrt{x}$ no son funciones; la par\u00e1bola $y=x^{2}$ y la c\u00fabica s\u00ed lo son.',
      'Piensa: \u00bfla cantidad de fruta que compra una familia y el precio de la compra es una funci\u00f3n? \u00bfY la cantidad de fruta y el precio de un kilo?'
    ],
      '<div class="ap-row"><label class="ap-lab">Relaci\u00f3n</label><select class="ap-sel" data-role="rel">' +
      '<option value="par">y = x^2 (par\u00e1bola)</option>' +
      '<option value="cir">x^2 + y^2 = 9 (circunferencia)</option>' +
      '<option value="rai">y = \u00b1\u221ax</option>' +
      '<option value="cub">y = x^3 - 3x</option></select></div>' +
      range('a', 'recta x =', -4, 4, 1, 0.25));

    live(root, out, function () {
      var rel = val(root, 'rel'), a = nv(root, 'a');
      var items = [{ type: 'vline', x: a, color: '#8e44ad' }], cuenta = 0, pts = [], esF = true, txt = '';
      if (rel === 'par') {
        items.push({ type: 'fn', f: function (x) { return x * x; } });
        pts = [[a, a * a]]; cuenta = 1; txt = 'y=x^{2}';
      } else if (rel === 'cir') {
        items.push({ type: 'fn', f: function (x) { var q = 9 - x * x; return q < 0 ? NaN : Math.sqrt(q); } });
        items.push({ type: 'fn', f: function (x) { var q = 9 - x * x; return q < 0 ? NaN : -Math.sqrt(q); } });
        var q = 9 - a * a;
        if (q > 1e-9) { pts = [[a, Math.sqrt(q)], [a, -Math.sqrt(q)]]; cuenta = 2; }
        else if (Math.abs(q) <= 1e-9) { pts = [[a, 0]]; cuenta = 1; }
        else cuenta = 0;
        esF = false; txt = 'x^{2}+y^{2}=9';
      } else if (rel === 'rai') {
        items.push({ type: 'fn', f: function (x) { return x < 0 ? NaN : Math.sqrt(x); } });
        items.push({ type: 'fn', f: function (x) { return x < 0 ? NaN : -Math.sqrt(x); } });
        if (a > 1e-9) { pts = [[a, Math.sqrt(a)], [a, -Math.sqrt(a)]]; cuenta = 2; }
        else if (Math.abs(a) <= 1e-9) { pts = [[0, 0]]; cuenta = 1; }
        esF = false; txt = 'y=\\pm\\sqrt{x}';
      } else {
        items.push({ type: 'fn', f: function (x) { return x * x * x - 3 * x; } });
        pts = [[a, a * a * a - 3 * a]]; cuenta = 1; txt = 'y=x^{3}-3x';
      }
      items.push({ type: 'points', pts: pts });
      var h = step('Relaci\u00f3n: ' + T(txt));
      h += step('La recta ' + T('x=' + nt(a)) + ' corta la gr\u00e1fica en ' + key(cuenta) +
        ' punto' + (cuenta === 1 ? '' : 's') + '.');
      h += step(esF ? ok('Es una funci\u00f3n') + ': ninguna vertical la corta dos veces.'
                    : bad('No es una funci\u00f3n') + ': hay verticales que la cortan dos veces, luego un mismo $x$ tendr\u00eda dos im\u00e1genes.');
      h += plot(items, { xmin: -5, xmax: 5, ymin: -5, ymax: 5 });
      return h;
    });
  };

  FN.dominio = function (root) {
    var out = shell(root, 'Applet \u00b7 Dominio de una expresi\u00f3n', [
      'El dominio es el conjunto de valores para los que la funci\u00f3n <b>existe</b>. Se estudia mirando qu\u00e9 operaciones aparecen.',
      'Reglas: los polinomios est\u00e1n definidos en todo $\\mathbb{R}$; los denominadores no pueden anularse; las ra\u00edces de \u00edndice par exigen radicando mayor o igual que cero; los logaritmos exigen argumento estrictamente positivo.',
      'Ejemplos: <code>3x^2+2x-7</code>, <code>3/(x+1)</code>, <code>sqrt(x-1)</code>, <code>log(x+1)</code>, <code>1/ln(x)</code>, <code>(x^4+4)/(x^2-4)</code>, <code>sqrt(x^2-1)</code>, <code>cbrt(x)</code>.',
      SINTAXIS
    ], rowText('f', 'f(x) =', '3/(x+1)'));

    live(root, out, function () {
      var src = val(root, 'f'), f = compile(src);
      var w = { xmin: -10, xmax: 10, ymin: -8, ymax: 8 };
      var pts = scan(f, w.xmin, w.xmax, 2400), g = gaps(pts);
      var h = step('Funci\u00f3n: ' + T('f(x)=' + toTex(src)));
      h += step(key('Pistas de la expresi\u00f3n: ') +
        [/\//.test(src) ? 'hay un cociente, busca d\u00f3nde se anula el denominador' : null,
         /sqrt/.test(src) ? 'hay una ra\u00edz cuadrada, exige radicando no negativo' : null,
         /cbrt/.test(src) ? 'hay una ra\u00edz c\u00fabica, de \u00edndice impar, y no restringe nada' : null,
         /ln|log/.test(src) ? 'hay un logaritmo, exige argumento positivo' : null,
         /abs|\|/.test(src) ? 'hay un valor absoluto, que no restringe' : null]
          .filter(Boolean).join('; ') || 'solo operaciones polin\u00f3micas');
      if (!g.length) {
        h += step(key('Dominio: ') + T('\\mathbb{R}') + ' ' + ok('(no se detecta ning\u00fan punto excluido)'));
      } else {
        h += step(key('Zonas sin definir detectadas en ') + T('[-10,10]') + ':');
        g.forEach(function (r) {
          var pun = Math.abs(r.b - r.a) < 0.05;
          h += step(pun ? 'Punto excluido en torno a ' + T('x\\approx ' + nt(snap((r.a + r.b) / 2)))
                        : 'Intervalo sin im\u00e1genes ' + T('\\left(' + nt(snap(r.a)) + ',\\ ' + nt(snap(r.b)) + '\\right)'));
        });
        h += step(note('El applet explora num\u00e9ricamente: usa sus avisos como gu\u00eda y despu\u00e9s justifica el dominio resolviendo la condici\u00f3n exacta.'));
      }
      h += plot([{ type: 'fn', f: f }], w);
      return h;
    });
  };

  FN.recorrido = function (root) {
    var out = shell(root, 'Applet \u00b7 Dominio y recorrido en la gr\u00e1fica', [
      'El dominio se lee proyectando la gr\u00e1fica sobre el eje horizontal; el recorrido, proyectando sobre el eje vertical.',
      'Ejemplos para comparar: <code>x^2</code> tiene recorrido $[0,+\\infty)$; <code>sqrt(x)</code> tambi\u00e9n, pero su dominio es $[0,+\\infty)$; <code>1/x</code> excluye el cero en los dos.',
      'Prueba <code>exp(x)</code>: dominio todo $\\mathbb{R}$ y recorrido $(0,+\\infty)$. Y <code>ln(x)</code>, que es justo al contrario.',
      'Ajusta la ventana para ver si el recorrido crece sin l\u00edmite o se estanca.'
    ], rowText('f', 'f(x) =', 'x^2-3') +
       '<div class="ap-row">' + mini('a', 'desde x', -6) + mini('b', 'hasta x', 6) + '</div>');

    live(root, out, function () {
      var src = val(root, 'f'), f = compile(src), a = nv(root, 'a'), b = nv(root, 'b');
      if (!(b > a)) throw new Error('el extremo derecho debe ser mayor que el izquierdo.');
      var pts = scan(f, a, b, 2000), r = rangeOf(pts), g = gaps(pts);
      var h = step('Funci\u00f3n: ' + T('f(x)=' + toTex(src)) + ' en ' + T('\\left[' + nt(a) + ',\\ ' + nt(b) + '\\right]'));
      h += step(key('Dominio observado: ') + (g.length
        ? 'el intervalo menos ' + g.length + ' zona' + (g.length === 1 ? '' : 's') + ' sin definir'
        : 'todo el intervalo'));
      h += step(key('Recorrido observado: ') + (r
        ? T('\\left[' + nt(snap(r.min)) + ',\\ ' + nt(snap(r.max)) + '\\right]')
        : bad('la funci\u00f3n no est\u00e1 definida en ning\u00fan punto del intervalo')));
      var z = zeros(f, a, b);
      h += step(key('Cortes con el eje horizontal: ') + (z.length
        ? z.map(function (v) { return chip(T('\\left(' + nt(v) + ',0\\right)')); }).join('') : 'ninguno en este intervalo'));
      var y0 = safe(f, 0);
      h += step(key('Corte con el eje vertical: ') + (isNaN(y0) ? 'no hay, porque $x=0$ no est\u00e1 en el dominio'
        : chip(T('\\left(0,' + nt(y0) + '\\right)'))));
      h += plot([{ type: 'fn', f: f }], { xmin: a, xmax: b, ymin: r ? Math.min(-1, r.min - 1) : -6, ymax: r ? Math.max(1, r.max + 1) : 6 });
      return h;
    });
  };

/* =====================================================================
   [2] APPLET COMPLETO  —  pegar junto a los demas applets
   ===================================================================== */

  /* ---------- Applet · Proyecciones: dominio y recorrido ---------- */
  FN.proyecciones = function (root) {
    var CAT = {
      par:  { src: 'x^2',        tex: 'x^{2}',            nota: 'Dominio todo $\\mathbb{R}$, recorrido $[0,+\\infty)$.' },
      rai:  { src: 'sqrt(x)',    tex: '\\sqrt{x}',        nota: 'Dominio y recorrido coinciden: $[0,+\\infty)$.' },
      inv:  { src: '1/x',        tex: '\\dfrac{1}{x}',    nota: 'El cero se excluye en el dominio y en el recorrido.' },
      abso: { src: 'abs(x)',     tex: '\\left|x\\right|', nota: 'Dominio $\\mathbb{R}$, recorrido $[0,+\\infty)$.' },
      cub:  { src: 'x^3',        tex: 'x^{3}',            nota: 'Dominio y recorrido son todo $\\mathbb{R}$.' },
      semi: { src: 'sqrt(4-x^2)', tex: '\\sqrt{4-x^{2}}', nota: 'Semicircunferencia: dominio $[-2,2]$, recorrido $[0,2]$.' },
      par4: { src: 'x^2-4',      tex: 'x^{2}-4',          nota: 'El recorrido empieza en el m\u00ednimo, no en cero.' },
      lg:   { src: 'ln(x)',      tex: '\\ln x',           nota: 'Dominio $(0,+\\infty)$, recorrido $\\mathbb{R}$.' },
      ex:   { src: 'exp(x)',     tex: 'e^{x}',            nota: 'Justo al contrario que el logaritmo.' },
      hip:  { src: 'sqrt(x^2-1)', tex: '\\sqrt{x^{2}-1}', nota: 'Dominio partido en dos intervalos.' }
    };

    var out = shell(root, 'Applet \u00b7 Proyecciones: dominio y recorrido', [
      'El <b>dominio</b> es la sombra de la gr\u00e1fica sobre el eje horizontal; el <b>recorrido</b>, su sombra sobre el eje vertical. Aqu\u00ed las ves dibujadas.',
      'Elige una curva del cat\u00e1logo o escribe la tuya. Activa y desactiva cada proyecci\u00f3n para verlas por separado.',
      'Empieza por $\\sqrt{4-x^{2}}$: el dominio es un segmento corto y el recorrido tambi\u00e9n. Sigue con $\\dfrac{1}{x}$, donde las dos proyecciones aparecen partidas en dos trozos.',
      'Compara $e^{x}$ con $\\ln x$: sus proyecciones est\u00e1n intercambiadas, porque son funciones inversas.',
      SINTAXIS
    ],
      '<div class="ap-row"><label class="ap-lab">Curva</label><select class="ap-sel" data-role="c">' +
      '<option value="semi">\u221a(4-x\u00b2), semicircunferencia</option>' +
      '<option value="par">x\u00b2</option>' +
      '<option value="rai">\u221ax</option>' +
      '<option value="inv">1/x</option>' +
      '<option value="abso">|x|</option>' +
      '<option value="cub">x\u00b3</option>' +
      '<option value="par4">x\u00b2-4</option>' +
      '<option value="lg">ln x</option>' +
      '<option value="ex">e^x</option>' +
      '<option value="hip">\u221a(x\u00b2-1)</option>' +
      '<option value="libre">escribir mi expresi\u00f3n</option></select></div>' +
      rowText('f', 'expresi\u00f3n', 'sqrt(4-x^2)') +
      '<div class="ap-row">' + mini('a', 'desde x', -6) + mini('b', 'hasta x', 6) + '</div>' +
      '<div class="ap-row">' +
      '<label class="ap-lab"><input type="checkbox" data-role="vd" checked> dominio</label>' +
      '<label class="ap-lab"><input type="checkbox" data-role="vr" checked> recorrido</label>' +
      '<label class="ap-lab"><input type="checkbox" data-role="vg" checked> l\u00edneas gu\u00eda</label>' +
      '</div>');

    /* Al cambiar el catalogo, se escribe la expresion en el campo. */
    get(root, 'c').addEventListener('change', function () {
      var c = val(root, 'c');
      if (c !== 'libre' && CAT[c]) {
        get(root, 'f').value = CAT[c].src;
        get(root, 'f').dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    live(root, out, function () {
      var c = val(root, 'c');
      var src = val(root, 'f');
      var f = compile(src);
      var a = nv(root, 'a'), b = nv(root, 'b');
      if (!(b > a)) throw new Error('el extremo derecho debe ser mayor que el izquierdo.');
      var verD = get(root, 'vd').checked, verR = get(root, 'vr').checked, verG = get(root, 'vg').checked;

      var pts = scan(f, a, b, 2400);

      /* Tramos del dominio: rachas de puntos definidos. */
      var runs = [], cur = null;
      pts.forEach(function (p) {
        if (!isNaN(p.y)) { if (!cur) cur = { a: p.x, b: p.x, min: p.y, max: p.y }; else { cur.b = p.x; cur.min = Math.min(cur.min, p.y); cur.max = Math.max(cur.max, p.y); } }
        else if (cur) { runs.push(cur); cur = null; }
      });
      if (cur) runs.push(cur);

      if (!runs.length) throw new Error('la funci\u00f3n no est\u00e1 definida en ning\u00fan punto del intervalo elegido.');

      /* Ventana vertical ajustada al recorrido observado, con tope. */
      var lo = Math.max(-40, Math.min.apply(null, runs.map(function (r) { return r.min; })));
      var hi = Math.min(40, Math.max.apply(null, runs.map(function (r) { return r.max; })));
      if (hi - lo < 2) { lo -= 1; hi += 1; }
      var w = { xmin: a, xmax: b, ymin: lo - (hi - lo) * 0.12, ymax: hi + (hi - lo) * 0.12 };

      var h = step('Funci\u00f3n: ' + T('f(x)=' + (c !== 'libre' && CAT[c] ? CAT[c].tex : toTex(src))) +
        ' en la ventana ' + T('\\left[' + nt(a) + ',\\ ' + nt(b) + '\\right]'));
      if (c !== 'libre' && CAT[c]) h += step(note(CAT[c].nota));

      h += step(key('Dominio observado: ') + runs.map(function (r) {
        return T('\\left[' + nt(snap(r.a)) + ',\\ ' + nt(snap(r.b)) + '\\right]');
      }).join(' ' + T('\\cup') + ' ') + ' ' + note('(proyecci\u00f3n sobre el eje horizontal, en verde)'));

      h += step(key('Recorrido observado: ') + runs.map(function (r) {
        return T('\\left[' + nt(snap(r.min)) + ',\\ ' + nt(snap(r.max)) + '\\right]');
      }).join(' ' + T('\\cup') + ' ') + ' ' + note('(proyecci\u00f3n sobre el eje vertical, en morado)'));

      if (runs.length > 1) {
        h += step(warnStep('') || '', '');
        h += warnStep('El dominio est\u00e1 ' + key('partido en ' + runs.length + ' tramos') +
          '. Eso ocurre cuando la expresi\u00f3n prohibe una zona intermedia, por un denominador que se anula o por un radicando negativo.');
      }

      /* Elementos graficos */
      var items = [{ type: 'fn', f: f, color: '#2a76dd' }];

      runs.forEach(function (r) {
        if (verD) items.push({ type: 'seg', x1: r.a, y1: 0, x2: r.b, y2: 0, color: '#2a9d8f', width: 10 });
        if (verR) items.push({ type: 'seg', x1: 0, y1: r.min, x2: 0, y2: r.max, color: '#8e44ad', width: 10 });
        if (verG) {
          [[r.a, safe(f, r.a)], [r.b, safe(f, r.b)]].forEach(function (p) {
            if (isNaN(p[1])) return;
            items.push({ type: 'seg', x1: p[0], y1: 0, x2: p[0], y2: p[1], color: '#cbd5e1', width: 2, dash: true, opacity: 1 });
            items.push({ type: 'seg', x1: 0, y1: p[1], x2: p[0], y2: p[1], color: '#cbd5e1', width: 2, dash: true, opacity: 1 });
          });
        }
      });

      /* Extremos del dominio marcados sobre el eje horizontal. */
      var marcas = [];
      runs.forEach(function (r) { marcas.push([r.a, 0], [r.b, 0]); });
      items.push({ type: 'points', pts: marcas, fill: '#2a9d8f' });

      h += plot(items, w, { alt: 'proyecciones del dominio y del recorrido' });

      h += step(note('En verde, la sombra sobre el eje horizontal, que es el dominio. En morado, la sombra sobre el eje vertical, que es el recorrido. Las l\u00edneas grises conectan los extremos de la curva con las dos sombras.'));
      h += step(key('Aviso metodol\u00f3gico: ') + 'el applet explora num\u00e9ricamente dentro de la ventana elegida. Si el recorrido crece sin l\u00edmite, ampl\u00eda la ventana y comprueba que la sombra morada se alarga: eso indica que el recorrido no est\u00e1 acotado.');
      return h;
    });
  };

  FN.simetria = function (root) {
    var out = shell(root, 'Applet \u00b7 Simetr\u00eda par e impar', [
      'Una funci\u00f3n es <b>par</b> si $f(-x)=f(x)$, y entonces es sim\u00e9trica respecto del eje vertical. Es <b>impar</b> si $f(-x)=-f(x)$, y entonces es sim\u00e9trica respecto del origen.',
      'El applet dibuja $f(x)$ en azul y $f(-x)$ a trazos, para que veas si coinciden o si son opuestas.',
      'Ejemplos: <code>1/x</code> es impar; <code>sqrt(x^2-1)</code> es par; <code>x-1</code> no tiene ninguna de las dos simetr\u00edas.',
      'Prueba tambi\u00e9n <code>x^2-6x-7</code>, <code>3/x^2</code> y <code>2x^3-5x</code>. Fija la atenci\u00f3n en los exponentes.'
    ], rowText('f', 'f(x) =', '1/x'));

    live(root, out, function () {
      var src = val(root, 'f'), f = compile(src);
      var s = symmetry(f);
      var h = step('Funci\u00f3n: ' + T('f(x)=' + toTex(src)));
      var tabla = [-3, -2, -1, 1, 2, 3].map(function (x) {
        var y = safe(f, x);
        return '<td>' + (isNaN(y) ? bad('\u2014') : T(nt(y))) + '</td>';
      }).join('');
      h += '<table class="ap-tbl"><tr><th>' + T('x') + '</th><th>-3</th><th>-2</th><th>-1</th><th>1</th><th>2</th><th>3</th></tr>' +
        '<tr><td>' + T('f(x)') + '</td>' + tabla + '</tr></table>';
      h += step(key('Diagn\u00f3stico: ') + (
        s === 'par' ? ok('funci\u00f3n par') + '. Se cumple ' + T('f(-x)=f(x)') + ', simetr\u00eda respecto del eje vertical.'
        : s === 'impar' ? ok('funci\u00f3n impar') + '. Se cumple ' + T('f(-x)=-f(x)') + ', simetr\u00eda respecto del origen.'
        : s === 'nula' ? note('la funci\u00f3n es id\u00e9nticamente nula: cumple las dos condiciones a la vez.')
        : bad('ninguna de las dos') + '. Ni ' + T('f(-x)=f(x)') + ' ni ' + T('f(-x)=-f(x)') + '.'));
      h += step(note('Muchas funciones no son pares ni impares. No es un defecto: la mayor\u00eda no tiene simetr\u00eda.'));
      h += plot([{ type: 'fn', f: f, color: '#2a76dd' },
                 { type: 'fn', f: function (x) { return safe(f, -x); }, color: '#e63946', dash: true }], W0);
      return h;
    });
  };

  /* =================================================================
     7. APPLETS · POLINOMICAS, LINEAL, CUADRATICA, INTERPOLACION
     ================================================================= */

  FN.polinomica = function (root) {
    var out = shell(root, 'Applet \u00b7 Funciones polin\u00f3micas', [
      'Su dominio es siempre $\\mathbb{R}$. El grado determina la forma general de la gr\u00e1fica y el n\u00famero m\u00e1ximo de cortes con el eje horizontal.',
      'Mueve los coeficientes de $f(x)=ax^{3}+bx^{2}+cx+d$. Con $a=0$ obtienes una par\u00e1bola; con $a=b=0$, una recta.',
      'Cuenta los cortes con el eje horizontal: nunca superan el grado. Prueba $a=1$, $b=0$, $c=-3$, $d=0$.',
      'Observa las ramas: en grado impar salen en direcciones opuestas; en grado par, en la misma direcci\u00f3n.'
    ],
      '<div class="ap-row">' + mini('a', 'a', 1) + mini('b', 'b', 0) + mini('c', 'c', -3) + mini('d', 'd', 0) + '</div>');

    live(root, out, function () {
      var a = nv(root, 'a'), b = nv(root, 'b'), c = nv(root, 'c'), d = nv(root, 'd');
      var f = function (x) { return a * x * x * x + b * x * x + c * x + d; };
      var gr = Math.abs(a) > 1e-12 ? 3 : Math.abs(b) > 1e-12 ? 2 : Math.abs(c) > 1e-12 ? 1 : 0;
      var z = zeros(f, -8, 8);
      var h = step('Funci\u00f3n: ' + T('f(x)=' + qt(a) + 'x^{3}+' + qt(b) + 'x^{2}+' + qt(c) + 'x+' + qt(d)));
      h += step(key('Grado: ') + gr + ' \u00b7 ' + key('Dominio: ') + T('\\mathbb{R}'));
      h += step(key('Cortes con el eje horizontal: ') + (z.length
        ? z.map(function (v) { return chip(T(nt(v))); }).join('') : 'ninguno visible') +
        ' ' + note('(como m\u00e1ximo ' + gr + ')'));
      h += step(key('Corte con el eje vertical: ') + chip(T('\\left(0,' + qt(d) + '\\right)')) +
        ' ' + note('siempre es el t\u00e9rmino independiente'));
      h += plot([{ type: 'fn', f: f }], W0);
      return h;
    });
  };

  FN.afin = function (root) {
    var out = shell(root, 'Applet \u00b7 Funci\u00f3n af\u00edn: pendiente y ordenada', [
      'Las polin\u00f3micas de primer grado se llaman <b>afines</b> y son del tipo $f(x)=mx+n$. Su gr\u00e1fica es una recta de pendiente $m$ que pasa por $(0,n)$.',
      'El n\u00famero $n$ es la <b>ordenada en el origen</b>. Si $n=0$ la funci\u00f3n se llama <b>lineal</b> y pasa por el origen. Si $m=0$ se llama <b>constante</b>.',
      'La pendiente es lo que sube o baja $y$ cuando $x$ avanza una unidad. Mueve $m$ y comprueba el tri\u00e1ngulo de la variaci\u00f3n.',
      'Prueba $m=3$, $n=-1$; luego $m=0$, $n=2$; luego $m=-2$, $n=0$.'
    ], range('m', 'pendiente m', -5, 5, 3, 0.25) + range('n', 'ordenada n', -5, 5, -1, 0.5));

    live(root, out, function () {
      var m = nv(root, 'm'), n = nv(root, 'n');
      var f = function (x) { return m * x + n; };
      var tipo = Math.abs(m) < 1e-12 ? 'constante' : Math.abs(n) < 1e-12 ? 'lineal' : 'af\u00edn';
      var h = step('Funci\u00f3n: ' + T('f(x)=' + qt(m) + 'x+' + qt(n)) + ' \u00b7 ' + key('tipo ' + tipo));
      h += step(key('Pendiente: ') + T('m=' + qt(m)) + ' ' + note('(por cada unidad que avanza $x$, la $y$ ' +
        (m > 0 ? 'sube ' : m < 0 ? 'baja ' : 'no cambia') + (m !== 0 ? qt(Math.abs(m)) : '') + ')'));
      h += step(key('Corta el eje vertical en ') + chip(T('\\left(0,' + qt(n) + '\\right)')));
      h += step(key('Corta el eje horizontal en ') + (Math.abs(m) > 1e-12
        ? chip(T('\\left(' + qt(-n / m) + ',0\\right)')) : (Math.abs(n) < 1e-12 ? 'todo el eje' : 'ning\u00fan punto')));
      h += step(m > 0 ? 'Es ' + ok('creciente') : m < 0 ? 'Es ' + bad('decreciente') : 'Es constante');
      h += step('\u00c1ngulo con el eje horizontal: ' + T('\\alpha=\\arctan(' + nt(m) + ')\\approx ' +
        nt(Math.atan(m) * 180 / Math.PI) + '^{\\circ}'));
      h += plot([{ type: 'fn', f: f }, { type: 'points', pts: [[0, n]], labels: true }], W0);
      return h;
    });
  };

  FN.rectados = function (root) {
    var out = shell(root, 'Applet \u00b7 Recta por dos puntos', [
      'Dados dos puntos, la pendiente es $m=\\dfrac{y_{2}-y_{1}}{x_{2}-x_{1}}$, y con ella se obtiene la ecuaci\u00f3n de la recta.',
      'Ejemplos: $(0,-1)$ y $(1,2)$ dan pendiente $3$; $(-1,0)$ y $(0,2)$ dan pendiente $2$.',
      'Haz que los dos puntos tengan la misma abscisa. El applet avisa: la recta ser\u00eda vertical y no es una funci\u00f3n.',
      'Haz que tengan la misma ordenada y obtendr\u00e1s una recta horizontal, de pendiente cero.'
    ],
      '<div class="ap-row">' + mini('x1', 'x\u2081', 0) + mini('y1', 'y\u2081', -1) + mini('x2', 'x\u2082', 1) + mini('y2', 'y\u2082', 2) + '</div>');

    live(root, out, function () {
      var x1 = nv(root, 'x1'), y1 = nv(root, 'y1'), x2 = nv(root, 'x2'), y2 = nv(root, 'y2');
      var h = step('Puntos: ' + T('P_{1}\\left(' + nt(x1) + ',' + nt(y1) + '\\right)') + ' y ' +
        T('P_{2}\\left(' + nt(x2) + ',' + nt(y2) + '\\right)'));
      if (Math.abs(x2 - x1) < 1e-12) {
        return h + warnStep(bad('Recta vertical') + ': ' + T('x=' + nt(x1)) +
          '. No es una funci\u00f3n, porque a ese \u00fanico valor de $x$ le corresponden infinitas $y$.');
      }
      var m = snap((y2 - y1) / (x2 - x1)), n = snap(y1 - m * x1);
      h += step(key('Pendiente: ') + T('m=\\dfrac{' + nt(y2) + '-' + nt(y1) + '}{' + nt(x2) + '-' + nt(x1) + '}=' + qt(m)));
      h += step(key('Ecuaci\u00f3n: ') + T('y=' + qt(m) + 'x+' + qt(n)));
      h += step('Distancia entre los puntos: ' + T('d=\\sqrt{\\left(' + nt(x2 - x1) + '\\right)^{2}+\\left(' +
        nt(y2 - y1) + '\\right)^{2}}=' + nt(Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)))));
      h += plot([{ type: 'fn', f: function (x) { return m * x + n; } },
                 { type: 'points', pts: [[x1, y1], [x2, y2]], labels: true }], W0);
      return h;
    });
  };

  FN.cuadratica = function (root) {
    var out = shell(root, 'Applet \u00b7 Funci\u00f3n cuadr\u00e1tica y v\u00e9rtice', [
      'Las polin\u00f3micas de segundo grado, $f(x)=ax^{2}+bx+c$ con $a\\neq 0$, se llaman <b>cuadr\u00e1ticas</b> y su gr\u00e1fica es una par\u00e1bola.',
      'El v\u00e9rtice est\u00e1 en $x=-\\dfrac{b}{2a}$. Si $a>0$ es un m\u00ednimo; si $a<0$, un m\u00e1ximo. Cuanto mayor es $|a|$, m\u00e1s cerradas son las ramas.',
      'Ejemplo del libro: $f(x)=-x^{2}+4x-1$ tiene v\u00e9rtice en $(2,3)$, que es un m\u00e1ximo.',
      'Mueve $a$ pasando por valores positivos y negativos, y observa c\u00f3mo el v\u00e9rtice cambia de m\u00ednimo a m\u00e1ximo.'
    ],
      '<div class="ap-row">' + mini('a', 'a', -1, 0.5) + mini('b', 'b', 4, 0.5) + mini('c', 'c', -1, 0.5) + '</div>');

    live(root, out, function () {
      var a = nv(root, 'a'), b = nv(root, 'b'), c = nv(root, 'c');
      if (Math.abs(a) < 1e-12) throw new Error('con $a=0$ no es una funci\u00f3n cuadr\u00e1tica, sino af\u00edn.');
      var f = function (x) { return a * x * x + b * x + c; };
      var vx = snap(-b / (2 * a)), vy = snap(f(vx)), D = b * b - 4 * a * c;
      var h = step('Funci\u00f3n: ' + T('f(x)=' + qt(a) + 'x^{2}+' + qt(b) + 'x+' + qt(c)) + ' \u00b7 ' +
        key('Dominio ') + T('\\mathbb{R}'));
      h += step(key('V\u00e9rtice: ') + T('V\\left(-\\dfrac{b}{2a},\\ f\\left(-\\dfrac{b}{2a}\\right)\\right)=\\left(' +
        qt(vx) + ',\\ ' + qt(vy) + '\\right)') + ' \u00b7 ' + (a > 0 ? ok('m\u00ednimo') : bad('m\u00e1ximo')));
      h += step(key('Recorrido: ') + T(a > 0 ? '\\left[' + qt(vy) + ',+\\infty\\right)' : '\\left(-\\infty,' + qt(vy) + '\\right]'));
      h += step(key('Discriminante: ') + T('\\Delta=' + nt(D)) + ' ' + T('\\Rightarrow') + ' ' +
        (D > 1e-9 ? 'dos cortes con el eje horizontal' : Math.abs(D) <= 1e-9 ? 'tangente al eje' : 'ning\u00fan corte'));
      if (D > 1e-9) {
        var r1 = snap((-b - Math.sqrt(D)) / (2 * a)), r2 = snap((-b + Math.sqrt(D)) / (2 * a));
        h += step('Cortes: ' + chip(T(nt(Math.min(r1, r2)))) + chip(T(nt(Math.max(r1, r2)))));
      }
      h += step('Eje de simetr\u00eda: la recta vertical ' + T('x=' + qt(vx)) +
        '. Toda par\u00e1bola es sim\u00e9trica respecto de ese eje.');
      h += plot([{ type: 'fn', f: f }, { type: 'vline', x: vx, color: '#8e44ad' },
                 { type: 'points', pts: [[vx, vy]], labels: true }], W0);
      return h;
    });
  };

  FN.canonica = function (root) {
    var out = shell(root, 'Applet \u00b7 Forma can\u00f3nica de la par\u00e1bola', [
      'Toda par\u00e1bola se puede escribir como $f(x)=a\\left(x-h\\right)^{2}+k$, donde $(h,k)$ es directamente el v\u00e9rtice.',
      'Mueve $h$ y $k$: la forma no cambia, solo se traslada. Mueve $a$: cambia la abertura y la orientaci\u00f3n.',
      'Comprueba la equivalencia con la forma desarrollada que muestra el applet.',
      'Esta escritura anticipa las transformaciones de funciones: $h$ traslada en horizontal y $k$ en vertical.'
    ], range('a', 'a', -3, 3, 1, 0.25) + range('h', 'h', -5, 5, 2, 0.5) + range('k', 'k', -5, 5, -3, 0.5));

    live(root, out, function () {
      var a = nv(root, 'a'), hh = nv(root, 'h'), k = nv(root, 'k');
      if (Math.abs(a) < 1e-12) throw new Error('con $a=0$ no hay par\u00e1bola.');
      var f = function (x) { return a * (x - hh) * (x - hh) + k; };
      var b = snap(-2 * a * hh), c = snap(a * hh * hh + k);
      var h = step(key('Forma can\u00f3nica: ') + T('f(x)=' + qt(a) + '\\left(x-' + qt(hh) + '\\right)^{2}+' + qt(k)));
      h += step(key('Forma desarrollada: ') + T('f(x)=' + qt(a) + 'x^{2}+' + qt(b) + 'x+' + qt(c)));
      h += step(key('V\u00e9rtice: ') + chip(T('\\left(' + qt(hh) + ',\\ ' + qt(k) + '\\right)')) +
        ' ' + note('se lee directamente, sin calcular nada'));
      h += step('Cortes con el eje horizontal: ' + (a * k < 0
        ? chip(T(nt(snap(hh - Math.sqrt(-k / a))))) + chip(T(nt(snap(hh + Math.sqrt(-k / a)))))
        : Math.abs(k) < 1e-12 ? chip(T(qt(hh))) + ' ' + note('(doble)') : bad('ninguno')));
      h += plot([{ type: 'fn', f: f }, { type: 'points', pts: [[hh, k]], labels: true }], W0);
      return h;
    });
  };

  FN.interlineal = function (root) {
    var out = shell(root, 'Applet \u00b7 Interpolaci\u00f3n lineal', [
      'Si conocemos dos puntos de una funci\u00f3n cuya expresi\u00f3n desconocemos, podemos estimar valores intermedios con $f(x)=y_{0}+\\dfrac{y_{1}-y_{0}}{x_{1}-x_{0}}\\left(x-x_{0}\\right)$.',
      'Ejemplo del libro con la poblaci\u00f3n espa\u00f1ola: en 1900 hab\u00eda $18\\,617$ miles de habitantes y en 1920, $21\\,389$. Interpolando, en 1910 habr\u00eda $20\\,003$.',
      'Si el punto pedido cae <b>fuera</b> del intervalo conocido, ya no es interpolaci\u00f3n sino <b>extrapolaci\u00f3n</b>, y el applet lo advierte.',
      'Prueba a estimar $\\sqrt{10}$ a partir de $\\sqrt{9}=3$ y $\\sqrt{16}=4$, y compara con el valor real.'
    ],
      '<div class="ap-row">' + mini('x0', 'x\u2080', 1900) + mini('y0', 'y\u2080', 18617) + '</div>' +
      '<div class="ap-row">' + mini('x1', 'x\u2081', 1920) + mini('y1', 'y\u2081', 21389) + '</div>' +
      '<div class="ap-row">' + mini('x', 'estimar en x', 1910) + '</div>');

    live(root, out, function () {
      var x0 = nv(root, 'x0'), y0 = nv(root, 'y0'), x1 = nv(root, 'x1'), y1 = nv(root, 'y1'), x = nv(root, 'x');
      if (Math.abs(x1 - x0) < 1e-12) throw new Error('los dos valores de $x$ deben ser distintos.');
      var m = (y1 - y0) / (x1 - x0), y = y0 + m * (x - x0);
      var dentro = (x >= Math.min(x0, x1) && x <= Math.max(x0, x1));
      var h = step(key('Recta de interpolaci\u00f3n: ') +
        T('f(x)=' + nt(y0) + '+\\dfrac{' + nt(y1) + '-' + nt(y0) + '}{' + nt(x1) + '-' + nt(x0) + '}\\left(x-' + nt(x0) + '\\right)'));
      h += step('Pendiente: ' + T('m=' + nt(m)) + ' ' + note('(variaci\u00f3n media por unidad)'));
      h += step(key('Estimaci\u00f3n: ') + T('f(' + nt(x) + ')=' + nt(y)));
      h += step(dentro ? ok('Es interpolaci\u00f3n') + ': el punto est\u00e1 dentro del intervalo conocido.'
        : warnStep('') && bad('Es extrapolaci\u00f3n') + ': el punto queda fuera del intervalo, as\u00ed que la estimaci\u00f3n es menos fiable.');
      h += step(note('Cuanto m\u00e1s pr\u00f3ximos est\u00e9n los dos puntos conocidos, menor es el error de suponer que la funci\u00f3n es una recta.'));
      var w = { xmin: Math.min(x0, x1, x) - Math.abs(x1 - x0) * 0.3, xmax: Math.max(x0, x1, x) + Math.abs(x1 - x0) * 0.3,
                ymin: Math.min(y0, y1, y) - Math.abs(y1 - y0) * 0.3, ymax: Math.max(y0, y1, y) + Math.abs(y1 - y0) * 0.3 };
      h += plot([{ type: 'fn', f: function (t) { return y0 + m * (t - x0); } },
                 { type: 'points', pts: [[x0, y0], [x1, y1]], fill: '#2a76dd' },
                 { type: 'points', pts: [[x, y]], labels: true }], w);
      return h;
    });
  };

  FN.intercuadratica = function (root) {
    var out = shell(root, 'Applet \u00b7 Interpolaci\u00f3n cuadr\u00e1tica', [
      'Con <b>tres</b> puntos no alineados se puede ajustar una par\u00e1bola $f(x)=ax^{2}+bx+c$, imponiendo que pase por los tres.',
      'Eso obliga a resolver un sistema de tres ecuaciones con tres inc\u00f3gnitas, justo lo que aprendiste con el m\u00e9todo de Gauss.',
      'Prueba con beneficios de una empresa: $(2017,12315)$, $(2019,16240)$, $(2021,23230)$, y estima el a\u00f1o 2018.',
      'Compara el resultado con la interpolaci\u00f3n lineal entre los dos puntos m\u00e1s cercanos: casi nunca coinciden.'
    ],
      '<div class="ap-row">' + mini('x0', 'x\u2080', 2017) + mini('y0', 'y\u2080', 12315) + '</div>' +
      '<div class="ap-row">' + mini('x1', 'x\u2081', 2019) + mini('y1', 'y\u2081', 16240) + '</div>' +
      '<div class="ap-row">' + mini('x2', 'x\u2082', 2021) + mini('y2', 'y\u2082', 23230) + '</div>' +
      '<div class="ap-row">' + mini('x', 'estimar en x', 2018) + '</div>');

    live(root, out, function () {
      var X = [nv(root, 'x0'), nv(root, 'x1'), nv(root, 'x2')];
      var Y = [nv(root, 'y0'), nv(root, 'y1'), nv(root, 'y2')];
      var x = nv(root, 'x');
      var d = (X[0] - X[1]) * (X[0] - X[2]) * (X[1] - X[2]);
      if (Math.abs(d) < 1e-9) throw new Error('los tres valores de $x$ deben ser distintos.');
      /* Lagrange desarrollado */
      function L(i) {
        var j = (i + 1) % 3, k = (i + 2) % 3;
        return Y[i] / ((X[i] - X[j]) * (X[i] - X[k]));
      }
      var a = L(0) + L(1) + L(2);
      var b = -(L(0) * (X[1] + X[2]) + L(1) * (X[2] + X[0]) + L(2) * (X[0] + X[1]));
      var c = L(0) * X[1] * X[2] + L(1) * X[2] * X[0] + L(2) * X[0] * X[1];
      var f = function (t) { return a * t * t + b * t + c; };
      var h = step(key('Sistema que hay que resolver: ') + TD('\\left\\{\\begin{array}{l}' +
        X.map(function (xi, i) {
          return nt(Y[i]) + '=a\\cdot ' + nt(xi) + '^{2}+b\\cdot ' + nt(xi) + '+c';
        }).join('\\\\') + '\\end{array}\\right.'));
      h += step(key('Soluci\u00f3n: ') + T('a=' + nt(a)) + ', ' + T('b=' + nt(b)) + ', ' + T('c=' + nt(c)));
      h += step(key('Par\u00e1bola de interpolaci\u00f3n: ') + T('f(x)=' + nt(a) + 'x^{2}+' + nt(b) + 'x+' + nt(c)));
      h += step(key('Estimaci\u00f3n: ') + T('f(' + nt(x) + ')=' + nt(f(x))));
      h += step('Comprobaci\u00f3n en los tres puntos dados: ' + X.map(function (xi, i) {
        return T(nt(f(xi))) + ' frente a ' + T(nt(Y[i]));
      }).join(' \u00b7 ') + ' ' + ok('(coinciden)'));
      var xs = X.concat([x]), ys = Y.concat([f(x)]);
      var w = { xmin: Math.min.apply(null, xs) - 1, xmax: Math.max.apply(null, xs) + 1,
                ymin: Math.min.apply(null, ys) * 0.9, ymax: Math.max.apply(null, ys) * 1.1 };
      h += plot([{ type: 'fn', f: f }, { type: 'points', pts: X.map(function (xi, i) { return [xi, Y[i]]; }), fill: '#2a76dd' },
                 { type: 'points', pts: [[x, f(x)]], labels: true }], w);
      return h;
    });
  };

  /* =================================================================
     8. APPLETS · RACIONALES, RADICALES, INVERSA, TROZOS, ABSOLUTO
     ================================================================= */

  FN.racional = function (root) {
    var out = shell(root, 'Applet \u00b7 Funciones racionales y as\u00edntotas', [
      'Una funci\u00f3n racional es un cociente de polinomios. El caso b\u00e1sico es la <b>proporcionalidad inversa</b>, $f(x)=\\dfrac{k}{x}$, cuya gr\u00e1fica es una hip\u00e9rbola.',
      'Su dominio es $\\mathbb{R}-\\{0\\}$: en $x=0$ hay una <b>as\u00edntota vertical</b>. Y al crecer $|x|$ la funci\u00f3n se acerca a $y=0$: hay una <b>as\u00edntota horizontal</b>.',
      'Con $k>0$ la gr\u00e1fica ocupa el primer y el tercer cuadrante; con $k<0$, el segundo y el cuarto. Adem\u00e1s es una funci\u00f3n impar.',
      'Con los deslizadores $p$ y $q$ trabajas $f(x)=\\dfrac{k}{x-p}+q$: la as\u00edntota vertical pasa a $x=p$ y la horizontal a $y=q$.'
    ], range('k', 'k', -6, 6, 2, 0.5) + range('p', 'p', -5, 5, 0, 0.5) + range('q', 'q', -5, 5, 0, 0.5));

    live(root, out, function () {
      var k = nv(root, 'k'), p = nv(root, 'p'), q = nv(root, 'q');
      if (Math.abs(k) < 1e-12) throw new Error('con $k=0$ la funci\u00f3n es constante y no hay hip\u00e9rbola.');
      var f = function (x) { return Math.abs(x - p) < 1e-12 ? NaN : k / (x - p) + q; };
      var h = step('Funci\u00f3n: ' + T('f(x)=\\dfrac{' + qt(k) + '}{x-' + qt(p) + '}+' + qt(q)));
      h += step(key('Dominio: ') + T('\\mathbb{R}-\\left\\{' + qt(p) + '\\right\\}'));
      h += step(key('As\u00edntota vertical: ') + T('x=' + qt(p)) + ' \u00b7 ' +
        key('As\u00edntota horizontal: ') + T('y=' + qt(q)));
      h += step(key('Recorrido: ') + T('\\mathbb{R}-\\left\\{' + qt(q) + '\\right\\}'));
      h += step('Monoton\u00eda: ' + (k > 0 ? bad('decreciente') + ' en cada rama' : ok('creciente') + ' en cada rama') +
        '. ' + note('Nunca es creciente o decreciente en todo el dominio, porque el dominio est\u00e1 partido.'));
      if (Math.abs(p) < 1e-12 && Math.abs(q) < 1e-12) {
        h += step('Con ' + T('p=q=0') + ' la funci\u00f3n es ' + ok('impar') + ', sim\u00e9trica respecto del origen, y no corta los ejes.');
      }
      h += plot([{ type: 'fn', f: f }, { type: 'vline', x: p }, { type: 'hline', y: q }], W0);
      return h;
    });
  };

  FN.radical = function (root) {
    var out = shell(root, 'Applet \u00b7 Funciones con radicales', [
      'En $f(x)=\\sqrt[n]{g(x)}$ el dominio depende de la paridad del \u00edndice: si $n$ es <b>par</b>, hay que exigir $g(x)\\geq 0$; si es <b>impar</b>, el dominio es el de $g$.',
      'Ejemplos con \u00edndice par: <code>x-1</code> da dominio $[1,+\\infty)$; <code>x^2-1</code> da $(-\\infty,-1]\\cup[1,+\\infty)$; <code>x^2+1</code> da todo $\\mathbb{R}$.',
      'Cambia el \u00edndice a impar con el mismo radicando y observa que el dominio se ensancha a todo $\\mathbb{R}$.',
      'Recuerda: con \u00edndice par solo se toma la ra\u00edz <b>positiva</b>. Si se tomaran las dos, cada $x$ tendr\u00eda dos im\u00e1genes y no ser\u00eda una funci\u00f3n.'
    ], rowText('g', 'radicando g(x) =', 'x^2-1') +
       '<div class="ap-row"><label class="ap-lab">\u00edndice</label><select class="ap-sel" data-role="n">' +
       '<option value="2">2, par</option><option value="3">3, impar</option></select></div>');

    live(root, out, function () {
      var src = val(root, 'g'), g = compile(src), n = parseInt(val(root, 'n'), 10);
      var f = n === 2
        ? function (x) { var v = safe(g, x); return (isNaN(v) || v < 0) ? NaN : Math.sqrt(v); }
        : function (x) { var v = safe(g, x); return isNaN(v) ? NaN : Math.cbrt(v); };
      var w = { xmin: -8, xmax: 8, ymin: -4, ymax: 6 };
      var pts = scan(f, w.xmin, w.xmax, 2000), gp = gaps(pts);
      var h = step('Funci\u00f3n: ' + T('f(x)=' + (n === 2 ? '\\sqrt{' : '\\sqrt[3]{') + toTex(src) + '}'));
      h += step(key('Condici\u00f3n: ') + (n === 2
        ? 'el \u00edndice es par, luego hay que resolver ' + T(toTex(src) + '\\geq 0')
        : 'el \u00edndice es impar, luego no hay ninguna restricci\u00f3n nueva'));
      h += step(key('Zonas sin definir detectadas: ') + (gp.length
        ? gp.map(function (r) { return T('\\left(' + nt(snap(r.a)) + ',\\ ' + nt(snap(r.b)) + '\\right)'); }).join(' \u00b7 ')
        : ok('ninguna, el dominio es todo el intervalo explorado')));
      var r = rangeOf(pts);
      if (r) h += step(key('Recorrido observado: ') + T('\\left[' + nt(snap(r.min)) + ',\\ ' + nt(snap(r.max)) + '\\right]'));
      h += plot([{ type: 'fn', f: f, color: '#2a9d8f' },
                 { type: 'fn', f: g, color: '#cbd5e1', dash: true }], w);
      h += step(note('En gris discontinuo, el radicando. Donde queda por debajo del eje y el \u00edndice es par, la funci\u00f3n desaparece.'));
      return h;
    });
  };

  FN.inversa = function (root) {
    var out = shell(root, 'Applet \u00b7 Funci\u00f3n inversa', [
      'La inversa $f^{-1}$ deshace lo que hace $f$: si $f(a)=b$, entonces $f^{-1}(b)=a$.',
      'Se calcula escribiendo $y=f(x)$, intercambiando $x$ por $y$ y despejando. Las gr\u00e1ficas de $f$ y $f^{-1}$ son sim\u00e9tricas respecto de la recta $y=x$.',
      'Casos preparados: $3x+9$, cuya inversa es $\\tfrac{1}{3}x-3$; $\\sqrt{x+2}$, cuya inversa es $x^{2}-2$; $\\dfrac{5x}{2x-1}$, cuya inversa es $\\dfrac{x}{2x-5}$.',
      'Detalle esencial: el dominio de $f^{-1}$ es el recorrido de $f$. Compru\u00e9balo con la ra\u00edz cuadrada.'
    ],
      '<div class="ap-row"><label class="ap-lab">Funci\u00f3n</label><select class="ap-sel" data-role="c">' +
      '<option value="lin">f(x) = 3x + 9</option>' +
      '<option value="rai">f(x) = \u221a(x+2)</option>' +
      '<option value="rac">f(x) = 5x / (2x-1)</option>' +
      '<option value="cua">f(x) = x^2, con x \u2265 0</option></select></div>');

    live(root, out, function () {
      var c = val(root, 'c'), f, fi, tf, ti, pasos, dom;
      if (c === 'lin') {
        f = function (x) { return 3 * x + 9; };
        fi = function (x) { return x / 3 - 3; };
        tf = '3x+9'; ti = '\\dfrac{1}{3}x-3';
        pasos = ['y=3x+9', 'x=3y+9', 'y=\\dfrac{x-9}{3}=\\dfrac{1}{3}x-3'];
        dom = 'Dominio y recorrido de las dos: ' + T('\\mathbb{R}');
      } else if (c === 'rai') {
        f = function (x) { return x < -2 ? NaN : Math.sqrt(x + 2); };
        fi = function (x) { return x < 0 ? NaN : x * x - 2; };
        tf = '\\sqrt{x+2}'; ti = 'x^{2}-2';
        pasos = ['y=\\sqrt{x+2}', 'x=\\sqrt{y+2}', 'x^{2}=y+2', 'y=x^{2}-2'];
        dom = T('\\text{Dom}(f)=\\left[-2,+\\infty\\right)') + ' y ' + T('\\text{Im}(f)=\\left[0,+\\infty\\right)') +
          ', que es exactamente el dominio de la inversa.';
      } else if (c === 'rac') {
        f = function (x) { return Math.abs(2 * x - 1) < 1e-12 ? NaN : 5 * x / (2 * x - 1); };
        fi = function (x) { return Math.abs(2 * x - 5) < 1e-12 ? NaN : x / (2 * x - 5); };
        tf = '\\dfrac{5x}{2x-1}'; ti = '\\dfrac{x}{2x-5}';
        pasos = ['y=\\dfrac{5x}{2x-1}', 'x=\\dfrac{5y}{2y-1}', 'x\\left(2y-1\\right)=5y', 'y\\left(2x-5\\right)=x', 'y=\\dfrac{x}{2x-5}'];
        dom = T('\\text{Dom}(f)=\\mathbb{R}-\\left\\{\\tfrac{1}{2}\\right\\}') + ' y ' +
          T('\\text{Dom}(f^{-1})=\\mathbb{R}-\\left\\{\\tfrac{5}{2}\\right\\}');
      } else {
        f = function (x) { return x < 0 ? NaN : x * x; };
        fi = function (x) { return x < 0 ? NaN : Math.sqrt(x); };
        tf = 'x^{2}'; ti = '\\sqrt{x}';
        pasos = ['y=x^{2}', 'x=y^{2}', 'y=\\sqrt{x}'];
        dom = 'Sin la restricci\u00f3n ' + T('x\\geq 0') + ', la funci\u00f3n ' + T('x^{2}') +
          ' no ser\u00eda inyectiva y no tendr\u00eda inversa.';
      }
      var h = step('Funci\u00f3n: ' + T('f(x)=' + tf));
      h += step(key('Proceso: ') + pasos.map(function (p) { return T(p); }).join(' ' + T('\\longrightarrow') + ' '));
      h += step(key('Inversa: ') + T('f^{-1}(x)=' + ti));
      h += step(dom);
      h += step('Comprobaci\u00f3n en un punto: ' + T('f(2)=' + nt(safe(f, 2))) + ' y ' +
        T('f^{-1}\\left(' + nt(safe(f, 2)) + '\\right)=' + nt(safe(fi, safe(f, 2)))) + ' ' + ok('(volvemos al 2)'));
      h += plot([{ type: 'fn', f: f, color: '#2a76dd' }, { type: 'fn', f: fi, color: '#2a9d8f' },
                 { type: 'fn', f: function (x) { return x; }, color: '#cbd5e1', dash: true }],
        { xmin: -6, xmax: 8, ymin: -6, ymax: 8 });
      h += step(note('En azul $f$, en verde su inversa y en gris la recta $y=x$, que act\u00faa como espejo.'));
      return h;
    });
  };

  FN.trozos = function (root) {
    var out = shell(root, 'Applet \u00b7 Funciones definidas a trozos', [
      'Muchas situaciones reales necesitan varias expresiones seg\u00fan el intervalo en que se encuentre $x$: tarifas, impuestos, portes.',
      'Define tres tramos y los dos puntos de corte. El applet eval\u00faa cada tramo y comprueba si la funci\u00f3n <b>encaja</b> en las fronteras.',
      'Ejemplo del libro: $x^{2}$ si $x\\leq 1$, $0{,}5x$ si $1<x\\leq 4$, y $\\log_{2}x$ si $x>4$. Prueba <code>x^2</code>, <code>0.5x</code>, <code>log(x)/log(2)</code>.',
      'Otro: $2$ si $x<-2$, <code>x^2-7</code> si $-2\\leq x\\leq 0$, y <code>-7-x</code> si $x>0$.'
    ],
      rowText('f1', 'tramo 1', 'x^2') +
      '<div class="ap-row">' + mini('c1', 'hasta x =', 1, 0.5) + '</div>' +
      rowText('f2', 'tramo 2', '0.5x') +
      '<div class="ap-row">' + mini('c2', 'hasta x =', 4, 0.5) + '</div>' +
      rowText('f3', 'tramo 3', 'log(x)/log(2)'));

    live(root, out, function () {
      var f1 = compile(val(root, 'f1')), f2 = compile(val(root, 'f2')), f3 = compile(val(root, 'f3'));
      var c1 = nv(root, 'c1'), c2 = nv(root, 'c2');
      if (!(c2 > c1)) throw new Error('el segundo punto de corte debe ser mayor que el primero.');
      var F = function (x) { return x <= c1 ? safe(f1, x) : x <= c2 ? safe(f2, x) : safe(f3, x); };
      var h = step(TD('f(x)=\\left\\{\\begin{array}{ll}' +
        toTex(val(root, 'f1')) + ' & \\text{si } x\\leq ' + nt(c1) + '\\\\' +
        toTex(val(root, 'f2')) + ' & \\text{si } ' + nt(c1) + '<x\\leq ' + nt(c2) + '\\\\' +
        toTex(val(root, 'f3')) + ' & \\text{si } x>' + nt(c2) + '\\end{array}\\right.'));
      [[c1, f1, f2], [c2, f2, f3]].forEach(function (p) {
        var izq = safe(p[1], p[0]), der = safe(p[2], p[0]);
        h += step('En la frontera ' + T('x=' + nt(p[0])) + ': el tramo izquierdo vale ' + T(nt(izq)) +
          ' y el derecho vale ' + T(nt(der)) + ' ' + T('\\Rightarrow') + ' ' +
          (Math.abs(izq - der) < 1e-6 ? ok('encajan, la gr\u00e1fica no salta') : bad('hay un salto')));
      });
      var xs = [c1 - 1, c1, (c1 + c2) / 2, c2, c2 + 1];
      h += '<table class="ap-tbl"><tr><th>' + T('x') + '</th>' + xs.map(function (x) { return '<th>' + nt(x) + '</th>'; }).join('') + '</tr>' +
        '<tr><td>' + T('f(x)') + '</td>' + xs.map(function (x) {
          var y = F(x); return '<td>' + (isNaN(y) ? bad('\u2014') : nt(y)) + '</td>';
        }).join('') + '</tr></table>';
      h += plot([{ type: 'fn', f: F }, { type: 'vline', x: c1, color: '#cbd5e1' }, { type: 'vline', x: c2, color: '#cbd5e1' }],
        { xmin: -6, xmax: 10, ymin: -6, ymax: 8 });
      return h;
    });
  };

  FN.absoluto = function (root) {
    var out = shell(root, 'Applet \u00b7 Funci\u00f3n valor absoluto', [
      'El valor absoluto es una funci\u00f3n a trozos: $|x|=x$ si $x\\geq 0$ y $|x|=-x$ si $x<0$. Su gr\u00e1fica son dos semirrectas que se juntan en el origen.',
      'Compara dos transformaciones distintas. $|f(x)|$ refleja hacia arriba la parte negativa. $f(|x|)$ copia la parte derecha hacia la izquierda.',
      'Prueba con <code>x-2</code>, <code>x^2-4</code> y <code>x^3</code>. Con la c\u00fabica la diferencia entre las dos transformaciones es espectacular.',
      'Conclusi\u00f3n: $|f(x)|$ nunca es negativa, y $f(|x|)$ siempre es una funci\u00f3n par.'
    ], rowText('f', 'f(x) =', 'x^2-4'));

    live(root, out, function () {
      var src = val(root, 'f'), f = compile(src);
      var g1 = function (x) { var v = safe(f, x); return isNaN(v) ? NaN : Math.abs(v); };
      var g2 = function (x) { return safe(f, Math.abs(x)); };
      var h = step('Funci\u00f3n base: ' + T('f(x)=' + toTex(src)));
      h += step(key('En azul ') + T('f(x)') + ', ' + key('en rojo ') + T('\\left|f(x)\\right|') + ', ' +
        key('en verde ') + T('f\\left(|x|\\right)'));
      var tabla = [-3, -1, 1, 3].map(function (x) {
        return '<tr><td>' + nt(x) + '</td><td>' + nt(safe(f, x)) + '</td><td>' + nt(g1(x)) + '</td><td>' + nt(g2(x)) + '</td></tr>';
      }).join('');
      h += '<table class="ap-tbl"><tr><th>' + T('x') + '</th><th>' + T('f(x)') + '</th><th>' +
        T('|f(x)|') + '</th><th>' + T('f(|x|)') + '</th></tr>' + tabla + '</table>';
      h += step(T('\\left|f(x)\\right|') + ' se obtiene reflejando respecto del eje horizontal la parte de la gr\u00e1fica que estaba por debajo.');
      h += step(T('f\\left(|x|\\right)') + ' se obtiene borrando la parte izquierda y sustituy\u00e9ndola por el reflejo de la derecha. Por eso siempre resulta ' + ok('par') + '.');
      h += plot([{ type: 'fn', f: f, color: '#2a76dd', dash: true },
                 { type: 'fn', f: g1, color: '#e63946' },
                 { type: 'fn', f: g2, color: '#2a9d8f' }], W0);
      return h;
    });
  };

  FN.parteentera = function (root) {
    var out = shell(root, 'Applet \u00b7 Funci\u00f3n parte entera', [
      'La parte entera asigna a cada n\u00famero el mayor entero menor o igual que \u00e9l. Es una funci\u00f3n a trozos con infinitos tramos constantes.',
      'Aparece en tarifas por tramos. Ejemplo del libro: un supermercado da un vale de $5$ euros por cada $40$ de compra, lo que se modela con $f(x)=5\\left[\\dfrac{x}{40}\\right]$.',
      'Cambia el vale y el tramo y comprueba cu\u00e1nto recibe un cliente seg\u00fan su compra.',
      'La parte decimal se obtiene como $x-[x]$, y es una funci\u00f3n peri\u00f3dica de periodo $1$.'
    ],
      '<div class="ap-row">' + mini('v', 'vale', 5) + mini('t', 'por cada', 40) + mini('x', 'compra', 95) + '</div>');

    live(root, out, function () {
      var v = nv(root, 'v'), t = nv(root, 't'), x = nv(root, 'x');
      if (!(t > 0)) throw new Error('el tramo debe ser positivo.');
      var f = function (u) { return v * Math.floor(u / t); };
      var h = step('Modelo: ' + T('f(x)=' + nt(v) + '\\left[\\dfrac{x}{' + nt(t) + '}\\right]'));
      h += step('Con una compra de ' + T(nt(x)) + ': ' + T('\\left[\\dfrac{' + nt(x) + '}{' + nt(t) + '}\\right]=' +
        nt(Math.floor(x / t))) + ', luego recibe ' + chip(T(nt(f(x)))));
      h += step(note('Fijate en el salto: hasta ' + T(nt(Math.ceil(x / t) * t)) +
        ' no aumenta el vale. Comprar un euro m\u00e1s puede no cambiar nada, o cambiarlo todo.'));
      h += plot([{ type: 'fn', f: f, color: '#8e44ad' }],
        { xmin: 0, xmax: Math.max(4 * t, x * 1.3), ymin: -v, ymax: f(Math.max(4 * t, x * 1.3)) + 2 * v });
      return h;
    });
  };

  /* =================================================================
     9. APPLETS · OPERACIONES, COMPOSICION, TRANSFORMACIONES
     ================================================================= */

  FN.operaciones = function (root) {
    var out = shell(root, 'Applet \u00b7 Operaciones con funciones', [
      'Se pueden sumar, restar, multiplicar y dividir funciones punto a punto. El dominio del resultado es la <b>intersecci\u00f3n</b> de los dominios.',
      'En el cociente hay una condici\u00f3n extra: adem\u00e1s hay que quitar los puntos donde el divisor se anula.',
      'Ejemplo del libro: $f(x)=x^{2}-2x$ y $g(x)=\\dfrac{3}{x}$. Comprueba que $(f\\cdot g)(x)=3x-6$ y que $(f\\cdot g)(2)=0$.',
      'Prueba tambi\u00e9n <code>sqrt(x)</code> con <code>x/(x+1)</code> y busca los puntos problem\u00e1ticos.'
    ], rowText('f', 'f(x) =', 'x^2-2x') + rowText('g', 'g(x) =', '3/x') +
       '<div class="ap-row">' + mini('x0', 'evaluar en x', 2, 0.5) +
       '<label class="ap-lab">operaci\u00f3n</label><select class="ap-sel" data-role="op">' +
       '<option value="+">f + g</option><option value="-">f - g</option>' +
       '<option value="*">f \u00b7 g</option><option value="/">f / g</option></select></div>');

    live(root, out, function () {
      var f = compile(val(root, 'f')), g = compile(val(root, 'g')), op = val(root, 'op'), x0 = nv(root, 'x0');
      var H = function (x) {
        var a = safe(f, x), b = safe(g, x);
        if (isNaN(a) || isNaN(b)) return NaN;
        return op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b
          : (Math.abs(b) < 1e-12 ? NaN : a / b);
      };
      var simb = op === '+' ? '+' : op === '-' ? '-' : op === '*' ? '\\cdot' : '/';
      var h = step('Funciones: ' + T('f(x)=' + toTex(val(root, 'f'))) + ' y ' + T('g(x)=' + toTex(val(root, 'g'))));
      h += step(key('Operaci\u00f3n: ') + T('\\left(f' + simb + 'g\\right)(x)=f(x)' + simb + 'g(x)'));
      var a0 = safe(f, x0), b0 = safe(g, x0), y0 = H(x0);
      h += step('En ' + T('x=' + nt(x0)) + ': ' + T('f=' + nt(a0)) + ', ' + T('g=' + nt(b0)) + ' ' +
        T('\\Rightarrow') + ' ' + (isNaN(y0) ? bad('no existe') : chip(T(nt(y0)))));
      h += step(key('Dominio del resultado: ') + T('\\text{Dom}(f)\\cap\\text{Dom}(g)') +
        (op === '/' ? ', quitando adem\u00e1s los puntos donde ' + T('g(x)=0') : ''));
      if (op === '/') {
        var zg = zeros(g, -8, 8);
        h += step('Ceros de ' + T('g') + ' detectados: ' + (zg.length
          ? zg.map(function (v) { return chip(T(nt(v)), true); }).join('') : 'ninguno en la ventana'));
      }
      h += plot([{ type: 'fn', f: f, color: '#cbd5e1', dash: true },
                 { type: 'fn', f: g, color: '#94a3b8', dash: true },
                 { type: 'fn', f: H, color: '#2a76dd' },
                 isNaN(y0) ? null : { type: 'points', pts: [[x0, y0]], labels: true }], W0);
      h += step(note('En gris, las dos funciones de partida; en azul, el resultado de la operaci\u00f3n.'));
      return h;
    });
  };

  FN.composicion = function (root) {
    var out = shell(root, 'Applet \u00b7 Composici\u00f3n de funciones', [
      'Componer es aplicar una funci\u00f3n al resultado de otra: $\\left(g\\circ f\\right)(x)=g\\left(f(x)\\right)$. Primero act\u00faa $f$ y despu\u00e9s $g$.',
      'El orden importa, y casi nunca coinciden las dos composiciones. Compru\u00e9balo con <code>x+1</code> y <code>x^2</code>.',
      'Prueba $f(x)=$<code>x-3</code> con $g(x)=$<code>sqrt(x)</code>. La composici\u00f3n $g\\circ f$ solo existe donde $f(x)\\geq 0$.',
      'Un caso especial: si $g$ es la inversa de $f$, entonces $\\left(g\\circ f\\right)(x)=x$. Prueba <code>3x+9</code> con <code>x/3-3</code>.'
    ], rowText('f', 'f(x) =', 'x-3') + rowText('g', 'g(x) =', 'sqrt(x)') +
       '<div class="ap-row">' + mini('x0', 'seguir el valor x', 7, 0.5) + '</div>');

    live(root, out, function () {
      var f = compile(val(root, 'f')), g = compile(val(root, 'g')), x0 = nv(root, 'x0');
      var gf = function (x) { var v = safe(f, x); return isNaN(v) ? NaN : safe(g, v); };
      var fg = function (x) { var v = safe(g, x); return isNaN(v) ? NaN : safe(f, v); };
      var a = safe(f, x0), b = isNaN(a) ? NaN : safe(g, a);
      var h = step('Funciones: ' + T('f(x)=' + toTex(val(root, 'f'))) + ' y ' + T('g(x)=' + toTex(val(root, 'g'))));
      h += step(key('Recorrido del valor: ') + T(nt(x0)) + ' ' + T('\\xrightarrow{\\ f\\ }') + ' ' +
        (isNaN(a) ? bad('no existe') : T(nt(a))) + ' ' + T('\\xrightarrow{\\ g\\ }') + ' ' +
        (isNaN(b) ? bad('no existe') : chip(T(nt(b)))));
      h += step(key('Condici\u00f3n de existencia: ') + 'para que exista ' + T('\\left(g\\circ f\\right)(x)') +
        ', el valor ' + T('f(x)') + ' debe pertenecer al dominio de ' + T('g') + '.');
      var c1 = gf(2), c2 = fg(2);
      h += step('Comparaci\u00f3n del orden en ' + T('x=2') + ': ' + T('\\left(g\\circ f\\right)(2)=' + nt(c1)) +
        ' frente a ' + T('\\left(f\\circ g\\right)(2)=' + nt(c2)) + ' ' +
        (Math.abs(c1 - c2) < 1e-9 ? note('(coinciden en este punto, pero no tiene por qu\u00e9 ocurrir siempre)')
                                  : ok('(distintas: el orden importa)')));
      h += plot([{ type: 'fn', f: f, color: '#cbd5e1', dash: true },
                 { type: 'fn', f: g, color: '#94a3b8', dash: true },
                 { type: 'fn', f: gf, color: '#2a76dd' },
                 { type: 'fn', f: fg, color: '#e63946' }], W0);
      h += step(note('En azul ' + T('g\\circ f') + ' y en rojo ' + T('f\\circ g') + '. En gris, las funciones originales.'));
      return h;
    });
  };

  FN.transformaciones = function (root) {
    var out = shell(root, 'Applet \u00b7 Transformaciones elementales', [
      'Conocida la gr\u00e1fica de $f$, se obtienen otras sin calcular tablas: $f(x)+k$ traslada en vertical, $f(x-h)$ traslada en horizontal, $-f(x)$ refleja respecto del eje horizontal y $f(-x)$ respecto del vertical.',
      'Cuidado con el signo horizontal: $f(x-h)$ con $h>0$ traslada hacia la <b>derecha</b>, aunque el signo sea menos. Es el error m\u00e1s repetido del tema.',
      'El factor $a$ multiplica la altura: con $|a|>1$ estira, con $0<|a|<1$ achata, y con $a<0$ refleja.',
      'Ejemplo del libro: a partir de $f(x)=x^{2}-2x+1$ obt\u00e9n $x^{2}-2x+3$, $x^{2}-2x-2$ y $\\left(x-1\\right)^{2}-2\\left(x-1\\right)+1$.'
    ], rowText('f', 'f(x) =', 'x^2') +
       range('a', 'factor a', -3, 3, 1, 0.25) +
       range('h', 'traslaci\u00f3n h', -5, 5, 0, 0.5) +
       range('k', 'traslaci\u00f3n k', -5, 5, 0, 0.5) +
       '<div class="ap-row"><label class="ap-lab">reflejar x</label><select class="ap-sel" data-role="rx">' +
       '<option value="1">no</option><option value="-1">s\u00ed, f(-x)</option></select></div>');

    live(root, out, function () {
      var f = compile(val(root, 'f')), a = nv(root, 'a'), hh = nv(root, 'h'), k = nv(root, 'k');
      var rx = parseFloat(val(root, 'rx'));
      var G = function (x) { var v = safe(f, rx * (x - hh)); return isNaN(v) ? NaN : a * v + k; };
      var h = step(key('Base: ') + T('f(x)=' + toTex(val(root, 'f'))));
      h += step(key('Transformada: ') + T('g(x)=' + qt(a) + '\\,f\\left(' + (rx < 0 ? '-' : '') +
        '\\left(x-' + qt(hh) + '\\right)\\right)+' + qt(k)));
      var desc = [];
      if (Math.abs(hh) > 1e-9) desc.push('traslaci\u00f3n horizontal de ' + nt(Math.abs(hh)) + ' unidades hacia la ' + (hh > 0 ? 'derecha' : 'izquierda'));
      if (Math.abs(k) > 1e-9) desc.push('traslaci\u00f3n vertical de ' + nt(Math.abs(k)) + ' unidades hacia ' + (k > 0 ? 'arriba' : 'abajo'));
      if (Math.abs(a - 1) > 1e-9) desc.push((a < 0 ? 'reflexi\u00f3n respecto del eje horizontal y ' : '') +
        (Math.abs(a) > 1 ? 'estiramiento' : 'achatamiento') + ' vertical de factor ' + nt(Math.abs(a)));
      if (rx < 0) desc.push('reflexi\u00f3n respecto del eje vertical');
      h += step(key('Lectura: ') + (desc.length ? desc.join('; ') + '.' : 'ninguna transformaci\u00f3n, ' + T('g=f') + '.'));
      h += step('Control en un punto: ' + T('f(1)=' + nt(safe(f, 1))) + ' y ' + T('g(' + nt(1 + hh) + ')=' + nt(G(1 + hh))));
      h += plot([{ type: 'fn', f: f, color: '#cbd5e1', dash: true }, { type: 'fn', f: G, color: '#2a76dd' }], W0);
      h += step(note('En gris discontinuo la funci\u00f3n original, en azul la transformada.'));
      return h;
    });
  };

  FN.diagnostico = function (root) {
    var out = shell(root, 'Applet \u00b7 Diagn\u00f3stico del m\u00f3dulo', [
      'Applet de servicio: comprueba KaTeX, el compilador de expresiones y el dibujo.',
      'Escribe cualquier expresi\u00f3n para ver c\u00f3mo la interpreta el motor.'
    ], rowText('f', 'prueba', 'sqrt(x^2-1)/(x-3)'));

    live(root, out, function () {
      var src = val(root, 'f'), f = compile(src);
      var h = step('KaTeX: ' + (window.katex ? ok('cargado') : bad('no cargado')) + ' \u00b7 autorenderizado: ' +
        (window.renderMathInElement ? ok('disponible') : bad('no disponible')));
      h += step('Compilador: ' + ok('correcto') + ' \u00b7 traducci\u00f3n a LaTeX: ' + T(toTex(src)));
      h += step('Valores: ' + [-2, 0, 2, 4].map(function (x) {
        var y = safe(f, x);
        return T('f(' + x + ')=' + (isNaN(y) ? '\\text{no existe}' : nt(y)));
      }).join(' \u00b7 '));
      h += step('Prueba de notaci\u00f3n: ' + T('\\dfrac{-b\\pm\\sqrt{b^{2}-4ac}}{2a}') + ', ' +
        T('\\left(-\\infty,-1\\right]\\cup\\left[1,+\\infty\\right)') + ', ' + T('f^{-1}(x)') + ', ' +
        T('\\left(g\\circ f\\right)(x)'));
      h += plot([{ type: 'fn', f: f }], W0);
      return h;
    });
  };

  /* =================================================================
     10. ARRANQUE
     ================================================================= */

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-applet-fn]'), function (node) {
      var k = node.getAttribute('data-applet-fn');
      if (typeof FN[k] === 'function') {
        try { FN[k](node); }
        catch (e) {
          node.classList.add('applet');
          node.innerHTML = errBox('el applet \u00ab' + k + '\u00bb no ha podido iniciarse: ' + (e && e.message ? e.message : e));
        }
      } else {
        node.classList.add('applet');
        node.innerHTML = errBox('no existe ning\u00fan applet con la clave \u00ab' + k + '\u00bb.');
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.FNAPP = {
    compile: compile, eval: safe, gaps: gaps, range: rangeOf,
    zeros: zeros, symmetry: symmetry, plot: plot, applets: FN
  };
})();
