/* =====================================================================
   est3-applets-a.js · Tema 3 Combinatoria · 2.º Bachillerato
   Módulo A — Introducción al conteo, factorial y variaciones

   Depende de window.EST3 (est3-applets.js).

   Applets registrados aquí (16):
     arbol · multiplicacion · adicion · codigos
     factorial · simplifica · crecimiento
     nym · tresPreguntas · clasificador
     variaciones · variacionesRep · comparaVR · podio · quiniela · complementario

   JavaScript plano, gráficos SVG propios, aritmética BigInt.
   Sin OJS, CDN ni dependencias externas.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.EST3;
  if (!S) return;
  var R = S.registry;
  var K = S.K, KD = S.KD, esc = S.esc, nc = S.nc, kf = S.kf;
  var bigTxt = S.bigTxt, bigTex = S.bigTex, bigAprox = S.bigAprox;
  var shell = S.shell, resultado = S.resultado, pintaTuplas = S.pintaTuplas;
  var svgWrap = S.svgWrap, txt = S.txt, line = S.line, rect = S.rect,
      circle = S.circle, path = S.path, leyenda = S.leyenda, COL = S.COL;
  var entero = S.entero, elementos = S.elementos;

  var MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

  /* Lee "2 3" o "2, 3, 4" y devuelve [2,3] o [2,3,4] */
  function ramas(txt2, maxHojas) {
    var L = String(txt2 || '').trim().split(/[\s,;x·*]+/).filter(Boolean).map(Number);
    if (!L.length || L.some(function (v) { return !Number.isInteger(v) || v < 1; }))
      throw Error('Escribe cuántas opciones tiene cada etapa, separadas por espacios. Ejemplo: 2 3');
    if (L.length > 6) throw Error('Máximo 6 etapas para que el árbol se pueda dibujar.');
    var prod = L.reduce(function (a, b) { return a * b; }, 1);
    if (prod > (maxHojas || 64))
      throw Error('El árbol tendría ' + prod + ' ramas finales y no cabe en pantalla. Prueba con un producto de como mucho ' + (maxHojas || 64) + '.');
    return L;
  }

  /* ==================================================================
     1) arbol — el diagrama de árbol, herramienta previa a todo
     ================================================================== */
  var ESCEN_ARBOL = {
    menu: {
      etapas: '2 3',
      nombres: 'Primer plato | Segundo plato',
      ops: 'Ensalada, Sopa | Pollo, Pescado, Pasta',
      cap: 'Un menú con 2 primeros y 3 segundos: 2 · 3 = 6 menús distintos.'
    },
    monedas: {
      etapas: '2 2 2',
      nombres: 'Tirada 1 | Tirada 2 | Tirada 3',
      ops: 'C, X | C, X | C, X',
      cap: 'Tres lanzamientos de una moneda: 2 · 2 · 2 = 2³ = 8 resultados.'
    },
    ropa: {
      etapas: '3 2',
      nombres: 'Camiseta | Pantalón',
      ops: 'Roja, Verde, Azul | Vaquero, Chándal',
      cap: 'Tres camisetas y dos pantalones: 3 · 2 = 6 conjuntos.'
    },
    ruta: {
      etapas: '3 2 2',
      nombres: 'Casa→Plaza | Plaza→Parque | Parque→Escuela',
      ops: 'a, b, c | d, e | f, g',
      cap: 'Caminos encadenados: 3 · 2 · 2 = 12 rutas distintas.'
    },
    dado: {
      etapas: '2 6',
      nombres: 'Moneda | Dado',
      ops: 'C, X | 1, 2, 3, 4, 5, 6',
      cap: 'Moneda y dado a la vez: 2 · 6 = 12 resultados equiprobables.'
    }
  };

  R.arbol = function (n) {
    shell(n,
      'Diagrama de árbol',
      'El diagrama de árbol es la herramienta que hay <b>antes</b> de cualquier fórmula: dibuja todos los casos y los cuenta uno a uno. ' +
      'Escribe cuántas opciones tiene cada etapa separadas por <b>espacios</b>. ' +
      'Ejemplos válidos: <code>2 3</code> (dos primeros y tres segundos), <code>2 2 2</code> (tres lanzamientos de moneda), <code>3 2 2</code>. ' +
      'En «Nombres» y «Opciones» separa las etapas con la barra <code>|</code> y las opciones de cada etapa con <b>comas</b>: ' +
      '<code>Ensalada, Sopa | Pollo, Pescado, Pasta</code>. ' +
      'Observa cómo el número de ramas finales es siempre el <b>producto</b> de las opciones de cada etapa.',
      [
        { id: 'et',  label: 'Opciones por etapa', type: 'text', value: '2 3' },
        { id: 'nom', label: 'Nombres de las etapas (separadas por |)', type: 'text', value: 'Primer plato | Segundo plato' },
        { id: 'ops', label: 'Opciones (etapas con |, opciones con comas)', type: 'text', value: 'Ensalada, Sopa | Pollo, Pescado, Pasta' },
        { id: 'hojas', label: 'Mostrar la lista de resultados finales', type: 'check', value: true },
        { type: 'presets', list: [
          { label: 'Menú del día',       apply: function (c) { pon(c, 'menu'); } },
          { label: 'Tres monedas',       apply: function (c) { pon(c, 'monedas'); } },
          { label: 'Camiseta y pantalón',apply: function (c) { pon(c, 'ropa'); } },
          { label: 'Rutas encadenadas',  apply: function (c) { pon(c, 'ruta'); } },
          { label: 'Moneda y dado',      apply: function (c) { pon(c, 'dado'); } }
        ] }
      ],
      function (v) {
        var L = ramas(v.et, 64);
        var nombres = String(v.nom || '').split('|').map(function (s) { return s.trim(); });
        var opsRaw  = String(v.ops || '').split('|').map(function (s) { return s.trim(); });

        /* Etiquetas de cada etapa: las escritas o, si faltan, automáticas */
        var etiquetas = L.map(function (k, i) {
          var lista = (opsRaw[i] || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
          if (lista.length !== k) {
            lista = [];
            for (var j = 0; j < k; j++) lista.push(String.fromCharCode(65 + j) + (i + 1));
          }
          return lista;
        });

        return dibujaArbol(L, nombres, etiquetas, v.hojas);
      });

    function pon(c, k) {
      var e = ESCEN_ARBOL[k];
      c.et.value = e.etapas; c.nom.value = e.nombres; c.ops.value = e.ops;
    }
  };

  /* Dibuja un árbol de izquierda a derecha, con textos grandes. */
  function dibujaArbol(L, nombres, etiquetas, verHojas) {
    var niveles = L.length;
    var hojas = L.reduce(function (a, b) { return a * b; }, 1);

    var W = 1000;
    var filaH = Math.max(26, Math.min(46, 760 / hojas));
    var H = Math.max(240, hojas * filaH + 110);
    var ml = 90, mr = 250, mt = 66, mb = 26;
    var anchoNivel = (W - ml - mr) / niveles;

    var body = '';

    /* Cabecera con el nombre de cada etapa */
    body += rect(0, 0, W, 44, '#f2f7fd', '#cfe0f2', { r: 0, sw: 1 });
    for (var i = 0; i < niveles; i++) {
      var cx = ml + anchoNivel * (i + 0.5);
      var nom = nombres[i] && nombres[i].length ? nombres[i] : 'Etapa ' + (i + 1);
      body += txt(cx, 21, esc(nom), { size: 16, weight: '700', fill: COL.azulOsc });
      body += txt(cx, 38, L[i] + (L[i] === 1 ? ' opción' : ' opciones'), { size: 13.5, fill: '#546e7a' });
      if (i > 0) body += line(ml + anchoNivel * i, 0, ml + anchoNivel * i, H - mb, '#e3ecf5', 1);
    }

    /* Raíz */
    var y0 = mt, yTotal = H - mb - mt;
    var rootY = y0 + yTotal / 2;
    body += circle(ml - 34, rootY, 13, COL.azulOsc, '#fff', 2);
    body += txt(ml - 34, rootY + 30, 'inicio', { size: 13.5, weight: '700', fill: '#546e7a' });

    /* Recorrido recursivo: cada nodo ocupa una franja vertical */
    var caminos = [];
    (function rec(nivel, yIni, yFin, xPrev, yPrev, camino) {
      if (nivel === niveles) { caminos.push({ y: yPrev, c: camino.slice() }); return; }
      var k = L[nivel];
      var alto = (yFin - yIni) / k;
      var x = ml + anchoNivel * (nivel + 0.5);
      for (var j = 0; j < k; j++) {
        var ya = yIni + alto * j, yb = ya + alto;
        var y = (ya + yb) / 2;
        var col = [COL.azul, COL.rojo, COL.verde, COL.naranja, COL.morado, COL.teal][nivel % 6];
        /* rama en codo suave */
        body += path('M' + xPrev + ' ' + yPrev + ' C ' + ((xPrev + x) / 2) + ' ' + yPrev +
                     ', ' + ((xPrev + x) / 2) + ' ' + y + ', ' + x + ' ' + y, col, 1.8);
        var et = etiquetas[nivel][j];
        var w = Math.max(34, et.length * 8.6 + 16);
        var hh = Math.min(26, Math.max(19, alto - 4));
        body += rect(x - w / 2, y - hh / 2, w, hh, '#fff', col, { r: 6, sw: 1.8 });
        body += txt(x, y + hh / 2 - 6.5, esc(et), { size: Math.min(14.5, hh - 6), weight: '700', fill: col });
        camino.push(et);
        rec(nivel + 1, ya, yb, x + w / 2, y, camino);
        camino.pop();
      }
    })(0, y0, y0 + yTotal, ml - 21, rootY, []);

    /* Resultados finales a la derecha */
    if (verHojas) {
      var xh = W - mr + 12;
      body += txt(xh, mt - 22, 'Resultados', { anchor: 'start', size: 15, weight: '700', fill: COL.azulOsc });
      caminos.forEach(function (c, idx) {
        var s = c.c.join(' – ');
        if (s.length > 30) s = s.slice(0, 29) + '…';
        body += line(W - mr - 4, c.y, xh - 4, c.y, '#cfd8dc', 1, '3 3');
        body += txt(xh, c.y + 5, (idx + 1) + '. ' + esc(s),
                    { anchor: 'start', size: Math.min(14, filaH - 6), fill: '#37474f', family: MONO });
      });
    }

    /* Pie con la cuenta */
    body += txt(W / 2, H - 6, esc(L.join(' · ') + ' = ' + hojas + ' ramas finales'),
                { size: 16, weight: '700', fill: COL.azulOsc });

    var fig = svgWrap(body, W, H, 'Diagrama de árbol con ' + hojas + ' ramas finales');

    var prodTex = L.join(' \\cdot ') + ' = ' + hojas;
    return fig +
      resultado(String(hojas), 'ramas finales, es decir, casos posibles distintos') +
      '<div class="mx-info">Contar las ramas del árbol equivale a multiplicar las opciones de cada etapa: ' +
      KD(prodTex) +
      'Este es el <b>principio de multiplicación</b>, y toda la combinatoria sale de aquí. ' +
      'Las fórmulas de variaciones, permutaciones y combinaciones no son más que atajos para no tener que dibujar el árbol cuando es enorme.</div>' +
      '<div class="mx-info"><b>Piensa un momento:</b> si añades una etapa más con 3 opciones, ¿el total sube en 3 o se multiplica por 3? ' +
      'Pruébalo escribiendo <code>' + esc(L.join(' ')) + ' 3</code> y comprueba tu respuesta.</div>';
  }

  /* ==================================================================
     2) multiplicacion — el principio de multiplicación con casillas
     ================================================================== */
  R.multiplicacion = function (n) {
    shell(n,
      'Principio de multiplicación',
      'Cuando una tarea se hace por <b>etapas encadenadas</b> y todas se realizan (una <b>y</b> otra <b>y</b> otra), el total es el <b>producto</b>. ' +
      'Escribe las opciones de cada casilla separadas por espacios. Ejemplos: <code>26 26 10 10</code> (dos letras y dos cifras), ' +
      '<code>10 10 10 10</code> (un PIN de 4 dígitos), <code>2 6</code> (moneda y dado). ' +
      'Aquí no hay límite de tamaño: prueba con números grandes y observa la explosión combinatoria.',
      [
        { id: 'et', label: 'Opciones por casilla', type: 'text', value: '26 26 10 10' },
        { type: 'presets', list: [
          { label: 'PIN de 4 dígitos',   apply: function (c) { c.et.value = '10 10 10 10'; } },
          { label: 'Matrícula española', apply: function (c) { c.et.value = '10 10 10 10 20 20 20'; } },
          { label: 'Moneda y dado',      apply: function (c) { c.et.value = '2 6'; } },
          { label: 'Menú de 3 platos',   apply: function (c) { c.et.value = '2 3 4'; } },
          { label: 'Contraseña de 8',    apply: function (c) { c.et.value = '62 62 62 62 62 62 62 62'; } }
        ] }
      ],
      function (v) {
        var L = String(v.et || '').trim().split(/[\s,;x·*]+/).filter(Boolean).map(Number);
        if (!L.length || L.some(function (x) { return !Number.isInteger(x) || x < 1; }))
          throw Error('Escribe enteros positivos separados por espacios. Ejemplo: 26 26 10 10');
        if (L.length > 20) throw Error('Máximo 20 casillas.');

        var tot = 1n;
        L.forEach(function (x) { tot *= BigInt(x); });

        var slots = '<div class="ap-slots">';
        L.forEach(function (x, i) {
          if (i) slots += '<span class="ap-mul">×</span>';
          slots += '<span class="ap-slot">' + x + '<small>casilla ' + (i + 1) + '</small></span>';
        });
        slots += '<span class="ap-mul">=</span><span class="ap-slot" style="border-color:#e07b00;background:#fff7e6;color:#7a4b00">' +
                 bigTxt(tot) + '<small>total</small></span></div>';

        var apr = bigAprox(tot);
        var nota = apr ? '<div class="mx-info">Es aproximadamente ' + K(apr) +
                   '. Con números así ya nadie dibuja el árbol: se multiplica y punto.</div>' : '';

        /* Comparación: cuánto tiempo llevaría probarlas todas a 1000 por segundo */
        var seg = Number(tot) / 1000;
        var tiempo = '';
        if (Number.isFinite(seg) && seg > 1) {
          var u = 'segundos', q = seg;
          if (q > 60) { q /= 60; u = 'minutos'; }
          if (q > 60 && u === 'minutos') { q /= 60; u = 'horas'; }
          if (q > 24 && u === 'horas') { q /= 24; u = 'días'; }
          if (q > 365 && u === 'días') { q /= 365; u = 'años'; }
          tiempo = '<div class="mx-info"><b>Pensamiento crítico.</b> Si una máquina probara 1 000 combinaciones por segundo, ' +
                   'tardaría unos <b>' + nc(q, 2) + ' ' + u + '</b> en agotarlas todas. ' +
                   'Esta es exactamente la idea sobre la que se sostiene la seguridad de una contraseña.</div>';
        }

        return slots +
          resultado(bigTxt(tot), 'casos posibles distintos') +
          '<div class="mx-info">' + KD('N = ' + L.join(' \\cdot ') + ' = ' + bigTex(tot)) + '</div>' +
          nota + tiempo +
          '<div class="mx-info">La clave para reconocerlo es la conjunción: <b>«y»</b> encadena etapas y se traduce en <b>multiplicar</b>. ' +
          'Si en el enunciado aparece <b>«o»</b> entre opciones excluyentes, entonces hay que <b>sumar</b>: mira el applet siguiente.</div>';
      });
  };

  /* ==================================================================
     3) adicion — sumar o multiplicar, esa es la cuestión
     ================================================================== */
  var CASOS_SUMA = [
    { txt: 'En la carta hay 4 primeros y 5 segundos. Pido un primero <b>y</b> un segundo.',
      op: 'x', a: 4, b: 5, expl: 'Las dos etapas se hacen las dos: se encadenan. Se multiplica.' },
    { txt: 'En la carta hay 4 primeros y 5 segundos. Pido <b>un solo</b> plato, primero <b>o</b> segundo.',
      op: '+', a: 4, b: 5, expl: 'Es una sola elección entre dos grupos que no se solapan. Se suma.' },
    { txt: 'Un tren sale a las 9 con 3 vagones libres y otro a las 11 con 5 vagones libres. Cojo <b>un</b> tren.',
      op: '+', a: 3, b: 5, expl: 'O uno o el otro: casos excluyentes. Se suma.' },
    { txt: 'Elijo camiseta entre 3 <b>y</b> pantalón entre 5.',
      op: 'x', a: 3, b: 5, expl: 'Me pongo las dos prendas: etapas encadenadas. Se multiplica.' },
    { txt: 'Un código empieza por una vocal (5 opciones) <b>o</b> por una cifra (10 opciones).',
      op: '+', a: 5, b: 10, expl: 'El primer carácter es uno u otro tipo, nunca los dos. Se suma.' },
    { txt: 'Una clave tiene una vocal (5) seguida de una cifra (10).',
      op: 'x', a: 5, b: 10, expl: 'Hay dos posiciones y ambas se rellenan. Se multiplica.' }
  ];

  R.adicion = function (n) {
    var idx = 0, resp = null;
    var host = n;
    host.classList.add('applet');

    function pinta() {
      var c = CASOS_SUMA[idx];
      var h =
        '<h4 class="mx-title">Applet · Sumar o multiplicar</h4>' +
        '<div class="mx-instr">Lee el enunciado y decide si hay que <b>sumar</b> o <b>multiplicar</b>. ' +
        'La pista está en la conjunción: <b>«y»</b> (se hacen las dos cosas) lleva a multiplicar; ' +
        '<b>«o»</b> entre casos excluyentes lleva a sumar. Pulsa tu respuesta y luego pasa al siguiente.</div>' +
        '<div class="ap-enun">' + c.txt + '</div>' +
        '<div class="ap-btns">' +
          '<button type="button" class="ap-chip" data-r="+">Se suman: ' + c.a + ' + ' + c.b + '</button>' +
          '<button type="button" class="ap-chip" data-r="x">Se multiplican: ' + c.a + ' · ' + c.b + '</button>' +
          '<button type="button" class="ap-chip" data-n="1">Siguiente enunciado</button>' +
        '</div>' +
        '<div class="mx-out ap-out"></div>';
      host.innerHTML = h;
      var out = host.querySelector('.mx-out');

      if (resp) {
        var ok = resp === c.op;
        var val = c.op === '+' ? (c.a + c.b) : (c.a * c.b);
        var mal = c.op === '+' ? (c.a * c.b) : (c.a + c.b);
        out.innerHTML =
          '<div class="' + (ok ? 'ap-ok' : 'ap-ko') + '">' + (ok ? 'Correcto.' : 'No es esa.') + '</div>' +
          '<div class="mx-info">' + c.expl + ' El resultado es <b>' + val + '</b>' +
          (c.op === '+' ? ' (' + c.a + ' + ' + c.b + '), no ' + mal + '.' : ' (' + c.a + ' · ' + c.b + '), no ' + mal + '.') +
          '</div>' +
          '<div class="mx-info">Regla general: ' +
          KD('\\text{casos excluyentes} \\Rightarrow n_1 + n_2 \\qquad \\text{etapas encadenadas} \\Rightarrow n_1 \\cdot n_2') +
          '</div>';
        S.tex(out);
      } else {
        out.innerHTML = '<div class="mx-info">Elige una de las dos opciones.</div>';
      }

      host.querySelectorAll('[data-r]').forEach(function (b) {
        b.addEventListener('click', function () { resp = b.dataset.r; pinta(); });
      });
      host.querySelectorAll('[data-n]').forEach(function (b) {
        b.addEventListener('click', function () {
          idx = (idx + 1) % CASOS_SUMA.length; resp = null; pinta();
        });
      });
    }
    pinta();
  };

  /* ==================================================================
     4) codigos — construir códigos por tramos, con y sin repetición
     ================================================================== */
  R.codigos = function (n) {
    shell(n,
      'Constructor de códigos',
      'Construye un código eligiendo cuántos caracteres tiene y de qué alfabeto salen. ' +
      'Marca la casilla si <b>no</b> se puede repetir ningún carácter. ' +
      'Ejemplo para empezar: alfabeto de 10 (las cifras), longitud 4, con repetición → ' +
      'los 10 000 PIN posibles. Quita la repetición y bajan a 5 040.',
      [
        { id: 'nn',  label: 'Tamaño del alfabeto (n)', type: 'number', min: 1, max: 200, value: 10 },
        { id: 'mm',  label: 'Longitud del código (m)',  type: 'number', min: 0, max: 40,  value: 4 },
        { id: 'rep', label: 'Prohibir repetir caracteres', type: 'check', value: false },
        { type: 'presets', list: [
          { label: 'PIN de 4 cifras',        apply: function (c) { c.nn.value = 10; c.mm.value = 4;  c.rep.checked = false; } },
          { label: 'Letras del alfabeto',    apply: function (c) { c.nn.value = 26; c.mm.value = 3;  c.rep.checked = false; } },
          { label: 'Quiniela de 14',         apply: function (c) { c.nn.value = 3;  c.mm.value = 14; c.rep.checked = false; } },
          { label: 'Podio de 8 atletas',     apply: function (c) { c.nn.value = 8;  c.mm.value = 3;  c.rep.checked = true; } },
          { label: 'Contraseña de 8',        apply: function (c) { c.nn.value = 62; c.mm.value = 8;  c.rep.checked = false; } }
        ] }
      ],
      function (v) {
        var nn = entero(v.nn, 1, 200, 'El tamaño del alfabeto');
        var mm = entero(v.mm, 0, 40, 'La longitud');
        var sinRep = !!v.rep;

        var tot, formula, nombre;
        if (sinRep) {
          if (mm > nn) throw Error('Sin repetición no puedes formar un código de ' + mm + ' caracteres con solo ' + nn + ' símbolos distintos. Sube n, baja m o permite repetir.');
          tot = S.V(nn, mm);
          nombre = 'Variaciones sin repetición';
          formula = 'V_{' + nn + ',' + mm + '} = \\dfrac{' + nn + '!}{(' + nn + '-' + mm + ')!} = ' +
                    (mm > 0 ? desarrolloDesc(nn, mm) + ' = ' : '') + bigTex(tot);
        } else {
          tot = S.VR(nn, mm);
          nombre = 'Variaciones con repetición';
          formula = 'VR_{' + nn + ',' + mm + '} = ' + nn + '^{' + mm + '} = ' + bigTex(tot);
        }

        var slots = '<div class="ap-slots">';
        for (var i = 0; i < Math.min(mm, 14); i++) {
          if (i) slots += '<span class="ap-mul">×</span>';
          slots += '<span class="ap-slot">' + (sinRep ? (nn - i) : nn) + '<small>pos. ' + (i + 1) + '</small></span>';
        }
        if (mm > 14) slots += '<span class="ap-mul">×</span><span class="ap-slot">…<small>hasta ' + mm + '</small></span>';
        slots += '</div>';

        var comparo = '';
        if (mm <= nn && mm > 0) {
          var conRep = S.VR(nn, mm), sinR = S.V(nn, mm);
          var perdida = Number(conRep - sinR) / Number(conRep) * 100;
          comparo = '<div class="ap-grid2">' +
            '<div class="ap-card"><div class="ap-card-tit">Con repetición</div>' +
              resultado(bigTxt(conRep), 'códigos') + '</div>' +
            '<div class="ap-card"><div class="ap-card-tit">Sin repetición</div>' +
              resultado(bigTxt(sinR), 'códigos') + '</div>' +
            '</div>' +
            '<div class="mx-info">Prohibir la repetición elimina el <b>' + nc(perdida, 1) +
            ' %</b> de los códigos. La primera posición sigue teniendo ' + nn +
            ' opciones, pero cada posición siguiente pierde una.</div>';
        }

        var muestra = '';
        if (mm >= 1 && mm <= 4 && nn <= 6) {
          var elems = [];
          for (var j = 0; j < nn; j++) elems.push(nn <= 10 ? String(j) : String.fromCharCode(65 + j));
          var t = S.tuplas(elems, mm, sinRep ? 'V' : 'VR', 200);
          muestra = '<div class="mx-info">Los ' + (t.truncada ? 'primeros ' : '') +
                    'códigos, uno a uno:</div>' + pintaTuplas(t, '');
        }

        return '<div class="mx-info"><b>' + nombre + '</b></div>' + slots +
          resultado(bigTxt(tot), 'códigos distintos') +
          '<div class="mx-info">' + KD(formula) + '</div>' +
          comparo + muestra;
      });
  };

  /* Escribe n(n-1)(n-2)… con como mucho 8 factores visibles */
  function desarrolloDesc(nn, mm) {
    if (mm === 0) return '1';
    var f = [];
    for (var i = 0; i < Math.min(mm, 8); i++) f.push(String(nn - i));
    var s = f.join(' \\cdot ');
    if (mm > 8) s += ' \\cdots ' + (nn - mm + 1);
    return s;
  }

  /* ==================================================================
     5) factorial — la calculadora de factoriales
     ================================================================== */
  R.factorial = function (n) {
    shell(n,
      'El factorial paso a paso',
      'El factorial de un número natural es el producto de todos los naturales desde 1 hasta él: ' +
      '$n! = n\\cdot(n-1)\\cdot(n-2)\\cdots 2\\cdot 1$. ' +
      'Mueve el deslizador o escribe un número entre 0 y 100. ' +
      'Fíjate en dos cosas: en el desarrollo completo, y en la velocidad brutal a la que crece el resultado.',
      [
        { id: 'nn', label: 'n', type: 'range', min: 0, max: 100, step: 1, value: 5 },
        { type: 'presets', list: [
          { label: 'n = 0 (el caso raro)', apply: function (c) { c.nn.value = 0; } },
          { label: 'n = 5',  apply: function (c) { c.nn.value = 5; } },
          { label: 'n = 10', apply: function (c) { c.nn.value = 10; } },
          { label: 'n = 11 (los 11 del equipo)', apply: function (c) { c.nn.value = 11; } },
          { label: 'n = 52 (la baraja de póquer)', apply: function (c) { c.nn.value = 52; } }
        ] }
      ],
      function (v) {
        var nn = entero(v.nn, 0, 100, 'n');
        var val = S.fact(nn);

        var des;
        if (nn === 0) {
          des = '0! = 1';
        } else if (nn <= 12) {
          var f = [];
          for (var i = nn; i >= 1; i--) f.push(i);
          des = nn + '! = ' + f.join(' \\cdot ') + ' = ' + bigTex(val);
        } else {
          des = nn + '! = ' + nn + ' \\cdot ' + (nn - 1) + ' \\cdot ' + (nn - 2) + ' \\cdots 2 \\cdot 1 = ' + bigTex(val);
        }

        /* Recurrencia n! = n · (n-1)! */
        var rec = nn >= 1
          ? '<div class="mx-info">Y con la definición recursiva sale lo mismo: ' +
            KD(nn + '! = ' + nn + ' \\cdot ' + (nn - 1) + '! = ' + nn + ' \\cdot ' + bigTex(S.fact(nn - 1)) + ' = ' + bigTex(val)) +
            '</div>'
          : '';

        /* Nota sobre 0! */
        var nota0 = nn === 0
          ? '<div class="mx-info"><b>¿Por qué $0!=1$?</b> No es un capricho. Si en $n! = n\\cdot(n-1)!$ ponemos $n=1$ ' +
            'queda $1! = 1\\cdot 0!$, y como $1!=1$, forzosamente $0!=1$. ' +
            'Además, hay exactamente <b>una</b> forma de ordenar el conjunto vacío: no hacer nada. ' +
            'Sin este convenio, la fórmula $C_{n,n} = \\dfrac{n!}{n!\\,0!}$ no daría 1 y todas las tablas se romperían.</div>'
          : '';

        var cifras = val.toString().length;
        var apr = bigAprox(val);
        var tam = '<div class="ap-kvs">' +
          '<span class="ap-kv">Cifras del resultado: <b>' + cifras + '</b></span>' +
          (apr ? '<span class="ap-kv">Aproximadamente ' + K(apr) + '</span>' : '') +
          '</div>';

        /* Barra de crecimiento comparada con 10^cifras */
        var esc2 = '';
        if (nn >= 20) {
          esc2 = '<div class="mx-info"><b>Para hacerse una idea.</b> Se estima que el universo observable tiene del orden de ' +
                 K('10^{80}') + ' átomos. ' +
                 (cifras > 80
                   ? 'Tu ' + nn + '! ya supera esa cifra: hay más ordenaciones posibles que átomos.'
                   : 'Tu ' + nn + '! tiene ' + cifras + ' cifras, todavía por debajo.') +
                 ' Con 52 cartas, barajar bien una baraja produce una ordenación que probablemente nunca antes ha existido.</div>';
        }

        return resultado(bigTxt(val), nn + '! · el número de formas de ordenar ' + nn + ' objetos distintos') +
          '<div class="mx-info">' + KD(des) + '</div>' + rec + nota0 + tam + esc2 +
          '<div class="mx-info"><b>Cuidado con un error muy común:</b> $n!$ <u>no</u> es lo mismo que $n\\cdot n$, ' +
          'ni $(a+b)! = a! + b!$, ni $(a\\cdot b)! = a!\\cdot b!$. ' +
          'Compruébalo: $3! + 4! = 6 + 24 = 30$, mientras que $7! = 5\\,040$.</div>';
      });
  };

  /* ==================================================================
     6) simplifica — cocientes de factoriales sin calcularlos enteros
     ================================================================== */
  R.simplifica = function (n) {
    shell(n,
      'Simplificar cocientes de factoriales',
      'Casi nunca hay que desarrollar un factorial entero. En un cociente, la parte de abajo <b>se cancela</b> con la de arriba ' +
      'y solo sobreviven unos pocos factores. Elige $n$ y $m$ y observa la cancelación en color. ' +
      'Ejemplo clásico: $\\dfrac{8!}{5!}$ no obliga a calcular $8!=40\\,320$; basta con $8\\cdot 7\\cdot 6 = 336$.',
      [
        { id: 'nn', label: 'n (arriba)', type: 'number', min: 0, max: 60, value: 8 },
        { id: 'mm', label: 'k (abajo, se cancela hasta aquí)', type: 'number', min: 0, max: 60, value: 5 },
        { type: 'presets', list: [
          { label: '8! / 5!',   apply: function (c) { c.nn.value = 8;  c.mm.value = 5; } },
          { label: '10! / 7!',  apply: function (c) { c.nn.value = 10; c.mm.value = 7; } },
          { label: '22! / 19!', apply: function (c) { c.nn.value = 22; c.mm.value = 19; } },
          { label: '49! / 43!', apply: function (c) { c.nn.value = 49; c.mm.value = 43; } },
          { label: 'n! / n! = 1', apply: function (c) { c.nn.value = 12; c.mm.value = 12; } }
        ] }
      ],
      function (v) {
        var nn = entero(v.nn, 0, 60, 'n');
        var kk = entero(v.mm, 0, 60, 'k');
        if (kk > nn) throw Error('Para que la simplificación sea limpia hace falta k ≤ n. Prueba con k = ' + nn + ' o menos.');

        var q = S.descendente(nn, nn - kk);

        /* Desarrollo con la cola tachada */
        var arriba = '', i;
        var visiblesArriba = Math.min(nn, 12);
        var partes = [];
        for (i = nn; i > nn - Math.min(nn - kk, 8) && i >= 1; i--) partes.push('\\textcolor{#0d47a1}{' + i + '}');
        if (nn - kk > 8) partes.push('\\cdots');
        if (kk >= 1) {
          partes.push('\\cancel{' + kk + '}');
          if (kk >= 2) partes.push('\\cancel{' + (kk - 1) + '}');
          if (kk >= 3) partes.push('\\cdots');
          if (kk >= 3) partes.push('\\cancel{1}');
        }
        arriba = partes.join(' \\cdot ');

        var abajo = kk === 0 ? '1' :
          (kk <= 3 ? (function () { var f = []; for (var j = kk; j >= 1; j--) f.push('\\cancel{' + j + '}'); return f.join(' \\cdot '); })()
                   : '\\cancel{' + kk + '} \\cdot \\cancel{' + (kk - 1) + '} \\cdots \\cancel{1}');

        var sobreviven = [];
        for (i = nn; i > kk; i--) sobreviven.push(i);
        var sobreTex = sobreviven.length === 0 ? '1'
          : (sobreviven.length <= 8 ? sobreviven.join(' \\cdot ')
             : sobreviven.slice(0, 6).join(' \\cdot ') + ' \\cdots ' + sobreviven[sobreviven.length - 1]);

        var faltaCancel = '';
        var tex1 = '\\dfrac{' + nn + '!}{' + kk + '!} = \\dfrac{' + arriba + '}{' + abajo + '} = ' +
                   sobreTex + ' = ' + bigTex(q);

        var cuenta = nn - kk;
        var nota = cuenta === 0
          ? '<div class="mx-info">Cuando $n = k$ se cancela absolutamente todo y el cociente vale <b>1</b>. Por eso $C_{n,n}=1$.</div>'
          : '<div class="mx-info">Sobreviven exactamente <b>' + cuenta + '</b> factor' + (cuenta === 1 ? '' : 'es') +
            ', los ' + cuenta + ' primeros contando hacia abajo desde ' + nn + '. ' +
            'Esto es justo la definición de $V_{' + nn + ',' + cuenta + '}$: ' +
            K('V_{' + nn + ',' + cuenta + '} = \\dfrac{' + nn + '!}{' + kk + '!} = ' + bigTex(q)) + '</div>';

        var comparo = '';
        if (nn <= 25) {
          comparo = '<div class="ap-kvs">' +
            '<span class="ap-kv">' + nn + '! = <b>' + bigTxt(S.fact(nn)) + '</b></span>' +
            '<span class="ap-kv">' + kk + '! = <b>' + bigTxt(S.fact(kk)) + '</b></span>' +
            '<span class="ap-kv">Cociente = <b>' + bigTxt(q) + '</b></span></div>';
        } else {
          comparo = '<div class="mx-info">Aquí ni siquiera merece la pena escribir ' + nn +
                    '!: tiene ' + S.fact(nn).toString().length + ' cifras. Con la cancelación bastan ' + cuenta + ' multiplicaciones.</div>';
        }

        return resultado(bigTxt(q), 'valor del cociente') +
          '<div class="mx-info">' + KD(tex1) + '</div>' + nota + comparo + faltaCancel +
          '<div class="mx-info"><b>Truco de examen.</b> Ante $\\dfrac{n!}{(n-m)!}$, no calcules ningún factorial: ' +
          'escribe directamente $m$ factores decrecientes empezando por $n$. Es más rápido y no te pasas de la calculadora.</div>';
      });
  };

  /* ==================================================================
     7) crecimiento — el factorial frente a las otras velocidades
     ================================================================== */
  R.crecimiento = function (n) {
    shell(n,
      'La velocidad del factorial',
      'Compara cómo crecen cuatro funciones al aumentar $n$: la lineal $n$, la cuadrática $n^2$, la exponencial $2^n$ y el factorial $n!$. ' +
      'El eje vertical está en <b>escala logarítmica</b> (cada marca multiplica por 10) porque de otro modo el factorial se saldría del papel de inmediato. ' +
      'Mueve el deslizador hasta 20 y observa cómo el factorial adelanta a todos.',
      [
        { id: 'nn', label: 'n máximo', type: 'range', min: 4, max: 25, step: 1, value: 14 },
        { id: 'ver2n', label: 'Mostrar 2 elevado a n', type: 'check', value: true },
        { id: 'vern2', label: 'Mostrar n al cuadrado', type: 'check', value: true }
      ],
      function (v) {
        var N = entero(v.nn, 4, 25, 'n máximo');
        var W = 980, H = 480, ml = 88, mr = 210, mt = 34, mb = 62;

        var series = [];
        series.push({ nom: 'n! (factorial)', col: COL.rojo, f: function (k) { return Number(S.fact(k)); } });
        if (v.ver2n) series.push({ nom: '2 elevado a n', col: COL.morado, f: function (k) { return Math.pow(2, k); } });
        if (v.vern2) series.push({ nom: 'n al cuadrado', col: COL.teal, f: function (k) { return k * k || 1; } });
        series.push({ nom: 'n (lineal)', col: COL.gris, f: function (k) { return k || 1; } });

        var maxLog = Math.log10(Number(S.fact(N))) || 1;
        var topDec = Math.ceil(maxLog);
        var body = '';

        var PX = function (k) { return ml + (k / N) * (W - ml - mr); };
        var PY = function (val) {
          var l = Math.log10(Math.max(val, 1));
          return H - mb - (l / topDec) * (H - mt - mb);
        };

        /* Rejilla horizontal: potencias de 10 */
        var paso = Math.max(1, Math.ceil(topDec / 9));
        for (var d = 0; d <= topDec; d += paso) {
          var y = PY(Math.pow(10, d));
          body += line(ml, y, W - mr, y, '#e8eef3', 1);
          body += '<text x="' + (ml - 10) + '" y="' + (y + 5) + '" text-anchor="end" font-size="13.5" fill="#546e7a">10' +
                  '<tspan dy="-6" font-size="10.5">' + d + '</tspan></text>';
        }
        /* Rejilla vertical */
        var pasoX = N <= 12 ? 1 : (N <= 20 ? 2 : 5);
        for (var k = 0; k <= N; k += pasoX) {
          body += line(PX(k), mt, PX(k), H - mb, '#f1f5f8', 1);
          body += txt(PX(k), H - mb + 22, String(k), { size: 14, fill: '#546e7a' });
        }

        /* Ejes */
        body += line(ml, mt, ml, H - mb, COL.eje, 1.8);
        body += line(ml, H - mb, W - mr, H - mb, COL.eje, 1.8);
        body += txt((ml + W - mr) / 2, H - 18, 'n', { size: 17, weight: '700', fill: '#37474f' });
        body += '<text x="24" y="' + ((mt + H - mb) / 2) + '" transform="rotate(-90 24 ' +
                ((mt + H - mb) / 2) + ')" text-anchor="middle" font-size="15" font-weight="700" fill="#37474f">valor (escala logarítmica)</text>';

        /* Curvas */
        series.forEach(function (s) {
          var d2 = '';
          for (var k2 = 1; k2 <= N; k2++) {
            d2 += (k2 === 1 ? 'M' : 'L') + PX(k2).toFixed(1) + ' ' + PY(s.f(k2)).toFixed(1) + ' ';
          }
          body += path(d2, s.col, 3);
          for (var k3 = 1; k3 <= N; k3++) {
            if (N <= 16 || k3 % 2 === 0 || k3 === N) body += circle(PX(k3), PY(s.f(k3)), 4, s.col, '#fff', 1.4);
          }
          body += txt(W - mr + 12, PY(s.f(N)) + 5, esc(s.nom),
                      { anchor: 'start', size: 14.5, weight: '700', fill: s.col });
        });

        var fig = svgWrap(body, W, H, 'Comparación del crecimiento de n, n al cuadrado, 2 elevado a n y n factorial');

        /* Tabla numérica */
        var h = '<table class="ap-tbl ap-cmb"><thead><tr><th>n</th><th>n²</th><th>2ⁿ</th><th>n!</th></tr></thead><tbody>';
        var muestras = [];
        for (var q = 1; q <= N; q++) if (N <= 12 || q % Math.ceil(N / 10) === 0 || q === N) muestras.push(q);
        muestras.forEach(function (q2) {
          h += '<tr><th>' + q2 + '</th><td class="ap-num">' + (q2 * q2) + '</td>' +
               '<td class="ap-num">' + bigTxt(2n ** BigInt(q2)) + '</td>' +
               '<td class="ap-num">' + bigTxt(S.fact(q2)) + '</td></tr>';
        });
        h += '</tbody></table>';

        return fig + h +
          '<div class="mx-info"><b>Lectura crítica.</b> Hasta $n=3$ el factorial va por detrás de $2^n$; a partir de $n=4$ lo adelanta y ya no lo suelta. ' +
          'Con $n=20$ el factorial ya es unos $2{,}3$ billones de veces mayor que $2^{20}$, ' +
          'es decir, más de $2\\cdot 10^{12}$ veces. ' +
          'Por eso los problemas que exigen «probar todas las ordenaciones» se vuelven imposibles enseguida, incluso para un ordenador.</div>';
      });
  };

  /* ==================================================================
     8) nym — quién es n y quién es m
     ================================================================== */
  var CASOS_NYM = [
    { t: 'En una carrera participan <b>8 atletas</b> y queremos saber de cuántas formas puede quedar el <b>podio</b> (oro, plata y bronce).',
      n: 8, m: 3, dn: 'los 8 atletas que pueden ser elegidos', dm: 'los 3 puestos del podio que se reparten' },
    { t: 'En una clase de <b>22 alumnos</b> se eligen <b>delegado, subdelegado y tesorero</b>.',
      n: 22, m: 3, dn: 'los 22 alumnos disponibles', dm: 'los 3 cargos que se cubren' },
    { t: 'Con las letras de la palabra <b>CALOR</b> formamos claves de <b>3 letras</b> distintas.',
      n: 5, m: 3, dn: 'las 5 letras C, A, L, O, R', dm: 'las 3 posiciones de la clave' },
    { t: 'En la <b>Lotería Primitiva</b> se eligen <b>6 números</b> del 1 al <b>49</b>.',
      n: 49, m: 6, dn: 'los 49 números del bombo', dm: 'los 6 números que marcas' },
    { t: 'Una <b>quiniela</b> de <b>14 partidos</b> se rellena con los signos <b>1, X, 2</b>.',
      n: 3, m: 14, dn: 'los 3 signos disponibles', dm: 'los 14 partidos que hay que rellenar' },
    { t: 'De un grupo de <b>7 amigos</b> hay que elegir <b>3</b> para hacer una foto, sin importar el orden.',
      n: 7, m: 3, dn: 'los 7 amigos', dm: 'los 3 que salen en la foto' },
    { t: 'Formamos números de <b>dos cifras</b> con los dígitos <b>1, 2 y 3</b>, pudiendo repetir.',
      n: 3, m: 2, dn: 'los dígitos 1, 2 y 3', dm: 'las 2 cifras del número' },
    { t: 'Se colocan <b>5 personas</b> en un banco, <b>todas</b> ellas.',
      n: 5, m: 5, dn: 'las 5 personas', dm: 'las 5 posiciones: aquí m = n' }
  ];

  R.nym = function (n) {
    var idx = 0, mostrado = false;
    n.classList.add('applet');

    function pinta() {
      var c = CASOS_NYM[idx];
      n.innerHTML =
        '<h4 class="mx-title">Applet · Identificar la n y la m</h4>' +
        '<div class="mx-instr">Antes de tocar ninguna fórmula hay que responder a dos preguntas: ' +
        '¿cuántos elementos hay <b>en el almacén</b>? (esa es la <b>n</b>) y ¿cuántos <b>cojo o coloco</b>? (esa es la <b>m</b>). ' +
        'Frase para recordarlo: <b>«la n es de dónde eliges y la m es cuántos eliges»</b>. ' +
        'Escribe tu respuesta en las casillas y pulsa Comprobar.</div>' +
        '<div class="ap-enun">' + c.t + '</div>' +
        '<div class="mx-inputs">' +
          '<label class="mx-field"><span>n · elementos disponibles</span>' +
            '<input class="mx-in" type="number" id="nyn"></label>' +
          '<label class="mx-field"><span>m · cuántos se eligen o colocan</span>' +
            '<input class="mx-in" type="number" id="nym2"></label>' +
        '</div>' +
        '<div class="ap-btns">' +
          '<button type="button" class="ap-chip" data-a="comp">Comprobar</button>' +
          '<button type="button" class="ap-chip" data-a="sig">Siguiente enunciado</button>' +
        '</div>' +
        '<div class="mx-out ap-out"><div class="mx-info">Rellena las dos casillas.</div></div>';

      var out = n.querySelector('.mx-out');
      var inN = n.querySelector('#nyn'), inM = n.querySelector('#nym2');

      n.querySelector('[data-a="comp"]').addEventListener('click', function () {
        var a = Number(inN.value), b = Number(inM.value);
        var okN = a === c.n, okM = b === c.m;
        out.innerHTML =
          '<div class="ap-kvs">' +
            '<span class="ap-kv">n: <span class="ap-badge ' + (okN ? 'si">correcto' : 'no">es ' + c.n) + '</span></span>' +
            '<span class="ap-kv">m: <span class="ap-badge ' + (okM ? 'si">correcto' : 'no">es ' + c.m) + '</span></span>' +
          '</div>' +
          '<div class="mx-info"><b>n = ' + c.n + '</b>: ' + c.dn + '.<br>' +
          '<b>m = ' + c.m + '</b>: ' + c.dm + '.</div>' +
          (c.n === c.m
            ? '<div class="mx-info">Cuando $m = n$ se colocan <b>todos</b> los elementos: estamos en el terreno de las <b>permutaciones</b>.</div>'
            : (c.m > c.n
               ? '<div class="mx-info">Aquí $m > n$. Solo es posible porque los elementos se <b>repiten</b>: estamos en variaciones con repetición.</div>'
               : '')) ;
        S.tex(out);
      });
      n.querySelector('[data-a="sig"]').addEventListener('click', function () {
        idx = (idx + 1) % CASOS_NYM.length; pinta();
      });
    }
    pinta();
  };

  /* ==================================================================
     9) tresPreguntas — el árbol de decisión que elige la fórmula
     ================================================================== */
  R.tresPreguntas = function (n) {
    shell(n,
      'Las tres preguntas que eligen la fórmula',
      'Toda la combinatoria se decide con tres preguntas. Contéstalas con los desplegables y el applet te dice qué fórmula toca, ' +
      'por qué, y cuánto vale con los $n$ y $m$ que escribas. Pruébalas todas: son solo cinco combinaciones útiles.',
      [
        { id: 'todos', label: '1) ¿Entran TODOS los elementos?', type: 'select', value: 'no', options: [
          { value: 'no', label: 'No, solo elijo unos cuantos (m < n)' },
          { value: 'si', label: 'Sí, uso todos (m = n)' }
        ] },
        { id: 'orden', label: '2) ¿Importa el ORDEN?', type: 'select', value: 'si', options: [
          { value: 'si', label: 'Sí, cambiar el orden da un caso distinto' },
          { value: 'no', label: 'No, solo importa quiénes son' }
        ] },
        { id: 'repite', label: '3) ¿Se pueden REPETIR elementos?', type: 'select', value: 'no', options: [
          { value: 'no', label: 'No, cada elemento aparece como mucho una vez' },
          { value: 'si', label: 'Sí, un elemento puede salir varias veces' }
        ] },
        { id: 'nn', label: 'n', type: 'number', min: 0, max: 60, value: 8 },
        { id: 'mm', label: 'm', type: 'number', min: 0, max: 30, value: 3 }
      ],
      function (v) {
        var nn = entero(v.nn, 0, 60, 'n'), mm = entero(v.mm, 0, 30, 'm');
        var todos = v.todos === 'si', orden = v.orden === 'si', rep = v.repite === 'si';

        var nombre, sim, formula, calc, expl, aviso = '';

        if (todos) {
          if (rep) {
            nombre = 'Permutaciones con repetición';
            sim = 'P_n^{a,b,c,\\dots}';
            formula = 'P_n^{a,b,\\dots} = \\dfrac{n!}{a!\\,b!\\cdots}';
            calc = null;
            expl = 'Se colocan todos los elementos, pero algunos son idénticos entre sí. ' +
                   'Se divide por el factorial de cada repetición porque intercambiar dos copias iguales no crea un caso nuevo. ' +
                   'Necesito saber cuántas veces se repite cada elemento: usa el applet específico.';
          } else {
            nombre = 'Permutaciones (ordinarias)';
            sim = 'P_n';
            formula = 'P_{' + nn + '} = ' + nn + '! = ' + bigTex(S.fact(nn));
            calc = S.fact(nn);
            expl = 'Se colocan los ' + nn + ' elementos, todos distintos, y solo cambia el orden.';
            if (mm !== nn) aviso = 'Has dicho que entran todos, así que aquí $m$ no interviene: el resultado solo depende de $n$.';
          }
        } else if (orden) {
          if (rep) {
            nombre = 'Variaciones con repetición';
            sim = 'VR_{n,m}';
            try { calc = S.VR(nn, mm); formula = 'VR_{' + nn + ',' + mm + '} = ' + nn + '^{' + mm + '} = ' + bigTex(calc); }
            catch (e) { calc = null; formula = 'VR_{n,m} = n^m'; }
            expl = 'Importa el orden y los elementos se pueden repetir. Cada una de las ' + mm +
                   ' posiciones tiene siempre las mismas ' + nn + ' opciones.';
            aviso = 'Es el <b>único</b> caso en que $m$ puede ser mayor que $n$.';
          } else {
            nombre = 'Variaciones sin repetición';
            sim = 'V_{n,m}';
            try { calc = S.V(nn, mm); formula = 'V_{' + nn + ',' + mm + '} = \\dfrac{' + nn + '!}{(' + nn + '-' + mm + ')!} = ' + bigTex(calc); }
            catch (e) { calc = null; formula = 'V_{n,m} = \\dfrac{n!}{(n-m)!}'; aviso = e.message; }
            expl = 'Importa el orden y no se repite. La primera posición tiene ' + nn +
                   ' opciones, la segunda ' + (nn - 1) + ', y así ' + mm + ' veces.';
          }
        } else {
          if (rep) {
            nombre = 'Combinaciones con repetición (ampliación)';
            sim = 'CR_{n,m}';
            try { calc = S.CR(nn, mm); formula = 'CR_{' + nn + ',' + mm + '} = \\dbinom{' + (nn + mm - 1) + '}{' + mm + '} = ' + bigTex(calc); }
            catch (e) { calc = null; formula = 'CR_{n,m} = \\dbinom{n+m-1}{m}'; }
            expl = 'No importa el orden y se puede repetir: es el caso de «tres bolas de helado de siete sabores, se puede repetir sabor».';
            aviso = 'Este caso queda fuera del temario básico, pero conviene saber que existe.';
          } else {
            nombre = 'Combinaciones';
            sim = 'C_{n,m}';
            try { calc = S.C(nn, mm); formula = 'C_{' + nn + ',' + mm + '} = \\dbinom{' + nn + '}{' + mm + '} = \\dfrac{' + nn + '!}{' + mm + '!\\,(' + nn + '-' + mm + ')!} = ' + bigTex(calc); }
            catch (e) { calc = null; formula = 'C_{n,m} = \\dfrac{n!}{m!\\,(n-m)!}'; aviso = e.message; }
            expl = 'No importa el orden y no se repite: solo cuenta <b>quiénes</b> forman el grupo, no en qué orden salieron.';
          }
        }

        /* Esquema visual del recorrido */
        var W = 1020, H = 250, body = '';
        var pasos = [
          { p: '¿Todos?',    r: todos ? 'Sí' : 'No' },
          { p: '¿Orden?',    r: todos ? '—' : (orden ? 'Sí' : 'No') },
          { p: '¿Repetir?',  r: rep ? 'Sí' : 'No' }
        ];
        var bw = 190, gap = 46, x0 = 40;
        pasos.forEach(function (p, i) {
          var x = x0 + i * (bw + gap), y = 62;
          body += rect(x, y, bw, 84, '#f2f7fd', COL.azul, { sw: 2.2 });
          body += txt(x + bw / 2, y + 34, esc(p.p), { size: 19, weight: '700', fill: COL.azulOsc });
          body += txt(x + bw / 2, y + 64, esc(p.r), { size: 18, weight: '800', fill: p.r === 'Sí' ? COL.verde : (p.r === 'No' ? COL.rojo : COL.gris) });
          if (i < 2) {
            var xa = x + bw + 6, xb = x + bw + gap - 6;
            body += line(xa, y + 42, xb, y + 42, COL.gris, 2.4);
            body += path('M' + (xb - 10) + ' ' + (y + 36) + ' L' + xb + ' ' + (y + 42) + ' L' + (xb - 10) + ' ' + (y + 48), COL.gris, 2.4);
          }
        });
        var xr = x0 + 3 * (bw + gap);
        body += line(xr - 40, 104, xr - 8, 104, COL.naranja, 2.4);
        body += rect(xr - 4, 62, 250, 84, '#fff7e6', COL.naranja, { sw: 2.4 });
        body += txt(xr + 121, 96, esc(nombre.split(' ')[0]), { size: 19, weight: '800', fill: '#7a4b00' });
        body += txt(xr + 121, 124, esc(nombre.split(' ').slice(1).join(' ') || '—'), { size: 15, fill: '#7a4b00' });
        body += txt(W / 2, 32, 'Recorrido de decisión', { size: 17, weight: '700', fill: '#37474f' });
        body += txt(W / 2, 196, 'La respuesta a las tres preguntas determina la fórmula sin ambigüedad',
                    { size: 14.5, fill: '#546e7a' });

        return svgWrap(body, W, H, 'Esquema de decisión de la fórmula combinatoria') +
          '<div class="mx-info"><b>' + esc(nombre) + '</b> · símbolo ' + K(sim) + '</div>' +
          (calc !== null ? resultado(bigTxt(calc), 'agrupaciones distintas') : '') +
          '<div class="mx-info">' + KD(formula) + '</div>' +
          '<div class="mx-info">' + expl + '</div>' +
          (aviso ? '<div class="mx-info"><b>Ojo:</b> ' + aviso + '</div>' : '');
      });
  };

  /* ==================================================================
     10) clasificador — reconocer el tipo en enunciados reales
     ================================================================== */
  var BANCO_TIPO = [
    { t: 'De 8 atletas, ¿de cuántas formas se puede formar el podio de oro, plata y bronce?',
      k: 'V', n: 8, m: 3, why: 'Importa el orden (no es lo mismo el oro que el bronce) y nadie repite puesto.' },
    { t: '¿Cuántos números de 2 cifras se pueden formar con los dígitos 1, 2 y 3, pudiendo repetir?',
      k: 'VR', n: 3, m: 2, why: 'El 12 y el 21 son distintos (importa el orden) y el 22 es válido (se repite).' },
    { t: '¿De cuántas formas pueden sentarse 5 personas en un banco de 5 plazas?',
      k: 'P', n: 5, m: 5, why: 'Entran todas las personas y solo cambia el orden.' },
    { t: 'De 7 amigos hay que elegir 3 para un equipo. ¿Cuántos equipos distintos hay?',
      k: 'C', n: 7, m: 3, why: 'Un equipo no cambia si dices los nombres en otro orden: no importa el orden.' },
    { t: '¿Cuántas quinielas distintas de 14 partidos se pueden rellenar con 1, X y 2?',
      k: 'VR', n: 3, m: 14, why: 'Cada partido tiene 3 signos y el orden de los partidos está fijado. Los signos se repiten.' },
    { t: '¿Cuántas apuestas distintas hay en la Primitiva eligiendo 6 números del 1 al 49?',
      k: 'C', n: 49, m: 6, why: 'El boleto es el mismo aunque marques los números en otro orden, y no se repite ninguno.' },
    { t: 'Con las letras de CALOR, ¿cuántas claves de 3 letras distintas se pueden formar?',
      k: 'V', n: 5, m: 3, why: 'CAL y LAC son claves distintas, y no se repite letra.' },
    { t: '¿De cuántas maneras se pueden ordenar los 6 libros de una balda?',
      k: 'P', n: 6, m: 6, why: 'Se colocan todos y solo cambia el orden.' },
    { t: 'En una clase de 22 alumnos se eligen delegado, subdelegado y tesorero.',
      k: 'V', n: 22, m: 3, why: 'Los tres cargos son distintos: importa quién ocupa cada uno. Nadie ocupa dos cargos.' },
    { t: 'De 6 plantas distintas, ¿cuántos ramos de 3 plantas se pueden hacer?',
      k: 'C', n: 6, m: 3, why: 'Un ramo es un conjunto: no hay primera ni última planta.' },
    { t: '¿Cuántos códigos de 4 cifras tiene una caja fuerte con teclado del 0 al 9?',
      k: 'VR', n: 10, m: 4, why: 'El 1123 vale (se repite) y el 1123 no es el 3211 (importa el orden).' },
    { t: '¿Cuántos triángulos distintos se pueden formar con 8 puntos, sin tres alineados?',
      k: 'C', n: 8, m: 3, why: 'Un triángulo queda determinado por sus tres vértices, sin orden.' }
  ];
  var NOMBRE_TIPO = {
    V:  'Variaciones sin repetición',
    VR: 'Variaciones con repetición',
    P:  'Permutaciones',
    C:  'Combinaciones'
  };

  R.clasificador = function (n) {
    var orden = BANCO_TIPO.map(function (_, i) { return i; });
    var pos = 0, resp = null, aciertos = 0, intentos = 0;
    n.classList.add('applet');

    function baraja() {
      for (var i = orden.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = orden[i]; orden[i] = orden[j]; orden[j] = t;
      }
    }
    baraja();

    function pinta() {
      var c = BANCO_TIPO[orden[pos]];
      var h =
        '<h4 class="mx-title">Applet · Clasificador de problemas</h4>' +
        '<div class="mx-instr">Este es el paso que más puntos cuesta en un examen: <b>elegir bien la fórmula</b>. ' +
        'Lee el enunciado, decide el tipo y pulsa el botón. El applet te dirá si has acertado y te explicará por qué, ' +
        'con el cálculo completo. Lleva la cuenta de tus aciertos.</div>' +
        '<div class="ap-kvs"><span class="ap-kv">Aciertos: <b>' + aciertos + '</b> de <b>' + intentos + '</b></span>' +
        '<span class="ap-kv">Enunciado <b>' + (pos + 1) + '</b> de <b>' + BANCO_TIPO.length + '</b></span></div>' +
        '<div class="ap-enun">' + c.t + '</div>' +
        '<div class="ap-btns">' +
          '<button type="button" class="ap-chip" data-k="V">Variaciones sin repetición</button>' +
          '<button type="button" class="ap-chip" data-k="VR">Variaciones con repetición</button>' +
          '<button type="button" class="ap-chip" data-k="P">Permutaciones</button>' +
          '<button type="button" class="ap-chip" data-k="C">Combinaciones</button>' +
        '</div>' +
        '<div class="ap-btns"><button type="button" class="ap-chip" data-sig="1">Siguiente enunciado</button></div>' +
        '<div class="mx-out ap-out"></div>';
      n.innerHTML = h;
      var out = n.querySelector('.mx-out');

      if (resp) {
        var ok = resp === c.k;
        var val, form;
        if (c.k === 'V')  { val = S.V(c.n, c.m);  form = 'V_{' + c.n + ',' + c.m + '} = \\dfrac{' + c.n + '!}{' + (c.n - c.m) + '!} = ' + bigTex(val); }
        if (c.k === 'VR') { val = S.VR(c.n, c.m); form = 'VR_{' + c.n + ',' + c.m + '} = ' + c.n + '^{' + c.m + '} = ' + bigTex(val); }
        if (c.k === 'P')  { val = S.fact(c.n);    form = 'P_{' + c.n + '} = ' + c.n + '! = ' + bigTex(val); }
        if (c.k === 'C')  { val = S.C(c.n, c.m);  form = 'C_{' + c.n + ',' + c.m + '} = \\dbinom{' + c.n + '}{' + c.m + '} = ' + bigTex(val); }
        out.innerHTML =
          '<div class="' + (ok ? 'ap-ok' : 'ap-ko') + '">' +
          (ok ? 'Correcto: ' : 'No. La respuesta es: ') + NOMBRE_TIPO[c.k] + '.</div>' +
          '<div class="mx-info">' + c.why + '</div>' +
          '<div class="mx-info">' + KD(form) + '</div>' +
          resultado(bigTxt(val), 'agrupaciones');
        S.tex(out);
      } else {
        out.innerHTML = '<div class="mx-info">Elige el tipo de agrupación.</div>';
      }

      n.querySelectorAll('[data-k]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (resp) return;
          resp = b.dataset.k;
          intentos++;
          if (resp === c.k) aciertos++;
          pinta();
        });
      });
      n.querySelector('[data-sig]').addEventListener('click', function () {
        pos = (pos + 1) % BANCO_TIPO.length;
        if (pos === 0) baraja();
        resp = null; pinta();
      });
    }
    pinta();
  };

  /* ==================================================================
     11) variaciones — V(n,m) con enumeración
     ================================================================== */
  R.variaciones = function (n) {
    shell(n,
      'Variaciones sin repetición',
      'Elige $m$ elementos de un conjunto de $n$, <b>importando el orden</b> y <b>sin repetir</b>. ' +
      'Escribe los elementos separados por espacios o comas. Ejemplos válidos: <code>A B C D</code>, ' +
      '<code>1, 2, 3, 4, 5</code>, <code>oro plata bronce cobre</code>. ' +
      'Si hay pocos, el applet los lista todos para que veas que la fórmula no miente.',
      [
        { id: 'els', label: 'Elementos disponibles', type: 'text', value: 'A B C D' },
        { id: 'mm',  label: 'm · cuántos se eligen', type: 'number', min: 0, max: 12, value: 2 },
        { type: 'presets', list: [
          { label: 'Cuatro letras, de 2 en 2', apply: function (c) { c.els.value = 'A B C D'; c.mm.value = 2; } },
          { label: 'CALOR, claves de 3',       apply: function (c) { c.els.value = 'C A L O R'; c.mm.value = 3; } },
          { label: 'Cinco cifras, de 3 en 3',  apply: function (c) { c.els.value = '1 2 3 4 5'; c.mm.value = 3; } },
          { label: 'Seis banderas, de 2 en 2', apply: function (c) { c.els.value = 'roja verde azul blanca negra amarilla'; c.mm.value = 2; } }
        ] }
      ],
      function (v) {
        var E = elementos(v.els);
        var nn = E.length;
        var mm = entero(v.mm, 0, 12, 'm');
        if (mm > nn) throw Error('No puedes elegir ' + mm + ' elementos distintos de un conjunto de ' + nn + '. Sin repetición hace falta m ≤ n.');

        var val = S.V(nn, mm);
        var t = S.tuplas(E, mm, 'V', 240);

        var slots = '<div class="ap-slots">';
        for (var i = 0; i < Math.min(mm, 12); i++) {
          if (i) slots += '<span class="ap-mul">×</span>';
          slots += '<span class="ap-slot">' + (nn - i) + '<small>puesto ' + (i + 1) + '</small></span>';
        }
        slots += (mm > 0 ? '<span class="ap-mul">=</span><span class="ap-slot" style="border-color:#e07b00;background:#fff7e6;color:#7a4b00">' +
                  bigTxt(val) + '<small>total</small></span>' : '') + '</div>';

        return slots +
          resultado(bigTxt(val), 'variaciones de ' + nn + ' elementos tomados de ' + mm + ' en ' + mm) +
          '<div class="mx-info">' +
          KD('V_{' + nn + ',' + mm + '} = \\dfrac{' + nn + '!}{(' + nn + '-' + mm + ')!} = \\dfrac{' + nn + '!}{' + (nn - mm) + '!} = ' +
             desarrolloDesc(nn, mm) + ' = ' + bigTex(val)) + '</div>' +
          (mm >= 1 && t.lista.length ? '<div class="mx-info">Todas las variaciones, escritas una a una:</div>' + pintaTuplas(t, '') : '') +
          '<div class="mx-info"><b>Fíjate:</b> en la lista aparecen tanto ' +
          (nn >= 2 && mm >= 2 ? '<code>' + esc(E[0] + E[1]) + '</code> como <code>' + esc(E[1] + E[0]) + '</code>' : 'los dos órdenes') +
          '. Son variaciones <b>distintas</b> porque el orden importa. ' +
          'Si no importara, esas dos serían la misma y estaríamos en combinaciones.</div>' +
          '<div class="mx-info"><b>Regla mnemotécnica.</b> Escribe $m$ casillas y ve rellenándolas: ' +
          'la primera tiene $n$ candidatos, la siguiente $n-1$ porque uno ya está colocado, y así sucesivamente. ' +
          'El producto de esas $m$ casillas <b>es</b> la fórmula; el cociente de factoriales solo es la forma compacta de escribirlo.</div>';
      });
  };

  /* ==================================================================
     12) variacionesRep — VR(n,m) = n^m
     ================================================================== */
  R.variacionesRep = function (n) {
    shell(n,
      'Variaciones con repetición',
      'Ahora los elementos <b>se pueden repetir</b>, y el orden sigue importando. ' +
      'Cada una de las $m$ posiciones vuelve a tener las mismas $n$ opciones, así que el resultado es $n^m$. ' +
      'Escribe los elementos separados por espacios: <code>1 2 3</code>, <code>1 X 2</code>, <code>C X</code>. ' +
      'Este es el <b>único</b> caso en que $m$ puede ser mayor que $n$.',
      [
        { id: 'els', label: 'Elementos disponibles', type: 'text', value: '1 2 3' },
        { id: 'mm',  label: 'm · longitud de la agrupación', type: 'number', min: 0, max: 20, value: 2 },
        { type: 'presets', list: [
          { label: 'Números de 2 cifras con 1,2,3', apply: function (c) { c.els.value = '1 2 3'; c.mm.value = 2; } },
          { label: 'Tres monedas',                  apply: function (c) { c.els.value = 'C X';   c.mm.value = 3; } },
          { label: 'Quiniela de 14',                apply: function (c) { c.els.value = '1 X 2'; c.mm.value = 14; } },
          { label: 'Quiniela de 15',                apply: function (c) { c.els.value = '1 X 2'; c.mm.value = 15; } },
          { label: 'Código de 4 cifras',            apply: function (c) { c.els.value = '0 1 2 3 4 5 6 7 8 9'; c.mm.value = 4; } }
        ] }
      ],
      function (v) {
        var E = elementos(v.els);
        var nn = E.length;
        var mm = entero(v.mm, 0, 20, 'm');
        var val = S.VR(nn, mm);

        var slots = '<div class="ap-slots">';
        for (var i = 0; i < Math.min(mm, 15); i++) {
          if (i) slots += '<span class="ap-mul">×</span>';
          slots += '<span class="ap-slot">' + nn + '<small>pos. ' + (i + 1) + '</small></span>';
        }
        if (mm > 15) slots += '<span class="ap-mul">×</span><span class="ap-slot">…<small>hasta ' + mm + '</small></span>';
        slots += '</div>';

        var lista = '';
        if (mm >= 1 && Math.pow(nn, mm) <= 260) {
          var t = S.tuplas(E, mm, 'VR', 260);
          lista = '<div class="mx-info">Todas las agrupaciones, una a una:</div>' + pintaTuplas(t, '');
        }

        var comparativa = '';
        if (mm <= nn && mm >= 1) {
          var sinR = S.V(nn, mm);
          comparativa = '<div class="mx-info">Para los mismos $n$ y $m$, sin repetición saldrían solo ' +
            K('V_{' + nn + ',' + mm + '} = ' + bigTex(sinR)) + '. Las ' +
            bigTxt(val - sinR) + ' que sobran son precisamente las que tienen algún elemento repetido.</div>';
        } else if (mm > nn) {
          comparativa = '<div class="mx-info">Con $m = ' + mm + ' > n = ' + nn + '$ la repetición no es opcional: ' +
            'por fuerza hay elementos que salen más de una vez. Es el <b>principio del palomar</b>. ' +
            'Ninguna otra fórmula del tema admite esta situación.</div>';
        }

        return slots +
          resultado(bigTxt(val), 'variaciones con repetición') +
          '<div class="mx-info">' + KD('VR_{' + nn + ',' + mm + '} = ' + nn + '^{' + mm + '} = ' + bigTex(val)) + '</div>' +
          comparativa + lista;
      });
  };

  /* ==================================================================
     13) comparaVR — V y VR lado a lado
     ================================================================== */
  R.comparaVR = function (n) {
    shell(n,
      'Con repetición o sin ella',
      'La misma pregunta con y sin repetición, lado a lado. Elige $n$ y $m$ y observa la diferencia. ' +
      'Las agrupaciones tachadas en rojo son las que la versión <b>sin repetición</b> descarta: exactamente las que repiten algún elemento. ' +
      'Prueba con n = 3 y m = 2 para verlo todo en pantalla.',
      [
        { id: 'nn', label: 'n · elementos (se usarán A, B, C…)', type: 'range', min: 2, max: 6, step: 1, value: 3 },
        { id: 'mm', label: 'm · tamaño de la agrupación',        type: 'range', min: 1, max: 4, step: 1, value: 2 }
      ],
      function (v) {
        var nn = entero(v.nn, 2, 6, 'n'), mm = entero(v.mm, 1, 4, 'm');
        var E = [];
        for (var i = 0; i < nn; i++) E.push(String.fromCharCode(65 + i));

        var conRep = S.VR(nn, mm);
        var sinRep = mm <= nn ? S.V(nn, mm) : null;

        var t = S.tuplas(E, mm, 'VR', 400);
        var h = '<div class="ap-tuplas">';
        t.lista.forEach(function (x) {
          var repite = new Set(x).size !== x.length;
          h += '<span class="ap-tup ' + (repite ? 'ap-dup' : 'ap-keep') + '">' + esc(x.join('')) + '</span>';
        });
        h += '</div>';

        var cuentaRep = t.lista.filter(function (x) { return new Set(x).size !== x.length; }).length;

        return '<div class="ap-grid2">' +
            '<div class="ap-card"><div class="ap-card-tit">Con repetición</div>' +
              '<div style="text-align:center">' + K('VR_{' + nn + ',' + mm + '} = ' + nn + '^{' + mm + '}') + '</div>' +
              resultado(bigTxt(conRep), 'agrupaciones') + '</div>' +
            '<div class="ap-card"><div class="ap-card-tit">Sin repetición</div>' +
              '<div style="text-align:center">' + K('V_{' + nn + ',' + mm + '} = \\dfrac{' + nn + '!}{' + (nn - mm) + '!}') + '</div>' +
              (sinRep !== null ? resultado(bigTxt(sinRep), 'agrupaciones')
                               : '<div class="mx-bad ap-err">Imposible: haría falta m ≤ n.</div>') + '</div>' +
          '</div>' +
          leyenda([[ '#e8f5e9', 'en verde: válidas también sin repetición' ],
                   [ '#fdecea', 'tachadas: repiten algún elemento, solo valen con repetición' ]]) +
          h +
          '<div class="mx-info">De las <b>' + bigTxt(conRep) + '</b> agrupaciones con repetición, ' +
          '<b>' + cuentaRep + '</b> tienen algún elemento repetido y <b>' + (t.lista.length - cuentaRep) +
          '</b> no. Esa segunda cantidad coincide exactamente con ' +
          (sinRep !== null ? K('V_{' + nn + ',' + mm + '} = ' + bigTex(sinRep)) : 'las variaciones sin repetición') + '.</div>' +
          '<div class="mx-info"><b>Pregunta para pensar.</b> ¿Cuándo son iguales las dos cantidades? ' +
          'Solo si $m = 1$: con una sola posición no hay nada que repetir. Compruébalo moviendo el deslizador de $m$ a 1.</div>';
      });
  };

  /* ==================================================================
     14) podio — el ejemplo del podio, dibujado
     ================================================================== */
  R.podio = function (n) {
    shell(n,
      'El podio',
      'En una carrera hay $n$ atletas y solo tres suben al podio: oro, plata y bronce. ' +
      'El orden es decisivo (no es lo mismo el oro que el bronce) y nadie ocupa dos puestos. ' +
      'Mueve el deslizador y observa cómo cambia el número de podios posibles. ' +
      'Con 8 atletas hay <b>336</b> podios distintos.',
      [
        { id: 'nn', label: 'n · atletas en carrera', type: 'range', min: 3, max: 30, step: 1, value: 8 },
        { id: 'mm', label: 'm · puestos que se premian', type: 'range', min: 1, max: 5, step: 1, value: 3 }
      ],
      function (v) {
        var nn = entero(v.nn, 3, 30, 'n'), mm = entero(v.mm, 1, 5, 'm');
        if (mm > nn) throw Error('No puede haber más puestos premiados que atletas.');
        var val = S.V(nn, mm);

        var W = 900, H = 400, body = '';
        var META = ['#d4a017', '#9e9e9e', '#a1662f', '#4f6d7a', '#6a3d9a'];
        var NOM  = ['ORO', 'PLATA', 'BRONCE', '4.º', '5.º'];
        var OPC  = [];
        for (var i = 0; i < mm; i++) OPC.push(nn - i);

        body += txt(W / 2, 34, 'Podio de ' + mm + ' puesto' + (mm === 1 ? '' : 's') + ' con ' + nn + ' atletas',
                    { size: 20, weight: '700', fill: '#37474f' });

        /* Cajones del podio, el más alto en el centro */
        var anchoC = Math.min(150, (W - 120) / mm);
        var totalW = anchoC * mm + 18 * (mm - 1);
        var x0 = (W - totalW) / 2;
        var baseY = H - 66;
        for (i = 0; i < mm; i++) {
          /* Cajones altos: aprovechan casi todo el lienzo para que los
             rótulos se lean bien incluso en pantalla pequeña. */
          var alto = 250 - i * 34;
          var x = x0 + i * (anchoC + 18);
          var y = baseY - alto;
          body += rect(x, y, anchoC, alto, META[i], '#5d4037', { sw: 2.2, op: 0.9 });
          body += txt(x + anchoC / 2, y + 34, NOM[i], { size: 19, weight: '800', fill: '#fff' });
          body += txt(x + anchoC / 2, y + 66, OPC[i] + ' opciones', { size: 16, weight: '700', fill: '#fff' });
          body += txt(x + anchoC / 2, y + alto / 2 + 38, '#' + (i + 1), { size: 40, weight: '800', fill: 'rgba(255,255,255,.42)' });
        }
        body += line(x0 - 26, baseY, x0 + totalW + 26, baseY, '#455a64', 3.4);

        /* Cadena de multiplicación bajo el podio */
        var cadena = OPC.join(' · ') + ' = ' + bigTxt(val);
        body += txt(W / 2, H - 24, esc(cadena), { size: 21, weight: '800', fill: COL.azulOsc });

        var fig = svgWrap(body, W, H, 'Podio con ' + nn + ' atletas y ' + mm + ' puestos premiados');

        var muestra = '';
        if (nn <= 5 && mm <= 3) {
          var E = [];
          for (i = 0; i < nn; i++) E.push(String.fromCharCode(65 + i));
          var t = S.tuplas(E, mm, 'V', 200);
          muestra = '<div class="mx-info">Con los atletas ' + esc(E.join(', ')) + ', estos son todos los podios posibles:</div>' +
                    pintaTuplas(t, '-');
        }

        return fig +
          resultado(bigTxt(val), 'podios distintos') +
          '<div class="mx-info">' +
          KD('V_{' + nn + ',' + mm + '} = \\dfrac{' + nn + '!}{(' + nn + '-' + mm + ')!} = ' +
             desarrolloDesc(nn, mm) + ' = ' + bigTex(val)) + '</div>' +
          muestra +
          '<div class="mx-info"><b>El detalle que decide el tipo.</b> Si en lugar de un podio quisiéramos elegir a ' + mm +
          ' atletas para hacerles una foto, el orden dejaría de importar y habría solo ' +
          K('C_{' + nn + ',' + mm + '} = ' + bigTex(S.C(nn, mm))) + ' grupos, que es ' +
          bigTxt(val) + ' dividido entre ' + bigTxt(S.fact(mm)) + ' = ' + mm + '!. ' +
          'Ese factor $m!$ es exactamente la información que aporta el orden.</div>';
      });
  };

  /* ==================================================================
     15) quiniela — el ejemplo canónico de VR con m > n
     ================================================================== */
  R.quiniela = function (n) {
    shell(n,
      'La quiniela',
      'Una quiniela tiene $m$ partidos y en cada uno se marca uno de $n$ signos: 1, X o 2. ' +
      'Todos los partidos se rellenan y el orden está fijado por el boleto, así que cada quiniela es una lista ordenada de $m$ signos con repetición. ' +
      'Prueba con 14 partidos, luego con 15 y con 12, y compara.',
      [
        { id: 'mm', label: 'm · número de partidos', type: 'range', min: 1, max: 15, step: 1, value: 14 },
        { id: 'nn', label: 'n · signos por partido',  type: 'range', min: 2, max: 4, step: 1, value: 3 },
        { id: 'ap', label: 'Apuestas que rellenas',   type: 'number', min: 1, max: 1000000, value: 1 }
      ],
      function (v) {
        var mm = entero(v.mm, 1, 15, 'm'), nn = entero(v.nn, 2, 4, 'n');
        var ap = entero(v.ap, 1, 1000000, 'El número de apuestas');
        var val = S.VR(nn, mm);

        /* Boleto dibujado */
        var W = 900, filas = mm, filaH = 30;
        var H = 78 + filas * filaH + 40;
        var body = '';
        body += rect(0, 0, W, H, '#fff', '#cfd8dc', { r: 0, sw: 0 });
        body += txt(W / 2, 32, 'Boleto de ' + mm + ' partidos · ' + nn + ' signos por partido',
                    { size: 19, weight: '700', fill: '#37474f' });
        var SIG = ['1', 'X', '2', 'M'].slice(0, nn);
        var xIni = 300, celW = 74;
        SIG.forEach(function (s, j) {
          body += txt(xIni + celW * (j + 0.5), 64, s, { size: 18, weight: '800', fill: COL.azulOsc });
        });
        for (var i = 0; i < filas; i++) {
          var y = 78 + i * filaH;
          if (i % 2 === 0) body += rect(70, y, W - 140, filaH, '#f7fafd', 'none', { r: 0 });
          body += txt(96, y + 21, 'Partido ' + (i + 1), { anchor: 'start', size: 15, fill: '#37474f' });
          SIG.forEach(function (s, j) {
            var cx = xIni + celW * (j + 0.5), cy = y + filaH / 2;
            body += rect(cx - 13, cy - 11, 26, 22, '#fff', '#90a4ae', { r: 4, sw: 1.4 });
          });
          body += txt(xIni + celW * nn + 40, y + 21, nn + ' opciones',
                      { anchor: 'start', size: 14, fill: '#78909c' });
        }
        /* Dentro del SVG no hay KaTeX: el exponente se escribe con
           dígitos en superíndice Unicode para que se lea como potencia. */
        var SUP = { '0': '\u2070', '1': '\u00b9', '2': '\u00b2', '3': '\u00b3', '4': '\u2074',
                    '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079' };
        var expo = String(mm).split('').map(function (d) { return SUP[d]; }).join('');
        body += txt(W / 2, H - 14, esc(nn + expo + ' = ' + bigTxt(val) + ' quinielas distintas'),
                    { size: 19, weight: '800', fill: COL.azulOsc });

        var fig = svgWrap(body, W, H, 'Boleto de quiniela con ' + mm + ' partidos');

        var p = ap / Number(val);
        var prob = '<div class="mx-info">Si rellenas <b>' + bigTxt(BigInt(ap)) + '</b> ' +
          (ap === 1 ? 'apuesta distinta' : 'apuestas distintas') +
          ' al azar, la probabilidad de acertar el pleno es ' +
          KD('P = \\dfrac{' + bigTex(BigInt(ap)) + '}{' + bigTex(val) + '} \\approx ' + esc(p.toExponential(3).replace('.', '{,}').replace('e', ' \\cdot 10^{') + '}')) +
          'Es decir, aproximadamente 1 entre ' + bigTxt(BigInt(Math.round(Number(val) / ap))) + '.</div>';

        var comparo = '';
        if (mm >= 2) {
          var menos = S.VR(nn, mm - 1);
          comparo = '<div class="mx-info">Cada partido que se añade <b>multiplica</b> por ' + nn +
            ': con ' + (mm - 1) + ' partidos habría ' + bigTxt(menos) + ' y con ' + mm + ' hay ' + bigTxt(val) + '. ' +
            'Esto es crecimiento exponencial, no lineal.</div>';
        }

        return fig +
          resultado(bigTxt(val), 'quinielas distintas posibles') +
          '<div class="mx-info">' + KD('VR_{' + nn + ',' + mm + '} = ' + nn + '^{' + mm + '} = ' + bigTex(val)) + '</div>' +
          comparo + prob +
          '<div class="mx-info"><b>Pensamiento crítico.</b> Rellenar «todas» las quinielas de 14 partidos costaría ' +
          bigTxt(val) + ' apuestas. A 0,75 € cada una serían más de ' +
          nc(Number(val) * 0.75 / 1e6, 1).replace('.', ',') + ' millones de euros, muy por encima de casi cualquier bote. ' +
          'La combinatoria explica por qué la estrategia de «jugarlo todo» nunca es rentable.</div>';
      });
  };

  /* ==================================================================
     16) complementario — la técnica del «al menos uno»
     ================================================================== */
  R.complementario = function (n) {
    shell(n,
      'La técnica del complementario',
      'Contar los casos con <b>«al menos un…»</b> de frente es un lío: habría que sumar los que tienen uno, dos, tres… ' +
      'El atajo es contar los casos <b>sin ninguno</b> y restarlos del total. ' +
      'Ejemplo: códigos de 4 cifras que contengan al menos un 7. El total es $10^4=10\\,000$; ' +
      'los que no llevan ningún 7 son $9^4=6\\,561$; por tanto los que llevan al menos un 7 son ' +
      '$10\\,000-6\\,561=3\\,439$.',
      [
        { id: 'nn', label: 'n · símbolos del alfabeto', type: 'number', min: 2, max: 40, value: 10 },
        { id: 'mm', label: 'm · longitud del código',   type: 'number', min: 1, max: 15, value: 4 },
        { id: 'pr', label: 'k · símbolos «prohibidos» que deben aparecer al menos una vez', type: 'number', min: 1, max: 20, value: 1 },
        { type: 'presets', list: [
          { label: 'Al menos un 7 en 4 cifras', apply: function (c) { c.nn.value = 10; c.mm.value = 4; c.pr.value = 1; } },
          { label: 'Al menos una vocal en 5',   apply: function (c) { c.nn.value = 26; c.mm.value = 5; c.pr.value = 5; } },
          { label: 'Al menos una cara en 6',    apply: function (c) { c.nn.value = 2;  c.mm.value = 6; c.pr.value = 1; } },
          { label: 'Al menos un 6 en 3 dados',  apply: function (c) { c.nn.value = 6;  c.mm.value = 3; c.pr.value = 1; } }
        ] }
      ],
      function (v) {
        var nn = entero(v.nn, 2, 40, 'n'), mm = entero(v.mm, 1, 15, 'm');
        var kk = entero(v.pr, 1, 20, 'k');
        if (kk >= nn) throw Error('Los símbolos exigidos (k = ' + kk + ') deben ser menos que el total del alfabeto (n = ' + nn + ').');

        var total = S.VR(nn, mm);
        var sin = S.VR(nn - kk, mm);
        var conAlMenosUno = total - sin;

        /* Barra proporcional */
        var W = 900, H = 190, body = '';
        var bx = 60, bw = W - 120, by = 66, bh = 74;
        var fr = Number(sin) / Number(total);
        body += txt(W / 2, 34, 'Reparto del total de ' + bigTxt(total) + ' códigos', { size: 18, weight: '700', fill: '#37474f' });
        body += rect(bx, by, bw, bh, '#e8f5e9', COL.verde, { sw: 2 });
        body += rect(bx, by, bw * fr, bh, '#fdecea', COL.rojo, { sw: 2 });
        body += txt(bx + bw * fr / 2, by + 32, 'sin ninguno', { size: 15, weight: '700', fill: '#8c2018' });
        body += txt(bx + bw * fr / 2, by + 56, bigTxt(sin), { size: 17, weight: '800', fill: '#8c2018' });
        body += txt(bx + bw * fr + (bw * (1 - fr)) / 2, by + 32, 'al menos uno', { size: 15, weight: '700', fill: '#1b5e20' });
        body += txt(bx + bw * fr + (bw * (1 - fr)) / 2, by + 56, bigTxt(conAlMenosUno), { size: 17, weight: '800', fill: '#1b5e20' });
        body += txt(W / 2, H - 14, esc(bigTxt(total) + ' − ' + bigTxt(sin) + ' = ' + bigTxt(conAlMenosUno)),
                    { size: 19, weight: '800', fill: COL.azulOsc });

        return svgWrap(body, W, H, 'Complementario: casos con al menos un símbolo exigido') +
          resultado(bigTxt(conAlMenosUno), kk === 1
            ? 'códigos que contienen al menos una vez el símbolo exigido'
            : 'códigos que contienen al menos uno de los ' + kk + ' símbolos exigidos') +
          '<div class="mx-info">' +
          KD('\\text{total} = ' + nn + '^{' + mm + '} = ' + bigTex(total)) +
          KD('\\text{sin ninguno} = (' + nn + '-' + kk + ')^{' + mm + '} = ' + (nn - kk) + '^{' + mm + '} = ' + bigTex(sin)) +
          KD('\\text{al menos uno} = ' + bigTex(total) + ' - ' + bigTex(sin) + ' = ' + bigTex(conAlMenosUno)) +
          '</div>' +
          '<div class="mx-info"><b>Cuándo usar este atajo.</b> En cuanto leas «al menos uno», «alguno», «como mínimo uno» o «no todos», ' +
          'pregúntate cuál es el caso contrario. Casi siempre el contrario es único y facilísimo de contar: ' +
          '«ninguno», «todos», «exactamente cero».</div>' +
          '<div class="mx-info"><b>Error frecuente.</b> Mucha gente razona así: «elijo una posición para el 7 (' + mm +
          ' formas) y relleno las demás como quiera ($' + nn + '^{' + (mm - 1) + '}$ formas), luego son ' +
          bigTxt(BigInt(mm) * S.VR(nn, mm - 1)) + '». Está <b>mal</b>: los códigos con dos o más sietes se cuentan varias veces. ' +
          'Compara ese número con el correcto (' + bigTxt(conAlMenosUno) + ') y verás la diferencia.</div>';
      });
  };

  /* Módulo A cargado */
  S.extraA = true;
})();
