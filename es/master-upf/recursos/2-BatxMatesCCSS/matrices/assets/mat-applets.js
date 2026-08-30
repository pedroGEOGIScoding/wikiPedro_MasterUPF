/* =====================================================================
   mat-applets.js — MOTOR DEL TEMA 1 MATRICES · 2.º Batx Mates CCSS
   Ubicación: 2-BatxMatesCCSS/matrices/assets/mat-applets.js

   QUÉ ES
     Motor propio en JavaScript plano, sin OJS y sin dependencias de red.
     Expone window.MAT con aritmética EXACTA de fracciones, de modo que
     un rango o una inversa nunca salen como 0.3333333333333.

   DEPENDENCIAS (vía assets/_scripts.html)
     ../assets/applets.css · assets/mat-applets.css
     ../assets/katex/katex.min.css · ../assets/katex/katex.min.js

   INSERCIÓN EN EL .qmd
     <div data-applet-mat="clave"></div>

   CLAVES DE ESTE ARCHIVO (partes 1, 2 y 3)
     dimension · elemento · tipos · igualdad
     transpuesta · simetrica
     dimensiones · suma · escalar · producto · noconmuta · potencia

   ARRANQUE
     document.addEventListener('DOMContentLoaded', ...) y además
     setTimeout(boot, 0), el patrón unificado de los motores del curso:
     así el montaje ocurre después de que KaTeX (cargado con defer)
     esté disponible, y nunca se monta dos veces.
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
    zero: R(0), one: R(1),
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

  /* Lee un elemento: entero, decimal con punto o fracción a/b */
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
     3. ÁLGEBRA MATRICIAL EXACTA
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
  function addM(A, B) {
    return A.map(function (r, i) { return r.map(function (x, j) { return F.add(x, B[i][j]); }); });
  }
  function subM(A, B) {
    return A.map(function (r, i) { return r.map(function (x, j) { return F.sub(x, B[i][j]); }); });
  }
  function scaleM(k, A) {
    return A.map(function (r) { return r.map(function (x) { return F.mul(k, x); }); });
  }
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
  function isZeroM(A) {
    for (var i = 0; i < A.length; i++) for (var j = 0; j < A[0].length; j++) if (!F.isZero(A[i][j])) return false;
    return true;
  }
  function powM(A, k) {
    var P = ident(A.length);
    for (var i = 0; i < k; i++) P = mulM(P, A);
    return P;
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

  /* Escalonamiento de Gauss con registro de pasos */
  function gauss(A0, stopCol) {
    var A = clone(A0), m = A.length, n = A[0].length;
    var limit = (stopCol === undefined) ? n : stopCol;
    var steps = [{ lab: 'Matriz de partida', M: clone(A) }], r = 0, piv = [];
    for (var c = 0; c < limit && r < m; c++) {
      var p = -1;
      for (var i = r; i < m; i++) if (!F.isZero(A[i][c])) { p = i; break; }
      if (p < 0) continue;
      if (p !== r) {
        var t = A[r]; A[r] = A[p]; A[p] = t;
        steps.push({ lab: 'F_{' + (r + 1) + '}\\leftrightarrow F_{' + (p + 1) + '}', M: clone(A) });
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
      piv.push([r, c]);
      r++;
    }
    return { M: A, steps: steps, rank: r, piv: piv };
  }

  /* Inversa por Gauss-Jordan sobre [A|I] */
  function gjInv(A0) {
    var n = A0.length, A = clone(A0);
    for (var i = 0; i < n; i++) A[i] = A[i].concat(ident(n)[i]);
    var steps = [{ lab: '\\left(A\\mid I\\right)', M: clone(A) }];
    for (var c = 0; c < n; c++) {
      var p = -1;
      for (var i2 = c; i2 < n; i2++) if (!F.isZero(A[i2][c])) { p = i2; break; }
      if (p < 0) return { singular: true, steps: steps, col: c };
      if (p !== c) {
        var t = A[c]; A[c] = A[p]; A[p] = t;
        steps.push({ lab: 'F_{' + (c + 1) + '}\\leftrightarrow F_{' + (p + 1) + '}', M: clone(A) });
      }
      if (!F.eq(A[c][c], R(1))) {
        var inv = F.div(R(1), A[c][c]);
        for (var k = 0; k < 2 * n; k++) A[c][k] = F.mul(inv, A[c][k]);
        steps.push({
          lab: 'F_{' + (c + 1) + '}\\to \\left(' + F.tex(inv) + '\\right)F_{' + (c + 1) + '}',
          M: clone(A)
        });
      }
      for (var i3 = 0; i3 < n; i3++) {
        if (i3 === c || F.isZero(A[i3][c])) continue;
        var f = A[i3][c];
        for (var k2 = 0; k2 < 2 * n; k2++) A[i3][k2] = F.sub(A[i3][k2], F.mul(f, A[c][k2]));
        steps.push({
          lab: 'F_{' + (i3 + 1) + '}\\to F_{' + (i3 + 1) + '}-\\left(' + F.tex(f) + '\\right)F_{' + (c + 1) + '}',
          M: clone(A)
        });
      }
    }
    var Inv = A.map(function (r) { return r.slice(n); });
    return { inv: Inv, steps: steps, singular: false };
  }

  /* Matriz de adjuntos y adjunta traspuesta */
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

  /* Forma reducida por filas y base del núcleo (para condiciones sobre X) */
  function rref(A0) {
    var A = clone(A0), m = A.length, n = A[0].length, r = 0, piv = [];
    for (var c = 0; c < n && r < m; c++) {
      var p = -1;
      for (var i = r; i < m; i++) if (!F.isZero(A[i][c])) { p = i; break; }
      if (p < 0) continue;
      var t = A[r]; A[r] = A[p]; A[p] = t;
      var inv = F.div(R(1), A[r][c]);
      for (var k = 0; k < n; k++) A[r][k] = F.mul(inv, A[r][k]);
      for (var i2 = 0; i2 < m; i2++) {
        if (i2 === r || F.isZero(A[i2][c])) continue;
        var f = A[i2][c];
        for (var k2 = 0; k2 < n; k2++) A[i2][k2] = F.sub(A[i2][k2], F.mul(f, A[r][k2]));
      }
      piv.push(c); r++;
    }
    return { M: A, rank: r, piv: piv };
  }

  function nullBasis(A) {
    var n = A[0].length, r = rref(A), free = [], basis = [];
    for (var c = 0; c < n; c++) if (r.piv.indexOf(c) < 0) free.push(c);
    free.forEach(function (fc) {
      var v = [];
      for (var i = 0; i < n; i++) v.push(R(0));
      v[fc] = R(1);
      for (var k = 0; k < r.piv.length; k++) v[r.piv[k]] = F.neg(r.M[k][fc]);
      basis.push(v);
    });
    return { basis: basis, free: free, rank: r.rank };
  }

  /* ------------------------------------------------------------------
     4. SALIDA: KaTeX SIN AUTO-RENDER
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
      } catch (e) {
        el.textContent = el.getAttribute('data-tex');
      }
    }
  }

  /* Matriz a LaTeX. opts: {name, split, hi:[i,j], hiRow, hiCol} */
  function texM(A, opts) {
    opts = opts || {};
    var env = opts.split !== undefined ? 'array' : 'pmatrix';
    var body = A.map(function (row, i) {
      return row.map(function (x, j) {
        var s = F.tex(x);
        var hot = (opts.hi && opts.hi[0] === i && opts.hi[1] === j) ||
                  (opts.hiRow === i) || (opts.hiCol === j);
        return hot ? '\\boxed{' + s + '}' : s;
      }).join(' & ');
    }).join(' \\\\ ');
    var out;
    if (opts.split !== undefined) {
      var spec = '';
      for (var j = 0; j < A[0].length; j++) spec += (j === opts.split ? '|c' : 'c');
      out = '\\left(\\begin{array}{' + spec + '}' + body + '\\end{array}\\right)';
    } else {
      out = '\\begin{pmatrix}' + body + '\\end{pmatrix}';
    }
    return (opts.name ? opts.name + ' = ' : '') + out;
  }

  function view(A, opts) { return k(texM(A, opts)); }

  function ok(msg) { return '<div class="mx-ok">' + msg + '</div>'; }
  function info(msg) { return '<div class="mx-info">' + msg + '</div>'; }
  function warn(msg) { return '<div class="mx-warn">' + msg + '</div>'; }
  function err(msg) { return '<div class="mx-bad ap-err">' + msg + '</div>'; }

  function stepsView(steps, split) {
    var h = '<div class="mx-steps">';
    steps.forEach(function (s) {
      h += '<div class="mx-step"><span class="mx-step-lab">' +
        (s.lab.indexOf('\\') >= 0 || s.lab.indexOf('_') >= 0 ? k(s.lab) : s.lab) +
        '</span>' + view(s.M, split !== undefined ? { split: split } : {}) + '</div>';
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

  /* Atajos de lectura con mensaje de error uniforme */
  function need(txt, nombre) {
    var p = parseM(txt);
    if (p.err) return { err: 'En la matriz ' + nombre + ': ' + p.err };
    return p;
  }
  function needSquare(txt, nombre) {
    var p = need(txt, nombre);
    if (p.err) return p;
    if (p.r !== p.c) return { err: 'La matriz ' + nombre + ' debe ser cuadrada, y la tuya es ' + p.dim + '.' };
    return p;
  }

  /* ==================================================================
     PARTE 1 · MATRICES
     ================================================================== */

  reg('dimension', function (node) {
    build(node, 'Applet \u00b7 Dimensi\u00f3n y elementos',
      'Escribe una matriz con <b>una fila por l\u00ednea</b> y los elementos separados por espacios o comas. ' +
      'Admite enteros, decimales con punto y fracciones. ' +
      'Ejemplos: <code>3 1 -2<br>4 -3 0</code> \u00b7 <code>1/2 0.5<br>-3 7</code>. ' +
      'Mueve los deslizadores para localizar el elemento ' + k('a_{ij}') + '.',
      [
        { id: 'A', label: 'Matriz A', rows: 3, value: '3 1 -2\n4 -3 0' },
        { id: 'i', label: 'Fila i', type: 'range', min: 1, max: 6, value: 2 },
        { id: 'j', label: 'Columna j', type: 'range', min: 1, max: 6, value: 3 }
      ],
      function (v) {
        var p = need(v.A, 'A');
        if (p.err) return err(p.err);
        var i = Math.min(parseInt(v.i, 10), p.r) - 1;
        var j = Math.min(parseInt(v.j, 10), p.c) - 1;
        var h = '<div class="mx-flex">' + view(p.M, { name: 'A', hi: [i, j] }) + '</div>';
        h += '<p>Dimensi\u00f3n: <span class="mx-badge">' + p.r + ' \u00d7 ' + p.c + '</span> ' +
          '(' + p.r + ' fila' + (p.r === 1 ? '' : 's') + ' y ' + p.c + ' columna' + (p.c === 1 ? '' : 's') +
          '), es decir ' + p.r * p.c + ' elementos en total.</p>';
        h += '<p>El elemento marcado es ' + k('a_{' + (i + 1) + (j + 1) + '} = ' + F.tex(p.M[i][j])) +
          ', que est\u00e1 en la fila ' + (i + 1) + ' y la columna ' + (j + 1) + '.</p>';
        h += info('Primero la fila, despu\u00e9s la columna. Siempre. ' +
          'En ' + k('a_{23}') + ' el 2 es la fila y el 3 la columna, no al contrario.');
        if (p.r === p.c) {
          var tr = R(0);
          for (var t = 0; t < p.r; t++) tr = F.add(tr, p.M[t][t]);
          h += ok('Es una matriz <b>cuadrada</b> de orden ' + p.r +
            '. Su diagonal principal es ' + k(p.M.map(function (r, x) { return F.tex(r[x]); }).join(',\\;')) +
            ' y su traza vale ' + k(F.tex(tr)) + '.');
        } else {
          h += warn('No es cuadrada, as\u00ed que <b>no</b> tiene diagonal principal, ni traza, ' +
            'ni determinante, ni inversa. Todo eso llegar\u00e1 solo con las cuadradas.');
        }
        return h;
      });
  });

  reg('elemento', function (node) {
    build(node, 'Applet \u00b7 Ley de formaci\u00f3n',
      'Aqu\u00ed la matriz no se escribe: se <b>genera</b> con una f\u00f3rmula. ' +
      'Usa <code>i</code> y <code>j</code>, con los operadores <code>+ - * /</code> y par\u00e9ntesis. ' +
      'Ejemplos: <code>i+j</code> \u00b7 <code>i-j</code> \u00b7 <code>i*j</code> \u00b7 <code>2*i-3*j</code> \u00b7 ' +
      '<code>(i-j)*(i-j)</code>. Prueba tambi\u00e9n <code>i==j</code>, que vale 1 en la diagonal y 0 fuera.',
      [
        { id: 'f', label: 'Ley a_ij =', type: 'text', value: 'i+j' },
        { id: 'm', label: 'Filas', type: 'range', min: 1, max: 5, value: 3 },
        { id: 'n', label: 'Columnas', type: 'range', min: 1, max: 5, value: 3 }
      ],
      function (v) {
        var txt = String(v.f).trim();
        if (!/^[0-9ij+\-*/(). =<>]*$/.test(txt) || !txt.length) {
          return err('La ley solo puede contener <code>i</code>, <code>j</code>, n\u00fameros, ' +
            'los operadores <code>+ - * /</code> y par\u00e9ntesis.');
        }
        var f;
        try { f = new Function('i', 'j', 'return (' + txt + ');'); }
        catch (e) { return err('No entiendo la f\u00f3rmula. Revisa los par\u00e9ntesis.'); }
        var m = parseInt(v.m, 10), n = parseInt(v.n, 10), M = [];
        for (var i = 1; i <= m; i++) {
          var row = [];
          for (var j = 1; j <= n; j++) {
            var x;
            try { x = f(i, j); } catch (e) { return err('La f\u00f3rmula falla al evaluarla.'); }
            if (typeof x === 'boolean') x = x ? 1 : 0;
            if (typeof x !== 'number' || !isFinite(x)) return err('La f\u00f3rmula no devuelve un n\u00famero en i=' + i + ', j=' + j + '.');
            var q = parseEntry(String(Math.round(x * 1000) / 1000));
            row.push(q || R(0));
          }
          M.push(row);
        }
        var h = '<p>' + k('a_{ij} = ' + txt.replace(/\*/g, '\\cdot ').replace(/==/g, '=')) + '</p>';
        h += '<div class="mx-flex">' + view(M, { name: 'A' }) + '</div>';
        h += info('As\u00ed se definen las matrices en los enunciados de examen: ' +
          '\u00abla matriz de orden 3 cuyos elementos cumplen ' + k('a_{ij}=i+j') + '\u00bb. ' +
          'Tu trabajo es rellenar casilla por casilla sustituyendo i y j.');
        if (eqM(M, transM(M))) h += ok('Ha salido <b>sim\u00e9trica</b>. Piensa por qu\u00e9: ' +
          '\u00bfqu\u00e9 le pasa a tu f\u00f3rmula si intercambias i y j?');
        return h;
      });
  });

  reg('tipos', function (node) {
    build(node, 'Applet \u00b7 Tipos de matriz',
      'Escribe cualquier matriz y el applet la clasifica seg\u00fan todos los tipos del temario, ' +
      'diciendo por qu\u00e9 cumple o no cada definici\u00f3n. ' +
      'Ejemplos para probar: <code>1 0 0<br>0 1 0<br>0 0 1</code> (identidad) \u00b7 ' +
      '<code>2 0 0<br>0 -3 0<br>0 0 5</code> (diagonal) \u00b7 <code>1 2 3<br>0 4 5<br>0 0 6</code> ' +
      '(triangular superior) \u00b7 <code>0 2 -1<br>-2 0 3<br>1 -3 0</code> (antisim\u00e9trica).',
      [{ id: 'A', label: 'Matriz A', rows: 4, value: '1 2 3\n0 4 5\n0 0 6' }],
      function (v) {
        var p = need(v.A, 'A');
        if (p.err) return err(p.err);
        var A = p.M, m = p.r, n = p.c, cuad = (m === n);
        function all(fn) {
          for (var i = 0; i < m; i++) for (var j = 0; j < n; j++) if (!fn(A[i][j], i, j)) return false;
          return true;
        }
        var tests = [
          ['Fila', m === 1, 'tiene una sola fila'],
          ['Columna', n === 1, 'tiene una sola columna'],
          ['Nula', isZeroM(A), 'todos sus elementos son cero'],
          ['Cuadrada', cuad, 'tiene tantas filas como columnas'],
          ['Triangular superior', cuad && all(function (x, i, j) { return j >= i || F.isZero(x); }), 'todo lo que hay debajo de la diagonal es cero'],
          ['Triangular inferior', cuad && all(function (x, i, j) { return j <= i || F.isZero(x); }), 'todo lo que hay encima de la diagonal es cero'],
          ['Diagonal', cuad && all(function (x, i, j) { return i === j || F.isZero(x); }), 'solo la diagonal puede ser distinta de cero'],
          ['Escalar', cuad && all(function (x, i, j) { return i === j ? F.eq(x, A[0][0]) : F.isZero(x); }), 'es diagonal y todos los elementos de la diagonal son iguales'],
          ['Identidad', cuad && eqM(A, ident(m)), 'es escalar con unos en la diagonal'],
          ['Sim\u00e9trica', cuad && eqM(A, transM(A)), k('a_{ij}=a_{ji}') + ', es un espejo respecto de la diagonal'],
          ['Antisim\u00e9trica', cuad && eqM(A, scaleM(R(-1), transM(A))), k('a_{ij}=-a_{ji}') + ', con ceros obligatorios en la diagonal']
        ];
        var h = '<div class="mx-flex">' + view(A, { name: 'A' }) +
          '<span><span class="mx-badge">' + p.dim + '</span></span></div>';
        h += '<table class="ap-tbl"><thead><tr><th>Tipo</th><th>\u00bfLo es?</th><th>Criterio</th></tr></thead><tbody>';
        tests.forEach(function (t) {
          h += '<tr><td><b>' + t[0] + '</b></td><td>' + (t[1] ? '\u2714 s\u00ed' : '\u2717 no') + '</td><td>' + t[2] + '</td></tr>';
        });
        h += '</tbody></table>';
        var si = tests.filter(function (t) { return t[1]; }).map(function (t) { return t[0]; });
        h += info('Tu matriz es a la vez: <b>' + (si.length ? si.join(', ') : 'ninguno de los tipos de la lista') +
          '</b>. Los tipos no son excluyentes: la identidad es diagonal, escalar, triangular por los dos lados y sim\u00e9trica.');
        return h;
      });
  });

  reg('igualdad', function (node) {
    build(node, 'Applet \u00b7 Igualdad de matrices con inc\u00f3gnitas',
      'Dos matrices son iguales cuando tienen la misma dimensi\u00f3n y coinciden elemento a elemento. ' +
      'Escribe las dos matrices usando en cualquier posici\u00f3n las letras <code>x</code>, <code>y</code>, <code>z</code>, ' +
      'con expresiones lineales del tipo <code>x</code>, <code>2x</code>, <code>x+1</code>, <code>3y-2</code>, <code>-z</code>. ' +
      'Ejemplo: A = <code>x+1 4<br>3 2z</code> y B = <code>5 4<br>3 8</code> debe dar ' +
      k('x=4') + ', ' + k('z=4') + '.',
      [
        { id: 'A', label: 'Matriz A', rows: 3, value: 'x+1 4\n3 2z' },
        { id: 'B', label: 'Matriz B', rows: 3, value: '5 4\n3 8' }
      ],
      function (v) {
        function lin(s) {
          s = String(s).trim().replace(/\s+/g, '');
          if (!s.length) return null;
          var co = { x: R(0), y: R(0), z: R(0) }, ct = R(0);
          var re = /([+-]?)(\d+\/\d+|\d*\.\d+|\d*)([xyz]?)/g, mt, any = false;
          while ((mt = re.exec(s)) !== null) {
            if (!mt[0].length) break;
            any = true;
            var sg = mt[1] === '-' ? -1 : 1;
            var num = mt[2] === '' ? R(1) : parseEntry(mt[2]);
            if (!num) return null;
            var val = F.mul(R(sg), num);
            if (mt[3]) co[mt[3]] = F.add(co[mt[3]], val);
            else ct = F.add(ct, val);
          }
          return any ? { co: co, ct: ct } : null;
        }
        function grid(txt) {
          var rows = String(txt).trim().split(/[\n;]+/).map(function (r) { return r.trim(); }).filter(function (r) { return r.length; });
          var G = [], c = null;
          for (var i = 0; i < rows.length; i++) {
            var cells = rows[i].split(/[\s,]+/).filter(function (s) { return s.length; });
            var row = [];
            for (var j = 0; j < cells.length; j++) {
              var e = lin(cells[j]);
              if (!e) return { err: 'No entiendo \u00ab' + cells[j] + '\u00bb. Usa expresiones lineales como 2x, x+1, -3y, 5.' };
              row.push({ raw: cells[j], e: e });
            }
            if (c === null) c = row.length; else if (row.length !== c) return { err: 'Las filas no tienen el mismo n\u00famero de elementos.' };
            G.push(row);
          }
          if (!G.length) return { err: 'Escribe una matriz.' };
          return { G: G, r: G.length, c: c };
        }
        var a = grid(v.A), b = grid(v.B);
        if (a.err) return err('En A: ' + a.err);
        if (b.err) return err('En B: ' + b.err);
        if (a.r !== b.r || a.c !== b.c) {
          return err('A es ' + a.r + '\u00d7' + a.c + ' y B es ' + b.r + '\u00d7' + b.c +
            '. Dos matrices de dimensiones distintas <b>nunca</b> son iguales, no hay nada que resolver.');
        }
        var h = '<div class="mx-flex">' +
          k('A=\\begin{pmatrix}' + a.G.map(function (r) { return r.map(function (c) { return c.raw; }).join(' & '); }).join(' \\\\ ') + '\\end{pmatrix}') +
          k('B=\\begin{pmatrix}' + b.G.map(function (r) { return r.map(function (c) { return c.raw; }).join(' & '); }).join(' \\\\ ') + '\\end{pmatrix}') +
          '</div>';
        var eqs = [], vars = ['x', 'y', 'z'];
        for (var i = 0; i < a.r; i++) for (var j = 0; j < a.c; j++) {
          var L = a.G[i][j].e, Rg = b.G[i][j].e, row = [];
          vars.forEach(function (t) { row.push(F.sub(L.co[t], Rg.co[t])); });
          row.push(F.sub(Rg.ct, L.ct));
          eqs.push({ row: row, pos: [i + 1, j + 1], txt: a.G[i][j].raw + ' = ' + b.G[i][j].raw });
        }
        var utiles = eqs.filter(function (e) { return !(F.isZero(e.row[0]) && F.isZero(e.row[1]) && F.isZero(e.row[2])); });
        var trivial = eqs.filter(function (e) { return F.isZero(e.row[0]) && F.isZero(e.row[1]) && F.isZero(e.row[2]); });
        var choque = trivial.filter(function (e) { return !F.isZero(e.row[3]); });
        h += '<p><b>Sistema que sale de igualar posici\u00f3n a posici\u00f3n:</b></p><ul>';
        eqs.forEach(function (e) {
          h += '<li>Posici\u00f3n (' + e.pos[0] + ',' + e.pos[1] + '): ' + k(e.txt) + '</li>';
        });
        h += '</ul>';
        if (choque.length) {
          return h + err('El sistema es <b>incompatible</b>: en la posici\u00f3n (' + choque[0].pos[0] + ',' +
            choque[0].pos[1] + ') queda ' + k(choque[0].txt) + ', que es falso y no depende de ninguna inc\u00f3gnita. ' +
            'No existen valores que hagan A = B.');
        }
        if (!utiles.length) return h + ok('Todas las igualdades se cumplen sin condiciones: A y B ya son iguales.');
        var Mx = utiles.map(function (e) { return e.row.slice(); });
        var rr = rref(Mx);
        var sol = {}, libre = [];
        vars.forEach(function (t, idx) {
          var p = rr.piv.indexOf(idx);
          if (p >= 0) {
            var otros = [];
            for (var c2 = idx + 1; c2 < 3; c2++) if (!F.isZero(rr.M[p][c2])) otros.push(vars[c2]);
            sol[t] = otros.length ? null : F.tex(rr.M[p][3]);
          } else if (utiles.some(function (e) { return !F.isZero(e.row[idx]); }) || false) {
            libre.push(t);
          }
        });
        var usadas = vars.filter(function (t, idx) { return utiles.some(function (e) { return !F.isZero(e.row[idx]); }); });
        h += '<p><b>Soluci\u00f3n:</b></p>';
        var lines = [];
        usadas.forEach(function (t) {
          lines.push(sol[t] !== undefined && sol[t] !== null ? k(t + ' = ' + sol[t]) : k(t) + ' queda libre o ligada a otra inc\u00f3gnita');
        });
        h += '<div class="mx-flex">' + lines.join('') + '</div>';
        if (usadas.every(function (t) { return sol[t] !== undefined && sol[t] !== null; })) {
          h += ok('Sistema compatible determinado: hay unos \u00fanicos valores que hacen A = B. ' +
            'Sustit\u00fayelos en las dos matrices y comprueba que quedan id\u00e9nticas.');
        } else {
          h += warn('El sistema no determina todas las inc\u00f3gnitas por separado: hay infinitas soluciones. ' +
            'Fija una inc\u00f3gnita y las dem\u00e1s quedan en funci\u00f3n de ella.');
        }
        return h;
      });
  });

  /* ==================================================================
     PARTE 2 · TRASPUESTA, SIMÉTRICA Y ANTISIMÉTRICA
     ================================================================== */

  reg('transpuesta', function (node) {
    build(node, 'Applet \u00b7 Matriz traspuesta',
      'Escribe una matriz cualquiera, no hace falta que sea cuadrada. El applet cambia filas por columnas ' +
      'y comprueba las cuatro propiedades de la traspuesta. ' +
      'Ejemplos: <code>1 2 3<br>4 5 6</code> \u00b7 <code>2 -1<br>0 3<br>5 5</code>. ' +
      'Con B del mismo tama\u00f1o se comprueba adem\u00e1s ' + k('(A+B)^t = A^t + B^t') + '.',
      [
        { id: 'A', label: 'Matriz A', rows: 3, value: '1 2 3\n4 5 6' },
        { id: 'B', label: 'Matriz B (opcional)', rows: 3, value: '0 1 -1\n2 0 3' }
      ],
      function (v) {
        var p = need(v.A, 'A');
        if (p.err) return err(p.err);
        var A = p.M, T = transM(A);
        var h = '<div class="mx-grid">' + view(A, { name: 'A' }) + view(T, { name: 'A^t' }) + '</div>';
        h += '<p>La dimensi\u00f3n se da la vuelta: A es ' + k(p.r + '\\times' + p.c) +
          ' y ' + k('A^t') + ' es ' + k(p.c + '\\times' + p.r) + '.</p>';
        h += info('Regla de lectura: la <b>fila</b> ' + k('i') + ' de A es la <b>columna</b> ' + k('i') +
          ' de ' + k('A^t') + '. El elemento ' + k('a_{ij}') + ' viaja a la posici\u00f3n ' + k('(j,i)') + '.');
        h += ok('Propiedad 1: ' + k('(A^t)^t = A') + '. ' +
          (eqM(transM(T), A) ? 'Comprobado, trasponer dos veces devuelve la matriz original.' : 'Revisa los datos.'));
        var pb = parseM(v.B);
        if (!pb.err && pb.r === p.r && pb.c === p.c) {
          var S = addM(A, pb.M);
          h += '<hr class="mx-sep"><div class="mx-grid">' + view(pb.M, { name: 'B' }) +
            view(transM(S), { name: '(A+B)^t' }) + view(addM(T, transM(pb.M)), { name: 'A^t+B^t' }) + '</div>';
          h += eqM(transM(S), addM(T, transM(pb.M)))
            ? ok('Propiedad 2: ' + k('(A+B)^t = A^t+B^t') + '. Con la suma, trasponer se reparte sin sorpresas.')
            : err('No coinciden: revisa los datos.');
        }
        if (p.r === p.c) {
          h += '<hr class="mx-sep">';
          h += eqM(A, T)
            ? ok('Adem\u00e1s A es <b>sim\u00e9trica</b>, porque coincide con su traspuesta.')
            : info('A no es sim\u00e9trica: ' + k('A \\neq A^t') + '. Prueba el applet siguiente para descomponerla.');
          var AB = mulM(A, A);
          h += '<p>Aviso importante para el producto: ' + k('(A\\cdot B)^t = B^t\\cdot A^t') +
            ', con el orden <b>invertido</b>. Con ' + k('A\\cdot A') + ' no lo notar\u00edas, ' +
            'pero con dos matrices distintas s\u00ed.</p>';
        }
        return h;
      });
  });

  reg('simetrica', function (node) {
    build(node, 'Applet \u00b7 Sim\u00e9trica y antisim\u00e9trica',
      'Escribe una matriz <b>cuadrada</b>. El applet dice si es sim\u00e9trica, antisim\u00e9trica o ninguna de las dos, ' +
      'y la descompone como suma de una sim\u00e9trica y una antisim\u00e9trica. ' +
      'Ejemplos: <code>1 5<br>5 2</code> (sim\u00e9trica) \u00b7 <code>0 3<br>-3 0</code> (antisim\u00e9trica) \u00b7 ' +
      '<code>1 2 3<br>4 5 6<br>7 8 9</code> (ninguna, y aqu\u00ed la descomposici\u00f3n se ve bien).',
      [{ id: 'A', label: 'Matriz A (cuadrada)', rows: 4, value: '1 2 3\n4 5 6\n7 8 9' }],
      function (v) {
        var p = needSquare(v.A, 'A');
        if (p.err) return err(p.err);
        var A = p.M, T = transM(A), n = p.r;
        var sim = eqM(A, T), anti = eqM(A, scaleM(R(-1), T));
        var half = R(1, 2);
        var S = scaleM(half, addM(A, T)), K = scaleM(half, subM(A, T));
        var h = '<div class="mx-grid">' + view(A, { name: 'A' }) + view(T, { name: 'A^t' }) + '</div>';
        if (sim) h += ok('Es <b>sim\u00e9trica</b>: ' + k('A = A^t') + ', o sea ' + k('a_{ij}=a_{ji}') + '.');
        else if (anti) h += ok('Es <b>antisim\u00e9trica</b>: ' + k('A = -A^t') + ', o sea ' + k('a_{ij}=-a_{ji}') +
          '. Fíjate en que la diagonal es toda de ceros, y eso es obligatorio: ' + k('a_{ii}=-a_{ii}') + ' fuerza ' + k('a_{ii}=0') + '.');
        else h += info('No es sim\u00e9trica ni antisim\u00e9trica. Pero se puede <b>partir</b> en esas dos piezas.');
        h += '<hr class="mx-sep"><p><b>Descomposici\u00f3n</b> ' +
          k('A = \\tfrac{1}{2}(A+A^t) + \\tfrac{1}{2}(A-A^t)') + '</p>';
        h += '<div class="mx-grid">' + view(S, { name: 'S' }) + view(K, { name: 'K' }) + '</div>';
        h += '<div class="mx-flex"><span>Comprobaci\u00f3n:</span>' + view(addM(S, K), { name: 'S+K' }) + '</div>';
        h += eqM(addM(S, K), A)
          ? ok('Suman exactamente A. Y ' + k('S') + ' es sim\u00e9trica' + (eqM(S, transM(S)) ? ' \u2714' : '') +
            ', mientras que ' + k('K') + ' es antisim\u00e9trica' + (eqM(K, scaleM(R(-1), transM(K))) ? ' \u2714' : '') + '.')
          : err('Algo no cuadra, revisa los datos.');
        h += info('Esta descomposici\u00f3n es \u00fanica, y aparece en f\u00edsica y en estad\u00edstica: ' +
          'la parte sim\u00e9trica guarda la informaci\u00f3n \u00abmutua\u00bb y la antisim\u00e9trica, la \u00abdireccional\u00bb.');
        return h;
      });
  });

  /* ==================================================================
     PARTE 3 · OPERACIONES
     ================================================================== */

  reg('dimensiones', function (node) {
    build(node, 'Applet \u00b7 \u00bfSe pueden multiplicar?',
      'No escribas matrices: solo sus dimensiones. El applet te dice si cada operaci\u00f3n es posible y por qu\u00e9. ' +
      'Mueve los cuatro deslizadores y busca casos donde ' + k('A\\cdot B') + ' exista pero ' + k('B\\cdot A') + ' no.',
      [
        { id: 'ar', label: 'Filas de A', type: 'range', min: 1, max: 5, value: 2 },
        { id: 'ac', label: 'Columnas de A', type: 'range', min: 1, max: 5, value: 3 },
        { id: 'br', label: 'Filas de B', type: 'range', min: 1, max: 5, value: 3 },
        { id: 'bc', label: 'Columnas de B', type: 'range', min: 1, max: 5, value: 4 }
      ],
      function (v) {
        var ar = +v.ar, ac = +v.ac, br = +v.br, bc = +v.bc;
        var h = '<p>' + k('A_{' + ar + '\\times' + ac + '}') + ' y ' + k('B_{' + br + '\\times' + bc + '}') + '</p>';
        h += '<table class="ap-tbl"><thead><tr><th>Operaci\u00f3n</th><th>\u00bfPosible?</th><th>Resultado</th><th>Motivo</th></tr></thead><tbody>';
        var suma = (ar === br && ac === bc);
        h += '<tr><td>' + k('A+B') + '</td><td>' + (suma ? '\u2714' : '\u2717') + '</td><td>' +
          (suma ? k(ar + '\\times' + ac) : '\u2014') + '</td><td>' +
          (suma ? 'misma dimensi\u00f3n' : 'la suma exige dimensiones id\u00e9nticas') + '</td></tr>';
        var ab = (ac === br);
        h += '<tr><td>' + k('A\\cdot B') + '</td><td>' + (ab ? '\u2714' : '\u2717') + '</td><td>' +
          (ab ? k(ar + '\\times' + bc) : '\u2014') + '</td><td>columnas de A = ' + ac + ', filas de B = ' + br +
          (ab ? ': coinciden' : ': no coinciden') + '</td></tr>';
        var ba = (bc === ar);
        h += '<tr><td>' + k('B\\cdot A') + '</td><td>' + (ba ? '\u2714' : '\u2717') + '</td><td>' +
          (ba ? k(br + '\\times' + ac) : '\u2014') + '</td><td>columnas de B = ' + bc + ', filas de A = ' + ar +
          (ba ? ': coinciden' : ': no coinciden') + '</td></tr>';
        h += '<tr><td>' + k('A^t\\cdot B') + '</td><td>' + (ar === br ? '\u2714' : '\u2717') + '</td><td>' +
          (ar === br ? k(ac + '\\times' + bc) : '\u2014') + '</td><td>trasponer A la vuelve ' + k(ac + '\\times' + ar) + '</td></tr>';
        h += '</tbody></table>';
        h += info('La regla del dominó: ' + k('(m\\times n)\\cdot(n\\times p) = (m\\times p)') +
          '. Las dos dimensiones interiores deben coincidir y desaparecen; las exteriores sobreviven.');
        if (ab && !ba) h += warn('Caso interesante: ' + k('A\\cdot B') + ' existe pero ' + k('B\\cdot A') +
          ' <b>no</b>. Es la prueba m\u00e1s cruda de que el producto de matrices no es conmutativo.');
        if (ab && ba && ar !== bc) h += warn('Aqu\u00ed existen los dos productos, pero tienen ' +
          '<b>dimensiones distintas</b>: ' + k('A\\cdot B') + ' es ' + k(ar + '\\times' + bc) + ' y ' +
          k('B\\cdot A') + ' es ' + k(br + '\\times' + ac) + '. Ni siquiera se pueden comparar.');
        return h;
      });
  });

  reg('suma', function (node) {
    build(node, 'Applet \u00b7 Suma y resta de matrices',
      'Escribe dos matrices de la <b>misma dimensi\u00f3n</b>: la suma va casilla por casilla. ' +
      'Ejemplos: A = <code>3 1 -2<br>4 -3 0</code> y B = <code>2 1 3<br>4 -3 5</code>. ' +
      'Prueba tambi\u00e9n a poner dimensiones distintas para ver el aviso de error.',
      [
        { id: 'A', label: 'Matriz A', rows: 3, value: '3 1 -2\n4 -3 0' },
        { id: 'B', label: 'Matriz B', rows: 3, value: '2 1 3\n4 -3 5' }
      ],
      function (v) {
        var a = need(v.A, 'A'), b = need(v.B, 'B');
        if (a.err) return err(a.err);
        if (b.err) return err(b.err);
        if (a.r !== b.r || a.c !== b.c) {
          return err('A es ' + a.dim + ' y B es ' + b.dim + '. La suma de matrices <b>solo</b> est\u00e1 definida ' +
            'si tienen la misma dimensi\u00f3n, porque hay que emparejar cada elemento con el suyo.');
        }
        var h = '<div class="mx-grid">' + view(a.M, { name: 'A' }) + view(b.M, { name: 'B' }) + '</div>';
        h += '<div class="mx-grid">' + view(addM(a.M, b.M), { name: 'A+B' }) +
          view(subM(a.M, b.M), { name: 'A-B' }) + '</div>';
        h += ok('Propiedad: ' + k('A+B = B+A') + '. ' +
          (eqM(addM(a.M, b.M), addM(b.M, a.M)) ? 'La suma s\u00ed es conmutativa' : '') +
          ', al contrario que el producto. Aqu\u00ed no hay trampa.');
        h += '<div class="mx-flex"><span>Elemento neutro:</span>' + view(zeros(a.r, a.c), { name: 'O' }) +
          '<span>y opuesta:</span>' + view(scaleM(R(-1), a.M), { name: '-A' }) + '</div>';
        h += info('Restar es sumar la opuesta: ' + k('A-B = A+(-B)') + '. ' +
          'Con matrices no hay ninguna dificultad nueva respecto de los n\u00fameros; el sobresalto llega con el producto.');
        return h;
      });
  });

  reg('escalar', function (node) {
    build(node, 'Applet \u00b7 Producto por un n\u00famero',
      'Multiplicar por un escalar significa multiplicar <b>todos</b> los elementos. ' +
      'Escribe la matriz y elige el n\u00famero con el deslizador, o escr\u00edbelo como fracci\u00f3n en el campo de texto ' +
      '(por ejemplo <code>1/3</code> o <code>-2/5</code>).',
      [
        { id: 'A', label: 'Matriz A', rows: 3, value: '2 -4 6\n0 3 -1' },
        { id: 'kt', label: 'Escalar k', type: 'text', value: '3' }
      ],
      function (v) {
        var p = need(v.A, 'A');
        if (p.err) return err(p.err);
        var kk = parseEntry(v.kt);
        if (!kk) return err('El escalar «' + v.kt + '» no vale. Escribe un entero (3), un decimal (0.5) o una fracci\u00f3n (1/3).');
        var h = '<div class="mx-flex">' + k(F.tex(kk) + '\\cdot') + view(p.M, { name: '' }) +
          k('=') + view(scaleM(kk, p.M), { name: '' }) + '</div>';
        h += info('Ojo con una diferencia que aparece en el tema siguiente: al multiplicar una matriz de orden ' +
          k('n') + ' por ' + k('k') + ', el determinante NO se multiplica por ' + k('k') + ' sino por ' + k('k^n') +
          ', porque el factor sale de cada una de las ' + k('n') + ' filas.');
        if (kk.n === 0) h += warn('Con ' + k('k=0') + ' obtienes la matriz nula. Y aqu\u00ed viene un aviso: ' +
          'que un producto d\u00e9 la matriz nula NO implica que alguno de los factores lo sea. Eso con matrices falla.');
        return h;
      });
  });

  reg('producto', function (node) {
    build(node, 'Applet \u00b7 Producto de matrices paso a paso',
      'Escribe A y B con las dimensiones encajadas: las <b>columnas de A</b> deben ser tantas como las <b>filas de B</b>. ' +
      'Mueve los deslizadores para elegir la posici\u00f3n ' + k('c_{ij}') + ' y ver exactamente qu\u00e9 fila se combina ' +
      'con qu\u00e9 columna. Ejemplo: A = <code>1 2<br>3 4</code> y B = <code>0 1<br>-1 2</code>.',
      [
        { id: 'A', label: 'Matriz A', rows: 3, value: '1 2\n3 4' },
        { id: 'B', label: 'Matriz B', rows: 3, value: '0 1\n-1 2' },
        { id: 'i', label: 'Fila i de A', type: 'range', min: 1, max: 5, value: 1 },
        { id: 'j', label: 'Columna j de B', type: 'range', min: 1, max: 5, value: 2 }
      ],
      function (v) {
        var a = need(v.A, 'A'), b = need(v.B, 'B');
        if (a.err) return err(a.err);
        if (b.err) return err(b.err);
        if (a.c !== b.r) {
          return err('No se pueden multiplicar: A es ' + a.dim + ' y B es ' + b.dim +
            '. A tiene ' + a.c + ' columna' + (a.c === 1 ? '' : 's') + ' y B tiene ' + b.r + ' fila' + (b.r === 1 ? '' : 's') +
            '. Para que ' + k('A\\cdot B') + ' exista esos dos n\u00fameros deben ser iguales.');
        }
        var i = Math.min(+v.i, a.r) - 1, j = Math.min(+v.j, b.c) - 1;
        var C = mulM(a.M, b.M);
        var h = '<div class="mx-grid">' + view(a.M, { name: 'A', hiRow: i }) + view(b.M, { name: 'B', hiCol: j }) + '</div>';
        var terms = [], suma = R(0);
        for (var t = 0; t < a.c; t++) {
          terms.push(F.tex(a.M[i][t]) + '\\cdot' + F.tex(b.M[t][j]));
          suma = F.add(suma, F.mul(a.M[i][t], b.M[t][j]));
        }
        h += '<p><b>C\u00e1lculo de la posici\u00f3n (' + (i + 1) + ',' + (j + 1) + '):</b></p>';
        h += kd('c_{' + (i + 1) + (j + 1) + '} = ' + terms.join(' + ') + ' = ' + F.tex(suma));
        h += '<div class="mx-grid">' + view(C, { name: 'A\\cdot B', hi: [i, j] }) + '</div>';
        h += info('El mecanismo es siempre el mismo: <b>fila por columna</b>. Recorres la fila ' + (i + 1) +
          ' de A y la columna ' + (j + 1) + ' de B a la vez, multiplicas los elementos que se encuentran y sumas todo. ' +
          'El resultado es ' + k(a.r + '\\times' + b.c) + ': se queda con las filas de A y las columnas de B.');
        if (b.c === a.r) {
          var D = mulM(b.M, a.M);
          h += '<hr class="mx-sep"><div class="mx-grid">' + view(D, { name: 'B\\cdot A' }) + '</div>';
          h += eqM(C, D)
            ? ok('En este caso concreto ' + k('AB = BA') + '. Ocurre, pero es la excepci\u00f3n: se dice que A y B <b>conmutan</b>.')
            : err('Aqu\u00ed lo tienes: ' + k('AB \\neq BA') + '. El producto de matrices <b>no es conmutativo</b>, ' +
              'y esta es la propiedad que m\u00e1s ejercicios estropea si se olvida.');
        }
        return h;
      });
  });

  reg('noconmuta', function (node) {
    build(node, 'Applet \u00b7 Trampas del producto',
      'Tres hechos que con n\u00fameros son imposibles y con matrices ocurren a diario. ' +
      'Escribe dos matrices cuadradas del mismo orden y observa los tres bloques. ' +
      'Ejemplo demoledor: A = <code>1 1<br>1 1</code> y B = <code>1 1<br>-1 -1</code>.',
      [
        { id: 'A', label: 'Matriz A (cuadrada)', rows: 3, value: '1 1\n1 1' },
        { id: 'B', label: 'Matriz B (mismo orden)', rows: 3, value: '1 1\n-1 -1' }
      ],
      function (v) {
        var a = needSquare(v.A, 'A'), b = needSquare(v.B, 'B');
        if (a.err) return err(a.err);
        if (b.err) return err(b.err);
        if (a.r !== b.r) return err('A es de orden ' + a.r + ' y B de orden ' + b.r + '. Deben ser del mismo orden.');
        var A = a.M, B = b.M, AB = mulM(A, B), BA = mulM(B, A);
        var h = '<div class="mx-grid">' + view(A, { name: 'A' }) + view(B, { name: 'B' }) + '</div>';
        h += '<p><b>1. El orden importa</b></p><div class="mx-grid">' +
          view(AB, { name: 'AB' }) + view(BA, { name: 'BA' }) + '</div>';
        h += eqM(AB, BA) ? ok('Estas dos conmutan. Busca otras que no lo hagan: es lo habitual.')
          : err(k('AB \\neq BA') + '. Nunca reordenes factores al despejar.');
        h += '<hr class="mx-sep"><p><b>2. Divisores de cero</b></p>';
        if (isZeroM(AB) && !isZeroM(A) && !isZeroM(B)) {
          h += err('Mira bien: ' + k('AB = O') + ' con ' + k('A \\neq O') + ' y ' + k('B \\neq O') + '. ' +
            'Con n\u00fameros, si ' + k('xy=0') + ' entonces alguno es cero. Con matrices <b>esa regla no vale</b>, ' +
            'y por eso de ' + k('AX = AY') + ' no puedes deducir ' + k('X = Y') + '.');
        } else {
          h += info('Con estas dos no sale la matriz nula. Prueba A = <code>1 1<br>1 1</code> y ' +
            'B = <code>1 1<br>-1 -1</code>: ver\u00e1s ' + k('AB = O') + ' con ambas no nulas.');
        }
        h += '<hr class="mx-sep"><p><b>3. El binomio se descontrola</b></p>';
        var S = addM(A, B);
        var cuad = mulM(S, S);
        var falso = addM(addM(mulM(A, A), scaleM(R(2), mulM(A, B))), mulM(B, B));
        h += '<div class="mx-grid">' + view(cuad, { name: '(A+B)^2' }) + view(falso, { name: 'A^2+2AB+B^2' }) + '</div>';
        h += eqM(cuad, falso)
          ? info('Aqu\u00ed coinciden porque estas dos matrices conmutan. No es una regla general.')
          : err('No son iguales. El desarrollo correcto es ' + k('(A+B)^2 = A^2+AB+BA+B^2') +
            ', y solo puedes juntar ' + k('AB+BA') + ' en ' + k('2AB') + ' si A y B conmutan.');
        return h;
      });
  });

  reg('potencia', function (node) {
    build(node, 'Applet \u00b7 Potencias de una matriz',
      'Escribe una matriz <b>cuadrada</b> y sube el exponente con el deslizador. ' +
      'Busca patrones: hay matrices que se repiten con periodo, otras que se anulan y otras que crecen sin control. ' +
      'Ejemplos muy instructivos: <code>0 1<br>0 0</code> (se anula) \u00b7 <code>0 1<br>-1 0</code> (periodo 4) \u00b7 ' +
      '<code>1 1<br>0 1</code> (crece de forma regular) \u00b7 <code>1 0<br>0 -1</code> (periodo 2).',
      [
        { id: 'A', label: 'Matriz A (cuadrada)', rows: 3, value: '1 1\n0 1' },
        { id: 'n', label: 'Exponente n', type: 'range', min: 1, max: 10, value: 4 }
      ],
      function (v) {
        var p = needSquare(v.A, 'A');
        if (p.err) return err(p.err);
        var A = p.M, n = +v.n;
        var h = '<div class="mx-grid">' + view(A, { name: 'A' }) + view(powM(A, n), { name: 'A^{' + n + '}' }) + '</div>';
        var lista = '<div class="mx-grid">';
        for (var t = 1; t <= Math.min(n, 5); t++) lista += view(powM(A, t), { name: 'A^{' + t + '}' });
        h += lista + '</div>';
        var per = 0;
        for (var q = 1; q <= 8; q++) if (eqM(powM(A, q + 1), powM(A, 1)) && q >= 1) { per = q; break; }
        if (isZeroM(powM(A, Math.min(n, p.r)))) {
          h += ok('Esta matriz es <b>nilpotente</b>: al elevarla se acaba anulando. ' +
            'De nuevo un fen\u00f3meno imposible con n\u00fameros distintos de cero.');
        } else if (eqM(powM(A, 2), A)) {
          h += ok('Cumple ' + k('A^2 = A') + ': se llama <b>idempotente</b>, y entonces ' + k('A^n = A') + ' para todo ' + k('n') + '.');
        } else if (eqM(powM(A, 2), ident(p.r))) {
          h += ok('Cumple ' + k('A^2 = I') + ': es <b>involutiva</b>. Las potencias alternan entre A e I, ' +
            'as\u00ed que ' + k('A^{100} = I') + ' y ' + k('A^{101} = A') + '.');
        } else if (per) {
          h += ok('Hay <b>periodo ' + per + '</b>: ' + k('A^{n+' + per + '} = A^{n}') + '. ' +
            'Para calcular ' + k('A^{100}') + ' basta dividir 100 entre ' + per + ' y quedarse con el resto.');
        } else {
          h += info('No se detecta periodo en los primeros exponentes. Fíjate en c\u00f3mo crecen los elementos: ' +
            'muchos ejercicios de examen piden encontrar la f\u00f3rmula general de ' + k('A^n') + ' observando el patr\u00f3n.');
        }
        h += warn('Nunca escribas ' + k('(AB)^2 = A^2B^2') + '. Lo correcto es ' + k('(AB)^2 = ABAB') +
          ', y solo se puede reagrupar si A y B conmutan.');
        return h;
      });
  });

  /* ------------------------------------------------------------------
     6. API PÚBLICA Y ARRANQUE
     ------------------------------------------------------------------ */

  window.MAT = {
    F: F, R: R, parseEntry: parseEntry, parseM: parseM,
    clone: clone, ident: ident, zeros: zeros,
    addM: addM, subM: subM, scaleM: scaleM, mulM: mulM, transM: transM,
    eqM: eqM, isZeroM: isZeroM, powM: powM,
    minor: minor, det: det, cofM: cofM, invAdj: invAdj,
    gauss: gauss, gjInv: gjInv, rref: rref, nullBasis: nullBasis,
    k: k, kd: kd, texM: texM, view: view, renderTex: renderTex,
    ok: ok, info: info, warn: warn, err: err, stepsView: stepsView, esc: esc,
    build: build, need: need, needSquare: needSquare,
    reg: reg, registry: registry
  };

  var booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    var nodes = document.querySelectorAll('[data-applet-mat]');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.getAttribute('data-mounted') === '1') continue;
      var key = node.getAttribute('data-applet-mat');
      var fn = registry[key];
      node.setAttribute('data-mounted', '1');
      if (!fn) {
        node.classList.add('applet');
        node.innerHTML = '<div class="mx-bad ap-err">No existe ning\u00fan applet con la clave ' +
          '<code>' + esc(key) + '</code>. Claves disponibles: <code>' +
          Object.keys(registry).sort().join('</code>, <code>') + '</code>.</div>';
        continue;
      }
      try { fn(node); }
      catch (e) {
        node.classList.add('applet');
        node.innerHTML = '<div class="mx-bad ap-err">El applet <code>' + esc(key) +
          '</code> no ha podido montarse: ' + esc(e.message) + '</div>';
      }
    }
  }

  window.MAT.boot = boot;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); });
  } else {
    setTimeout(boot, 0);
  }
})();
