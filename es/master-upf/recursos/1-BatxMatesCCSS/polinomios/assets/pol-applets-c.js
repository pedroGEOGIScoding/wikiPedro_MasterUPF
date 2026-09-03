/* =====================================================================
   pol-applets-c.js · Tema 2 «Polinomios y fracciones algebraicas»
   1.º Bachillerato · Matemáticas Aplicadas a las CCSS
   Ruta: 1-BatxMatesCCSS/polinomios/assets/pol-applets-c.js

   MÓDULO C · apartados 6 (factorización), 7 (fracciones algebraicas)
   y 8 (hoja de práctica).

   Claves registradas
     factorizaGuia · detectaNotable · factorComun · mcdMcmPol ·
     signoFactorizado · ecuFactoriza · simplificaFrax · tacharMal ·
     sumaFrax · multiDivFrax · fraxCompleja · entrenaFactoriza ·
     entrenaFrax

   Depende del núcleo window.POL (pol-applets.js). ES5 conservador,
   sin librerías externas y sin módulos.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.POL;
  if (!S) { console.error('[polinomios] falta pol-applets.js'); return; }
  var R = S.registry;
  var K = S.K, KD = S.KD, T = S.pTex, COL = S.COL, Frac = S.Frac;

  /* ==================================================================
     0 · utilidades locales del módulo
     ================================================================== */

  /* Lectura de un polinomio con mensaje de error propio del applet */
  function P(txt, nombre) { return S.parsePol(txt, 'x', nombre || 'el polinomio'); }

  /* Envoltorio de seguridad: ningún applet debe lanzar una excepción
     hacia fuera; los errores se muestran como aviso dentro del panel. */
  function seguro(f) {
    return function (v, ctl, out, api) {
      try { return f(v, ctl, out, api); }
      catch (e) { return '<div class="mx-bad">' + S.esc(e.message) + '</div>'; }
    };
  }

  /* Raíz cuadrada entera exacta de un BigInt (o null si no es exacta) */
  function isqrt(b) {
    if (b < 0n) return null;
    if (b < 2n) return b;
    var x = b, y = (x + 1n) / 2n;
    while (y < x) { x = y; y = (x + b / x) / 2n; }
    return x * x === b ? x : null;
  }
  /* Raíz cúbica entera exacta de un BigInt (o null) */
  function icbrt(b) {
    var neg = b < 0n;
    if (neg) b = -b;
    var r = BigInt(Math.round(Math.cbrt(Number(b))));
    for (var d = -2n; d <= 2n; d++) {
      var c = r + d;
      if (c >= 0n && c * c * c === b) return neg ? -c : c;
    }
    return null;
  }
  /* Raíz cuadrada / cúbica exacta de una fracción (o null) */
  function raizFrac(f) {
    if (f.n < 0n) return null;
    var a = isqrt(f.n), b = isqrt(f.d);
    return (a === null || b === null) ? null : new Frac(a, b);
  }
  function cubicaFrac(f) {
    var a = icbrt(f.n), b = icbrt(f.d);
    return (a === null || b === null) ? null : new Frac(a, b);
  }

  /* Monomio de coeficiente c (Frac) y grado g, en TeX y con paréntesis
     solo cuando hace falta: se usa dentro de las identidades notables. */
  function monTex(c, g) {
    var t = S.pTex(S.pMono(c, g));
    return (c.d === 1n && c.n >= 0n) ? t : '\\left(' + t + '\\right)';
  }

  /* Detección de identidades notables en un polinomio.
     Devuelve una lista de {nombre, izqTex, comenta}. */
  function notablesDe(p) {
    var g = S.pGrado(p), sal = [];
    if (g === 2) {
      var a = p[2], b = p[1], c = p[0];
      var A = raizFrac(a);
      if (A) {
        var Cp = raizFrac(c);
        if (Cp) {
          var dob = new Frac(2).por(A).por(Cp);
          if (b.cmp(dob) === 0) sal.push({
            nombre: 'Cuadrado de una suma',
            izqTex: '\\left(' + T(S.pDe([Cp, A])) + '\\right)^{2}',
            comenta: 'El primer término y el independiente son cuadrados perfectos y el término central es justo el doble producto: $a^{2} + 2ab + b^{2} = (a+b)^{2}$.'
          });
          if (b.cmp(dob.opuesto()) === 0) sal.push({
            nombre: 'Cuadrado de una diferencia',
            izqTex: '\\left(' + T(S.pDe([Cp.opuesto(), A])) + '\\right)^{2}',
            comenta: 'Los extremos son cuadrados perfectos y el término central es el doble producto con signo menos: $a^{2} - 2ab + b^{2} = (a-b)^{2}$.'
          });
        }
        if (b.n === 0n && c.n < 0n) {
          var Cn = raizFrac(c.opuesto());
          if (Cn) sal.push({
            nombre: 'Suma por diferencia',
            izqTex: '\\left(' + T(S.pDe([Cn, A])) + '\\right)\\left(' + T(S.pDe([Cn.opuesto(), A])) + '\\right)',
            comenta: 'Es una diferencia de cuadrados: $a^{2} - b^{2} = (a+b)(a-b)$.'
          });
        }
      }
    }
    if (g === 3) {
      var A3 = cubicaFrac(p[3]), B3 = cubicaFrac(p[0]);
      if (A3 && B3) {
        var cand = S.pDe([B3, A3]);
        if (S.pIgual(S.pPot(cand, 3), p)) sal.push({
          nombre: B3.n < 0n ? 'Cubo de una diferencia' : 'Cubo de una suma',
          izqTex: '\\left(' + T(cand) + '\\right)^{3}',
          comenta: 'Coincide con el desarrollo $(a \\pm b)^{3} = a^{3} \\pm 3a^{2}b + 3ab^{2} \\pm b^{3}$.'
        });
      }
    }
    if (g === 4 && p[3].n === 0n && p[1].n === 0n) {
      sal.push({
        nombre: 'Polinomio bicuadrado',
        izqTex: T(S.pDe([p[0], p[2], p[4]])).replace(/x\^\{2\}/g, 'z^{2}').replace(/([^\^])x/g, '$1z'),
        comenta: 'Solo aparecen potencias pares: con el cambio $z = x^{2}$ se convierte en un polinomio de segundo grado en $z$.'
      });
    }
    return sal;
  }

  /* Discriminante de un polinomio de grado 2 (como Frac) */
  function discri(q) {
    return q[1].por(q[1]).menos(new Frac(4).por(q[2]).por(q[0]));
  }

  /* Lista de raíces reales aproximadas de un factor cuadrático */
  function raicesCuad(q) {
    var D = discri(q).val();
    if (D < 0) return [];
    var a = q[2].val(), b = q[1].val(), r = Math.sqrt(D);
    var x1 = (-b - r) / (2 * a), x2 = (-b + r) / (2 * a);
    return D === 0 ? [x1] : [x1, x2];
  }

  /* Cadena de divisiones por Ruffini que reproduce una factorización */
  function cadenaRuffini(p, F) {
    var actual = S.pCopia(p), pasos = [];
    /* la constante k y el factor x^m salen antes de aplicar Ruffini */
    if (!(F.k.n === 1n && F.k.d === 1n)) actual = S.pEscala(actual, new Frac(F.k.d, F.k.n));
    for (var i = 0; i < (F.xk || 0); i++) actual = actual.slice(1);
    F.lineales.forEach(function (L) {
      for (var m = 0; m < L.mult; m++) {
        var rf = S.ruffini(actual, L.raiz);
        pasos.push({ dividendo: actual, raiz: L.raiz, cociente: rf.cociente });
        actual = rf.cociente;
      }
    });
    return { pasos: pasos, resto: actual };
  }

  /* Etiqueta de una fracción algebraica ya factorizada */
  function fraxFactTex(F) {
    var fn = S.factorizaPol(F.n), fd = S.factorizaPol(F.d);
    return '\\dfrac{' + S.factorizaTexPol(fn) + '}{' + S.factorizaTexPol(fd) + '}';
  }

  /* Lista de restricciones del dominio en TeX */
  function restrTex(lista) {
    if (!lista.length) return 'ningún valor real anula el denominador: el dominio es todo $\\mathbb{R}$.';
    return 'hay que excluir ' + lista.map(function (r) {
      return K('x \\neq ' + r.tex(true));
    }).join(', ') + '.';
  }

  /* ==================================================================
     1 · FACTORIZADOR PASO A PASO   (clave factorizaGuia)
     ================================================================== */
  R.factorizaGuia = function (node) {
    S.shell(node, 'Factorización paso a paso',
      'Escribe el polinomio con <code>^</code> para los exponentes y sin espacios: <code>2x^3-5x+1</code>. ' +
      'También admite productos y potencias como <code>2x(x-1)^2</code>. El applet aplica la estrategia completa ' +
      '(factor común, identidades notables, ecuación de segundo grado y Ruffini con el criterio de la raíz racional) ' +
      'y comprueba al final que el producto de los factores devuelve el polinomio de partida.',
      [{ id: 'p', type: 'text', label: 'Polinomio P(x)', value: 'x^3-4x^2+5x-2', ancho: '24rem' },
      {
        id: 'modo', type: 'select', label: 'Forma de los factores', value: 'normal',
        options: [{ value: 'normal', label: 'con raíces fraccionarias' }, { value: 'entera', label: 'con coeficientes enteros' }]
      },
      {
        type: 'presets', list: [
          { label: 'x³−4x²+5x−2', title: 'Raíz doble x = 1', apply: function (c) { c.p.value = 'x^3-4x^2+5x-2'; } },
          { label: '3x³−12x', title: 'Factor común y suma por diferencia', apply: function (c) { c.p.value = '3x^3-12x'; } },
          { label: 'x⁴−16', title: 'Diferencia de cuadrados dos veces', apply: function (c) { c.p.value = 'x^4-16'; } },
          { label: '2x²+5x−3', title: 'Trinomio con raíz fraccionaria', apply: function (c) { c.p.value = '2x^2+5x-3'; c.modo.value = 'entera'; } },
          { label: 'x⁴−5x²+4', title: 'Bicuadrado', apply: function (c) { c.p.value = 'x^4-5x^2+4'; } },
          { label: 'x³+x²+x+1', title: 'Queda un factor irreducible', apply: function (c) { c.p.value = 'x^3+x^2+x+1'; } },
          { label: 'x⁵−x⁴−2x³', title: 'Factor xᵏ', apply: function (c) { c.p.value = 'x^5-x^4-2x^3'; } }
        ]
      }],
      seguro(function (v) {
        var p = P(v.p, 'el polinomio P(x)');
        if (S.pEsCero(p)) return '<div class="mx-info">El polinomio nulo no se factoriza: cualquier polinomio lo divide.</div>';
        var modo = v.modo === 'entera' ? 'entera' : undefined;
        var F = S.factorizaPol(p);
        var h = S.expr('Polinomio de partida', T(p));
        var n = 0;

        /* paso 1 · factor común numérico y factor x^k */
        n++;
        var t1 = '';
        if (!(F.k.n === 1n && F.k.d === 1n) || F.xk) {
          var piezas = [];
          if (!(F.k.n === 1n && F.k.d === 1n)) piezas.push('el factor numérico ' + K(F.k.tex(true)));
          if (F.xk) piezas.push('el factor ' + K(S.potTex('x', F.xk)) + ' (el término independiente es 0)');
          t1 = 'Sacamos factor común: ' + piezas.join(' y ') + '.';
        } else {
          t1 = 'No hay factor común: el coeficiente principal ya es entero y el término independiente no es 0.';
        }
        h += S.paso(n, t1);

        /* paso 2 · identidades notables */
        n++;
        var nots = notablesDe(p);
        h += S.paso(n, nots.length
          ? 'Reconoces una identidad notable: <b>' + nots[0].nombre + '</b>, ' + KD(T(p) + ' = ' + nots[0].izqTex) +
          nots[0].comenta
          : 'Ninguna identidad notable encaja directamente con este polinomio, así que seguimos con las raíces.');

        /* paso 3 · criterio de la raíz racional */
        n++;
        var cand = S.candidatosRaiz(p);
        h += S.paso(n, 'Criterio de la raíz racional: toda raíz $\\frac{p}{q}$ tiene $p$ divisor del término independiente ' +
          'y $q$ divisor del coeficiente principal. Candidatos: ' +
          S.kvs(cand.slice(0, 24).map(function (c) { return K(c.tex(true)); })) +
          (cand.length > 24 ? '<p class="ap-note">(se muestran los 24 primeros)</p>' : ''));

        /* paso 4 · cadena de Ruffini */
        var ch = cadenaRuffini(p, F);
        ch.pasos.forEach(function (pa) {
          n++;
          h += S.paso(n, 'Como ' + K('P\\left(' + pa.raiz.tex(true) + '\\right) = 0') + ', el binomio ' +
            K(S.factorLinTex(pa.raiz)) + ' divide al polinomio. Dividimos por Ruffini:' +
            S.ruffiniHTML(pa.dividendo, pa.raiz, { cap: 'El resto es 0, así que la división es exacta y el cociente es ' + K(T(pa.cociente)) + '.' }));
        });

        /* paso 5 · lo que queda */
        n++;
        if (F.cuads.length) {
          var q = F.cuads[0].poly;
          if (S.pGrado(q) === 2) {
            var D = discri(q);
            h += S.paso(n, 'Queda el factor de segundo grado ' + K(T(q)) + '. Su discriminante vale ' +
              K('\\Delta = b^{2}-4ac = ' + D.tex(true)) + ', que es ' + (D.val() < 0 ? 'negativo' : 'no negativo') + ': ' +
              (D.val() < 0
                ? 'no tiene raíces reales, luego es <b>irreducible</b> y se deja tal cual.'
                : 'sus raíces no son racionales, así que sobre los racionales el factor se deja sin descomponer.'));
          } else {
            h += S.paso(n, 'Queda el factor ' + K(T(q)) + ', que ya no tiene raíces racionales: ' +
              'con las herramientas del curso se deja sin descomponer.');
          }
        } else {
          h += S.paso(n, 'Ya no queda nada por descomponer: todos los factores son de grado 1.');
        }

        /* resultado y comprobación */
        h += S.expr('Factorización', T(p) + ' = ' + S.factorizaTexPol(F, 'x', modo));
        var ok = S.pIgual(S.factorRehacer(F), p);
        h += '<div class="' + (ok ? 'ap-ok' : 'ap-ko') + '">' +
          S.badge(ok ? 'identidad comprobada' : 'revisa los datos', ok ? 'si' : 'no') +
          ' Al multiplicar de nuevo todos los factores se recupera ' + K(T(S.factorRehacer(F))) + '.</div>';

        var filas = [];
        if (F.xk) filas.push([K('x'), String(F.xk), K('x = 0')]);
        F.lineales.forEach(function (L) {
          filas.push([K(S.factorLinTex(L.raiz)), String(L.mult), K('x = ' + L.raiz.tex(true))]);
        });
        F.cuads.forEach(function (C) { filas.push([K('(' + T(C.poly) + ')'), String(C.mult), 'sin raíz racional']); });
        if (filas.length) h += S.tabla(['Factor', 'Multiplicidad', 'Raíz asociada'], filas);
        return h;
      }));
  };

  /* ==================================================================
     2 · DETECTOR DE IDENTIDADES NOTABLES   (clave detectaNotable)
     ================================================================== */
  R.detectaNotable = function (node) {
    S.shell(node, 'Detector de identidades notables',
      'Escribe un polinomio desarrollado, con <code>^</code> para los exponentes: <code>4x^2+12x+9</code>. ' +
      'El applet comprueba si es el desarrollo de un cuadrado, de un cubo, de una suma por diferencia ' +
      'o si es bicuadrado, y verifica la igualdad multiplicando.',
      [{ id: 'p', type: 'text', label: 'Polinomio', value: '4x^2+12x+9', ancho: '24rem' },
      {
        type: 'presets', list: [
          { label: '4x²+12x+9', title: 'Cuadrado de una suma', apply: function (c) { c.p.value = '4x^2+12x+9'; } },
          { label: 'x²−6x+9', title: 'Cuadrado de una diferencia', apply: function (c) { c.p.value = 'x^2-6x+9'; } },
          { label: '9x²−4', title: 'Suma por diferencia', apply: function (c) { c.p.value = '9x^2-4'; } },
          { label: 'x³+3x²+3x+1', title: 'Cubo de una suma', apply: function (c) { c.p.value = 'x^3+3x^2+3x+1'; } },
          { label: '8x³−12x²+6x−1', title: 'Cubo de una diferencia', apply: function (c) { c.p.value = '8x^3-12x^2+6x-1'; } },
          { label: 'x⁴−13x²+36', title: 'Bicuadrado', apply: function (c) { c.p.value = 'x^4-13x^2+36'; } },
          { label: 'x²+5x+9', title: 'Ninguna identidad', apply: function (c) { c.p.value = 'x^2+5x+9'; } }
        ]
      }],
      seguro(function (v) {
        var p = P(v.p, 'el polinomio');
        var lista = notablesDe(p);
        var h = S.expr('Polinomio', T(p));
        if (!lista.length) {
          h += '<div class="mx-info">' + S.badge('sin identidad notable', 'no') +
            ' Este polinomio no es el desarrollo de un cuadrado ni de un cubo, y tampoco es bicuadrado. ' +
            'Para factorizarlo hay que buscar raíces (ecuación de segundo grado o Ruffini).</div>';
        }
        lista.forEach(function (it, i) {
          h += S.paso(i + 1, '<b>' + it.nombre + '</b><br>' + KD(T(p) + ' = ' + it.izqTex) + it.comenta);
        });
        h += S.tabla(['Identidad', 'Desarrollo'], [
          [K('(a+b)^{2}'), K('a^{2} + 2ab + b^{2}')],
          [K('(a-b)^{2}'), K('a^{2} - 2ab + b^{2}')],
          [K('(a+b)(a-b)'), K('a^{2} - b^{2}')],
          [K('(a+b)^{3}'), K('a^{3} + 3a^{2}b + 3ab^{2} + b^{3}')],
          [K('(a-b)^{3}'), K('a^{3} - 3a^{2}b + 3ab^{2} - b^{3}')]
        ]);
        var F = S.factorizaPol(p);
        h += '<p class="ap-note">Factorización completa sobre los racionales: ' +
          K(T(p) + ' = ' + S.factorizaTexPol(F)) + '.</p>';
        return h;
      }));
  };

  /* ==================================================================
     3 · FACTOR COMÚN GUIADO   (clave factorComun)
     ================================================================== */
  R.factorComun = function (node) {
    S.shell(node, 'Factor común guiado',
      'Escribe el polinomio con <code>^</code> para los exponentes: <code>12x^3-16x^2+4x</code>. ' +
      'El applet busca el mayor factor común (número y potencia de $x$), lo saca y comprueba el resultado ' +
      'multiplicando de nuevo.',
      [{ id: 'p', type: 'text', label: 'Polinomio', value: '12x^3-16x^2+4x', ancho: '24rem' },
      {
        type: 'presets', list: [
          { label: '12x³−16x²+4x', title: 'Factor común 4x', apply: function (c) { c.p.value = '12x^3-16x^2+4x'; } },
          { label: '6x⁵+8x⁴−12x³', title: 'Factor común 2x³', apply: function (c) { c.p.value = '6x^5+8x^4-12x^3'; } },
          { label: '−15x⁶−6x⁴+9x²', title: 'Signo del factor común', apply: function (c) { c.p.value = '-15x^6-6x^4+9x^2'; } },
          { label: '3x²+5x+7', title: 'No hay factor común', apply: function (c) { c.p.value = '3x^2+5x+7'; } },
          { label: 'x/2+x^2', title: 'Coeficientes fraccionarios', apply: function (c) { c.p.value = 'x/2+x^2'; } }
        ]
      }],
      seguro(function (v) {
        var p = P(v.p, 'el polinomio');
        if (S.pEsCero(p)) return '<div class="mx-info">El polinomio nulo no tiene factor común útil.</div>';
        /* menor grado presente */
        var m = 0;
        while (m < p.length && p[m].n === 0n) m++;
        /* contenido entero de los coeficientes */
        var e = S.pEntero(p);
        var k = new Frac(e.contenido, 1).entre(e.factor);
        if (S.pLider(p).n < 0n) k = k.opuesto();
        var comun = S.pEscala(S.pMono(new Frac(1), m), k);
        var resto = S.pDiv(p, comun).q;
        var h = S.expr('Polinomio', T(p));
        var filas = [];
        for (var i = p.length - 1; i >= 0; i--) {
          if (p[i].n === 0n) continue;
          filas.push([K(T(S.pMono(p[i], i))), K(p[i].tex(true)), String(i)]);
        }
        h += S.tabla(['Término', 'Coeficiente', 'Grado'], filas);
        if ((k.n === 1n && k.d === 1n && m === 0)) {
          h += '<div class="mx-info">' + S.badge('sin factor común', 'no') +
            ' Los coeficientes no tienen divisor común distinto de 1 y el término independiente no es cero: ' +
            'no se puede sacar factor común. Prueba con las identidades notables o con Ruffini.</div>';
          return h;
        }
        h += S.paso(1, 'Máximo común divisor de los coeficientes (con el signo del término principal): ' + K(k.tex(true)) + '.');
        h += S.paso(2, m ? 'Menor exponente de $x$ presente en todos los términos: ' + K(String(m)) +
          ', luego se puede sacar ' + K(S.potTex('x', m)) + '.'
          : 'El término independiente no es cero, así que no se puede sacar ninguna potencia de $x$.');
        h += S.paso(3, 'Se divide cada término entre el factor común ' + K(T(comun)) + '.');
        h += S.expr('Resultado', T(p) + ' = ' + S.pTexPar(comun) + '\\left(' + T(resto) + '\\right)');
        var ok = S.pIgual(S.pMult(comun, resto), p);
        h += '<div class="' + (ok ? 'ap-ok' : 'ap-ko') + '">' + S.badge(ok ? 'comprobado' : 'revisa', ok ? 'si' : 'no') +
          ' Al deshacer el paréntesis se recupera ' + K(T(S.pMult(comun, resto))) + '.</div>';
        return h;
      }));
  };

  /* ==================================================================
     4 · m.c.d. Y m.c.m. DE DOS POLINOMIOS   (clave mcdMcmPol)
     ================================================================== */
  R.mcdMcmPol = function (node) {
    S.shell(node, 'm.c.d. y m.c.m. de dos polinomios',
      'Escribe los dos polinomios con <code>^</code> para los exponentes, por ejemplo <code>x^2-1</code> y ' +
      '<code>x^2+2x+1</code>. El applet los factoriza y coloca en una tabla los factores comunes y no comunes ' +
      'con sus exponentes: el m.c.d. toma los comunes al menor exponente y el m.c.m. todos al mayor.',
      [{ id: 'a', type: 'text', label: 'Polinomio P(x)', value: 'x^3-3x+2', ancho: '20rem' },
      { id: 'b', type: 'text', label: 'Polinomio Q(x)', value: '2x^2-2', ancho: '20rem' },
      {
        type: 'presets', list: [
          { label: 'x³−3x+2 y 2x²−2', title: 'Factor repetido', apply: function (c) { c.a.value = 'x^3-3x+2'; c.b.value = '2x^2-2'; } },
          { label: 'x²−1 y x²+2x+1', title: 'Comparten (x+1)', apply: function (c) { c.a.value = 'x^2-1'; c.b.value = 'x^2+2x+1'; } },
          { label: 'x³+x² y x³+2x²+x', title: 'Factor x común', apply: function (c) { c.a.value = 'x^3+x^2'; c.b.value = 'x^3+2x^2+x'; } },
          { label: 'x³+2x²+2x+1 y x³−1', title: 'Comparten un irreducible', apply: function (c) { c.a.value = 'x^3+2x^2+2x+1'; c.b.value = 'x^3-1'; } },
          { label: 'x²−4x+4 y x³−4x', title: 'Multiplicidades distintas', apply: function (c) { c.a.value = 'x^2-4x+4'; c.b.value = 'x^3-4x'; } },
          { label: 'x²+x+1 y x−2', title: 'Primos entre sí', apply: function (c) { c.a.value = 'x^2+x+1'; c.b.value = 'x-2'; } }
        ]
      }],
      seguro(function (v) {
        var A = P(v.a, 'el polinomio P(x)'), B = P(v.b, 'el polinomio Q(x)');
        if (S.pEsCero(A) || S.pEsCero(B)) return '<div class="mx-info">Los dos polinomios deben ser distintos del polinomio nulo.</div>';
        var FA = S.factorizaPol(A), FB = S.factorizaPol(B);
        var LA = S.factoresLista(A), LB = S.factoresLista(B);
        var h = S.expr('P(x)', T(A) + ' = ' + S.factorizaTexPol(FA));
        h += S.expr('Q(x)', T(B) + ' = ' + S.factorizaTexPol(FB));

        var mapa = {}, orden = [];
        function anota(L, campo) {
          L.factores.forEach(function (f) {
            if (!mapa[f.clave]) { mapa[f.clave] = { tex: S.pTexPar(f.poly), a: 0, b: 0 }; orden.push(f.clave); }
            mapa[f.clave][campo] = f.mult;
          });
        }
        anota(LA, 'a'); anota(LB, 'b');
        var filas = orden.map(function (c) {
          var f = mapa[c];
          var comun = f.a > 0 && f.b > 0;
          return {
            clase: comun ? 'ap-ok-row' : '',
            celdas: [K(f.tex), f.a ? String(f.a) : '—', f.b ? String(f.b) : '—',
            comun ? String(Math.min(f.a, f.b)) : '—', String(Math.max(f.a, f.b)),
            comun ? S.badge('común', 'si') : S.badge('no común', 'info')]
          };
        });
        h += S.tabla(['Factor irreducible', 'exponente en P', 'exponente en Q', 'en el m.c.d.', 'en el m.c.m.', ''], filas);

        var D = S.mcdPol(A, B), M = S.mcmPol(A, B);
        h += S.expr('m.c.d.', '\\text{m.c.d.}\\left(P,Q\\right) = ' + S.factorizaTexPol(S.factorizaPol(D)));
        h += S.expr('m.c.m.', '\\text{m.c.m.}\\left(P,Q\\right) = ' + S.factorizaTexPol(S.factorizaPol(M)));
        if (S.pGrado(D) === 0) h += '<div class="mx-info">El m.c.d. es una constante: los dos polinomios son <b>primos entre sí</b>.</div>';

        /* comprobación de la relación mcd · mcm = P · Q (salvo constante) */
        var izq = S.pMult(D, M), der = S.pMult(A, B);
        var kk = S.pLider(der).entre(S.pLider(izq));
        var ok = S.pIgual(S.pEscala(izq, kk), der);
        h += '<div class="' + (ok ? 'ap-ok' : 'ap-ko') + '">' + S.badge(ok ? 'relación comprobada' : 'revisa', ok ? 'si' : 'no') +
          ' Se cumple ' + K('\\text{m.c.d.} \\cdot \\text{m.c.m.} = ' + (kk.n === 1n && kk.d === 1n ? '' : kk.tex(true) + '\\,') +
          '\\text{ veces } P \\cdot Q') +
          ' (la constante aparece porque el m.c.d. y el m.c.m. de polinomios están definidos salvo un factor numérico).</div>';
        h += '<p class="ap-note">Aplicación directa: el m.c.m. de los denominadores es el denominador común que se usa ' +
          'al sumar fracciones algebraicas; el m.c.d. de numerador y denominador es lo que se cancela al simplificar.</p>';
        return h;
      }));
  };

  /* ==================================================================
     5 · SIGNO DE UN POLINOMIO FACTORIZADO   (clave signoFactorizado)
     ================================================================== */
  R.signoFactorizado = function (node) {
    S.shell(node, 'Signo de un polinomio factorizado',
      'Escribe el polinomio, por ejemplo <code>x^3-4x^2+5x-2</code> o <code>(x+2)(x-1)^2</code>. ' +
      'El applet lo factoriza, marca sus raíces reales sobre la recta y colorea cada intervalo según el signo ' +
      'del producto de los factores: verde si $P(x)>0$ y rojo si $P(x)<0$.',
      [{ id: 'p', type: 'text', label: 'Polinomio P(x)', value: 'x^3-x', ancho: '24rem' },
      {
        type: 'presets', list: [
          { label: 'x³−x', title: 'Tres raíces simples', apply: function (c) { c.p.value = 'x^3-x'; } },
          { label: '(x+2)(x−1)²', title: 'Raíz doble: no cambia de signo', apply: function (c) { c.p.value = '(x+2)(x-1)^2'; } },
          { label: 'x²+1', title: 'Siempre positivo', apply: function (c) { c.p.value = 'x^2+1'; } },
          { label: '−x²+4', title: 'Coeficiente principal negativo', apply: function (c) { c.p.value = '-x^2+4'; } },
          { label: 'x²−2', title: 'Raíces irracionales', apply: function (c) { c.p.value = 'x^2-2'; } },
          { label: 'x⁴−5x²+4', title: 'Cuatro raíces', apply: function (c) { c.p.value = 'x^4-5x^2+4'; } }
        ]
      }],
      seguro(function (v) {
        var p = P(v.p, 'el polinomio P(x)');
        if (S.pEsCero(p) || S.pGrado(p) === 0)
          return '<div class="mx-info">Escribe un polinomio de grado 1 o mayor: una constante tiene el mismo signo en toda la recta.</div>';
        var F = S.factorizaPol(p);
        var pendiente = false;
        F.cuads.forEach(function (C) { if (S.pGrado(C.poly) > 2) pendiente = true; });
        var raices = [];
        if (F.xk) raices.push({ x: 0, tex: '0', mult: F.xk });
        F.lineales.forEach(function (L) { raices.push({ x: L.raiz.val(), tex: L.raiz.tex(true), mult: L.mult }); });
        F.cuads.forEach(function (C) {
          if (S.pGrado(C.poly) === 2) raicesCuad(C.poly).forEach(function (r) {
            raices.push({ x: r, tex: S.kf(r, 3), mult: 1, aprox: true });
          });
        });
        raices.sort(function (a, b) { return a.x - b.x; });

        var h = S.expr('Factorización', T(p) + ' = ' + S.factorizaTexPol(F));
        if (pendiente) h += '<div class="mx-info">Queda un factor de grado mayor que 2 sin raíces racionales: ' +
          'el estudio del signo que sigue solo tiene en cuenta las raíces que el applet sabe calcular.</div>';

        var min, max;
        if (!raices.length) { min = -3; max = 3; }
        else {
          min = raices[0].x - 2; max = raices[raices.length - 1].x + 2;
          if (max - min < 4) { var c0 = (min + max) / 2; min = c0 - 2; max = c0 + 2; }
        }
        var cortes = [min].concat(raices.map(function (r) { return r.x; })).concat([max]);
        var tramos = [], filas = [];
        for (var i = 0; i < cortes.length - 1; i++) {
          var a = cortes[i], b = cortes[i + 1];
          if (b - a < 1e-9) continue;
          var med = (a + b) / 2;
          var val = S.pEvalNum(p, med);
          var pos = val > 0;
          tramos.push({ a: a, b: b, col: pos ? 'rgba(46,125,50,.26)' : 'rgba(198,40,40,.24)', alto: 22 });
          filas.push([
            K('\\left(' + (i === 0 ? '-\\infty' : S.kf(a, 3)) + ',\\; ' + (i === cortes.length - 2 ? '+\\infty' : S.kf(b, 3)) + '\\right)'),
            K('P\\left(' + S.kf(med, 2) + '\\right) = ' + S.kf(val, 3)),
            pos ? S.badge('P(x) > 0', 'si') : S.badge('P(x) < 0', 'no')
          ]);
        }
        h += S.rectaReal({
          min: min, max: max, W: 1000, H: 300,
          paso: Math.max(1, Math.round((max - min) / 10)),
          dec: 0,
          titulo: 'Signo de P(x) sobre la recta real',
          tramos: tramos,
          puntos: raices.map(function (r) { return { x: r.x, tex: 'x = ' + (r.aprox ? r.tex : r.tex), hueco: false, col: COL.azulOsc }; }),
          label: 'Recta real con las raíces y el signo de cada intervalo',
          cap: 'Verde: el polinomio es positivo. Rojo: es negativo. Los puntos azules son las raíces, donde vale 0.'
        });
        h += S.leyenda([['rgba(46,125,50,.6)', 'intervalos donde $P(x)>0$'], ['rgba(198,40,40,.6)', 'intervalos donde $P(x)<0$']]);
        h += S.tabla(['Intervalo', 'Valor de prueba', 'Signo'], filas);
        var multiples = raices.filter(function (r) { return r.mult > 1; });
        h += '<p class="ap-note">' + (multiples.length
          ? 'Las raíces de multiplicidad par no cambian el signo (aquí ' +
          multiples.map(function (r) { return K('x = ' + r.tex) + ' con multiplicidad ' + r.mult; }).join(', ') +
          '): el polinomio toca el eje y vuelve por el mismo lado.'
          : 'Todas las raíces son simples, así que el signo cambia al pasar por cada una de ellas.') + '</p>';
        return h;
      }));
  };

  /* ==================================================================
     6 · ECUACIONES POLINÓMICAS POR FACTORIZACIÓN   (clave ecuFactoriza)
     ================================================================== */
  R.ecuFactoriza = function (node) {
    S.shell(node, 'Resolver ecuaciones por factorización',
      'Escribe el polinomio del miembro izquierdo de la ecuación $P(x)=0$, por ejemplo <code>x^3-4x^2+x+6</code>. ' +
      'El applet factoriza, aplica la propiedad del producto nulo y comprueba cada solución sustituyendo.',
      [{ id: 'p', type: 'text', label: 'P(x) en P(x) = 0', value: 'x^3-4x^2+x+6', ancho: '24rem' },
      {
        type: 'presets', list: [
          { label: 'x³−4x²+x+6 = 0', title: 'Tres soluciones enteras', apply: function (c) { c.p.value = 'x^3-4x^2+x+6'; } },
          { label: 'x⁴−5x²+4 = 0', title: 'Bicuadrada', apply: function (c) { c.p.value = 'x^4-5x^2+4'; } },
          { label: '2x³−3x²−2x+3 = 0', title: 'Con solución fraccionaria', apply: function (c) { c.p.value = '2x^3-3x^2-2x+3'; } },
          { label: 'x³+x²+x+1 = 0', title: 'Solo una solución real', apply: function (c) { c.p.value = 'x^3+x^2+x+1'; } },
          { label: 'x³−2x²−4x+8 = 0', title: 'Solución doble', apply: function (c) { c.p.value = 'x^3-2x^2-4x+8'; } },
          { label: 'x²−2 = 0', title: 'Soluciones irracionales', apply: function (c) { c.p.value = 'x^2-2'; } }
        ]
      }],
      seguro(function (v) {
        var p = P(v.p, 'el polinomio P(x)');
        if (S.pEsCero(p)) return '<div class="mx-info">La ecuación $0=0$ la cumple cualquier número: no tiene interés.</div>';
        if (S.pGrado(p) === 0) return '<div class="mx-info">La ecuación ' + K(T(p) + ' = 0') + ' no tiene solución: el miembro izquierdo es una constante no nula.</div>';
        var F = S.factorizaPol(p);
        var h = S.expr('Ecuación', T(p) + ' = 0');
        h += S.paso(1, 'Se factoriza el polinomio: ' + KD(T(p) + ' = ' + S.factorizaTexPol(F)));
        h += S.paso(2, 'Propiedad del producto nulo: un producto es cero si y solo si alguno de sus factores es cero. ' +
          'Cada factor de grado 1 da una solución; el factor numérico nunca se anula.');
        var filas = [];
        if (F.xk) filas.push([K('x^{' + F.xk + '} = 0'), K('x = 0'), String(F.xk)]);
        F.lineales.forEach(function (L) {
          filas.push([K(S.factorLinTex(L.raiz) + ' = 0'), K('x = ' + L.raiz.tex(true)), String(L.mult)]);
        });
        F.cuads.forEach(function (C) {
          if (S.pGrado(C.poly) === 2) {
            var D = discri(C.poly);
            if (D.val() < 0) filas.push([K(T(C.poly) + ' = 0'), 'sin solución real ($\\Delta = ' + D.tex(true) + ' < 0$)', '—']);
            else {
              var rr = raicesCuad(C.poly);
              filas.push([K(T(C.poly) + ' = 0'),
              rr.map(function (r) { return K('x \\approx ' + S.kf(r, 4)); }).join(' y '), '—']);
            }
          } else {
            filas.push([K(T(C.poly) + ' = 0'), 'no se resuelve con las técnicas del curso', '—']);
          }
        });
        h += S.tabla(['Factor igualado a cero', 'Solución', 'Multiplicidad'], filas);
        var comp = [];
        if (F.xk) comp.push({ r: new Frac(0), mult: F.xk });
        F.lineales.forEach(function (L) { comp.push({ r: L.raiz, mult: L.mult }); });
        if (comp.length) {
          h += S.tabla(['Solución racional', 'Comprobación P(x)'], comp.map(function (c) {
            var val = S.pEval(p, c.r).valor;
            return [K('x = ' + c.r.tex(true)),
            K('P\\left(' + c.r.tex(true) + '\\right) = ' + val.tex(true)) + ' ' + S.badge(val.n === 0n ? 'se anula' : 'no se anula', val.n === 0n ? 'si' : 'no')];
          }));
          h += S.expr('Soluciones racionales', 'x = ' + comp.map(function (c) { return c.r.tex(true); }).join(',\\quad x = '));
        } else {
          h += '<div class="mx-info">Esta ecuación no tiene soluciones racionales: el criterio de la raíz racional descarta todos los candidatos.</div>';
        }
        h += '<p class="ap-note">Recuerda que el número de soluciones reales, contadas con su multiplicidad, nunca pasa del grado: ' +
          'aquí el grado es ' + K(String(S.pGrado(p))) + '.</p>';
        return h;
      }));
  };

  /* ==================================================================
     7 · SIMPLIFICADOR DE FRACCIONES ALGEBRAICAS   (clave simplificaFrax)
     ================================================================== */
  R.simplificaFrax = function (node) {
    S.shell(node, 'Simplificar fracciones algebraicas',
      'Escribe el numerador y el denominador por separado, con <code>^</code> para los exponentes: ' +
      'numerador <code>x^2-1</code> y denominador <code>x^2+2x+1</code>. El applet factoriza los dos, ' +
      'cancela el máximo común divisor y destaca los valores que quedan excluidos del dominio.',
      [{ id: 'n', type: 'text', label: 'Numerador', value: 'x^3-5x^2+7x-3', ancho: '20rem' },
      { id: 'd', type: 'text', label: 'Denominador', value: 'x^3-2x^2-5x+6', ancho: '20rem' },
      {
        type: 'presets', list: [
          { label: '(x³−5x²+7x−3)/(x³−2x²−5x+6)', title: 'Se cancelan dos factores', apply: function (c) { c.n.value = 'x^3-5x^2+7x-3'; c.d.value = 'x^3-2x^2-5x+6'; } },
          { label: '(x²−1)/(x²+2x+1)', title: 'Clásico', apply: function (c) { c.n.value = 'x^2-1'; c.d.value = 'x^2+2x+1'; } },
          { label: '(x²−4)/(x²−4x+4)', title: 'Diferencia de cuadrados', apply: function (c) { c.n.value = 'x^2-4'; c.d.value = 'x^2-4x+4'; } },
          { label: '(2x²+4x)/(2x−4)', title: 'Factor común', apply: function (c) { c.n.value = '2x^2+4x'; c.d.value = '2x-4'; } },
          { label: '(x⁴−1)/(x²+1)', title: 'Cancela un irreducible', apply: function (c) { c.n.value = 'x^4-1'; c.d.value = 'x^2+1'; } },
          { label: '(x+2)/(x²+3)', title: 'Ya es irreducible', apply: function (c) { c.n.value = 'x+2'; c.d.value = 'x^2+3'; } }
        ]
      }],
      seguro(function (v) {
        var n = P(v.n, 'el numerador'), d = P(v.d, 'el denominador');
        if (S.pEsCero(d)) return '<div class="mx-info">El denominador no puede ser el polinomio nulo: no existe la fracción.</div>';
        var Fx = new S.Frax(n, d);
        var res = S.fraxSimplifica(Fx);
        var h = S.expr('Fracción de partida', Fx.tex());
        h += S.paso(1, 'Se factorizan numerador y denominador:' + KD(Fx.tex() + ' = ' + fraxFactTex(Fx)));
        h += S.paso(2, 'Valores que anulan el denominador (hay que excluirlos <b>antes</b> de simplificar): ' +
          restrTex(res.restricciones));
        h += S.paso(3, res.simplificable
          ? 'El máximo común divisor de numerador y denominador es ' + K(S.pTexPar(res.comun)) +
          '. Se divide arriba y abajo entre ese factor común.'
          : 'El m.c.d. de numerador y denominador es una constante: la fracción ya está simplificada al máximo.');
        h += S.expr('Fracción simplificada', Fx.tex() + ' = ' + res.frax.tex());
        var nuevas = S.raicesDe(res.frax.d);
        h += '<div class="ap-card"><b>Dominio.</b> La fracción inicial está definida salvo en ' +
          (res.restricciones.length ? res.restricciones.map(function (r) { return K('x = ' + r.tex(true)); }).join(', ') : 'ningún punto') +
          '. La fracción simplificada solo pierde sentido en ' +
          (nuevas.length ? nuevas.map(function (r) { return K('x = ' + r.tex(true)); }).join(', ') : 'ningún punto') +
          ', pero las dos expresiones son iguales <b>solo</b> donde ambas tienen sentido: los valores cancelados siguen fuera del dominio.</div>';
        if (S.pGrado(res.frax.d) === 0) h += '<div class="mx-info">Después de simplificar el denominador es una constante: la fracción es en realidad un polinomio (excepto en los puntos excluidos).</div>';
        return h;
      }));
  };

  /* ==================================================================
     8 · TACHAR MAL FRENTE A SIMPLIFICAR BIEN   (clave tacharMal)
     ================================================================== */
  R.tacharMal = function (node) {
    S.shell(node, 'Tachar mal frente a simplificar bien',
      'El error más frecuente con fracciones algebraicas es tachar <b>sumandos</b> en lugar de <b>factores</b>. ' +
      'Escribe numerador y denominador (por ejemplo <code>x^2+3</code> y <code>x+3</code>) y un valor de prueba; ' +
      'el applet hace el tachado incorrecto, la simplificación correcta y compara los resultados numéricos.',
      [{ id: 'n', type: 'text', label: 'Numerador', value: 'x^2+3', ancho: '18rem' },
      { id: 'd', type: 'text', label: 'Denominador', value: 'x+3', ancho: '18rem' },
      { id: 'x0', type: 'number', label: 'Valor de prueba x', value: 2, min: -20, max: 20 },
      {
        type: 'presets', list: [
          { label: '(x²+3)/(x+3)', title: 'Tachar el 3 es un error', apply: function (c) { c.n.value = 'x^2+3'; c.d.value = 'x+3'; c.x0.value = 2; } },
          { label: '(x²+2x)/(x²−4)', title: 'Aquí sí hay factores comunes', apply: function (c) { c.n.value = 'x^2+2x'; c.d.value = 'x^2-4'; c.x0.value = 3; } },
          { label: '(2x+6)/(x+6)', title: 'El 6 no se puede tachar', apply: function (c) { c.n.value = '2x+6'; c.d.value = 'x+6'; c.x0.value = 1; } },
          { label: '(x²−1)/(x−1)', title: 'Simplificación correcta', apply: function (c) { c.n.value = 'x^2-1'; c.d.value = 'x-1'; c.x0.value = 4; } },
          { label: '(x³+x)/(x²+x)', title: 'Factor común x', apply: function (c) { c.n.value = 'x^3+x'; c.d.value = 'x^2+x'; c.x0.value = 2; } }
        ]
      }],
      seguro(function (v) {
        var n = P(v.n, 'el numerador'), d = P(v.d, 'el denominador');
        if (S.pEsCero(d)) return '<div class="mx-info">El denominador no puede ser el polinomio nulo.</div>';
        var x0 = S.entero(v.x0, -20, 20, 'El valor de prueba');
        var Fx = new S.Frax(n, d);
        var h = S.expr('Fracción', Fx.tex());

        /* tachado incorrecto: buscar un término del mismo grado en los dos */
        var grado = -1;
        for (var i = 0; i < Math.min(n.length, d.length); i++) {
          if (n[i].n !== 0n && d[i].n !== 0n && n[i].cmp(d[i]) === 0) { grado = i; break; }
        }
        if (grado < 0) {
          for (var j = 0; j < Math.min(n.length, d.length); j++) {
            if (n[j].n !== 0n && d[j].n !== 0n) { grado = j; break; }
          }
        }
        var res = S.fraxSimplifica(Fx);
        if (grado >= 0) {
          var n2 = S.pCopia(n), d2 = S.pCopia(d);
          n2[grado] = new Frac(0); d2[grado] = new Frac(0);
          n2 = S.pRecorta(n2); d2 = S.pRecorta(d2);
          var termino = T(S.pMono(n[grado], grado));
          var malTex = S.pEsCero(d2) ? null : '\\dfrac{' + T(n2) + '}{' + T(d2) + '}';
          h += '<div class="ap-card ap-card-ko"><span class="ap-card-tit">Lo que NO se puede hacer</span>' +
            'Tachar el sumando ' + K(termino) + ' arriba y abajo: ' +
            (malTex ? KD(Fx.tex() + ' \\ne ' + malTex) : KD(Fx.tex() + ' \\ne \\text{(el denominador se anularía)}')) +
            'Los sumandos <b>no</b> se cancelan. Solo se cancelan los factores de un producto, porque cancelar es ' +
            'dividir numerador y denominador entre el mismo polinomio, y una suma no se puede dividir término a término.</div>';
          var vn = S.pEvalNum(n, x0), vd = S.pEvalNum(d, x0);
          var filas = [];
          if (vd !== 0) {
            filas.push(['expresión original', K('\\dfrac{' + S.kf(vn, 3) + '}{' + S.kf(vd, 3) + '} = ' + S.kf(vn / vd, 4))]);
            if (malTex) {
              var wn = S.pEvalNum(n2, x0), wd = S.pEvalNum(d2, x0);
              filas.push(['tras el tachado incorrecto', wd === 0 ? 'no se puede evaluar' : K('\\dfrac{' + S.kf(wn, 3) + '}{' + S.kf(wd, 3) + '} = ' + S.kf(wn / wd, 4))]);
            }
            var sn = S.pEvalNum(res.frax.n, x0), sd = S.pEvalNum(res.frax.d, x0);
            filas.push(['tras simplificar bien', sd === 0 ? 'no se puede evaluar' : K('\\dfrac{' + S.kf(sn, 3) + '}{' + S.kf(sd, 3) + '} = ' + S.kf(sn / sd, 4))]);
            h += S.tabla(['Expresión evaluada en x = ' + S.etq(x0, 0), 'Valor'], filas);
          } else {
            h += '<div class="mx-info">En ' + K('x = ' + S.kf(x0, 0)) + ' el denominador se anula: elige otro valor de prueba para comparar.</div>';
          }
        }
        h += '<div class="ap-card ap-card-ok"><span class="ap-card-tit">Lo que sí se puede hacer</span>' +
          'Factorizar y cancelar factores comunes:' + KD(Fx.tex() + ' = ' + fraxFactTex(Fx) + ' = ' + res.frax.tex()) +
          (res.simplificable
            ? 'El factor común cancelado es ' + K(S.pTexPar(res.comun)) + '.'
            : 'Aquí numerador y denominador no tienen ningún factor común: la fracción ya estaba simplificada, ' +
            'y por eso cualquier «tachado» habría sido un error.') +
          '<br>Restricciones del dominio: ' + restrTex(res.restricciones) + '</div>';
        return h;
      }));
  };

  /* ==================================================================
     9 · SUMA Y RESTA DE FRACCIONES ALGEBRAICAS   (clave sumaFrax)
     ================================================================== */
  R.sumaFrax = function (node) {
    S.shell(node, 'Sumar y restar fracciones algebraicas',
      'Escribe los cuatro polinomios (dos numeradores y dos denominadores), por ejemplo <code>1</code>, ' +
      '<code>x-1</code>, <code>1</code>, <code>x+1</code>. El applet calcula el m.c.m. de los denominadores, ' +
      'amplía cada fracción, suma o resta los numeradores y simplifica el resultado.',
      [{ id: 'n1', type: 'text', label: 'Numerador 1', value: 'x+3', ancho: '14rem' },
      { id: 'd1', type: 'text', label: 'Denominador 1', value: 'x^2-1', ancho: '14rem' },
      { id: 'op', type: 'select', label: 'Operación', value: '+', options: [{ value: '+', label: 'sumar' }, { value: '-', label: 'restar' }] },
      { id: 'n2', type: 'text', label: 'Numerador 2', value: '2x-5', ancho: '14rem' },
      { id: 'd2', type: 'text', label: 'Denominador 2', value: 'x+1', ancho: '14rem' },
      {
        type: 'presets', list: [
          { label: '(x+3)/(x²−1) + (2x−5)/(x+1)', title: 'El m.c.m. es x²−1', apply: function (c) { c.n1.value = 'x+3'; c.d1.value = 'x^2-1'; c.n2.value = '2x-5'; c.d2.value = 'x+1'; c.op.value = '+'; } },
          { label: '1/(x−1) + 1/(x+1)', title: 'Denominadores primos entre sí', apply: function (c) { c.n1.value = '1'; c.d1.value = 'x-1'; c.n2.value = '1'; c.d2.value = 'x+1'; c.op.value = '+'; } },
          { label: '(x²−4x+4)/(x²−4) − 6x/(x+2)', title: 'Resta con factorización', apply: function (c) { c.n1.value = 'x^2-4x+4'; c.d1.value = 'x^2-4'; c.n2.value = '6x'; c.d2.value = 'x+2'; c.op.value = '-'; } },
          { label: '(3x−2)/(x²+x) + 4/(x²+x−2)', title: 'm.c.m. con tres factores', apply: function (c) { c.n1.value = '3x-2'; c.d1.value = 'x^2+x'; c.n2.value = '4'; c.d2.value = 'x^2+x-2'; c.op.value = '+'; } },
          { label: '2x/(x+1) − 3/x', title: 'Denominadores sencillos', apply: function (c) { c.n1.value = '2x'; c.d1.value = 'x+1'; c.n2.value = '3'; c.d2.value = 'x'; c.op.value = '-'; } }
        ]
      }],
      seguro(function (v) {
        var A = new S.Frax(P(v.n1, 'el numerador de la primera fracción'), P(v.d1, 'el denominador de la primera fracción'));
        var B = new S.Frax(P(v.n2, 'el numerador de la segunda fracción'), P(v.d2, 'el denominador de la segunda fracción'));
        var signo = v.op === '-' ? -1 : 1;
        var SU = S.fraxSuma(A, B, signo);
        var op = signo > 0 ? ' + ' : ' - ';
        var h = S.expr('Operación', A.tex() + op + B.tex());
        h += S.paso(1, 'Se factorizan los denominadores:' +
          KD(T(A.d) + ' = ' + S.factorizaTexPol(S.factorizaPol(A.d)) + ' \\qquad ' +
            T(B.d) + ' = ' + S.factorizaTexPol(S.factorizaPol(B.d))));
        h += S.paso(2, 'El denominador común es el m.c.m. de los dos: ' +
          KD('\\text{m.c.m.} = ' + S.factorizaTexPol(S.factorizaPol(SU.comun)) + ' = ' + T(SU.comun)));
        h += S.paso(3, 'Cada fracción se amplía multiplicando arriba y abajo por lo que le falta: la primera por ' +
          K(S.pTexPar(SU.fa)) + ' y la segunda por ' + K(S.pTexPar(SU.fb)) + '.' +
          KD('\\dfrac{' + T(SU.na) + '}{' + T(SU.comun) + '}' + op + '\\dfrac{' + T(SU.nb) + '}{' + T(SU.comun) + '}'));
        h += S.paso(4, 'Con el mismo denominador, se opera solo con los numeradores:' +
          KD('\\dfrac{\\left(' + T(SU.na) + '\\right)' + op + '\\left(' + T(SU.nb) + '\\right)}{' + T(SU.comun) + '} = ' + SU.bruto.tex()));
        var res = S.fraxSimplifica(SU.bruto);
        h += S.paso(5, res.simplificable
          ? 'El resultado todavía se puede simplificar: se cancela el factor común ' + K(S.pTexPar(res.comun)) + '.'
          : 'El resultado ya está simplificado: numerador y denominador no tienen factores comunes.');
        h += S.expr('Resultado', A.tex() + op + B.tex() + ' = ' + res.frax.tex());
        h += S.expr('Con el denominador factorizado', res.frax.tex() + ' = \\dfrac{' + T(res.frax.n) + '}{' +
          S.factorizaTexPol(S.factorizaPol(res.frax.d)) + '}');
        var todas = {};
        S.raicesDe(A.d).concat(S.raicesDe(B.d)).forEach(function (r) { todas[r.txt()] = r; });
        var lista = Object.keys(todas).map(function (k2) { return todas[k2]; });
        h += '<div class="ap-card"><b>Dominio.</b> La operación solo tiene sentido donde ninguno de los denominadores ' +
          'de partida se anula: ' + restrTex(lista) + ' Deja siempre el denominador factorizado para verlo de un vistazo.</div>';
        return h;
      }));
  };

  /* ==================================================================
     10 · PRODUCTO, DIVISIÓN E INVERSA   (clave multiDivFrax)
     ================================================================== */
  R.multiDivFrax = function (node) {
    S.shell(node, 'Producto, división e inversa de fracciones algebraicas',
      'Escribe las dos fracciones y elige la operación. Ejemplo: numeradores <code>x^2-1</code> y <code>x</code>, ' +
      'denominadores <code>x</code> y <code>x+1</code>. En el producto se multiplican numeradores y denominadores; ' +
      'en la división se multiplica la primera por la <b>inversa</b> de la segunda.',
      [{ id: 'n1', type: 'text', label: 'Numerador 1', value: 'x^2-1', ancho: '14rem' },
      { id: 'd1', type: 'text', label: 'Denominador 1', value: 'x^2+x', ancho: '14rem' },
      { id: 'op', type: 'select', label: 'Operación', value: '*', options: [{ value: '*', label: 'multiplicar' }, { value: ':', label: 'dividir' }] },
      { id: 'n2', type: 'text', label: 'Numerador 2', value: 'x+1', ancho: '14rem' },
      { id: 'd2', type: 'text', label: 'Denominador 2', value: 'x-1', ancho: '14rem' },
      {
        type: 'presets', list: [
          { label: '(x²−1)/(x²+x) · (x+1)/(x−1)', title: 'Producto con cancelaciones', apply: function (c) { c.n1.value = 'x^2-1'; c.d1.value = 'x^2+x'; c.n2.value = 'x+1'; c.d2.value = 'x-1'; c.op.value = '*'; } },
          { label: '(x²−4)/(x+3) : (x−2)/(x+3)', title: 'División sencilla', apply: function (c) { c.n1.value = 'x^2-4'; c.d1.value = 'x+3'; c.n2.value = 'x-2'; c.d2.value = 'x+3'; c.op.value = ':'; } },
          { label: '(x²+2x+1)/(x²−1) : (x+1)/x', title: 'División con factorización', apply: function (c) { c.n1.value = 'x^2+2x+1'; c.d1.value = 'x^2-1'; c.n2.value = 'x+1'; c.d2.value = 'x'; c.op.value = ':'; } },
          { label: '3x/(x−2) · (x²−4)/(9x²)', title: 'Coeficientes numéricos', apply: function (c) { c.n1.value = '3x'; c.d1.value = 'x-2'; c.n2.value = 'x^2-4'; c.d2.value = '9x^2'; c.op.value = '*'; } },
          { label: '1/(x+1) : 1/(x−1)', title: 'Solo inversas', apply: function (c) { c.n1.value = '1'; c.d1.value = 'x+1'; c.n2.value = '1'; c.d2.value = 'x-1'; c.op.value = ':'; } }
        ]
      }],
      seguro(function (v) {
        var A = new S.Frax(P(v.n1, 'el numerador de la primera fracción'), P(v.d1, 'el denominador de la primera fracción'));
        var B = new S.Frax(P(v.n2, 'el numerador de la segunda fracción'), P(v.d2, 'el denominador de la segunda fracción'));
        var divide = v.op === ':';
        if (divide && S.pEsCero(B.n))
          return '<div class="mx-info">No se puede dividir entre una fracción de numerador nulo: sería dividir entre 0.</div>';
        var h = S.expr('Operación', A.tex() + (divide ? ' : ' : ' \\cdot ') + B.tex());
        if (divide) {
          h += S.paso(1, 'La inversa de la segunda fracción se obtiene intercambiando numerador y denominador:' +
            KD('\\left(' + B.tex() + '\\right)^{-1} = \\dfrac{' + T(B.d) + '}{' + T(B.n) + '}'));
          h += S.paso(2, 'Dividir es multiplicar por la inversa:' +
            KD(A.tex() + ' : ' + B.tex() + ' = ' + A.tex() + ' \\cdot \\dfrac{' + T(B.d) + '}{' + T(B.n) + '}'));
        } else {
          h += S.paso(1, 'Se multiplican numeradores entre sí y denominadores entre sí, sin desarrollar todavía nada.');
        }
        var bruto = divide ? S.fraxDiv(A, B) : S.fraxMult(A, B);
        h += S.paso(divide ? 3 : 2, 'Antes de multiplicar conviene factorizar todo y cancelar:' +
          KD('\\dfrac{' + S.factorizaTexPol(S.factorizaPol(bruto.n)) + '}{' + S.factorizaTexPol(S.factorizaPol(bruto.d)) + '}'));
        var res = S.fraxSimplifica(bruto);
        h += S.paso(divide ? 4 : 3, res.simplificable
          ? 'Se cancela el factor común ' + K(S.pTexPar(res.comun)) + '.'
          : 'No hay factores comunes que cancelar.');
        h += S.expr('Resultado', A.tex() + (divide ? ' : ' : ' \\cdot ') + B.tex() + ' = ' + res.frax.tex());
        var lista = {};
        S.raicesDe(A.d).concat(S.raicesDe(B.d)).forEach(function (r) { lista[r.txt()] = r; });
        if (divide) S.raicesDe(B.n).forEach(function (r) { lista[r.txt()] = r; });
        h += '<div class="ap-card"><b>Dominio.</b> ' + restrTex(Object.keys(lista).map(function (k2) { return lista[k2]; })) +
          (divide ? ' En una división también hay que excluir los valores que anulan el <b>numerador</b> de la segunda fracción, porque ese numerador pasa al denominador.' : '') +
          '</div>';
        return h;
      }));
  };

  /* ==================================================================
     11 · FRACCIONES COMPLEJAS (DE DOS PISOS)   (clave fraxCompleja)
     ================================================================== */
  R.fraxCompleja = function (node) {
    S.shell(node, 'Fracciones de dos pisos',
      'Se calcula la fracción compleja $\\dfrac{\\;\\frac{A}{B} + \\frac{C}{D}\\;}{\\;\\frac{E}{F}\\;}$. ' +
      'Escribe los seis polinomios; por ejemplo <code>1</code>, <code>x</code>, <code>1</code>, <code>x+1</code>, ' +
      '<code>1</code>, <code>x</code>. Primero se suma el piso de arriba, después se divide por el de abajo.',
      [{ id: 'a', type: 'text', label: 'A', value: '1', ancho: '9rem' },
      { id: 'b', type: 'text', label: 'B', value: 'x', ancho: '9rem' },
      { id: 'c', type: 'text', label: 'C', value: '1', ancho: '9rem' },
      { id: 'd', type: 'text', label: 'D', value: 'x+1', ancho: '9rem' },
      { id: 'e', type: 'text', label: 'E', value: '1', ancho: '9rem' },
      { id: 'f', type: 'text', label: 'F', value: 'x^2+x', ancho: '9rem' },
      {
        type: 'presets', list: [
          { label: '(1/x + 1/(x+1)) : (1/(x²+x))', title: 'Se simplifica del todo', apply: function (c) { c.a.value = '1'; c.b.value = 'x'; c.c.value = '1'; c.d.value = 'x+1'; c.e.value = '1'; c.f.value = 'x^2+x'; } },
          { label: '(1 + 1/x) : (1 − 1/x)', title: 'La forma más habitual', apply: function (c) { c.a.value = '1'; c.b.value = '1'; c.c.value = '1'; c.d.value = 'x'; c.e.value = 'x-1'; c.f.value = 'x'; } },
          { label: '(x/(x−1) + 1/(x+1)) : (x/(x²−1))', title: 'Denominadores factorizables', apply: function (c) { c.a.value = 'x'; c.b.value = 'x-1'; c.c.value = '1'; c.d.value = 'x+1'; c.e.value = 'x'; c.f.value = 'x^2-1'; } },
          { label: '(2/x + 3/x²) : (1/x²)', title: 'Mismo denominador arriba', apply: function (c) { c.a.value = '2'; c.b.value = 'x'; c.c.value = '3'; c.d.value = 'x^2'; c.e.value = '1'; c.f.value = 'x^2'; } }
        ]
      }],
      seguro(function (v) {
        var A = new S.Frax(P(v.a, 'el polinomio A'), P(v.b, 'el polinomio B'));
        var B2 = new S.Frax(P(v.c, 'el polinomio C'), P(v.d, 'el polinomio D'));
        var C2 = new S.Frax(P(v.e, 'el polinomio E'), P(v.f, 'el polinomio F'));
        if (S.pEsCero(C2.n)) return '<div class="mx-info">El piso de abajo no puede ser cero: escribe un numerador E distinto del polinomio nulo.</div>';
        var arriba = S.fraxSuma(A, B2, 1);
        var h = S.expr('Fracción compleja',
          '\\dfrac{\\;' + A.tex() + ' + ' + B2.tex() + '\\;}{\\;' + C2.tex() + '\\;}');
        h += S.paso(1, 'Se opera el piso de arriba con el m.c.m. de sus denominadores, ' + K(T(arriba.comun)) + ':' +
          KD(A.tex() + ' + ' + B2.tex() + ' = ' + arriba.bruto.tex()));
        var arribaS = S.fraxSimplifica(arriba.bruto);
        if (arribaS.simplificable) h += S.paso(2, 'Ese resultado se simplifica cancelando ' + K(S.pTexPar(arribaS.comun)) + ':' +
          KD(arriba.bruto.tex() + ' = ' + arribaS.frax.tex()));
        h += S.paso(arribaS.simplificable ? 3 : 2, 'Una fracción de dos pisos es una división: se multiplica el piso de arriba por la inversa del de abajo.' +
          KD('\\dfrac{\\;' + arribaS.frax.tex() + '\\;}{\\;' + C2.tex() + '\\;} = ' + arribaS.frax.tex() + ' \\cdot \\dfrac{' + T(C2.d) + '}{' + T(C2.n) + '}'));
        var total = S.fraxSimplifica(S.fraxDiv(arribaS.frax, C2));
        h += S.expr('Resultado', total.frax.tex());
        var lista = {};
        [A.d, B2.d, C2.d, C2.n, arriba.comun].forEach(function (p2) {
          S.raicesDe(p2).forEach(function (r) { lista[r.txt()] = r; });
        });
        h += '<div class="ap-card"><b>Dominio.</b> ' + restrTex(Object.keys(lista).map(function (k2) { return lista[k2]; })) +
          ' En una fracción de dos pisos hay que vigilar los denominadores de los tres niveles, incluido el numerador ' +
          'del piso de abajo, que acaba abajo del todo.</div>';
        h += '<p class="ap-note">Truco: también puedes multiplicar numerador y denominador de la fracción grande por el ' +
          'm.c.m. de todos los denominadores pequeños; desaparecen de golpe los dos pisos.</p>';
        return h;
      }));
  };

  /* ==================================================================
     12 · ENTRENADOR DE FACTORIZACIÓN   (clave entrenaFactoriza)
     ================================================================== */
  R.entrenaFactoriza = function (node) {
    var est = { ej: null, nivel: null };
    function ale(n) { return Math.floor(Math.random() * n); }
    function elige(L) { return L[ale(L.length)]; }

    function nuevo(nivel) {
      var raices, k = 1, p, e = {};
      if (nivel === 'basico') {
        /* grado 2 con dos raíces enteras pequeñas, o identidad notable */
        if (ale(2) === 0) {
          var a = elige([1, 2, 3, 4, 5]);
          p = S.pMult(S.pDe([a, 1]), S.pDe([-a, 1]));
          e.pista = 'Es una diferencia de cuadrados: $a^{2}-b^{2}=(a+b)(a-b)$.';
        } else {
          var r1 = elige([-4, -3, -2, -1, 1, 2, 3, 4]), r2 = elige([-3, -2, -1, 1, 2, 3]);
          p = S.pMult(S.pDe([-r1, 1]), S.pDe([-r2, 1]));
          e.pista = 'Resuelve la ecuación de segundo grado y escribe $(x-x_1)(x-x_2)$.';
        }
      } else if (nivel === 'medio') {
        var s1 = elige([-3, -2, -1, 1, 2, 3]), s2 = elige([-3, -2, -1, 1, 2, 3]), s3 = elige([-2, -1, 1, 2, 3]);
        p = S.pMult(S.pMult(S.pDe([-s1, 1]), S.pDe([-s2, 1])), S.pDe([-s3, 1]));
        e.pista = 'Grado 3: busca una raíz entre los divisores del término independiente y baja el grado con Ruffini.';
      } else {
        var t1 = elige([-3, -2, -1, 1, 2, 3]), t2 = elige([-2, -1, 1, 2]), t3 = elige([-2, -1, 1, 2, 3]);
        var q = elige([2, 3]);
        p = S.pMult(S.pMult(S.pDe([-t1, 1]), S.pDe([-t2, 1])), S.pDe([-t3, 1]));
        p = S.pMult(p, S.pDe([-1, q]));    /* factor (qx - 1): raíz fraccionaria */
        e.pista = 'El coeficiente principal no es 1: los candidatos a raíz son $\\frac{p}{q}$ con $p$ divisor del término independiente y $q$ divisor del coeficiente principal.';
        k = q;
      }
      e.p = p;
      e.enun = 'Factoriza el polinomio $P(x) = ' + T(p) + '$.';
      e.solTex = T(p) + ' = ' + S.factorizaTexPol(S.factorizaPol(p), 'x', 'entera');
      e.nivel = nivel;
      return e;
    }

    S.shell(node, 'Entrenador de factorización',
      'Elige el nivel, factoriza el polinomio que aparece y escribe tu respuesta como producto: ' +
      '<code>(x-1)(x+2)</code>, <code>2(x-1)^2(x+3)</code> o <code>(2x-1)(x+1)</code>. ' +
      'El applet multiplica tu producto y lo compara con el polinomio original, así que cualquier escritura ' +
      'equivalente se acepta. El botón «Otro polinomio» genera uno nuevo.',
      [{
        id: 'nivel', type: 'select', label: 'Nivel', value: 'medio',
        options: [{ value: 'basico', label: 'básico (grado 2)' }, { value: 'medio', label: 'medio (grado 3, raíces enteras)' },
        { value: 'avanzado', label: 'avanzado (grado 4, raíz fraccionaria)' }]
      },
      { id: 'resp', type: 'text', label: 'Tu factorización', value: '', ancho: '20rem', place: 'por ejemplo (x-1)(x+2)' },
      { id: 'ver', type: 'check', label: 'Ver la solución', value: false },
      {
        type: 'button', id: 'otro', label: 'Otro polinomio', click: function (ctl) {
          est.ej = null;
          if (ctl.resp) ctl.resp.value = '';
          if (ctl.ver) ctl.ver.checked = false;
        }
      },
      {
        type: 'presets', list: [
          { label: 'nivel básico', apply: function (c) { c.nivel.value = 'basico'; est.ej = null; c.resp.value = ''; c.ver.checked = false; } },
          { label: 'nivel medio', apply: function (c) { c.nivel.value = 'medio'; est.ej = null; c.resp.value = ''; c.ver.checked = false; } },
          { label: 'nivel avanzado', apply: function (c) { c.nivel.value = 'avanzado'; est.ej = null; c.resp.value = ''; c.ver.checked = false; } },
          { label: 'ver una solución de ejemplo', apply: function (c) { c.ver.checked = true; } }
        ]
      }],
      seguro(function (v) {
        var nivel = String(v.nivel);
        if (!est.ej || est.nivel !== nivel) { est.ej = nuevo(nivel); est.nivel = nivel; }
        var e = est.ej;
        var h = '<div class="ap-enun">' + e.enun + '</div>';
        var txt = String(v.resp || '').trim();
        if (txt) {
          var dado = null, msg = '';
          try { dado = S.parsePol(txt, 'x', 'tu factorización'); }
          catch (x) { msg = x.message; }
          if (!dado) h += '<div class="ap-ko">No entiendo la respuesta. ' + S.esc(msg) + '</div>';
          else if (S.pIgual(dado, e.p)) h += '<div class="ap-ok">' + S.badge('correcto', 'si') +
            ' Al multiplicar tu producto sale exactamente ' + K(T(e.p)) + '.</div>';
          else h += '<div class="ap-ko">' + S.badge('todavía no', 'no') + ' Tu producto vale ' + K(T(dado)) +
            ', y debería valer ' + K(T(e.p)) + '. Pista: ' + e.pista + '</div>';
        } else {
          h += '<div class="mx-info">Pista: ' + e.pista + '</div>';
        }
        if (v.ver === true || v.ver === 'true') h += S.expr('Solución', e.solTex);
        else h += '<div class="mx-info">Marca «Ver la solución» solo cuando lo hayas intentado: el aprendizaje está en el intento.</div>';
        return h;
      }));
  };

  /* ==================================================================
     13 · ENTRENADOR DE FRACCIONES ALGEBRAICAS   (clave entrenaFrax)
     ================================================================== */
  R.entrenaFrax = function (node) {
    var est = { ej: null, nivel: null };
    function ale(n) { return Math.floor(Math.random() * n); }
    function elige(L) { return L[ale(L.length)]; }
    function lin(r) { return S.pDe([-r, 1]); }      /* (x - r) */

    function nuevo(nivel) {
      var e = {}, a, b, c;
      if (nivel === 'basico') {
        a = elige([-3, -2, -1, 1, 2, 3]);
        b = elige([-3, -2, -1, 1, 2, 3]);
        c = elige([-4, -2, 2, 4]);
        var N = S.pMult(lin(a), lin(b)), D = S.pMult(lin(a), lin(c));
        e.frax = new S.Frax(N, D);
        e.enun = 'Simplifica la fracción algebraica $' + e.frax.tex() + '$ e indica los valores excluidos del dominio.';
        e.pista = 'Factoriza numerador y denominador y cancela el factor común; los valores excluidos son las raíces del denominador <b>original</b>.';
        e.sol = S.fraxSimplifica(e.frax).frax;
      } else if (nivel === 'medio') {
        a = elige([-2, -1, 1, 2]); b = elige([-3, 3, 4]);
        var A = new S.Frax(S.pDe([1]), lin(a)), B = new S.Frax(S.pDe([1]), lin(b));
        var su = S.fraxSuma(A, B, 1);
        e.frax = null;
        e.enun = 'Efectúa y simplifica $' + A.tex() + ' + ' + B.tex() + '$.';
        e.pista = 'El denominador común es el producto de los dos, porque son primos entre sí.';
        e.sol = S.fraxSimplifica(su.bruto).frax;
      } else {
        a = elige([-2, -1, 1, 2]); b = elige([-3, -2, 2, 3]); c = elige([-1, 1, 2]);
        var A2 = new S.Frax(S.pMult(lin(a), lin(b)), lin(c));
        var B2 = new S.Frax(lin(a), S.pMult(lin(c), lin(c)));
        e.enun = 'Efectúa y simplifica $' + A2.tex() + ' : ' + B2.tex() + '$.';
        e.pista = 'Dividir es multiplicar por la inversa; factoriza antes de multiplicar y cancela.';
        e.sol = S.fraxSimplifica(S.fraxDiv(A2, B2)).frax;
      }
      e.nivel = nivel;
      return e;
    }

    S.shell(node, 'Entrenador de fracciones algebraicas',
      'Elige el nivel, resuelve el ejercicio y escribe tu resultado en dos casillas: numerador y denominador, ' +
      'por ejemplo <code>x-1</code> y <code>x+2</code>. El applet comprueba la equivalencia con productos cruzados, ' +
      'así que se acepta cualquier fracción equivalente (por ejemplo $\\frac{2x-2}{2x+4}$).',
      [{
        id: 'nivel', type: 'select', label: 'Nivel', value: 'basico',
        options: [{ value: 'basico', label: 'básico (simplificar)' }, { value: 'medio', label: 'medio (sumar)' },
        { value: 'avanzado', label: 'avanzado (dividir)' }]
      },
      { id: 'rn', type: 'text', label: 'Numerador de tu respuesta', value: '', ancho: '14rem', place: 'x-1' },
      { id: 'rd', type: 'text', label: 'Denominador de tu respuesta', value: '', ancho: '14rem', place: 'x+2' },
      { id: 'ver', type: 'check', label: 'Ver la solución', value: false },
      {
        type: 'button', id: 'otro', label: 'Otro ejercicio', click: function (ctl) {
          est.ej = null;
          if (ctl.rn) ctl.rn.value = '';
          if (ctl.rd) ctl.rd.value = '';
          if (ctl.ver) ctl.ver.checked = false;
        }
      },
      {
        type: 'presets', list: [
          { label: 'nivel básico', apply: function (c) { c.nivel.value = 'basico'; est.ej = null; c.rn.value = ''; c.rd.value = ''; c.ver.checked = false; } },
          { label: 'nivel medio', apply: function (c) { c.nivel.value = 'medio'; est.ej = null; c.rn.value = ''; c.rd.value = ''; c.ver.checked = false; } },
          { label: 'nivel avanzado', apply: function (c) { c.nivel.value = 'avanzado'; est.ej = null; c.rn.value = ''; c.rd.value = ''; c.ver.checked = false; } },
          { label: 'ver una solución de ejemplo', apply: function (c) { c.ver.checked = true; } }
        ]
      }],
      seguro(function (v) {
        var nivel = String(v.nivel);
        if (!est.ej || est.nivel !== nivel) { est.ej = nuevo(nivel); est.nivel = nivel; }
        var e = est.ej;
        var h = '<div class="ap-enun">' + e.enun + '</div>';
        var tn = String(v.rn || '').trim(), td = String(v.rd || '').trim();
        if (tn && td) {
          var n2 = null, d2 = null, msg = '';
          try { n2 = S.parsePol(tn, 'x', 'el numerador de tu respuesta'); d2 = S.parsePol(td, 'x', 'el denominador de tu respuesta'); }
          catch (x) { msg = x.message; }
          if (!n2 || !d2) h += '<div class="ap-ko">No entiendo la respuesta. ' + S.esc(msg) + '</div>';
          else if (S.pEsCero(d2)) h += '<div class="ap-ko">El denominador de una fracción algebraica no puede ser 0.</div>';
          else if (S.pIgual(S.pMult(n2, e.sol.d), S.pMult(d2, e.sol.n)))
            h += '<div class="ap-ok">' + S.badge('correcto', 'si') + ' Tu fracción es equivalente a la esperada: ' +
              K(T(n2) + ' \\cdot \\left(' + T(e.sol.d) + '\\right) = ' + T(d2) + ' \\cdot \\left(' + T(e.sol.n) + '\\right)') + '.</div>';
          else h += '<div class="ap-ko">' + S.badge('todavía no', 'no') +
            ' Los productos cruzados no coinciden. Pista: ' + e.pista + '</div>';
        } else {
          h += '<div class="mx-info">Rellena las dos casillas para que se corrija. Pista: ' + e.pista + '</div>';
        }
        if (v.ver === true || v.ver === 'true') h += S.expr('Solución', e.sol.tex());
        else h += '<div class="mx-info">Intenta el ejercicio en papel antes de mirar la solución.</div>';
        return h;
      }));
  };

  S.extraC = true;
})();
