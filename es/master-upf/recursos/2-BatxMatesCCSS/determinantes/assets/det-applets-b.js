/* =====================================================================
   det-applets-b.js · Módulo B del Tema 2 «Determinantes»
   2.º de Bachillerato · Matemáticas Aplicadas a las Ciencias Sociales
   Ruta: 2-BatxMatesCCSS/determinantes/assets/det-applets-b.js

   Cubre los archivos 03 y 04 del tema:

     03  Propiedades de los determinantes
     04  Cálculo de un determinante usando sus propiedades

   ---------------------------------------------------------------------
   ÍNDICE DEL MÓDULO · los 7 applets que registra
   ---------------------------------------------------------------------

     propiedades       Laboratorio de propiedades. Se parte de una matriz
                       cuadrada y se le aplican transformaciones con
                       botones (intercambiar dos líneas, multiplicar una
                       línea por k, sumar a una línea otra multiplicada
                       por k, transponer, sustituir una línea por una
                       combinación lineal de las demás). El applet muestra
                       lado a lado la matriz de partida y la transformada,
                       sus dos determinantes, y enuncia qué propiedad se
                       ha usado y cómo ha quedado afectado el
                       determinante: igual, cambiado de signo,
                       multiplicado por k o anulado.

     triangular        Determinante de una matriz triangular o diagonal.
                       Detecta si la matriz es triangular superior,
                       inferior, diagonal, escalar o la identidad, resalta
                       la diagonal principal y muestra que el determinante
                       es el producto de la diagonal. Puede triangular una
                       matriz cualquiera paso a paso comprobando que el
                       determinante no cambia.

     productoDet       La propiedad |A·B| = |A|·|B| con dos matrices
                       cuadradas del mismo orden, y el contraejemplo
                       |A + B| ≠ |A| + |B| con la suma calculada al lado.

     sumaNoSuma        Descomposición de una línea en suma de dos
                       sumandos: el determinante se parte en la suma de
                       dos determinantes. Los tres determinantes se
                       dibujan en fila con los signos + y = y se comprueba
                       la igualdad numéricamente, contrastándola con
                       |A + B| ≠ |A| + |B|.

     factorComun       Sacar factor común de una línea. Detecta el mayor
                       factor común de cada fila y de cada columna y lo
                       extrae, encadenando varias extracciones hasta
                       dejar el determinante lo más simple posible.

     atajos            Detector de atajos. Con DET.detPropiedades dice
                       ANTES de calcular qué se puede aprovechar (línea de
                       ceros, líneas iguales o proporcionales, combinación
                       lineal, matriz triangular, factores comunes, líneas
                       con ceros), propone la estrategia más económica y
                       la ejecuta. Si no hay atajo, lo dice y calcula por
                       el método general.

     retoPropiedades   Reto autocorregido: un determinante que sale sin
                       desarrollar. El alumno escribe su valor, el applet
                       corrige y, si falla, muestra la cadena de
                       propiedades que llevaba a la solución. Botón de
                       nuevo reto y contador de aciertos.

   ---------------------------------------------------------------------
   Dependencias
   ---------------------------------------------------------------------
   Necesita el núcleo `det-applets.js` (window.DET), la capa matricial
   `det-applets-alg.js` y la capa del tema `det-applets-det.js`, que se
   cargan antes. No se reimplementa nada de álgebra: se usan

     parseMat, matDe, matTxt, matTex, matTrans, matProd, matSuma, det,
     rango, matAleatoria, dimTxt, esTriangularSup, esTriangularInf,
     esDiagonal, esEscalar, esIdentidad, fracDe, fracTex,
     detPropiedades, detTex, desarrollo, mejorLinea, sarrus, hacerCeros,
     numTxtDet, parTxtDet.

   Del núcleo: shell, registry, K, KD, esc, tabla, badge, kvs, paso,
   resultado, svgWrap, altoDibujado, txt, line, rect, path, poly, COL,
   Frac.

   ---------------------------------------------------------------------
   Criterios didácticos y técnicos
   ---------------------------------------------------------------------
   1. Aritmética EXACTA con Frac (BigInt): ningún resultado se calcula en
      coma flotante. Los píxeles son lo único que usa números decimales.
   2. Figuras GRANDES: ningún SVG baja de 760 unidades de ancho, las
      celdas van a 22 px y los rótulos a 16 px o más, en negrita. El alto
      se mide con S.altoDibujado, así que nunca sobra lienzo vacío.
   3. Dentro de un <text> de SVG NUNCA se escribe LaTeX: solo texto llano
      con Unicode (F₂, C₃, ·, ×, −, ≠, ↔, →). El LaTeX vive fuera de la
      figura.
   4. Convención española: coma decimal, {,} dentro de KaTeX y menos
      tipográfico U+2212 en los rótulos. Nunca «+ −3», siempre «+ (−3)».
   5. Índices mostrados al alumno en BASE 1; los índices internos de la
      capa van en base 0 y se traducen al escribir.
   6. Ninguna entrada mala rompe un applet: todo pasa por `safe`, que
      convierte cualquier Error en un aviso en castellano. Los avisos no
      se acumulan entre recálculos.

   Clases CSS propias: prefijo `detb-`, ya presentes en det-applets.css.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.DET;
  if (!S) {
    if (window.console && console.error) {
      console.error('[determinantes] det-applets-b.js necesita det-applets.js cargado antes.');
    }
    return;
  }

  var R = S.registry;
  var K = S.K, KD = S.KD, COL = S.COL;
  var Frac = S.Frac;

  /* ==================================================================
     0 · utilidades locales del módulo
     ================================================================== */

  /* Acceso perezoso a las dos capas previas: si falta alguna, el mensaje
     que ve el alumno es claro y no hay ninguna excepción sin capturar. */
  function capa() {
    if (!S.parseMat || !S.det || !S.matProd) {
      throw Error('No se ha cargado la capa de álgebra matricial (det-applets-alg.js). ' +
        'Recarga la página; si el aviso persiste, avisa al profesor.');
    }
    if (!S.detPropiedades || !S.desarrollo || !S.numTxtDet) {
      throw Error('No se ha cargado la capa de determinantes (det-applets-det.js). ' +
        'Recarga la página; si el aviso persiste, avisa al profesor.');
    }
    return S;
  }

  function FR(v) { return capa().fracDe(v); }
  function F0() { return new Frac(0); }
  function F1() { return new Frac(1); }
  function cero(f) { return f.n === 0n; }
  function igF(a, b) { return a.cmp(b) === 0; }
  function FT(f) { return f.tex(true); }

  /* Número en TEXTO LLANO para los <text> del SVG: «−7», «−0,5», «1/3». */
  function nt(f) { return capa().numTxtDet(f); }
  /* El mismo número entre paréntesis si es negativo: «(−3)». */
  function pt(f) { return capa().parTxtDet(f); }

  /* Subíndices Unicode para los rótulos de las figuras: F₂, C₁₀. */
  var SUBS = '\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089';
  function sub(n) {
    return String(n).split('').map(function (d) {
      var q = Number(d);
      return (q >= 0 && q <= 9) ? SUBS.charAt(q) : d;
    }).join('');
  }
  /* Nombre de una línea en texto llano (F₂, C₃) y en LaTeX (F_{2}). */
  function lin(tipo, i1) { return (tipo === 'fila' ? 'F' : 'C') + sub(i1); }
  function linTex(tipo, i1) { return (tipo === 'fila' ? 'F' : 'C') + '_{' + i1 + '}'; }
  function nombreLinea(tipo, i1) { return (tipo === 'fila' ? 'fila ' : 'columna ') + i1; }

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

  /* Envoltorio: cualquier Error se convierte en un aviso amable y no
     llega a window.DET.log, porque el applet no ha «fallado»: es el
     alumno quien tiene que corregir lo que ha escrito. */
  function safe(fn) {
    return function (v, ctl, out, api) {
      try {
        var h = fn(v, ctl, out, api);
        return (h === undefined || h === null || h === '')
          ? '<div class="mx-bad detb-err">No hay nada que mostrar todavía: revisa los datos que has escrito.</div>'
          : h;
      } catch (e) {
        var m = (e && e.message) ? e.message : 'No he podido calcular con estos datos.';
        return '<div class="mx-bad detb-err">' + S.esc(m) + '</div>';
      }
    };
  }

  function parrafo(h) { return '<p class="detb-txt">' + h + '</p>'; }
  function titulillo(t) { return '<p class="detb-sub">' + t + '</p>'; }
  function pista(h) { return '<p class="detb-pista">' + h + '</p>'; }
  function caja(tit, tex) {
    return '<div class="detb-enunciado"><b>' + tit + '</b>' + KD(tex) + '</div>';
  }
  function bien(h) { return '<div class="detb-coment detb-ok">' + h + '</div>'; }
  function mal(h) { return '<div class="detb-coment detb-ko">' + h + '</div>'; }
  function propBox(tit, cuerpo) {
    return '<div class="detb-prop"><p class="detb-imposible-tit">' + tit + '</p>' + cuerpo + '</div>';
  }
  function avisos(lista) {
    if (!lista || !lista.length) return '';
    return '<ul class="detb-avisos"><li>' +
      lista.map(function (a) { return S.esc(a); }).join('</li><li>') + '</li></ul>';
  }

  /* ------------------------------------------------------------------
     Lectura de matrices escritas por el alumno.
     ------------------------------------------------------------------ */
  var EJEMPLO = 'Escribe la matriz <b>por filas</b>: las filas se separan con «;» (o con un salto de ' +
    'línea) y los elementos con espacios. Ejemplo copiable: <code>2 1 3; 0 4 1; 5 2 6</code>. ' +
    'Se admiten enteros (<code>3</code>), negativos (<code>-2</code>), decimales con coma ' +
    '(<code>0,5</code>) y fracciones (<code>3/4</code>).';

  /* ¿Es este trozo de texto un número admitido? (entero, decimal con coma
     —o con punto, que también se tolera— y fracción). */
  function esNumTxt(t) {
    var q = String(t === undefined || t === null ? '' : t).trim().replace(/^\+/, '');
    return /^[-\u2212]?(?:\d+(?:[.,]\d+)?|[.,]\d+)(?:\s*\/\s*[-\u2212]?\d+(?:[.,]\d+)?)?$/.test(q);
  }

  /* Trocea el texto igual que la capa (filas con «;» o saltos de línea,
     elementos con espacios) SOLO para poder avisar del tipo antes que de
     la cantidad: «hola» no es un elemento de la matriz. */
  function trozosDe(txt) {
    return String(txt).replace(/[−–—]/g, '-').split(/[;\n\r]+/)
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l !== ''; })
      .map(function (l) {
        var conEspacios = /[ \t]/.test(l);
        if (conEspacios) l = l.replace(/(\d)\s*,\s*(\d)/g, '$1.$2');
        return l.split(conEspacios ? /[\s,]+/ : /,+/).filter(function (t) { return t !== ''; });
      });
  }

  /* Comprueba el TIPO de cada elemento antes de contar cuántos hay: así el
     aviso dice que «hola» no es un número en vez de contarlo como si lo
     fuera. Y habla siempre de decimales con coma, como el enunciado. */
  function exigeNumeros(txt, nombre) {
    var filas = trozosDe(txt), malos = [], f, q;
    for (f = 0; f < filas.length; f++) {
      for (q = 0; q < filas[f].length; q++) {
        if (!esNumTxt(filas[f][q])) {
          malos.push('«' + filas[f][q] + '» (fila ' + (f + 1) + ')');
        }
      }
    }
    if (malos.length) {
      throw Error('En ' + nombre + ' hay ' + (malos.length === 1 ? 'un elemento' : malos.length +
        ' elementos') + ' que no ' + (malos.length === 1 ? 'es' : 'son') + ' un número: ' +
        malos.slice(0, 4).join(', ') + '. Cada elemento tiene que ser un entero (3), un negativo ' +
        '(-2), un decimal con coma (0,5) o una fracción (3/4). Ejemplo copiable: 2 1 3; 0 4 1; 5 2 6.');
    }
    /* Y solo después, la cantidad: filas del mismo largo. */
    var c = filas.length ? filas[0].length : 0;
    for (f = 1; f < filas.length; f++) {
      if (filas[f].length !== c) {
        throw Error('Todas las filas de ' + nombre + ' deben tener el mismo número de elementos: ' +
          'la fila 1 tiene ' + c + ' y la fila ' + (f + 1) + ' tiene ' + filas[f].length + '. ' +
          'Si en una posición no hay nada, escribe un 0. Ejemplo copiable: 2 1 3; 0 4 1; 5 2 6.');
      }
    }
  }

  function leeMat(txt, nombre, maxOrden) {
    nombre = nombre || 'la matriz';
    var s = String(txt === undefined || txt === null ? '' : txt).trim();
    if (s === '') {
      throw Error('Falta ' + nombre + '. Escribe la matriz por filas, separando las filas con «;» ' +
        'y los elementos con espacios, por ejemplo 2 1 3; 0 4 1; 5 2 6.');
    }
    exigeNumeros(s, nombre);
    var A = capa().parseMat(s);
    var lim = maxOrden || 5;
    if (A.f > lim || A.c > lim) {
      throw Error(nombre.charAt(0).toUpperCase() + nombre.slice(1) + ' es de ' + S.dimTxt(A) +
        ' y este applet trabaja hasta ' + lim + '\u00d7' + lim + ', para que la figura siga ' +
        'leyéndose bien. Prueba con una matriz más pequeña.');
    }
    return A;
  }

  function leeCuad(txt, nombre, maxOrden) {
    var A = leeMat(txt, nombre, maxOrden);
    if (A.f !== A.c) {
      throw Error(nombre.charAt(0).toUpperCase() + nombre.slice(1) + ' es de ' + S.dimTxt(A) +
        ' y no es cuadrada: solo las matrices cuadradas tienen determinante. ' +
        'Escribe la misma cantidad de filas que de columnas, por ejemplo 2 1 3; 0 4 1; 5 2 6.');
    }
    return A;
  }

  /* Índice de línea (base 1) escrito por el alumno. */
  function leeIndice(valor, n, cual) {
    var q = Number(valor);
    if (!isFinite(q) || q !== Math.round(q)) {
      throw Error('El número de ' + cual + ' debe ser un número entero. Las líneas se numeran ' +
        'desde 1 hasta ' + n + '.');
    }
    if (q < 1 || q > n) {
      throw Error('La ' + cual + ' que has elegido (' + q + ') no existe: esta matriz es de orden ' +
        n + ', así que sus líneas van de la 1 a la ' + n + '.');
    }
    return q - 1;
  }

  /* ------------------------------------------------------------------
     Operaciones sobre líneas (filas o columnas) de una matriz.
     Se construyen aquí porque la capa solo tiene operaciones de FILA,
     y el tema exige trabajar también por columnas.
     ------------------------------------------------------------------ */
  function lineaDe(A, tipo, i) {
    var v = [], q;
    if (tipo === 'fila') { for (q = 0; q < A.c; q++) v.push(A.a[i][q]); }
    else { for (q = 0; q < A.f; q++) v.push(A.a[q][i]); }
    return v;
  }
  function ponLinea(A, tipo, i, vals) {
    var B = A.copia(), q;
    if (tipo === 'fila') { for (q = 0; q < B.c; q++) B.a[i][q] = vals[q]; }
    else { for (q = 0; q < B.f; q++) B.a[q][i] = vals[q]; }
    return B;
  }
  function cambiaLineas(A, tipo, i, j) {
    var li = lineaDe(A, tipo, i), lj = lineaDe(A, tipo, j);
    return ponLinea(ponLinea(A, tipo, i, lj), tipo, j, li);
  }
  function porK(vals, k) { return vals.map(function (x) { return x.por(k); }); }
  function sumaV(u, w) { return u.map(function (x, q) { return x.mas(w[q]); }); }

  /* ==================================================================
     1 · dibujo de matrices y determinantes en SVG
     ================================================================== */
  var CEL = 22;            /* tipografía dentro de las celdas */
  var ROT = 18;            /* tipografía de los rótulos       */
  var FAM_OP = "'DejaVu Sans', 'Liberation Sans', Arial, Helvetica, sans-serif";

  function corchete(x, y, h, lado) {
    var w = 13;
    var d = (lado === 'izq')
      ? 'M ' + (x + w) + ' ' + y + ' L ' + x + ' ' + y + ' L ' + x + ' ' + (y + h) + ' L ' + (x + w) + ' ' + (y + h)
      : 'M ' + (x - w) + ' ' + y + ' L ' + x + ' ' + y + ' L ' + x + ' ' + (y + h) + ' L ' + (x - w) + ' ' + (y + h);
    return S.path(d, COL.eje, 3.4);
  }
  function barra(x, y, h) { return S.line(x, y, x, y + h, COL.eje, 3.4); }

  /* Rejilla de celdas con texto llano. txtFn(i, j) -> cadena.
     o = { cw, ch, size, fill(i,j), rotulo, rotuloCol, pie, sub(i,j), det } */
  function dibujaCeldas(x0, y0, f, c, txtFn, o) {
    o = o || {};
    var cw = o.cw || 88, ch = o.ch || 58, pad = 14;
    var W = c * cw + 2 * pad, H = f * ch + 2 * pad;
    var s = S.rect(x0, y0, W, H, o.fondo || '#ffffff', '#dde5ec', { r: 8, sw: 1.3 });
    var i, j;
    for (i = 0; i < f; i++) {
      for (j = 0; j < c; j++) {
        var cx = x0 + pad + j * cw, cy = y0 + pad + i * ch;
        var col = o.fill ? o.fill(i, j) : null;
        if (col) s += S.rect(cx + 3, cy + 3, cw - 6, ch - 6, col, 'none', { r: 7 });
        var sb = o.sub ? o.sub(i, j) : null;
        if (sb) {
          s += S.txt(cx + cw / 2, cy + ch / 2 - 2, txtFn(i, j), { size: o.size || CEL, weight: '700' });
          s += S.txt(cx + cw / 2, cy + ch / 2 + 23, sb, { size: 16, weight: '600', fill: COL.gris });
        } else {
          s += S.txt(cx + cw / 2, cy + ch / 2 + 8, txtFn(i, j), { size: o.size || CEL, weight: '700' });
        }
      }
    }
    if (o.det) {
      s += barra(x0 + 6, y0 + 3, H - 6);
      s += barra(x0 + W - 6, y0 + 3, H - 6);
    } else {
      s += corchete(x0 + 3, y0 + 3, H - 6, 'izq');
      s += corchete(x0 + W - 3, y0 + 3, H - 6, 'der');
    }
    if (o.rotulo) {
      s += S.txt(x0 + W / 2, y0 - 13, o.rotulo,
        { size: ROT, weight: '700', fill: o.rotuloCol || COL.azulOsc });
    }
    if (o.pie) {
      s += S.txt(x0 + W / 2, y0 + H + 30, o.pie,
        { size: 18, weight: '700', fill: o.pieCol || COL.gris });
    }
    return {
      svg: s, W: W, H: H, x: x0, y: y0, cw: cw, ch: ch, pad: pad,
      cx: function (jj) { return x0 + pad + jj * cw + cw / 2; },
      cy: function (ii) { return y0 + pad + ii * ch + ch / 2; },
      x1: x0 + W, y1: y0 + H
    };
  }

  function dibujaMat(x0, y0, A, o) {
    return dibujaCeldas(x0, y0, A.f, A.c, function (i, j) { return nt(A.a[i][j]); }, o);
  }

  /* Ancho de celda razonable según cuántas columnas hay que encajar. */
  function anchoCelda(colsTotales) {
    if (colsTotales <= 6) return 96;
    if (colsTotales <= 9) return 88;
    if (colsTotales <= 12) return 80;
    return 70;
  }

  function operador(x, y, s) {
    return S.txt(x, y + 10, s, { size: 34, weight: '700', fill: COL.eje, family: FAM_OP });
  }

  var MARGEN_ABAJO = 26;
  var MARGEN_LADO = 28;
  var ANCHO_MIN = 760;

  /* ------------------------------------------------------------------
     anchoRot(texto, size)

     Medida aproximada del ancho de un rótulo: 0,56 em por carácter, el
     mismo modelo que usan las comprobaciones del tema. Es la pieza que
     faltaba: antes los rótulos, los pies y las viñetas se centraban (o se
     anclaban a la derecha de una matriz) sin medirlos, así que se salían
     del viewBox y quedaban recortados.
     ------------------------------------------------------------------ */
  /* Anchura de cada carácter en «em» para la familia con la que se dibujan
     los rótulos (DejaVu Sans / Liberation Sans / Arial, en negrita), medida
     una sola vez en el navegador. Un carácter que no esté en la tabla se
     estima con ANCHO_CHAR_POR_DEFECTO. */
  var ANCHO_CHAR_POR_DEFECTO = 0.72;
  var ANCHO_CHAR = (function () {
    var pares = [
    [0.34, 'ijlí'],
    [0.35, ' '],
    [0.36, '/|'],
    [0.37, 'IJÍ'],
    [0.38, ',.\u00b7\u22c5'],
    [0.40, ':;'],
    [0.41, '-'],
    [0.43, 'f'],
    [0.44, '\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089'],
    [0.46, '!()[]¡'],
    [0.48, 't'],
    [0.49, 'r'],
    [0.50, '_°'],
    [0.52, '"*'],
    [0.56, 'ªº'],
    [0.58, '?z¿'],
    [0.59, 'cs'],
    [0.64, 'L\u2022'],
    [0.65, 'vxy'],
    [0.67, 'k'],
    [0.68, 'EFTaeÉáé'],
    [0.69, 'oó'],
    [0.70, '$0123456789'],
    [0.71, 'hnu{}ñúü'],
    [0.72, 'SYZbdgpq'],
    [0.73, 'CP'],
    [0.76, 'B'],
    [0.77, 'ARVXÁ'],
    [0.78, 'K'],
    [0.81, 'UÚ'],
    [0.82, 'G'],
    [0.83, 'D'],
    [0.84, '#+<=>HN^~Ñ\u00d7\u2190\u2191\u2192\u2193\u2212\u2260\u2264\u2265\u2713\u2717'],
    [0.85, 'OQÓ'],
    [0.87, '&'],
    [0.92, 'w'],
    [0.99, 'M'],
    [1.00, '%@'],
    [1.04, 'm'],
    [1.10, 'W']
    ];
    var m = {}, i, q, ch;
    for (i = 0; i < pares.length; i++) {
      ch = pares[i][1];
      for (q = 0; q < ch.length; q++) m[ch.charAt(q)] = pares[i][0];
    }
    m["'"] = 0.30;
    m['\\'] = 0.36;
    return m;
  }());

  /* anchoRot(texto, size) · anchura en px que ocupará ese rótulo.
     Se suman las anchuras de sus caracteres y se añaden 6 px de holgura:
     medido sobre 616 rótulos reales del módulo, esta estimación nunca se
     queda corta, así que ningún texto puede salirse del viewBox. */
  function anchoRot(texto, size) {
    var t = String(texto === undefined || texto === null ? '' : texto);
    var fs = size || 18, tot = 0, i, w;
    for (i = 0; i < t.length; i++) {
      w = ANCHO_CHAR[t.charAt(i)];
      tot += (w === undefined ? ANCHO_CHAR_POR_DEFECTO : w);
    }
    return Math.max(8, tot * fs + 6);
  }

  /* extremosX(body)

     Extremos horizontales de TODO lo que hay en un cuerpo de SVG, con los
     <text> medidos según su ancla y su tamaño. Con ellos se fija el ancho
     del viewBox y se centra el dibujo: ni recortes ni márgenes muertos
     asimétricos. */
  function extremosX(body) {
    var s = String(body || ''), min = Infinity, max = -Infinity, m, re, q, ns;
    function up(v) {
      if (typeof v === 'number' && isFinite(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }

    re = /<text\b([^>]*)>([\s\S]*?)<\/text>/g;
    while ((m = re.exec(s))) {
      var at = m[1];
      var cuerpo = m[2].replace(/<[^>]*>/g, '').replace(/&(?:[a-zA-Z]+|#\d+);/g, 'x');
      var mx = /\sx="(-?[\d.]+)"/.exec(at);
      if (!mx) continue;
      var ms = /font-size="(-?[\d.]+)"/.exec(at);
      var ma = /text-anchor="([a-z]+)"/.exec(at);
      var x = parseFloat(mx[1]);
      var w = anchoRot(cuerpo, ms ? parseFloat(ms[1]) : 18);
      var anc = ma ? ma[1] : 'middle';
      var x0 = anc === 'end' ? x - w : (anc === 'start' ? x : x - w / 2);
      up(x0); up(x0 + w);
    }

    re = /<(?:rect|foreignObject)\b[^>]*\sx="(-?[\d.]+)"[^>]*?\swidth="(-?[\d.]+)"/g;
    while ((m = re.exec(s))) { up(parseFloat(m[1])); up(parseFloat(m[1]) + parseFloat(m[2])); }

    re = /<line\b[^>]*\sx1="(-?[\d.]+)"[^>]*?\sx2="(-?[\d.]+)"/g;
    while ((m = re.exec(s))) { up(parseFloat(m[1])); up(parseFloat(m[2])); }

    re = /<circle\b[^>]*\scx="(-?[\d.]+)"[^>]*?\sr="(-?[\d.]+)"/g;
    while ((m = re.exec(s))) {
      up(parseFloat(m[1]) - parseFloat(m[2]));
      up(parseFloat(m[1]) + parseFloat(m[2]));
    }

    /* En estas figuras las rutas solo usan M, L y C: las coordenadas van
       por parejas x y, así que las x son las de índice par. */
    re = /<path\b[^>]*\sd="([^"]*)"/g;
    while ((m = re.exec(s))) {
      ns = m[1].match(/-?\d*\.?\d+/g) || [];
      for (q = 0; q < ns.length; q += 2) up(parseFloat(ns[q]));
    }

    re = /<(?:polygon|polyline)\b[^>]*\spoints="([^"]*)"/g;
    while ((m = re.exec(s))) {
      ns = m[1].match(/-?\d*\.?\d+/g) || [];
      for (q = 0; q < ns.length; q += 2) up(parseFloat(ns[q]));
    }

    if (!isFinite(min) || !isFinite(max)) { min = 0; max = 0; }
    return { min: min, max: max, ancho: max - min };
  }

  /* figura(body, W, H, label, cap)

     El ancho ya NO se cree el W que pasa el applet: se mide lo que de
     verdad se ha dibujado (rótulos incluidos), se le suman márgenes
     laterales iguales y, si hace falta, se desplaza el dibujo entero para
     que quede centrado y dentro del viewBox. Así se arreglan de una vez
     los rótulos y pies recortados y los márgenes muertos asimétricos de
     todos los applets del módulo. */
  function figura(body, W, H, label, cap) {
    var ext = extremosX(body);
    var alto = S.altoDibujado ? S.altoDibujado(body) + MARGEN_ABAJO : 0;
    if (!(alto > 0)) alto = Math.round(H);
    var ancho = Math.max(ANCHO_MIN, Math.ceil(ext.ancho) + 2 * MARGEN_LADO);
    var dx = Math.round((ancho - ext.ancho) / 2 - ext.min);
    var cuerpo = (dx > 1 || dx < -1)
      ? '<g transform="translate(' + dx + ',0)">' + body + '</g>'
      : body;
    return S.svgWrap(cuerpo, ancho, Math.round(alto), label, cap);
  }

  /* Colores de resalte reutilizados en todo el módulo. */
  var HI = {
    fila: 'rgba(25,118,210,.18)',
    col: 'rgba(46,125,50,.18)',
    diag: 'rgba(224,123,0,.22)',
    celda: 'rgba(198,40,40,.24)',
    ok: 'rgba(46,125,50,.16)',
    aviso: 'rgba(198,40,40,.16)',
    suave: 'rgba(120,144,156,.10)'
  };

  /* Relleno que resalta una línea entera. */
  function resaltaLinea(tipo, idx, color) {
    return function (i, j) {
      if (tipo === 'fila' && i === idx) return color;
      if (tipo === 'columna' && j === idx) return color;
      return null;
    };
  }

  /* Producto de la diagonal principal en texto llano: «2 · (−3) · 5». */
  function prodTxt(vals) {
    return vals.map(function (f, q) { return q === 0 ? nt(f) : pt(f); }).join(' \u00b7 ');
  }
  function prodTex(vals) {
    return vals.map(function (f, q) {
      return q === 0 ? FT(f) : (f.n < 0n ? '\\left(' + FT(f) + '\\right)' : FT(f));
    }).join('\\cdot ');
  }
  function prodDe(vals) {
    var p = F1();
    vals.forEach(function (f) { p = p.por(f); });
    return p;
  }

  /* Determinante de una matriz, siempre por la capa. */
  function det(A) { return capa().det(A); }

  /* Tarjeta con el valor de un determinante. */
  function tarjetaDet(nombre, A, valor, clase) {
    return '<div class="ap-card ' + (clase || '') + '"><div class="ap-card-tit">' + nombre + '</div>' +
      KD(S.detTex(A) + '=' + FT(valor)) + '</div>';
  }

  /* ==================================================================
     2 · applet «propiedades» · laboratorio de propiedades
     ================================================================== */

  /* Catálogo de propiedades, con el número que llevan en el apartado 03. */
  var PROP = {
    trans: {
      n: 1, titulo: 'Propiedad 1 · el determinante de la transpuesta',
      tex: '\\left|A^{t}\\right| = \\left|A\\right|',
      enun: 'El determinante de la transpuesta es igual al de la matriz: por eso todo lo que vale ' +
        'para las filas vale también para las columnas.'
    },
    ceros: {
      n: 2, titulo: 'Propiedad 2 · una línea de ceros anula el determinante',
      tex: '\\det(A) = 0',
      enun: 'Si una fila o una columna es toda de ceros, el determinante vale 0.'
    },
    cambio: {
      n: 3, titulo: 'Propiedad 3 · intercambiar dos líneas cambia el signo',
      tex: '\\det(A\') = -\\det(A)',
      enun: 'Al intercambiar dos filas (o dos columnas) el determinante cambia de signo y ' +
        'conserva el valor absoluto.'
    },
    porK: {
      n: 5, titulo: 'Propiedad 5 · multiplicar una línea por k multiplica el determinante por k',
      tex: '\\det(A\') = k\\cdot\\det(A)',
      enun: 'Si se multiplican por k todos los elementos de una línea, el determinante queda ' +
        'multiplicado por k. Ojo: multiplicar la matriz entera por k lo multiplica por kⁿ.'
    },
    comb: {
      n: 8, titulo: 'Propiedad 8 · una línea combinación lineal de las demás anula el determinante',
      tex: '\\det(A\') = 0',
      enun: 'Si una línea se puede escribir como combinación lineal de las otras, el ' +
        'determinante vale 0.'
    },
    suma: {
      n: 9, titulo: 'Propiedad 9 · sumar a una línea un múltiplo de otra no altera el determinante',
      tex: '\\det(A\') = \\det(A)',
      enun: 'Es la propiedad que sostiene el método de hacer ceros: mientras solo sumes a una ' +
        'línea un múltiplo de otra, el determinante no se mueve.'
    }
  };

  /* Aplica una operación a la matriz A. Devuelve la matriz nueva, la
     propiedad usada y cómo queda afectado el determinante. */
  function aplicaOp(A, o) {
    var n = A.f, tipo = o.tipo === 'columna' ? 'columna' : 'fila';
    var i, j, k, p, nueva, txtOp, texOp;
    if (o.op === 'transponer') {
      return {
        M: capa().matTrans(A), prop: PROP.trans, efecto: 'igual', factor: F1(),
        txt: 'A \u2192 A\u1d57  (transponer)', tex: 'A \\to A^{t}',
        desc: 'Hemos transpuesto la matriz: las filas pasan a ser columnas.'
      };
    }
    if (o.op === 'cambiar') {
      i = leeIndice(o.i, n, tipo === 'fila' ? 'fila Lᵢ' : 'columna Lᵢ');
      j = leeIndice(o.j, n, tipo === 'fila' ? 'segunda fila Lⱼ' : 'segunda columna Lⱼ');
      if (i === j) {
        throw Error('Para intercambiar dos ' + (tipo === 'fila' ? 'filas' : 'columnas') +
          ' tienen que ser dos líneas distintas: has elegido dos veces la ' +
          nombreLinea(tipo, i + 1) + '.');
      }
      return {
        M: cambiaLineas(A, tipo, i, j), prop: PROP.cambio, efecto: 'signo', factor: new Frac(-1),
        txt: lin(tipo, i + 1) + ' \u2194 ' + lin(tipo, j + 1),
        tex: linTex(tipo, i + 1) + ' \\leftrightarrow ' + linTex(tipo, j + 1),
        desc: 'Hemos intercambiado la ' + nombreLinea(tipo, i + 1) + ' y la ' +
          nombreLinea(tipo, j + 1) + '.'
      };
    }
    if (o.op === 'multiplicar') {
      i = leeIndice(o.i, n, tipo === 'fila' ? 'fila Lᵢ' : 'columna Lᵢ');
      k = FR(o.k);
      nueva = porK(lineaDe(A, tipo, i), k);
      return {
        M: ponLinea(A, tipo, i, nueva),
        prop: cero(k) ? PROP.ceros : PROP.porK,
        efecto: cero(k) ? 'cero' : 'factor', factor: k,
        txt: lin(tipo, i + 1) + ' \u2192 ' + pt(k) + ' \u00b7 ' + lin(tipo, i + 1),
        tex: linTex(tipo, i + 1) + ' \\to ' + S.parNegTex(FT(k)) + linTex(tipo, i + 1),
        desc: 'Hemos multiplicado la ' + nombreLinea(tipo, i + 1) + ' por ' + nt(k) + '.'
      };
    }
    if (o.op === 'sumar') {
      i = leeIndice(o.i, n, tipo === 'fila' ? 'fila Lᵢ' : 'columna Lᵢ');
      j = leeIndice(o.j, n, tipo === 'fila' ? 'segunda fila Lⱼ' : 'segunda columna Lⱼ');
      if (i === j) {
        throw Error('No puedes sumar a la ' + nombreLinea(tipo, i + 1) + ' un múltiplo de ella misma: ' +
          'elige otra línea. La operación válida es Lᵢ → Lᵢ + k·Lⱼ con i distinto de j.');
      }
      k = FR(o.k);
      nueva = sumaV(lineaDe(A, tipo, i), porK(lineaDe(A, tipo, j), k));
      return {
        M: ponLinea(A, tipo, i, nueva), prop: PROP.suma, efecto: 'igual', factor: F1(),
        txt: lin(tipo, i + 1) + ' \u2192 ' + lin(tipo, i + 1) + ' + ' + pt(k) + ' \u00b7 ' + lin(tipo, j + 1),
        tex: linTex(tipo, i + 1) + ' \\to ' + linTex(tipo, i + 1) + ' + ' + S.parNegTex(FT(k)) +
          linTex(tipo, j + 1),
        desc: 'A la ' + nombreLinea(tipo, i + 1) + ' le hemos sumado ' + nt(k) + ' veces la ' +
          nombreLinea(tipo, j + 1) + '.'
      };
    }
    if (o.op === 'combinar') {
      i = leeIndice(o.i, n, tipo === 'fila' ? 'fila Lᵢ' : 'columna Lᵢ');
      j = leeIndice(o.j, n, tipo === 'fila' ? 'segunda fila Lⱼ' : 'segunda columna Lⱼ');
      if (i === j) {
        throw Error('Para sustituir la ' + nombreLinea(tipo, i + 1) + ' por una combinación lineal ' +
          'de las demás, la línea Lⱼ tiene que ser otra distinta.');
      }
      k = FR(o.k);
      /* tercera línea: la primera que no sea ni Lᵢ ni Lⱼ */
      p = -1;
      for (var q = 0; q < n; q++) { if (q !== i && q !== j) { p = q; break; } }
      if (p < 0) {
        nueva = porK(lineaDe(A, tipo, j), k);
        txtOp = lin(tipo, i + 1) + ' \u2192 ' + pt(k) + ' \u00b7 ' + lin(tipo, j + 1);
        texOp = linTex(tipo, i + 1) + ' \\to ' + S.parNegTex(FT(k)) + linTex(tipo, j + 1);
      } else {
        nueva = sumaV(porK(lineaDe(A, tipo, j), k), lineaDe(A, tipo, p));
        txtOp = lin(tipo, i + 1) + ' \u2192 ' + pt(k) + ' \u00b7 ' + lin(tipo, j + 1) + ' + ' + lin(tipo, p + 1);
        texOp = linTex(tipo, i + 1) + ' \\to ' + S.parNegTex(FT(k)) + linTex(tipo, j + 1) +
          ' + ' + linTex(tipo, p + 1);
      }
      return {
        M: ponLinea(A, tipo, i, nueva), prop: PROP.comb, efecto: 'cero', factor: F0(),
        txt: txtOp, tex: texOp,
        desc: 'Hemos sustituido la ' + nombreLinea(tipo, i + 1) + ' por una combinación lineal de ' +
          'las demás líneas.'
      };
    }
    throw Error('No conozco esa transformación. Elige una de las cinco del desplegable.');
  }

  /* Cómo queda afectado el determinante, dicho con palabras. */
  function frasesEfecto(op, dAntes, dDespues) {
    if (op.efecto === 'signo') {
      return 'el determinante <b>cambia de signo</b>: pasa de ' + nt(dAntes) + ' a ' + nt(dDespues) + '.';
    }
    if (op.efecto === 'factor') {
      return 'el determinante queda <b>multiplicado por ' + nt(op.factor) + '</b>: pasa de ' +
        nt(dAntes) + ' a ' + nt(dDespues) + '.';
    }
    if (op.efecto === 'cero') {
      return 'el determinante <b>se anula</b>: pasa de ' + nt(dAntes) + ' a 0.';
    }
    return 'el determinante <b>no cambia</b>: sigue valiendo ' + nt(dDespues) + '.';
  }
  function etiquetaEfecto(op) {
    if (op.efecto === 'signo') return S.badge('cambia de signo', 'no');
    if (op.efecto === 'factor') return S.badge('queda multiplicado por ' + nt(op.factor), 'info');
    if (op.efecto === 'cero') return S.badge('se anula', 'no');
    return S.badge('no cambia', 'si');
  }

  R.propiedades = function (node) {
    var hist = [];
    function limpia() { hist.length = 0; }

    return S.shell(node, 'Laboratorio de propiedades',
      'Parte de una matriz cuadrada (2\u00d72, 3\u00d73 o 4\u00d74) y aplícale transformaciones para ver ' +
      '<b>qué le pasa a su determinante</b>. ' + EJEMPLO + ' Elige la transformación, si actúa sobre ' +
      '<b>filas</b> o sobre <b>columnas</b>, los números de línea (se cuentan <b>desde 1</b>) y el ' +
      'multiplicador ' + K('k') + ' (admite <code>3</code>, <code>-2</code>, <code>0,5</code> y ' +
      '<code>3/4</code>). Pulsa <b>Aplicar transformación</b> para encadenarlas; puedes <b>Deshacer</b> ' +
      'la última o <b>Reiniciar</b>. Arriba verás siempre la matriz de partida y la transformada, con ' +
      'sus dos determinantes, y debajo la propiedad que has usado en cada paso.',
      [
        {
          id: 'A', label: 'Matriz de partida', type: 'textarea', rows: 4,
          value: '2 1 3; 0 4 1; 5 2 6', ancho: '260px'
        },
        {
          id: 'op', label: 'Transformación', type: 'select', value: 'cambiar', ancho: '22rem',
          options: [
            { value: 'cambiar', label: 'Intercambiar dos líneas: Lᵢ ↔ Lⱼ' },
            { value: 'multiplicar', label: 'Multiplicar una línea por k: Lᵢ → k·Lᵢ' },
            { value: 'sumar', label: 'Sumar a una línea otra por k: Lᵢ → Lᵢ + k·Lⱼ' },
            { value: 'transponer', label: 'Transponer la matriz: A → Aᵗ' },
            { value: 'combinar', label: 'Línea = combinación lineal de las demás' }
          ]
        },
        {
          id: 'tipo', label: 'Actúa sobre', type: 'select', value: 'fila', ancho: '11rem',
          options: [{ value: 'fila', label: 'filas' }, { value: 'columna', label: 'columnas' }]
        },
        { id: 'i', label: 'Línea Lᵢ', type: 'number', min: 1, max: 4, value: 1, ancho: '8rem' },
        { id: 'j', label: 'Línea Lⱼ', type: 'number', min: 1, max: 4, value: 2, ancho: '8rem' },
        { id: 'k', label: 'Multiplicador k', type: 'text', value: '2', ancho: '9rem' },
        {
          id: 'aplicar', label: 'Aplicar transformación', type: 'button',
          click: function (ctl) {
            hist.push({
              op: String(ctl.op.value), tipo: String(ctl.tipo.value),
              i: Number(ctl.i.value), j: Number(ctl.j.value), k: String(ctl.k.value)
            });
          }
        },
        { id: 'deshacer', label: 'Deshacer', type: 'button', click: function () { hist.pop(); } },
        { id: 'reiniciar', label: 'Reiniciar', type: 'button', click: function () { limpia(); } },
        chips([
          {
            txt: 'Intercambiar dos filas', tip: 'F₁ ↔ F₃: el determinante cambia de signo',
            set: { A: '2 1 3; 0 4 1; 5 2 6', op: 'cambiar', tipo: 'fila', i: 1, j: 3, k: '2' },
            extra: limpia
          },
          {
            txt: 'Multiplicar una fila por 3', tip: 'F₂ → 3·F₂: el determinante se multiplica por 3',
            set: { A: '2 1 3; 0 4 1; 5 2 6', op: 'multiplicar', tipo: 'fila', i: 2, j: 1, k: '3' },
            extra: limpia
          },
          {
            txt: 'Hacer un cero', tip: 'F₃ → F₃ + (−2)·F₁: el determinante no cambia',
            set: { A: '1 2 3; 2 5 3; 3 8 4', op: 'sumar', tipo: 'fila', i: 3, j: 1, k: '-3' },
            extra: limpia
          },
          {
            txt: 'Transponer', tip: 'El determinante de la transpuesta es el mismo',
            set: { A: '2 1 3; 0 4 1; 5 2 6', op: 'transponer', tipo: 'fila', i: 1, j: 2, k: '2' },
            extra: limpia
          },
          {
            txt: 'Anular con una combinación', tip: 'F₃ → 2·F₁ + F₂: el determinante se anula',
            set: { A: '2 1 3; 0 4 1; 5 2 6', op: 'combinar', tipo: 'fila', i: 3, j: 1, k: '2' },
            extra: limpia
          },
          {
            txt: 'Trabajar por columnas', tip: 'C₁ ↔ C₂: las columnas se comportan igual que las filas',
            set: { A: '2 1 3; 0 4 1; 5 2 6', op: 'cambiar', tipo: 'columna', i: 1, j: 2, k: '2' },
            extra: limpia
          },
          {
            txt: 'Cadena de tres pasos', tip: 'Intercambio, factor y suma: los efectos se acumulan',
            set: { A: '2 1 3; 0 4 1; 5 2 6', op: 'sumar', tipo: 'fila', i: 3, j: 1, k: '-2' },
            extra: function (ctl) {
              limpia();
              hist.push({ op: 'cambiar', tipo: 'fila', i: 1, j: 2, k: '1' });
              hist.push({ op: 'multiplicar', tipo: 'fila', i: 1, j: 2, k: '2' });
              hist.push({ op: 'sumar', tipo: 'fila', i: 3, j: 1, k: '-2' });
              if (ctl && ctl.i) { ctl.i.value = '3'; ctl.j.value = '1'; ctl.k.value = '-2'; }
            }
          },
          {
            txt: 'Matriz 4×4', tip: 'Un laboratorio más grande',
            set: { A: '1 2 0 1; 3 1 2 0; 0 4 1 2; 2 0 3 1', op: 'sumar', tipo: 'fila', i: 2, j: 1, k: '-3' },
            extra: limpia
          },
          {
            txt: 'Matriz 2×2 con fracciones', tip: 'La aritmética es exacta',
            set: { A: '1/2 3; 2/3 -1', op: 'multiplicar', tipo: 'fila', i: 1, j: 2, k: '6' },
            extra: limpia
          },
          {
            txt: 'Matriz al azar 3×3', tip: 'Genera una matriz nueva y vacía el historial',
            set: { op: 'cambiar', tipo: 'fila', i: 1, j: 2, k: '2' },
            extra: function (ctl) {
              limpia();
              ctl.A.value = S.matTxt(S.matAleatoria(3, 3, { min: -5, max: 6 }));
            }
          }
        ])
      ],
      safe(function (v) {
        var A0 = leeCuad(v.A, 'la matriz de partida', 4);
        var n = A0.f;
        var d0 = det(A0);

        /* --- se recorre el historial, anotando solo el aviso del último
               paso: los avisos NO se acumulan entre recálculos --- */
        var actual = A0.copia(), avs = [], pasos = [], filas = [], acumTex = [], nOk = 0;
        function anota(idx, msg) {
          avs.length = 0;
          if (idx === hist.length - 1) avs.push(msg);
        }
        hist.forEach(function (o, idx) {
          var antes = det(actual), res;
          try { res = aplicaOp(actual, o); } catch (e) { anota(idx, e.message); return; }
          actual = res.M;
          var despues = det(actual);
          nOk++;
          pasos.push({ op: res, antes: antes, despues: despues });
          acumTex.push(res.tex);
          filas.push({
            celdas: [
              String(nOk), K(res.tex),
              'Propiedad ' + res.prop.n,
              K(FT(antes)) + ' \u2192 ' + K(FT(despues)),
              etiquetaEfecto(res)
            ],
            clase: res.efecto === 'igual' ? 'detb-ok' : 'detb-ko'
          });
        });
        var dF = det(actual);

        /* --- figura: matriz de partida y matriz actual, lado a lado --- */
        var cw = anchoCelda(2 * n + 2);
        var ultima = pasos.length ? pasos[pasos.length - 1].op : null;
        var marcaFill = null;
        if (ultima && hist.length) {
          var ho = hist[hist.length - 1];
          if (ho.op !== 'transponer' && isFinite(Number(ho.i)) &&
              Number(ho.i) >= 1 && Number(ho.i) <= n) {
            marcaFill = resaltaLinea(ho.tipo === 'columna' ? 'columna' : 'fila',
              Number(ho.i) - 1, HI.celda);
          }
        }
        var y0 = 132;
        var gA = dibujaMat(48, y0, A0, {
          cw: cw, det: true, rotulo: 'matriz de partida A',
          pie: 'det(A) = ' + nt(d0)
        });
        var xB = gA.x1 + 132;
        var gB = dibujaMat(xB, y0, actual, {
          cw: cw, det: true, rotulo: 'matriz transformada A\u2032',
          rotuloCol: COL.rojo, fill: marcaFill,
          pie: 'det(A\u2032) = ' + nt(dF), pieCol: COL.rojo
        });
        var body = '';
        body += S.txt(40, 48, 'Qué le pasa al determinante cuando transformas la matriz',
          { size: 20, weight: '700', anchor: 'start', fill: COL.azulOsc });
        body += S.txt(40, 78, 'Matriz de orden ' + n + ' \u00b7 ' + nOk + ' transformación' +
          (nOk === 1 ? '' : 'es') + ' aplicada' + (nOk === 1 ? '' : 's'),
          { size: 17, weight: '600', anchor: 'start', fill: COL.gris });
        body += gA.svg + gB.svg;
        var yMed = y0 + gA.H / 2;
        body += S.line(gA.x1 + 18, yMed, xB - 18, yMed, COL.eje, 2.6);
        body += S.poly([[xB - 18, yMed], [xB - 34, yMed - 9], [xB - 34, yMed + 9]], COL.eje, COL.eje);
        var rotOp = ultima ? ultima.txt : 'sin transformar';
        body += S.txt((gA.x1 + xB) / 2, yMed - 20, rotOp,
          { size: 17, weight: '700', fill: COL.rojo, family: FAM_OP });
        var yPie = y0 + gA.H + 78;
        var relacion;
        if (cero(d0) && cero(dF)) relacion = 'det(A\u2032) = det(A) = 0';
        else if (igF(dF, d0)) relacion = 'det(A\u2032) = det(A) = ' + nt(dF);
        else if (igF(dF, d0.opuesto())) relacion = 'det(A\u2032) = \u2212det(A) = ' + nt(dF);
        else if (cero(dF)) relacion = 'det(A\u2032) = 0  (y det(A) = ' + nt(d0) + ')';
        else if (!cero(d0)) relacion = 'det(A\u2032) = ' + nt(dF.entre(d0)) + ' \u00b7 det(A) = ' + nt(dF);
        else relacion = 'det(A) = 0 y det(A\u2032) = ' + nt(dF);
        body += S.txt(40, yPie, relacion,
          { size: 22, weight: '700', anchor: 'start', fill: COL.azulOsc, family: FAM_OP });
        var W = gB.x1 + 48, H = yPie + 40;
        var h = figura(body, W, H, 'Matriz de partida y matriz transformada con sus determinantes',
          'A la izquierda, el determinante de partida; a la derecha, el que queda después de las ' +
          'transformaciones aplicadas.');

        /* --- avisos del último intento --- */
        h += avisos(avs);

        /* --- la propiedad usada en el último paso --- */
        if (ultima) {
          h += propBox(ultima.prop.titulo,
            parrafo(ultima.desc + ' Según esta propiedad, ' +
              frasesEfecto(ultima, pasos[pasos.length - 1].antes, pasos[pasos.length - 1].despues)) +
            KD(ultima.prop.tex) +
            parrafo(ultima.prop.enun));
        } else {
          h += pista('Todavía no has aplicado ninguna transformación: elige una en el desplegable, ' +
            'ajusta las líneas y pulsa <b>Aplicar transformación</b>. Prueba primero a intercambiar ' +
            'dos filas y fíjate en el signo del determinante.');
        }

        /* --- tabla con la cadena completa --- */
        if (filas.length) {
          h += titulillo('Cadena de transformaciones aplicadas');
          h += S.tabla(['paso', 'operación', 'propiedad', 'determinante', 'efecto'], filas);
          h += KD(acumTex.join('\\ ,\\quad '));
        }

        /* --- comprobación numérica exacta --- */
        h += titulillo('Comprobación numérica');
        var cuentas = [];
        cuentas.push('det(A) = <b>' + nt(d0) + '</b>');
        cuentas.push('det(A\u2032) = <b>' + nt(dF) + '</b>');
        if (!cero(d0)) cuentas.push('det(A\u2032) : det(A) = <b>' + nt(dF.entre(d0)) + '</b>');
        cuentas.push('orden = <b>' + n + '</b>');
        h += S.kvs(cuentas);

        var factorTeorico = F1();
        pasos.forEach(function (p) {
          if (p.op.efecto === 'signo') factorTeorico = factorTeorico.por(new Frac(-1));
          else if (p.op.efecto === 'factor') factorTeorico = factorTeorico.por(p.op.factor);
          else if (p.op.efecto === 'cero') factorTeorico = F0();
        });
        var previsto = d0.por(factorTeorico);
        h += parrafo(igF(previsto, dF)
          ? S.badge('las propiedades aciertan', 'si') + ' Encadenando los efectos de las ' +
            pasos.length + ' transformación' + (pasos.length === 1 ? '' : 'es') + ', el determinante ' +
            'debería quedar multiplicado por ' + K(FT(factorTeorico)) + ', es decir ' +
            K(FT(d0) + '\\cdot' + FT(factorTeorico) + '=' + FT(previsto)) + ', y el cálculo directo del ' +
            'determinante de ' + K('A\'') + ' da exactamente ' + K(FT(dF)) + '. ' +
            'Las propiedades no son un truco: son un atajo exacto.'
          : S.badge('atención', 'info') + ' La cadena de propiedades preveía ' + K(FT(previsto)) +
            ' y el cálculo directo da ' + K(FT(dF)) + '. Repasa el historial: alguna transformación ' +
            'ha anulado el determinante y a partir de ahí ya no se puede recuperar el valor.');

        /* --- recordatorio de las tres reglas --- */
        h += titulillo('Las tres reglas que hay que tener siempre presentes');
        h += S.tabla(['operación', 'efecto sobre el determinante', 'propiedad'], [
          [K('L_i \\leftrightarrow L_j'), 'cambia de <b>signo</b>', 'propiedad 3'],
          [K('L_i \\to k\\,L_i'), 'queda <b>multiplicado por ' + K('k') + '</b>', 'propiedad 5'],
          [K('L_i \\to L_i + k\\,L_j'), '<b>no cambia</b>', 'propiedad 9']
        ]);
        h += parrafo('Y las dos que anulan: una línea de ceros (propiedad 2) y una línea que sea ' +
          'combinación lineal de las demás (propiedad 8), en particular dos líneas iguales o ' +
          'proporcionales (propiedades 4 y 6).');
        return h;
      }));
  };

  /* ==================================================================
     3 · applet «triangular» · triangulares, diagonales y triangulación
     ================================================================== */

  /* Nombre de la matriz según su forma. */
  function formaDe(A) {
    var sup = S.esTriangularSup(A), inf = S.esTriangularInf(A);
    if (S.esIdentidad(A)) return { clave: 'identidad', nombre: 'la matriz identidad', tri: true };
    if (sup && inf && S.esEscalar(A)) return { clave: 'escalar', nombre: 'una matriz escalar', tri: true };
    if (sup && inf) return { clave: 'diagonal', nombre: 'una matriz diagonal', tri: true };
    if (sup) return { clave: 'superior', nombre: 'una matriz triangular superior', tri: true };
    if (inf) return { clave: 'inferior', nombre: 'una matriz triangular inferior', tri: true };
    return { clave: 'ninguna', nombre: 'una matriz que no es triangular', tri: false };
  }

  /* Triangulación por Gauss usando SOLO Fi → Fi + k·Fj (que no cambia el
     determinante) y, si hace falta, intercambios de filas (que le cambian
     el signo y quedan anotados). Aritmética exacta. */
  function triangula(A) {
    var M = A.copia(), n = M.f, pasos = [], signo = 1, i, j, r, k;
    for (j = 0; j < n - 1; j++) {
      if (cero(M.a[j][j])) {
        r = -1;
        for (i = j + 1; i < n; i++) { if (!cero(M.a[i][j])) { r = i; break; } }
        if (r < 0) continue;                 /* toda la columna es 0 por debajo */
        M = cambiaLineas(M, 'fila', j, r);
        signo = -signo;
        pasos.push({
          txt: 'F' + sub(j + 1) + ' \u2194 F' + sub(r + 1),
          tex: 'F_{' + (j + 1) + '} \\leftrightarrow F_{' + (r + 1) + '}',
          desc: 'El pivote de la columna ' + (j + 1) + ' era 0, así que intercambiamos la fila ' +
            (j + 1) + ' con la fila ' + (r + 1) + '. Este intercambio <b>cambia el signo</b> del ' +
            'determinante, y por eso queda anotado.',
          matriz: M, cambiaSigno: true
        });
      }
      for (i = j + 1; i < n; i++) {
        if (cero(M.a[i][j])) continue;
        k = M.a[i][j].entre(M.a[j][j]).opuesto();
        M = ponLinea(M, 'fila', i, sumaV(lineaDe(M, 'fila', i), porK(lineaDe(M, 'fila', j), k)));
        pasos.push({
          txt: 'F' + sub(i + 1) + ' \u2192 F' + sub(i + 1) + ' + ' + pt(k) + ' \u00b7 F' + sub(j + 1),
          tex: 'F_{' + (i + 1) + '} \\to F_{' + (i + 1) + '} + ' + S.parNegTex(FT(k)) +
            'F_{' + (j + 1) + '}',
          desc: 'Hacemos un cero en la fila ' + (i + 1) + ' de la columna ' + (j + 1) +
            ' sumándole ' + nt(k) + ' veces la fila ' + (j + 1) + '. El determinante <b>no cambia</b>.',
          matriz: M, cambiaSigno: false
        });
      }
    }
    var diag = [];
    for (i = 0; i < n; i++) diag.push(M.a[i][i]);
    var prod = prodDe(diag);
    return {
      matriz: M, pasos: pasos, signo: signo, diagonal: diag, producto: prod,
      total: signo < 0 ? prod.opuesto() : prod
    };
  }

  R.triangular = function (node) {
    return S.shell(node, 'Determinante de una matriz triangular',
      'El determinante de una matriz <b>triangular</b> (o diagonal) es el <b>producto de los elementos ' +
      'de la diagonal principal</b>. ' + EJEMPLO + ' El applet reconoce si lo que has escrito es ' +
      'triangular superior, triangular inferior, diagonal, escalar o la identidad, y resalta la ' +
      'diagonal en la figura. Si eliges <b>Triangular paso a paso</b>, coge la matriz que sea y la ' +
      'convierte en triangular usando solo ' + K('F_i \\to F_i + k\\,F_j') + ', que <b>no cambia</b> el ' +
      'determinante: verás cómo el valor se mantiene hasta que al final basta con multiplicar la ' +
      'diagonal. Ejemplo copiable de matriz triangular: <code>2 5 1; 0 3 4; 0 0 -1</code>.',
      [
        {
          id: 'A', label: 'Matriz cuadrada', type: 'textarea', rows: 4,
          value: '2 5 1; 0 3 4; 0 0 -1', ancho: '260px'
        },
        {
          id: 'modo', label: 'Qué quiero ver', type: 'select', value: 'detectar', ancho: '20rem',
          options: [
            { value: 'detectar', label: 'Analizar la matriz tal como está' },
            { value: 'triangular', label: 'Triangular paso a paso' }
          ]
        },
        chips([
          {
            txt: 'Triangular superior', tip: 'Ceros por debajo de la diagonal',
            set: { A: '2 5 1; 0 3 4; 0 0 -1', modo: 'detectar' }
          },
          {
            txt: 'Triangular inferior', tip: 'Ceros por encima de la diagonal',
            set: { A: '3 0 0; -2 4 0; 1 5 2', modo: 'detectar' }
          },
          {
            txt: 'Diagonal', tip: 'Solo hay diagonal principal',
            set: { A: '4 0 0; 0 -3 0; 0 0 5', modo: 'detectar' }
          },
          {
            txt: 'Escalar 3·I', tip: 'Todos los elementos de la diagonal son iguales',
            set: { A: '3 0 0; 0 3 0; 0 0 3', modo: 'detectar' }
          },
          {
            txt: 'Identidad', tip: 'El determinante de la identidad vale 1',
            set: { A: '1 0 0; 0 1 0; 0 0 1', modo: 'detectar' }
          },
          {
            txt: 'Un cero en la diagonal', tip: 'Basta un cero en la diagonal para anular el determinante',
            set: { A: '2 7 1; 0 0 4; 0 0 -5', modo: 'detectar' }
          },
          {
            txt: 'Triangular paso a paso', tip: 'Una matriz cualquiera se convierte en triangular',
            set: { A: '2 1 3; 4 5 6; 1 0 8', modo: 'triangular' }
          },
          {
            txt: 'Triangular una 4×4', tip: 'El método funciona en cualquier orden',
            set: { A: '1 2 0 1; 3 1 2 0; 0 4 1 2; 2 0 3 1', modo: 'triangular' }
          },
          {
            txt: 'Pivote nulo', tip: 'Hay que intercambiar dos filas: el signo cambia',
            set: { A: '0 2 1; 3 1 4; 1 5 2', modo: 'triangular' }
          },
          {
            txt: 'Triangular 5×5', tip: 'Un determinante grande que sale de un vistazo',
            set: { A: '2 1 3 4 5; 0 3 1 2 6; 0 0 -1 7 1; 0 0 0 2 3; 0 0 0 0 4', modo: 'detectar' }
          }
        ])
      ],
      safe(function (v) {
        var A = leeCuad(v.A, 'la matriz', 5);
        var n = A.f, i;
        var forma = formaDe(A);
        var dA = det(A);
        var diag = [];
        for (i = 0; i < n; i++) diag.push(A.a[i][i]);
        var prodDiag = prodDe(diag);

        /* --- figura con la diagonal resaltada --- */
        var cw = anchoCelda(n + 2);
        var y0 = 128;
        var g = dibujaMat(48, y0, A, {
          cw: cw, det: true,
          rotulo: 'matriz de orden ' + n + ' \u00b7 ' + forma.nombre,
          rotuloCol: forma.tri ? COL.verde : COL.gris,
          fill: function (r, c) {
            if (r === c) return HI.diag;
            if (forma.clave === 'superior' && r > c) return HI.suave;
            if (forma.clave === 'inferior' && r < c) return HI.suave;
            if (forma.tri && forma.clave !== 'superior' && forma.clave !== 'inferior' && r !== c) return HI.suave;
            return null;
          }
        });
        var body = '';
        body += S.txt(40, 48, 'La diagonal principal manda: en una matriz triangular el determinante es su producto',
          { size: 19, weight: '700', anchor: 'start', fill: COL.azulOsc });
        body += S.txt(40, 78, forma.tri
          ? 'Esta matriz es ' + forma.nombre + '.'
          : 'Esta matriz no es triangular: hay elementos no nulos a los dos lados de la diagonal.',
          { size: 17, weight: '600', anchor: 'start', fill: forma.tri ? COL.verde : COL.rojo });
        body += g.svg;
        body += S.line(g.cx(0) - cw / 2 + 8, g.cy(0) - 22, g.cx(n - 1) + cw / 2 - 8, g.cy(n - 1) + 22,
          COL.naranja, 3, '8 6');
        var xTxt = g.x1 + 40;
        body += S.txt(xTxt, g.cy(0) + 6, 'diagonal principal:',
          { size: 18, weight: '700', anchor: 'start', fill: COL.naranja });
        body += S.txt(xTxt, g.cy(0) + 36, prodTxt(diag) + ' = ' + nt(prodDiag),
          { size: 22, weight: '700', anchor: 'start', fill: COL.texto, family: FAM_OP });
        body += S.txt(xTxt, g.cy(0) + 72, forma.tri
          ? 'det(A) = ' + nt(dA) + '  \u2190 justo el producto de la diagonal'
          : 'det(A) = ' + nt(dA) + '  \u2260 el producto de la diagonal (' + nt(prodDiag) + ')',
          { size: 20, weight: '700', anchor: 'start', fill: forma.tri ? COL.verde : COL.rojo, family: FAM_OP });
        var W = Math.max(g.x1 + 48, xTxt + 520), H = g.y1 + 80;
        var h = figura(body, W, H, 'Diagonal principal de la matriz y su producto',
          'La diagonal principal va de la esquina superior izquierda a la inferior derecha: son los ' +
          'elementos ' + K('a_{ii}') + '.');

        /* --- lectura de lo detectado --- */
        h += S.kvs([
          'orden = <b>' + n + '</b>',
          'forma = <b>' + forma.nombre + '</b>',
          'producto de la diagonal = <b>' + nt(prodDiag) + '</b>',
          'det(A) = <b>' + nt(dA) + '</b>'
        ]);

        if (forma.tri) {
          h += propBox('Propiedad 11 · determinante de una matriz triangular',
            parrafo('Como la matriz es ' + forma.nombre + ', el determinante es directamente el ' +
              'producto de los elementos de la diagonal principal, sin desarrollar nada:') +
            KD(S.detTex(A) + '=' + prodTex(diag) + '=' + FT(prodDiag)) +
            parrafo(cero(prodDiag)
              ? 'Aquí hay un <b>cero en la diagonal</b>, y un solo cero basta para que todo el producto ' +
                'sea 0: el determinante se anula y la matriz es singular.'
              : 'Por eso conviene tanto triangular antes de calcular: en cuanto la matriz es ' +
                'triangular, el determinante sale de un vistazo.'));
          if (forma.clave === 'identidad') {
            h += parrafo(S.badge('caso especial', 'si') + ' La identidad tiene unos en toda la diagonal, ' +
              'así que ' + K('\\left|I_{' + n + '}\\right| = 1') + '. Es el determinante más fácil del tema.');
          } else if (forma.clave === 'escalar') {
            h += parrafo(S.badge('matriz escalar', 'info') + ' Una matriz escalar es ' + K('k\\cdot I') +
              ', y su determinante es ' + K('k^{' + n + '}') + ' porque hay ' + n + ' factores iguales en la ' +
              'diagonal: aquí ' + K(FT(A.a[0][0]) + '^{' + n + '} = ' + FT(prodDiag)) + '. ' +
              'Es el caso particular de ' + K('\\left|kA\\right| = k^{n}\\left|A\\right|') + '.');
          }
        } else {
          h += parrafo(S.badge('todavía no es triangular', 'no') + ' El producto de la diagonal vale ' +
            K(FT(prodDiag)) + ' y el determinante vale ' + K(FT(dA)) + ': <b>no coinciden</b>. ' +
            'Multiplicar la diagonal solo vale cuando la matriz ya es triangular. ' +
            'Elige <b>Triangular paso a paso</b> para llevarla a esa forma sin cambiar el determinante.');
        }

        /* --- triangulación paso a paso --- */
        if (v.modo === 'triangular') {
          var T = triangula(A);
          h += titulillo('Triangulación paso a paso');
          h += parrafo('Solo se usan dos operaciones: ' + K('F_i \\to F_i + k\\,F_j') + ', que <b>no ' +
            'altera</b> el determinante, y, cuando el pivote es 0, un intercambio de filas, que le ' +
            '<b>cambia el signo</b> y queda anotado.');
          if (!T.pasos.length) {
            h += pista('No ha hecho falta ninguna operación: la matriz ya era triangular superior.');
          }
          /* Los pasos se numeran DESDE 1, igual que las líneas y que el
              resto del tema: el paso 1 es la matriz de partida. */
          h += S.paso('1', '<p>' + S.texifica('Matriz de partida, con ' +
            K('\\det(A) = ' + FT(dA)) + '.') + '</p>' + KD(S.detTex(A)), 'detb-paso0');
          var dPaso = dA, signoAcum = 1;
          T.pasos.forEach(function (p, q) {
            if (p.cambiaSigno) signoAcum = -signoAcum;
            var dAhora = det(p.matriz);
            h += S.paso(String(q + 2),
              '<p>' + S.texifica(p.desc) + '</p>' + KD(p.tex) + KD(S.detTex(p.matriz)) +
              '<p>' + S.texifica('Determinante ahora: ' + K(FT(dAhora)) +
                (igF(dAhora, dPaso) ? ' — <b>el mismo de antes</b>.'
                  : ' — ha cambiado de signo respecto de ' + K(FT(dPaso)) + '.')) + '</p>',
              p.cambiaSigno ? 'detb-ko' : 'detb-ok');
            dPaso = dAhora;
          });
          var dFin = prodDe(T.diagonal);
          h += titulillo('Y ya está: se multiplica la diagonal');
          h += KD(S.detTex(T.matriz) + '=' + prodTex(T.diagonal) + '=' + FT(dFin));
          h += parrafo(T.signo < 0
            ? 'Ha habido un número impar de intercambios de filas, así que hay que <b>cambiar el ' +
              'signo</b> al final: ' + K('\\det(A) = -\\left(' + FT(dFin) + '\\right) = ' + FT(T.total)) + '.'
            : 'No ha habido cambios de signo, así que el determinante de la matriz triangular es ' +
              'directamente el de la matriz de partida: ' + K('\\det(A) = ' + FT(T.total)) + '.');
          h += parrafo(igF(T.total, dA)
            ? S.badge('comprobado', 'si') + ' El valor obtenido triangulando, ' + K(FT(T.total)) +
              ', coincide exactamente con el determinante calculado de forma directa, ' + K(FT(dA)) + '.'
            : S.badge('atención', 'no') + ' Los dos caminos no coinciden: revisa los pasos.');
          h += S.tabla(['paso', 'operación', '¿cambia el determinante?'],
            [['1', 'matriz de partida', S.badge('valor inicial', 'info')]].concat(
              T.pasos.map(function (p, q) {
                return [String(q + 2), K(p.tex),
                  p.cambiaSigno ? S.badge('sí: cambia de signo', 'no') : S.badge('no', 'si')];
              })));
        }

        h += parrafo(S.badge('para el examen', 'info') + ' Dos ideas para llevarse: el determinante de ' +
          'una triangular es el producto de la diagonal, y triangular una matriz con ' +
          K('F_i \\to F_i + k\\,F_j') + ' es gratis, porque esa operación no toca el determinante. ' +
          'Juntas, convierten cualquier determinante en una multiplicación.');
        return h;
      }));
  };

  /* ==================================================================
     4 · applet «productoDet» · |A·B| = |A|·|B|
     ================================================================== */
  R.productoDet = function (node) {
    return S.shell(node, 'El determinante de un producto',
      'Escribe <b>dos matrices cuadradas del mismo orden</b>, por filas y separando las filas con «;»: ' +
      'por ejemplo ' + K('A') + ' = <code>2 1; 3 4</code> y ' + K('B') + ' = <code>1 0; -2 5</code>. ' +
      'También valen fracciones (<code>1/2 3; 0 -2</code>) y decimales con coma (<code>0,5 1; 2 3</code>). ' +
      'El applet calcula ' + K('A\\cdot B') + ' y compara ' + K('\\left|A\\cdot B\\right|') + ' con ' +
      K('\\left|A\\right|\\cdot\\left|B\\right|') + ': salen <b>siempre</b> iguales. Y justo debajo hace ' +
      'la misma prueba con la <b>suma</b>, donde la igualdad <b>falla</b>: ' +
      K('\\left|A + B\\right| \\ne \\left|A\\right| + \\left|B\\right|') + '.',
      [
        { id: 'A', label: 'Matriz A', type: 'textarea', rows: 3, value: '2 1; 3 4', ancho: '220px' },
        { id: 'B', label: 'Matriz B', type: 'textarea', rows: 3, value: '1 0; -2 5', ancho: '220px' },
        chips([
          { txt: 'Dos matrices 2×2', tip: 'El caso básico', set: { A: '2 1; 3 4', B: '1 0; -2 5' } },
          { txt: 'Dos matrices 3×3', tip: 'La propiedad vale en cualquier orden',
            set: { A: '1 2 0; 3 -1 2; 0 4 1', B: '2 0 1; 1 3 -1; 0 2 2' } },
          { txt: 'B singular', tip: 'Si |B| = 0, el producto también tiene determinante 0',
            set: { A: '2 1; 3 4', B: '2 4; 1 2' } },
          { txt: 'B = identidad', tip: 'Multiplicar por la identidad no cambia nada',
            set: { A: '2 1 3; 0 4 1; 5 2 6', B: '1 0 0; 0 1 0; 0 0 1' } },
          { txt: 'B = inversa de A', tip: 'El producto es la identidad y los determinantes son inversos',
            set: { A: '2 1; 3 4', B: '4/5 -1/5; -3/5 2/5' } },
          { txt: 'Contraejemplo de la suma', tip: 'Aquí se ve clarísimo que |A + B| no es |A| + |B|',
            set: { A: '1 0; 0 1', B: '1 0; 0 1' } },
          { txt: 'Con fracciones', tip: 'Aritmética exacta', set: { A: '1/2 1/3; 2 -1', B: '3 1/4; 1/5 2' } },
          { txt: 'Matrices al azar 3×3', tip: 'Compruébalo con matrices nuevas', set: {},
            extra: function (ctl) {
              ctl.A.value = S.matTxt(S.matAleatoria(3, 3, { min: -4, max: 5 }));
              ctl.B.value = S.matTxt(S.matAleatoria(3, 3, { min: -4, max: 5 }));
            } }
        ])
      ],
      safe(function (v) {
        var A = leeCuad(v.A, 'la matriz A', 4);
        var B = leeCuad(v.B, 'la matriz B', 4);
        if (A.f !== B.f) {
          throw Error('La matriz A es de orden ' + A.f + ' y la matriz B es de orden ' + B.f +
            '. Para poder multiplicarlas y comparar sus determinantes tienen que ser del mismo orden: ' +
            'escribe las dos con ' + A.f + ' filas y ' + A.f + ' columnas.');
        }
        var n = A.f;
        var AB = S.matProd(A, B);
        var dA = det(A), dB = det(B), dAB = det(AB);
        var producto = dA.por(dB);

        /* --- figura: A · B = A·B, con los tres determinantes al pie --- */
        var cw = anchoCelda(3 * n + 3);
        var y0 = 128;
        var gA = dibujaMat(46, y0, A, { cw: cw, det: true, rotulo: 'A', pie: 'det(A) = ' + nt(dA) });
        var xB = gA.x1 + 74;
        var gB = dibujaMat(xB, y0, B, { cw: cw, det: true, rotulo: 'B', pie: 'det(B) = ' + nt(dB) });
        var xC = gB.x1 + 78;
        var gC = dibujaMat(xC, y0, AB, {
          cw: cw, det: true, rotulo: 'A \u00b7 B', rotuloCol: COL.rojo,
          pie: 'det(A \u00b7 B) = ' + nt(dAB), pieCol: COL.rojo
        });
        var body = '';
        body += S.txt(40, 48, 'El determinante de un producto es el producto de los determinantes',
          { size: 20, weight: '700', anchor: 'start', fill: COL.azulOsc });
        body += S.txt(40, 78, 'Dos matrices cuadradas de orden ' + n +
          ': primero se multiplican las matrices y luego se calcula un solo determinante',
          { size: 17, weight: '600', anchor: 'start', fill: COL.gris });
        body += gA.svg + gB.svg + gC.svg;
        var yMed = y0 + gA.H / 2;
        body += operador((gA.x1 + xB) / 2, yMed, '\u00b7');
        body += operador((gB.x1 + xC) / 2, yMed, '=');
        var yPie = y0 + gA.H + 96;
        body += S.txt(40, yPie, 'det(A) \u00b7 det(B) = ' + pt(dA) + ' \u00b7 ' + pt(dB) + ' = ' + nt(producto),
          { size: 22, weight: '700', anchor: 'start', fill: COL.verde, family: FAM_OP });
        body += S.txt(40, yPie + 34, 'det(A \u00b7 B) = ' + nt(dAB) +
          (igF(dAB, producto) ? '   \u2192 coinciden' : '   \u2192 NO coinciden'),
          { size: 22, weight: '700', anchor: 'start', fill: igF(dAB, producto) ? COL.verde : COL.rojo,
            family: FAM_OP });
        var W = gC.x1 + 46, H = yPie + 60;
        var h = figura(body, W, H, 'Producto de dos matrices y sus tres determinantes',
          'Los tres determinantes de la figura: el de ' + K('A') + ', el de ' + K('B') + ' y el del ' +
          'producto ' + K('A\\cdot B') + '.');

        h += propBox('Propiedad 10 · determinante de un producto',
          KD('\\left|A\\cdot B\\right| = \\left|A\\right|\\cdot\\left|B\\right|') +
          parrafo('Con estas dos matrices:') +
          KD('\\left|A\\cdot B\\right| = ' + FT(dAB) + '\\qquad ' +
            '\\left|A\\right|\\cdot\\left|B\\right| = ' + FT(dA) + '\\cdot' + FT(dB) + ' = ' + FT(producto)) +
          parrafo(igF(dAB, producto)
            ? S.badge('la propiedad se cumple', 'si') + ' Los dos caminos dan ' + K(FT(dAB)) +
              '. Fíjate en el ahorro: calcular ' + K('A\\cdot B') + ' cuesta ' + (n * n * n) +
              ' productos y luego un determinante de orden ' + n + '; en cambio ' +
              K('\\left|A\\right|\\cdot\\left|B\\right|') + ' son dos determinantes y una multiplicación.'
            : S.badge('revisa los datos', 'no') + ' Con estos números no coinciden, lo que solo puede ' +
              'ocurrir si las matrices no son cuadradas del mismo orden.'));

        h += titulillo('Las tres cuentas, una al lado de la otra');
        h += S.tabla(['qué se calcula', 'matriz', 'determinante'], [
          [K('A'), KD(S.matTex(A)), K(FT(dA))],
          [K('B'), KD(S.matTex(B)), K(FT(dB))],
          [K('A\\cdot B'), KD(S.matTex(AB)), K(FT(dAB))]
        ]);

        /* --- consecuencias --- */
        var cons = [];
        if (cero(dA) || cero(dB)) {
          cons.push('Como ' + (cero(dA) ? K('\\left|A\\right| = 0') : K('\\left|B\\right| = 0')) +
            ', el producto tiene determinante 0 sin necesidad de calcularlo: basta con que <b>uno</b> ' +
            'de los factores sea singular para que el producto lo sea.');
        }
        if (S.esIdentidad(AB)) {
          cons.push('El producto ha dado la <b>identidad</b>, así que ' +
            K('\\left|A\\right|\\cdot\\left|B\\right| = 1') + ': ' + K('B') + ' es la inversa de ' +
            K('A') + ' y sus determinantes son inversos uno del otro.');
        }
        if (!cero(dA) && !cero(dB)) {
          cons.push('Ninguno de los dos determinantes es 0, así que las dos matrices son <b>regulares</b> ' +
            'y su producto también: ' + K('\\left|A\\cdot B\\right| = ' + FT(dAB) + ' \\ne 0') + '.');
        }
        cons.push('De esta propiedad sale también ' + K('\\left|A^{n}\\right| = \\left|A\\right|^{n}') +
          ' y, cuando existe la inversa, ' +
          K('\\left|A^{-1}\\right| = \\dfrac{1}{\\left|A\\right|}') + '.');
        h += titulillo('Qué se deduce de aquí');
        h += '<ul class="detb-avisos"><li>' + cons.join('</li><li>') + '</li></ul>';

        /* --- el contraejemplo de la suma --- */
        var SU = S.matSuma(A, B);
        var dSU = det(SU), sumaDets = dA.mas(dB);
        var cw2 = anchoCelda(3 * n + 3);
        var y2 = 118;
        var hA = dibujaMat(46, y2, A, { cw: cw2, det: true, rotulo: 'A', pie: 'det(A) = ' + nt(dA) });
        var xb2 = hA.x1 + 74;
        var hB = dibujaMat(xb2, y2, B, { cw: cw2, det: true, rotulo: 'B', pie: 'det(B) = ' + nt(dB) });
        var xc2 = hB.x1 + 78;
        var hC = dibujaMat(xc2, y2, SU, {
          cw: cw2, det: true, rotulo: 'A + B', rotuloCol: COL.rojo,
          pie: 'det(A + B) = ' + nt(dSU), pieCol: COL.rojo,
          fill: function () { return HI.aviso; }
        });
        var b2 = '';
        b2 += S.txt(40, 46, 'Y ahora la trampa: con la SUMA no funciona',
          { size: 20, weight: '700', anchor: 'start', fill: COL.rojo });
        b2 += hA.svg + hB.svg + hC.svg;
        var yM2 = y2 + hA.H / 2;
        b2 += operador((hA.x1 + xb2) / 2, yM2, '+');
        b2 += operador((hB.x1 + xc2) / 2, yM2, '=');
        var yP2 = y2 + hA.H + 96;
        b2 += S.txt(40, yP2, 'det(A) + det(B) = ' + nt(dA) + ' + ' + pt(dB) + ' = ' + nt(sumaDets),
          { size: 22, weight: '700', anchor: 'start', fill: COL.gris, family: FAM_OP });
        b2 += S.txt(40, yP2 + 34, 'det(A + B) = ' + nt(dSU) + '   ' +
          (igF(dSU, sumaDets) ? '\u2248 aquí coinciden por casualidad' : '\u2260 ' + nt(sumaDets)),
          { size: 22, weight: '700', anchor: 'start',
            fill: igF(dSU, sumaDets) ? COL.naranja : COL.rojo, family: FAM_OP });
        h += titulillo('Contraejemplo: el determinante de una suma');
        h += figura(b2, hC.x1 + 46, yP2 + 60, 'La suma de dos matrices y sus determinantes',
          'Hay que sumar primero las matrices y calcular después un único determinante: ' +
          'el resultado no tiene por qué ser la suma de los dos determinantes.');
        h += (igF(dSU, sumaDets)
          ? mal('<b>Cuidado con este caso.</b> Con estas dos matrices concretas ha salido ' +
              K('\\left|A + B\\right| = \\left|A\\right| + \\left|B\\right| = ' + FT(dSU)) +
              ', pero es una <b>casualidad</b>, no una propiedad. Cambia un número cualquiera de ' +
              K('B') + ' y verás que la igualdad se rompe al instante.')
          : mal('<b>' + K('\\left|A + B\\right| \\ne \\left|A\\right| + \\left|B\\right|') + '.</b> ' +
              'Aquí ' + K('\\left|A + B\\right| = ' + FT(dSU)) + ' mientras que ' +
              K('\\left|A\\right| + \\left|B\\right| = ' + FT(sumaDets)) + '. No hay ninguna propiedad ' +
              'que relacione el determinante de una suma con los determinantes de los sumandos: es el ' +
              'error más repetido del tema.'));
        h += parrafo('Lo que sí existe es la <b>propiedad 7</b>, que se parece pero dice otra cosa: si ' +
          '<b>una sola línea</b> de la matriz es suma de dos sumandos y <b>el resto de la matriz se ' +
          'repite igual</b>, entonces el determinante sí se parte en dos. Eso se ve en el applet ' +
          'siguiente, y no es lo mismo que sumar dos matrices enteras.');
        return h;
      }));
  };

  /* ==================================================================
     5 · applet «sumaNoSuma» · descomposición de una línea en suma
     ================================================================== */
  R.sumaNoSuma = function (node) {
    return S.shell(node, 'Una línea que es suma de dos sumandos',
      'La <b>propiedad 7</b> dice que si una línea de un determinante es <b>suma de dos sumandos</b>, ' +
      'el determinante se parte en la <b>suma de dos determinantes</b> que solo se diferencian en esa ' +
      'línea. ' + EJEMPLO + ' Elige si repartes una <b>fila</b> o una <b>columna</b>, su número (se ' +
      'cuenta <b>desde 1</b>) y escribe el <b>primer sumando</b> como una lista de números separados ' +
      'por espacios: por ejemplo, para la fila 2 de <code>3 1 2; 5 4 7; 1 0 6</code> puedes escribir ' +
      '<code>2 1 3</code>, y el segundo sumando se calcula solo (<code>3 3 4</code>). ' +
      'Admite negativos, decimales con coma y fracciones.',
      [
        {
          id: 'A', label: 'Matriz cuadrada', type: 'textarea', rows: 4,
          value: '3 1 2; 5 4 7; 1 0 6', ancho: '250px'
        },
        {
          id: 'tipo', label: 'Línea que se reparte', type: 'select', value: 'fila', ancho: '11rem',
          options: [{ value: 'fila', label: 'una fila' }, { value: 'columna', label: 'una columna' }]
        },
        { id: 'i', label: 'Número de línea', type: 'number', min: 1, max: 4, value: 2, ancho: '9rem' },
        {
          id: 'u', label: 'Primer sumando', type: 'text', value: '2 1 3', ancho: '15rem',
          place: '2 1 3'
        },
        chips([
          { txt: 'Repartir la fila 2', tip: 'F₂ = (2 1 3) + (3 3 4)',
            set: { A: '3 1 2; 5 4 7; 1 0 6', tipo: 'fila', i: 2, u: '2 1 3' } },
          { txt: 'Repartir la columna 1', tip: 'La propiedad vale igual por columnas',
            set: { A: '3 1 2; 5 4 7; 1 0 6', tipo: 'columna', i: 1, u: '1 2 0' } },
          { txt: 'Reparto con ceros', tip: 'Un sumando con ceros deja un determinante muy fácil',
            set: { A: '3 1 2; 5 4 7; 1 0 6', tipo: 'fila', i: 2, u: '5 0 0' } },
          { txt: 'Reparto con negativos', tip: 'Se admiten sumandos negativos',
            set: { A: '3 1 2; 5 4 7; 1 0 6', tipo: 'fila', i: 3, u: '-1 2 4' } },
          { txt: 'Uno de los trozos se anula', tip: 'El primer sumando repite otra fila: ese determinante es 0',
            set: { A: '3 1 2; 5 4 7; 1 0 6', tipo: 'fila', i: 2, u: '3 1 2' } },
          { txt: 'Matriz 2×2', tip: 'El caso más pequeño posible',
            set: { A: '4 7; 2 5', tipo: 'fila', i: 1, u: '1 3' } },
          { txt: 'Matriz 4×4', tip: 'La propiedad no depende del orden',
            set: { A: '2 1 0 3; 1 4 2 1; 0 2 5 1; 3 1 1 2', tipo: 'fila', i: 3, u: '0 1 2 0' } },
          { txt: 'Con fracciones', tip: 'Reparto exacto con fracciones',
            set: { A: '1/2 3 1; 2 1 4; 0 5 2', tipo: 'fila', i: 1, u: '1/4 1 0' } }
        ])
      ],
      safe(function (v) {
        var A = leeCuad(v.A, 'la matriz', 4);
        var n = A.f;
        var tipo = v.tipo === 'columna' ? 'columna' : 'fila';
        var i = leeIndice(v.i, n, tipo === 'fila' ? 'fila' : 'columna');
        var linea = lineaDe(A, tipo, i);

        var crudo = String(v.u === undefined ? '' : v.u).trim();
        if (crudo === '') {
          throw Error('Falta el primer sumando: escribe ' + n + ' números separados por espacios, ' +
            'por ejemplo ' + linea.map(function () { return '1'; }).join(' ') + '.');
        }
        var trozos = crudo.replace(/[;,\t]+/g, ' ').split(/\s+/).filter(function (t) { return t !== ''; });
        /* las comas son separador decimal en castellano: si el alumno ha escrito
           «0,5 1 2» hay que releerlo con el analizador de la capa */
        if (/\d,\d/.test(crudo)) {
          trozos = crudo.trim().split(/\s+/).filter(function (t) { return t !== ''; });
        }
        if (trozos.length !== n) {
          throw Error('El primer sumando debe tener ' + n + ' números (uno por cada elemento de la ' +
            nombreLinea(tipo, i + 1) + ') y has escrito ' + trozos.length + '. ' +
            'Sepáralos con espacios, por ejemplo ' + linea.map(function () { return '1'; }).join(' ') + '.');
        }
        var u = trozos.map(function (t) { return FR(t); });
        var w = linea.map(function (x, q) { return x.menos(u[q]); });

        var A1 = ponLinea(A, tipo, i, u);
        var A2 = ponLinea(A, tipo, i, w);
        var dA = det(A), d1 = det(A1), d2 = det(A2);
        var suma = d1.mas(d2);

        /* --- figura: los tres determinantes en fila con + y = --- */
        var cw = anchoCelda(3 * n + 3);
        var y0 = 138;
        var gA = dibujaCeldas(46, y0, n, n, function (r, c) {
          return nt(A.a[r][c]);
        }, {
          cw: cw, ch: 66, det: true, rotulo: 'determinante de partida',
          fill: resaltaLinea(tipo, i, HI.celda),
          sub: function (r, c) {
            var dentro = (tipo === 'fila' && r === i) || (tipo === 'columna' && c === i);
            if (!dentro) return null;
            var q = tipo === 'fila' ? c : r;
            return nt(u[q]) + ' + ' + pt(w[q]);
          },
          pie: 'vale ' + nt(dA)
        });
        var x1 = gA.x1 + 76;
        var g1 = dibujaCeldas(x1, y0, n, n, function (r, c) { return nt(A1.a[r][c]); }, {
          cw: cw, ch: 66, det: true, rotulo: 'primer sumando en la línea', rotuloCol: COL.verde,
          fill: resaltaLinea(tipo, i, HI.ok), pie: 'vale ' + nt(d1), pieCol: COL.verde
        });
        var x2 = g1.x1 + 76;
        var g2 = dibujaCeldas(x2, y0, n, n, function (r, c) { return nt(A2.a[r][c]); }, {
          cw: cw, ch: 66, det: true, rotulo: 'segundo sumando en la línea', rotuloCol: COL.morado,
          fill: resaltaLinea(tipo, i, HI.fila), pie: 'vale ' + nt(d2), pieCol: COL.morado
        });
        var body = '';
        body += S.txt(40, 48, 'Un determinante con una línea repartida se parte en dos determinantes',
          { size: 20, weight: '700', anchor: 'start', fill: COL.azulOsc });
        body += S.txt(40, 80, 'Se reparte la ' + nombreLinea(tipo, i + 1) +
          '; las demás líneas se copian tal cual en los dos determinantes',
          { size: 17, weight: '600', anchor: 'start', fill: COL.gris });
        body += gA.svg + g1.svg + g2.svg;
        var yMed = y0 + gA.H / 2;
        body += operador((gA.x1 + x1) / 2, yMed, '=');
        body += operador((g1.x1 + x2) / 2, yMed, '+');
        var yPie = y0 + gA.H + 96;
        body += S.txt(40, yPie, nt(dA) + ' = ' + nt(d1) + ' + ' + pt(d2) + ' = ' + nt(suma) +
          (igF(dA, suma) ? '   \u2713 se cumple' : '   \u2717'),
          { size: 24, weight: '700', anchor: 'start',
            fill: igF(dA, suma) ? COL.verde : COL.rojo, family: FAM_OP });
        var W = g2.x1 + 46, H = yPie + 60;
        var h = figura(body, W, H, 'Los tres determinantes de la descomposición',
          'El de la izquierda es el de partida; los otros dos solo se diferencian de él en la ' +
          nombreLinea(tipo, i + 1) + '.');

        h += propBox('Propiedad 7 · una línea suma de dos sumandos',
          KD('\\det(A) = \\det(A_1) + \\det(A_2)') +
          parrafo('Hemos repartido la ' + nombreLinea(tipo, i + 1) + ' así:') +
          KD(linTex(tipo, i + 1) + ' = \\left(' + u.map(function (f) { return FT(f); }).join(',\\ ') +
            '\\right) + \\left(' + w.map(function (f) { return FT(f); }).join(',\\ ') + '\\right)') +
          parrafo('El resto de la matriz <b>no se toca</b>: los dos determinantes nuevos son copias ' +
            'exactas del de partida y solo cambian en esa línea. Por eso la suma funciona.'));

        h += KD(S.detTex(A) + '=' + S.detTex(A1) + '+' + S.detTex(A2));
        h += titulillo('Comprobación numérica');
        h += S.tabla(['determinante', 'valor'], [
          ['el de partida ' + K('\\det(A)'), K(FT(dA))],
          ['con el primer sumando ' + K('\\det(A_1)'), K(FT(d1))],
          ['con el segundo sumando ' + K('\\det(A_2)'), K(FT(d2))],
          [K('\\det(A_1) + \\det(A_2)'), K(FT(suma))]
        ]);
        h += (igF(dA, suma)
          ? bien('<b>La igualdad se cumple exactamente:</b> ' +
              K('\\det(A) = ' + FT(dA) + ' = ' + FT(d1) + ' + \\left(' + FT(d2) + '\\right) = ' + FT(suma)) +
              '. Y no es casualidad: pasa siempre, con cualquier reparto de cualquier línea.')
          : mal('Algo no cuadra en el reparto; revisa el primer sumando.'));

        if (cero(d1) || cero(d2)) {
          h += parrafo(S.badge('reparto listo', 'si') + ' Uno de los dos determinantes ha salido <b>0</b>, ' +
            'así que todo el valor se concentra en el otro. Ese es exactamente el uso inteligente de la ' +
            'propiedad: repartir una línea de forma que uno de los trozos repita otra línea (o sea ' +
            'proporcional a ella) y se anule.');
        } else {
          h += pista('Prueba a repartir la línea de forma que uno de los sumandos sea <b>proporcional a ' +
            'otra línea</b> de la matriz: ese determinante valdrá 0 y te ahorrarás la mitad del trabajo.');
        }

        /* --- el contraste con |A + B| --- */
        var SU = S.matSuma(A1, A2);
        var dSU = det(SU);
        h += titulillo('Y esto NO es lo mismo que sumar dos matrices');
        h += parrafo('Si en lugar de repartir <b>una sola línea</b> sumas las dos matrices ' +
          K('A_1') + ' y ' + K('A_2') + ' <b>enteras</b>, sale otra matriz distinta, porque todas las ' +
          'demás líneas se suman también consigo mismas y quedan duplicadas:');
        h += KD('A_1 + A_2 = ' + S.matTex(SU));
        h += S.kvs([
          K('\\det(A_1) + \\det(A_2)') + ' = <b>' + nt(suma) + '</b>',
          K('\\det(A_1 + A_2)') + ' = <b>' + nt(dSU) + '</b>',
          K('\\det(A)') + ' = <b>' + nt(dA) + '</b>'
        ]);
        h += (igF(dSU, suma)
          ? parrafo(S.badge('casualidad', 'info') + ' Con estos números concretos ' +
              K('\\det(A_1 + A_2)') + ' ha coincidido con ' + K('\\det(A_1) + \\det(A_2)') + ', pero no ' +
              'hay ninguna propiedad detrás: cambia un número y se rompe.')
          : mal('<b>' + K('\\det(A_1 + A_2) = ' + FT(dSU)) + '</b> frente a <b>' +
              K('\\det(A_1) + \\det(A_2) = ' + FT(suma)) + '</b>. Son valores distintos: ' +
              K('\\left|A + B\\right| \\ne \\left|A\\right| + \\left|B\\right|') + '. ' +
              'La propiedad 7 solo reparte <b>una línea</b>, dejando el resto de la matriz intacto.'));
        h += parrafo('Resumen para no confundirse nunca más: ' +
          K('\\left|A\\cdot B\\right| = \\left|A\\right|\\cdot\\left|B\\right|') + ' <b>sí</b>; ' +
          K('\\left|A + B\\right| = \\left|A\\right| + \\left|B\\right|') + ' <b>no</b>; y la ' +
          'descomposición de <b>una línea</b> en suma <b>sí</b>, porque el resto de la matriz se repite.');
        return h;
      }));
  };

  /* ==================================================================
     6 · applet «factorComun» · sacar factor común de una línea
     ================================================================== */

  /* Factores comunes disponibles ahora mismo, leídos de la capa. */
  function factoresDe(M) {
    var lista = [];
    capa().detPropiedades(M).forEach(function (p) {
      if (p.clave === 'factorFila' || p.clave === 'factorColumna') {
        lista.push({
          tipo: p.clave === 'factorFila' ? 'fila' : 'columna',
          indice: p.lineas[0].indice, indice1: p.lineas[0].indice1,
          factor: p.factor, descripcion: p.descripcion
        });
      }
    });
    return lista;
  }
  function buscaFactor(lista, tipo, i) {
    var r = null;
    lista.forEach(function (f) { if (f.tipo === tipo && f.indice === i) r = f; });
    return r;
  }

  R.factorComun = function (node) {
    var hist = [];
    function limpia() { hist.length = 0; }

    return S.shell(node, 'Sacar factor común de una línea',
      'Si todos los elementos de una línea son múltiplos de un mismo número ' + K('k') + ', ese ' +
      'número <b>sale fuera</b> del determinante y dentro queda la línea dividida entre ' + K('k') + ': ' +
      'es la propiedad 5 leída al revés. ' + EJEMPLO + ' El applet detecta solo el mayor factor común ' +
      'de cada fila y de cada columna y te los ofrece. Elige la línea, pulsa <b>Extraer el factor</b> ' +
      'y repítelo: los factores se van encadenando fuera del determinante. Con <b>Extraer todos</b> lo ' +
      'hace de una vez, y con <b>Deshacer</b> o <b>Reiniciar</b> vuelves atrás. ' +
      'Ejemplo copiable: <code>4 8 12; 3 6 9; 5 10 15</code>.',
      [
        {
          id: 'A', label: 'Matriz cuadrada', type: 'textarea', rows: 4,
          value: '4 8 12; 3 6 9; 5 10 20', ancho: '260px'
        },
        {
          id: 'tipo', label: 'Línea', type: 'select', value: 'fila', ancho: '11rem',
          options: [{ value: 'fila', label: 'fila' }, { value: 'columna', label: 'columna' }]
        },
        { id: 'i', label: 'Número de línea', type: 'number', min: 1, max: 5, value: 1, ancho: '9rem' },
        {
          id: 'extraer', label: 'Extraer el factor', type: 'button',
          click: function (ctl) {
            hist.push({ tipo: String(ctl.tipo.value), i: Number(ctl.i.value) });
          }
        },
        { id: 'todos', label: 'Extraer todos', type: 'button', click: function () { hist.push({ todos: true }); } },
        { id: 'deshacer', label: 'Deshacer', type: 'button', click: function () { hist.pop(); } },
        { id: 'reiniciar', label: 'Reiniciar', type: 'button', click: function () { limpia(); } },
        chips([
          { txt: 'Factor en cada fila', tip: 'Las tres filas tienen factor común',
            set: { A: '4 8 12; 3 6 9; 5 10 20', tipo: 'fila', i: 1 }, extra: limpia },
          { txt: 'Factor en una columna', tip: 'La columna 2 es toda múltiplo de 5',
            set: { A: '2 5 1; 3 10 4; 1 15 2', tipo: 'columna', i: 2 }, extra: limpia },
          { txt: 'Cadena de tres extracciones', tip: 'Se extraen las tres filas de golpe',
            set: { A: '4 8 12; 3 6 9; 5 10 20', tipo: 'fila', i: 1 },
            extra: function () {
              limpia();
              hist.push({ tipo: 'fila', i: 1 });
              hist.push({ tipo: 'fila', i: 2 });
              hist.push({ tipo: 'fila', i: 3 });
            } },
          { txt: 'Hasta dejarlo mínimo', tip: 'Extraer todo lo que se pueda, filas y columnas',
            set: { A: '6 12 18; 4 8 12; 10 20 30', tipo: 'fila', i: 1 },
            extra: function () { limpia(); hist.push({ todos: true }); } },
          { txt: 'Determinante que se anula', tip: 'Al extraer se ven dos filas iguales',
            set: { A: '2 4 6; 3 6 9; 1 5 2', tipo: 'fila', i: 1 },
            extra: function () { limpia(); hist.push({ todos: true }); } },
          { txt: 'Matriz 4×4', tip: 'Factores comunes en un orden mayor',
            set: { A: '2 4 6 8; 3 3 9 6; 5 10 5 15; 4 8 12 4', tipo: 'fila', i: 1 },
            extra: function () { limpia(); hist.push({ todos: true }); } },
          { txt: 'Con fracciones', tip: 'El factor común también puede ser una fracción',
            set: { A: '1/2 1 3/2; 2 4 6; 1 3 5', tipo: 'fila', i: 1 }, extra: limpia },
          { txt: 'Sin factores comunes', tip: 'El applet lo dice claramente',
            set: { A: '2 3 5; 7 11 13; 1 4 9', tipo: 'fila', i: 1 }, extra: limpia }
        ])
      ],
      safe(function (v) {
        var A = leeCuad(v.A, 'la matriz', 5);
        var n = A.f;
        var dA = det(A);

        var actual = A.copia(), factores = [], avs = [], pasosHtml = '', filas = [];
        function anota(idx, msg) { avs.length = 0; if (idx === hist.length - 1) avs.push(msg); }

        function extrae(f) {
          var vals = lineaDe(actual, f.tipo, f.indice);
          actual = ponLinea(actual, f.tipo, f.indice,
            vals.map(function (x) { return x.entre(f.factor); }));
          factores.push({ tipo: f.tipo, indice1: f.indice1, factor: f.factor, matriz: actual.copia() });
        }

        hist.forEach(function (o, idx) {
          if (o.todos) {
            var vueltas = 0, disp;
            while (vueltas < 24) {
              disp = factoresDe(actual);
              if (!disp.length) break;
              extrae(disp[0]);
              vueltas++;
            }
            if (!vueltas) anota(idx, 'Ya no queda ningún factor común que extraer en esta matriz.');
            return;
          }
          var i;
          try { i = leeIndice(o.i, n, o.tipo === 'fila' ? 'fila' : 'columna'); }
          catch (e) { anota(idx, e.message); return; }
          var disponible = buscaFactor(factoresDe(actual), o.tipo, i);
          if (!disponible) {
            anota(idx, 'La ' + nombreLinea(o.tipo, i + 1) + ' no tiene ningún factor común mayor que 1: ' +
              'no hay nada que sacar fuera de ahí. Prueba con otra línea o mira la lista de factores ' +
              'que el applet ha detectado.');
            return;
          }
          extrae(disponible);
        });

        var dActual = det(actual);
        var fuera = prodDe(factores.map(function (f) { return f.factor; }));
        var reconstruido = fuera.por(dActual);

        /* --- figura: factores fuera y determinante reducido --- */
        var cw = anchoCelda(n + 2);
        var etiqFuera = factores.length
          ? factores.map(function (f) { return nt(f.factor); }).join(' \u00b7 ') + ' \u00b7 '
          : '';
        var xDet = 60 + (etiqFuera.length * 13);
        var y0 = 132;
        var disponibles = factoresDe(actual);
        var g = dibujaMat(xDet, y0, actual, {
          cw: cw, det: true,
          rotulo: factores.length ? 'determinante que queda dentro' : 'determinante de partida',
          fill: function (r, c) {
            var hit = null;
            disponibles.forEach(function (f) {
              if (f.tipo === 'fila' && f.indice === r) hit = HI.ok;
              if (f.tipo === 'columna' && f.indice === c && !hit) hit = HI.col;
            });
            return hit;
          },
          pie: 'vale ' + nt(dActual)
        });
        var body = '';
        body += S.txt(40, 48, 'Los factores comunes salen fuera y el determinante se queda más limpio',
          { size: 20, weight: '700', anchor: 'start', fill: COL.azulOsc });
        body += S.txt(40, 78, factores.length
          ? factores.length + ' factor' + (factores.length === 1 ? '' : 'es') + ' extraído' +
            (factores.length === 1 ? '' : 's') + ' \u00b7 quedan ' + disponibles.length + ' por extraer'
          : 'Todavía no has extraído ningún factor \u00b7 hay ' + disponibles.length +
            ' disponible' + (disponibles.length === 1 ? '' : 's'),
          { size: 17, weight: '600', anchor: 'start', fill: COL.gris });
        if (etiqFuera) {
          body += S.txt(46, y0 + g.H / 2 + 10, etiqFuera,
            { size: 26, weight: '700', anchor: 'start', fill: COL.naranja, family: FAM_OP });
        }
        body += g.svg;
        var yPie = g.y1 + 84;
        body += S.txt(40, yPie, 'det(A) = ' + (etiqFuera || '') + nt(dActual) + ' = ' + nt(reconstruido),
          { size: 22, weight: '700', anchor: 'start',
            fill: igF(reconstruido, dA) ? COL.verde : COL.rojo, family: FAM_OP });
        var W = Math.max(g.x1 + 60, 780), H = yPie + 40;
        var h = figura(body, W, H, 'Factores comunes extraídos y determinante restante',
          'Cada factor que sale fuera multiplica al determinante que queda dentro.');

        h += avisos(avs);

        /* --- lo que se ha detectado ahora mismo --- */
        h += titulillo('Factores comunes detectados en la matriz actual');
        if (disponibles.length) {
          h += S.tabla(['línea', 'mayor factor común', 'cómo quedaría la línea'],
            disponibles.map(function (f) {
              var vals = lineaDe(actual, f.tipo, f.indice);
              return [
                K(linTex(f.tipo, f.indice1)),
                K(FT(f.factor)),
                K('\\left(' + vals.map(function (x) { return FT(x.entre(f.factor)); }).join(',\\ ') + '\\right)')
              ];
            }));
          h += pista('Elige una de esas líneas en los controles y pulsa <b>Extraer el factor</b>, ' +
            'o usa <b>Extraer todos</b> para encadenarlos.');
        } else {
          h += parrafo(S.badge('no queda nada que extraer', 'info') + ' Ninguna fila ni ninguna columna ' +
            'de la matriz actual tiene un factor común mayor que 1: este determinante ya está en su ' +
            'forma más simple para este atajo.');
        }

        /* --- la cadena de extracciones --- */
        if (factores.length) {
          h += titulillo('Cadena de extracciones');
          var texto = S.detTex(A);
          factores.forEach(function (f, q) {
            var acumulado = factores.slice(0, q + 1).map(function (g2) { return FT(g2.factor); }).join('\\cdot ');
            pasosHtml += S.paso(String(q + 1),
              '<p>' + S.texifica('Sacamos el factor ' + K(FT(f.factor)) + ' de la ' +
                nombreLinea(f.tipo, f.indice1) + ': todos sus elementos eran múltiplos de ' +
                K(FT(f.factor)) + ', así que se dividen entre él y el factor sale fuera.') + '</p>' +
              KD(acumulado + '\\cdot' + S.detTex(f.matriz)),
              'detb-ok');
            filas.push([String(q + 1), K(linTex(f.tipo, f.indice1)), K(FT(f.factor)),
              K(FT(det(f.matriz)))]);
          });
          h += pasosHtml;
          h += KD(texto + '=' + factores.map(function (f) { return FT(f.factor); }).join('\\cdot ') +
            '\\cdot' + S.detTex(actual) + '=' + FT(fuera) + '\\cdot' + FT(dActual) + '=' + FT(reconstruido));
          h += S.tabla(['paso', 'línea', 'factor extraído', 'determinante que queda'], filas);
          h += (igF(reconstruido, dA)
            ? bien('<b>Comprobado:</b> el producto de los factores extraídos por el determinante que ' +
                'queda dentro, ' + K(FT(fuera) + '\\cdot' + FT(dActual) + '=' + FT(reconstruido)) +
                ', coincide con el determinante de partida ' + K(FT(dA)) + '. Sacar factor común no ' +
                'pierde información: solo reparte el trabajo.')
            : mal('El producto de los factores por el determinante restante no coincide con el de ' +
                'partida: revisa las extracciones.'));
        } else {
          h += pista('Todavía no has extraído ningún factor. El determinante de partida vale ' +
            K(FT(dA)) + '.');
        }

        /* --- lectura final --- */
        var props = capa().detPropiedades(actual);
        var anulan = props.filter(function (p) { return p.anula; });
        if (anulan.length) {
          h += propBox('¡Mira lo que ha aparecido al simplificar!',
            parrafo(anulan[0].descripcion) +
            parrafo('Con eso el determinante que queda dentro vale <b>0</b>, y por tanto todo el ' +
              'determinante de partida vale 0 sin necesidad de calcular nada más.'));
        }
        h += parrafo(S.badge('cuidado', 'info') + ' Sacar factor común de <b>una línea</b> no es lo mismo ' +
          'que sacarlo de <b>toda la matriz</b>. Si multiplicas por ' + K('k') + ' las ' + n +
          ' líneas, el determinante queda multiplicado por ' + K('k^{' + n + '}') + ', no por ' + K('k') +
          ': esa es la fórmula ' + K('\\left|kA\\right| = k^{n}\\left|A\\right|') + '.');
        return h;
      }));
  };

  /* ==================================================================
     7 · applet «atajos» · detector de atajos
     ================================================================== */

  /* Etiqueta corta para cada clave de detPropiedades. */
  var ETIQ = {
    nula: 'matriz nula',
    filaNula: 'una fila de ceros',
    columnaNula: 'una columna de ceros',
    filasIguales: 'dos filas iguales',
    filasProporcionales: 'dos filas proporcionales',
    columnasIguales: 'dos columnas iguales',
    columnasProporcionales: 'dos columnas proporcionales',
    triangular: 'matriz triangular o diagonal',
    factorFila: 'factor común en una fila',
    factorColumna: 'factor común en una columna',
    combinacionLineal: 'una línea es combinación lineal de las otras',
    lineaConCeros: 'una línea con muchos ceros'
  };

  /* Elige la estrategia más económica a partir de lo detectado. */
  function eligeEstrategia(A, props) {
    var anula = null, tri = null, facs = [], ceros = null, q;
    for (q = 0; q < props.length; q++) {
      var p = props[q];
      if (p.anula && !anula) anula = p;
      if (p.clave === 'triangular' && !tri) tri = p;
      if (p.clave === 'factorFila' || p.clave === 'factorColumna') facs.push(p);
      if (p.clave === 'lineaConCeros' && !ceros) ceros = p;
    }
    if (anula) return { clave: 'anula', prop: anula };
    if (tri) return { clave: 'triangular', prop: tri };
    if (facs.length) return { clave: 'factores', props: facs };
    if (ceros) return { clave: 'ceros', prop: ceros };
    return { clave: 'general' };
  }

  R.atajos = function (node) {
    return S.shell(node, 'Detector de atajos',
      'Pega aquí un determinante y, <b>antes de calcular nada</b>, el applet lo examina y te dice ' +
      'qué se puede aprovechar: una línea de ceros, dos líneas iguales, dos proporcionales, una que ' +
      'es combinación lineal de las otras, que la matriz sea triangular o que haya factores comunes. ' +
      'Después propone la <b>estrategia más económica</b> y la ejecuta hasta el final. ' +
      'Si no hay ningún atajo, lo dice y calcula por el método general. ' + EJEMPLO,
      [
        {
          id: 'A', label: 'Matriz cuadrada', type: 'textarea', rows: 5,
          value: '2 4 6; 1 2 3; 5 0 7', ancho: '270px'
        },
        {
          id: 'ver', label: 'Ver también el cálculo general', type: 'check', value: false
        },
        chips([
          { txt: 'Dos filas proporcionales', tip: 'F₁ = 2·F₂: el determinante es 0',
            set: { A: '2 4 6; 1 2 3; 5 0 7' } },
          { txt: 'Una fila de ceros', tip: 'El atajo más rápido de todos',
            set: { A: '3 1 4; 0 0 0; 2 5 1' } },
          { txt: 'Dos columnas iguales', tip: 'C₁ = C₃', set: { A: '2 1 2; 5 3 5; 4 0 4' } },
          { txt: 'Triangular superior', tip: 'Producto de la diagonal',
            set: { A: '3 7 2; 0 -1 5; 0 0 4' } },
          { txt: 'Factores comunes', tip: 'Se sacan fuera antes de calcular',
            set: { A: '4 8 12; 3 6 9; 5 10 20' } },
          { txt: 'Combinación lineal', tip: 'F₃ = F₁ + F₂', set: { A: '1 2 3; 4 5 6; 5 7 9' } },
          { txt: 'Línea con muchos ceros', tip: 'Conviene desarrollar por ahí',
            set: { A: '2 0 0 1; 3 1 4 2; 1 5 2 0; 4 1 1 3' } },
          { txt: 'Sin ningún atajo', tip: 'Toca el método general', set: { A: '2 3 5; 7 1 4; 3 8 6' } },
          { txt: 'Matriz 4×4 con atajo', tip: 'Dos columnas proporcionales en orden 4',
            set: { A: '1 2 3 4; 2 4 1 0; 5 10 2 3; 1 2 0 6' } },
          { txt: 'Matriz al azar', tip: 'A ver qué encuentra', set: {},
            extra: function (ctl) { ctl.A.value = S.matTxt(S.matAleatoria(3, 3, { min: -5, max: 6 })); } }
        ])
      ],
      safe(function (v) {
        var A = leeCuad(v.A, 'la matriz', 5);
        var n = A.f;
        var props = capa().detPropiedades(A);
        var est = eligeEstrategia(A, props);
        var dA = det(A);

        /* --- figura: la matriz con las líneas del atajo resaltadas --- */
        var marcadas = [];
        if (est.prop && est.prop.lineas) marcadas = est.prop.lineas;
        if (est.props) est.props.forEach(function (p) { marcadas = marcadas.concat(p.lineas); });
        function pinta(i, j) {
          var col = null;
          if (est.clave === 'triangular') {
            if (i === j) col = HI.diag;
            return col;
          }
          marcadas.forEach(function (L) {
            if (L.tipo === 'fila' && L.indice === i) col = HI.fila;
            else if (L.tipo === 'columna' && L.indice === j && !col) col = HI.col;
          });
          return col;
        }
        var cw = anchoCelda(n + 2);
        var y0 = 138;
        var g = dibujaMat(60, y0, A, {
          cw: cw, det: true, fill: pinta,
          rotulo: 'determinante de orden ' + n,
          pie: props.length
            ? 'atajos detectados: ' + props.length
            : 'sin atajos: método general'
        });
        var body = '';
        body += S.txt(40, 48, props.length
          ? 'Antes de calcular: este determinante tiene atajo'
          : 'Antes de calcular: aquí no hay ningún atajo',
          { size: 21, weight: '700', anchor: 'start', fill: props.length ? COL.verde : COL.naranja });
        body += S.txt(40, 80, props.length
          ? 'Estrategia elegida: ' + ({
              anula: 'una propiedad anula el determinante',
              triangular: 'producto de la diagonal principal',
              factores: 'sacar factores comunes y luego calcular',
              ceros: 'desarrollar por la línea con más ceros',
              general: 'método general'
            })[est.clave]
          : 'Se calcula por el método general del orden ' + n,
          { size: 17, weight: '600', anchor: 'start', fill: COL.gris });
        body += g.svg;
        var xTxt = g.x1 + 40;
        var yL = y0 + 12;
        if (props.length) {
          props.slice(0, 6).forEach(function (p, q) {
            body += S.txt(xTxt, yL + q * 30, '\u2022 ' + (ETIQ[p.clave] || p.clave),
              { size: 17, weight: '700', anchor: 'start',
                fill: p.anula ? COL.rojo : COL.azulOsc, family: FAM_OP });
          });
        } else {
          body += S.txt(xTxt, yL, 'ninguna línea de ceros',
            { size: 17, weight: '600', anchor: 'start', fill: COL.gris });
          body += S.txt(xTxt, yL + 28, 'ninguna pareja igual ni proporcional',
            { size: 17, weight: '600', anchor: 'start', fill: COL.gris });
          body += S.txt(xTxt, yL + 56, 'ningún factor común',
            { size: 17, weight: '600', anchor: 'start', fill: COL.gris });
          body += S.txt(xTxt, yL + 84, 'no es triangular',
            { size: 17, weight: '600', anchor: 'start', fill: COL.gris });
        }
        var yPie = g.y1 + 84;
        body += S.txt(40, yPie, 'valor final del determinante: ' + nt(dA),
          { size: 22, weight: '700', anchor: 'start', fill: COL.azulOsc, family: FAM_OP });
        var W = Math.max(xTxt + 400, g.x1 + 60), H = yPie + 40;
        var h = figura(body, W, H, 'Atajos detectados en el determinante',
          'Las líneas resaltadas son las que intervienen en el atajo propuesto.');

        /* --- informe de lo detectado --- */
        h += titulillo('Qué ha visto el applet antes de calcular');
        if (props.length) {
          h += S.tabla(['atajo', 'qué significa', 'efecto'],
            props.map(function (p) {
              return [
                '<b>' + S.esc(ETIQ[p.clave] || p.clave) + '</b>',
                S.texifica(p.descripcion),
                p.anula ? '<span class="detb-ko">anula el determinante</span>'
                  : (p.tipo === 'simplifica' ? 'simplifica el cálculo' : 'información útil')
              ];
            }));
        } else {
          h += parrafo(S.badge('sin atajos', 'no') + ' Ninguna línea es de ceros, no hay dos líneas ' +
            'iguales ni proporcionales, no hay factores comunes, la matriz no es triangular y ninguna ' +
            'línea es combinación lineal de las otras. Toca calcular.');
        }

        /* --- ejecución de la estrategia --- */
        h += titulillo('Estrategia más económica y su ejecución');
        var pasos = '', resumen = '';
        if (est.clave === 'anula') {
          var p0 = est.prop;
          pasos += S.paso('1', '<p>' + S.texifica(p0.descripcion) + '</p>' +
            (p0.tex ? KD(p0.tex) : ''), 'detb-ok');
          pasos += S.paso('2', '<p>' + S.texifica('Por esa propiedad el determinante vale <b>0</b> ' +
            'directamente: no hace falta ni Sarrus ni desarrollo por adjuntos.') + '</p>' +
            KD(S.detTex(A) + '= 0'), 'detb-ok');
          resumen = 'Cero operaciones. La propiedad «' + (ETIQ[p0.clave] || p0.clave) +
            '» resuelve el determinante de un vistazo.';
        } else if (est.clave === 'triangular') {
          var diag = [], q1;
          for (q1 = 0; q1 < n; q1++) diag.push(A.a[q1][q1]);
          var pr = prodDe(diag);
          pasos += S.paso('1', '<p>' + S.texifica(est.prop.descripcion) + '</p>', 'detb-ok');
          pasos += S.paso('2', '<p>' + S.texifica('En una matriz triangular el determinante es el ' +
            '<b>producto de la diagonal principal</b>.') + '</p>' +
            KD(S.detTex(A) + '=' + prodTex(diag) + '=' + FT(pr)), 'detb-ok');
          resumen = 'Solo ' + (n - 1) + ' multiplicación' + (n - 1 === 1 ? '' : 'es') +
            ', frente a las decenas de productos del método general.';
        } else if (est.clave === 'factores') {
          var actual = A.copia(), sacados = [], vueltas = 0;
          while (vueltas < 20) {
            var disp = factoresDe(actual);
            if (!disp.length) break;
            var f = disp[0];
            var vals = lineaDe(actual, f.tipo, f.indice);
            actual = ponLinea(actual, f.tipo, f.indice,
              vals.map(function (x) { return x.entre(f.factor); }));
            sacados.push({ f: f, M: actual.copia() });
            vueltas++;
          }
          sacados.forEach(function (s, q2) {
            pasos += S.paso(String(q2 + 1), '<p>' + S.texifica('Sacamos el factor ' +
              K(FT(s.f.factor)) + ' de la ' + nombreLinea(s.f.tipo, s.f.indice1) + '.') + '</p>' +
              KD(sacados.slice(0, q2 + 1).map(function (z) { return FT(z.f.factor); }).join('\\cdot ') +
                '\\cdot' + S.detTex(s.M)), 'detb-ok');
          });
          var fuera = prodDe(sacados.map(function (s) { return s.f.factor; }));
          var dRest = det(actual);
          var propsFin = capa().detPropiedades(actual);
          var anulaFin = null;
          propsFin.forEach(function (p) { if (p.anula && !anulaFin) anulaFin = p; });
          pasos += S.paso(String(sacados.length + 1),
            '<p>' + S.texifica(anulaFin
              ? 'Y ahora se ve a simple vista: ' + anulaFin.descripcion + ' El determinante que ' +
                'queda dentro vale 0, así que todo vale 0.'
              : 'El determinante que queda dentro vale ' + K(FT(dRest)) + '.') + '</p>' +
            KD(S.detTex(A) + '=' + FT(fuera) + '\\cdot' + FT(dRest) + '=' + FT(dA)), 'detb-ok');
          resumen = 'Se han sacado ' + sacados.length + ' factor' + (sacados.length === 1 ? '' : 'es') +
            ' fuera: los números de dentro son mucho más pequeños y la cuenta final es inmediata.';
        } else if (est.clave === 'ceros') {
          var mej = capa().mejorLinea(A);
          var des = capa().desarrollo(A, mej.tipo, mej.indice);
          pasos += S.paso('1', '<p>' + S.texifica(mej.descripcion) + '</p>', 'detb-ok');
          pasos += S.paso('2', '<p>' + S.texifica('Desarrollamos por la ' +
            nombreLinea(mej.tipo, mej.indice1) + ': los sumandos con elemento 0 desaparecen, así que ' +
            'solo hay que calcular ' + (n - des.ceros) + ' menor' + (n - des.ceros === 1 ? '' : 'es') +
            ' en vez de ' + n + '.') + '</p>' + KD(des.tex), 'detb-ok');
          pasos += S.paso('3', '<p>' + S.texifica('Sumando los términos que quedan:') + '</p>' +
            KD(S.detTex(A) + '=' + FT(des.total)), 'detb-ok');
          resumen = 'La línea elegida tiene ' + des.ceros + ' cero' + (des.ceros === 1 ? '' : 's') +
            ': cada cero es un menor de orden ' + (n - 1) + ' que no hay que calcular.';
        } else {
          if (n === 1) {
            pasos += S.paso('1', '<p>' + S.texifica('Un determinante de orden 1 es el propio ' +
              'elemento.') + '</p>' + KD(S.detTex(A) + '=' + FT(dA)), 'detb-paso0');
          } else if (n === 2) {
            pasos += S.paso('1', '<p>' + S.texifica('Orden 2: producto de la diagonal principal ' +
              'menos producto de la secundaria.') + '</p>' +
              KD(S.detTex(A) + '=' + S.parNegTex(FT(A.a[0][0])) + '\\cdot' +
                S.parNegTex(FT(A.a[1][1])) + '-' + S.parNegTex(FT(A.a[0][1])) + '\\cdot' +
                S.parNegTex(FT(A.a[1][0])) + '=' + FT(dA)), 'detb-paso0');
          } else if (n === 3) {
            var sa = capa().sarrus(A);
            pasos += S.paso('1', '<p>' + S.texifica('Orden 3 sin atajos: regla de Sarrus.') + '</p>' +
              KD(sa.tex), 'detb-paso0');
            pasos += S.paso('2', '<p>' + S.texifica('Productos positivos: ' + K(FT(sa.sumaPositivos)) +
              '; productos negativos: ' + K(FT(sa.sumaNegativos)) + '.') + '</p>' +
              KD(S.detTex(A) + '=' + FT(sa.sumaPositivos) + '-\\left(' + FT(sa.sumaNegativos) +
                '\\right)=' + FT(dA)), 'detb-paso0');
            resumen = 'Seis productos de tres factores y una resta: es lo que cuesta un orden 3 ' +
              'cuando no hay nada que aprovechar.';
          } else {
            var hc = capa().hacerCeros(A);
            hc.pasos.forEach(function (p, q3) {
              if (q3 > 7) return;
              pasos += S.paso(String(q3 + 1), '<p>' + S.texifica(p.descripcion) + '</p>' +
                (p.tex ? KD(p.tex) : ''), 'detb-paso0');
            });
            pasos += S.paso('final', '<p>' + S.texifica('Valor del determinante:') + '</p>' +
              KD(S.detTex(A) + '=' + FT(hc.total)), 'detb-paso0');
            resumen = 'Sin atajos, en orden ' + n + ' lo más barato es hacer ceros en una columna ' +
              'con operaciones ' + K('F_i \\to F_i + k\\cdot F_j') + ' y bajar de orden.';
          }
          if (!resumen) resumen = 'El cálculo directo es tan corto que no compensa buscar atajos.';
        }
        h += pasos;
        h += parrafo('<b>Por qué esta estrategia:</b> ' + S.texifica(resumen));
        h += S.resultado(nt(dA), 'valor del determinante');

        /* --- comprobación y método general opcional --- */
        var comprobado = est.clave === 'anula' ? cero(dA) : true;
        h += (comprobado
          ? bien('El atajo y el cálculo exacto de la capa coinciden: ' +
              K(S.detTex(A) + '=' + FT(dA)) + '.')
          : mal('El atajo y el cálculo exacto no coinciden; revisa los datos.'));

        if (v.ver) {
          h += titulillo('El mismo determinante por el método general');
          if (n === 3) {
            h += KD(capa().sarrus(A).tex);
            h += parrafo('Compara: por Sarrus hay que hacer <b>seis productos de tres factores</b> ' +
              'y una resta; con el atajo, ' +
              (est.clave === 'anula' ? '<b>ninguna cuenta</b>.' : 'bastante menos.'));
          } else {
            var mj = capa().mejorLinea(A);
            var dg = capa().desarrollo(A, mj.tipo, mj.indice);
            h += KD(dg.tex);
            h += KD(S.detTex(A) + '=' + FT(dg.total));
            h += parrafo('Por el desarrollo por adjuntos hay que calcular hasta <b>' + n +
              ' menores de orden ' + (n - 1) + '</b>. El atajo evita buena parte de ese trabajo.');
          }
        } else {
          h += pista('Marca <b>Ver también el cálculo general</b> para comparar el atajo con el ' +
            'camino largo y comprobar que dan lo mismo.');
        }
        return h;
      }));
  };

  /* ==================================================================
     8 · applet «retoPropiedades» · reto autocorregido
     ================================================================== */

  /* Generador pseudoaleatorio determinista: la misma semilla da el mismo
     reto siempre, para que profesor y alumno vean lo mismo. */
  function dado(semilla) {
    var s = (Math.abs(Math.round(Number(semilla) || 1)) % 2147483647) || 1;
    return function (a, b) {
      s = (s * 1103515245 + 12345) % 2147483648;
      var u = s / 2147483648;
      return a + Math.floor(u * (b - a + 1));
    };
  }
  function noNulo(d, a, b) {
    var q = 0, x;
    do { x = d(a, b); q++; } while (x === 0 && q < 12);
    return x === 0 ? 1 : x;
  }

  var TIPOS_RETO = [
    { clave: 'filaNula', nombre: 'línea de ceros' },
    { clave: 'iguales', nombre: 'dos líneas iguales' },
    { clave: 'proporcionales', nombre: 'dos líneas proporcionales' },
    { clave: 'colProporcionales', nombre: 'dos columnas proporcionales' },
    { clave: 'combinacion', nombre: 'línea combinación lineal' },
    { clave: 'triangular', nombre: 'matriz triangular' },
    { clave: 'diagonal', nombre: 'matriz diagonal' },
    { clave: 'factorTriangular', nombre: 'factor común y triangular' }
  ];

  /* Construye un reto a partir de la semilla y del número de reto. */
  function generaReto(semillaBase, numero, forzado) {
    var d = dado(Number(semillaBase || 1) * 7919 + Number(numero || 1) * 104729);
    var tipo = forzado && forzado !== 'aleatorio'
      ? forzado
      : TIPOS_RETO[d(0, TIPOS_RETO.length - 1)].clave;
    var n = d(0, 10) < 6 ? 3 : (d(0, 10) < 8 ? 4 : 3);
    var a = [], i, j;
    for (i = 0; i < n; i++) {
      a[i] = [];
      for (j = 0; j < n; j++) a[i][j] = new Frac(d(-6, 8));
    }
    var cadena = [], titulo = '', pistaTxt = '';

    function fila(i2) { var v = [], q; for (q = 0; q < n; q++) v.push(a[i2][q]); return v; }
    function ponFila(i2, v) { var q; for (q = 0; q < n; q++) a[i2][q] = v[q]; }
    function ponCol(j2, v) { var q; for (q = 0; q < n; q++) a[q][j2] = v[q]; }
    function col(j2) { var v = [], q; for (q = 0; q < n; q++) v.push(a[q][j2]); return v; }

    if (tipo === 'filaNula') {
      var iz = d(0, n - 1);
      ponFila(iz, fila(iz).map(function () { return F0(); }));
      titulo = 'Una línea de ceros';
      cadena = [
        'La ' + nombreLinea('fila', iz + 1) + ' es <b>toda de ceros</b>.',
        'Propiedad 2: si una línea de un determinante es toda de ceros, el determinante vale <b>0</b>.',
        'No hace falta ninguna cuenta: el valor es 0.'
      ];
      pistaTxt = 'Mira si alguna fila o columna es toda de ceros.';
    } else if (tipo === 'iguales') {
      var i1 = d(0, n - 1), i2b = (i1 + 1 + d(0, n - 2)) % n;
      ponFila(i2b, fila(i1));
      titulo = 'Dos líneas iguales';
      cadena = [
        'La ' + nombreLinea('fila', i1 + 1) + ' y la ' + nombreLinea('fila', i2b + 1) +
          ' son <b>idénticas</b>.',
        'Propiedad 4: un determinante con dos líneas iguales vale <b>0</b>.',
        'Se ve enseguida con la propiedad 3: al intercambiarlas el determinante cambia de signo, ' +
          'pero la matriz no cambia; el único número que es igual a su opuesto es el 0.'
      ];
      pistaTxt = 'Compara las filas de dos en dos: ¿hay dos exactamente iguales?';
    } else if (tipo === 'proporcionales') {
      var f1 = d(0, n - 1), f2 = (f1 + 1 + d(0, n - 2)) % n, k1 = noNulo(d, -4, 5);
      if (k1 === 1) k1 = 3;
      ponFila(f2, porK(fila(f1), new Frac(k1)));
      titulo = 'Dos líneas proporcionales';
      cadena = [
        lin('fila', f2 + 1) + ' = ' + k1 + ' \u00b7 ' + lin('fila', f1 + 1) + ': las dos filas son ' +
          '<b>proporcionales</b>.',
        'Propiedad 5: se saca el factor ' + k1 + ' fuera de la ' + nombreLinea('fila', f2 + 1) + '.',
        'Dentro quedan dos filas <b>iguales</b>, y por la propiedad 4 ese determinante vale 0.',
        'Total: ' + k1 + ' · 0 = <b>0</b>.'
      ];
      pistaTxt = 'Divide una fila entre otra elemento a elemento: si sale siempre el mismo número, ' +
        'son proporcionales.';
    } else if (tipo === 'colProporcionales') {
      var c1 = d(0, n - 1), c2 = (c1 + 1 + d(0, n - 2)) % n, k2 = noNulo(d, -3, 4);
      if (k2 === 1) k2 = 2;
      ponCol(c2, porK(col(c1), new Frac(k2)));
      titulo = 'Dos columnas proporcionales';
      cadena = [
        lin('columna', c2 + 1) + ' = ' + k2 + ' \u00b7 ' + lin('columna', c1 + 1) + '.',
        'Propiedad 1: lo que vale para las filas vale para las columnas, porque ' +
          '|Aᵗ| = |A|.',
        'Se saca el ' + k2 + ' fuera y quedan dos columnas iguales: el determinante vale <b>0</b>.'
      ];
      pistaTxt = 'No mires solo las filas: las columnas también cuentan.';
    } else if (tipo === 'combinacion') {
      var kk = noNulo(d, 1, 3);
      ponFila(n - 1, fila(0).map(function (x, q) { return x.por(new Frac(kk)).mas(a[1][q]); }));
      titulo = 'Una línea combinación lineal de las otras';
      cadena = [
        lin('fila', n) + ' = ' + kk + ' \u00b7 ' + lin('fila', 1) + ' + ' + lin('fila', 2) + '.',
        'Propiedad 8: si una línea es combinación lineal de las demás, el determinante vale <b>0</b>.',
        'También se puede ver así: restando a la última fila esa combinación (propiedad 9, que no ' +
          'cambia el determinante) queda una fila de ceros.'
      ];
      pistaTxt = 'Prueba a sumar o restar dos filas entre sí: ¿sale la tercera?';
    } else if (tipo === 'triangular') {
      for (i = 1; i < n; i++) for (j = 0; j < i; j++) a[i][j] = F0();
      for (i = 0; i < n; i++) a[i][i] = new Frac(noNulo(d, -4, 5));
      titulo = 'Matriz triangular';
      cadena = [
        'Todo lo que hay <b>debajo de la diagonal principal</b> son ceros: la matriz es ' +
          'triangular superior.',
        'El determinante de una matriz triangular es el <b>producto de la diagonal principal</b>.',
        'Producto: ' + prodTxt([a[0][0], a[1][1]].concat(n > 2 ? [a[2][2]] : [])
          .concat(n > 3 ? [a[3][3]] : [])) + '.'
      ];
      pistaTxt = 'Fíjate en los ceros: ¿están todos al mismo lado de la diagonal?';
    } else if (tipo === 'diagonal') {
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) a[i][j] = (i === j) ? new Frac(noNulo(d, -5, 6)) : F0();
      titulo = 'Matriz diagonal';
      cadena = [
        'Fuera de la diagonal principal <b>todo son ceros</b>: la matriz es diagonal.',
        'Una matriz diagonal es triangular superior e inferior a la vez, así que su determinante ' +
          'es el producto de la diagonal.'
      ];
      pistaTxt = 'Multiplica los elementos de la diagonal y ya está.';
    } else {
      var kf = noNulo(d, 2, 5);
      for (i = 1; i < n; i++) for (j = 0; j < i; j++) a[i][j] = F0();
      for (i = 0; i < n; i++) a[i][i] = new Frac(noNulo(d, -3, 4));
      var fila0 = fila(0);
      ponFila(0, porK(fila0, new Frac(kf)));
      titulo = 'Factor común y matriz triangular';
      cadena = [
        'Todos los elementos de la ' + nombreLinea('fila', 1) + ' son múltiplos de ' + kf + '.',
        'Propiedad 5 al revés: sacamos el factor ' + kf + ' fuera del determinante.',
        'Lo que queda dentro es una matriz <b>triangular superior</b>, así que su determinante es ' +
          'el producto de la diagonal.',
        'El valor final es ' + kf + ' por ese producto.'
      ];
      pistaTxt = 'Primero saca factor común de la primera fila; después mira los ceros.';
    }

    var A = capa().matDe(a);
    return {
      tipo: tipo, titulo: titulo, A: A, valor: det(A), cadena: cadena, pista: pistaTxt,
      n: n, numero: Number(numero || 1), semilla: Number(semillaBase || 1)
    };
  }

  R.retoPropiedades = function (node) {
    var marcador = { intentos: 0, aciertos: 0, hechos: {} };
    var verSol = false;

    function limpia(c) {
      verSol = false;
      if (c && c.resp) c.resp.value = '';
    }

    return S.shell(node, 'Reto de propiedades',
      'El applet genera un determinante que <b>se puede resolver con propiedades</b>, sin ' +
      'desarrollarlo ni aplicar Sarrus. Míralo bien, decide qué propiedad lo resuelve y escribe su ' +
      'valor en <b>Tu respuesta</b>: se corrige solo. Se admite un entero (<code>-12</code>), un ' +
      'decimal con coma (<code>0,5</code>) o una fracción (<code>3/4</code>). ' +
      'Con <b>Nuevo reto</b> pasas al siguiente y con <b>Ver la solución</b> aparece la cadena ' +
      'completa de propiedades. El marcador va contando tus aciertos.',
      [
        {
          id: 'tipo', label: 'Tipo de reto', type: 'select', value: 'aleatorio', ancho: '17rem',
          options: [{ value: 'aleatorio', label: 'Aleatorio (todas las propiedades)' }]
            .concat(TIPOS_RETO.map(function (t) { return { value: t.clave, label: t.nombre }; }))
        },
        { id: 'semilla', label: 'Semilla', type: 'number', min: 1, max: 9999, value: 5, ancho: '9rem' },
        { id: 'n', label: 'Reto número', type: 'number', min: 1, max: 500, value: 1, ancho: '9rem' },
        { id: 'resp', label: 'Tu respuesta', type: 'text', value: '', ancho: '13rem', place: '0' },
        {
          id: 'sig', label: 'Nuevo reto', type: 'button',
          click: function (c) { c.n.value = String(Number(c.n.value || 1) + 1); limpia(c); }
        },
        {
          id: 'ant', label: 'Reto anterior', type: 'button',
          click: function (c) { c.n.value = String(Math.max(1, Number(c.n.value || 1) - 1)); limpia(c); }
        },
        { id: 'ver', label: 'Ver la solución', type: 'button', click: function () { verSol = true; } },
        {
          id: 'cero', label: 'Reiniciar el marcador', type: 'button',
          click: function (c) { marcador = { intentos: 0, aciertos: 0, hechos: {} }; limpia(c); }
        },
        chips([
          { txt: 'Tanda completa', tip: 'Retos de todas las propiedades',
            set: { tipo: 'aleatorio', semilla: 5, n: 1 }, extra: limpia },
          { txt: 'Solo líneas de ceros', tip: 'El atajo más directo',
            set: { tipo: 'filaNula', semilla: 11, n: 1 }, extra: limpia },
          { txt: 'Solo líneas iguales', tip: 'Propiedad 4',
            set: { tipo: 'iguales', semilla: 21, n: 1 }, extra: limpia },
          { txt: 'Solo proporcionales', tip: 'Propiedad 5 más propiedad 4',
            set: { tipo: 'proporcionales', semilla: 31, n: 1 }, extra: limpia },
          { txt: 'Solo combinaciones lineales', tip: 'Propiedad 8',
            set: { tipo: 'combinacion', semilla: 41, n: 1 }, extra: limpia },
          { txt: 'Solo triangulares', tip: 'Producto de la diagonal',
            set: { tipo: 'triangular', semilla: 51, n: 1 }, extra: limpia },
          { txt: 'Factor común y triangular', tip: 'Dos propiedades encadenadas',
            set: { tipo: 'factorTriangular', semilla: 61, n: 1 }, extra: limpia },
          { txt: 'Semilla al azar', tip: 'Otra tanda distinta', set: { n: 1 },
            extra: function (c) {
              c.semilla.value = String(1 + Math.floor(Math.random() * 9000));
              limpia(c);
            } }
        ])
      ],
      safe(function (v) {
        var Q = generaReto(v.semilla, v.n, v.tipo);
        var clave = Q.semilla + '/' + Q.numero;

        /* --- figura del reto --- */
        var cw = anchoCelda(Q.n + 2);
        var y0 = 128;
        var g = dibujaMat(60, y0, Q.A, {
          cw: cw, det: true, rotulo: 'reto ' + Q.numero + ' \u00b7 orden ' + Q.n,
          pie: '¿cuánto vale este determinante?'
        });
        var body = '';
        body += S.txt(40, 48, 'Resuélvelo con propiedades, sin desarrollar',
          { size: 21, weight: '700', anchor: 'start', fill: COL.azulOsc });
        body += S.txt(40, 80, 'semilla ' + Q.semilla + ' \u00b7 reto ' + Q.numero +
          ' \u00b7 aciertos: ' + marcador.aciertos + ' de ' + marcador.intentos,
          { size: 17, weight: '600', anchor: 'start', fill: COL.gris });
        body += g.svg;
        var xT = g.x1 + 44, yT = y0 + 16;
        body += S.txt(xT, yT, 'Busca:', { size: 18, weight: '700', anchor: 'start', fill: COL.azulOsc });
        ['una línea de ceros', 'dos líneas iguales', 'dos proporcionales',
          'una combinación lineal', 'una forma triangular', 'un factor común'
        ].forEach(function (t, q) {
          body += S.txt(xT, yT + 30 + q * 27, '\u2022 ' + t,
            { size: 16, weight: '600', anchor: 'start', fill: COL.gris, family: FAM_OP });
        });
        var yPie = g.y1 + 78;
        if (verSol) {
          body += S.txt(40, yPie, 'solución: ' + nt(Q.valor),
            { size: 22, weight: '700', anchor: 'start', fill: COL.verde, family: FAM_OP });
        } else {
          body += S.txt(40, yPie, 'escribe tu respuesta en el control «Tu respuesta»',
            { size: 18, weight: '600', anchor: 'start', fill: COL.gris });
        }
        var h = figura(body, Math.max(xT + 340, g.x1 + 60), yPie + 40,
          'Determinante del reto', 'Determinante de orden ' + Q.n +
          ' que se resuelve aplicando propiedades.');

        /* --- corrección --- */
        var crudo = String(v.resp === undefined ? '' : v.resp).trim();
        if (crudo === '') {
          h += pista('Escribe el valor del determinante en <b>Tu respuesta</b>. ' + Q.pista);
        } else {
          var leido = null, err = null;
          try { leido = FR(crudo); }
          catch (e) {
            err = 'No he entendido «' + crudo + '». Escribe un entero (por ejemplo 0), un decimal ' +
              'con coma (0,5) o una fracción (3/4).';
          }
          if (err) {
            h += mal('<b>Respuesta ilegible.</b> ' + S.esc(err));
          } else {
            var ok = igF(leido, Q.valor);
            if (!marcador.hechos[clave]) {
              marcador.hechos[clave] = true;
              marcador.intentos++;
              if (ok) marcador.aciertos++;
            }
            h += (ok
              ? bien('<b>¡Correcto!</b> El determinante vale ' + K(FT(Q.valor)) +
                  '. Y lo importante: se resuelve con propiedades, sin desarrollar nada.')
              : mal('<b>Todavía no.</b> Has escrito ' + K(FT(leido)) + ' y no es el valor correcto. ' +
                  S.esc(Q.pista) + ' Vuelve a intentarlo o pulsa <b>Ver la solución</b>.'));
            if (!ok) verSol = true;
          }
        }

        if (verSol) {
          h += titulillo('Cadena de propiedades que resuelve el reto · ' + Q.titulo);
          Q.cadena.forEach(function (t, q) {
            h += S.paso(String(q + 1), '<p>' + S.texifica(t) + '</p>', 'detb-ok');
          });
          h += KD(S.detTex(Q.A) + '=' + FT(Q.valor));
          h += parrafo('<b>Respuesta correcta:</b> <code>' + S.esc(nt(Q.valor)) + '</code>');
        }

        h += S.resultado(marcador.aciertos + ' / ' + marcador.intentos, 'retos acertados');
        h += S.kvs([
          'retos intentados: <b>' + marcador.intentos + '</b>',
          'aciertos: <b>' + marcador.aciertos + '</b>',
          'fallos: <b>' + (marcador.intentos - marcador.aciertos) + '</b>'
        ]);
        h += pista('Cada reto cuenta una sola vez en el marcador, así que puedes corregirte sin ' +
          'penalización. Con <b>Reiniciar el marcador</b> vuelves a empezar de cero.');
        return h;
      }));
  };

  /* ==================================================================
     cierre del módulo
     ================================================================== */
  S.extraB = true;
  if (S.monta) S.monta();
})();
