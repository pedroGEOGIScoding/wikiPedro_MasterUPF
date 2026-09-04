/* =====================================================================
   sys-applets-c.js · Módulo C del Tema 4 «Sistemas de ecuaciones e
   inecuaciones» · 1.º de Bachillerato · Matemáticas Aplicadas a las CCSS
   Ruta: 1-BatxMatesCCSS/sistemas-ecuaciones-inecuaciones/assets/sys-applets-c.js

   Cubre los apartados 4.12, 4.13 y 4.14:

     4.12 · Sistemas de inecuaciones lineales y su interpretación gráfica
        - semiplano   : una inecuación a x + b y <= c es un semiplano.
                        Recta frontera continua o discontinua según el
                        signo, punto de prueba editable con veredicto y
                        sombreado del semiplano que corresponde.
        - recinto     : hasta cinco inecuaciones (una por línea) cuyo
                        recinto factible se dibuja como intersección de
                        semiplanos, con la tabla de vértices EXACTOS, el
                        aviso de recinto vacío o no acotado y la
                        comprobación de un punto inecuación a inecuación.
        - optimiza    : función objetivo F = p x + q y evaluada en cada
                        vértice del recinto (valor exacto con fracciones),
                        máximo y mínimo destacados y recta de nivel
                        F = k deslizante dibujada sobre el recinto.

     4.13 · Sistemas de ecuaciones no lineales
        - noLinealGraf: recta con parábola, recta con circunferencia,
                        hipérbola x y = k y dos cónicas. Dibuja las dos
                        curvas, marca los cortes y cuenta las soluciones.
        - noLinealPaso: resolución por sustitución con TODOS los pasos,
                        comprobación de cada par en las dos ecuaciones y
                        descarte razonado de las soluciones que el
                        contexto no admite (longitudes negativas, etc.).

     4.14 · Práctica del tema
        - autoevaluacion: generador aleatorio con SEMILLA VISIBLE y ocho
                        tipos de cuestión de todo el tema (clasificar un
                        sistema, resolver un 2×2, Gauss 3×3, rango,
                        recinto, sistema no lineal, semiplano y problema
                        contextualizado), con corrección inmediata,
                        explicación completa y contador de aciertos.
        - diagnostico : informa de qué módulos han cargado (capa lineal y
                        módulos A, B y C) y ejecuta comprobaciones
                        internas del motor, mostrando una tabla de
                        resultados y los avisos registrados.

   ---------------------------------------------------------------------
   Dependencias
   ---------------------------------------------------------------------
   Se carga DESPUÉS de:
     assets/sys-applets.js       (núcleo window.SYS: shell, Frac, KaTeX,
                                  tabla, paso, expr, badge, kvs, SVG…)
     assets/sys-applets-lin.js   (capa lineal: parseInec, parseInecs,
                                  inecTex, cumple, vertices,
                                  recintoAcotado, evalObjetivo, plano,
                                  corte, curva, noLineal, discute,
                                  resuelve, gauss, rango, det, cramer,
                                  sustitucion, igualación, reducción…)

   Este módulo NO redefine ninguna de esas utilidades: solo las usa y
   registra sus siete applets en S.registry. Toda la aritmética que se
   muestra al alumno es exacta (fracciones con BigInt, S.Frac); la coma
   flotante aparece únicamente al dibujar y al comprobar de forma
   aproximada las soluciones irracionales.

   ---------------------------------------------------------------------
   Cómo se escriben las entradas (se repite en la ayuda de cada applet)
   ---------------------------------------------------------------------
     Inecuaciones : 2x-3y<=6 · x>=0 · y<x+2 · 3x+2y>12
                    (símbolos <= >= < > , una por línea en el recinto)
     Ecuaciones   : x^2+y^2=25 · y=x^2-1 · xy=6 · 2x-y=1
                    (el producto se puede escribir xy o x*y; la potencia
                     con ^ ; se admiten fracciones 3/4 y decimales 0,5)
     Puntos       : cada coordenada en su casilla, admite 3, -2, 0,5, 3/4

   Sin OJS, sin CDN, sin dependencias externas. ES5 (var/function) salvo
   BigInt, que ya usa el núcleo.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.SYS;
  if (!S) {
    if (window.console && console.error) {
      console.error('[sistemas] sys-applets-c.js necesita sys-applets.js (núcleo) cargado antes.');
    }
    return;
  }
  if (!S.parseInec || !S.vertices || !S.noLineal) {
    if (window.console && console.error) {
      console.error('[sistemas] sys-applets-c.js necesita sys-applets-lin.js (capa lineal) cargado antes.');
    }
  }

  var R = S.registry;
  var K = S.K, KD = S.KD, F = S.Frac, COL = S.COL;

  /* ==================================================================
     0 · utilidades comunes del módulo
     ================================================================== */
  function fr(n, d) { return new F(n, d === undefined ? 1 : d); }
  function FZ() { return fr(0); }
  function num(f) { return (f && typeof f.val === 'function') ? f.val() : Number(f); }
  function fTex(f) { return (f && typeof f.tex === 'function') ? f.tex() : String(f); }

  /* Cadena de texto -> Frac, con mensaje amable si no se entiende. */
  function leeNum(txt, nombre) {
    var s = String(txt === undefined || txt === null ? '' : txt).trim();
    if (s === '') {
      throw Error((nombre || 'El número') + ' está vacío. Escribe un entero (3), un decimal con coma (0,5) o una fracción (3/4).');
    }
    try {
      return S.fracDe(s);
    } catch (e) {
      throw Error((nombre || 'El número') + ': ' + e.message);
    }
  }

  function aviso(t, clase) { return '<div class="' + (clase || 'mx-info') + '">' + t + '</div>'; }
  function nota(t) { return '<div class="ap-nota">' + t + '</div>'; }
  function sub(t) { return '<h5 class="ap-sub">' + S.esc(t) + '</h5>'; }
  function cajas(items) {
    return '<div class="eq-check">' + items.map(function (i) {
      return '<div class="eq-check-caja' + (i.clase ? ' ' + i.clase : '') + '">' + i.html + '</div>';
    }).join('') + '</div>';
  }
  function errorHTML(e, ayuda) {
    var m = (e && e.message) ? e.message : String(e);
    return '<div class="mx-bad ap-err">' + S.esc(m) + '</div>' +
      (ayuda ? nota(ayuda) : '');
  }
  /* Envuelve un compute para que ningún fallo deje la salida vacía. */
  function seguro(fn, ayuda) {
    return function (v, ctl, out, api) {
      try {
        var h = fn(v, ctl, out, api);
        if (h === undefined || h === null || h === '') {
          return aviso('Escribe los datos en las casillas de arriba o pulsa uno de los botones de escenario.');
        }
        return h;
      } catch (e) {
        if (window.SYS && window.SYS.log) window.SYS.log.push({ applet: 'módulo C', error: (e && e.message) || String(e) });
        return errorHTML(e, ayuda);
      }
    };
  }

  var AYUDA_INEC = 'Recuerda cómo se escriben las inecuaciones: <code>2x-3y&lt;=6</code>, ' +
    '<code>x&gt;=0</code>, <code>y&lt;x+2</code>, <code>3x+2y&gt;12</code>. ' +
    'Los símbolos son <code>&lt;=</code>, <code>&gt;=</code>, <code>&lt;</code> y <code>&gt;</code>.';
  var AYUDA_CURVA = 'Recuerda cómo se escriben las ecuaciones: <code>y=x^2-1</code>, ' +
    '<code>x^2+y^2=25</code>, <code>xy=6</code>, <code>2x-y=1</code>. ' +
    'La potencia se escribe con <code>^</code> y el producto de incógnitas como <code>xy</code> o <code>x*y</code>.';

  /* Símbolo de la relación en texto llano y en TeX. */
  var RELTX = { '<=': '≤', '>=': '≥', '<': '<', '>': '>', '=': '=' };
  var RELTEX = { '<=': '\\le', '>=': '\\ge', '<': '<', '>': '>', '=': '=' };
  function estricta(rel) { return rel === '<' || rel === '>'; }

  /* Recta frontera de una inecuación, lista para S.plano */
  function frontera(I, color, etiqueta) {
    return {
      a: I.a, b: I.b, c: I.c, color: color || COL.azul,
      etiqueta: etiqueta, dash: estricta(I.rel) ? '10 7' : null, ancho: 3.4
    };
  }

  /* ¿Hay algún punto que cumpla todas las inecuaciones?  Comprobación
     numérica sobre una malla: sirve solo para avisar de un recinto vacío,
     nunca para calcular (los vértices son exactos). */
  function hayFactible(inecs) {
    var L = inecs.map(function (I) {
      return { a: num(I.a), b: num(I.b), c: num(I.c), rel: I.rel };
    });
    function vale(x, y) {
      for (var k = 0; k < L.length; k++) {
        var s = L[k].a * x + L[k].b * y - L[k].c;
        var e = 1e-9;
        if (L[k].rel === '<=' && s > e) return false;
        if (L[k].rel === '<' && s >= -e) return false;
        if (L[k].rel === '>=' && s < -e) return false;
        if (L[k].rel === '>' && s <= e) return false;
        if (L[k].rel === '=' && Math.abs(s) > e) return false;
      }
      return true;
    }
    var paso, x, y;
    for (paso = 0; paso < 2; paso++) {
      var h = paso === 0 ? 1 : 0.2;
      var lim = paso === 0 ? 40 : 12;
      for (x = -lim; x <= lim; x += h) {
        for (y = -lim; y <= lim; y += h) {
          if (vale(x, y)) return { hay: true, x: x, y: y };
        }
      }
    }
    return { hay: false };
  }

  /* Tabla «inecuación por inecuación» para un punto dado. */
  function tablaComprueba(inecs, x, y) {
    var filas = inecs.map(function (I, i) {
      var val = I.a.por(x).mas(I.b.por(y));
      var ok = S.cumple(I, x, y);
      return [
        '(' + (i + 1) + ') $' + S.inecTex(I) + '$',
        '$' + fTex(val) + ' ' + RELTEX[I.rel] + ' ' + fTex(I.c) + '$',
        S.badge(ok ? 'se cumple' : 'no se cumple', ok ? 'si' : 'no')
      ];
    });
    return S.tabla(['Inecuación', 'Sustituyendo el punto', '¿Se cumple?'], filas, { thPrimera: false });
  }

  /* ==================================================================
     1 · semiplano · una inecuación lineal es un semiplano
     ================================================================== */
  R.semiplano = function (node) {
    return S.shell(node, 'Una inecuación es un semiplano',
      'Escribe una inecuación lineal en las dos incógnitas, tal como se escribe en el cuaderno: ' +
      '<code>2x-3y&lt;=6</code>, <code>x&gt;=0</code>, <code>y&lt;x+2</code> o <code>3x+2y&gt;12</code>. ' +
      'Los símbolos válidos son <code>&lt;=</code> (menor o igual), <code>&gt;=</code> (mayor o igual), ' +
      '<code>&lt;</code> y <code>&gt;</code>. Después elige un <b>punto de prueba</b> escribiendo sus dos ' +
      'coordenadas (valen enteros, decimales con coma y fracciones: <code>3</code>, <code>-2</code>, ' +
      '<code>0,5</code>, <code>3/4</code>). Observa tres cosas: si la frontera se dibuja continua o ' +
      'discontinua, qué ocurre al sustituir el punto y de qué lado de la recta queda el sombreado.',
      [
        { id: 'inec', label: 'Inecuación', type: 'text', value: '2x-3y<=6', place: '2x-3y<=6', ancho: '15rem' },
        { id: 'px', label: 'x del punto de prueba', type: 'text', value: '0', ancho: '8rem' },
        { id: 'py', label: 'y del punto de prueba', type: 'text', value: '0', ancho: '8rem' },
        { id: 'ver', label: 'Sombrear el semiplano', type: 'check', value: true },
        {
          type: 'presets', list: [
            {
              label: '2x − 3y ≤ 6', title: 'Frontera continua: los puntos de la recta sí valen',
              apply: function (c) { c.inec.value = '2x-3y<=6'; c.px.value = '0'; c.py.value = '0'; }
            },
            {
              label: 'y < x + 2', title: 'Frontera discontinua: la recta queda fuera',
              apply: function (c) { c.inec.value = 'y<x+2'; c.px.value = '0'; c.py.value = '0'; }
            },
            {
              label: 'x ≥ 0', title: 'Semiplano vertical: la condición de no negatividad',
              apply: function (c) { c.inec.value = 'x>=0'; c.px.value = '2'; c.py.value = '1'; }
            },
            {
              label: '3x + 2y > 12', title: 'Desigualdad estricta con el origen fuera',
              apply: function (c) { c.inec.value = '3x+2y>12'; c.px.value = '0'; c.py.value = '0'; }
            },
            {
              label: 'y ≤ 4', title: 'Semiplano horizontal',
              apply: function (c) { c.inec.value = 'y<=4'; c.px.value = '0'; c.py.value = '0'; }
            },
            {
              label: 'Punto sobre la frontera', title: 'El punto (3,0) está justo en la recta 2x − 3y = 6',
              apply: function (c) { c.inec.value = '2x-3y<=6'; c.px.value = '3'; c.py.value = '0'; }
            }
          ]
        }
      ],
      seguro(function (v) {
        var I = S.parseInec(v.inec);
        var x0 = leeNum(v.px, 'La abscisa del punto de prueba');
        var y0 = leeNum(v.py, 'La ordenada del punto de prueba');
        var h = '';

        h += S.expr('Inecuación propuesta', S.inecTex(I));

        /* --- paso 1 · la recta frontera --- */
        var rectaTex = S.rectaTex({ a: I.a, b: I.b, c: I.c });
        var expl = S.explicitaTex({ a: I.a, b: I.b, c: I.c });
        h += S.paso(1,
          'Cambiamos el signo de desigualdad por un igual: eso da la <strong>recta frontera</strong>, ' +
          'que separa el plano en dos semiplanos.<br>' + KD(rectaTex) +
          'Despejada queda ' + K(expl) + '.');

        /* --- paso 2 · continua o discontinua --- */
        h += S.paso(2,
          (estricta(I.rel)
            ? 'La desigualdad es <strong>estricta</strong> (' + RELTX[I.rel] + '), así que los puntos de la ' +
              'recta <strong>no</strong> pertenecen a la solución: la frontera se dibuja <strong>discontinua</strong>.'
            : 'La desigualdad <strong>no es estricta</strong> (' + RELTX[I.rel] + '), así que los puntos de la ' +
              'recta <strong>sí</strong> pertenecen a la solución: la frontera se dibuja <strong>continua</strong>.'),
          'ap-paso-clave');

        /* --- paso 3 · el punto de prueba --- */
        var val = I.a.por(x0).mas(I.b.por(y0));
        var cumple = S.cumple(I, x0, y0);
        var enFrontera = val.cmp(I.c) === 0;
        h += S.paso(3,
          'Sustituimos el punto de prueba ' + K(S.puntoTex(x0, y0)) + ' en el primer miembro:' +
          KD(fTex(I.a) + '\\cdot\\left(' + fTex(x0) + '\\right) + ' +
            fTex(I.b) + '\\cdot\\left(' + fTex(y0) + '\\right) = ' + fTex(val)) +
          'y comparamos con ' + K(fTex(I.c)) + ': ' + K(fTex(val) + ' ' + RELTEX[I.rel] + ' ' + fTex(I.c)) +
          ' es ' + (cumple ? '<strong>cierto</strong>' : '<strong>falso</strong>') + '.');

        h += cajas([{
          clase: cumple ? 'eq-ok' : 'eq-ko',
          html: '<b>' + (cumple ? 'El punto de prueba SÍ cumple la inecuación' : 'El punto de prueba NO cumple la inecuación') + '</b><br>' +
            (enFrontera
              ? 'Además está justo <b>sobre la recta frontera</b>' +
                (estricta(I.rel)
                  ? ', y como la desigualdad es estricta queda excluido: no sirve como punto de prueba.'
                  : ', que en este caso sí forma parte de la solución. Para decidir el sombreado conviene ' +
                    'elegir un punto que no esté en la recta.')
              : 'Por tanto, el semiplano solución es el que <b>' + (cumple ? 'contiene' : 'no contiene') +
                '</b> a ese punto.')
        }]);

        /* --- paso 4 · el sombreado --- */
        h += S.paso(4,
          'Sombreamos el semiplano correcto. Un truco rápido: si el origen ' + K('(0,0)') +
          ' no está en la recta, pruébalo siempre; las cuentas son inmediatas.', 'ap-paso-clave');

        var opciones = {
          W: 760, H: 540,
          titulo: 'Semiplano solución de ' + I.txt,
          rectas: [frontera(I, COL.azulOsc, S.rectaTex({ a: I.a, b: I.b, c: I.c }))],
          puntos: [{
            x: num(x0), y: num(y0), color: cumple ? COL.verde : COL.rojo,
            etiqueta: 'P(' + S.etq(num(x0), 2) + ', ' + S.etq(num(y0), 2) + ')'
          }],
          leyenda: [
            [COL.azulOsc, 'frontera ' + (estricta(I.rel) ? '(discontinua: no entra)' : '(continua: sí entra)')],
            [cumple ? COL.verde : COL.rojo, 'punto de prueba ' + (cumple ? 'que cumple' : 'que no cumple')]
          ],
          label: 'Semiplano definido por ' + I.txt,
          cap: 'La zona coloreada recoge <em>todos</em> los puntos del plano que cumplen la inecuación: ' +
            'son infinitos, y por eso la solución se describe con una región y no con una lista.'
        };
        if (v.ver) {
          opciones.regiones = [{ inecs: [I], color: COL.azul, alfa: 0.22, etiqueta: 'solución' }];
        }
        h += S.plano(opciones);

        h += S.kvs([
          'Frontera: ' + (estricta(I.rel) ? 'discontinua' : 'continua'),
          'Punto de prueba: ' + (cumple ? 'cumple' : 'no cumple'),
          'Semiplano: el ' + (cumple ? 'del punto' : 'contrario al punto')
        ]);
        h += nota('Cambia el símbolo de la desigualdad (por ejemplo de <code>&lt;=</code> a <code>&gt;=</code>) ' +
          'y comprueba que el sombreado salta al otro lado de la misma recta.');
        return h;
      }, AYUDA_INEC));
  };

  /* ==================================================================
     2 · recinto · intersección de semiplanos
     ================================================================== */
  R.recinto = function (node) {
    return S.shell(node, 'Recinto de un sistema de inecuaciones',
      'Escribe <b>hasta cinco inecuaciones, una en cada línea</b>, exactamente igual que en el cuaderno: ' +
      '<code>x&gt;=0</code>, <code>y&gt;=0</code>, <code>x+y&lt;=6</code>, <code>2x-3y&lt;=6</code>, ' +
      '<code>y&lt;x+2</code>. El recinto solución es la <b>intersección</b> de todos los semiplanos: los ' +
      'puntos que cumplen todas las condiciones a la vez. El applet calcula los vértices de forma exacta ' +
      '(con fracciones), avisa si el recinto es vacío o no acotado y comprueba un punto condición a condición.',
      [
        {
          id: 'sis', label: 'Sistema de inecuaciones (una por línea)', type: 'textarea', rows: 5,
          value: 'x>=0\ny>=0\nx+y<=6\n2x+y<=8', ancho: '19rem'
        },
        { id: 'px', label: 'x del punto', type: 'text', value: '2', ancho: '7rem' },
        { id: 'py', label: 'y del punto', type: 'text', value: '2', ancho: '7rem' },
        { id: 'verV', label: 'Marcar los vértices', type: 'check', value: true },
        {
          type: 'presets', list: [
            {
              label: 'Recinto triangular', title: 'x>=0, y>=0, x+y<=6',
              apply: function (c) { c.sis.value = 'x>=0\ny>=0\nx+y<=6'; c.px.value = '2'; c.py.value = '2'; }
            },
            {
              label: 'Recinto de producción', title: 'Cuatro condiciones: el polígono típico de programación lineal',
              apply: function (c) { c.sis.value = 'x>=0\ny>=0\nx+y<=6\n2x+y<=8'; c.px.value = '2'; c.py.value = '3'; }
            },
            {
              label: 'Con vértices fraccionarios', title: 'Los cortes no caen en puntos enteros',
              apply: function (c) { c.sis.value = 'x>=0\ny>=0\n3x+2y<=12\n2x+5y<=16'; c.px.value = '1'; c.py.value = '1'; }
            },
            {
              label: 'Recinto no acotado', title: 'Falta una condición que cierre la región',
              apply: function (c) { c.sis.value = 'x>=0\ny>=0\nx+y>=4'; c.px.value = '3'; c.py.value = '3'; }
            },
            {
              label: 'Recinto vacío', title: 'Dos condiciones incompatibles',
              apply: function (c) { c.sis.value = 'x+y<=2\nx+y>=6\nx>=0'; c.px.value = '1'; c.py.value = '1'; }
            },
            {
              label: 'Con desigualdad estricta', title: 'Un borde queda fuera del recinto',
              apply: function (c) { c.sis.value = 'x>=0\ny>=0\ny<x+2\nx+y<=5'; c.px.value = '1'; c.py.value = '2'; }
            }
          ]
        }
      ],
      seguro(function (v) {
        var L = S.parseInecs(v.sis);
        if (L.length > 5) {
          throw Error('Has escrito ' + L.length + ' inecuaciones. En este applet caben como máximo 5, ' +
            'una por línea, para que la figura y la tabla de vértices se lean bien.');
        }
        if (L.length < 2) {
          throw Error('Con una sola inecuación tienes un semiplano, no un recinto. Escribe al menos dos ' +
            'líneas, por ejemplo:\nx>=0\ny>=0\nx+y<=6');
        }
        var x0 = leeNum(v.px, 'La abscisa del punto'), y0 = leeNum(v.py, 'La ordenada del punto');
        var h = '';

        /* --- el sistema en LaTeX --- */
        h += S.expr('Sistema de inecuaciones',
          '\\left\\{\\begin{array}{l}' + L.map(function (I) { return S.inecTex(I); }).join(' \\\\ ') +
          '\\end{array}\\right.');

        h += S.paso(1,
          'Cada línea es un <strong>semiplano</strong>: su frontera es la recta que se obtiene al poner ' +
          'el signo igual. Las trazamos todas, continuas o discontinuas según el signo.');

        var filasR = L.map(function (I, i) {
          return [
            '(' + (i + 1) + ')',
            '$' + S.inecTex(I) + '$',
            '$' + S.rectaTex({ a: I.a, b: I.b, c: I.c }) + '$',
            estricta(I.rel) ? 'discontinua' : 'continua'
          ];
        });
        h += S.tabla(['#', 'Inecuación', 'Recta frontera', 'Trazo'], filasR, { thPrimera: false });

        /* --- factibilidad --- */
        var fact = hayFactible(L);
        var V = [];
        try { V = S.vertices(L); } catch (e) { V = []; }

        h += S.paso(2,
          'El recinto es la <strong>intersección</strong> de los semiplanos: hay que cumplirlas todas a la vez. ' +
          'Sus <strong>vértices</strong> son los cortes de dos fronteras que además satisfacen el resto de condiciones.');

        if (!fact.hay) {
          h += cajas([{
            clase: 'eq-ko',
            html: '<b>Recinto vacío</b><br>No hay ningún punto del plano que cumpla todas las condiciones ' +
              'a la vez: las inecuaciones son <b>incompatibles</b>. Comprueba si dos de ellas piden cosas ' +
              'contrarias (por ejemplo $x+y\\le 2$ y $x+y\\ge 6$).'
          }]);
        } else if (!V.length) {
          h += cajas([{
            clase: 'eq-ko',
            html: '<b>Recinto sin vértices</b><br>Hay puntos que cumplen todas las condiciones, pero ninguna ' +
              'pareja de fronteras se corta dentro del recinto: la región es una banda o un semiplano, sin esquinas.'
          }]);
        } else {
          var filasV = V.map(function (p, i) {
            var rectas = p.rectas.filter(function (r, k, arr) { return arr.indexOf(r) === k; })
              .map(function (r) { return '(' + (r + 1) + ')'; }).join(' y ');
            return [
              '$V_{' + (i + 1) + '}$',
              '$' + fTex(p.x) + '$',
              '$' + fTex(p.y) + '$',
              '$' + p.tex + '$',
              rectas,
              p.abierto ? S.badge('excluido', 'no') : S.badge('incluido', 'si')
            ];
          });
          h += S.tabla(['Vértice', '$x$', '$y$', 'Coordenadas exactas', 'Cortan las rectas', '¿Pertenece?'],
            filasV, { thPrimera: false });
          if (V.some(function (p) { return p.abierto; })) {
            h += nota('Los vértices marcados como <b>excluidos</b> están sobre una frontera discontinua: ' +
              'el recinto se acerca a ellos tanto como se quiera, pero no los contiene.');
          }
        }

        /* --- acotado o no --- */
        var acot = false;
        try { acot = S.recintoAcotado(L); } catch (e) { acot = false; }
        h += S.paso(3,
          fact.hay
            ? (acot
              ? 'El recinto es <strong>acotado</strong>: cabe dentro de un círculo suficientemente grande, ' +
                'de modo que es un polígono con un número finito de vértices.'
              : 'El recinto es <strong>no acotado</strong>: se extiende indefinidamente en alguna dirección. ' +
                'En un problema de optimización eso puede hacer que no exista máximo (o que no exista mínimo).')
            : 'Al ser el recinto vacío, no tiene sentido hablar de vértices ni de acotación.',
          'ap-paso-clave');

        /* --- comprobación del punto --- */
        var dentro = L.every(function (I) { return S.cumple(I, x0, y0); });
        h += S.paso(4, 'Comprobamos el punto ' + K(S.puntoTex(x0, y0)) +
          ' condición a condición: solo pertenece al recinto si las cumple <strong>todas</strong>.');
        h += tablaComprueba(L, x0, y0);
        h += cajas([{
          clase: dentro ? 'eq-ok' : 'eq-ko',
          html: '<b>' + (dentro ? 'El punto pertenece al recinto' : 'El punto NO pertenece al recinto') + '</b><br>' +
            (dentro
              ? 'Cumple las ' + L.length + ' condiciones, así que está en la zona coloreada.'
              : 'Basta con que falle una sola condición para quedar fuera: fíjate en la fila marcada en rojo.')
        }]);

        /* --- figura --- */
        var puntos = [];
        if (v.verV) {
          V.forEach(function (p, i) {
            puntos.push({
              x: p.xv, y: p.yv, etiqueta: 'V' + (i + 1), color: COL.azulOsc, hueco: !!p.abierto
            });
          });
        }
        /* el rótulo de P se separa del rótulo «recinto», que va en el
           centro de la región coloreada */
        puntos.push({
          x: num(x0), y: num(y0), color: dentro ? COL.verde : COL.rojo,
          etiqueta: 'P(' + S.etq(num(x0), 2) + ', ' + S.etq(num(y0), 2) + ')', dx: 14, dy: 30
        });
        var opts = {
          W: 760, H: 540,
          titulo: fact.hay ? 'Recinto factible' : 'Las condiciones no dejan ningún punto',
          rectas: L.map(function (I, i) { return frontera(I, i < 2 ? COL.gris || COL.eje : COL.azul, '(' + (i + 1) + ')'); }),
          puntos: puntos,
          leyenda: [
            [COL.azul, 'fronteras del recinto'],
            [dentro ? COL.verde : COL.rojo, 'punto comprobado']
          ],
          label: 'Recinto definido por el sistema de inecuaciones',
          cap: 'La región coloreada es el conjunto solución del sistema: la intersección de todos los semiplanos.'
        };
        if (fact.hay) opts.regiones = [{ inecs: L, color: COL.verde, alfa: 0.24, etiqueta: 'recinto' }];
        h += S.plano(opts);

        h += S.kvs([
          'Inecuaciones: ' + L.length,
          'Vértices: ' + V.length,
          'Recinto: ' + (!fact.hay ? 'vacío' : (acot ? 'acotado' : 'no acotado')),
          'Punto: ' + (dentro ? 'dentro' : 'fuera')
        ]);
        return h;
      }, AYUDA_INEC));
  };

  /* ==================================================================
     3 · optimiza · valores extremos sobre el recinto
     ================================================================== */
  R.optimiza = function (node) {
    return S.shell(node, 'Valores extremos sobre el recinto',
      'Escribe el <b>recinto</b> con hasta cinco inecuaciones (una por línea, como <code>x&gt;=0</code>, ' +
      '<code>y&gt;=0</code>, <code>x+y&lt;=6</code>) y los coeficientes de la <b>función objetivo</b> ' +
      '$F = p\\,x + q\\,y$ (admiten enteros, decimales con coma y fracciones: <code>3</code>, <code>0,5</code>, ' +
      '<code>3/2</code>). El applet calcula $F$ en cada vértice con valores exactos, destaca el máximo y el ' +
      'mínimo y dibuja una <b>recta de nivel</b> $F = k$ que puedes deslizar para ver cómo barre el recinto: ' +
      'el óptimo se alcanza cuando la recta de nivel toca el recinto por última vez.',
      [
        {
          id: 'sis', label: 'Recinto (una inecuación por línea)', type: 'textarea', rows: 5,
          value: 'x>=0\ny>=0\nx+y<=6\n2x+y<=8', ancho: '18rem'
        },
        { id: 'p', label: 'p (coeficiente de x)', type: 'text', value: '3', ancho: '7rem' },
        { id: 'q', label: 'q (coeficiente de y)', type: 'text', value: '2', ancho: '7rem' },
        { id: 't', label: 'Recta de nivel (posición)', type: 'range', min: 0, max: 100, step: 2, value: 50 },
        {
          type: 'presets', list: [
            {
              label: 'F = 3x + 2y', title: 'Máximo en un vértice interior del borde',
              apply: function (c) { c.sis.value = 'x>=0\ny>=0\nx+y<=6\n2x+y<=8'; c.p.value = '3'; c.q.value = '2'; c.t.value = 60; }
            },
            {
              label: 'F = x + y', title: 'La recta de nivel es paralela a una arista: hay empate',
              apply: function (c) { c.sis.value = 'x>=0\ny>=0\nx+y<=6\n2x+y<=8'; c.p.value = '1'; c.q.value = '1'; c.t.value = 80; }
            },
            {
              label: 'Coste mínimo', title: 'Recinto no acotado: existe mínimo pero no máximo',
              apply: function (c) { c.sis.value = 'x>=0\ny>=0\nx+y>=4\n2x+y>=6'; c.p.value = '2'; c.q.value = '3'; c.t.value = 30; }
            },
            {
              label: 'Vértices fraccionarios', title: 'Los óptimos no caen en puntos enteros',
              apply: function (c) { c.sis.value = 'x>=0\ny>=0\n3x+2y<=12\n2x+5y<=16'; c.p.value = '5'; c.q.value = '4'; c.t.value = 70; }
            },
            {
              label: 'Objetivo con fracciones', title: 'F = 3/2 x + 1/2 y',
              apply: function (c) { c.sis.value = 'x>=0\ny>=0\nx+y<=6\n2x+y<=8'; c.p.value = '3/2'; c.q.value = '1/2'; c.t.value = 50; }
            }
          ]
        }
      ],
      seguro(function (v) {
        var L = S.parseInecs(v.sis);
        if (L.length > 5) {
          throw Error('Has escrito ' + L.length + ' inecuaciones. En este applet caben como máximo 5, una por línea.');
        }
        var p = leeNum(v.p, 'El coeficiente p'), q = leeNum(v.q, 'El coeficiente q');
        if (p.n === 0n && q.n === 0n) {
          throw Error('Si p = 0 y q = 0 la función objetivo vale siempre 0 y no hay nada que optimizar. ' +
            'Escribe por ejemplo p = 3 y q = 2 para estudiar F = 3x + 2y.');
        }
        var fact = hayFactible(L);
        if (!fact.hay) {
          return S.expr('Función objetivo', 'F = ' + S.ecuTex([p, q], FZ(), ['x', 'y']).split('=')[0]) +
            cajas([{
              clase: 'eq-ko',
              html: '<b>El recinto es vacío</b><br>No hay ningún punto que cumpla todas las condiciones, ' +
                'así que la función objetivo no se puede evaluar en ninguna parte. Revisa las inecuaciones: ' +
                'seguramente dos de ellas se contradicen.'
            }]) + nota(AYUDA_INEC);
        }
        var E = S.evalObjetivo(L, { p: p, q: q });
        var objTex = 'F = ' + S.ecuTex([p, q], FZ(), ['x', 'y']).split(' = ')[0];
        var h = S.expr('Función objetivo', objTex);

        h += S.paso(1,
          'Dibujamos el recinto factible y localizamos sus <strong>vértices</strong>. En un problema de ' +
          'programación lineal el óptimo, si existe, se alcanza siempre en un vértice (o en toda una arista, ' +
          'si la recta de nivel es paralela a ella).');

        if (!E.vertices.length) {
          return h + cajas([{
            clase: 'eq-ko',
            html: '<b>El recinto no tiene vértices</b><br>Es una banda o un semiplano sin esquinas; ' +
              'en ese caso la función objetivo no alcanza ni máximo ni mínimo en un punto aislado. ' +
              'Añade condiciones como $x\\ge 0$ y $y\\ge 0$ para cerrarlo.'
          }]) + nota(AYUDA_INEC);
        }

        h += S.paso(2, 'Evaluamos ' + K(objTex) + ' en cada vértice, con valores exactos.');
        var filas = E.vertices.map(function (w, i) {
          var esMax = E.max && w.valor.cmp(E.max.valor) === 0;
          var esMin = E.min && w.valor.cmp(E.min.valor) === 0;
          return {
            clase: esMax ? 'ap-ok-row' : '',
            celdas: [
              '$V_{' + (i + 1) + '}$',
              '$' + w.tex.split('\\Rightarrow')[0] + '$',
              '$' + fTex(p) + '\\cdot' + fTex(w.x) + ' + ' + fTex(q) + '\\cdot' + fTex(w.y) + '$',
              '<b>$' + fTex(w.valor) + '$</b>',
              (esMax ? S.badge('máximo', 'si') : '') + (esMin ? S.badge('mínimo', 'info') : '')
            ]
          };
        });
        h += S.tabla(['Vértice', 'Coordenadas', 'Sustitución', '$F$', ''], filas, { thPrimera: false });

        var acot = E.acotado;
        h += S.paso(3,
          'Comparamos los valores obtenidos.<br>' +
          'Máximo: ' + K('F = ' + fTex(E.max.valor)) + ' en ' + K(S.puntoTex(E.max.x, E.max.y)) + '.<br>' +
          'Mínimo: ' + K('F = ' + fTex(E.min.valor)) + ' en ' + K(S.puntoTex(E.min.x, E.min.y)) + '.' +
          (E.empatesMax.length > 1
            ? '<br>Hay <strong>empate en el máximo</strong> entre ' + E.empatesMax.length + ' vértices: ' +
              'la recta de nivel es paralela a esa arista y todos sus puntos son óptimos.'
            : '') +
          (E.empatesMin.length > 1
            ? '<br>Hay <strong>empate en el mínimo</strong> entre ' + E.empatesMin.length + ' vértices.'
            : ''),
          'ap-paso-clave');

        if (!acot) {
          h += aviso('<b>Cuidado:</b> el recinto es <b>no acotado</b>. Los valores de la tabla son los de los ' +
            'vértices, pero al alejarse por la parte abierta la función objetivo puede crecer (o decrecer) sin ' +
            'límite: uno de los dos extremos podría no existir. Comprueba hacia dónde crece $F$ moviendo la ' +
            'recta de nivel.');
        }

        /* --- recta de nivel deslizante --- */
        var vmin = E.min.valor, vmax = E.max.valor;
        var t = Number(v.t);
        if (!isFinite(t)) t = 50;
        var kNivel = vmin.mas(vmax.menos(vmin).por(fr(Math.round(t), 100)));
        h += S.paso(4,
          'La <strong>recta de nivel</strong> ' + K('F = k') + ' reúne los puntos donde la función objetivo ' +
          'vale lo mismo. Todas las rectas de nivel son paralelas entre sí; al deslizarlas, el último punto del ' +
          'recinto que tocan es el óptimo. Ahora ' + K('k = ' + fTex(kNivel)) + '.');

        var puntos = E.vertices.map(function (w, i) {
          var esMax = w.valor.cmp(E.max.valor) === 0, esMin = w.valor.cmp(E.min.valor) === 0;
          return {
            x: w.xv, y: w.yv, hueco: !!w.abierto,
            color: esMax ? COL.rojo : (esMin ? COL.verde : COL.azulOsc),
            etiqueta: 'V' + (i + 1) + ' · F=' + S.etq(w.valorNum, 2)
          };
        });
        h += S.plano({
          W: 780, H: 560,
          titulo: 'Recinto, vértices y recta de nivel F = ' + S.etq(num(kNivel), 2),
          regiones: [{ inecs: L, color: COL.azul, alfa: 0.20, etiqueta: 'recinto' }],
          rectas: L.map(function (I) { return frontera(I, COL.azul); }).concat([
            /* rectas paralelas: cada rótulo en un punto distinto de su
               recta, para que no se pisen cuando los niveles se juntan */
            { a: p, b: q, c: kNivel, color: COL.naranja || COL.rojo, ancho: 4, dash: '12 8', pos: 0.80, etiqueta: 'F = ' + S.etq(num(kNivel), 2) },
            { a: p, b: q, c: E.max.valor, color: COL.rojo, ancho: 2.4, dash: '4 6', pos: 0.30, etiqueta: 'F máx' },
            { a: p, b: q, c: E.min.valor, color: COL.verde, ancho: 2.4, dash: '4 6', pos: 0.55, etiqueta: 'F mín' }
          ]),
          puntos: puntos,
          leyenda: [
            [COL.naranja || COL.rojo, 'recta de nivel deslizante'],
            [COL.rojo, 'nivel del máximo'],
            [COL.verde, 'nivel del mínimo']
          ],
          label: 'Optimización lineal sobre el recinto factible',
          cap: 'Al desplazar la recta de nivel en la dirección en que crece $F$, el último punto del recinto ' +
            'que se toca es el máximo; en la dirección contraria, el mínimo.'
        });

        h += S.resultado(S.nc(E.max.valorNum, 4), 'valor máximo de F');
        h += S.kvs([
          'Vértices: ' + E.vertices.length,
          'Máximo: F = ' + S.nc(E.max.valorNum, 4) + ' en (' + S.nc(E.max.xv, 3) + ', ' + S.nc(E.max.yv, 3) + ')',
          'Mínimo: F = ' + S.nc(E.min.valorNum, 4) + ' en (' + S.nc(E.min.xv, 3) + ', ' + S.nc(E.min.yv, 3) + ')',
          'Recinto: ' + (acot ? 'acotado' : 'no acotado')
        ]);
        return h;
      }, AYUDA_INEC));
  };

  /* ==================================================================
     4 · utilidades para los sistemas no lineales
     ================================================================== */
  var ESCENARIOS = [
    { label: 'Recta y parábola', e1: 'y=x^2-1', e2: 'y=2x+2', title: 'Dos cortes: la ecuación resultante es de segundo grado' },
    { label: 'Recta tangente', e1: 'y=x^2', e2: 'y=2x-1', title: 'Una única solución: la recta es tangente a la parábola' },
    { label: 'Sin corte', e1: 'y=x^2+2', e2: 'y=x-1', title: 'El discriminante es negativo: no hay solución real' },
    { label: 'Recta y circunferencia', e1: 'x^2+y^2=25', e2: 'x+y=7', title: 'Cortes de una recta con una circunferencia' },
    { label: 'Circunferencia y eje', e1: 'x^2+y^2=25', e2: 'x=3', title: 'La ecuación lineal da directamente x' },
    { label: 'Hipérbola xy = 6', e1: 'xy=6', e2: 'x+y=5', title: 'Producto constante: aparece la hipérbola' },
    { label: 'Dos circunferencias', e1: 'x^2+y^2=25', e2: 'x^2+y^2-6x-8y=-21', title: 'Al restar desaparecen los cuadrados' },
    { label: 'Con solución a descartar', e1: 'xy=12', e2: 'x+y=-8', title: 'Las dos soluciones son negativas: en un problema de medidas no valen' }
  ];

  function curvaColor(i) { return i === 0 ? COL.azulOsc : COL.rojo; }

  /* Valor numérico del primer miembro de una curva en (x,y), para comprobar. */
  function residuo(C, x, y) {
    var c = C.coef;
    return num(c.x2) * x * x + num(c.xy) * x * y + num(c.y2) * y * y +
      num(c.x) * x + num(c.y) * y + num(c.k);
  }
  function residuoExacto(C, fx, fy) {
    var c = C.coef;
    return c.x2.por(fx).por(fx)
      .mas(c.xy.por(fx).por(fy))
      .mas(c.y2.por(fy).por(fy))
      .mas(c.x.por(fx)).mas(c.y.por(fy)).mas(c.k);
  }
  function esFrac(v) { return v && typeof v.n === 'bigint'; }

  /* Texto legible de una solución (aproximado, para los rótulos). */
  function rotuloSol(s, i) {
    return 'P' + (i + 1) + '(' + S.etq(s.xv, 2) + ', ' + S.etq(s.yv, 2) + ')';
  }

  function tablaSoluciones(N) {
    if (!N.soluciones.length) return '';
    var filas = N.soluciones.map(function (s, i) {
      return [
        '$P_{' + (i + 1) + '}$',
        '$' + s.tex + '$',
        '(' + S.nc(s.xv, 4) + ', ' + S.nc(s.yv, 4) + ')',
        s.exacto ? S.badge('valor exacto', 'si') : S.badge('valor aproximado', 'info')
      ];
    });
    return S.tabla(['Solución', 'Par exacto', 'Aproximación decimal', 'Tipo de número'], filas, { thPrimera: false });
  }

  function figuraNoLineal(N, opts) {
    opts = opts || {};
    var puntos = N.soluciones.filter(function (s) {
      return isFinite(s.xv) && isFinite(s.yv);
    }).map(function (s, i) {
      return {
        x: s.xv, y: s.yv, color: opts.descartadas && opts.descartadas[i] ? COL.gris || COL.eje : COL.verde,
        etiqueta: rotuloSol(s, i), hueco: !!(opts.descartadas && opts.descartadas[i])
      };
    });
    return S.plano({
      W: 780, H: 560,
      titulo: opts.titulo || 'Las dos curvas y sus puntos de corte',
      curvas: N.curvas.map(function (C, i) {
        return { curva: C, color: curvaColor(i), etiqueta: null, ancho: 3.4 };
      }),
      puntos: puntos,
      leyenda: [
        [curvaColor(0), 'primera ecuación'],
        [curvaColor(1), 'segunda ecuación'],
        [COL.verde, 'soluciones del sistema']
      ],
      label: 'Sistema no lineal representado en el plano',
      cap: opts.cap || 'Resolver el sistema es buscar los puntos comunes a las dos curvas: ' +
        'las soluciones algebraicas y los cortes de la figura son lo mismo.'
    });
  }

  /* ==================================================================
     5 · noLinealGraf · sistemas no lineales en el plano
     ================================================================== */
  R.noLinealGraf = function (node) {
    return S.shell(node, 'Sistemas no lineales en el plano',
      'Escribe las dos ecuaciones tal cual: <code>y=x^2-1</code>, <code>x^2+y^2=25</code>, <code>xy=6</code>, ' +
      '<code>2x-y=1</code>, <code>x=3</code>. La potencia se escribe con <code>^</code> y el producto de ' +
      'incógnitas como <code>xy</code> o <code>x*y</code>; se admiten fracciones (<code>3/4</code>) y decimales ' +
      'con coma (<code>0,5</code>). Cada ecuación es una <b>curva</b>: recta, parábola, circunferencia o ' +
      'hipérbola. Las soluciones del sistema son exactamente los <b>puntos comunes</b> a las dos curvas, así ' +
      'que basta mirar la figura para saber cuántas hay antes de calcular nada.',
      [
        { id: 'e1', label: 'Primera ecuación', type: 'text', value: 'y=x^2-1', place: 'y=x^2-1', ancho: '13rem' },
        { id: 'e2', label: 'Segunda ecuación', type: 'text', value: 'y=2x+2', place: 'y=2x+2', ancho: '13rem' },
        { id: 'verTabla', label: 'Ver la tabla de soluciones', type: 'check', value: true },
        {
          type: 'presets', list: ESCENARIOS.map(function (E) {
            return {
              label: E.label, title: E.title,
              apply: function (c) { c.e1.value = E.e1; c.e2.value = E.e2; }
            };
          })
        }
      ],
      seguro(function (v) {
        var c1 = S.curva(v.e1), c2 = S.curva(v.e2);
        var h = S.expr('Sistema propuesto',
          '\\left\\{\\begin{array}{l}' + c1.tex + ' \\\\ ' + c2.tex + '\\end{array}\\right.');

        h += S.tabla(['Ecuación', 'Forma reconocida', 'Tipo de curva'], [
          ['(1)', '$' + c1.tex + '$', nombreCurva(c1)],
          ['(2)', '$' + c2.tex + '$', nombreCurva(c2)]
        ], { thPrimera: false });

        var N = S.noLineal(v.e1, v.e2);
        var n = N.soluciones.length;

        h += S.paso(1,
          'Identificamos las dos curvas: ' + nombreCurva(c1) + ' y ' + nombreCurva(c2) + '. ' +
          'Antes de resolver, conviene imaginar cuántos cortes puede haber: una recta y una circunferencia ' +
          'se cortan como mucho en dos puntos; una recta y una parábola, también.');
        h += S.paso(2,
          N.tipo === 'infinitas'
            ? 'Las dos ecuaciones describen la misma curva: hay <strong>infinitas soluciones</strong>.'
            : (n === 0
              ? 'Las curvas <strong>no se cortan</strong>: el sistema no tiene solución real.'
              : 'Las curvas se cortan en <strong>' + n + ' punto' + (n === 1 ? '' : 's') + '</strong>' +
                (n === 1 ? ': son tangentes o solo se tocan en un sitio.' : '.')),
          'ap-paso-clave');

        h += cajas([{
          clase: n ? 'eq-ok' : 'eq-ko',
          html: '<b>Número de soluciones: ' + (N.tipo === 'infinitas' ? 'infinitas' : n) + '</b><br>' +
            'Cada punto de corte de la figura es un par ' + K('(x, y)') + ' que cumple las dos ecuaciones a la vez.'
        }]);

        if (v.verTabla && n) h += tablaSoluciones(N);
        h += figuraNoLineal(N, {});

        h += S.kvs([
          'Curva 1: ' + nombreCurva(c1),
          'Curva 2: ' + nombreCurva(c2),
          'Soluciones: ' + (N.tipo === 'infinitas' ? 'infinitas' : n)
        ]);
        h += nota('Prueba a mover la recta cambiando su término independiente (por ejemplo <code>y=2x+2</code> ' +
          '→ <code>y=2x-3</code>) y observa cómo los dos cortes se acercan, se juntan en uno solo (tangencia) ' +
          'y acaban desapareciendo.');
        return h;
      }, AYUDA_CURVA));
  };

  function nombreCurva(C) {
    switch (C.tipo) {
      case 'recta': return 'recta';
      case 'parabola': return 'parábola';
      case 'circunferencia': return 'circunferencia';
      case 'hiperbola': return 'hipérbola';
      case 'elipse': return 'elipse';
      case 'punto': return 'un único punto';
      case 'vacia': return 'ningún punto del plano';
      default: return 'curva de segundo grado';
    }
  }

  /* ==================================================================
     6 · noLinealPaso · resolución paso a paso y descarte
     ================================================================== */
  var RESTRICCIONES = [
    { value: 'no', label: 'Ninguna: valen todas las soluciones' },
    { value: 'pos', label: 'x > 0 e y > 0 (medidas, precios, cantidades)' },
    { value: 'nneg', label: 'x ≥ 0 e y ≥ 0 (no negativas)' },
    { value: 'ent', label: 'x e y enteras (número de objetos)' }
  ];
  function descarta(s, modo) {
    var ex = 1e-9;
    if (modo === 'pos') {
      if (!(s.xv > ex && s.yv > ex)) return 'el contexto exige valores estrictamente positivos';
    } else if (modo === 'nneg') {
      if (s.xv < -ex || s.yv < -ex) return 'el contexto no admite valores negativos';
    } else if (modo === 'ent') {
      if (Math.abs(s.xv - Math.round(s.xv)) > 1e-9 || Math.abs(s.yv - Math.round(s.yv)) > 1e-9) {
        return 'el contexto pide números enteros';
      }
    }
    return null;
  }

  R.noLinealPaso = function (node) {
    return S.shell(node, 'Resolución de sistemas no lineales',
      'Escribe las dos ecuaciones como en el cuaderno: <code>y=x^2-1</code>, <code>x^2+y^2=25</code>, ' +
      '<code>xy=6</code>, <code>2x-y=1</code>. El applet aplica el <b>método de sustitución</b>: despeja una ' +
      'incógnita en la ecuación más sencilla, la lleva a la otra, resuelve la ecuación de una sola incógnita ' +
      'que queda y recupera la otra coordenada. Después <b>comprueba</b> cada par en las dos ecuaciones ' +
      'iniciales y, si eliges una restricción de contexto, <b>descarta</b> las soluciones que no tienen sentido ' +
      '(una longitud negativa, un número de objetos fraccionario…).',
      [
        { id: 'e1', label: 'Primera ecuación', type: 'text', value: 'x^2+y^2=25', ancho: '13rem' },
        { id: 'e2', label: 'Segunda ecuación', type: 'text', value: 'x+y=7', ancho: '13rem' },
        { id: 'rest', label: 'Restricción del contexto', type: 'select', value: 'no', options: RESTRICCIONES },
        { id: 'verFig', label: 'Ver la figura', type: 'check', value: true },
        {
          type: 'presets', list: ESCENARIOS.map(function (E) {
            return {
              label: E.label, title: E.title,
              apply: function (c) {
                c.e1.value = E.e1; c.e2.value = E.e2;
                c.rest.value = (E.label === 'Con solución a descartar') ? 'pos' : 'no';
              }
            };
          }).concat([
            {
              label: 'Problema del rectángulo', title: 'Área 12 y perímetro 14: los lados deben ser positivos',
              apply: function (c) { c.e1.value = 'xy=12'; c.e2.value = 'x+y=7'; c.rest.value = 'pos'; }
            }
          ])
        }
      ],
      seguro(function (v) {
        var N = S.noLineal(v.e1, v.e2);
        var h = S.expr('Sistema', N.sistemaTex);

        /* --- los pasos que devuelve la capa lineal --- */
        N.pasos.forEach(function (p, i) {
          h += S.paso(i + 1, p.desc + (p.tex ? KD(p.tex) : ''),
            i === N.pasos.length - 1 ? 'ap-paso-clave' : '');
        });

        if (!N.soluciones.length) {
          h += cajas([{
            clase: 'eq-ko',
            html: '<b>El sistema no tiene solución real</b><br>' +
              'La ecuación de una sola incógnita a la que se llega no tiene raíces reales: geométricamente, ' +
              'las dos curvas no se cortan.'
          }]);
          if (v.verFig) h += figuraNoLineal(N, {});
          return h;
        }

        /* --- comprobación de cada par --- */
        h += sub('Comprobación de las soluciones');
        h += nota('Comprobar es obligatorio: al elevar al cuadrado o al sustituir pueden aparecer pares que ' +
          'no cumplen las ecuaciones de partida.');
        var filasC = N.soluciones.map(function (s, i) {
          var celdas = ['$P_{' + (i + 1) + '} = ' + s.tex + '$'];
          [0, 1].forEach(function (j) {
            var C = N.curvas[j], ok, detalle;
            if (esFrac(s.x) && esFrac(s.y)) {
              var r = residuoExacto(C, s.x, s.y);
              ok = r.n === 0n;
              detalle = ok ? 'se cumple exactamente' : 'da ' + S.nc(num(r), 4) + ' en vez de 0';
            } else {
              var rn = residuo(C, s.xv, s.yv);
              ok = Math.abs(rn) < 1e-7;
              detalle = ok ? 'se cumple (comprobación decimal)' : 'da ' + S.nc(rn, 4) + ' en vez de 0';
            }
            celdas.push(S.badge(ok ? 'correcta' : 'falla', ok ? 'si' : 'no') + ' ' + detalle);
          });
          return celdas;
        });
        h += S.tabla(['Par obtenido', 'En la ecuación (1)', 'En la ecuación (2)'], filasC, { thPrimera: false });

        /* --- descarte por contexto --- */
        var modo = v.rest || 'no';
        var descartadas = [], validas = [];
        N.soluciones.forEach(function (s, i) {
          var motivo = descarta(s, modo);
          descartadas[i] = !!motivo;
          if (!motivo) validas.push(i);
        });
        h += sub('Soluciones válidas en el contexto');
        if (modo === 'no') {
          h += aviso('No has puesto ninguna restricción: <b>las ' + N.soluciones.length + ' soluciones son ' +
            'válidas</b> como pares de números. Elige una restricción en el desplegable para ver cómo se ' +
            'descartan las que no encajarían en un problema real.');
        } else {
          var lista = N.soluciones.map(function (s, i) {
            var motivo = descarta(s, modo);
            return {
              clase: motivo ? 'eq-ko' : 'eq-ok',
              html: '<b>' + (motivo ? 'Se descarta' : 'Se acepta') + '</b><br>' + K(s.tex) + '<br>' +
                '<span class="ap-nota">' + (motivo
                  ? 'Matemáticamente cumple el sistema, pero ' + motivo + '.'
                  : 'Cumple el sistema y también la condición del contexto.') + '</span>'
            };
          });
          h += cajas(lista);
          h += S.kvs([
            'Soluciones del sistema: ' + N.soluciones.length,
            'Aceptadas: ' + validas.length,
            'Descartadas: ' + (N.soluciones.length - validas.length)
          ]);
        }

        var texFinal = validas.length
          ? validas.map(function (i) { return 'P_{' + (i + 1) + '} = ' + N.soluciones[i].tex; }).join(', \\quad ')
          : '\\varnothing';
        h += S.expr('Solución final', texFinal);

        if (v.verFig) {
          h += figuraNoLineal(N, {
            descartadas: descartadas,
            titulo: 'Cortes de las dos curvas' + (modo === 'no' ? '' : ' (huecos: soluciones descartadas)'),
            cap: 'Los puntos macizos son las soluciones aceptadas; los huecos, las que el contexto obliga a rechazar.'
          });
        }
        return h;
      }, AYUDA_CURVA));
  };

  /* ==================================================================
     7 · autoevaluación · generador aleatorio con semilla visible
     ================================================================== */
  /* Generador determinista: la misma semilla produce las mismas cuestiones,
     de modo que el profesor puede pedir «haz la semilla 2026». */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function dado(rnd, min, max) { return min + Math.floor(rnd() * (max - min + 1)); }
  function dadoNoCero(rnd, min, max) {
    var v = 0, k = 0;
    do { v = dado(rnd, min, max); k++; } while (v === 0 && k < 20);
    return v || 1;
  }
  function eligeDe(rnd, lista) { return lista[Math.floor(rnd() * lista.length) % lista.length]; }

  var TIPOS_Q = [
    { value: 'clasifica', label: 'Clasificar un sistema 2×2' },
    { value: 'resolver2', label: 'Resolver un 2×2 por sustitución o reducción' },
    { value: 'gauss3', label: 'Sistema 3×3 por el método de Gauss' },
    { value: 'rango', label: 'Rango de una matriz' },
    { value: 'recinto', label: 'Recinto de inecuaciones' },
    { value: 'semiplano', label: 'Semiplano: ¿el punto cumple?' },
    { value: 'nolineal', label: 'Sistema no lineal' },
    { value: 'problema', label: 'Problema contextualizado' }
  ];
  var CLAVES_Q = TIPOS_Q.map(function (t) { return t.value; });
  function nombreTipo(tipo) {
    if (tipo === 'aleatorio') return 'aleatorio (todo el tema)';
    var f = TIPOS_Q.filter(function (t) { return t.value === tipo; });
    return f.length ? f[0].label : 'aleatorio (todo el tema)';
  }

  /* ---- generadores de cuestión ---- */
  function qClasifica(rnd) {
    var caso = eligeDe(rnd, ['SCD', 'SCD', 'SI', 'SCI']);
    var a = dadoNoCero(rnd, -4, 4), b = dadoNoCero(rnd, -4, 4);
    var k = dado(rnd, 2, 3), c = dado(rnd, -6, 6);
    var A, B;
    if (caso === 'SCD') {
      var a2 = dadoNoCero(rnd, -4, 4), b2 = dadoNoCero(rnd, -4, 4);
      if (a * b2 - a2 * b === 0) { a2 = a + 1; b2 = b - 1; }
      A = [[a, b], [a2, b2]];
      B = [c, dado(rnd, -6, 6)];
    } else if (caso === 'SI') {
      A = [[a, b], [k * a, k * b]];
      B = [c, k * c + dadoNoCero(rnd, 1, 4)];
    } else {
      A = [[a, b], [k * a, k * b]];
      B = [c, k * c];
    }
    var D = S.discute(S.matDe(A), B.map(function (u) { return fr(u); }), ['x', 'y']);
    return {
      tipo: 'clasifica',
      titulo: 'Clasificar un sistema 2×2',
      enun: 'Clasifica este sistema como compatible determinado (<b>SCD</b>), compatible indeterminado ' +
        '(<b>SCI</b>) o incompatible (<b>SI</b>):' + KD(S.sisTex(S.matDe(A), B, ['x', 'y'])),
      pide: 'Escribe SCD, SCI o SI.',
      modo: 'texto',
      clave: D.tipo,
      alias: { SCD: ['scd', 'compatible determinado', 'determinado'], SCI: ['sci', 'compatible indeterminado', 'indeterminado'], SI: ['si', 'incompatible'] },
      pista: 'Compara las razones $\\dfrac{a}{a\'}$, $\\dfrac{b}{b\'}$ y $\\dfrac{c}{c\'}$, o calcula el determinante de la matriz de coeficientes.',
      explica: function () {
        var hh = S.expr('Sistema', S.sisTex(S.matDe(A), B, ['x', 'y']));
        hh += S.paso(1, 'Calculamos los rangos con el método de Gauss.' +
          KD('\\operatorname{rg}(A) = ' + D.rA + ', \\quad \\operatorname{rg}(A|B) = ' + D.rAb + ', \\quad n = ' + D.n));
        hh += S.paso(2, D.texto, 'ap-paso-clave');
        if (D.tipo === 'SCD') hh += S.expr('Solución', D.solTex);
        return hh;
      }
    };
  }

  function qResolver2(rnd) {
    var x = dado(rnd, -5, 5), y = dado(rnd, -5, 5);
    var a = dadoNoCero(rnd, -4, 4), b = dadoNoCero(rnd, -4, 4);
    var a2 = dadoNoCero(rnd, -4, 4), b2 = dadoNoCero(rnd, -4, 4);
    if (a * b2 - a2 * b === 0) { a2 = a + 1; b2 = b + 2; }
    var A = [[a, b], [a2, b2]], B = [a * x + b * y, a2 * x + b2 * y];
    var metodo = eligeDe(rnd, ['sustitución', 'reducción', 'igualación']);
    return {
      tipo: 'resolver2',
      titulo: 'Resolver un sistema 2×2',
      enun: 'Resuelve por el método de <b>' + metodo + '</b>:' + KD(S.sisTex(S.matDe(A), B, ['x', 'y'])),
      pide: 'Escribe los dos valores separados por un espacio, primero $x$ y después $y$. Ejemplo: <code>3 -2</code>',
      modo: 'lista',
      valores: [x, y],
      pista: 'Con el método de ' + metodo + ' llegas a una ecuación con una sola incógnita; después sustituye para hallar la otra.',
      explica: function () {
        var Ma = S.matDe(A), Bf = B.map(function (u) { return fr(u); });
        var res = metodo === 'sustitución' ? S.sustitucion(Ma, Bf, { despejar: 'x', desde: 0 })
          : (metodo === 'igualación' ? S.igualacion(Ma, Bf, { despejar: 'y' })
            : S.reduccion(Ma, Bf, { eliminar: 'x' }));
        var hh = '';
        res.pasos.forEach(function (p, i) { hh += S.paso(i + 1, p.desc + (p.tex ? KD(p.tex) : '')); });
        hh += S.expr('Solución', 'x = ' + x + ', \\quad y = ' + y);
        hh += S.plano({
          W: 720, H: 520,
          rectas: [
            { a: a, b: b, c: B[0], color: COL.azulOsc, etiqueta: '(1)' },
            { a: a2, b: b2, c: B[1], color: COL.rojo, etiqueta: '(2)' }
          ],
          puntos: [{ x: x, y: y, etiqueta: 'solución (' + x + ', ' + y + ')', color: COL.verde }],
          label: 'Las dos rectas del sistema y su punto de corte',
          cap: 'La solución del sistema es el punto donde se cortan las dos rectas.'
        });
        return hh;
      }
    };
  }

  function qGauss3(rnd) {
    var x = dado(rnd, -4, 4), y = dado(rnd, -4, 4), z = dado(rnd, -4, 4);
    var A = [
      [1, dadoNoCero(rnd, -3, 3), dadoNoCero(rnd, -3, 3)],
      [dadoNoCero(rnd, -3, 3), 1, dadoNoCero(rnd, -3, 3)],
      [dadoNoCero(rnd, -3, 3), dadoNoCero(rnd, -3, 3), 1]
    ];
    var M = S.matDe(A), intentos = 0;
    while (S.det(M).n === 0n && intentos < 12) {
      A[2][2] = A[2][2] + 1;
      M = S.matDe(A);
      intentos++;
    }
    var B = A.map(function (f) { return f[0] * x + f[1] * y + f[2] * z; });
    return {
      tipo: 'gauss3',
      titulo: 'Sistema 3×3 por el método de Gauss',
      enun: 'Resuelve por el método de Gauss:' + KD(S.sisTex(M, B, ['x', 'y', 'z'])),
      pide: 'Escribe los tres valores separados por espacios, en el orden $x$, $y$, $z$. Ejemplo: <code>1 -2 3</code>',
      modo: 'lista',
      valores: [x, y, z],
      pista: 'Escribe la matriz ampliada y haz ceros por debajo de la diagonal con operaciones $F_i \\to F_i - k F_j$.',
      explica: function () {
        var Bf = B.map(function (u) { return fr(u); });
        var res = S.resuelve(M, Bf, ['x', 'y', 'z']);
        var hh = S.expr('Matriz ampliada', res.matrizTex);
        res.pasos.forEach(function (p, i) {
          hh += S.paso(i + 1, p.desc + (p.op ? ' &nbsp; ' + K(p.op) : '') + KD(S.matTex(p.M, { aug: 1 })));
        });
        hh += S.paso(res.pasos.length + 1, res.texto, 'ap-paso-clave');
        hh += S.expr('Solución', 'x = ' + x + ', \\quad y = ' + y + ', \\quad z = ' + z);
        return hh;
      }
    };
  }

  function qRango(rnd) {
    var tipo = eligeDe(rnd, ['3', '2', '2', '1']);
    var f1 = [dadoNoCero(rnd, -3, 3), dadoNoCero(rnd, -3, 3), dadoNoCero(rnd, -3, 3)];
    var f2 = [dadoNoCero(rnd, -3, 3), dadoNoCero(rnd, -3, 3), dadoNoCero(rnd, -3, 3)];
    var k = dado(rnd, 2, 3), A;
    if (tipo === '1') {
      A = [f1, f1.map(function (u) { return k * u; }), f1.map(function (u) { return -u; })];
    } else if (tipo === '2') {
      A = [f1, f2, f1.map(function (u, i) { return u + f2[i]; })];
    } else {
      A = [f1, f2, [dadoNoCero(rnd, -3, 3), dadoNoCero(rnd, -3, 3), dado(rnd, -3, 3) + 5]];
    }
    var M = S.matDe(A);
    var rg = S.rango(M);
    return {
      tipo: 'rango',
      titulo: 'Rango de una matriz',
      enun: 'Calcula el rango de esta matriz:' + KD(S.matTex(M)),
      pide: 'Escribe un número entero: 0, 1, 2 o 3.',
      modo: 'lista',
      valores: [rg],
      pista: 'Escalona la matriz por Gauss: el rango es el número de filas no nulas que quedan (número de pivotes).',
      explica: function () {
        var G = S.gauss(M, {});
        var hh = '';
        G.pasos.forEach(function (p, i) {
          hh += S.paso(i + 1, p.desc + (p.op ? ' &nbsp; ' + K(p.op) : '') + KD(S.matTex(p.M)));
        });
        hh += S.paso(G.pasos.length + 1,
          'Quedan <strong>' + rg + '</strong> pivote' + (rg === 1 ? '' : 's') + ', así que ' +
          K('\\operatorname{rg}(A) = ' + rg) + '.', 'ap-paso-clave');
        return hh;
      }
    };
  }

  function qRecinto(rnd) {
    var c = dado(rnd, 4, 9), d = dado(rnd, 4, 10), a = dado(rnd, 1, 3);
    var texto = 'x>=0\ny>=0\nx+y<=' + c + '\n' + a + 'x+y<=' + d;
    var L = S.parseInecs(texto);
    var V = S.vertices(L);
    return {
      tipo: 'recinto',
      titulo: 'Vértices de un recinto',
      enun: '¿Cuántos <b>vértices</b> tiene el recinto definido por este sistema de inecuaciones?' +
        KD('\\left\\{\\begin{array}{l}' + L.map(function (I) { return S.inecTex(I); }).join(' \\\\ ') + '\\end{array}\\right.'),
      pide: 'Escribe un número entero.',
      modo: 'lista',
      valores: [V.length],
      pista: 'Los vértices son los cortes de dos fronteras que además cumplen todas las demás condiciones. ' +
        'Dibuja el recinto: en el primer cuadrante, con dos restricciones, suele ser un triángulo o un cuadrilátero.',
      explica: function () {
        var hh = S.tabla(['Vértice', 'Coordenadas exactas'], V.map(function (p, i) {
          return ['$V_{' + (i + 1) + '}$', '$' + p.tex + '$'];
        }), { thPrimera: false });
        hh += S.plano({
          W: 720, H: 520,
          regiones: [{ inecs: L, color: COL.verde, alfa: 0.22, etiqueta: 'recinto' }],
          rectas: L.map(function (I) { return frontera(I, COL.azul); }),
          puntos: V.map(function (p, i) { return { x: p.xv, y: p.yv, etiqueta: 'V' + (i + 1), color: COL.azulOsc }; }),
          label: 'Recinto factible de la cuestión',
          cap: 'El recinto es un polígono con ' + V.length + ' vértices.'
        });
        return hh;
      }
    };
  }

  function qSemiplano(rnd) {
    var a = dadoNoCero(rnd, -4, 4), b = dadoNoCero(rnd, -4, 4), c = dado(rnd, -8, 8);
    var rel = eligeDe(rnd, ['<=', '>=', '<', '>']);
    var x0 = dado(rnd, -4, 4), y0 = dado(rnd, -4, 4);
    var txt = (a === 1 ? 'x' : (a === -1 ? '-x' : a + 'x')) + (b < 0 ? '-' : '+') +
      (Math.abs(b) === 1 ? 'y' : Math.abs(b) + 'y') + rel + c;
    var I = S.parseInec(txt);
    var ok = S.cumple(I, fr(x0), fr(y0));
    return {
      tipo: 'semiplano',
      titulo: 'Semiplano y punto',
      enun: '¿El punto ' + K('(' + x0 + ', ' + y0 + ')') + ' cumple la inecuación ' + K(S.inecTex(I)) + '?',
      pide: 'Escribe <code>sí</code> o <code>no</code>.',
      modo: 'texto',
      clave: ok ? 'SI' : 'NO',
      alias: { SI: ['si', 'sí', 'cumple', 'verdadero', 'v'], NO: ['no', 'falso', 'f', 'no cumple'] },
      pista: 'Sustituye las coordenadas del punto en el primer miembro y compara con el segundo.',
      explica: function () {
        var val = I.a.por(fr(x0)).mas(I.b.por(fr(y0)));
        var hh = S.paso(1, 'Sustituimos el punto en el primer miembro.' +
          KD(fTex(I.a) + '\\cdot(' + x0 + ') + ' + fTex(I.b) + '\\cdot(' + y0 + ') = ' + fTex(val)));
        hh += S.paso(2, 'Comparamos: ' + K(fTex(val) + ' ' + RELTEX[I.rel] + ' ' + fTex(I.c)) + ' es ' +
          (ok ? '<strong>cierto</strong>: el punto sí cumple la inecuación.'
            : '<strong>falso</strong>: el punto no cumple la inecuación.'), 'ap-paso-clave');
        hh += S.plano({
          W: 720, H: 520,
          regiones: [{ inecs: [I], color: COL.azul, alfa: 0.22 }],
          rectas: [frontera(I, COL.azulOsc, S.rectaTex({ a: I.a, b: I.b, c: I.c }))],
          puntos: [{ x: x0, y: y0, etiqueta: 'P(' + x0 + ', ' + y0 + ')', color: ok ? COL.verde : COL.rojo }],
          label: 'Semiplano y punto de prueba',
          cap: 'El punto está ' + (ok ? 'dentro' : 'fuera') + ' de la zona sombreada.'
        });
        return hh;
      }
    };
  }

  function qNoLineal(rnd) {
    var casos = [
      function () {
        var r1 = dado(rnd, -3, 3), r2 = r1 + dado(rnd, 1, 4);
        /* (x-r1)(x-r2) = 0  ->  y = x^2 - (r1+r2)x + r1 r2  cortada por y = 0 */
        var s = r1 + r2, pr = r1 * r2;
        return { e1: 'y=x^2' + (s ? (s > 0 ? '-' + s + 'x' : '+' + (-s) + 'x') : '') + (pr ? (pr > 0 ? '+' + pr : '' + pr) : ''), e2: 'y=0' };
      },
      function () {
        var r = eligeDe(rnd, [5, 5, 10, 13]);
        return { e1: 'x^2+y^2=' + (r * r), e2: 'x+y=' + dado(rnd, -2, 2) };
      },
      function () {
        var k = eligeDe(rnd, [6, 8, 12]);
        return { e1: 'xy=' + k, e2: 'x+y=' + (k === 6 ? 5 : (k === 8 ? 6 : 7)) };
      },
      function () {
        var m = dadoNoCero(rnd, -3, 3), n = dado(rnd, -3, 3);
        return { e1: 'y=x^2+' + dado(rnd, 1, 4), e2: 'y=' + m + 'x' + (n >= 0 ? '+' + n : n) };
      }
    ];
    var caso = casos[Math.floor(rnd() * casos.length) % casos.length]();
    var N = S.noLineal(caso.e1, caso.e2);
    return {
      tipo: 'nolineal',
      titulo: 'Sistema no lineal',
      enun: '¿Cuántas soluciones reales tiene este sistema?' + KD(N.sistemaTex),
      pide: 'Escribe un número entero: 0, 1 o 2.',
      modo: 'lista',
      valores: [N.soluciones.length],
      pista: 'Despeja una incógnita en la ecuación lineal, sustituye en la otra y estudia el signo del ' +
        'discriminante de la ecuación de segundo grado que queda.',
      explica: function () {
        var hh = '';
        N.pasos.forEach(function (p, i) { hh += S.paso(i + 1, p.desc + (p.tex ? KD(p.tex) : '')); });
        hh += figuraNoLineal(N, {});
        return hh;
      }
    };
  }

  function qProblema(rnd) {
    var plantillas = [
      function () {
        var adultos = dado(rnd, 3, 12), ninos = dado(rnd, 3, 12);
        var pa = dado(rnd, 6, 12), pn = dado(rnd, 3, 5);
        var T = adultos + ninos, Rr = pa * adultos + pn * ninos;
        return {
          txt: 'En una excursión al museo entran ' + T + ' personas y se pagan ' + Rr + ' € en total. ' +
            'La entrada de adulto cuesta ' + pa + ' € y la de niño, ' + pn + ' €. ' +
            '¿Cuántos adultos y cuántos niños han entrado?',
          incog: 'x = número de adultos, y = número de niños',
          sisA: [[1, 1], [pa, pn]], sisB: [T, Rr],
          val: [adultos, ninos],
          orden: 'primero los adultos y después los niños'
        };
      },
      function () {
        var gall = dado(rnd, 4, 15), con = dado(rnd, 3, 12);
        return {
          txt: 'En un corral hay gallinas y conejos. Se cuentan ' + (gall + con) + ' cabezas y ' +
            (2 * gall + 4 * con) + ' patas. ¿Cuántas gallinas y cuántos conejos hay?',
          incog: 'x = número de gallinas, y = número de conejos',
          sisA: [[1, 1], [2, 4]], sisB: [gall + con, 2 * gall + 4 * con],
          val: [gall, con],
          orden: 'primero las gallinas y después los conejos'
        };
      },
      function () {
        var a = dado(rnd, 5, 30), b = dado(rnd, 1, 20);
        return {
          txt: 'La suma de dos números es ' + (a + b) + ' y su diferencia es ' + (a - b) + '. ' +
            '¿Cuáles son esos dos números?',
          incog: 'x = número mayor, y = número menor',
          sisA: [[1, 1], [1, -1]], sisB: [a + b, a - b],
          val: [a, b],
          orden: 'primero el mayor y después el menor'
        };
      }
    ];
    var P = plantillas[Math.floor(rnd() * plantillas.length) % plantillas.length]();
    return {
      tipo: 'problema',
      titulo: 'Problema contextualizado',
      enun: '<p>' + P.txt + '</p>',
      pide: 'Escribe los dos números separados por un espacio (' + P.orden + '). Ejemplo: <code>7 5</code>',
      modo: 'lista',
      valores: P.val,
      pista: 'Elige las incógnitas (' + P.incog + '), traduce cada frase del enunciado en una ecuación y resuelve el sistema.',
      explica: function () {
        var M = S.matDe(P.sisA), Bf = P.sisB.map(function (u) { return fr(u); });
        var hh = S.paso(1, 'Elegimos las incógnitas: ' + P.incog + '.');
        hh += S.paso(2, 'Traducimos el enunciado al lenguaje algebraico.' + KD(S.sisTex(M, P.sisB, ['x', 'y'])));
        var res = S.reduccion(M, Bf, { eliminar: 'x' });
        res.pasos.forEach(function (p, i) { hh += S.paso(i + 3, p.desc + (p.tex ? KD(p.tex) : '')); });
        hh += S.paso(res.pasos.length + 3,
          'Interpretamos el resultado en el contexto (' + P.incog + '):<br>' +
          K('x = ' + P.val[0] + ', \\; y = ' + P.val[1]) + '.', 'ap-paso-clave');
        return hh;
      }
    };
  }

  function generaCuestion(tipo, semilla, indice) {
    var rnd = mulberry32((semilla * 7919 + indice * 104729) | 0);
    var t = tipo;
    if (t === 'aleatorio') t = CLAVES_Q[Math.floor(rnd() * CLAVES_Q.length) % CLAVES_Q.length];
    var Q;
    switch (t) {
      case 'clasifica': Q = qClasifica(rnd); break;
      case 'resolver2': Q = qResolver2(rnd); break;
      case 'gauss3': Q = qGauss3(rnd); break;
      case 'rango': Q = qRango(rnd); break;
      case 'recinto': Q = qRecinto(rnd); break;
      case 'semiplano': Q = qSemiplano(rnd); break;
      case 'nolineal': Q = qNoLineal(rnd); break;
      default: Q = qProblema(rnd); break;
    }
    Q.clavePregunta = semilla + '·' + indice + '·' + Q.tipo;
    return Q;
  }

  /* Corrección de la respuesta escrita. */
  function corrigeQ(Q, texto) {
    var s = String(texto || '').trim();
    if (!s) return null;
    if (Q.modo === 'texto') {
      var norm = s.toLowerCase().replace(/[.·]/g, '').replace(/\s+/g, ' ').trim();
      var clave = null, k;
      for (k in Q.alias) {
        if (!Q.alias.hasOwnProperty(k)) continue;
        if (Q.alias[k].indexOf(norm) >= 0) clave = k;
      }
      if (!clave) {
        return { ok: false, leido: null, msg: 'No he entendido tu respuesta. ' + Q.pide };
      }
      return { ok: clave === Q.clave, leido: clave };
    }
    var trozos = s.split(/[\s;]+/).filter(function (u) { return u !== ''; });
    var nums;
    try {
      nums = trozos.map(function (u) { return num(S.fracDe(u)); });
    } catch (e) {
      return { ok: false, leido: null, msg: 'No he sabido leer tu respuesta. ' + Q.pide };
    }
    if (nums.length !== Q.valores.length) {
      return {
        ok: false, leido: nums.map(function (u) { return S.nc(u, 4); }).join(', '),
        msg: 'Has escrito ' + nums.length + ' valor' + (nums.length === 1 ? '' : 'es') + ' y hacen falta ' +
          Q.valores.length + '. ' + Q.pide
      };
    }
    var ok = true;
    for (var i = 0; i < nums.length; i++) {
      if (Math.abs(nums[i] - Q.valores[i]) > 1e-6) ok = false;
    }
    return { ok: ok, leido: nums.map(function (u) { return S.nc(u, 4); }).join(', ') };
  }

  R.autoevaluacion = function (node) {
    var indice = 1;
    var verSol = false;
    var marcador = {};                 /* clave de pregunta -> acierto */

    function reinicia(c) {
      verSol = false;
      if (c && c.resp) c.resp.value = '';
    }

    return S.shell(node, 'Autoevaluación del tema',
      'Un generador de cuestiones de <b>todo el tema</b>: clasificar un sistema, resolver un 2×2, Gauss 3×3, ' +
      'rango de una matriz, recintos de inecuaciones, semiplanos, sistemas no lineales y problemas ' +
      'contextualizados. La <b>semilla</b> fija las cuestiones: con la misma semilla y el mismo número de ' +
      'cuestión siempre sale lo mismo, así que toda la clase puede trabajar con la semilla que diga el ' +
      'profesor. Escribe la respuesta en la casilla (los números, separados por espacios; las clasificaciones, ' +
      'como <code>SCD</code>, <code>SCI</code> o <code>SI</code>) y se corrige al instante. ' +
      'Pulsa <b>Siguiente cuestión</b> para avanzar y <b>Ver la solución</b> solo después de intentarlo.',
      [
        {
          id: 'tipo', label: 'Tipo de cuestión', type: 'select', value: 'aleatorio',
          options: [{ value: 'aleatorio', label: 'Aleatorio (todo el tema)' }].concat(TIPOS_Q)
        },
        { id: 'semilla', label: 'Semilla', type: 'number', value: 2026, min: 1, max: 9999, step: 1 },
        { id: 'resp', label: 'Tu respuesta', type: 'text', value: '', place: 'escribe aquí', ancho: '11rem' },
        {
          id: 'bSig', type: 'button', label: 'Siguiente cuestión',
          click: function (c) { indice++; reinicia(c); }
        },
        { id: 'bVer', type: 'button', label: 'Ver la solución', click: function () { verSol = true; } },
        {
          type: 'presets', list: [
            {
              label: 'Cuestión anterior', title: 'Vuelve a la cuestión anterior de la misma semilla',
              apply: function (c) { indice = Math.max(1, indice - 1); reinicia(c); }
            },
            {
              label: 'Reiniciar el marcador', title: 'Pone a cero los aciertos y vuelve a la primera cuestión',
              apply: function (c) { marcador = {}; indice = 1; reinicia(c); }
            },
            {
              label: 'Semilla nueva al azar', title: 'Cambia la semilla y empieza otra tanda',
              apply: function (c) { c.semilla.value = String(1 + Math.floor(Math.random() * 9999)); indice = 1; reinicia(c); }
            },
            {
              label: 'Repaso de sistemas lineales', title: 'Solo clasificación, 2×2 y Gauss',
              apply: function (c) { c.tipo.value = 'resolver2'; indice = 1; reinicia(c); }
            },
            {
              label: 'Repaso de inecuaciones', title: 'Solo recintos y semiplanos',
              apply: function (c) { c.tipo.value = 'recinto'; indice = 1; reinicia(c); }
            },
            {
              label: 'Repaso de no lineales', title: 'Solo sistemas no lineales',
              apply: function (c) { c.tipo.value = 'nolineal'; indice = 1; reinicia(c); }
            }
          ]
        }
      ],
      seguro(function (v) {
        var semilla = Math.max(1, Math.min(9999, Math.round(Number(v.semilla) || 2026)));
        var tipo = v.tipo || 'aleatorio';
        var Q = generaCuestion(tipo, semilla, indice);

        var h = '<div class="ap-enun"><b>Cuestión ' + indice + ' · ' + S.esc(Q.titulo) + '</b>' +
          '<div class="sysc-semilla">semilla ' + semilla + ' · cuestión ' + indice +
          ' &nbsp;·&nbsp; identificador ' + S.esc(Q.clavePregunta) + '</div>' +
          Q.enun + '</div>';
        h += aviso('<b>Qué se pide:</b> ' + Q.pide);

        var res = corrigeQ(Q, v.resp);
        if (res) {
          if (res.msg) {
            h += cajas([{ clase: 'eq-ko', html: res.msg }]);
          } else {
            marcador[Q.clavePregunta] = res.ok;
            h += cajas([{
              clase: res.ok ? 'eq-ok' : 'eq-ko',
              html: '<b>' + (res.ok ? 'Correcto' : 'Todavía no') + '</b><br>He leído: <code>' +
                S.esc(String(res.leido)) + '</code><br><span class="ap-nota">' +
                (res.ok ? 'Tu respuesta coincide con la del applet.'
                  : 'Revisa los signos y el orden de los valores. Pista: ' + Q.pista) + '</span>'
            }]);
          }
        } else {
          h += nota('<b>Pista:</b> ' + Q.pista);
        }

        if (verSol) {
          h += sub('Solución razonada');
          h += Q.explica();
        }

        var claves = Object.keys(marcador);
        var aciertos = claves.filter(function (k) { return marcador[k]; }).length;
        var pct = claves.length ? Math.round(100 * aciertos / claves.length) : 0;
        h += S.resultado(aciertos + ' / ' + claves.length, 'cuestiones acertadas');
        h += S.kvs([
          'Semilla: ' + semilla,
          'Cuestión: ' + indice,
          'Tipo: ' + nombreTipo(tipo),
          'Contestadas: ' + claves.length,
          'Aciertos: ' + aciertos,
          'Porcentaje: ' + pct + ' %'
        ]);
        h += nota('El marcador cuenta cada cuestión una sola vez: si corriges tu respuesta, se guarda el ' +
          'último resultado. Cambia la semilla para practicar con una tanda completamente nueva.');
        return h;
      }, 'Escribe la respuesta tal como se pide arriba: los números separados por espacios (<code>3 -2</code>) ' +
        'o la clasificación en letras (<code>SCD</code>).'));
  };

  /* ==================================================================
     8 · diagnóstico del motor
     ================================================================== */
  function pruebas() {
    function ok(f) {
      try { return f() === true; } catch (e) { return false; }
    }
    return [
      {
        g: 'Carga', n: 'KaTeX disponible en la página',
        esperado: 'window.katex definido', v: !!window.katex, opc: true,
        avisa: 'Sin KaTeX las fórmulas se ven como texto plano, pero los cálculos siguen siendo correctos.'
      },
      { g: 'Carga', n: 'Núcleo sys-applets.js', esperado: 'window.SYS con shell y Frac', v: !!(S.shell && S.Frac) },
      { g: 'Carga', n: 'Capa lineal sys-applets-lin.js', esperado: 'S.lineal = true', v: S.lineal === true },
      {
        g: 'Carga', n: 'Módulo A (apartados 4.1 a 4.6)', esperado: 'S.extraA = true', v: S.extraA === true, opc: true,
        avisa: 'Este módulo se carga en las páginas de los apartados 4.1 a 4.6; si estás en otra página es normal que no aparezca.'
      },
      {
        g: 'Carga', n: 'Módulo B (apartados 4.7 a 4.11)', esperado: 'S.extraB = true', v: S.extraB === true, opc: true,
        avisa: 'Este módulo se carga en las páginas de los apartados 4.7 a 4.11; si estás en otra página es normal que no aparezca.'
      },
      { g: 'Carga', n: 'Módulo C (apartados 4.12 a 4.14)', esperado: 'S.extraC = true', v: S.extraC === true },
      {
        g: 'Lectura', n: 'Lectura de una ecuación', esperado: '2x-3y=5 → coeficientes 2 y −3',
        v: ok(function () {
          var E = S.parseEcu('2x-3y=5', ['x', 'y']);
          return E.coef[0].val() === 2 && E.coef[1].val() === -3 && E.b.val() === 5;
        })
      },
      {
        g: 'Lectura', n: 'Orden libre y paréntesis', esperado: '2(x-1)+y=4 → 2x+y=6',
        v: ok(function () {
          var E = S.parseEcu('2(x-1)+y=4', ['x', 'y']);
          return E.coef[0].val() === 2 && E.coef[1].val() === 1 && E.b.val() === 6;
        })
      },
      {
        g: 'Lectura', n: 'Lectura de una inecuación', esperado: '2x-3y<=6 → a=2, b=−3, c=6',
        v: ok(function () {
          var I = S.parseInec('2x-3y<=6');
          return I.a.val() === 2 && I.b.val() === -3 && I.c.val() === 6 && I.rel === '<=';
        })
      },
      {
        g: 'Álgebra', n: 'Sistema 2×2 compatible determinado', esperado: 'x = 2, y = 1',
        v: ok(function () {
          var D = S.resuelve(S.matDe([[1, 1], [2, -1]]), [new F(3), new F(3)], ['x', 'y']);
          return D.tipo === 'SCD' && D.sol[0].val() === 2 && D.sol[1].val() === 1;
        })
      },
      {
        g: 'Álgebra', n: 'Sistema incompatible', esperado: 'tipo SI',
        v: ok(function () {
          return S.discute(S.matDe([[1, 1], [2, 2]]), [new F(1), new F(5)], ['x', 'y']).tipo === 'SI';
        })
      },
      {
        g: 'Álgebra', n: 'Sistema compatible indeterminado', esperado: 'tipo SCI, 1 grado de libertad',
        v: ok(function () {
          var D = S.discute(S.matDe([[1, 1], [2, 2]]), [new F(3), new F(6)], ['x', 'y']);
          return D.tipo === 'SCI' && D.gl === 1;
        })
      },
      {
        g: 'Álgebra', n: 'Gauss en un 3×3', esperado: 'rango 3 y solución única',
        v: ok(function () {
          var M = S.matDe([[1, 1, 1], [1, -1, 2], [2, 1, -1]]);
          var D = S.resuelve(M, [new F(6), new F(5), new F(1)], ['x', 'y', 'z']);
          return D.rA === 3 && D.tipo === 'SCD' && D.gauss.pasos.length > 1;
        })
      },
      {
        g: 'Álgebra', n: 'Determinante 3×3 (Sarrus)', esperado: 'det = 1',
        v: ok(function () { return S.det(S.matDe([[1, 2, 3], [0, 1, 4], [5, 6, 0]])).val() === 1; })
      },
      {
        g: 'Álgebra', n: 'Rango de una matriz con filas proporcionales', esperado: 'rango 1',
        v: ok(function () { return S.rango(S.matDe([[1, 2, 3], [2, 4, 6], [-1, -2, -3]])) === 1; })
      },
      {
        g: 'Álgebra', n: 'Método de reducción con m.c.m.', esperado: 'x = 2, y = 3',
        v: ok(function () {
          var Rd = S.reduccion(S.matDe([[2, 3], [3, -1]]), [new F(13), new F(3)], { eliminar: 'x' });
          return Rd.tipo === 'SCD' && Rd.sol[0].val() === 2 && Rd.sol[1].val() === 3;
        })
      },
      {
        g: 'Geometría', n: 'Corte de dos rectas', esperado: 'punto (2, 1)',
        v: ok(function () {
          var c = S.corte({ a: 1, b: 1, c: 3 }, { a: 2, b: -1, c: 3 });
          return c.tipo === 'punto' && c.x.val() === 2 && c.y.val() === 1;
        })
      },
      {
        g: 'Geometría', n: 'Vértices de un recinto triangular', esperado: '3 vértices exactos',
        v: ok(function () { return S.vertices(S.parseInecs('x>=0\ny>=0\nx+y<=6')).length === 3; })
      },
      {
        g: 'Geometría', n: 'Vértices con coordenadas fraccionarias', esperado: 'aparece una fracción',
        v: ok(function () {
          var V = S.vertices(S.parseInecs('x>=0\ny>=0\n3x+2y<=12\n2x+5y<=16'));
          return V.some(function (p) { return p.x.d !== 1n || p.y.d !== 1n; });
        })
      },
      {
        g: 'Geometría', n: 'Recinto acotado y no acotado', esperado: 'true y false',
        v: ok(function () {
          return S.recintoAcotado(S.parseInecs('x>=0\ny>=0\nx+y<=6')) === true &&
            S.recintoAcotado(S.parseInecs('x>=0\ny>=0\nx+y>=4')) === false;
        })
      },
      {
        g: 'Geometría', n: 'Optimización sobre los vértices', esperado: 'máximo F = 18 en (0, 6)',
        v: ok(function () {
          var E = S.evalObjetivo(S.parseInecs('x>=0\ny>=0\nx+y<=6'), { p: 1, q: 3 });
          return E.max.valor.val() === 18 && E.max.x.val() === 0 && E.max.y.val() === 6;
        })
      },
      {
        g: 'Geometría', n: 'Punto dentro de un semiplano', esperado: '(0,0) cumple 2x−3y≤6',
        v: ok(function () { return S.cumple(S.parseInec('2x-3y<=6'), 0, 0) === true; })
      },
      {
        g: 'No lineales', n: 'Reconocimiento de una circunferencia', esperado: 'centro (0,0), radio 5',
        v: ok(function () {
          var C = S.curva('x^2+y^2=25');
          return C.tipo === 'circunferencia' && Math.abs(C.radio - 5) < 1e-9;
        })
      },
      {
        g: 'No lineales', n: 'Recta y parábola', esperado: '2 soluciones',
        v: ok(function () { return S.noLineal('y=x^2-1', 'y=2x+2').soluciones.length === 2; })
      },
      {
        g: 'No lineales', n: 'Recta tangente a una parábola', esperado: '1 solución',
        v: ok(function () { return S.noLineal('y=x^2', 'y=2x-1').soluciones.length === 1; })
      },
      {
        g: 'No lineales', n: 'Sistema sin solución real', esperado: '0 soluciones',
        v: ok(function () { return S.noLineal('y=x^2+2', 'y=x-1').soluciones.length === 0; })
      },
      {
        g: 'No lineales', n: 'Hipérbola xy = 6 con una recta', esperado: '2 soluciones',
        v: ok(function () { return S.noLineal('xy=6', 'x+y=5').soluciones.length === 2; })
      },
      {
        g: 'Figuras', n: 'S.plano genera un SVG grande', esperado: 'viewBox de 760×540',
        v: ok(function () {
          var svg = S.plano({ W: 760, H: 540, rectas: [{ a: 1, b: 1, c: 3 }] });
          return svg.indexOf('viewBox="0 0 760 540"') > 0 && svg.indexOf('<svg') >= 0;
        })
      },
      {
        g: 'Figuras', n: 'Regiones sombreadas', esperado: 'polígono con transparencia',
        v: ok(function () {
          var svg = S.plano({ regiones: [{ inecs: S.parseInecs('x>=0\ny>=0\nx+y<=6') }] });
          return svg.indexOf('fill-opacity') > 0 && svg.indexOf('<polygon') > 0;
        })
      },
      {
        g: 'Applets', n: 'Los siete applets del módulo C están registrados',
        esperado: 'semiplano, recinto, optimiza, noLinealGraf, noLinealPaso, autoevaluacion, diagnostico',
        v: ['semiplano', 'recinto', 'optimiza', 'noLinealGraf', 'noLinealPaso', 'autoevaluacion', 'diagnostico']
          .every(function (k) { return typeof R[k] === 'function'; })
      },
      {
        g: 'Applets', n: 'Mensajes de error didácticos', esperado: 'una entrada mal escrita avisa al alumno',
        v: ok(function () {
          try { S.parseInec('2x-3y'); return false; } catch (e) {
            return /desigualdad|Escribe|escribe/.test(e.message);
          }
        })
      }
    ];
  }

  R.diagnostico = function (node) {
    return S.shell(node, 'Diagnóstico del motor',
      'Esta ficha comprueba que el tema ha cargado bien y que el motor de cálculo responde. La primera parte ' +
      'dice qué archivos se han cargado (núcleo, capa de álgebra lineal y módulos A, B y C de applets). ' +
      'La segunda ejecuta comprobaciones internas: lectura de ecuaciones e inecuaciones, Gauss, rangos, ' +
      'determinantes, vértices de recintos, optimización y sistemas no lineales. ' +
      'Si alguna fila sale en rojo, revisa el orden de los <code>&lt;script&gt;</code> en ' +
      '<code>assets/_scripts.html</code>: primero <code>sys-applets.js</code>, después ' +
      '<code>sys-applets-lin.js</code> y por último los módulos.',
      [
        { id: 'soloFallos', label: 'Ver solo lo que falla', type: 'check', value: false },
        { id: 'verAvisos', label: 'Ver los avisos registrados', type: 'check', value: true },
        {
          type: 'presets', list: [
            { label: 'Repetir las comprobaciones', title: 'Vuelve a ejecutar toda la batería', apply: function () {} },
            {
              label: 'Ver todo', title: 'Muestra también las comprobaciones correctas',
              apply: function (c) { c.soloFallos.checked = false; c.verAvisos.checked = true; }
            }
          ]
        }
      ],
      seguro(function (v) {
        var P = pruebas();
        var oblig = P.filter(function (p) { return !p.opc; });
        var bien = oblig.filter(function (p) { return p.v; }).length;
        var mal = oblig.length - bien;
        var ausentes = P.filter(function (p) { return p.opc && !p.v; }).length;
        var h = '';

        h += S.resultado(bien + ' / ' + oblig.length, 'comprobaciones esenciales superadas');
        h += cajas([{
          clase: mal === 0 ? 'eq-ok' : 'eq-ko',
          html: mal === 0
            ? '<b>Todo correcto</b><br>El núcleo, la capa de álgebra lineal y los applets responden como se espera.' +
              (ausentes ? '<br><span class="ap-nota">Hay ' + ausentes + ' elemento' + (ausentes === 1 ? '' : 's') +
                ' opcional' + (ausentes === 1 ? '' : 'es') + ' sin cargar (fila' + (ausentes === 1 ? '' : 's') +
                ' marcada' + (ausentes === 1 ? '' : 's') + ' como <em>opcional</em>): no afecta a los cálculos ' +
                'de esta página.</span>' : '')
            : '<b>Hay ' + mal + (mal === 1 ? ' comprobación que no pasa' : ' comprobaciones que no pasan') + '</b><br>' +
              'Las filas en rojo de la tabla indican qué parte del motor no está disponible. ' +
              'Lo más habitual es que falte un archivo o que el orden de carga no sea el correcto.'
        }]);

        var grupos = [];
        P.forEach(function (p) { if (grupos.indexOf(p.g) < 0) grupos.push(p.g); });
        grupos.forEach(function (g) {
          var filas = P.filter(function (p) { return p.g === g && (!v.soloFallos || !p.v); })
            .map(function (p) {
              var estado = p.v ? S.badge('correcto', 'si')
                : (p.opc ? S.badge('opcional: no cargado', 'info') : S.badge('falla', 'no'));
              return {
                clase: p.v ? '' : (p.opc ? '' : 'ap-card-ko'),
                celdas: [
                  S.esc(p.n),
                  S.esc(p.esperado || ''),
                  estado + (!p.v && p.avisa ? '<div class="ap-nota">' + p.avisa + '</div>' : '')
                ]
              };
            });
          if (!filas.length) return;
          h += sub(g);
          h += S.tabla(['Comprobación', 'Resultado esperado', 'Estado'], filas, { thPrimera: false });
        });

        h += S.kvs([
          'Núcleo: ' + (S.shell ? 'cargado' : 'ausente'),
          'Capa lineal: ' + (S.lineal === true ? 'cargada' : 'ausente'),
          'Módulo A: ' + (S.extraA === true ? 'cargado' : 'ausente'),
          'Módulo B: ' + (S.extraB === true ? 'cargado' : 'ausente'),
          'Módulo C: ' + (S.extraC === true ? 'cargado' : 'ausente'),
          'Comprobaciones esenciales: ' + bien + ' correctas, ' + mal + ' con fallo',
          'Elementos opcionales sin cargar: ' + ausentes
        ]);

        if (v.verAvisos) {
          var log = (S.log || []);
          h += sub('Avisos registrados por los applets de esta página');
          if (!log.length) {
            h += aviso('Ningún applet ha registrado errores en esta página.');
          } else {
            h += S.tabla(['Applet', 'Aviso'], log.slice(-12).map(function (e) {
              return [S.esc(String(e.applet)), S.esc(String(e.error))];
            }), { thPrimera: false });
            h += nota('Los avisos suelen venir de entradas escritas a medias mientras se teclea: no son ' +
              'errores del motor si desaparecen al completar la expresión.');
          }
        }
        return h;
      }, 'Si esta ficha no se dibuja, el problema está en el propio núcleo: revisa la consola del navegador.'));
  };

  /* ==================================================================
     9 · registro terminado
     ================================================================== */
  S.extraC = true;
  if (S.monta) S.monta();
})();
