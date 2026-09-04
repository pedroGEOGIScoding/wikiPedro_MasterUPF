/* =====================================================================
   mtx-applets-alg.js · Tema 1 «Matrices»
   2.º de Bachillerato · Matemáticas Aplicadas a las Ciencias Sociales
   Ruta: 2-BatxMatesCCSS/matrices/assets/mtx-applets-alg.js

   CAPA DE ÁLGEBRA MATRICIAL del tema. Se carga DESPUÉS del núcleo
   mtx-applets.js y añade propiedades a window.MTX. No registra ningún
   applet: solo pone el motor exacto que usan los módulos A, B, C y D y
   el applet de diagnóstico del núcleo.

   Toda la aritmética es EXACTA con fracciones de BigInt (S.Frac): la
   lectura de matrices, el método de Gauss, los determinantes, la inversa
   por Gauss-Jordan y las ecuaciones matriciales se calculan sin un solo
   redondeo, así que 1/3, 7/12 o -5/2 aparecen tal cual en los resultados.
   La coma flotante aparece únicamente al pasar coordenadas a píxeles
   para dibujar.

   ---------------------------------------------------------------------
   ÍNDICE DE LA CAPA
   ---------------------------------------------------------------------
     1 · fracciones exactas: F, cero, absF, igualF, fTex, coefVarTex…
     2 · la clase Mat y la matriz ampliada
     3 · método de Gauss, rango y determinantes (Sarrus y Laplace)
     4 · geometría del plano que necesita el applet «transforma»:
         rectaDe, corte, cumple y la figura S.plano
     5 · rótulos de figura en texto llano (textoPlano)
     6 · lectura y construcción de matrices
     7 · clasificación de matrices
     8 · transposición y descomposición simétrica
     9 · operaciones: suma, resta, escalar, producto y potencias
    10 · combinaciones lineales de filas, rango y operaciones elementales
    11 · matrices con un parámetro
    12 · matriz inversa
    13 · ecuaciones matriciales

   ---------------------------------------------------------------------
   API que añade a window.MTX
   ---------------------------------------------------------------------

   LECTURA Y CONSTRUCCIÓN
     .parseMat(txt)              "1 2 3; 4 5 6" -> Mat 2x3. Separadores de
                                 columna: espacios, tabuladores o comas;
                                 separadores de fila: «;» o salto de línea.
                                 Admite enteros, negativos, decimales con
                                 coma o con punto y fracciones (3/4).
     .Mat(filas) .matDe(nums)    matriz desde arrays de Frac o de números.
                                 .f .c .a[i][j] .copia() .fila(i) .col(j)
                                 .get .set .esNula() .igual(N) .nums() .tex()
     .matPorFormula(f, c, expr)  expr en i, j (índices desde 1): "i+j",
                                 "i*j", "i-j", "2i-j", "(-1)^(i+j)", "i^2-j"
     .matAleatoria(f, c, opts)   opts {min, max, entera, tipo}, con tipo en
                                 cualquiera | simetrica | antisimetrica |
                                 triangular | diagonal | escalar |
                                 identidad | regular | singular
     .matNula(f, c) .matIdentidad(n) .matIdent(n)
     .matDiagonal([...]) .matEscalarMat(n, k)
     .matAmpliada(A, b) .matPegada(A, B)
     .dimTex(A) -> "2 \times 3"      .dimTxt(A) -> "2×3"
     .matTxt(A) -> "1 2; 3 4"        (para rellenar controles de texto)
     .matTex(A, opts)            opts {aug:k} línea vertical antes de las k
                                 últimas columnas; {marca:[[i,j],…]} \boxed
     .matIgual(A, B)             booleano exacto (dimensiones + elementos)
     .difIguales(A, B)           [[i,j],…] posiciones en las que difieren

   CLASIFICACIÓN
     .clasifica(A)               ficha completa: f, c, cuadrada, orden, fila,
                                 columna, rectangular, nula, diagonal,
                                 escalar, identidad, triangularSup,
                                 triangularInf, simetrica, antisimetrica,
                                 traspuestaIgual, regular, singular, rango,
                                 det, traza, nombres:[…] y
                                 razones:{clave: explicación en HTML}
     .esSimetrica .esAntisimetrica .esTriangularSup .esTriangularInf
     .esDiagonal .esEscalar .esIdentidad .esNula .esCuadrada .esRegular
     .traza(A) -> Frac           .diagPrincipal(A) .diagSecundaria(A)

   TRANSPOSICIÓN Y SIMETRÍA
     .matTrans(A) .matTraspuesta(A)      A^t
     .descomponSim(A)            {S, H, pasos, transpuesta, sumaOk}
                                 con A = S + H, S simétrica y H antisimétrica

   OPERACIONES
     .matSuma(A, B) .matResta(A, B)      error didáctico si las dimensiones
                                         no coinciden
     .matEscalar(A, k) .opuesta(A) .matCombina(a, A, b, B)
     .filaPorColumna(fila, col)  {valor, pasos:[{a,b,prod}], tex, texCorto}
     .matProd(A, B)              error didáctico si columnas(A) ≠ filas(B)
     .matProdPasos(A, B)         {P, celdas:[[{valor, tex, sumandos}]],
                                  compatible, dimTex, motivo}
     .matPot(A, n)               n natural; A^0 = I
     .matPotPasos(A, n)          {pot:[{k,M}], patron, periodo, desde,
                                  nilpotente, indice, idempotente}

   COMBINACIONES LINEALES DE FILAS, RANGO Y OPERACIONES ELEMENTALES
     .combFilas(A, i)            ¿es la fila i (desde 0) combinación lineal
                                 de las demás? -> {dependiente, coef, tex,
                                 explicacion}
     .filasIndependientes(A)     {indices, rango, dependencias:[{fila, coef, tex}]}
     .rango(A)                   entero, por Gauss, exacto
     .rangoPasos(A)              {pasos, fin, pivotes, rango, filasNulas, cota}
     .gauss(A, opts)             opts {aug:k, jordan:false}
                                 -> {pasos:[{M, op, desc}], fin, pivotes,
                                     rango, filaIncompatible}
                                 op en notación TeX  F_i \to F_i - kF_j
     .opElemental(A, op)         op {tipo:'cambiar'|'multiplicar'|'sumar',
                                 i, j, k} -> {M, tex, valida, error, desc}
     .det(A) .detPasos(A)        determinante exacto; Sarrus en orden 3 y
                                 desarrollo por la primera fila en orden > 3
     .menorMat(A, i, j)          menor complementario

   MATRICES CON UN PARÁMETRO
     .parseMatParam(txt, letra)  -> {A: matriz de polinomios, f, c, letra}
     .evalMatParam(P, valor)     sustituye el parámetro por un Frac -> Mat
     .rangoParam(A, letra)       -> {criticos:[{valor, tex, rango, matriz}],
                                     generico, tabla:[{caso, condicion,
                                     rango, explicacion}], tex, matTex}
     .matParamTex(P)             la matriz con parámetro en LaTeX

   INVERSA
     .inversa(A)                 {existe, inv, motivo, rango, orden, det}
     .inversaPasos(A)            Gauss-Jordan sobre (A|I) -> {existe, inv,
                                 pasos:[{M, op, desc}],
                                 comprobacion:{AI, IA, correcta}}
     .inversa2x2(A)              {existe, det, inv, adjunta, tex} con la
                                 fórmula de la adjunta

   ECUACIONES MATRICIALES
     .ecuMatricial(tipo, A, B, C)
                                 tipo en 'AX=B', 'XA=B', 'AX+B=C',
                                 'XA+B=C', 'AXB=C', 'AX=B+X'
                                 -> {ok, X, tipo, pasos:[{desc, tex}],
                                     lado:'izquierda'|'derecha'|'ambos',
                                     motivo, comprobacion:{tex, correcta}}
                                 Los pasos razonan explícitamente por qué se
                                 multiplica por A^{-1} por la izquierda o por
                                 la derecha y avisan de que la división de
                                 matrices no existe.
     .pasoDespeje(tipo)          [{enunciado, opciones, correcta, porque}]
                                 para el applet-entrenador «despeja»

   GEOMETRÍA DEL PLANO (para el applet «transforma»)
     .plano(opts)                figura SVG completa con ejes, rejilla,
                                 rectas, regiones, puntos y segmentos
     .corte(r1, r2)              {tipo:'punto'|'paralelas'|'coincidentes',
                                 x, y, det, tex}
     .rectaDe(a, b, c) .puntoTex(x, y) .cumple(inec, x, y)
     .textoPlano(s)              rótulos de SVG en texto llano (nunca LaTeX
                                 crudo dentro de un <text>)
     .fracDe(v) .fracTex(f)      utilidades de fracciones

   ---------------------------------------------------------------------
   Mensajes de error
   ---------------------------------------------------------------------
   Todos los Error que lanza esta capa están escritos en español y
   dirigidos al alumno: dicen qué se ha entendido mal y cómo se escribe
   bien la entrada, con un ejemplo copiable («Escribe cada fila en una
   línea o separada por ";", y los elementos con espacios: 1 2 3; 4 5 6»).
   Ninguna entrada mala debe romper un applet: los módulos capturan el
   Error y muestran el mensaje.

   Sin OJS, sin CDN, sin dependencias externas. ES5 (var/function) salvo
   el uso de BigInt, que ya usa el núcleo.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.MTX;
  if (!S) {
    if (window.console && console.warn) {
      console.warn('mtx-applets-lin.js necesita mtx-applets.js cargado antes.');
    }
    return;
  }

  var Frac = S.Frac;
  var COL = S.COL;

  /* ==================================================================
     1 · utilidades de fracciones exactas
     ================================================================== */
  function babs(b) { return b < 0n ? -b : b; }
  function bmcd(a, b) { a = babs(a); b = babs(b); while (b) { var t = a % b; a = b; b = t; } return a; }

  var F0 = function () { return new Frac(0); };
  var F1 = function () { return new Frac(1); };

  function esFrac(v) { return v instanceof Frac || (v && typeof v === 'object' && typeof v.n === 'bigint'); }

  /* Convierte números, cadenas («3/4», «0,5», «-2») y Frac en Frac. */
  function F(v) {
    if (v instanceof Frac) return v;
    if (esFrac(v)) return new Frac(v.n, v.d);
    if (typeof v === 'number') {
      if (!isFinite(v)) throw Error('Se ha intentado usar un número no válido (' + v + '). Escribe números como 3, -2, 0,5 o 3/4.');
      if (v === Math.round(v)) return new Frac(Math.round(v));
      return decimalAFrac(String(v));
    }
    if (typeof v === 'string') return numTxtAFrac(v);
    throw Error('No entiendo el número «' + v + '». Escribe un entero (3), un decimal con coma (0,5) o una fracción (3/4).');
  }
  function decimalAFrac(s) {
    var neg = s.charAt(0) === '-';
    if (neg) s = s.slice(1);
    var p = s.split('.');
    var dec = p[1] || '';
    var den = 1n, i;
    for (i = 0; i < dec.length; i++) den = den * 10n;
    var num = BigInt(p[0] || '0') * den + BigInt(dec === '' ? '0' : dec);
    return new Frac(neg ? -num : num, den);
  }
  function numTxtAFrac(t) {
    var s = String(t).trim().replace(/\s+/g, '').replace(/[−–—]/g, '-').replace(',', '.');
    if (s === '') throw Error('Falta un número. Escribe por ejemplo 3, -2, 0,5 o 3/4.');
    var m = s.split('/');
    if (m.length > 2) throw Error('«' + t + '» tiene demasiadas barras. Una fracción se escribe con una sola barra, por ejemplo 3/4.');
    if (!/^-?\d+(\.\d+)?$/.test(m[0]) || (m[1] !== undefined && !/^-?\d+(\.\d+)?$/.test(m[1]))) {
      throw Error('No entiendo el número «' + t + '». Escribe un entero (3), un decimal con coma (0,5) o una fracción (3/4).');
    }
    var a = decimalAFrac(m[0]);
    if (m[1] === undefined) return a;
    var b = decimalAFrac(m[1]);
    if (b.n === 0n) throw Error('El denominador de una fracción no puede ser 0. Revisa «' + t + '».');
    return a.entre(b);
  }

  function cero(f) { return f.n === 0n; }
  function negat(f) { return f.n < 0n; }
  function pos(f) { return f.n > 0n; }
  function absF(f) { return negat(f) ? f.opuesto() : new Frac(f.n, f.d); }
  function igualF(a, b) { return a.cmp(b) === 0; }
  function numF(f) { return Number(f.n) / Number(f.d); }
  function fTex(f, inline) { return f.tex(inline === undefined ? true : inline); }

  /* Signo + cuerpo de un término, para escribir sumas bonitas en TeX. */
  function conSigno(f, primero) {
    if (primero) return fTex(f);
    return (negat(f) ? ' - ' : ' + ') + fTex(absF(f));
  }
  /* Coeficiente delante de una incógnita: 1x -> x, -1x -> -x */
  function coefVarTex(f, v, primero) {
    if (cero(f)) return '';
    var a = absF(f);
    var cuerpo = (a.n === 1n && a.d === 1n) ? v : fTex(a) + v;
    if (primero) return (negat(f) ? '-' : '') + cuerpo;
    return (negat(f) ? ' - ' : ' + ') + cuerpo;
  }
  /* ==================================================================
     2 · la clase Mat: matrices con entradas exactas
     ================================================================== */
  function Mat(filas) {
    if (!(this instanceof Mat)) return new Mat(filas);
    if (filas && filas.a && filas.f !== undefined) filas = filas.a;
    if (!filas || !filas.length) {
      throw Error('Una matriz necesita al menos una fila. Pásale un array de arrays, por ejemplo S.matDe([[1,2],[3,4]]).');
    }
    var c = filas[0].length, i, j;
    var a = [];
    for (i = 0; i < filas.length; i++) {
      if (filas[i].length !== c) {
        throw Error('Todas las filas de la matriz deben tener el mismo número de elementos: la fila 1 tiene ' +
          c + ' y la fila ' + (i + 1) + ' tiene ' + filas[i].length + '. ' +
          'Si una ecuación no lleva una incógnita, escribe un 0 en su lugar.');
      }
      var fila = [];
      for (j = 0; j < c; j++) fila.push(F(filas[i][j]));
      a.push(fila);
    }
    this.a = a; this.f = a.length; this.c = c;
  }
  Mat.prototype.get = function (i, j) { return this.a[i][j]; };
  Mat.prototype.set = function (i, j, v) { this.a[i][j] = F(v); return this; };
  Mat.prototype.copia = function () {
    return new Mat(this.a.map(function (fila) {
      return fila.map(function (x) { return new Frac(x.n, x.d); });
    }));
  };
  Mat.prototype.fila = function (i) { return this.a[i].slice(); };
  Mat.prototype.col = function (j) {
    return this.a.map(function (fila) { return fila[j]; });
  };
  Mat.prototype.esNula = function () {
    var i, j;
    for (i = 0; i < this.f; i++) for (j = 0; j < this.c; j++) if (!cero(this.a[i][j])) return false;
    return true;
  };
  Mat.prototype.igual = function (N) {
    if (this.f !== N.f || this.c !== N.c) return false;
    var i, j;
    for (i = 0; i < this.f; i++) for (j = 0; j < this.c; j++) if (!igualF(this.a[i][j], N.a[i][j])) return false;
    return true;
  };
  Mat.prototype.nums = function () {
    return this.a.map(function (fila) { return fila.map(numF); });
  };
  Mat.prototype.tex = function (opts) { return matTex(this, opts); };

  function matDe(nums) { return new Mat(nums); }
  function matIdent(n) {
    var a = [], i, j;
    for (i = 0; i < n; i++) { a.push([]); for (j = 0; j < n; j++) a[i].push(new Frac(i === j ? 1 : 0)); }
    return new Mat(a);
  }
  function matAmpliada(A, b) {
    var M = (A && A.a) ? A : Mat(A);
    if (!b || b.length !== M.f) {
      throw Error('La columna de términos independientes debe tener tantos números como ecuaciones (' +
        M.f + '). Revisa los datos del sistema.');
    }
    var a = [], i, j;
    for (i = 0; i < M.f; i++) {
      var fila = [];
      for (j = 0; j < M.c; j++) fila.push(M.a[i][j]);
      fila.push(F(b[i]));
      a.push(fila);
    }
    return new Mat(a);
  }
  function matTraspuesta(M) {
    M = (M && M.a) ? M : Mat(M);
    var a = [], i, j;
    for (j = 0; j < M.c; j++) { a.push([]); for (i = 0; i < M.f; i++) a[j].push(M.a[i][j]); }
    return new Mat(a);
  }
  function matPor(M, N) {
    M = (M && M.a) ? M : Mat(M); N = (N && N.a) ? N : Mat(N);
    if (M.c !== N.f) {
      throw Error('Para multiplicar dos matrices, el número de columnas de la primera (' + M.c +
        ') debe coincidir con el número de filas de la segunda (' + N.f + ').');
    }
    var a = [], i, j, k;
    for (i = 0; i < M.f; i++) {
      a.push([]);
      for (j = 0; j < N.c; j++) {
        var s = F0();
        for (k = 0; k < M.c; k++) s = s.mas(M.a[i][k].por(N.a[k][j]));
        a[i].push(s);
      }
    }
    return new Mat(a);
  }
  function matPorVector(M, v) {
    M = (M && M.a) ? M : Mat(M);
    if (v.length !== M.c) {
      throw Error('El vector debe tener tantas componentes (' + v.length + ') como columnas la matriz (' + M.c + ').');
    }
    var r = [], i, k;
    for (i = 0; i < M.f; i++) {
      var s = F0();
      for (k = 0; k < M.c; k++) s = s.mas(M.a[i][k].por(F(v[k])));
      r.push(s);
    }
    return r;
  }

  function matTex(M, opts) {
    M = (M && M.a) ? M : Mat(M);
    opts = opts || {};
    var aug = opts.aug || 0;
    var colspec = '', j, i;
    for (j = 0; j < M.c; j++) {
      if (aug > 0 && j === M.c - aug) colspec += '|';
      colspec += (opts.alin || 'c');
    }
    var marca = {};
    (opts.marca || []).forEach(function (p) { marca[p[0] + '-' + p[1]] = true; });
    var filas = [];
    for (i = 0; i < M.f; i++) {
      var cel = [];
      for (j = 0; j < M.c; j++) {
        var t = fTex(M.a[i][j]);
        if (marca[i + '-' + j]) t = '\\boxed{' + t + '}';
        cel.push(t);
      }
      filas.push(cel.join(' & '));
    }
    var abre = opts.corchete ? '\\left[' : '\\left(';
    var cierra = opts.corchete ? '\\right]' : '\\right)';
    return abre + '\\begin{array}{' + colspec + '}' + filas.join(' \\\\ ') + '\\end{array}' + cierra;
  }

  /* ==================================================================
     3 · método de Gauss, rango y determinantes
     ================================================================== */
  function opTex(i, j, k) {                    /* F_i -> F_i - k F_j  */
    var sgn = negat(k) ? ' + ' : ' - ';
    var a = absF(k);
    var cuerpo = (a.n === 1n && a.d === 1n) ? '' : fTex(a);
    return 'F_{' + (i + 1) + '} \\to F_{' + (i + 1) + '}' + sgn + cuerpo + 'F_{' + (j + 1) + '}';
  }

  function gauss(M, opts) {
    M = (M && M.a) ? M : Mat(M);
    opts = opts || {};
    var aug = opts.aug || 0;
    var jordan = !!opts.jordan;
    var A = M.copia();
    var ncols = A.c - aug;
    var pasos = [{ M: A.copia(), op: '', desc: 'Matriz de partida.' }];
    var piv = [], r = 0, j, i, k;
    for (j = 0; j < ncols && r < A.f; j++) {
      k = -1;
      for (i = r; i < A.f; i++) if (!cero(A.a[i][j])) { k = i; break; }
      /* preferimos un pivote entero para que las cuentas salgan limpias */
      for (i = r; i < A.f; i++) {
        if (!cero(A.a[i][j]) && A.a[i][j].d === 1n) { k = i; break; }
      }
      if (k < 0) continue;
      if (k !== r) {
        var tmp = A.a[r]; A.a[r] = A.a[k]; A.a[k] = tmp;
        pasos.push({
          M: A.copia(),
          op: 'F_{' + (r + 1) + '} \\leftrightarrow F_{' + (k + 1) + '}',
          desc: 'Intercambiamos las filas ' + (r + 1) + ' y ' + (k + 1) + ' para tener un pivote no nulo.'
        });
      }
      for (i = r + 1; i < A.f; i++) {
        if (cero(A.a[i][j])) continue;
        var f = A.a[i][j].entre(A.a[r][j]);
        for (var c2 = 0; c2 < A.c; c2++) A.a[i][c2] = A.a[i][c2].menos(f.por(A.a[r][c2]));
        pasos.push({
          M: A.copia(), op: opTex(i, r, f),
          desc: 'Hacemos cero el elemento de la fila ' + (i + 1) + ', columna ' + (j + 1) + '.'
        });
      }
      piv.push([r, j]);
      r++;
    }
    if (jordan) {
      for (k = piv.length - 1; k >= 0; k--) {
        var pr = piv[k][0], pc = piv[k][1];
        var p = A.a[pr][pc];
        if (!igualF(p, F1())) {
          var inv = F1().entre(p);
          for (i = 0; i < A.c; i++) A.a[pr][i] = A.a[pr][i].por(inv);
          pasos.push({
            M: A.copia(),
            op: 'F_{' + (pr + 1) + '} \\to ' + fTex(inv) + 'F_{' + (pr + 1) + '}',
            desc: 'Dividimos la fila ' + (pr + 1) + ' entre su pivote para que valga 1.'
          });
        }
        for (i = pr - 1; i >= 0; i--) {
          if (cero(A.a[i][pc])) continue;
          var f2 = A.a[i][pc].entre(A.a[pr][pc]);
          for (var c3 = 0; c3 < A.c; c3++) A.a[i][c3] = A.a[i][c3].menos(f2.por(A.a[pr][c3]));
          pasos.push({
            M: A.copia(), op: opTex(i, pr, f2),
            desc: 'Hacemos cero el elemento de la fila ' + (i + 1) + ' por encima del pivote.'
          });
        }
      }
    }
    /* ¿alguna fila del tipo 0 0 0 | k con k distinto de 0? */
    var incompat = -1;
    if (aug > 0) {
      for (i = 0; i < A.f; i++) {
        var nulos = true, resto = false;
        for (j = 0; j < ncols; j++) if (!cero(A.a[i][j])) nulos = false;
        for (j = ncols; j < A.c; j++) if (!cero(A.a[i][j])) resto = true;
        if (nulos && resto) { incompat = i; break; }
      }
    }
    return {
      pasos: pasos, fin: A, escalonada: A, pivotes: piv, rango: piv.length,
      filaIncompatible: incompat, aug: aug, jordan: jordan
    };
  }

  function rango(M) {
    M = (M && M.a) ? M : Mat(M);
    return gauss(M, { aug: 0 }).rango;
  }

  function det(M) {
    M = (M && M.a) ? M : Mat(M);
    if (M.f !== M.c) {
      throw Error('Solo tienen determinante las matrices cuadradas: esta es de ' + M.f + '×' + M.c +
        '. Para discutir un sistema con distinto número de ecuaciones e incógnitas usa el rango (S.rango).');
    }
    var n = M.f, a = M.a;
    if (n === 1) return a[0][0];
    if (n === 2) return a[0][0].por(a[1][1]).menos(a[0][1].por(a[1][0]));
    if (n === 3) {
      return a[0][0].por(a[1][1]).por(a[2][2])
        .mas(a[0][1].por(a[1][2]).por(a[2][0]))
        .mas(a[0][2].por(a[1][0]).por(a[2][1]))
        .menos(a[0][2].por(a[1][1]).por(a[2][0]))
        .menos(a[0][0].por(a[1][2]).por(a[2][1]))
        .menos(a[0][1].por(a[1][0]).por(a[2][2]));
    }
    /* orden mayor: desarrollo por la primera fila */
    var tot = F0(), j;
    for (j = 0; j < n; j++) {
      if (cero(a[0][j])) continue;
      var men = det(menor(M, 0, j));
      var t = a[0][j].por(men);
      tot = (j % 2 === 0) ? tot.mas(t) : tot.menos(t);
    }
    return tot;
  }
  function menor(M, fi, cj) {
    var a = [], i, j;
    for (i = 0; i < M.f; i++) {
      if (i === fi) continue;
      var fila = [];
      for (j = 0; j < M.c; j++) { if (j === cj) continue; fila.push(M.a[i][j]); }
      a.push(fila);
    }
    return new Mat(a);
  }

  function detPasos(M) {
    M = (M && M.a) ? M : Mat(M);
    if (M.f !== M.c) {
      throw Error('Solo se calcula el determinante de matrices cuadradas. Esta es de ' + M.f + '×' + M.c + '.');
    }
    var a = M.a, v = det(M), tex;
    if (M.f === 1) {
      tex = fTex(a[0][0]);
      return { tex: tex, valor: v, tipo: 'orden1' };
    }
    if (M.f === 2) {
      tex = matTex(M) + ' = ' + prodTex([a[0][0], a[1][1]]) + ' - ' + prodTex([a[0][1], a[1][0]]) +
        ' = ' + fTex(a[0][0].por(a[1][1])) + ' - ' + fTex(a[0][1].por(a[1][0])) + ' = ' + fTex(v);
      return { tex: tex, valor: v, tipo: 'orden2' };
    }
    if (M.f === 3) {
      var pos3 = [[a[0][0], a[1][1], a[2][2]], [a[0][1], a[1][2], a[2][0]], [a[0][2], a[1][0], a[2][1]]];
      var neg3 = [[a[0][2], a[1][1], a[2][0]], [a[0][0], a[1][2], a[2][1]], [a[0][1], a[1][0], a[2][2]]];
      var sp = pos3.map(prodTex).join(' + ');
      var sn = neg3.map(prodTex).join(' + ');
      var vp = pos3.map(function (t) { return t[0].por(t[1]).por(t[2]); });
      var vn = neg3.map(function (t) { return t[0].por(t[1]).por(t[2]); });
      var sumaP = vp[0].mas(vp[1]).mas(vp[2]);
      var sumaN = vn[0].mas(vn[1]).mas(vn[2]);
      tex = '\\begin{aligned}' +
        '\\det(A) &= ' + sp + ' - \\left(' + sn + '\\right) \\\\' +
        '&= \\left(' + vp.map(fTex).join(' + ') + '\\right) - \\left(' + vn.map(fTex).join(' + ') + '\\right) \\\\' +
        '&= ' + fTex(sumaP) + ' - \\left(' + fTex(sumaN) + '\\right) = ' + fTex(v) +
        '\\end{aligned}';
      return {
        tex: tex, valor: v, tipo: 'sarrus',
        positivos: vp, negativos: vn, sumaPositivos: sumaP, sumaNegativos: sumaN
      };
    }
    /* orden > 3: desarrollo por la primera fila */
    var trozos = [], j;
    for (j = 0; j < M.c; j++) {
      var s = (j % 2 === 0 ? '+' : '-');
      trozos.push((j === 0 ? '' : ' ' + s + ' ') + (j === 0 ? '' : '') + fTex(absF(a[0][j])) + '\\cdot' + matTex(menor(M, 0, j)));
    }
    return { tex: trozos.join('') + ' = ' + fTex(v), valor: v, tipo: 'laplace' };
  }
  function prodTex(l) {
    return l.map(function (f) {
      return (f.d === 1n && f.n >= 0n) ? fTex(f) : '\\left(' + fTex(f) + '\\right)';
    }).join(' \\cdot ');
  }
  /* ==================================================================
     4 · geometría del plano: rectas y cortes (applet «transforma»)
     ================================================================== */
  function rectaDe(a, b, c) {
    if (a && typeof a === 'object' && a.a !== undefined) { c = a.c; b = a.b; a = a.a; }
    var A = F(a), B = F(b), C = F(c === undefined ? 0 : c);
    if (cero(A) && cero(B)) {
      throw Error('Una recta a·x + b·y = c necesita que a o b no sea 0. ' +
        'Si escribes 0x+0y=c no estás describiendo una recta: revisa los coeficientes.');
    }
    return { a: A, b: B, c: C };
  }

  function puntoTex(x, y) {
    return '\\left(' + fTex(F(x)) + ',\\ ' + fTex(F(y)) + '\\right)';
  }

  function corte(r1, r2) {
    var A = rectaDe(r1), B = rectaDe(r2);
    var d = A.a.por(B.b).menos(B.a.por(A.b));
    if (!cero(d)) {
      var x = A.c.por(B.b).menos(B.c.por(A.b)).entre(d);
      var y = A.a.por(B.c).menos(B.a.por(A.c)).entre(d);
      return {
        tipo: 'punto', x: x, y: y, det: d,
        tex: puntoTex(x, y),
        texto: 'Las rectas son secantes: se cortan en un único punto.'
      };
    }
    var e1 = A.a.por(B.c).menos(B.a.por(A.c));
    var e2 = A.b.por(B.c).menos(B.b.por(A.c));
    if (cero(e1) && cero(e2)) {
      return {
        tipo: 'coincidentes', x: null, y: null, det: d,
        texto: 'Las dos ecuaciones representan la misma recta: hay infinitos puntos comunes.'
      };
    }
    return {
      tipo: 'paralelas', x: null, y: null, det: d,
      texto: 'Las rectas son paralelas y distintas: no tienen ningún punto común.'
    };
  }

  function normInec(q) {
    if (typeof q === 'string') {
      throw Error('En este tema las inecuaciones se describen con objetos {a, b, c, rel}, ' +
        'por ejemplo {a:2, b:1, c:8, rel:"<="} para 2x + y <= 8. No se leen escritas en texto.');
    }
    if (!q || q.a === undefined || q.b === undefined) {
      throw Error('Una inecuación se describe como {a, b, c, rel}, por ejemplo {a:2, b:1, c:8, rel:"<="} ' +
        'para 2x + y <= 8 (la relación puede ser "<=", "<", ">=", ">" o "=").');
    }
    var rel = q.rel || '<=';
    rel = String(rel).replace('≤', '<=').replace('≥', '>=').replace('=<', '<=').replace('=>', '>=');
    if (['<=', '<', '>=', '>', '='].indexOf(rel) < 0) {
      throw Error('La relación «' + q.rel + '» no vale. Usa "<=", "<", ">=", ">" o "=".');
    }
    var a = F(q.a), b = F(q.b), c = F(q.c === undefined ? 0 : q.c);
    if (cero(a) && cero(b)) {
      throw Error('En la inecuación han desaparecido las dos incógnitas (a = b = 0). ' +
        'Escribe algo como x>=0, y>=0 o 2x+3y<=12.');
    }
    return { a: a, b: b, c: c, rel: rel, txt: q.txt };
  }
  /* Forma canónica  a x + b y <= c  (o < c) para clipping y test */
  function canon(q) {
    var I = normInec(q);
    if (I.rel === '>=' || I.rel === '>') {
      return { a: I.a.opuesto(), b: I.b.opuesto(), c: I.c.opuesto(), estricta: I.rel === '>', igualdad: false, orig: I };
    }
    if (I.rel === '=') return { a: I.a, b: I.b, c: I.c, estricta: false, igualdad: true, orig: I };
    return { a: I.a, b: I.b, c: I.c, estricta: I.rel === '<', igualdad: false, orig: I };
  }

  function cumple(inec, x, y) {
    var I = normInec(inec);
    var v = I.a.por(F(x)).mas(I.b.por(F(y)));
    var s = v.cmp(I.c);
    switch (I.rel) {
      case '<=': return s <= 0;
      case '<': return s < 0;
      case '>=': return s >= 0;
      case '>': return s > 0;
      default: return s === 0;
    }
  }
  /* Igual que cumple, pero la frontera siempre cuenta (para los vértices) */
  function cumpleCerrada(inec, x, y) {
    var I = normInec(inec);
    var v = I.a.por(F(x)).mas(I.b.por(F(y)));
    var s = v.cmp(I.c);
    if (I.rel === '<=' || I.rel === '<') return s <= 0;
    if (I.rel === '>=' || I.rel === '>') return s >= 0;
    return s === 0;
  }

  /* ==================================================================
     5 · S.plano(opts): la figura del plano
     ================================================================== */
  function numV(v) {
    if (v === undefined || v === null) return NaN;
    if (esFrac(v)) return Number(v.n) / Number(v.d);
    if (v && typeof v.val === 'function') return v.val();
    return Number(v);
  }
  function pasoBonito(span) {
    if (!(span > 0)) return 1;
    var raw = span / 10;
    var e = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var f = raw / e;
    var m = f < 1.5 ? 1 : (f < 3 ? 2 : (f < 7 ? 5 : 10));
    return m * e;
  }
  /* Recorte de un segmento al rectángulo de la ventana (Liang–Barsky) */
  function clipSeg(x1, y1, x2, y2, w) {
    var t0 = 0, t1 = 1, dx = x2 - x1, dy = y2 - y1;
    var pr = [-dx, dx, -dy, dy];
    var qr = [x1 - w.xmin, w.xmax - x1, y1 - w.ymin, w.ymax - y1];
    for (var i = 0; i < 4; i++) {
      if (pr[i] === 0) { if (qr[i] < 0) return null; continue; }
      var r = qr[i] / pr[i];
      if (pr[i] < 0) { if (r > t1) return null; if (r > t0) t0 = r; }
      else { if (r < t0) return null; if (r < t1) t1 = r; }
    }
    return [[x1 + t0 * dx, y1 + t0 * dy], [x1 + t1 * dx, y1 + t1 * dy]];
  }
  function clipRecta(r, w) {
    var a = numV(r.a), b = numV(r.b), c = numV(r.c);
    if (b === 0) {
      var xv = c / a;
      if (xv < w.xmin || xv > w.xmax) return null;
      return [[xv, w.ymin], [xv, w.ymax]];
    }
    var y1 = (c - a * w.xmin) / b, y2 = (c - a * w.xmax) / b;
    return clipSeg(w.xmin, y1, w.xmax, y2, w);
  }
  /* Sutherland–Hodgman: recorta un polígono con el semiplano a x + b y <= c */
  function clipPoly(poli, a, b, c) {
    if (!poli.length) return poli;
    var out = [], i;
    function dentro(p) { return a * p[0] + b * p[1] <= c + 1e-9; }
    for (i = 0; i < poli.length; i++) {
      var P = poli[i], Q = poli[(i + 1) % poli.length];
      var dP = dentro(P), dQ = dentro(Q);
      if (dP) out.push(P);
      if (dP !== dQ) {
        var vp = a * P[0] + b * P[1], vq = a * Q[0] + b * Q[1];
        var t = (c - vp) / (vq - vp);
        out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]);
      }
    }
    return out;
  }
  /* ------------------------------------------------------------------
     Rótulos de figura: dentro de un <svg> NO existe KaTeX, así que todo
     lo que se escriba en un <text> tiene que ser texto llano legible.
     `textoPlano` convierte cualquier resto de TeX que llegue por error
     (\frac, \left(, r_{1}, \operatorname{...}, $...$) en texto normal,
     con el signo menos tipográfico U+2212 y coma decimal española.
     La fórmula bonita, si hace falta, se pone FUERA del SVG con S.K.
     ------------------------------------------------------------------ */
  var SUPER = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻' };
  function aSuper(s) {
    var out = '', k;
    for (k = 0; k < s.length; k++) out += (SUPER[s.charAt(k)] || s.charAt(k));
    return out;
  }
  function textoPlano(s) {
    if (s === undefined || s === null) return '';
    var t = String(s);
    if (/[\\${}_^]/.test(t)) t = quitaTex(t);
    /* convenio español y signo menos tipográfico, también en los
       rótulos que ya venían en texto llano */
    t = t.replace(/(\d)\.(\d)/g, '$1,$2');
    t = t.replace(/-(?=\s*[\d(a-zA-Z])/g, '−');
    t = t.replace(/\s{2,}/g, ' ').trim();
    return S.esc(t);
  }
  function quitaTex(t) {
    t = t.replace(/\$\$?/g, '');
    t = t.replace(/\{,\}/g, ',');
    t = t.replace(/\\left\s*\\?([([|{])/g, '$1').replace(/\\right\s*\\?([)\]|}])/g, '$1');
    t = t.replace(/\\left\.?|\\right\.?/g, '');
    /* la fracción se escribe a/b, y solo lleva paréntesis si hace falta
       para que no se lea mal (junto a otra letra o con operaciones) */
    function frac(m, a, c, off, str) {
      var antes = str.charAt(off - 1), despues = str.charAt(off + m.length);
      var duda = /[0-9a-zA-Z)]/.test(antes) || /[0-9a-zA-Z(]/.test(despues) ||
        /[+\-\/ ]/.test(a) || /[+\-\/ ]/.test(c);
      return duda ? '(' + a + '/' + c + ')' : a + '/' + c;
    }
    t = t.replace(/\\(?:d|t)?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, frac);
    t = t.replace(/\\(?:d|t)?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, frac);
    t = t.replace(/\\operatorname\s*\{([^{}]*)\}/g, '$1');
    t = t.replace(/\\(?:text|mathrm|mathbf|boxed)\s*\{([^{}]*)\}/g, '$1');
    t = t.replace(/\\sqrt\s*\{([^{}]*)\}/g, '√($1)');
    t = t.replace(/\\cdot|\\times/g, '·');
    t = t.replace(/\\le(?![a-zA-Z])/g, '≤').replace(/\\ge(?![a-zA-Z])/g, '≥');
    t = t.replace(/\\neq?(?![a-zA-Z])/g, '≠');
    t = t.replace(/\\Rightarrow|\\rightarrow|\\to(?![a-zA-Z])/g, '⇒');
    t = t.replace(/\\pm(?![a-zA-Z])/g, '±').replace(/\\infty(?![a-zA-Z])/g, '∞');
    t = t.replace(/\\lambda(?![a-zA-Z])/g, 'λ').replace(/\\alpha(?![a-zA-Z])/g, 'α');
    t = t.replace(/\\quad|\\qquad|\\,|\\;|\\!|\\ /g, ' ');
    t = t.replace(/\^\s*\{([^{}]*)\}/g, function (m, e) { return aSuper(e); });
    t = t.replace(/\^\s*([0-9+-])/g, function (m, e) { return aSuper(e); });
    t = t.replace(/_\s*\{([^{}]*)\}/g, '$1');
    t = t.replace(/_\s*([0-9a-zA-Z])/g, '$1');
    t = t.replace(/\\[a-zA-Z]+/g, '');
    t = t.replace(/[\\{}]/g, '');
    return t;
  }

  /* Caja aproximada que ocupa un rótulo, para poder separar los que chocan */
  function cajaTexto(x, y, s, size, anchor) {
    var n = String(s).replace(/&[a-z]+;/g, 'x').length;
    var w = Math.max(12, n * size * 0.56), h = size * 1.12;
    var x0 = anchor === 'end' ? x - w : (anchor === 'start' ? x : x - w / 2);
    return { x0: x0, x1: x0 + w, y0: y - size * 0.82, y1: y - size * 0.82 + h };
  }
  function chocanCajas(A, B) {
    return A.x0 < B.x1 - 1 && B.x0 < A.x1 - 1 && A.y0 < B.y1 - 1 && B.y0 < A.y1 - 1;
  }

  /* texto con halo blanco: se lee siempre, aunque caiga sobre la rejilla */
  function tHalo(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.anchor || 'middle') +
      '" font-size="' + (o.size || 17) + '" font-weight="' + (o.weight || '700') +
      '" fill="' + (o.fill || COL.texto) + '" stroke="#ffffff" stroke-width="' + (o.halo || 4) +
      '" stroke-linejoin="round" paint-order="stroke"' +
      (o.style ? ' font-style="' + o.style + '"' : '') + '>' + s + '</text>';
  }

  function plano(o) {
    o = o || {};
    var W = o.W || 720, H = o.H || 520;
    var mL = o.mL === undefined ? 64 : o.mL;
    var mR = o.mR === undefined ? 30 : o.mR;
    /* Con titulo hacen falta 60 px de margen superior, no 50: el nombre
       del eje «y» se coloca en mT + 4 y con 50 rozaba por abajo la caja
       del titulo, que se pinta con cuerpo 20 en la linea de base 30. */
    var mT = o.mT === undefined ? (o.titulo ? 60 : 26) : o.mT;
    var mB = o.mB === undefined ? 52 : o.mB;

    var rectas = (o.rectas || []).map(function (r) {
      var q = rectaDe(r.a, r.b, r.c);
      q.color = r.color || COL.azul;
      q.etiqueta = r.etiqueta ? textoPlano(r.etiqueta) : r.etiqueta;
      q.dash = r.dash;
      q.ancho = r.ancho || 3.2;
      q.pos = r.pos === undefined ? 0.72 : r.pos;
      return q;
    });
    var regiones = (o.regiones || []).map(function (g) {
      if (typeof g.inecs === 'string') {
        throw Error('En este tema las regiones se describen con objetos: ' +
          '{inecs:[{a:1, b:0, c:0, rel:">="}, ...]}. No se leen inecuaciones escritas en texto.');
      }
      var ins = (g.inecs || []).map(normInec);
      return {
        inecs: ins, color: g.color || COL.azul,
        alfa: g.alfa === undefined ? 0.20 : g.alfa,
        borde: g.borde, etiqueta: g.etiqueta ? textoPlano(g.etiqueta) : g.etiqueta
      };
    });
    var puntos = (o.puntos || []).map(function (p) {
      return {
        x: numV(p.x), y: numV(p.y), etiqueta: p.etiqueta ? textoPlano(p.etiqueta) : p.etiqueta,
        color: p.color || COL.rojo, hueco: !!p.hueco,
        dx: p.dx === undefined ? 12 : p.dx, dy: p.dy === undefined ? -14 : p.dy,
        r: p.r || 6.5, anchor: p.anchor || 'start'
      };
    });
    var segmentos = (o.segmentos || []).map(function (s) {
      return {
        x1: numV(s.x1), y1: numV(s.y1), x2: numV(s.x2), y2: numV(s.y2),
        color: s.color || COL.morado, dash: s.dash, ancho: s.ancho || 3
      };
    });
    var curvas = (o.curvas || []).map(function (c) {
      var cu = c.curva || null;
      if (!cu || typeof cu.dibuja !== 'function') {
        throw Error('En este tema «curvas» solo admite objetos con su propio método dibuja(): ' +
          '{curva: miCurva}. Para dibujar rectas usa «rectas» y para tramos poligonales «segmentos».');
      }
      return {
        curva: cu, color: c.color || COL.verde,
        etiqueta: c.etiqueta ? textoPlano(c.etiqueta) : c.etiqueta,
        dash: c.dash, ancho: c.ancho || 3.2
      };
    });

    /* ---------- autoajuste de la ventana ---------- */
    var xs = [], ys = [], i, j;
    puntos.forEach(function (p) { if (isFinite(p.x) && isFinite(p.y)) { xs.push(p.x); ys.push(p.y); } });
    segmentos.forEach(function (s) { xs.push(s.x1, s.x2); ys.push(s.y1, s.y2); });
    regiones.forEach(function (g) {
      /* Los cortes de las fronteras de la región orientan la ventana. */
      var k1, k2;
      for (k1 = 0; k1 < g.inecs.length; k1++) {
        for (k2 = k1 + 1; k2 < g.inecs.length; k2++) {
          try {
            var cr = corte(g.inecs[k1], g.inecs[k2]);
            if (cr.tipo === 'punto') { xs.push(numF(cr.x)); ys.push(numF(cr.y)); }
          } catch (e) { /* fronteras paralelas: no aportan un punto */ }
        }
      }
    });
    for (i = 0; i < rectas.length; i++) {
      for (j = i + 1; j < rectas.length; j++) {
        var cc = corte(rectas[i], rectas[j]);
        if (cc.tipo === 'punto') { xs.push(numF(cc.x)); ys.push(numF(cc.y)); }
      }
      var R = rectas[i];
      if (!cero(R.a)) { xs.push(numF(R.c.entre(R.a))); ys.push(0); }
      if (!cero(R.b)) { ys.push(numF(R.c.entre(R.b))); xs.push(0); }
    }
    curvas.forEach(function (c) {
      var p = c.curva.param;
      if (p && p.cx !== undefined) {
        xs.push(p.cx - p.r, p.cx + p.r);
        ys.push(p.cy - p.r, p.cy + p.r);
      }
      if (c.curva.tipo === 'parabola' && p && p.vx !== undefined) { xs.push(p.vx); ys.push(p.vy); }
    });
    xs = xs.filter(function (v) { return isFinite(v); });
    ys = ys.filter(function (v) { return isFinite(v); });

    var xmin = o.xmin, xmax = o.xmax, ymin = o.ymin, ymax = o.ymax;
    if (xmin === undefined || xmax === undefined) {
      if (!xs.length) { xmin = -6; xmax = 6; }
      else {
        var x0 = Math.min.apply(null, xs.concat([0])), x1 = Math.max.apply(null, xs.concat([0]));
        var px = Math.max(0.6, (x1 - x0) * 0.12);
        xmin = Math.floor(x0 - px); xmax = Math.ceil(x1 + px);
      }
    }
    if (ymin === undefined || ymax === undefined) {
      if (!ys.length) { ymin = -6; ymax = 6; }
      else {
        var y0 = Math.min.apply(null, ys.concat([0])), y1 = Math.max.apply(null, ys.concat([0]));
        var py = Math.max(0.6, (y1 - y0) * 0.12);
        ymin = Math.floor(y0 - py); ymax = Math.ceil(y1 + py);
      }
    }
    if (xmax - xmin < 4) { var cxm = (xmax + xmin) / 2; xmin = cxm - 2; xmax = cxm + 2; }
    if (ymax - ymin < 4) { var cym = (ymax + ymin) / 2; ymin = cym - 2; ymax = cym + 2; }
    var win = { xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax };

    var IW = W - mL - mR, IH = H - mT - mB;
    function X(v) { return mL + (v - xmin) / (xmax - xmin) * IW; }
    function Y(v) { return H - mB - (v - ymin) / (ymax - ymin) * IH; }
    function r1(v) { return Math.round(v * 10) / 10; }

    var px2 = o.ticks || pasoBonito(xmax - xmin);
    var py2 = o.ticksY || o.ticks || pasoBonito(ymax - ymin);
    var b = '';

    /* ---------------------------------------------------------------
       Colocación de rótulos sin solapes.
       Los rótulos «fijos» (números de los ejes, nombres de los ejes,
       leyenda) reservan su caja; los «flotantes» (rectas, curvas,
       puntos, regiones) se dibujan al final y, si chocan con una caja
       ya ocupada, se desplazan verticalmente unos píxeles hasta
       encontrar hueco. Así ningún texto queda ilegible.
       --------------------------------------------------------------- */
    var cajasFijas = [], etqsFlot = [];
    function reserva(x, y, s, size, anchor) {
      cajasFijas.push(cajaTexto(x, y, s, size, anchor));
    }
    function rotulo(x, y, s, op) {
      etqsFlot.push({ x: x, y: y, s: s, o: op || {} });
    }
    function pintaRotulos() {
      var puestas = cajasFijas.slice(), salida = '';
      etqsFlot.forEach(function (e) {
        var size = e.o.size || 17, anchor = e.o.anchor || 'middle';
        var salto = Math.max(12, Math.round(size * 1.2));
        var ancho = cajaTexto(0, 0, e.s, size, 'middle').x1;
        var lado = Math.round(ancho + 10);
        var k, j2, d, dx2, xx, yy, caja, elegida = null, i2, libre;
        /* primero se prueba a subir o bajar; si no cabe, también a los
           lados, y siempre dentro del rectángulo de la figura */
        var desplazamientos = [0, -lado, lado];
        for (j2 = 0; j2 < desplazamientos.length && !elegida; j2++) {
          dx2 = desplazamientos[j2];
          for (k = 0; k < 13; k++) {
            d = (k === 0) ? 0 : (k % 2 ? 1 : -1) * Math.ceil(k / 2) * salto;
            yy = e.y + d; xx = e.x + dx2;
            if (yy - size < mT || yy > H - mB) continue;
            caja = cajaTexto(xx, yy, e.s, size, anchor);
            if (caja.x0 < mL - 8 || caja.x1 > W - mR + 8) continue;
            libre = true;
            for (i2 = 0; i2 < puestas.length; i2++) {
              if (chocanCajas(caja, puestas[i2])) { libre = false; break; }
            }
            if (libre) { elegida = { x: xx, y: yy, caja: caja }; break; }
          }
        }
        if (!elegida) elegida = { x: e.x, y: e.y, caja: cajaTexto(e.x, e.y, e.s, size, anchor) };
        puestas.push(elegida.caja);
        salida += tHalo(r1(elegida.x), r1(elegida.y), e.s, e.o);
      });
      return salida;
    }

    /* La leyenda se sitúa antes de dibujar nada: así su caja queda
       reservada y ni las marcas de los ejes ni los rótulos se le
       meten debajo. Se pinta después, en su sitio de siempre. */
    var leg = (o.leyenda || []).map(function (it) {
      if (Array.isArray(it)) return { color: it[0], texto: textoPlano(it.texto === undefined ? it[1] : it.texto), dash: it.dash };
      return { color: it.color, texto: textoPlano(it.texto), dash: it.dash };
    });
    var cajaLeyenda = null;
    if (leg.length) {
      var lw = 0;
      leg.forEach(function (it) { lw = Math.max(lw, String(it.texto).length); });
      var bw = Math.min(IW - 20, 52 + lw * 9), bh = 12 + leg.length * 24;
      cajaLeyenda = { x0: W - mR - bw - 12, y0: mT + 12, x1: W - mR - 12, y1: mT + 12 + bh, w: bw, h: bh };
      cajasFijas.push(cajaLeyenda);
    }

    /* fondo */
    b += S.rect(mL, mT, IW, IH, '#ffffff', '#d6e0ea', { r: 6, sw: 1.4 });

    /* rejilla clara */
    var v, xt = [], yt = [];
    if (o.rejilla !== false) {
      for (v = Math.ceil(xmin / px2) * px2; v <= xmax + 1e-9; v += px2) {
        xt.push(v);
        b += S.line(r1(X(v)), mT, r1(X(v)), H - mB, COL.guia, Math.abs(v) < 1e-9 ? 1.4 : 1);
      }
      for (v = Math.ceil(ymin / py2) * py2; v <= ymax + 1e-9; v += py2) {
        yt.push(v);
        b += S.line(mL, r1(Y(v)), W - mR, r1(Y(v)), COL.guia, Math.abs(v) < 1e-9 ? 1.4 : 1);
      }
    } else {
      for (v = Math.ceil(xmin / px2) * px2; v <= xmax + 1e-9; v += px2) xt.push(v);
      for (v = Math.ceil(ymin / py2) * py2; v <= ymax + 1e-9; v += py2) yt.push(v);
    }

    /* regiones sombreadas (debajo de las rectas) */
    regiones.forEach(function (g) {
      var poli = [[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax]];
      g.inecs.forEach(function (q) {
        var C = canon(q);
        poli = clipPoly(poli, numF(C.a), numF(C.b), numF(C.c));
      });
      if (poli.length < 3) return;
      var pts = poli.map(function (p) { return [r1(X(p[0])), r1(Y(p[1]))]; });
      b += '<polygon points="' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' ') +
        '" fill="' + g.color + '" fill-opacity="' + g.alfa + '" stroke="' + (g.borde || g.color) +
        '" stroke-width="' + (g.borde === 'none' ? 0 : 2) + '" stroke-opacity="0.55"/>';
      if (g.etiqueta) {
        var gx = 0, gy = 0;
        poli.forEach(function (p) { gx += p[0]; gy += p[1]; });
        rotulo(r1(X(gx / poli.length)), r1(Y(gy / poli.length)) + 6, g.etiqueta,
          { size: 18, fill: g.color, anchor: 'middle' });
      }
    });

    /* ejes con flechas y numeración */
    if (o.ejes !== false) {
      var ejeY = (ymin <= 0 && ymax >= 0) ? Y(0) : (ymin > 0 ? H - mB : mT);
      var ejeX = (xmin <= 0 && xmax >= 0) ? X(0) : (xmin > 0 ? mL : W - mR);
      b += S.line(mL, r1(ejeY), W - mR - 6, r1(ejeY), COL.eje, 2.6);
      b += S.poly([[W - mR + 6, r1(ejeY)], [W - mR - 10, r1(ejeY) - 7], [W - mR - 10, r1(ejeY) + 7]], COL.eje, COL.eje);
      b += S.line(r1(ejeX), H - mB, r1(ejeX), mT + 6, COL.eje, 2.6);
      b += S.poly([[r1(ejeX), mT - 6], [r1(ejeX) - 7, mT + 10], [r1(ejeX) + 7, mT + 10]], COL.eje, COL.eje);
      /* Nombres de los ejes. Reservan sitio: la marca numérica que
         caiga dentro de su caja no se numera, para que no se lea
         «y7» ni «x6» pegados. */
      var etqX = { x: W - mR + 2, y: r1(ejeY) + 26, size: 19, anchor: 'end' };
      var etqY = { x: r1(ejeX) - 18, y: mT + 4, size: 19, anchor: 'end' };
      b += tHalo(etqX.x, etqX.y, 'x', { size: 19, fill: COL.eje, style: 'italic', anchor: 'end' });
      b += tHalo(etqY.x, etqY.y, 'y', { size: 19, fill: COL.eje, style: 'italic', anchor: 'end' });
      var cajaX = cajaTexto(etqX.x, etqX.y, 'x', etqX.size, 'end');
      var cajaY = cajaTexto(etqY.x, etqY.y, 'y', etqY.size, 'end');
      /* margen de respeto alrededor del nombre del eje */
      function holgura(c, m) {
        return { x0: c.x0 - m, x1: c.x1 + m, y0: c.y0 - m, y1: c.y1 + m };
      }
      cajasFijas.push(holgura(cajaX, 8), holgura(cajaY, 8));
      /* Una marca numérica solo se escribe si su caja está libre: si
         cae sobre el nombre del eje, sobre el 0, sobre otra marca o
         bajo la leyenda, se omite el número (la rayita sí se dibuja). */
      function libreFijo(c) {
        for (var q = 0; q < cajasFijas.length; q++) if (chocanCajas(c, cajasFijas[q])) return false;
        return true;
      }
      if (xmin <= 0 && xmax >= 0 && ymin <= 0 && ymax >= 0) {
        var c0 = cajaTexto(r1(X(0)) - 12, r1(Y(0)) + 26, '0', 16, 'end');
        if (libreFijo(c0)) {
          b += tHalo(r1(X(0)) - 12, r1(Y(0)) + 26, '0', { size: 16, fill: COL.eje, anchor: 'end' });
          cajasFijas.push(c0);
        }
      }
      xt.forEach(function (t) {
        if (Math.abs(t) < 1e-9) return;
        b += S.line(r1(X(t)), r1(ejeY) - 6, r1(X(t)), r1(ejeY) + 6, COL.eje, 1.8);
        var s = S.etq(t, 2), cx = r1(X(t)), cy = r1(ejeY) + 26;
        var c = cajaTexto(cx, cy, s, 16, 'middle');
        if (!libreFijo(c)) return;
        b += tHalo(cx, cy, s, { size: 16, fill: COL.eje });
        cajasFijas.push(c);
      });
      yt.forEach(function (t) {
        if (Math.abs(t) < 1e-9) return;
        b += S.line(r1(ejeX) - 6, r1(Y(t)), r1(ejeX) + 6, r1(Y(t)), COL.eje, 1.8);
        var s = S.etq(t, 2), cx = r1(ejeX) - 12, cy = r1(Y(t)) + 6;
        var c = cajaTexto(cx, cy, s, 16, 'end');
        if (!libreFijo(c)) return;
        b += tHalo(cx, cy, s, { size: 16, fill: COL.eje, anchor: 'end' });
        cajasFijas.push(c);
      });
    }

    /* curvas (cónicas) */
    curvas.forEach(function (c) {
      b += c.curva.dibuja({ win: win, X: X, Y: Y, color: c.color, ancho: c.ancho, dash: c.dash });
      if (c.etiqueta) {
        var pt = c.curva.puntoEtiqueta(win);
        if (pt) rotulo(r1(X(pt[0])), r1(Y(pt[1])) - 12, c.etiqueta, { size: 17, fill: c.color });
      }
    });

    /* rectas */
    rectas.forEach(function (R) {
      var seg = clipRecta(R, win);
      if (!seg) return;
      b += S.line(r1(X(seg[0][0])), r1(Y(seg[0][1])), r1(X(seg[1][0])), r1(Y(seg[1][1])),
        R.color, R.ancho, R.dash);
      if (R.etiqueta) {
        var t = R.pos;
        var lx = seg[0][0] + t * (seg[1][0] - seg[0][0]);
        var ly = seg[0][1] + t * (seg[1][1] - seg[0][1]);
        var qx = X(lx), qy = Y(ly);
        var dx = X(seg[1][0]) - X(seg[0][0]), dy = Y(seg[1][1]) - Y(seg[0][1]);
        var nn = Math.sqrt(dx * dx + dy * dy) || 1;
        var ox = -dy / nn * 16, oy = dx / nn * 16;
        if (qy + oy < mT + 16) oy = -oy;
        if (qy + oy > H - mB - 8) oy = -Math.abs(oy);
        rotulo(r1(Math.max(mL + 26, Math.min(W - mR - 26, qx + ox))), r1(qy + oy),
          R.etiqueta, { size: 17, fill: R.color });
      }
    });

    /* segmentos */
    segmentos.forEach(function (s) {
      var seg = clipSeg(s.x1, s.y1, s.x2, s.y2, win);
      if (!seg) return;
      b += S.line(r1(X(seg[0][0])), r1(Y(seg[0][1])), r1(X(seg[1][0])), r1(Y(seg[1][1])),
        s.color, s.ancho, s.dash);
    });

    /* puntos */
    puntos.forEach(function (p) {
      if (!isFinite(p.x) || !isFinite(p.y)) return;
      if (p.x < xmin || p.x > xmax || p.y < ymin || p.y > ymax) return;
      if (p.hueco) b += S.circle(r1(X(p.x)), r1(Y(p.y)), p.r, '#ffffff', p.color, 3);
      else b += S.circle(r1(X(p.x)), r1(Y(p.y)), p.r, p.color, '#ffffff', 2.2);
      /* el propio punto también ocupa sitio: ningún rótulo debe caer encima */
      cajasFijas.push({
        x0: X(p.x) - p.r - 3, x1: X(p.x) + p.r + 3,
        y0: Y(p.y) - p.r - 3, y1: Y(p.y) + p.r + 3
      });
      if (p.etiqueta) {
        rotulo(r1(X(p.x) + p.dx), r1(Y(p.y) + p.dy), p.etiqueta,
          { size: 17, fill: p.color, anchor: p.anchor });
      }
    });

    /* leyenda dentro del SVG, para que la figura sea autosuficiente */
    if (cajaLeyenda) {
      var bx = cajaLeyenda.x0, by = cajaLeyenda.y0;
      b += S.rect(bx, by, cajaLeyenda.w, cajaLeyenda.h, 'rgba(255,255,255,.92)', '#d6e0ea', { r: 8, sw: 1.2 });
      leg.forEach(function (it, k) {
        var yy = by + 18 + k * 24;
        b += S.line(bx + 12, yy, bx + 42, yy, it.color || COL.azul, 3.4, it.dash);
        b += S.txt(bx + 50, yy + 6, it.texto, { size: 15, weight: '600', anchor: 'start', fill: COL.texto });
      });
    }

    /* todos los rótulos flotantes, ya separados entre sí */
    b += pintaRotulos();

    if (o.titulo) {
      b = S.txt(W / 2, 30, S.esc(o.titulo), { size: 20, weight: '700', fill: COL.azulOsc }) + b;
    }

    var label = o.label || 'Representación en el plano cartesiano';
    if (o.wrap === false) {
      return '<svg role="img" aria-label="' + S.esc(label) + '" viewBox="0 0 ' + W + ' ' + H +
        '" preserveAspectRatio="xMidYMid meet"><title>' + S.esc(label) + '</title>' + b + '</svg>';
    }
    return S.svgWrap(b, W, H, label, o.cap);
  }

  /* ==================================================================
     6 · lectura y construcción de matrices
     ================================================================== */
  var AYUDA_MAT = 'Escribe cada fila en una línea o separada por «;», y los elementos ' +
    'con espacios: <code>1 2 3; 4 5 6</code>. Se admiten enteros (3), negativos (-2), ' +
    'decimales con coma o con punto (0,5) y fracciones (3/4).';
  var AYUDA_TXT = 'Escribe cada fila en una línea o separada por «;», y los elementos con ' +
    'espacios: 1 2 3; 4 5 6. Se admiten enteros (3), negativos (-2), decimales con coma ' +
    'o con punto (0,5) y fracciones (3/4).';

  /* Acepta Mat, array de arrays o texto y devuelve siempre una Mat. */
  function mat(A, nombre) {
    nombre = nombre || 'la matriz';
    if (A instanceof Mat) return A;
    if (A && A.a && A.f !== undefined) return new Mat(A.a);
    if (typeof A === 'string') return parseMat(A);
    if (A && A.length) return new Mat(A);
    throw Error('Falta ' + nombre + '. ' + AYUDA_TXT);
  }
  function exigeCuadrada(A, para) {
    A = mat(A);
    if (A.f !== A.c) {
      throw Error('Esa operación (' + (para || 'la que has pedido') + ') solo tiene sentido en ' +
        'matrices cuadradas, y esta es de ' + A.f + '×' + A.c + '. Una matriz cuadrada tiene el ' +
        'mismo número de filas que de columnas: por ejemplo 1 2; 3 4.');
    }
    return A;
  }

  /* Corta el texto en filas y cada fila en elementos.
     Separadores de fila: «;» o salto de línea.
     Separadores de columna: espacios, tabuladores o comas.
     La coma también puede ser la coma decimal: si la fila usa espacios para
     separar los elementos, «0,5» se lee como el decimal 0,5; si la fila no
     tiene espacios («1,2,3»), la coma separa columnas. */
  function troceaFilas(txt, ejemplo) {
    var bruto = String(txt === undefined || txt === null ? '' : txt)
      .replace(/[−–—]/g, '-')
      .replace(/[\[\]\{\}\(\)]/g, ' ')
      .replace(/\|/g, ' ')
      .trim();
    if (bruto === '') {
      throw Error('No has escrito ninguna matriz. ' + (ejemplo || AYUDA_TXT));
    }
    var lineas = bruto.split(/[;\n\r]+/);
    var filas = [], i;
    for (i = 0; i < lineas.length; i++) {
      var l = lineas[i].trim();
      if (l === '') continue;
      var conEspacios = /[ \t]/.test(l);
      if (conEspacios) l = l.replace(/(\d)\s*,\s*(\d)/g, '$1.$2');
      var trozos = l.split(conEspacios ? /[\s,]+/ : /,+/);
      trozos = trozos.filter(function (t) { return t !== ''; });
      if (!trozos.length) continue;
      filas.push(trozos);
    }
    if (!filas.length) {
      throw Error('No he encontrado ninguna fila con números. ' + (ejemplo || AYUDA_TXT));
    }
    return filas;
  }
  function exigeRectangular(filas) {
    var c = filas[0].length, i;
    for (i = 1; i < filas.length; i++) {
      if (filas[i].length !== c) {
        throw Error('Todas las filas deben tener el mismo número de elementos: la fila 1 tiene ' +
          c + ' y la fila ' + (i + 1) + ' tiene ' + filas[i].length + '. ' +
          'Si en una posición no hay nada, escribe un 0. ' + AYUDA_TXT);
      }
    }
    return c;
  }

  /* "1 2 3; 4 5 6"  ->  Mat 2x3 con entradas exactas */
  function parseMat(txt) {
    var filas = troceaFilas(txt);
    exigeRectangular(filas);
    var a = [], i, j;
    for (i = 0; i < filas.length; i++) {
      var fila = [];
      for (j = 0; j < filas[i].length; j++) {
        var t = filas[i][j].replace(/^\+/, '');
        try {
          fila.push(numTxtAFrac(t));
        } catch (e) {
          throw Error('No entiendo el elemento «' + filas[i][j] + '» (fila ' + (i + 1) +
            ', columna ' + (j + 1) + '). ' + AYUDA_TXT);
        }
      }
      a.push(fila);
    }
    return new Mat(a);
  }

  /* Matriz definida por una fórmula en i y j (índices desde 1).
     Ejemplos: "i+j", "i*j", "i-j", "(-1)^(i+j)", "2i-j", "i^2-j". */
  function evaluaFormula(expr, vi, vj) {
    var s = String(expr === undefined || expr === null ? '' : expr).toLowerCase();
    s = s.replace(/\s+/g, '').replace(/[·×]/g, '*').replace(/[−–—]/g, '-');
    s = s.replace(/[\[\{]/g, '(').replace(/[\]\}]/g, ')').replace(/(\d),(\d)/g, '$1.$2');
    if (s === '') {
      throw Error('Escribe la fórmula del elemento general en función de i y j. ' +
        'Ejemplos: i+j, i*j, i-j, 2i-j, (-1)^(i+j).');
    }
    if (!/^[0-9ij\+\-\*\^\(\)\.\/]*$/.test(s)) {
      var malo = s.split('').filter(function (c) { return !/[0-9ij\+\-\*\^\(\)\.\/]/.test(c); })[0];
      throw Error('En la fórmula no puede aparecer «' + malo + '». Usa solo las letras i y j, ' +
        'números y los signos + - * / ^ ( ). Ejemplos: i+j, i*j, 2i-j, (-1)^(i+j).');
    }
    var p = 0;
    function fin() { return p >= s.length; }
    function ver() { return s.charAt(p); }
    function come(c) { if (ver() === c) { p++; return true; } return false; }

    function expresion() {
      var signo = come('-') ? -1 : (come('+') ? 1 : 1);
      var acc = termino();
      if (signo < 0) acc = acc.opuesto();
      for (;;) {
        if (come('+')) acc = acc.mas(termino());
        else if (come('-')) acc = acc.menos(termino());
        else break;
      }
      return acc;
    }
    function termino() {
      var acc = factor();
      for (;;) {
        if (come('*')) acc = acc.por(factor());
        else if (come('/')) {
          var d = factor();
          if (cero(d)) throw Error('La fórmula intenta dividir entre 0 en la posición i=' + vi + ', j=' + vj + '.');
          acc = acc.entre(d);
        } else if (/[0-9ij\(]/.test(ver())) acc = acc.por(factor());   /* producto implícito: 2i */
        else break;
      }
      return acc;
    }
    function factor() {
      var b = base();
      if (come('^')) {
        var e = base();
        if (!e.esEntero()) {
          throw Error('El exponente de una potencia debe ser un número entero. Escribe por ejemplo (-1)^(i+j).');
        }
        var n = Number(e.n), r = F1(), t;
        if (n < 0) {
          if (cero(b)) throw Error('No se puede elevar 0 a un exponente negativo.');
          for (t = 0; t < -n; t++) r = r.entre(b);
        } else {
          for (t = 0; t < n; t++) r = r.por(b);
        }
        return r;
      }
      return b;
    }
    function base() {
      if (come('(')) {
        var v = expresion();
        if (!come(')')) throw Error('Falta un paréntesis de cierre en la fórmula «' + expr + '».');
        return v;
      }
      if (come('-')) return base().opuesto();
      if (come('+')) return base();
      if (come('i')) return new Frac(vi);
      if (come('j')) return new Frac(vj);
      var k = p;
      while (!fin() && /[0-9.]/.test(ver())) p++;
      var t2 = s.slice(k, p);
      if (t2 === '') {
        throw Error('No entiendo la fórmula «' + expr + '» cerca de la posición ' + (p + 1) +
          '. Ejemplos correctos: i+j, i*j, 2i-j, (-1)^(i+j).');
      }
      return numTxtAFrac(t2);
    }
    var res = expresion();
    if (!fin()) {
      throw Error('Sobra algo al final de la fórmula «' + expr + '». Ejemplos correctos: ' +
        'i+j, i*j, 2i-j, (-1)^(i+j).');
    }
    return res;
  }
  function matPorFormula(f, c, expr) {
    f = orden(f, 'el número de filas');
    c = orden(c, 'el número de columnas');
    var a = [], i, j;
    for (i = 1; i <= f; i++) {
      var fila = [];
      for (j = 1; j <= c; j++) fila.push(evaluaFormula(expr, i, j));
      a.push(fila);
    }
    return new Mat(a);
  }
  function orden(n, nombre) {
    var v = Number(n);
    if (!isFinite(v) || v !== Math.round(v) || v < 1 || v > 12) {
      throw Error((nombre || 'El orden') + ' debe ser un número entero entre 1 y 12 (has escrito «' + n + '»).');
    }
    return v;
  }

  /* Matrices de referencia --------------------------------------------- */
  function matNula(f, c) {
    f = orden(f, 'el número de filas');
    c = orden(c === undefined ? f : c, 'el número de columnas');
    var a = [], i, j;
    for (i = 0; i < f; i++) { a.push([]); for (j = 0; j < c; j++) a[i].push(F0()); }
    return new Mat(a);
  }
  function matIdentidad(n) { return matIdent(orden(n, 'el orden de la identidad')); }
  function matDiagonal(lista) {
    if (!lista || !lista.length) {
      throw Error('Para construir una matriz diagonal hace falta la lista de los elementos de ' +
        'la diagonal, por ejemplo S.matDiagonal([2, -1, 5]).');
    }
    var n = lista.length, a = [], i, j;
    for (i = 0; i < n; i++) {
      a.push([]);
      for (j = 0; j < n; j++) a[i].push(i === j ? F(lista[i]) : F0());
    }
    return new Mat(a);
  }
  function matEscalarMat(n, k) {
    n = orden(n, 'el orden de la matriz escalar');
    var f = F(k === undefined ? 1 : k), a = [], i, j;
    for (i = 0; i < n; i++) {
      a.push([]);
      for (j = 0; j < n; j++) a[i].push(i === j ? new Frac(f.n, f.d) : F0());
    }
    return new Mat(a);
  }

  /* Matriz aleatoria del tipo pedido ---------------------------------- */
  function azar(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
  function matAleatoria(f, c, opts) {
    opts = opts || {};
    f = orden(f, 'el número de filas');
    c = orden(c === undefined ? f : c, 'el número de columnas');
    var min = opts.min === undefined ? -5 : Math.round(Number(opts.min));
    var max = opts.max === undefined ? 5 : Math.round(Number(opts.max));
    if (max < min) { var t = min; min = max; max = t; }
    var entera = opts.entera === undefined ? true : !!opts.entera;
    var tipo = opts.tipo || 'cualquiera';
    var CUAD = ['simetrica', 'antisimetrica', 'triangular', 'diagonal', 'regular', 'singular', 'escalar', 'identidad'];
    if (CUAD.indexOf(tipo) >= 0 && f !== c) {
      throw Error('Una matriz de tipo «' + tipo + '» es cuadrada: pide el mismo número de filas ' +
        'y de columnas (has pedido ' + f + '×' + c + ').');
    }
    function num() {
      var v = azar(min, max);
      if (entera) return new Frac(v);
      var d = azar(1, 4);
      return new Frac(v, d);
    }
    function numNoNulo() {
      var v = num(), intentos = 0;
      while (cero(v) && intentos++ < 20) v = num();
      if (cero(v)) v = F1();
      return v;
    }
    var a = [], i, j;
    for (i = 0; i < f; i++) { a.push([]); for (j = 0; j < c; j++) a[i].push(F0()); }

    if (tipo === 'cualquiera') {
      for (i = 0; i < f; i++) for (j = 0; j < c; j++) a[i][j] = num();
    } else if (tipo === 'simetrica') {
      for (i = 0; i < f; i++) for (j = i; j < c; j++) { a[i][j] = num(); a[j][i] = a[i][j]; }
    } else if (tipo === 'antisimetrica') {
      for (i = 0; i < f; i++) for (j = i + 1; j < c; j++) { a[i][j] = num(); a[j][i] = a[i][j].opuesto(); }
    } else if (tipo === 'triangular') {
      for (i = 0; i < f; i++) for (j = i; j < c; j++) a[i][j] = (i === j ? numNoNulo() : num());
    } else if (tipo === 'diagonal') {
      for (i = 0; i < f; i++) a[i][i] = numNoNulo();
    } else if (tipo === 'escalar') {
      var k0 = numNoNulo();
      for (i = 0; i < f; i++) a[i][i] = k0;
    } else if (tipo === 'identidad') {
      for (i = 0; i < f; i++) a[i][i] = F1();
    } else if (tipo === 'regular') {
      var intentos = 0, M0;
      do {
        for (i = 0; i < f; i++) for (j = 0; j < c; j++) a[i][j] = num();
        M0 = new Mat(a);
        intentos++;
      } while (cero(det(M0)) && intentos < 200);
      if (cero(det(M0))) return matIdent(f);
      return M0;
    } else if (tipo === 'singular') {
      for (i = 0; i < f - 1; i++) for (j = 0; j < c; j++) a[i][j] = num();
      var l1 = new Frac(azar(1, 3)), l2 = new Frac(azar(-2, 2));
      for (j = 0; j < c; j++) {
        a[f - 1][j] = a[0][j].por(l1).mas((f > 2 ? a[1][j] : F0()).por(l2));
      }
      var MS = new Mat(a);
      if (!cero(det(MS))) {                    /* por si acaso: fila repetida */
        for (j = 0; j < c; j++) a[f - 1][j] = a[0][j];
        MS = new Mat(a);
      }
      return MS;
    } else {
      throw Error('No conozco el tipo de matriz «' + tipo + '». Los tipos válidos son: ' +
        'cualquiera, simetrica, antisimetrica, triangular, diagonal, escalar, identidad, regular y singular.');
    }
    return new Mat(a);
  }

  /* Dimensión, texto, igualdad ---------------------------------------- */
  function dimTex(A) { A = mat(A); return A.f + ' \\times ' + A.c; }
  function dimTxt(A) { A = mat(A); return A.f + '×' + A.c; }
  function matTxt(A) {
    A = mat(A);
    return A.a.map(function (fila) {
      return fila.map(function (x) { return x.txt(); }).join(' ');
    }).join('; ');
  }
  function matIgual(A, B) {
    A = mat(A, 'la primera matriz'); B = mat(B, 'la segunda matriz');
    return A.igual(B);
  }
  function difIguales(A, B) {
    A = mat(A, 'la primera matriz'); B = mat(B, 'la segunda matriz');
    if (A.f !== B.f || A.c !== B.c) {
      throw Error('Para comparar elemento a elemento las dos matrices deben tener la misma ' +
        'dimensión: la primera es ' + dimTxt(A) + ' y la segunda ' + dimTxt(B) + '. ' +
        'Dos matrices de dimensiones distintas nunca son iguales.');
    }
    var d = [], i, j;
    for (i = 0; i < A.f; i++) {
      for (j = 0; j < A.c; j++) if (!igualF(A.a[i][j], B.a[i][j])) d.push([i, j]);
    }
    return d;
  }

  /* ==================================================================
     7 · clasificación de matrices
     ================================================================== */
  function esNula(A) { return mat(A).esNula(); }
  function esCuadrada(A) { A = mat(A); return A.f === A.c; }
  function esTriangularSup(A) {
    A = mat(A);
    if (A.f !== A.c) return false;
    var i, j;
    for (i = 1; i < A.f; i++) for (j = 0; j < i; j++) if (!cero(A.a[i][j])) return false;
    return true;
  }
  function esTriangularInf(A) {
    A = mat(A);
    if (A.f !== A.c) return false;
    var i, j;
    for (i = 0; i < A.f; i++) for (j = i + 1; j < A.c; j++) if (!cero(A.a[i][j])) return false;
    return true;
  }
  function esDiagonal(A) { return esTriangularSup(A) && esTriangularInf(A); }
  function esEscalar(A) {
    A = mat(A);
    if (!esDiagonal(A)) return false;
    var i;
    for (i = 1; i < A.f; i++) if (!igualF(A.a[i][i], A.a[0][0])) return false;
    return true;
  }
  function esIdentidad(A) {
    A = mat(A);
    return esDiagonal(A) && (function () {
      var i;
      for (i = 0; i < A.f; i++) if (!igualF(A.a[i][i], F1())) return false;
      return true;
    })();
  }
  function falloSimetria(A, signo) {              /* signo = 1 simétrica, -1 antisimétrica */
    A = mat(A);
    if (A.f !== A.c) return { fuera: true };
    var i, j;
    for (i = 0; i < A.f; i++) {
      for (j = i; j < A.c; j++) {
        var esperado = signo > 0 ? A.a[j][i] : A.a[j][i].opuesto();
        if (!igualF(A.a[i][j], esperado)) return { i: i, j: j };
      }
    }
    return null;
  }
  function esSimetrica(A) { return falloSimetria(A, 1) === null; }
  function esAntisimetrica(A) { return falloSimetria(A, -1) === null; }
  function esRegular(A) {
    A = mat(A);
    if (A.f !== A.c) return false;
    return !cero(det(A));
  }
  function traza(A) {
    A = exigeCuadrada(A, 'la traza');
    var s = F0(), i;
    for (i = 0; i < A.f; i++) s = s.mas(A.a[i][i]);
    return s;
  }
  function diagPrincipal(A) {
    A = mat(A);
    var n = Math.min(A.f, A.c), d = [], i;
    for (i = 0; i < n; i++) d.push(A.a[i][i]);
    return d;
  }
  function diagSecundaria(A) {
    A = mat(A);
    var n = Math.min(A.f, A.c), d = [], i;
    for (i = 0; i < n; i++) d.push(A.a[i][A.c - 1 - i]);
    return d;
  }
  function elemTex(A, i, j) {
    return 'a_{' + (i + 1) + (j + 1) + '} = ' + fTex(A.a[i][j]);
  }

  /* Ficha completa de una matriz: booleanos, etiquetas y explicaciones. */
  function clasifica(A) {
    A = mat(A);
    var f = A.f, c = A.c, cuad = f === c;
    var r = {};
    r.f = f; r.c = c;
    r.cuadrada = cuad;
    r.orden = cuad ? f : null;
    r.fila = f === 1;
    r.columna = c === 1;
    r.rectangular = !cuad;
    r.nula = A.esNula();
    r.triangularSup = esTriangularSup(A);
    r.triangularInf = esTriangularInf(A);
    r.diagonal = esDiagonal(A);
    r.escalar = esEscalar(A);
    r.identidad = esIdentidad(A);
    r.simetrica = esSimetrica(A);
    r.antisimetrica = esAntisimetrica(A);
    r.traspuestaIgual = r.simetrica;
    r.rango = rango(A);
    r.regular = cuad && r.rango === f;
    r.singular = cuad && !r.regular;
    r.det = cuad ? det(A) : null;
    r.traza = cuad ? traza(A) : null;

    var n = [];
    if (r.fila) n.push('matriz fila');
    if (r.columna && !(f === 1 && c === 1)) n.push('matriz columna');
    if (r.rectangular) n.push('rectangular');
    if (cuad) n.push('cuadrada de orden ' + f);
    if (r.nula) n.push('matriz nula');
    if (r.triangularSup && !r.diagonal) n.push('triangular superior');
    if (r.triangularInf && !r.diagonal) n.push('triangular inferior');
    if (r.diagonal && !r.escalar) n.push('diagonal');
    if (r.escalar && !r.identidad) n.push('escalar');
    if (r.identidad) n.push('matriz identidad');
    if (r.simetrica && !r.nula) n.push('simétrica');
    if (r.antisimetrica && !r.nula) n.push('antisimétrica');
    if (r.regular) n.push('regular (tiene inversa)');
    if (r.singular) n.push('singular (no tiene inversa)');
    r.nombres = n;

    /* --- explicaciones: por qué sí y por qué no --- */
    var z = {};
    z.dimension = 'La matriz tiene ' + f + (f === 1 ? ' fila' : ' filas') + ' y ' + c +
      (c === 1 ? ' columna' : ' columnas') + ', luego es de dimensión $' + dimTex(A) +
      '$ y tiene $' + f + '\\cdot' + c + ' = ' + (f * c) + '$ elementos.';
    z.cuadrada = cuad
      ? 'Sí: tiene tantas filas como columnas ($' + f + ' = ' + c + '$), así que es cuadrada de orden $' + f + '$.'
      : 'No: tiene ' + f + ' filas y ' + c + ' columnas, y $' + f + ' \\ne ' + c + '$.';
    z.fila = r.fila ? 'Sí: solo tiene una fila, es una matriz fila $1 \\times ' + c + '$.'
      : 'No: tiene ' + f + ' filas, y una matriz fila tiene exactamente una.';
    z.columna = r.columna ? 'Sí: solo tiene una columna, es una matriz columna $' + f + ' \\times 1$.'
      : 'No: tiene ' + c + ' columnas, y una matriz columna tiene exactamente una.';
    z.rectangular = r.rectangular ? 'Sí: el número de filas y el de columnas no coinciden.'
      : 'No: al ser cuadrada no se le llama rectangular (aunque todo rectángulo con lados iguales sea un cuadrado, aquí se reservan los nombres).';
    z.nula = r.nula ? 'Sí: todos sus elementos valen $0$.'
      : (function () {
        var i, j;
        for (i = 0; i < f; i++) for (j = 0; j < c; j++) if (!cero(A.a[i][j])) {
          return 'No: hay elementos distintos de cero, por ejemplo $' + elemTex(A, i, j) + '$.';
        }
        return 'No.';
      })();
    if (!cuad) {
      z.triangularSup = 'No tiene sentido: los triángulos superior e inferior se definen respecto de la diagonal principal, y para eso la matriz debe ser cuadrada.';
      z.triangularInf = z.triangularSup;
      z.diagonal = 'No: una matriz diagonal es cuadrada, y esta es de $' + dimTex(A) + '$.';
      z.escalar = 'No: una matriz escalar es diagonal, y por tanto cuadrada.';
      z.identidad = 'No: la identidad $I_n$ es cuadrada, y esta es de $' + dimTex(A) + '$.';
      z.simetrica = 'No: para comparar $a_{ij}$ con $a_{ji}$ la matriz debe ser cuadrada. Aquí $A^t$ es de $' + A.c + ' \\times ' + A.f + '$, distinta de $A$.';
      z.antisimetrica = z.simetrica;
      z.traspuestaIgual = z.simetrica;
      z.regular = 'No procede: solo las matrices cuadradas pueden tener inversa.';
      z.singular = z.regular;
      z.traza = 'No procede: la traza es la suma de la diagonal principal de una matriz cuadrada.';
    } else {
      z.triangularSup = r.triangularSup
        ? 'Sí: todos los elementos por debajo de la diagonal principal son $0$.'
        : (function () {
          var i, j;
          for (i = 1; i < f; i++) for (j = 0; j < i; j++) if (!cero(A.a[i][j])) {
            return 'No: por debajo de la diagonal aparece $' + elemTex(A, i, j) + ' \\ne 0$.';
          }
          return 'No.';
        })();
      z.triangularInf = r.triangularInf
        ? 'Sí: todos los elementos por encima de la diagonal principal son $0$.'
        : (function () {
          var i, j;
          for (i = 0; i < f; i++) for (j = i + 1; j < c; j++) if (!cero(A.a[i][j])) {
            return 'No: por encima de la diagonal aparece $' + elemTex(A, i, j) + ' \\ne 0$.';
          }
          return 'No.';
        })();
      z.diagonal = r.diagonal
        ? 'Sí: es a la vez triangular superior e inferior, o sea, todo lo que no está en la diagonal principal vale $0$.'
        : 'No: para ser diagonal deben anularse todos los elementos fuera de la diagonal principal, y aquí no ocurre.';
      z.escalar = r.escalar
        ? 'Sí: es diagonal y todos los elementos de la diagonal son iguales a $' + fTex(A.a[0][0]) + '$, es decir, $A = ' + fTex(A.a[0][0]) + ' I_{' + f + '}$.'
        : (r.diagonal
          ? 'No: es diagonal, pero los elementos de la diagonal no son todos iguales ($' + fTex(A.a[0][0]) + '$ y $' + fTex(A.a[1][1]) + '$).'
          : 'No: una matriz escalar es diagonal con todos los elementos de la diagonal iguales.');
      z.identidad = r.identidad
        ? 'Sí: es diagonal y todos los elementos de la diagonal valen $1$: es $I_{' + f + '}$.'
        : (r.escalar
          ? 'No: es escalar, pero los elementos de la diagonal valen $' + fTex(A.a[0][0]) + '$ y no $1$.'
          : 'No: la identidad tiene unos en la diagonal principal y ceros en todo lo demás.');
      var fs = falloSimetria(A, 1);
      z.simetrica = r.simetrica
        ? 'Sí: $a_{ij} = a_{ji}$ en todas las posiciones, es decir, $A^t = A$.'
        : 'No: $a_{' + (fs.i + 1) + (fs.j + 1) + '} = ' + fTex(A.a[fs.i][fs.j]) + '$ pero $a_{' +
          (fs.j + 1) + (fs.i + 1) + '} = ' + fTex(A.a[fs.j][fs.i]) + '$, y deberían coincidir.';
      z.traspuestaIgual = z.simetrica;
      var fa = falloSimetria(A, -1);
      z.antisimetrica = r.antisimetrica
        ? 'Sí: $a_{ij} = -a_{ji}$ en todas las posiciones (y por eso la diagonal principal es de ceros): $A^t = -A$.'
        : (fa.i === fa.j
          ? 'No: en una matriz antisimétrica la diagonal es de ceros, y aquí $' + elemTex(A, fa.i, fa.i) + ' \\ne 0$.'
          : 'No: $a_{' + (fa.i + 1) + (fa.j + 1) + '} = ' + fTex(A.a[fa.i][fa.j]) + '$ y $a_{' +
            (fa.j + 1) + (fa.i + 1) + '} = ' + fTex(A.a[fa.j][fa.i]) + '$, pero debería ser $a_{ij} = -a_{ji}$.');
      z.regular = r.regular
        ? 'Sí: $\\det(A) = ' + fTex(r.det) + ' \\ne 0$ y $\\operatorname{rg}(A) = ' + f + '$, el orden de la matriz, así que existe $A^{-1}$.'
        : 'No: $\\det(A) = 0$ y $\\operatorname{rg}(A) = ' + r.rango + ' < ' + f + '$, luego no existe $A^{-1}$.';
      z.singular = r.singular
        ? 'Sí: su determinante es $0$, así que no tiene inversa. Sus filas son linealmente dependientes.'
        : 'No: su determinante es $' + fTex(r.det) + ' \\ne 0$, luego es regular y tiene inversa.';
      z.traza = 'La traza es la suma de la diagonal principal: $\\operatorname{tr}(A) = ' + fTex(r.traza) + '$.';
    }
    z.rango = 'El rango es $\\operatorname{rg}(A) = ' + r.rango + '$: es el número de filas ' +
      'linealmente independientes, y siempre cumple $\\operatorname{rg}(A) \\le \\min(' + f + ',\\ ' + c + ') = ' +
      Math.min(f, c) + '$.';
    r.razones = z;
    return r;
  }

  /* ==================================================================
     8 · transposición y descomposición simétrica
     ================================================================== */
  function matTrans(A) { return matTraspuesta(mat(A)); }

  /* A = S + H con S simétrica y H antisimétrica (A cuadrada). */
  function descomponSim(A) {
    A = exigeCuadrada(A, 'la descomposición en parte simétrica y parte antisimétrica');
    var T = matTrans(A);
    var med = new Frac(1, 2);
    var S1 = matEscalar(matSuma(A, T), med);
    var H1 = matEscalar(matResta(A, T), med);
    var pasos = [
      { desc: 'Partimos de la matriz $A$ y calculamos su transpuesta $A^t$.',
        tex: 'A = ' + matTex(A) + ' \\qquad A^t = ' + matTex(T) },
      { desc: 'La <strong>parte simétrica</strong> es la semisuma de $A$ y $A^t$.',
        tex: 'S = \\tfrac{1}{2}\\left(A + A^t\\right) = \\tfrac{1}{2}' + matTex(matSuma(A, T)) + ' = ' + matTex(S1) },
      { desc: 'La <strong>parte antisimétrica</strong> es la semidiferencia.',
        tex: 'H = \\tfrac{1}{2}\\left(A - A^t\\right) = \\tfrac{1}{2}' + matTex(matResta(A, T)) + ' = ' + matTex(H1) },
      { desc: 'Al sumarlas se recupera $A$, porque $\\tfrac{1}{2}(A+A^t) + \\tfrac{1}{2}(A-A^t) = A$.',
        tex: 'S + H = ' + matTex(matSuma(S1, H1)) + ' = A' }
    ];
    return {
      S: S1, H: H1, pasos: pasos, transpuesta: T,
      simetricaOk: esSimetrica(S1), antisimetricaOk: esAntisimetrica(H1),
      sumaOk: matIgual(matSuma(S1, H1), A)
    };
  }

  /* ==================================================================
     9 · operaciones: suma, resta, escalar, producto y potencias
     ================================================================== */
  function exigeMismaDim(A, B, op) {
    if (A.f !== B.f || A.c !== B.c) {
      throw Error('No se puede ' + (op || 'sumar') + ': la primera matriz es de ' + dimTxt(A) +
        ' y la segunda de ' + dimTxt(B) + '. Para ' + (op || 'sumar') + ' dos matrices hace falta ' +
        'que tengan la MISMA dimensión, porque se opera elemento a elemento. ' +
        'Escribe las dos con ' + A.f + ' filas y ' + A.c + ' columnas, por ejemplo ' +
        matTxt(A) + ' y otra igual de grande.');
    }
  }
  function porElementos(A, B, fn) {
    var a = [], i, j;
    for (i = 0; i < A.f; i++) {
      a.push([]);
      for (j = 0; j < A.c; j++) a[i].push(fn(A.a[i][j], B.a[i][j]));
    }
    return new Mat(a);
  }
  function matSuma(A, B) {
    A = mat(A, 'la primera matriz'); B = mat(B, 'la segunda matriz');
    exigeMismaDim(A, B, 'sumar');
    return porElementos(A, B, function (x, y) { return x.mas(y); });
  }
  function matResta(A, B) {
    A = mat(A, 'la primera matriz'); B = mat(B, 'la segunda matriz');
    exigeMismaDim(A, B, 'restar');
    return porElementos(A, B, function (x, y) { return x.menos(y); });
  }
  function matEscalar(A, k) {
    A = mat(A);
    var f = F(k === undefined ? 1 : k), a = [], i, j;
    for (i = 0; i < A.f; i++) {
      a.push([]);
      for (j = 0; j < A.c; j++) a[i].push(A.a[i][j].por(f));
    }
    return new Mat(a);
  }
  function opuesta(A) { return matEscalar(A, new Frac(-1)); }
  function matCombina(al, A, be, B) {
    A = mat(A, 'la primera matriz'); B = mat(B, 'la segunda matriz');
    exigeMismaDim(A, B, 'combinar linealmente');
    return matSuma(matEscalar(A, F(al === undefined ? 1 : al)), matEscalar(B, F(be === undefined ? 1 : be)));
  }

  /* Vector fila o columna a partir de arrays, texto o matrices 1xn / nx1 */
  function vectorDe(v, nombre) {
    nombre = nombre || 'el vector';
    if (typeof v === 'string') v = parseMat(v);
    if (v && v.a && v.f !== undefined) {
      if (v.f === 1) return v.a[0].slice();
      if (v.c === 1) return v.col(0).slice();
      throw Error(nombre + ' debe ser una matriz fila ($1 \\times n$) o una matriz columna ' +
        '($n \\times 1$), y la que has escrito es de ' + dimTxt(v) + '.');
    }
    if (v && v.length) return v.map(function (x) { return F(x); });
    throw Error('Falta ' + nombre + '. Escribe sus elementos separados por espacios: 1 2 3.');
  }
  /* Producto de una fila por una columna: el ladrillo del producto de matrices */
  function filaPorColumna(fila, col) {
    var u = vectorDe(fila, 'la fila'), v = vectorDe(col, 'la columna');
    if (u.length !== v.length) {
      throw Error('La fila tiene ' + u.length + ' elemento' + (u.length === 1 ? '' : 's') +
        ' y la columna ' + v.length + ': no se pueden emparejar. El producto de una matriz fila ' +
        '$1 \\times n$ por una matriz columna $n \\times 1$ exige el MISMO número $n$ en las dos. ' +
        'Añade o quita elementos hasta igualar las longitudes.');
    }
    var pasos = [], total = F0(), i;
    for (i = 0; i < u.length; i++) {
      var pr = u[i].por(v[i]);
      pasos.push({ a: u[i], b: v[i], prod: pr, tex: prodTex([u[i], v[i]]) + ' = ' + fTex(pr) });
      total = total.mas(pr);
    }
    var sumandos = pasos.map(function (p) { return prodTex([p.a, p.b]); }).join(' + ');
    return {
      valor: total, pasos: pasos,
      /* Los productos negativos van entre paréntesis: «8 + (−5)» y no
         «8 + -5» (S.sumandosTex vive en el núcleo mtx-applets.js). */
      tex: sumandos + ' = ' + S.sumandosTex(pasos.map(function (p) { return fTex(p.prod); })) + ' = ' + fTex(total),
      texCorto: sumandos + ' = ' + fTex(total),
      n: u.length, fila: u, columna: v
    };
  }

  function matProd(A, B) {
    A = mat(A, 'la primera matriz'); B = mat(B, 'la segunda matriz');
    if (A.c !== B.f) {
      throw Error('No se puede multiplicar ' + dimTxt(A) + ' por ' + dimTxt(B) + ': el número de ' +
        'COLUMNAS de la primera (' + A.c + ') debe coincidir con el número de FILAS de la segunda (' +
        B.f + '). Recuerda que $(m \\times n)\\cdot(n \\times p) = m \\times p$: prueba con una ' +
        'segunda matriz de ' + A.c + ' filas.');
    }
    return matPor(A, B);
  }
  function matProdPasos(A, B) {
    A = mat(A, 'la primera matriz'); B = mat(B, 'la segunda matriz');
    var dimT = '(' + A.f + '\\times' + A.c + ')\\cdot(' + B.f + '\\times' + B.c + ')';
    if (A.c !== B.f) {
      return {
        P: null, celdas: [], compatible: false,
        dimTex: dimT,
        motivo: 'Las matrices no son multiplicables en ese orden: la primera tiene ' + A.c +
          ' columnas y la segunda ' + B.f + ' filas. Hace falta que coincidan.'
      };
    }
    var P = matPor(A, B), celdas = [], i, j;
    for (i = 0; i < A.f; i++) {
      celdas.push([]);
      for (j = 0; j < B.c; j++) {
        var fc = filaPorColumna(A.a[i], B.col(j));
        celdas[i].push({
          valor: fc.valor, tex: fc.tex, texCorto: fc.texCorto,
          sumandos: fc.pasos,
          etiqueta: 'c_{' + (i + 1) + (j + 1) + '} = F_{' + (i + 1) + '} \\cdot C_{' + (j + 1) + '}'
        });
      }
    }
    return {
      P: P, celdas: celdas, compatible: true,
      dimTex: dimT + '=' + P.f + '\\times' + P.c,
      motivo: null
    };
  }

  function matPot(A, n) {
    A = exigeCuadrada(A, 'la potencia de una matriz');
    var e = Number(n);
    if (!isFinite(e) || e !== Math.round(e) || e < 0) {
      throw Error('El exponente de una potencia de matrices debe ser un número natural ' +
        '(0, 1, 2, 3, …). Has escrito «' + n + '». Por definición $A^0 = I$ y $A^{k+1} = A^k \\cdot A$.');
    }
    if (e > 60) {
      throw Error('El exponente ' + e + ' es demasiado grande para calcularlo entero. ' +
        'Prueba con un exponente menor que 60 y busca el patrón de las potencias.');
    }
    var R2 = matIdent(A.f), i;
    for (i = 0; i < e; i++) R2 = matPor(R2, A);
    return R2;
  }
  /* Tabla de potencias con detección de patrones didácticos */
  function matPotPasos(A, n) {
    A = exigeCuadrada(A, 'las potencias de una matriz');
    var e = Number(n === undefined ? 4 : n);
    if (!isFinite(e) || e !== Math.round(e) || e < 1 || e > 20) {
      throw Error('Para la tabla de potencias elige un exponente entero entre 1 y 20 (has escrito «' + n + '»).');
    }
    var lim = Math.max(e, 2 * A.f + 2, 6);
    if (lim > 20) lim = 20;
    var pot = [], lista = [], P = matIdent(A.f), k;
    for (k = 1; k <= lim; k++) {
      P = matPor(P, A);
      lista.push(P);
      if (k <= e) pot.push({ k: k, M: P, tex: 'A^{' + k + '} = ' + matTex(P) });
    }
    var I = matIdent(A.f), Z = matNula(A.f, A.f);
    var nilpotente = false, indice = null, idempotente = lista[1] ? lista[1].igual(A) : false;
    var periodo = null, desde = null, patron = null;
    for (k = 0; k < lista.length; k++) {
      if (lista[k].igual(Z)) { nilpotente = true; indice = k + 1; break; }
    }
    if (!nilpotente) {
      for (k = 0; k < lista.length; k++) {
        if (lista[k].igual(I)) { periodo = k + 1; desde = 0; break; }
      }
      if (periodo === null) {
        var s, p2, corta = false;
        for (s = 0; s < lista.length && !corta; s++) {
          for (p2 = 1; s + p2 < lista.length; p2++) {
            if (lista[s + p2].igual(lista[s])) { periodo = p2; desde = s + 1; corta = true; break; }
          }
        }
      }
    }
    if (nilpotente) {
      patron = 'La matriz es nilpotente: $A^{' + indice + '} = 0$, y a partir de ahí todas las ' +
        'potencias siguientes son la matriz nula.';
    } else if (idempotente) {
      patron = 'La matriz es idempotente: $A^2 = A$, así que $A^n = A$ para todo $n \\ge 1$.';
    } else if (periodo !== null && desde === 0) {
      patron = 'Las potencias son periódicas de periodo ' + periodo + ': $A^{' + periodo + '} = I$, ' +
        'luego $A^{n}$ solo depende del resto de dividir $n$ entre ' + periodo + '.';
    } else if (periodo !== null) {
      patron = 'Las potencias se repiten a partir de $A^{' + desde + '}$ con periodo ' + periodo +
        ': $A^{n+' + periodo + '} = A^{n}$ para $n \\ge ' + desde + '$.';
    }
    return {
      pot: pot, patron: patron, periodo: periodo, desde: desde,
      nilpotente: nilpotente, indice: indice, idempotente: idempotente,
      identidadEn: periodo !== null && desde === 0 ? periodo : null
    };
  }

  /* ==================================================================
     10 · combinaciones lineales de filas, rango y operaciones elementales
     ================================================================== */
  /* Solución particular exacta de un sistema (matriz ampliada, 1 columna
     de términos independientes). Las incógnitas libres se ponen a 0.     */
  function solParticular(Amp) {
    var G = gauss(Amp, { aug: 1, jordan: true });
    var A = G.fin, n = A.c - 1;
    if (G.filaIncompatible >= 0) return { compatible: false, sol: null };
    var sol = [], i;
    for (i = 0; i < n; i++) sol.push(F0());
    G.pivotes.forEach(function (p) {
      var fi = p[0], co = p[1];
      var v = A.a[fi][n], j;
      for (j = co + 1; j < n; j++) v = v.menos(A.a[fi][j].por(sol[j]));
      sol[co] = v.entre(A.a[fi][co]);
    });
    return { compatible: true, sol: sol, rango: G.rango, gauss: G };
  }
  function filaTex(coefs, indices) {
    var s = '', primero = true, i;
    for (i = 0; i < coefs.length; i++) {
      if (coefs[i] === null || coefs[i] === undefined || cero(coefs[i])) continue;
      s += coefVarTex(coefs[i], 'F_{' + (indices[i] + 1) + '}', primero);
      primero = false;
    }
    return primero ? '0' : s;
  }
  /* ¿Es la fila i combinación lineal de las demás? */
  function combFilas(A, i) {
    A = mat(A);
    var idx = Number(i);
    if (!isFinite(idx) || idx !== Math.round(idx) || idx < 0 || idx >= A.f) {
      throw Error('La fila que quieres estudiar debe indicarse con su número contando desde 0: ' +
        'de 0 a ' + (A.f - 1) + ' (la matriz tiene ' + A.f + ' filas). Has escrito «' + i + '».');
    }
    var otras = [], k;
    for (k = 0; k < A.f; k++) if (k !== idx) otras.push(k);
    var coef = [], res;
    for (k = 0; k < A.f; k++) coef.push(null);
    if (!otras.length) {
      var nulaF = A.a[idx].every(function (x) { return cero(x); });
      return {
        dependiente: nulaF, coef: coef,
        tex: nulaF ? 'F_{1} = 0' : '',
        explicacion: nulaF
          ? 'La matriz tiene una sola fila y es la fila nula: es la combinación lineal vacía, de coeficientes todos nulos.'
          : 'La matriz tiene una sola fila y no es nula: no hay otras filas con las que combinarla, así que es independiente.'
      };
    }
    /* Sistema: sum_r x_r * F_r = F_idx (una ecuación por columna) */
    var fil = [], c2, r2;
    for (c2 = 0; c2 < A.c; c2++) {
      var fila = [];
      for (r2 = 0; r2 < otras.length; r2++) fila.push(A.a[otras[r2]][c2]);
      fila.push(A.a[idx][c2]);
      fil.push(fila);
    }
    res = solParticular(new Mat(fil));
    if (!res.compatible) {
      return {
        dependiente: false, coef: coef, tex: '',
        explicacion: 'La fila $F_{' + (idx + 1) + '}$ <strong>no</strong> es combinación lineal de las demás: ' +
          'el sistema que plantea $x_1F_1 + \\dots = F_{' + (idx + 1) + '}$ es incompatible, ' +
          'no hay coeficientes que funcionen. Esa fila aporta información nueva.'
      };
    }
    for (k = 0; k < otras.length; k++) coef[otras[k]] = res.sol[k];
    var tx = 'F_{' + (idx + 1) + '} = ' + filaTex(coef, coef.map(function (_, q) { return q; }));
    return {
      dependiente: true, coef: coef, tex: tx,
      explicacion: 'Sí: la fila $F_{' + (idx + 1) + '}$ es combinación lineal de las otras, con ' +
        '$' + tx + '$. Al no aportar información nueva, se puede eliminar sin que cambie el rango.'
    };
  }
  /* Filas independientes (por orden) y dependencias de las demás */
  function filasIndependientes(A) {
    A = mat(A);
    var base = [], i, j;
    for (i = 0; i < A.f; i++) {
      var prueba = base.concat([i]);
      var sub = prueba.map(function (k) { return A.a[k]; });
      if (rango(new Mat(sub)) === prueba.length) base = prueba;
    }
    var deps = [];
    for (i = 0; i < A.f; i++) {
      if (base.indexOf(i) >= 0) continue;
      var fil = [], c2, r2;
      for (c2 = 0; c2 < A.c; c2++) {
        var fila = [];
        for (r2 = 0; r2 < base.length; r2++) fila.push(A.a[base[r2]][c2]);
        fila.push(A.a[i][c2]);
        fil.push(fila);
      }
      var res = solParticular(new Mat(fil));
      if (res.compatible) {
        deps.push({
          fila: i, coef: res.sol, base: base.slice(),
          tex: 'F_{' + (i + 1) + '} = ' + filaTex(res.sol, base)
        });
      }
    }
    return { indices: base, rango: base.length, dependencias: deps };
  }
  function rangoPasos(M_) {
    var A = mat(M_);
    var G = gauss(A, { aug: 0 });
    var nulas = [], i, j;
    for (i = 0; i < G.fin.f; i++) {
      var todo = true;
      for (j = 0; j < G.fin.c; j++) if (!cero(G.fin.a[i][j])) { todo = false; break; }
      if (todo) nulas.push(i);
    }
    return {
      pasos: G.pasos, fin: G.fin, pivotes: G.pivotes, rango: G.rango,
      filasNulas: nulas,
      cota: Math.min(A.f, A.c),
      resumen: 'Al escalonar quedan ' + G.rango + ' fila' + (G.rango === 1 ? '' : 's') +
        ' no nula' + (G.rango === 1 ? '' : 's') + ' y ' + nulas.length + ' fila' +
        (nulas.length === 1 ? '' : 's') + ' nula' + (nulas.length === 1 ? '' : 's') +
        ', luego $\\operatorname{rg}(A) = ' + G.rango + '$.'
    };
  }
  /* Una operación elemental de filas, validada.
     op = {tipo:'cambiar'|'multiplicar'|'sumar', i, j, k} (i, j desde 0)  */
  function opElemental(M_, op) {
    var A = mat(M_).copia();
    op = op || {};
    var tipo = String(op.tipo || '').toLowerCase();
    var i = Number(op.i), j = Number(op.j);
    function malo(msg) { return { M: A, tex: '', valida: false, error: msg }; }
    function existe(x) {
      return isFinite(x) && x === Math.round(x) && x >= 0 && x < A.f;
    }
    /* Los índices i, j son internos (desde 0), pero el alumno los ha
       escrito desde 1: en los avisos SIEMPRE se numera desde 1, igual
       que en la ayuda de los applets. */
    function humano(x) {
      var v = Number(x);
      return isFinite(v) ? String(Math.round(v) + 1) : String(x);
    }
    function noExiste(cual, x) {
      return cual + ' (' + humano(x) + ') no existe: esta matriz tiene ' + A.f +
        ' fila' + (A.f === 1 ? '' : 's') + ', numeradas de 1 a ' + A.f + '.';
    }
    if (['cambiar', 'multiplicar', 'sumar'].indexOf(tipo) < 0) {
      return malo('No conozco la operación «' + op.tipo + '». Las operaciones elementales de filas son ' +
        'tres: «cambiar» dos filas de sitio, «multiplicar» una fila por un número distinto de 0 y ' +
        '«sumar» a una fila un múltiplo de otra.');
    }
    if (!existe(i)) {
      return malo(noExiste('La fila Fi elegida', op.i));
    }
    var k, c2;
    if (tipo === 'cambiar') {
      if (!existe(j)) return malo(noExiste('La segunda fila Fj elegida', op.j));
      if (i === j) return malo('Para cambiar dos filas de sitio tienen que ser dos filas distintas.');
      var t = A.a[i]; A.a[i] = A.a[j]; A.a[j] = t;
      return {
        M: A, valida: true, error: null,
        tex: 'F_{' + (i + 1) + '} \\leftrightarrow F_{' + (j + 1) + '}',
        desc: 'Intercambiamos las filas ' + (i + 1) + ' y ' + (j + 1) + '. El rango no cambia.'
      };
    }
    if (tipo === 'multiplicar') {
      try { k = F(op.k); } catch (e) { return malo(e.message); }
      if (cero(k)) {
        return malo('Multiplicar una fila por 0 NO es una operación elemental: la fila se convierte en ' +
          'la fila nula y el rango puede bajar. El número por el que multiplicas debe ser distinto de 0.');
      }
      for (c2 = 0; c2 < A.c; c2++) A.a[i][c2] = A.a[i][c2].por(k);
      return {
        M: A, valida: true, error: null,
        tex: 'F_{' + (i + 1) + '} \\to ' + (igualF(k, F1()) ? '' : fTex(k)) + 'F_{' + (i + 1) + '}',
        desc: 'Multiplicamos la fila ' + (i + 1) + ' por $' + fTex(k) + ' \\ne 0$. El rango no cambia.'
      };
    }
    if (!existe(j)) return malo(noExiste('La fila Fj que se suma', op.j));
    if (i === j) {
      return malo('No puedes sumar a la fila ' + (i + 1) + ' un múltiplo de ella misma: elige otra fila. ' +
        'La operación válida es $F_i \\to F_i + kF_j$ con $i \\ne j$.');
    }
    try { k = F(op.k === undefined ? 1 : op.k); } catch (e) { return malo(e.message); }
    for (c2 = 0; c2 < A.c; c2++) A.a[i][c2] = A.a[i][c2].mas(k.por(A.a[j][c2]));
    var sgn = negat(k) ? ' - ' : ' + ';
    var ab = absF(k);
    var cuerpo = (ab.n === 1n && ab.d === 1n) ? '' : fTex(ab);
    return {
      M: A, valida: true, error: null,
      tex: 'F_{' + (i + 1) + '} \\to F_{' + (i + 1) + '}' + sgn + cuerpo + 'F_{' + (j + 1) + '}',
      desc: 'A la fila ' + (i + 1) + ' le sumamos ' + (cero(k) ? '0 veces' : '$' + fTex(k) + '$ veces') +
        ' la fila ' + (j + 1) + '. El rango no cambia.'
    };
  }

  /* ==================================================================
     11 · matrices con un parámetro
     ================================================================== */
  var PCERO = function () { return [F0()]; };
  function pEsC(p) { return S.pEsCero(p); }
  function pDetPoly(P, n) {                       /* determinante de una matriz de polinomios */
    if (n === 1) return S.pCopia(P[0][0]);
    if (n === 2) return S.pResta(S.pMult(P[0][0], P[1][1]), S.pMult(P[0][1], P[1][0]));
    var tot = PCERO(), j;
    for (j = 0; j < n; j++) {
      if (pEsC(P[0][j])) continue;
      var sub = [], i, q;
      for (i = 1; i < n; i++) {
        var fila = [];
        for (q = 0; q < n; q++) { if (q === j) continue; fila.push(P[i][q]); }
        sub.push(fila);
      }
      var t = S.pMult(P[0][j], pDetPoly(sub, n - 1));
      tot = (j % 2 === 0) ? S.pSuma(tot, t) : S.pResta(tot, t);
    }
    return tot;
  }
  function parseMatParam(txt, letra) {
    letra = String(letra || 'k').toLowerCase();
    var filas = troceaFilas(txt, 'Escribe cada fila en una línea o separada por «;»: ' +
      '1 ' + letra + ' 0; ' + letra + ' 1 2. Los elementos pueden ser números o expresiones ' +
      'en ' + letra + ' (por ejemplo ' + letra + '-1, 2' + letra + ', ' + letra + '^2).');
    var c = exigeRectangular(filas);
    var A = [], i, j;
    for (i = 0; i < filas.length; i++) {
      var fila = [];
      for (j = 0; j < filas[i].length; j++) {
        var t = filas[i][j].replace(/^\+/, '');
        try {
          fila.push(S.pRecorta(S.parsePol(t, letra)));
        } catch (e) {
          throw Error('No entiendo el elemento «' + filas[i][j] + '» (fila ' + (i + 1) + ', columna ' +
            (j + 1) + '). Puede ser un número (3, -2, 1/2) o una expresión en ' + letra +
            ' como ' + letra + ', ' + letra + '-1, 2' + letra + '+3 o ' + letra + '^2.');
        }
      }
      A.push(fila);
    }
    return { A: A, f: A.length, c: c, letra: letra };
  }
  function polMat(P) {                             /* admite {A,f,c}, Mat o array */
    if (P && P.A) return { A: P.A, f: P.f, c: P.c, letra: P.letra || 'k' };
    if (P && P.a && P.f !== undefined) {
      return {
        A: P.a.map(function (fila) { return fila.map(function (x) { return [x]; }); }),
        f: P.f, c: P.c, letra: 'k'
      };
    }
    if (typeof P === 'string') return parseMatParam(P, 'k');
    throw Error('Para estudiar el rango con un parámetro pásame la matriz leída con ' +
      'S.parseMatParam("1 k; k 1", "k").');
  }
  function evalMatParam(P, valor) {
    var Q = polMat(P), v = F(valor === undefined ? 0 : valor);
    var a = Q.A.map(function (fila) {
      return fila.map(function (p) { return S.pEval(p, v).valor; });
    });
    return new Mat(a);
  }
  function combina(n, r) {                         /* subconjuntos de tamaño r de 0..n-1 */
    var out = [];
    (function rec(inicio, acc) {
      if (acc.length === r) { out.push(acc.slice()); return; }
      var i;
      for (i = inicio; i < n; i++) { acc.push(i); rec(i + 1, acc); acc.pop(); }
    })(0, []);
    return out;
  }
  function rangoParam(A, letra) {
    var Q = polMat(A);
    if (letra) Q.letra = String(letra).toLowerCase();
    var L = Q.letra;
    var maxr = Math.min(Q.f, Q.c);
    /* 1 · rango genérico: se prueban valores «de prueba» y se toma el mayor */
    var prueba = [0, 1, -1, 2, -2, 3, 5, 7, 11, 13, 17], generico = 0, i;
    for (i = 0; i < prueba.length; i++) {
      var rg = rango(evalMatParam(Q, new Frac(prueba[i])));
      if (rg > generico) generico = rg;
      if (generico === maxr) break;
    }
    /* 2 · candidatos: raíces racionales de los menores de orden = rango genérico */
    var cands = [], vistos = {};
    if (generico > 0) {
      var filas = combina(Q.f, generico), cols = combina(Q.c, generico), a, b;
      for (a = 0; a < filas.length; a++) {
        for (b = 0; b < cols.length; b++) {
          var sub = filas[a].map(function (fi) {
            return cols[b].map(function (cj) { return Q.A[fi][cj]; });
          });
          var dp = S.pRecorta(pDetPoly(sub, generico));
          if (pEsC(dp)) continue;
          if (S.pGrado(dp) === 0) { cands = []; vistos = {}; a = filas.length; break; }
          var rr = S.raicesRacionales(dp).raices;
          rr.forEach(function (z) {
            var kx = z.raiz.txt();
            if (!vistos[kx]) { vistos[kx] = 1; cands.push(z.raiz); }
          });
        }
      }
    }
    /* 3 · los candidatos que de verdad bajan el rango son los valores críticos */
    var criticos = [];
    cands.sort(function (x, y) { return x.val() - y.val(); });
    cands.forEach(function (v) {
      var rg = rango(evalMatParam(Q, v));
      if (rg < generico) {
        criticos.push({
          valor: v, tex: L + ' = ' + fTex(v), rango: rg,
          matriz: evalMatParam(Q, v)
        });
      }
    });
    /* 4 · tabla de casos */
    var tabla = [], cond;
    criticos.forEach(function (cr) {
      tabla.push({
        caso: '$' + cr.tex + '$',
        condicion: cr.tex,
        rango: cr.rango,
        explicacion: 'Al sustituir $' + cr.tex + '$ se anulan todos los menores de orden ' + generico +
          ', y queda $\\operatorname{rg}(A) = ' + cr.rango + '$: alguna fila pasa a ser combinación ' +
          'lineal de las otras.'
      });
    });
    if (criticos.length) {
      cond = criticos.map(function (cr) { return L + ' \\ne ' + fTex(cr.valor); }).join(' \\text{ y } ');
    } else {
      cond = L + ' \\in \\mathbb{R}';
    }
    tabla.push({
      caso: criticos.length ? '$' + cond + '$' : 'para cualquier valor de $' + L + '$',
      condicion: cond,
      rango: generico,
      explicacion: 'En el caso general hay un menor de orden ' + generico + ' distinto de cero, ' +
        'así que el rango es el máximo posible aquí: $\\operatorname{rg}(A) = ' + generico + '$.'
    });
    var tex = criticos.length
      ? '\\operatorname{rg}(A) = ' + generico + ' \\text{ si } ' + cond + '; \\quad ' +
        criticos.map(function (cr) {
          return '\\operatorname{rg}(A) = ' + cr.rango + ' \\text{ si } ' + cr.tex;
        }).join('; \\quad ')
      : '\\operatorname{rg}(A) = ' + generico + ' \\text{ para todo } ' + L;
    return {
      criticos: criticos, generico: generico, tabla: tabla, tex: tex,
      letra: L, f: Q.f, c: Q.c, maximo: maxr,
      matTex: matParamTex(Q)
    };
  }
  function matParamTex(P) {
    var Q = polMat(P);
    var colspec = '', j, i;
    for (j = 0; j < Q.c; j++) colspec += 'c';
    var filas = [];
    for (i = 0; i < Q.f; i++) {
      var cel = [];
      for (j = 0; j < Q.c; j++) cel.push(S.pTex(Q.A[i][j], Q.letra));
      filas.push(cel.join(' & '));
    }
    return '\\left(\\begin{array}{' + colspec + '}' + filas.join(' \\\\ ') + '\\end{array}\\right)';
  }

  /* ==================================================================
     12 · matriz inversa
     ================================================================== */
  function inversa(A) {
    var B = mat(A);
    if (B.f !== B.c) {
      return {
        existe: false, inv: null, rango: rango(B), orden: null,
        motivo: 'Solo las matrices cuadradas pueden tener inversa, y esta es de ' + dimTxt(B) +
          '. La inversa debe cumplir $A\\cdot A^{-1} = A^{-1}\\cdot A = I$, y eso exige el mismo ' +
          'número de filas que de columnas.'
      };
    }
    var n = B.f, r = rango(B);
    if (r < n) {
      return {
        existe: false, inv: null, rango: r, orden: n, det: det(B),
        motivo: 'La matriz es singular: $\\det(A) = 0$ y $\\operatorname{rg}(A) = ' + r + ' < ' + n +
          '$. Sus filas son linealmente dependientes, así que no existe ninguna matriz $X$ con ' +
          '$A\\cdot X = I$: no tiene inversa.'
      };
    }
    var G = gauss(matPegada(B, matIdent(n)), { aug: n, jordan: true });
    return {
      existe: true, inv: bloqueDerecho(G.fin, n), rango: r, orden: n,
      det: det(B), motivo: null
    };
  }
  function matPegada(A, B) {                        /* (A | B) por columnas */
    A = mat(A); B = mat(B);
    if (A.f !== B.f) {
      throw Error('Para escribir la matriz ampliada $(A\\mid B)$ las dos matrices deben tener el ' +
        'mismo número de filas: $A$ tiene ' + A.f + ' y $B$ tiene ' + B.f + '.');
    }
    var a = [], i, j;
    for (i = 0; i < A.f; i++) {
      var fila = [];
      for (j = 0; j < A.c; j++) fila.push(A.a[i][j]);
      for (j = 0; j < B.c; j++) fila.push(B.a[i][j]);
      a.push(fila);
    }
    return new Mat(a);
  }
  function bloqueDerecho(M_, k) {
    var A = mat(M_), a = [], i, j;
    for (i = 0; i < A.f; i++) {
      var fila = [];
      for (j = A.c - k; j < A.c; j++) fila.push(A.a[i][j]);
      a.push(fila);
    }
    return new Mat(a);
  }
  function bloqueIzquierdo(M_, k) {
    var A = mat(M_), a = [], i, j;
    for (i = 0; i < A.f; i++) {
      var fila = [];
      for (j = 0; j < k; j++) fila.push(A.a[i][j]);
      a.push(fila);
    }
    return new Mat(a);
  }
  /* Gauss-Jordan sobre (A | I) con todos los pasos */
  function inversaPasos(A) {
    var B = exigeCuadrada(A, 'el cálculo de la inversa');
    var n = B.f;
    var amp = matPegada(B, matIdent(n));
    var G = gauss(amp, { aug: n, jordan: true });
    var izq = bloqueIzquierdo(G.fin, n);
    var existe = izq.igual(matIdent(n));
    var pasos = G.pasos.map(function (p, idx) {
      return {
        M: p.M, op: p.op,
        desc: idx === 0
          ? 'Escribimos la matriz ampliada $(A\\mid I)$: a la izquierda $A$ y a la derecha la identidad.'
          : p.desc
      };
    });
    if (!existe) {
      return {
        existe: false, inv: null, pasos: pasos, comprobacion: null,
        rango: rango(B), orden: n,
        motivo: 'Durante el proceso ha aparecido una fila de ceros en la parte izquierda: es ' +
          'imposible llegar a $(I\\mid A^{-1})$. La matriz es singular ($\\det(A) = 0$) y no tiene inversa.'
      };
    }
    var inv = bloqueDerecho(G.fin, n);
    return {
      existe: true, inv: inv, pasos: pasos, rango: n, orden: n, motivo: null,
      comprobacion: { AI: matPor(B, inv), IA: matPor(inv, B), correcta: matPor(B, inv).igual(matIdent(n)) }
    };
  }
  /* Fórmula rápida de orden 2 con la adjunta */
  function inversa2x2(A) {
    var B = mat(A);
    if (B.f !== 2 || B.c !== 2) {
      throw Error('Esta fórmula rápida vale SOLO para matrices de orden 2, y la tuya es de ' +
        dimTxt(B) + '. Para órdenes mayores usa Gauss-Jordan (S.inversaPasos).');
    }
    var a = B.a[0][0], b = B.a[0][1], c = B.a[1][0], d = B.a[1][1];
    var D = a.por(d).menos(b.por(c));
    if (cero(D)) {
      return {
        existe: false, det: D, inv: null,
        tex: '\\det(A) = ' + prodTex([a, d]) + ' - ' + prodTex([b, c]) + ' = 0',
        motivo: 'El determinante $ad - bc$ vale $0$, y la fórmula pide dividir entre él: ' +
          'la matriz es singular y no tiene inversa.'
      };
    }
    var adj = new Mat([[d, b.opuesto()], [c.opuesto(), a]]);
    var inv = matEscalar(adj, F1().entre(D));
    return {
      existe: true, det: D, inv: inv, adjunta: adj, motivo: null,
      tex: 'A^{-1} = \\dfrac{1}{ad - bc}\\left(\\begin{array}{cc} d & -b \\\\ -c & a \\end{array}\\right)' +
        ' = \\dfrac{1}{' + fTex(D) + '}' + matTex(adj) + ' = ' + matTex(inv)
    };
  }

  /* ==================================================================
     13 · ecuaciones matriciales
     ================================================================== */
  var TIPOS_ECU = ['AX=B', 'XA=B', 'AX+B=C', 'XA+B=C', 'AXB=C', 'AX=B+X'];
  var AVISO_DIVISION = 'Recuerda que <strong>las matrices no se dividen</strong>: no existe ' +
    '«$B/A$». Lo único que se puede hacer es multiplicar por la inversa $A^{-1}$, y como el ' +
    'producto de matrices no es conmutativo hay que hacerlo <em>por el mismo lado</em> en los dos miembros.';

  function ecuMatricial(tipo, A, B, C) {
    tipo = String(tipo || '').replace(/\s+/g, '').toUpperCase();
    if (TIPOS_ECU.indexOf(tipo) < 0) {
      throw Error('No conozco la ecuación «' + tipo + '». Los tipos disponibles son: ' +
        TIPOS_ECU.join(', ') + '. Escríbelo tal cual, por ejemplo "AX+B=C".');
    }
    var MA = mat(A, 'la matriz A');
    var MB = B === undefined || B === null ? null : mat(B, 'la matriz B');
    var MC = C === undefined || C === null ? null : mat(C, 'la matriz C');
    var pasos = [], lado = 'izquierda';
    function no(motivo) {
      return { ok: false, X: null, tipo: tipo, pasos: pasos, lado: lado, motivo: motivo, comprobacion: null };
    }
    function nota(desc, tx) { pasos.push({ desc: desc, tex: tx || '' }); }

    if (!MB) return no('Falta la matriz $B$ de la ecuación.');
    if ((tipo === 'AX+B=C' || tipo === 'XA+B=C' || tipo === 'AXB=C') && !MC) {
      return no('Esta ecuación necesita también la matriz $C$ del segundo miembro.');
    }
    var X, inv, invB, D, IA;
    nota('Escribimos la ecuación con los datos.', ecuTexto(tipo, MA, MB, MC));
    nota('El objetivo es <strong>despejar $X$</strong>. ' + AVISO_DIVISION);

    if (tipo === 'AX=B' || tipo === 'AX+B=C') {
      lado = 'izquierda';
      if (tipo === 'AX+B=C') {
        if (MB.f !== MC.f || MB.c !== MC.c) {
          return no('Para pasar $B$ al otro miembro, $B$ y $C$ deben tener la misma dimensión: ' +
            'ahora son ' + dimTxt(MB) + ' y ' + dimTxt(MC) + '.');
        }
        D = matResta(MC, MB);
        nota('Primero pasamos $B$ al segundo miembro <em>restándola</em> en los dos lados: ' +
          'la suma de matrices sí se comporta como la de números.',
          'A X = C - B = ' + matTex(D));
      } else {
        D = MB;
      }
      inv = inversa(MA);
      if (!inv.existe) return no(inv.motivo);
      if (MA.c !== D.f) {
        return no('Las dimensiones no encajan: $A$ es ' + dimTxt(MA) + ' y el segundo miembro ' +
          dimTxt(D) + '. En $AX = B$ hace falta que $A$ tenga tantas columnas como filas tiene $X$, ' +
          'y $B$ debe tener tantas filas como $A$.');
      }
      nota('$X$ está multiplicada por $A$ <strong>por la izquierda</strong>, así que multiplicamos ' +
        'los dos miembros por $A^{-1}$ <strong>por la izquierda</strong>: si lo hiciéramos por la ' +
        'derecha, $A^{-1}$ no llegaría a tocar a $A$ y no se simplificaría nada.',
        'A^{-1}\\,(A X) = A^{-1}\\,' + (tipo === 'AX=B' ? 'B' : '(C-B)'));
      nota('Por la asociatividad, $A^{-1}A = I$ y $IX = X$.',
        '(A^{-1}A)X = I X = X');
      nota('Calculamos la inversa por Gauss-Jordan.', 'A^{-1} = ' + matTex(inv.inv));
      X = matPor(inv.inv, D);
      nota('Y hacemos el producto, cuidando el orden de los factores.',
        'X = A^{-1}\\,' + (tipo === 'AX=B' ? 'B' : '(C-B)') + ' = ' + matTex(inv.inv) + matTex(D) + ' = ' + matTex(X));
    } else if (tipo === 'XA=B' || tipo === 'XA+B=C') {
      lado = 'derecha';
      if (tipo === 'XA+B=C') {
        if (MB.f !== MC.f || MB.c !== MC.c) {
          return no('Para pasar $B$ al otro miembro, $B$ y $C$ deben tener la misma dimensión: ' +
            'ahora son ' + dimTxt(MB) + ' y ' + dimTxt(MC) + '.');
        }
        D = matResta(MC, MB);
        nota('Pasamos $B$ al segundo miembro restándola en los dos lados.',
          'X A = C - B = ' + matTex(D));
      } else {
        D = MB;
      }
      inv = inversa(MA);
      if (!inv.existe) return no(inv.motivo);
      if (D.c !== MA.f) {
        return no('Las dimensiones no encajan: el segundo miembro es ' + dimTxt(D) + ' y $A$ es ' +
          dimTxt(MA) + '. En $XA = B$ hace falta que $B$ tenga tantas columnas como filas tiene $A$.');
      }
      nota('Ahora $X$ está multiplicada por $A$ <strong>por la derecha</strong>, así que hay que ' +
        'multiplicar los dos miembros por $A^{-1}$ <strong>por la derecha</strong>. Multiplicar por ' +
        'la izquierda sería un error clásico: $A^{-1}XA$ no se simplifica.',
        '(X A)\\,A^{-1} = ' + (tipo === 'XA=B' ? 'B' : '(C-B)') + '\\,A^{-1}');
      nota('Por la asociatividad, $AA^{-1} = I$ y $XI = X$.', 'X(AA^{-1}) = X I = X');
      nota('Calculamos la inversa por Gauss-Jordan.', 'A^{-1} = ' + matTex(inv.inv));
      X = matPor(D, inv.inv);
      nota('Y multiplicamos, poniendo $A^{-1}$ a la derecha.',
        'X = ' + (tipo === 'XA=B' ? 'B' : '(C-B)') + '\\,A^{-1} = ' + matTex(D) + matTex(inv.inv) + ' = ' + matTex(X));
    } else if (tipo === 'AXB=C') {
      lado = 'ambos';
      inv = inversa(MA); invB = inversa(MB);
      if (!inv.existe) return no('No se puede despejar: ' + inv.motivo);
      if (!invB.existe) return no('No se puede despejar: la matriz $B$ tampoco es invertible. ' + invB.motivo);
      if (MA.c !== MC.f || MB.f !== MC.c) {
        return no('Las dimensiones no encajan para $AXB = C$: con $A$ de ' + dimTxt(MA) + ', $B$ de ' +
          dimTxt(MB) + ' y $C$ de ' + dimTxt(MC) + ' el producto $AXB$ no puede dar $C$.');
      }
      nota('$X$ tiene un factor a cada lado, así que hacen falta <strong>dos</strong> ' +
        'multiplicaciones: por $A^{-1}$ por la izquierda y por $B^{-1}$ por la derecha.',
        'A^{-1}(A X B)B^{-1} = A^{-1} C B^{-1}');
      nota('Los factores se van simplificando de dentro hacia fuera: $A^{-1}A = I$ y $BB^{-1} = I$.',
        '(A^{-1}A)X(BB^{-1}) = I X I = X');
      nota('Calculamos las dos inversas.', 'A^{-1} = ' + matTex(inv.inv) + ' \\qquad B^{-1} = ' + matTex(invB.inv));
      X = matPor(matPor(inv.inv, MC), invB.inv);
      nota('Y multiplicamos en el orden correcto: $A^{-1}$ delante y $B^{-1}$ detrás.',
        'X = A^{-1} C B^{-1} = ' + matTex(X));
    } else {                                        /* AX = B + X */
      lado = 'izquierda';
      if (MA.f !== MA.c) return no('En $AX = B + X$ la matriz $A$ debe ser cuadrada, y es ' + dimTxt(MA) + '.');
      IA = matResta(MA, matIdent(MA.f));
      nota('Aquí la incógnita aparece en los dos miembros. Agrupamos: pasamos $X$ a la izquierda ' +
        'y sacamos $X$ como factor común <strong>por la derecha</strong>, que es el lado por el que ' +
        'está multiplicada.',
        'A X - X = B \\;\\Rightarrow\\; (A - I)X = B');
      nota('Ojo: el factor común no es $A - 1$ sino $A - I$; el «uno» de las matrices es la ' +
        'identidad, porque $X = IX$.', 'A - I = ' + matTex(IA));
      inv = inversa(IA);
      if (!inv.existe) {
        return no('La matriz $A - I$ es singular ($\\det(A-I) = 0$), así que no se puede despejar $X$ ' +
          'multiplicando por su inversa: la ecuación no tiene solución única.');
      }
      nota('Multiplicamos por $(A-I)^{-1}$ por la izquierda.', '(A-I)^{-1}(A-I)X = (A-I)^{-1}B');
      nota('Calculamos la inversa.', '(A-I)^{-1} = ' + matTex(inv.inv));
      X = matPor(inv.inv, MB);
      nota('Y obtenemos la solución.', 'X = (A-I)^{-1}B = ' + matTex(X));
    }

    var comp = compruebaEcu(tipo, MA, MB, MC, X);
    nota('<strong>Comprobación:</strong> sustituimos la $X$ obtenida en la ecuación de partida.', comp.tex);
    return {
      ok: true, X: X, tipo: tipo, pasos: pasos, lado: lado, motivo: null,
      comprobacion: comp
    };
  }
  function ecuTexto(tipo, A, B, C) {
    var t = {
      'AX=B': 'A X = B', 'XA=B': 'X A = B', 'AX+B=C': 'A X + B = C',
      'XA+B=C': 'X A + B = C', 'AXB=C': 'A X B = C', 'AX=B+X': 'A X = B + X'
    }[tipo];
    var s = t + ', \\quad A = ' + matTex(A) + ',\\; B = ' + matTex(B);
    if (C) s += ',\\; C = ' + matTex(C);
    return s;
  }
  function compruebaEcu(tipo, A, B, C, X) {
    var izq, der, tx;
    try {
      if (tipo === 'AX=B') { izq = matPor(A, X); der = B; tx = 'A X = ' + matTex(izq) + ' = B'; }
      else if (tipo === 'XA=B') { izq = matPor(X, A); der = B; tx = 'X A = ' + matTex(izq) + ' = B'; }
      else if (tipo === 'AX+B=C') { izq = matSuma(matPor(A, X), B); der = C; tx = 'A X + B = ' + matTex(izq) + ' = C'; }
      else if (tipo === 'XA+B=C') { izq = matSuma(matPor(X, A), B); der = C; tx = 'X A + B = ' + matTex(izq) + ' = C'; }
      else if (tipo === 'AXB=C') { izq = matPor(matPor(A, X), B); der = C; tx = 'A X B = ' + matTex(izq) + ' = C'; }
      else { izq = matPor(A, X); der = matSuma(B, X); tx = 'A X = ' + matTex(izq) + ' = B + X = ' + matTex(der); }
    } catch (e) {
      return { tex: '', correcta: false, motivo: e.message };
    }
    var ok2 = izq.igual(der);
    return {
      tex: tx + (ok2 ? ' \\quad \\checkmark' : ''), correcta: ok2,
      izquierda: izq, derecha: der,
      motivo: ok2 ? null : 'Al sustituir no se obtiene el segundo miembro: revisa el orden de los productos.'
    };
  }

  /* Entrenador de despeje: preguntas de opción múltiple por tipo */
  function pasoDespeje(tipo) {
    tipo = String(tipo || '').replace(/\s+/g, '').toUpperCase();
    if (TIPOS_ECU.indexOf(tipo) < 0) {
      throw Error('No hay preguntas para «' + tipo + '». Elige uno de estos tipos: ' + TIPOS_ECU.join(', ') + '.');
    }
    var NO_DIV = 'Las matrices no se dividen: no existe $B/A$. Solo se puede multiplicar por $A^{-1}$.';
    var base = {
      'AX=B': [
        { enunciado: 'En $AX = B$ (con $A$ regular), ¿cuál es el primer paso para despejar $X$?',
          opciones: ['Dividir los dos miembros entre $A$', 'Multiplicar los dos miembros por $A^{-1}$ por la izquierda',
            'Multiplicar los dos miembros por $A^{-1}$ por la derecha', 'Restar $A$ en los dos miembros'],
          correcta: 1,
          porque: NO_DIV + ' Como $A$ multiplica a $X$ por la izquierda, hay que multiplicar por $A^{-1}$ por la izquierda: $A^{-1}AX = A^{-1}B$.' },
        { enunciado: '¿A qué se reduce $A^{-1}(AX)$?',
          opciones: ['$X$', '$A^{-1}X$', '$I$', 'No se puede simplificar'],
          correcta: 0,
          porque: 'Por la asociatividad, $A^{-1}(AX) = (A^{-1}A)X = IX = X$.' },
        { enunciado: 'Entonces la solución es…',
          opciones: ['$X = BA^{-1}$', '$X = A^{-1}B$', '$X = \\dfrac{B}{A}$', '$X = B - A$'],
          correcta: 1,
          porque: 'El orden importa: $A^{-1}$ queda delante de $B$, porque hemos multiplicado por la izquierda. En general $A^{-1}B \\ne BA^{-1}$.' }
      ],
      'XA=B': [
        { enunciado: 'En $XA = B$ (con $A$ regular), ¿por dónde se multiplica por $A^{-1}$?',
          opciones: ['Por la izquierda', 'Por la derecha', 'Da igual, el producto es conmutativo', 'Se divide entre $A$'],
          correcta: 1,
          porque: 'Ahora $A$ está a la derecha de $X$, así que hay que multiplicar por $A^{-1}$ por la derecha: $XAA^{-1} = BA^{-1}$. El producto de matrices NO es conmutativo.' },
        { enunciado: '¿Qué queda al simplificar $X(AA^{-1})$?',
          opciones: ['$X$', '$A^{-1}X$', '$XA$', '$I$'],
          correcta: 0,
          porque: '$AA^{-1} = I$ y $XI = X$.' },
        { enunciado: 'La solución es…',
          opciones: ['$X = A^{-1}B$', '$X = BA^{-1}$', '$X = B/A$', '$X = AB^{-1}$'],
          correcta: 1,
          porque: 'Como se ha multiplicado por la derecha, $A^{-1}$ queda detrás de $B$: $X = BA^{-1}$.' }
      ],
      'AX+B=C': [
        { enunciado: 'En $AX + B = C$, ¿qué se hace primero?',
          opciones: ['Multiplicar por $A^{-1}$', 'Restar $B$ en los dos miembros', 'Dividir entre $A$', 'Sumar $I$'],
          correcta: 1,
          porque: 'La suma de matrices se comporta como la de números: se pasa $B$ al otro miembro restando, y queda $AX = C - B$.' },
        { enunciado: 'Después, en $AX = C - B$, se multiplica por $A^{-1}$…',
          opciones: ['por la izquierda', 'por la derecha', 'por los dos lados a la vez', 'no hace falta'],
          correcta: 0,
          porque: '$A$ multiplica a $X$ por la izquierda, así que $A^{-1}$ tiene que entrar por la izquierda: $X = A^{-1}(C-B)$.' },
        { enunciado: '¿Es correcto escribir $X = (C-B)A^{-1}$?',
          opciones: ['Sí, es lo mismo', 'No: el producto no es conmutativo', 'Solo si $A$ es simétrica', 'Solo si $B = 0$'],
          correcta: 1,
          porque: 'En general $A^{-1}(C-B) \\ne (C-B)A^{-1}$. El lado por el que se multiplica forma parte de la respuesta.' }
      ],
      'XA+B=C': [
        { enunciado: 'En $XA + B = C$, ¿cuál es la secuencia correcta?',
          opciones: ['Restar $B$ y multiplicar por $A^{-1}$ por la derecha',
            'Restar $B$ y multiplicar por $A^{-1}$ por la izquierda',
            'Dividir entre $A$ y restar $B$', 'Multiplicar por $A^{-1}$ y luego sumar $B$'],
          correcta: 0,
          porque: 'Primero $XA = C - B$; y como $A$ está a la derecha de $X$, se multiplica por $A^{-1}$ por la derecha: $X = (C-B)A^{-1}$.' },
        { enunciado: '¿Qué error se comete al escribir $X = A^{-1}(C-B)$?',
          opciones: ['Ninguno', 'Se ha multiplicado por el lado equivocado', 'Se ha olvidado restar $B$', 'Se ha dividido entre $A$'],
          correcta: 1,
          porque: 'Multiplicar por la izquierda daría $A^{-1}XA$, que no se simplifica. Hay que multiplicar por el lado en el que está $A$.' }
      ],
      'AXB=C': [
        { enunciado: 'En $AXB = C$ (con $A$ y $B$ regulares), ¿cuántas multiplicaciones por inversas hacen falta?',
          opciones: ['Una, por $A^{-1}$', 'Una, por $B^{-1}$', 'Dos: por $A^{-1}$ por la izquierda y por $B^{-1}$ por la derecha', 'Ninguna: se divide entre $AB$'],
          correcta: 2,
          porque: 'Cada factor se elimina por su lado: $A^{-1}(AXB)B^{-1} = A^{-1}CB^{-1}$, y queda $X = A^{-1}CB^{-1}$.' },
        { enunciado: 'La solución correcta es…',
          opciones: ['$X = A^{-1}CB^{-1}$', '$X = B^{-1}CA^{-1}$', '$X = C A^{-1}B^{-1}$', '$X = (AB)^{-1}C$'],
          correcta: 0,
          porque: 'El orden es obligatorio: $A^{-1}$ delante (venía por la izquierda) y $B^{-1}$ detrás (venía por la derecha).' }
      ],
      'AX=B+X': [
        { enunciado: 'En $AX = B + X$, ¿cómo se agrupa la incógnita?',
          opciones: ['$AX - X = B$ y luego $(A - I)X = B$', '$AX - X = B$ y luego $(A - 1)X = B$',
            'Se pasa $X$ multiplicando', 'No se puede agrupar'],
          correcta: 0,
          porque: 'Se saca $X$ factor común por la derecha usando $X = IX$: $AX - IX = (A - I)X = B$. El «uno» de las matrices es la identidad $I$, no el número 1.' },
        { enunciado: 'Si $A - I$ es regular, entonces…',
          opciones: ['$X = B(A-I)^{-1}$', '$X = (A-I)^{-1}B$', '$X = B - A + I$', 'No hay solución'],
          correcta: 1,
          porque: 'La matriz $A - I$ multiplica a $X$ por la izquierda, así que su inversa entra por la izquierda: $X = (A-I)^{-1}B$.' }
      ]
    };
    return base[tipo];
  }
  /* ==================================================================
     14 · publicación en window.MTX
     ================================================================== */
  /* lectura y construcción */
  S.Mat = Mat;
  S.matDe = matDe;
  S.parseMat = parseMat;
  S.matPorFormula = matPorFormula;
  S.matAleatoria = matAleatoria;
  S.matNula = matNula;
  S.matIdentidad = matIdentidad;
  S.matIdent = matIdent;
  S.matDiagonal = matDiagonal;
  S.matEscalarMat = matEscalarMat;
  S.matAmpliada = matAmpliada;
  S.matPegada = matPegada;
  S.matTex = matTex;
  S.matParamTex = matParamTex;
  S.dimTex = dimTex;
  S.dimTxt = dimTxt;
  S.matTxt = matTxt;
  S.matIgual = matIgual;
  S.difIguales = difIguales;

  /* clasificación */
  S.clasifica = clasifica;
  S.esNula = esNula;
  S.esCuadrada = esCuadrada;
  S.esDiagonal = esDiagonal;
  S.esEscalar = esEscalar;
  S.esIdentidad = esIdentidad;
  S.esTriangularSup = esTriangularSup;
  S.esTriangularInf = esTriangularInf;
  S.esSimetrica = esSimetrica;
  S.esAntisimetrica = esAntisimetrica;
  S.esRegular = esRegular;
  S.traza = traza;
  S.diagPrincipal = diagPrincipal;
  S.diagSecundaria = diagSecundaria;

  /* transposición y simetría */
  S.matTrans = matTrans;
  S.matTraspuesta = matTraspuesta;
  S.descomponSim = descomponSim;

  /* operaciones */
  S.matSuma = matSuma;
  S.matResta = matResta;
  S.matEscalar = matEscalar;
  S.opuesta = opuesta;
  S.matCombina = matCombina;
  S.filaPorColumna = filaPorColumna;
  S.matProd = matProd;
  S.matPor = matPor;
  S.matPorVector = matPorVector;
  S.matProdPasos = matProdPasos;
  S.matPot = matPot;
  S.matPotPasos = matPotPasos;

  /* combinaciones de filas, rango y operaciones elementales */
  S.combFilas = combFilas;
  S.filasIndependientes = filasIndependientes;
  S.gauss = gauss;
  S.rango = rango;
  S.rangoPasos = rangoPasos;
  S.opElemental = opElemental;
  S.det = det;
  S.detPasos = detPasos;
  S.menorMat = menor;

  /* parámetro */
  S.parseMatParam = parseMatParam;
  S.evalMatParam = evalMatParam;
  S.rangoParam = rangoParam;

  /* inversa */
  S.inversa = inversa;
  S.inversaPasos = inversaPasos;
  S.inversa2x2 = inversa2x2;

  /* ecuaciones matriciales */
  S.ecuMatricial = ecuMatricial;
  S.pasoDespeje = pasoDespeje;
  S.TIPOS_ECU = TIPOS_ECU;

  /* geometría del plano (applet «transforma») */
  S.plano = plano;
  S.corte = corte;
  S.rectaDe = rectaDe;
  S.puntoTex = puntoTex;
  S.cumple = cumple;
  S.textoPlano = textoPlano;

  /* utilidades de fracciones */
  S.fracDe = F;
  S.fracTex = fTex;

  S.matricial = true;
  if (S.monta) S.monta();
})();
