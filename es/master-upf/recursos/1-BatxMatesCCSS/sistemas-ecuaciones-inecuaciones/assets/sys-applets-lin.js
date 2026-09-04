/* =====================================================================
   sys-applets-lin.js · Tema 4 «Sistemas de ecuaciones e inecuaciones»
   1.º de Bachillerato · Matemáticas Aplicadas a las Ciencias Sociales
   Ruta: 1-BatxMatesCCSS/sistemas-ecuaciones-inecuaciones/assets/sys-applets-lin.js

   CAPA DE ÁLGEBRA LINEAL del tema. Se carga DESPUÉS del núcleo
   sys-applets.js y añade propiedades a window.SYS. No registra applets:
   solo pone el motor exacto que usan los módulos A, B y C.

   Toda la aritmética es EXACTA con fracciones de BigInt (S.Frac):
   el parseo, el método de Gauss, los determinantes, los vértices de un
   recinto y las soluciones de los sistemas no lineales racionales se
   calculan sin un solo redondeo. La coma flotante aparece únicamente
   al transformar coordenadas en píxeles para dibujar.

   ---------------------------------------------------------------------
   API que añade a window.SYS
   ---------------------------------------------------------------------

   LECTURA DE ECUACIONES Y SISTEMAS
     .parseEcu(txt, vars)        "2x-3y=5" -> {coef:[Frac,..], b:Frac, tex,
                                 vars, gradoOk}. Admite orden libre de los
                                 términos, incógnitas en los dos miembros,
                                 paréntesis, coeficientes decimales con coma
                                 (0,5), fracciones (3/4), signos repetidos,
                                 superíndices (x²) y productos implícitos.
                                 vars por defecto ['x','y'].
     .parseSistema(txt, vars)    varias líneas (separadas por salto de línea,
                                 «;» o «,») -> {A:Mat, b:[Frac], n, m, vars,
                                 ecus:[...], texto}. Si vars se omite, detecta
                                 qué incógnitas aparecen entre x, y, z.
     .sisTex(A, b, vars)         sistema en LaTeX con \left\{\begin{array}{...}
                                 y los signos correctamente colocados.
     .ecuTex(coef, b, vars)      una sola ecuación en LaTeX.
     .parseInec(txt, vars)       "2x+3y<=6" -> {a,b,c,rel} (rel canónico
                                 '<=','<','>=','>','=')
     .inecTex(inec)              inecuación en LaTeX (con \le y \ge).
     .parseInecs(txt, vars)      varias inecuaciones -> [inec,...]
     .parseMulti(txt, vars)      expresión -> polinomio multivariable interno
     .mpTex(P, vars)             ese polinomio en LaTeX
     .mpGrado(P) .mpCoef(P,exps) .mpEval(P, valores)

   MATRICES (todas las entradas son Frac)
     .Mat(filas)                 filas = arrays de Frac o de números.
                                 .f nº filas · .c nº columnas · .a[i][j]
                                 .copia() .fila(i) .col(j) .get(i,j)
                                 .set(i,j,v) .esNula() .igual(N) .nums()
     .matDe(nums)                atajo desde números
     .matTex(M, opts)            opts {aug:k} línea vertical antes de las k
                                 últimas columnas; {marca:[[i,j],..]} pinta
                                 esos elementos con \boxed
     .matAmpliada(A, b)          matriz ampliada A|b
     .matIdent(n) .matTraspuesta(M) .matPor(M,N) .matPorVector(M,v)

   GAUSS, RANGO Y DETERMINANTES
     .gauss(M, opts)             opts {aug:0, jordan:false}
                                 -> {pasos:[{M, op, desc}], fin, pivotes,
                                     rango, filaIncompatible}
                                 op en notación TeX  F_i \to F_i - k F_j
     .rango(M)                   entero (número de pivotes)
     .det(M)                     Frac (cualquier orden; 2x2 y 3x3 directos)
     .detPasos(M)                {tex, valor, tipo} desarrollo de Sarrus
     .discute(A, b, vars)        {tipo:'SCD'|'SCI'|'SI', nombre, rA, rAb, n,
                                 gl, sol, param:{descripcion, texParam,...},
                                 texto (HTML), teorema}
     .resuelve(A, b, vars)       lo anterior + {pasos, gauss, matriz, solTex}
     .compruebaSol(A, b, sol)    verificación ecuación por ecuación

   MÉTODOS CLÁSICOS CON TODOS LOS PASOS (2 incógnitas)
     .sustitucion(A, b, opts)    opts {despejar:'x'|'y', desde:0|1}
     .igualacion(A, b, opts)     opts {despejar:'x'|'y'}
     .reduccion(A, b, opts)      opts {eliminar:'x'|'y'} (usa el m.c.m.)
     cada uno -> {pasos:[{desc, tex}], sol, tipo, elegido, aviso}
     .cramer(A, b)               {dets:{D,Dx,Dy,Dz}, sol, tipo, tex}

   GEOMETRÍA DEL PLANO
     .plano(opts)                figura SVG completa (ver más abajo)
     .corte(r1, r2)              {tipo:'punto'|'paralelas'|'coincidentes',
                                 x:Frac, y:Frac, det:Frac}
     .rectaDe(a,b,c)             normaliza una recta a x + b y = c
     .rectaTex(r, opts)          recta en LaTeX; .explicitaTex(r) -> y=mx+n
     .puntoTex(x, y)             "(x, y)" con fracciones exactas
     .cumple(inec, x, y)         ¿el punto satisface la inecuación?
     .vertices(inecs)            vértices exactos del recinto factible
     .recintoAcotado(inecs)      booleano (cono de direcciones)
     .evalObjetivo(inecs, f)     f = {p,q} para F = p x + q y
                                 -> {vertices:[{x,y,valor}], max, min, tabla}

   SISTEMAS NO LINEALES
     .curva(txt)                 {tipo:'recta'|'parabola'|'circunferencia'|
                                 'hiperbola'|'elipse'|'punto'|'vacia', tex,
                                 f(x), fSup, fInf, param, dibuja(opts)}
     .noLineal(txt1, txt2)       {pasos, soluciones:[{x,y,tex,xv,yv}],
                                 curvas:[curva,curva], tipo, sistemaTex}
     .solUni(p)                  raíces exactas de un polinomio de una
                                 variable (Frac o S.Irr)

   ---------------------------------------------------------------------
   S.plano(opts) · la pieza gráfica central del tema
   ---------------------------------------------------------------------
   opts = {
     W, H,                      720 x 520 por defecto
     xmin, xmax, ymin, ymax,    si falta alguno, la ventana se autoajusta
                                a las rectas, puntos, regiones y curvas
     rejilla:true, ejes:true, ticks:paso (si no, paso «bonito» automático),
     rectas:  [{a,b,c, color, etiqueta, dash, ancho, ladoEtq}]  (a x + b y = c)
     regiones:[{inecs:[{a,b,c,rel}], color, alfa, etiqueta, borde}]
     puntos:  [{x,y, etiqueta, color, hueco:false, dx, dy}]
     segmentos:[{x1,y1,x2,y2, color, dash, ancho}]
     curvas:  [{curva|txt, color, etiqueta, dash, ancho}]
     leyenda: [{color, texto, dash}] | [[color, texto], ...]
     titulo, cap, label, wrap:false  (wrap:false devuelve el <svg> desnudo)
   }
   Tipografía deliberadamente grande: números de los ejes 16px en negrita,
   etiquetas de recta 17px en negrita con halo blanco, rótulos de punto
   17px en negrita. Rejilla clara, ejes con flecha y numeración, regiones
   sombreadas con transparencia y contorno.

   ---------------------------------------------------------------------
   Mensajes de error
   ---------------------------------------------------------------------
   Todos los Error que lanza esta capa están escritos en español y
   dirigidos al alumno: dicen qué se ha entendido mal y cómo se escribe
   bien la entrada, con un ejemplo correcto.

   Sin OJS, sin CDN, sin dependencias externas. ES5 (var/function) salvo
   el uso de BigInt, que ya usa el núcleo.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.SYS;
  if (!S) {
    if (window.console && console.warn) {
      console.warn('sys-applets-lin.js necesita sys-applets.js cargado antes.');
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
     2 · polinomios multivariables (uso interno del parseo)
     Un polinomio es un objeto {clave -> Frac} donde la clave es la lista
     de exponentes separada por comas: en las variables ['x','y'] la
     clave '2,0' es x², '1,1' es xy y '0,0' el término independiente.
     ================================================================== */
  function mpZero() { return {}; }
  function mpConst(f, nv) { var o = {}; if (!cero(f)) o[ceros(nv)] = f; return o; }
  function ceros(nv) { var a = [], i; for (i = 0; i < nv; i++) a.push(0); return a.join(','); }
  function mpVarP(idx, nv) {
    var a = [], i;
    for (i = 0; i < nv; i++) a.push(i === idx ? 1 : 0);
    var o = {}; o[a.join(',')] = F1(); return o;
  }
  function mpAdd(A, B) {
    var o = {}, k;
    for (k in A) if (A.hasOwnProperty(k)) o[k] = A[k];
    for (k in B) if (B.hasOwnProperty(k)) {
      o[k] = o[k] ? o[k].mas(B[k]) : B[k];
      if (cero(o[k])) delete o[k];
    }
    return o;
  }
  function mpNeg(A) {
    var o = {}, k;
    for (k in A) if (A.hasOwnProperty(k)) o[k] = A[k].opuesto();
    return o;
  }
  function mpSub(A, B) { return mpAdd(A, mpNeg(B)); }
  function mpScale(A, f) {
    var o = {}, k;
    if (cero(f)) return o;
    for (k in A) if (A.hasOwnProperty(k)) o[k] = A[k].por(f);
    return o;
  }
  function mpMul(A, B) {
    var o = {}, k1, k2;
    for (k1 in A) if (A.hasOwnProperty(k1)) {
      for (k2 in B) if (B.hasOwnProperty(k2)) {
        var e1 = k1.split(','), e2 = k2.split(','), e = [], i;
        for (i = 0; i < e1.length; i++) e.push(Number(e1[i]) + Number(e2[i]));
        var k = e.join(',');
        var v = A[k1].por(B[k2]);
        o[k] = o[k] ? o[k].mas(v) : v;
        if (cero(o[k])) delete o[k];
      }
    }
    return o;
  }
  function mpPow(A, n, nv) {
    var r = mpConst(F1(), nv), i;
    for (i = 0; i < n; i++) r = mpMul(r, A);
    return r;
  }
  function mpGrado(A) {
    var g = -1, k;
    for (k in A) if (A.hasOwnProperty(k)) {
      var e = k.split(','), s = 0, i;
      for (i = 0; i < e.length; i++) s += Number(e[i]);
      if (s > g) g = s;
    }
    return g;
  }
  function mpCoef(A, exps) {
    var k = exps.join(',');
    return A[k] ? A[k] : F0();
  }
  function mpEsCero(A) { for (var k in A) if (A.hasOwnProperty(k)) return false; return true; }
  function mpEval(A, vals) {
    var tot = F0(), k;
    for (k in A) if (A.hasOwnProperty(k)) {
      var e = k.split(','), t = A[k], i, j;
      for (i = 0; i < e.length; i++) for (j = 0; j < Number(e[i]); j++) t = t.por(F(vals[i]));
      tot = tot.mas(t);
    }
    return tot;
  }
  /* Orden de escritura: grado total decreciente y después alfabético. */
  function mpClaves(A) {
    var ks = [], k;
    for (k in A) if (A.hasOwnProperty(k)) ks.push(k);
    ks.sort(function (u, v) {
      var eu = u.split(','), ev = v.split(','), su = 0, sv = 0, i;
      for (i = 0; i < eu.length; i++) { su += Number(eu[i]); sv += Number(ev[i]); }
      if (su !== sv) return sv - su;
      for (i = 0; i < eu.length; i++) if (eu[i] !== ev[i]) return Number(ev[i]) - Number(eu[i]);
      return 0;
    });
    return ks;
  }
  function monomioTex(coef, k, vars, primero) {
    var e = k.split(','), cuerpo = '', i;
    for (i = 0; i < e.length; i++) {
      var ex = Number(e[i]);
      if (ex === 1) cuerpo += vars[i];
      else if (ex > 1) cuerpo += vars[i] + '^{' + ex + '}';
    }
    var a = absF(coef);
    var num = (cuerpo !== '' && a.n === 1n && a.d === 1n) ? '' : fTex(a);
    var s = primero ? (negat(coef) ? '-' : '') : (negat(coef) ? ' - ' : ' + ');
    return s + num + cuerpo;
  }
  function mpTex(A, vars) {
    if (mpEsCero(A)) return '0';
    var ks = mpClaves(A), s = '', i;
    for (i = 0; i < ks.length; i++) s += monomioTex(A[ks[i]], ks[i], vars, i === 0);
    return s;
  }

  /* ==================================================================
     3 · lectura de expresiones escritas por el alumno
     Gramática:  expresion := [+|-] termino ((+|-) termino)*
                 termino   := factor (('*'|'/'|implícito) factor)*
                 factor    := base ['^' entero]
                 base      := '(' expresion ')' | incógnita | número
     Solo se permite dividir entre un número.
     ================================================================== */
  function normaliza(txt) {
    var t = String(txt === undefined || txt === null ? '' : txt).toLowerCase();
    t = t.replace(/\s+/g, '');
    t = t.replace(/[·×*]/g, '*');
    t = t.replace(/[−–—]/g, '-');
    t = t.replace(/[\[{]/g, '(').replace(/[\]}]/g, ')');
    t = t.replace(/⁰/g, '^0').replace(/¹/g, '^1').replace(/²/g, '^2').replace(/³/g, '^3')
      .replace(/⁴/g, '^4').replace(/⁵/g, '^5').replace(/⁶/g, '^6').replace(/⁷/g, '^7')
      .replace(/⁸/g, '^8').replace(/⁹/g, '^9');
    t = t.replace(/(\d),(\d)/g, '$1.$2');
    t = t.replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/=</g, '<=').replace(/=>/g, '>=');
    return t;
  }

  function parseMulti(txt, vars, etiqueta) {
    vars = (vars || ['x', 'y']).map(function (v) { return String(v).toLowerCase(); });
    var nv = vars.length;
    var s = normaliza(txt);
    etiqueta = etiqueta || 'la expresión';
    if (s === '') {
      throw Error('Falta ' + etiqueta + '. Escribe algo como 2x+3y (usa las incógnitas ' +
        vars.join(', ') + ').');
    }
    var letras = vars.join('');
    var permitido = new RegExp('^[0-9' + letras + '\\+\\-\\*\\^\\(\\)\\./]*$');
    if (!permitido.test(s)) {
      var malo = s.split('').filter(function (c) { return !permitido.test(c); })[0];
      throw Error('No entiendo el símbolo «' + malo + '» en «' + txt + '». Usa solo números, las incógnitas ' +
        vars.join(', ') + ', los signos + - * ^ ( ) y la barra / para dividir entre un número. Ejemplo correcto: 2x-3y=5');
    }
    var i = 0;
    function fin() { return i >= s.length; }
    function ver() { return s.charAt(i); }
    function come(c) { if (ver() === c) { i++; return true; } return false; }
    function esVar(c) { return vars.indexOf(c) >= 0; }

    function numero() {
      var j = i;
      while (!fin() && /[0-9.]/.test(ver())) i++;
      var t = s.slice(j, i);
      if (!/^\d+(\.\d+)?$/.test(t)) {
        throw Error('Número mal escrito cerca de «' + t + '» en «' + txt + '». Ejemplos válidos: 3, 2,5 (con coma) o 7/2.');
      }
      return decimalAFrac(t);
    }
    function entPos() {
      var j = i;
      while (!fin() && /[0-9]/.test(ver())) i++;
      var t = s.slice(j, i);
      if (!/^\d+$/.test(t)) throw Error('Después del signo ^ tiene que ir un exponente natural. Ejemplo: x^2');
      var n = Number(t);
      if (n > 6) throw Error('En esta capa los exponentes llegan hasta 6. Revisa «' + txt + '».');
      return n;
    }
    function expresion() {
      var signo = 1;
      while (!fin() && (ver() === '+' || ver() === '-')) { if (come('-')) signo = -signo; else come('+'); }
      var acc = mpScale(termino(), new Frac(signo));
      while (!fin() && (ver() === '+' || ver() === '-')) {
        var neg = come('-'); if (!neg) come('+');
        while (!fin() && (ver() === '+' || ver() === '-')) { if (come('-')) neg = !neg; else come('+'); }
        var t = termino();
        acc = neg ? mpSub(acc, t) : mpAdd(acc, t);
      }
      return acc;
    }
    function termino() {
      var acc = factor();
      for (;;) {
        if (come('*')) { acc = mpMul(acc, factor()); continue; }
        if (come('/')) {
          var d = factor();
          if (mpGrado(d) > 0) {
            throw Error('Solo se puede dividir entre un número, no entre una expresión con incógnitas. ' +
              'Escribe por ejemplo x/2+y=1 (correcto) en lugar de 1/(x+y)=1.');
          }
          var c = mpCoef(d, ceros(nv).split(',').map(Number));
          if (cero(c)) throw Error('No se puede dividir entre 0. Revisa «' + txt + '».');
          acc = mpScale(acc, F1().entre(c));
          continue;
        }
        if (!fin() && (/[0-9(]/.test(ver()) || esVar(ver()))) { acc = mpMul(acc, factor()); continue; }
        break;
      }
      return acc;
    }
    function factor() {
      var b = base();
      if (come('^')) b = mpPow(b, entPos(), nv);
      return b;
    }
    function base() {
      if (come('(')) {
        var e = expresion();
        if (!come(')')) throw Error('Falta cerrar un paréntesis en «' + txt + '». Cuenta los paréntesis abiertos y cerrados.');
        return e;
      }
      if (!fin() && esVar(ver())) { var idx = vars.indexOf(ver()); i++; return mpVarP(idx, nv); }
      if (!fin() && /[0-9.]/.test(ver())) return mpConst(numero(), nv);
      if (come('-')) return mpNeg(base());
      if (come('+')) return base();
      throw Error('No entiendo «' + s.slice(i) + '» en «' + txt + '». Ejemplo correcto de ecuación: 2x-3y=5');
    }

    var res = expresion();
    if (!fin()) {
      throw Error('Sobra algo al final de «' + txt + '»: «' + s.slice(i) + '». ' +
        'Escribe cada ecuación con un solo signo =, por ejemplo 2x+3y=5.');
    }
    return res;
  }

  /* ------------------------------------------------------------------
     Una ecuación lineal:  txt -> {coef:[Frac], b:Frac}
     ------------------------------------------------------------------ */
  function partePorIgual(txt) {
    var s = normaliza(txt);
    if (s === '') throw Error('Falta la ecuación. Escríbela con un signo igual, por ejemplo 2x+3y=5.');
    var trozos = s.split('=');
    if (trozos.length === 1) {
      throw Error('A la ecuación «' + txt + '» le falta el signo =. Una ecuación se escribe así: 2x+3y=5.');
    }
    if (trozos.length > 2) {
      throw Error('La ecuación «' + txt + '» tiene ' + (trozos.length - 1) + ' signos =. Escribe solo uno, por ejemplo 2x+3y=5.');
    }
    if (trozos[0] === '' || trozos[1] === '') {
      throw Error('Falta un miembro de la ecuación «' + txt + '». Los dos lados del signo = deben tener contenido, por ejemplo x=3.');
    }
    return trozos;
  }

  function detectaVars(txt) {
    var s = normaliza(txt), v = [];
    if (s.indexOf('x') >= 0) v.push('x');
    if (s.indexOf('y') >= 0) v.push('y');
    if (s.indexOf('z') >= 0) v.push('z');
    if (!v.length) v = ['x', 'y'];
    return v;
  }

  function parseEcu(txt, vars) {
    vars = (vars || detectaVars(txt)).map(function (v) { return String(v).toLowerCase(); });
    var nv = vars.length;
    var tr = partePorIgual(txt);
    var L = parseMulti(tr[0], vars, 'el primer miembro de la ecuación');
    var R = parseMulti(tr[1], vars, 'el segundo miembro de la ecuación');
    var D = mpSub(L, R);
    /* comprobación de linealidad, con mensaje didáctico */
    var ks = mpClaves(D), i;
    for (i = 0; i < ks.length; i++) {
      var e = ks[i].split(',').map(Number), suma = 0, j;
      for (j = 0; j < e.length; j++) suma += e[j];
      if (suma > 1) {
        throw Error('La ecuación «' + txt + '» no es lineal: aparece el término ' +
          monomioTex(D[ks[i]], ks[i], vars, true).replace(/[\\{}^]/g, '') +
          '. En un sistema lineal las incógnitas van solas, sin cuadrados ni productos entre ellas: ' +
          '2x+3y=5 es lineal, x^2+y=1 o xy=2 no lo son.');
      }
    }
    var coef = [], todoCero = true;
    for (i = 0; i < nv; i++) {
      var ex = [], j2;
      for (j2 = 0; j2 < nv; j2++) ex.push(j2 === i ? 1 : 0);
      var c = mpCoef(D, ex);
      coef.push(c);
      if (!cero(c)) todoCero = false;
    }
    var b = mpCoef(D, ceros(nv).split(',').map(Number)).opuesto();
    return {
      coef: coef, b: b, vars: vars, trivial: todoCero,
      izq: L, der: R, poly: D, txt: String(txt),
      tex: ecuTex(coef, b, vars)
    };
  }

  function ecuTex(coef, b, vars) {
    vars = vars || ['x', 'y', 'z'];
    var s = '', primero = true, i;
    for (i = 0; i < coef.length; i++) {
      if (cero(coef[i])) continue;
      s += coefVarTex(coef[i], vars[i], primero);
      primero = false;
    }
    if (primero) s = '0';
    return s + ' = ' + fTex(b);
  }

  function parseSistema(txt, vars) {
    var bruto = String(txt === undefined || txt === null ? '' : txt);
    var lineas = bruto.split(/[\n;]+/).map(function (l) { return l.trim(); })
      .filter(function (l) { return l !== ''; });
    if (!lineas.length) {
      throw Error('No has escrito ninguna ecuación. Escribe una ecuación por línea, por ejemplo:\n2x+3y=5\nx-y=1');
    }
    if (!vars) {
      var v = [];
      var todo = normaliza(bruto);
      if (todo.indexOf('x') >= 0) v.push('x');
      if (todo.indexOf('y') >= 0) v.push('y');
      if (todo.indexOf('z') >= 0) v.push('z');
      vars = v.length ? v : ['x', 'y'];
    }
    vars = vars.map(function (q) { return String(q).toLowerCase(); });
    var ecus = lineas.map(function (l) { return parseEcu(l, vars); });
    var filas = ecus.map(function (e) { return e.coef; });
    var b = ecus.map(function (e) { return e.b; });
    return {
      A: Mat(filas), b: b, n: vars.length, m: ecus.length,
      vars: vars, ecus: ecus, lineas: lineas,
      texto: sisTex(Mat(filas), b, vars)
    };
  }

  function sisTex(A, b, vars) {
    var M = (A && A.a) ? A : Mat(A);
    vars = vars || ['x', 'y', 'z'].slice(0, M.c);
    var n = M.c, i, j;
    var colspec = 'r';
    for (j = 1; j < n; j++) colspec += 'cr';
    colspec += 'cr';
    var filas = [];
    for (i = 0; i < M.f; i++) {
      var cel = [], primero = true;
      for (j = 0; j < n; j++) {
        var c = M.a[i][j];
        if (cero(c)) {
          if (j > 0) cel.push('');
          cel.push('');
        } else {
          var a = absF(c);
          var cuerpo = (a.n === 1n && a.d === 1n) ? vars[j] : fTex(a) + vars[j];
          if (primero) {
            if (j > 0) cel.push('');
            cel.push((negat(c) ? '-' : '') + cuerpo);
          } else {
            cel.push(negat(c) ? '-' : '+');
            cel.push(cuerpo);
          }
          primero = false;
        }
      }
      if (primero) cel[0] = '0';
      cel.push('=');
      cel.push(fTex(F(b[i])));
      filas.push(cel.join(' & '));
    }
    return '\\left\\{\\begin{array}{' + colspec + '}' + filas.join(' \\\\ ') + '\\end{array}\\right.';
  }

  /* ------------------------------------------------------------------
     Inecuaciones lineales de dos variables
     ------------------------------------------------------------------ */
  var RELTEX = { '<=': '\\le', '>=': '\\ge', '<': '<', '>': '>', '=': '=' };
  function parseInec(txt, vars) {
    var s = normaliza(txt);
    if (s === '') {
      throw Error('Falta la inecuación. Escríbela con <=, >=, < o >, por ejemplo 2x+3y<=6.');
    }
    var rel = null, pos2 = -1, cand = ['<=', '>=', '<', '>', '='], k;
    for (k = 0; k < cand.length; k++) {
      var p = s.indexOf(cand[k]);
      if (p >= 0) { rel = cand[k]; pos2 = p; break; }
    }
    if (!rel) {
      throw Error('A «' + txt + '» le falta el símbolo de desigualdad. Escribe por ejemplo 2x+3y<=6, x>=0 o y<4.');
    }
    vars = (vars || ['x', 'y']).map(function (q) { return String(q).toLowerCase(); });
    if (vars.length < 2) vars = [vars[0] || 'x', 'y'];
    var izq = s.slice(0, pos2), der = s.slice(pos2 + rel.length);
    if (izq === '' || der === '') {
      throw Error('Falta un miembro en «' + txt + '». A los dos lados de la desigualdad debe haber una expresión, por ejemplo x+y<=10.');
    }
    var L = parseMulti(izq, vars, 'el primer miembro de la inecuación');
    var R = parseMulti(der, vars, 'el segundo miembro de la inecuación');
    var D = mpSub(L, R);
    if (mpGrado(D) > 1) {
      throw Error('La inecuación «' + txt + '» no es lineal. En este tema las inecuaciones son del tipo ' +
        'a x + b y <= c, sin cuadrados ni productos de incógnitas.');
    }
    var a = mpCoef(D, [1, 0]), bb = mpCoef(D, [0, 1]);
    var c = mpCoef(D, [0, 0]).opuesto();
    if (cero(a) && cero(bb)) {
      throw Error('En «' + txt + '» han desaparecido las dos incógnitas. Una inecuación del recinto debe contener x o y, ' +
        'por ejemplo x>=0, y>=0 o 2x+y<=8.');
    }
    return { a: a, b: bb, c: c, rel: rel, txt: String(txt) };
  }
  function parseInecs(txt, vars) {
    var lineas = String(txt || '').split(/[\n;]+/).map(function (l) { return l.trim(); })
      .filter(function (l) { return l !== ''; });
    if (!lineas.length) {
      throw Error('No has escrito ninguna inecuación. Pon una por línea, por ejemplo:\nx>=0\ny>=0\nx+y<=6');
    }
    return lineas.map(function (l) { return parseInec(l, vars); });
  }
  function inecTex(inec, vars) {
    vars = vars || ['x', 'y'];
    var s = '', primero = true;
    if (!cero(inec.a)) { s += coefVarTex(inec.a, vars[0], true); primero = false; }
    if (!cero(inec.b)) { s += coefVarTex(inec.b, vars[1], primero); primero = false; }
    if (primero) s = '0';
    return s + ' ' + RELTEX[inec.rel] + ' ' + fTex(inec.c);
  }

  /* ==================================================================
     4 · matrices con entradas exactas
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
     5 · método de Gauss, rango y determinantes
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
     6 · discusión y resolución de un sistema
     ================================================================== */
  var PARAM = ['\\lambda', '\\mu', '\\nu', '\\alpha'];
  var PARAMTXT = ['λ', 'μ', 'ν', 'α'];

  function discute(A, b, vars) {
    var M = (A && A.a) ? A : Mat(A);
    if (!b || b.length !== M.f) {
      throw Error('Hay ' + M.f + ' ecuaciones pero ' + (b ? b.length : 0) +
        ' términos independientes. Cada ecuación necesita su número a la derecha del signo =.');
    }
    vars = (vars || ['x', 'y', 'z', 't'].slice(0, M.c));
    var Ab = matAmpliada(M, b);
    var rA = rango(M), rAb = rango(Ab), n = M.c;
    var G = gauss(Ab, { aug: 1, jordan: true });
    var out = {
      rA: rA, rAb: rAb, n: n, m: M.f, vars: vars,
      A: M, b: b.map(F), Ab: Ab, gauss: G, pivotes: G.pivotes,
      gl: n - rA, sisTex: sisTex(M, b, vars)
    };
    if (rA < rAb) {
      out.tipo = 'SI';
      out.nombre = 'incompatible';
      out.sol = null;
      out.gl = null;
      out.texto = 'Como $\\operatorname{rg}(A) = ' + rA + '$ y $\\operatorname{rg}(A|B) = ' + rAb +
        '$ son distintos, el sistema es <strong>incompatible</strong>: no tiene ninguna solución. ' +
        'Al escalonar aparece una fila del tipo $0 = k$ con $k \\neq 0$, que es un absurdo.';
      out.teorema = 'rg(A) < rg(A|B) ⟹ sistema incompatible (SI)';
      return out;
    }
    if (rA === n) {
      out.tipo = 'SCD';
      out.nombre = 'compatible determinado';
      out.sol = despejaUnica(G, n);
      out.solTex = vars.map(function (v, i) { return v + ' = ' + fTex(out.sol[i]); }).join(', \\quad ');
      out.texto = 'Como $\\operatorname{rg}(A) = \\operatorname{rg}(A|B) = ' + rA +
        '$ y coincide con el número de incógnitas ($n = ' + n + '$), el sistema es ' +
        '<strong>compatible determinado</strong>: tiene una única solución.';
      out.teorema = 'rg(A) = rg(A|B) = n ⟹ sistema compatible determinado (SCD)';
      return out;
    }
    out.tipo = 'SCI';
    out.nombre = 'compatible indeterminado';
    out.param = parametriza(G, n, vars);
    out.sol = null;
    out.solTex = out.param.texParam;
    out.texto = 'Como $\\operatorname{rg}(A) = \\operatorname{rg}(A|B) = ' + rA +
      '$ pero hay $n = ' + n + '$ incógnitas, el sistema es <strong>compatible indeterminado</strong> ' +
      'con $' + n + ' - ' + rA + ' = ' + (n - rA) + '$ grado' + (n - rA === 1 ? '' : 's') +
      ' de libertad: hay infinitas soluciones, que se describen con ' +
      (n - rA === 1 ? 'un parámetro' : (n - rA) + ' parámetros') + '.';
    out.teorema = 'rg(A) = rg(A|B) < n ⟹ sistema compatible indeterminado (SCI)';
    return out;
  }

  /* De la forma reducida de Gauss-Jordan a la solución única. */
  function despejaUnica(G, n) {
    var A = G.fin, sol = [], i;
    for (i = 0; i < n; i++) sol.push(F0());
    G.pivotes.forEach(function (p) {
      var r = p[0], c = p[1];
      sol[c] = A.a[r][A.c - 1].entre(A.a[r][c]);
    });
    return sol;
  }

  /* Solución paramétrica de un SCI a partir de la forma reducida. */
  function parametriza(G, n, vars) {
    var A = G.fin, basicas = {}, libres = [], i, j;
    G.pivotes.forEach(function (p) { basicas[p[1]] = p[0]; });
    for (j = 0; j < n; j++) if (basicas[j] === undefined) libres.push(j);
    var expr = [];
    for (j = 0; j < n; j++) {
      if (basicas[j] === undefined) {
        var idx = libres.indexOf(j);
        var coefs0 = libres.map(function (_, k) { return new Frac(k === idx ? 1 : 0); });
        expr.push({ variable: vars[j], indice: j, cte: F0(), coefs: coefs0, libre: true });
      } else {
        var r = basicas[j], p = A.a[r][j];
        var cte = A.a[r][A.c - 1].entre(p);
        var coefs = libres.map(function (lj) { return A.a[r][lj].entre(p).opuesto(); });
        expr.push({ variable: vars[j], indice: j, cte: cte, coefs: coefs, libre: false });
      }
    }
    var partes = expr.map(function (e) {
      var s = e.variable + ' = ';
      if (e.libre) return s + PARAM[libres.indexOf(e.indice)];
      var cuerpo = '', primero = true;
      if (!cero(e.cte) || e.coefs.every(cero)) { cuerpo += fTex(e.cte); primero = false; }
      e.coefs.forEach(function (c, k) {
        if (cero(c)) return;
        var a = absF(c);
        var num = (a.n === 1n && a.d === 1n) ? '' : fTex(a);
        cuerpo += primero ? ((negat(c) ? '-' : '') + num + PARAM[k])
          : ((negat(c) ? ' - ' : ' + ') + num + PARAM[k]);
        primero = false;
      });
      return s + cuerpo;
    });
    var ejemplo = expr.map(function (e) { return e.cte; });
    return {
      libres: libres.map(function (j2) { return vars[j2]; }),
      parametros: libres.map(function (_, k) { return PARAM[k]; }),
      parametrosTxt: libres.map(function (_, k) { return PARAMTXT[k]; }),
      expr: expr,
      texParam: partes.join(', \\quad '),
      texLista: partes,
      descripcion: 'Las incógnitas ' + libres.map(function (j2) { return vars[j2]; }).join(', ') +
        ' quedan libres: se les llama ' + libres.map(function (_, k) { return PARAMTXT[k]; }).join(', ') +
        ' y las demás se escriben en función de ' +
        (libres.length === 1 ? 'ese parámetro' : 'esos parámetros') + '. Cada valor del parámetro da una solución distinta.',
      ejemplo: ejemplo
    };
  }

  function resuelve(A, b, vars) {
    var out = discute(A, b, vars);
    var G = gauss(out.Ab, { aug: 1, jordan: false });
    out.pasos = G.pasos;
    out.gaussEscalonado = G;
    out.matriz = out.Ab;
    out.escalonada = G.fin;
    out.matrizTex = matTex(out.Ab, { aug: 1 });
    out.escalonadaTex = matTex(G.fin, { aug: 1, marca: G.pivotes });
    if (out.tipo === 'SCD') out.comprobacion = compruebaSol(out.A, out.b, out.sol);
    return out;
  }

  function compruebaSol(A, b, sol) {
    var M = (A && A.a) ? A : Mat(A);
    var filas = [], ok = true, i, j;
    for (i = 0; i < M.f; i++) {
      var s = F0();
      for (j = 0; j < M.c; j++) s = s.mas(M.a[i][j].por(F(sol[j])));
      var bien = igualF(s, F(b[i]));
      if (!bien) ok = false;
      filas.push({ ecuacion: i + 1, valor: s, esperado: F(b[i]), ok: bien });
    }
    return { ok: ok, filas: filas };
  }

  /* ==================================================================
     7 · métodos clásicos con todos los pasos (sistemas 2 × 2)
     ================================================================== */
  function exige2x2(A, b) {
    var M = (A && A.a) ? A : Mat(A);
    if (M.f !== 2 || M.c !== 2) {
      throw Error('Los métodos de sustitución, igualación y reducción se aplican aquí a sistemas de ' +
        '2 ecuaciones con 2 incógnitas. Este sistema es de ' + M.f + '×' + M.c +
        '. Para 3 incógnitas usa el método de Gauss (S.resuelve).');
    }
    if (!b || b.length !== 2) {
      throw Error('Faltan los términos independientes: cada una de las dos ecuaciones necesita su número tras el signo =.');
    }
    return M;
  }
  /* Escribe a·x + b·y = c en TeX */
  function ecu2Tex(a, b, c, vars) {
    return ecuTex([a, b], c, vars || ['x', 'y']);
  }
  /* Despeja la incógnita k de la ecuación i:  x = (c - b y)/a  */
  function despejaTex(a, b, c, vi, vo) {
    /* a·vi + b·vo = c  ->  vi = (c - b·vo)/a  */
    var num = '', primero = true;
    if (!cero(c) || cero(b)) { num += fTex(c); primero = false; }
    if (!cero(b)) {
      var ob = b.opuesto(), ab = absF(ob);
      var cuerpo = (ab.n === 1n && ab.d === 1n) ? vo : fTex(ab) + vo;
      num += primero ? ((negat(ob) ? '-' : '') + cuerpo) : ((negat(ob) ? ' - ' : ' + ') + cuerpo);
    }
    if (igualF(a, F1())) return vi + ' = ' + num;
    return vi + ' = \\dfrac{' + num + '}{' + fTex(a) + '}';
  }

  function sustitucion(A, b, opts) {
    var M = exige2x2(A, b);
    opts = opts || {};
    var vars = opts.vars || ['x', 'y'];
    var iv = (opts.despejar === 'y' || opts.despejar === vars[1]) ? 1 : 0;
    var e0 = (opts.desde === 1) ? 1 : 0;
    var aviso = null;
    if (cero(M.a[e0][iv])) {
      var otra = 1 - e0;
      if (!cero(M.a[otra][iv])) {
        aviso = 'En la ecuación (' + (e0 + 1) + ') no aparece la incógnita $' + vars[iv] +
          '$, así que no se puede despejar ahí: usamos la ecuación (' + (otra + 1) + ').';
        e0 = otra;
      } else {
        iv = 1 - iv;
        if (cero(M.a[e0][iv])) {
          throw Error('Este sistema no tiene ninguna ecuación con las incógnitas necesarias para sustituir. ' +
            'Revisa que hayas escrito bien las dos ecuaciones, por ejemplo 2x+3y=5 y x-y=1.');
        }
        aviso = 'La incógnita elegida no aparece en la ecuación (' + (e0 + 1) + '), así que despejamos $' +
          vars[iv] + '$ en su lugar.';
      }
    }
    var io = 1 - iv, e1 = 1 - e0;
    var a = M.a[e0][iv], bb = M.a[e0][io], c = F(b[e0]);
    var a2 = M.a[e1][iv], b2 = M.a[e1][io], c2 = F(b[e1]);
    var pasos = [];
    pasos.push({
      desc: 'Escribimos el sistema y elegimos qué despejar.',
      tex: sisTex(M, b, vars)
    });
    pasos.push({
      desc: 'Despejamos $' + vars[iv] + '$ en la ecuación (' + (e0 + 1) + ').' + (aviso ? ' ' + aviso : ''),
      tex: despejaTex(a, bb, c, vars[iv], vars[io])
    });
    /* sustituimos: a2·(c - bb·vo)/a + b2·vo = c2  */
    var k = a2.entre(a);
    var coefO = b2.menos(k.por(bb));
    var rhs = c2.menos(k.por(c));
    pasos.push({
      desc: 'Sustituimos esa expresión en la ecuación (' + (e1 + 1) + '): ahora solo queda la incógnita $' + vars[io] + '$.',
      tex: fTex(a2) + '\\left(' + despejaTex(a, bb, c, vars[iv], vars[io]).split('=')[1] + '\\right)' +
        coefVarTex(b2, vars[io], false) + ' = ' + fTex(c2)
    });
    pasos.push({
      desc: 'Quitamos denominadores y agrupamos los términos semejantes.',
      tex: coefVarTex(coefO, vars[io], true) + ' = ' + fTex(rhs)
    });
    var out = { pasos: pasos, metodo: 'sustitucion', despejada: vars[iv], ecuacion: e0 + 1, aviso: aviso, vars: vars };
    if (cero(coefO)) {
      if (cero(rhs)) {
        out.tipo = 'SCI';
        out.sol = null;
        pasos.push({
          desc: 'Llegamos a una identidad $0 = 0$: las dos ecuaciones dicen lo mismo. El sistema es <strong>compatible indeterminado</strong> (infinitas soluciones).',
          tex: '0 = 0'
        });
      } else {
        out.tipo = 'SI';
        out.sol = null;
        pasos.push({
          desc: 'Llegamos a un absurdo: el sistema es <strong>incompatible</strong> y no tiene solución.',
          tex: '0 = ' + fTex(rhs)
        });
      }
      return out;
    }
    var vo = rhs.entre(coefO);
    pasos.push({
      desc: 'Despejamos $' + vars[io] + '$.',
      tex: vars[io] + ' = \\dfrac{' + fTex(rhs) + '}{' + fTex(coefO) + '} = ' + fTex(vo)
    });
    var vi = c.menos(bb.por(vo)).entre(a);
    pasos.push({
      desc: 'Volvemos a la expresión despejada para obtener $' + vars[iv] + '$.',
      tex: vars[iv] + ' = ' + fTex(vi)
    });
    var sol = [];
    sol[iv] = vi; sol[io] = vo;
    out.tipo = 'SCD';
    out.sol = sol;
    out.comprobacion = compruebaSol(M, b, sol);
    pasos.push({
      desc: 'Comprobamos la solución en las dos ecuaciones originales.',
      tex: puntoTex(sol[0], sol[1])
    });
    return out;
  }

  function igualacion(A, b, opts) {
    var M = exige2x2(A, b);
    opts = opts || {};
    var vars = opts.vars || ['x', 'y'];
    var iv = (opts.despejar === 'y' || opts.despejar === vars[1]) ? 1 : 0;
    var aviso = null;
    if (cero(M.a[0][iv]) || cero(M.a[1][iv])) {
      var alt = 1 - iv;
      if (!cero(M.a[0][alt]) && !cero(M.a[1][alt])) {
        aviso = 'La incógnita $' + vars[iv] + '$ no aparece en las dos ecuaciones, así que igualamos despejando $' + vars[alt] + '$.';
        iv = alt;
      } else {
        throw Error('Para igualar hace falta que la misma incógnita aparezca en las dos ecuaciones. ' +
          'En este sistema no ocurre: resuélvelo por sustitución (S.sustitucion) o por reducción (S.reduccion).');
      }
    }
    var io = 1 - iv;
    var a1 = M.a[0][iv], b1 = M.a[0][io], c1 = F(b[0]);
    var a2 = M.a[1][iv], b2 = M.a[1][io], c2 = F(b[1]);
    var pasos = [];
    pasos.push({ desc: 'Partimos del sistema.', tex: sisTex(M, b, vars) });
    pasos.push({
      desc: 'Despejamos la misma incógnita $' + vars[iv] + '$ en las dos ecuaciones.' + (aviso ? ' ' + aviso : ''),
      tex: '\\begin{aligned}' + despejaTex(a1, b1, c1, vars[iv], vars[io]).replace('=', '&=') + ' \\\\ ' +
        despejaTex(a2, b2, c2, vars[iv], vars[io]).replace('=', '&=') + '\\end{aligned}'
    });
    /* (c1 - b1 vo)/a1 = (c2 - b2 vo)/a2  ->  coef·vo = rhs */
    var coefO = b2.entre(a2).menos(b1.entre(a1));
    var rhs = c2.entre(a2).menos(c1.entre(a1));
    pasos.push({
      desc: 'Igualamos las dos expresiones, porque las dos valen $' + vars[iv] + '$.',
      tex: despejaTex(a1, b1, c1, vars[iv], vars[io]).split('=')[1] + ' = ' +
        despejaTex(a2, b2, c2, vars[iv], vars[io]).split('=')[1]
    });
    pasos.push({
      desc: 'Multiplicamos en cruz, agrupamos y nos queda una ecuación con una sola incógnita.',
      tex: coefVarTex(coefO, vars[io], true) + ' = ' + fTex(rhs)
    });
    var out = { pasos: pasos, metodo: 'igualacion', despejada: vars[iv], aviso: aviso, vars: vars };
    if (cero(coefO)) {
      if (cero(rhs)) {
        out.tipo = 'SCI'; out.sol = null;
        pasos.push({ desc: 'Se obtiene $0 = 0$: las dos rectas son la misma y el sistema es <strong>compatible indeterminado</strong>.', tex: '0 = 0' });
      } else {
        out.tipo = 'SI'; out.sol = null;
        pasos.push({ desc: 'Se obtiene un absurdo: las rectas son paralelas y el sistema es <strong>incompatible</strong>.', tex: '0 = ' + fTex(rhs) });
      }
      return out;
    }
    var vo = rhs.entre(coefO);
    var vi = c1.menos(b1.por(vo)).entre(a1);
    pasos.push({ desc: 'Despejamos $' + vars[io] + '$.', tex: vars[io] + ' = ' + fTex(vo) });
    pasos.push({ desc: 'Sustituimos en cualquiera de las expresiones despejadas.', tex: vars[iv] + ' = ' + fTex(vi) });
    var sol = []; sol[iv] = vi; sol[io] = vo;
    out.tipo = 'SCD'; out.sol = sol;
    out.comprobacion = compruebaSol(M, b, sol);
    return out;
  }

  function reduccion(A, b, opts) {
    var M = exige2x2(A, b);
    opts = opts || {};
    var vars = opts.vars || ['x', 'y'];
    var ie = (opts.eliminar === 'y' || opts.eliminar === vars[1]) ? 1 : 0;
    var aviso = null;
    var p = M.a[0][ie], q = M.a[1][ie];
    if (cero(p) || cero(q)) {
      var alt = 1 - ie;
      if (!cero(M.a[0][alt]) && !cero(M.a[1][alt])) {
        aviso = 'La incógnita $' + vars[ie] + '$ ya falta en una ecuación, así que eliminamos $' + vars[alt] + '$.';
        ie = alt; p = M.a[0][ie]; q = M.a[1][ie];
      }
    }
    var io = 1 - ie;
    var pasos = [];
    pasos.push({ desc: 'Partimos del sistema.', tex: sisTex(M, b, vars) });
    var m1, m2, textoMult;
    if (cero(p) || cero(q)) {
      m1 = F1(); m2 = F1();
      textoMult = 'La incógnita $' + vars[ie] + '$ ya no aparece en una de las ecuaciones: sumamos directamente.';
    } else if (p.d === 1n && q.d === 1n) {
      var L = S.mcm(Number(absF(p).n), Number(absF(q).n));
      m1 = new Frac(L).entre(absF(p));
      m2 = new Frac(L).entre(absF(q));
      /* los signos deben quedar opuestos para que al sumar se cancele */
      if (pos(p) === pos(q)) m2 = m2.opuesto();
      textoMult = 'El m.c.m. de los coeficientes de $' + vars[ie] + '$ ($' + fTex(absF(p)) + '$ y $' +
        fTex(absF(q)) + '$) es $' + L + '$: multiplicamos la primera ecuación por $' + fTex(m1) +
        '$ y la segunda por $' + fTex(m2) + '$ para que los coeficientes de $' + vars[ie] +
        '$ salgan opuestos.';
    } else {
      m1 = q; m2 = p.opuesto();
      textoMult = 'Multiplicamos en cruz (la primera ecuación por $' + fTex(m1) + '$ y la segunda por $' +
        fTex(m2) + '$) para que los coeficientes de $' + vars[ie] + '$ sean opuestos.';
    }
    var f1 = [M.a[0][0].por(m1), M.a[0][1].por(m1), F(b[0]).por(m1)];
    var f2 = [M.a[1][0].por(m2), M.a[1][1].por(m2), F(b[1]).por(m2)];
    pasos.push({
      desc: textoMult + (aviso ? ' ' + aviso : ''),
      tex: sisTex(Mat([[f1[0], f1[1]], [f2[0], f2[1]]]), [f1[2], f2[2]], vars)
    });
    var sx = f1[0].mas(f2[0]), sy = f1[1].mas(f2[1]), sc = f1[2].mas(f2[2]);
    var coefO = (io === 0) ? sx : sy;
    pasos.push({
      desc: 'Sumamos las dos ecuaciones: la incógnita $' + vars[ie] + '$ desaparece.',
      tex: ecu2Tex(sx, sy, sc, vars)
    });
    var out = { pasos: pasos, metodo: 'reduccion', eliminada: vars[ie], m1: m1, m2: m2, aviso: aviso, vars: vars };
    if (cero(coefO)) {
      if (cero(sc)) {
        out.tipo = 'SCI'; out.sol = null;
        pasos.push({ desc: 'Todo se anula y queda $0 = 0$: el sistema es <strong>compatible indeterminado</strong>.', tex: '0 = 0' });
      } else {
        out.tipo = 'SI'; out.sol = null;
        pasos.push({ desc: 'Queda un absurdo: el sistema es <strong>incompatible</strong>.', tex: '0 = ' + fTex(sc) });
      }
      return out;
    }
    var vo = sc.entre(coefO);
    pasos.push({ desc: 'Despejamos $' + vars[io] + '$.', tex: vars[io] + ' = ' + fTex(vo) });
    /* volvemos a una ecuación original para la otra incógnita */
    var fil = cero(M.a[0][ie]) ? 1 : 0;
    var vi = F(b[fil]).menos(M.a[fil][io].por(vo)).entre(M.a[fil][ie]);
    pasos.push({
      desc: 'Sustituimos en la ecuación (' + (fil + 1) + ') para obtener $' + vars[ie] + '$.',
      tex: vars[ie] + ' = ' + fTex(vi)
    });
    var sol = []; sol[ie] = vi; sol[io] = vo;
    out.tipo = 'SCD'; out.sol = sol;
    out.comprobacion = compruebaSol(M, b, sol);
    return out;
  }

  function cramer(A, b) {
    var M = (A && A.a) ? A : Mat(A);
    if (M.f !== M.c) {
      throw Error('La regla de Cramer solo se aplica cuando hay tantas ecuaciones como incógnitas. ' +
        'Este sistema tiene ' + M.f + ' ecuaciones y ' + M.c + ' incógnitas: úsalo con el método de Gauss.');
    }
    if (!b || b.length !== M.f) {
      throw Error('Faltan términos independientes: hacen falta ' + M.f + ' números tras los signos =.');
    }
    var vars = ['x', 'y', 'z', 't'].slice(0, M.c);
    var D = det(M), dets = { D: D }, i, j;
    var cols = [];
    for (j = 0; j < M.c; j++) {
      var a = [];
      for (i = 0; i < M.f; i++) {
        var fila = M.a[i].slice();
        fila[j] = F(b[i]);
        a.push(fila);
      }
      var Mj = new Mat(a), Dj = det(Mj);
      cols.push({ variable: vars[j], matriz: Mj, valor: Dj });
      dets['D' + vars[j]] = Dj;
    }
    var out = { dets: dets, columnas: cols, D: D, vars: vars, matriz: M, texD: detPasos(M).tex };
    if (!cero(D)) {
      out.tipo = 'SCD';
      out.sol = cols.map(function (c) { return c.valor.entre(D); });
      out.solTex = cols.map(function (c, k) {
        return vars[k] + ' = \\dfrac{D_{' + vars[k] + '}}{D} = \\dfrac{' + fTex(c.valor) + '}{' + fTex(D) +
          '} = ' + fTex(out.sol[k]);
      }).join(', \\quad ');
      out.comprobacion = compruebaSol(M, b, out.sol);
      out.texto = 'Como $D = ' + fTex(D) + ' \\neq 0$, el sistema es compatible determinado y la regla de Cramer da la solución.';
    } else {
      var d = discute(M, b, vars);
      out.tipo = d.tipo;
      out.sol = d.sol;
      out.discusion = d;
      out.texto = 'Como $D = 0$, la regla de Cramer no se puede aplicar: hay que discutir el sistema con los rangos. ' +
        'Aquí resulta ' + (d.tipo === 'SI' ? 'incompatible' : 'compatible indeterminado') + '.';
    }
    return out;
  }

  /* ==================================================================
     8 · geometría del plano: rectas, cortes, recintos
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
  function rectaTex(r, vars) {
    vars = vars || ['x', 'y'];
    var R = rectaDe(r);
    return ecuTex([R.a, R.b], R.c, vars);
  }
  function explicitaTex(r) {
    var R = rectaDe(r);
    if (cero(R.b)) return 'x = ' + fTex(R.c.entre(R.a));
    var m = R.a.opuesto().entre(R.b), n = R.c.entre(R.b);
    var s = 'y = ';
    if (cero(m)) return s + fTex(n);
    s += coefVarTex(m, 'x', true);
    if (!cero(n)) s += (negat(n) ? ' - ' : ' + ') + fTex(absF(n));
    return s;
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
    if (typeof q === 'string') return parseInec(q);
    if (!q || q.a === undefined || q.b === undefined) {
      throw Error('Una inecuación se describe como {a, b, c, rel}, por ejemplo {a:2, b:1, c:8, rel:"<="} ' +
        'para 2x + y <= 8. También puedes pasarla escrita: "2x+y<=8".');
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

  function vertices(inecs) {
    var L = (typeof inecs === 'string' ? parseInecs(inecs) : inecs || []).map(normInec);
    if (L.length < 2) {
      throw Error('Para que un recinto tenga vértices hacen falta al menos dos inecuaciones. ' +
        'Escribe por ejemplo x>=0, y>=0 y x+y<=6.');
    }
    var res = [], i, j;
    for (i = 0; i < L.length; i++) {
      for (j = i + 1; j < L.length; j++) {
        var c = corte({ a: L[i].a, b: L[i].b, c: L[i].c }, { a: L[j].a, b: L[j].b, c: L[j].c });
        if (c.tipo !== 'punto') continue;
        var vale = true, k;
        for (k = 0; k < L.length; k++) if (!cumpleCerrada(L[k], c.x, c.y)) { vale = false; break; }
        if (!vale) continue;
        var abierto = false;
        for (k = 0; k < L.length; k++) if (!cumple(L[k], c.x, c.y)) { abierto = true; break; }
        var rep = false;
        for (k = 0; k < res.length; k++) {
          if (igualF(res[k].x, c.x) && igualF(res[k].y, c.y)) {
            rep = true;
            res[k].rectas.push(i, j);
          }
        }
        if (rep) continue;
        res.push({
          x: c.x, y: c.y, abierto: abierto, rectas: [i, j],
          tex: puntoTex(c.x, c.y),
          xv: numF(c.x), yv: numF(c.y)
        });
      }
    }
    /* orden antihorario alrededor del centro, para poder dibujar el polígono */
    if (res.length > 2) {
      var cx = 0, cy = 0;
      res.forEach(function (p) { cx += p.xv; cy += p.yv; });
      cx /= res.length; cy /= res.length;
      res.sort(function (p, q) {
        return Math.atan2(p.yv - cy, p.xv - cx) - Math.atan2(q.yv - cy, q.xv - cx);
      });
    }
    return res;
  }

  /* El recinto es acotado si el cono de direcciones {A d <= 0} solo
     contiene el vector nulo. En el plano basta probar las direcciones
     de las propias fronteras. */
  function recintoAcotado(inecs) {
    var L = (typeof inecs === 'string' ? parseInecs(inecs) : inecs || []).map(canon);
    if (!L.length) return false;
    var i, k;
    var dirs = [];
    for (i = 0; i < L.length; i++) {
      dirs.push([L[i].b, L[i].a.opuesto()]);
      dirs.push([L[i].b.opuesto(), L[i].a]);
    }
    for (i = 0; i < dirs.length; i++) {
      var dx = dirs[i][0], dy = dirs[i][1];
      if (cero(dx) && cero(dy)) continue;
      var ok = true;
      for (k = 0; k < L.length; k++) {
        var v = L[k].a.por(dx).mas(L[k].b.por(dy));
        if (L[k].igualdad) { if (!cero(v)) { ok = false; break; } }
        else if (pos(v)) { ok = false; break; }
      }
      if (ok) return false;                     /* dirección de escape: no acotado */
    }
    return true;
  }

  function evalObjetivo(inecs, f) {
    var L = (typeof inecs === 'string' ? parseInecs(inecs) : inecs || []).map(normInec);
    f = f || {};
    if (f.p === undefined || f.q === undefined) {
      throw Error('La función objetivo se escribe como {p, q} para F = p·x + q·y. ' +
        'Por ejemplo, para F = 3x + 2y usa {p:3, q:2}.');
    }
    var p = F(f.p), q = F(f.q);
    var V = vertices(L);
    var lista = V.map(function (v) {
      var val = p.por(v.x).mas(q.por(v.y));
      return {
        x: v.x, y: v.y, xv: v.xv, yv: v.yv, abierto: v.abierto,
        valor: val, valorNum: numF(val),
        tex: puntoTex(v.x, v.y) + ' \\Rightarrow F = ' + fTex(val)
      };
    });
    var max = null, min = null;
    lista.forEach(function (v) {
      if (!max || v.valor.cmp(max.valor) > 0) max = v;
      if (!min || v.valor.cmp(min.valor) < 0) min = v;
    });
    var empatesMax = lista.filter(function (v) { return max && igualF(v.valor, max.valor); });
    var empatesMin = lista.filter(function (v) { return min && igualF(v.valor, min.valor); });
    return {
      vertices: lista, max: max, min: min,
      empatesMax: empatesMax, empatesMin: empatesMin,
      acotado: recintoAcotado(L),
      objetivoTex: 'F = ' + ecuTex([p, q], F0(), ['x', 'y']).split(' = ')[0],
      tabla: lista.map(function (v) {
        return [puntoTex(v.x, v.y), fTex(v.valor)];
      })
    };
  }

  /* ==================================================================
     9 · S.plano(opts): la figura del tema
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
    var mT = o.mT === undefined ? (o.titulo ? 50 : 26) : o.mT;
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
      var ins = (typeof g.inecs === 'string' ? parseInecs(g.inecs) : (g.inecs || [])).map(normInec);
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
      var cu = c.curva || (c.txt ? curva(c.txt) : null);
      if (!cu) throw Error('Cada elemento de «curvas» necesita su ecuación: {txt:"y=x^2-1"} o {curva: S.curva("x^2+y^2=25")}.');
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
      try {
        vertices(g.inecs).forEach(function (v) { xs.push(v.xv); ys.push(v.yv); });
      } catch (e) { /* recinto sin vértices: no aporta información */ }
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
     10 · sistemas no lineales: curvas y resolución exacta
     ================================================================== */
  /* Número exacto para las soluciones: racional (Frac) o irracional (S.Irr) */
  function numRac(f) {
    return { frac: f, irr: null, val: numF(f), tex: fTex(f), exacto: true, racional: true };
  }
  function numIrr(ir) {
    if (ir.esRacional()) return numRac(ir.frac());
    return { frac: null, irr: ir, val: ir.val(), tex: ir.tex(), exacto: true, racional: false };
  }
  function numAprox(v) {
    return { frac: null, irr: null, val: v, tex: S.kf(v, 4), exacto: false, racional: false };
  }
  function valorDe(N) { return N.frac ? N.frac : (N.irr ? N.irr : N.val); }

  /* Raíces exactas de un polinomio de una variable (coeficientes Frac) */
  function solUni(p) {
    p = S.pRecorta(p);
    if (S.pEsCero(p)) return { tipo: 'infinitas', raices: [], grado: -1 };
    var g = S.pGrado(p);
    if (g === 0) return { tipo: 'ninguna', raices: [], grado: 0 };
    if (g === 1) return { tipo: 'una', grado: 1, raices: [numRac(p[0].opuesto().entre(p[1]))] };
    if (g === 2) {
      var Q = S.solCuadratica(p[2], p[1], p[0]);
      return {
        tipo: Q.tipo === 'ninguna' ? 'ninguna' : (Q.tipo === 'doble' ? 'doble' : 'dos'),
        grado: 2, disc: Q.disc, cuad: Q,
        raices: Q.raices.map(numIrr)
      };
    }
    /* grado 3 o más: raíces racionales y después la cuadrática que queda */
    var rr = S.raicesRacionales(p), raices = [], resto = rr.resto, k, t;
    for (k = 0; k < rr.raices.length; k++) {
      for (t = 0; t < rr.raices[k].mult; t++) raices.push(numRac(rr.raices[k].raiz));
    }
    if (S.pGrado(resto) === 2) {
      var Q2 = S.solCuadratica(resto[2], resto[1], resto[0]);
      Q2.raices.forEach(function (ir) { raices.push(numIrr(ir)); });
    } else if (S.pGrado(resto) === 1) {
      raices.push(numRac(resto[0].opuesto().entre(resto[1])));
    }
    raices.sort(function (u, v) { return u.val - v.val; });
    return { tipo: raices.length ? 'varias' : 'ninguna', grado: g, raices: raices };
  }

  /* Evalúa un polinomio de una variable en un número exacto */
  function evalNum(p, N) {
    if (N.frac) {
      var s = F0(), k;
      for (k = p.length - 1; k >= 0; k--) s = s.por(N.frac).mas(p[k]);
      return numRac(s);
    }
    if (N.irr && S.pGrado(p) <= 1) {
      /* y = q0 + q1·(P + Q√R)/Sd  sigue siendo de la forma (p + q√r)/s */
      var q0 = p[0] || F0(), q1 = p[1] || F0();
      var e = Number(q0.n), f = Number(q0.d), gg = Number(q1.n), h = Number(q1.d);
      var ir = N.irr;
      return numIrr(new S.Irr(e * h * ir.s + gg * f * ir.p, gg * f * ir.q, ir.r, f * h * ir.s));
    }
    var v = 0, i;
    for (i = p.length - 1; i >= 0; i--) v = v * N.val + numF(p[i]);
    return numAprox(v);
  }

  /* Sustituye la variable idx (0 = x, 1 = y) por un polinomio de la otra */
  function sustituyeMp(P, idx, Q) {
    var res = [F0()], k;
    var claves = mpClaves(P);
    for (k = 0; k < claves.length; k++) {
      var e = claves[k].split(',').map(Number);
      var expSust = e[idx], expOtra = e[1 - idx];
      var t = S.pMono(P[claves[k]], expOtra);
      t = S.pMult(t, S.pPot(Q, expSust));
      res = S.pSuma(res, t);
    }
    return S.pRecorta(res);
  }

  function curvaDePoly(P, texto) {
    var A2 = mpCoef(P, [2, 0]), B2 = mpCoef(P, [1, 1]), C2 = mpCoef(P, [0, 2]);
    var D1 = mpCoef(P, [1, 0]), E1 = mpCoef(P, [0, 1]), Ff = mpCoef(P, [0, 0]);
    var g = mpGrado(P);
    if (g > 2) {
      throw Error('La ecuación «' + texto + '» tiene grado ' + g + '. En este tema los sistemas no lineales ' +
        'combinan rectas con parábolas, circunferencias o hipérbolas: el grado máximo es 2.');
    }
    var C = {
      poly: P, grado: g, tex: mpTex(P, ['x', 'y']) + ' = 0', txt: texto,
      coef: { x2: A2, xy: B2, y2: C2, x: D1, y: E1, k: Ff },
      f: null, fSup: null, fInf: null, param: null
    };
    if (g <= 1) {
      C.tipo = mpEsCero(P) ? 'todo' : ((cero(D1) && cero(E1)) ? 'vacia' : 'recta');
      if (C.tipo === 'recta') {
        C.recta = { a: D1, b: E1, c: Ff.opuesto() };
        C.tex = ecuTex([D1, E1], Ff.opuesto(), ['x', 'y']);
        if (!cero(E1)) {
          var m = D1.opuesto().entre(E1), n0 = Ff.opuesto().entre(E1);
          C.f = function (x) { return numF(m) * x + numF(n0); };
          C.pendiente = m; C.ordenada = n0;
        } else {
          C.vertical = numF(Ff.opuesto().entre(D1));
        }
      }
      return conDibujo(C);
    }
    /* cónicas */
    if (cero(B2) && !cero(A2) && !cero(C2)) {
      var razon = A2.entre(C2);
      if (igualF(razon, F1())) {
        /* x² + y² + Dx + Ey + F = 0  ->  centro y radio exactos */
        var d0 = D1.entre(A2), e0 = E1.entre(A2), f0 = Ff.entre(A2);
        var cx = d0.entre(new Frac(-2)), cy = e0.entre(new Frac(-2));
        var r2 = cx.por(cx).mas(cy.por(cy)).menos(f0);
        C.tipo = numF(r2) > 0 ? 'circunferencia' : (cero(r2) ? 'punto' : 'vacia');
        C.centro = { x: cx, y: cy };
        C.radio2 = r2;
        C.radio = Math.sqrt(Math.max(0, numF(r2)));
        C.param = { cx: numF(cx), cy: numF(cy), r: C.radio };
        C.tex = '\\left(x' + (pos(cx) ? ' - ' + fTex(cx) : (cero(cx) ? '' : ' + ' + fTex(absF(cx)))) + '\\right)^{2} + ' +
          '\\left(y' + (pos(cy) ? ' - ' + fTex(cy) : (cero(cy) ? '' : ' + ' + fTex(absF(cy)))) + '\\right)^{2} = ' + fTex(r2);
      } else if (pos(razon)) {
        C.tipo = 'elipse';
      } else {
        C.tipo = 'hiperbola';
      }
    } else if (!cero(B2) && cero(A2) && cero(C2)) {
      C.tipo = 'hiperbola';
      C.f = function (x) {
        var den = numF(B2) * x + numF(E1);
        if (Math.abs(den) < 1e-12) return NaN;
        return -(numF(D1) * x + numF(Ff)) / den;
      };
    } else if (!cero(A2) && cero(C2) && cero(B2) && !cero(E1)) {
      C.tipo = 'parabola';
      var pa = A2.opuesto().entre(E1), pb = D1.opuesto().entre(E1), pc = Ff.opuesto().entre(E1);
      C.f = function (x) { return numF(pa) * x * x + numF(pb) * x + numF(pc); };
      C.abc = { a: pa, b: pb, c: pc };
      var vx = pb.opuesto().entre(pa.por(new Frac(2)));
      var vy = pa.por(vx).por(vx).mas(pb.por(vx)).mas(pc);
      C.vertice = { x: vx, y: vy };
      C.param = { vx: numF(vx), vy: numF(vy) };
      C.tex = 'y = ' + S.pTex(S.pDe([pc, pb, pa]), 'x');
    } else if (!cero(C2) && cero(A2) && cero(B2) && !cero(D1)) {
      C.tipo = 'parabola';
      C.horizontal = true;
    } else {
      C.tipo = 'conica';
    }
    /* ramas generales resolviendo en y la cuadrática C2 y² + (B2x+E1) y + (A2x²+D1x+F) = 0 */
    if (!cero(C2)) {
      C.fSup = function (x) { return ramaY(x, 1); };
      C.fInf = function (x) { return ramaY(x, -1); };
    }
    function ramaY(x, s) {
      var A = numF(C2), B = numF(B2) * x + numF(E1), Cc = numF(A2) * x * x + numF(D1) * x + numF(Ff);
      var disc = B * B - 4 * A * Cc;
      if (disc < 0) return NaN;
      return (-B + s * Math.sqrt(disc)) / (2 * A);
    }
    return conDibujo(C);
  }

  /* Añade a una curva su método dibuja(opts) -> path SVG */
  function conDibujo(C) {
    C.puntoEtiqueta = function (win) {
      var x = win.xmin + (win.xmax - win.xmin) * 0.68, y;
      if (C.f) y = C.f(x);
      else if (C.fSup) y = C.fSup(x);
      if (y === undefined || !isFinite(y) || y < win.ymin || y > win.ymax) {
        if (C.param && C.param.cx !== undefined) return [C.param.cx, C.param.cy + C.param.r];
        return null;
      }
      return [x, y];
    };
    C.dibuja = function (opts) {
      opts = opts || {};
      var win = opts.win || { xmin: opts.xmin, xmax: opts.xmax, ymin: opts.ymin, ymax: opts.ymax };
      var X = opts.X, Y = opts.Y;
      if (!X || !Y) {
        var W = opts.W || 720, H = opts.H || 520, mL = 64, mR = 30, mT = 26, mB = 52;
        X = function (v) { return mL + (v - win.xmin) / (win.xmax - win.xmin) * (W - mL - mR); };
        Y = function (v) { return H - mB - (v - win.ymin) / (win.ymax - win.ymin) * (H - mT - mB); };
      }
      var col = opts.color || COL.verde, an = opts.ancho || 3.2, dash = opts.dash;
      var N = opts.N || 900, out = '';
      var margen = (win.ymax - win.ymin);

      function rama(fn) {
        var d = '', dentro = false, i;
        for (i = 0; i <= N; i++) {
          var x = win.xmin + (win.xmax - win.xmin) * i / N;
          var y;
          try { y = fn(x); } catch (e) { y = NaN; }
          if (!isFinite(y) || y < win.ymin - margen || y > win.ymax + margen) { dentro = false; continue; }
          d += (dentro ? ' L ' : ' M ') + X(x).toFixed(1) + ' ' + Y(y).toFixed(1);
          dentro = true;
        }
        return d ? S.path(d, col, an, 'none', dash) : '';
      }
      if (C.tipo === 'recta') {
        if (C.f) out += rama(C.f);
        else if (C.vertical !== undefined) {
          out += S.path('M ' + X(C.vertical).toFixed(1) + ' ' + Y(win.ymin).toFixed(1) +
            ' L ' + X(C.vertical).toFixed(1) + ' ' + Y(win.ymax).toFixed(1), col, an, 'none', dash);
        }
      } else if (C.f && !C.fSup) {
        out += rama(C.f);
      } else if (C.fSup) {
        out += rama(C.fSup);
        out += rama(C.fInf);
      } else if (C.f) {
        out += rama(C.f);
      }
      return out;
    };
    return C;
  }

  function curva(txt) {
    var vars = ['x', 'y'];
    var tr = partePorIgual(txt);
    var L = parseMulti(tr[0], vars, 'el primer miembro de la ecuación');
    var R = parseMulti(tr[1], vars, 'el segundo miembro de la ecuación');
    var C = curvaDePoly(mpSub(L, R), String(txt));
    C.texOriginal = normaliza(txt);
    return C;
  }

  function noLineal(txt1, txt2) {
    var c1 = curva(txt1), c2 = curva(txt2);
    var pasos = [];
    pasos.push({
      desc: 'Escribimos el sistema con las dos ecuaciones.',
      tex: '\\left\\{\\begin{array}{l}' + c1.tex + ' \\\\ ' + c2.tex + '\\end{array}\\right.'
    });
    var lin = null, otra = null, cual = 0;
    if (c1.grado <= 1) { lin = c1; otra = c2; cual = 1; }
    else if (c2.grado <= 1) { lin = c2; otra = c1; cual = 2; }

    if (!lin) {
      /* dos cónicas: intentamos restarlas para que quede una recta */
      var k = null;
      var a1 = c1.coef.x2, b1 = c1.coef.xy, d1 = c1.coef.y2;
      var a2 = c2.coef.x2, b2 = c2.coef.xy, d2 = c2.coef.y2;
      if (!cero(a2)) k = a1.entre(a2);
      else if (!cero(d2)) k = d1.entre(d2);
      else if (!cero(b2)) k = b1.entre(b2);
      var sirve = false;
      if (k !== null) {
        sirve = cero(a1.menos(k.por(a2))) && cero(b1.menos(k.por(b2))) && cero(d1.menos(k.por(d2)));
      }
      if (sirve) {
        var Pl = mpSub(c1.poly, mpScale(c2.poly, k));
        if (mpGrado(Pl) <= 1 && !mpEsCero(Pl)) {
          lin = curvaDePoly(Pl, 'ecuación obtenida al restar');
          otra = c2; cual = 0;
          pasos.push({
            desc: 'Las dos ecuaciones tienen la misma parte cuadrática: al restarlas (la primera menos ' +
              fTex(k) + ' veces la segunda) desaparecen los cuadrados y queda una recta.',
            tex: lin.tex
          });
        }
      }
      if (!lin) {
        /* dos curvas del tipo y = f(x): las igualamos */
        var f1 = despejaY(c1), f2 = despejaY(c2);
        if (f1 && f2) {
          var P = S.pResta(f1, f2);
          pasos.push({
            desc: 'Despejamos $y$ en las dos ecuaciones y las igualamos, porque las dos valen $y$.',
            tex: S.pTex(f1, 'x') + ' = ' + S.pTex(f2, 'x')
          });
          return remataIgualacion(P, f1, c1, c2, pasos);
        }
        throw Error('No sé resolver a mano este sistema no lineal. En este tema se combinan: una recta con una ' +
          'parábola, una recta con una circunferencia, una recta con una hipérbola xy = k, dos circunferencias, ' +
          'o dos funciones del tipo y = f(x). Escribe las ecuaciones así: «y=x^2-1» y «y=2x+2».');
      }
    }

    var la = lin.coef.x, lb = lin.coef.y, lk = lin.coef.k;
    var soluciones = [], sol, tipoSis = 'finitas';
    if (!cero(lb)) {
      /* y = (-k - a x)/b */
      var Q = [lk.opuesto().entre(lb), la.opuesto().entre(lb)];
      pasos.push({
        desc: 'Despejamos $y$ en la ecuación lineal.',
        tex: 'y = ' + S.pTex(S.pRecorta(Q), 'x')
      });
      var P2 = sustituyeMp(otra.poly, 1, Q);
      pasos.push({
        desc: 'Sustituimos en la otra ecuación: queda una ecuación con una sola incógnita.',
        tex: S.pTex(P2, 'x') + ' = 0'
      });
      sol = solUni(P2);
      sol.raices.forEach(function (rx) {
        var ry = evalNum(Q, rx);
        soluciones.push(parSol(rx, ry));
      });
      if (sol.tipo === 'infinitas') tipoSis = 'infinitas';
      if (sol.tipo === 'ninguna') tipoSis = 'ninguna';
    } else {
      var xv = lk.opuesto().entre(la);
      pasos.push({ desc: 'La ecuación lineal da directamente el valor de $x$.', tex: 'x = ' + fTex(xv) });
      var P3 = sustituyeMp(otra.poly, 0, [xv]);
      pasos.push({
        desc: 'Sustituimos ese valor en la otra ecuación y resolvemos en $y$.',
        tex: S.pTex(P3, 'y') + ' = 0'
      });
      sol = solUni(P3);
      sol.raices.forEach(function (ry) { soluciones.push(parSol(numRac(xv), ry)); });
      if (sol.tipo === 'infinitas') tipoSis = 'infinitas';
      if (sol.tipo === 'ninguna') tipoSis = 'ninguna';
    }
    pasos.push({ desc: textoSoluciones(soluciones, tipoSis), tex: solucionesTex(soluciones) });
    return {
      pasos: pasos, soluciones: soluciones, tipo: tipoSis, curvas: [c1, c2],
      lineal: lin, otra: otra, cualLineal: cual, uni: sol,
      sistemaTex: '\\left\\{\\begin{array}{l}' + c1.tex + ' \\\\ ' + c2.tex + '\\end{array}\\right.'
    };
  }

  /* y = f(x) si se puede: coeficiente de y constante y sin y² ni xy */
  function despejaY(C) {
    if (!cero(C.coef.y2) || !cero(C.coef.xy) || cero(C.coef.y)) return null;
    var e = C.coef.y;
    return S.pRecorta([C.coef.k.opuesto().entre(e), C.coef.x.opuesto().entre(e), C.coef.x2.opuesto().entre(e)]);
  }
  function remataIgualacion(P, f1, c1, c2, pasos) {
    var sol = solUni(P);
    pasos.push({ desc: 'Resolvemos la ecuación resultante.', tex: S.pTex(P, 'x') + ' = 0' });
    var soluciones = [];
    sol.raices.forEach(function (rx) {
      var ry = rx.frac ? evalNum(f1, rx) : numAprox(evalNumFlot(f1, rx.val));
      soluciones.push(parSol(rx, ry));
    });
    var tipoSis = sol.tipo === 'infinitas' ? 'infinitas' : (soluciones.length ? 'finitas' : 'ninguna');
    pasos.push({ desc: textoSoluciones(soluciones, tipoSis), tex: solucionesTex(soluciones) });
    return {
      pasos: pasos, soluciones: soluciones, tipo: tipoSis, curvas: [c1, c2], uni: sol,
      sistemaTex: '\\left\\{\\begin{array}{l}' + c1.tex + ' \\\\ ' + c2.tex + '\\end{array}\\right.'
    };
  }
  function evalNumFlot(p, x) {
    var v = 0, i;
    for (i = p.length - 1; i >= 0; i--) v = v * x + numF(p[i]);
    return v;
  }
  function parSol(NX, NY) {
    return {
      x: valorDe(NX), y: valorDe(NY),
      xv: NX.val, yv: NY.val,
      exacto: NX.exacto && NY.exacto,
      racional: NX.racional && NY.racional,
      numX: NX, numY: NY,
      tex: '\\left(' + NX.tex + ',\\ ' + NY.tex + '\\right)'
    };
  }
  function solucionesTex(sols) {
    if (!sols.length) return '\\varnothing';
    return sols.map(function (s, i) { return 'P_{' + (i + 1) + '} = ' + s.tex; }).join(', \\quad ');
  }
  function textoSoluciones(sols, tipo) {
    if (tipo === 'infinitas') return 'Las dos ecuaciones son equivalentes: hay <strong>infinitas soluciones</strong>.';
    if (!sols.length) return 'La ecuación no tiene solución real: las dos curvas <strong>no se cortan</strong>.';
    if (sols.length === 1) return 'Hay <strong>una única solución</strong>: las curvas son tangentes o se tocan en un punto.';
    return 'Hay <strong>' + sols.length + ' soluciones</strong>: cada valor de una incógnita se lleva a la ' +
      'expresión despejada para obtener la otra. Conviene comprobar cada par en las dos ecuaciones iniciales.';
  }

  /* ==================================================================
     11 · exportación a window.SYS
     ================================================================== */
  S.parseMulti = parseMulti;
  S.mpTex = mpTex;
  S.mpGrado = mpGrado;
  S.mpCoef = mpCoef;
  S.mpEval = mpEval;
  S.parseEcu = parseEcu;
  S.parseSistema = parseSistema;
  S.sisTex = sisTex;
  S.ecuTex = ecuTex;
  S.parseInec = parseInec;
  S.parseInecs = parseInecs;
  S.inecTex = inecTex;

  S.Mat = Mat;
  S.matDe = matDe;
  S.matTex = matTex;
  S.matAmpliada = matAmpliada;
  S.matIdent = matIdent;
  S.matTraspuesta = matTraspuesta;
  S.matPor = matPor;
  S.matPorVector = matPorVector;

  S.gauss = gauss;
  S.rango = rango;
  S.det = det;
  S.detPasos = detPasos;
  S.menorMat = menor;
  S.discute = discute;
  S.resuelve = resuelve;
  S.compruebaSol = compruebaSol;

  S.sustitucion = sustitucion;
  S.igualacion = igualacion;
  S.reduccion = reduccion;
  S.cramer = cramer;

  S.plano = plano;
  /* Convierte un rótulo en texto llano apto para un <text> de SVG.
     Único modo correcto de rotular una figura: dentro del SVG no hay
     KaTeX. Si se quiere la fórmula compuesta, va fuera con S.K. */
  S.textoPlano = textoPlano;
  S.corte = corte;
  S.rectaDe = rectaDe;
  S.rectaTex = rectaTex;
  S.explicitaTex = explicitaTex;
  S.puntoTex = puntoTex;
  S.cumple = cumple;
  S.vertices = vertices;
  S.recintoAcotado = recintoAcotado;
  S.evalObjetivo = evalObjetivo;

  S.curva = curva;
  S.noLineal = noLineal;
  S.solUni = solUni;
  S.fracDe = F;
  S.fracTex = fTex;

  S.lineal = true;
  if (S.monta) S.monta();
})();
