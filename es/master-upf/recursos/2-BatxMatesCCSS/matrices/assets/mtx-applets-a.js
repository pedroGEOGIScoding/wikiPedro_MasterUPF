/* =====================================================================
   mtx-applets-a.js · Módulo A del Tema 1 «Matrices»
   2.º de Bachillerato · Matemáticas Aplicadas a las Ciencias Sociales
   Ruta: 2-BatxMatesCCSS/matrices/assets/mtx-applets-a.js

   Applets de los apartados 1.1 a 1.6. Se carga DESPUÉS del núcleo
   mtx-applets.js (window.MTX) y de la capa de álgebra matricial
   mtx-applets-alg.js, de la que toma TODO el motor exacto: lectura de
   matrices, clasificación, transposición, descomposición simétrica,
   suma, producto por un número, producto, rango y determinante. Aquí no
   se calcula álgebra «a mano»: este módulo orquesta, explica y dibuja.

   ---------------------------------------------------------------------
   ÍNDICE DEL MÓDULO
   ---------------------------------------------------------------------
     0 · utilidades locales (avisos, escenarios, maquetación, lectura)
     1 · figuras: una o varias matrices grandes en un mismo SVG
         (celdas con fuente de 26 px, rótulos de 19 a 24 px en negrita,
          lienzo mínimo de 720 × 500, celdas pulsables)
     2 · dimension      · Dimensión y elementos de una matriz
     3 · constructor    · Matrices definidas por una fórmula
     4 · igualdad       · Igualdad de matrices
     5 · clasifica      · Clasificador de matrices (con modo reto)
     6 · cuadradas      · Matrices cuadradas notables
     7 · transpuesta    · Transposición de matrices
     8 · simetrica      · Simetría y antisimetría
     9 · descomponSim   · A = S + H (parte simétrica y antisimétrica)

   ---------------------------------------------------------------------
   Applets registrados (claves fijas del catálogo del tema)
   ---------------------------------------------------------------------

   dimension       Dimensión y elementos.
                   Dos deslizadores (filas y columnas) redibujan la matriz
                   al instante. Al pulsar una celda —o al mover los
                   deslizadores de posición— se resaltan su fila y su
                   columna completas y se lee en voz alta el elemento
                   a_ij: qué fila ocupa, qué columna y cuánto vale.
                   Muestra el recuento de elementos, la dimensión y la
                   notación A = (a_ij) de orden m × n.

   constructor     Matrices definidas por una fórmula.
                   El alumno elige el orden y la fórmula del elemento
                   general (i+j, i·j, i−j, 2i−j, (−1)^(i+j), i²−j…) y un
                   deslizador va destapando la matriz celda a celda, en el
                   orden de lectura, con la sustitución literal de i y j y
                   el resultado de cada elemento.

   igualdad        Igualdad de matrices.
                   Dos matrices que pueden llevar incógnitas (x, y, z, t).
                   Primero compara las dimensiones —si no coinciden, no
                   hay nada más que hacer— y después plantea el sistema
                   posición a posición, resuelve cada ecuación y da los
                   valores que hacen iguales las dos matrices, o explica
                   exactamente en qué casilla se produce la contradicción.

   clasifica       Clasificador de matrices.
                   Matriz editable: lista todas las etiquetas que le
                   corresponden y explica cada «sí» y cada «no» con la
                   razón concreta (qué elemento estropea la propiedad).
                   Modo reto: el alumno marca sus respuestas antes de
                   destapar y obtiene su marcador.

   cuadradas       Matrices cuadradas notables.
                   Galería por tipo (nula, identidad, escalar, diagonal,
                   triangular superior e inferior, simétrica,
                   antisimétrica, regular y singular): genera un ejemplo,
                   resalta la diagonal principal y la secundaria, muestra
                   la traza, el orden, el rango y el determinante, y
                   comprueba si la matriz editada sigue siendo de ese tipo.

   transpuesta     Transposición de matrices.
                   A y su transpuesta en paralelo, con la fila i de A y la
                   columna i de A^t resaltadas del mismo color, y la
                   comprobación de las tres propiedades con las matrices
                   del alumno: (A^t)^t = A, (A+B)^t = A^t + B^t y
                   (A·B)^t = B^t·A^t.

   simetrica       Simetría y antisimetría.
                   Se escribe solo el triángulo superior y el applet
                   refleja: modo simétrico (a_ij = a_ji) y antisimétrico
                   (a_ij = −a_ji, con la diagonal forzada a cero). También
                   admite una matriz completa y entonces marca los pares
                   (i, j) y (j, i) que se corresponden y los que fallan.

   descomponSim    Toda matriz cuadrada es suma de una simétrica y una
                   antisimétrica. Calcula S = ½(A + A^t) y H = ½(A − A^t)
                   paso a paso, comprueba A = S + H celda a celda y
                   verifica la simetría de cada parte.

   ---------------------------------------------------------------------
   Convenios internos
   ---------------------------------------------------------------------
   · Toda la aritmética es exacta (S.Frac con BigInt). La coma flotante
     solo aparece al pasar a píxeles dentro de las figuras.
   · Cada compute va envuelto en guarda(): cualquier Error de la capa de
     álgebra (matriz mal escrita, filas de distinta longitud, matriz no
     cuadrada…) se muestra como un aviso explicativo y nunca rompe la
     página.
   · Dentro de un <svg> NO hay KaTeX: todos los rótulos van en texto
     llano con S.textoPlano (coma decimal y signo menos U+2212). Las
     fórmulas bonitas van fuera del SVG, en el pie de figura o en el
     cuerpo del applet.
   · Los títulos NUNCA se numeran: el armazón escribe «Applet · …».
   · Las instrucciones dicen siempre, con un ejemplo copiable, cómo se
     escribe cada campo.

   Sin OJS, sin CDN, sin dependencias externas. ES5 (var/function) salvo
   BigInt, que ya usa el núcleo.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.MTX;
  if (!S) {
    if (window.console && console.error) {
      console.error('[matrices] mtx-applets-a.js necesita mtx-applets.js cargado antes.');
    }
    return;
  }
  if (!S.parseMat || !S.clasifica || !S.descomponSim) {
    if (window.console && console.error) {
      console.error('[matrices] mtx-applets-a.js necesita la capa mtx-applets-alg.js cargada antes.');
    }
    return;
  }

  var R = S.registry, K = S.K, KD = S.KD, esc = S.esc, COL = S.COL;
  var Frac = S.Frac;
  var F = S.fracDe;                     /* número / texto / Frac -> Frac  */
  var FT = function (f) { return S.fracTex(f, true); };   /* \frac  en línea */
  var TP = S.textoPlano;                /* rótulos llanos para los <text> */

  var MAXDIM = 6;                       /* tope de filas y de columnas    */

  /* ==================================================================
     0 · utilidades locales
     ================================================================== */

  function cero(f) { return f.n === 0n; }
  function igualF(a, b) { return a.cmp(b) === 0; }
  function llano(f) { return TP(f.txt()); }        /* «-3/4» -> «−3/4»    */

  function avisoHTML(e) {
    var m = (e && e.message) ? e.message : String(e);
    return '<div class="mx-bad ap-err">' + esc(m).replace(/\n/g, '<br>') + '</div>';
  }
  function guarda(f) {
    return function (v, ctl, out, api) {
      try {
        var h = f(v, ctl, out, api);
        if (h === undefined || h === null || h === '') {
          return '<div class="mx-info">Ajusta los datos para ver el desarrollo.</div>';
        }
        return h;
      } catch (e) { return avisoHTML(e); }
    };
  }

  /* Rellena los controles desde un botón de escenario. */
  function pon(ctl, obj) {
    Object.keys(obj).forEach(function (k) {
      var e = ctl[k];
      if (!e) return;
      if (e.type === 'checkbox') e.checked = !!obj[k];
      else e.value = String(obj[k]);
    });
  }
  function escenarios(lista, etiqueta) {
    return {
      type: 'presets',
      label: etiqueta || 'Escenarios',
      list: lista.map(function (c) {
        return {
          label: c.txt,
          title: c.tit || '',
          apply: function (ctl) { pon(ctl, c.set); }
        };
      })
    };
  }

  /* Piezas de maquetación heredadas de los temas anteriores. */
  function tarjeta(titulo, html, clase) {
    return '<div class="ap-card ' + (clase || '') + '">' +
      '<div class="ap-card-tit">' + esc(titulo) + '</div>' + html + '</div>';
  }
  function rejilla2(cartas) { return '<div class="ap-grid2">' + cartas.join('') + '</div>'; }
  function rejilla3(cartas) { return '<div class="ap-grid3">' + cartas.join('') + '</div>'; }
  function nota(html) { return '<p class="ap-note">' + html + '</p>'; }
  function enun(html) { return '<div class="ap-enun">' + html + '</div>'; }
  function avisoSuave(html) { return '<p class="ap-note mtxa-avi">' + html + '</p>'; }

  /* Texto compartido: cómo se escribe una matriz. */
  var COMO_MAT =
    'Escribe la matriz <b>por filas</b>: los elementos de una fila separados por espacios y las ' +
    'filas separadas por <code>;</code> o por saltos de línea. Por ejemplo <code>1 2 3; 4 5 6</code> ' +
    'es una matriz de dimensión 2×3. Se admiten enteros (<code>-2</code>), decimales con coma ' +
    '(<code>0,5</code>) y fracciones (<code>1/2 3; 0 -2</code>). Todas las filas deben tener el ' +
    'mismo número de elementos.';

  var COMO_NUM =
    'Los números se escriben como entero (<code>3</code>, <code>-2</code>), decimal con coma ' +
    '(<code>0,5</code>) o fracción (<code>3/4</code>).';

  /* Lectura de una matriz con tope de tamaño para que quepa en la figura. */
  function leeMat(txt, nombre, opts) {
    opts = opts || {};
    nombre = nombre || 'la matriz';
    var t = String(txt === undefined || txt === null ? '' : txt).trim();
    if (t === '') {
      throw Error('Falta ' + nombre + '. ' + textoPlanoCorto());
    }
    var A = S.parseMat(t);
    var tope = opts.max || MAXDIM;
    if (A.f > tope || A.c > tope) {
      throw Error('Para que la figura se lea bien, ' + nombre + ' puede tener como mucho ' + tope +
        ' filas y ' + tope + ' columnas, y has escrito una de ' + A.f + '×' + A.c +
        '. Prueba con algo como 1 2 3; 4 5 6.');
    }
    if (opts.cuadrada && A.f !== A.c) {
      throw Error('Aquí hace falta una matriz CUADRADA (mismo número de filas que de columnas) y ' +
        nombre + ' es de ' + A.f + '×' + A.c + '. Escribe por ejemplo 1 2; 3 4.');
    }
    return A;
  }
  function textoPlanoCorto() {
    return 'Escribe los elementos de cada fila separados por espacios y las filas separadas ' +
      'por «;», por ejemplo 1 2 3; 4 5 6.';
  }

  /* Entero de un control, siempre dentro de un intervalo. */
  function ent(v, min, max, def) {
    var n = parseInt(String(v), 10);
    if (!isFinite(n)) n = def;
    if (n < min) n = min;
    if (n > max) n = max;
    return n;
  }

  /* Después de que el armazón haya volcado el HTML en la salida.
     Sirve para hacer pulsables las celdas de las figuras. */
  function alPintar(api, f) {
    if (!api || !api.out) return;
    if (typeof setTimeout !== 'function') return;
    setTimeout(function () {
      try { f(api.out, api); } catch (e) { /* la figura sigue siendo legible */ }
    }, 0);
  }
  /* Hace pulsable cada <rect data-celda="i-j"> de la salida: al pulsar,
     los controles de posición pasan a esa celda y se recalcula. */
  function celdasPulsables(api, idFila, idCol) {
    alPintar(api, function (out) {
      var ns = out.querySelectorAll('[data-celda]');
      Array.prototype.forEach.call(ns, function (n) {
        n.style.cursor = 'pointer';
        n.addEventListener('click', function () {
          var p = String(n.getAttribute('data-celda')).split('-');
          if (idFila && api.ctl[idFila]) api.ctl[idFila].value = String(Number(p[0]) + 1);
          if (idCol && api.ctl[idCol]) api.ctl[idCol].value = String(Number(p[1]) + 1);
          api.run();
        });
      });
    });
  }

  /* ==================================================================
     1 · figuras: una o varias matrices grandes en un mismo SVG

     figuraMats(bloques, opts)

     bloques = [{ A, nombre, op, filaHi:[i…], colHi:[j…],
                  marcas:[{i,j,col,fondo,grosor}], rot:true,
                  sub:'texto bajo la matriz', celda:function(i,j){…},
                  pulsable:true }]

     · op es el operador que se dibuja ANTES del bloque ('=', '+', '·').
     · rot añade los rótulos F1…Fm a la izquierda y C1…Cn arriba.
     · celda(i, j) devuelve el texto llano de la celda (por defecto, el
       valor exacto de a_ij con coma decimal y signo menos U+2212).
     · Dentro del SVG NUNCA se escribe LaTeX: todo pasa por TP().
     ================================================================== */
  var HI_FILA = 'rgba(25,118,210,.15)';
  var HI_COL = 'rgba(224,123,0,.15)';

  function anchoTextoMax(bloques) {
    var m = 1;
    bloques.forEach(function (b) {
      var i, j, t;
      for (i = 0; i < b.A.f; i++) {
        for (j = 0; j < b.A.c; j++) {
          t = b.celda ? String(b.celda(i, j)) : llano(b.A.a[i][j]);
          if (t.length > m) m = t.length;
        }
      }
    });
    return m;
  }

  function figuraMats(bloques, o) {
    o = o || {};
    var maxLen = anchoTextoMax(bloques);
    var cw = Math.max(o.cw || 104, maxLen * 16 + 30);
    var ch = o.ch || 76;
    var izq = o.izq === undefined ? 132 : o.izq;
    /* La cabecera ocupa el título (y = 44), el subtítulo (y = 78) y el
       nombre de cada bloque (y = arriba − 52). Con «arriba = 154» la caja
       del subtítulo y la del nombre llegaban a tocarse. */
    var arriba = 168;
    var maxF = 1, i, j;
    bloques.forEach(function (b) { if (b.A.f > maxF) maxF = b.A.f; });
    var altoMat = maxF * ch;

    var cuerpo = '', x = izq;
    var centroY = arriba + altoMat / 2;

    /* Separación horizontal entre bloques.
       Cada bloque dibuja su corchete izquierdo 28 px a la izquierda de x
       y, si lleva rótulos de fila (F1, F2…), estos van todavía más a la
       izquierda (anchor «end» en x − 40, así que ocupan hasta ~x − 66).
       El hueco fijo de 34 px que había antes hacía que los rótulos de
       fila del segundo bloque se pisaran con el corchete derecho del
       primero. Ahora se lleva la cuenta del borde derecho ya dibujado
       (xDer) y cada bloque se coloca dejando el hueco que necesita. */
    var xDer = null;
    var HUECO = 22;                       /* aire limpio entre bloques */

    bloques.forEach(function (b) {
      if (b.op) {
        if (xDer !== null) x = Math.max(x, xDer + HUECO);
        cuerpo += S.txt(x + 24, centroY + 12, TP(b.op), { size: 34, weight: '700', fill: COL.eje });
        xDer = x + 24 + 22;
        x += 76;
      }
      var huecoIzq = HUECO + 28 + (b.rot ? 46 : 0);
      if (xDer !== null) x = Math.max(x, xDer + huecoIzq);
      var A = b.A, m = A.f, n = A.c;
      var y0 = arriba + (maxF - m) * ch / 2;
      var w = n * cw, h = m * ch;

      /* caja y corchetes grandes */
      cuerpo += S.rect(x - 4, y0 - 6, w + 8, h + 12, '#fff', '#e3e9ef', { r: 10, sw: 1.4 });
      cuerpo += S.path('M ' + (x - 14) + ' ' + (y0 - 8) + ' L ' + (x - 28) + ' ' + (y0 - 8) +
        ' L ' + (x - 28) + ' ' + (y0 + h + 8) + ' L ' + (x - 14) + ' ' + (y0 + h + 8),
        COL.azulOsc, 4);
      cuerpo += S.path('M ' + (x + w + 14) + ' ' + (y0 - 8) + ' L ' + (x + w + 28) + ' ' + (y0 - 8) +
        ' L ' + (x + w + 28) + ' ' + (y0 + h + 8) + ' L ' + (x + w + 14) + ' ' + (y0 + h + 8),
        COL.azulOsc, 4);

      /* resaltes de fila y de columna completas */
      (b.filaHi || []).forEach(function (fi) {
        if (fi < 0 || fi >= m) return;
        cuerpo += S.rect(x, y0 + fi * ch, w, ch, HI_FILA, 'none', { r: 6 });
      });
      (b.colHi || []).forEach(function (cj) {
        if (cj < 0 || cj >= n) return;
        cuerpo += S.rect(x + cj * cw, y0, cw, h, HI_COL, 'none', { r: 6 });
      });

      /* marcas de celdas concretas */
      (b.marcas || []).forEach(function (mk) {
        if (mk.i < 0 || mk.i >= m || mk.j < 0 || mk.j >= n) return;
        cuerpo += S.rect(x + mk.j * cw + 7, y0 + mk.i * ch + 7, cw - 14, ch - 14,
          mk.fondo || 'none', mk.col || COL.rojo, { r: 8, sw: mk.grosor || 3 });
      });

      /* nombre del bloque, a la izquierda de su primera columna */
      if (b.nombre) {
        cuerpo += S.txt(x - 28, arriba - 52, TP(b.nombre), {
          size: 23, weight: '700', fill: COL.azulOsc, anchor: 'start'
        });
      }

      /* rótulos de fila y de columna */
      if (b.rot) {
        for (j = 0; j < n; j++) {
          cuerpo += S.txt(x + j * cw + cw / 2, arriba - 16, 'C' + (j + 1),
            { size: 19, weight: '700', fill: COL.naranja });
        }
        for (i = 0; i < m; i++) {
          cuerpo += S.txt(x - 40, y0 + i * ch + ch / 2 + 7, 'F' + (i + 1),
            { size: 19, weight: '700', fill: COL.azul, anchor: 'end' });
        }
      }

      /* contenido de las celdas */
      for (i = 0; i < m; i++) {
        for (j = 0; j < n; j++) {
          var t = b.celda ? String(b.celda(i, j)) : llano(A.a[i][j]);
          var col = (b.colorCelda && b.colorCelda(i, j)) || COL.texto;
          cuerpo += S.txt(x + j * cw + cw / 2, y0 + i * ch + ch / 2 + 10, TP(t),
            { size: 26, weight: '700', fill: col });
          if (b.pulsable) {
            cuerpo += '<rect data-celda="' + i + '-' + j + '" x="' + (x + j * cw + 3) +
              '" y="' + (y0 + i * ch + 3) + '" width="' + (cw - 6) + '" height="' + (ch - 6) +
              '" rx="8" fill="transparent" stroke="none"><title>fila ' + (i + 1) +
              ', columna ' + (j + 1) + '</title></rect>';
          }
        }
      }

      /* texto bajo el bloque */
      if (b.sub) {
        cuerpo += S.txt(x + w / 2, arriba + altoMat + 50, TP(b.sub),
          { size: 20, weight: '700', fill: COL.gris });
      }
      xDer = x + w + 28;                  /* corchete derecho incluido */
      x += w + 34;
    });

    var W = Math.max(o.W || 720, Math.round(x + 46));

    var cab = '';
    if (o.titulo) cab += S.txt(W / 2, 44, TP(o.titulo), { size: 24, weight: '700', fill: COL.azulOsc });
    if (o.subtitulo) cab += S.txt(W / 2, 78, TP(o.subtitulo), { size: 19, weight: '600', fill: COL.gris });

    /* El alto del lienzo se calcula a partir de lo que se ha dibujado de
       verdad, no con una altura fija de 500. Con la altura fija, las
       figuras sin pie (constructor, por ejemplo) dejaban más de 100 px de
       lienzo vacío por debajo del último elemento. El pie se coloca 40 px
       por debajo del contenido y el margen inferior es de 24 px. */
    var medir = S.altoDibujado || function () { return 0; };
    var fondo = medir(cab + cuerpo);
    if (!(fondo > 0)) fondo = arriba + altoMat;
    var pie = '';
    if (o.pie) {
      var yPie = Math.round(fondo + 42);
      pie += S.txt(W / 2, yPie, TP(o.pie), { size: 19, weight: '700', fill: COL.eje });
      fondo = yPie + Math.ceil(19 * 0.32);
    }
    var H = Math.round(fondo + 24);

    return S.svgWrap(cab + cuerpo + pie, W, H, o.label || 'Matriz', o.cap);
  }

  /* Figura de una sola matriz. */
  function figuraMat(A, o) {
    o = o || {};
    var b = {
      A: A, nombre: o.nombre, rot: o.rot !== false, filaHi: o.filaHi, colHi: o.colHi,
      marcas: o.marcas, celda: o.celda, colorCelda: o.colorCelda,
      pulsable: o.pulsable !== false, sub: o.sub
    };
    return figuraMats([b], o);
  }

  /* ==================================================================
     2 · dimension · Dimensión y elementos de una matriz
     ================================================================== */
  R.dimension = function (node) {
return S.shell(node, 'Dimensión y elementos de una matriz',
      'Mueve los deslizadores de <b>filas</b> y <b>columnas</b> y observa cómo cambia la matriz. ' +
      'Con el modo <i>posiciones</i> cada elemento se escribe como <code>10i+j</code>, así que ' +
      '<code>23</code> significa «fila 2, columna 3» y se ve de un vistazo dónde está cada uno. ' +
      'Con el modo <i>mi matriz</i> escribes la tuya: ' + COMO_MAT + ' ' +
      'Elige después la posición con los deslizadores <b>i</b> y <b>j</b> (o pulsa directamente ' +
      'sobre una celda de la figura): se resaltarán su fila entera en azul y su columna entera ' +
      'en naranja.',
      [
        { id: 'modo', label: 'Contenido', type: 'select', value: 'posicion', options: [
          { value: 'posicion', label: 'posiciones (10i+j)' },
          { value: 'propia', label: 'mi matriz' }
        ] },
        { id: 'f', label: 'Filas m', type: 'range', min: 1, max: MAXDIM, value: 3 },
        { id: 'c', label: 'Columnas n', type: 'range', min: 1, max: MAXDIM, value: 4 },
        { id: 'txt', label: 'Mi matriz', type: 'text', value: '1 2 3; 4 5 6', ancho: '16rem' },
        { id: 'i', label: 'Fila i', type: 'range', min: 1, max: MAXDIM, value: 2 },
        { id: 'j', label: 'Columna j', type: 'range', min: 1, max: MAXDIM, value: 3 },
        { id: 'azar', label: 'Matriz al azar', type: 'button', click: function (ctl) {
          var m = ent(ctl.f && ctl.f.value, 1, MAXDIM, 3);
          var n = ent(ctl.c && ctl.c.value, 1, MAXDIM, 4);
          pon(ctl, { modo: 'propia', txt: S.matTxt(S.matAleatoria(m, n, { min: -6, max: 9 })) });
        } },
        escenarios([
          { txt: 'matriz 2×3', tit: 'La dimensión se lee «2 por 3»', set: { modo: 'posicion', f: 2, c: 3, i: 2, j: 3 } },
          { txt: 'matriz fila 1×5', tit: 'Una sola fila', set: { modo: 'posicion', f: 1, c: 5, i: 1, j: 4 } },
          { txt: 'matriz columna 4×1', tit: 'Una sola columna', set: { modo: 'posicion', f: 4, c: 1, i: 3, j: 1 } },
          { txt: 'cuadrada de orden 4', tit: 'Tantas filas como columnas', set: { modo: 'posicion', f: 4, c: 4, i: 3, j: 3 } },
          { txt: 'rectangular 5×2', set: { modo: 'posicion', f: 5, c: 2, i: 4, j: 2 } },
          { txt: 'mi matriz con fracciones', tit: 'Los elementos no tienen por qué ser enteros',
            set: { modo: 'propia', txt: '1/2 3 -2; 0 -1/4 5', i: 1, j: 3 } },
          { txt: 'tabla de ventas 3×4', tit: 'Una matriz es una tabla de datos ordenada',
            set: { modo: 'propia', txt: '12 15 9 20; 8 11 14 6; 21 17 13 19', i: 2, j: 4 } }
        ])
      ],
      guarda(function (v, ctl, out, api) {
        var A, avisos = '';
        if (v.modo === 'propia') {
          A = leeMat(v.txt, 'tu matriz');
        } else {
          A = S.matPorFormula(ent(v.f, 1, MAXDIM, 3), ent(v.c, 1, MAXDIM, 4), '10i+j');
        }
        var m = A.f, n = A.c;
        var i = ent(v.i, 1, MAXDIM, 1), j = ent(v.j, 1, MAXDIM, 1);
        if (i > m) { avisos += avisoSuave('La matriz solo tiene ' + m + (m === 1 ? ' fila' : ' filas') +
          ', así que se ha tomado $i = ' + m + '$.'); i = m; }
        if (j > n) { avisos += avisoSuave('La matriz solo tiene ' + n + (n === 1 ? ' columna' : ' columnas') +
          ', así que se ha tomado $j = ' + n + '$.'); j = n; }
        if (v.modo === 'propia') {
          avisos += avisoSuave('En el modo <i>mi matriz</i> la dimensión la marca lo que escribes: ' +
            'esta matriz es de $' + S.dimTex(A) + '$, y los deslizadores de filas y columnas no se usan.');
        }
        var val = A.a[i - 1][j - 1];
        var cl = S.clasifica(A);

        var h = enun('Una matriz es una <b>tabla de números ordenada en filas y columnas</b>. ' +
          'Cada elemento tiene un nombre, $a_{ij}$, en el que el primer índice es la <b>fila</b> y ' +
          'el segundo la <b>columna</b>. Nunca al revés.');
        h += avisos;

        h += figuraMat(A, {
          titulo: 'Matriz de dimensión ' + m + ' × ' + n,
          subtitulo: 'fila ' + i + ' en azul, columna ' + j + ' en naranja; pulsa una celda para moverte',
          filaHi: [i - 1], colHi: [j - 1],
          marcas: [{ i: i - 1, j: j - 1, col: COL.rojo, fondo: 'rgba(198,40,40,.10)', grosor: 3.4 }],
          nombre: 'A',
          pie: 'El elemento marcado es a' + i + j + ' = ' + llano(val),
          label: 'Matriz con la fila y la columna del elemento seleccionado resaltadas',
          cap: 'El elemento resaltado es $a_{' + i + j + '} = ' + FT(val) +
            '$: cruce de la fila $' + i + '$ con la columna $' + j + '$.'
        });
        celdasPulsables(api, 'i', 'j');

        h += S.resultado(K('a_{' + i + j + '} = ' + FT(val)),
          'elemento de la fila ' + i + ' y la columna ' + j);

        h += S.kvs([
          'dimensión ' + K(S.dimTex(A)),
          'filas: ' + K(String(m)),
          'columnas: ' + K(String(n)),
          'elementos: ' + K(m + ' \\cdot ' + n + ' = ' + (m * n)),
          cl.cuadrada ? S.badge('cuadrada de orden ' + m, 'si') : S.badge('rectangular', 'info')
        ]);

        h += S.expr('Notación abreviada',
          'A = (a_{ij})_{' + m + ' \\times ' + n + '} = ' +
          S.matTex(A, { marca: [[i - 1, j - 1]] }));

        /* lectura de la fila y de la columna elegidas */
        var fila = A.a[i - 1].map(function (x, k) {
          return '$a_{' + i + (k + 1) + '} = ' + FT(x) + '$';
        }).join(', &nbsp; ');
        var colu = [], k;
        for (k = 0; k < m; k++) colu.push('$a_{' + (k + 1) + j + '} = ' + FT(A.a[k][j - 1]) + '$');

        h += rejilla2([
          tarjeta('Fila ' + i + ' completa', '<p>' + fila + '</p>' +
            nota('Una fila se recorre dejando fijo el primer índice y variando el segundo.')),
          tarjeta('Columna ' + j + ' completa', '<p>' + colu.join(', &nbsp; ') + '</p>' +
            nota('Una columna se recorre dejando fijo el segundo índice y variando el primero.'))
        ]);

        h += S.tabla(['Pregunta', 'Respuesta'], [
          ['¿Cuántas filas tiene?', K(String(m))],
          ['¿Cuántas columnas tiene?', K(String(n))],
          ['¿Cuál es su dimensión?', K(S.dimTex(A))],
          ['¿Cuántos elementos hay en total?', K(m + ' \\cdot ' + n + ' = ' + (m * n))],
          ['¿Dónde está ' + K('a_{' + i + j + '}') + '?', 'en la fila ' + i + ' y la columna ' + j],
          ['¿Cuánto vale?', K(FT(val))],
          ['¿Es cuadrada?', cl.cuadrada ? S.badge('sí, de orden ' + m, 'si') : S.badge('no', 'no')]
        ], { thPrimera: true });

        h += nota('Cuidado con el orden de los índices: $a_{23}$ y $a_{32}$ ' +
          (m === n ? 'suelen ser elementos distintos' : 'ni siquiera existen los dos en toda matriz') +
          '. El primero siempre cuenta filas; el segundo, columnas.');
        return h;
      }));
  };

  /* ==================================================================
     3 · constructor · Matrices definidas por una fórmula
     ================================================================== */

  /* Sustitución literal de i y j en la fórmula, en TeX legible. */
  function formulaSustituida(expr, i, j) {
    var s = String(expr);
    s = s.replace(/\s+/g, '');
    s = s.replace(/i/g, '\u0001').replace(/j/g, '\u0002');
    s = s.replace(/\u0001/g, String(i)).replace(/\u0002/g, String(j));
    s = s.replace(/\*/g, ' \\cdot ');
    s = s.replace(/\^\(([^()]*)\)/g, '^{($1)}');
    s = s.replace(/\^(-?\d+)/g, '^{$1}');
    s = s.replace(/(\d)\(/g, '$1 \\cdot (');
    return s;
  }

  var FORMULAS = [
    { value: 'i+j', label: 'i + j' },
    { value: 'i*j', label: 'i · j' },
    { value: 'i-j', label: 'i − j' },
    { value: '2i-j', label: '2i − j' },
    { value: '(-1)^(i+j)', label: '(−1)^(i+j)' },
    { value: 'i^2-j', label: 'i² − j' },
    { value: 'i/j', label: 'i / j' },
    { value: '10i+j', label: '10i + j (posiciones)' },
    { value: 'otra', label: 'otra fórmula (la escribo yo)' }
  ];

  R.constructor = function (node) {
return S.shell(node, 'Matrices definidas por una fórmula',
      'Muchas matrices no se dan escribiendo sus elementos, sino con una <b>fórmula del elemento ' +
      'general</b>: $a_{ij} = i + j$, $a_{ij} = i \\cdot j$, $a_{ij} = (-1)^{i+j}$… ' +
      'Elige el orden con los deslizadores, escoge una fórmula de la lista (o marca ' +
      '<i>otra fórmula</i> y escríbela tú usando solo <code>i</code>, <code>j</code>, números y ' +
      'los signos <code>+ - * / ^ ( )</code>, por ejemplo <code>2i-j</code> o <code>(-1)^(i+j)</code>) ' +
      'y mueve el deslizador <b>destapadas</b> para ver cómo se construye la matriz celda a celda, ' +
      'en el orden de lectura: primero toda la fila 1, después la fila 2, etc.',
      [
        { id: 'f', label: 'Filas m', type: 'range', min: 1, max: 5, value: 3 },
        { id: 'c', label: 'Columnas n', type: 'range', min: 1, max: 5, value: 3 },
        { id: 'sel', label: 'Fórmula de a_ij', type: 'select', value: 'i+j', options: FORMULAS },
        { id: 'fx', label: 'Otra fórmula', type: 'text', value: 'i+2j', ancho: '10rem' },
        { id: 'k', label: 'Celdas destapadas', type: 'range', min: 0, max: 25, value: 25 },
        escenarios([
          { txt: 'a_ij = i + j (3×3)', tit: 'La matriz sale simétrica', set: { f: 3, c: 3, sel: 'i+j', k: 25 } },
          { txt: 'a_ij = i · j (3×4)', tit: 'Tabla de multiplicar', set: { f: 3, c: 4, sel: 'i*j', k: 25 } },
          { txt: 'a_ij = i − j (4×4)', tit: 'Sale antisimétrica: diagonal de ceros', set: { f: 4, c: 4, sel: 'i-j', k: 25 } },
          { txt: 'a_ij = (−1)^(i+j)', tit: 'El tablero de ajedrez', set: { f: 4, c: 4, sel: '(-1)^(i+j)', k: 25 } },
          { txt: 'a_ij = i / j (fracciones)', tit: 'Los elementos son fracciones exactas', set: { f: 3, c: 3, sel: 'i/j', k: 25 } },
          { txt: 'paso a paso (2 celdas)', tit: 'Destapa la matriz poco a poco', set: { f: 3, c: 3, sel: '2i-j', k: 2 } },
          { txt: 'fórmula propia i+2j', set: { f: 3, c: 4, sel: 'otra', fx: 'i+2j', k: 25 } }
        ])
      ],
      guarda(function (v) {
        var m = ent(v.f, 1, 5, 3), n = ent(v.c, 1, 5, 3);
        var expr = v.sel === 'otra' ? String(v.fx || '').trim() : String(v.sel);
        if (expr === '') {
          throw Error('Has elegido «otra fórmula» pero la casilla está vacía. Escribe la fórmula ' +
            'del elemento general con i y j, por ejemplo i+2j o (-1)^(i+j).');
        }
        var A = S.matPorFormula(m, n, expr);
        var total = m * n;
        var k = ent(v.k, 0, 25, total);
        if (k > total) k = total;

        var etiqueta = (function () {
          var e = FORMULAS.filter(function (o) { return o.value === v.sel; })[0];
          return (v.sel === 'otra' || !e) ? expr : e.label;
        })();

        var h = enun('Fórmula del elemento general: ' + K('a_{ij} = ' + formulaSustituida(expr, 'i', 'j')) +
          ' con ' + K('i = 1, \\dots, ' + m) + ' (filas) y ' + K('j = 1, \\dots, ' + n) + ' (columnas). ' +
          'Cada celda se obtiene sustituyendo sus dos índices en la fórmula.');

        h += figuraMat(A, {
          titulo: 'Construcción de a' + 'ij' + ' = ' + TP(etiqueta),
          subtitulo: 'destapadas ' + k + ' de ' + total + ' celdas, en orden de lectura',
          nombre: 'A',
          celda: function (i, j) {
            var pos = i * n + j;
            return pos < k ? llano(A.a[i][j]) : '?';
          },
          colorCelda: function (i, j) {
            var pos = i * n + j;
            if (pos < k - 1) return COL.texto;
            if (pos === k - 1) return COL.rojo;
            return '#b0bec5';
          },
          marcas: k > 0 && k <= total
            ? [{ i: Math.floor((k - 1) / n), j: (k - 1) % n, col: COL.rojo, fondo: 'rgba(198,40,40,.08)' }]
            : [],
          pulsable: false,
          label: 'Matriz construida celda a celda a partir de la fórmula',
          cap: k < total
            ? 'Quedan ' + (total - k) + ' celdas por calcular: mueve el deslizador para seguir.'
            : 'Matriz completa de dimensión $' + S.dimTex(A) + '$.'
        });

        /* pasos de las celdas ya destapadas (las 8 últimas, para no marear) */
        var desde = Math.max(0, k - 8), p, filas = [];
        for (p = desde; p < k; p++) {
          var i2 = Math.floor(p / n), j2 = p % n;
          filas.push([
            K('a_{' + (i2 + 1) + (j2 + 1) + '}'),
            'fila ' + (i2 + 1) + ', columna ' + (j2 + 1),
            K(formulaSustituida(expr, i2 + 1, j2 + 1)),
            K(FT(A.a[i2][j2]))
          ]);
        }
        if (filas.length) {
          h += S.tabla(['Elemento', 'Posición', 'Se sustituye', 'Vale'], filas, { thPrimera: false });
          if (desde > 0) h += nota('Se muestran los ' + filas.length + ' últimos cálculos; los anteriores son iguales.');
        } else {
          h += nota('Mueve el deslizador <b>celdas destapadas</b> para empezar a construir la matriz.');
        }

        if (k >= total) {
          h += S.expr('Matriz completa', 'A = ' + S.matTex(A));
          var cl = S.clasifica(A);
          var etiquetas = cl.nombres.length ? cl.nombres.join(', ') : 'sin etiquetas especiales';
          h += S.kvs([
            'dimensión ' + K(S.dimTex(A)),
            'tipo: ' + esc(etiquetas),
            cl.cuadrada ? 'traza ' + K('\\operatorname{tr}(A) = ' + FT(cl.traza)) : 'no es cuadrada: no tiene traza'
          ]);
          if (cl.simetrica) h += nota('Fíjate: la fórmula es <b>simétrica en $i$ y $j$</b> (al intercambiarlos ' +
            'sale lo mismo), y por eso la matriz cumple $a_{ij} = a_{ji}$.');
          if (cl.antisimetrica) h += nota('La fórmula cambia de signo al intercambiar $i$ y $j$, así que ' +
            'la matriz es <b>antisimétrica</b>: $a_{ij} = -a_{ji}$ y la diagonal es de ceros.');
        }
        return h;
      }));
  };

  /* ==================================================================
     4 · igualdad · Igualdad de matrices
     ================================================================== */

  var INCOG = ['x', 'y', 'z', 't'];

  /* Lee un elemento que puede llevar UNA incógnita: «3», «-1/2», «x»,
     «2x», «x+1», «3z-2», «0,5t». Devuelve {k, b, v} con k·v + b. */
  function leeElem(tok, fila, col) {
    var s = String(tok).trim().toLowerCase()
      .replace(/[−–—]/g, '-').replace(/\s+/g, '').replace(/·/g, '*');
    if (s === '') throw Error('Hay una casilla vacía en la posición (' + fila + ', ' + col + ').');
    var letras = s.replace(/[^a-z]/g, '').split('');
    var vistas = [], i;
    for (i = 0; i < letras.length; i++) {
      if (INCOG.indexOf(letras[i]) < 0) {
        throw Error('En la posición (' + fila + ', ' + col + ') aparece la letra «' + letras[i] +
          '», y aquí solo se admiten las incógnitas x, y, z, t. Escribe por ejemplo x, 2x, x+1 o un número.');
      }
      if (vistas.indexOf(letras[i]) < 0) vistas.push(letras[i]);
    }
    if (vistas.length > 1) {
      throw Error('En la posición (' + fila + ', ' + col + ') hay dos incógnitas distintas (' +
        vistas.join(' y ') + '). En este applet cada casilla lleva como mucho una incógnita: ' +
        'escribe por ejemplo 2x-1.');
    }
    /* troceamos en términos conservando el signo */
    var t = s.replace(/-/g, '+-').split('+').filter(function (u) { return u !== ''; });
    var k = new Frac(0), b = new Frac(0), variable = vistas[0] || null;
    t.forEach(function (u) {
      var neg = false;
      if (u.charAt(0) === '-') { neg = true; u = u.slice(1); }
      if (u === '') throw Error('No entiendo la casilla «' + tok + '» de la posición (' + fila +
        ', ' + col + '). Escribe un número (3, -2, 0,5, 3/4) o algo como 2x-1.');
      var tieneVar = /[a-z]/.test(u);
      var num = u.replace(/[a-z]/g, '').replace(/\*/g, '');
      var val;
      if (num === '') val = new Frac(1);
      else val = F(num);
      if (neg) val = val.opuesto();
      if (tieneVar) k = k.mas(val); else b = b.mas(val);
    });
    if (variable && cero(k)) variable = null;
    return { k: k, b: b, v: variable };
  }

  /* Trocea el texto de una matriz con incógnitas en una rejilla de
     cadenas, con las mismas reglas de separación que S.parseMat. */
  function rejillaTexto(txt, nombre) {
    var t = String(txt === undefined ? '' : txt).trim()
      .replace(/[\r\n]+/g, ';').replace(/[−–—]/g, '-');
    if (t === '') throw Error('Falta ' + nombre + '. Escribe por ejemplo x 2; 3 y.');
    var filas = t.split(';').map(function (f) { return f.trim(); })
      .filter(function (f) { return f !== ''; });
    var g = filas.map(function (f) {
      return f.split(/[\s,\t]+/).filter(function (u) { return u !== ''; });
    });
    var n = g[0].length, i;
    for (i = 1; i < g.length; i++) {
      if (g[i].length !== n) {
        throw Error('En ' + nombre + ' la fila 1 tiene ' + n + ' elementos y la fila ' + (i + 1) +
          ' tiene ' + g[i].length + '. Todas las filas de una matriz deben tener el mismo número ' +
          'de elementos: escribe por ejemplo x 2; 3 y.');
      }
    }
    if (g.length > MAXDIM || n > MAXDIM) {
      throw Error('Para que la figura se lea bien, ' + nombre + ' puede tener como mucho ' +
        MAXDIM + ' filas y ' + MAXDIM + ' columnas.');
    }
    return g;
  }
  function elemTexIncog(e) {
    if (!e.v) return FT(e.b);
    var cuerpo = (e.k.n === 1n && e.k.d === 1n) ? e.v
      : ((e.k.n === -1n && e.k.d === 1n) ? '-' + e.v : FT(e.k) + e.v);
    if (cero(e.b)) return cuerpo;
    return cuerpo + (e.b.n < 0n ? ' - ' + FT(e.b.opuesto()) : ' + ' + FT(e.b));
  }
  function elemTxtIncog(e) { return TP(elemTexIncog(e).replace(/\\frac\{(-?\d+)\}\{(\d+)\}/g, '$1/$2')); }

  R.igualdad = function (node) {
return S.shell(node, 'Igualdad de matrices',
      'Dos matrices son iguales cuando tienen <b>la misma dimensión</b> y <b>todos sus elementos ' +
      'coinciden uno a uno</b>. Escribe cada matriz por filas, separando las filas con <code>;</code>: ' +
      '<code>x 2; 3 y</code> y <code>5 2; 3 -1</code>. Las casillas pueden ser números ' +
      '(<code>3</code>, <code>-2</code>, <code>0,5</code>, <code>3/4</code>) o llevar una incógnita ' +
      '<code>x</code>, <code>y</code>, <code>z</code>, <code>t</code>, sola o con coeficiente y término ' +
      'independiente: <code>2x</code>, <code>x+1</code>, <code>3z-2</code>. El applet compara primero ' +
      'las dimensiones y después plantea una ecuación por cada posición.',
      [
        { id: 'a', label: 'Matriz A', type: 'text', value: 'x 2; 3 y', ancho: '15rem' },
        { id: 'b', label: 'Matriz B', type: 'text', value: '5 2; 3 -1', ancho: '15rem' },
        escenarios([
          { txt: 'caso sencillo', tit: 'Dos incógnitas directas', set: { a: 'x 2; 3 y', b: '5 2; 3 -1' } },
          { txt: 'cuatro incógnitas', tit: 'x, y, z y t a la vez', set: { a: 'x y; z t', b: '1 -2; 0 7' } },
          { txt: 'con coeficientes', tit: 'Ecuaciones del tipo 2x = 6', set: { a: '2x 3y; z-1 4', b: '6 -9; 2 4' } },
          { txt: 'imposible: dimensiones', tit: 'Nunca pueden ser iguales', set: { a: '1 2 3; 4 5 6', b: '1 2; 3 4' } },
          { txt: 'imposible: contradicción', tit: 'La posición (2,2) no cuadra', set: { a: 'x 1; 2 3', b: '4 1; 2 5' } },
          { txt: 'contradicción en la incógnita', tit: 'x tendría que valer dos cosas', set: { a: 'x 1; x 3', b: '2 1; 5 3' } },
          { txt: 'soluciones fraccionarias', set: { a: '2x 1; 3 4y', b: '1 1; 3 -2' } },
          { txt: 'ya son iguales', tit: 'Sin incógnitas y elemento a elemento', set: { a: '1 2; 3 4', b: '1 2; 3 4' } }
        ])
      ],
      guarda(function (v) {
        var GA = rejillaTexto(v.a, 'la matriz A');
        var GB = rejillaTexto(v.b, 'la matriz B');
        var fa = GA.length, ca = GA[0].length, fb = GB.length, cb = GB[0].length;

        var h = enun('Se comparan dos matrices. Primero la dimensión; solo si coincide tiene sentido ' +
          'comparar elemento a elemento.');
        h += S.kvs([
          'A es de ' + K(fa + ' \\times ' + ca),
          'B es de ' + K(fb + ' \\times ' + cb),
          (fa === fb && ca === cb) ? S.badge('misma dimensión', 'si') : S.badge('dimensiones distintas', 'no')
        ]);

        if (fa !== fb || ca !== cb) {
          h += S.expr('Conclusión', 'A \\ne B');
          h += S.paso(1, 'La matriz $A$ es de dimensión $' + fa + ' \\times ' + ca + '$ y la matriz $B$ es de ' +
            'dimensión $' + fb + ' \\times ' + cb + '$.', 'ap-paso-clave');
          h += S.paso(2, 'Dos matrices de <b>dimensiones distintas nunca son iguales</b>, por muchos números ' +
            'que compartan: ni siquiera hay una correspondencia entre sus posiciones. ' +
            'No hace falta mirar ningún elemento.', 'ap-paso-clave');
          h += nota('Para que la igualdad tenga sentido, escribe las dos matrices con el mismo número ' +
            'de filas y de columnas, por ejemplo <code>x 2; 3 y</code> y <code>5 2; 3 -1</code>.');
          return h;
        }

        /* ecuación por posición */
        var i, j, filas = [], asign = {}, choques = [], trivialesFalsas = [], libres = [];
        for (i = 0; i < fa; i++) {
          for (j = 0; j < ca; j++) {
            var EA = leeElem(GA[i][j], i + 1, j + 1);
            var EB = leeElem(GB[i][j], i + 1, j + 1);
            var pos = '(' + (i + 1) + ', ' + (j + 1) + ')';
            var ecu = elemTexIncog(EA) + ' = ' + elemTexIncog(EB);
            var incog = EA.v || EB.v;
            var k = EA.k.menos(EB.k);            /* k·v = b_B - b_A */
            var b = EB.b.menos(EA.b);
            var res, clase = '';
            if (EA.v && EB.v && EA.v !== EB.v) {
              throw Error('En la posición ' + pos + ' se comparan dos incógnitas distintas (' + EA.v +
                ' y ' + EB.v + '). Este applet resuelve posiciones en las que una incógnita se compara ' +
                'con un número o consigo misma: escribe por ejemplo 2x en A y 6 en B.');
            }
            if (!incog) {
              if (igualF(EA.b, EB.b)) { res = S.badge('se cumple', 'si'); clase = 'ap-ok-row'; }
              else {
                res = S.badge('imposible: ' + FT(EA.b) + ' ≠ ' + FT(EB.b), 'no');
                trivialesFalsas.push({ pos: pos, i: i, j: j, a: EA.b, b: EB.b });
              }
            } else if (cero(k)) {
              if (cero(b)) { res = S.badge('siempre se cumple', 'info'); libres.push(incog); }
              else {
                res = S.badge('imposible', 'no');
                trivialesFalsas.push({ pos: pos, i: i, j: j, a: EA.b, b: EB.b });
              }
            } else {
              var val = b.entre(k);
              res = K(incog + ' = ' + FT(val));
              clase = 'ap-ok-row';
              if (!asign[incog]) asign[incog] = [];
              asign[incog].push({ val: val, pos: pos, i: i, j: j });
            }
            filas.push({ clase: clase, celdas: [pos, K(ecu), res] });
          }
        }

        h += S.tabla(['Posición', 'Ecuación que se plantea', 'Consecuencia'], filas, { thPrimera: false });

        /* contradicciones entre valores de una misma incógnita */
        Object.keys(asign).forEach(function (u) {
          var lista = asign[u], p;
          for (p = 1; p < lista.length; p++) {
            if (!igualF(lista[p].val, lista[0].val)) {
              choques.push({ u: u, a: lista[0], b: lista[p] });
              break;
            }
          }
        });

        var vars = Object.keys(asign);
        var posibles = choques.length === 0 && trivialesFalsas.length === 0;

        if (!posibles) {
          h += S.expr('Conclusión', 'A \\ne B \\quad \\text{para cualquier valor de las incógnitas}');
          trivialesFalsas.forEach(function (c, p) {
            h += S.paso(p + 1, 'En la posición ' + c.pos + ' hay que comparar dos números fijos, ' +
              'y no coinciden: $' + FT(c.a) + ' \\ne ' + FT(c.b) + '$. Ninguna incógnita puede arreglarlo.',
              'ap-paso-avi');
          });
          choques.forEach(function (c, p) {
            h += S.paso(trivialesFalsas.length + p + 1,
              'La incógnita $' + c.u + '$ tendría que valer $' + FT(c.a.val) + '$ por la posición ' + c.a.pos +
              ' y $' + FT(c.b.val) + '$ por la posición ' + c.b.pos + ' a la vez, lo cual es imposible.',
              'ap-paso-avi');
          });
          h += nota('Recuerda: la igualdad de matrices exige que <b>todas</b> las posiciones cuadren. ' +
            'Basta con que falle una para que las matrices sean distintas.');
          return h;
        }

        if (!vars.length) {
          h += S.expr('Conclusión', 'A = B');
          h += nota('Todas las posiciones coinciden y no hay ninguna incógnita que determinar: ' +
            'las dos matrices son <b>iguales</b>.');
          return h;
        }

        var sol = vars.map(function (u) { return u + ' = ' + FT(asign[u][0].val); }).join(', \\quad ');
        h += S.resultado(K(sol), vars.length === 1 ? 'valor que hace iguales las dos matrices'
          : 'valores que hacen iguales las dos matrices');
        h += S.expr('Solución', sol);

        /* matrices ya sustituidas */
        var valores = {};
        vars.forEach(function (u) { valores[u] = asign[u][0].val; });
        function sustituye(G) {
          var a = [], p, q;
          for (p = 0; p < G.length; p++) {
            a.push([]);
            for (q = 0; q < G[p].length; q++) {
              var E = leeElem(G[p][q], p + 1, q + 1);
              var val = E.v ? E.k.por(valores[E.v] || new Frac(0)).mas(E.b) : E.b;
              a[p].push(val);
            }
          }
          return S.matDe(a);
        }
        var MA = sustituye(GA), MB = sustituye(GB);
        var dif = S.difIguales(MA, MB);

        h += figuraMats([
          { A: MA, nombre: 'A (ya sustituida)', rot: true, pulsable: false },
          { A: MB, nombre: 'B', op: '=', rot: false, pulsable: false,
            marcas: dif.map(function (d) { return { i: d[0], j: d[1], col: COL.rojo }; }) }
        ], {
          titulo: 'Las dos matrices con las incógnitas sustituidas',
          subtitulo: dif.length ? 'quedan ' + dif.length + ' posiciones sin cuadrar' : 'coinciden en todas las posiciones',
          pie: dif.length ? 'Todavía no son iguales' : 'A = B, elemento a elemento',
          label: 'Comparación de las dos matrices tras sustituir las incógnitas',
          cap: dif.length ? 'Revisa las posiciones marcadas.' : 'Con esos valores se cumple $A = B$.'
        });

        vars.forEach(function (u, p) {
          h += S.paso(p + 1, 'La posición ' + asign[u][0].pos + ' obliga a que $' + u + ' = ' +
            FT(asign[u][0].val) + '$.', p === vars.length - 1 ? 'ap-paso-clave' : '');
        });
        if (libres.length) {
          h += nota('Alguna posición se cumple sea cual sea el valor de la incógnita (una identidad ' +
            'del tipo $0 = 0$): esas posiciones no aportan información.');
        }
        h += nota('Comprobación: al sustituir, las dos matrices quedan ' +
          (dif.length === 0 ? 'exactamente iguales, así que la solución es correcta.'
            : 'todavía distintas; revisa lo escrito.'));
        return h;
      }));
  };

  /* ==================================================================
     5 · clasifica · Clasificador de matrices (con modo reto)
     ================================================================== */

  var PROPS = [
    { id: 'cuadrada', nom: 'cuadrada', reto: 'gCuad' },
    { id: 'fila', nom: 'matriz fila' },
    { id: 'columna', nom: 'matriz columna' },
    { id: 'rectangular', nom: 'rectangular' },
    { id: 'nula', nom: 'nula' },
    { id: 'diagonal', nom: 'diagonal', reto: 'gDiag' },
    { id: 'escalar', nom: 'escalar' },
    { id: 'identidad', nom: 'identidad' },
    { id: 'triangularSup', nom: 'triangular superior', reto: 'gTsup' },
    { id: 'triangularInf', nom: 'triangular inferior', reto: 'gTinf' },
    { id: 'simetrica', nom: 'simétrica', reto: 'gSim' },
    { id: 'antisimetrica', nom: 'antisimétrica', reto: 'gAnti' },
    { id: 'regular', nom: 'regular (tiene inversa)', reto: 'gReg' },
    { id: 'singular', nom: 'singular (no tiene inversa)' }
  ];

  R.clasifica = function (node) {
return S.shell(node, 'Clasificador de matrices',
      COMO_MAT + ' El applet enumera <b>todas</b> las etiquetas que le corresponden a la matriz ' +
      '(fila, columna, rectangular, cuadrada, nula, diagonal, escalar, identidad, triangular superior ' +
      'o inferior, simétrica, antisimétrica, regular o singular) y explica cada «sí» y cada «no». ' +
      'Si activas el <b>modo reto</b>, primero marcas tú las casillas que crees que se cumplen y ' +
      'después pulsas <i>destapar</i> para ver tu marcador.',
      [
        { id: 'txt', label: 'Matriz', type: 'text', value: '2 0 0; 0 3 0; 0 0 -1', ancho: '18rem' },
        { id: 'reto', label: 'Modo reto', type: 'check', value: false },
        { id: 'gCuad', label: '¿cuadrada?', type: 'check', value: false },
        { id: 'gDiag', label: '¿diagonal?', type: 'check', value: false },
        { id: 'gTsup', label: '¿triang. superior?', type: 'check', value: false },
        { id: 'gTinf', label: '¿triang. inferior?', type: 'check', value: false },
        { id: 'gSim', label: '¿simétrica?', type: 'check', value: false },
        { id: 'gAnti', label: '¿antisimétrica?', type: 'check', value: false },
        { id: 'gReg', label: '¿regular?', type: 'check', value: false },
        { id: 'destapa', label: 'Destapar', type: 'check', value: false },
        escenarios([
          { txt: 'diagonal', tit: 'Ceros fuera de la diagonal principal', set: { txt: '2 0 0; 0 3 0; 0 0 -1', reto: false, destapa: false } },
          { txt: 'identidad de orden 3', set: { txt: '1 0 0; 0 1 0; 0 0 1', reto: false, destapa: false } },
          { txt: 'escalar 4I', tit: 'Diagonal con todos los elementos iguales', set: { txt: '4 0; 0 4', reto: false, destapa: false } },
          { txt: 'triangular superior', set: { txt: '1 2 3; 0 4 5; 0 0 6', reto: false, destapa: false } },
          { txt: 'triangular inferior', set: { txt: '1 0 0; 2 3 0; 4 5 6', reto: false, destapa: false } },
          { txt: 'simétrica', tit: 'Coincide con su transpuesta', set: { txt: '1 2 3; 2 5 -1; 3 -1 0', reto: false, destapa: false } },
          { txt: 'antisimétrica', tit: 'Diagonal de ceros y signos opuestos', set: { txt: '0 2 -3; -2 0 5; 3 -5 0', reto: false, destapa: false } },
          { txt: 'singular', tit: 'Determinante nulo: no tiene inversa', set: { txt: '1 2; 2 4', reto: false, destapa: false } },
          { txt: 'matriz fila', set: { txt: '3 -1 0 5', reto: false, destapa: false } },
          { txt: 'matriz nula 2×3', set: { txt: '0 0 0; 0 0 0', reto: false, destapa: false } },
          { txt: 'reto: adivina las etiquetas', tit: 'Marca tus respuestas y destapa',
            set: { txt: '0 3 -2; -3 0 1; 2 -1 0', reto: true, destapa: false, gCuad: false, gDiag: false, gTsup: false, gTinf: false, gSim: false, gAnti: false, gReg: false } }
        ])
      ],
      guarda(function (v) {
        var A = leeMat(v.txt, 'la matriz');
        var cl = S.clasifica(A);
        var reto = !!v.reto, destapa = !!v.destapa;

        var h = enun('Matriz de dimensión ' + K(S.dimTex(A)) +
          (cl.cuadrada ? ' (cuadrada de orden ' + cl.orden + ')' : ' (rectangular)') + '.');

        var marcasDiag = [];
        if (cl.cuadrada) {
          var d;
          for (d = 0; d < A.f; d++) marcasDiag.push({ i: d, j: d, col: COL.azul, fondo: 'rgba(25,118,210,.10)' });
        }
        h += figuraMat(A, {
          titulo: 'Matriz que hay que clasificar',
          subtitulo: cl.cuadrada ? 'la diagonal principal va marcada en azul' : 'matriz rectangular: no hay diagonal principal que estudiar',
          nombre: 'A', marcas: marcasDiag, pulsable: false,
          pie: 'Dimensión ' + A.f + ' × ' + A.c + (cl.cuadrada ? ' · traza ' + llano(cl.traza) : ''),
          label: 'Matriz que se va a clasificar',
          cap: 'Dimensión $' + S.dimTex(A) + '$' + (cl.cuadrada
            ? ', determinante $\\det(A) = ' + FT(cl.det) + '$ y rango $\\operatorname{rg}(A) = ' + cl.rango + '$.'
            : ' y rango $\\operatorname{rg}(A) = ' + cl.rango + '$.')
        });

        if (reto && !destapa) {
          h += tarjeta('Modo reto', '<p>Marca arriba las casillas de las propiedades que creas que ' +
            'cumple esta matriz y después activa <b>Destapar</b>. Piensa en el orden habitual: ' +
            '¿es cuadrada?, ¿tiene ceros fuera de la diagonal?, ¿qué pasa al transponerla?, ' +
            '¿su determinante es cero?</p>' +
            nota('Pista: una matriz diagonal es a la vez triangular superior e inferior, ' +
              'y toda matriz diagonal es simétrica.'), 'ap-card-ok');
          return h;
        }

        if (reto && destapa) {
          var aciertos = 0, ptotal = 0, filasR = [];
          PROPS.forEach(function (p) {
            if (!p.reto) return;
            ptotal++;
            var tuya = !!v[p.reto], real = !!cl[p.id];
            if (tuya === real) aciertos++;
            filasR.push({
              clase: tuya === real ? 'ap-ok-row' : '',
              celdas: [
                p.nom,
                tuya ? 'sí' : 'no',
                real ? 'sí' : 'no',
                tuya === real ? S.badge('acierto', 'si') : S.badge('fallo', 'no')
              ]
            });
          });
          h += S.tabla(['Propiedad', 'Tu respuesta', 'La correcta', 'Resultado'], filasR, { thPrimera: false });
          h += S.resultado(K(aciertos + '/' + ptotal), 'aciertos en el modo reto');
        }

        /* etiquetas y explicaciones completas */
        h += S.kvs(cl.nombres.length
          ? cl.nombres.map(function (n) { return S.badge(n, 'si'); })
          : [S.badge('sin etiquetas especiales', 'info')]);

        var filas = PROPS.map(function (p) {
          var si = !!cl[p.id];
          return {
            clase: si ? 'ap-ok-row' : '',
            celdas: [p.nom, si ? S.badge('sí', 'si') : S.badge('no', 'no'),
              cl.razones[p.id] || '—']
          };
        });
        h += S.tabla(['Propiedad', '¿Se cumple?', 'Por qué'], filas, { thPrimera: false });

        h += rejilla2([
          tarjeta('Dimensión y elementos', '<p>' + cl.razones.dimension + '</p>'),
          tarjeta('Rango', '<p>' + cl.razones.rango + '</p>')
        ]);
        if (cl.cuadrada) {
          h += rejilla2([
            tarjeta('Traza', '<p>' + cl.razones.traza + '</p>' +
              S.expr('Suma de la diagonal principal', '\\operatorname{tr}(A) = ' +
                S.sumandosTex(S.diagPrincipal(A).map(function (x) { return FT(x); })) + ' = ' + FT(cl.traza))),
            tarjeta('Determinante e inversa', '<p>' + cl.razones.regular + '</p>' +
              S.expr('Determinante', '\\det(A) = ' + FT(cl.det)))
          ]);
        }
        h += S.expr('Transpuesta, para comparar', 'A^t = ' + S.matTex(S.matTrans(A)));
        return h;
      }));
  };

  /* ==================================================================
     6 · cuadradas · Matrices cuadradas notables
     ================================================================== */

  var TIPOS = [
    { value: 'identidad', nom: 'identidad', def: 'Diagonal con unos en la diagonal principal: $I_n$.', prop: 'identidad' },
    { value: 'escalar', nom: 'escalar', def: 'Diagonal con todos los elementos de la diagonal iguales: $kI_n$.', prop: 'escalar' },
    { value: 'diagonal', nom: 'diagonal', def: 'Todos los elementos fuera de la diagonal principal son cero.', prop: 'diagonal' },
    { value: 'triangular', nom: 'triangular superior', def: 'Todos los elementos por debajo de la diagonal principal son cero.', prop: 'triangularSup' },
    { value: 'triangularInf', nom: 'triangular inferior', def: 'Todos los elementos por encima de la diagonal principal son cero.', prop: 'triangularInf' },
    { value: 'simetrica', nom: 'simétrica', def: 'Coincide con su transpuesta: $a_{ij} = a_{ji}$.', prop: 'simetrica' },
    { value: 'antisimetrica', nom: 'antisimétrica', def: 'Cambia de signo al transponer: $a_{ij} = -a_{ji}$, con la diagonal de ceros.', prop: 'antisimetrica' },
    { value: 'nula', nom: 'nula', def: 'Todos sus elementos valen cero.', prop: 'nula' },
    { value: 'regular', nom: 'regular', def: 'Su determinante no es cero, así que tiene inversa.', prop: 'regular' },
    { value: 'singular', nom: 'singular', def: 'Su determinante es cero: no tiene inversa.', prop: 'singular' }
  ];
  function tipoDe(valor) {
    var t = TIPOS.filter(function (o) { return o.value === valor; })[0];
    return t || TIPOS[0];
  }
  function ejemploDe(tipo, n) {
    if (tipo === 'nula') return S.matNula(n, n);
    if (tipo === 'triangularInf') return S.matTrans(S.matAleatoria(n, n, { min: -4, max: 6, tipo: 'triangular' }));
    return S.matAleatoria(n, n, { min: -4, max: 6, tipo: tipo });
  }

  R.cuadradas = function (node) {
return S.shell(node, 'Matrices cuadradas notables',
      'Una matriz <b>cuadrada</b> tiene tantas filas como columnas, y entonces aparecen dos objetos ' +
      'nuevos: la <b>diagonal principal</b> (los elementos $a_{11}, a_{22}, \\dots, a_{nn}$) y la ' +
      '<b>diagonal secundaria</b> (los que van de la esquina superior derecha a la inferior izquierda). ' +
      'Elige un tipo, pulsa <b>Generar ejemplo</b> y estudia la matriz que sale; después edítala a mano ' +
      'para comprobar si sigue siendo de ese tipo. ' + COMO_MAT,
      [
        { id: 'tipo', label: 'Tipo', type: 'select', value: 'diagonal',
          options: TIPOS.map(function (t) { return { value: t.value, label: t.nom }; }) },
        { id: 'n', label: 'Orden n', type: 'range', min: 2, max: 5, value: 3 },
        { id: 'txt', label: 'Matriz', type: 'text', value: '2 0 0; 0 -3 0; 0 0 5', ancho: '18rem' },
        { id: 'dp', label: 'Diagonal principal', type: 'check', value: true },
        { id: 'ds', label: 'Diagonal secundaria', type: 'check', value: true },
        { id: 'gen', label: 'Generar ejemplo', type: 'button', click: function (ctl) {
          var n = ent(ctl.n && ctl.n.value, 2, 5, 3);
          var tipo = (ctl.tipo && ctl.tipo.value) || 'diagonal';
          try { pon(ctl, { txt: S.matTxt(ejemploDe(tipo, n)) }); } catch (e) { /* se avisa al calcular */ }
        } },
        escenarios([
          { txt: 'identidad de orden 4', set: { tipo: 'identidad', n: 4, txt: '1 0 0 0; 0 1 0 0; 0 0 1 0; 0 0 0 1', dp: true, ds: true } },
          { txt: 'escalar 3I', set: { tipo: 'escalar', n: 3, txt: '3 0 0; 0 3 0; 0 0 3', dp: true, ds: true } },
          { txt: 'diagonal', set: { tipo: 'diagonal', n: 3, txt: '2 0 0; 0 -3 0; 0 0 5', dp: true, ds: true } },
          { txt: 'triangular superior', set: { tipo: 'triangular', n: 3, txt: '1 2 3; 0 4 5; 0 0 6', dp: true, ds: false } },
          { txt: 'triangular inferior', set: { tipo: 'triangularInf', n: 3, txt: '1 0 0; 2 3 0; 4 5 6', dp: true, ds: false } },
          { txt: 'simétrica', set: { tipo: 'simetrica', n: 3, txt: '1 2 3; 2 0 -1; 3 -1 4', dp: true, ds: true } },
          { txt: 'antisimétrica', set: { tipo: 'antisimetrica', n: 3, txt: '0 2 -3; -2 0 1; 3 -1 0', dp: true, ds: true } },
          { txt: 'nula de orden 3', set: { tipo: 'nula', n: 3, txt: '0 0 0; 0 0 0; 0 0 0', dp: true, ds: true } },
          { txt: 'singular', tit: 'Filas proporcionales: determinante 0', set: { tipo: 'singular', n: 3, txt: '1 2 3; 2 4 6; 0 1 1', dp: true, ds: true } },
          { txt: 'ya no es diagonal', tit: 'Basta un elemento fuera de sitio', set: { tipo: 'diagonal', n: 3, txt: '2 0 7; 0 -3 0; 0 0 5', dp: true, ds: true } }
        ])
      ],
      guarda(function (v) {
        var T = tipoDe(v.tipo);
        var A = leeMat(v.txt, 'la matriz', { cuadrada: true });
        var n = A.f;
        var cl = S.clasifica(A);
        var dp = S.diagPrincipal(A), ds = S.diagSecundaria(A);
        var cumple = !!cl[T.prop];

        var marcas = [], i;
        if (v.dp) for (i = 0; i < n; i++) marcas.push({ i: i, j: i, col: COL.azul, fondo: 'rgba(25,118,210,.13)', grosor: 3.4 });
        if (v.ds) for (i = 0; i < n; i++) marcas.push({ i: i, j: n - 1 - i, col: COL.morado, grosor: 2.6 });

        var h = enun('Tipo elegido: <b>' + esc(T.nom) + '</b>. ' + T.def);

        h += figuraMat(A, {
          titulo: 'Matriz cuadrada de orden ' + n,
          subtitulo: (v.dp ? 'diagonal principal en azul' : '') +
            (v.dp && v.ds ? ' · ' : '') + (v.ds ? 'diagonal secundaria en morado' : ''),
          nombre: 'A', marcas: marcas, pulsable: false,
          pie: 'Traza (suma de la diagonal principal) = ' + llano(cl.traza),
          label: 'Matriz cuadrada con sus dos diagonales resaltadas',
          cap: 'La diagonal principal es $a_{11}, a_{22}, \\dots, a_{' + n + n + '}$; la secundaria va de ' +
            '$a_{1' + n + '}$ a $a_{' + n + '1}$. Solo la principal interviene en la traza.'
        });
        h += S.leyenda([
          [COL.azul, 'diagonal principal: ' + K(dp.map(function (x) { return FT(x); }).join(',\\; '))],
          [COL.morado, 'diagonal secundaria: ' + K(ds.map(function (x) { return FT(x); }).join(',\\; '))]
        ]);

        h += S.kvs([
          'orden ' + K(String(n)),
          'traza ' + K('\\operatorname{tr}(A) = ' + FT(cl.traza)),
          'determinante ' + K('\\det(A) = ' + FT(cl.det)),
          'rango ' + K('\\operatorname{rg}(A) = ' + cl.rango),
          cumple ? S.badge('sí es ' + T.nom, 'si') : S.badge('ya no es ' + T.nom, 'no')
        ]);

        h += S.expr('Traza', '\\operatorname{tr}(A) = ' +
          S.sumandosTex(dp.map(function (x) { return FT(x); })) + ' = ' + FT(cl.traza));

        h += (cumple
          ? tarjeta('¿Sigue siendo ' + T.nom + '?', '<p>' + S.badge('sí', 'si') + ' ' +
            (cl.razones[T.prop] || '') + '</p>', 'ap-card-ok')
          : tarjeta('¿Sigue siendo ' + T.nom + '?', '<p>' + S.badge('no', 'no') + ' ' +
            (cl.razones[T.prop] || '') + '</p>' +
            nota('Edita la matriz o pulsa <b>Generar ejemplo</b> para obtener otra del tipo elegido.'),
            'ap-card-ko'));

        h += S.kvs(cl.nombres.length
          ? cl.nombres.map(function (x) { return S.badge(x, 'info'); })
          : [S.badge('sin etiquetas especiales', 'info')]);

        h += S.tabla(['Elemento', 'Diagonal principal', 'Diagonal secundaria'],
          dp.map(function (x, k) {
            return ['posición ' + (k + 1),
              K('a_{' + (k + 1) + (k + 1) + '} = ' + FT(x)),
              K('a_{' + (k + 1) + (n - k) + '} = ' + FT(ds[k]))];
          }), { thPrimera: true });

        h += nota('La traza solo suma la <b>diagonal principal</b>: la secundaria no interviene. ' +
          'Y ojo, el orden de una matriz cuadrada es su número de filas (o de columnas), no su dimensión ' +
          'escrita como producto.');
        return h;
      }));
  };

  /* ==================================================================
     7 · transpuesta · Transposición de matrices
     ================================================================== */
  R.transpuesta = function (node) {
return S.shell(node, 'Transposición de matrices',
      'La <b>transpuesta</b> $A^t$ se obtiene cambiando filas por columnas: la fila 1 de $A$ pasa a ser ' +
      'la columna 1 de $A^t$, la fila 2 la columna 2, etc. Escribe las matrices por filas: ' +
      '<code>1 2 3; 4 5 6</code> y <code>0 1 -1; 2 0 3</code> (se admiten fracciones: ' +
      '<code>1/2 3; 0 -2</code>). Mueve el deslizador <b>fila i</b> para ver a la vez la fila $i$ de $A$ ' +
      'y la columna $i$ de $A^t$, y elige abajo qué propiedad quieres comprobar con tus propias matrices.',
      [
        { id: 'a', label: 'Matriz A', type: 'text', value: '1 2 3; 4 5 6', ancho: '15rem' },
        { id: 'b', label: 'Matriz B', type: 'text', value: '0 1 -1; 2 0 3', ancho: '15rem' },
        { id: 'i', label: 'Fila i de A', type: 'range', min: 1, max: MAXDIM, value: 1 },
        { id: 'prop', label: 'Propiedad', type: 'select', value: 'doble', options: [
          { value: 'doble', label: '(Aᵗ)ᵗ = A' },
          { value: 'suma', label: '(A+B)ᵗ = Aᵗ + Bᵗ' },
          { value: 'producto', label: '(A·B)ᵗ = Bᵗ·Aᵗ' }
        ] },
        escenarios([
          { txt: 'rectangular 2×3', tit: 'La transpuesta es 3×2', set: { a: '1 2 3; 4 5 6', b: '0 1 -1; 2 0 3', i: 1, prop: 'doble' } },
          { txt: 'doble transposición', set: { a: '1 2 3; 4 5 6', b: '0 1 -1; 2 0 3', i: 2, prop: 'doble' } },
          { txt: 'transpuesta de la suma', set: { a: '1 2; 3 4', b: '5 -1; 0 2', i: 1, prop: 'suma' } },
          { txt: 'transpuesta del producto', tit: 'Ojo: el orden se invierte', set: { a: '1 2 3; 4 5 6', b: '1 0; 0 1; 2 -1', i: 1, prop: 'producto' } },
          { txt: 'matriz simétrica', tit: 'Se cumple Aᵗ = A', set: { a: '1 2 3; 2 0 -1; 3 -1 4', b: '1 0 0; 0 1 0; 0 0 1', i: 2, prop: 'doble' } },
          { txt: 'matriz fila y su columna', set: { a: '3 -1 0 5', b: '1 1 1 1', i: 1, prop: 'suma' } },
          { txt: 'dimensiones incompatibles', tit: 'Aquí no se puede sumar', set: { a: '1 2 3; 4 5 6', b: '1 2; 3 4', i: 1, prop: 'suma' } }
        ])
      ],
      guarda(function (v, ctl, out, api) {
        var A = leeMat(v.a, 'la matriz A');
        var At = S.matTrans(A);
        var i = ent(v.i, 1, MAXDIM, 1);
        if (i > A.f) i = A.f;

        var h = enun('Transponer es <b>escribir las filas como columnas</b>. Si $A$ es de dimensión ' +
          K(S.dimTex(A)) + ', entonces $A^t$ es de dimensión ' + K(S.dimTex(At)) + ': las dimensiones ' +
          'se intercambian.');

        h += figuraMats([
          { A: A, nombre: 'A', rot: true, filaHi: [i - 1], pulsable: true },
          { A: At, nombre: 'At (transpuesta)', rot: true, colHi: [i - 1], pulsable: false }
        ], {
          titulo: 'La fila ' + i + ' de A es la columna ' + i + ' de At',
          subtitulo: 'A es de ' + A.f + ' × ' + A.c + ' y At es de ' + At.f + ' × ' + At.c,
          pie: 'Fila ' + i + ' de A: ' + A.a[i - 1].map(function (x) { return llano(x); }).join('  '),
          label: 'Una matriz y su transpuesta, con la fila y la columna correspondientes resaltadas',
          cap: 'Los elementos cumplen $(A^t)_{ji} = a_{ij}$: el que estaba en la fila $i$ y la columna $j$ ' +
            'pasa a la fila $j$ y la columna $i$.'
        });
        /* Pulsando una celda de A se elige su fila: la columna gemela de
           A^t se resalta al instante. */
        celdasPulsables(api, 'i', null);

        h += rejilla2([
          tarjeta('Matriz A', S.expr('', 'A = ' + S.matTex(A), false) +
            nota('Dimensión $' + S.dimTex(A) + '$.')),
          tarjeta('Transpuesta Aᵗ', S.expr('', 'A^t = ' + S.matTex(At), false) +
            nota('Dimensión $' + S.dimTex(At) + '$.'))
        ]);

        var fila = A.a[i - 1].map(function (x, k) { return '$a_{' + i + (k + 1) + '} = ' + FT(x) + '$'; });
        h += nota('La fila ' + i + ' de $A$ es ' + fila.join(', ') + ', y esos mismos números forman la ' +
          'columna ' + i + ' de $A^t$, en el mismo orden.');

        /* propiedades */
        if (v.prop === 'doble') {
          var Att = S.matTrans(At);
          var ok = S.matIgual(Att, A);
          h += tarjeta('Propiedad: la transpuesta de la transpuesta',
            S.expr('Cálculo', '(A^t)^t = ' + S.matTex(Att)) +
            '<p>' + (ok ? S.badge('se cumple (A^t)^t = A', 'si') : S.badge('algo falla', 'no')) +
            ' Al transponer dos veces se vuelve al punto de partida: las filas pasan a columnas y ' +
            'las columnas otra vez a filas.</p>', ok ? 'ap-card-ok' : 'ap-card-ko');
        } else {
          var B;
          try { B = leeMat(v.b, 'la matriz B'); }
          catch (e) {
            return h + avisoSuave('Para comprobar esta propiedad hace falta también la matriz $B$. ' +
              esc(e.message));
          }
          var Bt = S.matTrans(B);
          if (v.prop === 'suma') {
            if (A.f !== B.f || A.c !== B.c) {
              h += tarjeta('Propiedad: transpuesta de una suma',
                '<p>' + S.badge('no se puede sumar', 'no') + ' La matriz $A$ es de $' + S.dimTex(A) +
                '$ y la matriz $B$ es de $' + S.dimTex(B) + '$. Para sumar dos matrices hace falta que ' +
                'tengan la <b>misma dimensión</b>, porque la suma se hace elemento a elemento. ' +
                'Escribe $B$ con ' + A.f + ' filas y ' + A.c + ' columnas, por ejemplo <code>' +
                esc(S.matTxt(S.matNula(A.f, A.c))) + '</code>.</p>', 'ap-card-ko');
            } else {
              var Sm = S.matSuma(A, B), izq = S.matTrans(Sm), der = S.matSuma(S.matTrans(A), Bt);
              var ok2 = S.matIgual(izq, der);
              h += tarjeta('Propiedad: transpuesta de una suma',
                S.expr('Primero se suma y luego se transpone', '(A + B)^t = ' + S.matTex(Sm) + '^t = ' + S.matTex(izq)) +
                S.expr('Primero se transpone y luego se suma', 'A^t + B^t = ' + S.matTex(S.matTrans(A)) +
                  ' + ' + S.matTex(Bt) + ' = ' + S.matTex(der)) +
                '<p>' + (ok2 ? S.badge('coinciden', 'si') + ' ' + K('(A+B)^t = A^t + B^t') : S.badge('no coinciden', 'no')) +
                ' El orden de los sumandos no importa: transponer respeta la suma.</p>',
                ok2 ? 'ap-card-ok' : 'ap-card-ko');
            }
          } else {
            if (A.c !== B.f) {
              h += tarjeta('Propiedad: transpuesta de un producto',
                '<p>' + S.badge('no se puede multiplicar', 'no') + ' $A$ es de $' + S.dimTex(A) +
                '$ y $B$ es de $' + S.dimTex(B) + '$: para multiplicar $A \\cdot B$ las <b>columnas de $A$</b> ' +
                '(' + A.c + ') deben coincidir con las <b>filas de $B$</b> (' + B.f + '). ' +
                'Escribe una $B$ con ' + A.c + ' filas.</p>', 'ap-card-ko');
            } else {
              var P = S.matProd(A, B), izq2 = S.matTrans(P), der2 = S.matProd(Bt, S.matTrans(A));
              var ok3 = S.matIgual(izq2, der2);
              var mal = (Bt.c === S.matTrans(A).f) ? S.matProd(S.matTrans(A), Bt) : null;
              h += tarjeta('Propiedad: transpuesta de un producto',
                S.expr('Producto y después transposición', '(A \\cdot B)^t = ' + S.matTex(P) + '^t = ' + S.matTex(izq2)) +
                S.expr('Transponer e invertir el orden', 'B^t \\cdot A^t = ' + S.matTex(izq2)) +
                '<p>' + (ok3 ? S.badge('coinciden', 'si') + ' ' + K('(A \\cdot B)^t = B^t \\cdot A^t') : S.badge('no coinciden', 'no')) +
                ' Aquí el <b>orden se invierte</b>: primero $B^t$ y después $A^t$.</p>' +
                (mal ? '<p>Si se hiciera $A^t \\cdot B^t$ saldría ' + K(S.matTex(mal)) +
                  ', que en general no es lo mismo.</p>'
                  : '<p>De hecho, $A^t \\cdot B^t$ ni siquiera se puede calcular: las dimensiones no encajan.</p>'),
                ok3 ? 'ap-card-ok' : 'ap-card-ko');
            }
          }
        }

        var cl = S.clasifica(A);
        if (cl.cuadrada) {
          h += nota(cl.simetrica
            ? 'Esta matriz es <b>simétrica</b>: coincide con su transpuesta, $A^t = A$.'
            : (cl.antisimetrica
              ? 'Esta matriz es <b>antisimétrica</b>: al transponer cambian todos los signos, $A^t = -A$.'
              : 'Compara $A$ con $A^t$: si coincidieran, la matriz sería simétrica.'));
        }
        return h;
      }));
  };

  /* ==================================================================
     8 · simetrica · Simetría y antisimetría
     ================================================================== */

  /* Construye una matriz de orden n reflejando el triángulo superior.
     texto = «2 3 4; 5 6; 7» (la primera fila empieza en la diagonal). */
  function desdeTriangulo(txt, n, anti) {
    var t = String(txt === undefined ? '' : txt).trim().replace(/[\r\n]+/g, ';').replace(/[−–—]/g, '-');
    if (t === '') {
      throw Error('Falta el triángulo superior. Escribe una línea por fila, empezando en la diagonal ' +
        'y separando las filas con «;». Para orden 3: 1 2 3; 4 5; 6.');
    }
    var filas = t.split(';').map(function (f) { return f.trim(); })
      .filter(function (f) { return f !== ''; });
    var i, j, esperado, a = [], leidas = [];
    for (i = 0; i < n; i++) {
      var trozos = (filas[i] === undefined ? '' : filas[i]).split(/[\s,\t]+/)
        .filter(function (u) { return u !== ''; });
      leidas.push(trozos);
    }
    for (i = 0; i < n; i++) {
      esperado = n - i;
      if (leidas[i].length !== esperado) {
        throw Error('En el triángulo superior de una matriz de orden ' + n + ', la fila ' + (i + 1) +
          ' debe tener ' + esperado + (esperado === 1 ? ' elemento' : ' elementos') +
          ' (desde la diagonal hacia la derecha) y has escrito ' + leidas[i].length +
          '. Para orden ' + n + ' hay que escribir, por ejemplo, ' + ejemploTriangulo(n) + '.');
      }
    }
    for (i = 0; i < n; i++) { a.push([]); for (j = 0; j < n; j++) a[i].push(new Frac(0)); }
    for (i = 0; i < n; i++) {
      for (j = i; j < n; j++) {
        var val = F(leidas[i][j - i]);
        if (i === j) {
          a[i][j] = anti ? new Frac(0) : val;
        } else {
          a[i][j] = val;
          a[j][i] = anti ? val.opuesto() : val;
        }
      }
    }
    return S.matDe(a);
  }
  function ejemploTriangulo(n) {
    var i, j, s = [], k = 1;
    for (i = 0; i < n; i++) {
      var f = [];
      for (j = i; j < n; j++) f.push(String(k++));
      s.push(f.join(' '));
    }
    return s.join('; ');
  }

  R.simetrica = function (node) {
return S.shell(node, 'Simetría y antisimetría',
      'Una matriz cuadrada es <b>simétrica</b> si $a_{ij} = a_{ji}$ (coincide con su transpuesta) y ' +
      '<b>antisimétrica</b> si $a_{ij} = -a_{ji}$ (y entonces su diagonal principal es forzosamente de ' +
      'ceros). En el modo <i>triángulo superior</i> escribes solo la mitad de arriba, una línea por fila ' +
      'empezando en la diagonal y separando las filas con <code>;</code>: para orden 3, ' +
      '<code>1 2 3; 4 5; 6</code>, y el applet refleja el resto. En el modo <i>matriz completa</i> ' +
      'escribes la matriz entera (<code>1 2; 2 5</code>) y el applet marca los pares que se corresponden ' +
      'y los que fallan. Se admiten fracciones (<code>1/2 3; 0 -2</code>).',
      [
        { id: 'modo', label: 'Tipo', type: 'select', value: 'sim', options: [
          { value: 'sim', label: 'simétrica (a_ij = a_ji)' },
          { value: 'anti', label: 'antisimétrica (a_ij = −a_ji)' }
        ] },
        { id: 'origen', label: 'Entrada', type: 'select', value: 'triangulo', options: [
          { value: 'triangulo', label: 'triángulo superior' },
          { value: 'completa', label: 'matriz completa' }
        ] },
        { id: 'n', label: 'Orden n', type: 'range', min: 2, max: 5, value: 3 },
        { id: 'tri', label: 'Triángulo superior', type: 'text', value: '1 2 3; 4 5; 6', ancho: '14rem' },
        { id: 'txt', label: 'Matriz completa', type: 'text', value: '1 2 3; 2 4 -1; 3 -1 0', ancho: '16rem' },
        escenarios([
          { txt: 'simétrica de orden 3', set: { modo: 'sim', origen: 'triangulo', n: 3, tri: '1 2 3; 4 5; 6' } },
          { txt: 'antisimétrica de orden 3', tit: 'La diagonal se fuerza a cero', set: { modo: 'anti', origen: 'triangulo', n: 3, tri: '0 2 -3; 0 5; 0' } },
          { txt: 'simétrica de orden 4', set: { modo: 'sim', origen: 'triangulo', n: 4, tri: '2 1 0 -1; 3 4 5; 6 7; 8' } },
          { txt: 'con fracciones', set: { modo: 'sim', origen: 'triangulo', n: 3, tri: '1/2 3 -1; 2/3 0; 5' } },
          { txt: 'comprobar una simétrica', set: { modo: 'sim', origen: 'completa', n: 3, txt: '1 2 3; 2 4 -1; 3 -1 0' } },
          { txt: 'casi simétrica: falla un par', tit: 'Localiza el elemento culpable', set: { modo: 'sim', origen: 'completa', n: 3, txt: '1 2 3; 2 4 -1; 7 -1 0' } },
          { txt: 'antisimétrica con diagonal mal', tit: 'La diagonal debe ser de ceros', set: { modo: 'anti', origen: 'completa', n: 3, txt: '1 2 -3; -2 0 5; 3 -5 0' } },
          { txt: 'antisimétrica correcta', set: { modo: 'anti', origen: 'completa', n: 3, txt: '0 2 -3; -2 0 5; 3 -5 0' } }
        ])
      ],
      guarda(function (v) {
        var anti = v.modo === 'anti';
        var n = ent(v.n, 2, 5, 3);
        var A, avisos = '';
        if (v.origen === 'completa') {
          A = leeMat(v.txt, 'la matriz', { cuadrada: true });
          n = A.f;
        } else {
          A = desdeTriangulo(v.tri, n, anti);
          if (anti) avisos += avisoSuave('En el modo antisimétrico la <b>diagonal principal se fuerza a ' +
            'cero</b>: si $a_{ii} = -a_{ii}$, entonces $2a_{ii} = 0$ y por tanto $a_{ii} = 0$.');
        }

        var cl = S.clasifica(A);
        var cumple = anti ? cl.antisimetrica : cl.simetrica;

        /* pares (i,j) y (j,i) */
        var i, j, pares = [], fallos = [], marcas = [];
        var paleta = [COL.azul, COL.verde, COL.naranja, COL.morado, COL.teal, COL.rosa,
          '#5d4037', '#00838f', '#7b1fa2', '#33691e'];
        var idx = 0;
        for (i = 0; i < n; i++) {
          for (j = i + 1; j < n; j++) {
            var x = A.a[i][j], y = A.a[j][i];
            var bien = anti ? igualF(x, y.opuesto()) : igualF(x, y);
            var col = bien ? paleta[idx % paleta.length] : COL.rojo;
            marcas.push({ i: i, j: j, col: col, grosor: bien ? 3 : 4 });
            marcas.push({ i: j, j: i, col: col, grosor: bien ? 3 : 4 });
            pares.push({ i: i, j: j, x: x, y: y, bien: bien, col: col });
            if (!bien) fallos.push({ i: i, j: j, x: x, y: y });
            idx++;
          }
        }
        var diagMal = [];
        if (anti) {
          for (i = 0; i < n; i++) {
            if (!cero(A.a[i][i])) {
              diagMal.push(i);
              marcas.push({ i: i, j: i, col: COL.rojo, fondo: 'rgba(198,40,40,.10)', grosor: 4 });
            }
          }
        }

        var h = enun(anti
          ? 'Matriz <b>antisimétrica</b>: cada elemento y su reflejado respecto de la diagonal principal ' +
            'deben ser opuestos, $a_{ij} = -a_{ji}$, y la diagonal debe ser de ceros.'
          : 'Matriz <b>simétrica</b>: cada elemento y su reflejado respecto de la diagonal principal ' +
            'deben ser iguales, $a_{ij} = a_{ji}$. Es como si la diagonal fuese un espejo.');
        h += avisos;

        h += figuraMats([
          { A: A, nombre: 'A', rot: true, marcas: marcas, pulsable: false },
          { A: S.matTrans(A), nombre: 'At', op: '·  ·  ·', rot: false, pulsable: false }
        ], {
          titulo: (anti ? 'Antisimetría' : 'Simetría') + ': pares reflejados respecto de la diagonal',
          subtitulo: 'cada color une la posición (i, j) con la posición (j, i); en rojo, los pares que fallan',
          pie: cumple ? (anti ? 'Se cumple At = −A' : 'Se cumple At = A')
            : (anti ? 'No se cumple At = −A' : 'No se cumple At = A'),
          label: 'Matriz y su transpuesta con los pares simétricos marcados',
          cap: anti ? 'Comparación con $-A^t$: si la matriz es antisimétrica, $A^t = -A$.'
            : 'Comparación con $A^t$: si la matriz es simétrica, $A^t = A$.'
        });

        h += S.kvs([
          'orden ' + K(String(n)),
          cumple ? S.badge(anti ? 'es antisimétrica' : 'es simétrica', 'si')
            : S.badge(anti ? 'no es antisimétrica' : 'no es simétrica', 'no'),
          'pares comparados: ' + K(String(pares.length)),
          fallos.length ? S.badge(fallos.length + (fallos.length === 1 ? ' par falla' : ' pares fallan'), 'no')
            : S.badge('todos los pares cuadran', 'si')
        ]);

        h += S.tabla(['Par de posiciones', 'Valores', anti ? '¿Son opuestos?' : '¿Son iguales?'],
          pares.map(function (p) {
            return {
              clase: p.bien ? 'ap-ok-row' : '',
              celdas: [
                K('(a_{' + (p.i + 1) + (p.j + 1) + '},\\ a_{' + (p.j + 1) + (p.i + 1) + '})'),
                K(FT(p.x) + ' \\quad\\text{y}\\quad ' + FT(p.y)),
                p.bien ? S.badge('sí', 'si')
                  : S.badge('no: debería ser ' + (anti ? FT(p.x.opuesto()) : FT(p.x)), 'no')
              ]
            };
          }), { thPrimera: false });

        if (anti) {
          h += (diagMal.length
            ? tarjeta('Diagonal principal', '<p>' + S.badge('mal', 'no') +
              ' En una matriz antisimétrica todos los elementos de la diagonal deben ser cero, ' +
              'y aquí no lo son: ' + diagMal.map(function (k) {
                return '$a_{' + (k + 1) + (k + 1) + '} = ' + FT(A.a[k][k]) + '$';
              }).join(', ') + '.</p>', 'ap-card-ko')
            : tarjeta('Diagonal principal', '<p>' + S.badge('correcta', 'si') +
              ' Todos los elementos de la diagonal son cero, como exige la antisimetría: de ' +
              '$a_{ii} = -a_{ii}$ se deduce $a_{ii} = 0$.</p>', 'ap-card-ok'));
        }

        h += rejilla2([
          tarjeta('Matriz A', S.expr('', 'A = ' + S.matTex(A), false)),
          tarjeta(anti ? 'Su transpuesta y su opuesta' : 'Su transpuesta',
            S.expr('', 'A^t = ' + S.matTex(S.matTrans(A)), false) +
            (anti ? S.expr('', '-A = ' + S.matTex(S.opuesta(A)), false) : ''))
        ]);

        h += '<p>' + (anti ? cl.razones.antisimetrica : cl.razones.simetrica) + '</p>';
        h += nota(anti
          ? 'Una matriz antisimétrica tiene siempre traza cero, porque su diagonal es de ceros.'
          : 'Cualquier matriz diagonal es simétrica: si todo lo que hay fuera de la diagonal es cero, ' +
            'el reflejo de un cero es otro cero.');
        return h;
      }));
  };

  /* ==================================================================
     9 · descomponSim · A = S + H
     ================================================================== */
  R.descomponSim = function (node) {
return S.shell(node, 'Toda matriz cuadrada es suma de una simétrica y una antisimétrica',
      'Escribe una matriz <b>cuadrada</b> por filas, separando las filas con <code>;</code>: ' +
      '<code>1 2 3; 4 5 6; 7 8 9</code> (se admiten fracciones, <code>1/2 3; 0 -2</code>). ' +
      'El applet calcula la <b>parte simétrica</b> $S = \\tfrac12(A + A^t)$ y la <b>parte ' +
      'antisimétrica</b> $H = \\tfrac12(A - A^t)$, comprueba que $A = S + H$ y verifica que $S$ es ' +
      'simétrica y $H$ antisimétrica. Con los deslizadores <b>i</b> y <b>j</b> (o pulsando una celda) ' +
      'puedes ver la comprobación en una posición concreta.',
      [
        { id: 'txt', label: 'Matriz A', type: 'text', value: '1 2 3; 4 5 6; 7 8 9', ancho: '18rem' },
        { id: 'i', label: 'Fila i', type: 'range', min: 1, max: 5, value: 1 },
        { id: 'j', label: 'Columna j', type: 'range', min: 1, max: 5, value: 2 },
        { id: 'pasos', label: 'Ver los pasos', type: 'check', value: true },
        { id: 'azar', label: 'Matriz al azar', type: 'button', click: function (ctl) {
          var n = 3;
          try {
            var A0 = S.parseMat(String(ctl.txt.value || '1 2; 3 4'));
            n = Math.min(Math.max(A0.f, 2), 4);
          } catch (e) { n = 3; }
          pon(ctl, { txt: S.matTxt(S.matAleatoria(n, n, { min: -5, max: 8 })) });
        } },
        escenarios([
          { txt: 'clásica 3×3', tit: 'La matriz de los nueve primeros números', set: { txt: '1 2 3; 4 5 6; 7 8 9', i: 1, j: 2, pasos: true } },
          { txt: 'orden 2', set: { txt: '1 2; 3 4', i: 1, j: 2, pasos: true } },
          { txt: 'ya es simétrica', tit: 'Entonces H es la matriz nula', set: { txt: '1 2 3; 2 0 -1; 3 -1 4', i: 1, j: 3, pasos: true } },
          { txt: 'ya es antisimétrica', tit: 'Entonces S es la matriz nula', set: { txt: '0 2 -3; -2 0 5; 3 -5 0', i: 1, j: 2, pasos: true } },
          { txt: 'aparecen fracciones', tit: 'Las medias no siempre son enteras', set: { txt: '0 1; 0 0', i: 1, j: 2, pasos: true } },
          { txt: 'orden 4', set: { txt: '1 2 3 4; 0 1 2 3; 0 0 1 2; 0 0 0 1', i: 2, j: 4, pasos: false } },
          { txt: 'con fracciones', set: { txt: '1/2 3; -2 5/3', i: 1, j: 2, pasos: true } }
        ])
      ],
      guarda(function (v, ctl, out, api) {
        var A = leeMat(v.txt, 'la matriz A', { max: 5, cuadrada: true });
        var n = A.f;
        var D = S.descomponSim(A);
        var i = ent(v.i, 1, 5, 1), j = ent(v.j, 1, 5, 1);
        if (i > n) i = n;
        if (j > n) j = n;

        var h = enun('Toda matriz cuadrada se puede escribir, y de una sola manera, como suma de una ' +
          'matriz <b>simétrica</b> y una matriz <b>antisimétrica</b>: ' + K('A = S + H') + '.');

        h += figuraMats([
          { A: A, nombre: 'A', rot: true, pulsable: true, sub: 'matriz de partida',
            marcas: [{ i: i - 1, j: j - 1, col: COL.rojo }] },
          { A: D.S, nombre: 'S (simétrica)', op: '=', rot: false, pulsable: false,
            sub: 'S = (A + At) / 2', marcas: [{ i: i - 1, j: j - 1, col: COL.rojo }] },
          { A: D.H, nombre: 'H (antisimétrica)', op: '+', rot: false, pulsable: false,
            sub: 'H = (A − At) / 2', marcas: [{ i: i - 1, j: j - 1, col: COL.rojo }] }
        ], {
          titulo: 'Descomposición A = S + H',
          subtitulo: 'la celda marcada cumple a' + i + j + ' = s' + i + j + ' + h' + i + j,
          cw: 96,
          pie: llano(A.a[i - 1][j - 1]) + ' = ' +
            S.sumandosTxt([llano(D.S.a[i - 1][j - 1]), llano(D.H.a[i - 1][j - 1])]),
          label: 'Una matriz y sus partes simétrica y antisimétrica',
          cap: 'Comprobación en la posición marcada: $a_{' + i + j + '} = ' + FT(A.a[i - 1][j - 1]) +
            ' = ' + S.sumandosTex([FT(D.S.a[i - 1][j - 1]), FT(D.H.a[i - 1][j - 1])]) + '$.'
        });
        celdasPulsables(api, 'i', 'j');

        if (v.pasos) {
          D.pasos.forEach(function (p, k) {
            h += S.paso(k + 1, p.desc + (p.tex ? KD(p.tex) : ''),
              k === D.pasos.length - 1 ? 'ap-paso-clave' : '');
          });
        } else {
          h += rejilla2([
            tarjeta('Parte simétrica', S.expr('', 'S = ' + S.matTex(D.S), false)),
            tarjeta('Parte antisimétrica', S.expr('', 'H = ' + S.matTex(D.H), false))
          ]);
        }

        h += S.kvs([
          D.simetricaOk ? S.badge('S es simétrica', 'si') : S.badge('S no es simétrica', 'no'),
          D.antisimetricaOk ? S.badge('H es antisimétrica', 'si') : S.badge('H no es antisimétrica', 'no'),
          D.sumaOk ? S.badge('S + H = A', 'si') : S.badge('S + H ≠ A', 'no'),
          'traza de A: ' + K('\\operatorname{tr}(A) = ' + FT(S.traza(A)))
        ]);

        /* comprobación posición a posición */
        var filas = [], p, q;
        for (p = 0; p < n; p++) {
          for (q = 0; q < n; q++) {
            filas.push({
              clase: (p === i - 1 && q === j - 1) ? 'ap-hi' : '',
              celdas: [
                K('a_{' + (p + 1) + (q + 1) + '}'),
                K(S.sumandosTex([FT(D.S.a[p][q]), FT(D.H.a[p][q])])),
                K(FT(A.a[p][q]))
              ]
            });
          }
        }
        h += S.tabla(['Posición', 's_ij + h_ij', 'a_ij'], filas, { thPrimera: false });

        h += rejilla2([
          tarjeta('¿Por qué S es simétrica?',
            '<p>Porque $S^t = \\tfrac12 (A + A^t)^t = \\tfrac12 (A^t + A) = S$: al transponer una suma ' +
            'se transponen los sumandos, y la suma no cambia de orden.</p>' +
            S.expr('', 'S^t = ' + S.matTex(S.matTrans(D.S)) + ' = S', false), 'ap-card-ok'),
          tarjeta('¿Por qué H es antisimétrica?',
            '<p>Porque $H^t = \\tfrac12 (A - A^t)^t = \\tfrac12 (A^t - A) = -H$: al transponer, la resta ' +
            'cambia de orden y aparece el signo menos.</p>' +
            S.expr('', 'H^t = ' + S.matTex(S.matTrans(D.H)) + ' = -H', false), 'ap-card-ok')
        ]);

        var cl = S.clasifica(A);
        if (cl.simetrica) h += nota('Como $A$ ya era simétrica, su parte antisimétrica es la <b>matriz nula</b>: ' +
          '$H = 0$ y $S = A$.');
        if (cl.antisimetrica) h += nota('Como $A$ ya era antisimétrica, su parte simétrica es la <b>matriz nula</b>: ' +
          '$S = 0$ y $H = A$.');
        h += nota('Esta descomposición es <b>única</b>: si $A = S\' + H\'$ con $S\'$ simétrica y $H\'$ ' +
          'antisimétrica, al transponer se obtiene $A^t = S\' - H\'$, y sumando y restando las dos ' +
          'igualdades salen exactamente $S\' = \\tfrac12(A + A^t)$ y $H\' = \\tfrac12(A - A^t)$.');
        return h;
      }));
  };

  /* ==================================================================
     cierre del módulo
     ================================================================== */
  S.extraA = true;
  if (S.monta) S.monta();
})();
