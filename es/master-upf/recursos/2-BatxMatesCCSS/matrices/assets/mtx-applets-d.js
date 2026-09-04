/* =====================================================================
   mtx-applets-d.js · Módulo D del Tema 1 «Matrices»
   2.º de Bachillerato · Matemáticas Aplicadas a las Ciencias Sociales
   Ruta: 2-BatxMatesCCSS/matrices/assets/mtx-applets-d.js

   Cubre los apartados 1.14 a 1.17 del tema:

     1.14  Matriz inversa y sus propiedades.
     1.15  Método de Gauss-Jordan para el cálculo de la inversa.
     1.16  Ecuaciones matriciales.
     1.17  Práctica del tema (autoevaluación).

   ---------------------------------------------------------------------
   CLAVES REGISTRADAS (7)
   ---------------------------------------------------------------------
     inversaExiste       ¿Cuándo tiene inversa una matriz? Matriz
                         cuadrada editable: dimensión, determinante con
                         sus pasos, rango, veredicto REGULAR o SINGULAR
                         y la explicación razonada de por qué una matriz
                         singular no puede tener inversa (si existiera X
                         con AX = I, el rango de I sería menor que n).
                         Escenarios de matrices casi singulares, con
                         determinante 1 o −1, y de matrices cuya inversa
                         tiene elementos fraccionarios.
     inversaDef          La inversa POR DEFINICIÓN. Plantea A·X = I con
                         las incógnitas x, y, z, t de X (orden 2), separa
                         los DOS sistemas de ecuaciones (uno por cada
                         columna de la identidad), los resuelve por
                         Gauss-Jordan sobre la matriz ampliada, monta la
                         inversa columna a columna y comprueba también
                         X·A = I. Si la matriz es singular, enseña que
                         los sistemas son incompatibles.
     inversa2x2          Fórmula rápida del orden 2:
                         A^{-1} = 1/(ad − bc) · (d, −b; −c, a).
                         Identificación de a, b, c, d, determinante paso
                         a paso, matriz adjunta transpuesta, división por
                         el determinante y comprobación del producto por
                         los dos lados. Avisa de que la fórmula vale SOLO
                         para el orden 2.
     gaussJordan         Método de Gauss-Jordan sobre la matriz ampliada
                         (A | I), de orden 2, 3 o 4, con dos modos:
                         · automático: todos los pasos hasta (I | A⁻¹),
                           con la notación F_i -> F_i − k F_j y la línea
                           vertical separadora bien visible;
                         · manual: el alumno propone cada operación
                           elemental, el applet la valida, la aplica sobre
                           la matriz ampliada COMPLETA y le dice si se ha
                           acercado a la identidad.
                         En los dos modos detecta la matriz singular en
                         cuanto aparece una fila nula en el bloque
                         izquierdo y explica qué significa.
     ecuacionMatricial   Resolutor de ecuaciones matriciales de los cinco
                         tipos AX=B, XA=B, AX+B=C, XA+B=C y AXB=C (más el
                         caso extra AX=B+X). Razona explícitamente por qué
                         se multiplica por A⁻¹ por la izquierda o por la
                         derecha, avisa de que la división de matrices NO
                         existe y de que el producto no es conmutativo
                         (lo demuestra calculando A⁻¹B y BA⁻¹ con las
                         matrices del alumno) y termina comprobando la
                         solución sustituyéndola en la ecuación.
     despeja             Entrenador de despeje: cuestiones de opción
                         múltiple sobre el paso siguiente al despejar,
                         tomadas de M.pasoDespeje, con corrección
                         inmediata, explicación del error típico
                         cometido (dividir matrices, multiplicar por el
                         lado equivocado, olvidar el orden del producto)
                         y marcador acumulado.
     autoevaluacion      Generador aleatorio de cuestiones de TODO el
                         tema: dimensiones, tipos de matriz, transpuesta,
                         suma y resta, producto, potencias, rango,
                         inversa y ecuaciones matriciales. Semilla
                         reproducible, corrección inmediata, solución
                         paso a paso y marcador acumulado con figura.

   El applet `diagnostico` vive en el núcleo: aquí no se reprograma.

   ---------------------------------------------------------------------
   DEPENDENCIAS
   ---------------------------------------------------------------------
   Necesita, cargados antes:
     · el núcleo  mtx-applets.js      (window.MTX)
     · la capa    mtx-applets-alg.js  (álgebra matricial exacta)

   De la capa de álgebra se usan literalmente, sin reimplementar ni una
   sola cuenta:
     parseMat, matDe, matTxt, matTex, matIdentidad, matPegada, matAmpliada,
     matAleatoria, dimTex, dimTxt, matIgual, difIguales, clasifica,
     matProd, matSuma, matResta, matTrans, matPot, matEscalar, gauss,
     rango, rangoPasos, opElemental, det, detPasos, inversa, inversaPasos,
     inversa2x2, ecuMatricial, pasoDespeje, fracDe, fracTex.
   Del núcleo: shell, registry, K, KD, esc, texifica, expr, paso, tabla,
   badge, kvs, resultado, svgWrap, txt, line, rect, circle, COL y Frac.

   ---------------------------------------------------------------------
   CRITERIOS DIDÁCTICOS Y DE PRESENTACIÓN
   ---------------------------------------------------------------------
   1. Aritmética EXACTA con M.Frac (BigInt): la inversa de una matriz de
      determinante 2 sale con 1/2 y −3/2, nunca con 0,5 ni 0,3333.
   2. Matrices GRANDES: todas van en display dentro de .mtxd-caja, que
      fuerza celdas de fuente >= 20 px, y los rótulos van a 16 px en
      negrita. La matriz ampliada (A | I) se dibuja con matTex({aug:n}),
      que pone la línea vertical separadora.
   3. Dentro de un <svg> NO hay KaTeX: en los <text> solo se escribe
      texto llano («det = −3», «rg = 2», «no tiene inversa») con el signo
      menos tipográfico U+2212. Las fórmulas bonitas van fuera, en el pie
      de la figura.
   4. Convención española: coma decimal en los textos y {,} dentro de
      KaTeX.
   5. Ninguna entrada mala rompe la página: todo el cómputo va envuelto en
      safe(), que convierte cualquier Error en un aviso explicativo dentro
      del applet, con un ejemplo copiable de entrada correcta.
   6. El título lo pone M.shell como «Applet · <titulo>»: los applets NO
      se numeran.

   Clases CSS propias: prefijo `mtxd-`, añadidas al final de
   mtx-applets.css sin tocar ninguna regla anterior.
   ===================================================================== */
