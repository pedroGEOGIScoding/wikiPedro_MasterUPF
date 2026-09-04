/* =====================================================================
   mtx-applets-b.js · Módulo B del Tema 1 «Matrices»
   2.º de Bachillerato · Matemáticas Aplicadas a las Ciencias Sociales
   Ruta: 2-BatxMatesCCSS/matrices/assets/mtx-applets-b.js

   Cubre los apartados 1.7 a 1.10 del tema:

     1.7   Suma de matrices y sus propiedades
     1.8   Producto de una matriz por un número
     1.9   Producto de una matriz fila por una matriz columna
     1.10  Producto de dos matrices

   ---------------------------------------------------------------------
   ÍNDICE DEL MÓDULO · los 9 applets que registra
   ---------------------------------------------------------------------

     suma            Suma y resta de matrices. Dos matrices editables. Si
                     las dimensiones no coinciden NO da un error: dice
                     cuáles son, por qué no se pueden sumar y qué haría
                     falta para poder hacerlo. Si coinciden, suma celda a
                     celda con un deslizador de paso que va encendiendo
                     los elementos uno a uno.

     propSuma        Propiedades de la suma. Comprueba con las matrices
                     del alumno (o con matrices generadas) la
                     conmutativa, la asociativa, la matriz nula como
                     elemento neutro y la matriz opuesta, enseñando
                     SIEMPRE las dos cuentas en paralelo y marcando si
                     coinciden elemento a elemento.

     escalar         Producto de una matriz por un número. Deslizador de
                     k con valores negativos y fraccionarios (paso 0,25):
                     se ve el producto k·a_ij dentro de cada celda y se
                     comprueban k(A+B)=kA+kB, (k+h)A=kA+hA y k(hA)=(kh)A.

     combinaLineal   Combinaciones lineales de matrices. Dos deslizadores
                     para alfa y beta, resultado en directo y comparación
                     con una matriz objetivo. Escenarios para anular la
                     combinación y para alcanzar un objetivo.

     filaColumna     Producto de una matriz fila por una matriz columna.
                     Empareja los términos con líneas de color (colocación
                     sin cruces: la columna a la izquierda y la fila
                     arriba a la derecha), muestra la suma de productos
                     término a término y avisa si las longitudes no
                     coinciden, diciendo cuántos elementos sobran.

     producto        Producto de matrices paso a paso. Diagrama de
                     compatibilidad (m×n)·(n×p)=m×p en el esquema clásico
                     (B arriba, A a la izquierda, el resultado en el
                     cruce). Modo celda a celda: el alumno elige c_ij y ve
                     encendidas la fila i de A y la columna j de B, con la
                     suma completa. Modo automático: la matriz entera.

     noConmuta       El producto no es conmutativo. Calcula A·B y B·A a la
                     vez, marca las posiciones en las que difieren e
                     incluye escenarios de divisores de cero, de fallo de
                     la propiedad cancelativa (A·B = A·C con B ≠ C) y de
                     dos matrices que SÍ conmutan.

     potencia        Potencias de una matriz. Tabla A, A², …, A^n con
                     deslizador de n, detección de periodicidad, de
                     matrices idempotentes y nilpotentes, y conjetura
                     razonada del valor de A^100.

     transforma      La matriz como transformación del plano. Matriz 2×2
                     con cuatro deslizadores aplicada a una figura
                     (cuadrado unidad, triángulo, casa o letra F): dibuja
                     original y transformada con S.plano, señala dónde van
                     los vectores (1,0) y (0,1), interpreta el
                     determinante como factor de área y muestra la
                     composición de dos matrices como producto.

   ---------------------------------------------------------------------
   Dependencias
   ---------------------------------------------------------------------
   Necesita el núcleo `mtx-applets.js` (window.MTX) y la capa de álgebra
   matricial `mtx-applets-alg.js`, que se cargan antes. De la capa se usan
   literalmente, sin reimplementar nada de álgebra:

     parseMat, matAleatoria, matTxt, matTex, dimTex, dimTxt, matIgual,
     difIguales, matSuma, matResta, matEscalar, matCombina, opuesta,
     matNula, matIdentidad, matTrans, filaPorColumna, matProd,
     matProdPasos, matPot, matPotPasos, det, esNula, traza, clasifica,
     fracDe, fracTex, plano, corte, textoPlano.

   Del núcleo: shell, registry, K, KD, esc, expr, paso, tabla, badge,
   kvs, resultado, svgWrap, txt, line, rect, circle, path, poly, leyenda,
   COL, etq, Frac.

   ---------------------------------------------------------------------
   Criterios didácticos y técnicos
   ---------------------------------------------------------------------
   1. Aritmética EXACTA con S.Frac (BigInt) en todo el módulo. La coma
      flotante solo aparece al pasar coordenadas a píxeles en `transforma`.
   2. Figuras GRANDES: ningún SVG baja de 760 × 500 unidades de viewBox,
      las celdas de las matrices dibujadas usan tipografía de 22 px y
      todos los rótulos van a 16 px o más y en negrita.
   3. Dentro de un <text> de SVG NUNCA se escribe LaTeX: los rótulos son
      texto llano («−3/2», «F1 · C2»), y las fórmulas bonitas van fuera
      de la figura, en el pie o en las tablas.
   4. Convención española: coma decimal en los textos y {,} dentro de
      KaTeX; signo menos tipográfico U+2212 en los rótulos de las figuras.
   5. Ninguna entrada mala rompe un applet: todo pasa por `safe`, que
      convierte cualquier Error en un aviso amable que dice qué corregir.
      Las operaciones imposibles (dimensiones incompatibles) no son
      errores: son una explicación con las dimensiones concretas y con lo
      que haría falta para poder operar.
   6. Todos los applets llevan botones de escenario con nombre.

   Clases CSS propias: prefijo `mtxb-`, añadidas al final de
   mtx-applets.css sin tocar ninguna regla anterior.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.MTX;
  if (!S) {
    if (window.console && console.error) {
      console.error('[matrices] mtx-applets-b.js necesita mtx-applets.js cargado antes.');
    }
    return;
  }

  var R = S.registry;
  var K = S.K, KD = S.KD, COL = S.COL;
  var Frac = S.Frac;

  /* ==================================================================
     0 · utilidades locales del módulo
     ================================================================== */

  /* Acceso perezoso a la capa de álgebra: si falta, el mensaje es claro. */
  function alg() {
    if (!S.parseMat || !S.matProdPasos || !S.matPotPasos || !S.plano) {
      throw Error('No se ha cargado la capa de álgebra matricial (mtx-applets-alg.js). ' +
        'Recarga la página; si el aviso persiste, avisa al profesor.');
    }
    return S;
  }

  function FR(v) { return alg().fracDe(v); }
  function FT(f) { return f.tex(true); }
  function cero(f) { return f.n === 0n; }
  function negF(f) { return f.n < 0n; }
  function numF(f) { return Number(f.n) / Number(f.d); }
  function F0() { return new Frac(0); }
  function F1() { return new Frac(1); }
  function igF(a, b) { return a.cmp(b) === 0; }

  /* Fracción exacta en TEXTO LLANO para los rótulos de un <svg>:
     «8/5», «−3/5», «2». Dentro del SVG no hay KaTeX. */
  function fracTxt(f) {
    var n = String(f.n), d = String(f.d), neg = n.charAt(0) === '-';
    if (neg) n = n.slice(1);
    if (d.charAt(0) === '-') { d = d.slice(1); neg = !neg; }
    return (neg ? '\u2212' : '') + n + (d === '1' ? '' : '/' + d);
  }
  /* El mismo número entre paréntesis cuando es negativo: (−3)·2 */
  function fracTxtP(f) {
    var t = fracTxt(f);
    return t.charAt(0) === '\u2212' ? '(' + t + ')' : t;
  }
  /* Número decimal en texto llano con menos tipográfico. */
  function numTxt(x) { return S.etq(x, 2); }

  /* Botones de escenario a partir de una lista { txt, tip, set }. */
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

  /* Envoltorio: cualquier error se convierte en un aviso amable y nunca
     llega a window.MTX.log, porque el applet no ha «fallado»: es el
     alumno el que tiene que corregir lo que ha escrito. */
  function safe(fn) {
    return function (v, ctl, out, api) {
      try {
        var h = fn(v, ctl, out, api);
        return (h === undefined || h === null || h === '')
          ? '<div class="mx-bad mtxb-err">No hay nada que mostrar todavía: revisa los datos que has escrito.</div>'
          : h;
      } catch (e) {
        var m = (e && e.message) ? e.message : 'No he podido calcular con estos datos.';
        return '<div class="mx-bad mtxb-err">' + S.esc(m) + '</div>';
      }
    };
  }

  function parrafo(h) { return '<p class="mtxb-txt">' + h + '</p>'; }
  function titulillo(t) { return '<p class="mtxb-sub">' + t + '</p>'; }

  /* ------------------------------------------------------------------
     Rótulos largos dentro de un SVG.
     Los <text> de SVG no se parten solos, así que un título largo se
     sale del lienzo. anchoTxt() estima el ancho en píxeles (con holgura),
     parteTxt() lo trocea en líneas sin cortar palabras y txtLineas()
     dibuja las líneas una debajo de otra. NUNCA se reduce el cuerpo de
     letra: se parte el texto y, si hace falta, se ensancha el lienzo.
     ------------------------------------------------------------------ */
  function anchoTxt(s, size) { return Math.ceil(String(s).length * (size || 18) * 0.58); }
  function parteTxt(s, maxCar) {
    var palabras = String(s).split(/\s+/), lineas = [], act = '';
    palabras.forEach(function (p) {
      if (act === '') { act = p; return; }
      if ((act + ' ' + p).length <= maxCar) act += ' ' + p;
      else { lineas.push(act); act = p; }
    });
    if (act !== '') lineas.push(act);
    return lineas.length ? lineas : [''];
  }
  function anchoLineas(lineas, size) {
    return lineas.reduce(function (m, t) { return Math.max(m, anchoTxt(t, size)); }, 0);
  }
  function txtLineas(x, y, lineas, o, dy) {
    return lineas.map(function (t, q) {
      return S.txt(x, y + q * (dy || 26), t, o);
    }).join('');
  }

  /* ------------------------------------------------------------------
     Lectura de una matriz escrita por el alumno. Delega en parseMat de
     la capa y solo añade el límite de tamaño (para que la figura siga
     siendo legible) y un mensaje si el campo está vacío.
     ------------------------------------------------------------------ */
  var EJEMPLO = 'Escribe la matriz por filas: las filas se separan con «;» y los elementos ' +
    'con espacios, por ejemplo 1 2 3; 4 5 6. Se admiten enteros (3), negativos (-2), ' +
    'decimales con coma (0,5) y fracciones (3/4).';

  function leeMat(txt, nombre, maxOrden) {
    nombre = nombre || 'la matriz';
    var s = String(txt === undefined || txt === null ? '' : txt).trim();
    if (s === '') throw Error('Falta ' + nombre + '. ' + EJEMPLO);
    var A = alg().parseMat(s);
    var lim = maxOrden || 6;
    if (A.f > lim || A.c > lim) {
      throw Error(nombre.charAt(0).toUpperCase() + nombre.slice(1) + ' es de ' + S.dimTxt(A) +
        ' y este applet trabaja hasta ' + lim + '×' + lim + ', para que la figura siga ' +
        'leyéndose bien en la pizarra. Prueba con una matriz más pequeña.');
    }
    return A;
  }

  /* ------------------------------------------------------------------
     Explicaciones de por qué una operación es IMPOSIBLE. No son errores:
     son la respuesta didáctica que el alumno necesita.
     ------------------------------------------------------------------ */
  function avisoSuma(A, B, verbo) {
    verbo = verbo || 'sumar';
    var h = '<div class="mtxb-imposible">';
    h += '<p class="mtxb-imposible-tit">No se pueden ' + verbo + ' estas dos matrices</p>';
    h += parrafo('La primera es de <strong>' + S.dimTxt(A) + '</strong> (' + A.f + ' filas y ' +
      A.c + ' columnas) y la segunda es de <strong>' + S.dimTxt(B) + '</strong> (' + B.f +
      ' filas y ' + B.c + ' columnas).');
    h += parrafo('La suma y la resta de matrices se hacen <em>elemento a elemento</em>: al elemento ' +
      'que ocupa el lugar $(i,j)$ de la primera le corresponde el que ocupa el lugar $(i,j)$ de la ' +
      'segunda. Para que ese emparejamiento exista, las dos matrices tienen que tener ' +
      '<strong>exactamente la misma dimensión</strong>.');
    var faltan = [];
    if (A.f !== B.f) {
      faltan.push('el número de <strong>filas</strong> no coincide: ' + A.f + ' frente a ' + B.f +
        ' (' + (A.f > B.f ? 'a la segunda le faltan ' + (A.f - B.f) : 'a la primera le faltan ' + (B.f - A.f)) +
        ' filas)');
    }
    if (A.c !== B.c) {
      faltan.push('el número de <strong>columnas</strong> no coincide: ' + A.c + ' frente a ' + B.c +
        ' (' + (A.c > B.c ? 'a la segunda le faltan ' + (A.c - B.c) : 'a la primera le faltan ' + (B.c - A.c)) +
        ' columnas)');
    }
    h += '<ul class="mtxb-avisos"><li>' + faltan.join('</li><li>') + '</li></ul>';
    h += parrafo('<strong>Qué haría falta:</strong> escribe la segunda matriz con ' + A.f + ' filas y ' +
      A.c + ' columnas (o cambia la primera para que sea de ' + S.dimTxt(B) + '). Fíjate en que ' +
      '<em>ninguna</em> operación arregla esto: no existe la suma de matrices de dimensiones distintas.');
    h += parrafo('Ojo: para el <strong>producto</strong> la condición es otra ' +
      '($(m\\times n)\\cdot(n\\times p)$, columnas de la primera iguales a filas de la segunda). ' +
      'Aquí, en cambio, hace falta la igualdad total de dimensiones.');
    return h + '</div>';
  }

  function avisoProd(A, B) {
    var h = '<div class="mtxb-imposible">';
    h += '<p class="mtxb-imposible-tit">Estas dos matrices no se pueden multiplicar en este orden</p>';
    h += parrafo('La primera es de <strong>' + S.dimTxt(A) + '</strong> y la segunda de ' +
      '<strong>' + S.dimTxt(B) + '</strong>. Para multiplicar $A\\cdot B$ hace falta que el número de ' +
      '<strong>columnas de la primera</strong> coincida con el número de <strong>filas de la segunda</strong>, ' +
      'porque cada elemento del resultado es una fila de $A$ multiplicada por una columna de $B$ ' +
      'término a término, y esos términos hay que emparejarlos uno a uno.');
    h += '<ul class="mtxb-avisos"><li>columnas de la primera: <strong>' + A.c + '</strong></li>' +
      '<li>filas de la segunda: <strong>' + B.f + '</strong></li>' +
      '<li>' + A.c + ' ≠ ' + B.f + ', así que el emparejamiento fila–columna es imposible: ' +
      'una fila de $A$ tiene ' + A.c + ' números y una columna de $B$ tiene ' + B.f + '</li></ul>';
    h += parrafo('<strong>Qué haría falta:</strong> una segunda matriz con <strong>' + A.c +
      ' filas</strong> (de dimensión ' + A.c + '×p, con la p que quieras); entonces el producto ' +
      'existiría y sería de dimensión ' + A.f + '×p. ' +
      (B.c === A.f
        ? 'Fíjate en que, en cambio, el producto <em>al revés</em> $B\\cdot A$ sí existe, porque ' +
          B.c + ' = ' + A.f + ': otra prueba más de que el producto de matrices no es conmutativo.'
        : 'Con estas dimensiones tampoco existe el producto al revés $B\\cdot A$, porque ' + B.c +
          ' ≠ ' + A.f + '.'));
    h += KD('(' + S.dimTex(A) + ')\\cdot(' + S.dimTex(B) + ') \\quad\\Longrightarrow\\quad ' +
      A.c + ' \\ne ' + B.f + '\\ \\text{: no existe}');
    return h + '</div>';
  }

  /* ==================================================================
     1 · dibujo de matrices en SVG (celdas grandes, texto llano)
     ================================================================== */
  var PAL = [COL.azul, COL.rojo, COL.verde, COL.naranja, COL.morado, COL.teal, COL.rosa];
  var CEL = 22;            /* tamaño de la tipografía dentro de las celdas */
  var ROT = 18;            /* tamaño de los rótulos de las figuras          */

  function corchete(x, y, h, lado) {
    var w = 13;
    var d = (lado === 'izq')
      ? 'M ' + (x + w) + ' ' + y + ' L ' + x + ' ' + y + ' L ' + x + ' ' + (y + h) + ' L ' + (x + w) + ' ' + (y + h)
      : 'M ' + (x - w) + ' ' + y + ' L ' + x + ' ' + y + ' L ' + x + ' ' + (y + h) + ' L ' + (x - w) + ' ' + (y + h);
    return S.path(d, COL.eje, 3.4);
  }

  /* Rejilla de celdas con texto llano. txtFn(i, j) -> cadena.
     o = { cw, ch, size, fill(i,j), rotulo, rotuloCol, pie, sub(i,j) } */
  function dibujaCeldas(x0, y0, f, c, txtFn, o) {
    o = o || {};
    var cw = o.cw || 84, ch = o.ch || 58, pad = 14;
    var W = c * cw + 2 * pad, H = f * ch + 2 * pad;
    var s = S.rect(x0, y0, W, H, o.fondo || '#ffffff', '#dde5ec', { r: 8, sw: 1.3 });
    var i, j;
    for (i = 0; i < f; i++) {
      for (j = 0; j < c; j++) {
        var cx = x0 + pad + j * cw, cy = y0 + pad + i * ch;
        var col = o.fill ? o.fill(i, j) : null;
        if (col) s += S.rect(cx + 3, cy + 3, cw - 6, ch - 6, col, 'none', { r: 7 });
        var sub = o.sub ? o.sub(i, j) : null;
        if (sub) {
          /* Valor arriba y detalle debajo: con las bases separadas solo
             19 px las dos cajas de texto llegaban a tocarse (por ejemplo
             «6» y «2 · 3» en el applet escalar). Ahora se separan 25 px. */
          s += S.txt(cx + cw / 2, cy + ch / 2 - 2, txtFn(i, j), { size: o.size || CEL, weight: '700' });
          s += S.txt(cx + cw / 2, cy + ch / 2 + 23, sub, { size: 15, weight: '600', fill: COL.gris });
        } else {
          s += S.txt(cx + cw / 2, cy + ch / 2 + 8, txtFn(i, j), { size: o.size || CEL, weight: '700' });
        }
      }
    }
    s += corchete(x0 + 3, y0 + 3, H - 6, 'izq');
    s += corchete(x0 + W - 3, y0 + 3, H - 6, 'der');
    if (o.rotulo) {
      s += S.txt(x0 + W / 2, y0 - 13, o.rotulo, { size: ROT, weight: '700', fill: o.rotuloCol || COL.azulOsc });
    }
    if (o.pie) {
      s += S.txt(x0 + W / 2, y0 + H + 26, o.pie, { size: 16, weight: '700', fill: o.pieCol || COL.gris });
    }
    return {
      svg: s, W: W, H: H, x: x0, y: y0, cw: cw, ch: ch, pad: pad,
      cx: function (jj) { return x0 + pad + jj * cw + cw / 2; },
      cy: function (ii) { return y0 + pad + ii * ch + ch / 2; },
      x1: x0 + W, y1: y0 + H
    };
  }

  /* La misma rejilla, pero leyendo los elementos de una Mat. */
  function dibujaMat(x0, y0, A, o) {
    return dibujaCeldas(x0, y0, A.f, A.c, function (i, j) { return fracTxt(A.a[i][j]); }, o);
  }

  /* Ancho de celda razonable según el número de columnas que hay que
     encajar en la figura, sin bajar nunca de 64 (tipografía de 22 px). */
  function anchoCelda(colsTotales) {
    if (colsTotales <= 6) return 92;
    if (colsTotales <= 9) return 84;
    if (colsTotales <= 12) return 76;
    return 68;
  }

  /* Operador grande (+, −, ·, =, ≠) centrado entre dos matrices.

     Se fija una familia tipográfica concreta a propósito: el «distinto
     de» U+2260 se veía defectuoso (el igual y la barra inclinada,
     descolocados entre sí) porque el <text> heredaba la letra de la
     página, y con esa letra el navegador compone el símbolo a partir de
     dos tipografías distintas. Con esta pila el glifo ≠ sale entero y de
     una sola pieza en cualquier sistema, y el resto de operadores no
     cambian de aspecto. */
  var FAM_OP = "'DejaVu Sans', 'Liberation Sans', Arial, Helvetica, sans-serif";
  function operador(x, y, s) {
    return S.txt(x, y + 10, s, { size: 34, weight: '700', fill: COL.eje, family: FAM_OP });
  }

  /* Marco final de la figura.

     El ancho nunca baja de 760 unidades de viewBox (figuras grandes,
     tipografía de 22 px en las celdas).

     El alto YA NO es un valor fijo con un mínimo de 500: se mide lo que
     realmente se ha dibujado con S.altoDibujado(body) y se le añade un
     margen inferior de 24 px. Con la altura fija sobraban entre 150 y
     200 px de lienzo vacío al final de varias figuras (combinaLineal,
     noConmuta…), que en la página se veían como un hueco blanco enorme
     bajo el último elemento. El alto que pasa quien llama se sigue
     respetando como MÍNIMO solo si es menor que el contenido, es decir,
     nunca recorta nada: se toma siempre el máximo entre el contenido
     medido y lo que haga falta para no cortar. */
  var MARGEN_ABAJO = 24;
  function figura(body, W, H, label, cap) {
    var alto = S.altoDibujado ? S.altoDibujado(body) + MARGEN_ABAJO : 0;
    if (!(alto > 0)) alto = Math.round(H);      /* por si no se mide nada */
    return S.svgWrap(body, Math.max(760, Math.round(W)), Math.round(alto), label, cap);
  }

  /* Colores de resalte reutilizados en todo el módulo. */
  var HI = {
    fila: 'rgba(25,118,210,.18)',
    col: 'rgba(46,125,50,.18)',
    celda: 'rgba(198,40,40,.24)',
    dif: 'rgba(198,40,40,.20)',
    ok: 'rgba(46,125,50,.16)',
    suave: 'rgba(120,144,156,.10)'
  };

  /* Tabla de dos columnas comparando dos matrices elemento a elemento. */
  function comparaMatrices(nom1, M1, nom2, M2) {
    var dif = [];
    if (M1.f === M2.f && M1.c === M2.c) dif = alg().difIguales(M1, M2);
    var iguales = (M1.f === M2.f && M1.c === M2.c && dif.length === 0);
    var h = '<div class="ap-grid2">';
    h += '<div class="ap-card ' + (iguales ? 'ap-card-ok' : 'ap-card-ko') + '">' +
      '<div class="ap-card-tit">' + nom1 + '</div>' + KD(S.matTex(M1, { marca: dif })) + '</div>';
    h += '<div class="ap-card ' + (iguales ? 'ap-card-ok' : 'ap-card-ko') + '">' +
      '<div class="ap-card-tit">' + nom2 + '</div>' + KD(S.matTex(M2, { marca: dif })) + '</div>';
    h += '</div>';
    return { html: h, iguales: iguales, dif: dif };
  }

  /* Lista «a_{12}, a_{23}» de posiciones en TeX. */
  function posTex(dif, letra) {
    letra = letra || 'c';
    return dif.map(function (p) {
      return letra + '_{' + (p[0] + 1) + (p[1] + 1) + '}';
    }).join(',\\ ');
  }

  /* ==================================================================
     2 · applet «suma» · Suma y resta de matrices
     ================================================================== */
  R.suma = function (node) {
    S.shell(node, 'Suma y resta de matrices',
      'Escribe cada matriz <strong>por filas</strong>: las filas se separan con «;» (o con un salto de ' +
      'línea) y los elementos con espacios. Ejemplo copiable para $A$: <code>1 2 3; 4 5 6</code>, ' +
      'y para $B$: <code>0 -1 2; 3 3 -4</code>. Puedes usar fracciones y decimales con coma: ' +
      '<code>1/2 3; 0 -2,5</code>. Elige con el selector si quieres calcular $A+B$ o $A-B$, y mueve el ' +
      'deslizador <em>paso</em> para ir encendiendo los elementos del resultado de uno en uno ' +
      '(paso 0 = ver el resultado entero). Si las dimensiones no coinciden, el applet no da un error: ' +
      'te explica exactamente por qué esa suma no existe.',
      [
        { id: 'A', type: 'textarea', label: 'Matriz A', rows: 3, value: '1 2 3; 4 5 6', place: '1 2 3; 4 5 6', ancho: '260px' },
        { id: 'B', type: 'textarea', label: 'Matriz B', rows: 3, value: '0 -1 2; 3 3 -4', place: '0 -1 2; 3 3 -4', ancho: '260px' },
        { id: 'op', type: 'select', label: 'Operación', value: 'suma', options: [
          { value: 'suma', label: 'A + B' }, { value: 'resta', label: 'A − B' }
        ] },
        { id: 'paso', type: 'range', label: 'Paso (0 = todo)', min: 0, max: 25, step: 1, value: 0 },
        chips([
          { txt: 'Suma 2×3', tip: 'El caso básico, con enteros positivos y negativos',
            set: { A: '1 2 3; 4 5 6', B: '0 -1 2; 3 3 -4', op: 'suma', paso: 0 } },
          { txt: 'Resta paso a paso', tip: 'La resta también es elemento a elemento',
            set: { A: '5 -2; 0 7', B: '3 4; -1 7', op: 'resta', paso: 1 } },
          { txt: 'Con fracciones', tip: 'La aritmética es exacta: 1/2 + 1/3 = 5/6',
            set: { A: '1/2 1/3; 2/5 -1', B: '1/3 1/6; 1/5 3/4', op: 'suma', paso: 0 } },
          { txt: 'A + (−A) = 0', tip: 'La matriz opuesta: el resultado es la matriz nula',
            set: { A: '2 -3 1; 0 4 -5', B: '-2 3 -1; 0 -4 5', op: 'suma', paso: 0 } },
          { txt: 'Elemento neutro', tip: 'Sumar la matriz nula no cambia nada',
            set: { A: '7 -1; 2 0', B: '0 0; 0 0', op: 'suma', paso: 0 } },
          { txt: 'Dimensiones incompatibles', tip: 'Una 2×3 y una 3×2: el applet explica por qué no se puede',
            set: { A: '1 2 3; 4 5 6', B: '1 2; 3 4; 5 6', op: 'suma', paso: 0 } },
          { txt: 'Casi compatibles', tip: 'Mismas filas, distinto número de columnas',
            set: { A: '1 2 3; 4 5 6', B: '1 2; 3 4', op: 'suma', paso: 0 } },
          { txt: 'Matrices al azar', tip: 'Genera dos matrices 3×3 de enteros', set: {},
            extra: function (ctl) {
              var A = S.matAleatoria(3, 3, { min: -6, max: 6 });
              var B = S.matAleatoria(3, 3, { min: -6, max: 6 });
              ctl.A.value = S.matTxt(A); ctl.B.value = S.matTxt(B);
              ctl.op.value = 'suma'; ctl.paso.value = '0';
            } }
        ])
      ],
      safe(function (v) {
        var A = leeMat(v.A, 'la matriz A');
        var B = leeMat(v.B, 'la matriz B');
        var resta = v.op === 'resta';
        var signo = resta ? '\u2212' : '+';
        var signoTex = resta ? '-' : '+';

        if (A.f !== B.f || A.c !== B.c) {
          return avisoSuma(A, B, resta ? 'restar' : 'sumar');
        }

        var Cm = resta ? S.matResta(A, B) : S.matSuma(A, B);
        var n = A.f * A.c;
        var paso = Math.round(Number(v.paso) || 0);
        if (paso > n) paso = 0;
        var hayPaso = paso >= 1;
        var pi = hayPaso ? Math.floor((paso - 1) / A.c) : -1;
        var pj = hayPaso ? (paso - 1) % A.c : -1;

        /* --- figura --- */
        var cw = anchoCelda(3 * A.c);
        var mostrado = function (i, j) { return !hayPaso || (i * A.c + j) < paso; };
        var resalte = function (i, j) {
          if (!hayPaso) return null;
          if (i === pi && j === pj) return HI.celda;
          return mostrado(i, j) ? HI.ok : null;
        };
        var y0 = 120;
        var gA = dibujaMat(46, y0, A, { cw: cw, rotulo: 'A  (' + A.f + '\u00d7' + A.c + ')', fill: resalte });
        var xB = gA.x1 + 62;
        var gB = dibujaMat(xB, y0, B, { cw: cw, rotulo: 'B  (' + B.f + '\u00d7' + B.c + ')', fill: resalte });
        var xC = gB.x1 + 68;
        var gC = dibujaCeldas(xC, y0, Cm.f, Cm.c, function (i, j) {
          return mostrado(i, j) ? fracTxt(Cm.a[i][j]) : '?';
        }, {
          cw: cw,
          rotulo: (resta ? 'A \u2212 B' : 'A + B') + '  (' + Cm.f + '\u00d7' + Cm.c + ')',
          rotuloCol: COL.rojo,
          fill: function (i, j) {
            if (!hayPaso) return HI.ok;
            if (i === pi && j === pj) return HI.celda;
            return mostrado(i, j) ? HI.ok : HI.suave;
          }
        });
        var body = '';
        body += S.txt(40, 46, 'La suma y la resta se hacen elemento a elemento: cada casilla con la casilla del mismo lugar',
          { size: 17, weight: '700', anchor: 'start', fill: COL.azulOsc });
        body += S.txt(40, 72, 'Dimensiones: ' + A.f + '\u00d7' + A.c + '  y  ' + B.f + '\u00d7' + B.c +
          '  \u2192  resultado ' + Cm.f + '\u00d7' + Cm.c, { size: 17, weight: '600', anchor: 'start', fill: COL.gris });
        body += gA.svg + gB.svg + gC.svg;
        body += operador((gA.x1 + xB) / 2, y0 + gA.H / 2, signo);
        body += operador((gB.x1 + xC) / 2, y0 + gA.H / 2, '=');
        var yPie = y0 + gA.H + 62;
        if (hayPaso) {
          var a = A.a[pi][pj], b = B.a[pi][pj], c2 = Cm.a[pi][pj];
          body += S.txt(40, yPie, 'Paso ' + paso + ' de ' + n + ' \u2192 casilla de la fila ' + (pi + 1) +
            ' y la columna ' + (pj + 1) + ':', { size: 18, weight: '700', anchor: 'start', fill: COL.rojo });
          body += S.txt(40, yPie + 30, fracTxtP(a) + ' ' + signo + ' ' + fracTxtP(b) + ' = ' + fracTxt(c2),
            { size: 24, weight: '700', anchor: 'start', fill: COL.texto });
          /* enlaces de color entre las tres casillas del mismo lugar */
          var yy = gA.cy(pi);
          body += S.line(gA.cx(pj) + cw / 2 - 6, yy, gB.cx(pj) - cw / 2 + 6, yy, COL.rojo, 2.4, '6 5');
          body += S.line(gB.cx(pj) + cw / 2 - 6, yy, gC.cx(pj) - cw / 2 + 6, yy, COL.rojo, 2.4, '6 5');
        } else {
          body += S.txt(40, yPie, 'Deslizador «paso» en 0: se ve el resultado completo. Muévelo para verlo casilla a casilla.',
            { size: 17, weight: '600', anchor: 'start', fill: COL.gris });
        }
        var W = gC.x1 + 46, H = yPie + 60;

        var cap = 'Elemento a elemento: ' +
          K('c_{ij} = a_{ij} ' + signoTex + ' b_{ij}') + ', con ' + K('1 \\le i \\le ' + A.f) +
          ' y ' + K('1 \\le j \\le ' + A.c) + '.';
        var h = figura(body, W, H, 'Suma de matrices elemento a elemento', cap);

        /* --- desarrollo en LaTeX --- */
        h += KD(S.matTex(A) + signoTex + S.matTex(B) + '=' + S.matTex(Cm));

        /* --- tabla de todas las casillas --- */
        var filas = [], i, j;
        for (i = 0; i < A.f; i++) {
          for (j = 0; j < A.c; j++) {
            var f2 = [
              K('c_{' + (i + 1) + (j + 1) + '}'),
              K(FT(A.a[i][j]) + signoTex + '\\left(' + FT(B.a[i][j]) + '\\right)'),
              K(FT(Cm.a[i][j]))
            ];
            f2.clase = (hayPaso && i === pi && j === pj) ? 'mtxb-ok' : '';
            filas.push(f2);
          }
        }
        h += titulillo('Las ' + n + ' cuentas, una por casilla');
        h += S.tabla(['casilla', 'operación', 'resultado'], filas);

        /* --- comentario didáctico --- */
        if (S.esNula(Cm)) {
          h += parrafo(S.badge('resultado: la matriz nula', 'info') +
            ' Todos los elementos se han anulado dos a dos: la segunda matriz es la ' +
            '<strong>opuesta</strong> de la primera, $B = -A$, y por eso $A + (-A) = 0$.');
        }
        if (!resta && S.esNula(B)) {
          h += parrafo(S.badge('elemento neutro', 'si') +
            ' Has sumado la <strong>matriz nula</strong> de dimensión ' + S.dimTxt(B) +
            ': el resultado es $A$ otra vez. Por eso se dice que la matriz nula es el elemento ' +
            'neutro de la suma en el conjunto de las matrices de esa dimensión.');
        }
        h += parrafo('Fíjate en que el resultado tiene <strong>la misma dimensión</strong> que los dos ' +
          'sumandos: la suma nunca cambia el tamaño de la matriz. Y que la resta es simplemente ' +
          '$A - B = A + (-B)$, es decir, sumar la opuesta de $B$.');
        return h;
      }));
  };

  /* ==================================================================
     3 · applet «propSuma» · Propiedades de la suma
     ================================================================== */
  R.propSuma = function (node) {
    S.shell(node, 'Propiedades de la suma de matrices',
      'Escribe tres matrices <strong>de la misma dimensión</strong>, por filas y separando las filas con ' +
      '«;»: por ejemplo $A$ = <code>1 2; 3 4</code>, $B$ = <code>0 -1; 5 2</code> y ' +
      '$C$ = <code>2 2; -1 0</code>. También valen fracciones (<code>1/2 3; 0 -2</code>). ' +
      'Elige la propiedad que quieras comprobar y el applet hace las <strong>dos cuentas en paralelo</strong> ' +
      'y compara los resultados casilla por casilla. Con el botón «Matrices al azar» se generan tres ' +
      'matrices nuevas para volver a comprobarlo.',
      [
        { id: 'A', type: 'textarea', label: 'Matriz A', rows: 3, value: '1 2; 3 4', ancho: '210px' },
        { id: 'B', type: 'textarea', label: 'Matriz B', rows: 3, value: '0 -1; 5 2', ancho: '210px' },
        { id: 'C', type: 'textarea', label: 'Matriz C', rows: 3, value: '2 2; -1 0', ancho: '210px' },
        { id: 'prop', type: 'select', label: 'Propiedad', value: 'conmutativa', options: [
          { value: 'conmutativa', label: 'Conmutativa: A + B = B + A' },
          { value: 'asociativa', label: 'Asociativa: (A + B) + C = A + (B + C)' },
          { value: 'neutro', label: 'Elemento neutro: A + 0 = A' },
          { value: 'opuesta', label: 'Matriz opuesta: A + (−A) = 0' },
          { value: 'todas', label: 'Las cuatro a la vez' }
        ] },
        chips([
          { txt: 'Conmutativa', tip: 'A + B = B + A', set: { prop: 'conmutativa', A: '1 2; 3 4', B: '0 -1; 5 2', C: '2 2; -1 0' } },
          { txt: 'Asociativa', tip: '(A + B) + C = A + (B + C)', set: { prop: 'asociativa', A: '1 2; 3 4', B: '0 -1; 5 2', C: '2 2; -1 0' } },
          { txt: 'Elemento neutro', tip: 'La matriz nula no cambia nada', set: { prop: 'neutro', A: '3 -2; 0 5', B: '0 0; 0 0', C: '1 1; 1 1' } },
          { txt: 'Matriz opuesta', tip: 'A + (−A) = 0', set: { prop: 'opuesta', A: '3 -2; 0 5', B: '-3 2; 0 -5', C: '1 1; 1 1' } },
          { txt: 'Las cuatro juntas', tip: 'Resumen de las cuatro propiedades', set: { prop: 'todas', A: '1 2; 3 4', B: '0 -1; 5 2', C: '2 2; -1 0' } },
          { txt: 'Rectangulares 2×3', tip: 'Las propiedades no son cosa de las cuadradas',
            set: { prop: 'todas', A: '1 0 2; -3 4 1', B: '2 -1 0; 5 5 -2', C: '0 3 -1; 1 -1 4' } },
          { txt: 'Con fracciones', tip: 'La aritmética exacta también respeta las propiedades',
            set: { prop: 'asociativa', A: '1/2 1/3; 1/4 2', B: '1/6 1/3; 3/4 -1', C: '1/3 1; -1/2 1/5' } },
          { txt: 'Matrices al azar', tip: 'Tres matrices 3×3 nuevas', set: {},
            extra: function (ctl) {
              ctl.A.value = S.matTxt(S.matAleatoria(3, 3, { min: -5, max: 5 }));
              ctl.B.value = S.matTxt(S.matAleatoria(3, 3, { min: -5, max: 5 }));
              ctl.C.value = S.matTxt(S.matAleatoria(3, 3, { min: -5, max: 5 }));
            } }
        ])
      ],
      safe(function (v) {
        var A = leeMat(v.A, 'la matriz A');
        var B = leeMat(v.B, 'la matriz B');
        var C = leeMat(v.C, 'la matriz C');
        if (A.f !== B.f || A.c !== B.c) return avisoSuma(A, B);
        var necesitaC = (v.prop === 'asociativa' || v.prop === 'todas');
        if (necesitaC && (A.f !== C.f || A.c !== C.c)) return avisoSuma(A, C);

        var O = S.matNula(A.f, A.c);
        var mA = S.opuesta(A);
        var h = parrafo('Las tres matrices son de dimensión <strong>' + S.dimTxt(A) + '</strong>, así que ' +
          'todas las sumas que aparecen existen y todas dan matrices de esa misma dimensión.');

        var lista = (v.prop === 'todas')
          ? ['conmutativa', 'asociativa', 'neutro', 'opuesta']
          : [v.prop];

        var figuras = 0;
        lista.forEach(function (p) {
          var izq, der, nomI, nomD, tex, titulo, comento;
          if (p === 'conmutativa') {
            izq = S.matSuma(A, B); der = S.matSuma(B, A);
            nomI = 'A + B'; nomD = 'B + A';
            tex = 'A + B = B + A';
            titulo = 'Propiedad conmutativa';
            comento = 'Sumar es sumar casilla por casilla, y en cada casilla se suman dos <em>números</em>: ' +
              'como la suma de números sí es conmutativa, la de matrices también lo es. ' +
              'Cuidado: esto <strong>no</strong> pasará con el producto de matrices.';
          } else if (p === 'asociativa') {
            izq = S.matSuma(S.matSuma(A, B), C); der = S.matSuma(A, S.matSuma(B, C));
            nomI = '(A + B) + C'; nomD = 'A + (B + C)';
            tex = '(A + B) + C = A + (B + C)';
            titulo = 'Propiedad asociativa';
            comento = 'Da igual por dónde empieces a agrupar. Gracias a esta propiedad se puede escribir ' +
              '$A + B + C$ <em>sin paréntesis</em>, porque no hay ambigüedad.';
          } else if (p === 'neutro') {
            izq = S.matSuma(A, O); der = A;
            nomI = 'A + 0'; nomD = 'A';
            tex = 'A + 0 = 0 + A = A';
            titulo = 'Elemento neutro: la matriz nula';
            comento = 'La matriz nula de dimensión ' + S.dimTxt(A) + ' hace en las matrices el mismo papel ' +
              'que el número 0 en los números. Ojo: hay <strong>una matriz nula por cada dimensión</strong>.';
          } else {
            izq = S.matSuma(A, mA); der = O;
            nomI = 'A + (−A)'; nomD = 'matriz nula 0';
            tex = 'A + (-A) = 0';
            titulo = 'Matriz opuesta';
            comento = 'La opuesta $-A$ se obtiene cambiando de signo <em>todos</em> los elementos. ' +
              'Que exista opuesta es lo que permite definir la resta: $A - B = A + (-B)$.';
          }
          var cmp = comparaMatrices(nomI, izq, nomD, der);
          h += '<div class="mtxb-prop">';
          h += titulillo(titulo + ' &nbsp; ' + K(tex));
          h += cmp.html;
          h += parrafo(cmp.iguales
            ? S.badge('se cumple', 'si') + ' Las dos matrices coinciden en las ' + (izq.f * izq.c) +
              ' casillas, una por una.'
            : S.badge('no coinciden', 'no') + ' Difieren en ' + K(posTex(cmp.dif)) + '.');
          h += parrafo(comento);
          h += '</div>';

          /* Una figura grande con las dos cuentas en paralelo, solo para
             la primera propiedad de la lista: así el applet no se vuelve
             interminable cuando se piden las cuatro. */
          if (figuras === 0) {
            figuras++;
            var cw = anchoCelda(2 * izq.c + 2);
            var dif = {};
            cmp.dif.forEach(function (q) { dif[q[0] + '-' + q[1]] = true; });
            var pinta = function (i, j) { return dif[i + '-' + j] ? HI.dif : HI.ok; };
            var g1 = dibujaMat(60, 130, izq, { cw: cw, rotulo: nomI, fill: pinta });
            var xx = g1.x1 + 90;
            var g2 = dibujaMat(xx, 130, der, { cw: cw, rotulo: nomD, fill: pinta, rotuloCol: COL.verde });
            var body = S.txt(40, 52, titulo + ': las dos cuentas, en paralelo',
              { size: 19, weight: '700', anchor: 'start', fill: COL.azulOsc });
            body += S.txt(40, 80, cmp.iguales
              ? 'Los dos caminos llevan exactamente a la misma matriz.'
              : 'Los dos caminos NO llevan a la misma matriz: mira las casillas marcadas.',
              { size: 17, weight: '600', anchor: 'start', fill: cmp.iguales ? COL.verde : COL.rojo });
            body += g1.svg + g2.svg;
            body += operador((g1.x1 + xx) / 2, 130 + g1.H / 2, cmp.iguales ? '=' : '\u2260');
            h += figura(body, g2.x1 + 60, 130 + g1.H + 90, titulo,
              'Comprobación con matrices concretas: ' + K(tex) + '.');
          }
        });

        if (v.prop === 'todas') {
          h += titulillo('Resumen');
          h += parrafo('Con estas cuatro propiedades —conmutativa, asociativa, elemento neutro y ' +
            'elemento opuesto— el conjunto de las matrices de dimensión ' + S.dimTxt(A) +
            ' con la suma tiene exactamente la misma estructura que los números enteros con la suma. ' +
            'Es lo que en cursos posteriores se llama <em>grupo conmutativo</em>. Lo importante ahora es ' +
            'que puedes operar con matrices con la misma confianza con la que operas con números, ' +
            '<strong>siempre que solo sumes y restes</strong>.');
        }
        return h;
      }));
  };

  /* ==================================================================
     4 · applet «escalar» · Producto de una matriz por un número
     ================================================================== */
  R.escalar = function (node) {
    S.shell(node, 'Producto de una matriz por un número',
      'Escribe la matriz $A$ por filas (<code>1 2 3; 4 5 6</code>; también valen fracciones como ' +
      '<code>1/2 3; 0 -2</code>) y mueve el deslizador de $k$: avanza de <strong>0,25 en 0,25</strong>, ' +
      'así que puedes probar valores negativos y fraccionarios. En la figura verás dentro de cada casilla ' +
      'la cuenta $k\\cdot a_{ij}$ y su resultado. Con el selector de propiedad y la matriz $B$ ' +
      '(<code>0 -1 2; 3 3 -4</code>) y el segundo número $h$ se comprueban $k(A+B)=kA+kB$, ' +
      '$(k+h)A=kA+hA$ y $k(hA)=(kh)A$.',
      [
        { id: 'A', type: 'textarea', label: 'Matriz A', rows: 3, value: '1 2 3; 4 5 6', ancho: '240px' },
        { id: 'k', type: 'range', label: 'Número k', min: -4, max: 4, step: 0.25, value: 2 },
        { id: 'prop', type: 'select', label: 'Comprobar', value: 'ninguna', options: [
          { value: 'ninguna', label: 'Solo el producto kA' },
          { value: 'distrib1', label: 'k(A + B) = kA + kB' },
          { value: 'distrib2', label: '(k + h)A = kA + hA' },
          { value: 'asoc', label: 'k(hA) = (kh)A' }
        ] },
        { id: 'B', type: 'textarea', label: 'Matriz B', rows: 3, value: '0 -1 2; 3 3 -4', ancho: '240px' },
        { id: 'h', type: 'range', label: 'Número h', min: -4, max: 4, step: 0.25, value: -1 },
        chips([
          { txt: 'k = 3 (agranda)', tip: 'Multiplicar por un entero positivo', set: { A: '1 2 3; 4 5 6', k: 3, prop: 'ninguna' } },
          { txt: 'k = −1 (matriz opuesta)', tip: 'Multiplicar por −1 da la opuesta de A', set: { A: '1 2 3; 4 5 6', k: -1, prop: 'ninguna' } },
          { txt: 'k = 0 (matriz nula)', tip: 'Multiplicar por 0 aplasta la matriz a la nula', set: { A: '1 2 3; 4 5 6', k: 0, prop: 'ninguna' } },
          { txt: 'k = 1/2', tip: 'Un escalar fraccionario: cada elemento se divide entre 2', set: { A: '2 4 6; 8 -10 0', k: 0.5, prop: 'ninguna' } },
          { txt: 'Sacar factor común', tip: 'Todos los elementos son múltiplos de 3', set: { A: '3 -6 9; 12 0 -3', k: 0.25, prop: 'ninguna' } },
          { txt: 'Distributiva k(A+B)', tip: 'k(A + B) = kA + kB', set: { A: '1 2 3; 4 5 6', B: '0 -1 2; 3 3 -4', k: 2, prop: 'distrib1' } },
          { txt: 'Distributiva (k+h)A', tip: '(k + h)A = kA + hA', set: { A: '1 2 3; 4 5 6', k: 3, h: -1, prop: 'distrib2' } },
          { txt: 'Asociativa k(hA)', tip: 'k(hA) = (kh)A', set: { A: '1 2 3; 4 5 6', k: 2, h: 0.5, prop: 'asoc' } }
        ])
      ],
      safe(function (v) {
        var A = leeMat(v.A, 'la matriz A');
        var k = FR(String(v.k));
        var hh = FR(String(v.h));
        var kA = S.matEscalar(A, k);

        /* --- figura: A, el número k y kA con la cuenta dentro --- */
        var cw = anchoCelda(2 * A.c + 2);
        var y0 = 130;
        var gA = dibujaMat(56, y0, A, { cw: cw, rotulo: 'A  (' + S.dimTxt(A) + ')' });
        var xR = gA.x1 + 150;
        var gR = dibujaCeldas(xR, y0, A.f, A.c, function (i, j) {
          return fracTxt(kA.a[i][j]);
        }, {
          cw: Math.max(cw, 100), ch: 66,
          rotulo: 'k \u00b7 A', rotuloCol: COL.rojo,
          fill: function () { return cero(k) ? HI.suave : HI.ok; },
          sub: function (i, j) { return fracTxtP(k) + ' \u00b7 ' + fracTxtP(A.a[i][j]); }
        });
        var body = S.txt(40, 48, 'Multiplicar una matriz por un número: se multiplican TODOS los elementos, uno por uno',
          { size: 18, weight: '700', anchor: 'start', fill: COL.azulOsc });
        body += S.txt(40, 76, 'k = ' + fracTxt(k) + '   (la dimensión no cambia: sigue siendo ' + S.dimTxt(A) + ')',
          { size: 18, weight: '700', anchor: 'start', fill: COL.rojo });
        body += gA.svg + gR.svg;
        /* El escalar y el punto de multiplicar iban en DOS <text>
           apilados (el número arriba y el «·» debajo), que se pisaban y
           daban la impresión de un símbolo roto. Ahora es una sola
           línea, «2 ·», con el mismo cuerpo de 30 px. */
        body += S.txt((gA.x1 + xR) / 2, y0 + gA.H / 2 + 10, fracTxt(k) + ' \u00b7',
          { size: 30, weight: '700', fill: COL.rojo });
        var W = gR.x1 + 56, H = y0 + Math.max(gA.H, gR.H) + 90;
        body += S.txt(40, H - 34, cero(k)
          ? 'Con k = 0 todos los productos valen 0: el resultado es la matriz nula.'
          : 'Cada casilla de la derecha muestra la cuenta y, encima, su resultado.',
          { size: 17, weight: '600', anchor: 'start', fill: COL.gris });

        var h = figura(body, W, H, 'Producto de una matriz por un número',
          'Definición: ' + K('k\\cdot A = k\\cdot (a_{ij}) = (k\\, a_{ij})') + '. ' +
          'El número $k$ se llama <em>escalar</em>.');

        h += KD(FT(k) + '\\cdot' + S.matTex(A) + '=' + S.matTex(kA));

        /* --- comentarios según el valor de k --- */
        if (cero(k)) {
          h += parrafo(S.badge('k = 0', 'info') + ' El resultado es la <strong>matriz nula</strong> de ' +
            S.dimTxt(A) + '. Fíjate en el aviso importante: $k\\cdot A = 0$ puede ocurrir porque $k=0$ ' +
            '<em>o</em> porque $A$ sea la matriz nula. No hay más posibilidades.');
        } else if (igF(k, new Frac(1))) {
          h += parrafo(S.badge('k = 1', 'si') + ' Multiplicar por 1 deja la matriz igual: el número 1 es el ' +
            'elemento neutro de este producto.');
        } else if (igF(k, new Frac(-1))) {
          h += parrafo(S.badge('k = −1', 'info') + ' El resultado es la <strong>matriz opuesta</strong> $-A$: ' +
            'multiplicar por $-1$ es exactamente cambiar de signo todos los elementos.');
        } else if (negF(k)) {
          h += parrafo('Con $k$ negativo todos los elementos cambian de signo <em>además</em> de cambiar de ' +
            'tamaño. Compruébalo casilla por casilla en la figura.');
        }

        /* --- propiedad elegida --- */
        if (v.prop !== 'ninguna') {
          var izq, der, tex, titulo, coment;
          if (v.prop === 'distrib1') {
            var B = leeMat(v.B, 'la matriz B');
            if (A.f !== B.f || A.c !== B.c) return h + avisoSuma(A, B);
            izq = S.matEscalar(S.matSuma(A, B), k);
            der = S.matSuma(S.matEscalar(A, k), S.matEscalar(B, k));
            tex = 'k\\,(A + B) = k\\,A + k\\,B';
            titulo = 'Distributiva respecto de la suma de matrices';
            coment = 'Da igual sumar primero y multiplicar después, o multiplicar cada matriz por $k$ y ' +
              'sumar luego. Es la propiedad que permite «sacar factor común» un número de una suma de matrices.';
          } else if (v.prop === 'distrib2') {
            izq = S.matEscalar(A, k.mas(hh));
            der = S.matSuma(S.matEscalar(A, k), S.matEscalar(A, hh));
            tex = '(k + h)\\,A = k\\,A + h\\,A';
            titulo = 'Distributiva respecto de la suma de números';
            coment = 'Aquí lo que se reparte es el <em>número</em>: $k + h = ' + fracTxt(k) + ' + ' +
              fracTxt(hh) + ' = ' + fracTxt(k.mas(hh)) + '$. Es la misma idea que $ (3+2)\\cdot x = 3x + 2x$.';
          } else {
            izq = S.matEscalar(S.matEscalar(A, hh), k);
            der = S.matEscalar(A, k.por(hh));
            tex = 'k\\,(h\\,A) = (k\\,h)\\,A';
            titulo = 'Asociativa mixta';
            coment = 'Multiplicar dos veces seguidas por números es lo mismo que multiplicar una sola vez ' +
              'por el producto de esos números: $k\\cdot h = ' + fracTxt(k) + ' \\cdot ' + fracTxt(hh) +
              ' = ' + fracTxt(k.por(hh)) + '$.';
          }
          var cmp = comparaMatrices('primer miembro', izq, 'segundo miembro', der);
          h += titulillo(titulo + ' &nbsp; ' + K(tex));
          h += cmp.html;
          h += parrafo((cmp.iguales ? S.badge('se cumple', 'si') : S.badge('no coinciden', 'no')) +
            ' ' + coment);
        }
        return h;
      }));
  };

  /* ==================================================================
     5 · applet «combinaLineal» · Combinaciones lineales de matrices
     ================================================================== */
  R.combinaLineal = function (node) {
    S.shell(node, 'Combinaciones lineales de matrices',
      'Una <strong>combinación lineal</strong> de $A$ y $B$ es cualquier matriz de la forma ' +
      '$\\alpha A + \\beta B$. Escribe las dos matrices por filas —por ejemplo $A$ = <code>1 0; 0 1</code> ' +
      'y $B$ = <code>0 1; 1 0</code>— y mueve los dos deslizadores: $\\alpha$ y $\\beta$ van de ' +
      '<strong>0,5 en 0,5</strong> entre $-4$ y $4$. En «matriz objetivo» puedes escribir la matriz que ' +
      'quieres alcanzar (<code>2 3; 3 2</code>) y el applet te dice si la combinación actual la consigue ' +
      'y en qué casillas falla. Déjalo vacío si no quieres objetivo.',
      [
        { id: 'A', type: 'textarea', label: 'Matriz A', rows: 3, value: '1 0; 0 1', ancho: '210px' },
        { id: 'B', type: 'textarea', label: 'Matriz B', rows: 3, value: '0 1; 1 0', ancho: '210px' },
        { id: 'al', type: 'range', label: 'α (coeficiente de A)', min: -4, max: 4, step: 0.5, value: 2 },
        { id: 'be', type: 'range', label: 'β (coeficiente de B)', min: -4, max: 4, step: 0.5, value: 3 },
        { id: 'obj', type: 'textarea', label: 'Matriz objetivo (opcional)', rows: 3, value: '2 3; 3 2', ancho: '210px' },
        chips([
          { txt: 'Objetivo alcanzado', tip: '2A + 3B da justo la matriz objetivo',
            set: { A: '1 0; 0 1', B: '0 1; 1 0', al: 2, be: 3, obj: '2 3; 3 2' } },
          { txt: 'Anular la combinación', tip: 'Con B = −A basta con β = α para obtener la nula',
            set: { A: '1 2; 3 4', B: '-1 -2; -3 -4', al: 1, be: 1, obj: '0 0; 0 0' } },
          { txt: 'Punto medio (1/2, 1/2)', tip: 'La media aritmética de A y B',
            set: { A: '2 4; 6 8', B: '0 -2; 4 2', al: 0.5, be: 0.5, obj: '1 1; 5 5' } },
          { txt: 'Solo A (β = 0)', tip: 'Una combinación lineal puede usar una sola matriz',
            set: { A: '1 2; 3 4', B: '0 1; 1 0', al: 3, be: 0, obj: '3 6; 9 12' } },
          { txt: 'Combinación nula trivial', tip: 'α = β = 0 siempre da la matriz nula',
            set: { A: '1 2; 3 4', B: '5 -1; 0 2', al: 0, be: 0, obj: '0 0; 0 0' } },
          { txt: 'Rectangulares 2×3', tip: 'Las combinaciones lineales no necesitan matrices cuadradas',
            set: { A: '1 0 2; -1 3 1', B: '2 1 0; 0 -1 4', al: 1, be: -2, obj: '-3 -2 2; -1 5 -7' } },
          { txt: 'Dimensiones incompatibles', tip: 'Si A y B no tienen la misma dimensión no hay combinación',
            set: { A: '1 2; 3 4', B: '1 2 3; 4 5 6', al: 1, be: 1, obj: '' } },
          { txt: 'Matrices al azar', tip: 'Dos matrices 2×2 nuevas', set: {},
            extra: function (ctl) {
              ctl.A.value = S.matTxt(S.matAleatoria(2, 2, { min: -4, max: 4 }));
              ctl.B.value = S.matTxt(S.matAleatoria(2, 2, { min: -4, max: 4 }));
              ctl.obj.value = '';
            } }
        ])
      ],
      safe(function (v) {
        var A = leeMat(v.A, 'la matriz A');
        var B = leeMat(v.B, 'la matriz B');
        if (A.f !== B.f || A.c !== B.c) return avisoSuma(A, B, 'combinar linealmente');
        var al = FR(String(v.al)), be = FR(String(v.be));
        var aA = S.matEscalar(A, al), bB = S.matEscalar(B, be);
        var Rm = S.matCombina(al, A, be, B);

        var objTxt = String(v.obj === undefined || v.obj === null ? '' : v.obj).trim();
        var Obj = null, dif = null, alcanzado = false;
        if (objTxt !== '') {
          Obj = leeMat(objTxt, 'la matriz objetivo');
          if (Obj.f === Rm.f && Obj.c === Rm.c) {
            dif = S.difIguales(Rm, Obj);
            alcanzado = dif.length === 0;
          }
        }

        /* --- figura: αA + βB = R --- */
        var cw = anchoCelda(3 * A.c + 3);
        /* y0 = 140 dejaba el rótulo «α · A = …» (que se pinta en y0 − 13)
           tocando la línea «Dimensión de todas las matrices» (y = 104). */
        var y0 = 150;
        var g1 = dibujaMat(46, y0, aA, { cw: cw, rotulo: '\u03b1 \u00b7 A  =  ' + fracTxt(al) + ' \u00b7 A' });
        var x2 = g1.x1 + 66;
        var g2 = dibujaMat(x2, y0, bB, { cw: cw, rotulo: '\u03b2 \u00b7 B  =  ' + fracTxt(be) + ' \u00b7 B' });
        var x3 = g2.x1 + 72;
        var difMap = {};
        if (dif) dif.forEach(function (p) { difMap[p[0] + '-' + p[1]] = true; });
        var g3 = dibujaMat(x3, y0, Rm, {
          cw: cw, rotulo: '\u03b1A + \u03b2B', rotuloCol: COL.rojo,
          fill: function (i, j) {
            if (!dif) return HI.ok;
            return difMap[i + '-' + j] ? HI.dif : HI.ok;
          }
        });
        var body = S.txt(40, 48, 'Combinación lineal: se estira cada matriz con su coeficiente y luego se suman',
          { size: 18, weight: '700', anchor: 'start', fill: COL.azulOsc });
        body += S.txt(40, 78, '\u03b1 = ' + fracTxt(al) + '        \u03b2 = ' + fracTxt(be),
          { size: 20, weight: '700', anchor: 'start', fill: COL.rojo });
        body += S.txt(40, 104, 'Dimensión de todas las matrices: ' + S.dimTxt(A),
          { size: 16, weight: '600', anchor: 'start', fill: COL.gris });
        body += g1.svg + g2.svg + g3.svg;
        body += operador((g1.x1 + x2) / 2, y0 + g1.H / 2, '+');
        body += operador((g2.x1 + x3) / 2, y0 + g1.H / 2, '=');
        var yPie = y0 + g1.H + 56;
        /* El pie iba en un solo <text> y se salía del lienzo (~33 px).
           Ahora se parte en líneas y el lienzo se ensancha si hace falta,
           sin tocar el cuerpo de letra (18 px en negrita). */
        var pieTxt, pieSize = 18, pieCol = COL.gris, pieW = '700';
        if (Obj && Obj.f === Rm.f && Obj.c === Rm.c) {
          pieTxt = alcanzado
            ? 'Objetivo ALCANZADO: la combinación coincide con la matriz objetivo en todas las casillas.'
            : 'Todavía no: fallan ' + dif.length + ' casilla' + (dif.length === 1 ? '' : 's') +
              ' (marcadas en rojo). Mueve los deslizadores.';
          pieCol = alcanzado ? COL.verde : COL.rojo;
        } else if (S.esNula(Rm)) {
          pieTxt = 'La combinación se ha ANULADO: el resultado es la matriz nula.';
          pieCol = COL.verde;
        } else {
          pieTxt = 'Mueve los deslizadores y observa cómo cambia cada casilla del resultado.';
          pieSize = 17; pieW = '600';
        }
        var pieL = parteTxt(pieTxt, 62);
        body += txtLineas(40, yPie, pieL,
          { size: pieSize, weight: pieW, anchor: 'start', fill: pieCol }, 26);
        var h = figura(body,
          Math.max(g3.x1 + 46, 40 + anchoLineas(pieL, pieSize) + 40),
          yPie + 60 + (pieL.length - 1) * 26, 'Combinación lineal de dos matrices',
          'La combinación lineal es ' + K('\\alpha A + \\beta B') + ', con ' +
          K('\\alpha = ' + FT(al)) + ' y ' + K('\\beta = ' + FT(be)) + '.');

        h += KD(FT(al) + '\\cdot' + S.matTex(A) + '+' + FT(be) + '\\cdot' + S.matTex(B) + '=' + S.matTex(Rm));

        /* --- lectura del resultado --- */
        if (S.esNula(Rm)) {
          var trivial = cero(al) && cero(be);
          h += parrafo(S.badge('combinación nula', trivial ? 'info' : 'si') + ' ' + (trivial
            ? 'Con $\\alpha = 0$ y $\\beta = 0$ el resultado es la matriz nula, pero eso pasa siempre: ' +
              'es la <strong>combinación trivial</strong> y no dice nada sobre $A$ y $B$.'
            : 'Se ha conseguido $\\alpha A + \\beta B = 0$ con coeficientes <strong>no</strong> nulos. ' +
              'Eso significa que una de las dos matrices es múltiplo de la otra: son ' +
              '<em>linealmente dependientes</em>. En este caso ' +
              (cero(be) ? '$A$ es la matriz nula' : '$A = ' + FT(be.opuesto().entre(cero(al) ? F1() : al)) + 'B$') + '.'));
        }
        if (Obj) {
          if (Obj.f !== Rm.f || Obj.c !== Rm.c) {
            h += parrafo(S.badge('objetivo imposible', 'no') + ' La matriz objetivo es de ' +
              S.dimTxt(Obj) + ' y la combinación siempre sale de ' + S.dimTxt(Rm) +
              ': por muchos valores que pruebes, nunca coincidirán. Cambia el objetivo a una matriz de ' +
              S.dimTxt(Rm) + '.');
          } else if (alcanzado) {
            h += parrafo(S.badge('objetivo alcanzado', 'si') + ' Con $\\alpha = ' + FT(al) + '$ y $\\beta = ' +
              FT(be) + '$ se obtiene exactamente la matriz objetivo. Cuando esto ocurre se dice que ' +
              'la matriz objetivo <strong>es combinación lineal</strong> de $A$ y $B$.');
          } else {
            h += parrafo(S.badge('todavía no', 'no') + ' La combinación actual y el objetivo difieren en ' +
              K(posTex(dif)) + '. Prueba a mover primero $\\alpha$ mirando solo una de esas casillas.');
            h += comparaMatrices(K('\\alpha A + \\beta B'), Rm, 'objetivo', Obj).html;
          }
        }
        h += parrafo('Observa una idea que reaparecerá en el apartado del rango: todas las matrices que ' +
          'se pueden escribir como $\\alpha A + \\beta B$ forman una familia; averiguar si una matriz ' +
          'concreta pertenece a esa familia es resolver un sistema de ecuaciones con incógnitas ' +
          '$\\alpha$ y $\\beta$, una ecuación por casilla.');
        return h;
      }));
  };

  /* ==================================================================
     6 · applet «filaColumna» · Producto de una fila por una columna
     ================================================================== */
  R.filaColumna = function (node) {
    S.shell(node, 'Producto de una matriz fila por una matriz columna',
      'Escribe la <strong>fila</strong> con sus elementos separados por espacios: <code>2 -1 3</code>. ' +
      'Escribe la <strong>columna</strong> también con espacios o separando las filas con «;»: ' +
      '<code>4 5 -2</code> o <code>4; 5; -2</code>; las dos formas valen. Se admiten fracciones ' +
      '(<code>1/2 3 -1/4</code>). Mueve el deslizador <em>paso</em> para ir emparejando los términos ' +
      'de uno en uno: paso 0 muestra todos los emparejamientos a la vez. Si las longitudes no coinciden, ' +
      'el applet te dice cuántos elementos sobran o faltan.',
      [
        { id: 'F', type: 'text', label: 'Fila (1×n)', value: '2 -1 3', place: '2 -1 3', ancho: '220px' },
        { id: 'C', type: 'text', label: 'Columna (n×1)', value: '4; 5; -2', place: '4; 5; -2', ancho: '220px' },
        { id: 'paso', type: 'range', label: 'Paso (0 = todo)', min: 0, max: 6, step: 1, value: 0 },
        chips([
          { txt: 'Caso básico 1×3 · 3×1', tip: 'Tres productos y una suma', set: { F: '2 -1 3', C: '4; 5; -2', paso: 0 } },
          { txt: 'Paso a paso', tip: 'Empieza por el primer emparejamiento', set: { F: '2 -1 3', C: '4; 5; -2', paso: 1 } },
          { txt: 'Resultado cero', tip: 'La suma de productos se anula sin que ningún factor sea 0', set: { F: '1 2 3', C: '3; 0; -1', paso: 0 } },
          { txt: 'Con fracciones', tip: 'Aritmética exacta con denominadores', set: { F: '1/2 2/3 -1', C: '4; 3; 1/2', paso: 0 } },
          { txt: 'Longitud 5', tip: 'El mismo mecanismo con cinco términos', set: { F: '1 -2 0 3 1', C: '2; 1; 7; -1; 4', paso: 0 } },
          { txt: 'Precios × cantidades', tip: 'La interpretación económica del producto fila por columna', set: { F: '3 5 2', C: '10; 4; 6', paso: 0 } },
          { txt: 'Longitudes distintas', tip: 'Una fila de 3 y una columna de 2: imposible', set: { F: '2 -1 3', C: '4; 5', paso: 0 } }
        ])
      ],
      safe(function (v) {
        var fila = leeMat(v.F, 'la fila');
        var colm = leeMat(v.C, 'la columna');
        if (fila.f !== 1) {
          if (fila.c === 1) fila = S.matTrans(fila);
          else throw Error('La fila debe tener una sola fila ($1 \\times n$) y la que has escrito es de ' +
            S.dimTxt(fila) + '. Escribe sus elementos separados por espacios en una sola línea: 2 -1 3.');
        }
        if (colm.c !== 1) {
          if (colm.f === 1) colm = S.matTrans(colm);
          else throw Error('La columna debe tener una sola columna ($n \\times 1$) y la que has escrito es de ' +
            S.dimTxt(colm) + '. Escribe sus elementos separados por «;» o por espacios: 4; 5; -2.');
        }
        var n = fila.c, m = colm.f;

        if (n !== m) {
          var hb = '<div class="mtxb-imposible">';
          hb += '<p class="mtxb-imposible-tit">Estas dos matrices no se pueden multiplicar</p>';
          hb += parrafo('La fila es de <strong>1×' + n + '</strong> (tiene ' + n + ' elementos) y la columna ' +
            'es de <strong>' + m + '×1</strong> (tiene ' + m + ' elementos).');
          hb += parrafo('El producto de una fila por una columna consiste en <strong>emparejar</strong> el ' +
            'primer elemento de la fila con el primero de la columna, el segundo con el segundo, y así ' +
            'sucesivamente, multiplicar cada pareja y sumarlo todo. Con ' + n + ' y ' + m +
            ' elementos ese emparejamiento no se puede completar: ' +
            (n > m ? 'sobran ' + (n - m) + ' elemento' + (n - m === 1 ? '' : 's') + ' en la fila'
                   : 'sobran ' + (m - n) + ' elemento' + (m - n === 1 ? '' : 's') + ' en la columna') + '.');
          hb += parrafo('<strong>Qué haría falta:</strong> que la fila y la columna tengan el ' +
            '<em>mismo</em> número $n$ de elementos. Escribe ' +
            (n > m ? 'una columna con ' + n + ' elementos' : 'una fila con ' + m + ' elementos') +
            ' y el producto existirá; su resultado será siempre <strong>un solo número</strong> ' +
            '(una matriz $1\\times1$).');
          hb += KD('(1 \\times ' + n + ')\\cdot(' + m + ' \\times 1) \\quad\\Longrightarrow\\quad ' +
            n + ' \\ne ' + m + '\\ \\text{: no existe}');
          return hb + '</div>';
        }

        var fc = S.filaPorColumna(fila.a[0], colm.col(0));
        var paso = Math.round(Number(v.paso) || 0);
        if (paso > n) paso = 0;
        var activo = function (i) { return paso === 0 || i === (paso - 1); };
        var colorDe = function (i) { return PAL[i % PAL.length]; };
        var suaviza = function (col) { return col + '33'; };

        /* --- figura sin cruces: la columna a la izquierda, la fila
               arriba a la derecha; las líneas van hacia abajo y hacia la
               izquierda, y por construcción no se cortan entre sí. --- */
        /* Título en DOS líneas: en una sola se salía del lienzo por la
           derecha (~189 px). Se mantiene el cuerpo de 18 px en negrita.
           Se calcula ANTES que la figura porque el bloque de matrices
           tiene que empezar por debajo de la última línea del título. */
        var titFC = parteTxt('Producto fila por columna: se emparejan los t\u00e9rminos del mismo orden, ' +
          'se multiplican y se suman', 58);
        var yTit = 42, dyTit = 26, sizeTit = 18;
        /* Base de la última línea + su parte descendente. */
        var fondoTit = yTit + (titFC.length - 1) * dyTit + Math.ceil(sizeTit * 0.32);
        var cwF = anchoCelda(n + 2);
        /* El rótulo «fila F (1×n)» se pinta en yF − 13 con cuerpo 18, así
           que su borde superior está en yF − 26. Se exige un aire limpio
           de 24 px entre el final del título y ese borde. */
        var xF = 300, yF = Math.max(92, Math.round(fondoTit + 24 + 26));
        var gF = dibujaCeldas(xF, yF, 1, n, function (i, j) { return fracTxt(fila.a[0][j]); }, {
          cw: cwF, rotulo: 'fila F  (1\u00d7' + n + ')',
          fill: function (i, j) { return activo(j) ? suaviza(colorDe(j)) : null; }
        });
        var yC = yF + 130;
        var gC = dibujaCeldas(60, yC, n, 1, function (i) { return fracTxt(colm.a[i][0]); }, {
          cw: 110, ch: 60, rotulo: 'columna C  (' + n + '\u00d71)', rotuloCol: COL.verde,
          fill: function (i) { return activo(i) ? suaviza(colorDe(i)) : null; }
        });
        var body = txtLineas(40, yTit, titFC,
          { size: sizeTit, weight: '700', anchor: 'start', fill: COL.azulOsc }, dyTit);
        body += gF.svg + gC.svg;
        /* líneas de emparejamiento */
        var i;
        for (i = 0; i < n; i++) {
          if (!activo(i)) continue;
          var x1 = gF.cx(i), y1 = gF.y + gF.H - 2;
          var x2 = gC.x1 + 2, y2 = gC.cy(i);
          /* La curva baja MUY vertical al principio (punto de control a
             90 px, no a 46): así cada trazo se mantiene pegado a su
             columna durante los primeros píxeles y ya no roza el rótulo
             «a_i · b_i» de la pareja anterior. */
          body += S.path('M ' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + (y1 + 90) + ', ' +
            (x2 + 60) + ' ' + y2 + ', ' + x2 + ' ' + y2, colorDe(i), 3.2, 'none', paso === 0 ? '' : '');
          body += S.circle(x1, y1, 5, colorDe(i), '#ffffff', 1.6);
          body += S.circle(x2, y2, 5, colorDe(i), '#ffffff', 1.6);
          body += S.txt(x1 + 16, y1 + 28, 'a' + (i + 1) + ' \u00b7 b' + (i + 1),
            { size: 16, weight: '700', fill: colorDe(i), anchor: 'start' });
        }
        /* fichas de los productos, en línea, cada una de su color */
        var yP = Math.max(gC.y1, gF.y + gF.H) + 74;
        var bx = 60;
        for (i = 0; i < n; i++) {
          var texto = fracTxtP(fc.pasos[i].a) + ' \u00b7 ' + fracTxtP(fc.pasos[i].b) + ' = ' + fracTxt(fc.pasos[i].prod);
          var anc = Math.max(150, 14 * texto.length + 26);
          body += S.rect(bx, yP, anc, 46, activo(i) ? suaviza(colorDe(i)) : '#f6f8fa',
            colorDe(i), { r: 10, sw: activo(i) ? 2.4 : 1.2 });
          body += S.txt(bx + anc / 2, yP + 30, texto, { size: 19, weight: '700', fill: COL.texto });
          bx += anc + 18;
        }
        var yS = yP + 86;
        body += S.txt(60, yS, 'Suma de todos los productos:', { size: 17, weight: '700', anchor: 'start', fill: COL.gris });
        var sumaTxt = fc.pasos.map(function (p) { return fracTxtP(p.prod); }).join(' + ') + '  =  ' + fracTxt(fc.valor);
        body += S.txt(60, yS + 34, sumaTxt, { size: 24, weight: '700', anchor: 'start', fill: COL.rojo });
        /* El lienzo tiene que dar cabida también al título. */
        var W = Math.max(gF.x1 + 60, bx + 20, 780,
          40 + anchoLineas(titFC, 18) + 40, 60 + anchoTxt(sumaTxt, 24) + 40), H = yS + 64;

        var h = figura(body, W, H, 'Producto de una fila por una columna',
          'En s\u00edmbolos: ' + K('F\\cdot C = a_1b_1 + a_2b_2 + \\dots + a_' + n + 'b_' + n) +
          '. El resultado es una matriz ' + K('1\\times 1') + ', es decir, <strong>un número</strong>.');

        h += KD(S.matTex(fila) + '\\cdot' + S.matTex(colm) + '=' + fc.tex);

        /* --- tabla de los emparejamientos --- */
        var filasT = [];
        for (i = 0; i < n; i++) {
          var ft = [
            K('a_{' + (i + 1) + '}\\cdot b_{' + (i + 1) + '}'),
            K(FT(fc.pasos[i].a) + '\\cdot\\left(' + FT(fc.pasos[i].b) + '\\right)'),
            K(FT(fc.pasos[i].prod))
          ];
          ft.clase = activo(i) && paso !== 0 ? 'mtxb-ok' : '';
          filasT.push(ft);
        }
        filasT.push({ celdas: ['<strong>suma</strong>', '', '<strong>' + K(FT(fc.valor)) + '</strong>'], clase: 'mtxb-ok' });
        h += titulillo('Los ' + n + ' emparejamientos');
        h += S.tabla(['pareja', 'producto', 'valor'], filasT);

        if (paso >= 1) {
          h += parrafo(S.badge('paso ' + paso + ' de ' + n, 'info') +
            ' Ahora mismo solo está encendida la pareja número ' + paso +
            ': el elemento ' + K('a_{' + paso + '} = ' + FT(fc.pasos[paso - 1].a)) + ' de la fila y el elemento ' +
            K('b_{' + paso + '} = ' + FT(fc.pasos[paso - 1].b)) + ' de la columna. Sigue moviendo el deslizador.');
        }
        if (cero(fc.valor)) {
          var hayCero = fc.pasos.some(function (p) { return cero(p.a) || cero(p.b); });
          h += parrafo(S.badge('resultado 0', 'info') + ' El producto vale 0' +
            (hayCero ? '.' : ' <strong>aunque ningún factor es cero</strong>: los productos positivos y ' +
              'negativos se han compensado. Esta es la raíz de un fenómeno que verás en el producto de ' +
              'matrices: puede salir la matriz nula sin que ninguna de las dos matrices lo sea.'));
        }
        h += parrafo('Este cálculo es el <strong>ladrillo</strong> con el que se construye el producto de ' +
          'dos matrices: cada elemento $c_{ij}$ del producto es exactamente la fila $i$ de la primera ' +
          'multiplicada por la columna $j$ de la segunda, igual que aquí.');
        return h;
      }));
  };

  /* ==================================================================
     7 · applet «producto» · Producto de matrices paso a paso
     ================================================================== */
  R.producto = function (node) {
    S.shell(node, 'Producto de matrices paso a paso',
      'Escribe las dos matrices por filas, separando las filas con «;»: por ejemplo $A$ = ' +
      '<code>1 2 3; 4 5 6</code> y $B$ = <code>1 0; 0 1; 2 -1</code>. También valen fracciones ' +
      '(<code>1/2 3; 0 -2</code>). En el modo <em>celda a celda</em> eliges la fila $i$ y la columna $j$ ' +
      'con los dos selectores y el applet enciende <strong>la fila $i$ de $A$ y la columna $j$ de $B$</strong>, ' +
      'que son justo las que intervienen en $c_{ij}$; en el modo <em>automático</em> se calcula la matriz ' +
      'entera. Si las dimensiones no encajan, el applet explica por qué y qué haría falta.',
      [
        { id: 'A', type: 'textarea', label: 'Matriz A', rows: 3, value: '1 2 3; 4 5 6', ancho: '230px' },
        { id: 'B', type: 'textarea', label: 'Matriz B', rows: 3, value: '1 0; 0 1; 2 -1', ancho: '230px' },
        { id: 'modo', type: 'select', label: 'Modo', value: 'celda', options: [
          { value: 'celda', label: 'Celda a celda' }, { value: 'auto', label: 'Automático (matriz entera)' }
        ] },
        { id: 'i', type: 'number', label: 'Fila i', min: 1, max: 6, step: 1, value: 1 },
        { id: 'j', type: 'number', label: 'Columna j', min: 1, max: 6, step: 1, value: 1 },
        chips([
          { txt: '2×3 · 3×2', tip: 'El resultado es 2×2: se «pierden» las dimensiones interiores',
            set: { A: '1 2 3; 4 5 6', B: '1 0; 0 1; 2 -1', modo: 'celda', i: 1, j: 1 } },
          { txt: 'Elige c₂₂', tip: 'Fila 2 de A por columna 2 de B',
            set: { A: '1 2 3; 4 5 6', B: '1 0; 0 1; 2 -1', modo: 'celda', i: 2, j: 2 } },
          { txt: 'Matriz por vector 3×3 · 3×1', tip: 'El caso de los sistemas de ecuaciones',
            set: { A: '1 1 1; 2 -1 1; 1 2 -1', B: '6; 3; 4', modo: 'auto', i: 1, j: 1 } },
          { txt: 'Por la identidad', tip: 'A · I = A: la identidad es el elemento neutro',
            set: { A: '2 -1 0; 3 5 1', B: '1 0; 0 1; 0 0', modo: 'auto', i: 1, j: 1 } },
          { txt: 'Por la matriz nula', tip: 'A · 0 = 0, con la dimensión que corresponda',
            set: { A: '2 -1; 3 5', B: '0 0; 0 0', modo: 'auto', i: 1, j: 1 } },
          { txt: 'Cuadradas 3×3', tip: 'Nueve elementos, nueve productos fila por columna',
            set: { A: '1 2 0; 0 1 3; 2 0 1', B: '1 0 2; 3 1 0; 0 2 1', modo: 'auto', i: 1, j: 1 } },
          { txt: 'Incompatible 2×3 · 2×3', tip: 'Mismo tamaño, pero el producto no existe',
            set: { A: '1 2 3; 4 5 6', B: '1 0 1; 2 1 0', modo: 'auto', i: 1, j: 1 } },
          { txt: 'Columna por fila (1×3 · 3×1)', tip: 'Un producto que da una matriz 1×1',
            set: { A: '2 -1 3', B: '4; 5; -2', modo: 'auto', i: 1, j: 1 } }
        ])
      ],
      safe(function (v) {
        var A = leeMat(v.A, 'la matriz A');
        var B = leeMat(v.B, 'la matriz B');
        var pp = S.matProdPasos(A, B);

        if (!pp.compatible) return avisoProd(A, B);

        var P = pp.P;
        var celda = v.modo === 'celda';
        var i = Math.round(Number(v.i) || 1), j = Math.round(Number(v.j) || 1);
        var aviso = '';
        if (celda) {
          if (i < 1 || i > P.f) {
            aviso += parrafo(S.badge('fila fuera de rango', 'info') + ' El resultado tiene ' + P.f +
              ' fila' + (P.f === 1 ? '' : 's') + ', así que $i$ debe estar entre 1 y ' + P.f +
              '. He usado $i = ' + Math.min(Math.max(i, 1), P.f) + '$.');
            i = Math.min(Math.max(i, 1), P.f);
          }
          if (j < 1 || j > P.c) {
            aviso += parrafo(S.badge('columna fuera de rango', 'info') + ' El resultado tiene ' + P.c +
              ' columna' + (P.c === 1 ? '' : 's') + ', así que $j$ debe estar entre 1 y ' + P.c +
              '. He usado $j = ' + Math.min(Math.max(j, 1), P.c) + '$.');
            j = Math.min(Math.max(j, 1), P.c);
          }
        }
        var ii = i - 1, jj = j - 1;

        /* --- figura: esquema clásico (B arriba, A a la izquierda,
               el resultado en el cruce) --- */
        var cw = anchoCelda(A.c + B.c + 2);
        var yB = 116;
        var xA = 46;
        var gA0 = { W: A.c * cw + 28 };
        var xB = xA + gA0.W + 78;
        var gB = dibujaMat(xB, yB, B, {
          cw: cw, rotulo: 'B  (' + S.dimTxt(B) + ')', rotuloCol: COL.verde,
          fill: celda ? function (r, c2) { return c2 === jj ? HI.col : null; } : null
        });
        var yA = gB.y1 + 76;
        var gA = dibujaMat(xA, yA, A, {
          cw: cw, rotulo: 'A  (' + S.dimTxt(A) + ')',
          fill: celda ? function (r) { return r === ii ? HI.fila : null; } : null
        });
        var gP = dibujaMat(xB, yA, P, {
          cw: cw, rotulo: 'A \u00b7 B  (' + S.dimTxt(P) + ')', rotuloCol: COL.rojo,
          fill: function (r, c2) {
            if (!celda) return HI.ok;
            if (r === ii && c2 === jj) return HI.celda;
            if (r === ii) return HI.fila;
            if (c2 === jj) return HI.col;
            return null;
          }
        });
        var body = S.txt(40, 44, 'Esquema del producto: B arriba, A a la izquierda y el resultado en el cruce',
          { size: 18, weight: '700', anchor: 'start', fill: COL.azulOsc });
        body += S.txt(40, 72, 'Compatibilidad: (' + A.f + '\u00d7' + A.c + ') \u00b7 (' + B.f + '\u00d7' +
          B.c + ') = ' + P.f + '\u00d7' + P.c + '   \u2192  coinciden ' + A.c + ' columnas de A con ' +
          B.f + ' filas de B', { size: 17, weight: '600', anchor: 'start', fill: COL.gris });
        if (celda) {
          body += S.line(gA.x1 + 6, gA.cy(ii), gP.x - 6, gA.cy(ii), COL.azul, 2.6, '7 6');
          /* La vertical verde se para POR ENCIMA del rótulo «A · B (m×n)»
             del resultado (que se pinta en gP.y − 13): antes lo atravesaba
             de arriba abajo. */
          body += S.line(gB.cx(jj), gB.y1 + 6, gB.cx(jj), gP.y - 36, COL.verde, 2.6, '7 6');
        }
        body += gB.svg + gA.svg + gP.svg;
        var yPie = Math.max(gA.y1, gP.y1) + 58;
        if (celda) {
          var cel = pp.celdas[ii][jj];
          body += S.txt(40, yPie, 'c' + (ii + 1) + (jj + 1) + ' = fila ' + (ii + 1) + ' de A  \u00b7  columna ' +
            (jj + 1) + ' de B', { size: 19, weight: '700', anchor: 'start', fill: COL.rojo });
          var cuenta = cel.sumandos.map(function (p) {
            return fracTxtP(p.a) + '\u00b7' + fracTxtP(p.b);
          }).join(' + ') + '  =  ' + fracTxt(cel.valor);
          body += S.txt(40, yPie + 34, cuenta, { size: 22, weight: '700', anchor: 'start', fill: COL.texto });
        } else {
          body += S.txt(40, yPie, 'Modo automático: las ' + (P.f * P.c) + ' casillas del resultado, ya calculadas.',
            { size: 17, weight: '600', anchor: 'start', fill: COL.gris });
        }
        var W = Math.max(gP.x1 + 46, gB.x1 + 46), H = yPie + 66;

        var h = aviso;
        h += figura(body, W, H, 'Producto de matrices, esquema por filas y columnas',
          'Regla de compatibilidad: ' + K('(m\\times n)\\cdot(n\\times p) = m\\times p') +
          '. Cada casilla es ' + K('c_{ij} = \\sum_{k=1}^{' + A.c + '} a_{ik}\\,b_{kj}') + '.');

        h += KD(S.matTex(A) + '\\cdot' + S.matTex(B) + '=' + S.matTex(P,
          celda ? { marca: [[ii, jj]] } : {}));

        if (celda) {
          var c3 = pp.celdas[ii][jj];
          h += titulillo('Cálculo detallado de ' + K('c_{' + i + j + '}'));
          h += S.paso('1', '<p>Tomamos la <strong>fila ' + i + '</strong> de $A$ y la ' +
            '<strong>columna ' + j + '</strong> de $B$:</p>' +
            KD(S.matTex(S.matDe([A.a[ii]])) + '\\quad\\text{y}\\quad ' +
              S.matTex(S.matTrans(S.matDe([B.col(jj)])))), 'mtxb-paso0');
          h += S.paso('2', '<p>Emparejamos término a término y multiplicamos:</p>' + KD(c3.tex));
          h += S.paso('3', '<p>El valor obtenido ocupa el lugar $(' + i + ',' + j + ')$ del resultado:</p>' +
            KD('c_{' + i + j + '} = ' + FT(c3.valor)));
          var filasD = c3.sumandos.map(function (p, k) {
            return [K('a_{' + i + (k + 1) + '}\\cdot b_{' + (k + 1) + j + '}'),
              K(FT(p.a) + '\\cdot\\left(' + FT(p.b) + '\\right)'), K(FT(p.prod))];
          });
          filasD.push({ celdas: ['<strong>suma</strong>', '', '<strong>' + K(FT(c3.valor)) + '</strong>'], clase: 'mtxb-ok' });
          h += S.tabla(['pareja', 'producto', 'valor'], filasD);
        } else {
          h += titulillo('Las ' + (P.f * P.c) + ' casillas del resultado');
          var filasA = [];
          var r, c4;
          for (r = 0; r < P.f; r++) {
            for (c4 = 0; c4 < P.c; c4++) {
              filasA.push([K('c_{' + (r + 1) + (c4 + 1) + '}'),
                K(pp.celdas[r][c4].texCorto), K(FT(P.a[r][c4]))]);
            }
          }
          h += S.tabla(['casilla', 'fila · columna', 'valor'], filasA);
        }

        /* --- lecturas notables --- */
        if (S.esIdentidad && B.f === B.c && S.esIdentidad(B)) {
          h += parrafo(S.badge('A · I = A', 'si') + ' Has multiplicado por la <strong>matriz identidad</strong> ' +
            'de orden ' + B.f + ': el resultado es $A$ otra vez. La identidad es el elemento neutro del ' +
            'producto de matrices, igual que el 1 en los números.');
        }
        if (S.esNula(P) && !S.esNula(A) && !S.esNula(B)) {
          h += parrafo(S.badge('divisores de cero', 'info') + ' ¡Atención! El producto ha dado la ' +
            '<strong>matriz nula</strong> sin que $A$ ni $B$ lo sean. En los números eso es imposible; ' +
            'en las matrices, no. Lo estudiarás en el applet del producto no conmutativo.');
        }
        h += parrafo('Fíjate en las dimensiones: las <em>interiores</em> ($' + A.c + '$ y $' + B.f +
          '$) tienen que coincidir y desaparecen; las <em>exteriores</em> ($' + A.f + '$ y $' + B.c +
          '$) son las del resultado. Es la regla que conviene decir en voz alta antes de empezar a operar.');
        return h;
      }));
  };

  /* ==================================================================
     8 · applet «noConmuta» · El producto no es conmutativo
     ================================================================== */
  R.noConmuta = function (node) {
    S.shell(node, 'El producto de matrices no es conmutativo',
      'Escribe $A$ y $B$ por filas, separando las filas con «;»: por ejemplo $A$ = <code>1 2; 3 4</code> ' +
      'y $B$ = <code>0 1; 1 0</code>. El applet calcula $A\\cdot B$ y $B\\cdot A$ <strong>a la vez</strong> y ' +
      'marca las casillas en las que difieren. Si además escribes una tercera matriz $C$ ' +
      '(<code>2 1; 0 3</code>) comprueba también si $A\\cdot B = A\\cdot C$ con $B \\ne C$, es decir, si ' +
      'falla la propiedad cancelativa. Deja $C$ vacía si no la necesitas. Prueba todos los escenarios: ' +
      'hay divisores de cero, un fallo de la cancelativa y matrices que sí conmutan.',
      [
        { id: 'A', type: 'textarea', label: 'Matriz A', rows: 3, value: '1 2; 3 4', ancho: '210px' },
        { id: 'B', type: 'textarea', label: 'Matriz B', rows: 3, value: '0 1; 1 0', ancho: '210px' },
        { id: 'C', type: 'textarea', label: 'Matriz C (opcional)', rows: 3, value: '', ancho: '210px' },
        chips([
          { txt: 'No conmutan (caso típico)', tip: 'AB y BA existen, son del mismo tamaño y son distintas',
            set: { A: '1 2; 3 4', B: '0 1; 1 0', C: '' } },
          { txt: 'Sí conmutan: A y su cuadrado', tip: 'Toda matriz conmuta con sus propias potencias',
            set: { A: '1 2; 3 4', B: '7 10; 15 22', C: '' } },
          { txt: 'Sí conmutan: identidad', tip: 'A · I = I · A = A siempre',
            set: { A: '3 -1; 2 5', B: '1 0; 0 1', C: '' } },
          { txt: 'Sí conmutan: matriz escalar', tip: 'Las matrices escalares conmutan con todas',
            set: { A: '3 -1; 2 5', B: '4 0; 0 4', C: '' } },
          { txt: 'Divisores de cero', tip: 'A·B = 0 con A ≠ 0 y B ≠ 0',
            set: { A: '1 1; 1 1', B: '1 1; -1 -1', C: '' } },
          { txt: 'Divisores de cero 3×3', tip: 'El mismo fenómeno con matrices de orden 3',
            set: { A: '1 0 0; 0 0 0; 0 0 0', B: '0 0 0; 0 1 0; 0 0 1', C: '' } },
          { txt: 'Falla la cancelativa', tip: 'A·B = A·C con B ≠ C: de AB = AC no se deduce B = C',
            set: { A: '1 1; 1 1', B: '2 3; 4 5', C: '4 5; 2 3' } },
          { txt: 'AB existe pero BA no', tip: 'Con dimensiones 2×3 y 3×4 solo se puede en un orden',
            set: { A: '1 2 3; 4 5 6', B: '1 0 1 0; 0 1 0 1; 2 -1 0 3', C: '' } },
          { txt: 'AB y BA de tamaños distintos', tip: 'Existen los dos, pero ni siquiera son comparables',
            set: { A: '1 2 3; 4 5 6', B: '1 0; 0 1; 2 -1', C: '' } }
        ])
      ],
      safe(function (v) {
        var A = leeMat(v.A, 'la matriz A');
        var B = leeMat(v.B, 'la matriz B');
        var ppAB = S.matProdPasos(A, B);
        var ppBA = S.matProdPasos(B, A);
        var h = '';

        /* --- caso 1: alguno de los dos productos no existe --- */
        if (!ppAB.compatible || !ppBA.compatible) {
          h += titulillo('Antes que nada: ¿existen los dos productos?');
          if (!ppAB.compatible && !ppBA.compatible) {
            h += parrafo(S.badge('ninguno de los dos existe', 'no') +
              ' Con $A$ de ' + S.dimTxt(A) + ' y $B$ de ' + S.dimTxt(B) + ' no se puede formar ni ' +
              '$A\\cdot B$ ni $B\\cdot A$.');
            h += avisoProd(A, B);
            return h;
          }
          var existe = ppAB.compatible ? 'A\\cdot B' : 'B\\cdot A';
          var noExiste = ppAB.compatible ? 'B\\cdot A' : 'A\\cdot B';
          var Pex = ppAB.compatible ? ppAB.P : ppBA.P;
          h += parrafo(S.badge('la no conmutatividad, en su forma más radical', 'info') +
            ' Existe ' + K(existe) + ', que es de dimensión ' + K(S.dimTex(Pex)) +
            ', pero <strong>no existe</strong> ' + K(noExiste) + '. Así que ni siquiera tiene sentido ' +
            'preguntarse si son iguales: la propia <em>escritura</em> $A\\cdot B$ y $B\\cdot A$ ya no es ' +
            'simétrica. El orden de los factores no solo cambia el resultado: puede hacerlo desaparecer.');
          h += KD(existe + '=' + S.matTex(Pex));
          h += ppAB.compatible ? avisoProd(B, A) : avisoProd(A, B);
          return h;
        }

        var AB = ppAB.P, BA = ppBA.P;

        /* --- figura comparativa --- */
        var mismaDim = (AB.f === BA.f && AB.c === BA.c);
        var dif = mismaDim ? S.difIguales(AB, BA) : [];
        var conmutan = mismaDim && dif.length === 0;
        var difMap = {};
        dif.forEach(function (p) { difMap[p[0] + '-' + p[1]] = true; });

        var cw = anchoCelda(AB.c + BA.c + 2);
        var y0 = 132;
        var g1 = dibujaMat(56, y0, AB, {
          cw: cw, rotulo: 'A \u00b7 B  (' + S.dimTxt(AB) + ')',
          fill: function (i, j) { return conmutan ? HI.ok : (difMap[i + '-' + j] ? HI.dif : HI.suave); }
        });
        var x2 = g1.x1 + 110;
        var g2 = dibujaMat(x2, y0, BA, {
          cw: cw, rotulo: 'B \u00b7 A  (' + S.dimTxt(BA) + ')', rotuloCol: COL.verde,
          fill: function (i, j) { return conmutan ? HI.ok : (difMap[i + '-' + j] ? HI.dif : HI.suave); }
        });
        var body = S.txt(40, 46, 'Los dos productos, calculados a la vez',
          { size: 19, weight: '700', anchor: 'start', fill: COL.azulOsc });
        body += S.txt(40, 76, conmutan
          ? 'Estas dos matrices SÍ conmutan: A\u00b7B = B\u00b7A.'
          : (mismaDim ? 'NO conmutan: difieren en ' + dif.length + ' casilla' + (dif.length === 1 ? '' : 's') +
              ' (marcadas en rojo).'
            : 'NO conmutan: ni siquiera tienen la misma dimensi\u00f3n (' + S.dimTxt(AB) + ' frente a ' +
              S.dimTxt(BA) + ').'),
          { size: 18, weight: '700', anchor: 'start', fill: conmutan ? COL.verde : COL.rojo });
        body += g1.svg + g2.svg;
        body += operador((g1.x1 + x2) / 2, y0 + Math.max(g1.H, g2.H) / 2, conmutan ? '=' : '\u2260');
        var yPie = y0 + Math.max(g1.H, g2.H) + 62;
        body += S.txt(40, yPie, 'El orden de los factores S\u00cd altera el producto de matrices.',
          { size: 17, weight: '600', anchor: 'start', fill: COL.gris });
        h += figura(body, Math.max(g2.x1 + 56, g1.x1 + 56), yPie + 56,
          'Comparación de A·B y B·A',
          conmutan ? 'En este caso ' + K('A\\cdot B = B\\cdot A') + ', pero es la excepción, no la regla.'
                   : 'En general ' + K('A\\cdot B \\ne B\\cdot A') + '.');

        h += KD('A\\cdot B=' + S.matTex(AB, { marca: dif }));
        h += KD('B\\cdot A=' + S.matTex(BA, { marca: dif }));

        if (!mismaDim) {
          h += parrafo(S.badge('no conmutan', 'no') + ' $A\\cdot B$ es de ' + S.dimTxt(AB) +
            ' y $B\\cdot A$ es de ' + S.dimTxt(BA) + '. Con dimensiones distintas la igualdad es ' +
            'imposible sin necesidad de mirar ni un solo número: recuerda que dos matrices iguales ' +
            'deben tener, antes que nada, la misma dimensión.');
        } else if (conmutan) {
          h += parrafo(S.badge('sí conmutan', 'si') + ' Estas dos matrices concretas conmutan. ' +
            'Ocurre en casos especiales: con la identidad, con las matrices escalares $kI$, con las ' +
            'potencias de una misma matriz y con algunas parejas afortunadas. Que dos matrices ' +
            'conmuten es una <strong>propiedad de esa pareja</strong>, no una regla general.');
        } else {
          h += parrafo(S.badge('no conmutan', 'no') + ' Difieren en ' + K(posTex(dif)) + '. ' +
            'Por eso, al operar con matrices, nunca se puede cambiar el orden de un producto: ' +
            '$(A+B)^2 = A^2 + AB + BA + B^2$, y <strong>no</strong> $A^2 + 2AB + B^2$.');
        }

        /* --- divisores de cero --- */
        h += titulillo('¿Hay divisores de cero?');
        if (S.esNula(AB) && !S.esNula(A) && !S.esNula(B)) {
          h += parrafo(S.badge('sí: divisores de cero', 'info') + ' $A\\cdot B = 0$ y sin embargo ' +
            '$A \\ne 0$ y $B \\ne 0$. En los números reales esto es imposible: si $x\\cdot y = 0$, uno de ' +
            'los dos tiene que ser 0. En las matrices <strong>no</strong>: existen «divisores de cero». ' +
            'Consecuencia práctica: de $A\\cdot B = 0$ no puedes deducir que alguna de las dos sea nula.');
          h += KD(S.matTex(A) + '\\cdot' + S.matTex(B) + '=' + S.matTex(AB));
        } else if (S.esNula(BA) && !S.esNula(A) && !S.esNula(B)) {
          h += parrafo(S.badge('sí: divisores de cero', 'info') + ' $B\\cdot A = 0$ con $A \\ne 0$ y ' +
            '$B \\ne 0$: son divisores de cero en ese orden. Fíjate en que $A\\cdot B$ no es la matriz nula, ' +
            'otra muestra de que el orden importa.');
        } else {
          h += parrafo('En esta pareja no aparece el fenómeno: ninguno de los dos productos es la matriz nula ' +
            'con factores no nulos. Pulsa el escenario «Divisores de cero» para verlo.');
        }

        /* --- propiedad cancelativa --- */
        var cTxt = String(v.C === undefined || v.C === null ? '' : v.C).trim();
        if (cTxt !== '') {
          h += titulillo('¿Se puede cancelar A? (propiedad cancelativa)');
          var C = leeMat(cTxt, 'la matriz C');
          var ppAC = S.matProdPasos(A, C);
          if (!ppAC.compatible) {
            h += parrafo('Para comparar $A\\cdot B$ con $A\\cdot C$ hace falta que $A\\cdot C$ exista.');
            h += avisoProd(A, C);
          } else {
            var AC = ppAC.P;
            var igualProd = S.matIgual(AB, AC);
            var igualBC = (B.f === C.f && B.c === C.c) ? S.matIgual(B, C) : false;
            /* Los rótulos van por KaTeX (K), no como TeX crudo en texto. */
            var cmp = comparaMatrices(K('A \\cdot B'), AB, K('A \\cdot C'), AC);
            h += cmp.html;
            if (igualProd && !igualBC) {
              h += parrafo(S.badge('la cancelativa FALLA', 'no') + ' Se cumple $A\\cdot B = A\\cdot C$ y sin ' +
                'embargo $B \\ne C$. Es decir: <strong>de $AB = AC$ no se deduce $B = C$</strong>, aunque ' +
                '$A$ no sea la matriz nula. En los números sí valdría (basta dividir entre $x\\ne0$), pero ' +
                'las matrices no se dividen. La cancelación solo es lícita cuando $A$ tiene inversa, y ' +
                'entonces se multiplica por $A^{-1}$ por la izquierda: $A^{-1}AB = A^{-1}AC$.');
              h += KD('A\\cdot B = A\\cdot C = ' + S.matTex(AB) + '\\quad\\text{y sin embargo}\\quad B \\ne C');
            } else if (igualProd && igualBC) {
              h += parrafo(S.badge('no es un contraejemplo', 'info') + ' Aquí $A\\cdot B = A\\cdot C$ ' +
                'porque $B$ y $C$ son la misma matriz: no prueba nada. Escribe una $C$ distinta de $B$ ' +
                'o pulsa el escenario «Falla la cancelativa».');
            } else {
              h += parrafo('En este caso $A\\cdot B \\ne A\\cdot C$' + (igualBC ? '' : ' y $B \\ne C$') +
                ', así que no hay nada que cancelar. Pulsa el escenario «Falla la cancelativa» para ver ' +
                'el contraejemplo clásico.');
            }
          }
        } else {
          h += titulillo('¿Se puede cancelar A? (propiedad cancelativa)');
          h += parrafo('Escribe una tercera matriz $C$ (o pulsa el escenario «Falla la cancelativa») para ' +
            'comprobar si puede ocurrir $A\\cdot B = A\\cdot C$ con $B \\ne C$. Adelanto: sí puede ocurrir.');
        }
        return h;
      }));
  };

  /* ==================================================================
     9 · applet «potencia» · Potencias de una matriz
     ================================================================== */
  R.potencia = function (node) {
    S.shell(node, 'Potencias de una matriz',
      'Escribe una matriz <strong>cuadrada</strong> por filas, separando las filas con «;»: por ejemplo ' +
      '<code>1 1; 0 1</code> o <code>0 -1; 1 0</code>. También valen fracciones (<code>1/2 0; 0 1/2</code>). ' +
      'Mueve el deslizador de $n$ para ver la tabla $A, A^2, A^3, \\dots, A^n$: el applet busca ' +
      'automáticamente si hay <em>patrón</em> (periodicidad, idempotencia o nilpotencia) y, si lo hay, ' +
      'responde a la pregunta «¿cuánto vale $A^{100}$?» sin calcular las cien potencias. Recuerda que ' +
      'por definición $A^0 = I$ y $A^{k+1} = A^k \\cdot A$.',
      [
        { id: 'A', type: 'textarea', label: 'Matriz A (cuadrada)', rows: 3, value: '1 1; 0 1', ancho: '240px' },
        { id: 'n', type: 'range', label: 'Exponente n', min: 1, max: 12, step: 1, value: 4 },
        chips([
          { txt: 'Periódica: A⁴ = I', tip: 'La matriz del giro de 90°: sus potencias se repiten cada 4',
            set: { A: '0 -1; 1 0', n: 6 } },
          { txt: 'Periódica de orden 3', tip: 'Una permutación cíclica: A³ = I',
            set: { A: '0 1 0; 0 0 1; 1 0 0', n: 6 } },
          { txt: 'Idempotente: A² = A', tip: 'Todas sus potencias valen A',
            set: { A: '2 -1; 2 -1', n: 5 } },
          { txt: 'Nilpotente: A² = 0', tip: 'A no es nula pero su cuadrado sí',
            set: { A: '0 1; 0 0', n: 4 } },
          { txt: 'Nilpotente de orden 3', tip: 'A³ = 0 con A y A² no nulas',
            set: { A: '0 1 2; 0 0 3; 0 0 0', n: 5 } },
          { txt: 'Patrón visible: Aⁿ', tip: 'Triangular con unos: el elemento de arriba es n',
            set: { A: '1 1; 0 1', n: 6 } },
          { txt: 'Diagonal', tip: 'Las potencias de una diagonal se calculan elemento a elemento',
            set: { A: '2 0; 0 -3', n: 5 } },
          { txt: 'Identidad', tip: 'Todas las potencias de I son I',
            set: { A: '1 0; 0 1', n: 4 } },
          { txt: 'Sin patrón', tip: 'Lo normal: las potencias crecen sin repetirse',
            set: { A: '1 2; 3 4', n: 5 } }
        ])
      ],
      safe(function (v) {
        var A = leeMat(v.A, 'la matriz A', 5);
        if (A.f !== A.c) {
          var hb = '<div class="mtxb-imposible">';
          hb += '<p class="mtxb-imposible-tit">Esta matriz no tiene potencias</p>';
          hb += parrafo('La matriz que has escrito es de <strong>' + S.dimTxt(A) + '</strong>, es decir, ' +
            'rectangular. Para calcular $A^2 = A\\cdot A$ habría que multiplicar $A$ por sí misma, y eso ' +
            'exige que el número de <strong>columnas</strong> de $A$ (' + A.c + ') coincida con su número de ' +
            '<strong>filas</strong> (' + A.f + '). Como ' + A.c + ' ≠ ' + A.f + ', el producto $A\\cdot A$ ' +
            'no existe.');
          hb += parrafo('<strong>Qué haría falta:</strong> una matriz <strong>cuadrada</strong>, con el mismo ' +
            'número de filas que de columnas: ' + A.f + '×' + A.f + ' o ' + A.c + '×' + A.c + '. ' +
            'Solo las matrices cuadradas tienen potencias.');
          return hb + '</div>';
        }

        var n = Math.round(Number(v.n) || 4);
        if (n < 1) n = 1;
        if (n > 12) n = 12;
        var pp = S.matPotPasos(A, n);
        var I = S.matIdentidad(A.f);

        /* --- figura: A, A², A³ … hasta donde quepan --- */
        var cuantas = Math.min(n, A.f >= 4 ? 3 : 4);
        var cw = anchoCelda((cuantas + 1) * A.c);
        var x = 46, y = 132, gs = [], k;
        var g0 = dibujaMat(x, y, I, { cw: cw, rotulo: 'A\u2070 = I', rotuloCol: COL.gris });
        gs.push(g0);
        x = g0.x1 + 58;
        for (k = 1; k <= cuantas; k++) {
          var g = dibujaMat(x, y, pp.pot[k - 1].M, {
            cw: cw,
            rotulo: 'A' + expTxt(k),
            rotuloCol: k === cuantas ? COL.rojo : COL.azulOsc,
            fill: function (r, c2) { return null; }
          });
          gs.push(g);
          x = g.x1 + 58;
        }
        var body = S.txt(40, 46, 'Las primeras potencias de A: cada una es la anterior multiplicada por A',
          { size: 19, weight: '700', anchor: 'start', fill: COL.azulOsc });
        body += S.txt(40, 76, 'A\u2070 = I,  A\u00b9 = A,  A\u207f\u207a\u00b9 = A\u207f \u00b7 A',
          { size: 17, weight: '600', anchor: 'start', fill: COL.gris });
        for (k = 0; k < gs.length; k++) {
          body += gs[k].svg;
          if (k < gs.length - 1) {
            body += S.txt((gs[k].x1 + gs[k + 1].x) / 2, gs[k].y + gs[k].H / 2 + 4, '\u00b7 A',
              { size: 22, weight: '700', fill: COL.eje });
          }
        }
        var ymax = y + gs[0].H;
        var pie = pp.nilpotente ? 'La matriz es nilpotente: a partir de A' + expTxt(pp.indice) + ' todo es cero.'
          : pp.idempotente ? 'La matriz es idempotente: A\u00b2 = A, y todas las potencias valen A.'
          : (pp.periodo !== null && pp.desde === 0) ? 'Las potencias se repiten cada ' + pp.periodo + ' pasos: A' + expTxt(pp.periodo) + ' = I.'
          : (pp.periodo !== null) ? 'A partir de A' + expTxt(pp.desde) + ' las potencias se repiten cada ' + pp.periodo + ' pasos.'
          : 'Aqu\u00ed las potencias no se repiten: hay que buscar el patr\u00f3n en los n\u00fameros.';
        body += S.txt(40, ymax + 66, pie, { size: 19, weight: '700', anchor: 'start', fill: COL.morado });
        var W = Math.max(x + 10, 780), H = ymax + 110;

        var h = figura(body, W, H, 'Tabla gráfica de las primeras potencias de A',
          'Definición: ' + K('A^{0}=I') + ', ' + K('A^{k+1}=A^{k}\\cdot A') + '. ' +
          'Ojo: elevar una matriz al cuadrado ' + K('\\textbf{no}') + ' es elevar al cuadrado cada elemento.');

        /* --- tabla de potencias --- */
        h += titulillo('Tabla de potencias hasta ' + K('A^{' + n + '}'));
        var filas = [['A^0 = I', KD(S.matTex(I)), 'por definición']];
        filas = [[K('A^{0}'), KD(S.matTex(I)), 'por definición, la identidad']];
        pp.pot.forEach(function (p) {
          var nota = '';
          if (p.M.esNula()) nota = 'matriz nula';
          else if (p.M.igual(I)) nota = '¡vuelve a salir la identidad!';
          else if (p.M.igual(A) && p.k > 1) nota = 'vuelve a salir A';
          filas.push([K('A^{' + p.k + '}'), KD(S.matTex(p.M)), nota]);
        });
        h += S.tabla(['potencia', 'valor', 'observación'], filas);

        /* --- patrón detectado --- */
        if (pp.patron) {
          h += '<div class="mtxb-patron"><p class="mtxb-imposible-tit">Patrón detectado</p>' +
            parrafo(pp.patron) + '</div>';
        } else {
          h += parrafo(S.badge('sin patrón evidente', 'info') + ' Hasta $A^{' + n + '}$ no se repite ninguna ' +
            'potencia. Eso no significa que no haya regla: mira los números de cada casilla y busca una ' +
            'sucesión conocida (múltiplos, potencias de un número, la propia $n$…).');
        }

        /* --- la pregunta de examen: ¿cuánto vale A^100? --- */
        h += titulillo('La pregunta de siempre: ¿cuánto vale ' + K('A^{100}') + '?');
        if (pp.nilpotente) {
          h += parrafo('Como $A^{' + pp.indice + '} = 0$ y multiplicar por la matriz nula vuelve a dar la ' +
            'matriz nula, todas las potencias a partir de la ' + pp.indice + '-ésima son nulas. En particular:');
          h += KD('A^{100} = ' + S.matTex(S.matNula(A.f, A.f)));
        } else if (pp.idempotente) {
          h += parrafo('Como $A^2 = A$, al multiplicar otra vez por $A$ se vuelve a obtener $A$, y así ' +
            'indefinidamente: $A^n = A$ para todo $n \\ge 1$. Por tanto:');
          h += KD('A^{100} = A = ' + S.matTex(A));
        } else if (pp.periodo !== null && pp.desde === 0) {
          var r100 = 100 % pp.periodo;
          var M100 = r100 === 0 ? I : S.matPot(A, r100);
          h += parrafo('Como $A^{' + pp.periodo + '} = I$, las potencias se repiten en ciclos de ' +
            pp.periodo + '. Basta con dividir el exponente entre ' + pp.periodo + ' y quedarse con el ' +
            '<strong>resto</strong>: $100 = ' + pp.periodo + '\\cdot' + Math.floor(100 / pp.periodo) +
            ' + ' + r100 + '$, luego $A^{100} = \\left(A^{' + pp.periodo + '}\\right)^{' +
            Math.floor(100 / pp.periodo) + '}\\cdot A^{' + r100 + '} = I\\cdot A^{' + r100 + '}$.');
          h += KD('A^{100} = A^{' + r100 + '} = ' + S.matTex(M100));
        } else if (pp.periodo !== null) {
          var r2 = pp.desde + ((100 - pp.desde) % pp.periodo);
          var M2 = S.matPot(A, r2);
          h += parrafo('Las potencias se repiten con periodo ' + pp.periodo + ' a partir de $A^{' +
            pp.desde + '}$. Como $100 \\ge ' + pp.desde + '$, se puede bajar el exponente de ' +
            pp.periodo + ' en ' + pp.periodo + ' hasta llegar a $A^{' + r2 + '}$:');
          h += KD('A^{100} = A^{' + r2 + '} = ' + S.matTex(M2));
        } else {
          h += parrafo('Con esta matriz no se detecta periodicidad, así que $A^{100}$ no se puede ' +
            'obtener con un truco de restos. En un examen habría que <strong>conjeturar la fórmula ' +
            'general de $A^n$</strong> mirando las primeras potencias y después demostrarla por ' +
            'inducción. Prueba los escenarios «Patrón visible», «Periódica» o «Nilpotente»: ahí sí ' +
            'aparece la regla.');
          if (A.f === 2 && cero(A.a[1][0]) && igF(A.a[0][0], F1()) && igF(A.a[1][1], F1())) {
            h += parrafo('Pista para esta matriz concreta: fíjate en la esquina superior derecha de cada ' +
              'potencia y compárala con el exponente.');
          }
        }

        /* --- avisos didácticos --- */
        h += parrafo(S.badge('error típico', 'no') + ' $A^2$ <strong>no</strong> es «elevar al cuadrado cada ' +
          'elemento»: es el producto $A\\cdot A$, con su suma de productos fila por columna. Compruébalo ' +
          'con la matriz <code>1 1; 0 1</code>: al cuadrado da <code>1 2; 0 1</code>, no <code>1 1; 0 1</code>.');
        h += parrafo('Y otro aviso importante para el examen: como el producto no es conmutativo, ' +
          '$(A\\cdot B)^2 \\ne A^2\\cdot B^2$ en general. Solo se puede desarrollar así cuando $A$ y $B$ ' +
          'conmutan.');
        return h;
      }));
  };

  /* Exponente en caracteres superíndice, para los rótulos de las figuras
     (dentro de un <text> no puede ir LaTeX, así que nada de ^{2}). */
  function expTxt(n) {
    var sup = ['\u2070', '\u00b9', '\u00b2', '\u00b3', '\u2074', '\u2075', '\u2076', '\u2077', '\u2078', '\u2079'];
    var s = String(n), out = '', i;
    for (i = 0; i < s.length; i++) out += sup[Number(s.charAt(i))] || '';
    return out;
  }

  /* ==================================================================
     10 · applet «transforma» · La matriz como transformación del plano
     ================================================================== */
  var FIGURAS = {
    cuadrado: { nombre: 'cuadrado unidad', pts: [[0, 0], [1, 0], [1, 1], [0, 1]] },
    triangulo: { nombre: 'triángulo', pts: [[0, 0], [2, 0], [1, 2]] },
    casa: { nombre: 'casa', pts: [[0, 0], [2, 0], [2, 1.5], [1, 2.5], [0, 1.5]] },
    efe: {
      nombre: 'letra F',
      pts: [[0, 0], [0.6, 0], [0.6, 1.1], [1.5, 1.1], [1.5, 1.7], [0.6, 1.7],
        [0.6, 2.4], [1.8, 2.4], [1.8, 3], [0, 3]]
    }
  };

  /* Área (con signo) de un polígono, por la fórmula del cordón. */
  function areaPoli(pts) {
    var s = 0, i, n = pts.length;
    for (i = 0; i < n; i++) {
      var p = pts[i], q = pts[(i + 1) % n];
      s += p[0] * q[1] - q[0] * p[1];
    }
    return s / 2;
  }
  /* Imagen de un punto por una matriz 2×2 dada por sus cuatro Frac. */
  function aplica(M, p) {
    return [numF(M.a[0][0]) * p[0] + numF(M.a[0][1]) * p[1],
      numF(M.a[1][0]) * p[0] + numF(M.a[1][1]) * p[1]];
  }
  function segmentosDe(pts, color, dash, ancho) {
    var segs = [], i;
    for (i = 0; i < pts.length; i++) {
      var p = pts[i], q = pts[(i + 1) % pts.length];
      segs.push({ x1: p[0], y1: p[1], x2: q[0], y2: q[1], color: color, dash: dash, ancho: ancho || 3 });
    }
    return segs;
  }

  R.transforma = function (node) {
    S.shell(node, 'La matriz como transformación del plano',
      'Mueve los cuatro deslizadores: son los elementos de la matriz ' +
      '$A=\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$, que transforma cada punto $(x,y)$ del plano ' +
      'en el punto $A\\cdot\\begin{pmatrix} x \\\\ y \\end{pmatrix}$. Elige la figura de partida ' +
      '(cuadrado unidad, triángulo, casa o letra F) y observa dónde van a parar los vectores $(1,0)$ y ' +
      '$(0,1)$: <strong>son exactamente las dos columnas de $A$</strong>. Si además escribes una segunda ' +
      'matriz $B$ por filas (por ejemplo <code>0 -1; 1 0</code>), el applet aplica primero $A$ y después ' +
      '$B$, y comprueba que el resultado es la figura transformada por el producto $B\\cdot A$: ' +
      'multiplicar matrices es <em>componer</em> transformaciones. Deja $B$ vacía si no la necesitas.',
      [
        { id: 'a', type: 'range', label: 'a  (fila 1, columna 1)', min: -3, max: 3, step: 0.5, value: 1 },
        { id: 'b', type: 'range', label: 'b  (fila 1, columna 2)', min: -3, max: 3, step: 0.5, value: 0 },
        { id: 'c', type: 'range', label: 'c  (fila 2, columna 1)', min: -3, max: 3, step: 0.5, value: 0 },
        { id: 'd', type: 'range', label: 'd  (fila 2, columna 2)', min: -3, max: 3, step: 0.5, value: 1 },
        { id: 'fig', type: 'select', label: 'Figura', value: 'casa', options: [
          { value: 'cuadrado', label: 'Cuadrado unidad' },
          { value: 'triangulo', label: 'Triángulo' },
          { value: 'casa', label: 'Casa' },
          { value: 'efe', label: 'Letra F' }
        ] },
        { id: 'B', type: 'text', label: 'Matriz B para componer (opcional)', value: '', place: '0 -1; 1 0', ancho: '210px' },
        chips([
          { txt: 'Identidad', tip: 'No mueve nada: cada punto va a parar a sí mismo',
            set: { a: 1, b: 0, c: 0, d: 1, fig: 'casa', B: '' } },
          { txt: 'Giro de 90°', tip: 'Los ejes se intercambian: (1,0) va a (0,1)',
            set: { a: 0, b: -1, c: 1, d: 0, fig: 'casa', B: '' } },
          { txt: 'Simetría respecto del eje X', tip: 'Determinante negativo: la figura se refleja',
            set: { a: 1, b: 0, c: 0, d: -1, fig: 'efe', B: '' } },
          { txt: 'Homotecia de razón 2', tip: 'Todo se duplica y el área se multiplica por 4',
            set: { a: 2, b: 0, c: 0, d: 2, fig: 'cuadrado', B: '' } },
          { txt: 'Cizalla', tip: 'Inclina la figura sin cambiar el área: determinante 1',
            set: { a: 1, b: 1.5, c: 0, d: 1, fig: 'cuadrado', B: '' } },
          { txt: 'Estira en x, aplasta en y', tip: 'Dos factores distintos en cada eje',
            set: { a: 2.5, b: 0, c: 0, d: 0.5, fig: 'casa', B: '' } },
          { txt: 'Matriz singular', tip: 'Determinante 0: toda la figura cae sobre una recta',
            set: { a: 1, b: 2, c: 0.5, d: 1, fig: 'casa', B: '' } },
          { txt: 'Singular extremo', tip: 'Las dos columnas son proporcionales: el plano se aplasta',
            set: { a: 2, b: 1, c: 2, d: 1, fig: 'efe', B: '' } },
          { txt: 'Composición: giro y luego homotecia', tip: 'Primero A y después B; el total es B·A',
            set: { a: 0, b: -1, c: 1, d: 0, fig: 'casa', B: '2 0; 0 2' } },
          { txt: 'Composición: cizalla y luego simetría', tip: 'El orden importa: B·A no es A·B',
            set: { a: 1, b: 1, c: 0, d: 1, fig: 'efe', B: '1 0; 0 -1' } }
        ])
      ],
      safe(function (v) {
        var A = S.matDe([[FR(v.a), FR(v.b)], [FR(v.c), FR(v.d)]]);
        var clave = FIGURAS[v.fig] ? v.fig : 'casa';
        var F = FIGURAS[clave];
        var orig = F.pts;
        var img = orig.map(function (p) { return aplica(A, p); });

        var dA = S.det(A);
        var hayB = String(v.B === undefined || v.B === null ? '' : v.B).trim() !== '';
        var B = null, BA = null, img2 = null;
        if (hayB) {
          B = leeMat(v.B, 'la matriz B', 2);
          if (B.f !== 2 || B.c !== 2) {
            throw Error('Para componer transformaciones del plano, la matriz B debe ser de 2×2 y la que ' +
              'has escrito es de ' + S.dimTxt(B) + '. Escríbela así: 0 -1; 1 0.');
          }
          BA = S.matProd(B, A);
          img2 = orig.map(function (p) { return aplica(BA, p); });
        }

        /* ---------- figura con S.plano ---------- */
        var todos = orig.concat(img).concat(img2 || []);
        todos = todos.concat([[0, 0], [1, 0], [0, 1]]);
        var xs = todos.map(function (p) { return p[0]; });
        var ys = todos.map(function (p) { return p[1]; });
        var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
        var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
        var mx = Math.max(1, (x1 - x0) * 0.18), my = Math.max(1, (y1 - y0) * 0.18);
        var segs = segmentosDe(orig, COL.azul, '8 6', 3)
          .concat(segmentosDe(img, COL.rojo, null, 3.6));
        if (img2) segs = segs.concat(segmentosDe(img2, COL.morado, '3 5', 3.2));
        /* los vectores de la base y sus imágenes */
        segs.push({ x1: 0, y1: 0, x2: 1, y2: 0, color: COL.gris, ancho: 2.4 });
        segs.push({ x1: 0, y1: 0, x2: 0, y2: 1, color: COL.gris, ancho: 2.4 });
        segs.push({ x1: 0, y1: 0, x2: numF(A.a[0][0]), y2: numF(A.a[1][0]), color: COL.verde, ancho: 4 });
        segs.push({ x1: 0, y1: 0, x2: numF(A.a[0][1]), y2: numF(A.a[1][1]), color: COL.naranja, ancho: 4 });

        var puntos = [
          { x: numF(A.a[0][0]), y: numF(A.a[1][0]), color: COL.verde,
            etiqueta: 'A\u00b7e1 = (' + fracTxt(A.a[0][0]) + ', ' + fracTxt(A.a[1][0]) + ')', dx: 12, dy: -14 },
          { x: numF(A.a[0][1]), y: numF(A.a[1][1]), color: COL.naranja,
            etiqueta: 'A\u00b7e2 = (' + fracTxt(A.a[0][1]) + ', ' + fracTxt(A.a[1][1]) + ')', dx: 12, dy: 22 }
        ];
        var leyendas = [
          [COL.azul, 'figura original (' + F.nombre + ')'],
          [COL.rojo, 'figura transformada por A'],
          [COL.verde, 'imagen de e1 = (1, 0): primera columna de A'],
          [COL.naranja, 'imagen de e2 = (0, 1): segunda columna de A']
        ];
        if (img2) leyendas.push([COL.morado, 'despu\u00e9s de B: la figura de B\u00b7A']);

        var fig = S.plano({
          W: 860, H: 620,
          xmin: Math.floor(x0 - mx), xmax: Math.ceil(x1 + mx),
          ymin: Math.floor(y0 - my), ymax: Math.ceil(y1 + my),
          segmentos: segs, puntos: puntos, leyenda: leyendas,
          titulo: 'La matriz A transforma el plano: cada punto (x, y) va a A\u00b7(x, y)',
          label: 'Figura original y figura transformada por la matriz A',
          cap: 'Las columnas de ' + K('A') + ' son las imágenes de ' + K('(1,0)') + ' y ' + K('(0,1)') +
            '; el determinante ' + K('\\det(A)') + ' es el factor por el que se multiplica el área.'
        });

        /* ---------- salida ---------- */
        var h = fig;
        h += KD('A = ' + S.matTex(A) + ',\\qquad \\det(A) = ' + FT(dA));

        h += titulillo('Dónde van a parar los vectores de la base');
        h += S.tabla(['vector', 'se transforma en', 'es'], [
          [K('e_1 = (1,\\,0)'),
            K('A\\cdot' + S.matTex(S.matDe([[1], [0]])) + '=' + S.matTex(S.matDe([[A.a[0][0]], [A.a[1][0]]]))),
            'la <strong>primera columna</strong> de $A$'],
          [K('e_2 = (0,\\,1)'),
            K('A\\cdot' + S.matTex(S.matDe([[0], [1]])) + '=' + S.matTex(S.matDe([[A.a[0][1]], [A.a[1][1]]]))),
            'la <strong>segunda columna</strong> de $A$']
        ]);
        h += parrafo('Esta es la idea que hay detrás de todo el producto de matrices: para saber qué hace ' +
          'una matriz basta con saber qué les hace a los vectores $(1,0)$ y $(0,1)$, porque cualquier otro ' +
          'punto es una <em>combinación lineal</em> de esos dos.');

        /* --- el determinante como factor de área --- */
        var aO = Math.abs(areaPoli(orig)), aI = Math.abs(areaPoli(img));
        h += titulillo('El determinante y el área');
        if (cero(dA)) {
          h += parrafo(S.badge('matriz singular · det(A) = 0', 'no') + ' Las dos columnas de $A$ son ' +
            '<strong>proporcionales</strong>, así que las imágenes de $(1,0)$ y de $(0,1)$ están alineadas ' +
            'con el origen: toda la figura se aplasta sobre una <strong>recta</strong> (o incluso sobre un ' +
            'solo punto, si $A$ es la matriz nula). El área pasa de ' + S.nc(aO, 3) + ' a 0.');
          h += parrafo('Y esto explica de golpe por qué una matriz singular <strong>no tiene inversa</strong>: ' +
            'la transformación ha perdido información. Muchos puntos distintos del plano acaban en el mismo ' +
            'punto de la recta, y no hay ninguna matriz capaz de deshacerlo. Lo estudiarás con detalle en ' +
            'el apartado de la matriz inversa.');
        } else {
          h += parrafo('El área de la figura original es ' + S.nc(aO, 3) + ' y la de la figura transformada ' +
            'es ' + S.nc(aI, 3) + '. El cociente es ' + S.nc(aO === 0 ? 0 : aI / aO, 3) + ', que coincide con ' +
            '$|\\det(A)| = ' + S.kf(Math.abs(numF(dA)), 3) + '$: <strong>el valor absoluto del determinante ' +
            'es el factor por el que se multiplican las áreas</strong>.');
          if (numF(dA) < 0) {
            h += parrafo(S.badge('determinante negativo', 'info') + ' Además, al ser $\\det(A) < 0$, la ' +
              'transformación <strong>invierte la orientación</strong>: recorre la figura al revés, como si ' +
              'la hubiera mirado en un espejo. Se ve muy bien con la letra F.');
          }
        }

        /* --- composición --- */
        if (BA) {
          h += titulillo('Componer transformaciones es multiplicar matrices');
          h += parrafo('Has aplicado primero $A$ y después $B$. Aplicar $B$ a lo que ya había transformado ' +
            '$A$ es lo mismo que aplicar de una sola vez la matriz producto $B\\cdot A$ (¡en ese orden: ' +
            'la que se aplica primero va a la <strong>derecha</strong>!).');
          h += KD('B\\cdot A = ' + S.matTex(B) + '\\cdot' + S.matTex(A) + '=' + S.matTex(BA));
          var AB = S.matProd(A, B);
          var mismo = S.matIgual(AB, BA);
          h += parrafo('Al revés, aplicando primero $B$ y luego $A$, la matriz sería $A\\cdot B$:');
          h += KD('A\\cdot B = ' + S.matTex(AB));
          h += parrafo(mismo
            ? S.badge('aquí sí coinciden', 'si') + ' Con estas dos matrices concretas $A\\cdot B = B\\cdot A$, ' +
              'así que da igual el orden en que se apliquen. Es la excepción, no la regla: prueba con otro ' +
              'escenario y verás que el orden cambia el resultado.'
            : S.badge('el orden importa', 'no') + ' $A\\cdot B \\ne B\\cdot A$: aplicar el giro y luego la ' +
              'simetría no es lo mismo que aplicar la simetría y luego el giro. Esa es, geométricamente, la ' +
              'razón de que el producto de matrices no sea conmutativo.');
          h += parrafo('Comprobación de los determinantes: $\\det(B\\cdot A) = \\det(B)\\cdot\\det(A) = ' +
            FT(S.det(B)) + '\\cdot' + FT(dA) + ' = ' + FT(S.det(BA)) + '$. Los factores de área se ' +
            'multiplican, igual que las transformaciones se componen.');
        } else {
          h += parrafo('Escribe una matriz $B$ en el campo de composición (por ejemplo <code>0 -1; 1 0</code>) ' +
            'para ver cómo se encadenan dos transformaciones y por qué eso es exactamente el producto ' +
            '$B\\cdot A$.');
        }

        h += parrafo(S.badge('para el examen', 'info') + ' De esta interpretación salen tres ideas que ' +
          'conviene saber decir con palabras: las columnas de la matriz son las imágenes de la base; ' +
          'multiplicar matrices es componer transformaciones, y por eso el orden importa; y una matriz ' +
          'con determinante nulo aplasta el plano y no se puede deshacer.');
        return h;
      }));
  };

  /* ==================================================================
     Fin del módulo B
     ================================================================== */
  S.extraB = true;
  if (S.monta) S.monta();
})();
