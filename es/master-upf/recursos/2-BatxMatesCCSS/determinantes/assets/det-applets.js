/* =====================================================================
   det-applets.js — MOTOR DEL TEMA 2 DETERMINANTES · 2.º Batx Mates CCSS
   Ubicación: 2-BatxMatesCCSS/determinantes/assets/det-applets.js

   QUÉ ES
     Motor propio en JavaScript plano, sin OJS y sin dependencias de red.
     Expone window.DET con aritmética EXACTA de fracciones, de modo que
     un determinante o una inversa nunca salen como 0.3333333333333.

     El núcleo numérico es el mismo que el del tema 1 de matrices, ya
     probado: fracciones con máximo común divisor, Gauss con registro
     de pasos, menores, adjuntos e inversa por adjuntos.

   DEPENDENCIAS (vía assets/_scripts.html)
     ../assets/applets.css · assets/det-applets.css
     ../assets/katex/katex.min.css · ../assets/katex/katex.min.js

   INSERCIÓN EN EL .qmd
     <div data-applet-det="clave"></div>

   CLAVES DE ESTE ARCHIVO (partes 1 y 2)
     orden23 · sarrus · ecuacion
     props · transforma · escalar · producto · reducir

   ARRANQUE
     DOMContentLoaded + setTimeout(boot, 0), el patrón unificado de los
     motores del curso, con guarda data-mounted para no montar dos veces.
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
     2. LECTURA DE MATRICES
     ------------------------------------------------------------------ */

  function parseM(txt) {
    var rows = String(txt == null ? '' : txt)
      .trim().split(/[\n;]+/)
      .map(function (r) { return r.trim(); })
      .filter(function (r) { return r.length > 0; });
    if (!rows.length) return { err: 'Escribe una matriz: una fila por línea.' };
    var M = [], cols = null;
    for (var i = 0; i < rows.length; i++) {
      var cells = rows[i].split(/[\s,]+/).filter(function (c) { return c.length > 0; });
      var row = [];
      for (var j = 0; j < cells.length; j++) {
        var v = parseEntry(cells[j]);
        if (!v) {
          return { err: 'No entiendo el elemento «' + cells[j] + '» de la fila ' + (i + 1) +
            '. Escribe enteros (3, -5), decimales con punto (2.5) o fracciones (3/4).' };
        }
        row.push(v);
      }
      if (cols === null) cols = row.length;
      else if (row.length !== cols) {
        return { err: 'Todas las filas deben tener el mismo número de elementos: la fila ' +
          (i + 1) + ' tiene ' + row.length + ' y la primera tiene ' + cols + '.' };
      }
      M.push(row);
    }
    return { M: M, r: M.length, c: cols, dim: M.length + '\u00d7' + cols };
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
  function zeros(m, n) {
    var Z = [];
    for (var i = 0; i < m; i++) { Z.push([]); for (var j = 0; j < n; j++) Z[i].push(R(0)); }
    return Z;
  }
  function addM(A, B) { return A.map(function (r, i) { return r.map(function (x, j) { return F.add(x, B[i][j]); }); }); }
  function subM(A, B) { return A.map(function (r, i) { return r.map(function (x, j) { return F.sub(x, B[i][j]); }); }); }
  function scaleM(k, A) { return A.map(function (r) { return r.map(function (x) { return F.mul(k, x); }); }); }
  function mulM(A, B) {
    var m = A.length, p = B.length, n = B[0].length, C = zeros(m, n);
    for (var i = 0; i < m; i++) for (var j = 0; j < n; j++) {
      var s = R(0);
      for (var k = 0; k < p; k++) s = F.add(s, F.mul(A[i][k], B[k][j]));
      C[i][j] = s;
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
  function subM2(A, rows, cols) {
    return rows.map(function (i) { return cols.map(function (j) { return A[i][j]; }); });
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
  function cofM(A) {
    var n = A.length, C = zeros(n, n);
    for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
      var m = det(minor(A, i, j));
      C[i][j] = ((i + j) % 2 === 0) ? m : F.neg(m);
    }
    return C;
  }
  function invAdj(A) {
    var d = det(A);
    if (F.isZero(d)) return null;
    return scaleM(F.div(R(1), d), transM(cofM(A)));
  }

  /* Escalonamiento con registro de pasos y control del signo del determinante */
  function gauss(A0) {
    var A = clone(A0), m = A.length, n = A[0].length;
    var steps = [{ lab: 'Matriz de partida', M: clone(A) }], r = 0, signo = 1;
    for (var c = 0; c < n && r < m; c++) {
      var p = -1;
      for (var i = r; i < m; i++) if (!F.isZero(A[i][c])) { p = i; break; }
      if (p < 0) continue;
      if (p !== r) {
        var t = A[r]; A[r] = A[p]; A[p] = t;
        signo = -signo;
        steps.push({ lab: 'F_{' + (r + 1) + '}\\leftrightarrow F_{' + (p + 1) + '}', M: clone(A), signo: true });
      }
      for (var i2 = r + 1; i2 < m; i2++) {
        if (F.isZero(A[i2][c])) continue;
        var f = F.div(A[i2][c], A[r][c]);
        for (var k = 0; k < n; k++) A[i2][k] = F.sub(A[i2][k], F.mul(f, A[r][k]));
        steps.push({
          lab: 'F_{' + (i2 + 1) + '}\\to F_{' + (i2 + 1) + '}-\\left(' + F.tex(f) + '\\right)F_{' + (r + 1) + '}',
          M: clone(A)
        });
      }
      r++;
    }
    return { M: A, steps: steps, rank: r, signo: signo };
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

  /* Matriz a LaTeX. env: 'pmatrix' (matriz) o 'vmatrix' (determinante) */
  function texM(A, opts) {
    opts = opts || {};
    var env = opts.bars ? 'vmatrix' : 'pmatrix';
    var body = A.map(function (row, i) {
      return row.map(function (x, j) {
        var s = F.tex(x);
        var hot = (opts.hi && opts.hi[0] === i && opts.hi[1] === j) ||
                  (opts.hiRow === i) || (opts.hiCol === j) ||
                  (opts.hiSet && opts.hiSet.some(function (p) { return p[0] === i && p[1] === j; }));
        return hot ? '\\boxed{' + s + '}' : s;
      }).join(' & ');
    }).join(' \\\\ ');
    return (opts.name ? opts.name + ' = ' : '') + '\\begin{' + env + '}' + body + '\\end{' + env + '}';
  }
  function view(A, opts) { return k(texM(A, opts)); }
  function viewDet(A, opts) {
    opts = opts || {}; opts.bars = true;
    return k(texM(A, opts));
  }

  function ok(m) { return '<div class="mx-ok">' + m + '</div>'; }
  function info(m) { return '<div class="mx-info">' + m + '</div>'; }
  function warn(m) { return '<div class="mx-warn">' + m + '</div>'; }
  function err(m) { return '<div class="mx-bad ap-err">' + m + '</div>'; }

  function stepsView(steps) {
    var h = '<div class="mx-steps">';
    steps.forEach(function (s) {
      h += '<div class="mx-step"><span class="mx-step-lab">' +
        (/[\\_]/.test(s.lab) ? k(s.lab) : s.lab) +
        (s.signo ? ' <b>(cambia el signo)</b>' : '') +
        '</span>' + viewDet(s.M) + '</div>';
    });
    return h + '</div>';
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

  function need(txt, nombre) {
    var p = parseM(txt);
    if (p.err) return { err: 'En la matriz ' + nombre + ': ' + p.err };
    return p;
  }
  function needSquare(txt, nombre) {
    var p = need(txt, nombre);
    if (p.err) return p;
    if (p.r !== p.c) {
      return { err: 'La matriz ' + nombre + ' es ' + p.dim + ', y <b>solo las matrices cuadradas tienen determinante</b>. ' +
        'Si no es cuadrada, no hay determinante que calcular: no es que valga cero, es que no existe.' };
    }
    return p;
  }

  /* ==================================================================
     PARTE 1 · DETERMINANTES
     ================================================================== */

  reg('orden23', function (node) {
    build(node, 'Applet \u00b7 Determinante de orden 1, 2 y 3',
      'Escribe una matriz <b>cuadrada</b> de orden 1, 2 o 3, con una fila por l\u00ednea. ' +
      'El applet marca los elementos que intervienen en cada producto y descompone el c\u00e1lculo. ' +
      'Ejemplos del libro: <code>-1 4<br>5 -6</code> (vale \u221214) \u00b7 ' +
      '<code>1 2 0<br>-1 3 -3<br>4 1 -2</code> \u00b7 <code>3 -2<br>7 12</code>. ' +
      'Prueba tambi\u00e9n una matriz que no sea cuadrada para ver el aviso.',
      [{ id: 'A', label: 'Matriz A (cuadrada)', rows: 4, value: '-1 4\n5 -6' }],
      function (v) {
        var p = needSquare(v.A, 'A');
        if (p.err) return err(p.err);
        var A = p.M, n = p.r;
        if (n > 3) return warn('Este applet llega hasta el orden 3. Para \u00f3rdenes mayores usa el applet ' +
          'de desarrollo por adjuntos o el de c\u00e1lculo formando ceros, en las partes 4 y siguientes. ' +
          'De todos modos, el valor es ' + k('|A| = ' + F.tex(det(A))) + '.');
        var h = '<div class="mx-flex">' + viewDet(A, { name: '|A|' }) + '</div>';
        if (n === 1) {
          h += '<p>El determinante de orden 1 es el propio n\u00famero: ' + k('|A| = ' + F.tex(A[0][0])) + '.</p>';
          h += info('Cuidado con no confundirlo con el valor absoluto. Aqu\u00ed las barras significan determinante, ' +
            'as\u00ed que ' + k('|(-5)| = -5') + ' y no 5.');
          return h;
        }
        if (n === 2) {
          var pos = F.mul(A[0][0], A[1][1]), neg = F.mul(A[0][1], A[1][0]);
          h += kd('|A| = a_{11}a_{22} - a_{12}a_{21} = ' +
            F.tex(A[0][0]) + '\\cdot' + F.tex(A[1][1]) + ' - ' +
            F.tex(A[0][1]) + '\\cdot' + F.tex(A[1][0]) + ' = ' +
            F.tex(pos) + ' - (' + F.tex(neg) + ') = ' + F.tex(F.sub(pos, neg)));
          h += '<div class="mx-grid">' + viewDet(A, { hiSet: [[0, 0], [1, 1]] }) +
            '<span>diagonal principal, con signo +</span></div>';
          h += '<div class="mx-grid">' + viewDet(A, { hiSet: [[0, 1], [1, 0]] }) +
            '<span>diagonal secundaria, con signo \u2212</span></div>';
          h += ok('Regla para orden 2: <b>producto de la diagonal principal menos producto de la secundaria</b>. ' +
            'Es la \u00fanica f\u00f3rmula del tema que hay que saberse de memoria sin excusa.');
          return h;
        }
        var posT = [[[0, 0], [1, 1], [2, 2]], [[0, 1], [1, 2], [2, 0]], [[0, 2], [1, 0], [2, 1]]];
        var negT = [[[0, 2], [1, 1], [2, 0]], [[0, 0], [1, 2], [2, 1]], [[0, 1], [1, 0], [2, 2]]];
        function bloque(lista, signo) {
          var suma = R(0), lineas = '';
          lista.forEach(function (tri) {
            var prod = R(1);
            tri.forEach(function (q) { prod = F.mul(prod, A[q[0]][q[1]]); });
            suma = F.add(suma, prod);
            lineas += '<div class="mx-step"><span class="mx-step-lab">' +
              k(tri.map(function (q) { return F.tex(A[q[0]][q[1]]); }).join('\\cdot') + ' = ' + F.tex(prod)) +
              '</span>' + viewDet(A, { hiSet: tri }) + '</div>';
          });
          return { suma: suma, html: '<div class="mx-steps">' + lineas + '</div>' };
        }
        var P = bloque(posT), N = bloque(negT);
        h += '<p><b>Los tres productos con signo +</b> (sentido de la diagonal principal):</p>' + P.html;
        h += '<p>Suman ' + k(F.tex(P.suma)) + '.</p>';
        h += '<p><b>Los tres productos con signo \u2212</b> (sentido de la diagonal secundaria):</p>' + N.html;
        h += '<p>Suman ' + k(F.tex(N.suma)) + '.</p>';
        h += kd('|A| = ' + F.tex(P.suma) + ' - (' + F.tex(N.suma) + ') = ' + F.tex(F.sub(P.suma, N.suma)));
        h += info('Seis productos de tres factores cada uno: en total ' + k('3! = 6') + ' sumandos, ' +
          'tres con signo m\u00e1s y tres con signo menos. Esa estructura es la <b>definici\u00f3n general</b> ' +
          'de determinante: ' + k('n!') + ' productos, la mitad con cada signo.');
        h += warn('Y ahora el aviso que ahorra disgustos: esta regla vale <b>solo</b> para orden 3. ' +
          'Para orden 4 hay 24 sumandos y la regla de Sarrus no sirve; hay que usar adjuntos o hacer ceros.');
        return h;
      });
  });

  reg('sarrus', function (node) {
    build(node, 'Applet \u00b7 Regla de Sarrus',
      'La regla de Sarrus es una forma visual de recordar los seis productos del orden 3: se repiten las ' +
      'dos primeras filas debajo y se leen las diagonales. Escribe una matriz de orden 3 y observa el esquema. ' +
      'Ejemplos: <code>1 2 3<br>4 5 6<br>7 8 9</code> (vale 0, \u00bfpor qu\u00e9?) \u00b7 ' +
      '<code>2 0 1<br>3 -1 2<br>1 4 0</code> \u00b7 <code>1 2 0<br>-1 3 -3<br>4 1 -2</code>.',
      [{ id: 'A', label: 'Matriz de orden 3', rows: 4, value: '2 0 1\n3 -1 2\n1 4 0' }],
      function (v) {
        var p = needSquare(v.A, 'A');
        if (p.err) return err(p.err);
        if (p.r !== 3) return err('La regla de Sarrus es exclusiva del <b>orden 3</b>, y tu matriz es de orden ' +
          p.r + '. Para orden 2 usa la diferencia de diagonales; para orden 4 o m\u00e1s, adjuntos.');
        var A = p.M;
        var amp = [A[0], A[1], A[2], A[0], A[1]];
        var h = '<p><b>Esquema de Sarrus:</b> se copian debajo las dos primeras filas.</p>';
        h += '<div class="mx-flex">' + view(amp) + '</div>';
        var pos = [[[0, 0], [1, 1], [2, 2]], [[1, 0], [2, 1], [3, 2]], [[2, 0], [3, 1], [4, 2]]];
        var neg = [[[2, 0], [1, 1], [0, 2]], [[3, 0], [2, 1], [1, 2]], [[4, 0], [3, 1], [2, 2]]];
        function suma(lista) {
          var s = R(0), txt = [];
          lista.forEach(function (tri) {
            var pr = R(1);
            tri.forEach(function (q) { pr = F.mul(pr, amp[q[0]][q[1]]); });
            s = F.add(s, pr);
            txt.push(tri.map(function (q) { return F.tex(amp[q[0]][q[1]]); }).join('\\cdot'));
          });
          return { s: s, txt: txt };
        }
        var P = suma(pos), N = suma(neg);
        h += '<p>Diagonales que <b>bajan</b> hacia la derecha, con signo +:</p>';
        h += kd(P.txt.join(' \\;+\\; ') + ' = ' + F.tex(P.s));
        h += '<p>Diagonales que <b>suben</b> hacia la derecha, con signo \u2212:</p>';
        h += kd(N.txt.join(' \\;+\\; ') + ' = ' + F.tex(N.s));
        h += kd('|A| = ' + F.tex(P.s) + ' - (' + F.tex(N.s) + ') = ' + F.tex(F.sub(P.s, N.s)));
        var d = det(A);
        h += F.eq(F.sub(P.s, N.s), d)
          ? ok('Coincide con el c\u00e1lculo directo: ' + k('|A| = ' + F.tex(d)) + '.')
          : err('Discrepancia interna, avisa al profesor.');
        if (F.isZero(d)) {
          h += warn('El determinante vale <b>cero</b>. Antes de dar por bueno el c\u00e1lculo, busca la causa: ' +
            '\u00bfhay una fila de ceros? \u00bfDos filas iguales o proporcionales? \u00bfUna fila que es suma de las otras? ' +
            'Con la matriz 1 2 3 / 4 5 6 / 7 8 9, la tercera fila es el doble de la segunda menos la primera.');
        }
        return h;
      });
  });

  reg('ecuacion', function (node) {
    build(node, 'Applet \u00b7 Ecuaciones con determinantes',
      'Un objetivo del tema: <b>resolver ecuaciones con determinantes</b>. Escribe una matriz usando la letra ' +
      '<code>x</code> en las posiciones que quieras, y el applet desarrolla el determinante, plantea la ecuaci\u00f3n ' +
      'y la resuelve. Formas admitidas en cada casilla: <code>x</code>, <code>-x</code>, <code>2x</code>, ' +
      '<code>x+1</code>, <code>x-3</code>, <code>3x-2</code> y n\u00fameros. ' +
      'Ejemplos del libro: <code>1 x<br>x 1</code> igual a 0 \u00b7 <code>3x -1<br>2 1</code> igual a 0 \u00b7 ' +
      '<code>x 1<br>1 x</code> igual a 3.',
      [
        { id: 'A', label: 'Matriz con la inc\u00f3gnita x', rows: 4, value: '1 x\nx 1' },
        { id: 'b', label: 'El determinante debe valer', type: 'text', value: '0' }
      ],
      function (v) {
        /* Evalúa el determinante en varios valores de x y ajusta un polinomio */
        function lin(s, xv) {
          s = String(s).trim().replace(/\s+/g, '');
          if (!/^[-+0-9x.\/]+$/.test(s)) return null;
          var m2 = s.match(/^([+-]?)(\d*(?:\.\d+)?)x([+-]\d+(?:\.\d+)?)?$/);
          if (m2) {
            var co = m2[2] === '' ? 1 : parseFloat(m2[2]);
            if (m2[1] === '-') co = -co;
            return co * xv + (m2[3] ? parseFloat(m2[3]) : 0);
          }
          var m3 = s.match(/^([+-]?\d+(?:\.\d+)?)([+-])x$/);
          if (m3) return parseFloat(m3[1]) + (m3[2] === '-' ? -xv : xv);
          var num = parseFloat(s);
          return isNaN(num) ? null : num;
        }
        function grid(txt, xv) {
          var rows = String(txt).trim().split(/[\n;]+/).map(function (r) { return r.trim(); }).filter(function (r) { return r.length; });
          var G = [], c = null;
          for (var i = 0; i < rows.length; i++) {
            var cells = rows[i].split(/[\s,]+/).filter(function (s) { return s.length; });
            var row = [];
            for (var j = 0; j < cells.length; j++) {
              var x = lin(cells[j], xv);
              if (x === null) return { err: 'No entiendo \u00ab' + cells[j] + '\u00bb. Usa n\u00fameros o expresiones lineales en x: x, 2x, x-3, 3x+1.' };
              row.push(x);
            }
            if (c === null) c = row.length; else if (row.length !== c) return { err: 'Las filas no tienen el mismo n\u00famero de elementos.' };
            G.push(row);
          }
          if (!G.length) return { err: 'Escribe una matriz.' };
          if (G.length !== c) return { err: 'La matriz debe ser cuadrada: la tuya es ' + G.length + '\u00d7' + c + '.' };
          return { M: G, n: G.length };
        }
        function detN(A) {
          var n = A.length;
          if (n === 1) return A[0][0];
          if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
          var s = 0;
          for (var j = 0; j < n; j++) {
            if (Math.abs(A[0][j]) < 1e-14) continue;
            var sub = A.slice(1).map(function (r) { return r.filter(function (_, c) { return c !== j; }); });
            s += (j % 2 === 0 ? 1 : -1) * A[0][j] * detN(sub);
          }
          return s;
        }
        var g0 = grid(v.A, 0);
        if (g0.err) return err(g0.err);
        var n = g0.n;
        var bb = parseEntry(v.b);
        if (!bb) return err('El valor del segundo miembro no vale. Escribe un entero, un decimal con punto o una fracci\u00f3n.');
        var bnum = F.num(bb);

        /* Muestra simbólica de la matriz */
        var rowsTxt = String(v.A).trim().split(/[\n;]+/).map(function (r) { return r.trim(); }).filter(function (r) { return r.length; });
        var simb = rowsTxt.map(function (r) { return r.split(/[\s,]+/).filter(function (s) { return s.length; }).join(' & '); }).join(' \\\\ ');
        var h = '<div class="mx-flex">' + k('\\begin{vmatrix}' + simb + '\\end{vmatrix} = ' + F.tex(bb)) + '</div>';

        /* Coeficientes del polinomio por interpolación en 0,1,...,n */
        var vals = [];
        for (var t = 0; t <= n; t++) {
          var gt = grid(v.A, t);
          if (gt.err) return err(gt.err);
          vals.push(detN(gt.M));
        }
        /* Diferencias finitas para obtener el grado real */
        var grado = 0;
        var dif = vals.slice();
        for (var q = 1; q <= n; q++) {
          var nd = [];
          for (var i2 = 0; i2 + 1 < dif.length; i2++) nd.push(dif[i2 + 1] - dif[i2]);
          if (nd.every(function (z) { return Math.abs(z) < 1e-9; })) { grado = q - 1; break; }
          dif = nd; grado = q;
        }
        h += '<p>Desarrollando el determinante queda un polinomio de grado <b>' + grado + '</b> en ' + k('x') + '.</p>';

        /* Resolución numérica: grado 1 y 2 exactos, grado ≥3 por barrido */
        var sols = [];
        if (grado === 0) {
          h += (Math.abs(vals[0] - bnum) < 1e-9)
            ? ok('El determinante no depende de ' + k('x') + ' y vale exactamente ' + k(String(vals[0])) +
              ', igual que el segundo miembro. La igualdad se cumple para <b>cualquier</b> valor de ' + k('x') + '.')
            : err('El determinante no depende de ' + k('x') + ': vale siempre ' + String(vals[0]) +
              ', que es distinto de ' + F.tex(bb) + '. La ecuaci\u00f3n <b>no tiene soluci\u00f3n</b>.');
          return h;
        }
        if (grado === 1) {
          var a1 = vals[1] - vals[0], a0 = vals[0] - bnum;
          var s1 = -a0 / a1;
          sols.push(s1);
          h += kd((a1 === 1 ? '' : String(a1)) + 'x ' + (a0 >= 0 ? '+ ' + a0 : '- ' + (-a0)) + ' = 0 \\;\\Rightarrow\\; x = ' + String(Math.round(s1 * 1e6) / 1e6));
        } else if (grado === 2) {
          var c0 = vals[0] - bnum;
          var c1 = (-3 * vals[0] + 4 * vals[1] - vals[2]) / 2;
          var c2 = (vals[0] - 2 * vals[1] + vals[2]) / 2;
          var disc = c1 * c1 - 4 * c2 * c0;
          h += kd(String(c2) + 'x^2 ' + (c1 >= 0 ? '+' : '-') + String(Math.abs(c1)) + 'x ' +
            (c0 >= 0 ? '+' : '-') + String(Math.abs(c0)) + ' = 0');
          if (disc < -1e-9) {
            h += warn('El discriminante es negativo: la ecuaci\u00f3n <b>no tiene soluciones reales</b>.');
            return h;
          }
          var raiz = Math.sqrt(Math.max(disc, 0));
          sols.push((-c1 + raiz) / (2 * c2));
          if (raiz > 1e-9) sols.push((-c1 - raiz) / (2 * c2));
        } else {
          for (var x = -20; x <= 20; x += 0.5) {
            var gx = grid(v.A, x);
            if (gx.err) break;
            if (Math.abs(detN(gx.M) - bnum) < 1e-9) sols.push(x);
          }
          h += info('Para grado 3 o superior el applet <b>busca</b> soluciones entre \u221220 y 20, de media en media. ' +
            'Puede haber ra\u00edces que no encuentre. Desarrolla el determinante a mano, saca factor com\u00fan ' +
            'y resuelve la ecuaci\u00f3n polin\u00f3mica: es lo que se pide en el examen.');
        }
        if (!sols.length) return h + warn('No se han encontrado soluciones en el intervalo explorado.');
        var fmt = function (z) { return String(Math.round(z * 1e6) / 1e6); };
        h += ok('Soluciones: ' + sols.map(function (z) { return k('x = ' + fmt(z)); }).join(' \u00b7 '));
        /* Comprobación */
        var comp = sols.map(function (z) {
          var gz = grid(v.A, z);
          return '<div class="mx-flex"><span>Para ' + k('x = ' + fmt(z)) + '</span>' +
            viewDet(gz.M.map(function (r) { return r.map(function (u) { return parseEntry(String(Math.round(u * 1e4) / 1e4)) || R(0); }); })) +
            k('= ' + fmt(detN(gz.M))) + '</div>';
        }).join('');
        h += '<p><b>Comprobaci\u00f3n:</b></p>' + comp;
        return h;
      });
  });

  /* ==================================================================
     PARTE 2 · PROPIEDADES
     ================================================================== */

  reg('props', function (node) {
    build(node, 'Applet \u00b7 Comprobador de propiedades',
      'Escribe dos matrices cuadradas del <b>mismo orden</b> y el applet verifica una por una las propiedades ' +
      'del tema, diciendo si se cumplen y si son o no propiedades generales. ' +
      'Ejemplos: A = <code>2 1<br>3 4</code> y B = <code>1 0<br>2 5</code> \u00b7 ' +
      'A = <code>1 -1 2<br>-2 4 0<br>3 5 -1</code> con B = <code>1 0 0<br>0 2 0<br>0 0 3</code>.',
      [
        { id: 'A', label: 'Matriz A (cuadrada)', rows: 4, value: '2 1\n3 4' },
        { id: 'B', label: 'Matriz B (mismo orden)', rows: 4, value: '1 0\n2 5' }
      ],
      function (v) {
        var pa = needSquare(v.A, 'A'), pb = needSquare(v.B, 'B');
        if (pa.err) return err(pa.err);
        if (pb.err) return err(pb.err);
        if (pa.r !== pb.r) return err('A es de orden ' + pa.r + ' y B de orden ' + pb.r + '. Deben coincidir.');
        var A = pa.M, B = pb.M, n = pa.r;
        var dA = det(A), dB = det(B);
        var h = '<div class="mx-grid">' + viewDet(A, { name: '|A|' }) + k('= ' + F.tex(dA)) +
          viewDet(B, { name: '|B|' }) + k('= ' + F.tex(dB)) + '</div>';

        var filas = [];
        filas.push(['1. ' + k('|A| = |A^t|'), F.tex(det(transM(A))), F.eq(det(transM(A)), dA),
          'Siempre cierta. Por eso toda propiedad sobre filas vale igual para columnas.']);
        var AB = mulM(A, B);
        filas.push(['9. ' + k('|A\\cdot B| = |A|\\cdot|B|'), F.tex(det(AB)) + ' y ' + F.tex(F.mul(dA, dB)),
          F.eq(det(AB), F.mul(dA, dB)), 'Siempre cierta. El determinante s\u00ed respeta el producto.']);
        var S = addM(A, B);
        filas.push(['\u00bf' + k('|A+B| = |A|+|B|') + '?', F.tex(det(S)) + ' frente a ' + F.tex(F.add(dA, dB)),
          F.eq(det(S), F.add(dA, dB)), '<b>FALSA en general.</b> Si aqu\u00ed coinciden es casualidad de estos datos.']);
        var BA = mulM(B, A);
        filas.push([k('|AB| = |BA|'), F.tex(det(AB)) + ' y ' + F.tex(det(BA)), F.eq(det(AB), det(BA)),
          'Siempre cierta, aunque ' + k('AB \\neq BA') + '. Los determinantes son n\u00fameros y s\u00ed conmutan.']);
        var kk = R(2);
        filas.push(['8. ' + k('|kA| = k^n|A|') + ' con ' + k('k=2'), F.tex(det(scaleM(kk, A))) +
          ' y ' + k('2^{' + n + '}\\cdot' + F.tex(dA) + ' = ' + F.tex(F.mul(R(Math.pow(2, n)), dA))),
          F.eq(det(scaleM(kk, A)), F.mul(R(Math.pow(2, n)), dA)),
          'Siempre cierta. El factor sale de <b>cada</b> una de las ' + n + ' filas, no una sola vez.']);
        if (!F.isZero(dA)) {
          filas.push(['10. ' + k('|A^{-1}| = 1/|A|'), F.tex(det(invAdj(A))) + ' y ' + F.tex(F.div(R(1), dA)),
            F.eq(det(invAdj(A)), F.div(R(1), dA)), 'Siempre cierta cuando la inversa existe.']);
        }

        h += '<table class="ap-tbl"><thead><tr><th>Propiedad</th><th>Valores</th><th>\u00bfSe cumple?</th><th>Comentario</th></tr></thead><tbody>';
        filas.forEach(function (f) {
          h += '<tr><td>' + f[0] + '</td><td>' + f[1] + '</td><td>' + (f[2] ? '\u2714 s\u00ed' : '\u2717 no') +
            '</td><td>' + f[3] + '</td></tr>';
        });
        h += '</tbody></table>';
        h += warn('El error cl\u00e1sico n.\u00ba 1 del tema: <b>el determinante no es lineal respecto de la suma</b>. ' +
          k('|A+B| \\neq |A|+|B|') + ' en general, mientras que ' + k('|AB| = |A||B|') + ' s\u00ed se cumple siempre.');
        h += info('Y un dato con truco para examen: si ' + k('|A| = 3') + ' y ' + k('|2A| = 48') +
          ', entonces ' + k('2^n\\cdot 3 = 48') + ', luego ' + k('2^n = 16') + ' y el orden de A es 4.');
        return h;
      });
  });

  reg('transforma', function (node) {
    build(node, 'Applet \u00b7 Efecto de las transformaciones',
      'Aqu\u00ed se ve <b>qu\u00e9 le hace al determinante</b> cada transformaci\u00f3n elemental. Escribe una matriz cuadrada, ' +
      'elige la operaci\u00f3n y observa c\u00f3mo cambia, o no cambia, el valor. ' +
      'Es la base de todo el m\u00e9todo de hacer ceros. Ejemplo: <code>1 2 3<br>0 -1 4<br>5 2 0</code>.',
      [
        { id: 'A', label: 'Matriz A (cuadrada)', rows: 4, value: '1 2 3\n0 -1 4\n5 2 0' },
        { id: 'op', label: 'Transformaci\u00f3n', type: 'select', value: 'Intercambiar F1 y F2',
          options: ['Intercambiar F1 y F2', 'Multiplicar F1 por 3', 'F2 \u2192 F2 + 4\u00b7F1', 'Trasponer', 'Poner F2 igual a F1'] }
      ],
      function (v) {
        var p = needSquare(v.A, 'A');
        if (p.err) return err(p.err);
        var A = p.M, n = p.r, d = det(A), B, expl, esperado;
        if (v.op === 'Intercambiar F1 y F2') {
          if (n < 2) return err('Necesitas al menos orden 2.');
          B = clone(A); var t = B[0]; B[0] = B[1]; B[1] = t;
          esperado = F.neg(d);
          expl = 'Propiedad 4: al intercambiar dos filas el determinante <b>cambia de signo</b>. ' +
            'Y ojo, si intercambias tres filas de forma c\u00edclica, el determinante <b>no</b> var\u00eda, porque son dos intercambios.';
        } else if (v.op === 'Multiplicar F1 por 3') {
          B = clone(A); B[0] = B[0].map(function (x) { return F.mul(R(3), x); });
          esperado = F.mul(R(3), d);
          expl = 'Propiedad 3: al multiplicar <b>una sola fila</b> por 3, el determinante queda multiplicado por 3. ' +
            'No confundir con multiplicar toda la matriz, que lo multiplicar\u00eda por ' + k('3^{' + n + '}') + '.';
        } else if (v.op === 'F2 \u2192 F2 + 4\u00b7F1') {
          if (n < 2) return err('Necesitas al menos orden 2.');
          B = clone(A);
          B[1] = B[1].map(function (x, j) { return F.add(x, F.mul(R(4), A[0][j])); });
          esperado = d;
          expl = 'Propiedad 5: sumar a una fila un m\u00faltiplo de otra <b>no cambia</b> el determinante. ' +
            'Esta es la propiedad estrella: es la que permite hacer ceros con total tranquilidad.';
        } else if (v.op === 'Trasponer') {
          B = transM(A);
          esperado = d;
          expl = 'Propiedad 1: ' + k('|A| = |A^t|') + '. Filas y columnas juegan el mismo papel.';
        } else {
          if (n < 2) return err('Necesitas al menos orden 2.');
          B = clone(A); B[1] = A[0].slice();
          esperado = R(0);
          expl = 'Propiedad 6: con dos filas <b>iguales</b> el determinante es cero. Lo mismo si son proporcionales, ' +
            'o si una es combinaci\u00f3n lineal de las dem\u00e1s.';
        }
        var dB = det(B);
        var h = '<div class="mx-grid">' + viewDet(A, { name: '|A|' }) + k('= ' + F.tex(d)) + '</div>';
        h += '<div class="mx-grid">' + viewDet(B, { name: '|B|' }) + k('= ' + F.tex(dB)) + '</div>';
        h += F.eq(dB, esperado)
          ? ok(expl + '<br>Comprobado: el valor esperado era ' + k(F.tex(esperado)) + ' y sale ' + k(F.tex(dB)) + '.')
          : err('Discrepancia inesperada, avisa al profesor.');
        h += info('Consecuencia pr\u00e1ctica: las transformaciones que <b>no</b> alteran el determinante son las de la ' +
          'propiedad 5. Las otras s\u00ed lo alteran, y si las usas debes <b>compensar</b> el cambio al final. ' +
          'Es el descuido que m\u00e1s ejercicios estropea al hacer ceros.');
        return h;
      });
  });

  reg('escalar', function (node) {
    build(node, 'Applet \u00b7 Determinante de kA',
      'Explora la propiedad ' + k('|kA| = k^n|A|') + ', que es la que m\u00e1s se falla del tema. ' +
      'Escribe una matriz cuadrada y mueve el deslizador del escalar; fíjate en c\u00f3mo influye el <b>orden</b>. ' +
      'Prueba la misma ' + k('k') + ' con una matriz de orden 2 y otra de orden 3 y compara.',
      [
        { id: 'A', label: 'Matriz A (cuadrada)', rows: 4, value: '2 1\n3 4' },
        { id: 'k', label: 'Escalar k', type: 'range', min: -4, max: 5, value: 2 }
      ],
      function (v) {
        var p = needSquare(v.A, 'A');
        if (p.err) return err(p.err);
        var A = p.M, n = p.r, kk = R(parseInt(v.k, 10));
        var d = det(A), kA = scaleM(kk, A), dk = det(kA);
        var pot = R(Math.pow(F.num(kk), n));
        var h = '<div class="mx-grid">' + viewDet(A, { name: '|A|' }) + k('= ' + F.tex(d)) + '</div>';
        h += '<div class="mx-grid">' + k(F.tex(kk) + 'A') + view(kA) + '</div>';
        h += '<div class="mx-grid">' + viewDet(kA, { name: '|' + F.tex(kk) + 'A|' }) + k('= ' + F.tex(dk)) + '</div>';
        h += kd('|kA| = k^{n}|A| = ' + F.tex(kk) + '^{' + n + '}\\cdot' + F.tex(d) + ' = ' +
          F.tex(pot) + '\\cdot' + F.tex(d) + ' = ' + F.tex(F.mul(pot, d)));
        h += F.eq(dk, F.mul(pot, d))
          ? ok('Coincide. El exponente es el <b>orden</b> de la matriz, ' + n + ', porque el factor ' +
            k('k') + ' se extrae de cada una de las ' + n + ' filas.')
          : err('Discrepancia inesperada.');
        h += warn('Con ' + k('|A| = 5') + ' y orden 3, ' + k('|2A| = 2^3\\cdot 5 = 40') + ', no 10. ' +
          'Mucha gente responde 10 en el examen, y es el error m\u00e1s frecuente de todo el apartado de propiedades.');
        return h;
      });
  });

  reg('producto', function (node) {
    build(node, 'Applet \u00b7 Determinante de un producto',
      'Comprueba ' + k('|AB| = |A|\\cdot|B|') + ' y, de paso, que ' + k('|A+B| \\neq |A|+|B|') + '. ' +
      'Escribe dos matrices cuadradas del mismo orden. ' +
      'Ejemplo del libro: si ' + k('|A| = 20') + ' y ' + k('|B| = 30') + ' entonces ' + k('|AB| = 600') + '. ' +
      'Prueba A = <code>1 0<br>0 1</code> con B = <code>-1 0<br>0 -1</code> y observa el caso de la suma.',
      [
        { id: 'A', label: 'Matriz A', rows: 3, value: '1 2\n3 4' },
        { id: 'B', label: 'Matriz B', rows: 3, value: '2 0\n1 3' }
      ],
      function (v) {
        var pa = needSquare(v.A, 'A'), pb = needSquare(v.B, 'B');
        if (pa.err) return err(pa.err);
        if (pb.err) return err(pb.err);
        if (pa.r !== pb.r) return err('Los \u00f3rdenes deben coincidir: A es ' + pa.dim + ' y B es ' + pb.dim + '.');
        var A = pa.M, B = pb.M, dA = det(A), dB = det(B);
        var AB = mulM(A, B), S = addM(A, B);
        var h = '<div class="mx-grid">' + viewDet(A, { name: '|A|' }) + k('= ' + F.tex(dA)) +
          viewDet(B, { name: '|B|' }) + k('= ' + F.tex(dB)) + '</div>';
        h += '<hr class="mx-sep"><p><b>Producto</b></p>';
        h += '<div class="mx-grid">' + view(AB, { name: 'A\\cdot B' }) + viewDet(AB) + k('= ' + F.tex(det(AB))) + '</div>';
        h += kd('|A|\\cdot|B| = ' + F.tex(dA) + '\\cdot' + F.tex(dB) + ' = ' + F.tex(F.mul(dA, dB)));
        h += F.eq(det(AB), F.mul(dA, dB))
          ? ok('Se cumple ' + k('|AB| = |A|\\cdot|B|') + '. Esta propiedad es <b>siempre</b> cierta.')
          : err('Discrepancia inesperada.');
        h += '<hr class="mx-sep"><p><b>Suma</b></p>';
        h += '<div class="mx-grid">' + view(S, { name: 'A+B' }) + viewDet(S) + k('= ' + F.tex(det(S))) + '</div>';
        h += kd('|A|+|B| = ' + F.tex(dA) + ' + ' + F.tex(dB) + ' = ' + F.tex(F.add(dA, dB)));
        h += F.eq(det(S), F.add(dA, dB))
          ? warn('Aqu\u00ed coinciden, pero es <b>pura casualidad</b> de estos n\u00fameros. Cambia un elemento y ver\u00e1s ' +
            'que se rompe: no es una propiedad.')
          : err('No coinciden, y eso es lo normal: ' + k('|A+B| \\neq |A| + |B|') + '. ' +
            'El determinante no se reparte sobre la suma.');
        h += info('Consecuencias que salen en examen: ' + k('|A^2| = |A|^2') + ', y si ' + k('|M| = 6') +
          ' entonces ' + k('|M^3| = 216') + '. Y si A tiene inversa, ' + k('|A^{-1}| = 1/|A|') + '.');
        return h;
      });
  });

  reg('reducir', function (node) {
    build(node, 'Applet \u00b7 Reducir a un determinante conocido',
      'Otro objetivo del tema: <b>reducir un determinante a otro cuyo valor se conoce</b>. ' +
      'Parte de un determinante gen\u00e9rico de orden 3 con valor conocido ' + k('D') +
      ' y aplica transformaciones; el applet te dice cu\u00e1nto vale el resultado <b>en funci\u00f3n de D</b>, ' +
      'sin necesidad de saber los n\u00fameros. Elige varias transformaciones y observa el factor acumulado.',
      [
        { id: 'D', label: 'Valor de D', type: 'text', value: '5' },
        { id: 't1', label: 'Transformaci\u00f3n 1', type: 'select', value: 'Multiplicar F1 por 2',
          options: ['(ninguna)', 'Multiplicar F1 por 2', 'Multiplicar F1 por 3', 'Intercambiar F1 y F3', 'Trasponer', 'F2 \u2192 F2 + 5F1'] },
        { id: 't2', label: 'Transformaci\u00f3n 2', type: 'select', value: 'Multiplicar F3 por 2',
          options: ['(ninguna)', 'Multiplicar F2 por 2', 'Multiplicar F3 por 2', 'Intercambiar F2 y F3', 'Multiplicar toda la matriz por 2', 'F1 \u2192 F1 - 3F2'] }
      ],
      function (v) {
        var D = parseEntry(v.D);
        if (!D) return err('Escribe un valor num\u00e9rico para D.');
        var factor = R(1), signo = 1, pasos = [];
        function aplicar(t) {
          if (t === '(ninguna)') return;
          if (t === 'Multiplicar F1 por 2' || t === 'Multiplicar F2 por 2' || t === 'Multiplicar F3 por 2') {
            factor = F.mul(factor, R(2));
            pasos.push([t, 'una sola fila por 2', '\\times 2']);
          } else if (t === 'Multiplicar F1 por 3') {
            factor = F.mul(factor, R(3));
            pasos.push([t, 'una sola fila por 3', '\\times 3']);
          } else if (t === 'Multiplicar toda la matriz por 2') {
            factor = F.mul(factor, R(8));
            pasos.push([t, 'las TRES filas por 2, luego ' + k('2^3'), '\\times 2^3 = \\times 8']);
          } else if (t.indexOf('Intercambiar') === 0) {
            signo = -signo;
            pasos.push([t, 'intercambio de dos filas', '\\times(-1)']);
          } else if (t === 'Trasponer') {
            pasos.push([t, 'no cambia nada', '\\times 1']);
          } else {
            pasos.push([t, 'sumar a una fila un m\u00faltiplo de otra: no cambia nada', '\\times 1']);
          }
        }
        aplicar(v.t1); aplicar(v.t2);
        var total = F.mul(factor, R(signo));
        var h = '<p>Partimos de un determinante de orden 3 con ' + k('D = ' + F.tex(D)) + '.</p>';
        if (!pasos.length) return h + info('Elige alguna transformaci\u00f3n para ver su efecto.');
        h += '<table class="ap-tbl"><thead><tr><th>Transformaci\u00f3n</th><th>Qu\u00e9 hace</th><th>Factor</th></tr></thead><tbody>';
        pasos.forEach(function (pz) {
          h += '<tr><td>' + pz[0] + '</td><td>' + pz[1] + '</td><td>' + k(pz[2]) + '</td></tr>';
        });
        h += '</tbody></table>';
        h += kd('\\text{nuevo determinante} = ' + F.tex(total) + '\\cdot D = ' +
          F.tex(total) + '\\cdot' + F.tex(D) + ' = ' + F.tex(F.mul(total, D)));
        h += info('As\u00ed se resuelven los ejercicios del tipo \u00absabiendo que ' + k('|A| = 5') +
          ', calcula el determinante de esta otra matriz\u00bb. No hace falta conocer ni un solo elemento: ' +
          'basta seguir la pista de los factores.');
        h += warn('El descuido t\u00edpico: multiplicar <b>toda</b> la matriz por 2 y anotar factor 2. ' +
          'Son las tres filas, as\u00ed que el factor es ' + k('2^3 = 8') + '.');
        return h;
      });
  });

  /* ------------------------------------------------------------------
     6. API PÚBLICA Y ARRANQUE
     ------------------------------------------------------------------ */

  window.DET = {
    F: F, R: R, parseEntry: parseEntry, parseM: parseM,
    clone: clone, ident: ident, zeros: zeros,
    addM: addM, subM: subM, scaleM: scaleM, mulM: mulM, transM: transM, eqM: eqM,
    minor: minor, subM2: subM2, det: det, cofM: cofM, invAdj: invAdj, gauss: gauss,
    k: k, kd: kd, texM: texM, view: view, viewDet: viewDet, renderTex: renderTex,
    ok: ok, info: info, warn: warn, err: err, stepsView: stepsView, esc: esc,
    build: build, need: need, needSquare: needSquare,
    reg: reg, registry: registry, log: []
  };

  var booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    var nodes = document.querySelectorAll('[data-applet-det]');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.getAttribute('data-mounted') === '1') continue;
      var key = node.getAttribute('data-applet-det');
      var fn = registry[key];
      node.setAttribute('data-mounted', '1');
      if (!fn) {
        node.classList.add('applet');
        node.innerHTML = '<div class="mx-bad ap-err">No existe ning\u00fan applet con la clave <code>' +
          esc(key) + '</code>. Claves disponibles: <code>' +
          Object.keys(registry).sort().join('</code>, <code>') + '</code>.</div>';
        window.DET.log.push({ clave: key, error: 'clave inexistente' });
        continue;
      }
      try { fn(node); }
      catch (e) {
        node.classList.add('applet');
        node.innerHTML = '<div class="mx-bad ap-err">El applet <code>' + esc(key) +
          '</code> no ha podido montarse: ' + esc(e.message) + '</div>';
        window.DET.log.push({ clave: key, error: e.message, stack: e.stack });
      }
    }
  }

  window.DET.boot = boot;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); });
  } else {
    setTimeout(boot, 0);
  }
})();
