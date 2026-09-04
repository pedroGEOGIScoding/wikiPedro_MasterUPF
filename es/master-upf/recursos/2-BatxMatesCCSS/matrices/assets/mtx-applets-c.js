/* =====================================================================
   mtx-applets-c.js · Módulo C del Tema 1 «Matrices»
   2.º de Bachillerato · Matemáticas Aplicadas a las Ciencias Sociales
   Ruta: 2-BatxMatesCCSS/matrices/assets/mtx-applets-c.js

   Cubre los apartados 1.11, 1.12 y 1.13 del tema:

     1.11  Combinaciones lineales de filas. Filas dependientes e
           independientes.
     1.12  Rango de una matriz. Invariancia del rango frente a las
           operaciones elementales.
     1.13  Método de Gauss para el cálculo del rango. Rango de una
           matriz que depende de un parámetro.

   ---------------------------------------------------------------------
   CLAVES REGISTRADAS (6)
   ---------------------------------------------------------------------
     combFilas    Combinaciones lineales de filas. El alumno elige los
                  coeficientes de F1 y F2 con dos deslizadores y ve
                  nacer la fila aF1 + bF2 elemento a elemento. En el
                  sentido contrario, escribe una tercera fila y el
                  applet averigua si es combinación lineal de las dos
                  primeras y con qué coeficientes exactos.
     dependencia  Filas dependientes e independientes. Sobre una matriz
                  editable dice qué filas aportan información nueva,
                  qué filas se pueden escribir en función de otras y
                  con qué combinación, escrita como igualdad
                  F_3 = 2F_1 - F_2.
     rango        Rango de una matriz: escalonado, filas con pivote,
                  filas nulas, y la cota rg(A) <= min(m, n) comparada
                  en una figura de barras con el número de filas y de
                  columnas.
     rangoLab     Laboratorio de operaciones elementales. El alumno
                  aplica las tres operaciones permitidas (cambiar dos
                  filas, multiplicar una fila por k distinto de 0,
                  sumar a una fila un múltiplo de otra) y comprueba
                  que el rango no cambia; además incluye la OPERACIÓN
                  PROHIBIDA (multiplicar una fila por 0), que sí puede
                  bajar el rango, para que se vea la diferencia.
     gaussRango   Método de Gauss para el rango, con dos modos:
                  · automático: todos los pasos en la notación
                    F_i -> F_i - k F_j, con los pivotes marcados,
                    recuento de filas nulas y rango;
                  · manual: el alumno propone la operación elemental,
                    el applet la valida, la aplica y le avisa si esa
                    operación no le acerca a la forma escalonada,
                    dándole además una pista del movimiento útil.
     rangoParam   Rango de una matriz con un parámetro k: valores
                  críticos exactos, tabla de casos con el rango de cada
                  uno, deslizador de k para ver el salto del rango y
                  recta de casos dibujada.

   ---------------------------------------------------------------------
   DEPENDENCIAS
   ---------------------------------------------------------------------
   Necesita, cargados antes:
     · el núcleo  mtx-applets.js      (window.MTX)
     · la capa    mtx-applets-alg.js  (álgebra matricial exacta)

   De la capa de álgebra se usan literalmente, sin reimplementar nada:
     parseMat, matTxt, matTex, matDe, Mat, dimTex, dimTxt, matIgual,
     matNula, matIdentidad, matAleatoria, combFilas, filasIndependientes,
     rango, rangoPasos, gauss, opElemental, parseMatParam, evalMatParam,
     rangoParam, matParamTex, det, fracDe, fracTex.
   Del núcleo: shell, registry, K, KD, esc, texifica, expr, paso, tabla,
   badge, kvs, resultado, svgWrap, txt, line, rect, circle, poly,
   leyenda, COL y Frac.

   ---------------------------------------------------------------------
   CRITERIOS DIDÁCTICOS Y DE PRESENTACIÓN
   ---------------------------------------------------------------------
   1. Aritmética EXACTA con M.Frac (BigInt) de principio a fin: los
      coeficientes de una combinación lineal, los pivotes de Gauss y los
      valores críticos del parámetro salen como fracciones exactas
      (1/2, -5/3), nunca como decimales redondeados. La coma flotante
      solo se usa para colocar píxeles en las figuras.
   2. Matrices GRANDES: todas las matrices se muestran en display y con
      la clase .mtxc-caja, que fuerza celdas de fuente >= 20 px. Las
      figuras miden como poco 760 x 480 y sus rótulos van en negrita a
      19 px o más.
   3. Dentro de un <svg> NO hay KaTeX: en los <text> solo se escribe
      texto llano («rg = 2», «F3 = 2F1 - F2», «k = -1/2» con el signo
      menos tipográfico U+2212). Las fórmulas bonitas van fuera del SVG.
   4. Convención española: coma decimal en los textos y {,} dentro de
      KaTeX (lo aportan M.nc y M.kf).
   5. Ninguna entrada mala rompe la página: todo el cómputo va envuelto
      en safe(), que convierte cualquier Error en un aviso explicativo
      dentro del applet, con un ejemplo copiable de entrada correcta.
   6. El título lo pone M.shell como «Applet · <titulo>»: los applets
      NO se numeran.

   Clases CSS propias: prefijo `mtxc-`, añadidas al final de
   mtx-applets.css sin tocar ninguna regla anterior.
   ===================================================================== */
