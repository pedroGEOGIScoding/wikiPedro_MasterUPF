/* =====================================================================
   pol-applets-b.js · Tema 2 «Polinomios y fracciones algebraicas»
   Ruta: 1-BatxMatesCCSS/polinomios/assets/pol-applets-b.js

   MÓDULO B · apartados 4 y 5:
     4 Ruffini y teorema del resto
         ruffiniPaso · ruffiniVsLarga · teoremaResto ·
         ruffiniEncadenado · ruffiniAxB
     5 Raíces de un polinomio. Propiedades
         raicesEnteras · raizRacionalPQ · multiplicidadGrafica ·
         constructorRaices · vieteNumerico

   Depende del núcleo window.POL (assets/pol-applets.js). Sin librerías
   externas, sin OJS, sin CDN: solo JS de navegador.
   ===================================================================== */
(function () {
  'use strict';
  var S = window.POL;
  if (!S) { console.error('[polinomios] falta pol-applets.js'); return; }
  var R = S.registry;
  var K = S.K, KD = S.KD, P = S.parsePol, T = S.pTex, COL = S.COL;
  var Frac = S.Frac, F0 = function (n, d) { return new Frac(n, d === undefined ? 1 : d); };

  /* ==================================================================
     0 · utilidades locales del módulo
     ================================================================== */

  /* Polinomio x - a a partir de una raíz a (Frac) */
  function binomio(a) { return S.pDe([a.opuesto(), F0(1)]); }

  /* Escritura bonita del divisor x - a: si a es negativo sale x + |a| */
  function divisorTex(a) {
    if (a.n === 0n) return 'x';
    var neg = a.n < 0n;
    var abs = new Frac(neg ? -a.n : a.n, a.d);
    return 'x ' + (neg ? '+' : '-') + ' ' + abs.tex(true);
  }

  /* Lee un polinomio y controla el grado, para que las tablas quepan */
  function leePol(txt, etiqueta, gmax) {
    var p = P(txt, 'x', etiqueta || 'el polinomio P(x)');
    if (S.pEsCero(p)) throw Error('Has escrito el polinomio nulo. Escribe un polinomio con algún término, por ejemplo x^3-4x^2+5x-2.');
    if (S.pGrado(p) > (gmax || 8)) {
      throw Error('En este applet el grado no puede pasar de ' + (gmax || 8) +
        ' para que la tabla se lea bien. Prueba con algo como x^4-1.');
    }
    return p;
  }

  /* Lee una lista de números racionales separados por espacios o comas */
  function leeRaices(txt, max) {
    var s = String(txt || '').trim();
    if (!s) throw Error('Escribe las raíces separadas por espacios. Se admiten enteros y fracciones: 2 -1 1/2');
    var partes = s.split(/[\s;,]+/).filter(Boolean);
    if (!partes.length) throw Error('Escribe al menos una raíz. Ejemplo: 2 -1 1/2');
    if (partes.length > (max || 6)) {
      throw Error('Como máximo ' + (max || 6) + ' raíces (repite una raíz para darle multiplicidad). Ejemplo: 1 1 -2');
    }
    return partes.map(function (t) { return S.fraccionTxt(t, 'La raíz «' + t + '»'); });
  }

  /* Escribe «a + b = c» con signos correctos cuando b es negativo */
  function sumaTex(a, b, c) {
    var neg = b.n < 0n;
    var abs = new Frac(neg ? -b.n : b.n, b.d);
    return a.tex(true) + (neg ? ' - ' : ' + ') + abs.tex(true) + ' = ' + c.tex(true);
  }

  /* Suma de fracciones de una lista */
  function sumaFrac(lista) {
    var s = F0(0);
    lista.forEach(function (f) { s = s.mas(f); });
    return s;
  }
  function prodFrac(lista) {
    var s = F0(1);
    lista.forEach(function (f) { s = s.por(f); });
    return s;
  }

  /* Rango vertical razonable para dibujar un polinomio en [xmin, xmax] */
  function rangoY(p, xmin, xmax) {
    var vals = [], i, y;
    for (i = 0; i <= 400; i++) {
      y = S.pEvalNum(p, xmin + (xmax - xmin) * i / 400);
      if (Number.isFinite(y)) vals.push(Math.abs(y));
    }
    if (!vals.length) return 5;
    vals.sort(function (a, b) { return a - b; });
    var m = vals[Math.floor(vals.length * 0.72)] * 1.8;
    if (!Number.isFinite(m) || m < 1.5) m = 1.5;
    if (m > 400) m = 400;
    return Math.ceil(m);
  }

  /* Gráfica de un polinomio con sus raíces marcadas.
     raices = [{raiz:Frac, mult:n}]                                    */
  function graficaPol(p, raices, cap) {
    var xs = raices.map(function (r) { return r.raiz.val(); });
    var lo = xs.length ? Math.min.apply(null, xs) : -2;
    var hi = xs.length ? Math.max.apply(null, xs) : 2;
    if (hi - lo < 3) { var c = (lo + hi) / 2; lo = c - 2; hi = c + 2; }
    else { lo -= 1; hi += 1; }
    lo = Math.floor(lo); hi = Math.ceil(hi);
    var M = rangoY(p, lo, hi);
    var puntos = raices.map(function (r) {
      return {
        x: r.raiz.val(), y: 0,
        col: r.mult % 2 === 0 ? COL.morado : COL.rojo,
        tex: 'x = ' + r.raiz.tex(true)
      };
    });
    return S.ejes({
      xmin: lo, xmax: hi, ymin: -M, ymax: M, W: 1000, H: 540,
      paso: Math.max(1, Math.round((hi - lo) / 10)),
      pasoY: Math.max(1, Math.round(2 * M / 8)),
      curvas: [{ f: function (x) { return S.pEvalNum(p, x); }, col: COL.azul, label: 'y = P(x)', lx: 700, ly: 70 }],
      puntos: puntos,
      label: 'Gráfica de un polinomio con sus raíces marcadas',
      cap: cap
    }) + S.leyenda([
      [COL.rojo, 'Multiplicidad <b>impar</b>: la gráfica <b>atraviesa</b> el eje X.'],
      [COL.morado, 'Multiplicidad <b>par</b>: la gráfica <b>rebota</b> y no cambia de signo.']
    ]);
  }

  /* ==================================================================
     APARTADO 4 · RUFFINI Y TEOREMA DEL RESTO
     ================================================================== */

  /* ---------------- 4.1 ruffiniPaso -------------------------------- */
  R.ruffiniPaso = function (node) {
    S.shell(node, 'Ruffini paso a paso',
      'Escribe el polinomio con <code>^</code> para los exponentes y sin espacios: <code>4x^3-x^2+3x+1</code>. ' +
      'También admite productos como <code>2x(x-1)^2</code>. En la casilla del divisor escribe solo el número <b>a</b> ' +
      'del divisor $x - a$: si quieres dividir entre $x + 3$, escribe <code>-3</code>. Se admiten fracciones: <code>1/2</code>.',
      [{ id: 'p', type: 'text', label: 'Polinomio P(x)', value: '4x^3-x^2+3x+1', ancho: '22rem' },
      { id: 'a', type: 'text', label: 'Valor de a (divisor x − a)', value: '-2', ancho: '10rem' },
      {
        type: 'presets', list: [
          { label: '4x³−x²+3x+1 ÷ (x+2)', apply: function (c) { c.p.value = '4x^3-x^2+3x+1'; c.a.value = '-2'; } },
          { label: 'x³−4x²+5x−2 ÷ (x−2)', apply: function (c) { c.p.value = 'x^3-4x^2+5x-2'; c.a.value = '2'; } },
          { label: 'x⁴−1 ÷ (x+1) · con huecos', apply: function (c) { c.p.value = 'x^4-1'; c.a.value = '-1'; } },
          { label: '−x⁴+2x³+5x−4 ÷ (x−3)', apply: function (c) { c.p.value = '-x^4+2x^3+5x-4'; c.a.value = '3'; } },
          { label: '2x²−3x+1 ÷ (x−1/2)', apply: function (c) { c.p.value = '2x^2-3x+1'; c.a.value = '1/2'; } }
        ]
      }],
      function (v) {
        var p = leePol(v.p);
        var a = S.fraccionTxt(v.a, 'El valor de a');
        var rf = S.ruffini(p, a);
        var n = rf.arriba.length;

        var h = S.expr('División planteada',
          '\\dfrac{' + T(p) + '}{' + divisorTex(a) + '}');

        h += '<p>Los coeficientes de $P(x)$, ordenados de mayor a menor grado y con un <b>0</b> en cada término que falta, son ' +
          S.kvs(rf.arriba.map(function (c, i) {
            return K('a_{' + (n - 1 - i) + '} = ' + c.tex(true));
          })) + '</p>';

        h += S.ruffiniHTML(p, a);

        var filas = [];
        filas.push(['0', 'Se baja el coeficiente principal', '—',
          K(rf.baja[0].tex(true))]);
        for (var j = 1; j < n; j++) {
          filas.push([
            String(j),
            K(rf.baja[j - 1].tex(true) + ' \\cdot ' + a.tex(true) + ' = ' + rf.sube[j].tex(true)),
            K(sumaTex(rf.arriba[j], rf.sube[j], rf.baja[j])),
            K(rf.baja[j].tex(true)) + (j === n - 1 ? ' ' + S.badge('resto', rf.resto.n === 0n ? 'si' : 'info') : '')
          ]);
        }
        h += S.tabla(['Paso', 'Multiplicas por ' + K(a.tex(true)), 'Sumas la columna', 'Anotas debajo'], filas);

        h += S.expr('Cociente C(x)', T(rf.cociente));
        h += S.expr('Resto R', rf.resto.tex(true));

        var ok = S.pIgual(S.pSuma(S.pMult(rf.cociente, binomio(a)), [rf.resto]), p);
        h += S.expr('Comprobación',
          T(p) + ' = \\left(' + divisorTex(a) + '\\right)\\left(' + T(rf.cociente) + '\\right)' +
          (rf.resto.n === 0n ? '' : ' + \\left(' + rf.resto.tex(true) + '\\right)'));
        h += '<p>' + S.badge(ok ? 'La identidad de la división se cumple' : 'revisa los datos', ok ? 'si' : 'no') +
          ' El grado del cociente es ' + K(String(S.pGrado(rf.cociente))) +
          ', una unidad menos que el del dividendo, y el resto es siempre un número.</p>';
        if (rf.resto.n === 0n) {
          h += '<p>' + S.badge('división exacta', 'si') + ' Como el resto es 0, ' + K(divisorTex(a)) +
            ' es un factor de $P(x)$ y ' + K('x = ' + a.tex(true)) + ' es una raíz.</p>';
        }
        return h;
      });
  };

  /* ---------------- 4.2 ruffiniVsLarga ----------------------------- */
  R.ruffiniVsLarga = function (node) {
    S.shell(node, 'Ruffini frente a la división larga',
      'La misma división hecha de las dos maneras. Escribe el polinomio con <code>^</code> y sin espacios ' +
      '(<code>x^4+4x^2-2x+1</code>) y en la otra casilla el número <b>a</b> del divisor $x - a$ ' +
      '(para dividir entre $x + 5$ escribe <code>-5</code>).',
      [{ id: 'p', type: 'text', label: 'Polinomio P(x)', value: 'x^3+4x^2-2x+1', ancho: '22rem' },
      { id: 'a', type: 'text', label: 'Valor de a (divisor x − a)', value: '-5', ancho: '10rem' },
      {
        type: 'presets', list: [
          { label: 'x³+4x²−2x+1 ÷ (x+5)', apply: function (c) { c.p.value = 'x^3+4x^2-2x+1'; c.a.value = '-5'; } },
          { label: '4x³−x²+3x+1 ÷ (x+2)', apply: function (c) { c.p.value = '4x^3-x^2+3x+1'; c.a.value = '-2'; } },
          { label: 'x⁴+2x³−4x+1 ÷ (x−1)', apply: function (c) { c.p.value = 'x^4+2x^3-4x+1'; c.a.value = '1'; } },
          { label: '3x²+x−1 ÷ (x−1)', apply: function (c) { c.p.value = '3x^2+x-1'; c.a.value = '1'; } }
        ]
      }],
      function (v) {
        var p = leePol(v.p, 'el polinomio P(x)', 6);
        var a = S.fraccionTxt(v.a, 'El valor de a');
        var d = binomio(a);
        var D = S.pDiv(p, d);
        var rf = S.ruffini(p, a);

        var h = S.expr('Divisor', divisorTex(a) + '\\quad\\Rightarrow\\quad a = ' + a.tex(true));
        h += '<h5>División larga, término a término</h5>';
        h += S.divisionLargaHTML(p, d);
        h += '<h5>La misma división con Ruffini, solo con los coeficientes</h5>';
        h += S.ruffiniHTML(p, a);

        var filas = D.pasos.map(function (s, i) {
          return [
            String(i + 1),
            K(s.monoTex),
            K(s.productoTex),
            K(s.restoTex)
          ];
        });
        h += S.tabla(['Paso de la división larga', 'Monomio del cociente', 'Lo que se resta', 'Nuevo dividendo'], filas);

        h += '<p>Cada monomio del cociente de la división larga es exactamente un número de la fila de abajo de Ruffini: ' +
          S.kvs(S.pRecorta(rf.cociente).slice().reverse().map(function (c, i) {
            var g = S.pGrado(rf.cociente) - i;
            return K(c.tex(true) + (g > 0 ? 'x' + (g > 1 ? '^{' + g + '}' : '') : ''));
          })) + '</p>';

        var mismos = S.pIgual(D.q, rf.cociente) && D.r.length === 1 && S.pIgual(D.r, [rf.resto]);
        h += S.expr('Cociente', T(D.q));
        h += S.expr('Resto', T(D.r));
        h += '<p>' + S.badge(mismos ? 'los dos métodos dan lo mismo' : 'atención: no coinciden', mismos ? 'si' : 'no') +
          ' Ruffini no es un método distinto: es la división larga escrita solo con los coeficientes, ' +
          'aprovechando que el divisor es mónico y de grado 1 y cambiando la resta por una suma con el opuesto.</p>';
        return h;
      });
  };

  /* ---------------- 4.3 teoremaResto ------------------------------- */
  R.teoremaResto = function (node) {
    S.shell(node, 'Teorema del resto',
      'Compara el valor numérico $P(a)$ con el resto de dividir entre $x - a$. Escribe el polinomio con ' +
      '<code>^</code> y sin espacios (<code>x^4-3x^3+5x-4</code>) y en la otra casilla el número <b>a</b>. ' +
      'Recuerda: para el divisor $x + 3$ hay que escribir <code>-3</code>.',
      [{ id: 'p', type: 'text', label: 'Polinomio P(x)', value: 'x^4-3x^3+5x-4', ancho: '22rem' },
      { id: 'a', type: 'text', label: 'Valor de a', value: '-3', ancho: '10rem' },
      {
        type: 'presets', list: [
          { label: 'x⁴−3x³+5x−4 en a = −3', apply: function (c) { c.p.value = 'x^4-3x^3+5x-4'; c.a.value = '-3'; } },
          { label: '−3x³+7x²+2x+4 en a = 5', apply: function (c) { c.p.value = '-3x^3+7x^2+2x+4'; c.a.value = '5'; } },
          { label: 'x³+2x−5 en a = 3', apply: function (c) { c.p.value = 'x^3+2x-5'; c.a.value = '3'; } },
          { label: '2x³−3x²−11x+6 en a = 1/2', apply: function (c) { c.p.value = '2x^3-3x^2-11x+6'; c.a.value = '1/2'; } },
          { label: 'x³−4x²+5x−2 en a = 1', apply: function (c) { c.p.value = 'x^3-4x^2+5x-2'; c.a.value = '1'; } }
        ]
      }],
      function (v) {
        var p = leePol(v.p);
        var a = S.fraccionTxt(v.a, 'El valor de a');
        var ev = S.pEval(p, a);
        var rf = S.ruffini(p, a);

        var h = S.expr('Camino 1 · sustituir', 'P\\left(' + a.tex(true) + '\\right) = ' + ev.valor.tex(true));
        h += S.ruffiniHTML(p, a, {
          cap: 'Camino 2: Ruffini. La última casilla de la fila de abajo es el resto.'
        });
        h += S.expr('Camino 2 · dividir', 'R = ' + rf.resto.tex(true));

        var coincide = rf.resto.cmp(ev.valor) === 0;
        h += '<p>' + S.badge(coincide ? 'P(a) = R' : 'no coinciden', coincide ? 'si' : 'no') +
          ' Esto no es casualidad: de la identidad ' +
          '$P(x) = \\left(' + divisorTex(a) + '\\right)\\cdot C(x) + R$, al sustituir $x = ' + a.tex(true) + '$ ' +
          'el primer sumando se anula porque el paréntesis vale 0, y queda $P\\left(' + a.tex(true) + '\\right) = R$.</p>';

        var filas = [], acu = [];
        ev.pasos.forEach(function (c, i) { acu.push([String(i), K(c.tex(true)), K(rf.baja[i].tex(true))]); });
        filas = acu;
        h += S.tabla(['Columna', 'Acumulado al sustituir (Horner)', 'Fila de abajo de Ruffini'], filas);
        h += '<p>Las dos columnas son idénticas: la regla de Ruffini <b>es</b> el método de Horner de evaluar un ' +
          'polinomio. Por eso una sola tabla te da a la vez el valor numérico, el resto y el cociente.</p>';

        h += S.expr('Consecuencia (teorema del factor)',
          '\\left(' + divisorTex(a) + '\\right) \\text{ divide a } P(x) \\iff P\\left(' + a.tex(true) + '\\right) = 0');
        h += '<p>' + S.badge(rf.resto.n === 0n ? 'x = ' + a.txt() + ' es raíz de P(x)' : 'x = ' + a.txt() + ' no es raíz de P(x)',
          rf.resto.n === 0n ? 'si' : 'no') +
          ' ' + (rf.resto.n === 0n
            ? 'La división es exacta y $P(x) = \\left(' + divisorTex(a) + '\\right)\\left(' + T(rf.cociente) + '\\right)$.'
            : 'Como el resto vale ' + K(rf.resto.tex(true)) + ' y no es 0, el binomio no es factor de $P(x)$.') + '</p>';
        return h;
      });
  };

  /* ---------------- 4.4 ruffiniEncadenado -------------------------- */
  R.ruffiniEncadenado = function (node) {
    S.shell(node, 'Ruffini encadenado',
      'Aplica Ruffini una vez y otra sobre el cociente que va saliendo, hasta agotar las raíces racionales. ' +
      'Escribe el polinomio con <code>^</code> y sin espacios: <code>x^4-2x^3-x^2+4x-2</code>. ' +
      'También admite productos como <code>(x-1)^2(x+3)</code>.',
      [{ id: 'p', type: 'text', label: 'Polinomio P(x)', value: 'x^4-2x^3-x^2+4x-2', ancho: '24rem' },
      {
        type: 'presets', list: [
          { label: 'x⁴−2x³−x²+4x−2', apply: function (c) { c.p.value = 'x^4-2x^3-x^2+4x-2'; } },
          { label: 'x³−4x²+5x−2', apply: function (c) { c.p.value = 'x^3-4x^2+5x-2'; } },
          { label: '2x³+3x²−11x−6', apply: function (c) { c.p.value = '2x^3+3x^2-11x-6'; } },
          { label: 'x⁴−1', apply: function (c) { c.p.value = 'x^4-1'; } },
          { label: 'x⁵−x⁴−2x³', apply: function (c) { c.p.value = 'x^5-x^4-2x^3'; } },
          { label: 'x²+x+1 · sin raíces', apply: function (c) { c.p.value = 'x^2+x+1'; } }
        ]
      }],
      function (v) {
        var p = leePol(v.p, 'el polinomio P(x)', 6);
        var q = p, tandas = 0, extraidas = [], h = '';
        h += S.expr('Polinomio de partida', T(p));

        while (S.pGrado(q) > 0 && tandas < 8) {
          var cand = S.candidatosRaiz(q), hallada = null;
          for (var i = 0; i < cand.length; i++) {
            if (S.ruffini(q, cand[i]).resto.n === 0n) { hallada = cand[i]; break; }
          }
          if (!hallada) break;
          var rf = S.ruffini(q, hallada);
          tandas++;
          h += S.paso(tandas, 'Pruebo con ' + K('x = ' + hallada.tex(true)) + ': el resto sale 0, así que ' +
            K(divisorTex(hallada)) + ' es factor.' + S.ruffiniHTML(q, hallada, { cap: '' }) +
            '<p>Nuevo polinomio con el que seguir: ' + K(T(rf.cociente)) + '</p>');
          extraidas.push(hallada);
          q = rf.cociente;
        }

        if (!extraidas.length) {
          h += '<p>' + S.badge('ninguna raíz racional', 'no') +
            ' Ningún candidato $\\dfrac{p}{q}$ anula el polinomio, así que Ruffini no se puede arrancar: ' +
            'este polinomio no tiene factores de grado 1 con coeficientes racionales.</p>';
          return h;
        }

        var factores = extraidas.map(function (a) { return '\\left(' + divisorTex(a) + '\\right)'; }).join('');
        var restoTex = S.pGrado(q) > 0 ? '\\left(' + T(q) + '\\right)' : (S.pIgual(q, S.UNO()) ? '' : T(q));
        h += S.expr('Factorización obtenida', T(p) + ' = ' + factores + restoTex);
        h += '<p>Se han extraído ' + K(String(extraidas.length)) + ' factores de grado 1, uno por cada raíz racional ' +
          'contada con su multiplicidad: ' + S.kvs(extraidas.map(function (a) { return K('x = ' + a.tex(true)); })) + '</p>';
        if (S.pGrado(q) > 0) {
          h += '<p>Lo que queda, ' + K(T(q)) + ', ya no tiene raíces racionales' +
            (S.pGrado(q) === 2 ? ': si quieres saber si tiene raíces reales, resuelve la ecuación de segundo grado con la fórmula habitual.' : '.') +
            ' Ahí es donde Ruffini se detiene.</p>';
        } else {
          h += '<p>El proceso ha terminado con un cociente constante: el polinomio se ha descompuesto por completo ' +
            'en factores de grado 1, luego todas sus raíces son racionales.</p>';
        }
        return h;
      });
  };

  /* ---------------- 4.5 ruffiniAxB --------------------------------- */
  R.ruffiniAxB = function (node) {
    S.shell(node, 'Ruffini con divisor ax − b',
      'Ruffini solo sirve tal cual para divisores $x - a$. Aquí se hace el arreglo para divisores de grado 1 ' +
      'cualesquiera. Escribe el polinomio con <code>^</code> y sin espacios (<code>x^4-5x^2-2x-1</code>) y el ' +
      'divisor completo con su coeficiente (<code>2x-5</code>, <code>3x+1</code>).',
      [{ id: 'p', type: 'text', label: 'Polinomio P(x)', value: 'x^4-5x^2-2x-1', ancho: '22rem' },
      { id: 'd', type: 'text', label: 'Divisor de grado 1', value: '2x-5', ancho: '12rem' },
      {
        type: 'presets', list: [
          { label: 'x⁴−5x²−2x−1 ÷ (2x−5)', apply: function (c) { c.p.value = 'x^4-5x^2-2x-1'; c.d.value = '2x-5'; } },
          { label: '3x⁴−2x³+5x²+4x−1 ÷ (2x+1)', apply: function (c) { c.p.value = '3x^4-2x^3+5x^2+4x-1'; c.d.value = '2x+1'; } },
          { label: 'x³+2x²+5x+7 ÷ (2x+3)', apply: function (c) { c.p.value = 'x^3+2x^2+5x+7'; c.d.value = '2x+3'; } },
          { label: '2x²−3x+1 ÷ (2x−1) · exacta', apply: function (c) { c.p.value = '2x^2-3x+1'; c.d.value = '2x-1'; } }
        ]
      }],
      function (v) {
        var p = leePol(v.p, 'el polinomio P(x)', 6);
        var d = P(v.d, 'x', 'el divisor');
        if (S.pGrado(d) !== 1) {
          throw Error('El divisor debe ser de grado 1, del tipo ax + b. Escribe por ejemplo 2x-5 o 3x+1.');
        }
        var A = S.pLider(d), B = S.pIndep(d);
        var raiz = B.opuesto().entre(A);          /* raíz del divisor: ax + b = 0 */
        var Q = S.pEscala(p, F0(1).entre(A));     /* P(x)/a */
        var rf = S.ruffini(Q, raiz);
        var restoReal = rf.resto.por(A);
        var D = S.pDiv(p, d);

        var h = S.expr('Divisor', T(d) + ' = ' + A.tex(true) + '\\left(x ' +
          (raiz.n < 0n ? '+ ' + new Frac(-raiz.n, raiz.d).tex(true) : '- ' + raiz.tex(true)) + '\\right)');
        h += S.paso(1, 'Escribo el divisor como ' + K(A.tex(true) + '\\left(' + divisorTex(raiz) + '\\right)') +
          '. Su raíz es ' + K('x = ' + raiz.tex(true)) + '.');
        h += S.paso(2, 'Divido todos los coeficientes de $P(x)$ entre ' + K(A.tex(true)) + ': ' +
          KD('\\dfrac{P(x)}{' + A.tex(true) + '} = ' + T(Q)));
        h += S.paso(3, 'Aplico Ruffini a ese polinomio con la raíz ' + K(raiz.tex(true)) + ':' +
          S.ruffiniHTML(Q, raiz, { cap: '' }));
        h += S.paso(4, 'El <b>cociente</b> que sale es ya el correcto: ' + K(T(rf.cociente)) +
          '. El <b>resto</b>, en cambio, ha salido dividido entre ' + K(A.tex(true)) +
          ', así que hay que multiplicarlo: ' + K(rf.resto.tex(true) + ' \\cdot ' + A.tex(true) + ' = ' + restoReal.tex(true)));

        h += S.expr('Cociente', T(rf.cociente));
        h += S.expr('Resto', restoReal.tex(true));

        var ok = S.pIgual(D.q, rf.cociente) && S.pIgual(D.r, [restoReal]);
        h += '<p>' + S.badge(ok ? 'coincide con la división larga' : 'revisa los datos', ok ? 'si' : 'no') +
          ' La división larga da cociente ' + K(T(D.q)) + ' y resto ' + K(T(D.r)) + '.</p>';
        h += '<p>Por qué funciona: de $P(x) = C(x)\\left(' + T(d) + '\\right) + R$ se deduce ' +
          '$\\dfrac{P(x)}{' + A.tex(true) + '} = C(x)\\left(' + divisorTex(raiz) + '\\right) + \\dfrac{R}{' + A.tex(true) + '}$. ' +
          'Al aplicar Ruffini a la izquierda obtienes $C(x)$ intacto y el resto reducido a la ' +
          (A.txt() === '2' ? 'mitad' : 'fracción $\\dfrac{R}{' + A.tex(true) + '}$') + '.</p>';
        h += '<p>Para saber si ' + K(T(d)) + ' es factor de $P(x)$ te basta el valor numérico: ' +
          K('P\\left(' + raiz.tex(true) + '\\right) = ' + S.pEval(p, raiz).valor.tex(true)) +
          '. ' + (restoReal.n === 0n ? 'Vale 0, así que la división es exacta.' : 'No vale 0, así que la división no es exacta.') + '</p>';
        return h;
      });
  };

  /* ==================================================================
     APARTADO 5 · RAÍCES DE UN POLINOMIO
     ================================================================== */

  /* ---------------- 5.1 raicesEnteras ------------------------------ */
  R.raicesEnteras = function (node) {
    S.shell(node, 'Buscador de raíces enteras',
      'Prueba los divisores del término independiente, que son los únicos candidatos a raíz entera. ' +
      'Escribe el polinomio con <code>^</code> y sin espacios: <code>2x^3+3x^2-11x-6</code>. ' +
      'También admite productos como <code>x(x-2)^2</code>.',
      [{ id: 'p', type: 'text', label: 'Polinomio P(x)', value: '2x^3+3x^2-11x-6', ancho: '24rem' },
      {
        type: 'presets', list: [
          { label: '2x³+3x²−11x−6', apply: function (c) { c.p.value = '2x^3+3x^2-11x-6'; } },
          { label: '7x³−23x²+2x+6', apply: function (c) { c.p.value = '7x^3-23x^2+2x+6'; } },
          { label: 'x³−x²−2x+2', apply: function (c) { c.p.value = 'x^3-x^2-2x+2'; } },
          { label: 'x⁴−4x³+4x²−4x+3', apply: function (c) { c.p.value = 'x^4-4x^3+4x^2-4x+3'; } },
          { label: 'x⁴+2x³−3x²−6x', apply: function (c) { c.p.value = 'x^4+2x^3-3x^2-6x'; } },
          { label: 'x²+4 · sin raíces reales', apply: function (c) { c.p.value = 'x^2+4'; } }
        ]
      }],
      function (v) {
        var p = leePol(v.p);
        var E = S.pEntero(p).p;                 /* versión de coeficientes enteros */
        var a0 = S.pIndep(E), an = S.pLider(E);
        var h = S.expr('Polinomio', T(p));

        var kx = 0, tmp = E;
        while (tmp.length > 1 && tmp[kx] && tmp[kx].n === 0n) { kx++; }
        var indepNoNulo = kx > 0 ? E[kx] : a0;

        h += S.kvs([
          K('\\text{grado} = ' + S.pGradoTxt(p)),
          K('a_0 = ' + a0.tex(true)),
          K('a_n = ' + an.tex(true))
        ]);

        if (kx > 0) {
          h += '<p>El término independiente es 0, así que se puede sacar factor común ' + K(kx === 1 ? 'x' : 'x^{' + kx + '}') +
            ' y ' + K('x = 0') + ' ya es raíz (con multiplicidad ' + K(String(kx)) + '). Los demás candidatos salen del ' +
            'siguiente coeficiente no nulo, ' + K(indepNoNulo.tex(true)) + '.</p>';
        }

        var divs = S.divisores(Number(indepNoNulo.n));
        h += '<p>Divisores positivos de ' + K(String(indepNoNulo.n < 0n ? -indepNoNulo.n : indepNoNulo.n)) + ': ' +
          S.kvs(divs.map(function (d) { return K(String(d)); })) +
          ' Con los dos signos, los candidatos enteros son ' +
          K('\\pm ' + divs.join(',\\ \\pm ')) + '.</p>';

        var cand = S.candidatosRaiz(p).filter(function (c) { return c.esEntero(); });
        if (cand.length > 24) cand = cand.slice(0, 24);
        var filas = [], raices = [];
        cand.forEach(function (c) {
          var val = S.pEval(p, c).valor;
          var esRaiz = val.n === 0n;
          if (esRaiz) raices.push(c);
          filas.push({
            clase: esRaiz ? 'pol-fila-si' : '',
            celdas: [K('x = ' + c.tex(true)),
              K('P\\left(' + c.tex(true) + '\\right) = ' + val.tex(true)),
              S.badge(esRaiz ? 'es raíz' : 'no es raíz', esRaiz ? 'si' : 'no'),
              esRaiz ? K('\\left(' + divisorTex(c) + '\\right) \\text{ es factor}') : '—']
          });
        });
        h += S.tabla(['Candidato', 'Valor numérico', '¿Anula el polinomio?', 'Consecuencia'], filas);

        raices.sort(function (a, b) { return a.val() - b.val(); });
        if (raices.length) {
          h += '<p>' + S.badge('raíces enteras encontradas', 'si') + ' ' +
            S.kvs(raices.map(function (r) { return K('x = ' + r.tex(true)); })) + '</p>';
        } else {
          h += '<p>' + S.badge('ninguna raíz entera', 'no') +
            ' Ningún divisor del término independiente anula el polinomio. Puede que tenga raíces ' +
            'fraccionarias, irracionales o ninguna raíz real.</p>';
        }
        h += '<p>Fíjate en que la lista de candidatos es <b>finita</b>: eso es lo que hace útil el criterio. ' +
          'Si $P(x)$ tuviera una raíz entera fuera de esa lista, el término independiente no sería divisible por ella, ' +
          'lo que es imposible.</p>';
        return h;
      });
  };

  /* ---------------- 5.2 raizRacionalPQ ----------------------------- */
  R.raizRacionalPQ = function (node) {
    S.shell(node, 'Criterio de la raíz racional',
      'Cuando el coeficiente principal no es $\\pm 1$ aparecen candidatos fraccionarios $\\dfrac{p}{q}$: ' +
      '$p$ divisor del término independiente y $q$ divisor del coeficiente principal. Escribe el polinomio con ' +
      '<code>^</code> y sin espacios: <code>2x^4-7x^3+11x^2-4x-3</code>.',
      [{ id: 'p', type: 'text', label: 'Polinomio P(x)', value: '2x^4-7x^3+11x^2-4x-3', ancho: '26rem' },
      {
        type: 'presets', list: [
          { label: '2x⁴−7x³+11x²−4x−3', apply: function (c) { c.p.value = '2x^4-7x^3+11x^2-4x-3'; } },
          { label: '2x³−3x²−11x+6', apply: function (c) { c.p.value = '2x^3-3x^2-11x+6'; } },
          { label: '6x²−x−2', apply: function (c) { c.p.value = '6x^2-x-2'; } },
          { label: '5x⁴−3x²+2x+2', apply: function (c) { c.p.value = '5x^4-3x^2+2x+2'; } },
          { label: '4x²−1', apply: function (c) { c.p.value = '4x^2-1'; } },
          { label: 'x³−2 · raíz irracional', apply: function (c) { c.p.value = 'x^3-2'; } }
        ]
      }],
      function (v) {
        var p = leePol(v.p);
        var E = S.pEntero(p).p;
        var a0 = S.pIndep(E), an = S.pLider(E);
        var n0 = Number(a0.n < 0n ? -a0.n : a0.n), nn = Number(an.n < 0n ? -an.n : an.n);
        var h = S.expr('Polinomio con coeficientes enteros', T(E));
        if (!S.pIgual(E, p)) {
          h += '<p>Los coeficientes de partida no eran enteros: se ha multiplicado por el mínimo común múltiplo de los ' +
            'denominadores. Eso no cambia las raíces, porque multiplicar por un número no nulo no crea ni destruye ceros.</p>';
        }
        var Dp = n0 === 0 ? [1] : S.divisores(n0);
        var Dq = S.divisores(nn);
        h += S.tabla(['Papel', 'Coeficiente', 'Divisores positivos'], [
          ['Numerador p', K('a_0 = ' + a0.tex(true)), S.kvs(Dp.map(function (d) { return K(String(d)); }))],
          ['Denominador q', K('a_n = ' + an.tex(true)), S.kvs(Dq.map(function (d) { return K(String(d)); }))]
        ]);
        h += S.expr('Candidatos', 'x = \\pm\\dfrac{p}{q},\\quad p \\mid ' + n0 + ',\\quad q \\mid ' + nn);

        var cand = S.candidatosRaiz(p);
        var recorte = false;
        if (cand.length > 26) { cand = cand.slice(0, 26); recorte = true; }
        var filas = [], raices = [];
        cand.forEach(function (c) {
          var val = S.pEval(p, c).valor;
          var esRaiz = val.n === 0n;
          if (esRaiz) raices.push(c);
          filas.push([K(c.tex(true)),
            c.esEntero() ? 'entero' : 'fraccionario',
            K('P\\left(' + c.tex(true) + '\\right) = ' + val.tex(true)),
            S.badge(esRaiz ? 'raíz' : 'no', esRaiz ? 'si' : 'no')]);
        });
        h += S.tabla(['Candidato ' + K('\\frac{p}{q}'), 'Tipo', 'Valor numérico', '¿Raíz?'], filas);
        if (recorte) h += '<p>Se muestran los 26 primeros candidatos ordenados de menor a mayor.</p>';

        if (raices.length) {
          h += '<p>' + S.badge('raíces racionales', 'si') + ' ' +
            S.kvs(raices.map(function (r) { return K('x = ' + r.tex(true)); })) +
            ' Cada una aporta un factor: ' +
            K(raices.map(function (r) { return '\\left(' + divisorTex(r) + '\\right)'; }).join('')) + '</p>';
        } else {
          h += '<p>' + S.badge('ninguna raíz racional', 'no') +
            ' El polinomio puede tener raíces reales, pero entonces serán irracionales: no hay ninguna fracción que lo anule.</p>';
        }
        h += '<p>Observa el papel del coeficiente principal: si vale ' + K('\\pm 1') + ', el único divisor posible de $q$ ' +
          'es 1 y todas las raíces racionales son forzosamente enteras. En cuanto $a_n$ crece, la lista de candidatos se alarga.</p>';
        return h;
      });
  };

  /* ---------------- 5.3 multiplicidadGrafica ----------------------- */
  R.multiplicidadGrafica = function (node) {
    S.shell(node, 'Multiplicidad y forma de la gráfica',
      'Escribe el polinomio en forma factorizada o desarrollada, con <code>^</code> y sin espacios: ' +
      '<code>(x-1)^2(x+2)</code> o <code>x^3-3x+2</code>. El applet detecta cada raíz racional, su ' +
      'multiplicidad y dibuja la curva.',
      [{ id: 'p', type: 'text', label: 'Polinomio P(x)', value: '(x-1)^2(x+2)', ancho: '24rem' },
      {
        type: 'presets', list: [
          { label: '(x−1)²(x+2) · rebote y corte', apply: function (c) { c.p.value = '(x-1)^2(x+2)'; } },
          { label: '(x+1)(x−1)(x−2) · tres cortes', apply: function (c) { c.p.value = '(x+1)(x-1)(x-2)'; } },
          { label: '(x−1)³ · corte suave', apply: function (c) { c.p.value = '(x-1)^3'; } },
          { label: 'x²(x−2)² · dos rebotes', apply: function (c) { c.p.value = 'x^2(x-2)^2'; } },
          { label: '−(x+2)(x−1)² · líder negativo', apply: function (c) { c.p.value = '-(x+2)(x-1)^2'; } },
          { label: 'x²+1 · sin cortes', apply: function (c) { c.p.value = 'x^2+1'; } }
        ]
      }],
      function (v) {
        var p = leePol(v.p, 'el polinomio P(x)', 6);
        var Fz = S.factorizaPol(p);
        var lista = [];
        if (Fz.xk) lista.push({ raiz: F0(0), mult: Fz.xk });
        (Fz.lineales || []).forEach(function (L) { lista.push({ raiz: L.raiz, mult: L.mult }); });
        lista.sort(function (a, b) { return a.raiz.val() - b.raiz.val(); });

        var h = S.expr('Polinomio desarrollado', T(p));
        h += S.expr('Forma factorizada', S.factorizaTexPol(Fz));

        if (!lista.length) {
          h += '<p>' + S.badge('sin raíces racionales', 'no') +
            ' La gráfica de este polinomio no corta al eje X en ningún punto de coordenada racional.</p>';
          h += graficaPol(p, [], 'La curva no toca el eje X en ninguna raíz racional.');
          return h;
        }

        var filas = lista.map(function (L) {
          var par = L.mult % 2 === 0;
          return [K('x = ' + L.raiz.tex(true)),
            K(S.potTex(S.factorLinTex(L.raiz), L.mult)),
            String(L.mult),
            par ? 'par' : 'impar',
            S.badge(par ? 'rebote (toca y vuelve)' : 'corte (atraviesa)', par ? 'info' : 'si'),
            par ? 'no cambia de signo' : 'cambia de signo'];
        });
        h += S.tabla(['Raíz', 'Factor', 'Multiplicidad', 'Paridad', 'Comportamiento', 'Signo de P(x)'], filas);

        var suma = lista.reduce(function (s, L) { return s + L.mult; }, 0);
        h += '<p>La suma de las multiplicidades de las raíces racionales es ' + K(String(suma)) +
          ' y el grado del polinomio es ' + K(String(S.pGrado(p))) + '. ' +
          (suma === S.pGrado(p)
            ? 'Coinciden: todas las raíces son racionales y el polinomio se descompone del todo en factores de grado 1.'
            : 'La diferencia, ' + K(String(S.pGrado(p) - suma)) + ', corresponde a factores sin raíces racionales.') + '</p>';

        h += graficaPol(p, lista,
          'Cada raíz está marcada sobre el eje X. Fíjate en la diferencia entre atravesar y rebotar.');
        h += '<p>Razón: junto a una raíz $a$ de multiplicidad $m$ se puede escribir $P(x) = (x-a)^m\\,Q(x)$ con ' +
          '$Q(a) \\neq 0$. El factor $(x-a)^m$ cambia de signo al pasar por $a$ solo si $m$ es impar; si $m$ es par ' +
          'es siempre positivo y la curva se queda del mismo lado del eje.</p>';
        return h;
      });
  };

  /* ---------------- 5.4 constructorRaices -------------------------- */
  R.constructorRaices = function (node) {
    S.shell(node, 'Construir un polinomio a partir de sus raíces',
      'Escribe las raíces separadas por espacios; repite una raíz para darle multiplicidad. Se admiten enteros ' +
      'y fracciones: <code>2 -1 1/2</code> o <code>1 1 -3</code>. En la otra casilla elige el coeficiente ' +
      'principal $k$ (un entero distinto de 0).',
      [{ id: 'r', type: 'text', label: 'Raíces', value: '2 -1 1/2', ancho: '18rem' },
      { id: 'k', type: 'number', label: 'Coeficiente principal k', value: 1, min: -6, max: 6, step: 1 },
      {
        type: 'presets', list: [
          { label: 'raíces 2, −1, 1/2', apply: function (c) { c.r.value = '2 -1 1/2'; c.k.value = 1; } },
          { label: 'raíz doble: 1, 1, −3', apply: function (c) { c.r.value = '1 1 -3'; c.k.value = 1; } },
          { label: '0, 2, −2 con k = 3', apply: function (c) { c.r.value = '0 2 -2'; c.k.value = 3; } },
          { label: 'raíz triple: −1, −1, −1', apply: function (c) { c.r.value = '-1 -1 -1'; c.k.value = 1; } },
          { label: '1/2, 1/2 con k = 4', apply: function (c) { c.r.value = '1/2 1/2'; c.k.value = 4; } },
          { label: 'k negativo: 3, −1 con k = −2', apply: function (c) { c.r.value = '3 -1'; c.k.value = -2; } }
        ]
      }],
      function (v) {
        var raices = leeRaices(v.r, 5);
        var k = S.entero(v.k, -6, 6, 'El coeficiente principal');
        if (k === 0) throw Error('El coeficiente principal no puede ser 0: entonces no habría polinomio, sino el polinomio nulo.');

        var p = S.pDe([F0(k)]);
        raices.forEach(function (a) { p = S.pMult(p, binomio(a)); });

        /* recuento de multiplicidades */
        var mapa = [];
        raices.forEach(function (a) {
          var y = null;
          mapa.forEach(function (m) { if (m.raiz.cmp(a) === 0) y = m; });
          if (y) y.mult++; else mapa.push({ raiz: a, mult: 1 });
        });
        mapa.sort(function (a, b) { return a.raiz.val() - b.raiz.val(); });

        var factores = mapa.map(function (m) {
          return S.potTex('\\left(' + divisorTex(m.raiz) + '\\right)', m.mult);
        }).join('');
        var h = S.expr('Forma factorizada', 'P(x) = ' + (k === 1 ? '' : (k === -1 ? '-' : k + '\\,')) + factores);
        h += S.expr('Forma desarrollada', 'P(x) = ' + T(p));

        var filas = mapa.map(function (m) {
          return [K('x = ' + m.raiz.tex(true)), String(m.mult),
            K('P\\left(' + m.raiz.tex(true) + '\\right) = ' + S.pEval(p, m.raiz).valor.tex(true)),
            m.mult % 2 === 0 ? 'rebote' : 'corte'];
        });
        h += S.tabla(['Raíz', 'Multiplicidad', 'Comprobación', 'En la gráfica'], filas);

        h += S.kvs([
          K('\\text{grado} = ' + S.pGrado(p)),
          K('a_n = ' + S.pLider(p).tex(true)),
          K('a_0 = ' + S.pIndep(p).tex(true))
        ]);
        h += '<p>El grado es igual al número de raíces contadas con su multiplicidad, y el término independiente vale ' +
          K('P(0) = ' + S.pIndep(p).tex(true)) + '. Cambiar $k$ estira o refleja la curva, pero <b>no mueve las raíces</b>: ' +
          'los puntos de corte con el eje X son los mismos.</p>';

        h += graficaPol(p, mapa, 'Los puntos rojos y morados son las raíces que has elegido.');
        h += '<p>Cualquier otro polinomio con exactamente esas raíces y esas multiplicidades es un múltiplo de este: ' +
          'las raíces determinan el polinomio salvo el factor constante.</p>';
        return h;
      });
  };

  /* ---------------- 5.5 vieteNumerico ------------------------------ */
  R.vieteNumerico = function (node) {
    S.shell(node, 'Relaciones de Cardano-Viète',
      'Comprueba numéricamente que la suma y el producto de las raíces se leen en los coeficientes. ' +
      'Escribe el polinomio con <code>^</code> y sin espacios: <code>x^3-6x^2+11x-6</code>. ' +
      'También admite productos como <code>(x-1)(x-2)(x-3)</code>.',
      [{ id: 'p', type: 'text', label: 'Polinomio P(x)', value: 'x^3-6x^2+11x-6', ancho: '24rem' },
      {
        type: 'presets', list: [
          { label: 'x³−6x²+11x−6', apply: function (c) { c.p.value = 'x^3-6x^2+11x-6'; } },
          { label: 'x²−5x+6', apply: function (c) { c.p.value = 'x^2-5x+6'; } },
          { label: '2x²−8x+6 · líder 2', apply: function (c) { c.p.value = '2x^2-8x+6'; } },
          { label: '(x−1)²(x+2) · raíz doble', apply: function (c) { c.p.value = '(x-1)^2(x+2)'; } },
          { label: 'x²−2 · raíces irracionales', apply: function (c) { c.p.value = 'x^2-2'; } },
          { label: 'x²+x+1 · raíces no reales', apply: function (c) { c.p.value = 'x^2+x+1'; } }
        ]
      }],
      function (v) {
        var p = leePol(v.p, 'el polinomio P(x)', 6);
        var n = S.pGrado(p);
        if (n < 1) throw Error('Escribe un polinomio de grado 1 o mayor: un número solo no tiene raíces. Ejemplo: x^2-5x+6');
        var an = S.pLider(p), an1 = p[n - 1] || F0(0), a0 = S.pIndep(p);

        var teoSuma = an1.entre(an).opuesto();
        var teoProd = a0.entre(an);
        if (n % 2 === 1) teoProd = teoProd.opuesto();

        var h = S.expr('Polinomio', T(p) + '\\quad (\\text{grado } ' + n + ')');
        h += S.expr('Lo que predicen las relaciones',
          '\\sum x_i = -\\dfrac{a_{n-1}}{a_n} = ' + teoSuma.tex(true) +
          '\\qquad \\prod x_i = (-1)^{' + n + '}\\dfrac{a_0}{a_n} = ' + teoProd.tex(true));

        var RR = S.raicesRacionales(p), lista = [], filas = [];
        RR.raices.forEach(function (r) {
          for (var i = 0; i < r.mult; i++) lista.push(r.raiz);
          filas.push([K('x = ' + r.raiz.tex(true)), 'racional', String(r.mult)]);
        });
        var resto = RR.resto, exacto = true, sumaRes = F0(0), prodRes = F0(1), aviso = '';

        if (S.pGrado(resto) === 1) {
          var rr = S.pIndep(resto).entre(S.pLider(resto)).opuesto();
          lista.push(rr);
          filas.push([K('x = ' + rr.tex(true)), 'racional', '1']);
        } else if (S.pGrado(resto) === 2) {
          var A = S.pLider(resto), Bc = resto[1], Cc = S.pIndep(resto);
          sumaRes = Bc.entre(A).opuesto();
          prodRes = Cc.entre(A);
          var disc = Bc.por(Bc).menos(F0(4).por(A).por(Cc));
          var tipo = disc.val() > 0 ? 'irracionales conjugadas' : (disc.val() === 0 ? 'racional doble' : 'no reales (complejas conjugadas)');
          filas.push([K('\\text{raíces de } ' + T(resto)), tipo, '2']);
          aviso = 'Del factor ' + K(T(resto)) + ' no hace falta calcular las raíces una a una: su suma vale ' +
            K(sumaRes.tex(true)) + ' y su producto ' + K(prodRes.tex(true)) +
            ', porque las relaciones también se aplican a ese factor de grado 2. Son ' + tipo + '.';
        } else if (S.pGrado(resto) > 2) {
          exacto = false;
        }

        h += S.tabla(['Raíz o factor', 'Tipo', 'Multiplicidad'], filas);
        if (aviso) h += '<p>' + aviso + '</p>';

        if (!exacto) {
          h += '<p>' + S.badge('comprobación parcial', 'info') +
            ' Queda el factor ' + K(T(resto)) + ', de grado mayor que 2, cuyas raíces no sabemos calcular a mano. ' +
            'Las relaciones siguen siendo verdaderas: hablan de <b>todas</b> las raíces, contando las no reales.</p>';
          return h;
        }

        var suma = sumaFrac(lista).mas(sumaRes);
        var prod = prodFrac(lista).por(prodRes);
        var okS = suma.cmp(teoSuma) === 0, okP = prod.cmp(teoProd) === 0;

        h += S.tabla(['Relación', 'Calculado con las raíces', 'Leído en los coeficientes', '¿Coincide?'], [
          ['Suma', K(suma.tex(true)), K('-\\dfrac{a_{n-1}}{a_n} = ' + teoSuma.tex(true)), S.badge(okS ? 'sí' : 'no', okS ? 'si' : 'no')],
          ['Producto', K(prod.tex(true)), K('(-1)^{' + n + '}\\dfrac{a_0}{a_n} = ' + teoProd.tex(true)), S.badge(okP ? 'sí' : 'no', okP ? 'si' : 'no')]
        ]);
        h += '<p>De dónde sale: si $x_1, \\ldots, x_n$ son todas las raíces, entonces ' +
          '$P(x) = a_n (x - x_1)\\cdots(x - x_n)$. Al desarrollar ese producto, el coeficiente de $x^{n-1}$ es ' +
          '$-a_n(x_1 + \\cdots + x_n)$ y el término independiente es $a_n(-1)^n x_1 \\cdots x_n$. Igualando con los ' +
          'coeficientes de $P(x)$ salen las dos relaciones.</p>';
        h += '<p>Uso práctico: sirven de <b>control de errores</b>. Si buscabas dos números que sumen ' +
          K(teoSuma.tex(true)) + ' y multipliquen ' + K(teoProd.tex(true)) + ' y tus raíces no cumplen eso, ' +
          'la factorización está mal.</p>';
        return h;
      });
  };

  S.extraB = true;
})();
