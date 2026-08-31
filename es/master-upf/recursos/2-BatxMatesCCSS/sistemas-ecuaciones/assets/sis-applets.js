/* =====================================================================
   sis-applets.js — MOTOR DEL TEMA 3 SISTEMAS · 2.º Batx Mates CCSS
   Ubicación: 2-BatxMatesCCSS/sistemas/assets/sis-applets.js

   QUÉ ES
     Motor propio en JavaScript plano, sin OJS y sin dependencias de red.
     Expone window.SIS con aritmética EXACTA de fracciones. Aquí es
     imprescindible: la solución de un sistema sale fraccionaria casi
     siempre, y con decimales el alumno no reconocería su resultado.

     El núcleo numérico es el mismo, ya probado, de los temas 1 y 2,
     ampliado con lo propio de este tema: análisis de compatibilidad
     por rangos, forma reducida, solución paramétrica y Cramer.

   DEPENDENCIAS (vía assets/_scripts.html)
     ../assets/applets.css · assets/sis-applets.css
     ../assets/katex/katex.min.css · ../assets/katex/katex.min.js

   INSERCIÓN EN EL .qmd
     <div data-applet-sis="clave"></div>

   CLAVES DE ESTE ARCHIVO (partes 1, 2 y 3)
     ecuacionlineal · clasifica · grafico2 · escalonado
     matricial · inversamat
     gauss · gaussdisc · gaussparam

   ARRANQUE
     DOMContentLoaded + setTimeout(boot, 0), con guarda data-mounted.
   ===================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. FRACCIONES EXACTAS
     ------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------
     2. LECTURA DE SISTEMAS
     Formato: una ecuación por línea, coeficientes y término
     independiente separados por espacios. La última cifra de cada
     línea es el término independiente.
     ------------------------------------------------------------------ */

  function parseSis(txt) {
    var rows = String(txt == null ? '' : txt)
      .trim().split(/[\n;]+/)
      .map(function (r) { return r.trim(); })
      .filter(function (r) { return r.length > 0; });
    if (!rows.length) return { err: 'Escribe un sistema: una ecuaci\u00f3n por l\u00ednea.' };
    var M = [], cols = null;
    for (var i = 0; i < rows.length; i++) {
      var cells = rows[i].split(/[\s,]+/).filter(function (c) { return c.length > 0; });
      var row = [];
      for (var j = 0; j < cells.length; j++) {
        var v = parseEntry(cells[j]);
        if (!v) {
          return { err: 'No entiendo \u00ab' + cells[j] + '\u00bb en la ecuaci\u00f3n ' + (i + 1) +
            '. Escribe enteros (3, -5), decimales con punto (2.5) o fracciones (3/4).' };
        }
        row.push(v);
      }
      if (row.length < 2) return { err: 'La ecuaci\u00f3n ' + (i + 1) + ' necesita al menos un coeficiente y el t\u00e9rmino independiente.' };
      if (cols === null) cols = row.length;
      else if (row.length !== cols) {
        return { err: 'Todas las ecuaciones deben tener el mismo n\u00famero de n\u00fameros: la ' +
          (i + 1) + ' tiene ' + row.length + ' y la primera tiene ' + cols +
          '. Si una inc\u00f3gnita no aparece, escribe un 0 en su sitio.' };
      }
      M.push(row);
    }
    var n = cols - 1;
    var A = M.map(function (r) { return r.slice(0, n); });
    var b = M.map(function (r) { return r[n]; });
    return { A: A, b: b, amp: M, m: M.length, n: n };
  }

  /* Solo la matriz, sin término independiente */
  function parseM(txt) {
    var p = parseSis(txt + ' 0');
    return p;
  }

  var NOM = ['x', 'y', 'z', 't', 'u', 'v'];
  function nombre(j, n) {
    if (n <= 4) return NOM[j];
    return 'x_{' + (j + 1) + '}';
  }

  /* ------------------------------------------------------------------
     3. ÁLGEBRA EXACTA
     ------------------------------------------------------------------ */

  function clone(A) { return A.map(function (r) { return r.slice(); }); }
  function ident(n) {
    var I = [];
    for (var i = 0; i < n; i++) { I.push([]); for (var j = 0; j < n; j++) I[i].push(i === j ? R(1) : R(0)); }
    return I;
  }
  function mulM(A, B) {
    var m = A.length, p = B.length, n = B[0].length, C = [];
    for (var i = 0; i < m; i++) {
      C.push([]);
      for (var j = 0; j < n; j++) {
        var s = R(0);
        for (var k = 0; k < p; k++) s = F.add(s, F.mul(A[i][k], B[k][j]));
        C[i].push(s);
      }
    }
    return C;
  }
  function transM(A) {
    var T = [];
    for (var j = 0; j < A[0].length; j++) { T.push([]); for (var i = 0; i < A.length; i++) T[j].push(A[i][j]); }
    return T;
  }
  function eqM(A, B) {
    if (!A || !B || A.length !== B.length || A[0].length !== B[0].length) return false;
    for (var i = 0; i < A.length; i++) for (var j = 0; j < A[0].length; j++) if (!F.eq(A[i][j], B[i][j])) return false;
    return true;
  }
  function minor(A, i, j) {
    var S = [];
    for (var a = 0; a < A.length; a++) {
      if (a === i) continue;
      var row = [];
      for (var b = 0; b < A[0].length; b++) { if (b === j) continue; row.push(A[a][b]); }
      S.push(row);
    }
    return S;
  }
  function det(A) {
    var n = A.length;
    if (n === 0) return R(1);
    if (n === 1) return A[0][0];
    if (n === 2) return F.sub(F.mul(A[0][0], A[1][1]), F.mul(A[0][1], A[1][0]));
    var s = R(0);
    for (var j = 0; j < n; j++) {
      if (F.isZero(A[0][j])) continue;
      var t = F.mul(A[0][j], det(minor(A, 0, j)));
      s = (j % 2 === 0) ? F.add(s, t) : F.sub(s, t);
    }
    return s;
  }
  function invAdj(A) {
    var d = det(A), n = A.length;
    if (F.isZero(d)) return null;
    var C = [];
    for (var i = 0; i < n; i++) {
      C.push([]);
      for (var j = 0; j < n; j++) {
        var m = det(minor(A, i, j));
        C[i].push(((i + j) % 2 === 0) ? m : F.neg(m));
      }
    }
    var T = transM(C);
    return T.map(function (r) { return r.map(function (x) { return F.div(x, d); }); });
  }

  /* Escalonamiento con registro de pasos, sobre la matriz ampliada */
  function gauss(M0, nCoef) {
    var A = clone(M0), m = A.length, total = A[0].length;
    var lim = (nCoef === undefined) ? total : nCoef;
    var steps = [{ lab: 'Matriz ampliada de partida', M: clone(A) }], r = 0;
    for (var c = 0; c < lim && r < m; c++) {
      var p = -1;
      for (var i = r; i < m; i++) if (!F.isZero(A[i][c])) { p = i; break; }
      if (p < 0) continue;
      if (p !== r) {
        var t = A[r]; A[r] = A[p]; A[p] = t;
        steps.push({ lab: 'E_{' + (r + 1) + '}\\leftrightarrow E_{' + (p + 1) + '}', M: clone(A) });
      }
      for (var i2 = r + 1; i2 < m; i2++) {
        if (F.isZero(A[i2][c])) continue;
        var f = F.div(A[i2][c], A[r][c]);
        for (var k = 0; k < total; k++) A[i2][k] = F.sub(A[i2][k], F.mul(f, A[r][k]));
        steps.push({
          lab: 'E_{' + (i2 + 1) + '}\\to E_{' + (i2 + 1) + '}-\\left(' + F.tex(f) + '\\right)E_{' + (r + 1) + '}',
          M: clone(A)
        });
      }
      r++;
    }
    return { M: A, steps: steps, rank: r };
  }

  function rango(A) {
    if (!A.length || !A[0].length) return 0;
    return gauss(A).rank;
  }

  /* Forma reducida por filas de la ampliada, para la solución paramétrica */
  function rref(M0, nCoef) {
    var A = clone(M0), m = A.length, total = A[0].length, r = 0, piv = [];
    for (var c = 0; c < nCoef && r < m; c++) {
      var p = -1;
      for (var i = r; i < m; i++) if (!F.isZero(A[i][c])) { p = i; break; }
      if (p < 0) continue;
      var t = A[r]; A[r] = A[p]; A[p] = t;
      var inv = F.div(R(1), A[r][c]);
      for (var k = 0; k < total; k++) A[r][k] = F.mul(inv, A[r][k]);
      for (var i2 = 0; i2 < m; i2++) {
        if (i2 === r || F.isZero(A[i2][c])) continue;
        var f = A[i2][c];
        for (var k2 = 0; k2 < total; k2++) A[i2][k2] = F.sub(A[i2][k2], F.mul(f, A[r][k2]));
      }
      piv.push(c); r++;
    }
    return { M: A, rank: r, piv: piv };
  }

  /* ANÁLISIS COMPLETO: Rouché-Frobenius + solución */
  function analiza(A, b) {
    var m = A.length, n = A[0].length;
    var amp = A.map(function (r, i) { return r.concat([b[i]]); });
    var rA = rango(A), rAmp = rango(amp);
    var res = { rA: rA, rAmp: rAmp, n: n, m: m, amp: amp };
    if (rA !== rAmp) { res.tipo = 'SI'; return res; }
    res.tipo = (rA === n) ? 'SCD' : 'SCI';
    res.libertad = n - rA;
    var rr = rref(amp, n);
    res.rref = rr;
    var libres = [];
    for (var c = 0; c < n; c++) if (rr.piv.indexOf(c) < 0) libres.push(c);
    res.libres = libres;
    /* Solución: para cada pivote, valor y coeficientes de las libres */
    var sol = [];
    for (var k = 0; k < rr.piv.length; k++) {
      var fila = rr.M[k], col = rr.piv[k];
      var term = { col: col, cte: fila[n], coef: [] };
      libres.forEach(function (lc) { term.coef.push({ col: lc, val: F.neg(fila[lc]) }); });
      sol.push(term);
    }
    res.sol = sol;
    return res;
  }

  /* Cramer: devuelve determinantes y solución si es aplicable */
  function cramer(A, b) {
    var n = A.length;
    if (A[0].length !== n) return { err: 'Para aplicar Cramer directamente hace falta el mismo n\u00famero de ecuaciones que de inc\u00f3gnitas.' };
    var d = det(A);
    if (F.isZero(d)) return { err: 'El determinante de la matriz de coeficientes es cero, as\u00ed que no se puede aplicar la regla de Cramer en su forma directa.', det: d };
    var dets = [], sol = [];
    for (var j = 0; j < n; j++) {
      var Aj = A.map(function (r, i) {
        var c = r.slice(); c[j] = b[i]; return c;
      });
      var dj = det(Aj);
      dets.push({ M: Aj, val: dj });
      sol.push(F.div(dj, d));
    }
    return { det: d, dets: dets, sol: sol };
  }

  /* ------------------------------------------------------------------
     4. SALIDA CON KaTeX, SIN AUTO-RENDER
     ------------------------------------------------------------------ */

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
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

  function texM(A, opts) {
    opts = opts || {};
    var body = A.map(function (row, i) {
      return row.map(function (x, j) {
        var s = F.tex(x);
        var hot = (opts.hi && opts.hi[0] === i && opts.hi[1] === j) || (opts.hiCol === j) || (opts.hiRow === i);
        return hot ? '\\boxed{' + s + '}' : s;
      }).join(' & ');
    }).join(' \\\\ ');
    if (opts.split !== undefined) {
      var spec = '';
      for (var j = 0; j < A[0].length; j++) spec += (j === opts.split ? '|c' : 'c');
      return (opts.name ? opts.name + ' = ' : '') + '\\left(\\begin{array}{' + spec + '}' + body + '\\end{array}\\right)';
    }
    var env = opts.bars ? 'vmatrix' : 'pmatrix';
    return (opts.name ? opts.name + ' = ' : '') + '\\begin{' + env + '}' + body + '\\end{' + env + '}';
  }
  function view(A, opts) { return k(texM(A, opts)); }
  function viewDet(A, opts) { opts = opts || {}; opts.bars = true; return k(texM(A, opts)); }
  function viewAmp(amp, n, opts) {
    opts = opts || {}; opts.split = n;
    return k(texM(amp, opts));
  }

  /* Sistema escrito como ecuaciones, en LaTeX */
  function texSistema(A, b) {
    var n = A[0].length;
    var filas = A.map(function (row, i) {
      var t = '';
      for (var j = 0; j < n; j++) {
        var c = row[j];
        if (F.isZero(c)) continue;
        var signo = (F.num(c) < 0) ? '-' : (t === '' ? '' : '+');
        var abs = F.num(c) < 0 ? F.neg(c) : c;
        var coef = F.eq(abs, R(1)) ? '' : F.tex(abs);
        t += signo + coef + nombre(j, n);
      }
      if (t === '') t = '0';
      return t + ' &= ' + F.tex(b[i]);
    });
    return '\\left\\{\\begin{aligned}' + filas.join(' \\\\ ') + '\\end{aligned}\\right.';
  }

  function ok(m) { return '<div class="mx-ok">' + m + '</div>'; }
  function info(m) { return '<div class="mx-info">' + m + '</div>'; }
  function warn(m) { return '<div class="mx-warn">' + m + '</div>'; }
  function err(m) { return '<div class="mx-bad ap-err">' + m + '</div>'; }

  function stepsView(steps, n) {
    var h = '<div class="mx-steps">';
    steps.forEach(function (s) {
      h += '<div class="mx-step"><span class="mx-step-lab">' +
        (/[\\_]/.test(s.lab) ? k(s.lab) : s.lab) + '</span>' +
        viewAmp(s.M, n) + '</div>';
    });
    return h + '</div>';
  }

  /* Solución en forma paramétrica, legible */
  function texSolucion(res) {
    var n = res.n, letras = ['\\lambda', '\\mu', '\\nu'];
    if (res.tipo === 'SI') return '\\text{sin soluci\u00f3n}';
    var lineas = [];
    res.sol.forEach(function (t) {
      var s = nombre(t.col, n) + ' &= ' + F.tex(t.cte);
      t.coef.forEach(function (c) {
        if (F.isZero(c.val)) return;
        var pos = res.libres.indexOf(c.col);
        var signo = F.num(c.val) < 0 ? ' - ' : ' + ';
        var abs = F.num(c.val) < 0 ? F.neg(c.val) : c.val;
        var coef = F.eq(abs, R(1)) ? '' : F.tex(abs);
        s += signo + coef + letras[pos];
      });
      lineas.push(s);
    });
    res.libres.forEach(function (lc, idx) {
      lineas.push(nombre(lc, n) + ' &= ' + letras[idx]);
    });
    return '\\left\\{\\begin{aligned}' + lineas.join(' \\\\ ') + '\\end{aligned}\\right.';
  }

  function etiqueta(tipo) {
    if (tipo === 'SCD') return '<span class="mx-badge">SCD</span> compatible determinado';
    if (tipo === 'SCI') return '<span class="mx-badge">SCI</span> compatible indeterminado';
    return '<span class="mx-badge">SI</span> incompatible';
  }

  /* ------------------------------------------------------------------
     5. CONSTRUCTOR DE APPLETS
     ------------------------------------------------------------------ */

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

  function need(txt) {
    var p = parseSis(txt);
    if (p.err) return { err: p.err };
    return p;
  }

  /* Texto de ayuda del formato, reutilizado en casi todos los applets */
  var FORMATO = 'Escribe <b>una ecuaci\u00f3n por l\u00ednea</b>. En cada l\u00ednea van los coeficientes y, al final, ' +
    'el t\u00e9rmino independiente, todos separados por espacios. Si una inc\u00f3gnita no aparece en una ecuaci\u00f3n, ' +
    'escribe <code>0</code> en su sitio. Admite enteros, decimales con punto y fracciones como <code>3/4</code>.<br>' +
    'Ejemplo: el sistema ' + k('\\begin{cases} x+y-z=1 \\\\ 2x-y=3 \\\\ x+2z=0\\end{cases}') +
    ' se escribe <code>1 1 -1 1<br>2 -1 0 3<br>1 0 2 0</code>.';

  /* ==================================================================
     PARTE 1 · SISTEMAS DE ECUACIONES LINEALES
     ================================================================== */

  reg('ecuacionlineal', function (node) {
    build(node, 'Applet \u00b7 Una ecuaci\u00f3n lineal',
      'Una sola ecuaci\u00f3n con varias inc\u00f3gnitas tiene <b>infinitas soluciones</b>. Escribe los coeficientes ' +
      'y el t\u00e9rmino independiente en una l\u00ednea, y el applet genera soluciones concretas. ' +
      'Ejemplo del libro: ' + k('2x_1-x_2+x_3-3x_4=6') + ' se escribe <code>2 -1 1 -3 6</code>.',
      [{ id: 'E', label: 'Una ecuaci\u00f3n', rows: 2, value: '2 -1 1 -3 6' }],
      function (v) {
        var p = need(v.E);
        if (p.err) return err(p.err);
        if (p.m !== 1) return err('Este applet trabaja con <b>una sola</b> ecuaci\u00f3n. Has escrito ' + p.m + '.');
        var a = p.A[0], b = p.b[0], n = p.n;
        var h = '<div class="mx-flex">' + kd(texSistema(p.A, p.b)) + '</div>';
        h += '<p>Coeficientes: ' + a.map(function (x, j) { return k('a_' + (j + 1) + ' = ' + F.tex(x)); }).join(' \u00b7 ') +
          '. T\u00e9rmino independiente: ' + k('b = ' + F.tex(b)) + '.</p>';
        var primero = -1;
        for (var j = 0; j < n; j++) if (!F.isZero(a[j])) { primero = j; break; }
        if (primero < 0) {
          return h + (F.isZero(b)
            ? warn('Todos los coeficientes son cero y el t\u00e9rmino independiente tambi\u00e9n: la ecuaci\u00f3n ' +
              k('0 = 0') + ' es <b>trivial</b> y la cumple cualquier valor.')
            : err('Todos los coeficientes son cero pero el t\u00e9rmino independiente no: la ecuaci\u00f3n ' +
              k('0 = ' + F.tex(b)) + ' es <b>imposible</b> y no tiene ninguna soluci\u00f3n.'));
        }
        h += '<p><b>Tres soluciones concretas</b>, dando valores arbitrarios a todas las inc\u00f3gnitas menos a ' +
          k(nombre(primero, n)) + ', que se despeja:</p><ul>';
        for (var t = 0; t < 3; t++) {
          var vals = [], suma = R(0);
          for (var j2 = 0; j2 < n; j2++) {
            if (j2 === primero) { vals.push(null); continue; }
            var val = R(t - 1 + j2);
            vals.push(val);
            suma = F.add(suma, F.mul(a[j2], val));
          }
          vals[primero] = F.div(F.sub(b, suma), a[primero]);
          h += '<li>' + vals.map(function (x, j3) { return k(nombre(j3, n) + ' = ' + F.tex(x)); }).join(', ') + '</li>';
        }
        h += '</ul>';
        h += info('Una ecuaci\u00f3n lineal con m\u00e1s de una inc\u00f3gnita tiene <b>infinitas soluciones</b>. ' +
          'Con dos inc\u00f3gnitas son los puntos de una recta; con tres, los de un plano; con m\u00e1s, ' +
          'un hiperplano que ya no podemos dibujar.');
        h += warn('Recuerda qu\u00e9 <b>no</b> es lineal: no puede aparecer una inc\u00f3gnita al cuadrado, ' +
          'ni un producto de dos inc\u00f3gnitas, ni funciones como el seno o el logaritmo.');
        return h;
      });
  });

  reg('clasifica', function (node) {
    build(node, 'Applet \u00b7 Clasificador de sistemas',
      FORMATO + '<br>Ejemplos del libro: <code>1 1 2<br>2 -1 -2</code> (\u00fanica soluci\u00f3n) \u00b7 ' +
      '<code>1 1 2<br>-2 -2 -4</code> (infinitas) \u00b7 <code>1 1 2<br>-1 -1 -2</code>\u2026 ' +
      'prueba tambi\u00e9n <code>1 1 2<br>1 1 3</code>, que no tiene soluci\u00f3n.',
      [{ id: 'S', label: 'Sistema', rows: 4, value: '1 1 2\n2 -1 -2' }],
      function (v) {
        var p = need(v.S);
        if (p.err) return err(p.err);
        var res = analiza(p.A, p.b);
        var h = '<div class="mx-flex">' + kd(texSistema(p.A, p.b)) + '</div>';
        h += '<p>' + p.m + ' ecuaci\u00f3n' + (p.m === 1 ? '' : 'es') + ' con ' + p.n +
          ' inc\u00f3gnita' + (p.n === 1 ? '' : 's') + '.</p>';
        h += '<p><b>Clasificaci\u00f3n:</b> ' + etiqueta(res.tipo) + '</p>';
        if (res.tipo === 'SI') {
          h += err('No tiene soluci\u00f3n. Al escalonar aparece una ecuaci\u00f3n del tipo ' + k('0 = b') +
            ' con ' + k('b \\neq 0') + ', que es imposible.');
        } else if (res.tipo === 'SCD') {
          h += ok('Tiene una <b>\u00fanica</b> soluci\u00f3n:');
          h += kd(texSolucion(res));
        } else {
          h += ok('Tiene <b>infinitas</b> soluciones, con ' + res.libertad +
            ' grado' + (res.libertad === 1 ? '' : 's') + ' de libertad:');
          h += kd(texSolucion(res));
          h += info('Dando valores al par\u00e1metro se obtienen soluciones concretas. Todas son v\u00e1lidas, ' +
            'y la respuesta correcta en un examen es la <b>expresi\u00f3n param\u00e9trica completa</b>, no un ejemplo.');
        }
        h += info('El esquema de clasificaci\u00f3n del tema: un sistema es <b>compatible</b> si tiene soluci\u00f3n, ' +
          'y entonces <b>determinado</b> si es \u00fanica o <b>indeterminado</b> si hay infinitas; ' +
          'y es <b>incompatible</b> si no tiene ninguna.');
        return h;
      });
  });

  reg('grafico2', function (node) {
    build(node, 'Applet \u00b7 Interpretaci\u00f3n gr\u00e1fica',
      'Con <b>dos inc\u00f3gnitas</b> cada ecuaci\u00f3n es una recta, y resolver el sistema es buscar el punto de corte. ' +
      'Escribe dos ecuaciones de dos inc\u00f3gnitas y el applet describe la posici\u00f3n relativa de las rectas. ' +
      'Prueba: <code>1 1 3<br>1 -1 1</code> (se cortan) \u00b7 <code>1 1 3<br>2 2 6</code> (coincidentes) \u00b7 ' +
      '<code>1 1 3<br>2 2 5</code> (paralelas).',
      [{ id: 'S', label: 'Dos ecuaciones, dos inc\u00f3gnitas', rows: 3, value: '1 1 3\n1 -1 1' }],
      function (v) {
        var p = need(v.S);
        if (p.err) return err(p.err);
        if (p.n !== 2) return err('Para la interpretaci\u00f3n gr\u00e1fica hacen falta exactamente <b>dos</b> inc\u00f3gnitas. ' +
          'Tu sistema tiene ' + p.n + '.');
        if (p.m !== 2) return err('Escribe exactamente <b>dos</b> ecuaciones. Has escrito ' + p.m + '.');
        var res = analiza(p.A, p.b);
        var h = '<div class="mx-flex">' + kd(texSistema(p.A, p.b)) + '</div>';
        var tabla = [
          ['Dos rectas <b>secantes</b>', 'se cortan en un punto', 'SCD', 'una soluci\u00f3n'],
          ['Dos rectas <b>coincidentes</b>', 'son la misma recta', 'SCI', 'infinitas soluciones'],
          ['Dos rectas <b>paralelas</b>', 'no se cortan nunca', 'SI', 'ninguna soluci\u00f3n']
        ];
        h += '<table class="ap-tbl"><thead><tr><th>Posici\u00f3n</th><th>Significado</th><th>Tipo</th><th>Soluciones</th></tr></thead><tbody>';
        tabla.forEach(function (f) {
          var activa = (f[2] === res.tipo);
          h += '<tr' + (activa ? ' class="mx-pivot"' : '') + '><td>' + f[0] + '</td><td>' + f[1] +
            '</td><td>' + f[2] + '</td><td>' + f[3] + '</td></tr>';
        });
        h += '</tbody></table>';
        h += '<p>Tu sistema est\u00e1 en la fila marcada: ' + etiqueta(res.tipo) + '</p>';
        if (res.tipo === 'SCD') {
          h += ok('Las rectas se cortan en el punto ' +
            k('\\left(' + F.tex(res.sol[0].cte) + ',\\; ' + F.tex(res.sol[1].cte) + '\\right)') + '.');
        } else if (res.tipo === 'SCI') {
          h += ok('Las dos ecuaciones representan la <b>misma</b> recta: una es m\u00faltiplo de la otra, ' +
            'as\u00ed que la segunda no aporta informaci\u00f3n nueva.');
        } else {
          h += err('Los coeficientes son proporcionales pero los t\u00e9rminos independientes no: ' +
            'rectas <b>paralelas</b> distintas. El sistema se contradice.');
        }
        h += info('Esta lectura geom\u00e9trica se pierde con tres inc\u00f3gnitas, donde cada ecuaci\u00f3n es un ' +
          '<b>plano</b>, y con m\u00e1s de tres ya no hay dibujo posible. Pero el \u00e1lgebra sigue funcionando igual, ' +
          'y de eso trata el resto del tema.');
        return h;
      });
  });

  reg('escalonado', function (node) {
    build(node, 'Applet \u00b7 Sistemas escalonados',
      'Un sistema est\u00e1 <b>escalonado</b> cuando cada ecuaci\u00f3n tiene al menos una inc\u00f3gnita menos que la ' +
      'anterior. Entonces se resuelve de abajo arriba, sin ning\u00fan m\u00e9todo especial. ' +
      'Ejemplo del libro: <code>3 -1 2 0<br>0 1 -1 1<br>0 0 1 1</code>, que da ' + k('x=0, y=2, z=1') + '.',
      [{ id: 'S', label: 'Sistema escalonado', rows: 4, value: '3 -1 2 0\n0 1 -1 1\n0 0 1 1' }],
      function (v) {
        var p = need(v.S);
        if (p.err) return err(p.err);
        var h = '<div class="mx-flex">' + kd(texSistema(p.A, p.b)) + '</div>';
        /* ¿Es escalonado? */
        var esc2 = true, ant = -1;
        for (var i = 0; i < p.m; i++) {
          var pri = -1;
          for (var j = 0; j < p.n; j++) if (!F.isZero(p.A[i][j])) { pri = j; break; }
          if (pri >= 0 && pri <= ant) esc2 = false;
          if (pri >= 0) ant = pri;
        }
        h += esc2
          ? ok('S\u00ed est\u00e1 escalonado: cada ecuaci\u00f3n empieza m\u00e1s a la derecha que la anterior.')
          : warn('Este sistema <b>no</b> est\u00e1 escalonado. Puedes escalonarlo con el applet de Gauss de la parte 3. ' +
            'Aun as\u00ed, el applet lo resuelve.');
        var res = analiza(p.A, p.b);
        h += '<p><b>Resoluci\u00f3n de abajo arriba:</b></p>';
        if (res.tipo === 'SI') {
          h += err('La \u00faltima ecuaci\u00f3n no nula es imposible: sistema <b>incompatible</b>.');
          return h;
        }
        var pasos = '';
        for (var q = res.sol.length - 1; q >= 0; q--) {
          var t = res.sol[q];
          pasos += '<li>De la ecuaci\u00f3n ' + (q + 1) + ' se despeja ' + k(nombre(t.col, p.n)) + ' y sale ' +
            k(nombre(t.col, p.n) + ' = ' + F.tex(t.cte) +
              (t.coef.length && t.coef.some(function (c) { return !F.isZero(c.val); }) ? '\\;(\\text{con par\u00e1metro})' : '')) + '</li>';
        }
        h += '<ul>' + pasos + '</ul>';
        h += kd(texSolucion(res));
        h += '<p>' + etiqueta(res.tipo) + '</p>';
        h += info('Todo el m\u00e9todo de Gauss consiste en llegar a esta situaci\u00f3n: convertir un sistema ' +
          'cualquiera en uno escalonado <b>equivalente</b>, es decir, con las mismas soluciones.');
        return h;
      });
  });

  /* ==================================================================
     PARTE 2 · EXPRESIÓN MATRICIAL
     ================================================================== */

  reg('matricial', function (node) {
    build(node, 'Applet \u00b7 Expresi\u00f3n matricial',
      FORMATO + '<br>El applet descompone el sistema en sus tres matrices y muestra la matriz ampliada. ' +
      'Ejemplo del libro: <code>1 1 -1 0<br>-2 -1 1 -1<br>1 -1 2 0</code>.',
      [{ id: 'S', label: 'Sistema', rows: 4, value: '1 1 -1 0\n-2 -1 1 -1\n1 -1 2 0' }],
      function (v) {
        var p = need(v.S);
        if (p.err) return err(p.err);
        var n = p.n;
        var X = [];
        for (var j = 0; j < n; j++) X.push([{ n: 0, d: 1, sym: nombre(j, n) }]);
        var h = '<div class="mx-flex">' + kd(texSistema(p.A, p.b)) + '</div>';
        var incog = '\\begin{pmatrix}' + [].concat.apply([], (function () {
          var a = [];
          for (var j = 0; j < n; j++) a.push(nombre(j, n));
          return a;
        })()).join(' \\\\ ') + '\\end{pmatrix}';
        h += kd(texM(p.A) + '\\cdot ' + incog + ' = ' + texM(p.b.map(function (x) { return [x]; })));
        h += '<div class="mx-grid">' + view(p.A, { name: 'A' }) +
          view(p.b.map(function (x) { return [x]; }), { name: 'B' }) + '</div>';
        h += '<p><b>Matriz ampliada</b>, que es la que se usa en Gauss y en Rouch\u00e9-Frobenius:</p>';
        h += '<div class="mx-flex">' + viewAmp(p.amp, n, { name: 'A^{*}' }) + '</div>';
        h += info('Los tres nombres que hay que manejar: <b>matriz de coeficientes</b> ' + k('A') +
          ', <b>matriz de inc\u00f3gnitas</b> ' + k('X') + ' y <b>matriz de t\u00e9rminos independientes</b> ' + k('B') +
          '. El sistema se resume en ' + k('A\\cdot X = B') + '.');
        var cuad = (p.m === n);
        if (cuad) {
          var d = det(p.A);
          h += '<p>La matriz ' + k('A') + ' es cuadrada de orden ' + n + ' y ' + k('|A| = ' + F.tex(d)) + '.</p>';
          h += F.isZero(d)
            ? warn('Como ' + k('|A| = 0') + ', <b>no</b> existe ' + k('A^{-1}') +
              ' y el sistema no se puede resolver por el m\u00e9todo de la matriz inversa. Habr\u00e1 que usar Gauss.')
            : ok('Como ' + k('|A| \\neq 0') + ', existe ' + k('A^{-1}') + ' y el sistema se puede resolver como ' +
              k('X = A^{-1}B') + '. Pru\u00e9balo en el applet siguiente.');
        } else {
          h += warn('El n\u00famero de ecuaciones (' + p.m + ') no coincide con el de inc\u00f3gnitas (' + n +
            '), as\u00ed que ' + k('A') + ' no es cuadrada, no tiene inversa y este sistema <b>no</b> se puede ' +
            'resolver por el m\u00e9todo matricial. Gauss y Rouch\u00e9-Frobenius s\u00ed sirven.');
        }
        return h;
      });
  });

  reg('inversamat', function (node) {
    build(node, 'Applet \u00b7 Resolver con la matriz inversa',
      'Si ' + k('A') + ' es cuadrada y ' + k('|A| \\neq 0') + ', el sistema se resuelve despejando: ' +
      k('X = A^{-1}B') + '. ' + FORMATO + '<br>Ejemplos: <code>6 1 15<br>2 -3 8</code> \u00b7 ' +
      '<code>1 1 -1 0<br>-2 -1 1 -1<br>1 -1 2 0</code> \u00b7 <code>1 1 2<br>2 2 5</code> (esta falla, observa por qu\u00e9).',
      [{ id: 'S', label: 'Sistema', rows: 4, value: '6 1 15\n2 -3 8' }],
      function (v) {
        var p = need(v.S);
        if (p.err) return err(p.err);
        var n = p.n;
        if (p.m !== n) {
          return err('Para este m\u00e9todo hacen falta <b>tantas ecuaciones como inc\u00f3gnitas</b>. ' +
            'Tu sistema tiene ' + p.m + ' ecuaciones y ' + n + ' inc\u00f3gnitas, as\u00ed que ' + k('A') +
            ' no es cuadrada y no puede tener inversa.');
        }
        var d = det(p.A);
        var h = '<div class="mx-flex">' + kd(texSistema(p.A, p.b)) + '</div>';
        h += '<div class="mx-flex">' + viewDet(p.A, { name: '|A|' }) + k('= ' + F.tex(d)) + '</div>';
        if (F.isZero(d)) {
          h += err('El determinante es <b>cero</b>, luego ' + k('A^{-1}') + ' no existe y este m\u00e9todo ' +
            '<b>no se puede aplicar</b>. Eso no significa que el sistema no tenga soluci\u00f3n: puede ser ' +
            'incompatible o compatible indeterminado, y para averiguarlo hay que usar Gauss o Rouch\u00e9-Frobenius.');
          var res0 = analiza(p.A, p.b);
          h += info('De hecho, este sistema es ' + etiqueta(res0.tipo) + '.');
          return h;
        }
        var Inv = invAdj(p.A);
        var B = p.b.map(function (x) { return [x]; });
        var X = mulM(Inv, B);
        h += kd('A^{-1}AX = A^{-1}B \\;\\Rightarrow\\; IX = A^{-1}B \\;\\Rightarrow\\; X = A^{-1}B');
        h += '<div class="mx-flex">' + view(Inv, { name: 'A^{-1}' }) + '</div>';
        h += '<div class="mx-flex">' + view(Inv) + k('\\cdot') + view(B) + k('=') + view(X, { name: 'X' }) + '</div>';
        h += ok('Soluci\u00f3n: ' + X.map(function (r, j) { return k(nombre(j, n) + ' = ' + F.tex(r[0])); }).join(', ') + '.');
        /* Comprobación */
        var comp = mulM(p.A, X);
        h += '<div class="mx-flex"><span>Comprobaci\u00f3n ' + k('A\\cdot X') + ':</span>' + view(comp) +
          '<span>debe ser</span>' + view(B) + '</div>';
        h += eqM(comp, B)
          ? ok('Coincide con ' + k('B') + '. Sustituir siempre la soluci\u00f3n en el sistema original ' +
            'es la comprobaci\u00f3n m\u00e1s barata que existe.')
          : err('No coincide: revisa los datos.');
        h += warn('Ojo al orden: es ' + k('X = A^{-1}B') + ', con la inversa <b>a la izquierda</b>. ' +
          'Escribir ' + k('BA^{-1}') + ' dar\u00eda otra cosa, o directamente no existir\u00eda.');
        return h;
      });
  });

  /* ==================================================================
     PARTE 3 · MÉTODO DE GAUSS
     ================================================================== */

  reg('gauss', function (node) {
    build(node, 'Applet \u00b7 M\u00e9todo de Gauss',
      FORMATO + '<br>El applet escalona la <b>matriz ampliada</b> mostrando cada transformaci\u00f3n con su ' +
      'notaci\u00f3n, y despu\u00e9s resuelve de abajo arriba. La l\u00ednea vertical separa los coeficientes de los ' +
      't\u00e9rminos independientes. Ejemplos del libro: <code>1 -3 2 -1<br>-2 0 4 -6<br>1 -2 1 0</code> \u00b7 ' +
      '<code>1 2 -2 1<br>0 1 -1 1<br>3 0 -2 7</code>.',
      [{ id: 'S', label: 'Sistema', rows: 5, value: '1 -3 2 -1\n-2 0 4 -6\n1 -2 1 0' }],
      function (v) {
        var p = need(v.S);
        if (p.err) return err(p.err);
        var n = p.n;
        var g = gauss(p.amp, n);
        var h = '<div class="mx-flex">' + kd(texSistema(p.A, p.b)) + '</div>';
        h += '<p>Escribimos la <b>matriz ampliada</b> y escalonamos:</p>';
        h += stepsView(g.steps, n);
        var res = analiza(p.A, p.b);
        h += '<p>Rango de la matriz de coeficientes: <b>' + res.rA + '</b>. Rango de la ampliada: <b>' +
          res.rAmp + '</b>. Inc\u00f3gnitas: <b>' + n + '</b>.</p>';
        h += '<p>' + etiqueta(res.tipo) + '</p>';
        if (res.tipo === 'SI') {
          h += err('Al escalonar aparece una ecuaci\u00f3n del tipo ' + k('0 = b') + ' con ' + k('b \\neq 0') +
            ', que es <b>imposible</b>. El sistema no tiene soluci\u00f3n.');
        } else {
          h += '<p><b>Soluci\u00f3n:</b></p>' + kd(texSolucion(res));
          if (res.tipo === 'SCI') {
            h += info('Hay ' + res.libertad + ' par\u00e1metro' + (res.libertad === 1 ? '' : 's') +
              ' libre' + (res.libertad === 1 ? '' : 's') + '. La respuesta correcta es esta expresi\u00f3n completa: ' +
              'dar un solo ejemplo de soluci\u00f3n no vale.');
          }
        }
        h += info('Las tres transformaciones permitidas son intercambiar dos ecuaciones, multiplicar una ' +
          'ecuaci\u00f3n por un n\u00famero distinto de cero, y sustituir una ecuaci\u00f3n por su suma con otra ' +
          'multiplicada por un n\u00famero. Ninguna cambia las soluciones: el sistema resultante es <b>equivalente</b>.');
        h += warn('Si al escalonar te sale una fila <b>entera de ceros</b>, incluido el t\u00e9rmino independiente, ' +
          'esa ecuaci\u00f3n es trivial y se puede suprimir: era combinaci\u00f3n de las otras y no aportaba nada.');
        return h;
      });
  });

  reg('gaussdisc', function (node) {
    build(node, 'Applet \u00b7 Discutir con Gauss',
      'Discutir un sistema es clasificarlo seg\u00fan el n\u00famero de soluciones. Con Gauss se hace mirando la ' +
      '<b>\u00faltima fila no nula</b>. ' + FORMATO + '<br>Ejemplos del libro: ' +
      '<code>1 1 -1 2<br>2 -1 2 -2<br>3 0 1 0</code> (indeterminado) y el mismo con el \u00faltimo ' +
      't\u00e9rmino cambiado a 1: <code>1 1 -1 2<br>2 -1 2 -2<br>3 0 1 1</code> (incompatible).',
      [{ id: 'S', label: 'Sistema', rows: 5, value: '1 1 -1 2\n2 -1 2 -2\n3 0 1 0' }],
      function (v) {
        var p = need(v.S);
        if (p.err) return err(p.err);
        var n = p.n, g = gauss(p.amp, n);
        var h = '<div class="mx-flex">' + kd(texSistema(p.A, p.b)) + '</div>';
        h += stepsView([g.steps[0], g.steps[g.steps.length - 1]], n);
        /* Última fila no nula */
        var ult = -1;
        for (var i = g.M.length - 1; i >= 0; i--) {
          var todo0 = true;
          for (var j = 0; j <= n; j++) if (!F.isZero(g.M[i][j])) { todo0 = false; break; }
          if (!todo0) { ult = i; break; }
        }
        var res = analiza(p.A, p.b);
        h += '<p><b>Lectura de la \u00faltima fila no nula</b>, la n\u00famero ' + (ult + 1) + ':</p>';
        h += '<div class="mx-flex">' + viewAmp([g.M[ult]], n) + '</div>';
        var coefs = 0;
        for (var j2 = 0; j2 < n; j2++) if (!F.isZero(g.M[ult][j2])) coefs++;
        h += '<table class="ap-tbl"><thead><tr><th>Forma de la fila</th><th>Qu\u00e9 significa</th><th>Tipo</th></tr></thead><tbody>';
        h += '<tr' + (res.tipo === 'SCD' ? ' class="mx-pivot"' : '') +
          '><td>Tantas ecuaciones v\u00e1lidas como inc\u00f3gnitas</td><td>se despeja todo</td><td>SCD</td></tr>';
        h += '<tr' + (res.tipo === 'SCI' ? ' class="mx-pivot"' : '') +
          '><td>M\u00e1s inc\u00f3gnitas que ecuaciones v\u00e1lidas</td><td>quedan par\u00e1metros libres</td><td>SCI</td></tr>';
        h += '<tr' + (res.tipo === 'SI' ? ' class="mx-pivot"' : '') +
          '><td>Coeficientes nulos y t\u00e9rmino independiente no nulo</td><td>' + k('0 = b') +
          ' es imposible</td><td>SI</td></tr>';
        h += '</tbody></table>';
        h += '<p>Ecuaciones v\u00e1lidas, es decir, no nulas: <b>' + res.rAmp + '</b>. Inc\u00f3gnitas: <b>' + n + '</b>.</p>';
        h += '<p>' + etiqueta(res.tipo) + '</p>';
        if (res.tipo !== 'SI') h += kd(texSolucion(res));
        h += info('Compara los dos ejemplos de las instrucciones: solo cambia <b>un n\u00famero</b>, el \u00faltimo ' +
          't\u00e9rmino independiente, y el sistema pasa de tener infinitas soluciones a no tener ninguna. ' +
          'Ahí se ve que la compatibilidad no depende solo de los coeficientes.');
        return h;
      });
  });

  reg('gaussparam', function (node) {
    build(node, 'Applet \u00b7 Gauss con un par\u00e1metro',
      'Ahora los coeficientes o los t\u00e9rminos independientes pueden contener la letra <code>k</code>. ' +
      'Formas admitidas: <code>k</code>, <code>-k</code>, <code>2k</code>, <code>k+1</code>, <code>k-6</code>, ' +
      '<code>3k-2</code>. Mueve el deslizador y observa d\u00f3nde cambia la clasificaci\u00f3n. ' +
      'Ejemplo del libro: <code>2 -1 2 2<br>2 0 -4 -4<br>0 -1 k 1</code>, cr\u00edtico en ' + k('k = 6') + '.',
      [
        { id: 'S', label: 'Sistema con par\u00e1metro k', rows: 5, value: '2 -1 2 2\n2 0 -4 -4\n0 -1 k 1' },
        { id: 'k', label: 'Valor de k', type: 'range', min: -8, max: 8, step: 0.5, value: 2 }
      ],
      function (v) {
        function ev(s, kv) {
          s = String(s).trim().replace(/\s+/g, '');
          if (!/^[-+0-9k.\/]+$/.test(s)) return null;
          var a = s.match(/^([+-]?)(\d*(?:\.\d+)?)k([+-]\d+(?:\.\d+)?)?$/);
          if (a) {
            var co = a[2] === '' ? 1 : parseFloat(a[2]);
            if (a[1] === '-') co = -co;
            return co * kv + (a[3] ? parseFloat(a[3]) : 0);
          }
          var b = s.match(/^([+-]?\d+(?:\.\d+)?)([+-])k$/);
          if (b) return parseFloat(b[1]) + (b[2] === '-' ? -kv : kv);
          var num = parseFloat(s);
          return isNaN(num) ? null : num;
        }
        function grid(txt, kv) {
          var rows = String(txt).trim().split(/[\n;]+/).map(function (r) { return r.trim(); }).filter(function (r) { return r.length; });
          var G = [], c = null;
          for (var i = 0; i < rows.length; i++) {
            var cells = rows[i].split(/[\s,]+/).filter(function (s) { return s.length; });
            var row = [];
            for (var j = 0; j < cells.length; j++) {
              var x = ev(cells[j], kv);
              if (x === null) return { err: 'No entiendo \u00ab' + cells[j] + '\u00bb. Usa n\u00fameros o expresiones con k.' };
              row.push(x);
            }
            if (c === null) c = row.length; else if (row.length !== c) return { err: 'Todas las ecuaciones deben tener el mismo n\u00famero de n\u00fameros.' };
            G.push(row);
          }
          if (!G.length) return { err: 'Escribe un sistema.' };
          return { M: G, m: G.length, n: c - 1 };
        }
        function rankN(A0) {
          var A = A0.map(function (r) { return r.slice(); });
          var m = A.length, n = A[0].length, r = 0;
          for (var c = 0; c < n && r < m; c++) {
            var p = -1, best = 1e-9;
            for (var i = r; i < m; i++) if (Math.abs(A[i][c]) > best) { best = Math.abs(A[i][c]); p = i; }
            if (p < 0) continue;
            var t = A[r]; A[r] = A[p]; A[p] = t;
            for (var i2 = r + 1; i2 < m; i2++) {
              var f = A[i2][c] / A[r][c];
              for (var kk = c; kk < n; kk++) A[i2][kk] -= f * A[r][kk];
            }
            r++;
          }
          return r;
        }
        function tipoN(G, n) {
          var A = G.map(function (r) { return r.slice(0, n); });
          var rA = rankN(A), rAmp = rankN(G);
          if (rA !== rAmp) return 'SI';
          return (rA === n) ? 'SCD' : 'SCI';
        }
        var kv = parseFloat(v.k);
        var g = grid(v.S, kv);
        if (g.err) return err(g.err);
        var n = g.n;
        var fmt = function (x) { return String(Math.round(x * 10000) / 10000); };
        var Q = g.M.map(function (r) { return r.map(function (x) { return parseEntry(fmt(x)) || R(0); }); });
        var A = Q.map(function (r) { return r.slice(0, n); });
        var b = Q.map(function (r) { return r[n]; });
        var h = '<div class="mx-flex"><span>Para ' + k('k = ' + fmt(kv)) + '</span></div>';
        h += '<div class="mx-flex">' + kd(texSistema(A, b)) + '</div>';
        var res = analiza(A, b);
        h += '<p>' + etiqueta(res.tipo) + ' \u2014 rangos ' + res.rA + ' y ' + res.rAmp + ', con ' + n + ' inc\u00f3gnitas.</p>';
        if (res.tipo !== 'SI') h += kd(texSolucion(res));
        /* Barrido de valores críticos: aquellos donde cambia el tipo */
        var previo = null, cambios = [];
        for (var x = -8; x <= 8.0001; x += 0.5) {
          var gx = grid(v.S, x);
          if (gx.err) break;
          var t = tipoN(gx.M, n);
          if (previo !== null && t !== previo) cambios.push({ k: x, de: previo, a: t });
          previo = t;
        }
        if (cambios.length) {
          h += '<table class="ap-tbl"><thead><tr><th>Alrededor de</th><th>Pasa de</th><th>a</th></tr></thead><tbody>';
          cambios.forEach(function (c) {
            h += '<tr><td>' + k('k \\approx ' + fmt(c.k)) + '</td><td>' + c.de + '</td><td>' + c.a + '</td></tr>';
          });
          h += '</tbody></table>';
          h += ok('Ahí están los <b>valores cr\u00edticos</b>: los puntos donde la clasificaci\u00f3n cambia. ' +
            'Loc\u00e1lizalos exactamente escalonando a mano y viendo qu\u00e9 anula el pivote de la \u00faltima fila.');
        } else {
          h += info('En el intervalo explorado la clasificaci\u00f3n no cambia. Prueba el ejemplo de las ' +
            'instrucciones, que es cr\u00edtico en ' + k('k = 6') + '.');
        }
        h += warn('El error que invalida toda la discusi\u00f3n: <b>nunca dividas por una expresi\u00f3n con el ' +
          'par\u00e1metro</b> sin comprobar antes que no se anula. Si haces ' +
          k('E_2 \\to E_2 - \\tfrac{3}{k-6}E_1') + ' est\u00e1s suponiendo en silencio que ' + k('k \\neq 6') +
          ', y ese es justo el caso que el ejercicio quer\u00eda que estudiaras.');
        h += info('El deslizador va de media en media entre \u22128 y 8, as\u00ed que no detectar\u00eda un valor ' +
          'cr\u00edtico como ' + k('k = 1/3') + '. Sirve para <b>ver</b> el fen\u00f3meno, no para sustituir el \u00e1lgebra.');
        return h;
      });
  });

  /* ------------------------------------------------------------------
     6. API PÚBLICA Y ARRANQUE
     ------------------------------------------------------------------ */

  window.SIS = {
    F: F, R: R, parseEntry: parseEntry, parseSis: parseSis, parseM: parseM,
    NOM: NOM, nombre: nombre, FORMATO: FORMATO,
    clone: clone, ident: ident, mulM: mulM, transM: transM, eqM: eqM,
    minor: minor, det: det, invAdj: invAdj,
    gauss: gauss, rango: rango, rref: rref, analiza: analiza, cramer: cramer,
    k: k, kd: kd, texM: texM, view: view, viewDet: viewDet, viewAmp: viewAmp,
    texSistema: texSistema, texSolucion: texSolucion, etiqueta: etiqueta,
    renderTex: renderTex, stepsView: stepsView,
    ok: ok, info: info, warn: warn, err: err, esc: esc,
    build: build, need: need,
    reg: reg, registry: registry, log: []
  };

  var booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    var nodes = document.querySelectorAll('[data-applet-sis]');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.getAttribute('data-mounted') === '1') continue;
      var key = node.getAttribute('data-applet-sis');
      var fn = registry[key];
      node.setAttribute('data-mounted', '1');
      if (!fn) {
        node.classList.add('applet');
        node.innerHTML = '<div class="mx-bad ap-err">No existe ning\u00fan applet con la clave <code>' +
          esc(key) + '</code>. Claves disponibles: <code>' +
          Object.keys(registry).sort().join('</code>, <code>') + '</code>.</div>';
        window.SIS.log.push({ clave: key, error: 'clave inexistente' });
        continue;
      }
      try { fn(node); }
      catch (e) {
        node.classList.add('applet');
        node.innerHTML = '<div class="mx-bad ap-err">El applet <code>' + esc(key) +
          '</code> no ha podido montarse: ' + esc(e.message) + '</div>';
        window.SIS.log.push({ clave: key, error: e.message, stack: e.stack });
      }
    }
  }

  window.SIS.boot = boot;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); });
  } else {
    setTimeout(boot, 0);
  }
})();