(function () {
  'use strict';

  var M = window.MTX;
  if (!M) {
    if (window.console && console.error) {
      console.error('[matrices] mtx-applets-c.js necesita mtx-applets.js cargado antes.');
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
    if (!M.parseMat || !M.rangoPasos || !M.opElemental) {
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
  function negF(f) { return (f.n < 0n) !== (f.d < 0n); }
  function igF(a, b) { return a.cmp(b) === 0; }
  function numF(f) { return Number(f.n) / Number(f.d); }

  /* Fracción exacta en TEXTO LLANO, para los rótulos de los SVG:
     «8/5», «−3/5», «2». Signo menos tipográfico U+2212. */
  function fracTxt(f) {
    var n = String(f.n), d = String(f.d), neg = false;
    if (n.charAt(0) === '-') { n = n.slice(1); neg = !neg; }
    if (d.charAt(0) === '-') { d = d.slice(1); neg = !neg; }
    return (neg ? '\u2212' : '') + n + (d === '1' ? '' : '/' + d);
  }
  /* Número corriente en texto llano con coma decimal y menos U+2212. */
  function numTxt(x) { return M.etq(x, 3); }

  /* Botones de escenario a partir de una lista { txt, tip, set, extra } */
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
  function safe(fn) {
    return function (v, ctl, out, api) {
      try {
        var h = fn(v, ctl, out, api);
        return (h === undefined || h === null || h === '')
          ? '<div class="mx-bad mtxc-err">No hay nada que mostrar todavía: revisa los datos que has escrito.</div>'
          : h;
      } catch (e) {
        var m = (e && e.message) ? e.message : 'No he podido calcular con estos datos.';
        return '<div class="mx-bad mtxc-err">' + M.esc(m) + '</div>';
      }
    };
  }

  /* Caja con rótulo (>= 16 px, negrita por CSS) y matriz en display,
     con celdas grandes: es el envoltorio estándar del módulo. */
  function caja(label, tex) {
    return '<div class="mtxc-caja">' + M.expr(label, tex) + '</div>';
  }
  function parrafo(html) { return '<p class="mtxc-txt">' + html + '</p>'; }
  function titulo(t) { return '<h5 class="mtxc-h">' + t + '</h5>'; }
  function aviso(html) { return '<p class="mtxc-aviso">' + html + '</p>'; }
  function pista(html) { return '<p class="mtxc-pista"><b>Pista:</b> ' + html + '</p>'; }
  function bien(html) { return '<p class="ap-ok mtxc-bien">' + html + '</p>'; }

  /* Nombre de fila en TeX y en texto llano. */
  function fTex(i) { return 'F_{' + (i + 1) + '}'; }
  function fTxt(i) { return 'F' + (i + 1); }
  /* Pasa los índices de fila de F1/F2 a F₁/F₂ en rótulos de texto llano. */
  var SUB_DIG = { '0': '\u2080', '1': '\u2081', '2': '\u2082', '3': '\u2083', '4': '\u2084',
    '5': '\u2085', '6': '\u2086', '7': '\u2087', '8': '\u2088', '9': '\u2089' };
  function subIndices(s) {
    return String(s).replace(/F(\d)/g, function (_, d) { return 'F' + (SUB_DIG[d] || d); });
  }

  /* ------------------------------------------------------------------
     Lectura de matrices con límites de tamaño y avisos didácticos.
     Se apoya en M.parseMat, que ya admite espacios, comas, tabuladores,
     «;» y saltos de línea, enteros, decimales y fracciones.
     ------------------------------------------------------------------ */
  var EJEMPLO = 'Escribe la matriz por filas: <code>1 2 3; 4 5 6</code> ' +
    '(o una fila por línea).';

  function leeM(txtIn, etiqueta, maxF, maxC) {
    etiqueta = etiqueta || 'la matriz';
    var s = String(txtIn === undefined || txtIn === null ? '' : txtIn).trim();
    if (s === '') {
      throw Error('Escribe ' + etiqueta + ' por filas, separando los elementos con espacios y las ' +
        'filas con «;» o con un salto de línea. Por ejemplo: 1 2 3; 4 5 6.');
    }
    var A = alg().parseMat(s);
    if (maxF && A.f > maxF) {
      throw Error('Este applet trabaja con un máximo de ' + maxF + ' filas y has escrito ' + A.f +
        '. Quita alguna fila: con ' + maxF + ' se ve todo mucho mejor en la pantalla.');
    }
    if (maxC && A.c > maxC) {
      throw Error('Este applet trabaja con un máximo de ' + maxC + ' columnas y has escrito ' + A.c +
        '. Quita alguna columna para que la matriz se vea grande y legible.');
    }
    return A;
  }

  /* Lee UNA sola fila (una matriz 1×n). */
  function leeFila(txtIn, etiqueta, maxC) {
    var A = leeM(txtIn, etiqueta, 1, maxC || 6);
    if (A.f !== 1) {
      throw Error(etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1) + ' es UNA sola fila: ' +
        'escribe sus elementos separados por espacios, por ejemplo 1 2 3.');
    }
    return A.a[0];
  }

  /* Matriz (objeto Mat) construida a partir de varias filas de Frac. */
  function deFilas(filas) { return new (alg().Mat)(filas.map(function (f) { return f.slice(); })); }

  /* TeX de una combinación de filas: 2F_1 - \frac{1}{2}F_3 */
  function combTex(coefs, indices) {
    var s = '', primero = true;
    coefs.forEach(function (c, q) {
      if (c === null || c === undefined || cero(c)) return;
      var idx = indices ? indices[q] : q;
      var ab = negF(c) ? c.opuesto() : new Frac(c.n, c.d);
      var uno = (ab.n === 1n && ab.d === 1n);
      var signo = negF(c) ? (primero ? '-' : ' - ') : (primero ? '' : ' + ');
      s += signo + (uno ? '' : FT(ab)) + fTex(idx);
      primero = false;
    });
    return primero ? '0' : s;
  }
  /* La misma combinación en TEXTO LLANO, para los rótulos de los SVG. */
  function combTxt(coefs, indices) {
    var s = '', primero = true;
    coefs.forEach(function (c, q) {
      if (c === null || c === undefined || cero(c)) return;
      var idx = indices ? indices[q] : q;
      var ab = negF(c) ? c.opuesto() : new Frac(c.n, c.d);
      var uno = (ab.n === 1n && ab.d === 1n);
      var signo = negF(c) ? (primero ? '\u2212' : ' \u2212 ') : (primero ? '' : ' + ');
      s += signo + (uno ? '' : fracTxt(ab)) + fTxt(idx);
      primero = false;
    });
    return primero ? '0' : s;
  }

  /* ------------------------------------------------------------------
     FIGURA 1 · las filas de una matriz, en cajas grandes.
     filas = [{etq:'F1', vals:[Frac…], col, fondo, nota}]
     Todos los rótulos van en TEXTO LLANO (nunca TeX dentro del SVG).
     ------------------------------------------------------------------ */
  function figFilas(filas, opts) {
    opts = opts || {};
    var ncol = 0;
    filas.forEach(function (f) { ncol = Math.max(ncol, f.vals.length); });
    var cw = 106, ch = 64, x0 = 168, y0 = 118, dy = ch + 30;
    var notas = filas.some(function (f) { return !!f.nota; }) ? 320 : 60;
    var W = Math.max(760, x0 + ncol * cw + notas);
    var H = Math.max(480, y0 + filas.length * dy + 96);
    var b = M.rect(2, 2, W - 4, H - 4, '#ffffff', '#e3e9ef', { r: 12, sw: 2 });
    b += M.txt(W / 2, 62, opts.titulo || 'Las filas de la matriz', {
      size: 25, weight: 'bold', fill: COL.azulOsc
    });
    filas.forEach(function (f, i) {
      var y = y0 + i * dy;
      var col = f.col || COL.azul;
      b += M.txt(x0 - 30, y + ch * 0.68, f.etq, {
        size: 23, weight: 'bold', fill: col, anchor: 'end'
      });
      for (var j = 0; j < f.vals.length; j++) {
        b += M.rect(x0 + j * cw + 6, y, cw - 12, ch, f.fondo || '#f7fbff', col, { r: 9, sw: 2.2 });
        b += M.txt(x0 + j * cw + cw / 2, y + ch * 0.68, fracTxt(f.vals[j]), {
          size: 25, weight: 'bold', fill: COL.texto
        });
      }
      if (f.nota) {
        b += M.txt(x0 + f.vals.length * cw + 24, y + ch * 0.68, f.nota, {
          size: 20, weight: 'bold', fill: col, anchor: 'start'
        });
      }
    });
    if (opts.pie) {
      b += M.txt(W / 2, H - 42, opts.pie, { size: 20, weight: 'bold', fill: COL.gris });
    }
    return M.svgWrap(b, W, H, opts.label || 'Filas de una matriz', opts.cap || '');
  }

  /* ------------------------------------------------------------------
     FIGURA 2 · barras comparativas (rango frente a filas y columnas).
     items = [{etq:'filas m', valor:3, col}]
     ------------------------------------------------------------------ */
  function figBarras(items, opts) {
    opts = opts || {};
    var maxv = 1, i;
    items.forEach(function (it) { maxv = Math.max(maxv, it.valor); });
    var x0 = 300, dy = 92, y0 = 128;
    var W = 960;
    var H = Math.max(480, y0 + items.length * dy + 90);
    var largo = W - x0 - 140;
    var b = M.rect(2, 2, W - 4, H - 4, '#ffffff', '#e3e9ef', { r: 12, sw: 2 });
    b += M.txt(W / 2, 62, opts.titulo || 'Comparación', { size: 25, weight: 'bold', fill: COL.azulOsc });
    for (i = 0; i < items.length; i++) {
      var it = items[i];
      var y = y0 + i * dy;
      var w = Math.max(6, largo * it.valor / maxv);
      b += M.txt(x0 - 26, y + 34, it.etq, { size: 21, weight: 'bold', fill: COL.texto, anchor: 'end' });
      b += M.rect(x0, y, largo, 52, '#f4f8fb', COL.guia, { r: 8, sw: 1.4 });
      b += M.rect(x0, y, w, 52, it.col || COL.azul, 'none', { r: 8, op: 0.85 });
      b += M.txt(x0 + w + 22, y + 34, String(it.valor), {
        size: 24, weight: 'bold', fill: it.col || COL.azul, anchor: 'start'
      });
    }
    if (opts.pie) {
      b += M.txt(W / 2, H - 40, opts.pie, { size: 20, weight: 'bold', fill: COL.gris });
    }
    return M.svgWrap(b, W, H, opts.label || 'Barras comparativas', opts.cap || '');
  }

  /* ------------------------------------------------------------------
     FIGURA 3 · recta de casos del parámetro k.
     criticos = [{valor:Frac, rango:int}] (ordenados), generico = int.
     Las posiciones NO son a escala: se reparten a intervalos iguales
     para que los rótulos nunca se pisen.
     ------------------------------------------------------------------ */
  function figRectaK(criticos, generico, kv, letra) {
    letra = letra || 'k';
    var W = 980, H = 480, y = 268;
    var xi = 96, xf = W - 96;
    var b = M.rect(2, 2, W - 4, H - 4, '#ffffff', '#e3e9ef', { r: 12, sw: 2 });
    b += M.txt(W / 2, 62, 'Casos del parámetro ' + letra + ' y rango en cada uno', {
      size: 25, weight: 'bold', fill: COL.azulOsc
    });
    b += M.line(xi, y, xf, y, COL.eje, 3.2);
    b += M.poly([[xf, y], [xf - 20, y - 10], [xf - 20, y + 10]], COL.eje, COL.eje, 1);
    b += M.txt(xf + 4, y - 22, letra, { size: 22, weight: 'bold', fill: COL.eje, anchor: 'end' });

    var n = criticos.length;
    var pos = [], i;
    for (i = 0; i < n; i++) pos.push(xi + (xf - xi) * (i + 1) / (n + 1));

    /* zonas: rango genérico */
    var zonas = [];
    for (i = 0; i <= n; i++) {
      var a = (i === 0) ? xi : pos[i - 1];
      var c = (i === n) ? xf - 24 : pos[i];
      zonas.push((a + c) / 2);
    }
    zonas.forEach(function (x) {
      b += M.txt(x, y + 62, 'rg = ' + generico, { size: 22, weight: 'bold', fill: COL.verde });
    });

    for (i = 0; i < n; i++) {
      b += M.line(pos[i], y - 44, pos[i], y + 22, COL.rojo, 2.6, '6 5');
      b += M.circle(pos[i], y, 11, COL.rojo, '#ffffff', 3);
      b += M.txt(pos[i], y - 58, letra + ' = ' + fracTxt(criticos[i].valor), {
        size: 22, weight: 'bold', fill: COL.rojo
      });
      b += M.txt(pos[i], y - 96, 'rg = ' + criticos[i].rango, {
        size: 22, weight: 'bold', fill: COL.rojo
      });
    }
    if (!n) {
      b += M.txt(W / 2, y - 62, 'no hay ningún valor crítico', {
        size: 22, weight: 'bold', fill: COL.gris
      });
    }

    /* marcador del valor actual del deslizador */
    var xk = null;
    for (i = 0; i < n; i++) if (kv !== null && igF(criticos[i].valor, kv)) xk = pos[i];
    if (xk === null && kv !== null) {
      var z = 0;
      for (i = 0; i < n; i++) if (numF(kv) > numF(criticos[i].valor)) z = i + 1;
      xk = zonas[z];
    }
    if (xk !== null) {
      b += M.poly([[xk, y + 108], [xk - 15, y + 138], [xk + 15, y + 138]], COL.morado, COL.morado, 1);
      b += M.txt(xk, y + 170, letra + ' actual = ' + fracTxt(kv), {
        size: 22, weight: 'bold', fill: COL.morado
      });
    }
    return M.svgWrap(b, W, H, 'Recta de casos del parámetro ' + letra,
      'Los puntos rojos son los valores críticos: en ellos el rango baja. Entre ellos, el rango es el genérico.');
  }

  /* ------------------------------------------------------------------
     Utilidades de escalonado usadas por gaussRango en modo manual.
     ------------------------------------------------------------------ */
  function primerNoNulo(fila) {
    for (var j = 0; j < fila.length; j++) if (!cero(fila[j])) return j;
    return fila.length;              /* fila nula: «pivote en el infinito» */
  }
  function esEscalonada(A) {
    var ant = -1, i;
    for (i = 0; i < A.f; i++) {
      var p = primerNoNulo(A.a[i]);
      if (p === A.c) { ant = A.c; continue; }   /* nula: todo lo que siga debe ser nulo */
      if (p <= ant) return false;
      ant = p;
    }
    return true;
  }
  /* Cuántas parejas de filas están «desordenadas»: mide lo lejos que
     estamos de la forma escalonada. */
  function desorden(A) {
    var d = 0, i, j;
    for (i = 0; i < A.f; i++) {
      for (j = i + 1; j < A.f; j++) {
        var pi = primerNoNulo(A.a[i]), pj = primerNoNulo(A.a[j]);
        if (pj < A.c && pj <= pi) d++;
      }
    }
    return d;
  }
  /* Sugerencia del siguiente movimiento útil hacia la escalonada. */
  function sugerencia(A) {
    var i, j;
    for (i = 0; i < A.f; i++) {
      var pi = primerNoNulo(A.a[i]);
      for (j = i + 1; j < A.f; j++) {
        var pj = primerNoNulo(A.a[j]);
        if (pj === A.c) continue;
        if (pj < pi) {
          return 'la fila ' + (j + 1) + ' empieza antes que la fila ' + (i + 1) + ': cámbialas de sitio con ' +
            K('F_{' + (i + 1) + '} \\leftrightarrow F_{' + (j + 1) + '}') + '.';
        }
        if (pj === pi) {
          var k = A.a[j][pj].entre(A.a[i][pi]);
          return 'haz cero el elemento de la fila ' + (j + 1) + ', columna ' + (pj + 1) + ' con ' +
            K('F_{' + (j + 1) + '} \\to F_{' + (j + 1) + '} - ' + FT(k) + 'F_{' + (i + 1) + '}') + '.';
        }
      }
    }
    return '';
  }

  /* Aplica la operación PROHIBIDA (multiplicar una fila por 0). */
  function porCero(A, i) {
    var B = A.copia(), j;
    for (j = 0; j < B.c; j++) B.a[i][j] = F0();
    return B;
  }

  /* Lista de pasos de Gauss ya formateada, con matrices grandes. */
  function pasosGauss(G, desde) {
    var h = '';
    G.pasos.forEach(function (p, i) {
      if (desde && i < desde) return;
      var cuerpo = (p.op ? '<div class="mtxc-op">' + KD(p.op) + '</div>' : '') +
        '<div class="mtxc-caja">' + KD(alg().matTex(p.M)) + '</div>';
      h += M.paso(i === 0 ? 'inicio' : String(i), '<p>' + p.desc + '</p>' + cuerpo,
        i === 0 ? 'mtxc-paso0' : '');
    });
    return h;
  }

  /* Filas nulas de una matriz (índices desde 0). */
  function filasNulas(A) {
    var out = [], i, j, nula;
    for (i = 0; i < A.f; i++) {
      nula = true;
      for (j = 0; j < A.c; j++) if (!cero(A.a[i][j])) { nula = false; break; }
      if (nula) out.push(i);
    }
    return out;
  }

  /* Escenarios didácticos comunes (matrices con nombre). */
  var ESC = {
    maximo: '1 2 3; 0 1 4; 0 0 5',
    deficiente: '1 2 3; 2 4 6; 1 1 1',
    proporcionales: '1 2 3; 3 6 9',
    combinacion: '1 2 0; 0 1 1; 2 5 1',
    nula: '0 0 0; 0 0 0; 0 0 0',
    cuatro: '1 2 3 4; 2 4 6 8; 1 0 1 0; 3 2 5 4',
    fracciones: '1/2 1 3/2; 1 2 3; 0 1 -1'
  };

  /* ==================================================================
     1 · Tema 1.11 · combinaciones lineales de filas
     ================================================================== */
  R.combFilas = function (node) {
    return M.shell(node, 'Combinaciones lineales de filas',
      'Una <b>combinación lineal</b> de las filas ' + K('F_1') + ' y ' + K('F_2') + ' es una fila del tipo ' +
      K('aF_1 + bF_2') + '. ' + EJEMPLO + ' Aquí cada fila se escribe aparte, con sus elementos separados por ' +
      'espacios (<code>1 2 3</code>); valen enteros (<code>-2</code>), decimales con coma (<code>0,5</code>) y ' +
      'fracciones (<code>3/4</code>). Mueve los deslizadores de ' + K('a') + ' y de ' + K('b') +
      ' para ver nacer la fila resultante elemento a elemento. En el <b>sentido contrario</b>, escribe una ' +
      'tercera fila ' + K('F_3') + ' y el applet averigua si es combinación lineal de las dos primeras y con ' +
      'qué coeficientes exactos. En el applet con parámetro puedes usar <code>k</code>: <code>1 2; k 4</code>.',
      [
        { id: 'f1', label: 'Fila F₁', type: 'text', value: '1 2 3', ancho: '12rem' },
        { id: 'f2', label: 'Fila F₂', type: 'text', value: '2 -1 0', ancho: '12rem' },
        { id: 'a', label: 'Coeficiente a de F₁', type: 'range', min: -5, max: 5, step: 0.5, value: 2, ancho: '13rem' },
        { id: 'b', label: 'Coeficiente b de F₂', type: 'range', min: -5, max: 5, step: 0.5, value: 1, ancho: '13rem' },
        { id: 'f3', label: 'Fila F₃ (¿es combinación de F₁ y F₂?)', type: 'text', value: '4 3 6', ancho: '14rem' },
        chips([
          {
            txt: 'Rango máximo · F₃ independiente', tip: 'las tres filas aportan información nueva',
            set: { f1: '1 2 3', f2: '2 -1 0', f3: '0 0 1', a: 2, b: 1 }
          },
          {
            txt: 'F₃ = 2F₁ + F₂', tip: 'una fila combinación de las otras dos',
            set: { f1: '1 2 3', f2: '2 -1 0', f3: '4 3 6', a: 2, b: 1 }
          },
          {
            txt: 'Filas proporcionales', tip: 'F₂ = 3F₁: solo hay una dirección',
            set: { f1: '1 2 3', f2: '3 6 9', f3: '2 4 6', a: 1, b: 1 }
          },
          {
            txt: 'Combinación nula · a = b = 0', tip: 'la fila nula es la combinación trivial',
            set: { f1: '1 2 3', f2: '2 -1 0', f3: '0 0 0', a: 0, b: 0 }
          },
          {
            txt: 'Coeficientes fraccionarios', tip: 'a = 0,5 y b = -1,5',
            set: { f1: '2 4 6', f2: '1 -1 3', f3: '1/2 7/2 -3/2', a: 0.5, b: -1.5 }
          },
          {
            txt: 'Filas de cuatro elementos', tip: 'la idea no depende del número de columnas',
            set: { f1: '1 0 2 -1', f2: '0 1 1 3', f3: '2 3 7 7', a: 2, b: 3 }
          }
        ])
      ],
      safe(function (v) {
        var f1 = leeFila(v.f1, 'la fila F₁', 6);
        var f2 = leeFila(v.f2, 'la fila F₂', 6);
        if (f1.length !== f2.length) {
          throw Error('Las dos filas deben tener el mismo número de elementos para poder combinarlas: ' +
            'F₁ tiene ' + f1.length + ' y F₂ tiene ' + f2.length + '. Añade o quita elementos, por ejemplo ' +
            'F₁ = 1 2 3 y F₂ = 2 -1 0.');
        }
        var a = FR(String(v.a)), b = FR(String(v.b));
        var n = f1.length, j;

        /* --- sentido directo: aF1 + bF2 --- */
        var res = [];
        for (j = 0; j < n; j++) res.push(a.por(f1[j]).mas(b.por(f2[j])));

        var h = titulo('Sentido directo: construir la combinación ' + K('aF_1 + bF_2'));
        h += parrafo('Las dos filas de partida y los coeficientes elegidos son ' +
          K('a = ' + FT(a)) + ' y ' + K('b = ' + FT(b)) + '. Una combinación lineal se hace ' +
          '<b>columna a columna</b>: cada elemento de la fila nueva sale de los elementos que ocupan ' +
          'ese mismo lugar en ' + K('F_1') + ' y en ' + K('F_2') + '.');
        h += caja('Fila F₁', alg().matTex(deFilas([f1])));
        h += caja('Fila F₂', alg().matTex(deFilas([f2])));
        /* El rótulo de la caja es TEXTO LLANO (expr lo escapa): hay que
           usar combTxt, que ya resuelve el signo («− 3/2» y no «+ -3/2»)
           en lugar de concatenar TeX de FT(). */
        h += caja('Combinación ' + subIndices(combTxt([a, b], [0, 1])),
          combTex([a, b], [0, 1]) + ' = ' + alg().matTex(deFilas([res])));

        var filasTbl = [];
        for (j = 0; j < n; j++) {
          filasTbl.push([
            'columna ' + (j + 1),
            K(FT(f1[j])), K(FT(f2[j])),
            /* Factores y sumandos negativos entre paréntesis:
               «2 \cdot 2 + 1 \cdot (−1) = 3», nunca «2⋅2+1⋅−1=3». */
            K(M.parNegTex(FT(a)) + ' \\cdot ' + M.parNegTex(FT(f1[j])) + ' + ' +
              M.parNegTex(FT(b)) + ' \\cdot ' + M.parNegTex(FT(f2[j])) +
              ' = ' + FT(res[j]))
          ]);
        }
        h += M.tabla(['Posición', 'Elemento de F₁', 'Elemento de F₂', 'Cuenta y resultado'], filasTbl);

        h += figFilas([
          { etq: 'F1', vals: f1, col: COL.azul, nota: 'primera fila' },
          { etq: 'F2', vals: f2, col: COL.teal, nota: 'segunda fila' },
          {
            etq: 'R', vals: res, col: COL.morado, fondo: '#f6f2fb',
            nota: 'R = ' + combTxt([a, b], [0, 1])
          }
        ], {
          titulo: 'La fila R es la combinación lineal de F1 y F2',
          pie: 'a = ' + fracTxt(a) + '   ·   b = ' + fracTxt(b),
          label: 'Combinación lineal de dos filas',
          cap: 'Cada casilla de ' + K('R') + ' se obtiene con los elementos que están en la misma columna de ' +
            K('F_1') + ' y ' + K('F_2') + '.'
        });

        if (cero(a) && cero(b)) {
          h += aviso('Con ' + K('a = b = 0') + ' sale la <b>fila nula</b>. Es la combinación lineal ' +
            '<b>trivial</b>: la fila nula es siempre combinación lineal de cualesquiera otras filas, y por eso ' +
            'una fila de ceros nunca aporta nada al rango.');
        } else if (cero(b)) {
          h += parrafo('Al ser ' + K('b = 0') + ', la combinación es solo un <b>múltiplo</b> de ' + K('F_1') +
            ': todas las filas que se obtienen así son proporcionales entre sí.');
        }

        var prop = null;
        if (!f1.every(cero) && !f2.every(cero)) {
          var q = null, ok = true;
          for (j = 0; j < n; j++) {
            if (cero(f1[j]) && cero(f2[j])) continue;
            if (cero(f1[j]) || cero(f2[j])) { ok = false; break; }
            var t = f2[j].entre(f1[j]);
            if (q === null) q = t; else if (!igF(q, t)) { ok = false; break; }
          }
          if (ok && q !== null) prop = q;
        }
        if (prop) {
          h += aviso('Cuidado: estas dos filas son <b>proporcionales</b>, ' + K('F_2 = ' + FT(prop) + 'F_1') +
            '. Todas sus combinaciones lineales son múltiplos de ' + K('F_1') + ': por muchos coeficientes que ' +
            'pruebes, no saldrá ninguna fila «nueva». Dos filas proporcionales solo aportan rango 1.');
        }

        /* --- sentido inverso: ¿es F3 combinación de F1 y F2? --- */
        var s3 = String(v.f3 === undefined ? '' : v.f3).trim();
        h += titulo('Sentido contrario: dada ' + K('F_3') + ', ¿es combinación lineal de ' + K('F_1') +
          ' y ' + K('F_2') + '?');
        if (s3 === '') {
          h += parrafo('Escribe una tercera fila en el campo <b>Fila F₃</b> (por ejemplo <code>4 3 6</code>) ' +
            'y el applet plantea el sistema ' + K('xF_1 + yF_2 = F_3') + ' y lo resuelve.');
          return h;
        }
        var f3 = leeFila(s3, 'la fila F₃', 6);
        if (f3.length !== n) {
          throw Error('La fila F₃ debe tener el mismo número de elementos que F₁ y F₂ (' + n +
            '), y has escrito ' + f3.length + '. Por ejemplo, con F₁ = 1 2 3 escribe F₃ = 4 3 6.');
        }
        var A3 = deFilas([f1, f2, f3]);
        var C = alg().combFilas(A3, 2);
        var r12 = alg().rango(deFilas([f1, f2]));
        var r123 = alg().rango(A3);

        h += caja('Las tres filas juntas forman la matriz', alg().matTex(A3));
        h += parrafo('Preguntarse si ' + K('F_3') + ' es combinación lineal de ' + K('F_1') + ' y ' + K('F_2') +
          ' es preguntarse si el sistema ' + K('xF_1 + yF_2 = F_3') + ' (una ecuación por columna) ' +
          '<b>tiene solución</b>.');
        if (C.dependiente) {
          h += '<div class="mtxc-tipo">' + M.badge('sí es combinación lineal', 'si') + '</div>';
          h += caja('Relación encontrada', C.tex);
          h += parrafo(M.texifica(C.explicacion));
        } else {
          h += '<div class="mtxc-tipo">' + M.badge('no es combinación lineal', 'no') + '</div>';
          h += parrafo(M.texifica(C.explicacion));
        }
        h += M.kvs([
          'rg de las dos primeras filas = <b>' + r12 + '</b>',
          'rg de las tres filas = <b>' + r123 + '</b>',
          C.dependiente ? 'el rango <b>no sube</b> al añadir F₃' : 'el rango <b>sube</b> al añadir F₃'
        ]);
        h += figFilas([
          { etq: 'F1', vals: f1, col: COL.azul, nota: 'aporta información' },
          { etq: 'F2', vals: f2, col: r12 === 2 ? COL.teal : COL.rojo, nota: r12 === 2 ? 'aporta información' : 'depende de F1' },
          {
            etq: 'F3', vals: f3, col: C.dependiente ? COL.rojo : COL.verde,
            fondo: C.dependiente ? '#fdf3f3' : '#f2fbf4',
            nota: C.dependiente ? combTxt(C.coef.slice(0, 2), [0, 1]) === '0'
              ? 'F3 = fila nula' : 'F3 = ' + combTxt(C.coef.slice(0, 2), [0, 1])
              : 'independiente'
          }
        ], {
          titulo: 'Las tres filas y su relación',
          pie: 'rango de la matriz = ' + r123,
          label: 'Filas dependientes o independientes',
          cap: C.dependiente
            ? 'La fila roja se puede escribir con las otras dos: se puede tachar sin que cambie el rango.'
            : 'Las tres filas son independientes: ninguna se obtiene de las otras.'
        });
        h += parrafo('<b>Idea clave.</b> Añadir a una matriz una fila que es combinación lineal de las que ya ' +
          'están <b>no cambia el rango</b>: esa fila no aporta información nueva. Es exactamente lo que hace el ' +
          'método de Gauss al convertirla en una fila de ceros.');
        return h;
      }));
  };

  /* ==================================================================
     2 · Tema 1.11 · filas dependientes e independientes
     ================================================================== */
  R.dependencia = function (node) {
    return M.shell(node, 'Filas dependientes e independientes',
      EJEMPLO + ' Los elementos pueden ser enteros (<code>-2</code>), decimales con coma (<code>0,5</code>) o ' +
      'fracciones (<code>3/4</code>). El applet dice <b>qué filas son independientes</b> (aportan información ' +
      'nueva), <b>qué filas dependen de otras</b> y escribe la relación en forma de igualdad, del tipo ' +
      K('F_3 = 2F_1 - F_2') + '. Recuerda: un conjunto de filas es <b>dependiente</b> cuando alguna de ellas se ' +
      'puede escribir como combinación lineal de las demás. En el applet con parámetro puedes usar ' +
      '<code>k</code>: <code>1 2; k 4</code>.',
      [
        {
          id: 'A', label: 'Matriz (una fila por línea)', type: 'textarea', rows: 4,
          value: '1 2 0\n0 1 1\n2 5 1', ancho: '17rem'
        },
        { id: 'detalle', label: 'Ver el estudio fila a fila', type: 'check', value: true },
        chips([
          { txt: 'Rango máximo · todas independientes', tip: 'rango 3 con 3 filas', set: { A: ESC.maximo.replace(/; /g, '\n'), detalle: true } },
          { txt: 'Rango deficiente', tip: 'una fila sobra', set: { A: ESC.deficiente.replace(/; /g, '\n'), detalle: true } },
          { txt: 'Filas proporcionales', tip: 'F₂ = 3F₁', set: { A: ESC.proporcionales.replace(/; /g, '\n'), detalle: true } },
          { txt: 'Una fila combinación de las otras dos', tip: 'F₃ = 2F₁ + F₂', set: { A: ESC.combinacion.replace(/; /g, '\n'), detalle: true } },
          { txt: 'Matriz nula', tip: 'rango 0: ninguna fila aporta nada', set: { A: ESC.nula.replace(/; /g, '\n'), detalle: true } },
          { txt: 'Matriz 4×4', tip: 'dos filas dependientes', set: { A: ESC.cuatro.replace(/; /g, '\n'), detalle: true } },
          { txt: 'Con fracciones', tip: 'F₁ = ½F₂', set: { A: ESC.fracciones.replace(/; /g, '\n'), detalle: true } }
        ])
      ],
      safe(function (v) {
        var A = leeM(v.A, 'la matriz', 5, 6);
        var FI = alg().filasIndependientes(A);
        var indep = {}, i;
        FI.indices.forEach(function (k) { indep[k] = true; });
        var depDe = {};
        FI.dependencias.forEach(function (d) { depDe[d.fila] = d; });

        var h = caja('Matriz de partida, de dimensión ' + alg().dimTxt(A), alg().matTex(A));
        h += M.kvs([
          'filas: <b>' + A.f + '</b>',
          'columnas: <b>' + A.c + '</b>',
          'filas independientes: <b>' + FI.rango + '</b>',
          'rango: <b>' + FI.rango + '</b>'
        ]);

        h += titulo('Qué filas aportan información nueva');
        var filasTbl = A.a.map(function (fila, idx) {
          var esInd = !!indep[idx];
          return {
            celdas: [
              K(fTex(idx)),
              K(alg().matTex(deFilas([fila]))),
              esInd ? M.badge('independiente', 'si') : M.badge('dependiente', 'no'),
              esInd
                ? 'no se puede obtener de las filas anteriores'
                : (depDe[idx] ? K(depDe[idx].tex) : 'es combinación lineal de las otras filas')
            ],
            clase: esInd ? 'mtxc-ok' : 'mtxc-ko'
          };
        });
        h += M.tabla(['Fila', 'Elementos', '¿Aporta información?', 'Relación'], filasTbl);

        h += figFilas(A.a.map(function (fila, idx) {
          var esInd = !!indep[idx];
          return {
            etq: fTxt(idx), vals: fila,
            col: esInd ? COL.azul : COL.rojo,
            fondo: esInd ? '#f7fbff' : '#fdf3f3',
            nota: esInd ? 'independiente'
              : (depDe[idx] ? fTxt(idx) + ' = ' + combTxt(depDe[idx].coef, depDe[idx].base) : 'dependiente')
          };
        }), {
          titulo: 'Filas independientes (azul) y dependientes (rojo)',
          pie: 'rango = ' + FI.rango + ' de un máximo posible de ' + Math.min(A.f, A.c),
          label: 'Filas dependientes e independientes',
          cap: 'Las filas rojas se pueden tachar sin que el rango cambie: no dicen nada que no digan las azules.'
        });

        if (v.detalle) {
          h += titulo('Estudio fila a fila');
          h += parrafo('Para cada fila se plantea el sistema «¿existen coeficientes que la escriban con las ' +
            'demás?». Si el sistema tiene solución, la fila es dependiente; si es incompatible, es independiente.');
          A.a.forEach(function (fila, idx) {
            var C = alg().combFilas(A, idx);
            var cuerpo = '<p>' + M.texifica(C.explicacion) + '</p>';
            if (C.dependiente && C.tex) cuerpo += '<div class="mtxc-caja">' + KD(C.tex) + '</div>';
            h += M.paso(fTxt(idx), cuerpo, C.dependiente ? 'mtxc-paso-dep' : 'mtxc-paso-ind');
          });
        }

        h += titulo('Conclusión');
        if (FI.rango === 0) {
          h += aviso('Todas las filas son nulas: la matriz es la <b>matriz nula</b> y su rango es ' + K('0') +
            '. Es el único caso de rango cero.');
        } else if (FI.rango === A.f) {
          h += bien('Las ' + A.f + ' filas son <b>linealmente independientes</b>: ninguna se puede escribir con ' +
            'las otras, así que ' + K('\\operatorname{rg}(A) = ' + FI.rango) + ' es el mayor posible con ' +
            A.f + ' filas.');
        } else {
          h += parrafo('Hay ' + (A.f - FI.rango) + ' fila(s) que <b>sobran</b>: son combinación lineal de las ' +
            'otras. Quedan ' + FI.rango + ' filas independientes, luego ' +
            K('\\operatorname{rg}(A) = ' + FI.rango) + '.');
          h += parrafo('Las filas que forman la «base» elegida por el applet son ' +
            FI.indices.map(function (k) { return K(fTex(k)); }).join(', ') + '. Podrían elegirse otras: lo que ' +
            'no cambia nunca es <b>cuántas</b> filas independientes hay, y ese número es el rango.');
        }
        return h;
      }));
  };

  /* ==================================================================
     3 · Tema 1.12 · rango de una matriz
     ================================================================== */
  R.rango = function (node) {
    return M.shell(node, 'Rango de una matriz',
      'El <b>rango</b> de una matriz es el número de filas linealmente independientes que tiene, y coincide con ' +
      'el número de filas no nulas que quedan al escalonarla. ' + EJEMPLO + ' Valen enteros, decimales con coma ' +
      '(<code>0,5</code>) y fracciones (<code>3/4</code>). El applet escalona, señala las filas que aportan ' +
      'información nueva y las que no, y comprueba la cota ' + K('\\operatorname{rg}(A) \\le \\min(m, n)') +
      '. En el applet con parámetro puedes usar <code>k</code>: <code>1 2; k 4</code>.',
      [
        {
          id: 'A', label: 'Matriz (una fila por línea)', type: 'textarea', rows: 4,
          value: '1 2 3\n2 4 6\n1 1 1', ancho: '17rem'
        },
        { id: 'pasos', label: 'Ver el escalonado paso a paso', type: 'check', value: true },
        chips([
          { txt: 'Rango máximo', tip: 'rango 3 en una 3×3', set: { A: ESC.maximo.replace(/; /g, '\n'), pasos: true } },
          { txt: 'Rango deficiente', tip: 'rango 2 en una 3×3', set: { A: ESC.deficiente.replace(/; /g, '\n'), pasos: true } },
          { txt: 'Filas proporcionales', tip: 'rango 1', set: { A: ESC.proporcionales.replace(/; /g, '\n'), pasos: true } },
          { txt: 'Una fila combinación de dos otras', tip: 'rango 2', set: { A: ESC.combinacion.replace(/; /g, '\n'), pasos: true } },
          { txt: 'Matriz nula', tip: 'rango 0', set: { A: ESC.nula.replace(/; /g, '\n'), pasos: true } },
          { txt: 'Matriz 4×4', tip: 'la cota es 4', set: { A: ESC.cuatro.replace(/; /g, '\n'), pasos: true } },
          { txt: 'Rectangular 2×4', tip: 'el rango no puede pasar de 2', set: { A: '1 2 3 4\n0 1 2 3', pasos: true } }
        ])
      ],
      safe(function (v) {
        var A = leeM(v.A, 'la matriz', 5, 6);
        var P = alg().rangoPasos(A);
        var FI = alg().filasIndependientes(A);
        var cota = Math.min(A.f, A.c);

        var h = caja('Matriz de partida, de dimensión ' + alg().dimTxt(A), alg().matTex(A));
        h += M.resultado(K('\\operatorname{rg}(A) = ' + P.rango), 'rango de la matriz');

        if (v.pasos) {
          h += titulo('Escalonado por el método de Gauss');
          h += parrafo('Se usan solo <b>operaciones elementales de filas</b>, que no cambian el rango: cambiar ' +
            'dos filas de sitio, multiplicar una fila por un número distinto de cero y sumar a una fila un ' +
            'múltiplo de otra (' + K('F_i \\to F_i - kF_j') + ').');
          h += pasosGauss(P.pasos ? { pasos: P.pasos } : { pasos: [] }, 0);
        }
        h += caja('Forma escalonada, con los pivotes marcados',
          alg().matTex(P.fin, { marca: P.pivotes }));
        h += parrafo(M.texifica(P.resumen));

        h += titulo('Qué filas aportan información nueva');
        var indep = {};
        FI.indices.forEach(function (k) { indep[k] = true; });
        var depDe = {};
        FI.dependencias.forEach(function (d) { depDe[d.fila] = d; });
        h += M.tabla(['Fila', '¿Aporta información nueva?', 'Por qué'],
          A.a.map(function (fila, idx) {
            var esInd = !!indep[idx];
            return {
              celdas: [
                K(fTex(idx)),
                esInd ? M.badge('sí', 'si') : M.badge('no', 'no'),
                esInd ? 'es independiente de las demás'
                  : (depDe[idx] ? K(depDe[idx].tex) : 'es combinación lineal de las otras filas')
              ],
              clase: esInd ? 'mtxc-ok' : 'mtxc-ko'
            };
          }));

        h += titulo('El rango frente al número de filas y de columnas');
        h += figBarras([
          { etq: 'filas: m = ' + A.f, valor: A.f, col: COL.azul },
          { etq: 'columnas: n = ' + A.c, valor: A.c, col: COL.teal },
          { etq: 'cota mín(m, n)', valor: cota, col: COL.naranja },
          { etq: 'rango de A', valor: P.rango, col: COL.verde }
        ], {
          titulo: 'El rango nunca pasa de mín(m, n)',
          pie: 'rg(A) = ' + P.rango + '   \u2264   mín(' + A.f + ', ' + A.c + ') = ' + cota,
          label: 'Rango, filas, columnas y cota',
          cap: 'El rango cuenta filas independientes, y no puede haber más de ' + K('m') + ' ni más de ' +
            K('n') + ': de ahí la cota ' + K('\\operatorname{rg}(A) \\le \\min(m,n)') + '.'
        });
        h += M.kvs([
          'filas m = <b>' + A.f + '</b>',
          'columnas n = <b>' + A.c + '</b>',
          'mín(m, n) = <b>' + cota + '</b>',
          'rg(A) = <b>' + P.rango + '</b>',
          'filas nulas al escalonar = <b>' + P.filasNulas.length + '</b>'
        ]);
        if (P.rango === cota) {
          h += bien('El rango es el <b>máximo posible</b> para esta dimensión: ' +
            K('\\operatorname{rg}(A) = \\min(' + A.f + ', ' + A.c + ') = ' + cota) +
            '. Se dice que la matriz tiene <b>rango máximo</b> o rango completo.');
        } else {
          h += aviso('El rango es <b>menor</b> que la cota: ' +
            K('\\operatorname{rg}(A) = ' + P.rango + ' < \\min(' + A.f + ', ' + A.c + ') = ' + cota) +
            '. Eso significa que ' + (A.f - P.rango) + ' fila(s) dependen de las demás.');
        }
        if (A.f === A.c) {
          var d = alg().det(A);
          h += parrafo('Al ser cuadrada de orden ' + A.f + ' se puede mirar también el determinante: ' +
            K('|A| = ' + FT(d)) + '. ' + (cero(d)
              ? 'Como ' + K('|A| = 0') + ', la matriz es <b>singular</b> y su rango es menor que el orden.'
              : 'Como ' + K('|A| \\ne 0') + ', la matriz es <b>regular</b> y su rango es el orden completo, ' +
              K(String(A.f)) + '.'));
        }
        h += parrafo('<b>Idea clave.</b> El rango mide la <b>información realmente distinta</b> que hay en la ' +
          'matriz. Da igual por qué camino se escalone: el número de filas no nulas que quedan es siempre el ' +
          'mismo. En el tema siguiente verás que también coincide con el orden del mayor menor no nulo.');
        return h;
      }));
  };

  /* ==================================================================
     4 · Tema 1.12 · el rango y las operaciones elementales
     ================================================================== */
  R.rangoLab = function (node) {
    var hist = [];

    function op1(hist) { hist.length = 0; }

    return M.shell(node, 'El rango no cambia con las operaciones elementales',
      'Las <b>tres operaciones elementales de filas</b> son: cambiar dos filas de sitio, multiplicar una fila ' +
      'por un número ' + K('k \\ne 0') + ' y sumar a una fila un múltiplo de otra. Ninguna de las tres cambia el ' +
      'rango. Hay una cuarta operación, <b>prohibida</b>: multiplicar una fila por ' + K('0') +
      '. Esa sí puede bajarlo, y por eso no vale. ' + EJEMPLO + ' Las filas se numeran desde 1; el multiplicador ' +
      K('k') + ' admite enteros (<code>3</code>), decimales con coma (<code>0,5</code>), fracciones ' +
      '(<code>3/4</code>) y negativos (<code>-2</code>). Elige la operación y pulsa <b>Aplicar operación</b>; ' +
      'puedes <b>Deshacer</b> o <b>Reiniciar</b>. En el applet con parámetro puedes usar <code>k</code>: ' +
      '<code>1 2; k 4</code>.',
      [
        {
          id: 'A', label: 'Matriz (una fila por línea)', type: 'textarea', rows: 3,
          value: '1 2 3\n2 1 0\n1 1 1', ancho: '17rem'
        },
        {
          id: 'tipo', label: 'Operación', type: 'select', value: 'sumar', ancho: '20rem',
          options: [
            { value: 'sumar', label: 'permitida: Fi → Fi + k·Fj' },
            { value: 'cambiar', label: 'permitida: Fi ↔ Fj' },
            { value: 'multiplicar', label: 'permitida: Fi → k·Fi  (k ≠ 0)' },
            { value: 'cero', label: 'PROHIBIDA: Fi → 0·Fi' }
          ]
        },
        { id: 'i', label: 'Fila Fi', type: 'number', min: 1, max: 5, value: 2, ancho: '7rem' },
        { id: 'j', label: 'Fila Fj', type: 'number', min: 1, max: 5, value: 1, ancho: '7rem' },
        { id: 'k', label: 'Multiplicador k', type: 'text', value: '-2', ancho: '8rem' },
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
          {
            txt: 'Rango máximo · suma de filas', tip: 'F₂ → F₂ − 2F₁ no cambia el rango',
            set: { A: ESC.maximo.replace(/; /g, '\n'), tipo: 'sumar', i: 2, j: 1, k: '-2' }, extra: op1
          },
          {
            txt: 'Rango deficiente', tip: 'rango 2: siga lo que haga, se mantiene',
            set: { A: ESC.deficiente.replace(/; /g, '\n'), tipo: 'sumar', i: 2, j: 1, k: '-2' }, extra: op1
          },
          {
            txt: 'Filas proporcionales', tip: 'rango 1',
            set: { A: ESC.proporcionales.replace(/; /g, '\n'), tipo: 'sumar', i: 2, j: 1, k: '-3' }, extra: op1
          },
          {
            txt: 'Una fila combinación de dos otras', tip: 'F₃ = 2F₁ + F₂',
            set: { A: ESC.combinacion.replace(/; /g, '\n'), tipo: 'sumar', i: 3, j: 1, k: '-2' }, extra: op1
          },
          {
            txt: 'Cambiar dos filas', tip: 'F₁ ↔ F₃',
            set: { A: ESC.maximo.replace(/; /g, '\n'), tipo: 'cambiar', i: 1, j: 3, k: '1' }, extra: op1
          },
          {
            txt: 'Multiplicar por 1/2', tip: 'k ≠ 0: el rango se mantiene',
            set: { A: ESC.maximo.replace(/; /g, '\n'), tipo: 'multiplicar', i: 3, j: 1, k: '1/2' }, extra: op1
          },
          {
            txt: 'PROHIBIDA: multiplicar por 0', tip: 'el rango baja: por eso no vale',
            set: { A: ESC.maximo.replace(/; /g, '\n'), tipo: 'cero', i: 2, j: 1, k: '0' }, extra: op1
          },
          {
            txt: 'Matriz nula', tip: 'rango 0: nada lo cambia',
            set: { A: ESC.nula.replace(/; /g, '\n'), tipo: 'cambiar', i: 1, j: 2, k: '1' }, extra: op1
          },
          {
            txt: 'Matriz 4×4', tip: 'laboratorio más grande',
            set: { A: ESC.cuatro.replace(/; /g, '\n'), tipo: 'sumar', i: 2, j: 1, k: '-2' }, extra: op1
          }
        ])
      ],
      safe(function (v) {
        var A0 = leeM(v.A, 'la matriz', 5, 6);
        var r0 = alg().rango(A0);

        var h = caja('Matriz de partida, de dimensión ' + alg().dimTxt(A0), alg().matTex(A0));
        h += M.resultado(K('\\operatorname{rg} = ' + r0), 'rango de partida');
        h += titulo('Operaciones aplicadas');
        h += parrafo('Cada paso muestra la operación en notación matemática, la matriz que queda y su rango. ' +
          'Fíjate en la última columna: mientras uses las tres operaciones permitidas, el rango <b>no se mueve</b>.');

        var actual = A0.copia();
        var lista = '', avisos = [], huboProhibida = false, filasTbl = [], nOk = 0;

        /* Los avisos NO se acumulan: solo se muestra el de la última
           acción del alumno (el último elemento del historial). Antes se
           reimprimían todos los errores del historial en cada repintado. */
        function anota(idx, msg) {
          avisos.length = 0;
          if (idx === hist.length - 1) avisos.push(msg);
        }

        hist.forEach(function (o, idx) {
          var i = o.i, j = o.j;
          if (!isFinite(i) || i < 0 || i >= actual.f) {
            anota(idx, 'La fila Fi que has elegido (' + (i + 1) + ') no existe: esta matriz tiene ' +
              actual.f + ' filas, numeradas de 1 a ' + actual.f + '.');
            return;
          }
          var antes = alg().rango(actual), res, texOp, desc, prohibida = false;
          if (o.tipo === 'cero') {
            prohibida = true;
            huboProhibida = true;
            res = { M: porCero(actual, i), valida: true };
            texOp = 'F_{' + (i + 1) + '} \\to 0 \\cdot F_{' + (i + 1) + '}';
            desc = 'Operación <b>prohibida</b>: multiplicamos la fila ' + (i + 1) + ' por ' + K('0') +
              ', que la convierte en la fila nula.';
          } else {
            res = alg().opElemental(actual, { tipo: o.tipo, i: i, j: j, k: o.k });
            if (!res.valida) { anota(idx, res.error); return; }
            texOp = res.tex;
            desc = res.desc;
          }
          actual = res.M;
          var despues = alg().rango(actual);
          nOk++;
          lista += M.paso(String(nOk),
            '<p>' + M.texifica(desc) + '</p>' +
            '<div class="mtxc-op">' + KD(texOp) + '</div>' +
            '<div class="mtxc-caja">' + KD(alg().matTex(actual)) + '</div>' +
            '<p>' + (despues === antes
              ? 'Rango antes y después: ' + K(String(antes)) + ' y ' + K(String(despues)) + '. <b>No ha cambiado.</b>'
              : '¡Atención! El rango ha pasado de ' + K(String(antes)) + ' a ' + K(String(despues)) +
              '. Esto solo puede ocurrir con una operación que no es elemental.') + '</p>',
            prohibida ? 'mtxc-paso-mal' : (despues === antes ? 'mtxc-paso-ind' : 'mtxc-paso-mal'));
          filasTbl.push({
            celdas: [
              String(nOk), K(texOp),
              prohibida ? M.badge('prohibida', 'no') : M.badge('permitida', 'si'),
              K(String(antes)) + ' → ' + K(String(despues)),
              despues === antes ? M.badge('el rango se mantiene', 'si') : M.badge('el rango cambia', 'no')
            ],
            clase: despues === antes ? 'mtxc-ok' : 'mtxc-ko'
          });
        });

        if (avisos.length) {
          h += '<ul class="mtxc-avisos"><li>' + avisos.map(function (a) { return M.esc(a); }).join('</li><li>') +
            '</li></ul>';
        }
        h += lista || parrafo('Todavía no has aplicado ninguna operación: elige una en el desplegable, ' +
          'ajusta las filas y el multiplicador, y pulsa <b>Aplicar operación</b>.');

        h += caja('Matriz actual', alg().matTex(actual));
        var rF = alg().rango(actual);
        h += M.kvs([
          'rango de partida = <b>' + r0 + '</b>',
          'rango actual = <b>' + rF + '</b>',
          'operaciones válidas aplicadas = <b>' + nOk + '</b>',
          'filas nulas ahora = <b>' + filasNulas(actual).length + '</b>'
        ]);

        if (filasTbl.length) {
          h += titulo('Resumen: qué le ha pasado al rango');
          h += M.tabla(['Paso', 'Operación', 'Tipo', 'Rango antes → después', '¿Se mantiene?'], filasTbl);
        }

        h += titulo('Las tres permitidas y la prohibida');
        h += M.tabla(['Operación', 'Notación', '¿Cambia el rango?', 'Por qué'], [
          {
            celdas: ['Cambiar dos filas de sitio', K('F_i \\leftrightarrow F_j'), M.badge('no', 'si'),
              'las filas son las mismas, solo están en otro orden: hay las mismas filas independientes'],
            clase: 'mtxc-ok'
          },
          {
            celdas: ['Multiplicar una fila por ' + K('k \\ne 0'), K('F_i \\to kF_i'), M.badge('no', 'si'),
              'la fila nueva y la vieja son proporcionales: una se obtiene de la otra, así que la información es la misma'],
            clase: 'mtxc-ok'
          },
          {
            celdas: ['Sumar a una fila un múltiplo de otra', K('F_i \\to F_i + kF_j'), M.badge('no', 'si'),
              'se puede deshacer restando ' + K('kF_j') + ': las dos matrices tienen las mismas combinaciones lineales de filas'],
            clase: 'mtxc-ok'
          },
          {
            celdas: ['<b>PROHIBIDA</b>: multiplicar una fila por ' + K('0'), K('F_i \\to 0 \\cdot F_i'),
              M.badge('sí, puede bajarlo', 'no'),
              'la fila desaparece (se vuelve nula) y no hay manera de recuperarla: se pierde información'],
            clase: 'mtxc-ko'
          }
        ]);

        if (huboProhibida) {
          h += aviso('Has usado la operación <b>prohibida</b>. Fíjate en lo que ha pasado: al multiplicar una ' +
            'fila por ' + K('0') + ' esa fila se convierte en la fila nula, y ' +
            (rF < r0
              ? 'el rango ha bajado de ' + K(String(r0)) + ' a ' + K(String(rF)) + '.'
              : 'el rango se ha mantenido porque esa fila ya dependía de las otras; pero en general baja.') +
            ' La operación es irreversible: de una fila de ceros no se puede volver atrás. Por eso en la ' +
            'definición se exige ' + K('k \\ne 0') + '.');
        }
        if (rF === r0) {
          h += bien('El rango sigue siendo ' + K(String(r0)) + ': todas las matrices que has ido obteniendo son ' +
            '<b>equivalentes por filas</b> a la de partida.');
        } else {
          h += aviso('El rango ha cambiado (de ' + K(String(r0)) + ' a ' + K(String(rF)) + '): eso delata que ' +
            'alguna de las operaciones aplicadas <b>no era elemental</b>.');
        }
        h += parrafo('<b>Idea clave.</b> Como las tres operaciones permitidas no cambian el rango, se pueden ' +
          'usar libremente para simplificar la matriz. Ese es todo el secreto del método de Gauss: transformar ' +
          'la matriz en otra mucho más fácil, pero con el <b>mismo rango</b>.');
        return h;
      }));
  };

  /* ==================================================================
     5 · Tema 1.13 · método de Gauss para el rango
     ================================================================== */
  R.gaussRango = function (node) {
    var hist = [];
    function limpia() { hist.length = 0; }

    return M.shell(node, 'Método de Gauss para el rango',
      'Escalonar una matriz es conseguir que cada fila empiece con más ceros que la anterior. El número de ' +
      'filas no nulas que quedan es el <b>rango</b>. ' + EJEMPLO + ' Valen enteros, decimales con coma ' +
      '(<code>0,5</code>) y fracciones (<code>3/4</code>). En el <b>modo automático</b> verás todos los pasos ' +
      'con la notación ' + K('F_i \\to F_i - kF_j') + ' y los pivotes marcados. En el <b>modo manual</b> eliges ' +
      'tú la operación (tipo, filas y multiplicador ' + K('k') + '): el applet la valida, la aplica y te avisa ' +
      'si no te acerca a la forma escalonada. Las filas se numeran desde 1. En el applet con parámetro puedes ' +
      'usar <code>k</code>: <code>1 2; k 4</code>.',
      [
        {
          id: 'A', label: 'Matriz (una fila por línea)', type: 'textarea', rows: 4,
          value: '1 2 3\n2 5 8\n3 7 11', ancho: '17rem'
        },
        {
          id: 'modo', label: 'Modo', type: 'select', value: 'auto', ancho: '11rem',
          options: [{ value: 'auto', label: 'automático' }, { value: 'manual', label: 'manual' }]
        },
        {
          id: 'tipo', label: 'Operación (modo manual)', type: 'select', value: 'sumar', ancho: '18rem',
          options: [
            { value: 'sumar', label: 'Fi → Fi + k·Fj' },
            { value: 'cambiar', label: 'Fi ↔ Fj' },
            { value: 'multiplicar', label: 'Fi → k·Fi  (k ≠ 0)' }
          ]
        },
        { id: 'i', label: 'Fila Fi', type: 'number', min: 1, max: 5, value: 2, ancho: '7rem' },
        { id: 'j', label: 'Fila Fj', type: 'number', min: 1, max: 5, value: 1, ancho: '7rem' },
        { id: 'k', label: 'Multiplicador k', type: 'text', value: '-2', ancho: '8rem' },
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
          {
            txt: 'Rango máximo', tip: 'tres pivotes',
            set: { A: ESC.maximo.replace(/; /g, '\n'), modo: 'auto' }, extra: limpia
          },
          {
            txt: 'Rango deficiente · una fila nula', tip: 'rango 2 en una 3×3',
            set: { A: '1 2 3\n2 5 8\n3 7 11', modo: 'auto' }, extra: limpia
          },
          {
            txt: 'Filas proporcionales', tip: 'rango 1',
            set: { A: '1 2 3\n2 4 6\n3 6 9', modo: 'auto' }, extra: limpia
          },
          {
            txt: 'Una fila combinación de dos otras', tip: 'F₃ = 2F₁ + F₂',
            set: { A: ESC.combinacion.replace(/; /g, '\n'), modo: 'auto' }, extra: limpia
          },
          {
            txt: 'Hay que intercambiar filas', tip: 'el primer pivote es 0',
            set: { A: '0 2 1\n1 1 1\n2 -1 3', modo: 'auto' }, extra: limpia
          },
          {
            txt: 'Matriz nula', tip: 'rango 0',
            set: { A: ESC.nula.replace(/; /g, '\n'), modo: 'auto' }, extra: limpia
          },
          {
            txt: 'Matriz 4×4', tip: 'escalonado más largo',
            set: { A: ESC.cuatro.replace(/; /g, '\n'), modo: 'auto' }, extra: limpia
          },
          {
            txt: 'Practicar en manual', tip: 'empieza tú el escalonado',
            set: { A: '1 2 3\n2 5 8\n3 7 11', modo: 'manual', tipo: 'sumar', i: 2, j: 1, k: '-2' },
            extra: limpia
          }
        ])
      ],
      safe(function (v) {
        var A = leeM(v.A, 'la matriz', 5, 6);
        var h = caja('Matriz de partida, de dimensión ' + alg().dimTxt(A), alg().matTex(A));

        if (v.modo === 'auto') {
          var G = alg().gauss(A, { aug: 0 });
          var nulas = filasNulas(G.fin);
          h += titulo('Escalonado automático');
          h += parrafo('En cada paso se hace cero un elemento por debajo de un pivote con la operación ' +
            K('F_i \\to F_i - kF_j') + ', o se intercambian dos filas cuando el pivote sale nulo. Ninguna de esas ' +
            'operaciones cambia el rango.');
          h += pasosGauss(G, 0);
          h += caja('Forma escalonada, con los pivotes marcados',
            alg().matTex(G.fin, { marca: G.pivotes }));

          h += titulo('Los pivotes');
          h += G.pivotes.length
            ? M.tabla(['Pivote', 'Fila', 'Columna', 'Valor'], G.pivotes.map(function (p) {
              return [K('a_{' + (p[0] + 1) + (p[1] + 1) + '}'), 'fila ' + (p[0] + 1),
                'columna ' + (p[1] + 1), K(FT(G.fin.a[p[0]][p[1]]))];
            }))
            : parrafo('No hay ningún pivote: todos los elementos son nulos, así que el rango es ' + K('0') + '.');
          h += parrafo('Un <b>pivote</b> es el primer elemento no nulo de cada fila de la matriz escalonada. ' +
            'El <b>número de pivotes</b> es el rango.');

          h += M.kvs([
            'filas = <b>' + A.f + '</b>',
            'columnas = <b>' + A.c + '</b>',
            'pivotes = <b>' + G.pivotes.length + '</b>',
            'filas nulas = <b>' + nulas.length + '</b>',
            'rg(A) = <b>' + G.rango + '</b>'
          ]);
          h += M.resultado(K('\\operatorname{rg}(A) = ' + G.rango), 'rango de la matriz');
          if (nulas.length) {
            h += parrafo('Han quedado ' + nulas.length + ' fila(s) nula(s) (la fila ' +
              nulas.map(function (i) { return i + 1; }).join(', la fila ') + ' de la matriz escalonada). ' +
              'Cada fila de ceros delata una fila que era <b>combinación lineal</b> de las otras: no aportaba nada.');
          } else {
            h += bien('No ha quedado ninguna fila nula: las ' + A.f + ' filas eran independientes y el rango es ' +
              K(String(G.rango)) + '.');
          }
          h += figFilas(G.fin.a.map(function (fila, idx) {
            var nula = fila.every(cero);
            return {
              etq: 'F' + (idx + 1) + '\u2032', vals: fila,
              col: nula ? COL.rojo : COL.verde,
              fondo: nula ? '#fdf3f3' : '#f2fbf4',
              nota: nula ? 'fila nula: no cuenta' : 'fila con pivote: cuenta'
            };
          }), {
            titulo: 'La matriz escalonada, fila a fila',
            pie: 'rango = número de filas no nulas = ' + G.rango,
            label: 'Filas de la matriz escalonada',
            cap: 'El rango es el número de filas verdes: las que tienen pivote.'
          });
          return h;
        }

        /* -------------------- modo manual -------------------- */
        h += titulo('Modo manual: tú eliges la operación');
        h += parrafo('Elige el tipo de operación, las filas y el multiplicador, y pulsa <b>Aplicar operación</b>. ' +
          'El applet comprueba que la operación es legal (por ejemplo, no deja multiplicar por ' + K('0') +
          ' ni sumar a una fila un múltiplo de ella misma), la aplica y te dice si te has acercado a la forma ' +
          'escalonada. Con <b>Deshacer</b> quitas el último movimiento y con <b>Reiniciar</b> vuelves al principio.');

        var actual = A.copia(), avisos = [], lista = '', nOk = 0;
        var dAnt = desorden(actual);
        /* Un solo aviso: el de la última acción. Sin acumulación. */
        function anota(idx, msg) {
          avisos.length = 0;
          if (idx === hist.length - 1) avisos.push(msg);
        }
        hist.forEach(function (o, idx) {
          if (!isFinite(o.i) || o.i < 0 || o.i >= actual.f) {
            anota(idx, 'La fila Fi elegida (' + (o.i + 1) + ') no existe: esta matriz tiene ' + actual.f +
              ' filas, numeradas de 1 a ' + actual.f + '.');
            return;
          }
          var res = alg().opElemental(actual, { tipo: o.tipo, i: o.i, j: o.j, k: o.k });
          if (!res.valida) { anota(idx, res.error); return; }
          var dPrev = desorden(actual);
          var rPrev = alg().rango(actual);
          actual = res.M;
          var dNue = desorden(actual);
          var rNue = alg().rango(actual);
          nOk++;
          var juicio;
          if (esEscalonada(actual)) {
            juicio = '<span class="mtxc-bien">Con esta operación la matriz ya queda <b>escalonada</b>.</span>';
          } else if (dNue < dPrev) {
            juicio = '<span class="mtxc-bien">Buen movimiento: te has acercado a la forma escalonada.</span>';
          } else {
            juicio = '<span class="mtxc-mal">Ojo: esta operación es legal, pero <b>no te acerca</b> a la forma ' +
              'escalonada (sigue habiendo ' + dNue + ' pareja(s) de filas mal ordenadas). Busca hacer cero un ' +
              'elemento que esté <b>debajo</b> de un pivote.</span>';
          }
          lista += M.paso(String(nOk),
            '<p>' + M.texifica(res.desc) + '</p>' +
            '<div class="mtxc-op">' + KD(res.tex) + '</div>' +
            '<div class="mtxc-caja">' + KD(alg().matTex(actual)) + '</div>' +
            '<p>Rango: ' + K(String(rPrev)) + ' → ' + K(String(rNue)) + ' (las operaciones elementales no lo ' +
            'cambian). ' + juicio + '</p>',
            dNue < dPrev || esEscalonada(actual) ? 'mtxc-paso-ind' : 'mtxc-paso-mal');
        });

        if (avisos.length) {
          h += '<ul class="mtxc-avisos"><li>' + avisos.map(function (a) { return M.esc(a); }).join('</li><li>') +
            '</li></ul>';
        }
        h += lista || parrafo('Todavía no has aplicado ninguna operación: la matriz es la de partida. ' +
          'Prueba con ' + K('F_2 \\to F_2 - 2F_1') + ' escribiendo Fi = 2, Fj = 1 y k = -2.');
        h += caja('Matriz actual', alg().matTex(actual));

        var Gm = alg().gauss(actual, { aug: 0 });
        var nulasM = filasNulas(actual);
        h += M.kvs([
          'operaciones aplicadas = <b>' + nOk + '</b>',
          'rg actual = <b>' + alg().rango(actual) + '</b>',
          'rg de partida = <b>' + alg().rango(A) + '</b>',
          'filas nulas ahora = <b>' + nulasM.length + '</b>',
          'parejas de filas mal ordenadas = <b>' + desorden(actual) + '</b>'
        ]);
        if (esEscalonada(actual)) {
          h += bien('¡La matriz ya está <b>escalonada</b>! Cada fila no nula empieza más a la derecha que la ' +
            'anterior. Cuenta las filas no nulas: ' + K('\\operatorname{rg}(A) = ' + alg().rango(actual)) + '.');
        } else {
          var s = sugerencia(actual);
          h += s ? pista(s) : pista('sigue haciendo ceros por debajo de los pivotes con ' +
            K('F_i \\to F_i - kF_j') + '.');
        }
        h += parrafo('Compara con el resultado del modo automático: pases por donde pases, al escalonar te ' +
          'quedan siempre ' + K(String(Gm.rango)) + ' filas no nulas. El rango <b>no depende del camino</b>.');
        h += M.resultado(K('\\operatorname{rg}(A) = ' + alg().rango(A)), 'rango de la matriz de partida');
        return h;
      }));
  };

  /* ==================================================================
     6 · Tema 1.13 · rango de una matriz con un parámetro
     ================================================================== */
  R.rangoParam = function (node) {
    return M.shell(node, 'Rango de una matriz con un parámetro',
      'Escribe la matriz por filas usando la letra <code>k</code> como parámetro: por ejemplo ' +
      '<code>1 2; k 4</code>, o <code>k 1 1; 1 k 1; 1 1 k</code> (una fila por línea o separadas por «;»). ' +
      'Cada elemento puede ser un número (<code>3</code>, <code>-2</code>, <code>0,5</code>, <code>3/4</code>) ' +
      'o una expresión en ' + K('k') + ' (<code>k</code>, <code>k-1</code>, <code>2k+3</code>, <code>k^2</code>). ' +
      'El applet calcula los <b>valores críticos exactos</b> del parámetro, muestra la <b>tabla de casos</b> con ' +
      'el rango de cada uno y, con el deslizador, te deja mover ' + K('k') + ' para ver <b>el salto del rango</b>.',
      [
        {
          id: 'A', label: 'Matriz con parámetro k (una fila por línea)', type: 'textarea', rows: 3,
          value: 'k 1 1\n1 k 1\n1 1 k', ancho: '18rem'
        },
        { id: 'kv', label: 'Valor de k', type: 'range', min: -4, max: 4, step: 0.5, value: 1, ancho: '15rem' },
        chips([
          { txt: 'Dos valores críticos', tip: '1 k; k 1 → k = 1 y k = -1', set: { A: '1 k\nk 1', kv: 1 } },
          { txt: 'Rango máximo salvo un valor', tip: 'k 1 1; 1 k 1; 1 1 k', set: { A: 'k 1 1\n1 k 1\n1 1 k', kv: 1 } },
          { txt: 'Un único valor crítico', tip: '1 1 1; 1 k 1; 1 1 k', set: { A: '1 1 1\n1 k 1\n1 1 k', kv: 1 } },
          { txt: 'Sin valores críticos', tip: 'el rango no depende de k', set: { A: '1 0 k\n0 1 0', kv: 2 } },
          { txt: 'Filas proporcionales si k = 2', tip: '1 2; k 2k', set: { A: '1 2\nk 2', kv: 2 } },
          { txt: 'Rectangular 2×3', tip: 'la cota es 2', set: { A: '1 2 k\n2 4 2', kv: 1 } },
          { txt: 'Matriz 4×4 con parámetro', tip: 'estudio más largo', set: { A: 'k 1 0 0\n1 k 0 0\n0 0 1 1\n0 0 1 k', kv: 1 } }
        ])
      ],
      safe(function (v) {
        var s = String(v.A === undefined ? '' : v.A).trim();
        if (s === '') {
          throw Error('Escribe la matriz con parámetro por filas, por ejemplo 1 2; k 4, o k 1 1; 1 k 1; 1 1 k. ' +
            'Los elementos pueden ser números o expresiones en k como k-1, 2k+3 o k^2.');
        }
        var P = alg().parseMatParam(s, 'k');
        if (P.f > 4 || P.c > 4) {
          throw Error('Para que el estudio del parámetro sea rápido y legible, este applet admite matrices de ' +
            'hasta 4 filas y 4 columnas, y has escrito una de ' + P.f + '×' + P.c +
            '. Prueba con k 1 1; 1 k 1; 1 1 k.');
        }
        var Q = alg().rangoParam(P, 'k');
        var kv = FR(String(v.kv));
        var Ak = alg().evalMatParam(P, kv);
        var rk = alg().rango(Ak);
        var cota = Math.min(P.f, P.c);

        var h = caja('Matriz con parámetro, de dimensión ' + P.f + ' × ' + P.c, alg().matParamTex(P));
        h += parrafo('La matriz depende de ' + K('k') + ', y su rango también puede depender de ' + K('k') +
          '. La estrategia es siempre la misma: se calcula el rango en el <b>caso general</b> y después se ' +
          'estudian aparte los <b>valores críticos</b>, aquellos en los que se anulan todos los menores del ' +
          'orden alcanzado y el rango baja.');

        h += titulo('Caso general y valores críticos');
        h += M.kvs([
          'rango genérico = <b>' + Q.generico + '</b>',
          'cota mín(m, n) = <b>' + cota + '</b>',
          'valores críticos = <b>' + Q.criticos.length + '</b>'
        ]);
        if (Q.criticos.length) {
          h += caja('Valores críticos del parámetro',
            Q.criticos.map(function (c) { return c.tex; }).join(', \\quad '));
        } else {
          h += bien('Esta matriz <b>no tiene valores críticos</b>: su rango es ' +
            K('\\operatorname{rg}(A) = ' + Q.generico) + ' para <b>cualquier</b> valor de ' + K('k') +
            '. No siempre hay casos que separar: hay que comprobarlo, no suponerlo.');
        }

        h += titulo('Tabla de casos');
        h += M.tabla(['Caso', 'Rango', 'Explicación'], Q.tabla.map(function (t) {
          var suyo = (t.rango === rk) && (
            (t.condicion.indexOf('\\ne') >= 0 || t.condicion.indexOf('\\in') >= 0)
              ? !Q.criticos.some(function (c) { return igF(c.valor, kv); })
              : Q.criticos.some(function (c) { return igF(c.valor, kv) && c.rango === t.rango; })
          );
          return {
            celdas: [M.texifica(t.caso), K('\\operatorname{rg}(A) = ' + t.rango), M.texifica(t.explicacion)],
            clase: suyo ? 'mtxc-ok' : ''
          };
        }));
        h += caja('Resumen de la discusión', Q.tex);

        h += titulo('Mueve k y mira el salto del rango');
        h += parrafo('El deslizador toma valores de ' + K('-4') + ' a ' + K('4') + ' de medio en medio, así que ' +
          'puede caer exactamente sobre un valor crítico o quedarse entre dos. Ahora vale ' +
          K('k = ' + FT(kv)) + '.');
        h += caja('Matriz para k = ' + FT(kv), alg().matTex(Ak));
        h += M.resultado(K('\\operatorname{rg}(A) = ' + rk), 'rango para k = ' + M.nc(numF(kv), 3));
        var esCritico = Q.criticos.some(function (c) { return igF(c.valor, kv); });
        if (esCritico) {
          h += aviso('¡Estás justo en un <b>valor crítico</b>! Para ' + K('k = ' + FT(kv)) + ' el rango baja de ' +
            K(String(Q.generico)) + ' a ' + K(String(rk)) + ': alguna fila se ha vuelto combinación lineal de ' +
            'las otras. Mueve un poco el deslizador y verás que el rango vuelve a subir.');
        } else if (rk === Q.generico) {
          h += bien('Para ' + K('k = ' + FT(kv)) + ' estamos en el <b>caso general</b>: el rango vale ' +
            K(String(Q.generico)) + '. Prueba a poner el deslizador en un valor crítico para ver el salto.');
        } else {
          h += aviso('Para ' + K('k = ' + FT(kv)) + ' el rango es ' + K(String(rk)) +
            ', distinto del genérico ' + K(String(Q.generico)) + '.');
        }

        var FIk = alg().filasIndependientes(Ak);
        if (FIk.dependencias.length) {
          h += parrafo('Con este valor de ' + K('k') + ' hay filas que dependen de otras: ' +
            FIk.dependencias.map(function (d) { return K(d.tex); }).join(', ') + '.');
        }

        h += figRectaK(Q.criticos, Q.generico, kv, 'k');
        h += figFilas(Ak.a.map(function (fila, idx) {
          var esInd = FIk.indices.indexOf(idx) >= 0;
          return {
            etq: fTxt(idx), vals: fila,
            col: esInd ? COL.azul : COL.rojo,
            fondo: esInd ? '#f7fbff' : '#fdf3f3',
            nota: esInd ? 'independiente' : 'depende de las otras'
          };
        }), {
          titulo: 'La matriz para k = ' + fracTxt(kv),
          pie: 'rango = ' + rk,
          label: 'Matriz con el parámetro sustituido',
          cap: 'Al sustituir ' + K('k') + ' por un número concreto la matriz es una matriz corriente, y su rango ' +
            'se calcula como siempre, escalonando.'
        });

        h += parrafo('<b>Cómo se escribe esto en un examen.</b> Primero se calcula el rango en el caso general ' +
          '(buscando un menor no nulo). Después se resuelve la ecuación que anula ese menor: sus soluciones son ' +
          'los valores críticos. Y por último se sustituye cada valor crítico y se recalcula el rango. La ' +
          'respuesta se da siempre por casos, como la tabla de arriba, y hay que <b>justificarla</b>.');
        return h;
      }));
  };

  /* ==================================================================
     7 · cierre del módulo
     ================================================================== */
  M.extraC = true;
  if (M.monta) M.monta();
})();
