/* =====================================================================
   det-applets-f.js · Módulo F del Tema 2 «Determinantes»
   2.º de Bachillerato · Matemáticas Aplicadas a las Ciencias Sociales
   Ruta: 2-BatxMatesCCSS/determinantes/assets/det-applets-f.js

   Cubre los apartados 2.14, 2.15 y 2.16 del tema:

     2.14  Matriz de los adjuntos.
     2.15  Cálculo de la inversa usando determinantes.
     2.16  Práctica y autoevaluación del tema.

   ---------------------------------------------------------------------
   CLAVES REGISTRADAS (8)
   ---------------------------------------------------------------------
     matAdjuntos      Construcción de la matriz de los adjuntos casilla a
                      casilla. Matriz cuadrada editable de orden 2, 3 o 4;
                      rejilla de n² casillas que se van rellenando de una
                      en una; al elegir una casilla se ve de dónde sale
                      (el menor complementario resaltado sobre la matriz
                      original, con la fila y la columna tachadas, y el
                      signo del tablero). Al final, Adj(A) y su
                      transpuesta lado a lado.
     identidadAdj     La identidad A·Adj(A)ᵗ = |A|·I. Producto realizado
                      de verdad, comprobación de que sale la matriz
                      escalar con el determinante en la diagonal y lectura
                      elemento a elemento: en la diagonal, desarrollo por
                      los adjuntos de la PROPIA línea (da |A|); fuera de
                      la diagonal, desarrollo con los adjuntos de una
                      línea AJENA (da 0, como en el applet «filaAjena»
                      del apartado 2.7). De ahí sale la fórmula de la
                      inversa.
     inversaDet       Inversa por determinantes paso a paso, con
                      DET.inversaDet: determinante, comprobación de que
                      no es cero, matriz de los adjuntos, transposición,
                      división por el determinante y comprobación final
                      A·A⁻¹ = I hecha de verdad. Un bloque por paso y
                      botón de avanzar.
     inversa2x2Det    La regla rápida del orden 2: se intercambian los
                      elementos de la diagonal principal, se cambia el
                      signo a los de la secundaria y se divide entre el
                      determinante. Flechas en el SVG para el intercambio
                      y los cambios de signo, y comprobación de que
                      coincide con la fórmula general.
     existeInversa    ¿Regular o singular? Veredicto razonado con el
                      determinante como criterio, cadena
                      |A| ≠ 0 ⟺ rg(A) = n ⟺ filas independientes,
                      batería de matrices clasificadas y juego de
                      decisión rápida con contador de aciertos.
     inversaParam     Inversa con parámetro. |A| como polinomio en k,
                      resolución de |A| = 0, valores de k para los que NO
                      existe inversa (recta real con los valores
                      excluidos marcados con círculo hueco) y evaluación
                      de la inversa en un valor concreto de k.
     entrenador       Entrenador de cálculo de todo el tema: determinante
                      de orden 2, de orden 3 por Sarrus, de orden 4
                      haciendo ceros, rango, adjunto de un elemento e
                      inversa por determinantes, con tres niveles de
                      dificultad. Corrección, resolución completa si se
                      falla, contador de aciertos y racha.
     autoevaluacion   Autoevaluación del tema: 15 cuestiones, una por
                      apartado, de opción múltiple y de respuesta
                      numérica, con corrección al final, puntuación y,
                      para cada fallo, la explicación y el apartado al
                      que volver.

   El applet `diagnostico` vive en el núcleo: aquí no se reprograma.

   ---------------------------------------------------------------------
   DEPENDENCIAS
   ---------------------------------------------------------------------
   Necesita, cargados antes:
     · el núcleo   det-applets.js       (window.DET)
     · la capa     det-applets-alg.js   (álgebra matricial exacta)
     · la capa     det-applets-det.js   (determinantes del tema)

   De la capa de determinantes se usan, sin reimplementar ni una cuenta:
     matAdjuntos, adjunto, signoAdj, menorComp, subMat, tableroSignos,
     desarrollo, sarrus, hacerCeros, rangoMenores, inversaDet, detParam,
     matParamDe, evalParam, polDeMatriz, numTxtDet, parTxtDet, detTex.
   De la capa matricial: parseMat, matDe, Mat, matTex, matTxt, matIgual,
     matProd, matTrans, matEscalar, matIdentidad, esIdentidad, dimTxt,
     det, detPasos, rango, rangoPasos, inversa, fracDe, fracTex.
   Del núcleo: shell, registry, K, KD, esc, texifica, expr, paso, tabla,
     badge, kvs, resultado, svgWrap, altoDibujado, txt, line, rect,
     circle, path, poly, rectaReal, COL y Frac.

   ---------------------------------------------------------------------
   CRITERIOS DE PRESENTACIÓN (sección 6 de la especificación)
   ---------------------------------------------------------------------
   1. Título «Applet · Nombre», sin numeración (lo pone DET.shell).
   2. Instrucciones con ejemplo copiable, incluido el formato de las
      matrices con parámetro.
   3. Escenarios con nombre en botones.
   4. SVG de 900 px de ancho; celdas a 22 px o más, rótulos a 17 px o más
      en negrita; el alto se deriva de lo dibujado con DET.altoDibujado,
      dejando 22 px de margen inferior.
   5. Dentro de un <text> de SVG, nunca LaTeX: solo Unicode (a₁₂, A₂₃,
      ·, ×, −, ≠, ⁻¹). El LaTeX vive fuera, en KaTeX.
   6. Índices siempre en base 1; coma decimal; nunca «+ −3», sino
      «+ (−3)»; fracciones exactas (1/3, jamás 0,3333).
   7. Todo el cómputo va dentro de safe(): ninguna entrada mala rompe la
      página y los avisos no se acumulan porque la salida se rehace
      entera en cada recálculo.

   Clases CSS: se reutilizan las del tema con doble clase
   `detf-x detd-x`, de modo que el aspecto es el ya definido en
   det-applets.css y no hace falta tocar la hoja de estilos.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.DET;
  if (!S) {
    if (window.console && console.error) {
      console.error('[determinantes] det-applets-f.js necesita det-applets.js cargado antes.');
    }
    return;
  }

  var R = S.registry;
  var K = S.K, KD = S.KD, COL = S.COL;
  var Frac = S.Frac;

  /* ==================================================================
     0 · utilidades locales del módulo
     ================================================================== */

  /* Acceso perezoso a las dos capas: si falta alguna, el aviso es claro. */
  function alg() {
    if (!S.parseMat || !S.matProd || !S.det) {
      throw Error('No se ha cargado la capa de álgebra matricial (det-applets-alg.js). ' +
        'Recarga la página; si el aviso sigue, avisa al profesor.');
    }
    if (!S.matAdjuntos || !S.inversaDet || !S.detParam) {
      throw Error('No se ha cargado la capa de determinantes (det-applets-det.js). ' +
        'Recarga la página; si el aviso sigue, avisa al profesor.');
    }
    return S;
  }

  function FR(v) { return alg().fracDe(v); }
  function FT(f) { return alg().fracTex(f, true); }
  function F0() { return new Frac(0); }
  function F1() { return new Frac(1); }
  function cero(f) { return f.n === 0n; }
  function igF(a, b) { return a.cmp(b) === 0; }

  /* Número exacto en TEXTO LLANO para los rótulos de los SVG:
     «8/5», «−3/5», «2», «0,5». Coma decimal y menos U+2212. */
  function numTxt(f) { return alg().numTxtDet(f); }
  /* Igual, pero entre paréntesis si es negativo: para «+ (−3)». */
  function parTxt(f) { return alg().parTxtDet(f); }

  /* Subíndices Unicode: 12 -> «₁₂». Para los rótulos de los SVG. */
  var SUB = ['\u2080', '\u2081', '\u2082', '\u2083', '\u2084',
    '\u2085', '\u2086', '\u2087', '\u2088', '\u2089'];
  function sub(n) {
    var s = String(Math.abs(Math.round(Number(n) || 0))), r = '', i;
    for (i = 0; i < s.length; i++) r += SUB[Number(s.charAt(i))] || s.charAt(i);
    return r;
  }
  /* Nombres de elemento y de adjunto en Unicode (índices BASE 1). */
  function nomA(i, j) { return 'a' + sub(i + 1) + sub(j + 1); }
  function nomAdj(i, j) { return 'A' + sub(i + 1) + sub(j + 1); }
  /* Nombres en TeX (índices BASE 1). */
  function texA(i, j) { return 'a_{' + (i + 1) + (j + 1) + '}'; }
  function texAdj(i, j) { return 'A_{' + (i + 1) + (j + 1) + '}'; }
  function texMen(i, j) { return '\\alpha_{' + (i + 1) + (j + 1) + '}'; }

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

  var EJEMPLO = 'Escribe la matriz por filas: <code>2 1; 1 1</code> (o una fila por línea). ' +
    'Valen enteros (<code>-2</code>), decimales con coma (<code>0,5</code>) y fracciones ' +
    '(<code>1/2</code>).';
  var EJEMPLO_K = 'Con parámetro se escribe igual, poniendo la letra donde haga falta: ' +
    '<code>1 1 1; 1 k 1; 1 1 k</code>. También valen <code>k-1</code>, <code>2k+3</code> y ' +
    '<code>k^2</code>.';

  /* Envoltorio: cualquier error se convierte en un aviso amable dentro
     del applet, nunca en un error que rompa la página. Al rehacerse la
     salida completa en cada recálculo, los avisos NO se acumulan. */
  function safe(fn, ayuda) {
    return function (v, ctl, out, api) {
      try {
        var h = fn(v, ctl, out, api);
        return (h === undefined || h === null || h === '')
          ? '<div class="mx-bad detf-err detd-err">No hay nada que mostrar todavía: revisa los ' +
            'datos que has escrito. ' + (ayuda || EJEMPLO) + '</div>'
          : h;
      } catch (e) {
        var m = (e && e.message) ? e.message : 'No he podido calcular con estos datos.';
        return '<div class="mx-bad detf-err detd-err">' + S.esc(m) +
          (ayuda ? '<br>' + ayuda : '') + '</div>';
      }
    };
  }

  /* Piezas de salida estándar del módulo. */
  function caja(label, tex) {
    return '<div class="detf-caja detd-caja">' + S.expr(label, tex) + '</div>';
  }
  function parrafo(html) { return '<p class="detf-txt detd-txt">' + html + '</p>'; }
  function titulo(t) { return '<h5 class="detf-h detd-h">' + t + '</h5>'; }
  function aviso(html) { return '<p class="detf-aviso detd-aviso">' + html + '</p>'; }
  function pista(html) { return '<p class="detf-pista detd-pista"><b>Pista:</b> ' + html + '</p>'; }
  function bien(html) { return '<p class="ap-ok detf-bien detd-bien">' + html + '</p>'; }
  function mal(html) { return '<p class="ap-ko detf-mal detd-mal">' + html + '</p>'; }
  function op(tex) { return '<div class="detf-op detd-op">' + KD(tex) + '</div>'; }
  function ref(html) { return '<div class="detf-ref detd-ref">' + html + '</div>'; }

  /* ------------------------------------------------------------------
     Lectura de matrices, con límites de tamaño y avisos didácticos.
     ------------------------------------------------------------------ */
  function leeM(txtIn, etiqueta, maxF, maxC) {
    etiqueta = etiqueta || 'la matriz';
    var s = String(txtIn === undefined || txtIn === null ? '' : txtIn).trim();
    if (s === '') {
      throw Error('Escribe ' + etiqueta + ' por filas, separando los elementos con espacios y ' +
        'las filas con «;» o con un salto de línea. Por ejemplo: 2 1; 1 1. También valen las ' +
        'fracciones (1/2) y los decimales con coma (0,5).');
    }
    var A = alg().parseMat(s);
    if (maxF && A.f > maxF) {
      throw Error('Este applet trabaja con un máximo de ' + maxF + ' filas y has escrito ' + A.f +
        '. Quita alguna fila: así la matriz se ve grande y legible en pantalla.');
    }
    if (maxC && A.c > maxC) {
      throw Error('Este applet trabaja con un máximo de ' + maxC + ' columnas y has escrito ' +
        A.c + '. Quita alguna columna para que la matriz se vea bien.');
    }
    return A;
  }

  /* Lee una matriz y EXIGE que sea cuadrada, con explicación si no lo es. */
  function leeCuadrada(txtIn, etiqueta, maxN) {
    var A = leeM(txtIn, etiqueta, maxN || 4, maxN || 4);
    if (A.f !== A.c) {
      throw Error('Solo las matrices CUADRADAS tienen determinante, adjuntos e inversa, y ' +
        etiqueta + ' es de ' + A.f + '×' + A.c + '. Escribe tantas filas como columnas, por ' +
        'ejemplo 2 1; 1 1.');
    }
    if (A.f < 2) {
      throw Error('Escribe ' + etiqueta + ' de orden 2, 3 o 4: con una matriz de orden 1 no hay ' +
        'menores complementarios que mirar. Por ejemplo: 2 1; 1 1.');
    }
    return A;
  }

  /* Lee una matriz de orden exactamente n. */
  function leeOrden(txtIn, etiqueta, n) {
    var A = leeCuadrada(txtIn, etiqueta, 4);
    if (A.f !== n) {
      throw Error('Este applet necesita ' + etiqueta + ' de orden ' + n + ' y has escrito una de ' +
        'orden ' + A.f + '. Escribe ' + n + ' filas con ' + n + ' elementos cada una, por ejemplo ' +
        (n === 2 ? '2 1; 1 1' : '1 2 3; 0 1 4; 5 6 0') + '.');
    }
    return A;
  }

  /* Entero de un campo numérico, con recorte silencioso al rango. */
  function ent(v, min, max, porOmision) {
    var x = Math.round(Number(String(v === undefined || v === null ? '' : v).replace(',', '.')));
    if (!isFinite(x)) x = porOmision;
    if (x < min) x = min;
    if (x > max) x = max;
    return x;
  }

  /* Matriz de textos con los valores de un Mat, para dibujar en el SVG. */
  function txtsDe(M) {
    var r = [], i, j;
    for (i = 0; i < M.f; i++) {
      r.push([]);
      for (j = 0; j < M.c; j++) r[i].push(numTxt(M.a[i][j]));
    }
    return r;
  }

  /* Fracción exacta (nunca 0,3333) de un elemento de la inversa, en TeX. */
  function fracTexExacta(f) { return FT(f); }

  /* ==================================================================
     1 · piezas de dibujo (rótulos SIEMPRE en texto llano Unicode)
     ================================================================== */
  var W = 900;                                  /* ancho único de las figuras */

  /* Alto derivado de lo dibujado, con 22 px de margen inferior. */
  function fig(body, label, cap) {
    var h = S.altoDibujado(body) + 22;
    return S.svgWrap(body, W, h, label, cap);
  }

  /* Ancho aproximado de un rótulo, en unidades del viewBox. Sirve para
     centrar sin recortar y para separar el glifo «≠» del carácter que
     le sigue. Los factores son los de la pila sans-serif del tema,
     medidos sobre el cuerpo de la letra.                            */
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

  /* El glifo «≠» de la pila de fuentes que usa el SVG se monta sobre el
     carácter siguiente (auditoría: existeInversa D1, «|A| ≠0»). Aquí se
     dibuja en su PROPIO <text>, con la posición medida y un hueco a
     cada lado, así que nunca toca a su vecino. Si la cadena no lleva
     «≠» se delega tal cual en S.txt. En HTML/KaTeX el mismo carácter
     se compone bien y no se toca nada.                              */
  var NEQ = '\u2260';
  function txtNe(x, y, s, o) {
    o = o || {};
    s = String(s === undefined || s === null ? '' : s);
    if (s.indexOf(NEQ) < 0) return S.txt(x, y, s, o);
    var size = o.size || 18;
    var peso = String(o.weight || '');
    var bold = (peso === '700' || peso === 'bold' || peso === '600');
    var hueco = Math.max(6, Math.round(size * 0.34));
    /* Se toma el ancho MÁS generoso de los dos modelos: el fino por
       carácter y el plano (0,56 · cuerpo · nº de caracteres), que es el
       que usa el arnés de rótulos. Así el hueco nunca sale corto.  */
    function ancho(t) {
      return Math.max(anchoTxt(t, size, bold),
        t === '' ? 0 : Math.max(12, Math.round(String(t).length * size * 0.56)));
    }
    /* El glifo «≠» de la tipografía del tema se compone mal dentro de un
       <text> de SVG: la barra inclinada se dibuja desplazada y se lee
       «=/». Así que el símbolo NO se escribe como carácter: se pone un
       «=» (que sí se compone bien) y se le cruza una barra medida.  */
    function noIgual(xa, cuerpo) {
      var wIg = ancho('='), cx = xa + wIg / 2;
      var gr = Math.max(1.6, cuerpo * 0.085);
      var x1 = cx - cuerpo * 0.19, x2 = cx + cuerpo * 0.19;
      var y1 = y + cuerpo * 0.16, y2 = y - cuerpo * 0.58;
      return S.txt(xa, y, '=', oi) +
        S.path('M' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
               ' L' + x2.toFixed(1) + ' ' + y2.toFixed(1), oi.fill || COL.texto, gr, 'none');
    }
    var wNe = ancho(NEQ);
    var trozos = s.split(NEQ).map(function (t) { return t.replace(/^\s+|\s+$/g, ''); });
    var anchos = trozos.map(ancho);
    var total = (trozos.length - 1) * (wNe + 2 * hueco), i;
    for (i = 0; i < anchos.length; i++) total += anchos[i];
    var anchor = o.anchor || 'middle';
    var xi = anchor === 'start' ? x : (anchor === 'end' ? x - total : x - Math.round(total / 2));
    var oi = {}, kk;
    for (kk in o) if (Object.prototype.hasOwnProperty.call(o, kk)) oi[kk] = o[kk];
    oi.anchor = 'start';
    var b = '';
    for (i = 0; i < trozos.length; i++) {
      if (i > 0) {
        b += noIgual(xi + hueco + Math.round((wNe - anchoTxt('=', size, bold)) / 2), size);
        xi += wNe + 2 * hueco;
      }
      if (trozos[i] !== '') b += S.txt(xi, y, trozos[i], oi);
      xi += anchos[i];
    }
    return b;
  }

  /* Una malla de celdas con paréntesis a los lados.
     opts = { size, fondo(i,j), borde(i,j), color(i,j), par, tacha(i,j) } */
  function malla(x0, y0, cw, ch, T, opts) {
    var o = opts || {}, b = '', i, j;
    var f = T.length, c = T[0].length;
    var an = c * cw, al = f * ch;
    for (i = 0; i < f; i++) {
      for (j = 0; j < c; j++) {
        var x = x0 + j * cw, y = y0 + i * ch;
        var fondo = o.fondo ? o.fondo(i, j) : null;
        var borde = o.borde ? o.borde(i, j) : null;
        if (fondo || borde) {
          b += S.rect(x + 3, y + 3, cw - 6, ch - 6, fondo || 'none', borde || 'none',
            { r: 8, sw: borde ? 3 : 1.4 });
        }
        b += S.txt(x + cw / 2, y + ch / 2 + 8, T[i][j],
          { size: o.size || 22, weight: '700', fill: (o.color ? o.color(i, j) : COL.texto) || COL.texto });
      }
    }
    if (o.par !== false) {
      b += S.path('M ' + (x0 - 8) + ' ' + (y0 + 4) + ' C ' + (x0 - 24) + ' ' + (y0 + al * 0.28) +
        ', ' + (x0 - 24) + ' ' + (y0 + al * 0.72) + ', ' + (x0 - 8) + ' ' + (y0 + al - 4),
        COL.gris, 3);
      b += S.path('M ' + (x0 + an + 8) + ' ' + (y0 + 4) + ' C ' + (x0 + an + 24) + ' ' + (y0 + al * 0.28) +
        ', ' + (x0 + an + 24) + ' ' + (y0 + al * 0.72) + ', ' + (x0 + an + 8) + ' ' + (y0 + al - 4),
        COL.gris, 3);
    }
    return b;
  }

  /* Rótulos de fila y de columna, BASE 1 y con la notación del tema:
     F₁, F₂… y C₁, C₂…, no «f 1» ni «col 1» (auditoría: matAdjuntos D2). */
  function rotulos(x0, y0, cw, ch, f, c) {
    var b = '', i, j;
    for (j = 0; j < c; j++) {
      b += S.txt(x0 + j * cw + cw / 2, y0 - 12, 'C' + sub(j + 1),
        { size: 18, weight: '700', fill: COL.gris });
    }
    for (i = 0; i < f; i++) {
      b += S.txt(x0 - 30, y0 + i * ch + ch / 2 + 6, 'F' + sub(i + 1),
        { size: 18, weight: '700', fill: COL.gris, anchor: 'end' });
    }
    return b;
  }

  /* ------------------------------------------------------------------
     Figura: de dónde sale un adjunto. La matriz original con la fila i
     y la columna j tachadas, el menor complementario resaltado, el
     signo del tablero y el valor del adjunto.  i, j en base 0.
     ------------------------------------------------------------------ */
  function figMenor(A, i, j) {
    var n = A.f, cw = 78, ch = 62;
    var x0 = 120, y0 = 96, b = '';
    var men = alg().menorComp(A, i, j);
    var sg = alg().signoAdj(i, j);
    var adj = alg().adjunto(A, i, j);

    b += S.txt(W / 2, 44, 'De dónde sale el adjunto ' + nomAdj(i, j) + ': fila ' + (i + 1) +
      ', columna ' + (j + 1), { size: 24, weight: '700', fill: COL.azulOsc });
    b += rotulos(x0, y0, cw, ch, n, n);
    b += malla(x0, y0, cw, ch, txtsDe(A), {
      size: 23,
      fondo: function (p, q) {
        if (p === i && q === j) return '#fdecea';
        if (p === i || q === j) return '#f4f6f8';
        return '#eef8ef';
      },
      borde: function (p, q) { return (p === i && q === j) ? COL.rojo : null; },
      color: function (p, q) { return (p === i || q === j) ? COL.gris : COL.verde; }
    });
    /* tachado de la fila i y de la columna j */
    b += S.line(x0 - 4, y0 + i * ch + ch / 2, x0 + n * cw + 4, y0 + i * ch + ch / 2, COL.rojo, 2.6, '7 5');
    b += S.line(x0 + j * cw + cw / 2, y0 - 4, x0 + j * cw + cw / 2, y0 + n * ch + 4, COL.rojo, 2.6, '7 5');

    var yb = y0 + n * ch + 46;
    b += S.txt(x0, yb, 'se tacha la fila ' + (i + 1) + ' y la columna ' + (j + 1) +
      ': queda el menor complementario (en verde)',
      { size: 18, weight: '700', fill: COL.texto, anchor: 'start' });
    yb += 36;
    b += S.txt(x0, yb, 'menor complementario \u03B1' + sub(i + 1) + sub(j + 1) + ' = ' + numTxt(men),
      { size: 20, weight: '700', fill: COL.verde, anchor: 'start' });
    yb += 34;
    b += S.txt(x0, yb, 'signo del tablero (\u22121) elevado a ' + (i + 1) + '+' + (j + 1) + ' = ' +
      (sg > 0 ? '+' : '\u2212') + '1', { size: 20, weight: '700', fill: COL.morado, anchor: 'start' });
    yb += 34;
    b += S.txt(x0, yb, 'adjunto ' + nomAdj(i, j) + ' = ' + (sg > 0 ? '+' : '\u2212') + '1 \u00B7 ' +
      parTxt(men) + ' = ' + numTxt(adj), { size: 21, weight: '700', fill: COL.azulOsc, anchor: 'start' });
    return fig(b, 'Menor complementario y adjunto del elemento de la fila ' + (i + 1) +
      ' y la columna ' + (j + 1),
      'El signo se aplica al <b>menor</b>, nunca al elemento: ' +
      K(texAdj(i, j) + ' = (-1)^{' + (i + 1) + '+' + (j + 1) + '}\\cdot' + texMen(i, j)) + '.');
  }

  /* ------------------------------------------------------------------
     Figura: la rejilla de los n² adjuntos, con las casillas ya
     rellenadas y la casilla en estudio resaltada.
     ------------------------------------------------------------------ */
  function figRejilla(A, adj, llenas, sel) {
    var n = A.f, cw = 96, ch = 68;
    var x0 = 150, y0 = 108, b = '', i, j;
    var T = [], orden = 0;
    for (i = 0; i < n; i++) {
      T.push([]);
      for (j = 0; j < n; j++) {
        orden = i * n + j;
        /* La casilla por rellenar lleva un «?» legible: el «·» de antes
           parecía suciedad más que hueco (auditoría: matAdjuntos D1). */
        T[i].push(orden < llenas ? numTxt(adj.a[i][j]) : '?');
      }
    }
    b += S.txt(W / 2, 44, 'Matriz de los adjuntos: ' + llenas + ' de ' + (n * n) + ' casillas',
      { size: 24, weight: '700', fill: COL.azulOsc });
    b += S.txt(W / 2, 76, 'en la casilla (fila i, columna j) va el adjunto del elemento que ocupa ese lugar',
      { size: 18, weight: '600', fill: COL.gris });
    b += rotulos(x0, y0, cw, ch, n, n);
    b += malla(x0, y0, cw, ch, T, {
      size: 23,
      fondo: function (p, q) {
        if (sel && p === sel[0] && q === sel[1]) return '#fff8e1';
        return (p * n + q) < llenas ? '#eef4fc' : '#f7f9fb';
      },
      borde: function (p, q) {
        if (sel && p === sel[0] && q === sel[1]) return COL.naranja;
        return (p * n + q) < llenas ? '#b3c7e6' : '#c3ced8';
      },
      color: function (p, q) { return (p * n + q) < llenas ? COL.azulOsc : '#8b9aa8'; }
    });
    var yb = y0 + n * ch + 46;
    var etq = [];
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) etq.push(nomAdj(i, j));
    b += S.txt(x0, yb, 'orden de relleno: ' + etq.join(', '),
      { size: 17, weight: '700', fill: COL.gris, anchor: 'start' });
    if (sel) {
      yb += 34;
      b += S.txt(x0, yb, 'casilla en estudio: fila ' + (sel[0] + 1) + ', columna ' + (sel[1] + 1) +
        '   \u2192   ' + nomAdj(sel[0], sel[1]) + ' = ' + numTxt(adj.a[sel[0]][sel[1]]),
        { size: 20, weight: '700', fill: COL.naranja, anchor: 'start' });
    }
    return fig(b, 'Rejilla de los adjuntos de la matriz',
      'Cada casilla es un determinante de orden ' + (n - 1) + ' con su signo: ' +
      K('\\operatorname{Adj}(A)_{ij} = A_{ij}') + '.');
  }

  /* ------------------------------------------------------------------
     Figura: A·Adj(A)ᵗ = |A|·I, con el producto ya calculado.
     ------------------------------------------------------------------ */
  function figIdentidad(A, P, d, sel) {
    var n = A.f, cw = 92, ch = 64;
    var x0 = 150, y0 = 110, b = '', i, j;
    b += S.txt(W / 2, 44, 'A \u00B7 Adj(A)\u1D57 = |A| \u00B7 I',
      { size: 26, weight: '700', fill: COL.azulOsc });
    b += S.txt(W / 2, 78, 'el producto sale escalar: el determinante en la diagonal y ceros fuera',
      { size: 18, weight: '600', fill: COL.gris });
    b += rotulos(x0, y0, cw, ch, n, n);
    b += malla(x0, y0, cw, ch, txtsDe(P), {
      size: 23,
      fondo: function (p, q) {
        if (sel && p === sel[0] && q === sel[1]) return '#fff8e1';
        return p === q ? '#eef8ef' : '#f7f9fb';
      },
      borde: function (p, q) {
        if (sel && p === sel[0] && q === sel[1]) return COL.naranja;
        return p === q ? COL.verde : null;
      },
      color: function (p, q) { return p === q ? COL.verde : COL.gris; }
    });
    var yb = y0 + n * ch + 46;
    b += S.txt(x0, yb, 'en la diagonal: ' + numTxt(d) + ' = |A|   (desarrollo por los adjuntos de la propia fila)',
      { size: 19, weight: '700', fill: COL.verde, anchor: 'start' });
    yb += 34;
    b += S.txt(x0, yb, 'fuera de la diagonal: 0   (elementos de una fila por los adjuntos de OTRA fila)',
      { size: 19, weight: '700', fill: COL.rojo, anchor: 'start' });
    yb += 34;
    /* Aquí la condición se dice con palabras: en un rótulo largo el
       glifo «≠» necesitaría un hueco tan ancho que rompe la frase, y
       «que |A| no valga 0» se lee igual de bien (auditoría:
       identidadAdj / existeInversa D1). En KaTeX sí va el ≠.       */
    b += S.txt(x0, yb, 'de aquí sale la inversa: A\u207B\u00B9 = (1/|A|) \u00B7 Adj(A)\u1D57',
      { size: 20, weight: '700', fill: COL.azulOsc, anchor: 'start' });
    yb += 30;
    b += S.txt(x0, yb, 'y por eso hace falta que |A| no valga 0',
      { size: 20, weight: '700', fill: COL.azulOsc, anchor: 'start' });
    return fig(b, 'Identidad A por la transpuesta de la matriz de los adjuntos',
      'La igualdad ' + K('A\\cdot\\operatorname{Adj}(A)^{t} = |A|\\cdot I') +
      ' es la que justifica la fórmula de la inversa.');
  }

  /* ------------------------------------------------------------------
     Figura: la receta del orden 2, con flechas de intercambio y de
     cambio de signo.
     ------------------------------------------------------------------ */
  function figReceta(A, D) {
    var a = A.a[0][0], b2 = A.a[0][1], c = A.a[1][0], d = A.a[1][1];
    var cw = 96, ch = 76, b = '';
    var x0 = 120, y0 = 164, x1 = 560;
    b += S.txt(W / 2, 44, 'La receta del orden 2', { size: 26, weight: '700', fill: COL.azulOsc });
    b += S.txt(W / 2, 76, 'la diagonal principal se intercambia y la secundaria cambia de signo',
      { size: 18, weight: '600', fill: COL.gris });

    b += S.txt(x0 + cw, y0 - 16, 'matriz A', { size: 18, weight: '700', fill: COL.gris });
    b += malla(x0, y0, cw, ch, [[numTxt(a), numTxt(b2)], [numTxt(c), numTxt(d)]], {
      size: 24,
      fondo: function (p, q) { return p === q ? '#eef8ef' : '#fdecea'; },
      color: function (p, q) { return p === q ? COL.verde : COL.rojo; }
    });

    b += S.txt(x1 + cw, y0 - 16, 'matriz de la receta', { size: 18, weight: '700', fill: COL.gris });
    b += malla(x1, y0, cw, ch, [[numTxt(d), numTxt(b2.opuesto())], [numTxt(c.opuesto()), numTxt(a)]], {
      size: 24,
      fondo: function (p, q) { return p === q ? '#eef8ef' : '#fdecea'; },
      color: function (p, q) { return p === q ? COL.verde : COL.rojo; }
    });

    /* flechas: intercambio de la diagonal principal */
    var yA = y0 + ch / 2, yB = y0 + ch + ch / 2;
    b += S.path('M ' + (x0 + cw / 2) + ' ' + (yA - 34) + ' C ' + (x0 + 200) + ' ' + (yA - 96) +
      ', ' + (x1 + 160) + ' ' + (yB - 96) + ', ' + (x1 + cw + cw / 2) + ' ' + (yB - 34),
      COL.verde, 3);
    b += S.poly([[x1 + cw + cw / 2, yB - 30], [x1 + cw + cw / 2 - 9, yB - 48],
      [x1 + cw + cw / 2 + 9, yB - 48]], COL.verde, COL.verde);
    b += S.txt((x0 + x1) / 2 + 40, yA - 82, 'a\u2081\u2081 y a\u2082\u2082 se intercambian',
      { size: 19, weight: '700', fill: COL.verde });

    b += S.path('M ' + (x0 + cw + cw / 2) + ' ' + (yB + 34) + ' C ' + (x0 + 300) + ' ' + (yB + 96) +
      ', ' + (x1 + 60) + ' ' + (yA + 96) + ', ' + (x1 + cw / 2) + ' ' + (yA + 34),
      COL.verde, 3);
    b += S.poly([[x1 + cw / 2, yA + 30], [x1 + cw / 2 - 9, yA + 48], [x1 + cw / 2 + 9, yA + 48]],
      COL.verde, COL.verde);

    /* flechas: cambio de signo en la diagonal secundaria */
    var ys = y0 + 2 * ch + 150;
    b += S.txt(x0, ys, 'a\u2081\u2082 = ' + numTxt(b2) + '   cambia de signo   \u2192   ' + numTxt(b2.opuesto()),
      { size: 20, weight: '700', fill: COL.rojo, anchor: 'start' });
    b += S.txt(x0, ys + 34, 'a\u2082\u2081 = ' + numTxt(c) + '   cambia de signo   \u2192   ' + numTxt(c.opuesto()),
      { size: 20, weight: '700', fill: COL.rojo, anchor: 'start' });
    b += S.txt(x0, ys + 74, 'y al final se divide todo entre el determinante: |A| = ' + numTxt(D),
      { size: 21, weight: '700', fill: COL.azulOsc, anchor: 'start' });
    return fig(b, 'Receta visual de la inversa de orden 2',
      'En símbolos: ' + K('A^{-1} = \\dfrac{1}{ad-bc}\\left(\\begin{array}{cc} d & -b \\\\ -c & a \\end{array}\\right)') +
      ', válida <b>solo</b> en el orden 2.');
  }

  /* ------------------------------------------------------------------
     Figura: veredicto regular / singular.
     ------------------------------------------------------------------ */
  function figVeredicto(info) {
    var b = '';
    var regular = !!info.regular;
    b += S.txt(W / 2, 44, 'Criterio de existencia de la inversa',
      { size: 25, weight: '700', fill: COL.azulOsc });
    var cajas = [
      {
        x: 60, tit: 'MATRIZ REGULAR', activa: regular, col: COL.verde,
        l1: '|A| \u2260 0', l2: 'rango = orden', l3: 'filas independientes', l4: 'S\u00CD tiene inversa'
      },
      {
        x: 470, tit: 'MATRIZ SINGULAR', activa: !regular, col: COL.rojo,
        l1: '|A| = 0', l2: 'rango menor que el orden', l3: 'alguna fila depende de las otras',
        l4: 'NO tiene inversa'
      }
    ];
    cajas.forEach(function (c) {
      b += S.rect(c.x, 76, 370, 226, c.activa ? (c.col === COL.verde ? '#eef8ef' : '#fdecea') : '#f7f9fb',
        c.activa ? c.col : '#cfd8dc', { r: 12, sw: c.activa ? 4 : 2 });
      b += S.txt(c.x + 185, 112, c.tit, { size: 21, weight: '700', fill: c.activa ? c.col : COL.gris });
      b += txtNe(c.x + 185, 152, c.l1, { size: 20, weight: '700', fill: COL.texto });
      b += S.txt(c.x + 185, 190, c.l2, { size: 18, weight: '600', fill: COL.texto });
      b += S.txt(c.x + 185, 226, c.l3, { size: 18, weight: '600', fill: COL.texto });
      b += S.txt(c.x + 185, 272, c.l4, { size: 21, weight: '700', fill: c.activa ? c.col : COL.gris });
    });
    b += S.txt(W / 2, 344, info.ordenTxt || ('tu matriz es cuadrada de orden ' + info.orden),
      { size: 20, weight: '700', fill: COL.azulOsc });
    b += S.txt(W / 2, 382, '|A| = ' + info.detTxt + '   y   rg(A) = ' + info.rango,
      { size: 22, weight: '700', fill: regular ? COL.verde : COL.rojo });
    b += S.txt(W / 2, 418, regular ? 'conclusi\u00F3n: es regular y tiene inversa'
      : 'conclusi\u00F3n: es singular y no tiene inversa',
      { size: 20, weight: '700', fill: regular ? COL.verde : COL.rojo });
    return fig(b, 'Veredicto: matriz regular o singular',
      'El criterio es uno solo: ' +
      K('|A| \\ne 0 \\iff \\operatorname{rg}(A) = n \\iff \\text{existe } A^{-1}') + '.');
  }

  /* ------------------------------------------------------------------
     Figura: marcador de aciertos, fallos y racha.
     ------------------------------------------------------------------ */
  /* Marcador de aciertos y fallos. Cada barra se dibuja DENTRO de un
     carril (el «total») que ocupa todo el alto y todo el ancho útil de
     la figura: así, con el marcador a 0, la mitad superior no es un
     hueco en blanco sino el carril vacío, y no quedan márgenes
     laterales muertos (auditoría: entrenador D2).                   */
  function figMarcador(aciertos, fallos, racha, titulo2) {
    var b = '';
    var total = Math.max(1, aciertos + fallos);
    var wCar = 300, hueco = 60, alto = 140;
    var x0 = Math.round((W - (2 * wCar + hueco)) / 2);
    var yTop = 96, base = yTop + alto;
    b += S.txt(W / 2, 44, titulo2 || 'Marcador', { size: 24, weight: '700', fill: COL.azulOsc });
    b += S.txt(W / 2, 74, 'cada carril es el total de respuestas; la parte de color, su reparto',
      { size: 17, weight: '600', fill: COL.gris });
    var barras = [
      { x: x0, v: aciertos, col: COL.verde, fondo: '#e8f5e9', et: 'aciertos' },
      { x: x0 + wCar + hueco, v: fallos, col: COL.rojo, fondo: '#fdecea', et: 'fallos' }
    ];
    barras.forEach(function (br) {
      var h = Math.max(6, Math.round(alto * br.v / total));
      /* carril: el 100 % del total, siempre visible */
      b += S.rect(br.x, yTop, wCar, alto, '#f7f9fb', '#cfd8dc', { r: 10, sw: 2 });
      b += S.rect(br.x, base - h, wCar, h, br.fondo, br.col, { r: 10, sw: 3 });
      /* el recuento va en un sitio FIJO, arriba del carril: si fuera
         pegado a la barra, con la barra al 100 % se subiría encima del
         subtítulo de la figura. */
      b += S.txt(br.x + wCar / 2, yTop + 34, String(br.v), { size: 26, weight: '700', fill: br.col });
      b += S.txt(br.x + wCar / 2, base + 34, br.et, { size: 20, weight: '700', fill: COL.texto });
      b += S.txt(br.x + wCar / 2, base + 60,
        Math.round(100 * br.v / total) + ' % del total', { size: 17, weight: '600', fill: COL.gris });
    });
    b += S.line(x0, base, x0 + 2 * wCar + hueco, base, COL.eje, 2.4);
    b += S.txt(W / 2, base + 98, 'contestadas: ' + (aciertos + fallos) +
      '   \u00B7   aciertos: ' + Math.round(100 * aciertos / total) + ' %' +
      (racha === undefined ? '' : '   \u00B7   racha actual: ' + racha),
      { size: 20, weight: '700', fill: COL.gris });
    return fig(b, 'Marcador de aciertos y fallos',
      'El marcador guarda una sola respuesta por cuesti\u00F3n: si la corriges, se queda la \u00FAltima.');
  }

  /* ------------------------------------------------------------------
     Figura: puntuación de la autoevaluación (barra por apartados).
     ------------------------------------------------------------------ */
  function figPuntuacion(res) {
    var b = '', i;
    var n = res.length, cw = Math.floor((W - 160) / n);
    var x0 = 80, y0 = 110, alto = 120;
    var ac = 0;
    for (i = 0; i < n; i++) if (res[i] === true) ac++;
    b += S.txt(W / 2, 44, 'Puntuaci\u00F3n de la autoevaluaci\u00F3n: ' + ac + ' de ' + n,
      { size: 25, weight: '700', fill: COL.azulOsc });
    b += S.txt(W / 2, 78, 'una casilla por cuesti\u00F3n, en el orden de los apartados del tema',
      { size: 18, weight: '600', fill: COL.gris });
    for (i = 0; i < n; i++) {
      var col = res[i] === true ? COL.verde : (res[i] === false ? COL.rojo : COL.gris);
      var fon = res[i] === true ? '#e8f5e9' : (res[i] === false ? '#fdecea' : '#f2f7fd');
      b += S.rect(x0 + i * cw + 4, y0, cw - 8, alto, fon, col, { r: 8, sw: 3 });
      b += S.txt(x0 + i * cw + cw / 2, y0 + 52, String(i + 1),
        { size: 22, weight: '700', fill: col });
      b += S.txt(x0 + i * cw + cw / 2, y0 + 92,
        res[i] === true ? 'bien' : (res[i] === false ? 'mal' : '\u2013'),
        { size: 17, weight: '700', fill: col });
    }
    var yb = y0 + alto + 46;
    b += S.txt(W / 2, yb, 'nota sobre 10: ' + S.etq(Math.round(1000 * ac / n) / 100, 2),
      { size: 22, weight: '700', fill: ac * 2 >= n ? COL.verde : COL.rojo });
    b += S.txt(W / 2, yb + 34, 'las casillas grises son cuestiones sin contestar',
      { size: 17, weight: '600', fill: COL.gris });
    return fig(b, 'Puntuaci\u00F3n por cuestiones de la autoevaluaci\u00F3n',
      'Cada cuesti\u00F3n corresponde a un apartado del tema: los fallos te dicen qu\u00E9 repasar.');
  }

  /* ==================================================================
     2 · Tema 2.14 · construcción de la matriz de los adjuntos
     ================================================================== */
  R.matAdjuntos = function (node) {
    return S.shell(node, 'Construcci\u00F3n de la matriz de los adjuntos',
      'Escribe una matriz <b>cuadrada</b> de orden 2, 3 o 4 por filas: <code>1 2 3; 0 1 4; 5 6 0</code> ' +
      '(o una fila por línea). Valen enteros (<code>-2</code>), decimales con coma (<code>0,5</code>) y ' +
      'fracciones (<code>1/2</code>). El applet va rellenando la rejilla de los ' + K('n^2') +
      ' adjuntos <b>de una en una</b>: usa <b>Rellenar una casilla más</b> o <b>Rellenar todas</b>. ' +
      'Elige una fila y una columna (contando desde <b>1</b>) para ver de dónde sale ese adjunto: ' +
      'qué menor complementario queda al tachar su fila y su columna y qué signo se le aplica. ' +
      'Cuando la rejilla está completa aparecen ' + K('\\operatorname{Adj}(A)') + ' y su transpuesta ' +
      'lado a lado.',
      [
        {
          id: 'A', label: 'Matriz A (una fila por línea)', type: 'textarea', rows: 4,
          value: '1 2 3\n0 1 4\n5 6 0', ancho: '17rem'
        },
        { id: 'llenas', label: 'Casillas rellenas', type: 'number', min: 0, max: 16, value: 0, ancho: '9rem' },
        { id: 'fi', label: 'Fila de la casilla (desde 1)', type: 'number', min: 1, max: 4, value: 1, ancho: '11rem' },
        { id: 'cj', label: 'Columna de la casilla (desde 1)', type: 'number', min: 1, max: 4, value: 1, ancho: '11rem' },
        {
          id: 'unaMas', label: 'Rellenar una casilla más', type: 'button',
          click: function (c) {
            var nn = 4;
            try { nn = alg().parseMat(String(c.A.value)).f; } catch (e) { nn = 4; }
            c.llenas.value = String(Math.min(nn * nn, ent(c.llenas.value, 0, 16, 0) + 1));
          }
        },
        {
          id: 'todas', label: 'Rellenar todas', type: 'button',
          click: function (c) {
            var nn = 4;
            try { nn = alg().parseMat(String(c.A.value)).f; } catch (e) { nn = 4; }
            c.llenas.value = String(nn * nn);
          }
        },
        {
          id: 'cero', label: 'Empezar de nuevo', type: 'button',
          click: function (c) { c.llenas.value = '0'; }
        },
        chips([
          {
            txt: 'Orden 3 clásica', tip: 'la matriz de los ejemplos del apartado',
            set: { A: '1 2 3\n0 1 4\n5 6 0', llenas: 0, fi: 1, cj: 1 }
          },
          {
            txt: 'Orden 2 · cuatro adjuntos', tip: 'los adjuntos son números sueltos',
            set: { A: '2 1\n1 1', llenas: 4, fi: 1, cj: 2 }
          },
          {
            txt: 'Orden 3 completa', tip: 'las nueve casillas rellenas',
            set: { A: '2 0 1\n1 3 2\n1 1 1', llenas: 9, fi: 2, cj: 3 }
          },
          {
            txt: 'Orden 4 · rejilla de 16', tip: 'cada adjunto es un determinante de orden 3',
            set: { A: '1 0 2 1\n0 1 1 0\n2 1 0 1\n1 1 1 2', llenas: 16, fi: 3, cj: 2 }
          },
          {
            txt: 'Con ceros', tip: 'los ceros hacen que muchos adjuntos sean fáciles',
            set: { A: '3 0 0\n0 2 0\n0 0 5', llenas: 9, fi: 1, cj: 1 }
          },
          {
            txt: 'Singular · det = 0', tip: 'la matriz de los adjuntos existe igual',
            set: { A: '1 2 3\n2 4 6\n1 0 1', llenas: 9, fi: 1, cj: 1 }
          },
          {
            txt: 'Con fracciones', tip: 'aritmética exacta, sin decimales aproximados',
            set: { A: '1/2 1\n3 -2', llenas: 4, fi: 2, cj: 1 }
          },
          {
            txt: 'Con negativos', tip: 'ojo al signo del tablero',
            set: { A: '-1 2 0\n3 -4 1\n2 1 -2', llenas: 9, fi: 2, cj: 2 }
          },
          {
            txt: 'Triangular de orden 3', tip: 'muchos adjuntos salen cero',
            set: { A: '2 5 1\n0 3 4\n0 0 1', llenas: 9, fi: 3, cj: 1 }
          }
        ])
      ],
      safe(function (v) {
        var A = leeCuadrada(v.A, 'la matriz A', 4);
        var n = A.f;
        var llenas = ent(v.llenas, 0, n * n, 0);
        var i = ent(v.fi, 1, n, 1) - 1;
        var j = ent(v.cj, 1, n, 1) - 1;
        var adj = alg().matAdjuntos(A);
        var adjT = alg().matTrans(adj);
        var D = alg().det(A);

        var h = caja('Matriz A, cuadrada de orden ' + n, alg().matTex(A));
        h += parrafo('La <b>matriz de los adjuntos</b> ' + K('\\operatorname{Adj}(A)') +
          ' tiene en el lugar (fila ' + K('i') + ', columna ' + K('j') + ') el adjunto ' +
          K('A_{ij}') + ' del elemento que ocupa ese mismo lugar. Como esta matriz es de orden ' +
          n + ', hay que calcular ' + K(n + '^2 = ' + (n * n)) + ' adjuntos, y cada uno es un ' +
          'determinante de orden ' + (n - 1) + ' con su signo.');

        h += figRejilla(A, adj, llenas, [i, j]);

        if (llenas === 0) {
          h += aviso('Todav\u00EDa no hay ninguna casilla rellena. Pulsa <b>Rellenar una casilla ' +
            'm\u00E1s</b> para ir viendo los adjuntos uno a uno, en el orden ' +
            K(texAdj(0, 0) + ',\\; ' + texAdj(0, 1) + ',\\; \\ldots') + ', o <b>Rellenar todas</b> ' +
            'si quieres verlas de golpe.');
        }

        /* Tabla de las casillas ya rellenadas, con su menor y su signo. */
        if (llenas > 0) {
          h += titulo('Las casillas rellenas, una a una');
          var filas = [], p, q, k;
          for (k = 0; k < llenas; k++) {
            p = Math.floor(k / n); q = k % n;
            var men = alg().menorComp(A, p, q);
            var sg = alg().signoAdj(p, q);
            filas.push([
              K(texAdj(p, q)),
              'fila ' + (p + 1) + ', columna ' + (q + 1),
              K(texMen(p, q) + ' = ' + FT(men)),
              K('(-1)^{' + (p + 1) + '+' + (q + 1) + '} = ' + (sg > 0 ? '+1' : '-1')),
              K(texAdj(p, q) + ' = ' + FT(alg().adjunto(A, p, q)))
            ]);
          }
          h += S.tabla(['Adjunto', 'Lugar (base 1)', 'Menor complementario', 'Signo del tablero', 'Valor'], filas);
        }

        h += titulo('De d\u00F3nde sale la casilla elegida');
        h += parrafo('Has elegido la casilla de la <b>fila ' + (i + 1) + '</b> y la <b>columna ' +
          (j + 1) + '</b>, es decir el adjunto del elemento ' + K(texA(i, j) + ' = ' + FT(A.a[i][j])) +
          '. Se tacha su fila y su columna, se calcula el determinante de lo que queda (el menor ' +
          'complementario ' + K(texMen(i, j)) + ') y se le aplica el signo del tablero.');
        h += figMenor(A, i, j);
        h += caja('Menor complementario del lugar (' + (i + 1) + ', ' + (j + 1) + ')',
          texMen(i, j) + ' = ' + (n > 2 ? alg().detTex(alg().subMat(A, i, j)) : FT(alg().menorComp(A, i, j))) +
          (n > 2 ? ' = ' + FT(alg().menorComp(A, i, j)) : ''));
        h += caja('Adjunto',
          texAdj(i, j) + ' = (-1)^{' + (i + 1) + '+' + (j + 1) + '}\\cdot' + texMen(i, j) + ' = ' +
          (alg().signoAdj(i, j) > 0 ? '' : '-') + '\\left(' + FT(alg().menorComp(A, i, j)) + '\\right) = ' +
          FT(alg().adjunto(A, i, j)));
        h += parrafo('<b>Error t\u00EDpico.</b> El signo se aplica al <b>menor</b>, no al elemento ' +
          K(texA(i, j)) + ': el adjunto no se calcula a partir del propio elemento, sino de todo lo ' +
          'que queda al tacharlo.');

        if (llenas >= n * n) {
          h += titulo('La matriz de los adjuntos y su transpuesta, lado a lado');
          h += caja('Rejilla completa',
            '\\operatorname{Adj}(A) = ' + alg().matTex(adj) + ' \\qquad ' +
            '\\operatorname{Adj}(A)^{t} = ' + alg().matTex(adjT));
          h += parrafo('La transpuesta se obtiene cambiando filas por columnas: ' +
            'el adjunto ' + K(texAdj(0, 1)) + ' de ' + K('\\operatorname{Adj}(A)') + ' pasa al lugar ' +
            '(2, 1) de ' + K('\\operatorname{Adj}(A)^{t}') + '. Esa transpuesta es la que aparece en la ' +
            'f\u00F3rmula de la inversa, ' + K('A^{-1} = \\dfrac{1}{|A|}\\operatorname{Adj}(A)^{t}') + '.');
          h += aviso('<b>Dos convenios en circulaci\u00F3n.</b> Algunos libros llaman ' +
            K('\\operatorname{Adj}(A)') + ' directamente a la <b>transpuesta</b> de la matriz de los ' +
            'adjuntos, y entonces escriben ' + K('A^{-1} = \\dfrac{1}{|A|}\\operatorname{Adj}(A)') +
            ' sin la t. Aqu\u00ED se usa el convenio del enunciado: ' + K('\\operatorname{Adj}(A)') +
            ' es la matriz que en el lugar (i, j) lleva ' + K('A_{ij}') + ', y en la f\u00F3rmula de la ' +
            'inversa aparece transpuesta. Mira siempre qu\u00E9 convenio usa el enunciado.');
        } else {
          h += aviso('Faltan <b>' + (n * n - llenas) + '</b> casillas por rellenar. Cuando la rejilla ' +
            'est\u00E9 completa aparecer\u00E1n ' + K('\\operatorname{Adj}(A)') + ' y su transpuesta.');
        }

        h += S.kvs([
          'orden = <b>' + n + '</b>',
          'adjuntos que hay que calcular = <b>' + (n * n) + '</b>',
          'casillas rellenas = <b>' + llenas + '</b>',
          '|A| = <b>' + numTxt(D) + '</b>',
          nomAdj(i, j) + ' = <b>' + numTxt(alg().adjunto(A, i, j)) + '</b>'
        ]);
        h += parrafo('<b>Para el examen.</b> Escribe siempre los adjuntos en su sitio y con el signo ' +
          'ya aplicado; si te dejas los signos para el final, es casi seguro que se te pierde alguno. ' +
          'Y recuerda que el determinante sale gratis: ' +
          K('|A| = ' + texA(0, 0) + texAdj(0, 0) + ' + ' + texA(0, 1) + texAdj(0, 1) + ' + \\ldots') +
          ' es el desarrollo por la primera fila, que con esta rejilla ya est\u00E1 calculado.');
        return h;
      }, EJEMPLO));
  };

  /* ==================================================================
     3 · Tema 2.14 · la identidad A·Adj(A)ᵗ = |A|·I
     ================================================================== */
  R.identidadAdj = function (node) {
    return S.shell(node, 'La identidad A\u00B7Adj(A)\u1D57 = |A|\u00B7I',
      'Escribe una matriz <b>cuadrada</b> de orden 2, 3 o 4 por filas: <code>1 2 3; 0 1 4; 5 6 0</code> ' +
      '(o una fila por línea; valen fracciones como <code>1/2</code>). El applet hace <b>de verdad</b> ' +
      'el producto ' + K('A\\cdot\\operatorname{Adj}(A)^{t}') + ' y comprueba que sale la matriz ' +
      'escalar que tiene el determinante en toda la diagonal y ceros fuera. Elige una fila y una ' +
      'columna del <b>resultado</b> (contando desde <b>1</b>) para ver por qué ese elemento vale ' +
      K('|A|') + ' o vale ' + K('0') + '.',
      [
        {
          id: 'A', label: 'Matriz A (una fila por línea)', type: 'textarea', rows: 4,
          value: '1 2 3\n0 1 4\n5 6 0', ancho: '17rem'
        },
        { id: 'fi', label: 'Fila del resultado (desde 1)', type: 'number', min: 1, max: 4, value: 1, ancho: '11rem' },
        { id: 'cj', label: 'Columna del resultado (desde 1)', type: 'number', min: 1, max: 4, value: 2, ancho: '11rem' },
        { id: 'ver', label: 'Ver el desarrollo del elemento elegido', type: 'check', value: true, ancho: '15rem' },
        chips([
          {
            txt: 'Orden 3 · elemento de fuera', tip: 'un cero: fila por adjuntos de otra fila',
            set: { A: '1 2 3\n0 1 4\n5 6 0', fi: 1, cj: 2, ver: true }
          },
          {
            txt: 'Orden 3 · elemento de la diagonal', tip: 'sale el determinante',
            set: { A: '1 2 3\n0 1 4\n5 6 0', fi: 2, cj: 2, ver: true }
          },
          {
            txt: 'Orden 2', tip: 'la identidad se ve de un golpe de vista',
            set: { A: '4 6\n1 2', fi: 1, cj: 1, ver: true }
          },
          {
            txt: 'Orden 4', tip: 'con 16 adjuntos la identidad sigue cumpliéndose',
            set: { A: '1 0 2 1\n0 1 1 0\n2 1 0 1\n1 1 1 2', fi: 3, cj: 1, ver: true }
          },
          {
            txt: 'Singular · det = 0', tip: 'el producto sale la matriz nula',
            set: { A: '1 2 3\n2 4 6\n1 0 1', fi: 1, cj: 1, ver: true }
          },
          {
            txt: 'Identidad de orden 3', tip: 'es su propia matriz de adjuntos',
            set: { A: '1 0 0\n0 1 0\n0 0 1', fi: 1, cj: 1, ver: true }
          },
          {
            txt: 'Con fracciones', tip: 'la identidad no depende del tipo de números',
            set: { A: '1/2 1\n3 -2', fi: 2, cj: 1, ver: true }
          },
          {
            txt: 'Sin desarrollo', tip: 'solo el producto y la conclusión',
            set: { A: '2 0 1\n1 3 2\n1 1 1', fi: 1, cj: 1, ver: false }
          }
        ])
      ],
      safe(function (v) {
        var A = leeCuadrada(v.A, 'la matriz A', 4);
        var n = A.f;
        var i = ent(v.fi, 1, n, 1) - 1;
        var j = ent(v.cj, 1, n, 1) - 1;
        var adj = alg().matAdjuntos(A);
        var adjT = alg().matTrans(adj);
        var P = alg().matProd(A, adjT);
        var D = alg().det(A);
        var escalar = alg().matEscalar(alg().matIdentidad(n), D);
        var coincide = alg().matIgual(P, escalar);

        var h = caja('Matriz A y su matriz de adjuntos',
          'A = ' + alg().matTex(A) + ' \\qquad \\operatorname{Adj}(A) = ' + alg().matTex(adj));
        h += caja('La transpuesta de la matriz de los adjuntos',
          '\\operatorname{Adj}(A)^{t} = ' + alg().matTex(adjT));

        h += titulo('El producto, hecho de verdad');
        h += caja('Producto A\u00B7Adj(A)\u1D57',
          'A\\cdot\\operatorname{Adj}(A)^{t} = ' + alg().matTex(A) + alg().matTex(adjT) + ' = ' +
          alg().matTex(P));
        h += caja('Y la matriz escalar |A|\u00B7I',
          '|A|\\cdot I = ' + FT(D) + '\\cdot' + alg().matTex(alg().matIdentidad(n)) + ' = ' +
          alg().matTex(escalar));
        if (coincide) {
          h += bien('<b>Las dos matrices coinciden elemento a elemento:</b> ' +
            K('A\\cdot\\operatorname{Adj}(A)^{t} = |A|\\cdot I') + ', con ' + K('|A| = ' + FT(D)) + '.');
        } else {
          h += mal('Algo no cuadra en la comprobaci\u00F3n. Revisa la matriz que has escrito.');
        }
        h += figIdentidad(A, P, D, [i, j]);

        h += titulo('Por qu\u00E9 sale eso: lectura elemento a elemento');
        h += parrafo('El elemento de la fila ' + K('i') + ' y la columna ' + K('j') +
          ' del producto es la fila ' + K('i') + ' de ' + K('A') + ' multiplicada por la columna ' +
          K('j') + ' de ' + K('\\operatorname{Adj}(A)^{t}') + '. Pero la columna ' + K('j') + ' de ' +
          'la transpuesta es la <b>fila</b> ' + K('j') + ' de ' + K('\\operatorname{Adj}(A)') + ', es ' +
          'decir los adjuntos de la fila ' + K('j') + ' de ' + K('A') + '. As\u00ED que ese elemento es ' +
          '<b>la fila i de A multiplicada por los adjuntos de la fila j</b>:');
        h += op('\\left(A\\cdot\\operatorname{Adj}(A)^{t}\\right)_{ij} = ' +
          'a_{i1}A_{j1} + a_{i2}A_{j2} + \\cdots + a_{in}A_{jn}');
        h += S.tabla(['Caso', 'Qu\u00E9 se est\u00E1 sumando', 'Cu\u00E1nto vale', 'Apartado'], [
          [K('i = j') + ' (diagonal)', 'los elementos de una fila por <b>sus propios</b> adjuntos: ' +
            'es el desarrollo del determinante por esa fila', K('|A| = ' + FT(D)),
            'desarrollo por los adjuntos (2.7)'],
          [K('i \\ne j') + ' (fuera)', 'los elementos de una fila por los adjuntos de <b>otra</b> fila',
            K('0'), 'la fila ajena (2.7, applet <b>filaAjena</b>)']
        ]);
        h += parrafo('El caso de fuera de la diagonal es exactamente lo que se ve en el applet ' +
          '<b>filaAjena</b> del apartado 2.7: multiplicar los elementos de una l\u00EDnea por los ' +
          'adjuntos de <b>otra</b> l\u00EDnea siempre da cero, porque equivale a desarrollar el ' +
          'determinante de una matriz que tiene <b>dos filas iguales</b>.');

        if (v.ver) {
          var esDiag = (i === j);
          h += titulo('El elemento elegido: fila ' + (i + 1) + ', columna ' + (j + 1) +
            (esDiag ? ' (est\u00E1 en la diagonal)' : ' (est\u00E1 fuera de la diagonal)'));
          var sumTex = [], sumTxt = [], q, tot = F0();
          for (q = 0; q < n; q++) {
            var a1 = A.a[i][q], aj = adj.a[j][q];
            sumTex.push(FT(a1) + '\\cdot' + S.parNegTex(FT(aj)));
            sumTxt.push(numTxt(a1) + ' \u00B7 ' + parTxt(aj));
            tot = tot.mas(a1.por(aj));
          }
          h += caja('Desarrollo del elemento (' + (i + 1) + ', ' + (j + 1) + ')',
            '\\left(A\\cdot\\operatorname{Adj}(A)^{t}\\right)_{' + (i + 1) + (j + 1) + '} = ' +
            S.sumandosTex(sumTex) + ' = ' + FT(tot));
          h += parrafo('En texto llano: ' + S.sumandosTxt(sumTxt) + ' = <b>' + numTxt(tot) + '</b>. ' +
            'Fíjate en que los sumandos negativos van entre par\u00E9ntesis: nunca se escribe ' +
            '«+ \u22123», sino «+ (\u22123)».');
          if (esDiag) {
            h += bien('Al estar en la diagonal, se han usado los adjuntos de la <b>propia</b> fila ' +
              (i + 1) + ': es el <b>desarrollo del determinante por la fila ' + (i + 1) + '</b>, y por ' +
              'eso sale ' + K('|A| = ' + FT(D)) + '.');
            var dev = alg().desarrollo(A, 'fila', i);
            h += caja('El mismo desarrollo, visto como determinante', dev.tex);
          } else {
            h += bien('Al estar fuera de la diagonal, se han usado los adjuntos de la fila ' + (j + 1) +
              ' (una fila <b>ajena</b>) con los elementos de la fila ' + (i + 1) + ': el resultado es ' +
              K('0') + '. Es el desarrollo del determinante de la matriz que se obtiene poniendo la ' +
              'fila ' + (i + 1) + ' de ' + K('A') + ' tambi\u00E9n en el lugar de la fila ' + (j + 1) +
              ', que tendr\u00EDa <b>dos filas iguales</b> y por tanto determinante nulo.');
          }
        } else {
          h += aviso('Marca la casilla <b>Ver el desarrollo del elemento elegido</b> para ver la suma ' +
            'completa que produce ese elemento del producto.');
        }

        h += titulo('Y de aqu\u00ED sale la f\u00F3rmula de la inversa');
        h += S.paso(1, 'Acabamos de comprobar que ' +
          KD('A\\cdot\\operatorname{Adj}(A)^{t} = |A|\\cdot I'));
        if (!cero(D)) {
          h += S.paso(2, 'Como ' + K('|A| = ' + FT(D) + ' \\ne 0') + ', podemos dividir los dos ' +
            'miembros entre ese n\u00FAmero:' +
            KD('A\\cdot\\left(\\dfrac{1}{|A|}\\operatorname{Adj}(A)^{t}\\right) = I'));
          h += S.paso(3, 'Y esa es justamente la definici\u00F3n de inversa: la matriz que multiplicada ' +
            'por ' + K('A') + ' da la identidad.' +
            KD('A^{-1} = \\dfrac{1}{|A|}\\operatorname{Adj}(A)^{t} = ' + alg().matTex(alg().matEscalar(adjT, F1().entre(D)))),
            'ap-paso-clave');
          h += caja('Comprobaci\u00F3n del producto',
            'A\\cdot A^{-1} = ' + alg().matTex(alg().matProd(A, alg().matEscalar(adjT, F1().entre(D)))) +
            ' = I \\quad \\checkmark');
        } else {
          h += S.paso(2, 'Pero aqu\u00ED ' + K('|A| = 0') + ', as\u00ED que el producto sale la ' +
            '<b>matriz nula</b> y no se puede dividir entre ' + K('|A|') + ': la matriz es ' +
            '<b>singular</b> y no tiene inversa.', 'ap-paso-clave');
          h += mal('Con ' + K('|A| = 0') + ' la identidad sigue siendo cierta (' +
            K('A\\cdot\\operatorname{Adj}(A)^{t} = 0\\cdot I = 0') + '), pero ya no sirve para ' +
            'despejar la inversa: dividir entre cero est\u00E1 prohibido.');
        }

        h += S.kvs([
          'orden = <b>' + n + '</b>',
          '|A| = <b>' + numTxt(D) + '</b>',
          'producto = <b>' + (coincide ? 'matriz escalar' : 'revisar') + '</b>',
          'elemento (' + (i + 1) + ', ' + (j + 1) + ') = <b>' + numTxt(P.a[i][j]) + '</b>',
          'tipo = <b>' + (cero(D) ? 'singular' : 'regular') + '</b>'
        ]);
        return h;
      }, EJEMPLO));
  };

  /* ==================================================================
     4 · Tema 2.15 · la inversa por determinantes, paso a paso
     ================================================================== */
  var PASOS_INV = [
    'Paso 1 · el determinante',
    'Paso 2 · \u00BFes distinto de cero?',
    'Paso 3 · la matriz de los adjuntos',
    'Paso 4 · la transpuesta de la matriz de los adjuntos',
    'Paso 5 · dividir entre el determinante',
    'Paso 6 · comprobaci\u00F3n A\u00B7A\u207B\u00B9 = I'
  ];

  R.inversaDet = function (node) {
    return S.shell(node, 'Inversa por determinantes, paso a paso',
      'La f\u00F3rmula es ' + K('A^{-1} = \\dfrac{1}{|A|}\\operatorname{Adj}(A)^{t}') + ' y se recorre ' +
      'siempre en el mismo orden: determinante, comprobar que no es cero, matriz de los adjuntos, ' +
      'transponer, dividir. Escribe la matriz por filas: <code>1 2 3; 0 1 4; 5 6 0</code> (o una fila ' +
      'por línea; valen fracciones como <code>1/2</code> y decimales con coma como <code>0,5</code>). ' +
      'Usa <b>Siguiente paso</b> para avanzar de uno en uno, o <b>Ver todos los pasos</b> para verlos ' +
      'de golpe. Al final, la comprobación ' + K('A\\cdot A^{-1} = I') + ' se hace de verdad, ' +
      'multiplicando las dos matrices.',
      [
        {
          id: 'A', label: 'Matriz A (una fila por línea)', type: 'textarea', rows: 4,
          value: '1 2 3\n0 1 4\n5 6 0', ancho: '17rem'
        },
        { id: 'paso', label: 'Pasos vistos', type: 'number', min: 1, max: 6, value: 1, ancho: '9rem' },
        {
          id: 'sig', label: 'Siguiente paso', type: 'button',
          click: function (c) { c.paso.value = String(Math.min(6, ent(c.paso.value, 1, 6, 1) + 1)); }
        },
        {
          id: 'ant', label: 'Paso anterior', type: 'button',
          click: function (c) { c.paso.value = String(Math.max(1, ent(c.paso.value, 1, 6, 1) - 1)); }
        },
        {
          id: 'todo', label: 'Ver todos los pasos', type: 'button',
          click: function (c) { c.paso.value = '6'; }
        },
        {
          id: 'reinicia', label: 'Volver al primer paso', type: 'button',
          click: function (c) { c.paso.value = '1'; }
        },
        chips([
          {
            txt: 'Orden 3 · inversa entera', tip: 'determinante 1: no aparecen fracciones',
            set: { A: '1 0 0\n2 1 0\n3 4 1', paso: 6 }
          },
          {
            txt: 'Orden 3 clásica', tip: 'la inversa lleva fracciones',
            set: { A: '1 2 3\n0 1 4\n5 6 0', paso: 6 }
          },
          {
            txt: 'Orden 2', tip: 'el caso más corto',
            set: { A: '4 6\n1 2', paso: 6 }
          },
          {
            txt: 'Orden 4', tip: 'dieciséis adjuntos de orden 3',
            set: { A: '1 0 2 1\n0 1 1 0\n2 1 0 1\n1 1 1 2', paso: 6 }
          },
          {
            txt: 'Paso a paso desde el principio', tip: 'solo el determinante',
            set: { A: '2 0 1\n1 3 2\n1 1 1', paso: 1 }
          },
          {
            txt: 'Singular · no hay inversa', tip: 'el proceso se detiene en el paso 2',
            set: { A: '1 2 3\n2 4 6\n1 0 1', paso: 6 }
          },
          {
            txt: 'Con fracciones de partida', tip: 'aritmética exacta',
            set: { A: '1/2 1\n3 -2', paso: 6 }
          },
          {
            txt: 'Con decimales de coma', tip: '0,5 se lee como 1/2',
            set: { A: '0,5 1\n2 3', paso: 6 }
          },
          {
            txt: 'No cuadrada (aviso)', tip: 'sin inversa por dimensión',
            set: { A: '1 2 3\n4 5 6', paso: 6 }
          }
        ])
      ],
      safe(function (v) {
        var A = leeM(v.A, 'la matriz A', 4, 4);
        var paso = ent(v.paso, 1, 6, 1);
        var res = alg().inversaDet(A);
        var h = caja('Matriz A, de dimensi\u00F3n ' + alg().dimTxt(A), alg().matTex(A));

        if (A.f !== A.c) {
          h += mal('<b>Esta matriz no puede tener inversa: no es cuadrada.</b> ' + S.esc(res.motivo));
          h += parrafo('La inversa debe cumplir ' + K('A\\cdot A^{-1} = A^{-1}\\cdot A = I') +
            ', y para que los dos productos existan y den la misma identidad hacen falta tantas ' +
            'filas como columnas. Adem\u00E1s, sin ser cuadrada no tiene ni determinante ni adjuntos.');
          h += pista('Quita una columna o a\u00F1ade una fila, por ejemplo <code>1 2; 3 4</code>.');
          return h;
        }

        var n = A.f, D = res.det;
        h += parrafo('El camino es siempre el mismo: <b>' + PASOS_INV.join('</b> \u2192 <b>') +
          '</b>. Ahora est\u00E1s viendo ' + (paso >= 6 ? 'todos los pasos' : 'los ' + paso +
          ' primeros pasos') + ' de ' + (cero(D) ? '2 (el proceso se detiene antes)' : '6') + '.');

        /* Paso 1 · determinante */
        h += titulo(PASOS_INV[0]);
        var DP = alg().detPasos(A);
        h += S.paso(1, 'Todo empieza por el determinante, porque es lo que decide si hay inversa.' +
          KD(DP.tex) + '<p class="detf-txt detd-txt">' + K('|A| = ' + FT(D)) + '</p>');
        h += S.resultado(K('|A| = ' + FT(D)), 'determinante de la matriz');

        if (paso < 2) {
          h += aviso('Pulsa <b>Siguiente paso</b> para comprobar si ese determinante es distinto de cero.');
          return h;
        }

        /* Paso 2 · ¿es distinto de cero? */
        h += titulo(PASOS_INV[1]);
        if (cero(D)) {
          h += mal('<b>' + K('|A| = 0') + ': la matriz es singular y no tiene inversa.</b> ' +
            'El proceso se detiene aqu\u00ED, porque el \u00FAltimo paso pedir\u00EDa dividir entre ' +
            K('|A|') + ' y no se puede dividir entre cero.');
          h += parrafo(S.esc(res.motivo));
          h += parrafo('Que la matriz sea singular no es un fallo de la cuenta: significa que sus ' +
            'filas son linealmente dependientes, ' + K('\\operatorname{rg}(A) = ' + alg().rango(A) +
            ' < ' + n) + ', y una matriz que «pierde informaci\u00F3n» no se puede deshacer ' +
            'multiplicando por otra.');
          h += figVeredicto({
            regular: false, orden: n, rango: alg().rango(A), detTxt: numTxt(D)
          });
          h += S.kvs([
            'orden = <b>' + n + '</b>',
            '|A| = <b>' + numTxt(D) + '</b>',
            'rg(A) = <b>' + alg().rango(A) + '</b>',
            'tipo = <b>singular</b>',
            'inversa = <b>no existe</b>'
          ]);
          return h;
        }
        h += bien('<b>' + K('|A| = ' + FT(D) + ' \\ne 0') + '</b>: la matriz es <b>regular</b> y la ' +
          'inversa existe (y es \u00FAnica). Podemos seguir.');
        if (paso < 3) {
          h += aviso('Pulsa <b>Siguiente paso</b> para construir la matriz de los adjuntos.');
          return h;
        }

        /* Paso 3 · matriz de los adjuntos */
        h += titulo(PASOS_INV[2]);
        h += S.paso(3, S.esc(res.pasos[1].descripcion) + KD(res.pasos[1].tex));
        var filasAdj = [], p, q;
        for (p = 0; p < n; p++) {
          for (q = 0; q < n; q++) {
            filasAdj.push([
              K(texAdj(p, q)),
              'fila ' + (p + 1) + ', columna ' + (q + 1),
              K('(-1)^{' + (p + 1) + '+' + (q + 1) + '}'),
              K(texMen(p, q) + ' = ' + FT(alg().menorComp(A, p, q))),
              K(FT(alg().adjunto(A, p, q)))
            ]);
          }
        }
        h += S.tabla(['Adjunto', 'Lugar (base 1)', 'Signo', 'Menor complementario', 'Valor'], filasAdj);
        if (paso < 4) {
          h += aviso('Pulsa <b>Siguiente paso</b> para transponer la matriz de los adjuntos.');
          return h;
        }

        /* Paso 4 · transpuesta */
        h += titulo(PASOS_INV[3]);
        h += S.paso(4, S.esc(res.pasos[2].descripcion) + KD(res.pasos[2].tex));
        h += caja('Las dos, lado a lado',
          '\\operatorname{Adj}(A) = ' + alg().matTex(res.adj) + ' \\qquad ' +
          '\\operatorname{Adj}(A)^{t} = ' + alg().matTex(res.adjT));
        h += parrafo('<b>Error t\u00EDpico.</b> Olvidar la transposici\u00F3n. En el orden 2 casi no ' +
          'se nota (solo se intercambian dos elementos), pero en el orden 3 da una matriz distinta ' +
          'y la comprobaci\u00F3n final falla.');
        if (paso < 5) {
          h += aviso('Pulsa <b>Siguiente paso</b> para dividir entre el determinante.');
          return h;
        }

        /* Paso 5 · dividir entre el determinante */
        h += titulo(PASOS_INV[4]);
        h += S.paso(5, S.esc(res.pasos[3].descripcion) + KD(res.pasos[3].tex), 'ap-paso-clave');
        h += S.resultado(K('A^{-1} = ' + alg().matTex(res.inv)), 'matriz inversa');
        h += parrafo('Las fracciones se dejan <b>exactas</b>: ' +
          K(alg().matTex(res.inv)) + ' no se convierte en decimales. Un tercio escrito con ' +
          'decimales redondeados dejar\u00EDa de cumplir ' + K('A\\cdot A^{-1} = I') + '.');
        if (paso < 6) {
          h += aviso('Pulsa <b>Siguiente paso</b> para hacer la comprobaci\u00F3n ' +
            K('A\\cdot A^{-1} = I') + '.');
          return h;
        }

        /* Paso 6 · comprobación de verdad */
        h += titulo(PASOS_INV[5]);
        var PI = alg().matProd(A, res.inv);
        var IP = alg().matProd(res.inv, A);
        h += caja('Por la izquierda',
          'A\\cdot A^{-1} = ' + alg().matTex(A) + alg().matTex(res.inv) + ' = ' + alg().matTex(PI));
        h += caja('Por la derecha',
          'A^{-1}\\cdot A = ' + alg().matTex(res.inv) + alg().matTex(A) + ' = ' + alg().matTex(IP));
        if (alg().esIdentidad(PI) && alg().esIdentidad(IP)) {
          h += bien('<b>Los dos productos dan la identidad</b> ' + K('I_{' + n + '}') +
            ': la inversa est\u00E1 bien calculada. ' + K('\\checkmark'));
        } else {
          h += mal('La comprobaci\u00F3n no ha salido: revisa la matriz que has escrito.');
        }
        h += parrafo('Comparaci\u00F3n con Gauss-Jordan: el m\u00E9todo de los determinantes obliga a ' +
          'calcular ' + K(n + '^2 = ' + (n * n)) + ' determinantes de orden ' + (n - 1) +
          ' m\u00E1s el de orden ' + n + '. Para el orden 2 y el orden 3 es c\u00F3modo; para \u00F3rdenes ' +
          'mayores suele salir m\u00E1s r\u00E1pido Gauss-Jordan, aunque los dos m\u00E9todos dan ' +
          'exactamente la misma matriz.');
        h += S.kvs([
          'orden = <b>' + n + '</b>',
          '|A| = <b>' + numTxt(D) + '</b>',
          'adjuntos calculados = <b>' + (n * n) + '</b>',
          'tipo = <b>regular</b>',
          'comprobaci\u00F3n = <b>' + (alg().esIdentidad(PI) ? 'correcta' : 'revisar') + '</b>'
        ]);
        return h;
      }, EJEMPLO));
  };

  /* ==================================================================
     5 · Tema 2.15 · la regla rápida del orden 2
     ================================================================== */
  R.inversa2x2Det = function (node) {
    return S.shell(node, 'La regla r\u00E1pida del orden 2',
      'Para el orden 2, y <b>solo</b> para el orden 2, la f\u00F3rmula general se convierte en una ' +
      'receta que se aprende de memoria: se <b>intercambian</b> los elementos de la diagonal ' +
      'principal, se <b>cambia el signo</b> a los de la secundaria y se divide todo entre el ' +
      'determinante. Escribe la matriz por filas: <code>4 6; 1 2</code> (o una fila por línea; valen ' +
      'fracciones como <code>1/2</code> y decimales con coma como <code>0,5</code>). El applet dibuja ' +
      'la receta con flechas y comprueba que da lo mismo que la f\u00F3rmula general ' +
      K('A^{-1} = \\dfrac{1}{|A|}\\operatorname{Adj}(A)^{t}') + '.',
      [
        {
          id: 'A', label: 'Matriz A (orden 2)', type: 'textarea', rows: 3,
          value: '4 6\n1 2', ancho: '15rem'
        },
        { id: 'ver', label: 'Comparar con la f\u00F3rmula general', type: 'check', value: true, ancho: '15rem' },
        chips([
          { txt: 'det = 2 · con fracciones', tip: 'aparecen 1/2 y −3/2', set: { A: '4 6\n1 2', ver: true } },
          { txt: 'det = 1 · inversa entera', tip: 'no hay que dividir', set: { A: '2 1\n1 1', ver: true } },
          { txt: 'det = −1', tip: 'ojo con los signos', set: { A: '1 2\n3 5', ver: true } },
          { txt: 'Con un cero', tip: 'triangular de orden 2', set: { A: '3 0\n2 1', ver: true } },
          { txt: 'Con negativos', tip: 'los cambios de signo se ven mejor', set: { A: '-1 2\n3 -4', ver: true } },
          { txt: 'Con fracciones de partida', tip: '1/2 en la matriz', set: { A: '1/2 1\n3 -2', ver: true } },
          { txt: 'Decimales con coma', tip: '0,5 se lee como 1/2', set: { A: '0,5 1\n2 3', ver: true } },
          { txt: 'Singular · det = 0', tip: 'filas proporcionales, no hay inversa', set: { A: '1 2\n2 4', ver: true } },
          { txt: 'Identidad', tip: 'es su propia inversa', set: { A: '1 0\n0 1', ver: true } },
          { txt: 'Orden 3 (aviso)', tip: 'la receta no vale para el orden 3', set: { A: '1 2 3\n0 1 4\n5 6 0', ver: true } }
        ])
      ],
      safe(function (v) {
        var A0 = leeCuadrada(v.A, 'la matriz A', 4);
        if (A0.f !== 2) {
          var h0 = caja('Matriz A, de orden ' + A0.f, alg().matTex(A0));
          h0 += aviso('<b>Esta receta vale solo para el orden 2.</b> Tu matriz es de orden ' + A0.f +
            ', y ah\u00ED no hay ninguna receta corta: hay que calcular los ' + (A0.f * A0.f) +
            ' adjuntos, transponer y dividir. Usa el applet <b>Inversa por determinantes, paso a ' +
            'paso</b> para ese caso.');
          var rr = alg().inversaDet(A0);
          if (rr.existe) {
            h0 += caja('Su inversa por la f\u00F3rmula general', 'A^{-1} = ' + alg().matTex(rr.inv));
          } else {
            h0 += mal('Adem\u00E1s, esta matriz es singular: ' + S.esc(rr.motivo));
          }
          h0 += pista('Escribe una matriz de orden 2, por ejemplo <code>4 6; 1 2</code>.');
          return h0;
        }
        var A = A0;
        var a = A.a[0][0], b = A.a[0][1], c = A.a[1][0], d = A.a[1][1];
        var D = alg().det(A);
        var h = caja('Matriz A, de orden 2', alg().matTex(A));

        h += titulo('Paso 1 · el determinante');
        h += caja('En el orden 2 el determinante es la diferencia de los dos productos cruzados',
          '|A| = a_{11}a_{22} - a_{12}a_{21} = ' + FT(a) + '\\cdot' + S.parNegTex(FT(d)) + ' - ' +
          FT(b) + '\\cdot' + S.parNegTex(FT(c)) + ' = ' + FT(D));
        if (cero(D)) {
          h += mal('<b>' + K('|A| = 0') + '</b>: la matriz es <b>singular</b> y no tiene inversa. La ' +
            'receta se queda a medias porque el \u00FAltimo paso es dividir entre el determinante.');
          h += parrafo('Comprueba que las dos filas son proporcionales o que hay una fila de ceros: ' +
            'en el orden 2, ' + K('|A| = 0') + ' significa exactamente que una fila es m\u00FAltiplo ' +
            'de la otra.');
          h += figVeredicto({ regular: false, orden: 2, rango: alg().rango(A), detTxt: numTxt(D) });
          return h;
        }
        h += bien(K('|A| = ' + FT(D) + ' \\ne 0') + ': la inversa existe.');

        h += titulo('Paso 2 · la receta visual');
        h += figReceta(A, D);
        h += S.tabla(['Lugar (base 1)', 'En A', 'En la receta', 'Qu\u00E9 se ha hecho'], [
          ['fila 1, columna 1', K(FT(a)), K(FT(d)), 'llega ' + K(texA(1, 1)) + ': intercambio de la diagonal principal'],
          ['fila 1, columna 2', K(FT(b)), K(FT(b.opuesto())), 'cambio de signo (diagonal secundaria)'],
          ['fila 2, columna 1', K(FT(c)), K(FT(c.opuesto())), 'cambio de signo (diagonal secundaria)'],
          ['fila 2, columna 2', K(FT(d)), K(FT(a)), 'llega ' + K(texA(0, 0)) + ': intercambio de la diagonal principal']
        ]);
        var receta = alg().matDe([[d, b.opuesto()], [c.opuesto(), a]]);
        var inv = alg().matEscalar(receta, F1().entre(D));
        h += caja('Paso 3 · dividir entre el determinante',
          'A^{-1} = \\dfrac{1}{|A|}' + alg().matTex(receta) + ' = \\dfrac{1}{' + FT(D) + '}' +
          alg().matTex(receta) + ' = ' + alg().matTex(inv));
        h += S.resultado(K('A^{-1} = ' + alg().matTex(inv)), 'inversa por la regla r\u00E1pida');

        if (v.ver) {
          h += titulo('\u00BFCoincide con la f\u00F3rmula general?');
          var res = alg().inversaDet(A);
          h += caja('Matriz de los adjuntos y su transpuesta',
            '\\operatorname{Adj}(A) = ' + alg().matTex(res.adj) + ' \\qquad ' +
            '\\operatorname{Adj}(A)^{t} = ' + alg().matTex(res.adjT));
          h += parrafo('En el orden 2 los cuatro adjuntos son n\u00FAmeros sueltos: ' +
            K(texAdj(0, 0) + ' = ' + FT(res.adj.a[0][0])) + ', ' +
            K(texAdj(0, 1) + ' = ' + FT(res.adj.a[0][1])) + ', ' +
            K(texAdj(1, 0) + ' = ' + FT(res.adj.a[1][0])) + ' y ' +
            K(texAdj(1, 1) + ' = ' + FT(res.adj.a[1][1])) +
            ', porque el menor complementario de cada elemento es el \u00FAnico n\u00FAmero que queda ' +
            'al tachar su fila y su columna. Al transponer, la matriz de la receta aparece sola.');
          h += caja('Por la f\u00F3rmula general', 'A^{-1} = \\dfrac{1}{|A|}\\operatorname{Adj}(A)^{t} = ' +
            alg().matTex(res.inv));
          if (alg().matIgual(inv, res.inv)) {
            h += bien('<b>Las dos matrices coinciden elemento a elemento.</b> La receta no es otra ' +
              'f\u00F3rmula: es la f\u00F3rmula general escrita para el orden 2.');
          } else {
            h += mal('No coinciden: revisa la matriz que has escrito.');
          }
          h += caja('Comprobaci\u00F3n del producto',
            'A\\cdot A^{-1} = ' + alg().matTex(alg().matProd(A, inv)) + ' = I \\quad \\checkmark');
        } else {
          h += aviso('Marca la casilla <b>Comparar con la f\u00F3rmula general</b> para ver que la ' +
            'receta es exactamente ' + K('\\dfrac{1}{|A|}\\operatorname{Adj}(A)^{t}') + ' en el orden 2.');
        }

        h += S.kvs([
          '|A| = <b>' + numTxt(D) + '</b>',
          'inversa (1,1) = <b>' + numTxt(inv.a[0][0]) + '</b>',
          'inversa (1,2) = <b>' + numTxt(inv.a[0][1]) + '</b>',
          'inversa (2,1) = <b>' + numTxt(inv.a[1][0]) + '</b>',
          'inversa (2,2) = <b>' + numTxt(inv.a[1][1]) + '</b>'
        ]);
        h += parrafo('<b>Aviso.</b> Esta receta <b>no</b> se generaliza: en el orden 3 no basta con ' +
          'intercambiar y cambiar signos. Ah\u00ED hay que calcular los nueve adjuntos, transponer y ' +
          'dividir entre el determinante.');
        return h;
      }, EJEMPLO));
  };

  /* ==================================================================
     Azar reproducible: todo lo que se genera al azar en este módulo
     depende de una semilla visible, para que el mismo número dé
     siempre el mismo ejercicio (y los tests puedan comprobarlo).
     ================================================================== */
  function mulberry32(semilla) {
    var t = (semilla >>> 0) || 1;
    return function () {
      t = (t + 0x6D2B79F5) >>> 0;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  function dado(rnd, min, max) { return min + Math.floor(rnd() * (max - min + 1)); }
  function dadoNoCero(rnd, min, max) {
    var v = dado(rnd, min, max), n = 0;
    while (v === 0 && n++ < 20) v = dado(rnd, min, max);
    return v === 0 ? 1 : v;
  }
  function elige(rnd, lista) { return lista[dado(rnd, 0, lista.length - 1)]; }
  /* Matriz de enteros n×m con la semilla dada. */
  function matNums(rnd, f, c, min, max) {
    var a = [], i, j;
    for (i = 0; i < f; i++) {
      a.push([]);
      for (j = 0; j < c; j++) a[i].push(new Frac(dado(rnd, min, max)));
    }
    return alg().matDe(a);
  }
  /* Matriz cuadrada REGULAR (determinante no nulo) de orden n. */
  function matRegular(rnd, n, min, max) {
    var A = matNums(rnd, n, n, min, max), intentos = 0;
    while (cero(alg().det(A)) && intentos++ < 60) A = matNums(rnd, n, n, min, max);
    if (cero(alg().det(A))) {
      A = alg().matIdentidad(n);
      A.a[0][0] = new Frac(dadoNoCero(rnd, 2, 5));
    }
    return A;
  }
  /* Matriz cuadrada SINGULAR: una fila combinación de las otras. */
  function matSingular(rnd, n, min, max) {
    var A = matNums(rnd, n, n, min, max);
    var f0 = dado(rnd, 0, n - 1), f1 = (f0 + 1 + dado(rnd, 0, n - 2)) % n;
    var lam = new Frac(dadoNoCero(rnd, -3, 3));
    var j;
    for (j = 0; j < n; j++) A.a[f1][j] = A.a[f0][j].por(lam);
    return A;
  }

  /* ==================================================================
     6 · Tema 2.15 · ¿regular o singular?
     ================================================================== */
  R.existeInversa = function (node) {
    return S.shell(node, '\u00BFRegular o singular? El criterio del determinante',
      'Una matriz cuadrada tiene inversa <b>si y solo si</b> su determinante no es cero. Escribe una ' +
      'matriz cuadrada por filas: <code>2 1; 1 1</code> (o una fila por línea; valen fracciones como ' +
      '<code>1/2</code>) y el applet la clasifica. Debajo hay una <b>bater\u00EDa</b> de matrices ya ' +
      'clasificadas y un <b>juego de decisi\u00F3n r\u00E1pida</b>: mira la matriz, decide si tiene ' +
      'inversa, escribe <code>si</code> o <code>no</code> y pulsa <b>Comprobar</b>. El contador lleva ' +
      'los aciertos.',
      [
        {
          id: 'A', label: 'Matriz A (una fila por línea)', type: 'textarea', rows: 4,
          value: '1 2 3\n0 1 4\n5 6 0', ancho: '17rem'
        },
        { id: 'semilla', label: 'Semilla del juego', type: 'number', min: 1, max: 999, value: 7, ancho: '9rem' },
        { id: 'n', label: 'Matriz del juego n\u00BA', type: 'number', min: 1, max: 99, value: 1, ancho: '10rem' },
        {
          id: 'resp', label: '\u00BFTiene inversa? (si / no)', type: 'text',
          value: '', ancho: '11rem', place: 'si  o  no'
        },
        {
          id: 'comprueba', label: 'Comprobar', type: 'button',
          click: function (c, api) { c._verJuego = true; if (api && api.run) api.run(); }
        },
        {
          id: 'otra', label: 'Otra matriz del juego', type: 'button',
          click: function (c) {
            c.n.value = String(Math.min(99, ent(c.n.value, 1, 99, 1) + 1));
            c.resp.value = '';
          }
        },
        {
          id: 'reinicia', label: 'Reiniciar el marcador', type: 'button',
          click: function (c) { c.n.value = '1'; c.resp.value = ''; }
        },
        chips([
          { txt: 'Regular de orden 3', tip: 'determinante distinto de cero', set: { A: '1 2 3\n0 1 4\n5 6 0' } },
          { txt: 'Singular · fila proporcional', tip: 'la segunda fila es el doble de la primera', set: { A: '1 2 3\n2 4 6\n1 0 1' } },
          { txt: 'Singular · fila de ceros', tip: 'basta una fila nula', set: { A: '1 2 3\n0 0 0\n5 6 0' } },
          { txt: 'Singular · fila suma de las otras', tip: 'dependencia menos evidente', set: { A: '1 2 3\n2 1 0\n3 3 3' } },
          { txt: 'Identidad', tip: 'el caso más regular de todos', set: { A: '1 0 0\n0 1 0\n0 0 1' } },
          { txt: 'Triangular con ceros en la diagonal', tip: 'el determinante es el producto de la diagonal', set: { A: '2 5 1\n0 0 3\n0 0 4' } },
          { txt: 'Orden 2 regular', tip: 'el caso más corto', set: { A: '4 6\n1 2' } },
          { txt: 'Orden 4 regular', tip: 'el criterio es el mismo', set: { A: '1 0 2 1\n0 1 1 0\n2 1 0 1\n1 1 1 2' } },
          { txt: 'Con fracciones', tip: 'aritmética exacta', set: { A: '1/2 1\n3 -2' } },
          { txt: 'No cuadrada (aviso)', tip: 'sin determinante, sin inversa', set: { A: '1 2 3\n4 5 6' } }
        ])
      ],
      safe(function (v, ctl) {
        var h = '';
        var A = leeM(v.A, 'la matriz A', 4, 4);
        h += caja('Matriz A, de dimensi\u00F3n ' + alg().dimTxt(A), alg().matTex(A));

        if (A.f !== A.c) {
          h += mal('<b>No es cuadrada</b>, as\u00ED que ni siquiera tiene determinante: la pregunta ' +
            '\u00ABregular o singular\u00BB solo se hace a matrices cuadradas, y una matriz no ' +
            'cuadrada nunca tiene inversa.');
          h += pista('Escribe tantas filas como columnas, por ejemplo <code>2 1; 1 1</code>.');
          return h;
        }
        var n = A.f, D = alg().det(A), rg = alg().rango(A), regular = !cero(D);

        h += titulo('El veredicto');
        h += caja('Determinante', '|A| = ' + alg().detTex(A) + ' = ' + FT(D));
        if (regular) {
          h += bien('<b>Matriz REGULAR</b> (tambi\u00E9n se dice <b>inversible</b> o <b>no ' +
            'singular</b>): ' + K('|A| = ' + FT(D) + ' \\ne 0') + ', as\u00ED que ' + K('A^{-1}') +
            ' existe y es \u00FAnica.');
        } else {
          h += mal('<b>Matriz SINGULAR</b>: ' + K('|A| = 0') + ', as\u00ED que <b>no</b> tiene inversa.');
        }
        h += figVeredicto({ regular: regular, orden: n, rango: rg, detTxt: numTxt(D) });

        h += titulo('Las tres formas de decir lo mismo');
        h += S.tabla(['Se dice as\u00ED\u2026', 'Matriz regular', 'Matriz singular'], [
          ['con el determinante', K('|A| \\ne 0'), K('|A| = 0')],
          ['con el rango', K('\\operatorname{rg}(A) = n') + ' (rango m\u00E1ximo)', K('\\operatorname{rg}(A) < n')],
          ['con las filas', 'las ' + K('n') + ' filas son <b>linealmente independientes</b>',
            'alguna fila es combinaci\u00F3n lineal de las otras'],
          ['con la inversa', 'existe ' + K('A^{-1}') + ' y es \u00FAnica', 'no existe ninguna inversa']
        ]);
        h += parrafo('Las cuatro filas de la tabla son la <b>misma</b> propiedad vista desde cuatro ' +
          'sitios. Si una fila depende de las otras, al hacer ceros por Gauss aparece una fila nula, ' +
          'el determinante sale ' + K('0') + ' y el rango baja: todo encaja. En tu matriz, ' +
          K('\\operatorname{rg}(A) = ' + rg) + ' y el orden es ' + K(String(n)) + ', ' +
          (regular ? 'que coinciden: rango m\u00E1ximo.' : 'que no coinciden: falta rango.'));
        if (regular) {
          var res = alg().inversaDet(A);
          h += caja('Y esta es su inversa', 'A^{-1} = ' + alg().matTex(res.inv));
        } else {
          h += parrafo('Al ser singular no hay nada que calcular: no existe ninguna matriz ' + K('B') +
            ' con ' + K('A\\cdot B = I') + '. Si la hubiera, tomando determinantes saldr\u00EDa ' +
            K('|A|\\cdot|B| = |I| = 1') + ', imposible con ' + K('|A| = 0') + '.');
        }

        h += titulo('Bater\u00EDa de matrices para clasificar');
        h += parrafo('Cinco matrices con truco: en todas basta <b>mirar</b> antes de calcular. ' +
          'Los ceros, las filas repetidas y las filas proporcionales delatan a las singulares.');
        var bat = [
          { t: '2 1; 4 2', p: 'la segunda fila es el doble de la primera' },
          { t: '3 0 0; 0 2 0; 0 0 5', p: 'diagonal con todos los elementos no nulos' },
          { t: '1 2 3; 4 5 6; 7 8 9', p: 'la tercera fila es el doble de la segunda menos la primera' },
          { t: '1 1 0; 0 1 1; 1 0 1', p: 'ninguna fila salta a la vista: hay que calcular' },
          { t: '5 7 2; 0 0 0; 1 2 3', p: 'una fila de ceros' }
        ];
        var filasBat = bat.map(function (b) {
          var M = alg().parseMat(b.t);
          var d = alg().det(M);
          return [
            K(alg().matTex(M)),
            K('|A| = ' + FT(d)),
            cero(d) ? '<b class="ap-ko">singular</b>' : '<b class="ap-ok">regular</b>',
            cero(d) ? 'no tiene inversa' : 'tiene inversa',
            b.p
          ];
        });
        h += S.tabla(['Matriz', 'Determinante', 'Tipo', '\u00BFInversa?', 'Por d\u00F3nde se ve'], filasBat);

        /* ---- juego de decisión rápida ---- */
        h += titulo('Juego de decisi\u00F3n r\u00E1pida');
        var semilla = ent(v.semilla, 1, 999, 7);
        var idx = ent(v.n, 1, 99, 1);
        var rnd = mulberry32(semilla * 7919 + idx * 104729);
        var orden = dado(rnd, 2, 3);
        var quiero = rnd() < 0.5;
        var M = quiero ? matRegular(rnd, orden, -4, 4) : matSingular(rnd, orden, -4, 4);
        var dM = alg().det(M);
        var esRegular = !cero(dM);
        h += parrafo('Matriz n\u00BA <b>' + idx + '</b> de la serie con semilla <b>' + semilla +
          '</b>. Decide <b>de cabeza</b> si tiene inversa, escribe <code>si</code> o <code>no</code> ' +
          'en la casilla y pulsa <b>Comprobar</b>.');
        h += caja('Matriz del juego', alg().matTex(M));

        var marc = ctl && ctl._marcadorEI;
        if (!marc) { marc = { hechas: {}, aciertos: 0, fallos: 0, racha: 0 }; if (ctl) ctl._marcadorEI = marc; }

        var resp = String(v.resp === undefined || v.resp === null ? '' : v.resp).trim().toLowerCase()
          .replace(/\u00ED/g, 'i').replace(/[.,;!?]/g, '');
        var dijoSi = (resp === 'si' || resp === 's' || resp === 'sí' || resp === 'yes' || resp === 'regular');
        var dijoNo = (resp === 'no' || resp === 'n' || resp === 'singular');

        if (resp === '') {
          h += aviso('Escribe <code>si</code> o <code>no</code> en la casilla ' +
            '<b>\u00BFTiene inversa?</b> y pulsa <b>Comprobar</b>.');
        } else if (!dijoSi && !dijoNo) {
          h += aviso('No entiendo la respuesta \u00AB' + S.esc(resp) + '\u00BB. Escribe exactamente ' +
            '<code>si</code> o <code>no</code>.');
        } else {
          var acierta = (dijoSi === esRegular);
          var clave = 'm' + semilla + '-' + idx;
          if (marc.hechas[clave] === undefined) {
            marc.hechas[clave] = acierta;
            if (acierta) { marc.aciertos++; marc.racha++; } else { marc.fallos++; marc.racha = 0; }
          } else if (marc.hechas[clave] !== acierta) {
            if (acierta) { marc.aciertos++; marc.fallos--; marc.racha++; }
            else { marc.aciertos--; marc.fallos++; marc.racha = 0; }
            marc.hechas[clave] = acierta;
          }
          if (acierta) {
            h += bien('<b>\u00A1Correcto!</b> ' + K('|A| = ' + FT(dM)) + ', as\u00ED que la matriz es ' +
              (esRegular ? '<b>regular</b> y s\u00ED tiene inversa.' : '<b>singular</b> y no tiene inversa.'));
          } else {
            h += mal('<b>No.</b> ' + K('|A| = ' + FT(dM)) + ', as\u00ED que la matriz es ' +
              (esRegular ? '<b>regular</b>: s\u00ED tiene inversa.' : '<b>singular</b>: no tiene inversa.'));
            h += parrafo('<b>Por qu\u00E9:</b> ' + (esRegular
              ? 'sus ' + orden + ' filas son linealmente independientes, el rango es ' + orden +
                ' (el m\u00E1ximo) y el determinante no se anula.'
              : 'una fila es m\u00FAltiplo de otra, as\u00ED que el rango es menor que ' + orden +
                ' y el determinante se anula. Busca siempre filas proporcionales antes de calcular.'));
          }
          h += caja('El determinante, para verlo', '|A| = ' + alg().detTex(M) + ' = ' + FT(dM));
        }
        h += figMarcador(marc.aciertos, marc.fallos, marc.racha, 'Marcador del juego de decisi\u00F3n r\u00E1pida');
        h += S.kvs([
          '|A| = <b>' + numTxt(D) + '</b>',
          'rg(A) = <b>' + rg + '</b>',
          'tipo = <b>' + (regular ? 'regular' : 'singular') + '</b>',
          'aciertos del juego = <b>' + marc.aciertos + '</b>',
          'racha = <b>' + marc.racha + '</b>'
        ]);
        h += parrafo('<b>Truco de examen.</b> Antes de lanzarte a calcular el determinante, mira si ' +
          'hay una fila (o columna) de ceros, dos l\u00EDneas iguales o dos proporcionales: en esos ' +
          'tres casos el determinante es ' + K('0') + ' sin hacer ni una cuenta, y la matriz es ' +
          'singular.');
        return h;
      }, EJEMPLO));
  };

  /* ==================================================================
     7 · Tema 2.15 · inversa de una matriz con parámetro
     ================================================================== */
  R.inversaParam = function (node) {
    return S.shell(node, 'Inversa de una matriz con par\u00E1metro',
      'Escribe la matriz poniendo la letra del par\u00E1metro donde haga falta: ' +
      '<code>1 1 1; 1 k 1; 1 1 k</code> (una fila por línea o separadas por «;»). Los elementos pueden ' +
      'ser números (<code>3</code>, <code>-2</code>, <code>1/2</code>) o expresiones en la letra: ' +
      '<code>k</code>, <code>k-1</code>, <code>2k+3</code>, <code>k^2</code>. El applet calcula ' +
      K('|A|') + ' como <b>polinomio</b> en el par\u00E1metro, resuelve ' + K('|A| = 0') + ', dice ' +
      'para qu\u00E9 valores <b>no</b> existe la inversa y para cuáles sí, los marca en una recta real ' +
      'y, si quieres, calcula la inversa en un valor concreto.',
      [
        {
          id: 'A', label: 'Matriz con par\u00E1metro (una fila por línea)', type: 'textarea', rows: 4,
          value: '1 1 1\n1 k 1\n1 1 k', ancho: '17rem'
        },
        { id: 'letra', label: 'Letra del par\u00E1metro', type: 'text', value: 'k', ancho: '7rem' },
        { id: 'k0', label: 'Evaluar la inversa en el valor', type: 'text', value: '2', ancho: '11rem' },
        { id: 'evalua', label: 'Calcular la inversa en ese valor', type: 'check', value: true, ancho: '15rem' },
        chips([
          {
            txt: 'Dos valores prohibidos', tip: 'el determinante se anula en dos sitios',
            set: { A: '1 1 1\n1 k 1\n1 1 k', letra: 'k', k0: '2', evalua: true }
          },
          {
            txt: 'Un solo valor prohibido', tip: 'raíz doble',
            set: { A: 'k 1\n1 k', letra: 'k', k0: '3', evalua: true }
          },
          {
            txt: 'Orden 2 sencillo', tip: 'determinante de primer grado',
            set: { A: 'k 2\n1 3', letra: 'k', k0: '1', evalua: true }
          },
          {
            txt: 'Siempre inversible', tip: 'el determinante no se anula nunca',
            set: { A: 'k 1\n-1 k', letra: 'k', k0: '0', evalua: true }
          },
          {
            txt: 'Nunca inversible', tip: 'el determinante es idénticamente cero',
            set: { A: '1 k\n2 2k', letra: 'k', k0: '5', evalua: true }
          },
          {
            txt: 'Con k-1 y 2k', tip: 'expresiones más largas',
            set: { A: 'k-1 2\n3 2k', letra: 'k', k0: '2', evalua: true }
          },
          {
            txt: 'Otra letra: m', tip: 'el parámetro no tiene por qué llamarse k',
            set: { A: 'm 1 0\n0 m 1\n1 0 m', letra: 'm', k0: '2', evalua: true }
          },
          {
            txt: 'Con k al cuadrado', tip: 'k^2 en un elemento',
            set: { A: 'k^2 1\n1 1', letra: 'k', k0: '3', evalua: true }
          },
          {
            txt: 'Solo el estudio', tip: 'sin evaluar en ningún valor',
            set: { A: '1 1 1\n1 k 1\n1 1 k', letra: 'k', k0: '2', evalua: false }
          },
          {
            txt: 'Valor prohibido (aviso)', tip: 'evaluando justo donde no hay inversa',
            set: { A: '1 1 1\n1 k 1\n1 1 k', letra: 'k', k0: '1', evalua: true }
          }
        ])
      ],
      safe(function (v) {
        var letra = String(v.letra || 'k').trim().toLowerCase().charAt(0) || 'k';
        if (!/^[a-z]$/.test(letra)) {
          throw Error('La letra del par\u00E1metro debe ser una sola letra, por ejemplo k, m o t.');
        }
        var Q = alg().parseMatParam(String(v.A || ''), letra);
        if (Q.f !== Q.c) {
          throw Error('Solo las matrices CUADRADAS tienen determinante e inversa, y esta es de ' +
            Q.f + '\u00D7' + Q.c + '. Escribe tantas filas como columnas, por ejemplo 1 1 1; 1 ' +
            letra + ' 1; 1 1 ' + letra + '.');
        }
        if (Q.f < 2 || Q.f > 4) {
          throw Error('Este applet trabaja con \u00F3rdenes 2, 3 y 4, y has escrito orden ' + Q.f +
            '. Escribe por ejemplo 1 1 1; 1 ' + letra + ' 1; 1 1 ' + letra + '.');
        }
        var n = Q.f;
        var est = alg().detParam(Q, letra);
        var h = caja('Matriz con par\u00E1metro ' + letra, est.matTex);

        h += titulo('Paso 1 · el determinante, que ahora es un polinomio en ' + letra);
        h += caja('Determinante', est.tex);
        h += S.resultado(K('|A| = ' + est.polTex), 'el determinante depende de ' + letra);

        h += titulo('Paso 2 · resolver |A| = 0');
        var raices = est.raices || [];
        if (est.siempreNulo) {
          h += mal('El determinante vale ' + K('0') + ' <b>para cualquier valor</b> de ' + K(letra) +
            ': esta matriz es singular siempre y <b>nunca</b> tiene inversa.');
          h += parrafo('Mira las filas: alguna es combinaci\u00F3n lineal de las otras sea cual sea ' +
            'el valor del par\u00E1metro, as\u00ED que el rango nunca llega a ser ' + K(String(n)) + '.');
          h += S.kvs([
            'orden = <b>' + n + '</b>',
            'par\u00E1metro = <b>' + letra + '</b>',
            'determinante = <b>0 siempre</b>',
            'valores con inversa = <b>ninguno</b>',
            'valores sin inversa = <b>todos</b>'
          ]);
          return h;
        }
        if (est.factorTex) {
          h += caja('Factorizado', '|A| = ' + est.factorTex);
        }
        if (raices.length === 0) {
          h += bien('La ecuaci\u00F3n ' + K('|A| = 0') + ' <b>no tiene soluciones reales</b>: el ' +
            'determinante no se anula nunca, as\u00ED que la matriz es regular y tiene inversa ' +
            '<b>para todo valor</b> de ' + K(letra) + '.');
        } else {
          h += caja('Ecuaci\u00F3n a resolver', est.polTex + ' = 0');
          var filasR = raices.map(function (r) {
            return [
              K(r.tex),
              K('|A| = 0'),
              'rg(A) = ' + r.rango + ' < ' + n,
              '<b class="ap-ko">no tiene inversa</b>'
            ];
          });
          h += S.tabla(['Valor de ' + letra, 'Determinante', 'Rango', '\u00BFInversa?'], filasR);
        }

        h += titulo('Paso 3 · para qu\u00E9 valores hay inversa');
        var excl = raices.map(function (r) { return numTxt(r.valor); });
        if (raices.length === 0) {
          h += parrafo('<b>Hay inversa para todo ' + letra + '.</b> No hay ning\u00FAn valor ' +
            'prohibido: sea cual sea ' + K(letra) + ', el determinante es distinto de cero.');
        } else {
          h += parrafo('<b>No hay inversa</b> exactamente cuando ' + K(letra) + ' toma ' +
            (raices.length === 1 ? 'el valor ' : 'uno de los valores ') +
            K(raices.map(function (r) { return r.tex; }).join(',\\quad ')) +
            '. <b>Para cualquier otro valor s\u00ED hay inversa</b>, porque entonces ' +
            K('|A| \\ne 0') + '.');
          if (est.condicionGeneral) {
            h += caja('En una l\u00EDnea', est.condicionGeneral);
          }
        }

        /* recta real con los valores excluidos como puntos huecos */
        var vals = raices.map(function (r) { return Number(r.valor.val()); });
        var mn = -4, mx = 4;
        if (vals.length) {
          mn = Math.min.apply(null, vals) - 3;
          mx = Math.max.apply(null, vals) + 3;
          if (mx - mn < 6) { mn -= 1; mx += 1; }
        }
        var pasoR = Math.max(1, Math.round((mx - mn) / 10));
        h += S.rectaReal({
          min: mn, max: mx, W: W, H: 240, paso: pasoR, dec: 0,
          titulo: 'Valores de ' + letra + ' para los que NO existe la inversa',
          tramos: [{ a: mn, b: mx, col: 'rgba(46,125,50,.16)', alto: 18 }],
          puntos: raices.map(function (r) {
            return { x: Number(r.valor.val()), tex: r.tex, col: COL.rojo, hueco: true };
          }),
          label: 'Recta real con los valores excluidos',
          cap: 'La banda verde son los valores con inversa; los c\u00EDrculos <b>huecos</b> rojos ' +
            'marcan los valores <b>excluidos</b>, donde ' + K('|A| = 0') + ' y la matriz es singular.'
        });

        /* casos, tal como los da el motor */
        if (est.tabla && est.tabla.length) {
          h += titulo('Resumen por casos');
          h += S.tabla(['Caso', 'Determinante', 'Rango', '\u00BFInversa?', 'Explicaci\u00F3n'],
            est.tabla.map(function (t) {
              var hay = (t.detTxt !== '0');
              return [
                S.texifica(String(t.caso)),
                t.detTxt === '0' ? K('|A| = 0') : K('|A| \\ne 0'),
                (t.rango === null || t.rango === undefined) ? 'menor que el orden' : String(t.rango),
                hay ? '<b class="ap-ok">s\u00ED</b>' : '<b class="ap-ko">no</b>',
                S.esc(t.explicacion)
              ];
            }));
        }

        if (v.evalua) {
          h += titulo('Paso 4 · la inversa en un valor concreto de ' + letra);
          var k0;
          try { k0 = FR(String(v.k0)); } catch (e) {
            throw Error('No entiendo el valor \u00AB' + String(v.k0) + '\u00BB para ' + letra +
              '. Escribe un entero (3), un decimal con coma (0,5) o una fracci\u00F3n (3/4).');
          }
          var Ak = alg().evalMatParam(Q, k0);
          h += caja('Matriz para ' + letra + ' = ' + FT(k0),
            'A(' + FT(k0) + ') = ' + alg().matTex(Ak));
          var dk = alg().det(Ak);
          h += caja('Su determinante', '|A(' + FT(k0) + ')| = ' + FT(dk));
          if (cero(dk)) {
            h += mal('Para ' + K(letra + ' = ' + FT(k0)) + ' el determinante se anula: ese valor es ' +
              'justamente uno de los <b>prohibidos</b> y la matriz <b>no tiene inversa</b>. ' +
              'Prueba con otro valor.');
            h += parrafo('Se ve tambi\u00E9n en la recta real: ' + K(letra + ' = ' + FT(k0)) +
              ' es uno de los c\u00EDrculos huecos.');
          } else {
            var resK = alg().inversaDet(Ak);
            h += bien('Para ' + K(letra + ' = ' + FT(k0)) + ' sale ' + K('|A| = ' + FT(dk) + ' \\ne 0') +
              ': la matriz es regular y s\u00ED tiene inversa.');
            h += caja('Matriz de los adjuntos y su transpuesta',
              '\\operatorname{Adj}(A) = ' + alg().matTex(resK.adj) + ' \\qquad ' +
              '\\operatorname{Adj}(A)^{t} = ' + alg().matTex(resK.adjT));
            h += caja('Inversa', 'A^{-1} = \\dfrac{1}{' + FT(dk) + '}' + alg().matTex(resK.adjT) +
              ' = ' + alg().matTex(resK.inv));
            h += caja('Comprobaci\u00F3n',
              'A\\cdot A^{-1} = ' + alg().matTex(alg().matProd(Ak, resK.inv)) + ' = I \\quad \\checkmark');
          }
        } else {
          h += aviso('Marca la casilla <b>Calcular la inversa en ese valor</b> para ver la inversa ' +
            'concreta que sale al sustituir ' + K(letra) + ' por un n\u00FAmero.');
        }

        h += S.kvs([
          'orden = <b>' + n + '</b>',
          'par\u00E1metro = <b>' + letra + '</b>',
          'grado de |A| = <b>' + Math.max(0, est.pol.length - 1) + '</b>',
          'valores sin inversa = <b>' + (excl.length ? excl.join(', ') : 'ninguno') + '</b>',
          'n\u00BA de valores excluidos = <b>' + excl.length + '</b>'
        ]);
        h += parrafo('<b>Cómo se escribe en el examen.</b> Primero ' + K('|A|') + ' en funci\u00F3n de ' +
          K(letra) + ', luego \u00ABresolvemos ' + K('|A| = 0') + '\u00BB, y la conclusi\u00F3n en ' +
          'dos l\u00EDneas: <i>si ' + K(letra) +
          (raices.length ? ' es distinto de los valores hallados' : ' es cualquier n\u00FAmero') +
          ', la matriz es regular y existe ' + K('A^{-1}') + '; en caso contrario es singular y no ' +
          'existe</i>. Nunca dejes la respuesta solo con el polinomio.');
        return h;
      }, EJEMPLO_K + ' ' + EJEMPLO));
  };

  /* ==================================================================
     8 · Entrenador de ejercicios de todo el tema
     ==================================================================
     generaEjercicio(tipo, dif, semilla, n) devuelve SIEMPRE el mismo
     ejercicio para los mismos datos. Cada ejercicio lleva un objeto
     «chk» con lo necesario para que cualquiera (incluidos los tests)
     recalcule la respuesta con el motor y compruebe que la solución
     declarada es la correcta.
     ================================================================== */
  var TIPOS = [
    { id: 'det2', txt: 'Determinante de orden 2', ap: '2.2' },
    { id: 'det3', txt: 'Determinante de orden 3 por Sarrus', ap: '2.3' },
    { id: 'det4', txt: 'Determinante de orden 4 haciendo ceros', ap: '2.9' },
    { id: 'rango', txt: 'Rango de una matriz', ap: '2.12' },
    { id: 'adjunto', txt: 'Adjunto de un elemento', ap: '2.6' },
    { id: 'inversa', txt: 'Inversa por determinantes', ap: '2.15' }
  ];
  function tipoTxt(id) {
    var i;
    for (i = 0; i < TIPOS.length; i++) if (TIPOS[i].id === id) return TIPOS[i].txt;
    return id;
  }
  function tipoAp(id) {
    var i;
    for (i = 0; i < TIPOS.length; i++) if (TIPOS[i].id === id) return TIPOS[i].ap;
    return '2.1';
  }
  var RANGOS = { facil: [-3, 3], media: [-5, 5], dificil: [-7, 7] };

  function generaEjercicio(tipo, dif, semilla, n) {
    dif = (RANGOS[dif] ? dif : 'media');
    var lim = RANGOS[dif];
    var rnd = mulberry32((Number(semilla) || 1) * 7919 + (Number(n) || 1) * 104729 + 13);
    if (tipo === 'mezcla' || !tipo) tipo = elige(rnd, TIPOS).id;
    var e = { tipo: tipo, tipoTxt: tipoTxt(tipo), apartado: tipoAp(tipo), dif: dif };
    var A, i, j, res;

    if (tipo === 'det2') {
      A = matNums(rnd, 2, 2, lim[0], lim[1]);
      e.A = A;
      e.enunciado = 'Calcula el determinante de esta matriz de orden 2.';
      e.tex = alg().detTex(A);
      e.pide = 'un n\u00FAmero';
      e.sol = alg().det(A);
      e.chk = { clase: 'det', A: A };
    } else if (tipo === 'det3') {
      A = matNums(rnd, 3, 3, lim[0], lim[1]);
      e.A = A;
      e.enunciado = 'Calcula el determinante de esta matriz de orden 3 (puedes usar la regla de Sarrus).';
      e.tex = alg().detTex(A);
      e.pide = 'un n\u00FAmero';
      e.sol = alg().det(A);
      e.chk = { clase: 'det', A: A };
    } else if (tipo === 'det4') {
      A = matNums(rnd, 4, 4, dif === 'dificil' ? -4 : -3, dif === 'dificil' ? 4 : 3);
      /* un par de ceros para que el método de hacer ceros luzca */
      A.a[0][dado(rnd, 0, 3)] = F0();
      A.a[dado(rnd, 1, 3)][0] = F0();
      A.a[0][0] = new Frac(dadoNoCero(rnd, 1, 3));
      e.A = A;
      e.enunciado = 'Calcula este determinante de orden 4. Lo m\u00E1s c\u00F3modo es <b>hacer ceros</b> ' +
        'en una l\u00EDnea y desarrollar por ella.';
      e.tex = alg().detTex(A);
      e.pide = 'un n\u00FAmero';
      e.sol = alg().det(A);
      e.chk = { clase: 'det', A: A };
    } else if (tipo === 'rango') {
      var f = dif === 'facil' ? 2 : 3;
      var c = dif === 'dificil' ? 4 : 3;
      A = matNums(rnd, f, c, lim[0], lim[1]);
      if (rnd() < 0.45) {                       /* fuerza dependencia a veces */
        var lam = new Frac(dadoNoCero(rnd, -2, 2)), q;
        for (q = 0; q < c; q++) A.a[f - 1][q] = A.a[0][q].por(lam);
      }
      e.A = A;
      e.enunciado = 'Calcula el rango de esta matriz de ' + f + '\u00D7' + c + '.';
      e.tex = alg().matTex(A);
      e.pide = 'un n\u00FAmero entero';
      e.sol = new Frac(alg().rango(A));
      e.chk = { clase: 'rango', A: A };
    } else if (tipo === 'adjunto') {
      var orden = dif === 'facil' ? 2 : (dif === 'media' ? 3 : (rnd() < 0.5 ? 3 : 4));
      A = matNums(rnd, orden, orden, lim[0], lim[1]);
      i = dado(rnd, 0, orden - 1); j = dado(rnd, 0, orden - 1);
      e.A = A; e.i = i; e.j = j;
      e.enunciado = 'Calcula el adjunto ' + K(texAdj(i, j)) + ', es decir el adjunto del elemento ' +
        'que est\u00E1 en la <b>fila ' + (i + 1) + '</b> y la <b>columna ' + (j + 1) + '</b>. ' +
        'No olvides el signo.';
      e.tex = 'A = ' + alg().matTex(A, { marca: [[i, j]] });
      e.pide = 'un n\u00FAmero';
      e.sol = alg().adjunto(A, i, j);
      e.chk = { clase: 'adjunto', A: A, i: i, j: j };
    } else {                                     /* inversa */
      var o2 = dif === 'facil' ? 2 : 3;
      A = matRegular(rnd, o2, dif === 'facil' ? -3 : lim[0], dif === 'facil' ? 3 : lim[1]);
      i = dado(rnd, 0, o2 - 1); j = dado(rnd, 0, o2 - 1);
      e.A = A; e.i = i; e.j = j;
      e.enunciado = 'Calcula la inversa por determinantes y escribe el elemento que ocupa la ' +
        '<b>fila ' + (i + 1) + '</b> y la <b>columna ' + (j + 1) + '</b> de ' + K('A^{-1}') + '. ' +
        'Da la respuesta como <b>fracci\u00F3n exacta</b> (por ejemplo <code>-1/3</code>), nunca ' +
        'como decimal aproximado.';
      e.tex = 'A = ' + alg().matTex(A);
      e.pide = 'un n\u00FAmero o una fracci\u00F3n';
      e.sol = alg().inversaDet(A).inv.a[i][j];
      e.chk = { clase: 'inversa', A: A, i: i, j: j };
    }
    e.solTxt = numTxt(e.sol);
    e.solTex = FT(e.sol);
    return e;
  }

  /* Respuesta correcta recalculada desde cero con el motor. */
  function respuestaModelo(chk) {
    if (chk.clase === 'det') return alg().det(chk.A);
    if (chk.clase === 'rango') return new Frac(alg().rango(chk.A));
    if (chk.clase === 'adjunto') return alg().adjunto(chk.A, chk.i, chk.j);
    if (chk.clase === 'menor') return alg().menorComp(chk.A, chk.i, chk.j);
    if (chk.clase === 'inversa') return alg().inversaDet(chk.A).inv.a[chk.i][chk.j];
    if (chk.clase === 'adjM') return alg().matAdjuntos(chk.A).a[chk.i][chk.j];
    if (chk.clase === 'cuenta') return new Frac(alg().cuentaMenores(chk.f, chk.c, chk.h));
    if (chk.clase === 'raiz') return new Frac(-chk.b, chk.a);
    throw Error('No s\u00E9 comprobar una respuesta de la clase «' + chk.clase + '».');
  }

  /* Resolución completa, paso a paso, de un ejercicio del entrenador. */
  function solucionEjercicio(e) {
    var h = '', A = e.A;
    if (e.tipo === 'det2') {
      /* nada que preparar */
      h += S.paso(1, 'En el orden 2 el determinante es el producto de la diagonal principal menos ' +
        'el de la secundaria.' + KD('|A| = a_{11}a_{22} - a_{12}a_{21}'));
      h += S.paso(2, 'Sustituimos:' + KD('|A| = ' + FT(A.a[0][0]) + '\\cdot' + S.parNegTex(FT(A.a[1][1])) +
        ' - ' + FT(A.a[0][1]) + '\\cdot' + S.parNegTex(FT(A.a[1][0])) + ' = ' + FT(e.sol)), 'ap-paso-clave');
    } else if (e.tipo === 'det3') {
      var sr = alg().sarrus(A);
      h += S.paso(1, 'Regla de Sarrus: tres productos con signo m\u00E1s (diagonal principal y sus ' +
        'paralelas) y tres con signo menos (diagonal secundaria y sus paralelas).' + KD(sarrusTex(sr)));
      h += S.paso(2, S.esc(sr.descripcion), 'ap-paso-clave');
      var dv = alg().desarrollo(A, 'fila', alg().mejorLinea(A).indice);
      h += S.paso(3, 'Comprobaci\u00F3n desarrollando por una l\u00EDnea:' + KD(dv.tex));
    } else if (e.tipo === 'det4') {
      var hc = alg().hacerCeros(A, {});
      hc.pasos.forEach(function (p, idx) {
        h += S.paso(idx + 1, S.esc(p.descripcion) + (p.tex ? KD(p.tex) : ''),
          p.tipo === 'final' ? 'ap-paso-clave' : '');
      });
      if (hc.nulo) {
        h += parrafo('Ha aparecido una l\u00EDnea de ceros, as\u00ED que el determinante vale ' + K('0') + '.');
      }
    } else if (e.tipo === 'rango') {
      var rp = alg().rangoMenores(A);
      rp.pasos.forEach(function (p, idx) {
        h += S.paso(idx + 1, S.esc(p.descripcion) + (p.tex ? KD(p.tex) : ''),
          idx === rp.pasos.length - 1 ? 'ap-paso-clave' : '');
      });
    } else if (e.tipo === 'adjunto') {
      var men = alg().menorComp(A, e.i, e.j);
      var sg = alg().signoAdj(e.i, e.j);
      h += S.paso(1, 'Tachamos la fila ' + (e.i + 1) + ' y la columna ' + (e.j + 1) + ' y nos ' +
        'quedamos con el <b>menor complementario</b>:' +
        KD(texMen(e.i, e.j) + ' = ' + (A.f > 2 ? alg().detTex(alg().subMat(A, e.i, e.j)) + ' = ' : '') + FT(men)));
      h += S.paso(2, 'El signo del tablero es ' +
        K('(-1)^{' + (e.i + 1) + '+' + (e.j + 1) + '} = ' + (sg > 0 ? '+1' : '-1')) + '.');
      h += S.paso(3, 'Por tanto:' + KD(texAdj(e.i, e.j) + ' = ' + (sg > 0 ? '' : '-') +
        '\\left(' + FT(men) + '\\right) = ' + FT(e.sol)), 'ap-paso-clave');
      h += figMenor(A, e.i, e.j);
    } else {
      var res = alg().inversaDet(A);
      h += S.paso(1, 'Calculamos el determinante:' + KD('|A| = ' + FT(res.det) + ' \\ne 0') +
        ' As\u00ED que la inversa existe.');
      h += S.paso(2, 'Matriz de los adjuntos:' + KD('\\operatorname{Adj}(A) = ' + alg().matTex(res.adj)));
      h += S.paso(3, 'La transponemos:' + KD('\\operatorname{Adj}(A)^{t} = ' + alg().matTex(res.adjT)));
      h += S.paso(4, 'Y dividimos entre el determinante:' +
        KD('A^{-1} = \\dfrac{1}{' + FT(res.det) + '}' + alg().matTex(res.adjT) + ' = ' + alg().matTex(res.inv)));
      h += S.paso(5, 'El elemento pedido, el de la fila ' + (e.i + 1) + ' y la columna ' + (e.j + 1) +
        ', es' + KD('\\left(A^{-1}\\right)_{' + (e.i + 1) + (e.j + 1) + '} = ' + FT(e.sol)), 'ap-paso-clave');
    }
    return h;
  }

  /* Lee la respuesta del alumno como fracción exacta; null si no se entiende. */
  function leeNumero(txtIn) {
    var s = String(txtIn === undefined || txtIn === null ? '' : txtIn).trim();
    if (s === '') return null;
    try { return FR(s); } catch (e) { return null; }
  }

  R.entrenador = function (node) {
    return S.shell(node, 'Entrenador de ejercicios del tema',
      'Ejercicios generados al azar de todo el tema. Elige el <b>tipo</b> y la <b>dificultad</b>, ' +
      'escribe la respuesta en la casilla y pulsa <b>Comprobar</b>. Los n\u00FAmeros se escriben como ' +
      '<code>-3</code>, <code>0,5</code> o <code>-1/3</code>: las fracciones se dan <b>exactas</b>, ' +
      'nunca como <code>0,3333</code>. Con <b>Ejercicio nuevo</b> pasas al siguiente; con <b>Ver la ' +
      'soluci\u00F3n</b> aparece la resoluci\u00F3n completa paso a paso. La <b>semilla</b> fija la ' +
      'serie: con la misma semilla salen siempre los mismos ejercicios.',
      [
        {
          id: 'tipo', label: 'Tipo de ejercicio', type: 'select', value: 'mezcla', ancho: '17rem',
          options: [{ value: 'mezcla', label: 'De todo un poco' }].concat(TIPOS.map(function (t) {
            return { value: t.id, label: t.txt };
          }))
        },
        {
          id: 'dif', label: 'Dificultad', type: 'select', value: 'media', ancho: '11rem',
          options: [
            { value: 'facil', label: 'F\u00E1cil' },
            { value: 'media', label: 'Media' },
            { value: 'dificil', label: 'Dif\u00EDcil' }
          ]
        },
        { id: 'semilla', label: 'Semilla', type: 'number', min: 1, max: 999, value: 5, ancho: '8rem' },
        { id: 'n', label: 'Ejercicio n\u00BA', type: 'number', min: 1, max: 199, value: 1, ancho: '9rem' },
        { id: 'resp', label: 'Tu respuesta', type: 'text', value: '', ancho: '11rem', place: '-3   0,5   -1/3' },
        {
          id: 'comprueba', label: 'Comprobar', type: 'button',
          click: function (c, api) { if (api && api.run) api.run(); }
        },
        {
          id: 'nuevo', label: 'Ejercicio nuevo', type: 'button',
          click: function (c) {
            c.n.value = String(Math.min(199, ent(c.n.value, 1, 199, 1) + 1));
            c.resp.value = '';
            if (c.ver) { c.ver.checked = false; }
          }
        },
        {
          id: 'anterior', label: 'Ejercicio anterior', type: 'button',
          click: function (c) {
            c.n.value = String(Math.max(1, ent(c.n.value, 1, 199, 1) - 1));
            c.resp.value = '';
          }
        },
        { id: 'ver', label: 'Ver la soluci\u00F3n', type: 'check', value: false, ancho: '13rem' },
        {
          id: 'reinicia', label: 'Reiniciar el marcador', type: 'button',
          click: function (c) { c._marcadorEN = null; c.n.value = '1'; c.resp.value = ''; }
        },
        chips([
          { txt: 'Orden 2 f\u00E1cil', tip: 'para calentar', set: { tipo: 'det2', dif: 'facil', semilla: 5, n: 1, resp: '', ver: false } },
          { txt: 'Sarrus', tip: 'determinantes de orden 3', set: { tipo: 'det3', dif: 'media', semilla: 11, n: 1, resp: '', ver: false } },
          { txt: 'Orden 4 haciendo ceros', tip: 'lo más largo del tema', set: { tipo: 'det4', dif: 'media', semilla: 21, n: 1, resp: '', ver: false } },
          { txt: 'Rango', tip: 'rango por menores', set: { tipo: 'rango', dif: 'media', semilla: 31, n: 1, resp: '', ver: false } },
          { txt: 'Adjuntos', tip: 'un adjunto con su signo', set: { tipo: 'adjunto', dif: 'media', semilla: 41, n: 1, resp: '', ver: false } },
          { txt: 'Inversa por determinantes', tip: 'un elemento de la inversa', set: { tipo: 'inversa', dif: 'media', semilla: 51, n: 1, resp: '', ver: false } },
          { txt: 'Mezcla dif\u00EDcil', tip: 'de todo y con números más grandes', set: { tipo: 'mezcla', dif: 'dificil', semilla: 61, n: 1, resp: '', ver: false } },
          { txt: 'Con la soluci\u00F3n a la vista', tip: 'para estudiar el método', set: { tipo: 'det3', dif: 'media', semilla: 7, n: 3, resp: '', ver: true } }
        ])
      ],
      safe(function (v, ctl) {
        var tipo = String(v.tipo || 'mezcla');
        var dif = String(v.dif || 'media');
        var semilla = ent(v.semilla, 1, 999, 5);
        var idx = ent(v.n, 1, 199, 1);
        var e = generaEjercicio(tipo, dif, semilla, idx);

        var marc = ctl && ctl._marcadorEN;
        if (!marc) { marc = { hechas: {}, aciertos: 0, fallos: 0, racha: 0 }; if (ctl) ctl._marcadorEN = marc; }

        var h = '';
        h += titulo('Ejercicio n\u00BA ' + idx + ' \u00B7 ' + e.tipoTxt);
        h += parrafo('<b>Apartado ' + e.apartado + '</b> \u00B7 dificultad <b>' +
          (dif === 'facil' ? 'f\u00E1cil' : (dif === 'dificil' ? 'dif\u00EDcil' : 'media')) +
          '</b> \u00B7 serie con semilla <b>' + semilla + '</b>.');
        h += parrafo(e.enunciado);
        h += caja('Datos del ejercicio', e.tex);
        h += aviso('La respuesta es <b>' + e.pide + '</b>. Escr\u00EDbela en la casilla ' +
          '<b>Tu respuesta</b> y pulsa <b>Comprobar</b>.');

        var r = leeNumero(v.resp);
        var contestado = String(v.resp || '').trim() !== '';
        if (contestado && r === null) {
          h += mal('No entiendo la respuesta \u00AB' + S.esc(String(v.resp)) + '\u00BB. Escribe un ' +
            'entero (<code>-3</code>), un decimal con coma (<code>0,5</code>) o una fracci\u00F3n ' +
            '(<code>-1/3</code>).');
        } else if (contestado) {
          var acierta = igF(r, e.sol);
          var clave = tipo + '-' + dif + '-' + semilla + '-' + idx;
          if (marc.hechas[clave] === undefined) {
            marc.hechas[clave] = acierta;
            if (acierta) { marc.aciertos++; marc.racha++; } else { marc.fallos++; marc.racha = 0; }
          } else if (marc.hechas[clave] !== acierta) {
            if (acierta) { marc.aciertos++; marc.fallos--; marc.racha++; }
            else { marc.aciertos--; marc.fallos++; marc.racha = 0; }
            marc.hechas[clave] = acierta;
          }
          if (acierta) {
            h += bien('<b>\u00A1Correcto!</b> La respuesta es ' + K(e.solTex) + '. Racha actual: <b>' +
              marc.racha + '</b>.');
          } else {
            h += mal('<b>No es correcto.</b> Has escrito ' + K(FT(r)) + ' y la respuesta es ' +
              K(e.solTex) + '. Aqu\u00ED tienes la resoluci\u00F3n completa:');
            h += titulo('Resoluci\u00F3n paso a paso');
            h += solucionEjercicio(e);
            h += S.resultado(K(e.solTex), 'soluci\u00F3n del ejercicio');
            h += ref('Repasa el <b>apartado ' + e.apartado + '</b> del tema: ' + e.tipoTxt + '.');
          }
        } else {
          h += pista('Si te atascas, marca <b>Ver la soluci\u00F3n</b>: aparece la resoluci\u00F3n ' +
            'completa, paso a paso, sin contar como fallo.');
        }

        if (v.ver && !(contestado && r !== null && !igF(r, e.sol))) {
          h += titulo('Resoluci\u00F3n paso a paso');
          h += solucionEjercicio(e);
          h += S.resultado(K(e.solTex), 'soluci\u00F3n del ejercicio');
        }

        h += figMarcador(marc.aciertos, marc.fallos, marc.racha, 'Marcador del entrenador');
        h += S.kvs([
          'tipo = <b>' + e.tipoTxt + '</b>',
          'apartado = <b>' + e.apartado + '</b>',
          'aciertos = <b>' + marc.aciertos + '</b>',
          'fallos = <b>' + marc.fallos + '</b>',
          'racha = <b>' + marc.racha + '</b>'
        ]);
        return h;
      }, EJEMPLO));
  };

  /* ==================================================================
     9 · Autoevaluación del tema (15 cuestiones, una por apartado)
     ================================================================== */
  var APS = [
    { ap: '2.1', t: 'Qu\u00E9 es un determinante' },
    { ap: '2.2', t: 'Determinantes de orden 2' },
    { ap: '2.3', t: 'Determinantes de orden 3: Sarrus' },
    { ap: '2.4', t: 'Propiedades de los determinantes' },
    { ap: '2.5', t: 'Menor complementario' },
    { ap: '2.6', t: 'Adjunto de un elemento' },
    { ap: '2.7', t: 'Desarrollo por los adjuntos de una l\u00EDnea' },
    { ap: '2.8', t: 'Determinantes de orden superior' },
    { ap: '2.9', t: 'El m\u00E9todo de hacer ceros' },
    { ap: '2.10', t: 'Menores de una matriz' },
    { ap: '2.11', t: 'Rango de una matriz' },
    { ap: '2.12', t: 'Rango por menores orlados' },
    { ap: '2.13', t: 'Determinantes con par\u00E1metro' },
    { ap: '2.14', t: 'Matriz de los adjuntos' },
    { ap: '2.15', t: 'Inversa por determinantes' }
  ];
  var LETRAS = ['a', 'b', 'c', 'd'];

  /* Baraja una lista de opciones con la semilla dada y devuelve
     { opciones, correcta } con la posición final de la correcta. */
  function baraja(rnd, opciones, iCorrecta) {
    var idx = opciones.map(function (_, i) { return i; }), i, j, t;
    for (i = idx.length - 1; i > 0; i--) {
      j = dado(rnd, 0, i);
      t = idx[i]; idx[i] = idx[j]; idx[j] = t;
    }
    return {
      opciones: idx.map(function (k) { return opciones[k]; }),
      correcta: idx.indexOf(iCorrecta)
    };
  }

  /* Cuestión número q (1..15) de la serie con la semilla dada. */
  function generaCuestion(q, semilla) {
    q = Math.max(1, Math.min(15, Math.round(Number(q) || 1)));
    var rnd = mulberry32((Number(semilla) || 1) * 15485863 + q * 32452843);
    var meta = APS[q - 1];
    var c = { n: q, apartado: meta.ap, tema: meta.t };
    var A, i, j, b;

    if (q === 1) {
      c.tipo = 'opcion';
      c.enunciado = '\u00BFA qu\u00E9 matrices se les puede calcular el determinante?';
      b = baraja(rnd, [
        'Solo a las matrices <b>cuadradas</b>.',
        'A cualquier matriz, sea cual sea su dimensi\u00F3n.',
        'Solo a las matrices de orden 2 y 3.',
        'Solo a las matrices que tienen inversa.'
      ], 0);
      c.opciones = b.opciones; c.correcta = b.correcta;
      c.explicacion = 'El determinante es un n\u00FAmero asociado a una matriz <b>cuadrada</b>: hacen ' +
        'falta tantas filas como columnas. Una matriz 2\u00D73 no tiene determinante (aunque s\u00ED ' +
        'tiene menores y rango). Y las matrices singulares tambi\u00E9n tienen determinante: vale 0.';
      c.chk = { clase: 'opcion' };
    } else if (q === 2) {
      c.tipo = 'num';
      A = matNums(rnd, 2, 2, -5, 5);
      c.A = A;
      c.enunciado = 'Calcula este determinante de orden 2.';
      c.tex = alg().detTex(A);
      c.sol = alg().det(A);
      c.chk = { clase: 'det', A: A };
      c.explicacion = 'En el orden 2, ' + K('|A| = a_{11}a_{22} - a_{12}a_{21}') + ': producto de la ' +
        'diagonal principal menos producto de la secundaria. Aqu\u00ED sale ' + FT(alg().det(A)) + '.';
    } else if (q === 3) {
      c.tipo = 'num';
      A = matNums(rnd, 3, 3, -4, 4);
      c.A = A;
      c.enunciado = 'Calcula este determinante de orden 3 con la regla de Sarrus.';
      c.tex = alg().detTex(A);
      c.sol = alg().det(A);
      c.chk = { clase: 'det', A: A };
      c.explicacion = 'Sarrus: los tres productos de la diagonal principal y sus paralelas suman con ' +
        '<b>+</b>, y los tres de la secundaria con <b>\u2212</b>. Ojo: Sarrus vale <b>solo</b> para el ' +
        'orden 3.';
    } else if (q === 4) {
      c.tipo = 'opcion';
      c.enunciado = 'Una matriz cuadrada tiene dos filas <b>proporcionales</b>. \u00BFCu\u00E1nto vale ' +
        'su determinante?';
      b = baraja(rnd, [
        'Vale ' + K('0') + ', sin necesidad de calcular nada.',
        'Vale el producto de las dos filas.',
        'Depende del orden de la matriz.',
        'No se puede saber sin desarrollarlo.'
      ], 0);
      c.opciones = b.opciones; c.correcta = b.correcta;
      c.explicacion = 'Si una l\u00EDnea es m\u00FAltiplo de otra, se puede sacar el factor fuera y ' +
        'quedan dos l\u00EDneas <b>iguales</b>: el determinante es ' + K('0') + '. Es una de las ' +
        'propiedades que ahorran m\u00E1s tiempo en el examen.';
      c.chk = { clase: 'opcion' };
    } else if (q === 5) {
      c.tipo = 'num';
      A = matNums(rnd, 3, 3, -4, 4);
      i = dado(rnd, 0, 2); j = dado(rnd, 0, 2);
      c.A = A; c.i = i; c.j = j;
      c.enunciado = 'Calcula el <b>menor complementario</b> ' + K(texMen(i, j)) + ', el que se obtiene ' +
        'al tachar la fila ' + (i + 1) + ' y la columna ' + (j + 1) + '. (Sin signo: el menor, no el ' +
        'adjunto.)';
      c.tex = 'A = ' + alg().matTex(A, { marca: [[i, j]] });
      c.sol = alg().menorComp(A, i, j);
      c.chk = { clase: 'menor', A: A, i: i, j: j };
      c.explicacion = 'El menor complementario es el determinante de lo que <b>queda</b> al tachar la ' +
        'fila y la columna del elemento; el signo del tablero se a\u00F1ade despu\u00E9s, y eso ya es ' +
        'el <b>adjunto</b>.';
    } else if (q === 6) {
      c.tipo = 'num';
      A = matNums(rnd, 3, 3, -4, 4);
      i = dado(rnd, 0, 2); j = dado(rnd, 0, 2);
      c.A = A; c.i = i; c.j = j;
      c.enunciado = 'Calcula el <b>adjunto</b> ' + K(texAdj(i, j)) + ' (fila ' + (i + 1) +
        ', columna ' + (j + 1) + '). Esta vez s\u00ED lleva signo.';
      c.tex = 'A = ' + alg().matTex(A, { marca: [[i, j]] });
      c.sol = alg().adjunto(A, i, j);
      c.chk = { clase: 'adjunto', A: A, i: i, j: j };
      c.explicacion = 'El adjunto es ' + K('A_{ij} = (-1)^{i+j}\\alpha_{ij}') + '. Aqu\u00ED ' +
        K('(-1)^{' + (i + 1) + '+' + (j + 1) + '} = ' + (alg().signoAdj(i, j) > 0 ? '+1' : '-1')) +
        ', as\u00ED que el adjunto vale ' + FT(alg().adjunto(A, i, j)) + '.';
    } else if (q === 7) {
      c.tipo = 'opcion';
      c.enunciado = '\u00BFCu\u00E1nto vale la suma de los elementos de la <b>primera fila</b> ' +
        'multiplicados por los adjuntos de la <b>segunda fila</b>?';
      b = baraja(rnd, [
        'Vale ' + K('0') + ' siempre.',
        'Vale ' + K('|A|') + ' siempre.',
        'Vale ' + K('|A|') + ' si la matriz es regular.',
        'Vale la suma de los adjuntos de la segunda fila.'
      ], 0);
      c.opciones = b.opciones; c.correcta = b.correcta;
      c.explicacion = 'Multiplicar una l\u00EDnea por los adjuntos de <b>otra</b> l\u00EDnea da ' +
        'siempre ' + K('0') + ': equivale a desarrollar el determinante de una matriz con dos filas ' +
        'iguales. Solo cuando se usan los adjuntos de la <b>propia</b> fila sale ' + K('|A|') + '. ' +
        'Es justo lo que hace que ' + K('A\\cdot\\operatorname{Adj}(A)^{t}') + ' sea una matriz escalar.';
      c.chk = { clase: 'opcion' };
    } else if (q === 8) {
      c.tipo = 'num';
      A = matNums(rnd, 4, 4, -3, 3);
      A.a[0][1] = F0(); A.a[0][2] = F0();
      A.a[0][0] = new Frac(dadoNoCero(rnd, 1, 3));
      c.A = A;
      c.enunciado = 'Calcula este determinante de orden 4 desarrollando por la l\u00EDnea con m\u00E1s ceros.';
      c.tex = alg().detTex(A);
      c.sol = alg().det(A);
      c.chk = { clase: 'det', A: A };
      c.explicacion = 'A partir del orden 4 no hay Sarrus: se desarrolla por una l\u00EDnea (mejor la ' +
        'que tenga m\u00E1s ceros, porque esos sumandos desaparecen) o se hacen ceros primero.';
    } else if (q === 9) {
      c.tipo = 'opcion';
      c.enunciado = 'En el m\u00E9todo de hacer ceros, \u00BFqu\u00E9 transformaci\u00F3n <b>no cambia</b> ' +
        'el valor del determinante?';
      b = baraja(rnd, [
        'Sumar a una fila un m\u00FAltiplo de otra fila.',
        'Intercambiar dos filas.',
        'Multiplicar una fila por ' + K('3') + '.',
        'Dividir una fila entre ' + K('2') + '.'
      ], 0);
      c.opciones = b.opciones; c.correcta = b.correcta;
      c.explicacion = 'Sumar a una l\u00EDnea una combinaci\u00F3n lineal de otras deja el determinante ' +
        '<b>igual</b>: es la transformaci\u00F3n que se usa para hacer ceros. Intercambiar dos filas ' +
        'le cambia el <b>signo</b>, y multiplicar una fila por ' + K('t') + ' lo multiplica por ' +
        K('t') + '.';
      c.chk = { clase: 'opcion' };
    } else if (q === 10) {
      c.tipo = 'num';
      var f10 = dado(rnd, 3, 4), c10 = dado(rnd, 3, 4), h10 = 2;
      c.f = f10; c.c = c10; c.h = h10;
      c.enunciado = '\u00BFCu\u00E1ntos menores de orden ' + h10 + ' tiene una matriz de ' + f10 +
        '\u00D7' + c10 + '? (Escribe el n\u00FAmero.)';
      c.tex = '\\text{matriz de } ' + f10 + '\\times' + c10;
      c.sol = new Frac(alg().cuentaMenores(f10, c10, h10));
      c.chk = { clase: 'cuenta', f: f10, c: c10, h: h10 };
      c.explicacion = 'Hay que elegir ' + h10 + ' filas de entre ' + f10 + ' y ' + h10 +
        ' columnas de entre ' + c10 + ': ' + K('\\binom{' + f10 + '}{' + h10 + '}\\cdot\\binom{' +
        c10 + '}{' + h10 + '} = ' + alg().cuentaMenores(f10, c10, h10)) + ' menores.';
    } else if (q === 11) {
      c.tipo = 'num';
      A = matNums(rnd, 3, 3, -3, 3);
      if (rnd() < 0.5) {
        var lam11 = new Frac(dadoNoCero(rnd, -2, 2)), q11;
        for (q11 = 0; q11 < 3; q11++) A.a[2][q11] = A.a[0][q11].por(lam11);
      }
      c.A = A;
      c.enunciado = 'Calcula el <b>rango</b> de esta matriz.';
      c.tex = alg().matTex(A);
      c.sol = new Frac(alg().rango(A));
      c.chk = { clase: 'rango', A: A };
      c.explicacion = 'El rango es el orden del mayor menor no nulo. Si el determinante de orden 3 se ' +
        'anula, se baja a los menores de orden 2; si alguno no se anula, el rango es 2.';
    } else if (q === 12) {
      c.tipo = 'opcion';
      c.enunciado = 'Est\u00E1s calculando el rango por menores orlados y encuentras un menor de orden ' +
        '2 no nulo, pero <b>todos</b> sus orlados de orden 3 se anulan. \u00BFQu\u00E9 conclusi\u00F3n ' +
        'sacas?';
      b = baraja(rnd, [
        'El rango es exactamente 2.',
        'El rango es 3.',
        'Hay que probar con otro menor de orden 2.',
        'No se puede concluir nada.'
      ], 0);
      c.opciones = b.opciones; c.correcta = b.correcta;
      c.explicacion = 'Ese es justo el criterio de los orlados: si un menor de orden ' + K('h') +
        ' no es nulo y <b>todos</b> los menores de orden ' + K('h+1') + ' que lo contienen se anulan, ' +
        'el rango es ' + K('h') + '. No hace falta mirar los dem\u00E1s menores.';
      c.chk = { clase: 'opcion' };
    } else if (q === 13) {
      c.tipo = 'num';
      var a13 = dadoNoCero(rnd, 1, 3);
      /* |A| = a13·k + b13, con raíz entera porque b13 es múltiplo de a13 */
      var b13 = a13 * dado(rnd, -3, 3);
      c.enunciado = '\u00BFPara qu\u00E9 valor de ' + K('k') + ' <b>no</b> existe la inversa de una ' +
        'matriz cuyo determinante vale ' + K((a13 === 1 ? 'k' : a13 + 'k') +
        (b13 >= 0 ? '+' + b13 : b13)) + '? (Escribe el valor de ' + K('k') + '.)';
      c.tex = '|A| = ' + (a13 === 1 ? 'k' : a13 + 'k') + (b13 >= 0 ? '+' + b13 : b13);
      c.sol = new Frac(-b13, a13);
      c.chk = { clase: 'raiz', a: a13, b: b13 };
      c.explicacion = 'No hay inversa exactamente cuando ' + K('|A| = 0') + '. Resolviendo ' +
        K((a13 === 1 ? 'k' : a13 + 'k') + (b13 >= 0 ? '+' + b13 : b13) + ' = 0') + ' sale ' +
        K('k = ' + FT(new Frac(-b13, a13))) + '. Para cualquier otro valor la matriz s\u00ED es regular.';
    } else if (q === 14) {
      c.tipo = 'num';
      A = matNums(rnd, 3, 3, -3, 3);
      i = dado(rnd, 0, 2); j = dado(rnd, 0, 2);
      c.A = A; c.i = i; c.j = j;
      c.enunciado = 'De la <b>matriz de los adjuntos</b> ' + K('\\operatorname{Adj}(A)') + ', ' +
        '\u00BFqu\u00E9 n\u00FAmero ocupa la fila ' + (i + 1) + ' y la columna ' + (j + 1) + '?';
      c.tex = 'A = ' + alg().matTex(A);
      c.sol = alg().matAdjuntos(A).a[i][j];
      c.chk = { clase: 'adjM', A: A, i: i, j: j };
      c.explicacion = 'En el lugar (' + (i + 1) + ', ' + (j + 1) + ') de ' +
        K('\\operatorname{Adj}(A)') + ' va el adjunto ' + K(texAdj(i, j)) + ' del elemento que ocupa ' +
        'ese mismo lugar en ' + K('A') + '. Solo al <b>transponer</b> cambian de sitio.';
    } else {
      c.tipo = 'num';
      A = matRegular(rnd, 2, -4, 4);
      i = dado(rnd, 0, 1); j = dado(rnd, 0, 1);
      c.A = A; c.i = i; c.j = j;
      c.enunciado = 'Calcula ' + K('A^{-1}') + ' por determinantes y escribe el elemento de la fila ' +
        (i + 1) + ' y la columna ' + (j + 1) + '. Da la <b>fracci\u00F3n exacta</b>.';
      c.tex = 'A = ' + alg().matTex(A);
      c.sol = alg().inversaDet(A).inv.a[i][j];
      c.chk = { clase: 'inversa', A: A, i: i, j: j };
      c.explicacion = 'Con ' + K('A^{-1} = \\dfrac{1}{|A|}\\operatorname{Adj}(A)^{t}') + ' sale ' +
        K('A^{-1} = ' + alg().matTex(alg().inversaDet(A).inv)) + ', cuyo elemento (' + (i + 1) + ', ' +
        (j + 1) + ') es ' + K(FT(alg().inversaDet(A).inv.a[i][j])) + '. Las fracciones se dejan ' +
        'exactas: un decimal redondeado no cumple ' + K('A\\cdot A^{-1} = I') + '.';
    }
    if (c.tipo === 'num') { c.solTxt = numTxt(c.sol); c.solTex = FT(c.sol); }
    else { c.solTxt = LETRAS[c.correcta] + ') ' + c.opciones[c.correcta]; }
    return c;
  }

  /* Corrige una respuesta (texto libre) contra la cuestión. */
  function corrigeQ(c, texto) {
    var s = String(texto === undefined || texto === null ? '' : texto).trim().toLowerCase();
    if (s === '') return null;
    if (c.tipo === 'opcion') {
      var k = LETRAS.indexOf(s.charAt(0));
      if (k < 0 || k >= c.opciones.length) return null;
      return k === c.correcta;
    }
    var r = leeNumero(s);
    if (r === null) return null;
    return igF(r, c.sol);
  }

  /* Regla de Sarrus, reescrita.  El .tex que devuelve el núcleo une
     los VALORES de los seis productos con ' + ' a secas y saca cosas
     como «( 45 + 5 + − 40 )», además de poner paréntesis al sustraendo
     aunque sea positivo («− 89 − ( 95 )»). Es el defecto grave de seis
     estados del entrenador. Se conserva la primera línea —los
     productos, que ya vienen con sus paréntesis— y se rehacen las dos
     siguientes con S.sumandosTex y S.parNegTex, los helpers únicos del
     núcleo: todo sumando negativo va entre paréntesis, «45 + 5 + (−40)».
     Se hace aquí, en el módulo, para no tocar el núcleo compartido. */
  function sarrusTex(sr) {
    var l1 = String(sr.tex).split('\\\\')[0];
    var vp = sr.positivos.map(function (t) { return FT(t.valor); });
    var vn = sr.negativos.map(function (t) { return FT(t.valor); });
    return l1 + '\\\\' +
      '&= \\left(' + S.sumandosTex(vp) + '\\right) - \\left(' + S.sumandosTex(vn) + '\\right) \\\\' +
      '&= ' + FT(sr.sumaPositivos) + ' - ' + S.parNegTex(FT(sr.sumaNegativos)) +
      ' = ' + FT(sr.total) + '\\end{aligned}';
  }

  /* Cola del único aviso de instrucciones de la autoevaluación. */
  var AE_CORRIGE = 'Cuando las tengas las quince, pulsa <b>Corregir todo</b>: hasta entonces ' +
    'no se muestra ninguna correcci\u00F3n, que esto es un test y no un entrenador.';

  R.autoevaluacion = function (node) {
    return S.shell(node, 'Autoevaluaci\u00F3n del tema',
      'Quince cuestiones, una por cada apartado del tema, en el mismo orden que los apartados. Unas ' +
      'son de <b>opci\u00F3n m\u00FAltiple</b> (contesta con la letra: <code>a</code>, <code>b</code>, ' +
      '<code>c</code> o <code>d</code>) y otras de <b>respuesta num\u00E9rica</b> (contesta con un ' +
      'n\u00FAmero: <code>-3</code>, <code>0,5</code> o <code>-1/3</code>, siempre en fracci\u00F3n ' +
      'exacta). Pulsa <b>Guardar respuesta</b> en cada una, mu\u00E9vete con <b>Siguiente</b> y ' +
      '<b>Anterior</b>, y cuando las tengas todas pulsa <b>Corregir todo</b>: ah\u00ED aparece la ' +
      'puntuaci\u00F3n y, para cada fallo, la explicaci\u00F3n y el apartado que hay que repasar.',
      [
        { id: 'semilla', label: 'Semilla del test', type: 'number', min: 1, max: 999, value: 1, ancho: '9rem' },
        { id: 'n', label: 'Cuesti\u00F3n n\u00BA (1 a 15)', type: 'number', min: 1, max: 15, value: 1, ancho: '11rem' },
        { id: 'resp', label: 'Tu respuesta', type: 'text', value: '', ancho: '11rem', place: 'a   o   -1/3' },
        {
          id: 'guarda', label: 'Guardar respuesta', type: 'button',
          click: function (c, api) {
            if (!c._resAE) c._resAE = {};
            c._resAE[ent(c.n.value, 1, 15, 1)] = String(c.resp.value || '');
            if (api && api.run) api.run();
          }
        },
        {
          id: 'siguiente', label: 'Guardar y siguiente', type: 'button',
          click: function (c, api) {
            if (!c._resAE) c._resAE = {};
            var k = ent(c.n.value, 1, 15, 1);
            c._resAE[k] = String(c.resp.value || '');
            c.n.value = String(Math.min(15, k + 1));
            c.resp.value = c._resAE[ent(c.n.value, 1, 15, 1)] || '';
            if (api && api.run) api.run();
          }
        },
        {
          id: 'anterior', label: 'Anterior', type: 'button',
          click: function (c, api) {
            var k = ent(c.n.value, 1, 15, 1);
            c.n.value = String(Math.max(1, k - 1));
            c.resp.value = (c._resAE && c._resAE[ent(c.n.value, 1, 15, 1)]) || '';
            if (api && api.run) api.run();
          }
        },
        {
          id: 'corrige', label: 'Corregir todo', type: 'button',
          click: function (c, api) {
            if (!c._resAE) c._resAE = {};
            c._resAE[ent(c.n.value, 1, 15, 1)] = String(c.resp.value || '');
            c._verAE = true;
            if (api && api.run) api.run();
          }
        },
        {
          id: 'reinicia', label: 'Empezar de nuevo', type: 'button',
          click: function (c, api) {
            c._resAE = {}; c._verAE = false; c.n.value = '1'; c.resp.value = '';
            if (api && api.run) api.run();
          }
        },
        chips([
          { txt: 'Test 1 · desde el principio', tip: 'la serie por omisión', set: { semilla: 1, n: 1, resp: '' } },
          { txt: 'Test 2', tip: 'otras quince cuestiones', set: { semilla: 2, n: 1, resp: '' } },
          { txt: 'Test 3', tip: 'una tercera serie', set: { semilla: 3, n: 1, resp: '' } },
          { txt: 'Ir a la cuesti\u00F3n 5', tip: 'menor complementario', set: { semilla: 1, n: 5, resp: '' } },
          { txt: 'Ir a la cuesti\u00F3n 8', tip: 'determinante de orden 4', set: { semilla: 1, n: 8, resp: '' } },
          { txt: 'Ir a la cuesti\u00F3n 12', tip: 'menores orlados', set: { semilla: 1, n: 12, resp: '' } },
          { txt: 'Ir a la cuesti\u00F3n 15', tip: 'inversa por determinantes', set: { semilla: 1, n: 15, resp: '' } }
        ])
      ],
      safe(function (v, ctl) {
        var semilla = ent(v.semilla, 1, 999, 1);
        var idx = ent(v.n, 1, 15, 1);
        var res = (ctl && ctl._resAE) || {};
        if (ctl && !ctl._resAE) ctl._resAE = res;
        /* la respuesta que se ve en la casilla cuenta para la cuestión actual */
        var vivo = {}, kk;
        for (kk in res) if (Object.prototype.hasOwnProperty.call(res, kk)) vivo[kk] = res[kk];
        if (String(v.resp || '').trim() !== '') vivo[idx] = String(v.resp);

        var c = generaCuestion(idx, semilla);
        var h = '';
        h += titulo('Cuesti\u00F3n ' + idx + ' de 15 \u00B7 apartado ' + c.apartado + ' \u00B7 ' + c.tema);
        h += parrafo(c.enunciado);
        if (c.tex) h += caja('Datos', c.tex);
        if (c.tipo === 'opcion') {
          var lista = '<div class="detf-opciones detd-opciones">';
          c.opciones.forEach(function (o, k) {
            lista += '<div class="detf-opcion detd-opcion"><b>' + LETRAS[k] + ')</b> ' + o + '</div>';
          });
          h += lista + '</div>';
          /* Un solo aviso con TODA la instrucción: antes había dos cajas
             naranjas a la vez y no se sabía cuál era la acción
             (auditoría: autoevaluacion D1).                          */
          h += aviso('Contesta con la <b>letra</b> de la opci\u00F3n (<code>a</code>, <code>b</code>, ' +
            '<code>c</code> o <code>d</code>) y pulsa <b>Guardar respuesta</b>. ' + AE_CORRIGE);
        } else {
          h += aviso('Contesta con un <b>n\u00FAmero</b>: <code>-3</code>, <code>0,5</code> o ' +
            '<code>-1/3</code>. Las fracciones, exactas. Pulsa <b>Guardar respuesta</b>. ' + AE_CORRIGE);
        }
        var guardada = vivo[idx];
        if (guardada !== undefined && String(guardada).trim() !== '') {
          h += pista('Respuesta guardada para esta cuesti\u00F3n: <b>' + S.esc(String(guardada)) +
            '</b>. Puedes cambiarla y volver a guardar.');
        } else {
          h += pista('Todav\u00EDa no has guardado ninguna respuesta para esta cuesti\u00F3n.');
        }

        /* estado de las quince */
        var estado = [], k2, cq, ok, contestadas = 0;
        for (k2 = 1; k2 <= 15; k2++) {
          cq = generaCuestion(k2, semilla);
          ok = corrigeQ(cq, vivo[k2]);
          if (ok !== null) contestadas++;
          estado.push(ok);
        }
        h += parrafo('Llevas <b>' + contestadas + '</b> de <b>15</b> cuestiones contestadas.');

        if (!ctl || !ctl._verAE) {
          h += S.kvs([
            'cuesti\u00F3n = <b>' + idx + ' de 15</b>',
            'apartado = <b>' + c.apartado + '</b>',
            'tipo = <b>' + (c.tipo === 'opcion' ? 'opci\u00F3n m\u00FAltiple' : 'respuesta num\u00E9rica') + '</b>',
            'contestadas = <b>' + contestadas + '</b>',
            'semilla = <b>' + semilla + '</b>'
          ]);
          return h;
        }

        /* ---- corrección final ---- */
        var aciertos = 0;
        estado.forEach(function (x) { if (x === true) aciertos++; });
        h += titulo('Correcci\u00F3n y puntuaci\u00F3n');
        h += figPuntuacion(estado);
        var nota = Math.round(1000 * aciertos / 15) / 100;
        h += S.resultado(K('\\text{' + aciertos + ' de 15}') + ' \u00B7 nota ' + S.etq(nota, 2),
          'resultado de la autoevaluaci\u00F3n');
        if (aciertos === 15) {
          h += bien('<b>Quince de quince.</b> Tienes el tema por la mano: determinantes, rango, ' +
            'adjuntos e inversa.');
        } else if (aciertos * 2 >= 15) {
          h += bien('<b>Aprobado</b>, pero mira abajo los fallos: cada uno te dice qu\u00E9 apartado ' +
            'conviene repasar.');
        } else {
          h += mal('<b>Toca repasar.</b> Abajo tienes, cuesti\u00F3n a cuesti\u00F3n, qu\u00E9 ' +
            'fallaste y por qu\u00E9.');
        }

        var filasR = [];
        for (k2 = 1; k2 <= 15; k2++) {
          cq = generaCuestion(k2, semilla);
          ok = estado[k2 - 1];
          filasR.push([
            String(k2),
            cq.apartado + ' \u00B7 ' + cq.tema,
            ok === null ? '<i>sin contestar</i>' : S.esc(String(vivo[k2])),
            cq.solTxt,
            ok === true ? '<b class="ap-ok">bien</b>' : (ok === false ? '<b class="ap-ko">mal</b>' : '<b>\u2013</b>')
          ]);
        }
        h += S.tabla(['N\u00BA', 'Apartado', 'Tu respuesta', 'Respuesta correcta', 'Resultado'], filasR);

        var hayFallos = false;
        for (k2 = 1; k2 <= 15; k2++) {
          ok = estado[k2 - 1];
          if (ok === true) continue;
          hayFallos = true;
          cq = generaCuestion(k2, semilla);
          h += titulo('Cuesti\u00F3n ' + k2 + (ok === null ? ' \u00B7 sin contestar' : ' \u00B7 fallo'));
          h += parrafo(cq.enunciado);
          if (cq.tex) h += caja('Datos', cq.tex);
          h += parrafo('<b>Respuesta correcta:</b> ' + cq.solTxt);
          h += parrafo('<b>Por qu\u00E9:</b> ' + cq.explicacion);
          h += ref('Repasa el <b>apartado ' + cq.apartado + '</b>: ' + cq.tema + '.');
          if (cq.chk && cq.chk.clase === 'inversa') {
            h += parrafo('Te puede ayudar el applet <b>Inversa por determinantes, paso a paso</b>.');
          } else if (cq.chk && (cq.chk.clase === 'adjunto' || cq.chk.clase === 'adjM' || cq.chk.clase === 'menor')) {
            h += parrafo('Te puede ayudar el applet <b>Construcci\u00F3n de la matriz de los adjuntos</b>.');
          }
        }
        if (!hayFallos) {
          h += bien('No hay ning\u00FAn fallo que explicar. Prueba con otra semilla para un test nuevo.');
        }
        h += S.kvs([
          'aciertos = <b>' + aciertos + ' de 15</b>',
          'nota = <b>' + S.etq(nota, 2) + '</b>',
          'contestadas = <b>' + contestadas + '</b>',
          'sin contestar = <b>' + (15 - contestadas) + '</b>',
          'semilla = <b>' + semilla + '</b>'
        ]);
        return h;
      }, EJEMPLO));
  };

  /* ==================================================================
     Gancho de pruebas: permite a los tests generar ejercicios y
     cuestiones y comprobar la solución declarada contra el motor.
     ================================================================== */
  S.fTest = {
    ejercicio: generaEjercicio,
    cuestion: generaCuestion,
    corrige: corrigeQ,
    modelo: respuestaModelo,
    tipos: TIPOS.map(function (t) { return t.id; }),
    dificultades: ['facil', 'media', 'dificil'],
    apartados: APS.map(function (a) { return a.ap; }),
    azar: mulberry32
  };

  window.DET.extraF = true;
  if (S.monta) S.monta();
})();
