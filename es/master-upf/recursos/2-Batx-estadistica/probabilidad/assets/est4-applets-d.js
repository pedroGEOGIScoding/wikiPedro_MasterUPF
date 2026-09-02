/* =====================================================================
   est4-applets-d.js · Tema 4 Probabilidad (parte 2) · 2.º Bachillerato
   Módulo D — Probabilidad condicional, teorema de la probabilidad
              total y teorema de Bayes (apartados 4.8, 4.9 y 4.10)

   Depende de window.EST4 (est4-applets.js), que aporta el armazón de
   applet, la aritmética exacta con fracciones, los diagramas de Venn,
   el árbol ponderado, la tabla de contingencia, las barras de Bayes y
   el pictograma de la tasa base.

   Applets registrados aquí (25):
     condicional · clase22 · condProb · contingenciaLab · hospital ·
     tecnologias · reglaProducto · biblioteca · independencia ·
     testIndependencia · incompatibleVsIndependiente · asimetria ·
     fiscal · sistemaCompleto · total · tresFactorias · urnasMoneda ·
     cincoPasos · bayes · bayesFactorias · testMedico · tasaBase ·
     montyHall · actualizaCreencias · mapaTema

   Todas las probabilidades se calculan con fracciones exactas: los
   caminos de un árbol suman exactamente 1 y las probabilidades a
   posteriori de Bayes suman exactamente 1, sin errores de redondeo.

   JavaScript plano (ES5), SVG propio, sin CDN ni dependencias externas.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.EST4;
  if (!S) { return; }
  var R = S.registry;

  /* atajos del núcleo */
  var K = S.K, KD = S.KD, esc = S.esc, nc = S.nc, pct = S.pct;
  var frac = S.frac, fSuma = S.fSuma, fResta = S.fResta, fProd = S.fProd,
      fDiv = S.fDiv, fVal = S.fVal, fIgual = S.fIgual;
  var fracTex = S.fracTex, fracTxt = S.fracTxt, fracFull = S.fracFull,
      leeProb = S.leeProb;
  var U = S.U, I = S.I, Co = S.Co, ordena = S.ordena, igual = S.igual;
  var setTxt = S.setTxt, setTex = S.setTex, incompatibles = S.incompatibles;
  var shell = S.shell, venn = S.venn, arbol = S.arbol, tabla = S.tabla, kvs = S.kvs;
  var contingencia = S.contingencia, barras = S.barras, barrasBayes = S.barrasBayes,
      pictograma = S.pictograma;
  var nota = S.nota, aviso = S.aviso, bien = S.bien, mal = S.mal, tarjeta = S.tarjeta;
  var insignia = S.insignia, resultado = S.resultado;
  var entero = S.entero, numero = S.numero, COL = S.COL, rng = S.rng;

  var UNO = frac(1, 1);
  var CERO = frac(0, 1);
  var PALETA = [COL.azul, COL.naranja, COL.morado, COL.teal, COL.verde, COL.rojo];

  /* ==================================================================
     0 · utilidades comunes del módulo
     ================================================================== */

  /* Lista numerada de pasos */
  function pasos(items) {
    var h = '<ol class="ap-pasos">';
    items.forEach(function (t) { h += '<li>' + t + '</li>'; });
    return h + '</ol>';
  }

  /* Espacio muestral escrito por el alumno */
  function leeE(txt) {
    var E = S.conjunto(txt, 24, 'El espacio muestral E');
    if (E.length < 2)
      throw Error('El espacio muestral necesita al menos 2 resultados. Escribe por ejemplo: 1 2 3 4 5 6');
    return E;
  }
  /* Suceso escrito por el alumno: subconjunto de E */
  function leeSub(txt, E, nombre) {
    var A = S.conjunto(txt, 24, nombre);
    A.forEach(function (x) {
      if (E.indexOf(x) < 0)
        throw Error('El elemento ' + x + ' de ' + nombre + ' no está en E = ' + setTxt(E, E) +
                    '. Un suceso solo puede contener resultados del espacio muestral.');
    });
    return ordena(A, E);
  }
  /* Probabilidad de Laplace como fracción exacta */
  function pLap(A, E) { return frac(A.length, E.length); }

  /* Probabilidad escrita por el alumno: 0,25 · 1/4 · 25% */
  function leeP(txt, nombre) { return leeProb(txt, nombre); }

  /* Recuento entero no negativo con mensaje pedagógico */
  function cuenta(v, nombre, tope) {
    var x = entero(v, 0, tope === undefined ? 100000 : tope, nombre);
    return x;
  }

  /* Fracción a partir de un porcentaje leído de un deslizador */
  function pctFrac(v, nombre, min, max) {
    var x = numero(v, min === undefined ? 0 : min, max === undefined ? 100 : max, nombre);
    return S.fDiv(S.decFrac(x), frac(100, 1));
  }

  /* División de recuentos con aviso pedagógico si el denominador es 0 */
  function razon(n, d, quien) {
    if (d === 0)
      throw Error('No puedo condicionar a ' + quien + ': ese grupo no tiene ningún caso, ' +
                  'y condicionar a un suceso de probabilidad cero no tiene sentido. ' +
                  'Sube alguno de los recuentos de ese grupo.');
    return frac(n, d);
  }

  /* Suma de una lista de fracciones */
  function sumaF(lista) {
    var t = CERO;
    lista.forEach(function (f) { t = fSuma(t, f); });
    return t;
  }

  /* Instrucciones de sintaxis reutilizadas */
  var FORMATO_SET =
    'Escribe los elementos separados por espacios o comas; las llaves son opcionales. ' +
    'Ejemplos válidos: <code>1 2 3 4 5 6</code>, <code>{2, 4, 6}</code>, <code>NN NÑ ÑN ÑÑ</code>.';
  var FORMATO_P =
    'Las probabilidades se pueden escribir de tres maneras: decimal con coma <code>0,25</code>, ' +
    'fracción <code>1/4</code> o porcentaje <code>25%</code>.';
  var FORMATO_CAUSAS =
    'Escribe <b>una causa por línea</b> con tres datos separados por punto y coma: nombre, ' +
    'probabilidad a priori y probabilidad condicionada del efecto. ' +
    'Ejemplo literal: <code>Factoría 1; 60%; 1%</code>. Admite también <code>0,6</code> y <code>3/5</code>.';

  /* --- lectura de un sistema de causas escrito en un área de texto --- */
  function leeCausas(txt, exigeUno) {
    var lineas = String(txt == null ? '' : txt).split(/\n+/);
    var out = [];
    lineas.forEach(function (ln) {
      var s = ln.trim();
      if (!s) return;
      var p = s.split(';');
      if (p.length < 3)
        throw Error('Cada línea necesita tres datos separados por punto y coma, así: ' +
                    'Factoría 1; 60%; 1%. La línea «' + s + '» no los tiene.');
      var nom = p[0].trim() || ('Causa ' + (out.length + 1));
      out.push({
        lab: nom,
        prior: leeP(p[1], 'La probabilidad a priori de ' + nom),
        cond: leeP(p[2], 'La probabilidad condicionada de ' + nom)
      });
    });
    if (out.length < 2)
      throw Error('Escribe al menos dos causas, una por línea. Ejemplo: Factoría 1; 60%; 1%');
    if (out.length > 6)
      throw Error('Este applet trabaja con un máximo de 6 causas: con más, el árbol deja de leerse.');
    if (exigeUno !== false) {
      var s1 = sumaF(out.map(function (c) { return c.prior; }));
      if (!fIgual(s1, UNO))
        throw Error('Las probabilidades a priori suman ' + fracTxt(s1) + ' = ' + nc(fVal(s1), 4) +
                    ' y tienen que sumar exactamente 1: las causas han de cubrir todos los casos sin solaparse. ' +
                    'Revisa los porcentajes del enunciado.');
    }
    return out;
  }

  /* Aportación de cada causa (producto del camino) y probabilidad total */
  function aportaciones(causas) {
    var prods = causas.map(function (c) { return fProd(c.prior, c.cond); });
    return { prods: prods, total: sumaF(prods) };
  }

  /* Tabla canónica de Bayes: a priori · verosimilitud · producto · a posteriori */
  function tablaBayes(causas, efecto, resalta) {
    var ap = aportaciones(causas);
    var filas = [];
    causas.forEach(function (c, i) {
      var post = fIgual(ap.total, CERO) ? CERO : fDiv(ap.prods[i], ap.total);
      filas.push({
        celdas: [
          esc(c.lab),
          K(fracTex(c.prior) + ' = ' + S.kf(fVal(c.prior), 4)),
          K(fracTex(c.cond) + ' = ' + S.kf(fVal(c.cond), 4)),
          K(fracTex(ap.prods[i]) + ' = ' + S.kf(fVal(ap.prods[i]), 6)),
          K(fracTex(post) + ' = ' + S.kf(fVal(post), 4))
        ],
        clase: (resalta === i ? 'ap-hi' : '')
      });
    });
    var postTot = fIgual(ap.total, CERO) ? CERO : UNO;
    filas.push({
      celdas: ['Total', K('1'), '\u2014', K(fracTex(ap.total) + ' = ' + S.kf(fVal(ap.total), 6)),
               K(fracTex(postTot))],
      clase: 'ap-tot'
    });
    return {
      html: tabla(['Causa', 'A priori $P(A_i)$', 'Verosimilitud $P(' + efecto + '\\mid A_i)$',
                   'Producto', 'A posteriori $P(A_i \\mid ' + efecto + ')$'], filas),
      prods: ap.prods, total: ap.total
    };
  }

  /* Árbol de dos niveles: causas arriba, efecto y su contrario abajo */
  function arbolCausas(causas, efecto, opts) {
    opts = opts || {};
    var noE = efecto + '\u2032';
    var hijos = causas.map(function (c, i) {
      var col = PALETA[i % PALETA.length];
      return {
        lab: c.lab.length > 22 ? c.lab.slice(0, 21) + '\u2026' : c.lab,
        p: c.prior, color: col,
        hijos: [
          { lab: efecto, p: c.cond, color: COL.rojo,
            camino: c.lab + ' \u2192 ' + efecto },
          { lab: noE, p: fResta(UNO, c.cond), color: COL.gris,
            camino: c.lab + ' \u2192 ' + noE }
        ]
      };
    });
    return arbol({ lab: '', hijos: hijos }, {
      cap: opts.cap || ('Primer nivel: la partición de causas, cuyas probabilidades suman 1. ' +
        'Segundo nivel: las condicionadas $P(' + efecto + ' \\mid A_i)$. ' +
        'Cada hoja es el producto del camino.'),
      label: opts.label || 'Árbol de la probabilidad total',
      pasoY: opts.pasoY || 66
    });
  }

  /* Comprobación de la media ponderada: mín ≤ P(B) ≤ máx */
  function controlMedia(causas, total, efecto) {
    var vals = causas.map(function (c) { return fVal(c.cond); });
    var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
    var t = fVal(total);
    var ok = t >= mn - 1e-12 && t <= mx + 1e-12;
    return (ok ? bien : mal)(
      '<b>Control de la media ponderada.</b> ' +
      K('\\min_i P(' + efecto + ' \\mid A_i) \\le P(' + efecto + ') \\le \\max_i P(' + efecto + ' \\mid A_i)') +
      ': ' + K(S.kf(mn, 4) + ' \\le ' + S.kf(t, 4) + ' \\le ' + S.kf(mx, 4)) + ' ' +
      (ok ? '\u2713 El resultado es una media ponderada de las condicionadas, así que tiene que caer entre la menor y la mayor.'
          : '\u2717 Algo no cuadra: revisa los datos.'));
  }

  /* Tabla de contingencia a partir de los cuatro recuentos.
     A = primera fila, B = primera columna. */
  function contDe(n11, n12, n21, n22, labA, labB, marca) {
    return contingencia({
      cols: [labB + ' sí', labB + ' no'],
      filas: [
        { lab: labA + ' sí', celdas: [n11, n12] },
        { lab: labA + ' no', celdas: [n21, n22] }
      ],
      capC: labB, capF: labA,
      resalta: marca,
      cap: 'Los totales de fila y de columna son los denominadores de las probabilidades ' +
           'condicionadas: condicionar es elegir una banda de la tabla.'
    });
  }

  /* ==================================================================
     1) condicional — qué significa condicionar (4.8.1)
     ================================================================== */
  R.condicional = function (node) {
    shell(node,
      'Qué significa condicionar',
      'Condicionar no es multiplicar ni dividir por un número mágico: es <b>cambiar de universo</b>. ' +
      'Cuando se sabe que ha ocurrido $A$, todo lo que queda fuera de $A$ deja de existir y el nuevo espacio ' +
      'muestral es $E\' = A$. De ahí sale la versión de Laplace ' +
      '$P(B \\mid A) = \\dfrac{n(A \\cap B)}{n(A)}$. ' + FORMATO_SET + ' ' +
      'Cambia $E$, $A$ y $B$ y compara $P(B)$ con $P(B \\mid A)$.',
      [
        { id: 'E', label: 'Espacio muestral E', type: 'text', value: '1 2 3 4 5 6' },
        { id: 'A', label: 'Suceso A (lo que ya sabes)', type: 'text', value: '2 4 6' },
        { id: 'B', label: 'Suceso B (lo que preguntas)', type: 'text', value: '4 5 6' },
        { type: 'presets', list: [
          { label: 'Dado: mayor que 3 sabiendo que es par',
            title: 'A = par, B = mayor que 3',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '2 4 6'; c.B.value = '4 5 6'; } },
          { label: 'Familia con dos hijos: al menos una niña',
            title: 'E = NN NÑ ÑN ÑÑ; A = al menos una niña; B = las dos niñas',
            apply: function (c) { c.E.value = 'NN NÑ ÑN ÑÑ'; c.A.value = 'NÑ ÑN ÑÑ'; c.B.value = 'ÑÑ'; } },
          { label: 'Dado: primo sabiendo que es impar',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '1 3 5'; c.B.value = '2 3 5'; } },
          { label: 'Bolas del 1 al 10: múltiplo de 3 sabiendo que es par',
            apply: function (c) { c.E.value = '1 2 3 4 5 6 7 8 9 10'; c.A.value = '2 4 6 8 10'; c.B.value = '3 6 9'; } },
          { label: 'Condicionar a algo que no cambia nada',
            title: 'A y B independientes: P(B | A) = P(B)',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '1 2 3 4'; c.B.value = '2 4 6'; } },
          { label: 'Sucesos incompatibles: P(B | A) = 0',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '1 3 5'; c.B.value = '2 4 6'; } }
        ] }
      ],
      function (v) {
        var E = leeE(v.E);
        var A = leeSub(v.A, E, 'el suceso A');
        var B = leeSub(v.B, E, 'el suceso B');
        if (!A.length)
          throw Error('El suceso A no puede estar vacío: no se puede condicionar a algo imposible. ' +
                      'Escribe al menos un resultado, por ejemplo 2 4 6.');
        var In = ordena(I(A, B), E);
        var pB = pLap(B, E), pA = pLap(A, E), pIn = pLap(In, E);
        var pBA = razon(In.length, A.length, 'A');
        var pAB = B.length ? frac(In.length, B.length) : null;

        var figIni = venn({
          n: 2, pinta: ['b', 'ab'], color: COL.azulClaro,
          A: A, B: B, E: E.length <= 12 ? E : null,
          cap: 'Universo de partida: todo $E$, con ' + E.length + ' resultados. La zona sombreada es $B$.',
          label: 'Diagrama de Venn antes de condicionar'
        });
        var figCond = venn({
          n: 2, pinta: ['a', 'ab'], color: COL.naranjaClaro,
          A: A, B: B, E: E.length <= 12 ? E : null,
          cap: 'Universo nuevo: $E\' = A$, con ' + A.length + ' resultados. Dentro de esa zona, los favorables ' +
               'a $B$ son los ' + In.length + ' de $A \\cap B$.',
          label: 'Diagrama de Venn después de condicionar a A'
        });

        var tab = tabla(['Suceso', 'Elementos', 'Casos', 'Probabilidad'], [
          [K('E'), K(setTex(E, E)), String(E.length), K('1')],
          [K('A'), K(setTex(A, E)), String(A.length), K(fracTex(pA))],
          [K('B'), K(setTex(B, E)), String(B.length), K(fracTex(pB))],
          { celdas: [K('A \\cap B'), K(setTex(In, E)), String(In.length), K(fracTex(pIn))], clase: 'ap-hi' }
        ]);

        var comp = barras({
          items: [
            { lab: 'P(B)', valor: fVal(pB), txt: fracTxt(pB) + ' = ' + nc(fVal(pB), 4), color: COL.azul,
              nota: B.length + ' de ' + E.length + ' resultados de E' },
            { lab: 'P(B | A)', valor: fVal(pBA), txt: fracTxt(pBA) + ' = ' + nc(fVal(pBA), 4), color: COL.naranja,
              nota: In.length + ' de ' + A.length + ' resultados de A' }
          ],
          max: 1,
          cap: 'La información cambia la probabilidad porque cambia el <b>denominador</b>: ' +
               'ya no se cuenta sobre $E$, sino sobre $A$.'
        });

        var sube = fVal(pBA) - fVal(pB);
        var lectura = Math.abs(sube) < 1e-12
          ? bien('Aquí ' + K('P(B \\mid A) = P(B)') + ': saber que ha ocurrido $A$ <b>no aporta información</b> ' +
                 'sobre $B$. Estos dos sucesos son <b>independientes</b>.')
          : (sube > 0
            ? nota('La probabilidad <b>sube</b>: de ' + K(fracTex(pB)) + ' a ' + K(fracTex(pBA)) +
                   '. Saber que ha ocurrido $A$ hace más creíble $B$, así que los sucesos son <b>dependientes</b>.')
            : nota('La probabilidad <b>baja</b>: de ' + K(fracTex(pB)) + ' a ' + K(fracTex(pBA)) +
                   '. Saber que ha ocurrido $A$ hace menos creíble $B$, así que los sucesos son <b>dependientes</b>.'));

        return figIni + figCond + tab + comp +
          resultado(fracTxt(pBA) + '  =  ' + nc(fVal(pBA), 4), 'P(B | A), la probabilidad de B sabiendo que ha ocurrido A') +
          '<div class="mx-info"><b>Cálculo paso a paso.</b>' +
          pasos([
            'Cambio de universo: ' + K('E\' = A = ' + setTex(A, E)) + ', que tiene ' + A.length + ' casos posibles.',
            'Dentro de ese universo, los favorables a $B$ son ' + K('A \\cap B = ' + setTex(In, E)) +
              ', es decir ' + In.length + ' casos.',
            'Aplico Laplace en el universo nuevo: ' +
              KD('P(B \\mid A) = \\frac{n(A \\cap B)}{n(A)} = \\frac{' + In.length + '}{' + A.length +
                 '} = ' + fracFull(pBA))
          ]) + '</div>' +
          lectura +
          (pAB
            ? nota('<b>No confundas el orden.</b> ' + K('P(B \\mid A) = ' + fracTex(pBA)) + ' pero ' +
                   K('P(A \\mid B) = ' + fracTex(pAB)) + '. Mismo numerador ' + K('n(A \\cap B) = ' + In.length) +
                   ', distinto denominador: el condicionamiento <b>no es simétrico</b>.')
            : '') +
          aviso('<b>El denominador manda.</b> Condicionar a un suceso de probabilidad cero no tiene sentido, ' +
                'igual que no tiene sentido preguntar «sabiendo que ha ocurrido algo imposible». ' +
                'Por eso la fórmula exige ' + K('P(A) > 0') + '.');
      });
  };

  /* ==================================================================
     2) clase22 — la clase de 22 estudiantes (4.8.2.1)
     ================================================================== */
  R.clase22 = function (node) {
    shell(node,
      'La clase de 22 estudiantes',
      'En una clase de 22 estudiantes, 7 son aficionados al baloncesto, 12 al fútbol y 6 a los dos deportes. ' +
      'La convención matemática es que <b>los 7 incluyen a los 6</b>: si se leen como «7 solo de baloncesto», ' +
      'sale $7 + 12 + 6 = 25 > 22$ y el problema se bloquea. ' +
      'Escribe los cuatro datos como números enteros, por ejemplo <code>22</code>, <code>7</code>, ' +
      '<code>12</code> y <code>6</code>, y el applet construye la tabla de contingencia por diferencias.',
      [
        { id: 'tot', label: 'Total de personas', type: 'number', min: 2, max: 500, value: 22 },
        { id: 'nA', label: 'Cumplen A (baloncesto)', type: 'number', min: 0, max: 500, value: 7 },
        { id: 'nB', label: 'Cumplen B (fútbol)', type: 'number', min: 0, max: 500, value: 12 },
        { id: 'nAB', label: 'Cumplen las dos cosas', type: 'number', min: 0, max: 500, value: 6 },
        { id: 'labA', label: 'Nombre de A', type: 'text', value: 'Baloncesto' },
        { id: 'labB', label: 'Nombre de B', type: 'text', value: 'Fútbol' },
        { type: 'presets', list: [
          { label: 'Clase de 22: baloncesto y fútbol',
            apply: function (c) {
              c.tot.value = 22; c.nA.value = 7; c.nB.value = 12; c.nAB.value = 6;
              c.labA.value = 'Baloncesto'; c.labB.value = 'Fútbol';
            } },
          { label: 'Autobús de 32 viajeros',
            title: '18 van a trabajar, 19 hombres, 10 hombres que van a trabajar',
            apply: function (c) {
              c.tot.value = 32; c.nA.value = 19; c.nB.value = 18; c.nAB.value = 10;
              c.labA.value = 'Hombre'; c.labB.value = 'Va a trabajar';
            } },
          { label: 'Vacaciones: 30 encuestados',
            title: '17 playa, 8 montaña, 5 reparten',
            apply: function (c) {
              c.tot.value = 30; c.nA.value = 8; c.nB.value = 17; c.nAB.value = 5;
              c.labA.value = 'Montaña'; c.labB.value = 'Playa';
            } },
          { label: 'Caja de 16 bolas',
            title: '6 rojas, 8 numeradas con 1, 3 rojas numeradas con 1',
            apply: function (c) {
              c.tot.value = 16; c.nA.value = 6; c.nB.value = 8; c.nAB.value = 3;
              c.labA.value = 'Roja'; c.labB.value = 'Numerada con 1';
            } },
          { label: 'Idiomas: 33 personas',
            title: '18 mujeres, 10 hablan dos idiomas, 4 mujeres que los hablan',
            apply: function (c) {
              c.tot.value = 33; c.nA.value = 18; c.nB.value = 10; c.nAB.value = 4;
              c.labA.value = 'Mujer'; c.labB.value = 'Dos idiomas';
            } }
        ] }
      ],
      function (v) {
        var tot = cuenta(v.tot, 'El total de personas', 500);
        var nA = cuenta(v.nA, 'El número de personas que cumplen A', 500);
        var nB = cuenta(v.nB, 'El número de personas que cumplen B', 500);
        var nAB = cuenta(v.nAB, 'El número de personas que cumplen las dos cosas', 500);
        var labA = String(v.labA || 'A').trim() || 'A';
        var labB = String(v.labB || 'B').trim() || 'B';
        if (tot < 2) throw Error('Hacen falta al menos 2 personas para poder elegir una al azar.');
        if (nAB > nA || nAB > nB)
          throw Error('Los que cumplen las dos cosas (' + nAB + ') no pueden ser más que los de A (' + nA +
                      ') ni que los de B (' + nB + '): recuerda que los recuentos de A y de B ya incluyen a los de la intersección.');
        if (nA > tot || nB > tot)
          throw Error('Ni A ni B pueden tener más casos que el total (' + tot + ').');
        var n11 = nAB, n12 = nA - nAB, n21 = nB - nAB, n22 = tot - nA - nB + nAB;
        if (n22 < 0)
          throw Error('Con estos datos harían falta al menos ' + (nA + nB - nAB) + ' personas y solo hay ' + tot +
                      '. Si has leído «' + nA + ' solo de A», recuerda que la convención es que los ' + nA +
                      ' incluyen a los ' + nAB + ' que cumplen las dos cosas.');

        var tab = contingencia({
          cols: [labB + ' sí', labB + ' no'],
          filas: [
            { lab: labA + ' sí (A)', celdas: [n11, n12] },
            { lab: labA + ' no (A\u2032)', celdas: [n21, n22] }
          ],
          capC: labB, capF: labA,
          resalta: [{ fila: 0 }],
          cap: 'Las celdas se obtienen por diferencias: ' + nA + ' \u2212 ' + nAB + ' = ' + n12 + ', ' +
               nB + ' \u2212 ' + nAB + ' = ' + n21 + ', ' + tot + ' \u2212 ' + nA + ' = ' + (tot - nA) + ', ' +
               (tot - nA) + ' \u2212 ' + n21 + ' = ' + n22 + '.'
        });

        var pB = frac(nB, tot), pA = frac(nA, tot), pIn = frac(nAB, tot);
        var pBA = razon(nAB, nA, 'A');
        var pBnoA = razon(n21, tot - nA, 'A\u2032');
        var indep = fIgual(pIn, fProd(pA, pB));

        var comp = barras({
          items: [
            { lab: 'P(B)', valor: fVal(pB), txt: fracTxt(pB) + ' = ' + nc(fVal(pB), 3), color: COL.azul,
              nota: 'sin información: ' + nB + ' de ' + tot },
            { lab: 'P(B | A)', valor: fVal(pBA), txt: fracTxt(pBA) + ' = ' + nc(fVal(pBA), 3), color: COL.verde,
              nota: 'primera fila: ' + nAB + ' de ' + nA },
            { lab: 'P(B | A\u2032)', valor: fVal(pBnoA), txt: fracTxt(pBnoA) + ' = ' + nc(fVal(pBnoA), 3),
              color: COL.rojo, nota: 'segunda fila: ' + n21 + ' de ' + (tot - nA) }
          ],
          max: 1,
          cap: 'Tres probabilidades del mismo suceso $B$, calculadas en tres universos distintos.'
        });

        return tab + comp +
          '<div class="mx-info"><b>a) ' + esc(labB) + ' sabiendo que sí ' + esc(labA.toLowerCase()) + '.</b> ' +
          'Condicionar a $A$ es mirar <b>solo la primera fila</b>, cuyo total es ' + nA + ':' +
          KD('P(B \\mid A) = \\frac{n(A \\cap B)}{n(A)} = \\frac{' + nAB + '}{' + nA + '} = ' + fracFull(pBA)) +
          '</div>' +
          '<div class="mx-info"><b>b) ' + esc(labB) + ' sabiendo que no ' + esc(labA.toLowerCase()) + '.</b> ' +
          'Condicionar a $A\'$ es mirar <b>solo la segunda fila</b>, cuyo total es ' + (tot - nA) + ':' +
          KD('P(B \\mid A\') = \\frac{n(A\' \\cap B)}{n(A\')} = \\frac{' + n21 + '}{' + (tot - nA) +
             '} = ' + fracFull(pBnoA)) + '</div>' +
          resultado(fracTxt(pBA) + '  y  ' + fracTxt(pBnoA), 'P(B | A) y P(B | A\u2032)') +
          (indep
            ? bien('<b>Comprobación de la dependencia.</b> ' +
                   K('P(A) \\cdot P(B) = ' + fracTex(pA) + ' \\cdot ' + fracTex(pB) + ' = ' + fracTex(fProd(pA, pB))) +
                   ' y ' + K('P(A \\cap B) = ' + fracTex(pIn)) + '. Coinciden: con estos datos los sucesos son ' +
                   '<b>independientes</b> y la información no cambia nada.')
            : mal('<b>Comprobación de la dependencia.</b> ' +
                  K('P(A) \\cdot P(B) = ' + fracTex(pA) + ' \\cdot ' + fracTex(pB) + ' = ' +
                    S.kf(fVal(fProd(pA, pB)), 4)) + ' frente a ' +
                  K('P(A \\cap B) = ' + fracTex(pIn) + ' = ' + S.kf(fVal(pIn), 4)) +
                  '. No coinciden, luego los sucesos son <b>dependientes</b>: la información sí modifica el resultado.')) +
          nota('<b>Por qué la tabla es un paso previo obligatorio.</b> Con la tabla delante el enunciado deja de ' +
               'ser ambiguo: se ve que los ' + nA + ' de A se reparten en ' + n11 + ' y ' + n12 + ', y cada ' +
               'apartado se lee eligiendo una fila o una columna. Sin tabla, la mayoría de los errores vienen de ' +
               'dividir por el total general (' + tot + ') en lugar de por el total de la banda elegida.');
      });
  };

  /* ==================================================================
     3) condProb — la fórmula general con probabilidades (4.8.2.2)
     ================================================================== */
  R.condProb = function (node) {
    shell(node,
      'La fórmula general con probabilidades',
      'Dividiendo numerador y denominador de la versión de Laplace entre $n(E)$ se obtiene la fórmula ' +
      'que vale <b>siempre</b>, haya o no equiprobabilidad: ' +
      '$P(B \\mid A) = \\dfrac{P(A \\cap B)}{P(A)}$ con $P(A) > 0$. ' + FORMATO_P + ' ' +
      'Escribe por ejemplo <code>0,2</code> en $P(A)$ y <code>0,05</code> en $P(A \\cap B)$.',
      [
        { id: 'pA', label: 'P(A)', type: 'text', value: '0,2' },
        { id: 'pB', label: 'P(B)', type: 'text', value: '0,15' },
        { id: 'pAB', label: 'P(A \u2229 B)', type: 'text', value: '0,05' },
        { type: 'presets', list: [
          { label: 'Hipertensión y enfermedad cardíaca',
            title: 'P(A) = 0,2 y P(A ∩ B) = 0,05',
            apply: function (c) { c.pA.value = '0,2'; c.pB.value = '0,15'; c.pAB.value = '0,05'; } },
          { label: 'Clase de 22: baloncesto y fútbol',
            apply: function (c) { c.pA.value = '7/22'; c.pB.value = '12/22'; c.pAB.value = '6/22'; } },
          { label: 'Hospital: niño y ojos azules',
            apply: function (c) { c.pA.value = '0,525'; c.pB.value = '0,295'; c.pAB.value = '0,105'; } },
          { label: 'Sucesos independientes',
            title: 'P(A) = 0,5, P(B) = 0,4, P(A ∩ B) = 0,2',
            apply: function (c) { c.pA.value = '0,5'; c.pB.value = '0,4'; c.pAB.value = '0,2'; } },
          { label: 'Sucesos incompatibles',
            apply: function (c) { c.pA.value = '0,3'; c.pB.value = '0,45'; c.pAB.value = '0'; } },
          { label: 'Inclusión: B dentro de A',
            apply: function (c) { c.pA.value = '0,6'; c.pB.value = '0,25'; c.pAB.value = '0,25'; } }
        ] }
      ],
      function (v) {
        var pA = leeP(v.pA, 'P(A)');
        var pB = leeP(v.pB, 'P(B)');
        var pAB = leeP(v.pAB, 'P(A \u2229 B)');
        if (fVal(pAB) > fVal(pA) + 1e-12 || fVal(pAB) > fVal(pB) + 1e-12)
          throw Error('La intersección no puede ser más probable que los sucesos que la forman: hace falta ' +
                      'P(A \u2229 B) \u2264 P(A) y P(A \u2229 B) \u2264 P(B). ' +
                      'Baja P(A \u2229 B) o sube P(A) y P(B).');
        if (fIgual(pA, CERO))
          throw Error('Con P(A) = 0 no se puede condicionar a A: no tiene sentido preguntar «sabiendo que ha ' +
                      'ocurrido algo imposible». Escribe un valor mayor que 0 en P(A).');
        var pBA = fDiv(pAB, pA);
        var pAcondB = fIgual(pB, CERO) ? null : fDiv(pAB, pB);
        var pUn = fResta(fSuma(pA, pB), pAB);

        var tab = tabla(['Cantidad', 'Valor exacto', 'Decimal', 'Porcentaje'], [
          [K('P(A)'), K(fracTex(pA)), nc(fVal(pA), 4), pct(fVal(pA), 2)],
          [K('P(B)'), K(fracTex(pB)), nc(fVal(pB), 4), pct(fVal(pB), 2)],
          [K('P(A \\cap B)'), K(fracTex(pAB)), nc(fVal(pAB), 4), pct(fVal(pAB), 2)],
          { celdas: [K('P(B \\mid A)'), K(fracTex(pBA)), nc(fVal(pBA), 4), pct(fVal(pBA), 2)], clase: 'ap-hi' },
          pAcondB
            ? [K('P(A \\mid B)'), K(fracTex(pAcondB)), nc(fVal(pAcondB), 4), pct(fVal(pAcondB), 2)]
            : [K('P(A \\mid B)'), 'no definida', '\u2014', '\u2014'],
          [K('P(A \\cup B)'), K(fracTex(pUn)), nc(fVal(pUn), 4), pct(fVal(pUn), 2)]
        ]);

        var fig = venn({
          n: 2, pinta: ['ab'], color: COL.verdeClaro,
          cap: 'El numerador de las dos condicionadas es el mismo: la zona común $A \\cap B$. ' +
               'Lo que cambia es el <b>denominador</b>, es decir, el círculo que se toma como universo.',
          label: 'Diagrama de Venn de la intersección'
        });

        var deriv =
          '<div class="mx-info"><b>De Laplace a la fórmula general.</b> Se divide numerador y denominador entre $n(E)$:' +
          KD('P(B \\mid A) = \\frac{n(A \\cap B)}{n(A)} = \\frac{n(A \\cap B)/n(E)}{n(A)/n(E)} = ' +
             '\\frac{P(A \\cap B)}{P(A)}') +
          'La versión de Laplace solo vale si los resultados son equiprobables; esta segunda vale siempre. ' +
          'Por eso es la <b>definición</b> de probabilidad condicionada.</div>';

        return fig + tab +
          resultado(fracTxt(pBA) + '  =  ' + nc(fVal(pBA), 4) + '  =  ' + pct(fVal(pBA), 2), 'P(B | A)') +
          deriv +
          '<div class="mx-info"><b>Cálculo con tus datos.</b>' +
          KD('P(B \\mid A) = \\frac{P(A \\cap B)}{P(A)} = \\frac{' + S.kf(fVal(pAB), 4) + '}{' +
             S.kf(fVal(pA), 4) + '} = ' + fracFull(pBA)) + '</div>' +
          (pAcondB
            ? nota('<b>Y en el otro sentido.</b> ' +
                   K('P(A \\mid B) = \\frac{P(A \\cap B)}{P(B)} = ' + fracTex(pAcondB) + ' = ' + S.kf(fVal(pAcondB), 4)) +
                   '. Los dos cocientes comparten numerador, así que ' +
                   K('P(B \\mid A) \\cdot P(A) = P(A \\mid B) \\cdot P(B) = P(A \\cap B)') +
                   ': esta igualdad es el germen del teorema de Bayes.')
            : aviso('Con ' + K('P(B) = 0') + ' no se puede calcular ' + K('P(A \\mid B)') + '.')) +
          (fIgual(pAB, fProd(pA, pB))
            ? bien('Además ' + K('P(A \\cap B) = P(A) \\cdot P(B)') + ', así que ' +
                   K('P(B \\mid A) = P(B)') + ': los sucesos son <b>independientes</b> ' +
                   insignia('independientes', 'si') + '.')
            : '') +
          (fIgual(pAB, CERO)
            ? aviso('Con ' + K('P(A \\cap B) = 0') + ' los sucesos son <b>incompatibles</b>, y entonces ' +
                    K('P(B \\mid A) = 0') + ': saber que ha ocurrido $A$ garantiza que $B$ no ha ocurrido. ' +
                    'Es la máxima dependencia posible, justo lo contrario de la independencia.')
            : '') +
          aviso('<b>Condición imprescindible.</b> La fórmula exige ' + K('P(A) > 0') + '. ' +
                'El denominador de una condicionada es la probabilidad del suceso que ya sabes que ha ocurrido, ' +
                'y no puede ser nula.');
      });
  };

  /* ==================================================================
     4) contingenciaLab — laboratorio de tablas de contingencia (4.8.3)
     ================================================================== */
  R.contingenciaLab = function (node) {
    shell(node,
      'Laboratorio de tablas de contingencia',
      'Los cuatro recuentos del interior de la tabla son editables: escribe enteros, por ejemplo ' +
      '<code>21</code>, <code>84</code>, <code>38</code> y <code>57</code>. ' +
      'El applet calcula los totales, las cuatro probabilidades condicionadas y, sobre todo, enfrenta ' +
      '$P(A \\mid B)$ con $P(B \\mid A)$: comparten numerador, pero <b>casi nunca coinciden</b>. ' +
      'Cambia también los nombres de las dos características para adaptarlo a cualquier enunciado.',
      [
        { id: 'n11', label: 'A sí y B sí', type: 'number', min: 0, max: 100000, value: 21 },
        { id: 'n12', label: 'A sí y B no', type: 'number', min: 0, max: 100000, value: 84 },
        { id: 'n21', label: 'A no y B sí', type: 'number', min: 0, max: 100000, value: 38 },
        { id: 'n22', label: 'A no y B no', type: 'number', min: 0, max: 100000, value: 57 },
        { id: 'labA', label: 'Característica A (filas)', type: 'text', value: 'Niño' },
        { id: 'labB', label: 'Característica B (columnas)', type: 'text', value: 'Ojos azules' },
        { type: 'presets', list: [
          { label: 'Hospital: 200 nacimientos',
            title: '21 niños de ojos azules, 84 niños de otro color, 38 niñas de ojos azules, 57 niñas de otro color',
            apply: function (c) {
              c.n11.value = 21; c.n12.value = 84; c.n21.value = 38; c.n22.value = 57;
              c.labA.value = 'Niño'; c.labB.value = 'Ojos azules';
            } },
          { label: 'Tecnologías: 100 jóvenes',
            apply: function (c) {
              c.n11.value = 30; c.n12.value = 13; c.n21.value = 45; c.n22.value = 12;
              c.labA.value = 'Chico'; c.labB.value = 'Ordenador';
            } },
          { label: 'Clase de 22 estudiantes',
            apply: function (c) {
              c.n11.value = 6; c.n12.value = 1; c.n21.value = 6; c.n22.value = 9;
              c.labA.value = 'Baloncesto'; c.labB.value = 'Fútbol';
            } },
          { label: 'Autobús de 32 viajeros',
            apply: function (c) {
              c.n11.value = 10; c.n12.value = 9; c.n21.value = 8; c.n22.value = 5;
              c.labA.value = 'Hombre'; c.labB.value = 'Va a trabajar';
            } },
          { label: 'Caja de 16 bolas: caso independiente',
            apply: function (c) {
              c.n11.value = 3; c.n12.value = 3; c.n21.value = 5; c.n22.value = 5;
              c.labA.value = 'Roja'; c.labB.value = 'Numerada con 1';
            } },
          { label: 'Prueba médica sobre 10 000 personas',
            apply: function (c) {
              c.n11.value = 99; c.n12.value = 1; c.n21.value = 495; c.n22.value = 9405;
              c.labA.value = 'Enfermo'; c.labB.value = 'Positivo';
            } }
        ] }
      ],
      function (v) {
        var n11 = cuenta(v.n11, 'El recuento «A sí y B sí»');
        var n12 = cuenta(v.n12, 'El recuento «A sí y B no»');
        var n21 = cuenta(v.n21, 'El recuento «A no y B sí»');
        var n22 = cuenta(v.n22, 'El recuento «A no y B no»');
        var labA = String(v.labA || 'A').trim() || 'A';
        var labB = String(v.labB || 'B').trim() || 'B';
        var fA = n11 + n12, fnoA = n21 + n22, cB = n11 + n21, cnoB = n12 + n22;
        var tot = fA + fnoA;
        if (tot < 2)
          throw Error('La tabla necesita al menos 2 casos en total: con un solo individuo no hay nada que ' +
                      'condicionar. Sube alguno de los cuatro recuentos.');

        var tab = contingencia({
          cols: [labB + ' sí (B)', labB + ' no (B\u2032)'],
          filas: [
            { lab: labA + ' sí (A)', celdas: [n11, n12] },
            { lab: labA + ' no (A\u2032)', celdas: [n21, n22] }
          ],
          capC: labB, capF: labA,
          resalta: [{ f: 0, c: 0 }],
          cap: 'La celda amarilla es ' + K('n(A \\cap B) = ' + n11) + ', el numerador <b>común</b> a ' +
               K('P(A \\mid B)') + ' y a ' + K('P(B \\mid A)') + '.'
        });

        var pA = frac(fA, tot), pB = frac(cB, tot), pAB = frac(n11, tot);
        var pBdA = razon(n11, fA, labA + ' sí');
        var pAdB = razon(n11, cB, labB + ' sí');
        var pBdnoA = razon(n21, fnoA, labA + ' no');
        var pAdnoB = razon(n12, cnoB, labB + ' no');

        var caras =
          '<div class="ap-grid2">' +
          tarjeta('P(B | A) = P(' + esc(labB) + ' | ' + esc(labA) + ')',
            resultado(fracTxt(pBdA) + '  =  ' + nc(fVal(pBdA), 4),
              'Universo: la fila «' + esc(labA) + ' sí», con ' + fA + ' casos') +
            KD('P(B \\mid A) = \\frac{' + n11 + '}{' + fA + '}'), 'ap-card-ok') +
          tarjeta('P(A | B) = P(' + esc(labA) + ' | ' + esc(labB) + ')',
            resultado(fracTxt(pAdB) + '  =  ' + nc(fVal(pAdB), 4),
              'Universo: la columna «' + esc(labB) + ' sí», con ' + cB + ' casos') +
            KD('P(A \\mid B) = \\frac{' + n11 + '}{' + cB + '}'), 'ap-card-avi') +
          '</div>';

        var comp = barras({
          items: [
            { lab: 'P(B | A)', valor: fVal(pBdA), txt: fracTxt(pBdA) + ' = ' + nc(fVal(pBdA), 4),
              color: COL.verde, nota: n11 + ' de ' + fA + ' (fila)' },
            { lab: 'P(A | B)', valor: fVal(pAdB), txt: fracTxt(pAdB) + ' = ' + nc(fVal(pAdB), 4),
              color: COL.naranja, nota: n11 + ' de ' + cB + ' (columna)' },
            { lab: 'P(B)', valor: fVal(pB), txt: fracTxt(pB) + ' = ' + nc(fVal(pB), 4),
              color: COL.azul, nota: cB + ' de ' + tot + ' (sin condicionar)' },
            { lab: 'P(A)', valor: fVal(pA), txt: fracTxt(pA) + ' = ' + nc(fVal(pA), 4),
              color: COL.morado, nota: fA + ' de ' + tot + ' (sin condicionar)' }
          ],
          max: 1,
          cap: 'Mismo numerador, distintos denominadores: por eso invertir la barra cambia el resultado.'
        });

        var todas = tabla(['Condicionada', 'Universo (denominador)', 'Favorables', 'Valor exacto', 'Decimal'], [
          { celdas: [K('P(B \\mid A)'), esc(labA) + ' sí: ' + fA, String(n11), K(fracTex(pBdA)), nc(fVal(pBdA), 4)], clase: 'ap-hi' },
          [K('P(B \\mid A\')'), esc(labA) + ' no: ' + fnoA, String(n21), K(fracTex(pBdnoA)), nc(fVal(pBdnoA), 4)],
          { celdas: [K('P(A \\mid B)'), esc(labB) + ' sí: ' + cB, String(n11), K(fracTex(pAdB)), nc(fVal(pAdB), 4)], clase: 'ap-hi' },
          [K('P(A \\mid B\')'), esc(labB) + ' no: ' + cnoB, String(n12), K(fracTex(pAdnoB)), nc(fVal(pAdnoB), 4)]
        ]);

        var indep = fIgual(pAB, fProd(pA, pB));
        var difer = Math.abs(fVal(pBdA) - fVal(pAdB));

        return tab + caras + comp + todas +
          '<div class="mx-info"><b>Por qué no coinciden.</b> Las dos condicionadas se calculan con el mismo ' +
          'numerador ' + K('n(A \\cap B) = ' + n11) + ', pero una divide por el total de la <b>fila</b> (' + fA +
          ') y la otra por el total de la <b>columna</b> (' + cB + '). ' +
          (difer < 1e-12
            ? 'Aquí coinciden porque los dos totales son iguales; es la excepción, no la regla.'
            : 'La diferencia entre ambas es de ' + nc(difer, 4) + ' en probabilidad, es decir ' +
              nc(100 * difer, 2) + ' puntos porcentuales.') + '</div>' +
          (indep
            ? bien('<b>Independencia.</b> ' + K('P(A) \\cdot P(B) = ' + fracTex(fProd(pA, pB))) + ' coincide con ' +
                   K('P(A \\cap B) = ' + fracTex(pAB)) + ', luego las dos características son <b>independientes</b>: ' +
                   'fíjate en que ' + K('P(B \\mid A) = P(B \\mid A\') = P(B)') + '.')
            : nota('<b>Dependencia.</b> ' + K('P(A) \\cdot P(B) = ' + S.kf(fVal(fProd(pA, pB)), 4)) +
                   ' frente a ' + K('P(A \\cap B) = ' + S.kf(fVal(pAB), 4)) + ': no coinciden, luego las dos ' +
                   'características son <b>dependientes</b>. Se ve también en que ' +
                   K('P(B \\mid A) = ' + S.kf(fVal(pBdA), 4)) + ' y ' +
                   K('P(B \\mid A\') = ' + S.kf(fVal(pBdnoA), 4)) + ' son distintas.')) +
          aviso('<b>El error más caro del tema.</b> Confundir ' + K('P(A \\mid B)') + ' con ' + K('P(B \\mid A)') +
                ' es la <b>falacia de la inversión</b>. Pregúntate siempre: ¿cuál es el dato que ya sé? ' +
                'Ese es el que va detrás de la barra, y su total es el denominador.');
      });
  };

  /* ==================================================================
     5) hospital — los 200 nacimientos del hospital (4.8.3.1)
     ================================================================== */
  R.hospital = function (node) {
    shell(node,
      'Los 200 nacimientos del hospital',
      'De 200 nacimientos, 105 son niños y 95 niñas; 21 de los niños y 38 de las niñas tienen los ojos azules. ' +
      'Escribe los cuatro recuentos como enteros, por ejemplo <code>105</code>, <code>21</code>, ' +
      '<code>95</code> y <code>38</code>. El applet completa la tabla y responde a las cuatro preguntas ' +
      'clásicas, incluida la inversa $P(\\text{niña} \\mid \\text{azules})$, que es la que anticipa el ' +
      'teorema de Bayes.',
      [
        { id: 'nn', label: 'Niños', type: 'number', min: 0, max: 5000, value: 105 },
        { id: 'na', label: 'Niños con ojos azules', type: 'number', min: 0, max: 5000, value: 21 },
        { id: 'mn', label: 'Niñas', type: 'number', min: 0, max: 5000, value: 95 },
        { id: 'ma', label: 'Niñas con ojos azules', type: 'number', min: 0, max: 5000, value: 38 },
        { id: 'preg', label: 'Pregunta', type: 'select', value: 'noazul', options: [
          { value: 'noazul', label: 'a) No tener los ojos azules' },
          { value: 'azulnino', label: 'b) Ojos azules sabiendo que es niño' },
          { value: 'azulnina', label: 'c) Ojos azules sabiendo que es niña' },
          { value: 'ninaazul', label: 'd) Ser niña sabiendo que tiene los ojos azules' }
        ] },
        { type: 'presets', list: [
          { label: 'Datos del hospital: 200 nacimientos',
            apply: function (c) { c.nn.value = 105; c.na.value = 21; c.mn.value = 95; c.ma.value = 38; c.preg.value = 'noazul'; } },
          { label: 'La inversa: niña sabiendo ojos azules',
            title: 'Mismos datos, pregunta d)',
            apply: function (c) { c.nn.value = 105; c.na.value = 21; c.mn.value = 95; c.ma.value = 38; c.preg.value = 'ninaazul'; } },
          { label: 'Si el color fuera independiente del sexo',
            title: 'Misma proporción de ojos azules en los dos grupos',
            apply: function (c) { c.nn.value = 100; c.na.value = 30; c.mn.value = 100; c.ma.value = 30; c.preg.value = 'azulnino'; } },
          { label: 'Grupos de tamaño muy distinto',
            apply: function (c) { c.nn.value = 160; c.na.value = 32; c.mn.value = 40; c.ma.value = 20; c.preg.value = 'ninaazul'; } },
          { label: 'Rasgo poco frecuente',
            apply: function (c) { c.nn.value = 105; c.na.value = 3; c.mn.value = 95; c.ma.value = 7; c.preg.value = 'ninaazul'; } }
        ] }
      ],
      function (v) {
        var nn = cuenta(v.nn, 'El número de niños', 5000);
        var na = cuenta(v.na, 'El número de niños con ojos azules', 5000);
        var mn = cuenta(v.mn, 'El número de niñas', 5000);
        var ma = cuenta(v.ma, 'El número de niñas con ojos azules', 5000);
        if (na > nn) throw Error('Los niños con ojos azules (' + na + ') no pueden ser más que los niños (' + nn + ').');
        if (ma > mn) throw Error('Las niñas con ojos azules (' + ma + ') no pueden ser más que las niñas (' + mn + ').');
        var tot = nn + mn;
        if (tot < 2) throw Error('Hacen falta al menos 2 nacimientos para elegir uno al azar.');
        var azul = na + ma, otro = tot - azul;

        var tab = contingencia({
          cols: ['Ojos azules (B)', 'Otro color (B\u2032)'],
          filas: [
            { lab: 'Niño (A)', celdas: [na, nn - na] },
            { lab: 'Niña (A\u2032)', celdas: [ma, mn - ma] }
          ],
          capC: 'Color de ojos', capF: 'Sexo',
          resalta: [{ f: 0, c: 0 }],
          cap: 'Cada apartado se resuelve eligiendo la banda correcta: fila para condicionar al sexo, ' +
               'columna para condicionar al color de ojos.'
        });

        var pAzul = frac(azul, tot), pOtro = frac(otro, tot);
        var pNino = frac(nn, tot), pNina = frac(mn, tot);
        var pAzulNino = razon(na, nn, 'los niños');
        var pAzulNina = razon(ma, mn, 'las niñas');
        var pNinaAzul = razon(ma, azul, 'los ojos azules');
        var pNinoAzul = razon(na, azul, 'los ojos azules');

        var arb = arbol({ lab: '', hijos: [
          { lab: 'N', p: pNino, color: COL.azul, hijos: [
            { lab: 'B', p: pAzulNino, color: COL.teal, camino: 'niño y ojos azules' },
            { lab: 'B\u2032', p: fResta(UNO, pAzulNino), color: COL.gris, camino: 'niño y otro color' }
          ] },
          { lab: 'Ñ', p: pNina, color: COL.rojo, hijos: [
            { lab: 'B', p: pAzulNina, color: COL.teal, camino: 'niña y ojos azules' },
            { lab: 'B\u2032', p: fResta(UNO, pAzulNina), color: COL.gris, camino: 'niña y otro color' }
          ] }
        ] }, {
          cap: 'La misma tabla leída como árbol: primero el sexo, después el color de ojos condicionado al sexo. ' +
               'Las cuatro hojas son las cuatro celdas del interior de la tabla.',
          label: 'Árbol del hospital', pasoY: 70
        });

        var respuestas = {
          noazul: { tex: 'P(B\')', f: pOtro, txt: 'No tener los ojos azules',
            desar: 'Se puede hacer de dos maneras. Contando: ' +
              KD('P(B\') = \\frac{' + otro + '}{' + tot + '} = ' + fracFull(pOtro)) +
              'o con la probabilidad del contrario, que es más rápida: ' +
              KD('P(B\') = 1 - P(B) = 1 - ' + fracTex(pAzul) + ' = ' + fracFull(pOtro)) },
          azulnino: { tex: 'P(B \\mid A)', f: pAzulNino, txt: 'Ojos azules sabiendo que es niño',
            desar: 'El dato «es niño» reduce el universo a la <b>primera fila</b>, con ' + nn + ' casos:' +
              KD('P(B \\mid A) = \\frac{n(A \\cap B)}{n(A)} = \\frac{' + na + '}{' + nn + '} = ' + fracFull(pAzulNino)) },
          azulnina: { tex: 'P(B \\mid A\')', f: pAzulNina, txt: 'Ojos azules sabiendo que es niña',
            desar: 'Ahora el universo es la <b>segunda fila</b>, con ' + mn + ' casos:' +
              KD('P(B \\mid A\') = \\frac{' + ma + '}{' + mn + '} = ' + fracFull(pAzulNina)) },
          ninaazul: { tex: 'P(A\' \\mid B)', f: pNinaAzul, txt: 'Ser niña sabiendo que tiene los ojos azules',
            desar: 'El dato es ahora el color de ojos, así que el universo es la <b>primera columna</b>, ' +
              'con ' + azul + ' casos:' +
              KD('P(A\' \\mid B) = \\frac{' + ma + '}{' + azul + '} = ' + fracFull(pNinaAzul)) +
              'Fíjate en el giro: se pregunta por la <b>causa</b> (el sexo) a partir del <b>indicio</b> ' +
              '(el color de ojos). Ese giro es exactamente el que formaliza el teorema de Bayes.' }
        };
        var r = respuestas[v.preg] || respuestas.noazul;

        var todas = tabla(['Pregunta', 'Expresión', 'Valor exacto', 'Decimal', 'Porcentaje'], [
          [K('P(B\')') + ' otro color', 'de ' + otro + ' entre ' + tot, K(fracTex(pOtro)), nc(fVal(pOtro), 4), pct(fVal(pOtro), 1)],
          [K('P(B \\mid A)') + ' azules si niño', 'de ' + na + ' entre ' + nn, K(fracTex(pAzulNino)), nc(fVal(pAzulNino), 4), pct(fVal(pAzulNino), 1)],
          [K('P(B \\mid A\')') + ' azules si niña', 'de ' + ma + ' entre ' + mn, K(fracTex(pAzulNina)), nc(fVal(pAzulNina), 4), pct(fVal(pAzulNina), 1)],
          [K('P(A\' \\mid B)') + ' niña si azules', 'de ' + ma + ' entre ' + azul, K(fracTex(pNinaAzul)), nc(fVal(pNinaAzul), 4), pct(fVal(pNinaAzul), 1)],
          [K('P(A \\mid B)') + ' niño si azules', 'de ' + na + ' entre ' + azul, K(fracTex(pNinoAzul)), nc(fVal(pNinoAzul), 4), pct(fVal(pNinoAzul), 1)]
        ]);

        var indep = fIgual(frac(na, tot), fProd(pNino, pAzul));

        return tab + arb +
          resultado(fracTxt(r.f) + '  =  ' + nc(fVal(r.f), 4) + '  =  ' + pct(fVal(r.f), 2), r.txt) +
          '<div class="mx-info"><b>Desarrollo de la pregunta elegida.</b> ' + r.desar + '</div>' +
          todas +
          (indep
            ? bien('<b>Independencia.</b> La proporción de ojos azules es la misma en los dos grupos, ' +
                   'así que el sexo y el color de ojos son <b>independientes</b>: ' +
                   K('P(B \\mid A) = P(B \\mid A\') = P(B)') + '.')
            : mal('<b>Dependencia.</b> ' +
                  K('P(A) \\cdot P(B) = ' + fracTex(pNino) + ' \\cdot ' + fracTex(pAzul) + ' = ' +
                    S.kf(fVal(fProd(pNino, pAzul)), 4)) + ' frente a ' +
                  K('P(A \\cap B) = ' + fracTex(frac(na, tot)) + ' = ' + S.kf(na / tot, 4)) +
                  '. No coinciden: el color de ojos y el sexo son <b>dependientes</b> en esta muestra.')) +
          nota('<b>Dos condicionadas que nunca hay que confundir.</b> ' +
               K('P(B \\mid A\') = ' + fracTex(pAzulNina)) + ' (de las niñas, cuántas tienen ojos azules) y ' +
               K('P(A\' \\mid B) = ' + fracTex(pNinaAzul)) + ' (de los de ojos azules, cuántos son niñas). ' +
               'Comparten el numerador ' + ma + ', pero el denominador es ' + mn + ' en un caso y ' + azul +
               ' en el otro.');
      });
  };

  /* ==================================================================
     6) tecnologias — chicos, chicas, ordenador y tableta (4.8.3.2)
     ================================================================== */
  R.tecnologias = function (node) {
    shell(node,
      'Chicos, chicas, ordenador y tableta',
      'Cien jóvenes eligen entre ordenador y tableta. Los cuatro recuentos del interior de la tabla son ' +
      'editables: escribe enteros, por ejemplo <code>45</code> (chicas con ordenador), <code>12</code> ' +
      '(chicas con tableta), <code>30</code> y <code>13</code>. ' +
      'Elige después una de las tres preguntas del enunciado y el applet la resuelve señalando la banda ' +
      'de la tabla que sirve de universo.',
      [
        { id: 'co', label: 'Chicas con ordenador', type: 'number', min: 0, max: 5000, value: 45 },
        { id: 'ct', label: 'Chicas con tableta', type: 'number', min: 0, max: 5000, value: 12 },
        { id: 'ho', label: 'Chicos con ordenador', type: 'number', min: 0, max: 5000, value: 30 },
        { id: 'ht', label: 'Chicos con tableta', type: 'number', min: 0, max: 5000, value: 13 },
        { id: 'preg', label: 'Pregunta', type: 'select', value: 'tableta', options: [
          { value: 'tableta', label: 'a) Preferir la tableta' },
          { value: 'chicaTab', label: 'b) Ser chica sabiendo que prefiere la tableta' },
          { value: 'ordChico', label: 'c) Preferir el ordenador sabiendo que es chico' }
        ] },
        { type: 'presets', list: [
          { label: 'Datos del estudio: 100 jóvenes',
            apply: function (c) { c.co.value = 45; c.ct.value = 12; c.ho.value = 30; c.ht.value = 13; c.preg.value = 'tableta'; } },
          { label: 'Apartado b): chica sabiendo tableta',
            apply: function (c) { c.co.value = 45; c.ct.value = 12; c.ho.value = 30; c.ht.value = 13; c.preg.value = 'chicaTab'; } },
          { label: 'Apartado c): ordenador sabiendo chico',
            apply: function (c) { c.co.value = 45; c.ct.value = 12; c.ho.value = 30; c.ht.value = 13; c.preg.value = 'ordChico'; } },
          { label: 'Preferencias idénticas en los dos grupos',
            title: 'Caso independiente',
            apply: function (c) { c.co.value = 45; c.ct.value = 15; c.ho.value = 30; c.ht.value = 10; c.preg.value = 'ordChico'; } },
          { label: 'Muestra pequeña: 24 personas',
            apply: function (c) { c.co.value = 9; c.ct.value = 5; c.ho.value = 7; c.ht.value = 3; c.preg.value = 'chicaTab'; } }
        ] }
      ],
      function (v) {
        var co = cuenta(v.co, 'Las chicas con ordenador', 5000);
        var ct = cuenta(v.ct, 'Las chicas con tableta', 5000);
        var ho = cuenta(v.ho, 'Los chicos con ordenador', 5000);
        var ht = cuenta(v.ht, 'Los chicos con tableta', 5000);
        var chicas = co + ct, chicos = ho + ht;
        var ord = co + ho, tab2 = ct + ht, tot = chicas + chicos;
        if (tot < 2) throw Error('Hacen falta al menos 2 personas encuestadas. Sube alguno de los cuatro recuentos.');

        var marca = v.preg === 'tableta' ? [{ col: 1 }]
                  : v.preg === 'chicaTab' ? [{ col: 1 }]
                  : [{ fila: 1 }];
        var tabla2 = contingencia({
          cols: ['Ordenador (O)', 'Tableta (D)'],
          filas: [
            { lab: 'Chica (M)', celdas: [co, ct] },
            { lab: 'Chico (H)', celdas: [ho, ht] }
          ],
          capC: 'Dispositivo preferido', capF: 'Sexo',
          resalta: marca,
          cap: 'La banda resaltada es el universo de la pregunta elegida: su total es el denominador.'
        });

        var pD = frac(tab2, tot), pO = frac(ord, tot);
        var pChicaD = razon(ct, tab2, 'quienes prefieren la tableta');
        var pOChico = razon(ho, chicos, 'los chicos');
        var pChica = frac(chicas, tot);

        var respuestas = {
          tableta: { f: pD, lab: 'Preferir la tableta',
            desar: 'No hay condición: el universo son las ' + tot + ' personas.' +
              KD('P(D) = \\frac{n(D)}{n(E)} = \\frac{' + tab2 + '}{' + tot + '} = ' + fracFull(pD)) },
          chicaTab: { f: pChicaD, lab: 'Ser chica sabiendo que prefiere la tableta',
            desar: 'El dato reduce el universo a la columna de la tableta, con ' + tab2 + ' casos:' +
              KD('P(M \\mid D) = \\frac{n(M \\cap D)}{n(D)} = \\frac{' + ct + '}{' + tab2 + '} = ' + fracFull(pChicaD)) },
          ordChico: { f: pOChico, lab: 'Preferir el ordenador sabiendo que es chico',
            desar: 'El dato reduce el universo a la fila de los chicos, con ' + chicos + ' casos:' +
              KD('P(O \\mid H) = \\frac{n(O \\cap H)}{n(H)} = \\frac{' + ho + '}{' + chicos + '} = ' + fracFull(pOChico)) }
        };
        var r = respuestas[v.preg] || respuestas.tableta;

        var barr = barras({
          items: [
            { lab: 'P(D)', valor: fVal(pD), txt: fracTxt(pD) + ' = ' + nc(fVal(pD), 4), color: COL.azul,
              nota: 'toda la muestra: ' + tab2 + ' de ' + tot },
            { lab: 'P(D | M)', valor: ct / (chicas || 1), txt: fracTxt(razon(ct, chicas, 'las chicas')) +
              ' = ' + nc(ct / (chicas || 1), 4), color: COL.morado, nota: ct + ' de ' + chicas + ' chicas' },
            { lab: 'P(D | H)', valor: ht / (chicos || 1), txt: fracTxt(razon(ht, chicos, 'los chicos')) +
              ' = ' + nc(ht / (chicos || 1), 4), color: COL.teal, nota: ht + ' de ' + chicos + ' chicos' },
            { lab: 'P(M | D)', valor: fVal(pChicaD), txt: fracTxt(pChicaD) + ' = ' + nc(fVal(pChicaD), 4),
              color: COL.naranja, nota: ct + ' de ' + tab2 + ' (columna)' }
          ],
          max: 1,
          cap: 'Las tres primeras barras preguntan por el dispositivo; la cuarta invierte la pregunta.'
        });

        return tabla2 + barr +
          resultado(fracTxt(r.f) + '  =  ' + nc(fVal(r.f), 4) + '  =  ' + pct(fVal(r.f), 2), r.lab) +
          '<div class="mx-info"><b>Desarrollo.</b> ' + r.desar + '</div>' +
          kvs([
            ['Chicas', chicas + ' (' + pct(fVal(pChica), 1) + ')'],
            ['Chicos', chicos + ' (' + pct(chicos / tot, 1) + ')'],
            ['Prefieren ordenador', ord + ' (' + pct(fVal(pO), 1) + ')'],
            ['Prefieren tableta', tab2 + ' (' + pct(fVal(pD), 1) + ')']
          ]) +
          nota('<b>Regla práctica.</b> Lo que va <b>detrás</b> de la barra es el dato que ya conoces, y su total ' +
               'es el denominador. En el apartado b) el dato es «prefiere la tableta», así que se divide entre ' +
               tab2 + '; en el c) el dato es «es chico», así que se divide entre ' + chicos + '.') +
          aviso('Con estos datos ' + K('P(M \\mid D) = ' + fracTex(pChicaD)) + ' y ' +
                K('P(D \\mid M) = ' + fracTex(razon(ct, chicas, 'las chicas'))) +
                ': dos números distintos para dos preguntas distintas, aunque las dos hablen de chicas y tabletas.');
      });
  };

  /* ==================================================================
     7) reglaProducto — la regla del producto (4.8.4)
     ================================================================== */
  R.reglaProducto = function (node) {
    shell(node,
      'La regla del producto',
      'Despejando la intersección en la definición de probabilidad condicionada se obtiene la herramienta ' +
      'más útil del tema: $P(A \\cap B) = P(A) \\cdot P(B \\mid A)$. ' +
      'Multiplicar a lo largo de un camino del árbol es aplicar esta regla. ' + FORMATO_P + ' ' +
      'Escribe por ejemplo <code>14/24</code> en $P(A)$ y <code>8/14</code> en $P(B \\mid A)$; ' +
      'marca la tercera etapa para ver la versión encadenada.',
      [
        { id: 'pA', label: 'P(A), primera etapa', type: 'text', value: '14/24' },
        { id: 'pBA', label: 'P(B | A), segunda etapa', type: 'text', value: '8/14' },
        { id: 'tres', label: 'Añadir una tercera etapa', type: 'check', value: false },
        { id: 'pCAB', label: 'P(C | A \u2229 B), tercera etapa', type: 'text', value: '1/2' },
        { id: 'nomA', label: 'Nombre de la primera etapa', type: 'text', value: 'mujer' },
        { id: 'nomB', label: 'Nombre de la segunda etapa', type: 'text', value: 'leyendo' },
        { type: 'presets', list: [
          { label: 'Biblioteca: mujer y leyendo',
            title: 'P(A) = 14/24 y P(B | A) = 8/14',
            apply: function (c) {
              c.pA.value = '14/24'; c.pBA.value = '8/14'; c.tres.checked = false;
              c.nomA.value = 'mujer'; c.nomB.value = 'leyendo';
            } },
          { label: 'Cafetería: mujer y con café',
            title: 'P(A) = 10/22 y P(B | A) = 4/10',
            apply: function (c) {
              c.pA.value = '10/22'; c.pBA.value = '4/10'; c.tres.checked = false;
              c.nomA.value = 'mujer'; c.nomB.value = 'con café';
            } },
          { label: 'Urna 2 blancas y 2 azules, sin devolución',
            apply: function (c) {
              c.pA.value = '2/4'; c.pBA.value = '1/3'; c.tres.checked = false;
              c.nomA.value = 'blanca'; c.nomB.value = 'blanca';
            } },
          { label: 'Tres cartas de una baraja de 40, sin devolución',
            apply: function (c) {
              c.pA.value = '10/40'; c.pBA.value = '9/39'; c.tres.checked = true; c.pCAB.value = '8/38';
              c.nomA.value = 'copas'; c.nomB.value = 'copas';
            } },
          { label: 'Etapas independientes: el producto se simplifica',
            apply: function (c) {
              c.pA.value = '0,3'; c.pBA.value = '0,3'; c.tres.checked = false;
              c.nomA.value = 'figura'; c.nomB.value = 'figura';
            } },
          { label: 'Idiomas: mujer y habla dos idiomas',
            apply: function (c) {
              c.pA.value = '18/33'; c.pBA.value = '4/18'; c.tres.checked = false;
              c.nomA.value = 'mujer'; c.nomB.value = 'dos idiomas';
            } }
        ] }
      ],
      function (v) {
        var pA = leeP(v.pA, 'P(A)');
        var pBA = leeP(v.pBA, 'P(B | A)');
        var tres = v.tres === true || v.tres === 'true';
        var pCAB = tres ? leeP(v.pCAB, 'P(C | A \u2229 B)') : null;
        var nomA = String(v.nomA || 'A').trim() || 'A';
        var nomB = String(v.nomB || 'B').trim() || 'B';
        if (fIgual(pA, CERO))
          throw Error('Con P(A) = 0 la segunda etapa no puede existir: escribe una probabilidad mayor que 0 en P(A).');
        var pAB = fProd(pA, pBA);
        var pABC = tres ? fProd(pAB, pCAB) : null;

        var hijosA = tres
          ? [{ lab: 'B', p: pBA, color: COL.verde, hijos: [
                { lab: 'C', p: pCAB, color: COL.teal, camino: 'A y B y C' },
                { lab: 'C\u2032', p: fResta(UNO, pCAB), color: COL.gris, camino: 'A y B y no C' }
              ] },
              { lab: 'B\u2032', p: fResta(UNO, pBA), color: COL.gris, camino: 'A y no B' }]
          : [{ lab: 'B', p: pBA, color: COL.verde, camino: nomA + ' y ' + nomB },
             { lab: 'B\u2032', p: fResta(UNO, pBA), color: COL.gris, camino: nomA + ' y no ' + nomB }];

        var arb = arbol({ lab: '', hijos: [
          { lab: 'A', p: pA, color: COL.azul, hijos: hijosA },
          { lab: 'A\u2032', p: fResta(UNO, pA), color: COL.rojo,
            camino: 'no ' + nomA }
        ] }, {
          cap: 'El camino resaltado por el cálculo es el que baja por $A$ y sigue por $B$: se multiplican sus ' +
               'probabilidades porque la segunda ya está condicionada a la primera.',
          label: 'Árbol de la regla del producto', pasoY: 72
        });

        var desar = tres
          ? KD('P(A \\cap B \\cap C) = P(A) \\cdot P(B \\mid A) \\cdot P(C \\mid A \\cap B) = ' +
               fracTex(pA) + ' \\cdot ' + fracTex(pBA) + ' \\cdot ' + fracTex(pCAB) + ' = ' + fracFull(pABC))
          : KD('P(A \\cap B) = P(A) \\cdot P(B \\mid A) = ' + fracTex(pA) + ' \\cdot ' + fracTex(pBA) +
               ' = ' + fracFull(pAB));
        var res = tres ? pABC : pAB;

        return arb +
          resultado(fracTxt(res) + '  =  ' + nc(fVal(res), 4) + '  =  ' + pct(fVal(res), 2),
            tres ? 'P(A \u2229 B \u2229 C)' : 'P(' + esc(nomA) + ' y ' + esc(nomB) + ')') +
          '<div class="mx-info"><b>De la definición a la regla.</b>' +
          pasos([
            'Definición: ' + K('P(B \\mid A) = \\dfrac{P(A \\cap B)}{P(A)}') + '.',
            'Se multiplican los dos miembros por ' + K('P(A)') + ': ' +
              K('P(A) \\cdot P(B \\mid A) = P(A \\cap B)') + '.',
            'Con tus datos: ' + desar
          ]) + '</div>' +
          tabla(['Camino', 'Producto', 'Valor exacto', 'Decimal'], [
            { celdas: ['A y B', K(fracTex(pA) + ' \\cdot ' + fracTex(pBA)), K(fracTex(pAB)), nc(fVal(pAB), 4)], clase: 'ap-hi' },
            ['A y no B', K(fracTex(pA) + ' \\cdot ' + fracTex(fResta(UNO, pBA))),
              K(fracTex(fProd(pA, fResta(UNO, pBA)))), nc(fVal(fProd(pA, fResta(UNO, pBA))), 4)],
            ['no A', K(fracTex(fResta(UNO, pA))), K(fracTex(fResta(UNO, pA))), nc(1 - fVal(pA), 4)]
          ]) +
          (fIgual(pBA, CERO)
            ? aviso('Con ' + K('P(B \\mid A) = 0') + ' la intersección es imposible: ' + K('P(A \\cap B) = 0') + '.')
            : '') +
          nota('<b>La versión simétrica.</b> También vale ' + K('P(A \\cap B) = P(B) \\cdot P(A \\mid B)') +
               ': se elige la que dé menos trabajo con los datos del enunciado. ' +
               'Y si los sucesos son <b>independientes</b>, ' + K('P(B \\mid A) = P(B)') + ' y la regla se ' +
               'convierte en el producto directo ' + K('P(A \\cap B) = P(A) \\cdot P(B)') + '.') +
          aviso('<b>El error típico.</b> Multiplicar ' + K('P(A) \\cdot P(B)') + ' cuando las etapas son ' +
                'dependientes. En una extracción sin devolución la segunda probabilidad <b>cambia</b>, y hay que ' +
                'usar la condicionada, no la de partida.');
      });
  };

  /* ==================================================================
     8) biblioteca — la biblioteca y la cafetería (4.8.4.1 y 4.8.4.2)
     ================================================================== */
  R.biblioteca = function (node) {
    shell(node,
      'La biblioteca y la cafetería',
      'En una biblioteca hay 14 mujeres y 10 hombres; están leyendo 8 mujeres y 5 hombres. ' +
      '¿Cuál es la probabilidad de que una persona elegida al azar sea <b>mujer y esté leyendo</b>? ' +
      'Escribe los cuatro recuentos como enteros, por ejemplo <code>14</code>, <code>8</code>, ' +
      '<code>10</code> y <code>5</code>. El applet resuelve el problema por los <b>dos caminos</b>: ' +
      'con la regla del producto y contando directamente, y comprueba que coinciden.',
      [
        { id: 'nM', label: 'Mujeres', type: 'number', min: 0, max: 2000, value: 14 },
        { id: 'nML', label: 'Mujeres que cumplen la condición', type: 'number', min: 0, max: 2000, value: 8 },
        { id: 'nH', label: 'Hombres', type: 'number', min: 0, max: 2000, value: 10 },
        { id: 'nHL', label: 'Hombres que cumplen la condición', type: 'number', min: 0, max: 2000, value: 5 },
        { id: 'cond', label: 'Nombre de la condición', type: 'text', value: 'leyendo' },
        { type: 'presets', list: [
          { label: 'Biblioteca: 14 mujeres y 10 hombres',
            title: '8 mujeres y 5 hombres leyendo',
            apply: function (c) { c.nM.value = 14; c.nML.value = 8; c.nH.value = 10; c.nHL.value = 5; c.cond.value = 'leyendo'; } },
          { label: 'Cafetería: 12 hombres y 10 mujeres',
            title: '7 hombres y 4 mujeres toman café',
            apply: function (c) { c.nM.value = 10; c.nML.value = 4; c.nH.value = 12; c.nHL.value = 7; c.cond.value = 'con café'; } },
          { label: 'Idiomas: 18 mujeres y 15 hombres',
            apply: function (c) { c.nM.value = 18; c.nML.value = 4; c.nH.value = 15; c.nHL.value = 6; c.cond.value = 'habla dos idiomas'; } },
          { label: 'Autobús de 32 viajeros',
            apply: function (c) { c.nM.value = 13; c.nML.value = 8; c.nH.value = 19; c.nHL.value = 10; c.cond.value = 'va a trabajar'; } },
          { label: 'Misma proporción en los dos grupos',
            title: 'Caso independiente',
            apply: function (c) { c.nM.value = 14; c.nML.value = 7; c.nH.value = 10; c.nHL.value = 5; c.cond.value = 'leyendo'; } }
        ] }
      ],
      function (v) {
        var nM = cuenta(v.nM, 'El número de mujeres', 2000);
        var nML = cuenta(v.nML, 'El número de mujeres que cumplen la condición', 2000);
        var nH = cuenta(v.nH, 'El número de hombres', 2000);
        var nHL = cuenta(v.nHL, 'El número de hombres que cumplen la condición', 2000);
        var cond = String(v.cond || 'la condición').trim() || 'la condición';
        if (nML > nM) throw Error('Las mujeres que cumplen la condición (' + nML + ') no pueden ser más que las mujeres (' + nM + ').');
        if (nHL > nH) throw Error('Los hombres que cumplen la condición (' + nHL + ') no pueden ser más que los hombres (' + nH + ').');
        var tot = nM + nH;
        if (tot < 2) throw Error('Hacen falta al menos 2 personas para elegir una al azar.');
        var nL = nML + nHL;

        var tab = contingencia({
          cols: [cond.charAt(0).toUpperCase() + cond.slice(1) + ' (B)', 'No (B\u2032)'],
          filas: [
            { lab: 'Mujer (A)', celdas: [nML, nM - nML] },
            { lab: 'Hombre (A\u2032)', celdas: [nHL, nH - nHL] }
          ],
          capC: 'Condición', capF: 'Sexo',
          resalta: [{ f: 0, c: 0 }],
          cap: 'La celda resaltada es ' + K('n(A \\cap B) = ' + nML) +
               ': el número de casos que cumplen las <b>dos</b> cosas a la vez.'
        });

        var pA = frac(nM, tot);
        var pBA = razon(nML, nM, 'las mujeres');
        var pAB = fProd(pA, pBA);
        var directa = frac(nML, tot);
        var pB = frac(nL, tot);
        var pAdB = razon(nML, nL, 'quienes cumplen la condición');

        var arb = arbol({ lab: '', hijos: [
          { lab: 'M', p: pA, color: COL.morado, hijos: [
            { lab: 'B', p: pBA, color: COL.verde, camino: 'mujer y ' + cond },
            { lab: 'B\u2032', p: fResta(UNO, pBA), color: COL.gris, camino: 'mujer y no' }
          ] },
          { lab: 'H', p: fResta(UNO, pA), color: COL.azul, hijos: [
            { lab: 'B', p: razon(nHL, nH, 'los hombres'), color: COL.verde, camino: 'hombre y ' + cond },
            { lab: 'B\u2032', p: fResta(UNO, razon(nHL, nH, 'los hombres')), color: COL.gris, camino: 'hombre y no' }
          ] }
        ] }, {
          cap: 'La primera rama es ' + K('P(A) = ' + fracTex(pA)) + ' y la segunda, ya condicionada, ' +
               K('P(B \\mid A) = ' + fracTex(pBA)) + '. Su producto es la hoja de arriba.',
          label: 'Árbol de la biblioteca', pasoY: 70
        });

        var coincide = fIgual(pAB, directa);

        return tab + arb +
          resultado(fracTxt(pAB) + '  =  ' + nc(fVal(pAB), 4) + '  =  ' + pct(fVal(pAB), 2),
            'P(mujer y ' + esc(cond) + ')') +
          '<div class="ap-grid2">' +
          tarjeta('Camino 1: regla del producto',
            KD('P(A \\cap B) = P(A) \\cdot P(B \\mid A) = \\frac{' + nM + '}{' + tot + '} \\cdot \\frac{' +
               nML + '}{' + nM + '} = ' + fracFull(pAB)) +
            '<p>Se simplifica el ' + nM + ' y queda directamente ' + fracTxt(pAB) + '.</p>', 'ap-card-ok') +
          tarjeta('Camino 2: contar la celda',
            KD('P(A \\cap B) = \\frac{n(A \\cap B)}{n(E)} = \\frac{' + nML + '}{' + tot + '} = ' + fracFull(directa)) +
            '<p>Los ' + nML + ' casos de la celda entre las ' + tot + ' personas.</p>', 'ap-card-ok') +
          '</div>' +
          (coincide
            ? bien('<b>Los dos caminos coinciden.</b> Y eso no es casualidad: la regla del producto no es más ' +
                   'que la definición de condicionada despejada, así que siempre lleva al mismo sitio que contar.')
            : mal('Algo falla en los recuentos: revisa los datos.')) +
          kvs([
            ['P(A), ser mujer', fracTxt(pA) + ' = ' + nc(fVal(pA), 4)],
            ['P(B | A), cumplir la condición siendo mujer', fracTxt(pBA) + ' = ' + nc(fVal(pBA), 4)],
            ['P(A \u2229 B)', fracTxt(pAB) + ' = ' + nc(fVal(pAB), 4)],
            ['P(B), cumplir la condición', fracTxt(pB) + ' = ' + nc(fVal(pB), 4)],
            ['P(A | B), ser mujer cumpliendo la condición', fracTxt(pAdB) + ' = ' + nc(fVal(pAdB), 4)]
          ]) +
          nota('<b>Cuándo conviene cada camino.</b> Si el enunciado da una tabla completa, contar la celda es ' +
               'inmediato. Si el enunciado da probabilidades por etapas (primero el grupo, después la condición ' +
               'dentro del grupo), la regla del producto es el único camino: no hay celdas que contar.') +
          aviso('<b>Y y O no son lo mismo.</b> Aquí se pide «mujer <b>y</b> ' + esc(cond) + '», que es una ' +
                'intersección y se resuelve multiplicando. Si el enunciado pidiera «mujer <b>o</b> ' + esc(cond) +
                '» habría que sumar y restar la intersección: ' + K('P(A \\cup B) = ' +
                fracTex(fResta(fSuma(pA, pB), directa)) + ' = ' + S.kf(fVal(fResta(fSuma(pA, pB), directa)), 4)) + '.');
      });
  };

  /* ==================================================================
     9) independencia — con devolución y sin devolución (4.8.5.1)
     ================================================================== */
  R.independencia = function (node) {
    shell(node,
      'Con devolución y sin devolución',
      'La independencia no es una opinión: se comprueba. Se extraen dos elementos de un conjunto de ' +
      '$N$ objetos de los cuales $F$ son favorables. Escribe enteros, por ejemplo <code>40</code> y ' +
      '<code>12</code> (las 12 figuras de una baraja de 40 cartas), y marca o desmarca la devolución. ' +
      'El applet compara $P(A_2 \\mid A_1)$ con $P(A_2)$ y dictamina.',
      [
        { id: 'N', label: 'Número total de objetos (N)', type: 'number', min: 2, max: 500, value: 40 },
        { id: 'F', label: 'Objetos favorables (F)', type: 'number', min: 0, max: 500, value: 12 },
        { id: 'dev', label: 'Con devolución', type: 'check', value: true },
        { id: 'nom', label: 'Nombre del suceso favorable', type: 'text', value: 'figura' },
        { type: 'presets', list: [
          { label: 'Dos figuras con devolución',
            title: 'Baraja de 40, 12 figuras: 0,3 · 0,3 = 0,09',
            apply: function (c) { c.N.value = 40; c.F.value = 12; c.dev.checked = true; c.nom.value = 'figura'; } },
          { label: 'Dos copas con devolución',
            title: 'Baraja de 40, 10 copas: 0,25 · 0,25 = 0,0625',
            apply: function (c) { c.N.value = 40; c.F.value = 10; c.dev.checked = true; c.nom.value = 'copas'; } },
          { label: 'Dos figuras sin devolución',
            title: 'Ahora las etapas son dependientes',
            apply: function (c) { c.N.value = 40; c.F.value = 12; c.dev.checked = false; c.nom.value = 'figura'; } },
          { label: 'Urna: 2 blancas y 2 azules, sin devolución',
            apply: function (c) { c.N.value = 4; c.F.value = 2; c.dev.checked = false; c.nom.value = 'blanca'; } },
          { label: 'Urna: 4 rojas y 6 azules, sin devolución',
            apply: function (c) { c.N.value = 10; c.F.value = 4; c.dev.checked = false; c.nom.value = 'roja'; } },
          { label: 'Dos lanzamientos de una moneda',
            title: 'Siempre independientes: la moneda no tiene memoria',
            apply: function (c) { c.N.value = 2; c.F.value = 1; c.dev.checked = true; c.nom.value = 'cara'; } }
        ] }
      ],
      function (v) {
        var N = entero(v.N, 2, 500, 'El número total de objetos');
        var F = entero(v.F, 0, 500, 'El número de objetos favorables');
        var dev = v.dev === true || v.dev === 'true';
        var nom = String(v.nom || 'favorable').trim() || 'favorable';
        if (F > N) throw Error('Los favorables (' + F + ') no pueden ser más que el total (' + N + ').');
        if (!dev && N < 2) throw Error('Sin devolución hacen falta al menos 2 objetos para hacer dos extracciones.');

        var p1 = frac(F, N);
        var p2si = dev ? frac(F, N) : (F >= 1 ? frac(F - 1, N - 1) : frac(0, N - 1));
        var p2no = dev ? frac(F, N) : frac(F, N - 1);
        var pAmbas = fProd(p1, p2si);
        var pIndep = fProd(p1, p1);
        var p2marginal = fSuma(fProd(p1, p2si), fProd(fResta(UNO, p1), p2no));

        var arb = arbol({ lab: '', hijos: [
          { lab: 'F', p: p1, color: COL.azul, hijos: [
            { lab: 'F', p: p2si, color: COL.azulOsc, camino: 'las dos ' + nom },
            { lab: 'F\u2032', p: fResta(UNO, p2si), color: COL.gris, camino: 'primera sí, segunda no' }
          ] },
          { lab: 'F\u2032', p: fResta(UNO, p1), color: COL.rojo, hijos: [
            { lab: 'F', p: p2no, color: COL.naranja, camino: 'primera no, segunda sí' },
            { lab: 'F\u2032', p: fResta(UNO, p2no), color: COL.gris, camino: 'ninguna de las dos' }
          ] }
        ] }, {
          cap: dev
            ? 'Con devolución los denominadores de la segunda etapa siguen siendo ' + N +
              ': la composición no ha cambiado y las dos ramas de la segunda etapa son iguales.'
            : 'Sin devolución los denominadores de la segunda etapa son ' + (N - 1) +
              ' y los numeradores cambian según lo que haya salido antes: ahí está la dependencia.',
          label: 'Árbol de las dos extracciones', pasoY: 68
        });

        var iguales = fIgual(p2si, p1);

        var comp = barras({
          items: [
            { lab: 'P(A\u2082)', valor: fVal(p2marginal), txt: fracTxt(p2marginal) + ' = ' + nc(fVal(p2marginal), 4),
              color: COL.azul, nota: 'segunda extracción, sin saber la primera' },
            { lab: 'P(A\u2082 | A\u2081)', valor: fVal(p2si), txt: fracTxt(p2si) + ' = ' + nc(fVal(p2si), 4),
              color: COL.verde, nota: 'sabiendo que la primera fue ' + nom },
            { lab: 'P(A\u2082 | A\u2081\u2032)', valor: fVal(p2no), txt: fracTxt(p2no) + ' = ' + nc(fVal(p2no), 4),
              color: COL.rojo, nota: 'sabiendo que la primera no lo fue' }
          ],
          max: 1,
          cap: iguales
            ? 'Las tres barras miden lo mismo: la primera extracción no aporta información.'
            : 'Las barras son distintas: la primera extracción sí informa sobre la segunda.'
        });

        return arb + comp +
          resultado(fracTxt(pAmbas) + '  =  ' + nc(fVal(pAmbas), 4) + '  =  ' + pct(fVal(pAmbas), 2),
            'P(las dos ' + esc(nom) + ')') +
          '<div class="mx-info"><b>Cálculo del camino favorable.</b>' +
          KD('P(A_1 \\cap A_2) = P(A_1) \\cdot P(A_2 \\mid A_1) = ' + fracTex(p1) + ' \\cdot ' + fracTex(p2si) +
             ' = ' + fracFull(pAmbas)) +
          (dev
            ? 'Como ' + K('P(A_2 \\mid A_1) = P(A_2) = ' + fracTex(p1)) + ', el producto se puede escribir ' +
              'directamente como ' + K('P(A_1) \\cdot P(A_2)') + '.'
            : 'Aquí <b>no</b> se puede sustituir la condicionada por ' + K('P(A_2)') + ': si lo hicieras ' +
              'obtendrías ' + K(fracTex(pIndep) + ' = ' + S.kf(fVal(pIndep), 4)) + ' en lugar de ' +
              K(S.kf(fVal(pAmbas), 4)) + '.') + '</div>' +
          tabla(['Camino', 'Producto', 'Probabilidad', 'Decimal'], [
            { celdas: ['Las dos ' + esc(nom), K(fracTex(p1) + ' \\cdot ' + fracTex(p2si)), K(fracTex(pAmbas)),
              nc(fVal(pAmbas), 4)], clase: 'ap-hi' },
            ['Primera sí, segunda no', K(fracTex(p1) + ' \\cdot ' + fracTex(fResta(UNO, p2si))),
              K(fracTex(fProd(p1, fResta(UNO, p2si)))), nc(fVal(fProd(p1, fResta(UNO, p2si))), 4)],
            ['Primera no, segunda sí', K(fracTex(fResta(UNO, p1)) + ' \\cdot ' + fracTex(p2no)),
              K(fracTex(fProd(fResta(UNO, p1), p2no))), nc(fVal(fProd(fResta(UNO, p1), p2no)), 4)],
            ['Ninguna', K(fracTex(fResta(UNO, p1)) + ' \\cdot ' + fracTex(fResta(UNO, p2no))),
              K(fracTex(fProd(fResta(UNO, p1), fResta(UNO, p2no)))),
              nc(fVal(fProd(fResta(UNO, p1), fResta(UNO, p2no))), 4)]
          ]) +
          (iguales
            ? bien('<b>Independientes</b> ' + insignia('independientes', 'si') + '. ' +
                   K('P(A_2 \\mid A_1) = P(A_2) = ' + fracTex(p1)) +
                   ': el resultado de la primera extracción no cambia la probabilidad de la segunda.')
            : mal('<b>Dependientes</b> ' + insignia('dependientes', 'no') + '. ' +
                  K('P(A_2 \\mid A_1) = ' + fracTex(p2si)) + ' pero ' +
                  K('P(A_2) = ' + fracTex(p2marginal)) +
                  ': la información de la primera extracción sí cambia la probabilidad de la segunda.')) +
          nota('<b>Un detalle sorprendente y muy útil.</b> Aunque las etapas sean dependientes, la probabilidad ' +
               'de la <b>segunda</b> extracción sin condicionar vale ' + K(fracTex(p2marginal)) +
               ', exactamente lo mismo que la de la primera. Lo que cambia con la devolución no es la ' +
               'probabilidad marginal, sino la <b>relación</b> entre las dos extracciones.') +
          aviso('<b>Cómo decidir en un examen.</b> Con devolución (o con lanzamientos repetidos), independientes. ' +
                'Sin devolución, dependientes. Y si el enunciado da una tabla, la única prueba válida es ' +
                'comprobar si ' + K('P(A \\cap B) = P(A) \\cdot P(B)') + '.');
      });
  };

  /* ==================================================================
     10) testIndependencia — el test de las tres condiciones (4.8.5.2)
     ================================================================== */
  R.testIndependencia = function (node) {
    shell(node,
      'El test de las tres condiciones equivalentes',
      'Dos sucesos son independientes si se cumple <b>una</b> de estas tres condiciones, y entonces se cumplen ' +
      'las tres: $P(A \\cap B) = P(A)P(B)$, $P(B \\mid A) = P(B)$, $P(A \\mid B) = P(A)$. ' + FORMATO_P + ' ' +
      'Escribe por ejemplo <code>0,525</code>, <code>0,295</code> y <code>0,105</code> y comprueba las tres ' +
      'a la vez: o pasan todas o no pasa ninguna.',
      [
        { id: 'pA', label: 'P(A)', type: 'text', value: '0,525' },
        { id: 'pB', label: 'P(B)', type: 'text', value: '0,295' },
        { id: 'pAB', label: 'P(A \u2229 B)', type: 'text', value: '0,105' },
        { type: 'presets', list: [
          { label: 'Hospital: niño y ojos azules',
            title: 'Dependientes: 0,525 · 0,295 = 0,1549 ≠ 0,105',
            apply: function (c) { c.pA.value = '0,525'; c.pB.value = '0,295'; c.pAB.value = '0,105'; } },
          { label: 'Clase de 22: baloncesto y fútbol',
            apply: function (c) { c.pA.value = '7/22'; c.pB.value = '12/22'; c.pAB.value = '6/22'; } },
          { label: 'Caja de 16 bolas: roja y numerada con 1',
            title: 'Independientes: 6/16 · 8/16 = 3/16',
            apply: function (c) { c.pA.value = '6/16'; c.pB.value = '8/16'; c.pAB.value = '3/16'; } },
          { label: 'Dado: A = menor que 5, B = par',
            title: 'Independientes: 2/3 · 1/2 = 1/3',
            apply: function (c) { c.pA.value = '4/6'; c.pB.value = '3/6'; c.pAB.value = '2/6'; } },
          { label: 'Dos figuras con devolución',
            apply: function (c) { c.pA.value = '0,3'; c.pB.value = '0,3'; c.pAB.value = '0,09'; } },
          { label: 'Incompatibles: la intersección es vacía',
            apply: function (c) { c.pA.value = '0,5'; c.pB.value = '0,5'; c.pAB.value = '0'; } }
        ] }
      ],
      function (v) {
        var pA = leeP(v.pA, 'P(A)');
        var pB = leeP(v.pB, 'P(B)');
        var pAB = leeP(v.pAB, 'P(A \u2229 B)');
        if (fVal(pAB) > fVal(pA) + 1e-12 || fVal(pAB) > fVal(pB) + 1e-12)
          throw Error('La intersección no puede superar a ninguno de los dos sucesos: hace falta ' +
                      'P(A \u2229 B) \u2264 P(A) y P(A \u2229 B) \u2264 P(B).');
        if (fVal(fResta(fSuma(pA, pB), pAB)) > 1 + 1e-12)
          throw Error('Estos tres datos son imposibles: P(A \u222A B) = P(A) + P(B) \u2212 P(A \u2229 B) saldría ' +
                      'mayor que 1. Baja P(A) o P(B), o sube la intersección.');
        var prod = fProd(pA, pB);
        var c1 = fIgual(pAB, prod);
        var pBA = fIgual(pA, CERO) ? null : fDiv(pAB, pA);
        var pAB2 = fIgual(pB, CERO) ? null : fDiv(pAB, pB);
        var c2 = pBA ? fIgual(pBA, pB) : null;
        var c3 = pAB2 ? fIgual(pAB2, pA) : null;

        function ficha(tit, texi, izq, der, ok) {
          return tarjeta(tit,
            KD(texi) +
            kvs([['Miembro izquierdo', izq], ['Miembro derecho', der]]) +
            (ok === null
              ? aviso('No se puede comprobar: el denominador sería 0.')
              : (ok ? bien('Se cumple ' + insignia('sí', 'si')) : mal('No se cumple ' + insignia('no', 'no')))),
            ok === null ? 'ap-card-avi' : (ok ? 'ap-card-ok' : 'ap-card-ko'));
        }

        var todas = (c1 ? 1 : 0) + (c2 === true ? 1 : 0) + (c3 === true ? 1 : 0);
        var definidas = 1 + (c2 === null ? 0 : 1) + (c3 === null ? 0 : 1);

        var fig = venn({
          n: 2, pinta: ['ab'], color: c1 ? COL.verdeClaro : COL.rojoClaro,
          cap: c1
            ? 'La intersección tiene <b>exactamente</b> el tamaño que le corresponde por azar: ' +
              'el producto de las dos probabilidades.'
            : 'La intersección es ' + (fVal(pAB) > fVal(prod) ? 'mayor' : 'menor') +
              ' de lo que le correspondería por azar, y esa desviación es la dependencia.',
          label: 'Diagrama de Venn del test de independencia'
        });

        return fig +
          tabla(['Cantidad', 'Valor', 'Decimal'], [
            [K('P(A)'), K(fracTex(pA)), nc(fVal(pA), 4)],
            [K('P(B)'), K(fracTex(pB)), nc(fVal(pB), 4)],
            [K('P(A) \\cdot P(B)'), K(fracTex(prod)), nc(fVal(prod), 6)],
            { celdas: [K('P(A \\cap B)'), K(fracTex(pAB)), nc(fVal(pAB), 6)], clase: 'ap-hi' }
          ]) +
          '<div class="ap-grid3">' +
          ficha('Condición 1', 'P(A \\cap B) = P(A) \\cdot P(B)',
            fracTxt(pAB) + ' = ' + nc(fVal(pAB), 6), fracTxt(prod) + ' = ' + nc(fVal(prod), 6), c1) +
          ficha('Condición 2', 'P(B \\mid A) = P(B)',
            pBA ? fracTxt(pBA) + ' = ' + nc(fVal(pBA), 6) : 'no definida',
            fracTxt(pB) + ' = ' + nc(fVal(pB), 6), c2) +
          ficha('Condición 3', 'P(A \\mid B) = P(A)',
            pAB2 ? fracTxt(pAB2) + ' = ' + nc(fVal(pAB2), 6) : 'no definida',
            fracTxt(pA) + ' = ' + nc(fVal(pA), 6), c3) +
          '</div>' +
          resultado(c1 ? 'INDEPENDIENTES' : 'DEPENDIENTES',
            'Veredicto: ' + todas + ' de ' + definidas + ' condiciones comprobables se cumplen') +
          (c1
            ? bien('<b>Las tres condiciones son equivalentes.</b> Comprobada una, las demás se deducen: ' +
                   'basta dividir la primera entre ' + K('P(A)') + ' o entre ' + K('P(B)') + '. ' +
                   'Por eso en un examen se comprueba <b>solo la primera</b>, que no necesita denominadores.')
            : mal('<b>Dependientes.</b> Y si falla una condición, fallan las tres: son equivalentes. ' +
                  'La diferencia ' + K('P(A \\cap B) - P(A)P(B) = ' + S.kf(fVal(pAB) - fVal(prod), 6)) +
                  ' mide cuánta información aporta un suceso sobre el otro.')) +
          (fIgual(pAB, CERO) && !fIgual(pA, CERO) && !fIgual(pB, CERO)
            ? aviso('<b>Caso especial importantísimo.</b> Aquí los sucesos son <b>incompatibles</b> y ninguno es ' +
                    'imposible. Entonces ' + K('P(A \\cap B) = 0') + ' pero ' + K('P(A)P(B) > 0') + ': ' +
                    'dos sucesos incompatibles de probabilidad no nula son <b>siempre dependientes</b>.')
            : '') +
          nota('<b>Independencia frente a incompatibilidad.</b> La incompatibilidad se ve en el diagrama de Venn ' +
               '(los círculos no se tocan). La independencia <b>no se ve</b>: depende de los tamaños, no de la ' +
               'forma. Son ideas distintas y casi opuestas.');
      });
  };

  /* ==================================================================
     11) incompatibleVsIndependiente — dos ideas que se confunden (4.8.5.4)
     ================================================================== */
  R.incompatibleVsIndependiente = function (node) {
    shell(node,
      'Incompatible no es independiente',
      'Son las dos palabras que más se confunden del tema. <b>Incompatibles</b> significa que no pueden ' +
      'ocurrir a la vez: $A \\cap B = \\varnothing$. <b>Independientes</b> significa que uno no informa del ' +
      'otro: $P(A \\cap B) = P(A) \\cdot P(B)$. ' + FORMATO_SET + ' ' +
      'Escribe por ejemplo $E =$ <code>1 2 3 4 5 6</code>, $A =$ <code>1 3 5</code> y $B =$ <code>2 4 6</code>: ' +
      'verás que son incompatibles y, precisamente por eso, dependientes.',
      [
        { id: 'E', label: 'Espacio muestral E', type: 'text', value: '1 2 3 4 5 6' },
        { id: 'A', label: 'Suceso A', type: 'text', value: '1 3 5' },
        { id: 'B', label: 'Suceso B', type: 'text', value: '2 4 6' },
        { type: 'presets', list: [
          { label: 'Dado: impar y par',
            title: 'Incompatibles y dependientes',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '1 3 5'; c.B.value = '2 4 6'; } },
          { label: 'Dado: menor que 5 y par',
            title: 'Compatibles e independientes',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '1 2 3 4'; c.B.value = '2 4 6'; } },
          { label: 'Dado: par y mayor que 3',
            title: 'Compatibles y dependientes',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '2 4 6'; c.B.value = '4 5 6'; } },
          { label: 'Dos monedas: primera cara y las dos iguales',
            apply: function (c) { c.E.value = 'CC CX XC XX'; c.A.value = 'CC CX'; c.B.value = 'CC XX'; } },
          { label: 'Sucesos incompatibles pequeños',
            apply: function (c) { c.E.value = '1 2 3 4'; c.A.value = '1'; c.B.value = '2 3'; } },
          { label: 'Uno contenido en el otro',
            apply: function (c) { c.E.value = '1 2 3 4 5 6'; c.A.value = '2 4 6'; c.B.value = '2'; } }
        ] }
      ],
      function (v) {
        var E = leeE(v.E);
        var A = leeSub(v.A, E, 'el suceso A');
        var B = leeSub(v.B, E, 'el suceso B');
        var In = ordena(I(A, B), E);
        var pA = pLap(A, E), pB = pLap(B, E), pIn = pLap(In, E);
        var prod = fProd(pA, pB);
        var inc = incompatibles(A, B);
        var ind = fIgual(pIn, prod);

        var fig = venn({
          n: 2, pinta: inc ? ['a', 'b'] : ['ab'],
          color: inc ? COL.azulClaro : COL.moradoClaro,
          A: A, B: B, E: E.length <= 12 ? E : null,
          cap: inc
            ? 'Los dos sucesos no comparten ningún resultado: ' + K('A \\cap B = \\varnothing') + '. ' +
              'La incompatibilidad <b>sí</b> se ve en el diagrama.'
            : 'Los dos sucesos comparten ' + In.length + ' resultado(s). La independencia, en cambio, ' +
              'no se ve en el dibujo: hay que calcular.',
          label: 'Diagrama de Venn de los dos sucesos'
        });

        var cuadro = tabla(['Concepto', '¿Se cumple?', 'Comprobación'], [
          { celdas: ['Incompatibles', inc ? insignia('sí', 'si') : insignia('no', 'no'),
            K('A \\cap B = ' + (In.length ? setTex(In, E) : '\\varnothing') + ', \\; P(A \\cap B) = ' + fracTex(pIn))],
            clase: inc ? 'ap-hi' : '' },
          { celdas: ['Independientes', ind ? insignia('sí', 'si') : insignia('no', 'no'),
            K('P(A) \\cdot P(B) = ' + fracTex(pA) + ' \\cdot ' + fracTex(pB) + ' = ' + fracTex(prod) +
              (ind ? ' = ' : ' \\ne ') + fracTex(pIn) + ' = P(A \\cap B)')],
            clase: ind ? 'ap-hi' : '' }
        ]);

        var cuatro =
          '<div class="ap-grid2">' +
          tarjeta('Incompatibles y dependientes',
            '<p>El caso del dado: ' + K('A = \\{1,3,5\\}') + ' y ' + K('B = \\{2,4,6\\}') + '. ' +
            K('P(A)P(B) = 0{,}25') + ' pero ' + K('P(A \\cap B) = 0') + '.</p>' +
            '<p>Saber que ha salido impar informa muchísimo sobre «par»: la vuelve imposible.</p>',
            (inc && !ind) ? 'ap-card-ok' : '') +
          tarjeta('Compatibles e independientes',
            '<p>El caso ' + K('A = \\{1,2,3,4\\}') + ' y ' + K('B = \\{2,4,6\\}') + ': ' +
            K('\\frac{2}{3} \\cdot \\frac{1}{2} = \\frac{1}{3} = P(A \\cap B)') + '.</p>' +
            '<p>Se cortan, y aun así ninguno informa del otro.</p>',
            (!inc && ind) ? 'ap-card-ok' : '') +
          '</div>' +
          '<div class="ap-grid2">' +
          tarjeta('Compatibles y dependientes',
            '<p>El caso más frecuente en los problemas: ' + K('A = \\{2,4,6\\}') + ' y ' + K('B = \\{4,5,6\\}') + '.</p>' +
            '<p>Se cortan y además uno informa del otro.</p>',
            (!inc && !ind) ? 'ap-card-ok' : '') +
          tarjeta('Incompatibles e independientes',
            '<p>Solo es posible si alguno de los dos sucesos tiene probabilidad <b>cero</b>. ' +
            'Con sucesos de probabilidad no nula, esta casilla está <b>vacía</b>.</p>',
            (inc && ind) ? 'ap-card-avi' : '') +
          '</div>';

        var veredicto = inc
          ? (ind
            ? aviso('Son incompatibles y, formalmente, independientes: eso solo puede pasar porque alguno de los ' +
                    'dos sucesos tiene probabilidad 0. Es un caso degenerado sin interés práctico.')
            : mal('<b>Incompatibles pero dependientes.</b> Y no es casualidad: si ' + K('P(A) > 0') + ', ' +
                  K('P(B) > 0') + ' y ' + K('P(A \\cap B) = 0') + ', entonces ' +
                  K('P(A)P(B) > 0 = P(A \\cap B)') + ', así que la independencia es <b>imposible</b>. ' +
                  'Dos sucesos incompatibles de probabilidad no nula son siempre dependientes.'))
          : (ind
            ? bien('<b>Compatibles e independientes.</b> Se cortan (comparten ' + In.length + ' resultado(s)) ' +
                   'y aun así ' + K('P(B \\mid A) = P(B)') + ': la intersección tiene justo el tamaño que le ' +
                   'corresponde por azar.')
            : nota('<b>Compatibles y dependientes.</b> Es el caso más habitual en los problemas del tema: ' +
                   'los sucesos se cortan y además uno informa del otro.'));

        return fig + cuadro +
          resultado((inc ? 'Incompatibles' : 'Compatibles') + '  ·  ' + (ind ? 'Independientes' : 'Dependientes'),
            'Doble veredicto') +
          cuatro + veredicto +
          '<div class="mx-info"><b>La demostración que conviene recordar.</b>' +
          pasos([
            'Supongamos ' + K('A \\cap B = \\varnothing') + ' con ' + K('P(A) > 0') + ' y ' + K('P(B) > 0') + '.',
            'Entonces ' + K('P(A \\cap B) = 0') + ' pero ' + K('P(A) \\cdot P(B) > 0') + '.',
            'Los dos números no pueden ser iguales, así que la condición de independencia falla: ' +
              'los sucesos son <b>dependientes</b>.'
          ]) + '</div>' +
          aviso('<b>Un truco de vocabulario.</b> «Incompatible» habla de <b>coexistencia</b> (¿pueden pasar a la ' +
                'vez?) y se resuelve mirando el dibujo. «Independiente» habla de <b>información</b> ' +
                '(¿saber uno cambia el otro?) y se resuelve calculando.');
      });
  };

  /* ==================================================================
     12) asimetria — P(A|B) no es P(B|A) (4.8.6.1)
     ================================================================== */
  R.asimetria = function (node) {
    shell(node,
      'La asimetría de la condicionada',
      'Las dos condicionadas de una pareja de sucesos comparten numerador y se diferencian solo en el ' +
      'denominador, así que en general <b>no coinciden</b>. Mueve los dos deslizadores de tamaño de grupo ' +
      'y el porcentaje del rasgo en cada grupo, por ejemplo <code>105</code> y <code>95</code> personas con ' +
      '<code>20</code>% y <code>40</code>%, y observa cómo se separan $P(A \\mid B)$ y $P(B \\mid A)$.',
      [
        { id: 'n1', label: 'Tamaño del grupo A', type: 'range', min: 10, max: 400, step: 5, value: 105 },
        { id: 'n2', label: 'Tamaño del grupo A\u2032', type: 'range', min: 10, max: 400, step: 5, value: 95 },
        { id: 'r1', label: 'Rasgo B en el grupo A (%)', type: 'range', min: 0, max: 100, step: 1, value: 20 },
        { id: 'r2', label: 'Rasgo B en el grupo A\u2032 (%)', type: 'range', min: 0, max: 100, step: 1, value: 40 },
        { type: 'presets', list: [
          { label: 'Hospital: niños y niñas de ojos azules',
            title: '105 niños al 20 % y 95 niñas al 40 %',
            apply: function (c) { c.n1.value = 105; c.n2.value = 95; c.r1.value = 20; c.r2.value = 40; } },
          { label: 'Grupos muy desiguales',
            title: 'Un grupo grande con poco rasgo domina la columna',
            apply: function (c) { c.n1.value = 400; c.n2.value = 20; c.r1.value = 10; c.r2.value = 90; } },
          { label: 'Prueba médica: rasgo raro',
            apply: function (c) { c.n1.value = 10; c.n2.value = 400; c.r1.value = 99; c.r2.value = 5; } },
          { label: 'Mismo porcentaje en los dos grupos',
            title: 'Independencia: las condicionadas del rasgo coinciden',
            apply: function (c) { c.n1.value = 200; c.n2.value = 100; c.r1.value = 30; c.r2.value = 30; } },
          { label: 'Grupos iguales: las dos condicionadas coinciden',
            apply: function (c) { c.n1.value = 100; c.n2.value = 100; c.r1.value = 40; c.r2.value = 40; } }
        ] }
      ],
      function (v) {
        var n1 = entero(v.n1, 1, 400, 'El tamaño del grupo A');
        var n2 = entero(v.n2, 1, 400, 'El tamaño del grupo A\u2032');
        var r1 = numero(v.r1, 0, 100, 'El porcentaje del rasgo en A');
        var r2 = numero(v.r2, 0, 100, 'El porcentaje del rasgo en A\u2032');
        var b1 = Math.round(n1 * r1 / 100), b2 = Math.round(n2 * r2 / 100);
        var tot = n1 + n2, colB = b1 + b2;
        if (colB === 0)
          throw Error('Con el rasgo al 0 % en los dos grupos no hay nadie que lo tenga, y no se puede ' +
                      'condicionar a B. Sube alguno de los dos porcentajes.');

        var tab = contingencia({
          cols: ['Rasgo B', 'Sin rasgo'],
          filas: [
            { lab: 'Grupo A', celdas: [b1, n1 - b1] },
            { lab: 'Grupo A\u2032', celdas: [b2, n2 - b2] }
          ],
          capC: 'Rasgo', capF: 'Grupo',
          resalta: [{ f: 0, c: 0 }],
          cap: 'La celda común vale ' + b1 + '. Para ' + K('P(B \\mid A)') + ' se divide entre el total de la ' +
               'fila (' + n1 + '); para ' + K('P(A \\mid B)') + ', entre el total de la columna (' + colB + ').'
        });

        var pBA = razon(b1, n1, 'el grupo A');
        var pAB = razon(b1, colB, 'el rasgo B');
        var pA = frac(n1, tot), pB = frac(colB, tot);

        var comp = barras({
          items: [
            { lab: 'P(B | A)', valor: fVal(pBA), txt: fracTxt(pBA) + ' = ' + pct(fVal(pBA), 1), color: COL.verde,
              nota: 'del grupo A, cuántos tienen el rasgo: ' + b1 + ' de ' + n1 },
            { lab: 'P(A | B)', valor: fVal(pAB), txt: fracTxt(pAB) + ' = ' + pct(fVal(pAB), 1), color: COL.naranja,
              nota: 'de los que tienen el rasgo, cuántos son de A: ' + b1 + ' de ' + colB }
          ],
          max: 1,
          cap: 'Dos preguntas distintas sobre la misma celda. Solo coinciden si los totales de fila y de ' +
               'columna son iguales.'
        });

        var dif = Math.abs(fVal(pBA) - fVal(pAB));

        return tab + comp +
          '<div class="ap-grid2">' +
          tarjeta('P(B | A)', KD('\\frac{' + b1 + '}{' + n1 + '} = ' + fracFull(pBA)) +
            '<p>Universo: el grupo A.</p>', 'ap-card-ok') +
          tarjeta('P(A | B)', KD('\\frac{' + b1 + '}{' + colB + '} = ' + fracFull(pAB)) +
            '<p>Universo: quienes tienen el rasgo.</p>', 'ap-card-avi') +
          '</div>' +
          resultado(pct(fVal(pBA), 1) + '   frente a   ' + pct(fVal(pAB), 1),
            'P(B | A) y P(A | B): misma celda, universos distintos') +
          '<div class="mx-info"><b>La relación exacta entre las dos.</b> De ' +
          K('P(A \\cap B) = P(A)P(B \\mid A) = P(B)P(A \\mid B)') + ' se despeja' +
          KD('P(A \\mid B) = P(B \\mid A) \\cdot \\frac{P(A)}{P(B)} = ' + S.kf(fVal(pBA), 4) +
             ' \\cdot \\frac{' + S.kf(fVal(pA), 4) + '}{' + S.kf(fVal(pB), 4) + '} = ' + S.kf(fVal(pAB), 4)) +
          'El factor de corrección es el cociente de las probabilidades <b>a priori</b>. ' +
          'Esta igualdad es, literalmente, el teorema de Bayes con dos sucesos.</div>' +
          (dif < 1e-12
            ? bien('Aquí las dos condicionadas coinciden, y eso ocurre exactamente cuando ' + K('P(A) = P(B)') +
                   ', es decir, cuando el total de la fila y el de la columna son iguales. Es la excepción.')
            : nota('Las dos condicionadas se diferencian en ' + nc(100 * dif, 1) + ' puntos porcentuales. ' +
                   'Cuanto más distintos son ' + K('P(A)') + ' y ' + K('P(B)') + ', mayor es la separación.')) +
          aviso('<b>Cómo se dice mal y cómo se dice bien.</b> «El 40 % de los de ojos azules son niñas» y ' +
                '«el 40 % de las niñas tiene ojos azules» son afirmaciones <b>distintas</b>. Antes de calcular, ' +
                'localiza en el enunciado cuál es el conjunto de referencia: ese es el denominador.');
      });
  };

  /* ==================================================================
     13) fiscal — la falacia del fiscal (4.8.6.2)
     ================================================================== */
  R.fiscal = function (node) {
    shell(node,
      'La falacia del fiscal',
      'Un rasgo aparece en 1 de cada millón de personas y coincide con el del sospechoso. ' +
      'El fiscal dice: «la probabilidad de esta coincidencia siendo inocente es de una entre un millón, ' +
      'luego es culpable». Confunde $P(\\text{prueba} \\mid \\text{inocente})$ con ' +
      '$P(\\text{inocente} \\mid \\text{prueba})$. ' +
      'Escribe el tamaño de la población y la frecuencia del rasgo, por ejemplo <code>1000000</code> ' +
      'y <code>1000000</code> (una entre un millón), y compara las dos probabilidades.',
      [
        { id: 'N', label: 'Personas de la población', type: 'number', min: 100, max: 100000000, step: 100, value: 1000000 },
        { id: 'M', label: 'El rasgo aparece en 1 de cada...', type: 'number', min: 2, max: 100000000, step: 1, value: 1000000 },
        { id: 'cul', label: 'Culpables (siempre coinciden)', type: 'number', min: 1, max: 10, value: 1 },
        { type: 'presets', list: [
          { label: 'Rasgo de 1 entre un millón, población de un millón',
            title: 'P(culpable | coincidencia) ≈ 0,5',
            apply: function (c) { c.N.value = 1000000; c.M.value = 1000000; c.cul.value = 1; } },
          { label: 'Ciudad de 100 000 habitantes',
            apply: function (c) { c.N.value = 100000; c.M.value = 1000000; c.cul.value = 1; } },
          { label: 'Rasgo menos raro: 1 entre 10 000',
            apply: function (c) { c.N.value = 1000000; c.M.value = 10000; c.cul.value = 1; } },
          { label: 'Rasgo rarísimo: 1 entre cien millones',
            apply: function (c) { c.N.value = 1000000; c.M.value = 100000000; c.cul.value = 1; } },
          { label: 'Población pequeña: un pueblo de 2 000',
            apply: function (c) { c.N.value = 2000; c.M.value = 1000000; c.cul.value = 1; } }
        ] }
      ],
      function (v) {
        var N = entero(v.N, 100, 100000000, 'El número de personas de la población');
        var M = entero(v.M, 2, 100000000, 'La rareza del rasgo');
        var cul = entero(v.cul, 1, 10, 'El número de culpables');
        if (cul >= N) throw Error('Los culpables tienen que ser muchos menos que la población.');
        var inocentes = N - cul;
        var coincIn = inocentes / M;
        var coincTot = cul + coincIn;
        var pCulpable = coincTot > 0 ? cul / coincTot : 0;
        var pPruebaInocente = 1 / M;

        var tab = tabla(['Grupo', 'Personas', 'Coinciden con el rasgo', 'Comentario'], [
          [K('\\text{Culpable}'), nc(cul, 0), nc(cul, 0), 'coincide con seguridad'],
          [K('\\text{Inocente}'), nc(inocentes, 0), nc(coincIn, 2),
            'una de cada ' + nc(M, 0) + ' coincide por azar'],
          { celdas: ['Total', nc(N, 0), nc(coincTot, 2), 'personas compatibles con la prueba'], clase: 'ap-tot' }
        ]);

        var escP = coincTot > 240 ? 240 / coincTot : 1;
        var celCul = Math.max(1, Math.round(cul * escP));
        var celIn = Math.max(0, Math.round(coincIn * escP));
        var pic = pictograma({
          grupos: [
            { lab: 'Culpable que coincide', n: celCul, color: COL.rojo },
            { lab: 'Inocentes que coinciden por azar', n: celIn, color: COL.azulClaro }
          ],
          cols: 30,
          cap: 'Cada casilla es una persona <b>compatible con la prueba</b>' +
               (escP < 1 ? ' (dibujo a escala: cada casilla representa ' + nc(1 / escP, 1) + ' personas)' : '') +
               '. La pregunta del juicio no es cuántos inocentes hay en el país, sino qué parte de ' +
               '<b>estas</b> casillas es el culpable.'
        });

        var comp = barras({
          items: [
            { lab: 'P(prueba | inocente)', valor: pPruebaInocente,
              txt: '1 / ' + nc(M, 0) + ' = ' + nc(pPruebaInocente, 8), color: COL.azul,
              nota: 'lo que dice el fiscal: parece aplastante' },
            { lab: 'P(culpable | prueba)', valor: pCulpable, txt: nc(pCulpable, 4) + ' = ' + pct(pCulpable, 2),
              color: COL.rojo, nota: 'lo que de verdad importa en el juicio' }
          ],
          max: 1,
          cap: 'Dos números que el discurso del fiscal presenta como si fueran el mismo. No lo son.'
        });

        return tab + pic + comp +
          resultado(pct(pCulpable, 2), 'P(culpable | coincidencia del rasgo)') +
          '<div class="mx-info"><b>Las cuentas.</b>' +
          pasos([
            'Inocentes: ' + nc(inocentes, 0) + '. De ellos coinciden por azar ' +
              K('\\frac{' + nc(inocentes, 0) + '}{' + nc(M, 0) + '} \\approx ' + nc(coincIn, 2)) + ' personas.',
            'Culpables que coinciden: ' + nc(cul, 0) + ' (coinciden con seguridad).',
            'Total de personas compatibles con la prueba: ' + nc(coincTot, 2) + '.',
            'Por tanto ' + K('P(\\text{culpable} \\mid \\text{coincidencia}) = \\frac{' + nc(cul, 0) + '}{' +
              nc(coincTot, 2) + '} \\approx ' + S.kf(pCulpable, 4)) + '.'
          ]) + '</div>' +
          (pCulpable < 0.9
            ? mal('<b>La prueba no basta por sí sola.</b> Es cierto que ' +
                  K('P(\\text{coincidencia} \\mid \\text{inocente}) = ' + S.kf(pPruebaInocente, 8)) +
                  ' es minúscula, pero eso <b>no</b> significa que la probabilidad de inocencia sea minúscula: ' +
                  'aquí ' + K('P(\\text{inocente} \\mid \\text{coincidencia}) = ' + S.kf(1 - pCulpable, 4)) +
                  ' = ' + pct(1 - pCulpable, 2) + '.')
            : bien('Con una población tan pequeña frente a la rareza del rasgo, la prueba sí es muy ' +
                   'concluyente: ' + pct(pCulpable, 2) + '. Prueba a aumentar la población y verás cómo cae.')) +
          nota('<b>Dónde está el truco.</b> Si el rasgo aparece en 1 de cada ' + nc(M, 0) + ' personas y la ' +
               'población tiene ' + nc(N, 0) + ', el número esperado de inocentes que coinciden es ' +
               nc(coincIn, 2) + '. El fiscal calcula sobre <b>una</b> persona; el jurado tiene que calcular ' +
               'sobre <b>todos</b> los que podrían haber coincidido.') +
          aviso('<b>El mismo error, tres disfraces.</b> «Casi nadie da positivo estando sano, luego si has dado ' +
                'positivo estás enfermo»; «casi ningún inocente coincide, luego el que coincide es culpable»; ' +
                '«casi ningún correo legítimo dice gratis, luego el que lo dice es spam». En los tres casos falta ' +
                'la <b>tasa base</b>, y por eso hace falta el teorema de Bayes.');
      });
  };

  /* ==================================================================
     14) sistemaCompleto — qué es un sistema completo de sucesos (4.9.1)
     ================================================================== */
  R.sistemaCompleto = function (node) {
    shell(node,
      'Qué es un sistema completo de sucesos',
      'Un sistema completo (o partición) es una lista de sucesos que <b>agotan</b> todas las posibilidades ' +
      'sin <b>solaparse</b>: incompatibles dos a dos y con unión igual a $E$. La consecuencia inmediata es ' +
      'que sus probabilidades suman 1. ' +
      'Escribe las probabilidades separadas por punto y coma, por ejemplo <code>60%; 25%; 15%</code>, ' +
      'y también valen <code>0,6; 0,25; 0,15</code> o <code>3/5; 1/4; 3/20</code>.',
      [
        { id: 'ps', label: 'Probabilidades de los sucesos', type: 'text', value: '60%; 25%; 15%' },
        { id: 'nombres', label: 'Nombres (opcional, separados por punto y coma)', type: 'text',
          value: 'Factoría 1; Factoría 2; Factoría 3' },
        { type: 'presets', list: [
          { label: 'Tres factorías: 60 %, 25 % y 15 %',
            apply: function (c) { c.ps.value = '60%; 25%; 15%'; c.nombres.value = 'Factoría 1; Factoría 2; Factoría 3'; } },
          { label: 'El sistema mínimo: A y su contrario',
            apply: function (c) { c.ps.value = '0,3; 0,7'; c.nombres.value = 'A; no A'; } },
          { label: 'Tres máquinas: 35 %, 40 % y 25 %',
            apply: function (c) { c.ps.value = '35%; 40%; 25%'; c.nombres.value = 'Máquina A; Máquina B; Máquina C'; } },
          { label: 'Dos urnas elegidas con una moneda',
            apply: function (c) { c.ps.value = '1/2; 1/2'; c.nombres.value = 'Urna verde; Urna roja'; } },
          { label: 'Dado: sale 1 o 2, o no sale',
            apply: function (c) { c.ps.value = '1/3; 2/3'; c.nombres.value = 'Sale 1 o 2; No sale'; } },
          { label: 'Una lista que NO es sistema completo',
            title: 'Las probabilidades no suman 1',
            apply: function (c) { c.ps.value = '0,4; 0,3; 0,2'; c.nombres.value = 'Grupo 1; Grupo 2; Grupo 3'; } }
        ] }
      ],
      function (v) {
        var trozos = String(v.ps == null ? '' : v.ps).split(';');
        var noms = String(v.nombres == null ? '' : v.nombres).split(';');
        var ps = [];
        trozos.forEach(function (t) {
          if (!t.trim()) return;
          ps.push(leeP(t, 'La probabilidad «' + t.trim() + '»'));
        });
        if (ps.length < 2)
          throw Error('Un sistema completo necesita al menos dos sucesos. Escribe algo como 60%; 25%; 15%');
        if (ps.length > 8)
          throw Error('Trabaja con un máximo de 8 sucesos para que la figura siga siendo legible.');
        var suma = sumaF(ps);
        var ok = fIgual(suma, UNO);
        var nombres = ps.map(function (p, i) {
          var n = (noms[i] || '').trim();
          return n || ('A' + (i + 1));
        });

        var items = ps.map(function (p, i) {
          return { lab: nombres[i], valor: fVal(p), txt: fracTxt(p) + ' = ' + pct(fVal(p), 2),
            color: PALETA[i % PALETA.length] };
        });
        var fig = barras({
          items: items, max: 1,
          cap: 'Si los sucesos forman una partición, estas barras encajan exactamente en el 100 % ' +
               'del espacio muestral: ni hueco ni solapamiento.'
        });

        var filas = ps.map(function (p, i) {
          return [esc(nombres[i]), K(fracTex(p)), nc(fVal(p), 4), pct(fVal(p), 2)];
        });
        filas.push({ celdas: ['Suma', K(fracTex(suma)), nc(fVal(suma), 4), pct(fVal(suma), 2)],
          clase: ok ? 'ap-tot' : 'ap-tot ap-mark' });

        var falla = fVal(suma) > 1 ? 'se pasan de 1' : 'no llegan a 1';

        return fig +
          tabla(['Suceso', 'Probabilidad exacta', 'Decimal', 'Porcentaje'], filas) +
          resultado(fracTxt(suma) + '  =  ' + nc(fVal(suma), 4),
            'Suma de las probabilidades ' + (ok ? '(correcto: vale 1)' : '(debería valer 1)')) +
          '<div class="mx-info"><b>Las tres condiciones de la definición.</b>' +
          pasos([
            '<b>Ninguno es imposible</b>: ' + K('P(A_i) > 0') + ' para todo $i$ ' +
              (ps.filter(function (p) { return fIgual(p, CERO); }).length
                ? insignia('hay alguno nulo', 'avi') : insignia('se cumple', 'si')) + '.',
            '<b>Incompatibles dos a dos</b>: ' + K('A_i \\cap A_j = \\varnothing') + ' si ' + K('i \\ne j') +
              '. Esto no se comprueba con números: se lee en el enunciado. ' +
              'Cada pieza fabricada viene de <b>una sola</b> factoría, cada persona pertenece a <b>un solo</b> grupo.',
            '<b>Su unión es todo</b> ' + K('E') + ': no queda ningún caso fuera de la lista.'
          ]) +
          'De las dos últimas se deduce la propiedad que sirve de control: ' +
          KD('P(A_1) + P(A_2) + \\cdots + P(A_n) = P(E) = 1') + '</div>' +
          (ok
            ? bien('<b>Es un sistema completo.</b> Las probabilidades suman exactamente 1, así que la lista ' +
                   'puede usarse como partición en el teorema de la probabilidad total.')
            : mal('<b>No es un sistema completo.</b> Las probabilidades ' + falla + ': suman ' +
                  fracTxt(suma) + ' = ' + nc(fVal(suma), 4) + '. ' +
                  (fVal(suma) < 1
                    ? 'Falta al menos un caso por cubrir; a menudo el que falta es «ninguna de las anteriores», ' +
                      'con probabilidad ' + fracTxt(fResta(UNO, suma)) + '.'
                    : 'Los sucesos se solapan, y entonces los casos comunes se cuentan dos veces.'))) +
          nota('<b>El sistema completo más útil de todos.</b> El más pequeño posible: ' + K('\\{A, A\'\\}') +
               ' con ' + K('P(A) + P(A\') = 1') + '. Casi todos los problemas de probabilidad total con dos ' +
               'ramas (enfermo o sano, defectuoso o correcto, fumador o no fumador) usan justamente este.') +
          aviso('<b>Por qué importa tanto.</b> Sin partición no hay teorema de la probabilidad total ni teorema ' +
                'de Bayes: los dos se demuestran descomponiendo el suceso $B$ en trozos que no se pisan. ' +
                'Antes de aplicar cualquiera de los dos, escribe la partición y comprueba que suma 1.');
      });
  };

  /* ==================================================================
     15) total — el teorema de la probabilidad total (4.9.2 y 4.9.3)
     ================================================================== */
  R.total = function (node) {
    shell(node,
      'El teorema de la probabilidad total',
      'Cuando un suceso $B$ puede llegar por varios caminos incompatibles, su probabilidad es la ' +
      '<b>suma ponderada</b> de lo que aporta cada camino: ' +
      '$P(B) = \\sum_i P(A_i) \\cdot P(B \\mid A_i)$. ' + FORMATO_CAUSAS + ' ' +
      'Cambia el nombre del efecto y añade o quita líneas: el árbol y la tabla se rehacen.',
      [
        { id: 'causas', label: 'Sistema completo de causas', type: 'area', rows: 5,
          value: 'Factoría 1; 60%; 1%\nFactoría 2; 25%; 4%\nFactoría 3; 15%; 2%' },
        { id: 'efecto', label: 'Nombre corto del efecto', type: 'text', value: 'D' },
        { type: 'presets', list: [
          { label: 'Tres factorías y las piezas defectuosas',
            title: 'P(D) = 0,019',
            apply: function (c) {
              c.causas.value = 'Factoría 1; 60%; 1%\nFactoría 2; 25%; 4%\nFactoría 3; 15%; 2%';
              c.efecto.value = 'D';
            } },
          { label: 'Tres máquinas de tornillos',
            title: 'P(defectuoso) = 0,0285',
            apply: function (c) {
              c.causas.value = 'Máquina A; 35%; 3%\nMáquina B; 40%; 2%\nMáquina C; 25%; 4%';
              c.efecto.value = 'D';
            } },
          { label: 'Instituto: ciencias y letras',
            title: 'P(aprueba) = 0,69',
            apply: function (c) {
              c.causas.value = 'Ciencias; 45%; 80%\nLetras; 55%; 60%';
              c.efecto.value = 'A';
            } },
          { label: 'Dos urnas elegidas con una moneda',
            title: 'P(blanca) = 0,70',
            apply: function (c) {
              c.causas.value = 'Urna verde; 1/2; 3/5\nUrna roja; 1/2; 4/5';
              c.efecto.value = 'B';
            } },
          { label: 'Tres proveedores',
            title: 'P(defectuoso) = 0,029',
            apply: function (c) {
              c.causas.value = 'Proveedor 1; 50%; 2%\nProveedor 2; 30%; 3%\nProveedor 3; 20%; 5%';
              c.efecto.value = 'D';
            } },
          { label: 'Fumadores y enfermedad respiratoria',
            title: 'P(enfermedad) = 0,124',
            apply: function (c) {
              c.causas.value = 'Fumador; 30%; 25%\nNo fumador; 70%; 7%';
              c.efecto.value = 'R';
            } }
        ] }
      ],
      function (v) {
        var causas = leeCausas(v.causas);
        var efecto = String(v.efecto || 'B').trim().slice(0, 3) || 'B';
        var ap = aportaciones(causas);

        var arb = arbolCausas(causas, efecto, {
          cap: 'Las ramas del primer nivel son las causas y suman 1. Las del segundo son las condicionadas. ' +
               'Las hojas marcadas con ' + esc(efecto) + ' son las que hay que <b>sumar</b>.'
        });

        var filas = causas.map(function (c, i) {
          return { celdas: [esc(c.lab), K(fracTex(c.prior)), K(fracTex(c.cond)),
            K(fracTex(c.prior) + ' \\cdot ' + fracTex(c.cond) + ' = ' + fracTex(ap.prods[i])),
            nc(fVal(ap.prods[i]), 6), pct(fVal(ap.prods[i]) / (fVal(ap.total) || 1), 1)] };
        });
        filas.push({ celdas: ['Total', K('1'), '\u2014', K(fracTex(ap.total)), nc(fVal(ap.total), 6), '100 %'],
          clase: 'ap-tot' });

        var suma = causas.map(function (c, i) { return fracTex(c.prior) + ' \\cdot ' + fracTex(c.cond); }).join(' + ');

        var bb = barrasBayes({
          causas: causas.map(function (c, i) {
            return { lab: c.lab, prior: c.prior, cond: c.cond, color: PALETA[i % PALETA.length] };
          }),
          efecto: efecto,
          cap: 'Cada barra es la aportación ' + K('P(A_i) \\cdot P(' + efecto + ' \\mid A_i)') +
               '. La suma de todas es ' + K('P(' + efecto + ')') + '.'
        });

        return arb +
          tabla(['Causa', 'A priori', 'Condicionada', 'Aportación', 'Decimal', 'Peso en el total'], filas) +
          bb +
          resultado(fracTxt(ap.total) + '  =  ' + nc(fVal(ap.total), 6) + '  =  ' + pct(fVal(ap.total), 3),
            'P(' + esc(efecto) + '), probabilidad total del efecto') +
          '<div class="mx-info"><b>Aplicación de la fórmula.</b>' +
          KD('P(' + efecto + ') = ' + suma + ' = ' + fracFull(ap.total)) +
          'Se multiplica a lo largo de cada camino (regla del producto) y se suman los caminos ' +
          '(son incompatibles, así que no hay que restar nada).</div>' +
          '<div class="mx-info"><b>Por qué la demostración es tan corta.</b>' +
          pasos([
            'La partición corta ' + K(efecto) + ' en trozos que no se pisan: ' +
              K(efecto + ' = (A_1 \\cap ' + efecto + ') \\cup \\cdots \\cup (A_n \\cap ' + efecto + ')') + '.',
            'Al ser incompatibles, las probabilidades se suman: ' +
              K('P(' + efecto + ') = \\sum_i P(A_i \\cap ' + efecto + ')') + '.',
            'Cada trozo se calcula con la regla del producto: ' +
              K('P(A_i \\cap ' + efecto + ') = P(A_i) \\cdot P(' + efecto + ' \\mid A_i)') + '.'
          ]) + '</div>' +
          controlMedia(causas, ap.total, efecto) +
          nota('<b>Lectura del resultado como media ponderada.</b> ' + K('P(' + efecto + ')') + ' es la media de ' +
               'las condicionadas, pesada por el tamaño de cada causa. Por eso una causa muy mala pero muy ' +
               'pequeña apenas mueve el total, y una causa mediana pero enorme lo domina.') +
          aviso('<b>Antes de aplicar el teorema, dos comprobaciones.</b> Que las causas formen un sistema ' +
                'completo (sus probabilidades suman 1) y que cada condicionada esté escrita en el sentido ' +
                'correcto: ' + K('P(' + efecto + ' \\mid A_i)') + ', nunca al revés.');
      });
  };

  /* ==================================================================
     16) tresFactorias — el problema de las tres factorías (4.9.3.1)
     ================================================================== */
  R.tresFactorias = function (node) {
    shell(node,
      'Las tres factorías, paso a paso',
      'Una empresa fabrica el 60 %, el 25 % y el 15 % de su producción en tres factorías, con un 1 %, ' +
      'un 4 % y un 2 % de piezas defectuosas. Mueve los deslizadores: los dos primeros fijan el reparto de ' +
      'la producción y el tercero se ajusta solo para que sume 100 %. Los tres últimos son los porcentajes ' +
      'de defectuosas, por ejemplo <code>1</code>, <code>4</code> y <code>2</code>.',
      [
        { id: 'q1', label: 'Producción de la factoría 1 (%)', type: 'range', min: 0, max: 100, step: 1, value: 60 },
        { id: 'q2', label: 'Producción de la factoría 2 (%)', type: 'range', min: 0, max: 100, step: 1, value: 25 },
        { id: 'd1', label: 'Defectuosas en la factoría 1 (%)', type: 'range', min: 0, max: 20, step: 0.5, value: 1 },
        { id: 'd2', label: 'Defectuosas en la factoría 2 (%)', type: 'range', min: 0, max: 20, step: 0.5, value: 4 },
        { id: 'd3', label: 'Defectuosas en la factoría 3 (%)', type: 'range', min: 0, max: 20, step: 0.5, value: 2 },
        { id: 'cierre', label: 'Cerrar la factoría 2 y repartir su producción', type: 'check', value: false },
        { type: 'presets', list: [
          { label: 'Datos del enunciado',
            title: 'P(D) = 0,019',
            apply: function (c) {
              c.q1.value = 60; c.q2.value = 25; c.d1.value = 1; c.d2.value = 4; c.d3.value = 2;
              c.cierre.checked = false;
            } },
          { label: 'Cerrar la factoría 2',
            title: 'Su 25 % se reparte proporcionalmente: P(D) = 0,01275',
            apply: function (c) {
              c.q1.value = 60; c.q2.value = 25; c.d1.value = 1; c.d2.value = 4; c.d3.value = 2;
              c.cierre.checked = true;
            } },
          { label: 'Toda la producción en la mejor factoría',
            apply: function (c) {
              c.q1.value = 100; c.q2.value = 0; c.d1.value = 1; c.d2.value = 4; c.d3.value = 2;
              c.cierre.checked = false;
            } },
          { label: 'Reparto uniforme entre las tres',
            apply: function (c) {
              c.q1.value = 34; c.q2.value = 33; c.d1.value = 1; c.d2.value = 4; c.d3.value = 2;
              c.cierre.checked = false;
            } },
          { label: 'La peor factoría se lleva casi todo',
            apply: function (c) {
              c.q1.value = 10; c.q2.value = 80; c.d1.value = 1; c.d2.value = 4; c.d3.value = 2;
              c.cierre.checked = false;
            } },
          { label: 'Mismo porcentaje de fallos en las tres',
            title: 'Entonces P(D) coincide con ese porcentaje',
            apply: function (c) {
              c.q1.value = 60; c.q2.value = 25; c.d1.value = 3; c.d2.value = 3; c.d3.value = 3;
              c.cierre.checked = false;
            } }
        ] }
      ],
      function (v) {
        var q1 = numero(v.q1, 0, 100, 'La producción de la factoría 1');
        var q2 = numero(v.q2, 0, 100, 'La producción de la factoría 2');
        if (q1 + q2 > 100)
          throw Error('Las dos primeras factorías no pueden producir más del 100 % entre las dos: ahora suman ' +
                      nc(q1 + q2, 1) + ' %. Baja uno de los dos deslizadores.');
        var q3 = 100 - q1 - q2;
        var d1 = numero(v.d1, 0, 20, 'El porcentaje de defectuosas de la factoría 1');
        var d2 = numero(v.d2, 0, 20, 'El porcentaje de defectuosas de la factoría 2');
        var d3 = numero(v.d3, 0, 20, 'El porcentaje de defectuosas de la factoría 3');
        var cierre = v.cierre === true || v.cierre === 'true';

        var prod = [q1, q2, q3], def = [d1, d2, d3];
        var nombres = ['Factoría 1', 'Factoría 2', 'Factoría 3'];
        if (cierre) {
          var resto = q1 + q3;
          if (resto <= 0)
            throw Error('No se puede cerrar la factoría 2 si las otras dos no producen nada: ' +
                        'sube la producción de la factoría 1 o de la 3.');
          prod = [q1 + q2 * q1 / resto, 0, q3 + q2 * q3 / resto];
        }
        var causas = [];
        for (var i = 0; i < 3; i++) {
          if (prod[i] <= 0) continue;
          causas.push({ lab: nombres[i], prior: S.fDiv(S.decFrac(prod[i]), frac(100, 1)),
            cond: S.fDiv(S.decFrac(def[i]), frac(100, 1)) });
        }
        if (!causas.length)
          throw Error('Alguna factoría tiene que producir algo: sube alguno de los deslizadores de producción.');
        var ap = aportaciones(causas);

        var arb = arbolCausas(causas, 'D', {
          cap: 'Primer nivel: de qué factoría viene la pieza. Segundo nivel: si sale defectuosa o no. ' +
               'Se suman las hojas con D.'
        });

        var filas = causas.map(function (c, i) {
          return [esc(c.lab), pct(fVal(c.prior), 1), pct(fVal(c.cond), 1),
            K(fracTex(c.prior) + ' \\cdot ' + fracTex(c.cond) + ' = ' + fracTex(ap.prods[i])),
            nc(fVal(ap.prods[i]), 5)];
        });
        filas.push({ celdas: ['Total', pct(1, 0), '\u2014', K(fracTex(ap.total)), nc(fVal(ap.total), 5)],
          clase: 'ap-tot' });

        var suma = causas.map(function (c, i) { return fracTex(c.prior) + ' \\cdot ' + fracTex(c.cond); }).join(' + ');

        var cincoPasosHtml =
          '<div class="mx-info"><b>Los cinco pasos del método.</b>' +
          pasos([
            '<b>Identifico el suceso B</b>: la pieza es defectuosa, ' + K('D') + '.',
            '<b>Identifico la partición</b>: ' + causas.map(function (c) { return esc(c.lab); }).join(', ') +
              '. Cada pieza viene de una sola factoría, así que son incompatibles, y no hay otras: ' +
              'su unión es todo. Sus probabilidades suman ' + fracTxt(sumaF(causas.map(function (c) { return c.prior; }))) + '.',
            '<b>Escribo los datos en su sitio</b>: los porcentajes de producción son las ' +
              K('P(A_i)') + ' y los de defectuosas son las ' + K('P(D \\mid A_i)') + '.',
            '<b>Aplico la fórmula</b>: ' + K('P(D) = \\sum_i P(A_i) \\cdot P(D \\mid A_i)') + '.',
            '<b>Interpreto</b>: ' + pct(fVal(ap.total), 3) + ' de la producción total sale defectuosa, ' +
              'es decir unas ' + nc(Math.round(fVal(ap.total) * 10000), 0) + ' piezas de cada 10 000.'
          ]) + '</div>';

        return arb +
          tabla(['Factoría', 'Producción', 'Defectuosas', 'Aportación a P(D)', 'Decimal'], filas) +
          resultado(fracTxt(ap.total) + '  =  ' + nc(fVal(ap.total), 5) + '  =  ' + pct(fVal(ap.total), 3),
            'P(D), probabilidad de que una pieza salga defectuosa') +
          cincoPasosHtml +
          '<div class="mx-info"><b>El cálculo completo.</b>' +
          KD('P(D) = ' + suma + ' = ' + fracFull(ap.total)) + '</div>' +
          controlMedia(causas, ap.total, 'D') +
          (cierre
            ? nota('<b>Escenario de cierre.</b> El ' + pct(q2 / 100, 0) + ' de la factoría 2 se ha repartido ' +
                   'entre las otras dos <b>en proporción</b> a lo que ya producían: ahora fabrican el ' +
                   pct(prod[0] / 100, 2) + ' y el ' + pct(prod[2] / 100, 2) + '. ' +
                   'La probabilidad de defectuosa pasa a ' + pct(fVal(ap.total), 3) +
                   ': quitar del sistema la factoría con más fallos mejora la calidad global.')
            : nota('<b>Prueba a marcar la casilla de cierre.</b> Verás que al repartir el ' + pct(q2 / 100, 0) +
                   ' de la factoría 2 entre las otras dos, la probabilidad de defectuosa baja: la peor rama ' +
                   'desaparece y su peso se lo quedan las mejores.')) +
          aviso('<b>Ojo con los porcentajes.</b> El 60 %, el 25 % y el 15 % son <b>pesos</b> del sistema ' +
                'completo y suman 100 %. El 1 %, el 4 % y el 2 % son <b>condicionadas dentro de cada factoría</b> ' +
                'y no tienen por qué sumar nada. Confundir los dos papeles es el error más habitual del tema.');
      });
  };

  /* ==================================================================
     17) urnasMoneda — dos urnas y una moneda (4.9.3.2 y 4.9.3.3)
     ================================================================== */
  R.urnasMoneda = function (node) {
    shell(node,
      'Dos urnas y una moneda',
      'Se lanza una moneda: si sale cara se extrae de la primera urna y si sale cruz, de la segunda. ' +
      'Escribe las bolas de cada urna como enteros, por ejemplo <code>3</code> blancas y <code>2</code> ' +
      'negras en la primera y <code>4</code> y <code>1</code> en la segunda. ' +
      'El mecanismo de elección de urna también se puede cambiar. ' +
      'Al final el applet compara el resultado correcto con el <b>error clásico</b> de sumar todas las ' +
      'bolas como si estuvieran en una sola urna.',
      [
        { id: 'b1', label: 'Bolas blancas en la urna 1', type: 'number', min: 0, max: 60, value: 3 },
        { id: 'n1', label: 'Bolas negras en la urna 1', type: 'number', min: 0, max: 60, value: 2 },
        { id: 'b2', label: 'Bolas blancas en la urna 2', type: 'number', min: 0, max: 60, value: 4 },
        { id: 'n2', label: 'Bolas negras en la urna 2', type: 'number', min: 0, max: 60, value: 1 },
        { id: 'mec', label: 'Cómo se elige la urna', type: 'select', value: 'moneda', options: [
          { value: 'moneda', label: 'Moneda: 1/2 y 1/2' },
          { value: 'dado12', label: 'Dado, sale 1 o 2: 1/3 y 2/3' },
          { value: 'dado6', label: 'Dado, sale 6: 1/6 y 5/6' },
          { value: 'p70', label: 'Sorteo desigual: 70 % y 30 %' }
        ] },
        { id: 'color', label: 'Color por el que preguntas', type: 'select', value: 'blanca', options: [
          { value: 'blanca', label: 'Bola blanca' },
          { value: 'negra', label: 'Bola negra' }
        ] },
        { type: 'presets', list: [
          { label: 'Urna verde 3B y 2N, urna roja 4B y 1N',
            title: 'P(blanca) = 0,70',
            apply: function (c) {
              c.b1.value = 3; c.n1.value = 2; c.b2.value = 4; c.n2.value = 1;
              c.mec.value = 'moneda'; c.color.value = 'blanca';
            } },
          { label: 'Urna 1 con 2B y 12N, urna 2 con 3B y 10N',
            title: 'P(negra) ≈ 0,8132; el error clásico da 22/27',
            apply: function (c) {
              c.b1.value = 2; c.n1.value = 12; c.b2.value = 3; c.n2.value = 10;
              c.mec.value = 'moneda'; c.color.value = 'negra';
            } },
          { label: 'La misma pregunta por la bola blanca',
            title: 'P(blanca) ≈ 0,1868; el error clásico da 5/27 ≈ 0,185',
            apply: function (c) {
              c.b1.value = 2; c.n1.value = 12; c.b2.value = 3; c.n2.value = 10;
              c.mec.value = 'moneda'; c.color.value = 'blanca';
            } },
          { label: 'Elección con un dado: 1 o 2 lleva a la urna 1',
            apply: function (c) {
              c.b1.value = 3; c.n1.value = 2; c.b2.value = 1; c.n2.value = 4;
              c.mec.value = 'dado12'; c.color.value = 'blanca';
            } },
          { label: 'Urnas iguales: el mecanismo deja de importar',
            apply: function (c) {
              c.b1.value = 3; c.n1.value = 2; c.b2.value = 3; c.n2.value = 2;
              c.mec.value = 'p70'; c.color.value = 'blanca';
            } },
          { label: 'Una urna sin bolas blancas',
            apply: function (c) {
              c.b1.value = 0; c.n1.value = 5; c.b2.value = 4; c.n2.value = 1;
              c.mec.value = 'moneda'; c.color.value = 'blanca';
            } }
        ] }
      ],
      function (v) {
        var b1 = cuenta(v.b1, 'Las bolas blancas de la urna 1', 60);
        var n1 = cuenta(v.n1, 'Las bolas negras de la urna 1', 60);
        var b2 = cuenta(v.b2, 'Las bolas blancas de la urna 2', 60);
        var n2 = cuenta(v.n2, 'Las bolas negras de la urna 2', 60);
        if (b1 + n1 === 0 || b2 + n2 === 0)
          throw Error('Las dos urnas necesitan al menos una bola: si una está vacía, no se puede extraer de ' +
                      'ella. Sube alguno de sus dos recuentos.');
        var mecs = {
          moneda: { p: frac(1, 2), txt: 'moneda (cara o cruz)' },
          dado12: { p: frac(1, 3), txt: 'dado, sale 1 o 2' },
          dado6: { p: frac(1, 6), txt: 'dado, sale 6' },
          p70: { p: frac(7, 10), txt: 'sorteo desigual del 70 %' }
        };
        var mec = mecs[v.mec] || mecs.moneda;
        var blanca = v.color !== 'negra';
        var t1 = b1 + n1, t2 = b2 + n2;
        var f1 = blanca ? b1 : n1, f2 = blanca ? b2 : n2;
        var color = blanca ? 'blanca' : 'negra';

        var causas = [
          { lab: 'Urna 1', prior: mec.p, cond: frac(f1, t1) },
          { lab: 'Urna 2', prior: fResta(UNO, mec.p), cond: frac(f2, t2) }
        ];
        var ap = aportaciones(causas);

        var arb = arbol({ lab: '', hijos: [
          { lab: 'U1', p: causas[0].prior, color: COL.verde, hijos: [
            { lab: color.charAt(0).toUpperCase(), p: causas[0].cond, color: COL.azul,
              camino: 'urna 1 y ' + color },
            { lab: 'otra', p: fResta(UNO, causas[0].cond), color: COL.gris, camino: 'urna 1, otro color' }
          ] },
          { lab: 'U2', p: causas[1].prior, color: COL.rojo, hijos: [
            { lab: color.charAt(0).toUpperCase(), p: causas[1].cond, color: COL.azul,
              camino: 'urna 2 y ' + color },
            { lab: 'otra', p: fResta(UNO, causas[1].cond), color: COL.gris, camino: 'urna 2, otro color' }
          ] }
        ] }, {
          cap: 'Primera etapa: el mecanismo (' + esc(mec.txt) + '). Segunda etapa: la extracción, con la ' +
               'composición de la urna elegida. Las dos hojas de color se suman.',
          label: 'Árbol de las dos urnas', pasoY: 72
        });

        var errClasico = frac(f1 + f2, t1 + t2);
        var iguales = fIgual(errClasico, ap.total);

        var comp = barras({
          items: [
            { lab: 'Correcto', valor: fVal(ap.total), txt: fracTxt(ap.total) + ' = ' + nc(fVal(ap.total), 4),
              color: COL.verde, nota: 'media ponderada de las dos urnas' },
            { lab: 'Error clásico', valor: fVal(errClasico),
              txt: fracTxt(errClasico) + ' = ' + nc(fVal(errClasico), 4), color: COL.rojo,
              nota: 'sumar todas las bolas: ' + (f1 + f2) + ' de ' + (t1 + t2) }
          ],
          max: 1,
          cap: 'Juntar las bolas de las dos urnas solo daría el resultado correcto si las urnas tuvieran el ' +
               'mismo número de bolas y se eligieran con la misma probabilidad.'
        });

        return arb +
          tabla(['Camino', 'Probabilidad de la urna', 'P(' + esc(color) + ' | urna)', 'Aportación', 'Decimal'], [
            ['Urna 1 (' + b1 + 'B, ' + n1 + 'N)', K(fracTex(causas[0].prior)), K(fracTex(causas[0].cond)),
              K(fracTex(ap.prods[0])), nc(fVal(ap.prods[0]), 4)],
            ['Urna 2 (' + b2 + 'B, ' + n2 + 'N)', K(fracTex(causas[1].prior)), K(fracTex(causas[1].cond)),
              K(fracTex(ap.prods[1])), nc(fVal(ap.prods[1]), 4)],
            { celdas: ['Total', K('1'), '\u2014', K(fracTex(ap.total)), nc(fVal(ap.total), 4)], clase: 'ap-tot' }
          ]) + comp +
          resultado(fracTxt(ap.total) + '  =  ' + nc(fVal(ap.total), 4) + '  =  ' + pct(fVal(ap.total), 2),
            'P(bola ' + esc(color) + ')') +
          '<div class="mx-info"><b>Aplicación del teorema.</b>' +
          KD('P(' + color.charAt(0).toUpperCase() + ') = P(U_1) \\cdot P(' + color.charAt(0).toUpperCase() +
             ' \\mid U_1) + P(U_2) \\cdot P(' + color.charAt(0).toUpperCase() + ' \\mid U_2) = ' +
             fracTex(causas[0].prior) + ' \\cdot ' + fracTex(causas[0].cond) + ' + ' +
             fracTex(causas[1].prior) + ' \\cdot ' + fracTex(causas[1].cond) + ' = ' + fracFull(ap.total)) +
          '</div>' +
          (iguales
            ? bien('Con estos datos concretos el error clásico da <b>por casualidad</b> el mismo número, ' +
                   'porque las urnas están equilibradas. Cambia el número de bolas de una urna y verás que ' +
                   'los dos resultados se separan.')
            : mal('<b>El error clásico.</b> Sumar todas las bolas y calcular ' +
                  K('\\frac{' + (f1 + f2) + '}{' + (t1 + t2) + '} = ' + fracTex(errClasico)) +
                  ' está <b>mal</b>: eso respondería a otro experimento, el de volcar las dos urnas en una ' +
                  'sola. Aquí las urnas se eligen primero, y una bola de una urna pequeña «pesa» más que una ' +
                  'de una urna grande.')) +
          nota('<b>Cuándo pesa más una bola.</b> La urna 1 tiene ' + t1 + ' bolas y se elige con probabilidad ' +
               fracTxt(causas[0].prior) + ', así que cada una de sus bolas tiene probabilidad ' +
               fracTxt(fDiv(causas[0].prior, frac(t1, 1))) + ' de salir; en la urna 2, ' +
               fracTxt(fDiv(causas[1].prior, frac(t2, 1))) + '. Solo si estos dos números coinciden se puede ' +
               'juntar todo en una urna única.') +
          aviso('<b>Comprobación rápida.</b> El resultado tiene que caer entre ' +
                K(fracTex(causas[0].cond)) + ' y ' + K(fracTex(causas[1].cond)) +
                ', las dos proporciones de cada urna. Si te sale fuera de ese intervalo, hay un error de cuentas.');
      });
  };

  /* ==================================================================
     18) cincoPasos — el método de los cinco pasos (4.9.4)
     ================================================================== */
  R.cincoPasos = function (node) {
    shell(node,
      'El método de los cinco pasos',
      'Casi todos los problemas de probabilidad total y de Bayes se resuelven con el mismo guion de cinco ' +
      'pasos. Escribe el sistema de causas y el nombre del efecto y el applet rellena el guion contigo. ' +
      FORMATO_CAUSAS + ' Elige además si la pregunta es <b>directa</b> (probabilidad total) o ' +
      '<b>inversa</b> (Bayes): el paso 4 cambia de fórmula, pero los otros cuatro son idénticos.',
      [
        { id: 'causas', label: 'Sistema completo de causas', type: 'area', rows: 5,
          value: 'Máquina A; 35%; 3%\nMáquina B; 40%; 2%\nMáquina C; 25%; 4%' },
        { id: 'efecto', label: 'Nombre corto del efecto (suceso B)', type: 'text', value: 'D' },
        { id: 'exp', label: 'Experimento', type: 'text', value: 'Se elige un tornillo al azar de la producción' },
        { id: 'tipo', label: 'Tipo de pregunta', type: 'select', value: 'directa', options: [
          { value: 'directa', label: 'Directa: ¿cuál es P(B)?' },
          { value: 'inversa', label: 'Inversa: ¿de qué causa viene, sabiendo B?' }
        ] },
        { id: 'cual', label: 'Causa de interés (para la pregunta inversa)', type: 'number', min: 1, max: 6, value: 1 },
        { type: 'presets', list: [
          { label: 'Tres máquinas de tornillos',
            title: 'P(D) = 0,0285',
            apply: function (c) {
              c.causas.value = 'Máquina A; 35%; 3%\nMáquina B; 40%; 2%\nMáquina C; 25%; 4%';
              c.efecto.value = 'D'; c.tipo.value = 'directa'; c.cual.value = 1;
              c.exp.value = 'Se elige un tornillo al azar de la producción';
            } },
          { label: 'Tres factorías: pregunta directa',
            apply: function (c) {
              c.causas.value = 'Factoría 1; 60%; 1%\nFactoría 2; 25%; 4%\nFactoría 3; 15%; 2%';
              c.efecto.value = 'D'; c.tipo.value = 'directa'; c.cual.value = 2;
              c.exp.value = 'Se elige una pieza al azar de la producción total';
            } },
          { label: 'Tres factorías: pregunta inversa',
            title: 'P(F2 | D) = 0,5263',
            apply: function (c) {
              c.causas.value = 'Factoría 1; 60%; 1%\nFactoría 2; 25%; 4%\nFactoría 3; 15%; 2%';
              c.efecto.value = 'D'; c.tipo.value = 'inversa'; c.cual.value = 2;
              c.exp.value = 'Se elige una pieza defectuosa y se pregunta de dónde viene';
            } },
          { label: 'Instituto: ciencias y letras',
            title: 'P(aprueba) = 0,69',
            apply: function (c) {
              c.causas.value = 'Ciencias; 45%; 80%\nLetras; 55%; 60%';
              c.efecto.value = 'A'; c.tipo.value = 'directa'; c.cual.value = 1;
              c.exp.value = 'Se elige un estudiante al azar del instituto';
            } },
          { label: 'Urna sin devolución: la segunda bola',
            title: 'P(segunda roja) = 0,4',
            apply: function (c) {
              c.causas.value = 'Primera roja; 4/10; 3/9\nPrimera azul; 6/10; 4/9';
              c.efecto.value = 'R'; c.tipo.value = 'directa'; c.cual.value = 1;
              c.exp.value = 'Urna con 4 rojas y 6 azules; se extraen dos bolas sin devolución';
            } },
          { label: 'Fumadores y enfermedad respiratoria',
            apply: function (c) {
              c.causas.value = 'Fumador; 30%; 25%\nNo fumador; 70%; 7%';
              c.efecto.value = 'R'; c.tipo.value = 'inversa'; c.cual.value = 1;
              c.exp.value = 'Se elige una persona con enfermedad respiratoria';
            } }
        ] }
      ],
      function (v) {
        var causas = leeCausas(v.causas);
        var efecto = String(v.efecto || 'B').trim().slice(0, 3) || 'B';
        var expl = String(v.exp || '').trim() || 'Se elige un elemento al azar';
        var inversa = v.tipo === 'inversa';
        var idx = entero(v.cual, 1, causas.length, 'El número de la causa de interés') - 1;
        var ap = aportaciones(causas);
        if (inversa && fIgual(ap.total, CERO))
          throw Error('La pregunta inversa no tiene sentido si el efecto es imposible: P(' + efecto +
                      ') = 0. Sube alguna de las probabilidades condicionadas.');
        var post = inversa ? fDiv(ap.prods[idx], ap.total) : null;

        var sumaTex = causas.map(function (c) { return fracTex(c.prior) + ' \\cdot ' + fracTex(c.cond); }).join(' + ');

        var guion = tabla(['Paso', 'Qué hay que hacer', 'En este problema'], [
          ['1. El experimento', 'Describirlo en dos etapas: primero la causa, después el efecto.', esc(expl)],
          ['2. El suceso B', 'Identificar el suceso del que se pregunta la probabilidad.',
            K(efecto) + ', el efecto observable'],
          ['3. La partición', 'Comprobar que las causas son incompatibles, cubren todo y suman 1.',
            causas.map(function (c) { return esc(c.lab); }).join(', ') + ' \u00b7 suman ' +
            fracTxt(sumaF(causas.map(function (c) { return c.prior; })))],
          ['4. Los datos en su sitio', 'Distinguir a priori de condicionadas.',
            'a priori: ' + causas.map(function (c) { return fracTxt(c.prior); }).join(', ') +
            ' \u00b7 condicionadas: ' + causas.map(function (c) { return fracTxt(c.cond); }).join(', ')],
          { celdas: ['5. La fórmula',
            inversa ? 'Bayes: producto del camino entre la probabilidad total.'
                    : 'Probabilidad total: suma de los productos de todos los caminos.',
            inversa
              ? K('P(A_' + (idx + 1) + ' \\mid ' + efecto + ') = ' + fracTex(post) + ' = ' + S.kf(fVal(post), 4))
              : K('P(' + efecto + ') = ' + fracTex(ap.total) + ' = ' + S.kf(fVal(ap.total), 5))],
            clase: 'ap-hi' }
        ]);

        var arb = arbolCausas(causas, efecto, {
          cap: inversa
            ? 'La pregunta inversa recorre el árbol <b>hacia atrás</b>: se conoce la hoja y se busca la rama.'
            : 'La pregunta directa recorre el árbol hacia delante: se multiplican los caminos y se suman.'
        });

        var res = inversa ? post : ap.total;

        return guion + arb +
          resultado(fracTxt(res) + '  =  ' + nc(fVal(res), 5) + '  =  ' + pct(fVal(res), 2),
            inversa ? 'P(' + esc(causas[idx].lab) + ' | ' + esc(efecto) + ')' : 'P(' + esc(efecto) + ')') +
          '<div class="mx-info"><b>Paso 5 desarrollado.</b>' +
          (inversa
            ? KD('P(A_' + (idx + 1) + ' \\mid ' + efecto + ') = \\frac{P(A_' + (idx + 1) + ') \\cdot P(' +
                 efecto + ' \\mid A_' + (idx + 1) + ')}{P(' + efecto + ')} = \\frac{' +
                 fracTex(ap.prods[idx]) + '}{' + fracTex(ap.total) + '} = ' + fracFull(post))
            : KD('P(' + efecto + ') = ' + sumaTex + ' = ' + fracFull(ap.total))) +
          'Fíjate en que, en los dos casos, el <b>denominador</b> del problema es la probabilidad total: ' +
          'hay que calcularla siempre, incluso cuando la pregunta es inversa.</div>' +
          tablaBayes(causas, efecto, inversa ? idx : -1).html +
          nota('<b>El guion no cambia.</b> Los pasos 1 a 4 son idénticos para la pregunta directa y para la ' +
               'inversa; solo el paso 5 elige fórmula. Por eso conviene automatizar los cuatro primeros: ' +
               'quien identifica bien la partición y coloca bien los datos ya tiene el problema resuelto.') +
          aviso('<b>Señales de que la pregunta es inversa.</b> «Sabiendo que ha salido defectuosa», ' +
                '«ha dado positivo, ¿cuál es la probabilidad de estar enfermo?», «se observa el efecto, ' +
                '¿de qué causa viene?». Si el dato es el <b>efecto</b> y la pregunta es por la <b>causa</b>, ' +
                'es Bayes.');
      });
  };

  /* ==================================================================
     19) bayes — el teorema de Bayes paso a paso (4.10.1 y 4.10.2)
     ================================================================== */
  R.bayes = function (node) {
    shell(node,
      'El teorema de Bayes paso a paso',
      'Bayes le da la vuelta al árbol: se observa el efecto y se pregunta por la causa. ' +
      'La fórmula es un cociente donde el numerador es <b>un solo camino</b> y el denominador es la ' +
      '<b>suma de todos</b>: $P(A_i \\mid B) = \\dfrac{P(A_i)P(B \\mid A_i)}{\\sum_j P(A_j)P(B \\mid A_j)}$. ' +
      FORMATO_CAUSAS + ' Elige la causa de interés con el selector y compara su probabilidad ' +
      '<b>a priori</b> con la <b>a posteriori</b>.',
      [
        { id: 'causas', label: 'Sistema completo de causas', type: 'area', rows: 5,
          value: 'Factoría 1; 60%; 1%\nFactoría 2; 25%; 4%\nFactoría 3; 15%; 2%' },
        { id: 'efecto', label: 'Nombre corto del efecto', type: 'text', value: 'D' },
        { id: 'cual', label: 'Causa de interés (número de línea)', type: 'number', min: 1, max: 6, value: 2 },
        { type: 'presets', list: [
          { label: 'Tres factorías: ¿viene de la 2?',
            title: 'P(F2 | D) = 0,5263',
            apply: function (c) {
              c.causas.value = 'Factoría 1; 60%; 1%\nFactoría 2; 25%; 4%\nFactoría 3; 15%; 2%';
              c.efecto.value = 'D'; c.cual.value = 2;
            } },
          { label: 'Dos urnas: la bola negra viene de la urna 1',
            title: 'P(U1 | N) ≈ 0,527',
            apply: function (c) {
              c.causas.value = 'Urna 1; 1/2; 12/14\nUrna 2; 1/2; 10/13';
              c.efecto.value = 'N'; c.cual.value = 1;
            } },
          { label: 'Prueba médica: positivo',
            title: 'P(enfermo | positivo) = 1/6 ≈ 0,1667',
            apply: function (c) {
              c.causas.value = 'Enfermo; 1%; 99%\nSano; 99%; 5%';
              c.efecto.value = 'P'; c.cual.value = 1;
            } },
          { label: 'Correo con la palabra gratis',
            title: 'P(spam | gratis) ≈ 0,930',
            apply: function (c) {
              c.causas.value = 'Spam; 40%; 60%\nLegítimo; 60%; 3%';
              c.efecto.value = 'G'; c.cual.value = 1;
            } },
          { label: 'Tres máquinas de tornillos',
            apply: function (c) {
              c.causas.value = 'Máquina A; 35%; 3%\nMáquina B; 40%; 2%\nMáquina C; 25%; 4%';
              c.efecto.value = 'D'; c.cual.value = 3;
            } },
          { label: 'Fumador con enfermedad respiratoria',
            title: 'P(fumador | enfermedad) ≈ 0,605',
            apply: function (c) {
              c.causas.value = 'Fumador; 30%; 25%\nNo fumador; 70%; 7%';
              c.efecto.value = 'R'; c.cual.value = 1;
            } }
        ] }
      ],
      function (v) {
        var causas = leeCausas(v.causas);
        var efecto = String(v.efecto || 'B').trim().slice(0, 3) || 'B';
        var idx = entero(v.cual, 1, causas.length, 'El número de la causa de interés') - 1;
        var ap = aportaciones(causas);
        if (fIgual(ap.total, CERO))
          throw Error('El efecto ' + efecto + ' es imposible con estos datos (P(' + efecto + ') = 0), así que ' +
                      'no se puede condicionar a él. Sube alguna probabilidad condicionada.');
        var post = ap.prods.map(function (p) { return fDiv(p, ap.total); });
        var elegida = causas[idx];

        var tb = tablaBayes(causas, efecto, idx);
        var bb = barrasBayes({
          causas: causas.map(function (c, i) {
            return { lab: c.lab, prior: c.prior, cond: c.cond, color: PALETA[i % PALETA.length] };
          }),
          efecto: efecto,
          cap: 'La longitud de cada barra es la aportación del camino; la etiqueta de abajo es la probabilidad ' +
               '<b>a posteriori</b>, es decir, la parte del total que le corresponde a esa causa.'
        });

        var comp = barras({
          items: causas.map(function (c, i) {
            return { lab: c.lab, valor: fVal(post[i]),
              txt: fracTxt(post[i]) + ' = ' + pct(fVal(post[i]), 2),
              color: PALETA[i % PALETA.length],
              nota: 'a priori ' + pct(fVal(c.prior), 1) + ' \u2192 a posteriori ' + pct(fVal(post[i]), 1) };
          }),
          max: 1,
          cap: 'Probabilidades a posteriori: suman exactamente 1, porque el efecto tiene que venir de alguna ' +
               'de las causas.'
        });

        var subeBaja = fVal(post[idx]) - fVal(elegida.prior);

        return arbolCausas(causas, efecto, {
          cap: 'Bayes usa este mismo árbol: el numerador es el camino de la causa elegida y el denominador es ' +
               'la suma de todos los caminos que llevan a ' + esc(efecto) + '.'
        }) + tb.html + bb + comp +
          resultado(fracTxt(post[idx]) + '  =  ' + nc(fVal(post[idx]), 4) + '  =  ' + pct(fVal(post[idx]), 2),
            'P(' + esc(elegida.lab) + ' | ' + esc(efecto) + ')') +
          '<div class="mx-info"><b>Cálculo en tres pasos.</b>' +
          pasos([
            'Numerador: el camino de la causa elegida, ' +
              K('P(A_' + (idx + 1) + ') \\cdot P(' + efecto + ' \\mid A_' + (idx + 1) + ') = ' +
                fracTex(elegida.prior) + ' \\cdot ' + fracTex(elegida.cond) + ' = ' + fracTex(ap.prods[idx])) + '.',
            'Denominador: la probabilidad total, ' + K('P(' + efecto + ') = ' + fracTex(ap.total) + ' = ' +
              S.kf(fVal(ap.total), 6)) + '.',
            'Cociente: ' + KD('P(A_' + (idx + 1) + ' \\mid ' + efecto + ') = \\frac{' + fracTex(ap.prods[idx]) +
              '}{' + fracTex(ap.total) + '} = ' + fracFull(post[idx]))
          ]) + '</div>' +
          (Math.abs(subeBaja) < 1e-12
            ? bien('La probabilidad de esta causa <b>no cambia</b> al observar el efecto: ' +
                   'su verosimilitud coincide con la media, así que el efecto no aporta información sobre ella.')
            : nota('<b>Cómo ha actualizado la evidencia.</b> La causa «' + esc(elegida.lab) + '» pasa de ' +
                   pct(fVal(elegida.prior), 2) + ' a ' + pct(fVal(post[idx]), 2) + '. ' +
                   (subeBaja > 0
                     ? 'Sube porque su verosimilitud ' + K('P(' + efecto + ' \\mid A_' + (idx + 1) + ') = ' +
                       S.kf(fVal(elegida.cond), 4) + '') + ' es mayor que la media ' +
                       K(S.kf(fVal(ap.total), 4)) + ': el efecto es más propio de esta causa.'
                     : 'Baja porque su verosimilitud ' + K(S.kf(fVal(elegida.cond), 4)) +
                       ' es menor que la media ' + K(S.kf(fVal(ap.total), 4)) + ': el efecto es poco propio ' +
                       'de esta causa.'))) +
          bien('<b>Control obligatorio.</b> Las probabilidades a posteriori suman ' +
               K(fracTex(sumaF(post))) + ' = 1. Si no suman 1, hay un error en el denominador.') +
          aviso('<b>Los dos errores más frecuentes.</b> Poner en el numerador solo ' + K('P(' + efecto +
                ' \\mid A_i)') + ' olvidando multiplicar por la a priori; y usar como denominador una ' +
                'condicionada en lugar de la probabilidad total.');
      });
  };

  /* ==================================================================
     20) bayesFactorias — las factorías vistas hacia atrás (4.10.3.1)
     ================================================================== */
  R.bayesFactorias = function (node) {
    shell(node,
      'Las factorías vistas hacia atrás',
      'Una pieza defectuosa ha llegado a control de calidad. ¿De qué factoría viene? ' +
      'Mueve los deslizadores de producción (el tercero se ajusta solo) y los de porcentaje de defectuosas, ' +
      'por ejemplo <code>60</code>, <code>25</code>, y <code>1</code>, <code>4</code>, <code>2</code>. ' +
      'El applet dibuja el árbol directo, la tabla de Bayes completa y las barras de aportación, ' +
      'y compara las probabilidades a priori con las a posteriori.',
      [
        { id: 'q1', label: 'Producción de la factoría 1 (%)', type: 'range', min: 0, max: 100, step: 1, value: 60 },
        { id: 'q2', label: 'Producción de la factoría 2 (%)', type: 'range', min: 0, max: 100, step: 1, value: 25 },
        { id: 'd1', label: 'Defectuosas en la factoría 1 (%)', type: 'range', min: 0, max: 20, step: 0.5, value: 1 },
        { id: 'd2', label: 'Defectuosas en la factoría 2 (%)', type: 'range', min: 0, max: 20, step: 0.5, value: 4 },
        { id: 'd3', label: 'Defectuosas en la factoría 3 (%)', type: 'range', min: 0, max: 20, step: 0.5, value: 2 },
        { type: 'presets', list: [
          { label: 'Datos del enunciado',
            title: 'A posteriori: 0,3158, 0,5263 y 0,1579',
            apply: function (c) {
              c.q1.value = 60; c.q2.value = 25; c.d1.value = 1; c.d2.value = 4; c.d3.value = 2;
            } },
          { label: 'La factoría grande también es la peor',
            apply: function (c) {
              c.q1.value = 80; c.q2.value = 10; c.d1.value = 4; c.d2.value = 1; c.d3.value = 1;
            } },
          { label: 'Una factoría pequeña y muy mala',
            title: 'Una causa rara puede dominar el diagnóstico',
            apply: function (c) {
              c.q1.value = 85; c.q2.value = 5; c.d1.value = 0.5; c.d2.value = 20; c.d3.value = 1;
            } },
          { label: 'Todas fallan igual',
            title: 'Entonces a posteriori = a priori',
            apply: function (c) {
              c.q1.value = 60; c.q2.value = 25; c.d1.value = 3; c.d2.value = 3; c.d3.value = 3;
            } },
          { label: 'Reparto uniforme de la producción',
            apply: function (c) {
              c.q1.value = 34; c.q2.value = 33; c.d1.value = 1; c.d2.value = 4; c.d3.value = 2;
            } },
          { label: 'Una factoría sin defectos',
            apply: function (c) {
              c.q1.value = 50; c.q2.value = 25; c.d1.value = 0; c.d2.value = 4; c.d3.value = 2;
            } }
        ] }
      ],
      function (v) {
        var q1 = numero(v.q1, 0, 100, 'La producción de la factoría 1');
        var q2 = numero(v.q2, 0, 100, 'La producción de la factoría 2');
        if (q1 + q2 > 100)
          throw Error('Las dos primeras factorías suman ' + nc(q1 + q2, 1) +
                      ' % de la producción: no puede pasar del 100 %. Baja uno de los dos deslizadores.');
        var q3 = 100 - q1 - q2;
        var ds = [numero(v.d1, 0, 20, 'Las defectuosas de la factoría 1'),
                  numero(v.d2, 0, 20, 'Las defectuosas de la factoría 2'),
                  numero(v.d3, 0, 20, 'Las defectuosas de la factoría 3')];
        var qs = [q1, q2, q3];
        var nombres = ['Factoría 1', 'Factoría 2', 'Factoría 3'];
        var causas = [];
        for (var i = 0; i < 3; i++) {
          if (qs[i] <= 0) continue;
          causas.push({ lab: nombres[i], prior: fDiv(S.decFrac(qs[i]), frac(100, 1)),
            cond: fDiv(S.decFrac(ds[i]), frac(100, 1)) });
        }
        if (causas.length < 2)
          throw Error('Hacen falta al menos dos factorías con producción positiva para poder preguntar de ' +
                      'cuál viene la pieza. Sube los deslizadores de producción.');
        var ap = aportaciones(causas);
        if (fIgual(ap.total, CERO))
          throw Error('Si ninguna factoría produce piezas defectuosas, no puede haber llegado una pieza ' +
                      'defectuosa a control de calidad. Sube alguno de los porcentajes de defectuosas.');
        var post = ap.prods.map(function (p) { return fDiv(p, ap.total); });

        var mejor = 0;
        post.forEach(function (p, i) { if (fVal(p) > fVal(post[mejor])) mejor = i; });

        var arb = arbolCausas(causas, 'D', {
          cap: 'Árbol directo: producción y después calidad. Las hojas con D son las que aportan al ' +
               'denominador de Bayes.'
        });
        var tb = tablaBayes(causas, 'D', mejor);
        var bb = barrasBayes({
          causas: causas.map(function (c, i) {
            return { lab: c.lab, prior: c.prior, cond: c.cond, color: PALETA[i % PALETA.length] };
          }),
          efecto: 'D',
          cap: 'Las barras miden la aportación de cada factoría al total de piezas defectuosas. ' +
               'La probabilidad a posteriori es la proporción de cada barra sobre la suma.'
        });

        var comp = barras({
          items: (function () {
            var it = [];
            causas.forEach(function (c, i) {
              it.push({ lab: c.lab + ' a priori', valor: fVal(c.prior), txt: pct(fVal(c.prior), 2),
                color: COL.azulClaro, nota: 'antes de saber que es defectuosa' });
              it.push({ lab: c.lab + ' a posteriori', valor: fVal(post[i]), txt: pct(fVal(post[i]), 2),
                color: PALETA[i % PALETA.length], nota: 'después de saberlo' });
            });
            return it;
          })(),
          max: 1,
          cap: 'La evidencia «la pieza es defectuosa» redistribuye la probabilidad entre las factorías.'
        });

        var pico = pictograma({
          grupos: causas.map(function (c, i) {
            return { lab: c.lab, n: Math.max(0, Math.round(fVal(post[i]) * 100)),
              color: PALETA[i % PALETA.length] };
          }),
          cols: 20,
          cap: 'De cada 100 piezas defectuosas que llegan a control, este es el reparto aproximado por ' +
               'factoría de procedencia.'
        });

        return arb + tb.html + bb + comp + pico +
          resultado(fracTxt(post[mejor]) + '  =  ' + pct(fVal(post[mejor]), 2),
            'Procedencia más probable: ' + esc(causas[mejor].lab)) +
          '<div class="mx-info"><b>Las tres cuentas de Bayes.</b>' +
          causas.map(function (c, i) {
            return KD('P(\\text{' + esc(c.lab) + '} \\mid D) = \\frac{' + fracTex(c.prior) +
                      ' \\cdot ' + fracTex(c.cond) + '}{' + fracTex(ap.total) + '} = ' + fracFull(post[i]));
          }).join('') +
          'Todas comparten el mismo denominador ' + K('P(D) = ' + fracTex(ap.total)) +
          ', que es exactamente la probabilidad total calculada en el apartado anterior.</div>' +
          bien('<b>Control.</b> Las probabilidades a posteriori suman ' + K(fracTex(sumaF(post))) +
               ' = 1: la pieza defectuosa viene con seguridad de alguna de las factorías.') +
          nota('<b>La lección del problema.</b> La factoría ' + esc(causas[mejor].lab) + ' produce el ' +
               pct(fVal(causas[mejor].prior), 1) + ' de las piezas, pero le corresponde el ' +
               pct(fVal(post[mejor]), 1) + ' de las defectuosas. Una causa pequeña con mala calidad puede ' +
               'ser la procedencia más probable de una pieza defectuosa: lo que decide no es el tamaño, ' +
               'sino el <b>producto</b> tamaño por verosimilitud.') +
          aviso('<b>Dirección de las flechas.</b> Los datos van «hacia delante» (de la factoría a la calidad) ' +
                'y la pregunta va «hacia atrás» (de la calidad a la factoría). Ese giro es el teorema de Bayes, ' +
                'y su denominador siempre es la probabilidad total.');
      });
  };

  /* ==================================================================
     21) testMedico — la prueba médica y su interpretación (4.10.3.3)
     ================================================================== */
  R.testMedico = function (node) {
    shell(node,
      'La prueba médica y su interpretación',
      'Una enfermedad afecta al 1 % de la población. La prueba detecta al 99 % de los enfermos ' +
      '(sensibilidad) y da un 5 % de falsos positivos, es decir, tiene un 95 % de especificidad. ' +
      'Has dado positivo: ¿cuál es la probabilidad de estar enfermo? ' +
      'Mueve los tres deslizadores, por ejemplo prevalencia <code>1</code>, sensibilidad <code>99</code> ' +
      'y especificidad <code>95</code>, y observa el pictograma de la tasa base.',
      [
        { id: 'prev', label: 'Prevalencia de la enfermedad (%)', type: 'range', min: 0.1, max: 60, step: 0.1, value: 1 },
        { id: 'sens', label: 'Sensibilidad: positivos entre enfermos (%)', type: 'range', min: 50, max: 100, step: 0.5, value: 99 },
        { id: 'espe', label: 'Especificidad: negativos entre sanos (%)', type: 'range', min: 50, max: 100, step: 0.5, value: 95 },
        { type: 'presets', list: [
          { label: 'Datos del enunciado: prevalencia del 1 %',
            title: 'P(enfermo | positivo) = 1/6 ≈ 16,7 %',
            apply: function (c) { c.prev.value = 1; c.sens.value = 99; c.espe.value = 95; } },
          { label: 'Enfermedad muy rara: 0,1 %',
            title: 'P(enfermo | positivo) ≈ 1,9 %',
            apply: function (c) { c.prev.value = 0.1; c.sens.value = 99; c.espe.value = 95; } },
          { label: 'Grupo de riesgo: prevalencia del 10 %',
            title: 'P(enfermo | positivo) ≈ 68,8 %',
            apply: function (c) { c.prev.value = 10; c.sens.value = 99; c.espe.value = 95; } },
          { label: 'Población muy afectada: 50 %',
            title: 'P(enfermo | positivo) ≈ 95,2 %',
            apply: function (c) { c.prev.value = 50; c.sens.value = 99; c.espe.value = 95; } },
          { label: 'Mejorar la prueba: solo 1 % de falsos positivos',
            title: 'Con prevalencia del 1 %, P(enfermo | positivo) = 50 %',
            apply: function (c) { c.prev.value = 1; c.sens.value = 99; c.espe.value = 99; } },
          { label: 'Prueba de cribado poco específica',
            apply: function (c) { c.prev.value = 1; c.sens.value = 99; c.espe.value = 80; } }
        ] }
      ],
      function (v) {
        var prev = numero(v.prev, 0.1, 60, 'La prevalencia');
        var sens = numero(v.sens, 50, 100, 'La sensibilidad');
        var espe = numero(v.espe, 50, 100, 'La especificidad');
        var p = fDiv(S.decFrac(prev), frac(100, 1));
        var s = fDiv(S.decFrac(sens), frac(100, 1));
        var e = fDiv(S.decFrac(espe), frac(100, 1));
        var noP = fResta(UNO, p), fp = fResta(UNO, e);
        var causas = [
          { lab: 'Enfermo', prior: p, cond: s },
          { lab: 'Sano', prior: noP, cond: fp }
        ];
        var ap = aportaciones(causas);
        if (fIgual(ap.total, CERO))
          throw Error('Con estos valores nadie daría positivo y la pregunta no tendría sentido. ' +
                      'Sube la sensibilidad o baja la especificidad.');
        var vpp = fDiv(ap.prods[0], ap.total);
        var negTot = fResta(UNO, ap.total);
        var vpn = fIgual(negTot, CERO) ? UNO : fDiv(fProd(noP, e), negTot);

        var N = 10000;
        var enf = fVal(p) * N, san = N - enf;
        var vp = enf * fVal(s), fn = enf - vp;
        var fpos = san * fVal(fp), vn = san - fpos;

        var arb = arbolCausas(causas, 'P', {
          cap: 'Primer nivel: la tasa base (estar enfermo o sano). Segundo nivel: el resultado de la prueba. ' +
               'Los positivos llegan por <b>dos</b> caminos, y ahí está toda la sorpresa.'
        });

        var tabFrec = contingencia({
          cols: ['Positivo', 'Negativo'],
          filas: [
            { lab: 'Enfermo', celdas: [nc(vp, 1), nc(fn, 1)], total: nc(enf, 1) },
            { lab: 'Sano', celdas: [nc(fpos, 1), nc(vn, 1)], total: nc(san, 1) }
          ],
          capC: 'Frecuencias naturales sobre ' + nc(N, 0) + ' personas', capF: 'Estado real',
          resalta: { f: 0, c: 0 },
          cap: 'De los ' + nc(vp + fpos, 1) + ' positivos, solo ' + nc(vp, 1) + ' están realmente enfermos. ' +
               'Los falsos positivos vienen de un grupo enorme (' + nc(san, 1) + ' personas sanas), ' +
               'y por eso son tantos.'
        });

        var mil = 1000;
        var cVP = Math.round(fVal(p) * fVal(s) * mil);
        var cFN = Math.max(0, Math.round(fVal(p) * mil) - cVP);
        var cFP = Math.round(fVal(noP) * fVal(fp) * mil);
        var cVN = Math.max(0, mil - cVP - cFN - cFP);
        var pic = pictograma({
          grupos: [
            { lab: 'Enfermo y positivo (verdadero positivo)', n: cVP, color: COL.rojo },
            { lab: 'Enfermo y negativo (falso negativo)', n: cFN, color: COL.naranja },
            { lab: 'Sano y positivo (falso positivo)', n: cFP, color: COL.morado },
            { lab: 'Sano y negativo (verdadero negativo)', n: cVN, color: COL.azulClaro }
          ],
          cols: 50,
          cap: 'Mil personas de la población. Las casillas rojas y moradas son <b>todos</b> los positivos: ' +
               'la probabilidad que buscas es la proporción de rojas entre rojas y moradas.'
        });

        var comp = barras({
          items: [
            { lab: 'Sensibilidad', valor: fVal(s), txt: pct(fVal(s), 1), color: COL.verde,
              nota: 'P(positivo | enfermo): dato de la prueba' },
            { lab: 'P(enfermo | +)', valor: fVal(vpp), txt: fracTxt(vpp) + ' = ' + pct(fVal(vpp), 2),
              color: COL.rojo, nota: 'lo que de verdad te interesa' },
            { lab: 'P(sano | \u2212)', valor: fVal(vpn), txt: pct(fVal(vpn), 3), color: COL.teal,
              nota: 'fiabilidad de un resultado negativo' },
            { lab: 'Prevalencia', valor: fVal(p), txt: pct(fVal(p), 2), color: COL.azul,
              nota: 'la tasa base, el dato que la intuición olvida' }
          ],
          max: 1,
          cap: 'La sensibilidad y ' + K('P(\\text{enfermo} \\mid +)') + ' son dos números completamente ' +
               'distintos, y confundirlos es el error clásico.'
        });

        var barrido = [0.1, 1, 10, 50].map(function (x) {
          var px = fDiv(S.decFrac(x), frac(100, 1));
          var tt = fSuma(fProd(px, s), fProd(fResta(UNO, px), fp));
          var vv = fIgual(tt, CERO) ? CERO : fDiv(fProd(px, s), tt);
          return { celdas: [pct(x / 100, 1), nc(fVal(tt), 4), pct(fVal(vv), 1)],
            clase: Math.abs(x - prev) < 1e-9 ? 'ap-hi' : '' };
        });

        return arb + tabFrec + pic + comp +
          resultado(fracTxt(vpp) + '  =  ' + nc(fVal(vpp), 4) + '  =  ' + pct(fVal(vpp), 2),
            'P(enfermo | positivo), el valor predictivo positivo') +
          '<div class="mx-info"><b>Las cuentas completas.</b>' +
          pasos([
            'Probabilidad total de dar positivo: ' +
              KD('P(+) = P(E)P(+ \\mid E) + P(E\')P(+ \\mid E\') = ' + fracTex(p) + ' \\cdot ' + fracTex(s) +
                 ' + ' + fracTex(noP) + ' \\cdot ' + fracTex(fp) + ' = ' + fracFull(ap.total)),
            'Bayes: ' + KD('P(E \\mid +) = \\frac{P(E)P(+ \\mid E)}{P(+)} = \\frac{' + fracTex(ap.prods[0]) +
              '}{' + fracTex(ap.total) + '} = ' + fracFull(vpp)),
            'Interpretación con frecuencias: de cada ' + nc(N, 0) + ' personas, ' + nc(vp + fpos, 1) +
              ' dan positivo y solo ' + nc(vp, 1) + ' están enfermas.'
          ]) + '</div>' +
          tabla(['Prevalencia', 'P(positivo)', 'P(enfermo | positivo)'], barrido) +
          (fVal(vpp) < 0.5
            ? mal('<b>Un positivo no es un diagnóstico.</b> Con esta prevalencia, más de la mitad de los ' +
                  'positivos son <b>falsos</b>: ' + pct(1 - fVal(vpp), 2) + ' de quienes dan positivo están ' +
                  'sanos. Por eso las pruebas de cribado se repiten o se confirman con otra prueba distinta.')
            : bien('<b>Aquí el positivo sí es informativo.</b> ' + pct(fVal(vpp), 2) +
                   ' de los positivos corresponden a personas realmente enfermas. Fíjate en qué has cambiado ' +
                   'para llegar aquí: subir la prevalencia o subir la especificidad.')) +
          nota('<b>Los dos caminos hacia un positivo.</b> Enfermos que dan positivo: ' + nc(vp, 1) +
               ' personas. Sanos que dan positivo: ' + nc(fpos, 1) + '. ' +
               'El segundo grupo es grande no porque la prueba sea mala, sino porque el grupo de sanos es ' +
               'gigantesco: ' + pct(1 - fVal(vpp), 1) + ' frente a ' + pct(fVal(vpp), 1) + '.') +
          aviso('<b>Qué hay que preguntar siempre.</b> La sensibilidad y la especificidad describen la prueba; ' +
                'el valor predictivo describe <b>tu caso</b>, y depende además de la prevalencia. ' +
                'Sin la tasa base, la fiabilidad de la prueba no dice nada sobre lo que te está pasando.');
      });
  };

  /* ==================================================================
     22) tasaBase — el olvido de la tasa base (4.10.4)
     ================================================================== */
  R.tasaBase = function (node) {
    shell(node,
      'El olvido de la tasa base',
      'La intuición suele responder con la <b>fiabilidad de la prueba</b> cuando le preguntan por la ' +
      '<b>probabilidad de la causa</b>. Escribe primero tu apuesta en el deslizador «tu intuición» ' +
      '(por ejemplo <code>90</code> %), y después compárala con el resultado exacto de Bayes. ' +
      'La tasa base es la prevalencia: cuanto más rara es la causa, más se equivoca la intuición.',
      [
        { id: 'base', label: 'Tasa base de la causa (%)', type: 'range', min: 0.1, max: 60, step: 0.1, value: 1 },
        { id: 'acierto', label: 'Acierto del indicio sobre la causa (%)', type: 'range', min: 50, max: 100, step: 0.5, value: 99 },
        { id: 'falso', label: 'Falsas alarmas sobre el resto (%)', type: 'range', min: 0, max: 50, step: 0.5, value: 5 },
        { id: 'intu', label: 'Tu intuición: P(causa | indicio) (%)', type: 'range', min: 0, max: 100, step: 1, value: 90 },
        { type: 'presets', list: [
          { label: 'Prueba médica del 1 %',
            title: 'La intuición dice 99 %; Bayes dice 16,7 %',
            apply: function (c) { c.base.value = 1; c.acierto.value = 99; c.falso.value = 5; c.intu.value = 90; } },
          { label: 'Correo con la palabra gratis',
            title: 'Tasa base alta: la intuición se acerca',
            apply: function (c) { c.base.value = 40; c.acierto.value = 60; c.falso.value = 3; c.intu.value = 80; } },
          { label: 'Coincidencia forense rarísima',
            apply: function (c) { c.base.value = 0.1; c.acierto.value = 100; c.falso.value = 0.5; c.intu.value = 95; } },
          { label: 'Alarma de seguridad muy sensible',
            apply: function (c) { c.base.value = 0.5; c.acierto.value = 99; c.falso.value = 10; c.intu.value = 85; } },
          { label: 'Grupo de riesgo: tasa base del 20 %',
            apply: function (c) { c.base.value = 20; c.acierto.value = 90; c.falso.value = 10; c.intu.value = 70; } },
          { label: 'Indicio sin falsas alarmas',
            title: 'Solo entonces la intuición acierta',
            apply: function (c) { c.base.value = 5; c.acierto.value = 90; c.falso.value = 0; c.intu.value = 90; } }
        ] }
      ],
      function (v) {
        var base = numero(v.base, 0.1, 60, 'La tasa base');
        var acierto = numero(v.acierto, 50, 100, 'El acierto del indicio');
        var falso = numero(v.falso, 0, 50, 'El porcentaje de falsas alarmas');
        var intu = numero(v.intu, 0, 100, 'Tu intuición');
        var p = fDiv(S.decFrac(base), frac(100, 1));
        var s = fDiv(S.decFrac(acierto), frac(100, 1));
        var f = fDiv(S.decFrac(falso), frac(100, 1));
        var causas = [
          { lab: 'Causa presente', prior: p, cond: s },
          { lab: 'Causa ausente', prior: fResta(UNO, p), cond: f }
        ];
        var ap = aportaciones(causas);
        if (fIgual(ap.total, CERO))
          throw Error('Con estos valores el indicio nunca aparecería, así que no se puede condicionar a él. ' +
                      'Sube el acierto o el porcentaje de falsas alarmas.');
        var real = fDiv(ap.prods[0], ap.total);
        var mil = 1000;
        var cCausa = Math.round(fVal(p) * mil);
        var cIndCausa = Math.round(fVal(p) * fVal(s) * mil);
        var cIndResto = Math.round((1 - fVal(p)) * fVal(f) * mil);

        var pic = pictograma({
          grupos: [
            { lab: 'Causa presente y con indicio', n: Math.max(0, cIndCausa), color: COL.rojo },
            { lab: 'Causa presente sin indicio', n: Math.max(0, cCausa - cIndCausa), color: COL.naranjaClaro },
            { lab: 'Causa ausente y con indicio (falsa alarma)', n: Math.max(0, cIndResto), color: COL.morado },
            { lab: 'Causa ausente y sin indicio', n: Math.max(0, mil - cCausa - cIndResto), color: COL.azulClaro }
          ],
          cols: 50,
          cap: 'Mil casos. El indicio aparece en las casillas rojas y en las moradas; solo las rojas ' +
               'corresponden a la causa. Ahí se ve por qué la respuesta no puede ser el ' +
               pct(fVal(s), 0) + '.'
        });

        var comp = barras({
          items: [
            { lab: 'Tu intuición', valor: intu / 100, txt: pct(intu / 100, 0), color: COL.naranja,
              nota: 'lo que has apostado' },
            { lab: 'Bayes', valor: fVal(real), txt: fracTxt(real) + ' = ' + pct(fVal(real), 2),
              color: COL.verde, nota: 'el valor exacto' },
            { lab: 'Fiabilidad del indicio', valor: fVal(s), txt: pct(fVal(s), 1), color: COL.gris,
              nota: 'P(indicio | causa): el número que engaña' },
            { lab: 'Tasa base', valor: fVal(p), txt: pct(fVal(p), 2), color: COL.azul,
              nota: 'el dato que se olvida' }
          ],
          max: 1,
          cap: 'Compara tu apuesta con el valor exacto y con los dos números que suelen confundirse.'
        });

        var error = Math.abs(intu / 100 - fVal(real));
        var veredicto = error < 0.05
          ? bien('<b>Muy bien.</b> Tu intuición se ha quedado a ' + nc(100 * error, 1) +
                 ' puntos porcentuales del valor exacto: has tenido en cuenta la tasa base.')
          : (intu / 100 > fVal(real)
            ? mal('<b>Has caído en el olvido de la tasa base.</b> Tu apuesta se pasa en ' +
                  nc(100 * error, 1) + ' puntos porcentuales. Has razonado con la fiabilidad del indicio ' +
                  '(' + pct(fVal(s), 1) + ') en lugar de con la mezcla de causas.')
            : nota('Tu apuesta se queda ' + nc(100 * error, 1) + ' puntos porcentuales por debajo. ' +
                   'Es el error contrario, menos frecuente: has infravalorado el peso del indicio.'));

        return pic + comp +
          resultado(pct(fVal(real), 2) + '   frente a tu   ' + pct(intu / 100, 0),
            'P(causa | indicio): valor exacto frente a intuición') +
          veredicto +
          '<div class="mx-info"><b>Las cuentas.</b>' +
          pasos([
            'Con indicio y causa presente: ' + K(fracTex(p) + ' \\cdot ' + fracTex(s) + ' = ' +
              fracTex(ap.prods[0])) + '.',
            'Con indicio y causa ausente (falsas alarmas): ' + K(fracTex(fResta(UNO, p)) + ' \\cdot ' +
              fracTex(f) + ' = ' + fracTex(ap.prods[1])) + '.',
            'Total de casos con indicio: ' + K(fracTex(ap.total) + ' = ' + S.kf(fVal(ap.total), 5)) + '.',
            'Proporción que corresponde a la causa: ' +
              KD('P(\\text{causa} \\mid \\text{indicio}) = \\frac{' + fracTex(ap.prods[0]) + '}{' +
                 fracTex(ap.total) + '} = ' + fracFull(real))
          ]) + '</div>' +
          tabla(['Cantidad', 'Símbolo', 'Valor'], [
            ['Tasa base de la causa', K('P(A)'), pct(fVal(p), 2)],
            ['Fiabilidad del indicio', K('P(B \\mid A)'), pct(fVal(s), 1)],
            ['Falsas alarmas', K('P(B \\mid A\')'), pct(fVal(f), 1)],
            ['Probabilidad del indicio', K('P(B)'), nc(fVal(ap.total), 5)],
            { celdas: ['Probabilidad de la causa sabiendo el indicio', K('P(A \\mid B)'),
              fracTxt(real) + ' = ' + pct(fVal(real), 2)], clase: 'ap-hi' }
          ]) +
          nota('<b>La regla de oro.</b> ' + K('P(A \\mid B)') + ' depende de tres cosas, no de una: ' +
               'la fiabilidad del indicio, las falsas alarmas y la <b>tasa base</b>. ' +
               'Si la causa es muy rara, hacen falta indicios extraordinariamente específicos para que ' +
               K('P(A \\mid B)') + ' sea alta.') +
          aviso('<b>Prueba este experimento.</b> Deja el acierto en ' + pct(fVal(s), 0) +
                ' y baja la tasa base al 0,1 %: verás que ' + K('P(A \\mid B)') +
                ' se hunde sin que la prueba haya empeorado ni un poco. La prueba es la misma; ' +
                'lo que ha cambiado es el mundo al que se aplica.');
      });
  };

  /* ==================================================================
     23) montyHall — el problema de las tres puertas (4.10.5)
     ================================================================== */
  function dibujaPuertas(elegida, abierta, premio, mostrar) {
    var W = 1000, H = 330;
    var body = S.txt(W / 2, 40, mostrar ? 'Final de la partida' : 'Elige y el presentador abre otra puerta',
      { size: 22, weight: 700, fill: COL.texto });
    for (var i = 1; i <= 3; i++) {
      var x = 120 + (i - 1) * 300;
      var abiertaEsta = (abierta === i);
      var col = abiertaEsta ? '#f1f4f6' : COL.azulClaro;
      if (mostrar && premio === i) col = COL.verdeClaro;
      body += S.rect(x, 70, 220, 210, col, i === elegida ? COL.naranja : COL.azulOsc,
        { r: 10, sw: i === elegida ? 6 : 2.6 });
      body += S.circle(x + 190, 175, 8, COL.azulOsc, 'none', 0);
      body += S.txt(x + 110, 120, 'Puerta ' + i, { size: 22, weight: 700, fill: COL.texto });
      var estado = '';
      if (abiertaEsta) estado = 'abierta: cabra';
      else if (mostrar && premio === i) estado = 'premio';
      else if (mostrar) estado = 'cabra';
      else if (i === elegida) estado = 'tu elección';
      else estado = 'cerrada';
      body += S.txt(x + 110, 175, estado, { size: 20, weight: 600, fill: COL.gris });
      if (i === elegida) body += S.txt(x + 110, 240, 'elegida', { size: 18, weight: 700, fill: COL.naranja });
    }
    return S.svgWrap(body, W, H, 'Las tres puertas',
      mostrar ? 'La puerta con el premio aparece en verde.'
              : 'La puerta con borde naranja es la tuya; la puerta gris es la que ha abierto el presentador, ' +
                'y siempre esconde una cabra.');
  }

  R.montyHall = function (node) {
    shell(node,
      'El problema de las tres puertas',
      'Eliges una de tres puertas; el presentador, que sabe dónde está el premio, abre otra con una cabra ' +
      'y te ofrece cambiar. ¿Conviene? Juega primero a mano: elige puerta, pulsa <b>Jugar una partida</b> ' +
      'y después <b>Me quedo</b> o <b>Cambio de puerta</b>. Cuando tengas una intuición, escribe un número ' +
      'de partidas (por ejemplo <code>5000</code>) y pulsa <b>Simular</b>: el applet juega miles de partidas ' +
      'con las dos estrategias y compara las frecuencias con las probabilidades exactas.',
      [
        { id: 'puerta', label: 'Puerta que eliges', type: 'select', value: '1', options: [
          { value: '1', label: 'Puerta 1' }, { value: '2', label: 'Puerta 2' }, { value: '3', label: 'Puerta 3' }
        ] },
        { id: 'semilla', label: 'Semilla del azar', type: 'number', min: 1, max: 99999, value: 7 },
        { id: 'n', label: 'Partidas de la simulación', type: 'number', min: 100, max: 200000, step: 100, value: 5000 },
        { id: 'bJugar', type: 'boton', label: 'Jugar una partida',
          onClick: function (ctl, extra) {
            if (!extra.gen) extra.gen = rng(Number(ctl.semilla.value) || 7);
            var eleg = Number(ctl.puerta.value) || 1;
            var premio = 1 + Math.floor(extra.gen() * 3);
            if (premio > 3) premio = 3;
            var opciones = [];
            for (var i = 1; i <= 3; i++) if (i !== eleg && i !== premio) opciones.push(i);
            var abierta = opciones[Math.floor(extra.gen() * opciones.length)] || opciones[0];
            extra.ronda = { eleg: eleg, premio: premio, abierta: abierta, resuelta: false, decision: '' };
          } },
        { id: 'bQuedo', type: 'boton', label: 'Me quedo',
          onClick: function (ctl, extra) { resuelveRonda(extra, false); } },
        { id: 'bCambio', type: 'boton', label: 'Cambio de puerta',
          onClick: function (ctl, extra) { resuelveRonda(extra, true); } },
        { id: 'bSim', type: 'boton', label: 'Simular las partidas',
          onClick: function (ctl, extra) {
            var n = entero(ctl.n.value, 100, 200000, 'El número de partidas');
            var g = rng(Number(ctl.semilla.value) || 7);
            var ganaQ = 0, ganaC = 0;
            for (var k = 0; k < n; k++) {
              var eleg = 1 + Math.floor(g() * 3);
              if (eleg > 3) eleg = 3;
              var premio = 1 + Math.floor(g() * 3);
              if (premio > 3) premio = 3;
              if (eleg === premio) ganaQ++; else ganaC++;
            }
            extra.sim = { n: n, ganaQ: ganaQ, ganaC: ganaC };
          } },
        { id: 'bReset', type: 'boton', label: 'Reiniciar el marcador',
          onClick: function (ctl, extra) {
            extra.hist = null; extra.ronda = null; extra.sim = null; extra.gen = null;
          } },
        { type: 'presets', list: [
          { label: 'Simulación corta: 1 000 partidas',
            apply: function (c, extra) { c.n.value = 1000; c.semilla.value = 7; extra.sim = null; } },
          { label: 'Simulación del tema: 5 000 partidas',
            apply: function (c, extra) { c.n.value = 5000; c.semilla.value = 7; extra.sim = null; } },
          { label: 'Simulación larga: 50 000 partidas',
            apply: function (c, extra) { c.n.value = 50000; c.semilla.value = 21; extra.sim = null; } },
          { label: 'Otra semilla, misma conclusión',
            apply: function (c, extra) { c.n.value = 5000; c.semilla.value = 1234; extra.sim = null; } },
          { label: 'Empezar de cero',
            apply: function (c, extra) {
              c.n.value = 5000; c.semilla.value = 7; c.puerta.value = '1';
              extra.sim = null; extra.hist = null; extra.ronda = null; extra.gen = null;
            } }
        ] }
      ],
      function (v, ctl, extra) {
        if (!extra.hist) extra.hist = { qJug: 0, qGan: 0, cJug: 0, cGan: 0 };
        var h = extra.hist;
        var r = extra.ronda;

        var fig = r
          ? dibujaPuertas(r.resuelta ? r.finalEleg : r.eleg, r.abierta, r.premio, r.resuelta)
          : dibujaPuertas(Number(v.puerta) || 1, 0, 0, false);

        var manual = r
          ? (r.resuelta
            ? (r.gano
              ? bien('<b>Has ganado.</b> Estrategia: ' + (r.decision === 'cambio' ? 'cambiar' : 'quedarse') +
                     '. El premio estaba en la puerta ' + r.premio + '.')
              : mal('<b>Has perdido.</b> Estrategia: ' + (r.decision === 'cambio' ? 'cambiar' : 'quedarse') +
                    '. El premio estaba en la puerta ' + r.premio + '.'))
            : nota('Has elegido la puerta ' + r.eleg + ' y el presentador ha abierto la ' + r.abierta +
                   ', que tenía una cabra. Ahora decide: <b>Me quedo</b> o <b>Cambio de puerta</b>.'))
          : nota('Elige una puerta en el selector y pulsa <b>Jugar una partida</b> para empezar.');

        var marcador = tabla(['Estrategia', 'Partidas jugadas', 'Ganadas', 'Frecuencia relativa', 'Probabilidad exacta'], [
          ['Quedarse', String(h.qJug), String(h.qGan),
            h.qJug ? nc(h.qGan / h.qJug, 4) : '\u2014', K('\\frac{1}{3} \\approx 0{,}3333')],
          ['Cambiar', String(h.cJug), String(h.cGan),
            h.cJug ? nc(h.cGan / h.cJug, 4) : '\u2014', K('\\frac{2}{3} \\approx 0{,}6667')]
        ]);

        var simHtml = '';
        if (extra.sim) {
          var sm = extra.sim;
          var fQ = sm.ganaQ / sm.n, fC = sm.ganaC / sm.n;
          simHtml = barras({
            items: [
              { lab: 'Quedarse', valor: fQ, txt: nc(fQ, 4) + ' (' + nc(sm.ganaQ, 0) + ' de ' + nc(sm.n, 0) + ')',
                color: COL.rojo, nota: 'probabilidad exacta 1/3 = 0,3333' },
              { lab: 'Cambiar', valor: fC, txt: nc(fC, 4) + ' (' + nc(sm.ganaC, 0) + ' de ' + nc(sm.n, 0) + ')',
                color: COL.verde, nota: 'probabilidad exacta 2/3 = 0,6667' }
            ],
            max: 1,
            cap: 'Frecuencias relativas de victoria en ' + nc(sm.n, 0) + ' partidas simuladas con la semilla ' +
                 esc(String(v.semilla)) + '. Se acercan a 1/3 y 2/3 como anuncia la ley de los grandes números.'
          }) +
          resultado(nc(fC, 4) + '   frente a   ' + nc(fQ, 4),
            'Frecuencia de victoria cambiando y quedándose en ' + nc(sm.n, 0) + ' partidas') +
          kvs([
            ['Partidas simuladas', nc(sm.n, 0)],
            ['Victorias quedándose', nc(sm.ganaQ, 0) + ' (' + pct(fQ, 2) + ')'],
            ['Victorias cambiando', nc(sm.ganaC, 0) + ' (' + pct(fC, 2) + ')'],
            ['Desviación respecto a 1/3', nc(Math.abs(fQ - 1 / 3), 4)],
            ['Desviación respecto a 2/3', nc(Math.abs(fC - 2 / 3), 4)]
          ]);
        } else {
          simHtml = aviso('Escribe el número de partidas y pulsa <b>Simular las partidas</b>: verás la ' +
                          'frecuencia relativa de victoria con cada estrategia.');
        }

        var bayes =
          '<div class="mx-info"><b>Bayes explica la paradoja.</b> Llamemos ' + K('C_i') +
          ' a «el premio está detrás de la puerta $i$» y ' + K('B') +
          ' a «el presentador abre la puerta 3» (habiendo elegido tú la 1).' +
          pasos([
            'A priori: ' + K('P(C_1) = P(C_2) = P(C_3) = \\frac{1}{3}') + '.',
            'Verosimilitudes: ' + K('P(B \\mid C_1) = \\frac{1}{2}') + ' (puede abrir la 2 o la 3), ' +
              K('P(B \\mid C_2) = 1') + ' (solo puede abrir la 3) y ' + K('P(B \\mid C_3) = 0') +
              ' (no abre la puerta del premio).',
            'Probabilidad total: ' +
              KD('P(B) = \\frac{1}{3} \\cdot \\frac{1}{2} + \\frac{1}{3} \\cdot 1 + \\frac{1}{3} \\cdot 0 = \\frac{1}{2}'),
            'Bayes: ' + KD('P(C_1 \\mid B) = \\frac{\\frac{1}{3} \\cdot \\frac{1}{2}}{\\frac{1}{2}} = \\frac{1}{3}' +
              ' \\qquad P(C_2 \\mid B) = \\frac{\\frac{1}{3} \\cdot 1}{\\frac{1}{2}} = \\frac{2}{3}')
          ]) +
          'Cambiar <b>duplica</b> la probabilidad de ganar. La clave es que el presentador ' +
          '<b>sabe</b> dónde está el premio: su elección no es azarosa y por eso transporta información ' +
          'hacia la puerta que no ha abierto.</div>';

        var bb = barrasBayes({
          causas: [
            { lab: 'Premio en la tuya', prior: frac(1, 3), cond: frac(1, 2), color: COL.rojo },
            { lab: 'Premio en la otra', prior: frac(1, 3), cond: frac(1, 1), color: COL.verde },
            { lab: 'Premio en la abierta', prior: frac(1, 3), cond: frac(0, 1), color: COL.gris }
          ],
          efecto: 'B',
          cap: 'Aportación de cada hipótesis al suceso «el presentador abre esa puerta». ' +
               'Las etiquetas a posteriori son 1/3, 2/3 y 0.'
        });

        return fig + manual + marcador + simHtml + bayes + bb +
          nota('<b>Por qué la intuición falla.</b> Parece que al quedar dos puertas cada una tiene ' +
               'probabilidad 1/2, pero eso solo valdría si la puerta abierta se hubiera elegido al azar. ' +
               'El presentador evita siempre el premio, así que la información que aporta no es simétrica.') +
          aviso('<b>Una variante que lo aclara todo.</b> Con 100 puertas: eliges una (probabilidad 1/100), ' +
                'el presentador abre 98 con cabras y quedan la tuya y otra. Cambiar gana con probabilidad ' +
                '99/100. Nadie duda en ese caso, y el razonamiento es exactamente el mismo.');
      });
  };

  function resuelveRonda(extra, cambia) {
    if (!extra.ronda || extra.ronda.resuelta) return;
    var r = extra.ronda;
    var finalEleg = r.eleg;
    if (cambia) {
      for (var i = 1; i <= 3; i++) if (i !== r.eleg && i !== r.abierta) finalEleg = i;
    }
    r.finalEleg = finalEleg;
    r.gano = (finalEleg === r.premio);
    r.resuelta = true;
    r.decision = cambia ? 'cambio' : 'quedo';
    if (!extra.hist) extra.hist = { qJug: 0, qGan: 0, cJug: 0, cGan: 0 };
    if (cambia) { extra.hist.cJug++; if (r.gano) extra.hist.cGan++; }
    else { extra.hist.qJug++; if (r.gano) extra.hist.qGan++; }
  }

  /* ==================================================================
     24) actualizaCreencias — Bayes en forma de odds (4.10.6)
     ================================================================== */
  R.actualizaCreencias = function (node) {
    shell(node,
      'Actualizar creencias: Bayes en forma de razones',
      'Bayes se puede escribir sin denominador común comparando dos hipótesis: ' +
      KD('\\frac{P(A_1 \\mid B)}{P(A_2 \\mid B)} = \\underbrace{\\frac{P(A_1)}{P(A_2)}}_{\\text{razón inicial}} \\cdot ' +
         '\\underbrace{\\frac{P(B \\mid A_1)}{P(B \\mid A_2)}}_{\\text{factor de Bayes}}') +
      'Escribe las cuatro probabilidades como fracción o como decimal, por ejemplo ' +
      '<code>0,01</code> y <code>1/100</code> son lo mismo. Si las dos hipótesis son complementarias, ' +
      'el applet también convierte la razón final en probabilidad.',
      [
        { id: 'p1', label: 'P(A₁): probabilidad inicial de la primera hipótesis', type: 'text', value: '0,01' },
        { id: 'p2', label: 'P(A₂): probabilidad inicial de la segunda hipótesis', type: 'text', value: '0,99' },
        { id: 'v1', label: 'P(B | A₁): verosimilitud del dato con la primera hipótesis', type: 'text', value: '0,99' },
        { id: 'v2', label: 'P(B | A₂): verosimilitud del dato con la segunda hipótesis', type: 'text', value: '0,05' },
        { id: 'n1', label: 'Nombre de la primera hipótesis', type: 'text', value: 'Enfermo' },
        { id: 'n2', label: 'Nombre de la segunda hipótesis', type: 'text', value: 'Sano' },
        { type: 'presets', list: [
          { label: 'Prueba médica: positivo',
            title: 'Razón inicial 1/99, factor 19,8, razón final 1/5',
            apply: function (c) {
              c.p1.value = '0,01'; c.p2.value = '0,99'; c.v1.value = '0,99'; c.v2.value = '0,05';
              c.n1.value = 'Enfermo'; c.n2.value = 'Sano';
            } },
          { label: 'Prueba médica: negativo',
            title: 'El mismo dato en contra hunde la razón',
            apply: function (c) {
              c.p1.value = '0,01'; c.p2.value = '0,99'; c.v1.value = '0,01'; c.v2.value = '0,95';
              c.n1.value = 'Enfermo'; c.n2.value = 'Sano';
            } },
          { label: 'Dos pruebas positivas seguidas',
            title: 'Se aplica el factor de Bayes dos veces',
            apply: function (c) {
              c.p1.value = '1/5'; c.p2.value = '4/5'; c.v1.value = '0,99'; c.v2.value = '0,05';
              c.n1.value = 'Enfermo'; c.n2.value = 'Sano';
            } },
          { label: 'Correo con la palabra gratis',
            title: 'Factor de Bayes moderado',
            apply: function (c) {
              c.p1.value = '0,4'; c.p2.value = '0,6'; c.v1.value = '0,6'; c.v2.value = '0,03';
              c.n1.value = 'Correo basura'; c.n2.value = 'Correo legítimo';
            } },
          { label: 'Coincidencia forense muy rara',
            title: 'Verosimilitud 1 frente a una entre un millón',
            apply: function (c) {
              c.p1.value = '1/1000000'; c.p2.value = '999999/1000000'; c.v1.value = '1'; c.v2.value = '1/1000000';
              c.n1.value = 'Es la persona'; c.n2.value = 'No es la persona';
            } },
          { label: 'Segunda factoría frente al resto',
            title: 'Comparación directa de dos causas de un mismo efecto',
            apply: function (c) {
              c.p1.value = '0,35'; c.p2.value = '0,65'; c.v1.value = '0,04'; c.v2.value = '0,0246';
              c.n1.value = 'Factoría 2'; c.n2.value = 'Otra factoría';
            } }
        ] }
      ],
      function (v) {
        var n1 = String(v.n1 || 'Hipótesis 1').trim() || 'Hipótesis 1';
        var n2 = String(v.n2 || 'Hipótesis 2').trim() || 'Hipótesis 2';
        var p1 = leeP(v.p1, 'P(A\u2081)');
        var p2 = leeP(v.p2, 'P(A\u2082)');
        var q1 = leeP(v.v1, 'P(B | A\u2081)');
        var q2 = leeP(v.v2, 'P(B | A\u2082)');
        if (fIgual(p2, CERO))
          throw Error('La probabilidad inicial de la segunda hipótesis no puede ser 0: ' +
                      'sería el denominador de la razón inicial. Escribe un valor mayor que 0.');
        if (fIgual(q2, CERO))
          throw Error('La verosimilitud P(B | A\u2082) no puede ser 0 en la forma de razones, porque ' +
                      'el factor de Bayes se haría infinito. Usa un valor pequeño, como 1/1000000, ' +
                      'o vuelve a la forma clásica de Bayes.');
        if (fIgual(fSuma(fProd(p1, q1), fProd(p2, q2)), CERO))
          throw Error('Con estas verosimilitudes el dato B nunca ocurriría, así que no se puede condicionar a él.');

        var razIni = fDiv(p1, p2);
        var factor = fDiv(q1, q2);
        var razFin = fProd(razIni, factor);
        var compl = fIgual(fSuma(p1, p2), UNO);
        var post1 = fDiv(razFin, fSuma(UNO, razFin));
        var post2 = fResta(UNO, post1);

        var comp = barras({
          items: [
            { lab: 'Razón inicial', valor: Math.min(1, fVal(razIni)), txt: fracTxt(razIni) + ' = ' + nc(fVal(razIni), 5),
              color: COL.azul, nota: 'cuántas veces es más probable ' + esc(n1) + ' que ' + esc(n2) + ' antes del dato' },
            { lab: 'Razón final', valor: Math.min(1, fVal(razFin)), txt: fracTxt(razFin) + ' = ' + nc(fVal(razFin), 5),
              color: COL.verde, nota: 'la misma comparación después del dato' }
          ],
          max: 1,
          cap: 'Las barras se han recortado en 1 para poder compararlas; los valores exactos están en las etiquetas. ' +
               'El paso de una a otra es una simple multiplicación por el factor de Bayes.'
        });

        var bb = barrasBayes({
          causas: [
            { lab: n1, prior: p1, cond: q1, color: COL.rojo },
            { lab: n2, prior: p2, cond: q2, color: COL.azul }
          ],
          efecto: 'B',
          cap: 'Aportación de cada hipótesis al dato observado. El cociente de las dos aportaciones ' +
               'es exactamente la razón final.'
        });

        var fuerza = fVal(factor);
        var lectura = fuerza >= 10
          ? bien('<b>El dato apoya con fuerza la primera hipótesis:</b> factor de Bayes ' +
                 nc(fuerza, 3) + ', es decir, es unas ' + nc(fuerza, 1) + ' veces más esperable si ' +
                 esc(n1) + ' que si ' + esc(n2) + '.')
          : (fuerza > 1.0001
            ? nota('<b>El dato apoya moderadamente la primera hipótesis:</b> factor de Bayes ' +
                   nc(fuerza, 3) + '. La creencia se mueve, pero sin dar un salto.')
            : (fuerza < 0.9999
              ? mal('<b>El dato apoya la segunda hipótesis:</b> factor de Bayes ' + nc(fuerza, 4) +
                    ', menor que 1, así que la razón inicial se reduce.')
              : aviso('<b>Factor de Bayes igual a 1:</b> el dato es igual de esperable con las dos ' +
                      'hipótesis, no aporta información y la razón no cambia.')));

        return comp + bb +
          resultado(fracTxt(razIni) + '  \u00b7  ' + fracTxt(factor) + '  =  ' + fracTxt(razFin),
            'Razón inicial por factor de Bayes igual a razón final') +
          lectura +
          '<div class="mx-info"><b>Las tres piezas.</b>' +
          pasos([
            'Razón inicial: ' + KD('\\frac{P(A_1)}{P(A_2)} = \\frac{' + fracTex(p1) + '}{' + fracTex(p2) +
              '} = ' + fracFull(razIni)),
            'Factor de Bayes: ' + KD('\\frac{P(B \\mid A_1)}{P(B \\mid A_2)} = \\frac{' + fracTex(q1) + '}{' +
              fracTex(q2) + '} = ' + fracFull(factor)),
            'Razón final: ' + KD('\\frac{P(A_1 \\mid B)}{P(A_2 \\mid B)} = ' + fracTex(razIni) + ' \\cdot ' +
              fracTex(factor) + ' = ' + fracFull(razFin))
          ]) + '</div>' +
          tabla(['Cantidad', 'Valor exacto', 'Valor decimal'], [
            ['Probabilidad inicial de ' + esc(n1), fracTxt(p1), nc(fVal(p1), 6)],
            ['Probabilidad inicial de ' + esc(n2), fracTxt(p2), nc(fVal(p2), 6)],
            ['Verosimilitud con ' + esc(n1), fracTxt(q1), nc(fVal(q1), 6)],
            ['Verosimilitud con ' + esc(n2), fracTxt(q2), nc(fVal(q2), 6)],
            { celdas: ['Factor de Bayes', fracTxt(factor), nc(fVal(factor), 6)], clase: 'ap-hi' },
            { celdas: ['Razón final', fracTxt(razFin), nc(fVal(razFin), 6)], clase: 'ap-hi' }
          ]) +
          (compl
            ? nota('<b>De razón a probabilidad.</b> Como las dos hipótesis son complementarias, ' +
                   KD('P(A_1 \\mid B) = \\frac{\\text{razón final}}{1 + \\text{razón final}} = \\frac{' +
                      fracTex(razFin) + '}{1 + ' + fracTex(razFin) + '} = ' + fracFull(post1)) +
                   'y por tanto ' + K('P(A_2 \\mid B) = ' + fracTex(post2) + ' = ' + S.kf(fVal(post2), 4)) +
                   '. Comprueba que coincide con el resultado de la forma clásica de Bayes.')
            : aviso('<b>Ojo:</b> las dos probabilidades iniciales suman ' + fracTxt(fSuma(p1, p2)) +
                    ', no 1, así que las hipótesis no son complementarias. La razón final sigue siendo ' +
                    'válida como comparación entre ellas, pero no se puede convertir en probabilidad ' +
                    'sin conocer el resto del sistema completo.')) +
          nota('<b>Por qué esta forma es tan cómoda.</b> No hace falta calcular ' + K('P(B)') + ': ' +
               'el denominador de Bayes es el mismo para las dos hipótesis y desaparece al dividir. ' +
               'Además, con varios datos independientes se multiplican los factores uno detrás de otro, ' +
               'y así se ve la creencia actualizándose paso a paso.');
      });
  };

  /* ==================================================================
     25) mapaTema — mapa-resumen navegable del tema (cierre)
     ================================================================== */
  var MAPA = [
    { id: '4.2', tit: 'Experimentos y espacio muestral',
      preg: '¿Qué puede pasar?',
      idea: 'Un experimento aleatorio tiene varios resultados posibles y no sabemos cuál saldrá. ' +
            'El conjunto de todos ellos es el espacio muestral ' + K('E') + '.',
      form: 'E = \\{\\, \\text{todos los resultados posibles} \\,\\}',
      ej: 'Al lanzar un dado, ' + K('E = \\{1,2,3,4,5,6\\}') + '.',
      col: COL.azul },
    { id: '4.3', tit: 'Sucesos',
      preg: '¿Qué preguntas puedo hacer?',
      idea: 'Un suceso es un subconjunto de ' + K('E') + '. Los hay elementales, compuestos, ' +
            'el seguro, el imposible y el contrario.',
      form: 'A \\subset E, \\qquad A\' = E \\setminus A',
      ej: '«Salir par» es ' + K('A = \\{2,4,6\\}') + ' y su contrario ' + K('A\' = \\{1,3,5\\}') + '.',
      col: COL.azulOsc },
    { id: '4.4', tit: 'Operaciones con sucesos',
      preg: '¿Cómo combino sucesos?',
      idea: 'Unión («o»), intersección («y») y contrario («no»), con las leyes de De Morgan como ' +
            'herramienta de traducción.',
      form: '(A \\cup B)\' = A\' \\cap B\', \\qquad (A \\cap B)\' = A\' \\cup B\'',
      ej: '«Ni A ni B» se escribe ' + K('A\' \\cap B\' = (A \\cup B)\'') + '.',
      col: COL.morado },
    { id: '4.5', tit: 'Experimentos compuestos',
      preg: '¿Y si hay varias etapas?',
      idea: 'Los diagramas de árbol organizan las etapas; cada rama es un camino y su probabilidad ' +
            'es el producto de las de sus ramas.',
      form: 'P(\\text{camino}) = \\text{producto de las ramas}',
      ej: 'Dos extracciones sin devolución: el árbol tiene dos niveles y las ramas del segundo cambian.',
      col: COL.teal },
    { id: '4.6', tit: 'Regla de Laplace',
      preg: '¿Cuánto vale una probabilidad?',
      idea: 'Si todos los resultados son equiprobables, contar es suficiente. Si no lo son, ' +
            'hay que recurrir a frecuencias o a un modelo.',
      form: 'P(A) = \\dfrac{n(A)}{n(E)}',
      ej: 'Par en un dado: ' + K('P(A) = 3/6 = 1/2') + '.',
      col: COL.verde },
    { id: '4.7', tit: 'Propiedades de la probabilidad',
      preg: '¿Qué reglas cumple siempre?',
      idea: 'Probabilidad del contrario y probabilidad de la unión. Con estas dos se resuelve ' +
            'casi cualquier ejercicio de una sola etapa.',
      form: 'P(A\') = 1 - P(A), \\qquad P(A \\cup B) = P(A) + P(B) - P(A \\cap B)',
      ej: 'Si ' + K('P(A) = 0{,}6') + ', entonces ' + K('P(A\') = 0{,}4') + '.',
      col: COL.naranja },
    { id: '4.8', tit: 'Probabilidad condicionada',
      preg: '¿Cómo cambia al recibir información?',
      idea: 'Condicionar es reducir el espacio muestral al suceso que ya sabemos que ha ocurrido. ' +
            'De aquí sale la regla del producto y la definición de independencia.',
      form: 'P(A \\mid B) = \\dfrac{P(A \\cap B)}{P(B)}, \\qquad P(A \\cap B) = P(B) \\cdot P(A \\mid B)',
      ej: 'En una clase, saber que la persona elegida lleva gafas cambia la probabilidad de que estudie música.',
      col: COL.rojo },
    { id: '4.9', tit: 'Probabilidad total',
      preg: '¿Cómo junto varios caminos?',
      idea: 'Con un sistema completo de sucesos, la probabilidad de un efecto es la suma ponderada ' +
            'de las aportaciones de todas las causas.',
      form: 'P(B) = \\sum_{i} P(A_i) \\cdot P(B \\mid A_i)',
      ej: 'Tres factorías con distintos porcentajes de producción y de piezas defectuosas.',
      col: COL.azul },
    { id: '4.10', tit: 'Teorema de Bayes',
      preg: '¿Y al revés: qué causa lo ha producido?',
      idea: 'Bayes invierte el condicionamiento: pasa de ' + K('P(B \\mid A_i)') + ' a ' +
            K('P(A_i \\mid B)') + ' dividiendo la aportación de una causa entre la probabilidad total.',
      form: 'P(A_i \\mid B) = \\dfrac{P(A_i) \\cdot P(B \\mid A_i)}{\\sum_{j} P(A_j) \\cdot P(B \\mid A_j)}',
      ej: 'Una prueba médica positiva con enfermedad rara: la probabilidad de estar enfermo sigue siendo baja.',
      col: COL.morado }
  ];

  function dibujaMapa(sel) {
    var W = 1000, H = 430, body = '';
    var bw = 280, bh = 96;
    for (var i = 0; i < MAPA.length; i++) {
      var f = Math.floor(i / 3), c = i % 3;
      var x = 40 + c * 310, y = 30 + f * 132;
      var act = (i === sel);
      body += S.rect(x, y, bw, bh, act ? MAPA[i].col : '#f4f7f9', act ? MAPA[i].col : COL.marco,
        { r: 12, sw: act ? 4 : 2, op: act ? 0.18 : 1 });
      if (act) body += S.rect(x, y, bw, bh, 'none', MAPA[i].col, { r: 12, sw: 4 });
      body += S.txt(x + bw / 2, y + 34, 'Apartado ' + MAPA[i].id,
        { size: 19, weight: 700, fill: act ? MAPA[i].col : COL.gris });
      var pal = MAPA[i].tit.split(' ');
      var l1 = '', l2 = '';
      for (var k = 0; k < pal.length; k++) {
        if ((l1 + ' ' + pal[k]).length <= 24 && !l2) l1 = l1 ? l1 + ' ' + pal[k] : pal[k];
        else l2 = l2 ? l2 + ' ' + pal[k] : pal[k];
      }
      body += S.txt(x + bw / 2, y + 60, esc(l1), { size: 18, weight: 600, fill: COL.texto });
      if (l2) body += S.txt(x + bw / 2, y + 82, esc(l2), { size: 18, weight: 600, fill: COL.texto });
      if (c < 2) body += S.path('M ' + (x + bw) + ' ' + (y + bh / 2) + ' L ' + (x + bw + 28) + ' ' + (y + bh / 2),
        COL.eje, 2.4);
      else if (i < MAPA.length - 1)
        body += S.path('M ' + (x + bw / 2) + ' ' + (y + bh) + ' L ' + (x + bw / 2) + ' ' + (y + bh + 20) +
          ' L ' + (40 + bw / 2) + ' ' + (y + bh + 20) + ' L ' + (40 + bw / 2) + ' ' + (y + 132),
          COL.guia, 2.4, 'none', '7 6');
    }
    return S.svgWrap(body, W, H, 'Mapa del tema de probabilidad',
      'Recorrido del tema: de los resultados posibles a la pregunta inversa de Bayes. ' +
      'El bloque destacado es el que estás consultando.');
  }

  R.mapaTema = function (node) {
    shell(node,
      'Mapa-resumen del tema',
      'Todo el tema en un solo esquema: cada apartado responde a <b>una</b> pregunta y aporta ' +
      '<b>una</b> herramienta. Elige un apartado en el selector, por ejemplo <code>4.8</code>, ' +
      'para ver su pregunta, su idea clave, su fórmula y un ejemplo; los presets te llevan a las ' +
      'cuatro fórmulas que hay que llevar memorizadas al examen.',
      [
        { id: 'ap', label: 'Apartado del tema', type: 'select', value: '6', options: MAPA.map(function (m, i) {
          return { value: String(i), label: m.id + ' \u00b7 ' + m.tit };
        }) },
        { id: 'todo', label: 'Ver además el resumen completo en tabla', type: 'check', value: true },
        { type: 'presets', list: [
          { label: 'Fórmula 1: regla de Laplace',
            title: 'P(A) = n(A)/n(E)',
            apply: function (c) { c.ap.value = '4'; c.todo.checked = false; } },
          { label: 'Fórmula 2: suceso contrario y unión',
            title: 'P(A\u2032) = 1 \u2212 P(A)',
            apply: function (c) { c.ap.value = '5'; c.todo.checked = false; } },
          { label: 'Fórmula 3: probabilidad condicionada',
            title: 'P(A | B) = P(A \u2229 B) / P(B)',
            apply: function (c) { c.ap.value = '6'; c.todo.checked = false; } },
          { label: 'Fórmula 4: probabilidad total y Bayes',
            title: 'Las dos fórmulas del final del tema',
            apply: function (c) { c.ap.value = '8'; c.todo.checked = false; } },
          { label: 'Repaso completo del tema',
            apply: function (c) { c.ap.value = '0'; c.todo.checked = true; } },
          { label: 'Solo la parte de esta segunda mitad',
            apply: function (c) { c.ap.value = '7'; c.todo.checked = true; } }
        ] }
      ],
      function (v) {
        var i = entero(v.ap, 0, MAPA.length - 1, 'El apartado');
        var m = MAPA[i];
        var tablaTodo = v.todo
          ? tabla(['Apartado', 'Pregunta que responde', 'Herramienta'], MAPA.map(function (x, k) {
            return { celdas: [x.id + ' \u00b7 ' + esc(x.tit), esc(x.preg), K(x.form)],
              clase: k === i ? 'ap-hi' : '' };
          }))
          : '';

        return dibujaMapa(i) +
          tarjeta('Apartado ' + m.id + ' \u00b7 ' + esc(m.tit),
            '<p><b>Pregunta que responde:</b> ' + esc(m.preg) + '</p>' +
            '<p>' + m.idea + '</p>' + KD(m.form) +
            '<p><b>Ejemplo:</b> ' + m.ej + '</p>') +
          kvs([
            ['Apartado', m.id],
            ['Anterior', i > 0 ? MAPA[i - 1].id + ' \u00b7 ' + esc(MAPA[i - 1].tit) : 'es el primero'],
            ['Siguiente', i < MAPA.length - 1 ? MAPA[i + 1].id + ' \u00b7 ' + esc(MAPA[i + 1].tit) : 'es el último']
          ]) +
          tablaTodo +
          '<div class="mx-info"><b>Las cuatro fórmulas que hay que llevar memorizadas.</b>' +
          pasos([
            'Regla de Laplace, solo con resultados equiprobables: ' + K('P(A) = \\dfrac{n(A)}{n(E)}'),
            'Suceso contrario, el atajo de «al menos uno»: ' + K('P(A\') = 1 - P(A)'),
            'Unión de dos sucesos, sin contar dos veces la intersección: ' +
              K('P(A \\cup B) = P(A) + P(B) - P(A \\cap B)'),
            'Regla del producto, la puerta de la condicionada: ' + K('P(A \\cap B) = P(A) \\cdot P(B \\mid A)')
          ]) +
          'Con estas cuatro y un árbol bien dibujado se resuelve la inmensa mayoría de los problemas ' +
          'del tema. Probabilidad total y Bayes son la lectura del árbol hacia delante y hacia atrás.</div>' +
          nota('<b>El hilo del tema en una frase.</b> Primero describimos lo que puede pasar (' +
               K('E') + ' y sucesos), después aprendemos a medirlo (Laplace y propiedades), ' +
               'luego a corregir la medida cuando llega información nueva (condicionada), ' +
               'después a sumar caminos (probabilidad total) y por último a recorrerlos al revés (Bayes).') +
          aviso('<b>Preguntas de autocomprobación.</b> ¿Sabrías decir, sin mirar, qué distingue ' +
                'sucesos incompatibles de sucesos independientes? ¿Por qué ' + K('P(A \\mid B)') +
                ' y ' + K('P(B \\mid A)') + ' son distintos? ¿Qué tres condiciones cumple un sistema ' +
                'completo de sucesos? Si dudas en alguna, vuelve al apartado correspondiente del mapa.');
      });
  };

  S.extraD = true;
})();
