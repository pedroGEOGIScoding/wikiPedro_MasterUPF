/* =====================================================================
   est3-applets-b.js · Tema 3 Combinatoria · 2.º Bachillerato
   Módulo B — Permutaciones, combinaciones, Pascal, Newton y práctica

   Depende de window.EST3 (est3-applets.js).

   Applets registrados aquí (18):
     permutaciones · circulares · permutacionesRep · anagramas · bloques
     combinaciones · ordenNoOrden · dividirPorM · primitiva · dosCaminos
     combinacionesRep · pascal · propiedades · newton
     esquema · resumenTabla · errores · entrenador

   JavaScript plano, gráficos SVG propios, aritmética BigInt.
   Sin OJS, CDN ni dependencias externas.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.EST3;
  if (!S) return;
  var R = S.registry;
  var K = S.K, KD = S.KD, esc = S.esc, nc = S.nc;
  var bigTxt = S.bigTxt, bigTex = S.bigTex, bigAprox = S.bigAprox;
  var shell = S.shell, resultado = S.resultado, pintaTuplas = S.pintaTuplas;
  var svgWrap = S.svgWrap, txt = S.txt, line = S.line, rect = S.rect,
      circle = S.circle, path = S.path, leyenda = S.leyenda, COL = S.COL;
  var entero = S.entero, elementos = S.elementos, letras = S.letras;

  var MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

  /* ==================================================================
     17) permutaciones — ordenar todos los elementos
     ================================================================== */
  R.permutaciones = function (n) {
    shell(n,
      'Permutaciones',
      'Una permutación es una <b>ordenación de todos</b> los elementos: no se descarta ninguno, solo cambia el orden. ' +
      'Por eso $P_n = V_{n,n} = n!$. Escribe los elementos separados por espacios o comas: ' +
      '<code>A B C</code>, <code>Ana Berta Carlos</code>, <code>1 2 3 4</code>. ' +
      'Con 3 elementos hay 6 ordenaciones y las verás todas; con 10 ya hay 3 628 800.',
      [
        { id: 'els', label: 'Elementos que se ordenan', type: 'text', value: 'A B C' },
        { type: 'presets', list: [
          { label: 'Tres letras',            apply: function (c) { c.els.value = 'A B C'; } },
          { label: 'Cinco personas',         apply: function (c) { c.els.value = 'Ana Berta Carlos Diana Eva'; } },
          { label: 'Seis libros en la balda',apply: function (c) { c.els.value = 'L1 L2 L3 L4 L5 L6'; } },
          { label: 'Siete macetas',          apply: function (c) { c.els.value = 'M1 M2 M3 M4 M5 M6 M7'; } },
          { label: 'Once del equipo',        apply: function (c) { c.els.value = '1 2 3 4 5 6 7 8 9 10 11'; } }
        ] }
      ],
      function (v) {
        var E = elementos(v.els);
        var nn = E.length;
        var val = S.fact(nn);

        var slots = '<div class="ap-slots">';
        for (var i = 0; i < Math.min(nn, 12); i++) {
          if (i) slots += '<span class="ap-mul">×</span>';
          slots += '<span class="ap-slot">' + (nn - i) + '<small>lugar ' + (i + 1) + '</small></span>';
        }
        if (nn > 12) slots += '<span class="ap-mul">×</span><span class="ap-slot">…<small>hasta 1</small></span>';
        slots += '</div>';

        var lista = '';
        if (nn <= 6) {
          var t = S.tuplas(E, nn, 'P', 800);
          lista = '<div class="mx-info">Todas las permutaciones, escritas una a una:</div>' +
                  pintaTuplas(t, nn <= 4 && E.every(function (x) { return x.length === 1; }) ? '' : '-');
        }

        return slots +
          resultado(bigTxt(val), 'ordenaciones distintas de los ' + nn + ' elementos') +
          '<div class="mx-info">' + KD('P_{' + nn + '} = V_{' + nn + ',' + nn + '} = ' + nn + '! = ' + bigTex(val)) + '</div>' +
          lista +
          '<div class="mx-info"><b>Por qué $P_n = V_{n,n}$.</b> Aplicando la fórmula de las variaciones con $m=n$: ' +
          KD('V_{n,n} = \\dfrac{n!}{(n-n)!} = \\dfrac{n!}{0!} = \\dfrac{n!}{1} = n!') +
          'Aquí se ve para qué sirve el convenio $0!=1$: sin él, la fórmula general se rompería justo en este caso.</div>' +
          '<div class="mx-info"><b>Sentido del crecimiento.</b> Añadir un elemento más no suma, <b>multiplica</b> por ' +
          (nn + 1) + ': con ' + (nn + 1) + ' elementos habría ' + bigTxt(S.fact(nn + 1)) + ' ordenaciones. ' +
          'Por eso ordenar es una tarea que se vuelve inabarcable enseguida.</div>';
      });
  };

  /* ==================================================================
     18) circulares — la mesa redonda
     ================================================================== */
  R.circulares = function (n) {
    shell(n,
      'Permutaciones circulares',
      'Alrededor de una mesa redonda <b>no hay primera silla</b>: si todo el mundo se levanta y se sienta una silla a la derecha, ' +
      'la distribución es la misma. Cada ordenación en línea tiene $n$ copias giradas que valen igual, así que ' +
      '$PC_n = \\dfrac{n!}{n} = (n-1)! = P_{n-1}$. ' +
      'Mueve el deslizador de giro y comprueba con tus ojos que la disposición no cambia.',
      [
        { id: 'nn',  label: 'n · personas en la mesa', type: 'range', min: 3, max: 10, step: 1, value: 5 },
        { id: 'gir', label: 'Girar la mesa (posiciones)', type: 'range', min: 0, max: 9, step: 1, value: 0 }
      ],
      function (v) {
        var nn = entero(v.nn, 3, 10, 'n');
        var g = entero(v.gir, 0, 9, 'El giro') % nn;
        var val = S.PC(nn);
        var lineal = S.fact(nn);

        var NOMS = ['Ana', 'Bruno', 'Clara', 'David', 'Elena', 'Félix', 'Gemma', 'Hugo', 'Iris', 'Jan'];
        var pers = NOMS.slice(0, nn);

        /* cy separado del título lo suficiente para que la etiqueta
           «silla 1», que va por encima del primer asiento, no lo toque. */
        var W = 900, H = 486, cx = 330, cy = 264, Rr = 152, body = '';

        body += txt(W / 2, 34, 'Mesa redonda de ' + nn + ' personas · giro de ' + g + ' posicion' + (g === 1 ? '' : 'es'),
                    { size: 19, weight: '700', fill: '#37474f' });

        /* mesa */
        body += circle(cx, cy, Rr - 46, '#f5efe2', '#c9b892', 3);
        body += txt(cx, cy + 6, 'mesa', { size: 16, fill: '#a1875a', weight: '700' });

        for (var i = 0; i < nn; i++) {
          var ang = -Math.PI / 2 + (2 * Math.PI * i) / nn;
          var px = cx + Rr * Math.cos(ang), py = cy + Rr * Math.sin(ang);
          var quien = pers[(i - g + nn * 2) % nn];
          var col = (i === 0) ? COL.naranja : COL.azul;
          body += circle(px, py, 30, '#fff', col, 3);
          body += txt(px, py + 6, esc(quien.slice(0, 5)), { size: 14.5, weight: '700', fill: col });
          /* silla numerada */
          /* La etiqueta se ancla hacia fuera del círculo: a la derecha del
             asiento si está en la mitad derecha, y a la izquierda si está en
             la mitad izquierda. Así nunca se monta sobre el asiento. */
          var cxx = Math.cos(ang), cyy = Math.sin(ang);
          var anc = Math.abs(cxx) < 0.25 ? 'middle' : (cxx > 0 ? 'start' : 'end');
          var lx = cx + (Rr + 38) * cxx, ly = cy + (Rr + 38) * cyy;
          body += txt(lx, ly + 5, 'silla ' + (i + 1), { size: 12.5, fill: '#78909c', anchor: anc });
        }
        /* flecha de giro */
        if (g > 0) {
          body += path('M ' + (cx + 96) + ' ' + (cy - 96) + ' A 136 136 0 0 1 ' + (cx + 128) + ' ' + (cy - 40),
                       COL.naranja, 3.4);
          body += path('M ' + (cx + 118) + ' ' + (cy - 50) + ' L ' + (cx + 128) + ' ' + (cy - 40) +
                       ' L ' + (cx + 116) + ' ' + (cy - 34), COL.naranja, 3.4);
        }

        /* panel derecho */
        var px0 = 620;
        body += rect(px0 - 30, 100, 300, 340, '#f7fafd', '#dbe6f2', { sw: 2 });
        body += txt(px0 + 120, 134, 'La misma disposición', { size: 17, weight: '700', fill: COL.azulOsc });
        var orden = [];
        for (var j = 0; j < nn; j++) orden.push(pers[(j - g + nn * 2) % nn]);
        body += txt(px0 + 120, 166, 'leída desde la silla 1:', { size: 14, fill: '#546e7a' });
        var texto = orden.join(' → ');
        var trozos = [];
        var acum = '';
        orden.forEach(function (o, k) {
          if ((acum + o).length > 22) { trozos.push(acum); acum = ''; }
          acum += (acum ? ' → ' : '') + o;
        });
        if (acum) trozos.push(acum);
        trozos.forEach(function (tr, k) {
          body += txt(px0 + 120, 198 + k * 26, esc(tr), { size: 14.5, weight: '700', fill: '#263238', family: MONO });
        });
        body += txt(px0 + 120, 326, 'Vecinos de cada persona:', { size: 14, fill: '#546e7a' });
        body += txt(px0 + 120, 352, 'no cambian al girar', { size: 15, weight: '800', fill: COL.verde });
        body += txt(px0 + 120, 394, 'por eso las ' + nn + ' rotaciones', { size: 13.5, fill: '#546e7a' });
        body += txt(px0 + 120, 414, 'cuentan como UNA sola', { size: 13.5, weight: '700', fill: COL.rojo });

        var fig = svgWrap(body, W, H, 'Mesa redonda de ' + nn + ' personas');

        return fig +
          resultado(bigTxt(val), 'disposiciones circulares realmente distintas') +
          '<div class="mx-info">' +
          KD('PC_{' + nn + '} = \\dfrac{P_{' + nn + '}}{' + nn + '} = \\dfrac{' + nn + '!}{' + nn + '} = (' + nn + '-1)! = ' +
             (nn - 1) + '! = ' + bigTex(val)) + '</div>' +
          '<div class="ap-grid2">' +
            '<div class="ap-card"><div class="ap-card-tit">Si fuera un banco recto</div>' +
              resultado(bigTxt(lineal), 'ordenaciones') +
              '<div class="mx-info" style="font-size:.82rem">Hay una primera plaza, así que cada orden es distinto.</div></div>' +
            '<div class="ap-card"><div class="ap-card-tit">En mesa redonda</div>' +
              resultado(bigTxt(val), 'disposiciones') +
              '<div class="mx-info" style="font-size:.82rem">Cada disposición se ha contado ' + nn + ' veces (una por giro).</div></div>' +
          '</div>' +
          '<div class="mx-info"><b>Cómo razonarlo sin memorizar.</b> Fija a una persona, por ejemplo Ana, en cualquier silla: ' +
          'como no hay silla privilegiada, eso no pierde generalidad. Las ' + (nn - 1) + ' restantes se colocan libremente en las ' +
          (nn - 1) + ' sillas que quedan: ' + K((nn - 1) + '! = ' + bigTex(val)) + '. El mismo resultado, sin dividir nada.</div>' +
          '<div class="mx-info"><b>Pregunta para pensar.</b> ¿Y si la mesa fuera redonda pero las sillas estuvieran numeradas? ' +
          'Entonces sí habría posición de referencia y volveríamos a ' + K(nn + '! = ' + bigTex(lineal)) + '. ' +
          'Lo que decide la fórmula no es la forma de la mesa, sino si existe o no un punto de referencia.</div>';
      });
  };

  /* ==================================================================
     19) permutacionesRep — cuando hay elementos idénticos
     ================================================================== */
  R.permutacionesRep = function (n) {
    shell(n,
      'Permutaciones con repetición',
      'Si algunos elementos son <b>indistinguibles</b>, intercambiarlos no crea una ordenación nueva. ' +
      'Se cuenta como si todos fueran distintos ($n!$) y luego se <b>divide</b> por el factorial de cada grupo de repetidos. ' +
      'Escribe una palabra sin espacios: <code>CASA</code>, <code>MATEMATICAS</code>, <code>PATATA</code>. ' +
      'El applet detecta solo cuántas veces se repite cada letra.',
      [
        { id: 'pal', label: 'Palabra', type: 'text', value: 'CASA' },
        { type: 'presets', list: [
          { label: 'CASA',        apply: function (c) { c.pal.value = 'CASA'; } },
          { label: 'MATEMATICAS', apply: function (c) { c.pal.value = 'MATEMATICAS'; } },
          { label: 'PATATA',      apply: function (c) { c.pal.value = 'PATATA'; } },
          { label: 'ELIPSE',      apply: function (c) { c.pal.value = 'ELIPSE'; } },
          { label: 'CARLES',      apply: function (c) { c.pal.value = 'CARLES'; } }
        ] }
      ],
      function (v) {
        var L = letras(v.pal);
        var nn = L.length;
        var mult = S.multiplicidades(L);
        var claves = Object.keys(mult).sort();
        var reps = claves.map(function (k) { return mult[k]; });
        var val = S.PR(reps);
        var sinAjuste = S.fact(nn);

        /* tabla de multiplicidades */
        var h = '<table class="ap-tbl ap-cmb"><thead><tr><th>Letra</th>';
        claves.forEach(function (k) { h += '<th>' + esc(k) + '</th>'; });
        h += '<th>Total</th></tr></thead><tbody><tr><th>Veces que aparece</th>';
        claves.forEach(function (k) {
          h += '<td class="ap-num"' + (mult[k] > 1 ? ' style="background:#fff7e6;color:#7a4b00;font-weight:700"' : '') +
               '>' + mult[k] + '</td>';
        });
        h += '<td class="ap-num"><b>' + nn + '</b></td></tr></tbody></table>';

        var repetidas = claves.filter(function (k) { return mult[k] > 1; });
        var divisor = repetidas.length
          ? repetidas.map(function (k) { return mult[k] + '!'; }).join(' \\cdot ')
          : '1';
        var divisorVal = 1n;
        repetidas.forEach(function (k) { divisorVal *= S.fact(mult[k]); });

        var formulaSup = repetidas.length
          ? 'P_{' + nn + '}^{' + repetidas.map(function (k) { return mult[k]; }).join(',') + '}'
          : 'P_{' + nn + '}';

        var lista = '';
        if (Number(val) <= 300) {
          var a = S.anagramas(L, 300);
          lista = '<div class="mx-info">Las ' + bigTxt(val) + ' ordenaciones distintas, escritas una a una:</div>' +
                  '<div class="ap-tuplas">' +
                  a.lista.map(function (s) { return '<span class="ap-tup">' + esc(s) + '</span>'; }).join('') +
                  '</div>';
        }

        var razon = repetidas.length
          ? '<div class="mx-info"><b>Por qué se divide.</b> Imagina que las letras repetidas llevan una etiqueta secreta: ' +
            repetidas.map(function (k) {
              var subs = [];
              for (var i = 1; i <= mult[k]; i++) subs.push(k + '<sub>' + i + '</sub>');
              return subs.join(', ');
            }).join(' y ') +
            '. Con esas etiquetas habría ' + bigTxt(sinAjuste) + ' ordenaciones. ' +
            'Pero al quitarlas, cada ordenación real aparece repetida ' + bigTxt(divisorVal) +
            ' veces, una por cada forma de barajar las etiquetas entre sí. Por eso hay que dividir.</div>'
          : '<div class="mx-info">En esta palabra <b>no se repite ninguna letra</b>, así que no hay nada que dividir: ' +
            'es una permutación ordinaria, ' + K('P_{' + nn + '} = ' + nn + '! = ' + bigTex(val)) + '.</div>';

        return h +
          resultado(bigTxt(val), 'palabras distintas (con o sin sentido) que se pueden formar') +
          '<div class="mx-info">' +
          KD(formulaSup + ' = \\dfrac{' + nn + '!}{' + divisor + '} = \\dfrac{' + bigTex(sinAjuste) + '}{' +
             bigTex(divisorVal) + '} = ' + bigTex(val)) + '</div>' +
          razon + lista +
          '<div class="mx-info"><b>Comprobación de coherencia.</b> El resultado tiene que ser un número entero: ' +
          'si al dividir te sale un decimal, has contado mal alguna multiplicidad. ' +
          'Además, siempre se cumple ' + K('P_n^{a,b,\\dots} \\le n!') + ', con igualdad solo si no se repite nada.</div>';
      });
  };

  /* ==================================================================
     20) anagramas — el generador, con condiciones
     ================================================================== */
  R.anagramas = function (n) {
    shell(n,
      'Anagramas con condiciones',
      'Cuenta las ordenaciones de una palabra que cumplen una condición extra. ' +
      'Escribe la palabra y elige la condición en el desplegable. ' +
      'Este applet enseña la técnica más útil del tema: <b>colocar primero lo que está obligado</b> y contar después el resto libremente.',
      [
        { id: 'pal', label: 'Palabra', type: 'text', value: 'ROMA' },
        { id: 'cond', label: 'Condición', type: 'select', value: 'libre', options: [
          { value: 'libre',   label: 'Sin condición: todas las ordenaciones' },
          { value: 'empieza', label: 'Debe empezar por la primera letra escrita' },
          { value: 'vocalIni',label: 'Debe empezar por vocal' },
          { value: 'vocalFin',label: 'Debe acabar en vocal' },
          { value: 'juntas',  label: 'Las dos primeras letras van siempre juntas y en ese orden' }
        ] },
        { type: 'presets', list: [
          { label: 'ROMA',   apply: function (c) { c.pal.value = 'ROMA'; } },
          { label: 'CARLES', apply: function (c) { c.pal.value = 'CARLES'; } },
          { label: 'MIQUEL', apply: function (c) { c.pal.value = 'MIQUEL'; } },
          { label: 'CASA',   apply: function (c) { c.pal.value = 'CASA'; } },
          { label: 'DELIT',  apply: function (c) { c.pal.value = 'DELIT'; } }
        ] }
      ],
      function (v) {
        var L = letras(v.pal);
        if (L.length > 9) throw Error('Usa como mucho 9 letras para que el applet pueda enumerar y comprobar.');
        var nn = L.length;
        var VOC = 'AEIOUÁÉÍÓÚ';
        var cond = v.cond;

        var todas = S.anagramas(L, 400000);
        var total = todas.lista.length;

        function cumple(s) {
          if (cond === 'libre')    return true;
          if (cond === 'empieza')  return s.charAt(0) === L[0];
          if (cond === 'vocalIni') return VOC.indexOf(s.charAt(0)) >= 0;
          if (cond === 'vocalFin') return VOC.indexOf(s.charAt(s.length - 1)) >= 0;
          if (cond === 'juntas')   return s.indexOf(L[0] + L[1]) >= 0;
          return true;
        }
        var buenas = todas.lista.filter(cumple);

        /* Razonamiento teórico según la condición */
        var teoria = '';
        var mult = S.multiplicidades(L);
        var repsArr = Object.keys(mult).map(function (k) { return mult[k]; });
        var totTeo = S.PR(repsArr);

        if (cond === 'libre') {
          teoria = KD('P_{' + nn + '}' + (repsArr.some(function (x) { return x > 1; }) ? '^{\\text{rep}}' : '') +
                      ' = ' + bigTex(totTeo));
        } else if (cond === 'empieza') {
          var resto = L.slice();
          resto.splice(resto.indexOf(L[0]), 1);
          var mr = S.multiplicidades(resto);
          var vr = S.PR(Object.keys(mr).map(function (k) { return mr[k]; }));
          teoria = '<b>Razonamiento.</b> La primera posición ya está decidida: la ocupa la ' + esc(L[0]) +
                   '. Las ' + (nn - 1) + ' letras restantes se ordenan libremente.' +
                   KD('1 \\cdot P_{' + (nn - 1) + '} = ' + bigTex(vr));
        } else if (cond === 'juntas') {
          var bloque = L.slice(2);
          bloque.push('[' + L[0] + L[1] + ']');
          var mb = S.multiplicidades(bloque);
          var vb = S.PR(Object.keys(mb).map(function (k) { return mb[k]; }));
          teoria = '<b>Razonamiento del bloque.</b> Pega las dos letras y trátalas como <b>una sola pieza</b>: ' +
                   '<code>[' + esc(L[0] + L[1]) + ']</code>. Ahora hay ' + (nn - 1) + ' piezas que ordenar.' +
                   KD('P_{' + (nn - 1) + '} = ' + (nn - 1) + '! = ' + bigTex(vb)) +
                   'Como el orden dentro del bloque está fijado, no se multiplica por nada más. ' +
                   'Si el enunciado dijera «juntas en cualquier orden», habría que multiplicar por $2!=2$.';
        } else {
          var cuantas = L.filter(function (c) { return VOC.indexOf(c) >= 0; }).length;
          teoria = '<b>Razonamiento.</b> Se elige primero la letra de la posición obligada (hay ' + cuantas +
                   ' vocal' + (cuantas === 1 ? '' : 'es') + ' en la palabra, pero cuidado con las repetidas) ' +
                   'y después se ordenan libremente las ' + (nn - 1) + ' restantes. ' +
                   'El applet ha comprobado el resultado enumerando las ' + total + ' ordenaciones una a una.';
        }

        var muestra = '';
        if (buenas.length <= 300) {
          muestra = '<div class="ap-tuplas">' +
            buenas.map(function (s) { return '<span class="ap-tup ap-keep">' + esc(s) + '</span>'; }).join('') +
            '</div>';
        }

        return resultado(bigTxt(BigInt(buenas.length)), 'ordenaciones que cumplen la condición') +
          '<div class="ap-kvs">' +
            '<span class="ap-kv">Ordenaciones totales: <b>' + bigTxt(BigInt(total)) + '</b></span>' +
            '<span class="ap-kv">Que cumplen: <b>' + buenas.length + '</b></span>' +
            '<span class="ap-kv">Proporción: <b>' + nc(buenas.length / total * 100, 2) + ' %</b></span>' +
          '</div>' +
          '<div class="mx-info">' + teoria + '</div>' + muestra +
          '<div class="mx-info"><b>Estrategia general.</b> Cuando hay una restricción, el orden de trabajo es siempre el mismo: ' +
          '<b>1)</b> coloca lo que está obligado; <b>2)</b> cuenta de cuántas formas puedes hacerlo; ' +
          '<b>3)</b> cuenta libremente lo que queda; <b>4)</b> multiplica. ' +
          'Nunca al revés.</div>';
      });
  };

  /* ==================================================================
     21) bloques — elementos que van juntos o separados
     ================================================================== */
  R.bloques = function (n) {
    shell(n,
      'Elementos juntos o separados',
      'Un tipo de problema que cae siempre: colocar $n$ personas <b>con una condición de vecindad</b>. ' +
      'Elige cuántas personas hay y cuántas de ellas están obligadas a ir juntas. ' +
      'El applet compara los tres casos: sin condición, obligadas a ir juntas, y prohibido que vayan juntas.',
      [
        { id: 'nn', label: 'n · personas en total', type: 'range', min: 3, max: 10, step: 1, value: 5 },
        { id: 'kk', label: 'k · personas que forman el bloque', type: 'range', min: 2, max: 4, step: 1, value: 2 }
      ],
      function (v) {
        var nn = entero(v.nn, 3, 10, 'n'), kk = entero(v.kk, 2, 4, 'k');
        if (kk > nn) throw Error('El bloque no puede tener más personas que el total.');

        var libre = S.fact(nn);
        var piezas = nn - kk + 1;
        var juntas = S.fact(piezas) * S.fact(kk);
        var separadas = libre - juntas;

        /* Ilustración del bloque */
        var W = 920, H = 250, body = '';
        body += txt(W / 2, 32, 'De ' + nn + ' personas, ' + kk + ' deben ir siempre juntas',
                    { size: 19, weight: '700', fill: '#37474f' });

        var y1 = 66, y2 = 158, bw = 62, gap = 12;
        /* fila 1: personas sueltas */
        var tot1 = nn * bw + (nn - 1) * gap, x1 = (W - tot1) / 2;
        body += txt(x1 - 10, y1 + 34, 'sin condición:', { anchor: 'end', size: 14.5, weight: '700', fill: '#546e7a' });
        for (var i = 0; i < nn; i++) {
          var col = i < kk ? COL.naranja : COL.azul;
          body += rect(x1 + i * (bw + gap), y1, bw, 56, i < kk ? '#fff7e6' : '#f2f7fd', col, { sw: 2.2 });
          body += txt(x1 + i * (bw + gap) + bw / 2, y1 + 36, String.fromCharCode(65 + i),
                      { size: 22, weight: '800', fill: i < kk ? '#7a4b00' : COL.azulOsc });
        }
        body += txt(W / 2, y1 + 80, nn + '! = ' + bigTxt(libre) + ' ordenaciones',
                    { size: 16, weight: '700', fill: COL.azulOsc });

        /* fila 2: bloque pegado */
        var wBloque = kk * bw + (kk - 1) * 4;
        var tot2 = wBloque + (nn - kk) * (bw + gap);
        var x2 = (W - tot2) / 2;
        body += txt(x2 - 10, y2 + 34, 'con bloque:', { anchor: 'end', size: 14.5, weight: '700', fill: '#546e7a' });
        body += rect(x2 - 5, y2 - 6, wBloque + 10, 68, '#fff3e0', COL.naranja, { sw: 3 });
        for (i = 0; i < kk; i++) {
          body += rect(x2 + i * (bw + 4), y2, bw, 56, '#fff', COL.naranja, { sw: 1.8 });
          body += txt(x2 + i * (bw + 4) + bw / 2, y2 + 36, String.fromCharCode(65 + i),
                      { size: 22, weight: '800', fill: '#7a4b00' });
        }
        for (i = kk; i < nn; i++) {
          var xx = x2 + wBloque + 10 + (i - kk) * (bw + gap);
          body += rect(xx, y2, bw, 56, '#f2f7fd', COL.azul, { sw: 2.2 });
          body += txt(xx + bw / 2, y2 + 36, String.fromCharCode(65 + i), { size: 22, weight: '800', fill: COL.azulOsc });
        }
        body += txt(W / 2, y2 + 84, piezas + '! · ' + kk + '! = ' + bigTxt(S.fact(piezas)) + ' · ' +
                    bigTxt(S.fact(kk)) + ' = ' + bigTxt(juntas) + ' ordenaciones',
                    { size: 16, weight: '700', fill: '#7a4b00' });

        var fig = svgWrap(body, W, H, 'Bloque de ' + kk + ' personas dentro de ' + nn);

        return fig +
          '<div class="ap-grid3">' +
            '<div class="ap-card"><div class="ap-card-tit">Sin condición</div>' +
              '<div style="text-align:center">' + K('P_{' + nn + '} = ' + nn + '!') + '</div>' +
              resultado(bigTxt(libre), '') + '</div>' +
            '<div class="ap-card"><div class="ap-card-tit">Las ' + kk + ' juntas</div>' +
              '<div style="text-align:center">' + K('P_{' + piezas + '} \\cdot P_{' + kk + '}') + '</div>' +
              resultado(bigTxt(juntas), '') + '</div>' +
            '<div class="ap-card"><div class="ap-card-tit">Nunca las ' + kk + ' juntas</div>' +
              '<div style="text-align:center">' + K(nn + '! - ' + piezas + '!\\cdot ' + kk + '!') + '</div>' +
              resultado(bigTxt(separadas), '') + '</div>' +
          '</div>' +
          '<div class="mx-info"><b>La técnica del bloque, en dos pasos.</b><br>' +
          '<b>1)</b> Pega las ' + kk + ' personas obligadas y trátalas como <b>una sola pieza</b>. ' +
          'Ahora hay ' + piezas + ' piezas, que se ordenan de ' + K(piezas + '! = ' + bigTex(S.fact(piezas))) + ' formas.<br>' +
          '<b>2)</b> Dentro del bloque, esas ' + kk + ' personas también pueden reordenarse entre sí: ' +
          K(kk + '! = ' + bigTex(S.fact(kk))) + ' formas.<br>' +
          'Multiplicando: ' + K(bigTex(S.fact(piezas)) + ' \\cdot ' + bigTex(S.fact(kk)) + ' = ' + bigTex(juntas)) + '.</div>' +
          '<div class="mx-info"><b>Y el caso contrario, con el complementario.</b> «Que nunca vayan juntas» es lo opuesto de «que vayan juntas», ' +
          'así que basta restar: ' + K(bigTex(libre) + ' - ' + bigTex(juntas) + ' = ' + bigTex(separadas)) + '. ' +
          'Contar directamente las separadas sería mucho más laborioso.</div>';
      });
  };

  /* ==================================================================
     22) combinaciones — C(n,m) con enumeración
     ================================================================== */
  R.combinaciones = function (n) {
    shell(n,
      'Combinaciones',
      'Elige $m$ elementos de un conjunto de $n$ <b>sin importar el orden</b> y <b>sin repetir</b>. ' +
      'Un grupo, un equipo, un comité o un ramo son combinaciones: da igual en qué orden los nombres. ' +
      'Escribe los elementos separados por espacios o comas: <code>M I Q U E L</code>, <code>1 2 3 4 5 6 7</code>.',
      [
        { id: 'els', label: 'Elementos disponibles', type: 'text', value: 'M I Q U E L' },
        { id: 'mm',  label: 'm · cuántos se eligen', type: 'number', min: 0, max: 10, value: 4 },
        { type: 'presets', list: [
          { label: 'MIQUEL, de 4 en 4',       apply: function (c) { c.els.value = 'M I Q U E L'; c.mm.value = 4; } },
          { label: 'Siete amigos, elegir 3',  apply: function (c) { c.els.value = 'Ana Bru Cla Dan Eva Fer Gal'; c.mm.value = 3; } },
          { label: 'Seis plantas, ramos de 3',apply: function (c) { c.els.value = 'P1 P2 P3 P4 P5 P6'; c.mm.value = 3; } },
          { label: 'Comité de 2 entre 6',     apply: function (c) { c.els.value = 'A B C D E F'; c.mm.value = 2; } },
          { label: 'DELIT, de 4 en 4',        apply: function (c) { c.els.value = 'D E L I T'; c.mm.value = 4; } }
        ] }
      ],
      function (v) {
        var E = elementos(v.els);
        var nn = E.length;
        var mm = entero(v.mm, 0, 10, 'm');
        if (mm > nn) throw Error('No puedes elegir ' + mm + ' elementos distintos de un conjunto de ' + nn + '.');

        var val = S.C(nn, mm);
        var varia = S.V(nn, mm);
        var t = S.tuplas(E, mm, 'C', 300);

        return resultado(bigTxt(val), 'combinaciones de ' + nn + ' elementos tomados de ' + mm + ' en ' + mm) +
          '<div class="mx-info">' +
          KD('C_{' + nn + ',' + mm + '} = \\dbinom{' + nn + '}{' + mm + '} = \\dfrac{' + nn + '!}{' + mm + '!\\,(' + nn + '-' + mm + ')!}' +
             ' = \\dfrac{' + nn + '!}{' + mm + '!\\;' + (nn - mm) + '!} = ' + bigTex(val)) + '</div>' +
          '<div class="mx-info">Y por el camino corto, dividiendo las variaciones entre las permutaciones del grupo:' +
          KD('C_{' + nn + ',' + mm + '} = \\dfrac{V_{' + nn + ',' + mm + '}}{P_{' + mm + '}} = \\dfrac{' + bigTex(varia) +
             '}{' + bigTex(S.fact(mm)) + '} = ' + bigTex(val)) + '</div>' +
          (mm >= 1 && t.lista.length ? '<div class="mx-info">Todos los grupos posibles:</div>' + pintaTuplas(t, '') : '') +
          '<div class="mx-info"><b>Compruébalo tú.</b> En la lista de arriba ' +
          (nn >= 2 && mm >= 2 ? 'aparece <code>' + esc(E.slice(0, mm).join('')) + '</code> una sola vez. ' +
           'Su versión en otro orden no está, porque sería el mismo grupo. ' : '') +
          'Por eso hay ' + bigTxt(val) + ' combinaciones frente a ' + bigTxt(varia) + ' variaciones: ' +
          'exactamente ' + bigTxt(S.fact(mm)) + ' veces menos, que es $' + mm + '!$.</div>' +
          '<div class="mx-info"><b>Notación.</b> Los símbolos ' + K('C_{n,m}') + ', ' + K('\\dbinom{n}{m}') + ' y ' +
          K('C_n^m') + ' significan lo mismo. El del centro se lee «<b>' + nn + ' sobre ' + mm +
          '</b>» y se llama <b>número combinatorio</b>. Nunca es una fracción: no lleva raya.</div>';
      });
  };

  /* ==================================================================
     23) ordenNoOrden — VR, V y C en el mismo ejemplo
     ================================================================== */
  R.ordenNoOrden = function (n) {
    shell(n,
      'Con orden, sin orden, con repetición',
      'El mismo enunciado da tres respuestas distintas según dos decisiones: si importa el orden y si se puede repetir. ' +
      'Con 3 elementos tomados de 2 en 2 salen <b>9</b>, <b>6</b> y <b>3</b>. ' +
      'Mueve los deslizadores y observa las tres listas en paralelo: son la misma pregunta con tres reglas de juego.',
      [
        { id: 'nn', label: 'n · elementos (se usan A, B, C…)', type: 'range', min: 2, max: 6, step: 1, value: 3 },
        { id: 'mm', label: 'm · tamaño del grupo',              type: 'range', min: 1, max: 4, step: 1, value: 2 }
      ],
      function (v) {
        var nn = entero(v.nn, 2, 6, 'n'), mm = entero(v.mm, 1, 4, 'm');
        var E = [];
        for (var i = 0; i < nn; i++) E.push(String.fromCharCode(65 + i));

        var vr = S.VR(nn, mm);
        var vv = mm <= nn ? S.V(nn, mm) : null;
        var cc = mm <= nn ? S.C(nn, mm) : null;

        function panel(tit, sub, val, modo, col) {
          var lista = '';
          if (val !== null) {
            var t = S.tuplas(E, mm, modo, 200);
            lista = '<div class="ap-tuplas">' +
              t.lista.map(function (x) { return '<span class="ap-tup">' + esc(x.join('')) + '</span>'; }).join('') +
              '</div>';
          }
          return '<div class="ap-card"><div class="ap-card-tit" style="color:' + col + '">' + tit + '</div>' +
            '<div style="text-align:center;font-size:.84rem;color:#546e7a">' + sub + '</div>' +
            (val !== null
              ? '<div class="ap-res" style="justify-content:center"><span class="ap-res-num">' + bigTxt(val) + '</span></div>' + lista
              : '<div class="mx-bad ap-err">Necesita m ≤ n.</div>') +
            '</div>';
        }

        return '<div class="ap-grid3">' +
            panel('Con orden, con repetición', 'variaciones con repetición ' + nn + '<sup>' + mm + '</sup>', vr, 'VR', COL.morado) +
            panel('Con orden, sin repetición', 'variaciones ' + nn + '·' + (nn - 1) + '…', vv, 'V', COL.azulOsc) +
            panel('Sin orden, sin repetición', 'combinaciones', cc, 'C', COL.verde) +
          '</div>' +
          (vv !== null
            ? '<div class="mx-info"><b>Las tres cantidades están encadenadas.</b>' +
              KD('VR_{' + nn + ',' + mm + '} = ' + bigTex(vr) + ' \\;\\ge\\; V_{' + nn + ',' + mm + '} = ' + bigTex(vv) +
                 ' \\;\\ge\\; C_{' + nn + ',' + mm + '} = ' + bigTex(cc)) +
              'Al prohibir la repetición se pierden agrupaciones; al dejar de mirar el orden se pierden más, ' +
              'exactamente un factor ' + K(mm + '! = ' + bigTex(S.fact(mm))) + '.</div>'
            : '') +
          '<div class="mx-info"><b>La pregunta que lo decide todo.</b> Coge dos agrupaciones cualesquiera de la lista, ' +
          'por ejemplo <code>' + esc(E[0] + E[1]) + '</code> y <code>' + esc(E[1] + E[0]) + '</code>, y pregúntate: ' +
          '<i>en mi problema, ¿son la misma cosa o son dos cosas distintas?</i> ' +
          'Si son la misma, son combinaciones. Si son distintas, son variaciones. No hay más.</div>';
      });
  };

  /* ==================================================================
     24) dividirPorM — la clave: agrupar las variaciones en clases
     ================================================================== */
  R.dividirPorM = function (n) {
    shell(n,
      'Por qué se divide entre m factorial',
      'Esta es la idea que convierte las variaciones en combinaciones y merece verse despacio. ' +
      'El applet lista <b>todas</b> las variaciones y las agrupa por cajas: dentro de cada caja están las que tienen ' +
      '<b>los mismos elementos</b> y solo se diferencian en el orden. ' +
      'Cuenta las cajas: son las combinaciones. Cuenta lo que hay en cada caja: siempre $m!$.',
      [
        { id: 'nn', label: 'n · elementos', type: 'range', min: 2, max: 6, step: 1, value: 4 },
        { id: 'mm', label: 'm · tamaño del grupo', type: 'range', min: 2, max: 4, step: 1, value: 2 }
      ],
      function (v) {
        var nn = entero(v.nn, 2, 6, 'n'), mm = entero(v.mm, 2, 4, 'm');
        if (mm > nn) throw Error('Hace falta m ≤ n.');
        var E = [];
        for (var i = 0; i < nn; i++) E.push(String.fromCharCode(65 + i));

        var varia = S.V(nn, mm), comb = S.C(nn, mm), pm = S.fact(mm);
        var tV = S.tuplas(E, mm, 'V', 3000);

        /* agrupar por conjunto ordenado alfabéticamente */
        var cajas = {};
        tV.lista.forEach(function (x) {
          var clave = x.slice().sort().join('');
          (cajas[clave] = cajas[clave] || []).push(x.join(''));
        });
        var claves = Object.keys(cajas).sort();

        var h = '<div class="ap-clases">';
        claves.forEach(function (k) {
          h += '<div class="ap-clase"><div class="ap-clase-cab">' + esc(k) + '</div><div class="ap-tuplas" style="max-height:none;border:none;background:none;padding:0">';
          cajas[k].forEach(function (s) { h += '<span class="ap-tup">' + esc(s) + '</span>'; });
          h += '</div></div>';
        });
        h += '</div>';

        var todasIguales = claves.every(function (k) { return cajas[k].length === Number(pm); });

        return '<div class="ap-kvs">' +
            '<span class="ap-kv">Variaciones (todas las tarjetas): <b>' + bigTxt(varia) + '</b></span>' +
            '<span class="ap-kv">Cajas: <b>' + claves.length + '</b></span>' +
            '<span class="ap-kv">Tarjetas por caja: <b>' + bigTxt(pm) + '</b></span>' +
          '</div>' + h +
          '<div class="mx-info">Hay <b>' + claves.length + '</b> cajas y en cada una hay exactamente <b>' + bigTxt(pm) +
          '</b> tarjetas' + (todasIguales ? '' : ' (revisa: no todas coinciden)') + '. Por tanto:' +
          KD('\\underbrace{' + bigTex(varia) + '}_{V_{' + nn + ',' + mm + '}} = ' +
             '\\underbrace{' + bigTex(comb) + '}_{\\text{cajas}} \\times \\underbrace{' + bigTex(pm) + '}_{' + mm + '!}') +
          'Y despejando, la fórmula de las combinaciones:' +
          KD('C_{' + nn + ',' + mm + '} = \\dfrac{V_{' + nn + ',' + mm + '}}{P_{' + mm + '}} = ' +
             '\\dfrac{n!}{(n-m)!} \\cdot \\dfrac{1}{m!} = \\dfrac{n!}{m!\\,(n-m)!}') +
          '</div>' +
          '<div class="mx-info"><b>Lo importante no es la fórmula, es el argumento.</b> ' +
          'Hemos contado lo mismo de dos maneras: una vez «de golpe» (las variaciones) y otra «por cajas» ' +
          '(combinaciones × ordenaciones internas). Igualar los dos recuentos da la fórmula. ' +
          'Esta técnica, llamada <b>doble conteo</b>, resuelve muchísimos problemas de combinatoria.</div>' +
          '<div class="mx-info"><b>Cuidado.</b> Dividir entre $m!$ solo es legítimo porque <b>todas</b> las cajas tienen el mismo tamaño. ' +
          'Si las cajas tuvieran tamaños distintos, dividir sería un error. Compruébalo en las cajas de arriba: ' +
          'todas tienen ' + bigTxt(pm) + ' tarjetas, ni una más ni una menos.</div>';
      });
  };

  /* ==================================================================
     25) primitiva — la Lotería Primitiva
     ================================================================== */
  R.primitiva = function (n) {
    shell(n,
      'La Lotería Primitiva',
      'En la Primitiva se marcan 6 números de entre 49. El boleto no cambia si los marcas en otro orden ' +
      'y no puedes marcar dos veces el mismo: es una <b>combinación</b>. ' +
      'Cambia los parámetros para comparar loterías de distintos países y ver cómo se dispara la dificultad.',
      [
        { id: 'nn', label: 'n · números del bombo', type: 'number', min: 2, max: 90, value: 49 },
        { id: 'mm', label: 'm · números que marcas', type: 'number', min: 1, max: 12, value: 6 },
        { id: 'bo', label: 'Boletos que juegas',     type: 'number', min: 1, max: 100000, value: 1 },
        { type: 'presets', list: [
          { label: 'Primitiva 6 de 49',   apply: function (c) { c.nn.value = 49; c.mm.value = 6; } },
          { label: 'Bonoloto 6 de 49',    apply: function (c) { c.nn.value = 49; c.mm.value = 6; } },
          { label: 'EuroMillones 5 de 50',apply: function (c) { c.nn.value = 50; c.mm.value = 5; } },
          { label: 'Lotería 6 de 45',     apply: function (c) { c.nn.value = 45; c.mm.value = 6; } },
          { label: 'Una fácil: 3 de 10',  apply: function (c) { c.nn.value = 10; c.mm.value = 3; } }
        ] }
      ],
      function (v) {
        var nn = entero(v.nn, 2, 90, 'n'), mm = entero(v.mm, 1, 12, 'm');
        var bo = entero(v.bo, 1, 100000, 'Los boletos');
        if (mm > nn) throw Error('No puedes marcar más números de los que hay en el bombo.');

        var val = S.C(nn, mm);
        var varia = S.V(nn, mm);
        var p = bo / Number(val);

        /* Cuadrícula de números del boleto */
        var cols = Math.min(10, nn);
        var filas = Math.ceil(nn / cols);
        var cel = 62, W = Math.max(700, cols * cel + 80), H = 84 + filas * cel + 30;
        var body = '';
        body += txt(W / 2, 36, 'Boleto: marca ' + mm + ' de los ' + nn + ' números',
                    { size: 19, weight: '700', fill: '#37474f' });
        /* marcamos m números concretos para ilustrar */
        var marcados = {};
        for (var q = 0; q < mm; q++) marcados[Math.floor(q * (nn - 1) / Math.max(mm - 1, 1)) + 1] = 1;
        for (var i = 1; i <= nn; i++) {
          var r = Math.floor((i - 1) / cols), c = (i - 1) % cols;
          var x = 40 + c * cel, y = 66 + r * cel;
          var on = !!marcados[i];
          body += rect(x, y, cel - 8, cel - 8, on ? '#0d47a1' : '#fff', on ? '#0d47a1' : '#b0bec5', { sw: on ? 2.6 : 1.4, r: 8 });
          body += txt(x + (cel - 8) / 2, y + (cel - 8) / 2 + 7, String(i),
                      { size: 18, weight: on ? '800' : '600', fill: on ? '#fff' : '#37474f' });
        }
        body += txt(W / 2, H - 10, esc('C(' + nn + ',' + mm + ') = ' + bigTxt(val) + ' boletos distintos'),
                    { size: 18, weight: '800', fill: COL.azulOsc });

        var fig = svgWrap(body, W, H, 'Boleto de lotería de ' + nn + ' números');

        var seg = Number(val) / (bo * 2);   /* dos sorteos por semana */
        var años = seg / 52;

        return fig +
          resultado(bigTxt(val), 'combinaciones posibles, es decir, boletos distintos') +
          '<div class="mx-info">' +
          KD('C_{' + nn + ',' + mm + '} = \\dfrac{' + nn + '!}{' + mm + '!\\,' + (nn - mm) + '!} = ' +
             '\\dfrac{V_{' + nn + ',' + mm + '}}{' + mm + '!} = \\dfrac{' + bigTex(varia) + '}{' + bigTex(S.fact(mm)) +
             '} = ' + bigTex(val)) + '</div>' +
          '<div class="mx-info">Probabilidad de acertar el pleno con ' + bo + ' boleto' + (bo === 1 ? '' : 's') + ':' +
          KD('P = \\dfrac{\\text{casos favorables}}{\\text{casos posibles}} = \\dfrac{' + bo + '}{' + bigTex(val) +
             '} \\approx ' + esc(p.toExponential(3).replace('.', '{,}').replace('e', ' \\cdot 10^{') + '}')) +
          'Es decir, aproximadamente <b>1 entre ' + bigTxt(BigInt(Math.round(Number(val) / bo))) + '</b>.</div>' +
          '<div class="mx-info"><b>Pensamiento crítico.</b> Jugando ' + bo + ' boleto' + (bo === 1 ? '' : 's') +
          ' en cada sorteo, y con dos sorteos por semana, tocaría en promedio una vez cada <b>' +
          bigTxt(BigInt(Math.round(años))) + ' años</b>. Para comparar: la esperanza de vida ronda los 83 años. ' +
          'La combinatoria no dice que sea imposible; dice exactamente <b>cuán improbable</b> es, y eso es más útil.</div>' +
          '<div class="mx-info"><b>Un error muy extendido.</b> Mucha gente cree que el boleto 1-2-3-4-5-6 es «menos probable» ' +
          'que uno con números dispersos. No lo es: <b>todos</b> los ' + bigTxt(val) +
          ' boletos tienen exactamente la misma probabilidad. Lo que sí conviene es evitar combinaciones populares ' +
          '(fechas, series) porque, si tocan, el premio se reparte entre más gente.</div>';
      });
  };

  /* ==================================================================
     26) dosCaminos — contar de dos maneras para autoverificarse
     ================================================================== */
  R.dosCaminos = function (n) {
    shell(n,
      'Contar de dos maneras',
      'La mejor forma de saber si un recuento está bien es <b>hacerlo dos veces por caminos distintos</b>. ' +
      'Si ambos dan lo mismo, casi seguro que es correcto; si no, hay un error en alguno de los dos. ' +
      'Elige un problema y compara los dos razonamientos.',
      [
        { id: 'pb', label: 'Problema', type: 'select', value: 'comite', options: [
          { value: 'comite',   label: 'Comité de 2 personas entre 6' },
          { value: 'apreton',  label: 'Apretones de manos entre n personas' },
          { value: 'diagonal', label: 'Diagonales de un polígono de n lados' },
          { value: 'triang',   label: 'Triángulos con n puntos, sin tres alineados' },
          { value: 'partidos', label: 'Partidos de una liga a una vuelta' }
        ] },
        { id: 'nn', label: 'n', type: 'range', min: 3, max: 20, step: 1, value: 6 }
      ],
      function (v) {
        var nn = entero(v.nn, 3, 20, 'n');
        var pb = v.pb;

        var enun, camino1, camino2, val, extra = '';

        if (pb === 'comite' || pb === 'apreton' || pb === 'partidos') {
          val = S.C(nn, 2);
          var nombre = pb === 'comite' ? 'comités de 2 personas'
                    : pb === 'apreton' ? 'apretones de manos'
                    : 'partidos de liga';
          enun = pb === 'comite'
            ? 'De un grupo de ' + nn + ' personas se elige un <b>comité de 2</b>. ¿Cuántos comités distintos hay?'
            : pb === 'apreton'
            ? 'En una reunión hay ' + nn + ' personas y <b>todas se saludan entre sí</b> una vez. ¿Cuántos apretones de manos se dan?'
            : 'En una liga de ' + nn + ' equipos <b>todos juegan contra todos</b> una sola vez. ¿Cuántos partidos hay?';
          camino1 = '<b>Camino 1 · con la fórmula.</b> Es elegir 2 de ' + nn + ' sin que importe el orden:' +
            KD('C_{' + nn + ',2} = \\dfrac{' + nn + ' \\cdot ' + (nn - 1) + '}{2} = ' + bigTex(val));
          var suma = [];
          for (var i = nn - 1; i >= 1; i--) suma.push(i);
          var sumaTex = suma.length <= 10 ? suma.join(' + ') : suma.slice(0, 6).join(' + ') + ' + \\cdots + 1';
          camino2 = '<b>Camino 2 · contando por turnos.</b> La primera persona saluda a ' + (nn - 1) + '; la segunda ya ha saludado a la primera, ' +
            'así que le quedan ' + (nn - 2) + ' nuevas; la tercera ' + (nn - 3) + '… hasta la penúltima, que saluda a 1:' +
            KD(sumaTex + ' = ' + bigTex(val));
          extra = 'Los dos caminos coinciden, y de paso hemos demostrado una identidad conocida: ' +
            KD('1 + 2 + \\cdots + (n-1) = \\dfrac{n(n-1)}{2} = \\dbinom{n}{2}');
        } else if (pb === 'diagonal') {
          var totalSeg = S.C(nn, 2);
          val = totalSeg - BigInt(nn);
          enun = 'Un polígono convexo tiene ' + nn + ' vértices. ¿Cuántas <b>diagonales</b> tiene?';
          camino1 = '<b>Camino 1 · restando los lados.</b> Cada par de vértices define un segmento. ' +
            'Hay ' + K('C_{' + nn + ',2} = ' + bigTex(totalSeg)) + ' segmentos, pero ' + nn + ' de ellos son lados, no diagonales:' +
            KD('\\dbinom{' + nn + '}{2} - ' + nn + ' = ' + bigTex(totalSeg) + ' - ' + nn + ' = ' + bigTex(val));
          camino2 = '<b>Camino 2 · desde cada vértice.</b> De cada vértice salen ' + (nn - 3) +
            ' diagonales (no cuentan él mismo ni sus dos vecinos). Con ' + nn + ' vértices serían ' +
            nn + '·' + (nn - 3) + ', pero <b>cada diagonal se ha contado dos veces</b>, una por cada extremo:' +
            KD('\\dfrac{' + nn + ' \\cdot ' + (nn - 3) + '}{2} = ' + bigTex(val));
          extra = 'El segundo camino ilustra un peligro clásico: contar cada objeto varias veces. ' +
            'Siempre hay que preguntarse «¿cuántas veces he contado lo mismo?» y dividir por esa cantidad.';
        } else {
          val = S.C(nn, 3);
          enun = 'En el plano hay ' + nn + ' puntos y <b>no hay tres alineados</b>. ¿Cuántos triángulos distintos se pueden formar?';
          camino1 = '<b>Camino 1 · elegir vértices.</b> Un triángulo queda determinado por sus 3 vértices, sin orden:' +
            KD('C_{' + nn + ',3} = \\dfrac{' + nn + '!}{3!\\,' + (nn - 3) + '!} = ' + bigTex(val));
          camino2 = '<b>Camino 2 · con orden y corrigiendo.</b> Elegir 3 puntos <b>en orden</b> da ' +
            K('V_{' + nn + ',3} = ' + bigTex(S.V(nn, 3))) + ' ternas. Pero cada triángulo aparece ' +
            K('3! = 6') + ' veces (una por cada orden de sus vértices), así que:' +
            KD('\\dfrac{' + bigTex(S.V(nn, 3)) + '}{6} = ' + bigTex(val));
          extra = 'La hipótesis «no hay tres alineados» es esencial: si tres puntos estuvieran en línea recta no formarían triángulo ' +
            'y habría que restar esos casos. Leer bien las hipótesis del enunciado forma parte del problema.';
        }

        return '<div class="ap-enun">' + enun + '</div>' +
          resultado(bigTxt(val), 'casos distintos') +
          '<div class="ap-grid2">' +
            '<div class="ap-card">' + camino1 + '</div>' +
            '<div class="ap-card">' + camino2 + '</div>' +
          '</div>' +
          '<div class="mx-info"><span class="ap-badge si">los dos caminos coinciden</span> ' + extra + '</div>' +
          '<div class="mx-info"><b>Hábito recomendable.</b> En el examen, si te sobra un minuto, recuenta el problema por otro camino ' +
          'o comprueba el resultado en un caso pequeño donde puedas listar todos los casos a mano. ' +
          'Es la única forma fiable de detectar un error de planteamiento.</div>';
      });
  };

  /* ==================================================================
     27) combinacionesRep — ampliación
     ================================================================== */
  R.combinacionesRep = function (n) {
    shell(n,
      'Combinaciones con repetición (ampliación)',
      'Caso que aparece menos en el temario pero conviene conocer: elegir $m$ elementos de $n$ tipos, ' +
      '<b>sin importar el orden</b> pero <b>pudiendo repetir</b> tipo. ' +
      'Ejemplo: tres bolas de helado eligiendo entre 7 sabores, y se puede repetir sabor. ' +
      'La fórmula es $CR_{n,m} = \\dbinom{n+m-1}{m}$.',
      [
        { id: 'nn', label: 'n · tipos disponibles', type: 'number', min: 1, max: 30, value: 7 },
        { id: 'mm', label: 'm · cuántos se cogen',  type: 'number', min: 0, max: 10, value: 3 },
        { type: 'presets', list: [
          { label: 'Helado de 3 bolas, 7 sabores', apply: function (c) { c.nn.value = 7; c.mm.value = 3; } },
          { label: 'Tres monedas de 4 valores',    apply: function (c) { c.nn.value = 4; c.mm.value = 3; } },
          { label: 'Dos dados indistinguibles',    apply: function (c) { c.nn.value = 6; c.mm.value = 2; } },
          { label: 'Cinco caramelos, 3 sabores',   apply: function (c) { c.nn.value = 3; c.mm.value = 5; } }
        ] }
      ],
      function (v) {
        var nn = entero(v.nn, 1, 30, 'n'), mm = entero(v.mm, 0, 10, 'm');
        var val = S.CR(nn, mm);
        var sinRep = mm <= nn ? S.C(nn, mm) : null;

        var lista = '';
        if (Number(val) <= 200 && mm >= 1) {
          var E = [];
          for (var i = 0; i < nn; i++) E.push(String.fromCharCode(65 + i));
          var t = S.tuplas(E, mm, 'CR', 200);
          lista = '<div class="mx-info">Todas las selecciones posibles (los repetidos son válidos):</div>' + pintaTuplas(t, '');
        }

        /* Ilustración del truco de las barras y las estrellas */
        var W = 880, H = 170, body = '';
        body += txt(W / 2, 34, 'El truco de las estrellas y las barras', { size: 18, weight: '700', fill: '#37474f' });
        var cas = nn + mm - 1;
        var cw = Math.min(52, (W - 120) / cas), x0 = (W - cas * cw) / 2;
        for (var j = 0; j < cas; j++) {
          var esBarra = j >= mm;
          var x = x0 + j * cw;
          body += rect(x + 3, 62, cw - 6, 52, esBarra ? '#fff3e0' : '#e3f2fd',
                       esBarra ? COL.naranja : COL.azul, { sw: 2 });
          body += txt(x + cw / 2, 96, esBarra ? '|' : '★',
                      { size: 24, weight: '800', fill: esBarra ? '#7a4b00' : COL.azulOsc });
        }
        body += txt(W / 2, 144, 'Elegir dónde van las ' + mm + ' estrellas entre las ' + cas +
                    ' casillas: C(' + cas + ',' + mm + ') = ' + bigTxt(val),
                    { size: 16, weight: '700', fill: COL.azulOsc });

        return svgWrap(body, W, H, 'Estrellas y barras') +
          resultado(bigTxt(val), 'selecciones distintas con repetición permitida') +
          '<div class="mx-info">' +
          KD('CR_{' + nn + ',' + mm + '} = \\dbinom{n+m-1}{m} = \\dbinom{' + nn + '+' + mm + '-1}{' + mm + '} = \\dbinom{' +
             (nn + mm - 1) + '}{' + mm + '} = ' + bigTex(val)) + '</div>' +
          '<div class="mx-info"><b>De dónde sale la fórmula.</b> Representa la selección con ' + mm +
          ' estrellas (los objetos que coges) separadas por ' + (nn - 1) + ' barras (que dividen los ' + nn +
          ' tipos). En total hay ' + (nn + mm - 1) + ' símbolos y basta con decidir <b>en qué posiciones</b> van las estrellas: ' +
          K('\\dbinom{' + (nn + mm - 1) + '}{' + mm + '}') + '. Ingenioso, y perfectamente riguroso.</div>' +
          (sinRep !== null
            ? '<div class="mx-info">Comparación: sin repetición serían solo ' + K('C_{' + nn + ',' + mm + '} = ' + bigTex(sinRep)) +
              '. Permitir repetir <b>añade</b> ' + bigTxt(val - sinRep) + ' selecciones nuevas.</div>'
            : '<div class="mx-info">Fíjate en que aquí $m > n$ y aun así hay solución: con repetición no hay límite superior para $m$.</div>') +
          lista;
      });
  };

  /* ==================================================================
     28) pascal — el triángulo interactivo
     ================================================================== */
  R.pascal = function (n) {
    var filas = 10, selN = 5, selM = 2, modo = 'stifel';
    n.classList.add('applet');

    function pinta() {
      var h =
        '<h4 class="mx-title">Applet · Triángulo de Pascal</h4>' +
        '<div class="mx-instr">Cada celda del triángulo es un número combinatorio: la celda de la fila ' +
        '<span data-tex="n"></span> y posición <span data-tex="m"></span> vale ' +
        '<span data-tex="\\dbinom{n}{m}"></span>. <b>Haz clic en cualquier celda</b> y el applet te enseñará una propiedad distinta según el modo elegido: ' +
        'la regla de formación, la simetría, o la suma de toda la fila. ' +
        'Empieza pulsando el 10 de la fila 5.</div>' +
        '<div class="mx-inputs">' +
          '<label class="mx-field"><span>Filas visibles</span>' +
            '<input class="mx-in" type="range" id="pf" min="4" max="16" step="1" value="' + filas + '"></label>' +
          '<label class="mx-field"><span>Qué resaltar al pulsar</span>' +
            '<select class="mx-in" id="pm">' +
              '<option value="stifel">Regla de formación: suma de los dos de arriba</option>' +
              '<option value="simetria">Simetría respecto al centro</option>' +
              '<option value="fila">Suma de toda la fila</option>' +
            '</select></label>' +
        '</div>' +
        '<div class="ap-pascal" id="ptri"></div>' +
        '<div class="mx-out ap-out"></div>';
      n.innerHTML = h;
      S.tex(n);

      var pf = n.querySelector('#pf'), pm = n.querySelector('#pm');
      pf.value = filas; pm.value = modo;
      pf.addEventListener('input', function () { filas = Number(pf.value); if (selN > filas) { selN = filas; selM = 0; } pinta(); });
      pm.addEventListener('change', function () { modo = pm.value; pinta(); });

      var tri = n.querySelector('#ptri');
      var html = '';
      for (var f = 0; f <= filas; f++) {
        html += '<div class="ap-fila"><span class="ap-fila-lab">n = ' + f + '</span>';
        for (var m = 0; m <= f; m++) {
          var cls = 'ap-cel';
          if (f === selN && m === selM) cls += ' ap-sel';
          else if (modo === 'stifel' && f === selN - 1 && (m === selM - 1 || m === selM)) cls += ' ap-padre';
          else if (modo === 'simetria' && f === selN && m === selN - selM) cls += ' ap-espejo';
          else if (modo === 'fila' && f === selN) cls += ' ap-espejo';
          html += '<span class="' + cls + '" data-n="' + f + '" data-m="' + m + '">' + bigTxt(S.C(f, m)) + '</span>';
        }
        html += '</div>';
      }
      tri.innerHTML = html;
      tri.querySelectorAll('.ap-cel').forEach(function (c) {
        c.addEventListener('click', function () {
          selN = Number(c.dataset.n); selM = Number(c.dataset.m); pinta();
        });
      });

      var out = n.querySelector('.mx-out');
      var val = S.C(selN, selM);
      var txt2 = '<div class="mx-info">Has pulsado la celda de la fila <b>' + selN + '</b>, posición <b>' + selM + '</b>:' +
        KD('\\dbinom{' + selN + '}{' + selM + '} = C_{' + selN + ',' + selM + '} = \\dfrac{' + selN + '!}{' + selM + '!\\,' +
           (selN - selM) + '!} = ' + bigTex(val)) + '</div>';

      if (modo === 'stifel') {
        if (selN === 0) {
          txt2 += '<div class="mx-info">La cúspide vale 1 por definición: ' + K('\\dbinom{0}{0} = 1') +
                  '. Hay exactamente una forma de no elegir nada.</div>';
        } else {
          var a = S.C(selN - 1, selM - 1 < 0 ? 0 : selM - 1);
          var izq = selM - 1 >= 0 ? S.C(selN - 1, selM - 1) : 0n;
          var der = selM <= selN - 1 ? S.C(selN - 1, selM) : 0n;
          txt2 += '<div class="mx-info"><b>Regla de formación (identidad de Stifel).</b> Cada celda es la suma de las dos que tiene encima ' +
            '(las marcadas en naranja):' +
            KD('\\dbinom{' + selN + '}{' + selM + '} = \\dbinom{' + (selN - 1) + '}{' + (selM - 1) + '} + \\dbinom{' +
               (selN - 1) + '}{' + selM + '} \\;\\Longrightarrow\\; ' + bigTex(val) + ' = ' + bigTex(izq) + ' + ' + bigTex(der)) +
            '<b>Por qué funciona.</b> Para elegir ' + selM + ' elementos de ' + selN + ', fíjate en uno concreto, digamos el último. ' +
            'O bien lo eliges (y te faltan ' + (selM - 1) + ' de los ' + (selN - 1) + ' restantes), o bien no lo eliges ' +
            '(y necesitas los ' + selM + ' de entre los ' + (selN - 1) + ' restantes). Los dos casos son excluyentes: se suman.</div>';
        }
      } else if (modo === 'simetria') {
        var esp = S.C(selN, selN - selM);
        txt2 += '<div class="mx-info"><b>Simetría.</b> El triángulo es un espejo:' +
          KD('\\dbinom{' + selN + '}{' + selM + '} = \\dbinom{' + selN + '}{' + (selN - selM) + '} \\;\\Longrightarrow\\; ' +
             bigTex(val) + ' = ' + bigTex(esp)) +
          '<b>Por qué.</b> Elegir ' + selM + ' elementos para «entrar» es exactamente lo mismo que elegir ' + (selN - selM) +
          ' para «quedarse fuera». Cada selección determina la otra. ' +
          'Truco práctico: para calcular ' + K('\\dbinom{49}{47}') + ' no hace falta nada: es ' + K('\\dbinom{49}{2} = 1\\,176') + '.</div>';
      } else {
        var suma = 0n;
        for (var q = 0; q <= selN; q++) suma += S.C(selN, q);
        var terminos = [];
        for (q = 0; q <= Math.min(selN, 8); q++) terminos.push(bigTex(S.C(selN, q)));
        var tt = terminos.join(' + ') + (selN > 8 ? ' + \\cdots' : '');
        txt2 += '<div class="mx-info"><b>Suma de la fila.</b> Sumando toda la fila ' + selN + ':' +
          KD(tt + ' = ' + bigTex(suma) + ' = 2^{' + selN + '}') +
          '<b>Por qué sale una potencia de 2.</b> La suma cuenta <b>todos</b> los subconjuntos de un conjunto de ' + selN +
          ' elementos: los de 0 elementos, los de 1, los de 2… Y hay otra forma de contarlos: cada elemento decide, ' +
          'independientemente, si entra o no entra. Son ' + selN + ' decisiones binarias, o sea ' + K('2^{' + selN + '} = ' + bigTex(suma)) + '. ' +
          'Doble conteo otra vez.</div>' +
          '<div class="mx-info">En general: ' + KD('\\sum_{m=0}^{n}\\dbinom{n}{m} = 2^{n}') + '</div>';
      }

      txt2 += '<div class="mx-info"><b>Las propiedades de los bordes.</b> ' +
        K('\\dbinom{n}{0} = \\dbinom{n}{n} = 1') + ' (una sola forma de no elegir a nadie o de elegirlos a todos) y ' +
        K('\\dbinom{n}{1} = \\dbinom{n}{n-1} = n') + ' (elegir uno solo: hay $n$ candidatos). ' +
        'Búscalas en el triángulo: son los unos de los bordes y la segunda diagonal.</div>' +
        '<div class="mx-info"><b>Un apunte histórico.</b> El triángulo se conoce en Europa como «de Pascal» por sus trabajos del siglo XVII, ' +
        'pero ya aparece siglos antes en textos de China, India y Persia. Las matemáticas casi nunca tienen un único inventor.</div>';

      out.innerHTML = S.texifica(txt2);
      S.tex(out);
    }
    pinta();
  };

  /* ==================================================================
     29) propiedades — comprobador de propiedades combinatorias
     ================================================================== */
  R.propiedades = function (n) {
    shell(n,
      'Comprobador de propiedades',
      'Elige una propiedad de los números combinatorios y unos valores de $n$ y $m$. ' +
      'El applet calcula los dos lados de la igualdad por separado y comprueba si coinciden. ' +
      'Úsalo para convencerte de que las propiedades no son fórmulas mágicas: se cumplen siempre, con cualquier número.',
      [
        { id: 'prop', label: 'Propiedad', type: 'select', value: 'sim', options: [
          { value: 'sim',    label: 'Simetría' },
          { value: 'stifel', label: 'Regla de formación (Stifel)' },
          { value: 'suma',   label: 'Suma de una fila = 2 elevado a n' },
          { value: 'vcm',    label: 'V = C · m!' },
          { value: 'pvnn',   label: 'P(n) = V(n,n)' },
          { value: 'alt',    label: 'Suma alterna de una fila = 0' }
        ] },
        { id: 'nn', label: 'n', type: 'number', min: 0, max: 40, value: 7 },
        { id: 'mm', label: 'm', type: 'number', min: 0, max: 40, value: 3 }
      ],
      function (v) {
        var nn = entero(v.nn, 0, 40, 'n'), mm = entero(v.mm, 0, 40, 'm');
        var izq, der, enunciado, expl, detalle = '';

        if (v.prop === 'sim') {
          if (mm > nn) throw Error('Para la simetría hace falta m ≤ n.');
          izq = S.C(nn, mm); der = S.C(nn, nn - mm);
          enunciado = '\\dbinom{' + nn + '}{' + mm + '} = \\dbinom{' + nn + '}{' + (nn - mm) + '}';
          expl = 'Elegir quién entra equivale a elegir quién se queda fuera.';
        } else if (v.prop === 'stifel') {
          if (nn < 1) throw Error('Para la regla de formación hace falta n ≥ 1.');
          if (mm < 1 || mm > nn) throw Error('Hace falta 1 ≤ m ≤ n.');
          izq = S.C(nn, mm); der = S.C(nn - 1, mm - 1) + S.C(nn - 1, mm);
          enunciado = '\\dbinom{' + nn + '}{' + mm + '} = \\dbinom{' + (nn - 1) + '}{' + (mm - 1) + '} + \\dbinom{' + (nn - 1) + '}{' + mm + '}';
          expl = 'Separando los casos según si un elemento fijado entra o no entra en el grupo.';
          detalle = bigTex(izq) + ' = ' + bigTex(S.C(nn - 1, mm - 1)) + ' + ' + bigTex(S.C(nn - 1, mm));
        } else if (v.prop === 'suma') {
          izq = 0n;
          for (var q = 0; q <= nn; q++) izq += S.C(nn, q);
          der = 2n ** BigInt(nn);
          enunciado = '\\sum_{m=0}^{' + nn + '}\\dbinom{' + nn + '}{m} = 2^{' + nn + '}';
          expl = 'Los dos lados cuentan el total de subconjuntos de un conjunto de ' + nn + ' elementos.';
        } else if (v.prop === 'vcm') {
          if (mm > nn) throw Error('Hace falta m ≤ n.');
          izq = S.V(nn, mm); der = S.C(nn, mm) * S.fact(mm);
          enunciado = 'V_{' + nn + ',' + mm + '} = C_{' + nn + ',' + mm + '} \\cdot ' + mm + '!';
          expl = 'Formar una variación es elegir el grupo (combinación) y después ordenarlo (permutación).';
          detalle = bigTex(izq) + ' = ' + bigTex(S.C(nn, mm)) + ' \\cdot ' + bigTex(S.fact(mm));
        } else if (v.prop === 'pvnn') {
          izq = S.fact(nn); der = S.V(nn, nn);
          enunciado = 'P_{' + nn + '} = V_{' + nn + ',' + nn + '} = \\dfrac{' + nn + '!}{0!}';
          expl = 'Una permutación es una variación en la que se toman todos los elementos. Aquí es imprescindible que $0!=1$.';
        } else {
          izq = 0n;
          for (var r = 0; r <= nn; r++) izq += (r % 2 === 0 ? 1n : -1n) * S.C(nn, r);
          der = nn === 0 ? 1n : 0n;
          enunciado = '\\sum_{m=0}^{' + nn + '}(-1)^m\\dbinom{' + nn + '}{m} = ' + (nn === 0 ? '1' : '0');
          expl = nn === 0
            ? 'Para $n=0$ la suma tiene un único término y vale 1.'
            : 'Hay tantos subconjuntos de tamaño par como de tamaño impar, así que la suma alterna se anula. ' +
              'Sale de aplicar el binomio de Newton a $(1-1)^{' + nn + '}$.';
        }

        var ok = izq === der;
        return '<div class="mx-info">' + KD(enunciado) + '</div>' +
          '<div class="ap-grid2">' +
            '<div class="ap-card"><div class="ap-card-tit">Lado izquierdo</div>' + resultado(bigTxt(izq), '') + '</div>' +
            '<div class="ap-card"><div class="ap-card-tit">Lado derecho</div>' + resultado(bigTxt(der), '') + '</div>' +
          '</div>' +
          '<div class="mx-info"><span class="ap-badge ' + (ok ? 'si">la igualdad se cumple' : 'no">no coinciden') + '</span> ' + expl + '</div>' +
          (detalle ? '<div class="mx-info">' + KD(detalle) + '</div>' : '') +
          '<div class="mx-info"><b>Por qué importa comprobar.</b> Una propiedad matemática no se acepta porque «la ha dicho el libro»: ' +
          'se acepta porque tiene una demostración y porque resiste cualquier caso particular que le pongas. ' +
          'Cambia $n$ y $m$ e intenta encontrar un contraejemplo. No lo encontrarás, y esa imposibilidad tiene su explicación en el razonamiento de arriba.</div>';
      });
  };

  /* ==================================================================
     30) newton — el binomio
     ================================================================== */
  R.newton = function (n) {
    shell(n,
      'Binomio de Newton',
      'El desarrollo de $(a+b)^m$ tiene por coeficientes justo la fila $m$ del triángulo de Pascal. ' +
      'Escribe el binomio con los coeficientes que quieras y el exponente. ' +
      'Ejemplos válidos: <code>a</code> y <code>b</code>; <code>x</code> y <code>2</code>; <code>3</code> y <code>2x</code>; <code>x</code> y <code>-1</code>.',
      [
        { id: 'A',  label: 'Primer término (a)', type: 'text', value: 'a' },
        { id: 'B',  label: 'Segundo término (b)', type: 'text', value: 'b' },
        { id: 'mm', label: 'Exponente m', type: 'range', min: 1, max: 10, step: 1, value: 4 },
        { type: 'presets', list: [
          { label: '(a + b) elevado a 4',  apply: function (c) { c.A.value = 'a'; c.B.value = 'b';  c.mm.value = 4; } },
          { label: '(x + 2) elevado a 5',  apply: function (c) { c.A.value = 'x'; c.B.value = '2';  c.mm.value = 5; } },
          { label: '(3 + 2x) elevado a 5', apply: function (c) { c.A.value = '3'; c.B.value = '2x'; c.mm.value = 5; } },
          { label: '(x - 1) elevado a 6',  apply: function (c) { c.A.value = 'x'; c.B.value = '-1'; c.mm.value = 6; } },
          { label: '(1 + 1) elevado a 6',  apply: function (c) { c.A.value = '1'; c.B.value = '1';  c.mm.value = 6; } }
        ] }
      ],
      function (v) {
        var A = String(v.A || 'a').trim() || 'a';
        var B = String(v.B || 'b').trim() || 'b';
        var mm = entero(v.mm, 1, 10, 'El exponente');

        /* Separa un término en coeficiente numérico y parte literal: "2x" -> [2,"x"] */
        function parte(s) {
          var m2 = s.match(/^([+-]?\d*(?:[.,]\d+)?)\s*([A-Za-z]?)$/);
          if (!m2) return { c: null, lit: s };
          var cs = m2[1].replace(',', '.');
          var c = cs === '' || cs === '+' ? 1 : (cs === '-' ? -1 : Number(cs));
          return { c: c, lit: m2[2] || '' };
        }
        var pa = parte(A), pb = parte(B);
        var numerico = pa.c !== null && pb.c !== null;

        function pot(base, e) {
          if (e === 0) return '';
          return base.length === 1 ? base + (e === 1 ? '' : '^{' + e + '}')
                                   : '(' + base + ')' + (e === 1 ? '' : '^{' + e + '}');
        }

        /* Desarrollo simbólico general */
        var term = [];
        for (var k = 0; k <= mm; k++) {
          var co = S.C(mm, k);
          var pa2 = pot(A, mm - k), pb2 = pot(B, k);
          var piezas = [];
          if (co !== 1n) piezas.push(bigTex(co));
          if (pa2) piezas.push(pa2);
          if (pb2) piezas.push(pb2);
          if (!piezas.length) piezas.push('1');
          term.push(piezas.join(''));
        }
        var simb = term.join(' + ');

        /* Desarrollo numérico agrupado si ambos términos son "coef · literal" */
        var numTex = '';
        if (numerico && (pa.lit === '' || pb.lit === '') && (pa.lit !== pb.lit || pa.lit === '')) {
          var lit = pa.lit || pb.lit;
          var litEsA = pa.lit !== '';
          var partes = [];
          for (k = 0; k <= mm; k++) {
            var coef = Number(S.C(mm, k)) * Math.pow(pa.c, mm - k) * Math.pow(pb.c, k);
            var grado = litEsA ? (mm - k) : k;
            var s2 = (coef < 0 ? ' - ' : (partes.length ? ' + ' : '')) + Math.abs(coef);
            if (grado > 0) s2 += lit + (grado > 1 ? '^{' + grado + '}' : '');
            partes.push(s2);
          }
          /* ordena por grado creciente para leerlo como polinomio */
          if (litEsA) partes.reverse();
          numTex = partes.join('').replace(/^\s*\+\s*/, '');
        }

        /* Fila de Pascal resaltada */
        var coefs = [];
        for (k = 0; k <= mm; k++) coefs.push(bigTxt(S.C(mm, k)));
        var filaHtml = '<div class="ap-pascal"><div class="ap-fila"><span class="ap-fila-lab">fila ' + mm + '</span>' +
          coefs.map(function (c) { return '<span class="ap-cel ap-espejo">' + c + '</span>'; }).join('') +
          '</div></div>';

        var suma = 0n;
        for (k = 0; k <= mm; k++) suma += S.C(mm, k);

        return '<div class="mx-info">Fórmula general del binomio de Newton:' +
          KD('(a+b)^{m} = \\sum_{k=0}^{m}\\dbinom{m}{k}\\,a^{\\,m-k}\\,b^{\\,k}') + '</div>' +
          '<div class="mx-info">Coeficientes: la fila ' + mm + ' del triángulo de Pascal.</div>' + filaHtml +
          '<div class="mx-info">Desarrollo término a término:' +
          KD('(' + esc(A) + ' + ' + esc(B) + ')^{' + mm + '} = ' + simb) + '</div>' +
          (numTex ? '<div class="mx-info">Operando los coeficientes:' +
                    KD('(' + esc(A) + ' + ' + esc(B) + ')^{' + mm + '} = ' + numTex) + '</div>' : '') +
          '<div class="mx-info"><b>Cómo se lee un término cualquiera.</b> El término de lugar $k+1$ es ' +
          K('\\dbinom{' + mm + '}{k}\\,a^{' + mm + '-k}b^{k}') + '. ' +
          'Los exponentes de $a$ bajan de ' + mm + ' a 0 mientras los de $b$ suben de 0 a ' + mm + ', ' +
          'y en cada término <b>suman siempre ' + mm + '</b>. Es una comprobación rapidísima para detectar errores.</div>' +
          '<div class="mx-info"><b>De dónde salen los coeficientes.</b> Al multiplicar $(a+b)$ por sí mismo ' + mm +
          ' veces, cada término del resultado sale de elegir, en cada uno de los ' + mm + ' paréntesis, o bien $a$ o bien $b$. ' +
          'El término con $b^{k}$ aparece tantas veces como formas hay de elegir en qué $k$ paréntesis se coge la $b$: ' +
          'exactamente ' + K('\\dbinom{' + mm + '}{k}') + '. El binomio de Newton <b>es</b> combinatoria pura.</div>' +
          '<div class="mx-info"><b>Un caso especial que ya conoces.</b> Poniendo $a=b=1$ queda ' +
          K('2^{' + mm + '} = ' + bigTex(suma)) + ', la suma de la fila. Y poniendo $a=1$, $b=-1$ queda 0, la suma alterna.</div>';
      });
  };

  /* ==================================================================
     31) esquema — el mapa de decisión completo
     ================================================================== */
  R.esquema = function (n) {
    shell(n,
      'Mapa de decisión',
      'El esquema completo del tema en una sola imagen. Marca las casillas según tu problema ' +
      'y el camino correcto se resaltará en naranja, con la fórmula al final. ' +
      'Si te aprendes este mapa, tienes el tema resuelto.',
      [
        { id: 'orden', label: '¿Importa el orden?', type: 'check', value: true },
        { id: 'todos', label: '¿Entran todos los elementos?', type: 'check', value: false },
        { id: 'repite', label: '¿Se pueden repetir?', type: 'check', value: false }
      ],
      function (v) {
        var orden = !!v.orden, todos = !!v.todos, rep = !!v.repite;

        var destino;
        if (!orden) destino = rep ? 'CR' : 'C';
        else if (todos) destino = rep ? 'PR' : 'P';
        else destino = rep ? 'VR' : 'V';

        var NODOS = {
          C:  { nom: 'Combinaciones',                       f: 'C_{n,m} = \\dfrac{n!}{m!\\,(n-m)!}' },
          CR: { nom: 'Combinaciones con repetición',        f: 'CR_{n,m} = \\dbinom{n+m-1}{m}' },
          P:  { nom: 'Permutaciones',                       f: 'P_{n} = n!' },
          PR: { nom: 'Permutaciones con repetición',        f: 'P_{n}^{a,b,\\dots} = \\dfrac{n!}{a!\\,b!\\cdots}' },
          V:  { nom: 'Variaciones sin repetición',          f: 'V_{n,m} = \\dfrac{n!}{(n-m)!}' },
          VR: { nom: 'Variaciones con repetición',          f: 'VR_{n,m} = n^{m}' }
        };

        var W = 1280, H = 560, body = '';
        body += txt(W / 2, 34, 'Mapa de decisión de la combinatoria', { size: 21, weight: '800', fill: '#37474f' });

        function caja(x, y, w, h, tit, sub, activo, col) {
          var f = activo ? '#fff3e0' : '#f7fafd';
          var c = activo ? COL.naranja : '#b0bec5';
          var t = activo ? '#7a4b00' : '#546e7a';
          var s = '';
          s += rect(x, y, w, h, f, c, { sw: activo ? 3.2 : 1.8 });
          s += txt(x + w / 2, y + (sub ? 30 : h / 2 + 7), tit, { size: 17, weight: '800', fill: t });
          if (sub) s += txt(x + w / 2, y + 54, sub, { size: 14, fill: t });
          return s;
        }
        function flecha(x1, y1, x2, y2, act, etq) {
          var c = act ? COL.naranja : '#cfd8dc';
          var s = line(x1, y1, x2, y2, c, act ? 3.2 : 2);
          var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
          var ux = dx / L, uy = dy / L;
          s += path('M' + (x2 - 12 * ux + 6 * uy) + ' ' + (y2 - 12 * uy - 6 * ux) +
                    ' L' + x2 + ' ' + y2 +
                    ' L' + (x2 - 12 * ux - 6 * uy) + ' ' + (y2 - 12 * uy + 6 * ux), c, act ? 3.2 : 2);
          /* La etiqueta se coloca al 55 % del trazo y desplazada en
             perpendicular, para no quedar nunca encima de una caja. */
          if (etq) s += txt(x1 + dx * 0.55 + uy * 17, y1 + dy * 0.55 - ux * 17 - 4, etq,
                            { size: 14.5, weight: '800', fill: act ? COL.naranja : '#90a4ae' });
          return s;
        }

        /* Nivel 0 — la primera pregunta */
        body += caja(560, 58, 230, 62, '¿Importa el orden?', '', true, COL.azul);

        /* Rama NO -> combinaciones */
        body += flecha(620, 120, 310, 176, !orden, 'NO');
        body += caja(140, 176, 220, 62, '¿Se repiten?', '', !orden, COL.azul);
        body += flecha(200, 238, 125, 300, !orden && !rep, 'NO');
        body += flecha(300, 238, 360, 300, !orden && rep, 'SÍ');
        body += caja(20, 300, 210, 76, 'Combinaciones', 'C(n, m)', destino === 'C', COL.verde);
        body += caja(245, 300, 230, 76, 'Comb. con repetición', 'CR(n, m)', destino === 'CR', COL.verde);

        /* Rama SÍ -> variaciones o permutaciones */
        body += flecha(730, 120, 850, 176, orden, 'SÍ');
        body += caja(790, 176, 240, 62, '¿Entran todos?', '', orden, COL.azul);
        body += flecha(860, 238, 730, 300, orden && !todos, 'NO');
        body += flecha(960, 238, 1060, 300, orden && todos, 'SÍ');
        body += caja(600, 300, 200, 62, '¿Se repiten?', '', orden && !todos, COL.azul);
        body += caja(995, 300, 200, 62, '¿Se repiten?', '', orden && todos, COL.azul);

        body += flecha(660, 362, 590, 424, orden && !todos && !rep, 'NO');
        body += flecha(750, 362, 807, 424, orden && !todos && rep, 'SÍ');
        body += caja(495, 424, 190, 76, 'Variaciones', 'V(n, m)', destino === 'V', COL.azulOsc);
        body += caja(700, 424, 215, 76, 'Var. con repetición', 'VR(n, m)', destino === 'VR', COL.azulOsc);

        body += flecha(1050, 362, 1008, 424, orden && todos && !rep, 'NO');
        body += flecha(1140, 362, 1185, 424, orden && todos && rep, 'SÍ');
        body += caja(925, 424, 165, 76, 'Permutaciones', 'P(n)', destino === 'P', COL.morado);
        body += caja(1102, 424, 165, 76, 'Perm. con rep.', 'PR(n)', destino === 'PR', COL.morado);

        body += txt(W / 2, H - 8, 'Las tres preguntas siempre en el mismo orden: orden → todos → repetición',
                    { size: 14.5, fill: '#78909c' });

        var d = NODOS[destino];
        return svgWrap(body, W, H, 'Mapa de decisión de la combinatoria') +
          '<div class="mx-info"><b>Tu camino lleva a: ' + esc(d.nom) + '</b>' + KD(d.f) + '</div>' +
          '<div class="mx-info"><b>Cómo usar el mapa en un examen.</b> Antes de escribir nada, subraya en el enunciado ' +
          'las palabras que responden a las tres preguntas. ' +
          '«Ordenar», «colocar», «podio», «cargos distintos», «número de N cifras» → el orden importa. ' +
          '«Grupo», «equipo», «comité», «elegir», «ramo», «conjunto» → el orden no importa. ' +
          '«Todos», «los N» → entran todos. «Puede repetirse», «con reemplazamiento» → hay repetición.</div>';
      });
  };

  /* ==================================================================
     32) resumenTabla — el cuadro resumen calculador
     ================================================================== */
  R.resumenTabla = function (n) {
    shell(n,
      'Cuadro resumen calculador',
      'La tabla completa del tema, calculada con tus valores. Cambia $n$ y $m$ y observa cómo se reordenan las cantidades. ' +
      'La fila resaltada es la del tipo que hayas elegido en el desplegable. ' +
      'Úsala para repasar antes del examen: cada fila lleva la fórmula, el valor y la pregunta que la identifica.',
      [
        { id: 'nn', label: 'n', type: 'number', min: 0, max: 60, value: 6 },
        { id: 'mm', label: 'm', type: 'number', min: 0, max: 30, value: 3 },
        { id: 'sel', label: 'Resaltar', type: 'select', value: 'C', options: [
          { value: 'V',  label: 'Variaciones sin repetición' },
          { value: 'VR', label: 'Variaciones con repetición' },
          { value: 'P',  label: 'Permutaciones' },
          { value: 'C',  label: 'Combinaciones' },
          { value: 'CR', label: 'Combinaciones con repetición' },
          { value: 'PC', label: 'Permutaciones circulares' }
        ] }
      ],
      function (v) {
        var nn = entero(v.nn, 0, 60, 'n'), mm = entero(v.mm, 0, 30, 'm');
        var sel = v.sel;

        function seguro(f) { try { return bigTxt(f()); } catch (e) { return '<span style="color:#b71c1c">no aplicable</span>'; } }

        var filas = [
          { k: 'V',  nom: 'Variaciones sin repetición', sim: 'V_{n,m}',
            f: 'V_{n,m}=\\dfrac{n!}{(n-m)!}', pre: 'Importa el orden, no se repite, no entran todos',
            val: function () { return S.V(nn, mm); } },
          { k: 'VR', nom: 'Variaciones con repetición', sim: 'VR_{n,m}',
            f: 'VR_{n,m}=n^{m}', pre: 'Importa el orden y sí se repite. Admite m > n',
            val: function () { return S.VR(nn, mm); } },
          { k: 'P',  nom: 'Permutaciones', sim: 'P_{n}',
            f: 'P_{n}=n!', pre: 'Entran todos y solo cambia el orden',
            val: function () { return S.fact(nn); } },
          { k: 'PC', nom: 'Permutaciones circulares', sim: 'PC_{n}',
            f: 'PC_{n}=(n-1)!', pre: 'Todos en círculo, sin posición de referencia',
            val: function () { return S.PC(nn); } },
          { k: 'C',  nom: 'Combinaciones', sim: 'C_{n,m}',
            f: 'C_{n,m}=\\dfrac{n!}{m!\\,(n-m)!}', pre: 'No importa el orden y no se repite',
            val: function () { return S.C(nn, mm); } },
          { k: 'CR', nom: 'Combinaciones con repetición', sim: 'CR_{n,m}',
            f: 'CR_{n,m}=\\dbinom{n+m-1}{m}', pre: 'No importa el orden y sí se repite',
            val: function () { return S.CR(nn, mm); } }
        ];

        var h = '<table class="ap-tbl ap-cmb"><thead><tr>' +
          '<th style="text-align:left">Tipo</th><th>Símbolo</th><th>Fórmula</th>' +
          '<th>Cómo se reconoce</th><th>Valor con n = ' + nn + ', m = ' + mm + '</th></tr></thead><tbody>';
        filas.forEach(function (f) {
          h += '<tr' + (f.k === sel ? ' class="ap-hi"' : '') + '>' +
            '<th>' + esc(f.nom) + '</th>' +
            '<td>' + K(f.sim) + '</td>' +
            '<td>' + K(f.f) + '</td>' +
            '<td style="font-size:.82rem;text-align:left">' + esc(f.pre) + '</td>' +
            '<td class="ap-num"><b>' + seguro(f.val) + '</b></td></tr>';
        });
        h += '</tbody></table>';

        /* Relaciones */
        var rel = '';
        if (mm <= nn && nn >= 0) {
          rel = '<div class="mx-info"><b>Relaciones que conviene tener a mano.</b>' +
            KD('P_{n} = V_{n,n} \\qquad C_{n,m} = \\dfrac{V_{n,m}}{P_{m}} \\qquad V_{n,m} = C_{n,m}\\cdot P_{m}') +
            'Comprobado con tus valores: ' +
            K('V_{' + nn + ',' + mm + '} = ' + bigTex(S.V(nn, mm)) + ' = ' + bigTex(S.C(nn, mm)) + ' \\cdot ' + bigTex(S.fact(mm))) +
            '</div>';
        }

        return h + rel +
          '<div class="mx-info"><b>Orden de magnitud.</b> Para unos mismos $n$ y $m$ (con $m \\le n$) se cumple siempre ' +
          K('C_{n,m} \\le V_{n,m} \\le VR_{n,m}') + '. ' +
          'Si tu resultado no respeta ese orden, has confundido la fórmula. Es una comprobación de 5 segundos que salva exámenes.</div>';
      });
  };

  /* ==================================================================
     33) errores — el detector de errores frecuentes
     ================================================================== */
  var ERRORES = [
    { t: 'Un alumno calcula $C_{8,3}$ así: $\\dfrac{8!}{3!} = 6\\,720$.',
      mal: 'Ha olvidado el $(n-m)!$ del denominador. Eso que ha calculado es $V_{8,3}$, no $C_{8,3}$.',
      bien: 'C_{8,3} = \\dfrac{8!}{3!\\,5!} = 56',
      leccion: 'En las combinaciones el denominador tiene DOS factoriales: $m!$ y $(n-m)!$.' },
    { t: 'Para colocar 5 personas en un banco de 5 plazas, un alumno escribe $V_{5,5}$ y se atasca porque le sale $\\dfrac{5!}{0!}$ y cree que no se puede.',
      mal: 'Piensa que $0!$ no está definido o que vale 0, lo que daría una división entre cero.',
      bien: 'V_{5,5} = \\dfrac{5!}{0!} = \\dfrac{120}{1} = 120 = P_5',
      leccion: 'Por convenio $0! = 1$. Sin él, la fórmula de las variaciones fallaría justo en el caso de las permutaciones.' },
    { t: 'Se piden números de 4 cifras con los dígitos 1, 2 y 3. Un alumno responde $V_{3,4}$.',
      mal: 'Sin repetición hace falta $m \\le n$, y aquí $m = 4 > 3 = n$. Con solo 3 dígitos distintos no se puede formar un número de 4 cifras sin repetir.',
      bien: 'VR_{3,4} = 3^{4} = 81',
      leccion: 'Solo las variaciones CON repetición admiten $m > n$. Si te sale $m>n$ en cualquier otra fórmula, has elegido mal el tipo.' },
    { t: 'De 7 amigos hay que elegir 3 para un equipo. Un alumno responde $V_{7,3} = 210$.',
      mal: 'Ha usado variaciones, es decir, ha contado como distintos los mismos tres amigos nombrados en otro orden. Un equipo no cambia por eso.',
      bien: 'C_{7,3} = \\dfrac{210}{3!} = 35',
      leccion: 'La pregunta decisiva: ¿si cambio el orden, es otro caso? Si la respuesta es NO, son combinaciones.' },
    { t: 'Hay 4 primeros y 5 segundos en la carta. Se pide cuántos menús de primero y segundo hay. Un alumno responde $4 + 5 = 9$.',
      mal: 'Ha sumado, pero las dos elecciones se hacen las dos, encadenadas. La conjunción del enunciado es «y», no «o».',
      bien: '4 \\cdot 5 = 20',
      leccion: 'Etapas encadenadas («y») → multiplicar. Casos excluyentes («o») → sumar.' },
    { t: 'Para calcular $\\dfrac{49!}{43!}$, un alumno intenta hacer $49!$ con la calculadora y le da error.',
      mal: 'Ha querido desarrollar factoriales enormes en lugar de simplificar. $49!$ tiene 63 cifras.',
      bien: '\\dfrac{49!}{43!} = 49 \\cdot 48 \\cdot 47 \\cdot 46 \\cdot 45 \\cdot 44 = 10\\,068\\,347\\,520',
      leccion: 'En un cociente de factoriales, cancela SIEMPRE antes de calcular. Nunca desarrolles el factorial entero.' },
    { t: 'Se pregunta cuántos códigos de 4 cifras contienen al menos un 7. Un alumno responde $4 \\cdot 10^{3} = 4\\,000$.',
      mal: 'Ha elegido la posición del 7 y ha rellenado el resto libremente, pero así los códigos con dos o más sietes se cuentan varias veces.',
      bien: '10^{4} - 9^{4} = 10\\,000 - 6\\,561 = 3\\,439',
      leccion: 'Ante un «al menos uno», usa el complementario: total menos los casos que no tienen ninguno.' },
    { t: 'Se pregunta de cuántas formas pueden sentarse 6 personas alrededor de una mesa redonda. Un alumno responde $6! = 720$.',
      mal: 'En una mesa redonda no hay primera silla: las 6 rotaciones de una misma disposición son la misma cosa.',
      bien: 'PC_{6} = (6-1)! = 5! = 120',
      leccion: 'Pregúntate siempre si existe una posición de referencia. Si no la hay, divide por el número de rotaciones.' },
    { t: 'Se pide el número de ordenaciones de las letras de CASA. Un alumno responde $4! = 24$.',
      mal: 'Ha tratado las dos A como si fueran distinguibles. Intercambiarlas no produce una palabra nueva.',
      bien: 'P_{4}^{2} = \\dfrac{4!}{2!} = \\dfrac{24}{2} = 12',
      leccion: 'Si hay elementos idénticos, divide por el factorial de cada grupo de repetidos.' },
    { t: 'En un problema de probabilidad, un alumno aplica la regla de Laplace a una ruleta trucada donde el rojo sale más que el negro.',
      mal: 'La regla de Laplace exige que todos los casos sean EQUIPROBABLES. Si están trucados, no lo son.',
      bien: 'P(A) = \\dfrac{\\text{casos favorables}}{\\text{casos posibles}} \\quad \\text{solo si todos son equiprobables}',
      leccion: 'La combinatoria cuenta casos; convertir ese recuento en probabilidad exige comprobar antes la equiprobabilidad.' }
  ];

  R.errores = function (n) {
    var idx = 0, visto = false;
    n.classList.add('applet');

    function pinta() {
      var c = ERRORES[idx];
      n.innerHTML =
        '<h4 class="mx-title">Applet · Detector de errores frecuentes</h4>' +
        '<div class="mx-instr">Aquí tienes los ' + ERRORES.length + ' errores que más se repiten en los exámenes de combinatoria. ' +
        'Lee el caso, <b>intenta detectar el fallo tú antes de pulsar</b> y luego compara con la explicación. ' +
        'Reconocer el error de otro es la mejor forma de no cometerlo.</div>' +
        '<div class="ap-kvs"><span class="ap-kv">Caso <b>' + (idx + 1) + '</b> de <b>' + ERRORES.length + '</b></span></div>' +
        '<div class="ap-enun">' + S.texifica(c.t) + '</div>' +
        '<div class="ap-btns">' +
          '<button type="button" class="ap-chip" data-a="ver">' + (visto ? 'Ocultar la explicación' : 'Ver dónde está el fallo') + '</button>' +
          '<button type="button" class="ap-chip" data-a="sig">Siguiente caso</button>' +
        '</div>' +
        '<div class="mx-out ap-out"></div>';

      var out = n.querySelector('.mx-out');
      if (visto) {
        out.innerHTML = S.texifica(
          '<div class="ap-ko">Dónde falla:</div><div class="mx-info">' + c.mal + '</div>' +
          '<div class="ap-ok">Lo correcto:</div><div class="mx-info">' + KD(c.bien) + '</div>' +
          '<div class="mx-info"><b>La lección:</b> ' + c.leccion + '</div>');
      } else {
        out.innerHTML = '<div class="mx-info">Piénsalo unos segundos antes de mirar la respuesta.</div>';
      }
      S.tex(n);

      n.querySelector('[data-a="ver"]').addEventListener('click', function () { visto = !visto; pinta(); });
      n.querySelector('[data-a="sig"]').addEventListener('click', function () {
        idx = (idx + 1) % ERRORES.length; visto = false; pinta();
      });
    }
    pinta();
  };

  /* ==================================================================
     34) entrenador — banco de problemas con corrección
     ================================================================== */
  var BANCO = [
    { e: 'En una carrera participan 8 atletas. ¿De cuántas formas puede quedar el podio (oro, plata y bronce)?',
      r: function () { return S.V(8, 3); }, f: 'V_{8,3}=\\dfrac{8!}{5!}=8\\cdot 7\\cdot 6', p: 'Importa el orden y no se repite.' },
    { e: 'En una clase de 22 alumnos se eligen delegado, subdelegado y tesorero. ¿Cuántas candidaturas distintas hay?',
      r: function () { return S.V(22, 3); }, f: 'V_{22,3}=22\\cdot 21\\cdot 20', p: 'Tres cargos distintos: el orden importa.' },
    { e: 'Con las letras de la palabra CALOR, ¿cuántas claves de 3 letras distintas se pueden formar?',
      r: function () { return S.V(5, 3); }, f: 'V_{5,3}=5\\cdot 4\\cdot 3', p: 'CAL y LAC son claves distintas.' },
    { e: '¿Cuántos números de 2 cifras se pueden formar con los dígitos 1, 2 y 3, pudiendo repetir?',
      r: function () { return S.VR(3, 2); }, f: 'VR_{3,2}=3^{2}', p: 'El 22 vale y el 12 no es el 21.' },
    { e: '¿Cuántas quinielas distintas de 14 partidos se pueden rellenar con los signos 1, X y 2?',
      r: function () { return S.VR(3, 14); }, f: 'VR_{3,14}=3^{14}', p: 'Catorce posiciones, tres signos, con repetición.' },
    { e: 'Una caja fuerte tiene un teclado del 0 al 9 y un código de 4 cifras. ¿Cuántos códigos hay?',
      r: function () { return S.VR(10, 4); }, f: 'VR_{10,4}=10^{4}', p: 'Se puede repetir cifra.' },
    { e: '¿Cuántos códigos de 4 cifras contienen al menos un 7?',
      r: function () { return S.VR(10, 4) - S.VR(9, 4); }, f: '10^{4}-9^{4}=10\\,000-6\\,561', p: 'Complementario: total menos los que no tienen ningún 7.' },
    { e: '¿De cuántas formas pueden sentarse 5 personas en un banco de 5 plazas?',
      r: function () { return S.fact(5); }, f: 'P_{5}=5!', p: 'Entran todas y solo cambia el orden.' },
    { e: '¿De cuántas maneras se pueden ordenar 7 macetas distintas en una fila?',
      r: function () { return S.fact(7); }, f: 'P_{7}=7!', p: 'Permutación ordinaria.' },
    { e: '¿De cuántas formas pueden sentarse 5 personas alrededor de una mesa redonda?',
      r: function () { return S.PC(5); }, f: 'PC_{5}=(5-1)!=4!', p: 'No hay silla de referencia: se divide entre 5.' },
    { e: '¿Cuántas ordenaciones distintas de las letras de CASA existen?',
      r: function () { return S.PR([2, 1, 1]); }, f: 'P_{4}^{2}=\\dfrac{4!}{2!}', p: 'Las dos A son indistinguibles.' },
    { e: '¿Cuántas palabras distintas, con o sin sentido, se pueden formar con las letras de MATEMATICAS?',
      r: function () { return S.PR([3, 2, 2, 1, 1, 1, 1]); }, f: 'P_{11}^{3,2,2}=\\dfrac{11!}{3!\\,2!\\,2!}', p: 'Tres A, dos M y dos T.' },
    { e: 'Se lanzan 5 monedas iguales y salen 3 caras y 2 cruces. ¿De cuántas formas puede haber ocurrido?',
      r: function () { return S.PR([3, 2]); }, f: 'P_{5}^{3,2}=\\dfrac{5!}{3!\\,2!}', p: 'Permutación con repetición, o C(5,3): es lo mismo.' },
    { e: 'Con las letras de MIQUEL, ¿cuántos grupos de 4 letras distintas se pueden elegir, sin importar el orden?',
      r: function () { return S.C(6, 4); }, f: 'C_{6,4}=\\dbinom{6}{4}', p: 'Grupo sin orden.' },
    { e: 'En la Lotería Primitiva se eligen 6 números del 1 al 49. ¿Cuántas apuestas distintas hay?',
      r: function () { return S.C(49, 6); }, f: 'C_{49,6}=\\dbinom{49}{6}', p: 'El boleto no cambia con el orden.' },
    { e: 'De 7 amigos hay que elegir 3 para hacer una foto. ¿Cuántos grupos distintos hay?',
      r: function () { return S.C(7, 3); }, f: 'C_{7,3}=\\dbinom{7}{3}', p: 'Sin orden y sin repetición.' },
    { e: 'En un grupo de 6 personas todas se saludan entre sí una vez. ¿Cuántos apretones de manos hay?',
      r: function () { return S.C(6, 2); }, f: 'C_{6,2}=\\dfrac{6\\cdot 5}{2}', p: 'Un apretón lo dan dos personas, sin orden.' },
    { e: 'Con 8 puntos del plano, sin tres alineados, ¿cuántos triángulos distintos se pueden formar?',
      r: function () { return S.C(8, 3); }, f: 'C_{8,3}=\\dbinom{8}{3}', p: 'Un triángulo son 3 vértices sin orden.' },
    { e: 'De 6 plantas distintas, ¿cuántos ramos de 3 plantas se pueden hacer?',
      r: function () { return S.C(6, 3); }, f: 'C_{6,3}=\\dbinom{6}{3}', p: 'Un ramo es un conjunto.' },
    { e: 'En una liga de 12 equipos todos juegan contra todos una sola vez. ¿Cuántos partidos hay?',
      r: function () { return S.C(12, 2); }, f: 'C_{12,2}=\\dfrac{12\\cdot 11}{2}', p: 'Cada partido lo forman dos equipos, sin orden.' },
    { e: '¿Cuántas banderas de 3 franjas de colores distintos se pueden hacer con 7 colores, si el orden de las franjas importa?',
      r: function () { return S.V(7, 3); }, f: 'V_{7,3}=7\\cdot 6\\cdot 5', p: 'El orden de las franjas cambia la bandera.' },
    { e: '¿Cuántos números de 3 cifras distintas se pueden formar con los dígitos del 1 al 9?',
      r: function () { return S.V(9, 3); }, f: 'V_{9,3}=9\\cdot 8\\cdot 7', p: 'Cifras distintas y el orden importa.' },
    { e: '¿Cuál es la suma de todos los números de la fila 6 del triángulo de Pascal?',
      r: function () { return 64n; }, f: '\\sum_{m=0}^{6}\\dbinom{6}{m}=2^{6}', p: 'Cuenta todos los subconjuntos de 6 elementos.' },
    { e: 'Un polígono convexo tiene 10 vértices. ¿Cuántas diagonales tiene?',
      r: function () { return S.C(10, 2) - 10n; }, f: '\\dbinom{10}{2}-10=45-10', p: 'Todos los segmentos menos los 10 lados.' }
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

    function pinta() {
      var c = BANCO[orden[pos]];
      n.innerHTML =
        '<h4 class="mx-title">Applet · Entrenador de problemas</h4>' +
        '<div class="mx-instr">' + BANCO.length + ' problemas del tema, en orden aleatorio. ' +
        'Escribe <b>solo el número</b> de tu resultado (sin puntos ni espacios) y pulsa Comprobar. ' +
        'Ejemplos de respuesta bien escrita: <code>336</code>, <code>13983816</code>. ' +
        'Si te equivocas, verás la fórmula correcta y la pista que te faltaba.</div>' +
        '<div class="ap-kvs">' +
          '<span class="ap-kv">Aciertos: <b>' + aciertos + '</b> de <b>' + intentos + '</b></span>' +
          '<span class="ap-kv">Problema <b>' + (pos + 1) + '</b> de <b>' + BANCO.length + '</b></span>' +
        '</div>' +
        '<div class="ap-enun">' + esc(c.e) + '</div>' +
        '<div class="mx-inputs">' +
          '<label class="mx-field"><span>Tu respuesta (solo el número)</span>' +
            '<input class="mx-in" type="text" inputmode="numeric" id="entResp" value="' + esc(ultima) + '"></label>' +
        '</div>' +
        '<div class="ap-btns">' +
          '<button type="button" class="ap-chip" data-a="comp">Comprobar</button>' +
          '<button type="button" class="ap-chip" data-a="pista">Ver la pista</button>' +
          '<button type="button" class="ap-chip" data-a="sig">Siguiente problema</button>' +
        '</div>' +
        '<div class="mx-out ap-out"></div>';

      var out = n.querySelector('.mx-out');
      var inp = n.querySelector('#entResp');
      out.innerHTML = '<div class="mx-info">Calcula el resultado y escríbelo arriba.</div>';

      n.querySelector('[data-a="comp"]').addEventListener('click', function () {
        var raw = String(inp.value).replace(/[\s.\u2009,]/g, '');
        if (!/^\d+$/.test(raw)) {
          out.innerHTML = '<div class="mx-bad ap-err">Escribe solo cifras, sin puntos ni comas. Por ejemplo: 336</div>';
          return;
        }
        var correcto = c.r();
        var ok = BigInt(raw) === correcto;
        if (!resuelto) { intentos++; if (ok) aciertos++; resuelto = true; }
        ultima = raw;
        out.innerHTML = S.texifica(
          '<div class="' + (ok ? 'ap-ok' : 'ap-ko') + '">' + (ok ? 'Correcto.' : 'No es correcto.') + '</div>' +
          '<div class="mx-info">' + KD(c.f + ' = ' + bigTex(correcto)) + '</div>' +
          '<div class="mx-info"><b>La clave:</b> ' + c.p + '</div>' +
          (ok ? '' : '<div class="mx-info">Tu respuesta fue ' + bigTxt(BigInt(raw)) +
                     ' y la correcta es ' + bigTxt(correcto) + '. Revisa qué fórmula has aplicado.</div>'));
        S.tex(out);
        /* actualiza el marcador sin perder la salida */
        var kv = n.querySelector('.ap-kvs');
        if (kv) kv.innerHTML =
          '<span class="ap-kv">Aciertos: <b>' + aciertos + '</b> de <b>' + intentos + '</b></span>' +
          '<span class="ap-kv">Problema <b>' + (pos + 1) + '</b> de <b>' + BANCO.length + '</b></span>';
      });

      n.querySelector('[data-a="pista"]').addEventListener('click', function () {
        out.innerHTML = '<div class="mx-info"><b>Pista:</b> ' + c.p + '</div>';
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
