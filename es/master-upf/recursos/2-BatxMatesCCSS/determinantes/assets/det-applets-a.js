/* =====================================================================
   det-applets-a.js · Módulo A del Tema 2 «Determinantes»
   2.º de Bachillerato · Matemáticas Aplicadas a las Ciencias Sociales
   Ruta: 2-BatxMatesCCSS/determinantes/assets/det-applets-a.js

   Applets de los archivos 01 «Determinantes» y 02 «Determinantes de
   orden 2 y 3». Se carga DESPUÉS del núcleo det-applets.js (window.DET),
   de la capa de álgebra matricial det-applets-alg.js y de la capa propia
   del tema det-applets-det.js, de la que toma TODO el motor exacto:
   lectura de matrices, determinante, regla de Sarrus, polinomio del
   determinante con parámetro y resolución de la ecuación det = valor.
   Aquí no se calcula álgebra «a mano»: este módulo orquesta, explica y
   dibuja.

   ---------------------------------------------------------------------
   ÍNDICE DEL MÓDULO
   ---------------------------------------------------------------------
     0 · utilidades locales (avisos, escenarios, maquetación, lectura)
     1 · figuras: matrices y determinantes grandes en un mismo SVG
         (celdas de 26 px, rótulos de 18 a 24 px en negrita, lienzo de
          720 px de ancho como mínimo) y unos ejes con escala uniforme
     2 · queEs        · Qué es un determinante
     3 · orden1       · Determinante de orden 1
     4 · orden2       · Determinante de orden 2 (diagonales y área)
     5 · sarrus       · Regla de Sarrus
     6 · ecuacionDet  · Ecuaciones con la incógnita dentro del determinante
     7 · areaDet      · Área de un triángulo por determinantes

   ---------------------------------------------------------------------
   Applets registrados
   ---------------------------------------------------------------------

   queEs         El alumno escribe una matriz cualquiera. El applet dice
                 si es cuadrada —y por tanto si tiene determinante— y, si
                 lo es, da el número asociado. Para los órdenes 1, 2 y 3
                 lista TODOS los productos de n elementos tomando uno de
                 cada fila y uno de cada columna, la mitad con signo + y
                 la otra mitad con −, y muestra que hay n! sumandos. Un
                 deslizador destaca un producto concreto en la figura.

   orden1        Deslizador con el valor de a. Muestra |a| = a y el aviso
                 destacado de que esas barras NO son un valor absoluto:
                 como determinante |−5| = −5, no 5.

   orden2        Matriz 2×2 editable. Modo «diagonales»: las dos
                 diagonales resaltadas en verde y en rojo sobre un SVG
                 grande, el producto de cada una y la resta final. Modo
                 «área»: el determinante como área con signo del
                 paralelogramo que forman los dos vectores fila.

   sarrus        Matriz 3×3 editable. Usa DET.sarrus(A). Dibuja la matriz
                 con sus dos primeras columnas repetidas al lado, traza
                 las tres diagonales descendentes en verde y las tres
                 ascendentes en rojo, etiqueta el producto de cada una,
                 y debajo escribe la suma completa término a término.
                 Un botón recorre las seis diagonales de una en una.

   ecuacionDet   Matriz 2×2 o 3×3 cuyas entradas pueden llevar x. Plantea
                 det = 0 (o = un valor dado), desarrolla el polinomio con
                 DET.polDeMatriz, resuelve y comprueba cada solución
                 sustituyéndola en la matriz.

   areaDet       Tres puntos editables por coordenadas. Dibuja el
                 triángulo sobre unos ejes y calcula su área con la
                 fórmula del medio determinante de orden 3 con la columna
                 de unos. Muestra el determinante, su valor absoluto y el
                 área, y explica por qué el signo indica la orientación.

   ---------------------------------------------------------------------
   Convenios internos
   ---------------------------------------------------------------------
   · Toda la aritmética es exacta (S.Frac con BigInt). La coma flotante
     solo aparece al pasar a píxeles dentro de las figuras.
   · Cada compute va envuelto en guarda(): cualquier Error de las capas
     de álgebra se muestra como un aviso explicativo en castellano y
     nunca rompe la página. Los avisos no se acumulan: el armazón
     reescribe la salida entera en cada recálculo.
   · Dentro de un <svg> NO hay KaTeX: todos los rótulos van en texto
     llano con S.textoPlano y S.numTxtDet (coma decimal, signo menos
     U+2212, subíndices ₁₂₃, punto de producto ·).
   · Los índices que ve el alumno son SIEMPRE base 1.
   · Nunca se escribe «+ −3»: se escribe «+ (−3)» (S.parTxtDet,
     S.sumandosTxt, S.sumandosTex).
   · Los títulos no se numeran: el armazón escribe «Applet · …».

   Sin OJS, sin CDN, sin dependencias externas. ES5 (var/function) salvo
   BigInt, que ya usa el núcleo.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.DET;
  if (!S) {
    if (window.console && console.error) {
      console.error('[determinantes] det-applets-a.js necesita det-applets.js cargado antes.');
    }
    return;
  }
  if (!S.parseMat || !S.det) {
    if (window.console && console.error) {
      console.error('[determinantes] det-applets-a.js necesita det-applets-alg.js cargado antes.');
    }
    return;
  }
  if (!S.sarrus || !S.polDeMatriz) {
    if (window.console && console.error) {
      console.error('[determinantes] det-applets-a.js necesita det-applets-det.js cargado antes.');
    }
    return;
  }

  var R = S.registry, K = S.K, esc = S.esc, COL = S.COL;
  var F = S.fracDe;                       /* número / texto / Frac -> Frac */
  var FT = function (f) { return S.fracTex(f, true); };  /* \frac en línea  */
  var TP = S.textoPlano;                  /* rótulos llanos para los <text> */
  var NT = S.numTxtDet;                   /* número llano: −7, −0,5, 1/3    */
  var PT = S.parTxtDet;                   /* sumando llano: (−3)            */

  var MAXDIM = 5;                         /* tope de filas y de columnas    */

  /* ==================================================================
     0 · utilidades locales
     ================================================================== */

  var CERO = F(0);

  function cero(f) { return f.cmp(CERO) === 0; }
  function neg(f) { return f.cmp(CERO) < 0; }
  function abs(f) { return neg(f) ? f.opuesto() : f; }

  var SUBS = ['\u2080', '\u2081', '\u2082', '\u2083', '\u2084',
    '\u2085', '\u2086', '\u2087', '\u2088', '\u2089'];
  function sub(n) {
    var s = String(n), out = '', k;
    for (k = 0; k < s.length; k++) out += SUBS[Number(s.charAt(k))] || s.charAt(k);
    return out;
  }
  /* nombre llano del elemento, SIEMPRE en base 1: a₂₃ */
  function aij(i1, j1) { return 'a' + sub(i1) + sub(j1); }
  function aijTex(i1, j1) { return 'a_{' + i1 + j1 + '}'; }

  function avisoHTML(e) {
    var m = (e && e.message) ? e.message : String(e);
    return '<div class="mx-bad ap-err">' + esc(m).replace(/\n/g, '<br>') + '</div>';
  }
  /* Envoltorio único de todos los compute: ni una excepción sin capturar. */
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

  /* Piezas de maquetación comunes al tema. */
  function tarjeta(titulo, html, clase) {
    return '<div class="ap-card ' + (clase || '') + '">' +
      '<div class="ap-card-tit">' + esc(titulo) + '</div>' + html + '</div>';
  }
  function rejilla2(cartas) { return '<div class="ap-grid2">' + cartas.join('') + '</div>'; }
  function rejilla3(cartas) { return '<div class="ap-grid3">' + cartas.join('') + '</div>'; }
  function nota(html) { return '<p class="ap-note">' + html + '</p>'; }
  function enun(html) { return '<div class="ap-enun">' + html + '</div>'; }
  function avisoSuave(html) { return '<p class="ap-note deta-avi">' + html + '</p>'; }

  /* Texto compartido: cómo se escribe una matriz. */
  var COMO_MAT =
    'Escribe la matriz <b>por filas</b>: los elementos de una fila separados por espacios y las ' +
    'filas separadas por <code>;</code> o por saltos de línea. Por ejemplo <code>1 2 3; 4 5 6</code> ' +
    'es una matriz de dimensión 2×3. Se admiten enteros (<code>-2</code>), decimales con coma ' +
    '(<code>0,5</code>) y fracciones (<code>1/2</code>). Todas las filas deben tener el mismo ' +
    'número de elementos.';

  var COMO_NUM =
    'Los números se escriben como entero (<code>3</code>, <code>-2</code>), decimal con coma ' +
    '(<code>0,5</code>) o fracción (<code>3/4</code>).';

  function pista() {
    return 'Escribe los elementos de cada fila separados por espacios y las filas separadas ' +
      'por «;», por ejemplo 1 2 3; 4 5 6.';
  }

  /* Lectura de una matriz con tope de tamaño para que quepa en la figura. */
  function leeMat(txt, nombre, opts) {
    opts = opts || {};
    nombre = nombre || 'la matriz';
    var t = String(txt === undefined || txt === null ? '' : txt).trim();
    if (t === '') throw Error('Falta ' + nombre + '. ' + pista());
    var A = S.parseMat(t);
    if (opts.orden && (A.f !== opts.orden || A.c !== opts.orden)) {
      throw Error('Aquí hace falta una matriz de orden ' + opts.orden + ' (es decir, de ' +
        opts.orden + '×' + opts.orden + ') y ' + nombre + ' es de ' + A.f + '×' + A.c + '. ' +
        (opts.orden === 3 ? 'Escribe por ejemplo 1 2 3; 4 5 6; 7 8 10.' : 'Escribe por ejemplo 3 1; 2 4.'));
    }
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
    if (opts.orden && A.f !== opts.orden) {
      throw Error('Aquí hace falta una matriz de orden ' + opts.orden + ' (es decir, de ' +
        opts.orden + '×' + opts.orden + ') y ' + nombre + ' es de ' + A.f + '×' + A.c + '. ' +
        (opts.orden === 3 ? 'Escribe por ejemplo 1 2 3; 4 5 6; 7 8 10.' : 'Escribe por ejemplo 3 1; 2 4.'));
    }
    return A;
  }

  /* Lectura de un número suelto con mensaje propio. */
  function leeNum(txt, nombre) {
    var t = String(txt === undefined || txt === null ? '' : txt).trim();
    if (t === '') throw Error('Falta ' + nombre + '. ' + COMO_NUM.replace(/<[^>]*>/g, ''));
    return F(t);
  }

  /* Entero de un control, siempre dentro de un intervalo. */
  function ent(v, min, max, def) {
    var n = parseInt(String(v), 10);
    if (!isFinite(n)) n = def;
    if (n < min) n = min;
    if (n > max) n = max;
    return n;
  }

  /* factorial pequeño, como texto */
  function fact(n) { var r = 1, k; for (k = 2; k <= n; k++) r *= k; return r; }

  /* Número corriente escrito en la prosa con la coma decimal española:
     6 -> «6», 0,5 -> «0,5». Nunca deja un punto decimal a la vista. */
  function numCom(x) {
    var t = String(x);
    if (t.indexOf('e') >= 0 || t.indexOf('E') >= 0) t = Number(x).toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
    return t.replace('.', ',').replace(/^-/, '\u2212');
  }

  /* ¿Es este trozo de texto un número admitido (entero, decimal con coma o
     con punto, o fracción)? Sirve para avisar de que «hola» no es una
     coordenada ANTES de contar cuántas coordenadas hay. */
  function esNumTxt(t) {
    var s = String(t === undefined || t === null ? '' : t).trim().replace(/^\+/, '');
    return /^[-\u2212]?(?:\d+(?:[.,]\d+)?|[.,]\d+)(?:\s*\/\s*[-\u2212]?\d+(?:[.,]\d+)?)?$/.test(s);
  }
  /* Lista, entre comillas, los trozos que no son números. */
  function noNumeros(trozos) {
    return trozos.filter(function (t) { return !esNumTxt(t); });
  }

  /* ==================================================================
     1 · figuras
     ------------------------------------------------------------------
     figuraDet(bloques, o)

     bloques = [{ f, c, celda(i,j) -> texto llano, nombre, op,
                  barras:true (|…| de determinante) o false (corchetes),
                  filaHi:[i…], colHi:[j…], marcas:[{i,j,col,fondo,grosor}],
                  colorCelda(i,j), rot:true }]

     o = { titulo, subtitulo, pie, lineas:[{txt,col,size}], dibujo(g),
           cw, ch, W, label, cap }

     · dibujo(g) recibe la geometría del PRIMER bloque
       ({x0, y0, cw, ch, w, h, X(j), Y(i)}) y devuelve el SVG que se
       pinta DEBAJO del texto de las celdas (diagonales, sombreados…).
     · Dentro del SVG NUNCA se escribe LaTeX: todo pasa por TP().
     ================================================================== */
  var HI_FILA = 'rgba(25,118,210,.15)';
  var HI_COL = 'rgba(224,123,0,.15)';

  /* Ancho aproximado de un rótulo, con el mismo modelo que usa el arnés
     de comprobación: 0,56 em por carácter. */
  function anchoRot(texto, size) {
    return Math.max(12, String(texto).length * size * 0.56);
  }
  /* Caja aproximada de un rótulo centrado/alineado, para evitar solapes. */
  function cajaRot(t) {
    var w = anchoRot(t.txt, t.size), h = t.size * 1.12;
    var x0 = t.anchor === 'end' ? t.x - w : (t.anchor === 'middle' ? t.x - w / 2 : t.x);
    return { x0: x0, x1: x0 + w, y0: t.y - t.size * 0.82, y1: t.y - t.size * 0.82 + h };
  }
  /* Halo blanco alrededor de un <text> ya generado: el trazo se pinta ANTES
     del relleno (paint-order="stroke"), así que ninguna línea gruesa que
     pase por debajo puede llegar a partir el dígito. */
  function halo(svgTexto, grosor) {
    return String(svgTexto).replace(/<text /g,
      '<text paint-order="stroke" stroke="#ffffff" stroke-width="' +
      (grosor === undefined ? 4 : grosor) + '" stroke-linejoin="round" ');
  }

  function chocanCajas(A, B, m) {
    m = m === undefined ? 3 : m;
    return A.x0 < B.x1 - m && B.x0 < A.x1 - m && A.y0 < B.y1 - m && B.y0 < A.y1 - m;
  }

  function anchoTextoMax(bloques) {
    var m = 1;
    bloques.forEach(function (b) {
      var i, j, t;
      for (i = 0; i < b.f; i++) {
        for (j = 0; j < b.c; j++) {
          t = String(b.celda(i, j));
          if (t.length > m) m = t.length;
        }
      }
    });
    return m;
  }

  function figuraDet(bloques, o) {
    o = o || {};
    var maxLen = anchoTextoMax(bloques);
    var cw = Math.max(o.cw || 106, maxLen * 16 + 30);
    var ch = o.ch || 82;
    var izq = o.izq === undefined ? 118 : o.izq;
    var arriba = o.arriba === undefined ? 156 : o.arriba;
    var maxF = 1, i, j;
    bloques.forEach(function (b) { if (b.f > maxF) maxF = b.f; });
    var altoMat = maxF * ch;

    var fondoSvg = '', textos = '', x = izq;
    var centroY = arriba + altoMat / 2;
    var xDer = null, geo = null;
    var HUECO = 22;

    bloques.forEach(function (b) {
      if (b.op) {
        if (xDer !== null) x = Math.max(x, xDer + HUECO);
        textos += S.txt(x + 24, centroY + 12, TP(b.op),
          { size: 32, weight: '700', fill: COL.eje });
        xDer = x + 24 + 22;
        x += 74;
      }
      var huecoIzq = HUECO + 30 + (b.rot ? 46 : 0);
      if (xDer !== null) x = Math.max(x, xDer + huecoIzq);
      var m = b.f, n = b.c;
      var y0 = arriba + (maxF - m) * ch / 2;
      var w = n * cw, h = m * ch;

      fondoSvg += S.rect(x - 4, y0 - 6, w + 8, h + 12, '#fff', '#e3e9ef', { r: 10, sw: 1.4 });
      if (b.barras) {
        /* barras verticales del determinante */
        fondoSvg += S.line(x - 18, y0 - 8, x - 18, y0 + h + 8, COL.azulOsc, 4.5);
        fondoSvg += S.line(x + w + 18, y0 - 8, x + w + 18, y0 + h + 8, COL.azulOsc, 4.5);
      } else {
        fondoSvg += S.path('M ' + (x - 14) + ' ' + (y0 - 8) + ' L ' + (x - 28) + ' ' + (y0 - 8) +
          ' L ' + (x - 28) + ' ' + (y0 + h + 8) + ' L ' + (x - 14) + ' ' + (y0 + h + 8),
          COL.azulOsc, 4);
        fondoSvg += S.path('M ' + (x + w + 14) + ' ' + (y0 - 8) + ' L ' + (x + w + 28) + ' ' + (y0 - 8) +
          ' L ' + (x + w + 28) + ' ' + (y0 + h + 8) + ' L ' + (x + w + 14) + ' ' + (y0 + h + 8),
          COL.azulOsc, 4);
      }

      (b.filaHi || []).forEach(function (fi) {
        if (fi < 0 || fi >= m) return;
        fondoSvg += S.rect(x, y0 + fi * ch, w, ch, HI_FILA, 'none', { r: 6 });
      });
      (b.colHi || []).forEach(function (cj) {
        if (cj < 0 || cj >= n) return;
        fondoSvg += S.rect(x + cj * cw, y0, cw, h, HI_COL, 'none', { r: 6 });
      });
      (b.marcas || []).forEach(function (mk) {
        if (mk.i < 0 || mk.i >= m || mk.j < 0 || mk.j >= n) return;
        fondoSvg += S.rect(x + mk.j * cw + 7, y0 + mk.i * ch + 7, cw - 14, ch - 14,
          mk.fondo || 'none', mk.col || COL.rojo, { r: 8, sw: mk.grosor || 3 });
      });

      if (b.nombre) {
        textos += S.txt(x - 20, arriba - 46, TP(b.nombre),
          { size: 23, weight: '700', fill: COL.azulOsc, anchor: 'start' });
      }
      if (b.rot) {
        for (j = 0; j < n; j++) {
          textos += S.txt(x + j * cw + cw / 2, arriba - 18, 'C' + (j + 1),
            { size: 18, weight: '700', fill: COL.naranja });
        }
        for (i = 0; i < m; i++) {
          textos += S.txt(x - 42, y0 + i * ch + ch / 2 + 7, 'F' + (i + 1),
            { size: 18, weight: '700', fill: COL.azul, anchor: 'end' });
        }
      }

      if (!geo) {
        /* Se congelan las coordenadas de este bloque: la variable x sigue
           avanzando en el bucle y una clausura sobre ella daría posiciones
           equivocadas al dibujar encima de la matriz. */
        var gx = x, gy = y0;
        geo = {
          x0: gx, y0: gy, cw: cw, ch: ch, w: w, h: h, f: m, c: n,
          X: function (jj) { return gx + jj * cw + cw / 2; },
          Y: function (ii) { return gy + ii * ch + ch / 2; }
        };
      }

      for (i = 0; i < m; i++) {
        for (j = 0; j < n; j++) {
          var t = String(b.celda(i, j));
          var col = (b.colorCelda && b.colorCelda(i, j)) || COL.texto;
          textos += halo(S.txt(x + j * cw + cw / 2, y0 + i * ch + ch / 2 + 10, TP(t),
            { size: 26, weight: '700', fill: col }), 4.5);
        }
      }
      if (b.sub) {
        textos += S.txt(x + w / 2, arriba + altoMat + 48, TP(b.sub),
          { size: 20, weight: '700', fill: COL.gris });
      }
      xDer = x + w + 30;
      x += w + 36;
    });

    var medio = '';
    if (o.dibujo && geo) medio = o.dibujo(geo) || '';

    /* rótulos sueltos añadidos por el applet (ya en texto llano) */
    var sueltos = '';
    (o.rotulos || []).forEach(function (r) {
      sueltos += S.txt(r.x, r.y, TP(r.txt), {
        size: r.size || 20, weight: '700', fill: r.col || COL.texto,
        anchor: r.anchor || 'middle'
      });
    });

    /* Ancho: el que pidan los bloques o el que pidan las líneas de texto
       que van debajo, lo que sea mayor, y nunca menos de 720. */
    var anchoLineas = 0;
    (o.lineas || []).forEach(function (L) {
      var sz = L.size || 20;
      var an = String(L.txt).length * sz * 0.56;
      if (an > anchoLineas) anchoLineas = an;
    });
    var anchoCab = 0;
    if (o.titulo) anchoCab = Math.max(anchoCab, anchoRot(TP(o.titulo), 24));
    if (o.subtitulo) anchoCab = Math.max(anchoCab, anchoRot(TP(o.subtitulo), 19));
    if (o.pie) anchoCab = Math.max(anchoCab, anchoRot(TP(o.pie), 20));
    var W = Math.max(o.W || 720, Math.round(x + 46), Math.round(izq + anchoLineas + 60),
      Math.round(anchoCab + 56));

    var cab = '';
    if (o.titulo) cab += S.txt(W / 2, 44, TP(o.titulo), { size: 24, weight: '700', fill: COL.azulOsc });
    if (o.subtitulo) cab += S.txt(W / 2, 74, TP(o.subtitulo), { size: 19, weight: '700', fill: COL.gris });

    var cuerpo = cab + fondoSvg + medio + textos + sueltos;

    /* Las líneas de texto van debajo de todo lo dibujado. */
    var medir = S.altoDibujado || function () { return 0; };
    var base = medir(cuerpo);
    if (!(base > 0)) base = arriba + altoMat;
    var lineas = '';
    (o.lineas || []).forEach(function (L, idx) {
      var sz = L.size || 20;
      var y = Math.round(base + 42 + idx * (sz + 18));
      lineas += S.txt(izq, y, TP(L.txt),
        { size: sz, weight: '700', fill: L.col || COL.texto, anchor: 'start' });
    });
    var fondo = medir(cuerpo + lineas);
    if (!(fondo > 0)) fondo = base;

    var pie = '';
    if (o.pie) {
      var yPie = Math.round(fondo + 42);
      pie += S.txt(W / 2, yPie, TP(o.pie), { size: 20, weight: '700', fill: COL.eje });
      fondo = yPie + Math.ceil(20 * 0.32);
    }
    var H = Math.round(fondo + 24);
    return S.svgWrap(cuerpo + lineas + pie, W, H, o.label || 'Determinante', o.cap);
  }

  /* Figura de una sola matriz o de un solo determinante. */
  function figuraUna(A, o) {
    o = o || {};
    var b = {
      f: A.f, c: A.c,
      celda: o.celda || function (i, j) { return NT(A.a[i][j]); },
      nombre: o.nombre, rot: o.rot !== false, barras: !!o.barras,
      filaHi: o.filaHi, colHi: o.colHi, marcas: o.marcas, colorCelda: o.colorCelda,
      sub: o.sub
    };
    return figuraDet([b], o);
  }

  /* ------------------------------------------------------------------
     figEjes(o) · unos ejes con escala uniforme en los dos sentidos, sin
     una sola fórmula de KaTeX: todos los rótulos son <text> llanos y en
     negrita. o = { xmin, xmax, ymin, ymax, titulo, subtitulo,
     poligonos:[{pts,fill,stroke,sw,dash}], flechas:[{a,b,col,txt,tcol}],
     puntos:[{x,y,col,txt}], pie, label, cap }
     ------------------------------------------------------------------ */
  function figEjes(o) {
    var anchoCab2 = 0;
    if (o.titulo) anchoCab2 = Math.max(anchoCab2, anchoRot(TP(o.titulo), 24));
    if (o.subtitulo) anchoCab2 = Math.max(anchoCab2, anchoRot(TP(o.subtitulo), 19));
    if (o.pie) anchoCab2 = Math.max(anchoCab2, anchoRot(TP(o.pie), 20));
    var W = Math.max(o.W || 760, Math.round(anchoCab2 + 56)), H = o.H || 560;
    var mIzq = 74, mDer = 58, yTop = 112, yBot = H - 46;
    var xmin = o.xmin, xmax = o.xmax, ymin = o.ymin, ymax = o.ymax;
    if (!(xmax > xmin)) { xmin -= 1; xmax += 1; }
    if (!(ymax > ymin)) { ymin -= 1; ymax += 1; }
    var s = Math.min((W - mIzq - mDer) / (xmax - xmin), (yBot - yTop) / (ymax - ymin));
    var cx = (xmin + xmax) / 2, cy = (ymin + ymax) / 2;
    var px = (mIzq + W - mDer) / 2, py = (yTop + yBot) / 2;
    function X(v) { return px + (v - cx) * s; }
    function Y(v) { return py - (v - cy) * s; }

    var b = S.rect(mIzq, yTop, W - mIzq - mDer, yBot - yTop, '#fff', '#e3e9ef', { r: 6 });

    /* paso de la rejilla: ni demasiadas marcas ni demasiado pocas */
    function pasoBueno(rango, pix) {
      var bruto = rango / Math.max(2, Math.floor(pix / 82));
      var pot = Math.pow(10, Math.floor(Math.log(bruto) / Math.LN10));
      var cand = [1, 2, 5, 10], k;
      for (k = 0; k < cand.length; k++) if (cand[k] * pot >= bruto) return cand[k] * pot;
      return 10 * pot;
    }
    var pasoX = pasoBueno(xmax - xmin, W - mIzq - mDer);
    var pasoY = pasoBueno(ymax - ymin, yBot - yTop);
    var paso = Math.max(pasoX, pasoY);           /* misma escala, mismo paso */
    if (!(paso > 0)) paso = 1;

    var v, ejeY = Math.min(Math.max(X(0), mIzq), W - mDer);
    var ejeX = Math.min(Math.max(Y(0), yTop), yBot);
    var marcas = [];
    for (v = Math.ceil(xmin / paso) * paso; v <= xmax + 1e-9; v += paso) {
      if (X(v) < mIzq - 1 || X(v) > W - mDer + 1) continue;
      b += S.line(X(v), yTop, X(v), yBot, COL.guia, 1);
      if (Math.abs(v) > 1e-9) marcas.push({ x: X(v), y: ejeX + 30, t: NT(F(redondea(v))), anchor: 'middle', tick: true });
    }
    for (v = Math.ceil(ymin / paso) * paso; v <= ymax + 1e-9; v += paso) {
      if (Y(v) < yTop - 1 || Y(v) > yBot + 1) continue;
      b += S.line(mIzq, Y(v), W - mDer, Y(v), COL.guia, 1);
      if (Math.abs(v) > 1e-9) marcas.push({ x: ejeY - 14, y: Y(v) + 7, t: NT(F(redondea(v))), anchor: 'end', tick: true });
    }
    b += S.line(mIzq, ejeX, W - mDer, ejeX, COL.eje, 2.4);
    b += S.line(ejeY, yTop, ejeY, yBot, COL.eje, 2.4);

    /* polígonos (el triángulo o el paralelogramo) */
    (o.poligonos || []).forEach(function (p) {
      var pts = p.pts.map(function (q) { return [X(q[0]).toFixed(1), Y(q[1]).toFixed(1)]; });
      b += S.poly(pts, p.fill || 'rgba(25,118,210,.16)', p.stroke || COL.azul, p.sw || 3);
    });
    /* flechas (los vectores fila) */
    var defs = '';
    (o.flechas || []).forEach(function (fl, idx) {
      var x1 = X(fl.a[0]), y1 = Y(fl.a[1]), x2 = X(fl.b[0]), y2 = Y(fl.b[1]);
      b += S.line(x1, y1, x2, y2, fl.col || COL.azul, fl.w || 4);
      var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / L, uy = dy / L, k = 16;
      b += S.poly([
        [x2.toFixed(1), y2.toFixed(1)],
        [(x2 - k * ux + k * 0.45 * uy).toFixed(1), (y2 - k * uy - k * 0.45 * ux).toFixed(1)],
        [(x2 - k * ux - k * 0.45 * uy).toFixed(1), (y2 - k * uy + k * 0.45 * ux).toFixed(1)]
      ], fl.col || COL.azul, 'none', 1);
      if (fl.txt) {
        marcas.push({
          x: x2 + (ux >= 0 ? 26 : -26), y: y2 + (uy >= 0 ? 26 : -14),
          t: fl.txt, anchor: 'middle', col: fl.col || COL.azul, size: 22
        });
      }
      defs += String(idx);
    });
    /* puntos con su etiqueta corta */
    (o.puntos || []).forEach(function (p) {
      b += S.circle(X(p.x), Y(p.y), 8, p.col || COL.rojo, '#fff', 2.4);
      if (p.txt) {
        marcas.push({
          x: X(p.x) + (p.dx === undefined ? 0 : p.dx),
          y: Y(p.y) + (p.dy === undefined ? -20 : p.dy),
          t: p.txt, anchor: 'middle', col: p.col || COL.rojo, size: 24
        });
      }
    });

    /* nombres de los ejes, lejos de las marcas numéricas */
    marcas.push({ x: W - mDer + 24, y: ejeX + 8, t: 'x', anchor: 'middle', col: COL.eje, size: 21, inmovil: true });
    marcas.push({ x: ejeY + 22, y: yTop - 6, t: 'y', anchor: 'middle', col: COL.eje, size: 21, inmovil: true });
    marcas.push({ x: ejeY - 14, y: ejeX + 28, t: '0', anchor: 'end', col: COL.gris, size: 17, tick: true });

    var cab = '';
    if (o.titulo) cab += S.txt(W / 2, 44, TP(o.titulo), { size: 24, weight: '700', fill: COL.azulOsc });
    if (o.subtitulo) cab += S.txt(W / 2, 74, TP(o.subtitulo), { size: 19, weight: '700', fill: COL.gris });

    /* Los rótulos importantes (vértices, vectores y nombres de eje) no
       pueden solaparse entre sí ni con las marcas numéricas. Primero se
       aparta el rótulo que estorba y, si aun así choca con una marca
       numérica del eje, se quita esa marca: es solo decoración. */
    function cajaM(m) {
      return cajaRot({ txt: TP(m.t), size: m.size || 17, anchor: m.anchor || 'middle', x: m.x, y: m.y });
    }
    var fijos = marcas.filter(function (m) { return !m.tick; });
    var ticks = marcas.filter(function (m) { return m.tick; });
    fijos.forEach(function (m, i) {
      if (m.inmovil) return;
      var intentos = [[0, 0], [0, -26], [0, 26], [-34, 0], [34, 0],
        [-34, -26], [34, -26], [-34, 26], [34, 26],
        [0, -52], [0, 52], [-64, 0], [64, 0], [-64, -52], [64, 52]];
      var k, j, libre = false, x0 = m.x, y0 = m.y;
      for (k = 0; k < intentos.length; k++) {
        m.x = x0 + intentos[k][0];
        m.y = y0 + intentos[k][1];
        var c0 = cajaM(m);
        if (c0.y0 < yTop + 4 || c0.y1 > yBot - 2 || c0.x0 < mIzq + 2 || c0.x1 > W - mDer - 2) continue;
        libre = true;
        for (j = 0; j < i; j++) {
          if (chocanCajas(cajaM(m), cajaM(fijos[j]), 3)) { libre = false; break; }
        }
        if (libre) break;
      }
      if (!libre) { m.x = x0; m.y = y0; }
    });
    var visibles = fijos.concat(ticks.filter(function (t) {
      var i2;
      for (i2 = 0; i2 < fijos.length; i2++) {
        if (chocanCajas(cajaM(t), cajaM(fijos[i2]), 3)) return false;
      }
      return true;
    }));
    /* dos marcas numéricas nunca chocan entre sí (misma rejilla), pero se
       comprueba por si la escala fuese muy apretada */
    var pintados = [];
    var rot = '';
    visibles.forEach(function (m) {
      var c = cajaM(m), i3, choca = false;
      for (i3 = 0; i3 < pintados.length; i3++) {
        if (chocanCajas(c, pintados[i3], 3)) { choca = true; break; }
      }
      if (choca && m.tick) return;
      pintados.push(c);
      rot += S.txt(m.x, m.y, TP(m.t), {
        size: m.size || 17, weight: '700', fill: m.col || COL.gris, anchor: m.anchor || 'middle'
      });
    });

    var cuerpo = cab + b + rot;
    var medir = S.altoDibujado || function () { return 0; };
    var fondo = medir(cuerpo);
    if (!(fondo > 0)) fondo = yBot;
    var pie = '';
    if (o.pie) {
      var yPie = Math.round(fondo + 40);
      pie += S.txt(W / 2, yPie, TP(o.pie), { size: 20, weight: '700', fill: COL.eje });
      fondo = yPie + 7;
    }
    return S.svgWrap(cuerpo + pie, W, Math.round(fondo + 24), o.label || 'Ejes', o.cap);
  }
  function redondea(v) {
    var r = Math.round(v * 1000) / 1000;
    return Math.abs(r - Math.round(r)) < 1e-9 ? Math.round(r) : r;
  }

  /* ==================================================================
     2 · queEs · Qué es un determinante
     ================================================================== */

  /* todas las permutaciones de 0…n−1 (solo se usa con n ≤ 3) */
  function permutaciones(n) {
    var res = [], usados = [];
    function rec(act) {
      if (act.length === n) { res.push(act.slice()); return; }
      for (var j = 0; j < n; j++) {
        if (usados[j]) continue;
        usados[j] = 1; act.push(j); rec(act); act.pop(); usados[j] = 0;
      }
    }
    rec([]);
    return res;
  }
  function signoPerm(p) {
    var s = 1, i, j;
    for (i = 0; i < p.length; i++) for (j = i + 1; j < p.length; j++) if (p[i] > p[j]) s = -s;
    return s;
  }
  /* fichas de los n! sumandos de la definición general */
  function sumandosDef(A) {
    var n = A.f;
    return permutaciones(n).map(function (p) {
      var val = F(1), i, factores = [], nombres = [], indices = [];
      for (i = 0; i < n; i++) {
        val = val.por(A.a[i][p[i]]);
        factores.push(A.a[i][p[i]]);
        nombres.push(aij(i + 1, p[i] + 1));
        indices.push([i, p[i]]);
      }
      var sg = signoPerm(p);
      return {
        perm: p, signo: sg, factores: factores, nombres: nombres, indices: indices,
        valor: val, aporta: sg === 1 ? val : val.opuesto(),
        nombreTxt: nombres.join(' · '),
        cuentaTxt: factores.map(function (f) { return PT(f); }).join(' · ') + ' = ' + NT(val)
      };
    });
  }

  R.queEs = function (node) {
    return S.shell(node, 'Qué es un determinante',
      'A cada matriz <b>cuadrada</b> se le asocia un número, su <b>determinante</b>. ' +
      'Las matrices rectangulares no tienen determinante. ' + COMO_MAT + ' ' +
      'Prueba primero con <code>3 1; 2 4</code> y después con <code>1 2 3; 4 5 6</code>, que no es ' +
      'cuadrada. Con el deslizador <b>producto destacado</b> se resaltan en la figura los ' +
      'elementos de uno de los sumandos de la definición: en cada sumando hay <b>un elemento de ' +
      'cada fila y uno de cada columna</b>, y hay tantos sumandos como maneras de elegirlos, es ' +
      'decir n!.',
      [
        { id: 'txt', label: 'Matriz A', type: 'text', value: '3 1; 2 4', ancho: '18rem' },
        { id: 'k', label: 'Producto destacado', type: 'range', min: 0, max: 6, value: 0 },
        { id: 'sig', label: 'Siguiente producto', type: 'button', click: function (ctl) {
          var k = ent(ctl.k && ctl.k.value, 0, 6, 0);
          pon(ctl, { k: (k + 1) % 7 });
        } },
        escenarios([
          { txt: 'orden 2', tit: 'Dos sumandos: 2! = 2', set: { txt: '3 1; 2 4', k: 0 } },
          { txt: 'orden 3', tit: 'Seis sumandos: 3! = 6', set: { txt: '1 2 3; 4 5 6; 7 8 10', k: 0 } },
          { txt: 'orden 1', tit: 'Un solo sumando: 1! = 1', set: { txt: '-5', k: 0 } },
          { txt: 'no cuadrada 2×3', tit: 'Una matriz rectangular no tiene determinante', set: { txt: '1 2 3; 4 5 6', k: 0 } },
          { txt: 'no cuadrada 3×2', set: { txt: '1 2; 3 4; 5 6', k: 0 } },
          { txt: 'determinante nulo', tit: 'La segunda fila es el doble de la primera', set: { txt: '1 2; 2 4', k: 0 } },
          { txt: 'con fracciones', set: { txt: '1/2 3; -2 1/4', k: 0 } },
          { txt: 'orden 4 (solo el número)', tit: 'Con 4! = 24 sumandos ya no se listan', set: { txt: '1 0 2 3; 0 1 4 5; 2 1 0 1; 3 0 1 2', k: 0 } }
        ])
      ],
      guarda(function (v) {
        var A = leeMat(v.txt, 'tu matriz');
        var m = A.f, n = A.c;
        var h = enun('Un determinante es un <b>número</b> asociado a una matriz <b>cuadrada</b>. ' +
          'Se escribe $|A|$ o $\\det(A)$. Se obtiene sumando todos los productos posibles de ' +
          '$n$ elementos tomando <b>uno de cada fila y uno de cada columna</b>, la mitad con su ' +
          'signo y la otra mitad con el contrario.');

        if (m !== n) {
          h += figuraUna(A, {
            titulo: 'Matriz de dimensión ' + m + ' × ' + n,
            subtitulo: 'no es cuadrada: no se le puede asociar ningún determinante',
            nombre: 'A', barras: false,
            pie: 'No hay manera de tomar un elemento de cada fila y de cada columna',
            label: 'Matriz rectangular, que no tiene determinante',
            cap: 'La matriz es de dimensión $' + S.dimTex(A) + '$, así que no es cuadrada.'
          });
          h += S.kvs([
            'dimensión ' + K(S.dimTex(A)),
            S.badge('no es cuadrada', 'no'),
            S.badge('no tiene determinante', 'no')
          ]);
          h += rejilla2([
            tarjeta('¿Por qué no?',
              '<p>Para formar un sumando hay que elegir un elemento de cada fila y, a la vez, uno ' +
              'de cada columna. Con ' + m + ' filas y ' + n + ' columnas eso es imposible: sobran ' +
              (m > n ? 'filas' : 'columnas') + '.</p>'),
            tarjeta('¿Y entonces qué se puede hacer?',
              '<p>De una matriz rectangular sí se pueden extraer <b>menores</b>: determinantes de ' +
              'las submatrices cuadradas que se obtienen eligiendo la misma cantidad de filas que ' +
              'de columnas. Es lo que se usará para calcular el rango.</p>')
          ]);
          h += nota('Cambia la matriz por una cuadrada, por ejemplo <code>3 1; 2 4</code>, ' +
            'y aparecerá su determinante.');
          return h;
        }

        var D = S.det(A);
        var nf = fact(n);
        var lista = n <= 3 ? sumandosDef(A) : [];
        var k = ent(v.k, 0, 6, 0);
        if (k > lista.length) k = 0;
        var elegido = k > 0 ? lista[k - 1] : null;

        h += figuraUna(A, {
          titulo: 'Determinante de orden ' + n,
          subtitulo: elegido
            ? 'sumando ' + k + ' de ' + lista.length + ': ' + elegido.nombreTxt +
              ' (signo ' + (elegido.signo === 1 ? '+' : '\u2212') + ')'
            : (n === 1 ? 'en el orden 1 hay un solo sumando, y lleva signo +'
              : (n <= 3 ? 'mueve el deslizador para destacar cada uno de los ' + nf + ' sumandos'
                : 'en orden ' + n + ' hay ' + nf + ' sumandos: demasiados para listarlos')),
          nombre: 'A', barras: true,
          marcas: elegido ? elegido.indices.map(function (p) {
            return {
              i: p[0], j: p[1],
              col: elegido.signo === 1 ? COL.verde : COL.rojo,
              fondo: elegido.signo === 1 ? 'rgba(46,125,50,.12)' : 'rgba(198,40,40,.12)',
              grosor: 3.4
            };
          }) : [],
          pie: elegido
            ? 'Sumando destacado: ' + elegido.nombreTxt + ' = ' + elegido.cuentaTxt
            : 'Valor del determinante: |A| = ' + NT(D),
          label: 'Determinante de orden ' + n + ' con los elementos de un sumando destacados',
          cap: 'Cada sumando toma <b>un elemento de cada fila y uno de cada columna</b>: por eso ' +
            'nunca se repite ni una fila ni una columna.'
        });

        h += S.resultado(K('|A| = ' + FT(D)), 'determinante de la matriz de orden ' + n);
        h += S.kvs([
          'orden ' + K(String(n)),
          S.badge('es cuadrada', 'si'),
          'sumandos: ' + K(n + '! = ' + nf),
          'con signo + : ' + K(String(nf / 2 >= 1 ? Math.max(1, nf / 2) : 1)),
          cero(D) ? S.badge('determinante nulo', 'no') : S.badge('determinante no nulo', 'si')
        ]);

        if (n <= 3) {
          var filas = lista.map(function (t, idx) {
            return {
              clase: (elegido && idx === k - 1) ? 'ap-hi' : '',
              celdas: [
                String(idx + 1),
                K(t.nombres.map(function (s, q) { return aijTex(q + 1, t.perm[q] + 1); }).join(' \\cdot ')),
                t.signo === 1 ? S.badge('+', 'si') : S.badge('\u2212', 'no'),
                esc(t.cuentaTxt),
                K(FT(t.aporta))
              ]
            };
          });
          h += S.tabla(['#', 'Producto', 'Signo', 'Cuenta', 'Aporta'], filas, { thPrimera: false });

          /* suma llana con los signos bien espaciados: a11·a22 - a12·a21 */
          var listaTxt = lista.map(function (t, idx) {
            if (idx === 0) return (t.signo === 1 ? '' : '\u2212 ') + t.nombreTxt;
            return (t.signo === 1 ? ' + ' : ' \u2212 ') + t.nombreTxt;
          });
          h += S.expr('Definición desarrollada para el orden ' + n,
            '|A| = ' + lista.map(function (t, idx) {
              var s = t.nombres.map(function (s2, q) { return aijTex(q + 1, t.perm[q] + 1); }).join(' \\cdot ');
              if (idx === 0) return (t.signo === 1 ? '' : '-') + s;
              return (t.signo === 1 ? ' + ' : ' - ') + s;
            }).join(''));
          h += S.expr('Con los números de tu matriz',
            '|A| = ' + S.sumandosTex(lista.map(function (t) { return FT(t.aporta); })) +
            ' = ' + FT(D));
          h += nota(n === 1
            ? 'En el orden 1 hay <b>un solo sumando</b> (' + K('1! = 1') + '), y lleva signo ' +
              '<b>+</b>: no hay nada que repartir entre los dos signos. En texto llano: ' +
              esc(listaTxt.join('')) + '.'
            : 'Los ' + nf + ' sumandos se reparten mitad y mitad: ' + numCom(nf / 2) +
              ' llevan signo + y ' + numCom(nf / 2) + ' llevan signo \u2212. En texto llano: ' +
              esc(listaTxt.join('')) + '.');
        } else {
          h += rejilla2([
            tarjeta('¿Por qué no se listan?',
              '<p>En orden ' + n + ' habría $' + n + '! = ' + nf + '$ sumandos de ' + n +
              ' factores cada uno. La definición sigue valiendo, pero para calcular se usan ' +
              'los <b>adjuntos</b> o el método de <b>hacer ceros</b>.</p>'),
            tarjeta('Cuántos sumandos hay',
              S.expr('', n + '! = ' + nf, false) +
              '<p>De ellos, ' + numCom(nf / 2) + ' llevan signo + y ' + numCom(nf / 2) +
              ' llevan signo \u2212.</p>')
          ]);
        }

        h += rejilla2([
          tarjeta('Notación',
            '<p>El determinante se escribe con <b>barras verticales</b>:</p>' +
            S.expr('', '|A| = ' + S.detTex(A) + ' = ' + FT(D), false)),
          tarjeta('Cuidado',
            '<p>Esas barras <b>no son un valor absoluto</b>. Un determinante puede ser negativo: ' +
            'aquí vale $' + FT(D) + '$.</p>')
        ]);
        return h;
      }));
  };

  /* ==================================================================
     3 · orden1 · Determinante de orden 1
     ================================================================== */
  R.orden1 = function (node) {
    return S.shell(node, 'Determinante de orden 1',
      'Una matriz de orden 1 tiene un único elemento, $A = (a)$, y su determinante es ' +
      'exactamente ese número: $|A| = a$. Mueve el deslizador para cambiar $a$, o elige el modo ' +
      '<i>lo escribo yo</i> y teclea el valor. ' + COMO_NUM + ' Por ejemplo <code>-5</code>, ' +
      '<code>0,5</code> o <code>3/4</code>. Fíjate bien en el aviso: esas barras <b>no son un ' +
      'valor absoluto</b>.',
      [
        { id: 'modo', label: 'Valor de a', type: 'select', value: 'desl', options: [
          { value: 'desl', label: 'con el deslizador' },
          { value: 'escrito', label: 'lo escribo yo' }
        ] },
        { id: 'a', label: 'a', type: 'range', min: -9, max: 9, value: -5 },
        { id: 'av', label: 'a (escrito)', type: 'text', value: '3/4', ancho: '8rem' },
        escenarios([
          { txt: 'a = −5', tit: 'El caso que más confunde', set: { modo: 'desl', a: -5 } },
          { txt: 'a = 5', set: { modo: 'desl', a: 5 } },
          { txt: 'a = 0', tit: 'Determinante nulo', set: { modo: 'desl', a: 0 } },
          { txt: 'a = 1', tit: 'La identidad de orden 1', set: { modo: 'desl', a: 1 } },
          { txt: 'a = −1', set: { modo: 'desl', a: -1 } },
          { txt: 'a = 3/4', tit: 'También vale con fracciones', set: { modo: 'escrito', av: '3/4' } },
          { txt: 'a = −0,5', set: { modo: 'escrito', av: '-0,5' } }
        ])
      ],
      guarda(function (v) {
        var a = v.modo === 'escrito' ? leeNum(v.av, 'el valor de a') : F(ent(v.a, -9, 9, 0));
        var av = NT(a);
        var absA = NT(abs(a));

        var h = enun('Si $A = (a)$ es una matriz de orden 1, su determinante es ' +
          '$|A| = \\det(A) = a$. No hay nada que multiplicar ni que restar: el determinante ' +
          '<b>es</b> el propio número.');

        /* figura hecha a mano: el determinante grande y la comparación */
        var W = 760;
        var bx = 210, by = 140, bw = 170, bh = 108;
        var b = '';
        b += S.txt(W / 2, 44, TP('Determinante de orden 1'),
          { size: 24, weight: '700', fill: COL.azulOsc });
        b += S.txt(W / 2, 82, TP('las barras son las de un determinante, no las del valor absoluto'),
          { size: 19, weight: '700', fill: COL.gris });
        b += S.rect(bx, by, bw, bh, '#fff', '#e3e9ef', { r: 10, sw: 1.4 });
        b += S.line(bx - 16, by - 8, bx - 16, by + bh + 8, COL.azulOsc, 5);
        b += S.line(bx + bw + 16, by - 8, bx + bw + 16, by + bh + 8, COL.azulOsc, 5);
        b += S.txt(bx + bw / 2, by + bh / 2 + 14, TP(av),
          { size: 40, weight: '700', fill: COL.texto });
        b += S.txt(bx + bw + 66, by + bh / 2 + 12, '=', { size: 34, weight: '700', fill: COL.eje });
        b += S.txt(bx + bw + 158, by + bh / 2 + 14, TP(av),
          { size: 40, weight: '700', fill: cero(a) ? COL.gris : (neg(a) ? COL.rojo : COL.verde) });
        b += S.txt(bx - 24, by - 26, TP('A = ( ' + av + ' )'),
          { size: 21, weight: '700', fill: COL.azulOsc, anchor: 'start' });

        var y1 = by + bh + 84, y2 = y1 + 58;
        b += S.rect(72, y1 - 36, W - 144, 46, 'rgba(46,125,50,.10)', COL.verde, { r: 8, sw: 1.6 });
        b += S.txt(96, y1 - 4, TP('como DETERMINANTE:   | ' + av + ' | = ' + av),
          { size: 22, weight: '700', fill: COL.verde, anchor: 'start' });
        b += S.rect(72, y2 - 36, W - 144, 46, 'rgba(198,40,40,.10)', COL.rojo, { r: 8, sw: 1.6 });
        b += S.txt(96, y2 - 4, TP('como VALOR ABSOLUTO:   | ' + av + ' | = ' + absA),
          { size: 22, weight: '700', fill: COL.rojo, anchor: 'start' });
        b += S.txt(W / 2, y2 + 56,
          TP(neg(a)
            ? 'Con a = ' + av + ' los dos resultados son distintos: ' + av + ' y ' + absA
            : 'Con a = ' + av + ' coinciden por casualidad, pero no significan lo mismo'),
          { size: 20, weight: '700', fill: COL.eje });
        var fondo = (S.altoDibujado || function () { return y2 + 60; })(b);
        h += S.svgWrap(b, W, Math.round(fondo + 24),
          'Determinante de orden 1 comparado con el valor absoluto',
          'El mismo símbolo, dos significados distintos: aquí las barras indican determinante.');

        h += S.resultado(K('|A| = ' + FT(a)), 'determinante de la matriz de orden 1');
        h += S.kvs([
          'orden ' + K('1'),
          'como determinante: ' + K('|' + FT(a) + '| = ' + FT(a)),
          'como valor absoluto: ' + K('|' + FT(a) + '| = ' + FT(abs(a))),
          cero(a) ? S.badge('determinante nulo', 'no') : S.badge('determinante no nulo', 'si')
        ]);

        h += S.tabla(['Se escribe', 'Si es determinante vale', 'Si es valor absoluto vale'], [
          [K('|-5|'), K('-5'), K('5')],
          [K('|0|'), K('0'), K('0')],
          [K('|7|'), K('7'), K('7')],
          [K('|' + FT(a) + '|'), K(FT(a)), K(FT(abs(a)))]
        ], { thPrimera: true });

        h += rejilla2([
          tarjeta('Cómo se distingue',
            '<p>Lo dice el <b>contexto</b>: si dentro de las barras hay una <b>matriz</b> ' +
            '(o el nombre de una matriz), son barras de determinante; si hay un <b>número o una ' +
            'expresión numérica</b>, son barras de valor absoluto.</p>' +
            '<p>Para evitar dudas se puede escribir $\\det(A)$ en lugar de $|A|$.</p>', 'ap-card-ok'),
          tarjeta('Error típico',
            '<p>Escribir $\\begin{vmatrix} -5 \\end{vmatrix} = 5$. <b>Falso.</b> El determinante ' +
            'de la matriz de orden 1 formada por $-5$ vale $-5$: los determinantes pueden ser ' +
            'negativos.</p>')
        ]);
        h += nota('Este caso parece una tontería, pero es la base de la definición: el ' +
          'determinante de orden $n$ se acabará reduciendo, paso a paso, a determinantes de ' +
          'orden 1.');
        return h;
      }));
  };

  /* ==================================================================
     4 · orden2 · Determinante de orden 2
     ================================================================== */
  R.orden2 = function (node) {
    return S.shell(node, 'Determinante de orden 2',
      'El determinante de orden 2 es el producto de la <b>diagonal principal</b> menos el ' +
      'producto de la <b>diagonal secundaria</b>: $|A| = a_{11}a_{22} - a_{12}a_{21}$. ' +
      COMO_MAT + ' Escribe aquí una matriz de 2×2, por ejemplo <code>3 1; 2 4</code>. ' +
      'Con el modo <i>área</i> se interpreta el determinante como el <b>área con signo</b> del ' +
      'paralelogramo que forman los dos vectores fila $F_1 = (a_{11}, a_{12})$ y ' +
      '$F_2 = (a_{21}, a_{22})$.',
      [
        { id: 'txt', label: 'Matriz A (2×2)', type: 'text', value: '3 1; 2 4', ancho: '16rem' },
        { id: 'modo', label: 'Modo', type: 'select', value: 'diag', options: [
          { value: 'diag', label: 'diagonales' },
          { value: 'area', label: 'área del paralelogramo' }
        ] },
        { id: 'azar', label: 'Matriz al azar', type: 'button', click: function (ctl) {
          pon(ctl, { txt: S.matTxt(S.matAleatoria(2, 2, { min: -5, max: 6 })) });
        } },
        escenarios([
          { txt: 'ejemplo básico', tit: '3·4 − 1·2 = 10', set: { txt: '3 1; 2 4', modo: 'diag' } },
          { txt: 'determinante negativo', set: { txt: '1 4; 3 2', modo: 'diag' } },
          { txt: 'determinante nulo', tit: 'Filas proporcionales', set: { txt: '2 3; 4 6', modo: 'diag' } },
          { txt: 'con negativos', set: { txt: '-2 5; 3 -4', modo: 'diag' } },
          { txt: 'con fracciones', set: { txt: '1/2 3; -2 1/4', modo: 'diag' } },
          { txt: 'área: base y altura', tit: 'Un rectángulo de 4 por 3', set: { txt: '4 0; 0 3', modo: 'area' } },
          { txt: 'área con signo negativo', tit: 'Los dos vectores en orden inverso', set: { txt: '0 3; 4 0', modo: 'area' } },
          { txt: 'área nula: vectores alineados', set: { txt: '2 1; 4 2', modo: 'area' } }
        ])
      ],
      guarda(function (v) {
        var A = leeMat(v.txt, 'tu matriz', { orden: 2, max: 2 });
        var a = A.a[0][0], b = A.a[0][1], c = A.a[1][0], d = A.a[1][1];
        var pp = a.por(d), ps = b.por(c);
        var D = S.det(A);

        var h = enun('En orden 2 el determinante es una resta de dos productos: el de la ' +
          '<b>diagonal principal</b> (de arriba a la izquierda hacia abajo a la derecha) menos el ' +
          'de la <b>diagonal secundaria</b>.');

        /* --- figura de las dos diagonales --- */
        var lineas = [
          { txt: 'diagonal principal (verde):  ' + aij(1, 1) + ' \u00b7 ' + aij(2, 2) + ' = ' +
              PT(a) + ' \u00b7 ' + PT(d) + ' = ' + NT(pp), col: COL.verde },
          { txt: 'diagonal secundaria (roja):  ' + aij(1, 2) + ' \u00b7 ' + aij(2, 1) + ' = ' +
              PT(b) + ' \u00b7 ' + PT(c) + ' = ' + NT(ps), col: COL.rojo },
          { txt: '|A| = ' + NT(pp) + ' \u2212 ' + PT(ps) + ' = ' + NT(D), col: COL.azulOsc, size: 22 }
        ];
        h += figuraUna(A, {
          titulo: 'Las dos diagonales de un determinante de orden 2',
          subtitulo: 'se multiplica cada diagonal y se restan los dos productos',
          nombre: 'A', barras: true, cw: 132, ch: 96,
          lineas: lineas,
          dibujo: function (g) {
            var s = '';
            var dx = g.cw * 0.30, dy = g.ch * 0.30;
            s += S.line(g.X(0) - dx, g.Y(0) - dy, g.X(1) + dx, g.Y(1) + dy, COL.verde, 6);
            s += S.line(g.X(1) + dx, g.Y(0) - dy, g.X(0) - dx, g.Y(1) + dy, COL.rojo, 6);
            s += S.rect(g.x0 + 6, g.y0 + 6, g.cw - 12, g.ch - 12, 'rgba(46,125,50,.10)', 'none', { r: 8 });
            s += S.rect(g.x0 + g.cw + 6, g.y0 + g.ch + 6, g.cw - 12, g.ch - 12, 'rgba(46,125,50,.10)', 'none', { r: 8 });
            s += S.rect(g.x0 + g.cw + 6, g.y0 + 6, g.cw - 12, g.ch - 12, 'rgba(198,40,40,.10)', 'none', { r: 8 });
            s += S.rect(g.x0 + 6, g.y0 + g.ch + 6, g.cw - 12, g.ch - 12, 'rgba(198,40,40,.10)', 'none', { r: 8 });
            return s;
          },
          label: 'Determinante de orden 2 con sus dos diagonales resaltadas',
          cap: 'En verde la diagonal principal, en rojo la secundaria. El determinante es la ' +
            'resta de sus productos.'
        });

        h += S.resultado(K('|A| = ' + FT(D)), 'determinante de orden 2');
        h += S.expr('Regla del orden 2',
          '|A| = ' + S.detTex(A) + ' = ' + aijTex(1, 1) + aijTex(2, 2) + ' - ' +
          aijTex(1, 2) + aijTex(2, 1) + ' = ' +
          S.parNegTex(FT(a)) + ' \\cdot ' + S.parNegTex(FT(d)) + ' - ' +
          S.parNegTex(FT(b)) + ' \\cdot ' + S.parNegTex(FT(c)) + ' = ' +
          FT(pp) + ' - ' + S.parNegTex(FT(ps)) + ' = ' + FT(D));

        h += S.tabla(['Paso', 'Qué se hace', 'Resultado'], [
          [S.paso(1, 'Diagonal principal'), K(aijTex(1, 1) + ' \\cdot ' + aijTex(2, 2)), K(FT(pp))],
          [S.paso(2, 'Diagonal secundaria'), K(aijTex(1, 2) + ' \\cdot ' + aijTex(2, 1)), K(FT(ps))],
          [S.paso(3, 'Se restan'), K(FT(pp) + ' - ' + S.parNegTex(FT(ps))), K(FT(D))]
        ], { thPrimera: false });

        /* --- modo área --- */
        if (v.modo === 'area') {
          var ux = a.val(), uy = b.val(), vx = c.val(), vy = d.val();
          var xs = [0, ux, vx, ux + vx], ys = [0, uy, vy, uy + vy];
          var xmin = Math.min.apply(Math, xs), xmax = Math.max.apply(Math, xs);
          var ymin = Math.min.apply(Math, ys), ymax = Math.max.apply(Math, ys);
          var mx = Math.max(1, (xmax - xmin) * 0.22), my = Math.max(1, (ymax - ymin) * 0.22);
          h += figEjes({
            xmin: xmin - mx, xmax: xmax + mx, ymin: ymin - my, ymax: ymax + my,
            titulo: 'El determinante como área con signo',
            subtitulo: 'paralelogramo formado por los dos vectores fila',
            poligonos: cero(D) ? [] : [{
              pts: [[0, 0], [ux, uy], [ux + vx, uy + vy], [vx, vy]],
              fill: neg(D) ? 'rgba(198,40,40,.16)' : 'rgba(46,125,50,.16)',
              stroke: neg(D) ? COL.rojo : COL.verde, sw: 3
            }],
            flechas: [
              { a: [0, 0], b: [ux, uy], col: COL.azul, txt: 'F' + sub(1) },
              { a: [0, 0], b: [vx, vy], col: COL.naranja, txt: 'F' + sub(2) }
            ],
            pie: cero(D)
              ? 'Área 0: los dos vectores fila est\u00e1n alineados y no forman paralelogramo'
              : 'Área = |' + NT(D) + '| = ' + NT(abs(D)) + '   (el signo del determinante es ' +
                (neg(D) ? 'negativo' : 'positivo') + ')',
            label: 'Paralelogramo formado por los dos vectores fila de la matriz',
            cap: 'El valor absoluto del determinante es el <b>área</b> del paralelogramo; el signo ' +
              'indica el <b>orden</b> en que se recorren los dos vectores.'
          });
          h += rejilla3([
            tarjeta('Vectores fila',
              S.expr('', 'F_1 = (' + FT(a) + ',\\ ' + FT(b) + ')', false) +
              S.expr('', 'F_2 = (' + FT(c) + ',\\ ' + FT(d) + ')', false)),
            tarjeta('Área con signo', S.expr('', '|A| = ' + FT(D), false) +
              '<p>' + (neg(D) ? 'Negativo: de $F_1$ a $F_2$ se gira en el sentido de las agujas del reloj.'
                : (cero(D) ? 'Nulo: los dos vectores tienen la misma dirección.'
                  : 'Positivo: de $F_1$ a $F_2$ se gira en sentido contrario a las agujas del reloj.')) + '</p>'),
            tarjeta('Área de verdad', S.expr('', '\\text{área} = |\\,|A|\\,| = ' + FT(abs(D)), false) +
              '<p>El área nunca es negativa: se toma el valor absoluto del determinante.</p>')
          ]);
          h += nota('Si intercambias las dos filas, el paralelogramo es el mismo pero el ' +
            'determinante <b>cambia de signo</b>: el área no cambia, cambia la orientación.');
        } else {
          h += nota('Cambia el modo a <i>área del paralelogramo</i> para ver qué significa ' +
            'geométricamente este número.');
        }

        h += rejilla2([
          tarjeta('Qué dice el signo',
            '<p>' + (cero(D)
              ? 'Aquí $|A| = 0$: las dos filas son proporcionales (o alguna es nula) y la matriz ' +
                '<b>no tiene inversa</b>.'
              : 'Aquí $|A| = ' + FT(D) + ' \\neq 0$, así que la matriz <b>sí tiene inversa</b>.') + '</p>'),
          tarjeta('Error típico',
            '<p>Restar al revés: $a_{12}a_{21} - a_{11}a_{22}$. Da el <b>opuesto</b>, ' +
            '$' + FT(D.opuesto()) + '$ en lugar de $' + FT(D) + '$. Primero la diagonal principal.</p>')
        ]);
        return h;
      }));
  };

  /* ==================================================================
     5 · sarrus · Regla de Sarrus
     ================================================================== */
  R.sarrus = function (node) {
    return S.shell(node, 'Regla de Sarrus',
      'La regla de Sarrus calcula un determinante de <b>orden 3</b> —y solo de orden 3— con seis ' +
      'productos: los tres de las diagonales <b>descendentes</b> con signo + y los tres de las ' +
      '<b>ascendentes</b> con signo −. ' + COMO_MAT + ' Aquí hace falta una matriz de 3×3, por ' +
      'ejemplo <code>1 2 3; 4 5 6; 7 8 10</code>. En la figura se repiten al lado las dos primeras ' +
      'columnas para que las seis diagonales se vean rectas. Con el botón <b>Siguiente diagonal</b> ' +
      'se recorren las seis de una en una.',
      [
        { id: 'txt', label: 'Matriz A (3×3)', type: 'text', value: '1 2 3; 4 5 6; 7 8 10', ancho: '20rem' },
        { id: 'd', label: 'Diagonal (0 = todas)', type: 'range', min: 0, max: 6, value: 0 },
        { id: 'sig', label: 'Siguiente diagonal', type: 'button', click: function (ctl) {
          var k = ent(ctl.d && ctl.d.value, 0, 6, 0);
          pon(ctl, { d: (k + 1) % 7 });
        } },
        { id: 'azar', label: 'Matriz al azar', type: 'button', click: function (ctl) {
          pon(ctl, { txt: S.matTxt(S.matAleatoria(3, 3, { min: -4, max: 6 })), d: 0 });
        } },
        escenarios([
          { txt: 'ejemplo clásico', tit: 'Determinante igual a −3', set: { txt: '1 2 3; 4 5 6; 7 8 10', d: 0 } },
          { txt: 'con negativos', set: { txt: '-1 2 0; 3 -4 5; 0 1 -2', d: 0 } },
          { txt: 'determinante nulo', tit: 'La tercera fila es suma de las otras dos', set: { txt: '1 2 3; 4 5 6; 5 7 9', d: 0 } },
          { txt: 'triangular superior', tit: 'Producto de la diagonal principal', set: { txt: '2 5 1; 0 3 4; 0 0 -1', d: 0 } },
          { txt: 'matriz identidad', set: { txt: '1 0 0; 0 1 0; 0 0 1', d: 0 } },
          { txt: 'con fracciones', set: { txt: '1/2 1 0; 2 1/3 1; 0 1 2', d: 0 } },
          { txt: 'paso a paso: 1.ª diagonal', tit: 'Empieza el recorrido de las seis diagonales', set: { txt: '1 2 3; 4 5 6; 7 8 10', d: 1 } }
        ])
      ],
      guarda(function (v) {
        var A = leeMat(v.txt, 'tu matriz', { orden: 3, max: 3 });
        var Rs = S.sarrus(A);
        var d = ent(v.d, 0, 6, 0);
        /* 1..3 -> descendentes (positivas); 4..6 -> ascendentes (negativas) */
        var sel = null;
        if (d >= 1 && d <= 3) sel = { tipo: 'pos', t: d - 1, term: Rs.positivos[d - 1] };
        else if (d >= 4 && d <= 6) sel = { tipo: 'neg', t: d - 4, term: Rs.negativos[d - 4] };

        var h = enun('Se copian al lado de la matriz sus dos primeras columnas. Las tres ' +
          'diagonales <b>descendentes</b> (verdes) suman; las tres <b>ascendentes</b> (rojas) ' +
          'restan. En total, seis productos de tres factores.');

        var lineas = [];
        Rs.positivos.forEach(function (t, i) {
          lineas.push({
            txt: (i + 1) + ')  descendente:  ' + nombresTxt(t) + ' = ' + t.txt,
            col: (sel && sel.tipo === 'pos' && sel.t === i) ? COL.azulOsc : COL.verde
          });
        });
        Rs.negativos.forEach(function (t, i) {
          lineas.push({
            txt: (i + 4) + ')  ascendente:  ' + nombresTxt(t) + ' = ' + t.txt,
            col: (sel && sel.tipo === 'neg' && sel.t === i) ? COL.azulOsc : COL.rojo
          });
        });
        lineas.push({
          txt: 'suman: ' + S.sumandosTxt(Rs.positivos.map(function (t) { return NT(t.valor); })) +
            ' = ' + NT(Rs.sumaPositivos), col: COL.verde, size: 21
        });
        lineas.push({
          txt: 'restan: ' + S.sumandosTxt(Rs.negativos.map(function (t) { return NT(t.valor); })) +
            ' = ' + NT(Rs.sumaNegativos), col: COL.rojo, size: 21
        });
        lineas.push({
          txt: '|A| = ' + NT(Rs.sumaPositivos) + ' \u2212 ' + PT(Rs.sumaNegativos) +
            ' = ' + NT(Rs.total), col: COL.azulOsc, size: 22
        });

        h += figuraDet([{
          f: 3, c: 5,
          celda: function (i, j) { return NT(A.a[i][j % 3]); },
          /* Las dos columnas repetidas se distinguen por el color del texto,
             pero con contraste suficiente para leerlas sobre el blanco: el
             gris claro de antes se perdía debajo de las diagonales. */
          colorCelda: function (i, j) { return j >= 3 ? COL.eje : COL.texto; },
          colHi: [3, 4],
          nombre: 'A con las columnas C1 y C2 repetidas', rot: false, barras: true
        }], {
          titulo: 'Regla de Sarrus',
          subtitulo: sel
            ? 'diagonal ' + d + ' de 6: ' + (sel.tipo === 'pos' ? 'descendente (suma)' : 'ascendente (resta)')
            : 'tres diagonales descendentes en verde (+) y tres ascendentes en rojo (\u2212)',
          cw: 112, ch: 90, izq: 104,
          lineas: lineas,
          dibujo: function (g) {
            var s = '', t;
            for (t = 0; t < 3; t++) {
              var apagada = sel !== null && !(sel.tipo === 'pos' && sel.t === t);
              s += diagonal(g, t, 1, apagada, t + 1);
            }
            for (t = 0; t < 3; t++) {
              var apagada2 = sel !== null && !(sel.tipo === 'neg' && sel.t === t);
              s += diagonal(g, t, -1, apagada2, t + 4);
            }
            return s;
          },
          pie: 'Determinante: |A| = ' + NT(Rs.total),
          label: 'Esquema de Sarrus con las seis diagonales y sus productos',
          cap: 'Las diagonales verdes bajan de izquierda a derecha y llevan signo $+$; las rojas ' +
            'suben y llevan signo $-$.'
        });

        h += S.resultado(K('|A| = ' + FT(Rs.total)), 'determinante de orden 3 por la regla de Sarrus');

        var filas = [];
        Rs.positivos.forEach(function (t, i) {
          filas.push({
            clase: (sel && sel.tipo === 'pos' && sel.t === i) ? 'ap-hi' : '',
            celdas: [String(i + 1), S.badge('+', 'si'), K(nombresTex(t)), esc(t.txt), K(FT(t.valor))]
          });
        });
        Rs.negativos.forEach(function (t, i) {
          filas.push({
            clase: (sel && sel.tipo === 'neg' && sel.t === i) ? 'ap-hi' : '',
            celdas: [String(i + 4), S.badge('\u2212', 'no'), K(nombresTex(t)), esc(t.txt), K(FT(t.valor.opuesto()))]
          });
        });
        h += S.tabla(['#', 'Signo', 'Producto', 'Cuenta', 'Aporta'], filas, { thPrimera: false });

        h += S.expr('Fórmula de Sarrus',
          '|A| = ' + Rs.positivos.map(function (t) { return nombresTex(t); }).join(' + ') +
          ' - ' + Rs.negativos.map(function (t) { return nombresTex(t); }).join(' - '));
        h += S.expr('Con los números de tu matriz',
          '|A| = ' + S.sumandosTex(Rs.positivos.map(function (t) { return FT(t.valor); })) +
          ' - \\left(' + S.sumandosTex(Rs.negativos.map(function (t) { return FT(t.valor); })) +
          '\\right) = ' + FT(Rs.sumaPositivos) + ' - ' + S.parNegTex(FT(Rs.sumaNegativos)) +
          ' = ' + FT(Rs.total));

        if (sel) {
          h += S.paso(d, '<b>Diagonal ' + d + '</b> (' +
            (sel.tipo === 'pos' ? 'descendente, signo +' : 'ascendente, signo −') + '): ' +
            K(nombresTex(sel.term)) + ' = ' + esc(sel.term.txt) + ', aporta ' +
            K(FT(sel.tipo === 'pos' ? sel.term.valor : sel.term.valor.opuesto())) + '.',
            sel.tipo === 'pos' ? 'ap-ok' : 'ap-ko');
          h += nota('Pulsa otra vez <b>Siguiente diagonal</b> para pasar a la ' +
            (d === 6 ? 'vista con las seis a la vez' : 'diagonal ' + (d + 1)) + '.');
        } else {
          h += nota('Pulsa <b>Siguiente diagonal</b> para recorrer las seis diagonales de una ' +
            'en una y ver de dónde sale cada producto.');
        }

        h += rejilla2([
          tarjeta('Comprobación', '<p>El mismo determinante calculado por la capa de álgebra ' +
            'general vale ' + K(FT(S.det(A))) + ', que coincide con el resultado de Sarrus.</p>',
            'ap-card-ok'),
          tarjeta('Aviso importante',
            '<p>La regla de Sarrus <b>solo vale para el orden 3</b>. No existe una «Sarrus de ' +
            'orden 4»: a partir de ahí hay que desarrollar por los adjuntos o hacer ceros.</p>')
        ]);
        return h;
      }));
  };

  /* nombres del término de Sarrus en texto llano y en TeX, base 1 */
  function nombresTxt(t) {
    return t.indices1.map(function (p) { return aij(p[0], p[1]); }).join(' \u00b7 ');
  }
  function nombresTex(t) {
    return t.indices1.map(function (p) { return aijTex(p[0], p[1]); }).join(' \\cdot ');
  }
  /* una diagonal del esquema de Sarrus sobre la rejilla 3×5.
     sentido = 1 descendente (fila 0 -> fila 2), −1 ascendente. */
  function diagonal(g, t, sentido, apagada, num) {
    var col = sentido === 1 ? COL.verde : COL.rojo;
    var x1, y1, x2, y2;
    if (sentido === 1) {
      x1 = g.X(t); y1 = g.Y(0); x2 = g.X(t + 2); y2 = g.Y(2);
    } else {
      x1 = g.X(t); y1 = g.Y(2); x2 = g.X(t + 2); y2 = g.Y(0);
    }
    var dx = (x2 - x1) / 2, dy = (y2 - y1) / 2;
    var ex = x1 - dx * 0.30, ey = y1 - dy * 0.30;
    var fx = x2 + dx * 0.42, fy = y2 + dy * 0.42;
    var s = S.line(ex, ey, fx, fy, col, apagada ? 3 : 7);
    if (apagada) s = S.line(ex, ey, fx, fy, col, 3, '8 8');
    s += S.circle(fx + 14, fy + (sentido === 1 ? 16 : -16), 17, apagada ? '#eceff1' : col, '#fff', 2.5);
    s += S.txt(fx + 14, fy + (sentido === 1 ? 22 : -10), String(num),
      { size: 19, weight: '700', fill: apagada ? COL.gris : '#ffffff' });
    return s;
  }

  /* ==================================================================
     6 · ecuacionDet · La incógnita dentro del determinante
     ================================================================== */

  /* texto llano de un polinomio del núcleo */
  function polTxt(p, letra) { return TP(S.pTex(p, letra)); }
  /* aproximación decimal con coma, para las raíces irracionales */
  function dec(x) {
    if (!isFinite(x)) return '\u2014';
    var t = (Math.round(x * 1000) / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    return t.replace('.', ',').replace(/^-/, '\u2212');
  }

  R.ecuacionDet = function (node) {
    return S.shell(node, 'Ecuaciones con la incógnita dentro de un determinante',
      'Escribe una matriz <b>cuadrada de orden 2 o 3</b> cuyas entradas pueden llevar la ' +
      'incógnita. Las filas se separan con <code>;</code> y los elementos con espacios, igual que ' +
      'siempre; en cada elemento se admite un polinomio en la letra elegida: <code>x</code>, ' +
      '<code>x-1</code>, <code>2x+3</code>, <code>x^2</code>, además de enteros, decimales con ' +
      'coma y fracciones. Un ejemplo copiable: <code>x 2; 8 x</code>. Elige a qué número se ' +
      'iguala el determinante (normalmente <code>0</code>) y el applet desarrolla el polinomio, ' +
      'lo resuelve y comprueba cada solución sustituyéndola en la matriz.',
      [
        { id: 'txt', label: 'Matriz con incógnita', type: 'text', value: 'x 2; 8 x', ancho: '20rem' },
        { id: 'letra', label: 'Incógnita', type: 'select', value: 'x', options: [
          { value: 'x', label: 'x' }, { value: 'k', label: 'k' }, { value: 'm', label: 'm' }
        ] },
        { id: 'val', label: 'El determinante vale', type: 'text', value: '0', ancho: '7rem' },
        escenarios([
          { txt: 'x² − 16 = 0', tit: 'Dos soluciones enteras', set: { txt: 'x 2; 8 x', letra: 'x', val: '0' } },
          { txt: 'ecuación de primer grado', tit: 'El determinante es lineal en x', set: { txt: 'x 1; 3 2', letra: 'x', val: '0' } },
          { txt: 'igual a un número', tit: 'No siempre se iguala a cero', set: { txt: 'x 1; 3 2', letra: 'x', val: '5' } },
          { txt: '3×3 con x en la diagonal', set: { txt: 'x 1 1; 1 x 1; 1 1 x', letra: 'x', val: '0' } },
          { txt: '3×3, solución doble', set: { txt: '1 1 1; 1 x 1; 1 1 x', letra: 'x', val: '0' } },
          { txt: 'parámetro k', tit: 'La misma técnica con otra letra', set: { txt: 'k-1 2; 3 k', letra: 'k', val: '0' } },
          { txt: 'sin solución racional', tit: 'Las raíces no son números racionales', set: { txt: 'x 1; 1 x', letra: 'x', val: '2' } },
          { txt: 'se cumple siempre', tit: 'El determinante no depende de x', set: { txt: 'x x; 1 1', letra: 'x', val: '0' } }
        ])
      ],
      guarda(function (v) {
        var letra = String(v.letra || 'x').toLowerCase();
        var t = String(v.txt === undefined ? '' : v.txt).trim();
        if (t === '') {
          throw Error('Falta la matriz. Escribe una matriz cuadrada de orden 2 o 3 con la ' +
            'incógnita dentro, por ejemplo ' + letra + ' 2; 8 ' + letra + '.');
        }
        var Q = S.parseMatParam(t, letra);
        if (Q.f !== Q.c) {
          throw Error('Solo tienen determinante las matrices cuadradas, y esta es de ' +
            Q.f + '×' + Q.c + '. Escribe por ejemplo ' + letra + ' 2; 8 ' + letra + '.');
        }
        if (Q.f < 2 || Q.f > 3) {
          throw Error('Este applet trabaja con matrices de orden 2 o de orden 3, y has escrito ' +
            'una de orden ' + Q.f + '. Escribe por ejemplo ' + letra + ' 1 1; 1 ' + letra +
            ' 1; 1 1 ' + letra + '.');
        }
        var b = leeNum(v.val, 'el valor al que se iguala el determinante');
        var info = S.polDeMatriz(Q, letra);
        var pol = info.pol;
        var q = S.pResta(pol, S.pDe([b]));
        var grado = S.pGrado(q);
        var n = Q.f;

        var h = enun('Cuando dentro de un determinante hay una incógnita, el determinante deja ' +
          'de ser un número y pasa a ser un <b>polinomio</b>. La ecuación se resuelve en dos ' +
          'tiempos: primero se <b>desarrolla</b> el determinante, y después se resuelve la ' +
          'ecuación polinómica que sale.');

        h += figuraDet([{
          f: n, c: n,
          celda: function (i, j) { return polTxt(Q.A[i][j], letra); },
          nombre: 'A(' + letra + ')', rot: true, barras: true
        }], {
          titulo: 'Determinante con la incógnita ' + letra + ' dentro',
          subtitulo: 'orden ' + n + ': cada elemento puede ser un polinomio en ' + letra,
          pie: '|A| = ' + polTxt(pol, letra),
          label: 'Determinante de orden ' + n + ' con la incógnita dentro',
          cap: 'Al desarrollar sin sustituir la incógnita queda el polinomio $' +
            S.pTex(pol, letra) + '$.'
        });

        h += S.paso(1, 'Se desarrolla el determinante dejando $' + letra + '$ sin sustituir: ' +
          K('|A| = ' + S.pTex(pol, letra)) + '.');
        h += S.paso(2, 'Se plantea la ecuación: ' +
          K(S.pTex(pol, letra) + ' = ' + FT(b)) + '.');
        h += S.paso(3, 'Se pasa todo a un miembro: ' +
          K(S.pTex(q, letra) + ' = 0') + '.');

        if (S.pEsCero(q)) {
          h += S.resultado(K('\\text{todo } ' + letra), 'la igualdad se cumple para cualquier valor');
          h += avisoSuave('El determinante no depende de $' + letra + '$ (vale siempre $' +
            FT(b) + '$), así que la igualdad se cumple para <b>cualquier</b> valor de $' +
            letra + '$. No es una ecuación de verdad.');
          return h;
        }
        if (grado === 0) {
          h += S.resultado(K('\\text{sin soluci\\acute{o}n}'), 'ningún valor cumple la igualdad');
          h += avisoSuave('El determinante vale siempre $' + FT(S.pIndep(pol)) +
            '$, que no es $' + FT(b) + '$: <b>ningún</b> valor de $' + letra +
            '$ cumple la igualdad.');
          return h;
        }

        var rr = S.raicesRacionales(q);
        var raices = rr.raices;
        var cuad = grado === 2 ? S.solCuadratica(q[2], q[1], q[0]) : null;

        h += S.paso(4, 'Se resuelve la ecuación de grado ' + grado + '.' +
          (grado === 2 && cuad
            ? ' Con la fórmula de la ecuación de segundo grado, el discriminante vale ' +
              K('\\Delta = ' + cuad.disc) + '.'
            : ' Se buscan las raíces racionales con Ruffini.'));

        if (raices.length) {
          var fac = S.factorizaPol(q);
          h += S.expr('Factorización', S.pTex(q, letra) + ' = ' +
            S.factorizaTexPol(fac, letra));
          h += S.resultado(K(raices.map(function (r) {
            return letra + ' = ' + FT(r.raiz);
          }).join(', \\quad ')), raices.length === 1 ? 'única solución racional' : 'soluciones');

          var filasC = raices.map(function (r) {
            var Msus = S.evalParam(Q, r.raiz);
            var dv = S.det(Msus);
            return [
              K(letra + ' = ' + FT(r.raiz)),
              r.mult > 1 ? 'multiplicidad ' + r.mult : 'simple',
              K(S.detTex(Msus)),
              K(FT(dv)),
              dv.cmp(b) === 0 ? S.badge('correcta', 'si') : S.badge('revisar', 'no')
            ];
          });
          h += S.tabla(['Solución', 'Tipo', 'Matriz sustituida', 'Su determinante', 'Comprobación'],
            filasC, { thPrimera: true });

          /* figura con las matrices ya sustituidas (como mucho dos) */
          var muestra = raices.slice(0, 2);
          h += figuraDet(muestra.map(function (r, idx) {
            var Msus = S.evalParam(Q, r.raiz);
            return {
              f: n, c: n,
              celda: function (i, j) { return NT(Msus.a[i][j]); },
              nombre: letra + ' = ' + NT(r.raiz),
              rot: false, barras: true, op: idx === 0 ? null : '   '
            };
          }), {
            titulo: 'Comprobación: se sustituye cada solución',
            subtitulo: 'el determinante de cada matriz sustituida vale ' + NT(b),
            pie: muestra.map(function (r) {
              return letra + ' = ' + NT(r.raiz) + ' \u2192 |A| = ' +
                NT(S.det(S.evalParam(Q, r.raiz)));
            }).join(' ; '),
            label: 'Matrices obtenidas al sustituir cada solución',
            cap: 'Al sustituir, el determinante vale exactamente $' + FT(b) + '$.'
          });
        } else if (cuad && cuad.disc > 0) {
          h += avisoSuave('La ecuación tiene dos soluciones <b>reales pero no racionales</b>. ' +
            'Aproximadamente $' + letra + ' \\approx ' + esc(dec(cuad.raices[0].val())) +
            '$ y $' + letra + ' \\approx ' + esc(dec(cuad.raices[1].val())) + '$.');
          h += S.resultado(K('\\Delta = ' + cuad.disc + ' > 0'), 'dos soluciones reales irracionales');
        } else if (cuad && cuad.disc === 0) {
          h += S.resultado(K(letra + ' = ' + dec(cuad.raices[0].val()).replace('\u2212', '-')),
            'solución doble');
        } else if (cuad) {
          h += S.resultado(K('\\Delta = ' + cuad.disc + ' < 0'), 'no hay ninguna solución real');
          h += avisoSuave('El discriminante es negativo: <b>ningún</b> número real hace que el ' +
            'determinante valga $' + FT(b) + '$.');
        } else {
          h += avisoSuave('Esta ecuación de grado ' + grado + ' no tiene raíces racionales, ' +
            'así que no se puede resolver con Ruffini. Prueba con otra matriz, por ejemplo ' +
            '<code>' + esc(letra) + ' 2; 8 ' + esc(letra) + '</code>.');
        }

        h += rejilla2([
          tarjeta('El polinomio del determinante',
            S.expr('', '|A(' + letra + ')| = ' + S.pTex(pol, letra), false) +
            '<p>Grado ' + S.pGrado(pol) + '. En una matriz de orden ' + n +
            ' el grado nunca pasa de ' + n + ', porque en cada sumando hay ' + n +
            ' factores y cada uno aporta como mucho un grado.</p>'),
          tarjeta('Para qué sirve',
            '<p>Resolver $|A| = 0$ es exactamente localizar los valores del parámetro para los ' +
            'que la matriz <b>no tiene inversa</b> y su rango baja. Es la herramienta central de ' +
            'la discusión de sistemas con parámetro.</p>')
        ]);
        return h;
      }));
  };

  /* ==================================================================
     7 · areaDet · Área de un triángulo por determinantes
     ================================================================== */
  function leePunto(txt, nombre) {
    var t = String(txt === undefined || txt === null ? '' : txt).trim();
    if (t === '') {
      throw Error('Faltan las coordenadas del punto ' + nombre +
        '. Escribe las dos coordenadas separadas por un espacio, por ejemplo 2 4.');
    }
    var p = t.replace(/[;()]/g, ' ').split(/\s+/).filter(function (s) { return s !== ''; });
    /* Primero el TIPO: lo que no es un número no cuenta como coordenada, y
       decirlo evita el aviso absurdo de «has escrito 4 coordenadas». */
    var malos = noNumeros(p);
    if (malos.length) {
      throw Error('En el punto ' + nombre + ' hay algo que no es un número: ' +
        malos.map(function (s) { return '«' + s + '»'; }).join(', ') +
        '. Cada coordenada tiene que ser un número: entero (2), decimal con coma (1,5) o ' +
        'fracción (1/2). Escribe los dos números separados por un espacio, por ejemplo 2 4.');
    }
    if (p.length !== 2) {
      throw Error('El punto ' + nombre + ' necesita exactamente DOS coordenadas separadas por un ' +
        'espacio, y has escrito ' + p.length + ' número' + (p.length === 1 ? '' : 's') +
        '. Por ejemplo 2 4, o 1,5 -2 con decimales de coma.');
    }
    return [F(p[0]), F(p[1])];
  }

  R.areaDet = function (node) {
    return S.shell(node, 'Área de un triángulo por determinantes',
      'Escribe las coordenadas de tres puntos, cada uno con sus dos números separados por un ' +
      '<b>espacio</b>: por ejemplo <code>2 4</code>, o <code>1,5 -2</code> con decimales de coma, ' +
      'o <code>1/2 3</code> con fracciones. El applet dibuja el triángulo y calcula su área con ' +
      'la fórmula del <b>medio determinante</b> de orden 3 que se obtiene poniendo las ' +
      'coordenadas de los tres puntos en las dos primeras columnas y una columna de <b>unos</b> ' +
      'en la tercera. El signo del determinante indica el sentido en que se recorren los tres ' +
      'vértices.',
      [
        { id: 'p1', label: 'Punto A', type: 'text', value: '0 0', ancho: '7rem' },
        { id: 'p2', label: 'Punto B', type: 'text', value: '5 1', ancho: '7rem' },
        { id: 'p3', label: 'Punto C', type: 'text', value: '2 4', ancho: '7rem' },
        { id: 'azar', label: 'Triángulo al azar', type: 'button', click: function (ctl) {
          function r() { return String(Math.round(Math.random() * 12) - 6); }
          pon(ctl, { p1: r() + ' ' + r(), p2: r() + ' ' + r(), p3: r() + ' ' + r() });
        } },
        escenarios([
          { txt: 'triángulo básico', tit: 'Sentido antihorario, determinante positivo', set: { p1: '0 0', p2: '5 1', p3: '2 4' } },
          { txt: 'orientación negativa', tit: 'Los mismos puntos en el orden contrario', set: { p1: '0 0', p2: '2 4', p3: '5 1' } },
          { txt: 'triángulo rectángulo', tit: 'Base 6 y altura 4', set: { p1: '0 0', p2: '6 0', p3: '0 4' } },
          { txt: 'puntos alineados', tit: 'Área 0: no hay triángulo', set: { p1: '0 0', p2: '2 2', p3: '5 5' } },
          { txt: 'con coordenadas negativas', set: { p1: '-4 -2', p2: '3 -3', p3: '1 4' } },
          { txt: 'con decimales', set: { p1: '0,5 1', p2: '4 0,5', p3: '2 3,5' } },
          { txt: 'triángulo grande', set: { p1: '-8 -6', p2: '9 -4', p3: '0 8' } }
        ])
      ],
      guarda(function (v) {
        var P = leePunto(v.p1, 'A'), Q = leePunto(v.p2, 'B'), T = leePunto(v.p3, 'C');
        var M = S.matDe([
          [P[0], P[1], F(1)],
          [Q[0], Q[1], F(1)],
          [T[0], T[1], F(1)]
        ]);
        var D = S.det(M);
        var Rs = S.sarrus(M);
        var area = abs(D).entre(F(2));

        var h = enun('El área de un triángulo de vértices $A(x_1, y_1)$, $B(x_2, y_2)$ y ' +
          '$C(x_3, y_3)$ es la <b>mitad del valor absoluto</b> de un determinante de orden 3 ' +
          'cuya tercera columna es una columna de unos.');
        h += S.expr('Fórmula',
          '\\text{área} = \\frac{1}{2} \\left| \\begin{vmatrix} x_1 & y_1 & 1 \\\\ ' +
          'x_2 & y_2 & 1 \\\\ x_3 & y_3 & 1 \\end{vmatrix} \\right|');

        var xs = [P[0].val(), Q[0].val(), T[0].val()];
        var ys = [P[1].val(), Q[1].val(), T[1].val()];
        var xmin = Math.min.apply(Math, xs.concat([0])), xmax = Math.max.apply(Math, xs.concat([0]));
        var ymin = Math.min.apply(Math, ys.concat([0])), ymax = Math.max.apply(Math, ys.concat([0]));
        var mx = Math.max(1, (xmax - xmin) * 0.22), my = Math.max(1, (ymax - ymin) * 0.22);

        h += figEjes({
          xmin: xmin - mx, xmax: xmax + mx, ymin: ymin - my, ymax: ymax + my,
          titulo: 'Triángulo de vértices A, B y C',
          subtitulo: cero(D)
            ? 'los tres puntos est\u00e1n alineados: el tri\u00e1ngulo es degenerado'
            : 'recorrido A \u2192 B \u2192 C en sentido ' +
              (neg(D) ? 'horario (determinante negativo)' : 'antihorario (determinante positivo)'),
          poligonos: cero(D) ? [] : [{
            pts: [[xs[0], ys[0]], [xs[1], ys[1]], [xs[2], ys[2]]],
            fill: neg(D) ? 'rgba(198,40,40,.16)' : 'rgba(46,125,50,.16)',
            stroke: neg(D) ? COL.rojo : COL.verde, sw: 3
          }],
          puntos: [
            { x: xs[0], y: ys[0], col: COL.azul, txt: 'A', dy: -22 },
            { x: xs[1], y: ys[1], col: COL.morado, txt: 'B', dy: -22 },
            { x: xs[2], y: ys[2], col: COL.teal, txt: 'C', dy: -22 }
          ],
          pie: 'Área = |' + NT(D) + '| : 2 = ' + NT(area),
          label: 'Triángulo dibujado sobre unos ejes con sus tres vértices marcados',
          cap: 'El área es la mitad del valor absoluto del determinante: $' + FT(area) + '$.'
        });

        h += figuraUna(M, {
          titulo: 'El determinante de las coordenadas',
          subtitulo: 'una fila por vértice y una tercera columna de unos',
          nombre: 'coordenadas', barras: true, rot: false,
          colorCelda: function (i, j) { return j === 2 ? COL.naranja : COL.texto; },
          lineas: [
            { txt: 'suman (diagonales descendentes): ' + NT(Rs.sumaPositivos), col: COL.verde },
            { txt: 'restan (diagonales ascendentes): ' + NT(Rs.sumaNegativos), col: COL.rojo },
            { txt: 'determinante = ' + NT(Rs.sumaPositivos) + ' \u2212 ' + PT(Rs.sumaNegativos) +
                ' = ' + NT(D), col: COL.azulOsc, size: 22 },
            { txt: 'área = |' + NT(D) + '| : 2 = ' + NT(area), col: COL.azulOsc, size: 22 }
          ],
          pie: 'La columna de unos (en naranja) es siempre la misma',
          label: 'Determinante de orden 3 con las coordenadas de los tres vértices',
          cap: 'Se calcula por la regla de Sarrus, como cualquier determinante de orden 3.'
        });

        h += S.resultado(K('\\text{área} = ' + FT(area)), 'unidades de superficie');
        h += S.kvs([
          'determinante: ' + K(FT(D)),
          'valor absoluto: ' + K(FT(abs(D))),
          'área: ' + K('\\frac{1}{2} \\cdot ' + FT(abs(D)) + ' = ' + FT(area)),
          cero(D) ? S.badge('puntos alineados', 'no')
            : (neg(D) ? S.badge('sentido horario', 'info') : S.badge('sentido antihorario', 'si'))
        ]);

        h += S.tabla(['Paso', 'Qué se hace', 'Resultado'], [
          [S.paso(1, 'Se monta el determinante'), K(S.detTex(M)), ''],
          [S.paso(2, 'Se calcula por Sarrus'),
            K(S.sumandosTex(Rs.positivos.map(function (t) { return FT(t.valor); })) +
              ' - \\left(' + S.sumandosTex(Rs.negativos.map(function (t) { return FT(t.valor); })) +
              '\\right)'), K(FT(D))],
          [S.paso(3, 'Se toma el valor absoluto'), K('|' + FT(D) + '|'), K(FT(abs(D)))],
          [S.paso(4, 'Se divide entre 2'), K('\\frac{' + FT(abs(D)) + '}{2}'), K(FT(area))]
        ], { thPrimera: false });

        h += rejilla3([
          tarjeta('Vértices',
            S.expr('', 'A(' + FT(P[0]) + ',\\ ' + FT(P[1]) + ')', false) +
            S.expr('', 'B(' + FT(Q[0]) + ',\\ ' + FT(Q[1]) + ')', false) +
            S.expr('', 'C(' + FT(T[0]) + ',\\ ' + FT(T[1]) + ')', false)),
          tarjeta('Qué significa el signo',
            '<p>El determinante da el <b>doble del área con signo</b>. Es positivo si al recorrer ' +
            '$A \\to B \\to C$ se gira en sentido contrario a las agujas del reloj, y negativo si ' +
            'se gira en el sentido de las agujas. Al intercambiar dos vértices, el determinante ' +
            'cambia de signo (propiedad 3) pero el área no cambia.</p>',
            cero(D) ? '' : 'ap-card-ok'),
          tarjeta('El caso degenerado',
            '<p>Si el determinante es <b>cero</b>, los tres puntos están <b>alineados</b>: no hay ' +
            'triángulo, el área es 0. Es el criterio más rápido para saber si tres puntos son ' +
            'colineales.</p>' +
            (cero(D) ? '<p><b>Es justo lo que pasa aquí.</b></p>' : ''))
        ]);

        if (cero(D)) {
          h += avisoSuave('Los tres puntos que has escrito están <b>alineados</b>, así que el ' +
            'determinante vale 0 y el área también. Mueve uno de ellos para ver un triángulo de ' +
            'verdad.');
        }
        h += nota('El área siempre se mide en <b>unidades de superficie</b> y nunca es negativa: ' +
          'por eso la fórmula lleva valor absoluto. Aquí el determinante vale $' + FT(D) +
          '$ y el área $' + FT(area) + '$.');
        return h;
      }));
  };

  /* ==================================================================
     cierre del módulo
     ================================================================== */
  window.DET.extraA = true;
  if (S.monta) S.monta();
})();
