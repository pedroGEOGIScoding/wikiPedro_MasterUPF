/* =====================================================================
   eq-applets-b.js · Módulo B del Tema 3 Ecuaciones e inecuaciones
   Applets de ecuaciones racionales, radicales (irracionales),
   polinómicas por factorización (Ruffini, raíces racionales,
   producto nulo), logarítmicas y exponenciales.

   Claves registradas (14):
     racionalLab      laboratorio de ecuación racional con dominio
     racionalMcm      resolución por m.c.m. de tres fracciones
     elevarCuadrado   por qué elevar al cuadrado crea soluciones falsas
     radicalCheck     resolutor de √A = B con tabla de comprobación
     radicalDoble     ecuación con dos radicales, dos elevaciones
     productoNulo     principio del producto nulo, factor a factor
     ruffiniLab       Ruffini interactivo y teorema del resto
     raicesCandidatas divisores del término independiente
     factorizaTotal   factorización completa paso a paso
     logPropiedades   verificador de las propiedades del logaritmo
     logResolutor     ecuación logarítmica con dominio y descartes
     expoResolutor    exponencial: vía exacta y vía logarítmica
     expoCambioVar    cambio de variable t = a^x
     expoModelos      interés compuesto, población y desintegración

   Depende de eq-applets.js (window.EQ). Se carga después.
   ===================================================================== */
