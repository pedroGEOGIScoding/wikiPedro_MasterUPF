/* =====================================================================
   mat-applets-extra.js — TEMA 1 MATRICES · 2.º Batx Mates CCSS
   Ubicación: 2-BatxMatesCCSS/matrices/assets/mat-applets-extra.js

   VERSIÓN 2 · correcciones respecto de la versión 1
     1) El applet de diagnóstico cuenta los applets montados de forma
        DIFERIDA, así que ya da el número correcto sea cual sea su
        posición en la página. Antes contaba en el instante de su propio
        montaje y, si no era el último elemento, decía «montados: 1».
     2) El diagnóstico ahora COLOREA cada fila en verde o rojo, y avisa
        con el detalle de qué claves han quedado sin montar.
     3) El montaje registra en window.MAT.log los errores de arranque,
        para poder consultarlos desde la consola del navegador.

   Segundo módulo del motor. Reutiliza todo el núcleo de mat-applets.js
   a través de window.MAT: fracciones exactas, Gauss, Gauss-Jordan,
   adjuntos, núcleo de un sistema y renderizado con KaTeX local.

   CLAVES DE ESTE ARCHIVO (partes 4, 5 y 6)
     gauss · rango · rangoparam
     inversa · invadj
     ecuacion · condicion · entrenador · diagnostico
   ===================================================================== */