(function () {
  'use strict';

  var M = window.MTX;
  if (!M) {
    if (window.console && console.error) {
      console.error('[matrices] mtx-applets-d.js necesita mtx-applets.js cargado antes.');
    }
    return;
  }

  var R = M.registry;
  var K = M.K, KD = M.KD, COL = M.COL;
  var Frac = M.Frac;

  /* ==================================================================
     0 · utilidades locales del módulo
     ================================================================== */

  /* Acceso perezoso a la capa de álgebra: si falta, el aviso es claro. */
  function alg() {
    if (!M.parseMat || !M.inversaPasos || !M.ecuMatricial) {
      throw Error('No se ha cargado la capa de álgebra matricial (mtx-applets-alg.js). ' +
        'Recarga la página; si el aviso sigue, avisa al profesor.');
    }
    return M;
  }

  function FR(v) { return alg().fracDe(v); }
  function FT(f) { return alg().fracTex(f, true); }
  function F0() { return new Frac(0); }
  function F1() { return new Frac(1); }
  function cero(f) { return f.n === 0n; }
  function igF(a, b) { return a.cmp(b) === 0; }
  function numF(f) { return Number(f.n) / Number(f.d); }

  /* Fracción exacta en TEXTO LLANO para los rótulos de los SVG:
     «8/5», «−3/5», «2». Signo menos tipográfico U+2212. */
  function fracTxt(f) {
    var n = String(f.n), d = String(f.d), neg = false;
    if (n.charAt(0) === '-') { n = n.slice(1); neg = !neg; }
    if (d.charAt(0) === '-') { d = d.slice(1); neg = !neg; }
    return (neg ? '\u2212' : '') + n + (d === '1' ? '' : '/' + d);
  }
  /* Entero o número corriente en texto llano, con menos tipográfico. */
  function numTxt(x) { return M.etq(x, 3); }

  /* Botones de escenario a partir de una lista { txt, tip, set, extra }. */
  function chips(list) {
    return {
      type: 'presets',
      list: list.map(function (p) {
        return {
          label: p.txt, title: p.tip || '',
          apply: function (ctl) {
            Object.keys(p.set || {}).forEach(function (k) {
              var el = ctl[k];
              if (!el) return;
              if (el.type === 'checkbox') el.checked = !!p.set[k];
              else el.value = String(p.set[k]);
              if (typeof el._sincroniza === 'function') el._sincroniza();
            });
            if (p.extra) p.extra(ctl);
          }
        };
      })
    };
  }

  /* Envoltorio: cualquier error se convierte en un aviso amable dentro
     del applet, nunca en un error que rompa la página. */
  function safe(fn, ayuda) {
    return function (v, ctl, out, api) {
      try {
        var h = fn(v, ctl, out, api);
        return (h === undefined || h === null || h === '')
          ? '<div class="mx-bad mtxd-err">No hay nada que mostrar todavía: revisa los datos que has escrito. ' +
            (ayuda || EJEMPLO) + '</div>'
          : h;
      } catch (e) {
        var m = (e && e.message) ? e.message : 'No he podido calcular con estos datos.';
        return '<div class="mx-bad mtxd-err">' + M.esc(m) +
          (ayuda ? '<br>' + ayuda : '') + '</div>';
      }
    };
  }

  /* Piezas de salida estándar del módulo. */
  function caja(label, tex) {
    return '<div class="mtxd-caja">' + M.expr(label, tex) + '</div>';
  }
  function parrafo(html) { return '<p class="mtxd-txt">' + html + '</p>'; }
  function titulo(t) { return '<h5 class="mtxd-h">' + t + '</h5>'; }
  function aviso(html) { return '<p class="mtxd-aviso">' + html + '</p>'; }
  function pista(html) { return '<p class="mtxd-pista"><b>Pista:</b> ' + html + '</p>'; }
  function bien(html) { return '<p class="ap-ok mtxd-bien">' + html + '</p>'; }
  function mal(html) { return '<p class="ap-ko mtxd-mal">' + html + '</p>'; }
  function op(tex) { return '<div class="mtxd-op">' + KD(tex) + '</div>'; }

  var EJEMPLO = 'Escribe la matriz por filas: <code>2 1; 1 1</code> (o una fila por línea). ' +
    'Puedes usar fracciones: <code>1/2 3; 0 -2</code>.';

  /* ------------------------------------------------------------------
     Lectura de matrices con límites de tamaño y avisos didácticos.
     ------------------------------------------------------------------ */
  function leeM(txtIn, etiqueta, maxF, maxC) {
    etiqueta = etiqueta || 'la matriz';
    var s = String(txtIn === undefined || txtIn === null ? '' : txtIn).trim();
    if (s === '') {
      throw Error('Escribe ' + etiqueta + ' por filas, separando los elementos con espacios y las ' +
        'filas con «;» o con un salto de línea. Por ejemplo: 2 1; 1 1. También valen las fracciones: 1/2 3; 0 -2.');
    }
    var A = alg().parseMat(s);
    if (maxF && A.f > maxF) {
      throw Error('Este applet trabaja con un máximo de ' + maxF + ' filas y has escrito ' + A.f +
        '. Quita alguna fila: así la matriz se ve grande y legible en pantalla.');
    }
    if (maxC && A.c > maxC) {
      throw Error('Este applet trabaja con un máximo de ' + maxC + ' columnas y has escrito ' + A.c +
        '. Quita alguna columna para que la matriz se vea bien.');
    }
    return A;
  }

  /* Lee una matriz y EXIGE que sea cuadrada, con explicación si no lo es. */
  function leeCuadrada(txtIn, etiqueta, maxN) {
    var A = leeM(txtIn, etiqueta, maxN || 4, maxN || 4);
    if (A.f !== A.c) {
      throw Error('Solo las matrices CUADRADAS pueden tener inversa, y ' + etiqueta + ' es de ' +
        A.f + '×' + A.c + '. La inversa debe cumplir A·A⁻¹ = A⁻¹·A = I, y para que los dos ' +
        'productos existan y den la misma matriz identidad hacen falta tantas filas como columnas. ' +
        'Prueba con 2 1; 1 1.');
    }
    return A;
  }

  /* Lee una matriz de orden exactamente n. */
  function leeOrden(txtIn, etiqueta, n) {
    var A = leeCuadrada(txtIn, etiqueta, 4);
    if (A.f !== n) {
      throw Error('Este applet necesita ' + etiqueta + ' de orden ' + n + ' y has escrito una de orden ' +
        A.f + '. Escribe ' + n + ' filas con ' + n + ' elementos cada una, por ejemplo 2 1; 1 1.');
    }
    return A;
  }

  /* Nombre de un elemento de la matriz en TeX. */
  function aTex(i, j, letra) { return (letra || 'a') + '_{' + (i + 1) + (j + 1) + '}'; }

  /* ¿Tiene el bloque izquierdo (n primeras columnas) alguna fila nula? */
  function filaNulaIzq(Mt, n) {
    var i, j;
    for (i = 0; i < Mt.f; i++) {
      var todo = true;
      for (j = 0; j < n; j++) if (!cero(Mt.a[i][j])) { todo = false; break; }
      if (todo) return i;
    }
    return -1;
  }

  /* Distancia a la identidad del bloque izquierdo: cuántos elementos
     hay que arreglar todavía. Sirve para juzgar el modo manual. */
  function lejosDeI(Mt, n) {
    var d = 0, i, j;
    for (i = 0; i < Mt.f; i++) {
      for (j = 0; j < n; j++) {
        var esperado = (i === j) ? 1 : 0;
        if (!igF(Mt.a[i][j], new Frac(esperado))) d++;
      }
    }
    return d;
  }
  function bloque(Mt, desde, hasta) {
    var a = [], i, j;
    for (i = 0; i < Mt.f; i++) {
      var fila = [];
      for (j = desde; j < hasta; j++) fila.push(Mt.a[i][j]);
      a.push(fila);
    }
    return new (alg().Mat)(a);
  }

  /* ==================================================================
     1 · figuras (SVG con rótulos en TEXTO LLANO, nunca LaTeX)
     ================================================================== */

  /* Veredicto regular / singular, con los datos de la matriz debajo. */
  function figVeredicto(info) {
    var W = 900, H = 470, b = '';
    var regular = !!info.regular;
    b += M.rect(0, 0, W, H, '#ffffff', '#e3e9ef', { r: 10 });
    b += M.txt(W / 2, 52, 'Cuando una matriz cuadrada tiene inversa', { size: 24, weight: '700', fill: COL.azulOsc });

    var cajas = [
      {
        x: 60, tit: 'MATRIZ REGULAR', activa: regular, col: COL.verde,
        l1: 'det distinto de 0', l2: 'rango = orden', l3: 'SI tiene inversa'
      },
      {
        x: 480, tit: 'MATRIZ SINGULAR', activa: !regular, col: COL.rojo,
        l1: 'det = 0', l2: 'rango menor que el orden', l3: 'NO tiene inversa'
      }
    ];
    cajas.forEach(function (c) {
      b += M.rect(c.x, 92, 360, 210, c.activa ? (c.col === COL.verde ? '#eef8ef' : '#fdecea') : '#f7f9fb',
        c.activa ? c.col : '#cfd8dc', { r: 12, sw: c.activa ? 4 : 2 });
      b += M.txt(c.x + 180, 132, c.tit, { size: 22, weight: '700', fill: c.activa ? c.col : COL.gris });
      b += M.txt(c.x + 180, 182, c.l1, { size: 20, weight: '600', fill: COL.texto });
      b += M.txt(c.x + 180, 227, c.l2, { size: 20, weight: '600', fill: COL.texto });
      b += M.txt(c.x + 180, 275, c.l3, { size: 21, weight: '700', fill: c.activa ? c.col : COL.gris });
    });

    b += M.txt(W / 2, 356, info.ordenTxt || ('Tu matriz es de orden ' + info.orden), { size: 21, weight: '700', fill: COL.azulOsc });
    b += M.txt(W / 2, 398, 'determinante = ' + info.detTxt + '   y   rango = ' + info.rango,
      { size: 21, weight: '700', fill: regular ? COL.verde : COL.rojo });
    b += M.txt(W / 2, 440, regular ? 'conclusión: es regular y tiene inversa'
      : 'conclusión: es singular y no tiene inversa',
      { size: 20, weight: '600', fill: regular ? COL.verde : COL.rojo });
    return M.svgWrap(b, W, H, 'Veredicto: matriz regular o singular',
      'El criterio es único: ' + K('\\det(A) \\ne 0 \\iff \\operatorname{rg}(A) = n \\iff \\text{existe } A^{-1}') + '.');
  }

  /* Barra de avance del método de Gauss-Jordan. */
  function figAvance(hechas, faltan, listo, singular) {
    var W = 900, H = 300, b = '';
    var total = Math.max(1, hechas + faltan);
    var frac = Math.min(1, hechas / total);
    b += M.rect(0, 0, W, H, '#ffffff', '#e3e9ef', { r: 10 });
    b += M.txt(W / 2, 50, 'Camino de la matriz ampliada hacia la identidad',
      { size: 23, weight: '700', fill: COL.azulOsc });
    b += M.rect(70, 96, 760, 54, '#eef4fc', '#b3c7e6', { r: 10, sw: 2 });
    b += M.rect(70, 96, Math.max(6, 760 * frac), 54,
      singular ? '#ef9a9a' : (listo ? '#a5d6a7' : '#90caf9'),
      singular ? COL.rojo : (listo ? COL.verde : COL.azul), { r: 10, sw: 2 });
    b += M.txt(70, 190, 'a la izquierda: la matriz A', { size: 19, weight: '700', fill: COL.texto, anchor: 'start' });
    b += M.txt(830, 190, 'a la derecha: la identidad I', { size: 19, weight: '700', fill: COL.texto, anchor: 'end' });
    b += M.txt(W / 2, 240, singular
      ? 'ha aparecido una fila de ceros: la matriz es singular'
      : (listo ? 'ya se ha llegado a la identidad: a la derecha está la inversa'
        : 'elementos del bloque izquierdo que faltan por colocar: ' + faltan),
      { size: 21, weight: '700', fill: singular ? COL.rojo : (listo ? COL.verde : COL.azul) });
    b += M.txt(W / 2, 278, 'operaciones aplicadas: ' + hechas, { size: 19, weight: '600', fill: COL.gris });
    return M.svgWrap(b, W, H, 'Avance del método de Gauss-Jordan',
      'El objetivo es transformar ' + K('(A \\mid I)') + ' en ' + K('(I \\mid A^{-1})') +
      ' usando solo operaciones elementales de filas.');
  }

  /* Marcador de aciertos y fallos. */
  function figMarcador(aciertos, fallos) {
    var W = 900, H = 400, b = '';
    var total = Math.max(1, aciertos + fallos);
    var base = 300, alto = 170;
    b += M.rect(0, 0, W, H, '#ffffff', '#e3e9ef', { r: 10 });
    b += M.txt(W / 2, 48, 'Marcador de la autoevaluación', { size: 23, weight: '700', fill: COL.azulOsc });
    var barras = [
      { x: 200, v: aciertos, col: COL.verde, fondo: '#e8f5e9', et: 'aciertos' },
      { x: 560, v: fallos, col: COL.rojo, fondo: '#fdecea', et: 'fallos' }
    ];
    barras.forEach(function (br) {
      var h = Math.max(8, alto * br.v / total);
      b += M.rect(br.x, base - h, 150, h, br.fondo, br.col, { r: 8, sw: 3 });
      b += M.txt(br.x + 75, base - h - 18, String(br.v), { size: 24, weight: '700', fill: br.col });
      b += M.txt(br.x + 75, base + 36, br.et, { size: 20, weight: '700', fill: COL.texto });
    });
    b += M.txt(W / 2, base + 84, 'contestadas: ' + (aciertos + fallos) +
      '   ·   porcentaje de aciertos: ' + Math.round(100 * aciertos / total) + ' %',
      { size: 20, weight: '600', fill: COL.gris });
    return M.svgWrap(b, W, H, 'Marcador de aciertos y fallos',
      'El marcador guarda una sola respuesta por cuestión: si la corriges, se queda la última.');
  }

  /* ==================================================================
     2 · Tema 1.14 · ¿cuándo tiene inversa una matriz?
     ================================================================== */
  R.inversaExiste = function (node) {
    return M.shell(node, '¿Cuándo tiene inversa una matriz?',
      'Escribe una matriz <b>cuadrada</b> por filas: <code>2 1; 1 1</code> (o una fila por línea). ' +
      'Puedes usar fracciones: <code>1/2 3; 0 -2</code> y decimales con coma: <code>0,5 1; 2 3</code>. ' +
      'El applet calcula el <b>determinante</b> con sus pasos, el <b>rango</b> y da el veredicto: ' +
      'matriz <b>regular</b> (tiene inversa) o <b>singular</b> (no la tiene). Prueba los escenarios de ' +
      'matrices <i>casi singulares</i>: basta cambiar un número para que el determinante se anule.',
      [
        {
          id: 'A', label: 'Matriz A (una fila por línea)', type: 'textarea', rows: 4,
          value: '2 1\n1 1', ancho: '16rem'
        },
        {
          id: 'verInv', label: 'Enseñar la inversa si existe', type: 'check', value: true, ancho: '13rem'
        },
        chips([
          { txt: 'Regular sencilla · det = 1', tip: 'inversa de números enteros', set: { A: '2 1\n1 1' } },
          { txt: 'Inversa con fracciones · det = 2', tip: 'aparecen 1/2 y −3/2', set: { A: '4 6\n1 2' } },
          { txt: 'Casi singular · det = −1', tip: 'a punto de perder la inversa', set: { A: '1 2\n3 5' } },
          { txt: 'Singular · filas proporcionales', tip: 'F₂ = 2F₁, det = 0', set: { A: '1 2\n2 4' } },
          { txt: 'Singular 3×3 · F₃ = F₁ + F₂', tip: 'rango 2 en una matriz de orden 3', set: { A: '1 2 3\n2 1 0\n3 3 3' } },
          { txt: 'Regular 3×3', tip: 'det distinto de 0', set: { A: '1 2 3\n0 1 4\n5 6 0' } },
          { txt: 'Identidad de orden 3', tip: 'es su propia inversa', set: { A: '1 0 0\n0 1 0\n0 0 1' } },
          { txt: 'Triangular con un 0 en la diagonal', tip: 'det = 0 aunque parezca inofensiva', set: { A: '2 5 1\n0 0 7\n0 0 3' } },
          { txt: 'Matriz nula', tip: 'el caso extremo', set: { A: '0 0\n0 0' } },
          { txt: 'No cuadrada (aviso)', tip: 'una matriz 2×3 no puede tener inversa', set: { A: '1 2 3\n4 5 6' } }
        ])
      ],
      safe(function (v) {
        var A = leeM(v.A, 'la matriz A', 4, 4);
        if (A.f !== A.c) {
          /* No es un error del alumno: es un caso que conviene explicar. */
          return caja('Matriz A, de dimensión ' + alg().dimTxt(A), alg().matTex(A)) +
            mal('<b>Esta matriz no puede tener inversa: no es cuadrada.</b>') +
            parrafo('La inversa se define por la condición ' + K('A\\cdot A^{-1} = A^{-1}\\cdot A = I') +
              '. Si ' + K('A') + ' es de ' + alg().dimTxt(A) + ', para que exista el producto ' +
              K('A\\cdot X') + ' la matriz ' + K('X') + ' tendría que ser de ' + A.c + '×' + A.f +
              ', y entonces ' + K('A\\cdot X') + ' sería de orden ' + A.f + ' mientras que ' +
              K('X\\cdot A') + ' sería de orden ' + A.c + ': <b>dos identidades de tamaños distintos</b>. ' +
              'Por eso la inversa solo se define para matrices <b>cuadradas</b>.') +
            pista('Quita una columna o añade una fila y vuelve a probar, por ejemplo con ' +
              '<code>2 1; 1 1</code>.') +
            figVeredicto({
            regular: false, orden: A.f, rango: alg().rango(A), detTxt: 'no existe',
            ordenTxt: 'Tu matriz es de dimensión ' + A.f + ' por ' + A.c + ', no es cuadrada'
          });
        }
        var n = A.f;
        var C = alg().clasifica(A);
        var D = alg().det(A);
        var DP = alg().detPasos(A);
        var r = C.rango;
        var regular = !cero(D);

        var h = caja('Matriz A, cuadrada de orden ' + n, alg().matTex(A));

        h += titulo('Paso 1 · el determinante');
        h += parrafo('El determinante es el número que decide todo. Para el orden 2 es ' +
          K('ad - bc') + '; para el orden 3 se usa la regla de Sarrus; para órdenes mayores, el ' +
          'desarrollo por una fila.');
        h += caja('Cálculo del determinante', DP.tex);
        h += M.resultado(K('\\det(A) = ' + FT(D)), 'determinante de la matriz');

        h += titulo('Paso 2 · el rango');
        var RP = alg().rangoPasos(A);
        h += parrafo('Escalonando por Gauss quedan ' + K(String(RP.rango)) + ' fila(s) no nula(s), ' +
          'así que ' + K('\\operatorname{rg}(A) = ' + r) + '. El rango de una matriz de orden ' + n +
          ' nunca puede pasar de ' + K(String(n)) + '.');
        h += caja('Forma escalonada, con los pivotes marcados',
          alg().matTex(RP.fin, { marca: RP.pivotes }));

        h += titulo('Paso 3 · el veredicto');
        h += M.tabla(['Criterio', 'Valor', 'Lectura'], [
          [K('\\det(A)'), K(FT(D)), regular ? 'distinto de cero' : 'igual a cero'],
          [K('\\operatorname{rg}(A)'), K(String(r)), r === n ? 'máximo: ' + K(String(n)) : 'menor que ' + K(String(n))],
          ['Filas', r === n ? 'independientes' : 'dependientes',
            r === n ? 'ninguna sobra' : 'alguna es combinación lineal de las otras'],
          ['Tipo', regular ? M.badge('regular', 'si') : M.badge('singular', 'no'),
            regular ? 'tiene inversa' : 'no tiene inversa']
        ]);

        h += figVeredicto({
          regular: regular, orden: n, rango: r,
          detTxt: fracTxt(D)
        });

        if (regular) {
          h += bien('La matriz es <b>regular</b>: su determinante no es cero y su rango es máximo, ' +
            'luego existe una única matriz ' + K('A^{-1}') + ' que cumple ' +
            K('A\\cdot A^{-1} = A^{-1}\\cdot A = I') + '.');
          var inv = alg().inversa(A);
          if (v.verInv && inv.existe) {
            h += caja('La inversa, calculada por Gauss-Jordan', alg().matTex(inv.inv));
            h += caja('Comprobación', 'A\\cdot A^{-1} = ' + alg().matTex(alg().matProd(A, inv.inv)) +
              ' = I \\quad \\checkmark');
            h += parrafo('Fíjate en si han salido fracciones: eso pasa siempre que el determinante ' +
              'no vale ' + K('\\pm 1') + ', porque al final hay que dividir entre él.');
          } else if (!v.verInv) {
            h += aviso('Marca la casilla <b>Enseñar la inversa si existe</b> para ver la matriz ' +
              K('A^{-1}') + ' y la comprobación del producto.');
          }
        } else {
          h += mal('La matriz es <b>singular</b>: ' + K('\\det(A) = 0') + ' y ' +
            K('\\operatorname{rg}(A) = ' + r + ' < ' + n) + ', así que <b>no tiene inversa</b>.');
          h += titulo('¿Por qué una matriz singular no puede tener inversa?');
          h += M.paso(1, 'Supongamos que existiera una matriz ' + K('X') + ' con ' + K('A\\cdot X = I') + '.');
          h += M.paso(2, 'El rango de un producto nunca supera el rango de cada factor: ' +
            KD('\\operatorname{rg}(A\\cdot X) \\le \\operatorname{rg}(A) = ' + r));
          h += M.paso(3, 'Pero ' + K('\\operatorname{rg}(I) = ' + n) + ', porque la identidad tiene ' +
            n + ' pivotes. Tendríamos ' + K(n + ' \\le ' + r) + ', que es falso.', 'ap-paso-clave');
          h += M.paso(4, 'Contradicción: esa ' + K('X') + ' no existe. Una matriz con filas ' +
            'dependientes «pierde información» y esa pérdida no se puede deshacer multiplicando.', 'ap-paso-clave');
          h += parrafo('Dicho de otro modo: al escalonar aparece una fila de ceros, y ninguna operación ' +
            'elemental puede convertir una fila de ceros en una fila de la identidad.');
        }

        h += M.kvs([
          'orden = <b>' + n + '</b>',
          'det(A) = <b>' + fracTxt(D) + '</b>',
          'rg(A) = <b>' + r + '</b>',
          'tipo = <b>' + (regular ? 'regular' : 'singular') + '</b>',
          'traza = <b>' + fracTxt(C.traza) + '</b>'
        ]);
        h += parrafo('<b>Para el examen.</b> La respuesta se justifica siempre igual: se calcula ' +
          K('\\det(A)') + '; si sale distinto de cero se afirma que la matriz es regular y <i>por eso</i> ' +
          'tiene inversa; si sale cero se afirma que es singular y <i>por eso</i> no la tiene. En las ' +
          'matrices con parámetro, los valores que anulan el determinante son justamente aquellos para ' +
          'los que la inversa no existe.');
        return h;
      }, EJEMPLO));
  };

  /* ==================================================================
     3 · Tema 1.14 · la inversa por definición
     ================================================================== */
  R.inversaDef = function (node) {
    return M.shell(node, 'La inversa por definición',
      'La definición dice que ' + K('A^{-1}') + ' es la matriz ' + K('X') + ' que cumple ' +
      K('A\\cdot X = I') + '. Aquí se plantea esa igualdad con las incógnitas ' +
      K('x,\\, y,\\, z,\\, t') + ' de ' + K('X') + ' y se resuelven los dos sistemas que salen, uno por ' +
      'cada columna de la identidad. Escribe una matriz <b>de orden 2</b> por filas: <code>2 1; 1 1</code> ' +
      '(o una fila por línea). Puedes usar fracciones: <code>1/2 3; 0 -2</code>.',
      [
        {
          id: 'A', label: 'Matriz A (orden 2)', type: 'textarea', rows: 3,
          value: '2 1\n1 1', ancho: '15rem'
        },
        {
          id: 'ver', label: 'Ver también la comprobación X·A = I', type: 'check', value: true, ancho: '15rem'
        },
        chips([
          { txt: 'Inversa entera · det = 1', tip: 'todo sale redondo', set: { A: '2 1\n1 1' } },
          { txt: 'Inversa con fracciones · det = 2', tip: 'aparecen 1/2 y −3/2', set: { A: '4 6\n1 2' } },
          { txt: 'Con un elemento nulo', tip: 'sistema escalonado de salida', set: { A: '3 0\n2 1' } },
          { txt: 'Con números negativos', tip: 'cuidado con los signos', set: { A: '-1 2\n3 -4' } },
          { txt: 'Entradas fraccionarias', tip: 'la matriz de partida ya trae fracciones', set: { A: '1/2 3\n0 -2' } },
          { txt: 'Singular · sistemas incompatibles', tip: 'F₂ = 2F₁, no hay inversa', set: { A: '1 2\n2 4' } },
          { txt: 'Identidad', tip: 'es su propia inversa', set: { A: '1 0\n0 1' } },
          { txt: 'Matriz de orden 3 (aviso)', tip: 'saldrían nueve incógnitas', set: { A: '1 2 3\n0 1 4\n5 6 0' } }
        ])
      ],
      safe(function (v) {
        var A = leeCuadrada(v.A, 'la matriz A', 4);
        var n = A.f;
        var h = caja('Matriz A', alg().matTex(A));

        if (n !== 2) {
          h += aviso('Este applet plantea la definición con las incógnitas escritas una a una, y para ' +
            'eso el orden 2 es el tamaño cómodo: salen <b>4 incógnitas</b> y <b>2 sistemas</b>. Tu matriz ' +
            'es de orden ' + n + ', así que habría ' + (n * n) + ' incógnitas y ' + n + ' sistemas de ' + n +
            ' ecuaciones cada uno. Es exactamente lo que hace el método de <b>Gauss-Jordan</b>, que ' +
            'resuelve los ' + n + ' sistemas a la vez sobre la matriz ampliada ' + K('(A\\mid I)') + '.');
          var iv = alg().inversa(A);
          if (iv.existe) {
            h += caja('Resultado por Gauss-Jordan (usa el applet del método)', alg().matTex(iv.inv));
          } else {
            h += mal('Además, esta matriz es singular: ' + M.texifica(iv.motivo));
          }
          h += parrafo('Escribe una matriz de orden 2, por ejemplo <code>2 1; 1 1</code>, para ver el ' +
            'planteamiento completo con ' + K('x,\\,y,\\,z,\\,t') + '.');
          return h;
        }

        var a = A.a[0][0], b = A.a[0][1], c = A.a[1][0], d = A.a[1][1];
        var D = alg().det(A);

        h += titulo('Paso 1 · escribimos la incógnita');
        h += parrafo('Buscamos una matriz ' + K('X') + ' del mismo orden (si no, el producto ' +
          K('A\\cdot X') + ' no sería una matriz cuadrada de orden 2). Le ponemos nombre a sus cuatro ' +
          'elementos:');
        h += caja('La incógnita', 'X = \\left(\\begin{array}{cc} x & y \\\\ z & t \\end{array}\\right)');
        h += caja('La condición de la definición',
          'A\\cdot X = ' + alg().matTex(A) + '\\left(\\begin{array}{cc} x & y \\\\ z & t \\end{array}\\right) = ' +
          '\\left(\\begin{array}{cc} 1 & 0 \\\\ 0 & 1 \\end{array}\\right)');

        h += titulo('Paso 2 · hacemos el producto y comparamos elemento a elemento');
        h += caja('El producto, sin calcular todavía',
          'A\\cdot X = \\left(\\begin{array}{cc} ' +
          FT(a) + 'x + ' + FT(b) + 'z & ' + FT(a) + 'y + ' + FT(b) + 't \\\\ ' +
          FT(c) + 'x + ' + FT(d) + 'z & ' + FT(c) + 'y + ' + FT(d) + 't \\end{array}\\right)');
        h += parrafo('Dos matrices son iguales cuando lo son elemento a elemento. Las cuatro igualdades ' +
          'se separan solas en <b>dos sistemas independientes</b>: uno con las incógnitas de la primera ' +
          'columna de ' + K('X') + ' y otro con las de la segunda. Y no es casualidad: cada columna de ' +
          K('X') + ' se empareja con una columna de la identidad.');

        var sist = [
          {
            nom: 'Primer sistema (primera columna de X)', inc: ['x', 'z'], ind: [1, 0],
            tex: '\\begin{cases} ' + FT(a) + 'x + ' + FT(b) + 'z = 1 \\\\ ' +
              FT(c) + 'x + ' + FT(d) + 'z = 0 \\end{cases}'
          },
          {
            nom: 'Segundo sistema (segunda columna de X)', inc: ['y', 't'], ind: [0, 1],
            tex: '\\begin{cases} ' + FT(a) + 'y + ' + FT(b) + 't = 0 \\\\ ' +
              FT(c) + 'y + ' + FT(d) + 't = 1 \\end{cases}'
          }
        ];

        var sols = [], incompatible = false;
        sist.forEach(function (S, q) {
          h += titulo('Paso ' + (3 + q) + ' · ' + S.nom);
          h += caja(S.nom, S.tex);
          var amp = alg().matAmpliada(A, S.ind.map(function (u) { return new Frac(u); }));
          var G = alg().gauss(amp, { aug: 1, jordan: true });
          h += parrafo('Lo resolvemos por Gauss-Jordan sobre la matriz ampliada del sistema. La línea ' +
            'vertical separa los coeficientes de los términos independientes.');
          G.pasos.forEach(function (p, idx) {
            h += M.paso(String(idx),
              '<p>' + M.texifica(p.desc || '') + '</p>' +
              (p.op ? op(p.op) : '') +
              '<div class="mtxd-caja">' + KD(alg().matTex(p.M, { aug: 1 })) + '</div>',
              idx === 0 ? 'mtxd-paso0' : '');
          });
          if (G.rango < 2) {
            incompatible = true;
            h += mal('Este sistema <b>no tiene solución única</b>: al escalonar ha quedado una fila de ' +
              'ceros en la parte de los coeficientes. La matriz ' + K('A') + ' es singular y las ' +
              'incógnitas ' + K(S.inc[0]) + ' y ' + K(S.inc[1]) + ' no se pueden determinar.');
            sols.push(null);
          } else {
            var s0 = G.fin.a[0][2], s1 = G.fin.a[1][2];
            h += bien('Solución: ' + K(S.inc[0] + ' = ' + FT(s0)) + ' y ' + K(S.inc[1] + ' = ' + FT(s1)) + '.');
            sols.push([s0, s1]);
          }
        });

        if (incompatible || cero(D)) {
          h += titulo('Conclusión');
          h += mal('La matriz es <b>singular</b> (' + K('\\det(A) = ' + FT(D)) + '), así que la ecuación ' +
            K('A\\cdot X = I') + ' <b>no tiene solución</b>: no existe la inversa. Comprueba que las dos ' +
            'filas de ' + K('A') + ' son proporcionales: la segunda no aporta información nueva y por eso ' +
            'los sistemas se quedan «cojos».');
          h += parrafo('Esto enseña algo importante: la inversa no es una cuenta que a veces sale mal, ' +
            'sino la solución de una ecuación matricial que a veces <b>no existe</b>.');
          return h;
        }

        var X = alg().matDe([[sols[0][0], sols[1][0]], [sols[0][1], sols[1][1]]]);
        h += titulo('Paso 5 · montamos la matriz X');
        h += parrafo('Cada sistema ha dado una <b>columna</b> de ' + K('X') + ': el primero da ' +
          K('x') + ' y ' + K('z') + ' (primera columna) y el segundo da ' + K('y') + ' y ' + K('t') +
          ' (segunda columna).');
        h += caja('La inversa obtenida por definición', 'A^{-1} = X = ' + alg().matTex(X));

        h += titulo('Paso 6 · comprobación por los dos lados');
        h += caja('Por la izquierda', 'A\\cdot X = ' + alg().matTex(A) + alg().matTex(X) + ' = ' +
          alg().matTex(alg().matProd(A, X)) + ' \\quad \\checkmark');
        if (v.ver) {
          h += caja('Por la derecha', 'X\\cdot A = ' + alg().matTex(X) + alg().matTex(A) + ' = ' +
            alg().matTex(alg().matProd(X, A)) + ' \\quad \\checkmark');
          h += parrafo('Hemos impuesto solo ' + K('A\\cdot X = I') + ' y ha salido gratis ' +
            K('X\\cdot A = I') + '. En matrices cuadradas eso pasa siempre, aunque el producto no sea ' +
            'conmutativo en general: la inversa conmuta con su matriz.');
        } else {
          h += aviso('Marca la casilla para ver también la comprobación ' + K('X\\cdot A = I') +
            ', que no es evidente porque el producto de matrices no es conmutativo.');
        }
        h += M.kvs([
          'det(A) = <b>' + fracTxt(D) + '</b>',
          'x = <b>' + fracTxt(X.a[0][0]) + '</b>',
          'y = <b>' + fracTxt(X.a[0][1]) + '</b>',
          'z = <b>' + fracTxt(X.a[1][0]) + '</b>',
          't = <b>' + fracTxt(X.a[1][1]) + '</b>'
        ]);
        h += parrafo('Este método es correcto pero lento: para el orden 3 habría que resolver ' +
          '<b>tres</b> sistemas de tres ecuaciones. Por eso se usa Gauss-Jordan, que los resuelve ' +
          'todos a la vez sobre ' + K('(A\\mid I)') + '.');
        return h;
      }, EJEMPLO));
  };

  /* ==================================================================
     4 · Tema 1.14 · fórmula rápida de la inversa de orden 2
     ================================================================== */
  R.inversa2x2 = function (node) {
    return M.shell(node, 'Fórmula rápida de la inversa de orden 2',
      'Para el orden 2, y <b>solo</b> para el orden 2, hay una fórmula que se aprende de memoria: se ' +
      'intercambian los elementos de la diagonal principal, se cambia el signo a los de la secundaria y ' +
      'se divide todo entre el determinante. Escribe la matriz por filas: <code>2 1; 1 1</code> ' +
      '(o una fila por línea). Puedes usar fracciones: <code>1/2 3; 0 -2</code>.',
      [
        {
          id: 'A', label: 'Matriz A (orden 2)', type: 'textarea', rows: 3,
          value: '4 6\n1 2', ancho: '15rem'
        },
        chips([
          { txt: 'Inversa con fracciones · det = 2', tip: 'la fórmula obliga a dividir', set: { A: '4 6\n1 2' } },
          { txt: 'Inversa entera · det = 1', tip: 'no aparecen fracciones', set: { A: '2 1\n1 1' } },
          { txt: 'det = −1', tip: 'ojo con los signos', set: { A: '1 2\n3 5' } },
          { txt: 'Con negativos', tip: 'doble cambio de signo', set: { A: '-1 2\n3 -4' } },
          { txt: 'Simétrica', tip: 'su inversa también lo es', set: { A: '2 1\n1 3' } },
          { txt: 'Diagonal', tip: 'la inversa son los inversos', set: { A: '3 0\n0 -2' } },
          { txt: 'Entradas fraccionarias', tip: 'fracciones dentro y fuera', set: { A: '1/2 3\n0 -2' } },
          { txt: 'Singular · det = 0', tip: 'la fórmula pide dividir entre 0', set: { A: '1 2\n2 4' } },
          { txt: 'Orden 3 (aviso)', tip: 'la fórmula NO vale', set: { A: '1 2 3\n0 1 4\n5 6 0' } }
        ])
      ],
      safe(function (v) {
        var A = leeM(v.A, 'la matriz A', 4, 4);
        var h = caja('Matriz A, de dimensión ' + alg().dimTxt(A), alg().matTex(A));

        if (A.f !== 2 || A.c !== 2) {
          h += mal('<b>Esta fórmula vale SOLO para matrices de orden 2</b> y la tuya es de ' +
            alg().dimTxt(A) + '. No existe ninguna fórmula tan corta para el orden 3: allí hay que ' +
            'usar Gauss-Jordan (o la matriz adjunta, que se estudia con los determinantes). Es uno de ' +
            'los errores más repetidos: aplicar «cambio la diagonal y cambio los signos» a una matriz ' +
            'de orden 3 da un disparate.');
          if (A.f === A.c) {
            var iv = alg().inversa(A);
            h += iv.existe
              ? caja('Lo correcto para este orden: Gauss-Jordan', 'A^{-1} = ' + alg().matTex(iv.inv))
              : aviso(M.texifica(iv.motivo));
          }
          h += parrafo('Escribe una matriz de orden 2, por ejemplo <code>4 6; 1 2</code>.');
          return h;
        }

        var a = A.a[0][0], b = A.a[0][1], c = A.a[1][0], d = A.a[1][1];
        var res = alg().inversa2x2(A);

        h += titulo('Paso 1 · ponemos nombre a los cuatro elementos');
        h += caja('La plantilla de la fórmula',
          'A = \\left(\\begin{array}{cc} a & b \\\\ c & d \\end{array}\\right) \\quad\\Longrightarrow\\quad ' +
          'a = ' + FT(a) + ',\\; b = ' + FT(b) + ',\\; c = ' + FT(c) + ',\\; d = ' + FT(d));
        h += M.tabla(['Elemento', 'Posición', 'Valor', 'Papel en la fórmula'], [
          [K('a'), K(aTex(0, 0)) + ' · diagonal principal', K(FT(a)), 'pasa a la esquina de abajo a la derecha'],
          [K('b'), K(aTex(0, 1)) + ' · diagonal secundaria', K(FT(b)), 'se queda en su sitio con el signo cambiado'],
          [K('c'), K(aTex(1, 0)) + ' · diagonal secundaria', K(FT(c)), 'se queda en su sitio con el signo cambiado'],
          [K('d'), K(aTex(1, 1)) + ' · diagonal principal', K(FT(d)), 'pasa a la esquina de arriba a la izquierda']
        ]);

        h += titulo('Paso 2 · el determinante');
        h += caja('Determinante', alg().detPasos(A).tex);

        if (!res.existe) {
          h += mal('El determinante vale ' + K('0') + '. La fórmula pide <b>dividir entre ' +
            K('ad-bc') + '</b>, y entre cero no se puede dividir: la matriz es <b>singular</b> y ' +
            '<b>no tiene inversa</b>.');
          h += parrafo('Comprueba que ' + K('a\\cdot d = ' + FT(a.por(d))) + ' y ' +
            K('b\\cdot c = ' + FT(b.por(c))) + ' coinciden: eso significa que las dos filas son ' +
            'proporcionales, es decir, que la segunda no aporta información nueva.');
          h += figVeredicto({ regular: false, orden: 2, rango: alg().rango(A), detTxt: fracTxt(res.det) });
          h += parrafo('<b>Error típico:</b> escribir la inversa «como si nada» y dejar un denominador ' +
            'cero. Antes de aplicar la fórmula hay que comprobar siempre que ' + K('ad - bc \\ne 0') + '.');
          return h;
        }

        h += bien('El determinante vale ' + K(FT(res.det)) + ', distinto de cero: la matriz es ' +
          '<b>regular</b> y podemos aplicar la fórmula.');

        h += titulo('Paso 3 · la matriz de la fórmula');
        h += parrafo('Se intercambian ' + K('a') + ' y ' + K('d') + ' (la diagonal principal) y se ' +
          'cambia el signo a ' + K('b') + ' y a ' + K('c') + ' (la diagonal secundaria). Esa matriz es la ' +
          '<b>adjunta transpuesta</b>, aunque de momento basta con recordar el dibujo.');
        h += caja('Intercambiar y cambiar signos',
          '\\left(\\begin{array}{cc} d & -b \\\\ -c & a \\end{array}\\right) = ' + alg().matTex(res.adjunta));

        h += titulo('Paso 4 · dividir entre el determinante');
        h += caja('La fórmula completa, con tus números', res.tex);
        h += M.resultado(K('A^{-1} = ' + alg().matTex(res.inv)), 'inversa de la matriz');

        h += titulo('Paso 5 · comprobación por los dos lados');
        var P1 = alg().matProd(A, res.inv), P2 = alg().matProd(res.inv, A);
        h += caja('A por su inversa', 'A\\cdot A^{-1} = ' + alg().matTex(A) + alg().matTex(res.inv) +
          ' = ' + alg().matTex(P1) + ' \\quad \\checkmark');
        h += caja('La inversa por A', 'A^{-1}\\cdot A = ' + alg().matTex(res.inv) + alg().matTex(A) +
          ' = ' + alg().matTex(P2) + ' \\quad \\checkmark');
        h += (alg().matIgual(P1, alg().matIdentidad(2)) && alg().matIgual(P2, alg().matIdentidad(2)))
          ? bien('Los dos productos dan la identidad: la inversa es correcta. Siempre hay que ' +
            'comprobarlo, sobre todo si han aparecido fracciones.')
          : mal('Los productos no dan la identidad: revisa los datos de entrada.');

        var hayFrac = res.inv.a.some(function (fil) {
          return fil.some(function (u) { return u.d !== 1n; });
        });
        h += parrafo(hayFrac
          ? 'Han salido <b>fracciones</b> porque el determinante no vale ' + K('\\pm 1') + '. No las ' +
            'pases a decimales: en Bachillerato la inversa se deja con fracciones exactas, o bien con ' +
            'el factor ' + K('\\dfrac{1}{' + FT(res.det) + '}') + ' delante de una matriz de enteros.'
          : 'No han salido fracciones porque el determinante vale ' + K('\\pm 1') + '. Es la situación ' +
            'más cómoda, y por eso los ejercicios de examen suelen buscarla.');
        h += M.kvs([
          'a = <b>' + fracTxt(a) + '</b>',
          'b = <b>' + fracTxt(b) + '</b>',
          'c = <b>' + fracTxt(c) + '</b>',
          'd = <b>' + fracTxt(d) + '</b>',
          'det = <b>' + fracTxt(res.det) + '</b>'
        ]);
        h += parrafo('<b>Aviso importante:</b> esta receta ' + K('\\left(\\begin{array}{cc} d & -b \\\\ ' +
          '-c & a \\end{array}\\right)') + ' es exclusiva del orden 2. Para el orden 3 o mayor se usa el ' +
          'método de Gauss-Jordan sobre ' + K('(A\\mid I)') + '.');
        return h;
      }, EJEMPLO));
  };

  /* ==================================================================
     5 · Tema 1.15 · método de Gauss-Jordan
     ================================================================== */
  R.gaussJordan = function (node) {
    var hist = [];
    function limpia() { hist.length = 0; }

    return M.shell(node, 'Método de Gauss-Jordan',
      'El método consiste en escribir la matriz ampliada ' + K('(A\\mid I)') + ' y aplicar operaciones ' +
      'elementales de filas <b>a la matriz entera</b> hasta que a la izquierda aparezca la identidad: lo ' +
      'que quede a la derecha es ' + K('A^{-1}') + '. Escribe la matriz por filas: <code>2 1; 1 1</code> ' +
      '(o una fila por línea); valen fracciones: <code>1/2 3; 0 -2</code>. Órdenes admitidos: 2, 3 y 4. ' +
      'En el <b>modo automático</b> se ven todos los pasos; en el <b>modo manual</b> eliges tú la operación ' +
      '(tipo, filas y multiplicador ' + K('k') + '), el applet la valida y te dice si te has acercado a la ' +
      'identidad. Las filas se numeran desde 1.',
      [
        {
          id: 'A', label: 'Matriz A (una fila por línea)', type: 'textarea', rows: 4,
          value: '2 1\n1 1', ancho: '15rem'
        },
        {
          id: 'modo', label: 'Modo', type: 'select', value: 'auto', ancho: '11rem',
          options: [{ value: 'auto', label: 'automático' }, { value: 'manual', label: 'manual' }]
        },
        {
          id: 'tipo', label: 'Operación (modo manual)', type: 'select', value: 'sumar', ancho: '17rem',
          options: [
            { value: 'sumar', label: 'Fi → Fi + k·Fj' },
            { value: 'cambiar', label: 'Fi ↔ Fj' },
            { value: 'multiplicar', label: 'Fi → k·Fi  (k ≠ 0)' }
          ]
        },
        { id: 'i', label: 'Fila Fi', type: 'number', min: 1, max: 4, value: 2, ancho: '7rem' },
        { id: 'j', label: 'Fila Fj', type: 'number', min: 1, max: 4, value: 1, ancho: '7rem' },
        { id: 'k', label: 'Multiplicador k', type: 'text', value: '-1/2', ancho: '8rem' },
        {
          id: 'aplicar', label: 'Aplicar operación', type: 'button',
          click: function (ctl) {
            hist.push({
              tipo: String(ctl.tipo.value),
              i: Number(ctl.i.value) - 1,
              j: Number(ctl.j.value) - 1,
              k: String(ctl.k.value)
            });
          }
        },
        { id: 'deshacer', label: 'Deshacer', type: 'button', click: function () { hist.pop(); } },
        { id: 'reiniciar', label: 'Reiniciar', type: 'button', click: function () { hist.length = 0; } },
        chips([
          { txt: 'Orden 2 · inversa entera', tip: 'det = 1', set: { A: '2 1\n1 1', modo: 'auto' }, extra: limpia },
          { txt: 'Orden 2 · inversa con fracciones', tip: 'det = 2', set: { A: '4 6\n1 2', modo: 'auto' }, extra: limpia },
          { txt: 'Orden 3 · clásica', tip: 'la de los libros', set: { A: '1 2 3\n0 1 4\n5 6 0', modo: 'auto' }, extra: limpia },
          { txt: 'Orden 3 · con fracciones', tip: 'inversa llena de fracciones', set: { A: '2 1 1\n1 3 2\n1 0 0', modo: 'auto' }, extra: limpia },
          { txt: 'Orden 3 · SINGULAR (F₃ = F₁ + F₂)', tip: 'aparece una fila nula', set: { A: '1 2 3\n2 1 0\n3 3 3', modo: 'auto' }, extra: limpia },
          { txt: 'Orden 2 · singular', tip: 'filas proporcionales', set: { A: '1 2\n2 4', modo: 'auto' }, extra: limpia },
          { txt: 'Hay que intercambiar filas', tip: 'el primer pivote es 0', set: { A: '0 1 2\n1 0 3\n4 -3 8', modo: 'auto' }, extra: limpia },
          { txt: 'Orden 4 · triangular', tip: 'escalonado más largo', set: { A: '1 2 0 1\n0 1 3 0\n0 0 1 2\n0 0 0 1', modo: 'auto' }, extra: limpia },
          { txt: 'Identidad · nada que hacer', tip: 'ya está en su forma final', set: { A: '1 0 0\n0 1 0\n0 0 1', modo: 'auto' }, extra: limpia },
          {
            txt: 'Practicar en manual', tip: 'empieza tú el proceso',
            set: { A: '2 1\n1 1', modo: 'manual', tipo: 'sumar', i: 2, j: 1, k: '-1/2' }, extra: limpia
          }
        ])
      ],
      safe(function (v) {
        var A = leeCuadrada(v.A, 'la matriz A', 4);
        var n = A.f;
        if (n < 2) {
          throw Error('Escribe una matriz de orden 2, 3 o 4. Una matriz de orden 1 es un solo número: ' +
            'su inversa es su inverso y no hace falta ningún método. Prueba con 2 1; 1 1.');
        }
        var amp0 = alg().matPegada(A, alg().matIdentidad(n));
        var h = caja('Matriz A, cuadrada de orden ' + n, alg().matTex(A));
        h += caja('Matriz ampliada de partida (A | I)', alg().matTex(amp0, { aug: n }));
        h += parrafo('La <b>línea vertical</b> no es una operación: solo recuerda dónde acaba ' + K('A') +
          ' y dónde empieza ' + K('I') + '. Cada operación elemental se aplica a la fila <b>entera</b>, ' +
          'a los dos lados de la línea a la vez.');

        if (v.modo === 'auto') {
          var IP = alg().inversaPasos(A);
          h += titulo('Modo automático: de (A | I) hasta (I | A⁻¹)');
          var singPaso = -1;
          IP.pasos.forEach(function (p, idx) {
            if (singPaso < 0 && idx > 0 && filaNulaIzq(p.M, n) >= 0) singPaso = idx;
          });
          IP.pasos.forEach(function (p, idx) {
            if (singPaso >= 0 && idx > singPaso) return;
            var clase = idx === 0 ? 'mtxd-paso0' : (idx === singPaso ? 'mtxd-paso-mal' : 'mtxd-paso-ok');
            h += M.paso(String(idx),
              '<p>' + M.texifica(p.desc || '') + '</p>' +
              (p.op ? op(p.op) : '') +
              '<div class="mtxd-caja">' + KD(alg().matTex(p.M, { aug: n })) + '</div>' +
              (idx === singPaso
                ? '<p class="mtxd-mal">¡Alto! En este paso la fila ' + (filaNulaIzq(p.M, n) + 1) +
                  ' se ha quedado <b>entera de ceros</b> a la izquierda de la línea.</p>'
                : ''),
              clase);
          });

          if (!IP.existe) {
            var fnul = filaNulaIzq(IP.pasos[IP.pasos.length - 1].M, n);
            h += mal('<b>La matriz es singular: no tiene inversa.</b>');
            h += titulo('¿Qué significa esa fila de ceros?');
            h += M.paso(1, 'Una fila de ceros a la izquierda significa que esa fila de ' + K('A') +
              ' era <b>combinación lineal</b> de las otras: no aportaba información nueva.');
            h += M.paso(2, 'Ninguna operación elemental puede convertir una fila de ceros en una fila ' +
              'de la identidad, porque sumar múltiplos de ceros sigue dando ceros. El proceso se ' +
              '<b>atasca</b> para siempre.', 'ap-paso-clave');
            h += M.paso(3, 'Por tanto ' + K('\\operatorname{rg}(A) = ' + alg().rango(A) + ' < ' + n) +
              ' y ' + K('\\det(A) = ' + FT(alg().det(A))) + ': la matriz es singular.', 'ap-paso-clave');
            h += parrafo('No hay que seguir calculando: en cuanto aparece la fila nula, la respuesta del ' +
              'ejercicio ya es <b>«no existe ' + K('A^{-1}') + '»</b>, y así se escribe, justificándolo.');
            h += figAvance(Math.max(0, IP.pasos.length - 1), lejosDeI(IP.pasos[IP.pasos.length - 1].M, n),
              false, true);
            h += M.kvs([
              'orden = <b>' + n + '</b>',
              'rg(A) = <b>' + alg().rango(A) + '</b>',
              'det(A) = <b>' + fracTxt(alg().det(A)) + '</b>',
              'fila nula = <b>F' + (fnul >= 0 ? fnul + 1 : '—') + '</b>'
            ]);
            return h;
          }

          h += bien('A la izquierda ha quedado la identidad, así que a la derecha está ' + K('A^{-1}') + '.');
          h += caja('La inversa', 'A^{-1} = ' + alg().matTex(IP.inv));
          h += titulo('Comprobación obligatoria');
          h += caja('Por la izquierda', 'A\\cdot A^{-1} = ' + alg().matTex(IP.comprobacion.AI) + ' = I');
          h += caja('Por la derecha', 'A^{-1}\\cdot A = ' + alg().matTex(IP.comprobacion.IA) + ' = I');
          h += IP.comprobacion.correcta
            ? bien('Los dos productos dan la identidad: la inversa está bien calculada.')
            : mal('Los productos no dan la identidad: revisa los datos.');
          h += figAvance(IP.pasos.length - 1, 0, true, false);
          h += M.kvs([
            'orden = <b>' + n + '</b>',
            'pasos = <b>' + (IP.pasos.length - 1) + '</b>',
            'det(A) = <b>' + fracTxt(alg().det(A)) + '</b>',
            'rg(A) = <b>' + n + '</b>'
          ]);
          h += parrafo('<b>Cómo se escribe en un examen.</b> Se copia ' + K('(A\\mid I)') + ', se indica ' +
            'cada operación con la notación ' + K('F_i \\to F_i - kF_j') + ' encima de la flecha, y al ' +
            'llegar a ' + K('(I\\mid A^{-1})') + ' se enuncia la conclusión y se comprueba el producto.');
          return h;
        }

        /* -------------------- modo manual -------------------- */
        h += titulo('Modo manual: tú diriges el proceso');
        h += parrafo('Elige el tipo de operación, las filas y el multiplicador y pulsa ' +
          '<b>Aplicar operación</b>. Recuerda las tres operaciones permitidas: intercambiar dos filas, ' +
          'multiplicar una fila por un número <b>distinto de cero</b> y sumar a una fila un múltiplo de ' +
          'otra. Con <b>Deshacer</b> quitas el último movimiento y con <b>Reiniciar</b> vuelves a ' +
          K('(A\\mid I)') + '.');

        var actual = amp0.copia(), avisos = [], lista = '', nOk = 0, singular = false;
        /* Los avisos NO se acumulan: cada acción muestra solo el suyo.
           Antes se reimprimían todos los errores del historial, incluso
           los ya obsoletos y contradictorios entre sí. */
        function anota(idx, msg) {
          avisos.length = 0;
          if (idx === hist.length - 1) avisos.push(msg);
        }
        hist.forEach(function (o, idx) {
          if (singular) return;
          var res = alg().opElemental(actual, { tipo: o.tipo, i: o.i, j: o.j, k: o.k });
          if (!res.valida) { anota(idx, res.error); return; }
          var dPrev = lejosDeI(actual, n);
          actual = res.M;
          var dNue = lejosDeI(actual, n);
          nOk++;
          var fn = filaNulaIzq(actual, n);
          var juicio;
          if (fn >= 0) {
            singular = true;
            juicio = '<span class="mtxd-mal">La fila ' + (fn + 1) + ' se ha quedado de ceros a la ' +
              'izquierda de la línea: la matriz es <b>singular</b> y el proceso no puede terminar.</span>';
          } else if (dNue === 0) {
            juicio = '<span class="mtxd-bien">¡Ya está! A la izquierda tienes la identidad.</span>';
          } else if (dNue < dPrev) {
            juicio = '<span class="mtxd-bien">Buen movimiento: quedan ' + dNue + ' elemento(s) por ' +
              'colocar en el bloque izquierdo (antes había ' + dPrev + ').</span>';
          } else if (dNue > dPrev) {
            /* Movimiento que EMPEORA: hay que decirlo expresamente, igual
               que gaussRango dice «buen movimiento» cuando se acerca. */
            juicio = '<span class="mtxd-mal">Operación legal, pero <b>te has alejado</b> de la identidad: ' +
              'los elementos por colocar han pasado de ' + dPrev + ' a ' + dNue + '. Puedes ' +
              '<b>Deshacer</b> este movimiento. Recuerda el orden: primero se hacen ceros debajo de cada ' +
              'pivote, después unos en la diagonal y por último ceros encima.</span>';
          } else {
            juicio = '<span class="mtxd-mal">Operación legal, pero <b>no te acerca</b> a la identidad: ' +
              'siguen faltando ' + dNue + ' elemento(s), los mismos que antes. Recuerda el orden: primero ' +
              'se hacen ceros debajo de cada pivote, después unos en la diagonal y por último ceros ' +
              'encima.</span>';
          }
          lista += M.paso(String(nOk),
            '<p>' + M.texifica(res.desc || '') + '</p>' + op(res.tex) +
            '<div class="mtxd-caja">' + KD(alg().matTex(actual, { aug: n })) + '</div>' +
            '<p>' + juicio + '</p>',
            (fn >= 0 || dNue >= dPrev) ? 'mtxd-paso-mal' : 'mtxd-paso-ok');
        });

        if (avisos.length) {
          h += '<ul class="mtxd-avisos"><li>' + avisos.map(function (x) { return M.esc(x); }).join('</li><li>') +
            '</li></ul>';
        }
        h += lista || parrafo('Todavía no has aplicado ninguna operación: la matriz ampliada es la de ' +
          'partida. Un primer movimiento típico es ' + K('F_2 \\to F_2 - \\tfrac{1}{2}F_1') +
          ' (escribe Fi = 2, Fj = 1 y k = −1/2).');
        h += caja('Matriz ampliada actual', alg().matTex(actual, { aug: n }));

        var falta = lejosDeI(actual, n);
        var izq = bloque(actual, 0, n), der = bloque(actual, n, 2 * n);
        h += figAvance(nOk, falta, falta === 0 && !singular, singular);

        if (singular) {
          h += mal('Ha aparecido una <b>fila de ceros</b> en el bloque izquierdo. Eso ocurre cuando una ' +
            'fila de ' + K('A') + ' es combinación lineal de las otras: ' +
            K('\\operatorname{rg}(A) = ' + alg().rango(A) + ' < ' + n) + ' y ' + K('\\det(A) = 0') + '. ' +
            'La matriz <b>no tiene inversa</b> y el proceso no puede llegar a ' + K('(I\\mid A^{-1})') + '.');
        } else if (falta === 0) {
          h += bien('¡Objetivo cumplido! A la izquierda está la identidad, así que a la derecha está ' +
            K('A^{-1}') + '.');
          h += caja('La inversa que has obtenido', 'A^{-1} = ' + alg().matTex(der));
          var P = alg().matProd(A, der);
          h += caja('Comprobación', 'A\\cdot A^{-1} = ' + alg().matTex(P) +
            (alg().matIgual(P, alg().matIdentidad(n)) ? ' = I \\quad \\checkmark' : ''));
        } else {
          h += pista(sugerenciaGJ(actual, n));
        }

        h += M.kvs([
          'operaciones aplicadas = <b>' + nOk + '</b>',
          'elementos por colocar = <b>' + falta + '</b>',
          'rg del bloque izquierdo = <b>' + alg().rango(izq) + '</b>',
          'rg(A) = <b>' + alg().rango(A) + '</b>',
          'det(A) = <b>' + fracTxt(alg().det(A)) + '</b>'
        ]);
        h += parrafo('El bloque izquierdo y el derecho van siempre <b>a la vez</b>: cada operación se ' +
          'aplica a la fila completa. Si te equivocas, deshaz y sigue; el resultado final no depende del ' +
          'camino, solo de la matriz de partida.');
        return h;
      }, EJEMPLO));
  };

  /* Sugerencia del siguiente movimiento en Gauss-Jordan. */
  function sugerenciaGJ(Mt, n) {
    var i, j;
    for (j = 0; j < n; j++) {
      if (cero(Mt.a[j][j])) {
        for (i = j + 1; i < n; i++) {
          if (!cero(Mt.a[i][j])) {
            return 'el pivote de la posición (' + (j + 1) + ', ' + (j + 1) + ') es 0: intercambia ' +
              K('F_{' + (j + 1) + '} \\leftrightarrow F_{' + (i + 1) + '}') + '.';
          }
        }
        continue;
      }
      for (i = 0; i < n; i++) {
        if (i !== j && !cero(Mt.a[i][j])) {
          var k = Mt.a[i][j].entre(Mt.a[j][j]).opuesto();
          return 'haz un cero en la posición (' + (i + 1) + ', ' + (j + 1) + ') con ' +
            K('F_{' + (i + 1) + '} \\to F_{' + (i + 1) + '} + (' + FT(k) + ')F_{' + (j + 1) + '}') + '.';
        }
      }
      if (!igF(Mt.a[j][j], F1())) {
        return 'convierte el pivote en 1 con ' +
          K('F_{' + (j + 1) + '} \\to ' + FT(F1().entre(Mt.a[j][j])) + 'F_{' + (j + 1) + '}') + '.';
      }
    }
    return 'sigue haciendo ceros fuera de la diagonal y unos en la diagonal del bloque izquierdo.';
  }

  /* ==================================================================
     6 · Tema 1.16 · resolutor de ecuaciones matriciales
     ================================================================== */
  var TIPOS_EC = [
    { value: 'AX=B', label: 'A · X = B' },
    { value: 'XA=B', label: 'X · A = B' },
    { value: 'AX+B=C', label: 'A · X + B = C' },
    { value: 'XA+B=C', label: 'X · A + B = C' },
    { value: 'AXB=C', label: 'A · X · B = C' },
    { value: 'AX=B+X', label: 'A · X = B + X  (extra)' }
  ];
  function nombreEc(t) {
    var f = TIPOS_EC.filter(function (u) { return u.value === t; });
    return f.length ? f[0].label : t;
  }

  R.ecuacionMatricial = function (node) {
    return M.shell(node, 'Resolutor de ecuaciones matriciales',
      'Elige el <b>tipo de ecuación</b> y escribe las matrices por filas: <code>2 1; 1 1</code> ' +
      '(o una fila por línea); valen fracciones: <code>1/2 3; 0 -2</code>. La matriz ' + K('C') +
      ' solo hace falta en los tipos que la llevan. El applet <b>razona el despeje</b> paso a paso: ' +
      'explica por qué se multiplica por ' + K('A^{-1}') + ' por la izquierda o por la derecha, recuerda ' +
      'que la división de matrices <b>no existe</b> y termina comprobando la solución.',
      [
        {
          id: 'tipo', label: 'Tipo de ecuación', type: 'select', value: 'AX=B', ancho: '15rem',
          options: TIPOS_EC
        },
        { id: 'A', label: 'Matriz A', type: 'textarea', rows: 3, value: '2 1\n1 1', ancho: '12rem' },
        { id: 'B', label: 'Matriz B', type: 'textarea', rows: 3, value: '3 0\n1 2', ancho: '12rem' },
        { id: 'C', label: 'Matriz C (si hace falta)', type: 'textarea', rows: 3, value: '5 2\n3 4', ancho: '12rem' },
        chips([
          { txt: 'AX = B · básico', tip: 'multiplicar por la izquierda', set: { tipo: 'AX=B', A: '2 1\n1 1', B: '3 0\n1 2' } },
          { txt: 'XA = B · por la derecha', tip: 'el error clásico es el lado', set: { tipo: 'XA=B', A: '2 1\n1 1', B: '3 0\n1 2' } },
          { txt: 'AX + B = C', tip: 'primero se pasa B restando', set: { tipo: 'AX+B=C', A: '2 1\n1 1', B: '1 0\n0 1', C: '5 2\n3 4' } },
          { txt: 'XA + B = C', tip: 'restar y multiplicar por la derecha', set: { tipo: 'XA+B=C', A: '2 1\n1 1', B: '1 0\n0 1', C: '5 2\n3 4' } },
          { txt: 'AXB = C · dos inversas', tip: 'una por cada lado', set: { tipo: 'AXB=C', A: '2 1\n1 1', B: '1 1\n0 1', C: '3 5\n2 4' } },
          { txt: 'AX = B + X · factor común', tip: 'sale (A − I)X = B', set: { tipo: 'AX=B+X', A: '3 1\n0 2', B: '4 2\n1 3' } },
          { txt: 'Solución con fracciones', tip: 'det(A) = 2', set: { tipo: 'AX=B', A: '4 6\n1 2', B: '1 0\n0 1' } },
          { txt: 'A singular · sin solución única', tip: 'no se puede despejar', set: { tipo: 'AX=B', A: '1 2\n2 4', B: '1 0\n0 1' } },
          { txt: 'Dimensiones incompatibles', tip: 'aviso explicativo', set: { tipo: 'AX=B', A: '2 1\n1 1', B: '1 2 3' } },
          { txt: 'Orden 3', tip: 'el mismo razonamiento', set: { tipo: 'AX=B', A: '1 2 3\n0 1 4\n5 6 0', B: '1 0 0\n0 1 0\n0 0 1' } }
        ])
      ],
      safe(function (v) {
        var tipo = String(v.tipo || 'AX=B');
        var necesitaC = (tipo === 'AX+B=C' || tipo === 'XA+B=C' || tipo === 'AXB=C');
        var A = leeM(v.A, 'la matriz A', 4, 4);
        var B = leeM(v.B, 'la matriz B', 4, 4);
        var C = null;
        if (necesitaC) C = leeM(v.C, 'la matriz C', 4, 4);

        var h = titulo('La ecuación que hay que resolver');
        h += caja('Tipo elegido: ' + nombreEc(tipo), ecuPlantilla(tipo));
        h += '<div class="ap-grid3">' +
          '<div class="ap-card"><div class="ap-card-tit">Matriz A</div>' + KD(alg().matTex(A)) + '</div>' +
          '<div class="ap-card"><div class="ap-card-tit">Matriz B</div>' + KD(alg().matTex(B)) + '</div>' +
          (C ? '<div class="ap-card"><div class="ap-card-tit">Matriz C</div>' + KD(alg().matTex(C)) + '</div>' : '') +
          '</div>';

        h += titulo('Las dos reglas de oro del despeje');
        h += aviso('<b>1.</b> Las matrices <b>no se dividen</b>: no existe ' + K('\\dfrac{B}{A}') +
          '. Lo único que se puede hacer es multiplicar por la inversa ' + K('A^{-1}') + ', y solo si ' +
          K('A') + ' es regular.<br><b>2.</b> El producto de matrices <b>no es conmutativo</b>, así que hay ' +
          'que multiplicar <b>por el mismo lado en los dos miembros</b>: por la izquierda si ' + K('A') +
          ' está a la izquierda de ' + K('X') + ', y por la derecha si está a la derecha.');

        var res = alg().ecuMatricial(tipo, A, B, C);
        if (!res.ok) {
          h += mal('<b>No se puede despejar ' + K('X') + '.</b> ' + M.texifica(res.motivo));
          h += parrafo('Repasa lo que hace falta: la matriz por la que se multiplica tiene que ser ' +
            '<b>cuadrada y regular</b> (determinante distinto de cero) y las dimensiones deben encajar ' +
            'para que todos los productos existan. Prueba con el escenario «AX = B · básico».');
          if (A.f === A.c) {
            h += M.kvs([
              'orden de A = <b>' + A.f + '</b>',
              'det(A) = <b>' + fracTxt(alg().det(A)) + '</b>',
              'rg(A) = <b>' + alg().rango(A) + '</b>',
              'dim(B) = <b>' + alg().dimTxt(B) + '</b>'
            ]);
          }
          return h;
        }

        h += titulo('Despeje razonado, paso a paso');
        h += parrafo(lado(res.lado));
        res.pasos.forEach(function (p, idx) {
          h += M.paso(String(idx + 1),
            '<p>' + M.texifica(p.desc || '') + '</p>' +
            (p.tex ? '<div class="mtxd-caja">' + KD(p.tex) + '</div>' : ''),
            idx === res.pasos.length - 1 ? 'ap-paso-clave' : '');
        });

        h += titulo('La solución');
        h += M.resultado(K('X = ' + alg().matTex(res.X)), 'solución de la ecuación');

        h += titulo('Comprobación');
        h += caja('Sustituimos la X obtenida en la ecuación de partida', res.comprobacion.tex);
        h += res.comprobacion.correcta
          ? bien('Al sustituir se obtiene exactamente el segundo miembro: la solución es correcta. ' +
            'Esta comprobación es rápida y en el examen vale mucho.')
          : mal('Al sustituir no se obtiene el segundo miembro: ' + M.esc(res.comprobacion.motivo || ''));

        /* Demostración concreta de que el orden importa. */
        var inv = alg().inversa(A);
        if (inv.existe && B.f === A.f && B.c === A.c) {
          var izq = alg().matProd(inv.inv, B), der = alg().matProd(B, inv.inv);
          var iguales = alg().matIgual(izq, der);
          h += titulo('¿Y si me equivoco de lado?');
          h += caja('Multiplicando por la izquierda', 'A^{-1}B = ' + alg().matTex(izq));
          h += caja('Multiplicando por la derecha', 'BA^{-1} = ' + alg().matTex(der));
          h += iguales
            ? aviso('En este caso concreto las dos matrices coinciden, pero eso es <b>casualidad</b>: ' +
              'estas dos matrices conmutan. En general ' + K('A^{-1}B \\ne BA^{-1}') + ', así que no se ' +
              'puede elegir el lado a capricho.')
            : mal('Las dos matrices son <b>distintas</b>: ' + K('A^{-1}B \\ne BA^{-1}') + '. Por eso el ' +
              'lado por el que se multiplica forma parte de la respuesta, y equivocarse de lado da un ' +
              'resultado erróneo aunque las cuentas estén bien hechas.');
        }

        h += M.kvs([
          'tipo = <b>' + tipo + '</b>',
          'se multiplica por la <b>' + res.lado + '</b>',
          'det(A) = <b>' + (A.f === A.c ? fracTxt(alg().det(A)) : 'no cuadrada') + '</b>',
          'dim(X) = <b>' + alg().dimTxt(res.X) + '</b>',
          'comprobación = <b>' + (res.comprobacion.correcta ? 'correcta' : 'fallida') + '</b>'
        ]);
        h += parrafo('<b>Guion para el examen.</b> (1) Se comprueba que ' + K('A') + ' es regular ' +
          'calculando ' + K('\\det(A)') + '. (2) Se dice <i>por qué</i> se multiplica por la izquierda o ' +
          'por la derecha. (3) Se simplifica usando ' + K('A^{-1}A = I') + ' y ' + K('IX = X') + '. ' +
          '(4) Se calcula ' + K('A^{-1}') + ' (por Gauss-Jordan o con la fórmula del orden 2). ' +
          '(5) Se hace el producto <b>en el orden correcto</b>. (6) Se comprueba.');
        return h;
      }, EJEMPLO));
  };

  function ecuPlantilla(tipo) {
    return {
      'AX=B': 'A\\cdot X = B',
      'XA=B': 'X\\cdot A = B',
      'AX+B=C': 'A\\cdot X + B = C',
      'XA+B=C': 'X\\cdot A + B = C',
      'AXB=C': 'A\\cdot X\\cdot B = C',
      'AX=B+X': 'A\\cdot X = B + X'
    }[tipo] || 'A\\cdot X = B';
  }
  function lado(l) {
    if (l === 'derecha') {
      return 'Aquí la incógnita ' + K('X') + ' aparece <b>a la izquierda</b> de ' + K('A') +
        ' (es decir, ' + K('X\\cdot A') + '), así que hay que multiplicar por ' + K('A^{-1}') +
        ' <b>por la derecha</b> en los dos miembros. Si se multiplicara por la izquierda quedaría ' +
        K('A^{-1}XA') + ', que no se simplifica porque el producto no es conmutativo.';
    }
    if (l === 'ambos') {
      return 'Aquí la incógnita tiene un factor <b>a cada lado</b>, así que hacen falta <b>dos</b> ' +
        'multiplicaciones: por ' + K('A^{-1}') + ' por la izquierda y por ' + K('B^{-1}') +
        ' por la derecha, cada una por el lado en el que está su matriz.';
    }
    return 'Aquí la incógnita ' + K('X') + ' aparece <b>a la derecha</b> de ' + K('A') +
      ' (es decir, ' + K('A\\cdot X') + '), así que hay que multiplicar por ' + K('A^{-1}') +
      ' <b>por la izquierda</b> en los dos miembros. Si se multiplicara por la derecha quedaría ' +
      K('AXA^{-1}') + ', donde ' + K('A^{-1}') + ' ni siquiera llega a tocar a ' + K('A') + '.';
  }

  /* ==================================================================
     7 · Tema 1.16 · entrenador de despeje
     ================================================================== */
  var TIPOS_DESPEJE = ['AX=B', 'XA=B', 'AX+B=C', 'XA+B=C', 'AXB=C', 'AX=B+X'];
  var LETRAS = ['a', 'b', 'c', 'd', 'e'];

  /* Cuestión número n (desde 1) del tipo pedido. */
  function preguntaDespeje(tipo, n) {
    n = Math.max(1, Math.round(Number(n) || 1));
    var t = tipo;
    if (!t || t === 'aleatorio') t = TIPOS_DESPEJE[(n - 1) % TIPOS_DESPEJE.length];
    if (TIPOS_DESPEJE.indexOf(t) < 0) t = 'AX=B';
    var lista = alg().pasoDespeje(t);
    var salto = (tipo === 'aleatorio' || !tipo) ? TIPOS_DESPEJE.length : 1;
    var idx = Math.floor((n - 1) / salto) % lista.length;
    var Q = lista[idx];
    return {
      tipo: t, indice: idx, numero: n,
      clave: t + '·' + idx,
      enunciado: Q.enunciado,
      opciones: Q.opciones,
      correcta: Q.correcta,
      porque: Q.porque
    };
  }

  /* Diagnóstico del error típico cometido al elegir una opción falsa. */
  function errorTipico(Q, elegida) {
    var txtE = String(Q.opciones[elegida] || '');
    var txtC = String(Q.opciones[Q.correcta] || '');
    if (/[Dd]ividir|dfrac\{B\}\{A\}|B\/A|entre \$A\$/.test(txtE)) {
      return {
        rotulo: 'Has intentado DIVIDIR matrices',
        texto: 'La división de matrices <b>no existe</b>. No hay ningún símbolo ' + K('\\dfrac{B}{A}') +
          ' en álgebra de matrices: lo único que se puede hacer es multiplicar por la inversa ' +
          K('A^{-1}') + ', y solo cuando ' + K('A') + ' es regular.'
      };
    }
    if (/conmutativ/i.test(txtE)) {
      return {
        rotulo: 'Has supuesto que el producto es conmutativo',
        texto: 'El producto de matrices <b>no es conmutativo</b>: en general ' + K('AB \\ne BA') + '. ' +
          'Por eso el lado por el que se multiplica no da igual y forma parte de la respuesta.'
      };
    }
    if ((/izquierda/.test(txtE) && /derecha/.test(txtC)) || (/derecha/.test(txtE) && /izquierda/.test(txtC))) {
      return {
        rotulo: 'Te has equivocado de LADO',
        texto: 'Hay que multiplicar por ' + K('A^{-1}') + ' <b>por el mismo lado en el que está ' +
          K('A') + '</b>: si la ecuación es ' + K('AX = B') + ' se multiplica por la izquierda, y si es ' +
          K('XA = B') + ' se multiplica por la derecha. Por el lado equivocado la ' + K('A^{-1}') +
          ' no llega a tocar a la ' + K('A') + ' y no se simplifica nada.'
      };
    }
    if (/A\^\{-1\}/.test(txtE) && /A\^\{-1\}/.test(txtC)) {
      return {
        rotulo: 'Has cambiado el ORDEN del producto',
        texto: 'Los factores llevan un orden obligatorio: ' + K('A^{-1}B') + ' y ' + K('BA^{-1}') +
          ' son en general matrices distintas. Si se ha multiplicado por la izquierda, la ' +
          K('A^{-1}') + ' queda <b>delante</b>; si se ha multiplicado por la derecha, queda <b>detrás</b>.'
      };
    }
    if (/A - 1|A-1/.test(txtE)) {
      return {
        rotulo: 'Has escrito ' + K('A-1') + ' en vez de ' + K('A-I'),
        texto: 'El «uno» del producto de matrices es la <b>matriz identidad</b> ' + K('I') + '. ' +
          'No se puede restar el número 1 a una matriz: el factor común correcto es ' + K('A - I') +
          ', porque ' + K('X = IX') + '.'
      };
    }
    return {
      rotulo: 'Repasa el paso',
      texto: 'Vuelve a mirar en qué lado está la matriz que acompaña a ' + K('X') + ' y qué operación ' +
        'hace falta para hacerla desaparecer sin romper la igualdad.'
    };
  }

  R.despeja = function (node) {
    var marcador = {};
    var verSol = false;

    function reinicia(c) {
      verSol = false;
      if (c && c.op) c.op.value = '0';
    }

    return M.shell(node, 'Entrenador de despeje',
      'Cuestiones de opción múltiple sobre <b>el paso siguiente</b> al despejar una ecuación matricial. ' +
      'Elige el tipo de ecuación (o déjalo en aleatorio), lee el enunciado y marca tu opción en el ' +
      'desplegable <b>Tu respuesta</b>: la corrección es inmediata y, si fallas, el applet te dice ' +
      '<b>qué error típico</b> has cometido (dividir matrices, multiplicar por el lado equivocado u ' +
      'olvidar el orden del producto). Puedes ir a una cuestión concreta escribiendo su número, por ' +
      'ejemplo <code>7</code>, y el marcador va contando tus aciertos.',
      [
        {
          id: 'tipo', label: 'Tipo de ecuación', type: 'select', value: 'aleatorio', ancho: '15rem',
          options: [{ value: 'aleatorio', label: 'Aleatorio (todos los tipos)' }].concat(
            TIPOS_DESPEJE.map(function (t) { return { value: t, label: nombreEc(t) }; }))
        },
        { id: 'n', label: 'Cuestión número', type: 'number', min: 1, max: 200, value: 1, ancho: '9rem' },
        {
          id: 'op', label: 'Tu respuesta', type: 'select', value: '0', ancho: '11rem',
          options: [
            { value: '0', label: '— elige —' },
            { value: '1', label: 'a' }, { value: '2', label: 'b' },
            { value: '3', label: 'c' }, { value: '4', label: 'd' }
          ]
        },
        {
          id: 'sig', label: 'Siguiente cuestión', type: 'button',
          click: function (c) { c.n.value = String(Number(c.n.value || 1) + 1); reinicia(c); }
        },
        {
          id: 'ant', label: 'Cuestión anterior', type: 'button',
          click: function (c) { c.n.value = String(Math.max(1, Number(c.n.value || 1) - 1)); reinicia(c); }
        },
        { id: 'ver', label: 'Ver la explicación', type: 'button', click: function () { verSol = true; } },
        chips([
          {
            txt: 'Empezar por AX = B', tip: 'el caso más básico',
            set: { tipo: 'AX=B', n: 1, op: '0' }, extra: function (c) { reinicia(c); }
          },
          {
            txt: 'Practicar XA = B', tip: 'multiplicar por la derecha',
            set: { tipo: 'XA=B', n: 1, op: '0' }, extra: function (c) { reinicia(c); }
          },
          {
            txt: 'Con término independiente', tip: 'AX + B = C',
            set: { tipo: 'AX+B=C', n: 1, op: '0' }, extra: function (c) { reinicia(c); }
          },
          {
            txt: 'Dos inversas · AXB = C', tip: 'una por cada lado',
            set: { tipo: 'AXB=C', n: 1, op: '0' }, extra: function (c) { reinicia(c); }
          },
          {
            txt: 'Factor común · AX = B + X', tip: 'el «uno» es la identidad',
            set: { tipo: 'AX=B+X', n: 1, op: '0' }, extra: function (c) { reinicia(c); }
          },
          {
            txt: 'Tanda mezclada', tip: 'todos los tipos, uno detrás de otro',
            set: { tipo: 'aleatorio', n: 1, op: '0' }, extra: function (c) { reinicia(c); }
          },
          {
            txt: 'Reiniciar el marcador', tip: 'pone a cero los aciertos',
            set: { n: 1, op: '0' },
            extra: function (c) { marcador = {}; reinicia(c); }
          }
        ])
      ],
      safe(function (v) {
        var Q = preguntaDespeje(v.tipo, v.n);
        var elegida = Math.round(Number(v.op) || 0) - 1;

        var h = '<div class="ap-enun"><b>Cuestión ' + Q.numero + ' · ecuación del tipo ' +
          M.esc(nombreEc(Q.tipo)) + '</b>' +
          '<div class="mtxd-ref">tipo ' + M.esc(Q.tipo) + ' · pregunta ' + (Q.indice + 1) +
          ' de ' + alg().pasoDespeje(Q.tipo).length + '</div>' +
          '<p class="mtxd-txt">' + M.texifica(Q.enunciado) + '</p></div>';

        h += '<ol class="mtxd-opciones">';
        Q.opciones.forEach(function (o, idx) {
          var clase = 'mtxd-opcion';
          if (elegida >= 0) {
            if (idx === Q.correcta) clase += ' mtxd-op-ok';
            else if (idx === elegida) clase += ' mtxd-op-ko';
          }
          h += '<li class="' + clase + '"><b>' + LETRAS[idx] + ')</b> ' + M.texifica(o) + '</li>';
        });
        h += '</ol>';

        if (elegida < 0) {
          h += aviso('Elige una opción en el desplegable <b>Tu respuesta</b> (a, b, c o d) y se corregirá ' +
            'al instante.');
        } else if (elegida >= Q.opciones.length) {
          h += aviso('Esta cuestión solo tiene ' + Q.opciones.length + ' opciones (' +
            LETRAS.slice(0, Q.opciones.length).join(', ') + '). Elige una de ellas.');
        } else {
          var ok = elegida === Q.correcta;
          marcador[Q.clave] = ok;
          h += ok
            ? bien('<b>Correcto.</b> Has elegido la opción ' + LETRAS[elegida] + ').')
            : mal('<b>Todavía no.</b> Has elegido la opción ' + LETRAS[elegida] + ') y la correcta es la ' +
              LETRAS[Q.correcta] + ').');
          if (!ok) {
            var E = errorTipico(Q, elegida);
            h += '<div class="mtxd-fallo"><b>' + E.rotulo + '.</b> ' + E.texto + '</div>';
          }
          h += '<div class="mtxd-porque"><b>Por qué:</b> ' + M.texifica(Q.porque) + '</div>';
        }

        if (verSol) {
          h += titulo('Explicación completa');
          h += M.paso(1, 'La respuesta correcta es la <b>' + LETRAS[Q.correcta] + ')</b>: ' +
            M.texifica(Q.opciones[Q.correcta]) + '.', 'ap-paso-clave');
          h += M.paso(2, M.texifica(Q.porque));
          h += M.paso(3, 'Recuerda el esquema general: en ' + K('AX = B') + ' se multiplica por ' +
            K('A^{-1}') + ' <b>por la izquierda</b> y sale ' + K('X = A^{-1}B') + '; en ' + K('XA = B') +
            ' se multiplica <b>por la derecha</b> y sale ' + K('X = BA^{-1}') + '.');
        }

        h += titulo('Los tres errores que más se repiten');
        h += M.tabla(['Error', 'Cómo suena', 'Por qué está mal'], [
          ['Dividir matrices', K('X = \\dfrac{B}{A}'),
            'La división de matrices no existe: solo se puede multiplicar por ' + K('A^{-1}') + '.'],
          ['Lado equivocado', K('XA = B \\Rightarrow X = A^{-1}B'),
            'Por ese lado ' + K('A^{-1}') + ' no toca a ' + K('A') + ' y no se simplifica nada.'],
          ['Orden del producto', K('AX = B \\Rightarrow X = BA^{-1}'),
            'El producto no es conmutativo: ' + K('A^{-1}B \\ne BA^{-1}') + ' en general.']
        ]);

        var claves = Object.keys(marcador);
        var aciertos = claves.filter(function (k) { return marcador[k]; }).length;
        h += M.resultado(aciertos + ' / ' + claves.length, 'cuestiones acertadas');
        h += M.kvs([
          'tipo = <b>' + M.esc(Q.tipo) + '</b>',
          'cuestión = <b>' + Q.numero + '</b>',
          'contestadas = <b>' + claves.length + '</b>',
          'aciertos = <b>' + aciertos + '</b>',
          'fallos = <b>' + (claves.length - aciertos) + '</b>'
        ]);
        h += parrafo('El marcador cuenta cada cuestión una sola vez: si la corriges, se guarda tu último ' +
          'intento. Pulsa <b>Siguiente cuestión</b> para avanzar por toda la tanda.');
        return h;
      }, 'Elige una opción del desplegable <b>Tu respuesta</b>, por ejemplo <code>b</code>.'));
  };

  /* ==================================================================
     8 · Tema 1.17 · autoevaluación del tema
     ================================================================== */

  /* Generador pseudoaleatorio reproducible a partir de la semilla. */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function dado(rnd, min, max) { return min + Math.floor(rnd() * (max - min + 1)); }
  function dadoNoCero(rnd, min, max) {
    var v = dado(rnd, min, max), t = 0;
    while (v === 0 && t++ < 20) v = dado(rnd, min, max);
    return v === 0 ? 1 : v;
  }
  function elige(rnd, lista) { return lista[Math.floor(rnd() * lista.length) % lista.length]; }

  function matNums(rnd, f, c, min, max) {
    var a = [], i, j;
    for (i = 0; i < f; i++) { a.push([]); for (j = 0; j < c; j++) a[i].push(dado(rnd, min, max)); }
    return alg().matDe(a);
  }
  function matRegular(rnd, n, min, max) {
    var A, t = 0;
    do { A = matNums(rnd, n, n, min, max); t++; } while (cero(alg().det(A)) && t < 80);
    if (cero(alg().det(A))) A = alg().matIdentidad(n);
    return A;
  }
  function matSingular(rnd, n) {
    var a = [], i, j;
    for (i = 0; i < n - 1; i++) { a.push([]); for (j = 0; j < n; j++) a[i].push(dado(rnd, -4, 4)); }
    var ultima = [];
    var k1 = dadoNoCero(rnd, -3, 3), k2 = dado(rnd, -3, 3);
    for (j = 0; j < n; j++) {
      var s = k1 * a[0][j] + (n > 2 ? k2 * a[1][j] : 0);
      ultima.push(s);
    }
    a.push(ultima);
    var A = alg().matDe(a);
    if (!cero(alg().det(A))) {
      /* garantía: si por casualidad no ha salido singular, duplicamos una fila */
      var b = A.a.map(function (fil) { return fil.slice(); });
      b[n - 1] = b[0].slice();
      A = new (alg().Mat)(b);
    }
    return A;
  }

  var TIPOS_Q = [
    { value: 'dimension', label: 'Dimensión de una matriz' },
    { value: 'tipos', label: 'Tipos de matriz (sí o no)' },
    { value: 'transpuesta', label: 'Matriz transpuesta' },
    { value: 'suma', label: 'Suma y resta de matrices' },
    { value: 'producto', label: 'Producto de matrices' },
    { value: 'potencia', label: 'Potencias de una matriz' },
    { value: 'rango', label: 'Rango de una matriz' },
    { value: 'inversa', label: 'Matriz inversa' },
    { value: 'ecuacion', label: 'Ecuación matricial' }
  ];
  var CLAVES_Q = TIPOS_Q.map(function (t) { return t.value; });
  function nombreQ(t) {
    if (t === 'aleatorio') return 'aleatorio (todo el tema)';
    var f = TIPOS_Q.filter(function (u) { return u.value === t; });
    return f.length ? f[0].label : 'aleatorio (todo el tema)';
  }

  /* ---- generadores de cuestión ---- */
  function qDimension(rnd) {
    var f = dado(rnd, 2, 4), c = dado(rnd, 2, 4);
    var A = matNums(rnd, f, c, -5, 5);
    return {
      tipo: 'dimension',
      titulo: 'Dimensión de una matriz',
      enun: 'Observa la matriz' + KD(alg().matTex(A)) +
        '<p class="mtxd-txt">¿Cuál es su dimensión?</p>',
      pide: 'Escribe la dimensión con el formato <code>3x2</code> (filas por columnas).',
      modo: 'dim', clave: f + 'x' + c,
      pista: 'Primero el número de <b>filas</b> (líneas horizontales) y después el de <b>columnas</b>.',
      explica: function () {
        var hh = M.paso(1, 'Contamos las filas: hay <b>' + f + '</b>.');
        hh += M.paso(2, 'Contamos las columnas: hay <b>' + c + '</b>.');
        hh += M.paso(3, 'La dimensión se escribe filas × columnas: ' +
          K('A = (a_{ij})_{' + f + '\\times ' + c + '}') + ', es decir ' + K(f + '\\times ' + c) + '.',
          'ap-paso-clave');
        hh += M.paso(4, 'La matriz tiene ' + K(f + '\\cdot ' + c + ' = ' + (f * c)) + ' elementos, y ' +
          (f === c ? 'es <b>cuadrada</b> de orden ' + f + '.' : 'es <b>rectangular</b>.'));
        return hh;
      }
    };
  }

  function qTipos(rnd) {
    var n = dado(rnd, 2, 3);
    var propiedad = elige(rnd, ['simétrica', 'triangular superior', 'diagonal', 'antisimétrica']);
    var tipoGen = elige(rnd, ['simetrica', 'triangular', 'diagonal', 'cualquiera', 'antisimetrica']);
    var A;
    if (tipoGen === 'simetrica') {
      A = matNums(rnd, n, n, -4, 4);
      var b = A.a.map(function (fil) { return fil.slice(); }), i, j;
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) b[j][i] = b[i][j];
      A = new (alg().Mat)(b);
    } else if (tipoGen === 'antisimetrica') {
      var c0 = [], i2, j2;
      for (i2 = 0; i2 < n; i2++) { c0.push([]); for (j2 = 0; j2 < n; j2++) c0[i2].push(F0()); }
      for (i2 = 0; i2 < n; i2++) {
        for (j2 = i2 + 1; j2 < n; j2++) {
          var val = new Frac(dado(rnd, -4, 4));
          c0[i2][j2] = val; c0[j2][i2] = val.opuesto();
        }
      }
      A = new (alg().Mat)(c0);
    } else if (tipoGen === 'triangular') {
      var d0 = [], i3, j3;
      for (i3 = 0; i3 < n; i3++) {
        d0.push([]);
        for (j3 = 0; j3 < n; j3++) d0[i3].push(new Frac(j3 >= i3 ? dado(rnd, -4, 4) : 0));
      }
      A = new (alg().Mat)(d0);
    } else if (tipoGen === 'diagonal') {
      var e0 = [], i4, j4;
      for (i4 = 0; i4 < n; i4++) {
        e0.push([]);
        for (j4 = 0; j4 < n; j4++) e0[i4].push(new Frac(i4 === j4 ? dadoNoCero(rnd, -4, 4) : 0));
      }
      A = new (alg().Mat)(e0);
    } else {
      A = matNums(rnd, n, n, -4, 4);
    }
    var C = alg().clasifica(A);
    var valor = propiedad === 'simétrica' ? C.simetrica
      : propiedad === 'triangular superior' ? C.triangularSup
        : propiedad === 'diagonal' ? C.diagonal : C.antisimetrica;
    return {
      tipo: 'tipos',
      titulo: 'Tipos de matriz',
      enun: 'Observa la matriz' + KD(alg().matTex(A)) +
        '<p class="mtxd-txt">¿Es una matriz <b>' + propiedad + '</b>?</p>',
      pide: 'Contesta <code>sí</code> o <code>no</code>.',
      modo: 'sino', clave: valor ? 'si' : 'no',
      pista: 'Compara ' + K('a_{ij}') + ' con ' + K('a_{ji}') + ' y mira qué hay por debajo de la ' +
        'diagonal principal.',
      explica: function () {
        var hh = M.paso(1, 'La matriz es cuadrada de orden ' + n + ', así que tiene sentido preguntarse ' +
          'por estos tipos.');
        hh += M.paso(2, 'Su transpuesta es' + KD('A^{t} = ' + alg().matTex(alg().matTrans(A))));
        hh += M.paso(3, 'Etiquetas que le corresponden: <b>' + C.nombres.join(', ') + '</b>.', 'ap-paso-clave');
        hh += M.paso(4, 'Por tanto, a la pregunta «¿es ' + propiedad + '?» la respuesta es <b>' +
          (valor ? 'sí' : 'no') + '</b>.', 'ap-paso-clave');
        return hh;
      }
    };
  }

  function qTranspuesta(rnd) {
    var f = dado(rnd, 2, 3), c = dado(rnd, 2, 3);
    var A = matNums(rnd, f, c, -6, 6);
    var i = dado(rnd, 0, c - 1), j = dado(rnd, 0, f - 1);
    var T = alg().matTrans(A);
    return {
      tipo: 'transpuesta',
      titulo: 'Matriz transpuesta',
      enun: 'Sea la matriz' + KD('A = ' + alg().matTex(A)) +
        '<p class="mtxd-txt">Si ' + K('B = A^{t}') + ', ¿cuánto vale el elemento ' +
        K('b_{' + (i + 1) + (j + 1) + '}') + '?</p>',
      pide: 'Escribe un solo número (vale una fracción como <code>3/4</code>).',
      modo: 'numero', clave: T.a[i][j],
      pista: 'Al transponer, las filas pasan a ser columnas: ' + K('b_{ij} = a_{ji}') + '.',
      explica: function () {
        var hh = M.paso(1, 'La transpuesta cambia filas por columnas:' +
          KD('A^{t} = ' + alg().matTex(T)));
        hh += M.paso(2, 'La regla es ' + K('b_{ij} = a_{ji}') + ', así que ' +
          K('b_{' + (i + 1) + (j + 1) + '} = a_{' + (j + 1) + (i + 1) + '} = ' + FT(A.a[j][i])) + '.',
          'ap-paso-clave');
        hh += M.paso(3, 'Comprueba también las dimensiones: ' + K('A') + ' es ' + alg().dimTxt(A) +
          ' y ' + K('A^{t}') + ' es ' + alg().dimTxt(T) + '.');
        return hh;
      }
    };
  }

  function qSuma(rnd) {
    var f = dado(rnd, 2, 3), c = dado(rnd, 2, 3);
    var A = matNums(rnd, f, c, -6, 6), B = matNums(rnd, f, c, -6, 6);
    var resta = rnd() < 0.5;
    var Rm = resta ? alg().matResta(A, B) : alg().matSuma(A, B);
    return {
      tipo: 'suma',
      titulo: resta ? 'Resta de matrices' : 'Suma de matrices',
      enun: 'Dadas las matrices' + KD('A = ' + alg().matTex(A) + ', \\qquad B = ' + alg().matTex(B)) +
        '<p class="mtxd-txt">Calcula ' + K(resta ? 'A - B' : 'A + B') + '.</p>',
      pide: 'Escribe la matriz por filas, por ejemplo <code>1 2; 3 4</code>.',
      modo: 'matriz', clave: Rm,
      pista: 'Las dos matrices tienen la misma dimensión, así que se opera <b>elemento a elemento</b>.',
      explica: function () {
        var hh = M.paso(1, 'Las dos matrices son de dimensión ' + alg().dimTxt(A) +
          ', así que la operación se puede hacer: el resultado tiene esa misma dimensión.');
        hh += M.paso(2, 'Se opera elemento a elemento:' +
          KD(alg().matTex(A) + (resta ? ' - ' : ' + ') + alg().matTex(B) + ' = ' + alg().matTex(Rm)),
          'ap-paso-clave');
        hh += M.paso(3, resta
          ? 'Cuidado con los signos: restar es sumar la opuesta, ' + K('A - B = A + (-B)') + '.'
          : 'La suma de matrices es conmutativa: ' + K('A + B = B + A') + '.');
        return hh;
      }
    };
  }

  function qProducto(rnd) {
    var m = dado(rnd, 2, 3), n = dado(rnd, 2, 3), p = dado(rnd, 2, 3);
    var A = matNums(rnd, m, n, -4, 4), B = matNums(rnd, n, p, -4, 4);
    var P = alg().matProd(A, B);
    var i = dado(rnd, 0, m - 1), j = dado(rnd, 0, p - 1);
    return {
      tipo: 'producto',
      titulo: 'Producto de matrices',
      enun: 'Dadas las matrices' + KD('A = ' + alg().matTex(A) + ', \\qquad B = ' + alg().matTex(B)) +
        '<p class="mtxd-txt">Si ' + K('C = A\\cdot B') + ', ¿cuánto vale el elemento ' +
        K('c_{' + (i + 1) + (j + 1) + '}') + '?</p>',
      pide: 'Escribe un solo número (vale una fracción como <code>3/4</code>).',
      modo: 'numero', clave: P.a[i][j],
      pista: 'El elemento ' + K('c_{ij}') + ' es la fila ' + (i + 1) + ' de ' + K('A') +
        ' por la columna ' + (j + 1) + ' de ' + K('B') + '.',
      explica: function () {
        var fila = A.a[i], col = [], q;
        for (q = 0; q < n; q++) col.push(B.a[q][j]);
        var det2 = alg().filaPorColumna(fila, col);
        var hh = M.paso(1, 'Las dimensiones encajan: ' + K('(' + m + '\\times ' + n + ')\\cdot(' +
          n + '\\times ' + p + ') = ' + m + '\\times ' + p) + '.');
        hh += M.paso(2, 'Tomamos la fila ' + (i + 1) + ' de ' + K('A') + ' y la columna ' + (j + 1) +
          ' de ' + K('B') + ' y multiplicamos término a término, sumando:' + KD(det2.tex), 'ap-paso-clave');
        hh += M.paso(3, 'La matriz producto completa es' + KD('A\\cdot B = ' + alg().matTex(P)));
        return hh;
      }
    };
  }

  function qPotencia(rnd) {
    var modelos = [
      [[1, 1], [0, 1]], [[1, 0], [1, 1]], [[0, 1], [1, 0]],
      [[2, 0], [0, 3]], [[1, 2], [0, 1]], [[0, 0], [1, 0]], [[1, 1], [1, 1]]
    ];
    var A = alg().matDe(elige(rnd, modelos));
    var n = dado(rnd, 2, 4);
    var P = alg().matPot(A, n);
    return {
      tipo: 'potencia',
      titulo: 'Potencia de una matriz',
      enun: 'Sea la matriz' + KD('A = ' + alg().matTex(A)) +
        '<p class="mtxd-txt">Calcula ' + K('A^{' + n + '}') + '.</p>',
      pide: 'Escribe la matriz por filas, por ejemplo <code>1 2; 3 4</code>.',
      modo: 'matriz', clave: P,
      pista: 'Multiplica ' + K('A\\cdot A') + ' y sigue multiplicando por ' + K('A') +
        '; busca si aparece un patrón.',
      explica: function () {
        var PP = alg().matPotPasos(A, n);
        var hh = '';
        PP.pot.forEach(function (u, idx) {
          hh += M.paso(String(idx + 1), K('A^{' + u.k + '} = ') + KD(alg().matTex(u.M)),
            idx === PP.pot.length - 1 ? 'ap-paso-clave' : '');
        });
        if (PP.patron) hh += M.paso(String(PP.pot.length + 1), '<b>Patrón detectado:</b> ' + M.texifica(PP.patron));
        hh += M.paso(String(PP.pot.length + 2), 'Las potencias se calculan multiplicando por ' + K('A') +
          ' una y otra vez; conviene mirar si la matriz es <b>idempotente</b> (' + K('A^2 = A') +
          '), <b>nilpotente</b> (alguna potencia es la matriz nula) o <b>periódica</b>.');
        return hh;
      }
    };
  }

  function qRango(rnd) {
    var f = dado(rnd, 2, 3), c = dado(rnd, 2, 4);
    var A, caso = elige(rnd, ['libre', 'dependiente', 'proporcional']);
    if (caso === 'libre') {
      A = matNums(rnd, f, c, -4, 4);
    } else if (caso === 'proporcional') {
      var b0 = matNums(rnd, f, c, -4, 4).a.map(function (fil) { return fil.slice(); });
      var k = new Frac(dadoNoCero(rnd, -3, 3));
      b0[f - 1] = b0[0].map(function (u) { return u.por(k); });
      A = new (alg().Mat)(b0);
    } else {
      var b1 = matNums(rnd, f, c, -4, 4).a.map(function (fil) { return fil.slice(); });
      if (f >= 3) {
        b1[2] = b1[0].map(function (u, q) { return u.mas(b1[1][q]); });
      } else {
        b1[1] = b1[0].map(function (u) { return u.por(new Frac(2)); });
      }
      A = new (alg().Mat)(b1);
    }
    var r = alg().rango(A);
    return {
      tipo: 'rango',
      titulo: 'Rango de una matriz',
      enun: 'Calcula el rango de' + KD(alg().matTex(A)),
      pide: 'Escribe un número entero, por ejemplo <code>2</code>.',
      modo: 'numero', clave: new Frac(r),
      pista: 'Escalona por Gauss y cuenta las <b>filas no nulas</b> que quedan.',
      explica: function () {
        var RP = alg().rangoPasos(A);
        var hh = '';
        RP.pasos.forEach(function (p, idx) {
          hh += M.paso(String(idx), '<p>' + M.texifica(p.desc || '') + '</p>' +
            (p.op ? op(p.op) : '') + KD(alg().matTex(p.M)));
        });
        hh += M.paso(String(RP.pasos.length), M.texifica(RP.resumen), 'ap-paso-clave');
        hh += M.paso(String(RP.pasos.length + 1), 'Recuerda la cota: ' +
          K('\\operatorname{rg}(A) \\le \\min(' + A.f + ', ' + A.c + ') = ' + Math.min(A.f, A.c)) + '.');
        return hh;
      }
    };
  }

  function qInversa(rnd) {
    var singular = rnd() < 0.35;
    if (singular) {
      var S0 = matSingular(rnd, 2);
      return {
        tipo: 'inversa',
        titulo: 'Existencia de la inversa',
        enun: 'Observa la matriz' + KD('A = ' + alg().matTex(S0)) +
          '<p class="mtxd-txt">¿Tiene inversa esta matriz?</p>',
        pide: 'Contesta <code>sí</code> o <code>no</code>.',
        modo: 'sino', clave: 'no',
        pista: 'Calcula el determinante: una matriz cuadrada tiene inversa exactamente cuando ' +
          'su determinante es distinto de cero.',
        explica: function () {
          var D = alg().detPasos(S0);
          var hh = M.paso(1, 'Calculamos el determinante:' + KD(D.tex));
          hh += M.paso(2, 'Sale ' + K('\\det(A) = ' + FT(D.valor)) + ', es decir <b>cero</b>.', 'ap-paso-clave');
          hh += M.paso(3, 'Además ' + K('\\operatorname{rg}(A) = ' + alg().rango(S0) + ' < 2') +
            ': las filas son linealmente dependientes.');
          hh += M.paso(4, 'Si existiera ' + K('A^{-1}') + ' tendríamos ' + K('A\\cdot A^{-1} = I') +
            ', y el rango de un producto nunca supera el de sus factores: saldría ' +
            K('2 = \\operatorname{rg}(I) \\le \\operatorname{rg}(A) = 1') + ', que es imposible. ' +
            'La matriz es <b>singular</b>: <b>no</b> tiene inversa.', 'ap-paso-clave');
          return hh;
        }
      };
    }
    var A = matRegular(rnd, 2, -4, 4);
    var inv = alg().inversa2x2(A);
    return {
      tipo: 'inversa',
      titulo: 'Cálculo de la matriz inversa',
      enun: 'Sea la matriz' + KD('A = ' + alg().matTex(A)) +
        '<p class="mtxd-txt">Calcula ' + K('A^{-1}') + ' (puede tener elementos fraccionarios).</p>',
      pide: 'Escribe la matriz por filas, con fracciones si hace falta: <code>1/2 3; 0 -2</code>.',
      modo: 'matriz', clave: inv.inv,
      pista: 'Para el orden 2: ' + K('A^{-1} = \\dfrac{1}{ad-bc}\\left(\\begin{array}{cc} d & -b \\\\ -c & a \\end{array}\\right)') + '.',
      explica: function () {
        var hh = M.paso(1, 'Primero el determinante: ' + K('\\det(A) = ad - bc = ' + FT(inv.det)) +
          ', distinto de cero, así que la inversa existe.');
        hh += M.paso(2, 'Aplicamos la fórmula del orden 2:' + KD(inv.tex), 'ap-paso-clave');
        hh += M.paso(3, 'Comprobación:' + KD('A\\cdot A^{-1} = ' +
          alg().matTex(alg().matProd(A, inv.inv)) + ' = I'));
        return hh;
      }
    };
  }

  function qEcuacion(rnd) {
    var tipo = elige(rnd, ['AX=B', 'XA=B', 'AX+B=C']);
    var A = matRegular(rnd, 2, -3, 3);
    var Xs = matNums(rnd, 2, 2, -3, 3);
    var B, C = null, res;
    if (tipo === 'AX=B') {
      B = alg().matProd(A, Xs);
    } else if (tipo === 'XA=B') {
      B = alg().matProd(Xs, A);
    } else {
      B = matNums(rnd, 2, 2, -3, 3);
      C = alg().matSuma(alg().matProd(A, Xs), B);
    }
    res = alg().ecuMatricial(tipo, A, B, C);
    if (!res.ok) {                                  /* red de seguridad: nunca debería pasar */
      return qInversa(rnd);
    }
    var enun = 'Resuelve la ecuación matricial ' + K(nombreEc(tipo)) + ' siendo' +
      KD('A = ' + alg().matTex(A) + ',\\qquad B = ' + alg().matTex(B) +
        (C ? ',\\qquad C = ' + alg().matTex(C) : ''));
    return {
      tipo: 'ecuacion',
      titulo: 'Ecuación matricial',
      enun: enun + '<p class="mtxd-txt">¿Cuál es la matriz ' + K('X') + '?</p>',
      pide: 'Escribe la matriz por filas, por ejemplo <code>1 2; 3 4</code>.',
      modo: 'matriz', clave: res.X,
      pista: tipo === 'XA=B'
        ? 'La ' + K('A') + ' está a la <b>derecha</b> de la ' + K('X') + ': multiplica por ' +
          K('A^{-1}') + ' por la derecha.'
        : 'La ' + K('A') + ' está a la <b>izquierda</b> de la ' + K('X') + ': multiplica por ' +
          K('A^{-1}') + ' por la izquierda.',
      explica: function () {
        var hh = '';
        res.pasos.forEach(function (p, idx) {
          hh += M.paso(String(idx + 1), M.texifica(p.desc) + (p.tex ? KD(p.tex) : ''),
            idx === res.pasos.length - 1 ? 'ap-paso-clave' : '');
        });
        hh += M.paso(String(res.pasos.length + 1), 'Recuerda: las matrices <b>no se dividen</b> y el ' +
          'producto <b>no es conmutativo</b>, por eso importa tanto el lado por el que se multiplica.');
        return hh;
      }
    };
  }

  /* Cuestión reproducible: misma semilla y mismo número → misma cuestión. */
  function generaCuestion(tipo, semilla, numero) {
    var s = Math.round(Number(semilla));
    if (!isFinite(s)) s = 1;
    var n = Math.max(1, Math.round(Number(numero) || 1));
    var rnd = mulberry32((s * 7919 + n * 104729) | 0);
    var t = tipo;
    if (!t || t === 'aleatorio' || CLAVES_Q.indexOf(t) < 0) {
      t = CLAVES_Q[Math.floor(rnd() * CLAVES_Q.length) % CLAVES_Q.length];
    }
    var Q;
    if (t === 'dimension') Q = qDimension(rnd);
    else if (t === 'tipos') Q = qTipos(rnd);
    else if (t === 'transpuesta') Q = qTranspuesta(rnd);
    else if (t === 'suma') Q = qSuma(rnd);
    else if (t === 'producto') Q = qProducto(rnd);
    else if (t === 'potencia') Q = qPotencia(rnd);
    else if (t === 'rango') Q = qRango(rnd);
    else if (t === 'inversa') Q = qInversa(rnd);
    else Q = qEcuacion(rnd);
    Q.numero = n;
    Q.semilla = s;
    Q.clavePregunta = s + '·' + n + '·' + Q.tipo;
    return Q;
  }

  /* Respuesta modelo de una cuestión, en texto tal y como se escribiría. */
  function respuestaModelo(Q) {
    if (Q.modo === 'numero') return fracTxt(Q.clave).replace('\u2212', '-');
    if (Q.modo === 'matriz') return alg().matTxt(Q.clave);
    return String(Q.clave);
  }

  /* Corrección de la respuesta escrita. Devuelve null si no hay respuesta
     y, si la hay, { ok, leido, msg }. Nunca lanza: los errores de lectura
     se convierten en un aviso didáctico. */
  function corrigeQ(Q, texto) {
    var s = String(texto === undefined || texto === null ? '' : texto).trim();
    if (s === '') return null;
    try {
      if (Q.modo === 'numero') {
        var f = FR(s.replace(',', '.'));
        return {
          ok: igF(f, Q.clave), leido: K(FT(f)),
          msg: 'He leído el número ' + fracTxt(f) + '.'
        };
      }
      if (Q.modo === 'matriz') {
        var Mm = alg().parseMat(s);
        var mismaDim = (Mm.f === Q.clave.f && Mm.c === Q.clave.c);
        return {
          ok: mismaDim && alg().matIgual(Mm, Q.clave), leido: KD(alg().matTex(Mm)),
          msg: mismaDim ? 'He leído una matriz de ' + alg().dimTxt(Mm) + '.'
            : 'He leído una matriz de ' + alg().dimTxt(Mm) + ', pero la solución es de ' +
              alg().dimTxt(Q.clave) + ': repasa primero la dimensión.'
        };
      }
      if (Q.modo === 'sino') {
        var t = s.toLowerCase().replace(/[áàä]/g, 'a').replace(/[íìï]/g, 'i').replace(/\.$/, '');
        var si = /^(si|sí|s|verdadero|v|cierto)$/.test(t);
        var no = /^(no|n|falso|f)$/.test(t);
        if (!si && !no) {
          throw Error('Contesta simplemente «sí» o «no» (también valen «v» y «f»). ' +
            'He leído «' + s + '».');
        }
        return {
          ok: (si ? 'si' : 'no') === Q.clave, leido: '<b>' + (si ? 'sí' : 'no') + '</b>',
          msg: 'He leído «' + (si ? 'sí' : 'no') + '».'
        };
      }
      /* modo 'dim': 3x2, 3 x 2, 3×2, 3,2 */
      var d = s.toLowerCase().replace(/\s+/g, '').replace(/[×*,·]/g, 'x').replace(/por/g, 'x');
      var mm = /^(\d+)x(\d+)$/.exec(d);
      if (!mm) {
        throw Error('Escribe la dimensión con el formato filas × columnas, por ejemplo 3x2. ' +
          'He leído «' + s + '».');
      }
      var leido = mm[1] + 'x' + mm[2];
      return {
        ok: leido === Q.clave, leido: '<b>' + mm[1] + ' × ' + mm[2] + '</b>',
        msg: 'He leído la dimensión ' + mm[1] + ' × ' + mm[2] + '.'
      };
    } catch (e) {
      return {
        ok: false, leido: '', error: true,
        msg: (e && e.message) ? e.message : 'No he entendido la respuesta.'
      };
    }
  }

  /* ------------------------------------------------------------------
     El applet: generador aleatorio de cuestiones de TODO el tema.
     ------------------------------------------------------------------ */
  R.autoevaluacion = function (node) {
    var marcador = {};                              /* clavePregunta -> true/false */
    var verSol = false;

    function limpia(c) {
      verSol = false;
      if (c && c.resp) c.resp.value = '';
    }

    return M.shell(node, 'Autoevaluación del tema',
      'Cuestiones <b>generadas al azar</b> sobre todo el tema: dimensiones, tipos de matriz, ' +
      'transpuesta, suma y resta, producto, potencias, rango, inversa y ecuaciones matriciales. ' +
      'Escribe tu respuesta en el campo <b>Tu respuesta</b> y se corrige al instante. Según la ' +
      'cuestión hay que escribir un <b>número</b> (vale una fracción: <code>3/4</code>), una ' +
      '<b>matriz por filas</b> (<code>2 1; 1 1</code>, o con fracciones <code>1/2 3; 0 -2</code>), ' +
      'una <b>dimensión</b> (<code>3x2</code>) o simplemente <code>sí</code> / <code>no</code>. ' +
      'Cambia la <b>semilla</b> para tener una tanda distinta y usa <b>Siguiente cuestión</b> para ' +
      'avanzar; el marcador va guardando tus aciertos.',
      [
        {
          id: 'tipo', label: 'Tema de las cuestiones', type: 'select', value: 'aleatorio', ancho: '17rem',
          options: [{ value: 'aleatorio', label: 'Aleatorio (todo el tema)' }].concat(TIPOS_Q)
        },
        { id: 'semilla', label: 'Semilla', type: 'number', min: 1, max: 9999, value: 7, ancho: '9rem' },
        { id: 'n', label: 'Cuestión número', type: 'number', min: 1, max: 400, value: 1, ancho: '9rem' },
        {
          id: 'resp', label: 'Tu respuesta', type: 'text', value: '', ancho: '18rem',
          place: '3/4   ·   2 1; 1 1   ·   3x2   ·   sí'
        },
        {
          id: 'sig', label: 'Siguiente cuestión', type: 'button',
          click: function (c) { c.n.value = String(Number(c.n.value || 1) + 1); limpia(c); }
        },
        {
          id: 'ant', label: 'Cuestión anterior', type: 'button',
          click: function (c) { c.n.value = String(Math.max(1, Number(c.n.value || 1) - 1)); limpia(c); }
        },
        { id: 'ver', label: 'Ver la solución', type: 'button', click: function () { verSol = true; } },
        chips([
          {
            txt: 'Tanda completa del tema', tip: 'cuestiones de todos los apartados',
            set: { tipo: 'aleatorio', semilla: 7, n: 1 }, extra: function (c) { limpia(c); }
          },
          {
            txt: 'Repaso · dimensiones y tipos', tip: 'apartados 1.1 a 1.4',
            set: { tipo: 'dimension', semilla: 12, n: 1 }, extra: function (c) { limpia(c); }
          },
          {
            txt: 'Repaso · suma y producto', tip: 'apartados 1.5 a 1.8',
            set: { tipo: 'producto', semilla: 21, n: 1 }, extra: function (c) { limpia(c); }
          },
          {
            txt: 'Repaso · potencias', tip: 'apartado 1.9',
            set: { tipo: 'potencia', semilla: 33, n: 1 }, extra: function (c) { limpia(c); }
          },
          {
            txt: 'Repaso · rango', tip: 'apartados 1.11 a 1.13',
            set: { tipo: 'rango', semilla: 44, n: 1 }, extra: function (c) { limpia(c); }
          },
          {
            txt: 'Repaso · inversa', tip: 'apartados 1.14 a 1.15',
            set: { tipo: 'inversa', semilla: 55, n: 1 }, extra: function (c) { limpia(c); }
          },
          {
            txt: 'Repaso · ecuaciones matriciales', tip: 'apartado 1.16',
            set: { tipo: 'ecuacion', semilla: 66, n: 1 }, extra: function (c) { limpia(c); }
          },
          {
            txt: 'Semilla al azar', tip: 'otra tanda distinta',
            set: { n: 1 },
            extra: function (c) {
              c.semilla.value = String(1 + Math.floor(Math.random() * 9000));
              limpia(c);
            }
          },
          {
            txt: 'Reiniciar el marcador', tip: 'pone los aciertos a cero',
            set: { n: 1 },
            extra: function (c) { marcador = {}; limpia(c); }
          }
        ])
      ],
      safe(function (v) {
        var Q = generaCuestion(v.tipo, v.semilla, v.n);
        var C = corrigeQ(Q, v.resp);

        var h = '<div class="ap-enun"><b>Cuestión ' + Q.numero + ' · ' + M.esc(Q.titulo) + '</b>' +
          '<div class="mtxd-ref">semilla ' + Q.semilla + ' · tema: ' + M.esc(nombreQ(Q.tipo)) + '</div>' +
          M.texifica(Q.enun) + '</div>';
        h += parrafo('<b>Cómo se contesta:</b> ' + Q.pide);

        if (!C) {
          h += aviso('Escribe tu respuesta en el campo <b>Tu respuesta</b> y se corregirá sola. ' +
            'Si te atascas, pulsa <b>Ver la solución</b> para tener la explicación paso a paso.');
          h += pista(Q.pista);
        } else if (C.error) {
          h += aviso('<b>No he podido leer tu respuesta.</b> ' + M.esc(C.msg));
          h += pista(Q.pista);
        } else {
          marcador[Q.clavePregunta] = C.ok;
          h += C.ok
            ? bien('<b>¡Correcto!</b> ' + C.msg)
            : mal('<b>Todavía no.</b> ' + C.msg + ' Vuelve a intentarlo o pulsa <b>Ver la solución</b>.');
          if (C.leido) {
            h += '<div class="mtxd-caja"><span class="mtxd-et">tu respuesta:</span> ' + C.leido + '</div>';
          }
          if (!C.ok) h += pista(Q.pista);
        }

        if (verSol) {
          h += titulo('Solución paso a paso');
          h += Q.explica();
          h += '<div class="mtxd-solucion"><b>Respuesta correcta:</b> <code>' +
            M.esc(respuestaModelo(Q)) + '</code></div>';
        }

        var claves = Object.keys(marcador);
        var aciertos = 0, i;
        for (i = 0; i < claves.length; i++) if (marcador[claves[i]]) aciertos++;
        var fallos = claves.length - aciertos;

        h += M.resultado(aciertos + ' / ' + claves.length, 'cuestiones acertadas');
        h += figMarcador(aciertos, fallos);
        h += M.kvs([
          'tema = <b>' + M.esc(nombreQ(Q.tipo)) + '</b>',
          'cuestión = <b>' + Q.numero + '</b>',
          'semilla = <b>' + Q.semilla + '</b>',
          'contestadas = <b>' + claves.length + '</b>',
          'aciertos = <b>' + aciertos + '</b>',
          'fallos = <b>' + fallos + '</b>'
        ]);
        h += parrafo('Cada cuestión cuenta una sola vez en el marcador: si la corriges, se guarda tu ' +
          'último intento. Con la <b>misma semilla</b> salen siempre las mismas cuestiones, así que ' +
          'puedes repetir la tanda o compartirla con un compañero.');
        return h;
      }, 'Escribe la respuesta con el formato que pide la cuestión: un número como <code>3/4</code>, ' +
        'una matriz como <code>2 1; 1 1</code>, una dimensión como <code>3x2</code> o <code>sí</code> / <code>no</code>.'));
  };

  /* ==================================================================
     9 · gancho de pruebas (lo usa /tests/test-mod-d.js; no se ve en la web)
     ================================================================== */
  M.dTest = {
    cuestion: generaCuestion,
    corrige: corrigeQ,
    modelo: respuestaModelo,
    despejaQ: preguntaDespeje,
    errorTipico: errorTipico,
    tiposQ: CLAVES_Q,
    tiposDespeje: TIPOS_DESPEJE
  };

  M.extraD = true;
  if (M.monta) M.monta();
})();
