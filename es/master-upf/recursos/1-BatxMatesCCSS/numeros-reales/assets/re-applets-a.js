/* =====================================================================
   re-applets-a.js · Tema 1 «Números reales» · 1.º Bachillerato CCSS
   Ruta: 1-BatxMatesCCSS/numeros-reales/assets/re-applets-a.js

   MÓDULO A · apartados 1 a 4:
     1 Números racionales      clasifica, fracDecimal, generatriz, densidad
     2 Números irracionales    irracionales, raizDos, aureo
     3 Reales y recta real     rectaZoom, valorAbsoluto, raicesPitagoras
     4 Intervalos y entornos   intervalos, operaIntervalos, entornos

   Depende del núcleo window.RE (assets/re-applets.js). Sin librerías
   externas, sin OJS, sin CDN: solo JS de navegador.
   ===================================================================== */
(function () {
  'use strict';
  var S = window.RE;
  if (!S) { console.error('[reales] re-applets.js no cargado'); return; }
  var R = S.registry;
  var K = S.K, KD = S.KD, nc = S.nc, kf = S.kf, COL = S.COL;

  /* ==================================================================
     0 · utilidades locales compartidas por los applets del módulo
     ================================================================== */

  /* Detecta si una tira de cifras decimales acaba con un bloque
     repetido al menos tres veces: así distinguimos 0,464646… (que es
     racional) de 0,1010010001… (que no lo es).                        */
  function bloqueRepetido(dec) {
    for (var L = 1; L <= 6; L++) {
      if (dec.length < 3 * L) break;
      var b1 = dec.slice(dec.length - L);
      var b2 = dec.slice(dec.length - 2 * L, dec.length - L);
      var b3 = dec.slice(dec.length - 3 * L, dec.length - 2 * L);
      if (b1 === b2 && b2 === b3) return b1;
    }
    return null;
  }

  /* Pinta una expresión decimal cifra a cifra, marcando el
     anteperiodo y el periodo con las clases del CSS del tema. */
  function cifrasHTML(signo, ent, antip, per, repes) {
    repes = repes || 3;
    var h = '<div class="ap-cifras">';
    h += '<span class="ap-cif">' + (signo < 0 ? '-' : '') + ent + '</span>';
    h += '<span class="ap-cif-sep">,</span>';
    var i;
    for (i = 0; i < antip.length; i++) {
      h += '<span class="ap-cif ap-cif-ante">' + antip.charAt(i) + '</span>';
    }
    if (per) {
      for (var r = 0; r < repes; r++) {
        for (i = 0; i < per.length; i++) {
          h += '<span class="ap-cif ap-cif-per">' + per.charAt(i) + '</span>';
        }
      }
      h += '<span class="ap-cif ap-cif-mudo">…</span>';
    }
    return h + '</div>';
  }

  /* Conjunto numérico mínimo al que pertenece un número escrito por el
     alumno. Devuelve { tex, val, conj, razon, dec }.
     Formatos admitidos: -7 · 24/36 · 0,25 · 1,272727… · 0,1010010001…
     pi · e · phi · sqrt2 · raiz(3)                                    */
  function analiza(t) {
    var bruto = String(t).trim();
    var s = bruto.toLowerCase().replace(/\s/g, '');
    if (!s) throw Error('Hay un número vacío en la lista.');

    /* ¿acaba en puntos suspensivos? */
    var susp = /(\.\.\.|…)$/.test(s);
    if (susp) s = s.replace(/(\.\.\.|…)$/, '');

    var m;

    /* entero */
    if (/^[+-]?\d+$/.test(s)) {
      var z = Number(s);
      return {
        tex: String(z), val: z,
        conj: z >= 0 ? 'N' : 'Z',
        razon: z >= 0 ? 'Es un entero positivo o cero, así que ya está en $\\mathbb{N}$.'
          : 'Es un entero negativo: pertenece a $\\mathbb{Z}$ pero no a $\\mathbb{N}$.'
      };
    }

    /* fracción de enteros */
    if ((m = s.match(/^([+-]?\d+)\/(\d+)$/))) {
      if (Number(m[2]) === 0) throw Error('El denominador de «' + bruto + '» es 0 y eso no define ningún número.');
      var f = new S.Frac(Number(m[1]), Number(m[2]));
      var d = S.decimalDeFraccion(Number(m[1]), Number(m[2]));
      if (f.esEntero()) {
        return {
          tex: '\\dfrac{' + m[1] + '}{' + m[2] + '} = ' + f.txt(), val: f.val(),
          conj: f.val() >= 0 ? 'N' : 'Z',
          razon: 'La fracción se simplifica a un entero, y todo entero es un racional muy particular.'
        };
      }
      return {
        tex: f.tex(), val: f.val(), dec: d,
        conj: 'Q',
        razon: 'Es un cociente de enteros con denominador distinto de 1: su expresión decimal es ' +
          (d.tipo === 'exacto' ? 'exacta' : 'periódica') + '.'
      };
    }

    /* decimal escrito con coma o punto */
    if ((m = s.match(/^([+-]?)(\d+)[.,](\d+)$/))) {
      var sg = m[1] === '-' ? -1 : 1, ente = m[2], deci = m[3];
      if (susp) {
        var blo = bloqueRepetido(deci);
        if (blo) {
          return {
            tex: (sg < 0 ? '-' : '') + ente + '{,}' + deci.slice(0, deci.length - 3 * blo.length) +
              '\\overline{' + blo + '}', val: sg * Number(ente + '.' + deci),
            conj: 'Q',
            razon: 'Las cifras decimales se repiten con periodo $' + blo + '$, y todo decimal periódico se puede escribir como fracción.'
          };
        }
        return {
          tex: (sg < 0 ? '-' : '') + ente + '{,}' + deci + '\\ldots', val: sg * Number(ente + '.' + deci),
          conj: 'I',
          razon: 'Tiene infinitas cifras decimales que no forman ningún periodo, así que no puede escribirse como fracción.'
        };
      }
      var frx = new S.Frac(Number((sg < 0 ? '-' : '') + ente + deci), Math.pow(10, deci.length));
      return {
        tex: (sg < 0 ? '-' : '') + ente + '{,}' + deci, val: sg * Number(ente + '.' + deci),
        conj: 'Q',
        razon: 'Decimal exacto: equivale a la fracción $' + frx.tex(true) + '$.'
      };
    }

    /* raíces cuadradas */
    if ((m = s.match(/^([+-]?)(?:sqrt|raiz|raíz|r)\(?(\d+)\)?$/))) {
      var n = Number(m[2]), neg = m[1] === '-' ? -1 : 1;
      var texr = (neg < 0 ? '-' : '') + '\\sqrt{' + n + '}';
      if (S.esCuadradoPerfecto(n)) {
        var raiz = neg * Math.round(Math.sqrt(n));
        return {
          tex: texr + ' = ' + raiz, val: raiz,
          conj: raiz >= 0 ? 'N' : 'Z',
          razon: 'Cuidado: $' + n + '$ es un cuadrado perfecto, así que la raíz es exacta y el número es entero.'
        };
      }
      return {
        tex: texr, val: neg * Math.sqrt(n),
        conj: 'I',
        razon: 'Como $' + n + '$ no es un cuadrado perfecto, $\\sqrt{' + n + '}$ es irracional.'
      };
    }

    /* constantes célebres */
    if (s === 'pi' || s === 'π') {
      return { tex: '\\pi', val: Math.PI, conj: 'I', razon: 'Es irracional (y además trascendente): no es raíz de ninguna ecuación polinómica de coeficientes enteros.' };
    }
    if (s === 'e') {
      return { tex: 'e', val: Math.E, conj: 'I', razon: 'Es irracional y trascendente; es la base de los logaritmos neperianos.' };
    }
    if (s === 'phi' || s === 'φ' || s === 'aureo' || s === 'áureo') {
      return { tex: '\\varphi', val: (1 + Math.sqrt(5)) / 2, conj: 'I', razon: 'El número de oro vale $\\dfrac{1+\\sqrt{5}}{2}$: es irracional, aunque algebraico, porque aparece un radical no exacto.' };
    }

    throw Error('No entiendo «' + bruto + '». Escribe enteros (-7), fracciones con barra (24/36), ' +
      'decimales con coma (0,25), decimales con puntos suspensivos (1,272727… o 0,1010010001…) ' +
      'o las palabras pi, e, phi, sqrt2, raiz(3).');
  }

  var NOMBRE = { N: 'naturales', Z: 'enteros', Q: 'racionales', I: 'irracionales' };
  var SIMB = { N: '\\mathbb{N}', Z: '\\mathbb{Z}', Q: '\\mathbb{Q}', I: '\\mathbb{I}' };

  /* ==================================================================
     APARTADO 1 · NÚMEROS RACIONALES
     ================================================================== */

  /* ---------------- 1.1 clasifica ---------------------------------- */
  R.clasifica = function (node) {
    S.shell(node, 'Clasificar números reales',
      'Escribe varios números separados por espacios y el applet dice a qué conjunto pertenece cada uno. ' +
      'Formatos admitidos: enteros <code>-7</code>, fracciones con barra <code>24/36</code>, decimales con coma <code>0,25</code>, ' +
      'decimales con puntos suspensivos <code>1,272727…</code> o <code>0,1010010001...</code> y las palabras <code>pi</code>, <code>e</code>, <code>phi</code>, <code>sqrt2</code>, <code>raiz(3)</code>. ' +
      'Ejemplo de entrada: <code>-7 24/36 0,25 sqrt2 pi</code>.',
      [{ id: 'lista', label: 'Números', type: 'text', value: '-7 24/36 0,25 sqrt2 pi', ancho: '340px' },
      {
        type: 'presets', list: [
          { label: '5 0/4 raiz(9) 1,5', apply: function (c) { c.lista.value = '5 0/4 raiz(9) 1,5'; } },
          { label: '1,272727… y 0,1010010001…', apply: function (c) { c.lista.value = '1,272727… 0,1010010001...'; } },
          { label: 'pi e phi', apply: function (c) { c.lista.value = 'pi e phi'; } },
          { label: 'raíces', apply: function (c) { c.lista.value = 'sqrt2 raiz(3) raiz(16) raiz(50)'; } }
        ]
      }],
      function (v) {
        var partes = String(v.lista).trim().split(/\s+/).filter(Boolean);
        if (!partes.length) throw Error('Escribe al menos un número. Ejemplo: -7 24/36 0,25 sqrt2 pi');
        if (partes.length > 8) throw Error('Como máximo 8 números, para que la tabla y la figura se lean bien.');

        var filas = [], puntos = [], cuenta = { N: 0, Z: 0, Q: 0, I: 0 };
        partes.forEach(function (t) {
          var a = analiza(t);
          cuenta[a.conj]++;
          var cadena = a.conj === 'N' ? '\\mathbb{N} \\subset \\mathbb{Z} \\subset \\mathbb{Q} \\subset \\mathbb{R}'
            : a.conj === 'Z' ? '\\mathbb{Z} \\subset \\mathbb{Q} \\subset \\mathbb{R}'
              : a.conj === 'Q' ? '\\mathbb{Q} \\subset \\mathbb{R}' : '\\mathbb{I} \\subset \\mathbb{R}';
          filas.push([
            K(a.tex),
            '<span class="ap-conj"><span class="ap-num-chip n-' + a.conj + '">' + SIMB[a.conj].replace('\\mathbb{', '').replace('}', '') + '</span></span> ' + NOMBRE[a.conj],
            K(cadena),
            nc(a.val, 6),
            a.razon
          ]);
          if (Number.isFinite(a.val) && Math.abs(a.val) < 50) puntos.push({ x: a.val, tex: a.tex, col: a.conj === 'I' ? COL.morado : COL.azul });
        });

        var vals = puntos.map(function (p) { return p.x; });
        var fig = '';
        if (vals.length) {
          var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
          if (hi - lo < 1) { lo -= 1; hi += 1; }
          var marg = (hi - lo) * 0.15;
          fig = S.rectaReal({
            min: lo - marg, max: hi + marg, W: 1000, H: 250, paso: (hi - lo + 2 * marg) / 10, dec: 2,
            puntos: puntos, titulo: 'Todos ellos son números reales: ocupan un punto de la recta',
            cap: 'Los racionales aparecen en azul y los irracionales en morado, pero en la recta real no hay ninguna diferencia visible entre ellos: los dos tipos de número rellenan la recta sin dejar huecos.'
          });
        }

        return S.tabla(['Número', 'Conjunto mínimo', 'Cadena de inclusiones', 'Valor aproximado', 'Por qué'], filas) +
          S.kvs(['Naturales: <b>' + cuenta.N + '</b>', 'Enteros no naturales: <b>' + cuenta.Z + '</b>',
            'Racionales no enteros: <b>' + cuenta.Q + '</b>', 'Irracionales: <b>' + cuenta.I + '</b>']) +
          fig +
          '<div class="mx-info">Recuerda la cadena $\\mathbb{N} \\subset \\mathbb{Z} \\subset \\mathbb{Q} \\subset \\mathbb{R}$ y que $\\mathbb{I} = \\mathbb{R} - \\mathbb{Q}$. ' +
          'Un número irracional nunca es racional, pero sí es real.</div>';
      });
  };

  /* ---------------- 1.2 fracDecimal ------------------------------- */
  R.fracDecimal = function (node) {
    S.shell(node, 'De fracción a decimal',
      'Escribe el numerador y el denominador y el applet hace la división entera paso a paso, detecta el periodo y clasifica la expresión decimal. ' +
      'Formato de entrada: dos números enteros, uno en cada casilla. Ejemplo: numerador <code>7</code> y denominador <code>12</code> dan $0{,}58\\overline{3}$.',
      [{ id: 'a', label: 'Numerador', type: 'number', value: 7, min: -9999, max: 9999 },
      { id: 'b', label: 'Denominador', type: 'number', value: 12, min: 1, max: 9999 },
      { id: 'ver', label: 'Ver la división larga', type: 'check', value: true },
      {
        type: 'presets', list: [
          { label: '3/8 exacto', title: 'Denominador con solo factores 2', apply: function (c) { c.a.value = 3; c.b.value = 8; } },
          { label: '1/7 periódico puro', apply: function (c) { c.a.value = 1; c.b.value = 7; } },
          { label: '7/12 periódico mixto', apply: function (c) { c.a.value = 7; c.b.value = 12; } },
          { label: '1/11', apply: function (c) { c.a.value = 1; c.b.value = 11; } },
          { label: '11/400', apply: function (c) { c.a.value = 11; c.b.value = 400; } },
          { label: '1/47', title: 'Periodo muy largo', apply: function (c) { c.a.value = 1; c.b.value = 47; } }
        ]
      }],
      function (v) {
        var a = S.entero(v.a, -99999, 99999, 'El numerador');
        var b = S.entero(v.b, 1, 99999, 'El denominador');
        var f = new S.Frac(a, b);                      /* representante canónico */
        var num = Number(f.n), den = Number(f.d);
        var d = S.decimalDeFraccion(a, b, 60);

        /* Criterio de clasificación: se mira el denominador YA simplificado */
        var fac = S.factoriza(den);
        var soloDosCinco = fac.every(function (p) { return p[0] === 2 || p[0] === 5; });
        var otros = fac.filter(function (p) { return p[0] !== 2 && p[0] !== 5; })
          .map(function (p) { return p[0]; });

        var etiqueta = d.tipo === 'entero' ? 'número entero'
          : d.tipo === 'exacto' ? 'decimal exacto'
            : d.tipo === 'puro' ? 'decimal periódico puro'
              : d.tipo === 'mixto' ? 'decimal periódico mixto' : 'decimal con muchísimas cifras';
        var clase = d.tipo === 'exacto' || d.tipo === 'entero' ? 'si' : 'info';

        var h = S.resultado(K(S.decimalTex(d)), 'expresión decimal de $' + f.tex(true) + '$');
        h += S.kvs([
          'Representante canónico: $' + f.tex(true) + '$',
          'Tipo: ' + S.badge(etiqueta, clase),
          'Anteperiodo: <b>' + (d.antip || '—') + '</b>',
          'Periodo: <b>' + (d.per || '—') + '</b>',
          'Longitud del periodo: <b>' + (d.per ? d.per.length : 0) + '</b>'
        ]);
        h += cifrasHTML(d.signo, d.ent, d.antip, d.per, d.per ? Math.max(2, Math.ceil(6 / d.per.length)) : 0);

        h += S.paso(1, 'Se simplifica la fracción hasta el <b>representante canónico</b>: $\\dfrac{' + a + '}{' + b +
          '} = ' + f.tex(true) + '$. El tipo de decimal depende solo de este denominador irreducible.', 'ap-paso-clave');
        h += S.paso(2, 'Se factoriza el denominador: $' + den + ' = ' + (fac.length ? S.factorizaTex(den) : '1') + '$.');
        h += S.paso(3, soloDosCinco
          ? 'Solo aparecen los factores $2$ y $5$, los mismos que forman $10$. Por eso la división termina: la expresión decimal es <b>exacta</b>.'
          : 'Aparece el factor primo ' + otros.join(' y ') + ', que no divide a ninguna potencia de $10$. Por eso la división nunca termina: la expresión decimal es <b>periódica</b>.',
          'ap-paso-clave');
        if (d.per) {
          h += S.paso(4, d.tipo === 'puro'
            ? 'El periodo empieza justo detrás de la coma, así que es <b>periódico puro</b>: $' + S.decimalTex(d) + '$.'
            : 'Delante del periodo quedan las cifras $' + d.antip + '$ (el <b>anteperiodo</b>), así que es <b>periódico mixto</b>: $' + S.decimalTex(d) + '$.');
          h += S.paso(5, 'El periodo tiene como máximo $' + (den - 1) + '$ cifras: los restos posibles al dividir entre $' + den +
            '$ son $1, 2, \\ldots, ' + (den - 1) + '$, y en cuanto se repite un resto se repite todo el bloque de cifras.');
        }

        if (v.ver && d.pasos.length) {
          var filas = d.pasos.slice(0, 14).map(function (p, i) {
            return { celdas: [String(i + 1), K(String(p.resto)), K(p.resto + ' \\cdot 10 = ' + p.num), K(String(p.cifra)), K(String(p.nuevo))] };
          });
          h += '<div class="mx-info">División larga: en cada fila se añade un cero al resto, se divide entre ' + den +
            ' y el resto nuevo pasa a la fila siguiente. Cuando un resto se repite, se repite el periodo.</div>';
          h += S.tabla(['Paso', 'Resto', 'Se baja un cero', 'Cifra decimal', 'Resto nuevo'], filas);
          if (d.pasos.length > 14) h += '<div class="mx-info">Se muestran las 14 primeras filas de ' + d.pasos.length + '.</div>';
        }
        return h;
      });
  };

  /* ---------------- 1.3 generatriz -------------------------------- */
  R.generatriz = function (node) {
    S.shell(node, 'Fracción generatriz',
      'Descompón la expresión decimal en tres trozos y el applet reconstruye la fracción con la regla general. ' +
      'Formato de entrada: la <b>parte entera</b> es un número; el <b>anteperiodo</b> y el <b>periodo</b> son tiras de cifras (déjalos vacíos si no hay). ' +
      'Ejemplo: para $2{,}58\\overline{3}$ escribe parte entera <code>2</code>, anteperiodo <code>58</code> y periodo <code>3</code>.',
      [{ id: 'sg', label: 'Signo', type: 'select', value: '1', options: [{ value: '1', label: '+' }, { value: '-1', label: '−' }] },
      { id: 'ent', label: 'Parte entera', type: 'number', value: 2, min: 0, max: 99999 },
      { id: 'ant', label: 'Anteperiodo', type: 'text', value: '58', place: 'cifras o vacío', ancho: '130px' },
      { id: 'per', label: 'Periodo', type: 'text', value: '3', place: 'cifras o vacío', ancho: '130px' },
      {
        type: 'presets', list: [
          { label: '0,4747…', apply: function (c) { c.sg.value = '1'; c.ent.value = 0; c.ant.value = ''; c.per.value = '47'; } },
          { label: '8,35 exacto', apply: function (c) { c.sg.value = '1'; c.ent.value = 8; c.ant.value = '35'; c.per.value = ''; } },
          { label: '9,464646…', apply: function (c) { c.sg.value = '1'; c.ent.value = 9; c.ant.value = ''; c.per.value = '46'; } },
          { label: '0,999…', title: 'El resultado sorprende', apply: function (c) { c.sg.value = '1'; c.ent.value = 0; c.ant.value = ''; c.per.value = '9'; } },
          { label: '3,267123123…', apply: function (c) { c.sg.value = '1'; c.ent.value = 3; c.ant.value = '267'; c.per.value = '123'; } },
          { label: '−1,5999…', apply: function (c) { c.sg.value = '-1'; c.ent.value = 1; c.ant.value = '5'; c.per.value = '9'; } }
        ]
      }],
      function (v) {
        var sg = Number(v.sg) < 0 ? -1 : 1;
        var ent = S.entero(v.ent, 0, 999999, 'La parte entera');
        var ant = String(v.ant || '').replace(/\s/g, '');
        var per = String(v.per || '').replace(/\s/g, '');
        if (!/^\d*$/.test(ant)) throw Error('El anteperiodo solo puede contener cifras del 0 al 9, sin coma ni signos. Ejemplo: 58');
        if (!/^\d*$/.test(per)) throw Error('El periodo solo puede contener cifras del 0 al 9, sin coma ni signos. Ejemplo: 3');
        if (ant.length + per.length > 9) throw Error('Usa como máximo 9 cifras entre el anteperiodo y el periodo.');

        var h, sig = sg < 0 ? '-' : '';
        var texNum = sig + ent + (ant || per ? '{,}' + ant + (per ? '\\overline{' + per + '}' : '') : '');
        h = S.resultado(K(texNum), 'expresión decimal de partida');
        h += cifrasHTML(sg, ent, ant, per, per ? 3 : 0);

        if (!per) {
          /* decimal exacto: se multiplica por la potencia de 10 justa */
          if (!ant) {
            var fe = new S.Frac(sg * ent, 1);
            return h + S.paso(1, 'No hay parte decimal: el número ya es entero, $' + fe.tex(true) + '$.') +
              '<div class="mx-info">Todo entero es racional: se escribe con denominador $1$.</div>';
          }
          var p10 = Math.pow(10, ant.length);
          var fx = new S.Frac(Number(sig + String(ent) + ant), p10);
          h += S.paso(1, 'Se llama $x = ' + texNum + '$. Como hay $' + ant.length + '$ cifras decimales, se multiplica por $10^{' + ant.length + '} = ' + p10 + '$:');
          h += S.paso(2, '$' + p10 + 'x = ' + sig + ent + ant + '$, de donde $x = \\dfrac{' + sig + ent + ant + '}{' + p10 + '}$.');
          h += S.paso(3, 'Se simplifica dividiendo por el máximo común divisor: ' +
            '$\\text{m.c.d.}(' + Math.abs(Number(String(ent) + ant)) + ', ' + p10 + ') = ' + S.mcd(Number(String(ent) + ant), p10) + '$.', 'ap-paso-clave');
          h += KD('x = ' + fx.tex() + (fx.esEntero() ? '' : ' = ' + kf(fx.val(), 8)));
          return h + '<div class="mx-info">Regla rápida para los decimales exactos: en el numerador va el número sin la coma; en el denominador, un $1$ seguido de tantos ceros como cifras decimales haya.</div>';
        }

        /* periódico puro o mixto: fórmula general */
        var g = S.fraccionDeDecimal(sg, ent, ant, per);
        var nueves = '9'.repeat(per.length), ceros = '0'.repeat(ant.length);
        var k1 = ant.length + per.length, k2 = ant.length;

        h += S.paso(1, 'Se llama $x = ' + texNum + '$ y se busca multiplicar por dos potencias de $10$ que dejen <b>la misma cola decimal</b>.');
        h += S.paso(2, 'Multiplicando por $10^{' + k1 + '}$ el periodo queda justo detrás de la coma: $10^{' + k1 + '}x = ' +
          sig + g.todo + '{,}\\overline{' + per + '}$.');
        h += S.paso(3, ant.length
          ? 'Multiplicando por $10^{' + k2 + '}$ se dejan fuera solo las cifras del anteperiodo: $10^{' + k2 + '}x = ' + sig + g.sin + '{,}\\overline{' + per + '}$.'
          : 'Multiplicando por $10^{0} = 1$ se deja el número tal cual: $x = ' + sig + g.sin + '{,}\\overline{' + per + '}$.');
        h += S.paso(4, 'Al restar, las infinitas cifras decimales se cancelan porque son idénticas:', 'ap-paso-clave');
        h += KD('(10^{' + k1 + '} - 10^{' + k2 + '})\\,x = ' + sig + g.todo + ' - ' + (sg < 0 ? '(' + sig + g.sin + ')' : g.sin) +
          ' = ' + sig + g.num);
        h += S.paso(5, 'Y como $10^{' + k1 + '} - 10^{' + k2 + '} = ' + nueves + ceros + '$, queda directamente la <b>fracción generatriz</b>:');
        h += KD('x = \\dfrac{' + sig + g.todo + ' - ' + g.sin + '}{' + nueves + ceros + '} = \\dfrac{' + sig + g.num + '}{' + g.den + '} = ' + g.frac.tex());
        h += S.paso(6, 'Comprobación: al dividir de nuevo se recupera la expresión decimal de partida.');

        var comp = S.decimalDeFraccion(Number(g.frac.n), Number(g.frac.d), 40);
        /* Comprobación numérica: se reconstruye el decimal con el periodo
           repetido varias veces y se compara con el valor de la fracción. */
        var esperado = sg * (ent + Number('0.' + ant + per + per + per + per));
        var iguales = Math.abs(g.frac.val() - esperado) < 1e-5;
        h += S.resultado(K(g.frac.tex()), 'fracción generatriz irreducible') +
          S.kvs(['Vuelta al decimal: $' + S.decimalTex(comp) + '$',
            'Valor: <b>' + nc(g.frac.val(), 8) + '</b>',
            iguales ? S.badge('coincide', 'si') : S.badge('revisa las cifras', 'avi')]);
        h += '<div class="mx-info">Regla general: <b>numerador</b> = (todas las cifras hasta acabar el periodo) − (las cifras hasta acabar el anteperiodo); ' +
          '<b>denominador</b> = tantos $9$ como cifras tiene el periodo, seguidos de tantos $0$ como cifras tiene el anteperiodo.</div>';
        if (per === '9' && !ant) h += '<div class="mx-info">Prueba con $0{,}\\overline{9}$: la fracción da exactamente $1$. No es un error ni una aproximación: ' +
          'las dos expresiones decimales nombran el mismo punto de la recta.</div>';
        return h;
      });
  };

  /* ---------------- 1.4 densidad ---------------------------------- */
  R.densidad = function (node) {
    S.shell(node, 'Densidad de los racionales',
      'Elige dos números y el applet fabrica cuantos números quieras entre ellos, primero con el punto medio y luego con la media aritmética repetida. ' +
      'Formato de entrada: en cada casilla, un entero, un decimal con coma o una fracción con barra. También valen <code>pi</code>, <code>e</code>, <code>sqrt2</code>. ' +
      'Ejemplo: <code>1/3</code> y <code>2/5</code>.',
      [{ id: 'a', label: 'Primer número', type: 'text', value: '1/3', ancho: '150px' },
      { id: 'b', label: 'Segundo número', type: 'text', value: '2/5', ancho: '150px' },
      { id: 'n', label: 'Cuántos intermedios', type: 'range', value: 4, min: 1, max: 7 },
      {
        type: 'presets', list: [
          { label: '0 y 1', apply: function (c) { c.a.value = '0'; c.b.value = '1'; } },
          { label: '1,41 y sqrt2', apply: function (c) { c.a.value = '1,41'; c.b.value = 'sqrt2'; } },
          { label: '3,14 y pi', apply: function (c) { c.a.value = '3,14'; c.b.value = 'pi'; } },
          { label: '7/10 y 71/100', apply: function (c) { c.a.value = '7/10'; c.b.value = '71/100'; } }
        ]
      }],
      function (v) {
        var A = S.valorSimbolico(v.a), B = S.valorSimbolico(v.b);
        if (A.v === B.v) throw Error('Los dos números son iguales: entre un número y él mismo no hay nada. Cambia uno de los dos, por ejemplo 1/3 y 2/5.');
        var a = Math.min(A.v, B.v), b = Math.max(A.v, B.v);
        var n = S.entero(v.n, 1, 7, 'La cantidad de números intermedios');

        /* Método de la media reiterada: cada paso vuelve a partir por la mitad */
        var lista = [], izq = a, der = b;
        for (var i = 0; i < n; i++) {
          var m = (izq + der) / 2;
          lista.push(m);
          der = m;                                    /* nos acercamos a a */
        }

        var filas = lista.map(function (m, i) {
          return [String(i + 1), K(kf(m, 10)), K(kf(m - a, 10)), i === 0 ? 'punto medio de los dos extremos' : 'punto medio entre el número anterior y el extremo izquierdo'];
        });

        var puntos = [{ x: a, tex: 'a', col: COL.azulOsc }, { x: b, tex: 'b', col: COL.azulOsc }];
        lista.forEach(function (m, i) { puntos.push({ x: m, tex: 'm_{' + (i + 1) + '}', col: COL.rojo, arriba: i % 2 === 0 }); });

        var fig = S.rectaReal({
          min: a - (b - a) * 0.25, max: b + (b - a) * 0.25, W: 1050, H: 300,
          paso: (b - a) * 1.5 / 10, dec: Math.max(2, Math.min(8, Math.ceil(-Math.log10(b - a)) + 3)),
          tramos: [{ a: a, b: b, col: 'rgba(25,118,210,.18)', alto: 22 }],
          puntos: puntos,
          titulo: 'Entre dos números reales distintos caben infinitos números',
          cap: 'Cada punto rojo es la media aritmética del anterior con el extremo izquierdo. El proceso no termina nunca: por eso se dice que $\\mathbb{Q}$ y $\\mathbb{R}$ son <b>densos</b>.'
        });

        /* Un racional y un irracional concretos entre a y b */
        var rac = null, den = 1;
        for (var d = 1; d <= 100000 && rac === null; d *= 10) {
          var cand = Math.ceil(a * d + 1) / d;
          if (cand > a && cand < b) { rac = new S.Frac(Math.ceil(a * d + 1), d); den = d; }
        }
        var irr = a + (b - a) / Math.SQRT2;

        return S.resultado(K(kf((a + b) / 2, 10)), 'punto medio $\\dfrac{a+b}{2}$ de $' + A.tex + '$ y $' + B.tex + '$') +
          S.kvs(['$a = ' + A.tex + ' \\approx ' + kf(a, 8) + '$', '$b = ' + B.tex + ' \\approx ' + kf(b, 8) + '$',
            'Distancia: $b - a \\approx ' + kf(b - a, 10) + '$']) +
          S.tabla(['Paso', 'Número intermedio', 'Distancia al extremo izquierdo', 'Cómo se ha obtenido'], filas) +
          fig +
          S.paso(1, 'Si $a < b$, la media cumple siempre $a < \\dfrac{a+b}{2} < b$: basta sumar $a$ y $b$ a las dos partes de la desigualdad y dividir entre 2.', 'ap-paso-clave') +
          S.paso(2, 'El proceso se puede repetir sobre cualquiera de los dos trozos, así que <b>no hay dos números reales pegados</b>: entre dos cualesquiera hay infinitos.') +
          S.paso(3, (rac ? 'Un racional del intervalo: $' + rac.tex(true) + ' \\approx ' + kf(rac.val(), 8) + '$. ' : '') +
            'Un irracional del intervalo: $a + \\dfrac{b-a}{\\sqrt{2}} \\approx ' + kf(irr, 10) + '$, porque al sumar a un racional un irracional pequeño el resultado sigue siendo irracional.') +
          '<div class="mx-info">Consecuencia importante: no existe «el número siguiente» a $\\dfrac{1}{2}$ en $\\mathbb{Q}$ ni en $\\mathbb{R}$. En $\\mathbb{Z}$ sí, es el $\\ldots$ bueno, el siguiente de $3$ es $4$; en $\\mathbb{R}$ la pregunta no tiene respuesta.</div>';
      });
  };

  /* ==================================================================
     APARTADO 2 · NÚMEROS IRRACIONALES
     ================================================================== */

  var BASES = [
    { value: 'sqrt2', label: '√2', tex: '\\sqrt{2}', val: Math.SQRT2 },
    { value: 'sqrt3', label: '√3', tex: '\\sqrt{3}', val: Math.sqrt(3) },
    { value: 'sqrt5', label: '√5', tex: '\\sqrt{5}', val: Math.sqrt(5) },
    { value: 'pi', label: 'π', tex: '\\pi', val: Math.PI },
    { value: 'e', label: 'e', tex: 'e', val: Math.E },
    { value: 'phi', label: 'φ', tex: '\\varphi', val: (1 + Math.sqrt(5)) / 2 }
  ];
  function baseDe(v) {
    for (var i = 0; i < BASES.length; i++) if (BASES[i].value === v) return BASES[i];
    return BASES[0];
  }

  /* Reglas de formación: fabrican decimales infinitos no periódicos */
  function cifrasRegla(regla, cuantas) {
    var s = '', k = 1;
    if (regla === 'naturales') { while (s.length < cuantas) { s += String(k); k++; } }
    else if (regla === 'pares') { while (s.length < cuantas) { s += String(2 * k); k++; } }
    else if (regla === 'impares') { while (s.length < cuantas) { s += String(2 * k - 1); k++; } }
    else if (regla === 'unos') { while (s.length < cuantas) { s += '1' + '0'.repeat(k); k++; } }
    else { /* cuadrados */ while (s.length < cuantas) { s += String(k * k); k++; } }
    return s.slice(0, cuantas);
  }
  var TEXTOREGLA = {
    naturales: 'detrás de la coma se escriben todos los números naturales seguidos',
    pares: 'detrás de la coma se escriben todos los números pares seguidos',
    impares: 'detrás de la coma se escriben todos los números impares seguidos',
    unos: 'detrás de la coma va un 1, luego un 1 con un cero, luego un 1 con dos ceros…',
    cuadrados: 'detrás de la coma se escriben los cuadrados 1, 4, 9, 16, 25…'
  };

  /* ---------------- 2.1 irracionales ------------------------------ */
  R.irracionales = function (node) {
    S.shell(node, 'Fabricar números irracionales',
      'Elige un método y el applet construye un número irracional y explica por qué lo es. ' +
      'Formato de entrada: el <b>número racional</b> se escribe como entero, decimal con coma o fracción con barra (<code>3</code>, <code>-1,5</code>, <code>7/4</code>); ' +
      'el <b>radicando</b> es un número natural. Ejemplo: método «suma», racional <code>1</code> y base <code>√5</code> dan $1+\\sqrt{5}$.',
      [{
        id: 'modo', label: 'Método', type: 'select', value: 'suma', options: [
          { value: 'suma', label: 'racional + irracional' },
          { value: 'producto', label: 'racional · irracional' },
          { value: 'raiz', label: 'raíz cuadrada no exacta' },
          { value: 'regla', label: 'regla de formación de cifras' }]
      },
      { id: 'a', label: 'Número racional', type: 'text', value: '1', ancho: '120px' },
      {
        id: 'base', label: 'Irracional de partida', type: 'select', value: 'sqrt5',
        options: BASES.map(function (b) { return { value: b.value, label: b.label }; })
      },
      { id: 'n', label: 'Radicando', type: 'number', value: 50, min: 2, max: 9999 },
      {
        id: 'regla', label: 'Regla', type: 'select', value: 'naturales', options: [
          { value: 'naturales', label: 'todos los naturales' },
          { value: 'pares', label: 'todos los pares' },
          { value: 'impares', label: 'todos los impares' },
          { value: 'unos', label: 'unos separados por ceros' },
          { value: 'cuadrados', label: 'cuadrados perfectos' }]
      },
      {
        type: 'presets', list: [
          { label: '(1+√5)/2', apply: function (c) { c.modo.value = 'suma'; c.a.value = '1'; c.base.value = 'sqrt5'; } },
          { label: '3·√5', apply: function (c) { c.modo.value = 'producto'; c.a.value = '3'; c.base.value = 'sqrt5'; } },
          { label: '2 − π', apply: function (c) { c.modo.value = 'suma'; c.a.value = '2'; c.base.value = 'pi'; } },
          { label: '√50', apply: function (c) { c.modo.value = 'raiz'; c.n.value = 50; } },
          { label: '√49 (trampa)', apply: function (c) { c.modo.value = 'raiz'; c.n.value = 49; } },
          { label: '0,1234567891011…', apply: function (c) { c.modo.value = 'regla'; c.regla.value = 'naturales'; } }
        ]
      }],
      function (v) {
        var h = '';
        if (v.modo === 'raiz') {
          var n = S.entero(v.n, 2, 999999, 'El radicando');
          var perf = S.esCuadradoPerfecto(n);
          h += S.resultado(K('\\sqrt{' + n + '}'), perf ? 'raíz exacta: es un número entero' : 'raíz no exacta: número irracional');
          h += S.kvs(['Valor aproximado: <b>' + nc(Math.sqrt(n), 10) + '</b>',
            'Factorización: $' + n + ' = ' + S.factorizaTex(n) + '$',
          perf ? S.badge('racional', 'no') : S.badge('irracional', 'si')]);
          if (perf) {
            h += S.paso(1, 'Al factorizar, <b>todos</b> los exponentes son pares, así que la raíz es exacta: $\\sqrt{' + n + '} = ' + Math.round(Math.sqrt(n)) + '$, un número entero.', 'ap-paso-avi');
            h += '<div class="mx-info">Error frecuente: dar por irracional cualquier número con el símbolo de raíz. $\\sqrt{49}$, $\\sqrt{0{,}25}$ o $\\sqrt{\\dfrac{9}{16}}$ son racionales.</div>';
          } else {
            var impar = S.factoriza(n).filter(function (p) { return p[1] % 2 === 1; });
            h += S.paso(1, 'Se factoriza el radicando: $' + n + ' = ' + S.factorizaTex(n) + '$.');
            h += S.paso(2, 'El primo $' + impar[0][0] + '$ aparece con exponente <b>impar</b> ($' + impar[0][1] +
              '$), así que no se puede repartir en dos mitades iguales: la raíz no es exacta.', 'ap-paso-clave');
            h += S.paso(3, 'Regla general: si $n$ es un número natural que <b>no</b> es cuadrado perfecto, entonces $\\sqrt{n}$ es irracional.');
            var sr = S.simplificaRadical(n, 2, 1);
            if (sr.fuera !== 1) h += S.paso(4, 'Se puede extraer factores: $\\sqrt{' + n + '} = ' + S.radTex(sr.fuera, 2, sr.dentro) +
              '$, pero sigue quedando una raíz no exacta dentro.');
          }
          return h;
        }

        if (v.modo === 'regla') {
          var cif = cifrasRegla(v.regla, 40);
          h += S.resultado(K('0{,}' + cif.slice(0, 26) + '\\ldots'), 'número irracional construido con una regla');
          h += cifrasHTML(1, 0, cif.slice(0, 30), '', 0);
          h += S.paso(1, 'Regla usada: ' + TEXTOREGLA[v.regla] + '.');
          h += S.paso(2, 'Las cifras siguen para siempre y <b>nunca</b> se repite un bloque fijo, porque los números que se van escribiendo son cada vez más largos.', 'ap-paso-clave');
          h += S.paso(3, 'Al no haber periodo, el número no puede escribirse como fracción: es irracional.');
          h += S.tabla(['Regla', 'Número', 'Primeras cifras'],
            Object.keys(TEXTOREGLA).map(function (k2) {
              return [k2, K('0{,}' + cifrasRegla(k2, 18) + '\\ldots'), TEXTOREGLA[k2]];
            }));
          h += '<div class="mx-info">Con este método se construyen tantos irracionales como se quiera: basta inventar una regla que no acabe repitiéndose.</div>';
          return h;
        }

        /* suma y producto de racional por irracional */
        var A = S.valorSimbolico(v.a);
        var b = baseDe(v.base);
        var suma = v.modo === 'suma';
        var val = suma ? A.v + b.val : A.v * b.val;
        var texop = suma ? A.tex + ' + ' + b.tex : (A.tex === '1' ? b.tex : A.tex + ' \\cdot ' + b.tex);
        var cero = !suma && A.v === 0;

        h += S.resultado(K(texop + ' \\approx ' + kf(val, 10)), cero ? 'atención: el producto por 0 es racional' : 'número irracional');
        h += S.kvs(['Racional: $' + A.tex + '$', 'Irracional: $' + b.tex + ' \\approx ' + kf(b.val, 10) + '$',
        cero ? S.badge('racional', 'no') : S.badge('irracional', 'si')]);
        if (cero) {
          h += S.paso(1, 'Cuidado con el caso $0 \\cdot ' + b.tex + ' = 0$: el $0$ es racional. La regla del producto exige que el racional sea <b>distinto de cero</b>.', 'ap-paso-avi');
          return h;
        }
        h += S.paso(1, 'Suponemos lo contrario: que $' + texop + '$ fuera racional, digamos igual a un número $r \\in \\mathbb{Q}$.');
        h += S.paso(2, suma
          ? 'Entonces $' + b.tex + ' = r - ' + A.tex + '$, y la resta de dos racionales es racional.'
          : 'Entonces $' + b.tex + ' = \\dfrac{r}{' + A.tex + '}$, y el cociente de dos racionales (con denominador no nulo) es racional.');
        h += S.paso(3, 'Pero $' + b.tex + '$ es irracional: contradicción. Por tanto $' + texop + '$ <b>no</b> es racional.', 'ap-paso-clave');
        h += S.paso(4, 'Reglas de formación que se usan constantemente: si $a \\in \\mathbb{Q}$ y $b \\in \\mathbb{I}$, entonces $a + b \\in \\mathbb{I}$, $a - b \\in \\mathbb{I}$, ' +
          'y si además $a \\neq 0$, también $a \\cdot b \\in \\mathbb{I}$ y $\\dfrac{b}{a} \\in \\mathbb{I}$.');
        h += S.tabla(['Operación', 'Resultado', 'Ejemplo'],
          [['racional + irracional', S.badge('siempre irracional', 'si'), K('2 + \\sqrt{3}')],
          ['racional (no nulo) · irracional', S.badge('siempre irracional', 'si'), K('3\\sqrt{5}')],
          ['irracional + irracional', S.badge('puede ser cualquiera', 'avi'), K('\\sqrt{2} + (-\\sqrt{2}) = 0')],
          ['irracional · irracional', S.badge('puede ser cualquiera', 'avi'), K('\\sqrt{2} \\cdot \\sqrt{2} = 2')],
          ['irracional al cuadrado', S.badge('puede ser cualquiera', 'avi'), K('(\\sqrt[4]{2})^{2} = \\sqrt{2}')]]);
        h += '<div class="mx-info">Fíjate en la asimetría: mezclar un racional con un irracional siempre da irracional, pero mezclar dos irracionales no garantiza nada.</div>';
        return h;
      });
  };

  /* ---------------- 2.2 raizDos ----------------------------------- */
  R.raizDos = function (node) {
    S.shell(node, 'La irracionalidad de la raíz de 2',
      'El applet reconstruye la demostración por reducción al absurdo y te deja intentar encontrar una fracción que dé la raíz exacta. ' +
      'Formato de entrada: el <b>radicando</b> es un número natural mayor que 1 y el <b>denominador de prueba</b> es un natural. ' +
      'Ejemplo: radicando <code>2</code> y denominador <code>70</code> dan la fracción $99/70$, que casi acierta pero no.',
      [{ id: 'n', label: 'Radicando', type: 'number', value: 2, min: 2, max: 999 },
      { id: 'q', label: 'Denominador de prueba', type: 'number', value: 70, min: 1, max: 100000 },
      {
        type: 'presets', list: [
          { label: '√2 con q = 5', apply: function (c) { c.n.value = 2; c.q.value = 5; } },
          { label: '√2 con q = 408', apply: function (c) { c.n.value = 2; c.q.value = 408; } },
          { label: '√3', apply: function (c) { c.n.value = 3; c.q.value = 71; } },
          { label: '√7', apply: function (c) { c.n.value = 7; c.q.value = 100; } },
          { label: '√9 (sí es exacta)', apply: function (c) { c.n.value = 9; c.q.value = 1; } }
        ]
      },
      {
        type: 'button', id: 'otro', label: 'otro denominador', click: function (ctl) {
          ctl.q.value = 2 + Math.floor(Math.random() * 900);
        }
      }],
      function (v) {
        var n = S.entero(v.n, 2, 999999, 'El radicando');
        var q = S.entero(v.q, 1, 1000000, 'El denominador de prueba');
        var perf = S.esCuadradoPerfecto(n);
        var raiz = Math.sqrt(n);
        var h = '';

        /* Intento del alumno: la mejor fracción con ese denominador */
        var p = Math.round(raiz * q);
        var izq = p * p, der = n * q * q;
        h += S.resultado(K('\\sqrt{' + n + '} \\approx \\dfrac{' + p + '}{' + q + '} = ' + kf(p / q, 10)),
          'mejor fracción de denominador $' + q + '$');
        h += S.kvs(['$p^2 = ' + S.milTex(izq) + '$', '$' + n + 'q^2 = ' + S.milTex(der) + '$',
          'Diferencia: $' + S.milTex(Math.abs(izq - der)) + '$',
        izq === der ? S.badge('¡igualdad exacta!', 'si') : S.badge('nunca son iguales', 'no'),
          'Error: $' + kf(Math.abs(p / q - raiz), 12) + '$']);

        if (perf) {
          h += S.paso(1, '$' + n + '$ es un cuadrado perfecto, así que $\\sqrt{' + n + '} = ' + Math.round(raiz) +
            '$ es un número entero y sí se puede escribir como fracción. Cambia el radicando por uno que no sea cuadrado perfecto (2, 3, 5, 6, 7, 8, 10…) para ver la demostración.', 'ap-paso-avi');
          return h;
        }

        /* Aproximaciones racionales cada vez mejores */
        var apr = S.raizContinua(raiz, 7);
        h += S.tabla(['Fracción', 'Valor', 'Cuadrado de la fracción', 'Error'],
          apr.map(function (a) {
            return [K('\\dfrac{' + a.p + '}{' + a.q + '}'), K(kf(a.val, 10)),
              K('\\dfrac{' + S.milTex(a.p * a.p) + '}{' + S.milTex(a.q * a.q) + '} = ' + kf(a.p * a.p / (a.q * a.q), 10)),
              K(kf(a.err, 12))];
          }));
        h += '<div class="mx-info">Las fracciones se acercan tanto como quieras, pero ninguna acierta: el cuadrado se queda siempre un poco por encima o un poco por debajo de $' + n + '$.</div>';

        if (n === 2) {
          h += S.paso(1, 'Se supone lo contrario de lo que se quiere probar: que $\\sqrt{2}$ <b>sí</b> es racional. Entonces se puede escribir $\\sqrt{2} = \\dfrac{p}{q}$ con $p$ y $q$ enteros, $q \\neq 0$ y la fracción <b>irreducible</b> (ya simplificada).');
          h += S.paso(2, 'Elevando al cuadrado: $2 = \\dfrac{p^2}{q^2}$, es decir $p^2 = 2q^2$.');
          h += S.paso(3, 'Luego $p^2$ es par. Y si el cuadrado de un número es par, el número también lo es (el cuadrado de un impar es impar). Así que $p$ es par: $p = 2k$.', 'ap-paso-clave');
          h += S.paso(4, 'Sustituyendo: $(2k)^2 = 2q^2 \\Rightarrow 4k^2 = 2q^2 \\Rightarrow q^2 = 2k^2$. Con el mismo razonamiento, $q$ también es par.');
          h += S.paso(5, 'Contradicción: $p$ y $q$ son los dos pares, así que la fracción $\\dfrac{p}{q}$ se podía simplificar por $2$, y habíamos supuesto que era irreducible.', 'ap-paso-clave');
          h += S.paso(6, 'La suposición inicial es imposible. Por tanto $\\sqrt{2}$ <b>no</b> es racional: es irracional.');
        } else {
          var impares = S.factoriza(n).filter(function (x) { return x[1] % 2 === 1; });
          var t = impares[0][0], et = impares[0][1];
          h += S.paso(1, 'Se supone que $\\sqrt{' + n + '} = \\dfrac{p}{q}$ con la fracción irreducible. Elevando al cuadrado, $p^2 = ' + n + 'q^2$.');
          h += S.paso(2, 'Se factoriza el radicando: $' + n + ' = ' + S.factorizaTex(n) + '$. El primo $' + t + '$ aparece con exponente impar $' + et + '$.');
          h += S.paso(3, 'En un cuadrado como $p^2$ o $q^2$, <b>todos</b> los exponentes de la factorización son pares.', 'ap-paso-clave');
          h += S.paso(4, 'Pero en $' + n + 'q^2$ el exponente de $' + t + '$ es impar más par, es decir <b>impar</b>. Y en $p^2$ es par. Dos factorizaciones del mismo número no pueden discrepar: contradicción.');
          h += S.paso(5, 'Por tanto $\\sqrt{' + n + '}$ es irracional. El mismo argumento vale para la raíz de cualquier natural que no sea cuadrado perfecto.');
        }

        /* Figura: el cuadrado unidad y su diagonal llevada a la recta */
        var W = 1020, H = 420, x0 = 90, y0 = 330, u = 230;
        var b = '';
        b += S.line(x0 - 60, y0, W - 40, y0, COL.eje, 2.6);
        b += S.poly([[W - 40, y0], [W - 58, y0 - 8], [W - 58, y0 + 8]], COL.eje, COL.eje);
        for (var i = 0; i <= 3; i++) {
          b += S.line(x0 + i * u, y0 - 8, x0 + i * u, y0 + 8, COL.gris, 2);
          b += S.txt(x0 + i * u, y0 + 34, String(i), { size: 18, fill: COL.gris });
        }
        b += S.rect(x0, y0 - u, u, u, 'rgba(25,118,210,.10)', COL.azul, { r: 0, sw: 2.4 });
        b += S.line(x0, y0, x0 + u, y0 - u, COL.rojo, 3);
        b += S.txt(x0 + u / 2, y0 + 60, '1', { size: 19, fill: COL.azul, weight: '700' });
        b += S.txt(x0 - 26, y0 - u / 2, '1', { size: 19, fill: COL.azul, weight: '700' });
        b += S.txt(x0 + u / 2 - 34, y0 - u / 2 - 6, 'd', { size: 20, fill: COL.rojo, weight: '700', style: 'italic' });
        /* arco de radio la diagonal */
        var xd = x0 + u * Math.SQRT2;
        b += S.path('M ' + (x0 + u) + ' ' + (y0 - u) + ' A ' + (u * Math.SQRT2) + ' ' + (u * Math.SQRT2) + ' 0 0 1 ' + xd + ' ' + y0,
          COL.rojo, 2, 'none', '6 5');
        b += S.circle(xd, y0, 9, COL.rojo, '#fff', 2.4);
        b += S.txt(xd, y0 - 20, '√2 ≈ 1,4142…', { size: 19, fill: COL.rojo, weight: '700' });
        b += S.txt(W / 2, 40, 'La diagonal del cuadrado de lado 1 mide √2', { size: 21, weight: '700', fill: COL.azulOsc });
        h += S.svgWrap(b, W, H, 'Cuadrado de lado 1 y su diagonal llevada a la recta real',
          'La diagonal existe, se puede dibujar y se puede llevar con el compás a la recta: es un número perfectamente real. Lo que no existe es la fracción que la mida.');
        h += '<div class="mx-info">Este descubrimiento fue un escándalo en la escuela de Pitágoras, que defendía que todo se podía medir con razones de números enteros. La diagonal del cuadrado más sencillo posible demostró que no.</div>';
        return h;
      });
  };

  /* ---------------- 2.3 aureo ------------------------------------- */
  R.aureo = function (node) {
    S.shell(node, 'El número de oro',
      'Divide un segmento en proporción áurea y observa cómo los cocientes de la sucesión de Fibonacci se acercan a $\\varphi$. ' +
      'Formato de entrada: la <b>longitud del segmento</b> es un número positivo (admite coma: <code>12,5</code>) y los <b>términos de Fibonacci</b> se eligen con el deslizador. ' +
      'Ejemplo: longitud <code>10</code> y <code>12</code> términos.',
      [{ id: 'L', label: 'Longitud del segmento', type: 'number', value: 10, min: 1, max: 1000, step: 0.5 },
      { id: 'k', label: 'Términos de Fibonacci', type: 'range', value: 12, min: 4, max: 20 },
      {
        type: 'presets', list: [
          { label: 'segmento de 1', apply: function (c) { c.L.value = 1; } },
          { label: 'DNI: 85 × 53 mm', title: 'Casi un rectángulo áureo', apply: function (c) { c.L.value = 85; c.k.value = 10; } },
          { label: '20 términos', apply: function (c) { c.k.value = 20; } }
        ]
      }],
      function (v) {
        var L = S.real(v.L, 0.1, 100000, 'La longitud del segmento');
        var k = S.entero(v.k, 4, 20, 'El número de términos');
        var phi = (1 + Math.sqrt(5)) / 2;
        var a = L / phi, b = L - a;                  /* parte mayor y parte menor */

        var h = S.resultado(K('\\varphi = \\dfrac{1+\\sqrt{5}}{2} \\approx ' + kf(phi, 12)), 'número de oro o divina proporción');
        h += S.kvs(['Segmento total: $' + kf(L, 4) + '$', 'Parte mayor $a \\approx ' + kf(a, 6) + '$',
          'Parte menor $b \\approx ' + kf(b, 6) + '$',
          '$\\dfrac{a+b}{a} \\approx ' + kf(L / a, 10) + '$', '$\\dfrac{a}{b} \\approx ' + kf(a / b, 10) + '$']);

        h += S.paso(1, 'La proporción áurea consiste en partir un segmento de longitud $a+b$ en dos trozos de modo que <b>el total es al trozo mayor lo que el trozo mayor es al menor</b>:', 'ap-paso-clave');
        h += KD('\\dfrac{a+b}{a} = \\dfrac{a}{b} = \\varphi');
        h += S.paso(2, 'Llamando $x = \\dfrac{a}{b}$ y dividiendo todo entre $b$ se llega a $\\dfrac{x+1}{x} = x$, es decir a la ecuación de segundo grado');
        h += KD('x^2 - x - 1 = 0 \\quad \\Longrightarrow \\quad x = \\dfrac{1 \\pm \\sqrt{5}}{2}');
        h += S.paso(3, 'La solución positiva es $\\varphi = \\dfrac{1+\\sqrt{5}}{2}$. Como aparece $\\sqrt{5}$, que es irracional, y $1$ y $2$ son racionales, ' +
          '$\\varphi$ es irracional por las reglas de formación.');
        h += S.paso(4, 'De $\\varphi^2 = \\varphi + 1$ salen dos identidades muy elegantes: $\\varphi^2 \\approx ' + kf(phi * phi, 8) +
          '$ y $\\dfrac{1}{\\varphi} = \\varphi - 1 \\approx ' + kf(1 / phi, 8) + '$.');

        /* Figura: el segmento partido en proporción áurea + rectángulo áureo */
        /* Altura 470: deja sitio al pie de figura que va bajo el rectángulo áureo. */
        var W = 1040, H = 470, x0 = 70, ancho = 900, yS = 130;
        var xc = x0 + ancho / phi;
        var bd = '';
        bd += S.txt(W / 2, 44, 'División de un segmento en proporción áurea', { size: 21, weight: '700', fill: COL.azulOsc });
        bd += S.line(x0, yS, x0 + ancho, yS, COL.azulOsc, 7);
        bd += S.line(x0, yS - 18, x0, yS + 18, COL.azulOsc, 3);
        bd += S.line(x0 + ancho, yS - 18, x0 + ancho, yS + 18, COL.azulOsc, 3);
        bd += S.line(xc, yS - 22, xc, yS + 22, COL.rojo, 3.4);
        bd += S.line(x0, yS - 40, xc, yS - 40, COL.rojo, 3);
        bd += S.line(xc, yS - 40, x0 + ancho, yS - 40, COL.verde, 3);
        bd += S.txt((x0 + xc) / 2, yS - 52, 'a = ' + nc(a, 4), { size: 19, fill: COL.rojo, weight: '700' });
        bd += S.txt((xc + x0 + ancho) / 2, yS - 52, 'b = ' + nc(b, 4), { size: 19, fill: COL.verde, weight: '700' });
        bd += S.txt(x0 + ancho / 2, yS + 46, 'a + b = ' + nc(L, 4), { size: 19, fill: COL.azulOsc, weight: '700' });
        /* rectángulo áureo con el cuadrado dentro */
        var hR = 190, wR = hR * phi, xR = (W - wR) / 2, yR = 210;
        bd += S.rect(xR, yR, wR, hR, 'rgba(25,118,210,.08)', COL.azul, { r: 0, sw: 2.4 });
        bd += S.rect(xR, yR, hR, hR, 'rgba(46,125,50,.10)', COL.verde, { r: 0, sw: 2.2 });
        bd += S.txt(xR + hR / 2, yR + hR / 2 + 8, 'cuadrado', { size: 18, fill: COL.verde, weight: '700' });
        bd += S.txt(xR + hR + (wR - hR) / 2, yR + hR / 2 + 8, 'áureo', { size: 17, fill: COL.azul, weight: '700' });
        bd += S.txt(xR + wR / 2, yR + hR + 34, 'Rectángulo áureo: al quitarle un cuadrado queda otro rectángulo áureo', { size: 17, fill: COL.gris });
        h += S.svgWrap(bd, W, H, 'Segmento dividido en proporción áurea y rectángulo áureo',
          'El rectángulo áureo se puede desmontar en un cuadrado más otro rectángulo áureo, y así infinitas veces: de ahí la espiral áurea.');

        /* Fibonacci */
        var F = [1, 1];
        while (F.length < k) F.push(F[F.length - 1] + F[F.length - 2]);
        var filas = [];
        for (var i = 1; i < F.length; i++) {
          var c = F[i] / F[i - 1];
          filas.push({
            celdas: [K('\\dfrac{' + S.milTex(F[i]) + '}{' + S.milTex(F[i - 1]) + '}'), K(kf(c, 12)), K(kf(Math.abs(c - phi), 12))],
            clase: i === F.length - 1 ? 'ap-ok-row' : ''
          });
        }
        h += S.tabla(['Cociente de Fibonacci', 'Valor', 'Distancia a $\\varphi$'], filas, { thPrimera: true });
        h += '<div class="mx-info">La sucesión $1, 1, 2, 3, 5, 8, 13, 21, \\ldots$ se forma sumando los dos términos anteriores. ' +
          'Los cocientes de dos términos consecutivos se acercan a $\\varphi$ alternando por encima y por debajo, y con ' + (k > 12 ? 'esta cantidad de' : 'unos pocos') +
          ' términos ya se aciertan varias cifras decimales.</div>';
        h += '<div class="mx-info">Curiosidad: $\\varphi$ es el irracional «más difícil de aproximar» por fracciones, porque su desarrollo en fracción continua es $1 + \\dfrac{1}{1 + \\dfrac{1}{1 + \\ldots}}$, todo unos.</div>';
        return h;
      });
  };

  /* ==================================================================
     APARTADO 3 · NÚMEROS REALES Y RECTA REAL
     ================================================================== */

  /* ---------------- 3.1 rectaZoom --------------------------------- */
  R.rectaZoom = function (node) {
    S.shell(node, 'Zoom en la recta real',
      'Amplía la recta alrededor de un número y observa cómo lo van encerrando intervalos cada vez más pequeños de extremos racionales. ' +
      'Formato de entrada: el <b>centro</b> admite enteros, decimales con coma, fracciones con barra y las palabras <code>pi</code>, <code>e</code>, <code>phi</code>, <code>sqrt2</code>, <code>raiz(3)</code>; ' +
      'el <b>zoom</b> se mueve con el deslizador. Ejemplo: centro <code>sqrt2</code> con zoom <code>3</code>.',
      [{ id: 'c', label: 'Centro', type: 'text', value: 'sqrt2', ancho: '150px' },
      { id: 'k', label: 'Nivel de zoom', type: 'range', value: 2, min: 0, max: 6 },
      {
        type: 'presets', list: [
          { label: '√2', apply: function (c) { c.c.value = 'sqrt2'; c.k.value = 3; } },
          { label: 'π', apply: function (c) { c.c.value = 'pi'; c.k.value = 4; } },
          { label: 'φ', apply: function (c) { c.c.value = 'phi'; c.k.value = 3; } },
          { label: '1/3', apply: function (c) { c.c.value = '1/3'; c.k.value = 4; } },
          { label: '−7/4', apply: function (c) { c.c.value = '-7/4'; c.k.value = 2; } }
        ]
      }],
      function (v) {
        var C = S.valorSimbolico(v.c);
        var k = S.entero(v.k, 0, 6, 'El nivel de zoom');
        var c = C.v;
        if (Math.abs(c) > 1e6) throw Error('Elige un centro con valor absoluto menor que un millón para que la figura tenga sentido.');

        var u = Math.pow(10, -k);                    /* unidad del nivel actual */
        var izq = Math.floor(c / u) * u, der = izq + u;
        var semi = 5 * u * (k === 0 ? 1 : 1);
        var lo = c - semi, hi = c + semi;

        var fig = S.rectaReal({
          min: lo, max: hi, W: 1050, H: 300, paso: (hi - lo) / 10, dec: k + 2,
          tramos: [{ a: izq, b: der, col: 'rgba(46,125,50,.20)', alto: 26 }],
          puntos: [{ x: c, tex: C.tex, col: COL.rojo },
          { x: izq, tex: kf(izq, k + 1), col: COL.verde, arriba: false },
          { x: der, tex: kf(der, k + 1), col: COL.verde, arriba: false }],
          titulo: 'Zoom ' + (k === 0 ? '×1' : '×10^' + k) + ' alrededor de ' + C.txt,
          cap: 'La franja verde es el intervalo de amplitud $10^{-' + k + '}$ con extremos racionales que atrapa al número. ' +
            'Por muy pequeño que sea el zoom, siempre hay uno más pequeño: el número ocupa un punto, no un trocito.'
        });

        /* Intervalos encajados: cada nivel añade una cifra decimal */
        var filas = [];
        for (var j = 0; j <= k + 1; j++) {
          var uj = Math.pow(10, -j);
          var aj = Math.floor(c / uj) * uj;
          filas.push({
            celdas: [K('10^{-' + j + '}'),
              K('\\left[\\,' + kf(aj, j) + ' \\; , \\; ' + kf(aj + uj, j) + '\\,\\right]'),
              K(kf(uj, 8)), j === k ? S.badge('nivel dibujado', 'info') : ''],
            clase: j === k ? 'ap-ok-row' : ''
          });
        }

        var d = null;
        try { d = /^[+-]?\d+(\/\d+)?$/.test(String(v.c).replace(/\s/g, '')) ? S.decimalDeFraccion(Number(String(v.c).split('/')[0]), Number(String(v.c).split('/')[1] || 1), 30) : null; }
        catch (e) { d = null; }

        return S.resultado(K(C.tex + ' \\approx ' + kf(c, Math.min(12, k + 6))), 'número ampliado') +
          S.kvs(['Amplitud de la ventana: $' + kf(hi - lo, 8) + '$',
            'Intervalo que lo atrapa: $[' + kf(izq, k + 1) + ',\\, ' + kf(der, k + 1) + ']$',
            'Amplitud: $10^{-' + k + '} = ' + kf(u, 8) + '$',
          d ? 'Expresión decimal: $' + S.decimalTex(d) + '$' : 'Cifras decimales infinitas no periódicas']) +
          fig +
          S.tabla(['Amplitud', 'Intervalo de extremos racionales', 'Longitud', ''], filas) +
          S.paso(1, 'Cada cifra decimal que se añade divide el intervalo anterior en $10$ partes y elige una: los intervalos quedan <b>encajados</b>, cada uno dentro del anterior.', 'ap-paso-clave') +
          S.paso(2, 'Las longitudes $1, 0{,}1, 0{,}01, 0{,}001, \\ldots$ tienden a $0$, así que solo queda un punto dentro de todos ellos. Ese punto es el número.') +
          S.paso(3, 'La <b>completitud</b> de $\\mathbb{R}$ dice exactamente esto: toda sucesión de intervalos encajados cuya amplitud tiende a cero determina un único número real. ' +
            'En $\\mathbb{Q}$ esto falla: los intervalos $[1{,}4;\\,1{,}5]$, $[1{,}41;\\,1{,}42]$, … no encierran ningún racional común, porque el punto que buscan es $\\sqrt{2}$.') +
          '<div class="mx-info">Por eso se dice que $\\mathbb{Q}$ tiene «agujeros» y que $\\mathbb{R}$ no: los reales llenan la recta por completo, sin dejar ni un hueco.</div>';
      });
  };

  /* ---------------- 3.2 valorAbsoluto ----------------------------- */
  R.valorAbsoluto = function (node) {
    S.shell(node, 'Valor absoluto y distancia',
      'Calcula valores absolutos, la distancia entre dos números y resuelve una desigualdad con valor absoluto. ' +
      'Formato de entrada: los dos números admiten enteros, decimales con coma y fracciones con barra (<code>-2,3</code>, <code>-1/5</code>); el <b>radio</b> es positivo. ' +
      'Ejemplo: <code>-9</code> y <code>5</code> están a distancia $14$.',
      [{ id: 'x', label: 'Primer número x', type: 'text', value: '-9', ancho: '120px' },
      { id: 'y', label: 'Segundo número y', type: 'text', value: '5', ancho: '120px' },
      { id: 'r', label: 'Radio r', type: 'number', value: 4, min: 0.1, max: 100, step: 0.5 },
      {
        id: 'sen', label: 'Desigualdad', type: 'select', value: 'menor', options: [
          { value: 'menor', label: '|t − x| < r' }, { value: 'mayor', label: '|t − x| > r' }]
      },
      {
        type: 'presets', list: [
          { label: '3 y 8', apply: function (c) { c.x.value = '3'; c.y.value = '8'; } },
          { label: '−2,3 y −4,5', apply: function (c) { c.x.value = '-2,3'; c.y.value = '-4,5'; } },
          { label: '−1/5 y 9/5', apply: function (c) { c.x.value = '-1/5'; c.y.value = '9/5'; } },
          { label: 'sótano −9 y piso 5', apply: function (c) { c.x.value = '-9'; c.y.value = '5'; } }
        ]
      }],
      function (v) {
        var X = S.valorSimbolico(v.x), Y = S.valorSimbolico(v.y);
        var r = S.real(v.r, 0.01, 1000, 'El radio');
        var x = X.v, y = Y.v;
        var dist = Math.abs(x - y);

        var h = S.resultado(K('\\mathrm{d}(x,y) = |x - y| = ' + kf(dist, 6)), 'distancia entre $' + X.tex + '$ y $' + Y.tex + '$');
        h += S.kvs(['$|x| = |' + X.tex + '| = ' + kf(Math.abs(x), 6) + '$',
          '$|y| = |' + Y.tex + '| = ' + kf(Math.abs(y), 6) + '$',
          '$|x + y| = ' + kf(Math.abs(x + y), 6) + '$',
          '$|x| + |y| = ' + kf(Math.abs(x) + Math.abs(y), 6) + '$',
        Math.abs(x + y) <= Math.abs(x) + Math.abs(y) ? S.badge('desigualdad triangular correcta', 'si') : S.badge('imposible', 'no')]);

        var lo = Math.min(x, y, x - r) - 1, hi = Math.max(x, y, x + r) + 1;
        h += S.rectaReal({
          min: lo, max: hi, W: 1050, H: 300, paso: (hi - lo) / 10, dec: 2,
          tramos: [{ a: Math.min(x, y), b: Math.max(x, y), col: 'rgba(198,40,40,.18)', alto: 24 }],
          puntos: [{ x: x, tex: 'x = ' + X.tex, col: COL.azulOsc }, { x: y, tex: 'y = ' + Y.tex, col: COL.verde }],
          titulo: 'La distancia es la longitud del trozo de recta entre los dos puntos',
          cap: 'La distancia no depende del orden: $|x-y| = |y-x|$. Por eso siempre sale positiva o cero.'
        });

        h += S.paso(1, 'Definición por trozos: $|a| = a$ si $a \\ge 0$ y $|a| = -a$ si $a < 0$. El valor absoluto <b>nunca</b> es negativo.', 'ap-paso-clave');
        h += S.paso(2, 'Aquí: $|' + X.tex + ' - (' + Y.tex + ')| = |' + kf(x - y, 6) + '| = ' + kf(dist, 6) + '$.');
        h += S.paso(3, 'Interpretación: si $x = -9$ es el sótano 9 y $y = 5$ el piso 5, la distancia $14$ son los pisos que sube el ascensor, no la diferencia de etiquetas.');

        /* Desigualdad con valor absoluto */
        var menor = v.sen === 'menor';
        var sol = menor
          ? '(' + kf(x - r, 4) + ',\\, ' + kf(x + r, 4) + ')'
          : '(-\\infty,\\, ' + kf(x - r, 4) + ') \\cup (' + kf(x + r, 4) + ',\\, +\\infty)';
        h += S.paso(4, menor
          ? 'La desigualdad $|t - x| < r$ dice «los números que están de $x$ a distancia menor que $r$». Se desdobla en $-r < t - x < r$ y, sumando $x$, en $x - r < t < x + r$.'
          : 'La desigualdad $|t - x| > r$ dice «los números que están de $x$ a distancia mayor que $r$». Se desdobla en dos casos: $t - x > r$ o $t - x < -r$.', 'ap-paso-clave');
        h += S.resultado(K(sol), 'solución de $|t - (' + kf(x, 4) + ')| ' + (menor ? '<' : '>') + ' ' + kf(r, 4) + '$');

        var yl = Math.max(r * 2, 4);
        h += S.ejes({
          xmin: x - 3 * r, xmax: x + 3 * r, ymin: -0.5, ymax: yl, W: 980, H: 520,
          paso: Math.max(1, Math.round(6 * r / 10)), pasoY: Math.max(1, Math.round(yl / 8)),
          curvas: [{ f: function (t) { return Math.abs(t - x); }, col: COL.azul, label: 'y = |t - x|', lx: 700, ly: 90 },
          { f: function () { return r; }, col: COL.verde, dash: '7 5', label: 'y = r', lx: 700, ly: 140 }],
          puntos: [{ x: x - r, y: r, tex: 'x-r', col: COL.rojo }, { x: x + r, y: r, tex: 'x+r', col: COL.rojo },
          { x: x, y: 0, tex: 'x', col: COL.azulOsc }],
          cap: 'La gráfica de $y = |t-x|$ es una «V» con el vértice en $x$. Los puntos donde la V queda por debajo de la recta $y = r$ son la solución de $|t-x| < r$; los que quedan por encima, la de $|t-x| > r$.'
        });

        h += '<div class="mx-info">Propiedades que conviene memorizar: $|a| \\ge 0$; $|a| = |-a|$; $|a| = 0 \\Leftrightarrow a = 0$; ' +
          '$|a \\cdot b| = |a| \\cdot |b|$; $|a + b| \\le |a| + |b|$ (desigualdad triangular).</div>';
        return h;
      });
  };

  /* ---------------- 3.3 raicesPitagoras --------------------------- */
  /* Descompone n como suma de cuadrados por el método voraz:
     12 = 3² + 1² + 1² + 1².  Sirve para construir la raíz con
     triángulos rectángulos encadenados.                              */
  function sumaCuadrados(n) {
    var out = [], r = n, guardia = 0;
    while (r > 0 && guardia++ < 200) {
      var a = Math.floor(Math.sqrt(r));
      if (a < 1) a = 1;
      out.push(a);
      r -= a * a;
    }
    return out;
  }

  R.raicesPitagoras = function (node) {
    S.shell(node, 'Representar raíces y fracciones en la recta',
      'Dos construcciones con regla y compás: el teorema de Pitágoras para las raíces y el teorema de Tales para las fracciones. ' +
      'Formato de entrada: para la raíz, el <b>radicando</b> es un natural (<code>12</code>); para la fracción, <b>numerador</b> y <b>denominador</b> enteros (<code>7</code> y <code>5</code>).',
      [{
        id: 'modo', label: 'Construcción', type: 'select', value: 'pitagoras', options: [
          { value: 'pitagoras', label: 'raíz con Pitágoras' }, { value: 'tales', label: 'fracción con Tales' }]
      },
      { id: 'n', label: 'Radicando', type: 'number', value: 12, min: 2, max: 200 },
      { id: 'p', label: 'Numerador', type: 'number', value: 7, min: -60, max: 60 },
      { id: 'q', label: 'Denominador', type: 'number', value: 5, min: 1, max: 24 },
      {
        type: 'presets', list: [
          { label: '√2', apply: function (c) { c.modo.value = 'pitagoras'; c.n.value = 2; } },
          { label: '√10', apply: function (c) { c.modo.value = 'pitagoras'; c.n.value = 10; } },
          { label: '√12', apply: function (c) { c.modo.value = 'pitagoras'; c.n.value = 12; } },
          { label: '√27', apply: function (c) { c.modo.value = 'pitagoras'; c.n.value = 27; } },
          { label: '7/5 con Tales', apply: function (c) { c.modo.value = 'tales'; c.p.value = 7; c.q.value = 5; } },
          { label: '−13/4', apply: function (c) { c.modo.value = 'tales'; c.p.value = -13; c.q.value = 4; } }
        ]
      }],
      function (v) {
        if (v.modo === 'tales') {
          var p = S.entero(v.p, -999, 999, 'El numerador');
          var q = S.entero(v.q, 1, 30, 'El denominador');
          var f = new S.Frac(p, q);
          var val = f.val();
          var m = Math.floor(val), rest = val - m;    /* parte entera y sobrante */
          var qq = Number(f.d), pp = Number(f.n);
          var trozos = qq === 1 ? 1 : qq;
          var kSel = Math.round(rest * trozos);

          /* Figura de Tales */
          var W = 1040, H = 480, x0 = 110, u = 220, yEje = 380;
          var b = '';
          b += S.txt(W / 2, 42, 'Teorema de Tales: dividir la unidad en ' + trozos + ' partes iguales', { size: 21, weight: '700', fill: COL.azulOsc });
          var base = x0;                              /* pantalla del entero m */
          b += S.line(base - 70, yEje, W - 40, yEje, COL.eje, 2.6);
          b += S.poly([[W - 40, yEje], [W - 58, yEje - 8], [W - 58, yEje + 8]], COL.eje, COL.eje);
          var i;
          for (i = 0; i <= 3; i++) {
            b += S.line(base + i * u, yEje - 9, base + i * u, yEje + 9, COL.gris, 2);
            b += S.txt(base + i * u, yEje + 34, String(m + i), { size: 18, fill: COL.gris });
          }
          /* semirrecta auxiliar con q marcas iguales */
          /* paso de la semirrecta auxiliar: se reparte el mismo ángulo
             en «trozos» segmentos iguales, con longitud constante */
          var pasoX = (u * 0.95) / trozos, pasoY = -(210 / trozos);
          for (i = 1; i <= trozos; i++) {
            var mx = base + pasoX * i;
            var my = yEje + pasoY * i;
            b += S.line(base, yEje, mx, my, COL.naranja, i === trozos ? 2.6 : 1.4, i === trozos ? null : '4 4');
            b += S.circle(mx, my, 7, i === kSel ? COL.rojo : COL.naranja, '#fff', 2);
            /* paralela hasta el eje */
            var xd = base + (i / trozos) * u;
            b += S.line(mx, my, xd, yEje, i === kSel ? COL.rojo : COL.guia, i === kSel ? 2.6 : 1.4, i === kSel ? '6 4' : '3 4');
            if (i === trozos) b += S.txt(mx + 26, my - 6, 'q = ' + trozos, { size: 18, fill: COL.naranja, weight: '700', anchor: 'start' });
          }
          b += S.circle(base + rest * u, yEje, 9, COL.rojo, '#fff', 2.4);
          b += '<foreignObject x="' + (base + rest * u - 90) + '" y="' + (yEje + 52) + '" width="180" height="46">' +
            '<div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-size:20px;color:' + COL.rojo + '">' +
            '<span data-tex="' + S.esc(f.tex(true)) + '"></span></div></foreignObject>';
          var figT = S.svgWrap(b, W, H, 'Construcción de una fracción con el teorema de Tales',
            'Se traza una semirrecta auxiliar desde el punto entero, se marcan sobre ella $' + trozos + '$ segmentos iguales, se une la última marca con el punto siguiente del eje y se dibujan paralelas: la unidad queda partida en $' + trozos + '$ partes iguales.');

          return S.resultado(K(f.tex() + ' = ' + kf(val, 6)), 'fracción representada') +
            S.kvs(['Representante canónico: $' + f.tex(true) + '$',
              'Parte entera: <b>' + m + '</b>', 'Trozos de la unidad: <b>' + trozos + '</b>',
              'Se toman <b>' + kSel + '</b> de esos trozos']) +
            figT +
            S.paso(1, 'Se localiza la parte entera: el número está entre $' + m + '$ y $' + (m + 1) + '$.', 'ap-paso-clave') +
            S.paso(2, 'Desde el punto $' + m + '$ se traza una semirrecta cualquiera (no importa el ángulo) y sobre ella se llevan con el compás $' + trozos + '$ segmentos iguales.') +
            S.paso(3, 'Se une la última marca con el punto $' + (m + 1) + '$ del eje y se trazan paralelas a esa recta por las demás marcas.') +
            S.paso(4, 'Por el teorema de Tales, esas paralelas cortan la unidad en $' + trozos + '$ partes iguales. Contando $' + kSel + '$ de ellas se obtiene $' + f.tex(true) + '$.') +
            '<div class="mx-info">Esta construcción demuestra que <b>toda</b> fracción se puede representar con regla y compás, con precisión exacta y sin usar la expresión decimal.</div>';
        }

        /* --- modo Pitágoras --- */
        var n = S.entero(v.n, 2, 400, 'El radicando');
        var L = sumaCuadrados(n);
        var raiz = Math.sqrt(n);
        var perf = S.esCuadradoPerfecto(n);

        /* cadena de triángulos rectángulos */
        var A = { x: 0, y: 0 }, cur = { x: L[0], y: 0 }, tri = [], j;
        for (j = 1; j < L.length; j++) {
          var mod = Math.sqrt(cur.x * cur.x + cur.y * cur.y);
          var px = -cur.y / mod, py = cur.x / mod;
          var nx = { x: cur.x + px * L[j], y: cur.y + py * L[j] };
          tri.push({ base: cur, punta: nx, cat: L[j], hip: Math.sqrt(nx.x * nx.x + nx.y * nx.y) });
          cur = nx;
        }

        /* escala y dibujo */
        var Wp = 1040, Hp = 520, mL = 80, mB = 90, mT = 70;
        var xs = [0, raiz + 0.6, cur.x], ys = [0, cur.y];
        tri.forEach(function (t) { xs.push(t.punta.x); ys.push(t.punta.y); });
        xs.push(L[0]);
        var xmin = Math.min.apply(null, xs) - 0.4, xmax = Math.max.apply(null, xs) + 0.6;
        var ymax = Math.max.apply(null, ys) + 0.6;
        var esc = Math.min((Wp - mL - 60) / (xmax - xmin), (Hp - mB - mT) / Math.max(1, ymax));
        function PX(x) { return mL + (x - xmin) * esc; }
        function PY(y) { return Hp - mB - y * esc; }

        var g = '';
        g += S.txt(Wp / 2, 40, 'Construcción de √' + n + ' con triángulos rectángulos', { size: 21, weight: '700', fill: COL.azulOsc });
        g += S.line(PX(xmin), PY(0), PX(xmax), PY(0), COL.eje, 2.6);
        g += S.poly([[PX(xmax), PY(0)], [PX(xmax) - 16, PY(0) - 8], [PX(xmax) - 16, PY(0) + 8]], COL.eje, COL.eje);
        for (j = Math.ceil(xmin); j <= xmax; j++) {
          g += S.line(PX(j), PY(0) - 8, PX(j), PY(0) + 8, COL.gris, 1.8);
          g += S.txt(PX(j), PY(0) + 32, String(j), { size: 17, fill: COL.gris });
        }
        /* primer triángulo */
        if (L.length > 1) {
          g += S.poly([[PX(0), PY(0)], [PX(L[0]), PY(0)], [PX(tri[0].punta.x), PY(tri[0].punta.y)]],
            'rgba(25,118,210,.10)', COL.azul, 2.4);
        }
        tri.forEach(function (t, i2) {
          g += S.line(PX(0), PY(0), PX(t.punta.x), PY(t.punta.y), COL.azulOsc, 2.6);
          g += S.line(PX(t.base.x), PY(t.base.y), PX(t.punta.x), PY(t.punta.y), COL.verde, 2.6);
          g += S.circle(PX(t.punta.x), PY(t.punta.y), 7, COL.verde, '#fff', 2);
          if (i2 === tri.length - 1) {
            g += '<foreignObject x="' + (PX(t.punta.x) - 60) + '" y="' + (PY(t.punta.y) - 54) + '" width="140" height="44">' +
              '<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:19px;color:' + COL.azulOsc + '">' +
              '<span data-tex="' + S.esc('\\sqrt{' + n + '}') + '"></span></div></foreignObject>';
          }
        });
        /* arco final hasta el eje */
        var rp = raiz * esc;
        g += S.path('M ' + PX(cur.x) + ' ' + PY(cur.y) + ' A ' + rp + ' ' + rp + ' 0 0 1 ' + PX(raiz) + ' ' + PY(0),
          COL.rojo, 2, 'none', '6 5');
        g += S.circle(PX(raiz), PY(0), 9, COL.rojo, '#fff', 2.4);
        g += S.txt(PX(raiz), PY(0) - 22, '√' + n + ' ≈ ' + nc(raiz, 4), { size: 19, fill: COL.rojo, weight: '700' });

        var pasosTex = L.map(function (a) { return a + '^2'; }).join(' + ');
        var h2 = S.resultado(K('\\sqrt{' + n + '} \\approx ' + kf(raiz, 8)), perf ? 'raíz exacta' : 'raíz irracional, pero construible con regla y compás');
        h2 += S.kvs(['Descomposición: $' + n + ' = ' + pasosTex + '$',
          'Triángulos necesarios: <b>' + Math.max(1, L.length - 1) + '</b>',
        perf ? S.badge('número entero', 'no') : S.badge('irracional', 'si')]);
        h2 += S.svgWrap(g, Wp, Hp, 'Cadena de triángulos rectángulos que construye la raíz de ' + n,
          'Cada triángulo usa como base la hipotenusa del anterior; el arco final lleva la última hipotenusa a la recta real.');
        h2 += S.paso(1, 'Se descompone el radicando en suma de cuadrados: $' + n + ' = ' + pasosTex + '$.', 'ap-paso-clave');
        h2 += S.paso(2, 'Con los dos primeros cuadrados se construye un triángulo rectángulo de catetos $' + L[0] + '$ y $' + (L[1] || 0) +
          '$ apoyado en la recta. Por el teorema de Pitágoras su hipotenusa mide $\\sqrt{' + (L[0] * L[0] + (L[1] ? L[1] * L[1] : 0)) + '}$.');
        if (L.length > 2) h2 += S.paso(3, 'Cada cuadrado que queda se usa como cateto de un triángulo nuevo levantado sobre la hipotenusa anterior. Al final la hipotenusa mide exactamente $\\sqrt{' + n + '}$.');
        h2 += S.paso(L.length > 2 ? 4 : 3, 'Con el compás centrado en el origen y radio esa hipotenusa se lleva la medida a la recta: el punto de corte es $\\sqrt{' + n + '}$, situado exactamente, no aproximadamente.');
        h2 += S.tabla(['Triángulo', 'Catetos', 'Hipotenusa'],
          tri.map(function (t, i3) {
            var hipAnt = i3 === 0 ? L[0] : tri[i3 - 1].hip;
            return [String(i3 + 1),
              K((i3 === 0 ? String(L[0]) : '\\sqrt{' + Math.round(hipAnt * hipAnt) + '}') + ' \\text{ y } ' + t.cat),
              K('\\sqrt{' + Math.round(t.hip * t.hip) + '} \\approx ' + kf(t.hip, 6))];
          }));
        h2 += '<div class="mx-info">Conclusión importante: los irracionales no son «números aproximados». $\\sqrt{' + n + '}$ tiene un sitio exacto en la recta, y ese sitio se puede encontrar con regla y compás.</div>';
        return h2;
      });
  };

  /* ==================================================================
     APARTADO 4 · INTERVALOS, SEMIRRECTAS Y ENTORNOS
     ================================================================== */

  var INF = Infinity;

  /* Lee un extremo de intervalo: número, fracción, constante o infinito */
  function extremo(t, nombre) {
    var s = String(t).trim().toLowerCase().replace(/\s/g, '').replace(/−/g, '-');
    if (/^[+]?(inf|infinito|∞)$/.test(s)) return INF;
    if (/^-(inf|infinito|∞)$/.test(s)) return -INF;
    return S.valorSimbolico(s).v;
  }

  /* Lee un intervalo escrito como [a,b], (a,b), (a,b], [a,b), con
     -inf y +inf admitidos. Devuelve {a,b,ai,bi} donde ai/bi indican
     si el extremo está incluido.                                     */
  function intervaloTxt(s, nombre) {
    var t = String(s).trim().replace(/\s/g, '').replace(/−/g, '-');
    var m = t.match(/^([\[\(\]])(.+)[;,](.+)([\]\)\[])$/);
    if (!m) throw Error((nombre || 'El intervalo') + ' se escribe con corchetes o paréntesis, los dos extremos y una coma: ' +
      '[-2,3) · (0,5] · [1;7] · (-inf,4]. Si usas decimales, escríbelos con punto o separa con punto y coma: (1.5,2.5) o (1,5;2,5).');
    var a = extremo(m[2]), b = extremo(m[3]);
    var ai = m[1] === '[', bi = m[4] === ']';
    if (!Number.isFinite(a) && ai) throw Error('El infinito nunca se incluye: escribe $(-\\infty$ con paréntesis, no con corchete.');
    if (!Number.isFinite(b) && bi) throw Error('El infinito nunca se incluye: escribe $+\\infty)$ con paréntesis, no con corchete.');
    if (a > b) throw Error((nombre || 'El intervalo') + ' tiene el extremo izquierdo mayor que el derecho. Escribe primero el menor: [-2,3), no [3,-2).');
    if (a === b && !(ai && bi)) throw Error('Si los dos extremos son iguales, el intervalo solo puede ser $[a,a] = \\{a\\}$; escrito con paréntesis es el conjunto vacío.');
    return { a: a, b: b, ai: ai, bi: bi };
  }

  function intTex(I) {
    if (!I) return '\\varnothing';
    var iz = Number.isFinite(I.a) ? (I.ai ? '[' : '(') + kf(I.a, 6) : '(-\\infty';
    var de = Number.isFinite(I.b) ? kf(I.b, 6) + (I.bi ? ']' : ')') : '+\\infty)';
    return iz + ',\\, ' + de;
  }
  function conjTex(I) {
    if (!I) return '\\varnothing';
    if (!Number.isFinite(I.a) && !Number.isFinite(I.b)) return '\\mathbb{R}';
    if (!Number.isFinite(I.a)) return '\\{x \\in \\mathbb{R} \\;:\\; x ' + (I.bi ? '\\le' : '<') + ' ' + kf(I.b, 6) + '\\}';
    if (!Number.isFinite(I.b)) return '\\{x \\in \\mathbb{R} \\;:\\; x ' + (I.ai ? '\\ge' : '>') + ' ' + kf(I.a, 6) + '\\}';
    return '\\{x \\in \\mathbb{R} \\;:\\; ' + kf(I.a, 6) + ' ' + (I.ai ? '\\le' : '<') + ' x ' +
      (I.bi ? '\\le' : '<') + ' ' + kf(I.b, 6) + '\\}';
  }
  function pertenece(I, x) {
    if (!I) return false;
    var ok1 = Number.isFinite(I.a) ? (I.ai ? x >= I.a : x > I.a) : true;
    var ok2 = Number.isFinite(I.b) ? (I.bi ? x <= I.b : x < I.b) : true;
    return ok1 && ok2;
  }
  /* Ventana de dibujo razonable cuando hay infinitos */
  function ventana(lista) {
    var vs = [];
    lista.forEach(function (I) {
      if (!I) return;
      if (Number.isFinite(I.a)) vs.push(I.a);
      if (Number.isFinite(I.b)) vs.push(I.b);
    });
    if (!vs.length) vs = [-5, 5];
    var lo = Math.min.apply(null, vs), hi = Math.max.apply(null, vs);
    if (hi - lo < 1) { lo -= 2; hi += 2; }
    var m = (hi - lo) * 0.35;
    return { lo: lo - m, hi: hi + m };
  }
  /* Tramos y puntos para pintar un intervalo en la recta real */
  function dibuja(I, col, alto, ven) {
    if (!I) return { tramos: [], puntos: [] };
    var a = Number.isFinite(I.a) ? I.a : ven.lo, b = Number.isFinite(I.b) ? I.b : ven.hi;
    var pt = [];
    if (Number.isFinite(I.a)) pt.push({ x: I.a, tex: kf(I.a, 4), col: col, hueco: !I.ai });
    if (Number.isFinite(I.b)) pt.push({ x: I.b, tex: kf(I.b, 4), col: col, hueco: !I.bi, arriba: false });
    return { tramos: [{ a: a, b: b, col: col === COL.azul ? 'rgba(25,118,210,.22)' : 'rgba(46,125,50,.22)', alto: alto || 20 }], puntos: pt };
  }

  /* ---------------- 4.1 intervalos -------------------------------- */
  R.intervalos = function (node) {
    S.shell(node, 'Intervalos y semirrectas',
      'Elige el tipo de intervalo, sus extremos y un punto de prueba: el applet escribe las tres notaciones y dibuja el conjunto en la recta. ' +
      'Formato de entrada: los <b>extremos</b> y el <b>punto de prueba</b> son números (admiten coma decimal, por ejemplo <code>2,5</code>). ' +
      'Ejemplo: tipo «semiabierto por la izquierda» con extremos <code>-1</code> y <code>4</code> da $(-1, 4]$.',
      [{
        id: 'tipo', label: 'Tipo', type: 'select', value: 'semiIzq', options: [
          { value: 'abierto', label: 'abierto (a, b)' },
          { value: 'cerrado', label: 'cerrado [a, b]' },
          { value: 'semiIzq', label: 'semiabierto por la izquierda (a, b]' },
          { value: 'semiDer', label: 'semiabierto por la derecha [a, b)' },
          { value: 'menor', label: 'semirrecta (−∞, b)' },
          { value: 'menorIg', label: 'semirrecta (−∞, b]' },
          { value: 'mayor', label: 'semirrecta (a, +∞)' },
          { value: 'mayorIg', label: 'semirrecta [a, +∞)' }]
      },
      { id: 'a', label: 'Extremo a', type: 'number', value: -1, min: -100, max: 100, step: 0.5 },
      { id: 'b', label: 'Extremo b', type: 'number', value: 4, min: -100, max: 100, step: 0.5 },
      { id: 'x', label: 'Punto de prueba', type: 'number', value: 4, min: -100, max: 100, step: 0.5 },
      {
        type: 'presets', list: [
          { label: '[1, 7)', apply: function (c) { c.tipo.value = 'semiDer'; c.a.value = 1; c.b.value = 7; c.x.value = 7; } },
          { label: '(−3, 5)', apply: function (c) { c.tipo.value = 'abierto'; c.a.value = -3; c.b.value = 5; c.x.value = 0; } },
          { label: '(2, 8]', apply: function (c) { c.tipo.value = 'semiIzq'; c.a.value = 2; c.b.value = 8; c.x.value = 8; } },
          { label: '(−∞, 6)', apply: function (c) { c.tipo.value = 'menor'; c.a.value = 0; c.b.value = 6; c.x.value = 6; } },
          { label: 'edad ≤ 18', apply: function (c) { c.tipo.value = 'menorIg'; c.a.value = 0; c.b.value = 18; c.x.value = 18; } },
          { label: 'porcentaje > 26 %', apply: function (c) { c.tipo.value = 'mayor'; c.a.value = 26; c.b.value = 100; c.x.value = 26; } }
        ]
      }],
      function (v) {
        var a = S.real(v.a, -1000, 1000, 'El extremo a');
        var b = S.real(v.b, -1000, 1000, 'El extremo b');
        var x = S.real(v.x, -1000, 1000, 'El punto de prueba');
        var t = v.tipo, I;
        if (t === 'menor') I = { a: -INF, b: b, ai: false, bi: false };
        else if (t === 'menorIg') I = { a: -INF, b: b, ai: false, bi: true };
        else if (t === 'mayor') I = { a: a, b: INF, ai: false, bi: false };
        else if (t === 'mayorIg') I = { a: a, b: INF, ai: true, bi: false };
        else {
          if (a >= b) throw Error('Para un intervalo acotado hace falta que el extremo a sea menor que b. Prueba con a = -1 y b = 4.');
          I = { a: a, b: b, ai: (t === 'cerrado' || t === 'semiDer'), bi: (t === 'cerrado' || t === 'semiIzq') };
        }

        var ven = ventana([I]);
        var d = dibuja(I, COL.azul, 24, ven);
        var dentro = pertenece(I, x);
        var acotado = Number.isFinite(I.a) && Number.isFinite(I.b);

        var h = S.resultado(K(intTex(I)), 'notación de intervalo');
        h += S.kvs(['Notación de conjunto: $' + conjTex(I) + '$',
          'Extremo izquierdo: ' + (Number.isFinite(I.a) ? (I.ai ? 'incluido' : 'excluido') : 'no hay'),
          'Extremo derecho: ' + (Number.isFinite(I.b) ? (I.bi ? 'incluido' : 'excluido') : 'no hay'),
          acotado ? 'Amplitud: $' + kf(I.b - I.a, 6) + '$' : 'Amplitud: infinita']);

        d.puntos.push({ x: x, tex: 'x = ' + kf(x, 4), col: dentro ? COL.verde : COL.rojo });
        h += S.rectaReal({
          min: ven.lo, max: ven.hi, W: 1050, H: 320, paso: (ven.hi - ven.lo) / 10, dec: 1,
          tramos: d.tramos, puntos: d.puntos,
          titulo: 'Intervalo ' + (t === 'abierto' ? 'abierto' : t === 'cerrado' ? 'cerrado' : t.indexOf('semi') === 0 ? 'semiabierto' : 'semirrecta'),
          cap: 'El punto <b>relleno</b> indica extremo incluido y el punto <b>hueco</b> extremo excluido. ' +
            'Las semirrectas se dibujan con la flecha: el infinito no es un número, así que nunca se incluye.'
        });

        h += S.resultado(S.badge(dentro ? 'sí pertenece' : 'no pertenece', dentro ? 'si' : 'no'),
          '¿está $x = ' + kf(x, 4) + '$ en $' + intTex(I) + '$?');
        h += S.paso(1, 'Comprobar la pertenencia es comprobar las desigualdades: ' +
          (Number.isFinite(I.a) ? '$' + kf(x, 4) + ' ' + (I.ai ? '\\ge' : '>') + ' ' + kf(I.a, 4) + '$ es ' + (Number.isFinite(I.a) ? ((I.ai ? x >= I.a : x > I.a) ? '<b>cierto</b>' : '<b>falso</b>') : '') + '. ' : '') +
          (Number.isFinite(I.b) ? '$' + kf(x, 4) + ' ' + (I.bi ? '\\le' : '<') + ' ' + kf(I.b, 4) + '$ es ' + ((I.bi ? x <= I.b : x < I.b) ? '<b>cierto</b>' : '<b>falso</b>') + '.' : ''), 'ap-paso-clave');
        if (acotado) {
          var c0 = (I.a + I.b) / 2, r0 = (I.b - I.a) / 2;
          h += S.paso(2, 'Punto medio: $\\dfrac{' + kf(I.a, 4) + ' + ' + kf(I.b, 4) + '}{2} = ' + kf(c0, 6) +
            '$; semiamplitud: $\\dfrac{' + kf(I.b, 4) + ' - ' + kf(I.a, 4) + '}{2} = ' + kf(r0, 6) + '$.');
          h += S.paso(3, (I.ai || I.bi)
            ? 'Solo los intervalos <b>abiertos</b> se pueden escribir como entorno. Este no lo es, porque algún extremo está incluido.'
            : 'Como es abierto, se puede escribir como entorno: $' + intTex(I) + ' = E(' + kf(c0, 6) + ',\\, ' + kf(r0, 6) + ')$, ' +
            'y también con valor absoluto: $|x - ' + kf(c0, 6) + '| < ' + kf(r0, 6) + '$.');
        } else {
          h += S.paso(2, 'Una semirrecta no está acotada por un lado, así que no tiene punto medio ni amplitud finita. Con desigualdades se escribe $' + conjTex(I) + '$.');
        }
        h += '<div class="mx-info">Toda la recta se escribe $\\mathbb{R} = (-\\infty, +\\infty)$, y se descompone en $\\mathbb{R} = (-\\infty, 0) \\cup \\{0\\} \\cup (0, +\\infty)$.</div>';
        return h;
      });
  };

  /* ---------------- 4.2 operaIntervalos --------------------------- */
  R.operaIntervalos = function (node) {
    S.shell(node, 'Unión e intersección de intervalos',
      'Escribe dos intervalos y el applet calcula su intersección y su unión, con dibujo y explicación. ' +
      'Formato de entrada: corchete o paréntesis, los dos extremos separados por coma y el cierre: <code>[-2,3)</code>, <code>(0,5]</code>, <code>(-inf,4]</code>. ' +
      'Para decimales, usa punto o separa con punto y coma: <code>(1.5,2.5)</code>. Ejemplo: <code>[-2,3)</code> y <code>(1,5]</code>.',
      [{ id: 'A', label: 'Intervalo A', type: 'text', value: '[-2,3)', ancho: '150px' },
      { id: 'B', label: 'Intervalo B', type: 'text', value: '(1,5]', ancho: '150px' },
      {
        type: 'presets', list: [
          { label: '[-2,3) y (1,5]', apply: function (c) { c.A.value = '[-2,3)'; c.B.value = '(1,5]'; } },
          { label: 'disjuntos', apply: function (c) { c.A.value = '[-4,-1)'; c.B.value = '(2,6]'; } },
          { label: 'encajados', apply: function (c) { c.A.value = '[0,10]'; c.B.value = '(2,4)'; } },
          { label: 'pegados', apply: function (c) { c.A.value = '[0,2)'; c.B.value = '[2,5)'; } },
          { label: 'con semirrectas', apply: function (c) { c.A.value = '(-inf,1]'; c.B.value = '(-3,inf)'; } }
        ]
      }],
      function (v) {
        var A = intervaloTxt(v.A, 'El intervalo A'), B = intervaloTxt(v.B, 'El intervalo B');

        /* intersección: se queda el mayor de los extremos izquierdos y
           el menor de los derechos, con el criterio más restrictivo   */
        var li, lic;
        if (A.a > B.a) { li = A.a; lic = A.ai; }
        else if (B.a > A.a) { li = B.a; lic = B.ai; }
        else { li = A.a; lic = A.ai && B.ai; }
        var ld, ldc;
        if (A.b < B.b) { ld = A.b; ldc = A.bi; }
        else if (B.b < A.b) { ld = B.b; ldc = B.bi; }
        else { ld = A.b; ldc = A.bi && B.bi; }
        var inter = null;
        if (li < ld || (li === ld && lic && ldc)) inter = { a: li, b: ld, ai: lic, bi: ldc };

        /* unión: un solo trozo si se solapan o se tocan cerrando */
        var solapan = !!inter || (A.b === B.a && (A.bi || B.ai)) || (B.b === A.a && (B.bi || A.ai));
        var uni = null, dos = null;
        if (solapan) {
          var ui, uic;
          if (A.a < B.a) { ui = A.a; uic = A.ai; }
          else if (B.a < A.a) { ui = B.a; uic = B.ai; }
          else { ui = A.a; uic = A.ai || B.ai; }
          var ud, udc;
          if (A.b > B.b) { ud = A.b; udc = A.bi; }
          else if (B.b > A.b) { ud = B.b; udc = B.bi; }
          else { ud = A.b; udc = A.bi || B.bi; }
          uni = { a: ui, b: ud, ai: uic, bi: udc };
        } else {
          dos = A.a < B.a ? [A, B] : [B, A];
        }

        var ven = ventana([A, B]);
        var dA = dibuja(A, COL.azul, 22, ven), dB = dibuja(B, COL.verde, 22, ven);

        var h = S.kvs(['$A = ' + intTex(A) + '$', '$B = ' + intTex(B) + '$',
          '$A \\cap B = ' + intTex(inter) + '$',
          '$A \\cup B = ' + (uni ? intTex(uni) : intTex(dos[0]) + ' \\cup ' + intTex(dos[1])) + '$']);

        h += S.rectaReal({
          min: ven.lo, max: ven.hi, W: 1050, H: 330, paso: (ven.hi - ven.lo) / 10, dec: 1,
          tramos: [{ a: dA.tramos[0].a, b: dA.tramos[0].b, col: 'rgba(25,118,210,.28)', alto: 30 },
          { a: dB.tramos[0].a, b: dB.tramos[0].b, col: 'rgba(46,125,50,.30)', alto: 14 }],
          puntos: dA.puntos.concat(dB.puntos),
          titulo: 'A en azul (banda ancha) y B en verde (banda estrecha)',
          cap: 'Donde se superponen las dos bandas está la <b>intersección</b>; todo lo que cubre al menos una de ellas es la <b>unión</b>.'
        });

        var tramosRes = [];
        if (inter) tramosRes.push({ a: Number.isFinite(inter.a) ? inter.a : ven.lo, b: Number.isFinite(inter.b) ? inter.b : ven.hi, col: 'rgba(198,40,40,.30)', alto: 30 });
        (uni ? [uni] : dos).forEach(function (P) {
          tramosRes.push({ a: Number.isFinite(P.a) ? P.a : ven.lo, b: Number.isFinite(P.b) ? P.b : ven.hi, col: 'rgba(224,123,0,.22)', alto: 14 });
        });
        h += S.rectaReal({
          min: ven.lo, max: ven.hi, W: 1050, H: 320, paso: (ven.hi - ven.lo) / 10, dec: 1,
          tramos: tramosRes,
          puntos: (inter ? dibuja(inter, COL.rojo, 20, ven).puntos : []),
          titulo: 'Resultado: intersección (rojo) y unión (naranja)',
          cap: inter ? 'La intersección $' + intTex(inter) + '$ son los números que cumplen <b>las dos</b> condiciones a la vez.'
            : 'La intersección es vacía: ningún número cumple las dos condiciones a la vez.'
        });

        h += S.paso(1, 'Para la <b>intersección</b> se toma el mayor de los extremos izquierdos y el menor de los derechos. ' +
          'Si un extremo coincide en los dos intervalos, solo se incluye cuando lo incluyen ambos.', 'ap-paso-clave');
        h += S.paso(2, inter
          ? 'Aquí: izquierdo $= \\max(' + kf(A.a, 4) + ', ' + kf(B.a, 4) + ')$ y derecho $= \\min(' + kf(A.b, 4) + ', ' + kf(B.b, 4) +
          ')$, luego $A \\cap B = ' + intTex(inter) + '$.'
          : 'Aquí el mayor de los extremos izquierdos queda a la derecha del menor de los derechos, así que no hay ningún número común: $A \\cap B = \\varnothing$.');
        h += S.paso(3, 'Para la <b>unión</b> se comprueba primero si los intervalos se solapan o se tocan. ' +
          (uni ? 'Aquí sí, así que la unión es un único intervalo: $' + intTex(uni) + '$.'
            : 'Aquí no, así que la unión se queda como dos trozos separados y hay que escribirla con el símbolo $\\cup$: $' +
            intTex(dos[0]) + ' \\cup ' + intTex(dos[1]) + '$.'), 'ap-paso-clave');
        h += S.tabla(['Número de prueba', '¿está en A?', '¿está en B?', '¿en $A \\cap B$?', '¿en $A \\cup B$?'],
          [A.a, B.a, inter ? (Number.isFinite(inter.a) && Number.isFinite(inter.b) ? (inter.a + inter.b) / 2 : inter.a) : (Number.isFinite(A.b) ? A.b : 0), B.b]
            .filter(function (z) { return Number.isFinite(z); })
            .map(function (z) {
              var eA = pertenece(A, z), eB = pertenece(B, z);
              return [K(kf(z, 4)), S.badge(eA ? 'sí' : 'no', eA ? 'si' : 'no'), S.badge(eB ? 'sí' : 'no', eB ? 'si' : 'no'),
                S.badge(eA && eB ? 'sí' : 'no', eA && eB ? 'si' : 'no'), S.badge(eA || eB ? 'sí' : 'no', eA || eB ? 'si' : 'no')];
            }));
        h += '<div class="mx-info">Truco de lectura: <b>intersección</b> se traduce por «y» (las dos cosas a la vez) y <b>unión</b> por «o» (al menos una de las dos). ' +
          'Los extremos son los que más fallos provocan: fíjate siempre en si el punto entra o no.</div>';
        return h;
      });
  };

  /* ---------------- 4.3 entornos ---------------------------------- */
  R.entornos = function (node) {
    S.shell(node, 'Entornos y entornos reducidos',
      'Pasa de entorno a intervalo y de intervalo a entorno, y comprueba si un número está en el entorno. ' +
      'Formato de entrada: el <b>centro</b> admite enteros, decimales con coma y fracciones (<code>6,5</code>, <code>-7/2</code>); el <b>radio</b> es positivo. ' +
      'El <b>intervalo</b> se escribe con paréntesis: <code>(3,10)</code>. Ejemplo: centro <code>5</code> y radio <code>2</code> dan $(3, 7)$.',
      [{ id: 'a', label: 'Centro a', type: 'text', value: '5', ancho: '120px' },
      { id: 'r', label: 'Radio r', type: 'number', value: 2, min: 0.1, max: 500, step: 0.5 },
      { id: 'red', label: 'Entorno reducido', type: 'check', value: false },
      { id: 'x', label: 'Número de prueba', type: 'number', value: 5, min: -1000, max: 1000, step: 0.25 },
      { id: 'iv', label: 'Intervalo a convertir', type: 'text', value: '(3,10)', ancho: '150px' },
      {
        type: 'presets', list: [
          { label: 'E(5, 2)', apply: function (c) { c.a.value = '5'; c.r.value = 2; c.x.value = 6; } },
          { label: 'E(2, 4)', apply: function (c) { c.a.value = '2'; c.r.value = 4; c.x.value = -2; } },
          { label: 'E(−10; 0,001)', apply: function (c) { c.a.value = '-10'; c.r.value = 0.001; c.x.value = -10; } },
          { label: 'reducido en 5', apply: function (c) { c.a.value = '5'; c.r.value = 2; c.red.checked = true; c.x.value = 5; } },
          { label: 'intervalo (−8,1)', apply: function (c) { c.iv.value = '(-8,1)'; } }
        ]
      }],
      function (v) {
        var A = S.valorSimbolico(v.a);
        var a = A.v;
        var r = S.real(v.r, 0.0001, 10000, 'El radio');
        var x = S.real(v.x, -100000, 100000, 'El número de prueba');
        var red = !!v.red;

        var I = { a: a - r, b: a + r, ai: false, bi: false };
        var dentro = pertenece(I, x) && !(red && x === a);

        var h = S.resultado(K((red ? 'E^{*}(' : 'E(') + kf(a, 6) + ',\\, ' + kf(r, 6) + ') = ' +
          (red ? '(' + kf(a - r, 6) + ',\\, ' + kf(a, 6) + ') \\cup (' + kf(a, 6) + ',\\, ' + kf(a + r, 6) + ')' : intTex(I))),
          'entorno ' + (red ? 'reducido ' : '') + 'de centro $' + kf(a, 6) + '$ y radio $' + kf(r, 6) + '$');
        h += S.kvs(['Con desigualdades: $' + (red ? '0 < |x - ' + kf(a, 6) + '| < ' + kf(r, 6) : '|x - ' + kf(a, 6) + '| < ' + kf(r, 6)) + '$',
          'Notación de conjunto: $' + (red ? '\\{x \\in \\mathbb{R} : 0 < |x - ' + kf(a, 6) + '| < ' + kf(r, 6) + '\\}' : conjTex(I)) + '$',
          'Amplitud: $2r = ' + kf(2 * r, 6) + '$',
          'Extremos: $a - r = ' + kf(a - r, 6) + '$ y $a + r = ' + kf(a + r, 6) + '$']);

        var ven = ventana([I]);
        var puntos = [{ x: a - r, tex: 'a-r', col: COL.azul, hueco: true, arriba: false },
        { x: a + r, tex: 'a+r', col: COL.azul, hueco: true, arriba: false },
        { x: a, tex: 'a = ' + kf(a, 4), col: red ? COL.rojo : COL.azulOsc, hueco: red },
        { x: x, tex: 'x = ' + kf(x, 4), col: dentro ? COL.verde : COL.rojo, arriba: false }];
        h += S.rectaReal({
          min: ven.lo, max: ven.hi, W: 1050, H: 330, paso: (ven.hi - ven.lo) / 10, dec: 2,
          tramos: red
            ? [{ a: a - r, b: a, col: 'rgba(25,118,210,.22)', alto: 24 }, { a: a, b: a + r, col: 'rgba(25,118,210,.22)', alto: 24 }]
            : [{ a: a - r, b: a + r, col: 'rgba(25,118,210,.22)', alto: 24 }],
          puntos: puntos,
          titulo: (red ? 'Entorno reducido' : 'Entorno') + ' de centro ' + nc(a, 4) + ' y radio ' + nc(r, 4),
          cap: 'El entorno es el compás: se pincha en el centro y se abre el radio. ' + (red ? 'En el entorno reducido el propio centro se quita: el punto queda hueco.' : 'Los extremos quedan huecos porque el entorno es un intervalo abierto.')
        });
        h += S.resultado(S.badge(dentro ? 'sí está en el entorno' : 'no está en el entorno', dentro ? 'si' : 'no'),
          '¿cumple $x = ' + kf(x, 4) + '$ la condición de distancia?');
        h += S.paso(1, 'Definición: $E(a, r)$ son los números que están de $a$ a una <b>distancia menor que</b> $r$, es decir $|x - a| < r$.', 'ap-paso-clave');
        h += S.paso(2, 'Al quitar el valor absoluto: $-r < x - a < r$, y sumando $a$ queda $a - r < x < a + r$, o sea el intervalo abierto $' + intTex(I) + '$.');
        h += S.paso(3, 'Aquí $|' + kf(x, 4) + ' - ' + kf(a, 4) + '| = ' + kf(Math.abs(x - a), 6) + '$, que ' +
          (Math.abs(x - a) < r ? 'sí' : 'no') + ' es menor que el radio $' + kf(r, 4) + '$.' +
          (red ? ' Además, en el entorno reducido hay que exigir $x \\neq a$.' : ''));
        h += S.paso(4, 'El <b>entorno reducido</b> $E^{*}(a, r)$ es el entorno sin su centro: $E(a,r) - \\{a\\}$. Se usa muchísimo en los límites, ' +
          'donde interesa lo que pasa <b>cerca</b> de un punto pero no <b>en</b> el punto.');

        /* Camino inverso: de intervalo a entorno */
        var J = intervaloTxt(v.iv, 'El intervalo a convertir');
        if (!Number.isFinite(J.a) || !Number.isFinite(J.b)) {
          h += '<div class="mx-info">Una semirrecta no se puede escribir como entorno: los entornos son siempre intervalos acotados y abiertos.</div>';
          return h;
        }
        var c2 = (J.a + J.b) / 2, r2 = (J.b - J.a) / 2;
        h += S.resultado(K('E\\left(' + kf(c2, 6) + ',\\, ' + kf(r2, 6) + '\\right)'), 'el intervalo $' + intTex(J) + '$ escrito como entorno');
        h += S.paso(5, 'Centro: el punto medio, $\\dfrac{' + kf(J.a, 4) + ' + ' + kf(J.b, 4) + '}{2} = ' + kf(c2, 6) + '$.');
        h += S.paso(6, 'Radio: la mitad de la amplitud, $\\dfrac{' + kf(J.b, 4) + ' - ' + kf(J.a, 4) + '}{2} = ' + kf(r2, 6) + '$.');
        if (J.ai || J.bi) h += S.paso(7, 'Ojo: el intervalo que has escrito tiene algún extremo cerrado, así que en rigor no es un entorno. ' +
          'Los entornos corresponden solo a intervalos abiertos.', 'ap-paso-avi');
        h += '<div class="mx-info">Resumen de traducciones: $E(a,r) = (a-r,\\, a+r) = \\{x : |x-a| < r\\}$ y, al revés, $(b,c) = E\\left(\\dfrac{b+c}{2},\\, \\dfrac{c-b}{2}\\right)$.</div>';
        return h;
      });
  };

  S.extraA = true;
})();
