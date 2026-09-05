/* =====================================================================
   det-applets-e.js · Módulo E del Tema 2 «Determinantes»
   2.º de Bachillerato · Matemáticas Aplicadas a las Ciencias Sociales
   Ruta: 2-BatxMatesCCSS/determinantes/assets/det-applets-e.js

   Cubre los archivos 10, 11, 12 y 13 del tema:

     10  Menor de una matriz.
     11  Rango de una matriz.
     12  Cálculo del rango a partir de sus menores (orlados).
     13  Rango de una matriz con parámetros.

   ---------------------------------------------------------------------
   CLAVES REGISTRADAS (9)
   ---------------------------------------------------------------------
     menorGeneral   Menor de orden h de una matriz cualquiera (no hace
                    falta que sea cuadrada). El alumno elige h y marca
                    qué h filas y qué h columnas toma; la figura resalta
                    la submatriz dentro de la matriz completa y aparte
                    se muestra ese menor y su valor. Cuando la elección
                    es «todas las filas menos una y todas las columnas
                    menos una», el applet avisa de que ese menor es
                    justamente el menor complementario del apartado
                    anterior.
     cuentaMenores  Cuántos menores tiene una matriz m×n de cada orden,
                    con el desarrollo del número combinatorio a la
                    vista, el total y un gráfico de barras. Explica por
                    qué el método de los orlados evita calcularlos
                    todos.
     rangoDef       El rango por definición: se recorre el orden de
                    mayor a menor y se busca el primer menor no nulo,
                    mostrando los menores que se van probando, el menor
                    testigo y por qué se detiene la búsqueda. Comprueba
                    las cotas rg(A) <= mín(m, n) y rg(A) = rg(At).
     rangoVsGauss   Los dos caminos, lado a lado: el escalonamiento de
                    Gauss con sus pasos y el número de filas no nulas
                    frente al menor no nulo de mayor orden. Incluye un
                    botón que genera mil matrices al azar de dimensiones
                    variadas y comprueba que los dos métodos coinciden
                    siempre, con su contador.
     rangoMenores   El método de los orlados paso a paso, con la cadena
                    elemento no nulo -> orlar con una fila y una columna
                    -> subir de orden o parar. Cada paso lleva la
                    submatriz resaltada y su determinante.
     orlado         Qué es orlar: dado un menor no nulo marcado dentro
                    de la matriz, se ven todos los menores orlados que
                    se obtienen añadiéndole una fila y una columna, uno
                    a uno, con su valor, cuántos hay y por qué basta con
                    que uno sea distinto de cero.
     retoRango      Reto autocorregido: el applet propone una matriz, el
                    alumno escribe el rango y el applet corrige mostrando
                    el razonamiento completo por orlados. Contador de
                    aciertos y dificultad ajustable por el tamaño.
     rangoParam     Rango en función de un parámetro: determinante como
                    polinomio en k, resolución de det = 0, tabla del
                    rango en cada valor crítico y en el caso general, y
                    recta real con los valores críticos marcados.
     discuteParam   Discusión guiada: el alumno decide qué menor mirar,
                    qué valores críticos salen y qué rango hay en cada
                    uno, y el applet valida o corrige cada decisión.
                    Al final redacta la discusión completa como se
                    pediría en un examen.

   ---------------------------------------------------------------------
   DEPENDENCIAS
   ---------------------------------------------------------------------
   Necesita cargados antes, en este orden:
     · el núcleo  det-applets.js       (window.DET)
     · la capa    det-applets-alg.js   (álgebra matricial exacta)
     · la capa    det-applets-det.js   (determinantes, menores, rango
                                        por orlados y parámetro)

   De las capas se usan literalmente, sin reimplementar nada:
     parseMat, matTex, matTxt, matTrans, matAleatoria, dimTxt, det,
     rango, rangoPasos, fracDe, fracTex, Mat,
     menoresDeOrden, cuentaMenores, submatriz, orlados, rangoMenores,
     detTex, numTxtDet, parTxtDet, combinaciones, menorComp,
     detParam, rangoParamEstudio, matParamDe, evalParam, matParamTex,
     pTex, pEval, factorizaTexPol.
   Del núcleo: shell, registry, K, KD, expr, tabla, paso, badge, kvs,
   resultado, svgWrap, altoDibujado, txt, line, rect, circle, poly,
   leyenda, COL, entero, Frac.

   ---------------------------------------------------------------------
   CRITERIOS DE PRESENTACIÓN
   ---------------------------------------------------------------------
   1. Aritmética EXACTA con DET.Frac (BigInt): los menores, los valores
      críticos del parámetro y los rangos son exactos. La coma flotante
      solo se usa para colocar píxeles.
   2. Dentro de un <svg> NO hay KaTeX: en los <text> solo texto llano
      con Unicode (F₁, C₃, ·, ×, −, ≠, ≤). Las fórmulas van fuera.
   3. Figuras de 760 px de ancho como mínimo, celdas a 25 px y rótulos
      en negrita a 19 px o más. El alto se deriva de lo dibujado con
      DET.altoDibujado, así que nunca queda margen inferior vacío ni
      dibujo cortado.
   4. Índices SIEMPRE en base 1 para el alumno; internamente base 0.
   5. Coma decimal, signo menos U+2212 y sumandos negativos entre
      paréntesis: «+ (−3)», nunca «+ −3».
   6. Ninguna entrada mala rompe la página: todo el cómputo va envuelto
      en safe(), que convierte cualquier Error en un aviso en castellano
      dentro del applet, y los avisos no se acumulan porque la salida se
      reconstruye entera en cada recálculo.
   7. El título lo pone DET.shell como «Applet · <titulo>»: los applets
      NO se numeran.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.DET;
  if (!S) {
    if (window.console && console.error) {
      console.error('[determinantes] det-applets-e.js necesita det-applets.js cargado antes.');
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
    if (!S.parseMat || !S.rango) {
      throw Error('No se ha cargado la capa de álgebra matricial (det-applets-alg.js). ' +
        'Recarga la página; si el aviso sigue, avisa al profesor.');
    }
    if (!S.menoresDeOrden || !S.rangoMenores || !S.rangoParamEstudio) {
      throw Error('No se ha cargado la capa de determinantes (det-applets-det.js). ' +
        'Recarga la página; si el aviso sigue, avisa al profesor.');
    }
    return S;
  }

  function FR(v) { return cap().fracDe(v); }
  function FT(f) { return cap().fracTex(f, true); }
  function cero(f) { return f.n === 0n; }
  function igF(a, b) { return a.cmp(b) === 0; }
  function numF(f) { return Number(f.n) / Number(f.d); }
  /* Número exacto en TEXTO LLANO para los rótulos de los SVG. */
  function nTxt(f) { return cap().numTxtDet(f); }

  var SUB_DIG = {
    '0': '\u2080', '1': '\u2081', '2': '\u2082', '3': '\u2083', '4': '\u2084',
    '5': '\u2085', '6': '\u2086', '7': '\u2087', '8': '\u2088', '9': '\u2089'
  };
  function sub(n) {
    return String(n).replace(/\d/g, function (d) { return SUB_DIG[d]; });
  }
  function fTxt(i0) { return 'F' + sub(i0 + 1); }      /* base 1 para el alumno */
  function cTxt(j0) { return 'C' + sub(j0 + 1); }
  function lista1(arr) {                                /* «1, 3» en base 1 */
    return arr.map(function (x) { return x + 1; }).join(', ');
  }
  function plural(n, sing, pl) { return n === 1 ? sing : (pl || sing + 's'); }

  /* Botones de escenario. */
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

  /* Cualquier error se convierte en aviso amable dentro del applet. */
  function safe(fn) {
    return function (v, ctl, out, api) {
      try {
        var h = fn(v, ctl, out, api);
        return (h === undefined || h === null || h === '')
          ? '<div class="mx-bad detc-err dete-err">No hay nada que mostrar todavía: revisa los datos que has escrito.</div>'
          : h;
      } catch (e) {
        var m = (e && e.message) ? e.message : 'No he podido calcular con estos datos.';
        return '<div class="mx-bad detc-err dete-err">' + S.esc(m) + '</div>';
      }
    };
  }

  function caja(label, tex) { return '<div class="detc-caja dete-caja">' + S.expr(label, tex) + '</div>'; }
  function parrafo(html) { return '<p class="detc-txt dete-txt">' + html + '</p>'; }
  function titulo(t) { return '<h5 class="detc-h dete-h">' + t + '</h5>'; }
  function aviso(html) { return '<p class="detc-aviso dete-aviso">' + html + '</p>'; }
  function pista(html) { return '<p class="detc-pista dete-pista"><b>Pista:</b> ' + html + '</p>'; }
  function bien(html) { return '<p class="detc-bien dete-bien">' + html + '</p>'; }
  function mal(html) { return '<p class="detc-mal dete-mal">' + html + '</p>'; }

  /* ------------------------------------------------------------------
     Lectura de entradas
     ------------------------------------------------------------------ */
  var EJ_MAT = 'Escribe la matriz por filas, con los elementos separados por espacios y las filas ' +
    'separadas por «;» o por un salto de línea. Ejemplo copiable: <code>1 2 3 4; 2 4 6 8; 1 0 1 0</code>. ' +
    'Valen enteros (<code>-2</code>), decimales con coma (<code>0,5</code>) y fracciones (<code>1/2</code>).';
  var EJ_IDX = 'Las filas y las columnas se numeran <b>desde 1</b>: para tomar la primera y la tercera ' +
    'escribe <code>1 3</code>.';
  var EJ_PAR = 'Una matriz <b>con parámetro</b> se escribe igual, usando la letra <code>k</code> en las ' +
    'casillas que la lleven. Ejemplo copiable: <code>1 1 1; 1 k 1; 1 1 k</code>. También valen ' +
    '<code>k-1</code>, <code>2k+3</code> y <code>k^2</code>; lo que no vale es el parámetro en el ' +
    'denominador (<code>1/k</code>) ni dos parámetros distintos.';

  function leeM(txtIn, etiqueta, maxF, maxC) {
    etiqueta = etiqueta || 'la matriz';
    var s = String(txtIn === undefined || txtIn === null ? '' : txtIn).trim();
    if (s === '') {
      throw Error('Escribe ' + etiqueta + ' por filas, separando los elementos con espacios y las filas ' +
        'con «;» o con un salto de línea. Por ejemplo: 1 2 3 4; 2 4 6 8; 1 0 1 0.');
    }
    var A = cap().parseMat(s);
    if (maxF && A.f > maxF) {
      throw Error('Este applet trabaja con un máximo de ' + maxF + ' filas y has escrito ' + A.f +
        '. Quita alguna fila: así todo se ve grande y las cuentas siguen siendo instantáneas.');
    }
    if (maxC && A.c > maxC) {
      throw Error('Este applet trabaja con un máximo de ' + maxC + ' columnas y has escrito ' + A.c +
        '. Quita alguna columna para que la matriz se lea bien en la pantalla.');
    }
    return A;
  }

  /* Lista de índices escrita por el alumno en BASE 1 -> array base 0. */
  function leeIdx(txtIn, quees, tope, cuantos) {
    var s = String(txtIn === undefined || txtIn === null ? '' : txtIn).trim();
    if (s === '') {
      throw Error('Escribe qué ' + quees + ' tomas, numeradas desde 1 y separadas por espacios. ' +
        'Por ejemplo: 1 3.');
    }
    var tk = s.split(/[\s;,]+/).filter(function (t) { return t !== ''; });
    var out = [], vistos = {}, i;
    for (i = 0; i < tk.length; i++) {
      if (!/^\d+$/.test(tk[i])) {
        throw Error('No entiendo «' + tk[i] + '» como número de ' + quees.replace(/s$/, '') +
          '. Escribe números enteros positivos separados por espacios, por ejemplo 1 3.');
      }
      var x = Number(tk[i]);
      if (x < 1 || x > tope) {
        throw Error('Esta matriz solo tiene ' + tope + ' ' + quees + ', numeradas de 1 a ' + tope +
          ', y has escrito ' + x + '.');
      }
      if (vistos[x]) {
        throw Error('No se puede tomar dos veces la misma línea: has repetido el número ' + x +
          ' en las ' + quees + '.');
      }
      vistos[x] = true;
      out.push(x - 1);
    }
    if (cuantos !== undefined && out.length !== cuantos) {
      throw Error('Un menor de orden ' + cuantos + ' se forma con ' + cuantos + ' ' + quees +
        ' exactamente, y has escrito ' + out.length + '. Por ejemplo, para orden 2: 1 3.');
    }
    out.sort(function (a, b) { return a - b; });
    return out;
  }

  /* Lista de números exactos (valores del parámetro propuestos). */
  function leeListaFrac(txtIn, etiqueta) {
    var s = String(txtIn === undefined || txtIn === null ? '' : txtIn).trim();
    if (s === '' || /^(ninguno|ninguna|no hay|nada|-)$/i.test(s)) return [];
    var tk = s.split(/[\s;]+/).filter(function (t) { return t !== ''; });
    return tk.map(function (t) {
      var u = t.replace(/[−–—]/g, '-');
      if (!/^[+-]?\d+(?:[.,]\d+)?(?:\/\d+)?$/.test(u)) {
        throw Error('No entiendo «' + t + '» en ' + etiqueta + '. Escribe enteros (−1), decimales con ' +
          'coma (0,5) o fracciones (3/2), separados por espacios. Si no hay ninguno, escribe «ninguno».');
      }
      return FR(u);
    });
  }

  function leeLetra(txtIn) {
    var s = String(txtIn === undefined ? 'k' : txtIn).trim().toLowerCase();
    if (s === '') s = 'k';
    if (!/^[a-z]$/.test(s)) {
      throw Error('El parámetro es UNA sola letra: escribe k, m, a… (por omisión, k).');
    }
    return s;
  }

  /* Lista de enteros pequeños escrita por el alumno (rangos propuestos). */
  function leeListaEnt(txtIn, etiqueta, tope) {
    var s = String(txtIn === undefined || txtIn === null ? '' : txtIn).trim();
    if (s === '') return [];
    var tk = s.split(/[\s;,]+/).filter(function (t) { return t !== ''; });
    return tk.map(function (t) {
      if (!/^\d+$/.test(t)) {
        throw Error('No entiendo «' + t + '» en ' + etiqueta + '. Un rango es un número entero mayor o ' +
          'igual que 0: escribe por ejemplo 2 1.');
      }
      var x = Number(t);
      if (x > tope) {
        throw Error('El rango de esta matriz no puede pasar de ' + tope + ', y has escrito ' + x + '.');
      }
      return x;
    });
  }

  /* Generador pseudoaleatorio reproducible (para los retos y el
     comprobador de mil matrices: la misma semilla da la misma serie). */
  function Az(semilla) {
    this.s = (semilla === undefined ? 20260904 : Math.abs(Math.round(semilla))) % 2147483647 || 12345;
  }
  Az.prototype.ent = function (min, max) {
    this.s = (this.s * 1103515245 + 12345) % 2147483648;
    var u = this.s / 2147483648;
    return min + Math.floor(u * (max - min + 1));
  };
  Az.prototype.matriz = function (f, c, min, max) {
    var a = [], i, j;
    for (i = 0; i < f; i++) {
      a.push([]);
      for (j = 0; j < c; j++) a[i].push(new Frac(this.ent(min, max)));
    }
    return new (cap().Mat)(a);
  };

  /* ------------------------------------------------------------------
     MEDIDA APROXIMADA DE UN RÓTULO SVG.

     Los rótulos de estas figuras se centraban en W/2 sin medir su
     anchura, así que los pies largos se salían del viewBox y quedaban
     recortados por los dos lados. anchoTxt() estima la anchura en
     unidades de usuario del viewBox a partir del cuerpo de letra y del
     tipo de cada carácter (las tipografías del tema son de anchura
     variable: la «i» ocupa la mitad que la «m»). Está calibrada contra
     las medidas reales de getBBox() de la auditoría: para el pie de
     menorGeneral a 20 px devuelve ~1000 frente a los 952 reales, es
     decir, sobreestima un poco, que es el lado seguro.

     parteTxt() corta un rótulo largo en varias líneas que quepan en el
     ancho disponible, sin partir palabras.
     ------------------------------------------------------------------ */
  var ANCHO_ESTRECHO = 'iljtfr.,;:!|\'"()[]{}·` ';
  var ANCHO_ANCHO = 'mwMW—…@%';
  function anchoTxt(s, size, negrita) {
    var t = String(s === null || s === undefined ? '' : s), u = 0, k;
    for (k = 0; k < t.length; k++) {
      var c = t.charAt(k);
      if (ANCHO_ESTRECHO.indexOf(c) >= 0) u += 0.36;
      else if (ANCHO_ANCHO.indexOf(c) >= 0) u += 0.92;
      else if (c >= 'A' && c <= 'Z') u += 0.68;
      else u += 0.56;
    }
    return u * (size || 18) * (negrita === false ? 1 : 1.03);
  }
  function parteTxt(s, size, negrita, maxAncho) {
    var pal = String(s === null || s === undefined ? '' : s).split(/\s+/);
    var lineas = [], act = '', k;
    for (k = 0; k < pal.length; k++) {
      if (!pal[k]) continue;
      var pru = act ? act + ' ' + pal[k] : pal[k];
      if (act && anchoTxt(pru, size, negrita) > maxAncho) { lineas.push(act); act = pal[k]; }
      else act = pru;
    }
    if (act) lineas.push(act);
    return lineas.length ? lineas : [''];
  }

  /* ------------------------------------------------------------------
     FIGURA 1 · la matriz completa con un menor resaltado.

     o = { titulo, sub, filasSel, colsSel (base 0),
           filasNuevas, colsNuevas (la fila y la columna que se añaden
           al orlar, en verde), notas:[por fila], pie:[líneas],
           label, cap }
     Todos los rótulos van en TEXTO LLANO: F₁, C₃, −5, 3/4.
     ------------------------------------------------------------------ */
  function figMat(A, o) {
    o = o || {};
    var selF = {}, selC = {}, addF = {}, addC = {}, i, j;
    (o.filasSel || []).forEach(function (x) { selF[x] = true; });
    (o.colsSel || []).forEach(function (x) { selC[x] = true; });
    (o.filasNuevas || []).forEach(function (x) { addF[x] = true; });
    (o.colsNuevas || []).forEach(function (x) { addC[x] = true; });
    var notas = o.notas || [];
    var hayNotas = false;
    for (i = 0; i < notas.length; i++) if (notas[i]) hayNotas = true;

    var cw = 98, ch = 66, y0 = 158, dy = ch + 16;

    /* --- Anchura del lienzo medida sobre el contenido real ----------
       Antes: W = max(760, x0 + A.c*cw + 130|320) con x0 fijo en 176, y
       el título, el subtítulo y el pie se centraban en W/2 sin medirse:
       cualquier línea larga se salía del viewBox por los dos lados.
       Ahora se mide todo: el bloque de la matriz (rótulos de fila +
       celdas + notas) fija el ancho mínimo, los rótulos centrados que
       no quepan se parten en varias líneas, y si aun así una línea
       sigue siendo más ancha que el lienzo, el lienzo crece.
       El bloque de la matriz se centra dentro del lienzo. */
    var MARGEN = 30;                    /* aire a cada lado del lienzo */
    var IZQ = 92;                       /* carril de los rótulos F₁, F₂… */
    var anchoNotas = 0;
    notas.forEach(function (t) {
      if (t) anchoNotas = Math.max(anchoNotas, anchoTxt(t, 19) + 18);
    });
    var bloque = IZQ + A.c * cw + anchoNotas + (anchoNotas ? 16 : 24);
    var W = Math.max(760, bloque + 2 * MARGEN);
    var titulo = o.titulo || 'La matriz y el menor elegido';
    var lineasT = parteTxt(titulo, 25, true, W - 2 * MARGEN);
    var lineasS = o.sub ? parteTxt(o.sub, 20, true, W - 2 * MARGEN) : [];
    var lineasP = [];
    (o.pie || []).forEach(function (t, q) {
      parteTxt(t, 20, true, W - 2 * MARGEN).forEach(function (l) {
        lineasP.push({ t: l, primera: q === 0 });
      });
    });
    /* Una palabra suelta puede seguir sin caber: entonces manda el texto. */
    function ensancha(lin, size) {
      lin.forEach(function (l) {
        W = Math.max(W, Math.ceil(anchoTxt(typeof l === 'string' ? l : l.t, size) + 2 * MARGEN));
      });
    }
    ensancha(lineasT, 25); ensancha(lineasS, 20); ensancha(lineasP, 20);
    var x0 = Math.max(IZQ, Math.round((W - bloque) / 2) + IZQ);

    var yTit = 58, k;
    var b = '';
    for (k = 0; k < lineasT.length; k++) {
      b += S.txt(W / 2, yTit + k * 32, lineasT[k], { size: 25, weight: 'bold', fill: COL.azulOsc });
    }
    var ySub = yTit + lineasT.length * 32 + 10;
    for (k = 0; k < lineasS.length; k++) {
      b += S.txt(W / 2, ySub + k * 28, lineasS[k], { size: 20, weight: 'bold', fill: COL.gris });
    }
    y0 = Math.max(158, ySub + (lineasS.length ? (lineasS.length - 1) * 28 + 58 : 30));

    for (j = 0; j < A.c; j++) {
      b += S.txt(x0 + j * cw + cw / 2, y0 - 20, cTxt(j), {
        size: 20, weight: 'bold',
        fill: selC[j] ? COL.rojo : (addC[j] ? COL.verde : COL.gris)
      });
    }
    for (i = 0; i < A.f; i++) {
      var y = y0 + i * dy;
      b += S.txt(x0 - 26, y + ch * 0.66, fTxt(i), {
        size: 21, weight: 'bold', anchor: 'end',
        fill: selF[i] ? COL.rojo : (addF[i] ? COL.verde : COL.gris)
      });
      for (j = 0; j < A.c; j++) {
        var enF = selF[i] || addF[i], enC = selC[j] || addC[j];
        var dentro = enF && enC;
        var nuevo = dentro && (addF[i] || addC[j]);
        var relleno = dentro ? (nuevo ? '#eaf7ec' : '#fdecef') : ((enF || enC) ? '#f4f8fb' : '#ffffff');
        var borde = dentro ? (nuevo ? COL.verde : COL.rojo) : COL.guia;
        b += S.rect(x0 + j * cw + 5, y, cw - 10, ch, relleno, borde, { r: 9, sw: dentro ? 3 : 1.4 });
        b += S.txt(x0 + j * cw + cw / 2, y + ch * 0.66, nTxt(A.a[i][j]), {
          size: 25, weight: 'bold', fill: dentro ? COL.texto : '#78909c'
        });
      }
      if (notas[i]) {
        b += S.txt(x0 + A.c * cw + 18, y + ch * 0.66, notas[i], {
          size: 19, weight: 'bold', anchor: 'start',
          fill: selF[i] ? COL.rojo : (addF[i] ? COL.verde : COL.gris)
        });
      }
    }
    var yPie = y0 + A.f * dy + 26;
    lineasP.forEach(function (l, q) {
      b += S.txt(W / 2, yPie + q * 34, l.t, {
        size: 20, weight: 'bold', fill: l.primera ? COL.azulOsc : COL.gris
      });
    });
    var H = S.altoDibujado(b) + 24;
    var bg = S.rect(2, 2, W - 4, H - 4, '#ffffff', '#e3e9ef', { r: 12, sw: 2 });
    return S.svgWrap(bg + b, W, H, o.label || 'Matriz con un menor marcado', o.cap || '');
  }

  /* ------------------------------------------------------------------
     FIGURA 2 · barras horizontales comparativas.
     items = [{etq, valor, col, extra}]
     ------------------------------------------------------------------ */
  function figBarras(items, o) {
    o = o || {};
    var maxv = 1, i;
    items.forEach(function (it) { maxv = Math.max(maxv, it.valor); });
    var dy = 92, y0 = 132;

    /* --- Anchura medida, no fijada a ojo ---------------------------
       Antes: x0 = 300 y W = 980 fijos, con la etiqueta de cada barra
       escrita en x0 + w + 20 sin medirla: en las barras largas («15
       menores del orden más alto») el texto se salía del viewBox y se
       leía «15 menores d». Ahora el carril izquierdo se ajusta al
       rótulo más largo, el margen derecho al texto más largo de barra,
       y los rótulos centrados (título, subtítulo, pie) ensanchan el
       lienzo si hace falta. */
    var MARGEN = 30;
    var etqMax = 0, extMax = 0;
    items.forEach(function (it) {
      etqMax = Math.max(etqMax, anchoTxt(it.etq, 20));
      extMax = Math.max(extMax, anchoTxt(String(it.valor) + (it.extra ? '  ' + it.extra : ''), 22));
    });
    var x0 = Math.max(300, Math.ceil(etqMax + 26 + MARGEN));
    var der = Math.max(170, Math.ceil(20 + extMax + MARGEN));
    var W = Math.max(980, x0 + 380 + der);
    var titulo = o.titulo || 'Comparación';
    var lineasT = parteTxt(titulo, 25, true, W - 2 * MARGEN);
    var lineasS = o.sub ? parteTxt(o.sub, 20, true, W - 2 * MARGEN) : [];
    var lineasP = [];
    (o.pie || []).forEach(function (t) {
      parteTxt(t, 20, true, W - 2 * MARGEN).forEach(function (l) { lineasP.push(l); });
    });
    [[lineasT, 25], [lineasS, 20], [lineasP, 20]].forEach(function (par) {
      par[0].forEach(function (l) {
        W = Math.max(W, Math.ceil(anchoTxt(l, par[1]) + 2 * MARGEN));
      });
    });
    var largo = W - x0 - der;
    var b = '', k;
    for (k = 0; k < lineasT.length; k++) {
      b += S.txt(W / 2, 58 + k * 32, lineasT[k], { size: 25, weight: 'bold', fill: COL.azulOsc });
    }
    var ySub = 58 + lineasT.length * 32 + 8;
    for (k = 0; k < lineasS.length; k++) {
      b += S.txt(W / 2, ySub + k * 28, lineasS[k], { size: 20, weight: 'bold', fill: COL.gris });
    }
    y0 = Math.max(132, ySub + (lineasS.length ? (lineasS.length - 1) * 28 + 34 : 6));
    for (i = 0; i < items.length; i++) {
      var it = items[i];
      var y = y0 + i * dy;
      /* Valor 0 = ninguna barra (antes se pintaba un resto de 6 px que
         parecía una celda diminuta); valor > 0 = barra siempre visible. */
      var w = it.valor > 0 ? Math.max(16, largo * it.valor / maxv) : 0;
      b += S.txt(x0 - 26, y + 34, it.etq, { size: 20, weight: 'bold', fill: COL.texto, anchor: 'end' });
      b += S.rect(x0, y, largo, 52, '#f4f8fb', COL.guia, { r: 8, sw: 1.4 });
      if (w > 0) b += S.rect(x0, y, w, 52, it.col || COL.azul, 'none', { r: 8, op: 0.85 });
      b += S.txt(x0 + w + 20, y + 34, String(it.valor) + (it.extra ? '  ' + it.extra : ''), {
        size: 22, weight: 'bold', fill: it.col || COL.azul, anchor: 'start'
      });
    }
    var yPie = y0 + items.length * dy + 16;
    lineasP.forEach(function (t, q) {
      b += S.txt(W / 2, yPie + q * 34, t, { size: 20, weight: 'bold', fill: COL.gris });
    });
    var H = S.altoDibujado(b) + 24;
    var bg = S.rect(2, 2, W - 4, H - 4, '#ffffff', '#e3e9ef', { r: 12, sw: 2 });
    return S.svgWrap(bg + b, W, H, o.label || 'Barras comparativas', o.cap || '');
  }

  /* ------------------------------------------------------------------
     FIGURA 3 · recta real con los valores críticos del parámetro.
     criticos = [{valor:Frac, rango:int}] (ya ordenados), generico = int.
     Las posiciones NO son a escala: se reparten a intervalos iguales
     para que los rótulos nunca se pisen.
     ------------------------------------------------------------------ */
  function figRecta(criticos, generico, letra, kv) {
    letra = letra || 'k';
    var W = 980, y = 300;
    var xi = 110, xf = W - 110;
    var b = S.txt(W / 2, 58, 'Casos del parámetro ' + letra + ' y rango en cada uno',
      { size: 25, weight: 'bold', fill: COL.azulOsc });
    b += S.line(xi, y, xf, y, COL.eje, 3.2);
    b += S.poly([[xf, y], [xf - 20, y - 10], [xf - 20, y + 10]], COL.eje, COL.eje, 1);
    b += S.txt(xf - 6, y - 26, letra, { size: 21, weight: 'bold', fill: COL.eje, anchor: 'end' });

    var n = criticos.length, pos = [], i;
    for (i = 0; i < n; i++) pos.push(xi + (xf - xi) * (i + 1) / (n + 1));
    var zonas = [];
    for (i = 0; i <= n; i++) {
      var a = (i === 0) ? xi : pos[i - 1];
      var c = (i === n) ? xf - 30 : pos[i];
      zonas.push((a + c) / 2);
    }
    zonas.forEach(function (x) {
      b += S.txt(x, y + 62, 'rg = ' + generico, { size: 21, weight: 'bold', fill: COL.verde });
    });
    for (i = 0; i < n; i++) {
      b += S.line(pos[i], y - 40, pos[i], y + 22, COL.rojo, 2.6, '6 5');
      b += S.circle(pos[i], y, 11, COL.rojo, '#ffffff', 3);
      b += S.txt(pos[i], y - 56, letra + ' = ' + nTxt(criticos[i].valor),
        { size: 21, weight: 'bold', fill: COL.rojo });
      b += S.txt(pos[i], y - 96, 'rg = ' + criticos[i].rango,
        { size: 21, weight: 'bold', fill: COL.rojo });
    }
    if (!n) {
      b += S.txt(W / 2, y - 70, 'no hay ningún valor crítico: el rango es el mismo para todo ' + letra,
        { size: 21, weight: 'bold', fill: COL.gris });
    }
    if (kv !== null && kv !== undefined) {
      var xk = null;
      for (i = 0; i < n; i++) if (igF(criticos[i].valor, kv)) xk = pos[i];
      if (xk === null) {
        var z = 0;
        for (i = 0; i < n; i++) if (numF(kv) > numF(criticos[i].valor)) z = i + 1;
        xk = zonas[z];
      }
      b += S.poly([[xk, y + 104], [xk - 15, y + 134], [xk + 15, y + 134]], COL.morado, COL.morado, 1);
      b += S.txt(xk, y + 166, letra + ' actual = ' + nTxt(kv),
        { size: 21, weight: 'bold', fill: COL.morado });
    }
    var H = S.altoDibujado(b) + 24;
    var bg = S.rect(2, 2, W - 4, H - 4, '#ffffff', '#e3e9ef', { r: 12, sw: 2 });
    return S.svgWrap(bg + b, W, H, 'Recta de casos del parámetro ' + letra,
      'Los puntos rojos son los valores críticos: en ellos el rango baja. Entre ellos el rango es el genérico.');
  }

  /* ------------------------------------------------------------------
     Utilidades de menores
     ------------------------------------------------------------------ */

  /* Números combinatorios exactos con enteros pequeños. */
  function comb(n, r) {
    if (r < 0 || r > n) return 0;
    var num = 1, den = 1, i;
    for (i = 1; i <= r; i++) { num *= (n - r + i); den *= i; }
    return Math.round(num / den);
  }
  function factTex(n) {
    if (n <= 1) return '1';
    var t = [], i;
    for (i = n; i >= 1; i--) t.push(String(i));
    return t.join(' \\cdot ');
  }
  /* Marca de celdas para DET.matTex: producto cartesiano filas × cols. */
  function marcas(filas, cols) {
    var out = [];
    filas.forEach(function (i) { cols.forEach(function (j) { out.push([i, j]); }); });
    return out;
  }
  /* Búsqueda del rango por DEFINICIÓN, de mayor orden a menor. */
  function rangoPorDefinicion(A, tope) {
    var mx = Math.min(A.f, A.c), h, niveles = [], encontrado = null;
    tope = tope || 12;
    for (h = mx; h >= 1; h--) {
      var L = cap().menoresDeOrden(A, h);
      var idx = -1, q;
      for (q = 0; q < L.length; q++) if (!L[q].nulo) { idx = q; break; }
      var muestra = L.slice(0, Math.min(tope, idx >= 0 ? idx + 1 : L.length));
      niveles.push({
        orden: h, total: L.length, muestra: muestra,
        probados: idx >= 0 ? idx + 1 : L.length,
        hallado: idx >= 0 ? L[idx] : null
      });
      if (idx >= 0) { encontrado = L[idx]; break; }
    }
    return { rango: encontrado ? encontrado.orden : 0, niveles: niveles, testigo: encontrado, maximo: mx };
  }

  /* Escenarios comunes del módulo. */
  var ESC = {
    tres4: '1 2 3 4; 2 4 6 8; 1 0 1 0',
    rango3: '1 2 3 4; 0 1 4 1; 0 0 5 2',
    rango1: '1 2 3; 2 4 6; 3 6 9',
    nula: '0 0 0; 0 0 0',
    cuatro5: '1 2 0 1 3; 2 4 1 0 1; 0 0 1 -2 -5; 1 2 1 -1 -2',
    cuad4: '1 2 3 4; 2 4 6 8; 1 0 1 0; 0 1 1 1',
    frac: '1/2 1 3/2; 1 2 3; 0 1 -1',
    dosTres: '1 -1 2; 2 -2 4'
  };
  var ESC_P = {
    clasico: '1 1 1; 1 k 1; 1 1 k',
    dos: 'k 1; 1 k',
    rect: '1 2 3; 2 k 6; 1 1 k',
    tresCuatro: '1 1 1 1; 1 k 1 1; 1 1 k 1',
    lineal: '1 2; 2 k',
    sinRaiz: '1 0 0; 0 1 0; 0 0 k^2+1'
  };

  /* ==================================================================
     1 · Archivo 10 · menorGeneral
     ================================================================== */
  R.menorGeneral = function (node) {
    return S.shell(node, 'Menor de orden h de una matriz',
      'Un <b>menor de orden h</b> de una matriz es el determinante de la submatriz cuadrada que queda al ' +
      'elegir <b>h filas</b> y <b>h columnas</b> cualesquiera. La matriz de partida <b>no tiene que ser ' +
      'cuadrada</b>: lo único que ha de ser cuadrado es lo que se elige. ' + EJ_MAT + ' ' + EJ_IDX +
      ' Elige el orden ' + K('h') + ' y escribe qué filas y qué columnas tomas: la figura resalta la ' +
      'submatriz dentro de la matriz completa y debajo aparece ese menor con su valor.',
      [
        {
          id: 'A', label: 'Matriz (una fila por línea)', type: 'textarea', rows: 4,
          value: '1 2 3 4\n2 4 6 8\n1 0 1 0', ancho: '17rem'
        },
        { id: 'h', label: 'Orden h del menor', type: 'number', min: 1, max: 5, value: 2, ancho: '9rem' },
        { id: 'filas', label: 'Filas que tomo (desde 1)', type: 'text', value: '1 3', ancho: '10rem' },
        { id: 'cols', label: 'Columnas que tomo (desde 1)', type: 'text', value: '1 2', ancho: '10rem' },
        { id: 'todos', label: 'Ver la lista de todos los menores de ese orden', type: 'check', value: false },
        chips([
          {
            txt: 'Menor de orden 2 en una 3×4', tip: 'el caso más habitual',
            set: { A: '1 2 3 4\n2 4 6 8\n1 0 1 0', h: 2, filas: '1 3', cols: '1 2', todos: false }
          },
          {
            txt: 'Menor de orden 3 en una 4×5', tip: 'matriz grande, menor de orden 3',
            set: { A: ESC.cuatro5.replace(/; /g, '\n'), h: 3, filas: '1 2 3', cols: '1 3 4', todos: false }
          },
          {
            txt: 'Menor de orden 1', tip: 'un solo elemento: el menor es el propio número',
            set: { A: '1 2 3 4\n2 4 6 8\n1 0 1 0', h: 1, filas: '2', cols: '3', todos: false }
          },
          {
            txt: 'Menor complementario de a₂₃', tip: 'quitar la fila 2 y la columna 3 de una 4×4',
            set: { A: ESC.cuad4.replace(/; /g, '\n'), h: 3, filas: '1 3 4', cols: '1 2 4', todos: false }
          },
          {
            txt: 'Menor nulo', tip: 'dos filas proporcionales dentro del menor',
            set: { A: '1 2 3 4\n2 4 6 8\n1 0 1 0', h: 2, filas: '1 2', cols: '1 2', todos: false }
          },
          {
            txt: 'Con fracciones', tip: 'los menores salen exactos',
            set: { A: ESC.frac.replace(/; /g, '\n'), h: 2, filas: '1 2', cols: '2 3', todos: true }
          },
          {
            txt: 'Todos los menores de orden 2', tip: 'la lista completa con sus valores',
            set: { A: ESC.tres4.replace(/; /g, '\n'), h: 2, filas: '1 3', cols: '1 2', todos: true }
          }
        ])
      ],
      safe(function (v) {
        var A = leeM(v.A, 'la matriz', 5, 6);
        var mx = Math.min(A.f, A.c);
        var h = S.entero(v.h, 1, mx, 'El orden h del menor');
        var fil = leeIdx(v.filas, 'filas', A.f, h);
        var col = leeIdx(v.cols, 'columnas', A.c, h);
        var Msub = cap().submatriz(A, fil, col);
        var val = cap().det(Msub);
        var cuantos = cap().cuentaMenores(A.f, A.c, h);

        var h1 = caja('Matriz de partida, de dimensión ' + cap().dimTxt(A) + ' (las celdas del menor van en un recuadro)',
          cap().matTex(A, { marca: marcas(fil, col) }));
        h1 += S.kvs([
          'filas: <b>' + A.f + '</b>',
          'columnas: <b>' + A.c + '</b>',
          'orden del menor: <b>' + h + '</b>',
          'menores de orden ' + h + ' que tiene la matriz: <b>' + cuantos + '</b>'
        ]);
        h1 += parrafo('He tomado las filas <b>' + lista1(fil) + '</b> y las columnas <b>' + lista1(col) +
          '</b>. Con esas ' + h + ' ' + plural(h, 'fila') + ' y esas ' + h + ' ' + plural(h, 'columna') +
          ' se forma una submatriz cuadrada de orden ' + h + ', y su determinante es el menor.');
        h1 += caja('Submatriz elegida', cap().matTex(Msub));
        h1 += caja('Menor de orden ' + h, cap().detTex(Msub) + ' = ' + FT(val));
        h1 += S.resultado(K(FT(val)), 'valor del menor de orden ' + h);

        if (cero(val)) {
          h1 += aviso('Este menor <b>vale 0</b>. Un menor nulo no sirve como testigo del rango: hay que ' +
            'probar otro. Fíjate en que dentro de la submatriz hay líneas iguales, proporcionales o ' +
            'combinación de las otras, y por eso el determinante se anula.');
        } else {
          h1 += bien('Este menor es <b>distinto de cero</b>, así que el rango de la matriz es <b>al menos ' +
            h + '</b>: ya hemos encontrado ' + h + ' ' + plural(h, 'fila') + ' y ' + h + ' ' +
            plural(h, 'columna') + ' que se «sostienen» entre sí.');
        }

        h1 += figMat(A, {
          titulo: 'El menor de orden ' + h + ' dentro de la matriz',
          sub: 'filas ' + lista1(fil) + '   ·   columnas ' + lista1(col) +
            '   ·   valor del menor = ' + nTxt(val),
          filasSel: fil, colsSel: col,
          notas: A.a.map(function (_, i) { return fil.indexOf(i) >= 0 ? 'fila elegida' : ''; }),
          pie: ['Solo las celdas que están a la vez en una fila elegida y en una columna elegida forman el menor.'],
          label: 'Menor de orden ' + h + ' resaltado dentro de la matriz',
          cap: 'Las ' + h + ' filas y las ' + h + ' columnas elegidas se cruzan en ' + (h * h) +
            ' celdas: son las de la submatriz cuyo determinante estamos calculando.'
        });

        /* El menor complementario es un caso particular. */
        h1 += titulo('El menor complementario es un caso particular de esto');
        if (A.f === A.c && h === A.f - 1 && A.f >= 2) {
          var falF = -1, falC = -1, i;
          for (i = 0; i < A.f; i++) if (fil.indexOf(i) < 0) falF = i;
          for (i = 0; i < A.c; i++) if (col.indexOf(i) < 0) falC = i;
          var alfa = cap().menorComp(A, falF, falC);
          h1 += parrafo('Has tomado <b>todas las filas menos la ' + (falF + 1) + '</b> y <b>todas las ' +
            'columnas menos la ' + (falC + 1) + '</b>. Eso es exactamente suprimir la fila ' + (falF + 1) +
            ' y la columna ' + (falC + 1) + ', es decir, el <b>menor complementario</b> del elemento ' +
            K('a_{' + (falF + 1) + (falC + 1) + '}') + ':');
          h1 += caja('Menor complementario', '\\alpha_{' + (falF + 1) + (falC + 1) + '} = ' +
            cap().detTex(Msub) + ' = ' + FT(alfa));
          h1 += bien('Coincide con el menor que acabas de calcular: ' + K(FT(val)) + '. El menor ' +
            'complementario del tema anterior no es más que un menor de orden ' + h + ' elegido de una ' +
            'forma muy concreta.');
        } else {
          h1 += parrafo('En una matriz cuadrada de orden ' + K('n') + ', si se toman <b>todas las filas ' +
            'menos una</b> y <b>todas las columnas menos una</b>, el menor de orden ' + K('n-1') +
            ' que sale es el <b>menor complementario</b> ' + K('\\alpha_{ij}') + ' del elemento ' +
            K('a_{ij}') + ' que se ha dejado fuera. Ahí está la conexión con el apartado anterior: ' +
            'los menores complementarios son solo unos cuantos de los muchos menores que tiene la matriz.');
          if (A.f === A.c) {
            h1 += pista('Prueba con ' + K('h = ' + (A.f - 1)) + ' y deja fuera una sola fila y una sola ' +
              'columna: el applet reconocerá el menor complementario y te lo dirá.');
          } else {
            h1 += pista('Esta matriz es de ' + cap().dimTxt(A) + ', así que no es cuadrada y no tiene ' +
              'menores complementarios en el sentido del apartado anterior; menores de orden ' + h +
              ', en cambio, tiene ' + cuantos + '.');
          }
        }

        if (v.todos) {
          var L = cap().menoresDeOrden(A, h);
          h1 += titulo('Los ' + L.length + ' ' + plural(L.length, 'menor', 'menores') + ' de orden ' + h);
          h1 += parrafo('Cada fila de la tabla es una elección distinta de ' + h + ' filas y ' + h +
            ' columnas. El recuento sale del número combinatorio: ' +
            K('\\binom{' + A.f + '}{' + h + '} \\cdot \\binom{' + A.c + '}{' + h + '} = ' +
              comb(A.f, h) + ' \\cdot ' + comb(A.c, h) + ' = ' + cuantos) + '.');
          var tbl = L.map(function (m, q) {
            var esEl = String(m.filas1) === String(fil.map(function (x) { return x + 1; })) &&
              String(m.cols1) === String(col.map(function (x) { return x + 1; }));
            return {
              celdas: [
                String(q + 1),
                'filas ' + m.filas1.join(', '),
                'columnas ' + m.cols1.join(', '),
                K(FT(m.valor)),
                m.nulo ? S.badge('nulo', 'no') : S.badge('no nulo', 'si') + (esEl ? ' · el elegido' : '')
              ],
              clase: m.nulo ? 'detc-ko' : 'detc-ok'
            };
          });
          h1 += S.tabla(['Nº', 'Filas (desde 1)', 'Columnas (desde 1)', 'Valor del menor', '¿Nulo?'], tbl);
          var noNulos = L.filter(function (m) { return !m.nulo; }).length;
          h1 += parrafo('De los ' + L.length + ', hay <b>' + noNulos + '</b> distintos de cero. Para el ' +
            'rango basta con encontrar <b>uno</b>: no hace falta calcularlos todos, y de eso se ocupa el ' +
            'método de los orlados.');
        } else {
          h1 += pista('Marca la casilla «Ver la lista de todos los menores de ese orden» para ver los ' +
            cuantos + ' menores de orden ' + h + ' con su valor.');
        }
        return h1;
      }));
  };

  /* ==================================================================
     2 · Archivo 10 · cuentaMenores
     ================================================================== */
  R.cuentaMenores = function (node) {
    return S.shell(node, 'Cuántos menores tiene una matriz',
      'Para formar un menor de orden ' + K('h') + ' hay que elegir ' + K('h') + ' filas de entre las ' +
      K('m') + ' que hay y ' + K('h') + ' columnas de entre las ' + K('n') + ', y el orden en que se elijan ' +
      'no importa: por eso el número de menores de orden ' + K('h') + ' es ' +
      K('\\binom{m}{h} \\cdot \\binom{n}{h}') + '. Elige las dimensiones y el applet desarrolla el ' +
      'combinatorio, hace el recuento de cada orden y suma el total. Si quieres comprobarlo sobre una ' +
      'matriz concreta, escríbela abajo (ejemplo copiable: <code>1 2 3 4; 2 4 6 8; 1 0 1 0</code>) y ' +
      'marca la casilla de comprobación: el applet cuenta los menores de verdad y compara.',
      [
        { id: 'm', label: 'Filas m', type: 'number', min: 1, max: 6, value: 3, ancho: '8rem' },
        { id: 'n', label: 'Columnas n', type: 'number', min: 1, max: 6, value: 4, ancho: '8rem' },
        {
          id: 'A', label: 'Matriz para comprobar (opcional)', type: 'textarea', rows: 3,
          value: '1 2 3 4\n2 4 6 8\n1 0 1 0', ancho: '15rem'
        },
        { id: 'comprueba', label: 'Contar los menores de esa matriz de verdad', type: 'check', value: true },
        chips([
          { txt: 'Matriz 3×3', tip: 'el caso del determinante de orden 3', set: { m: 3, n: 3, A: '1 2 3\n4 5 6\n7 8 10', comprueba: true } },
          { txt: 'Matriz 3×4', tip: 'la matriz de un sistema de 3 ecuaciones', set: { m: 3, n: 4, A: ESC.tres4.replace(/; /g, '\n'), comprueba: true } },
          { txt: 'Matriz 4×4', tip: '70 menores en total', set: { m: 4, n: 4, A: ESC.cuad4.replace(/; /g, '\n'), comprueba: true } },
          { txt: 'Matriz 4×5', tip: 'muchísimos menores', set: { m: 4, n: 5, A: ESC.cuatro5.replace(/; /g, '\n'), comprueba: true } },
          { txt: 'Matriz 5×5', tip: 'el recuento se dispara', set: { m: 5, n: 5, A: '1 0 0 0 0\n0 1 0 0 0\n0 0 1 0 0\n0 0 0 1 0\n0 0 0 0 1', comprueba: false } },
          { txt: 'Matriz 2×6', tip: 'pocas filas, muchas columnas', set: { m: 2, n: 6, A: '1 2 3 4 5 6\n2 4 6 8 10 12', comprueba: true } },
          { txt: 'Matriz 1×4', tip: 'solo hay menores de orden 1', set: { m: 1, n: 4, A: '3 -1 0 5', comprueba: true } }
        ])
      ],
      safe(function (v) {
        var m = S.entero(v.m, 1, 6, 'El número de filas m');
        var n = S.entero(v.n, 1, 6, 'El número de columnas n');
        var mx = Math.min(m, n), h, total = 0;

        var h1 = parrafo('Una matriz de <b>' + m + '×' + n + '</b> tiene menores de todos los órdenes desde ' +
          K('h = 1') + ' hasta ' + K('h = \\min(' + m + ', ' + n + ') = ' + mx) + ': por encima de ese orden ' +
          'no hay bastantes filas o bastantes columnas para elegir, así que <b>no existen</b>.');
        h1 += caja('Número de menores de orden h',
          '\\binom{m}{h} \\cdot \\binom{n}{h} = \\dfrac{m!}{h!\\,(m-h)!} \\cdot \\dfrac{n!}{h!\\,(n-h)!}');

        var filas = [], serie = [];
        for (h = 1; h <= mx; h++) {
          var cm = comb(m, h), cn = comb(n, h), pr = cm * cn;
          total += pr;
          serie.push({ orden: h, valor: pr });
          filas.push({
            celdas: [
              String(h),
              K('\\binom{' + m + '}{' + h + '} = \\dfrac{' + factTex(m) + '}{(' + factTex(h) + ') \\cdot (' +
                factTex(m - h) + ')} = ' + cm),
              K('\\binom{' + n + '}{' + h + '} = \\dfrac{' + factTex(n) + '}{(' + factTex(h) + ') \\cdot (' +
                factTex(n - h) + ')} = ' + cn),
              K(cm + ' \\cdot ' + cn + ' = ' + pr)
            ]
          });
        }
        h1 += S.tabla(['Orden h', 'Elección de las h filas', 'Elección de las h columnas', 'Menores de orden h'], filas);
        h1 += S.resultado(K(String(total)), 'menores en total, de todos los órdenes');

        h1 += figBarras(serie.map(function (s) {
          return {
            etq: 'orden ' + s.orden, valor: s.valor,
            col: s.orden === mx ? COL.rojo : COL.azul,
            extra: s.orden === mx ? 'menores del orden más alto' : ''
          };
        }), {
          titulo: 'Cuántos menores hay de cada orden en una matriz ' + m + '×' + n,
          sub: 'total: ' + total + ' ' + plural(total, 'menor', 'menores'),
          pie: ['El orden más alto posible es mín(' + m + ', ' + n + ') = ' + mx + '.'],
          label: 'Número de menores de cada orden',
          cap: 'Los órdenes intermedios son los que más menores tienen: ahí es donde el recuento se dispara.'
        });

        var Amx = null;
        if (v.comprueba) {
          Amx = leeM(v.A, 'la matriz de comprobación', 6, 6);
          if (Amx.f !== m || Amx.c !== n) {
            throw Error('La matriz que has escrito es de ' + cap().dimTxt(Amx) + ' y las dimensiones ' +
              'elegidas arriba son ' + m + '×' + n + '. Ajusta las casillas de filas y columnas, o cambia ' +
              'la matriz, para que coincidan.');
          }
          h1 += titulo('Comprobación sobre una matriz concreta');
          h1 += caja('Matriz de comprobación, de dimensión ' + cap().dimTxt(Amx), cap().matTex(Amx));
          var tb2 = [];
          for (h = 1; h <= mx; h++) {
            var L = cap().menoresDeOrden(Amx, h);
            var nul = L.filter(function (x) { return x.nulo; }).length;
            tb2.push({
              celdas: [
                String(h), String(comb(m, h) * comb(n, h)), String(L.length),
                String(L.length - nul), String(nul),
                L.length === comb(m, h) * comb(n, h) ? S.badge('coincide', 'si') : S.badge('no coincide', 'no')
              ],
              clase: L.length === comb(m, h) * comb(n, h) ? 'detc-ok' : 'detc-ko'
            });
          }
          h1 += S.tabla(['Orden h', 'Fórmula', 'Contados de verdad', 'No nulos', 'Nulos', '¿Cuadra?'], tb2);
          h1 += bien('El recuento que da la fórmula y el número de menores que hay de verdad coinciden en ' +
            'todos los órdenes. Fíjate además en cuántos de ellos <b>valen 0</b>: buscarlos a ciegas es ' +
            'perder el tiempo.');
        }

        h1 += titulo('Por qué el método de los orlados evita calcularlos todos');
        var mxT = total;
        var costeOrl = 0;
        for (h = 1; h <= mx; h++) costeOrl += (m - h + 1) * (n - h + 1);
        h1 += parrafo('Calcular el rango «por definición» obligaría, en el peor de los casos, a mirar los ' +
          '<b>' + mxT + '</b> menores de esta matriz. El <b>método de los orlados</b> no hace eso: parte de ' +
          'un elemento no nulo (un menor de orden 1) y en cada paso solo mira los menores que se obtienen ' +
          'añadiéndole <b>una fila y una columna</b>. Si un menor no nulo de orden ' + K('h') + ' tiene ' +
          'todos sus orlados nulos, el rango es ' + K('h') + ' y se para; y si alguno es no nulo, se sube de ' +
          'orden con ese.');
        h1 += S.kvs([
          'menores de la matriz: <b>' + mxT + '</b>',
          'determinantes que mira el método de los orlados, como mucho: <b>' + costeOrl + '</b>',
          'un menor no nulo de orden h obliga a mirar solo <b>(m − h)·(n − h)</b> orlados'
        ]);
        h1 += parrafo('Además, el método <b>certifica</b> el resultado: si todos los orlados de un menor no ' +
          'nulo de orden ' + K('h') + ' son cero, ya está demostrado que no hay ningún menor de orden ' +
          K('h+1') + ' distinto de cero, sin necesidad de calcularlos.');
        return h1;
      }));
  };

  /* ==================================================================
     3 · Archivo 11 · rangoDef
     ================================================================== */
  R.rangoDef = function (node) {
    return S.shell(node, 'El rango por definición',
      'El <b>rango</b> de una matriz es el <b>orden del mayor menor no nulo</b> que tiene. Aplicar la ' +
      'definición al pie de la letra consiste en empezar por el orden más alto posible, ' +
      K('\\min(m, n)') + ', e ir bajando hasta encontrar un menor distinto de cero: ese orden es el rango, ' +
      'y ese menor es el <b>menor testigo</b>. ' + EJ_MAT + ' El applet muestra los menores que va probando, ' +
      'por qué se detiene, y comprueba las dos propiedades básicas: ' +
      K('\\operatorname{rg}(A) \\le \\min(m, n)') + ' y ' + K('\\operatorname{rg}(A) = \\operatorname{rg}(A^t)') + '.',
      [
        {
          id: 'A', label: 'Matriz (una fila por línea)', type: 'textarea', rows: 4,
          value: '1 2 3 4\n2 4 6 8\n1 0 1 0', ancho: '17rem'
        },
        { id: 'tope', label: 'Menores que se muestran por orden', type: 'number', min: 1, max: 20, value: 6, ancho: '11rem' },
        { id: 'trans', label: 'Comprobar también con la transpuesta', type: 'check', value: true },
        chips([
          { txt: 'Rango 2 en una 3×4', tip: 'una fila es doble de otra', set: { A: ESC.tres4.replace(/; /g, '\n'), tope: 6, trans: true } },
          { txt: 'Rango máximo 3', tip: 'hay un menor de orden 3 no nulo', set: { A: ESC.rango3.replace(/; /g, '\n'), tope: 6, trans: true } },
          { txt: 'Rango 1', tip: 'todas las filas proporcionales', set: { A: ESC.rango1.replace(/; /g, '\n'), tope: 8, trans: true } },
          { txt: 'Matriz nula · rango 0', tip: 'no hay ningún menor no nulo', set: { A: ESC.nula.replace(/; /g, '\n'), tope: 6, trans: true } },
          { txt: 'Matriz 4×5', tip: 'la cota es mín(4, 5) = 4', set: { A: ESC.cuatro5.replace(/; /g, '\n'), tope: 4, trans: false } },
          { txt: 'Cuadrada 4×4 singular', tip: 'determinante 0, rango menor que 4', set: { A: ESC.cuad4.replace(/; /g, '\n'), tope: 4, trans: true } },
          { txt: 'Con fracciones', tip: 'aritmética exacta', set: { A: ESC.frac.replace(/; /g, '\n'), tope: 6, trans: true } },
          { txt: 'Matriz 2×3 de rango 1', tip: 'dos filas proporcionales', set: { A: ESC.dosTres.replace(/; /g, '\n'), tope: 6, trans: true } }
        ])
      ],
      safe(function (v) {
        var A = leeM(v.A, 'la matriz', 5, 6);
        var tope = S.entero(v.tope, 1, 20, 'El número de menores que se muestran');
        var D = rangoPorDefinicion(A, tope);
        var rg = D.rango, mx = D.maximo;
        var rgGauss = cap().rango(A);

        var h1 = caja('Matriz de partida, de dimensión ' + cap().dimTxt(A), cap().matTex(A));
        h1 += S.kvs([
          'filas m = <b>' + A.f + '</b>',
          'columnas n = <b>' + A.c + '</b>',
          'orden máximo posible mín(m, n) = <b>' + mx + '</b>',
          'menores de orden ' + mx + ': <b>' + cap().cuentaMenores(A.f, A.c, mx) + '</b>'
        ]);

        h1 += titulo('La búsqueda, orden por orden, de mayor a menor');
        D.niveles.forEach(function (niv, q) {
          var cuerpo = '<p>Orden <b>' + niv.orden + '</b>: esta matriz tiene <b>' + niv.total + '</b> ' +
            plural(niv.total, 'menor', 'menores') + ' de ese orden.</p>';
          var tb = niv.muestra.map(function (mm, i) {
            return {
              celdas: [
                String(i + 1),
                'filas ' + mm.filas1.join(', ') + ' · columnas ' + mm.cols1.join(', '),
                KD(cap().detTex(mm.mat) + ' = ' + FT(mm.valor)),
                mm.nulo ? S.badge('vale 0', 'no') : S.badge('distinto de 0', 'si')
              ],
              clase: mm.nulo ? 'detc-ko' : 'detc-ok'
            };
          });
          cuerpo += S.tabla(['Nº', 'Filas y columnas elegidas (desde 1)', 'Menor y su valor', 'Resultado'], tb);
          if (niv.muestra.length < (niv.hallado ? niv.probados : niv.total)) {
            cuerpo += '<p class="detc-txt">(se muestran los ' + niv.muestra.length + ' primeros de los ' +
              niv.total + ')</p>';
          }
          if (niv.hallado) {
            cuerpo += '<p class="detc-bien"><b>¡Encontrado!</b> El menor de las filas ' +
              niv.hallado.filas1.join(', ') + ' y las columnas ' + niv.hallado.cols1.join(', ') + ' vale ' +
              K(FT(niv.hallado.valor)) + ' ≠ 0. Como es de orden ' + niv.orden + ' y no hay ninguno no nulo ' +
              'de orden mayor, <b>aquí se para la búsqueda</b>: el rango es ' + niv.orden + '.</p>';
          } else {
            cuerpo += '<p class="detc-aviso"><b>Todos</b> los ' + niv.total + ' ' +
              plural(niv.total, 'menor', 'menores') + ' de orden ' + niv.orden + ' ' +
              plural(niv.total, 'vale', 'valen') + ' 0, así que el rango <b>no llega a ' + niv.orden +
              '</b> y hay que bajar al orden ' + (niv.orden - 1) + '.</p>';
          }
          return cuerpo;
        });
        D.niveles.forEach(function (niv, q) {
          var cuerpo = '<p>Orden <b>' + niv.orden + '</b>: hay <b>' + niv.total + '</b> ' +
            plural(niv.total, 'menor', 'menores') + ' de ese orden' +
            (niv.hallado ? ', y hemos tenido que probar ' + niv.probados + ' hasta dar con uno no nulo.'
              : ', y los hemos comprobado todos.') + '</p>';
          var tb = niv.muestra.map(function (mm, i) {
            return {
              celdas: [
                String(i + 1),
                'filas ' + mm.filas1.join(', ') + ' · columnas ' + mm.cols1.join(', '),
                K(cap().detTex(mm.mat) + ' = ' + FT(mm.valor)),
                mm.nulo ? S.badge('vale 0', 'no') : S.badge('distinto de 0', 'si')
              ],
              clase: mm.nulo ? 'detc-ko' : 'detc-ok'
            };
          });
          cuerpo += S.tabla(['Nº', 'Filas y columnas elegidas (desde 1)', 'Menor y su valor', 'Resultado'], tb);
          if (niv.hallado) {
            cuerpo += '<p class="detc-bien"><b>Aquí se para.</b> El menor de las filas ' +
              niv.hallado.filas1.join(', ') + ' y las columnas ' + niv.hallado.cols1.join(', ') +
              ' vale ' + K(FT(niv.hallado.valor)) + ' y es distinto de cero: hay un menor no nulo de orden ' +
              niv.orden + ' y ninguno de orden mayor, luego el rango es <b>' + niv.orden + '</b>.</p>';
          } else {
            cuerpo += '<p class="detc-aviso">Todos valen 0: el rango <b>no llega a ' + niv.orden +
              '</b>. Bajamos un orden y volvemos a probar.</p>';
          }
          h1 += S.paso(q === 0 ? 'orden ' + niv.orden : String(niv.orden), cuerpo,
            niv.hallado ? 'detc-paso-ind' : 'detc-paso-dep');
        });

        if (!D.testigo) {
          h1 += aviso('No hay <b>ningún</b> menor distinto de cero, ni siquiera de orden 1: todos los ' +
            'elementos son 0. La matriz es la matriz nula y su rango es <b>0</b>. Es el único caso en el ' +
            'que el rango vale 0.');
          h1 += S.resultado(K('\\operatorname{rg}(A) = 0'), 'matriz nula');
        } else {
          h1 += S.resultado(K('\\operatorname{rg}(A) = ' + rg), 'orden del mayor menor no nulo');
          h1 += caja('Menor testigo (filas ' + D.testigo.filas1.join(', ') + ', columnas ' +
            D.testigo.cols1.join(', ') + ')',
            cap().detTex(D.testigo.mat) + ' = ' + FT(D.testigo.valor) + ' \\ne 0');
          h1 += figMat(A, {
            titulo: 'El menor testigo del rango',
            sub: 'orden ' + rg + '   ·   valor = ' + nTxt(D.testigo.valor) + ' ≠ 0',
            filasSel: D.testigo.filas, colsSel: D.testigo.cols,
            notas: A.a.map(function (_, i) {
              return D.testigo.filas.indexOf(i) >= 0 ? 'fila del menor testigo' : '';
            }),
            pie: ['rg(A) = ' + rg + '   ·   mín(m, n) = ' + mx],
            label: 'Menor testigo del rango resaltado',
            cap: 'Basta con <b>un</b> menor no nulo de orden ' + rg + ' para asegurar que el rango es al ' +
              'menos ' + rg + '; y como todos los de orden mayor son nulos, el rango es exactamente ' + rg + '.'
          });
        }

        h1 += titulo('Las dos propiedades que hay que tener siempre presentes');
        h1 += caja('Cota del rango', '\\operatorname{rg}(A) \\le \\min(m, n) = \\min(' + A.f + ', ' + A.c +
          ') = ' + mx);
        h1 += parrafo('Aquí ' + K('\\operatorname{rg}(A) = ' + rg) + ' y ' + K(rg + ' \\le ' + mx) +
          ': la cota se cumple' + (rg === mx ? ' con igualdad, así que el rango es <b>máximo</b>.'
            : ', y además es <b>estricta</b>, señal de que alguna línea depende de las otras.'));
        h1 += bien('Comprobación con el otro método: escalonando por Gauss sale ' +
          K('\\operatorname{rg}(A) = ' + rgGauss) + ', el mismo número.');
        if (v.trans) {
          var At = cap().matTrans(A);
          var Dt = rangoPorDefinicion(At, 1);
          h1 += caja('Transpuesta, de dimensión ' + cap().dimTxt(At), cap().matTex(At));
          h1 += S.kvs([
            'rg(A) = <b>' + rg + '</b>',
            'rg(Aᵗ) = <b>' + Dt.rango + '</b>',
            Dt.rango === rg ? 'coinciden, como tenía que ser' : 'no coinciden'
          ]);
          h1 += parrafo('Al transponer, cada menor de ' + K('A') + ' se convierte en un menor de ' +
            K('A^t') + ' con las filas y las columnas cambiadas de papel, y el determinante no cambia ' +
            'porque ' + K('|M^t| = |M|') + '. Por eso ' + K('\\operatorname{rg}(A) = \\operatorname{rg}(A^t)') +
            ': da igual trabajar por filas o por columnas.');
        }
        h1 += figBarras([
          { etq: 'filas m', valor: A.f, col: COL.azul },
          { etq: 'columnas n', valor: A.c, col: COL.teal },
          { etq: 'cota mín(m, n)', valor: mx, col: COL.naranja },
          { etq: 'rango', valor: rg, col: rg === mx ? COL.verde : COL.rojo, extra: rg === mx ? 'máximo' : 'no máximo' }
        ], {
          titulo: 'El rango frente a su cota',
          sub: 'rg(A) ≤ mín(m, n)',
          pie: ['El rango nunca puede pasar del número de filas ni del de columnas.'],
          label: 'Rango comparado con el número de filas y de columnas',
          cap: 'Cuando el rango es igual a mín(m, n) se dice que la matriz tiene <b>rango máximo</b>.'
        });
        return h1;
      }));
  };

  /* ==================================================================
     4 · Archivo 11 · rangoVsGauss
     ================================================================== */
  R.rangoVsGauss = function (node) {
    var st = { hechas: 0, iguales: 0, fallos: [], semilla: 20260911, ultima: null };
    return S.shell(node, 'Los dos caminos para el rango dan lo mismo',
      'El rango se puede calcular de dos maneras: <b>escalonando por Gauss</b> y contando las filas no ' +
      'nulas, o buscando el <b>menor no nulo de mayor orden</b>. Los dos caminos llevan siempre al mismo ' +
      'número. ' + EJ_MAT + ' A la izquierda verás el escalonamiento con sus pasos y a la derecha el menor ' +
      'testigo. Con el botón <b>«Comprobar mil matrices al azar»</b> el applet genera mil matrices de ' +
      'dimensiones variadas, incluidas las no cuadradas, y comprueba que los dos métodos coinciden en ' +
      'todas: el contador queda a la vista.',
      [
        {
          id: 'A', label: 'Matriz (una fila por línea)', type: 'textarea', rows: 4,
          value: '1 2 3 4\n2 4 6 8\n1 0 1 0', ancho: '17rem'
        },
        { id: 'pasos', label: 'Ver todos los pasos de Gauss', type: 'check', value: true },
        {
          id: 'mil', label: 'Comprobar mil matrices al azar', type: 'button',
          click: function () {
            var az = new Az(st.semilla);
            st.semilla = az.ent(1, 2000000000);
            var i, f, c, A, r1, r2, dims = {};
            for (i = 0; i < 1000; i++) {
              f = az.ent(1, 4); c = az.ent(1, 5);
              A = az.matriz(f, c, -3, 3);
              r1 = cap().rango(A);
              r2 = cap().rangoMenores(A).rango;
              st.hechas++;
              if (r1 === r2) st.iguales++;
              else if (st.fallos.length < 5) {
                st.fallos.push(cap().matTxt(A) + ' → Gauss ' + r1 + ', menores ' + r2);
              }
              dims[f + '×' + c] = (dims[f + '×' + c] || 0) + 1;
            }
            st.ultima = { dims: dims };
          }
        },
        {
          id: 'reinicia', label: 'Reiniciar el contador', type: 'button',
          click: function () { st.hechas = 0; st.iguales = 0; st.fallos = []; st.ultima = null; }
        },
        chips([
          { txt: 'Rango 2 en una 3×4', tip: 'una fila es doble de otra', set: { A: ESC.tres4.replace(/; /g, '\n'), pasos: true } },
          { txt: 'Rango máximo 3', tip: 'ninguna fila se anula al escalonar', set: { A: ESC.rango3.replace(/; /g, '\n'), pasos: true } },
          { txt: 'Rango 1', tip: 'dos filas se convierten en ceros', set: { A: ESC.rango1.replace(/; /g, '\n'), pasos: true } },
          { txt: 'Matriz nula', tip: 'rango 0 por los dos caminos', set: { A: ESC.nula.replace(/; /g, '\n'), pasos: true } },
          { txt: 'Cuadrada 4×4 singular', tip: 'determinante 0: el rango no es 4', set: { A: ESC.cuad4.replace(/; /g, '\n'), pasos: false } },
          { txt: 'Matriz 4×5', tip: 'dimensiones distintas', set: { A: ESC.cuatro5.replace(/; /g, '\n'), pasos: false } },
          { txt: 'Con fracciones', tip: 'los pivotes salen fraccionarios', set: { A: ESC.frac.replace(/; /g, '\n'), pasos: true } }
        ])
      ],
      safe(function (v) {
        var A = leeM(v.A, 'la matriz', 5, 6);
        var G = cap().rangoPasos(A);
        var RM = cap().rangoMenores(A);
        var mx = Math.min(A.f, A.c);

        var h1 = caja('Matriz de partida, de dimensión ' + cap().dimTxt(A), cap().matTex(A));

        h1 += '<div class="ap-grid2">';
        /* --- columna izquierda: Gauss --- */
        var izq = titulo('Camino 1 · escalonar por Gauss');
        izq += parrafo('Las operaciones elementales de filas <b>no cambian el rango</b>. Al final se cuentan ' +
          'las filas que no son de ceros.');
        if (v.pasos) {
          G.pasos.forEach(function (p, i) {
            izq += S.paso(i === 0 ? 'inicio' : String(i),
              '<p>' + p.desc + '</p>' + (p.op ? '<div class="detc-op">' + KD(p.op) + '</div>' : '') +
              '<div class="detc-caja">' + KD(cap().matTex(p.M)) + '</div>',
              i === 0 ? 'detc-paso0' : '');
          });
        } else {
          izq += caja('Matriz escalonada', cap().matTex(G.fin));
        }
        izq += S.kvs([
          'filas no nulas: <b>' + G.rango + '</b>',
          'filas nulas: <b>' + G.filasNulas.length + '</b>',
          'pivotes: <b>' + G.pivotes.length + '</b>'
        ]);
        izq += parrafo(S.texifica(G.resumen));
        h1 += '<div class="det-col">' + izq + '</div>';

        /* --- columna derecha: menores --- */
        var der = titulo('Camino 2 · el menor no nulo de mayor orden');
        der += parrafo('Se busca un menor distinto de cero del mayor orden posible. Aquí el orden máximo es ' +
          K('\\min(' + A.f + ', ' + A.c + ') = ' + mx) + '.');
        RM.pasos.forEach(function (p, i) {
          der += S.paso(String(i + 1), '<p>' + p.descripcion + '</p>' +
            (p.tex ? '<div class="detc-caja">' + KD(p.tex) + '</div>' : ''),
            p.tipo === 'todosNulos' ? 'detc-paso-dep' : '');
        });
        if (RM.menorTestigo) {
          der += caja('Menor testigo, de orden ' + RM.menorTestigo.orden,
            cap().detTex(RM.menorTestigo.mat) + ' = ' + FT(RM.menorTestigo.valor) + ' \\ne 0');
        } else {
          der += aviso('No hay ningún menor no nulo: la matriz es nula y su rango es 0.');
        }
        h1 += '<div class="det-col">' + der + '</div>';
        h1 += '</div>';

        /* --- comparación --- */
        h1 += titulo('¿Coinciden?');
        h1 += S.tabla(['Método', 'Qué se cuenta', 'Rango'], [
          ['Gauss', 'filas no nulas de la escalonada', K(String(G.rango))],
          ['Menores', 'orden del mayor menor no nulo', K(String(RM.rango))]
        ]);
        if (G.rango === RM.rango) {
          h1 += bien('Los dos caminos dan <b>' + G.rango + '</b>. No es casualidad: escalonar no cambia el ' +
            'rango, y el número de filas no nulas de una matriz escalonada es justo el orden del mayor menor ' +
            'no nulo que tiene (el que forman las columnas de los pivotes).');
          h1 += S.resultado(K('\\operatorname{rg}(A) = ' + G.rango), 'por los dos métodos');
        } else {
          h1 += mal('Los dos caminos dan números distintos (' + G.rango + ' y ' + RM.rango +
            '). Eso no puede pasar: si lo ves, avisa al profesor con la matriz que has escrito.');
        }
        if (RM.menorTestigo) {
          h1 += figMat(A, {
            titulo: 'El menor testigo y las filas no nulas',
            sub: 'Gauss: ' + G.rango + ' ' + plural(G.rango, 'fila no nula', 'filas no nulas') +
              '   ·   menores: menor no nulo de orden ' + RM.rango,
            filasSel: RM.menorTestigo.filas, colsSel: RM.menorTestigo.cols,
            notas: A.a.map(function (_, i) {
              return G.filasNulas.indexOf(i) >= 0 ? 'se anula al escalonar' : 'sobrevive al escalonar';
            }),
            pie: ['Los dos métodos coinciden: rg(A) = ' + G.rango],
            label: 'Menor testigo del rango y filas que sobreviven al escalonar',
            cap: 'Las filas que no se anulan al escalonar son tantas como el orden del menor testigo.'
          });
        }

        /* --- comprobador masivo --- */
        h1 += titulo('Comprobación masiva: mil matrices al azar');
        h1 += parrafo('Pulsa el botón <b>«Comprobar mil matrices al azar»</b>: el applet genera mil matrices ' +
          'de dimensiones entre 1×1 y 4×5 (muchas de ellas <b>no cuadradas</b>) con entradas enteras de −3 a ' +
          '3, calcula el rango por Gauss y por el método de los menores, y compara los dos números.');
        if (!st.hechas) {
          h1 += pista('Todavía no has pulsado el botón. Cada pulsación añade mil comprobaciones más al ' +
            'contador; con el otro botón se reinicia.');
        } else {
          h1 += S.kvs([
            'matrices comprobadas: <b>' + st.hechas + '</b>',
            'coincidencias: <b>' + st.iguales + '</b>',
            'discrepancias: <b>' + (st.hechas - st.iguales) + '</b>',
            'porcentaje de acuerdo: <b>' + S.nc(100 * st.iguales / st.hechas, 2) + ' %</b>'
          ]);
          h1 += S.resultado(K(st.iguales + ' / ' + st.hechas), 'veces que los dos métodos han coincidido');
          if (st.hechas === st.iguales) {
            h1 += bien('<b>Ni una sola discrepancia</b> en ' + st.hechas + ' matrices. Los dos métodos ' +
              'calculan lo mismo porque son dos formas de contar las líneas independientes.');
          } else {
            h1 += mal('Han salido ' + (st.hechas - st.iguales) + ' discrepancias: ' +
              st.fallos.map(function (t) { return '<code>' + S.esc(t) + '</code>'; }).join(', ') + '.');
          }
          if (st.ultima) {
            var dims = Object.keys(st.ultima.dims).sort();
            h1 += parrafo('Dimensiones que han salido en la última tanda: ' +
              dims.map(function (d) { return '<b>' + d + '</b> (' + st.ultima.dims[d] + ')'; }).join(', ') + '.');
          }
        }
        return h1;
      }));
  };

  /* ==================================================================
     5 · Archivo 12 · rangoMenores (método de los orlados)
     ================================================================== */
  R.rangoMenores = function (node) {
    var st = { paso: 1, firma: '' };
    return S.shell(node, 'El método de los orlados, paso a paso',
      'El método de los orlados calcula el rango sin mirar todos los menores. La cadena es siempre la ' +
      'misma: <b>buscar un elemento distinto de cero</b> (menor de orden 1), <b>orlarlo</b> con una fila y ' +
      'una columna más, y entonces decidir: si alguno de los orlados es distinto de cero, se sube de orden ' +
      'con él; y si <b>todos</b> los orlados son cero, el rango es el orden del menor que ya teníamos y se ' +
      'para. ' + EJ_MAT + ' Usa el botón <b>«Paso siguiente»</b> para avanzar de uno en uno.',
      [
        {
          id: 'A', label: 'Matriz (una fila por línea)', type: 'textarea', rows: 4,
          value: '1 2 3 4\n2 4 6 8\n1 0 1 0', ancho: '17rem'
        },
        { id: 'fig', label: 'Ver la figura de cada paso', type: 'check', value: true },
        {
          id: 'sig', label: 'Paso siguiente', type: 'button',
          click: function () { st.paso = st.paso + 1; }
        },
        {
          id: 'ant', label: 'Paso anterior', type: 'button',
          click: function () { st.paso = Math.max(1, st.paso - 1); }
        },
        {
          id: 'todo', label: 'Ver todos los pasos', type: 'button',
          click: function () { st.paso = 99; }
        },
        {
          id: 'ini', label: 'Volver al principio', type: 'button',
          click: function () { st.paso = 1; }
        },
        chips([
          { txt: 'Matriz 3×4 de rango 2', tip: 'el ejemplo del apartado', set: { A: ESC.tres4.replace(/; /g, '\n'), fig: true } },
          { txt: 'Rango máximo 3', tip: 'se orla dos veces con éxito', set: { A: ESC.rango3.replace(/; /g, '\n'), fig: true } },
          { txt: 'Rango 1', tip: 'todos los orlados del primer elemento son nulos', set: { A: ESC.rango1.replace(/; /g, '\n'), fig: true } },
          { txt: 'Cuadrada 4×4 singular', tip: 'el rango se queda en 3', set: { A: ESC.cuad4.replace(/; /g, '\n'), fig: true } },
          { txt: 'Matriz 4×5', tip: 'muchas posibilidades de orlar', set: { A: ESC.cuatro5.replace(/; /g, '\n'), fig: false } },
          { txt: 'Primer elemento nulo', tip: 'hay que buscar otro elemento no nulo', set: { A: '0 0 2 1\n1 3 0 0\n2 6 0 0', fig: true } },
          { txt: 'Matriz nula', tip: 'rango 0: no hay elemento no nulo', set: { A: ESC.nula.replace(/; /g, '\n'), fig: true } },
          { txt: 'Con fracciones', tip: 'los orlados salen exactos', set: { A: ESC.frac.replace(/; /g, '\n'), fig: true } }
        ])
      ],
      safe(function (v) {
        var A = leeM(v.A, 'la matriz', 5, 6);
        var RM = cap().rangoMenores(A);
        var n = RM.pasos.length;
        /* Si cambia la matriz, la cuenta de pasos se reinicia. */
        var firma = cap().matTxt(A);
        if (firma !== st.firma) { st.firma = firma; st.paso = Math.min(st.paso, n); }
        var vis = Math.max(1, Math.min(st.paso, n));
        st.paso = vis;

        var h1 = caja('Matriz de partida, de dimensión ' + cap().dimTxt(A), cap().matTex(A));
        h1 += S.kvs([
          'orden máximo posible: <b>' + RM.maximo + '</b>',
          'pasos del método: <b>' + n + '</b>',
          'paso mostrado: <b>' + vis + ' de ' + n + '</b>'
        ]);
        h1 += parrafo('Con los botones <b>«Paso siguiente»</b>, <b>«Paso anterior»</b>, <b>«Ver todos los ' +
          'pasos»</b> y <b>«Volver al principio»</b> se recorre la cadena del método. Los menores se ' +
          'describen siempre con las filas y las columnas numeradas <b>desde 1</b>.');

        var ultimoConMenor = null, q;
        for (q = 0; q < vis; q++) {
          var p = RM.pasos[q];
          if (p.menor) ultimoConMenor = p;
          var cuerpo = '<p>' + p.descripcion + '</p>';
          if (p.tex) cuerpo += '<div class="detc-caja">' + KD(p.tex) + '</div>';
          if (p.menor) {
            cuerpo += '<p class="detc-txt">Menor de orden <b>' + p.menor.orden + '</b>: filas <b>' +
              p.menor.filas1.join(', ') + '</b>, columnas <b>' + p.menor.cols1.join(', ') + '</b>, valor ' +
              K(FT(p.menor.valor)) + '.</p>';
          }
          if (p.probados !== undefined) {
            cuerpo += '<p class="detc-txt">Orlados probados en este paso: <b>' + p.probados + '</b>.</p>';
          }
          var clase = p.tipo === 'todosNulos' ? 'detc-paso-dep'
            : (p.tipo === 'inicio' ? 'detc-paso0' : 'detc-paso-ind');
          h1 += S.paso(p.tipo === 'inicio' ? 'inicio' : String(q), cuerpo, clase);
        }
        if (vis < n) {
          h1 += pista('Quedan <b>' + (n - vis) + '</b> ' + plural(n - vis, 'paso') +
            '. Pulsa «Paso siguiente» para continuar la cadena.');
        }

        if (v.fig && ultimoConMenor) {
          var mm = ultimoConMenor.menor;
          h1 += figMat(A, {
            titulo: 'El menor de este paso, de orden ' + mm.orden,
            sub: 'filas ' + mm.filas1.join(', ') + '   ·   columnas ' + mm.cols1.join(', ') +
              '   ·   valor = ' + nTxt(mm.valor),
            filasSel: mm.filas, colsSel: mm.cols,
            notas: A.a.map(function (_, i) { return mm.filas.indexOf(i) >= 0 ? 'fila del menor' : ''; }),
            pie: ['Orlar consiste en añadir a este recuadro una fila y una columna de las que quedan fuera.'],
            label: 'Menor del paso actual del método de los orlados',
            cap: 'En rojo, el menor no nulo con el que se trabaja. Los orlados se forman añadiéndole una de ' +
              'las filas y una de las columnas que están fuera.'
          });
        }

        if (vis === n) {
          h1 += S.resultado(K('\\operatorname{rg}(A) = ' + RM.rango), 'rango por el método de los orlados');
          if (RM.menorTestigo) {
            h1 += caja('Menor testigo, de orden ' + RM.menorTestigo.orden,
              cap().detTex(RM.menorTestigo.mat) + ' = ' + FT(RM.menorTestigo.valor) + ' \\ne 0');
            h1 += bien('Este menor no nulo de orden ' + RM.menorTestigo.orden + ' con <b>todos sus orlados ' +
              'nulos</b> es la prueba completa: el rango es exactamente ' + RM.rango + '.');
          } else {
            h1 += aviso('No hay ningún elemento distinto de cero, así que la matriz es nula y su rango es 0.');
          }
          h1 += parrafo('Comprobación por el otro camino: escalonando por Gauss sale ' +
            K('\\operatorname{rg}(A) = ' + cap().rango(A)) + '. Los dos métodos coinciden siempre.');
        }
        return h1;
      }));
  };

  /* ==================================================================
     6 · Archivo 12 · orlado
     ================================================================== */
  R.orlado = function (node) {
    return S.shell(node, 'Qué es orlar un menor',
      '<b>Orlar</b> un menor de orden ' + K('h') + ' es añadirle <b>una fila</b> y <b>una columna</b> de las ' +
      'que había dejado fuera, para obtener un menor de orden ' + K('h+1') + '. Si el menor de partida es de ' +
      'orden ' + K('h') + ' en una matriz ' + K('m \\times n') + ', hay ' + K('(m-h)(n-h)') + ' orlados ' +
      'posibles. ' + EJ_MAT + ' ' + EJ_IDX + ' Escribe el menor de partida y muévete por sus orlados con la ' +
      'casilla «Orlado que miro».',
      [
        {
          id: 'A', label: 'Matriz (una fila por línea)', type: 'textarea', rows: 4,
          value: '1 2 3 4\n2 4 6 8\n1 0 1 0', ancho: '17rem'
        },
        { id: 'filas', label: 'Filas del menor de partida', type: 'text', value: '1 3', ancho: '10rem' },
        { id: 'cols', label: 'Columnas del menor de partida', type: 'text', value: '1 2', ancho: '10rem' },
        { id: 'cual', label: 'Orlado que miro', type: 'number', min: 1, max: 30, value: 1, ancho: '9rem' },
        chips([
          {
            txt: 'Orlar un menor de orden 2', tip: 'dos orlados posibles en una 3×4',
            set: { A: ESC.tres4.replace(/; /g, '\n'), filas: '1 3', cols: '1 2', cual: 1 }
          },
          {
            txt: 'Orlar un elemento (orden 1)', tip: 'muchos orlados de orden 2',
            set: { A: ESC.tres4.replace(/; /g, '\n'), filas: '1', cols: '1', cual: 1 }
          },
          {
            txt: 'Todos los orlados nulos', tip: 'aquí se para el método: rango 1',
            set: { A: ESC.rango1.replace(/; /g, '\n'), filas: '1', cols: '1', cual: 1 }
          },
          {
            txt: 'Un orlado no nulo entre varios', tip: 'basta con uno para subir de orden',
            set: { A: ESC.rango3.replace(/; /g, '\n'), filas: '1 2', cols: '1 2', cual: 2 }
          },
          {
            txt: 'Matriz 4×5, menor de orden 2', tip: '(4−2)·(5−2) = 6 orlados',
            set: { A: ESC.cuatro5.replace(/; /g, '\n'), filas: '1 2', cols: '1 3', cual: 3 }
          },
          {
            txt: 'Cuadrada 4×4, menor de orden 3', tip: 'un único orlado: el determinante entero',
            set: { A: ESC.cuad4.replace(/; /g, '\n'), filas: '1 3 4', cols: '1 2 4', cual: 1 }
          },
          {
            txt: 'Con fracciones', tip: 'los orlados salen exactos',
            set: { A: ESC.frac.replace(/; /g, '\n'), filas: '1', cols: '1', cual: 1 }
          }
        ])
      ],
      safe(function (v) {
        var A = leeM(v.A, 'la matriz', 5, 6);
        var mx = Math.min(A.f, A.c);
        var fil = leeIdx(v.filas, 'filas', A.f, undefined);
        var col = leeIdx(v.cols, 'columnas', A.c, undefined);
        if (fil.length !== col.length) {
          throw Error('Un menor se forma con el mismo número de filas que de columnas: has escrito ' +
            fil.length + ' ' + plural(fil.length, 'fila') + ' y ' + col.length + ' ' +
            plural(col.length, 'columna') + '. Por ejemplo, para orden 2: filas 1 3 y columnas 1 2.');
        }
        var h = fil.length;
        if (h >= mx) {
          throw Error('Un menor de orden ' + h + ' ya es del orden más alto posible en una matriz de ' +
            cap().dimTxt(A) + ' (mín(' + A.f + ', ' + A.c + ') = ' + mx + '), así que no se puede orlar: ' +
            'no quedan filas o columnas que añadir. Elige un menor de orden menor que ' + mx + '.');
        }
        var Msub = cap().submatriz(A, fil, col);
        var val = cap().det(Msub);
        var L = cap().orlados(A, fil, col);
        var cuantos = (A.f - h) * (A.c - h);
        var cual = S.entero(v.cual, 1, L.length, 'El número del orlado que quieres ver');
        var el = L[cual - 1];

        var h1 = caja('Matriz de partida, de dimensión ' + cap().dimTxt(A) +
          ' (en un recuadro, el menor que vamos a orlar)', cap().matTex(A, { marca: marcas(fil, col) }));
        h1 += caja('Menor de partida, de orden ' + h,
          cap().detTex(Msub) + ' = ' + FT(val) + (cero(val) ? '' : ' \\ne 0'));
        if (cero(val)) {
          h1 += aviso('Este menor de partida <b>vale 0</b>. El método de los orlados exige partir de un ' +
            'menor <b>distinto de cero</b>: si el de partida es nulo, que sus orlados salgan nulos no ' +
            'demuestra nada. Elige otras filas y columnas y vuelve a mirar.');
        } else {
          h1 += bien('El menor de partida es distinto de cero, así que ' +
            K('\\operatorname{rg}(A) \\ge ' + h) + '. La pregunta ahora es si se puede subir a ' + (h + 1) + '.');
        }
        h1 += S.kvs([
          'orden del menor de partida: <b>' + h + '</b>',
          'filas libres: <b>' + (A.f - h) + '</b>',
          'columnas libres: <b>' + (A.c - h) + '</b>',
          'orlados posibles (m − h)·(n − h) = <b>' + (A.f - h) + ' · ' + (A.c - h) + ' = ' + cuantos + '</b>'
        ]);
        h1 += parrafo('Cada orlado se obtiene añadiendo <b>una</b> de las ' + (A.f - h) + ' ' +
          plural(A.f - h, 'fila libre', 'filas libres') + ' y <b>una</b> de las ' + (A.c - h) + ' ' +
          plural(A.c - h, 'columna libre', 'columnas libres') + ', y sale un menor de orden ' + (h + 1) +
          '. En total hay ' + K('(' + A.f + ' - ' + h + ')(' + A.c + ' - ' + h + ') = ' + cuantos) +
          ', y el applet los tiene todos calculados.');

        h1 += titulo('Orlado ' + cual + ' de ' + L.length + ', uno a uno');
        h1 += parrafo('Este orlado añade la <b>fila ' + el.filaNueva1 + '</b> y la <b>columna ' +
          el.colNueva1 + '</b>. Queda el menor de orden ' + el.orden + ' con las filas ' +
          el.filas1.join(', ') + ' y las columnas ' + el.cols1.join(', ') + '.');
        h1 += caja('Orlado ' + cual, cap().detTex(el.mat) + ' = ' + FT(el.valor));
        h1 += (el.nulo
          ? aviso('Este orlado <b>vale 0</b>: por sí solo no permite subir de orden. Hay que mirar los demás.')
          : bien('Este orlado es <b>distinto de cero</b>: ya se puede afirmar que ' +
            K('\\operatorname{rg}(A) \\ge ' + el.orden) + ', y el método sigue con él como nuevo menor de ' +
            'partida.'));
        h1 += figMat(A, {
          titulo: 'Orlar es añadir una fila y una columna',
          sub: 'en rojo el menor de orden ' + h + '   ·   en verde la fila ' + el.filaNueva1 +
            ' y la columna ' + el.colNueva1 + ' que se añaden',
          filasSel: fil, colsSel: col,
          filasNuevas: [el.filaNueva], colsNuevas: [el.colNueva],
          notas: A.a.map(function (_, i) {
            if (i === el.filaNueva) return 'fila que se añade';
            return fil.indexOf(i) >= 0 ? 'fila del menor' : '';
          }),
          pie: ['Orlado ' + cual + ' de ' + L.length + '   ·   valor = ' + nTxt(el.valor),
            'El menor orlado es de orden ' + el.orden + '.'],
          label: 'Menor orlado: se añade una fila y una columna',
          cap: 'El recuadro rojo es el menor de partida; en verde, la fila y la columna nuevas. Las cuatro ' +
            'esquinas juntas forman el menor de orden ' + el.orden + '.'
        });

        h1 += titulo('Los ' + L.length + ' orlados de golpe');
        var nulos = 0;
        var tbl = L.map(function (o, q) {
          if (o.nulo) nulos++;
          return {
            celdas: [
              String(q + 1),
              'fila ' + o.filaNueva1 + ' y columna ' + o.colNueva1,
              'filas ' + o.filas1.join(', ') + ' · columnas ' + o.cols1.join(', '),
              K(FT(o.valor)),
              o.nulo ? S.badge('vale 0', 'no') : S.badge('distinto de 0', 'si')
            ],
            clase: o.nulo ? 'detc-ko' : 'detc-ok'
          };
        });
        h1 += S.tabla(['Nº', 'Qué se añade', 'Menor de orden ' + (h + 1) + ' resultante', 'Valor', 'Resultado'], tbl);
        h1 += figBarras([
          { etq: 'orlados no nulos', valor: L.length - nulos, col: COL.verde },
          { etq: 'orlados nulos', valor: nulos, col: COL.rojo },
          { etq: 'orlados en total', valor: L.length, col: COL.azul }
        ], {
          titulo: 'Cuántos orlados hay y cuántos sirven',
          sub: 'basta con que UNO sea distinto de cero',
          pie: ['(m − h)·(n − h) = ' + (A.f - h) + ' · ' + (A.c - h) + ' = ' + cuantos],
          label: 'Recuento de orlados nulos y no nulos',
          cap: 'Para subir de orden basta un orlado no nulo; para parar hacen falta <b>todos</b> nulos.'
        });
        if (nulos === L.length) {
          h1 += parrafo('<b>Todos</b> los orlados valen 0. Si el menor de partida era no nulo, el método de ' +
            'los orlados termina aquí: ' + K('\\operatorname{rg}(A) = ' + h) + '. No hay que calcular ningún ' +
            'otro menor de orden ' + (h + 1) + ', ni de orden mayor.');
        } else {
          h1 += parrafo('Hay <b>' + (L.length - nulos) + '</b> ' +
            plural(L.length - nulos, 'orlado', 'orlados') + ' distintos de cero. Con <b>uno</b> basta: se ' +
            'toma como nuevo menor de partida y se vuelve a orlar. Por eso el método no necesita calcular ' +
            'los ' + cap().cuentaMenores(A.f, A.c, h + 1) + ' menores de orden ' + (h + 1) +
            ' que tiene la matriz.');
        }
        return h1;
      }));
  };

  /* ==================================================================
     7 · Archivo 12 · retoRango
     ================================================================== */
  var DIMS = {
    '2x3': [2, 3], '3x3': [3, 3], '3x4': [3, 4], '4x4': [4, 4], '4x5': [4, 5]
  };
  R.retoRango = function (node) {
    var st = {
      semilla: 20260912, txt: null, dim: '3x4',
      aciertos: 0, intentos: 0, corregido: false, verSol: false, ultima: null
    };

    function genera(dim) {
      var d = DIMS[dim] || DIMS['3x4'];
      var az = new Az(st.semilla);
      st.semilla = az.ent(1, 2000000000);
      var f = d[0], c = d[1], A, r, i, j, intentos = 0;
      do {
        A = az.matriz(f, c, -3, 3);
        /* La mitad de las veces se fuerza una dependencia para que el
           rango no sea casi siempre el máximo. */
        if (az.ent(0, 1) === 1 && f >= 2) {
          var k1 = new Frac(az.ent(-2, 2));
          var k2 = new Frac(az.ent(-2, 2));
          for (j = 0; j < c; j++) {
            A.a[f - 1][j] = A.a[0][j].por(k1).mas(A.a[Math.min(1, f - 1)][j].por(k2));
          }
        }
        r = cap().rango(A);
        intentos++;
      } while (r === 0 && intentos < 10);
      st.txt = cap().matTxt(A);
      st.dim = dim;
      st.corregido = false;
      st.verSol = false;
      st.ultima = null;
    }
    genera('3x4');

    return S.shell(node, 'Reto de rango autocorregido',
      'El applet propone una matriz y tú escribes su <b>rango</b>. Pulsa <b>«Comprobar»</b> y se corrige al ' +
      'instante: si fallas, aparece el razonamiento completo por el método de los orlados, paso a paso. ' +
      'La dificultad la marca el tamaño de la matriz. El contador de aciertos se mantiene entre retos. ' +
      'Si quieres practicar con tus propias matrices, usa el applet del método de los orlados; el formato ' +
      'de entrada allí es el de siempre: <code>1 2 3 4; 2 4 6 8; 1 0 1 0</code>.',
      [
        {
          id: 'dim', label: 'Tamaño de la matriz', type: 'select', value: '3x4',
          options: [
            { value: '2x3', label: '2×3 (fácil)' },
            { value: '3x3', label: '3×3' },
            { value: '3x4', label: '3×4' },
            { value: '4x4', label: '4×4 (difícil)' },
            { value: '4x5', label: '4×5 (difícil)' }
          ], ancho: '11rem'
        },
        { id: 'resp', label: 'Mi respuesta: rg(A) =', type: 'number', min: 0, max: 5, value: '', ancho: '9rem' },
        {
          id: 'corrige', label: 'Comprobar', type: 'button',
          click: function (ctl) {
            var A = cap().parseMat(st.txt);
            var r = cap().rango(A);
            var s = String(ctl.resp && ctl.resp.value !== undefined ? ctl.resp.value : '').trim();
            if (s === '' || !/^\d+$/.test(s)) { st.ultima = { vacia: true }; return; }
            var mio = Number(s);
            st.ultima = { mio: mio, bueno: r, acierto: mio === r };
            if (!st.corregido) {
              st.intentos++;
              if (mio === r) st.aciertos++;
              st.corregido = true;
            }
            if (mio !== r) st.verSol = true;
          }
        },
        {
          id: 'nuevo', label: 'Nuevo reto', type: 'button',
          click: function (ctl) {
            genera(String(ctl.dim && ctl.dim.value ? ctl.dim.value : st.dim));
            if (ctl.resp) ctl.resp.value = '';
          }
        },
        {
          id: 'ver', label: 'Ver la solución', type: 'button',
          click: function () { st.verSol = true; }
        },
        {
          id: 'cero', label: 'Reiniciar el contador', type: 'button',
          click: function () { st.aciertos = 0; st.intentos = 0; }
        }
      ],
      safe(function (v, ctl) {
        if (String(v.dim) !== st.dim) {
          genera(String(v.dim));
          if (ctl && ctl.resp) ctl.resp.value = '';
        }
        var A = cap().parseMat(st.txt);
        var RM = cap().rangoMenores(A);
        var rg = RM.rango;

        var h1 = titulo('Reto: ¿cuál es el rango de esta matriz?');
        h1 += caja('Matriz del reto, de dimensión ' + cap().dimTxt(A), cap().matTex(A));
        h1 += parrafo('Escribe el rango en la casilla <b>«Mi respuesta»</b> y pulsa <b>«Comprobar»</b>. ' +
          'Recuerda la cota: ' + K('\\operatorname{rg}(A) \\le \\min(' + A.f + ', ' + A.c + ') = ' +
            Math.min(A.f, A.c)) + ', así que la respuesta está entre 0 y ' + Math.min(A.f, A.c) + '.');
        h1 += S.kvs([
          'tamaño: <b>' + cap().dimTxt(A) + '</b>',
          'aciertos: <b>' + st.aciertos + '</b>',
          'retos corregidos: <b>' + st.intentos + '</b>',
          'porcentaje: <b>' + (st.intentos ? S.nc(100 * st.aciertos / st.intentos, 1) + ' %' : '—') + '</b>'
        ]);

        if (st.ultima && st.ultima.vacia) {
          h1 += aviso('Escribe primero un número entero en la casilla <b>«Mi respuesta»</b> (por ejemplo ' +
            '<code>2</code>) y vuelve a pulsar «Comprobar».');
        } else if (st.ultima && st.ultima.acierto) {
          h1 += bien('<b>¡Correcto!</b> El rango es ' + K(String(rg)) + '. Mira abajo el razonamiento por ' +
            'orlados para confirmar que has llegado por el buen camino.');
        } else if (st.ultima) {
          h1 += mal('<b>No es correcto.</b> Has escrito ' + K(String(st.ultima.mio)) + ' y el rango es ' +
            K(String(rg)) + '. ' + (st.ultima.mio > rg
              ? 'Te has pasado: todos los menores de orden ' + (rg + 1) + ' son nulos, así que el rango no ' +
                'puede llegar a ' + st.ultima.mio + '.'
              : 'Te has quedado corto: hay un menor de orden ' + rg + ' distinto de cero, y eso ya obliga a ' +
                'que el rango sea al menos ' + rg + '.'));
        } else {
          h1 += pista('Empieza por un elemento distinto de cero y ve orlando: es más rápido que calcular ' +
            'menores a lo loco. Y si la matriz tiene una fila que es combinación de las otras, el rango ' +
            'baja seguro.');
        }

        if (st.verSol) {
          h1 += titulo('El razonamiento completo por el método de los orlados');
          RM.pasos.forEach(function (p, q) {
            var cuerpo = '<p>' + p.descripcion + '</p>' +
              (p.tex ? '<div class="detc-caja">' + KD(p.tex) + '</div>' : '');
            if (p.menor) {
              cuerpo += '<p class="detc-txt">Filas <b>' + p.menor.filas1.join(', ') + '</b>, columnas <b>' +
                p.menor.cols1.join(', ') + '</b>, valor ' + K(FT(p.menor.valor)) + '.</p>';
            }
            h1 += S.paso(p.tipo === 'inicio' ? 'inicio' : String(q), cuerpo,
              p.tipo === 'todosNulos' ? 'detc-paso-dep' : '');
          });
          h1 += S.resultado(K('\\operatorname{rg}(A) = ' + rg), 'solución del reto');
          if (RM.menorTestigo) {
            h1 += caja('Menor testigo', cap().detTex(RM.menorTestigo.mat) + ' = ' +
              FT(RM.menorTestigo.valor) + ' \\ne 0');
            h1 += figMat(A, {
              titulo: 'El menor testigo del reto',
              sub: 'orden ' + RM.menorTestigo.orden + '   ·   valor = ' + nTxt(RM.menorTestigo.valor),
              filasSel: RM.menorTestigo.filas, colsSel: RM.menorTestigo.cols,
              pie: ['rg(A) = ' + rg],
              label: 'Menor testigo del reto',
              cap: 'Un menor no nulo de ese orden con todos sus orlados nulos cierra la demostración.'
            });
          } else {
            h1 += aviso('La matriz del reto es la matriz nula: su rango es 0.');
          }
          h1 += parrafo('Comprobación por Gauss: ' + K('\\operatorname{rg}(A) = ' + cap().rango(A)) +
            '. Pulsa <b>«Nuevo reto»</b> para otra matriz; puedes subir la dificultad cambiando el tamaño.');
        } else {
          h1 += pista('Cuando quieras rendirte, pulsa <b>«Ver la solución»</b>: aparecerá el razonamiento ' +
            'entero por orlados. Ojo: eso no cuenta como acierto.');
        }
        return h1;
      }));
  };

  /* ==================================================================
     8 · Archivo 13 · rangoParam
     ================================================================== */
  R.rangoParam = function (node) {
    return S.shell(node, 'Rango de una matriz con un parámetro',
      'Cuando la matriz lleva un parámetro, el rango puede cambiar según el valor que tome. El plan es ' +
      'siempre el mismo: se calcula el menor de mayor orden en función de ' + K('k') + ', se resuelve ' +
      K('\\det = 0') + ', y los valores de ' + K('k') + ' que salen son los <b>valores críticos</b>; en cada ' +
      'uno se recalcula el rango, y para los demás valores se da el <b>caso general</b>. ' + EJ_PAR + ' ' +
      'El deslizador sustituye ' + K('k') + ' por un número concreto para verlo.',
      [
        {
          id: 'P', label: 'Matriz con parámetro (una fila por línea)', type: 'textarea', rows: 4,
          value: '1 1 1\n1 k 1\n1 1 k', ancho: '17rem'
        },
        { id: 'letra', label: 'Letra del parámetro', type: 'text', value: 'k', ancho: '8rem' },
        { id: 'kv', label: 'Valor de k para probar', type: 'range', min: -4, max: 4, step: 0.5, value: 2, ancho: '13rem' },
        { id: 'pasos', label: 'Ver los pasos de la discusión', type: 'check', value: true },
        chips([
          { txt: 'Clásico 3×3 · k = 1', tip: 'un solo valor crítico', set: { P: ESC_P.clasico.replace(/; /g, '\n'), letra: 'k', kv: 2, pasos: true } },
          { txt: 'Orden 2 · dos valores críticos', tip: 'k² − 1 = 0', set: { P: ESC_P.dos.replace(/; /g, '\n'), letra: 'k', kv: 1, pasos: true } },
          { txt: 'Determinante lineal en k', tip: 'un único valor crítico', set: { P: ESC_P.lineal.replace(/; /g, '\n'), letra: 'k', kv: 4, pasos: true } },
          { txt: 'Matriz 3×3 con dos casos', tip: 'el rango baja de distinta forma', set: { P: ESC_P.rect.replace(/; /g, '\n'), letra: 'k', kv: 3, pasos: true } },
          { txt: 'Matriz 3×4 (no cuadrada)', tip: 'el rango se estudia con menores de orden 3', set: { P: ESC_P.tresCuatro.replace(/; /g, '\n'), letra: 'k', kv: 2, pasos: false } },
          { txt: 'Sin valores críticos', tip: 'k² + 1 nunca se anula', set: { P: ESC_P.sinRaiz.replace(/; /g, '\n'), letra: 'k', kv: 0, pasos: true } },
          { txt: 'Otra letra: m', tip: 'el parámetro no tiene que llamarse k', set: { P: '1 1 1\n1 m 1\n1 1 m', letra: 'm', kv: 3, pasos: true } }
        ])
      ],
      safe(function (v) {
        var letra = leeLetra(v.letra);
        var s = String(v.P || '').trim();
        if (s === '') {
          throw Error('Escribe la matriz con parámetro por filas. Por ejemplo: 1 1 1; 1 k 1; 1 1 k.');
        }
        var MP;
        try {
          MP = cap().matParamDe(s, letra);
        } catch (e) {
          throw Error(e.message + ' Recuerda el formato: 1 1 1; 1 ' + letra + ' 1; 1 1 ' + letra +
            '. Valen ' + letra + '-1, 2' + letra + '+3 y ' + letra + '^2, pero no 1/' + letra + '.');
        }
        if (MP.f > 5 || MP.c > 6) {
          throw Error('Este applet trabaja con matrices de hasta 5 filas y 6 columnas, y has escrito una de ' +
            MP.f + '×' + MP.c + '.');
        }
        var E = cap().rangoParamEstudio(MP, letra);
        var kv = FR(String(v.kv));
        var Ak = cap().evalParam(MP, kv);
        var RMk = cap().rangoMenores(Ak);
        var rk = RMk.rango;

        var h1 = caja('Matriz con parámetro, de dimensión ' + MP.f + '×' + MP.c, E.matTex);
        h1 += S.kvs([
          'parámetro: <b>' + letra + '</b>',
          'dimensión: <b>' + MP.f + '×' + MP.c + '</b>',
          'orden máximo de un menor: <b>' + E.maximo + '</b>',
          'rango en el caso general: <b>' + E.generico + '</b>'
        ]);

        /* --- el determinante como polinomio, si es cuadrada --- */
        if (MP.f === MP.c) {
          var D = cap().detParam(MP, letra);
          h1 += titulo('Paso 1 · el determinante es un polinomio en ' + letra);
          h1 += caja('Determinante', '\\det(A) = ' + D.polTex);
          if (D.factorTex && D.factorTex !== D.polTex) {
            h1 += caja('Factorizado', '\\det(A) = ' + D.factorTex);
          }
          h1 += parrafo('El determinante de una matriz cuyas entradas son polinomios en ' + K(letra) +
            ' es otro polinomio en ' + K(letra) + ', aquí de grado ' + K(String(D.grado)) + '. Sus raíces ' +
            'son los únicos valores del parámetro que pueden hacer bajar el rango.');
          h1 += titulo('Paso 2 · se resuelve det(A) = 0');
          h1 += caja('Ecuación', D.polTex + ' = 0');
          if (D.siempreNulo) {
            h1 += aviso('El determinante es <b>idénticamente nulo</b>: vale 0 para cualquier valor de ' +
              K(letra) + '. El rango nunca llega al máximo y hay que estudiarlo con menores de orden menor.');
          } else if (!D.raices.length) {
            h1 += parrafo('La ecuación <b>no tiene soluciones racionales</b>: el determinante no se anula ' +
              'para ningún valor (racional) de ' + K(letra) + ', así que el rango es siempre el máximo, ' +
              K('\\operatorname{rg}(A) = ' + E.generico) + ', y no hay casos que discutir.');
          } else {
            h1 += S.tabla(['Solución de det(A) = 0', 'Multiplicidad', 'Rango en ese valor'],
              D.raices.map(function (r) {
                return [K(letra + ' = ' + FT(r.valor)), String(r.mult), K(String(r.rango))];
              }));
          }
          if (D.cuadratica && D.cuadratica.tex) {
            h1 += caja('Resolución de la ecuación de segundo grado', D.cuadratica.tex);
          }
        } else {
          h1 += titulo('Paso 1 · la matriz no es cuadrada: menores de orden ' + E.maximo);
          h1 += parrafo('Una matriz de ' + MP.f + '×' + MP.c + ' <b>no tiene determinante</b>. Lo que se ' +
            'estudia son sus menores de orden ' + K(String(E.maximo)) + ': si alguno es distinto de cero, ' +
            'el rango es ' + K(String(E.maximo)) + '; y si todos se anulan para cierto valor de ' + K(letra) +
            ', hay que bajar de orden. El applet ya ha hecho ese estudio para todos los valores críticos.');
        }

        if (v.pasos) {
          h1 += titulo('La discusión, paso a paso');
          E.pasos.forEach(function (p, q) {
            h1 += S.paso(q === 0 ? 'inicio' : String(q),
              '<p>' + p.descripcion + '</p>' + (p.tex ? '<div class="detc-caja">' + KD(p.tex) + '</div>' : ''),
              q === 0 ? 'detc-paso0' : '');
          });
        }

        h1 += titulo('Paso 3 · el rango caso por caso');
        h1 += S.tabla(['Caso', 'Rango', 'Por qué'], E.tabla.map(function (t) {
          return { celdas: [K(t.condicion), K(String(t.rango)), t.explicacion] };
        }));
        h1 += S.resultado(K('\\operatorname{rg}(A) = ' + E.generico),
          'rango si ' + (E.criticos.length ? letra + ' no es ninguno de los valores críticos' : 'para cualquier ' + letra));

        h1 += figRecta(E.criticos, E.generico, letra, kv);

        h1 += titulo('Compruébalo sustituyendo ' + letra);
        h1 += parrafo('El deslizador va de ' + K('-4') + ' a ' + K('4') + ' de medio en medio, así que puede ' +
          'caer justo en un valor crítico o entre dos. Ahora vale ' + K(letra + ' = ' + FT(kv)) + '.');
        h1 += caja('Matriz para ' + letra + ' = ' + nTxt(kv), cap().matTex(Ak));
        h1 += S.resultado(K('\\operatorname{rg}(A) = ' + rk), 'rango para ' + letra + ' = ' + nTxt(kv));
        var esCritico = E.criticos.some(function (c) { return igF(c.valor, kv); });
        if (esCritico) {
          h1 += aviso('¡Estás justo en un <b>valor crítico</b>! Para ' + K(letra + ' = ' + FT(kv)) +
            ' el rango baja de ' + K(String(E.generico)) + ' a ' + K(String(rk)) + ': alguna línea se ha ' +
            'vuelto combinación lineal de las otras. Mueve un poco el deslizador y el rango vuelve a subir.');
        } else if (rk === E.generico) {
          h1 += bien('Para ' + K(letra + ' = ' + FT(kv)) + ' estamos en el <b>caso general</b>: el rango ' +
            'vale ' + K(String(E.generico)) + '. Prueba a poner el deslizador en un valor crítico para ver ' +
            'el salto.');
        } else {
          h1 += aviso('Para ' + K(letra + ' = ' + FT(kv)) + ' el rango es ' + K(String(rk)) +
            ', distinto del genérico ' + K(String(E.generico)) + '.');
        }
        if (RMk.menorTestigo) {
          h1 += figMat(Ak, {
            titulo: 'La matriz con ' + letra + ' = ' + nTxt(kv) + ' y su menor testigo',
            sub: 'rango = ' + rk + '   ·   menor testigo de orden ' + RMk.menorTestigo.orden,
            filasSel: RMk.menorTestigo.filas, colsSel: RMk.menorTestigo.cols,
            pie: ['Al sustituir el parámetro queda una matriz corriente, y su rango se calcula como siempre.'],
            label: 'Matriz con el parámetro sustituido y su menor testigo',
            cap: 'El menor testigo cambia según el valor del parámetro: eso es exactamente lo que hace que ' +
              'el rango dé un salto.'
          });
        }

        if (E.criticos.length) {
          h1 += titulo('Qué pasa exactamente en cada valor crítico');
          E.criticos.forEach(function (c) {
            var cont = caja('Matriz para ' + letra + ' = ' + nTxt(c.valor), cap().matTex(c.matriz));
            cont += '<p class="detc-txt">' + c.descripcion + '</p>';
            cont += S.kvs(['rango: <b>' + c.rango + '</b>', 'rango genérico: <b>' + E.generico + '</b>',
              'baja <b>' + (E.generico - c.rango) + '</b>']);
            if (c.estudio && c.estudio.menorTestigo) {
              cont += caja('Menor testigo para ' + letra + ' = ' + nTxt(c.valor),
                cap().detTex(c.estudio.menorTestigo.mat) + ' = ' +
                FT(c.estudio.menorTestigo.valor) + ' \\ne 0');
            }
            h1 += '<div class="det-caso"><div class="det-caso-tit">' + letra + ' = ' + nTxt(c.valor) +
              '</div>' + cont + '</div>';
          });
        }
        h1 += parrafo('<b>Cómo se escribe esto en un examen.</b> Primero el caso general, con el menor de ' +
          'mayor orden en función de ' + K(letra) + '. Después la ecuación que lo anula y sus soluciones: los ' +
          'valores críticos. Y por último, cada valor crítico sustituido y su rango recalculado. La ' +
          'respuesta se da <b>por casos</b> y siempre <b>justificada</b>.');
        return h1;
      }));
  };

  /* ==================================================================
     9 · Archivo 13 · discuteParam
     ================================================================== */
  R.discuteParam = function (node) {
    return S.shell(node, 'Discusión guiada del rango con parámetro',
      'Aquí decides tú. Para la matriz con parámetro que aparece abajo hay que tomar cuatro decisiones: ' +
      '<b>qué orden de menor</b> se mira primero, <b>cuál es el rango en el caso general</b>, <b>qué valores ' +
      'críticos</b> salen al resolver la ecuación, y <b>qué rango</b> queda en cada uno de ellos. Escribe tus ' +
      'respuestas y el applet valida o corrige cada una por separado. ' + EJ_PAR + ' Los valores críticos se ' +
      'escriben separados por espacios (<code>1 -1</code>, y si no hay ninguno, <code>ninguno</code>); los ' +
      'rangos, en el mismo orden (<code>2 1</code>).',
      [
        {
          id: 'P', label: 'Matriz con parámetro (una fila por línea)', type: 'textarea', rows: 4,
          value: '1 1 1\n1 k 1\n1 1 k', ancho: '17rem'
        },
        { id: 'letra', label: 'Letra del parámetro', type: 'text', value: 'k', ancho: '8rem' },
        { id: 'orden', label: '1) Orden del menor que miro primero', type: 'number', min: 1, max: 6, value: 3, ancho: '11rem' },
        { id: 'rgen', label: '2) Rango en el caso general', type: 'number', min: 0, max: 6, value: 3, ancho: '11rem' },
        { id: 'raices', label: '3) Valores críticos de k', type: 'text', value: '1', ancho: '11rem' },
        { id: 'rangos', label: '4) Rango en cada valor crítico', type: 'text', value: '1', ancho: '11rem' },
        { id: 'final', label: 'Ver la discusión redactada', type: 'check', value: true },
        chips([
          {
            txt: 'Clásico 3×3 (bien resuelto)', tip: 'un valor crítico, k = 1',
            set: { P: ESC_P.clasico.replace(/; /g, '\n'), letra: 'k', orden: 3, rgen: 3, raices: '1', rangos: '1', final: true }
          },
          {
            txt: 'Clásico 3×3 (con un fallo típico)', tip: 'olvidar recalcular el rango en la raíz',
            set: { P: ESC_P.clasico.replace(/; /g, '\n'), letra: 'k', orden: 3, rgen: 3, raices: '1', rangos: '2', final: true }
          },
          {
            txt: 'Orden 2, dos raíces', tip: 'k² − 1 = 0 → k = 1 y k = −1',
            set: { P: ESC_P.dos.replace(/; /g, '\n'), letra: 'k', orden: 2, rgen: 2, raices: '1 -1', rangos: '1 1', final: true }
          },
          {
            txt: 'Fallo: mirar un menor de orden 1', tip: 'hay que empezar por el orden más alto',
            set: { P: ESC_P.clasico.replace(/; /g, '\n'), letra: 'k', orden: 1, rgen: 3, raices: '1', rangos: '1', final: false }
          },
          {
            txt: 'Matriz 3×4 (no cuadrada)', tip: 'no hay determinante: menores de orden 3',
            set: { P: ESC_P.tresCuatro.replace(/; /g, '\n'), letra: 'k', orden: 3, rgen: 3, raices: '1', rangos: '2', final: true }
          },
          {
            txt: 'Sin valores críticos', tip: 'la respuesta correcta es «ninguno»',
            set: { P: ESC_P.sinRaiz.replace(/; /g, '\n'), letra: 'k', orden: 3, rgen: 3, raices: 'ninguno', rangos: '', final: true }
          },
          {
            txt: 'Otra letra: m', tip: 'la discusión es idéntica',
            set: { P: '1 1 1\n1 m 1\n1 1 m', letra: 'm', orden: 3, rgen: 3, raices: '1', rangos: '1', final: true }
          }
        ])
      ],
      safe(function (v) {
        var letra = leeLetra(v.letra);
        var s = String(v.P || '').trim();
        if (s === '') {
          throw Error('Escribe la matriz con parámetro por filas. Por ejemplo: 1 1 1; 1 k 1; 1 1 k.');
        }
        var MP;
        try {
          MP = cap().matParamDe(s, letra);
        } catch (e) {
          throw Error(e.message + ' Recuerda el formato: 1 1 1; 1 ' + letra + ' 1; 1 1 ' + letra + '.');
        }
        if (MP.f > 5 || MP.c > 6) {
          throw Error('Este applet trabaja con matrices de hasta 5 filas y 6 columnas, y has escrito una de ' +
            MP.f + '×' + MP.c + '.');
        }
        var E = cap().rangoParamEstudio(MP, letra);
        var mx = E.maximo;
        var ordEl = S.entero(v.orden, 1, 6, 'El orden del menor que miras primero');
        var rgenEl = S.entero(v.rgen, 0, 6, 'El rango en el caso general');
        var raicesEl = leeListaFrac(v.raices, 'los valores críticos');
        var rangosEl = leeListaEnt(v.rangos, 'los rangos de cada valor crítico', mx);
        var aciertos = 0, deTotal = 4;

        var h1 = caja('Matriz con parámetro, de dimensión ' + MP.f + '×' + MP.c, E.matTex);
        h1 += parrafo('Recuerda el plan de una discusión: <b>(1)</b> mirar el menor del orden más alto ' +
          'posible, <b>(2)</b> dar el rango del caso general, <b>(3)</b> resolver la ecuación que anula ese ' +
          'menor para hallar los valores críticos y <b>(4)</b> sustituir cada valor crítico y recalcular. ' +
          'Vamos una por una.');

        /* --- decisión 1: el orden del menor --- */
        h1 += titulo('Decisión 1 · ¿qué menor conviene mirar primero?');
        if (ordEl === mx) {
          aciertos++;
          h1 += bien('<b>Correcto.</b> El orden más alto posible es ' +
            K('\\min(' + MP.f + ', ' + MP.c + ') = ' + mx) + ', y por ahí se empieza: si ese menor no se ' +
            'anula, el rango ya es máximo y no hay nada más que discutir.');
        } else if (ordEl > mx) {
          h1 += mal('<b>No puede ser.</b> En una matriz de ' + MP.f + '×' + MP.c + ' no hay menores de orden ' +
            ordEl + ': el orden más alto posible es ' + K('\\min(' + MP.f + ', ' + MP.c + ') = ' + mx) +
            ', porque no hay bastantes ' + (MP.f < MP.c ? 'filas' : 'columnas') + ' que elegir.');
        } else {
          h1 += mal('<b>Se puede, pero no es el camino.</b> Empezar por un menor de orden ' + ordEl +
            ' obliga a subir después de orden en orden. Lo eficaz es mirar primero el orden más alto, ' +
            K(String(mx)) + ': si ese menor no se anula, el rango es máximo y la discusión se acaba en un ' +
            'solo paso.');
        }
        if (MP.f === MP.c) {
          var D = cap().detParam(MP, letra);
          h1 += caja('El menor de orden ' + mx + ' es el determinante', '\\det(A) = ' + D.polTex);
          if (D.factorTex && D.factorTex !== D.polTex) {
            h1 += caja('Factorizado', '\\det(A) = ' + D.factorTex);
          }
        } else {
          h1 += parrafo('Esta matriz no es cuadrada, así que <b>no tiene determinante</b>: el menor de orden ' +
            K(String(mx)) + ' se elige quitando ' + (MP.c > MP.f ? 'columnas' : 'filas') + '.');
        }

        /* --- decisión 2: rango genérico --- */
        h1 += titulo('Decisión 2 · el rango en el caso general');
        if (rgenEl === E.generico) {
          aciertos++;
          h1 += bien('<b>Correcto.</b> Para un valor cualquiera de ' + K(letra) + ' (ninguno de los ' +
            'críticos) el rango es ' + K(String(E.generico)) + '.');
        } else {
          h1 += mal('<b>No.</b> Has escrito ' + K(String(rgenEl)) + ' y el rango genérico es ' +
            K(String(E.generico)) + '. ' + (rgenEl > mx
              ? 'Además, el rango no puede pasar de mín(' + MP.f + ', ' + MP.c + ') = ' + mx + '.'
              : 'Sustituye un valor cualquiera que no sea crítico y compruébalo.'));
        }

        /* --- decisión 3: valores críticos --- */
        h1 += titulo('Decisión 3 · los valores críticos');
        var buenas = E.criticos.map(function (c) { return c.valor; });
        var faltan = buenas.filter(function (b) {
          return !raicesEl.some(function (r) { return igF(r, b); });
        });
        var sobran = raicesEl.filter(function (r) {
          return !buenas.some(function (b) { return igF(b, r); });
        });
        if (!faltan.length && !sobran.length) {
          aciertos++;
          h1 += bien('<b>Correcto.</b> ' + (buenas.length
            ? 'Los valores críticos son ' + buenas.map(function (b) { return K(letra + ' = ' + FT(b)); }).join(' y ') +
              ', y son exactamente los que anulan el menor de orden ' + mx + '.'
            : 'No hay ningún valor crítico: el menor de orden ' + mx + ' no se anula para ningún valor de ' +
              letra + ', así que el rango es siempre ' + E.generico + '.'));
        } else {
          var m3 = '<b>Todavía no.</b> ';
          if (faltan.length) {
            m3 += 'Te ' + plural(faltan.length, 'falta', 'faltan') + ' ' +
              faltan.map(function (b) { return K(letra + ' = ' + FT(b)); }).join(' y ') + '. ';
          }
          if (sobran.length) {
            m3 += 'En cambio, ' + sobran.map(function (r) { return K(letra + ' = ' + FT(r)); }).join(' y ') +
              ' ' + plural(sobran.length, 'no es un valor crítico', 'no son valores críticos') +
              ': ahí el menor de orden ' + mx + ' no se anula. ';
          }
          m3 += 'Los valores críticos son exactamente las soluciones de la ecuación que anula el menor de ' +
            'mayor orden' + (buenas.length
              ? ', y en esta matriz son ' + buenas.map(function (b) { return K(letra + ' = ' + FT(b)); }).join(' y ') + '.'
              : ', y en esta matriz esa ecuación no tiene ninguna solución real.');
          h1 += mal(m3);
        }
        if (E.criticos.length) {
          h1 += S.tabla(['Valor crítico', 'Matriz al sustituir', 'Rango'],
            E.criticos.map(function (c) {
              return [K(letra + ' = ' + FT(c.valor)), K(cap().matTex(c.matriz)), K(String(c.rango))];
            }));
        }

        /* --- decisión 4: el rango en cada valor crítico --- */
        h1 += titulo('Decisión 4 · el rango en cada valor crítico');
        if (!buenas.length) {
          if (!rangosEl.length) {
            aciertos++;
            h1 += bien('<b>Correcto.</b> Como no hay valores críticos, no hay ningún rango que recalcular: ' +
              'la casilla se deja vacía.');
          } else {
            h1 += mal('<b>No.</b> Aquí no hay valores críticos, así que no hay que dar ningún rango aparte: ' +
              'deja esa casilla vacía.');
          }
        } else if (rangosEl.length !== buenas.length) {
          h1 += mal('<b>Faltan datos.</b> Hay ' + buenas.length + ' ' +
            plural(buenas.length, 'valor crítico', 'valores críticos') + ' y has escrito ' + rangosEl.length +
            ' ' + plural(rangosEl.length, 'rango', 'rangos') + '. Escribe un rango por cada valor crítico, ' +
            'en el mismo orden en que los has puesto arriba.');
        } else {
          var falladas = [];
          buenas.forEach(function (b, q) {
            /* Se compara con el rango del valor crítico correspondiente,
               emparejando por el valor escrito por el alumno, no por la
               posición, si la lista del alumno era correcta. */
            var pos = -1, w;
            if (raicesEl.length === buenas.length) {
              for (w = 0; w < raicesEl.length; w++) {
                if (igF(raicesEl[w], b)) { pos = w; break; }
              }
            }
            var puesto = (pos >= 0) ? rangosEl[pos] : rangosEl[q];
            if (puesto !== E.criticos[q].rango) falladas.push({ val: b, puesto: puesto, bueno: E.criticos[q].rango });
          });
          if (!falladas.length) {
            aciertos++;
            h1 += bien('<b>Correcto.</b> ' + E.criticos.map(function (c) {
              return 'para ' + K(letra + ' = ' + FT(c.valor)) + ' el rango es ' + K(String(c.rango));
            }).join(', y ') + '.');
          } else {
            h1 += mal('<b>Casi.</b> ' + falladas.map(function (x) {
              return 'para ' + K(letra + ' = ' + FT(x.val)) + ' has puesto ' + K(String(x.puesto)) +
                ' y el rango es ' + K(String(x.bueno));
            }).join('; ') + '. Sustituye el valor en la matriz y vuelve a calcular el rango de esa matriz ' +
              'numérica: es el error más frecuente, dar por bueno el rango genérico.');
          }
        }

        /* --- marcador --- */
        h1 += titulo('Marcador de esta discusión');
        h1 += S.resultado(K(aciertos + '/' + deTotal), 'decisiones correctas');
        h1 += S.kvs([
          'orden del menor: <b>' + (ordEl === mx ? 'bien' : 'revisar') + '</b>',
          'rango genérico: <b>' + (rgenEl === E.generico ? 'bien' : 'revisar') + '</b>',
          'valores críticos: <b>' + (!faltan.length && !sobran.length ? 'bien' : 'revisar') + '</b>',
          'rango en cada uno: <b>' + (aciertos === deTotal || (aciertos === 3 && !(ordEl === mx && rgenEl === E.generico && !faltan.length && !sobran.length)) ? 'revisar' : 'bien') + '</b>'
        ]);
        h1 += (aciertos === deTotal
          ? bien('Discusión completa y correcta: ' + S.badge('4/4', 'ok') + ' Puedes copiarla tal cual en el examen.')
          : aviso('Corrige lo señalado y vuelve a pulsar «Calcular»: los avisos se rehacen enteros cada vez, ' +
              'no se acumulan.'));

        h1 += figRecta(E.criticos, E.generico, letra, null);

        /* --- la discusión redactada --- */
        if (v.final) {
          h1 += titulo('Así se redacta la discusión en un examen');
          var red = '';
          red += '<p class="detc-txt"><b>1) Planteamiento.</b> La matriz es de ' + MP.f + '×' + MP.c +
            ', luego ' + K('\\operatorname{rg}(A) \\le \\min(' + MP.f + ', ' + MP.c + ') = ' + mx) +
            '. Estudiamos primero un menor de orden ' + mx + '.</p>';
          if (MP.f === MP.c) {
            var D2 = cap().detParam(MP, letra);
            red += '<div class="detc-caja">' + KD('\\det(A) = ' + D2.polTex +
              (D2.factorTex && D2.factorTex !== D2.polTex ? ' = ' + D2.factorTex : '')) + '</div>';
            red += '<p class="detc-txt"><b>2) Ecuación.</b> ' + K('\\det(A) = 0') +
              (E.criticos.length
                ? ' tiene por ' + plural(E.criticos.length, 'solución', 'soluciones') + ' ' +
                  E.criticos.map(function (c) { return K(letra + ' = ' + FT(c.valor)); }).join(' y ') + '.'
                : ' no tiene solución, así que el determinante no se anula nunca.') + '</p>';
          } else {
            red += '<p class="detc-txt"><b>2) Ecuación.</b> Como la matriz no es cuadrada, se anulan a la vez ' +
              'todos los menores de orden ' + mx + ' precisamente cuando ' +
              (E.criticos.length
                ? E.criticos.map(function (c) { return K(letra + ' = ' + FT(c.valor)); }).join(' o ') + '.'
                : 'nunca: siempre queda alguno distinto de cero.') + '</p>';
          }
          red += '<p class="detc-txt"><b>3) Caso general.</b> Si ' + K(E.condicionGeneral || letra + ' \\in \\mathbb{R}') +
            ', hay un menor de orden ' + mx + ' distinto de cero y por tanto ' +
            K('\\operatorname{rg}(A) = ' + E.generico) + '.</p>';
          if (E.criticos.length) {
            red += '<p class="detc-txt"><b>4) Casos particulares.</b></p>';
            E.criticos.forEach(function (c) {
              red += '<p class="detc-txt">Para ' + K(letra + ' = ' + FT(c.valor)) + ' la matriz queda ' +
                K(cap().matTex(c.matriz)) + ', cuyo rango es ' + K(String(c.rango)) + '. ' +
                S.esc(String(c.descripcion || '')) + '</p>';
            });
          }
          red += '<p class="detc-txt"><b>Respuesta.</b></p>';
          red += S.tabla(['Caso', 'Rango'], E.tabla.map(function (t) {
            return [K(t.condicion), K('\\operatorname{rg}(A) = ' + t.rango)];
          }));
          h1 += '<div class="detc-caja dete-redaccion">' + red + '</div>';
          h1 += pista('Fíjate en el orden: primero el caso general y después los particulares. Nunca se ' +
            'escribe «el rango es ' + E.generico + '» a secas: siempre <b>por casos</b> y con la razón ' +
            'delante (qué menor no se anula).');
        }
        return h1;
      }));
  };

  /* ==================================================================
     Fin del módulo E
     ================================================================== */
  window.DET.extraE = true;
  if (S.monta) S.monta();
}());
