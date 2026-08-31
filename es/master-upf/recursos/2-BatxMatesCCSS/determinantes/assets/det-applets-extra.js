/* =====================================================================
   det-applets-extra.js — TEMA 2 DETERMINANTES · 2.º Batx Mates CCSS
   Ubicación: 2-BatxMatesCCSS/determinantes/assets/det-applets-extra.js

   Segundo módulo del motor. Reutiliza todo el núcleo de det-applets.js
   a través de window.DET.

   CLAVES DE ESTE ARCHIVO (partes 3, 4, 5 y 6)
     menor · adjunto · matadj
     adjuntos · ceros · orden4 · triangular
     rangomenores · rangoparam · detrango
     inversadet · invparam · entrenador · diagnostico

   El diagnóstico cuenta los applets montados de forma DIFERIDA y colorea
   cada fila, para no repetir el problema de la primera versión del motor
   de matrices, que decía «montados: 1» si no era el último elemento.
   ===================================================================== */

(function () {
  'use strict';

  var D = window.DET;
  if (!D) {
    var aviso = document.querySelectorAll('[data-applet-det]');
    for (var z = 0; z < aviso.length; z++) {
      aviso[z].innerHTML = '<div class="mx-bad ap-err">No se ha cargado ' +
        '<code>det-applets.js</code>. Revisa el orden de los scripts en <code>assets/_scripts.html</code>.</div>';
    }
    return;
  }

  var F = D.F, R = D.R, k = D.k, kd = D.kd;
  var view = D.view, viewDet = D.viewDet;
  var ok = D.ok, info = D.info, warn = D.warn, err = D.err;
  var build = D.build, need = D.need, needSquare = D.needSquare;

  /* ==================================================================
     PARTE 3 · MENOR COMPLEMENTARIO Y ADJUNTO
     ================================================================== */

  D.reg('menor', function (node) {
    build(node, 'Applet \u00b7 Menor complementario',
      'El menor complementario ' + k('M_{ij}') + ' es el determinante que queda al <b>suprimir</b> la fila ' +
      k('i') + ' y la columna ' + k('j') + '. Escribe una matriz cuadrada y mueve los deslizadores para ver ' +
      'exactamente qu\u00e9 se tacha y qu\u00e9 queda. ' +
      'Ejemplo del libro: <code>2 -1 1<br>0 -2 -2<br>0 1 1</code>, y busca ' + k('M_{11}') + ' y ' + k('M_{23}') + '.',
      [
        { id: 'A', label: 'Matriz A (cuadrada)', rows: 4, value: '2 -1 1\n0 -2 -2\n0 1 1' },
        { id: 'i', label: 'Fila i', type: 'range', min: 1, max: 4, value: 1 },
        { id: 'j', label: 'Columna j', type: 'range', min: 1, max: 4, value: 1 }
      ],
      function (v) {
        var p = needSquare(v.A, 'A');
        if (p.err) return err(p.err);
        var A = p.M, n = p.r;
        var i = Math.min(+v.i, n) - 1, j = Math.min(+v.j, n) - 1;
        var sub = D.minor(A, i, j), m = D.det(sub);
        var h = '<div class="mx-flex">' + viewDet(A, { hiRow: i }) + '<span>fila ' + (i + 1) + ' marcada</span></div>';
        h += '<div class="mx-flex">' + viewDet(A, { hiCol: j }) + '<span>columna ' + (j + 1) + ' marcada</span></div>';
        h += '<p>Suprimimos las dos y nos queda un determinante de orden ' + (n - 1) + ':</p>';
        h += '<div class="mx-flex">' + k('M_{' + (i + 1) + (j + 1) + '} = ') + viewDet(sub) + k('= ' + F.tex(m)) + '</div>';
        h += info('El menor complementario es un <b>n\u00famero</b>, no una matriz: es el determinante de lo que sobra. ' +
          'Y siempre baja exactamente un orden.');
        h += warn('El fallo m\u00e1s com\u00fan es tachar la fila y la columna equivocadas por invertir los \u00edndices. ' +
          'Recuerda: en ' + k('M_{' + (i + 1) + (j + 1) + '}') + ' el ' + (i + 1) + ' es la <b>fila</b> y el ' +
          (j + 1) + ' es la <b>columna</b>.');
        return h;
      });
  });

  D.reg('adjunto', function (node) {
    build(node, 'Applet \u00b7 Adjunto y tablero de signos',
      'El adjunto a\u00f1ade al menor un signo: ' + k('A_{ij} = (-1)^{i+j}M_{ij}') + '. ' +
      'Los signos forman un tablero de ajedrez que empieza en + arriba a la izquierda. ' +
      'Mueve los deslizadores y observa c\u00f3mo cambia el signo al desplazarte una casilla.',
      [
        { id: 'A', label: 'Matriz A (cuadrada)', rows: 4, value: '2 -1 1\n0 -2 -2\n0 1 1' },
        { id: 'i', label: 'Fila i', type: 'range', min: 1, max: 4, value: 2 },
        { id: 'j', label: 'Columna j', type: 'range', min: 1, max: 4, value: 3 }
      ],
      function (v) {
        var p = needSquare(v.A, 'A');
        if (p.err) return err(p.err);
        var A = p.M, n = p.r;
        var i = Math.min(+v.i, n) - 1, j = Math.min(+v.j, n) - 1;
        var m = D.det(D.minor(A, i, j));
        var sg = ((i + j) % 2 === 0) ? 1 : -1;
        var adj = F.mul(R(sg), m);
        var tab = [];
        for (var a = 0; a < n; a++) {
          var fila = [];
          for (var b = 0; b < n; b++) fila.push(((a + b) % 2 === 0) ? '+' : '-');
          tab.push(fila.join(' & '));
        }
        var h = '<p><b>Tablero de signos</b> para el orden ' + n + ':</p>';
        h += '<div class="mx-flex">' + k('\\begin{pmatrix}' + tab.join(' \\\\ ') + '\\end{pmatrix}') + '</div>';
        h += '<div class="mx-flex">' + viewDet(A, { hi: [i, j] }) + '</div>';
        h += kd('A_{' + (i + 1) + (j + 1) + '} = (-1)^{' + (i + 1) + '+' + (j + 1) + '}\\cdot M_{' +
          (i + 1) + (j + 1) + '} = (' + sg + ')\\cdot(' + F.tex(m) + ') = ' + F.tex(adj));
        h += (sg === 1 ? ok('La posici\u00f3n (' + (i + 1) + ',' + (j + 1) + ') lleva signo <b>+</b>, porque ' +
          k((i + 1) + '+' + (j + 1) + ' = ' + (i + j + 2)) + ' es par.')
          : warn('La posici\u00f3n (' + (i + 1) + ',' + (j + 1) + ') lleva signo <b>\u2212</b>, porque ' +
            k((i + 1) + '+' + (j + 1) + ' = ' + (i + j + 2)) + ' es impar.'));
        h += info('Truco para no memorizar nada: el ' + k('a_{11}') + ' siempre lleva +, y a partir de ah\u00ed ' +
          'los signos alternan como las casillas de un tablero de ajedrez, tanto al bajar como al avanzar.');
        return h;
      });
  });

  D.reg('matadj', function (node) {
    build(node, 'Applet \u00b7 Matriz de adjuntos',
      'La matriz de adjuntos ' + k('\\text{Adj}A') + ' sustituye <b>cada</b> elemento por su adjunto. ' +
      'Escribe una matriz cuadrada y verás las tres piezas: la original, la de adjuntos y su traspuesta, ' +
      'que es la que usaremos en la parte 6 para la inversa. ' +
      'Ejemplos: <code>1 -1<br>-3 2</code> \u00b7 <code>2 4 1<br>1 -3 2<br>1 -1 -1</code>.',
      [{ id: 'A', label: 'Matriz A (cuadrada)', rows: 4, value: '2 4 1\n1 -3 2\n1 -1 -1' }],
      function (v) {
        var p = needSquare(v.A, 'A');
        if (p.err) return err(p.err);
        var A = p.M, n = p.r, d = D.det(A);
        var C = D.cofM(A), T = D.transM(C);
        var h = '<div class="mx-grid">' + view(A, { name: 'A' }) + k('|A| = ' + F.tex(d)) + '</div>';
        h += '<div class="mx-grid">' + view(C, { name: '\\text{Adj}A' }) + view(T, { name: '(\\text{Adj}A)^t' }) + '</div>';
        h += warn('Aviso important\u00edsimo, y es el error que m\u00e1s confunde: al calcular la matriz de adjuntos ' +
          '<b>NO se multiplica</b> por los elementos ' + k('a_{ij}') + '. Solo se calculan los adjuntos. ' +
          'Multiplicar por los elementos es lo que se hace al <b>desarrollar</b> un determinante, que es otra cosa.');
        var prod = D.mulM(A, T);
        h += '<p><b>Propiedad clave</b> para la parte 6:</p>';
        h += '<div class="mx-flex">' + k('A\\cdot(\\text{Adj}A)^t = ') + view(prod) + '</div>';
        var esperado = D.scaleM(d, D.ident(n));
        h += D.eqM(prod, esperado)
          ? ok('Sale ' + k('|A|\\cdot I') + ', es decir ' + k(F.tex(d) + '\\cdot I') + '. ' +
            'De aqu\u00ed se deduce directamente que ' + k('A^{-1} = \\frac{1}{|A|}(\\text{Adj}A)^t') +
            ', porque basta dividir los dos miembros por ' + k('|A|') + '.')
          : err('Discrepancia inesperada.');
        if (F.isZero(d)) h += warn('Como ' + k('|A| = 0') + ', el producto sale la matriz nula: ' +
          'la matriz de adjuntos existe, pero la inversa no, porque no se puede dividir por cero.');
        return h;
      });
  });

  /* ==================================================================
     PARTE 4 · DESARROLLO POR ADJUNTOS
     ================================================================== */

  D.reg('adjuntos', function (node) {
    build(node, 'Applet \u00b7 Desarrollo por adjuntos',
      'El determinante es la suma de los elementos de <b>una l\u00ednea</b> multiplicados por sus adjuntos. ' +
      'Escribe una matriz cuadrada y elige por qu\u00e9 fila o columna desarrollar: el applet muestra todos los ' +
      't\u00e9rminos. Elige la l\u00ednea con m\u00e1s ceros y compara el trabajo. ' +
      'Ejemplos: <code>2 0 4<br>1 -2 1<br>3 1 2</code> \u00b7 <code>2 1 0 0<br>1 1 -1 1<br>0 1 1 0<br>1 0 0 -1</code>.',
      [
        { id: 'A', label: 'Matriz A (cuadrada)', rows: 5, value: '2 0 4\n1 -2 1\n3 1 2' },
        { id: 'tipo', label: 'Desarrollar por', type: 'select', value: 'Fila', options: ['Fila', 'Columna'] },
        { id: 'idx', label: 'N\u00famero de l\u00ednea', type: 'range', min: 1, max: 5, value: 1 }
      ],
      function (v) {
        var p = needSquare(v.A, 'A');
        if (p.err) return err(p.err);
        var A = p.M, n = p.r;
        if (n < 2) return err('Necesitas al menos orden 2 para desarrollar por adjuntos.');
        var idx = Math.min(+v.idx, n) - 1;
        var porFila = (v.tipo === 'Fila');
        var h = '<div class="mx-flex">' + viewDet(A, porFila ? { hiRow: idx } : { hiCol: idx }) + '</div>';
        var total = R(0), terms = [], detalle = '';
        for (var t = 0; t < n; t++) {
          var i = porFila ? idx : t, j = porFila ? t : idx;
          var elem = A[i][j];
          var sg = ((i + j) % 2 === 0) ? 1 : -1;
          var men = D.det(D.minor(A, i, j));
          var adj = F.mul(R(sg), men);
          var apo = F.mul(elem, adj);
          total = F.add(total, apo);
          terms.push(F.tex(elem) + '\\cdot' + (sg === 1 ? '' : '(-1)\\cdot') + '(' + F.tex(men) + ')');
          detalle += '<div class="mx-step"><span class="mx-step-lab">' +
            k('a_{' + (i + 1) + (j + 1) + '} = ' + F.tex(elem) + ',\\; A_{' + (i + 1) + (j + 1) + '} = ' + F.tex(adj)) +
            '</span>' + (F.isZero(elem)
              ? '<span class="mx-mono">aporta 0: no hace falta calcular el menor</span>'
              : viewDet(D.minor(A, i, j)) + k('\\Rightarrow ' + F.tex(apo))) + '</div>';
        }
        h += '<div class="mx-steps">' + detalle + '</div>';
        h += kd('|A| = ' + terms.join(' + ') + ' = ' + F.tex(total));
        var d = D.det(A);
        h += F.eq(total, d)
          ? ok('Coincide con el valor del determinante: ' + k('|A| = ' + F.tex(d)) +
            '. Y saldr\u00eda lo mismo desarrollando por cualquier otra fila o columna.')
          : err('Discrepancia inesperada.');
        var ceros = 0;
        for (var q = 0; q < n; q++) {
          var el = porFila ? A[idx][q] : A[q][idx];
          if (F.isZero(el)) ceros++;
        }
        h += ceros > 0
          ? info('Esta l\u00ednea tiene <b>' + ceros + ' cero' + (ceros === 1 ? '' : 's') + '</b>, as\u00ed que te ahorras ' +
            ceros + ' determinante' + (ceros === 1 ? '' : 's') + ' de orden ' + (n - 1) +
            '. Por eso la estrategia es siempre desarrollar por la l\u00ednea con m\u00e1s ceros.')
          : warn('Esta l\u00ednea no tiene ning\u00fan cero: hay que calcular los ' + n + ' menores completos. ' +
            'Busca otra l\u00ednea con ceros, o cr\u00e9alos t\u00fa con el applet siguiente.');
        return h;
      });
  });

  D.reg('ceros', function (node) {
    build(node, 'Applet \u00b7 Calcular formando ceros',
      'Este es el m\u00e9todo que pide el temario: <b>hacer ceros</b> con transformaciones que no alteren el ' +
      'determinante y luego desarrollar, o llegar a una matriz triangular. ' +
      'Escribe una matriz cuadrada de cualquier orden y el applet muestra el escalonamiento completo, ' +
      'controlando el signo cuando hay intercambios. ' +
      'Ejemplos: <code>1 -2 3 -3<br>2 1 -3 8<br>-1 -3 4 7<br>-3 -1 25 4</code> \u00b7 ' +
      '<code>2 0 5 1<br>3 4 2 0<br>6 1 3 2<br>4 0 2 1</code>.',
      [{ id: 'A', label: 'Matriz A (cuadrada)', rows: 5, value: '2 2 -3 -2\n1 4 -1 2\n4 1 0 1\n8 3 -2 -1' }],
      function (v) {
        var p = needSquare(v.A, 'A');
        if (p.err) return err(p.err);
        var A = p.M, n = p.r;
        var g = D.gauss(A);
        var h = '<p>Escalonamos con transformaciones del tipo ' + k('F_i \\to F_i - kF_j') +
          ', que <b>no</b> alteran el determinante, y anotamos los intercambios, que s\u00ed cambian el signo.</p>';
        h += D.stepsView(g.steps);
        var diag = [], prod = R(1);
        for (var i = 0; i < n; i++) { diag.push(F.tex(g.M[i][i])); prod = F.mul(prod, g.M[i][i]); }
        h += '<p>La matriz final es <b>triangular</b>, y el determinante de una triangular es el producto de su diagonal:</p>';
        h += kd(diag.join('\\cdot') + ' = ' + F.tex(prod));
        if (g.signo === -1) {
          h += warn('Ha habido un n\u00famero <b>impar</b> de intercambios de filas, as\u00ed que hay que cambiar el signo: ' +
            k('|A| = -(' + F.tex(prod) + ') = ' + F.tex(F.neg(prod))));
        } else {
          h += info('El n\u00famero de intercambios ha sido <b>par</b> (o ninguno), as\u00ed que no hay que corregir el signo.');
        }
        var esperado = F.mul(prod, R(g.signo));
        var d = D.det(A);
        h += '<div class="mx-flex"><b>Resultado:</b>' + k('|A| = ' + F.tex(esperado)) + '</div>';
        h += F.eq(esperado, d)
          ? ok('Comprobado con el c\u00e1lculo directo: ' + k('|A| = ' + F.tex(d)) + '.')
          : err('Discrepancia inesperada.');
        h += info('Estrategia recomendada: coloca un <b>1</b> arriba a la izquierda con un intercambio, ' +
          'porque as\u00ed no aparecen fracciones al hacer ceros. Y si no hay ning\u00fan 1, recuerda que puedes ' +
          'dividir una fila entre un n\u00famero <b>compensando</b> el determinante con ese mismo factor.');
        h += warn('Aviso del profesor Gonzalo: si en una transformaci\u00f3n multiplicas la fila que cambia, ' +
          'como en ' + k('2F_1 - 3F_2') + ', est\u00e1s multiplicando el determinante por 2 y tendr\u00e1s que ' +
          'dividir por 2 al final. Lo seguro es usar solo ' + k('F_i \\to F_i - kF_j') + ', donde la fila ' +
          'que cambia va sin coeficiente.');
        return h;
      });
  });

  D.reg('triangular', function (node) {
    build(node, 'Applet \u00b7 Determinantes triangulares',
      'Comprueba la propiedad 10: el determinante de una matriz <b>triangular</b> o diagonal es el producto ' +
      'de los elementos de su diagonal principal. Escribe una matriz y el applet te dice si es triangular ' +
      'y verifica la propiedad. Ejemplos: <code>1 2 3<br>0 4 5<br>0 0 6</code> \u00b7 ' +
      '<code>2 0 0<br>7 -1 0<br>4 3 5</code> \u00b7 <code>3 0 0<br>0 -2 0<br>0 0 5</code>.',
      [{ id: 'A', label: 'Matriz A (cuadrada)', rows: 4, value: '1 2 3\n0 4 5\n0 0 6' }],
      function (v) {
        var p = needSquare(v.A, 'A');
        if (p.err) return err(p.err);
        var A = p.M, n = p.r;
        var sup = true, inf = true;
        for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
          if (j < i && !F.isZero(A[i][j])) sup = false;
          if (j > i && !F.isZero(A[i][j])) inf = false;
        }
        var prod = R(1), diag = [];
        for (var t = 0; t < n; t++) { prod = F.mul(prod, A[t][t]); diag.push(F.tex(A[t][t])); }
        var d = D.det(A);
        var h = '<div class="mx-flex">' + viewDet(A, { hiSet: A.map(function (_, q) { return [q, q]; }) }) + '</div>';
        if (sup && inf) h += ok('Es <b>diagonal</b>: triangular por los dos lados a la vez.');
        else if (sup) h += ok('Es <b>triangular superior</b>: todos los ceros est\u00e1n debajo de la diagonal.');
        else if (inf) h += ok('Es <b>triangular inferior</b>: todos los ceros est\u00e1n encima de la diagonal.');
        else h += warn('No es triangular, as\u00ed que la propiedad no se le aplica directamente. ' +
          'El producto de la diagonal vale ' + k(F.tex(prod)) + ' y el determinante vale ' + k(F.tex(d)) +
          ': no tienen por qu\u00e9 coincidir. Escalona la matriz primero con el applet anterior.');
        if (sup || inf) {
          h += kd('|A| = ' + diag.join('\\cdot') + ' = ' + F.tex(prod));
          h += F.eq(prod, d)
            ? ok('Coincide con el determinante. Este es el objetivo de todo el m\u00e9todo de hacer ceros: ' +
              'llegar a una triangular, donde el c\u00e1lculo es una simple multiplicaci\u00f3n.')
            : err('Discrepancia inesperada.');
          if (F.isZero(prod)) h += info('Hay un cero en la diagonal, as\u00ed que el determinante es cero: ' +
            'la matriz es singular y su rango es menor que ' + n + '.');
        }
        return h;
      });
  });

  D.reg('orden4', function (node) {
    build(node, 'Applet \u00b7 Determinante de orden 4',
      'Para el orden 4 la regla de Sarrus <b>no vale</b>: har\u00edan falta 24 productos. Este applet combina las ' +
      'dos estrategias del temario: primero hace ceros en una l\u00ednea y despu\u00e9s desarrolla por adjuntos, ' +
      'reduciendo el problema a un solo determinante de orden 3. ' +
      'Ejemplos: <code>1 2 3 0<br>1 0 3 2<br>0 4 2 1<br>3 2 1 2</code> \u00b7 ' +
      '<code>2 0 5 1<br>3 4 2 0<br>6 1 3 2<br>4 0 2 1</code>.',
      [{ id: 'A', label: 'Matriz de orden 4', rows: 5, value: '2 0 5 1\n3 4 2 0\n6 1 3 2\n4 0 2 1' }],
      function (v) {
        var p = needSquare(v.A, 'A');
        if (p.err) return err(p.err);
        if (p.r !== 4) return err('Este applet est\u00e1 pensado para el <b>orden 4</b>, y tu matriz es de orden ' +
          p.r + '. Para orden 3 usa Sarrus; para orden 5 o m\u00e1s, el applet de hacer ceros.');
        var A = p.M;
        /* Elegimos la línea con más ceros */
        var mejor = { ceros: -1 };
        for (var i = 0; i < 4; i++) {
          var c = A[i].filter(function (x) { return F.isZero(x); }).length;
          if (c > mejor.ceros) mejor = { ceros: c, tipo: 'fila', idx: i };
        }
        for (var j = 0; j < 4; j++) {
          var c2 = 0;
          for (var q = 0; q < 4; q++) if (F.isZero(A[q][j])) c2++;
          if (c2 > mejor.ceros) mejor = { ceros: c2, tipo: 'columna', idx: j };
        }
        var h = '<div class="mx-flex">' + viewDet(A, { name: '|A|' }) + '</div>';
        h += '<p>La l\u00ednea con m\u00e1s ceros es la <b>' + mejor.tipo + ' ' + (mejor.idx + 1) +
          '</b>, con ' + mejor.ceros + ' cero' + (mejor.ceros === 1 ? '' : 's') +
          '. Desarrollamos por ella para ahorrar menores.</p>';
        h += '<div class="mx-flex">' +
          viewDet(A, mejor.tipo === 'fila' ? { hiRow: mejor.idx } : { hiCol: mejor.idx }) + '</div>';
        var total = R(0), detalle = '', terms = [];
        for (var t = 0; t < 4; t++) {
          var ii = mejor.tipo === 'fila' ? mejor.idx : t;
          var jj = mejor.tipo === 'fila' ? t : mejor.idx;
          var elem = A[ii][jj];
          if (F.isZero(elem)) {
            detalle += '<div class="mx-step"><span class="mx-step-lab">' +
              k('a_{' + (ii + 1) + (jj + 1) + '} = 0') + '</span><span class="mx-mono">se anula el t\u00e9rmino</span></div>';
            continue;
          }
          var sg = ((ii + jj) % 2 === 0) ? 1 : -1;
          var sub = D.minor(A, ii, jj);
          var men = D.det(sub);
          var apo = F.mul(F.mul(elem, R(sg)), men);
          total = F.add(total, apo);
          terms.push((sg === 1 ? '+' : '-') + F.tex(elem) + '\\cdot(' + F.tex(men) + ')');
          detalle += '<div class="mx-step"><span class="mx-step-lab">' +
            k('a_{' + (ii + 1) + (jj + 1) + '} = ' + F.tex(elem) + ',\\;\\text{signo } ' + (sg === 1 ? '+' : '-')) +
            '</span>' + viewDet(sub) + k('= ' + F.tex(men)) + '</div>';
        }
        h += '<div class="mx-steps">' + detalle + '</div>';
        h += kd('|A| = ' + terms.join(' ').replace(/^\+/, '') + ' = ' + F.tex(total));
        var d = D.det(A);
        h += F.eq(total, d) ? ok('Comprobado: ' + k('|A| = ' + F.tex(d)) + '.') : err('Discrepancia inesperada.');
        h += info('Cada cero de la l\u00ednea elegida elimina un determinante de orden 3 entero. Por eso conviene ' +
          '<b>crear</b> ceros antes de desarrollar, con el applet de hacer ceros: es la combinaci\u00f3n de las dos ' +
          't\u00e9cnicas lo que hace manejable el orden 4.');
        return h;
      });
  });

  /* ==================================================================
     PARTE 5 · RANGO POR MENORES
     ================================================================== */

  D.reg('rangomenores', function (node) {
    build(node, 'Applet \u00b7 Rango por menores',
      'El rango es el <b>orden del mayor menor no nulo</b>. El applet busca menores de orden creciente hasta ' +
      'que todos se anulan, mostrando el primero que encuentra distinto de cero en cada orden. ' +
      'Funciona con matrices no cuadradas. ' +
      'Ejemplos del libro: <code>3 -2<br>0 -2</code> \u00b7 <code>1 -1 1<br>0 0 -2<br>2 2 -1</code> \u00b7 ' +
      '<code>-1 0 3 2<br>2 0 6 -4<br>-3 2 -2 1</code>.',
      [{ id: 'A', label: 'Matriz', rows: 5, value: '-1 0 3 2\n2 0 6 -4\n-3 2 -2 1' }],
      function (v) {
        var p = need(v.A, 'A');
        if (p.err) return err(p.err);
        var A = p.M, m = p.r, n = p.c, max = Math.min(m, n);
        function combis(total, tam) {
          var res = [];
          (function rec(ini, act) {
            if (act.length === tam) { res.push(act.slice()); return; }
            for (var i = ini; i < total; i++) { act.push(i); rec(i + 1, act); act.pop(); }
          })(0, []);
          return res;
        }
        var h = '<div class="mx-flex">' + view(A, { name: 'A' }) +
          '<span class="mx-badge">' + p.dim + '</span></div>';
        h += '<p>El rango no puede pasar de ' + k(String(max)) + ', porque es el menor de las dos dimensiones.</p>';
        var rango = 0, detalle = '';
        for (var orden = 1; orden <= max; orden++) {
          var filas = combis(m, orden), cols = combis(n, orden);
          var encontrado = null, cuantos = 0;
          for (var a = 0; a < filas.length && !encontrado; a++) {
            for (var b = 0; b < cols.length; b++) {
              cuantos++;
              var sub = D.subM2(A, filas[a], cols[b]);
              if (!F.isZero(D.det(sub))) { encontrado = { f: filas[a], c: cols[b], sub: sub, val: D.det(sub) }; break; }
            }
          }
          if (encontrado) {
            rango = orden;
            detalle += '<div class="mx-step"><span class="mx-step-lab">Orden ' + orden +
              ': filas ' + encontrado.f.map(function (x) { return x + 1; }).join(',') +
              ' y columnas ' + encontrado.c.map(function (x) { return x + 1; }).join(',') +
              '</span>' + viewDet(encontrado.sub) + k('= ' + F.tex(encontrado.val) + ' \\neq 0') + '</div>';
          } else {
            detalle += '<div class="mx-step"><span class="mx-step-lab">Orden ' + orden +
              '</span><span class="mx-mono">todos los menores de este orden valen cero</span></div>';
            break;
          }
        }
        h += '<div class="mx-steps">' + detalle + '</div>';
        h += '<p><span class="mx-badge">Rango</span> ' + k('\\operatorname{rg}(A) = ' + rango) + '</p>';
        var g = D.gauss(A);
        h += g.rank === rango
          ? ok('Coincide con el rango por escalonamiento de Gauss, que da ' + g.rank +
            '. Los dos m\u00e9todos son v\u00e1lidos: por menores se ve mejor la teor\u00eda, por Gauss se calcula m\u00e1s r\u00e1pido.')
          : err('Discrepancia inesperada.');
        if (rango < max) h += info('Como el rango no es m\u00e1ximo, hay ' + (m - rango) +
          ' fila' + (m - rango === 1 ? '' : 's') + ' que es combinaci\u00f3n lineal de las dem\u00e1s.');
        h += warn('Estrategia del libro: no calcules <b>todos</b> los menores. Encuentra uno de orden 2 no nulo, ' +
          'lo m\u00e1s sencillo posible, y ampl\u00edalo a\u00f1adiendo una fila y una columna cada vez. ' +
          'Si todos los ampliados se anulan, el rango se queda donde estaba.');
        return h;
      });
  });

  D.reg('rangoparam', function (node) {
    build(node, 'Applet \u00b7 Rango con par\u00e1metro por determinantes',
      'Uno de los objetivos del tema: <b>estudiar el rango de una matriz que depende de un par\u00e1metro</b>. ' +
      'Usa la letra <code>m</code> en los elementos: <code>m</code>, <code>-m</code>, <code>2m</code>, ' +
      '<code>m+1</code>, <code>m-1</code>, <code>3m-2</code>. El applet localiza los valores cr\u00edticos ' +
      'anulando el determinante y muestra el rango en cada uno. ' +
      'Ejemplos del libro: <code>m 1 0<br>m-1 m 1<br>m 1 m-1</code> \u00b7 <code>1 2 m<br>3 1 0<br>2 1 4</code> \u00b7 ' +
      '<code>0 1 m<br>m 3 0<br>1 2 m</code>.',
      [
        { id: 'A', label: 'Matriz con par\u00e1metro m', rows: 5, value: '1 2 m\n3 1 0\n2 1 4' },
        { id: 'm', label: 'Valor de m', type: 'range', min: -8, max: 8, step: 0.5, value: 1 }
      ],
      function (v) {
        function ev(s, mv) {
          s = String(s).trim().replace(/\s+/g, '');
          if (!/^[-+0-9m.\/]+$/.test(s)) return null;
          var a = s.match(/^([+-]?)(\d*(?:\.\d+)?)m([+-]\d+(?:\.\d+)?)?$/);
          if (a) {
            var co = a[2] === '' ? 1 : parseFloat(a[2]);
            if (a[1] === '-') co = -co;
            return co * mv + (a[3] ? parseFloat(a[3]) : 0);
          }
          var b = s.match(/^([+-]?\d+(?:\.\d+)?)([+-])m$/);
          if (b) return parseFloat(b[1]) + (b[2] === '-' ? -mv : mv);
          var num = parseFloat(s);
          return isNaN(num) ? null : num;
        }
        function grid(txt, mv) {
          var rows = String(txt).trim().split(/[\n;]+/).map(function (r) { return r.trim(); }).filter(function (r) { return r.length; });
          var G = [], c = null;
          for (var i = 0; i < rows.length; i++) {
            var cells = rows[i].split(/[\s,]+/).filter(function (s) { return s.length; });
            var row = [];
            for (var j = 0; j < cells.length; j++) {
              var x = ev(cells[j], mv);
              if (x === null) return { err: 'No entiendo \u00ab' + cells[j] + '\u00bb. Usa n\u00fameros o expresiones con m: m, 2m, m-1, 3m+2.' };
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
            if (Math.abs(A[0][j]) < 1e-14) continue;
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
        var mv = parseFloat(v.m);
        var g = grid(v.A, mv);
        if (g.err) return err(g.err);
        var fmt = function (x) { return String(Math.round(x * 10000) / 10000); };
        var cuad = g.r === g.c;
        var Q = g.M.map(function (r) { return r.map(function (x) { return D.parseEntry(fmt(x)) || R(0); }); });
        var h = '<div class="mx-flex"><span>Para ' + k('m = ' + fmt(mv)) + '</span>' + view(Q, { name: 'A(m)' }) + '</div>';
        if (cuad) {
          var dd = detN(g.M);
          h += '<p>' + k('|A(m)| = ' + fmt(dd)) + '. ' +
            (Math.abs(dd) < 1e-9 ? '<b>Se anula</b>: el rango baja.' : 'Distinto de cero: el rango es m\u00e1ximo.') + '</p>';
        }
        h += '<p><span class="mx-badge">Rango</span> ' + k('\\operatorname{rg} = ' + rankN(g.M)) + '</p>';
        var crit = [];
        if (cuad) {
          for (var x = -8; x <= 8.0001; x += 0.5) {
            var gx = grid(v.A, x);
            if (gx.err) break;
            if (Math.abs(detN(gx.M)) < 1e-9) crit.push({ m: x, rg: rankN(gx.M) });
          }
        }
        if (crit.length) {
          h += '<table class="ap-tbl"><thead><tr><th>Valor cr\u00edtico</th><th>Determinante</th><th>Rango</th></tr></thead><tbody>';
          crit.forEach(function (c) {
            h += '<tr><td>' + k('m = ' + fmt(c.m)) + '</td><td>0</td><td>' + c.rg + '</td></tr>';
          });
          h += '</tbody></table>';
          h += ok('As\u00ed se redacta la discusi\u00f3n en el examen: <b>si m es distinto de esos valores</b>, ' +
            'el determinante no se anula y el rango es ' + Math.min(g.r, g.c) + '; <b>en cada valor cr\u00edtico</b>, ' +
            'el rango baja al indicado en la tabla.');
        } else if (cuad) {
          h += info('En el intervalo explorado el determinante no se anula nunca: el rango es m\u00e1ximo. ' +
            'Prueba con <code>1 2 m<br>3 1 0<br>2 1 4</code>, que tiene un valor cr\u00edtico claro.');
        } else {
          h += info('La matriz no es cuadrada, as\u00ed que no tiene determinante. La discusi\u00f3n se hace buscando ' +
            'menores: primero uno de orden 2 <b>sin par\u00e1metro</b> que no se anule, y despu\u00e9s ampli\u00e1ndolo.');
        }
        h += warn('El deslizador solo recorre valores de media en media entre \u22128 y 8, as\u00ed que no encontrar\u00eda ' +
          'un valor cr\u00edtico como ' + k('m = 1/3') + '. Usa el applet para <b>ver</b> el fen\u00f3meno y resuelve ' +
          k('|A(m)| = 0') + ' a mano para justificarlo.');
        h += info('Estrategia del profesor Gonzalo: busca primero submatrices <b>sin par\u00e1metro</b> que te ' +
          'garanticen un rango m\u00ednimo. Solo despu\u00e9s pasa a las que contienen ' + k('m') + '. ' +
          'As\u00ed sabes de antemano hasta d\u00f3nde puede bajar el rango.');
        return h;
      });
  });

  D.reg('detrango', function (node) {
    build(node, 'Applet \u00b7 Determinante y rango',
      'Objetivo del tema: <b>calcular un determinante en funci\u00f3n del rango</b>, y al rev\u00e9s. ' +
      'Escribe una matriz cuadrada y el applet muestra la equivalencia completa entre determinante, rango, ' +
      'existencia de inversa y dependencia lineal. ' +
      'Ejemplos: <code>1 1 1 1<br>-1 2 1 1<br>-1 -1 2 1<br>-1 -1 -1 2</code> \u00b7 ' +
      '<code>1 1 1<br>2 2 2<br>3 3 3</code> \u00b7 <code>1 2<br>3 4</code>.',
      [{ id: 'A', label: 'Matriz A (cuadrada)', rows: 5, value: '1 1 1\n2 2 2\n3 3 3' }],
      function (v) {
        var p = needSquare(v.A, 'A');
        if (p.err) return err(p.err);
        var A = p.M, n = p.r, d = D.det(A), g = D.gauss(A);
        var h = '<div class="mx-flex">' + viewDet(A, { name: '|A|' }) + k('= ' + F.tex(d)) + '</div>';
        h += '<table class="ap-tbl"><tbody>';
        h += '<tr><td>Orden</td><td>' + n + '</td></tr>';
        h += '<tr><td>Determinante</td><td>' + k(F.tex(d)) + '</td></tr>';
        h += '<tr><td>Rango</td><td>' + g.rank + '</td></tr>';
        h += '<tr><td>\u00bfTiene inversa?</td><td>' + (F.isZero(d) ? 'no, es singular' : 's\u00ed, es regular') + '</td></tr>';
        h += '<tr><td>Filas independientes</td><td>' + g.rank + ' de ' + n + '</td></tr>';
        h += '</tbody></table>';
        if (F.isZero(d)) {
          h += err('Como ' + k('|A| = 0') + ', el rango es <b>menor</b> que el orden: vale ' + g.rank +
            '. Hay ' + (n - g.rank) + ' fila' + (n - g.rank === 1 ? '' : 's') +
            ' que es combinaci\u00f3n lineal de las dem\u00e1s, y la matriz no tiene inversa.');
        } else {
          h += ok('Como ' + k('|A| \\neq 0') + ', el rango es <b>m\u00e1ximo</b> e igual al orden ' + n +
            ', las ' + n + ' filas son linealmente independientes y la matriz tiene inversa.');
        }
        h += kd('|A| \\neq 0 \\iff \\operatorname{rg}(A) = n \\iff A \\text{ tiene inversa}');
        h += info('Esta triple equivalencia es la que se usa en el tema siguiente para el teorema de ' +
          'Rouch\u00e9-Frobenius, que decide si un sistema de ecuaciones tiene soluci\u00f3n \u00fanica, infinitas o ninguna.');
        h += '<hr class="mx-sep">' + info('Ejercicio t\u00edpico relacionado: si ' + k('|AB| = 5') +
          ', \u00bfpuedes determinar el rango de A? S\u00ed: como ' + k('|A||B| = 5 \\neq 0') + ', ninguno de los dos ' +
          'puede ser cero, luego ambas tienen rango m\u00e1ximo.');
        return h;
      });
  });

  /* ==================================================================
     PARTE 6 · INVERSA CON DETERMINANTES
     ================================================================== */

  D.reg('inversadet', function (node) {
    build(node, 'Applet \u00b7 Inversa con determinantes',
      'El m\u00e9todo del temario, en cinco pasos: determinante, adjuntos, traspuesta, divisi\u00f3n y comprobaci\u00f3n. ' +
      'Escribe una matriz cuadrada. Ejemplos del libro: <code>2 4 1<br>1 -3 2<br>1 -1 -1</code> \u00b7 ' +
      '<code>1 -1<br>-3 2</code> \u00b7 <code>1 2<br>2 4</code> (esta <b>no</b> tiene inversa, observa d\u00f3nde falla).',
      [{ id: 'A', label: 'Matriz A (cuadrada)', rows: 4, value: '2 4 1\n1 -3 2\n1 -1 -1' }],
      function (v) {
        var p = needSquare(v.A, 'A');
        if (p.err) return err(p.err);
        var A = p.M, n = p.r, d = D.det(A);
        var h = '<p><b>Paso 1.</b> Calculamos el determinante. Si vale cero, no hay inversa y aqu\u00ed acaba el ejercicio.</p>';
        h += '<div class="mx-flex">' + viewDet(A, { name: '|A|' }) + k('= ' + F.tex(d)) + '</div>';
        if (F.isZero(d)) {
          h += err('El determinante es <b>cero</b>: la matriz es <b>singular</b> y no tiene inversa. ' +
            'No sigas calculando adjuntos: aunque la matriz de adjuntos exista, el \u00faltimo paso ser\u00eda ' +
            'dividir por cero, que es imposible.');
          h += info('Y observa la coherencia: rango ' + D.gauss(A).rank + ' menor que el orden ' + n +
            ', filas dependientes, determinante cero y sin inversa. Son cuatro formas de decir lo mismo.');
          return h;
        }
        var C = D.cofM(A), T = D.transM(C), Inv = D.invAdj(A);
        h += '<p><b>Paso 2.</b> Calculamos los adjuntos de todos los elementos:</p>';
        h += '<div class="mx-flex">' + view(C, { name: '\\text{Adj}A' }) + '</div>';
        h += '<p><b>Paso 3.</b> Trasponemos la matriz de adjuntos:</p>';
        h += '<div class="mx-flex">' + view(T, { name: '(\\text{Adj}A)^t' }) + '</div>';
        h += '<p><b>Paso 4.</b> Dividimos entre el determinante:</p>';
        h += '<div class="mx-flex">' + k('A^{-1} = \\frac{1}{' + F.tex(d) + '}\\cdot') + view(T) + k('=') +
          view(Inv, { name: '' }) + '</div>';
        h += '<p><b>Paso 5.</b> Comprobamos que el producto da la identidad:</p>';
        var c1 = D.mulM(A, Inv), c2 = D.mulM(Inv, A);
        h += '<div class="mx-grid">' + view(c1, { name: 'A\\cdot A^{-1}' }) + view(c2, { name: 'A^{-1}\\cdot A' }) + '</div>';
        h += (D.eqM(c1, D.ident(n)) && D.eqM(c2, D.ident(n)))
          ? ok('Sale la identidad por los dos lados. La comprobaci\u00f3n cuesta un minuto y detecta cualquier ' +
            'error de signo en los adjuntos: hazla <b>siempre</b>.')
          : err('No sale la identidad, revisa los datos.');
        h += info('Dato para examen: ' + k('|A^{-1}| = \\frac{1}{|A|} = ' + F.tex(F.div(R(1), d))) +
          '. Se deduce de ' + k('|A|\\cdot|A^{-1}| = |I| = 1') + '.');
        if (n === 2) {
          h += ok('Para orden 2 existe el atajo, que conviene memorizar: ' +
            k('\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}^{-1} = \\frac{1}{ad-bc}\\begin{pmatrix}d&-b\\\\-c&a\\end{pmatrix}') +
            '. Se intercambia la diagonal principal, se cambia de signo la secundaria y se divide por el determinante.');
        }
        h += warn('Error frecuente: al formar la matriz de adjuntos <b>no</b> se multiplica por los elementos ' +
          'de A. Eso solo se hace al desarrollar un determinante. Aqu\u00ed solo van los adjuntos, con su signo.');
        return h;
      });
  });

  D.reg('invparam', function (node) {
    build(node, 'Applet \u00b7 \u00bfCu\u00e1ndo existe la inversa?',
      'Escribe una matriz con el par\u00e1metro <code>m</code> y el applet resuelve ' + k('|A(m)| = 0') +
      ' por barrido para localizar los valores que hacen la matriz <b>singular</b>. Para el resto, existe inversa. ' +
      'Ejemplos del libro: <code>m 1<br>4 m</code> \u00b7 <code>m 2 -1<br>0 m 3<br>4 1 -m</code> \u00b7 ' +
      '<code>1 0 -1<br>0 m 3<br>4 1 -m</code>.',
      [
        { id: 'A', label: 'Matriz con par\u00e1metro m', rows: 4, value: 'm 1\n4 m' },
        { id: 'm', label: 'Valor de m', type: 'range', min: -8, max: 8, step: 0.5, value: 3 }
      ],
      function (v) {
        function ev(s, mv) {
          s = String(s).trim().replace(/\s+/g, '');
          if (!/^[-+0-9m.\/]+$/.test(s)) return null;
          var a = s.match(/^([+-]?)(\d*(?:\.\d+)?)m([+-]\d+(?:\.\d+)?)?$/);
          if (a) {
            var co = a[2] === '' ? 1 : parseFloat(a[2]);
            if (a[1] === '-') co = -co;
            return co * mv + (a[3] ? parseFloat(a[3]) : 0);
          }
          var b = s.match(/^([+-]?\d+(?:\.\d+)?)([+-])m$/);
          if (b) return parseFloat(b[1]) + (b[2] === '-' ? -mv : mv);
          var num = parseFloat(s);
          return isNaN(num) ? null : num;
        }
        function grid(txt, mv) {
          var rows = String(txt).trim().split(/[\n;]+/).map(function (r) { return r.trim(); }).filter(function (r) { return r.length; });
          var G = [], c = null;
          for (var i = 0; i < rows.length; i++) {
            var cells = rows[i].split(/[\s,]+/).filter(function (s) { return s.length; });
            var row = [];
            for (var j = 0; j < cells.length; j++) {
              var x = ev(cells[j], mv);
              if (x === null) return { err: 'No entiendo \u00ab' + cells[j] + '\u00bb.' };
              row.push(x);
            }
            if (c === null) c = row.length; else if (row.length !== c) return { err: 'Las filas no tienen el mismo n\u00famero de elementos.' };
            G.push(row);
          }
          if (!G.length) return { err: 'Escribe una matriz.' };
          if (G.length !== c) return { err: 'Debe ser cuadrada: la tuya es ' + G.length + '\u00d7' + c + '.' };
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
        var mv = parseFloat(v.m);
        var g = grid(v.A, mv);
        if (g.err) return err(g.err);
        var fmt = function (x) { return String(Math.round(x * 10000) / 10000); };
        var Q = g.M.map(function (r) { return r.map(function (x) { return D.parseEntry(fmt(x)) || R(0); }); });
        var dd = detN(g.M);
        var h = '<div class="mx-flex"><span>Para ' + k('m = ' + fmt(mv)) + '</span>' + viewDet(Q) +
          k('= ' + fmt(dd)) + '</div>';
        var sing = [];
        for (var x = -8; x <= 8.0001; x += 0.5) {
          var gx = grid(v.A, x);
          if (gx.err) break;
          if (Math.abs(detN(gx.M)) < 1e-9) sing.push(x);
        }
        h += Math.abs(dd) < 1e-9
          ? err('Con este valor el determinante es <b>cero</b>: la matriz es singular y <b>no</b> tiene inversa.')
          : ok('Con este valor el determinante es distinto de cero: la matriz es <b>regular</b> y s\u00ed tiene inversa.');
        if (sing.length) {
          h += '<p><b>Valores que anulan el determinante</b> en el intervalo explorado:</p>';
          h += '<div class="mx-flex">' + sing.map(function (s) { return k('m = ' + fmt(s)); }).join(' \u00b7 ') + '</div>';
          h += info('Respuesta tipo examen: <b>A tiene inversa para todo ' + k('m') + ' distinto de ' +
            sing.map(fmt).join(' y ') + '</b>. Y para esos valores concretos, no la tiene.');
        } else {
          h += info('No se han encontrado valores singulares entre \u22128 y 8. Prueba con <code>m 1<br>4 m</code>, ' +
            'que se anula en ' + k('m = 2') + ' y ' + k('m = -2') + '.');
        }
        h += warn('El barrido va de media en media, as\u00ed que puede perderse ra\u00edces fraccionarias o irracionales. ' +
          'Plantea ' + k('|A(m)| = 0') + ' y resu\u00e9lvela algebraicamente: eso es lo que puntúa.');
        return h;
      });
  });

  /* ==================================================================
     ENTRENADOR
     ================================================================== */

  D.reg('entrenador', function (node) {
    node.classList.add('applet');
    node.innerHTML = '<h4 class="mx-title">Applet \u00b7 Entrenador de determinantes</h4>' +
      '<div class="mx-instr">Aqu\u00ed calculas t\u00fa. El applet propone un ejercicio, lo resuelves <b>en papel</b> ' +
      'y escribes la respuesta. Para los determinantes y el rango escribe solo un n\u00famero, admitiendo ' +
      'fracciones como <code>3/4</code>. Para la inversa, una fila por l\u00ednea. ' +
      'Pulsa <i>Comprobar</i> y despu\u00e9s <i>Otro ejercicio</i>.</div>' +
      '<div class="mx-inputs"></div><div class="mx-out ap-out"></div>';
    var box = node.querySelector('.mx-inputs'), out = node.querySelector('.mx-out');

    var sel = document.createElement('select');
    sel.className = 'mx-in';
    ['Determinante orden 2', 'Determinante orden 3', 'Determinante orden 4', 'Rango', 'Inversa orden 2'].forEach(function (o) {
      var op = document.createElement('option'); op.value = o; op.textContent = o; sel.appendChild(op);
    });
    var l1 = document.createElement('label');
    l1.className = 'mx-field'; l1.innerHTML = '<span>Tipo de ejercicio</span>'; l1.appendChild(sel);

    var resp = document.createElement('textarea');
    resp.className = 'mx-in'; resp.rows = 3; resp.spellcheck = false;
    var l2 = document.createElement('label');
    l2.className = 'mx-field'; l2.innerHTML = '<span>Tu respuesta</span>'; l2.appendChild(resp);

    var bC = document.createElement('button');
    bC.className = 'mx-btn'; bC.type = 'button'; bC.textContent = 'Comprobar';
    var bS = document.createElement('button');
    bS.className = 'mx-btn mx-sec'; bS.type = 'button'; bS.textContent = 'Ver soluci\u00f3n';
    var bN = document.createElement('button');
    bN.className = 'mx-btn mx-sec'; bN.type = 'button'; bN.textContent = 'Otro ejercicio';
    var w = document.createElement('div');
    w.className = 'mx-field'; w.innerHTML = '<span>&nbsp;</span>';
    var row = document.createElement('div');
    row.className = 'mx-flex';
    row.appendChild(bC); row.appendChild(bS); row.appendChild(bN);
    w.appendChild(row);

    box.appendChild(l1); box.appendChild(l2); box.appendChild(w);

    var est = { enun: '', num: null, mat: null, tipo: '' };
    var aciertos = 0, intentos = 0;

    function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
    function randM(n, lo, hi, ceros) {
      var A = [];
      for (var i = 0; i < n; i++) {
        A.push([]);
        for (var j = 0; j < n; j++) {
          var poner = (ceros && Math.random() < 0.35) ? 0 : rnd(lo, hi);
          A[i].push(R(poner));
        }
      }
      return A;
    }

    function nuevo() {
      est.tipo = sel.value;
      est.num = null; est.mat = null;
      var h = '';
      if (est.tipo === 'Determinante orden 2') {
        var A = randM(2, -5, 6, false);
        est.num = D.det(A);
        h = '<p><b>Calcula</b> el determinante:</p><div class="mx-flex">' + viewDet(A) + '</div>';
      } else if (est.tipo === 'Determinante orden 3') {
        var B = randM(3, -4, 5, true);
        est.num = D.det(B);
        h = '<p><b>Calcula</b> el determinante, por Sarrus o por adjuntos:</p><div class="mx-flex">' + viewDet(B) + '</div>';
      } else if (est.tipo === 'Determinante orden 4') {
        var C = randM(4, -3, 4, true);
        est.num = D.det(C);
        h = '<p><b>Calcula</b> el determinante. Recuerda: Sarrus <b>no</b> vale aqu\u00ed. Haz ceros y desarrolla:</p>' +
          '<div class="mx-flex">' + viewDet(C) + '</div>';
      } else if (est.tipo === 'Rango') {
        var E = randM(3, -3, 4, false);
        if (rnd(1, 2) === 1) {
          var f = rnd(1, 3);
          E[2] = E[0].map(function (x, j) { return F.add(F.mul(R(f), x), E[1][j]); });
        }
        est.num = R(D.gauss(E).rank);
        h = '<p><b>Calcula el rango</b> y escribe solo el n\u00famero:</p><div class="mx-flex">' +
          view(E, { name: 'A' }) + '</div>';
      } else {
        var G;
        for (var t = 0; t < 60; t++) {
          G = randM(2, -3, 4, false);
          var dg = D.det(G);
          if (!F.isZero(dg) && Math.abs(F.num(dg)) <= 10) break;
        }
        est.mat = D.invAdj(G);
        h = '<p><b>Calcula</b> ' + k('A^{-1}') + ' con determinantes. Si sale con fracciones, escr\u00edbelas como <code>3/4</code>:</p>' +
          '<div class="mx-flex">' + view(G, { name: 'A' }) + '</div>';
      }
      est.enun = h;
      resp.value = '';
      out.innerHTML = h + info('Resuelve en papel, escribe tu respuesta y pulsa <i>Comprobar</i>. ' +
        'Marcador: ' + aciertos + ' de ' + intentos + '.');
      D.renderTex(out);
    }

    function comprobar() {
      intentos++;
      var h = est.enun;
      if (est.num !== null) {
        var q = D.parseEntry(String(resp.value).trim());
        if (!q) { out.innerHTML = h + err('Escribe un n\u00famero: entero, decimal con punto o fracci\u00f3n como 3/4.'); D.renderTex(out); return; }
        if (F.eq(q, est.num)) { aciertos++; h += ok('\u00a1Correcto! Vale ' + k(F.tex(est.num)) + '.'); }
        else {
          h += err('No. El valor correcto es ' + k(F.tex(est.num)) + ' y t\u00fa has escrito ' + k(F.tex(q)) + '.');
          if (est.tipo === 'Determinante orden 3') h += info('Revisa los signos de los tres productos negativos: ' +
            'es donde se pierde la mayor\u00eda de los puntos en Sarrus.');
          if (est.tipo === 'Determinante orden 4') h += info('\u00bfHas usado Sarrus por error? En orden 4 no vale. ' +
            'Haz ceros en una l\u00ednea y desarrolla por adjuntos.');
          if (est.tipo === 'Rango') h += info('Escalona la matriz y cuenta las filas que <b>no</b> se anulan, ' +
            'o busca el mayor menor no nulo.');
        }
      } else {
        var pm = D.parseM(resp.value);
        if (pm.err) { out.innerHTML = h + err(pm.err); D.renderTex(out); return; }
        if (D.eqM(pm.M, est.mat)) { aciertos++; h += ok('\u00a1Correcto!'); }
        else {
          h += err('No coincide. Tu respuesta y la correcta:');
          h += '<div class="mx-grid">' + view(pm.M, { name: '\\text{tu respuesta}' }) +
            view(est.mat, { name: '\\text{correcta}' }) + '</div>';
          h += info('Para orden 2: intercambia la diagonal principal, cambia el signo de la secundaria ' +
            'y divide por el determinante. Un signo mal puesto es el fallo m\u00e1s frecuente.');
        }
      }
      h += '<p class="mx-mono">Marcador: ' + aciertos + ' de ' + intentos + '.</p>';
      out.innerHTML = h;
      D.renderTex(out);
    }

    function solucion() {
      var h = est.enun;
      if (est.num !== null) h += info('Soluci\u00f3n: ' + k(F.tex(est.num)));
      else h += '<div class="mx-flex"><span>Soluci\u00f3n:</span>' + view(est.mat) + '</div>';
      h += warn('Mirar la soluci\u00f3n antes de intentarlo en papel produce la sensaci\u00f3n de haber aprendido ' +
        'sin haber aprendido. Ese autoenga\u00f1o se paga el d\u00eda del examen.');
      out.innerHTML = h;
      D.renderTex(out);
    }

    bC.addEventListener('click', comprobar);
    bS.addEventListener('click', solucion);
    bN.addEventListener('click', nuevo);
    sel.addEventListener('change', nuevo);
    nuevo();
  });

  /* ==================================================================
     DIAGNÓSTICO · recuento diferido y filas coloreadas
     ================================================================== */

  D.reg('diagnostico', function (node) {
    node.classList.add('applet');

    function fila(nombre, valor, bien) {
      return '<tr><td>' + nombre + '</td><td style="color:' + (bien ? '#1b5e20' : '#b71c1c') +
        ';font-weight:600">' + valor + (bien ? ' \u2714' : ' \u2717') + '</td></tr>';
    }

    var A2 = [[R(1), R(2)], [R(3), R(4)]];
    var A3 = [[R(2), R(0), R(1)], [R(3), R(-1), R(2)], [R(1), R(4), R(0)]];
    var tA = F.eq(F.add(R(1, 3), R(1, 6)), R(1, 2));
    var tD2 = F.eq(D.det(A2), R(-2));
    var tD3 = F.eq(D.det(A3), D.det(D.transM(A3)));
    var tInv = D.eqM(D.mulM(A2, D.invAdj(A2)), D.ident(2));
    var tRg = D.gauss([[R(1), R(1), R(1)], [R(2), R(2), R(2)], [R(3), R(3), R(3)]]).rank === 1;
    var nReg = Object.keys(D.registry).length;
    var cssOk = getComputedStyle(node).paddingTop !== '0px';
    var esperadas = ['adjunto', 'adjuntos', 'ceros', 'detrango', 'diagnostico',
      'ecuacion', 'entrenador', 'escalar', 'inversadet', 'invparam', 'matadj',
      'menor', 'orden23', 'orden4', 'producto', 'props', 'rangomenores',
      'rangoparam', 'reducir', 'sarrus', 'transforma', 'triangular'];
    var faltan = esperadas.filter(function (c) { return !D.registry[c]; });
    h += fila('Applets registrados', String(nReg) + (faltan.length ? ' (faltan: ' + faltan.join(', ') + ')' : ''), faltan.length === 0);

    var h = '<h4 class="mx-title">Applet \u00b7 Diagn\u00f3stico del motor</h4><table class="ap-tbl"><tbody>';
    h += fila('N\u00facleo <code>window.DET</code>', window.DET ? 'activo' : 'ausente', !!window.DET);
    h += fila('KaTeX local <code>window.katex</code>', window.katex ? 'cargado' : 'AUSENTE', !!window.katex);
    h += fila('Hoja <code>applets.css</code>', cssOk ? 'aplicada' : 'no aplicada', cssOk);
    h += fila('Applets registrados', String(nReg) + (faltan.length ? ' (faltan: ' + faltan.join(', ') + ')' : ''), faltan.length === 0);
    h += fila('Aritm\u00e9tica exacta', '1/3 + 1/6 = 1/2', tA);
    h += fila('Determinante orden 2', '\u22122', tD2);
    h += fila('Propiedad |A| = |At|', 'coinciden', tD3);
    h += fila('Inversa por adjuntos', 'AA\u207b\u00b9 = I', tInv);
    h += fila('Rango con filas proporcionales', '1', tRg);
    h += '</tbody></table>';
    h += '<p class="mx-mono" data-dt-count="1">contando applets\u2026</p>';
    h += '<p class="mx-mono">claves: ' + Object.keys(D.registry).sort().join(' \u00b7 ') + '</p>';
    node.innerHTML = h;
    D.renderTex(node);

    setTimeout(function () {
      var todos = document.querySelectorAll('[data-applet-det]');
      var mont = document.querySelectorAll('[data-applet-det][data-mounted="1"]');
      var sin = [];
      for (var i = 0; i < todos.length; i++) {
        if (todos[i].getAttribute('data-mounted') !== '1') sin.push(todos[i].getAttribute('data-applet-det'));
      }
      var dest = node.querySelector('[data-dt-count="1"]');
      if (!dest) return;
      var bien = (mont.length === todos.length);
      dest.innerHTML = 'applets en la pagina: ' + todos.length + ', montados: ' + mont.length +
        (bien ? ' \u2714' : ' \u2717');
      dest.style.color = bien ? '#1b5e20' : '#b71c1c';
      dest.style.fontWeight = '600';
      if (!bien) {
        var av = document.createElement('div');
        av.className = 'mx-bad';
        av.innerHTML = 'Sin montar: <code>' + sin.join('</code>, <code>') + '</code>.';
        node.appendChild(av);
      }
      if (D.log.length) {
        var e2 = document.createElement('div');
        e2.className = 'mx-warn';
        e2.innerHTML = 'Incidencias en <code>window.DET.log</code>: ' + D.log.length +
          '. Consulta la consola del navegador con <code>DET.log</code>.';
        node.appendChild(e2);
      }
    }, 120);
  });

  /* ------------------------------------------------------------------
     MONTAJE DE LOS NODOS PENDIENTES
     ------------------------------------------------------------------ */

  function mount() {
    var nodes = document.querySelectorAll('[data-applet-det]');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.getAttribute('data-mounted') === '1') continue;
      var key = node.getAttribute('data-applet-det');
      var fn = D.registry[key];
      node.setAttribute('data-mounted', '1');
      if (!fn) {
        node.classList.add('applet');
        node.innerHTML = '<div class="mx-bad ap-err">No existe ning\u00fan applet con la clave <code>' +
          D.esc(key) + '</code>. Claves disponibles: <code>' +
          Object.keys(D.registry).sort().join('</code>, <code>') + '</code>.</div>';
        D.log.push({ clave: key, error: 'clave inexistente' });
        continue;
      }
      try { fn(node); }
      catch (e) {
        node.classList.add('applet');
        node.innerHTML = '<div class="mx-bad ap-err">El applet <code>' + D.esc(key) +
          '</code> no ha podido montarse: ' + D.esc(e.message) + '</div>';
        D.log.push({ clave: key, error: e.message, stack: e.stack });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(mount, 0); });
  } else {
    setTimeout(mount, 0);
  }
})();
