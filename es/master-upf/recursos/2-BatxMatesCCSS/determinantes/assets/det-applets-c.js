/* =====================================================================
   det-applets-c.js · Módulo C del Tema 2 «Determinantes»
   2.º de Bachillerato · Matemáticas Aplicadas a las Ciencias Sociales
   Ruta: 2-BatxMatesCCSS/determinantes/assets/det-applets-c.js

   Cubre los archivos 05, 06 y 07 del tema:

     05  Menor complementario de un elemento.
     06  Adjunto de un elemento (tablero de signos).
     07  Desarrollo de un determinante por los adjuntos de una línea.

   ---------------------------------------------------------------------
   CLAVES REGISTRADAS (8)
   ---------------------------------------------------------------------
     menorComp            El menor complementario α_ij: se tacha la fila i
                          y la columna j enteras y queda resaltada la
                          submatriz que sobrevive, con su determinante.
     tablaMenores         Los n² menores complementarios colocados en la
                          posición del elemento al que corresponden; al
                          pulsar uno se resalta su submatriz de origen.
     signos               El tablero de signos (−1)^(i+j), de orden 2 a 5,
                          con el cálculo de i+j y un pequeño reto.
     adjunto              A_ij = (−1)^(i+j)·α_ij en cadena visual: el
                          signo multiplica al MENOR, nunca al elemento.
     comparaMenorAdjunto  Menor y adjunto lado a lado, con la tabla de las
                          n² posiciones marcando dónde α_ij = A_ij y dónde
                          A_ij = −α_ij.
     desarrollo           Desarrollo por los adjuntos de una línea (orden 3
                          a 5), término a término, con el total.
     eligeLinea           Ceros y coste de cada una de las 2n líneas, mejor
                          línea recomendada y comprobación de que las 2n
                          dan el mismo determinante.
     filaAjena            La suma de los elementos de una línea por los
                          adjuntos de OTRA vale 0; con i = k vale |A|.

   ---------------------------------------------------------------------
   DEPENDENCIAS
   ---------------------------------------------------------------------
   Necesita, cargados antes:
     · el núcleo  det-applets.js       (window.DET)
     · la capa    det-applets-alg.js   (álgebra matricial exacta)
     · la capa    det-applets-det.js   (álgebra de determinantes)

   De la capa de determinantes se usan literalmente, sin reimplementar
   nada: subMat, menorComp, signoAdj, adjunto, matAdjuntos, desarrollo,
   mejorLinea, tableroSignos, detTex, numTxtDet, parTxtDet.
   De la capa matricial: parseMat, matTex, matTxt, Mat, det, matTrans,
   fracDe, fracTex.
   Del núcleo: shell, registry, K, KD, esc, texifica, expr, paso, tabla,
   badge, kvs, resultado, svgWrap, altoDibujado, txt, line, rect, circle,
   poly, parNegTex, COL y Frac.

   ---------------------------------------------------------------------
   CRITERIOS DE PRESENTACIÓN
   ---------------------------------------------------------------------
   1. Índices SIEMPRE en base 1 en todo lo que ve el alumno; a la capa se
      le pasan en base 0 (restando 1 justo al llamar).
   2. Aritmética exacta con DET.Frac (BigInt). La coma flotante solo se
      usa para colocar píxeles.
   3. Dentro de un <svg> no hay LaTeX: los <text> llevan texto llano con
      Unicode (subíndices ₁₂₃, ·, ×, −, ≠). Las fórmulas van fuera.
   4. Coma decimal y signo menos U+2212; nunca «+ −3», sino «+ (−3)».
   5. Figuras de 700 px de ancho como mínimo, celdas de 25 px, rótulos de
      16 px o más en negrita; el alto se deriva de lo dibujado con
      DET.altoDibujado, así que no queda margen inferior vacío.
   6. Toda cuenta va dentro de safe(): ninguna entrada mala rompe la
      página y los avisos no se acumulan (se reescribe la salida entera
      en cada recálculo).

   Clases CSS: las «.detc-» que ya trae det-applets.css.
   ===================================================================== */
