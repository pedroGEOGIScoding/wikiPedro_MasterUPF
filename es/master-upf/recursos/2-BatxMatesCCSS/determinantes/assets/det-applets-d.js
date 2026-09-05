/* =====================================================================
   det-applets-d.js · Módulo D del Tema 2 «Determinantes»
   2.º de Bachillerato · Matemáticas Aplicadas a las Ciencias Sociales
   Ruta: 2-BatxMatesCCSS/determinantes/assets/det-applets-d.js

   Cubre los archivos 08 y 09 del tema:

     2.8  Determinantes de cualquier orden.
     2.9  Cálculo de un determinante haciendo ceros.

   ---------------------------------------------------------------------
   CLAVES REGISTRADAS (6)
   ---------------------------------------------------------------------
     orden4            Determinante de orden 4 paso a paso. Matriz 4×4
                       editable. El applet elige la mejor línea (la que
                       más ceros tiene), la resalta y desarrolla en
                       cuatro determinantes de orden 3, cada uno de los
                       cuales se resuelve después por la regla de
                       Sarrus. La figura es una cascada de tres niveles
                       y un botón la va descubriendo nivel a nivel, de
                       modo que se ve la recursión.
     recursivo         El árbol de la recursión para un orden n entre 2
                       y 5: un determinante de orden n se parte en n de
                       orden n−1, y así hasta el orden 2. Se dibuja el
                       árbol (con los niveles muy poblados representados
                       de forma agregada) y se cuenta cuántos nodos hay
                       en cada nivel.
     coste             El coste de calcular. Compara el número de
                       multiplicaciones que hacen falta con tres
                       métodos: la definición general (n! sumandos de n
                       factores), el desarrollo por adjuntos sin ceros y
                       el desarrollo después de hacer ceros. Tabla y
                       gráfico de barras para n de 2 a 6, con escala
                       logarítmica opcional.
     hacerCeros        Método de hacer ceros (el applet central del
                       módulo). Matriz de orden 3, 4 o 5. Usa
                       DET.hacerCeros: matriz inicial, cada operación
                       Fi → Fi + k·Fj con su descripción y su matriz
                       resultante, hasta que la columna del pivote se
                       queda con un único elemento no nulo, y entonces
                       el desarrollo con un solo término. Botón de paso
                       a paso y botón de resolver entero; en cada paso
                       se resalta la fila que cambia y el pivote.
     pivote            Elegir el pivote. El alumno dice en qué posición
                       quiere el pivote y el applet ejecuta el método
                       desde ahí, contando las operaciones y avisando
                       de las fracciones que van a aparecer. La tabla
                       comparativa entre su elección y la elección
                       recomendada enseña por qué conviene un pivote
                       igual a 1 o a −1.
     laboratorioCeros  Laboratorio libre de transformaciones. El alumno
                       aplica las que quiera (Fi ↔ Fj, Fi → k·Fi,
                       Fi → Fi + k·Fj) y el applet lleva la cuenta
                       EXACTA de cómo cambia el determinante: signo
                       acumulado por los intercambios y factor
                       acumulado por los productos, mostrando en todo
                       momento la relación entre el determinante de la
                       matriz actual y el de la original. Botones de
                       deshacer y de reiniciar.

   El applet `diagnostico` vive en el núcleo: aquí no se reprograma.

   ---------------------------------------------------------------------
   DEPENDENCIAS
   ---------------------------------------------------------------------
   Necesita, cargados antes:
     · el núcleo   det-applets.js       (window.DET: shell, SVG, KaTeX)
     · la capa     det-applets-alg.js   (álgebra matricial exacta)
     · la capa     det-applets-det.js   (determinantes del tema)

   De las capas se usan, sin reimplementar ni una sola cuenta:
     parseMat, matTxt, matTex, matIdentidad, dimTxt, det, opElemental,
     fracDe, fracTex, sarrus, desarrollo, mejorLinea, hacerCeros,
     detPropiedades, subMat, signoAdj, numTxtDet, parTxtDet, detTex.
   Del núcleo: shell, registry, K, KD, esc, texifica, expr, paso, tabla,
   badge, kvs, resultado, svgWrap, altoDibujado, txt, line, rect,
   circle, poly, path, leyenda, COL, Frac.

   ---------------------------------------------------------------------
   CRITERIOS DE PRESENTACIÓN
   ---------------------------------------------------------------------
   1. Aritmética EXACTA con DET.Frac (BigInt): al hacer ceros aparecen
      1/2 o −7/3, nunca 0,5 ni 2,3333.
   2. Dentro de un <svg> NO hay KaTeX: en los <text> solo texto plano
      con Unicode (subíndices ₁₂₃, ·, ×, −  U+2212, ≠, →). Las fórmulas
      bonitas van fuera, en el pie de la figura o en los pasos.
   3. Índices siempre en BASE 1: «F₂ → F₂ − 3·F₁», «fila 1, columna 3».
   4. Coma decimal y sumandos negativos entre paréntesis: «+ (−3)».
   5. Ancho de todas las figuras ≥ 700 px; celdas ≥ 20 px de cuerpo;
      rótulos ≥ 16 px en negrita. El alto se deriva del contenido con
      DET.altoDibujado, así que no queda margen inferior vacío.
   6. Ninguna entrada mala rompe la página: todo el cómputo va envuelto
      en safe(), que convierte cualquier Error en un aviso explicativo
      con un ejemplo copiable. Los avisos no se acumulan.
   7. El título lo pone DET.shell como «Applet · <nombre>»: sin numerar.

   Clases CSS propias: prefijo `detd-`, ya presentes en det-applets.css.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.DET;
  if (!S) {
    if (window.console && console.error) {
      console.error('[determinantes] det-applets-d.js necesita det-applets.js cargado antes.');
    }
    return;
  }

  var R = S.registry;
  var K = S.K, KD = S.KD, COL = S.COL;
  var Frac = S.Frac;

  /* ==================================================================
     0 · utilidades locales del módulo
     ================================================================== */

  /* Acceso perezoso a las capas: si faltan, el aviso es claro. */
  function cap() {
    if (!S.parseMat || !S.hacerCeros || !S.sarrus || !S.desarrollo) {
      throw Error('No se han cargado las capas de álgebra del tema ' +
        '(det-applets-alg.js y det-applets-det.js). Recarga la página; si el aviso sigue, ' +
        'avisa al profesor.');
    }
    return S;
  }

  function FR(v) { return cap().fracDe(v); }
  function FT(f) { return cap().fracTex(f, true); }
  function F0() { return new Frac(0); }
  function F1() { return new Frac(1); }
  function cero(f) { return f.n === 0n; }
  function igF(a, b) { return a.cmp(b) === 0; }
  function esEnt(f) { return f.d === 1n; }

  /* Número en TEXTO PLANO para los rótulos de los SVG: «−3», «1/2»,
     «−0,5». Signo menos tipográfico U+2212, coma decimal. */
  function NT(f) { return cap().numTxtDet(f); }
  /* Número entre paréntesis si es negativo, para escribir «+ (−3)». */
  function PT(f) { return cap().parTxtDet(f); }

  /* Subíndices Unicode para los rótulos de los SVG: F₁₂. */
  var SUB = ['\u2080', '\u2081', '\u2082', '\u2083', '\u2084',
    '\u2085', '\u2086', '\u2087', '\u2088', '\u2089'];
  function sub(n) {
    var s = String(n), out = '', i;
    for (i = 0; i < s.length; i++) out += SUB[Number(s.charAt(i))] || s.charAt(i);
    return out;
  }
  /* Nombre de fila en texto plano y BASE 1: F₃ */
  function FTX(i1) { return 'F' + sub(i1); }

  /* Plural RESUELTO: nunca se imprime «cero(s)» ni «vez/veces», que es
     una plantilla sin resolver, no castellano (auditoría: orden4 D1 y
     D2, hacerCeros).  plural(1,'cero','ceros') -> «1 cero».        */
  function plural(n, sing, plur) {
    var v = Number(n);
    return String(n) + ' ' + (Math.abs(v) === 1 ? sing : plur);
  }

  /* Ancho aproximado de un rótulo, en unidades del viewBox, para poder
     ajustar el ancho de la figura al contenido en vez de dejar un
     hueco muerto a un lado (auditoría: recursivo D1). Factores de la
     pila sans-serif del tema, medidos sobre el cuerpo de la letra. */
  function anchoTxt(s, size, bold) {
    s = String(s === undefined || s === null ? '' : s);
    var k = bold ? 1.05 : 1, w = 0, i, c;
    for (i = 0; i < s.length; i++) {
      c = s.charAt(i);
      if (c === ' ') w += 0.28;
      else if ('.,:;\u00b7\'|!ilI\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089'.indexOf(c) >= 0) w += 0.31;
      else if ('fjrt()[]{}-\u2212/\\'.indexOf(c) >= 0) w += 0.38;
      else if (c >= '0' && c <= '9') w += 0.56;
      else if (c >= 'A' && c <= 'Z') w += 0.66;
      else if ('mwMW\u2260\u2192\u21d2'.indexOf(c) >= 0) w += 0.86;
      else w += 0.55;
    }
    return Math.round(w * k * size);
  }
  /* Operación en texto plano y BASE 1: «F₃ → F₃ + (−2)·F₁» */
  function opTxt(i1, j1, k) {
    return FTX(i1) + ' \u2192 ' + FTX(i1) + ' + ' + PT(k) + '\u00b7' + FTX(j1);
  }
  /* La misma operación en LaTeX (fuera del SVG). */
  function opTex(i1, j1, k) {
    return 'F_{' + i1 + '} \\to F_{' + i1 + '} + \\left(' + FT(k) + '\\right)F_{' + j1 + '}';
  }

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

  var EJEMPLO = 'Escribe la matriz por filas: <code>2 1 3; 1 0 2; 3 2 1</code> ' +
    '(o una fila por línea). Valen enteros (<code>-2</code>), decimales con coma ' +
    '(<code>0,5</code>) y fracciones (<code>1/2</code>).';

  /* Envoltorio: cualquier error se convierte en un aviso amable dentro
     del applet, nunca en un error que rompa la página. */
  function safe(fn, ayuda) {
    return function (v, ctl, out, api) {
      try {
        var h = fn(v, ctl, out, api);
        return (h === undefined || h === null || h === '')
          ? '<div class="mx-bad detd-err">No hay nada que mostrar todavía: revisa los datos que ' +
            'has escrito. ' + (ayuda || EJEMPLO) + '</div>'
          : h;
      } catch (e) {
        var m = (e && e.message) ? e.message : 'No he podido calcular con estos datos.';
        return '<div class="mx-bad detd-err">' + S.texifica(S.esc(m)) +
          (ayuda ? '<br>' + ayuda : '') + '</div>';
      }
    };
  }

  /* Piezas de salida estándar del módulo. */
  function caja(label, tex) {
    return '<div class="detd-caja">' + S.expr(label, tex) + '</div>';
  }
  function parrafo(html) { return '<p class="detd-txt">' + html + '</p>'; }
  function titulo(t) { return '<h5 class="detd-h">' + t + '</h5>'; }
  function aviso(html) { return '<p class="detd-aviso">' + html + '</p>'; }
  function pista(html) { return '<p class="detd-pista"><b>Pista:</b> ' + html + '</p>'; }
  function bien(html) { return '<p class="detd-bien">' + html + '</p>'; }
  function mal(html) { return '<p class="detd-mal">' + html + '</p>'; }
  function op(tex) { return '<div class="detd-op">' + KD(tex) + '</div>'; }
  function avisos(lista) {
    if (!lista || !lista.length) return '';
    return '<ul class="detd-avisos"><li>' + lista.map(function (x) {
      return S.texifica(S.esc(x));
    }).join('</li><li>') + '</li></ul>';
  }

  /* ------------------------------------------------------------------
     Lectura de matrices con límites y avisos didácticos.
     ------------------------------------------------------------------ */
  function leeM(txtIn, etiqueta, maxN) {
    etiqueta = etiqueta || 'la matriz';
    var s = String(txtIn === undefined || txtIn === null ? '' : txtIn).trim();
    if (s === '') {
      throw Error('Escribe ' + etiqueta + ' por filas, separando los elementos con espacios y las ' +
        'filas con «;» o con un salto de línea. Por ejemplo: 2 1 3; 1 0 2; 3 2 1. También valen ' +
        'los decimales con coma (0,5) y las fracciones (1/2).');
    }
    var A = cap().parseMat(s);
    if (maxN && (A.f > maxN || A.c > maxN)) {
      throw Error('Este applet trabaja con matrices de orden ' + maxN + ' como máximo y has ' +
        'escrito una de ' + A.f + '×' + A.c + '. Quita alguna fila o alguna columna: así la matriz ' +
        'se ve grande y legible en pantalla.');
    }
    return A;
  }

  function leeCuadrada(txtIn, etiqueta, maxN) {
    var A = leeM(txtIn, etiqueta, maxN || 5);
    if (A.f !== A.c) {
      throw Error('Solo las matrices CUADRADAS tienen determinante, y ' + etiqueta + ' es de ' +
        A.f + '×' + A.c + '. El determinante se define para matrices con tantas filas como ' +
        'columnas: escribe una fila más o una columna menos. Por ejemplo: 2 1 3; 1 0 2; 3 2 1.');
    }
    return A;
  }

  function leeOrden(txtIn, etiqueta, n) {
    var A = leeCuadrada(txtIn, etiqueta, Math.max(5, n));
    if (A.f !== n) {
      throw Error('Este applet necesita ' + etiqueta + ' de orden ' + n + ' y has escrito una de ' +
        'orden ' + A.f + '. Escribe ' + n + ' filas con ' + n + ' elementos cada una, por ejemplo ' +
        (n === 4 ? '2 1 3 1; 1 0 2 4; 3 2 1 0; 1 1 1 1' : '2 1 3; 1 0 2; 3 2 1') + '.');
    }
    return A;
  }

  /* Orden 3, 4 o 5: los tres que tienen sentido para hacer ceros. */
  function leeOrden345(txtIn, etiqueta) {
    var A = leeCuadrada(txtIn, etiqueta, 5);
    if (A.f < 3) {
      throw Error('Escribe una matriz de orden 3, 4 o 5. Un determinante de orden ' + A.f +
        ' se resuelve de cabeza y no hace falta hacer ceros: para el orden 2 basta con ' +
        'a₁₁·a₂₂ − a₁₂·a₂₁. Prueba con 2 1 3; 1 0 2; 3 2 1.');
    }
    return A;
  }

  /* Entero de un campo numérico, con aviso propio. */
  function leeEnt(v, etiqueta, min, max) {
    var n = parseInt(String(v), 10);
    if (!isFinite(n)) {
      throw Error('Revisa ' + etiqueta + ': tiene que ser un número entero entre ' +
        min + ' y ' + max + ', y lo que hay escrito no es un número.');
    }
    if (n < min || n > max) {
      throw Error('Revisa ' + etiqueta + ': el número tiene que estar entre ' + min + ' y ' + max +
        ', y has escrito ' + n + '. Recuerda que las filas y las columnas se numeran desde 1.');
    }
    return n;
  }

  /* ¿Hay alguna fracción en la matriz? */
  function hayFracciones(A) {
    var i, j;
    for (i = 0; i < A.f; i++) for (j = 0; j < A.c; j++) if (!esEnt(A.a[i][j])) return true;
    return false;
  }

  /* ==================================================================
     1 · dibujo de determinantes y matrices en SVG
     (texto plano, celdas de 22 px, rótulos de 17 px en negrita)
     ================================================================== */

  /* Ancho de celda necesario para que ningún número toque al vecino. */
  function anchoCelda(A, size, minimo) {
    var largo = 1, i, j;
    for (i = 0; i < A.f; i++) {
      for (j = 0; j < A.c; j++) largo = Math.max(largo, NT(A.a[i][j]).length);
    }
    return Math.max(minimo || 44, Math.round(26 + largo * size * 0.62));
  }

  /* Dibuja un determinante (barras verticales) o una matriz (paréntesis)
     con la esquina superior izquierda en (x, y).
     o = { size, cw, ch, filaHi, colHi, marca:[[i,j]], colorHi, colorMarca,
           matriz:bool (paréntesis en vez de barras), apagada:[i,...] }
     Devuelve { b, w, h }: el cuerpo SVG y las medidas reales.        */
  function dibujaDet(A, x, y, o) {
    o = o || {};
    var size = o.size || 22;
    var cw = o.cw || anchoCelda(A, size, o.minCelda);
    var ch = o.ch || Math.round(size * 1.95);
    var mx = 18, my = 12;
    var w = A.c * cw + 2 * mx, h = A.f * ch + 2 * my;
    var b = '', i, j;

    b += S.rect(x, y, w, h, o.fondo || '#ffffff', o.borde || '#e3e9ef', { r: 8 });

    /* franja de la fila / columna resaltada */
    if (o.filaHi !== undefined && o.filaHi !== null && o.filaHi >= 0) {
      b += S.rect(x + 6, y + my + o.filaHi * ch, w - 12, ch,
        o.colorHi || 'rgba(224,123,0,.16)', 'none', { r: 6 });
    }
    if (o.colHi !== undefined && o.colHi !== null && o.colHi >= 0) {
      b += S.rect(x + mx + o.colHi * cw, y + 6, cw, h - 12,
        o.colorHi || 'rgba(25,118,210,.14)', 'none', { r: 6 });
    }
    (o.marca || []).forEach(function (p) {
      b += S.rect(x + mx + p[1] * cw + 3, y + my + p[0] * ch + 3, cw - 6, ch - 6,
        'none', o.colorMarca || COL.rojo, { r: 6, sw: 3 });
    });

    /* barras del determinante o paréntesis de la matriz */
    if (o.matriz) {
      b += S.path('M ' + (x + 13) + ' ' + (y + 6) + ' C ' + (x + 3) + ' ' + (y + h / 3) +
        ' ' + (x + 3) + ' ' + (y + 2 * h / 3) + ' ' + (x + 13) + ' ' + (y + h - 6),
        COL.eje, 2.6);
      b += S.path('M ' + (x + w - 13) + ' ' + (y + 6) + ' C ' + (x + w - 3) + ' ' + (y + h / 3) +
        ' ' + (x + w - 3) + ' ' + (y + 2 * h / 3) + ' ' + (x + w - 13) + ' ' + (y + h - 6),
        COL.eje, 2.6);
    } else {
      b += S.line(x + 8, y + 6, x + 8, y + h - 6, COL.eje, 2.6);
      b += S.line(x + w - 8, y + 6, x + w - 8, y + h - 6, COL.eje, 2.6);
    }

    /* los números */
    for (i = 0; i < A.f; i++) {
      for (j = 0; j < A.c; j++) {
        var apagada = (o.apagada || []).indexOf(i) >= 0;
        var esMarca = (o.marca || []).some(function (p) { return p[0] === i && p[1] === j; });
        b += S.txt(x + mx + (j + 0.5) * cw, y + my + (i + 0.5) * ch + size * 0.36,
          NT(A.a[i][j]),
          {
            size: size,
            weight: esMarca ? '700' : '600',
            fill: esMarca ? COL.rojo : (apagada ? COL.gris : COL.texto)
          });
      }
    }
    return { b: b, w: w, h: h };
  }

  /* Medida sin dibujar, para repartir el espacio antes de pintar. */
  function mideDet(A, o) {
    o = o || {};
    var size = o.size || 22;
    var cw = o.cw || anchoCelda(A, size, o.minCelda);
    var ch = o.ch || Math.round(size * 1.95);
    return { w: A.c * cw + 36, h: A.f * ch + 24, cw: cw, ch: ch };
  }

  /* Cierra una figura calculando el alto a partir de lo dibujado. */
  function cierra(b, W, label, cap2) {
    var H = S.altoDibujado(b) + 24;
    return S.svgWrap(b, W, H, label, cap2);
  }

  /* ==================================================================
     2 · Tema 2.8 · determinante de orden 4 paso a paso
     ================================================================== */

  /* Figura en cascada: nivel 1 el 4×4, nivel 2 los cuatro 3×3,
     nivel 3 el valor de cada uno por Sarrus, nivel 4 el total. */
  function figCascada4(D, sarr, nivel, total) {
    var W = 1020, b = '';
    var A = D.matriz;
    var esFila = D.tipo === 'fila';
    var i1 = D.indice1;

    b += S.txt(W / 2, 34, 'Cascada del determinante de orden 4', {
      size: 22, weight: '700', fill: COL.azulOsc
    });
    b += S.txt(W / 2, 62,
      'Nivel ' + nivel + ' de 4   \u00b7   desarrollo por la ' + (esFila ? 'fila ' : 'columna ') + i1,
      { size: 17, weight: '700', fill: COL.gris });

    /* --- nivel 1: el determinante de orden 4 --- */
    var m0 = mideDet(A, { size: 22, minCelda: 52 });
    var x0 = Math.round((W - m0.w) / 2), y0 = 86;
    var d0 = dibujaDet(A, x0, y0, {
      size: 22, minCelda: 52,
      filaHi: esFila ? D.indice : null,
      colHi: esFila ? null : D.indice
    });
    b += d0.b;
    b += S.txt(x0 - 14, y0 + d0.h / 2, 'orden 4', {
      size: 17, weight: '700', fill: COL.azulOsc, anchor: 'end'
    });
    b += S.txt(x0 + d0.w + 14, y0 + d0.h / 2,
      (esFila ? 'fila ' : 'columna ') + i1 + ': ' + plural(D.ceros, 'cero', 'ceros'), {
        size: 17, weight: '700', fill: COL.naranja, anchor: 'start'
      });

    var yBase = y0 + d0.h;
    if (nivel < 2) {
      b += S.txt(W / 2, yBase + 58, 'Pulsa «Paso siguiente» para partirlo en cuatro determinantes de orden 3',
        { size: 18, weight: '700', fill: COL.morado });
      return cierra(b, W, 'Cascada del determinante de orden 4',
        'Cada nivel de la cascada es una llamada más del desarrollo por los adjuntos.');
    }

    /* --- nivel 2: los cuatro determinantes de orden 3 --- */
    var hijos = D.terminos;
    var mh = mideDet(hijos[0].menorMat, { size: 21, minCelda: 44 });
    var hueco = 20;
    var anchoTotal = hijos.length * mh.w + (hijos.length - 1) * hueco;
    var xIni = Math.round((W - anchoTotal) / 2);
    var yh = yBase + 96;

    hijos.forEach(function (t, idx) {
      var xh = xIni + idx * (mh.w + hueco);
      /* conector desde el 4×4 */
      b += S.path('M ' + (x0 + d0.w / 2) + ' ' + (yBase + 6) +
        ' C ' + (x0 + d0.w / 2) + ' ' + (yBase + 48) +
        ' ' + (xh + mh.w / 2) + ' ' + (yh - 46) +
        ' ' + (xh + mh.w / 2) + ' ' + (yh - 8),
        cero(t.elem) ? COL.guia : COL.azul, cero(t.elem) ? 1.6 : 2.4,
        'none', cero(t.elem) ? '5 5' : null);
      /* rótulo del coeficiente con su signo */
      var sg = t.signo > 0 ? '+' : '\u2212';
      b += S.txt(xh + mh.w / 2, yh - 22,
        sg + ' ' + NT(t.elem) + ' \u00b7 (orden 3)', {
          size: 17, weight: '700', fill: cero(t.elem) ? COL.gris : COL.azulOsc
        });
      var dh = dibujaDet(t.menorMat, xh, yh, {
        size: 21, minCelda: 44,
        fondo: cero(t.elem) ? '#f7f9fb' : '#ffffff'
      });
      b += dh.b;
      var yPie = yh + dh.h;
      b += S.txt(xh + mh.w / 2, yPie + 26,
        (esFila ? 'a' : 'a') + sub(t.i1) + sub(t.j1) + ' = ' + NT(t.elem), {
          size: 17, weight: '700', fill: COL.texto
        });

      /* --- nivel 3: el valor de cada orden 3 por Sarrus --- */
      if (nivel >= 3) {
        if (cero(t.elem)) {
          b += S.txt(xh + mh.w / 2, yPie + 52, 'no hace falta:', { size: 16, weight: '700', fill: COL.gris });
          b += S.txt(xh + mh.w / 2, yPie + 74, 'el factor es 0', { size: 16, weight: '700', fill: COL.gris });
        } else {
          b += S.txt(xh + mh.w / 2, yPie + 52, 'Sarrus = ' + NT(t.menor),
            { size: 17, weight: '700', fill: COL.verde });
          b += S.txt(xh + mh.w / 2, yPie + 76,
            'producto = ' + NT(t.producto), { size: 17, weight: '700', fill: COL.morado });
        }
      }
    });

    if (nivel >= 4) {
      var yT = S.altoDibujado(b) + 34;
      var textoSuma = D.terminos.map(function (t) { return NT(t.producto); });
      b += S.rect(160, yT - 26, W - 320, 62, '#eef7ee', COL.verde, { r: 10, sw: 2 });
      b += S.txt(W / 2, yT + 2, S.sumandosTxt(textoSuma) + ' = ' + NT(total),
        { size: 21, weight: '700', fill: COL.verde });
      b += S.txt(W / 2, yT + 26, 'determinante de orden 4', { size: 16, weight: '700', fill: COL.gris });
    }
    return cierra(b, W, 'Cascada del determinante de orden 4',
      'Cada nivel de la cascada es una llamada más del desarrollo por los adjuntos: ' +
      'el orden 4 se convierte en cuatro determinantes de orden 3 y cada uno de ellos se ' +
      'resuelve con la regla de Sarrus.');
  }

  R.orden4 = function (node) {
    var nivel = 1;
    function reinicia() { nivel = 1; }

    return S.shell(node, 'Determinante de orden 4 paso a paso',
      'La regla de Sarrus <b>solo vale para el orden 3</b>. Un determinante de orden 4 se calcula ' +
      'desarrollándolo por los adjuntos de una línea: se convierte en <b>cuatro determinantes de ' +
      'orden 3</b>, y cada uno de esos ya se resuelve por Sarrus. Escribe una matriz <b>de orden 4</b> ' +
      'por filas: <code>2 1 3 1; 1 0 2 4; 3 2 1 0; 1 1 1 1</code> (o una fila por línea). Valen ' +
      'fracciones: <code>1/2 3 0 1; 0 -2 1 1; 1 1 1 0; 2 0 1 1</code>. Con <b>Paso siguiente</b> ' +
      'la cascada se descubre nivel a nivel; con <b>Ver todo</b> aparece completa.',
      [
        {
          id: 'A', label: 'Matriz de orden 4 (una fila por línea)', type: 'textarea', rows: 5,
          value: '2 1 3 1\n1 0 2 4\n3 2 1 0\n1 1 1 1', ancho: '19rem'
        },
        {
          id: 'linea', label: 'Línea del desarrollo', type: 'select', value: 'mejor', ancho: '14rem',
          options: [
            { value: 'mejor', label: 'la mejor (más ceros)' },
            { value: 'f1', label: 'fila 1' },
            { value: 'f2', label: 'fila 2' },
            { value: 'f3', label: 'fila 3' },
            { value: 'f4', label: 'fila 4' },
            { value: 'c1', label: 'columna 1' },
            { value: 'c2', label: 'columna 2' },
            { value: 'c3', label: 'columna 3' },
            { value: 'c4', label: 'columna 4' }
          ]
        },
        {
          id: 'siguiente', label: 'Paso siguiente', type: 'button',
          click: function () { nivel = Math.min(4, nivel + 1); }
        },
        { id: 'todo', label: 'Ver todo', type: 'button', click: function () { nivel = 4; } },
        { id: 'reinicia', label: 'Reiniciar', type: 'button', click: reinicia },
        chips([
          {
            txt: 'Clásico sin ceros', tip: 'los cuatro menores hay que calcularlos',
            set: { A: '2 1 3 1\n1 0 2 4\n3 2 1 0\n1 1 1 1', linea: 'mejor' }, extra: reinicia
          },
          {
            txt: 'Con una fila de tres ceros', tip: 'la mejor línea deja un solo menor',
            set: { A: '1 2 3 4\n0 0 5 0\n2 1 0 3\n1 1 2 2', linea: 'mejor' }, extra: reinicia
          },
          {
            txt: 'Triangular superior', tip: 'el determinante es el producto de la diagonal',
            set: { A: '2 5 1 3\n0 3 4 1\n0 0 -1 2\n0 0 0 4', linea: 'mejor' }, extra: reinicia
          },
          {
            txt: 'Determinante nulo (F₄ = F₁ + F₂)', tip: 'una fila es combinación de las otras',
            set: { A: '1 2 3 1\n2 1 0 1\n0 1 1 1\n3 3 3 2', linea: 'mejor' }, extra: reinicia
          },
          {
            txt: 'Con fracciones', tip: 'la aritmética sigue siendo exacta',
            set: { A: '1/2 3 0 1\n0 -2 1 1\n1 1 1 0\n2 0 1 1', linea: 'mejor' }, extra: reinicia
          },
          {
            txt: 'Peor elección: fila 1', tip: 'compara el trabajo con el de la mejor línea',
            set: { A: '1 2 3 4\n0 0 5 0\n2 1 0 3\n1 1 2 2', linea: 'f1' }, extra: reinicia
          },
          {
            txt: 'Por la columna 1', tip: 'da lo mismo desarrollar por filas o por columnas',
            set: { A: '2 1 3 1\n1 0 2 4\n3 2 1 0\n1 1 1 1', linea: 'c1' }, extra: reinicia
          },
          {
            txt: 'Identidad de orden 4', tip: 'vale 1, y la cascada lo enseña',
            set: { A: '1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 0 1', linea: 'mejor' }, extra: reinicia
          }
        ])
      ],
      safe(function (v) {
        var A = leeOrden(v.A, 'la matriz', 4);
        var tipo, idx;
        if (v.linea === 'mejor') {
          var ml = cap().mejorLinea(A);
          tipo = ml.tipo; idx = ml.indice;
        } else {
          tipo = v.linea.charAt(0) === 'f' ? 'fila' : 'columna';
          idx = Number(v.linea.charAt(1)) - 1;
        }
        var D = cap().desarrollo(A, tipo, idx);
        var total = D.total;
        var ML = cap().mejorLinea(A);

        var h = caja('Determinante de partida, de orden 4', cap().detTex(A));

        h += titulo('Nivel 1 · elegir la línea del desarrollo');
        h += parrafo(S.esc(ML.descripcion) + ' Aquí se desarrolla por la <b>' + D.tipo + ' ' +
          D.indice1 + '</b>, que tiene <b>' + D.ceros + '</b> ' +
          (D.ceros === 1 ? 'cero' : 'ceros') + ': cada cero se ahorra un ' +
          'determinante de orden 3 entero, porque su sumando vale 0.');
        h += caja('La línea elegida, resaltada',
          cap().matTex(A, { marca: D.terminos.map(function (t) { return [t.i, t.j]; }) }));
        if (D.ceros < ML.ceros) {
          h += aviso('La <b>' + ML.tipo + ' ' + ML.indice1 + '</b> tiene ' +
            plural(ML.ceros, 'cero', 'ceros') +
            ', más que la que has elegido: por ahí saldrían menos cuentas. El resultado ' +
            'es el mismo por cualquiera de las ocho líneas, pero el trabajo no.');
        }

        h += titulo('Nivel 2 · partirlo en cuatro determinantes de orden 3');
        h += parrafo('El determinante es la suma de los productos de los elementos de la línea ' +
          'elegida por sus adjuntos: ' + K('|A| = \\sum a_{ij}\\cdot A_{ij}') + ', y cada adjunto ' +
          'es ' + K('A_{ij} = (-1)^{i+j}\\alpha_{ij}') + ', con ' + K('\\alpha_{ij}') +
          ' un determinante de <b>orden 3</b>. Ahí está la recursión: el orden 4 se apoya en el orden 3.');
        h += caja('Desarrollo planteado', D.tex);

        if (nivel >= 2) {
          D.terminos.forEach(function (t, k2) {
            var cuerpo = '<p>' + S.esc('Término ' + (k2 + 1) + ': el elemento a' + t.i1 + t.j1 +
              ' vale ' + NT(t.elem) + ' y su signo es ' + (t.signo > 0 ? '+' : '\u2212') +
              ' porque ' + t.i1 + ' + ' + t.j1 + ' = ' + (t.i1 + t.j1) +
              (t.signo > 0 ? ' es par.' : ' es impar.')) + '</p>';
            if (cero(t.elem)) {
              cuerpo += '<p class="detd-bien">El elemento vale 0, así que este sumando es 0 ' +
                '<b>sin calcular el menor</b>: por eso conviene la línea con más ceros.</p>';
            } else {
              cuerpo += '<div class="detd-caja">' + KD('\\alpha_{' + t.i1 + t.j1 + '} = ' +
                cap().detTex(t.menorMat)) + '</div>';
              if (nivel >= 3) {
                var sr = cap().sarrus(t.menorMat);
                cuerpo += '<p>Por la regla de Sarrus (los tres productos de las diagonales ' +
                  'principales menos los tres de las secundarias):</p>';
                cuerpo += op(sr.tex);
                cuerpo += '<p>' + S.esc('Menor complementario α' + t.i1 + t.j1 + ' = ' +
                  NT(t.menor) + ', adjunto A' + t.i1 + t.j1 + ' = ' + NT(t.adjunto) +
                  ', y el sumando vale ' + NT(t.elem) + ' · ' + PT(t.adjunto) + ' = ' +
                  NT(t.producto) + '.') + '</p>';
              }
            }
            h += S.paso(String(k2 + 1), cuerpo, cero(t.elem) ? 'detd-paso0' : '');
          });
        } else {
          h += pista('pulsa <b>Paso siguiente</b> para ver los cuatro determinantes de orden 3.');
        }

        if (nivel >= 3) {
          h += titulo('Nivel 3 · resolver cada orden 3 por Sarrus');
          h += parrafo('Cada uno de los cuatro menores es un determinante de orden 3, y ahí ya ' +
            'sirve la regla de Sarrus. Fíjate en que los menores de una misma línea se parecen: ' +
            'todos salen de tachar la misma ' + (D.tipo === 'fila' ? 'fila' : 'columna') + '.');
          h += S.tabla(['Sumando', 'Elemento', 'Signo', 'Menor de orden 3', 'Adjunto', 'Producto'],
            D.terminos.map(function (t) {
              return [
                K('a_{' + t.i1 + t.j1 + '}\\cdot A_{' + t.i1 + t.j1 + '}'),
                K(FT(t.elem)),
                t.signo > 0 ? '+' : '\u2212',
                cero(t.elem) ? 'no hace falta' : K(FT(t.menor)),
                cero(t.elem) ? '\u2014' : K(FT(t.adjunto)),
                K(FT(t.producto))
              ];
            }));
        }

        if (nivel >= 4) {
          h += titulo('Nivel 4 · sumar los cuatro sumandos');
          h += caja('Resultado', D.terminos.map(function (t) {
            return FT(t.producto);
          }).reduce(function (a2, b2) { return a2 + ' + ' + S.parNegTex(b2); }) + ' = ' + FT(total));
          h += S.resultado(K('|A| = ' + FT(total)), 'determinante de orden 4');
          h += bien('Comprobación: el motor calcula el mismo determinante por cualquiera de las ' +
            'ocho líneas y por el método de hacer ceros. El resultado <b>no depende</b> del camino.');
        }

        h += figCascada4(D, null, nivel, total);

        h += S.kvs([
          'nivel visible = <b>' + nivel + ' de 4</b>',
          'línea = <b>' + D.tipo + ' ' + D.indice1 + '</b>',
          'ceros de la línea = <b>' + D.ceros + '</b>',
          'menores de orden 3 por calcular = <b>' + (4 - D.ceros) + '</b>',
          '|A| = <b>' + NT(total) + '</b>'
        ]);
        if (nivel < 4) {
          h += pista('vas por el nivel ' + nivel + '. Pulsa <b>Paso siguiente</b> ' +
            plural(4 - nivel, 'vez', 'veces') + ' más, o <b>Ver todo</b>.');
        } else {
          h += parrafo('<b>Para el examen.</b> Se escribe el desarrollo por la línea elegida ' +
            'indicando el signo de cada adjunto, se resuelve cada menor de orden 3 por Sarrus y se ' +
            'suma. Y antes de empezar se mira si conviene <b>hacer ceros</b>: con tres ceros en una ' +
            'columna, el orden 4 se reduce a un único determinante de orden 3.');
        }
        return h;
      }, EJEMPLO));
  };

  /* ==================================================================
     3 · Tema 2.8 · el árbol de la recursión
     ================================================================== */

  /* Nodos por nivel: el nivel 0 es el determinante de orden n (1 nodo),
     el nivel l tiene n·(n−1)·…·(n−l+1) determinantes de orden n−l.
     El árbol termina en el orden 2, que ya se resuelve de cabeza.     */
  function nodosRecursion(n) {
    var out = [], acum = 1, l;
    for (l = 0; l <= n - 2; l++) {
      if (l > 0) acum = acum * (n - l + 1);
      out.push({ nivel: l, orden: n - l, nodos: acum });
    }
    return out;
  }
  function factorial(n) {
    var r = 1, i;
    for (i = 2; i <= n; i++) r *= i;
    return r;
  }

  function figArbol(n, niveles) {
    /* El ancho se AJUSTA al contenido: con n = 2 o n = 3 el árbol es
       pequeño y un W fijo de 1000 dejaba 191 px muertos a la derecha
       (el rótulo de nivel se ancla a la izquierda, así que el hueco no
       era simétrico y la figura salía descentrada). Se mide el texto
       más largo y se respeta el mínimo de 700 px del tema.        */
    var titulo2 = '\u00c1rbol de la recursi\u00f3n de un determinante de orden ' + n;
    var subT = 'cada determinante de orden m se parte en m determinantes de orden m \u2212 1';
    var necesario = Math.max(anchoTxt(titulo2, 22, true), anchoTxt(subT, 17, true));
    niveles.forEach(function (nv) {
      necesario = Math.max(necesario, anchoTxt('Nivel ' + nv.nivel + '  \u00b7  ' + nv.nodos +
        ' determinante' + (nv.nodos === 1 ? '' : 's') + ' de orden ' + nv.orden, 18, true));
      if (nv.nodos > 8) {
        necesario = Math.max(necesario, anchoTxt(nv.nodos + ' determinantes de orden ' +
          nv.orden + '  (nivel dibujado de forma agregada)', 19, true) + 40);
      } else {
        necesario = Math.max(necesario, nv.nodos * 132 + (nv.nodos - 1) * 16);
      }
    });
    var W = Math.max(700, Math.min(1000, necesario + 60)), b = '';
    var xIzq = 30, xDer = W - 30, anchoUtil = xDer - xIzq;

    b += S.txt(W / 2, 34, titulo2,
      { size: 22, weight: '700', fill: COL.azulOsc });
    b += S.txt(W / 2, 60, subT,
      { size: 17, weight: '700', fill: COL.gris });

    var y = 92, geo = [], hCaja = 56, salto = 46;

    niveles.forEach(function (nv, l) {
      var etiqueta = 'Nivel ' + nv.nivel + '  \u00b7  ' + nv.nodos + ' determinante' +
        (nv.nodos === 1 ? '' : 's') + ' de orden ' + nv.orden;
      b += S.txt(xIzq, y, etiqueta, { size: 18, weight: '700', fill: COL.azulOsc, anchor: 'start' });
      var yCaja = y + 14;

      if (nv.nodos <= 8) {
        var hueco = 16;
        var wCaja = Math.min(132, Math.floor((anchoUtil - (nv.nodos - 1) * hueco) / nv.nodos));
        var total = nv.nodos * wCaja + (nv.nodos - 1) * hueco;
        var x0 = Math.round(xIzq + (anchoUtil - total) / 2);
        var xs = [];
        var i;
        for (i = 0; i < nv.nodos; i++) {
          var xc = x0 + i * (wCaja + hueco);
          xs.push(xc + wCaja / 2);
          b += S.rect(xc, yCaja, wCaja, hCaja,
            nv.orden === 2 ? '#eef7ee' : (l === 0 ? '#e8f1fb' : '#ffffff'),
            nv.orden === 2 ? COL.verde : COL.azul, { r: 8, sw: 2 });
          b += S.txt(xc + wCaja / 2, yCaja + hCaja / 2 + 7,
            'orden ' + nv.orden, { size: 18, weight: '700', fill: COL.texto });
        }
        geo.push({ tipo: 'cajas', xs: xs, y: yCaja, h: hCaja });
      } else {
        b += S.rect(xIzq, yCaja, anchoUtil, hCaja, '#fff6e5', COL.naranja, { r: 8, sw: 2 });
        b += S.txt(W / 2, yCaja + hCaja / 2 + 7,
          nv.nodos + ' determinantes de orden ' + nv.orden + '  (nivel dibujado de forma agregada)',
          { size: 19, weight: '700', fill: COL.naranja });
        geo.push({ tipo: 'barra', xs: null, y: yCaja, h: hCaja });
      }
      y = yCaja + hCaja + salto;
    });

    /* conectores entre niveles consecutivos */
    var conect = '';
    niveles.forEach(function (nv, l) {
      if (l === 0) return;
      var pad = geo[l - 1], hij = geo[l];
      var grupo = n - l + 1;
      var yA = pad.y + pad.h, yB = hij.y;
      if (pad.tipo === 'cajas' && hij.tipo === 'cajas') {
        hij.xs.forEach(function (xh, c) {
          var xp = pad.xs[Math.floor(c / grupo)];
          conect += S.line(xp, yA, xh, yB, COL.guia, 1.8);
        });
      } else if (pad.tipo === 'cajas') {
        pad.xs.forEach(function (xp, p) {
          var destino = xIzq + anchoUtil * (p + 0.5) / pad.xs.length;
          conect += S.line(xp, yA, destino, yB, COL.guia, 1.8);
        });
      } else {
        conect += S.line(W / 2, yA, W / 2, yB, COL.guia, 1.8);
      }
    });

    var pie = 'El último nivel es de orden 2: ahí la recursión se detiene porque ese ' +
      'determinante se resuelve con a₁₁·a₂₂ − a₁₂·a₂₁.';
    return cierra(conect + b, W, 'Árbol de la recursión del desarrollo por adjuntos', pie);
  }

  R.recursivo = function (node) {
    return S.shell(node, 'El árbol de la recursión',
      'Desarrollar por los adjuntos es un método <b>recursivo</b>: para un determinante de orden ' +
      K('n') + ' hay que calcular ' + K('n') + ' determinantes de orden ' + K('n-1') + ', y cada uno ' +
      'de ellos vuelve a partirse, hasta llegar al orden 2, que se resuelve de cabeza. Elige el orden ' +
      'con el deslizador (de 2 a 5) y mira cuántos nodos aparecen en cada nivel. No hay ninguna ' +
      'matriz que escribir: este applet cuenta <b>trabajo</b>, no números. Si quieres calcular un ' +
      'determinante concreto de orden 4, usa el applet de la cascada y escribe allí tu matriz, ' +
      'por ejemplo <code>2 1 3 1; 1 0 2 4; 3 2 1 0; 1 1 1 1</code>.',
      [
        { id: 'n', label: 'Orden n del determinante', type: 'range', min: 2, max: 5, value: 4, ancho: '17rem' },
        {
          id: 'ver', label: 'Ver el detalle de los niveles', type: 'check', value: true, ancho: '14rem'
        },
        chips([
          { txt: 'Orden 2 · el caso base', tip: 'la recursión ni empieza', set: { n: 2, ver: true } },
          { txt: 'Orden 3 · tres menores', tip: 'o directamente Sarrus', set: { n: 3, ver: true } },
          { txt: 'Orden 4 · doce menores', tip: 'el caso del examen', set: { n: 4, ver: true } },
          { txt: 'Orden 5 · sesenta menores', tip: 'niveles agregados', set: { n: 5, ver: true } },
          { txt: 'Solo el dibujo', tip: 'sin la tabla de detalle', set: { n: 5, ver: false } }
        ])
      ],
      safe(function (v) {
        var n = leeEnt(v.n, 'el orden n', 2, 5);
        var niveles = nodosRecursion(n);
        var hojas = niveles[niveles.length - 1].nodos;

        var h = parrafo('Un determinante de orden <b>' + n + '</b> se desarrolla por una línea de ' +
          n + ' elementos, así que se parte en <b>' + n + '</b> determinantes de orden ' + (n - 1) +
          '. Cada uno de esos se parte en ' + (n - 1) + ' de orden ' + (n - 2) + ', y así hasta el ' +
          'orden 2.' + (n === 2 ? ' Con ' + K('n = 2') + ' no hay nada que partir: es el caso base.' : ''));

        h += figArbol(n, niveles);

        if (v.ver) {
          h += titulo('Cuántos nodos hay en cada nivel');
          h += S.tabla(['Nivel', 'Orden de los determinantes', 'Cuántos hay', 'Cómo sale ese número'],
            niveles.map(function (nv) {
              var como;
              if (nv.nivel === 0) como = 'el determinante de partida';
              else if (nv.nivel === 1) como = K(String(n)) + ' menores del primer desarrollo';
              else {
                var f = [];
                var t;
                for (t = 0; t < nv.nivel; t++) f.push(String(n - t));
                como = K(f.join(' \\cdot ')) + ' = ' + K(String(nv.nodos));
              }
              return [K(String(nv.nivel)), K(String(nv.orden)), K(String(nv.nodos)), como];
            }));
          h += parrafo('El último nivel tiene <b>' + hojas + '</b> determinante(s) de orden 2. ' +
            'Como cada determinante de orden 2 son dos productos, la cuenta total es de ' +
            K(String(2 * hojas)) + ' productos de dos factores solo en las hojas del árbol, y eso ' +
            'coincide con los ' + K(n + '! = ' + factorial(n)) + ' sumandos de la definición general ' +
            'partidos por 2 y multiplicados por 2.');
        }

        h += S.kvs([
          'orden = <b>' + n + '</b>',
          'niveles = <b>' + niveles.length + '</b>',
          'determinantes de orden 2 al final = <b>' + hojas + '</b>',
          'n! = <b>' + factorial(n) + '</b>'
        ]);

        if (n >= 5) {
          h += aviso('Con ' + K('n = 5') + ' el nivel de orden 3 ya tiene <b>20</b> nodos y el de ' +
            'orden 2 tiene <b>60</b>: dibujarlos uno a uno no cabe en la pantalla ni se lee, así que ' +
            'esos niveles se representan <b>de forma agregada</b>, con su recuento escrito dentro de ' +
            'la banda. La conclusión práctica es la del apartado siguiente: antes de desarrollar, ' +
            '<b>haz ceros</b>.');
        }
        h += parrafo('<b>Idea clave.</b> El árbol crece como el factorial. Cada cero que consigas en ' +
          'la línea del desarrollo <b>poda una rama entera</b>: si en una columna hay tres ceros, de ' +
          'los ' + n + ' hijos del primer nivel sobrevive uno solo.');
        return h;
      }, 'Mueve el deslizador entre 2 y 5. Este applet no necesita que escribas ninguna matriz.'));
  };

  /* ==================================================================
     4 · Tema 2.8 · el coste de calcular
     ================================================================== */

  /* Multiplicaciones de dos factores que hace falta hacer con cada
     método. Son cuentas de trabajo, no de determinantes.             */
  function costeDefinicion(n) { return factorial(n) * (n - 1); }
  function costeAdjuntos(n) {
    /* M(2) = 2 (los dos productos del orden 2);
       M(m) = m·(M(m−1) + 1): m menores y m productos elemento·menor. */
    var m, M = 2;
    for (m = 3; m <= n; m++) M = m * (M + 1);
    return n <= 2 ? 2 : M;
  }
  function costeCeros(n) {
    /* Cada ronda de orden m: m−1 operaciones Fi → Fi + k·Fj, cada una
       con m−1 multiplicaciones y una división -> (m−1)·m cuentas.
       Después queda un único determinante de orden m−1.              */
    var m, C = 2;
    for (m = 3; m <= n; m++) C = C + (m - 1) * m;
    return C;
  }

  var METODOS = [
    { clave: 'def', nombre: 'Definición general', col: COL.rojo, f: costeDefinicion },
    { clave: 'adj', nombre: 'Adjuntos sin ceros', col: COL.naranja, f: costeAdjuntos },
    { clave: 'cer', nombre: 'Adjuntos tras hacer ceros', col: COL.verde, f: costeCeros }
  ];

  function figCoste(desde, hasta, log) {
    var W = 1020, b = '';
    var xEje = 108, yTop = 96, altoPlot = 380;
    var yBase = yTop + altoPlot;
    var grupos = [], n;
    for (n = desde; n <= hasta; n++) grupos.push(n);

    var maximo = 1;
    grupos.forEach(function (g) {
      METODOS.forEach(function (mm) { maximo = Math.max(maximo, mm.f(g)); });
    });

    b += S.txt(W / 2, 34, 'Multiplicaciones necesarias según el método',
      { size: 22, weight: '700', fill: COL.azulOsc });
    b += S.txt(W / 2, 62, log
      ? 'escala logarítmica: cada franja vale diez veces más que la anterior'
      : 'escala normal: la barra de la definición general se come el dibujo',
      { size: 17, weight: '700', fill: COL.gris });

    function altura(v) {
      if (v <= 0) return 0;
      /* En escala normal las barras pequeñas se quedaban en 0-2 px y
         desaparecían del dibujo (auditoría: coste D1). Se les da un
         mínimo de 5 px: siguen siendo un hilo frente a las grandes
         —que es justo lo que la figura quiere enseñar— pero se ven. */
      if (!log) return Math.max(8, Math.round(altoPlot * v / maximo));
      var L = Math.log(v) / Math.LN10, LM = Math.log(maximo) / Math.LN10;
      return Math.max(6, Math.round(altoPlot * (L + 0.3) / (LM + 0.3)));
    }

    /* rejilla horizontal */
    if (log) {
      var pot = 1;
      while (pot <= maximo) {
        var yy = yBase - altura(pot);
        b += S.line(xEje, yy, W - 40, yy, COL.guia, 1.4);
        b += S.txt(xEje - 14, yy + 6, String(pot), { size: 16, weight: '700', fill: COL.gris, anchor: 'end' });
        pot = pot * 10;
      }
    } else {
      var t;
      for (t = 0; t <= 4; t++) {
        var val = Math.round(maximo * t / 4);
        var y2 = yBase - Math.round(altoPlot * t / 4);
        b += S.line(xEje, y2, W - 40, y2, COL.guia, 1.4);
        b += S.txt(xEje - 14, y2 + 6, String(val), { size: 16, weight: '700', fill: COL.gris, anchor: 'end' });
      }
    }
    b += S.line(xEje, yTop - 10, xEje, yBase, COL.eje, 2.4);
    b += S.line(xEje, yBase, W - 40, yBase, COL.eje, 2.4);

    var anchoG = (W - 40 - xEje) / grupos.length;
    var wBarra = Math.min(58, Math.floor((anchoG - 34) / 3));

    grupos.forEach(function (g, gi) {
      var x0 = xEje + gi * anchoG + (anchoG - 3 * wBarra - 16) / 2;
      METODOS.forEach(function (mm, k2) {
        var v = mm.f(g), hb = altura(v);
        var xb = x0 + k2 * (wBarra + 8);
        b += S.rect(xb, yBase - hb, wBarra, hb, mm.col, 'none', { r: 4 });
        b += S.txt(xb + wBarra / 2, yBase - hb - 10, String(v),
          { size: 16, weight: '700', fill: mm.col });
      });
      b += S.txt(x0 + (3 * wBarra + 16) / 2, yBase + 30, 'n = ' + g,
        { size: 19, weight: '700', fill: COL.texto });
    });
    b += S.txt(xEje - 14, yTop - 26, 'cuentas', { size: 16, weight: '700', fill: COL.gris, anchor: 'end' });

    /* leyenda dentro del lienzo, en una banda propia */
    var yLeg = yBase + 62;
    var xLeg = xEje;
    METODOS.forEach(function (mm) {
      b += S.rect(xLeg, yLeg - 14, 22, 22, mm.col, 'none', { r: 4 });
      b += S.txt(xLeg + 30, yLeg + 4, mm.nombre, { size: 17, weight: '700', fill: COL.texto, anchor: 'start' });
      xLeg += 38 + mm.nombre.length * 9.6;
    });

    return cierra(b, W, 'Coste de calcular un determinante según el método',
      'Cada barra cuenta las multiplicaciones (y divisiones) de dos factores que hay que hacer. ' +
      'Las cifras exactas están escritas encima de cada barra.');
  }

  R.coste = function (node) {
    return S.shell(node, 'El coste de calcular',
      'Los tres caminos para calcular un determinante dan <b>el mismo número</b>, pero no cuestan lo ' +
      'mismo. Aquí se cuentan las multiplicaciones necesarias con cada método para ' + K('n') +
      ' de 2 a 6: la <b>definición general</b> (' + K('n!') + ' sumandos de ' + K('n') + ' factores), ' +
      'el <b>desarrollo por adjuntos</b> sin ningún cero y el <b>desarrollo después de hacer ceros</b>. ' +
      'No hay que escribir ninguna matriz: elige el tramo de órdenes y la escala. Si quieres ver el ' +
      'método barato en acción, escribe tu matriz en el applet de hacer ceros, por ejemplo ' +
      '<code>2 1 3 1; 1 0 2 4; 3 2 1 0; 1 1 1 1</code>.',
      [
        { id: 'desde', label: 'Desde n =', type: 'number', min: 2, max: 5, value: 2, ancho: '8rem' },
        { id: 'hasta', label: 'Hasta n =', type: 'number', min: 3, max: 6, value: 6, ancho: '8rem' },
        { id: 'log', label: 'Escala logarítmica', type: 'check', value: true, ancho: '12rem' },
        chips([
          { txt: 'Todo el tramo · escala logarítmica', tip: 'de 2 a 6', set: { desde: 2, hasta: 6, log: true } },
          { txt: 'Todo el tramo · escala normal', tip: 'así se ve el salto factorial', set: { desde: 2, hasta: 6, log: false } },
          { txt: 'Solo 4 y 5', tip: 'los órdenes del tema', set: { desde: 4, hasta: 5, log: false } },
          { txt: 'Del 3 al 6', tip: 'desde Sarrus hasta lo impracticable', set: { desde: 3, hasta: 6, log: true } },
          { txt: 'El salto del 5 al 6', tip: 'el factorial se dispara', set: { desde: 5, hasta: 6, log: false } }
        ])
      ],
      safe(function (v) {
        var desde = leeEnt(v.desde, 'el orden inicial', 2, 5);
        var hasta = leeEnt(v.hasta, 'el orden final', 3, 6);
        if (hasta <= desde) {
          throw Error('El orden final (' + hasta + ') tiene que ser mayor que el inicial (' + desde +
            '). Prueba con «desde 2» y «hasta 6».');
        }
        var log = !!v.log;

        var h = parrafo('La <b>definición general</b> dice que un determinante de orden ' + K('n') +
          ' es la suma de ' + K('n!') + ' sumandos, y cada sumando es un producto de ' + K('n') +
          ' elementos: uno de cada fila y uno de cada columna. Eso son ' + K('n!\\cdot(n-1)') +
          ' multiplicaciones. El <b>desarrollo por adjuntos</b> reaprovecha cuentas, pero sigue ' +
          'siendo recursivo. Y si antes de desarrollar se <b>hacen ceros</b>, cada orden baja ' +
          'con un único menor.');

        var filas = [], n;
        for (n = desde; n <= hasta; n++) {
          var cd = costeDefinicion(n), ca = costeAdjuntos(n), cc = costeCeros(n);
          filas.push({
            celdas: [
              K(String(n)),
              K(String(factorial(n))),
              K(String(cd)),
              K(String(ca)),
              K(String(cc)),
              K(Math.round(cd / cc) + '\\times')
            ],
            clase: n >= 5 ? 'detd-paso-mal' : ''
          });
        }
        h += titulo('Tabla de costes');
        h += S.tabla(['Orden n', 'Sumandos de la definición (n!)',
          'Definición: multiplicaciones', 'Adjuntos sin ceros', 'Tras hacer ceros',
          'Cuánto ahorra hacer ceros'], filas);

        h += figCoste(desde, hasta, log);
        h += S.leyenda(METODOS.map(function (mm) { return [mm.col, mm.nombre]; }));

        var n6 = 6;
        h += titulo('Por qué en la práctica siempre se hacen ceros primero');
        h += S.paso(1, 'Con la <b>definición general</b>, un determinante de orden 6 son ' +
          K('6! = 720') + ' sumandos de 6 factores: ' + K(String(costeDefinicion(n6))) +
          ' multiplicaciones y 719 sumas. A mano es inviable, y ni siquiera cabe en una hoja.');
        h += S.paso(2, 'Con el <b>desarrollo por adjuntos sin ceros</b> el trabajo baja, pero sigue ' +
          'creciendo como el factorial: ' + K(String(costeAdjuntos(n6))) + ' multiplicaciones en ' +
          'orden 6, porque cada nivel del árbol multiplica el número de nodos.');
        h += S.paso(3, 'Si antes se <b>hacen ceros</b> en una columna con ' + K('F_i \\to F_i + kF_j') +
          ', el desarrollo por esa columna deja <b>un solo sumando</b>: el orden baja de uno en uno ' +
          'sin abrir ramas. El coste pasa a crecer como ' + K('n^3') + ', no como ' + K('n!') + ': ' +
          'solo ' + K(String(costeCeros(n6))) + ' cuentas en orden 6.', 'ap-paso-clave');
        h += S.paso(4, 'Y hay un premio extra: ' + K('F_i \\to F_i + kF_j') + ' <b>no cambia el valor ' +
          'del determinante</b>, así que no hay que arrastrar ningún factor ni ningún signo. Por eso ' +
          'es la operación reina del método.', 'ap-paso-clave');

        h += S.kvs([
          'tramo = <b>n de ' + desde + ' a ' + hasta + '</b>',
          'escala = <b>' + (log ? 'logarítmica' : 'normal') + '</b>',
          'definición en n = ' + hasta + ': <b>' + costeDefinicion(hasta) + '</b>',
          'adjuntos en n = ' + hasta + ': <b>' + costeAdjuntos(hasta) + '</b>',
          'hacer ceros en n = ' + hasta + ': <b>' + costeCeros(hasta) + '</b>'
        ]);
        h += aviso('Ojo con la lectura de la gráfica: en <b>escala logarítmica</b> cada franja vale ' +
          'diez veces más que la anterior, así que una barra que parece «solo el doble» de alta puede ' +
          'valer cien veces más. Cambia a escala normal para ver el golpe de verdad.');
        h += parrafo('<b>Conclusión para el examen.</b> Ante un determinante de orden 4 o 5, primero ' +
          'se mira si hay ceros o si alguna propiedad lo anula; si no, se busca un pivote igual a ' +
          K('1') + ' o ' + K('-1') + ', se hacen ceros en su columna y se desarrolla por ella. ' +
          'Desarrollar «a lo bruto» por una fila sin ceros es multiplicar el trabajo por ' +
          K(String(Math.round(costeAdjuntos(hasta) / costeCeros(hasta)))) + ' en orden ' + hasta + '.');
        return h;
      }, 'Elige dos órdenes entre 2 y 6, con «hasta» mayor que «desde».'));
  };

  /* ==================================================================
     5 · Tema 2.9 · método de hacer ceros
     ================================================================== */

  /* Figura de un paso: la matriz de antes (con la fila que va a cambiar
     resaltada y el pivote marcado), una flecha y la matriz de después.
     o = { titulo, sub, izq:{A,etq,filaHi,marca}, der:{...}|null, pie } */
  function figDosMat(o) {
    var mIzq = mideDet(o.izq.A, { size: 22, minCelda: 46 });
    var mDer = o.der ? mideDet(o.der.A, { size: 22, minCelda: 46 }) : null;
    var flecha = o.der ? 130 : 0;
    var anchoTot = mIzq.w + flecha + (mDer ? mDer.w : 0);

    /* Un solo rótulo por cosa: cuando el subtítulo de la figura y la
       etiqueta de la matriz dicen lo mismo («orden 4» sobre «orden 4»,
       auditoría: hacerCeros D1) se pinta solo el subtítulo.        */
    var etqI = (o.izq.etq && o.izq.etq === o.sub) ? null : o.izq.etq;
    var etqD = (o.der && o.der.etq && o.der.etq === o.sub) ? null : (o.der ? o.der.etq : null);

    /* El ancho se ajusta al contenido —con el mínimo de 700 px del
       tema— en vez de quedarse fijo en 780 con una matriz estrecha
       dentro (auditoría: hacerCeros D2).                          */
    var necesario = Math.max(anchoTot + 96,
      anchoTxt(o.titulo || '', 21, true) + 48,
      anchoTxt(o.sub || '', 17, true) + 48,
      anchoTxt(o.nota || '', 18, true) + 48,
      anchoTxt(o.opEtq || '', 16, true) + 48);
    var W = Math.max(700, Math.min(980, necesario)), b = '';
    b += S.txt(W / 2, 32, o.titulo, { size: 21, weight: '700', fill: COL.azulOsc });
    if (o.sub) b += S.txt(W / 2, 58, o.sub, { size: 17, weight: '700', fill: COL.gris });

    var yFila = 96;
    var x = Math.round((W - anchoTot) / 2);

    var dI = dibujaDet(o.izq.A, x, yFila, {
      size: 22, minCelda: 46, filaHi: o.izq.filaHi, marca: o.izq.marca,
      colHi: o.izq.colHi
    });
    b += dI.b;
    if (etqI) {
      b += S.txt(x + dI.w / 2, yFila - 16, etqI, { size: 17, weight: '700', fill: COL.texto });
    }

    if (o.der) {
      var xf = x + mIzq.w;
      var yc = yFila + dI.h / 2;
      b += S.line(xf + 22, yc, xf + flecha - 22, yc, COL.morado, 3);
      b += S.poly([[xf + flecha - 22, yc], [xf + flecha - 40, yc - 10], [xf + flecha - 40, yc + 10]],
        COL.morado, COL.morado);
      if (o.opEtq) {
        b += S.txt(xf + flecha / 2, yc - 22, o.opEtq, { size: 16, weight: '700', fill: COL.morado });
      }
      var dD = dibujaDet(o.der.A, xf + flecha, yFila, {
        size: 22, minCelda: 46, filaHi: o.der.filaHi, marca: o.der.marca,
        colHi: o.der.colHi, colorHi: 'rgba(46,125,50,.16)'
      });
      b += dD.b;
      if (etqD) {
        b += S.txt(xf + flecha + dD.w / 2, yFila - 16, etqD,
          { size: 17, weight: '700', fill: COL.texto });
      }
    }
    if (o.nota) {
      var yN = S.altoDibujado(b) + 30;
      b += S.txt(W / 2, yN, o.nota, { size: 18, weight: '700', fill: o.notaCol || COL.verde });
    }
    return cierra(b, W, o.titulo, o.pie);
  }

  /* Recorre los pasos de DET.hacerCeros y anota, para cada uno, en qué
     ronda está, cuál es el pivote de esa ronda (base 0 y base 1) y qué
     fila cambia. No recalcula ninguna cuenta: solo etiqueta.          */
  function anotaPasos(res) {
    var ronda = 0, out = [];
    res.pasos.forEach(function (p, i) {
      var rd = res.rondas[Math.min(ronda, res.rondas.length - 1)] || null;
      out.push({
        i: i, p: p, ronda: ronda,
        pivote: rd ? rd.pivote : null,
        pivote1: rd ? rd.pivote1 : null,
        anterior: i > 0 ? res.pasos[i - 1] : null
      });
      if (p.tipo === 'desarrollo') ronda++;
    });
    return out;
  }

  /* Rótulo corto del tipo de paso, para los títulos de las figuras. */
  var NOMBRE_PASO = {
    inicio: 'la matriz de partida',
    pivote: 'elección del pivote',
    factor: 'sacamos factor común de la fila del pivote',
    ceros: 'un cero más en la columna del pivote',
    desarrollo: 'desarrollo por la columna del pivote',
    final: 'el determinante de orden 2 que queda',
    nulo: 'la matriz se ha quedado de ceros'
  };

  R.hacerCeros = function (node) {
    var visible = 1;
    function reinicia() { visible = 1; }

    return S.shell(node, 'Método de hacer ceros',
      'La propiedad clave es esta: <b>' + K('F_i \\to F_i + kF_j') + ' no cambia el valor del ' +
      'determinante</b>. Se elige un <b>pivote</b> (mejor si vale ' + K('1') + ' o ' + K('-1') +
      '), se hacen ceros en el resto de su columna y se desarrolla por esa columna: queda un ' +
      '<b>único sumando</b> y el orden baja en uno. Escribe una matriz de orden 3, 4 o 5 por filas: ' +
      '<code>2 1 3 1; 1 0 2 4; 3 2 1 0; 1 1 1 1</code> (o una fila por línea). Valen decimales con ' +
      'coma (<code>0,5</code>) y fracciones (<code>1/2</code>). Con <b>Paso siguiente</b> avanzas uno ' +
      'a uno y con <b>Resolver entero</b> lo ves acabado.',
      [
        {
          id: 'A', label: 'Matriz (una fila por línea)', type: 'textarea', rows: 5,
          value: '2 1 3 1\n1 0 2 4\n3 2 1 0\n1 1 1 1', ancho: '19rem'
        },
        {
          id: 'figuras', label: 'Ver la figura de cada paso', type: 'check', value: true, ancho: '14rem'
        },
        {
          id: 'siguiente', label: 'Paso siguiente', type: 'button',
          click: function () { visible = visible + 1; }
        },
        { id: 'todo', label: 'Resolver entero', type: 'button', click: function () { visible = 999; } },
        { id: 'reinicia', label: 'Reiniciar', type: 'button', click: reinicia },
        chips([
          {
            txt: 'Orden 4 clásico', tip: 'pivote 1 en la primera fila',
            set: { A: '2 1 3 1\n1 0 2 4\n3 2 1 0\n1 1 1 1', figuras: true }, extra: reinicia
          },
          {
            txt: 'Orden 3 sencillo', tip: 'una sola ronda',
            set: { A: '2 1 3\n1 0 2\n3 2 1', figuras: true }, extra: reinicia
          },
          {
            txt: 'Orden 4 sin ningún 1', tip: 'hay que sacar factor común',
            set: { A: '2 4 6 8\n4 2 8 6\n6 8 2 4\n8 6 4 2', figuras: true }, extra: reinicia
          },
          {
            txt: 'Orden 5', tip: 'tres rondas de ceros',
            set: { A: '1 2 0 1 3\n0 1 1 2 1\n2 0 1 1 0\n1 1 2 0 1\n3 1 0 1 2', figuras: true },
            extra: reinicia
          },
          {
            txt: 'Determinante nulo', tip: 'F₄ = F₁ + F₂',
            set: { A: '1 2 3 1\n2 1 0 1\n0 1 1 1\n3 3 3 2', figuras: true }, extra: reinicia
          },
          {
            txt: 'Con fracciones', tip: 'la aritmética sigue exacta',
            set: { A: '1/2 3 0 1\n0 -2 1 1\n1 1 1 0\n2 0 1 1', figuras: true }, extra: reinicia
          },
          {
            txt: 'Triangular de orden 4', tip: 'no hace falta ni un cero más',
            set: { A: '2 5 1 3\n0 3 4 1\n0 0 -1 2\n0 0 0 4', figuras: true }, extra: reinicia
          },
          {
            txt: 'Sin figuras (solo pasos)', tip: 'la lista escrita, más compacta',
            set: { A: '2 1 3 1\n1 0 2 4\n3 2 1 0\n1 1 1 1', figuras: false }, extra: reinicia
          }
        ])
      ],
      safe(function (v) {
        var A = leeOrden345(v.A, 'la matriz');
        var res = cap().hacerCeros(A);
        var an = anotaPasos(res);
        var N = res.pasos.length;
        if (visible > N) visible = N;
        if (visible < 1) visible = 1;

        var h = caja('Determinante de partida, de orden ' + A.f, cap().detTex(A));
        h += parrafo('El método tiene tres movimientos y solo tres: <b>elegir el pivote</b>, ' +
          '<b>hacer ceros</b> en el resto de su columna con ' + K('F_i \\to F_i + kF_j') + ' y ' +
          '<b>desarrollar</b> por esa columna, donde ya solo queda un elemento distinto de cero. ' +
          'Cada vez que se repite, el orden baja en uno.');

        var props = cap().detPropiedades(A);
        var anula = props.filter(function (o) { return o.anula; });
        if (anula.length) {
          h += aviso('Antes de hacer una sola cuenta, fíjate: ' + S.esc(anula[0].descripcion) +
            ' Este determinante se puede dar por resuelto <b>sin hacer ceros</b>. Aun así, el método ' +
            'de abajo funciona y llega al mismo número.');
        }

        h += titulo('Los pasos, uno a uno (' + visible + ' de ' + N + ')');
        an.slice(0, visible).forEach(function (a2, idx) {
          var p = a2.p;
          var marca = [];
          var filaHi = null;
          if (p.tipo === 'ceros') {
            filaHi = p.fila;
            if (a2.pivote) marca.push([a2.pivote[0], a2.pivote[1]]);
          } else if (p.tipo === 'pivote' || p.tipo === 'factor') {
            if (a2.pivote) marca.push([a2.pivote[0], a2.pivote[1]]);
            if (p.tipo === 'factor' && a2.pivote) filaHi = a2.pivote[0];
          }
          var cuerpo = '<p>' + S.esc(p.descripcion) + '</p>';
          if (p.tipo === 'ceros') {
            cuerpo += op(opTex(p.fila + 1, p.filaPivote + 1, p.k));
          }
          cuerpo += '<div class="detd-caja">' + KD(cap().matTex(p.matriz, { marca: marca })) + '</div>';
          if (p.tipo === 'ceros') {
            cuerpo += '<p class="detd-bien">Esta operación <b>no cambia</b> el valor del ' +
              'determinante: no hay que arrastrar ningún factor ni ningún signo.</p>';
          }
          if (p.tipo === 'factor') {
            cuerpo += '<p class="detd-mal">Cuidado: sacar factor común de una fila <b>sí</b> cambia ' +
              'el determinante. El factor ' + K(FT(p.factor)) + ' se queda fuera multiplicando y hay ' +
              'que acordarse de él al final.</p>';
          }
          if (p.tipo === 'desarrollo') {
            cuerpo += '<p>En la columna del pivote solo queda un elemento distinto de cero, así que ' +
              'el desarrollo por esa columna tiene <b>un único sumando</b>: el resto se multiplica ' +
              'por 0. Eso es todo el truco del método.</p>';
          }
          if (p.tipo === 'nulo') {
            cuerpo += '<p class="detd-mal">Una matriz con una línea de ceros tiene determinante 0.</p>';
          }
          h += S.paso(String(idx + 1), cuerpo,
            p.tipo === 'inicio' ? 'detd-paso0'
              : (p.tipo === 'factor' ? 'detd-paso-mal' : 'detd-paso-ok'));

          if (v.figuras) {
            var anterior = a2.anterior;
            if (p.tipo === 'ceros' && anterior && anterior.matriz &&
              anterior.matriz.f === p.matriz.f) {
              h += figDosMat({
                titulo: 'Paso ' + (idx + 1) + ' \u00b7 ' + NOMBRE_PASO[p.tipo],
                sub: opTxt(p.fila + 1, p.filaPivote + 1, p.k) +
                  '   \u00b7   pivote en la fila ' + (a2.pivote1 ? a2.pivote1[0] : '?') +
                  ', columna ' + (a2.pivote1 ? a2.pivote1[1] : '?'),
                izq: {
                  A: anterior.matriz, etq: 'antes', filaHi: p.fila,
                  marca: a2.pivote ? [a2.pivote] : [], colHi: a2.pivote ? a2.pivote[1] : null
                },
                der: {
                  A: p.matriz, etq: 'después', filaHi: p.fila,
                  marca: a2.pivote ? [a2.pivote] : [], colHi: a2.pivote ? a2.pivote[1] : null
                },
                opEtq: opTxt(p.fila + 1, p.filaPivote + 1, p.k),
                nota: 'el determinante NO cambia',
                pie: 'En amarillo, la fila que cambia; en rojo, el pivote; en azul, la columna ' +
                  'donde estamos haciendo ceros.'
              });
            } else {
              h += figDosMat({
                titulo: 'Paso ' + (idx + 1) + ' \u00b7 ' + (NOMBRE_PASO[p.tipo] || p.tipo),
                sub: p.tipo === 'factor'
                  ? 'sale fuera el factor ' + NT(p.factor) + ': el determinante S\u00cd cambia'
                  : (a2.pivote1 && (p.tipo === 'pivote')
                    ? 'pivote en la fila ' + a2.pivote1[0] + ', columna ' + a2.pivote1[1]
                    : 'orden ' + p.matriz.f),
                izq: {
                  A: p.matriz, etq: 'orden ' + p.matriz.f, filaHi: filaHi,
                  marca: marca, colHi: (p.tipo === 'pivote' && a2.pivote) ? a2.pivote[1] : null
                },
                der: null,
                nota: p.tipo === 'factor' ? 'factor ' + NT(p.factor) + ' fuera' : null,
                notaCol: p.tipo === 'factor' ? COL.rojo : COL.verde,
                pie: 'En rojo, el pivote elegido; en azul, la columna en la que se hacen los ceros.'
              });
            }
          }
        });

        if (visible < N) {
          h += pista((N - visible === 1 ? 'queda ' : 'quedan ') +
            plural(N - visible, 'paso', 'pasos') + '. Pulsa <b>Paso siguiente</b> o ' +
            '<b>Resolver entero</b>.');
        } else {
          h += titulo('Resultado');
          h += caja('Determinante pedido', cap().detTex(A) + ' = ' + FT(res.total));
          h += S.resultado(K('|A| = ' + FT(res.total)), 'por el método de hacer ceros');
          if (!igF(res.factor, F1())) {
            h += aviso('Por el camino han salido factores fuera; su producto es ' +
              K(FT(res.factor)) + ', y el determinante de orden 2 final vale ' +
              K(FT(res.restante)) + ': ' + K(FT(res.factor) + '\\cdot' +
              S.parNegTex(FT(res.restante)) + ' = ' + FT(res.total)) + '.');
          }
          h += bien('El mismo número que sale desarrollando por adjuntos «a lo bruto», pero con ' +
            'muchísimas menos cuentas: aquí solo ha habido <b>' +
            res.pasos.filter(function (p) { return p.tipo === 'ceros'; }).length +
            '</b> operaciones de hacer ceros.');
        }

        h += S.kvs([
          'orden = <b>' + A.f + '</b>',
          'pasos totales = <b>' + N + '</b>',
          'pasos vistos = <b>' + visible + '</b>',
          'operaciones Fi → Fi + k·Fj = <b>' +
            res.pasos.filter(function (p) { return p.tipo === 'ceros'; }).length + '</b>',
          /* No es un recuento (un recuento no puede valer −1): es el
             factor que se ha ido acumulando fuera del determinante
             (auditoría: hacerCeros D3).                            */
          'factor acumulado fuera = <b>' + NT(res.factor) + '</b>',
          '|A| = <b>' + NT(res.total) + '</b>'
        ]);
        h += parrafo('<b>Cómo se escribe en un examen.</b> Se copia el determinante, se indica cada ' +
          'operación encima de la flecha con la notación ' + K('F_2 \\to F_2 - 3F_1') + ' (índices ' +
          'desde 1), se escribe la matriz resultante y, cuando la columna del pivote solo tiene un ' +
          'elemento, se desarrolla por ella y se justifica el signo del adjunto con ' + K('(-1)^{i+j}') + '.');
        return h;
      }, EJEMPLO));
  };

  /* ==================================================================
     6 · Tema 2.9 · elegir el pivote
     ================================================================== */

  /* Categoría de un elemento como pivote. */
  function categoriaPivote(f) {
    if (cero(f)) return { clave: 'cero', txt: 'vale 0: no puede ser pivote', col: COL.gris, orden: 3 };
    if (esEnt(f) && (f.n === 1n || f.n === -1n)) {
      return { clave: 'uno', txt: 'vale 1 o −1: el mejor pivote', col: COL.verde, orden: 0 };
    }
    if (esEnt(f)) return { clave: 'entero', txt: 'entero distinto de ±1: puede traer fracciones', col: COL.naranja, orden: 1 };
    return { clave: 'frac', txt: 'ya es una fracción: el peor caso', col: COL.rojo, orden: 2 };
  }

  /* Figura del tablero de candidatos, con el elegido recuadrado. */
  function figCandidatos(A, sel, reco) {
    var W = 860, b = '';
    var size = 22, cw = anchoCelda(A, size, 62), ch = 52;
    var w = A.c * cw, x0 = Math.round((W - w) / 2), y0 = 118;

    b += S.txt(W / 2, 32, 'Cada posición, como candidata a pivote',
      { size: 21, weight: '700', fill: COL.azulOsc });
    b += S.txt(W / 2, 58, 'verde: vale 1 o \u22121   \u00b7   naranja: entero   \u00b7   rojo: fracción   ' +
      '\u00b7   gris: vale 0', { size: 17, weight: '700', fill: COL.gris });
    b += S.txt(W / 2, 84, 'recuadro morado grueso: tu elección   \u00b7   ' +
      'recuadro azul discontinuo por dentro: la recomendada',
      { size: 16, weight: '700', fill: COL.morado });

    var i, j;
    for (j = 0; j < A.c; j++) {
      b += S.txt(x0 + (j + 0.5) * cw, y0 - 12, 'col. ' + (j + 1),
        { size: 16, weight: '700', fill: COL.gris });
    }
    for (i = 0; i < A.f; i++) {
      b += S.txt(x0 - 16, y0 + (i + 0.5) * ch + 7, 'fila ' + (i + 1),
        { size: 16, weight: '700', fill: COL.gris, anchor: 'end' });
      for (j = 0; j < A.c; j++) {
        var cat = categoriaPivote(A.a[i][j]);
        var xc = x0 + j * cw, yc = y0 + i * ch;
        b += S.rect(xc + 3, yc + 3, cw - 6, ch - 6,
          cat.clave === 'uno' ? '#eef7ee' : (cat.clave === 'entero' ? '#fff6e5'
            : (cat.clave === 'frac' ? '#fdeceb' : '#f4f6f8')),
          cat.col, { r: 8, sw: 1.8 });
        b += S.txt(xc + cw / 2, yc + ch / 2 + 8, NT(A.a[i][j]),
          { size: size, weight: '700', fill: cat.col });
        if (sel && sel[0] === i && sel[1] === j) {
          b += S.rect(xc, yc, cw, ch, 'none', COL.morado, { r: 10, sw: 4 });
        }
        if (reco && reco[0] === i && reco[1] === j) {
          /* La recomendada va DISCONTINUA —como dice la leyenda— y por
             DENTRO de la casilla. Antes era un trazo continuo 4 px por
             fuera, así que en casillas contiguas se montaba con el
             recuadro morado del vecino (auditoría: pivote D1).
             S.rect no admite trazo discontinuo y det-applets.js no se
             toca, así que se dibuja con S.path, que sí lo admite.   */
          var xa = xc + 9, ya = yc + 9, wa = cw - 18, ha = ch - 18;
          b += S.path('M' + xa + ' ' + ya + ' h' + wa + ' v' + ha + ' h' + (-wa) + ' Z',
            COL.azulOsc, 2.6, 'none', '7 5');
        }
      }
    }
    var yPie = y0 + A.f * ch + 34;
    b += S.txt(W / 2, yPie, 'tu pivote: fila ' + (sel[0] + 1) + ', columna ' + (sel[1] + 1) +
      '   \u00b7   recomendado: fila ' + (reco[0] + 1) + ', columna ' + (reco[1] + 1),
      { size: 18, weight: '700', fill: COL.texto });
    return cierra(b, W, 'Candidatos a pivote',
      'Un pivote igual a 1 o a \u22121 hace que todos los multiplicadores k salgan enteros; ' +
      'cualquier otro pivote obliga a dividir.');
  }

  /* Resumen de una ejecución del método con un pivote dado. */
  function resumeCeros(res) {
    var ops = 0, factores = 0, fracK = false, fracMat = false;
    res.pasos.forEach(function (p) {
      if (p.tipo === 'ceros') {
        ops++;
        if (p.k && !esEnt(p.k)) fracK = true;
      }
      if (p.tipo === 'factor') factores++;
      if (p.matriz && hayFracciones(p.matriz)) fracMat = true;
    });
    return {
      ops: ops, factores: factores, fracK: fracK, fracMat: fracMat,
      pasos: res.pasos.length, total: res.total, factor: res.factor
    };
  }

  R.pivote = function (node) {
    return S.shell(node, 'Elegir el pivote',
      'El método de hacer ceros funciona con <b>cualquier</b> pivote que no sea 0, pero el trabajo ' +
      'cambia muchísimo según cuál elijas. Escribe una matriz de orden 3, 4 o 5 por filas: ' +
      '<code>2 1 3 1; 1 0 2 4; 3 2 1 0; 1 1 1 1</code> (o una fila por línea), di en qué <b>fila</b> ' +
      'y en qué <b>columna</b> quieres el pivote (se numeran desde 1) y compara tu elección con la ' +
      'recomendada. Valen fracciones: <code>1/2 3 0; 2 1 1; 0 1 2</code>.',
      [
        {
          id: 'A', label: 'Matriz (una fila por línea)', type: 'textarea', rows: 5,
          value: '2 1 3 1\n1 0 2 4\n3 2 1 0\n1 1 1 1', ancho: '19rem'
        },
        { id: 'i', label: 'Fila del pivote', type: 'number', min: 1, max: 5, value: 1, ancho: '9rem' },
        { id: 'j', label: 'Columna del pivote', type: 'number', min: 1, max: 5, value: 1, ancho: '10rem' },
        {
          id: 'ver', label: 'Ver también los pasos', type: 'check', value: false, ancho: '13rem'
        },
        chips([
          {
            txt: 'Pivote 1 (fila 1, columna 2)', tip: 'la elección buena',
            set: { A: '2 1 3 1\n1 0 2 4\n3 2 1 0\n1 1 1 1', i: 1, j: 2, ver: false }
          },
          {
            txt: 'Pivote 2 (fila 1, columna 1)', tip: 'aparecen fracciones',
            set: { A: '2 1 3 1\n1 0 2 4\n3 2 1 0\n1 1 1 1', i: 1, j: 1, ver: false }
          },
          {
            txt: 'Pivote 3 (fila 3, columna 1)', tip: 'peor todavía',
            set: { A: '2 1 3 1\n1 0 2 4\n3 2 1 0\n1 1 1 1', i: 3, j: 1, ver: false }
          },
          {
            txt: 'Elegir un 0 (aviso)', tip: 'un cero no puede ser pivote',
            set: { A: '2 1 3 1\n1 0 2 4\n3 2 1 0\n1 1 1 1', i: 2, j: 2, ver: false }
          },
          {
            txt: 'Orden 3 con un −1', tip: 'busca el −1 y compara',
            set: { A: '3 -1 2\n4 2 5\n1 3 1', i: 1, j: 2, ver: true }
          },
          {
            txt: 'Sin ningún ±1', tip: 'toca sacar factor común',
            set: { A: '2 4 6 8\n4 2 8 6\n6 8 2 4\n8 6 4 2', i: 1, j: 1, ver: false }
          },
          {
            txt: 'Orden 5 con pivote 1', tip: 'tres rondas',
            set: { A: '1 2 0 1 3\n0 1 1 2 1\n2 0 1 1 0\n1 1 2 0 1\n3 1 0 1 2', i: 1, j: 1, ver: false }
          },
          {
            txt: 'Matriz con fracciones', tip: 'el pivote fraccionario es el peor',
            set: { A: '1/2 3 0\n2 1 1\n0 1 2', i: 1, j: 1, ver: false }
          }
        ])
      ],
      safe(function (v) {
        var A = leeOrden345(v.A, 'la matriz');
        var n = A.f;
        var i = leeEnt(v.i, 'la fila del pivote', 1, n) - 1;
        var j = leeEnt(v.j, 'la columna del pivote', 1, n) - 1;
        var elegido = A.a[i][j];
        var cat = categoriaPivote(elegido);

        var auto = cap().hacerCeros(A);
        var reco = auto.rondas[0].pivote;
        var rAuto = resumeCeros(auto);

        var h = caja('Determinante de partida, de orden ' + n, cap().detTex(A));

        if (cero(elegido)) {
          h += mal('<b>Ese elemento vale 0, así que no puede ser pivote.</b>');
          h += parrafo('El pivote se usa para hacer ceros en el resto de su columna con ' +
            K('F_i \\to F_i + kF_j') + ', y el multiplicador es ' +
            K('k = -\\dfrac{a_{ij}}{\\text{pivote}}') + ': si el pivote fuese 0 habría que dividir ' +
            'entre 0, que no se puede. Elige otra posición: en esta matriz, la mejor es <b>fila ' +
            (reco[0] + 1) + ', columna ' + (reco[1] + 1) + '</b>, donde hay un ' +
            NT(A.a[reco[0]][reco[1]]) + '.');
          h += figCandidatos(A, [i, j], reco);
          h += S.kvs([
            'tu elección = <b>fila ' + (i + 1) + ', columna ' + (j + 1) + '</b>',
            'valor = <b>0</b>',
            'recomendado = <b>fila ' + (reco[0] + 1) + ', columna ' + (reco[1] + 1) + '</b>',
            '|A| = <b>' + NT(auto.total) + '</b>'
          ]);
          return h;
        }

        var mio = cap().hacerCeros(A, { pivote: [i, j] });
        var rMio = resumeCeros(mio);

        h += titulo('Tu pivote');
        h += parrafo('Has elegido el elemento de la <b>fila ' + (i + 1) + ', columna ' + (j + 1) +
          '</b>, que vale ' + K(FT(elegido)) + ': ' + cat.txt + '.');
        h += caja('El pivote elegido, recuadrado', cap().matTex(A, { marca: [[i, j]] }));
        h += figCandidatos(A, [i, j], reco);

        h += titulo('Qué pasa con cada elección');
        h += S.tabla(['', 'Tu elección', 'La recomendada'], [
          ['Posición del pivote',
            'fila ' + (i + 1) + ', columna ' + (j + 1),
            'fila ' + (reco[0] + 1) + ', columna ' + (reco[1] + 1)],
          ['Valor del pivote', K(FT(elegido)), K(FT(A.a[reco[0]][reco[1]]))],
          ['Operaciones ' + K('F_i \\to F_i + kF_j'), K(String(rMio.ops)), K(String(rAuto.ops))],
          ['Factores que hay que sacar fuera', K(String(rMio.factores)), K(String(rAuto.factores))],
          ['Multiplicadores ' + K('k') + ' fraccionarios',
            rMio.fracK ? S.badge('sí', 'no') : S.badge('no', 'si'),
            rAuto.fracK ? S.badge('sí', 'no') : S.badge('no', 'si')],
          ['Fracciones en las matrices intermedias',
            rMio.fracMat ? S.badge('sí', 'no') : S.badge('no', 'si'),
            rAuto.fracMat ? S.badge('sí', 'no') : S.badge('no', 'si')],
          ['Resultado', K(FT(rMio.total)), K(FT(rAuto.total))]
        ]);

        if (rMio.fracK || rMio.fracMat || rMio.factores > 0) {
          h += aviso('<b>Aviso: tu elección obliga a trabajar con fracciones.</b> Con un pivote que ' +
            'no vale ' + K('\\pm 1') + ', el multiplicador ' + K('k = -a_{ij}/\\text{pivote}') +
            ' no sale entero, así que las matrices intermedias se llenan de denominadores. Las cuentas ' +
            'siguen siendo exactas y el resultado es el mismo, pero la probabilidad de equivocarse ' +
            'se multiplica.');
        } else {
          h += bien('Buena elección: el pivote vale ' + K(FT(elegido)) + ', todos los ' +
            'multiplicadores ' + K('k') + ' salen enteros y no aparece ninguna fracción.');
        }
        if (igF(rMio.total, rAuto.total)) {
          h += parrafo('Fíjate en la última fila de la tabla: <b>las dos elecciones dan el mismo ' +
            'determinante</b>, ' + K(FT(rAuto.total)) + '. Elegir bien el pivote no cambia el ' +
            'resultado, solo el trabajo y el riesgo de error.');
        }

        if (v.ver) {
          h += titulo('Los pasos con tu pivote');
          mio.pasos.forEach(function (p, idx) {
            var cuerpo = '<p>' + S.esc(p.descripcion) + '</p>';
            if (p.tipo === 'ceros') cuerpo += op(opTex(p.fila + 1, p.filaPivote + 1, p.k));
            cuerpo += '<div class="detd-caja">' + KD(cap().matTex(p.matriz)) + '</div>';
            h += S.paso(String(idx + 1), cuerpo,
              p.tipo === 'factor' ? 'detd-paso-mal' : (p.tipo === 'inicio' ? 'detd-paso0' : 'detd-paso-ok'));
          });
        } else {
          h += pista('marca <b>Ver también los pasos</b> para seguir el método completo con tu ' +
            'pivote, operación por operación.');
        }

        h += S.kvs([
          'pivote = <b>' + NT(elegido) + '</b> (fila ' + (i + 1) + ', columna ' + (j + 1) + ')',
          'operaciones = <b>' + rMio.ops + '</b>',
          'fracciones = <b>' + (rMio.fracK || rMio.fracMat ? 'sí' : 'no') + '</b>',
          'operaciones con el pivote recomendado = <b>' + rAuto.ops + '</b>',
          '|A| = <b>' + NT(rMio.total) + '</b>'
        ]);
        h += parrafo('<b>Regla práctica.</b> Se busca un ' + K('1') + ' o un ' + K('-1') +
          ' en la matriz; si no hay ninguno, muchas veces se puede fabricar con una operación ' +
          K('F_i \\to F_i + kF_j') + ' (por ejemplo restando dos filas parecidas), y esa operación ' +
          '<b>no cambia el determinante</b>. Solo como último recurso se saca factor común de una ' +
          'fila, que sí lo cambia.');
        return h;
      }, EJEMPLO));
  };

  /* ==================================================================
     7 · Tema 2.9 · laboratorio libre de transformaciones
     ================================================================== */

  var TIPOS_LAB = [
    { value: 'sumar', label: 'Fi → Fi + k·Fj  (no cambia el determinante)' },
    { value: 'cambiar', label: 'Fi ↔ Fj  (cambia el signo)' },
    { value: 'multiplicar', label: 'Fi → k·Fi  (multiplica por k)' }
  ];

  /* Simula una lista de transformaciones sobre A llevando la cuenta del
     signo acumulado (intercambios) y del factor acumulado (productos).
     No lanza: los movimientos ilegales se devuelven marcados.
     Devuelve { matriz, signo, factor, coef, detOriginal, detActual,
                pasos:[{ok, descripcion, tex, error, matriz, tipo}], ok } */
  function simulaLab(A, ops) {
    var actual = A.copia ? A.copia() : A;
    var signo = 1, factor = F1(), pasos = [];
    (ops || []).forEach(function (o, idx) {
      var i1 = Number(o.i) + 1, j1 = Number(o.j) + 1;
      var res = cap().opElemental(actual, { tipo: o.tipo, i: Number(o.i), j: Number(o.j), k: o.k });
      if (!res.valida) {
        pasos.push({
          ok: false, indice: idx, tipo: o.tipo, error: res.error,
          descripcion: null, matriz: actual
        });
        return;
      }
      actual = res.M;
      var desc, tex, efecto;
      if (o.tipo === 'cambiar') {
        signo = -signo;
        desc = 'Intercambiamos la fila ' + i1 + ' y la fila ' + j1 +
          '. Al cambiar dos líneas de sitio, el determinante CAMBIA DE SIGNO: se multiplica por \u22121.';
        tex = 'F_{' + i1 + '} \\leftrightarrow F_{' + j1 + '}';
        efecto = 'signo';
      } else if (o.tipo === 'multiplicar') {
        var k = FR(o.k);
        factor = factor.por(k);
        desc = 'Multiplicamos la fila ' + i1 + ' por ' + NT(k) +
          '. Al multiplicar una línea por un número, el determinante QUEDA MULTIPLICADO por ese ' +
          'número: se multiplica por ' + NT(k) + '.';
        tex = 'F_{' + i1 + '} \\to ' + S.parNegTex(FT(k)) + 'F_{' + i1 + '}';
        efecto = 'factor';
      } else {
        var k2 = FR(o.k);
        desc = 'A la fila ' + i1 + ' le sumamos ' + PT(k2) + ' veces la fila ' + j1 +
          ' (' + opTxt(i1, j1, k2) + '). Esta es la \u00fanica de las tres que NO altera el ' +
          'valor del determinante.';
        tex = opTex(i1, j1, k2);
        efecto = 'nada';
      }
      pasos.push({
        ok: true, indice: idx, tipo: o.tipo, error: null, efecto: efecto,
        descripcion: desc, tex: tex, matriz: actual,
        signo: signo, factor: new Frac(factor.n, factor.d)
      });
    });
    var coef = factor.por(new Frac(signo));
    var detOriginal = cap().det(A), detActual = cap().det(actual);
    return {
      matriz: actual, signo: signo, factor: factor, coef: coef,
      detOriginal: detOriginal, detActual: detActual, pasos: pasos,
      ok: detActual.cmp(coef.por(detOriginal)) === 0
    };
  }

  /* Figura del cuadro de mandos: original, actual y la relación. */
  function figRelacion(A, B, sim) {
    var mIzq = mideDet(A, { size: 22, minCelda: 46 });
    var mDer = mideDet(B, { size: 22, minCelda: 46 });
    var centro = 430;
    var W = Math.max(1000, mIzq.w + mDer.w + centro + 80);
    var b = '';

    b += S.txt(W / 2, 34, 'Cómo ha cambiado el determinante',
      { size: 22, weight: '700', fill: COL.azulOsc });
    b += S.txt(W / 2, 60, 'intercambios \u2192 signo   \u00b7   productos \u2192 factor   \u00b7   ' +
      'F\u1d62 \u2192 F\u1d62 + k\u00b7F\u2c7c \u2192 nada', { size: 17, weight: '700', fill: COL.gris });

    var y0 = 104;
    var x0 = Math.round((W - (mIzq.w + centro + mDer.w)) / 2);
    var dI = dibujaDet(A, x0, y0, { size: 22, minCelda: 46 });
    b += dI.b;
    b += S.txt(x0 + dI.w / 2, y0 - 14, 'matriz original', { size: 17, weight: '700', fill: COL.texto });
    b += S.txt(x0 + dI.w / 2, y0 + dI.h + 26, 'determinante = ' + NT(sim.detOriginal),
      { size: 18, weight: '700', fill: COL.azulOsc });

    var xd = x0 + mIzq.w + centro;
    var dD = dibujaDet(B, xd, y0, { size: 22, minCelda: 46, fondo: '#f7fbf7', borde: COL.verde });
    b += dD.b;
    b += S.txt(xd + dD.w / 2, y0 - 14, 'matriz actual', { size: 17, weight: '700', fill: COL.texto });
    b += S.txt(xd + dD.w / 2, y0 + dD.h + 26, 'determinante = ' + NT(sim.detActual),
      { size: 18, weight: '700', fill: COL.verde });

    var xc = x0 + mIzq.w + centro / 2;
    var yc = y0 + Math.max(dI.h, dD.h) / 2;
    b += S.line(x0 + mIzq.w + 16, yc, xd - 34, yc, COL.morado, 3);
    b += S.poly([[xd - 16, yc], [xd - 34, yc - 10], [xd - 34, yc + 10]], COL.morado, COL.morado);
    b += S.txt(xc, yc - 58, 'signo acumulado = ' + (sim.signo > 0 ? '+1' : '\u22121'),
      { size: 18, weight: '700', fill: sim.signo > 0 ? COL.verde : COL.rojo });
    b += S.txt(xc, yc - 30, 'factor acumulado = ' + NT(sim.factor),
      { size: 18, weight: '700', fill: igF(sim.factor, F1()) ? COL.verde : COL.naranja });
    b += S.txt(xc, yc + 34, 'coeficiente = ' + PT(sim.coef),
      { size: 18, weight: '700', fill: COL.morado });

    var yRel = S.altoDibujado(b) + 40;
    b += S.txt(W / 2, yRel, 'determinante actual = coeficiente \u00b7 determinante original',
      { size: 18, weight: '700', fill: COL.morado });
    b += S.txt(W / 2, yRel + 30, NT(sim.detActual) + ' = ' + PT(sim.coef) + ' \u00b7 ' +
      PT(sim.detOriginal), { size: 19, weight: '700', fill: COL.texto });

    return cierra(b, W, 'Relación entre el determinante actual y el original',
      'El coeficiente de la derecha es el producto del signo de los intercambios por el factor de ' +
      'los productos. Solo F\u1d62 \u2192 F\u1d62 + k\u00b7F\u2c7c lo deja en 1.');
  }

  R.laboratorioCeros = function (node) {
    var hist = [];
    function limpia() { hist.length = 0; }

    return S.shell(node, 'Laboratorio libre de transformaciones',
      'Aquí mandas tú: aplica las transformaciones que quieras y el applet lleva la cuenta ' +
      '<b>exacta</b> de cómo va cambiando el determinante. Recuerda el aviso clave del apartado: ' +
      K('F_i \\leftrightarrow F_j') + ' le <b>cambia el signo</b>, ' + K('F_i \\to kF_i') +
      ' lo <b>multiplica por k</b> y solo ' + K('F_i \\to F_i + kF_j') + ' lo deja <b>intacto</b>. ' +
      'Escribe la matriz por filas: <code>2 1 3; 1 0 2; 3 2 1</code> (o una fila por línea); valen ' +
      'fracciones: <code>1/2 3; 0 -2</code>. Las filas se numeran <b>desde 1</b>. Con ' +
      '<b>Deshacer</b> quitas el último movimiento y con <b>Reiniciar</b> vuelves a la matriz de partida.',
      [
        {
          id: 'A', label: 'Matriz de partida (una fila por línea)', type: 'textarea', rows: 5,
          value: '2 1 3\n1 0 2\n3 2 1', ancho: '17rem'
        },
        {
          id: 'tipo', label: 'Transformación', type: 'select', value: 'sumar', ancho: '23rem',
          options: TIPOS_LAB
        },
        { id: 'i', label: 'Fila Fi', type: 'number', min: 1, max: 5, value: 2, ancho: '8rem' },
        { id: 'j', label: 'Fila Fj', type: 'number', min: 1, max: 5, value: 1, ancho: '8rem' },
        { id: 'k', label: 'Número k', type: 'text', value: '-2', ancho: '8rem' },
        {
          id: 'aplicar', label: 'Aplicar transformación', type: 'button',
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
        { id: 'reiniciar', label: 'Reiniciar', type: 'button', click: limpia },
        chips([
          {
            txt: 'Empezar de cero (orden 3)', tip: 'matriz limpia',
            set: { A: '2 1 3\n1 0 2\n3 2 1', tipo: 'sumar', i: 2, j: 1, k: '-2' }, extra: limpia
          },
          {
            txt: 'Un intercambio F₁ ↔ F₃', tip: 'mira el signo',
            set: { A: '2 1 3\n1 0 2\n3 2 1', tipo: 'cambiar', i: 1, j: 3, k: '1' },
            extra: function () { hist.length = 0; hist.push({ tipo: 'cambiar', i: 0, j: 2, k: '1' }); }
          },
          {
            txt: 'Multiplicar F₂ por 3', tip: 'mira el factor',
            set: { A: '2 1 3\n1 0 2\n3 2 1', tipo: 'multiplicar', i: 2, j: 1, k: '3' },
            extra: function () { hist.length = 0; hist.push({ tipo: 'multiplicar', i: 1, j: 0, k: '3' }); }
          },
          {
            txt: 'La operación inocua F₂ → F₂ − 2·F₁', tip: 'el determinante no se mueve',
            set: { A: '2 1 3\n1 0 2\n3 2 1', tipo: 'sumar', i: 2, j: 1, k: '-2' },
            extra: function () { hist.length = 0; hist.push({ tipo: 'sumar', i: 1, j: 0, k: '-2' }); }
          },
          {
            txt: 'Dos intercambios seguidos', tip: 'el signo vuelve a +1',
            set: { A: '2 1 3\n1 0 2\n3 2 1', tipo: 'cambiar', i: 1, j: 2, k: '1' },
            extra: function () {
              hist.length = 0;
              hist.push({ tipo: 'cambiar', i: 0, j: 1, k: '1' });
              hist.push({ tipo: 'cambiar', i: 1, j: 2, k: '1' });
            }
          },
          {
            txt: 'Triangular una de orden 4', tip: 'solo con la operación inocua',
            set: { A: '1 2 3 1\n2 1 0 1\n0 1 1 1\n3 3 3 5', tipo: 'sumar', i: 2, j: 1, k: '-2' },
            extra: function () {
              hist.length = 0;
              hist.push({ tipo: 'sumar', i: 1, j: 0, k: '-2' });
              hist.push({ tipo: 'sumar', i: 3, j: 0, k: '-3' });
            }
          },
          {
            txt: 'Mezcla de las tres', tip: 'signo y factor a la vez',
            set: { A: '2 1 3\n1 0 2\n3 2 1', tipo: 'multiplicar', i: 1, j: 2, k: '2' },
            extra: function () {
              hist.length = 0;
              hist.push({ tipo: 'cambiar', i: 0, j: 1, k: '1' });
              hist.push({ tipo: 'multiplicar', i: 0, j: 1, k: '2' });
              hist.push({ tipo: 'sumar', i: 2, j: 0, k: '-1' });
            }
          },
          {
            txt: 'Movimiento ilegal (k = 0)', tip: 'el applet te avisa',
            set: { A: '2 1 3\n1 0 2\n3 2 1', tipo: 'multiplicar', i: 1, j: 2, k: '0' },
            extra: function () { hist.length = 0; hist.push({ tipo: 'multiplicar', i: 0, j: 1, k: '0' }); }
          }
        ])
      ],
      safe(function (v) {
        var A = leeCuadrada(v.A, 'la matriz', 5);
        if (A.f < 2) {
          throw Error('Escribe una matriz de orden 2, 3, 4 o 5. Con un solo número no hay filas ' +
            'que transformar. Prueba con 2 1 3; 1 0 2; 3 2 1.');
        }
        var n = A.f;
        /* Los movimientos que se salen de la matriz actual se descartan
           en silencio si vienen de una matriz anterior más grande. */
        var usables = hist.filter(function (o) {
          return o.i < n && o.j < n && o.i >= 0 && o.j >= 0;
        });
        var descartados = hist.length - usables.length;
        var sim = simulaLab(A, usables);

        var h = caja('Matriz de partida, de orden ' + n, cap().matTex(A));
        h += parrafo('Determinante de partida: ' + K('|A| = ' + FT(sim.detOriginal)) +
          '. A partir de aquí, cada transformación que apliques queda registrada con su efecto ' +
          'sobre el determinante.');

        /* avisos: solo el del último movimiento, nunca acumulados */
        var lista = [];
        var ultimo = sim.pasos[sim.pasos.length - 1];
        if (ultimo && !ultimo.ok) lista.push(ultimo.error);
        if (descartados > 0) {
          lista.push('He descartado ' + descartados + ' movimiento(s) del historial porque ' +
            'nombraban filas que no existen en una matriz de orden ' + n + '. Pulsa Reiniciar si ' +
            'quieres empezar limpio.');
        }
        h += avisos(lista);

        h += titulo('Tus transformaciones (' + sim.pasos.filter(function (p) { return p.ok; }).length + ')');
        var nOk = 0;
        sim.pasos.forEach(function (p) {
          if (!p.ok) return;
          nOk++;
          var etiquetaEfecto = p.efecto === 'signo'
            ? '<p class="detd-mal">Efecto: el determinante <b>cambia de signo</b>.</p>'
            : (p.efecto === 'factor'
              ? '<p class="detd-mal">Efecto: el determinante <b>queda multiplicado</b>.</p>'
              : '<p class="detd-bien">Efecto: <b>ninguno</b>. El determinante no se mueve.</p>');
          h += S.paso(String(nOk),
            '<p>' + S.esc(p.descripcion) + '</p>' + op(p.tex) +
            '<div class="detd-caja">' + KD(cap().matTex(p.matriz)) + '</div>' +
            etiquetaEfecto +
            '<p class="detd-ref">Acumulado hasta aquí: signo ' +
            (p.signo > 0 ? '+1' : '\u22121') + ', factor ' + S.esc(NT(p.factor)) + '.</p>',
            p.efecto === 'nada' ? 'detd-paso-ok' : 'detd-paso-mal');
        });
        if (!nOk) {
          h += parrafo('Todavía no has aplicado ninguna transformación válida. Un primer movimiento ' +
            'típico es ' + K('F_2 \\to F_2 - 2F_1') + ': elige <b>Fi → Fi + k·Fj</b>, escribe ' +
            'Fi = 2, Fj = 1 y k = −2, y pulsa <b>Aplicar transformación</b>.');
        }

        h += titulo('El marcador');
        h += caja('Matriz actual', cap().matTex(sim.matriz));
        h += S.tabla(['Concepto', 'Valor', 'De dónde sale'], [
          ['Determinante original', K(FT(sim.detOriginal)), 'de la matriz que escribiste'],
          ['Intercambios de filas',
            K(String(sim.pasos.filter(function (p) { return p.ok && p.tipo === 'cambiar'; }).length)),
            'cada uno multiplica por ' + K('-1')],
          ['Signo acumulado', K(sim.signo > 0 ? '+1' : '-1'), K('(-1)^{\\text{intercambios}}')],
          ['Factor acumulado', K(FT(sim.factor)), 'producto de las k de ' + K('F_i \\to kF_i')],
          ['Coeficiente total', K(FT(sim.coef)), 'signo por factor'],
          ['Determinante actual', K(FT(sim.detActual)), K('\\text{coeficiente}\\cdot|A|')]
        ]);
        h += caja('La relación, en una línea',
          '|A_{\\text{actual}}| = ' + S.parNegTex(FT(sim.coef)) + '\\cdot |A| = ' +
          S.parNegTex(FT(sim.coef)) + '\\cdot' + S.parNegTex(FT(sim.detOriginal)) + ' = ' +
          FT(sim.detActual));
        h += caja('Y al revés, para recuperar el original',
          '|A| = \\dfrac{|A_{\\text{actual}}|}{' + FT(sim.coef) + '} = ' + FT(sim.detOriginal));

        h += figRelacion(A, sim.matriz, sim);

        if (sim.ok) {
          h += bien('La cuenta cuadra: el determinante actual es exactamente el original ' +
            'multiplicado por el coeficiente acumulado.');
        } else {
          h += mal('Algo no cuadra en el seguimiento. Pulsa <b>Reiniciar</b> y avisa al profesor.');
        }

        if (igF(sim.coef, F1())) {
          h += bien('<b>Coeficiente 1:</b> todo lo que has hecho deja el determinante intacto. Eso ' +
            'solo pasa si te has limitado a ' + K('F_i \\to F_i + kF_j') + ' (o si los signos y los ' +
            'factores se han compensado justo).');
        } else {
          h += aviso('<b>Coeficiente ' + K(FT(sim.coef)) + ':</b> el determinante de la matriz ' +
            'actual <b>ya no es</b> el de la original. Si estás calculando un determinante haciendo ' +
            'ceros, tienes que deshacer ese coeficiente al final; por eso en el método solo se usa ' +
            K('F_i \\to F_i + kF_j') + ', que lo deja en 1.');
        }

        h += S.kvs([
          'orden = <b>' + n + '</b>',
          'transformaciones válidas = <b>' + nOk + '</b>',
          'signo acumulado = <b>' + (sim.signo > 0 ? '+1' : '\u22121') + '</b>',
          'factor acumulado = <b>' + NT(sim.factor) + '</b>',
          '|original| = <b>' + NT(sim.detOriginal) + '</b>',
          '|actual| = <b>' + NT(sim.detActual) + '</b>'
        ]);
        h += parrafo('<b>El aviso que hay que memorizar.</b> De las tres operaciones elementales, ' +
          'solo ' + K('F_i \\to F_i + kF_j') + ' conserva el determinante. ' +
          K('F_i \\leftrightarrow F_j') + ' le cambia el signo y ' + K('F_i \\to kF_i') +
          ' lo multiplica por ' + K('k') + ' (de ahí que ' + K('|kA| = k^n|A|') + ', porque se ' +
          'multiplican las ' + K('n') + ' filas). En Gauss se usan las tres sin miedo, porque el ' +
          'rango no cambia; con determinantes, cada una deja su huella.');
        return h;
      }, EJEMPLO));
  };

  /* ==================================================================
     8 · gancho de pruebas (lo usa tests/test-mod-det-d.js; no se ve
     en la web)
     ================================================================== */
  S.dTestD = {
    nodosRecursion: nodosRecursion,
    factorial: factorial,
    costeDefinicion: costeDefinicion,
    costeAdjuntos: costeAdjuntos,
    costeCeros: costeCeros,
    simulaLab: simulaLab,
    resumeCeros: resumeCeros,
    categoriaPivote: categoriaPivote,
    opTxt: opTxt,
    opTex: opTex,
    sub: sub,
    claves: ['orden4', 'recursivo', 'coste', 'hacerCeros', 'pivote', 'laboratorioCeros']
  };

  window.DET.extraD = true;
  if (S.monta) S.monta();
})();
