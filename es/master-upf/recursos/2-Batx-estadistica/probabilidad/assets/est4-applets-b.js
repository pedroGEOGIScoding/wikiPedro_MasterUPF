/* =====================================================================
   est4-applets-b.js · Tema 4 Probabilidad (parte 1) · 2.º Bachillerato
   Módulo B — Operaciones con sucesos, leyes de De Morgan y
              experimentos compuestos con árboles ponderados (4.4 y 4.5)

   Depende de window.EST4 (est4-applets.js), que aporta el armazón de
   applet, el álgebra de sucesos, los diagramas de Venn por regiones,
   el árbol ponderado y la aritmética exacta con fracciones.

   Applets registrados aquí (20):
     union · oExclusivo · interseccion · contrario · diferencia ·
     simetrica · vennLab · propiedades · morgan · morganDado ·
     morganLoteria · tablaMaestra · arbolPonderado · reglasArbol ·
     dosUrnas · reemplazamiento · barajaFiguras · arbolNoUniforme ·
     fermatRoberval · entrenador

   Todas las probabilidades se calculan con fracciones exactas del
   núcleo: nunca se acumula coma flotante, de modo que las ramas de un
   árbol suman exactamente 1.

   JavaScript plano (ES5), SVG propio, sin CDN ni dependencias externas.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.EST4;
  if (!S) { console.error('est4-applets-b.js: falta el núcleo est4-applets.js'); return; }
  var R = S.registry;

  /* atajos del núcleo */
  var K = S.K, KD = S.KD, esc = S.esc, nc = S.nc;
  var frac = S.frac, fSuma = S.fSuma, fResta = S.fResta, fProd = S.fProd;
  var fVal = S.fVal, fIgual = S.fIgual, fracTex = S.fracTex, fracTxt = S.fracTxt,
      fracFull = S.fracFull, leeProb = S.leeProb;
  var U = S.U, I = S.I, D = S.D, SD = S.SD, Co = S.Co;
  var igual = S.igual, subset = S.subset, ordena = S.ordena;
  var setTxt = S.setTxt, setTex = S.setTex, incompatibles = S.incompatibles;
  var shell = S.shell, venn = S.venn, arbol = S.arbol, tabla = S.tabla, kvs = S.kvs;
  var nota = S.nota, aviso = S.aviso, bien = S.bien, tarjeta = S.tarjeta;
  var insignia = S.insignia, resultado = S.resultado, fichas = S.fichas;
  var entero = S.entero, COL = S.COL;

  /* Normaliza el símbolo de contrario: el alumno puede escribir el prima
     tipográfico (\u2032), la comilla curva o el acento, y el evaluador del
     núcleo espera la comilla recta. */
  function normExpr(e) {
    return String(e == null ? '' : e).replace(/[\u2032\u2019\u00B4\u0060]/g, "'");
  }
  function evalua(ex, sets, E) { return S.evalua(normExpr(ex), sets, E); }
  function regiones(ex, n) { return S.regiones(normExpr(ex), n); }

  /* ==================================================================
     0 · utilidades comunes del módulo
     ================================================================== */

  /* Espacio muestral escrito por el alumno. Tope 24 elementos: por
     encima de eso el diagrama de Venn deja de ser legible. */
  function leeE(txt) {
    var E = S.conjunto(txt, 24, 'El espacio muestral E');
    if (E.length < 2)
      throw Error('El espacio muestral necesita al menos 2 resultados. Escribe por ejemplo: 1 2 3 4 5 6');
    return E;
  }

  /* Suceso escrito por el alumno: tiene que ser un subconjunto de E. */
  function leeSub(txt, E, nombre) {
    var A = S.conjunto(txt, 24, nombre);
    A.forEach(function (x) {
      if (E.indexOf(x) < 0)
        throw Error('El elemento ' + x + ' de ' + nombre + ' no está en E = ' + setTxt(E, E) +
                    '. Un suceso solo puede contener resultados del espacio muestral.');
    });
    return ordena(A, E);
  }

  /* Probabilidad por la regla de Laplace, como fracción exacta. */
  function pLap(A, E) { return frac(A.length, E.length); }

  /* Fila de tabla con un suceso: nombre, elementos, cardinal y probabilidad */
  function filaSuceso(nombreTex, A, E) {
    return [K(nombreTex), K(setTex(A, E)), String(A.length), K(fracTex(pLap(A, E)))];
  }
  var CAB_SUC = ['Suceso', 'Elementos', 'Casos', 'Probabilidad'];

  /* Lista numerada de pasos */
  function pasos(items) {
    var h = '<ol class="ap-pasos">';
    items.forEach(function (t) { h += '<li>' + t + '</li>'; });
    return h + '</ol>';
  }

  /* Diagrama de Venn de una expresión de sucesos.
     Si E es pequeño se escriben además los elementos dentro. */
  function vennExpr(expr, E, A, B, C, cap, color) {
    var n = C ? 3 : 2;
    var regs;
    try { regs = regiones(expr, n); }
    catch (e) {
      throw Error('No he podido interpretar la expresión «' + expr + '». ' + e.message);
    }
    var spec = {
      n: n, pinta: regs, color: color || COL.azulClaro,
      nombres: n === 3 ? ['A', 'B', 'C'] : ['A', 'B'],
      cap: cap, label: 'Diagrama de Venn: regiones de ' + expr
    };
    if (E && E.length <= 12) {
      spec.E = E; spec.A = A || []; spec.B = B || [];
      if (C) spec.C = C;
    }
    return venn(spec);
  }

  /* Nombre legible de las regiones atómicas, para la comprobación
     paso a paso de vennLab y morgan. */
  var NOMBRE_REG2 = {
    a: 'solo A', b: 'solo B', ab: 'A y B a la vez', out: 'ni A ni B'
  };
  var NOMBRE_REG3 = {
    a: 'solo A', b: 'solo B', c: 'solo C',
    ab: 'A y B (sin C)', ac: 'A y C (sin B)', bc: 'B y C (sin A)',
    abc: 'los tres a la vez', out: 'ninguno de los tres'
  };
  function nombreRegion(r, n) { return (n === 3 ? NOMBRE_REG3 : NOMBRE_REG2)[r] || r; }

  function listaRegiones(regs, n) {
    if (!regs.length) return '<b>ninguna región</b>: la expresión da el suceso imposible $\\varnothing$';
    return regs.map(function (r) {
      return '<code>' + esc(r) + '</code> (' + nombreRegion(r, n) + ')';
    }).join(', ');
  }

  /* Instrucción de formato reutilizada en todos los applets de conjuntos */
  var FORMATO =
    'Escribe los elementos separados por espacios o comas; las llaves son opcionales. ' +
    'Formatos válidos: <code>1 2 3 4 5 6</code>, <code>{2, 4, 6}</code>, <code>MR MV CR</code>.';
  var FORMATO_EXPR =
    'Sintaxis de las expresiones: <code>u</code> para la unión, <code>n</code> para la intersección, ' +
    '<code>\u2032</code> (apóstrofo) para el contrario, <code>-</code> para la diferencia, ' +
    '<code>^</code> para la diferencia simétrica y paréntesis. ' +
    'Ejemplos: <code>A u B</code>, <code>(A u B)\u2032</code>, <code>A\u2032 n B\u2032</code>, <code>A n B\u2032</code>.';

  /* ==================================================================
     1) union — la unión de sucesos (4.4.1)
     ================================================================== */
  R.union = function (node) {
    shell(node,
      'Unión de sucesos',
      'La unión $A \\cup B$ es el suceso formado por los resultados que están <b>en $A$ o en $B$</b> ' +
      '(o en los dos): ocurre siempre que se verifique <b>al menos uno</b> de los dos. ' + FORMATO + ' ' +
      'Cambia $E$, $A$ y $B$ y observa cómo se recolorea el diagrama y cómo cambia el recuento.',
      [
        { id: 'E', label: 'Espacio muestral E', type: 'text', value: '1 2 3 4 5 6' },
        { id: 'A', label: 'Suceso A', type: 'text', value: '2 4 6' },
        { id: 'B', label: 'Suceso B', type: 'text', value: '4 5 6' },
        { type: 'presets', list: [
          { label: 'Dado: par o mayor que 3', title: 'A = par, B = mayor que 3',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '2 4 6'; c.B.value = '4 5 6'; } },
          { label: 'Dado: múltiplo de 2 o divisor de 4', title: 'A = múltiplos de 2, B = divisores de 4',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '2 4 6'; c.B.value = '1 2 4'; } },
          { label: 'Bolsa del 1 al 10: par o múltiplo de 3',
            apply: function (c) { c.E.value = '1 2 3 4 5 6 7 8 9 10'; c.A.value = '2 4 6 8 10'; c.B.value = '3 6 9'; } },
          { label: 'Ruleta de 12: múltiplo de 3 o de 7',
            apply: function (c) { c.E.value = '1 2 3 4 5 6 7 8 9 10 11 12'; c.A.value = '3 6 9 12'; c.B.value = '7'; } },
          { label: 'Sucesos incompatibles',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '1 3 5'; c.B.value = '2 4 6'; } }
        ] }
      ],
      function (v) {
        var E = leeE(v.E);
        var A = leeSub(v.A, E, 'el suceso A');
        var B = leeSub(v.B, E, 'el suceso B');
        var Un = ordena(U(A, B), E);
        var In = ordena(I(A, B), E);
        var comunes = In.length;

        var fig = venn({
          n: 2, pinta: ['a', 'ab', 'b'], color: COL.azulClaro,
          A: A, B: B, E: E.length <= 12 ? E : null,
          cap: 'Zona sombreada: $A \\cup B$. Se pinta todo lo que esté en alguno de los dos círculos.',
          label: 'Diagrama de Venn de la unión de A y B'
        });

        var tab = tabla(CAB_SUC, [
          filaSuceso('A', A, E),
          filaSuceso('B', B, E),
          filaSuceso('A \\cap B', In, E),
          { celdas: filaSuceso('A \\cup B', Un, E), clase: 'ap-hi' }
        ]);

        var recuento =
          KD('|A \\cup B| = |A| + |B| - |A \\cap B| = ' + A.length + ' + ' + B.length +
             ' - ' + comunes + ' = ' + Un.length);

        var repes = comunes
          ? 'Los ' + comunes + ' elemento' + (comunes === 1 ? '' : 's') + ' comunes ' +
            K(setTex(In, E)) + ' aparecen en $A$ y en $B$, pero en la unión <b>se escriben una sola vez</b>. ' +
            'Por eso hay que restar ' + K('|A \\cap B|') + ': si no, se contarían dos veces.'
          : 'Aquí ' + K('A \\cap B = \\varnothing') + ': los sucesos son <b>incompatibles</b> y no hay nada que restar, ' +
            'así que ' + K('|A \\cup B| = |A| + |B|') + '.';

        return fig +
          tab +
          resultado(setTxt(Un, E), 'A \u222A B, es decir, «ocurre A o ocurre B (o los dos)»') +
          '<div class="mx-info"><b>Definición formal.</b> ' +
          KD('A \\cup B = \\{\\, x \\in E : x \\in A \\;\\lor\\; x \\in B \\,\\}') +
          'Se lee: «el conjunto de los elementos $x$ de $E$ tales que $x$ pertenece a $A$ <b>o</b> $x$ pertenece a $B$».</div>' +
          '<div class="mx-info"><b>Recuento.</b> ' + recuento + repes + '</div>' +
          nota('<b>Probabilidad.</b> Si los ' + E.length + ' resultados de $E$ son equiprobables, ' +
               K('P(A \\cup B) = ' + fracFull(pLap(Un, E))) + '.') +
          aviso('<b>La trampa de la «o».</b> En matemáticas la «o» es <b>inclusiva</b>: ' +
                '«que sea par o mayor que 3» incluye al 4 y al 6, que cumplen las dos cosas a la vez. ' +
                'Si el enunciado quisiera decir «una cosa u otra, pero no las dos», estaría hablando de la ' +
                'diferencia simétrica $A \\,\\triangle\\, B$.');
      });
  };

  /* ==================================================================
     2) oExclusivo — la pareja ∨ / ∧ y el «o» inclusivo (4.4.1.1)
     ================================================================== */
  R.oExclusivo = function (node) {
    shell(node,
      'La pareja \u2228 / \u2227 y el «o» inclusivo',
      'Dos conectores lógicos que siempre van juntos: $\\lor$ («o», disyunción) define la <b>unión</b> y ' +
      '$\\land$ («y», conjunción) define la <b>intersección</b>. ' +
      'Elige un resultado concreto del espacio muestral y comprueba fila a fila la tabla de verdad. ' +
      'Escribe el resultado tal como aparece en $E$, por ejemplo <code>4</code>. ' + FORMATO,
      [
        { id: 'E', label: 'Espacio muestral E', type: 'text', value: '1 2 3 4 5 6' },
        { id: 'A', label: 'Suceso A (proposición p)', type: 'text', value: '2 4 6' },
        { id: 'B', label: 'Suceso B (proposición q)', type: 'text', value: '4 5 6' },
        { id: 'x', label: 'Resultado que examinas', type: 'text', value: '4' },
        { id: 'con', label: 'Conector', type: 'select', value: 'o', options: [
          { value: 'o',  label: 'p \u2228 q  ·  «o» inclusiva  ·  A \u222A B' },
          { value: 'y',  label: 'p \u2227 q  ·  «y»  ·  A \u2229 B' },
          { value: 'ox', label: 'o exclusiva  ·  «o uno o el otro, pero no ambos»  ·  A \u25B3 B' }
        ] },
        { type: 'presets', list: [
          { label: 'Idiomas: inglés o francés',
            apply: function (c) {
              c.E.value = 'Ana Bruno Clara David Elena Hugo';
              c.A.value = 'Ana Bruno Clara'; c.B.value = 'Clara David';
              c.x.value = 'Clara';
            } },
          { label: 'Fila V-V del dado', apply: function (c) {
              c.E.value = '1 2 3 4 5 6'; c.A.value = '2 4 6'; c.B.value = '4 5 6'; c.x.value = '4'; } },
          { label: 'Fila V-F del dado', apply: function (c) {
              c.E.value = '1 2 3 4 5 6'; c.A.value = '2 4 6'; c.B.value = '4 5 6'; c.x.value = '2'; } },
          { label: 'Fila F-V del dado', apply: function (c) {
              c.E.value = '1 2 3 4 5 6'; c.A.value = '2 4 6'; c.B.value = '4 5 6'; c.x.value = '5'; } },
          { label: 'Fila F-F del dado', apply: function (c) {
              c.E.value = '1 2 3 4 5 6'; c.A.value = '2 4 6'; c.B.value = '4 5 6'; c.x.value = '1'; } }
        ] }
      ],
      function (v) {
        var E = leeE(v.E);
        var A = leeSub(v.A, E, 'el suceso A');
        var B = leeSub(v.B, E, 'el suceso B');
        var x = String(v.x || '').trim().replace(/[{},;]/g, '');
        if (!x) throw Error('Escribe el resultado que quieres examinar, por ejemplo 4.');
        if (E.indexOf(x) < 0)
          throw Error('El resultado ' + x + ' no está en E = ' + setTxt(E, E) + '. Escribe uno de los resultados de E.');

        var p = A.indexOf(x) >= 0, q = B.indexOf(x) >= 0;
        var conj = { o: 'A u B', y: 'A n B', ox: 'A ^ B' }[v.con];
        var conjTex = { o: 'A \\cup B', y: 'A \\cap B', ox: 'A \\,\\triangle\\, B' }[v.con];
        var conjLog = { o: 'p \\lor q', y: 'p \\land q', ox: 'p \\veebar q' }[v.con];
        var conjunto = { o: U(A, B), y: I(A, B), ox: SD(A, B) }[v.con];
        var pertenece = conjunto.indexOf(x) >= 0;

        /* tabla de verdad con la fila activa resaltada */
        var filas = [];
        [[true, true], [true, false], [false, true], [false, false]].forEach(function (fp) {
          var vp = fp[0], vq = fp[1];
          var celdas = [
            vp ? 'V' : 'F', vq ? 'V' : 'F',
            (vp || vq) ? 'V' : 'F',
            (vp && vq) ? 'V' : 'F',
            (vp !== vq) ? 'V' : 'F'
          ];
          var act = (vp === p && vq === q);
          filas.push({ celdas: celdas, clase: act ? 'ap-hi' : '' });
        });
        var tv = tabla(['p', 'q', 'p \u2228 q', 'p \u2227 q', 'o exclusiva'], filas);

        var fig = vennExpr(conj, E, A, B, null,
          'Zona sombreada: ' + K(conjTex) + '. El resultado ' + esc(x) + ' ' +
          (pertenece ? 'cae dentro' : 'queda fuera') + ' de la zona.');

        var estado =
          '<div class="ap-toggles">' +
          '<span class="ap-tog ' + (p ? 'ap-onA' : '') + '">p: ' + esc(x) + ' \u2208 A \u2192 ' + (p ? 'V' : 'F') + '</span>' +
          '<span class="ap-tog ' + (q ? 'ap-onB' : '') + '">q: ' + esc(x) + ' \u2208 B \u2192 ' + (q ? 'V' : 'F') + '</span>' +
          '<span class="ap-tog ' + (pertenece ? 'ap-onAB' : '') + '">' + esc(x) + ' \u2208 ' +
            { o: 'A \u222A B', y: 'A \u2229 B', ox: 'A \u25B3 B' }[v.con] + ' \u2192 ' + (pertenece ? 'V' : 'F') + '</span>' +
          '</div>';

        var moraleja = v.con === 'o'
          ? 'La única fila en la que $p \\lor q$ es <b>falsa</b> es la última: fallan las dos condiciones. ' +
            'Traducido a conjuntos, los únicos elementos que quedan fuera de $A \\cup B$ son los que no están ' +
            'ni en $A$ ni en $B$, es decir $\\overline{A \\cup B} = \\overline{A} \\cap \\overline{B}$: ' +
            'la primera ley de De Morgan sale de leer esa fila.'
          : v.con === 'y'
            ? 'La única fila en la que $p \\land q$ es <b>verdadera</b> es la primera: hacen falta las dos cosas. ' +
              'Por eso la intersección puede quedarse vacía con facilidad.'
            : 'La «o exclusiva» es verdadera en las filas segunda y tercera, y <b>falsa cuando se cumplen las dos</b>. ' +
              'Es el «o café o té» del castellano coloquial, que en conjuntos es la diferencia simétrica ' +
              '$A \\,\\triangle\\, B = (A \\cup B) - (A \\cap B)$.';

        return estado + tv + fig +
          '<div class="mx-info"><b>Lo que dice la fila resaltada.</b> Para el resultado ' + esc(x) + ': ' +
          K(conjLog) + ' es <b>' + (pertenece ? 'verdadero' : 'falso') + '</b>, y por eso ' +
          K(esc(x) + (pertenece ? ' \\in ' : ' \\notin ') + conjTex) + '.</div>' +
          tabla(['Símbolo', 'Nombre', 'Se lee', 'Operación'], [
            ['\u2228', 'Disyunción', '«o»', K('A \\cup B')],
            ['\u2227', 'Conjunción', '«y»', K('A \\cap B')]
          ]) +
          nota('<b>Truco para no confundirlos.</b> El símbolo $\\land$ tiene la forma de la <b>A</b> de «Ambos» ' +
               'y se parece a la $\\cap$ de la intersección; $\\lor$ es su reflejo y se corresponde con la ' +
               '$\\cup$ de la unión. La forma del símbolo lógico imita la del símbolo de conjuntos.') +
          '<div class="mx-info"><b>Moraleja.</b> ' + moraleja + '</div>' +
          aviso('En matemáticas, salvo aviso explícito, la «o» es <b>siempre inclusiva</b>. ' +
                '«Que estudie inglés o francés» incluye a quienes estudian los dos idiomas.');
      });
  };

  /* ==================================================================
     3) interseccion — la intersección de sucesos (4.4.2)
     ================================================================== */
  R.interseccion = function (node) {
    shell(node,
      'Intersección de sucesos',
      'La intersección $A \\cap B$ es el suceso formado por los resultados que están <b>al mismo tiempo</b> ' +
      'en $A$ y en $B$: solo se verifica si ocurren <b>los dos</b>. Puede quedarse vacía. ' + FORMATO,
      [
        { id: 'E', label: 'Espacio muestral E', type: 'text', value: '1 2 3 4 5 6' },
        { id: 'A', label: 'Suceso A', type: 'text', value: '2 4 6' },
        { id: 'B', label: 'Suceso B', type: 'text', value: '4 5 6' },
        { type: 'presets', list: [
          { label: 'Dado: par y mayor que 3',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '2 4 6'; c.B.value = '4 5 6'; } },
          { label: 'Dado: múltiplo de 2 y divisor de 4',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '2 4 6'; c.B.value = '1 2 4'; } },
          { label: 'Ruleta de 12: divisor de 6 y de 8',
            apply: function (c) { c.E.value = '1 2 3 4 5 6 7 8 9 10 11 12'; c.A.value = '1 2 3 6'; c.B.value = '1 2 4 8'; } },
          { label: 'Frutas: roja y manzana',
            apply: function (c) { c.E.value = 'MR MV CR PV PA PL'; c.A.value = 'MR CR'; c.B.value = 'MR MV'; } },
          { label: 'Intersección vacía',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '1 3 5'; c.B.value = '2 4 6'; } }
        ] }
      ],
      function (v) {
        var E = leeE(v.E);
        var A = leeSub(v.A, E, 'el suceso A');
        var B = leeSub(v.B, E, 'el suceso B');
        var In = ordena(I(A, B), E);
        var Un = ordena(U(A, B), E);

        var fig = venn({
          n: 2, pinta: ['ab'], color: COL.verdeClaro,
          A: A, B: B, E: E.length <= 12 ? E : null,
          cap: 'Zona sombreada: $A \\cap B$, <b>solo</b> la parte común de los dos círculos.',
          label: 'Diagrama de Venn de la intersección de A y B'
        });

        var vacia = In.length === 0;

        var tab = tabla(CAB_SUC, [
          filaSuceso('A', A, E),
          filaSuceso('B', B, E),
          { celdas: filaSuceso('A \\cap B', In, E), clase: 'ap-hi' },
          filaSuceso('A \\cup B', Un, E)
        ]);

        var barajaEj =
          '<div class="mx-info"><b>Ejemplo clásico de la baraja española.</b> De 40 cartas se extrae una y se toman ' +
          '$A$ = «sacar una figura» y $B$ = «sacar copas». Hay $3 \\cdot 4 = 12$ figuras (sota, caballo y rey de ' +
          'cada palo) y 10 copas, y las figuras de copas son 3. Entonces ' +
          KD('|A \\cap B| = 3 \\qquad |A \\cup B| = 12 + 10 - 3 = 19') +
          'En palabras: $A \\cap B$ es «sacar una figura de copas» y $A \\cup B$ es «sacar una figura o una copa», ' +
          'que son 19 de las 40 cartas, o sea ' + K('P(A \\cup B) = ' + fracFull(frac(19, 40))) + '.</div>';

        return fig + tab +
          resultado(setTxt(In, E), 'A \u2229 B, es decir, «ocurren A y B a la vez»') +
          '<div class="mx-info"><b>Definición formal.</b> ' +
          KD('A \\cap B = \\{\\, x \\in E : x \\in A \\;\\land\\; x \\in B \\,\\}') + '</div>' +
          (vacia
            ? bien('Aquí ' + K('A \\cap B = \\varnothing') + ': los sucesos son <b>incompatibles</b> ' +
                   insignia('incompatibles', 'avi') + '. No pueden ocurrir a la vez, y eso no dice nada sobre su ' +
                   'tamaño: {1, 3, 5} y {2, 4, 6} son grandes y disjuntos.')
            : nota('Los sucesos son <b>compatibles</b> ' + insignia('compatibles', 'si') + ': comparten ' +
                   In.length + ' resultado' + (In.length === 1 ? '' : 's') + ', y por Laplace ' +
                   K('P(A \\cap B) = ' + fracFull(pLap(In, E))) + '.')) +
          barajaEj +
          aviso('<b>No confundas.</b> «Par <b>y</b> mayor que 3» es la intersección {4, 6}; ' +
                '«par <b>o</b> mayor que 3» es la unión {2, 4, 5, 6}. Una palabra del enunciado cambia por ' +
                'completo el conjunto y la probabilidad.');
      });
  };

  /* ==================================================================
     4) contrario — el suceso contrario como operación unaria (4.4.3.1)
     ================================================================== */
  R.contrario = function (node) {
    shell(node,
      'El suceso contrario como operación',
      'El contrario $\\overline{A} = E - A$ reúne todos los resultados de $E$ que <b>no</b> están en $A$. ' +
      'Es una operación <b>unaria</b>: a diferencia de la unión o la intersección, solo necesita un suceso. ' +
      FORMATO + ' Marca la casilla para ver el contrario del contrario.',
      [
        { id: 'E', label: 'Espacio muestral E', type: 'text', value: '1 2 3 4 5 6' },
        { id: 'A', label: 'Suceso A', type: 'text', value: '2 4 6' },
        { id: 'doble', label: 'Mostrar el contrario del contrario', type: 'check', value: false },
        { type: 'presets', list: [
          { label: 'Dado: par / impar',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '2 4 6'; } },
          { label: 'Urna de 8: mayor que 3',
            apply: function (c) { c.E.value = '1 2 3 4 5 6 7 8'; c.A.value = '4 5 6 7 8'; } },
          { label: 'Lotería: última cifra 0-3',
            apply: function (c) { c.E.value = '0 1 2 3 4 5 6 7 8 9'; c.A.value = '0 1 2 3'; } },
          { label: 'Suceso seguro: A = E',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '1 2 3 4 5 6'; } },
          { label: 'Suceso imposible: A vacío',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = ''; } }
        ] }
      ],
      function (v) {
        var E = leeE(v.E);
        var A = leeSub(v.A, E, 'el suceso A');
        var noA = ordena(Co(E, A), E);
        var doble = ordena(Co(E, noA), E);
        var pA = pLap(A, E), pNoA = pLap(noA, E);

        var fig = venn({
          n: 2, pinta: ['b', 'out'], color: COL.naranjaClaro,
          A: A, B: [], E: E.length <= 12 ? E : null,
          nombres: ['A', ''],
          cap: 'Zona sombreada: $\\overline{A}$, todo $E$ salvo $A$.',
          label: 'Diagrama de Venn del suceso contrario de A'
        });

        var tab = tabla(CAB_SUC, [
          filaSuceso('A', A, E),
          { celdas: filaSuceso('\\overline{A}', noA, E), clase: 'ap-hi' },
          filaSuceso('A \\cap \\overline{A}', ordena(I(A, noA), E), E),
          filaSuceso('A \\cup \\overline{A}', ordena(U(A, noA), E), E)
        ]);

        var comp =
          pasos([
            'Parto de $E$ = ' + K(setTex(E, E)) + ' y de $A$ = ' + K(setTex(A, E)) + '.',
            'Tacho de $E$ los elementos de $A$ y me quedo con el resto: $\\overline{A}$ = ' + K(setTex(noA, E)) + '.',
            'Compruebo que no se solapan: ' + K('A \\cap \\overline{A} = \\varnothing') + ' ' +
              insignia(igual(I(A, noA), []) ? 'correcto' : 'falla', igual(I(A, noA), []) ? 'si' : 'no') + '.',
            'Compruebo que entre los dos llenan $E$: ' + K('A \\cup \\overline{A} = E') + ' ' +
              insignia(igual(U(A, noA), E) ? 'correcto' : 'falla', igual(U(A, noA), E) ? 'si' : 'no') + '.',
            'Y por tanto ' + K('P(\\overline{A}) = 1 - P(A) = 1 - ' + fracTex(pA) + ' = ' + fracTex(pNoA)) + '.'
          ]);

        var extraDoble = v.doble
          ? venn({
              n: 2, pinta: ['a', 'ab'], color: COL.azulClaro,
              A: A, B: [], E: E.length <= 12 ? E : null, nombres: ['A', ''],
              cap: 'Zona sombreada: $\\overline{\\overline{A}}$, que vuelve a ser exactamente $A$.',
              label: 'Diagrama de Venn del contrario del contrario'
            }) +
            (igual(doble, A)
              ? bien('<b>Contrario del contrario.</b> ' + K('\\overline{\\overline{A}} = ' + setTex(doble, E) + ' = A') +
                     ' \u2713 Negar dos veces devuelve el punto de partida.')
              : '')
          : '';

        return fig + tab +
          resultado(setTxt(noA, E), '\u00AB no ocurre A \u00BB') +
          '<div class="mx-info"><b>Definición.</b> ' + KD('\\overline{A} = E - A') +
          'Si al lanzar un dado $A = \\{2, 4, 6\\}$ es «obtener par», entonces $\\overline{A} = \\{1, 3, 5\\}$ ' +
          'es «obtener impar».</div>' +
          '<div class="mx-info"><b>Comprobación paso a paso.</b>' + comp + '</div>' +
          extraDoble +
          nota('<b>Para qué sirve en probabilidad.</b> Muchas veces es mucho más corto contar lo que <b>no</b> pasa. ' +
               'Ante un «al menos uno», calcula la probabilidad de «ninguno» y resta a 1: ' +
               K('P(\\text{al menos uno}) = 1 - P(\\text{ninguno})') + '.');
      });
  };

  /* ==================================================================
     5) diferencia — la diferencia de sucesos (4.4.3.2)
     ================================================================== */
  R.diferencia = function (node) {
    shell(node,
      'Diferencia de sucesos',
      'La diferencia $A - B$ está formada por los elementos de $A$ que <b>no</b> están en $B$: ' +
      '«ocurre $A$ pero no $B$». La identidad más útil del apartado es $A - B = A \\cap \\overline{B}$, ' +
      'porque reduce la operación nueva a dos que ya conoces. ' + FORMATO,
      [
        { id: 'E', label: 'Espacio muestral E', type: 'text', value: '1 2 3 4 5 6' },
        { id: 'A', label: 'Suceso A', type: 'text', value: '2 4 5 6' },
        { id: 'B', label: 'Suceso B', type: 'text', value: '1 3 4' },
        { type: 'presets', list: [
          { label: 'Batería del dado: A - B',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '2 4 5 6'; c.B.value = '1 3 4'; } },
          { label: 'A - C con C dentro de A',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '2 4 5 6'; c.B.value = '2 4'; } },
          { label: 'C - A con C incluido: sale vacío',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '2 4'; c.B.value = '2 4 5 6'; } },
          { label: 'B - D de la batería',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '1 3 4'; c.B.value = '1 5 6'; } },
          { label: 'Sucesos disjuntos: A - B = A',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '1 3 5'; c.B.value = '2 4 6'; } }
        ] }
      ],
      function (v) {
        var E = leeE(v.E);
        var A = leeSub(v.A, E, 'el suceso A');
        var B = leeSub(v.B, E, 'el suceso B');
        var AmB = ordena(D(A, B), E);
        var BmA = ordena(D(B, A), E);
        var viaInt = ordena(I(A, Co(E, B)), E);

        var figAB = venn({
          n: 2, pinta: ['a'], color: COL.azulClaro,
          A: A, B: B, E: E.length <= 12 ? E : null,
          cap: 'Zona sombreada: $A - B$, la parte de $A$ que no pisa $B$.',
          label: 'Diagrama de Venn de la diferencia A menos B'
        });
        var figBA = venn({
          n: 2, pinta: ['b'], color: COL.rojoClaro,
          A: A, B: B, E: E.length <= 12 ? E : null,
          cap: 'Zona sombreada: $B - A$. <b>No es la misma zona</b>: la diferencia no es conmutativa.',
          label: 'Diagrama de Venn de la diferencia B menos A'
        });

        var tab = tabla(CAB_SUC, [
          filaSuceso('A', A, E),
          filaSuceso('B', B, E),
          filaSuceso('\\overline{B}', ordena(Co(E, B), E), E),
          { celdas: filaSuceso('A - B', AmB, E), clase: 'ap-hi' },
          filaSuceso('A \\cap \\overline{B}', viaInt, E),
          filaSuceso('B - A', BmA, E)
        ]);

        var conmuta = igual(AmB, BmA);
        var incl = subset(A, B);

        return figAB + figBA + tab +
          '<div class="mx-info"><b>Definición.</b> ' +
          KD('A - B = \\{\\, x \\in E : x \\in A \\;\\land\\; x \\notin B \\,\\} = A \\cap \\overline{B}') +
          'Para calcularla se escriben todos los elementos de $A$ y se quitan los que además están en $B$.</div>' +
          bien('<b>La identidad clave.</b> ' + K('A - B = ' + setTex(AmB, E)) + ' y ' +
               K('A \\cap \\overline{B} = ' + setTex(viaInt, E)) + '. ' +
               (igual(AmB, viaInt) ? 'Coinciden \u2713 ' : '') +
               'En la práctica trabajaremos siempre con $A \\cap \\overline{B}$: todo se reduce a uniones, ' +
               'intersecciones y contrarios, que son las operaciones cuyas probabilidades sabremos calcular.') +
          '<div class="ap-grid2">' +
            tarjeta('A - B', resultado(setTxt(AmB, E), K('P = ' + fracTex(pLap(AmB, E)))), '') +
            tarjeta('B - A', resultado(setTxt(BmA, E), K('P = ' + fracTex(pLap(BmA, E)))), '') +
          '</div>' +
          (conmuta
            ? nota('En este caso las dos diferencias coinciden. Eso solo puede pasar si ' + K('A = B') +
                   ', y entonces ambas son $\\varnothing$: es la única situación en que $A - B = B - A$.')
            : aviso('<b>La diferencia no es conmutativa.</b> ' + K('A - B \\ne B - A') + '. ' +
                    'La unión y la intersección son simétricas en su definición («$x$ está en uno u otro»), ' +
                    'pero en la diferencia los papeles son distintos: uno aporta los elementos y el otro los quita.')) +
          (incl
            ? bien('Además ' + K('A \\subset B') + ', y por eso ' + K('A - B = \\varnothing') + '. ' +
                   'En general ' + K('C \\subset A \\iff C - A = \\varnothing') + '.')
            : '') +
          (incompatibles(A, B)
            ? nota('Los sucesos son incompatibles, y restar un conjunto disjunto no quita nada: ' +
                   K('A \\cap B = \\varnothing \\Rightarrow A - B = A') + '.')
            : '');
      });
  };

  /* ==================================================================
     6) simetrica — la diferencia simétrica, el «o» exclusivo (4.4.3.3)
     ================================================================== */
  R.simetrica = function (node) {
    shell(node,
      'Diferencia simétrica: el «o» exclusivo',
      'Cuando en castellano decimos «o café o té» queremos decir <b>uno u otro, pero no los dos</b>. ' +
      'Ese es el «o» exclusivo, y en conjuntos se llama diferencia simétrica: ' +
      '$A \\,\\triangle\\, B = (A - B) \\cup (B - A) = (A \\cup B) - (A \\cap B)$. ' + FORMATO + ' ' +
      'Elige en el desplegable por cuál de los dos caminos quieres verla construida.',
      [
        { id: 'E', label: 'Espacio muestral E', type: 'text', value: '1 2 3 4 5 6' },
        { id: 'A', label: 'Suceso A', type: 'text', value: '2 4 6' },
        { id: 'B', label: 'Suceso B', type: 'text', value: '4 5 6' },
        { id: 'via', label: 'Camino de construcción', type: 'select', value: 'restas', options: [
          { value: 'restas', label: '(A - B) \u222A (B - A): junto los dos trozos exclusivos' },
          { value: 'union',  label: '(A \u222A B) - (A \u2229 B): a la unión le quito lo común' }
        ] },
        { type: 'presets', list: [
          { label: 'Café o té',
            apply: function (c) {
              c.E.value = 'Ana Bruno Clara David Elena';
              c.A.value = 'Ana Bruno Clara'; c.B.value = 'Clara David';
            } },
          { label: 'Dado: par o mayor que 3',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '2 4 6'; c.B.value = '4 5 6'; } },
          { label: 'Sin parte común: coincide con la unión',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '1 3'; c.B.value = '2 4'; } },
          { label: 'A = B: sale el suceso imposible',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '2 4 6'; c.B.value = '2 4 6'; } }
        ] }
      ],
      function (v) {
        var E = leeE(v.E);
        var A = leeSub(v.A, E, 'el suceso A');
        var B = leeSub(v.B, E, 'el suceso B');
        var Sim = ordena(SD(A, B), E);
        var AmB = ordena(D(A, B), E), BmA = ordena(D(B, A), E);
        var Un = ordena(U(A, B), E), In = ordena(I(A, B), E);

        var fig = venn({
          n: 2, pinta: ['a', 'b'],
          color: { a: COL.azulClaro, b: COL.rojoClaro },
          A: A, B: B, E: E.length <= 12 ? E : null,
          cap: 'Zona sombreada: $A \\,\\triangle\\, B$. La parte común <b>queda en blanco</b>: eso es lo que ' +
               'distingue el «o» exclusivo del «o» inclusivo.',
          label: 'Diagrama de Venn de la diferencia simétrica'
        });

        var cuenta = v.via === 'restas'
          ? pasos([
              'Calculo $A - B$ = ' + K(setTex(AmB, E)) + ': lo que ocurre solo en $A$.',
              'Calculo $B - A$ = ' + K(setTex(BmA, E)) + ': lo que ocurre solo en $B$.',
              'Uno los dos trozos, que son incompatibles entre sí: ' +
                K('A \\,\\triangle\\, B = ' + setTex(Sim, E)) + '.',
              'Al ser incompatibles, los cardinales se suman sin restar nada: ' +
                K('|A \\,\\triangle\\, B| = ' + AmB.length + ' + ' + BmA.length + ' = ' + Sim.length) + '.'
            ])
          : pasos([
              'Calculo $A \\cup B$ = ' + K(setTex(Un, E)) + ': todo lo que ocurre en alguno de los dos.',
              'Calculo $A \\cap B$ = ' + K(setTex(In, E)) + ': lo que ocurre en los dos a la vez.',
              'Le quito a la unión la parte común: ' + K('A \\,\\triangle\\, B = ' + setTex(Sim, E)) + '.',
              'En cardinales: ' + K('|A \\,\\triangle\\, B| = ' + Un.length + ' - ' + In.length + ' = ' + Sim.length) + '.'
            ]);

        return fig +
          tabla(CAB_SUC, [
            filaSuceso('A - B', AmB, E),
            filaSuceso('B - A', BmA, E),
            filaSuceso('A \\cup B', Un, E),
            filaSuceso('A \\cap B', In, E),
            { celdas: filaSuceso('A \\,\\triangle\\, B', Sim, E), clase: 'ap-hi' }
          ]) +
          resultado(setTxt(Sim, E), '«ocurre exactamente uno de los dos»') +
          '<div class="mx-info"><b>Construcción elegida.</b>' + cuenta + '</div>' +
          bien('Los dos caminos llevan al mismo conjunto: ' +
               K('(A - B) \\cup (B - A) = (A \\cup B) - (A \\cap B) = ' + setTex(Sim, E)) + ' \u2713') +
          '<div class="ap-trad">' +
            '<span class="ap-nat">«o café o té»</span><span class="ap-flecha">\u2192</span>' +
            '<span class="ap-mat">' + K('A \\,\\triangle\\, B') + '</span>' +
          '</div>' +
          nota('<b>Probabilidad.</b> ' + K('P(A \\,\\triangle\\, B) = ' + fracFull(pLap(Sim, E))) + ', frente a ' +
               K('P(A \\cup B) = ' + fracTex(pLap(Un, E))) + '. La diferencia entre las dos es exactamente ' +
               K('P(A \\cap B) = ' + fracTex(pLap(In, E))) + '.') +
          aviso('<b>Cuidado en los exámenes.</b> «Ocurre $A$ o $B$» es la unión, e incluye que ocurran los dos. ' +
                'Solo cuando el enunciado dice «exactamente uno», «uno pero no el otro» o «o... o...» con ' +
                'intención excluyente hay que usar $A \\,\\triangle\\, B = (A \\cap \\overline{B}) \\cup (\\overline{A} \\cap B)$.');
      });
  };

  /* ==================================================================
     7) vennLab — laboratorio de expresiones sobre el diagrama de Venn
     ================================================================== */
  R.vennLab = function (node) {
    shell(node,
      'Laboratorio de Venn: escribe tú la expresión',
      'Escribe <b>cualquier</b> expresión de sucesos y el applet colorea las regiones que le corresponden, ' +
      'calcula los elementos y te muestra la comprobación paso a paso. ' + FORMATO_EXPR + ' ' +
      'Con dos sucesos las regiones atómicas son <code>a</code> (solo A), <code>b</code> (solo B), ' +
      '<code>ab</code> (los dos) y <code>out</code> (ninguno).',
      [
        { id: 'n', label: 'Número de sucesos', type: 'select', value: '2', options: [
          { value: '2', label: '2 sucesos: A y B' },
          { value: '3', label: '3 sucesos: A, B y C' }
        ] },
        { id: 'E', label: 'Espacio muestral E', type: 'text', value: '1 2 3 4 5 6' },
        { id: 'A', label: 'Suceso A', type: 'text', value: '1 2 3' },
        { id: 'B', label: 'Suceso B', type: 'text', value: '1 3 5' },
        { id: 'C', label: 'Suceso C (solo si eliges 3 sucesos)', type: 'text', value: '2 4 6' },
        { id: 'ex', label: 'Expresión', type: 'text', value: '(A u B)\u2032',
          placeholder: '(A u B)\u2032   ·   A\u2032 n B\u2032   ·   A n B\u2032' },
        { type: 'presets', list: [
          { label: 'A u B', apply: function (c) { c.n.value = '2'; c.ex.value = 'A u B'; } },
          { label: 'A n B', apply: function (c) { c.n.value = '2'; c.ex.value = 'A n B'; } },
          { label: '(A u B)\u2032', apply: function (c) { c.n.value = '2'; c.ex.value = '(A u B)\u2032'; } },
          { label: 'A\u2032 n B\u2032', apply: function (c) { c.n.value = '2'; c.ex.value = 'A\u2032 n B\u2032'; } },
          { label: '(A n B)\u2032', apply: function (c) { c.n.value = '2'; c.ex.value = '(A n B)\u2032'; } },
          { label: 'A\u2032 u B\u2032', apply: function (c) { c.n.value = '2'; c.ex.value = 'A\u2032 u B\u2032'; } },
          { label: 'A n B\u2032 (A pero no B)', apply: function (c) { c.n.value = '2'; c.ex.value = 'A n B\u2032'; } },
          { label: 'A ^ B (exactamente uno)', apply: function (c) { c.n.value = '2'; c.ex.value = 'A ^ B'; } },
          { label: 'A n (B u C)', apply: function (c) { c.n.value = '3'; c.ex.value = 'A n (B u C)'; } },
          { label: '(A n B) u (A n C)', apply: function (c) { c.n.value = '3'; c.ex.value = '(A n B) u (A n C)'; } }
        ] }
      ],
      function (v) {
        var n = v.n === '3' ? 3 : 2;
        var E = leeE(v.E);
        var A = leeSub(v.A, E, 'el suceso A');
        var B = leeSub(v.B, E, 'el suceso B');
        var C = n === 3 ? leeSub(v.C, E, 'el suceso C') : null;
        var ex = String(v.ex || '').trim();
        if (!ex) throw Error('Escribe una expresión. Por ejemplo: (A u B)\u2032');

        var sets = n === 3 ? { A: A, B: B, C: C } : { A: A, B: B };
        var res, regs;
        try { res = ordena(evalua(ex, sets, E), E); }
        catch (e) { throw Error('En la expresión «' + ex + '»: ' + e.message); }
        try { regs = regiones(ex, n); }
        catch (e) { throw Error('En la expresión «' + ex + '»: ' + e.message); }

        var spec = {
          n: n, pinta: regs, color: COL.moradoClaro,
          nombres: n === 3 ? ['A', 'B', 'C'] : ['A', 'B'],
          cap: 'Zona sombreada: ' + esc(ex) + '. Se colorean ' + regs.length +
               ' de las ' + (n === 3 ? 8 : 4) + ' regiones atómicas.',
          label: 'Diagrama de Venn de la expresión ' + ex
        };
        if (E.length <= 12) { spec.E = E; spec.A = A; spec.B = B; if (C) spec.C = C; }
        var fig = venn(spec);

        /* comprobación elemento a elemento */
        var filas = E.map(function (x) {
          var celdas = [esc(x), A.indexOf(x) >= 0 ? 'sí' : 'no', B.indexOf(x) >= 0 ? 'sí' : 'no'];
          if (C) celdas.push(C.indexOf(x) >= 0 ? 'sí' : 'no');
          var dentro = res.indexOf(x) >= 0;
          celdas.push(dentro ? 'sí' : 'no');
          return { celdas: celdas, clase: dentro ? 'ap-hi' : '' };
        });
        var cab = ['Resultado', '¿en A?', '¿en B?'];
        if (C) cab.push('¿en C?');
        cab.push('¿en la expresión?');

        var tab = E.length <= 14 ? tabla(cab, filas) : '';

        var listaSets = [filaSuceso('A', A, E), filaSuceso('B', B, E)];
        if (C) listaSets.push(filaSuceso('C', C, E));
        listaSets.push({ celdas: [esc(ex), K(setTex(res, E)), String(res.length), K(fracTex(pLap(res, E)))],
                         clase: 'ap-hi' });

        return fig +
          tabla(CAB_SUC, listaSets) +
          resultado(setTxt(res, E), esc(ex)) +
          '<div class="mx-info"><b>Comprobación paso a paso.</b>' +
          pasos([
            'Traduzco la expresión a regiones del diagrama: ' + listaRegiones(regs, n) + '.',
            'Coloreo esas regiones y solo esas.',
            'Recojo los elementos que caen dentro: ' + K(setTex(res, E)) + ', en total ' + res.length +
              ' de ' + E.length + '.',
            'Por la regla de Laplace, ' + K('P = ' + fracFull(pLap(res, E))) + '.'
          ]) + '</div>' +
          tab +
          nota('<b>Cómo leer la tabla.</b> Cada fila es un resultado del espacio muestral. Las filas resaltadas ' +
               'son las que cumplen la expresión: son exactamente los elementos que están dentro de la zona ' +
               'sombreada del diagrama. Prueba a escribir <code>(A u B)\u2032</code> y luego ' +
               '<code>A\u2032 n B\u2032</code>: verás que colorean lo mismo.') +
          aviso('<b>Errores de escritura frecuentes.</b> El apóstrofo va <b>después</b> del suceso o del ' +
                'paréntesis: <code>A\u2032</code>, <code>(A u B)\u2032</code>. Y el paréntesis importa: ' +
                '<code>(A u B)\u2032</code> no es lo mismo que <code>A\u2032 u B\u2032</code>.');
      });
  };

  /* ==================================================================
     8) propiedades — comprobador del álgebra de sucesos (4.4.4)
     ================================================================== */
  var PROPS = [
    { id: 'conm-u', nom: 'Conmutativa de la unión', izq: 'A u B', der: 'B u A',
      tex: 'A \\cup B = B \\cup A', cierta: true,
      com: 'La definición de la unión es simétrica: da igual el orden en que nombres los sucesos.' },
    { id: 'conm-n', nom: 'Conmutativa de la intersección', izq: 'A n B', der: 'B n A',
      tex: 'A \\cap B = B \\cap A', cierta: true,
      com: 'También es simétrica: «$A$ y $B$» es lo mismo que «$B$ y $A$».' },
    { id: 'asoc-u', nom: 'Asociativa de la unión', izq: 'A u (B u C)', der: '(A u B) u C',
      tex: 'A \\cup (B \\cup C) = (A \\cup B) \\cup C', cierta: true,
      com: 'Al unir tres sucesos, los paréntesis no cambian nada; por eso se puede escribir $A \\cup B \\cup C$.' },
    { id: 'asoc-n', nom: 'Asociativa de la intersección', izq: 'A n (B n C)', der: '(A n B) n C',
      tex: 'A \\cap (B \\cap C) = (A \\cap B) \\cap C', cierta: true,
      com: 'Lo mismo con la intersección.' },
    { id: 'dist-n', nom: 'Distributiva de \u2229 respecto de \u222A', izq: 'A n (B u C)', der: '(A n B) u (A n C)',
      tex: 'A \\cap (B \\cup C) = (A \\cap B) \\cup (A \\cap C)', cierta: true,
      com: 'Se «reparte» la intersección, igual que el producto se reparte sobre la suma en los números.' },
    { id: 'dist-u', nom: 'Distributiva de \u222A respecto de \u2229', izq: 'A u (B n C)', der: '(A u B) n (A u C)',
      tex: 'A \\cup (B \\cap C) = (A \\cup B) \\cap (A \\cup C)', cierta: true,
      com: 'Esta es la que sorprende: en los números no hay nada parecido, aquí sí se cumple.' },
    { id: 'neutro-n', nom: 'Elemento neutro de la intersección', izq: 'A n E', der: 'A',
      tex: 'A \\cap E = A', cierta: true,
      com: 'Intersecar con el suceso seguro no quita nada.' },
    { id: 'compl-n', nom: 'Elemento complementario (intersección)', izq: 'A n A\u2032', der: 'A - A',
      tex: 'A \\cap \\overline{A} = \\varnothing', cierta: true,
      com: 'Un resultado no puede estar dentro y fuera de $A$ a la vez.' },
    { id: 'compl-u', nom: 'Elemento complementario (unión)', izq: 'A u A\u2032', der: 'E',
      tex: 'A \\cup \\overline{A} = E', cierta: true,
      com: 'Entre $A$ y su contrario se reparten todo el espacio muestral.' },
    { id: 'idem', nom: 'Idempotente', izq: 'A n A', der: 'A u A',
      tex: 'A \\cap A = A \\cup A = A', cierta: true,
      com: 'Repetir un suceso no aporta nada nuevo.' },
    { id: 'simpl-n', nom: 'Simplificativa (intersección)', izq: 'A n (A u B)', der: 'A',
      tex: 'A \\cap (A \\cup B) = A', cierta: true,
      com: 'Como $A \\subset A \\cup B$, al intersecar solo sobrevive $A$.' },
    { id: 'simpl-u', nom: 'Simplificativa (unión)', izq: 'A u (A n B)', der: 'A',
      tex: 'A \\cup (A \\cap B) = A', cierta: true,
      com: 'Como $A \\cap B \\subset A$, unirlo a $A$ no añade nada.' },
    { id: 'doble', nom: 'Contrario del contrario', izq: 'A\u2032\u2032', der: 'A',
      tex: '\\overline{\\overline{A}} = A', cierta: true,
      com: 'Negar dos veces devuelve el punto de partida.' },
    { id: 'morgan1', nom: 'Primera ley de De Morgan', izq: '(A u B)\u2032', der: 'A\u2032 n B\u2032',
      tex: '\\overline{A \\cup B} = \\overline{A} \\cap \\overline{B}', cierta: true,
      com: 'El contrario de la unión es la intersección de los contrarios: «ni uno ni otro».' },
    { id: 'morgan2', nom: 'Segunda ley de De Morgan', izq: '(A n B)\u2032', der: 'A\u2032 u B\u2032',
      tex: '\\overline{A \\cap B} = \\overline{A} \\cup \\overline{B}', cierta: true,
      com: 'El contrario de la intersección es la unión de los contrarios: «al menos a uno le falla».' },
    { id: 'absorbe', nom: 'Ejercicio de demostración', izq: 'A u (A\u2032 n B)', der: 'A u B',
      tex: 'A \\cup (\\overline{A} \\cap B) = A \\cup B', cierta: true,
      com: 'Por la distributiva, $A \\cup (\\overline{A} \\cap B) = (A \\cup \\overline{A}) \\cap (A \\cup B) = ' +
           'E \\cap (A \\cup B) = A \\cup B$.' },
    { id: 'trampa1', nom: 'TRAMPA: ¿la diferencia es conmutativa?', izq: 'A - B', der: 'B - A',
      tex: 'A - B \\overset{?}{=} B - A', cierta: false,
      com: 'Es falsa salvo si $A = B$. En la diferencia los dos sucesos tienen papeles distintos: ' +
           'uno aporta los elementos y el otro los quita.' },
    { id: 'trampa2', nom: 'TRAMPA: contrario de la intersección', izq: '(A n B)\u2032', der: 'A\u2032 n B\u2032',
      tex: '\\overline{A \\cap B} \\overset{?}{=} \\overline{A} \\cap \\overline{B}', cierta: false,
      com: 'Este es <b>el error más repetido del tema</b>. El contrario de «los dos aprueban» no es ' +
           '«los dos suspenden», sino «al menos uno suspende»: $\\overline{A} \\cup \\overline{B}$.' }
  ];

  R.propiedades = function (node) {
    shell(node,
      'Comprobador de propiedades del álgebra de sucesos',
      'Los sucesos con la unión, la intersección y el contrario forman un <b>álgebra de Boole</b>: ' +
      'estas son las reglas del juego para simplificar expresiones. ' +
      'Elige una propiedad y el applet evalúa los <b>dos miembros</b> con tus sucesos, los compara y dibuja ' +
      'los dos diagramas para que veas si colorean lo mismo. ' +
      'Dos de las fichas son <b>trampas</b>: propiedades falsas que se cuelan en los exámenes. ' + FORMATO,
      [
        { id: 'prop', label: 'Propiedad', type: 'select', value: 'dist-n',
          options: PROPS.map(function (p) { return { value: p.id, label: p.nom }; }) },
        { id: 'E', label: 'Espacio muestral E', type: 'text', value: '1 2 3 4 5 6' },
        { id: 'A', label: 'Suceso A', type: 'text', value: '1 2 3' },
        { id: 'B', label: 'Suceso B', type: 'text', value: '1 3 5' },
        { id: 'C', label: 'Suceso C', type: 'text', value: '2 4 6' },
        { type: 'presets', list: [
          { label: 'Batería del dado',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '1 2 3'; c.B.value = '1 3 5'; c.C.value = '2 4 6'; } },
          { label: 'Urna de 8 bolas',
            apply: function (c) { c.E.value = '1 2 3 4 5 6 7 8'; c.A.value = '4 5 6 7 8'; c.B.value = '2 4 6 8'; c.C.value = '1 2 3 4'; } },
          { label: 'Última cifra de la lotería',
            apply: function (c) { c.E.value = '0 1 2 3 4 5 6 7 8 9'; c.A.value = '0 1 2 3'; c.B.value = '0 2 4 6 8'; c.C.value = '6 7 8 9'; } },
          { label: 'Ver la trampa de De Morgan',
            apply: function (c) { c.prop.value = 'trampa2'; c.E.value = '1 2 3 4 5 6'; c.A.value = '1 2 3'; c.B.value = '1 3 5'; } },
          { label: 'A y B incompatibles',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '1 3 5'; c.B.value = '2 4 6'; c.C.value = '1 2'; } }
        ] }
      ],
      function (v) {
        var E = leeE(v.E);
        var A = leeSub(v.A, E, 'el suceso A');
        var B = leeSub(v.B, E, 'el suceso B');
        var C = leeSub(v.C, E, 'el suceso C');
        var p = null;
        PROPS.forEach(function (q) { if (q.id === v.prop) p = q; });
        if (!p) throw Error('Elige una propiedad de la lista.');

        var sets = { A: A, B: B, C: C };
        var izq = ordena(evalua(p.izq, sets, E), E);
        var der = ordena(evalua(p.der, sets, E), E);
        var coincide = igual(izq, der);
        var usaC = /C/.test(p.izq + p.der);
        var n = usaC ? 3 : 2;

        function figura(expr, color, cual) {
          var regs = regiones(expr, n);
          var spec = {
            n: n, pinta: regs, color: color,
            nombres: n === 3 ? ['A', 'B', 'C'] : ['A', 'B'],
            cap: cual + ': ' + esc(expr),
            label: 'Diagrama de Venn de ' + expr
          };
          if (E.length <= 12) { spec.E = E; spec.A = A; spec.B = B; if (usaC) spec.C = C; }
          return venn(spec);
        }

        var veredicto = coincide
          ? (p.cierta
              ? bien('<b>Se cumple</b> ' + insignia('correcto', 'si') + '. Los dos miembros dan el mismo suceso: ' +
                     K(setTex(izq, E)) + '. Y no es casualidad: la propiedad es cierta para <b>cualesquiera</b> ' +
                     'sucesos, no solo para estos.')
              : aviso('Con <b>estos</b> sucesos concretos los dos miembros coinciden, pero la propiedad ' +
                      '<b>es falsa en general</b> ' + insignia('falsa', 'no') + '. Cambia $A$ y $B$ y encontrarás ' +
                      'un contraejemplo: una igualdad no se demuestra comprobando un caso.'))
          : S.mal('<b>No se cumple</b> ' + insignia('contraejemplo', 'no') + '. El miembro izquierdo vale ' +
                  K(setTex(izq, E)) + ' y el derecho ' + K(setTex(der, E)) + '. ' +
                  (p.cierta
                    ? 'Si esta propiedad es verdadera y aquí falla, revisa que $A$, $B$ y $C$ sean subconjuntos de $E$.'
                    : 'Acabas de construir un <b>contraejemplo</b>: con un solo caso en contra la igualdad queda ' +
                      'descartada para siempre.'));

        return '<div class="mx-info"><b>Propiedad elegida.</b> ' + KD(p.tex) + '</div>' +
          tabla(CAB_SUC, [
            filaSuceso('A', A, E),
            filaSuceso('B', B, E),
            usaC ? filaSuceso('C', C, E) : filaSuceso('E', E, E),
            { celdas: ['Miembro izquierdo: ' + esc(p.izq), K(setTex(izq, E)), String(izq.length),
                       K(fracTex(pLap(izq, E)))], clase: 'ap-hi' },
            { celdas: ['Miembro derecho: ' + esc(p.der), K(setTex(der, E)), String(der.length),
                       K(fracTex(pLap(der, E)))], clase: 'ap-hi' }
          ]) +
          veredicto +
          '<div class="ap-grid2">' + figura(p.izq, COL.azulClaro, 'Miembro izquierdo') +
          figura(p.der, COL.verdeClaro, 'Miembro derecho') + '</div>' +
          '<div class="mx-info"><b>Por qué.</b> ' + p.com + '</div>' +
          nota('<b>Las tres de aprendizaje obligatorio</b> son las dos leyes de De Morgan y el contrario del ' +
               'contrario. Las demás se reconocen en cuanto las ves, pero esas tres hay que saberlas escribir ' +
               'de memoria y sin dudar.');
      });
  };

  /* ==================================================================
     9) morgan — las leyes de De Morgan paso a paso (4.4.4.1)
     ================================================================== */
  R.morgan = function (node) {
    shell(node,
      'Leyes de De Morgan paso a paso',
      'Las dos leyes: $\\overline{A \\cup B} = \\overline{A} \\cap \\overline{B}$ y ' +
      '$\\overline{A \\cap B} = \\overline{A} \\cup \\overline{B}$. ' +
      'Puedes elegir una ley del desplegable o <b>escribir tú la expresión</b> y su supuesta igual: ' +
      'el applet colorea las dos, las compara región a región y te dice si son la misma. ' + FORMATO_EXPR,
      [
        { id: 'ley', label: 'Qué quieres comprobar', type: 'select', value: 'l1', options: [
          { value: 'l1', label: 'Primera ley: (A u B)\u2032 = A\u2032 n B\u2032' },
          { value: 'l2', label: 'Segunda ley: (A n B)\u2032 = A\u2032 u B\u2032' },
          { value: 'mia', label: 'Escribo yo las dos expresiones' }
        ] },
        { id: 'E', label: 'Espacio muestral E', type: 'text', value: '1 2 3 4 5 6 7 8' },
        { id: 'A', label: 'Suceso A', type: 'text', value: '4 5 6 7 8' },
        { id: 'B', label: 'Suceso B', type: 'text', value: '2 4 6 8' },
        { id: 'ex1', label: 'Expresión 1 (si eliges «escribo yo»)', type: 'text', value: '(A u B)\u2032',
          placeholder: '(A u B)\u2032' },
        { id: 'ex2', label: 'Expresión 2 (si eliges «escribo yo»)', type: 'text', value: 'A\u2032 n B\u2032',
          placeholder: 'A\u2032 n B\u2032' },
        { type: 'presets', list: [
          { label: 'Urna de 8: mayor que 3 y par',
            apply: function (c) { c.E.value = '1 2 3 4 5 6 7 8'; c.A.value = '4 5 6 7 8'; c.B.value = '2 4 6 8'; } },
          { label: 'Dado: A = {1,2,3}, B = {1,3,5}',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '1 2 3'; c.B.value = '1 3 5'; } },
          { label: 'Lotería: 10 cifras',
            apply: function (c) { c.E.value = '0 1 2 3 4 5 6 7 8 9'; c.A.value = '0 1 2 3'; c.B.value = '0 2 4 6 8'; } },
          { label: 'Frutas del postre',
            apply: function (c) { c.E.value = 'MR MV CR PV PA PL'; c.A.value = 'MR CR'; c.B.value = 'MR MV'; } },
          { label: 'La trampa: (A n B)\u2032 frente a A\u2032 n B\u2032',
            apply: function (c) { c.ley.value = 'mia'; c.ex1.value = '(A n B)\u2032'; c.ex2.value = 'A\u2032 n B\u2032'; } }
        ] }
      ],
      function (v) {
        var E = leeE(v.E);
        var A = leeSub(v.A, E, 'el suceso A');
        var B = leeSub(v.B, E, 'el suceso B');
        var e1, e2, tit;
        if (v.ley === 'l1') { e1 = '(A u B)\u2032'; e2 = 'A\u2032 n B\u2032'; tit = 'Primera ley de De Morgan'; }
        else if (v.ley === 'l2') { e1 = '(A n B)\u2032'; e2 = 'A\u2032 u B\u2032'; tit = 'Segunda ley de De Morgan'; }
        else {
          e1 = String(v.ex1 || '').trim(); e2 = String(v.ex2 || '').trim();
          if (!e1 || !e2) throw Error('Escribe las dos expresiones que quieres comparar, por ejemplo (A u B)\u2032 y A\u2032 n B\u2032.');
          tit = 'Comparación escrita por ti';
        }

        var sets = { A: A, B: B };
        var s1 = ordena(evalua(e1, sets, E), E);
        var s2 = ordena(evalua(e2, sets, E), E);
        var r1 = regiones(e1, 2), r2 = regiones(e2, 2);
        var mismo = igual(s1, s2);

        function fig(expr, regs, color, cual) {
          var spec = {
            n: 2, pinta: regs, color: color, nombres: ['A', 'B'],
            cap: cual + ': ' + esc(expr) + ' \u2192 regiones ' +
                 (regs.length ? regs.map(function (r) { return '<code>' + r + '</code>'; }).join(', ') : '\u2205'),
            label: 'Diagrama de Venn de ' + expr
          };
          if (E.length <= 12) { spec.E = E; spec.A = A; spec.B = B; }
          return venn(spec);
        }

        var noA = ordena(Co(E, A), E), noB = ordena(Co(E, B), E);
        var Un = ordena(U(A, B), E), In = ordena(I(A, B), E);

        var detalle = v.ley === 'l1'
          ? pasos([
              'Uno los dos sucesos: $A \\cup B$ = ' + K(setTex(Un, E)) + '.',
              'Tomo el contrario de esa unión, es decir, lo que <b>no</b> está en ella: ' +
                K('\\overline{A \\cup B} = ' + setTex(s1, E)) + '.',
              'Por el otro camino: $\\overline{A}$ = ' + K(setTex(noA, E)) + ' y $\\overline{B}$ = ' + K(setTex(noB, E)) + '.',
              'Interseco los dos contrarios: ' + K('\\overline{A} \\cap \\overline{B} = ' + setTex(s2, E)) + '.',
              'Comparo: ' + (mismo ? 'son el mismo suceso \u2713' : 'no coinciden \u2717') + '.'
            ])
          : v.ley === 'l2'
            ? pasos([
                'Interseco los dos sucesos: $A \\cap B$ = ' + K(setTex(In, E)) + '.',
                'Tomo el contrario: ' + K('\\overline{A \\cap B} = ' + setTex(s1, E)) +
                  '. Basta con que falle <b>una</b> de las dos condiciones.',
                'Por el otro camino: $\\overline{A}$ = ' + K(setTex(noA, E)) + ' y $\\overline{B}$ = ' + K(setTex(noB, E)) + '.',
                'Uno los dos contrarios: ' + K('\\overline{A} \\cup \\overline{B} = ' + setTex(s2, E)) + '.',
                'Comparo: ' + (mismo ? 'son el mismo suceso \u2713' : 'no coinciden \u2717') + '.'
              ])
            : pasos([
                'Evalúo la primera expresión: ' + esc(e1) + ' = ' + K(setTex(s1, E)) +
                  ', regiones ' + listaRegiones(r1, 2) + '.',
                'Evalúo la segunda: ' + esc(e2) + ' = ' + K(setTex(s2, E)) +
                  ', regiones ' + listaRegiones(r2, 2) + '.',
                'Comparo elemento a elemento: ' + (mismo ? 'coinciden \u2713' : 'no coinciden \u2717') + '.'
              ]);

        var difer = mismo ? [] : U(D(s1, s2), D(s2, s1));

        return '<div class="mx-info"><b>' + tit + '</b></div>' +
          '<div class="ap-grid2">' + fig(e1, r1, COL.azulClaro, 'Expresión 1') +
          fig(e2, r2, COL.verdeClaro, 'Expresión 2') + '</div>' +
          tabla(CAB_SUC, [
            filaSuceso('A', A, E),
            filaSuceso('B', B, E),
            filaSuceso('\\overline{A}', noA, E),
            filaSuceso('\\overline{B}', noB, E),
            { celdas: [esc(e1), K(setTex(s1, E)), String(s1.length), K(fracTex(pLap(s1, E)))], clase: 'ap-hi' },
            { celdas: [esc(e2), K(setTex(s2, E)), String(s2.length), K(fracTex(pLap(s2, E)))], clase: 'ap-hi' }
          ]) +
          '<div class="mx-info"><b>Comprobación paso a paso.</b>' + detalle + '</div>' +
          (mismo
            ? bien('<b>Son el mismo suceso.</b> ' + K(esc(e1).replace(/\u2032/g, "'")) + ' y ' +
                   K(esc(e2).replace(/\u2032/g, "'")) + ' colorean exactamente las mismas regiones ' +
                   'y contienen los mismos ' + s1.length + ' resultados \u2713')
            : S.mal('<b>No son el mismo suceso.</b> Se diferencian en ' + setTxt(ordena(difer, E), E) +
                    '. Fíjate en qué regiones del diagrama están pintadas en una figura y no en la otra: ' +
                    'ahí está el error.')) +
          '<div class="mx-info"><b>El razonamiento que no se olvida.</b> Sea $A$ = «llevar gafas» y ' +
          '$B$ = «tener los ojos claros».' +
          '<ul><li>$\\overline{A \\cup B}$ = «no es cierto que lleve gafas o tenga ojos claros», o sea, ' +
          '<b>ni</b> lleva gafas <b>ni</b> tiene ojos claros: $\\overline{A} \\cap \\overline{B}$.</li>' +
          '<li>$\\overline{A \\cap B}$ = «no es cierto que lleve gafas y tenga ojos claros»: basta con que le ' +
          'falle una de las dos, así que es $\\overline{A} \\cup \\overline{B}$.</li></ul>' +
          'La regla mecánica («cambia $\\cup$ por $\\cap$ y pon raya a cada uno») se olvida en un mes; ' +
          'el razonamiento del «ni... ni...» no se olvida.</div>' +
          aviso('<b>Diagnóstico rápido.</b> ¿Cuál es el contrario de «los dos aprueban»? La respuesta ' +
                'incorrecta habitual es «los dos suspenden». La correcta es «al menos uno suspende».');
      });
  };

  /* ==================================================================
     10) morganDado — batería resuelta sobre el dado (4.4.4.1.1)
     ================================================================== */
  R.morganDado = function (node) {
    shell(node,
      'Batería completa sobre el dado',
      'El ejemplo resuelto del tema: se lanza un dado y se toman cuatro sucesos. ' +
      'El applet calcula <b>todas</b> las operaciones de golpe y comenta las tres lecturas importantes. ' +
      'Puedes cambiar los cuatro sucesos y ver cómo se rehace la batería entera. ' + FORMATO,
      [
        { id: 'A', label: 'Suceso A', type: 'text', value: '1 2 3' },
        { id: 'B', label: 'Suceso B', type: 'text', value: '1 3 5' },
        { id: 'C', label: 'Suceso C', type: 'text', value: '2 4 6' },
        { id: 'Dd', label: 'Suceso D', type: 'text', value: '1 3' },
        { id: 'foco', label: 'Diagrama que quieres ver', type: 'select', value: 'A n B', options: [
          { value: 'A n B', label: 'A \u2229 B' },
          { value: 'A u B', label: 'A \u222A B' },
          { value: 'A - B', label: 'A - B' },
          { value: 'A\u2032', label: 'contrario de A' },
          { value: '(A u B)\u2032', label: '(A \u222A B)\u2032' },
          { value: 'A\u2032 n B\u2032', label: 'A\u2032 \u2229 B\u2032' }
        ] },
        { type: 'presets', list: [
          { label: 'Batería del libro',
            apply: function (c) { c.A.value = '1 2 3'; c.B.value = '1 3 5'; c.C.value = '2 4 6'; c.Dd.value = '1 3'; } },
          { label: 'Par, impar, primo, mayor que 4',
            apply: function (c) { c.A.value = '2 4 6'; c.B.value = '1 3 5'; c.C.value = '2 3 5'; c.Dd.value = '5 6'; } },
          { label: 'Múltiplos y divisores',
            apply: function (c) { c.A.value = '2 4 6'; c.B.value = '1 2 4'; c.C.value = '3 6'; c.Dd.value = '2'; } },
          { label: 'B y C complementarios',
            apply: function (c) { c.A.value = '1 2 3'; c.B.value = '1 3 5'; c.C.value = '2 4 6'; c.Dd.value = '4 5 6'; } }
        ] }
      ],
      function (v) {
        var E = ['1', '2', '3', '4', '5', '6'];
        var A = leeSub(v.A, E, 'el suceso A');
        var B = leeSub(v.B, E, 'el suceso B');
        var C = leeSub(v.C, E, 'el suceso C');
        var Dd = leeSub(v.Dd, E, 'el suceso D');

        function ss(X) { return K(setTex(X, E)); }
        var ops = [
          ['A \\cap B', I(A, B)], ['A \\cap C', I(A, C)], ['B \\cap C', I(B, C)],
          ['A \\cup B', U(A, B)], ['A \\cup C', U(A, C)], ['B \\cup C', U(B, C)],
          ['\\overline{A}', Co(E, A)], ['\\overline{B}', Co(E, B)], ['\\overline{C}', Co(E, C)],
          ['A - B', D(A, B)], ['B - C', D(B, C)], ['D - B', D(Dd, B)],
          ['\\overline{A \\cup B}', Co(E, U(A, B))], ['\\overline{A} \\cap \\overline{B}', I(Co(E, A), Co(E, B))],
          ['\\overline{A \\cap B}', Co(E, I(A, B))], ['\\overline{A} \\cup \\overline{B}', U(Co(E, A), Co(E, B))]
        ];
        var filas = ops.map(function (o) {
          var X = ordena(o[1], E);
          return [K(o[0]), ss(X), String(X.length), K(fracTex(pLap(X, E)))];
        });

        var fig = vennExpr(v.foco, E, A, B, null,
          'Zona sombreada: ' + esc(v.foco) + ' con los sucesos que has escrito.');

        /* lecturas didácticas, recalculadas con los sucesos actuales */
        var lecturas = [];
        if (incompatibles(B, C))
          lecturas.push('$B \\cap C = \\varnothing$: $B$ y $C$ son <b>incompatibles</b>' +
            (igual(U(B, C), E) ? ', y además $B \\cup C = E$, luego son <b>complementarios</b>: $\\overline{B} = C$.' : '.'));
        if (igual(D(B, C), B))
          lecturas.push('$B - C = B$: restar un conjunto disjunto no quita nada. En general, ' +
            '$B \\cap C = \\varnothing \\Rightarrow B - C = B$.');
        if (subset(Dd, B))
          lecturas.push('$D - B = \\varnothing$ porque $D \\subset B$. Recuerda: $C \\subset A \\iff C - A = \\varnothing$.');
        lecturas.push('De Morgan sobre el dado: ' + K('\\overline{A \\cup B} = ' + setTex(Co(E, U(A, B)), E)) +
          ' y ' + K('\\overline{A} \\cap \\overline{B} = ' + setTex(I(Co(E, A), Co(E, B)), E)) + ' ' +
          (igual(Co(E, U(A, B)), I(Co(E, A), Co(E, B))) ? '\u2713' : '\u2717'));

        return '<div class="mx-info"><b>Experimento.</b> Se lanza un dado, $E$ = ' + ss(E) + ', y se consideran ' +
          '$A$ = ' + ss(A) + ', $B$ = ' + ss(B) + ', $C$ = ' + ss(C) + ' y $D$ = ' + ss(Dd) + '.</div>' +
          fig +
          tabla(['Operación', 'Resultado', 'Casos', 'Probabilidad'], filas) +
          '<div class="mx-info"><b>Tres lecturas que conviene decir en voz alta.</b><ul><li>' +
          lecturas.join('</li><li>') + '</li></ul></div>' +
          nota('<b>Cómo estudiar esta tabla.</b> Tápala y reconstruye tú cada fila con el diagrama delante. ' +
               'Si una fila te cuesta, escribe primero los elementos de cada suceso y opera después: ' +
               'nunca al revés.');
      });
  };

  /* ==================================================================
     11) morganLoteria — la última cifra de la lotería (4.4.4.1.2)
     ================================================================== */
  R.morganLoteria = function (node) {
    shell(node,
      'La última cifra de la lotería',
      'En un sorteo nos fijamos <b>solo en la última cifra</b> premiada, así que ' +
      '$E = \\{0, 1, 2, 3, 4, 5, 6, 7, 8, 9\\}$ y los diez resultados son equiprobables. ' +
      'Con tres sucesos se comprueba De Morgan sobre un espacio de 10 elementos y se ven las ' +
      'combinaciones con paréntesis. ' + FORMATO,
      [
        { id: 'A', label: 'Suceso A', type: 'text', value: '0 1 2 3' },
        { id: 'B', label: 'Suceso B', type: 'text', value: '0 2 4 6 8' },
        { id: 'C', label: 'Suceso C', type: 'text', value: '6 7 8 9' },
        { id: 'foco', label: 'Diagrama que quieres ver', type: 'select', value: '(A u B) n C', options: [
          { value: '(A u B) n C', label: '(A \u222A B) \u2229 C' },
          { value: '(A n B) u C', label: '(A \u2229 B) \u222A C' },
          { value: '(A u B)\u2032', label: '(A \u222A B)\u2032' },
          { value: 'A\u2032 n B\u2032', label: 'A\u2032 \u2229 B\u2032' },
          { value: 'A n B', label: 'A \u2229 B' },
          { value: 'A n C', label: 'A \u2229 C' }
        ] },
        { type: 'presets', list: [
          { label: 'Ejemplo del tema',
            apply: function (c) { c.A.value = '0 1 2 3'; c.B.value = '0 2 4 6 8'; c.C.value = '6 7 8 9'; } },
          { label: 'Cifras bajas, pares y primas',
            apply: function (c) { c.A.value = '0 1 2 3 4'; c.B.value = '0 2 4 6 8'; c.C.value = '2 3 5 7'; } },
          { label: 'Múltiplos de 3, impares, mayores que 5',
            apply: function (c) { c.A.value = '0 3 6 9'; c.B.value = '1 3 5 7 9'; c.C.value = '6 7 8 9'; } },
          { label: 'A y C incompatibles',
            apply: function (c) { c.A.value = '0 1 2 3'; c.B.value = '0 2 4 6 8'; c.C.value = '5 7 9'; } }
        ] }
      ],
      function (v) {
        var E = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        var A = leeSub(v.A, E, 'el suceso A');
        var B = leeSub(v.B, E, 'el suceso B');
        var C = leeSub(v.C, E, 'el suceso C');
        function ss(X) { return K(setTex(ordena(X, E), E)); }

        var Un = U(A, B), In = I(A, B);
        var UnC = I(Un, C), InC = U(In, C);
        var noUn = Co(E, Un), inter = I(Co(E, A), Co(E, B));

        var fig = vennExpr(v.foco, E, A, B, /C/.test(v.foco) ? C : null,
          'Zona sombreada: ' + esc(v.foco) + '. Con 10 resultados el diagrama sigue siendo legible.');

        var filas = [
          [K('A \\cup B'), ss(Un), String(Un.length), K(fracTex(pLap(Un, E)))],
          [K('A \\cap B'), ss(In), String(In.length), K(fracTex(pLap(In, E)))],
          [K('A \\cap C'), ss(I(A, C)), String(I(A, C).length), K(fracTex(pLap(I(A, C), E)))],
          [K('B \\cap C'), ss(I(B, C)), String(I(B, C).length), K(fracTex(pLap(I(B, C), E)))],
          [K('(A \\cup B) \\cap C'), ss(UnC), String(UnC.length), K(fracTex(pLap(UnC, E)))],
          [K('(A \\cap B) \\cup C'), ss(InC), String(InC.length), K(fracTex(pLap(InC, E)))],
          { celdas: [K('\\overline{A \\cup B}'), ss(noUn), String(noUn.length), K(fracTex(pLap(noUn, E)))], clase: 'ap-hi' },
          { celdas: [K('\\overline{A} \\cap \\overline{B}'), ss(inter), String(inter.length),
                     K(fracTex(pLap(inter, E)))], clase: 'ap-hi' }
        ];

        return '<div class="mx-info"><b>Datos.</b> $E$ = ' + ss(E) + ' con los diez dígitos equiprobables; ' +
          '$A$ = ' + ss(A) + ', $B$ = ' + ss(B) + ', $C$ = ' + ss(C) + '.</div>' +
          fig +
          tabla(['Operación', 'Resultado', 'Casos', 'Probabilidad'], filas) +
          (igual(noUn, inter)
            ? bien('<b>De Morgan confirmado</b> sobre un espacio de 10 elementos: ' +
                   K('\\overline{A \\cup B} = ' + setTex(ordena(noUn, E), E) + ' = \\overline{A} \\cap \\overline{B}') + ' \u2713')
            : S.mal('Algo no cuadra: revisa que $A$ y $B$ sean subconjuntos de $E$.')) +
          (incompatibles(A, C)
            ? nota('$A \\cap C = \\varnothing$: los sucesos «cifra de 0 a 3» y el tuyo son <b>incompatibles</b>. ' +
                   'Si te toca uno, seguro que no te toca el otro.')
            : '') +
          '<div class="mx-info"><b>Fíjate en los paréntesis.</b> ' +
          K('(A \\cup B) \\cap C = ' + setTex(ordena(UnC, E), E)) + ' pero ' +
          K('(A \\cap B) \\cup C = ' + setTex(ordena(InC, E), E)) + '. ' +
          'Mover un paréntesis cambia el suceso y cambia la probabilidad: en un enunciado, los paréntesis ' +
          'los pone la coma o la conjunción del castellano, así que lee muy despacio.</div>' +
          nota('<b>Traducción al lenguaje del sorteo.</b> ' + K('P(A \\cup B) = ' + fracFull(pLap(Un, E))) +
               ' es la probabilidad de que la última cifra premiada cumpla al menos una de las dos condiciones.');
      });
  };

  /* ==================================================================
     12) tablaMaestra — tabla de traducción interactiva (4.4.5)
     ================================================================== */
  var MAESTRA = [
    { nat: 'Ocurre A o B (o inclusiva)', expr: 'A u B', tex: 'A \\cup B',
      truco: 'Incluye el caso de que ocurran ambos' },
    { nat: 'Ocurren A y B', expr: 'A n B', tex: 'A \\cap B', truco: 'Zona común' },
    { nat: 'No ocurre A', expr: 'A\u2032', tex: '\\overline{A}', truco: 'Usa $1 - P(A)$' },
    { nat: 'Ocurre A pero no B', expr: 'A n B\u2032', tex: 'A \\cap \\overline{B}',
      truco: 'Nunca lo dejes escrito como $A - B$' },
    { nat: 'No ocurre ninguno de los dos', expr: 'A\u2032 n B\u2032', tex: '\\overline{A} \\cap \\overline{B} = \\overline{A \\cup B}',
      truco: 'De Morgan' },
    { nat: 'No ocurren los dos a la vez', expr: 'A\u2032 u B\u2032', tex: '\\overline{A} \\cup \\overline{B} = \\overline{A \\cap B}',
      truco: 'De Morgan' },
    { nat: 'Ocurre al menos uno', expr: 'A u B', tex: 'A \\cup B', truco: 'Contrario de «ninguno»' },
    { nat: 'Ocurre exactamente uno', expr: '(A n B\u2032) u (A\u2032 n B)', tex: '(A \\cap \\overline{B}) \\cup (\\overline{A} \\cap B)',
      truco: 'Diferencia simétrica' }
  ];

  R.tablaMaestra = function (node) {
    shell(node,
      'Tabla maestra de traducción',
      'Este es el resumen operativo del apartado: ocho frases del castellano y su traducción exacta al ' +
      'lenguaje de conjuntos. Elige una fila y verás el diagrama coloreado, los elementos concretos y la ' +
      'probabilidad con tus sucesos. Cópiala a mano en la primera página de tus apuntes. ' + FORMATO,
      [
        { id: 'fila', label: 'Frase que quieres traducir', type: 'select', value: '0',
          options: MAESTRA.map(function (m, i) { return { value: String(i), label: m.nat }; }) },
        { id: 'E', label: 'Espacio muestral E', type: 'text', value: '1 2 3 4 5 6' },
        { id: 'A', label: 'Suceso A', type: 'text', value: '2 4 6' },
        { id: 'B', label: 'Suceso B', type: 'text', value: '4 5 6' },
        { type: 'presets', list: [
          { label: 'Dado: par / mayor que 3',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '2 4 6'; c.B.value = '4 5 6'; } },
          { label: 'Aprobar mates / aprobar física',
            apply: function (c) {
              c.E.value = 'Ana Bruno Clara David Elena Hugo';
              c.A.value = 'Ana Bruno Clara David'; c.B.value = 'Clara David Elena';
            } },
          { label: 'Gafas / ojos claros',
            apply: function (c) {
              c.E.value = 'p1 p2 p3 p4 p5 p6 p7 p8';
              c.A.value = 'p1 p2 p3'; c.B.value = 'p3 p4 p5';
            } },
          { label: '«Ninguno de los dos»', apply: function (c) { c.fila.value = '4'; } },
          { label: '«No los dos a la vez»', apply: function (c) { c.fila.value = '5'; } },
          { label: '«Exactamente uno»', apply: function (c) { c.fila.value = '7'; } }
        ] }
      ],
      function (v) {
        var E = leeE(v.E);
        var A = leeSub(v.A, E, 'el suceso A');
        var B = leeSub(v.B, E, 'el suceso B');
        var idx = entero(v.fila, 0, MAESTRA.length - 1, 'La fila');
        var m = MAESTRA[idx];
        var res = ordena(evalua(m.expr, { A: A, B: B }, E), E);

        var filas = MAESTRA.map(function (q, i) {
          var X = ordena(evalua(q.expr, { A: A, B: B }, E), E);
          var celdas = [q.nat, K(q.tex), setTxt(X, E), K(fracTex(pLap(X, E))), q.truco];
          return { celdas: celdas, clase: i === idx ? 'ap-hi' : '' };
        });

        var fig = vennExpr(m.expr, E, A, B, null,
          'Zona sombreada: ' + K(m.tex) + ', la traducción de «' + esc(m.nat) + '».');

        return '<div class="ap-trad">' +
            '<span class="ap-nat">«' + esc(m.nat) + '»</span><span class="ap-flecha">\u2192</span>' +
            '<span class="ap-mat">' + K(m.tex) + '</span>' +
          '</div>' +
          fig +
          resultado(setTxt(res, E), 'elementos que cumplen la frase elegida') +
          '<div class="mx-info"><b>Probabilidad con tus datos.</b> ' +
          KD('P = \\dfrac{' + res.length + '}{' + E.length + '} = ' + fracFull(pLap(res, E))) + '</div>' +
          '<div class="ap-tbl-wrap">' +
          tabla(['Enunciado', 'Suceso', 'Elementos', 'Probabilidad', 'Truco'], filas) +
          '</div>' +
          aviso('<b>Las dos filas de De Morgan son las que más se confunden.</b> ' +
                '«No ocurre ninguno de los dos» es $\\overline{A} \\cap \\overline{B}$; ' +
                '«no ocurren los dos a la vez» es $\\overline{A} \\cup \\overline{B}$, que es mucho más grande. ' +
                'Compara sus dos filas en la tabla y verás la diferencia con tus propios números.') +
          nota('<b>Consejo de examen.</b> Antes de calcular nada, escribe la frase del enunciado y debajo su ' +
               'traducción en símbolos. La mitad de los errores de este tema son errores de traducción, no de cálculo.');
      });
  };

  /* ==================================================================
     Utilidades de árboles ponderados (apartado 4.5)
     ================================================================== */

  /* Suma de un vector de recuentos */
  function suma(arr) { var t = 0; arr.forEach(function (x) { t += x; }); return t; }

  /* Árbol de k extracciones de una urna con varios colores.
     cnt: recuentos iniciales · nom: iniciales de cada color ·
     col: color de la rama · devol: true si hay devolución.
     Las ramas imposibles (0 bolas de ese color) no se dibujan. */
  function arbolUrnaGen(cnt, nom, col, k, devol) {
    function nivel(estado, prof, camino) {
      if (prof >= k) return null;
      var tot = suma(estado);
      var hijos = [];
      for (var i = 0; i < estado.length; i++) {
        if (estado[i] <= 0) continue;
        var nuevo = estado.slice();
        if (!devol) nuevo[i] = estado[i] - 1;
        var h = { lab: nom[i], p: frac(estado[i], tot), color: col[i] };
        var sub = nivel(nuevo, prof + 1, camino + nom[i]);
        if (sub) h.hijos = sub; else h.camino = camino + nom[i];
        hijos.push(h);
      }
      return hijos;
    }
    return { lab: '', hijos: nivel(cnt, 0, '') };
  }

  /* Todos los caminos completos con su probabilidad exacta */
  function caminosUrna(cnt, nom, k, devol) {
    var out = [];
    (function rec(estado, prof, camino, p) {
      if (prof >= k) { out.push({ camino: camino, p: p }); return; }
      var tot = suma(estado);
      for (var i = 0; i < estado.length; i++) {
        if (estado[i] <= 0) continue;
        var nuevo = estado.slice();
        if (!devol) nuevo[i] = estado[i] - 1;
        rec(nuevo, prof + 1, camino + nom[i], fProd(p, frac(estado[i], tot)));
      }
    })(cnt, 0, '', frac(1, 1));
    return out;
  }

  /* Tabla de caminos con su producto, y suma final marcada */
  function tablaCaminos(cam, cabecera) {
    var tot = frac(0, 1);
    var filas = cam.map(function (c) {
      tot = fSuma(tot, c.p);
      return [c.camino, K(fracTex(c.p)), nc(fVal(c.p), 4), S.pct(fVal(c.p), 2)];
    });
    filas.push({ celdas: ['Suma', K(fracTex(tot)), nc(fVal(tot), 4), S.pct(fVal(tot), 2)], clase: 'ap-tot' });
    return tabla([cabecera || 'Camino', 'Probabilidad exacta', 'Valor', 'Porcentaje'], filas);
  }

  /* Suma de las probabilidades de los caminos que cumplen un filtro */
  function sumaSi(cam, filtro) {
    var t = frac(0, 1);
    cam.forEach(function (c) { if (filtro(c.camino)) t = fSuma(t, c.p); });
    return t;
  }
  function cuenta(cadena, letra) {
    var t = 0;
    for (var i = 0; i < cadena.length; i++) if (cadena.charAt(i) === letra) t++;
    return t;
  }

  /* Preguntas tipo sobre un experimento de dos colores */
  var PREGUNTAS = [
    { id: 'iguales', lab: 'Todas del mismo color',
      f: function (c) { return cuenta(c, c.charAt(0)) === c.length; },
      tex: 'P(\\text{mismo color})' },
    { id: 'distintos', lab: 'No todas del mismo color',
      f: function (c) { return cuenta(c, c.charAt(0)) !== c.length; },
      tex: 'P(\\text{colores distintos})' },
    { id: 'primera1', lab: 'La primera es del color 1',
      f: function (c) { return c.charAt(0) === 'B'; }, tex: 'P(\\text{primera del color 1})' },
    { id: 'almenos1', lab: 'Al menos una del color 1',
      f: function (c) { return c.indexOf('B') >= 0; }, tex: 'P(\\text{al menos una del color 1})' },
    { id: 'ninguna1', lab: 'Ninguna del color 1',
      f: function (c) { return c.indexOf('B') < 0; }, tex: 'P(\\text{ninguna del color 1})' },
    { id: 'todas1', lab: 'Todas del color 1',
      f: function (c) { return cuenta(c, 'B') === c.length; }, tex: 'P(\\text{todas del color 1})' }
  ];
  function buscaPregunta(id) {
    var p = PREGUNTAS[0];
    PREGUNTAS.forEach(function (q) { if (q.id === id) p = q; });
    return p;
  }

  /* ==================================================================
     13) arbolPonderado — el árbol ponderado de un experimento compuesto
     ================================================================== */
  R.arbolPonderado = function (node) {
    shell(node,
      'Árbol ponderado de un experimento compuesto',
      'Un árbol «seco» dice <b>qué</b> puede pasar; un árbol <b>ponderado</b> añade la probabilidad de cada rama ' +
      'y dice además <b>con qué frecuencia</b> pasa. Cambia la composición de la urna, el número de extracciones ' +
      'y la casilla de devolución: el árbol se redibuja con las fracciones exactas. ' +
      'Cada hoja muestra el producto del camino y al pie se comprueba que la suma de todas las ramas es 1.',
      [
        { id: 'b', label: 'Bolas del color 1 (B)', type: 'number', min: 0, max: 12, value: 2 },
        { id: 'a', label: 'Bolas del color 2 (A)', type: 'number', min: 0, max: 12, value: 2 },
        { id: 'k', label: 'Extracciones', type: 'select', value: '2', options: [
          { value: '2', label: '2 extracciones' },
          { value: '3', label: '3 extracciones' }
        ] },
        { id: 'dev', label: 'Con devolución', type: 'check', value: false },
        { id: 'preg', label: 'Pregunta que quieres responder', type: 'select', value: 'distintos',
          options: PREGUNTAS.map(function (p) { return { value: p.id, label: p.lab }; }) },
        { type: 'presets', list: [
          { label: 'Urna del tema: 2 blancas y 2 azules, sin devolución',
            apply: function (c) { c.b.value = 2; c.a.value = 2; c.k.value = '2'; c.dev.checked = false; } },
          { label: 'La misma con devolución',
            apply: function (c) { c.b.value = 2; c.a.value = 2; c.k.value = '2'; c.dev.checked = true; } },
          { label: '3 rojas y 5 negras, sin devolución',
            apply: function (c) { c.b.value = 3; c.a.value = 5; c.k.value = '2'; c.dev.checked = false; } },
          { label: 'Cajón: 4 negros y 6 azules',
            apply: function (c) { c.b.value = 4; c.a.value = 6; c.k.value = '2'; c.dev.checked = false; c.preg.value = 'iguales'; } },
          { label: 'Tres extracciones sin devolución',
            apply: function (c) { c.b.value = 3; c.a.value = 3; c.k.value = '3'; c.dev.checked = false; } }
        ] }
      ],
      function (v) {
        var b = entero(v.b, 0, 12, 'El número de bolas del color 1');
        var a = entero(v.a, 0, 12, 'El número de bolas del color 2');
        var k = entero(v.k, 2, 3, 'El número de extracciones');
        var dev = v.dev === true || v.dev === 'true';
        var tot = b + a;
        if (tot < 2) throw Error('La urna necesita al menos 2 bolas en total. Aumenta alguno de los dos colores.');
        if (!dev && tot < k)
          throw Error('Sin devolución no puedes extraer ' + k + ' bolas de una urna que solo tiene ' + tot +
                      '. Añade bolas o marca la casilla de devolución.');

        var cnt = [b, a], nom = ['B', 'A'], col = [COL.azul, COL.rojo];
        var raiz = arbolUrnaGen(cnt, nom, col, k, dev);
        var cam = caminosUrna(cnt, nom, k, dev);
        var preg = buscaPregunta(v.preg);
        var pRes = sumaSi(cam, preg.f);
        var favorables = cam.filter(function (c) { return preg.f(c.camino); });

        var fig = arbol(raiz, {
          cap: 'Urna con ' + b + ' bolas B y ' + a + ' bolas A, ' + k + ' extracciones ' +
               (dev ? '<b>con</b>' : '<b>sin</b>') + ' devolución. En cada rama, la probabilidad de esa etapa; ' +
               'en cada hoja, el producto de todo el camino.',
          label: 'Árbol ponderado de la urna'
        });

        var detalle = favorables.map(function (c) {
          return K('P(' + c.camino + ') = ' + fracTex(c.p));
        }).join(' \u00B7 ');

        return fig +
          tablaCaminos(cam, 'Camino (' + k + ' extracciones)') +
          resultado(fracTxt(pRes) + '  =  ' + nc(fVal(pRes), 4), preg.lab) +
          '<div class="mx-info"><b>Cálculo.</b> Los caminos favorables son incompatibles entre sí, así que ' +
          'sus probabilidades <b>se suman</b> sin restar nada:' +
          (favorables.length
            ? '<div class="ap-kvs" style="margin-top:.3rem">' + detalle + '</div>' +
              KD(preg.tex + ' = ' + favorables.map(function (c) { return fracTex(c.p); }).join(' + ') +
                 ' = ' + fracFull(pRes))
            : KD(preg.tex + ' = 0')) + '</div>' +
          '<div class="mx-info"><b>Las dos reglas que has usado.</b>' +
          pasos([
            'A lo largo de un camino se <b>multiplica</b>: ' +
              K('P(A_1 \\cap A_2) = P(A_1) \\cdot P(A_2 \\mid A_1)') + '.',
            'Entre caminos distintos se <b>suma</b>, porque dos caminos completos nunca ocurren a la vez.'
          ]) + '</div>' +
          (dev
            ? nota('<b>Con devolución</b> la composición no cambia: las probabilidades de la segunda etapa son ' +
                   'idénticas a las de la primera y las etapas son <b>independientes</b>. Por eso todos los ' +
                   'caminos con el mismo número de bolas de cada color valen lo mismo.')
            : nota('<b>Sin devolución</b> la composición cambia, y cambia de forma distinta según lo que haya ' +
                   'salido antes: las etapas son <b>dependientes</b>. Fíjate en que los denominadores de la ' +
                   'segunda etapa son ' + (tot - 1) + ' y no ' + tot + '.')) +
          aviso('<b>Observación de máxima importancia.</b> Los ' + cam.length + ' caminos de este árbol ' +
                (dev ? 'sí son equiprobables cuando los dos colores tienen las mismas bolas, pero en general no lo son'
                     : 'no son equiprobables') +
                '. Y el árbol calcula bien igualmente: por eso el árbol ponderado funciona incluso cuando la ' +
                'regla de Laplace no se puede aplicar directamente al experimento global.');
      });
  };

  /* ==================================================================
     14) reglasArbol — las tres reglas del árbol, comprobadas (4.5.1.1)
     ================================================================== */
  R.reglasArbol = function (node) {
    shell(node,
      'Las tres reglas del árbol, comprobadas',
      'Escribe tú las probabilidades de las cuatro ramas de un árbol de dos etapas y el applet comprueba las ' +
      'tres reglas. Acepta fracciones, decimales con coma y porcentajes: <code>1/3</code>, <code>0,25</code>, ' +
      '<code>25%</code>. Prueba primero un árbol correcto y luego uno con un error a propósito: verás que la ' +
      '<b>regla 3</b> lo detecta en tres segundos.',
      [
        { id: 'p1', label: 'Primera etapa · rama 1 (B)', type: 'text', value: '2/4' },
        { id: 'p2', label: 'Primera etapa · rama 2 (A)', type: 'text', value: '2/4' },
        { id: 'q11', label: 'Tras B · rama B', type: 'text', value: '1/3' },
        { id: 'q12', label: 'Tras B · rama A', type: 'text', value: '2/3' },
        { id: 'q21', label: 'Tras A · rama B', type: 'text', value: '2/3' },
        { id: 'q22', label: 'Tras A · rama A', type: 'text', value: '1/3' },
        { type: 'presets', list: [
          { label: 'Urna 2B y 2A sin devolución (correcto)',
            apply: function (c) {
              c.p1.value = '2/4'; c.p2.value = '2/4';
              c.q11.value = '1/3'; c.q12.value = '2/3'; c.q21.value = '2/3'; c.q22.value = '1/3';
            } },
          { label: 'La misma con devolución',
            apply: function (c) {
              c.p1.value = '1/2'; c.p2.value = '1/2';
              c.q11.value = '1/2'; c.q12.value = '1/2'; c.q21.value = '1/2'; c.q22.value = '1/2';
            } },
          { label: '3 rojas y 5 negras sin devolución',
            apply: function (c) {
              c.p1.value = '3/8'; c.p2.value = '5/8';
              c.q11.value = '2/7'; c.q12.value = '5/7'; c.q21.value = '3/7'; c.q22.value = '4/7';
            } },
          { label: 'Error a propósito: un nodo no suma 1',
            apply: function (c) {
              c.p1.value = '0,5'; c.p2.value = '0,5';
              c.q11.value = '0,7'; c.q12.value = '0,2'; c.q21.value = '0,5'; c.q22.value = '0,5';
            } },
          { label: 'Error a propósito: la primera etapa no suma 1',
            apply: function (c) {
              c.p1.value = '0,6'; c.p2.value = '0,6';
              c.q11.value = '1/2'; c.q12.value = '1/2'; c.q21.value = '1/2'; c.q22.value = '1/2';
            } }
        ] }
      ],
      function (v) {
        var p1 = leeProb(v.p1, 'La rama 1 de la primera etapa');
        var p2 = leeProb(v.p2, 'La rama 2 de la primera etapa');
        var q11 = leeProb(v.q11, 'La rama B tras B');
        var q12 = leeProb(v.q12, 'La rama A tras B');
        var q21 = leeProb(v.q21, 'La rama B tras A');
        var q22 = leeProb(v.q22, 'La rama A tras A');

        var uno = frac(1, 1);
        var s0 = fSuma(p1, p2), s1 = fSuma(q11, q12), s2 = fSuma(q21, q22);
        var ok0 = fIgual(s0, uno), ok1 = fIgual(s1, uno), ok2 = fIgual(s2, uno);

        var raiz = { lab: '', hijos: [
          { lab: 'B', p: p1, color: COL.azul, hijos: [
            { lab: 'B', p: q11, color: COL.azul, camino: 'BB' },
            { lab: 'A', p: q12, color: COL.rojo, camino: 'BA' }
          ] },
          { lab: 'A', p: p2, color: COL.rojo, hijos: [
            { lab: 'B', p: q21, color: COL.azul, camino: 'AB' },
            { lab: 'A', p: q22, color: COL.rojo, camino: 'AA' }
          ] }
        ] };

        var pBB = fProd(p1, q11), pBA = fProd(p1, q12), pAB = fProd(p2, q21), pAA = fProd(p2, q22);
        var total = fSuma(fSuma(pBB, pBA), fSuma(pAB, pAA));
        var okTot = fIgual(total, uno);

        var fig = arbol(raiz, {
          cap: 'Árbol construido con <b>tus</b> probabilidades. Si algún nodo no suma 1, el total tampoco lo hará.',
          label: 'Árbol ponderado con probabilidades escritas por el alumno'
        });

        function marca(ok) { return insignia(ok ? 'suma 1' : 'no suma 1', ok ? 'si' : 'no'); }

        var tabNodos = tabla(['Nodo', 'Ramas que salen', 'Suma', '¿Regla 3?'], [
          ['Nodo inicial', K(fracTex(p1) + ' + ' + fracTex(p2)), K(fracTex(s0)), marca(ok0)],
          ['Tras B', K(fracTex(q11) + ' + ' + fracTex(q12)), K(fracTex(s1)), marca(ok1)],
          ['Tras A', K(fracTex(q21) + ' + ' + fracTex(q22)), K(fracTex(s2)), marca(ok2)]
        ]);

        var tabCam = tabla(['Camino', 'Producto', 'Probabilidad', 'Valor'], [
          ['BB', K(fracTex(p1) + ' \\cdot ' + fracTex(q11)), K(fracTex(pBB)), nc(fVal(pBB), 4)],
          ['BA', K(fracTex(p1) + ' \\cdot ' + fracTex(q12)), K(fracTex(pBA)), nc(fVal(pBA), 4)],
          ['AB', K(fracTex(p2) + ' \\cdot ' + fracTex(q21)), K(fracTex(pAB)), nc(fVal(pAB), 4)],
          ['AA', K(fracTex(p2) + ' \\cdot ' + fracTex(q22)), K(fracTex(pAA)), nc(fVal(pAA), 4)],
          { celdas: ['Suma de los cuatro', '', K(fracTex(total)), nc(fVal(total), 4)], clase: 'ap-tot' }
        ]);

        var diagnostico = (ok0 && ok1 && ok2)
          ? bien('<b>Las tres reglas se cumplen.</b> Todos los nodos suman 1 y el total de los caminos es ' +
                 K(fracTex(total)) + ' \u2713 El árbol está bien construido.')
          : S.mal('<b>Hay un error de construcción.</b> ' +
                  (!ok0 ? 'El nodo inicial suma ' + fracTxt(s0) + ' en lugar de 1. ' : '') +
                  (!ok1 ? 'El nodo «tras B» suma ' + fracTxt(s1) + '. ' : '') +
                  (!ok2 ? 'El nodo «tras A» suma ' + fracTxt(s2) + '. ' : '') +
                  'Por eso el total de los caminos vale ' + fracTxt(total) + ' y no 1. ' +
                  'La regla 3 no sirve para calcular: sirve para <b>detectar errores en tres segundos</b>.');

        return '<div class="mx-info"><b>Regla 1.</b> A lo largo de un camino se multiplica: ' +
          KD('P(A_1 \\cap A_2 \\cap \\cdots \\cap A_k) = P(A_1) \\cdot P(A_2 \\mid A_1) \\cdots P(A_k \\mid A_1 \\cap \\cdots \\cap A_{k-1})') +
          '<b>Regla 2.</b> Entre caminos distintos se suma, porque dos caminos completos son incompatibles: ' +
          KD('P(S) = \\sum_{\\text{caminos favorables a } S} P(\\text{camino})') +
          '<b>Regla 3.</b> Las ramas que salen de un mismo nodo suman siempre la unidad: ' +
          KD('\\sum_{\\text{ramas de un nodo}} P(\\text{rama}) = 1') + '</div>' +
          fig + tabNodos + tabCam + diagnostico +
          (okTot && !(ok0 && ok1 && ok2)
            ? aviso('Curiosamente el total sale 1 aunque un nodo esté mal: dos errores se han compensado. ' +
                    'Por eso hay que comprobar <b>nodo a nodo</b>, no solo el total.')
            : '') +
          nota('<b>Cómo se usa esto en un examen.</b> Dibuja el árbol, escribe las probabilidades, suma las ramas ' +
               'de cada nodo y, solo si todas dan 1, empieza a multiplicar. Diez segundos de comprobación ' +
               'evitan un problema entero mal resuelto.');
      });
  };

  /* ==================================================================
     15) dosUrnas — dos urnas elegidas con una moneda (4.5.1.1.2)
     ================================================================== */
  R.dosUrnas = function (node) {
    shell(node,
      'Dos urnas elegidas con una moneda',
      'Se lanza una moneda: si sale cara se extrae una bola de la <b>urna 1</b> y si sale cruz, de la ' +
      '<b>urna 2</b>. La primera etapa elige la urna y la segunda extrae la bola. ' +
      'Cambia la composición de las urnas y la probabilidad de elegir la urna 1 ' +
      '(acepta <code>1/2</code>, <code>0,5</code> o <code>50%</code>) y observa cómo se reparte el resultado.',
      [
        { id: 'b1', label: 'Urna 1 · bolas blancas', type: 'number', min: 0, max: 30, value: 3 },
        { id: 'n1', label: 'Urna 1 · bolas negras', type: 'number', min: 0, max: 30, value: 2 },
        { id: 'b2', label: 'Urna 2 · bolas blancas', type: 'number', min: 0, max: 30, value: 4 },
        { id: 'n2', label: 'Urna 2 · bolas negras', type: 'number', min: 0, max: 30, value: 1 },
        { id: 'pu', label: 'Probabilidad de elegir la urna 1', type: 'text', value: '1/2' },
        { type: 'presets', list: [
          { label: 'Ejemplo del tema: 3B-2N y 4B-1N con moneda',
            apply: function (c) { c.b1.value = 3; c.n1.value = 2; c.b2.value = 4; c.n2.value = 1; c.pu.value = '1/2'; } },
          { label: 'Actividad: 2B-12N y 3B-10N',
            apply: function (c) { c.b1.value = 2; c.n1.value = 12; c.b2.value = 3; c.n2.value = 10; c.pu.value = '1/2'; } },
          { label: 'Dado en vez de moneda: urna 1 con probabilidad 1/6',
            apply: function (c) { c.b1.value = 3; c.n1.value = 2; c.b2.value = 4; c.n2.value = 1; c.pu.value = '1/6'; } },
          { label: 'Urna 1 sin blancas',
            apply: function (c) { c.b1.value = 0; c.n1.value = 5; c.b2.value = 4; c.n2.value = 1; c.pu.value = '1/2'; } },
          { label: 'Las dos urnas iguales',
            apply: function (c) { c.b1.value = 3; c.n1.value = 2; c.b2.value = 3; c.n2.value = 2; c.pu.value = '1/2'; } }
        ] }
      ],
      function (v) {
        var b1 = entero(v.b1, 0, 30, 'Las blancas de la urna 1');
        var n1 = entero(v.n1, 0, 30, 'Las negras de la urna 1');
        var b2 = entero(v.b2, 0, 30, 'Las blancas de la urna 2');
        var n2 = entero(v.n2, 0, 30, 'Las negras de la urna 2');
        if (b1 + n1 < 1) throw Error('La urna 1 está vacía: pon al menos una bola.');
        if (b2 + n2 < 1) throw Error('La urna 2 está vacía: pon al menos una bola.');
        var p1 = leeProb(v.pu, 'La probabilidad de elegir la urna 1');
        var p2 = fResta(frac(1, 1), p1);

        var t1 = b1 + n1, t2 = b2 + n2;
        var pB1 = frac(b1, t1), pN1 = frac(n1, t1);
        var pB2 = frac(b2, t2), pN2 = frac(n2, t2);

        var raiz = { lab: '', hijos: [
          { lab: 'U1', p: p1, color: COL.verde, hijos: [
            { lab: 'B', p: pB1, color: COL.azul, camino: 'U1-B' },
            { lab: 'N', p: pN1, color: COL.gris, camino: 'U1-N' }
          ] },
          { lab: 'U2', p: p2, color: COL.rojo, hijos: [
            { lab: 'B', p: pB2, color: COL.azul, camino: 'U2-B' },
            { lab: 'N', p: pN2, color: COL.gris, camino: 'U2-N' }
          ] }
        ] };

        var c1 = fProd(p1, pB1), c2 = fProd(p1, pN1), c3 = fProd(p2, pB2), c4 = fProd(p2, pN2);
        var pBlanca = fSuma(c1, c3), pNegra = fSuma(c2, c4);

        var fig = arbol(raiz, {
          cap: 'Primera etapa: qué urna se elige. Segunda etapa: qué bola sale de <b>esa</b> urna. ' +
               'Urna 1: ' + b1 + ' blancas y ' + n1 + ' negras. Urna 2: ' + b2 + ' blancas y ' + n2 + ' negras.',
          label: 'Árbol ponderado de las dos urnas'
        });

        return '<div class="mx-info"><b>Sucesos que se definen antes de dibujar nada.</b> ' +
          '$U_1$ = «extraer de la urna 1», $U_2$ = «extraer de la urna 2», ' +
          '$B$ = «obtener bola blanca», $N$ = «obtener bola negra».</div>' +
          fig +
          tabla(['Camino', 'Producto', 'Probabilidad', 'Valor'], [
            ['U1 y blanca', K(fracTex(p1) + ' \\cdot ' + fracTex(pB1)), K(fracTex(c1)), nc(fVal(c1), 4)],
            ['U1 y negra', K(fracTex(p1) + ' \\cdot ' + fracTex(pN1)), K(fracTex(c2)), nc(fVal(c2), 4)],
            ['U2 y blanca', K(fracTex(p2) + ' \\cdot ' + fracTex(pB2)), K(fracTex(c3)), nc(fVal(c3), 4)],
            ['U2 y negra', K(fracTex(p2) + ' \\cdot ' + fracTex(pN2)), K(fracTex(c4)), nc(fVal(c4), 4)],
            { celdas: ['Suma', '', K(fracTex(fSuma(pBlanca, pNegra))), nc(fVal(fSuma(pBlanca, pNegra)), 4)],
              clase: 'ap-tot' }
          ]) +
          resultado(fracTxt(pBlanca) + '  =  ' + S.pct(fVal(pBlanca), 2), 'probabilidad de obtener bola blanca') +
          '<div class="mx-info"><b>Cálculo.</b> Los caminos favorables a «bola blanca» son dos, e incompatibles ' +
          'entre sí:' +
          KD('P(B) = P(U_1) \\cdot P(B \\mid U_1) + P(U_2) \\cdot P(B \\mid U_2) = ' +
             fracTex(p1) + ' \\cdot ' + fracTex(pB1) + ' + ' + fracTex(p2) + ' \\cdot ' + fracTex(pB2) +
             ' = ' + fracFull(pBlanca)) +
          'Y la comprobación: ' + K(fracTex(c1) + ' + ' + fracTex(c2) + ' + ' + fracTex(c3) + ' + ' + fracTex(c4) +
          ' = 1') + ' \u2713</div>' +
          '<div class="ap-grid2">' +
            tarjeta('Bola blanca', resultado(fracTxt(pBlanca), K(fracTex(pBlanca) + ' = ' + S.kf(fVal(pBlanca), 4))), 'ap-card-ok') +
            tarjeta('Bola negra', resultado(fracTxt(pNegra), K(fracTex(pNegra) + ' = ' + S.kf(fVal(pNegra), 4))), 'ap-card-avi') +
          '</div>' +
          nota('<b>Por qué no se puede aplicar Laplace de golpe.</b> Aquí no hay «casos favorables entre casos ' +
               'posibles»: las bolas de las dos urnas no son intercambiables, porque para llegar a una bola ' +
               'concreta hay que pasar antes por su urna. El árbol pondera cada bola con la probabilidad de su ' +
               'urna, y eso es justo lo que hace la fórmula anterior.') +
          aviso('<b>Pregunta para pensar.</b> Si las dos urnas tuvieran la misma proporción de blancas, ' +
                '¿importaría la probabilidad de elegir cada urna? Pruébalo con el escenario «las dos urnas ' +
                'iguales»: el resultado no depende de la moneda.');
      });
  };

  /* ==================================================================
     16) reemplazamiento — el mismo experimento con y sin devolución (4.5.2)
     ================================================================== */
  R.reemplazamiento = function (node) {
    shell(node,
      'Con y sin reemplazamiento: los dos árboles a la vez',
      'El enunciado cambia dos palabras y la respuesta cambia. Aquí ves los <b>dos árboles a la vez</b> con la ' +
      'misma urna: con devolución las etapas son <b>independientes</b>; sin devolución son <b>dependientes</b>, ' +
      'porque la primera extracción modifica la urna. Cambia la composición y compara las dos columnas.',
      [
        { id: 'b', label: 'Bolas del color 1 (B)', type: 'number', min: 1, max: 12, value: 2 },
        { id: 'a', label: 'Bolas del color 2 (A)', type: 'number', min: 1, max: 12, value: 2 },
        { id: 'preg', label: 'Pregunta que quieres comparar', type: 'select', value: 'distintos',
          options: PREGUNTAS.map(function (p) { return { value: p.id, label: p.lab }; }) },
        { type: 'presets', list: [
          { label: '2 blancas y 2 azules (tabla del tema)',
            apply: function (c) { c.b.value = 2; c.a.value = 2; } },
          { label: '3 rojas y 5 negras',
            apply: function (c) { c.b.value = 3; c.a.value = 5; c.preg.value = 'distintos'; } },
          { label: '5 rojas y 5 azules',
            apply: function (c) { c.b.value = 5; c.a.value = 5; c.preg.value = 'iguales'; } },
          { label: '4 negros y 6 azules (el cajón de calcetines)',
            apply: function (c) { c.b.value = 4; c.a.value = 6; c.preg.value = 'iguales'; } },
          { label: 'Urna muy grande: 12 y 12',
            apply: function (c) { c.b.value = 12; c.a.value = 12; } }
        ] }
      ],
      function (v) {
        var b = entero(v.b, 1, 12, 'Las bolas del color 1');
        var a = entero(v.a, 1, 12, 'Las bolas del color 2');
        var tot = b + a;
        var cnt = [b, a], nom = ['B', 'A'], col = [COL.azul, COL.rojo];
        var preg = buscaPregunta(v.preg);

        var camSin = caminosUrna(cnt, nom, 2, false);
        var camCon = caminosUrna(cnt, nom, 2, true);
        var pSin = sumaSi(camSin, preg.f), pCon = sumaSi(camCon, preg.f);

        var figSin = arbol(arbolUrnaGen(cnt, nom, col, 2, false), {
          cap: '<b>Sin</b> devolución: en la segunda etapa quedan ' + (tot - 1) + ' bolas y la composición ' +
               'depende de lo que salió antes.',
          label: 'Árbol sin devolución'
        });
        var figCon = arbol(arbolUrnaGen(cnt, nom, col, 2, true), {
          cap: '<b>Con</b> devolución: la urna vuelve a tener ' + tot + ' bolas y las dos etapas son idénticas.',
          label: 'Árbol con devolución'
        });

        var mapa = {};
        camCon.forEach(function (c) { mapa[c.camino] = c.p; });
        var filas = camSin.map(function (c) {
          var pc = mapa[c.camino];
          return [c.camino, K(fracTex(c.p)), nc(fVal(c.p), 4), K(fracTex(pc)), nc(fVal(pc), 4)];
        });
        var tS = frac(0, 1), tC = frac(0, 1);
        camSin.forEach(function (c) { tS = fSuma(tS, c.p); });
        camCon.forEach(function (c) { tC = fSuma(tC, c.p); });
        filas.push({ celdas: ['Suma', K(fracTex(tS)), nc(fVal(tS), 4), K(fracTex(tC)), nc(fVal(tC), 4)],
                     clase: 'ap-tot' });

        var difer = fResta(pSin, pCon);
        var comentario = fIgual(pSin, pCon)
          ? 'En este caso concreto las dos respuestas coinciden.'
          : (fVal(pSin) > fVal(pCon)
              ? 'Sin devolución es <b>más</b> probable: ' + fracTxt(pSin) + ' frente a ' + fracTxt(pCon) + '.'
              : 'Sin devolución es <b>menos</b> probable: ' + fracTxt(pSin) + ' frente a ' + fracTxt(pCon) + '.');

        return '<div class="ap-grid2">' + figSin + figCon + '</div>' +
          tabla(['Camino', 'Sin devolución', 'Valor', 'Con devolución', 'Valor'], filas) +
          '<div class="ap-grid2">' +
            tarjeta('Sin devolución', resultado(fracTxt(pSin), preg.lab) +
              '<div class="mx-info" style="font-size:.85rem">Etapas <b>dependientes</b>: denominador ' + (tot - 1) +
              ' en la segunda etapa.</div>', 'ap-card-avi') +
            tarjeta('Con devolución', resultado(fracTxt(pCon), preg.lab) +
              '<div class="mx-info" style="font-size:.85rem">Etapas <b>independientes</b>: denominador ' + tot +
              ' en las dos etapas.</div>', 'ap-card-ok') +
          '</div>' +
          '<div class="mx-info"><b>Comparación.</b> ' + comentario +
          ' La diferencia exacta es ' + K(fracTex(pSin) + ' - ' + fracTex(pCon) + ' = ' + fracTex(difer)) + '.</div>' +
          nota('<b>La regla que se cumple siempre.</b> Sin devolución, sacar dos elementos <b>del mismo tipo</b> ' +
               'es menos probable que con devolución, porque el primero «gasta» uno de los favorables. ' +
               'Y por eso mismo sacar dos <b>de tipos distintos</b> es más probable sin devolución.') +
          aviso('<b>Cuando la urna es enorme.</b> Sube las dos cantidades al máximo y compara: las dos columnas ' +
                'casi se igualan. Si la población es muy grande respecto a la muestra, extraer sin devolución ' +
                'se parece tanto a extraer con devolución que podemos tratar las etapas como independientes.');
      });
  };

  /* ==================================================================
     17) barajaFiguras — dos cartas de la baraja (4.5.2.1.1)
     ================================================================== */
  R.barajaFiguras = function (node) {
    shell(node,
      'Dos cartas de la baraja',
      'De una baraja española de 40 cartas hay 12 figuras (sota, caballo y rey de cada palo), 10 cartas de ' +
      'cada palo y 4 ases. Se extraen <b>dos cartas</b> y se compara el caso con reemplazamiento (etapas ' +
      'independientes) con el caso sin reemplazamiento (etapas dependientes). ' +
      'En el modo mixto puedes exigir que la primera cumpla una propiedad y la segunda otra distinta.',
      [
        { id: 'modo', label: 'Qué se pide', type: 'select', value: 'mismo', options: [
          { value: 'mismo', label: 'Las dos cartas cumplen la propiedad A' },
          { value: 'mixto', label: 'La primera cumple A y la segunda cumple B' }
        ] },
        { id: 'n', label: 'Cartas de la baraja', type: 'number', min: 4, max: 104, value: 40 },
        { id: 'nA', label: 'Cartas que cumplen A', type: 'number', min: 0, max: 104, value: 12 },
        { id: 'nB', label: 'Cartas que cumplen B (modo mixto)', type: 'number', min: 0, max: 104, value: 10 },
        { id: 'nAB', label: 'Cartas que cumplen A y B (modo mixto)', type: 'number', min: 0, max: 104, value: 1 },
        { type: 'presets', list: [
          { label: 'Dos figuras (12 de 40)',
            apply: function (c) { c.modo.value = 'mismo'; c.n.value = 40; c.nA.value = 12; } },
          { label: 'Dos oros (10 de 40)',
            apply: function (c) { c.modo.value = 'mismo'; c.n.value = 40; c.nA.value = 10; } },
          { label: 'Dos ases (4 de 40)',
            apply: function (c) { c.modo.value = 'mismo'; c.n.value = 40; c.nA.value = 4; } },
          { label: 'Primera as y segunda de oros',
            apply: function (c) { c.modo.value = 'mixto'; c.n.value = 40; c.nA.value = 4; c.nB.value = 10; c.nAB.value = 1; } },
          { label: 'Primera figura y segunda de copas',
            apply: function (c) { c.modo.value = 'mixto'; c.n.value = 40; c.nA.value = 12; c.nB.value = 10; c.nAB.value = 3; } }
        ] }
      ],
      function (v) {
        var n = entero(v.n, 4, 104, 'El número de cartas');
        var nA = entero(v.nA, 0, 104, 'Las cartas que cumplen A');
        if (nA > n) throw Error('No puede haber más cartas favorables (' + nA + ') que cartas en la baraja (' + n + ').');

        if (v.modo === 'mismo') {
          var pCon = fProd(frac(nA, n), frac(nA, n));
          var pSin = nA >= 1 ? fProd(frac(nA, n), frac(nA - 1, n - 1)) : frac(0, 1);

          var raizSin = { lab: '', hijos: [
            { lab: 'A', p: frac(nA, n), color: COL.verde, hijos: [
              { lab: 'A', p: frac(Math.max(nA - 1, 0), n - 1), color: COL.verde, camino: 'A y A' },
              { lab: 'no A', p: frac(n - nA, n - 1), color: COL.gris, camino: 'A y no A' }
            ] },
            { lab: 'no A', p: frac(n - nA, n), color: COL.gris, hijos: [
              { lab: 'A', p: frac(nA, n - 1), color: COL.verde, camino: 'no A y A' },
              { lab: 'no A', p: frac(Math.max(n - nA - 1, 0), n - 1), color: COL.gris, camino: 'no A y no A' }
            ] }
          ] };
          var raizCon = { lab: '', hijos: [
            { lab: 'A', p: frac(nA, n), color: COL.verde, hijos: [
              { lab: 'A', p: frac(nA, n), color: COL.verde, camino: 'A y A' },
              { lab: 'no A', p: frac(n - nA, n), color: COL.gris, camino: 'A y no A' }
            ] },
            { lab: 'no A', p: frac(n - nA, n), color: COL.gris, hijos: [
              { lab: 'A', p: frac(nA, n), color: COL.verde, camino: 'no A y A' },
              { lab: 'no A', p: frac(n - nA, n), color: COL.gris, camino: 'no A y no A' }
            ] }
          ] };

          return '<div class="ap-grid2">' +
            arbol(raizSin, { cap: '<b>Sin</b> reemplazamiento: la segunda extracción se hace sobre ' + (n - 1) +
                                  ' cartas.', label: 'Árbol sin reemplazamiento' }) +
            arbol(raizCon, { cap: '<b>Con</b> reemplazamiento: la baraja vuelve a tener ' + n + ' cartas.',
                             label: 'Árbol con reemplazamiento' }) +
            '</div>' +
            '<div class="mx-info"><b>Con reemplazamiento</b> (etapas independientes):' +
            KD('P = \\dfrac{' + nA + '}{' + n + '} \\cdot \\dfrac{' + nA + '}{' + n + '} = ' + fracFull(pCon)) +
            '<b>Sin reemplazamiento</b> (etapas dependientes):' +
            KD('P = \\dfrac{' + nA + '}{' + n + '} \\cdot \\dfrac{' + (nA - 1) + '}{' + (n - 1) + '} = ' + fracFull(pSin)) +
            '</div>' +
            '<div class="ap-grid2">' +
              tarjeta('Con reemplazamiento', resultado(fracTxt(pCon), S.pct(fVal(pCon), 2)), 'ap-card-ok') +
              tarjeta('Sin reemplazamiento', resultado(fracTxt(pSin), S.pct(fVal(pSin), 2)), 'ap-card-avi') +
            '</div>' +
            nota('<b>Lectura del resultado.</b> Con 12 figuras de 40 cartas la diferencia es ' +
                 '9 % frente a 8,46 %: parece pequeña, pero es <b>sistemática</b>. Sin devolución, sacar dos ' +
                 'elementos del mismo tipo siempre es menos probable, porque el primero gasta uno de los ' +
                 'favorables.') +
            aviso('<b>Comprueba con el applet.</b> Baja el número de cartas favorables a 4 (los ases): la ' +
                  'diferencia relativa entre los dos casos crece. Cuanto más escaso es lo que buscas, más ' +
                  'importa si hay devolución o no.');
        }

        /* modo mixto: primera cumple A, segunda cumple B */
        var nB = entero(v.nB, 0, 104, 'Las cartas que cumplen B');
        var nAB = entero(v.nAB, 0, 104, 'Las cartas que cumplen A y B');
        if (nB > n) throw Error('No puede haber más cartas de tipo B (' + nB + ') que cartas en la baraja (' + n + ').');
        if (nAB > Math.min(nA, nB))
          throw Error('Las cartas que cumplen A y B no pueden ser más que las de A (' + nA + ') ni que las de B (' + nB + ').');

        var pAB = frac(nAB, n), pAnoB = frac(nA - nAB, n), pnoA = frac(n - nA, n);
        var raiz = { lab: '', hijos: [
          { lab: 'A\u2229B', p: pAB, color: COL.morado, hijos: [
            { lab: 'B', p: frac(Math.max(nB - 1, 0), n - 1), color: COL.azul, camino: 'A\u2229B, luego B' },
            { lab: 'no B', p: frac(n - nB, n - 1), color: COL.gris, camino: 'A\u2229B, luego no B' }
          ] },
          { lab: 'A sin B', p: pAnoB, color: COL.verde, hijos: [
            { lab: 'B', p: frac(nB, n - 1), color: COL.azul, camino: 'A sin B, luego B' },
            { lab: 'no B', p: frac(Math.max(n - nB - 1, 0), n - 1), color: COL.gris, camino: 'A sin B, luego no B' }
          ] },
          { lab: 'no A', p: pnoA, color: COL.gris, hijos: [
            { lab: 'B', p: frac(nB, n - 1), color: COL.azul, camino: 'no A, luego B' },
            { lab: 'no B', p: frac(n - nB, n - 1), color: COL.gris, camino: 'no A, luego no B' }
          ] }
        ] };

        var c1 = fProd(pAB, frac(Math.max(nB - 1, 0), n - 1));
        var c2 = fProd(pAnoB, frac(nB, n - 1));
        var pSinM = fSuma(c1, c2);
        var pConM = fProd(frac(nA, n), frac(nB, n));
        var indep = (n * nAB === nA * nB);

        return arbol(raiz, {
          cap: 'Sin reemplazamiento hay que separar la primera etapa en tres casos, porque la carta que sale ' +
               'puede cumplir A y B a la vez, solo A, o ninguna de las dos.',
          label: 'Árbol de las dos cartas en el modo mixto'
        }) +
          '<div class="mx-info"><b>Con reemplazamiento</b> es inmediato, por independencia:' +
          KD('P = \\dfrac{' + nA + '}{' + n + '} \\cdot \\dfrac{' + nB + '}{' + n + '} = ' + fracFull(pConM)) +
          '<b>Sin reemplazamiento</b> hay que separar en dos caminos favorables, según si la primera carta ' +
          'cumplía también B:' +
          KD('P = \\underbrace{\\dfrac{' + nAB + '}{' + n + '} \\cdot \\dfrac{' + (nB - 1) + '}{' + (n - 1) +
             '}}_{\\text{la primera cumplía B}} + \\underbrace{\\dfrac{' + (nA - nAB) + '}{' + n +
             '} \\cdot \\dfrac{' + nB + '}{' + (n - 1) + '}}_{\\text{la primera no cumplía B}} = ' + fracFull(pSinM)) +
          '</div>' +
          '<div class="ap-grid2">' +
            tarjeta('Con reemplazamiento', resultado(fracTxt(pConM), S.pct(fVal(pConM), 3)), 'ap-card-ok') +
            tarjeta('Sin reemplazamiento', resultado(fracTxt(pSinM), S.pct(fVal(pSinM), 3)), 'ap-card-avi') +
          '</div>' +
          (fIgual(pSinM, pConM)
            ? bien('<b>Los dos resultados coinciden</b> \u2713 Y no es magia: coinciden exactamente cuando las dos ' +
                   'propiedades son <b>independientes dentro de una sola carta</b>. La condición es ' +
                   K('n \\cdot |A \\cap B| = |A| \\cdot |B|') + ', y aquí ' +
                   K(n + ' \\cdot ' + nAB + ' = ' + nA + ' \\cdot ' + nB) + '.')
            : nota('Los dos resultados <b>no</b> coinciden, y eso significa que las dos propiedades ' +
                   '<b>no son independientes</b> dentro de una misma carta: ' +
                   K(n + ' \\cdot ' + nAB + ' \\ne ' + nA + ' \\cdot ' + nB) + '.')) +
          '<div class="mx-info"><b>La clave está en el promedio.</b> Al quitar una carta de tipo A, la ' +
          'probabilidad de que la segunda cumpla B no es siempre la misma: es menor cuando la primera carta ' +
          'cumplía también B, y algo mayor cuando no. Ese promedio ponderado puede compensar exactamente el ' +
          'cambio. La condición general es' +
          KD('P_{\\text{sin}} = P_{\\text{con}} \\iff \\dfrac{|A \\cap B|}{n} = \\dfrac{|A|}{n} \\cdot \\dfrac{|B|}{n}') +
          'que es, literalmente, la definición de que A y B sean independientes en una sola extracción.</div>' +
          (indep
            ? nota('En la baraja española «ser as» y «ser de oros» son independientes, porque la baraja es una ' +
                   'cuadrícula perfecta de 4 palos por 10 números: ' + K('\\tfrac{1}{40} = \\tfrac{4}{40} \\cdot \\tfrac{10}{40}') + '.')
            : aviso('Cambia el número de cartas que cumplen A y B hasta que la igualdad se cumpla: verás que hay ' +
                    'un único valor que hace coincidir los dos resultados.'));
      });
  };

  /* ==================================================================
     18) arbolNoUniforme — cuando las ramas no son todas iguales (4.5.3)
     ================================================================== */
  R.arbolNoUniforme = function (node) {
    shell(node,
      'Árboles con ramas desiguales',
      'Se lanza un dado. Si sale <b>par</b> se lanza una moneda; si sale <b>impar</b> se extrae una bola de una ' +
      'urna con <i>k</i> bolas numeradas. La segunda etapa <b>no es la misma</b> en las dos ramas: ni tiene el ' +
      'mismo número de resultados ni las mismas probabilidades. Cambia <i>k</i> y compara la versión agrupada ' +
      '(par / impar) con la versión detallada cara a cara.',
      [
        { id: 'k', label: 'Bolas de la urna (k)', type: 'number', min: 2, max: 6, value: 3 },
        { id: 'det', label: 'Mostrar las 6 caras del dado', type: 'check', value: false },
        { id: 'preg', label: 'Suceso que quieres calcular', type: 'select', value: 'parCara', options: [
          { value: 'parCara', label: 'Sale par y luego cara' },
          { value: 'par', label: 'Sale par (cualquier cosa después)' },
          { value: 'imparBola1', label: 'Sale impar y luego la bola número 1' },
          { value: 'impar', label: 'Sale impar (cualquier bola)' },
          { value: 'moneda', label: 'Se acaba lanzando la moneda' }
        ] },
        { type: 'presets', list: [
          { label: 'Urna de 3 bolas, versión agrupada',
            apply: function (c) { c.k.value = 3; c.det.checked = false; c.preg.value = 'parCara'; } },
          { label: 'Urna de 2 bolas: el único caso equiprobable',
            apply: function (c) { c.k.value = 2; c.det.checked = true; c.preg.value = 'imparBola1'; } },
          { label: 'Urna de 6 bolas, detallada cara a cara',
            apply: function (c) { c.k.value = 6; c.det.checked = true; c.preg.value = 'impar'; } },
          { label: 'Urna de 5 bolas: ramas muy desiguales',
            apply: function (c) { c.k.value = 5; c.det.checked = false; c.preg.value = 'imparBola1'; } }
        ] }
      ],
      function (v) {
        var k = entero(v.k, 2, 6, 'El número de bolas de la urna');
        var det = v.det === true || v.det === 'true';
        var un6 = frac(1, 6), mitad = frac(1, 2), pBola = frac(1, k);

        function ramasMoneda(pref) {
          return [
            { lab: 'C', p: mitad, color: COL.naranja, camino: pref + '-C' },
            { lab: 'X', p: mitad, color: COL.naranjaClaro, camino: pref + '-X' }
          ];
        }
        function ramasUrna(pref) {
          var h = [];
          for (var i = 1; i <= k; i++)
            h.push({ lab: 'b' + i, p: pBola, color: COL.azul, camino: pref + '-b' + i });
          return h;
        }

        var raiz;
        if (det) {
          var hijos = [];
          for (var c = 1; c <= 6; c++) {
            var par = (c % 2 === 0);
            hijos.push({
              lab: String(c), p: un6, color: par ? COL.verde : COL.morado,
              hijos: par ? ramasMoneda(String(c)) : ramasUrna(String(c))
            });
          }
          raiz = { lab: '', hijos: hijos };
        } else {
          raiz = { lab: '', hijos: [
            { lab: 'par', p: frac(3, 6), color: COL.verde, hijos: ramasMoneda('par') },
            { lab: 'impar', p: frac(3, 6), color: COL.morado, hijos: ramasUrna('impar') }
          ] };
        }

        var pParCara = fProd(frac(3, 6), mitad);
        var pImparBola = fProd(frac(3, 6), pBola);
        var res, etq, calculo;
        if (v.preg === 'parCara') {
          res = pParCara; etq = 'P(par y cara)';
          calculo = 'P(\\text{par}) \\cdot P(C \\mid \\text{par}) = \\tfrac{3}{6} \\cdot \\tfrac{1}{2} = ' + fracFull(res);
        } else if (v.preg === 'par' || v.preg === 'moneda') {
          res = frac(3, 6); etq = v.preg === 'par' ? 'P(par)' : 'P(se lanza la moneda)';
          calculo = 'P(\\text{par}) = \\tfrac{3}{6} = ' + fracFull(res);
        } else if (v.preg === 'imparBola1') {
          res = pImparBola; etq = 'P(impar y bola 1)';
          calculo = 'P(\\text{impar}) \\cdot P(b_1 \\mid \\text{impar}) = \\tfrac{3}{6} \\cdot \\tfrac{1}{' + k +
                    '} = ' + fracFull(res);
        } else {
          res = frac(3, 6); etq = 'P(impar)';
          calculo = 'P(\\text{impar}) = \\tfrac{3}{6} = ' + fracFull(res);
        }

        var nRes = det ? (6 + 3 * k) : (2 + k);
        var pHojaPar = det ? fProd(un6, mitad) : pParCara;
        var pHojaImp = det ? fProd(un6, pBola) : pImparBola;
        var equi = fIgual(pHojaPar, pHojaImp);

        var fig = arbol(raiz, {
          cap: det
            ? 'Versión detallada: las 6 caras, cada una con probabilidad 1/6. Las tres pares abren la moneda ' +
              'y las tres impares abren la urna de ' + k + ' bolas.'
            : 'Versión agrupada: solo importa si el dado es par o impar, y cada grupo tiene probabilidad 3/6.',
          label: 'Árbol con ramas desiguales',
          pasoY: det ? 46 : 62
        });

        return fig +
          resultado(fracTxt(res) + '  =  ' + nc(fVal(res), 4), etq) +
          '<div class="mx-info"><b>Cálculo.</b>' + KD(calculo) + '</div>' +
          tabla(['Tipo de hoja', 'Cuántas hay', 'Probabilidad de cada una', 'Aportan en total'], [
            ['Termina en la moneda', det ? '6' : '2', K(fracTex(pHojaPar)),
              K(fracTex(fProd(frac(det ? 6 : 2, 1), pHojaPar)))],
            ['Termina en la urna', det ? String(3 * k) : String(k), K(fracTex(pHojaImp)),
              K(fracTex(fProd(frac(det ? 3 * k : k, 1), pHojaImp)))],
            { celdas: ['Total de hojas', String(nRes), '', K('1')], clase: 'ap-tot' }
          ]) +
          (equi
            ? bien('<b>Caso excepcional.</b> Con estos datos todas las hojas valen lo mismo, ' +
                   K(fracTex(pHojaPar)) + ', así que aquí (y solo aquí) podrías aplicar la regla de Laplace ' +
                   'sobre las ' + nRes + ' hojas. Cambia ' + K('k') + ' y la coincidencia desaparece.')
            : S.mal('<b>Las hojas no son equiprobables.</b> Unas valen ' + fracTxt(pHojaPar) + ' y otras ' +
                    fracTxt(pHojaImp) + '. Si contaras «casos favorables entre ' + nRes + '» obtendrías un ' +
                    'resultado <b>falso</b>: la regla de Laplace exige equiprobabilidad y aquí no la hay.')) +
          '<div class="mx-info"><b>El error clásico y su antídoto.</b>' +
          pasos([
            'Error: escribir el espacio muestral, contar sus elementos y dividir. Solo vale si los elementos ' +
              'son equiprobables.',
            'Antídoto: dibujar el árbol y <b>multiplicar a lo largo de cada camino</b>. El árbol pondera cada ' +
              'hoja con lo que realmente le corresponde.',
            'Comprobación: la suma de todas las hojas tiene que dar 1, y el árbol te lo confirma al pie.'
          ]) + '</div>' +
          nota('<b>Por qué las dos versiones dan lo mismo.</b> En la versión agrupada juntamos las tres caras ' +
               'pares en una sola rama de probabilidad 3/6, porque las tres abren exactamente la misma segunda ' +
               'etapa. Agrupar ramas equivalentes es legítimo y ahorra la mitad del dibujo: lo que no es ' +
               'legítimo es agrupar ramas que abren experimentos distintos.') +
          aviso('<b>Prueba esto.</b> Pon ' + K('k = 2') + ' con las 6 caras visibles: el árbol tiene 12 hojas ' +
                'iguales de 1/12 y Laplace funciona. Pon ' + K('k = 5') + ': hay hojas de 1/12 y hojas de 1/30, ' +
                'y cualquier recuento «a pelo» falla.');
      });
  };

  /* ==================================================================
     19) fermatRoberval — la paradoja de las partidas interrumpidas
     ================================================================== */
  R.fermatRoberval = function (node) {
    shell(node,
      'La paradoja de las partidas que no se juegan',
      'Dos jugadores necesitan una victoria más. Se acuerda jugar <b>a lo sumo dos partidas</b> y gana quien ' +
      'venza alguna. Una forma de contar dice 3/4 y la otra dice 2/3, y las dos parecen razonables. ' +
      'Elige la versión y mira el árbol: solo una de las dos respeta la equiprobabilidad. ' +
      'Puedes cambiar la probabilidad de que el primer jugador gane una partida suelta ' +
      '(<code>1/2</code>, <code>0,5</code>, <code>60%</code>).',
      [
        { id: 'ver', label: 'Versión', type: 'select', value: 'comparar', options: [
          { value: 'completo', label: 'Se juegan siempre las dos partidas' },
          { value: 'truncado', label: 'Se para en cuanto alguien gana' },
          { value: 'comparar', label: 'Comparar las dos versiones' }
        ] },
        { id: 'p', label: 'Probabilidad de que gane el jugador 1 una partida', type: 'text', value: '1/2' },
        { type: 'presets', list: [
          { label: 'Caso clásico: partidas equilibradas',
            apply: function (c) { c.ver.value = 'comparar'; c.p.value = '1/2'; } },
          { label: 'Solo el árbol completo',
            apply: function (c) { c.ver.value = 'completo'; c.p.value = '1/2'; } },
          { label: 'Solo el árbol truncado (el del razonamiento erróneo)',
            apply: function (c) { c.ver.value = 'truncado'; c.p.value = '1/2'; } },
          { label: 'Jugador 1 más fuerte: 60%',
            apply: function (c) { c.ver.value = 'comparar'; c.p.value = '60%'; } },
          { label: 'Jugador 1 más débil: 1/3',
            apply: function (c) { c.ver.value = 'comparar'; c.p.value = '1/3'; } }
        ] }
      ],
      function (v) {
        var p = leeProb(v.p, 'La probabilidad de ganar una partida');
        var q = fResta(frac(1, 1), p);
        var pGana = fSuma(p, fProd(q, p));           /* gana en la 1.ª o pierde y gana en la 2.ª */
        var pPierde = fProd(q, q);

        var raizC = { lab: '', hijos: [
          { lab: 'gana 1', p: p, color: COL.verde, hijos: [
            { lab: 'gana 1', p: p, color: COL.verde, camino: 'GG' },
            { lab: 'gana 2', p: q, color: COL.rojo, camino: 'GP' }
          ] },
          { lab: 'gana 2', p: q, color: COL.rojo, hijos: [
            { lab: 'gana 1', p: p, color: COL.verde, camino: 'PG' },
            { lab: 'gana 2', p: q, color: COL.rojo, camino: 'PP' }
          ] }
        ] };
        var raizT = { lab: '', hijos: [
          { lab: 'gana 1', p: p, color: COL.verde, camino: 'G (se para)' },
          { lab: 'gana 2', p: q, color: COL.rojo, hijos: [
            { lab: 'gana 1', p: p, color: COL.verde, camino: 'PG' },
            { lab: 'gana 2', p: q, color: COL.rojo, camino: 'PP' }
          ] }
        ] };

        var figC = arbol(raizC, {
          cap: 'Árbol <b>completo</b>: se juegan las dos partidas pase lo que pase. Cuatro hojas y, si las ' +
               'partidas están equilibradas, las cuatro con la misma probabilidad.',
          label: 'Árbol de las dos partidas completas'
        });
        var figT = arbol(raizT, {
          cap: 'Árbol <b>truncado</b>: si el jugador 1 gana la primera, la segunda no se juega. Tres hojas, ' +
               'pero una vale el doble que las otras dos.',
          label: 'Árbol truncado'
        });

        var tabC = tabla(['Resultado', 'Probabilidad', 'Valor', '¿Gana el jugador 1?'], [
          ['GG', K(fracTex(fProd(p, p))), nc(fVal(fProd(p, p)), 4), insignia('sí', 'si')],
          ['GP', K(fracTex(fProd(p, q))), nc(fVal(fProd(p, q)), 4), insignia('sí', 'si')],
          ['PG', K(fracTex(fProd(q, p))), nc(fVal(fProd(q, p)), 4), insignia('sí', 'si')],
          ['PP', K(fracTex(pPierde)), nc(fVal(pPierde), 4), insignia('no', 'no')]
        ]);
        var tabT = tabla(['Resultado', 'Probabilidad real', 'Valor', 'Si se contara equiprobable'], [
          ['G (se para)', K(fracTex(p)), nc(fVal(p), 4), K('\\tfrac{1}{3}')],
          ['PG', K(fracTex(fProd(q, p))), nc(fVal(fProd(q, p)), 4), K('\\tfrac{1}{3}')],
          ['PP', K(fracTex(pPierde)), nc(fVal(pPierde), 4), K('\\tfrac{1}{3}')]
        ]);

        var out = '';
        if (v.ver === 'completo' || v.ver === 'comparar') {
          out += '<div class="mx-info"><b>Versión completa.</b> El espacio muestral es ' +
            K('E = \\{GG,\\; GP,\\; PG,\\; PP\\}') + ' y el jugador 1 gana en los tres primeros casos:' +
            KD('P(\\text{gana el 1}) = ' + fracTex(fProd(p, p)) + ' + ' + fracTex(fProd(p, q)) + ' + ' +
               fracTex(fProd(q, p)) + ' = ' + fracFull(pGana)) + '</div>' + figC + tabC;
        }
        if (v.ver === 'truncado' || v.ver === 'comparar') {
          out += '<div class="mx-info"><b>Versión truncada.</b> Si se para en cuanto alguien gana, el ' +
            'espacio muestral parece ' + K('E = \\{G,\\; PG,\\; PP\\}') + ', con dos casos favorables de tres. ' +
            'De ahí sale el famoso ' + K('\\tfrac{2}{3}') + '. Pero esas tres ramas <b>no son ' +
            'equiprobables</b>: la primera acaba antes y se lleva ' + K(fracTex(p)) + ' de probabilidad.</div>' +
            figT + tabT;
        }

        out += '<div class="ap-grid2">' +
          tarjeta('Cálculo correcto', resultado(fracTxt(pGana), 'probabilidad de que gane el jugador 1') +
            nota('Se obtiene igual con los dos árboles: en el truncado, ' +
                 K(fracTex(p) + ' + ' + fracTex(fProd(q, p)) + ' = ' + fracTex(pGana))), 'ap-card-ok') +
          tarjeta('Recuento erróneo', resultado('2/3', 'contar 2 casos entre 3') +
            S.mal('Trata como equiprobables tres ramas que no lo son. Es el error de contar ' +
                  '«casos» sin comprobar que pesan lo mismo.'), 'ap-card-ko') +
          '</div>';

        out += '<div class="mx-info"><b>La moraleja, en tres pasos.</b>' +
          pasos([
            'Antes de contar, <b>define el experimento completo</b>: cuántas etapas hay y cuándo se para.',
            'No podas ramas para «ahorrar»: al truncar, las hojas que quedan dejan de tener el mismo peso.',
            'Si dudas, pondera: multiplica por las probabilidades de cada rama y suma. El resultado es el ' +
              'mismo con cualquier árbol bien ponderado, y eso es exactamente la garantía que buscamos.'
          ]) + '</div>' +
          aviso('<b>Comprueba la robustez.</b> Cambia la probabilidad de ganar una partida a 60% o a 1/3: el ' +
                'resultado correcto cambia (' + fracTxt(pGana) + ' aquí), mientras que el recuento erróneo ' +
                'seguiría diciendo 2/3 en todos los casos. Una respuesta que no depende de los datos suele ' +
                'ser señal de que el razonamiento está mal.');
        return out;
      });
  };

  /* ==================================================================
     20) entrenador — banco de problemas del tema con respuesta libre
     ================================================================== */

  /* Cada problema devuelve su solución como fracción exacta del núcleo,
     así la comparación con la respuesta del alumno es exacta. */
  var BANCO = [
    { e: 'Una urna tiene 3 bolas rojas y 5 negras. Se extraen dos bolas sin devolución. ' +
         '¿Cuál es la probabilidad de que sean de distinto color?',
      r: function () { return fSuma(fProd(frac(3, 8), frac(5, 7)), fProd(frac(5, 8), frac(3, 7))); },
      f: '\\tfrac{3}{8} \\cdot \\tfrac{5}{7} + \\tfrac{5}{8} \\cdot \\tfrac{3}{7}',
      p: 'Hay dos caminos favorables (roja-negra y negra-roja) y se suman. Sin devolución, el denominador de ' +
         'la segunda etapa es 7.' },
    { e: 'La misma urna de 3 rojas y 5 negras, pero ahora con devolución. ' +
         '¿Probabilidad de que las dos bolas sean de distinto color?',
      r: function () { return fSuma(fProd(frac(3, 8), frac(5, 8)), fProd(frac(5, 8), frac(3, 8))); },
      f: '\\tfrac{3}{8} \\cdot \\tfrac{5}{8} + \\tfrac{5}{8} \\cdot \\tfrac{3}{8}',
      p: 'Con devolución las dos etapas son independientes: el denominador vuelve a ser 8.' },
    { e: 'En un cajón hay 4 calcetines negros y 6 azules. Coges dos sin mirar. ' +
         '¿Probabilidad de que formen pareja, es decir, de que sean del mismo color?',
      r: function () { return fSuma(fProd(frac(4, 10), frac(3, 9)), fProd(frac(6, 10), frac(5, 9))); },
      f: '\\tfrac{4}{10} \\cdot \\tfrac{3}{9} + \\tfrac{6}{10} \\cdot \\tfrac{5}{9}',
      p: 'Dos caminos: negro-negro y azul-azul. Al coger el primero ya no lo devuelves.' },
    { e: 'Se lanza una moneda: con cara se extrae una bola de una urna con 3 blancas y 2 negras, ' +
         'y con cruz de otra urna con 4 blancas y 1 negra. ¿Probabilidad de obtener bola blanca?',
      r: function () { return fSuma(fProd(frac(1, 2), frac(3, 5)), fProd(frac(1, 2), frac(4, 5))); },
      f: '\\tfrac{1}{2} \\cdot \\tfrac{3}{5} + \\tfrac{1}{2} \\cdot \\tfrac{4}{5}',
      p: 'La primera etapa elige la urna y la segunda extrae la bola. Se suman los dos caminos que acaban en blanca.' },
    { e: 'Dos urnas: la primera con 2 blancas y 12 negras, la segunda con 3 blancas y 10 negras. ' +
         'Se elige una al azar con una moneda y se extrae una bola. ¿Probabilidad de que sea negra?',
      r: function () { return fSuma(fProd(frac(1, 2), frac(12, 14)), fProd(frac(1, 2), frac(10, 13))); },
      f: '\\tfrac{1}{2} \\cdot \\tfrac{12}{14} + \\tfrac{1}{2} \\cdot \\tfrac{10}{13}',
      p: 'Cuidado con los totales: 14 bolas en la primera urna y 13 en la segunda.' },
    { e: 'De una baraja española de 40 cartas se extraen dos cartas sin reemplazamiento. ' +
         '¿Probabilidad de que las dos sean figuras (hay 12 figuras)?',
      r: function () { return fProd(frac(12, 40), frac(11, 39)); },
      f: '\\tfrac{12}{40} \\cdot \\tfrac{11}{39}',
      p: 'Al no devolver la primera figura quedan 11 figuras entre 39 cartas.' },
    { e: 'La misma baraja de 40 cartas, pero devolviendo la primera carta y barajando. ' +
         '¿Probabilidad de que las dos cartas extraídas sean figuras?',
      r: function () { return fProd(frac(12, 40), frac(12, 40)); },
      f: '\\tfrac{12}{40} \\cdot \\tfrac{12}{40}',
      p: 'Con devolución la baraja vuelve a estar completa: las dos etapas son idénticas e independientes.' },
    { e: 'De una baraja de 40 cartas se extraen dos sin reemplazamiento. ¿Probabilidad de que la primera ' +
         'sea un as y la segunda sea de oros?',
      r: function () {
        return fSuma(fProd(frac(1, 40), frac(9, 39)), fProd(frac(3, 40), frac(10, 39)));
      },
      f: '\\tfrac{1}{40} \\cdot \\tfrac{9}{39} + \\tfrac{3}{40} \\cdot \\tfrac{10}{39}',
      p: 'Separa según si el as era el as de oros (1 carta) o no (3 cartas): los oros que quedan cambian.' },
    { e: 'Una urna tiene 2 bolas blancas y 2 azules. Se extraen dos bolas sin devolución. ' +
         '¿Probabilidad de que las dos sean blancas?',
      r: function () { return fProd(frac(2, 4), frac(1, 3)); },
      f: '\\tfrac{2}{4} \\cdot \\tfrac{1}{3}',
      p: 'Tras sacar una blanca solo queda una blanca entre 3 bolas.' },
    { e: 'Urna con 3 bolas rojas y 3 azules. Se extraen tres bolas sin devolución. ' +
         '¿Probabilidad de que las tres sean del mismo color?',
      r: function () {
        var t = fProd(fProd(frac(3, 6), frac(2, 5)), frac(1, 4));
        return fSuma(t, t);
      },
      f: '2 \\cdot \\tfrac{3}{6} \\cdot \\tfrac{2}{5} \\cdot \\tfrac{1}{4}',
      p: 'Dos caminos completos: rojo-rojo-rojo y azul-azul-azul, y cada uno multiplica tres fracciones.' },
    { e: 'Se lanza un dado y después una moneda. ¿Probabilidad de obtener número par y cara?',
      r: function () { return fProd(frac(3, 6), frac(1, 2)); },
      f: '\\tfrac{3}{6} \\cdot \\tfrac{1}{2}',
      p: 'Las dos etapas son independientes: se multiplican a lo largo del camino.' },
    { e: 'Se observa la última cifra del número premiado de la lotería. Sea A = «la cifra es múltiplo de 3» ' +
         '(incluye el 0) y B = «la cifra es mayor que 7». ¿Cuánto vale P(A unión B)?',
      r: function () { return fResta(fSuma(frac(4, 10), frac(2, 10)), frac(1, 10)); },
      f: 'P(A) + P(B) - P(A \\cap B) = \\tfrac{4}{10} + \\tfrac{2}{10} - \\tfrac{1}{10}',
      p: 'A = {0, 3, 6, 9} y B = {8, 9}. El 9 está en los dos, así que hay que restarlo una vez.' },
    { e: 'Se lanza un dado. Sea A = «sale par» y B = «sale mayor que 4». ' +
         '¿Cuánto vale P((A unión B) complementario)?',
      r: function () { return frac(2, 6); },
      f: 'P\\big((A \\cup B)\\,\\!\'\\big) = 1 - P(A \\cup B) = 1 - \\tfrac{4}{6}',
      p: 'A = {2, 4, 6} y B = {5, 6}, luego A unión B = {2, 4, 5, 6}. Fuera quedan el 1 y el 3.' },
    { e: 'Dos jugadores necesitan una victoria y acuerdan jugar como máximo dos partidas, con la misma ' +
         'fuerza los dos. ¿Probabilidad de que gane el primero?',
      r: function () { return fSuma(frac(1, 2), fProd(frac(1, 2), frac(1, 2))); },
      f: '\\tfrac{1}{2} + \\tfrac{1}{2} \\cdot \\tfrac{1}{2}',
      p: 'Gana en la primera partida, o pierde la primera y gana la segunda. No es 2/3: las tres ramas del ' +
         'árbol truncado no son equiprobables.' }
  ];

  R.entrenador = function (n) {
    var orden = BANCO.map(function (_, i) { return i; });
    var pos = 0, aciertos = 0, intentos = 0, resuelto = false, ultima = '';
    n.classList.add('applet');

    function baraja() {
      for (var i = orden.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = orden[i]; orden[i] = orden[j]; orden[j] = t;
      }
    }
    baraja();

    function marcador() {
      return '<span class="ap-kv">Aciertos: <b>' + aciertos + '</b> de <b>' + intentos + '</b></span>' +
             '<span class="ap-kv">Problema <b>' + (pos + 1) + '</b> de <b>' + BANCO.length + '</b></span>';
    }

    function pinta() {
      var c = BANCO[orden[pos]];
      n.innerHTML =
        '<h4 class="mx-title">Applet · Entrenador de problemas de probabilidad</h4>' +
        '<div class="mx-instr">' + BANCO.length + ' problemas del tema, en orden aleatorio. ' +
        'Escribe tu resultado como <b>fracción</b>, como <b>decimal con coma</b> o como <b>porcentaje</b>: ' +
        '<code>15/28</code>, <code>0,5357</code>, <code>53,57%</code>. Se admite cualquier fracción ' +
        'equivalente, así que no hace falta simplificar. Si te equivocas verás la fórmula correcta y la pista.</div>' +
        '<div class="ap-kvs">' + marcador() + '</div>' +
        '<div class="ap-enun">' + esc(c.e) + '</div>' +
        '<div class="mx-inputs">' +
          '<label class="mx-field"><span>Tu respuesta (fracción, decimal o porcentaje)</span>' +
            '<input class="mx-in" type="text" id="entResp" value="' + esc(ultima) + '"></label>' +
        '</div>' +
        '<div class="ap-btns">' +
          '<button type="button" class="ap-chip" data-a="comp">Comprobar</button>' +
          '<button type="button" class="ap-chip" data-a="pista">Ver la pista</button>' +
          '<button type="button" class="ap-chip" data-a="sig">Siguiente problema</button>' +
        '</div>' +
        '<div class="mx-out ap-out"></div>';

      var out = n.querySelector('.mx-out');
      var inp = n.querySelector('#entResp');
      out.innerHTML = '<div class="mx-info">Dibuja el árbol en tu cuaderno, calcula y escribe el resultado arriba.</div>';

      n.querySelector('[data-a="comp"]').addEventListener('click', function () {
        var correcto = c.r();
        var dada;
        try {
          dada = leeProb(inp.value, 'Tu respuesta');
        } catch (err) {
          out.innerHTML = '<div class="mx-bad ap-err">' + esc(err.message) +
            ' Escribe una probabilidad entre 0 y 1, por ejemplo 15/28, 0,5357 o 53,57%.</div>';
          return;
        }
        /* Se acepta la fracción exacta o un decimal redondeado a 4 cifras */
        var ok = fIgual(dada, correcto) || Math.abs(fVal(dada) - fVal(correcto)) < 5e-5;
        if (!resuelto) { intentos++; if (ok) aciertos++; resuelto = true; }
        ultima = String(inp.value);
        out.innerHTML = S.texifica(
          '<div class="' + (ok ? 'ap-ok' : 'ap-ko') + '">' +
            (ok ? 'Correcto.' : 'No es correcto.') + '</div>' +
          '<div class="mx-info"><b>Cómo se calcula:</b>' + KD(c.f + ' = ' + fracFull(correcto)) + '</div>' +
          '<div class="mx-info"><b>La clave:</b> ' + c.p + '</div>' +
          (ok ? ''
              : '<div class="mx-info">Tu respuesta vale ' + nc(fVal(dada), 4) + ' y la correcta es ' +
                fracTxt(correcto) + ' = ' + nc(fVal(correcto), 4) + '. ' +
                'Repasa si has multiplicado a lo largo del camino y sumado entre caminos.</div>'));
        S.tex(out);
        var kv = n.querySelector('.ap-kvs');
        if (kv) kv.innerHTML = marcador();
      });

      n.querySelector('[data-a="pista"]').addEventListener('click', function () {
        out.innerHTML = S.texifica('<div class="mx-info"><b>Pista:</b> ' + c.p + '</div>');
        S.tex(out);
      });

      n.querySelector('[data-a="sig"]').addEventListener('click', function () {
        pos = (pos + 1) % BANCO.length;
        if (pos === 0) baraja();
        resuelto = false; ultima = ''; pinta();
      });

      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); n.querySelector('[data-a="comp"]').click(); }
      });
    }
    pinta();
  };

  /* Módulo B cargado */
  S.extraB = true;
})();
