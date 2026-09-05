/* =====================================================================
   det-applets-det.js · Tema 2 «Determinantes»
   2.º de Bachillerato · Matemáticas Aplicadas a las Ciencias Sociales
   Ruta: 2-BatxMatesCCSS/determinantes/assets/det-applets-det.js

   CAPA DE ÁLGEBRA DE DETERMINANTES del tema. Se carga DESPUÉS del núcleo
   det-applets.js y de la capa matricial det-applets-alg.js, y añade
   propiedades a window.DET. No registra ningún applet: solo pone el
   motor exacto que usan los módulos A, B, C y D y el applet de
   diagnóstico del núcleo.

   Toda la aritmética es EXACTA con fracciones de BigInt (DET.Frac). No
   aparece ni una sola coma flotante en los cálculos: los seis productos
   de Sarrus, los adjuntos, el método de hacer ceros, el método de los
   orlados y la inversa por la adjunta se calculan con fracciones, así
   que 1/3, 7/12 o −5/2 salen tal cual.

   ---------------------------------------------------------------------
   ÍNDICE DE LA CAPA
   ---------------------------------------------------------------------
     1 · utilidades internas (normalización de matrices, texto en
         castellano con coma decimal y signo menos U+2212)
     2 · regla de Sarrus: sarrus
     3 · submatrices, menores complementarios y adjuntos:
         subMat, menorComp, signoAdj, adjunto, matAdjuntos
     4 · desarrollo por los adjuntos: desarrollo, mejorLinea
     5 · método de hacer ceros: hacerCeros
     6 · propiedades detectadas: detPropiedades
     7 · menores de una matriz y rango por orlados:
         menoresDeOrden, cuentaMenores, orlados, rangoMenores
     8 · inversa por la matriz de los adjuntos: inversaDet
     9 · determinante y rango con un parámetro:
         polDeMatriz, detParam, rangoParamEstudio
    10 · publicación en window.DET

   ---------------------------------------------------------------------
   API que añade a window.DET
   ---------------------------------------------------------------------

   SARRUS
     .sarrus(A)                  exige orden 3
                                 -> {positivos:[T,T,T], negativos:[T,T,T],
                                     sumaPositivos, sumaNegativos,
                                     total:Frac, orden:3, tex, matTex}
                                 cada término T es
                                 {factores:[Frac,Frac,Frac],
                                  indices:[[i,j],[i,j],[i,j]],   (base 0)
                                  indices1:[[i,j],…],            (base 1)
                                  signo: 1|-1, valor:Frac,
                                  tex, txt, diagonal:'principal'|'secundaria'|
                                  'paralela'}

   MENORES COMPLEMENTARIOS Y ADJUNTOS  (i, j en BASE 0)
     .subMat(A, i, j)            Mat sin la fila i ni la columna j
     .menorComp(A, i, j)         Frac: determinante del menor complementario
     .signoAdj(i, j)             1 o -1, el (−1)^{i+j} del tablero
     .adjunto(A, i, j)           Frac: signoAdj · menorComp
     .matAdjuntos(A)             Mat de los adjuntos, Adj(A)
     .tableroSignos(n)           matriz n×n de 1 y −1 (para dibujar)

   DESARROLLO POR LOS ADJUNTOS
     .desarrollo(A, tipo, k)     tipo en 'fila' | 'columna', k en BASE 0
                                 -> {terminos:[{elem, signo, menor,
                                     menorMat, adjunto, producto, i, j,
                                     i1, j1, tex, txt}],
                                     total:Frac, ceros, tipo, indice,
                                     indice1, orden, tex, matTex,
                                     descripcion}
     .mejorLinea(A)              -> {tipo, indice, indice1, ceros,
                                     descripcion, empates:[…]}

   MÉTODO DE HACER CEROS
     .hacerCeros(A, opts)        opts {pivote:[i,j], columna:j, fila:i,
                                       rondas:n (por omisión, hasta orden 2)}
                                 -> {pasos:[{descripcion, matriz, factor,
                                     tipo, tex}],
                                     rondas:[…], total:Frac, matrizFinal,
                                     factor:Frac, orden, nulo}

   PROPIEDADES
     .detPropiedades(A)          array de propiedades detectadas:
                                 [{clave, titulo, tipo:'anula'|'simplifica'|
                                   'informativa', descripcion, tex,
                                   anula:bool, valor:Frac|null,
                                   factor:Frac|null, lineas:[…]}]

   MENORES Y RANGO POR MENORES
     .menoresDeOrden(A, h)       [{filas, cols, filas1, cols1, mat,
                                   valor:Frac, nulo, tex}]   (base 0)
     .cuentaMenores(f, c, h)     número combinatorio C(f,h)·C(c,h)
     .orlados(A, filas, cols)    menores orlados de uno dado:
                                 [{filas, cols, filas1, cols1, mat, valor,
                                   filaNueva, colNueva, descripcion}]
     .rangoMenores(A)            método de los orlados de verdad:
                                 -> {rango, pasos:[{descripcion, orden,
                                     menor, valor, tex}], menorTestigo,
                                     orden, maximo, tex}

   INVERSA POR DETERMINANTES
     .inversaDet(A)              -> {existe, det:Frac, adj:Mat, adjT:Mat,
                                     inv:Mat, pasos:[{descripcion, tex}],
                                     motivo, orden, comprobacion}

   PARÁMETRO
     .polDeMatriz(A, 'k')        -> {pol, tex, grado, letra, matTex, matriz}
     .detParam(A, 'k')           -> {pol, polTex, grado, letra, raices,
                                     factorizacion, factorTex, casos,
                                     tabla, matTex, cuadratica, tex,
                                     siempreNulo, constante}
     .rangoParamEstudio(A, 'k')  -> {letra, generico, criticos, tabla,
                                     pasos, tex, matTex, f, c, maximo}

   FORMATO DE ENTRADA DE LAS MATRICES
     Toda función de esta capa acepta indistintamente:
       · un Mat de la capa matricial,
       · un array de arrays de números, cadenas o Frac,
       · una cadena «1 2 3; 4 5 6» (se lee con DET.parseMat).
     Las funciones con parámetro (polDeMatriz, detParam,
     rangoParamEstudio) aceptan además:
       · una cadena con el parámetro: «1 k 0; k 1 2» (se lee con
         DET.parseMatParam),
       · el objeto {A, f, c, letra} que devuelve DET.parseMatParam, con
         cada entrada como polinomio (array de Frac por grados),
       · un array de arrays de cadenas: [['1','k'],['k','1']].

   ÍNDICES
     Dentro de la capa los índices son BASE 0 (i = 0 es la primera fila).
     Todos los textos de «descripcion» que se muestran al alumno usan
     BASE 1 («fila 1, columna 1»), coma decimal y el signo menos U+2212.
     El LaTeX aparece únicamente en los campos llamados «tex».

   Sin OJS, sin CDN, sin dependencias externas. JS clásico (var/function)
   salvo el uso de BigInt, que ya usa el núcleo.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.DET;
  if (!S) {
    if (window.console && console.warn) {
      console.warn('det-applets-det.js necesita det-applets.js cargado antes.');
    }
    return;
  }
  if (!S.matricial) {
    if (window.console && console.warn) {
      console.warn('det-applets-det.js necesita det-applets-alg.js cargado antes.');
    }
  }

  var Frac = S.Frac;
  var MENOS = '\u2212';                       /* signo menos tipográfico */

  /* ==================================================================
     1 · utilidades internas
     ================================================================== */
  function F0() { return new Frac(0); }
  function F1() { return new Frac(1); }
  function F(v) { return S.fracDe(v); }
  function cero(f) { return f.n === 0n; }
  function negat(f) { return f.n < 0n; }
  function absF(f) { return negat(f) ? f.opuesto() : new Frac(f.n, f.d); }
  function igualF(a, b) { return a.cmp(b) === 0; }
  function fTex(f) { return f.tex(true); }

  /* Normaliza cualquier entrada admitida a un Mat. */
  function mat(A, nombre) {
    nombre = nombre || 'la matriz';
    if (A && A.a && A.f !== undefined && A.c !== undefined) return A;
    if (typeof A === 'string') return S.parseMat(A);
    if (A && A.length) return new S.Mat(A);
    throw Error('Falta ' + nombre + '. Escríbela con las filas separadas por «;» y los ' +
      'elementos con espacios, por ejemplo 1 2 3; 4 5 6; 7 8 10.');
  }
  function exigeCuadrada(A, para) {
    A = mat(A);
    if (A.f !== A.c) {
      throw Error('Solo las matrices cuadradas tienen determinante: esta es de ' + A.f + '×' + A.c +
        '. ' + (para || 'Escribe tantas filas como columnas.'));
    }
    return A;
  }
  function exigeOrden(A, n, para) {
    A = exigeCuadrada(A, para);
    if (A.f !== n) {
      throw Error('Esta regla solo vale para el orden ' + n + ', y la matriz es de orden ' + A.f +
        '. ' + (para || ''));
    }
    return A;
  }
  function exigeIndice(v, max, nombre) {
    var k = Number(v);
    if (!isFinite(k) || Math.round(k) !== k) {
      throw Error('El número de ' + nombre + ' debe ser un entero. Recuerda que dentro del motor ' +
        'se cuenta desde 0, así que la primera ' + nombre + ' es la 0.');
    }
    if (k < 0 || k >= max) {
      throw Error('No existe la ' + nombre + ' ' + (k + 1) + ': la matriz solo tiene ' + max +
        '. Elige un valor entre 1 y ' + max + '.');
    }
    return k;
  }

  /* Texto de un número para el alumno: entero, decimal con coma o
     fracción, siempre con el signo menos U+2212. */
  function numTxt(f) {
    f = F(f);
    var neg = negat(f), n = neg ? -f.n : f.n, d = f.d, k, pot = 1n;
    if (d === 1n) return (neg ? MENOS : '') + n.toString();
    for (k = 1; k <= 3; k++) {
      pot = pot * 10n;
      if ((n * pot) % d === 0n) {
        var e = (n * pot) / d, s = e.toString();
        while (s.length <= k) s = '0' + s;
        return (neg ? MENOS : '') + s.slice(0, s.length - k) + ',' + s.slice(s.length - k);
      }
    }
    return (neg ? MENOS : '') + n.toString() + '/' + d.toString();
  }
  /* Como numTxt, pero entre paréntesis si es negativo: + (−3) */
  function parTxt(f) {
    f = F(f);
    return negat(f) ? '(' + numTxt(f) + ')' : numTxt(f);
  }
  function prodTxt(lista) {
    return lista.map(parTxt).join(' · ');
  }
  function prodTex(lista) {
    return lista.map(function (f) {
      return (f.d === 1n && f.n >= 0n) ? fTex(f) : '\\left(' + fTex(f) + '\\right)';
    }).join(' \\cdot ');
  }
  /* Un determinante se escribe con barras verticales; una matriz, con
     paréntesis (esto último ya lo hace S.matTex). */
  function detTex(M) {
    M = mat(M);
    var filas = [], i, j;
    for (i = 0; i < M.f; i++) {
      var cel = [];
      for (j = 0; j < M.c; j++) cel.push(fTex(M.a[i][j]));
      filas.push(cel.join(' & '));
    }
    return '\\begin{vmatrix}' + filas.join(' \\\\ ') + '\\end{vmatrix}';
  }
  function lista1(v) {                        /* [0,2] -> "1 y 3" */
    var t = v.map(function (x) { return String(x + 1); });
    if (t.length === 1) return t[0];
    return t.slice(0, t.length - 1).join(', ') + ' y ' + t[t.length - 1];
  }
  function ordinalLinea(tipo) { return tipo === 'columna' ? 'columna' : 'fila'; }
  function letraLinea(tipo) { return tipo === 'columna' ? 'C' : 'F'; }

  function copiaMat(A) { return mat(A).copia(); }
  function subLista(A, filas, cols) {         /* submatriz por listas de índices */
    A = mat(A);
    var a = [], p, q;
    for (p = 0; p < filas.length; p++) {
      var fila = [];
      for (q = 0; q < cols.length; q++) fila.push(A.a[filas[p]][cols[q]]);
      a.push(fila);
    }
    return new S.Mat(a);
  }
  function combina(n, r) {                    /* subconjuntos de tamaño r de 0..n-1 */
    var out = [];
    if (r < 0 || r > n) return out;
    (function rec(inicio, acc) {
      if (acc.length === r) { out.push(acc.slice()); return; }
      var i;
      for (i = inicio; i < n; i++) { acc.push(i); rec(i + 1, acc); acc.pop(); }
    })(0, []);
    return out;
  }
  function binom(n, k) {
    if (k < 0 || k > n) return 0;
    var r = 1, i;
    for (i = 0; i < k; i++) r = r * (n - i) / (i + 1);
    return Math.round(r);
  }

  /* ==================================================================
     2 · regla de Sarrus (solo orden 3)
     ================================================================== */
  var SARRUS_POS = [
    { idx: [[0, 0], [1, 1], [2, 2]], diagonal: 'principal' },
    { idx: [[0, 1], [1, 2], [2, 0]], diagonal: 'paralela' },
    { idx: [[0, 2], [1, 0], [2, 1]], diagonal: 'paralela' }
  ];
  var SARRUS_NEG = [
    { idx: [[0, 2], [1, 1], [2, 0]], diagonal: 'secundaria' },
    { idx: [[0, 0], [1, 2], [2, 1]], diagonal: 'paralela' },
    { idx: [[0, 1], [1, 0], [2, 2]], diagonal: 'paralela' }
  ];

  function terminoSarrus(A, def, signo) {
    var fac = def.idx.map(function (p) { return A.a[p[0]][p[1]]; });
    var v = fac[0].por(fac[1]).por(fac[2]);
    return {
      factores: fac,
      indices: def.idx.map(function (p) { return [p[0], p[1]]; }),
      indices1: def.idx.map(function (p) { return [p[0] + 1, p[1] + 1]; }),
      nombres: def.idx.map(function (p) { return 'a' + (p[0] + 1) + (p[1] + 1); }),
      signo: signo,
      diagonal: def.diagonal,
      valor: v,
      tex: prodTex(fac) + ' = ' + fTex(v),
      txt: prodTxt(fac) + ' = ' + numTxt(v)
    };
  }

  function sarrus(A) {
    A = exigeOrden(A, 3, 'La regla de Sarrus solo sirve para determinantes de orden 3: ' +
      'en orden 4 o más hay que desarrollar por los adjuntos.');
    var pos = SARRUS_POS.map(function (d) { return terminoSarrus(A, d, 1); });
    var neg = SARRUS_NEG.map(function (d) { return terminoSarrus(A, d, -1); });
    var sp = pos[0].valor.mas(pos[1].valor).mas(pos[2].valor);
    var sn = neg[0].valor.mas(neg[1].valor).mas(neg[2].valor);
    var total = sp.menos(sn);
    var tex = '\\begin{aligned}\\det(A) &= ' +
      pos.map(function (t) { return prodTex(t.factores); }).join(' + ') +
      ' - \\left(' + neg.map(function (t) { return prodTex(t.factores); }).join(' + ') + '\\right) \\\\' +
      '&= \\left(' + pos.map(function (t) { return fTex(t.valor); }).join(' + ') + '\\right) - ' +
      '\\left(' + neg.map(function (t) { return fTex(t.valor); }).join(' + ') + '\\right) \\\\' +
      '&= ' + fTex(sp) + ' - \\left(' + fTex(sn) + '\\right) = ' + fTex(total) +
      '\\end{aligned}';
    return {
      positivos: pos, negativos: neg,
      sumaPositivos: sp, sumaNegativos: sn,
      total: total, valor: total, orden: 3,
      matriz: A, matTex: S.matTex(A), tex: tex,
      descripcion: 'La suma de los tres productos de la diagonal principal y sus paralelas vale ' +
        numTxt(sp) + ', y la de los tres de la diagonal secundaria y sus paralelas vale ' +
        numTxt(sn) + '. El determinante es la diferencia: ' + numTxt(total) + '.'
    };
  }

  /* ==================================================================
     3 · submatrices, menores complementarios y adjuntos
     ================================================================== */
  function subMat(A, i, j) {
    A = mat(A);
    i = exigeIndice(i, A.f, 'fila');
    j = exigeIndice(j, A.c, 'columna');
    if (A.f === 1 || A.c === 1) {
      throw Error('Al suprimir la fila ' + (i + 1) + ' y la columna ' + (j + 1) + ' de una matriz de ' +
        A.f + '×' + A.c + ' no queda ninguna fila o columna. El menor complementario de un ' +
        'elemento solo tiene sentido a partir del orden 2; en el orden 1 se toma igual a 1 por convenio.');
    }
    var a = [], p, q;
    for (p = 0; p < A.f; p++) {
      if (p === i) continue;
      var fila = [];
      for (q = 0; q < A.c; q++) { if (q === j) continue; fila.push(A.a[p][q]); }
      a.push(fila);
    }
    return new S.Mat(a);
  }

  function menorComp(A, i, j) {
    A = exigeCuadrada(A, 'El menor complementario se define dentro de un determinante.');
    i = exigeIndice(i, A.f, 'fila');
    j = exigeIndice(j, A.c, 'columna');
    if (A.f === 1) return F1();               /* convenio: determinante vacío = 1 */
    return S.det(subMat(A, i, j));
  }

  function signoAdj(i, j) {
    var a = Number(i), b = Number(j);
    if (!isFinite(a) || !isFinite(b) || Math.round(a) !== a || Math.round(b) !== b) {
      throw Error('Para calcular el signo (−1)^(i+j) hacen falta dos índices enteros.');
    }
    return ((a + b) % 2 === 0) ? 1 : -1;
  }

  function adjunto(A, i, j) {
    A = exigeCuadrada(A, 'El adjunto de un elemento se define dentro de un determinante.');
    var m = menorComp(A, i, j);
    return signoAdj(i, j) === 1 ? m : m.opuesto();
  }

  function matAdjuntos(A) {
    A = exigeCuadrada(A, 'La matriz de los adjuntos solo existe si la matriz es cuadrada.');
    var a = [], i, j;
    for (i = 0; i < A.f; i++) {
      a.push([]);
      for (j = 0; j < A.c; j++) a[i].push(adjunto(A, i, j));
    }
    return new S.Mat(a);
  }

  function tableroSignos(n) {
    var k = Number(n), a = [], i, j;
    if (!isFinite(k) || k < 1 || Math.round(k) !== k) {
      throw Error('El tablero de signos se dibuja para un orden entero mayor o igual que 1.');
    }
    for (i = 0; i < k; i++) {
      a.push([]);
      for (j = 0; j < k; j++) a[i].push(signoAdj(i, j));
    }
    return a;
  }

  /* ==================================================================
     4 · desarrollo por los adjuntos
     ================================================================== */
  function normTipo(tipo) {
    var t = String(tipo === undefined ? 'fila' : tipo).toLowerCase();
    if (t === 'fila' || t === 'f' || t === 'filas') return 'fila';
    if (t === 'columna' || t === 'c' || t === 'columnas' || t === 'col') return 'columna';
    throw Error('El desarrollo se hace por una fila o por una columna: escribe «fila» o «columna», ' +
      'no «' + tipo + '».');
  }

  function desarrollo(A, tipo, k) {
    A = exigeCuadrada(A, 'El desarrollo por los adjuntos solo se aplica a un determinante.');
    tipo = normTipo(tipo);
    var n = A.f;
    k = exigeIndice(k === undefined ? 0 : k, n, tipo === 'fila' ? 'fila' : 'columna');
    var terminos = [], total = F0(), ceros = 0, t;
    for (t = 0; t < n; t++) {
      var i = (tipo === 'fila') ? k : t;
      var j = (tipo === 'fila') ? t : k;
      var elem = A.a[i][j];
      var sg = signoAdj(i, j);
      var men = menorComp(A, i, j);
      var adj = sg === 1 ? men : men.opuesto();
      var prod = elem.por(adj);
      if (cero(elem)) ceros++;
      total = total.mas(prod);
      terminos.push({
        elem: elem, signo: sg, menor: men,
        menorMat: (n === 1 ? null : subMat(A, i, j)),
        adjunto: adj, producto: prod,
        i: i, j: j, i1: i + 1, j1: j + 1,
        nombre: 'a' + (i + 1) + (j + 1),
        nombreAdj: 'A' + (i + 1) + (j + 1),
        tex: 'a_{' + (i + 1) + (j + 1) + '} \\cdot A_{' + (i + 1) + (j + 1) + '} = ' +
          prodTex([elem, adj]) + ' = ' + fTex(prod),
        txt: 'a' + (i + 1) + (j + 1) + ' · A' + (i + 1) + (j + 1) + ' = ' +
          prodTxt([elem, adj]) + ' = ' + numTxt(prod)
      });
    }
    var tex = '\\det(A) = ' + terminos.map(function (x, p) {
      return (p === 0 ? '' : ' + ') + 'a_{' + x.i1 + x.j1 + '}A_{' + x.i1 + x.j1 + '}';
    }).join('') + ' = ' + terminos.map(function (x) { return prodTex([x.elem, x.adjunto]); }).join(' + ') +
      ' = ' + fTex(total);
    return {
      terminos: terminos, total: total, valor: total, ceros: ceros,
      tipo: tipo, indice: k, indice1: k + 1, orden: n,
      matriz: A, matTex: S.matTex(A), tex: tex,
      descripcion: 'Desarrollamos por la ' + ordinalLinea(tipo) + ' ' + (k + 1) + ': multiplicamos ' +
        'cada elemento de esa ' + ordinalLinea(tipo) + ' por su adjunto y sumamos los ' + n +
        ' productos. El resultado es ' + numTxt(total) + '.' +
        (ceros ? ' Esa ' + ordinalLinea(tipo) + ' tiene ' + ceros + ' cero' + (ceros === 1 ? '' : 's') +
          ', así que ' + (ceros === 1 ? 'un sumando desaparece' : 'esos sumandos desaparecen') + '.' : '')
    };
  }

  function cerosLinea(A, tipo, k) {
    var n = (tipo === 'fila') ? A.c : A.f, t, c = 0;
    for (t = 0; t < n; t++) {
      if (cero(tipo === 'fila' ? A.a[k][t] : A.a[t][k])) c++;
    }
    return c;
  }

  function mejorLinea(A) {
    A = exigeCuadrada(A, 'Para elegir la línea del desarrollo la matriz debe ser cuadrada.');
    var n = A.f, mejor = null, empates = [], i;
    for (i = 0; i < n; i++) {
      empates.push({ tipo: 'fila', indice: i, indice1: i + 1, ceros: cerosLinea(A, 'fila', i) });
    }
    for (i = 0; i < n; i++) {
      empates.push({ tipo: 'columna', indice: i, indice1: i + 1, ceros: cerosLinea(A, 'columna', i) });
    }
    empates.forEach(function (L) {
      if (!mejor || L.ceros > mejor.ceros) mejor = L;
    });
    var iguales = empates.filter(function (L) { return L.ceros === mejor.ceros; });
    return {
      tipo: mejor.tipo, indice: mejor.indice, indice1: mejor.indice1, ceros: mejor.ceros,
      lineas: empates, empates: iguales,
      descripcion: mejor.ceros === 0
        ? 'Ninguna línea tiene ceros, así que da igual por dónde desarrollar: elegimos la fila 1.'
        : 'La ' + ordinalLinea(mejor.tipo) + ' ' + mejor.indice1 + ' es la que más ceros tiene (' +
          mejor.ceros + '), así que desarrollando por ella nos ahorramos ' + mejor.ceros +
          ' menor' + (mejor.ceros === 1 ? '' : 'es') + ' de orden ' + (n - 1) + '.'
    };
  }

  /* ==================================================================
     5 · método de hacer ceros
     Solo se usa la operación F_i -> F_i + k·F_j, que NO altera el
     determinante. Si el pivote no es 1 ni −1 se saca factor común de su
     fila (propiedad 5), y ese factor queda registrado y multiplica al
     final.
     ================================================================== */
  function buscaPivote(A, opts) {
    var n = A.f, i, j;
    if (opts && opts.pivote) {
      i = exigeIndice(opts.pivote[0], n, 'fila');
      j = exigeIndice(opts.pivote[1], n, 'columna');
      if (cero(A.a[i][j])) {
        throw Error('El elemento de la fila ' + (i + 1) + ', columna ' + (j + 1) +
          ' es 0 y no puede hacer de pivote: elige uno distinto de cero, mejor un 1 o un −1.');
      }
      return [i, j];
    }
    var colFija = (opts && opts.columna !== undefined) ? exigeIndice(opts.columna, n, 'columna') : null;
    var filaFija = (opts && opts.fila !== undefined) ? exigeIndice(opts.fila, n, 'fila') : null;
    var mejor = null;
    for (i = 0; i < n; i++) {
      for (j = 0; j < n; j++) {
        if (colFija !== null && j !== colFija) continue;
        if (filaFija !== null && i !== filaFija) continue;
        var v = A.a[i][j];
        if (cero(v)) continue;
        /* prioridad: 1, luego −1, luego entero, luego lo que haya.
           A igualdad, el que tenga más ceros en su columna. */
        var pri = igualF(v, F1()) ? 0 : (igualF(v, F1().opuesto()) ? 1 : (v.d === 1n ? 2 : 3));
        var cand = { i: i, j: j, pri: pri, ceros: cerosLinea(A, 'columna', j) };
        if (!mejor || cand.pri < mejor.pri || (cand.pri === mejor.pri && cand.ceros > mejor.ceros)) {
          mejor = cand;
        }
      }
    }
    return mejor ? [mejor.i, mejor.j] : null;
  }

  function hacerCeros(A, opts) {
    A = exigeCuadrada(A, 'El método de hacer ceros calcula un determinante, así que la matriz ' +
      'debe tener tantas filas como columnas.');
    opts = opts || {};
    var pasos = [], rondas = [];
    var factor = F1();                        /* det(A) = factor · det(actual) */
    var actual = A.copia();
    var limite = (opts.rondas === undefined) ? Infinity : Number(opts.rondas);
    var vueltas = 0, nulo = false;

    pasos.push({
      tipo: 'inicio', factor: null, matriz: actual.copia(),
      descripcion: 'Partimos del determinante de orden ' + actual.f + '. Solo vamos a usar la ' +
        'operación Fi → Fi + k·Fj, que no cambia el valor del determinante.',
      tex: '\\det(A) = ' + detTex(actual)
    });

    while (actual.f > 2 && vueltas < limite) {
      var piv = buscaPivote(actual, vueltas === 0 ? opts : null);
      if (!piv) {
        nulo = true;
        pasos.push({
          tipo: 'nulo', factor: null, matriz: actual.copia(),
          descripcion: 'Todos los elementos son 0, así que el determinante vale 0.', tex: ''
        });
        break;
      }
      var pi = piv[0], pj = piv[1];
      var ronda = { orden: actual.f, pivote: [pi, pj], pivote1: [pi + 1, pj + 1], factor: null, pasos: [] };

      /* 1 · si el pivote no es ±1, se saca factor de su fila */
      var pv = actual.a[pi][pj];
      if (!igualF(absF(pv), F1())) {
        var g = pv;
        var nueva = actual.copia(), q;
        for (q = 0; q < nueva.c; q++) nueva.a[pi][q] = nueva.a[pi][q].entre(g);
        factor = factor.por(g);
        ronda.factor = g;
        var pf = {
          tipo: 'factor', factor: g, matriz: nueva.copia(),
          descripcion: 'El pivote elegido es el elemento de la fila ' + (pi + 1) + ', columna ' +
            (pj + 1) + ', que vale ' + numTxt(g) + '. Sacamos factor común ' + numTxt(g) +
            ' de la fila ' + (pi + 1) + ': multiplicar una línea por un número multiplica el ' +
            'determinante por ese número, así que el factor ' + numTxt(g) + ' sale fuera y el ' +
            'pivote pasa a ser 1.',
          tex: '\\det = ' + fTex(g) + '\\cdot' + detTex(nueva)
        };
        pasos.push(pf); ronda.pasos.push(pf);
        actual = nueva;
        pv = actual.a[pi][pj];
      } else {
        var pe = {
          tipo: 'pivote', factor: null, matriz: actual.copia(),
          descripcion: 'Elegimos como pivote el elemento de la fila ' + (pi + 1) + ', columna ' +
            (pj + 1) + ', que vale ' + numTxt(pv) + ': al ser ' + numTxt(pv) +
            ' las cuentas para hacer ceros salen sin fracciones.',
          tex: ''
        };
        pasos.push(pe); ronda.pasos.push(pe);
      }

      /* 2 · ceros en el resto de la columna del pivote */
      var i;
      for (i = 0; i < actual.f; i++) {
        if (i === pi) continue;
        if (cero(actual.a[i][pj])) continue;
        var kf = actual.a[i][pj].entre(actual.a[pi][pj]).opuesto();   /* F_i -> F_i + kf·F_pi */
        var M = actual.copia(), c2;
        for (c2 = 0; c2 < M.c; c2++) M.a[i][c2] = M.a[i][c2].mas(kf.por(actual.a[pi][c2]));
        var ps = {
          tipo: 'ceros', factor: null, matriz: M.copia(),
          fila: i, filaPivote: pi, k: kf,
          descripcion: 'A la fila ' + (i + 1) + ' le sumamos ' + parTxt(kf) + ' veces la fila ' +
            (pi + 1) + ' (F' + (i + 1) + ' → F' + (i + 1) + ' + ' + parTxt(kf) + '·F' + (pi + 1) +
            '), y así el elemento de la fila ' + (i + 1) + ', columna ' + (pj + 1) +
            ' pasa a ser 0. Sumar a una línea un múltiplo de otra no altera el determinante.',
          tex: 'F_{' + (i + 1) + '} \\to F_{' + (i + 1) + '} + \\left(' + fTex(kf) + '\\right)F_{' +
            (pi + 1) + '}'
        };
        pasos.push(ps); ronda.pasos.push(ps);
        actual = M;
      }

      /* 3 · desarrollo por la columna del pivote: un único sumando */
      var D = desarrollo(actual, 'columna', pj);
      var elem = actual.a[pi][pj];
      var sg = signoAdj(pi, pj);
      var men = subMat(actual, pi, pj);
      factor = factor.por(elem).por(new Frac(sg));
      ronda.desarrollo = D;
      ronda.signo = sg;
      ronda.elem = elem;
      ronda.menor = men;
      var pd = {
        tipo: 'desarrollo', factor: elem.por(new Frac(sg)), matriz: men.copia(),
        descripcion: 'En la columna ' + (pj + 1) + ' solo queda un elemento distinto de cero, el de ' +
          'la fila ' + (pi + 1) + ', que vale ' + numTxt(elem) + '. Desarrollando por esa columna ' +
          'queda un solo sumando: ' + numTxt(elem) + ' por su adjunto, cuyo signo es ' +
          (sg === 1 ? '+' : MENOS) + ' porque ' + (pi + 1) + ' + ' + (pj + 1) + ' = ' +
          (pi + pj + 2) + ' es ' + ((pi + pj) % 2 === 0 ? 'par' : 'impar') + '. Nos queda un ' +
          'determinante de orden ' + men.f + '.',
        tex: '\\det = ' + (sg === 1 ? '' : '-') + prodTex([elem]) + '\\cdot' +
          detTex(men)
      };
      pasos.push(pd); ronda.pasos.push(pd);
      rondas.push(ronda);
      actual = men;
      vueltas++;
    }

    var restante = nulo ? F0() : S.det(actual);
    var total = nulo ? F0() : factor.por(restante);
    if (!nulo) {
      pasos.push({
        tipo: 'final', factor: factor, matriz: actual.copia(),
        descripcion: actual.f === 1
          ? 'El determinante de orden 1 que queda vale ' + numTxt(restante) + '. Multiplicando por ' +
            'todo lo que hemos ido sacando fuera (' + numTxt(factor) + '), el determinante pedido ' +
            'vale ' + numTxt(total) + '.'
          : 'El determinante de orden ' + actual.f + ' que queda se calcula directamente y vale ' +
            numTxt(restante) + '. Multiplicando por todo lo que hemos ido sacando fuera (' +
            numTxt(factor) + '), el determinante pedido vale ' + numTxt(total) + '.',
        tex: '\\det(A) = ' + prodTex([factor, restante]) + ' = ' + fTex(total)
      });
    }
    return {
      pasos: pasos, rondas: rondas, total: total, valor: total,
      matrizFinal: actual, restante: restante, factor: factor,
      orden: A.f, nulo: nulo, matriz: A, matTex: S.matTex(A)
    };
  }

  /* ==================================================================
     6 · propiedades que anulan o simplifican un determinante
     ================================================================== */
  function proporcion(u, v) {
    /* devuelve k con u = k·v, o null si no son proporcionales */
    var i, k = null;
    var uNulo = true, vNulo = true;
    for (i = 0; i < u.length; i++) { if (!cero(u[i])) uNulo = false; if (!cero(v[i])) vNulo = false; }
    if (uNulo || vNulo) return null;
    for (i = 0; i < u.length; i++) {
      if (cero(v[i])) { if (!cero(u[i])) return null; continue; }
      var q = u[i].entre(v[i]);
      if (k === null) k = q;
      else if (!igualF(k, q)) return null;
    }
    return k;
  }
  function mcdLista(lista) {
    /* mayor factor común (como Frac) de una lista de fracciones no todas nulas */
    var num = 0n, den = 1n, i, f, b;
    function bab(x) { return x < 0n ? -x : x; }
    function bmcd(a, b2) { a = bab(a); b2 = bab(b2); while (b2) { var t = a % b2; a = b2; b2 = t; } return a; }
    function bmcm(a, b2) { return a / bmcd(a, b2) * b2; }
    for (i = 0; i < lista.length; i++) {
      f = lista[i];
      if (cero(f)) continue;
      num = bmcd(num, bab(f.n));
      den = bmcm(den, f.d);
    }
    if (num === 0n) return null;
    b = new Frac(num, den);
    return b;
  }

  function detPropiedades(A) {
    A = mat(A);
    var out = [];
    if (A.f !== A.c) {
      out.push({
        clave: 'noCuadrada', titulo: 'La matriz no es cuadrada', tipo: 'informativa',
        anula: false, valor: null, factor: null, lineas: [],
        descripcion: 'Esta matriz es de ' + A.f + '×' + A.c + ' y solo las matrices cuadradas ' +
          'tienen determinante. Lo que sí se puede calcular es su rango.',
        tex: ''
      });
      return out;
    }
    var n = A.f, i, j, d = S.det(A);

    if (A.esNula()) {
      out.push({
        clave: 'nula', titulo: 'Matriz nula', tipo: 'anula', anula: true, valor: F0(),
        factor: null, lineas: [],
        descripcion: 'Todos los elementos son 0, así que el determinante vale 0.',
        tex: '\\det(A) = 0'
      });
    }
    /* líneas de ceros */
    for (i = 0; i < n; i++) {
      if (A.fila(i).every(cero)) {
        out.push({
          clave: 'filaNula', titulo: 'Una fila de ceros', tipo: 'anula', anula: true, valor: F0(),
          factor: null, lineas: [{ tipo: 'fila', indice: i, indice1: i + 1 }],
          descripcion: 'La fila ' + (i + 1) + ' es toda de ceros: un determinante con una línea ' +
            'de ceros vale 0.',
          tex: '\\det(A) = 0'
        });
      }
    }
    for (j = 0; j < n; j++) {
      if (A.col(j).every(cero)) {
        out.push({
          clave: 'columnaNula', titulo: 'Una columna de ceros', tipo: 'anula', anula: true,
          valor: F0(), factor: null, lineas: [{ tipo: 'columna', indice: j, indice1: j + 1 }],
          descripcion: 'La columna ' + (j + 1) + ' es toda de ceros: un determinante con una línea ' +
            'de ceros vale 0.',
          tex: '\\det(A) = 0'
        });
      }
    }
    /* líneas iguales o proporcionales */
    var p, q, k;
    for (p = 0; p < n; p++) {
      for (q = p + 1; q < n; q++) {
        k = proporcion(A.fila(p), A.fila(q));
        if (k !== null) {
          out.push({
            clave: igualF(k, F1()) ? 'filasIguales' : 'filasProporcionales',
            titulo: igualF(k, F1()) ? 'Dos filas iguales' : 'Dos filas proporcionales',
            tipo: 'anula', anula: true, valor: F0(), factor: k,
            lineas: [{ tipo: 'fila', indice: p, indice1: p + 1 }, { tipo: 'fila', indice: q, indice1: q + 1 }],
            descripcion: igualF(k, F1())
              ? 'Las filas ' + (p + 1) + ' y ' + (q + 1) + ' son iguales, así que el determinante vale 0.'
              : 'La fila ' + (p + 1) + ' es ' + numTxt(k) + ' veces la fila ' + (q + 1) +
                ': dos líneas proporcionales anulan el determinante.',
            tex: 'F_{' + (p + 1) + '} = ' + fTex(k) + 'F_{' + (q + 1) + '} \\Rightarrow \\det(A) = 0'
          });
        }
        k = proporcion(A.col(p), A.col(q));
        if (k !== null) {
          out.push({
            clave: igualF(k, F1()) ? 'columnasIguales' : 'columnasProporcionales',
            titulo: igualF(k, F1()) ? 'Dos columnas iguales' : 'Dos columnas proporcionales',
            tipo: 'anula', anula: true, valor: F0(), factor: k,
            lineas: [{ tipo: 'columna', indice: p, indice1: p + 1 },
              { tipo: 'columna', indice: q, indice1: q + 1 }],
            descripcion: igualF(k, F1())
              ? 'Las columnas ' + (p + 1) + ' y ' + (q + 1) + ' son iguales, así que el ' +
                'determinante vale 0.'
              : 'La columna ' + (p + 1) + ' es ' + numTxt(k) + ' veces la columna ' + (q + 1) +
                ': dos líneas proporcionales anulan el determinante.',
            tex: 'C_{' + (p + 1) + '} = ' + fTex(k) + 'C_{' + (q + 1) + '} \\Rightarrow \\det(A) = 0'
          });
        }
      }
    }
    /* triangular, diagonal, identidad */
    var esSup = S.esTriangularSup(A), esInf = S.esTriangularInf(A);
    if (esSup || esInf) {
      var prod = F1();
      for (i = 0; i < n; i++) prod = prod.por(A.a[i][i]);
      var nombre = (esSup && esInf) ? (S.esIdentidad(A) ? 'identidad' : 'diagonal')
        : (esSup ? 'triangular superior' : 'triangular inferior');
      out.push({
        clave: 'triangular', titulo: 'Matriz ' + nombre, tipo: 'simplifica',
        anula: cero(prod), valor: prod, factor: null, lineas: [],
        descripcion: 'La matriz es ' + nombre + ', así que el determinante es el producto de los ' +
          'elementos de la diagonal principal: ' + A.a.map(function (f2, r) { return numTxt(f2[r]); })
            .join(' · ') + ' = ' + numTxt(prod) + '.',
        tex: '\\det(A) = ' + prodTex(A.a.map(function (f2, r) { return f2[r]; })) + ' = ' + fTex(prod)
      });
    }
    /* factor común en una línea */
    for (i = 0; i < n; i++) {
      k = mcdLista(A.fila(i));
      if (k && !igualF(k, F1())) {
        out.push({
          clave: 'factorFila', titulo: 'Factor común en una fila', tipo: 'simplifica',
          anula: false, valor: null, factor: k,
          lineas: [{ tipo: 'fila', indice: i, indice1: i + 1 }],
          descripcion: 'Todos los elementos de la fila ' + (i + 1) + ' son múltiplos de ' +
            numTxt(k) + ': se puede sacar ese factor fuera del determinante y las cuentas quedan ' +
            'más pequeñas.',
          tex: '\\det(A) = ' + fTex(k) + '\\cdot\\det(A\')'
        });
      }
    }
    for (j = 0; j < n; j++) {
      k = mcdLista(A.col(j));
      if (k && !igualF(k, F1())) {
        out.push({
          clave: 'factorColumna', titulo: 'Factor común en una columna', tipo: 'simplifica',
          anula: false, valor: null, factor: k,
          lineas: [{ tipo: 'columna', indice: j, indice1: j + 1 }],
          descripcion: 'Todos los elementos de la columna ' + (j + 1) + ' son múltiplos de ' +
            numTxt(k) + ': se puede sacar ese factor fuera del determinante.',
          tex: '\\det(A) = ' + fTex(k) + '\\cdot\\det(A\')'
        });
      }
    }
    /* rango deficiente sin causa evidente: alguna línea es combinación de las demás */
    if (cero(d)) {
      var yaExplicado = out.some(function (o) { return o.anula; });
      if (!yaExplicado) {
        out.push({
          clave: 'combinacionLineal', titulo: 'Una línea es combinación lineal de las demás',
          tipo: 'anula', anula: true, valor: F0(), factor: null, lineas: [],
          descripcion: 'El determinante vale 0 aunque no haya líneas nulas ni proporcionales: ' +
            'alguna fila es combinación lineal de las otras, y eso también anula el determinante. ' +
            'El rango es ' + S.rango(A) + ', menor que el orden ' + n + '.',
          tex: '\\det(A) = 0'
        });
      }
    }
    /* línea con muchos ceros: sugerencia de desarrollo */
    var ml = mejorLinea(A);
    if (ml.ceros > 0) {
      out.push({
        clave: 'lineaConCeros', titulo: 'Hay una línea con ceros', tipo: 'simplifica',
        anula: false, valor: null, factor: null,
        lineas: [{ tipo: ml.tipo, indice: ml.indice, indice1: ml.indice1 }],
        descripcion: ml.descripcion, tex: ''
      });
    }
    return out;
  }

  /* ==================================================================
     7 · menores de una matriz y rango por el método de los orlados
     ================================================================== */
  function cuentaMenores(f, c, h) {
    var m = Number(f), n = Number(c), k = Number(h);
    if (m === undefined || n === undefined) return 0;
    return binom(m, k) * binom(n, k);
  }

  function fichaMenor(A, filas, cols) {
    var M = subLista(A, filas, cols);
    var v = S.det(M);
    return {
      filas: filas.slice(), cols: cols.slice(),
      filas1: filas.map(function (x) { return x + 1; }),
      cols1: cols.map(function (x) { return x + 1; }),
      orden: filas.length, mat: M, matriz: M, valor: v, nulo: cero(v),
      tex: detTex(M) + ' = ' + fTex(v),
      descripcion: 'Menor de orden ' + filas.length + ' con las filas ' + lista1(filas) +
        ' y las columnas ' + lista1(cols) + ': vale ' + numTxt(v) + '.'
    };
  }

  function menoresDeOrden(A, h) {
    A = mat(A);
    var k = Number(h), maxi = Math.min(A.f, A.c);
    if (!isFinite(k) || Math.round(k) !== k || k < 1) {
      throw Error('El orden de un menor es un número entero mayor o igual que 1.');
    }
    if (k > maxi) {
      throw Error('Una matriz de ' + A.f + '×' + A.c + ' no tiene menores de orden ' + k +
        ': el orden máximo posible es ' + maxi + ', el menor de sus dos dimensiones.');
    }
    var filas = combina(A.f, k), cols = combina(A.c, k), out = [], p, q;
    for (p = 0; p < filas.length; p++) {
      for (q = 0; q < cols.length; q++) out.push(fichaMenor(A, filas[p], cols[q]));
    }
    return out;
  }

  function orlados(A, filas, cols) {
    A = mat(A);
    if (!filas || !cols || !filas.length || !cols.length || filas.length !== cols.length) {
      throw Error('Para orlar un menor hazme llegar sus filas y sus columnas, tantas de unas ' +
        'como de otras, por ejemplo orlados(A, [0,1], [0,2]).');
    }
    var out = [], i, j;
    for (i = 0; i < A.f; i++) {
      if (filas.indexOf(i) >= 0) continue;
      for (j = 0; j < A.c; j++) {
        if (cols.indexOf(j) >= 0) continue;
        var nf = filas.concat([i]).slice().sort(function (a, b) { return a - b; });
        var nc = cols.concat([j]).slice().sort(function (a, b) { return a - b; });
        var fi = fichaMenor(A, nf, nc);
        fi.filaNueva = i; fi.colNueva = j;
        fi.filaNueva1 = i + 1; fi.colNueva1 = j + 1;
        fi.descripcion = 'Orlamos el menor con la fila ' + (i + 1) + ' y la columna ' + (j + 1) +
          ': el menor de orden ' + nf.length + ' que sale vale ' + numTxt(fi.valor) + '.';
        out.push(fi);
      }
    }
    return out;
  }

  function rangoMenores(A) {
    A = mat(A);
    var pasos = [], maxi = Math.min(A.f, A.c);
    pasos.push({
      tipo: 'inicio', orden: 0, menor: null, valor: null,
      descripcion: 'La matriz es de ' + A.f + '×' + A.c + ', así que su rango es como mucho ' + maxi +
        '. Buscamos el mayor orden con algún menor distinto de cero.',
      tex: S.matTex(A)
    });
    if (A.esNula()) {
      pasos.push({
        tipo: 'nula', orden: 0, menor: null, valor: F0(),
        descripcion: 'Todos los elementos son 0: no hay ningún menor de orden 1 distinto de cero, ' +
          'así que el rango es 0.',
        tex: '\\operatorname{rg}(A) = 0'
      });
      return {
        rango: 0, pasos: pasos, menorTestigo: null, orden: 0, maximo: maxi,
        matriz: A, matTex: S.matTex(A), tex: '\\operatorname{rg}(A) = 0'
      };
    }
    /* 1 · un elemento no nulo: rango al menos 1 */
    var testigo = null, i, j;
    for (i = 0; i < A.f && !testigo; i++) {
      for (j = 0; j < A.c && !testigo; j++) {
        if (!cero(A.a[i][j])) testigo = fichaMenor(A, [i], [j]);
      }
    }
    pasos.push({
      tipo: 'primero', orden: 1, menor: testigo, valor: testigo.valor,
      descripcion: 'El elemento de la fila ' + testigo.filas1[0] + ', columna ' + testigo.cols1[0] +
        ' vale ' + numTxt(testigo.valor) + ', distinto de cero. Ya tenemos un menor de orden 1 no ' +
        'nulo, así que el rango es al menos 1.',
      tex: testigo.tex
    });
    /* 2 · orlar mientras se pueda */
    var rango = 1;
    while (rango < maxi) {
      var cand = orlados(A, testigo.filas, testigo.cols);
      var bueno = null, t;
      for (t = 0; t < cand.length && !bueno; t++) if (!cand[t].nulo) bueno = cand[t];
      if (bueno) {
        pasos.push({
          tipo: 'orla', orden: rango + 1, menor: bueno, valor: bueno.valor,
          probados: cand.length,
          descripcion: 'Orlamos el menor de orden ' + rango + ' con la fila ' + bueno.filaNueva1 +
            ' y la columna ' + bueno.colNueva1 + '. El menor de orden ' + (rango + 1) +
            ' con las filas ' + lista1(bueno.filas) + ' y las columnas ' + lista1(bueno.cols) +
            ' vale ' + numTxt(bueno.valor) + ', distinto de cero: el rango es al menos ' +
            (rango + 1) + '.',
          tex: bueno.tex
        });
        testigo = bueno;
        rango++;
      } else {
        pasos.push({
          tipo: 'todosNulos', orden: rango + 1, menor: null, valor: F0(),
          probados: cand.length, orladosNulos: cand,
          descripcion: 'Todos los menores orlados del menor de orden ' + rango + ' que hemos ' +
            'encontrado (' + cand.length + ' en total) valen 0. Por el método de los orlados, eso ' +
            'basta para asegurar que no hay ningún menor de orden ' + (rango + 1) +
            ' distinto de cero: el rango es ' + rango + '.',
          tex: '\\operatorname{rg}(A) = ' + rango
        });
        break;
      }
    }
    if (rango === maxi) {
      pasos.push({
        tipo: 'maximo', orden: rango, menor: testigo, valor: testigo.valor,
        descripcion: 'Hemos llegado al orden máximo posible, ' + maxi + ', con un menor distinto ' +
          'de cero (' + numTxt(testigo.valor) + '), así que el rango es ' + rango + '.',
        tex: '\\operatorname{rg}(A) = ' + rango
      });
    }
    return {
      rango: rango, pasos: pasos, menorTestigo: testigo, orden: rango, maximo: maxi,
      matriz: A, matTex: S.matTex(A), tex: '\\operatorname{rg}(A) = ' + rango
    };
  }

  /* ==================================================================
     8 · inversa por la matriz de los adjuntos
     ================================================================== */
  function inversaDet(A) {
    A = mat(A);
    var pasos = [];
    if (A.f !== A.c) {
      return {
        existe: false, det: null, adj: null, adjT: null, inv: null, orden: null,
        pasos: pasos, comprobacion: null,
        motivo: 'Solo las matrices cuadradas pueden tener inversa, y esta es de ' + A.f + '×' + A.c +
          '. La inversa debe cumplir A·A⁻¹ = A⁻¹·A = I, y eso exige el mismo número de filas que ' +
          'de columnas.'
      };
    }
    var n = A.f, d = S.det(A);
    pasos.push({
      descripcion: 'Calculamos primero el determinante: vale ' + numTxt(d) + '.',
      tex: '\\det(A) = ' + fTex(d)
    });
    if (cero(d)) {
      pasos.push({
        descripcion: 'Como el determinante es 0, la matriz es singular y no tiene inversa: en la ' +
          'fórmula A⁻¹ = (1/|A|)·Adj(A)ᵗ habría que dividir entre 0.',
        tex: '\\det(A) = 0 \\Rightarrow \\nexists A^{-1}'
      });
      return {
        existe: false, det: d, adj: null, adjT: null, inv: null, orden: n,
        pasos: pasos, comprobacion: null,
        motivo: 'La matriz es singular: su determinante vale 0, así que no tiene inversa. Una ' +
          'matriz cuadrada tiene inversa si y solo si su determinante es distinto de cero.'
      };
    }
    var adj = matAdjuntos(A);
    pasos.push({
      descripcion: 'Construimos la matriz de los adjuntos Adj(A): en el lugar (i, j) va el adjunto ' +
        'del elemento que ocupa ese lugar, es decir el menor complementario con el signo del tablero.',
      tex: '\\operatorname{Adj}(A) = ' + S.matTex(adj)
    });
    var adjT = S.matTrans(adj);
    pasos.push({
      descripcion: 'Transponemos la matriz de los adjuntos.',
      tex: '\\operatorname{Adj}(A)^{t} = ' + S.matTex(adjT)
    });
    var inv = S.matEscalar(adjT, F1().entre(d));
    pasos.push({
      descripcion: 'Dividimos entre el determinante, es decir multiplicamos por 1/' + numTxt(d) +
        ', y ya tenemos la inversa.',
      tex: 'A^{-1} = \\frac{1}{' + fTex(d) + '}\\cdot' + S.matTex(adjT) + ' = ' + S.matTex(inv)
    });
    var prod = S.matProd(A, inv);
    var okI = S.esIdentidad(prod);
    pasos.push({
      descripcion: 'Comprobamos el resultado: A·A⁻¹ ' + (okI ? 'es' : 'no es') + ' la matriz identidad.',
      tex: 'A\\cdot A^{-1} = ' + S.matTex(prod)
    });
    return {
      existe: true, det: d, adj: adj, adjT: adjT, inv: inv, orden: n,
      pasos: pasos, motivo: null,
      comprobacion: { AI: prod, correcta: okI },
      matTex: S.matTex(A),
      tex: 'A^{-1} = \\frac{1}{' + fTex(d) + '}\\operatorname{Adj}(A)^{t} = ' + S.matTex(inv)
    };
  }

  /* ==================================================================
     9 · determinante y rango con un parámetro

     FORMA DE ENTRADA. Una «matriz con parámetro» es, dentro de esta
     capa, un objeto {A, f, c, letra} en el que cada A[i][j] es un
     polinomio del núcleo (array de Frac indexado por el grado). Se
     acepta también:
       · una cadena: 'k 1 0; 1 k 2'   -> se lee con DET.parseMatParam
       · un array de arrays de cadenas o números: [['k','1'],[1,'k-1']]
       · un Mat corriente (todas las entradas constantes).
     ================================================================== */
  function polDe(txt, letra, i, j) {
    if (txt && txt.length !== undefined && txt.length && txt[0] instanceof Frac) return S.pRecorta(txt);
    if (txt instanceof Frac) return [new Frac(txt.n, txt.d)];
    if (typeof txt === 'number') return [F(txt)];
    try {
      return S.pRecorta(S.parsePol(String(txt).replace(/^\+/, ''), letra));
    } catch (e) {
      throw Error('No entiendo el elemento «' + txt + '» (fila ' + (i + 1) + ', columna ' + (j + 1) +
        '). Puede ser un número (3, −2, 1/2) o una expresión en ' + letra + ' como ' + letra + ', ' +
        letra + '−1, 2' + letra + '+3 o ' + letra + '^2.');
    }
  }

  function matParam(P, letra) {
    letra = String(letra || (P && P.letra) || 'k').toLowerCase();
    if (typeof P === 'string') {
      var Q = S.parseMatParam(P, letra);
      return { A: Q.A, f: Q.f, c: Q.c, letra: letra };
    }
    if (P && P.A && P.f !== undefined) {
      return { A: P.A, f: P.f, c: P.c, letra: letra };
    }
    if (P && P.a && P.f !== undefined) {       /* Mat de constantes */
      return {
        A: P.a.map(function (fila) {
          return fila.map(function (x) { return [new Frac(x.n, x.d)]; });
        }),
        f: P.f, c: P.c, letra: letra
      };
    }
    if (P && P.length) {                       /* array de arrays */
      var a = [], i, j, c = null;
      for (i = 0; i < P.length; i++) {
        var fila = [];
        for (j = 0; j < P[i].length; j++) fila.push(polDe(P[i][j], letra, i, j));
        if (c === null) c = fila.length;
        else if (c !== fila.length) {
          throw Error('Todas las filas deben tener el mismo número de elementos: la fila 1 tiene ' +
            c + ' y la fila ' + (i + 1) + ' tiene ' + fila.length + '.');
        }
        a.push(fila);
      }
      return { A: a, f: a.length, c: c, letra: letra };
    }
    throw Error('Para trabajar con un parámetro pásame la matriz como cadena («1 ' + letra + '; ' +
      letra + ' 1»), como array de cadenas ([[\'1\',\'' + letra + '\']]) o leída con ' +
      'DET.parseMatParam.');
  }

  function detPolSub(P, filas, cols) {
    /* determinante (como polinomio) de la submatriz dada */
    var n = filas.length, i, j;
    if (n === 1) return S.pCopia(P[filas[0]][cols[0]]);
    if (n === 2) {
      return S.pResta(S.pMult(P[filas[0]][cols[0]], P[filas[1]][cols[1]]),
        S.pMult(P[filas[0]][cols[1]], P[filas[1]][cols[0]]));
    }
    var tot = [F0()];
    for (j = 0; j < n; j++) {
      if (S.pEsCero(P[filas[0]][cols[j]])) continue;
      var fr = filas.slice(1), cr = [];
      for (i = 0; i < n; i++) if (i !== j) cr.push(cols[i]);
      var t = S.pMult(P[filas[0]][cols[j]], detPolSub(P, fr, cr));
      tot = (j % 2 === 0) ? S.pSuma(tot, t) : S.pResta(tot, t);
    }
    return S.pRecorta(tot);
  }

  function polDeMatriz(A, letra) {
    var Q = matParam(A, letra);
    if (Q.f !== Q.c) {
      throw Error('Solo tienen determinante las matrices cuadradas: esta es de ' + Q.f + '×' + Q.c +
        '. Para estudiar una matriz rectangular con parámetro usa DET.rangoParamEstudio.');
    }
    var filas = [], cols = [], i;
    for (i = 0; i < Q.f; i++) { filas.push(i); cols.push(i); }
    var pol = S.pRecorta(detPolSub(Q.A, filas, cols));
    return {
      pol: pol, polinomio: pol, letra: Q.letra,
      grado: S.pEsCero(pol) ? -Infinity : S.pGrado(pol),
      tex: S.pTex(pol, Q.letra), polTex: S.pTex(pol, Q.letra),
      matriz: Q, matTex: S.matParamTex(Q), orden: Q.f,
      descripcion: 'Al desarrollar el determinante dejando ' + Q.letra + ' sin sustituir queda el ' +
        'polinomio de grado ' + (S.pEsCero(pol) ? '—' : S.pGrado(pol)) + ' que aparece a la derecha.'
    };
  }

  function evalParam(Q, v) {
    var a = Q.A.map(function (fila) {
      return fila.map(function (p) { return S.pEval(p, v).valor; });
    });
    return new S.Mat(a);
  }

  function detParam(A, letra) {
    var Q = matParam(A, letra);
    var R = polDeMatriz(Q, Q.letra);
    var pol = R.pol, L = Q.letra;
    var pasos = [];
    pasos.push({
      descripcion: 'Desarrollamos el determinante tratando ' + L + ' como un número cualquiera. ' +
        'Queda un polinomio en ' + L + '.',
      tex: '\\det(A) = ' + R.tex
    });
    if (S.pEsCero(pol)) {
      pasos.push({
        descripcion: 'El polinomio es idénticamente nulo: el determinante vale 0 para cualquier ' +
          'valor de ' + L + '.',
        tex: '\\det(A) = 0'
      });
      return {
        pol: pol, polTex: R.tex, tex: R.tex, grado: -Infinity, letra: L,
        raices: [], factorizacion: null, factorTex: '0', casos: [], tabla: [
          { caso: 'para cualquier valor de ' + L, condicion: L + ' \\in \\mathbb{R}',
            det: F0(), detTxt: '0', rango: null,
            explicacion: 'El determinante es 0 para todo valor de ' + L + ': la matriz es siempre ' +
              'singular y nunca tiene inversa.' }
        ],
        siempreNulo: true, constante: false, cuadratica: null,
        matTex: R.matTex, orden: R.orden, pasos: pasos
      };
    }
    var grado = S.pGrado(pol);
    var constante = grado === 0;
    var fact = S.factorizaPol(pol);
    var rr = S.raicesRacionales(pol);
    var raices = rr.raices.map(function (z) {
      var Av = evalParam(Q, z.raiz);
      return {
        valor: z.raiz, mult: z.mult, tex: L + ' = ' + fTex(z.raiz), txt: L + ' = ' + numTxt(z.raiz),
        matriz: Av, rango: S.rango(Av), det: S.det(Av)
      };
    });
    var cuad = null;
    if (grado === 2) {
      cuad = S.solCuadratica(pol[2], pol[1], pol[0]);
    }
    if (constante) {
      pasos.push({
        descripcion: 'El polinomio no depende de ' + L + ': el determinante vale siempre ' +
          numTxt(pol[0]) + '.',
        tex: '\\det(A) = ' + fTex(pol[0])
      });
    } else {
      pasos.push({
        descripcion: 'Resolvemos la ecuación det(A) = 0 para saber para qué valores de ' + L +
          ' se anula el determinante.',
        tex: R.tex + ' = 0'
      });
      pasos.push({
        descripcion: raices.length
          ? 'Las soluciones son ' + raices.map(function (z) { return numTxt(z.valor); }).join(' y ') +
            '. Para esos valores el determinante vale 0 y la matriz no tiene inversa; para ' +
            'cualquier otro valor de ' + L + ' el determinante es distinto de cero.'
          : 'La ecuación no tiene ninguna solución real racional, así que el determinante no se ' +
            'anula para ningún valor entero ni fraccionario de ' + L + '.',
        tex: raices.length
          ? raices.map(function (z) { return z.tex; }).join(', \\quad ')
          : '\\varnothing'
      });
    }
    var casos = raices.map(function (z) {
      return {
        valor: z.valor, tex: z.tex, condicion: z.tex, det: F0(), detTxt: '0',
        rango: z.rango, matriz: z.matriz,
        explicacion: 'Con ' + L + ' = ' + numTxt(z.valor) + ' el determinante se anula, el rango ' +
          'baja a ' + z.rango + ' y la matriz no tiene inversa.'
      };
    });
    var cond = raices.length
      ? raices.map(function (z) { return L + ' \\ne ' + fTex(z.valor); }).join(' \\text{ y } ')
      : L + ' \\in \\mathbb{R}';
    var tabla = casos.map(function (c) {
      return {
        caso: '$' + c.tex + '$', condicion: c.condicion, det: c.det, detTxt: '0',
        rango: c.rango, explicacion: c.explicacion
      };
    });
    tabla.push({
      caso: raices.length ? '$' + cond + '$' : 'para cualquier valor de $' + L + '$',
      condicion: cond, det: null, detTxt: 'distinto de 0', rango: R.orden,
      explicacion: 'En el caso general el determinante es distinto de cero, el rango es ' + R.orden +
        ' y la matriz tiene inversa.'
    });
    return {
      pol: pol, polTex: R.tex, tex: R.tex, grado: grado, letra: L,
      raices: raices, factorizacion: fact,
      factorTex: S.factorizaTexPol ? S.factorizaTexPol(fact, L) : S.pTex(pol, L),
      casos: casos, tabla: tabla, condicionGeneral: cond,
      siempreNulo: false, constante: constante, cuadratica: cuad,
      matTex: R.matTex, orden: R.orden, matriz: Q, pasos: pasos
    };
  }

  function rangoParamEstudio(A, letra) {
    var Q = matParam(A, letra);
    var L = Q.letra;
    var maxi = Math.min(Q.f, Q.c);
    var pasos = [];
    pasos.push({
      descripcion: 'La matriz es de ' + Q.f + '×' + Q.c + ', así que su rango es como mucho ' + maxi +
        ' para cualquier valor de ' + L + '.',
      tex: S.matParamTex(Q)
    });
    /* 1 · rango genérico con valores de prueba */
    var prueba = [0, 1, -1, 2, -2, 3, -3, 5, 7, 11, 13, 17, 23], generico = 0, i;
    for (i = 0; i < prueba.length; i++) {
      var rg = S.rango(evalParam(Q, new Frac(prueba[i])));
      if (rg > generico) generico = rg;
      if (generico === maxi) break;
    }
    /* 2 · candidatos: raíces de los menores de orden = rango genérico */
    var cands = [], vistos = {}, hayConstante = false;
    if (generico > 0) {
      var filas = combina(Q.f, generico), cols = combina(Q.c, generico), p, q;
      for (p = 0; p < filas.length && !hayConstante; p++) {
        for (q = 0; q < cols.length && !hayConstante; q++) {
          var dp = S.pRecorta(detPolSub(Q.A, filas[p], cols[q]));
          if (S.pEsCero(dp)) continue;
          if (S.pGrado(dp) === 0) { hayConstante = true; cands = []; vistos = {}; break; }
          S.raicesRacionales(dp).raices.forEach(function (z) {
            var kx = z.raiz.txt();
            if (!vistos[kx]) { vistos[kx] = 1; cands.push(z.raiz); }
          });
        }
      }
    }
    pasos.push({
      descripcion: hayConstante
        ? 'Hay un menor de orden ' + generico + ' que no depende de ' + L + ' y no es nulo, así que ' +
          'el rango es ' + generico + ' para cualquier valor de ' + L + '.'
        : 'Igualamos a cero los menores de orden ' + generico + ' y resolvemos: los valores de ' + L +
          ' que los anulan todos son los únicos que pueden bajar el rango.',
      tex: ''
    });
    /* 3 · los candidatos que de verdad bajan el rango */
    cands.sort(function (x, y) { return x.val() - y.val(); });
    var criticos = [];
    cands.forEach(function (v) {
      var Av = evalParam(Q, v);
      var RM = rangoMenores(Av);
      if (RM.rango < generico) {
        criticos.push({
          valor: v, tex: L + ' = ' + fTex(v), txt: L + ' = ' + numTxt(v),
          rango: RM.rango, matriz: Av, estudio: RM,
          descripcion: 'Con ' + L + ' = ' + numTxt(v) + ' todos los menores de orden ' + generico +
            ' se anulan y el rango baja a ' + RM.rango + '.'
        });
      }
    });
    criticos.forEach(function (cr) {
      pasos.push({ descripcion: cr.descripcion, tex: S.matTex(cr.matriz) + ',\\quad \\operatorname{rg} = ' + cr.rango });
    });
    var cond = criticos.length
      ? criticos.map(function (cr) { return L + ' \\ne ' + fTex(cr.valor); }).join(' \\text{ y } ')
      : L + ' \\in \\mathbb{R}';
    pasos.push({
      descripcion: criticos.length
        ? 'Para cualquier otro valor de ' + L + ' hay un menor de orden ' + generico +
          ' distinto de cero, así que el rango es ' + generico + '.'
        : 'El rango vale ' + generico + ' para cualquier valor de ' + L + '.',
      tex: '\\operatorname{rg}(A) = ' + generico
    });
    var tabla = criticos.map(function (cr) {
      return {
        caso: '$' + cr.tex + '$', condicion: cr.tex, rango: cr.rango,
        explicacion: 'Al sustituir ' + L + ' = ' + numTxt(cr.valor) + ' se anulan todos los menores ' +
          'de orden ' + generico + ', y queda rango ' + cr.rango + ': alguna fila pasa a ser ' +
          'combinación lineal de las otras.'
      };
    });
    tabla.push({
      caso: criticos.length ? '$' + cond + '$' : 'para cualquier valor de $' + L + '$',
      condicion: cond, rango: generico,
      explicacion: 'En el caso general hay un menor de orden ' + generico + ' distinto de cero, así ' +
        'que el rango es ' + generico + '.'
    });
    var tex = criticos.length
      ? '\\operatorname{rg}(A) = ' + generico + ' \\text{ si } ' + cond + '; \\quad ' +
        criticos.map(function (cr) {
          return '\\operatorname{rg}(A) = ' + cr.rango + ' \\text{ si } ' + cr.tex;
        }).join('; \\quad ')
      : '\\operatorname{rg}(A) = ' + generico + ' \\text{ para todo } ' + L;
    return {
      letra: L, generico: generico, criticos: criticos, tabla: tabla, pasos: pasos,
      tex: tex, condicionGeneral: cond, matTex: S.matParamTex(Q),
      f: Q.f, c: Q.c, maximo: maxi, matriz: Q
    };
  }

  /* ==================================================================
     10 · publicación en window.DET
     ================================================================== */
  /* Sarrus */
  S.sarrus = sarrus;

  /* menores complementarios y adjuntos */
  S.subMat = subMat;
  S.menorComp = menorComp;
  S.signoAdj = signoAdj;
  S.adjunto = adjunto;
  S.matAdjuntos = matAdjuntos;
  S.tableroSignos = tableroSignos;

  /* desarrollo por los adjuntos */
  S.desarrollo = desarrollo;
  S.mejorLinea = mejorLinea;

  /* hacer ceros */
  S.hacerCeros = hacerCeros;

  /* propiedades */
  S.detPropiedades = detPropiedades;

  /* menores y rango por menores */
  S.menoresDeOrden = menoresDeOrden;
  S.cuentaMenores = cuentaMenores;
  S.orlados = orlados;
  S.rangoMenores = rangoMenores;
  S.submatriz = subLista;
  S.combinaciones = combina;

  /* inversa por determinantes */
  S.inversaDet = inversaDet;

  /* parámetro */
  S.polDeMatriz = polDeMatriz;
  S.detParam = detParam;
  S.rangoParamEstudio = rangoParamEstudio;
  S.matParamDe = matParam;
  S.evalParam = evalParam;

  /* utilidades de texto de esta capa */
  S.detTex = detTex;
  S.numTxtDet = numTxt;
  S.parTxtDet = parTxt;

  window.DET.determinantes = true;
  if (S.monta) S.monta();
})();
