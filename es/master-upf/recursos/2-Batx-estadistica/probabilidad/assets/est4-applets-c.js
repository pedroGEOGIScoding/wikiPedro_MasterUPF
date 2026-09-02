/* =====================================================================
   est4-applets-c.js · Tema 4 Probabilidad (parte 2) · 2.º Bachillerato
   Módulo C — La regla de Laplace y las propiedades de la probabilidad
              (apartados 4.6 y 4.7)

   Depende de window.EST4 (est4-applets.js), que aporta el armazón de
   applet, las fracciones exactas, la combinatoria con BigInt, los
   diagramas de Venn por regiones, el árbol ponderado, las tablas de
   contingencia, las barras y el pictograma.

   Applets registrados aquí (20):
     equiprobable · laplace · urnaTresColores · barajaLaplace ·
     ambiguedad · quiniela · primitiva · dosEtapas · dadoCargado ·
     quinielaAsimetrica · frecuentista · razonInsuficiente ·
     rango · sumaElementales · alMenos · sumaIncompatibles ·
     sumaGeneral · cuatroRegiones · haciaAtras · consecuencias

   Toda probabilidad se calcula con fracciones exactas del núcleo y todo
   recuento grande con BigInt: 3^14 y C(49,6) salen al dígito.

   JavaScript plano (ES5), SVG propio, sin CDN ni dependencias externas.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.EST4;
  if (!S) { return; }
  var R = S.registry;

  /* atajos del núcleo */
  var K = S.K, KD = S.KD, esc = S.esc, nc = S.nc, kf = S.kf, pct = S.pct;
  var frac = S.frac, fSuma = S.fSuma, fResta = S.fResta, fProd = S.fProd,
      fDiv = S.fDiv, fVal = S.fVal, fIgual = S.fIgual,
      fracTex = S.fracTex, fracTxt = S.fracTxt, fracFull = S.fracFull,
      leeProb = S.leeProb, decFrac = S.decFrac;
  var U = S.U, I = S.I, D = S.D, Co = S.Co, ordena = S.ordena,
      setTex = S.setTex, setTxt = S.setTxt, igual = S.igual, subset = S.subset;
  var shell = S.shell, tabla = S.tabla, kvs = S.kvs, contingencia = S.contingencia;
  var nota = S.nota, aviso = S.aviso, bien = S.bien, mal = S.mal,
      tarjeta = S.tarjeta, insignia = S.insignia, resultado = S.resultado,
      fichas = S.fichas;
  var venn = S.venn, arbol = S.arbol, barras = S.barras,
      pictograma = S.pictograma, leyenda = S.leyenda;
  var svgWrap = S.svgWrap, txt = S.txt, line = S.line, rect = S.rect, circle = S.circle;
  var entero = S.entero, numero = S.numero, lista = S.lista, COL = S.COL;
  var C = S.C, V = S.V, VR = S.VR, bigTxt = S.bigTxt, rng = S.rng;

  /* ==================================================================
     0 · utilidades comunes del módulo
     ================================================================== */

  /* Lista numerada de pasos (el guion de tres pasos de Laplace vive aquí) */
  function pasos(items) {
    var h = '<ol class="ap-pasos">';
    items.forEach(function (t) { h += '<li>' + t + '</li>'; });
    return h + '</ol>';
  }

  /* Escritura de una probabilidad dentro de KaTeX: decimal exacto cuando
     el denominador lo permite (0,28 se lee mejor que 7/25) y fracción en
     los demás casos (1/3 nunca debe salir como 0,3333). */
  function pTex(f) {
    if (f.d === 1) return String(f.n);
    if (10000 % f.d === 0) return kf(fVal(f), 4);
    return fracTex(f);
  }
  function pTxt(f) {
    if (f.d === 1) return String(f.n);
    if (10000 % f.d === 0) return nc(fVal(f), 4);
    return fracTxt(f);
  }

  /* Decimal en notación fija: para probabilidades diminutas (1/4782969),
     String() daría 2.1e-7, que en clase no se puede leer. */
  function fija(x, d) { return Number(x).toFixed(d).replace('.', ','); }
  function fijaTex(x, d) { return Number(x).toFixed(d).replace('.', '{,}'); }

  /* Probabilidad escrita por el alumno, con mensaje pedagógico propio. */
  function leeP(t, nombre) {
    return leeProb(t, nombre);
  }

  /* Igual que leeProb, pero SIN exigir que el valor esté entre 0 y 1:
     el applet del rango necesita poder leer 1,4 o -0,2 para explicar
     por qué son imposibles. */
  function leeLibre(t, nombre) {
    var s = String(t == null ? '' : t).trim().replace(/\s/g, '');
    if (!s) throw Error((nombre || 'El valor') + ' está vacío. Escribe por ejemplo 0,25 o 1/4.');
    var porc = /%$/.test(s);
    if (porc) s = s.slice(0, -1);
    s = s.replace(',', '.');
    var m = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
    var f;
    if (m) {
      if (Number(m[2]) === 0) throw Error('No se puede dividir entre 0: revisa el número de casos posibles.');
      f = fDiv(decFrac(Number(m[1])), decFrac(Number(m[2])));
    } else {
      if (!/^-?\d+(\.\d+)?$/.test(s))
        throw Error((nombre || 'El valor') + ' no se entiende. Formatos válidos: 0,25 · 1/4 · 25%');
      f = decFrac(Number(s));
    }
    if (porc) f = fProd(f, frac(1, 100));
    return f;
  }

  /* Pares «etiqueta: valor» separados por comas, punto y coma o saltos de
     línea. El valor puede faltar (entonces vale null) o ser «?». */
  function leePares(t, nombre, tope, ejemplo) {
    var s = String(t == null ? '' : t).trim().replace(/^\{|\}$/g, '').trim();
    if (!s) throw Error('Falta ' + (nombre || 'la lista') + '. Escribe por ejemplo: ' + (ejemplo || 'roja:3, azul:5'));
    var brutos = s.split(/[,;\n]+/).filter(function (x) { return String(x).trim() !== ''; });
    /* Un decimal escrito con coma (0,3) se ha partido en dos: se vuelve a pegar. */
    var trozos = [];
    brutos.forEach(function (x) {
      if (x.indexOf(':') < 0 && trozos.length) trozos[trozos.length - 1] += ',' + x;
      else trozos.push(x);
    });
    if (trozos.length < 2)
      throw Error((nombre || 'La lista') + ' necesita al menos dos elementos separados por comas. Ejemplo: ' + (ejemplo || 'roja:3, azul:5'));
    if (trozos.length > (tope || 12))
      throw Error((nombre || 'La lista') + ' no puede pasar de ' + (tope || 12) + ' elementos en este applet.');
    return trozos.map(function (tr, i) {
      var p = String(tr).split(':');
      var lab = String(p[0]).trim();
      var val = p.length > 1 ? String(p[1]).trim() : null;
      if (!lab) throw Error('El elemento ' + (i + 1) + ' de ' + (nombre || 'la lista') + ' no tiene nombre. Escribe nombre:valor, por ejemplo ' + (ejemplo || 'roja:3') + '.');
      return { lab: lab, val: val };
    });
  }

  /* Figura del cociente de Laplace: casillas para los casos posibles, en
     color las favorables. Es la imagen mental del apartado 4.6.2:
     «qué fracción del espacio muestral ocupa el suceso». */
  function figFraccion(fav, pos, cap) {
    if (pos <= 0) throw Error('El número de casos posibles debe ser mayor que 0.');
    if (pos <= 120) {
      var cols = pos <= 12 ? pos : (pos <= 24 ? 12 : (pos <= 60 ? 20 : 30));
      return pictograma({
        grupos: [
          { lab: 'Casos favorables', n: fav, color: COL.azul },
          { lab: 'Casos no favorables', n: Math.max(0, pos - fav), color: COL.guia }
        ],
        cols: cols,
        cap: cap,
        label: 'Casos favorables sobre casos posibles'
      });
    }
    return barras({
      items: [
        { lab: 'Favorables', valor: fav / pos, txt: nc(100 * fav / pos, 3) + ' %', nota: bigTxt(BigInt(fav)) + ' de ' + bigTxt(BigInt(pos)) },
        { lab: 'No favorables', valor: (pos - fav) / pos, txt: nc(100 * (pos - fav) / pos, 3) + ' %' }
      ],
      max: 1, cap: cap, label: 'Proporción de casos favorables'
    });
  }

  /* Escala 0-1 con marcas: la recta donde vive toda probabilidad. */
  function escalaProb(marcas, cap) {
    var W = 1000, H = 286, x0 = 90, x1 = 910, y = 126;
    var body = rect(20, 20, W - 40, H - 40, '#ffffff', COL.marco, { r: 12, sw: 1.6 });
    body += rect(x0, y - 16, x1 - x0, 32, '#f1f5f7', COL.guia, { r: 8, sw: 1.4 });
    var refs = [[0, '0'], [0.25, '0,25'], [0.5, '0,5'], [0.75, '0,75'], [1, '1']];
    refs.forEach(function (r) {
      var x = x0 + (x1 - x0) * r[0];
      body += line(x, y - 22, x, y + 22, COL.guia, 1.6);
      body += txt(x, y + 48, r[1], { size: 18, weight: 600, fill: COL.gris });
    });
    body += txt(x0, y - 40, 'imposible', { size: 17, weight: 600, fill: COL.gris, anchor: 'start' });
    body += txt(x1, y - 40, 'seguro', { size: 17, weight: 600, fill: COL.gris, anchor: 'end' });
    (marcas || []).forEach(function (m, i) {
      var v = Number(m.v);
      var dentro = v >= 0 && v <= 1;
      var x = x0 + (x1 - x0) * Math.max(-0.08, Math.min(1.08, v));
      var col = m.color || (dentro ? COL.azul : COL.rojo);
      var dy = i % 2 ? 86 : -74;
      body += line(x, y, x, y + (dy > 0 ? 26 : -26), col, 2.6);
      body += circle(x, y, 11, col, '#ffffff', 2.4);
      body += txt(x, y + dy + (dy > 0 ? 10 : 0), esc(m.lab), { size: 19, weight: 700, fill: col });
      if (!dentro) body += txt(x, y + dy + (dy > 0 ? 32 : 22), 'fuera de la escala', { size: 16, weight: 600, fill: COL.rojo });
    });
    return svgWrap(body, W, H, 'Escala de probabilidad de 0 a 1', cap);
  }

  /* Tabla 2x2 de las cuatro regiones, con marginales y total 1.
     Se construyen las columnas y la fila de totales a mano para que las
     celdas puedan ser fracciones exactas y aun así cuadren. */
  function tabla4(pAB, pAnB, pnAB, pnAnB, opts) {
    opts = opts || {};
    var nA = opts.nA || 'A', nB = opts.nB || 'B';
    var pA = fSuma(pAB, pAnB), pnA = fSuma(pnAB, pnAnB);
    var pB = fSuma(pAB, pnAB), pnB = fSuma(pAnB, pnAnB);
    return contingencia({
      cols: [K(nB), K('\\overline{' + nB + '}'), '<b>Total</b>'],
      filas: [
        { lab: K(nA), celdas: [K(pTex(pAB)), K(pTex(pAnB)), '<b>' + K(pTex(pA)) + '</b>'] },
        { lab: K('\\overline{' + nA + '}'), celdas: [K(pTex(pnAB)), K(pTex(pnAnB)), '<b>' + K(pTex(pnA)) + '</b>'] },
        { lab: '<b>Total</b>', celdas: ['<b>' + K(pTex(pB)) + '</b>', '<b>' + K(pTex(pnB)) + '</b>', '<b>' + K(pTex(fSuma(pB, pnB))) + '</b>'] }
      ],
      totales: false, tex: true,
      capC: opts.capC || 'Tabla de las cuatro regiones: las cuatro casillas interiores suman 1',
      capF: opts.capF || '',
      cap: opts.cap
    });
  }

  /* Comprobación de que tres datos de probabilidad son compatibles */
  function coherente(pA, pB, pI) {
    if (fVal(pI) > fVal(pA) + 1e-12)
      throw Error('Imposible: $P(A \\cap B)$ = ' + pTxt(pI) + ' no puede ser mayor que $P(A)$ = ' + pTxt(pA) +
                  ', porque $A \\cap B$ está dentro de $A$.');
    if (fVal(pI) > fVal(pB) + 1e-12)
      throw Error('Imposible: $P(A \\cap B)$ = ' + pTxt(pI) + ' no puede ser mayor que $P(B)$ = ' + pTxt(pB) +
                  ', porque $A \\cap B$ está dentro de $B$.');
    var un = fResta(fSuma(pA, pB), pI);
    if (fVal(un) > 1 + 1e-12)
      throw Error('Imposible: con estos datos $P(A \\cup B)$ = ' + pTxt(un) + ' > 1. ' +
                  'Sube $P(A \\cap B)$ o baja $P(A)$ y $P(B)$: dos sucesos no pueden ocupar más que todo $E$.');
    return un;
  }

  /* Instrucción de formato reutilizada */
  var FORMATO_P =
    'Las probabilidades se pueden escribir de tres maneras equivalentes: ' +
    'decimal con coma <code>0,25</code>, fracción <code>1/4</code> o porcentaje <code>25%</code>.';

  /* ==================================================================
     1) equiprobable — detector de equiprobabilidad (4.6.1)
     ================================================================== */
  R.equiprobable = function (node) {
    shell(node,
      'Detector de equiprobabilidad',
      'Un experimento es <b>regular</b> cuando todos sus sucesos elementales son <b>equiprobables</b>. ' +
      'Escribe los resultados con el «peso físico» que les da la simetría del artefacto, separados por comas y ' +
      'con dos puntos: <code>roja:3, azul:5, verde:1</code>. Si no hay ninguna simetría que te diga el peso, ' +
      'escribe una interrogación: <code>punta arriba:?, punta abajo:?</code>. ' +
      'El applet decide si puedes aplicar la regla de Laplace o no.',
      [
        { id: 'pesos', label: 'Resultados y su peso físico', type: 'text',
          value: '1:1, 2:1, 3:1, 4:1, 5:1, 6:1',
          placeholder: '1:1, 2:1, 3:1   ·   roja:3, azul:5, verde:1   ·   punta arriba:?' },
        { id: 'sim', label: '¿Hay una simetría física que garantice esos pesos?', type: 'check', value: true },
        { type: 'presets', list: [
          { label: 'Dado no trucado', title: 'Seis caras geométricamente indistinguibles',
            apply: function (c) { c.pesos.value = '1:1, 2:1, 3:1, 4:1, 5:1, 6:1'; c.sim.checked = true; } },
          { label: 'Moneda equilibrada',
            apply: function (c) { c.pesos.value = 'cara:1, cruz:1'; c.sim.checked = true; } },
          { label: 'Urna: 3 rojas, 5 azules, 1 verde',
            apply: function (c) { c.pesos.value = 'roja:3, azul:5, verde:1'; c.sim.checked = true; } },
          { label: 'Dado de quinielas 3-2-1',
            apply: function (c) { c.pesos.value = '1:3, X:2, 2:1'; c.sim.checked = true; } },
          { label: 'Dado cargado proporcional al valor',
            apply: function (c) { c.pesos.value = '1:1, 2:2, 3:3, 4:4, 5:5, 6:6'; c.sim.checked = true; } },
          { label: 'Chincheta: no hay simetría',
            apply: function (c) { c.pesos.value = 'punta arriba:?, punta abajo:?'; c.sim.checked = false; } }
        ] }
      ],
      function (v) {
        var pares = leePares(v.pesos, 'la lista de resultados', 12, '1:1, 2:1, 3:1');
        var hayIncognita = false, i;
        var pesos = pares.map(function (p) {
          if (p.val === null || p.val === '?' || p.val === '') { hayIncognita = true; return null; }
          var x = numero(p.val, 0, 1000000, 'El peso de «' + p.lab + '»');
          return decFrac(x);
        });

        var filasNombres = pares.map(function (p) { return p.lab; });
        var repetido = '';
        for (i = 0; i < filasNombres.length; i++) {
          if (filasNombres.indexOf(filasNombres[i]) !== i) repetido = filasNombres[i];
        }
        if (repetido)
          throw Error('El resultado «' + repetido + '» aparece dos veces. En el espacio muestral cada resultado ' +
                      'se escribe una sola vez: si hay tres caras marcadas con 1, eso es un peso 3, no tres resultados.');

        if (hayIncognita) {
          return aviso('<b>Paso 1 fallido: no hay simetría reconocible.</b> Has dejado pesos sin determinar, ' +
                       'así que no sabes si los resultados son equiprobables. ' +
                       'La regla de Laplace <b>no se puede aplicar</b>.') +
            tabla(['Resultado', 'Peso físico', 'Probabilidad'],
              pares.map(function (p) { return [esc(p.lab), '?', K('\\text{desconocida}')]; })) +
            '<div class="mx-info"><b>¿Y entonces qué se hace?</b>' +
            pasos([
              'Se repite el experimento muchas veces y se anota la frecuencia relativa ' + K('n_A / N') + '.',
              'Por la ley de los grandes números, esa frecuencia se acerca a la probabilidad: ' +
                KD('P(A) = \\lim_{N \\to \\infty} \\dfrac{n_A}{N}'),
              'El valor obtenido así se llama probabilidad <b>a posteriori</b>, frente a la <b>a priori</b> ' +
                'que se calcula con Laplace, combinatoria o árboles.'
            ]) + '</div>' +
            nota('<b>Ejemplos clásicos sin simetría:</b> lanzar una chincheta y ver si cae con la punta hacia ' +
                 'arriba, preguntar a alguien si le gusta el fútbol, o coger un grano de un saco donde hay ' +
                 'cebada y trigo mezclados. La forma de la chincheta privilegia una posición de caída, y de las ' +
                 'respuestas o de la mezcla no sabemos nada de antemano.');
        }

        var total = pesos.reduce(function (a, p) { return fSuma(a, p); }, frac(0, 1));
        if (fVal(total) <= 0)
          throw Error('La suma de los pesos es 0. Al menos un resultado tiene que tener peso positivo.');
        var probs = pesos.map(function (p) { return fDiv(p, total); });
        var eq = true;
        for (i = 1; i < probs.length; i++) if (!fIgual(probs[i], probs[0])) eq = false;

        var filas = pares.map(function (p, j) {
          return { celdas: [esc(p.lab), pTxt(pesos[j]), K(fracTex(probs[j])), K(kf(fVal(probs[j]), 4))],
                   clase: (!eq && fIgual(probs[j], probs[0])) ? '' : '' };
        });
        var fig = barras({
          items: pares.map(function (p, j) {
            return { lab: p.lab, valor: fVal(probs[j]), txt: fracTxt(probs[j]),
                     nota: 'peso ' + pTxt(pesos[j]) + ' de ' + pTxt(total) };
          }),
          max: Math.max.apply(null, probs.map(fVal)),
          cap: eq ? 'Todas las barras miden lo mismo: el experimento es <b>regular</b>.'
                  : 'Las barras miden distinto: hay resultados más probables que otros.',
          label: 'Probabilidad de cada resultado'
        });

        var veredicto = eq
          ? bien('<b>Experimento regular.</b> Los ' + probs.length + ' sucesos elementales son equiprobables, ' +
                 'cada uno con probabilidad ' + K(fracTex(probs[0])) + '. ' + insignia('Laplace aplicable', 'si') +
                 ' Puedes contar casos favorables entre casos posibles.')
          : mal('<b>Experimento NO regular.</b> Los sucesos elementales no tienen la misma probabilidad, ' +
                'así que <b>contar casos daría un resultado falso</b>. ' + insignia('Laplace inaplicable', 'no') +
                ' Si aplicaras la regla dirías que cada resultado vale ' + K(fracTex(frac(1, probs.length))) +
                ', y ya ves en la tabla que no es cierto.');

        var rescate = eq ? '' :
          nota('<b>Maniobra de rescate universal.</b> Cuando los resultados que te interesan no son ' +
               'equiprobables, busca un espacio muestral <b>más fino</b> en el que sí lo sean y agrupa después. ' +
               'Aquí el espacio fino son los ' + pTxt(total) + ' pesos elementales: sobre ellos sí vale Laplace, ' +
               'y las probabilidades de la tabla son precisamente el resultado de agrupar.');

        return fig +
          tabla(['Resultado', 'Peso', 'Probabilidad', 'Valor'], filas) +
          veredicto +
          '<div class="mx-info"><b>Comprobación obligatoria.</b> La suma de las probabilidades de todos los ' +
          'sucesos elementales tiene que valer 1: ' +
          KD(probs.map(function (p) { return fracTex(p); }).join(' + ') + ' = ' +
             fracTex(probs.reduce(function (a, p) { return fSuma(a, p); }, frac(0, 1)))) + '</div>' +
          rescate +
          (v.sim ? '' : aviso('Has marcado que <b>no</b> hay simetría física que garantice esos pesos. ' +
                              'Entonces los números que has escrito son una hipótesis tuya, no un dato: ' +
                              'la palabra clave del apartado es <b>simetría física</b>, y sin ella los pesos ' +
                              'hay que medirlos experimentando.')) +
          nota('<b>La distinción que hay que dominar.</b> «El experimento es regular» y «los sucesos que me ' +
               'interesan son equiprobables» son cosas distintas. En una clase de 30 alumnos de los que 18 son ' +
               'chicas, elegir delegado al azar <b>sí</b> es regular (los 30 tienen la misma probabilidad), y sin ' +
               'embargo los sucesos «chica» y «chico» no son equiprobables: ' +
               K('P(\\text{chico}) = ' + fracFull(frac(12, 30))) + '.');
      });
  };

  /* ==================================================================
     2) laplace — la regla de Laplace paso a paso (4.6.2)
     ================================================================== */
  R.laplace = function (node) {
    shell(node,
      'La regla de Laplace paso a paso',
      'La regla dice ' + K('P(A) = \\dfrac{n(A)}{n(E)} = \\dfrac{|A|}{|E|}') + ', pero solo <b>si el ' +
      'experimento es regular</b>. Trabaja de dos formas: en el modo <b>lista</b> escribes los resultados ' +
      'separados por espacios o comas (<code>1 2 3 4 5 6</code> y el suceso <code>2 3 5</code>); en el modo ' +
      '<b>recuentos</b> escribes directamente cuántos casos favorables y posibles hay. ' +
      'Desmarca la casilla del Paso 1 para ver qué pasa cuando el experimento no es regular.',
      [
        { id: 'modo', label: 'Modo de trabajo', type: 'select', value: 'lista', options: [
          { value: 'lista', label: 'Lista: escribo E y A resultado a resultado' },
          { value: 'num', label: 'Recuentos: escribo |A| y |E|' }
        ] },
        { id: 'E', label: 'Espacio muestral E (modo lista)', type: 'text', value: '1 2 3 4 5 6' },
        { id: 'A', label: 'Suceso A (modo lista)', type: 'text', value: '2 3 5' },
        { id: 'fav', label: 'Casos favorables |A| (modo recuentos)', type: 'number', value: 12, min: 0, max: 100000 },
        { id: 'pos', label: 'Casos posibles |E| (modo recuentos)', type: 'number', value: 30, min: 1, max: 100000 },
        { id: 'reg', label: 'Paso 1: el experimento es regular', type: 'check', value: true },
        { type: 'presets', list: [
          { label: 'Dado: número primo', title: 'A = {2, 3, 5}',
            apply: function (c) { c.modo.value = 'lista'; c.E.value = '1 2 3 4 5 6'; c.A.value = '2 3 5'; c.reg.checked = true; } },
          { label: 'Dado: múltiplo de 3',
            apply: function (c) { c.modo.value = 'lista'; c.E.value = '1 2 3 4 5 6'; c.A.value = '3 6'; c.reg.checked = true; } },
          { label: 'Dado: que no sea el 4',
            apply: function (c) { c.modo.value = 'lista'; c.E.value = '1 2 3 4 5 6'; c.A.value = '1 2 3 5 6'; c.reg.checked = true; } },
          { label: 'Urna: 3 rojas, 5 azules, 1 verde',
            apply: function (c) {
              c.modo.value = 'lista';
              c.E.value = 'R1 R2 R3 A1 A2 A3 A4 A5 V1'; c.A.value = 'R1 R2 R3'; c.reg.checked = true;
            } },
          { label: 'Urna de 5: bola blanca',
            apply: function (c) {
              c.modo.value = 'lista';
              c.E.value = 'B1 B2 B3 N4 N5'; c.A.value = 'B1 B2 B3'; c.reg.checked = true;
            } },
          { label: 'Clase de 30 con 18 chicas: sale chico',
            apply: function (c) { c.modo.value = 'num'; c.fav.value = 12; c.pos.value = 30; c.reg.checked = true; } }
        ] }
      ],
      function (v) {
        var lista_ = v.modo === 'lista';
        var E = [], A = [], fav, pos;
        if (lista_) {
          E = S.conjunto(v.E, 24, 'El espacio muestral E');
          if (E.length < 2)
            throw Error('El espacio muestral necesita al menos 2 resultados. Escribe por ejemplo: 1 2 3 4 5 6');
          A = S.conjunto(v.A, 24, 'El suceso A');
          A.forEach(function (x) {
            if (E.indexOf(x) < 0)
              throw Error('El resultado ' + x + ' del suceso A no está en E = ' + setTxt(E, E) +
                          '. Un suceso solo puede contener resultados del espacio muestral.');
          });
          A = ordena(A, E);
          fav = A.length; pos = E.length;
        } else {
          pos = entero(v.pos, 1, 100000, 'El número de casos posibles |E|');
          fav = entero(v.fav, 0, 100000, 'El número de casos favorables |A|');
          if (fav > pos)
            throw Error('No puede haber más casos favorables (' + fav + ') que posibles (' + pos + '): ' +
                        'A siempre está dentro de E, así que la probabilidad nunca pasa de 1.');
        }
        var p = frac(fav, pos);

        var cabecera = v.reg
          ? bien('<b>Paso 1 superado.</b> El experimento es regular: sus ' + pos + ' sucesos elementales son ' +
                 'equiprobables, cada uno con probabilidad ' + K(fracTex(frac(1, pos))) + '. ' +
                 'Ahora sí se puede contar.')
          : mal('<b>Paso 1 fallido.</b> Si el experimento no es regular, la regla de Laplace <b>no se aplica</b>: ' +
                'el número que aparece abajo estaría mal. Los sucesos elementales tendrían «tamaños» distintos y ' +
                'la fracción de casos dejaría de medir la probabilidad.');

        var guion = pasos([
          '<b>Comprobar que el experimento es regular.</b> ' +
            (v.reg ? 'Hecho: hay simetría y todos los resultados pesan igual.'
                   : 'No se cumple, y por tanto habría que buscar otra vía (frecuencias relativas o un espacio más fino).'),
          '<b>Contar.</b> Casos posibles ' + K('|E| = ' + pos) + ' y casos favorables ' + K('|A| = ' + fav) +
            (lista_ ? ', leyendo directamente los conjuntos ' + K('E = ' + setTex(E, E)) + ' y ' +
                      K('A = ' + setTex(A, E)) + '.' : ', tal como los has contado.'),
          '<b>Aplicar la fórmula</b> y dar el resultado en las tres escalas: ' +
            KD('P(A) = \\dfrac{|A|}{|E|} = \\dfrac{' + fav + '}{' + pos + '} = ' + fracFull(p))
        ]);

        var fig = figFraccion(fav, pos,
          'Cada casilla es un suceso elemental. La probabilidad es la <b>fracción del espacio muestral</b> ' +
          'que ocupa el suceso: ' + K(fracTex(p)) + '.');

        var complementario = fResta(frac(1, 1), p);
        var tab = tabla(['Concepto', 'Símbolo', 'Valor'], [
          ['Casos posibles', K('|E| = n(E)'), String(pos)],
          ['Casos favorables', K('|A| = n(A)'), String(fav)],
          { celdas: ['Probabilidad de A', K('P(A)'), K(fracTex(p) + ' = ' + kf(fVal(p), 4) + ' = ' + kf(100 * fVal(p), 2) + '\\,\\%')], clase: 'ap-hi' },
          ['Casos no favorables', K('|\\overline{A}|'), String(pos - fav)],
          ['Probabilidad del contrario', K('P(\\overline{A})'), K(fracTex(complementario))]
        ]);

        return cabecera + fig + tab +
          resultado(fracTxt(p) + ' = ' + nc(fVal(p), 4), 'P(A), la fracción de E que ocupa el suceso') +
          '<div class="mx-info"><b>El guion de tres pasos.</b>' + guion + '</div>' +
          (lista_ && A.length === 0
            ? nota('Has escrito el suceso <b>imposible</b> ' + K('A = \\varnothing') + ', y por eso ' +
                   K('P(A) = 0') + '. Es el extremo inferior de la escala.')
            : '') +
          (lista_ && A.length === E.length
            ? nota('Has escrito el suceso <b>seguro</b> ' + K('A = E') + ', y por eso ' + K('P(A) = 1') + '. ' +
                   'Es el extremo superior de la escala.')
            : '') +
          nota('<b>La imagen mental correcta.</b> La probabilidad mide qué fracción del espacio muestral ocupa el ' +
               'suceso. Si los sucesos elementales no tienen todos el mismo «tamaño», la fracción deja de tener ' +
               'sentido: por eso el Paso 1 no es un formalismo, es la condición que da validez a todo lo demás.') +
          aviso('<b>El error más frecuente.</b> Saltarse el Paso 1. Antes de escribir la fracción, ' +
                'pregúntate siempre: ¿hay una simetría física que garantice que todos los resultados son ' +
                'igual de probables?');
      });
  };

  /* ==================================================================
     3) urnaTresColores — urna de tres colores (4.6.2.1 y 4.6.2.2)
     ================================================================== */
  R.urnaTresColores = function (node) {
    shell(node,
      'Urna de tres colores',
      'Cambia el número de bolas de cada color con los deslizadores y elige de qué color quieres calcular la ' +
      'probabilidad. El applet cuenta las bolas, aplica Laplace y comprueba que las tres probabilidades suman 1. ' +
      'Los dos escenarios del documento son <code>3 rojas, 5 azules, 1 verde</code> y ' +
      '<code>2 rojas, 5 azules, 3 verdes</code>.',
      [
        { id: 'r', label: 'Bolas rojas', type: 'range', min: 0, max: 12, step: 1, value: 3 },
        { id: 'a', label: 'Bolas azules', type: 'range', min: 0, max: 12, step: 1, value: 5 },
        { id: 've', label: 'Bolas verdes', type: 'range', min: 0, max: 12, step: 1, value: 1 },
        { id: 'col', label: 'Color favorable', type: 'select', value: 'r', options: [
          { value: 'r', label: 'Roja' },
          { value: 'a', label: 'Azul' },
          { value: 've', label: 'Verde' },
          { value: 'nr', label: 'No roja (suceso contrario)' }
        ] },
        { type: 'presets', list: [
          { label: '3 rojas, 5 azules, 1 verde: P(roja)',
            apply: function (c) { c.r.value = 3; c.a.value = 5; c.ve.value = 1; c.col.value = 'r'; } },
          { label: '2 rojas, 5 azules, 3 verdes: P(verde)',
            apply: function (c) { c.r.value = 2; c.a.value = 5; c.ve.value = 3; c.col.value = 've'; } },
          { label: 'Urna equilibrada 4-4-4',
            apply: function (c) { c.r.value = 4; c.a.value = 4; c.ve.value = 4; c.col.value = 'r'; } },
          { label: 'Solo azules: suceso seguro',
            apply: function (c) { c.r.value = 0; c.a.value = 7; c.ve.value = 0; c.col.value = 'a'; } },
          { label: 'Sin verdes: suceso imposible',
            apply: function (c) { c.r.value = 4; c.a.value = 6; c.ve.value = 0; c.col.value = 've'; } },
          { label: 'P(no roja) con 3-5-1',
            apply: function (c) { c.r.value = 3; c.a.value = 5; c.ve.value = 1; c.col.value = 'nr'; } }
        ] }
      ],
      function (v) {
        var r = entero(v.r, 0, 12, 'El número de bolas rojas');
        var a = entero(v.a, 0, 12, 'El número de bolas azules');
        var ve = entero(v.ve, 0, 12, 'El número de bolas verdes');
        var tot = r + a + ve;
        if (tot < 1) throw Error('La urna está vacía: pon al menos una bola para poder extraer.');

        var pR = frac(r, tot), pA = frac(a, tot), pV = frac(ve, tot);
        var elegido = { r: { p: pR, n: r, lab: 'roja', tex: 'R' },
                        a: { p: pA, n: a, lab: 'azul', tex: 'A' },
                        've': { p: pV, n: ve, lab: 'verde', tex: 'V' },
                        nr: { p: fResta(frac(1, 1), pR), n: tot - r, lab: 'no roja', tex: '\\overline{R}' } }[v.col];

        var fig = pictograma({
          grupos: [
            { lab: 'Rojas', n: r, color: COL.rojo },
            { lab: 'Azules', n: a, color: COL.azul },
            { lab: 'Verdes', n: ve, color: COL.verde }
          ],
          cols: tot <= 12 ? Math.max(1, tot) : 12,
          cap: 'Las ' + tot + ' bolas de la urna. Todas tienen la misma probabilidad de ser extraídas: ' +
               'el experimento es <b>regular</b>, y por eso vale Laplace.',
          label: 'Bolas de la urna por colores'
        });

        var tab = tabla(['Color', 'Casos favorables', 'Probabilidad', 'Decimal', 'Porcentaje'], [
          { celdas: ['Roja', String(r), K(fracTex(pR)), K(kf(fVal(pR), 4)), pct(fVal(pR), 1)], clase: v.col === 'r' ? 'ap-hi' : '' },
          { celdas: ['Azul', String(a), K(fracTex(pA)), K(kf(fVal(pA), 4)), pct(fVal(pA), 1)], clase: v.col === 'a' ? 'ap-hi' : '' },
          { celdas: ['Verde', String(ve), K(fracTex(pV)), K(kf(fVal(pV), 4)), pct(fVal(pV), 1)], clase: v.col === 've' ? 'ap-hi' : '' },
          { celdas: ['<b>Total</b>', '<b>' + tot + '</b>', '<b>' + K(fracTex(fSuma(fSuma(pR, pA), pV))) + '</b>', '<b>1</b>', '<b>100 %</b>'], clase: 'ap-tot' }
        ]);

        var guion = pasos([
          'El experimento es regular: se extrae sin mirar, así que las ' + tot + ' bolas son equiprobables.',
          'Casos posibles ' + K('|E| = ' + r + ' + ' + a + ' + ' + ve + ' = ' + tot) +
            ' y casos favorables al color elegido ' + K('|A| = ' + elegido.n) + '.',
          'Regla de Laplace: ' + KD('P(\\text{' + elegido.lab + '}) = \\dfrac{' + elegido.n + '}{' + tot + '} = ' + fracFull(elegido.p))
        ]);

        var extremo = '';
        if (elegido.n === 0)
          extremo = nota('No hay ninguna bola de ese color: el suceso es <b>imposible</b> y ' + K('P = 0') + '.');
        else if (elegido.n === tot)
          extremo = nota('Todas las bolas son de ese color: el suceso es <b>seguro</b> y ' + K('P = 1') + '.');

        return fig + tab +
          resultado(fracTxt(elegido.p) + ' = ' + nc(fVal(elegido.p), 4), 'P(' + elegido.lab + ')') +
          '<div class="mx-info"><b>Resolución paso a paso.</b>' + guion + '</div>' +
          extremo +
          bien('<b>Control de errores.</b> Las probabilidades de los tres colores son sucesos incompatibles que ' +
               'cubren toda la urna, así que su suma tiene que dar 1: ' +
               K(fracTex(pR) + ' + ' + fracTex(pA) + ' + ' + fracTex(pV) + ' = ' + fracTex(fSuma(fSuma(pR, pA), pV))) +
               '. Si no diera 1, habría un error de recuento.') +
          nota('<b>Vía del contrario.</b> Para «no roja» no hace falta sumar azules y verdes: ' +
               K('P(\\overline{R}) = 1 - P(R) = 1 - ' + fracTex(pR) + ' = ' + fracTex(fResta(frac(1, 1), pR))) +
               '. Es el mismo número, pero con una resta en lugar de dos recuentos.') +
          aviso('<b>Ojo al espacio muestral.</b> Aquí ' + K('E') + ' son las <b>bolas</b> (' + tot + ' resultados ' +
                'equiprobables), no los colores. Si tomaras ' + K('E = \\{\\text{roja}, \\text{azul}, \\text{verde}\\}') +
                ' y dijeras 1/3 para cada color, estarías cometiendo un error grave, porque esos tres resultados ' +
                'no son equiprobables.');
      });
  };

  /* ==================================================================
     4) barajaLaplace — baraja española de 40 cartas (4.6.2.3)
     ================================================================== */
  var PALOS = ['oros', 'copas', 'espadas', 'bastos'];
  var VALORES = ['as', '2', '3', '4', '5', '6', '7', 'sota', 'caballo', 'rey'];
  var FIGURAS = ['sota', 'caballo', 'rey'];

  function baraja40() {
    var cartas = [];
    VALORES.forEach(function (val) {
      PALOS.forEach(function (pl) { cartas.push({ v: val, p: pl, id: val + ' de ' + pl }); });
    });
    return cartas;
  }
  /* Lee una lista de palos: «oros, copas» o «todos» */
  function leePalos(t) {
    var s = String(t == null ? '' : t).trim().toLowerCase();
    if (!s || s === 'todos' || s === 'todas' || s === 'cualquiera') return PALOS.slice();
    var L = lista(s, 4, 'La lista de palos');
    return L.map(function (x) {
      var y = x.replace(/s$/, '');
      var enc = null;
      PALOS.forEach(function (pl) { if (pl === x || pl.replace(/s$/, '') === y) enc = pl; });
      if (!enc) throw Error('No conozco el palo «' + x + '». Los palos de la baraja española son: ' +
                            'oros, copas, espadas y bastos. Escribe por ejemplo: oros, copas');
      return enc;
    });
  }
  /* Lee una lista de tipos de carta: «figura», «as», «rey», «1, 2, 3», «todos» */
  function leeTipos(t) {
    var s = String(t == null ? '' : t).trim().toLowerCase();
    if (!s || s === 'todos' || s === 'todas' || s === 'cualquiera') return VALORES.slice();
    var L = lista(s, 10, 'La lista de tipos de carta');
    var out = [];
    L.forEach(function (x) {
      if (x === 'figura' || x === 'figuras') { out = U(out, FIGURAS); return; }
      if (x === 'as' || x === 'ases' || x === '1') { out = U(out, ['as']); return; }
      if (x === 'numero' || x === 'número' || x === 'numeros' || x === 'números') {
        out = U(out, ['as', '2', '3', '4', '5', '6', '7']); return;
      }
      var enc = null;
      VALORES.forEach(function (val) { if (val === x || val.replace(/s$/, '') === x.replace(/s$/, '')) enc = val; });
      if (!enc) throw Error('No conozco el tipo de carta «' + x + '». Puedes escribir: as, 2, 3, 4, 5, 6, 7, ' +
                            'sota, caballo, rey, figura, numero o todos. Ejemplo: figura');
      out = U(out, [enc]);
    });
    return out;
  }

  R.barajaLaplace = function (node) {
    shell(node,
      'Baraja española de 40 cartas',
      'Se extrae una carta al azar de una baraja española de 40 cartas: 10 valores (as, 2, 3, 4, 5, 6, 7, sota, ' +
      'caballo y rey) por cada uno de los cuatro palos (oros, copas, espadas y bastos). ' +
      'Escribe los palos que te interesan separados por comas, por ejemplo <code>oros, copas</code> o ' +
      '<code>todos</code>; y los tipos de carta, por ejemplo <code>figura</code>, <code>as</code>, ' +
      '<code>rey</code> o <code>2, 3, 4</code>. Con el desplegable eliges si quieres la <b>intersección</b> ' +
      '(«figura <b>de</b> bastos») o la <b>unión</b> («figura <b>o</b> copas»).',
      [
        { id: 'palos', label: 'Palos', type: 'text', value: 'espadas', placeholder: 'oros, copas   ·   todos' },
        { id: 'tipos', label: 'Tipos de carta', type: 'text', value: 'todos', placeholder: 'figura   ·   as   ·   2, 3, 4   ·   todos' },
        { id: 'op', label: 'Cómo se combinan', type: 'select', value: 'y', options: [
          { value: 'y', label: 'Intersección: del palo Y del tipo (A \u2229 B)' },
          { value: 'o', label: 'Unión: del palo O del tipo (A \u222A B)' }
        ] },
        { type: 'presets', list: [
          { label: 'Una espada', apply: function (c) { c.palos.value = 'espadas'; c.tipos.value = 'todos'; c.op.value = 'y'; } },
          { label: 'Una figura', apply: function (c) { c.palos.value = 'todos'; c.tipos.value = 'figura'; c.op.value = 'y'; } },
          { label: 'Una figura de bastos', apply: function (c) { c.palos.value = 'bastos'; c.tipos.value = 'figura'; c.op.value = 'y'; } },
          { label: 'El as de oros o el as de copas', apply: function (c) { c.palos.value = 'oros, copas'; c.tipos.value = 'as'; c.op.value = 'y'; } },
          { label: 'El rey de espadas', apply: function (c) { c.palos.value = 'espadas'; c.tipos.value = 'rey'; c.op.value = 'y'; } },
          { label: 'Una figura o una copa', apply: function (c) { c.palos.value = 'copas'; c.tipos.value = 'figura'; c.op.value = 'o'; } }
        ] }
      ],
      function (v) {
        var cartas = baraja40();
        var palos = leePalos(v.palos);
        var tipos = leeTipos(v.tipos);
        var esPalo = function (c) { return palos.indexOf(c.p) >= 0; };
        var esTipo = function (c) { return tipos.indexOf(c.v) >= 0; };
        var favs = cartas.filter(function (c) {
          return v.op === 'y' ? (esPalo(c) && esTipo(c)) : (esPalo(c) || esTipo(c));
        });
        var nPalo = cartas.filter(esPalo).length;
        var nTipo = cartas.filter(esTipo).length;
        var nInt = cartas.filter(function (c) { return esPalo(c) && esTipo(c); }).length;
        var p = frac(favs.length, 40);

        var descr = (palos.length === 4 ? 'cualquier palo' : palos.join(' o ')) +
          (v.op === 'y' ? ' y ' : ' o ') +
          (tipos.length === 10 ? 'cualquier valor' : tipos.join(' o '));

        var recuento = v.op === 'y'
          ? K('|A \\cap B| = ' + nInt) + ', porque hay ' + palos.length + ' palo(s) elegido(s) y ' +
            tipos.length + ' valor(es) elegido(s), y cada combinación existe una sola vez en la baraja: ' +
            K(palos.length + ' \\cdot ' + tipos.length + ' = ' + nInt)
          : KD('|A \\cup B| = |A| + |B| - |A \\cap B| = ' + nPalo + ' + ' + nTipo + ' - ' + nInt + ' = ' + favs.length);

        var tabDoc = tabla(['Suceso', 'Casos favorables', 'Probabilidad'], [
          ['Una espada', '10', K(fracTex(frac(10, 40)) + ' = ' + kf(0.25, 4))],
          ['Una figura', '12', K(fracTex(frac(12, 40)) + ' = ' + kf(0.3, 4))],
          ['Un as', '4', K(fracTex(frac(4, 40)) + ' = ' + kf(0.1, 4))],
          ['Una figura de bastos', '3', K(fracTex(frac(3, 40)) + ' = ' + kf(0.075, 4))],
          ['El as de oros o el as de copas', '2', K(fracTex(frac(2, 40)) + ' = ' + kf(0.05, 4))],
          ['El rey de espadas', '1', K(fracTex(frac(1, 40)) + ' = ' + kf(0.025, 4))],
          ['Una figura o una copa', '19', K(fracTex(frac(19, 40)) + ' = ' + kf(0.475, 4))]
        ]);

        var fig = figFraccion(favs.length, 40,
          'Las 40 cartas de la baraja. En color, las ' + favs.length + ' favorables al suceso «' + esc(descr) + '».');

        return fig +
          resultado(fracTxt(p) + ' = ' + nc(fVal(p), 4), 'P(' + descr + ')') +
          kvs([['Casos posibles', '40'], ['Del palo elegido', String(nPalo)],
               ['Del tipo elegido', String(nTipo)], ['De las dos cosas', String(nInt)],
               ['Casos favorables', String(favs.length)]]) +
          (favs.length <= 20
            ? '<div class="mx-info"><b>Cartas favorables.</b>' +
              fichas(favs.map(function (c) { return c.id; }), 'ap-in') + '</div>'
            : '') +
          '<div class="mx-info"><b>Recuento.</b> ' + recuento + '</div>' +
          '<div class="mx-info"><b>Regla de Laplace.</b>' +
          KD('P = \\dfrac{' + favs.length + '}{40} = ' + fracFull(p)) + '</div>' +
          tabDoc +
          nota('<b>Observa la progresión de la tabla.</b> A medida que el suceso es más específico el numerador ' +
               'baja y la probabilidad se hunde: de «una espada» (10 casos) a «una figura de bastos» (3 casos) y ' +
               'de ahí a «el rey de espadas» (1 caso). Ese es el sentido intuitivo de que <b>concretar cuesta</b>.') +
          aviso('<b>«De» no es «o».</b> «Una figura <b>de</b> copas» son 3 cartas (intersección) y «una figura ' +
                '<b>o</b> una copa» son 19 (unión). Cambia el desplegable y compara: una sola palabra del ' +
                'enunciado multiplica por seis el resultado.');
      });
  };

  /* ==================================================================
     5) ambiguedad — la ambigüedad del enunciado (4.6.2.4)
     ================================================================== */
  R.ambiguedad = function (node) {
    shell(node,
      'La ambigüedad del enunciado',
      '«Calcula la probabilidad de que al lanzar un dado se obtenga un número <b>entre 2 y 5</b>». ' +
      '¿Incluye el 2 y el 5? Aquí la trampa es del idioma, no de las matemáticas. ' +
      'Elige los dos extremos y el número de caras del dado, y compara las dos lecturas posibles. ' +
      'Ejemplo literal de entrada: extremos <code>2</code> y <code>5</code> con un dado de <code>6</code> caras.',
      [
        { id: 'a', label: 'Extremo inferior', type: 'number', value: 2, min: 1, max: 20 },
        { id: 'b', label: 'Extremo superior', type: 'number', value: 5, min: 1, max: 20 },
        { id: 'caras', label: 'Caras del dado', type: 'range', min: 4, max: 20, step: 1, value: 6 },
        { id: 'ver', label: 'Lectura que defiendes', type: 'select', value: 'inc', options: [
          { value: 'inc', label: 'Inclusiva: los extremos cuentan' },
          { value: 'exc', label: 'Exclusiva: los extremos no cuentan' }
        ] },
        { type: 'presets', list: [
          { label: 'Entre 2 y 5 con un dado de 6',
            apply: function (c) { c.a.value = 2; c.b.value = 5; c.caras.value = 6; c.ver.value = 'inc'; } },
          { label: 'Entre 3 y 4: el caso extremo',
            apply: function (c) { c.a.value = 3; c.b.value = 4; c.caras.value = 6; c.ver.value = 'exc'; } },
          { label: 'Entre 1 y 6: suceso seguro (o casi)',
            apply: function (c) { c.a.value = 1; c.b.value = 6; c.caras.value = 6; c.ver.value = 'inc'; } },
          { label: 'Entre 2 y 5 con un dado de 10 caras',
            apply: function (c) { c.a.value = 2; c.b.value = 5; c.caras.value = 10; c.ver.value = 'inc'; } },
          { label: 'Entre 4 y 9 con un dado de 12 caras',
            apply: function (c) { c.a.value = 4; c.b.value = 9; c.caras.value = 12; c.ver.value = 'exc'; } }
        ] }
      ],
      function (v) {
        var caras = entero(v.caras, 4, 20, 'El número de caras');
        var a = entero(v.a, 1, caras, 'El extremo inferior');
        var b = entero(v.b, 1, caras, 'El extremo superior');
        if (a > b)
          throw Error('El extremo inferior (' + a + ') es mayor que el superior (' + b + '). ' +
                      'Escríbelos en orden: primero el pequeño, por ejemplo 2 y luego 5.');

        var E = [], i;
        for (i = 1; i <= caras; i++) E.push(String(i));
        var inc = [], exc = [];
        for (i = a; i <= b; i++) inc.push(String(i));
        for (i = a + 1; i <= b - 1; i++) exc.push(String(i));
        var pInc = frac(inc.length, caras), pExc = frac(exc.length, caras);
        var elegida = v.ver === 'inc' ? { A: inc, p: pInc } : { A: exc, p: pExc };

        var fig = figFraccion(elegida.A.length, caras,
          'Lectura ' + (v.ver === 'inc' ? '<b>inclusiva</b>' : '<b>exclusiva</b>') + ': el suceso ocupa ' +
          elegida.A.length + ' de las ' + caras + ' casillas.');

        var comparativa = '<div class="ap-grid2">' +
          tarjeta('Lectura inclusiva', 
            '<div>' + K('A = ' + setTex(inc, E)) + '</div>' +
            resultado(fracTxt(pInc) + ' = ' + nc(fVal(pInc), 3), 'P(A) con los extremos dentro'),
            v.ver === 'inc' ? 'ap-card-ok' : '') +
          tarjeta('Lectura exclusiva',
            '<div>' + K('A = ' + setTex(exc, E)) + '</div>' +
            resultado(fracTxt(pExc) + ' = ' + nc(fVal(pExc), 3), 'P(A) con los extremos fuera'),
            v.ver === 'exc' ? 'ap-card-ok' : '') +
          '</div>';

        var difer = fResta(pInc, pExc);

        return fig + comparativa +
          tabla(['Lectura', 'Suceso como conjunto', 'Casos favorables', 'Probabilidad'], [
            { celdas: ['Inclusiva', K(setTex(inc, E)), String(inc.length), K(fracTex(pInc) + ' \\approx ' + kf(fVal(pInc), 3))],
              clase: v.ver === 'inc' ? 'ap-hi' : '' },
            { celdas: ['Exclusiva', K(setTex(exc, E)), String(exc.length), K(fracTex(pExc) + ' \\approx ' + kf(fVal(pExc), 3))],
              clase: v.ver === 'exc' ? 'ap-hi' : '' }
          ]) +
          '<div class="mx-info"><b>La diferencia entre las dos lecturas</b> es exactamente la probabilidad de los ' +
          'dos extremos: ' + K('P_{inc} - P_{exc} = ' + fracTex(difer)) + '. Con un dado de ' + caras +
          ' caras cada extremo aporta ' + K(fracTex(frac(1, caras))) + '.</div>' +
          (exc.length === 0
            ? aviso('En la lectura exclusiva no queda <b>ningún</b> resultado: el suceso sería el imposible ' +
                    K('\\varnothing') + ' y ' + K('P = 0') + '. Que dos lecturas de la misma frase den 0 y un ' +
                    'valor positivo es la mejor prueba de que el enunciado está mal redactado.')
            : '') +
          nota('<b>La convención habitual</b> en matemáticas es la <b>inclusiva</b>: «entre 2 y 5» se entiende ' +
               'como ' + K('2 \\le x \\le 5') + '. Pero lo importante es la lección de método.') +
          '<div class="mx-info"><b>Lección de método.</b>' +
          pasos([
            'Antes de calcular nada, <b>escribe el suceso como conjunto</b>: ' + K('A = \\{\\ldots\\}') + '.',
            'Si al escribirlo dudas entre dos conjuntos, el enunciado es <b>ambiguo</b>.',
            'En ese caso, dilo por escrito, elige una lectura razonada y resuelve con ella. ' +
              'Un examen bien corregido valora que detectes la ambigüedad.'
          ]) + '</div>' +
          aviso('Otras expresiones igual de traicioneras: «más de 3» (¿incluye el 3?), «hasta 4», ' +
                '«como máximo 4», «al menos 4». Todas ellas hay que traducirlas a un conjunto antes de contar.');
      });
  };

  /* ==================================================================
     6) quiniela — los 14 de la quiniela (4.6.3.1)
     ================================================================== */
  R.quiniela = function (node) {
    shell(node,
      'Los 14 de la quiniela',
      'En cada partido se marca <b>1</b> (gana el local), <b>X</b> (empate) o <b>2</b> (gana el visitante). ' +
      'Rellenando al azar hay ' + K('VR_{3,14} = 3^{14}') + ' quinielas distintas. ' +
      'Elige el número de partidos y cuántos aciertos exiges: con <code>14</code> partidos y <code>14</code> ' +
      'aciertos obtienes el pleno; con <code>14</code> partidos y <code>13</code> aciertos, los casos en que ' +
      'fallas exactamente un partido. Supón que los tres signos son equiprobables.',
      [
        { id: 'n', label: 'Número de partidos', type: 'range', min: 1, max: 14, step: 1, value: 14 },
        { id: 'k', label: 'Aciertos exigidos (exactamente)', type: 'range', min: 0, max: 14, step: 1, value: 14 },
        { id: 'modo', label: 'Posición de los fallos', type: 'select', value: 'libre', options: [
          { value: 'libre', label: 'Fallas donde sea: cuentan todas las posiciones' },
          { value: 'fijo', label: 'Fallas justo los ultimos partidos' }
        ] },
        { id: 'sig', label: 'Signos por partido', type: 'select', value: '3', options: [
          { value: '3', label: '3 signos: 1, X, 2' },
          { value: '2', label: '2 signos: solo 1 o 2 (sin empates)' }
        ] },
        { type: 'presets', list: [
          { label: 'Pleno al 14',
            title: '1 caso favorable entre 3^14', apply: function (c) { c.n.value = 14; c.k.value = 14; c.sig.value = '3'; c.modo.value = 'libre'; } },
          { label: 'Los 13 primeros y fallar el último',
            title: 'Solo 2 columnas favorables: el último partido admite los dos signos equivocados',
            apply: function (c) { c.n.value = 14; c.k.value = 13; c.sig.value = '3'; c.modo.value = 'fijo'; } },
          { label: 'Exactamente 13 aciertos, falles donde falles',
            apply: function (c) { c.n.value = 14; c.k.value = 13; c.sig.value = '3'; c.modo.value = 'libre'; } },
          { label: 'Exactamente 12 aciertos',
            apply: function (c) { c.n.value = 14; c.k.value = 12; c.sig.value = '3'; c.modo.value = 'libre'; } },
          { label: 'Quiniela de 3 partidos: pleno',
            apply: function (c) { c.n.value = 3; c.k.value = 3; c.sig.value = '3'; c.modo.value = 'libre'; } },
          { label: 'Sin empates: 14 aciertos con 2 signos',
            apply: function (c) { c.n.value = 14; c.k.value = 14; c.sig.value = '2'; c.modo.value = 'libre'; } }
        ] }
      ],
      function (v) {
        var n = entero(v.n, 1, 14, 'El número de partidos');
        var k = entero(v.k, 0, 14, 'El número de aciertos exigidos');
        var s = entero(v.sig, 2, 3, 'El número de signos');
        if (k > n)
          throw Error('No puedes exigir ' + k + ' aciertos en ' + n + ' partidos. ' +
                      'Baja los aciertos o sube el número de partidos.');

        var pos = VR(s, n);                                  /* s^n con BigInt */
        var fallos = n - k;
        var fijo = v.modo === 'fijo';
        var combi = fijo ? BigInt(1) : C(n, k);        /* posiciones de los fallos */
        var fav = combi * (BigInt(s - 1) ** BigInt(fallos));
        var p = frac(Number(fav), Number(pos));
        var unoEntre = Number(pos) / Number(fav);

        var razon;
        if (fallos === 0) {
          razon = 'Solo hay <b>una</b> columna con todos los signos correctos: ' + K('|A| = 1') + '.';
        } else if (fijo) {
          razon = 'Los partidos fallados están <b>fijados</b> (' +
            (fallos === 1 ? 'es el último' : 'son los ' + fallos + ' últimos') + '), así que no hay ' +
            'nada que elegir: solo cuentan los signos equivocados que puedes poner en ellos, ' +
            K('' + (s - 1) + '^{' + fallos + '} = ' + bigTxt(fav)) + ' columnas favorables.';
        } else {
          razon = 'Hay que elegir <b>qué</b> ' + k + ' partidos aciertas, ' + K('C_{' + n + ',' + k + '} = ' + bigTxt(C(n, k))) +
            ' maneras, y en cada uno de los ' + fallos + ' partidos fallados puedes poner cualquiera de los ' +
            (s - 1) + ' signos equivocados, ' + K('' + (s - 1) + '^{' + fallos + '} = ' + bigTxt(BigInt(s - 1) ** BigInt(fallos))) +
            ' maneras. En total ' + K('|A| = ' + bigTxt(C(n, k)) + ' \\cdot ' + bigTxt(BigInt(s - 1) ** BigInt(fallos)) + ' = ' + bigTxt(fav)) + '.';
        }

        var tabAciertos = [];
        var j;
        for (j = n; j >= Math.max(0, n - 4); j--) {
          var fj = C(n, j) * (BigInt(s - 1) ** BigInt(n - j));
          tabAciertos.push({
            celdas: [String(j) + ' aciertos', bigTxt(fj),
                     K('\\dfrac{' + bigTxt(fj) + '}{' + bigTxt(pos) + '}'),
                     fija(Number(fj) / Number(pos), 8)],
            clase: j === k ? 'ap-hi' : ''
          });
        }

        return '<div class="mx-info"><b>Paso 1: ¿es regular?</b> Sí, si suponemos que en cada partido los ' + s +
          ' signos son equiprobables y que rellenas al azar. Entonces las ' + bigTxt(pos) +
          ' columnas posibles son equiprobables.</div>' +
          '<div class="mx-info"><b>Paso 2: contar.</b> Casos posibles: cada partido admite ' + s +
          ' signos y hay ' + n + ' partidos, con repetición y con orden, así que ' +
          KD('|E| = VR_{' + s + ',' + n + '} = ' + s + '^{' + n + '} = ' + bigTxt(pos)) +
          'Casos favorables: ' + razon + '</div>' +
          '<div class="mx-info"><b>Paso 3: Laplace.</b>' +
          KD('P(A) = \\dfrac{' + bigTxt(fav) + '}{' + bigTxt(pos) + '} \\approx ' + fijaTex(fVal(p), 8)) + '</div>' +
          resultado(fija(fVal(p), 8), 'P(exactamente ' + k + ' aciertos en ' + n + ' partidos)') +
          resultado('1 entre ' + nc(unoEntre, 0), 'Otra forma de decir lo mismo') +
          tabla(['Aciertos exigidos', 'Casos favorables', 'Probabilidad', 'Valor aproximado'], tabAciertos) +
          nota('La tabla cuenta siempre los fallos <b>en cualquier posición</b>. Compara sus 28 columnas de ' +
               '«13 aciertos» con las 2 que salen si exiges acertar los 13 primeros y fallar justo el último: ' +
               'la diferencia son las ' + K('C_{14,13} = 14') + ' formas de elegir el partido fallado.') +
          figFraccion(Number(fav), Number(pos),
            'Con ' + bigTxt(pos) + ' columnas posibles, la barra de las favorables es tan fina que no se ve: ' +
            'esa es la escala real del juego.') +
          nota('<b>Traducción a la vida real.</b> Rellenando una quiniela al azar cada semana, el pleno al 14 ' +
               'tocaría de media una vez cada ' + nc(4782969 / 52, 0) + ' años. Las apuestas premiadas de verdad ' +
               'no salen del azar puro, sino de saber de fútbol: por eso la hipótesis de equiprobabilidad de los ' +
               'tres signos es <b>falsa</b> en un partido real entre un grande y un recién ascendido.') +
          aviso('<b>El dado de quinielas no es la quiniela.</b> Si en lugar de tres signos usaras un dado ' +
                'con tres caras marcadas «1», dos «X» y una «2», los signos ya no serían equiprobables y ' +
                'no podrías usar ' + K('3^{14}') + '. Lo verás en el applet del dado asimétrico.') +
          '<div class="mx-info"><b>Combinatoria empleada.</b>' +
          kvs([['Variaciones con repetición', K('VR_{' + s + ',' + n + '} = ' + s + '^{' + n + '} = ' + bigTxt(pos))],
               ['Combinaciones', K('C_{' + n + ',' + k + '} = ' + bigTxt(C(n, k))) +
                 (fijo ? ' (no se usan: las posiciones están fijadas)' : '')],
               ['Casos favorables', bigTxt(fav)]]) + '</div>';
      });
  };

  /* ==================================================================
     7) primitiva — Lotería Primitiva (4.6.3.2)
     ================================================================== */
  R.primitiva = function (node) {
    shell(node,
      'Lotería Primitiva',
      'En la Primitiva se eligen 6 números distintos de entre 49, sin importar el orden. El número de apuestas ' +
      'posibles es ' + K('C_{49,6}') + '. Cambia el número de bolas del bombo y los aciertos que quieres ' +
      'calcular: con <code>49</code> bolas y <code>6</code> aciertos sale la probabilidad del pleno. ' +
      'El applet compara el resultado con riesgos cotidianos.',
      [
        { id: 'N', label: 'Bolas del bombo', type: 'range', min: 10, max: 60, step: 1, value: 49 },
        { id: 'e', label: 'Números que se eligen', type: 'range', min: 2, max: 8, step: 1, value: 6 },
        { id: 'a', label: 'Aciertos que quieres', type: 'range', min: 0, max: 8, step: 1, value: 6 },
        { type: 'presets', list: [
          { label: 'Primitiva 6/49: pleno',
            apply: function (c) { c.N.value = 49; c.e.value = 6; c.a.value = 6; } },
          { label: 'Primitiva 6/49: 5 aciertos',
            apply: function (c) { c.N.value = 49; c.e.value = 6; c.a.value = 5; } },
          { label: 'Primitiva 6/49: 4 aciertos',
            apply: function (c) { c.N.value = 49; c.e.value = 6; c.a.value = 4; } },
          { label: 'Primitiva 6/49: 3 aciertos',
            apply: function (c) { c.N.value = 49; c.e.value = 6; c.a.value = 3; } },
          { label: 'Bombo pequeño 6/20: pleno',
            apply: function (c) { c.N.value = 20; c.e.value = 6; c.a.value = 6; } },
          { label: 'Sorteo 5/45: pleno',
            apply: function (c) { c.N.value = 45; c.e.value = 5; c.a.value = 5; } }
        ] }
      ],
      function (v) {
        var N = entero(v.N, 10, 60, 'El número de bolas');
        var e = entero(v.e, 2, 8, 'La cantidad de números que se eligen');
        var a = entero(v.a, 0, 8, 'La cantidad de aciertos');
        if (e > N) throw Error('No puedes elegir ' + e + ' números de un bombo de ' + N + ' bolas.');
        if (a > e) throw Error('No puedes acertar ' + a + ' números si solo eliges ' + e + '. Baja los aciertos.');
        if (e - a > N - e)
          throw Error('Con ' + N + ' bolas y ' + e + ' elegidas no hay suficientes números fallados posibles ' +
                      'para acertar solo ' + a + '. Sube los aciertos.');

        var pos = C(N, e);
        var fav = C(e, a) * C(N - e, e - a);
        var p = frac(Number(fav), Number(pos));
        var unoEntre = Number(pos) / Number(fav);
        var semanas = unoEntre, anios = semanas / 52;

        var filas = [];
        var j;
        for (j = e; j >= 0; j--) {
          if (e - j > N - e) continue;
          var fj = C(e, j) * C(N - e, e - j);
          filas.push({
            celdas: [String(j) + ' aciertos', bigTxt(fj), fija(Number(fj) / Number(pos), 9),
                     '1 entre ' + nc(Number(pos) / Number(fj), 0)],
            clase: j === a ? 'ap-hi' : ''
          });
        }

        var comparativa = barras({
          items: [
            { lab: 'Este premio', valor: fVal(p), txt: '1 entre ' + nc(unoEntre, 0), color: COL.azul },
            { lab: 'Pleno 6/49', valor: 1 / 13983816, txt: '1 entre 13 983 816', color: COL.morado },
            { lab: 'Que te caiga un rayo', valor: 1 / 15000, txt: '1 entre 15 000', color: COL.naranja }
          ],
          max: Math.max(fVal(p), 1 / 15000),
          cap: 'Comparación de escalas. La probabilidad de que a una persona le caiga un rayo a lo largo de su ' +
               'vida es del orden de 1 entre 15 000: unas mil veces mayor que el pleno de la Primitiva.',
          label: 'Comparación de probabilidades muy pequeñas'
        });

        return '<div class="mx-info"><b>Paso 1: ¿es regular?</b> Sí: el bombo está construido para que las ' + N +
          ' bolas sean físicamente indistinguibles, luego todas las apuestas son equiprobables.</div>' +
          '<div class="mx-info"><b>Paso 2: contar.</b> El orden de las bolas no importa y no se repiten, así que ' +
          'los casos posibles son <b>combinaciones</b>:' +
          KD('|E| = C_{' + N + ',' + e + '} = \\dfrac{' + N + '!}{' + e + '!\\,(' + N + '-' + e + ')!} = ' + bigTxt(pos)) +
          'Para acertar exactamente ' + a + ' números hay que elegir ' + a + ' de los ' + e + ' premiados y ' +
          (e - a) + ' de los ' + (N - e) + ' no premiados:' +
          KD('|A| = C_{' + e + ',' + a + '} \\cdot C_{' + (N - e) + ',' + (e - a) + '} = ' +
             bigTxt(C(e, a)) + ' \\cdot ' + bigTxt(C(N - e, e - a)) + ' = ' + bigTxt(fav)) + '</div>' +
          '<div class="mx-info"><b>Paso 3: Laplace.</b>' +
          KD('P(A) = \\dfrac{' + bigTxt(fav) + '}{' + bigTxt(pos) + '} \\approx ' + fijaTex(fVal(p), 9)) + '</div>' +
          resultado(fija(fVal(p), 9), 'P(exactamente ' + a + ' aciertos)') +
          resultado('1 entre ' + nc(unoEntre, 0), 'Apuestas necesarias de media') +
          tabla(['Aciertos', 'Casos favorables', 'Probabilidad', 'Frecuencia'], filas) +
          comparativa +
          kvs([['Casos posibles', bigTxt(pos)],
               ['Casos favorables', bigTxt(fav)],
               ['Jugando una apuesta a la semana', nc(anios, 0) + ' años de media']]) +
          nota('<b>Cómo se lee un número tan pequeño.</b> Decir ' + K('P \\approx ' + fijaTex(fVal(p), 9)) +
               ' no dice nada a nadie. Decir «una vez cada ' + nc(anios, 0) + ' años jugando una apuesta ' +
               'semanal» sí. Traducir la probabilidad a una escala humana es parte de la respuesta.') +
          aviso('<b>Cuidado con el «casi imposible».</b> Que la probabilidad sea diminuta no significa que el ' +
                'suceso no ocurra: cada semana hay millones de apuestas, y por eso alguien acierta de vez en ' +
                'cuando. Lo improbable es que le toque <b>a ti</b>.');
      });
  };

  /* ==================================================================
     8) dosEtapas — Laplace en dos etapas (4.6.3.3)
     ================================================================== */
  R.dosEtapas = function (node) {
    shell(node,
      'Laplace en dos etapas',
      'Una urna tiene bolas numeradas del 1 al <i>n</i>. Se extraen <b>dos</b> bolas y con ellas se forma un ' +
      'número de dos cifras: la primera bola es la cifra de las decenas y la segunda la de las unidades. ' +
      'El caso del documento es <code>8</code> bolas, <b>sin</b> devolución y la condición ' +
      '<code>múltiplo de 5</code>. Cambia la condición y el tipo de extracción y observa cómo cambian ' +
      K('|E|') + ' y ' + K('|A|') + '.',
      [
        { id: 'n', label: 'Bolas numeradas del 1 al n', type: 'range', min: 4, max: 9, step: 1, value: 8 },
        { id: 'dev', label: 'Tipo de extracción', type: 'select', value: 'sin', options: [
          { value: 'sin', label: 'Sin devolución: las cifras son distintas' },
          { value: 'con', label: 'Con devolución: las cifras pueden repetirse' }
        ] },
        { id: 'cond', label: 'Condición sobre el número formado', type: 'select', value: 'm5', options: [
          { value: 'm5', label: 'Múltiplo de 5' },
          { value: 'm3', label: 'Múltiplo de 3' },
          { value: 'par', label: 'Par' },
          { value: 'may', label: 'Mayor que 50' },
          { value: 'cap', label: 'Capicúa (las dos cifras iguales)' }
        ] },
        { type: 'presets', list: [
          { label: '8 bolas, sin devolución, múltiplo de 5',
            apply: function (c) { c.n.value = 8; c.dev.value = 'sin'; c.cond.value = 'm5'; } },
          { label: '8 bolas, con devolución, múltiplo de 5',
            apply: function (c) { c.n.value = 8; c.dev.value = 'con'; c.cond.value = 'm5'; } },
          { label: '8 bolas, sin devolución, par',
            apply: function (c) { c.n.value = 8; c.dev.value = 'sin'; c.cond.value = 'par'; } },
          { label: '8 bolas, sin devolución, mayor que 50',
            apply: function (c) { c.n.value = 8; c.dev.value = 'sin'; c.cond.value = 'may'; } },
          { label: '6 bolas, sin devolución, múltiplo de 3',
            apply: function (c) { c.n.value = 6; c.dev.value = 'sin'; c.cond.value = 'm3'; } },
          { label: '9 bolas, con devolución, capicúa',
            apply: function (c) { c.n.value = 9; c.dev.value = 'con'; c.cond.value = 'cap'; } }
        ] }
      ],
      function (v) {
        var n = entero(v.n, 4, 9, 'El número de bolas');
        var con = v.dev === 'con';
        var i, j, todos = [], favs = [];
        var test = {
          m5: function (x) { return x % 5 === 0; },
          m3: function (x) { return x % 3 === 0; },
          par: function (x) { return x % 2 === 0; },
          may: function (x) { return x > 50; },
          cap: function (x) { return Math.floor(x / 10) === x % 10; }
        }[v.cond];
        var nombreCond = {
          m5: 'múltiplo de 5', m3: 'múltiplo de 3', par: 'par',
          may: 'mayor que 50', cap: 'capicúa'
        }[v.cond];

        for (i = 1; i <= n; i++) {
          for (j = 1; j <= n; j++) {
            if (!con && i === j) continue;
            var num = 10 * i + j;
            todos.push(num);
            if (test(num)) favs.push(num);
          }
        }
        var pos = todos.length, fav = favs.length;
        var p = frac(fav, pos);
        var formula = con
          ? K('|E| = VR_{' + n + ',2} = ' + n + '^2 = ' + pos)
          : K('|E| = V_{' + n + ',2} = ' + n + ' \\cdot ' + (n - 1) + ' = ' + pos);
        var bigFormula = con ? VR(n, 2) : V(n, 2);

        var razonamiento = v.cond === 'm5'
          ? 'Un número es múltiplo de 5 cuando acaba en 0 o en 5. Como no hay bola con el 0, ' +
            'la <b>segunda</b> bola tiene que ser forzosamente el 5. La primera puede ser cualquiera de las ' +
            'otras' + (con ? ' o el propio 5' : '') + ': ' + fav + ' casos favorables.'
          : 'Se recorren los ' + pos + ' números posibles y se cuentan los que cumplen la condición: ' +
            fav + ' casos favorables.';

        var arb = arbol({
          lab: 'Extracción',
          hijos: [
            { lab: '2.ª bola favorable', p: frac(fav, pos), color: COL.azul,
              hojaTxt: 'número ' + nombreCond },
            { lab: 'resto', p: frac(pos - fav, pos), color: COL.guia, hojaTxt: 'no cumple' }
          ]
        }, { cap: 'Visto como una sola etapa efectiva: de los ' + pos + ' números equiprobables, ' + fav +
                  ' cumplen la condición.', comprueba: true, label: 'Reparto de los casos posibles' });

        return '<div class="mx-info"><b>Paso 1: ¿es regular?</b> Sí. Las bolas son indistinguibles al tacto, ' +
          'así que todas las parejas ordenadas ' + K('(\\text{decena}, \\text{unidad})') + ' son equiprobables. ' +
          'Ojo: el espacio muestral son las <b>parejas ordenadas</b>, no los números sueltos.</div>' +
          '<div class="mx-info"><b>Paso 2: contar los casos posibles.</b> Importa el orden (el 25 no es el 52) y ' +
          (con ? 'se puede repetir cifra' : 'no se puede repetir cifra') + ', así que son ' +
          (con ? '<b>variaciones con repetición</b>' : '<b>variaciones</b>') + ':' +
          KD((con ? 'VR_{' + n + ',2} = ' + n + '^2' : 'V_{' + n + ',2} = ' + n + ' \\cdot ' + (n - 1)) +
             ' = ' + bigTxt(bigFormula)) + formula + '</div>' +
          '<div class="mx-info"><b>Paso 2b: contar los casos favorables.</b> ' + razonamiento + '</div>' +
          '<div class="mx-info"><b>Números favorables.</b>' +
          fichas(favs.slice(0, 40).map(function (x) { return String(x); }), 'ap-in') +
          (favs.length > 40 ? '<p>Se muestran los 40 primeros de ' + favs.length + '.</p>' : '') + '</div>' +
          '<div class="mx-info"><b>Paso 3: Laplace.</b>' +
          KD('P(A) = \\dfrac{' + fav + '}{' + pos + '} = ' + fracFull(p)) + '</div>' +
          resultado(fracTxt(p) + ' = ' + nc(fVal(p), 4), 'P(número ' + nombreCond + ')') +
          arb +
          figFraccion(fav, pos, 'Cada casilla es una pareja ordenada de bolas.') +
          nota('<b>La idea clave del apartado.</b> Cuando el experimento tiene varias etapas, lo difícil no es ' +
               'dividir, es <b>decidir qué es un caso</b>. Aquí un caso no es «una bola» sino «una pareja ' +
               'ordenada de bolas», y por eso se cuenta con variaciones y no con combinaciones.') +
          aviso('<b>Con devolución o sin devolución.</b> Compara los dos presets de múltiplo de 5: los ' +
                'recuentos cambian (' + K('56') + ' frente a ' + K('64') + ' casos posibles), y aun así la ' +
                'probabilidad resulta ser la misma, ' + K(fracTex(frac(1, 8))) + '. Que dos caminos den lo ' +
                'mismo no autoriza a confundirlos: hay que justificar cada recuento.');
      });
  };

  /* ==================================================================
     9) dadoCargado — el dado cargado (4.6.4.1)
     ================================================================== */
  R.dadoCargado = function (node) {
    shell(node,
      'El dado cargado',
      'Un dado trucado tiene una masilla dentro, de modo que la probabilidad de cada cara es proporcional a un ' +
      '<b>peso</b>. Escribe los seis pesos separados por comas, por ejemplo <code>1, 2, 3, 4, 5, 6</code> ' +
      '(el dado del documento, donde ' + K('p(k) = k/21') + '), y elige el suceso. ' +
      'El applet compara la probabilidad real con la que darías, mal, aplicando Laplace.',
      [
        { id: 'pesos', label: 'Pesos de las caras 1 a 6', type: 'text', value: '1, 2, 3, 4, 5, 6',
          placeholder: '1, 2, 3, 4, 5, 6   ·   1, 1, 1, 1, 1, 5' },
        { id: 'suc', label: 'Suceso', type: 'select', value: 'par', options: [
          { value: 'par', label: 'Salir par: {2, 4, 6}' },
          { value: 'impar', label: 'Salir impar: {1, 3, 5}' },
          { value: 'primo', label: 'Salir primo: {2, 3, 5}' },
          { value: 'may4', label: 'Mayor que 4: {5, 6}' },
          { value: 'seis', label: 'Salir el seis: {6}' },
          { value: 'd23', label: 'Salir 2 o 3: {2, 3}' }
        ] },
        { type: 'presets', list: [
          { label: 'p(k) = k/21: P(par) = 4/7',
            apply: function (c) { c.pesos.value = '1, 2, 3, 4, 5, 6'; c.suc.value = 'par'; } },
          { label: 'Dado no trucado',
            apply: function (c) { c.pesos.value = '1, 1, 1, 1, 1, 1'; c.suc.value = 'par'; } },
          { label: 'P(6) = 0,25 y el resto igual',
            apply: function (c) { c.pesos.value = '15, 15, 15, 15, 15, 25'; c.suc.value = 'par'; } },
          { label: 'P(par) = 0,6 reparto uniforme',
            apply: function (c) { c.pesos.value = '4, 6, 4, 6, 4, 6'; c.suc.value = 'd23'; } },
          { label: 'Cargado hacia el seis',
            apply: function (c) { c.pesos.value = '1, 1, 1, 1, 1, 5'; c.suc.value = 'seis'; } },
          { label: 'p(k) = k/21: P(primo)',
            apply: function (c) { c.pesos.value = '1, 2, 3, 4, 5, 6'; c.suc.value = 'primo'; } }
        ] }
      ],
      function (v) {
        var L = lista(v.pesos, 6, 'La lista de pesos');
        if (L.length !== 6)
          throw Error('Un dado tiene seis caras: escribe exactamente seis pesos separados por comas. ' +
                      'Ejemplo: 1, 2, 3, 4, 5, 6');
        var pesos = L.map(function (x, i) {
          var y = numero(x, 0, 100000, 'El peso de la cara ' + (i + 1));
          return decFrac(y);
        });
        var total = pesos.reduce(function (a, f) { return fSuma(a, f); }, frac(0, 1));
        if (fVal(total) <= 0) throw Error('La suma de los pesos es 0: al menos una cara debe tener peso positivo.');
        var probs = pesos.map(function (f) { return fDiv(f, total); });

        var conj = { par: [2, 4, 6], impar: [1, 3, 5], primo: [2, 3, 5],
                     may4: [5, 6], seis: [6], d23: [2, 3] }[v.suc];
        var nombre = { par: 'par', impar: 'impar', primo: 'primo', may4: 'mayor que 4',
                       seis: 'el seis', d23: '2 o 3' }[v.suc];
        var pA = conj.reduce(function (a, k) { return fSuma(a, probs[k - 1]); }, frac(0, 1));
        var pLap = frac(conj.length, 6);
        var eq = true, i;
        for (i = 1; i < 6; i++) if (!fIgual(probs[i], probs[0])) eq = false;

        var filas = [];
        for (i = 1; i <= 6; i++) {
          filas.push({
            celdas: [String(i), pTxt(pesos[i - 1]), K(fracTex(probs[i - 1])), K(kf(fVal(probs[i - 1]), 4)),
                     K(fracTex(frac(1, 6)))],
            clase: conj.indexOf(i) >= 0 ? 'ap-hi' : ''
          });
        }
        filas.push({ celdas: ['<b>Suma</b>', '<b>' + pTxt(total) + '</b>',
                              '<b>' + K(fracTex(probs.reduce(function (a, f) { return fSuma(a, f); }, frac(0, 1)))) + '</b>',
                              '<b>1</b>', '<b>1</b>'], clase: 'ap-tot' });

        var fig = barras({
          items: probs.map(function (f, k) {
            return { lab: 'cara ' + (k + 1), valor: fVal(f), txt: fracTxt(f),
                     color: conj.indexOf(k + 1) >= 0 ? COL.azul : COL.guia };
          }),
          max: Math.max.apply(null, probs.map(fVal)),
          cap: 'En azul, las caras favorables al suceso. La línea de un dado legal estaría a la altura ' +
               K(fracTex(frac(1, 6))) + ' en todas las barras.',
          label: 'Probabilidad de cada cara del dado cargado'
        });

        var difer = fResta(pA, pLap);
        var veredicto = eq
          ? bien('Los seis pesos son iguales, así que este dado <b>no está cargado</b>: coincide con Laplace.')
          : mal('<b>Este dado está cargado.</b> Aplicar Laplace daría ' + K(fracTex(pLap)) +
                ' y el valor correcto es ' + K(fracTex(pA)) + ': un error de ' +
                K(fracTex(difer) + ' \\approx ' + kf(Math.abs(fVal(difer)), 4)) + '.');

        return fig + tabla(['Cara', 'Peso', 'Probabilidad real', 'Decimal', 'Si fuera legal'], filas) +
          '<div class="mx-info"><b>Cálculo del suceso.</b> Los sucesos elementales son incompatibles, así que ' +
          'se suman sus probabilidades:' +
          KD('P(\\text{' + nombre + '}) = ' + conj.map(function (k) { return 'p(' + k + ')'; }).join(' + ') +
             ' = ' + conj.map(function (k) { return fracTex(probs[k - 1]); }).join(' + ') +
             ' = ' + fracFull(pA)) + '</div>' +
          '<div class="ap-grid2">' +
          tarjeta('Probabilidad correcta', resultado(fracTxt(pA) + ' = ' + nc(fVal(pA), 4), 'sumando los pesos'), 'ap-card-ok') +
          tarjeta('Laplace aplicado a lo bruto', resultado(fracTxt(pLap) + ' = ' + nc(fVal(pLap), 4), 'contando caras: ' + conj.length + ' de 6'), eq ? 'ap-card-ok' : 'ap-card-ko') +
          '</div>' +
          veredicto +
          bien('<b>Control obligatorio.</b> La suma de las seis probabilidades vale ' +
               K(fracTex(probs.reduce(function (a, f) { return fSuma(a, f); }, frac(0, 1)))) +
               '. Si no diera 1, el reparto de pesos estaría mal hecho.') +
          nota('<b>Lo que este applet demuestra.</b> La regla de Laplace <b>no es la definición</b> de ' +
               'probabilidad: es una fórmula válida solo cuando hay equiprobabilidad. Aquí las probabilidades ' +
               'existen y se pueden calcular perfectamente, pero <b>no</b> se obtienen contando caras.') +
          aviso('<b>De dónde salen los pesos.</b> En un dado trucado real los pesos no se leen en el enunciado: ' +
                'hay que <b>medirlos</b> lanzando el dado muchas veces y mirando las frecuencias relativas.');
      });
  };

  /* ==================================================================
     10) quinielaAsimetrica — el dado de quinielas asimétrico (4.6.4.2)
     ================================================================== */
  R.quinielaAsimetrica = function (node) {
    shell(node,
      'El dado de quinielas asimétrico',
      'Existe un dado cúbico para rellenar quinielas que lleva <b>tres caras marcadas con «1»</b>, ' +
      '<b>dos con «X»</b> y <b>una con «2»</b>. Su espacio muestral es ' + K('E = \\{1, X, 2\\}') + ', ' +
      'con solo tres resultados... que <b>no</b> son equiprobables. Mueve los deslizadores para repartir las ' +
      'seis caras (el reparto del documento es <code>3</code>, <code>2</code>, <code>1</code>) y observa la ' +
      'diferencia entre el espacio muestral grueso y el fino.',
      [
        { id: 'c1', label: 'Caras marcadas con 1', type: 'range', min: 0, max: 6, step: 1, value: 3 },
        { id: 'cx', label: 'Caras marcadas con X', type: 'range', min: 0, max: 6, step: 1, value: 2 },
        { id: 'c2', label: 'Caras marcadas con 2', type: 'range', min: 0, max: 6, step: 1, value: 1 },
        { type: 'presets', list: [
          { label: 'Dado del documento: 3, 2, 1',
            apply: function (c) { c.c1.value = 3; c.cx.value = 2; c.c2.value = 1; } },
          { label: 'Dado equilibrado: 2, 2, 2',
            apply: function (c) { c.c1.value = 2; c.cx.value = 2; c.c2.value = 2; } },
          { label: 'Muy favorable al local: 4, 1, 1',
            apply: function (c) { c.c1.value = 4; c.cx.value = 1; c.c2.value = 1; } },
          { label: 'Fábrica de empates: 1, 4, 1',
            apply: function (c) { c.c1.value = 1; c.cx.value = 4; c.c2.value = 1; } },
          { label: 'Todo unos: suceso seguro',
            apply: function (c) { c.c1.value = 6; c.cx.value = 0; c.c2.value = 0; } },
          { label: 'Sin empates: 3, 0, 3',
            apply: function (c) { c.c1.value = 3; c.cx.value = 0; c.c2.value = 3; } }
        ] }
      ],
      function (v) {
        var a = entero(v.c1, 0, 6, 'Las caras con 1');
        var b = entero(v.cx, 0, 6, 'Las caras con X');
        var c = entero(v.c2, 0, 6, 'Las caras con 2');
        var tot = a + b + c;
        if (tot !== 6)
          throw Error('Un cubo tiene 6 caras y has repartido ' + tot + '. Ajusta los deslizadores hasta que ' +
                      'la suma sea exactamente 6 (por ejemplo 3 + 2 + 1).');

        var p1 = frac(a, 6), pX = frac(b, 6), p2 = frac(c, 6);
        var simbolos = [{ s: '1', n: a, p: p1, color: COL.azul },
                        { s: 'X', n: b, p: pX, color: COL.naranja },
                        { s: '2', n: c, p: p2, color: COL.morado }];
        var presentes = simbolos.filter(function (o) { return o.n > 0; });
        var eq = presentes.length > 0 && presentes.every(function (o) { return o.n === presentes[0].n; });

        var figCaras = pictograma({
          grupos: simbolos.map(function (o) { return { lab: 'Caras con «' + o.s + '»', n: o.n, color: o.color }; }),
          cols: 6,
          cap: 'Espacio muestral <b>fino</b>: las seis caras del cubo. Estas <b>sí</b> son equiprobables, ' +
               'porque el cubo es geométricamente simétrico.',
          label: 'Las seis caras del dado de quinielas'
        });

        var figProb = barras({
          items: simbolos.map(function (o) {
            return { lab: 'signo ' + o.s, valor: fVal(o.p), txt: fracTxt(o.p),
                     nota: o.n + ' de 6 caras', color: o.color };
          }),
          max: 1,
          cap: 'Espacio muestral <b>grueso</b>: los tres signos. Aquí las barras miden distinto, y por eso ' +
               'decir «hay tres resultados, luego cada uno vale 1/3» es falso.',
          label: 'Probabilidad de cada signo'
        });

        var tab = tabla(['Signo', 'Caras favorables', 'Probabilidad correcta', 'Decimal', 'Laplace mal aplicado'],
          simbolos.map(function (o) {
            return { celdas: [K(o.s), String(o.n), K(fracTex(o.p)), K(kf(fVal(o.p), 4)), K(fracTex(frac(1, 3)))],
                     clase: '' };
          }).concat([{ celdas: ['<b>Total</b>', '<b>6</b>',
                                '<b>' + K(fracTex(fSuma(fSuma(p1, pX), p2))) + '</b>', '<b>1</b>', '<b>1</b>'],
                       clase: 'ap-tot' }]));

        return figCaras + figProb + tab +
          '<div class="ap-grid3">' +
          tarjeta('P(1)', resultado(fracTxt(p1), a + ' caras de 6'), '') +
          tarjeta('P(X)', resultado(fracTxt(pX), b + ' caras de 6'), '') +
          tarjeta('P(2)', resultado(fracTxt(p2), c + ' caras de 6'), '') +
          '</div>' +
          (eq
            ? bien('Con este reparto los signos presentes <b>sí</b> resultan equiprobables, y solo entonces ' +
                   'coincide con lo que daría Laplace aplicado a los signos.')
            : mal('<b>Trampa detectada.</b> ' + K('E = \\{1, X, 2\\}') + ' tiene tres elementos, pero no son ' +
                  'equiprobables: ' + K('P(1) = ' + fracTex(p1)) + ', ' + K('P(X) = ' + fracTex(pX)) + ' y ' +
                  K('P(2) = ' + fracTex(p2)) + '. Aplicar ' + K('1/3') + ' a cada signo sería un error.')) +
          '<div class="mx-info"><b>La maniobra de rescate.</b>' +
          pasos([
            'Busca un espacio muestral <b>más fino</b> en el que sí haya equiprobabilidad: aquí, las <b>seis ' +
              'caras</b> del cubo, que son físicamente indistinguibles.',
            'Escribe el suceso que te interesa como <b>unión</b> de sucesos elementales de ese espacio fino: ' +
              K('\\{1\\} = \\{c_1, c_2, \\ldots\\}') + ' con ' + a + ' caras.',
            'Aplica Laplace en el espacio fino y <b>agrupa</b>: ' +
              KD('P(1) = \\dfrac{' + a + '}{6} = ' + fracTex(p1) + ' \\qquad P(X) = \\dfrac{' + b + '}{6} = ' + fracTex(pX) +
                 ' \\qquad P(2) = \\dfrac{' + c + '}{6} = ' + fracTex(p2))
          ]) + '</div>' +
          bien('<b>Control.</b> Los tres signos son incompatibles y cubren todo el espacio: ' +
               K(fracTex(p1) + ' + ' + fracTex(pX) + ' + ' + fracTex(p2) + ' = ' + fracTex(fSuma(fSuma(p1, pX), p2))) + '.') +
          nota('<b>Regla general que hay que memorizar.</b> «Contar resultados» solo funciona si esos resultados ' +
               'son equiprobables. Cuando no lo son, se baja un nivel de detalle hasta encontrar un espacio ' +
               'donde sí lo sean, y luego se agrupa. Es exactamente lo que hicimos con la urna de colores: se ' +
               'cuentan <b>bolas</b>, no colores.');
      });
  };

  /* ==================================================================
     11) frecuentista — sin simetría hay que experimentar (4.6.5)
     ================================================================== */
  R.frecuentista = function (node) {
    shell(node,
      'Sin simetría: hay que experimentar',
      'En un saco hay granos de cebada y de trigo mezclados en una proporción que <b>nadie conoce</b>. ' +
      'No hay ninguna simetría que permita aplicar Laplace: la única salida es sacar granos, devolverlos y ' +
      'anotar la frecuencia relativa. Fija la proporción real (que en la vida real sería un secreto), el número ' +
      'de extracciones y una semilla, por ejemplo <code>7</code>, para poder repetir el experimento en clase.',
      [
        { id: 'p', label: 'Proporción real de cebada (secreta)', type: 'range', min: 0, max: 1, step: 0.01, value: 0.3 },
        { id: 'N', label: 'Número de extracciones', type: 'select', value: '1000', options: [
          { value: '10', label: '10 extracciones' },
          { value: '100', label: '100 extracciones' },
          { value: '1000', label: '1000 extracciones' },
          { value: '10000', label: '10 000 extracciones' }
        ] },
        { id: 'sem', label: 'Semilla del azar', type: 'number', value: 7, min: 1, max: 9999 },
        { type: 'presets', list: [
          { label: 'Cebada al 30 %, 1000 extracciones',
            apply: function (c) { c.p.value = 0.3; c.N.value = '1000'; c.sem.value = 7; } },
          { label: 'Solo 10 extracciones: mucho ruido',
            apply: function (c) { c.p.value = 0.3; c.N.value = '10'; c.sem.value = 7; } },
          { label: '10 000 extracciones: casi exacto',
            apply: function (c) { c.p.value = 0.3; c.N.value = '10000'; c.sem.value = 7; } },
          { label: 'Mezcla al 50 %',
            apply: function (c) { c.p.value = 0.5; c.N.value = '1000'; c.sem.value = 3; } },
          { label: 'Chincheta: punta arriba 0,62',
            apply: function (c) { c.p.value = 0.62; c.N.value = '1000'; c.sem.value = 11; } },
          { label: 'Suceso raro: 0,05',
            apply: function (c) { c.p.value = 0.05; c.N.value = '1000'; c.sem.value = 5; } }
        ] }
      ],
      function (v) {
        var p = numero(v.p, 0, 1, 'La proporción real');
        var N = entero(v.N, 1, 10000, 'El número de extracciones');
        var sem = entero(v.sem, 1, 9999, 'La semilla');
        var azar = rng(sem);
        var cortes = [10, 50, 100, 500, 1000, 5000, 10000].filter(function (x) { return x <= N; });
        if (cortes[cortes.length - 1] !== N) cortes.push(N);

        var exitos = 0, i, k = 0, filas = [], serie = [];
        for (i = 1; i <= N; i++) {
          if (azar() < p) exitos++;
          if (i === cortes[k]) {
            var fr = exitos / i;
            filas.push({
              celdas: [nc(i, 0), nc(exitos, 0), K(kf(fr, 4)), K(kf(Math.abs(fr - p), 4))],
              clase: i === N ? 'ap-hi' : ''
            });
            serie.push({ n: i, fr: fr });
            k++;
          }
        }
        var frFinal = exitos / N;
        var estim = decFrac(Number(frFinal.toFixed(4)));

        var figSerie = barras({
          items: serie.map(function (o) {
            return { lab: 'N = ' + nc(o.n, 0), valor: o.fr, txt: nc(o.fr, 4),
                     nota: 'error ' + nc(Math.abs(o.fr - p), 4),
                     color: Math.abs(o.fr - p) < 0.02 ? COL.verde : COL.naranja };
          }),
          max: Math.max(p * 1.6, 0.1),
          cap: 'A medida que crece el número de extracciones, la frecuencia relativa se estabiliza en torno al ' +
               'valor real ' + K(kf(p, 2)) + ': es la <b>ley de los grandes números</b>.',
          label: 'Estabilización de la frecuencia relativa'
        });

        var figComp = pictograma({
          grupos: [{ lab: 'Cebada obtenida', n: Math.round(100 * frFinal), color: COL.naranja },
                   { lab: 'Trigo obtenido', n: 100 - Math.round(100 * frFinal), color: COL.teal }],
          cols: 20,
          cap: 'Reparto estimado sobre 100 granos, según el experimento de ' + nc(N, 0) + ' extracciones.',
          label: 'Estimación de la composición del saco'
        });

        return '<div class="mx-info"><b>Paso 1: ¿es regular?</b> <b>No</b>. No hay ninguna simetría física que ' +
          'diga qué proporción de cebada hay en el saco. Laplace no sirve: no podemos escribir ' +
          K('1/2') + ' solo porque haya dos clases de grano.</div>' +
          figSerie + figComp +
          tabla(['Extracciones N', 'Granos de cebada', 'Frecuencia relativa', 'Error respecto al valor real'], filas) +
          resultado(nc(frFinal, 4), 'Estimación de P(cebada) tras ' + nc(N, 0) + ' extracciones') +
          '<div class="mx-info"><b>La definición frecuentista.</b>' +
          KD('P(A) = \\lim_{N \\to \\infty} \\dfrac{n_A}{N}') +
          'La frecuencia relativa de ' + nc(N, 0) + ' extracciones es ' + K(kf(frFinal, 4)) +
          ', que como fracción aproximada es ' + K(fracTex(estim)) + '. El valor real era ' + K(kf(p, 2)) +
          ' y el error cometido, ' + K(kf(Math.abs(frFinal - p), 4)) + '.</div>' +
          tabla(['Tipo de probabilidad', '¿Cuándo se usa?', 'Cómo se obtiene'], [
            ['A priori', 'Hay simetría o un modelo teórico', 'Laplace, combinatoria, árboles: antes de experimentar'],
            ['A posteriori', 'No hay simetría reconocible', 'Frecuencias relativas de muchas repeticiones']
          ]) +
          nota('<b>Prueba a bajar N a 10.</b> Con pocas extracciones la frecuencia relativa da saltos enormes y ' +
               'puede estar lejísimos del valor real. La probabilidad no se «ve» en unas pocas repeticiones: ' +
               'ese es el error de razonamiento que está detrás de la falacia del jugador.') +
          nota('<b>La semilla.</b> Cambiar la semilla equivale a repetir el experimento otro día. Los números ' +
               'salen distintos, pero la tendencia final es la misma: eso es precisamente lo que hace ' +
               'utilizable la definición frecuentista.') +
          aviso('<b>Límite del método.</b> La frecuencia relativa nunca da el valor exacto, solo una estimación ' +
                'cada vez mejor. Y exige poder <b>repetir</b> el experimento en las mismas condiciones: si el ' +
                'suceso ocurre una sola vez (por ejemplo «mañana lloverá»), este camino tampoco sirve.');
      });
  };

  /* ==================================================================
     12) razonInsuficiente — el principio de razón insuficiente (4.6.6.1)
     ================================================================== */
  R.razonInsuficiente = function (node) {
    shell(node,
      'El principio de razón insuficiente',
      'Bernoulli propuso repartir la probabilidad a partes iguales entre las posibilidades cuando no se sabe ' +
      'nada. El applet lleva ese principio al absurdo: escribe hipótesis <b>incompatibles</b> separadas por ' +
      'punto y coma, por ejemplo <code>habitado; deshabitado</code>, y la probabilidad que le asignas a cada ' +
      'una, por ejemplo <code>1/2</code>. Después comprueba si la suma puede valer 1.',
      [
        { id: 'hip', label: 'Hipótesis incompatibles (separadas por ;)', type: 'area',
          value: 'Marte está habitado solo por hombres; Marte está habitado solo por mujeres; Marte está habitado por hombres y mujeres',
          placeholder: 'habitado; deshabitado' },
        { id: 'p', label: 'Probabilidad asignada a cada hipótesis', type: 'text', value: '1/2' },
        { type: 'presets', list: [
          { label: 'Marte: tres hipótesis a 1/2',
            apply: function (c) {
              c.hip.value = 'Marte está habitado solo por hombres; Marte está habitado solo por mujeres; Marte está habitado por hombres y mujeres';
              c.p.value = '1/2';
            } },
          { label: 'Dos hipótesis a 1/2: coherente',
            apply: function (c) { c.hip.value = 'Marte está habitado; Marte está deshabitado'; c.p.value = '1/2'; } },
          { label: 'Cuatro hipótesis a 1/2',
            apply: function (c) {
              c.hip.value = 'solo bacterias; solo plantas; solo animales; nada de vida';
              c.p.value = '1/2';
            } },
          { label: 'Dado de seis caras a 1/6: coherente',
            apply: function (c) { c.hip.value = 'sale 1; sale 2; sale 3; sale 4; sale 5; sale 6'; c.p.value = '1/6'; } },
          { label: 'Moneda trucada: 0,6 y 0,6',
            apply: function (c) { c.hip.value = 'sale cara; sale cruz'; c.p.value = '0,6'; } },
          { label: 'Tres hipótesis a 1/3: coherente',
            apply: function (c) { c.hip.value = 'gana el local; empatan; gana el visitante'; c.p.value = '1/3'; } }
        ] }
      ],
      function (v) {
        var trozos = String(v.hip == null ? '' : v.hip).split(/[;\n]+/)
          .map(function (x) { return String(x).trim(); })
          .filter(function (x) { return x !== ''; });
        if (trozos.length < 2)
          throw Error('Escribe al menos dos hipótesis separadas por punto y coma. Ejemplo: habitado; deshabitado');
        if (trozos.length > 8)
          throw Error('Con más de ocho hipótesis la tabla se vuelve ilegible: quédate en ocho como máximo.');
        var pu = leeP(v.p, 'La probabilidad asignada a cada hipótesis');
        var k = trozos.length;
        var suma = fProd(pu, frac(k, 1));
        var coh = fIgual(suma, frac(1, 1));
        var exceso = fResta(suma, frac(1, 1));
        var justa = frac(1, k);

        var filas = trozos.map(function (t, i) {
          return { celdas: [K('H_{' + (i + 1) + '}'), esc(t), K(fracTex(pu)), K(fracTex(justa))], clase: '' };
        });
        filas.push({ celdas: ['<b>Suma</b>', '<b>' + k + ' hipótesis incompatibles</b>',
                              '<b>' + K(fracTex(suma)) + '</b>', '<b>1</b>'], clase: 'ap-tot' });

        var fig = barras({
          items: [
            { lab: 'Suma asignada', valor: fVal(suma), txt: fracTxt(suma),
              color: coh ? COL.verde : COL.rojo },
            { lab: 'Máximo permitido', valor: 1, txt: '1', color: COL.guia }
          ],
          max: Math.max(1, fVal(suma)),
          cap: coh ? 'La suma cabe justo en 1: el reparto es coherente.'
                   : 'La barra roja se sale del total disponible: el reparto es <b>imposible</b>.',
          label: 'Suma de las probabilidades asignadas'
        });

        var veredicto = coh
          ? bien('<b>Reparto coherente.</b> Las ' + k + ' hipótesis son incompatibles y su suma vale ' +
                 K(fracTex(suma)) + ' = 1, así que el reparto no contradice ninguna propiedad. ' +
                 'Coherente no significa cierto: sigue siendo una hipótesis sobre el mundo.')
          : mal('<b>Absurdo detectado.</b> ' + k + ' hipótesis incompatibles a ' + K(fracTex(pu)) +
                ' cada una suman ' + K(fracTex(suma)) + ', que ' +
                (fVal(suma) > 1 ? 'pasa de 1 en ' + K(fracTex(exceso)) : 'no llega a 1, le faltan ' +
                 K(fracTex(fResta(frac(1, 1), suma)))) +
                '. Y eso es imposible: los sucesos incompatibles que agotan las posibilidades deben sumar ' +
                'exactamente 1.');

        return fig + tabla(['Hipótesis', 'Enunciado', 'Probabilidad asignada', 'Reparto uniforme correcto'], filas) +
          veredicto +
          '<div class="mx-info"><b>El razonamiento de Bernoulli, paso a paso.</b>' +
          pasos([
            'No sé nada sobre Marte, luego «habitado» y «deshabitado» me parecen igual de plausibles: ' +
              K('P = 1/2') + ' a cada una.',
            'Pero tampoco sé nada sobre <b>quién</b> lo habita. Con el mismo principio, cada una de las ' + k +
              ' hipótesis de la tabla se lleva ' + K(fracTex(pu)) + '.',
            'Al sumar sale ' + K(fracTex(suma)) + '. ' +
              (coh ? 'En este caso concreto cuadra.'
                   : 'Contradicción: la <b>misma</b> regla, aplicada a dos descripciones distintas del mismo ' +
                     'problema, da resultados incompatibles.')
          ]) + '</div>' +
          aviso('<b>Conclusión del apartado.</b> La ignorancia <b>no genera</b> equiprobabilidad. Repartir a ' +
                'partes iguales «porque no sé nada» depende de cómo hayas troceado las posibilidades, y ' +
                'trocear es una decisión tuya, no un dato del problema.') +
          nota('<b>Su valor real: criterio negativo.</b> El principio no sirve para asignar probabilidades, ' +
               'pero sí para detectar incoherencias: si un reparto «por ignorancia» lleva a que la suma no ' +
               'valga 1, ese reparto está mal. Como test de descarte funciona; como fuente de números, no.') +
          nota('<b>Y el límite de Laplace.</b> La regla ' + K('P(A) = |A|/|E|') + ' dice cómo calcular <b>si</b> ' +
               'hay equiprobabilidad, pero no dice <b>cómo saber</b> si la hay. Eso hay que justificarlo con la ' +
               'simetría física del artefacto o midiendo frecuencias.');
      });
  };

  /* ==================================================================
     13) rango — el rango de la probabilidad (4.7.1.1)
     ================================================================== */
  R.rango = function (node) {
    shell(node,
      'El rango de la probabilidad',
      'Toda probabilidad cumple ' + K('0 \\le P(A) \\le 1') + ', porque ' + K('0 \\le |A| \\le |E|') + '. ' +
      'Escribe un valor en cualquiera de los tres formatos. ' + FORMATO_P + ' El applet lo coloca en la ' +
      'escala, lo traduce a los tres formatos y te dice si es admisible. Prueba con <code>1,4</code> y con ' +
      '<code>-0,2</code> para ver los dos errores garantizados.',
      [
        { id: 'p', label: 'Valor que quieres comprobar', type: 'text', value: '1/4',
          placeholder: '0,25   ·   1/4   ·   25%' },
        { id: 'q', label: 'Valor de referencia para comparar', type: 'range', min: 0, max: 1, step: 0.05, value: 0.5 },
        { type: 'presets', list: [
          { label: 'Suceso imposible: 0', apply: function (c) { c.p.value = '0'; c.q.value = 0.5; } },
          { label: 'Tan probable como no: 1/2', apply: function (c) { c.p.value = '1/2'; c.q.value = 0.5; } },
          { label: 'Bastante probable: 75%', apply: function (c) { c.p.value = '75%'; c.q.value = 0.5; } },
          { label: 'Suceso seguro: 1', apply: function (c) { c.p.value = '1'; c.q.value = 0.5; } },
          { label: 'Error: 1,4', apply: function (c) { c.p.value = '1,4'; c.q.value = 0.5; } },
          { label: 'Error: -0,2', apply: function (c) { c.p.value = '-0,2'; c.q.value = 0.5; } }
        ] }
      ],
      function (v) {
        var f = leeLibre(v.p, 'El valor');
        var x = fVal(f);
        var q = numero(v.q, 0, 1, 'El valor de referencia');
        var ok = x >= 0 && x <= 1;

        var etiqueta;
        if (!ok) etiqueta = 'valor inadmisible';
        else if (x === 0) etiqueta = 'suceso imposible';
        else if (x < 0.5) etiqueta = 'poco probable';
        else if (x === 0.5) etiqueta = 'tan probable como su contrario';
        else if (x < 1) etiqueta = 'bastante probable';
        else etiqueta = 'suceso seguro';

        var fig = escalaProb([
          { v: x, lab: 'tu valor: ' + pTxt(f), color: ok ? COL.azul : COL.rojo },
          { v: q, lab: 'referencia: ' + nc(q, 2), color: COL.morado }
        ], ok ? 'Todo valor admisible cae dentro del segmento. Fuera de él no hay probabilidades.'
              : 'El valor que has escrito cae <b>fuera</b> del segmento: no puede ser una probabilidad.');

        var tabRef = tabla(['Fracción', 'Decimal', 'Porcentaje', 'Significado'], [
          { celdas: [K('0'), K('0'), '0 %', 'Suceso imposible'], clase: x === 0 ? 'ap-hi' : '' },
          { celdas: [K(fracTex(frac(1, 4))), K(kf(0.25, 2)), '25 %', 'Poco probable'], clase: Math.abs(x - 0.25) < 1e-12 ? 'ap-hi' : '' },
          { celdas: [K(fracTex(frac(1, 2))), K(kf(0.5, 1)), '50 %', 'Tan probable como su contrario'], clase: Math.abs(x - 0.5) < 1e-12 ? 'ap-hi' : '' },
          { celdas: [K(fracTex(frac(3, 4))), K(kf(0.75, 2)), '75 %', 'Bastante probable'], clase: Math.abs(x - 0.75) < 1e-12 ? 'ap-hi' : '' },
          { celdas: [K('1'), K('1'), '100 %', 'Suceso seguro'], clase: x === 1 ? 'ap-hi' : '' }
        ]);

        var razon = '<div class="mx-info"><b>¿De dónde sale el rango?</b> De la propia regla de Laplace. ' +
          'Como el suceso ' + K('A') + ' está dentro de ' + K('E') + ', se cumple ' + K('0 \\le |A| \\le |E|') +
          ', y dividiendo entre ' + K('|E| > 0') + ':' +
          KD('0 \\le \\dfrac{|A|}{|E|} \\le 1 \\quad \\Longrightarrow \\quad 0 \\le P(A) \\le 1') +
          'Los dos extremos se alcanzan: ' + K('P(\\varnothing) = 0') + ' y ' + K('P(E) = 1') + '.</div>';

        var comparacion = Math.abs(x - q) < 1e-12
          ? nota('Tu valor y la referencia coinciden: los dos sucesos serían igual de probables.')
          : nota('Tu valor es <b>' + (x > q ? 'mayor' : 'menor') + '</b> que la referencia ' + K(kf(q, 2)) +
                 ', así que el suceso correspondiente es ' + (x > q ? 'más' : 'menos') + ' probable. ' +
                 'La diferencia es ' + K(kf(Math.abs(x - q), 4)) + '.');

        return fig +
          (ok
            ? bien('<b>Valor admisible.</b> ' + K(pTxt(f)) + ' está entre 0 y 1: puede ser una probabilidad. ' +
                   'Interpretación: <b>' + etiqueta + '</b>. ' + insignia('correcto', 'si'))
            : mal('<b>Valor imposible.</b> ' + K(pTxt(f)) + (x > 1
                ? ' es mayor que 1. Ninguna probabilidad pasa de 1, porque ningún suceso puede tener más casos ' +
                  'favorables que casos posibles. Un «150 % de probabilidad» no significa nada.'
                : ' es negativo. Ninguna probabilidad baja de 0, porque no se pueden contar menos de cero casos ' +
                  'favorables.') + ' ' + insignia('error garantizado', 'no'))) +
          kvs([['Fracción', pTxt(f)], ['Decimal', nc(x, 4)], ['Porcentaje', nc(100 * x, 2) + ' %'],
               ['Probabilidad del contrario', ok ? pTxt(fResta(frac(1, 1), f)) : 'no existe']]) +
          razon + tabRef + comparacion +
          '<div class="mx-info"><b>Cómo usar esto en un examen.</b>' +
          pasos([
            'Termina el ejercicio y <b>mira el número</b> que has obtenido.',
            'Si es negativo o mayor que 1, no hace falta buscar más: hay un error de cálculo seguro. ' +
              'Vuelve atrás y revisa el recuento.',
            'Si está entre 0 y 1, puede ser correcto (aunque no está garantizado): pasa entonces al ' +
              'control de la suma de sucesos elementales.'
          ]) + '</div>' +
          aviso('<b>Un matiz importante.</b> Que ' + K('P(A) = 0') + ' no significa que ' + K('A') +
                ' sea el conjunto vacío. Al medir la altura de una persona al azar, «medir exactamente ' +
                '1,750000... m» tiene probabilidad 0 y sin embargo es un suceso posible. En espacios ' +
                'finitos, en cambio, ' + K('P(A) = 0') + ' sí equivale a ' + K('A = \\varnothing') + '.');
      });
  };

  /* ==================================================================
     14) sumaElementales — la suma de los sucesos elementales (4.7.1.3)
     ================================================================== */
  R.sumaElementales = function (node) {
    shell(node,
      'La suma de los sucesos elementales',
      'Los sucesos elementales son incompatibles entre sí y entre todos cubren el espacio muestral, así que ' +
      'sus probabilidades <b>tienen que sumar 1</b>. Escribe los resultados y su probabilidad con dos puntos, ' +
      'separados por comas: <code>1:1/6, 2:1/6, 3:1/6</code>. ' + FORMATO_P + ' ' +
      'Es el control de errores más rentable de todo el tema.',
      [
        { id: 'datos', label: 'Resultados y sus probabilidades', type: 'area',
          value: '1:1/6, 2:1/6, 3:1/6, 4:1/6, 5:1/6, 6:1/6',
          placeholder: '1:1/6, 2:1/6   ·   cara:0,5, cruz:0,5   ·   1:50%, X:30%, 2:20%' },
        { type: 'presets', list: [
          { label: 'Dado no trucado',
            apply: function (c) { c.datos.value = '1:1/6, 2:1/6, 3:1/6, 4:1/6, 5:1/6, 6:1/6'; } },
          { label: 'Dado cargado p(k) = k/21',
            apply: function (c) { c.datos.value = '1:1/21, 2:2/21, 3:3/21, 4:4/21, 5:5/21, 6:6/21'; } },
          { label: 'Dado de quinielas 3-2-1',
            apply: function (c) { c.datos.value = '1:1/2, X:1/3, 2:1/6'; } },
          { label: 'Urna: 3 rojas, 5 azules, 1 verde',
            apply: function (c) { c.datos.value = 'roja:3/9, azul:5/9, verde:1/9'; } },
          { label: 'Reparto mal hecho: 0,3 tres veces',
            apply: function (c) { c.datos.value = 'A:0,3, B:0,3, C:0,3'; } },
          { label: 'Reparto que se pasa de 1',
            apply: function (c) { c.datos.value = 'cara:0,6, cruz:0,6'; } }
        ] }
      ],
      function (v) {
        var pares = leePares(v.datos, 'la lista de resultados', 12, '1:1/6, 2:1/6');
        var probs = pares.map(function (o) {
          if (o.val === null)
            throw Error('Al resultado «' + o.lab + '» le falta la probabilidad. Escribe ' + o.lab + ':1/6, ' +
                        'con dos puntos y el valor detrás.');
          return leeP(o.val, 'La probabilidad de «' + o.lab + '»');
        });
        var suma = probs.reduce(function (a, f) { return fSuma(a, f); }, frac(0, 1));
        var n = probs.length;
        var ok = fIgual(suma, frac(1, 1));
        var eq = true, i;
        for (i = 1; i < n; i++) if (!fIgual(probs[i], probs[0])) eq = false;

        var filas = pares.map(function (o, j) {
          return { celdas: [esc(o.lab), K(fracTex(probs[j])), K(kf(fVal(probs[j]), 4)), pct(fVal(probs[j]), 2)],
                   clase: '' };
        });
        filas.push({ celdas: ['<b>Suma</b>', '<b>' + K(fracTex(suma)) + '</b>',
                              '<b>' + K(kf(fVal(suma), 4)) + '</b>', '<b>' + pct(fVal(suma), 2) + '</b>'],
                     clase: ok ? 'ap-tot' : 'ap-ko' });

        var fig = barras({
          items: pares.map(function (o, j) {
            return { lab: o.lab, valor: fVal(probs[j]), txt: fracTxt(probs[j]), color: COL.azul };
          }).concat([{ lab: 'SUMA', valor: fVal(suma), txt: fracTxt(suma),
                       color: ok ? COL.verde : COL.rojo }]),
          max: Math.max(1, fVal(suma)),
          cap: 'La última barra es la suma de todas las anteriores. Debe llegar exactamente a 1.',
          label: 'Probabilidades elementales y su suma'
        });

        var normal = probs.map(function (f) { return fDiv(f, suma); });
        var arreglo = ok ? '' :
          '<div class="mx-info"><b>Cómo se arregla.</b> Si los números vienen de pesos y no de probabilidades, ' +
          'se <b>normalizan</b> dividiendo entre la suma:' +
          tabla(['Resultado', 'Valor dado', 'Valor normalizado'],
            pares.map(function (o, j) {
              return [esc(o.lab), K(fracTex(probs[j])), K(fracTex(normal[j]))];
            }).concat([['<b>Suma</b>', '<b>' + K(fracTex(suma)) + '</b>',
                        '<b>' + K(fracTex(normal.reduce(function (a, f) { return fSuma(a, f); }, frac(0, 1)))) + '</b>']])) +
          '</div>';

        return fig + tabla(['Suceso elemental', 'Probabilidad', 'Decimal', 'Porcentaje'], filas) +
          (ok
            ? bien('<b>Reparto válido.</b> ' + K(probs.map(function (f) { return fracTex(f); }).join(' + ') +
                   ' = ' + fracTex(suma)) + '. La suma vale 1, como debe ser. ' + insignia('control superado', 'si'))
            : mal('<b>Reparto imposible.</b> La suma vale ' + K(fracTex(suma) + ' = ' + kf(fVal(suma), 4)) +
                  ', y no 1. ' + (fVal(suma) > 1
                    ? 'Te has pasado en ' + K(fracTex(fResta(suma, frac(1, 1)))) + ': has repartido más ' +
                      'probabilidad de la que existe.'
                    : 'Te faltan ' + K(fracTex(fResta(frac(1, 1), suma))) + ': hay una parte del espacio ' +
                      'muestral sin asignar, o se te ha olvidado un resultado.') + ' ' +
                  insignia('control fallido', 'no'))) +
          arreglo +
          '<div class="mx-info"><b>Por qué tiene que valer 1.</b> Los ' + n + ' sucesos elementales son ' +
          'incompatibles dos a dos y su unión es todo ' + K('E') + '. Por la regla de la suma:' +
          KD('P(e_1) + P(e_2) + \\cdots + P(e_{' + n + '}) = P(E) = 1') + '</div>' +
          (eq
            ? bien('Además todos valen lo mismo, ' + K(fracTex(probs[0])) + ', luego el experimento es ' +
                   '<b>regular</b>. En un experimento regular con ' + n + ' resultados, cada uno vale ' +
                   'forzosamente ' + K(fracTex(frac(1, n))) + '.')
            : nota('Los valores no son todos iguales: el experimento <b>no</b> es regular. Eso es perfectamente ' +
                   'legítimo (el dado cargado es así), pero significa que no puedes usar Laplace contando ' +
                   'resultados.')) +
          aviso('<b>Úsalo siempre como cierre.</b> En cualquier ejercicio en que reparta probabilidades entre ' +
                'varios casos —una tabla, un árbol, un dado trucado—, suma al final. Si no da 1, hay un error ' +
                'seguro y todavía te queda tiempo de encontrarlo.');
      });
  };

  /* ==================================================================
     15) alMenos — la estrategia del «al menos» (4.7.2.1)
     ================================================================== */
  R.alMenos = function (node) {
    shell(node,
      'La estrategia del «al menos»',
      'Cuando el enunciado dice «<b>al menos</b> un…», calcular directamente obliga a sumar muchos casos. ' +
      'El contrario, en cambio, es una sola cosa: «<b>ninguno</b>». Escribe la probabilidad de éxito en una ' +
      'repetición, por ejemplo <code>1/6</code> para sacar un seis con un dado, y el número de repeticiones ' +
      'independientes, por ejemplo <code>3</code>.',
      [
        { id: 'p', label: 'Probabilidad de éxito en una repetición', type: 'text', value: '1/6',
          placeholder: '1/6   ·   0,5   ·   25%' },
        { id: 'n', label: 'Número de repeticiones', type: 'range', min: 1, max: 12, step: 1, value: 3 },
        { id: 'preg', label: 'Suceso que quieres calcular', type: 'select', value: 'almenos1', options: [
          { value: 'almenos1', label: 'Al menos un éxito' },
          { value: 'ninguno', label: 'Ningún éxito' },
          { value: 'todos', label: 'Todos son éxito' }
        ] },
        { type: 'presets', list: [
          { label: 'Dado 3 veces: al menos un seis',
            apply: function (c) { c.p.value = '1/6'; c.n.value = 3; c.preg.value = 'almenos1'; } },
          { label: 'Moneda 5 veces: al menos una cara',
            apply: function (c) { c.p.value = '1/2'; c.n.value = 5; c.preg.value = 'almenos1'; } },
          { label: 'Dado 3 veces: ningún seis',
            apply: function (c) { c.p.value = '1/6'; c.n.value = 3; c.preg.value = 'ninguno'; } },
          { label: 'Dado 10 veces: al menos un seis',
            apply: function (c) { c.p.value = '1/6'; c.n.value = 10; c.preg.value = 'almenos1'; } },
          { label: 'Una sola vez: no hay atajo',
            apply: function (c) { c.p.value = '1/6'; c.n.value = 1; c.preg.value = 'almenos1'; } },
          { label: 'Moneda 3 veces: todas caras',
            apply: function (c) { c.p.value = '1/2'; c.n.value = 3; c.preg.value = 'todos'; } }
        ] }
      ],
      function (v) {
        var p = leeP(v.p, 'La probabilidad de éxito');
        var n = entero(v.n, 1, 12, 'El número de repeticiones');
        var q = fResta(frac(1, 1), p);
        var qn = frac(1, 1), pn = frac(1, 1), i;
        for (i = 0; i < n; i++) {
          qn = fProd(qn, q);
          pn = fProd(pn, p);
          if (!Number.isSafeInteger(qn.d) || !Number.isSafeInteger(pn.d))
            throw Error('Con esta probabilidad y ' + n + ' repeticiones los denominadores se hacen enormes y ' +
                        'dejan de ser exactos. Baja el número de repeticiones o usa una fracción más sencilla ' +
                        'como 1/2 o 1/6.');
        }
        var alMenos1 = fResta(frac(1, 1), qn);
        var elegido = { almenos1: { p: alMenos1, lab: 'al menos un éxito en ' + n + ' repeticiones' },
                        ninguno: { p: qn, lab: 'ningún éxito en ' + n + ' repeticiones' },
                        todos: { p: pn, lab: 'los ' + n + ' son éxito' } }[v.preg];

        var arb = null;
        if (n <= 3) {
          var construye = function (nivel) {
            if (nivel === n) return { lab: '', hojaTxt: '' };
            var e = construye(nivel + 1), f = construye(nivel + 1);
            return { lab: 'tirada ' + (nivel + 1), hijos: [
              { lab: 'éxito', p: p, color: COL.azul, hijos: e.hijos, hojaTxt: e.hijos ? '' : 'hay éxito' },
              { lab: 'fallo', p: q, color: COL.rojo, hijos: f.hijos, hojaTxt: f.hijos ? '' : 'ningún éxito' }
            ] };
          };
          arb = arbol(construye(0), {
            cap: 'De las ' + Math.pow(2, n) + ' ramas, solo <b>una</b> lleva a «ningún éxito»: la que falla ' +
                 'todas las veces. Por eso el contrario es tan cómodo.',
            comprueba: true, label: 'Árbol de ' + n + ' repeticiones'
          });
        }

        var filas = [];
        var qk = frac(1, 1);
        for (i = 1; i <= n; i++) {
          qk = fProd(qk, q);
          filas.push({
            celdas: [String(i), K(fracTex(qk)), K(fracTex(fResta(frac(1, 1), qk))),
                     K(kf(1 - fVal(qk), 4))],
            clase: i === n ? 'ap-hi' : ''
          });
        }

        var fig = barras({
          items: [
            { lab: 'Ningún éxito', valor: fVal(qn), txt: fracTxt(qn), color: COL.rojo },
            { lab: 'Al menos uno', valor: fVal(alMenos1), txt: fracTxt(alMenos1), color: COL.verde }
          ],
          max: 1,
          cap: 'Las dos barras son sucesos contrarios: juntas llenan exactamente el total.',
          label: 'Reparto entre «ninguno» y «al menos uno»'
        });

        return '<div class="mx-info"><b>Paso 1: identificar el suceso contrario.</b> ' +
          'Si ' + K('A = ') + '«al menos un éxito», entonces ' + K('\\overline{A} = ') +
          '«ningún éxito», es decir, fallar las ' + n + ' veces.</div>' +
          '<div class="mx-info"><b>Paso 2: calcular el contrario.</b> Las repeticiones son independientes, así ' +
          'que las probabilidades se multiplican:' +
          KD('P(\\overline{A}) = \\left(' + fracTex(q) + '\\right)^{' + n + '} = ' + fracTex(qn) +
             ' \\approx ' + kf(fVal(qn), 4)) + '</div>' +
          '<div class="mx-info"><b>Paso 3: pasar al suceso pedido.</b>' +
          KD('P(A) = 1 - P(\\overline{A}) = 1 - ' + fracTex(qn) + ' = ' + fracFull(alMenos1)) + '</div>' +
          resultado(fracTxt(elegido.p) + ' = ' + nc(fVal(elegido.p), 4), 'P(' + elegido.lab + ')') +
          fig + (arb || '') +
          tabla(['Repeticiones n', 'P(ningún éxito)', 'P(al menos uno)', 'Valor'], filas) +
          kvs([['P(éxito en una)', fracTxt(p)], ['P(fallo en una)', fracTxt(q)],
               ['P(ningún éxito)', fracTxt(qn)], ['P(al menos uno)', fracTxt(alMenos1)],
               ['P(todos éxito)', fracTxt(pn)]]) +
          bien('<b>Control.</b> ' + K(fracTex(qn) + ' + ' + fracTex(alMenos1) + ' = ' +
               fracTex(fSuma(qn, alMenos1))) + '. Dos sucesos contrarios siempre suman 1.') +
          nota('<b>Por qué el atajo merece la pena.</b> Calcular «al menos uno» de frente exigiría sumar los ' +
               'casos de exactamente uno, exactamente dos, ..., exactamente ' + n + ' éxitos. El contrario es ' +
               'un solo producto. Cuanto mayor es ' + K('n') + ', más rentable es el atajo.') +
          nota('<b>Fíjate en la tabla.</b> Al crecer ' + K('n') + ', la probabilidad de «al menos uno» sube y ' +
               'se acerca a 1, pero nunca llega: repetir mucho hace el éxito casi seguro, no seguro.') +
          aviso('<b>Traducción de palabras clave.</b> «Al menos uno» = «no ninguno». «Como máximo uno» = ' +
                '«ninguno o exactamente uno». «Alguno» = «al menos uno». Traduce siempre a un conjunto o a ' +
                'un contrario antes de calcular.');
      });
  };

  /* ==================================================================
     16) sumaIncompatibles — regla de la suma con incompatibles (4.7.3.1)
     ================================================================== */
  R.sumaIncompatibles = function (node) {
    shell(node,
      'Regla de la suma con sucesos incompatibles',
      'Si dos sucesos <b>no pueden ocurrir a la vez</b> (' + K('A \\cap B = \\varnothing') + '), sus casos ' +
      'favorables no se solapan y basta sumarlos: ' + K('P(A \\cup B) = P(A) + P(B)') + '. ' +
      'Escribe los sucesos incompatibles con su probabilidad, separados por comas: ' +
      '<code>sale 2:1/6, sale 3:1/6</code>. ' + FORMATO_P,
      [
        { id: 'datos', label: 'Sucesos incompatibles y sus probabilidades', type: 'area',
          value: 'sale 2:1/6, sale 3:1/6',
          placeholder: 'sale 2:1/6, sale 3:1/6   ·   roja:3/9, verde:1/9' },
        { type: 'presets', list: [
          { label: 'Dado: sale 2 o sale 3',
            apply: function (c) { c.datos.value = 'sale 2:1/6, sale 3:1/6'; } },
          { label: 'Urna 3-5-1: roja o verde',
            apply: function (c) { c.datos.value = 'roja:3/9, verde:1/9'; } },
          { label: 'Baraja: as de oros o as de copas',
            apply: function (c) { c.datos.value = 'as de oros:1/40, as de copas:1/40'; } },
          { label: 'Dado trucado: sale 2 o sale 3',
            apply: function (c) { c.datos.value = 'sale 2:6/30, sale 3:4/30'; } },
          { label: 'Tres sucesos: P(B) = 2P(A)',
            apply: function (c) { c.datos.value = 'A:0,2, B:0,4'; } },
          { label: 'Los cuatro palos: suman 1',
            apply: function (c) { c.datos.value = 'oros:1/4, copas:1/4, espadas:1/4, bastos:1/4'; } }
        ] }
      ],
      function (v) {
        var pares = leePares(v.datos, 'la lista de sucesos', 6, 'sale 2:1/6, sale 3:1/6');
        var probs = pares.map(function (o) {
          if (o.val === null)
            throw Error('Al suceso «' + o.lab + '» le falta la probabilidad. Escribe ' + o.lab + ':1/6.');
          return leeP(o.val, 'La probabilidad de «' + o.lab + '»');
        });
        var suma = probs.reduce(function (a, f) { return fSuma(a, f); }, frac(0, 1));
        if (fVal(suma) > 1 + 1e-12)
          throw Error('Estos sucesos no pueden ser incompatibles: sus probabilidades suman ' + pTxt(suma) +
                      ', más de 1. Si no se solapan, la suma nunca puede pasar del total.');
        var n = probs.length;
        var resto = fResta(frac(1, 1), suma);

        var figVenn = venn({
          n: 2, pinta: ['a', 'b'],
          color: { a: COL.azulClaro, b: '#ffcdd2' },
          nombres: [pares[0].lab.slice(0, 10), pares[1] ? pares[1].lab.slice(0, 10) : 'B'],
          cap: 'Sucesos incompatibles: las dos regiones no se tocan, así que no hay nada que descontar. ' +
               'La intersección es ' + K('\\varnothing') + ' y ' + K('P(A \\cap B) = 0') + '.',
          label: 'Diagrama de Venn de dos sucesos incompatibles'
        });

        var figBarras = barras({
          items: pares.map(function (o, j) {
            return { lab: o.lab, valor: fVal(probs[j]), txt: fracTxt(probs[j]), color: COL.azul };
          }).concat([
            { lab: 'UNIÓN', valor: fVal(suma), txt: fracTxt(suma), color: COL.verde },
            { lab: 'Resto de E', valor: fVal(resto), txt: fracTxt(resto), color: COL.guia }
          ]),
          max: 1,
          cap: 'La barra de la unión es exactamente la suma de las anteriores: los trozos se colocan uno ' +
               'detrás de otro sin pisarse.',
          label: 'Suma de probabilidades de sucesos incompatibles'
        });

        var cuentas = probs.map(function (f) { return fracTex(f); }).join(' + ');

        return figVenn + figBarras +
          tabla(['Suceso', 'Probabilidad', 'Decimal'],
            pares.map(function (o, j) {
              return [esc(o.lab), K(fracTex(probs[j])), K(kf(fVal(probs[j]), 4))];
            }).concat([{ celdas: ['<b>Unión</b>', '<b>' + K(fracTex(suma)) + '</b>',
                                  '<b>' + K(kf(fVal(suma), 4)) + '</b>'], clase: 'ap-tot' }])) +
          '<div class="mx-info"><b>Regla de la suma para incompatibles.</b>' +
          KD('P\\left(' + pares.map(function (o, j) { return 'A_{' + (j + 1) + '}'; }).join(' \\cup ') + '\\right) = ' +
             cuentas + ' = ' + fracFull(suma)) + '</div>' +
          resultado(fracTxt(suma) + ' = ' + nc(fVal(suma), 4), 'P de la unión de los ' + n + ' sucesos') +
          '<div class="mx-info"><b>De dónde sale.</b> Con Laplace es evidente: si ' + K('A') + ' y ' + K('B') +
          ' no comparten ningún resultado, entonces ' + K('|A \\cup B| = |A| + |B|') + ', y dividiendo entre ' +
          K('|E|') + ':' + KD('P(A \\cup B) = \\dfrac{|A| + |B|}{|E|} = \\dfrac{|A|}{|E|} + \\dfrac{|B|}{|E|} = P(A) + P(B)') +
          '</div>' +
          (fIgual(suma, frac(1, 1))
            ? bien('Los sucesos suman exactamente 1: además de incompatibles, forman un <b>sistema completo</b> ' +
                   'que agota el espacio muestral. Cada resultado de ' + K('E') + ' está en uno y solo uno de ellos.')
            : nota('Queda un resto de ' + K(fracTex(resto)) + ' de probabilidad fuera de estos sucesos: ' +
                   'no agotan el espacio muestral, sino que dejan sin cubrir la parte ' +
                   K('\\overline{A_1 \\cup \\cdots \\cup A_{' + n + '}}') + '.')) +
          nota('<b>Es la Regla 2 de los árboles.</b> Cuando en un árbol sumabas las probabilidades de varios ' +
               'caminos que llevaban al mismo resultado, estabas usando esta regla: cada camino es un suceso ' +
               'incompatible con los demás.') +
          aviso('<b>Antes de sumar, comprueba la incompatibilidad.</b> Sumar sin más cuando los sucesos ' +
                '<b>sí</b> pueden ocurrir a la vez es el error más frecuente del tema: cuentas dos veces la ' +
                'parte común. Para ese caso está la regla general, con su resta.');
      });
  };

  /* ==================================================================
     17) sumaGeneral — regla de la suma en el caso general (4.7.3.2)
     ================================================================== */
  R.sumaGeneral = function (node) {
    shell(node,
      'Regla de la suma en el caso general',
      'Cuando los sucesos <b>pueden ocurrir a la vez</b>, sumar sin más cuenta dos veces la zona común. La ' +
      'fórmula correcta es ' + K('P(A \\cup B) = P(A) + P(B) - P(A \\cap B)') + '. ' +
      'Escribe los tres datos, por ejemplo <code>0,7</code>, <code>0,4</code> y <code>0,28</code> ' +
      '(el ejemplo del pelo moreno y los ojos claros). ' + FORMATO_P,
      [
        { id: 'pa', label: 'P(A)', type: 'text', value: '0,7', placeholder: '0,7   ·   7/10   ·   70%' },
        { id: 'pb', label: 'P(B)', type: 'text', value: '0,4' },
        { id: 'pi', label: 'P(A \u2229 B)', type: 'text', value: '0,28' },
        { type: 'presets', list: [
          { label: 'Pelo moreno y ojos claros',
            apply: function (c) { c.pa.value = '0,7'; c.pb.value = '0,4'; c.pi.value = '0,28'; } },
          { label: 'Gafas y ojos claros',
            apply: function (c) { c.pa.value = '0,6'; c.pb.value = '0,6'; c.pi.value = '0,52'; } },
          { label: 'Deporte e instrumento',
            apply: function (c) { c.pa.value = '0,60'; c.pb.value = '0,45'; c.pi.value = '0,25'; } },
          { label: 'Datos de ejercicio: 0,4 · 0,3 · 0,1',
            apply: function (c) { c.pa.value = '0,4'; c.pb.value = '0,3'; c.pi.value = '0,1'; } },
          { label: 'Fracciones: 1/2 · 1/3 · 1/6',
            apply: function (c) { c.pa.value = '1/2'; c.pb.value = '1/3'; c.pi.value = '1/6'; } },
          { label: 'Incompatibles: intersección 0',
            apply: function (c) { c.pa.value = '0,3'; c.pb.value = '0,2'; c.pi.value = '0'; } }
        ] }
      ],
      function (v) {
        var pA = leeP(v.pa, 'P(A)'), pB = leeP(v.pb, 'P(B)'), pI = leeP(v.pi, 'P(A \u2229 B)');
        var pU = coherente(pA, pB, pI);
        var mal_ = fSuma(pA, pB);
        var soloA = fResta(pA, pI), soloB = fResta(pB, pI);
        var fuera = fResta(frac(1, 1), pU);
        var incomp = fVal(pI) === 0;
        var indep = fIgual(pI, fProd(pA, pB));

        var figVenn = venn({
          n: 2, pinta: ['a', 'ab', 'b'],
          color: { a: COL.azulClaro, ab: COL.morado, b: '#ffcdd2' },
          cap: 'La zona morada es ' + K('A \\cap B') + ', con probabilidad ' + K(pTex(pI)) +
               '. Si sumas ' + K('P(A) + P(B)') + ' la cuentas <b>dos veces</b>: por eso hay que restarla una.',
          label: 'Diagrama de Venn de la unión de dos sucesos compatibles'
        });

        var figBarras = barras({
          items: [
            { lab: 'Solo A', valor: fVal(soloA), txt: pTxt(soloA), color: COL.azul },
            { lab: 'A y B', valor: fVal(pI), txt: pTxt(pI), color: COL.morado },
            { lab: 'Solo B', valor: fVal(soloB), txt: pTxt(soloB), color: COL.rojo },
            { lab: 'Unión', valor: fVal(pU), txt: pTxt(pU), color: COL.verde },
            { lab: 'Suma ingenua', valor: fVal(mal_), txt: pTxt(mal_), color: COL.naranja }
          ],
          max: Math.max(1, fVal(mal_)),
          cap: 'La «suma ingenua» ' + K('P(A) + P(B) = ' + pTex(mal_)) + ' se pasa exactamente en ' +
               K(pTex(pI)) + ', el trozo contado dos veces.',
          label: 'Descomposición de la unión'
        });

        return figVenn +
          '<div class="mx-info"><b>Aplicación de la fórmula.</b>' +
          KD('P(A \\cup B) = P(A) + P(B) - P(A \\cap B) = ' + pTex(pA) + ' + ' + pTex(pB) + ' - ' + pTex(pI) +
             ' = ' + pTex(pU)) + '</div>' +
          resultado(pTxt(pU), 'P(A \u222A B)') +
          figBarras +
          tabla4(pI, soloA, soloB, fuera, {
            cap: 'Los mismos datos vistos como tabla: la unión son las tres casillas que no son ' +
                 K('\\overline{A} \\cap \\overline{B}') + ', o sea ' + K('1 - ' + pTex(fuera) + ' = ' + pTex(pU)) + '.'
          }) +
          kvs([['P(A)', pTxt(pA)], ['P(B)', pTxt(pB)], ['P(A \u2229 B)', pTxt(pI)],
               ['P(A \u222A B)', pTxt(pU)], ['Suma sin restar', pTxt(mal_)],
               ['Error que cometerías', pTxt(pI)]]) +
          (incomp
            ? bien('Con ' + K('P(A \\cap B) = 0') + ' los sucesos son <b>incompatibles</b> y la fórmula general ' +
                   'se reduce a la suma simple: ' + K(pTex(pA) + ' + ' + pTex(pB) + ' = ' + pTex(pU)) + '. ' +
                   'La regla de la suma con incompatibles es un caso particular de esta.')
            : mal('<b>No puedes sumar sin restar.</b> ' + K('P(A) + P(B) = ' + pTex(mal_)) +
                  ' cuenta dos veces las personas que están en las dos categorías. ' +
                  (fVal(mal_) > 1 ? 'De hecho el resultado pasa de 1, lo que delata el error a simple vista.'
                                  : 'Aunque el resultado parezca admisible, está mal por ' + K(pTex(pI)) + '.'))) +
          '<div class="mx-info"><b>Demostración con recuentos.</b> Al contar ' + K('|A| + |B|') +
          ' los elementos de ' + K('A \\cap B') + ' se cuentan dos veces, luego ' +
          KD('|A \\cup B| = |A| + |B| - |A \\cap B|') +
          'y dividiendo todo entre ' + K('|E|') + ' se obtiene la regla. Las propiedades de la probabilidad ' +
          'no son fórmulas nuevas: son propiedades del <b>recuento</b> divididas entre ' + K('|E|') + '.</div>' +
          (indep
            ? nota('<b>Dato curioso.</b> Aquí ' + K('P(A) \\cdot P(B) = ' + pTex(fProd(pA, pB)) + ' = P(A \\cap B)') +
                   ', así que los dos sucesos son <b>independientes</b>: saber que ocurre uno no cambia la ' +
                   'probabilidad del otro. Lo estudiarás con detalle en la probabilidad condicionada.')
            : nota('<b>Dato curioso.</b> ' + K('P(A) \\cdot P(B) = ' + pTex(fProd(pA, pB))) + ' y en cambio ' +
                   K('P(A \\cap B) = ' + pTex(pI)) + '. Al no coincidir, los sucesos son <b>dependientes</b>: ' +
                   'saber que ha ocurrido uno cambia la probabilidad del otro.')) +
          aviso('<b>Control final.</b> Comprueba siempre que ' + K('P(A \\cap B) \\le P(A)') + ', que ' +
                K('P(A \\cap B) \\le P(B)') + ' y que ' + K('P(A \\cup B) \\le 1') + '. Si un enunciado ' +
                'incumple alguna de las tres, los datos son contradictorios.');
      });
  };

  /* ==================================================================
     18) cuatroRegiones — las cuatro regiones del diagrama de Venn (4.7.3.3)
     ================================================================== */
  R.cuatroRegiones = function (node) {
    shell(node,
      'Las cuatro regiones del diagrama de Venn',
      'Dos sucesos parten el espacio muestral en <b>cuatro</b> trozos que no se pisan y lo cubren todo: ' +
      K('A \\cap B') + ', ' + K('A \\cap \\overline{B}') + ', ' + K('\\overline{A} \\cap B') + ' y ' +
      K('\\overline{A} \\cap \\overline{B}') + '. Sus cuatro probabilidades suman 1. ' +
      'Da dos marginales y un dato más —la intersección o la unión— y el applet rellena la tabla como un ' +
      'sudoku. Ejemplo: <code>0,7</code>, <code>0,4</code> e intersección <code>0,28</code>.',
      [
        { id: 'pa', label: 'P(A)', type: 'text', value: '0,7' },
        { id: 'pb', label: 'P(B)', type: 'text', value: '0,4' },
        { id: 'modo', label: 'Tercer dato', type: 'select', value: 'int', options: [
          { value: 'int', label: 'Conozco P(A \u2229 B)' },
          { value: 'uni', label: 'Conozco P(A \u222A B)' }
        ] },
        { id: 'p3', label: 'Valor del tercer dato', type: 'text', value: '0,28' },
        { type: 'presets', list: [
          { label: 'Moreno y ojos claros: 0,7 · 0,4 · 0,28',
            apply: function (c) { c.pa.value = '0,7'; c.pb.value = '0,4'; c.modo.value = 'int'; c.p3.value = '0,28'; } },
          { label: 'Gafas y ojos claros: 0,6 · 0,6 · 0,52',
            apply: function (c) { c.pa.value = '0,6'; c.pb.value = '0,6'; c.modo.value = 'int'; c.p3.value = '0,52'; } },
          { label: 'Deporte e instrumento: unión 0,80',
            apply: function (c) { c.pa.value = '0,60'; c.pb.value = '0,45'; c.modo.value = 'uni'; c.p3.value = '0,80'; } },
          { label: 'Fracciones: 1/2 · 1/3 con unión 2/3',
            apply: function (c) { c.pa.value = '1/2'; c.pb.value = '1/3'; c.modo.value = 'uni'; c.p3.value = '2/3'; } },
          { label: 'Ejercicio: 0,4 · 0,5 · 0,2',
            apply: function (c) { c.pa.value = '0,4'; c.pb.value = '0,5'; c.modo.value = 'int'; c.p3.value = '0,2'; } },
          { label: 'Incompatibles: intersección 0',
            apply: function (c) { c.pa.value = '0,3'; c.pb.value = '0,45'; c.modo.value = 'int'; c.p3.value = '0'; } }
        ] }
      ],
      function (v) {
        var pA = leeP(v.pa, 'P(A)'), pB = leeP(v.pb, 'P(B)');
        var dato = leeP(v.p3, 'El tercer dato');
        var pI, pU;
        if (v.modo === 'int') {
          pI = dato; pU = coherente(pA, pB, pI);
        } else {
          pU = dato;
          if (fVal(pU) < Math.max(fVal(pA), fVal(pB)) - 1e-12)
            throw Error('Imposible: la unión ' + pTxt(pU) + ' no puede ser menor que ' +
                        (fVal(pA) > fVal(pB) ? 'P(A) = ' + pTxt(pA) : 'P(B) = ' + pTxt(pB)) +
                        ', porque cada suceso está dentro de la unión.');
          pI = fResta(fSuma(pA, pB), pU);
          if (fVal(pI) < -1e-12)
            throw Error('Imposible: de estos datos saldría una intersección negativa. Baja la unión o sube ' +
                        'las probabilidades de A y de B.');
          coherente(pA, pB, pI);
        }
        var r11 = pI, r12 = fResta(pA, pI), r21 = fResta(pB, pI);
        var r22 = fResta(frac(1, 1), fSuma(fSuma(r11, r12), r21));
        var suma4 = fSuma(fSuma(r11, r12), fSuma(r21, r22));

        var etq = [pTxt(r11), pTxt(r12), pTxt(r21), pTxt(r22)];
        var figVenn = venn({
          n: 2, pinta: ['a', 'ab', 'b', 'out'],
          color: { a: COL.azulClaro, ab: COL.morado, b: '#ffcdd2', out: '#eef2f4' },
          E: etq, A: [etq[0], etq[1]], B: [etq[0], etq[2]],
          cap: 'Las cuatro regiones con su probabilidad escrita dentro. Ninguna se solapa con otra y entre ' +
               'todas cubren el rectángulo: por eso suman 1.',
          label: 'Las cuatro regiones de un diagrama de Venn con dos sucesos'
        });

        var figBarras = barras({
          items: [
            { lab: 'A y B', valor: fVal(r11), txt: pTxt(r11), color: COL.morado },
            { lab: 'A pero no B', valor: fVal(r12), txt: pTxt(r12), color: COL.azul },
            { lab: 'B pero no A', valor: fVal(r21), txt: pTxt(r21), color: COL.rojo },
            { lab: 'Ni A ni B', valor: fVal(r22), txt: pTxt(r22), color: COL.guia }
          ],
          max: 1,
          cap: 'Las cuatro piezas del rompecabezas. Encajadas una detrás de otra miden exactamente 1.',
          label: 'Probabilidad de cada una de las cuatro regiones'
        });

        return figVenn +
          tabla4(r11, r12, r21, r22, {
            cap: 'Tabla de doble entrada: los datos del enunciado están en los márgenes y las cuatro regiones ' +
                 'en el interior. Se rellena como un sudoku: cada fila y cada columna deben cuadrar.'
          }) +
          figBarras +
          '<div class="mx-info"><b>Cómo se rellena, paso a paso.</b>' +
          pasos([
            'Coloca el <b>total</b> 1 en la esquina inferior derecha y los marginales ' +
              K('P(A) = ' + pTex(pA)) + ' y ' + K('P(B) = ' + pTex(pB)) + ' en su margen.',
            v.modo === 'int'
              ? 'Escribe el dato de la intersección en la casilla central: ' + K('P(A \\cap B) = ' + pTex(pI)) + '.'
              : 'Obtén la intersección con la regla de la suma: ' +
                K('P(A \\cap B) = P(A) + P(B) - P(A \\cup B) = ' + pTex(pA) + ' + ' + pTex(pB) + ' - ' +
                  pTex(pU) + ' = ' + pTex(pI)) + '.',
            'Completa por restas: ' + K('P(A \\cap \\overline{B}) = P(A) - P(A \\cap B) = ' + pTex(r12)) + ' y ' +
              K('P(\\overline{A} \\cap B) = P(B) - P(A \\cap B) = ' + pTex(r21)) + '.',
            'La última casilla sale del total: ' +
              K('P(\\overline{A} \\cap \\overline{B}) = 1 - P(A \\cup B) = 1 - ' + pTex(pU) + ' = ' + pTex(r22)) + '.'
          ]) + '</div>' +
          kvs([['A y B', pTxt(r11)], ['A pero no B', pTxt(r12)], ['B pero no A', pTxt(r21)],
               ['Ni A ni B', pTxt(r22)], ['Unión', pTxt(pU)]]) +
          bien('<b>Control obligatorio.</b>' +
               KD('P(A \\cap B) + P(A \\cap \\overline{B}) + P(\\overline{A} \\cap B) + P(\\overline{A} \\cap \\overline{B}) = ' +
                  pTex(r11) + ' + ' + pTex(r12) + ' + ' + pTex(r21) + ' + ' + pTex(r22) + ' = ' + pTex(suma4)) +
               'Si esta suma no diera 1, habría un error en la tabla.') +
          nota('<b>Por qué esta tabla lo resuelve casi todo.</b> Cualquier pregunta sobre ' + K('A') + ' y ' +
               K('B') + ' —unión, intersección, contrarios, diferencias, «solo uno de los dos»— se lee ' +
               'directamente sumando casillas. Con la tabla rellena no hace falta recordar fórmulas: ' +
               K('P(\\overline{A} \\cup \\overline{B})') + ', por ejemplo, son las tres casillas que no son la ' +
               'central, o sea ' + K('1 - ' + pTex(r11) + ' = ' + pTex(fResta(frac(1, 1), r11))) + '.') +
          aviso('<b>Consejo de examen.</b> En cuanto un problema hable de dos características de una población ' +
                '(«el 70 % es moreno, el 40 % tiene ojos claros, el 28 % las dos cosas»), dibuja esta tabla ' +
                'antes de calcular nada. Es más rápida y más segura que aplicar fórmulas de memoria.');
      });
  };

  /* ==================================================================
     19) haciaAtras — trabajar hacia atrás (4.7.3.8)
     ================================================================== */
  R.haciaAtras = function (node) {
    shell(node,
      'Trabajar hacia atrás',
      'La regla de la suma es una ecuación con cuatro números: ' +
      K('P(A \\cup B) = P(A) + P(B) - P(A \\cap B)') + '. Si conoces tres, el cuarto se despeja. ' +
      'Escribe los datos que tengas y deja <b>uno</b> en blanco o con una interrogación: ' +
      '<code>?</code>. El applet lo despeja y completa la tabla de las cuatro regiones.',
      [
        { id: 'pa', label: 'P(A)', type: 'text', value: '0,65', placeholder: '0,65   ·   ?' },
        { id: 'pb', label: 'P(B)', type: 'text', value: '0,47' },
        { id: 'pu', label: 'P(A \u222A B)', type: 'text', value: '0,88' },
        { id: 'pi', label: 'P(A \u2229 B)', type: 'text', value: '?' },
        { type: 'presets', list: [
          { label: 'Natación: falta la intersección',
            title: 'A = menor de 30 años, B = chico',
            apply: function (c) { c.pa.value = '0,65'; c.pb.value = '0,47'; c.pu.value = '0,88'; c.pi.value = '?'; } },
          { label: 'Falta la unión',
            apply: function (c) { c.pa.value = '0,4'; c.pb.value = '0,5'; c.pu.value = '?'; c.pi.value = '0,2'; } },
          { label: 'Fracciones: falta la intersección',
            apply: function (c) { c.pa.value = '1/2'; c.pb.value = '1/3'; c.pu.value = '2/3'; c.pi.value = '?'; } },
          { label: 'Falta P(B)',
            apply: function (c) { c.pa.value = '0,60'; c.pb.value = '?'; c.pu.value = '0,80'; c.pi.value = '0,25'; } },
          { label: 'Falta P(A)',
            apply: function (c) { c.pa.value = '?'; c.pb.value = '0,3'; c.pu.value = '0,6'; c.pi.value = '0,1'; } },
          { label: 'Incompatibles: falta la unión',
            apply: function (c) { c.pa.value = '0,3'; c.pb.value = '0,2'; c.pu.value = '?'; c.pi.value = '0'; } }
        ] }
      ],
      function (v) {
        var campos = [
          { id: 'pa', tex: 'P(A)', raw: v.pa },
          { id: 'pb', tex: 'P(B)', raw: v.pb },
          { id: 'pu', tex: 'P(A \\cup B)', raw: v.pu },
          { id: 'pi', tex: 'P(A \\cap B)', raw: v.pi }
        ];
        var vacios = campos.filter(function (c) {
          var s = String(c.raw == null ? '' : c.raw).trim();
          return s === '' || s === '?' || s === 'x';
        });
        if (vacios.length === 0)
          throw Error('Has escrito los cuatro datos: no queda nada que despejar. Deja uno en blanco o ' +
                      'escribe ? en el que quieras calcular.');
        if (vacios.length > 1)
          throw Error('Has dejado ' + vacios.length + ' datos sin escribir. La regla de la suma solo permite ' +
                      'despejar <b>uno</b>: rellena los otros.');
        var falta = vacios[0].id;
        var val = {};
        campos.forEach(function (c) {
          if (c.id !== falta) val[c.id] = leeP(c.raw, c.tex.replace(/\\c(up|ap)/, ' o '));
        });

        var despeje;
        if (falta === 'pu') {
          coherente(val.pa, val.pb, val.pi);
          val.pu = fResta(fSuma(val.pa, val.pb), val.pi);
          despeje = 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B) = ' + pTex(val.pa) + ' + ' + pTex(val.pb) +
                    ' - ' + pTex(val.pi) + ' = ' + pTex(val.pu);
        } else if (falta === 'pi') {
          val.pi = fResta(fSuma(val.pa, val.pb), val.pu);
          if (fVal(val.pi) < -1e-12)
            throw Error('De estos datos saldría una intersección negativa (' + pTxt(val.pi) + '), y eso es ' +
                        'imposible. Los datos del enunciado se contradicen: revisa la unión.');
          coherente(val.pa, val.pb, val.pi);
          despeje = 'P(A \\cap B) = P(A) + P(B) - P(A \\cup B) = ' + pTex(val.pa) + ' + ' + pTex(val.pb) +
                    ' - ' + pTex(val.pu) + ' = ' + pTex(val.pi);
        } else if (falta === 'pa') {
          val.pa = fResta(fSuma(val.pu, val.pi), val.pb);
          if (fVal(val.pa) < -1e-12 || fVal(val.pa) > 1 + 1e-12)
            throw Error('De estos datos saldría P(A) = ' + pTxt(val.pa) + ', fuera del intervalo [0, 1]: ' +
                        'los datos son incompatibles.');
          coherente(val.pa, val.pb, val.pi);
          despeje = 'P(A) = P(A \\cup B) + P(A \\cap B) - P(B) = ' + pTex(val.pu) + ' + ' + pTex(val.pi) +
                    ' - ' + pTex(val.pb) + ' = ' + pTex(val.pa);
        } else {
          val.pb = fResta(fSuma(val.pu, val.pi), val.pa);
          if (fVal(val.pb) < -1e-12 || fVal(val.pb) > 1 + 1e-12)
            throw Error('De estos datos saldría P(B) = ' + pTxt(val.pb) + ', fuera del intervalo [0, 1]: ' +
                        'los datos son incompatibles.');
          coherente(val.pa, val.pb, val.pi);
          despeje = 'P(B) = P(A \\cup B) + P(A \\cap B) - P(A) = ' + pTex(val.pu) + ' + ' + pTex(val.pi) +
                    ' - ' + pTex(val.pa) + ' = ' + pTex(val.pb);
        }

        var r11 = val.pi, r12 = fResta(val.pa, val.pi), r21 = fResta(val.pb, val.pi);
        var r22 = fResta(frac(1, 1), val.pu);
        var nombreFalta = { pa: 'P(A)', pb: 'P(B)', pu: 'P(A \u222A B)', pi: 'P(A \u2229 B)' }[falta];

        var figVenn = venn({
          n: 2, pinta: ['a', 'ab', 'b', 'out'],
          color: { a: COL.azulClaro, ab: COL.morado, b: '#ffcdd2', out: '#eef2f4' },
          E: [pTxt(r11), pTxt(r12), pTxt(r21), pTxt(r22)],
          A: [pTxt(r11), pTxt(r12)], B: [pTxt(r11), pTxt(r21)],
          cap: 'Situación completa una vez despejado el dato que faltaba.',
          label: 'Diagrama de Venn con las cuatro regiones ya calculadas'
        });

        return '<div class="mx-info"><b>Dato que falta:</b> ' + nombreFalta + '. ' +
          'Se despeja de la regla de la suma:' + KD(despeje) + '</div>' +
          resultado(pTxt(val[falta]), nombreFalta) +
          figVenn +
          tabla4(r11, r12, r21, r22, {
            cap: 'Con el dato despejado, la tabla se completa entera y responde a cualquier otra pregunta.'
          }) +
          kvs([['P(A)', pTxt(val.pa)], ['P(B)', pTxt(val.pb)], ['P(A \u222A B)', pTxt(val.pu)],
               ['P(A \u2229 B)', pTxt(val.pi)],
               ['P(A) - P(A \u2229 B)', pTxt(r12)], ['P(B) - P(A \u2229 B)', pTxt(r21)]]) +
          '<div class="mx-info"><b>El ejemplo del club de natación.</b> De los socios, el 65 % tiene menos de ' +
          '30 años (' + K('A') + ') y el 53 % son chicas. Se sabe además que ' +
          K('P(\\overline{B} \\cup A) = 0{,}88') + ', donde ' + K('B') + ' es «ser chica». ' +
          pasos([
            'Traduce lo que te dan: si el 53 % son chicas, entonces ' +
              K('P(\\overline{B}) = 1 - 0{,}53 = 0{,}47') + ' son chicos.',
            'Aplica la regla de la suma a los sucesos «chico» y «menor de 30»: ' +
              K('0{,}88 = 0{,}47 + 0{,}65 - P(\\overline{B} \\cap A)') + '.',
            'Despeja: ' + K('P(\\overline{B} \\cap A) = 0{,}47 + 0{,}65 - 0{,}88 = 0{,}24') +
              ', el 24 % son chicos menores de 30.',
            'Y de ahí sale lo que normalmente pide el enunciado: ' +
              K('P(B \\cap A) = P(A) - P(\\overline{B} \\cap A) = 0{,}65 - 0{,}24 = 0{,}41') +
              ', el 41 % son chicas menores de 30.'
          ]) + 'El preset «Natación» carga exactamente estos números con ' + K('B = \\text{chico}') + '.</div>' +
          bien('<b>Control.</b> Las cuatro regiones suman ' +
               K(pTex(r11) + ' + ' + pTex(r12) + ' + ' + pTex(r21) + ' + ' + pTex(r22) + ' = ' +
                 pTex(fSuma(fSuma(r11, r12), fSuma(r21, r22)))) + '.') +
          nota('<b>Método general.</b> Traduce cada frase del enunciado a una probabilidad, mira qué te falta ' +
               'en la ecuación de la suma y despéjalo. Trabajar hacia atrás no es un truco: es resolver una ' +
               'ecuación de primer grado con los datos colocados en su sitio.') +
          aviso('<b>Cuidado con los contrarios del enunciado.</b> «El 53 % son chicas» y «el 47 % son chicos» ' +
                'son el mismo dato dicho de dos maneras. Antes de sustituir en la fórmula, asegúrate de que ' +
                'todas tus probabilidades se refieren a los sucesos que has llamado ' + K('A') + ' y ' + K('B') + '.');
      });
  };

  /* ==================================================================
     20) consecuencias — consecuencias útiles de la regla de la suma
                         (4.7.3.4 y 4.7.3.5)
     ================================================================== */
  R.consecuencias = function (node) {
    shell(node,
      'Consecuencias útiles de la regla de la suma',
      'De la regla de la suma y del suceso contrario salen todas las fórmulas del formulario. ' +
      'Escribe los tres datos —por ejemplo <code>0,7</code>, <code>0,4</code> y <code>0,28</code>— y elige ' +
      'qué consecuencia quieres ver destacada en el diagrama. La tabla resumen se calcula siempre con tus ' +
      'números, para que compruebes cada fórmula con un caso concreto.',
      [
        { id: 'pa', label: 'P(A)', type: 'text', value: '0,7' },
        { id: 'pb', label: 'P(B)', type: 'text', value: '0,4' },
        { id: 'pi', label: 'P(A \u2229 B)', type: 'text', value: '0,28' },
        { id: 'foco', label: 'Consecuencia destacada', type: 'select', value: 'todas', options: [
          { value: 'todas', label: 'Todas: solo la tabla resumen' },
          { value: 'contrario', label: 'Suceso contrario' },
          { value: 'monotonia', label: 'Monotonía: si A esta dentro de B' },
          { value: 'diferencia', label: 'Diferencia: P(A - B)' },
          { value: 'morgan', label: 'De Morgan probabilístico' }
        ] },
        { type: 'presets', list: [
          { label: 'Moreno y ojos claros: 0,7 · 0,4 · 0,28',
            apply: function (c) { c.pa.value = '0,7'; c.pb.value = '0,4'; c.pi.value = '0,28'; c.foco.value = 'todas'; } },
          { label: 'Gafas y ojos claros: De Morgan',
            apply: function (c) { c.pa.value = '0,6'; c.pb.value = '0,6'; c.pi.value = '0,52'; c.foco.value = 'morgan'; } },
          { label: 'A dentro de B: monotonía',
            apply: function (c) { c.pa.value = '0,3'; c.pb.value = '0,5'; c.pi.value = '0,3'; c.foco.value = 'monotonia'; } },
          { label: 'Ejercicio 0,4 · 0,3 · 0,1: diferencia',
            apply: function (c) { c.pa.value = '0,4'; c.pb.value = '0,3'; c.pi.value = '0,1'; c.foco.value = 'diferencia'; } },
          { label: 'Incompatibles: contrario',
            apply: function (c) { c.pa.value = '0,3'; c.pb.value = '0,2'; c.pi.value = '0'; c.foco.value = 'contrario'; } },
          { label: 'Fracciones: 1/2 · 1/3 · 1/6',
            apply: function (c) { c.pa.value = '1/2'; c.pb.value = '1/3'; c.pi.value = '1/6'; c.foco.value = 'todas'; } }
        ] }
      ],
      function (v) {
        var pA = leeP(v.pa, 'P(A)'), pB = leeP(v.pb, 'P(B)'), pI = leeP(v.pi, 'P(A \u2229 B)');
        var pU = coherente(pA, pB, pI);
        var nA = fResta(frac(1, 1), pA), nB = fResta(frac(1, 1), pB);
        var dAB = fResta(pA, pI), dBA = fResta(pB, pI);
        var nUnion = fResta(frac(1, 1), pI);      /* P(no A o no B) */
        var nInter = fResta(frac(1, 1), pU);      /* P(no A y no B) */
        var soloUno = fSuma(dAB, dBA);
        var dentro = fIgual(pI, pA);

        var foco = v.foco;
        var vennSpec = { todas: ['a', 'ab', 'b'], contrario: ['b', 'out'],
                         monotonia: ['ab'], diferencia: ['a'], morgan: ['a', 'b', 'out'] }[foco];
        var vennCap = {
          todas: 'Los tres trozos de la unión. Todas las fórmulas de la tabla se leen sumando o restando ' +
                 'regiones de este dibujo.',
          contrario: 'En color, todo lo que <b>no</b> es ' + K('A') + '. Sumado con ' + K('A') + ' llena el ' +
                     'rectángulo: por eso ' + K('P(\\overline{A}) = 1 - P(A)') + '.',
          monotonia: 'En color, ' + K('A \\cap B') + '. Si ' + K('A') + ' estuviera enteramente dentro de ' +
                     K('B') + ', esta región sería ' + K('A') + ' completo y se tendría ' + K('P(A) \\le P(B)') + '.',
          diferencia: 'En color, ' + K('A - B = A \\cap \\overline{B}') + ': lo que le queda a ' + K('A') +
                      ' al quitarle la parte compartida.',
          morgan: 'En color, ' + K('\\overline{A} \\cup \\overline{B}') + ': todo menos la zona central. ' +
                  'De ahí que ' + K('P(\\overline{A} \\cup \\overline{B}) = 1 - P(A \\cap B)') + '.'
        }[foco];

        var figVenn = venn({
          n: 2, pinta: vennSpec,
          color: foco === 'diferencia' ? COL.azulClaro
               : (foco === 'monotonia' ? COL.morado : COL.azulClaro),
          cap: vennCap,
          label: 'Diagrama de Venn con la región destacada'
        });

        var resumen = tabla(['Nombre', 'Fórmula', 'Con tus datos'], [
          { celdas: ['Rango', K('0 \\le P(A) \\le 1'), K('0 \\le ' + pTex(pA) + ' \\le 1')], clase: '' },
          { celdas: ['Suceso seguro e imposible', K('P(E) = 1, \\; P(\\varnothing) = 0'), K('1 \\text{ y } 0')], clase: '' },
          { celdas: ['Suceso contrario', K('P(\\overline{A}) = 1 - P(A)'),
                     K('P(\\overline{A}) = ' + pTex(nA) + ', \\; P(\\overline{B}) = ' + pTex(nB))],
            clase: foco === 'contrario' ? 'ap-hi' : '' },
          { celdas: ['Suma con incompatibles', K('P(A \\cup B) = P(A) + P(B)'),
                     fVal(pI) === 0 ? K(pTex(pA) + ' + ' + pTex(pB) + ' = ' + pTex(pU)) : 'no aplicable: ' + K('P(A \\cap B) \\neq 0')],
            clase: '' },
          { celdas: ['Suma en general', K('P(A \\cup B) = P(A) + P(B) - P(A \\cap B)'), K(pTex(pU))], clase: '' },
          { celdas: ['Monotonía', K('A \\subset B \\Rightarrow P(A) \\le P(B)'),
                     dentro ? K(pTex(pA) + ' \\le ' + pTex(pB)) + ' y aquí sí se cumple ' + K('A \\subset B')
                            : 'no se sabe: ' + K('P(A \\cap B) \\neq P(A)')],
            clase: foco === 'monotonia' ? 'ap-hi' : '' },
          { celdas: ['Diferencia', K('P(A - B) = P(A) - P(A \\cap B)'), K(pTex(dAB))],
            clase: foco === 'diferencia' ? 'ap-hi' : '' },
          { celdas: ['De Morgan (unión)', K('P(\\overline{A} \\cup \\overline{B}) = 1 - P(A \\cap B)'), K(pTex(nUnion))],
            clase: foco === 'morgan' ? 'ap-hi' : '' },
          { celdas: ['De Morgan (intersección)', K('P(\\overline{A} \\cap \\overline{B}) = 1 - P(A \\cup B)'), K(pTex(nInter))],
            clase: foco === 'morgan' ? 'ap-hi' : '' },
          { celdas: ['Exactamente uno de los dos', K('P(A \\triangle B) = P(A) + P(B) - 2P(A \\cap B)'), K(pTex(soloUno))],
            clase: '' }
        ]);

        var figBarras = barras({
          items: [
            { lab: 'P(A)', valor: fVal(pA), txt: pTxt(pA), color: COL.azul },
            { lab: 'P(no A)', valor: fVal(nA), txt: pTxt(nA), color: COL.guia },
            { lab: 'P(A - B)', valor: fVal(dAB), txt: pTxt(dAB), color: COL.teal },
            { lab: 'P(B - A)', valor: fVal(dBA), txt: pTxt(dBA), color: COL.naranja },
            { lab: 'P(no A o no B)', valor: fVal(nUnion), txt: pTxt(nUnion), color: COL.morado },
            { lab: 'P(no A y no B)', valor: fVal(nInter), txt: pTxt(nInter), color: COL.rojo }
          ],
          max: 1,
          cap: 'Todas estas cantidades salen de los mismos tres datos, sin ningún dato nuevo.',
          label: 'Consecuencias de la regla de la suma con los datos actuales'
        });

        return figVenn + resumen + figBarras +
          tabla4(pI, dAB, dBA, nInter, {
            cap: 'La tabla de las cuatro regiones es el mejor resumen: cada fórmula de arriba es una suma de ' +
                 'casillas de esta tabla.'
          }) +
          '<div class="mx-info"><b>Demostración de la diferencia.</b> ' + K('A') + ' se parte en dos trozos ' +
          'incompatibles: la parte compartida con ' + K('B') + ' y la que no:' +
          KD('A = (A \\cap B) \\cup (A \\cap \\overline{B}) \\;\\Rightarrow\\; P(A) = P(A \\cap B) + P(A - B)') +
          'y de ahí ' + K('P(A - B) = P(A) - P(A \\cap B) = ' + pTex(pA) + ' - ' + pTex(pI) + ' = ' + pTex(dAB)) +
          '.</div>' +
          '<div class="mx-info"><b>Demostración de De Morgan probabilístico.</b> Basta combinar la ley de ' +
          'conjuntos con la del contrario:' +
          KD('P(\\overline{A} \\cup \\overline{B}) = P(\\overline{A \\cap B}) = 1 - P(A \\cap B) = 1 - ' +
             pTex(pI) + ' = ' + pTex(nUnion)) +
          KD('P(\\overline{A} \\cap \\overline{B}) = P(\\overline{A \\cup B}) = 1 - P(A \\cup B) = 1 - ' +
             pTex(pU) + ' = ' + pTex(nInter)) + '</div>' +
          (dentro
            ? bien('Con estos datos ' + K('P(A \\cap B) = P(A)') + ', lo que significa que ' + K('A \\subset B') +
                   ': ' + K('A') + ' está enteramente dentro de ' + K('B') + '. Comprueba la monotonía: ' +
                   K(pTex(pA) + ' \\le ' + pTex(pB)) + '. Además ' + K('P(A \\cup B) = P(B) = ' + pTex(pU)) + '.')
            : nota('Aquí ' + K('A') + ' <b>no</b> está contenido en ' + K('B') + ', porque ' +
                   K('P(A \\cap B) = ' + pTex(pI) + ' \\neq P(A) = ' + pTex(pA)) + '. El criterio es exactamente ' +
                   'ese: ' + K('A \\subset B \\iff P(A \\cap B) = P(A) \\iff P(A \\cup B) = P(B)') + '.')) +
          bien('<b>Control global.</b> ' +
               K('P(A - B) + P(A \\cap B) + P(B - A) + P(\\overline{A} \\cap \\overline{B}) = ' +
                 pTex(dAB) + ' + ' + pTex(pI) + ' + ' + pTex(dBA) + ' + ' + pTex(nInter) + ' = ' +
                 pTex(fSuma(fSuma(dAB, pI), fSuma(dBA, nInter)))) + '.') +
          nota('<b>Lo importante del apartado.</b> No hay que memorizar diez fórmulas: hay <b>dos</b> ideas ' +
               '(el contrario y la suma) y un dibujo. Todo lo demás se deduce en el momento sumando y restando ' +
               'regiones del diagrama o casillas de la tabla.') +
          aviso('<b>Dos errores clásicos.</b> Primero: escribir ' + K('P(\\overline{A} \\cap \\overline{B}) = ' +
                'P(\\overline{A}) \\cdot P(\\overline{B})') + ', que solo vale si hay independencia. ' +
                'Segundo: confundir <b>incompatible</b> con <b>independiente</b>. Son cosas distintas: ' +
                'incompatible es «no pueden ocurrir juntos» (' + K('P(A \\cap B) = 0') + ') e independiente es ' +
                '«saber uno no informa del otro» (' + K('P(A \\cap B) = P(A) \\cdot P(B)') + ').');
      });
  };

  /* ==================================================================
     Fin del módulo C: la señal que espera el núcleo para arrancar.
     ================================================================== */
  S.extraC = true;
})();
