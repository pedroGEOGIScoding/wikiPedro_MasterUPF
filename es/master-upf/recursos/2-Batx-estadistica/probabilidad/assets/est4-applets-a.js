/* =====================================================================
   est4-applets-a.js · Tema 4 Probabilidad (parte 1) · 2.º Bachillerato
   Módulo A — Apartados 4.1 (azar y frecuencias), 4.2 (espacio muestral)
   y 4.3 (sucesos aleatorios)

   Depende de window.EST4 (est4-applets.js), que debe cargarse antes.

   Applets registrados aquí (17):
     4.1  deterministaAzar · clasificador · frecuencias · falacia
     4.2  espacioMuestral · arbolMuestral · tablaDoble · cuentaMuestral
          dalembert · tresMonedas · devolucion
     4.3  tiposSuceso · vennTipos · relaciones · partesE
          trampaElemental · traductor

   Todas las probabilidades se calculan con las fracciones exactas del
   núcleo (frac, fSuma, fProd): nunca se acumula coma flotante.
   JavaScript plano (ES5), gráficos SVG propios, sin dependencias.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.EST4;
  if (!S) { console.error('est4-applets-a.js: falta el núcleo est4-applets.js'); return; }
  var R = S.registry;

  /* Atajos a la API del núcleo */
  var K = S.K, KD = S.KD, esc = S.esc, nc = S.nc, kf = S.kf;
  var frac = S.frac, fSuma = S.fSuma, fResta = S.fResta, fProd = S.fProd,
      fVal = S.fVal, fIgual = S.fIgual, fracTex = S.fracTex, fracTxt = S.fracTxt,
      fracFull = S.fracFull;
  var shell = S.shell, tabla = S.tabla, fichas = S.fichas, nota = S.nota,
      aviso = S.aviso, bien = S.bien, kvs = S.kvs, resultado = S.resultado,
      tarjeta = S.tarjeta, insignia = S.insignia;
  var venn = S.venn, arbol = S.arbol, COL = S.COL, svgWrap = S.svgWrap,
      txt = S.txt, line = S.line, rect = S.rect, circle = S.circle,
      leyenda = S.leyenda;
  var conjunto = S.conjunto, lista = S.lista, entero = S.entero;
  var U = S.U, I = S.I, D = S.D, Co = S.Co, subset = S.subset, igual = S.igual,
      setTxt = S.setTxt, setTex = S.setTex, partes = S.partes;
  var C = S.C, V = S.V, VR = S.VR, fact = S.fact, bigTxt = S.bigTxt, bigTex = S.bigTex;
  var rng = S.rng;

  /* ------------------------------------------------------------------
     Utilidades locales del módulo
     ------------------------------------------------------------------ */

  /* Lee un espacio muestral escrito por el alumno y exige que no esté
     vacío: sin E no hay nada que calcular. */
  function leeE(texto, tope, nombre) {
    var E = conjunto(texto, tope || 40, nombre || 'El espacio muestral');
    if (!E.length)
      throw Error('Escribe los elementos de ' + (nombre || 'E') +
                  ' separados por comas. Ejemplo: 1, 2, 3, 4, 5, 6');
    return E;
  }

  /* Lee un suceso y comprueba que todos sus elementos estén en E: el
     error más frecuente del alumno es inventarse un resultado. */
  function leeSuceso(texto, E, nombre) {
    var A = conjunto(texto, 64, nombre || 'El suceso');
    var fuera = D(A, E);
    if (fuera.length)
      throw Error((nombre || 'El suceso') + ' contiene elementos que no están en E: ' +
                  fuera.join(', ') + '. Un suceso es siempre un subconjunto de E.');
    return S.ordena(A, E);
  }

  /* Producto cartesiano de listas de etiquetas: ['C','X'] x ['1','2'] */
  function producto(listas, sep) {
    sep = sep === undefined ? '' : sep;
    var out = [''];
    listas.forEach(function (L, i) {
      var nueva = [];
      out.forEach(function (pref) {
        L.forEach(function (x) { nueva.push(i === 0 ? x : pref + sep + x); });
      });
      out = nueva;
    });
    return out;
  }

  /* Divide un texto con etapas separadas por | y opciones por comas */
  function etapas(texto, maxEtapas, maxTotal) {
    var trozos = String(texto || '').split('|');
    var L = [];
    trozos.forEach(function (t) {
      var op = t.split(',').map(function (s) { return s.trim(); })
                .filter(function (s) { return s.length; });
      if (op.length) L.push(op);
    });
    if (!L.length)
      throw Error('Escribe las etapas separadas por la barra | y las opciones de cada etapa por comas. Ejemplo: C, X | 1, 2, 3, 4, 5, 6');
    if (L.length > (maxEtapas || 4))
      throw Error('Este applet dibuja como mucho ' + (maxEtapas || 4) + ' etapas. Quita alguna barra |.');
    var total = 1;
    L.forEach(function (op) { total *= op.length; });
    if (total > (maxTotal || 36))
      throw Error('El experimento tendría ' + total + ' resultados finales y no cabe en la figura. Prueba con un producto de como mucho ' + (maxTotal || 36) + '.');
    return L;
  }

  /* Probabilidad exacta de un suceso con la regla de Laplace */
  function laplace(A, E) { return frac(A.length, E.length); }

  /* Fila de barras comparativas (frecuencia observada frente a teórica) */
  function barras(filas) {
    var h = '<div class="ap-bars">';
    filas.forEach(function (f) {
      var pc = Math.max(0, Math.min(100, 100 * f[1]));
      h += '<div class="ap-bar-row"><span class="ap-bar-lab">' + f[0] + '</span>' +
           '<span class="ap-bar-track"><span class="ap-bar-fill' + (f[3] ? ' ap-teo' : '') +
           '" style="width:' + nc(pc, 2).replace(',', '.') + '%"></span></span>' +
           '<span class="ap-bar-val">' + f[2] + '</span></div>';
    });
    return h + '</div>';
  }

  /* ==================================================================
     1) deterministaAzar — ¿determinista o aleatorio? (4.1)
     ================================================================== */
  var EXPERIMENTOS = [
    { id: 'ebullicion', t: 'Medir la temperatura de ebullición del agua a presión normal',
      al: false, c: [true, true, false],
      m: 'En las mismas condiciones el resultado es siempre 100 °C. Se conoce antes de hacer el experimento: es determinista.' },
    { id: 'fusion', t: 'Medir la temperatura de fusión del hielo a presión normal',
      al: false, c: [true, true, false],
      m: 'Siempre 0 °C en las mismas condiciones. El resultado está fijado por la física: determinista.' },
    { id: 'dado', t: 'Lanzar un dado y anotar el número de la cara superior',
      al: true, c: [true, true, true],
      m: 'Sabemos que saldrá 1, 2, 3, 4, 5 o 6, pero no cuál. Es el ejemplo canónico de experimento aleatorio.' },
    { id: 'moneda', t: 'Lanzar una moneda y anotar cara o cruz',
      al: true, c: [true, true, true],
      m: 'Los resultados posibles son cara y cruz; cuál sale es imprevisible. Aleatorio.' },
    { id: 'piedra', t: 'Soltar una piedra desde un metro y ver si cae',
      al: false, c: [true, true, false],
      m: 'La gravedad determina el resultado: cae siempre. Determinista.' },
    { id: 'urna', t: 'Sacar una bola de una urna sin mirar y anotar su color',
      al: true, c: [true, true, true],
      m: 'Conocemos los colores que hay dentro, pero el resultado depende de la extracción concreta. Aleatorio.' },
    { id: 'resto', t: 'Calcular el resto de dividir 2 elevado a 100 entre 7',
      al: false, c: [true, true, false],
      m: 'Es un cálculo con una única respuesta correcta. Que todavía no la sepas no lo convierte en azar: determinista.' },
    { id: 'altura', t: 'Preguntar la altura a una persona elegida al azar de la clase',
      al: true, c: [true, true, true],
      m: 'La altura de cada compañero es un dato fijo; lo aleatorio es el mecanismo de selección. Aquí nace la idea de muestreo.' },
    { id: 'lluvia', t: 'Predecir si mañana lloverá en tu ciudad',
      al: true, c: [false, true, true],
      m: 'La atmósfera es un sistema caótico que no podemos medir por completo: lo tratamos como aleatorio en la práctica, aunque no sea repetible en condiciones idénticas.' },
    { id: 'suma', t: 'Sumar los puntos de dos dados ya lanzados que están sobre la mesa',
      al: false, c: [true, true, false],
      m: 'Los dados ya han caído: el resultado existe y solo hay que leerlo. Determinista.' },
    { id: 'ruleta', t: 'Girar una ruleta de casino y anotar el color del número premiado',
      al: true, c: [true, true, true],
      m: 'Conocemos los 37 números posibles, pero no cuál saldrá. Aleatorio.' },
    { id: 'gemelo', t: 'Encender una bombilla nueva y ver si se funde en el primer minuto',
      al: true, c: [true, true, true],
      m: 'Sabemos los dos desenlaces posibles y no podemos anticipar cuál ocurre: aleatorio (así funciona el control de calidad).' }
  ];

  var COND = [
    'Se puede repetir en condiciones esencialmente idénticas',
    'Se conoce de antemano el conjunto de todos los resultados posibles',
    'No se puede predecir qué resultado concreto va a ocurrir'
  ];

  function buscaExp(id) {
    for (var i = 0; i < EXPERIMENTOS.length; i++) if (EXPERIMENTOS[i].id === id) return EXPERIMENTOS[i];
    return EXPERIMENTOS[0];
  }

  R.deterministaAzar = function (n) {
    shell(n,
      'Determinista o aleatorio',
      'Un experimento es <b>aleatorio</b> cuando cumple las <b>tres</b> condiciones de la lista; si falla la tercera, es <b>determinista</b>. ' +
      'Elige un experimento en el desplegable, marca las condiciones que tú crees que se cumplen y di si lo clasificas como aleatorio o determinista. ' +
      'El applet compara tu respuesta con la correcta y te explica el motivo. ' +
      'Los botones de escenario te llevan directamente a los casos que más se discuten en clase.',
      [
        { id: 'exp', label: 'Experimento', type: 'select',
          options: EXPERIMENTOS.map(function (e) { return { value: e.id, label: e.t }; }), value: 'dado' },
        { id: 'c1', label: '1) Repetible en las mismas condiciones', type: 'check', value: true },
        { id: 'c2', label: '2) Conozco todos los resultados posibles', type: 'check', value: true },
        { id: 'c3', label: '3) No puedo predecir cuál ocurrirá', type: 'check', value: true },
        { id: 'resp', label: 'Tu clasificación', type: 'select',
          options: [{ value: 'al', label: 'Aleatorio' }, { value: 'det', label: 'Determinista' }], value: 'al' },
        { type: 'presets', list: [
          { label: 'Lanzar un dado', title: 'El experimento aleatorio de referencia',
            apply: function (c) { c.exp.value = 'dado'; } },
          { label: 'Punto de ebullición', title: 'Determinista: la física fija el resultado',
            apply: function (c) { c.exp.value = 'ebullicion'; } },
          { label: 'Resto de una división', title: 'No saberlo todavía no es azar',
            apply: function (c) { c.exp.value = 'resto'; } },
          { label: 'Altura de un compañero', title: 'El dato es fijo; lo aleatorio es la elección',
            apply: function (c) { c.exp.value = 'altura'; } },
          { label: 'Lloverá mañana', title: 'Azar en la práctica: sistema caótico',
            apply: function (c) { c.exp.value = 'lluvia'; } }
        ] }
      ],
      function (v) {
        var e = buscaExp(v.exp);
        var marcadas = [v.c1, v.c2, v.c3];
        var filas = COND.map(function (texto, i) {
          var tuya = !!marcadas[i], real = e.c[i];
          return [texto,
            insignia(tuya ? 'sí' : 'no', tuya ? 'si' : 'no'),
            insignia(real ? 'sí' : 'no', real ? 'si' : 'no'),
            insignia(tuya === real ? 'coincide' : 'revísala', tuya === real ? 'si' : 'avi')];
        });

        var acierto = (v.resp === 'al') === e.al;
        var cabecera = tarjeta('Experimento analizado', '<p>' + esc(e.t) + '</p>',
          e.al ? 'ap-card-ok' : 'ap-card-avi');

        var veredicto = acierto
          ? bien('Correcto: este experimento es <b>' + (e.al ? 'aleatorio' : 'determinista') + '</b>.')
          : aviso('Todavía no. Este experimento es <b>' + (e.al ? 'aleatorio' : 'determinista') +
                  '</b>, no ' + (e.al ? 'determinista' : 'aleatorio') + '.');

        return cabecera +
          tabla(['Condición', 'Tú dices', 'Realidad', 'Comparación'], filas) +
          veredicto +
          nota('<b>Por qué.</b> ' + e.m) +
          nota('El azar no es «no saber nada»: es saberlo todo <b>menos</b> el resultado concreto. ' +
               'Por eso la condición 2 (conocer los resultados posibles) es tan importante como la 3.') +
          nota('<b>Para discutir.</b> Un dado obedece las leyes de la mecánica: con una medida perfecta de posición, ' +
               'velocidad y rozamiento podríamos predecir la cara. ¿Es azar de verdad o solo incapacidad de medir? ' +
               'La estadística adopta una postura práctica: tratamos como aleatorio aquello cuya información necesaria ' +
               'es inaccesible. Eso se llama azar epistémico.');
      });
  };

  /* ==================================================================
     2) clasificador — clasifica tus propios experimentos (4.1.2)
     ================================================================== */
  var PISTAS_AZAR = ['dado', 'moneda', 'urna', 'bola', 'carta', 'baraja', 'sorteo',
    'loter', 'ruleta', 'azar', 'aleatori', 'elegi', 'elige', 'quiniela', 'encuesta',
    'lluv', 'tiempo', 'nacer', 'aver', 'ganar', 'partido'];
  var PISTAS_DET = ['calcul', 'suma', 'divid', 'resto', 'ebullici', 'fusi', 'gravedad',
    'cae', 'area', 'área', 'perimetro', 'perímetro', 'velocidad de la luz', 'derivada',
    'resolver', 'ecuaci', 'multiplic'];

  function pista(texto) {
    var s = texto.toLowerCase();
    var az = PISTAS_AZAR.some(function (p) { return s.indexOf(p) >= 0; });
    var de = PISTAS_DET.some(function (p) { return s.indexOf(p) >= 0; });
    if (az && !de) return 'al';
    if (de && !az) return 'det';
    return null;
  }

  var LOTES = {
    clase: 'Lanzar un dado de seis caras | A\n' +
           'Calcular el resto de dividir 100 entre 7 | D\n' +
           'Sacar una bola de una urna sin mirar | A\n' +
           'Soltar una piedra y ver si cae | D\n' +
           'Preguntar la altura a un compañero elegido al azar | A',
    fisica: 'Medir la temperatura de ebullición del agua | D\n' +
            'Medir la temperatura de fusión del hielo | D\n' +
            'Encender una bombilla y ver si se funde el primer minuto | A\n' +
            'Calcular el área de un círculo de radio 3 | D',
    juegos: 'Girar una ruleta y anotar el color | A\n' +
            'Rellenar una quiniela al azar y ver los aciertos | A\n' +
            'Sumar los puntos de dos dados ya lanzados sobre la mesa | D\n' +
            'Extraer una carta de la baraja española | A'
  };

  R.clasificador = function (n) {
    shell(n,
      'Clasifica tus propios experimentos',
      'Escribe <b>un experimento por línea</b> y, después de una barra <code>|</code>, tu clasificación: ' +
      '<code>A</code> para aleatorio y <code>D</code> para determinista. ' +
      'Ejemplo de una línea: <code>Lanzar un dado de seis caras | A</code>. ' +
      'El applet recuenta tus respuestas, te recuerda las tres condiciones para cada una y avisa cuando detecta ' +
      'palabras que apuntan a la clasificación contraria. Prueba después a inventar experimentos que te parezcan dudosos.',
      [
        { id: 'lista', label: 'Tus experimentos (uno por línea, con | A o | D)', type: 'area', rows: 7,
          value: LOTES.clase },
        { id: 'ver', label: 'Mostrar el recordatorio de las tres condiciones', type: 'check', value: true },
        { type: 'presets', list: [
          { label: 'Lote de clase', apply: function (c) { c.lista.value = LOTES.clase; } },
          { label: 'Lote de física', apply: function (c) { c.lista.value = LOTES.fisica; } },
          { label: 'Lote de juegos', apply: function (c) { c.lista.value = LOTES.juegos; } },
          { label: 'Vaciar y escribir los míos', apply: function (c) { c.lista.value = 'Escribe aquí tu experimento | A'; } }
        ] }
      ],
      function (v) {
        var lineas = String(v.lista || '').split('\n')
          .map(function (s) { return s.trim(); })
          .filter(function (s) { return s.length; });
        if (!lineas.length)
          throw Error('No has escrito ningún experimento. Formato de cada línea: texto del experimento | A o | D');
        if (lineas.length > 20) throw Error('Máximo 20 líneas para que la tabla se lea bien en clase.');

        var nAl = 0, nDet = 0, dudas = 0;
        var filas = lineas.map(function (l, i) {
          var partes2 = l.split('|');
          if (partes2.length < 2)
            throw Error('Falta la barra en la línea ' + (i + 1) + ': «' + l + '». ' +
                        'Escribe primero el experimento, luego | y después A o D.');
          var texto = partes2[0].trim();
          var marca = partes2[1].trim().toLowerCase().charAt(0);
          if (!texto) throw Error('La línea ' + (i + 1) + ' no tiene texto delante de la barra.');
          if (marca !== 'a' && marca !== 'd')
            throw Error('En la línea ' + (i + 1) + ' la clasificación debe ser A (aleatorio) o D (determinista), no «' +
                        partes2[1].trim() + '».');
          var tuya = marca === 'a' ? 'al' : 'det';
          if (tuya === 'al') nAl++; else nDet++;
          var p = pista(texto);
          var coment;
          if (p === null) coment = insignia('sin pista automática', 'info') +
            ' Justifícalo tú con las tres condiciones.';
          else if (p === tuya) coment = insignia('coherente', 'si') + ' Las palabras del enunciado apuntan en tu misma dirección.';
          else { dudas++; coment = insignia('revísalo', 'avi') + ' El enunciado suena más a ' +
            (p === 'al' ? 'aleatorio' : 'determinista') + '. ¿Se puede predecir el resultado antes de hacerlo?'; }
          return [String(i + 1), esc(texto),
                  insignia(tuya === 'al' ? 'aleatorio' : 'determinista', tuya === 'al' ? 'si' : 'info'),
                  coment];
        });

        var recordatorio = v.ver
          ? nota('<b>Comprueba cada línea con las tres condiciones:</b><ol class="ap-pasos">' +
                 '<li>' + COND[0] + '.</li><li>' + COND[1] + '.</li><li>' + COND[2] + '.</li></ol>' +
                 'Si las tres se cumplen, el experimento es aleatorio. Si falla la tercera, es determinista.')
          : '';

        return tabla(['#', 'Experimento', 'Tu clasificación', 'Comentario'], filas) +
          kvs([['Total de experimentos', lineas.length],
               ['Clasificados como aleatorios', nAl],
               ['Clasificados como deterministas', nDet],
               ['Marcados para revisar', dudas]]) +
          recordatorio +
          nota('<b>Cuidado con un caso muy fino.</b> «Preguntar la altura a un compañero elegido al azar» es aleatorio, ' +
               'pero la altura de cada persona es un dato fijo: lo aleatorio es el <b>mecanismo de selección</b>. ' +
               'Esa distinción es la semilla del muestreo estadístico.');
      });
  };

  /* ==================================================================
     3) frecuencias — frecuencia relativa y ley de los grandes números
        (4.1.1)
     ================================================================== */
  var EXPS_FREC = {
    moneda:   { lab: 'Moneda: sale cara', p: frac(1, 2) },
    dado6:    { lab: 'Dado: sale un 6', p: frac(1, 6) },
    dadoPar:  { lab: 'Dado: sale par', p: frac(1, 2) },
    urna:     { lab: 'Urna con 3 rojas y 5 azules: sale roja', p: frac(3, 8) },
    fabrica:  { lab: 'Control de calidad: pieza defectuosa', p: frac(11, 100) },
    ruleta:   { lab: 'Ruleta europea: sale rojo', p: frac(18, 37) }
  };

  /* Gráfico de la frecuencia relativa frente al número de repeticiones,
     con el eje horizontal en escala logarítmica: así se ve el zigzag
     inicial y la estabilización posterior. */
  function graficoLGN(puntos, p, maxN) {
    var W = 940, H = 430, ml = 96, mr = 40, mt = 40, mb = 70;
    var body = '';
    var x0 = ml, x1 = W - mr, y0 = mt, y1 = H - mb;
    var lmax = Math.max(1, Math.log(Math.max(10, maxN)) / Math.LN10);
    var pv = fVal(p);
    var yTop = Math.min(1, Math.max(pv * 2, pv + 0.25));
    function X(nn) { return x0 + (x1 - x0) * (Math.log(Math.max(1, nn)) / Math.LN10) / lmax; }
    function Y(f) { return y1 - (y1 - y0) * Math.max(0, Math.min(1, f / yTop)); }

    body += rect(x0, y0, x1 - x0, y1 - y0, '#fbfdff', '#cfd8dc', { r: 6, sw: 1.4 });
    /* rejilla horizontal */
    var k;
    for (k = 0; k <= 4; k++) {
      var fv = yTop * k / 4;
      body += line(x0, Y(fv), x1, Y(fv), '#e3ecf5', 1.2);
      body += txt(x0 - 12, Y(fv) + 7, nc(fv, 3), { anchor: 'end', size: 17, fill: '#546e7a' });
    }
    /* marcas del eje horizontal en potencias de 10 */
    for (k = 0; k <= Math.ceil(lmax); k++) {
      var nn = Math.pow(10, k);
      if (nn > Math.max(10, maxN)) break;
      body += line(X(nn), y0, X(nn), y1, '#eef3f7', 1.2);
      body += txt(X(nn), y1 + 30, bigTxt(BigInt(nn)), { size: 17, fill: '#546e7a' });
    }
    /* recta teórica */
    body += line(x0, Y(pv), x1, Y(pv), COL.rojo, 2.6, '8 6');
    body += txt(x1 - 6, Y(pv) - 12, 'P = ' + esc(fracTxt(p)) + ' = ' + nc(pv, 4),
                { anchor: 'end', size: 19, weight: 700, fill: COL.rojo });
    /* poligonal de la frecuencia relativa */
    var d = '';
    puntos.forEach(function (pt, i) { d += (i ? ' L ' : 'M ') + nc(X(pt[0]), 2).replace(',', '.') + ' ' + nc(Y(pt[1]), 2).replace(',', '.'); });
    if (d) body += S.path(d, COL.azul, 2.8);
    puntos.slice(-1).forEach(function (pt) {
      body += circle(X(pt[0]), Y(pt[1]), 7, COL.azulOsc, '#fff', 2);
    });
    body += txt((x0 + x1) / 2, H - 16, 'Número de repeticiones N (escala logarítmica)',
                { size: 19, weight: 700, fill: COL.texto });
    body += txt(24, (y0 + y1) / 2, 'f', { size: 20, weight: 700, fill: COL.texto });
    body += txt(24, (y0 + y1) / 2 + 22, 'rel.', { size: 15, fill: '#546e7a' });
    return svgWrap(body, W, H, 'Evolución de la frecuencia relativa al aumentar el número de repeticiones',
      'La línea azul es la frecuencia relativa observada; la roja discontinua, la probabilidad teórica.');
  }

  R.frecuencias = function (n) {
    var ctlRef = null, extraRef = null;

    function reinicia(extra) { extra.N = 0; extra.nA = 0; extra.pts = []; extra.gen = null; }

    function tanda(ctl, extra) {
      var cuantas = entero(ctl.tanda.value, 1, 200000, 'El número de repeticiones de la tanda');
      var p = EXPS_FREC[ctl.exp.value].p;
      if (!extra.gen) {
        extra.gen = rng(entero(ctl.semilla.value, 1, 999999, 'La semilla'));
        extra.N = 0; extra.nA = 0; extra.pts = [];
      }
      var umbral = fVal(p);
      var paso = Math.max(1, Math.floor(cuantas / 120));
      for (var i = 0; i < cuantas; i++) {
        extra.N++;
        if (extra.gen() < umbral) extra.nA++;
        if (extra.N <= 20 || extra.N % paso === 0) extra.pts.push([extra.N, extra.nA / extra.N]);
      }
      if (extra.pts.length > 600) {
        var red = [];
        for (var j = 0; j < extra.pts.length; j += 2) red.push(extra.pts[j]);
        extra.pts = red;
      }
      extra.pts.push([extra.N, extra.nA / extra.N]);
    }

    var ap = shell(n,
      'Frecuencia relativa y ley de los grandes números',
      'La frecuencia relativa de un suceso es ' + K('f_r(A) = \\dfrac{n_A}{N}') +
      ', donde ' + K('n_A') + ' es el número de veces que ha ocurrido y ' + K('N') + ' el número de repeticiones. ' +
      'Elige un experimento, escribe cuántas repeticiones quieres hacer en cada tanda (por ejemplo <code>100</code>) ' +
      'y pulsa <b>Lanzar tanda</b> tantas veces como quieras: las tandas se <b>acumulan</b>. ' +
      'La semilla es un número entero (por ejemplo <code>7</code>) que hace que la simulación sea repetible: ' +
      'con la misma semilla obtendrás siempre los mismos resultados, algo muy útil para comparar en clase.',
      [
        { id: 'exp', label: 'Experimento y suceso observado', type: 'select',
          options: Object.keys(EXPS_FREC).map(function (k2) { return { value: k2, label: EXPS_FREC[k2].lab }; }),
          value: 'moneda' },
        { id: 'tanda', label: 'Repeticiones por tanda', type: 'number', value: 100, min: 1, max: 200000 },
        { id: 'semilla', label: 'Semilla del azar (entero)', type: 'number', value: 7, min: 1, max: 999999 },
        { type: 'boton', id: 'bLanza', label: 'Lanzar tanda',
          onClick: function (ctl, extra) { tanda(ctl, extra); } },
        { type: 'boton', id: 'bMil', label: 'Añadir 1000 repeticiones',
          onClick: function (ctl, extra) {
            var guarda = ctl.tanda.value; ctl.tanda.value = 1000;
            tanda(ctl, extra); ctl.tanda.value = guarda;
          } },
        { type: 'boton', id: 'bReset', label: 'Reiniciar',
          onClick: function (ctl, extra) { reinicia(extra); } },
        { type: 'presets', list: [
          { label: 'Moneda, tandas de 10', apply: function (c, e) { c.exp.value = 'moneda'; c.tanda.value = 10; reinicia(e); } },
          { label: 'Dado, sale un 6', apply: function (c, e) { c.exp.value = 'dado6'; c.tanda.value = 60; reinicia(e); } },
          { label: 'Control de calidad', apply: function (c, e) { c.exp.value = 'fabrica'; c.tanda.value = 100; reinicia(e); } },
          { label: 'Ruleta europea', apply: function (c, e) { c.exp.value = 'ruleta'; c.tanda.value = 370; reinicia(e); } }
        ] }
      ],
      function (v, ctl, extra) {
        ctlRef = ctl; extraRef = extra;
        var e = EXPS_FREC[v.exp];
        entero(v.tanda, 1, 200000, 'El número de repeticiones de la tanda');
        entero(v.semilla, 1, 999999, 'La semilla');
        if (extra.N === undefined) reinicia(extra);
        if (!extra.N) {
          return nota('Todavía no has hecho ninguna repetición. Pulsa <b>Lanzar tanda</b> para empezar a acumular datos. ' +
                      'La probabilidad teórica de este suceso es ' + K(fracTex(e.p)) + '.');
        }
        var fr = extra.nA / extra.N;
        var p = e.p, pv = fVal(p);
        var frExacta = frac(extra.nA, extra.N);
        var hitos = [10, 100, 1000, 10000, 100000];
        var filas = [];
        hitos.forEach(function (hN) {
          if (hN > extra.N) return;
          var mejor = null;
          extra.pts.forEach(function (pt) { if (pt[0] <= hN && (!mejor || pt[0] > mejor[0])) mejor = pt; });
          if (mejor) filas.push([bigTxt(BigInt(hN)), Math.round(mejor[1] * mejor[0]) + ' aprox.', nc(mejor[1], 4)]);
        });
        filas.push({ celdas: ['N = ' + bigTxt(BigInt(extra.N)) + ' (ahora)', String(extra.nA), nc(fr, 4)], clase: 'ap-hi' });

        return graficoLGN(extra.pts, p, extra.N) +
          resultado(nc(fr, 4), 'frecuencia relativa observada con N = ' + bigTxt(BigInt(extra.N))) +
          tabla(['Repeticiones N', 'Casos favorables', 'Frecuencia relativa'], filas) +
          kvs([['Fracción observada', fracTxt(frExacta)],
               ['Probabilidad teórica', fracTxt(p) + ' = ' + nc(pv, 4)],
               ['Diferencia', nc(Math.abs(fr - pv), 4)]]) +
          barras([['Observada', fr, nc(fr, 4), false], ['Teórica', pv, nc(pv, 4), true]]) +
          nota('Al principio la frecuencia relativa da saltos grandes; a medida que ' + K('N') +
               ' crece se estabiliza alrededor de un valor fijo. Ese valor límite es lo que llamamos probabilidad:' +
               KD('P(A) = \\lim_{N \\to \\infty} \\dfrac{n_A}{N} = ' + fracTex(p)) +
               'Esta es la <b>ley de los grandes números</b>.') +
          nota('<b>Pensamiento crítico.</b> La ley habla de tandas <b>largas</b>, no de la siguiente repetición. ' +
               'Un casino no gana porque acierte cada jugada, sino porque juega millones de veces. ' +
               'Prueba a reiniciar y hacer tandas de 10: verás que con pocas repeticiones la frecuencia relativa puede estar muy lejos de ' +
               K(fracTex(p)) + '.');
      });

    void ctlRef; void extraRef; return ap;
  };

  /* ==================================================================
     4) falacia — la ruleta no tiene memoria (4.1.2.1)
     ================================================================== */
  var JUEGOS_FAL = {
    ruleta: { lab: 'Ruleta europea: sale rojo', p: frac(18, 37), si: 'rojo', no: 'negro o cero' },
    moneda: { lab: 'Moneda: sale cara', p: frac(1, 2), si: 'cara', no: 'cruz' },
    dado:   { lab: 'Dado: sale un 6', p: frac(1, 6), si: 'un 6', no: 'otro número' },
    urna:   { lab: 'Urna con devolución: sale roja', p: frac(3, 10), si: 'roja', no: 'no roja' }
  };

  function potencia(p, k) {
    var r = frac(1, 1);
    for (var i = 0; i < k; i++) r = fProd(r, p);
    return r;
  }

  R.falacia = function (n) {
    shell(n,
      'La falacia del jugador',
      'Acaban de salir varias veces seguidas el mismo resultado. Mucha gente cree que «ya toca» el contrario. ' +
      'Aquí lo comprobamos. Elige el juego, escribe cuántas veces seguidas ha salido el resultado (por ejemplo <code>5</code>) ' +
      'y cuántas repeticiones quieres simular (por ejemplo <code>20000</code>). ' +
      'El applet busca en la simulación todas las rachas de esa longitud y mira qué pasó <b>justo después</b>.',
      [
        { id: 'juego', label: 'Juego y suceso', type: 'select',
          options: Object.keys(JUEGOS_FAL).map(function (k2) { return { value: k2, label: JUEGOS_FAL[k2].lab }; }),
          value: 'ruleta' },
        { id: 'racha', label: 'Veces seguidas que ya ha salido', type: 'number', value: 5, min: 1, max: 12 },
        { id: 'sim', label: 'Repeticiones simuladas', type: 'number', value: 20000, min: 100, max: 500000 },
        { id: 'semilla', label: 'Semilla del azar (entero)', type: 'number', value: 3, min: 1, max: 999999 },
        { type: 'presets', list: [
          { label: 'Cinco rojos seguidos', apply: function (c) { c.juego.value = 'ruleta'; c.racha.value = 5; c.sim.value = 50000; } },
          { label: 'Cuatro caras seguidas', apply: function (c) { c.juego.value = 'moneda'; c.racha.value = 4; c.sim.value = 20000; } },
          { label: 'Dos seises seguidos', apply: function (c) { c.juego.value = 'dado'; c.racha.value = 2; c.sim.value = 60000; } },
          { label: 'Racha larga: 8 caras', apply: function (c) { c.juego.value = 'moneda'; c.racha.value = 8; c.sim.value = 300000; } }
        ] }
      ],
      function (v) {
        var j = JUEGOS_FAL[v.juego];
        var k = entero(v.racha, 1, 12, 'La longitud de la racha');
        var N = entero(v.sim, 100, 500000, 'El número de repeticiones simuladas');
        var semilla = entero(v.semilla, 1, 999999, 'La semilla');
        var p = j.p, pv = fVal(p);

        /* Simulación: contamos qué ocurre inmediatamente después de cada
           racha de k resultados iguales al suceso observado. */
        var g = rng(semilla), racha = 0, casos = 0, siguen = 0, ultimo;
        for (var i = 0; i < N; i++) {
          ultimo = g() < pv;
          if (racha >= k) { casos++; if (ultimo) siguen++; }
          racha = ultimo ? racha + 1 : 0;
        }
        var frCond = casos ? siguen / casos : 0;

        var antes = potencia(p, k + 1);
        var pk = potencia(p, k);

        var aviso1 = casos < 30
          ? aviso('Solo se han encontrado ' + casos + ' rachas de longitud ' + k +
                  ' en la simulación: son pocas para fiarse del porcentaje. Aumenta las repeticiones simuladas.')
          : '';

        return kvs([['Rachas de ' + k + ' encontradas', bigTxt(BigInt(casos))],
                    ['Después salió ' + j.si, bigTxt(BigInt(siguen))],
                    ['Frecuencia relativa condicionada', nc(frCond, 4)],
                    ['Probabilidad teórica de cada tirada', fracTxt(p) + ' = ' + nc(pv, 4)]]) +
          barras([['Tras la racha salió ' + esc(j.si), frCond, nc(frCond, 4), false],
                  ['Probabilidad de siempre', pv, nc(pv, 4), true]]) +
          aviso1 +
          bien('La proporción tras la racha coincide con la probabilidad de siempre: el juego <b>no tiene memoria</b>.') +
          nota('<b>Las dos preguntas que se confunden.</b>' +
               '<ol class="ap-pasos">' +
               '<li>«¿Qué probabilidad hay, <b>antes de empezar</b>, de que salga ' + esc(j.si) + ' ' + (k + 1) +
               ' veces seguidas?» Es un producto y sale pequeña: ' + K('P = ' + fracTex(p) + '^{' + (k + 1) + '} = ' +
               fracTex(antes)) + ' ' + K('\\approx ' + kf(fVal(antes), 6)) + '.</li>' +
               '<li>«Ya han salido ' + k + ' seguidas. ¿Y la siguiente?» La respuesta es ' + K(fracTex(p)) +
               ', exactamente la misma de siempre.</li></ol>' +
               'La primera pregunta mira ' + (k + 1) + ' tiradas <b>en el futuro</b>; la segunda mira <b>una sola</b>, ' +
               'y las ' + k + ' anteriores ya han ocurrido: su probabilidad ya no es ' + K(fracTex(pk)) + ', es 1.') +
          nota('<b>Para discutir.</b> Si el mismo número saliera 30 veces seguidas, ¿seguirías apostando a que la ruleta ' +
               'no tiene memoria, o empezarías a sospechar que la ruleta está trucada? Esta duda razonable es justo la idea ' +
               'de los contrastes de hipótesis que verás en el tercer trimestre.');
      });
  };

  /* ==================================================================
     5) espacioMuestral — constructor de E (4.2)
     ================================================================== */
  var BARAJA_PALOS = ['oros', 'copas', 'espadas', 'bastos'];
  var BARAJA_VAL = ['1', '2', '3', '4', '5', '6', '7', 'sota', 'caballo', 'rey'];

  function urnaComposicion(texto) {
    /* "4 R, 1 N, 2 A" -> [{k:4,c:'R'}, ...] */
    var trozos = String(texto || '').split(',').map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length; });
    if (!trozos.length)
      throw Error('Describe la urna con la cantidad y el color de cada grupo, separados por comas. Ejemplo: 4 R, 1 N, 2 A');
    var out = [], total = 0;
    trozos.forEach(function (t) {
      var m = t.match(/^(\d+)\s*(.+)$/);
      if (!m) throw Error('No entiendo «' + t + '». Escribe primero cuántas bolas y luego el color. Ejemplo: 4 R');
      var k = Number(m[1]), c = m[2].trim();
      if (k < 1) throw Error('El grupo «' + t + '» debe tener al menos una bola.');
      out.push({ k: k, c: c });
      total += k;
    });
    if (total > 40) throw Error('Usa como mucho 40 bolas en total para que la figura se lea bien.');
    return out;
  }

  R.espacioMuestral = function (n) {
    shell(n,
      'Constructor de espacios muestrales',
      'El espacio muestral ' + K('E') + ' es el conjunto de <b>todos</b> los resultados posibles de un experimento aleatorio, ' +
      'y cada resultado simple es un <b>suceso elemental</b>. ' +
      'Elige el experimento en el desplegable. Para la urna, describe su contenido con la cantidad y el color de cada grupo ' +
      'separados por comas: <code>4 R, 1 N, 2 A</code> significa 4 rojas, 1 negra y 2 amarillas. ' +
      'Para el experimento libre, escribe los resultados separados por comas: <code>1, 2, 3, 4, 5, 6</code>. ' +
      'Cambia después «qué anotas» y observa algo decisivo: <b>el mismo material da espacios muestrales distintos según la pregunta que hagas</b>.',
      [
        { id: 'tipo', label: 'Experimento', type: 'select', options: [
          { value: 'moneda', label: 'Lanzar una moneda' },
          { value: 'dado', label: 'Lanzar un dado de seis caras' },
          { value: 'urna', label: 'Extraer una bola de una urna' },
          { value: 'baraja', label: 'Extraer una carta de la baraja española (40 cartas)' },
          { value: 'quinielas', label: 'Lanzar un dado de quinielas (3 caras 1, 2 caras X, 1 cara 2)' },
          { value: 'libre', label: 'Experimento libre (lo escribes tú)' }
        ], value: 'dado' },
        { id: 'urna', label: 'Contenido de la urna (cantidad y color)', type: 'text', value: '4 R, 1 N, 2 A' },
        { id: 'anota', label: 'Qué anotas', type: 'select', options: [
          { value: 'grupo', label: 'Solo la categoría (color de la bola, palo de la carta)' },
          { value: 'todo', label: 'El objeto concreto (bola numerada, carta completa)' }
        ], value: 'grupo' },
        { id: 'libre', label: 'Resultados del experimento libre', type: 'text', value: 'aprobado, suspenso' },
        { type: 'presets', list: [
          { label: 'Dado', apply: function (c) { c.tipo.value = 'dado'; } },
          { label: 'Urna: solo color', apply: function (c) { c.tipo.value = 'urna'; c.urna.value = '4 R, 1 N, 2 A'; c.anota.value = 'grupo'; } },
          { label: 'Urna: bola concreta', apply: function (c) { c.tipo.value = 'urna'; c.urna.value = '4 R, 1 N, 2 A'; c.anota.value = 'todo'; } },
          { label: 'Baraja: palo', apply: function (c) { c.tipo.value = 'baraja'; c.anota.value = 'grupo'; } },
          { label: 'Dado de quinielas', apply: function (c) { c.tipo.value = 'quinielas'; } },
          { label: 'Bolas numeradas por color', apply: function (c) { c.tipo.value = 'urna'; c.urna.value = '3 B, 2 N'; c.anota.value = 'todo'; } }
        ] }
      ],
      function (v) {
        var E = [], pesos = null, comentario = '', equi = true, material = '';

        if (v.tipo === 'moneda') {
          E = ['C', 'X'];
          material = 'una moneda';
          comentario = 'C es cara y X es cruz. Los dos sucesos elementales son equiprobables si la moneda no está trucada.';
        } else if (v.tipo === 'dado') {
          E = ['1', '2', '3', '4', '5', '6'];
          material = 'un dado de seis caras';
          comentario = 'El dado es el experimento aleatorio de referencia: seis sucesos elementales equiprobables.';
        } else if (v.tipo === 'quinielas') {
          E = ['1', 'X', '2'];
          pesos = [frac(3, 6), frac(2, 6), frac(1, 6)];
          equi = false;
          material = 'un dado de quinielas';
          comentario = 'Aunque el dado tenga 6 caras, los resultados distintos son solo 3: un resultado se escribe una sola vez, ' +
                       'aunque se repita en el material. Pero atención: aquí los sucesos elementales <b>no</b> son equiprobables.';
        } else if (v.tipo === 'urna') {
          var comp = urnaComposicion(v.urna);
          var totalBolas = comp.reduce(function (a, g) { return a + g.k; }, 0);
          material = 'una urna con ' + totalBolas + ' bolas';
          if (v.anota === 'grupo') {
            E = comp.map(function (g) { return g.c; });
            if (E.length !== conjunto(E.join(','), 40, 'Los colores').length)
              throw Error('Has repetido un color en la descripción de la urna. Junta las bolas del mismo color en un solo grupo.');
            pesos = comp.map(function (g) { return frac(g.k, totalBolas); });
            equi = comp.every(function (g) { return g.k === comp[0].k; });
            comentario = 'Hay ' + totalBolas + ' bolas, pero solo ' + E.length + ' sucesos elementales, porque hemos decidido ' +
                         'anotar <b>únicamente el color</b>.';
          } else {
            comp.forEach(function (g) {
              for (var i = 1; i <= g.k; i++) E.push(g.c + i);
            });
            comentario = 'Ahora distinguimos cada bola, así que hay tantos sucesos elementales como bolas: ' + totalBolas +
                         '. Estos sí son equiprobables, y por eso son los adecuados para aplicar la regla de Laplace.';
          }
        } else if (v.tipo === 'baraja') {
          material = 'una baraja española de 40 cartas';
          if (v.anota === 'grupo') {
            E = BARAJA_PALOS.slice();
            pesos = [frac(10, 40), frac(10, 40), frac(10, 40), frac(10, 40)];
            comentario = 'Si solo anotamos el palo, hay 4 sucesos elementales y cada uno agrupa 10 cartas.';
          } else {
            BARAJA_PALOS.forEach(function (pl) {
              BARAJA_VAL.forEach(function (val) { E.push(val + ' de ' + pl); });
            });
            comentario = 'Anotando la carta completa hay 40 sucesos elementales equiprobables.';
          }
        } else {
          E = leeE(v.libre, 40, 'El experimento libre');
          material = 'tu experimento';
          comentario = 'Has descrito tú mismo el espacio muestral. Comprueba dos cosas: que no falta ningún resultado y que ' +
                       'ninguno se repite.';
        }

        var nE = E.length;
        var subcon = Math.pow(2, nE);
        var filas = E.map(function (x, i) {
          var p = pesos ? pesos[i] : frac(1, nE);
          return [esc(x), K(fracTex(p)), nc(fVal(p), 4), S.pct ? S.pct(fVal(p), 2) : ''];
        });
        var suma = frac(0, 1);
        E.forEach(function (x, i) { suma = fSuma(suma, pesos ? pesos[i] : frac(1, nE)); });

        return fichas(E, 'ap-in') +
          resultado(String(nE), 'sucesos elementales, es decir, ' + K('|E| = ' + nE)) +
          KD('E = ' + setTex(E, E)) +
          tabla(['Suceso elemental', 'Probabilidad', 'Decimal', 'Porcentaje'], filas) +
          kvs([['Material del experimento', material],
               ['Cardinal de E', nE],
               ['Suma de las probabilidades', fracTxt(suma)],
               ['Número total de sucesos', bigTxt(BigInt(subcon)) + '  (2 elevado a ' + nE + ')']]) +
          nota(comentario) +
          (equi
            ? nota('Los sucesos elementales son <b>equiprobables</b>: se puede aplicar la regla de Laplace y cada uno vale ' +
                   K(fracTex(frac(1, nE))) + '.')
            : aviso('Los sucesos elementales <b>no</b> son equiprobables. Aquí no se puede repartir la probabilidad a partes iguales ' +
                    'ni aplicar directamente la regla de Laplace: hay que usar la composición real del experimento.')) +
          nota('<b>Conclusión que hay que grabar.</b> El espacio muestral no lo determina el material del experimento, ' +
               'sino la <b>pregunta</b> que hacemos. Cambia «qué anotas» y compruébalo tú mismo.');
      });
  };

  /* ==================================================================
     6) arbolMuestral — el árbol como método de recuento (4.2.3.1)
     ================================================================== */
  var ESCEN_ARBOL = {
    ropa:   { et: 'R, A | V, L, C', cap: 'Camiseta (roja o azul) y pantalón (vaquero, de lino o chándal).' },
    menu:   { et: 'P, L | P, C, H', cap: 'Primer plato (pasta o legumbres) y segundo (pescado, carne o huevos).' },
    monedas:{ et: 'C, X | C, X | C, X', cap: 'Tres lanzamientos seguidos de una moneda.' },
    dado:   { et: 'C, X | 1, 2, 3, 4, 5, 6', cap: 'Una moneda y un dado lanzados a la vez.' },
    urna:   { et: 'B, N, R | B, N, R', cap: 'Dos extracciones con devolución de una urna con blanca, negra y roja.' }
  };

  R.arbolMuestral = function (n) {
    shell(n,
      'Diagrama de árbol para construir E',
      'El diagrama de árbol dibuja las etapas del experimento una detrás de otra: el espacio muestral aparece en las ' +
      '<b>ramas finales</b>. Escribe las etapas separadas por la barra <code>|</code> y las opciones de cada etapa separadas por comas. ' +
      'Ejemplo: <code>R, A | V, L, C</code> significa primera etapa con dos opciones (R y A) y segunda etapa con tres (V, L y C). ' +
      'Fíjate en que el número de ramas finales es siempre el <b>producto</b> del número de opciones de cada etapa.',
      [
        { id: 'et', label: 'Etapas y opciones (etapas con |, opciones con comas)', type: 'text', value: 'R, A | V, L, C' },
        { id: 'sep', label: 'Separador entre etapas al escribir el resultado', type: 'select',
          options: [{ value: '', label: 'Nada: RV' }, { value: '-', label: 'Guion: R-V' }, { value: ' ', label: 'Espacio: R V' }],
          value: '' },
        { id: 'lista', label: 'Mostrar además la lista completa de E', type: 'check', value: true },
        { type: 'presets', list: [
          { label: 'Camiseta y pantalón', apply: function (c) { c.et.value = ESCEN_ARBOL.ropa.et; } },
          { label: 'Menú del día', apply: function (c) { c.et.value = ESCEN_ARBOL.menu.et; } },
          { label: 'Tres monedas', apply: function (c) { c.et.value = ESCEN_ARBOL.monedas.et; } },
          { label: 'Moneda y dado', apply: function (c) { c.et.value = ESCEN_ARBOL.dado.et; } },
          { label: 'Dos bolas con devolución', apply: function (c) { c.et.value = ESCEN_ARBOL.urna.et; } }
        ] }
      ],
      function (v) {
        var L = etapas(v.et, 3, 24);
        var sep = v.sep === undefined ? '' : v.sep;
        var E = producto(L, sep);
        var colores = [COL.azul, COL.rojo, COL.verde, COL.naranja];

        /* Construcción recursiva del árbol con ramas equiprobables */
        function rama(nivel, camino) {
          var nodo = { lab: nivel === 0 ? '' : camino[camino.length - 1] };
          if (nivel === L.length) { nodo.camino = camino.join(sep); return nodo; }
          nodo.hijos = L[nivel].map(function (op) {
            var hijo = rama(nivel + 1, camino.concat([op]));
            hijo.p = frac(1, L[nivel].length);
            hijo.lab = op;
            hijo.color = colores[nivel % colores.length];
            return hijo;
          });
          return nodo;
        }
        var raiz = rama(0, []);
        var fig = arbol(raiz, {
          cap: 'Cada rama final es un suceso elemental. Debajo de cada resultado aparece su probabilidad, ' +
               'y al pie se comprueba que todas las ramas suman 1.',
          label: 'Árbol con ' + E.length + ' ramas finales',
          pasoX: 240, pasoY: L.length > 2 ? 54 : 64
        });

        var factores = L.map(function (op) { return op.length; });
        var totalTex = factores.join(' \\cdot ') + ' = ' + E.length;

        return fig +
          resultado(String(E.length), 'ramas finales, es decir, ' + K('|E| = ' + E.length)) +
          (v.lista ? fichas(E, 'ap-in') + KD('E = ' + setTex(E, E)) : '') +
          nota('Regla del producto: si el experimento tiene ' + L.length + ' etapas con ' + factores.join(', ') +
               ' opciones respectivamente, entonces' + KD('|E| = ' + totalTex) +
               'y, en general, para ' + K('k') + ' etapas: ' + K('|E| = n_1 \\cdot n_2 \\cdots n_k') + '.') +
          nota('Cada suceso elemental tiene probabilidad ' + K(fracTex(frac(1, E.length))) +
               ' porque todas las ramas son equiprobables. Esa es justo la ventaja del árbol: ' +
               'te da un espacio muestral <b>fiable</b> sobre el que sí se puede aplicar la regla de Laplace.');
      });
  };

  /* ==================================================================
     7) tablaDoble — tabla de doble entrada (4.2.3.2)
     ================================================================== */
  R.tablaDoble = function (n) {
    shell(n,
      'Tabla de doble entrada para construir E',
      'Cuando el experimento tiene <b>exactamente dos etapas</b>, una tabla es más compacta que un árbol. ' +
      'Escribe el espacio muestral de cada etapa con los elementos separados por comas: ' +
      'por ejemplo <code>C, X</code> para la moneda y <code>1, 2, 3, 4, 5, 6</code> para el dado. ' +
      'En «resaltar» puedes escribir un trozo de texto (por ejemplo <code>C</code>) y el applet marcará y contará ' +
      'todas las casillas que lo contengan, calculando su probabilidad exacta.',
      [
        { id: 'e1', label: 'Primera etapa (filas)', type: 'text', value: 'C, X' },
        { id: 'e2', label: 'Segunda etapa (columnas)', type: 'text', value: '1, 2, 3, 4, 5, 6' },
        { id: 'sep', label: 'Separador al escribir cada casilla', type: 'select',
          options: [{ value: '', label: 'Nada: C1' }, { value: '-', label: 'Guion: C-1' }], value: '' },
        { id: 'marca', label: 'Resaltar las casillas que contengan', type: 'text', value: 'C', placeholder: 'C' },
        { type: 'presets', list: [
          { label: 'Moneda y dado', apply: function (c) { c.e1.value = 'C, X'; c.e2.value = '1, 2, 3, 4, 5, 6'; c.marca.value = 'C'; } },
          { label: 'Dos dados', apply: function (c) { c.e1.value = '1, 2, 3, 4, 5, 6'; c.e2.value = '1, 2, 3, 4, 5, 6'; c.marca.value = '6'; c.sep.value = '-'; } },
          { label: 'Dos monedas', apply: function (c) { c.e1.value = 'C, X'; c.e2.value = 'C, X'; c.marca.value = 'C'; } },
          { label: 'Dado y bola', apply: function (c) { c.e1.value = '1, 2, 3, 4, 5, 6'; c.e2.value = 'R, N'; c.marca.value = 'R'; } }
        ] }
      ],
      function (v) {
        var E1 = leeE(v.e1, 12, 'La primera etapa');
        var E2 = leeE(v.e2, 12, 'La segunda etapa');
        if (E1.length * E2.length > 120)
          throw Error('La tabla tendría ' + (E1.length * E2.length) + ' casillas y no se leería en clase. Usa etapas más cortas.');
        var sep = v.sep === undefined ? '' : v.sep;
        var marca = String(v.marca || '').trim();

        var E = [], marcadas = [];
        var filas = E1.map(function (a) {
          var celdas = [esc(a)];
          E2.forEach(function (b) {
            var cel = a + sep + b;
            E.push(cel);
            var hit = marca && cel.indexOf(marca) >= 0;
            if (hit) marcadas.push(cel);
            celdas.push(hit ? '<span class="ap-mark">' + esc(cel) + '</span>' : esc(cel));
          });
          return celdas;
        });

        var salida = '<div class="ap-tbl-wrap">' +
          tabla([''].concat(E2.map(function (b) { return esc(b); })), filas) + '</div>';

        var pMarca = '';
        if (marca) {
          var A = marcadas;
          var p = laplace(A, E);
          pMarca = fichas(A, 'ap-in2') +
            KD('P(\\text{casillas con «' + esc(marca) + '»}) = \\dfrac{' + A.length + '}{' + E.length + '} = ' + fracFull(p)) +
            kvs([['Casillas resaltadas', A.length], ['Casillas totales', E.length]]);
          if (!A.length) pMarca += aviso('Ninguna casilla contiene «' + esc(marca) + '». Es un suceso imposible en este experimento: ' +
            K('A = \\varnothing') + ' y ' + K('P(A) = 0') + '.');
        }

        return salida +
          resultado(String(E.length), 'casillas interiores, es decir, ' + K('|E| = ' + E1.length + ' \\cdot ' + E2.length)) +
          pMarca +
          nota('El conjunto de las casillas interiores <b>es</b> el espacio muestral: ' +
               KD('E = E_1 \\times E_2, \\qquad |E| = |E_1| \\cdot |E_2| = ' + E1.length + ' \\cdot ' + E2.length + ' = ' + E.length) +
               'A esa construcción se le llama <b>producto cartesiano</b>, y volverá a aparecer en los experimentos compuestos.') +
          nota('Los márgenes de la tabla son los espacios muestrales simples ' + K('E_1') + ' y ' + K('E_2') +
               '; el interior es el espacio muestral del experimento completo. ' +
               'Estas mismas tablas reaparecerán en probabilidad condicionada con el nombre de <b>tablas de contingencia</b>.');
      });
  };

  /* ==================================================================
     8) cuentaMuestral — combinatoria cuando E no se puede dibujar
        (4.2.3.3)
     ================================================================== */
  var MODELOS = {
    VR: { lab: 'Variaciones con repetición: importa el orden y se pueden repetir',
          tex: function (a, b) { return 'VR_{' + a + ',' + b + '} = ' + a + '^{' + b + '}'; },
          calc: function (a, b) { return VR(a, b); },
          crit: 'Importa el orden y los elementos se pueden repetir.' },
    V:  { lab: 'Variaciones sin repetición: importa el orden y no se repiten',
          tex: function (a, b) { return 'V_{' + a + ',' + b + '} = \\dfrac{' + a + '!}{(' + a + '-' + b + ')!}'; },
          calc: function (a, b) { return V(a, b); },
          crit: 'Importa el orden y no se puede repetir ningún elemento.' },
    P:  { lab: 'Permutaciones: ordenar todos los elementos',
          tex: function (a) { return 'P_{' + a + '} = ' + a + '!'; },
          calc: function (a) { return fact(a); },
          crit: 'Se ordenan todos los elementos, sin dejar ninguno fuera.' },
    C:  { lab: 'Combinaciones: no importa el orden y no se repiten',
          tex: function (a, b) { return 'C_{' + a + ',' + b + '} = \\dbinom{' + a + '}{' + b + '} = \\dfrac{' + a + '!}{' + b + '!\\,(' + a + '-' + b + ')!}'; },
          calc: function (a, b) { return C(a, b); },
          crit: 'No importa el orden y no se repite ningún elemento.' },
    CR: { lab: 'Combinaciones con repetición: no importa el orden y sí se repiten',
          tex: function (a, b) { return 'CR_{' + a + ',' + b + '} = \\dbinom{' + a + '+' + b + '-1}{' + b + '}'; },
          calc: function (a, b) { return S.CR(a, b); },
          crit: 'No importa el orden y los elementos se pueden repetir.' }
  };

  R.cuentaMuestral = function (n) {
    shell(n,
      'Contar E con combinatoria',
      'A veces ' + K('|E|') + ' tiene millones de elementos y solo necesitamos <b>contarlo</b>, no listarlo. ' +
      'Escribe cuántos elementos distintos hay disponibles (<code>n</code>) y cuántos se eligen (<code>m</code>), ' +
      'y selecciona el modelo. Ejemplo de la quiniela: <code>n = 3</code> símbolos, <code>m = 14</code> casillas, ' +
      'variaciones con repetición. Antes de mirar el resultado, decide tú dos cosas: ¿importa el orden? ¿se pueden repetir?',
      [
        { id: 'modelo', label: 'Modelo combinatorio', type: 'select',
          options: Object.keys(MODELOS).map(function (k2) { return { value: k2, label: MODELOS[k2].lab }; }),
          value: 'VR' },
        { id: 'n', label: 'n: elementos disponibles', type: 'number', value: 3, min: 0, max: 400 },
        { id: 'm', label: 'm: elementos que se eligen', type: 'number', value: 14, min: 0, max: 400 },
        { id: 'orden', label: '¿Crees que importa el orden?', type: 'select',
          options: [{ value: 'si', label: 'Sí, importa el orden' }, { value: 'no', label: 'No importa el orden' }], value: 'si' },
        { id: 'rep', label: '¿Crees que se pueden repetir?', type: 'select',
          options: [{ value: 'si', label: 'Sí, se repiten' }, { value: 'no', label: 'No se repiten' }], value: 'si' },
        { type: 'presets', list: [
          { label: 'Quiniela de 14', title: '3 símbolos en 14 casillas',
            apply: function (c) { c.modelo.value = 'VR'; c.n.value = 3; c.m.value = 14; c.orden.value = 'si'; c.rep.value = 'si'; } },
          { label: 'Lotería 6 de 49', title: 'No importa el orden y no se repite',
            apply: function (c) { c.modelo.value = 'C'; c.n.value = 49; c.m.value = 6; c.orden.value = 'no'; c.rep.value = 'no'; } },
          { label: 'PIN de 4 cifras', apply: function (c) { c.modelo.value = 'VR'; c.n.value = 10; c.m.value = 4; c.orden.value = 'si'; c.rep.value = 'si'; } },
          { label: 'Números de 5 cifras sin repetir', apply: function (c) { c.modelo.value = 'V'; c.n.value = 9; c.m.value = 5; c.orden.value = 'si'; c.rep.value = 'no'; } },
          { label: 'Helado de 3 sabores entre 12', apply: function (c) { c.modelo.value = 'C'; c.n.value = 12; c.m.value = 3; c.orden.value = 'no'; c.rep.value = 'no'; } },
          { label: 'Podio de 8 corredores', apply: function (c) { c.modelo.value = 'V'; c.n.value = 8; c.m.value = 3; c.orden.value = 'si'; c.rep.value = 'no'; } }
        ] }
      ],
      function (v) {
        var nn = entero(v.n, 0, 400, 'El número de elementos disponibles n');
        var mm = entero(v.m, 0, 400, 'El número de elementos que se eligen m');
        var mod = MODELOS[v.modelo];
        if (v.modelo === 'V' && mm > nn)
          throw Error('En las variaciones sin repetición hace falta m ≤ n: no puedes elegir ' + mm + ' elementos distintos de solo ' + nn + '.');
        if (v.modelo === 'C' && mm > nn)
          throw Error('En las combinaciones hace falta m ≤ n: no puedes elegir ' + mm + ' elementos distintos de solo ' + nn + '.');
        if (v.modelo === 'P' && nn > 170)
          throw Error('El factorial de ' + nn + ' es un número descomunal. Usa n ≤ 170 en este applet.');

        var total = mod.calc(nn, mm);
        if (total <= 0n) throw Error('Con esos valores no hay ningún caso posible. Revisa n y m.');

        /* Modelo que corresponde a las respuestas del alumno */
        var suyo = v.orden === 'si' ? (v.rep === 'si' ? 'VR' : 'V') : (v.rep === 'si' ? 'CR' : 'C');
        var coincide = suyo === v.modelo || (v.modelo === 'P' && suyo === 'V' && mm === nn);

        var pUno = frac(1, 1);
        var esGrande = total > 9007199254740991n;
        var probaLinea = esGrande
          ? 'La probabilidad de acertar un resultado concreto es ' + K('1 / ' + bigTex(total)) + ', un número tan pequeño que no cabe en la pantalla.'
          : (function () {
              var f = frac(1, Number(total));
              pUno = f;
              return 'Si todos los resultados fuesen equiprobables, acertar uno concreto tendría probabilidad ' +
                     K(fracTex(f)) + K('\\approx ' + kf(fVal(f), 10)) + '.';
            })();

        var segundos = Number(total < 1000000000000n ? total : 1000000000000n);
        var escala = '';
        if (Number.isFinite(segundos) && segundos > 100) {
          var q = segundos, u = 'segundos';
          if (q > 60) { q /= 60; u = 'minutos'; }
          if (q > 60 && u === 'minutos') { q /= 60; u = 'horas'; }
          if (q > 24 && u === 'horas') { q /= 24; u = 'días'; }
          if (q > 365 && u === 'días') { q /= 365; u = 'años'; }
          escala = nota('<b>Para dar escala.</b> Si rellenaras un resultado por segundo, sin dormir, tardarías unos <b>' +
            nc(q, 2) + ' ' + u + '</b> en agotar el espacio muestral. Esta es la forma más honesta de explicar por qué ' +
            '«ya me tocará» no es una estrategia financiera.');
        }

        var filasCrit = [
          ['Importa el orden y se repiten', 'Variaciones con repetición', K('VR_{n,m} = n^m')],
          ['Importa el orden y no se repiten', 'Variaciones sin repetición', K('V_{n,m} = \\dfrac{n!}{(n-m)!}')],
          ['Se ordenan todos', 'Permutaciones', K('P_n = n!')],
          ['No importa el orden y no se repiten', 'Combinaciones', K('C_{n,m} = \\dbinom{n}{m}')],
          ['No importa el orden y se repiten', 'Combinaciones con repetición', K('CR_{n,m} = \\dbinom{n+m-1}{m}')]
        ];

        return resultado(bigTxt(total), 'resultados posibles: ' + K('|E| = ' + bigTex(total))) +
          KD('|E| = ' + mod.tex(nn, mm) + ' = ' + bigTex(total)) +
          (coincide
            ? bien('Tus dos respuestas («' + (v.orden === 'si' ? 'importa el orden' : 'no importa el orden') + '» y «' +
                   (v.rep === 'si' ? 'se repiten' : 'no se repiten') + '») encajan con el modelo elegido.')
            : aviso('Cuidado: con tus respuestas («' + (v.orden === 'si' ? 'importa el orden' : 'no importa el orden') + '» y «' +
                    (v.rep === 'si' ? 'se repiten' : 'no se repiten') + '») el modelo adecuado sería <b>' +
                    MODELOS[suyo].lab.split(':')[0] + '</b>, no el que has seleccionado. Repasa el criterio de decisión.')) +
          nota('Criterio del modelo elegido: ' + mod.crit) +
          tabla(['Criterio', 'Modelo', 'Fórmula'], filasCrit) +
          nota(probaLinea) + escala +
          nota('Recuerda el convenio ' + K('0! = 1') + ' y que estas fórmulas solo <b>cuentan</b> el espacio muestral: ' +
               'no dicen nada sobre si sus elementos son equiprobables. Eso hay que comprobarlo aparte.');
      });
  };

  /* ==================================================================
     9) dalembert — el error de D'Alembert (4.2.4.1)
     ================================================================== */
  R.dalembert = function (n) {
    shell(n,
      'El error de D’Alembert',
      'Lanzamos varias monedas a la vez y contamos las caras. Un alumno escribe ' +
      K('E_{\\text{mal}} = \\{0\\text{ caras}, 1\\text{ cara}, 2\\text{ caras}\\}') +
      ' y concluye que ' + K('P(1\\text{ cara}) = 1/3') + '. Es un error clásico, y lo cometió un gran matemático del siglo XVIII. ' +
      'Elige cuántas monedas se lanzan (empieza por <code>2</code>) y cuántas caras te interesan (por ejemplo <code>1</code>). ' +
      'Compara las dos respuestas y, si quieres, simula muchos lanzamientos para ver cuál acierta.',
      [
        { id: 'k', label: 'Número de monedas', type: 'number', value: 2, min: 2, max: 5 },
        { id: 'r', label: 'Número de caras que te interesa', type: 'number', value: 1, min: 0, max: 5 },
        { id: 'sim', label: 'Lanzamientos simulados', type: 'number', value: 5000, min: 0, max: 200000 },
        { id: 'semilla', label: 'Semilla del azar (entero)', type: 'number', value: 11, min: 1, max: 999999 },
        { type: 'presets', list: [
          { label: 'El caso original: 2 monedas, 1 cara', apply: function (c) { c.k.value = 2; c.r.value = 1; } },
          { label: '2 monedas, 2 caras', apply: function (c) { c.k.value = 2; c.r.value = 2; } },
          { label: '3 monedas, 2 caras', apply: function (c) { c.k.value = 3; c.r.value = 2; } },
          { label: '4 monedas, 2 caras', apply: function (c) { c.k.value = 4; c.r.value = 2; } }
        ] }
      ],
      function (v) {
        var k = entero(v.k, 2, 5, 'El número de monedas');
        var r = entero(v.r, 0, k, 'El número de caras');
        if (r > k) throw Error('No puedes pedir ' + r + ' caras si solo lanzas ' + k + ' monedas.');
        var N = entero(v.sim, 0, 200000, 'El número de lanzamientos simulados');
        var semilla = entero(v.semilla, 1, 999999, 'La semilla');

        /* Espacio muestral correcto: todas las secuencias de C y X */
        var caras = [];
        for (var i = 0; i < k; i++) caras.push(['C', 'X']);
        var E = producto(caras, '');
        var A = E.filter(function (s) {
          var c = 0;
          for (var j = 0; j < s.length; j++) if (s.charAt(j) === 'C') c++;
          return c === r;
        });
        var pBien = laplace(A, E);
        var pMal = frac(1, k + 1);

        /* Árbol solo para 2 o 3 monedas: con más, la figura se satura */
        var fig = '';
        var ramaM = function (nivel, camino) {
            var nodo = { lab: nivel === 0 ? '' : camino[camino.length - 1] };
            if (nivel === k) {
              nodo.camino = camino.join('');
              nodo.color = camino.filter(function (x) { return x === 'C'; }).length === r ? COL.verde : COL.azul;
              return nodo;
            }
            nodo.hijos = ['C', 'X'].map(function (op) {
              var h = ramaM(nivel + 1, camino.concat([op]));
              h.p = frac(1, 2); h.lab = op;
              h.color = op === 'C' ? COL.azul : COL.gris;
              return h;
            });
          return nodo;
        };
        if (k <= 3) {
          fig = arbol(ramaM(0, []), {
            cap: 'Cada rama final es igual de probable: ese es el espacio muestral fiable.',
            label: 'Árbol de ' + k + ' monedas', pasoX: 210, pasoY: 58
          });
        }

        /* Simulación opcional */
        var simu = '';
        if (N > 0) {
          var g = rng(semilla), exitos = 0;
          for (var t = 0; t < N; t++) {
            var c2 = 0;
            for (var j2 = 0; j2 < k; j2++) if (g() < 0.5) c2++;
            if (c2 === r) exitos++;
          }
          var fr = exitos / N;
          simu = barras([
            ['Simulación (' + bigTxt(BigInt(N)) + ' lanzamientos)', fr, nc(fr, 4), false],
            ['Respuesta correcta ' + esc(fracTxt(pBien)), fVal(pBien), nc(fVal(pBien), 4), true],
            ['Respuesta de D’Alembert ' + esc(fracTxt(pMal)), fVal(pMal), nc(fVal(pMal), 4), false]
          ]) + kvs([['Lanzamientos simulados', bigTxt(BigInt(N))],
                    ['Veces con ' + r + ' caras', bigTxt(BigInt(exitos))],
                    ['Frecuencia relativa', nc(fr, 4)]]);
        }

        var Emal = [];
        for (var q = 0; q <= k; q++) Emal.push(q + (q === 1 ? ' cara' : ' caras'));

        return fig +
          '<div class="ap-grid2">' +
          tarjeta('Espacio muestral engañoso', fichas(Emal, 'ap-dup') +
            KD('P(' + r + '\\text{ caras}) = ' + fracTex(pMal)) +
            '<p>Tiene ' + (k + 1) + ' elementos, pero <b>no son equiprobables</b>.</p>', 'ap-card-ko') +
          tarjeta('Espacio muestral fiable', fichas(E, 'ap-in') +
            KD('P(' + r + '\\text{ caras}) = \\dfrac{' + A.length + '}{' + E.length + '} = ' + fracTex(pBien)) +
            '<p>Tiene ' + K('2^{' + k + '} = ' + E.length) + ' ramas equiprobables.</p>', 'ap-card-ok') +
          '</div>' +
          fichas(A, 'ap-in2') +
          resultado(fracTxt(pBien), 'probabilidad correcta de obtener ' + r + (r === 1 ? ' cara' : ' caras')) +
          simu +
          nota('<b>Dónde está el error.</b> El conjunto ' + K('\\{0, 1, \\ldots, ' + k + '\\}') +
               ' no es incorrecto como <i>descripción</i> del experimento, pero sus elementos no tienen la misma probabilidad: ' +
               'con ' + k + ' monedas, «' + r + (r === 1 ? ' cara' : ' caras') + '» se consigue de ' + A.length +
               ' maneras distintas y «todas caras» solo de una.') +
          nota('La regla de Laplace ' + K('P(A) = \\dfrac{\\text{casos favorables}}{\\text{casos posibles}}') +
               ' <b>solo</b> se puede aplicar cuando todos los sucesos elementales son equiprobables. ' +
               'Por eso, cuando el experimento se realiza por etapas, el espacio muestral fiable es siempre el de las ' +
               '<b>ramas finales del árbol</b>.');
      });
  };

  /* ==================================================================
     10) tresMonedas — tres monedas: E, sucesos y recuentos (4.2.4.2)
     ================================================================== */
  R.tresMonedas = function (n) {
    shell(n,
      'Tres monedas: recuento por número de caras',
      'Lanzamos varias monedas y anotamos la secuencia completa de caras (C) y cruces (X). ' +
      'Elige el número de monedas (empieza por <code>3</code>) y el número de caras que quieres estudiar (por ejemplo <code>2</code>). ' +
      'Marca «agrupar» para ver cómo se reparten las ramas según cuántas caras salen: ese reparto son, sin más, ' +
      'los números combinatorios.',
      [
        { id: 'k', label: 'Número de monedas', type: 'range', value: 3, min: 1, max: 6, step: 1 },
        { id: 'r', label: 'Número de caras que te interesa', type: 'number', value: 2, min: 0, max: 6 },
        { id: 'agrupa', label: 'Agrupar las ramas por número de caras', type: 'check', value: true },
        { type: 'presets', list: [
          { label: 'Tres monedas, 2 caras', apply: function (c) { c.k.value = 3; c.r.value = 2; } },
          { label: 'Tres monedas, 3 caras', apply: function (c) { c.k.value = 3; c.r.value = 3; } },
          { label: 'Dos monedas, 1 cara', apply: function (c) { c.k.value = 2; c.r.value = 1; } },
          { label: 'Cinco monedas, 3 caras', apply: function (c) { c.k.value = 5; c.r.value = 3; } }
        ] }
      ],
      function (v) {
        var k = entero(v.k, 1, 6, 'El número de monedas');
        var r = entero(v.r, 0, 6, 'El número de caras');
        if (r > k) throw Error('Con ' + k + ' monedas no puedes obtener ' + r + ' caras. Baja el número de caras o sube el de monedas.');

        var listas = [];
        for (var i = 0; i < k; i++) listas.push(['C', 'X']);
        var E = producto(listas, '');
        function cuentaC(s) { var c = 0; for (var j = 0; j < s.length; j++) if (s.charAt(j) === 'C') c++; return c; }
        var A = E.filter(function (s) { return cuentaC(s) === r; });
        var p = laplace(A, E);

        var filas = [], suma = 0, sumaP = frac(0, 1);
        for (var q = 0; q <= k; q++) {
          var grupo = E.filter(function (s) { return cuentaC(s) === q; });
          var pq = laplace(grupo, E);
          suma += grupo.length;
          sumaP = fSuma(sumaP, pq);
          filas.push({
            celdas: [q + (q === 1 ? ' cara' : ' caras'),
                     K('\\dbinom{' + k + '}{' + q + '} = ' + bigTxt(C(k, q))),
                     grupo.join(', '),
                     K(fracTex(pq))],
            clase: q === r ? 'ap-hi' : ''
          });
        }
        filas.push({ celdas: ['Total', K('2^{' + k + '} = ' + E.length), String(suma) + ' ramas', K(fracTex(sumaP))], clase: 'ap-tot' });

        return fichas(E, 'ap-in') +
          KD('E = ' + setTex(E, E) + ', \\qquad |E| = 2^{' + k + '} = ' + E.length) +
          (v.agrupa ? tabla(['Descripción', 'Número de ramas', 'Ramas concretas', 'Probabilidad'], filas) : '') +
          fichas(A, 'ap-in2') +
          resultado(fracTxt(p), 'probabilidad de obtener exactamente ' + r + (r === 1 ? ' cara' : ' caras')) +
          KD('P(' + r + '\\text{ caras}) = \\dfrac{\\dbinom{' + k + '}{' + r + '}}{2^{' + k + '}} = \\dfrac{' +
             bigTxt(C(k, r)) + '}{' + E.length + '} = ' + fracFull(p)) +
          nota('La descripción «' + Array.apply(null, new Array(k + 1)).map(function (x, i2) {
                 return i2 + (i2 === 1 ? ' cara' : ' caras'); }).join(', ') +
               '» es válida como redacción, pero tiene solo ' + (k + 1) + ' elementos <b>no equiprobables</b>. ' +
               'El espacio muestral equiprobable tiene ' + K('2^{' + k + '} = ' + E.length) + ' elementos.') +
          nota('Mira la columna del número de ramas: ' +
               (function () { var L = []; for (var q3 = 0; q3 <= k; q3++) L.push(bigTxt(C(k, q3))); return L.join(' + '); })() +
               ' = ' + E.length + '. Acabas de reconstruir los <b>números combinatorios</b> y una fila del triángulo de Pascal. ' +
               'Con ellos estás a un solo paso de la distribución binomial.');
      });
  };

  /* ==================================================================
     11) devolucion — con y sin devolución (4.2.4.3)
     ================================================================== */
  R.devolucion = function (n) {
    shell(n,
      'Con devolución y sin devolución',
      'En una urna hay bolas distintas y extraemos varias <b>anotando el orden</b>. ' +
      'Escribe las bolas separadas por comas (por ejemplo <code>B, N, R</code> para blanca, negra y roja) ' +
      'y cuántas extracciones haces (por ejemplo <code>2</code>). ' +
      'El applet construye <b>los dos</b> espacios muestrales a la vez para que veas exactamente qué elementos desaparecen ' +
      'cuando la bola no se devuelve.',
      [
        { id: 'bolas', label: 'Bolas de la urna (separadas por comas)', type: 'text', value: 'B, N, R' },
        { id: 'm', label: 'Número de extracciones', type: 'number', value: 2, min: 1, max: 4 },
        { id: 'cual', label: 'Espacio que quieres destacar', type: 'select', options: [
          { value: 'con', label: 'Con devolución (se devuelve la bola)' },
          { value: 'sin', label: 'Sin devolución (la bola no vuelve)' }
        ], value: 'con' },
        { type: 'presets', list: [
          { label: 'Tres bolas, dos extracciones', apply: function (c) { c.bolas.value = 'B, N, R'; c.m.value = 2; } },
          { label: 'Cuatro bolas, dos extracciones', apply: function (c) { c.bolas.value = 'B, N, R, V'; c.m.value = 2; } },
          { label: 'Tres bolas, tres extracciones', apply: function (c) { c.bolas.value = 'B, N, R'; c.m.value = 3; } },
          { label: 'Dos bolas, tres extracciones', apply: function (c) { c.bolas.value = 'B, N'; c.m.value = 3; } }
        ] }
      ],
      function (v) {
        var B = leeE(v.bolas, 6, 'Las bolas de la urna');
        var m = entero(v.m, 1, 4, 'El número de extracciones');
        if (Math.pow(B.length, m) > 64)
          throw Error('Con ' + B.length + ' bolas y ' + m + ' extracciones habría ' + Math.pow(B.length, m) +
                      ' resultados: demasiados para listarlos en clase. Reduce las bolas o las extracciones.');

        /* Generamos las tuplas como listas de bolas: así detectamos las
           repeticiones sin depender de cómo se escriba cada etiqueta. */
        var tuplas = [[]];
        for (var i = 0; i < m; i++) {
          var nuevas = [];
          tuplas.forEach(function (t) {
            B.forEach(function (b) { nuevas.push(t.concat([b])); });
          });
          tuplas = nuevas;
        }
        var Econ = tuplas.map(function (t) { return t.join(''); });
        var Esin = tuplas.filter(function (t) {
          var vistos = {}, ok = true;
          t.forEach(function (b) { if (vistos[b]) ok = false; vistos[b] = 1; });
          return ok;
        }).map(function (t) { return t.join(''); });
        var perdidos = D(Econ, Esin);

        var repetidos = m > B.length;
        var cardCon = Math.pow(B.length, m);
        var cardSin = repetidos ? 0 : Number(V(B.length, m));

        var destaca = v.cual === 'con';
        var pElemCon = frac(1, cardCon);
        var pElemSin = cardSin ? frac(1, cardSin) : null;

        return '<div class="ap-grid2">' +
          tarjeta('Con devolución', fichas(Econ, destaca ? 'ap-in' : '') +
            KD('|E| = VR_{' + B.length + ',' + m + '} = ' + B.length + '^{' + m + '} = ' + cardCon) +
            '<p>Cada resultado tiene probabilidad ' + K(fracTex(pElemCon)) + '.</p>',
            destaca ? 'ap-card-ok' : '') +
          tarjeta('Sin devolución', fichas(Esin, destaca ? '' : 'ap-in') +
            (repetidos
              ? '<p>Es imposible: no puedes sacar ' + m + ' bolas distintas de una urna con ' + B.length + '.</p>'
              : KD('|E| = V_{' + B.length + ',' + m + '} = \\dfrac{' + B.length + '!}{(' + B.length + '-' + m + ')!} = ' + cardSin) +
                '<p>Cada resultado tiene probabilidad ' + K(fracTex(pElemSin)) + '.</p>'),
            destaca ? '' : 'ap-card-ok') +
          '</div>' +
          resultado(cardCon + ' frente a ' + cardSin, 'resultados con devolución frente a sin devolución') +
          tarjeta('Resultados que desaparecen al no devolver la bola',
            fichas(perdidos, 'ap-out') +
            '<p>Son exactamente los que repiten alguna bola: ' + perdidos.length + ' de los ' + cardCon + '.</p>', 'ap-card-avi') +
          nota('El enunciado cambia dos palabras y el espacio muestral pierde ' + perdidos.length + ' elementos. ' +
               '«Con devolución / sin devolución» es la información más fácil de pasar por alto al leer un problema, ' +
               'y es exactamente lo que distinguirá los sucesos <b>independientes</b> de los <b>dependientes</b>.') +
          nota('Fíjate en el detalle: en los dos casos anotamos el <b>orden</b>, así que BN y NB son resultados distintos. ' +
               'Si el enunciado dijera «se extraen dos bolas a la vez», el orden ya no contaría y habría que usar combinaciones.');
      });
  };

  /* ==================================================================
     12) tiposSuceso — los cinco tipos fundamentales (4.3.1)
     ================================================================== */
  function clasificaSuceso(A, E) {
    if (!A.length) return 'imposible';
    if (A.length === E.length) return 'seguro';
    return A.length === 1 ? 'elemental' : 'compuesto';
  }
  var NOMBRE_TIPO = {
    elemental: 'Elemental', compuesto: 'Compuesto',
    seguro: 'Seguro', imposible: 'Imposible'
  };

  R.tiposSuceso = function (n) {
    shell(n,
      'Los cinco tipos de suceso',
      'Un <b>suceso</b> es cualquier subconjunto del espacio muestral. Escribe primero ' + K('E') +
      ' y después el suceso ' + K('A') + ', siempre con los elementos separados por comas. ' +
      'Ejemplo: ' + K('E') + ' = <code>1, 2, 3, 4, 5, 6</code> y ' + K('A') + ' = <code>2, 4, 6</code>. ' +
      'Para escribir el suceso imposible, deja la casilla de ' + K('A') + ' vacía. ' +
      'Antes de mirar el resultado, elige en el desplegable qué tipo crees que es.',
      [
        { id: 'E', label: 'Espacio muestral E', type: 'text', value: '1, 2, 3, 4, 5, 6' },
        { id: 'A', label: 'Suceso A (vacío = suceso imposible)', type: 'text', value: '2, 4, 6' },
        { id: 'tipo', label: 'Tú crees que A es…', type: 'select', options: [
          { value: 'elemental', label: 'Elemental (un solo elemento)' },
          { value: 'compuesto', label: 'Compuesto (dos o más elementos)' },
          { value: 'seguro', label: 'Seguro (coincide con E)' },
          { value: 'imposible', label: 'Imposible (es el conjunto vacío)' }
        ], value: 'compuesto' },
        { type: 'presets', list: [
          { label: 'Salir par', apply: function (c) { c.E.value = '1, 2, 3, 4, 5, 6'; c.A.value = '2, 4, 6'; } },
          { label: 'Salir un 4', apply: function (c) { c.E.value = '1, 2, 3, 4, 5, 6'; c.A.value = '4'; } },
          { label: 'Salir menor que 7', apply: function (c) { c.E.value = '1, 2, 3, 4, 5, 6'; c.A.value = '1, 2, 3, 4, 5, 6'; } },
          { label: 'Salir un 9', apply: function (c) { c.E.value = '1, 2, 3, 4, 5, 6'; c.A.value = ''; } },
          { label: 'Moneda: sale cara', apply: function (c) { c.E.value = 'C, X'; c.A.value = 'C'; } },
          { label: 'Última cifra par', apply: function (c) { c.E.value = '0, 1, 2, 3, 4, 5, 6, 7, 8, 9'; c.A.value = '0, 2, 4, 6, 8'; } }
        ] }
      ],
      function (v) {
        var E = leeE(v.E, 30, 'El espacio muestral E');
        var A = leeSuceso(v.A, E, 'El suceso A');
        var Ac = Co(E, A);
        var tipo = clasificaSuceso(A, E);
        var acierto = tipo === v.tipo;

        var union = U(A, Ac), inter = I(A, Ac), doble = Co(E, Ac);
        var pA = laplace(A, E), pAc = laplace(Ac, E);

        var filas = [
          ['Elemental', 'Formado por un solo elemento de E', K('\\{x\\} \\subseteq E'),
            insignia(tipo === 'elemental' ? 'es este' : 'no', tipo === 'elemental' ? 'si' : 'info')],
          ['Compuesto', 'Formado por dos o más sucesos elementales', K('|A| \\ge 2'),
            insignia(tipo === 'compuesto' ? 'es este' : 'no', tipo === 'compuesto' ? 'si' : 'info')],
          ['Seguro', 'Ocurre siempre; coincide con E', K('E'),
            insignia(tipo === 'seguro' ? 'es este' : 'no', tipo === 'seguro' ? 'si' : 'info')],
          ['Imposible', 'No ocurre nunca; es el conjunto vacío', K('\\varnothing'),
            insignia(tipo === 'imposible' ? 'es este' : 'no', tipo === 'imposible' ? 'si' : 'info')],
          ['Contrario', 'Todos los elementos de E que no están en A', K('\\overline{A} = E - A'),
            K(setTex(Ac, E))]
        ];

        var fig = venn({ n: 2, pinta: ['a'], color: COL.azulClaro,
          A: A, B: Ac, E: E, nombres: ['A', 'A con barra'],
          cap: 'El rectángulo es siempre E. El suceso A y su contrario cubren todo E y no se solapan.',
          label: 'Diagrama de Venn de A y su contrario' });

        return fig +
          (acierto
            ? bien('Correcto: ' + K('A') + ' es un suceso <b>' + NOMBRE_TIPO[tipo].toLowerCase() + '</b>.')
            : aviso('No es esa. Con ' + A.length + (A.length === 1 ? ' elemento' : ' elementos') + ' de los ' + E.length +
                    ' de ' + K('E') + ', el suceso ' + K('A') + ' es <b>' + NOMBRE_TIPO[tipo].toLowerCase() + '</b>.')) +
          tabla(['Tipo', 'Definición', 'Notación', 'Tu suceso A'], filas) +
          KD('E = ' + setTex(E, E) + ', \\quad A = ' + setTex(A, E) + ', \\quad \\overline{A} = ' + setTex(Ac, E)) +
          kvs([['Cardinal de E', E.length], ['Cardinal de A', A.length],
               ['P(A)', fracTxt(pA)], ['P(contrario de A)', fracTxt(pAc)]]) +
          tabla(['Propiedad del contrario', 'Cálculo con tus datos', '¿Se cumple?'], [
            [K('\\overline{A} = E - A'), K(setTex(Ac, E)), insignia('sí', 'si')],
            [K('A \\cup \\overline{A} = E'), K(setTex(union, E)), insignia(igual(union, E) ? 'sí' : 'no', igual(union, E) ? 'si' : 'no')],
            [K('A \\cap \\overline{A} = \\varnothing'), K(setTex(inter, E)), insignia(inter.length ? 'no' : 'sí', inter.length ? 'no' : 'si')],
            [K('\\overline{\\overline{A}} = A'), K(setTex(doble, E)), insignia(igual(doble, A) ? 'sí' : 'no', igual(doble, A) ? 'si' : 'no')],
            [K('P(A) + P(\\overline{A}) = 1'), K(fracTex(pA) + ' + ' + fracTex(pAc) + ' = ' + fracTex(fSuma(pA, pAc))),
              insignia(fIgual(fSuma(pA, pAc), frac(1, 1)) ? 'sí' : 'no', fIgual(fSuma(pA, pAc), frac(1, 1)) ? 'si' : 'no')]
          ]) +
          nota('Un suceso y su contrario <b>cubren todo</b> el espacio muestral y <b>no se solapan</b> en nada. ' +
               'Esa pareja de propiedades es la que hará funcionar el teorema de la probabilidad total.') +
          nota('El suceso contrario aparece escrito de cuatro formas distintas y conviene reconocerlas todas: ' +
               K('\\overline{A} = A^{c} = A\' = E - A') + '.');
      });
  };

  /* ==================================================================
     13) vennTipos — las cuatro imágenes que hay que grabar (4.3.2)
     ================================================================== */
  var SITUACIONES = {
    contrario:     { lab: 'Un suceso y su contrario', E: '1, 2, 3, 4, 5, 6', A: '1, 5', B: '2, 3, 4, 6' },
    incompatibles: { lab: 'Sucesos incompatibles (disjuntos)', E: '1, 2, 3, 4, 5, 6', A: '1, 3', B: '2' },
    compatibles:   { lab: 'Sucesos compatibles', E: '1, 2, 3, 4, 5, 6', A: '1, 2, 3', B: '2, 4, 6' },
    inclusion:     { lab: 'Inclusión de sucesos', E: '1, 2, 3, 4, 5, 6', A: '3, 6', B: '1, 3, 4, 6' }
  };
  var REGIONES = [
    { value: 'A', label: 'A', pinta: ['a', 'ab'] },
    { value: 'B', label: 'B', pinta: ['b', 'ab'] },
    { value: 'AB', label: 'A ∩ B (los dos a la vez)', pinta: ['ab'] },
    { value: 'AuB', label: 'A ∪ B (al menos uno)', pinta: ['a', 'ab', 'b'] },
    { value: 'noA', label: 'Contrario de A', pinta: ['b', 'out'] },
    { value: 'soloA', label: 'Solo A (A pero no B)', pinta: ['a'] },
    { value: 'nada', label: 'Sin pintar nada', pinta: [] }
  ];

  R.vennTipos = function (n) {
    shell(n,
      'Los tipos de sucesos en un diagrama de Venn',
      'El rectángulo representa siempre el espacio muestral ' + K('E') + ' y cada suceso es una región interior. ' +
      'Escribe ' + K('E') + ', ' + K('A') + ' y ' + K('B') + ' con los elementos separados por comas ' +
      '(por ejemplo ' + K('E') + ' = <code>1, 2, 3, 4, 5, 6</code>, ' + K('A') + ' = <code>1, 2, 3</code>, ' +
      K('B') + ' = <code>2, 4, 6</code>) y elige qué región quieres pintar. ' +
      'Los botones de escenario cargan las cuatro imágenes clásicas que conviene tener grabadas.',
      [
        { id: 'E', label: 'Espacio muestral E', type: 'text', value: '1, 2, 3, 4, 5, 6' },
        { id: 'A', label: 'Suceso A', type: 'text', value: '1, 2, 3' },
        { id: 'B', label: 'Suceso B', type: 'text', value: '2, 4, 6' },
        { id: 'reg', label: 'Región que quieres pintar', type: 'select',
          options: REGIONES.map(function (r) { return { value: r.value, label: r.label }; }), value: 'AB' },
        { id: 'nums', label: 'Escribir los elementos dentro de las regiones', type: 'check', value: true },
        { type: 'presets', list: Object.keys(SITUACIONES).map(function (k2) {
            return { label: SITUACIONES[k2].lab, apply: function (c) {
              c.E.value = SITUACIONES[k2].E; c.A.value = SITUACIONES[k2].A; c.B.value = SITUACIONES[k2].B;
            } };
          }) }
      ],
      function (v) {
        var E = leeE(v.E, 24, 'El espacio muestral E');
        var A = leeSuceso(v.A, E, 'El suceso A');
        var B = leeSuceso(v.B, E, 'El suceso B');
        var reg = REGIONES.filter(function (r) { return r.value === v.reg; })[0] || REGIONES[2];

        var inter = I(A, B), union = U(A, B);
        var disj = inter.length === 0;
        var compl = disj && igual(union, E);
        var incAB = subset(A, B), incBA = subset(B, A);

        var cual = compl ? 'contrario'
          : disj ? 'incompatibles'
          : (incAB || incBA) ? 'inclusion' : 'compatibles';

        var fig = venn({
          n: 2, pinta: reg.pinta, color: COL.azulClaro,
          A: A, B: B, E: v.nums ? E : null, nombres: ['A', 'B'],
          cap: 'Región pintada: ' + esc(reg.label) + '. El rectángulo entero es E.',
          label: 'Diagrama de Venn de A y B con la región ' + reg.label
        });

        var descripciones = {
          contrario: 'A y B son <b>complementarios</b>: no se solapan y entre los dos cubren todo E. Por tanto ' +
                     K('B = \\overline{A}') + '.',
          incompatibles: 'A y B son <b>incompatibles</b> (disjuntos): ' + K('A \\cap B = \\varnothing') +
                     '. No pueden ocurrir a la vez, pero <b>no</b> cubren todo E, así que no son complementarios.',
          compatibles: 'A y B son <b>compatibles</b>: comparten los elementos ' + esc(inter.join(', ')) +
                     ', así que pueden ocurrir simultáneamente.',
          inclusion: 'Hay <b>inclusión</b>: ' + (incAB ? K('A \\subset B') : K('B \\subset A')) +
                     '. Siempre que ocurre el pequeño, ocurre también el grande.'
        };

        var filasP = [
          [K('P(A)'), K(fracTex(laplace(A, E))), String(A.length) + ' de ' + E.length],
          [K('P(B)'), K(fracTex(laplace(B, E))), String(B.length) + ' de ' + E.length],
          [K('P(A \\cap B)'), K(fracTex(laplace(inter, E))), String(inter.length) + ' de ' + E.length],
          [K('P(A \\cup B)'), K(fracTex(laplace(union, E))), String(union.length) + ' de ' + E.length]
        ];

        return fig +
          tarjeta('Situación detectada: ' + SITUACIONES[cual].lab, '<p>' + descripciones[cual] + '</p>',
            cual === 'compatibles' ? '' : 'ap-card-ok') +
          KD('A = ' + setTex(A, E) + ', \\quad B = ' + setTex(B, E) + ', \\quad A \\cap B = ' + setTex(inter, E) +
             ', \\quad A \\cup B = ' + setTex(union, E)) +
          tabla(['Probabilidad', 'Valor exacto', 'Casos'], filasP) +
          ((incAB || incBA)
            ? nota('Lectura probabilística de la inclusión: si ' + (incAB ? K('A \\subset B') : K('B \\subset A')) +
                   ', entonces ' + (incAB ? K('P(A) \\le P(B)') : K('P(B) \\le P(A)')) +
                   '. El suceso más grande es «más fácil».')
            : '') +
          nota('Cambia la región pintada y observa qué elementos quedan dentro. Las cuatro imágenes clásicas son: ' +
               'un suceso y su contrario, dos sucesos incompatibles, dos sucesos compatibles y la inclusión. ' +
               'Interiorizar ahora que «E = rectángulo» y «suceso = región interior» te ahorrará muchísimos errores después.');
      });
  };

  /* ==================================================================
     14) relaciones — compatibles, complementarios, inclusión (4.3.3)
     ================================================================== */
  R.relaciones = function (n) {
    shell(n,
      'Relaciones entre sucesos',
      'Escribe ' + K('E') + ' y dos o tres sucesos, siempre con los elementos separados por comas. ' +
      'Ejemplo del sorteo de lotería en el que solo miramos la última cifra: ' + K('E') + ' = <code>0, 1, 2, 3, 4, 5, 6, 7, 8, 9</code>, ' +
      K('A') + ' = <code>0, 1, 2, 3</code> (menor que 4), ' + K('B') + ' = <code>0, 2, 4, 6, 8</code> (par) y ' +
      K('C') + ' = <code>6, 7, 8, 9</code> (mayor que 5). ' +
      'Deja ' + K('C') + ' vacío si solo quieres estudiar dos sucesos. ' +
      'El applet analiza todas las parejas y te dice si son compatibles, incompatibles, complementarias o si hay inclusión.',
      [
        { id: 'E', label: 'Espacio muestral E', type: 'text', value: '0, 1, 2, 3, 4, 5, 6, 7, 8, 9' },
        { id: 'A', label: 'Suceso A', type: 'text', value: '0, 1, 2, 3' },
        { id: 'B', label: 'Suceso B', type: 'text', value: '0, 2, 4, 6, 8' },
        { id: 'C', label: 'Suceso C (opcional)', type: 'text', value: '6, 7, 8, 9' },
        { type: 'presets', list: [
          { label: 'Última cifra de la lotería', apply: function (c) {
            c.E.value = '0, 1, 2, 3, 4, 5, 6, 7, 8, 9'; c.A.value = '0, 1, 2, 3'; c.B.value = '0, 2, 4, 6, 8'; c.C.value = '6, 7, 8, 9'; } },
          { label: 'Dado: A, B y C del libro', apply: function (c) {
            c.E.value = '1, 2, 3, 4, 5, 6'; c.A.value = '1, 2, 3'; c.B.value = '1, 3, 5'; c.C.value = '2, 4, 6'; } },
          { label: 'Complementarios: par e impar', apply: function (c) {
            c.E.value = '1, 2, 3, 4, 5, 6'; c.A.value = '2, 4, 6'; c.B.value = '1, 3, 5'; c.C.value = ''; } },
          { label: 'Inclusión: D dentro de A', apply: function (c) {
            c.E.value = '1, 2, 3, 4, 5, 6'; c.A.value = '1, 2, 3'; c.B.value = '1, 3'; c.C.value = ''; } }
        ] }
      ],
      function (v) {
        var E = leeE(v.E, 24, 'El espacio muestral E');
        var A = leeSuceso(v.A, E, 'El suceso A');
        var B = leeSuceso(v.B, E, 'El suceso B');
        var Cs = String(v.C || '').trim() ? leeSuceso(v.C, E, 'El suceso C') : null;
        if (!A.length && !B.length) throw Error('Escribe al menos un suceso con elementos. Ejemplo de A: 1, 2, 3');

        var sucesos = [['A', A], ['B', B]];
        if (Cs) sucesos.push(['C', Cs]);

        var parejas = [];
        for (var i = 0; i < sucesos.length; i++) {
          for (var j = i + 1; j < sucesos.length; j++) parejas.push([sucesos[i], sucesos[j]]);
        }

        var filas = parejas.map(function (par) {
          var X = par[0], Y = par[1];
          var inter = I(X[1], Y[1]), union = U(X[1], Y[1]);
          var disj = inter.length === 0;
          var compl = disj && igual(union, E);
          var inc = subset(X[1], Y[1]) ? X[0] + ' ⊂ ' + Y[0]
                  : subset(Y[1], X[1]) ? Y[0] + ' ⊂ ' + X[0] : '—';
          var etiqueta = compl ? insignia('complementarios', 'si')
            : disj ? insignia('incompatibles', 'avi') : insignia('compatibles', 'info');
          return [X[0] + ' y ' + Y[0], K(setTex(inter, E)), K(setTex(union, E)), etiqueta, inc];
        });

        var filasTipo = sucesos.map(function (s) {
          var t = clasificaSuceso(s[1], E);
          return [s[0], K(setTex(s[1], E)), String(s[1].length), NOMBRE_TIPO[t],
                  K(fracTex(laplace(s[1], E))), K(setTex(Co(E, s[1]), E))];
        });

        var fig = venn({
          n: Cs ? 3 : 2, pinta: [], A: A, B: B, C: Cs || [], E: E,
          nombres: ['A', 'B', 'C'],
          cap: 'Cada elemento de E aparece escrito en la región que le corresponde.',
          label: 'Diagrama de Venn con los sucesos definidos'
        });

        var comentarios = [];
        parejas.forEach(function (par) {
          var X = par[0], Y = par[1];
          var inter = I(X[1], Y[1]);
          if (!inter.length && igual(U(X[1], Y[1]), E))
            comentarios.push(X[0] + ' y ' + Y[0] + ' son complementarios: además de no solaparse, entre los dos cubren todo ' + K('E') + '.');
          else if (!inter.length)
            comentarios.push(X[0] + ' y ' + Y[0] + ' son incompatibles, pero <b>no</b> complementarios: su unión es ' +
              K(setTex(U(X[1], Y[1]), E)) + ', que no es ' + K('E') + '.');
          else
            comentarios.push(X[0] + ' y ' + Y[0] + ' son compatibles: comparten ' + K(setTex(inter, E)) + '.');
        });

        return fig +
          tabla(['Suceso', 'Conjunto', 'Cardinal', 'Tipo', 'Probabilidad', 'Contrario'], filasTipo) +
          tabla(['Pareja', 'Intersección', 'Unión', 'Relación', 'Inclusión'], filas) +
          nota('<ul><li>' + comentarios.join('</li><li>') + '</li></ul>') +
          nota('<b>Incompatible y complementario no son lo mismo.</b> Al lanzar un dado, ' + K('A = \\{1,3\\}') + ' y ' +
               K('B = \\{2\\}') + ' son incompatibles, pero no complementarios, porque ' + K('A \\cup B = \\{1,2,3\\} \\ne E') + '. ' +
               'Complementario es un caso particular, más fuerte, de incompatible.') +
          nota('<b>Y ojo con otra confusión, la más cara del tema.</b> Incompatible no significa independiente: ' +
               'incompatible es una propiedad de <b>conjuntos</b> (no se solapan), mientras que independiente será una propiedad ' +
               'de <b>probabilidades</b>. De hecho, si A y B son incompatibles y ocurre A, sabes con certeza que B no ha ocurrido: ' +
               'eso es la máxima dependencia posible.');
      });
  };

  /* ==================================================================
     15) partesE — el espacio de sucesos y 2 elevado a n (4.3.4)
     ================================================================== */
  R.partesE = function (n) {
    shell(n,
      'Espacio de sucesos: por qué son 2 elevado a n',
      'El conjunto de <b>todos</b> los sucesos de un experimento se llama espacio de sucesos y se escribe ' + K('\\mathcal{P}(E)') + '. ' +
      'Escribe el espacio muestral con los elementos separados por comas, por ejemplo <code>C, X</code> o <code>1, 2, 3, 4, 5, 6</code>. ' +
      'El applet lista todos los subconjuntos agrupados por tamaño y comprueba el recuento con los números combinatorios. ' +
      'Con más de 10 elementos ya no se listan: solo se cuentan.',
      [
        { id: 'E', label: 'Espacio muestral E', type: 'text', value: 'C, X' },
        { id: 'ver', label: 'Mostrar la lista completa de subconjuntos', type: 'check', value: true },
        { id: 'tam', label: 'Destacar los sucesos con este número de elementos (-1 = ninguno)', type: 'number', value: -1, min: -1, max: 12 },
        { type: 'presets', list: [
          { label: 'Moneda (n = 2)', apply: function (c) { c.E.value = 'C, X'; } },
          { label: 'Dado (n = 6)', apply: function (c) { c.E.value = '1, 2, 3, 4, 5, 6'; } },
          { label: 'Frutería (n = 4)', apply: function (c) { c.E.value = 'N, M, P, C'; } },
          { label: 'Cinco colores (n = 5)', apply: function (c) { c.E.value = 'rojo, azul, verde, blanco, negro'; } },
          { label: 'Última cifra (n = 10)', apply: function (c) { c.E.value = '0, 1, 2, 3, 4, 5, 6, 7, 8, 9'; c.ver.value = false; } }
        ] }
      ],
      function (v) {
        var E = leeE(v.E, 20, 'El espacio muestral E');
        var nE = E.length;
        if (nE > 16) throw Error('Con ' + nE + ' elementos el recuento se sale de lo razonable en clase. Usa como mucho 16.');
        var destaca = entero(v.tam, -1, 16, 'El tamaño destacado');
        var total = Math.pow(2, nE);

        var filas = [], sumaTex = [], suma = 0n;
        for (var k = 0; k <= nE; k++) {
          var cuantos = C(nE, k);
          suma += cuantos;
          sumaTex.push(bigTxt(cuantos));
          var nombre = k === 0 ? 'El suceso imposible'
            : k === 1 ? 'Sucesos elementales'
            : k === nE ? 'El suceso seguro (E)' : 'Sucesos con ' + k + ' elementos';
          filas.push({ celdas: [nombre, K('\\dbinom{' + nE + '}{' + k + '} = ' + bigTxt(cuantos)),
                                String(k) + ' elemento' + (k === 1 ? '' : 's')],
                       clase: k === destaca ? 'ap-hi' : '' });
        }
        filas.push({ celdas: ['Total', K('2^{' + nE + '} = ' + bigTxt(BigInt(total))), 'todos los sucesos'], clase: 'ap-tot' });

        var listado = '';
        if (v.ver) {
          if (nE > 10) {
            listado = aviso('Con ' + nE + ' elementos habría ' + bigTxt(BigInt(total)) +
                            ' subconjuntos: demasiados para listarlos. Desmarca la casilla o usa un E más pequeño.');
          } else {
            var P = partes(E, 1200);
            var bloques = '';
            for (var t = 0; t <= nE; t++) {
              var grupo = P.lista.filter(function (s) { return s.length === t; });
              if (!grupo.length) continue;
              bloques += '<p><b>' + grupo.length + ' suceso' + (grupo.length === 1 ? '' : 's') + ' con ' + t +
                ' elemento' + (t === 1 ? '' : 's') + ':</b></p>' +
                fichas(grupo.map(function (s) { return setTxt(s, E); }), t === destaca ? 'ap-in2' : 'ap-in');
            }
            listado = bloques;
          }
        }

        return resultado(bigTxt(BigInt(total)), 'sucesos distintos, es decir, ' + K('|\\mathcal{P}(E)| = 2^{' + nE + '}')) +
          KD('|\\mathcal{P}(E)| = 2^{|E|} = 2^{' + nE + '} = ' + bigTxt(BigInt(total))) +
          tabla(['Grupo', 'Cuántos hay', 'Tamaño'], filas) +
          listado +
          nota('<b>Por qué sale ' + K('2^n') + '.</b> Para construir un subconjunto recorremos los ' + nE +
               ' elementos y tomamos por cada uno una decisión binaria: «lo meto» o «no lo meto». ' +
               'Son ' + nE + ' decisiones independientes con 2 opciones cada una, así que por la regla del producto salen ' +
               K('2^{' + nE + '}') + ' subconjuntos. Y no olvides que entre ellos están siempre ' + K('\\varnothing') +
               ' y el propio ' + K('E') + '.') +
          nota('Comprobación con combinatoria: ' + KD('\\sum_{k=0}^{' + nE + '} \\dbinom{' + nE + '}{k} = ' +
               sumaTex.join(' + ') + ' = ' + bigTxt(suma) + ' = 2^{' + nE + '}')) +
          nota('Resulta sorprendente: con solo ' + nE + ' resultados posibles se pueden formular ' + bigTxt(BigInt(total)) +
               ' preguntas distintas sobre el experimento.');
      });
  };

  /* ==================================================================
     16) trampaElemental — el tipo no depende de la redacción (4.3.5)
     ================================================================== */
  var TRAMPAS = [
    { txt: 'Salir un 2', E: '1, 2, 3, 4, 5, 6', A: '2',
      m: 'Un único elemento: elemental. Aquí no hay trampa.' },
    { txt: 'Salir múltiplo de 5', E: '1, 2, 3, 4, 5, 6', A: '5',
      m: 'Suena compuesto porque la frase es elaborada, pero en este espacio muestral solo hay un múltiplo de 5. El conjunto tiene un único elemento: es elemental.' },
    { txt: 'Salir número primo', E: '1, 2, 3, 4, 5, 6', A: '2, 3, 5',
      m: 'Tres elementos: compuesto.' },
    { txt: 'Salir impar', E: '1, 2, 3, 4, 5, 6', A: '1, 3, 5',
      m: 'Tres elementos: compuesto.' },
    { txt: 'Salir par e impar a la vez', E: '1, 2, 3, 4, 5, 6', A: '',
      m: 'Ningún número es par e impar al mismo tiempo: el conjunto es vacío y el suceso es imposible.' },
    { txt: 'Que no salga un 7', E: '1, 2, 3, 4, 5, 6', A: '1, 2, 3, 4, 5, 6',
      m: 'En un dado nunca sale un 7, así que la condición la cumplen los seis resultados: es el suceso seguro.' },
    { txt: 'Salir número de una cifra', E: '1, 2, 3, 4, 5, 6', A: '1, 2, 3, 4, 5, 6',
      m: 'Todos los resultados tienen una cifra: es el suceso seguro disfrazado de frase complicada.' },
    { txt: 'Salir mayor que 4', E: '1, 2, 3, 4, 5, 6', A: '5, 6',
      m: 'Dos elementos: compuesto. Cuidado con «mayor que», que no incluye el 4.' },
    { txt: 'Salir un número mayor o igual que 6', E: '1, 2, 3, 4, 5, 6', A: '6',
      m: 'Solo el 6 cumple la condición: elemental, pese a lo larga que es la frase.' },
    { txt: 'Salir cara', E: 'C, X', A: 'C',
      m: 'Con la moneda, «salir cara» es elemental: el espacio muestral solo tiene dos elementos.' },
    { txt: 'La última cifra del premio es par', E: '0, 1, 2, 3, 4, 5, 6, 7, 8, 9', A: '0, 2, 4, 6, 8',
      m: 'Cinco elementos: compuesto.' },
    { txt: 'La última cifra del premio es mayor que 8', E: '0, 1, 2, 3, 4, 5, 6, 7, 8, 9', A: '9',
      m: 'Solo el 9 es mayor que 8: elemental.' }
  ];

  R.trampaElemental = function (n) {
    shell(n,
      'La trampa del suceso elemental',
      'Elige un enunciado, escribe <b>tú</b> el conjunto que le corresponde (elementos separados por comas, ' +
      'por ejemplo <code>2, 4, 6</code>; deja la casilla vacía si crees que es el suceso imposible) y di de qué tipo es. ' +
      'La regla de oro: <b>traduce siempre la frase a un conjunto antes de clasificar</b>, porque el tipo no depende de cómo ' +
      'esté redactado el enunciado, sino de cuántos elementos de ' + K('E') + ' contiene.',
      [
        { id: 'idx', label: 'Enunciado', type: 'select',
          options: TRAMPAS.map(function (t, i) { return { value: String(i), label: t.txt }; }), value: '1' },
        { id: 'resp', label: 'Tu conjunto (vacío = suceso imposible)', type: 'text', value: '', placeholder: '5' },
        { id: 'tipo', label: 'Tú crees que es…', type: 'select', options: [
          { value: 'elemental', label: 'Elemental' }, { value: 'compuesto', label: 'Compuesto' },
          { value: 'seguro', label: 'Seguro' }, { value: 'imposible', label: 'Imposible' }
        ], value: 'compuesto' },
        { type: 'presets', list: [
          { label: 'Salir múltiplo de 5', apply: function (c) { c.idx.value = '1'; c.resp.value = ''; } },
          { label: 'Salir número de una cifra', apply: function (c) { c.idx.value = '6'; c.resp.value = ''; } },
          { label: 'Salir par e impar', apply: function (c) { c.idx.value = '4'; c.resp.value = ''; } },
          { label: 'Última cifra mayor que 8', apply: function (c) { c.idx.value = '11'; c.resp.value = ''; } }
        ] }
      ],
      function (v) {
        var t = TRAMPAS[entero(v.idx, 0, TRAMPAS.length - 1, 'El enunciado')];
        var E = leeE(t.E, 20, 'El espacio muestral E');
        var correcto = t.A ? leeSuceso(t.A, E, 'La solución') : [];
        var tipoOk = clasificaSuceso(correcto, E);
        var tuyo = leeSuceso(v.resp, E, 'Tu conjunto');
        var vacio = !String(v.resp || '').trim();

        var conjOk = igual(tuyo, correcto);
        var tipoAcierto = v.tipo === tipoOk;
        var pA = laplace(correcto, E);

        var descomposicion = correcto.length > 1
          ? nota('Todo suceso compuesto se puede escribir como unión de sus sucesos elementales: ' +
                 KD(setTex(correcto, E) + ' = ' + correcto.map(function (x) { return '\\{' + esc(x) + '\\}'; }).join(' \\cup ')) +
                 'Esta descomposición es la que permitirá sumar probabilidades de sucesos elementales.')
          : '';

        var aunSinResponder = (vacio && correcto.length)
          ? nota('Has dejado la casilla vacía, así que el applet interpreta que propones el suceso imposible.')
          : '';

        return tarjeta('Enunciado', '<p>Experimento con ' + K('E = ' + setTex(E, E)) + '.</p><p><b>«' + esc(t.txt) + '»</b></p>') +
          aunSinResponder +
          (conjOk
            ? bien('Conjunto correcto: ' + K(setTex(correcto, E)) + '.')
            : aviso('Tu conjunto es ' + K(setTex(tuyo, E)) + ', pero el correcto es ' + K(setTex(correcto, E)) + '.')) +
          (tipoAcierto
            ? bien('Tipo correcto: <b>' + NOMBRE_TIPO[tipoOk].toLowerCase() + '</b>.')
            : aviso('El tipo no es ese: con ' + correcto.length + (correcto.length === 1 ? ' elemento' : ' elementos') +
                    ' de los ' + E.length + ' de ' + K('E') + ', el suceso es <b>' + NOMBRE_TIPO[tipoOk].toLowerCase() + '</b>.')) +
          kvs([['Conjunto correcto', setTxt(correcto, E)],
               ['Número de elementos', correcto.length],
               ['Tipo', NOMBRE_TIPO[tipoOk]],
               ['Probabilidad', fracTxt(pA)]]) +
          nota('<b>Por qué.</b> ' + t.m) +
          descomposicion +
          nota('Conclusión: el tipo de un suceso <b>no</b> depende de la redacción, sino de cuántos elementos de ' + K('E') +
               ' contiene. Frases largas pueden esconder sucesos elementales, y frases sencillas pueden esconder el suceso seguro.');
      });
  };

  /* ==================================================================
     17) traductor — del lenguaje natural al de conjuntos (4.3.6)
     ================================================================== */
  /* Redacción natural del enunciado en los experimentos de monedas:
     «Salen al menos 2 caras», «No sale ninguna cara». */
  function fraseMonedas(cond, k) {
    if (cond.value === 'ningu') return 'No sale ninguna cara';
    if (cond.value === 'exact' && k === 0) return 'No sale ninguna cara';
    return 'Salen ' + cond.label + ' ' + k + (k === 1 ? ' cara' : ' caras');
  }

  var EXPS_TRAD = {
    monedas3: {
      lab: 'Lanzar tres monedas (se cuentan las caras)',
      frase: fraseMonedas,
      construye: function () {
        var listas = [['C', 'X'], ['C', 'X'], ['C', 'X']];
        var E = producto(listas, '');
        return E.map(function (s) {
          var c = 0; for (var i = 0; i < s.length; i++) if (s.charAt(i) === 'C') c++;
          return { lab: s, val: c };
        });
      },
      max: 3
    },
    monedas4: {
      lab: 'Lanzar cuatro monedas (se cuentan las caras)',
      frase: fraseMonedas,
      construye: function () {
        var listas = [['C', 'X'], ['C', 'X'], ['C', 'X'], ['C', 'X']];
        var E = producto(listas, '');
        return E.map(function (s) {
          var c = 0; for (var i = 0; i < s.length; i++) if (s.charAt(i) === 'C') c++;
          return { lab: s, val: c };
        });
      },
      max: 4
    },
    dado: {
      lab: 'Lanzar un dado (se mira el número)',
      frase: function (cond, k) {
        if (cond.value === 'ningu') return 'Sale un cero (imposible en el dado)';
        return 'Sale un número ' + cond.rel + ' ' + k;
      },
      construye: function () {
        var L = [];
        for (var i = 1; i <= 6; i++) L.push({ lab: String(i), val: i });
        return L;
      },
      max: 6
    },
    loteria: {
      lab: 'Última cifra del número premiado en la lotería',
      frase: function (cond, k) {
        if (cond.value === 'ningu') return 'La última cifra es un cero';
        return 'La última cifra es ' + cond.rel + ' ' + k;
      },
      construye: function () {
        var L = [];
        for (var i = 0; i <= 9; i++) L.push({ lab: String(i), val: i });
        return L;
      },
      max: 9
    }
  };

  var CONDICIONES = [
    { value: 'exact', label: 'exactamente', rel: 'igual a', test: function (x, k) { return x === k; }, tex: 'x = k' },
    { value: 'menos', label: 'al menos', rel: 'mayor o igual que', test: function (x, k) { return x >= k; }, tex: 'x \\ge k' },
    { value: 'maxim', label: 'como máximo', rel: 'menor o igual que', test: function (x, k) { return x <= k; }, tex: 'x \\le k' },
    { value: 'mas', label: 'más de', rel: 'mayor que', test: function (x, k) { return x > k; }, tex: 'x > k' },
    { value: 'menor', label: 'menos de', rel: 'menor que', test: function (x, k) { return x < k; }, tex: 'x < k' },
    { value: 'ningu', label: 'ninguna', rel: 'igual a', test: function (x) { return x === 0; }, tex: 'x = 0' }
  ];

  R.traductor = function (n) {
    shell(n,
      'Del lenguaje natural al lenguaje de conjuntos',
      'Los problemas de examen están redactados en castellano, pero se resuelven en teoría de conjuntos. ' +
      'Elige el experimento y construye el enunciado con el desplegable de la condición y el número. ' +
      'Por ejemplo, «al menos» + <code>1</code> en el experimento de tres monedas produce el enunciado ' +
      '«sale al menos una cara». Escribe primero cuántos elementos crees que tendrá el suceso ' +
      '(en la casilla «tu recuento», por ejemplo <code>7</code>) y después compara con la respuesta del applet.',
      [
        { id: 'exp', label: 'Experimento', type: 'select',
          options: Object.keys(EXPS_TRAD).map(function (k2) { return { value: k2, label: EXPS_TRAD[k2].lab }; }),
          value: 'monedas3' },
        { id: 'cond', label: 'Condición del enunciado', type: 'select',
          options: CONDICIONES.map(function (c) { return { value: c.value, label: c.label }; }), value: 'menos' },
        { id: 'k', label: 'Número k del enunciado', type: 'number', value: 1, min: 0, max: 9 },
        { id: 'guess', label: 'Tu recuento: ¿cuántos elementos tendrá el suceso?', type: 'number', value: 0, min: 0, max: 64 },
        { id: 'tablaCompleta', label: 'Mostrar la tabla de traducción completa', type: 'check', value: true },
        { type: 'presets', list: [
          { label: 'Al menos una cara', apply: function (c) { c.exp.value = 'monedas3'; c.cond.value = 'menos'; c.k.value = 1; } },
          { label: 'Exactamente dos caras', apply: function (c) { c.exp.value = 'monedas3'; c.cond.value = 'exact'; c.k.value = 2; } },
          { label: 'Como máximo dos caras', apply: function (c) { c.exp.value = 'monedas3'; c.cond.value = 'maxim'; c.k.value = 2; } },
          { label: 'Más de tres caras (imposible)', apply: function (c) { c.exp.value = 'monedas3'; c.cond.value = 'mas'; c.k.value = 3; } },
          { label: 'Dado: al menos un 5', apply: function (c) { c.exp.value = 'dado'; c.cond.value = 'menos'; c.k.value = 5; } },
          { label: 'Lotería: cifra menor que 4', apply: function (c) { c.exp.value = 'loteria'; c.cond.value = 'menor'; c.k.value = 4; } }
        ] }
      ],
      function (v) {
        var exp = EXPS_TRAD[v.exp];
        var datos = exp.construye();
        var E = datos.map(function (d) { return d.lab; });
        var cond = CONDICIONES.filter(function (c) { return c.value === v.cond; })[0] || CONDICIONES[0];
        var k = entero(v.k, 0, 9, 'El número k del enunciado');
        var guess = entero(v.guess, 0, 64, 'Tu recuento');

        var A = datos.filter(function (d) { return cond.test(d.val, k); }).map(function (d) { return d.lab; });
        var Ac = Co(E, A);
        var pA = laplace(A, E), pAc = laplace(Ac, E);
        var enunciado = exp.frase(cond, k);

        var filas = [];
        if (v.tablaCompleta) {
          CONDICIONES.forEach(function (c) {
            for (var kk = 0; kk <= exp.max; kk++) {
              if (c.value === 'ningu' && kk > 0) continue;
              var B = datos.filter(function (d) { return c.test(d.val, kk); }).map(function (d) { return d.lab; });
              var esActual = c.value === cond.value && (kk === k || (c.value === 'ningu' && k === 0));
              filas.push({
                celdas: [exp.frase(c, kk),
                         B.length > 12 ? '(' + B.length + ' resultados)' : setTxt(B, E),
                         String(B.length),
                         K(fracTex(laplace(B, E)))],
                clase: esActual ? 'ap-hi' : ''
              });
            }
          });
        }

        /* Con recuento 0 (valor inicial) entendemos que el alumno todavía no
           ha apostado, salvo que el suceso sea de verdad vacío. */
        var comparacion = (guess === 0 && A.length > 0)
          ? nota('Escribe tu recuento en la casilla «Tu recuento» antes de mirar el resultado: la comparación aparecerá aquí.')
          : guess === A.length
          ? bien('Tu recuento coincide: el suceso tiene <b>' + A.length + '</b> elemento' + (A.length === 1 ? '' : 's') + '.')
          : aviso('Tu recuento era ' + guess + ', pero el suceso tiene <b>' + A.length + '</b> elemento' +
                  (A.length === 1 ? '' : 's') + '. Cuenta las fichas resaltadas para ver dónde se te ha escapado.');

        var consejo = (cond.value === 'menos' || cond.value === 'maxim' || cond.value === 'mas' || cond.value === 'menor')
          ? nota('<b>Regla de oro.</b> Las expresiones «al menos» y «como máximo» son casi siempre una invitación a trabajar con el ' +
                 '<b>suceso contrario</b>, porque el contrario tiene muchos menos casos que contar. ' +
                 'Aquí: contar directamente los ' + A.length + ' resultados de ' + K('A') + ' es tedioso; contar los ' + Ac.length +
                 ' de ' + K('\\overline{A}') + ' es inmediato, y luego se aplica' +
                 KD('P(A) = 1 - P(\\overline{A}) = 1 - ' + fracTex(pAc) + ' = ' + fracTex(pA)) +
                 'Probablemente sea la fórmula que más ejercicios resuelve por sí sola.')
          : '';

        return tarjeta('Enunciado en castellano', '<p><b>«' + esc(enunciado) + '»</b></p>') +
          fichas(E.map(function (x) { return x; }), 'ap-in') +
          fichas(A, 'ap-in2') +
          KD('E = ' + (E.length > 12 ? '\\{\\ldots\\},\\ |E| = ' + E.length : setTex(E, E)) +
             ' \\qquad A = ' + (A.length > 12 ? '\\{\\ldots\\}' : setTex(A, E))) +
          comparacion +
          kvs([['Condición matemática', cond.tex.replace('k', String(k))],
               ['Elementos de A', A.length + ' de ' + E.length],
               ['P(A)', fracTxt(pA)],
               ['Contrario', setTxt(Ac, E).length > 40 ? '(' + Ac.length + ' resultados)' : setTxt(Ac, E)],
               ['P(contrario)', fracTxt(pAc)]]) +
          (v.tablaCompleta ? tabla(['Enunciado en castellano', 'Suceso como conjunto', 'Número de elementos', 'Probabilidad'], filas) : '') +
          consejo +
          (A.length === 0 ? aviso('Este enunciado describe el <b>suceso imposible</b>: ningún resultado lo cumple, así que ' +
            K('A = \\varnothing') + ' y ' + K('P(A) = 0') + '.') : '') +
          (A.length === E.length ? nota('Este enunciado describe el <b>suceso seguro</b>: lo cumplen todos los resultados, así que ' +
            K('A = E') + ' y ' + K('P(A) = 1') + '.') : '');
      });
  };

  /* Módulo A cargado: el núcleo espera esta marca para montar los applets. */
  S.extraA = true;
})();