(function () {
  'use strict';

  var M = window.MAT;
  if (!M) {
    var aviso = document.querySelectorAll('[data-applet-mat]');
    for (var z = 0; z < aviso.length; z++) {
      aviso[z].innerHTML = '<div class="mx-bad ap-err">No se ha cargado ' +
        '<code>mat-applets.js</code>. Revisa el orden de los scripts en <code>assets/_scripts.html</code>.</div>';
    }
    return;
  }

  var F = M.F, R = M.R, k = M.k, kd = M.kd, view = M.view;
  var ok = M.ok, info = M.info, warn = M.warn, err = M.err;
  var build = M.build, need = M.need, needSquare = M.needSquare;

  /* Registro de incidencias de arranque, consultable desde la consola */
  M.log = M.log || [];

  /* ==================================================================
     PARTE 4 · RANGO
     ================================================================== */

  M.reg('gauss', function (node) {
    build(node, 'Applet \u00b7 Escalonamiento de Gauss',
      'Escribe cualquier matriz, cuadrada o no. El applet aplica transformaciones elementales por filas ' +
      'y muestra <b>cada paso con su notaci\u00f3n</b>, la misma que debes escribir en el examen. ' +
      'Ejemplos: <code>0 1 3<br>1 4 1<br>1 5 4</code> \u00b7 <code>1 2 3<br>2 4 6</code> \u00b7 ' +
      '<code>2 -1 3 1<br>4 -2 6 2<br>1 0 1 0</code>.',
      [{ id: 'A', label: 'Matriz', rows: 4, value: '0 1 3\n1 4 1\n1 5 4' }],
      function (v) {
        var p = need(v.A, 'A');
        if (p.err) return err(p.err);
        var g = M.gauss(p.M);
        var h = '<p>Partimos de una matriz ' + k(p.dim) + ' y buscamos la forma escalonada.</p>';
        h += M.stepsView(g.steps);
        h += '<p>Pivotes encontrados: <b>' + g.rank + '</b>' +
          (g.piv.length ? ', en las posiciones ' + g.piv.map(function (q) { return '(' + (q[0] + 1) + ',' + (q[1] + 1) + ')'; }).join(', ') : '') + '.</p>';
        h += info('Las tres transformaciones permitidas son: intercambiar dos filas, multiplicar una fila por un ' +
          'n\u00famero distinto de cero, y sumar a una fila un m\u00faltiplo de otra. Ninguna de las tres cambia el rango, ' +
          'y esa es exactamente la raz\u00f3n de que el m\u00e9todo funcione.');
        var nulas = p.r - g.rank;
        if (nulas > 0) h += warn('Han aparecido ' + nulas + ' fila' + (nulas === 1 ? '' : 's') + ' de ceros. ' +
          'Cada fila nula delata una fila original que era <b>combinaci\u00f3n lineal</b> de las otras: informaci\u00f3n repetida.');
        else h += ok('Ninguna fila se ha anulado: las ' + p.r + ' filas son linealmente independientes.');
        return h;
      });
  });

  M.reg('rango', function (node) {
    build(node, 'Applet \u00b7 Rango de una matriz',
      'El rango es el n\u00famero de filas linealmente independientes. Escribe la matriz y el applet lo calcula ' +
      'por Gauss, lo compara con el m\u00e1ximo posible y, si es cuadrada, lo contrasta con el determinante. ' +
      'Ejemplos: <code>0 1 3<br>1 4 1<br>1 5 4</code> (rango 2) \u00b7 <code>1 1 1<br>2 2 2<br>3 3 3</code> ' +
      '(rango 1) \u00b7 <code>2 3<br>4 6</code> (rango 1, filas proporcionales) \u00b7 <code>1 2 3<br>4 5 7</code> (rango 2).',
      [{ id: 'A', label: 'Matriz', rows: 4, value: '0 1 3\n1 4 1\n1 5 4' }],
      function (v) {
        var p = need(v.A, 'A');
        if (p.err) return err(p.err);
        var g = M.gauss(p.M), max = Math.min(p.r, p.c);
        var h = '<div class="mx-flex">' + view(p.M, { name: 'A' }) + '</div>';
        h += M.stepsView(g.steps);
        h += '<p><span class="mx-badge">Rango</span> ' + k('\\operatorname{rg}(A) = ' + g.rank) +
          ', y el m\u00e1ximo posible para una matriz ' + k(p.dim) + ' es ' + k(String(max)) + '.</p>';
        if (g.rank === max) h += ok('El rango es <b>m\u00e1ximo</b>. No hay informaci\u00f3n redundante.');
        else h += warn('El rango <b>no</b> es m\u00e1ximo: hay ' + (p.r - g.rank) +
          ' fila' + (p.r - g.rank === 1 ? '' : 's') + ' que se puede obtener a partir de las dem\u00e1s.');
        h += '<p>Comprobaci\u00f3n con la traspuesta: ' + k('\\operatorname{rg}(A^t) = ' + M.gauss(M.transM(p.M)).rank) +
          '. Siempre coincide con el de A, porque el rango por filas y por columnas es el mismo.</p>';
        if (p.r === p.c) {
          var d = M.det(p.M);
          h += '<p>Determinante: ' + k('|A| = ' + F.tex(d)) + '. ' +
            (F.isZero(d)
              ? 'Al ser cero, el rango es <b>menor</b> que el orden ' + p.r + ', y en efecto vale ' + g.rank + '.'
              : 'Al ser distinto de cero, el rango debe ser el orden completo ' + p.r + ', y en efecto vale ' + g.rank + '.') + '</p>';
          h += info('Este criterio es el puente con el tema siguiente: para una matriz cuadrada de orden ' +
            k('n') + ', se cumple ' + k('|A|\\neq 0 \\iff \\operatorname{rg}(A)=n \\iff A \\text{ tiene inversa}') + '.');
        }
        return h;
      });
  });

  M.reg('rangoparam', function (node) {
    build(node, 'Applet \u00b7 Rango con un par\u00e1metro',
      'Ahora los elementos pueden contener la letra <code>a</code>. Formas admitidas: <code>a</code>, <code>-a</code>, ' +
      '<code>2a</code>, <code>a+1</code>, <code>a-3</code>, <code>3a-2</code>. Mueve el deslizador para ver c\u00f3mo ' +
      'cambian el determinante y el rango, y consulta la tabla de <b>valores cr\u00edticos</b>. ' +
      'Ejemplos: <code>2 a<br>2 2</code> (el de Marea Verde, cr\u00edtico en a = 6) \u00b7 ' +
      '<code>1 1 1<br>1 a 1<br>1 1 a</code> \u00b7 <code>1 2 3<br>2 4 a<br>3 a 9</code>.',
      [
        { id: 'A', label: 'Matriz con par\u00e1metro a', rows: 4, value: '2 a\n2 2' },
        { id: 'a', label: 'Valor de a', type: 'range', min: -8, max: 8, step: 0.5, value: 2 }
      ],
      function (v) {
        function evalEntry(s, av) {
          s = String(s).trim().replace(/\s+/g, '');
          if (!/^[-+0-9a.\/]+$/.test(s)) return null;
          var m2 = s.match(/^([+-]?)(\d*(?:\.\d+)?)a([+-]\d+(?:\.\d+)?)?$/);
          if (m2) {
            var co = m2[2] === '' ? 1 : parseFloat(m2[2]);
            if (m2[1] === '-') co = -co;
            return co * av + (m2[3] ? parseFloat(m2[3]) : 0);
          }
          var m3 = s.match(/^([+-]?\d+(?:\.\d+)?)([+-])a$/);
          if (m3) return parseFloat(m3[1]) + (m3[2] === '-' ? -av : av);
          var num = parseFloat(s);
          return isNaN(num) ? null : num;
        }
        function grid(txt, av) {
          var rows = String(txt).trim().split(/[\n;]+/).map(function (r) { return r.trim(); }).filter(function (r) { return r.length; });
          var G = [], c = null;
          for (var i = 0; i < rows.length; i++) {
            var cells = rows[i].split(/[\s,]+/).filter(function (s) { return s.length; });
            var row = [];
            for (var j = 0; j < cells.length; j++) {
              var x = evalEntry(cells[j], av);
              if (x === null) return { err: 'No entiendo \u00ab' + cells[j] + '\u00bb. Usa n\u00fameros o expresiones con a: a, 2a, a-3, 3a+1.' };
              row.push(x);
            }
            if (c === null) c = row.length; else if (row.length !== c) return { err: 'Las filas no tienen el mismo n\u00famero de elementos.' };
            G.push(row);
          }
          if (!G.length) return { err: 'Escribe una matriz.' };
          return { M: G, r: G.length, c: c };
        }
        function detN(A) {
          var n = A.length;
          if (n === 1) return A[0][0];
          if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
          var s = 0;
          for (var j = 0; j < n; j++) {
            if (Math.abs(A[0][j]) < 1e-12) continue;
            var sub = A.slice(1).map(function (r) { return r.filter(function (_, c) { return c !== j; }); });
            s += (j % 2 === 0 ? 1 : -1) * A[0][j] * detN(sub);
          }
          return s;
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
        var av = parseFloat(v.a);
        var g = grid(v.A, av);
        if (g.err) return err(g.err);
        var fmt = function (x) { return String(Math.round(x * 10000) / 10000); };
        var cuad = g.r === g.c;
        var Q = g.M.map(function (r) { return r.map(function (x) { return M.parseEntry(fmt(x)) || R(0); }); });
        var h = '<div class="mx-flex"><span>Para ' + k('a = ' + fmt(av)) + '</span>' + view(Q, { name: 'A(a)' }) + '</div>';
        var rk = rankN(g.M);
        if (cuad) {
          var d = detN(g.M);
          h += '<p>' + k('|A(a)| = ' + fmt(d)) + '. ' +
            (Math.abs(d) < 1e-9 ? '<b>Se anula</b>: aqu\u00ed la matriz es singular.' : 'Distinto de cero: matriz regular.') + '</p>';
        }
        h += '<p><span class="mx-badge">Rango</span> ' + k('\\operatorname{rg}(A(' + fmt(av) + ')) = ' + rk) + '</p>';
        var crit = [];
        for (var x = -8; x <= 8.0001; x += 0.5) {
          var gg = grid(v.A, x);
          if (gg.err) break;
          if (!cuad) continue;
          var dd = detN(gg.M);
          if (Math.abs(dd) < 1e-9) crit.push({ a: x, rg: rankN(gg.M) });
        }
        if (cuad && crit.length) {
          h += '<table class="ap-tbl"><thead><tr><th>Valor cr\u00edtico de a</th><th>Rango en ese valor</th></tr></thead><tbody>';
          crit.forEach(function (c) { h += '<tr><td>' + k('a = ' + fmt(c.a)) + '</td><td>' + c.rg + '</td></tr>'; });
          h += '</tbody></table>';
          h += info('As\u00ed se escribe la discusi\u00f3n en un examen: <b>si a es distinto de esos valores</b>, ' +
            'el rango es ' + Math.min(g.r, g.c) + '; <b>en cada valor cr\u00edtico</b>, el rango baja al que indica la tabla. ' +
            'El applet los localiza, pero t\u00fa debes justificarlos resolviendo ' + k('|A(a)| = 0') + ' a mano.');
        } else if (cuad) {
          h += info('En el intervalo explorado el determinante no se anula: el rango es m\u00e1ximo para todos esos valores. ' +
            'Prueba con <code>1 1 1<br>1 a 1<br>1 1 a</code>, que tiene valores cr\u00edticos claros.');
        } else {
          h += info('La matriz no es cuadrada, as\u00ed que aqu\u00ed no hay determinante: la discusi\u00f3n se hace ' +
            'observando en qu\u00e9 valores de ' + k('a') + ' se anula alg\u00fan pivote.');
        }
        h += warn('Cuidado con el deslizador: solo recorre valores de medio en medio entre \u22128 y 8. ' +
          'Un valor cr\u00edtico como ' + k('a = 1/3') + ' no aparecer\u00eda. El applet sirve para <b>ver</b> el fen\u00f3meno, ' +
          'no para sustituir el c\u00e1lculo algebraico.');
        return h;
      });
  });

  /* ==================================================================
     PARTE 5 · MATRIZ INVERSA
     ================================================================== */

  M.reg('inversa', function (node) {
    build(node, 'Applet \u00b7 Inversa por Gauss-Jordan',
      'Escribe una matriz <b>cuadrada</b>. El applet forma la matriz ampliada ' + k('(A\\mid I)') + ' ' +
      'y muestra cada transformaci\u00f3n hasta llegar a ' + k('(I\\mid A^{-1})') + '. La l\u00ednea vertical separa las dos mitades. ' +
      'Ejemplos: <code>1 2<br>3 4</code> \u00b7 <code>1 1 2<br>0 1 3<br>-1 4 1</code> \u00b7 ' +
      '<code>1 2<br>3 6</code> (esta <b>no</b> tiene inversa: observa d\u00f3nde se atasca).',
      [{ id: 'A', label: 'Matriz A (cuadrada)', rows: 4, value: '1 1 2\n0 1 3\n-1 4 1' }],
      function (v) {
        var p = needSquare(v.A, 'A');
        if (p.err) return err(p.err);
        var A = p.M, n = p.r, d = M.det(A), g = M.gjInv(A);
        var h = '<div class="mx-flex">' + view(A, { name: 'A' }) + k('|A| = ' + F.tex(d)) + '</div>';
        if (g.singular) {
          h += err('A <b>no tiene inversa</b>. El proceso se atasca en la columna ' + (g.col + 1) +
            ': por debajo del pivote no queda ning\u00fan elemento distinto de cero, se\u00f1al de que las filas son ' +
            'linealmente dependientes. Coherente con ' + k('|A| = ' + F.tex(d)) + '.');
          h += '<details><summary>Ver los pasos hasta el bloqueo</summary>' + M.stepsView(g.steps, n) + '</details>';
          h += info('Estas matrices se llaman <b>singulares</b>. Y no es un caso raro de laboratorio: aparece ' +
            'siempre que una fila es combinaci\u00f3n de las otras, es decir, cuando la informaci\u00f3n est\u00e1 repetida.');
          return h;
        }
        h += M.stepsView(g.steps, n);
        h += '<div class="mx-flex"><b>Resultado:</b>' + view(g.inv, { name: 'A^{-1}' }) + '</div>';
        var comp1 = M.mulM(A, g.inv), comp2 = M.mulM(g.inv, A);
        h += '<div class="mx-grid">' + view(comp1, { name: 'A\\cdot A^{-1}' }) + view(comp2, { name: 'A^{-1}\\cdot A' }) + '</div>';
        h += (M.eqM(comp1, M.ident(n)) && M.eqM(comp2, M.ident(n)))
          ? ok('Sale la identidad por los dos lados. La inversa es <b>la misma</b> por la derecha y por la izquierda, ' +
            'y este es el \u00fanico contexto del tema donde el orden no importa. Comprueba siempre as\u00ed tus ejercicios.')
          : err('No sale la identidad: revisa los datos.');
        h += info('Detalle \u00fatil para el examen: ' + k('|A^{-1}| = 1/|A| = ' + F.tex(F.div(R(1), d))) +
          '. El determinante de la inversa es el inverso del determinante.');
        h += warn('Aviso del profesor Gonzalo: al calcular una inversa por Gauss-Jordan puedes trabajar ' +
          '<b>solo por filas o solo por columnas</b>, pero <b>nunca mezclando</b> ambas a lo largo del proceso, ' +
          'porque el resultado saldr\u00e1 mal. Este applet trabaja siempre por filas.');
        return h;
      });
  });

  M.reg('invadj', function (node) {
    build(node, 'Applet \u00b7 Inversa por adjuntos',
      'El otro camino: ' + k('A^{-1} = \\frac{1}{|A|}\\,(\\text{Adj}A)^t') + '. ' +
      'Escribe una matriz cuadrada de orden 2, 3 o 4 y usa los deslizadores para ver qu\u00e9 submatriz se ' +
      'suprime en cada menor complementario y qu\u00e9 signo le toca. ' +
      'Ejemplos: <code>4 -2<br>3 -1</code> \u00b7 <code>2 1 0<br>1 3 1<br>0 2 4</code>. ' +
      'El resultado debe coincidir con el del applet anterior.',
      [
        { id: 'A', label: 'Matriz A (cuadrada)', rows: 4, value: '2 1 0\n1 3 1\n0 2 4' },
        { id: 'i', label: 'Fila i', type: 'range', min: 1, max: 4, value: 1 },
        { id: 'j', label: 'Columna j', type: 'range', min: 1, max: 4, value: 2 }
      ],
      function (v) {
        var p = needSquare(v.A, 'A');
        if (p.err) return err(p.err);
        var A = p.M, n = p.r, d = M.det(A);
        var i = Math.min(+v.i, n) - 1, j = Math.min(+v.j, n) - 1;
        var sub = M.minor(A, i, j), men = M.det(sub);
        var signo = ((i + j) % 2 === 0) ? 1 : -1;
        var adj = F.mul(R(signo), men);
        var C = M.cofM(A), T = M.transM(C);
        var h = '<div class="mx-flex">' + view(A, { name: 'A', hi: [i, j] }) + k('|A| = ' + F.tex(d)) + '</div>';
        h += '<p><b>Paso 1.</b> El menor complementario ' + k('M_{' + (i + 1) + (j + 1) + '}') +
          ' se obtiene suprimiendo la fila ' + (i + 1) + ' y la columna ' + (j + 1) + ':</p>';
        h += '<div class="mx-flex">' + view(sub) + k('M_{' + (i + 1) + (j + 1) + '} = ' + F.tex(men)) + '</div>';
        h += '<p><b>Paso 2.</b> El adjunto a\u00f1ade el signo ' + k('(-1)^{' + (i + 1) + '+' + (j + 1) + '} = ' + signo) + ':</p>';
        h += kd('A_{' + (i + 1) + (j + 1) + '} = (-1)^{' + (i + 1) + '+' + (j + 1) + '}\\cdot M_{' + (i + 1) + (j + 1) + '} = ' + F.tex(adj));
        h += '<p><b>Paso 3.</b> Repitiendo para todas las posiciones se forma la matriz de adjuntos, y se traspone:</p>';
        h += '<div class="mx-grid">' + view(C, { name: '\\text{Adj}A' }) + view(T, { name: '(\\text{Adj}A)^t' }) + '</div>';
        if (F.isZero(d)) {
          h += err('<b>Paso 4 imposible:</b> ' + k('|A| = 0') + ', y no se puede dividir por cero. ' +
            'La matriz de adjuntos existe, pero la inversa no. Ese es el punto exacto donde el m\u00e9todo se detiene.');
          return h;
        }
        var Inv = M.invAdj(A);
        h += '<p><b>Paso 4.</b> Dividimos entre el determinante:</p>';
        h += '<div class="mx-flex">' + k('\\frac{1}{' + F.tex(d) + '}\\cdot') + view(T) + k('=') + view(Inv, { name: 'A^{-1}' }) + '</div>';
        h += M.eqM(M.mulM(A, Inv), M.ident(n))
          ? ok('Comprobado: ' + k('A\\cdot A^{-1} = I') + '. Los dos m\u00e9todos dan el mismo resultado, como debe ser.')
          : err('La comprobaci\u00f3n falla: revisa los datos.');
        h += info('\u00bfCu\u00e1l usar? Para orden 2, el atajo ' +
          k('\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}^{-1} = \\frac{1}{ad-bc}\\begin{pmatrix}d&-b\\\\-c&a\\end{pmatrix}') +
          '. Para orden 3, los adjuntos suelen ser m\u00e1s r\u00e1pidos si hay ceros; Gauss-Jordan es m\u00e1s seguro ' +
          'si hay fracciones. Para orden 4 o m\u00e1s, Gauss-Jordan sin dudar.');
        return h;
      });
  });

  /* ==================================================================
     PARTE 6 · ECUACIONES MATRICIALES
     ================================================================== */

  M.reg('ecuacion', function (node) {
    build(node, 'Applet \u00b7 Resolutor de ecuaciones matriciales',
      'Elige el tipo de ecuaci\u00f3n y escribe las matrices que intervienen. El applet muestra el <b>despeje ' +
      'simb\u00f3lico</b>, la inversa utilizada, la soluci\u00f3n ' + k('X') + ' y la comprobaci\u00f3n sustituyendo. ' +
      'Ejemplo listo: tipo ' + k('AX=B') + ' con A = <code>2 1<br>1 1</code> y B = <code>3 0<br>1 2</code> ' +
      'da ' + k('X = \\begin{pmatrix}2&-2\\\\-1&4\\end{pmatrix}') + '. La matriz C solo se usa en los tipos que la nombran.',
      [
        { id: 'tipo', label: 'Tipo', type: 'select', value: 'AX = B', options: ['AX = B', 'XA = B', 'AX + B = C', 'AXB = C', 'AX = X + B'] },
        { id: 'A', label: 'Matriz A', rows: 3, value: '2 1\n1 1' },
        { id: 'B', label: 'Matriz B', rows: 3, value: '3 0\n1 2' },
        { id: 'C', label: 'Matriz C', rows: 3, value: '5 1\n2 3' }
      ],
      function (v) {
        var pa = need(v.A, 'A'), pb = need(v.B, 'B');
        if (pa.err) return err(pa.err);
        if (pb.err) return err(pb.err);
        var A = pa.M, B = pb.M, tipo = v.tipo;
        var usaC = (tipo === 'AX + B = C' || tipo === 'AXB = C');
        var C = null;
        if (usaC) {
          var pc = need(v.C, 'C');
          if (pc.err) return err(pc.err);
          C = pc.M;
        }
        function inversa(N, nombre) {
          if (N.length !== N[0].length) return { e: 'La matriz ' + nombre + ' es ' + N.length + '\u00d7' + N[0].length + ', y solo las cuadradas pueden tener inversa.' };
          var d = M.det(N);
          if (F.isZero(d)) return { e: 'La matriz ' + nombre + ' tiene determinante cero: es singular y no se puede invertir, as\u00ed que por este camino la ecuaci\u00f3n no se despeja.' };
          return { inv: M.invAdj(N), d: d };
        }
        var despeje = '', X = null, pasos = [], compro = null;
        if (tipo === 'AX = B') {
          var r1 = inversa(A, 'A');
          if (r1.e) return err(r1.e);
          despeje = 'AX = B \\;\\Rightarrow\\; A^{-1}AX = A^{-1}B \\;\\Rightarrow\\; IX = A^{-1}B \\;\\Rightarrow\\; X = A^{-1}B';
          if (A[0].length !== B.length) return err('Dimensiones incompatibles: A es ' + pa.dim + ' y B es ' + pb.dim + '.');
          X = M.mulM(r1.inv, B);
          pasos.push(['A^{-1}', r1.inv]);
          compro = ['A\\cdot X', M.mulM(A, X), B];
        } else if (tipo === 'XA = B') {
          var r2 = inversa(A, 'A');
          if (r2.e) return err(r2.e);
          despeje = 'XA = B \\;\\Rightarrow\\; XAA^{-1} = BA^{-1} \\;\\Rightarrow\\; X = BA^{-1}';
          if (B[0].length !== A.length) return err('Dimensiones incompatibles: B es ' + pb.dim + ' y A es ' + pa.dim + '.');
          X = M.mulM(B, r2.inv);
          pasos.push(['A^{-1}', r2.inv]);
          compro = ['X\\cdot A', M.mulM(X, A), B];
        } else if (tipo === 'AX + B = C') {
          var r3 = inversa(A, 'A');
          if (r3.e) return err(r3.e);
          if (B.length !== C.length || B[0].length !== C[0].length) return err('B y C deben tener la misma dimensi\u00f3n para poder restarlas.');
          despeje = 'AX + B = C \\;\\Rightarrow\\; AX = C - B \\;\\Rightarrow\\; X = A^{-1}(C-B)';
          var CB = M.subM(C, B);
          if (A[0].length !== CB.length) return err('Dimensiones incompatibles entre A y C\u2212B.');
          X = M.mulM(r3.inv, CB);
          pasos.push(['C-B', CB], ['A^{-1}', r3.inv]);
          compro = ['A\\cdot X + B', M.addM(M.mulM(A, X), B), C];
        } else if (tipo === 'AXB = C') {
          var ra = inversa(A, 'A'), rb = inversa(B, 'B');
          if (ra.e) return err(ra.e);
          if (rb.e) return err(rb.e);
          despeje = 'AXB = C \\;\\Rightarrow\\; A^{-1}AXBB^{-1} = A^{-1}CB^{-1} \\;\\Rightarrow\\; X = A^{-1}CB^{-1}';
          if (A[0].length !== C.length || C[0].length !== B.length) return err('Dimensiones incompatibles entre A, C y B.');
          X = M.mulM(M.mulM(ra.inv, C), rb.inv);
          pasos.push(['A^{-1}', ra.inv], ['B^{-1}', rb.inv]);
          compro = ['A\\cdot X\\cdot B', M.mulM(M.mulM(A, X), B), C];
        } else {
          if (A.length !== A[0].length) return err('A debe ser cuadrada para poder restarle la identidad.');
          var S = M.subM(A, M.ident(A.length));
          var r5 = inversa(S, 'A-I');
          if (r5.e) return err(r5.e);
          despeje = 'AX = X + B \\;\\Rightarrow\\; AX - X = B \\;\\Rightarrow\\; (A-I)X = B \\;\\Rightarrow\\; X = (A-I)^{-1}B';
          if (S[0].length !== B.length) return err('Dimensiones incompatibles entre A\u2212I y B.');
          X = M.mulM(r5.inv, B);
          pasos.push(['A-I', S], ['(A-I)^{-1}', r5.inv]);
          compro = ['A\\cdot X', M.mulM(A, X), M.addM(X, B)];
        }
        var h = '<div class="mx-info">' + kd(despeje) + '</div>';
        h += '<div class="mx-grid">' + view(A, { name: 'A' }) + view(B, { name: 'B' }) + (C ? view(C, { name: 'C' }) : '') + '</div>';
        pasos.forEach(function (pz) { h += '<div class="mx-flex">' + view(pz[1], { name: pz[0] }) + '</div>'; });
        h += '<div class="mx-flex"><b>Soluci\u00f3n:</b>' + view(X, { name: 'X' }) + '</div>';
        h += '<div class="mx-flex"><span>Comprobaci\u00f3n:</span>' + view(compro[1], { name: compro[0] }) +
          '<span>debe ser</span>' + view(compro[2]) + '</div>';
        h += M.eqM(compro[1], compro[2])
          ? ok('La comprobaci\u00f3n cuadra: ' + k('X') + ' es la soluci\u00f3n. Hazla <b>siempre</b>, tambi\u00e9n en el examen: ' +
            'detecta al instante un error de orden en el producto.')
          : err('La comprobaci\u00f3n no cuadra. Revisa las dimensiones de los datos.');
        h += warn('El error m\u00e1s caro del tema: de ' + k('AX = B') + ' <b>no</b> se deduce ' + k('X = BA^{-1}') +
          '. Hay que multiplicar por ' + k('A^{-1}') + ' <b>por el mismo lado en los dos miembros</b>, ' +
          'y en ' + k('AX') + ' la A est\u00e1 a la izquierda.');
        return h;
      });
  });

  M.reg('condicion', function (node) {
    build(node, 'Applet \u00b7 Matrices que cumplen una condici\u00f3n',
      'Aqu\u00ed no se despeja: se resuelve un sistema. Escribe A de orden 2 y elige la condici\u00f3n que debe cumplir ' +
      k('X = \\begin{pmatrix}x&y\\\\z&t\\end{pmatrix}') + '. El applet plantea las cuatro ecuaciones, las resuelve y ' +
      'describe <b>todas</b> las soluciones. Ejemplos: A = <code>1 1<br>0 1</code> con ' + k('AX = XA') + ' \u00b7 ' +
      'A = <code>2 0<br>0 3</code> con ' + k('AX = XA') + '.',
      [
        { id: 'A', label: 'Matriz A (orden 2)', rows: 3, value: '1 1\n0 1' },
        { id: 'cond', label: 'Condici\u00f3n', type: 'select', value: 'AX = XA (conmutar)', options: ['AX = XA (conmutar)', 'AX = O (anular)', 'X^2 = X (idempotente, solo diagonal)'] }
      ],
      function (v) {
        var p = needSquare(v.A, 'A');
        if (p.err) return err(p.err);
        if (p.r !== 2) return err('Para este applet A debe ser de orden 2, y la tuya es de orden ' + p.r + '.');
        var A = p.M, nom = ['x', 'y', 'z', 't'];
        var h = '<div class="mx-flex">' + view(A, { name: 'A' }) +
          k('X = \\begin{pmatrix}x&y\\\\z&t\\end{pmatrix}') + '</div>';
        if (v.cond === 'X^2 = X (idempotente, solo diagonal)') {
          h += '<p>Buscamos ' + k('X') + ' <b>diagonal</b> con ' + k('X^2 = X') + ', es decir ' +
            k('\\begin{pmatrix}x^2&0\\\\0&t^2\\end{pmatrix} = \\begin{pmatrix}x&0\\\\0&t\\end{pmatrix}') + '.</p>';
          h += '<p>Eso da ' + k('x^2 = x') + ' y ' + k('t^2 = t') + ', o sea ' + k('x(x-1)=0') + ', ' + k('t(t-1)=0') + '.</p>';
          h += ok('Hay exactamente <b>cuatro</b> soluciones diagonales: ' +
            k('\\begin{pmatrix}0&0\\\\0&0\\end{pmatrix}') + ', ' + k('\\begin{pmatrix}1&0\\\\0&0\\end{pmatrix}') + ', ' +
            k('\\begin{pmatrix}0&0\\\\0&1\\end{pmatrix}') + ' y ' + k('\\begin{pmatrix}1&0\\\\0&1\\end{pmatrix}') + '.');
          h += info('Y aqu\u00ed la moraleja: la ecuaci\u00f3n ' + k('X^2 = X') + ' con n\u00fameros tiene dos soluciones, ' +
            '0 y 1. Con matrices tiene <b>infinitas</b> si no exigimos que sea diagonal. Por ejemplo, ' +
            'cualquier ' + k('\\begin{pmatrix}1&b\\\\0&0\\end{pmatrix}') + ' tambi\u00e9n cumple ' + k('X^2 = X') + '.');
          return h;
        }
        var rows = [];
        if (v.cond === 'AX = XA (conmutar)') {
          h += '<p>Imponemos ' + k('AX - XA = O') + ' y agrupamos por inc\u00f3gnitas.</p>';
          for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) {
            var co = [R(0), R(0), R(0), R(0)];
            for (var s = 0; s < 2; s++) {
              co[s * 2 + j] = F.add(co[s * 2 + j], A[i][s]);
              co[i * 2 + s] = F.sub(co[i * 2 + s], A[s][j]);
            }
            rows.push(co.concat([R(0)]));
          }
        } else {
          h += '<p>Imponemos ' + k('AX = O') + ': cada posici\u00f3n del producto debe valer cero.</p>';
          for (var i2 = 0; i2 < 2; i2++) for (var j2 = 0; j2 < 2; j2++) {
            var co2 = [R(0), R(0), R(0), R(0)];
            for (var s2 = 0; s2 < 2; s2++) co2[s2 * 2 + j2] = F.add(co2[s2 * 2 + j2], A[i2][s2]);
            rows.push(co2.concat([R(0)]));
          }
        }
        var eqs = rows.filter(function (r) { return !(F.isZero(r[0]) && F.isZero(r[1]) && F.isZero(r[2]) && F.isZero(r[3])); });
        h += '<ul>';
        (eqs.length ? eqs : [null]).forEach(function (r) {
          if (!r) { h += '<li>Todas las ecuaciones son triviales: <b>cualquier</b> X cumple la condici\u00f3n.</li>'; return; }
          var t = [];
          for (var q = 0; q < 4; q++) if (!F.isZero(r[q])) t.push((F.eq(r[q], R(1)) ? '' : (F.eq(r[q], R(-1)) ? '-' : F.tex(r[q]))) + nom[q]);
          h += '<li>' + k(t.join(' + ').replace(/\+ -/g, '- ') + ' = 0') + '</li>';
        });
        h += '</ul>';
        if (!eqs.length) {
          return h + ok('El sistema no impone nada: toda matriz de orden 2 cumple la condici\u00f3n. ' +
            'Ocurre, por ejemplo, cuando A es la identidad o la matriz nula.');
        }
        var coef = eqs.map(function (r) { return r.slice(0, 4); });
        var nb = M.nullBasis(coef);
        h += '<p>El sistema es homog\u00e9neo con 4 inc\u00f3gnitas y rango <b>' + nb.rank + '</b>, ' +
          'as\u00ed que hay <b>' + (4 - nb.rank) + '</b> grado' + (4 - nb.rank === 1 ? '' : 's') + ' de libertad.</p>';
        if (!nb.basis.length) {
          return h + ok('\u00danica soluci\u00f3n: la matriz nula ' + k('X = O') + '. Ninguna otra matriz cumple la condici\u00f3n.');
        }
        var letras = ['\\alpha', '\\beta', '\\gamma', '\\delta'];
        var partes = nb.basis.map(function (b, idx) {
          return letras[idx] + '\\begin{pmatrix}' + F.tex(b[0]) + '&' + F.tex(b[1]) + '\\\\' +
            F.tex(b[2]) + '&' + F.tex(b[3]) + '\\end{pmatrix}';
        });
        h += kd('X = ' + partes.join(' + '));
        h += ok('Hay <b>infinitas</b> soluciones, y esa es la respuesta correcta: no un ejemplo, sino la familia completa. ' +
          'Dando valores a ' + k(letras.slice(0, nb.basis.length).join(', ')) + ' obtienes todas.');
        var ej = nb.basis[0];
        var Xe = [[ej[0], ej[1]], [ej[2], ej[3]]];
        var izq = M.mulM(A, Xe), der = (v.cond === 'AX = XA (conmutar)') ? M.mulM(Xe, A) : M.zeros(2, 2);
        h += '<div class="mx-flex"><span>Comprobaci\u00f3n con el primer par\u00e1metro igual a 1:</span>' +
          view(Xe, { name: 'X' }) + view(izq) + k('=') + view(der) + '</div>';
        h += M.eqM(izq, der) ? ok('Cumple la condici\u00f3n \u2714') : err('Algo no cuadra, revisa los datos.');
        return h;
      });
  });

  /* ==================================================================
     ENTRENADOR
     ================================================================== */

  M.reg('entrenador', function (node) {
    node.classList.add('applet');
    node.innerHTML = '<h4 class="mx-title">Applet \u00b7 Entrenador de matrices</h4>' +
      '<div class="mx-instr">Aqu\u00ed calculas t\u00fa. El applet propone un ejercicio, lo resuelves <b>en papel</b> ' +
      'y escribes la respuesta. Para las matrices usa el formato de siempre: una fila por l\u00ednea, ' +
      'elementos separados por espacios. Para el rango, escribe solo un n\u00famero. ' +
      'Pulsa <i>Comprobar</i> y despu\u00e9s <i>Otro ejercicio</i>.</div>' +
      '<div class="mx-inputs"></div><div class="mx-out ap-out"></div>';
    var box = node.querySelector('.mx-inputs'), out = node.querySelector('.mx-out');

    var sel = document.createElement('select');
    sel.className = 'mx-in';
    ['Producto AB', 'Rango', 'Inversa', 'Ecuaci\u00f3n AX = B'].forEach(function (o) {
      var op = document.createElement('option'); op.value = o; op.textContent = o; sel.appendChild(op);
    });
    var lab1 = document.createElement('label');
    lab1.className = 'mx-field';
    lab1.innerHTML = '<span>Tipo de ejercicio</span>';
    lab1.appendChild(sel);

    var resp = document.createElement('textarea');
    resp.className = 'mx-in'; resp.rows = 3; resp.spellcheck = false;
    var lab2 = document.createElement('label');
    lab2.className = 'mx-field';
    lab2.innerHTML = '<span>Tu respuesta</span>';
    lab2.appendChild(resp);

    var bComp = document.createElement('button');
    bComp.className = 'mx-btn'; bComp.type = 'button'; bComp.textContent = 'Comprobar';
    var bNext = document.createElement('button');
    bNext.className = 'mx-btn mx-sec'; bNext.type = 'button'; bNext.textContent = 'Otro ejercicio';
    var bSol = document.createElement('button');
    bSol.className = 'mx-btn mx-sec'; bSol.type = 'button'; bSol.textContent = 'Ver soluci\u00f3n';
    var wrapB = document.createElement('div');
    wrapB.className = 'mx-field';
    wrapB.innerHTML = '<span>&nbsp;</span>';
    var row = document.createElement('div');
    row.className = 'mx-flex';
    row.appendChild(bComp); row.appendChild(bSol); row.appendChild(bNext);
    wrapB.appendChild(row);

    box.appendChild(lab1); box.appendChild(lab2); box.appendChild(wrapB);

    var estado = { enun: '', sol: null, tipo: '', num: null };
    var aciertos = 0, intentos = 0;

    function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
    function randM(m, n, lo, hi) {
      var A = [];
      for (var i = 0; i < m; i++) { A.push([]); for (var j = 0; j < n; j++) A[i].push(R(rnd(lo, hi))); }
      return A;
    }
    function randInvertible(n) {
      for (var t = 0; t < 60; t++) {
        var A = randM(n, n, -3, 4);
        var d = M.det(A);
        if (!F.isZero(d) && Math.abs(F.num(d)) <= 12) return A;
      }
      return [[R(1), R(1)], [R(0), R(1)]];
    }

    function nuevo() {
      estado.tipo = sel.value;
      var h = '';
      if (estado.tipo === 'Producto AB') {
        var A = randM(2, 2, -4, 5), B = randM(2, 2, -4, 5);
        estado.sol = M.mulM(A, B); estado.num = null;
        h = '<p><b>Calcula</b> ' + k('A\\cdot B') + ':</p><div class="mx-grid">' +
          view(A, { name: 'A' }) + view(B, { name: 'B' }) + '</div>';
      } else if (estado.tipo === 'Rango') {
        var C = randM(3, 3, -3, 4);
        if (rnd(1, 2) === 1) {
          var f = rnd(1, 3);
          C[2] = C[0].map(function (x, j) { return F.add(F.mul(R(f), x), C[1][j]); });
        }
        estado.sol = null; estado.num = M.gauss(C).rank;
        h = '<p><b>Calcula el rango</b> de esta matriz y escribe solo el n\u00famero:</p>' +
          '<div class="mx-flex">' + view(C, { name: 'A' }) + '</div>';
      } else if (estado.tipo === 'Inversa') {
        var D = randInvertible(2);
        estado.sol = M.invAdj(D); estado.num = null;
        h = '<p><b>Calcula</b> ' + k('A^{-1}') + '. Si sale con fracciones, escr\u00edbelas como <code>3/4</code>:</p>' +
          '<div class="mx-flex">' + view(D, { name: 'A' }) + '</div>';
      } else {
        var E = randInvertible(2), Xs = randM(2, 2, -3, 3);
        var B2 = M.mulM(E, Xs);
        estado.sol = Xs; estado.num = null;
        h = '<p><b>Resuelve</b> ' + k('AX = B') + ':</p><div class="mx-grid">' +
          view(E, { name: 'A' }) + view(B2, { name: 'B' }) + '</div>';
      }
      estado.enun = h;
      resp.value = '';
      out.innerHTML = h + info('Escribe tu respuesta y pulsa <i>Comprobar</i>. ' +
        'Marcador: ' + aciertos + ' de ' + intentos + '.');
      M.renderTex(out);
    }

    function comprobar() {
      intentos++;
      var h = estado.enun;
      if (estado.num !== null) {
        var n = parseInt(String(resp.value).trim(), 10);
        if (isNaN(n)) { out.innerHTML = h + err('Escribe un n\u00famero entero: el rango es un n\u00famero, no una matriz.'); M.renderTex(out); return; }
        if (n === estado.num) { aciertos++; h += ok('\u00a1Correcto! El rango es ' + estado.num + '.'); }
        else h += err('No. El rango correcto es <b>' + estado.num + '</b>, y t\u00fa has escrito ' + n +
          '. Escalona la matriz y cuenta las filas que <b>no</b> se anulan.');
      } else {
        var p = M.parseM(resp.value);
        if (p.err) { out.innerHTML = h + err(p.err); M.renderTex(out); return; }
        if (M.eqM(p.M, estado.sol)) { aciertos++; h += ok('\u00a1Correcto!'); }
        else {
          h += err('No coincide. Tu respuesta y la correcta:');
          h += '<div class="mx-grid">' + view(p.M, { name: '\\text{tu respuesta}' }) + view(estado.sol, { name: '\\text{correcta}' }) + '</div>';
          if (estado.tipo === 'Producto AB') h += info('Repasa el mecanismo fila por columna, y comprueba que no has ' +
            'multiplicado elemento a elemento: eso <b>no</b> es el producto de matrices.');
          if (estado.tipo === 'Ecuaci\u00f3n AX = B') h += info('Recuerda: ' + k('X = A^{-1}B') +
            ', con la inversa <b>a la izquierda</b>. Si has escrito ' + k('BA^{-1}') + ' saldr\u00e1 otra matriz.');
        }
      }
      h += '<p class="mx-mono">Marcador: ' + aciertos + ' de ' + intentos + '.</p>';
      out.innerHTML = h;
      M.renderTex(out);
    }

    function solucion() {
      var h = estado.enun;
      h += info('Soluci\u00f3n: ' + (estado.num !== null ? 'el rango es <b>' + estado.num + '</b>.' : ''));
      if (estado.sol) h += '<div class="mx-flex">' + view(estado.sol, { name: '\\text{Soluci\u00f3n}' }) + '</div>';
      h += warn('Mirar la soluci\u00f3n antes de intentarlo en papel es la forma m\u00e1s r\u00e1pida de creer que ' +
        'sabes hacerlo sin saber hacerlo. Ese autoenga\u00f1o se paga el d\u00eda del examen.');
      out.innerHTML = h;
      M.renderTex(out);
    }

    bComp.addEventListener('click', comprobar);
    bNext.addEventListener('click', nuevo);
    bSol.addEventListener('click', solucion);
    sel.addEventListener('change', nuevo);
    nuevo();
  });

  /* ==================================================================
     DIAGNÓSTICO · versión 2, con recuento diferido y colores
     ================================================================== */

  M.reg('diagnostico', function (node) {
    node.classList.add('applet');

    function fila(nombre, valor, bien) {
      var color = bien ? '#1b5e20' : '#b71c1c';
      var marca = bien ? ' \u2714' : ' \u2717';
      return '<tr><td>' + nombre + '</td><td style="color:' + color + ';font-weight:600">' +
        valor + marca + '</td></tr>';
    }

    var testAritm = F.eq(F.add(R(1, 3), R(1, 6)), R(1, 2));
    var testDet = F.eq(M.det([[R(1), R(2)], [R(3), R(4)]]), R(-2));
    var A2 = [[R(1), R(2)], [R(3), R(4)]];
    var testInv = M.eqM(M.mulM(A2, M.invAdj(A2)), M.ident(2));
    var testRango = M.gauss([[R(0), R(1), R(3)], [R(1), R(4), R(1)], [R(1), R(5), R(4)]]).rank === 2;
    var nRegistrados = Object.keys(M.registry).length;
    var cssOk = getComputedStyle(node).paddingTop !== '0px';

    var h = '<h4 class="mx-title">Applet \u00b7 Diagn\u00f3stico del motor</h4>' +
      '<table class="ap-tbl"><tbody>';
    h += fila('N\u00facleo <code>window.MAT</code>', window.MAT ? 'activo' : 'ausente', !!window.MAT);
    h += fila('KaTeX local <code>window.katex</code>', window.katex ? 'cargado' : 'AUSENTE', !!window.katex);
    h += fila('Hoja <code>applets.css</code>', cssOk ? 'aplicada' : 'no aplicada', cssOk);
    h += fila('Applets registrados', String(nRegistrados), nRegistrados === 21);
    h += fila('Aritm\u00e9tica exacta', '1/3 + 1/6 = 1/2', testAritm);
    h += fila('Determinante', '\u22122', testDet);
    h += fila('Inversa por adjuntos', 'AA\u207b\u00b9 = I', testInv);
    h += fila('Rango', '2', testRango);
    h += '</tbody></table>';
    h += '<p class="mx-mono" data-mx-count="1">contando applets\u2026</p>';
    h += '<p class="mx-mono">claves: ' + Object.keys(M.registry).sort().join(' \u00b7 ') + '</p>';
    node.innerHTML = h;
    M.renderTex(node);

    /* RECUENTO DIFERIDO
       La versión 1 contaba aquí mismo, en el instante de montarse, y por eso
       decía «montados: 1» si el diagnóstico no era el último elemento de la
       página. Ahora el recuento se hace cuando el montaje ya ha terminado. */
    setTimeout(function () {
      var todos = document.querySelectorAll('[data-applet-mat]');
      var montados = document.querySelectorAll('[data-applet-mat][data-mounted="1"]');
      var sinMontar = [];
      for (var i = 0; i < todos.length; i++) {
        if (todos[i].getAttribute('data-mounted') !== '1') {
          sinMontar.push(todos[i].getAttribute('data-applet-mat'));
        }
      }
      var destino = node.querySelector('[data-mx-count="1"]');
      if (!destino) return;
      var bien = (montados.length === todos.length);
      destino.innerHTML = 'applets en la pagina: ' + todos.length +
        ', montados: ' + montados.length + (bien ? ' \u2714' : ' \u2717');
      destino.style.color = bien ? '#1b5e20' : '#b71c1c';
      destino.style.fontWeight = '600';
      if (!bien) {
        var aviso = document.createElement('div');
        aviso.className = 'mx-bad';
        aviso.innerHTML = 'Han quedado sin montar: <code>' + sinMontar.join('</code>, <code>') +
          '</code>. Revisa que la clave est\u00e9 escrita igual que en la lista de claves de abajo.';
        node.appendChild(aviso);
      }
      if (M.log.length) {
        var errs = document.createElement('div');
        errs.className = 'mx-warn';
        errs.innerHTML = 'Incidencias de arranque registradas en <code>window.MAT.log</code>: ' +
          M.log.length + '. \u00c1brelas en la consola del navegador.';
        node.appendChild(errs);
      }
    }, 120);
  });

  /* ------------------------------------------------------------------
     MONTAJE DE LOS NODOS QUE AÚN NO SE HAYAN MONTADO
     ------------------------------------------------------------------ */

  function mount() {
    var nodes = document.querySelectorAll('[data-applet-mat]');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.getAttribute('data-mounted') === '1') continue;
      var key = node.getAttribute('data-applet-mat');
      var fn = M.registry[key];
      node.setAttribute('data-mounted', '1');
      if (!fn) {
        node.classList.add('applet');
        node.innerHTML = '<div class="mx-bad ap-err">No existe ning\u00fan applet con la clave <code>' +
          M.esc(key) + '</code>. Claves disponibles: <code>' +
          Object.keys(M.registry).sort().join('</code>, <code>') + '</code>.</div>';
        M.log.push({ clave: key, error: 'clave inexistente' });
        continue;
      }
      try { fn(node); }
      catch (e) {
        node.classList.add('applet');
        node.innerHTML = '<div class="mx-bad ap-err">El applet <code>' + M.esc(key) +
          '</code> no ha podido montarse: ' + M.esc(e.message) + '</div>';
        M.log.push({ clave: key, error: e.message, stack: e.stack });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(mount, 0); });
  } else {
    setTimeout(mount, 0);
  }
})();