(function () {
  'use strict';

  var M = window.DET;
  if (!M) {
    if (window.console && console.error) {
      console.error('[determinantes] det-applets-c.js necesita det-applets.js cargado antes.');
    }
    return;
  }

  var R = M.registry;
  var K = M.K, KD = M.KD, COL = M.COL;

  /* ==================================================================
     0 · utilidades locales del módulo
     ================================================================== */

  /* Acceso perezoso a las capas de álgebra: si falta alguna, aviso claro. */
  function capa() {
    if (!M.parseMat || !M.det) {
      throw Error('No se ha cargado la capa de álgebra matricial (det-applets-alg.js). ' +
        'Recarga la página; si el aviso sigue, avisa al profesor.');
    }
    if (!M.menorComp || !M.desarrollo || !M.mejorLinea) {
      throw Error('No se ha cargado la capa de determinantes (det-applets-det.js). ' +
        'Recarga la página; si el aviso sigue, avisa al profesor.');
    }
    return M;
  }

  function FT(f) { return capa().fracTex(f, true); }          /* fracción en TeX  */
  function NT(f) { return capa().numTxtDet(f); }              /* texto llano      */
  function PT(f) { return capa().parTxtDet(f); }              /* «(−3)» si es < 0 */
  function cero(f) { return f.n === 0n; }
  function neg(f) { return f.n < 0n; }
  function igual(a, b) { return a.cmp(b) === 0; }

  /* Subíndices Unicode: sub(12) -> «₁₂». Solo para los <text> del SVG. */
  var SUB = ['\u2080', '\u2081', '\u2082', '\u2083', '\u2084',
    '\u2085', '\u2086', '\u2087', '\u2088', '\u2089'];
  function sub(n) {
    return String(n).split('').map(function (c) {
      var d = '0123456789'.indexOf(c);
      return d >= 0 ? SUB[d] : c;
    }).join('');
  }
  /* Nombres en texto llano (SVG) y en TeX (fuera del SVG), base 1. */
  function aTxt(i1, j1) { return 'a' + sub(i1) + sub(j1); }
  function ATxt(i1, j1) { return 'A' + sub(i1) + sub(j1); }
  function alfaTxt(i1, j1) { return '\u03b1' + sub(i1) + sub(j1); }
  function aTex(i1, j1) { return 'a_{' + i1 + j1 + '}'; }
  function ATex(i1, j1) { return 'A_{' + i1 + j1 + '}'; }
  function alfaTex(i1, j1) { return '\\alpha_{' + i1 + j1 + '}'; }
  function signoTxt(s) { return s === 1 ? '+' : '\u2212'; }

  /* Piezas de salida con las clases del módulo. */
  function caja(label, tex) { return '<div class="detc-caja">' + M.expr(label, tex) + '</div>'; }
  function parrafo(html) { return '<p class="detc-txt">' + html + '</p>'; }
  function titulo(t) { return '<h5 class="detc-h">' + t + '</h5>'; }
  function aviso(html) { return '<p class="detc-aviso">' + html + '</p>'; }
  function pista(html) { return '<p class="detc-pista"><b>Pista:</b> ' + html + '</p>'; }
  function bien(html) { return '<p class="detc-bien">' + html + '</p>'; }
  function mal(html) { return '<p class="detc-mal">' + html + '</p>'; }

  /* Botones de escenario con nombre. */
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

  /* Cualquier error se convierte en un aviso amable DENTRO del applet.
     Como la salida se reescribe entera, los avisos no se acumulan. */
  function safe(fn) {
    return function (v, ctl, out, api) {
      try {
        var h = fn(v, ctl, out, api);
        return (h === undefined || h === null || h === '')
          ? '<div class="mx-bad detc-err">No hay nada que mostrar todavía: revisa los datos que has escrito.</div>'
          : h;
      } catch (e) {
        var m = (e && e.message) ? e.message : 'No he podido calcular con estos datos.';
        return '<div class="mx-bad detc-err">' + M.esc(m) + '</div>';
      }
    };
  }

  /* ------------------------------------------------------------------
     Lectura de matrices CUADRADAS con límites de orden y avisos
     didácticos. Se apoya en M.parseMat (espacios, comas, «;», saltos de
     línea, enteros, decimales con coma y fracciones).
     ------------------------------------------------------------------ */
  var EJEMPLO = 'Escribe la matriz por filas, con los elementos separados por espacios y las filas ' +
    'separadas por «;» o por un salto de línea. Ejemplo copiable: <code>2 -1 3; 0 4 1; 5 2 -2</code>. ' +
    'Valen enteros (<code>-2</code>), decimales con coma (<code>0,5</code>) y fracciones (<code>1/2</code>).';

  function leeCuad(txtIn, minN, maxN) {
    var s = String(txtIn === undefined || txtIn === null ? '' : txtIn).trim();
    if (s === '') {
      throw Error('Escribe una matriz cuadrada por filas, separando los elementos con espacios y las ' +
        'filas con «;» o con un salto de línea. Por ejemplo: 2 -1 3; 0 4 1; 5 2 -2.');
    }
    var A = capa().parseMat(s);
    if (A.f !== A.c) {
      throw Error('Solo las matrices CUADRADAS tienen determinante, y has escrito una de ' +
        A.f + '×' + A.c + '. Pon el mismo número de filas que de columnas, por ejemplo ' +
        '2 -1 3; 0 4 1; 5 2 -2.');
    }
    if (A.f < minN) {
      throw Error('Este applet necesita un orden de ' + minN + ' como mínimo y has escrito una matriz de ' +
        'orden ' + A.f + '. Añade filas y columnas, por ejemplo 2 -1 3; 0 4 1; 5 2 -2.');
    }
    if (A.f > maxN) {
      throw Error('Este applet trabaja hasta el orden ' + maxN + ' y has escrito una matriz de orden ' +
        A.f + '. Quita alguna fila y alguna columna: con orden ' + maxN + ' o menos todo se ve grande ' +
        'y legible en la pantalla.');
    }
    return A;
  }

  /* Índice base 1 leído de un control, con aviso si se sale de la matriz. */
  function leeIndice(valor, n, nombre) {
    var k = parseInt(String(valor), 10);
    if (!isFinite(k)) {
      throw Error('El número de ' + nombre + ' debe ser un entero entre 1 y ' + n + '.');
    }
    if (k < 1 || k > n) {
      throw Error('La matriz es de orden ' + n + ', así que la ' + nombre + ' ha de estar entre 1 y ' + n +
        ' (has pedido la ' + nombre + ' ' + k + '). Recuerda que las filas y las columnas se numeran ' +
        'desde 1.');
    }
    return k;
  }

  /* Tipo de línea normalizado a partir de un desplegable. */
  function leeTipo(valor) {
    var t = String(valor === undefined ? 'fila' : valor).toLowerCase();
    if (t.indexOf('col') === 0) return 'columna';
    return 'fila';
  }

  function aleatorio(n) { return Math.floor(Math.random() * n); }

  /* ==================================================================
     1 · figuras
     Todas cierran con fig(), que deriva el alto de lo dibujado con
     DET.altoDibujado: nunca queda margen inferior vacío ni dibujo
     cortado, ni en orden 5 con los 25 menores.
     ================================================================== */

  /* Anchura aproximada de un rótulo, para que nada se salga del marco.
     Se mide carácter a carácter porque los rótulos del módulo mezclan
     cifras, subíndices Unicode, espacios y signos: con un único 0,62 em
     para todo se sobreestimaban las cadenas con muchos espacios y se
     infravaloraban las de mayúsculas anchas. Los factores están tomados
     con holgura sobre la fuente en negrita del tema. */
  var ANW_ANCHO = 'ABCDEFGHKMNOPQRSUVWXYZmw\u03b1';   /* letras anchas */
  var ANW_ESTRECHO = 'ijlt.,;:\'\u00b7|!';              /* letras finas  */
  function anW1(c) {
    if (c === ' ') return 0.30;
    if (SUB.indexOf(c) >= 0) return 0.40;              /* subíndices ₀…₉ */
    if (ANW_ESTRECHO.indexOf(c) >= 0) return 0.34;
    if (ANW_ANCHO.indexOf(c) >= 0) return 0.72;
    if (c === '\u2260') return 0.78;                    /* «≠» va holgado */
    if (c === '\u2212' || c === '-' || c === '+' || c === '=') return 0.62;
    return 0.60;
  }
  function anW(s, sz) {
    var t = String(s === null || s === undefined ? '' : s), w = 0, q;
    for (q = 0; q < t.length; q++) w += anW1(t.charAt(q));
    /* nunca por debajo de 0,62 em de media por carácter: la reserva de
       sitio ha de quedar siempre del lado holgado */
    return Math.max(w, t.length * 0.62) * sz;
  }

  /* Un rótulo llano partido en como mucho dos líneas, cortando por el
     espacio que deje las dos mitades más parejas. Sirve para que el
     carril de rótulos de fila no se coma el ancho de la figura. */
  function dosLineas(s, sz, maxW) {
    var t = String(s === null || s === undefined ? '' : s);
    if (t === '' || anW(t, sz) <= maxW) return [t];
    var pos = [], k = t.indexOf(' ');
    while (k >= 0) { pos.push(k); k = t.indexOf(' ', k + 1); }
    if (!pos.length) return [t];
    var obj = t.length / 2, mejor = pos[0], q;
    for (q = 1; q < pos.length; q++) {
      if (Math.abs(pos[q] - obj) < Math.abs(mejor - obj)) mejor = pos[q];
    }
    return [t.slice(0, mejor), t.slice(mejor + 1)];
  }

  /* Texto de SVG que puede contener «≠».

     Dos problemas comprobados en la página del tema, donde los <text>
     del SVG heredan la pila «system-ui»:
       1) esa pila no trae el glifo U+2260 y el navegador lo sintetiza
          como un «=» con una barra montada al lado, que además pisa el
          carácter siguiente («i ≠k» se leía «i ⧸=k»);
       2) el par «≠ k» quedaba sin separación medida.
     Solución: el «≠» va en su PROPIO <text>, con holgura medida a los
     dos lados y con una familia tipográfica que sí tiene el glifo
     (DejaVu / Liberation / Arial, presentes en Linux, Windows y macOS).
     Así el carácter sigue estando en el texto (lectores de pantalla y
     copiar-pegar) y se ve bien. Sin «≠» se comporta como M.txt. */
  var FAM_NEQ = 'DejaVu Sans, Liberation Sans, Arial, Helvetica, sans-serif';
  function txtN(x, y, s, o) {
    var t = String(s === null || s === undefined ? '' : s);
    if (t.indexOf('\u2260') < 0) return M.txt(x, y, t, o);
    o = o || {};
    var sz = o.size || 18;
    var hol = Math.max(7, sz * 0.36);                  /* aire a cada lado */
    var wNe = anW('\u2260', sz);
    var trozos = t.split('\u2260').map(function (u) { return u.replace(/\s+/g, ' ').trim(); });
    var total = 0, q;
    for (q = 0; q < trozos.length; q++) total += anW(trozos[q], sz);
    total += (trozos.length - 1) * (wNe + 2 * hol);
    var an = o.anchor || 'middle';
    var xc = (an === 'start') ? x : (an === 'end' ? x - total : x - total / 2);
    var op = {}, kk;
    for (kk in o) { if (Object.prototype.hasOwnProperty.call(o, kk)) op[kk] = o[kk]; }
    op.anchor = 'start';
    var out = '';
    for (q = 0; q < trozos.length; q++) {
      if (trozos[q] !== '') out += M.txt(xc, y, trozos[q], op);
      xc += anW(trozos[q], sz);
      if (q < trozos.length - 1) {
        var opN = {}, k2;
        for (k2 in op) { if (Object.prototype.hasOwnProperty.call(op, k2)) opN[k2] = op[k2]; }
        opN.family = FAM_NEQ;
        out += M.txt(xc + hol, y, '\u2260', opN);
        xc += wNe + 2 * hol;
      }
    }
    return out;
  }

  /* Marco + alto derivado del contenido (margen inferior fijo de 26 px). */
  function fig(body, W, label, cap) {
    var H = Math.ceil(M.altoDibujado(body)) + 26;
    var marco = M.rect(2, 2, W - 4, H - 4, '#ffffff', '#e3e9ef', { r: 12, sw: 2 });
    return M.svgWrap(marco + body, W, H, label, cap);
  }

  /* Celda con datos de posición (base 1) para poder pulsarla. */
  function celda(x, y, w, h, fill, stroke, sw, i1, j1) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" rx="8" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw +
      '" data-cel-i="' + i1 + '" data-cel-j="' + j1 + '" style="cursor:pointer"/>';
  }

  /* Delegación de clic: al pulsar una celda se mueven los controles i, j.
     Se instala UNA sola vez por applet (el nodo de salida no se cambia,
     solo su innerHTML). */
  function instalaClic(api, campoI, campoJ) {
    var out = api && api.out;
    if (!out || out._detcClic || !out.addEventListener) return;
    out._detcClic = true;
    out.addEventListener('click', function (ev) {
      var t = ev.target, i = null, j = null, g = 0;
      while (t && g < 4) {
        if (t.getAttribute) {
          var vi = t.getAttribute('data-cel-i'), vj = t.getAttribute('data-cel-j');
          if (vi !== null && vj !== null) { i = vi; j = vj; break; }
        }
        t = t.parentNode; g++;
      }
      if (i === null) return;
      if (campoI && api.ctl[campoI]) {
        api.ctl[campoI].value = i;
        if (typeof api.ctl[campoI]._sincroniza === 'function') api.ctl[campoI]._sincroniza();
      }
      if (campoJ && api.ctl[campoJ]) {
        api.ctl[campoJ].value = j;
        if (typeof api.ctl[campoJ]._sincroniza === 'function') api.ctl[campoJ]._sincroniza();
      }
      api.run();
    });
  }

  /* ------------------------------------------------------------------
     FIGURA 1 · la matriz con una fila y una columna tachadas.
     o = { fila, col        índices BASE 0 que se tachan (o null)
           lineaTipo, linea  línea resaltada (base 0) para el desarrollo
           marca:[[i,j],…]   celdas destacadas (base 0)
           titulo, pie, notas:[texto], label, cap, clic }
     ------------------------------------------------------------------ */
  function figMatriz(A, o) {
    o = o || {};
    var n = A.f, m = A.c, i, j;
    var cw = o.cw || 96, ch = o.ch || 66;
    var x0 = 176, y0 = 118, dx = 6, dy = 8;

    /* Se miden antes todos los rótulos que van a la derecha de la matriz
       o centrados debajo de una columna, para que el marco dé de sí. */
    var rotFila = (o.fila !== undefined && o.fila !== null)
      ? 'fila ' + (o.fila + 1) + ' tachada' : null;
    var rotLinF = (o.lineaTipo === 'fila' && o.linea !== undefined && o.linea !== null)
      ? 'fila ' + (o.linea + 1) + ': el desarrollo' : null;
    var rotCol = (o.col !== undefined && o.col !== null)
      ? 'columna ' + (o.col + 1) + ' tachada' : null;
    var rotLinC = (o.lineaTipo === 'columna' && o.linea !== undefined && o.linea !== null)
      ? 'columna ' + (o.linea + 1) + ': el desarrollo' : null;

    /* ----------------------------------------------------------------
       DOS CARRILES a la derecha de la matriz, con x propia cada uno:

         carril 1 (pegado a la matriz)  los rótulos que señalan UNA fila
                                       concreta (la tachada, la del
                                       desarrollo): van a la altura de su
                                       fila, partidos en dos líneas si son
                                       largos, y nunca se solapan entre sí.
         carril 2 (más a la derecha)    las notas, apiladas y centradas
                                       verticalmente frente a la matriz.

       Antes las notas y los rótulos de fila compartían la misma x
       (x0 + m·cw + 22) y se pisaban en cuanto coincidía la altura: era el
       defecto grave común a menorComp, tablaMenores, adjunto,
       comparaMenorAdjunto, desarrollo, eligeLinea y filaAjena.
       ---------------------------------------------------------------- */
    var SZR = 18, SZN = 18, PASO = 34, MAXROT = 176;
    var carril1 = [];
    if (rotFila) {
      carril1.push({
        lin: dosLineas(rotFila, SZR, MAXROT), col: COL.rojo,
        y: y0 + o.fila * ch + ch / 2 + 6
      });
    }
    if (rotLinF) {
      carril1.push({
        lin: dosLineas(rotLinF, SZR, MAXROT), col: COL.naranja,
        y: y0 + o.linea * ch + ch * 0.66
      });
    }
    /* si dos rótulos de fila cayeran demasiado juntos, el segundo baja */
    carril1.sort(function (p, q) { return p.y - q.y; });
    for (i = 1; i < carril1.length; i++) {
      var minY = carril1[i - 1].y + (carril1[i - 1].lin.length > 1 ? 30 : 0) + 30;
      if (carril1[i].y < minY) carril1[i].y = minY;
    }

    var notas = (o.notas || []).filter(function (t) { return t !== null && t !== undefined && t !== ''; });
    var anchoRot = 0, anchoNot = 0;
    carril1.forEach(function (r) {
      r.lin.forEach(function (t) { anchoRot = Math.max(anchoRot, anW(t, SZR)); });
    });
    notas.forEach(function (t) { anchoNot = Math.max(anchoNot, anW(t, SZN)); });

    var xRot = x0 + m * cw + 20;                       /* carril 1 */
    var xNot = xRot + (anchoRot > 0 ? anchoRot + 28 : 0);  /* carril 2 */
    var W = Math.max(700, xRot + anchoRot + 24, xNot + anchoNot + 24);
    /* rótulos centrados debajo de una columna concreta */
    [[rotCol, o.col], [rotLinC, o.linea]].forEach(function (p) {
      if (!p[0]) return;
      W = Math.max(W, x0 + p[1] * cw + cw / 2 + anW(p[0], 18) / 2 + 24);
    });
    /* Título y pie van centrados en todo el ancho. Si son muy largos se
       parten en dos líneas en vez de estirar el marco hasta 1.400 px:
       con el marco a lo ancho de la columna, un viewBox desmesurado
       reduce la escala y las cifras de la matriz se ven diminutas. */
    var titLin = dosLineas(o.titulo || 'La matriz', 24, 840);
    var pieLin = o.pie ? dosLineas(o.pie, 19, 840) : [];
    titLin.forEach(function (t) { W = Math.max(W, anW(t, 24) + 60); });
    pieLin.forEach(function (t) { W = Math.max(W, anW(t, 19) + 60); });
    W = Math.ceil(W);
    var b = '';
    titLin.forEach(function (t, q) {
      b += txtN(W / 2, (titLin.length > 1 ? 34 : 46) + q * 32, t, {
        size: 24, weight: 'bold', fill: COL.azulOsc
      });
    });
    var marcadas = {};
    (o.marca || []).forEach(function (p) { marcadas[p[0] + ',' + p[1]] = true; });

    /* rótulos de columna y de fila, en BASE 1 */
    for (j = 0; j < m; j++) {
      var fuera = (o.col === j) || (o.lineaTipo === 'columna' && o.linea === j);
      b += M.txt(x0 + j * cw + cw / 2, y0 - 22, 'C' + sub(j + 1), {
        size: 20, weight: 'bold', fill: fuera ? COL.rojo : COL.gris
      });
    }
    for (i = 0; i < n; i++) {
      var fueraF = (o.fila === i) || (o.lineaTipo === 'fila' && o.linea === i);
      b += M.txt(x0 - 26, y0 + i * ch + ch * 0.66, 'F' + sub(i + 1), {
        size: 20, weight: 'bold', fill: fueraF ? COL.rojo : COL.gris, anchor: 'end'
      });
    }

    /* celdas */
    for (i = 0; i < n; i++) {
      for (j = 0; j < m; j++) {
        var tachada = (o.fila === i) || (o.col === j);
        var enLinea = (o.lineaTipo === 'fila' && o.linea === i) ||
          (o.lineaTipo === 'columna' && o.linea === j);
        var elegida = (o.fila === i && o.col === j);
        var destacada = !!marcadas[i + ',' + j];
        var fondo = '#ffffff', borde = COL.guia, gr = 1.6, tinta = COL.texto;
        if (tachada) { fondo = '#f1f3f5'; borde = '#cfd8dc'; tinta = '#90a4ae'; }
        else if (o.fila !== undefined && o.fila !== null) { fondo = '#eaf7ee'; borde = COL.verde; gr = 2.4; }
        if (enLinea) { fondo = '#fff4e0'; borde = COL.naranja; gr = 2.8; tinta = COL.texto; }
        if (destacada) { fondo = '#eaf7ee'; borde = COL.verde; gr = 2.8; }
        if (elegida) { fondo = '#fdecea'; borde = COL.rojo; gr = 3.2; tinta = COL.rojo; }
        b += celda(x0 + j * cw + dx, y0 + i * ch + dy / 2, cw - 2 * dx, ch - dy,
          fondo, borde, gr, i + 1, j + 1);
        b += M.txt(x0 + j * cw + cw / 2, y0 + i * ch + ch * 0.66, NT(A.a[i][j]), {
          size: 25, weight: 'bold', fill: tinta
        });
      }
    }

    /* tachado de la fila y de la columna elegidas */
    var xa = x0 + dx - 14, xb = x0 + m * cw - dx + 14;
    var ya = y0 + dy / 2 - 12, yb = y0 + n * ch - dy / 2 + 12;
    if (o.fila !== undefined && o.fila !== null) {
      var yl = y0 + o.fila * ch + ch / 2;
      b += M.line(xa, yl, xb, yl, COL.rojo, 4.2);
    }
    if (o.col !== undefined && o.col !== null) {
      var xl = x0 + o.col * cw + cw / 2;
      b += M.line(xl, ya, xl, yb, COL.rojo, 4.2);
      b += M.txt(xl, yb + 30, rotCol, {
        size: 18, weight: 'bold', fill: COL.rojo
      });
    }
    if (rotLinC) {
      b += M.txt(x0 + o.linea * cw + cw / 2, yb + 30, rotLinC, {
        size: 18, weight: 'bold', fill: COL.naranja
      });
    }

    /* CARRIL 1 · rótulos de fila, en su propia x y a la altura de su fila */
    var yRotFin = y0;
    carril1.forEach(function (r) {
      var y1 = r.y - (r.lin.length - 1) * 12;
      r.lin.forEach(function (t, q) {
        var yy = y1 + q * 24;
        b += M.txt(xRot, yy, t, {
          size: SZR, weight: 'bold', fill: r.col, anchor: 'start'
        });
        if (yy > yRotFin) yRotFin = yy;
      });
    });

    /* CARRIL 2 · notas, apiladas y centradas frente a la matriz */
    var altoNot = (notas.length - 1) * PASO;
    var yNot = y0 + Math.max(26, (n * ch - altoNot) / 2 + 6);
    notas.forEach(function (t, q) {
      b += txtN(xNot, yNot + q * PASO, t, {
        size: SZN, weight: 'bold', fill: COL.azulOsc, anchor: 'start'
      });
    });
    var yNotFin = notas.length ? yNot + altoNot : y0;

    var yPie = Math.max(yb + 66, y0 + n * ch + 66, yNotFin + 46, yRotFin + 46);
    pieLin.forEach(function (t, q) {
      b += txtN(W / 2, yPie + q * 28, t, { size: 19, weight: 'bold', fill: COL.gris });
    });
    return fig(b, W, o.label || 'Matriz', o.cap || '');
  }

  /* ------------------------------------------------------------------
     FIGURA 2 · rejilla de n×n casillas con varias líneas de texto en
     cada una. cel(i, j) -> { lineas:[…], col, fondo, borde }
     Sirve para los n² menores, para el tablero de signos y para el mapa
     de coincidencias entre menor y adjunto.
     ------------------------------------------------------------------ */
  function figRejilla(n, cel, o) {
    o = o || {};
    var cw = o.cw || 132, ch = o.ch || 100, i, j;
    var x0 = 150, y0 = 118;
    var W = Math.max(700, x0 + n * cw + 110,
      anW(o.titulo || 'Rejilla', 24) + 60, anW(o.pie, 19) + 60);
    var b = M.txt(W / 2, 46, o.titulo || 'Rejilla', { size: 24, weight: 'bold', fill: COL.azulOsc });
    for (j = 0; j < n; j++) {
      b += M.txt(x0 + j * cw + cw / 2, y0 - 22, 'C' + sub(j + 1), {
        size: 20, weight: 'bold', fill: COL.gris
      });
    }
    for (i = 0; i < n; i++) {
      b += M.txt(x0 - 22, y0 + i * ch + ch / 2, 'F' + sub(i + 1), {
        size: 20, weight: 'bold', fill: COL.gris, anchor: 'end'
      });
      for (j = 0; j < n; j++) {
        var c = cel(i, j) || {};
        var lin = c.lineas || [];
        b += celda(x0 + j * cw + 6, y0 + i * ch + 6, cw - 12, ch - 12,
          c.fondo || '#ffffff', c.borde || COL.guia, c.gr || 2, i + 1, j + 1);
        var alto = lin.length;
        for (var q = 0; q < alto; q++) {
          var tam = (q === 0 && o.primeraGrande !== false) ? (o.size1 || 21) : (o.size2 || 19);
          var yy = y0 + i * ch + ch / 2 - (alto - 1) * 15 + q * 30 + 7;
          b += M.txt(x0 + j * cw + cw / 2, yy, lin[q], {
            size: tam, weight: 'bold', fill: (q === 0 ? (c.col || COL.texto) : (c.col2 || COL.gris))
          });
        }
      }
    }
    var yFin = y0 + n * ch + 46;
    if (o.pie) b += M.txt(W / 2, yFin, o.pie, { size: 19, weight: 'bold', fill: COL.gris });
    return fig(b, W, o.label || 'Rejilla de posiciones', o.cap || '');
  }

  /* ------------------------------------------------------------------
     FIGURA 3 · cadena elemento → menor → signo → adjunto.
     pasos = [{ rot, valor, col, nota }]
     ------------------------------------------------------------------ */
  function figCadena(pasos, o) {
    o = o || {};
    var y = 110, h = 104, w = 176;
    var W = Math.max(700, 90 + pasos.length * 210,
      anW(o.titulo || 'De la matriz al adjunto', 24) + 60,
      anW(o.igual, 22) + 60, anW(o.pie, 19) + 60);
    /* las notas van centradas bajo cada caja: la del último paso puede
       asomar por la derecha, así que también se mide */
    pasos.forEach(function (p, q) {
      if (p.nota) W = Math.max(W, 60 + q * 210 + w / 2 + anW(p.nota, 17) / 2 + 24);
      W = Math.max(W, 60 + q * 210 + w / 2 + anW(p.valor, 26) / 2 + 24);
    });
    var b = M.txt(W / 2, 46, o.titulo || 'De la matriz al adjunto', {
      size: 24, weight: 'bold', fill: COL.azulOsc
    });
    pasos.forEach(function (p, q) {
      var x = 60 + q * 210;
      b += M.rect(x, y, w, h, p.fondo || '#f7fbff', p.col || COL.azul, { r: 12, sw: 2.6 });
      b += M.txt(x + w / 2, y + 36, p.rot, { size: 19, weight: 'bold', fill: p.col || COL.azul });
      b += M.txt(x + w / 2, y + 76, p.valor, { size: 26, weight: 'bold', fill: COL.texto });
      if (p.nota) {
        b += M.txt(x + w / 2, y + h + 32, p.nota, { size: 17, weight: 'bold', fill: COL.gris });
      }
      if (q < pasos.length - 1) {
        b += M.txt(x + w + 17, y + 62, '\u00d7', { size: 30, weight: 'bold', fill: COL.gris });
      }
    });
    /* la flecha del resultado */
    if (o.igual) {
      b += M.txt(W / 2, y + h + 92, o.igual, { size: 22, weight: 'bold', fill: COL.verde });
    }
    if (o.pie) b += M.txt(W / 2, y + h + 132, o.pie, { size: 19, weight: 'bold', fill: COL.gris });
    return fig(b, W, o.label || 'Cadena del adjunto', o.cap || '');
  }

  /* ------------------------------------------------------------------
     FIGURA 4 · barras horizontales (coste de cada línea).
     items = [{ etq, valor, col, nota }]
     ------------------------------------------------------------------ */
  function figBarras(items, o) {
    o = o || {};
    var maxv = 1;
    items.forEach(function (it) { maxv = Math.max(maxv, it.valor); });
    /* el rótulo de cada barra va a su derecha: se mide el más largo */
    var derecha = 150;
    items.forEach(function (it) {
      derecha = Math.max(derecha, 40 + anW(String(it.valor) + (it.nota ? '  ' + it.nota : ''), 19));
    });
    var izquierda = 150;
    items.forEach(function (it) { izquierda = Math.max(izquierda, 34 + anW(it.etq, 18)); });
    var x0 = izquierda, y0 = 106, dy = 62;
    var largo = 450;
    var W = Math.max(940, x0 + largo + derecha,
      anW(o.titulo || 'Comparación', 24) + 60, anW(o.pie, 19) + 60);
    largo = W - x0 - derecha;
    var b = M.txt(W / 2, 46, o.titulo || 'Comparación', { size: 24, weight: 'bold', fill: COL.azulOsc });
    items.forEach(function (it, q) {
      var y = y0 + q * dy;
      var w = Math.max(5, largo * it.valor / maxv);
      b += M.txt(x0 - 24, y + 30, it.etq, { size: 18, weight: 'bold', fill: COL.texto, anchor: 'end' });
      b += M.rect(x0, y, largo, 42, '#f4f8fb', COL.guia, { r: 8, sw: 1.4 });
      b += M.rect(x0, y, w, 42, it.col || COL.azul, 'none', { r: 8, op: 0.85 });
      b += M.txt(x0 + w + 16, y + 30, String(it.valor) + (it.nota ? '  ' + it.nota : ''), {
        size: 19, weight: 'bold', fill: it.col || COL.azul, anchor: 'start'
      });
    });
    var yFin = y0 + items.length * dy + 34;
    if (o.pie) b += M.txt(W / 2, yFin, o.pie, { size: 19, weight: 'bold', fill: COL.gris });
    return fig(b, W, o.label || 'Barras comparativas', o.cap || '');
  }

  /* ------------------------------------------------------------------
     Escenarios con nombre, compartidos por varios applets.
     ------------------------------------------------------------------ */
  var ESC = {
    tres: '2 -1 3; 0 4 1; 5 2 -2',
    conCeros: '3 0 0; 1 2 -1; 4 0 5',
    cuatro: '1 2 0 3; 0 1 -1 2; 4 0 2 1; 3 1 0 -2',
    cuatroCeros: '2 0 0 1; 3 1 0 0; 0 4 2 -1; 1 0 0 3',
    cinco: '1 0 2 0 1; 0 3 0 1 2; 2 0 1 0 0; 0 1 0 4 1; 1 2 0 0 3',
    singular: '1 2 3; 2 4 6; 1 0 1',
    fracciones: '1/2 1 3; 2 -1/3 0; 1 4 2',
    identidad: '1 0 0; 0 1 0; 0 0 1',
    triangular: '2 5 -1; 0 3 4; 0 0 -2'
  };
  function multilinea(s) { return s.replace(/;\s*/g, '\n'); }

  /* Cabecera común: la matriz, su orden y su determinante. */
  function cabecera(A) {
    var d = capa().det(A);
    var h = caja('Matriz de partida, de orden ' + A.f, capa().matTex(A));
    h += M.kvs([
      'orden: <b>' + A.f + '</b>',
      'elementos: <b>' + (A.f * A.c) + '</b>',
      'determinante: <b>' + M.esc(NT(d)) + '</b>'
    ]);
    return h;
  }

  /* ==================================================================
     2 · Archivo 05 · menor complementario
     ================================================================== */
  R.menorComp = function (node) {
    return M.shell(node, 'Menor complementario',
      'El <b>menor complementario</b> del elemento ' + K('a_{ij}') + ', que se escribe ' + K('\\alpha_{ij}') +
      ', es el determinante de la matriz que queda al <b>suprimir la fila ' + K('i') + ' entera y la ' +
      'columna ' + K('j') + ' entera</b>. ' + EJEMPLO + ' Después elige la posición: mueve los deslizadores ' +
      'de <b>fila</b> y de <b>columna</b> o <b>pulsa directamente una celda</b> de la figura. Las filas y ' +
      'las columnas se numeran <b>desde 1</b>: la esquina de arriba a la izquierda es ' + K('a_{11}') + '.',
      [
        {
          id: 'A', label: 'Matriz cuadrada (una fila por línea)', type: 'textarea', rows: 4,
          value: multilinea(ESC.tres), ancho: '17rem'
        },
        { id: 'i', label: 'Fila i que se tacha', type: 'range', min: 1, max: 5, step: 1, value: 2, ancho: '12rem' },
        { id: 'j', label: 'Columna j que se tacha', type: 'range', min: 1, max: 5, step: 1, value: 3, ancho: '12rem' },
        { id: 'todos', label: 'Ver los menores de toda la fila i', type: 'check', value: true },
        chips([
          { txt: 'Orden 3 · posición central', tip: 'el menor de a₂₂ en una 3×3', set: { A: multilinea(ESC.tres), i: 2, j: 2, todos: true } },
          { txt: 'Orden 3 · esquina a₁₁', tip: 'se tachan la primera fila y la primera columna', set: { A: multilinea(ESC.tres), i: 1, j: 1, todos: true } },
          { txt: 'Fila con dos ceros', tip: 'los ceros no cambian el menor, pero sí el desarrollo', set: { A: multilinea(ESC.conCeros), i: 1, j: 1, todos: true } },
          { txt: 'Orden 4', tip: 'el menor complementario es de orden 3', set: { A: multilinea(ESC.cuatro), i: 3, j: 2, todos: true } },
          { txt: 'Orden 4 con muchos ceros', tip: 'menores de orden 3 fáciles', set: { A: multilinea(ESC.cuatroCeros), i: 2, j: 3, todos: true } },
          { txt: 'Con fracciones', tip: 'la aritmética es exacta', set: { A: multilinea(ESC.fracciones), i: 2, j: 2, todos: true } },
          { txt: 'Matriz singular', tip: 'el determinante es 0, pero los menores no', set: { A: multilinea(ESC.singular), i: 3, j: 3, todos: true } }
        ])
      ],
      safe(function (v, ctl, out, api) {
        instalaClic(api, 'i', 'j');
        var S = capa();
        var A = leeCuad(v.A, 2, 5);
        var n = A.f;
        var i1 = leeIndice(v.i, n, 'fila');
        var j1 = leeIndice(v.j, n, 'columna');
        var i = i1 - 1, j = j1 - 1;
        var sub2 = S.subMat(A, i, j);
        var men = S.menorComp(A, i, j);
        var elem = A.a[i][j];

        var h = cabecera(A);
        h += titulo('Se tacha la fila ' + i1 + ' y la columna ' + j1);
        h += parrafo('El elemento elegido es ' + K(aTex(i1, j1) + ' = ' + FT(elem)) + '. Para calcular su ' +
          'menor complementario se borran <b>la fila ' + i1 + ' completa</b> y <b>la columna ' + j1 +
          ' completa</b>. Lo que queda, en el mismo orden en que estaba, es una matriz de orden ' + (n - 1) +
          ': su determinante es ' + K(alfaTex(i1, j1)) + '.');
        h += figMatriz(A, {
          fila: i, col: j,
          titulo: 'Menor complementario de ' + aTxt(i1, j1) + ': se tacha la fila ' + i1 + ' y la columna ' + j1,
          notas: [
            'elemento ' + aTxt(i1, j1) + ' = ' + NT(elem),
            'quedan ' + (n - 1) + ' filas',
            'y ' + (n - 1) + ' columnas',
            alfaTxt(i1, j1) + ' = ' + NT(men)
          ],
          pie: 'en verde, la submatriz que sobrevive; en gris, la fila y la columna tachadas',
          label: 'Fila y columna tachadas para el menor complementario',
          cap: 'Pulsa cualquier celda de la figura para cambiar de posición. El elemento ' +
            K(aTex(i1, j1)) + ' <b>no</b> forma parte de su propio menor complementario.'
        });

        h += titulo('La submatriz que queda y su determinante');
        h += caja('Submatriz de orden ' + (n - 1) + ' (se ha quitado la fila ' + i1 + ' y la columna ' + j1 + ')',
          S.matTex(sub2));
        h += figMatriz(sub2, {
          cw: 100, ch: 68,
          titulo: 'La submatriz de orden ' + (n - 1) + ', ya sola',
          notas: ['su determinante es', alfaTxt(i1, j1) + ' = ' + NT(men)],
          pie: 'las filas y las columnas se renumeran desde 1 en la submatriz',
          label: 'Submatriz del menor complementario',
          cap: 'Ojo: dentro de la submatriz los índices vuelven a empezar en 1, pero el nombre del menor ' +
            'conserva la posición original ' + K(alfaTex(i1, j1)) + '.'
        });
        h += caja('Menor complementario', alfaTex(i1, j1) + ' = ' + S.detTex(sub2) + ' = ' + FT(men));
        h += M.resultado(K(alfaTex(i1, j1) + ' = ' + FT(men)),
          'menor complementario de ' + aTxt(i1, j1));

        if (n - 1 === 2) {
          var p = sub2.a[0][0].por(sub2.a[1][1]);
          var q = sub2.a[0][1].por(sub2.a[1][0]);
          h += parrafo('Al ser de orden 2 se resuelve de cabeza: producto de la diagonal principal menos ' +
            'producto de la secundaria, ' +
            K(FT(sub2.a[0][0]) + ' \\cdot ' + M.parNegTex(FT(sub2.a[1][1])) + ' - ' +
              M.parNegTex(FT(sub2.a[0][1])) + ' \\cdot ' + M.parNegTex(FT(sub2.a[1][0])) + ' = ' +
              M.parNegTex(FT(p)) + ' - ' + M.parNegTex(FT(q)) + ' = ' + FT(men)) + '.');
        } else {
          h += parrafo('Al ser de orden ' + (n - 1) + ' hay que calcularlo con la regla de Sarrus (orden 3) ' +
            'o desarrollando otra vez por los adjuntos: el resultado exacto es ' +
            K(alfaTex(i1, j1) + ' = ' + FT(men)) + '.');
        }

        if (v.todos) {
          h += titulo('Los ' + n + ' menores complementarios de la fila ' + i1);
          h += parrafo('Fijando la fila ' + i1 + ' y moviendo la columna se obtienen los ' + n + ' menores ' +
            'que hacen falta para desarrollar el determinante por esa fila. Todos son de orden ' + (n - 1) + '.');
          var filasTbl = [];
          for (var q2 = 0; q2 < n; q2++) {
            var mq = S.menorComp(A, i, q2);
            filasTbl.push({
              celdas: [
                K(aTex(i1, q2 + 1)) + ' = ' + K(FT(A.a[i][q2])),
                'se tachan la fila ' + i1 + ' y la columna ' + (q2 + 1),
                K(S.detTex(S.subMat(A, i, q2))),
                K(alfaTex(i1, q2 + 1) + ' = ' + FT(mq))
              ],
              clase: q2 === j ? 'detc-ok' : ''
            });
          }
          h += M.tabla(['Elemento', 'Qué se tacha', 'Submatriz', 'Menor complementario'], filasTbl);
        }

        h += aviso('<b>Error típico.</b> El menor complementario ' + K(alfaTex(i1, j1)) + ' es solo un ' +
          'determinante: <b>todavía no lleva signo</b>. El signo ' + K('(-1)^{i+j}') + ' aparece en el ' +
          '<b>adjunto</b> ' + K(ATex(i1, j1) + ' = (-1)^{' + i1 + '+' + j1 + '} \\cdot ' + alfaTex(i1, j1)) +
          ', que se estudia en el apartado siguiente.');
        return h;
      }));
  };

  /* ==================================================================
     3 · Archivo 05 · tabla de todos los menores complementarios
     ================================================================== */
  R.tablaMenores = function (node) {
    return M.shell(node, 'Tabla de menores complementarios',
      'Cada elemento de la matriz tiene su propio menor complementario, así que una matriz de orden ' +
      K('n') + ' tiene ' + K('n^2') + ' menores complementarios. Aquí están todos, colocados <b>en la ' +
      'posición del elemento al que corresponden</b>. ' + EJEMPLO + ' <b>Pulsa una casilla</b> de la ' +
      'rejilla (o mueve los deslizadores) y arriba se resalta la submatriz de la que sale ese menor. ' +
      'Los índices van <b>desde 1</b>.',
      [
        {
          id: 'A', label: 'Matriz cuadrada (una fila por línea)', type: 'textarea', rows: 4,
          value: multilinea(ESC.tres), ancho: '17rem'
        },
        { id: 'i', label: 'Fila i destacada', type: 'range', min: 1, max: 4, step: 1, value: 1, ancho: '12rem' },
        { id: 'j', label: 'Columna j destacada', type: 'range', min: 1, max: 4, step: 1, value: 1, ancho: '12rem' },
        { id: 'adj', label: 'Añadir también el adjunto A_ij', type: 'check', value: false },
        chips([
          { txt: 'Orden 3 · los 9 menores', tip: 'tabla completa de una 3×3', set: { A: multilinea(ESC.tres), i: 1, j: 1, adj: false } },
          { txt: 'Orden 3 · menores y adjuntos', tip: 'se añade el signo del tablero', set: { A: multilinea(ESC.tres), i: 2, j: 3, adj: true } },
          { txt: 'Con ceros', tip: 'los ceros del elemento no anulan su menor', set: { A: multilinea(ESC.conCeros), i: 1, j: 2, adj: true } },
          { txt: 'Triangular', tip: 'muchos menores salen fáciles', set: { A: multilinea(ESC.triangular), i: 3, j: 1, adj: false } },
          { txt: 'Orden 4 · los 16 menores', tip: 'los menores son de orden 3', set: { A: multilinea(ESC.cuatro), i: 2, j: 2, adj: false } },
          { txt: 'Identidad de orden 3', tip: 'los menores de la diagonal valen 1', set: { A: multilinea(ESC.identidad), i: 1, j: 1, adj: true } },
          { txt: 'Con fracciones', tip: 'aritmética exacta', set: { A: multilinea(ESC.fracciones), i: 3, j: 3, adj: true } }
        ])
      ],
      safe(function (v, ctl, out, api) {
        instalaClic(api, 'i', 'j');
        var S = capa();
        var A = leeCuad(v.A, 2, 4);
        var n = A.f;
        var i1 = leeIndice(v.i, n, 'fila');
        var j1 = leeIndice(v.j, n, 'columna');
        var i = i1 - 1, j = j1 - 1;
        var men = [], i2, j2;
        for (i2 = 0; i2 < n; i2++) {
          men.push([]);
          for (j2 = 0; j2 < n; j2++) men[i2].push(S.menorComp(A, i2, j2));
        }

        var h = cabecera(A);
        h += parrafo('Esta matriz de orden ' + n + ' tiene <b>' + (n * n) + ' menores complementarios</b>, ' +
          'uno por elemento, y todos son determinantes de orden ' + (n - 1) + '. Ahora está destacada la ' +
          'posición fila ' + i1 + ', columna ' + j1 + '.');
        h += figMatriz(A, {
          fila: i, col: j,
          titulo: 'De dónde sale ' + alfaTxt(i1, j1) + ': se tacha la fila ' + i1 + ' y la columna ' + j1,
          notas: [
            'posición destacada:',
            'fila ' + i1 + ', columna ' + j1,
            alfaTxt(i1, j1) + ' = ' + NT(men[i][j])
          ],
          pie: 'pulsa una casilla de la rejilla de abajo para cambiar de menor',
          label: 'Submatriz de origen del menor destacado',
          cap: 'La submatriz verde es la que da ' + K(alfaTex(i1, j1)) + '.'
        });

        h += titulo('Los ' + (n * n) + ' menores complementarios, en su sitio');
        h += figRejilla(n, function (p, q) {
          var esta = (p === i && q === j);
          var lin = [alfaTxt(p + 1, q + 1) + ' = ' + NT(men[p][q]),
            aTxt(p + 1, q + 1) + ' = ' + NT(A.a[p][q])];
          if (v.adj) {
            var sg = S.signoAdj(p, q);
            lin.push('signo ' + signoTxt(sg) + '  \u2192  ' + ATxt(p + 1, q + 1) + ' = ' +
              NT(S.adjunto(A, p, q)));
          }
          return {
            lineas: lin,
            col: esta ? COL.rojo : COL.azulOsc,
            col2: COL.gris,
            fondo: esta ? '#fdecea' : (cero(men[p][q]) ? '#f5f5f5' : '#f7fbff'),
            borde: esta ? COL.rojo : COL.guia,
            gr: esta ? 3.2 : 2
          };
        }, {
          cw: v.adj ? 176 : 150, ch: v.adj ? 118 : 100,
          titulo: 'Menor complementario de cada posición (índices desde 1)',
          pie: 'el menor de la posición (' + i1 + ', ' + j1 + ') está marcado en rojo',
          label: 'Rejilla de los menores complementarios',
          cap: 'Cada casilla ocupa el lugar de su elemento: la casilla de la fila ' + K('i') +
            ' y la columna ' + K('j') + ' contiene ' + K('\\alpha_{ij}') + '. Pulsa una para verla arriba.'
        });

        h += titulo('Los mismos datos en forma de tabla');
        var filas = [];
        for (i2 = 0; i2 < n; i2++) {
          for (j2 = 0; j2 < n; j2++) {
            var cel = [
              K(aTex(i2 + 1, j2 + 1)) + ' (fila ' + (i2 + 1) + ', columna ' + (j2 + 1) + ')',
              K(FT(A.a[i2][j2])),
              K(S.detTex(S.subMat(A, i2, j2))),
              K(alfaTex(i2 + 1, j2 + 1) + ' = ' + FT(men[i2][j2]))
            ];
            if (v.adj) {
              cel.push(K('(-1)^{' + (i2 + 1) + '+' + (j2 + 1) + '} = ' + (S.signoAdj(i2, j2) === 1 ? '+1' : '-1')));
              cel.push(K(ATex(i2 + 1, j2 + 1) + ' = ' + FT(S.adjunto(A, i2, j2))));
            }
            filas.push({ celdas: cel, clase: (i2 === i && j2 === j) ? 'detc-ok' : '' });
          }
        }
        var cab = ['Posición', 'Elemento', 'Submatriz', 'Menor complementario'];
        if (v.adj) { cab.push('Signo del tablero'); cab.push('Adjunto'); }
        h += M.tabla(cab, filas);

        var nulos = 0;
        for (i2 = 0; i2 < n; i2++) for (j2 = 0; j2 < n; j2++) if (cero(men[i2][j2])) nulos++;
        h += M.kvs([
          'menores calculados: <b>' + (n * n) + '</b>',
          'orden de cada menor: <b>' + (n - 1) + '</b>',
          'menores nulos: <b>' + nulos + '</b>'
        ]);
        if (nulos) {
          h += parrafo('Hay ' + nulos + ' menor(es) que valen ' + K('0') + ': eso pasa cuando la submatriz ' +
            'que queda tiene filas o columnas proporcionales. Un menor nulo no dice nada raro del elemento; ' +
            'solo que ese determinante pequeño se anula.');
        }
        h += pista('Para desarrollar el determinante por una línea solo hacen falta ' + K('n') +
          ' de estos ' + K('n^2') + ' menores: los de la línea elegida.');
        return h;
      }));
  };

  /* ==================================================================
     4 · Archivo 06 · el tablero de signos
     ================================================================== */
  R.signos = function (node) {
    var st = { reto: null, veredicto: null, aciertos: 0, fallos: 0 };

    function signoDe(i1, j1) { return capa().signoAdj(i1 - 1, j1 - 1); }

    return M.shell(node, 'El tablero de signos',
      'El adjunto lleva delante el factor ' + K('(-1)^{i+j}') + ', que solo puede valer ' + K('+1') +
      ' o ' + K('-1') + ': depende de si ' + K('i+j') + ' es par o impar. Colocando esos signos en la ' +
      'matriz sale el <b>tablero de ajedrez</b>, que empieza siempre por ' + K('+') + ' en la esquina de ' +
      'arriba a la izquierda (la posición ' + K('a_{11}') + ', con ' + K('i+j = 2') + ', que es par). ' +
      'Elige el orden, <b>pulsa una casilla</b> (o mueve los deslizadores) y verás la cuenta ' + K('i+j') +
      '. Al final tienes un <b>reto</b>: adivinar el signo de una posición al azar. Ejemplo de lectura: ' +
      'en la posición fila 2, columna 3 se tiene ' + K('i+j = 5') + ', impar, luego el signo es ' + K('-') +
      '. El tablero de orden 3 se lee, fila a fila, así: <code>+ &#8722; + / &#8722; + &#8722; / + &#8722; +</code>.',
      [
        { id: 'n', label: 'Orden del tablero', type: 'range', min: 2, max: 5, step: 1, value: 3, ancho: '12rem' },
        { id: 'i', label: 'Fila i', type: 'range', min: 1, max: 5, step: 1, value: 2, ancho: '12rem' },
        { id: 'j', label: 'Columna j', type: 'range', min: 1, max: 5, step: 1, value: 3, ancho: '12rem' },
        {
          id: 'resp', label: 'Mi respuesta al reto', type: 'select', value: '+',
          options: [{ value: '+', label: '+ (signo más)' }, { value: '-', label: '− (signo menos)' }]
        },
        {
          id: 'nuevo', label: 'Nuevo reto', type: 'button',
          click: function () {
            /* La posición se sortea en el recálculo, que es donde ya se
               conoce el orden del tablero. */
            st.reto = null; st.veredicto = null; st.pendiente = true;
          }
        },
        {
          id: 'comprobar', label: 'Comprobar mi respuesta', type: 'button',
          click: function (ctl) {
            if (!st.reto) { st.veredicto = { ok: false, sin: true }; return; }
            var correcto = signoDe(st.reto.i, st.reto.j);
            var dado = (String(ctl.resp ? ctl.resp.value : '+') === '+') ? 1 : -1;
            if (dado === correcto) { st.aciertos++; st.veredicto = { ok: true, signo: correcto }; }
            else { st.fallos++; st.veredicto = { ok: false, signo: correcto }; }
          }
        },
        chips([
          { txt: 'Orden 2', tip: 'el tablero más pequeño', set: { n: 2, i: 1, j: 2 } },
          { txt: 'Orden 3 · esquina a₁₁', tip: 'i+j = 2, par: signo +', set: { n: 3, i: 1, j: 1 } },
          { txt: 'Orden 3 · posición a₂₃', tip: 'i+j = 5, impar: signo −', set: { n: 3, i: 2, j: 3 } },
          { txt: 'Orden 4 · centro', tip: 'i+j = 5, impar', set: { n: 4, i: 2, j: 3 } },
          { txt: 'Orden 5 · última esquina', tip: 'i+j = 10, par: signo +', set: { n: 5, i: 5, j: 5 } },
          { txt: 'Diagonal principal', tip: 'en la diagonal i = j el signo es siempre +', set: { n: 4, i: 3, j: 3 } }
        ])
      ],
      safe(function (v, ctl) {
        var S = capa();
        var n = parseInt(String(v.n), 10);
        if (!isFinite(n) || n < 2 || n > 5) {
          throw Error('El tablero se dibuja para un orden entre 2 y 5. Mueve el deslizador del orden.');
        }
        var i1 = leeIndice(v.i, n, 'fila');
        var j1 = leeIndice(v.j, n, 'columna');
        var T = S.tableroSignos(n);
        var s = i1 + j1;
        var sg = T[i1 - 1][j1 - 1];

        /* Si se ha pedido un reto nuevo, se sortea ahora que ya sé el orden. */
        if (st.pendiente) {
          st.pendiente = false;
          st.reto = { i: aleatorio(n) + 1, j: aleatorio(n) + 1 };
          st.veredicto = null;
        }
        if (st.reto && (st.reto.i > n || st.reto.j > n)) { st.reto = null; st.veredicto = null; }

        var h = titulo('El tablero de orden ' + n);
        h += parrafo('Cada casilla lleva el signo de ' + K('(-1)^{i+j}') + ': ' + K('+') + ' si ' +
          K('i+j') + ' es <b>par</b> y ' + K('-') + ' si es <b>impar</b>. Los signos van alternándose como ' +
          'las casillas de un tablero de ajedrez, y en la <b>diagonal principal</b> (' + K('i = j') + ') ' +
          'siempre sale ' + K('+') + ', porque ' + K('i+j = 2i') + ' es par.');
        h += figRejilla(n, function (p, q) {
          var esta = (p === i1 - 1 && q === j1 - 1);
          var reto = st.reto && st.reto.i === p + 1 && st.reto.j === q + 1;
          return {
            lineas: [signoTxt(T[p][q]), 'i+j = ' + (p + q + 2)],
            col: esta ? COL.rojo : (T[p][q] === 1 ? COL.verde : COL.azulOsc),
            col2: COL.gris,
            fondo: reto ? '#fff8e1' : (esta ? '#fdecea' : (T[p][q] === 1 ? '#eaf7ee' : '#eef2fb')),
            borde: reto ? COL.naranja : (esta ? COL.rojo : COL.guia),
            gr: (reto || esta) ? 3.2 : 2
          };
        }, {
          cw: 130, ch: 96, size1: 34, size2: 18,
          titulo: 'Tablero de signos (\u22121)^(i+j) de orden ' + n,
          pie: 'posición elegida: fila ' + i1 + ', columna ' + j1 + '   \u00b7   signo ' + signoTxt(sg),
          label: 'Tablero de signos del adjunto',
          cap: 'Empieza por ' + K('+') + ' arriba a la izquierda y alterna en cada paso, tanto al bajar una ' +
            'fila como al avanzar una columna. La casilla naranja, si la hay, es la del reto.'
        });

        h += titulo('La cuenta de la posición elegida');
        h += caja('Posición fila ' + i1 + ', columna ' + j1,
          '(-1)^{i+j} = (-1)^{' + i1 + '+' + j1 + '} = (-1)^{' + s + '} = ' + (sg === 1 ? '+1' : '-1'));
        h += parrafo('Sumamos los índices: ' + K('i + j = ' + i1 + ' + ' + j1 + ' = ' + s) + '. Como ' +
          s + ' es <b>' + (s % 2 === 0 ? 'par' : 'impar') + '</b>, la potencia ' + K('(-1)^{' + s + '}') +
          ' vale ' + K(sg === 1 ? '+1' : '-1') + ', y por eso el adjunto ' + K(ATex(i1, j1)) +
          ' es ' + (sg === 1 ? 'igual a ' + K(alfaTex(i1, j1)) : 'el <b>opuesto</b> de ' + K(alfaTex(i1, j1))) + '.');
        h += M.resultado(K('(-1)^{' + i1 + '+' + j1 + '} = ' + (sg === 1 ? '+1' : '-1')),
          'signo de la posición (' + i1 + ', ' + j1 + ')');
        h += M.kvs([
          'i + j = <b>' + s + '</b>',
          'paridad: <b>' + (s % 2 === 0 ? 'par' : 'impar') + '</b>',
          'signo: <b>' + M.esc(signoTxt(sg)) + '</b>',
          i1 === j1 ? 'está en la <b>diagonal principal</b>' : 'no está en la diagonal principal'
        ]);
        h += pista('No hace falta calcular potencias: basta mirar si el número de pasos desde la esquina ' +
          K('a_{11}') + ' es par (mismo signo, ' + K('+') + ') o impar (signo cambiado, ' + K('-') + ').');

        h += titulo('Reto: adivina el signo');
        if (!st.reto) {
          h += parrafo('Pulsa <b>Nuevo reto</b>: el applet elegirá una posición al azar del tablero de ' +
            'orden ' + n + ', tú eliges el signo en el desplegable y después pulsas ' +
            '<b>Comprobar mi respuesta</b>.');
        } else {
          h += parrafo('Posición del reto: <b>fila ' + st.reto.i + ', columna ' + st.reto.j + '</b>. ' +
            '¿Qué signo lleva el adjunto ' + K(ATex(st.reto.i, st.reto.j)) + '? Elige en el desplegable y ' +
            'pulsa <b>Comprobar mi respuesta</b>.');
          if (st.veredicto && st.veredicto.sin) {
            h += aviso('Antes de comprobar hay que pedir un reto con el botón <b>Nuevo reto</b>.');
          } else if (st.veredicto && st.veredicto.ok) {
            h += bien('¡Correcto! En la posición (' + st.reto.i + ', ' + st.reto.j + ') se tiene ' +
              K('i+j = ' + (st.reto.i + st.reto.j)) + ', que es ' +
              ((st.reto.i + st.reto.j) % 2 === 0 ? 'par' : 'impar') + ', luego el signo es ' +
              K(st.veredicto.signo === 1 ? '+' : '-') + '.');
          } else if (st.veredicto) {
            h += mal('No es ese. En la posición (' + st.reto.i + ', ' + st.reto.j + ') se tiene ' +
              K('i+j = ' + (st.reto.i + st.reto.j)) + ', que es ' +
              ((st.reto.i + st.reto.j) % 2 === 0 ? 'par' : 'impar') + ', así que el signo correcto es ' +
              K(st.veredicto.signo === 1 ? '+' : '-') + '.');
          }
        }
        h += M.kvs(['aciertos: <b>' + st.aciertos + '</b>', 'fallos: <b>' + st.fallos + '</b>']);
        h += aviso('<b>Cuidado.</b> El signo del tablero multiplica al <b>menor complementario</b>, no al ' +
          'elemento: ' + K('A_{ij} = (-1)^{i+j}\\alpha_{ij}') + '. El elemento ' + K('a_{ij}') +
          ' conserva su propio signo.');
        return h;
      }));
  };

  /* ==================================================================
     5 · Archivo 06 · adjunto de un elemento
     ================================================================== */
  R.adjunto = function (node) {
    return M.shell(node, 'Adjunto de un elemento',
      'El <b>adjunto</b> del elemento ' + K('a_{ij}') + ' es su menor complementario con el signo del ' +
      'tablero: ' + K('A_{ij} = (-1)^{i+j} \\cdot \\alpha_{ij}') + '. ' + EJEMPLO + ' Elige la posición ' +
      'con los deslizadores o <b>pulsando una celda</b>. Fíjate en la cadena de abajo: el signo multiplica ' +
      'al <b>menor</b> ' + K('\\alpha_{ij}') + ', <b>nunca al elemento</b> ' + K('a_{ij}') + '. Los índices ' +
      'se cuentan <b>desde 1</b>.',
      [
        {
          id: 'A', label: 'Matriz cuadrada (una fila por línea)', type: 'textarea', rows: 4,
          value: multilinea(ESC.tres), ancho: '17rem'
        },
        { id: 'i', label: 'Fila i', type: 'range', min: 1, max: 5, step: 1, value: 2, ancho: '12rem' },
        { id: 'j', label: 'Columna j', type: 'range', min: 1, max: 5, step: 1, value: 1, ancho: '12rem' },
        { id: 'error', label: 'Mostrar el error típico del signo', type: 'check', value: true },
        chips([
          { txt: 'Signo + · posición a₁₁', tip: 'i+j = 2, par: el adjunto es el menor', set: { A: multilinea(ESC.tres), i: 1, j: 1, error: true } },
          { txt: 'Signo − · posición a₂₁', tip: 'i+j = 3, impar: el adjunto es el opuesto', set: { A: multilinea(ESC.tres), i: 2, j: 1, error: true } },
          { txt: 'Elemento negativo con signo −', tip: 'el elemento negativo no cambia el signo del tablero', set: { A: multilinea(ESC.tres), i: 1, j: 2, error: true } },
          { txt: 'Elemento nulo', tip: 'a_ij = 0 pero su adjunto no tiene por qué ser 0', set: { A: multilinea(ESC.conCeros), i: 1, j: 2, error: true } },
          { txt: 'Orden 4', tip: 'el menor es de orden 3', set: { A: multilinea(ESC.cuatro), i: 3, j: 2, error: true } },
          { txt: 'Orden 5', tip: 'el menor es de orden 4', set: { A: multilinea(ESC.cinco), i: 4, j: 2, error: false } },
          { txt: 'Con fracciones', tip: 'aritmética exacta', set: { A: multilinea(ESC.fracciones), i: 2, j: 3, error: true } }
        ])
      ],
      safe(function (v, ctl, out, api) {
        instalaClic(api, 'i', 'j');
        var S = capa();
        var A = leeCuad(v.A, 2, 5);
        var n = A.f;
        var i1 = leeIndice(v.i, n, 'fila');
        var j1 = leeIndice(v.j, n, 'columna');
        var i = i1 - 1, j = j1 - 1;
        var elem = A.a[i][j];
        var men = S.menorComp(A, i, j);
        var sg = S.signoAdj(i, j);
        var adj = S.adjunto(A, i, j);
        var sub2 = S.subMat(A, i, j);

        var h = cabecera(A);
        h += titulo('Paso 1 · el menor complementario ' + K(alfaTex(i1, j1)));
        h += figMatriz(A, {
          fila: i, col: j,
          titulo: 'Adjunto de ' + aTxt(i1, j1) + ': primero se tacha la fila ' + i1 + ' y la columna ' + j1,
          notas: [
            aTxt(i1, j1) + ' = ' + NT(elem),
            alfaTxt(i1, j1) + ' = ' + NT(men),
            'signo (\u22121)^(' + i1 + '+' + j1 + ') = ' + (sg === 1 ? '+1' : '\u22121'),
            ATxt(i1, j1) + ' = ' + NT(adj)
          ],
          pie: 'el adjunto se calcula en dos pasos: primero el menor, después el signo',
          label: 'Fila y columna tachadas para el adjunto',
          cap: 'Pulsa otra celda para cambiar de posición.'
        });
        h += caja('Menor complementario', alfaTex(i1, j1) + ' = ' + S.detTex(sub2) + ' = ' + FT(men));

        h += titulo('Paso 2 · el signo del tablero');
        h += caja('Factor de signo',
          '(-1)^{i+j} = (-1)^{' + i1 + '+' + j1 + '} = (-1)^{' + (i1 + j1) + '} = ' + (sg === 1 ? '+1' : '-1'));
        h += parrafo(K('i + j = ' + i1 + ' + ' + j1 + ' = ' + (i1 + j1)) + ', que es <b>' +
          ((i1 + j1) % 2 === 0 ? 'par' : 'impar') + '</b>, luego el factor vale ' +
          K(sg === 1 ? '+1' : '-1') + '.');

        h += titulo('Paso 3 · el adjunto');
        h += caja('Adjunto de ' + aTxt(i1, j1),
          ATex(i1, j1) + ' = (-1)^{' + i1 + '+' + j1 + '} \\cdot ' + alfaTex(i1, j1) + ' = ' +
          (sg === 1 ? '' : '-') + M.parNegTex(FT(men)) + ' = ' + FT(adj));
        h += figCadena([
          {
            rot: 'elemento ' + aTxt(i1, j1), valor: NT(elem), col: COL.azul, fondo: '#eef4fc',
            nota: 'no interviene en el menor'
          },
          {
            rot: 'signo (\u22121)^(' + i1 + '+' + j1 + ')', valor: (sg === 1 ? '+1' : '\u22121'),
            col: sg === 1 ? COL.verde : COL.rojo, fondo: sg === 1 ? '#eaf7ee' : '#fdecea',
            nota: 'i+j = ' + (i1 + j1) + ', ' + ((i1 + j1) % 2 === 0 ? 'par' : 'impar')
          },
          {
            rot: 'menor ' + alfaTxt(i1, j1), valor: NT(men), col: COL.morado, fondo: '#f6f2fb',
            nota: 'determinante de orden ' + (n - 1)
          }
        ], {
          titulo: 'El signo multiplica al MENOR, no al elemento',
          igual: 'signo \u00b7 menor = ' + (sg === 1 ? '+1' : '(\u22121)') + ' \u00b7 ' + PT(men) +
            ' = ' + ATxt(i1, j1) + ' = ' + NT(adj),
          pie: 'el elemento ' + aTxt(i1, j1) + ' = ' + NT(elem) +
            ' se usará después, al multiplicarlo por su adjunto en el desarrollo',
          label: 'Cadena elemento, signo y menor hasta el adjunto',
          cap: 'La caja azul está aparte a propósito: ' + K('a_{ij}') + ' no se multiplica por el signo. ' +
            'El adjunto es ' + K('(-1)^{i+j}\\alpha_{ij}') + '.'
        });
        h += M.resultado(K(ATex(i1, j1) + ' = ' + FT(adj)), 'adjunto de ' + aTxt(i1, j1));
        h += M.kvs([
          K(aTex(i1, j1)) + ' = <b>' + M.esc(NT(elem)) + '</b>',
          K(alfaTex(i1, j1)) + ' = <b>' + M.esc(NT(men)) + '</b>',
          'signo = <b>' + M.esc(signoTxt(sg)) + '</b>',
          K(ATex(i1, j1)) + ' = <b>' + M.esc(NT(adj)) + '</b>'
        ]);

        if (sg === 1) {
          h += bien('Aquí ' + K('i+j = ' + (i1 + j1)) + ' es par, así que ' +
            K(ATex(i1, j1) + ' = ' + alfaTex(i1, j1)) + ': el adjunto y el menor <b>coinciden</b>. ' +
            'Es el caso en el que el error del signo pasa desapercibido.');
        } else {
          h += aviso('Aquí ' + K('i+j = ' + (i1 + j1)) + ' es impar, así que ' +
            K(ATex(i1, j1) + ' = -' + alfaTex(i1, j1)) + ': el adjunto es el <b>opuesto</b> del menor. ' +
            'Si te olvidas del signo, el determinante saldrá mal.');
        }

        if (v.error) {
          var falso = sg === 1 ? elem : elem.opuesto();
          h += titulo('El error típico, para no volver a cometerlo');
          h += mal('<b>Mal:</b> aplicar el signo al elemento y escribir ' +
            K('(-1)^{' + i1 + '+' + j1 + '} \\cdot ' + aTex(i1, j1) + ' = ' + FT(falso)) +
            '. Eso no es el adjunto: es el elemento con el signo cambiado.');
          h += bien('<b>Bien:</b> el signo va con el menor, ' +
            K(ATex(i1, j1) + ' = (-1)^{' + i1 + '+' + j1 + '} \\cdot ' + alfaTex(i1, j1) + ' = ' + FT(adj)) +
            '. El elemento se usa aparte, en el producto ' + K(aTex(i1, j1) + ATex(i1, j1)) +
            ' del desarrollo.');
          h += M.tabla(['Expresión', '¿Qué es?', 'Valor'], [
            [K(aTex(i1, j1)), 'el elemento, tal como está en la matriz', K(FT(elem))],
            [K(alfaTex(i1, j1)), 'menor complementario: determinante sin signo', K(FT(men))],
            [K('(-1)^{' + i1 + '+' + j1 + '}'), 'signo del tablero', K(sg === 1 ? '+1' : '-1')],
            [K(ATex(i1, j1)), 'adjunto: signo por MENOR', K(FT(adj))],
            [K('(-1)^{' + i1 + '+' + j1 + '}' + aTex(i1, j1)), 'esto NO es el adjunto', K(FT(falso))],
            [K(aTex(i1, j1) + ' \\cdot ' + ATex(i1, j1)), 'sumando del desarrollo por esa línea',
              K(FT(elem.por(adj)))]
          ]);
        }
        if (cero(elem) && !cero(adj)) {
          h += parrafo('Fíjate en un detalle: ' + K(aTex(i1, j1) + ' = 0') + ' pero ' +
            K(ATex(i1, j1) + ' = ' + FT(adj) + ' \\ne 0') + '. El adjunto no depende del valor del ' +
            'elemento, sino de los <b>demás</b> elementos de la matriz. Lo que se anula es el producto ' +
            K(aTex(i1, j1) + ATex(i1, j1) + ' = 0') + ', y por eso conviene desarrollar por líneas con ceros.');
        }
        return h;
      }));
  };

  /* ==================================================================
     6 · Archivo 06 · menor complementario frente a adjunto
     ================================================================== */
  R.comparaMenorAdjunto = function (node) {
    return M.shell(node, 'Menor complementario y adjunto, lado a lado',
      'Este applet ataca de frente el error central del tema: <b>confundir el menor complementario con el ' +
      'adjunto</b>. Los dos salen de la misma submatriz, pero el adjunto lleva además el signo del tablero: ' +
      K('A_{ij} = (-1)^{i+j}\\alpha_{ij}') + '. Coinciden cuando ' + K('i+j') + ' es <b>par</b> y son ' +
      'opuestos cuando es <b>impar</b>. ' + EJEMPLO + ' Elige una posición con los deslizadores o ' +
      '<b>pulsando una celda</b>, y mira abajo la tabla de las ' + K('n^2') + ' posiciones. Índices ' +
      '<b>desde 1</b>.',
      [
        {
          id: 'A', label: 'Matriz cuadrada (una fila por línea)', type: 'textarea', rows: 4,
          value: multilinea(ESC.tres), ancho: '17rem'
        },
        { id: 'i', label: 'Fila i', type: 'range', min: 1, max: 5, step: 1, value: 1, ancho: '12rem' },
        { id: 'j', label: 'Columna j', type: 'range', min: 1, max: 5, step: 1, value: 2, ancho: '12rem' },
        { id: 'mapa', label: 'Ver el mapa de coincidencias', type: 'check', value: true },
        chips([
          { txt: 'Posición con signo − (a₁₂)', tip: 'aquí A_ij = −α_ij', set: { A: multilinea(ESC.tres), i: 1, j: 2, mapa: true } },
          { txt: 'Posición con signo + (a₂₂)', tip: 'aquí A_ij = α_ij', set: { A: multilinea(ESC.tres), i: 2, j: 2, mapa: true } },
          { txt: 'Orden 3 con ceros', tip: 'compara las nueve posiciones', set: { A: multilinea(ESC.conCeros), i: 2, j: 1, mapa: true } },
          { txt: 'Orden 4', tip: 'ocho posiciones coinciden y ocho se oponen', set: { A: multilinea(ESC.cuatro), i: 2, j: 3, mapa: true } },
          { txt: 'Matriz singular', tip: 'el determinante es 0, los adjuntos no', set: { A: multilinea(ESC.singular), i: 3, j: 2, mapa: true } },
          { txt: 'Con fracciones', tip: 'aritmética exacta', set: { A: multilinea(ESC.fracciones), i: 1, j: 3, mapa: true } }
        ])
      ],
      safe(function (v, ctl, out, api) {
        instalaClic(api, 'i', 'j');
        var S = capa();
        var A = leeCuad(v.A, 2, 5);
        var n = A.f;
        var i1 = leeIndice(v.i, n, 'fila');
        var j1 = leeIndice(v.j, n, 'columna');
        var i = i1 - 1, j = j1 - 1;
        var men = S.menorComp(A, i, j);
        var sg = S.signoAdj(i, j);
        var adj = S.adjunto(A, i, j);

        var h = cabecera(A);
        h += figMatriz(A, {
          fila: i, col: j,
          titulo: 'Misma submatriz para el menor y para el adjunto de ' + aTxt(i1, j1),
          notas: [
            alfaTxt(i1, j1) + ' = ' + NT(men),
            'signo = ' + signoTxt(sg),
            ATxt(i1, j1) + ' = ' + NT(adj)
          ],
          pie: 'la submatriz verde es la misma en los dos casos: lo único que cambia es el signo',
          label: 'Submatriz común al menor y al adjunto',
          cap: 'Pulsa otra celda para comparar en otra posición.'
        });

        h += titulo('Los dos, uno al lado del otro');
        h += '<div class="ap-grid2">' +
          '<div class="detc-caja"><h5 class="detc-h">Menor complementario ' + K(alfaTex(i1, j1)) + '</h5>' +
          KD(alfaTex(i1, j1) + ' = ' + S.detTex(S.subMat(A, i, j)) + ' = ' + FT(men)) +
          '<p class="detc-txt">Es <b>solo un determinante</b>: el de la submatriz que queda al tachar la ' +
          'fila ' + i1 + ' y la columna ' + j1 + '. No lleva ningún signo añadido.</p></div>' +
          '<div class="detc-caja"><h5 class="detc-h">Adjunto ' + K(ATex(i1, j1)) + '</h5>' +
          KD(ATex(i1, j1) + ' = (-1)^{' + i1 + '+' + j1 + '} \\cdot ' + alfaTex(i1, j1) + ' = ' +
            (sg === 1 ? '' : '-') + M.parNegTex(FT(men)) + ' = ' + FT(adj)) +
          '<p class="detc-txt">Es el menor <b>con el signo del tablero</b>. Aquí ' +
          K('i+j = ' + (i1 + j1)) + ' es ' + ((i1 + j1) % 2 === 0 ? 'par' : 'impar') + ', así que el signo ' +
          'es ' + K(sg === 1 ? '+1' : '-1') + '.</p></div></div>';

        if (sg === 1) {
          h += bien('En esta posición <b>coinciden</b>: ' +
            K(ATex(i1, j1) + ' = ' + alfaTex(i1, j1) + ' = ' + FT(men)) + '. Cuidado, porque esto pasa en ' +
            'la mitad de las posiciones y hace creer que el signo «no importa».');
        } else {
          h += aviso('En esta posición <b>se diferencian en el signo</b>: ' +
            K(ATex(i1, j1) + ' = -' + alfaTex(i1, j1) + ' = ' + FT(adj)) + ', mientras que ' +
            K(alfaTex(i1, j1) + ' = ' + FT(men)) + '. Usar el menor en lugar del adjunto cambia el ' +
            'resultado del determinante.');
        }
        h += M.tabla(['', 'Menor complementario', 'Adjunto'], [
          ['Notación', K(alfaTex(i1, j1)), K(ATex(i1, j1))],
          ['Definición', 'determinante de la submatriz', K('(-1)^{i+j} \\cdot \\alpha_{ij}')],
          ['¿Lleva signo?', 'no', 'sí, el del tablero'],
          ['Valor aquí', K(FT(men)), K(FT(adj))],
          ['¿Coinciden?', sg === 1 ? 'sí, porque ' + K('i+j') + ' es par'
            : 'no: ' + K(ATex(i1, j1) + ' = -' + alfaTex(i1, j1)), sg === 1 ? 'sí' : 'no']
        ]);

        /* tabla completa de las n² posiciones */
        h += titulo('Las ' + (n * n) + ' posiciones: ¿dónde coinciden y dónde no?');
        var filas = [], coinciden = 0, opuestos = 0, p, q;
        for (p = 0; p < n; p++) {
          for (q = 0; q < n; q++) {
            var mq = S.menorComp(A, p, q), sq = S.signoAdj(p, q), aq = S.adjunto(A, p, q);
            if (sq === 1) coinciden++; else opuestos++;
            filas.push({
              celdas: [
                'fila ' + (p + 1) + ', columna ' + (q + 1),
                K('i+j = ' + (p + 1) + '+' + (q + 1) + ' = ' + (p + q + 2)),
                K(sq === 1 ? '+1' : '-1'),
                K(alfaTex(p + 1, q + 1) + ' = ' + FT(mq)),
                K(ATex(p + 1, q + 1) + ' = ' + FT(aq)),
                sq === 1
                  ? M.badge('coinciden: ' + '\u03b1 = A', 'si')
                  : M.badge('opuestos: A = \u2212\u03b1', 'no')
              ],
              clase: (p === i && q === j) ? 'detc-ok' : (sq === 1 ? '' : 'detc-ko')
            });
          }
        }
        h += M.tabla(['Posición', 'Suma de índices', 'Signo', 'Menor', 'Adjunto', 'Relación'], filas);
        h += M.kvs([
          'posiciones en total: <b>' + (n * n) + '</b>',
          'con ' + K('\\alpha_{ij} = A_{ij}') + ': <b>' + coinciden + '</b>',
          'con ' + K('A_{ij} = -\\alpha_{ij}') + ': <b>' + opuestos + '</b>'
        ]);

        if (v.mapa) {
          h += figRejilla(n, function (p2, q2) {
            var s2 = S.signoAdj(p2, q2);
            var esta = (p2 === i && q2 === j);
            return {
              lineas: [
                s2 === 1 ? '\u03b1 = A' : 'A = \u2212\u03b1',
                alfaTxt(p2 + 1, q2 + 1) + ' = ' + NT(S.menorComp(A, p2, q2)),
                ATxt(p2 + 1, q2 + 1) + ' = ' + NT(S.adjunto(A, p2, q2))
              ],
              col: esta ? COL.rojo : (s2 === 1 ? COL.verde : COL.rosa),
              col2: COL.gris,
              fondo: esta ? '#fff8e1' : (s2 === 1 ? '#eaf7ee' : '#fdecea'),
              borde: esta ? COL.naranja : (s2 === 1 ? COL.verde : COL.rojo),
              gr: esta ? 3.4 : 2.2
            };
          }, {
            cw: 176, ch: 116, size1: 21, size2: 18,
            titulo: 'Mapa de coincidencias entre menor y adjunto',
            pie: 'en verde, ' + coinciden + ' posiciones donde coinciden; en rojo, ' + opuestos +
              ' donde se diferencian en el signo',
            label: 'Mapa de coincidencias entre menor complementario y adjunto',
            cap: 'El patrón es el del tablero de ajedrez: coinciden exactamente en las casillas de signo ' +
              K('+') + '.'
          });
        }
        h += aviso('<b>Regla para no fallar.</b> Escribe siempre el signo antes de calcular: ' +
          K('A_{ij} = (-1)^{i+j}\\alpha_{ij}') + '. Y recuerda que el signo <b>no</b> se aplica al ' +
          'elemento ' + K('a_{ij}') + ', que entra en el desarrollo con el valor que tiene.');
        return h;
      }));
  };

  /* ==================================================================
     7 · Archivo 07 · desarrollo por los adjuntos de una línea
     ================================================================== */
  R.desarrollo = function (node) {
    var st = { mostrar: null };     /* null = todos los términos */

    return M.shell(node, 'Desarrollo por los adjuntos de una línea',
      'Un determinante es igual a la <b>suma de los productos de los elementos de una línea por sus ' +
      'adjuntos</b>: ' + K('|A| = a_{i1}A_{i1} + a_{i2}A_{i2} + \\dots + a_{in}A_{in}') + ' (por la fila ' +
      K('i') + ') o ' + K('|A| = a_{1j}A_{1j} + \\dots + a_{nj}A_{nj}') + ' (por la columna ' + K('j') +
      '). ' + EJEMPLO + ' Elige si desarrollas por fila o por columna y cuál, y usa el botón <b>Término ' +
      'siguiente</b> para ir sumando de uno en uno. Las líneas se numeran <b>desde 1</b>.',
      [
        {
          id: 'A', label: 'Matriz cuadrada de orden 3 a 5 (una fila por línea)', type: 'textarea', rows: 5,
          value: multilinea(ESC.tres), ancho: '17rem'
        },
        {
          id: 'tipo', label: 'Desarrollar por', type: 'select', value: 'fila',
          options: [{ value: 'fila', label: 'una fila' }, { value: 'columna', label: 'una columna' }]
        },
        { id: 'k', label: 'Número de la línea', type: 'range', min: 1, max: 5, step: 1, value: 1, ancho: '12rem' },
        {
          id: 'paso', label: 'Empezar término a término', type: 'button',
          click: function () { st.mostrar = 0; }
        },
        {
          id: 'sig', label: 'Término siguiente', type: 'button',
          click: function () { st.mostrar = (st.mostrar === null ? 0 : st.mostrar) + 1; }
        },
        {
          id: 'todos', label: 'Ver todos los términos', type: 'button',
          click: function () { st.mostrar = null; }
        },
        chips([
          { txt: 'Orden 3 · por la fila 1', tip: 'el desarrollo clásico', set: { A: multilinea(ESC.tres), tipo: 'fila', k: 1 } },
          { txt: 'Orden 3 · por la columna 2', tip: 'sale el mismo valor', set: { A: multilinea(ESC.tres), tipo: 'columna', k: 2 } },
          { txt: 'Línea con dos ceros', tip: 'dos sumandos desaparecen', set: { A: multilinea(ESC.conCeros), tipo: 'fila', k: 1 } },
          { txt: 'Columna con dos ceros', tip: 'solo queda un menor', set: { A: multilinea(ESC.conCeros), tipo: 'columna', k: 2 } },
          { txt: 'Orden 4', tip: 'cuatro menores de orden 3', set: { A: multilinea(ESC.cuatro), tipo: 'fila', k: 2 } },
          { txt: 'Orden 5 con ceros', tip: 'conviene elegir bien la línea', set: { A: multilinea(ESC.cinco), tipo: 'columna', k: 1 } },
          { txt: 'Matriz singular', tip: 'la suma da 0', set: { A: multilinea(ESC.singular), tipo: 'fila', k: 1 } },
          { txt: 'Triangular', tip: 'por la primera columna sale el producto de la diagonal', set: { A: multilinea(ESC.triangular), tipo: 'columna', k: 1 } }
        ])
      ],
      safe(function (v) {
        var S = capa();
        var A = leeCuad(v.A, 3, 5);
        var n = A.f;
        var tipo = leeTipo(v.tipo);
        var k1 = leeIndice(v.k, n, tipo === 'fila' ? 'fila' : 'columna');
        var D = S.desarrollo(A, tipo, k1 - 1);
        var det = S.det(A);
        var vistos = (st.mostrar === null) ? n : Math.max(0, Math.min(n, st.mostrar));

        var h = cabecera(A);
        h += titulo('Desarrollo por la ' + tipo + ' ' + k1);
        h += parrafo(M.esc(D.descripcion));
        h += figMatriz(A, {
          lineaTipo: tipo, linea: k1 - 1,
          titulo: 'Se desarrolla por la ' + tipo + ' ' + k1 + ' (naranja)',
          notas: [
            'orden ' + n + ': ' + n + ' sumandos',
            'ceros en la línea: ' + D.ceros,
            'menores a calcular: ' + (n - D.ceros)
          ],
          pie: 'cada elemento de la línea naranja se multiplica por su adjunto',
          label: 'Línea elegida para el desarrollo',
          cap: 'Los sumandos cuyo elemento vale ' + K('0') + ' desaparecen sin calcular su menor.'
        });
        h += caja('La fórmula, escrita con esta línea',
          '|A| = ' + D.terminos.map(function (t, q) {
            return (q === 0 ? '' : ' + ') + aTex(t.i1, t.j1) + ATex(t.i1, t.j1);
          }).join(''));

        h += titulo('Los ' + n + ' términos, uno a uno');
        if (st.mostrar !== null) {
          h += pista('Vas por el término <b>' + vistos + ' de ' + n + '</b>. Pulsa <b>Término siguiente</b> ' +
            'para añadir el que viene, o <b>Ver todos los términos</b> para terminar de una vez.');
        }
        var suma = new M.Frac(0);
        D.terminos.forEach(function (t, q) {
          if (q >= vistos) return;
          suma = suma.mas(t.producto);
          var cuerpo = '<p class="detc-txt">Elemento ' + K(aTex(t.i1, t.j1) + ' = ' + FT(t.elem)) +
            ', en la fila ' + t.i1 + ' y la columna ' + t.j1 + '. Signo ' +
            K('(-1)^{' + t.i1 + '+' + t.j1 + '} = ' + (t.signo === 1 ? '+1' : '-1')) + '.</p>';
          if (cero(t.elem)) {
            cuerpo += '<p class="detc-txt">El elemento es ' + K('0') + ', así que el producto es ' + K('0') +
              ' y <b>no hace falta calcular su menor</b>. Ese es todo el ahorro de elegir una línea con ceros.</p>';
          } else {
            cuerpo += '<div class="detc-caja">' +
              KD(alfaTex(t.i1, t.j1) + ' = ' + S.detTex(t.menorMat) + ' = ' + FT(t.menor)) + '</div>';
          }
          cuerpo += '<div class="detc-caja">' + KD(
            ATex(t.i1, t.j1) + ' = ' + (t.signo === 1 ? '' : '-') + M.parNegTex(FT(t.menor)) + ' = ' +
            FT(t.adjunto) + ' \\qquad ' + aTex(t.i1, t.j1) + ATex(t.i1, t.j1) + ' = ' +
            M.parNegTex(FT(t.elem)) + ' \\cdot ' + M.parNegTex(FT(t.adjunto)) + ' = ' + FT(t.producto)
          ) + '</div>';
          cuerpo += '<p class="detc-txt">Suma acumulada tras este término: ' +
            K(FT(suma)) + '.</p>';
          h += M.paso('término ' + (q + 1), cuerpo, cero(t.elem) ? 'detc-paso-ind' : '');
        });

        if (vistos < n) {
          h += aviso('Faltan ' + (n - vistos) + ' término(s) por sumar: la suma parcial ' + K(FT(suma)) +
            ' <b>todavía no es el determinante</b>.');
        } else {
          var cadena = D.terminos.map(function (t) {
            return M.parNegTex(FT(t.elem)) + ' \\cdot ' + M.parNegTex(FT(t.adjunto));
          });
          var sumandos = D.terminos.map(function (t) { return FT(t.producto); });
          h += caja('La suma completa',
            '|A| = ' + M.sumandosTex(cadena) + ' = ' + M.sumandosTex(sumandos) + ' = ' + FT(D.total));
          h += M.resultado(K('|A| = ' + FT(D.total)), 'determinante por la ' + tipo + ' ' + k1);
          h += figBarras(D.terminos.map(function (t) {
            return {
              etq: aTxt(t.i1, t.j1) + ' \u00b7 ' + ATxt(t.i1, t.j1),
              valor: Math.abs(t.producto.val()),
              col: cero(t.producto) ? COL.gris : (neg(t.producto) ? COL.rojo : COL.verde),
              nota: '(' + NT(t.producto) + ')'
            };
          }), {
            titulo: 'Tamaño de cada sumando (en verde los positivos, en rojo los negativos)',
            pie: 'suma de los ' + n + ' sumandos = ' + NT(D.total),
            label: 'Sumandos del desarrollo',
            cap: 'La barra mide el valor absoluto del producto ' + K('a_{ij}A_{ij}') +
              '; el color dice el signo y el número entre paréntesis, el valor con su signo.'
          });
          if (igual(D.total, det)) {
            h += bien('Comprobación: el desarrollo por la ' + tipo + ' ' + k1 + ' da ' + K(FT(D.total)) +
              ', exactamente el determinante de la matriz. Y saldría lo mismo por cualquiera de las ' +
              (2 * n) + ' líneas.');
          } else {
            h += mal('Algo no cuadra: el desarrollo da ' + K(FT(D.total)) + ' y el determinante calculado ' +
              'aparte, ' + K(FT(det)) + '. Vuelve a cargar la página.');
          }
        }

        h += titulo('Tabla resumen de los términos');
        h += M.tabla(['Término', 'Elemento', 'Signo', 'Menor', 'Adjunto', 'Producto'],
          D.terminos.map(function (t, q) {
            return {
              celdas: [
                'nº ' + (q + 1) + ' (fila ' + t.i1 + ', columna ' + t.j1 + ')',
                K(aTex(t.i1, t.j1) + ' = ' + FT(t.elem)),
                K(t.signo === 1 ? '+1' : '-1'),
                K(alfaTex(t.i1, t.j1) + ' = ' + FT(t.menor)),
                K(ATex(t.i1, t.j1) + ' = ' + FT(t.adjunto)),
                K(FT(t.producto))
              ],
              clase: q < vistos ? '' : 'detc-ko'
            };
          }));
        h += M.kvs([
          'línea elegida: <b>' + tipo + ' ' + k1 + '</b>',
          'sumandos: <b>' + n + '</b>',
          'ceros: <b>' + D.ceros + '</b>',
          'menores realmente necesarios: <b>' + (n - D.ceros) + '</b>',
          'determinante: <b>' + M.esc(NT(D.total)) + '</b>'
        ]);
        return h;
      }));
  };

  /* ==================================================================
     8 · Archivo 07 · qué línea conviene elegir
     ================================================================== */
  R.eligeLinea = function (node) {
    return M.shell(node, 'Qué línea conviene para desarrollar',
      'El desarrollo se puede hacer por cualquiera de las ' + K('2n') + ' líneas (' + K('n') + ' filas y ' +
      K('n') + ' columnas) y <b>siempre sale el mismo número</b>. Pero el trabajo no es el mismo: cada ' +
      'elemento nulo se lleva por delante un menor de orden ' + K('n-1') + ' que no hay que calcular. ' +
      EJEMPLO + ' El applet cuenta los ceros de cada línea, mide el coste, recomienda la mejor y comprueba ' +
      'que las ' + K('2n') + ' dan el mismo determinante. Líneas numeradas <b>desde 1</b>.',
      [
        {
          id: 'A', label: 'Matriz cuadrada (una fila por línea)', type: 'textarea', rows: 5,
          value: multilinea(ESC.cuatroCeros), ancho: '17rem'
        },
        { id: 'comprueba', label: 'Comprobar las 2n líneas', type: 'check', value: true },
        chips([
          { txt: 'Orden 3 sin ceros', tip: 'da igual la línea: tres menores siempre', set: { A: multilinea(ESC.tres), comprueba: true } },
          { txt: 'Orden 3 con ceros', tip: 'una columna con dos ceros', set: { A: multilinea(ESC.conCeros), comprueba: true } },
          { txt: 'Orden 4 con muchos ceros', tip: 'la mejor línea ahorra tres menores', set: { A: multilinea(ESC.cuatroCeros), comprueba: true } },
          { txt: 'Orden 4 sin ceros', tip: 'cuatro menores de orden 3 sí o sí', set: { A: multilinea(ESC.cuatro), comprueba: true } },
          { txt: 'Orden 5', tip: 'aquí elegir bien se nota mucho', set: { A: multilinea(ESC.cinco), comprueba: true } },
          { txt: 'Triangular', tip: 'la primera columna tiene todo ceros menos uno', set: { A: multilinea(ESC.triangular), comprueba: true } },
          { txt: 'Identidad', tip: 'coste mínimo', set: { A: multilinea(ESC.identidad), comprueba: true } }
        ])
      ],
      safe(function (v) {
        var S = capa();
        var A = leeCuad(v.A, 2, 5);
        var n = A.f;
        var mejor = S.mejorLinea(A);
        var det = S.det(A);

        var h = cabecera(A);
        h += titulo('Ceros y coste de cada una de las ' + (2 * n) + ' líneas');
        h += parrafo('Desarrollar por una línea cuesta <b>un menor de orden ' + (n - 1) + ' por cada ' +
          'elemento no nulo</b>. Si la línea tiene ' + K('c') + ' ceros, hay que calcular ' + K('n - c') +
          ' menores en lugar de ' + K('n') + '.');
        var filas = mejor.lineas.map(function (L) {
          var esMejor = (L.tipo === mejor.tipo && L.indice === mejor.indice);
          return {
            celdas: [
              (L.tipo === 'fila' ? 'fila ' : 'columna ') + L.indice1,
              String(L.ceros),
              String(n - L.ceros),
              (n - L.ceros) + ' menor(es) de orden ' + (n - 1),
              esMejor ? M.badge('la más cómoda', 'si')
                : (L.ceros === mejor.ceros ? M.badge('empata en ceros', 'info') : '')
            ],
            clase: esMejor ? 'detc-ok' : (L.ceros === 0 ? 'detc-ko' : '')
          };
        });
        h += M.tabla(['Línea', 'Ceros', 'Productos a calcular', 'Trabajo', ''], filas);

        h += figBarras(mejor.lineas.map(function (L) {
          var esMejor = (L.tipo === mejor.tipo && L.indice === mejor.indice);
          return {
            etq: (L.tipo === 'fila' ? 'F' + sub(L.indice1) : 'C' + sub(L.indice1)) +
              '  (' + L.ceros + ' cero' + (L.ceros === 1 ? '' : 's') + ')',
            valor: n - L.ceros,
            col: esMejor ? COL.verde : (L.ceros ? COL.azul : COL.gris),
            nota: 'menor(es) de orden ' + (n - 1)
          };
        }), {
          titulo: 'Coste del desarrollo por cada línea (menores que hay que calcular)',
          pie: 'la barra más corta es la línea más cómoda: ' + (mejor.tipo === 'fila' ? 'fila ' : 'columna ') +
            mejor.indice1 + ' con ' + mejor.ceros + ' cero(s)',
          label: 'Coste por línea',
          cap: 'Todas las líneas dan el mismo determinante; lo que cambia es cuántos menores hay que calcular.'
        });

        h += titulo('La línea recomendada');
        h += parrafo(M.esc(mejor.descripcion));
        h += M.resultado(K(mejor.tipo === 'fila' ? 'F_{' + mejor.indice1 + '}' : 'C_{' + mejor.indice1 + '}'),
          'línea recomendada (' + mejor.ceros + ' ceros, ' + (n - mejor.ceros) + ' menores)');
        var Dm = S.desarrollo(A, mejor.tipo, mejor.indice);
        h += figMatriz(A, {
          lineaTipo: mejor.tipo, linea: mejor.indice,
          titulo: 'La línea recomendada: ' + (mejor.tipo === 'fila' ? 'fila ' : 'columna ') + mejor.indice1,
          notas: [
            'ceros: ' + mejor.ceros,
            'menores a calcular: ' + (n - mejor.ceros),
            'ahorro: ' + mejor.ceros + ' menor(es)'
          ],
          pie: 'desarrollando por ella el determinante sale ' + NT(Dm.total),
          label: 'Línea recomendada para el desarrollo',
          cap: 'Con ' + K(String(mejor.ceros)) + ' ceros en la línea se ahorran ' +
            K(String(mejor.ceros)) + ' determinantes de orden ' + K(String(n - 1)) + '.'
        });
        if (mejor.ceros === 0) {
          h += aviso('Esta matriz <b>no tiene ningún cero</b> en ninguna línea, así que da igual por dónde ' +
            'desarrolles: siempre hay que calcular ' + K(String(n)) + ' menores de orden ' + K(String(n - 1)) +
            '. En ese caso lo que conviene es <b>hacer ceros primero</b> con la propiedad ' +
            K('F_i \\to F_i + kF_j') + ', que no cambia el determinante.');
        } else {
          h += bien('Desarrollando por la ' + (mejor.tipo === 'fila' ? 'fila ' : 'columna ') + mejor.indice1 +
            ' solo hay que calcular ' + K(String(n - mejor.ceros)) + ' menor(es) en lugar de ' +
            K(String(n)) + '.');
        }
        if (mejor.empates.length > 1) {
          h += parrafo('Hay empate a ' + mejor.ceros + ' ceros entre ' +
            mejor.empates.map(function (L) {
              return '<b>' + (L.tipo === 'fila' ? 'fila ' : 'columna ') + L.indice1 + '</b>';
            }).join(', ') + '. Cualquiera de ellas sirve; el applet se queda con la primera fila que empata.');
        }

        if (v.comprueba) {
          h += titulo('Comprobación: las ' + (2 * n) + ' líneas dan el mismo número');
          var todas = [], bienTodas = true;
          mejor.lineas.forEach(function (L) {
            var D = S.desarrollo(A, L.tipo, L.indice);
            var ok = igual(D.total, det);
            if (!ok) bienTodas = false;
            todas.push({
              celdas: [
                (L.tipo === 'fila' ? 'fila ' : 'columna ') + L.indice1,
                String(n - L.ceros),
                K(D.terminos.map(function (t, q) {
                  return (q === 0 ? '' : ' + ') + aTex(t.i1, t.j1) + ATex(t.i1, t.j1);
                }).join('')),
                K(FT(D.total)),
                ok ? M.badge('coincide', 'si') : M.badge('no coincide', 'no')
              ],
              clase: ok ? '' : 'detc-ko'
            });
          });
          h += M.tabla(['Línea', 'Menores', 'Fórmula del desarrollo', 'Resultado', ''], todas);
          if (bienTodas) {
            h += bien('Las ' + (2 * n) + ' líneas dan ' + K('|A| = ' + FT(det)) + '. Por eso se puede elegir ' +
              'la que más convenga: el resultado no depende de la línea, solo el trabajo.');
          } else {
            h += mal('Alguna línea no coincide con el determinante. Vuelve a cargar la página.');
          }
        }
        h += pista('En un examen: mira primero la matriz. Si hay una línea con ceros, desarrolla por ella; ' +
          'si no hay ninguna, haz ceros con la propiedad ' + K('F_i \\to F_i + kF_j') + ' y después desarrolla.');
        return h;
      }));
  };

  /* ==================================================================
     9 · Archivo 07 · la suma por los adjuntos de una línea ajena
     ================================================================== */
  R.filaAjena = function (node) {
    return M.shell(node, 'Elementos de una línea por los adjuntos de otra',
      'Si multiplicas los elementos de una línea por <b>sus propios</b> adjuntos y sumas, sale el ' +
      'determinante. Pero si los multiplicas por los adjuntos de <b>otra</b> línea, la suma vale ' +
      'siempre ' + K('0') + ': ' + K('a_{i1}A_{k1} + a_{i2}A_{k2} + \\dots + a_{in}A_{kn} = 0') +
      ' cuando ' + K('i \\ne k') + '. ' + EJEMPLO + ' Elige las dos líneas con los deslizadores y ' +
      'compara los dos casos. Líneas numeradas <b>desde 1</b>.',
      [
        {
          id: 'A', label: 'Matriz cuadrada de orden 3 a 5 (una fila por línea)', type: 'textarea', rows: 5,
          value: multilinea(ESC.tres), ancho: '17rem'
        },
        {
          id: 'tipo', label: 'Trabajar con', type: 'select', value: 'fila',
          options: [{ value: 'fila', label: 'filas' }, { value: 'columna', label: 'columnas' }]
        },
        { id: 'i', label: 'Línea i (los elementos)', type: 'range', min: 1, max: 5, step: 1, value: 1, ancho: '12rem' },
        { id: 'k', label: 'Línea k (los adjuntos)', type: 'range', min: 1, max: 5, step: 1, value: 2, ancho: '12rem' },
        chips([
          { txt: 'Filas 1 y 2 · suma 0', tip: 'el caso i ≠ k', set: { A: multilinea(ESC.tres), tipo: 'fila', i: 1, k: 2 } },
          { txt: 'Misma fila · sale |A|', tip: 'el caso i = k es el desarrollo', set: { A: multilinea(ESC.tres), tipo: 'fila', i: 2, k: 2 } },
          { txt: 'Columnas 1 y 3 · suma 0', tip: 'vale igual para columnas', set: { A: multilinea(ESC.tres), tipo: 'columna', i: 1, k: 3 } },
          { txt: 'Con ceros', tip: 'algunos sumandos desaparecen', set: { A: multilinea(ESC.conCeros), tipo: 'fila', i: 3, k: 1 } },
          { txt: 'Orden 4', tip: 'cuatro sumandos que se cancelan', set: { A: multilinea(ESC.cuatro), tipo: 'fila', i: 4, k: 2 } },
          { txt: 'Orden 5', tip: 'cinco sumandos que se cancelan', set: { A: multilinea(ESC.cinco), tipo: 'columna', i: 2, k: 5 } },
          { txt: 'Matriz singular', tip: 'aquí también sale 0 con i = k', set: { A: multilinea(ESC.singular), tipo: 'fila', i: 1, k: 3 } }
        ])
      ],
      safe(function (v) {
        var S = capa();
        var A = leeCuad(v.A, 3, 5);
        var n = A.f;
        var tipo = leeTipo(v.tipo);
        var nombre = (tipo === 'fila') ? 'fila' : 'columna';
        var i1 = leeIndice(v.i, n, nombre);
        var k1 = leeIndice(v.k, n, nombre);
        var i = i1 - 1, k = k1 - 1;
        var det = S.det(A);
        var q, terminos = [], suma = new M.Frac(0);

        for (q = 0; q < n; q++) {
          var pe = (tipo === 'fila') ? i : q, qe = (tipo === 'fila') ? q : i;
          var pa = (tipo === 'fila') ? k : q, qa = (tipo === 'fila') ? q : k;
          var elem = A.a[pe][qe];
          var adj = S.adjunto(A, pa, qa);
          var prod = elem.por(adj);
          suma = suma.mas(prod);
          terminos.push({
            elem: elem, adj: adj, prod: prod,
            ei: pe + 1, ej: qe + 1, ai: pa + 1, aj: qa + 1,
            menor: S.menorComp(A, pa, qa), signo: S.signoAdj(pa, qa)
          });
        }

        var h = cabecera(A);
        h += titulo('La cuenta: elementos de la ' + nombre + ' ' + i1 + ' por los adjuntos de la ' +
          nombre + ' ' + k1);
        h += figMatriz(A, {
          lineaTipo: tipo, linea: i,
          marca: (function () {
            var lista = [];
            for (var t = 0; t < n; t++) {
              lista.push(tipo === 'fila' ? [k, t] : [t, k]);
            }
            return lista;
          })(),
          titulo: 'En naranja la ' + nombre + ' ' + i1 + ' (los elementos); en verde la ' + nombre + ' ' +
            k1 + ' (de donde salen los adjuntos)',
          notas: [
            'elementos: ' + nombre + ' ' + i1,
            'adjuntos: ' + nombre + ' ' + k1,
            i1 === k1 ? 'es la misma línea' : 'son líneas distintas'
          ],
          pie: i1 === k1 ? 'con i = k la suma es el determinante'
            : 'con i \u2260 k la suma vale 0',
          label: 'Las dos líneas del experimento',
          cap: 'Cada elemento de la línea naranja se multiplica por el adjunto que ocupa la misma ' +
            'posición dentro de la línea verde.'
        });

        h += M.tabla(['Sumando', 'Elemento', 'Adjunto', 'Signo', 'Menor', 'Producto'],
          terminos.map(function (t, q2) {
            return [
              'nº ' + (q2 + 1),
              K(aTex(t.ei, t.ej) + ' = ' + FT(t.elem)),
              K(ATex(t.ai, t.aj) + ' = ' + FT(t.adj)),
              K(t.signo === 1 ? '+1' : '-1'),
              K(alfaTex(t.ai, t.aj) + ' = ' + FT(t.menor)),
              K(FT(t.prod))
            ];
          }));
        h += caja('La suma, término a término',
          terminos.map(function (t, q2) {
            return (q2 === 0 ? '' : ' + ') + aTex(t.ei, t.ej) + ATex(t.ai, t.aj);
          }).join('') + ' = ' +
          M.sumandosTex(terminos.map(function (t) { return FT(t.prod); })) + ' = ' + FT(suma));
        h += figBarras(terminos.map(function (t, q2) {
          return {
            etq: aTxt(t.ei, t.ej) + ' \u00b7 ' + ATxt(t.ai, t.aj),
            valor: Math.abs(t.prod.val()),
            col: cero(t.prod) ? COL.gris : (neg(t.prod) ? COL.rojo : COL.verde),
            nota: '(' + NT(t.prod) + ')'
          };
        }), {
          titulo: 'Los ' + n + ' sumandos y su signo',
          pie: 'suma total = ' + NT(suma),
          label: 'Sumandos del producto por una línea ajena',
          cap: i1 === k1 ? 'Con ' + K('i = k') + ' los sumandos suman el determinante.'
            : 'Con ' + K('i \\ne k') + ' los positivos y los negativos se cancelan exactamente.'
        });

        h += titulo('Qué ha salido');
        if (i1 === k1) {
          h += M.resultado(K(FT(suma)), 'suma con i = k (es el determinante)');
          h += bien('Has elegido la <b>misma</b> línea dos veces (' + K('i = k = ' + i1) + '), así que esto ' +
            'es el desarrollo por los adjuntos de esa línea: la suma vale ' + K('|A| = ' + FT(det)) + '. ' +
            'Mueve uno de los deslizadores para ver qué pasa con dos líneas distintas.');
        } else {
          /* el «≠» va por KaTeX, que lo compone con su propio espaciado */
          h += M.resultado(K(FT(suma)), 'suma con ' + K('i \\neq k'));
          if (cero(suma)) {
            h += bien('Sale <b>' + K('0') + '</b>, como tenía que ser: la suma de los elementos de una línea ' +
              'por los adjuntos de <b>otra</b> línea siempre se anula, aunque los sumandos por separado no ' +
              'sean nada pequeños.');
          } else {
            h += mal('La suma tendría que ser 0. Vuelve a cargar la página.');
          }
        }

        h += titulo('Por qué sale cero');
        var B = A.copia();
        for (q = 0; q < n; q++) {
          if (tipo === 'fila') B.a[k][q] = A.a[i][q];
          else B.a[q][k] = A.a[q][i];
        }
        var detB = S.det(B);
        h += parrafo('Fíjate en la matriz ' + K('B') + ' que sale al <b>copiar la ' + nombre + ' ' + i1 +
          ' encima de la ' + nombre + ' ' + k1 + '</b>, dejando todo lo demás igual. Al cambiar solo la ' +
          nombre + ' ' + k1 + ', los adjuntos de esa línea <b>no cambian</b>: se calculan tachándola, así ' +
          'que no dependen de lo que haya escrito en ella.');
        h += caja('Matriz B: la ' + nombre + ' ' + k1 + ' se ha sustituido por la ' + nombre + ' ' + i1,
          S.matTex(B));
        h += parrafo('Desarrollando ' + K('|B|') + ' por su ' + nombre + ' ' + k1 + ' se obtiene ' +
          'exactamente la suma de arriba, ' + K(FT(suma)) + '. Pero ' + K('B') + ' tiene <b>dos ' +
          (tipo === 'fila' ? 'filas' : 'columnas') + ' iguales</b>' +
          (i1 === k1 ? '' : ' (la ' + i1 + ' y la ' + k1 + ')') + ', y un determinante con dos líneas ' +
          'repetidas vale ' + K('0') + ' (propiedad 4). Por tanto la suma vale ' + K('0') + '.');
        h += caja('Determinante de B', '|B| = ' + FT(detB));
        if (i1 !== k1) {
          var DB = S.desarrollo(B, tipo, k);
          h += M.kvs([
            'suma pedida: <b>' + M.esc(NT(suma)) + '</b>',
            'desarrollo de |B| por la ' + nombre + ' ' + k1 + ': <b>' + M.esc(NT(DB.total)) + '</b>',
            '|B| = <b>' + M.esc(NT(detB)) + '</b>',
            '|A| = <b>' + M.esc(NT(det)) + '</b>'
          ]);
          if (igual(DB.total, suma) && cero(detB)) {
            h += bien('Las tres cifras cuadran: la suma pedida, el desarrollo de ' + K('|B|') + ' y el ' +
              'propio ' + K('|B| = 0') + '. Eso demuestra la propiedad.');
          }
        }
        h += M.tabla(['Caso', 'Qué se suma', 'Cuánto vale'], [
          [K('i = k'), K('a_{i1}A_{i1} + \\dots + a_{in}A_{in}'), K('|A| = ' + FT(det))],
          [K('i \\ne k'), K('a_{i1}A_{k1} + \\dots + a_{in}A_{kn}'), K('0')]
        ]);
        h += aviso('<b>Para qué sirve esto.</b> Estas dos igualdades juntas son las que dan ' +
          K('A \\cdot \\operatorname{Adj}(A)^t = |A| \\cdot I') + ', y de ahí sale la fórmula de la matriz ' +
          'inversa con determinantes que verás más adelante.');
        return h;
      }));
  };

  /* ==================================================================
     10 · cierre del módulo
     ================================================================== */
  M.extraC = true;
  if (M.monta) M.monta();
})();
