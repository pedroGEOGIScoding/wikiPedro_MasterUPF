/* =====================================================================
   pol-applets-a.js · Tema 2 «Polinomios y fracciones algebraicas»
   1.º Bachillerato · Matemáticas Aplicadas a las CCSS
   Ruta: 1-BatxMatesCCSS/polinomios/assets/pol-applets-a.js

   MÓDULO A · apartados 2.1 a 2.3
     2.1 Términos, grado y valor numérico
         anatomiaPol · valorHorner · graficaValor · igualdadPol · modeloPol
     2.2 Suma, resta y multiplicación
         sumaRestaPol · productoCruzado · notablesPol · cuadradoGeom ·
         trianguloPascal
     2.3 División de polinomios
         divisionLargaPaso · divisionMonomio · pruebaDivision

   Depende del núcleo window.POL (assets/pol-applets.js). Sin librerías
   externas, sin OJS, sin CDN: solo JS de navegador.
   ===================================================================== */
(function () {
  'use strict';
  var S = window.POL;
  if (!S) { console.error('[polinomios] falta pol-applets.js'); return; }
  var R = S.registry;
  var K = S.K, KD = S.KD, P = S.parsePol, T = S.pTex, TP = S.pTexPar;
  var F = S.Frac, COL = S.COL;

  /* ==================================================================
     0 · utilidades locales del módulo
     ================================================================== */

  /* Monomio suelto en LaTeX, con su propio signo: coef · x^grado */
  function monoTex(c, g, v) {
    v = v || 'x';
    if (c.n === 0n) return '0';
    var neg = c.n < 0n;
    var abs = neg ? c.opuesto() : c;
    var uno = (abs.n === 1n && abs.d === 1n);
    var cuerpo = (g > 0 && uno) ? '' : abs.tex(true);
    var pot = g === 0 ? '' : (g === 1 ? v : v + '^{' + g + '}');
    return (neg ? '-' : '') + cuerpo + pot;
  }

  /* Lista de términos no nulos, de mayor a menor grado */
  function terminos(p) {
    var L = [];
    for (var i = p.length - 1; i >= 0; i--) if (p[i].n !== 0n) L.push({ g: i, c: p[i] });
    return L;
  }

  /* Coeficiente de grado g (Frac), tanto si el hueco existe como si no */
  function coef(p, g) { return (g < p.length && p[g]) ? p[g] : new F(0); }

  /* Nombre según el número de términos */
  function nombrePorTerminos(n) {
    if (n === 0) return 'polinomio nulo';
    if (n === 1) return 'monomio';
    if (n === 2) return 'binomio';
    if (n === 3) return 'trinomio';
    if (n === 4) return 'cuatrinomio';
    return 'polinomio de ' + n + ' términos';
  }

  /* Número combinatorio (n sobre k) con enteros pequeños */
  function comb(n, k) {
    var r = 1;
    for (var i = 1; i <= k; i++) r = r * (n - k + i) / i;
    return Math.round(r);
  }

  /* Potencia entera de una letra en LaTeX: a^3, a, «» */
  function letraPot(l, e) {
    if (e === 0) return '';
    if (e === 1) return l;
    return l + '^{' + e + '}';
  }

  /* Límites verticales razonables para dibujar un polinomio */
  function rangoY(p, xmin, xmax, extra) {
    var lo = Infinity, hi = -Infinity, i, y;
    for (i = 0; i <= 240; i++) {
      y = S.pEvalNum(p, xmin + (xmax - xmin) * i / 240);
      if (!Number.isFinite(y)) continue;
      if (y < lo) lo = y;
      if (y > hi) hi = y;
    }
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) { lo = -1; hi = 1; }
    if (lo > 0) lo = 0;
    if (hi < 0) hi = 0;
    if (extra !== undefined && Number.isFinite(extra)) {
      lo = Math.min(lo, extra);
      hi = Math.max(hi, extra);
    }
    /* recorte para que la curva no aplaste la escala */
    var tope = 120;
    lo = Math.max(lo, -tope); hi = Math.min(hi, tope);
    var pad = Math.max(1, (hi - lo) * 0.14);
    lo = Math.floor(lo - pad); hi = Math.ceil(hi + pad);
    if (hi - lo < 4) { lo -= 2; hi += 2; }
    return { lo: lo, hi: hi };
  }

  /* ==================================================================
     2.1 · TÉRMINOS, GRADO Y VALOR NUMÉRICO
     ================================================================== */

  /* ---------------- 1 · anatomiaPol ------------------------------- */
  R.anatomiaPol = function (node) {
    S.shell(node, 'Anatomía de un polinomio',
      'Escribe el polinomio con <code>^</code> para los exponentes y sin espacios: <code>1-7x^3+4x+8x^4+6x^5</code>. ' +
      'También admite productos como <code>2x(x-1)^2</code>, coeficientes fraccionarios (<code>x/2+3</code>) y decimales con coma (<code>0,5x^2</code>). ' +
      'El applet ordena el polinomio, reduce los términos semejantes y analiza cada pieza.',
      [{ id: 'p', type: 'text', label: 'Polinomio P(x)', value: '1-7x^3+4x+8x^4+6x^5', ancho: '26rem' },
      { id: 'tab', type: 'check', label: 'Ver la tabla de coeficientes', value: true },
      {
        type: 'presets', list: [
          { label: '1−7x³+4x+8x⁴+6x⁵', title: 'Sin ordenar y con un hueco en x²', apply: function (c) { c.p.value = '1-7x^3+4x+8x^4+6x^5'; } },
          { label: '7x³−4x²+1+8x−5x⁴', title: 'El mismo polinomio, desordenado', apply: function (c) { c.p.value = '7x^3-4x^2+1+8x-5x^4'; } },
          { label: '4x⁶−2x⁴−3x²−2x+1', title: 'Ordenado pero incompleto', apply: function (c) { c.p.value = '4x^6-2x^4-3x^2-2x+1'; } },
          { label: 'x³−4x²+5x−2', title: 'Mónico y completo', apply: function (c) { c.p.value = 'x^3-4x^2+5x-2'; } },
          { label: '7x³−6x³+4x²', title: 'Hay que reducir términos semejantes', apply: function (c) { c.p.value = '4x^5-2x^4+7x^3-6x^3+4x^2'; } },
          { label: '−5', title: 'Polinomio constante', apply: function (c) { c.p.value = '-5'; } },
          { label: 'x−x', title: 'Polinomio nulo', apply: function (c) { c.p.value = 'x-x'; } }
        ]
      }],
      function (v) {
        var p = P(v.p, 'x', 'el polinomio P(x)');
        var nulo = S.pEsCero(p);
        var g = S.pGrado(p);
        var L = terminos(p);
        var h = S.expr('Escrito ordenado y reducido', T(p) + (nulo ? '\\quad\\text{(polinomio nulo)}' : ''));

        h += S.terminosHTML(p);

        var completo = true;
        if (!nulo) for (var i = 0; i <= g; i++) if (coef(p, i).n === 0n) completo = false;
        var monico = !nulo && S.pLider(p).n === 1n && S.pLider(p).d === 1n;

        h += S.kvs([
          'Grado: <b>' + S.pGradoTxt(p) + '</b>',
          'Coeficiente principal: <b>' + (nulo ? '—' : K(S.pLider(p).tex(true))) + '</b>',
          'Término independiente: <b>' + K(S.pIndep(p).tex(true)) + '</b>',
          'Términos no nulos: <b>' + L.length + '</b> (' + nombrePorTerminos(L.length) + ')',
          'Mónico: ' + S.badge(monico ? 'sí' : 'no', monico ? 'si' : 'no'),
          'Completo: ' + S.badge(nulo ? 'no procede' : (completo ? 'sí' : 'no'), completo && !nulo ? 'si' : 'info')
        ]);

        if (v.tab && !nulo) {
          var cab = ['Coeficiente'], fila1 = ['Valor'], fila2 = ['Término'];
          for (var k = g; k >= 0; k--) {
            cab.push(K('a_{' + k + '}'));
            fila1.push(K(coef(p, k).tex(true)));
            fila2.push(coef(p, k).n === 0n ? '<span class="ap-cif-mudo">no aparece</span>' : K(monoTex(coef(p, k), k)));
          }
          h += S.tabla(cab, [fila1, fila2]);
          h += '<div class="mx-info">El subíndice del coeficiente coincide siempre con el exponente de la $x$ a la que acompaña: ' +
            '$a_k$ va con $x^k$. Cuando un coeficiente vale $0$ el término no se escribe, pero el hueco existe.</div>';
        }

        h += S.paso(1, 'Se <b>reducen</b> los términos semejantes (los del mismo grado) sacando factor común la potencia: ' +
          '$7x^3 - 6x^3 = (7-6)x^3 = x^3$.');
        h += S.paso(2, 'Se <b>ordenan</b> las potencias de mayor a menor. La propiedad conmutativa de la suma garantiza que el polinomio no cambia, ' +
          'pero así se lee de un golpe el grado y el coeficiente principal.', 'ap-paso-clave');
        h += S.paso(3, nulo
          ? 'Todos los coeficientes son $0$: es el <b>polinomio nulo</b> $0(x)$, el único al que no se le asigna grado.'
          : (g === 0
            ? 'Solo queda el término independiente, así que el grado es $0$: los polinomios de grado cero son los números reales distintos de cero.'
            : 'El mayor exponente con coeficiente no nulo es $' + g + '$, luego $\\text{grado}(P) = ' + g +
            '$ y el coeficiente principal es $' + S.pLider(p).tex(true) + '$, que nunca puede ser cero.'), 'ap-paso-clave');
        return h;
      });
  };

  /* ---------------- 2 · valorHorner ------------------------------- */
  R.valorHorner = function (node) {
    S.shell(node, 'Valor numérico: sustitución directa y Horner',
      'Escribe el polinomio con <code>^</code> (por ejemplo <code>3x^4-5x^2+2x-7</code>) y el valor de la indeterminada como entero o fracción: ' +
      '<code>2</code>, <code>-3</code>, <code>1/2</code>. El applet calcula $P(a)$ por los dos caminos y compara el número de operaciones.',
      [{ id: 'p', type: 'text', label: 'Polinomio P(x)', value: '3x^4-5x^2+2x-7', ancho: '24rem' },
      { id: 'a', type: 'text', label: 'Valor de x', value: '2', ancho: '9rem' },
      { id: 'dir', type: 'check', label: 'Ver la sustitución directa', value: true },
      {
        type: 'presets', list: [
          { label: '3x⁴−5x²+2x−7 en x=2', apply: function (c) { c.p.value = '3x^4-5x^2+2x-7'; c.a.value = '2'; } },
          { label: 'x³−4x²+5x−2 en x=1', title: 'El resultado es 0: x=1 es raíz', apply: function (c) { c.p.value = 'x^3-4x^2+5x-2'; c.a.value = '1'; } },
          { label: '4y³−3y+7 en −1', apply: function (c) { c.p.value = '4x^3-3x+7'; c.a.value = '-1'; } },
          { label: '4x²−1 en x=1/2', title: 'Valor fraccionario, cálculo exacto', apply: function (c) { c.p.value = '4x^2-1'; c.a.value = '1/2'; } },
          { label: '3x⁴+x²/5−2 en x=5', apply: function (c) { c.p.value = '3x^4+x^2/5-2'; c.a.value = '5'; } },
          { label: 'x⁶−1 en x=−2', apply: function (c) { c.p.value = 'x^6-1'; c.a.value = '-2'; } }
        ]
      }],
      function (v) {
        var p = P(v.p, 'x', 'el polinomio P(x)');
        var a = S.fraccionTxt(v.a, 'El valor de x');
        var g = Math.max(0, S.pGrado(p) === -Infinity ? 0 : S.pGrado(p));
        var E = S.pEval(p, a);
        var at = a.tex(true);

        var h = S.resultado(K(E.valor.tex(true)), 'valor numérico $P(' + at + ')$');

        /* sustitución directa */
        if (v.dir) {
          var trozos = [], sum = new F(0), pot = new F(1), potencias = [];
          for (var i = 0; i <= g; i++) {
            potencias.push(pot);
            pot = pot.por(a);
          }
          for (var k = g; k >= 0; k--) {
            var c = coef(p, k);
            if (c.n === 0n) continue;
            var val = c.por(potencias[k]);
            sum = sum.mas(val);
            trozos.push({ k: k, c: c, pot: potencias[k], val: val });
          }
          var izq = trozos.map(function (t) {
            return t.c.tex(true) + (t.k === 0 ? '' : ' \\cdot \\left(' + at + '\\right)^{' + t.k + '}');
          }).join(' + ') || '0';
          var der = trozos.map(function (t) { return t.val.tex(true); }).join(' + ') || '0';
          h += S.expr('Sustitución directa', 'P\\left(' + at + '\\right) = ' + izq + ' = ' + der + ' = ' + sum.tex(true));
        }

        /* Horner */
        var cab = ['Coeficientes'], filaC = ['de $P$'], filaH = ['acumulado'];
        for (var j = g; j >= 0; j--) { cab.push(K('a_{' + j + '}')); filaC.push(K(coef(p, j).tex(true))); }
        E.pasos.forEach(function (x) { filaH.push(K(x.tex(true))); });
        h += S.tabla(cab, [filaC, filaH]);

        var lista = E.pasos, det = '';
        for (var m = 1; m < lista.length; m++) {
          det += (m > 1 ? '<br>' : '') + '$' + lista[m - 1].tex(true) + ' \\cdot ' + at + ' + ' +
            coef(p, g - m).tex(true) + ' = ' + lista[m].tex(true) + '$';
        }
        h += S.paso(1, 'El acumulado arranca en el coeficiente principal $' + coef(p, g).tex(true) +
          '$ y en cada casilla se <b>multiplica por ' + at + ' y se suma el coeficiente siguiente</b>:' +
          (det ? '<br>' + det : ''), 'ap-paso-clave');
        h += S.paso(2, 'El último acumulado es el valor numérico: $P(' + at + ') = ' + E.valor.tex(true) + '$.');
        h += S.paso(3, 'Por qué funciona: basta sacar factor común $x$ repetidamente,' +
          KD('P(x) = \\Bigl(\\cdots\\bigl((a_n x + a_{n-1})x + a_{n-2}\\bigr)x + \\cdots\\Bigr)x + a_0,') +
          'y esa escritura anidada es exactamente la cadena de multiplicaciones y sumas de la tabla.');

        h += S.kvs([
          'Grado: <b>' + g + '</b>',
          'Sustitución directa: <b>' + (2 * g - 1 > 0 ? 2 * g - 1 : g) + '</b> productos aprox. y <b>' + g + '</b> sumas',
          'Horner: <b>' + g + '</b> productos y <b>' + g + '</b> sumas',
          E.valor.n === 0n ? 'Como $P(' + at + ') = 0$, el número ' + K(at) + ' es <b>raíz</b> de $P$' : 'No es raíz: el valor no es cero'
        ]);
        h += '<div class="mx-info">Los dos caminos dan el mismo número, y así tiene que ser: el valor numérico no depende del método. ' +
          'La ventaja de Horner es que nunca hay que calcular potencias grandes, así que se cometen menos errores y el cálculo es más corto.</div>';
        return h;
      });
  };

  /* ---------------- 3 · graficaValor ------------------------------ */
  R.graficaValor = function (node) {
    S.shell(node, 'El valor numérico en la gráfica',
      'Escribe el polinomio (por ejemplo <code>x^3-4x^2+5x-2</code>) y mueve el deslizador de $a$. ' +
      'El applet dibuja la curva $y = P(x)$ y marca el punto $\\left(a, P(a)\\right)$: la altura del punto <b>es</b> el valor numérico.',
      [{ id: 'p', type: 'text', label: 'Polinomio P(x)', value: 'x^3-4x^2+5x-2', ancho: '22rem' },
      { id: 'a', type: 'range', label: 'a', value: 2, min: -4, max: 4, step: 0.5 },
      { id: 'lim', type: 'number', label: 'x de −L a L', value: 4, min: 2, max: 10 },
      {
        type: 'presets', list: [
          { label: 'x³−4x²+5x−2', title: 'Tiene raíces en 1 y 2', apply: function (c) { c.p.value = 'x^3-4x^2+5x-2'; c.a.value = 2; c.lim.value = 4; } },
          { label: 'x²−4', apply: function (c) { c.p.value = 'x^2-4'; c.a.value = -2; c.lim.value = 4; } },
          { label: 'x²+1', title: 'No corta al eje: sin raíces reales', apply: function (c) { c.p.value = 'x^2+1'; c.a.value = 0; c.lim.value = 3; } },
          { label: '−x²+6x−5', apply: function (c) { c.p.value = '-x^2+6x-5'; c.a.value = 3; c.lim.value = 6; } },
          { label: 'x⁴−5x²+4', apply: function (c) { c.p.value = 'x^4-5x^2+4'; c.a.value = 1.5; c.lim.value = 3; } },
          { label: '2x+3', title: 'Grado 1: una recta', apply: function (c) { c.p.value = '2x+3'; c.a.value = -1.5; c.lim.value = 4; } }
        ]
      }],
      function (v) {
        var p = P(v.p, 'x', 'el polinomio P(x)');
        var L = S.entero(v.lim, 2, 10, 'El límite L');
        var a = S.real(v.a, -L, L, 'El valor de a');
        var ya = S.pEvalNum(p, a);
        var Ex = S.pEval(p, new F(Math.round(a * 2), 2));
        var rg = rangoY(p, -L, L, ya);

        var fig = S.ejes({
          xmin: -L, xmax: L, ymin: rg.lo, ymax: rg.hi, W: 1000, H: 560,
          curvas: [{ f: function (x) { return S.pEvalNum(p, x); }, col: COL.azul, label: 'y = P(x)', lx: 700, ly: 70 }],
          puntos: [{ x: a, y: Math.max(rg.lo, Math.min(rg.hi, ya)), col: COL.rojo, tex: 'P(' + S.kf(a, 2) + ') = ' + S.kf(ya, 3) }],
          label: 'Gráfica de P(x) con el valor numérico marcado',
          cap: 'Cada valor numérico es la altura de la curva sobre el punto $x = a$. Donde la curva cruza el eje horizontal el valor numérico es cero: ahí están las raíces.'
        });

        var h = S.resultado(K(S.kf(ya, 4)), 'altura de la curva en $x = ' + S.kf(a, 2) + '$');
        h += fig;
        h += S.kvs([
          '$P(' + S.kf(a, 2) + ') = ' + Ex.valor.tex(true) + '$ (valor exacto)',
          'Signo: ' + S.badge(ya > 1e-9 ? 'positivo' : (ya < -1e-9 ? 'negativo' : 'nulo'), ya === 0 ? 'si' : 'info'),
          'Grado del polinomio: <b>' + S.pGradoTxt(p) + '</b>',
          'Término independiente $P(0) = ' + S.pIndep(p).tex(true) + '$'
        ]);
        h += '<div class="mx-info">Observa dos hechos que se usarán todo el tema: el término independiente es siempre $P(0)$, ' +
          'y los puntos donde la gráfica corta al eje horizontal son exactamente los valores de $x$ con $P(x) = 0$.</div>';
        return h;
      });
  };

  /* ---------------- 4 · igualdadPol ------------------------------- */
  R.igualdadPol = function (node) {
    S.shell(node, 'Igualdad de polinomios',
      'Escribe dos polinomios (admite paréntesis y productos: <code>(x-1)(x+1)</code>) y el applet compara sus coeficientes uno a uno. ' +
      'Dos polinomios son iguales cuando coinciden <b>todos</b> los coeficientes del mismo grado.',
      [{ id: 'p', type: 'text', label: 'Polinomio P(x)', value: '7x^3-5x^4-4x^2+8x+1', ancho: '20rem' },
      { id: 'q', type: 'text', label: 'Polinomio Q(x)', value: '7x^3-4x^2+1+8x-5x^4', ancho: '20rem' },
      {
        type: 'presets', list: [
          { label: 'Desordenado vs ordenado', apply: function (c) { c.p.value = '7x^3-5x^4-4x^2+8x+1'; c.q.value = '7x^3-4x^2+1+8x-5x^4'; } },
          { label: 'x²−1 vs (x−1)(x+1)', apply: function (c) { c.p.value = 'x^2-1'; c.q.value = '(x-1)(x+1)'; } },
          { label: '(x+3)² vs x²+9', title: 'Error clásico', apply: function (c) { c.p.value = '(x+3)^2'; c.q.value = 'x^2+9'; } },
          { label: '(x+3)² vs x²+6x+9', apply: function (c) { c.p.value = '(x+3)^2'; c.q.value = 'x^2+6x+9'; } },
          { label: 'x/2+3 vs 0,5x+3', apply: function (c) { c.p.value = 'x/2+3'; c.q.value = '0,5x+3'; } },
          { label: 'x³−x vs x(x−1)(x+1)', apply: function (c) { c.p.value = 'x^3-x'; c.q.value = 'x(x-1)(x+1)'; } }
        ]
      }],
      function (v) {
        var p = P(v.p, 'x', 'el polinomio P(x)');
        var q = P(v.q, 'x', 'el polinomio Q(x)');
        var g = Math.max(S.pGrado(p) === -Infinity ? 0 : S.pGrado(p), S.pGrado(q) === -Infinity ? 0 : S.pGrado(q));
        var iguales = S.pIgual(p, q);

        var h = S.expr('P(x)', T(p)) + S.expr('Q(x)', T(q));
        var filas = [];
        for (var k = g; k >= 0; k--) {
          var cp = coef(p, k), cq = coef(q, k), ok = cp.cmp(cq) === 0;
          filas.push({
            clase: ok ? '' : 'ap-ko',
            celdas: [K('x^{' + k + '}'), K(cp.tex(true)), K(cq.tex(true)),
              S.badge(ok ? 'coinciden' : 'distintos', ok ? 'si' : 'no')]
          });
        }
        h += S.tabla(['Grado', 'Coeficiente de P', 'Coeficiente de Q', '¿Igual?'], filas);

        var vals = [];
        [-2, -1, 0, 1, 2].forEach(function (x) {
          var A = S.pEval(p, new F(x)).valor, B = S.pEval(q, new F(x)).valor;
          vals.push({ celdas: [K(String(x)), K(A.tex(true)), K(B.tex(true)), S.badge(A.cmp(B) === 0 ? 'sí' : 'no', A.cmp(B) === 0 ? 'si' : 'no')] });
        });
        h += S.tabla(['$x$', '$P(x)$', '$Q(x)$', '¿Coincide el valor?'], vals);

        h += '<div class="' + (iguales ? 'ap-card ap-card-ok' : 'ap-card ap-card-ko') + '">' +
          '<span class="ap-card-tit">' + (iguales ? 'Son el mismo polinomio' : 'No son el mismo polinomio') + '</span>' +
          (iguales
            ? 'Todos los coeficientes del mismo grado coinciden, así que $P(x) = Q(x)$ y toman el mismo valor numérico para cualquier $x$. ' +
            'Escribir los términos en otro orden no cambia el polinomio.'
            : 'Hay al menos un grado en el que los coeficientes no coinciden. Basta un valor de $x$ donde los valores numéricos difieran para asegurar que $P \\neq Q$.') +
          '</div>';
        h += S.paso(1, 'La <b>igualdad de polinomios</b> se comprueba coeficiente a coeficiente, no probando valores: ' +
          'dos polinomios distintos pueden coincidir en unos cuantos puntos.', 'ap-paso-clave');
        h += S.paso(2, 'La resta lo decide de golpe: $P(x) - Q(x) = ' + T(S.pResta(p, q)) + '$, que es el polinomio nulo ' +
          (iguales ? 'sí' : 'no') + '.');
        return h;
      });
  };

  /* ---------------- 5 · modeloPol --------------------------------- */
  R.modeloPol = function (node) {
    var MODELOS = {
      coste: {
        txt: '0,5x^2+8x+120', nombre: 'Coste total de producir x unidades',
        ud: '€', min: 0, max: 40,
        expl: 'El término independiente $120$ es el <b>coste fijo</b> (alquiler, seguros): se paga aunque no se produzca nada, y coincide con $C(0)$. ' +
          'El término $8x$ es el coste variable proporcional y el término $0{,}5x^2$ recoge que producir más encarece cada unidad extra.'
      },
      ingreso: {
        txt: '25x-0,1x^2', nombre: 'Ingreso al vender x unidades',
        ud: '€', min: 0, max: 40,
        expl: 'Si el precio bajara al vender más unidades, el ingreso ya no es proporcional: aparece el término $-0{,}1x^2$. ' +
          'Como $I(0) = 0$, el polinomio no tiene término independiente.'
      },
      beneficio: {
        txt: '25x-0,1x^2-(0,5x^2+8x+120)', nombre: 'Beneficio = ingreso − coste',
        ud: '€', min: 0, max: 40,
        expl: 'El beneficio se obtiene <b>restando polinomios</b>: $B(x) = I(x) - C(x)$. Con pocas unidades es negativo (no se cubren los costes fijos) ' +
          'y a partir de cierto punto se vuelve positivo.'
      },
      area: {
        txt: '(x+4)(x+2)', nombre: 'Área de un rectángulo de lados x+4 y x+2',
        ud: 'cm²', min: 0, max: 20,
        expl: 'Multiplicar los dos binomios da $x^2 + 6x + 8$: el grado 2 es coherente con que un área sea un producto de dos longitudes.'
      },
      caja: {
        txt: 'x(20-2x)(12-2x)', nombre: 'Volumen de una caja sin tapa (cartón 20 × 12 con esquinas de lado x)',
        ud: 'cm³', min: 0, max: 6,
        expl: 'Al recortar cuadrados de lado $x$ en las esquinas y levantar las pestañas, la base mide $20-2x$ por $12-2x$ y la altura $x$. ' +
          'El volumen es un polinomio de grado 3, y solo tiene sentido para $0 < x < 6$.'
      }
    };
    S.shell(node, 'Polinomios que modelan situaciones',
      'Elige un modelo y el número de unidades (o la medida) y el applet desarrolla el polinomio, calcula su valor numérico y lo interpreta. ' +
      'El valor de $x$ se escribe como entero o con coma decimal: <code>12</code>, <code>3,5</code>.',
      [{
        id: 'm', type: 'select', label: 'Modelo', value: 'coste', options: [
          { value: 'coste', label: 'Coste total C(x)' },
          { value: 'ingreso', label: 'Ingreso I(x)' },
          { value: 'beneficio', label: 'Beneficio B(x)' },
          { value: 'area', label: 'Área de un rectángulo' },
          { value: 'caja', label: 'Volumen de una caja' }
        ]
      },
      { id: 'x', type: 'text', label: 'Valor de x', value: '12', ancho: '9rem' },
      {
        type: 'presets', list: [
          { label: 'Coste de 12 unidades', apply: function (c) { c.m.value = 'coste'; c.x.value = '12'; } },
          { label: 'Coste fijo (x=0)', apply: function (c) { c.m.value = 'coste'; c.x.value = '0'; } },
          { label: 'Ingreso de 30 unidades', apply: function (c) { c.m.value = 'ingreso'; c.x.value = '30'; } },
          { label: 'Beneficio con 5 unidades', title: 'Sale negativo', apply: function (c) { c.m.value = 'beneficio'; c.x.value = '5'; } },
          { label: 'Beneficio con 20 unidades', apply: function (c) { c.m.value = 'beneficio'; c.x.value = '20'; } },
          { label: 'Área con x=3', apply: function (c) { c.m.value = 'area'; c.x.value = '3'; } },
          { label: 'Caja con x=2', apply: function (c) { c.m.value = 'caja'; c.x.value = '2'; } }
        ]
      }],
      function (v) {
        var M = MODELOS[v.m] || MODELOS.coste;
        var p = P(M.txt, 'x', 'el modelo');
        /* admitimos decimales con coma (o punto) y también fracciones a/b */
        var bruto = String(v.x).trim().replace(/\s/g, '').replace('.', ',');
        var x;
        var md = /^([+-]?)(\d+),(\d+)$/.exec(bruto);
        if (md) {
          x = new F(Number(md[2] + md[3]), Math.pow(10, md[3].length));
          if (md[1] === '-') x = x.opuesto();
        } else {
          x = S.fraccionTxt(v.x, 'El valor de x');
        }
        if (x.val() < M.min || x.val() > M.max)
          throw Error('En este modelo el valor de x tiene sentido entre ' + M.min + ' y ' + M.max + '. Prueba con otro número.');
        var E = S.pEval(p, x);
        var h = S.expr(M.nombre, 'P(x) = ' + T(p));
        h += S.resultado(K(E.valor.tex(true) + '\\;\\text{' + M.ud + '}'), 'valor para $x = ' + x.tex(true) + '$');
        h += '<div class="mx-info">' + M.expl + '</div>';

        var filas = [];
        var paso = (M.max - M.min) / 5;
        for (var i = 0; i <= 5; i++) {
          var xi = new F(Math.round((M.min + i * paso) * 2), 2);
          filas.push({ celdas: [K(xi.tex(true)), K(S.pEval(p, xi).valor.tex(true))] });
        }
        h += S.tabla(['$x$', 'valor del modelo (' + M.ud + ')'], filas);
        h += S.kvs([
          'Grado: <b>' + S.pGradoTxt(p) + '</b>',
          'Coeficiente principal: <b>' + K(S.pLider(p).tex(true)) + '</b>',
          'Término independiente: <b>' + K(S.pIndep(p).tex(true)) + '</b> (valor en $x = 0$)'
        ]);
        h += S.paso(1, 'Modelizar consiste en traducir el enunciado a un polinomio; a partir de ahí, responder a «¿cuánto vale para tal cantidad?» ' +
          'es simplemente calcular un <b>valor numérico</b>.', 'ap-paso-clave');
        h += S.paso(2, 'Cuidado con el dominio: aunque el polinomio esté definido para todo número real, el problema solo admite valores con sentido ' +
          '(no se producen $-3$ unidades ni se recortan esquinas de $8$ cm en un cartón de $12$ cm de ancho).');
        return h;
      });
  };

  /* ==================================================================
     2.2 · SUMA, RESTA Y MULTIPLICACIÓN
     ================================================================== */

  /* ---------------- 6 · sumaRestaPol ------------------------------ */
  R.sumaRestaPol = function (node) {
    S.shell(node, 'Suma y resta con los términos alineados',
      'Escribe los dos polinomios con <code>^</code> para los exponentes: <code>2x^4-3x^3+2x^2+4x-1</code>. ' +
      'El applet los coloca uno debajo del otro, alineados por grados, y suma o resta columna a columna.',
      [{ id: 'p', type: 'text', label: 'Polinomio P(x)', value: '2x^4-3x^3+2x^2+4x-1', ancho: '20rem' },
      { id: 'q', type: 'text', label: 'Polinomio Q(x)', value: '7x^4-4x^3-5x+6', ancho: '20rem' },
      {
        id: 'op', type: 'select', label: 'Operación', value: 'mas', options: [
          { value: 'mas', label: 'P(x) + Q(x)' }, { value: 'menos', label: 'P(x) − Q(x)' }]
      },
      {
        type: 'presets', list: [
          { label: 'Suma clásica', apply: function (c) { c.p.value = '2x^4-3x^3+2x^2+4x-1'; c.q.value = '7x^4-4x^3-5x+6'; c.op.value = 'mas'; } },
          { label: 'Con huecos', apply: function (c) { c.p.value = 'x^8-x^7-x^6-2x^3+5x^2-1'; c.q.value = '8x^4-6x^3-2x+1'; c.op.value = 'mas'; } },
          { label: 'Resta', apply: function (c) { c.p.value = 'x^8-x^7-x^6-2x^3+5x^2-1'; c.q.value = '8x^4-6x^3-2x+1'; c.op.value = 'menos'; } },
          { label: 'Se pierde grado', title: 'Los coeficientes principales son opuestos', apply: function (c) { c.p.value = '3x^3+4x^2-1'; c.q.value = '-3x^3+5x-3'; c.op.value = 'mas'; } },
          { label: 'Sale el polinomio nulo', apply: function (c) { c.p.value = 'x^2+3x-4'; c.q.value = 'x^2+3x-4'; c.op.value = 'menos'; } },
          { label: 'Fracciones', apply: function (c) { c.p.value = 'x/2+3'; c.q.value = 'x/3-1'; c.op.value = 'mas'; } }
        ]
      }],
      function (v) {
        var p = P(v.p, 'x', 'el polinomio P(x)');
        var q0 = P(v.q, 'x', 'el polinomio Q(x)');
        var resta = (v.op === 'menos');
        var q = resta ? S.pOpuesto(q0) : q0;
        var res = S.pSuma(p, q);
        var gp = S.pGrado(p) === -Infinity ? 0 : S.pGrado(p);
        var gq = S.pGrado(q0) === -Infinity ? 0 : S.pGrado(q0);
        var g = Math.max(gp, gq);
        if (g > 9) throw Error('Usa polinomios de grado 9 como máximo para que la tabla de columnas se lea bien.');

        var cab = [''], f1 = ['P(x)'], f2 = [(resta ? '−Q(x)' : '+Q(x)')], f3 = ['Resultado'];
        for (var k = g; k >= 0; k--) {
          cab.push(K(k === 0 ? '\\text{indep.}' : (k === 1 ? 'x' : 'x^{' + k + '}')));
          f1.push(coef(p, k).n === 0n ? '<span class="ap-cif-mudo">—</span>' : K(monoTex(coef(p, k), k)));
          f2.push(coef(q, k).n === 0n ? '<span class="ap-cif-mudo">—</span>' : K(monoTex(coef(q, k), k)));
          f3.push(coef(res, k).n === 0n ? '<span class="ap-cif-mudo">0</span>' : K(monoTex(coef(res, k), k)));
        }
        var h = S.tabla(cab, [f1, f2, { clase: 'ap-hi', celdas: f3 }]);
        h += S.expr(resta ? 'P(x) − Q(x)' : 'P(x) + Q(x)', T(res));

        if (resta) h += S.expr('Opuesto del sustraendo', '-Q(x) = ' + T(S.pOpuesto(q0)));

        var gr = S.pGrado(res);
        h += S.kvs([
          'Grado de P: <b>' + S.pGradoTxt(p) + '</b>',
          'Grado de Q: <b>' + S.pGradoTxt(q0) + '</b>',
          'Grado del resultado: <b>' + S.pGradoTxt(res) + '</b>',
          gr === g ? S.badge('se conserva el grado mayor', 'si') : S.badge('el grado ha bajado', 'no')
        ]);
        h += S.paso(1, 'Se suman (o se restan) solo los coeficientes de <b>la misma potencia</b>: los términos semejantes. ' +
          'Donde un polinomio no tiene término, el coeficiente es $0$ y la columna se rellena con el otro.', 'ap-paso-clave');
        if (resta) h += S.paso(2, 'Restar es sumar el <b>opuesto</b>: $P - Q = P + (-Q)$, y $-Q$ se obtiene cambiando de signo <b>todos</b> los coeficientes de $Q$. ' +
          'Aquí falla la mayoría: solo se cambia el signo del primero.', 'ap-paso-avi');
        h += S.paso(resta ? 3 : 2, gr === g
          ? 'El grado de la suma es el mayor de los dos grados, porque los coeficientes principales no se han cancelado.'
          : 'Los coeficientes de grado $' + g + '$ eran opuestos y se han anulado: el grado ha <b>bajado</b>. ' +
          'Al sumar polinomios el grado nunca aumenta, pero puede disminuir.', 'ap-paso-clave');
        return h;
      });
  };

  /* ---------------- 7 · productoCruzado --------------------------- */
  R.productoCruzado = function (node) {
    S.shell(node, 'Multiplicar con la tabla de productos cruzados',
      'Escribe los dos factores (<code>3x^4-2x^2+x-1</code>, <code>-2x^5-3x^3+2</code>). El applet multiplica <b>todos</b> los términos de uno ' +
      'por todos los del otro, muestra la tabla y agrupa después las potencias iguales.',
      [{ id: 'p', type: 'text', label: 'Factor P(x)', value: '3x^4-2x^2+x-1', ancho: '19rem' },
      { id: 'q', type: 'text', label: 'Factor Q(x)', value: '-2x^5-3x^3+2', ancho: '19rem' },
      {
        type: 'presets', list: [
          { label: '(3x⁴−2x²+x−1)(−2x⁵−3x³+2)', apply: function (c) { c.p.value = '3x^4-2x^2+x-1'; c.q.value = '-2x^5-3x^3+2'; } },
          { label: '(x+3)(x²−2x+4)', apply: function (c) { c.p.value = 'x+3'; c.q.value = 'x^2-2x+4'; } },
          { label: '(x+1)(x−1)', title: 'Suma por diferencia', apply: function (c) { c.p.value = 'x+1'; c.q.value = 'x-1'; } },
          { label: '3x²(2x²−4x+6)', title: 'Monomio por polinomio', apply: function (c) { c.p.value = '3x^2'; c.q.value = '2x^2-4x+6'; } },
          { label: '(x⁴+x³+x²+x+1)(x−1)', apply: function (c) { c.p.value = 'x^4+x^3+x^2+x+1'; c.q.value = 'x-1'; } },
          { label: '(2x−1)(2x−1)', title: 'Cuadrado de una diferencia', apply: function (c) { c.p.value = '2x-1'; c.q.value = '2x-1'; } }
        ]
      }],
      function (v) {
        var p = P(v.p, 'x', 'el factor P(x)');
        var q = P(v.q, 'x', 'el factor Q(x)');
        if (S.pEsCero(p) || S.pEsCero(q))
          return S.expr('Producto', '0') + '<div class="mx-info">Si uno de los factores es el polinomio nulo, el producto es el polinomio nulo.</div>';
        var TP1 = terminos(p), TQ = terminos(q);
        if (TP1.length > 6 || TQ.length > 6) throw Error('Usa factores con 6 términos como máximo para que la tabla se lea bien.');
        var prod = S.pMult(p, q);

        var cab = ['$\\times$'];
        TP1.forEach(function (t) { cab.push(K(monoTex(t.c, t.g))); });
        var filas = [];
        TQ.forEach(function (u) {
          var fila = [K(monoTex(u.c, u.g))];
          TP1.forEach(function (t) {
            fila.push(K(monoTex(t.c.por(u.c), t.g + u.g)));
          });
          filas.push(fila);
        });
        var h = S.tabla(cab, filas);
        h += '<div class="mx-info">Cada casilla aplica la regla de los monomios ' +
          '$\\left(a x^{n}\\right)\\left(b x^{m}\\right) = a\\,b\\;x^{n+m}$: se multiplican los coeficientes y se <b>suman</b> los exponentes.</div>';

        /* agrupación por grados */
        var mapa = {};
        TQ.forEach(function (u) {
          TP1.forEach(function (t) {
            var gg = t.g + u.g;
            (mapa[gg] = mapa[gg] || []).push(t.c.por(u.c));
          });
        });
        var grados = Object.keys(mapa).map(Number).sort(function (a, b) { return b - a; });
        var fg = grados.map(function (gg) {
          var suma = mapa[gg].reduce(function (a, b) { return a.mas(b); }, new F(0));
          return {
            clase: suma.n === 0n ? 'ap-ko' : '',
            celdas: [K(gg === 0 ? '\\text{indep.}' : (gg === 1 ? 'x' : 'x^{' + gg + '}')),
              mapa[gg].map(function (c) { return K(c.tex(true)); }).join(' , '),
              K(suma.n === 0n ? '0' : monoTex(suma, gg))]
          };
        });
        h += S.tabla(['Potencia', 'Coeficientes que caen ahí', 'Término del producto'], fg);
        h += S.expr('Producto', T(p) === '' ? '' : TP(p) + ' \\cdot ' + TP(q) + ' = ' + T(prod));
        h += S.kvs([
          'Grados: <b>' + S.pGradoTxt(p) + '</b> y <b>' + S.pGradoTxt(q) + '</b>',
          'Grado del producto: <b>' + S.pGradoTxt(prod) + '</b> (la <b>suma</b> de los grados)',
          'Productos calculados: <b>' + (TP1.length * TQ.length) + '</b>',
          'Términos que quedan: <b>' + terminos(prod).length + '</b>'
        ]);
        h += S.paso(1, 'La propiedad <b>distributiva</b> es la que autoriza a multiplicar todos por todos: $A(B+C) = AB + AC$, aplicada tantas veces como haga falta.', 'ap-paso-clave');
        h += S.paso(2, 'El grado del producto es la suma de los grados porque el término de mayor grado solo puede salir de multiplicar los dos ' +
          'coeficientes principales, y su producto no puede ser cero.');
        h += S.paso(3, 'Al principio hay $' + TP1.length + ' \\cdot ' + TQ.length + ' = ' + (TP1.length * TQ.length) +
          '$ sumandos; después de agrupar potencias iguales quedan $' + terminos(prod).length + '$, siempre menos o igual.');
        return h;
      });
  };

  /* ---------------- 8 · notablesPol ------------------------------- */
  R.notablesPol = function (node) {
    S.shell(node, 'Identidades notables con comprobación numérica',
      'Elige la identidad y escribe las dos piezas $A$ y $B$ (normalmente monomios: <code>3x</code>, <code>2</code>, <code>x^2</code>). ' +
      'El applet desarrolla, muestra de dónde sale cada término y comprueba la igualdad con un valor concreto de $x$.',
      [{
        id: 't', type: 'select', label: 'Identidad', value: 'suma2', options: [
          { value: 'suma2', label: '(A + B)²' }, { value: 'resta2', label: '(A − B)²' },
          { value: 'sumapordif', label: '(A + B)(A − B)' }, { value: 'suma3', label: '(A + B)³' },
          { value: 'resta3', label: '(A − B)³' }]
      },
      { id: 'a', type: 'text', label: 'A', value: 'x', ancho: '8rem' },
      { id: 'b', type: 'text', label: 'B', value: '3', ancho: '8rem' },
      { id: 'x', type: 'number', label: 'Comprobar en x =', value: 2, min: -9, max: 9 },
      {
        type: 'presets', list: [
          { label: '(x+3)²', apply: function (c) { c.t.value = 'suma2'; c.a.value = 'x'; c.b.value = '3'; c.x.value = 2; } },
          { label: '(7x−5)²', apply: function (c) { c.t.value = 'resta2'; c.a.value = '7x'; c.b.value = '5'; c.x.value = 1; } },
          { label: '(3x+4)(3x−4)', apply: function (c) { c.t.value = 'sumapordif'; c.a.value = '3x'; c.b.value = '4'; c.x.value = 2; } },
          { label: '(4x+5)³', apply: function (c) { c.t.value = 'suma3'; c.a.value = '4x'; c.b.value = '5'; c.x.value = 1; } },
          { label: '(2x−1)³', apply: function (c) { c.t.value = 'resta3'; c.a.value = '2x'; c.b.value = '1'; c.x.value = -1; } },
          { label: '(x²+2)²', apply: function (c) { c.t.value = 'suma2'; c.a.value = 'x^2'; c.b.value = '2'; c.x.value = 3; } }
        ]
      }],
      function (v) {
        var A = P(v.a, 'x', 'la pieza A');
        var B = P(v.b, 'x', 'la pieza B');
        var x = S.entero(v.x, -9, 9, 'El valor de x');
        var N = S.notable(v.t, A, B);
        var h = S.expr(N.nombre, N.izq + ' = ' + N.derTex);

        var A2 = S.pMult(A, A), B2 = S.pMult(B, B), AB = S.pMult(A, B);
        var piezas;
        if (v.t === 'suma2') piezas = [['A^2', T(A2)], ['2AB', T(S.pEscala(AB, new F(2)))], ['B^2', T(B2)]];
        else if (v.t === 'resta2') piezas = [['A^2', T(A2)], ['-2AB', T(S.pEscala(AB, new F(-2)))], ['B^2', T(B2)]];
        else if (v.t === 'sumapordif') piezas = [['A^2', T(A2)], ['-B^2', T(S.pOpuesto(B2))]];
        else if (v.t === 'suma3') piezas = [['A^3', T(S.pPot(A, 3))], ['3A^2B', T(S.pEscala(S.pMult(A2, B), new F(3)))],
          ['3AB^2', T(S.pEscala(S.pMult(A, B2), new F(3)))], ['B^3', T(S.pPot(B, 3))]];
        else piezas = [['A^3', T(S.pPot(A, 3))], ['-3A^2B', T(S.pEscala(S.pMult(A2, B), new F(-3)))],
          ['3AB^2', T(S.pEscala(S.pMult(A, B2), new F(3)))], ['-B^3', T(S.pOpuesto(S.pPot(B, 3)))]];
        h += S.tabla(['Pieza de la fórmula', 'Con estos A y B vale'], piezas.map(function (t) {
          return { celdas: [K(t[0]), K(t[1])] };
        }));

        /* comprobación numérica */
        var a = S.pEval(A, new F(x)).valor, b = S.pEval(B, new F(x)).valor, izq;
        if (v.t === 'suma2') izq = a.mas(b).por(a.mas(b));
        else if (v.t === 'resta2') izq = a.menos(b).por(a.menos(b));
        else if (v.t === 'sumapordif') izq = a.mas(b).por(a.menos(b));
        else if (v.t === 'suma3') izq = a.mas(b).por(a.mas(b)).por(a.mas(b));
        else izq = a.menos(b).por(a.menos(b)).por(a.menos(b));
        var der = S.pEval(N.der, new F(x)).valor;
        var ok = izq.cmp(der) === 0;
        h += S.tabla(['$x$', '$A(x)$', '$B(x)$', 'Lado izquierdo', 'Lado derecho', '¿Coinciden?'],
          [{
            celdas: [K(String(x)), K(a.tex(true)), K(b.tex(true)), K(izq.tex(true)), K(der.tex(true)),
              S.badge(ok ? 'sí' : 'no', ok ? 'si' : 'no')]
          }]);

        h += S.paso(1, 'Una identidad notable no es una fórmula mágica: es el resultado de multiplicar y agrupar. ' +
          'Los dos términos $AB$ del cuadrado aparecen porque $A \\cdot B$ y $B \\cdot A$ son términos semejantes y se suman.', 'ap-paso-clave');
        h += S.paso(2, 'Comprobar con un valor concreto no demuestra la identidad, pero <b>detecta errores</b>: si los dos lados no coinciden, ' +
          'seguro que el desarrollo está mal.');
        h += '<div class="mx-info">Error frecuentísimo: $\\left(A+B\\right)^2 \\neq A^2 + B^2$. Falta el doble producto, que aquí vale ' +
          '$' + T(S.pEscala(AB, new F(2))) + '$.</div>';
        return h;
      });
  };

  /* ---------------- 9 · cuadradoGeom ----------------------------- */
  R.cuadradoGeom = function (node) {
    S.shell(node, 'Demostración geométrica del cuadrado de una suma',
      'Elige dos longitudes $a$ y $b$ (números enteros de 1 a 10) y el applet descompone el cuadrado de lado $a+b$ en cuatro piezas. ' +
      'Sumando sus áreas se obtiene la identidad.',
      [{ id: 'a', type: 'number', label: 'a', value: 5, min: 1, max: 10 },
      { id: 'b', type: 'number', label: 'b', value: 3, min: 1, max: 10 },
      { id: 'dif', type: 'check', label: 'Ver también el cuadrado de la diferencia', value: false },
      {
        type: 'presets', list: [
          { label: 'a=5, b=3', apply: function (c) { c.a.value = 5; c.b.value = 3; c.dif.checked = false; } },
          { label: 'a=7, b=2', apply: function (c) { c.a.value = 7; c.b.value = 2; c.dif.checked = false; } },
          { label: 'a=b=4', title: 'Las cuatro piezas son iguales', apply: function (c) { c.a.value = 4; c.b.value = 4; c.dif.checked = false; } },
          { label: 'a=10, b=1', apply: function (c) { c.a.value = 10; c.b.value = 1; c.dif.checked = false; } },
          { label: 'Con la diferencia', apply: function (c) { c.a.value = 8; c.b.value = 3; c.dif.checked = true; } }
        ]
      }],
      function (v) {
        var a = S.entero(v.a, 1, 10, 'La longitud a');
        var b = S.entero(v.b, 1, 10, 'La longitud b');
        var W = 1000, H = 560;
        var lado = 380, esc = lado / (a + b);
        var x0 = 120, y0 = 95;
        var la = a * esc, lb = b * esc;
        var body = '';
        body += S.txt(W / 2, 46, 'El cuadrado de lado a + b = ' + (a + b) + ' se parte en cuatro piezas',
          { size: 21, weight: '700', fill: COL.azulOsc });
        /* piezas */
        body += S.rect(x0, y0, la, la, 'rgba(25,118,210,.20)', COL.azul, { r: 2 });
        body += S.rect(x0 + la, y0, lb, la, 'rgba(224,123,0,.22)', COL.naranja, { r: 2 });
        body += S.rect(x0, y0 + la, la, lb, 'rgba(224,123,0,.22)', COL.naranja, { r: 2 });
        body += S.rect(x0 + la, y0 + la, lb, lb, 'rgba(46,125,50,.22)', COL.verde, { r: 2 });
        /* rótulos internos */
        body += S.txt(x0 + la / 2, y0 + la / 2 + 8, 'a² = ' + (a * a), { size: 22, weight: '700', fill: COL.azulOsc });
        body += S.txt(x0 + la + lb / 2, y0 + la / 2 + 8, 'a·b', { size: Math.min(20, Math.max(15, lb / 2)), weight: '700', fill: COL.naranja });
        body += S.txt(x0 + la / 2, y0 + la + lb / 2 + 7, 'a·b = ' + (a * b), { size: Math.min(20, Math.max(15, lb / 2 + 6)), weight: '700', fill: COL.naranja });
        body += S.txt(x0 + la + lb / 2, y0 + la + lb / 2 + 7, 'b²', { size: Math.min(20, Math.max(14, lb / 2)), weight: '700', fill: COL.verde });
        /* medidas */
        body += S.txt(x0 + la / 2, y0 - 16, 'a = ' + a, { size: 19, fill: COL.azulOsc });
        body += S.txt(x0 + la + lb / 2, y0 - 16, 'b = ' + b, { size: 19, fill: COL.verde });
        body += S.txt(x0 - 20, y0 + la / 2 + 6, 'a = ' + a, { size: 19, fill: COL.azulOsc, anchor: 'end' });
        body += S.txt(x0 - 20, y0 + la + lb / 2 + 6, 'b = ' + b, { size: 19, fill: COL.verde, anchor: 'end' });
        body += S.line(x0, y0 + lado + 26, x0 + lado, y0 + lado + 26, COL.gris, 2);
        body += S.txt(x0 + lado / 2, y0 + lado + 50, 'lado total: a + b = ' + (a + b), { size: 19, fill: COL.gris });
        /* cuentas a la derecha */
        var xr = x0 + lado + 80;
        body += S.txt(xr, y0 + 30, 'Área del cuadrado grande', { size: 19, weight: '700', fill: COL.texto, anchor: 'start' });
        body += S.txt(xr, y0 + 62, '(a + b)² = ' + (a + b) + '² = ' + Math.pow(a + b, 2), { size: 20, fill: COL.azulOsc, anchor: 'start' });
        body += S.txt(xr, y0 + 116, 'Suma de las cuatro piezas', { size: 19, weight: '700', fill: COL.texto, anchor: 'start' });
        body += S.txt(xr, y0 + 148, 'a² + a·b + a·b + b²', { size: 20, fill: COL.texto, anchor: 'start' });
        body += S.txt(xr, y0 + 178, '= ' + (a * a) + ' + ' + (a * b) + ' + ' + (a * b) + ' + ' + (b * b) + ' = ' + Math.pow(a + b, 2),
          { size: 20, fill: COL.verde, anchor: 'start' });
        body += S.txt(xr, y0 + 232, 'Los dos rectángulos iguales', { size: 19, weight: '700', fill: COL.texto, anchor: 'start' });
        body += S.txt(xr, y0 + 262, 'explican el doble producto 2ab', { size: 19, fill: COL.naranja, anchor: 'start' });

        var h = S.svgWrap(body, W, H, 'Cuadrado de lado a+b dividido en cuatro piezas',
          'El área del cuadrado grande se puede contar de dos formas: como $(a+b)^2$ o sumando las cuatro piezas. Las dos cuentas tienen que dar lo mismo.');
        h += S.expr('Identidad leída en la figura', '\\left(a + b\\right)^{2} = a^{2} + 2ab + b^{2}');
        h += S.expr('Con estos números', '\\left(' + a + ' + ' + b + '\\right)^{2} = ' + (a * a) + ' + 2 \\cdot ' + a + ' \\cdot ' + b +
          ' + ' + (b * b) + ' = ' + Math.pow(a + b, 2));
        if (v.dif) {
          if (b >= a) h += '<div class="mx-info">Para ver el cuadrado de la diferencia hace falta $a > b$; prueba con $a = 8$ y $b = 3$.</div>';
          else {
            h += S.expr('Cuadrado de la diferencia', '\\left(a - b\\right)^{2} = a^{2} - 2ab + b^{2}');
            h += '<div class="mx-info">Se lee en la misma figura: al cuadrado de lado $a$ se le quitan los dos rectángulos $ab$, ' +
              'pero al hacerlo se ha quitado <b>dos veces</b> el cuadradito $b^2$, así que hay que devolverlo. Con $a = ' + a + '$ y $b = ' + b +
              '$: $' + (a * a) + ' - 2 \\cdot ' + (a * b) + ' + ' + (b * b) + ' = ' + Math.pow(a - b, 2) + ' = ' + (a - b) + '^2$.</div>';
          }
        }
        h += S.paso(1, 'Contar la misma área de dos maneras distintas es una demostración completa para longitudes positivas.', 'ap-paso-clave');
        h += S.paso(2, 'La identidad algebraica va más lejos que la figura: vale también para números negativos y para polinomios cualesquiera en el lugar de $a$ y $b$.');
        return h;
      });
  };

  /* ---------------- 10 · trianguloPascal ------------------------- */
  R.trianguloPascal = function (node) {
    S.shell(node, 'Triángulo de Tartaglia y binomio de Newton',
      'Elige el exponente $n$ (de 0 a 10) y, si quieres, las piezas $A$ y $B$ del binomio (<code>x</code>, <code>2</code>, <code>3x</code>…). ' +
      'La fila $n$ del triángulo da los coeficientes del desarrollo de $\\left(A+B\\right)^n$.',
      [{ id: 'n', type: 'range', label: 'n', value: 4, min: 0, max: 10, step: 1 },
      { id: 'a', type: 'text', label: 'A', value: 'x', ancho: '8rem' },
      { id: 'b', type: 'text', label: 'B', value: '2', ancho: '8rem' },
      {
        id: 'sg', type: 'select', label: 'Binomio', value: 'mas', options: [
          { value: 'mas', label: '(A + B)ⁿ' }, { value: 'menos', label: '(A − B)ⁿ' }]
      },
      {
        type: 'presets', list: [
          { label: '(x+2)⁴', apply: function (c) { c.n.value = 4; c.a.value = 'x'; c.b.value = '2'; c.sg.value = 'mas'; } },
          { label: '(x−1)⁵', apply: function (c) { c.n.value = 5; c.a.value = 'x'; c.b.value = '1'; c.sg.value = 'menos'; } },
          { label: '(2x+1)³', apply: function (c) { c.n.value = 3; c.a.value = '2x'; c.b.value = '1'; c.sg.value = 'mas'; } },
          { label: '(x+1)⁷', apply: function (c) { c.n.value = 7; c.a.value = 'x'; c.b.value = '1'; c.sg.value = 'mas'; } },
          { label: '(x²−3)⁴', apply: function (c) { c.n.value = 4; c.a.value = 'x^2'; c.b.value = '3'; c.sg.value = 'menos'; } },
          { label: 'Fila 10 completa', apply: function (c) { c.n.value = 10; c.a.value = 'x'; c.b.value = '1'; c.sg.value = 'mas'; } }
        ]
      }],
      function (v) {
        var n = S.entero(v.n, 0, 10, 'El exponente n');
        var A = P(v.a, 'x', 'la pieza A');
        var B = P(v.b, 'x', 'la pieza B');
        var neg = (v.sg === 'menos');

        /* figura del triángulo */
        var W = 1000, H = 120 + (n + 1) * 40, filas = [];
        for (var i = 0; i <= n; i++) {
          var f = [];
          for (var k = 0; k <= i; k++) f.push(comb(i, k));
          filas.push(f);
        }
        var body = S.txt(W / 2, 44, 'Triángulo de Tartaglia (o de Pascal) hasta la fila ' + n,
          { size: 21, weight: '700', fill: COL.azulOsc });
        var dx = Math.min(74, (W - 200) / (n + 1));
        filas.forEach(function (f, i) {
          var y = 90 + i * 40;
          f.forEach(function (c, k) {
            var x = W / 2 + (k - i / 2) * dx;
            var ultima = (i === n);
            body += S.circle(x, y - 6, 17, ultima ? 'rgba(25,118,210,.18)' : '#f7f9fc', ultima ? COL.azul : '#dfe6ee', ultima ? 2.2 : 1.4);
            body += S.txt(x, y, String(c), { size: c > 99 ? 15 : 17, weight: ultima ? '700' : 'normal', fill: ultima ? COL.azulOsc : COL.texto });
          });
        });
        body += S.txt(W / 2, 90 + (n + 1) * 40 + 4, 'cada número es la suma de los dos que tiene encima',
          { size: 17, fill: COL.gris });
        var h = S.svgWrap(body, W, Math.max(380, Math.min(620, H + 30)), 'Triángulo de Tartaglia',
          'La fila $n$ tiene $n+1$ números, empieza y acaba en $1$ y es simétrica. Cada número interior es la suma de los dos de encima.');

        /* desarrollo simbólico con letras */
        var sim = '';
        for (var k2 = 0; k2 <= n; k2++) {
          var c2 = comb(n, k2);
          var signo = (neg && k2 % 2 === 1) ? ' - ' : ' + ';
          var cuerpo = (c2 === 1 ? '' : String(c2)) + letraPot('a', n - k2) + letraPot('b', k2);
          if (cuerpo === '') cuerpo = '1';
          sim += (k2 === 0 ? '' : signo) + cuerpo;
        }
        h += S.expr('Fórmula del binomio', '\\left(a ' + (neg ? '-' : '+') + ' b\\right)^{' + n + '} = ' + sim);

        /* desarrollo real */
        var base = neg ? S.pResta(A, B) : S.pSuma(A, B);
        var pot = S.pPot(base, n);
        h += S.expr('Sustituyendo tus A y B', '\\left(' + T(A) + (neg ? ' - ' : ' + ') + T(B) + '\\right)^{' + n + '} = ' + T(pot));

        var filaN = filas[n];
        h += S.tabla(['k'].concat(filaN.map(function (_, k) { return String(k); })),
          [['coeficiente'].concat(filaN.map(function (c) { return K(String(c)); })),
          ['término'].concat(filaN.map(function (c, k) {
            return K(((c === 1) ? '' : String(c)) + letraPot('a', n - k) + letraPot('b', k) || '1');
          }))]);
        h += S.kvs([
          'Número de términos: <b>' + (n + 1) + '</b>',
          'Suma de la fila: <b>' + Math.pow(2, n) + ' = 2^' + n + '</b>',
          'Grado del desarrollo: <b>' + S.pGradoTxt(pot) + '</b>',
          neg ? 'Los signos alternan: $+,-,+,-\\ldots$' : 'Todos los signos son $+$'
        ]);
        h += S.paso(1, 'En cada término los exponentes de $a$ y $b$ suman siempre $' + n + '$: de ahí que el grado del desarrollo sea $n$ veces el grado del binomio.', 'ap-paso-clave');
        h += S.paso(2, 'La fila $n$ se construye sumando los dos números de encima, o con los números combinatorios ' +
          '$\\binom{n}{k} = \\dfrac{n!}{k!\\,(n-k)!}$. Para $n = 2$ y $n = 3$ se obtienen las identidades notables de siempre.');
        h += S.paso(3, 'Si el binomio es una diferencia, escribe $A - B = A + (-B)$: las potencias impares de $-B$ son negativas y por eso los signos van alternando.');
        return h;
      });
  };

  /* ==================================================================
     2.3 · DIVISIÓN DE POLINOMIOS
     ================================================================== */

  /* ---------------- 11 · divisionLargaPaso ----------------------- */
  R.divisionLargaPaso = function (node) {
    S.shell(node, 'División larga paso a paso',
      'Escribe el dividendo y el divisor con <code>^</code> (por ejemplo <code>6x^4+11x^3-9x^2-25x+10</code> entre <code>2x^2+x-3</code>). ' +
      'El applet hace la división en la caja de siempre y explica cada etapa.',
      [{ id: 'a', type: 'text', label: 'Dividendo D(x)', value: '6x^4+11x^3-9x^2-25x+10', ancho: '20rem' },
      { id: 'b', type: 'text', label: 'Divisor d(x)', value: '2x^2+x-3', ancho: '16rem' },
      {
        type: 'presets', list: [
          { label: '(6x⁴+11x³−9x²−25x+10) : (2x²+x−3)', apply: function (c) { c.a.value = '6x^4+11x^3-9x^2-25x+10'; c.b.value = '2x^2+x-3'; } },
          { label: '(x³+4x²−2x+1) : (x+5)', apply: function (c) { c.a.value = 'x^3+4x^2-2x+1'; c.b.value = 'x+5'; } },
          { label: '(x⁶−2x⁴+3x³−2x+6) : (x−1)', apply: function (c) { c.a.value = 'x^6-2x^4+3x^3-2x+6'; c.b.value = 'x-1'; } },
          { label: 'División exacta', title: 'El resto sale 0', apply: function (c) { c.a.value = 'x^3-4x^2+5x-2'; c.b.value = 'x-2'; } },
          { label: 'Coeficientes fraccionarios', apply: function (c) { c.a.value = '2x^3+x-1'; c.b.value = '2x-1'; } },
          { label: 'Divisor de grado mayor', title: 'No se puede dividir', apply: function (c) { c.a.value = '3x^2+2x-1'; c.b.value = '5x^4+1'; } }
        ]
      }],
      function (v) {
        var A = P(v.a, 'x', 'el dividendo D(x)');
        var B = P(v.b, 'x', 'el divisor d(x)');
        if (S.pEsCero(B)) throw Error('El divisor no puede ser el polinomio nulo: no se puede dividir entre cero.');
        var gA = S.pGrado(A), gB = S.pGrado(B);
        var D = S.pDiv(A, B);
        var h = '';

        if (gA < gB) {
          h += S.expr('Cociente', '0') + S.expr('Resto', T(A));
          h += '<div class="ap-card ap-card-ko"><span class="ap-card-tit">El divisor tiene grado mayor que el dividendo</span>' +
            'Aquí $\\text{grado}(D) = ' + S.pGradoTxt(A) + '$ y $\\text{grado}(d) = ' + S.pGradoTxt(B) + '$. ' +
            'La división no se puede empezar: el cociente es el polinomio nulo y el resto es el propio dividendo, ' +
            'igual que al dividir $3$ entre $7$ en los enteros. Y encaja con la identidad: $' + T(A) + ' = ' + TP(B) + ' \\cdot 0 + ' + T(A) + '$.</div>';
          return h;
        }

        h += S.divisionLargaHTML(A, B);
        h += S.expr('Cociente c(x)', T(D.q)) + S.expr('Resto r(x)', T(D.r));

        D.pasos.forEach(function (s, i) {
          var texto = 'Dividendo parcial $' + s.dividendoTex + '$. Su término de mayor grado entre el del divisor da $' + s.monoTex +
            '$, que es el término siguiente del cociente. Se multiplica por todo el divisor, $' + s.productoTex +
            '$, y se resta: queda $' + s.restoTex + '$.';
          h += S.paso(i + 1, texto, i === D.pasos.length - 1 ? 'ap-paso-clave' : '');
        });
        h += S.paso(D.pasos.length + 1, 'El grado de $' + T(D.r) + '$ ya es menor que el grado del divisor, así que el proceso termina: ese es el <b>resto</b>.',
          'ap-paso-clave');

        var exacta = S.pEsCero(D.r);
        h += S.kvs([
          'Grado del dividendo: <b>' + S.pGradoTxt(A) + '</b>',
          'Grado del divisor: <b>' + S.pGradoTxt(B) + '</b>',
          'Grado del cociente: <b>' + S.pGradoTxt(D.q) + '</b>',
          'Grado del resto: <b>' + S.pGradoTxt(D.r) + '</b>',
          'Etapas: <b>' + D.pasos.length + '</b>',
          exacta ? S.badge('división exacta', 'si') : S.badge('división con resto', 'info')
        ]);
        h += S.expr('Identidad de la división', T(A) + ' = ' + TP(B) + ' \\cdot ' + TP(D.q) + (exacta ? '' : ' + ' + TP(D.r)));
        h += '<div class="mx-info">' + (exacta
          ? 'Como el resto es nulo, $d(x)$ es un <b>divisor</b> de $D(x)$ y $D(x)$ es múltiplo de $d(x)$.'
          : 'El resto no es nulo: la división no es exacta y $d(x)$ no divide a $D(x)$.') +
          ' Fíjate en que el grado del cociente es siempre $\\text{grado}(D) - \\text{grado}(d)$.</div>';
        return h;
      });
  };

  /* ---------------- 12 · divisionMonomio ------------------------- */
  R.divisionMonomio = function (node) {
    S.shell(node, 'Dividir entre un monomio, término a término',
      'Escribe el dividendo y el monomio divisor mediante su coeficiente y su grado. Por ejemplo, dividendo ' +
      '<code>8x^4-2x^3-2x^2-x+4</code> y divisor $4x$ (coeficiente <code>4</code>, grado <code>1</code>).',
      [{ id: 'p', type: 'text', label: 'Dividendo D(x)', value: '8x^4-2x^3-2x^2-x+4', ancho: '20rem' },
      { id: 'k', type: 'text', label: 'Coeficiente del monomio', value: '4', ancho: '9rem' },
      { id: 'g', type: 'number', label: 'Grado del monomio', value: 1, min: 0, max: 5 },
      {
        type: 'presets', list: [
          { label: '(8x⁴−2x³−2x²−x+4) : 4x', apply: function (c) { c.p.value = '8x^4-2x^3-2x^2-x+4'; c.k.value = '4'; c.g.value = 1; } },
          { label: '(6x⁵−9x³+3x²) : 3x²', title: 'División exacta', apply: function (c) { c.p.value = '6x^5-9x^3+3x^2'; c.k.value = '3'; c.g.value = 2; } },
          { label: '(x⁴+x²+1) : x³', apply: function (c) { c.p.value = 'x^4+x^2+1'; c.k.value = '1'; c.g.value = 3; } },
          { label: '(12x³−4x²+8x) : 4', title: 'Grado 0: producto por escalar', apply: function (c) { c.p.value = '12x^3-4x^2+8x'; c.k.value = '4'; c.g.value = 0; } },
          { label: '(5x³+2x) : 2x²', apply: function (c) { c.p.value = '5x^3+2x'; c.k.value = '2'; c.g.value = 2; } },
          { label: '(x²+1) : x⁵', title: 'El divisor tiene grado mayor', apply: function (c) { c.p.value = 'x^2+1'; c.k.value = '1'; c.g.value = 5; } }
        ]
      }],
      function (v) {
        var p = P(v.p, 'x', 'el dividendo D(x)');
        var k = S.fraccionTxt(v.k, 'El coeficiente del monomio');
        if (k.n === 0n) throw Error('El coeficiente del monomio no puede ser 0: el divisor no puede ser el polinomio nulo. Escribe por ejemplo 4.');
        var g = S.entero(v.g, 0, 5, 'El grado del monomio');
        var B = S.pMono(k, g);
        var filas = [], q = S.CERO(), r = S.CERO();
        terminos(p).forEach(function (t) {
          var reparto;
          if (t.g >= g) {
            var c2 = t.c.entre(k);
            q = S.pSuma(q, S.pMono(c2, t.g - g));
            reparto = ['al cociente', K(monoTex(c2, t.g - g))];
          } else {
            r = S.pSuma(r, S.pMono(t.c, t.g));
            reparto = ['al resto', K(monoTex(t.c, t.g))];
          }
          filas.push({
            clase: t.g >= g ? '' : 'ap-ko',
            celdas: [K(monoTex(t.c, t.g)), K('\\dfrac{' + monoTex(t.c, t.g) + '}{' + monoTex(k, g) + '}'), reparto[0], reparto[1]]
          });
        });
        var h = S.expr('División planteada', '\\dfrac{' + T(p) + '}{' + monoTex(k, g) + '}');
        h += S.tabla(['Término del dividendo', 'Se divide entre el monomio', 'Va', 'Resultado'], filas);
        h += S.expr('Cociente c(x)', T(q)) + S.expr('Resto r(x)', T(r));

        var D = S.pDiv(p, B);
        var ok = S.pIgual(D.q, q) && S.pIgual(D.r, r);
        h += S.kvs([
          'Divisor: <b>' + K(monoTex(k, g)) + '</b> (grado ' + g + ')',
          'Grado del resto: <b>' + S.pGradoTxt(r) + '</b>',
          S.pEsCero(r) ? S.badge('división exacta', 'si') : S.badge('queda resto', 'info'),
          'Coincide con el algoritmo general: ' + S.badge(ok ? 'sí' : 'no', ok ? 'si' : 'no')
        ]);
        h += S.paso(1, 'Dividir entre un monomio es reparto puro: cada término del dividendo se divide entre el monomio usando ' +
          '$\\dfrac{a x^{n}}{b x^{m}} = \\dfrac{a}{b} x^{n-m}$.', 'ap-paso-clave');
        h += S.paso(2, 'Los términos de grado <b>menor</b> que el del divisor no pueden dividirse sin que aparezcan exponentes negativos ' +
          '(y eso ya no es un polinomio): esos términos se quedan tal cual en el <b>resto</b>.', 'ap-paso-avi');
        h += S.paso(3, 'Comprobación: $' + TP(B) + ' \\cdot ' + TP(q) + (S.pEsCero(r) ? '' : ' + ' + TP(r)) + ' = ' +
          T(S.pSuma(S.pMult(B, q), r)) + '$, que es el dividendo de partida.');
        if (g === 0) h += '<div class="mx-info">Con grado $0$ el divisor es un número: dividir entre él es multiplicar por su inverso, ' +
          'es decir, un producto por escalar. El resto es siempre nulo.</div>';
        return h;
      });
  };

  /* ---------------- 13 · pruebaDivision -------------------------- */
  R.pruebaDivision = function (node) {
    S.shell(node, 'Comprobador de la identidad D = d · c + r',
      'Escribe el dividendo, el divisor y <b>tu</b> cociente y resto (deja el resto en <code>0</code> si crees que la división es exacta). ' +
      'El applet comprueba las dos condiciones: que se cumpla la identidad y que el grado del resto sea menor que el del divisor.',
      [{ id: 'd', type: 'text', label: 'Dividendo D(x)', value: 'x^4-3x^2+2x-1', ancho: '17rem' },
      { id: 'v', type: 'text', label: 'Divisor d(x)', value: 'x^2-2x+1', ancho: '14rem' },
      { id: 'c', type: 'text', label: 'Tu cociente c(x)', value: 'x^2+2x', ancho: '14rem' },
      { id: 'r', type: 'text', label: 'Tu resto r(x)', value: '-1', ancho: '11rem' },
      {
        type: 'presets', list: [
          { label: 'Correcta', apply: function (c) { c.d.value = 'x^4-3x^2+2x-1'; c.v.value = 'x^2-2x+1'; c.c.value = 'x^2+2x'; c.r.value = '-1'; } },
          { label: 'Resto de grado demasiado alto', apply: function (c) { c.d.value = 'x^4-3x^2+2x-1'; c.v.value = 'x^2-2x+1'; c.c.value = 'x^2'; c.r.value = '2x^3-4x^2+2x-1'; } },
          { label: 'Cociente equivocado', apply: function (c) { c.d.value = 'x^3+4x^2-2x+1'; c.v.value = 'x+5'; c.c.value = 'x^2-x+3'; c.r.value = '14'; } },
          { label: 'La misma, bien hecha', apply: function (c) { c.d.value = 'x^3+4x^2-2x+1'; c.v.value = 'x+5'; c.c.value = 'x^2-x+3'; c.r.value = '-14'; } },
          { label: 'Exacta', apply: function (c) { c.d.value = 'x^3-4x^2+5x-2'; c.v.value = 'x-1'; c.c.value = 'x^2-3x+2'; c.r.value = '0'; } },
          { label: 'Con fracciones', apply: function (c) { c.d.value = '2x^3+x-1'; c.v.value = '2x-1'; c.c.value = 'x^2+x/2+3/4'; c.r.value = '-1/4'; } }
        ]
      }],
      function (vv) {
        var D = P(vv.d, 'x', 'el dividendo D(x)');
        var d = P(vv.v, 'x', 'el divisor d(x)');
        if (S.pEsCero(d)) throw Error('El divisor no puede ser el polinomio nulo: la identidad de la división exige d(x) distinto de cero.');
        var c = P(vv.c, 'x', 'tu cociente c(x)');
        var r = P(vv.r, 'x', 'tu resto r(x)');
        var recon = S.pSuma(S.pMult(d, c), r);
        var okId = S.pIgual(recon, D);
        var gr = S.pGrado(r), gd = S.pGrado(d);
        var okGrado = S.pEsCero(r) || gr < gd;

        var h = S.expr('Lo que propones', T(D) + ' \\overset{?}{=} ' + TP(d) + ' \\cdot ' + TP(c) + ' + ' + TP(r));
        h += S.expr('Producto d(x) · c(x)', T(S.pMult(d, c)));
        h += S.expr('d(x) · c(x) + r(x)', T(recon));

        h += '<div class="ap-grid2">' +
          '<div class="ap-card ' + (okId ? 'ap-card-ok' : 'ap-card-ko') + '"><span class="ap-card-tit">Identidad D = d · c + r</span>' +
          (okId ? 'Se cumple: al reconstruir sale exactamente el dividendo.'
            : 'No se cumple. La diferencia es $' + T(S.pResta(D, recon)) + '$, que debería ser el polinomio nulo.') + '</div>' +
          '<div class="ap-card ' + (okGrado ? 'ap-card-ok' : 'ap-card-ko') + '"><span class="ap-card-tit">Condición de grado del resto</span>' +
          'grado($r$) = ' + S.pGradoTxt(r) + ' y grado($d$) = ' + S.pGradoTxt(d) + '. ' +
          (okGrado ? 'Correcto: el resto tiene grado menor que el divisor (o es nulo).'
            : 'Falla: con este resto la división <b>no ha terminado</b>, todavía se puede seguir dividiendo.') + '</div></div>';

        var buena = S.pDiv(D, d);
        h += S.tabla(['', 'Tu respuesta', 'La correcta'], [
          ['Cociente', K(T(c)), K(T(buena.q))],
          ['Resto', K(T(r)), K(T(buena.r))],
          ['Veredicto', S.badge(okId && okGrado ? 'válida' : 'no válida', okId && okGrado ? 'si' : 'no'),
            S.badge(S.pEsCero(buena.r) ? 'división exacta' : 'con resto', 'info')]
        ]);
        h += S.paso(1, 'La identidad $D = d \\cdot c + r$ es la <b>prueba de la división</b>, la misma que en los números enteros: ' +
          '$672 = 12 \\cdot 56 + 0$, o $672 = 12 \\cdot 48 + 96$ si el cociente se elige mal.', 'ap-paso-clave');
        h += S.paso(2, 'Ojo: la identidad sola no basta. Sin la condición $\\text{grado}(r) < \\text{grado}(d)$ hay infinitas parejas ' +
          '$(c, r)$ que la cumplen; con ella, el cociente y el resto son <b>únicos</b>.', 'ap-paso-avi');
        h += S.paso(3, 'Otra comprobación rápida: si la identidad se cumple, también se cumple para cualquier valor numérico. ' +
          'Con $x = 1$: $D(1) = ' + S.pEval(D, new F(1)).valor.txt() + '$ y $d(1) \\cdot c(1) + r(1) = ' +
          S.pEval(recon, new F(1)).valor.txt() + '$.');
        return h;
      });
  };

  S.extraA = true;
})();