(function () {
  'use strict';
  var S = window.EQ;
  if (!S) { console.error('[ecuaciones] eq-applets-b.js sin núcleo'); return; }
  var R = S.registry, K = S.K, KD = S.KD, F = S.Frac, T = S.pTex, COL = S.COL;

  /* ==================================================================
     0 · utilidades locales del módulo
     ================================================================== */

  /* Botones de escenario a partir de una lista { txt, tip, set } */
  function chips(list) {
    return {
      type: 'presets',
      list: list.map(function (p) {
        return {
          label: p.txt, title: p.tip || '',
          apply: function (ctl) {
            Object.keys(p.set).forEach(function (k) {
              var el = ctl[k];
              if (!el) return;
              if (el.type === 'checkbox') el.checked = !!p.set[k];
              else el.value = String(p.set[k]);
              var sig = el.nextSibling;
              if (sig && sig.className === 'mx-mono') sig.textContent = String(p.set[k]).replace('.', ',');
            });
          }
        };
      })
    };
  }

  /* Envoltorio: cualquier error se muestra como aviso, nunca rompe nada */
  function safe(fn) {
    return function (v, ctl, out, api) {
      try {
        return fn(v, ctl, out, api);
      } catch (e) {
        var m = (e && e.message) ? e.message : 'No he podido calcular con estos datos.';
        return '<div class="mx-bad">' + S.esc(m) + '</div>';
      }
    };
  }

  /* Cadena de transformaciones equivalentes: filas [rótulo, tex, clase] */
  function cadena(filas) {
    var h = '<div class="eq-cadena">';
    filas.forEach(function (f) {
      if (!f) return;
      h += '<div class="eq-fila ' + (f[2] || '') + '">' +
        '<span class="eq-rot">' + S.esc(f[0]) + '</span>' +
        '<span class="eq-mat">' + K(f[1]) + '</span></div>';
    });
    return h + '</div>';
  }

  /* Números seguros: nunca imprimen NaN ni cosas raras */
  function num(x, d) {
    return Number.isFinite(x) ? S.kf(x, d === undefined ? 3 : d) : '\\text{no definido}';
  }
  function ntxt(x, d) {
    return Number.isFinite(x) ? S.nc(x, d === undefined ? 3 : d) : 'no definido';
  }

  /* Raíces devueltas por solPolinomica: valor y escritura exacta */
  function vr(r) { return r.raiz ? r.raiz.val() : r.irr.val(); }
  function tr(r) { return r.raiz ? r.raiz.tex(true) : r.irr.tex(); }

  /* Recta real con puntos marcados (dominio, soluciones y descartes) */
  function rectaPuntos(pts, titulo, cap) {
    var xs = pts.map(function (p) { return p.x; }).filter(function (x) { return Number.isFinite(x); });
    if (!xs.length) xs = [0];
    var mn = Math.min.apply(null, xs), mx = Math.max.apply(null, xs);
    if (mx - mn < 2) { var c = (mn + mx) / 2; mn = c - 3; mx = c + 3; }
    var pad = (mx - mn) * 0.25 + 1;
    mn = Math.floor(mn - pad); mx = Math.ceil(mx + pad);
    var paso = Math.max(1, Math.round((mx - mn) / 10));
    return S.rectaReal({
      min: mn, max: mx, W: 1000, H: 250, paso: paso, dec: 0,
      puntos: pts.filter(function (p) { return Number.isFinite(p.x); }),
      titulo: titulo, cap: cap, label: titulo || 'Recta real'
    });
  }

  /* Rango vertical razonable para un grupo de funciones */
  function rangoY(fs, xmin, xmax) {
    var lo = 0, hi = 0, hay = false;
    for (var i = 0; i <= 160; i++) {
      var x = xmin + (xmax - xmin) * i / 160;
      for (var j = 0; j < fs.length; j++) {
        var y;
        try { y = fs[j](x); } catch (e) { y = NaN; }
        if (Number.isFinite(y) && Math.abs(y) < 1e5) {
          if (!hay) { lo = y; hi = y; hay = true; }
          if (y < lo) lo = y;
          if (y > hi) hi = y;
        }
      }
    }
    if (!hay) { lo = -5; hi = 5; }
    if (hi - lo < 2) hi = lo + 2;
    var m = (hi - lo) * 0.15 + 0.5;
    lo = Math.floor(lo - m); hi = Math.ceil(hi + m);
    if (hi - lo > 60) hi = lo + 60;
    return { ymin: lo, ymax: hi };
  }

  /* Ventana horizontal a partir de unos puntos de interés */
  function rangoX(vals, ancho) {
    var xs = (vals || []).filter(function (x) { return Number.isFinite(x); });
    if (!xs.length) return { xmin: -6, xmax: 6 };
    var mn = Math.min.apply(null, xs), mx = Math.max.apply(null, xs);
    var a = ancho === undefined ? 4 : ancho;
    mn = Math.floor(mn - a); mx = Math.ceil(mx + a);
    if (mx - mn < 6) { mx = mn + 6; }
    if (mx - mn > 40) { mx = mn + 40; }
    return { xmin: mn, xmax: mx };
  }

  /* ¿valor = base^k con k entero (positivo o negativo)? */
  function potExacta(valor, base) {
    if (!(valor > 0) || !(base > 0) || base === 1) return null;
    for (var k = -14; k <= 14; k++) {
      if (Math.abs(Math.pow(base, k) - valor) < 1e-9 * Math.max(1, Math.abs(valor))) return k;
    }
    return null;
  }

  /* Resuelve en coma flotante  P(x) = t  para grado 1 o 2 */
  function resuelveFloat(p, t) {
    var g = S.pGrado(p);
    var c = function (i) { return p[i] ? p[i].val() : 0; };
    if (g === 1) return { tipo: 'lineal', xs: [(t - c(0)) / c(1)] };
    if (g === 2) {
      var a = c(2), b = c(1), cc = c(0) - t;
      var d = b * b - 4 * a * cc;
      if (d < 0) return { tipo: 'cuadratica', xs: [], disc: d };
      if (Math.abs(d) < 1e-12) return { tipo: 'cuadratica', xs: [-b / (2 * a)], disc: 0 };
      var r1 = (-b - Math.sqrt(d)) / (2 * a), r2 = (-b + Math.sqrt(d)) / (2 * a);
      return { tipo: 'cuadratica', xs: [r1, r2], disc: d };
    }
    if (g === 0 || g === -Infinity) return { tipo: 'constante', xs: [] };
    return { tipo: 'superior', xs: [] };
  }

  /* Logaritmo en cualquier base, ajustando el redondeo */
  function logb(x, b) { return S.casi(Math.log(x) / Math.log(b)); }

  /* Texto de una fracción algebraica */
  function fracTex(n, d) { return '\\dfrac{' + T(n) + '}{' + T(d) + '}'; }

  /* ==================================================================
     1 · Tema 3.4 · laboratorio de ecuación racional
     ================================================================== */
  R.racionalLab = function (node) {
    S.shell(node, 'Ecuación racional: dominio y soluciones extrañas',
      'Escribe los cuatro polinomios de la ecuación ' +
      '<code>N₁/D₁ = N₂/D₂</code> con <code>^</code> para los exponentes y sin espacios: ' +
      '<code>x^2</code>, <code>x-3</code>, <code>2x+1</code>, <code>x^2-4</code>. ' +
      'Admite productos como <code>3x(x-1)</code> y coeficientes fraccionarios como <code>x/2+1</code>. ' +
      'Si un miembro no es una fracción, escribe <code>1</code> en su denominador.',
      [
        { id: 'n1', label: 'Numerador izquierdo N₁', type: 'text', value: 'x^2', ancho: '12rem' },
        { id: 'd1', label: 'Denominador izquierdo D₁', type: 'text', value: 'x-3', ancho: '12rem' },
        { id: 'n2', label: 'Numerador derecho N₂', type: 'text', value: '9', ancho: '12rem' },
        { id: 'd2', label: 'Denominador derecho D₂', type: 'text', value: 'x-3', ancho: '12rem' },
        chips([
          { txt: 'x²/(x−3) = 9/(x−3)', tip: 'aparece una solución extraña', set: { n1: 'x^2', d1: 'x-3', n2: '9', d2: 'x-3' } },
          { txt: 'x/(x−1) = 2/(x+1)', tip: 'sin solución real', set: { n1: 'x', d1: 'x-1', n2: '2', d2: 'x+1' } },
          { txt: '1/(x−2) = 1/(x²−4)', tip: 'dos valores prohibidos', set: { n1: '1', d1: 'x-2', n2: '1', d2: 'x^2-4' } },
          { txt: '(x+1)/(x−1) = 2', tip: 'un miembro sin denominador', set: { n1: 'x+1', d1: 'x-1', n2: '2', d2: '1' } },
          { txt: '6/x = x−1', tip: 'lleva a una cuadrática', set: { n1: '6', d1: 'x', n2: 'x-1', d2: '1' } },
          { txt: '(x²−1)/(x−1) = 2', tip: 'el numerador se factoriza', set: { n1: 'x^2-1', d1: 'x-1', n2: '2', d2: '1' } },
          { txt: '1/(x−2) = 1/(x−2)', tip: 'identidad en todo el dominio', set: { n1: '1', d1: 'x-2', n2: '1', d2: 'x-2' } }
        ])
      ],
      safe(function (v) {
        var n1 = S.parsePol(v.n1, 'x', 'el numerador izquierdo');
        var d1 = S.parsePol(v.d1, 'x', 'el denominador izquierdo');
        var n2 = S.parsePol(v.n2, 'x', 'el numerador derecho');
        var d2 = S.parsePol(v.d2, 'x', 'el denominador derecho');
        if (S.pEsCero(d1) || S.pEsCero(d2)) throw Error('Ningún denominador puede ser 0. Si un miembro no es fracción, escribe 1 en su denominador.');

        var Rr = S.solRacional(n1, d1, n2, d2);
        var h = S.expr('Ecuación de partida', fracTex(n1, d1) + ' = ' + fracTex(n2, d2));

        /* dominio */
        var prohib = Rr.prohibidos.slice().sort(function (a, b) { return a.val() - b.val(); });
        var domTex = prohib.length
          ? '\\mathbb{R} \\setminus \\{' + prohib.map(function (p) { return p.tex(true); }).join(',\\; ') + '\\}'
          : '\\mathbb{R}';
        h += S.expr('Dominio de la ecuación', 'D = ' + domTex);
        if (prohib.length) {
          h += '<p class="ap-note">Los valores ' +
            prohib.map(function (p) { return K(p.tex(true)); }).join(', ') +
            ' anulan algún denominador: quedan prohibidos antes de empezar a calcular.</p>';
        } else {
          h += '<p class="ap-note">Ningún número real anula los denominadores: aquí no puede haber soluciones extrañas.</p>';
        }

        /* transformación */
        var filas = [
          ['Ecuación de partida', T(n1) + ' \\cdot \\left(' + T(d2) + '\\right) = ' + T(n2) + ' \\cdot \\left(' + T(d1) + '\\right)', 'eq-clave'],
          ['Productos cruzados, ya sin fracciones', T(S.pMult(n1, d2)) + ' = ' + T(S.pMult(n2, d1))],
          ['Todo al primer miembro', T(Rr.cruzada) + ' = 0']
        ];
        h += cadena(filas);

        if (S.pEsCero(Rr.cruzada)) {
          h += '<p class="ap-ok">La ecuación polinómica que queda es ' + K('0 = 0') +
            ': se cumple para cualquier número. La ecuación es una <b>identidad</b> y su solución es todo el dominio ' +
            K('D = ' + domTex) + '. Los valores prohibidos siguen estando fuera.</p>';
          h += rectaPuntos(prohib.map(function (p) {
            return { x: p.val(), tex: p.tex(true), col: COL.rojo, hueco: true };
          }), 'Dominio: los puntos huecos están excluidos',
            'Todo punto de la recta salvo los huecos es solución.');
          return h;
        }

        /* candidatos y comprobación del dominio */
        var filasT = [];
        Rr.todas.forEach(function (r) {
          var x = vr(r);
          var e1 = S.pEvalNum(d1, x), e2 = S.pEvalNum(d2, x);
          var mal = Math.abs(e1) < 1e-9 || Math.abs(e2) < 1e-9;
          filasT.push({
            celdas: [
              K('x = ' + tr(r)) + (r.mult > 1 ? ' ' + S.badge('multiplicidad ' + r.mult, 'info') : ''),
              K('D_1 = ' + num(e1, 3)),
              K('D_2 = ' + num(e2, 3)),
              mal ? S.badge('solución extraña: fuera del dominio', 'no')
                : S.badge('válida: está en el dominio', 'si')
            ],
            clase: mal ? '' : 'ap-ok-row'
          });
        });
        if (!filasT.length) {
          h += '<p class="ap-warn">La ecuación polinómica ' + K(T(Rr.cruzada) + ' = 0') +
            ' no tiene ninguna raíz real, así que la ecuación racional tampoco tiene solución.</p>';
        } else {
          h += '<h5>Comprobación obligatoria: ¿cada candidato está en el dominio?</h5>';
          h += S.tabla(['Candidato', 'Valor de ' + K('D_1'), 'Valor de ' + K('D_2'), 'Veredicto'], filasT);
        }

        /* resultado */
        var solTex = Rr.validas.length
          ? Rr.validas.map(function (r) { return tr(r); }).join(',\\; ')
          : null;
        h += S.resultado(K(solTex ? '\\{' + solTex + '\\}' : '\\varnothing'),
          Rr.validas.length === 1 ? 'conjunto solución (una solución)'
            : (Rr.validas.length ? 'conjunto solución (' + Rr.validas.length + ' soluciones)' : 'conjunto solución vacío'));
        if (Rr.descartadas.length) {
          h += '<p class="ap-warn">Se ha descartado ' +
            Rr.descartadas.map(function (r) { return K('x = ' + tr(r)); }).join(', ') +
            ': al multiplicar en cruz apareció como raíz del polinomio, pero anula un denominador de la ecuación original. ' +
            'Es una <b>solución extraña</b>, no una solución.</p>';
        }

        var pts = [];
        prohib.forEach(function (p) { pts.push({ x: p.val(), tex: p.tex(true), col: COL.rojo, hueco: true, arriba: false }); });
        Rr.validas.forEach(function (r) { pts.push({ x: vr(r), tex: tr(r), col: COL.verde }); });
        Rr.descartadas.forEach(function (r) { pts.push({ x: vr(r), tex: tr(r), col: COL.rojo }); });
        h += rectaPuntos(pts, 'Dominio, soluciones y soluciones extrañas',
          'En verde, las soluciones válidas. En rojo, los valores prohibidos (huecos, debajo del eje) y las soluciones extrañas.');
        return h;
      }));
  };

  /* ==================================================================
     2 · Tema 3.4 · resolución por m.c.m. de los denominadores
     ================================================================== */
  R.racionalMcm = function (node) {
    S.shell(node, 'Ecuación racional por el m.c.m. de los denominadores',
      'La ecuación tiene la forma <code>N₁/D₁ + N₂/D₂ = N₃/D₃</code>. Escribe los seis polinomios sin espacios: ' +
      '<code>6</code>, <code>x</code>, <code>x+1</code>, <code>x-2</code>. ' +
      'Si un término no es una fracción, pon <code>1</code> como denominador; si sobra un término, escribe <code>0</code> en su numerador.',
      [
        { id: 'n1', label: 'N₁', type: 'text', value: '6', ancho: '8rem' },
        { id: 'd1', label: 'D₁', type: 'text', value: 'x', ancho: '8rem' },
        { id: 'n2', label: 'N₂', type: 'text', value: 'x+1', ancho: '8rem' },
        { id: 'd2', label: 'D₂', type: 'text', value: 'x-2', ancho: '8rem' },
        { id: 'n3', label: 'N₃', type: 'text', value: '6', ancho: '8rem' },
        { id: 'd3', label: 'D₃', type: 'text', value: '1', ancho: '8rem' },
        chips([
          { txt: '6/x + (x+1)/(x−2) = 6', tip: 'el m.c.m. es el producto', set: { n1: '6', d1: 'x', n2: 'x+1', d2: 'x-2', n3: '6', d3: '1' } },
          { txt: '1/x + 1/(x+1) = 1/2', tip: 'trabajos conjuntos', set: { n1: '1', d1: 'x', n2: '1', d2: 'x+1', n3: '1', d3: '2' } },
          { txt: '1/(x−1) + 1/(x+1) = 2/(x²−1)', tip: 'm.c.m. con factores repetidos', set: { n1: '1', d1: 'x-1', n2: '1', d2: 'x+1', n3: '2', d3: 'x^2-1' } },
          { txt: 'x/(x−2) − 4/(x²−4) = 1', tip: 'aparece una solución extraña', set: { n1: 'x', d1: 'x-2', n2: '-4', d2: 'x^2-4', n3: '1', d3: '1' } },
          { txt: '3/(x+2) + 0 = 1/(x−1)', tip: 'dos fracciones simples', set: { n1: '3', d1: 'x+2', n2: '0', d2: '1', n3: '1', d3: 'x-1' } },
          { txt: '1/x + 1/(x−3) = 0', tip: 'segundo miembro nulo', set: { n1: '1', d1: 'x', n2: '1', d2: 'x-3', n3: '0', d3: '1' } }
        ])
      ],
      safe(function (v) {
        var n1 = S.parsePol(v.n1, 'x', 'N₁'), d1 = S.parsePol(v.d1, 'x', 'D₁');
        var n2 = S.parsePol(v.n2, 'x', 'N₂'), d2 = S.parsePol(v.d2, 'x', 'D₂');
        var n3 = S.parsePol(v.n3, 'x', 'N₃'), d3 = S.parsePol(v.d3, 'x', 'D₃');
        [d1, d2, d3].forEach(function (d) {
          if (S.pEsCero(d)) throw Error('Ningún denominador puede ser 0. Escribe 1 si ese término no es una fracción.');
        });

        var M = S.mcmPol(S.mcmPol(d1, d2), d3);
        var f1 = S.pDiv(M, d1).q, f2 = S.pDiv(M, d2).q, f3 = S.pDiv(M, d3).q;
        var izq = S.pSuma(S.pMult(n1, f1), S.pMult(n2, f2));
        var der = S.pMult(n3, f3);
        var P = S.pResta(izq, der);

        var h = S.expr('Ecuación de partida',
          fracTex(n1, d1) + ' + ' + fracTex(n2, d2) + ' = ' + fracTex(n3, d3));

        /* dominio */
        var prohib = [];
        [d1, d2, d3].forEach(function (d) {
          if (S.pGrado(d) <= 0) return;
          S.raicesDe(d).forEach(function (r) {
            if (!prohib.some(function (q) { return q.cmp(r) === 0; })) prohib.push(r);
          });
        });
        prohib.sort(function (a, b) { return a.val() - b.val(); });
        var domTex = prohib.length
          ? '\\mathbb{R} \\setminus \\{' + prohib.map(function (p) { return p.tex(true); }).join(',\\; ') + '\\}'
          : '\\mathbb{R}';

        h += cadena([
          ['Denominadores factorizados',
            [d1, d2, d3].map(function (d) { return S.factorizaTexPol(S.factorizaPol(d), 'x'); }).join(', \\quad ')],
          ['m.c.m. de los denominadores', 'm = ' + T(M) + ' = ' + S.factorizaTexPol(S.factorizaPol(M), 'x'), 'eq-clave'],
          ['Dominio', 'D = ' + domTex],
          ['Multiplico los dos miembros por el m.c.m.',
            T(n1) + '\\cdot' + S.pTexPar(f1) + ' + ' + T(n2) + '\\cdot' + S.pTexPar(f2) + ' = ' + T(n3) + '\\cdot' + S.pTexPar(f3)],
          ['Desarrollo', T(izq) + ' = ' + T(der)],
          ['Ecuación polinómica equivalente', T(P) + ' = 0', 'eq-clave']
        ]);

        if (S.pEsCero(P)) {
          h += '<p class="ap-ok">Queda ' + K('0 = 0') + ': la igualdad se cumple en todo el dominio ' +
            K(domTex) + '. Es una identidad.</p>';
          return h;
        }
        if (S.pGrado(P) === 0) {
          h += '<p class="ap-warn">Queda ' + K(T(P) + ' = 0') +
            ', que es falso: la ecuación no tiene ninguna solución.</p>';
          return h;
        }

        var Sol = S.solPolinomica(P);
        var filas = [];
        var validas = [], descart = [];
        Sol.raices.forEach(function (r) {
          var x = vr(r);
          var mal = prohib.some(function (q) { return Math.abs(q.val() - x) < 1e-9; });
          var e1 = S.pEvalNum(d1, x), e2 = S.pEvalNum(d2, x), e3 = S.pEvalNum(d3, x);
          var lhs = (Math.abs(e1) < 1e-12 || Math.abs(e2) < 1e-12) ? NaN
            : S.pEvalNum(n1, x) / e1 + S.pEvalNum(n2, x) / e2;
          var rhs = Math.abs(e3) < 1e-12 ? NaN : S.pEvalNum(n3, x) / e3;
          (mal ? descart : validas).push(r);
          filas.push({
            celdas: [
              K('x = ' + tr(r)),
              K(mal ? '\\text{anula un denominador}' : num(lhs, 4)),
              K(mal ? '\\text{—}' : num(rhs, 4)),
              mal ? S.badge('descartada: no está en el dominio', 'no') : S.badge('solución válida', 'si')
            ],
            clase: mal ? '' : 'ap-ok-row'
          });
        });

        h += '<h5>Comprobación en la ecuación original</h5>';
        h += filas.length
          ? S.tabla(['Candidato', 'Primer miembro', 'Segundo miembro', 'Veredicto'], filas)
          : '<p class="ap-warn">La ecuación polinómica no tiene raíces reales: la ecuación racional no tiene solución.</p>';

        h += S.resultado(K(validas.length
          ? '\\{' + validas.map(function (r) { return tr(r); }).join(',\\; ') + '\\}'
          : '\\varnothing'), 'conjunto solución');
        if (descart.length) {
          h += '<p class="ap-warn">Al multiplicar por el m.c.m. se ha colado ' +
            descart.map(function (r) { return K('x = ' + tr(r)); }).join(', ') +
            '. Multiplicar por una expresión que puede valer cero no es una transformación equivalente: ' +
            'por eso hay que comprobar siempre en la ecuación de partida.</p>';
        }
        return h;
      }));
  };

  /* ==================================================================
     3 · Tema 3.5 · por qué elevar al cuadrado inventa soluciones
     ================================================================== */
  R.elevarCuadrado = function (node) {
    S.shell(node, 'Elevar al cuadrado no es una transformación equivalente',
      'Escribe el radicando <code>A(x)</code> y el otro miembro <code>B(x)</code> de la ecuación ' +
      K('\\sqrt{A(x)} = B(x)') + '. Sin espacios y con <code>^</code> para los exponentes: ' +
      '<code>x+7</code>, <code>2x+3</code>, <code>x^2-1</code>. ' +
      'La primera gráfica compara ' + K('\\sqrt{A}') + ' con ' + K('B') +
      '; la segunda compara ' + K('A') + ' con ' + K('B^2') + '.',
      [
        { id: 'a', label: 'Radicando A(x)', type: 'text', value: 'x+7', ancho: '12rem' },
        { id: 'b', label: 'Otro miembro B(x)', type: 'text', value: 'x+1', ancho: '12rem' },
        { id: 'ver', label: 'Ver las dos gráficas', type: 'check', value: true },
        chips([
          { txt: '√(x+7) = x+1', tip: 'una válida y una falsa', set: { a: 'x+7', b: 'x+1' } },
          { txt: '√(2x+3) = x', tip: 'una válida y una falsa', set: { a: '2x+3', b: 'x' } },
          { txt: '√(x−1) = −2', tip: 'ninguna: el otro miembro es negativo', set: { a: 'x-1', b: '-2' } },
          { txt: '√(2x−3) = x−1', tip: 'solución doble', set: { a: '2x-3', b: 'x-1' } },
          { txt: '√(x+5) = x−1', tip: 'una de las dos raíces es falsa', set: { a: 'x+5', b: 'x-1' } },
          { txt: '√(4−x) = x−4', tip: 'caso frontera', set: { a: '4-x', b: 'x-4' } },
          { txt: '√(x²+3) = x+1', tip: 'radicando siempre positivo', set: { a: 'x^2+3', b: 'x+1' } }
        ])
      ],
      safe(function (v) {
        var A = S.parsePol(v.a, 'x', 'el radicando'), B = S.parsePol(v.b, 'x', 'el segundo miembro');
        var Rd = S.solRadical(A, B);
        var h = S.expr('Ecuación radical', '\\sqrt{' + T(A) + '} = ' + T(B));
        h += cadena([
          ['Elevo los dos miembros al cuadrado', T(A) + ' = ' + S.pTexPar(B) + '^{2}'],
          ['Ecuación polinómica obtenida', T(Rd.elevada) + ' = 0', 'eq-clave']
        ]);

        var vals = Rd.comprob.map(function (c) { return c.v; });
        var filas = Rd.comprob.map(function (c) {
          return {
            celdas: [
              K('x = ' + tr(c.r)),
              K(num(c.radicando, 3)),
              K(c.radicando >= 0 ? '\\sqrt{' + num(c.radicando, 3) + '} = ' + num(Math.sqrt(Math.max(c.radicando, 0)), 3) : '\\text{no existe}'),
              K(num(c.miembro, 3)),
              c.ok ? S.badge('solución de verdad', 'si') : S.badge('solución falsa', 'no')
            ],
            clase: c.ok ? 'ap-ok-row' : ''
          };
        });
        if (filas.length) {
          h += '<h5>Las raíces de la ecuación elevada, una por una</h5>';
          h += S.tabla(['Candidato', 'A(x)', '√A(x)', 'B(x)', '¿Cumple la ecuación original?'], filas);
        } else {
          h += '<p class="ap-warn">La ecuación elevada al cuadrado no tiene raíces reales, así que la radical tampoco.</p>';
        }

        h += '<div class="eq-check">' +
          '<div class="eq-check-caja eq-ok"><b>Soluciones verdaderas</b><br>' +
          (Rd.validas.length ? Rd.validas.map(function (c) { return K('x = ' + tr(c.r)); }).join(', ') : 'ninguna') +
          '</div>' +
          '<div class="eq-check-caja eq-ko"><b>Soluciones falsas creadas al elevar</b><br>' +
          (Rd.falsas.length ? Rd.falsas.map(function (c) { return K('x = ' + tr(c.r)); }).join(', ') : 'ninguna') +
          '</div></div>';
        h += '<p class="ap-note">Elevar al cuadrado convierte ' + K('\\sqrt{A} = B') + ' en ' + K('A = B^2') +
          ', pero ' + K('A = B^2') + ' también recoge el caso ' + K('\\sqrt{A} = -B') +
          ': por eso pueden aparecer soluciones que no valen. La raíz cuadrada solo devuelve valores no negativos, ' +
          'así que además de ' + K('A \\geq 0') + ' hace falta ' + K('B \\geq 0') + '.</p>';

        if (v.ver) {
          var rx = rangoX(vals.concat([0]), 5);
          var fRaiz = function (x) { var a = S.pEvalNum(A, x); return a >= 0 ? Math.sqrt(a) : NaN; };
          var fB = function (x) { return S.pEvalNum(B, x); };
          var r1 = rangoY([fRaiz, fB], rx.xmin, rx.xmax);
          h += S.ejes({
            xmin: rx.xmin, xmax: rx.xmax, ymin: r1.ymin, ymax: r1.ymax, W: 1000, H: 520,
            curvas: [
              { f: fRaiz, col: COL.azul, label: '\\sqrt{A(x)}', lx: 660, ly: 70 },
              { f: fB, col: COL.verde, label: 'B(x)', lx: 660, ly: 120 }
            ],
            puntos: Rd.validas.map(function (c) {
              return { x: c.v, y: c.miembro, col: COL.verde, tex: 'x = ' + num(c.v, 2) };
            }),
            label: 'Gráfica de la raíz y del segundo miembro',
            cap: 'Ecuación original: las soluciones son los puntos donde la curva azul ' + K('\\sqrt{A(x)}') +
              ' corta a la verde ' + K('B(x)') + '. Donde ' + K('A(x) < 0') + ' la curva azul no existe.'
          });
          var fA = function (x) { return S.pEvalNum(A, x); };
          var fB2 = function (x) { var t = S.pEvalNum(B, x); return t * t; };
          var r2 = rangoY([fA, fB2], rx.xmin, rx.xmax);
          h += S.ejes({
            xmin: rx.xmin, xmax: rx.xmax, ymin: r2.ymin, ymax: r2.ymax, W: 1000, H: 520,
            curvas: [
              { f: fA, col: COL.azul, label: 'A(x)', lx: 660, ly: 70 },
              { f: fB2, col: COL.naranja, label: 'B(x)^2', lx: 660, ly: 120 }
            ],
            puntos: Rd.comprob.map(function (c) {
              return { x: c.v, y: S.pEvalNum(A, c.v), col: c.ok ? COL.verde : COL.rojo, tex: 'x = ' + num(c.v, 2) };
            }),
            label: 'Gráfica del radicando y del cuadrado del segundo miembro',
            cap: 'Ecuación elevada: los cortes de ' + K('A(x)') + ' con ' + K('B(x)^2') +
              ' son más numerosos. Los puntos rojos son cortes de esta segunda gráfica que no lo son de la primera: soluciones falsas.'
          });
        }
        return h;
      }));
  };

  /* ==================================================================
     4 · Tema 3.5 · resolutor de √A = B con comprobación
     ================================================================== */
  R.radicalCheck = function (node) {
    S.shell(node, 'Resolutor de ecuaciones radicales con comprobación',
      'Escribe el radicando y el otro miembro de ' + K('\\sqrt{A(x)} = B(x)') +
      ' sin espacios: <code>x^2-x+1</code>, <code>2x+1</code>, <code>-2</code>. ' +
      'El applet aísla la raíz, eleva al cuadrado, resuelve la ecuación polinómica y comprueba uno a uno todos los candidatos.',
      [
        { id: 'a', label: 'Radicando A(x)', type: 'text', value: 'x^2-x+1', ancho: '13rem' },
        { id: 'b', label: 'Otro miembro B(x)', type: 'text', value: '2x+1', ancho: '13rem' },
        chips([
          { txt: '√(x²−x+1) = 2x+1', tip: 'una válida, una falsa', set: { a: 'x^2-x+1', b: '2x+1' } },
          { txt: '√(2x−3) = x−1', tip: 'solución doble', set: { a: '2x-3', b: 'x-1' } },
          { txt: '√(x+7) = x+1', tip: 'la clásica con solución falsa', set: { a: 'x+7', b: 'x+1' } },
          { txt: '√(2x+3) = x', tip: 'x = 3', set: { a: '2x+3', b: 'x' } },
          { txt: '√(x−1) = −2', tip: 'imposible: la raíz no es negativa', set: { a: 'x-1', b: '-2' } },
          { txt: '√(3x+1) = 4', tip: 'inmediata', set: { a: '3x+1', b: '4' } },
          { txt: '√(x²+9) = x+1', tip: 'grado 2 que se cancela', set: { a: 'x^2+9', b: 'x+1' } }
        ])
      ],
      safe(function (v) {
        var A = S.parsePol(v.a, 'x', 'el radicando'), B = S.parsePol(v.b, 'x', 'el segundo miembro');
        var Rd = S.solRadical(A, B);
        var h = S.expr('Ecuación', '\\sqrt{' + T(A) + '} = ' + T(B));

        h += S.paso(1, 'La raíz cuadrada ya está aislada en el primer miembro. ' +
          'Condiciones de existencia: el radicando no puede ser negativo y, como una raíz cuadrada nunca es negativa, ' +
          'el segundo miembro tampoco: ' + K(T(A) + ' \\geq 0') + ' y ' + K(T(B) + ' \\geq 0') + '.', 'ap-paso-clave');
        h += S.paso(2, 'Elevo al cuadrado los dos miembros: ' +
          K(T(A) + ' = ' + S.pTexPar(B) + '^{2}') + ', es decir ' + K(T(Rd.elevada) + ' = 0') + '.');
        var g = S.pGrado(Rd.elevada);
        h += S.paso(3, 'Resuelvo esa ecuación polinómica de grado ' +
          (g === -Infinity ? '0 (es una identidad)' : g) + '.');

        if (S.pEsCero(Rd.elevada)) {
          h += '<p class="ap-note">Al elevar queda ' + K('0 = 0') +
            ': la igualdad se cumple siempre que existan las dos expresiones. ' +
            'La solución es el conjunto de los ' + K('x') + ' con ' + K(T(A) + ' \\geq 0') + ' y ' + K(T(B) + ' \\geq 0') + '.</p>';
          return h;
        }

        var filas = Rd.comprob.map(function (c) {
          var razon = c.radicando < -1e-9 ? 'el radicando sale negativo'
            : (c.miembro < -1e-9 ? 'el segundo miembro sale negativo' : 'los dos lados coinciden');
          return {
            celdas: [
              K('x = ' + tr(c.r)),
              K(num(c.radicando, 3)),
              K(c.radicando >= 0 ? num(Math.sqrt(Math.max(c.radicando, 0)), 3) : '\\text{no existe}'),
              K(num(c.miembro, 3)),
              (c.ok ? S.badge('válida', 'si') : S.badge('falsa', 'no')) + ' <span class="ap-key">' + S.esc(razon) + '</span>'
            ],
            clase: c.ok ? 'ap-ok-row' : ''
          };
        });
        if (filas.length) {
          h += '<h5>Paso 4: comprobación de cada candidato en la ecuación original</h5>';
          h += S.tabla(['Candidato', 'A(x)', '√A(x)', 'B(x)', 'Veredicto'], filas);
        }

        h += S.resultado(K(Rd.validas.length
          ? '\\{' + Rd.validas.map(function (c) { return tr(c.r); }).join(',\\; ') + '\\}'
          : '\\varnothing'), 'conjunto solución');
        if (Rd.falsas.length) {
          h += '<p class="ap-warn">' + (Rd.falsas.length === 1 ? 'Hay una solución falsa: ' : 'Hay soluciones falsas: ') +
            Rd.falsas.map(function (c) { return K('x = ' + tr(c.r)); }).join(', ') +
            '. No es un error de cálculo: es consecuencia de elevar al cuadrado, que no conserva la equivalencia.</p>';
        }
        h += rectaPuntos(
          Rd.validas.map(function (c) { return { x: c.v, tex: tr(c.r), col: COL.verde }; })
            .concat(Rd.falsas.map(function (c) { return { x: c.v, tex: tr(c.r), col: COL.rojo, arriba: false }; })),
          'Candidatos sobre la recta real',
          'En verde las soluciones válidas; en rojo, debajo del eje, las falsas.');
        return h;
      }));
  };

  /* ==================================================================
     5 · Tema 3.5 · dos radicales: hay que elevar dos veces
     ================================================================== */
  R.radicalDoble = function (node) {
    S.shell(node, 'Ecuación con dos radicales',
      'Resuelve ' + K('\\sqrt{ax+b} + \\sqrt{cx+d} = k') +
      ' con coeficientes enteros. Escribe cada número en su casilla, con signo si es negativo: ' +
      '<code>2</code>, <code>-3</code>, <code>1</code>, <code>7</code>, <code>4</code>. ' +
      'El applet aísla un radical, eleva al cuadrado, vuelve a aislar el radical que sobrevive, eleva otra vez y comprueba.',
      [
        { id: 'a', label: 'a', type: 'number', value: 2, step: 1, ancho: '7rem' },
        { id: 'b', label: 'b', type: 'number', value: -3, step: 1, ancho: '7rem' },
        { id: 'c', label: 'c', type: 'number', value: 1, step: 1, ancho: '7rem' },
        { id: 'd', label: 'd', type: 'number', value: 7, step: 1, ancho: '7rem' },
        { id: 'k', label: 'k (segundo miembro)', type: 'number', value: 4, step: 1, ancho: '9rem' },
        chips([
          { txt: '√(2x−3)+√(x+7) = 4', tip: 'x = 2 válida, x = 114 falsa', set: { a: 2, b: -3, c: 1, d: 7, k: 4 } },
          { txt: '√(x+4)+√(x−1) = 5', tip: 'una solución', set: { a: 1, b: 4, c: 1, d: -1, k: 5 } },
          { txt: '√(x)+√(x+9) = 9', tip: 'raíces sencillas', set: { a: 1, b: 0, c: 1, d: 9, k: 9 } },
          { txt: '√(x−1)+√(x+4) = 1', tip: 'sin solución: k es demasiado pequeño', set: { a: 1, b: -1, c: 1, d: 4, k: 1 } },
          { txt: '√(2x+1)+√(x) = 0', tip: 'k = 0: los dos radicandos deben anularse', set: { a: 2, b: 1, c: 1, d: 0, k: 0 } },
          { txt: '√(3x+1)+√(x+1) = −2', tip: 'imposible: la suma de dos raíces no es negativa', set: { a: 3, b: 1, c: 1, d: 1, k: -2 } }
        ])
      ],
      safe(function (v) {
        var a = S.entero(v.a, -50, 50, 'El coeficiente a');
        var b = S.entero(v.b, -200, 200, 'El coeficiente b');
        var c = S.entero(v.c, -50, 50, 'El coeficiente c');
        var d = S.entero(v.d, -200, 200, 'El coeficiente d');
        var k = S.entero(v.k, -100, 100, 'El número k');
        if (a === 0 && c === 0) throw Error('Con a = 0 y c = 0 no queda ninguna incógnita bajo las raíces. Cambia a o c.');

        var P = S.pDe([b, a]), Q = S.pDe([d, c]);
        var eqTex = '\\sqrt{' + T(P) + '} + \\sqrt{' + T(Q) + '} = ' + k;
        var h = S.expr('Ecuación de partida', eqTex);

        function comprobar(x) {
          var p = S.pEvalNum(P, x), q = S.pEvalNum(Q, x);
          var ok = p >= -1e-9 && q >= -1e-9 &&
            Math.abs(Math.sqrt(Math.max(p, 0)) + Math.sqrt(Math.max(q, 0)) - k) < 1e-6;
          return { x: x, p: p, q: q, ok: ok };
        }
        function tablaComp(lista) {
          return S.tabla(['Candidato', T(P), T(Q), 'Suma de las raíces', 'Veredicto'],
            lista.map(function (t) {
              var suma = (t.p >= 0 && t.q >= 0) ? Math.sqrt(t.p) + Math.sqrt(t.q) : NaN;
              return {
                celdas: [
                  K('x = ' + num(t.x, 4)),
                  K(num(t.p, 3)),
                  K(num(t.q, 3)),
                  K(Number.isFinite(suma) ? num(suma, 3) : '\\text{algún radicando es negativo}'),
                  t.ok ? S.badge('válida', 'si') : S.badge('falsa', 'no')
                ],
                clase: t.ok ? 'ap-ok-row' : ''
              };
            }));
        }

        if (k < 0) {
          h += '<p class="ap-warn">Una raíz cuadrada nunca es negativa, así que la suma de dos raíces tampoco puede valer ' +
            K(String(k)) + '. La ecuación no tiene solución y no hace falta ningún cálculo.</p>';
          return h;
        }
        if (k === 0) {
          h += S.paso(1, 'Con ' + K('k = 0') + ' la suma de dos cantidades no negativas es cero solo si las dos son cero. ' +
            'Hay que resolver a la vez ' + K(T(P) + ' = 0') + ' y ' + K(T(Q) + ' = 0') + '.', 'ap-paso-clave');
          var s1 = a !== 0 ? -b / a : null, s2 = c !== 0 ? -d / c : null;
          var cand = [];
          if (s1 !== null) cand.push(s1);
          if (s2 !== null) cand.push(s2);
          var buenos = cand.map(comprobar).filter(function (t) { return t.ok; });
          h += tablaComp(cand.map(comprobar));
          h += S.resultado(K(buenos.length
            ? '\\{' + buenos.map(function (t) { return num(t.x, 4); }).join(',\\; ') + '\\}'
            : '\\varnothing'), 'conjunto solución');
          return h;
        }

        /* k > 0: aislar, elevar, aislar, elevar */
        var Rp = S.pSuma(S.pDe([k * k]), S.pResta(Q, P));   /* k² + Q − P */
        var Rmed = S.pEscala(Rp, new F(1, 2 * k));          /* (k² + Q − P) / (2k) */
        h += cadena([
          ['Aíslo un radical', '\\sqrt{' + T(P) + '} = ' + k + ' - \\sqrt{' + T(Q) + '}'],
          ['Elevo al cuadrado los dos miembros',
            T(P) + ' = ' + (k * k) + ' - 2\\cdot' + k + '\\sqrt{' + T(Q) + '} + ' + S.pTexPar(Q)],
          ['Aíslo el radical que ha sobrevivido',
            (2 * k) + '\\sqrt{' + T(Q) + '} = ' + T(Rp), 'eq-clave'],
          ['Divido entre ' + (2 * k), '\\sqrt{' + T(Q) + '} = ' + T(Rmed)]
        ]);

        var Rd = S.solRadical(Q, Rmed);
        h += cadena([
          ['Elevo al cuadrado por segunda vez', T(Q) + ' = ' + S.pTexPar(Rmed) + '^{2}'],
          ['Ecuación polinómica final', T(Rd.elevada) + ' = 0', 'eq-clave']
        ]);

        var candidatos = Rd.todas.map(function (r) { return vr(r); });
        if (!candidatos.length) {
          h += '<p class="ap-warn">La ecuación polinómica final no tiene raíces reales, así que la ecuación con dos radicales no tiene solución.</p>';
          return h;
        }
        var comp = candidatos.map(comprobar);
        h += '<h5>Comprobación en la ecuación original (imprescindible: se ha elevado dos veces)</h5>';
        h += tablaComp(comp);
        var val = comp.filter(function (t) { return t.ok; });
        h += S.resultado(K(val.length
          ? '\\{' + val.map(function (t) { return num(t.x, 4); }).join(',\\; ') + '\\}'
          : '\\varnothing'), 'conjunto solución');
        if (comp.length > val.length) {
          h += '<p class="ap-warn">Cada elevación al cuadrado puede añadir soluciones falsas, y aquí se ha elevado dos veces: ' +
            'nada garantiza que las raíces del polinomio final cumplan la ecuación de partida.</p>';
        }
        h += rectaPuntos(comp.map(function (t) {
          return { x: t.x, tex: num(t.x, 3), col: t.ok ? COL.verde : COL.rojo, arriba: t.ok };
        }), 'Candidatos y veredicto', 'En verde las soluciones válidas; en rojo, las falsas.');
        return h;
      }));
  };

  /* ==================================================================
     6 · Tema 3.6 · principio del producto nulo
     ================================================================== */
  R.productoNulo = function (node) {
    S.shell(node, 'Principio del producto nulo, factor a factor',
      'Escribe una ecuación polinómica ya factorizada o sin factorizar; el applet la descompone en factores y ' +
      'resuelve cada uno por separado. Sin espacios, con <code>^</code> para los exponentes: ' +
      '<code>x(x-2)(2x+3)</code>, <code>x^3-4x^2+5x-2</code>, <code>(x-1)^2(x^2+1)</code>. ' +
      'Con el deslizador eliges qué factor quieres abrir con todo detalle.',
      [
        { id: 'p', label: 'Primer miembro P(x) (la ecuación es P(x) = 0)', type: 'text', value: 'x(x-2)(2x+3)', ancho: '20rem' },
        { id: 'k', label: 'Factor que quieres abrir', type: 'range', min: 1, max: 6, step: 1, value: 1 },
        chips([
          { txt: 'x(x−2)(2x+3) = 0', tip: 'tres factores lineales', set: { p: 'x(x-2)(2x+3)', k: 1 } },
          { txt: '(x−1)²(x+3) = 0', tip: 'raíz doble', set: { p: '(x-1)^2(x+3)', k: 1 } },
          { txt: 'x³−4x²+5x−2 = 0', tip: 'hay que factorizar antes', set: { p: 'x^3-4x^2+5x-2', k: 1 } },
          { txt: '(x²+1)(x−2) = 0', tip: 'un factor sin raíces reales', set: { p: '(x^2+1)(x-2)', k: 1 } },
          { txt: '3x³−12x = 0', tip: 'factor común y suma por diferencia', set: { p: '3x^3-12x', k: 1 } },
          { txt: 'x⁴−5x²+4 = 0', tip: 'cuatro factores lineales', set: { p: 'x^4-5x^2+4', k: 1 } },
          { txt: 'x²−3 = 0', tip: 'factores irracionales', set: { p: 'x^2-3', k: 1 } }
        ])
      ],
      safe(function (v) {
        var p = S.parsePol(v.p, 'x', 'el primer miembro');
        if (S.pEsCero(p)) throw Error('El primer miembro es el polinomio nulo: la ecuación 0 = 0 se cumple siempre.');
        if (S.pGrado(p) === 0) throw Error('El primer miembro es una constante distinta de cero: la ecuación no tiene solución.');
        var kSel = Math.max(1, Math.round(S.real(v.k, 1, 12, 'El número de factor')));

        var Fz = S.factorizaPol(p);
        var h = S.expr('Ecuación', T(p) + ' = 0');
        h += S.expr('Primer miembro factorizado', S.factorizaTexPol(Fz, 'x') + ' = 0');

        /* lista de factores con su resolución */
        var fac = [];
        if (Fz.xk) {
          fac.push({
            tex: Fz.xk === 1 ? 'x' : 'x^{' + Fz.xk + '}',
            eq: (Fz.xk === 1 ? 'x' : 'x^{' + Fz.xk + '}') + ' = 0',
            sol: ['x = 0'], nota: Fz.xk > 1 ? 'raíz de multiplicidad ' + Fz.xk : 'una raíz',
            grado: Fz.xk
          });
        }
        Fz.lineales.forEach(function (L) {
          var t = S.factorLinTex(L.raiz, 'x');
          fac.push({
            tex: L.mult === 1 ? t : t + '^{' + L.mult + '}',
            eq: t + ' = 0',
            sol: ['x = ' + L.raiz.tex(true)],
            nota: L.mult === 1 ? 'una raíz' : 'raíz de multiplicidad ' + L.mult,
            grado: L.mult
          });
        });
        Fz.cuads.forEach(function (C) {
          var t = '\\left(' + T(C.poly) + '\\right)';
          var info = { tex: C.mult === 1 ? t : t + '^{' + C.mult + '}', eq: T(C.poly) + ' = 0', grado: 2 * C.mult };
          if (S.pGrado(C.poly) === 2) {
            var Q = S.solCuadratica(C.poly[2], C.poly[1], C.poly[0]);
            if (Q.tipo === 'ninguna') {
              info.sol = [];
              info.nota = 'discriminante ' + S.nc(Q.disc, 0) + ' < 0: ningún número real anula este factor';
            } else {
              info.sol = Q.raices.map(function (r) { return 'x = ' + r.tex(); });
              info.nota = Q.tipo === 'doble' ? 'una raíz doble' : 'dos raíces (discriminante ' + S.nc(Q.disc, 0) + ')';
            }
          } else {
            info.sol = [];
            info.nota = 'factor de grado ' + S.pGrado(C.poly) + ' sin raíces racionales';
          }
          fac.push(info);
        });

        h += '<div class="ap-grid3">';
        fac.forEach(function (f, i) {
          var abierto = (i + 1) === kSel;
          h += '<div class="ap-card' + (abierto ? ' ap-card-ok' : '') + '">' +
            '<div class="ap-card-tit">Factor ' + (i + 1) + (abierto ? ' · abierto' : '') + '</div>' +
            KD(f.tex) +
            '<p>' + K(f.eq) + '</p>' +
            '<p>' + (f.sol.length ? f.sol.map(function (s) { return K(s); }).join(' , ') : '<i>sin raíz real</i>') + '</p>' +
            '<p class="ap-key">' + S.esc(f.nota) + '</p></div>';
        });
        h += '</div>';

        if (kSel > fac.length) {
          h += '<p class="ap-note">Este polinomio solo tiene ' + fac.length +
            (fac.length === 1 ? ' factor' : ' factores') + ': baja el deslizador para abrir uno que exista.</p>';
        } else {
          var f = fac[kSel - 1];
          h += cadena([
            ['Producto nulo', 'A \\cdot B = 0 \\iff A = 0 \\;\\text{ o }\\; B = 0', 'eq-clave'],
            ['Igualo a cero el factor ' + kSel, f.eq],
            ['Raíces que aporta este factor', f.sol.length ? f.sol.join(', \\quad ') : '\\varnothing',
              f.sol.length ? 'eq-bien' : 'eq-mal']
          ]);
        }

        var Sol = S.solPolinomica(p);
        h += S.resultado(K(Sol.raices.length
          ? '\\{' + Sol.raices.map(function (r) { return tr(r); }).join(',\\; ') + '\\}'
          : '\\varnothing'), 'conjunto solución de la ecuación completa');
        var sumaMult = Sol.raices.reduce(function (s, r) { return s + r.mult; }, 0);
        h += '<p class="ap-note">Grado ' + S.pGrado(p) + ' y ' + sumaMult +
          ' raíces reales contando multiplicidades. El grado es el número máximo de soluciones: ' +
          'cada factor cuadrático sin raíces reales «se lleva» dos unidades de grado sin aportar ninguna solución.</p>';
        return h;
      }));
  };

  /* ==================================================================
     7 · Tema 3.6 · Ruffini interactivo y teorema del resto
     ================================================================== */
  R.ruffiniLab = function (node) {
    S.shell(node, 'Ruffini paso a paso y teorema del resto',
      'Escribe el polinomio y el valor por el que quieres dividir. El polinomio, sin espacios: ' +
      '<code>x^3-4x^2+5x-2</code>, <code>2x^4-x^2+3</code>. El valor admite enteros y fracciones: ' +
      '<code>2</code>, <code>-1</code>, <code>1/2</code>, <code>-3/2</code>.',
      [
        { id: 'p', label: 'Polinomio P(x)', type: 'text', value: 'x^3-4x^2+5x-2', ancho: '18rem' },
        { id: 'r', label: 'Divido entre (x − r), con r =', type: 'text', value: '1', ancho: '9rem' },
        { id: 'seguir', label: 'Buscar la multiplicidad repitiendo la división', type: 'check', value: true },
        chips([
          { txt: 'x³−4x²+5x−2, r = 1', tip: 'raíz doble', set: { p: 'x^3-4x^2+5x-2', r: '1' } },
          { txt: 'x³−4x²+5x−2, r = 3', tip: 'resto distinto de cero', set: { p: 'x^3-4x^2+5x-2', r: '3' } },
          { txt: 'x³−2x²−x+2, r = −1', tip: 'raíz simple', set: { p: 'x^3-2x^2-x+2', r: '-1' } },
          { txt: '2x³−3x²−3x+2, r = 1/2', tip: 'raíz fraccionaria', set: { p: '2x^3-3x^2-3x+2', r: '1/2' } },
          { txt: 'x⁴−1, r = 1', tip: 'faltan términos: ojo a los ceros', set: { p: 'x^4-1', r: '1' } },
          { txt: 'x³+1, r = −1', tip: 'suma de cubos', set: { p: 'x^3+1', r: '-1' } },
          { txt: 'x³−3x+1, r = 1', tip: 'ninguna raíz racional', set: { p: 'x^3-3x+1', r: '1' } }
        ])
      ],
      safe(function (v) {
        var p = S.parsePol(v.p, 'x', 'el polinomio');
        if (S.pGrado(p) < 1) throw Error('Escribe un polinomio de grado 1 o mayor para poder aplicar Ruffini.');
        var r = S.fraccionTxt(v.r, 'El valor de r');

        var h = S.expr('Polinomio', 'P(x) = ' + T(p));
        h += '<p class="ap-note">Coeficientes ordenados de mayor a menor grado, incluidos los ceros de los términos que faltan: ' +
          K('[' + (function () {
            var L = [];
            for (var i = p.length - 1; i >= 0; i--) L.push(p[i].tex(true));
            return L.join(',\\; ');
          })() + ']') + '</p>';

        var Rf = S.ruffini(p, r);
        h += S.ruffiniHTML(p, r);
        var Ev = S.pEval(p, r);
        h += cadena([
          ['Resto de la división', 'R = ' + Rf.resto.tex(true), Rf.resto.n === 0n ? 'eq-bien' : 'eq-mal'],
          ['Teorema del resto', 'P\\left(' + r.tex(true) + '\\right) = ' + Ev.valor.tex(true), 'eq-clave'],
          ['Cociente obtenido', 'C(x) = ' + T(Rf.cociente)]
        ]);
        h += '<p class="ap-note">El resto de dividir entre ' + K('x - ' + r.tex(true)) + ' y el valor numérico ' +
          K('P\\left(' + r.tex(true) + '\\right)') + ' son el mismo número: eso es el teorema del resto, ' +
          'y por eso Ruffini sirve para evaluar y para buscar raíces a la vez.</p>';

        if (Rf.resto.n === 0n) {
          h += '<p class="ap-ok">' + S.badge('resto 0', 'si') + ' Luego ' + K('x = ' + r.tex(true)) +
            ' es una raíz de ' + K('P(x)') + ' y ' + K('\\left(x - ' + r.tex(true) + '\\right)') +
            ' es un factor (teorema del factor):</p>';
          h += S.expr('Factorización parcial',
            'P(x) = \\left(x - ' + r.tex(true) + '\\right)\\left(' + T(Rf.cociente) + '\\right)');

          if (v.seguir) {
            var q = Rf.cociente, mult = 1, extra = '';
            while (S.pGrado(q) >= 1) {
              var rf2 = S.ruffini(q, r);
              if (rf2.resto.n !== 0n) break;
              mult++;
              extra += S.ruffiniHTML(q, r, { cap: 'División número ' + mult + ' por el mismo valor: el resto vuelve a ser 0.' });
              q = rf2.cociente;
              if (mult > 6) break;
            }
            if (mult > 1) {
              h += '<h5>La misma raíz, otra vez</h5>' + extra;
              h += S.expr('Multiplicidad de la raíz',
                'P(x) = \\left(x - ' + r.tex(true) + '\\right)^{' + mult + '}\\left(' + T(q) + '\\right)');
              h += '<p class="ap-note">La raíz ' + K('x = ' + r.tex(true)) + ' tiene multiplicidad ' + mult +
                ': el factor aparece repetido ' + mult + ' veces.</p>';
            } else {
              h += '<p class="ap-note">Al repetir la división con el mismo valor el resto ya no es 0: la raíz es simple (multiplicidad 1).</p>';
            }
          }
        } else {
          h += '<p class="ap-warn">' + S.badge('resto ≠ 0', 'no') + ' Como ' +
            K('P\\left(' + r.tex(true) + '\\right) = ' + Ev.valor.tex(true) + ' \\neq 0') + ', el valor ' +
            K('x = ' + r.tex(true)) + ' no es raíz y ' + K('\\left(x - ' + r.tex(true) + '\\right)') +
            ' no divide a ' + K('P(x)') + '. Prueba otro candidato.</p>';
          h += S.expr('Identidad de la división',
            'P(x) = \\left(x - ' + r.tex(true) + '\\right)\\left(' + T(Rf.cociente) + '\\right) + ' + Rf.resto.tex(true));
        }

        var cand = S.candidatosRaiz(p);
        h += '<p class="ap-note">Candidatos racionales de este polinomio (divisores del término independiente entre divisores del principal): ' +
          cand.slice(0, 18).map(function (c) { return K(c.tex(true)); }).join(', ') +
          (cand.length > 18 ? ' y ' + (cand.length - 18) + ' más' : '') + '.</p>';
        return h;
      }));
  };

  /* ==================================================================
     8 · Tema 3.6 · buscador de raíces racionales
     ================================================================== */
  R.raicesCandidatas = function (node) {
    S.shell(node, 'Buscador de raíces racionales por divisores',
      'Escribe el polinomio sin espacios: <code>x^3-4x^2+x+6</code>, <code>2x^3-x^2-8x+4</code>, ' +
      '<code>6x^2-5x+1</code>. El applet enteriza los coeficientes si hacen falta, lista todos los candidatos ' +
      K('\\pm\\dfrac{p}{q}') + ' y evalúa el polinomio en cada uno.',
      [
        { id: 'p', label: 'Polinomio P(x)', type: 'text', value: 'x^3-4x^2+x+6', ancho: '18rem' },
        { id: 'todos', label: 'Ver también los candidatos que fallan', type: 'check', value: true },
        chips([
          { txt: 'x³−4x²+x+6', tip: 'tres raíces enteras', set: { p: 'x^3-4x^2+x+6' } },
          { txt: '2x³−x²−8x+4', tip: 'una raíz fraccionaria', set: { p: '2x^3-x^2-8x+4' } },
          { txt: '6x²−5x+1', tip: 'candidatos con denominador', set: { p: '6x^2-5x+1' } },
          { txt: 'x³−3x+1', tip: 'ningún candidato funciona', set: { p: 'x^3-3x+1' } },
          { txt: 'x⁴−5x²+4', tip: 'cuatro raíces enteras', set: { p: 'x^4-5x^2+4' } },
          { txt: 'x³−x²/2−x+1/2', tip: 'coeficientes fraccionarios', set: { p: 'x^3-x^2/2-x+1/2' } },
          { txt: 'x³−6x²+11x−6', tip: 'divisores de 6', set: { p: 'x^3-6x^2+11x-6' } }
        ])
      ],
      safe(function (v) {
        var p = S.parsePol(v.p, 'x', 'el polinomio');
        if (S.pGrado(p) < 1) throw Error('Escribe un polinomio de grado 1 o mayor.');
        var E = S.pEntero(p);
        var h = S.expr('Polinomio', 'P(x) = ' + T(p));
        var filas = [];
        if (E.factor.val() !== 1 || E.contenido !== 1) {
          h += cadena([
            ['Multiplico por el m.c.m. de los denominadores', T(S.pEscala(p, E.factor)) + ' = 0'],
            ['Divido entre el factor común ' + S.nc(E.contenido, 0),
              T(S.pEscala(S.pEscala(p, E.factor), new F(1, E.contenido))) + ' = 0', 'eq-clave']
          ]);
          h += '<p class="ap-note">La regla de los divisores necesita coeficientes enteros. Multiplicar o dividir toda la ecuación ' +
            'por un número distinto de cero no cambia sus soluciones.</p>';
        }
        var Ent = S.pEscala(S.pEscala(p, E.factor), new F(1, E.contenido));
        var a0 = Ent[0], an = S.pLider(Ent);
        h += S.kvs([
          'término independiente ' + K(a0.tex(true)),
          'coeficiente principal ' + K(an.tex(true)),
          'divisores de ' + K(S.nc(Math.abs(Number(a0.n)), 0)) + ': ' +
          (a0.n === 0n ? 'el 0 admite cualquiera' : S.divisores(Number(a0.n)).join(', ')),
          'divisores de ' + K(S.nc(Math.abs(Number(an.n)), 0)) + ': ' + S.divisores(Number(an.n)).join(', ')
        ]);
        h += '<p class="ap-note">Si ' + K('\\dfrac{p}{q}') + ' es una raíz racional en forma irreducible, entonces ' +
          K('p') + ' divide al término independiente y ' + K('q') + ' divide al coeficiente principal. ' +
          'Solo hay que probar esa lista: cualquier otro número racional queda descartado sin calcular.</p>';

        var cand = S.candidatosRaiz(p);
        var raices = [];
        cand.forEach(function (c) {
          var val = S.pEval(p, c).valor;
          var ok = val.n === 0n;
          if (ok) raices.push(c);
          if (ok || v.todos) {
            filas.push({
              celdas: [
                K(c.tex(true)),
                K('P\\left(' + c.tex(true) + '\\right) = ' + val.tex(true)),
                ok ? S.badge('es raíz', 'si') : S.badge('no es raíz', 'no')
              ],
              clase: ok ? 'ap-ok-row' : ''
            });
          }
        });
        var lim = 30, recortada = filas.length > lim;
        h += '<h5>Candidatos y valor numérico</h5>';
        h += S.tabla(['Candidato', 'Valor numérico', '¿Resto 0?'], filas.slice(0, lim));
        if (recortada) h += '<p class="ap-note">Se muestran ' + lim + ' de los ' + filas.length +
          ' candidatos. Desmarca la casilla para ver solo los que sí son raíces.</p>';

        if (raices.length) {
          var Rr = S.raicesRacionales(p);
          h += S.expr('Raíces racionales encontradas',
            Rr.raices.map(function (x) {
              return 'x = ' + x.raiz.tex(true) + (x.mult > 1 ? '\\;(\\text{multiplicidad } ' + x.mult + ')' : '');
            }).join(', \\quad '));
          h += S.expr('Lo que queda tras dividir por todas ellas', T(Rr.resto));
          if (S.pGrado(Rr.resto) >= 1) {
            h += '<p class="ap-note">Ese factor ya no tiene raíces racionales: si es de grado 2 se termina con la fórmula ' +
              'de segundo grado, y si es de grado mayor puede que no haya raíces elementales.</p>';
          }
        } else {
          h += '<p class="ap-warn">Ningún candidato da resto 0: este polinomio no tiene raíces racionales. ' +
            'Puede tener raíces irracionales (por ejemplo, resolviendo un factor de segundo grado) o ninguna raíz real.</p>';
        }
        return h;
      }));
  };

  /* ==================================================================
     9 · Tema 3.6 · factorización completa paso a paso
     ================================================================== */
  R.factorizaTotal = function (node) {
    S.shell(node, 'Factorización completa y resolución de la ecuación',
      'Escribe el polinomio de la ecuación ' + K('P(x) = 0') + ' sin espacios: ' +
      '<code>x^4-x^3-7x^2+13x-6</code>, <code>2x^3-3x^2-3x+2</code>, <code>x^5-x^3</code>. ' +
      'El applet saca factor común, aplica Ruffini todas las veces que puede, resuelve el factor cuadrático ' +
      'que quede y comprueba la identidad multiplicando de nuevo.',
      [
        { id: 'p', label: 'Polinomio P(x)', type: 'text', value: 'x^4-x^3-7x^2+13x-6', ancho: '20rem' },
        { id: 'modo', label: 'Escritura de los factores', type: 'select', value: 'normal',
          options: [{ value: 'normal', label: 'mónica: (x − p/q)' }, { value: 'entera', label: 'entera: (qx − p)' }] },
        chips([
          { txt: 'x⁴−x³−7x²+13x−6', tip: 'raíz doble y factor cuadrático', set: { p: 'x^4-x^3-7x^2+13x-6' } },
          { txt: '2x³−3x²−3x+2', tip: 'raíz fraccionaria', set: { p: '2x^3-3x^2-3x+2' } },
          { txt: 'x⁵−x³', tip: 'factor común x³', set: { p: 'x^5-x^3' } },
          { txt: 'x⁴−16', tip: 'suma por diferencia dos veces', set: { p: 'x^4-16' } },
          { txt: 'x³+2x²+x', tip: 'factor común y cuadrado perfecto', set: { p: 'x^3+2x^2+x' } },
          { txt: 'x⁴+x²−2', tip: 'un factor irreducible', set: { p: 'x^4+x^2-2' } },
          { txt: 'x³−3x', tip: 'raíces irracionales', set: { p: 'x^3-3x' } },
          { txt: 'x³−3x+1', tip: 'sin raíces racionales', set: { p: 'x^3-3x+1' } }
        ])
      ],
      safe(function (v) {
        var p = S.parsePol(v.p, 'x', 'el polinomio');
        if (S.pEsCero(p)) throw Error('El polinomio nulo no se factoriza: la ecuación 0 = 0 la cumple cualquier número.');
        if (S.pGrado(p) < 1) throw Error('Escribe un polinomio de grado 1 o mayor.');
        var modo = v.modo === 'entera' ? 'entera' : undefined;

        var Fz = S.factorizaPol(p);
        var Sol = S.solPolinomica(p);
        var h = S.expr('Ecuación', T(p) + ' = 0');

        var filas = [];
        var E = S.pEntero(p);
        if (E.factor.val() !== 1) {
          filas.push(['Coeficientes a enteros (multiplico por ' + S.nc(E.factor.val(), 0) + ')',
            T(S.pEscala(p, E.factor)) + ' = 0']);
        }
        if (Fz.xk) {
          filas.push(['Factor común ' + (Fz.xk === 1 ? 'x' : 'x^' + Fz.xk),
            (Fz.xk === 1 ? 'x' : 'x^{' + Fz.xk + '}') + '\\left(' + T(S.pDiv(p, S.pMono(new F(1), Fz.xk)).q) + '\\right) = 0', 'eq-clave']);
        }
        if (Fz.lineales.length) {
          filas.push(['Raíces racionales por Ruffini',
            Fz.lineales.map(function (L) {
              return 'x = ' + L.raiz.tex(true) + (L.mult > 1 ? '\\,(\\times ' + L.mult + ')' : '');
            }).join(', \\quad ')]);
        } else {
          filas.push(['Raíces racionales por Ruffini', '\\text{ninguna}', 'eq-mal']);
        }
        Fz.cuads.forEach(function (C) {
          if (S.pGrado(C.poly) !== 2) {
            filas.push(['Factor que no se deja factorizar', T(C.poly), 'eq-mal']);
            return;
          }
          var Q = S.solCuadratica(C.poly[2], C.poly[1], C.poly[0]);
          if (Q.tipo === 'ninguna') {
            filas.push(['Factor cuadrático irreducible: ' +
              'discriminante ' + S.nc(Q.disc, 0) + ' < 0',
              T(C.poly) + ' \\neq 0 \\;\\;\\forall x \\in \\mathbb{R}', 'eq-mal']);
          } else {
            filas.push(['Resuelvo el factor cuadrático que queda',
              Q.raices.map(function (r) { return 'x = ' + r.tex(); }).join(', \\quad '), 'eq-bien']);
          }
        });
        filas.push(['Factorización completa', S.factorizaTexPol(Fz, 'x', modo), 'eq-clave']);
        h += cadena(filas);

        var rehecho = S.factorRehacer(Fz);
        var vale = S.pIgual(rehecho, p);
        h += '<p class="' + (vale ? 'ap-ok' : 'ap-warn') + '">' +
          S.badge(vale ? 'identidad comprobada' : 'revisa los datos', vale ? 'si' : 'no') +
          ' Al multiplicar de nuevo los factores se recupera ' + K(T(rehecho)) + '.</p>';

        if (Sol.raices.length) {
          h += S.tabla(['Raíz', 'Multiplicidad', 'Tipo'],
            Sol.raices.map(function (r) {
              return [K('x = ' + tr(r)), String(r.mult),
                r.tipo === 'racional' ? 'racional' : 'irracional (de un factor de segundo grado)'];
            }));
        }
        h += S.resultado(K(Sol.raices.length
          ? '\\{' + Sol.raices.map(function (r) { return tr(r); }).join(',\\; ') + '\\}'
          : '\\varnothing'), 'conjunto solución de ' + 'P(x) = 0');
        var suma = Sol.raices.reduce(function (s, r) { return s + r.mult; }, 0);
        h += '<p class="ap-note">Grado ' + S.pGrado(p) + ', y ' + suma +
          ' raíces reales contando multiplicidades. Un polinomio de grado ' + S.pGrado(p) +
          ' no puede tener más de ' + S.pGrado(p) + ' raíces.</p>';
        h += rectaPuntos(Sol.raices.map(function (r) {
          return { x: vr(r), tex: tr(r), col: COL.verde };
        }), 'Las soluciones sobre la recta real',
          'Cada punto verde es una raíz del polinomio, es decir, un corte de la gráfica con el eje horizontal.');
        return h;
      }));
  };

  /* ==================================================================
     10 · Tema 3.7 · propiedades del logaritmo
     ================================================================== */
  R.logPropiedades = function (node) {
    S.shell(node, 'Verificador de las propiedades del logaritmo',
      'Elige una base y dos números positivos y comprueba, con valores concretos, cada propiedad de los logaritmos. ' +
      'Los decimales se escriben con coma o con punto: <code>2</code>, <code>0,5</code>, <code>10</code>. ' +
      'El exponente ' + K('p') + ' puede ser negativo o fraccionario.',
      [
        { id: 'b', label: 'Base a', type: 'text', value: '2', ancho: '8rem' },
        { id: 'x', label: 'Número x > 0', type: 'text', value: '8', ancho: '8rem' },
        { id: 'y', label: 'Número y > 0', type: 'text', value: '32', ancho: '8rem' },
        { id: 'p', label: 'Exponente p', type: 'text', value: '3', ancho: '8rem' },
        { id: 'dec', label: 'Cifras decimales', type: 'range', min: 0, max: 6, step: 1, value: 4 },
        chips([
          { txt: 'base 2 · x = 8 · y = 32', tip: 'todo sale entero', set: { b: '2', x: '8', y: '32', p: '3' } },
          { txt: 'base 10 · x = 1000', tip: 'logaritmos decimales', set: { b: '10', x: '1000', y: '100', p: '2' } },
          { txt: 'base e · x = 7,389', tip: 'logaritmos neperianos', set: { b: '2,718281828', x: '7,389056', y: '2,718282', p: '2' } },
          { txt: 'base 3 · x = 81 · y = 9', tip: 'cociente exacto', set: { b: '3', x: '81', y: '9', p: '-2' } },
          { txt: 'base 0,5 · x = 8', tip: 'base menor que 1: logaritmos negativos', set: { b: '0,5', x: '8', y: '2', p: '3' } },
          { txt: 'base 2 · x = 5 · y = 7', tip: 'valores no exactos', set: { b: '2', x: '5', y: '7', p: '0,5' } }
        ])
      ],
      safe(function (v) {
        var b = S.real(v.b, undefined, undefined, 'La base');
        var x = S.real(v.x, undefined, undefined, 'El número x');
        var y = S.real(v.y, undefined, undefined, 'El número y');
        var p = S.real(v.p, undefined, undefined, 'El exponente p');
        var d = Math.round(S.real(v.dec, 0, 6, 'Las cifras decimales'));
        if (!(b > 0) || Math.abs(b - 1) < 1e-12) throw Error('La base de un logaritmo debe ser positiva y distinta de 1.');
        if (!(x > 0) || !(y > 0)) throw Error('Solo existe el logaritmo de números positivos: x e y deben ser mayores que 0.');

        var L = function (t) { return logb(t, b); };
        var bt = S.kf(b, 6);
        var h = S.expr('Definición de logaritmo',
          '\\log_{' + bt + '} N = c \\iff ' + bt + '^{\\,c} = N');
        h += S.kvs([
          K('\\log_{' + bt + '} ' + S.kf(x, 6) + ' = ' + num(L(x), d)),
          K('\\log_{' + bt + '} ' + S.kf(y, 6) + ' = ' + num(L(y), d)),
          K(bt + '^{' + num(L(x), d) + '} \\approx ' + num(Math.pow(b, L(x)), d))
        ]);

        var props = [
          ['Producto', '\\log_{' + bt + '}(x\\,y)', L(x * y), '\\log_{' + bt + '} x + \\log_{' + bt + '} y', L(x) + L(y)],
          ['Cociente', '\\log_{' + bt + '}\\dfrac{x}{y}', L(x / y), '\\log_{' + bt + '} x - \\log_{' + bt + '} y', L(x) - L(y)],
          ['Potencia', '\\log_{' + bt + '} x^{' + S.kf(p, 4) + '}', L(Math.pow(x, p)), S.kf(p, 4) + '\\log_{' + bt + '} x', p * L(x)],
          ['Base', '\\log_{' + bt + '} ' + bt, L(b), '1', 1],
          ['Unidad', '\\log_{' + bt + '} 1', L(1), '0', 0],
          ['Inversa', bt + '^{\\log_{' + bt + '} x}', Math.pow(b, L(x)), 'x', x],
          ['Cambio de base (neperianos)', '\\log_{' + bt + '} x', L(x), '\\dfrac{\\ln x}{\\ln ' + bt + '}', Math.log(x) / Math.log(b)],
          ['Cambio de base (decimales)', '\\log_{' + bt + '} x', L(x), '\\dfrac{\\log x}{\\log ' + bt + '}', Math.log10(x) / Math.log10(b)],
          ['Recíproco', '\\log_{' + bt + '} x', L(x), '\\dfrac{1}{\\log_{x} ' + bt + '}',
            Math.abs(x - 1) < 1e-12 ? Infinity : 1 / (Math.log(b) / Math.log(x))]
        ];
        var filas = props.map(function (pr) {
          var ok = Number.isFinite(pr[2]) && Number.isFinite(pr[4]) && Math.abs(pr[2] - pr[4]) < 1e-7;
          return {
            celdas: [pr[0], K(pr[1] + ' = ' + num(pr[2], d)), K(pr[3] + ' = ' + num(pr[4], d)),
              ok ? S.badge('coinciden', 'si') : S.badge('caso especial', 'avi')],
            clase: ok ? 'ap-ok-row' : ''
          };
        });
        h += S.tabla(['Propiedad', 'Primer miembro', 'Segundo miembro', '¿Se cumple?'], filas);

        h += '<div class="eq-check">' +
          '<div class="eq-check-caja"><b>Logaritmo decimal</b><br>' + K('\\log ' + S.kf(x, 6) + ' = ' + num(Math.log10(x), d)) +
          '<br><span class="ap-key">base 10, se escribe sin indicar la base</span></div>' +
          '<div class="eq-check-caja"><b>Logaritmo neperiano</b><br>' + K('\\ln ' + S.kf(x, 6) + ' = ' + num(Math.log(x), d)) +
          '<br><span class="ap-key">base ' + K('e \\approx 2{,}718281828') + '</span></div>' +
          '<div class="eq-check-caja"><b>Cambio de base</b><br>' +
          K('\\log_{' + bt + '} ' + S.kf(x, 6) + ' = \\dfrac{\\ln ' + S.kf(x, 6) + '}{\\ln ' + bt + '} = ' + num(L(x), d)) +
          '<br><span class="ap-key">así se calcula cualquier base con la calculadora</span></div></div>';
        h += '<p class="ap-note">Fíjate en lo que <b>no</b> hay en la tabla: no existe ninguna propiedad para ' +
          K('\\log_a (x + y)') + '. El logaritmo de una suma no se puede descomponer, y confundirlo con ' +
          K('\\log_a x + \\log_a y') + ' es el error más frecuente del tema.</p>';
        return h;
      }));
  };

  /* ==================================================================
     11 · Tema 3.7 · resolutor de ecuaciones logarítmicas
     ================================================================== */
  R.logResolutor = function (node) {
    S.shell(node, 'Ecuación logarítmica: dominio y soluciones descartadas',
      'Dos modos. En <b>definición</b> resuelve ' + K('\\log_a A(x) = c') + '; en <b>igualdad</b> resuelve ' +
      K('\\log_a A(x) = \\log_a B(x)') + '. Escribe los argumentos sin espacios: <code>x-3</code>, ' +
      '<code>x(x-3)</code>, <code>x^2-1</code>, <code>3x+3</code>. La base y el valor son enteros.',
      [
        { id: 'modo', label: 'Técnica', type: 'select', value: 'def',
          options: [{ value: 'def', label: 'definición: log_a A(x) = c' },
            { value: 'igual', label: 'igualar argumentos: log_a A(x) = log_a B(x)' }] },
        { id: 'b', label: 'Base a', type: 'number', value: 10, min: 2, max: 20, step: 1, ancho: '7rem' },
        { id: 'a1', label: 'Argumento A(x)', type: 'text', value: 'x-3', ancho: '13rem' },
        { id: 'c', label: 'Valor c (modo definición)', type: 'number', value: 2, min: -6, max: 8, step: 1, ancho: '9rem' },
        { id: 'a2', label: 'Argumento B(x) (modo igualdad)', type: 'text', value: '3x+3', ancho: '13rem' },
        chips([
          { txt: 'log(x−3) = 2', tip: 'definición, base 10', set: { modo: 'def', b: 10, a1: 'x-3', c: 2 } },
          { txt: 'log₂(x²−3x) = 2', tip: 'dos soluciones válidas', set: { modo: 'def', b: 2, a1: 'x^2-3x', c: 2 } },
          { txt: 'log x + log(x−3) = 1', tip: 'reducido a log(x(x−3)) = 1', set: { modo: 'def', b: 10, a1: 'x(x-3)', c: 1 } },
          { txt: 'log₃(x+2) = −1', tip: 'valor negativo del logaritmo', set: { modo: 'def', b: 3, a1: 'x+2', c: -1 } },
          { txt: 'log(x²−1) = log(3x+3)', tip: 'una solución se descarta', set: { modo: 'igual', b: 10, a1: 'x^2-1', a2: '3x+3' } },
          { txt: 'log₂(x²) = log₂(4x)', tip: 'x = 0 queda fuera del dominio', set: { modo: 'igual', b: 2, a1: 'x^2', a2: '4x' } },
          { txt: 'log₅(2x−1) = log₅(x+4)', tip: 'ecuación de primer grado', set: { modo: 'igual', b: 5, a1: '2x-1', a2: 'x+4' } }
        ])
      ],
      safe(function (v) {
        var b = S.entero(v.b, 2, 20, 'La base');
        var A = S.parsePol(v.a1, 'x', 'el argumento A(x)');
        var h = '';

        if (v.modo === 'igual') {
          var B = S.parsePol(v.a2, 'x', 'el argumento B(x)');
          var P = S.pResta(A, B);
          h += S.expr('Ecuación', '\\log_{' + b + '}\\left(' + T(A) + '\\right) = \\log_{' + b + '}\\left(' + T(B) + '\\right)');
          h += cadena([
            ['Dominio: los dos argumentos han de ser positivos', T(A) + ' > 0 \\;\\text{ y }\\; ' + T(B) + ' > 0', 'eq-clave'],
            ['La función logaritmo es inyectiva: igualo argumentos', T(A) + ' = ' + T(B)],
            ['Ecuación polinómica', T(P) + ' = 0']
          ]);
          if (S.pEsCero(P)) {
            h += '<p class="ap-ok">Los dos argumentos son el mismo polinomio: la igualdad se cumple en todo el dominio.</p>';
            return h;
          }
          if (S.pGrado(P) === 0) {
            h += '<p class="ap-warn">Queda ' + K(T(P) + ' = 0') + ', que es falso: no hay solución.</p>';
            return h;
          }
          var Sp = S.solPolinomica(P);
          var val = [], des = [];
          var filas = Sp.raices.map(function (r) {
            var x = vr(r);
            var av = S.pEvalNum(A, x), bv = S.pEvalNum(B, x);
            var ok = av > 1e-9 && bv > 1e-9;
            (ok ? val : des).push(r);
            return {
              celdas: [K('x = ' + tr(r)), K('A = ' + num(av, 3)), K('B = ' + num(bv, 3)),
                ok ? S.badge('válida', 'si') : S.badge('descartada: argumento no positivo', 'no')],
              clase: ok ? 'ap-ok-row' : ''
            };
          });
          h += '<h5>Comprobación obligatoria del dominio</h5>';
          h += filas.length ? S.tabla(['Candidato', 'Argumento A(x)', 'Argumento B(x)', 'Veredicto'], filas)
            : '<p class="ap-warn">La ecuación polinómica no tiene raíces reales.</p>';
          h += S.resultado(K(val.length ? '\\{' + val.map(function (r) { return tr(r); }).join(',\\; ') + '\\}' : '\\varnothing'),
            'conjunto solución');
          if (des.length) {
            h += '<p class="ap-warn">Se descarta ' + des.map(function (r) { return K('x = ' + tr(r)); }).join(', ') +
              ': cumple la ecuación polinómica, pero no existe el logaritmo de un número negativo ni de cero.</p>';
          }
          h += rectaPuntos(val.map(function (r) { return { x: vr(r), tex: tr(r), col: COL.verde }; })
            .concat(des.map(function (r) { return { x: vr(r), tex: tr(r), col: COL.rojo, arriba: false }; })),
            'Soluciones y descartes', 'En verde las válidas; en rojo las que se salen del dominio.');
          return h;
        }

        /* modo definición */
        var c = S.entero(v.c, -6, 8, 'El valor c');
        var Lg = S.solLogaritmica(b, A, c);
        var obj = Math.pow(b, c);
        h += S.expr('Ecuación', '\\log_{' + b + '}\\left(' + T(A) + '\\right) = ' + c);
        h += cadena([
          ['Dominio: el argumento ha de ser positivo', T(A) + ' > 0', 'eq-clave'],
          ['Aplico la definición de logaritmo', T(A) + ' = ' + b + '^{' + c + '}'],
          ['Calculo la potencia', T(A) + ' = ' + S.kf(obj, 6)],
          ['Ecuación polinómica', T(Lg.reducida) + ' = 0']
        ]);
        if (Math.abs(obj - Math.round(obj)) > 1e-9) {
          h += '<p class="ap-note">Con este valor de ' + K('c') + ' la potencia ' + K(b + '^{' + c + '}') +
            ' no es entera; el applet trabaja con su valor aproximado ' + K(S.kf(obj, 6)) +
            ', así que las soluciones son también aproximadas.</p>';
        }
        var filas2 = Lg.validas.concat(Lg.descartadas).map(function (cc) {
          var ok = cc.arg > 1e-9;
          return {
            celdas: [K('x = ' + tr(cc.r)), K(T(A) + ' = ' + num(cc.arg, 3)),
              ok ? S.badge('válida', 'si') : S.badge('descartada: el argumento no es positivo', 'no')],
            clase: ok ? 'ap-ok-row' : ''
          };
        });
        h += '<h5>Comprobación obligatoria del dominio</h5>';
        h += filas2.length ? S.tabla(['Candidato', 'Valor del argumento', 'Veredicto'], filas2)
          : '<p class="ap-warn">La ecuación polinómica no tiene raíces reales: no hay solución.</p>';
        h += S.resultado(K(Lg.validas.length
          ? '\\{' + Lg.validas.map(function (cc) { return tr(cc.r); }).join(',\\; ') + '\\}'
          : '\\varnothing'), 'conjunto solución');
        if (Lg.descartadas.length) {
          h += '<p class="ap-warn">Se descarta ' + Lg.descartadas.map(function (cc) { return K('x = ' + tr(cc.r)); }).join(', ') +
            ': ese valor hace que el argumento del logaritmo sea negativo o cero.</p>';
        }
        h += rectaPuntos(Lg.validas.map(function (cc) { return { x: cc.v, tex: tr(cc.r), col: COL.verde }; })
          .concat(Lg.descartadas.map(function (cc) { return { x: cc.v, tex: tr(cc.r), col: COL.rojo, arriba: false }; })),
          'Soluciones y descartes', 'En verde las válidas; en rojo las que salen del dominio del logaritmo.');
        return h;
      }));
  };

  /* ==================================================================
     12 · Tema 3.8 · exponencial: vía exacta y vía logarítmica
     ================================================================== */
  R.expoResolutor = function (node) {
    S.shell(node, 'Ecuación exponencial: potencias iguales o logaritmos',
      'Resuelve ' + K('a^{E(x)} = N') + '. Escribe el exponente como un polinomio sin espacios: ' +
      '<code>x+1</code>, <code>x^2-1</code>, <code>2x-3</code>. El segundo miembro admite enteros y fracciones: ' +
      '<code>32</code>, <code>1/27</code>, <code>10</code>, <code>0,5</code>.',
      [
        { id: 'b', label: 'Base a', type: 'text', value: '2', ancho: '7rem' },
        { id: 'e', label: 'Exponente E(x)', type: 'text', value: 'x+1', ancho: '13rem' },
        { id: 'n', label: 'Segundo miembro N', type: 'text', value: '32', ancho: '9rem' },
        chips([
          { txt: '2^(x+1) = 32', tip: 'potencia exacta', set: { b: '2', e: 'x+1', n: '32' } },
          { txt: '3^(x²−1) = 81', tip: 'lleva a una cuadrática', set: { b: '3', e: 'x^2-1', n: '81' } },
          { txt: '3^(1−x²) = 1/27', tip: 'exponente negativo', set: { b: '3', e: '1-x^2', n: '1/27' } },
          { txt: '5^(x²−5x+6) = 1', tip: 'todo número elevado a 0 vale 1', set: { b: '5', e: 'x^2-5x+6', n: '1' } },
          { txt: '2^x = 10', tip: 'no es potencia exacta: logaritmos', set: { b: '2', e: 'x', n: '10' } },
          { txt: '7^(2x−1) = 3', tip: 'vía logarítmica', set: { b: '7', e: '2x-1', n: '3' } },
          { txt: '2^x = −4', tip: 'imposible: la exponencial es positiva', set: { b: '2', e: 'x', n: '-4' } },
          { txt: '(0,5)^x = 8', tip: 'base menor que 1', set: { b: '0,5', e: 'x', n: '8' } }
        ])
      ],
      safe(function (v) {
        var b = S.valorSimbolico(v.b).v;
        var N = S.valorSimbolico(v.n).v;
        var Ex = S.parsePol(v.e, 'x', 'el exponente');
        if (!(b > 0) || Math.abs(b - 1) < 1e-12) throw Error('La base de una exponencial debe ser positiva y distinta de 1.');
        if (S.pGrado(Ex) < 1) throw Error('El exponente debe contener la incógnita: escribe algo como x+1 o x^2-1.');
        var bt = S.kf(b, 6);
        var h = S.expr('Ecuación', bt + '^{\\,' + T(Ex) + '} = ' + S.kf(N, 6));

        if (!(N > 0)) {
          h += '<p class="ap-warn">Una potencia de base positiva es siempre positiva: ' +
            K(bt + '^{\\,E(x)} > 0') + ' para cualquier ' + K('x') + '. Como el segundo miembro no es positivo, ' +
            'la ecuación <b>no tiene solución</b>, y no hace falta calcular nada.</p>';
          return h;
        }

        var k = potExacta(N, b);
        if (k !== null) {
          var D = S.pResta(Ex, S.pDe([k]));
          h += cadena([
            ['Escribo el segundo miembro como potencia de la base', S.kf(N, 6) + ' = ' + bt + '^{' + k + '}', 'eq-clave'],
            ['Dos potencias de la misma base son iguales si lo son sus exponentes',
              bt + '^{\\,' + T(Ex) + '} = ' + bt + '^{' + k + '} \\iff ' + T(Ex) + ' = ' + k],
            ['Ecuación ya sin exponenciales', T(D) + ' = 0']
          ]);
          if (S.pGrado(D) === 1) {
            var SL = S.solLineal(D[1], D[0]);
            h += S.expr('Resuelvo la ecuación de primer grado', SL.tex);
            h += S.resultado(K(SL.conj.tex()), 'conjunto solución (exacto)');
          } else {
            var SP = S.solPolinomica(D);
            h += S.expr('Resuelvo la ecuación polinómica',
              SP.raices.length ? SP.raices.map(function (r) { return 'x = ' + tr(r); }).join(', \\quad ') : '\\varnothing');
            h += S.resultado(K(SP.raices.length
              ? '\\{' + SP.raices.map(function (r) { return tr(r); }).join(',\\; ') + '\\}'
              : '\\varnothing'), 'conjunto solución (exacto)');
          }
          h += '<p class="ap-note">Esta es la vía preferible: no aparece ningún decimal y la solución es exacta. ' +
            'Solo funciona cuando el segundo miembro se puede escribir como potencia de la misma base.</p>';
        } else {
          h += '<p class="ap-note">' + K(S.kf(N, 6)) + ' no es una potencia entera de ' + K(bt) +
            ', así que la igualdad de exponentes no sirve. Hay que tomar logaritmos.</p>';
        }

        /* vía logarítmica, siempre */
        var t = logb(N, b);
        var res = resuelveFloat(Ex, t);
        var filasL = [
          ['Tomo logaritmos en los dos miembros', '\\ln\\left(' + bt + '^{\\,' + T(Ex) + '}\\right) = \\ln ' + S.kf(N, 6)],
          ['Aplico ' + '\\log(a^p) = p\\log a', '\\left(' + T(Ex) + '\\right)\\ln ' + bt + ' = \\ln ' + S.kf(N, 6)],
          ['Despejo el exponente',
            T(Ex) + ' = \\dfrac{\\ln ' + S.kf(N, 6) + '}{\\ln ' + bt + '} = \\log_{' + bt + '} ' + S.kf(N, 6) + ' \\approx ' + num(t, 6), 'eq-clave']
        ];
        h += '<h5>Vía logarítmica (siempre disponible)</h5>' + cadena(filasL);
        if (res.xs.length) {
          h += S.tabla(['Solución aproximada', 'Comprobación: ' + K('a^{E(x)}')],
            res.xs.map(function (x) {
              var val = Math.pow(b, S.pEvalNum(Ex, x));
              return [K('x \\approx ' + num(x, 6)), K(num(val, 6) + (Math.abs(val - N) < 1e-6 ? '\\;\\checkmark' : ''))];
            }));
        } else if (res.tipo === 'cuadratica') {
          h += '<p class="ap-warn">La ecuación ' + K(T(Ex) + ' = ' + num(t, 4)) +
            ' tiene discriminante negativo: no hay ningún número real que cumpla la ecuación exponencial.</p>';
        } else if (res.tipo === 'superior') {
          h += '<p class="ap-note">El exponente es de grado ' + S.pGrado(Ex) +
            ': la ecuación ' + K(T(Ex) + ' = ' + num(t, 4)) + ' se resolvería con las técnicas del apartado de factorización.</p>';
        }
        h += '<p class="ap-note">Compara las dos vías: la exacta da números como ' + K('x = 4') +
          ' y la logarítmica da decimales. Cuando las dos son posibles, la exacta es la buena; ' +
          'cuando no hay potencia exacta, el logaritmo es la única salida.</p>';
        return h;
      }));
  };

  /* ==================================================================
     13 · Tema 3.8 · cambio de variable t = a^x
     ================================================================== */
  R.expoCambioVar = function (node) {
    S.shell(node, 'Cambio de variable t = a^x',
      'Resuelve ' + K('p\\,a^{2x} + q\\,a^{x} + r = 0') + ' con el cambio ' + K('t = a^{x}') +
      '. Escribe la base y los tres coeficientes enteros: <code>2</code>, <code>1</code>, <code>-5</code>, <code>4</code> ' +
      'corresponde a ' + K('4^{x} - 5\\cdot 2^{x} + 4 = 0') + '. Con ' + K('p = 0') +
      ' la ecuación en ' + K('t') + ' es de primer grado.',
      [
        { id: 'a', label: 'Base a', type: 'number', value: 2, min: 2, max: 12, step: 1, ancho: '7rem' },
        { id: 'p', label: 'p (coeficiente de a^{2x})', type: 'number', value: 1, step: 1, ancho: '9rem' },
        { id: 'q', label: 'q (coeficiente de a^{x})', type: 'number', value: -5, step: 1, ancho: '9rem' },
        { id: 'r', label: 'r (término independiente)', type: 'number', value: 4, step: 1, ancho: '9rem' },
        chips([
          { txt: '4^x − 5·2^x + 4 = 0', tip: 'dos soluciones', set: { a: 2, p: 1, q: -5, r: 4 } },
          { txt: '9^x − 4·3^x + 3 = 0', tip: 'dos soluciones exactas', set: { a: 3, p: 1, q: -4, r: 3 } },
          { txt: '9^x − 3^x − 6 = 0', tip: 'un valor de t negativo se descarta', set: { a: 3, p: 1, q: -1, r: -6 } },
          { txt: '2^x + 2^(x+1) = 12', tip: 'p = 0: primer grado en t', set: { a: 2, p: 0, q: 3, r: -12 } },
          { txt: '4^x + 2^x + 1 = 0', tip: 'ningún t positivo', set: { a: 2, p: 1, q: 1, r: 1 } },
          { txt: '4^x − 6·2^x + 8 = 0', tip: 'ambas soluciones enteras', set: { a: 2, p: 1, q: -6, r: 8 } },
          { txt: '25^x − 5^x = 0', tip: 'sin término independiente', set: { a: 5, p: 1, q: -1, r: 0 } }
        ])
      ],
      safe(function (v) {
        var a = S.entero(v.a, 2, 12, 'La base');
        var p = S.entero(v.p, -200, 200, 'El coeficiente p');
        var q = S.entero(v.q, -400, 400, 'El coeficiente q');
        var r = S.entero(v.r, -2000, 2000, 'El coeficiente r');
        if (p === 0 && q === 0) throw Error('Con p = 0 y q = 0 no queda ninguna exponencial. Cambia p o q.');

        var izq = (p ? (p === 1 ? '' : p) + (a * a) + '^{\\,x}' : '') +
          (q ? (q > 0 ? (p ? ' + ' : '') : ' - ') + (Math.abs(q) === 1 ? '' : Math.abs(q)) + a + '^{\\,x}' : '') +
          (r ? (r > 0 ? ' + ' : ' - ') + Math.abs(r) : '');
        var h = S.expr('Ecuación exponencial', izq + ' = 0');
        h += cadena([
          ['Escribo todo con la misma base', (p ? (p === 1 ? '' : p) + '\\left(' + a + '^{\\,x}\\right)^{2}' : '') +
            (q ? (q > 0 ? (p ? ' + ' : '') : ' - ') + (Math.abs(q) === 1 ? '' : Math.abs(q)) + a + '^{\\,x}' : '') +
            (r ? (r > 0 ? ' + ' : ' - ') + Math.abs(r) : '') + ' = 0'],
          ['Cambio de variable', 't = ' + a + '^{\\,x}, \\quad t > 0', 'eq-clave'],
          ['Ecuación en t', T(S.pDe([r, q, p])) + ' = 0']
        ]);

        var Q = S.solCuadratica(new F(p), new F(q), new F(r));
        if (p !== 0) {
          h += S.kvs([
            'discriminante ' + K('\\Delta = ' + S.nc(Q.disc, 0)),
            Q.tipo === 'dos' ? 'dos valores de t' : (Q.tipo === 'doble' ? 'un valor doble de t' : 'ningún valor real de t')
          ]);
        }
        var ts = Q.raices || [];
        if (!ts.length) {
          h += '<p class="ap-warn">La ecuación en ' + K('t') +
            ' no tiene soluciones reales, así que la exponencial tampoco tiene solución.</p>';
          return h;
        }

        var filas = [], solucion = [];
        ts.forEach(function (tt) {
          var tv = tt.val();
          if (!(tv > 1e-12)) {
            filas.push({
              celdas: [K('t = ' + tt.tex()), K(num(tv, 4)),
                K('\\text{—}'),
                S.badge('descartado: ' + a + '^x nunca es negativo ni 0', 'no')]
            });
            return;
          }
          var kk = potExacta(tv, a);
          var xTex, xVal;
          if (kk !== null) { xTex = 'x = ' + kk; xVal = kk; }
          else {
            xVal = logb(tv, a);
            xTex = 'x = \\log_{' + a + '} ' + num(tv, 4) + ' = \\dfrac{\\ln ' + num(tv, 4) + '}{\\ln ' + a + '} \\approx ' + num(xVal, 5);
          }
          solucion.push({ tex: kk !== null ? String(kk) : num(xVal, 5), val: xVal, exacta: kk !== null });
          filas.push({
            celdas: [K('t = ' + tt.tex()), K(num(tv, 4)), K(xTex),
              S.badge(kk !== null ? 'solución exacta' : 'solución aproximada', 'si')],
            clase: 'ap-ok-row'
          });
        });
        h += '<h5>Deshago el cambio: ' + K('a^{x} = t') + '</h5>';
        h += S.tabla(['Valor de t', 'Aproximación', 'Deshago el cambio', 'Veredicto'], filas);
        h += S.resultado(K(solucion.length
          ? '\\{' + solucion.map(function (s) { return s.tex; }).join(',\\; ') + '\\}'
          : '\\varnothing'), 'conjunto solución');
        h += '<p class="ap-note">La condición ' + K('t > 0') +
          ' no es un adorno: es la que obliga a descartar los valores negativos o nulos de ' + K('t') +
          '. Olvidarla es dar por buena una solución que no existe.</p>';
        if (solucion.length) {
          h += rectaPuntos(solucion.map(function (s) {
            return { x: s.val, tex: num(s.val, 3), col: COL.verde };
          }), 'Soluciones sobre la recta real', 'Cada punto verde es un valor de x que cumple la ecuación.');
        }
        return h;
      }));
  };

  /* ==================================================================
     14 · Tema 3.8 · modelos exponenciales: despejar el tiempo
     ================================================================== */
  R.expoModelos = function (node) {
    S.shell(node, 'Interés compuesto, población y desintegración',
      'Elige el modelo y los datos; el applet plantea la ecuación exponencial y despeja el tiempo con logaritmos. ' +
      'Los decimales, con coma o con punto: <code>3,5</code>. En el modelo de desintegración, ' +
      'el dato «semivida» es el tiempo que tarda la cantidad en reducirse a la mitad.',
      [
        { id: 'modelo', label: 'Modelo', type: 'select', value: 'interes',
          options: [
            { value: 'interes', label: 'interés compuesto' },
            { value: 'poblacion', label: 'crecimiento continuo' },
            { value: 'desint', label: 'desintegración radiactiva' }
          ] },
        { id: 'c0', label: 'Cantidad inicial', type: 'text', value: '1000', ancho: '9rem' },
        { id: 'obj', label: 'Cantidad final', type: 'text', value: '2000', ancho: '9rem' },
        { id: 'tasa', label: 'Tasa anual en % (interés y población)', type: 'text', value: '3', ancho: '11rem' },
        { id: 'semi', label: 'Semivida T (desintegración)', type: 'text', value: '5730', ancho: '11rem' },
        { id: 'graf', label: 'Ver la gráfica del modelo', type: 'check', value: true },
        chips([
          { txt: '1000 € al 3 % hasta duplicar', tip: 'interés compuesto', set: { modelo: 'interes', c0: '1000', obj: '2000', tasa: '3' } },
          { txt: '5000 € al 4,5 % hasta 7500 €', tip: 'interés compuesto', set: { modelo: 'interes', c0: '5000', obj: '7500', tasa: '4,5' } },
          { txt: '800 € al 1,2 % hasta 1000 €', tip: 'tasa pequeña, muchos años', set: { modelo: 'interes', c0: '800', obj: '1000', tasa: '1,2' } },
          { txt: '12000 € al 6 % hasta 9000 €', tip: 'la cantidad final es menor: el tiempo sale negativo', set: { modelo: 'interes', c0: '12000', obj: '9000', tasa: '6' } },
          { txt: 'Población 2500 → 10000 al 4 %', tip: 'crecimiento continuo', set: { modelo: 'poblacion', c0: '2500', obj: '10000', tasa: '4' } },
          { txt: 'Población 40000 → 55000 al 1,8 %', tip: 'crecimiento continuo lento', set: { modelo: 'poblacion', c0: '40000', obj: '55000', tasa: '1,8' } },
          { txt: 'Carbono 14: del 100 % al 25 %', tip: 'desintegración, dos semividas exactas', set: { modelo: 'desint', c0: '100', obj: '25', semi: '5730' } },
          { txt: 'Carbono 14: del 100 % al 31 %', tip: 'datación de una muestra', set: { modelo: 'desint', c0: '100', obj: '31', semi: '5730' } },
          { txt: 'Yodo 131: de 80 mg a 5 mg', tip: 'semivida de 8 días', set: { modelo: 'desint', c0: '80', obj: '5', semi: '8' } }
        ])
      ],
      safe(function (v) {
        var c0 = S.real(v.c0, undefined, undefined, 'La cantidad inicial');
        var cf = S.real(v.obj, undefined, undefined, 'La cantidad final');
        if (!(c0 > 0)) throw Error('La cantidad inicial tiene que ser positiva: no se puede partir de 0 ni de una cantidad negativa.');
        if (!(cf > 0)) throw Error('La cantidad final tiene que ser positiva: una exponencial nunca vale 0 ni toma valores negativos.');
        var razon = cf / c0;
        var modelo = String(v.modelo || 'interes');
        var h = '';

        /* ---- datos comunes del modelo elegido ---- */
        var nombreT, unidad, ecTex, despTex, base, t, kTex, extra = '';
        if (modelo === 'interes') {
          var p = S.real(v.tasa, -99.999, 1000, 'La tasa de interés');
          if (Math.abs(p) < 1e-12) throw Error('Con un interés del 0 % el capital no cambia nunca: la ecuación no tiene solución salvo que ya partas de la cantidad final.');
          var i = p / 100;
          base = 1 + i;
          nombreT = 'años'; unidad = 'años';
          h += S.expr('Modelo de interés compuesto', 'C(t) = C_0\\,(1+i)^{t}', true);
          h += S.kvs([
            'capital inicial ' + K('C_0 = ' + num(c0, 2)) + ' €',
            'capital final ' + K('C = ' + num(cf, 2)) + ' €',
            'rédito anual ' + K('i = ' + num(p, 3) + '\\,\\% = ' + num(i, 5)),
            'factor de capitalización ' + K('1+i = ' + num(base, 5))
          ]);
          ecTex = num(cf, 2) + ' = ' + num(c0, 2) + '\\cdot(' + num(base, 5) + ')^{t}';
          despTex = '(' + num(base, 5) + ')^{t} = \\dfrac{' + num(cf, 2) + '}{' + num(c0, 2) + '} = ' + num(razon, 6);
          t = Math.log(razon) / Math.log(base);
          kTex = 't = \\log_{' + num(base, 5) + '}\\left(' + num(razon, 6) + '\\right) = \\dfrac{\\ln ' + num(razon, 6) + '}{\\ln ' + num(base, 5) + '}';
          var tDob = Math.log(2) / Math.log(base);
          extra = 'Con este rédito, el capital tarda ' + S.esc(ntxt(tDob, 2)) + ' años en duplicarse, ' +
            'sea cual sea la cantidad de partida: en el interés compuesto el tiempo de duplicación no depende de ' + K('C_0') + '.';
        } else if (modelo === 'poblacion') {
          var pp = S.real(v.tasa, -99.999, 1000, 'La tasa de crecimiento');
          if (Math.abs(pp) < 1e-12) throw Error('Con una tasa del 0 % la población se queda igual: no hay ningún instante en que alcance otra cantidad.');
          var kk = pp / 100;
          base = Math.exp(kk);
          nombreT = 'años'; unidad = 'años';
          h += S.expr('Modelo de crecimiento continuo', 'P(t) = P_0\\,e^{k t}', true);
          h += S.kvs([
            'población inicial ' + K('P_0 = ' + num(c0, 2)),
            'población final ' + K('P = ' + num(cf, 2)),
            'tasa continua ' + K('k = ' + num(pp, 3) + '\\,\\% = ' + num(kk, 5)),
            'factor anual equivalente ' + K('e^{k} = ' + num(base, 5))
          ]);
          ecTex = num(cf, 2) + ' = ' + num(c0, 2) + '\\cdot e^{' + num(kk, 5) + 't}';
          despTex = 'e^{' + num(kk, 5) + 't} = \\dfrac{' + num(cf, 2) + '}{' + num(c0, 2) + '} = ' + num(razon, 6);
          t = Math.log(razon) / kk;
          kTex = 't = \\dfrac{\\ln ' + num(razon, 6) + '}{' + num(kk, 5) + '}';
          extra = 'Aquí el logaritmo natural es el atajo evidente: como la base de la potencia es ' + K('e') +
            ', al tomar neperianos el exponente baja limpio y no hace falta ningún cambio de base.';
        } else {
          var TT = S.real(v.semi, undefined, undefined, 'La semivida');
          if (!(TT > 0)) throw Error('La semivida tiene que ser un tiempo positivo: es lo que tarda la muestra en reducirse a la mitad.');
          base = 0.5;
          nombreT = 'unidades de tiempo'; unidad = 'unidades de tiempo (las mismas que la semivida)';
          h += S.expr('Modelo de desintegración', 'N(t) = N_0\\cdot\\left(\\dfrac{1}{2}\\right)^{t/T}', true);
          h += S.kvs([
            'cantidad inicial ' + K('N_0 = ' + num(c0, 3)),
            'cantidad final ' + K('N = ' + num(cf, 3)),
            'semivida ' + K('T = ' + num(TT, 3)),
            'fracción que queda ' + K('\\dfrac{N}{N_0} = ' + num(razon, 6))
          ]);
          ecTex = num(cf, 3) + ' = ' + num(c0, 3) + '\\cdot\\left(\\dfrac{1}{2}\\right)^{t/' + num(TT, 3) + '}';
          despTex = '\\left(\\dfrac{1}{2}\\right)^{t/' + num(TT, 3) + '} = ' + num(razon, 6);
          t = TT * Math.log(razon) / Math.log(0.5);
          kTex = '\\dfrac{t}{' + num(TT, 3) + '} = \\log_{1/2}\\left(' + num(razon, 6) + '\\right)' +
            ' = \\dfrac{\\ln ' + num(razon, 6) + '}{\\ln 0{,}5} \\quad\\Longrightarrow\\quad t = ' + num(TT, 3) + '\\cdot\\dfrac{\\ln ' + num(razon, 6) + '}{\\ln 0{,}5}';
          var nSemi = Math.log(razon) / Math.log(0.5);
          extra = 'La cantidad final es ' + K('' + num(razon, 6)) + ' veces la inicial, es decir, ' +
            S.esc(ntxt(nSemi, 3)) + ' semividas. Fíjate en que ese número no depende de las unidades: solo del cociente ' + K('N/N_0') + '.';
        }

        /* ---- la cadena de transformaciones ---- */
        h += cadena([
          ['Planteo la ecuación con los datos', ecTex],
          ['Aíslo la potencia', despTex, 'eq-clave'],
          ['Tomo logaritmos y despejo el exponente', kTex]
        ]);

        /* ---- resultado ---- */
        if (!Number.isFinite(t)) {
          h += '<p class="ap-warn">Con estos datos el exponente no se puede despejar: revisa que las dos cantidades sean positivas y que la tasa no sea nula.</p>';
          return h;
        }
        h += S.resultado(K('t \\approx ' + num(t, 4)), 'tiempo, en ' + unidad);
        if (t < 0) {
          h += '<p class="ap-warn">El tiempo sale negativo. Eso no es un error de cálculo: significa que la cantidad final ' +
            'es anterior a la inicial dentro del modelo, es decir, que ese valor se alcanzó ' + S.esc(ntxt(-t, 3)) +
            ' unidades de tiempo <em>antes</em> del instante que has tomado como origen. En un problema real hay que ' +
            'interpretarlo o descartarlo, pero la ecuación no miente.</p>';
        }
        h += '<p class="ap-note">' + extra + '</p>';

        /* ---- comprobación numérica ---- */
        var recalculo;
        if (modelo === 'desint') {
          recalculo = c0 * Math.pow(0.5, t / S.real(v.semi, undefined, undefined, 'La semivida'));
        } else {
          recalculo = c0 * Math.pow(base, t);
        }
        h += S.tabla(['Comprobación', 'Valor'], [
          { celdas: [K('t'), K(num(t, 6))] },
          { celdas: ['Cantidad que predice el modelo en ese instante', K(num(recalculo, 4))] },
          { celdas: ['Cantidad final que pedías', K(num(cf, 4))] },
          { celdas: ['¿Coinciden?', Math.abs(recalculo - cf) < 1e-6 * Math.max(1, Math.abs(cf))
            ? S.badge('sí, el despeje es correcto', 'si') : S.badge('hay desviación de redondeo', 'avi')] }
        ]);

        /* ---- gráfica ---- */
        if (v.graf) {
          var tmax = Math.max(1, Math.abs(t) * 1.6);
          var f;
          if (modelo === 'desint') {
            var Tg = S.real(v.semi, undefined, undefined, 'La semivida');
            f = function (x) { return c0 * Math.pow(0.5, x / Tg); };
          } else {
            f = function (x) { return c0 * Math.pow(base, x); };
          }
          var g = function () { return cf; };
          var ymin = 0, ymax = Math.max(f(0), f(tmax), cf) * 1.2;
          if (!Number.isFinite(ymax) || ymax <= 0) ymax = Math.max(1, cf * 2);
          h += S.ejes({
            xmin: Math.min(0, t * 1.3), xmax: tmax, ymin: ymin, ymax: ymax, W: 1000, H: 520,
            paso: Math.max(1, Math.round((tmax - Math.min(0, t * 1.3)) / 10)),
            pasoY: Math.max(1, Math.round(ymax / 8)),
            curvas: [
              { f: f, col: COL.azul, label: 'modelo', lx: 640, ly: 70 },
              { f: g, col: COL.naranja, label: 'cantidad final', lx: 640, ly: 120, dash: true }
            ],
            puntos: [{ x: t, y: cf, col: COL.verde, tex: 't = ' + num(t, 2) }],
            label: 'Gráfica del modelo exponencial y de la cantidad buscada',
            cap: 'La curva azul es la cantidad en función del tiempo; la recta naranja, la cantidad que quieres alcanzar. ' +
              'El punto verde es la solución de la ecuación: el instante en que ambas coinciden.'
          });
        }

        h += '<div class="mx-info"><b>Cómo se traduce el enunciado.</b> En estos problemas la incógnita casi siempre ' +
          'está en el exponente, así que el guion es siempre el mismo: escribo el modelo, sustituyo los datos, ' +
          'aíslo la potencia dejándola sola en un miembro y solo entonces tomo logaritmos. ' +
          'Tomar logaritmos antes de aislar la potencia es el error más caro, porque ' + K('\\log(a+b)') +
          ' no se puede descomponer.</div>';
        return h;
      }));
  };

  /* ==================================================================
     Registro terminado: aviso al núcleo de que el módulo B está listo
     ================================================================== */
  S.extraB = true;
  if (S.monta) S.monta();
})();
