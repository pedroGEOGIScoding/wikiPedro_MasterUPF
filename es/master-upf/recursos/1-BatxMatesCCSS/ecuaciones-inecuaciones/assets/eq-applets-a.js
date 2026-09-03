/* =====================================================================
   eq-applets-a.js · Módulo A del Tema 3 Ecuaciones e inecuaciones
   1.º de Bachillerato · Matemáticas Aplicadas a las Ciencias Sociales

   Applets de los apartados 3.1, 3.2 y 3.3:
     resolverLineal    resolución paso a paso de una ecuación lineal
     equivalentes      laboratorio de ecuaciones equivalentes
     clasificaLineal   única / identidad / incompatible, con la recta
     compruebaSol      comprobación de candidatos a solución
     despejaFormula    despeje de una letra en una fórmula
     problemaLineal    del enunciado al lenguaje algebraico
     incompletas       ecuaciones de segundo grado incompletas
     completarCuadrado deducción de la fórmula general
     discriminante     discriminante y número de soluciones, con parábola
     parabolaABC       deslizadores a, b, c sobre la parábola
     vieta             suma y producto de raíces, reconstrucción
     bicuadrada        cambio de variable en las bicuadradas
     bipotencial       ecuaciones ax^(2n) + bx^n + c = 0
     cambioAuxiliar    otros cambios de variable

   Depende de eq-applets.js (window.EQ). Se carga después.
   ===================================================================== */
(function () {
  'use strict';
  var S = window.EQ;
  if (!S) { console.error('[ecuaciones] eq-applets-a.js sin núcleo'); return; }

  var R = S.registry, K = S.K, KD = S.KD, F = S.Frac, T = S.pTex, esc = S.esc;
  var kf = S.kf, nc = S.nc, COL = S.COL;

  /* ==================================================================
     0 · utilidades locales
     ================================================================== */

  /* El armazón registra los errores en una pila que no existe en este
     tema, así que cada applet atrapa sus propios avisos y los muestra
     como texto amable, sin romper la página. */
  function guarda(f) {
    return function (v, ctl, out, api) {
      try { return f(v, ctl, out, api); }
      catch (e) { return '<div class="mx-bad">' + esc(e && e.message ? e.message : String(e)) + '</div>'; }
    };
  }

  /* Lee una casilla que debe contener un número: 3, -2, 0,5 o 3/4. */
  function fr(txt, nombre) {
    var p = S.parsePol(String(txt), 'x', nombre);
    if (S.pGrado(p) > 0) throw Error(nombre + ' tiene que ser un número, no una expresión con x. Vale un entero (3), un decimal (0,5) o una fracción (3/4).');
    return p[0];
  }
  function ft(f) { return f.tex(true); }
  function fv(f) { return f.val(); }
  function esCero(f) { return f.n === 0n; }
  function FR(n, d) { return new F(BigInt(n), BigInt(d === undefined ? 1 : d)); }

  /* Rellena controles desde un botón de escenario. */
  function pon(ctl, obj) {
    Object.keys(obj).forEach(function (k) {
      var e = ctl[k];
      if (!e) return;
      if (e.type === 'checkbox') e.checked = !!obj[k];
      else e.value = String(obj[k]);
      if (e.type === 'range') { try { e.dispatchEvent(new window.Event('input')); } catch (x) { } }
    });
  }
  function escenarios(lista, etiqueta) {
    return {
      type: 'presets',
      label: etiqueta || 'Escenarios',
      list: lista.map(function (c) {
        return { label: c.txt, title: c.tit || '', apply: function (ctl) { pon(ctl, c.set); } };
      })
    };
  }

  /* Cadena de transformaciones equivalentes. */
  function cad(filas) {
    return '<div class="eq-cadena">' + filas.map(function (f) {
      return '<div class="eq-fila ' + (f.c || '') + '">' +
        '<div class="eq-rot">' + esc(f.rot) + '</div>' +
        '<div class="eq-mat">' + K(f.tex) + '</div></div>';
    }).join('') + '</div>';
  }
  function fila(rot, tex, c) { return { rot: rot, tex: tex, c: c || '' }; }

  function tarjeta(titulo, html, clase) {
    return '<div class="ap-card ' + (clase || '') + '"><div class="ap-card-tit">' + esc(titulo) + '</div>' + html + '</div>';
  }
  function rejilla(cartas) { return '<div class="ap-grid2">' + cartas.join('') + '</div>'; }
  function enun(html) { return '<div class="ap-enun">' + html + '</div>'; }
  function nota(html) { return '<p class="ap-note">' + html + '</p>'; }

  /* Tres cajas con el caso del discriminante activo. */
  function cajasDisc(estado) {
    var defs = [
      ['dos', '\\Delta > 0', 'Dos soluciones reales distintas. La parábola corta al eje OX en dos puntos.'],
      ['doble', '\\Delta = 0', 'Una solución doble. La parábola es tangente al eje OX: lo toca sin atravesarlo.'],
      ['ninguna', '\\Delta < 0', 'Ninguna solución real. La parábola queda entera por encima o por debajo del eje OX.']
    ];
    return '<div class="eq-disc">' + defs.map(function (d) {
      return '<div class="eq-disc-caja' + (d[0] === estado ? ' eq-on' : '') + '"><b>' + K(d[1]) + '</b>' + d[2] + '</div>';
    }).join('') + '</div>';
  }

  /* Ventana razonable para una gráfica a partir de puntos de interés. */
  function ventana(xs, f, opts) {
    opts = opts || {};
    var fin = xs.filter(function (x) { return isFinite(x); });
    var m = 3;
    if (fin.length) {
      fin.forEach(function (x) { m = Math.max(m, Math.abs(x) + 2); });
    }
    m = Math.min(20, Math.ceil(m));
    var ys = [], i, x, y;
    for (i = -60; i <= 60; i++) {
      x = m * i / 60;
      y = f(x);
      if (isFinite(y)) ys.push(y);
    }
    (opts.ys || []).forEach(function (v) { if (isFinite(v)) ys.push(v); });
    if (!ys.length) ys = [0];
    var yM = Math.max.apply(null, ys), ym = Math.min.apply(null, ys);
    if (yM > 60) yM = 60;
    if (ym < -60) ym = -60;
    yM = Math.max(2, Math.ceil(yM + 1));
    ym = Math.min(-2, Math.floor(ym - 1));
    return { xmin: -m, xmax: m, ymin: ym, ymax: yM };
  }

  /* Raíz n-ésima exacta de una fracción, si existe. */
  function raizExacta(f, n) {
    var p = Number(f.n), q = Number(f.d), s = p < 0 ? -1 : 1;
    p = Math.abs(p);
    var rp = Math.round(Math.pow(p, 1 / n)), rq = Math.round(Math.pow(q, 1 / n));
    if (Math.pow(rp, n) === p && Math.pow(rq, n) === q) return new F(BigInt(s * rp), BigInt(rq));
    return null;
  }
  /* Raíz cuadrada exacta en forma de radical simplificado: √(p/q). */
  function raizCuadTex(f) {
    var p = Number(f.n), q = Number(f.d);
    var sr = S.simplRaiz(p * q);
    var fuera = sr.fuera, dentro = sr.dentro;
    var g = S.mcd(fuera, q) || 1;
    fuera /= g; q /= g;
    var arriba = (dentro === 1) ? String(fuera) : (fuera === 1 ? '' : String(fuera)) + '\\sqrt{' + dentro + '}';
    return q === 1 ? arriba : '\\dfrac{' + arriba + '}{' + q + '}';
  }
  /* Texto exacto (o aproximado) de la raíz n-ésima de un valor de t. */
  function raizNTex(t, n) {
    /* t es un Irr del núcleo */
    if (t.esRacional()) {
      var f = t.frac();
      var ex = raizExacta(f, n);
      if (ex) return { tex: ft(ex), exacto: true, val: ex.val() };
      if (n === 2) return { tex: raizCuadTex(f), exacto: true, val: Math.sqrt(f.val()) };
      var cuerpo = f.d === 1n ? String(f.n) : '\\dfrac{' + f.n + '}{' + f.d + '}';
      return { tex: '\\sqrt[' + n + ']{' + cuerpo + '}', exacto: true, val: Math.pow(f.val(), 1 / n) };
    }
    var v = Math.pow(Math.abs(t.val()), 1 / n) * (t.val() < 0 ? -1 : 1);
    return { tex: kf(v, 4), exacto: false, val: v };
  }
  /* Logaritmo exacto: ¿t = base^k con k entero? */
  function logExacto(t, b) {
    if (!(t > 0) || !(b > 0) || b === 1) return null;
    var r = Math.round(Math.log(t) / Math.log(b));
    if (Math.abs(Math.pow(b, r) - t) < 1e-9 * Math.max(1, t)) return r;
    return null;
  }

  /* Resolución de A(x) = B(x) cuando queda de primer grado. */
  function resuelveLin(A, B) {
    var D = S.pResta(A, B);
    if (S.pEsCero(D)) return { tipo: 'identidad', tex: 'x \\in \\mathbb{R}', poli: D };
    var g = S.pGrado(D);
    if (g === 0) return { tipo: 'incompatible', tex: '\\varnothing', poli: D };
    if (g === 1) {
      var L = S.solLineal(D[1], D[0]);
      return { tipo: 'unica', x: L.x, tex: L.tex, poli: D };
    }
    return { tipo: 'grado', g: g, poli: D };
  }
  function textoTipo(Rl) {
    if (Rl.tipo === 'identidad') return S.badge('identidad: infinitas soluciones', 'si');
    if (Rl.tipo === 'incompatible') return S.badge('incompatible: ninguna solución', 'no');
    if (Rl.tipo === 'unica') return S.badge('una única solución', 'si');
    return S.badge('no es de primer grado (grado ' + Rl.g + ')', 'info');
  }

  /* Comprobación de una solución en las dos cajas grandes. */
  function comprobacionHTML(A, B, x) {
    var c = S.comprueba(A, B, x);
    return '<div class="eq-check">' +
      '<div class="eq-check-caja ' + (c.ok ? 'eq-ok' : 'eq-ko') + '">Primer miembro en ' +
      K('x = ' + kf(x, 4)) + ': ' + K(kf(c.izq, 4)) + '</div>' +
      '<div class="eq-check-caja ' + (c.ok ? 'eq-ok' : 'eq-ko') + '">Segundo miembro en ' +
      K('x = ' + kf(x, 4)) + ': ' + K(kf(c.der, 4)) + '</div>' +
      '</div>' +
      (c.ok ? nota('Los dos miembros coinciden: la solución es correcta.')
        : nota('Los dos miembros no coinciden (se diferencian en ' + nc(c.dif, 4) + '): ese valor no es solución.'));
  }

  /* ==================================================================
     1 · resolverLineal
     ================================================================== */
  R.resolverLineal = function (node) {
    S.shell(node, 'Resuelve tu ecuación de primer grado paso a paso',
      'Escribe cada miembro por separado, sin el signo igual y sin espacios: ' +
      '<code>2(x-3)+5</code>, <code>x/2+x/3</code>, <code>0,5x-1</code>, <code>3(x-1)-2(x+4)</code>. ' +
      'Usa <code>^</code> para los exponentes y la barra <code>/</code> para dividir entre un número. ' +
      'El applet pasa todo al primer miembro, quita denominadores multiplicando por el m.c.m. y despeja la incógnita.',
      [
        { id: 'izq', label: 'Primer miembro', type: 'text', value: '2(x-3)+5', ancho: '15rem' },
        { id: 'der', label: 'Segundo miembro', type: 'text', value: 'x+1', ancho: '15rem' },
        escenarios([
          { txt: '2(x−3)+5 = x+1', set: { izq: '2(x-3)+5', der: 'x+1' } },
          { txt: 'x/2 + x/3 = 5', set: { izq: 'x/2+x/3', der: '5' } },
          { txt: '(x−1)/2 − (x+3)/5 = 1', set: { izq: '(x-1)/2-(x+3)/5', der: '1' } },
          { txt: 'identidad: 3(x−1)−2(x+4) = x−11', set: { izq: '3(x-1)-2(x+4)', der: 'x-11' } },
          { txt: 'incompatible: 2(x+1) = 2x+5', set: { izq: '2(x+1)', der: '2x+5' } },
          { txt: 'coeficientes decimales', set: { izq: '0,5x-1,5', der: '0,2x+0,9' } },
          { txt: 'sorpresa: x(x−2) = x²−8', set: { izq: 'x(x-2)', der: 'x^2-8' } }
        ])
      ],
      guarda(function (v) {
        var A = S.parsePol(v.izq, 'x', 'el primer miembro');
        var B = S.parsePol(v.der, 'x', 'el segundo miembro');
        var P = S.resuelveLinealPaso(v.izq, v.der);
        var Rl = resuelveLin(A, B);
        var h = S.expr('Ecuación de partida', T(A) + ' = ' + T(B));
        var filas = [];
        P.pasos.forEach(function (p, i) {
          filas.push(fila(p.t, p.tex, i === 0 ? 'eq-clave' : ''));
        });
        if (Rl.tipo === 'identidad') {
          filas.push(fila('Todo se cancela', '0 = 0', 'eq-bien'));
          h += cad(filas);
          h += S.expr('Se cumple para cualquier valor de x', 'x \\in \\mathbb{R}');
          h += textoTipo(Rl);
          h += nota('Los dos miembros eran la misma expresión escrita de otra forma. No es una ecuación con una incógnita que despejar, sino una <b>identidad</b>.');
          return h;
        }
        if (Rl.tipo === 'incompatible') {
          filas.push(fila('Desaparece la x y queda', T(Rl.poli) + ' = 0', 'eq-mal'));
          h += cad(filas);
          h += S.expr('Conjunto solución', '\\varnothing');
          h += textoTipo(Rl);
          h += nota('Al agrupar, los términos en x se cancelan y queda una igualdad numérica falsa. Ningún número la cumple: la ecuación es <b>incompatible</b>.');
          return h;
        }
        if (Rl.tipo === 'grado') {
          h += cad(filas.concat([fila('Grado que queda', T(Rl.poli) + ' = 0', 'eq-clave')]));
          h += textoTipo(Rl);
          if (Rl.g === 2) {
            var Q = S.solCuadratica(Rl.poli[2], Rl.poli[1], Rl.poli[0]);
            h += nota('Es una ecuación de segundo grado. Su solución se estudia en el apartado siguiente: ' +
              K(S.raicesTex(Q)) + '.');
          } else {
            h += nota('Este applet solo despeja ecuaciones que acaban siendo de primer grado. Prueba a escribir dos miembros cuyo grado se cancele.');
          }
          return h;
        }
        h += cad(filas);
        h += S.expr('Solución', 'x = ' + ft(Rl.x) +
          (Rl.x.esEntero() ? '' : ' \\approx ' + kf(fv(Rl.x), 4)));
        h += textoTipo(Rl);
        h += '<h5 class="ap-card-tit">Comprobación</h5>' + comprobacionHTML(A, B, fv(Rl.x));
        return h;
      }));
  };

  /* ==================================================================
     2 · equivalentes
     ================================================================== */
  var OPS = [
    { value: 'mas', label: 'sumar el número k a los dos miembros' },
    { value: 'menos', label: 'restar el número k a los dos miembros' },
    { value: 'kx', label: 'sumar k·x a los dos miembros' },
    { value: 'por', label: 'multiplicar los dos miembros por k' },
    { value: 'entre', label: 'dividir los dos miembros entre k' }
  ];
  R.equivalentes = function (node) {
    S.shell(node, 'Laboratorio de ecuaciones equivalentes',
      'Escribe una ecuación en dos casillas (<code>2x-3</code> y <code>x+1</code>), elige una operación y un valor de ' +
      '<code>k</code> (admite <code>-4</code>, <code>0,5</code> o <code>3/2</code>). El applet aplica la operación a los ' +
      '<b>dos miembros</b> y compara las soluciones de la ecuación original y de la transformada. ' +
      'Prueba también con <code>k = 0</code> al multiplicar: es el caso que rompe la equivalencia.',
      [
        { id: 'izq', label: 'Primer miembro', type: 'text', value: '2x-3', ancho: '12rem' },
        { id: 'der', label: 'Segundo miembro', type: 'text', value: 'x+1', ancho: '12rem' },
        { id: 'op', label: 'Operación', type: 'select', options: OPS, value: 'mas' },
        { id: 'k', label: 'Valor de k', type: 'text', value: '3', ancho: '7rem' },
        escenarios([
          { txt: 'sumar 3', set: { izq: '2x-3', der: 'x+1', op: 'mas', k: '3' } },
          { txt: 'restar x', set: { izq: '2x-3', der: 'x+1', op: 'kx', k: '-1' } },
          { txt: 'multiplicar por 5', set: { izq: 'x/5-1', der: '2', op: 'por', k: '5' } },
          { txt: 'dividir entre 4', set: { izq: '4x', der: '20', op: 'entre', k: '4' } },
          { txt: 'multiplicar por 0 (peligro)', set: { izq: '2x-3', der: 'x+1', op: 'por', k: '0' } },
          { txt: 'multiplicar por −1', set: { izq: '-x+2', der: '5', op: 'por', k: '-1' } }
        ])
      ],
      guarda(function (v) {
        var A = S.parsePol(v.izq, 'x', 'el primer miembro');
        var B = S.parsePol(v.der, 'x', 'el segundo miembro');
        var k = fr(v.k, 'El valor de k');
        var A2, B2, rot;
        if (v.op === 'mas') { A2 = S.pSuma(A, [k]); B2 = S.pSuma(B, [k]); rot = 'Sumo ' + k.txt() + ' a los dos miembros'; }
        else if (v.op === 'menos') { A2 = S.pResta(A, [k]); B2 = S.pResta(B, [k]); rot = 'Resto ' + k.txt() + ' a los dos miembros'; }
        else if (v.op === 'kx') {
          var m = S.pMono(k, 1);
          A2 = S.pSuma(A, m); B2 = S.pSuma(B, m); rot = 'Sumo ' + k.txt() + 'x a los dos miembros';
        } else if (v.op === 'por') { A2 = S.pEscala(A, k); B2 = S.pEscala(B, k); rot = 'Multiplico los dos miembros por ' + k.txt(); }
        else {
          if (esCero(k)) throw Error('No se puede dividir entre 0: esa operación no está permitida en ningún paso de una ecuación.');
          A2 = S.pEscala(A, FR(1).entre(k)); B2 = S.pEscala(B, FR(1).entre(k));
          rot = 'Divido los dos miembros entre ' + k.txt();
        }
        var R1 = resuelveLin(A, B), R2 = resuelveLin(A2, B2);
        var mismo = R1.tipo === R2.tipo &&
          (R1.tipo !== 'unica' || R1.x.cmp(R2.x) === 0) &&
          (R1.tipo !== 'grado' || R1.g === R2.g);
        var h = cad([
          fila('Ecuación de partida', T(A) + ' = ' + T(B), 'eq-clave'),
          fila(rot, T(A2) + ' = ' + T(B2), mismo ? 'eq-bien' : 'eq-mal')
        ]);
        h += rejilla([
          tarjeta('Solución de la original', KD(R1.tipo === 'unica' ? 'x = ' + ft(R1.x) : R1.tipo === 'grado' ? '\\text{grado } ' + R1.g : R1.tex), 'ap-card-ok'),
          tarjeta('Solución de la transformada', KD(R2.tipo === 'unica' ? 'x = ' + ft(R2.x) : R2.tipo === 'grado' ? '\\text{grado } ' + R2.g : R2.tex), mismo ? 'ap-card-ok' : 'ap-card-ko')
        ]);
        h += mismo ? S.badge('las dos ecuaciones son equivalentes', 'si')
          : S.badge('cuidado: la transformada NO es equivalente', 'no');
        if (v.op === 'por' && esCero(k)) {
          h += nota('Multiplicar por cero convierte cualquier ecuación en <b>0 = 0</b>, que se cumple siempre. Se pierde toda la información: por eso la regla del producto exige <b>k distinto de cero</b>.');
        } else if (mismo) {
          h += nota('Sumar el mismo número (o la misma expresión) a los dos miembros y multiplicar los dos miembros por un número distinto de cero producen ecuaciones <b>equivalentes</b>: tienen exactamente las mismas soluciones. Esas dos reglas son las únicas que necesitas para despejar.');
        }
        return h;
      }));
  };

  /* ==================================================================
     3 · clasificaLineal
     ================================================================== */
  R.clasificaLineal = function (node) {
    S.shell(node, 'Única solución, identidad o incompatible',
      'Mueve los deslizadores de <code>a</code> y <code>b</code> en la ecuación <code>ax + b = 0</code> y observa los tres ' +
      'casos posibles. Fíjate sobre todo en lo que ocurre cuando <code>a = 0</code>: la recta se vuelve horizontal y, según ' +
      'el valor de <code>b</code>, la ecuación pasa a tener infinitas soluciones o ninguna.',
      [
        { id: 'a', label: 'Coeficiente a', type: 'range', min: -5, max: 5, step: 0.5, value: 2 },
        { id: 'b', label: 'Término independiente b', type: 'range', min: -10, max: 10, step: 1, value: -6 },
        escenarios([
          { txt: '3x − 12 = 0', set: { a: 3, b: -12 } },
          { txt: '−2x + 1 = 0', set: { a: -2, b: 1 } },
          { txt: '0,5x − 4 = 0', set: { a: 0.5, b: -4 } },
          { txt: 'identidad: 0x + 0 = 0', set: { a: 0, b: 0 } },
          { txt: 'incompatible: 0x + 5 = 0', set: { a: 0, b: 5 } },
          { txt: 'incompatible: 0x − 7 = 0', set: { a: 0, b: -7 } }
        ])
      ],
      guarda(function (v) {
        var a = fr(v.a, 'El coeficiente a'), b = fr(v.b, 'El término independiente b');
        var L = S.solLineal(a, b);
        var pol = S.pDe([b, a]);
        var h = S.expr('Ecuación', T(pol) + ' = 0');
        var estado = L.tipo;
        var defs = [
          ['unica', 'a \\neq 0', 'Una única solución: ' + '<b>' + 'x = -b/a' + '</b>' + '. La recta corta al eje OX en un punto.'],
          ['identidad', 'a = 0,\\; b = 0', 'Queda 0 = 0, cierto siempre: infinitas soluciones. La recta es el propio eje OX.'],
          ['incompatible', 'a = 0,\\; b \\neq 0', 'Queda b = 0, falso: ninguna solución. La recta es horizontal y no toca al eje OX.']
        ];
        h += '<div class="eq-disc">' + defs.map(function (d) {
          return '<div class="eq-disc-caja' + (d[0] === estado ? ' eq-on' : '') + '"><b>' + K(d[1]) + '</b>' + d[2] + '</div>';
        }).join('') + '</div>';
        if (L.tipo === 'unica') {
          h += cad([
            fila('Paso el término independiente', ft(a) + 'x = ' + ft(b.opuesto())),
            fila('Divido entre el coeficiente de x', 'x = \\dfrac{' + b.opuesto().tex(true) + '}{' + ft(a) + '} = ' + ft(L.x), 'eq-bien')
          ]);
        } else if (L.tipo === 'identidad') {
          h += cad([fila('Sustituyo los coeficientes', '0 \\cdot x + 0 = 0'), fila('Queda', '0 = 0', 'eq-bien')]);
        } else {
          h += cad([fila('Sustituyo los coeficientes', '0 \\cdot x + ' + ft(b) + ' = 0'), fila('Queda', ft(b) + ' = 0 \\;\\text{(falso)}', 'eq-mal')]);
        }
        h += S.expr('Conjunto solución', L.conj.tex());
        var av = fv(a), bv = fv(b);
        var raiz = av !== 0 ? -bv / av : 0;
        var W = ventana([raiz], function (x) { return av * x + bv; });
        h += S.ejes({
          xmin: W.xmin, xmax: W.xmax, ymin: W.ymin, ymax: W.ymax, W: 1000, H: 540,
          curvas: [{ f: function (x) { return av * x + bv; }, col: COL.azul, label: 'y = ' + T(pol), lx: 690, ly: 78 }],
          puntos: av !== 0 ? [{ x: raiz, y: 0, col: COL.rojo, tex: 'x = ' + ft(L.x) }] : [],
          cap: 'La solución de ' + K(T(pol) + ' = 0') + ' es la abscisa del punto donde la recta ' +
            K('y = ' + T(pol)) + ' corta al eje OX.'
        });
        return h;
      }));
  };

  /* ==================================================================
     4 · compruebaSol
     ================================================================== */
  R.compruebaSol = function (node) {
    S.shell(node, 'Comprobador de soluciones',
      'Escribe los dos miembros de la ecuación y, en la tercera casilla, los valores que quieres comprobar separados por ' +
      'espacios: <code>2 -3 1/2</code>. El applet sustituye cada candidato en los dos miembros y te dice si la igualdad se ' +
      'cumple. Debajo aparece el conjunto solución verdadero, para que compares.',
      [
        { id: 'izq', label: 'Primer miembro', type: 'text', value: 'x^2-5x', ancho: '12rem' },
        { id: 'der', label: 'Segundo miembro', type: 'text', value: '-6', ancho: '12rem' },
        { id: 'xs', label: 'Valores a comprobar', type: 'text', value: '1 2 3 -6', ancho: '12rem' },
        escenarios([
          { txt: 'x² − 5x = −6', set: { izq: 'x^2-5x', der: '-6', xs: '1 2 3 -6' } },
          { txt: '2x − 1 = x + 1', set: { izq: '2x-1', der: 'x+1', xs: '0 1 2 3' } },
          { txt: 'x/2 + x/3 = 5', set: { izq: 'x/2+x/3', der: '5', xs: '5 6 7' } },
          { txt: 'identidad 2(x+1) = 2x+2', set: { izq: '2(x+1)', der: '2x+2', xs: '-2 0 7' } },
          { txt: 'incompatible x+1 = x+2', set: { izq: 'x+1', der: 'x+2', xs: '-1 0 1' } },
          { txt: 'raíz doble (x−3)² = 0', set: { izq: '(x-3)^2', der: '0', xs: '3 -3 0' } }
        ])
      ],
      guarda(function (v) {
        var A = S.parsePol(v.izq, 'x', 'el primer miembro');
        var B = S.parsePol(v.der, 'x', 'el segundo miembro');
        var lista = S.listaReales(v.xs, 'los valores', 8);
        var filas = lista.map(function (o) {
          var c = S.comprueba(A, B, o.v);
          return {
            clase: c.ok ? 'ap-ok-row' : '',
            celdas: [K(o.tex), K(kf(c.izq, 4)), K(kf(c.der, 4)),
            c.ok ? S.badge('sí es solución', 'si') : S.badge('no lo es', 'no')]
          };
        });
        var h = S.expr('Ecuación', T(A) + ' = ' + T(B));
        h += S.tabla(['Valor de x', 'Primer miembro', 'Segundo miembro', '¿Se cumple la igualdad?'], filas);
        var D = S.pResta(A, B);
        if (S.pEsCero(D)) {
          h += S.expr('Conjunto solución verdadero', 'x \\in \\mathbb{R}');
          h += nota('Los dos miembros son iguales término a término: cualquier número la cumple.');
        } else if (S.pGrado(D) === 0) {
          h += S.expr('Conjunto solución verdadero', '\\varnothing');
          h += nota('Al restar los miembros desaparece la incógnita y queda una igualdad numérica falsa: no hay ningún valor que la cumpla.');
        } else {
          var P = S.solPolinomica(D);
          h += S.expr('Conjunto solución verdadero', P.conj.esVacio() ? '\\varnothing' : P.conj.tex());
          h += nota('Comprobar no es lo mismo que resolver: la comprobación solo confirma o descarta los candidatos que tú propones. Aun así, es el hábito que detecta la mayoría de los errores de cálculo.');
        }
        return h;
      }));
  };

  /* ==================================================================
     5 · despejaFormula
     ================================================================== */
  var DESPEJES = [
    {
      txt: 'A = b·h (área del rectángulo) → despejar h',
      ec: 'A = b \\cdot h', obj: 'h',
      datos: [['A', '24'], ['b', '6']],
      pasos: [
        ['Fórmula de partida', 'A = b \\cdot h'],
        ['La h está multiplicada por b: paso b dividiendo', '\\dfrac{A}{b} = h'],
        ['Escribo la incógnita en el primer miembro', 'h = \\dfrac{A}{b}']
      ],
      calc: function (d) { if (d[1] === 0) throw Error('La base b no puede valer 0.'); return d[0] / d[1]; }
    },
    {
      txt: 'P = 2(b+h) (perímetro del rectángulo) → despejar h',
      ec: 'P = 2(b + h)', obj: 'h',
      datos: [['P', '30'], ['b', '9']],
      pasos: [
        ['Fórmula de partida', 'P = 2(b + h)'],
        ['Divido los dos miembros entre 2', '\\dfrac{P}{2} = b + h'],
        ['Resto b en los dos miembros', '\\dfrac{P}{2} - b = h'],
        ['Solución', 'h = \\dfrac{P}{2} - b']
      ],
      calc: function (d) { return d[0] / 2 - d[1]; }
    },
    {
      txt: 'y = mx + n (recta) → despejar x',
      ec: 'y = m x + n', obj: 'x',
      datos: [['y', '7'], ['m', '2'], ['n', '1']],
      pasos: [
        ['Fórmula de partida', 'y = m x + n'],
        ['Resto n en los dos miembros', 'y - n = m x'],
        ['Divido entre m (que debe ser distinto de 0)', '\\dfrac{y - n}{m} = x'],
        ['Solución', 'x = \\dfrac{y - n}{m}']
      ],
      calc: function (d) { if (d[1] === 0) throw Error('Si m = 0 la recta es horizontal y la x no se puede despejar.'); return (d[0] - d[2]) / d[1]; }
    },
    {
      txt: 'y = mx + n (recta) → despejar la pendiente m',
      ec: 'y = m x + n', obj: 'm',
      datos: [['y', '7'], ['n', '1'], ['x', '3']],
      pasos: [
        ['Fórmula de partida', 'y = m x + n'],
        ['Resto n en los dos miembros', 'y - n = m x'],
        ['Divido entre x', '\\dfrac{y - n}{x} = m'],
        ['Solución', 'm = \\dfrac{y - n}{x}']
      ],
      calc: function (d) { if (d[2] === 0) throw Error('Con x = 0 no se puede despejar la pendiente: ese punto no da información sobre m.'); return (d[0] - d[1]) / d[2]; }
    },
    {
      txt: 'F = (9/5)C + 32 (grados Fahrenheit) → despejar C',
      ec: 'F = \\dfrac{9}{5}\\,C + 32', obj: 'C',
      datos: [['F', '98,6']],
      pasos: [
        ['Fórmula de partida', 'F = \\dfrac{9}{5}\\,C + 32'],
        ['Resto 32 en los dos miembros', 'F - 32 = \\dfrac{9}{5}\\,C'],
        ['Multiplico los dos miembros por 5', '5(F - 32) = 9C'],
        ['Divido entre 9', 'C = \\dfrac{5(F - 32)}{9}']
      ],
      calc: function (d) { return 5 * (d[0] - 32) / 9; }
    },
    {
      txt: 'I = C·r·t (interés simple) → despejar el tiempo t',
      ec: 'I = C \\cdot r \\cdot t', obj: 't',
      datos: [['I', '300'], ['C', '5000'], ['r', '0,03']],
      pasos: [
        ['Fórmula de partida', 'I = C \\cdot r \\cdot t'],
        ['C y r multiplican a t: pasan dividiendo', '\\dfrac{I}{C \\cdot r} = t'],
        ['Solución', 't = \\dfrac{I}{C \\cdot r}']
      ],
      calc: function (d) { if (d[1] * d[2] === 0) throw Error('Ni el capital C ni el rédito r pueden valer 0.'); return d[0] / (d[1] * d[2]); }
    },
    {
      txt: 'C = f + v·q (coste total) → despejar la cantidad q',
      ec: 'C = f + v \\cdot q', obj: 'q',
      datos: [['C', '2100'], ['f', '1200'], ['v', '18']],
      pasos: [
        ['Fórmula de partida', 'C = f + v \\cdot q'],
        ['Resto el coste fijo f', 'C - f = v \\cdot q'],
        ['Divido entre el coste variable unitario v', 'q = \\dfrac{C - f}{v}']
      ],
      calc: function (d) { if (d[2] === 0) throw Error('El coste variable unitario v no puede ser 0.'); return (d[0] - d[1]) / d[2]; }
    },
    {
      txt: 'e = e₀ + v·t (movimiento uniforme) → despejar t',
      ec: 'e = e_0 + v \\cdot t', obj: 't',
      datos: [['e', '250'], ['e_0', '40'], ['v', '70']],
      pasos: [
        ['Fórmula de partida', 'e = e_0 + v \\cdot t'],
        ['Resto la posición inicial', 'e - e_0 = v \\cdot t'],
        ['Divido entre la velocidad', 't = \\dfrac{e - e_0}{v}']
      ],
      calc: function (d) { if (d[2] === 0) throw Error('Con velocidad 0 el móvil no avanza: el tiempo no se puede despejar.'); return (d[0] - d[1]) / d[2]; }
    },
    {
      txt: 'A = (B+b)·h/2 (área del trapecio) → despejar la base mayor B',
      ec: 'A = \\dfrac{(B + b)\\,h}{2}', obj: 'B',
      datos: [['A', '48'], ['b', '5'], ['h', '6']],
      pasos: [
        ['Fórmula de partida', 'A = \\dfrac{(B + b)\\,h}{2}'],
        ['Multiplico los dos miembros por 2', '2A = (B + b)\\,h'],
        ['Divido entre h', '\\dfrac{2A}{h} = B + b'],
        ['Resto b', 'B = \\dfrac{2A}{h} - b']
      ],
      calc: function (d) { if (d[2] === 0) throw Error('La altura h no puede valer 0.'); return 2 * d[0] / d[2] - d[1]; }
    },
    {
      txt: 'V = πr²h (volumen del cilindro) → despejar la altura h',
      ec: 'V = \\pi r^{2} h', obj: 'h',
      datos: [['V', '500'], ['r', '4']],
      pasos: [
        ['Fórmula de partida', 'V = \\pi r^{2} h'],
        ['Todo lo que multiplica a h pasa dividiendo', 'h = \\dfrac{V}{\\pi r^{2}}']
      ],
      calc: function (d) { if (d[1] === 0) throw Error('El radio r no puede valer 0.'); return d[0] / (Math.PI * d[1] * d[1]); }
    }
  ];

  R.despejaFormula = function (node) {
    S.shell(node, 'Despeja una letra de una fórmula',
      'Elige la fórmula y la letra que quieres despejar. Las casillas <code>Dato 1</code>, <code>Dato 2</code> y ' +
      '<code>Dato 3</code> recogen, en ese orden, los valores conocidos que aparecen listados en la salida; admiten ' +
      'decimales con coma (<code>0,03</code>) y fracciones (<code>9/5</code>). Despejar es aplicar las mismas dos reglas ' +
      'de siempre, pero con letras en lugar de números.',
      [
        {
          id: 'caso', label: 'Fórmula y letra', type: 'select', value: '0',
          options: DESPEJES.map(function (d, i) { return { value: String(i), label: d.txt }; })
        },
        { id: 'd1', label: 'Dato 1', type: 'text', value: '24', ancho: '6rem' },
        { id: 'd2', label: 'Dato 2', type: 'text', value: '6', ancho: '6rem' },
        { id: 'd3', label: 'Dato 3', type: 'text', value: '1', ancho: '6rem' },
        escenarios([
          { txt: 'área del rectángulo', set: { caso: '0', d1: '24', d2: '6', d3: '1' } },
          { txt: 'perímetro', set: { caso: '1', d1: '30', d2: '9', d3: '1' } },
          { txt: 'recta: despejar x', set: { caso: '2', d1: '7', d2: '2', d3: '1' } },
          { txt: 'temperatura corporal', set: { caso: '4', d1: '98,6', d2: '1', d3: '1' } },
          { txt: 'interés simple', set: { caso: '5', d1: '300', d2: '5000', d3: '0,03' } },
          { txt: 'coste total', set: { caso: '6', d1: '2100', d2: '1200', d3: '18' } },
          { txt: 'cilindro', set: { caso: '9', d1: '500', d2: '4', d3: '1' } }
        ])
      ],
      guarda(function (v) {
        var D = DESPEJES[Number(v.caso)] || DESPEJES[0];
        var brutos = [v.d1, v.d2, v.d3];
        var vals = D.datos.map(function (p, i) { return fv(fr(brutos[i], 'El dato ' + (i + 1))); });
        var h = S.expr('Fórmula', D.ec);
        h += S.kvs(D.datos.map(function (p, i) {
          return 'Dato ' + (i + 1) + ': ' + K(p[0] + ' = ' + kf(vals[i], 4));
        }).concat(['Incógnita: ' + K(D.obj)]));
        h += cad(D.pasos.map(function (p, i) {
          return fila(p[0], p[1], i === D.pasos.length - 1 ? 'eq-bien' : '');
        }));
        var res = D.calc(vals);
        if (!isFinite(res)) throw Error('Con esos datos el despeje no da un número: revisa que ningún divisor valga 0.');
        h += S.resultado(K(D.obj + ' = ' + kf(res, 4)), 'valor de la incógnita con los datos escritos');
        h += nota('Fíjate en que el procedimiento es exactamente el mismo que en una ecuación numérica: se aísla la letra buscada aplicando la regla de la suma y la regla del producto. La diferencia es que el resultado es una <b>fórmula</b>, válida para cualquier dato.');
        return h;
      }));
  };

  /* ==================================================================
     6 · problemaLineal
     ================================================================== */
  var PROBLEMAS = [
    {
      txt: 'Tres números consecutivos',
      pars: [['S', '84']],
      enun: function (p) {
        return 'La suma de tres números enteros consecutivos es <b>' + nc(fv(p[0]), 4) + '</b>. ¿Cuáles son esos números?';
      },
      trad: function () {
        return [['El primer número', 'x'], ['El siguiente', 'x + 1'], ['El tercero', 'x + 2'], ['Su suma vale S', 'x + (x+1) + (x+2) = S']];
      },
      ec: function (p) { return { a: FR(3), b: FR(3).menos(p[0]), tex: '3x + 3 = ' + ft(p[0]) }; },
      interp: function (x, p) {
        if (!x.esEntero()) return 'La solución no es entera, así que <b>no existen</b> tres enteros consecutivos con esa suma. El enunciado sería imposible.';
        return 'Los tres números son ' + K(ft(x)) + ', ' + K(ft(x.mas(FR(1)))) + ' y ' + K(ft(x.mas(FR(2)))) + '.';
      }
    },
    {
      txt: 'Edades: padre e hijo',
      pars: [['P', '45'], ['H', '15'], ['k', '2']],
      enun: function (p) {
        return 'Un padre tiene <b>' + nc(fv(p[0]), 4) + '</b> años y su hijo, <b>' + nc(fv(p[1]), 4) + '</b>. ' +
          '¿Dentro de cuántos años la edad del padre será <b>' + nc(fv(p[2]), 4) + '</b> veces la del hijo?';
      },
      trad: function () {
        return [['Los años que han de pasar', 'x'], ['Edad del padre dentro de x años', 'P + x'],
        ['Edad del hijo dentro de x años', 'H + x'], ['La condición del enunciado', 'P + x = k\\,(H + x)']];
      },
      ec: function (p) {
        var a = FR(1).menos(p[2]);
        var b = p[0].menos(p[2].por(p[1]));
        return { a: a, b: b, tex: ft(p[0]) + ' + x = ' + ft(p[2]) + '(' + ft(p[1]) + ' + x)' };
      },
      interp: function (x) {
        if (fv(x) < 0) return 'La solución es negativa: la situación descrita ocurrió hace ' + nc(-fv(x), 4) + ' años, no ocurrirá en el futuro.';
        return 'Han de pasar ' + K(ft(x)) + ' años.';
      }
    },
    {
      txt: 'Precio antes de la rebaja',
      pars: [['C', '68'], ['d', '15']],
      enun: function (p) {
        return 'Un artículo cuesta <b>' + nc(fv(p[0]), 4) + ' €</b> después de aplicarle un descuento del <b>' +
          nc(fv(p[1]), 4) + ' %</b>. ¿Cuál era su precio antes de la rebaja?';
      },
      trad: function () {
        return [['El precio original', 'x'], ['El descuento aplicado', '\\dfrac{d}{100}\\,x'],
        ['El precio final', 'x - \\dfrac{d}{100}\\,x'], ['La condición del enunciado', 'x\\left(1 - \\dfrac{d}{100}\\right) = C']];
      },
      ec: function (p) {
        var a = FR(1).menos(p[1].entre(FR(100)));
        return { a: a, b: p[0].opuesto(), tex: ft(a) + 'x = ' + ft(p[0]) };
      },
      interp: function (x, p) {
        return 'El precio original era ' + K(ft(x) + '\\;\\text{€}') + ' (aproximadamente ' + nc(fv(x), 2) + ' €). ' +
          'El descuento fue de ' + nc(fv(x) - fv(p[0]), 2) + ' €.';
      }
    },
    {
      txt: 'Dos móviles que se encuentran',
      pars: [['D', '300'], ['v_1', '90'], ['v_2', '110']],
      enun: function (p) {
        return 'Dos ciudades distan <b>' + nc(fv(p[0]), 4) + ' km</b>. De cada una sale un coche al mismo tiempo, uno hacia el otro, ' +
          'a <b>' + nc(fv(p[1]), 4) + ' km/h</b> y <b>' + nc(fv(p[2]), 4) + ' km/h</b>. ¿Cuánto tardan en encontrarse?';
      },
      trad: function () {
        return [['El tiempo hasta el encuentro', 't'], ['Camino del primer coche', 'v_1 t'],
        ['Camino del segundo coche', 'v_2 t'], ['Entre los dos recorren toda la distancia', 'v_1 t + v_2 t = D']];
      },
      ec: function (p) {
        var a = p[1].mas(p[2]);
        return { a: a, b: p[0].opuesto(), tex: '(' + ft(p[1]) + ' + ' + ft(p[2]) + ')\\,t = ' + ft(p[0]) };
      },
      interp: function (x, p) {
        var horas = fv(x);
        return 'Se encuentran a las ' + K(ft(x)) + ' horas, es decir, ' + nc(horas, 3) + ' h = ' +
          nc(Math.round(horas * 60), 0) + ' minutos. El primer coche habrá recorrido ' + nc(horas * fv(p[1]), 2) + ' km.';
      }
    },
    {
      txt: 'Mezcla de dos cafés',
      pars: [['M', '20'], ['p_1', '6'], ['p_2', '9'], ['p', '7']],
      enun: function (p) {
        return 'Se quieren mezclar <b>' + nc(fv(p[0]), 4) + ' kg</b> de café de <b>' + nc(fv(p[1]), 4) + ' €/kg</b> con cierta ' +
          'cantidad de otro de <b>' + nc(fv(p[2]), 4) + ' €/kg</b> para que la mezcla salga a <b>' + nc(fv(p[3]), 4) + ' €/kg</b>. ' +
          '¿Cuántos kilos del segundo hay que echar?';
      },
      trad: function () {
        return [['Kilos del segundo café', 'x'], ['Coste del primero', 'M \\cdot p_1'],
        ['Coste del segundo', 'x \\cdot p_2'], ['Coste de la mezcla', '(M + x)\\,p'],
        ['La condición del enunciado', 'M p_1 + x p_2 = (M + x)\\,p']];
      },
      ec: function (p) {
        var a = p[2].menos(p[3]);
        var b = p[0].por(p[1].menos(p[3]));
        return { a: a, b: b, tex: ft(p[0]) + '\\cdot' + ft(p[1]) + ' + ' + ft(p[2]) + 'x = (' + ft(p[0]) + ' + x)\\cdot' + ft(p[3]) };
      },
      interp: function (x, p) {
        if (fv(x) < 0) return 'La solución es negativa: con esos precios es imposible obtener ese precio medio, porque queda fuera del intervalo entre los dos precios.';
        return 'Hay que añadir ' + K(ft(x) + '\\;\\text{kg}') + ' del segundo café. La mezcla pesará ' +
          nc(fv(p[0]) + fv(x), 3) + ' kg.';
      }
    },
    {
      txt: 'Reparto de una cantidad',
      pars: [['R', '1000'], ['d', '200']],
      enun: function (p) {
        return 'Se reparten <b>' + nc(fv(p[0]), 4) + ' €</b> entre tres personas: la segunda recibe <b>' + nc(fv(p[1]), 4) +
          ' €</b> más que la primera, y la tercera, el doble que la primera. ¿Cuánto recibe cada una?';
      },
      trad: function () {
        return [['Lo que recibe la primera', 'x'], ['Lo que recibe la segunda', 'x + d'],
        ['Lo que recibe la tercera', '2x'], ['El total repartido', 'x + (x + d) + 2x = R']];
      },
      ec: function (p) { return { a: FR(4), b: p[1].menos(p[0]), tex: '4x + ' + ft(p[1]) + ' = ' + ft(p[0]) }; },
      interp: function (x, p) {
        return 'Reciben ' + K(ft(x)) + ' €, ' + K(ft(x.mas(p[1]))) + ' € y ' + K(ft(x.por(FR(2)))) + ' € respectivamente.';
      }
    }
  ];

  R.problemaLineal = function (node) {
    S.shell(node, 'Del enunciado a la ecuación',
      'Elige un problema y cambia sus datos en las casillas <code>Dato 1</code> … <code>Dato 4</code>, que corresponden en ' +
      'ese orden a las letras que aparecen listadas en la salida (admiten <code>0,5</code> y <code>3/4</code>). ' +
      'El applet reescribe el enunciado, traduce cada frase al lenguaje algebraico, plantea la ecuación, la resuelve y ' +
      'discute si la solución tiene sentido en el contexto.',
      [
        {
          id: 'prob', label: 'Problema', type: 'select', value: '0',
          options: PROBLEMAS.map(function (p, i) { return { value: String(i), label: p.txt }; })
        },
        { id: 'p1', label: 'Dato 1', type: 'text', value: '84', ancho: '6rem' },
        { id: 'p2', label: 'Dato 2', type: 'text', value: '1', ancho: '6rem' },
        { id: 'p3', label: 'Dato 3', type: 'text', value: '1', ancho: '6rem' },
        { id: 'p4', label: 'Dato 4', type: 'text', value: '1', ancho: '6rem' },
        escenarios([
          { txt: 'consecutivos que suman 84', set: { prob: '0', p1: '84', p2: '1', p3: '1', p4: '1' } },
          { txt: 'consecutivos que suman 100', set: { prob: '0', p1: '100', p2: '1', p3: '1', p4: '1' } },
          { txt: 'edades 45 y 15, doble', set: { prob: '1', p1: '45', p2: '15', p3: '2', p4: '1' } },
          { txt: 'rebaja del 15 %', set: { prob: '2', p1: '68', p2: '15', p3: '1', p4: '1' } },
          { txt: 'encuentro de dos coches', set: { prob: '3', p1: '300', p2: '90', p3: '110', p4: '1' } },
          { txt: 'mezcla de cafés', set: { prob: '4', p1: '20', p2: '6', p3: '9', p4: '7' } },
          { txt: 'reparto de 1000 €', set: { prob: '5', p1: '1000', p2: '200', p3: '1', p4: '1' } }
        ])
      ],
      guarda(function (v) {
        var P = PROBLEMAS[Number(v.prob)] || PROBLEMAS[0];
        var brutos = [v.p1, v.p2, v.p3, v.p4];
        var pars = P.pars.map(function (p, i) { return fr(brutos[i], 'El dato ' + (i + 1)); });
        var h = enun(P.enun(pars));
        h += S.kvs(P.pars.map(function (p, i) { return 'Dato ' + (i + 1) + ': ' + K(p[0] + ' = ' + ft(pars[i])); }));
        h += S.tabla(['En palabras', 'En lenguaje algebraico'],
          P.trad(pars).map(function (t) { return [t[0], K(t[1])]; }));
        var E = P.ec(pars);
        h += S.expr('Ecuación planteada', E.tex);
        var pol = S.pDe([E.b, E.a]);
        var L = S.solLineal(E.a, E.b);
        if (L.tipo !== 'unica') {
          h += S.expr('Al reducir queda', T(pol) + ' = 0');
          h += S.badge(L.tipo === 'identidad' ? 'con estos datos la ecuación es una identidad' : 'con estos datos el problema no tiene solución', L.tipo === 'identidad' ? 'info' : 'no');
          h += nota('Cambia los datos: has elegido una combinación en la que el coeficiente de la incógnita se anula. Es un aviso valioso, porque un problema mal planteado se detecta justo así.');
          return h;
        }
        h += cad([
          fila('Reduzco todo al primer miembro', T(pol) + ' = 0', 'eq-clave'),
          fila('Agrupo', ft(E.a) + 'x = ' + ft(E.b.opuesto())),
          fila('Despejo', 'x = ' + ft(L.x), 'eq-bien')
        ]);
        h += S.resultado(K('x = ' + ft(L.x) + (L.x.esEntero() ? '' : ' \\approx ' + kf(fv(L.x), 3))), 'solución de la ecuación');
        h += '<h5 class="ap-card-tit">Respuesta al problema</h5>' + enun(P.interp(L.x, pars));
        h += nota('Resolver la ecuación no es el final: hay que <b>volver al enunciado</b> y comprobar que la solución tiene sentido (que no sea negativa cuando representa una cantidad, que sea entera cuando cuenta objetos, que las unidades cuadren).');
        return h;
      }));
  };

  /* ==================================================================
     7 · incompletas
     ================================================================== */
  R.incompletas = function (node) {
    S.shell(node, 'Ecuaciones de segundo grado incompletas',
      'Escribe los tres coeficientes de <code>ax² + bx + c = 0</code>. Admiten enteros (<code>-3</code>), decimales ' +
      '(<code>0,5</code>) y fracciones (<code>3/4</code>). Si <code>b = 0</code> o <code>c = 0</code> el applet usa el ' +
      'método rápido correspondiente; si la ecuación es completa te lo dice y aplica la fórmula general.',
      [
        { id: 'a', label: 'a', type: 'text', value: '1', ancho: '5rem' },
        { id: 'b', label: 'b', type: 'text', value: '0', ancho: '5rem' },
        { id: 'c', label: 'c', type: 'text', value: '-9', ancho: '5rem' },
        escenarios([
          { txt: 'x² − 9 = 0', set: { a: '1', b: '0', c: '-9' } },
          { txt: '2x² − 8 = 0', set: { a: '2', b: '0', c: '-8' } },
          { txt: 'x² + 4 = 0 (sin solución)', set: { a: '1', b: '0', c: '4' } },
          { txt: '3x² − 12x = 0', set: { a: '3', b: '-12', c: '0' } },
          { txt: '5x² = 0', set: { a: '5', b: '0', c: '0' } },
          { txt: 'x² − 2 = 0 (irracional)', set: { a: '1', b: '0', c: '-2' } },
          { txt: 'completa: x² − 5x + 6 = 0', set: { a: '1', b: '-5', c: '6' } }
        ])
      ],
      guarda(function (v) {
        var a = fr(v.a, 'El coeficiente a'), b = fr(v.b, 'El coeficiente b'), c = fr(v.c, 'El coeficiente c');
        if (esCero(a)) throw Error('Si a = 0 la ecuación no es de segundo grado, sino de primer grado. Escribe un valor de a distinto de 0.');
        var pol = S.pDe([c, b, a]);
        var Q = S.solCuadratica(a, b, c);
        var h = S.expr('Ecuación', T(pol) + ' = 0');
        var filas = [];
        if (esCero(b) && esCero(c)) {
          h += S.badge('incompleta con b = 0 y c = 0', 'info');
          filas = [
            fila('Divido entre a', 'x^{2} = 0', 'eq-clave'),
            fila('El único número cuyo cuadrado es 0 es el 0', 'x = 0', 'eq-bien')
          ];
          h += cad(filas);
          h += S.expr('Solución (doble)', 'x_1 = x_2 = 0');
        } else if (esCero(b)) {
          h += S.badge('incompleta sin término en x', 'info');
          var r = c.opuesto().entre(a);
          filas = [
            fila('Aíslo el cuadrado', ft(a) + 'x^{2} = ' + ft(c.opuesto()), 'eq-clave'),
            fila('Divido entre a', 'x^{2} = ' + ft(r))
          ];
          if (fv(r) > 0) {
            var rz = raizNTex(new S.Irr(Number(r.n), 0, 1, Number(r.d)), 2);
            filas.push(fila('Raíz cuadrada en los dos miembros, con los dos signos', 'x = \\pm ' + rz.tex, 'eq-bien'));
            h += cad(filas);
            h += S.expr('Soluciones', 'x_1 = -' + rz.tex + ', \\quad x_2 = ' + rz.tex);
          } else if (fv(r) === 0) {
            filas.push(fila('Único cuadrado nulo', 'x = 0', 'eq-bien'));
            h += cad(filas);
            h += S.expr('Solución (doble)', 'x_1 = x_2 = 0');
          } else {
            filas.push(fila('Ningún número real tiene cuadrado negativo', '\\varnothing', 'eq-mal'));
            h += cad(filas);
            h += S.expr('Conjunto solución', '\\varnothing');
          }
        } else if (esCero(c)) {
          h += S.badge('incompleta sin término independiente', 'info');
          var raiz2 = b.opuesto().entre(a);
          filas = [
            fila('Saco factor común x', 'x\\left(' + ft(a) + 'x + ' + ft(b) + '\\right) = 0', 'eq-clave'),
            fila('Un producto es 0 si lo es alguno de sus factores', 'x = 0 \\quad\\text{o}\\quad ' + ft(a) + 'x + ' + ft(b) + ' = 0'),
            fila('Resuelvo el segundo factor', 'x = ' + ft(raiz2), 'eq-bien')
          ];
          h += cad(filas);
          h += S.expr('Soluciones', 'x_1 = 0, \\quad x_2 = ' + ft(raiz2));
          h += nota('Una ecuación con <b>c = 0</b> siempre tiene al 0 por solución: el término independiente es justamente el valor de la expresión en ' + K('x = 0') + '. Nunca dividas los dos miembros entre x: perderías esa solución.');
        } else {
          h += S.badge('ecuación completa: aquí no hay atajo', 'info');
          h += nota('Los tres coeficientes son distintos de cero, así que ni se puede aislar el cuadrado ni sacar factor común x. Hay que usar la fórmula general.');
          h += cad([
            fila('Fórmula general', 'x = \\dfrac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}', 'eq-clave'),
            fila('Sustituyo', 'x = \\dfrac{' + ft(b.opuesto()) + ' \\pm \\sqrt{' + ft(b.por(b).menos(FR(4).por(a).por(c))) + '}}{' + ft(FR(2).por(a)) + '}'),
            fila('Soluciones', S.raicesTex(Q), Q.tipo === 'ninguna' ? 'eq-mal' : 'eq-bien')
          ]);
        }
        var av = fv(a), bv = fv(b), cv = fv(c);
        var f = function (x) { return av * x * x + bv * x + cv; };
        var xs = Q.raices.map(function (r) { return r.val(); });
        xs.push(-bv / (2 * av));
        var W = ventana(xs, f, { ys: [cv - bv * bv / (4 * av)] });
        h += S.ejes({
          xmin: W.xmin, xmax: W.xmax, ymin: W.ymin, ymax: W.ymax, W: 1000, H: 540,
          curvas: [{ f: f, col: COL.azul, label: 'y = ' + T(pol), lx: 680, ly: 74 }],
          puntos: Q.raices.map(function (r, i) {
            return { x: r.val(), y: 0, col: COL.rojo, tex: 'x_' + (i + 1) + ' = ' + r.tex() };
          }),
          cap: 'Las soluciones son los puntos en los que la parábola corta al eje OX.'
        });
        return h;
      }));
  };

  /* ==================================================================
     8 · completarCuadrado
     ================================================================== */
  R.completarCuadrado = function (node) {
    S.shell(node, 'Completar cuadrados: de dónde sale la fórmula general',
      'Escribe los coeficientes de <code>ax² + bx + c = 0</code> (valen <code>-3</code>, <code>0,5</code> o <code>3/4</code>) ' +
      'y sigue las mismas transformaciones que llevan, con letras, a la fórmula general. Marca la casilla para ver la ' +
      'demostración simbólica completa al lado del caso numérico.',
      [
        { id: 'a', label: 'a', type: 'text', value: '1', ancho: '5rem' },
        { id: 'b', label: 'b', type: 'text', value: '-6', ancho: '5rem' },
        { id: 'c', label: 'c', type: 'text', value: '5', ancho: '5rem' },
        { id: 'gen', label: 'Ver la demostración con letras', type: 'check', value: true },
        escenarios([
          { txt: 'x² − 6x + 5 = 0', set: { a: '1', b: '-6', c: '5' } },
          { txt: 'x² + 4x + 1 = 0', set: { a: '1', b: '4', c: '1' } },
          { txt: '2x² − 8x + 6 = 0', set: { a: '2', b: '-8', c: '6' } },
          { txt: 'x² − 4x + 4 = 0 (doble)', set: { a: '1', b: '-4', c: '4' } },
          { txt: 'x² + 2x + 5 = 0 (sin solución)', set: { a: '1', b: '2', c: '5' } },
          { txt: '3x² + 5x − 2 = 0', set: { a: '3', b: '5', c: '-2' } }
        ])
      ],
      guarda(function (v) {
        var a = fr(v.a, 'El coeficiente a'), b = fr(v.b, 'El coeficiente b'), c = fr(v.c, 'El coeficiente c');
        if (esCero(a)) throw Error('Si a = 0 no hay término de segundo grado y no se puede completar ningún cuadrado.');
        var pol = S.pDe([c, b, a]);
        var Bc = b.entre(a), Cc = c.entre(a);
        var h2 = Bc.entre(FR(2));                    /* b / (2a) */
        var k = h2.por(h2).menos(Cc);                /* (b/2a)² − c/a = Δ/(4a²) */
        var Q = S.solCuadratica(a, b, c);
        var h = S.expr('Ecuación', T(pol) + ' = 0');
        var filas = [
          fila('Divido todo entre a para que el cuadrado quede solo', 'x^{2} + ' + ft(Bc) + 'x + ' + ft(Cc) + ' = 0', 'eq-clave'),
          fila('Paso el término independiente al otro miembro', 'x^{2} + ' + ft(Bc) + 'x = ' + ft(Cc.opuesto())),
          fila('Sumo a los dos miembros el cuadrado de la mitad del coeficiente de x', 'x^{2} + ' + ft(Bc) + 'x + ' + ft(h2.por(h2)) + ' = ' + ft(Cc.opuesto()) + ' + ' + ft(h2.por(h2))),
          fila('El primer miembro ya es un cuadrado perfecto', '\\left(x + ' + ft(h2) + '\\right)^{2} = ' + ft(k), 'eq-clave')
        ];
        if (fv(k) > 0) {
          var rz = raizNTex(new S.Irr(Number(k.n), 0, 1, Number(k.d)), 2);
          filas.push(fila('Raíz cuadrada con los dos signos', 'x + ' + ft(h2) + ' = \\pm ' + rz.tex));
          filas.push(fila('Despejo la x', 'x = ' + ft(h2.opuesto()) + ' \\pm ' + rz.tex, 'eq-bien'));
        } else if (fv(k) === 0) {
          filas.push(fila('El cuadrado vale 0: una sola posibilidad', 'x + ' + ft(h2) + ' = 0'));
          filas.push(fila('Solución doble', 'x = ' + ft(h2.opuesto()), 'eq-bien'));
        } else {
          filas.push(fila('Ningún cuadrado real es negativo', '\\varnothing', 'eq-mal'));
        }
        h += cad(filas);
        h += S.expr('Soluciones', Q.tipo === 'ninguna' ? '\\varnothing' : S.raicesTex(Q));
        h += S.expr('Forma canónica de la parábola', 'y = ' + ft(a) + '\\left(x + ' + ft(h2) + '\\right)^{2} + ' + ft(a.por(k).opuesto()));
        h += nota('El número que has sumado a los dos miembros es el cuadrado de la mitad del coeficiente de ' + K('x') +
          '. Ese es todo el truco de «completar el cuadrado», y de ahí sale también la forma canónica, que enseña el vértice a simple vista.');
        if (v.gen === true || v.gen === 'true') {
          h += '<h5 class="ap-card-tit">La misma cadena, con letras</h5>';
          h += cad([
            fila('Ecuación general', 'ax^{2} + bx + c = 0 \\quad (a \\neq 0)', 'eq-clave'),
            fila('Multiplico los dos miembros por 4a', '4a^{2}x^{2} + 4abx + 4ac = 0'),
            fila('Paso el término independiente', '4a^{2}x^{2} + 4abx = -4ac'),
            fila('Sumo b² a los dos miembros', '4a^{2}x^{2} + 4abx + b^{2} = b^{2} - 4ac'),
            fila('El primer miembro es un cuadrado perfecto', '\\left(2ax + b\\right)^{2} = b^{2} - 4ac', 'eq-clave'),
            fila('Raíz cuadrada con los dos signos', '2ax + b = \\pm\\sqrt{b^{2} - 4ac}'),
            fila('Despejo la x', 'x = \\dfrac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}', 'eq-bien')
          ]);
          h += nota('Multiplicar por ' + K('4a') + ' en lugar de dividir entre ' + K('a') +
            ' evita las fracciones durante toda la deducción: es la versión clásica, la que conviene saber reproducir en un examen.');
        }
        return h;
      }));
  };

  /* ==================================================================
     9 · discriminante
     ================================================================== */
  R.discriminante = function (node) {
    S.shell(node, 'El discriminante y el número de soluciones',
      'Escribe los coeficientes de <code>ax² + bx + c = 0</code> (por ejemplo <code>1</code>, <code>-5</code>, <code>6</code>). ' +
      'El applet calcula ' + '<code>Δ = b² − 4ac</code>' + ', enciende el caso al que corresponde, da las soluciones exactas y ' +
      'dibuja la parábola para que veas los cortes con el eje OX.',
      [
        { id: 'a', label: 'a', type: 'text', value: '1', ancho: '5rem' },
        { id: 'b', label: 'b', type: 'text', value: '-5', ancho: '5rem' },
        { id: 'c', label: 'c', type: 'text', value: '6', ancho: '5rem' },
        escenarios([
          { txt: 'x² − 5x + 6 = 0', set: { a: '1', b: '-5', c: '6' } },
          { txt: 'x² − 4x + 4 = 0', set: { a: '1', b: '-4', c: '4' } },
          { txt: 'x² + x + 1 = 0', set: { a: '1', b: '1', c: '1' } },
          { txt: 'x² − 2x − 1 = 0', set: { a: '1', b: '-2', c: '-1' } },
          { txt: '−x² + 4x − 3 = 0', set: { a: '-1', b: '4', c: '-3' } },
          { txt: '6x² − 5x + 1 = 0', set: { a: '6', b: '-5', c: '1' } },
          { txt: '0,5x² − x − 1,5 = 0', set: { a: '0,5', b: '-1', c: '-1,5' } }
        ])
      ],
      guarda(function (v) {
        var a = fr(v.a, 'El coeficiente a'), b = fr(v.b, 'El coeficiente b'), c = fr(v.c, 'El coeficiente c');
        if (esCero(a)) throw Error('Con a = 0 no hay parábola ni discriminante: la ecuación pasa a ser de primer grado.');
        var pol = S.pDe([c, b, a]);
        var disc = b.por(b).menos(FR(4).por(a).por(c));
        var dv = fv(disc);
        var Q = S.solCuadratica(a, b, c);
        var estado = dv > 0 ? 'dos' : (dv === 0 ? 'doble' : 'ninguna');
        var h = S.expr('Ecuación', T(pol) + ' = 0');
        h += cad([
          fila('Discriminante', '\\Delta = b^{2} - 4ac = (' + ft(b) + ')^{2} - 4\\cdot(' + ft(a) + ')\\cdot(' + ft(c) + ') = ' + ft(disc), 'eq-clave')
        ]);
        h += cajasDisc(estado);
        if (estado !== 'ninguna') {
          h += cad([
            fila('Fórmula general', 'x = \\dfrac{' + ft(b.opuesto()) + ' \\pm \\sqrt{' + ft(disc) + '}}{' + ft(FR(2).por(a)) + '}'),
            fila('Soluciones exactas', S.raicesTex(Q), 'eq-bien')
          ]);
          h += S.kvs(Q.raices.map(function (r, i) {
            return 'x_' + (i + 1) + ' ' + (r.esRacional() ? '=' : '\\approx') + ' ' + nc(r.val(), 4);
          }).map(function (t) { return K(t); }));
        } else {
          h += S.expr('Conjunto solución', '\\varnothing');
          h += nota('El discriminante es negativo, así que la fórmula pediría la raíz cuadrada de un número negativo. En el conjunto de los números reales esa raíz no existe: la ecuación no tiene ninguna solución real.');
        }
        var av = fv(a), bv = fv(b), cv = fv(c);
        var f = function (x) { return av * x * x + bv * x + cv; };
        var xv = -bv / (2 * av), yv = f(xv);
        var W = ventana(Q.raices.map(function (r) { return r.val(); }).concat([xv]), f, { ys: [yv] });
        h += S.ejes({
          xmin: W.xmin, xmax: W.xmax, ymin: W.ymin, ymax: W.ymax, W: 1000, H: 540,
          curvas: [{ f: f, col: COL.azul, label: 'y = ' + T(pol), lx: 680, ly: 74 }],
          puntos: Q.raices.map(function (r) { return { x: r.val(), y: 0, col: COL.rojo, tex: 'x = ' + kf(r.val(), 3) }; })
            .concat([{ x: xv, y: yv, col: COL.verde, tex: 'V' }]),
          cap: 'En verde, el vértice ' + K('V\\left(' + kf(xv, 3) + ',\\, ' + kf(yv, 3) + '\\right)') +
            '. El signo de ' + K('\\Delta') + ' decide cuántas veces corta la parábola al eje OX; el signo de ' +
            K('a') + ' decide hacia dónde abre.'
        });
        return h;
      }));
  };

  /* ==================================================================
     10 · parabolaABC
     ================================================================== */
  R.parabolaABC = function (node) {
    S.shell(node, 'Los coeficientes a, b y c en la parábola',
      'Mueve los tres deslizadores y observa qué cambia en la gráfica de <code>y = ax² + bx + c</code>: ' +
      '<code>a</code> abre o cierra la parábola y decide si mira hacia arriba o hacia abajo, <code>c</code> es la altura del ' +
      'corte con el eje OY, y <code>b</code> desplaza el vértice en diagonal. Marca la casilla para ver también la tabla de ' +
      'elementos característicos.',
      [
        { id: 'a', label: 'a', type: 'range', min: -3, max: 3, step: 0.5, value: 1 },
        { id: 'b', label: 'b', type: 'range', min: -8, max: 8, step: 0.5, value: -2 },
        { id: 'c', label: 'c', type: 'range', min: -8, max: 8, step: 0.5, value: -3 },
        { id: 'tab', label: 'Ver la tabla de elementos', type: 'check', value: true },
        escenarios([
          { txt: 'x² − 2x − 3', set: { a: 1, b: -2, c: -3 } },
          { txt: 'parábola hacia abajo', set: { a: -1, b: 2, c: 3 } },
          { txt: 'muy estrecha', set: { a: 3, b: 0, c: -4 } },
          { txt: 'muy abierta', set: { a: 0.5, b: 0, c: -4 } },
          { txt: 'tangente al eje OX', set: { a: 1, b: -4, c: 4 } },
          { txt: 'sin cortes con OX', set: { a: 1, b: 1, c: 3 } },
          { txt: 'a = 0: deja de ser parábola', set: { a: 0, b: 2, c: -3 } }
        ])
      ],
      guarda(function (v) {
        var a = fr(v.a, 'El coeficiente a'), b = fr(v.b, 'El coeficiente b'), c = fr(v.c, 'El coeficiente c');
        var pol = S.pDe([c, b, a]);
        var av = fv(a), bv = fv(b), cv = fv(c);
        var f = function (x) { return av * x * x + bv * x + cv; };
        var h = S.expr('Función', 'y = ' + T(pol));
        if (esCero(a)) {
          h += S.badge('con a = 0 la gráfica es una recta, no una parábola', 'no');
          var W0 = ventana(bv !== 0 ? [-cv / bv] : [0], f);
          h += S.ejes({
            xmin: W0.xmin, xmax: W0.xmax, ymin: W0.ymin, ymax: W0.ymax, W: 1000, H: 540,
            curvas: [{ f: f, col: COL.naranja, label: 'y = ' + T(pol), lx: 690, ly: 78 }],
            cap: 'Sin término de segundo grado la curva se convierte en una recta: por eso la definición de ecuación de segundo grado exige ' + K('a \\neq 0') + '.'
          });
          return h;
        }
        var Q = S.solCuadratica(a, b, c);
        var xvF = b.opuesto().entre(FR(2).por(a));
        var yvF = c.menos(b.por(b).entre(FR(4).por(a)));
        var disc = b.por(b).menos(FR(4).por(a).por(c));
        var xv = fv(xvF), yv = fv(yvF);
        var W = ventana(Q.raices.map(function (r) { return r.val(); }).concat([xv]), f, { ys: [yv, cv] });
        h += S.ejes({
          xmin: W.xmin, xmax: W.xmax, ymin: W.ymin, ymax: W.ymax, W: 1000, H: 540,
          curvas: [{ f: f, col: COL.azul, label: 'y = ' + T(pol), lx: 680, ly: 74 }],
          puntos: Q.raices.map(function (r) { return { x: r.val(), y: 0, col: COL.rojo, tex: kf(r.val(), 2) }; })
            .concat([{ x: xv, y: yv, col: COL.verde, tex: 'V' }, { x: 0, y: cv, col: COL.morado, tex: '(0,\\, ' + kf(cv, 2) + ')' }]),
          cap: 'Rojo: cortes con el eje OX (las soluciones de la ecuación). Verde: vértice. Morado: corte con el eje OY, siempre a la altura ' + K('c') + '.'
        });
        if (v.tab === true || v.tab === 'true') {
          h += S.tabla(['Elemento', 'Valor'], [
            ['Abre hacia', av > 0 ? 'arriba (a > 0): el vértice es un mínimo' : 'abajo (a < 0): el vértice es un máximo'],
            ['Discriminante', K('\\Delta = ' + ft(disc)) + ' ' + (fv(disc) > 0 ? S.badge('dos cortes', 'si') : fv(disc) === 0 ? S.badge('tangente', 'info') : S.badge('sin cortes', 'no'))],
            ['Vértice', K('V\\left(' + ft(xvF) + ',\\; ' + ft(yvF) + '\\right)')],
            ['Eje de simetría', K('x = ' + ft(xvF))],
            ['Corte con OY', K('(0,\\; ' + ft(c) + ')')],
            ['Cortes con OX', Q.tipo === 'ninguna' ? K('\\varnothing') : K(S.raicesTex(Q))]
          ]);
        }
        h += nota('Comprueba una propiedad importante: el eje de simetría ' + K('x = -\\dfrac{b}{2a}') +
          ' pasa siempre por el punto medio de los dos cortes con el eje OX. Por eso, si conoces una raíz y el vértice, la otra raíz sale sin resolver nada.');
        return h;
      }));
  };

  /* ==================================================================
     11 · vieta
     ================================================================== */
  R.vieta = function (node) {
    S.shell(node, 'Suma y producto de las raíces (Cardano-Vieta)',
      'Elige tú las dos raíces con los deslizadores y el coeficiente principal <code>a</code>. El applet construye la ' +
      'ecuación que las tiene por soluciones, primero como <code>x² − Sx + P = 0</code> y después en su forma factorizada ' +
      '<code>a(x − x₁)(x − x₂) = 0</code>, y comprueba que al resolverla se recuperan las raíces de partida.',
      [
        { id: 'x1', label: 'Primera raíz x₁', type: 'range', min: -6, max: 6, step: 0.5, value: 2 },
        { id: 'x2', label: 'Segunda raíz x₂', type: 'range', min: -6, max: 6, step: 0.5, value: 3 },
        { id: 'a', label: 'Coeficiente principal a', type: 'range', min: -3, max: 3, step: 1, value: 1 },
        escenarios([
          { txt: 'raíces 2 y 3', set: { x1: 2, x2: 3, a: 1 } },
          { txt: 'raíces −1 y 4', set: { x1: -1, x2: 4, a: 1 } },
          { txt: 'raíz doble en 2', set: { x1: 2, x2: 2, a: 1 } },
          { txt: 'raíces 0,5 y −3', set: { x1: 0.5, x2: -3, a: 1 } },
          { txt: 'con a = 2', set: { x1: 1, x2: -3, a: 2 } },
          { txt: 'con a = −1', set: { x1: -2, x2: 5, a: -1 } },
          { txt: 'raíces opuestas', set: { x1: -3, x2: 3, a: 1 } }
        ])
      ],
      guarda(function (v) {
        var r1 = fr(v.x1, 'La raíz x₁'), r2 = fr(v.x2, 'La raíz x₂'), a = fr(v.a, 'El coeficiente a');
        if (esCero(a)) throw Error('Con a = 0 la expresión deja de ser de segundo grado: elige un coeficiente principal distinto de cero.');
        var Su = r1.mas(r2), Pr = r1.por(r2);
        var mon = S.pDe([Pr, Su.opuesto(), FR(1)]);          /* x² − Sx + P */
        var pol = S.pEscala(mon, a);                          /* a(x² − Sx + P) */
        var b = pol[1], c = pol[0];

        var h = S.expr('Raíces elegidas',
          'x_1 = ' + ft(r1) + ', \\qquad x_2 = ' + ft(r2));
        h += cad([
          fila('Suma', 'S = x_1 + x_2 = ' + ft(r1) + ' + \\left(' + ft(r2) + '\\right) = ' + ft(Su)),
          fila('Producto', 'P = x_1 \\cdot x_2 = ' + ft(r1) + ' \\cdot \\left(' + ft(r2) + '\\right) = ' + ft(Pr)),
          fila('Ecuación mónica', 'x^{2} - Sx + P = 0 \\;\\Longrightarrow\\; ' + T(mon) + ' = 0', 'eq-clave'),
          fila('Multiplicando por a', T(pol) + ' = 0', 'eq-bien')
        ]);

        h += rejilla([
          tarjeta('Forma factorizada',
            KD(ft(a) + '\\left(x - \\left(' + ft(r1) + '\\right)\\right)\\left(x - \\left(' + ft(r2) + '\\right)\\right) = 0') +
            nota('Un producto vale cero cuando se anula alguno de sus factores, y por eso las soluciones se leen directamente en los paréntesis.')),
          tarjeta('Forma desarrollada',
            KD(T(pol) + ' = 0') +
            nota('Aquí las raíces están escondidas: hay que resolver la ecuación para verlas.'))
        ]);

        /* comprobación: desarrollamos el producto de factores */
        var f1 = S.pDe([r1.opuesto(), FR(1)]), f2 = S.pDe([r2.opuesto(), FR(1)]);
        var desarrollo = S.pEscala(S.pMult(f1, f2), a);
        var coincide = S.pEsCero(S.pResta(desarrollo, pol));
        h += S.expr('Desarrollo del producto',
          ft(a) + '\\left(x - \\left(' + ft(r1) + '\\right)\\right)\\left(x - \\left(' + ft(r2) + '\\right)\\right) = ' + T(desarrollo));
        h += (coincide
          ? S.badge('el desarrollo coincide con la ecuación construida', 'si')
          : S.badge('el desarrollo no coincide', 'no'));

        var Q = S.solCuadratica(pol[2], b, c);
        h += cad([
          fila('Coeficientes', 'a = ' + ft(pol[2]) + ',\\quad b = ' + ft(b) + ',\\quad c = ' + ft(c)),
          fila('Comprobación de Vieta', '-\\dfrac{b}{a} = ' + ft(b.opuesto().entre(pol[2])) +
            ' = S, \\qquad \\dfrac{c}{a} = ' + ft(c.entre(pol[2])) + ' = P', 'eq-clave'),
          fila('Resolviendo', S.raicesTex(Q), 'eq-bien')
        ]);

        h += S.tabla(['Magnitud', 'Valor exacto', 'Regla'], [
          ['Suma de las raíces', K(ft(Su)), K('S = -\\dfrac{b}{a}')],
          ['Producto de las raíces', K(ft(Pr)), K('P = \\dfrac{c}{a}')],
          ['Ecuación mónica asociada', K(T(mon) + ' = 0'), K('x^{2} - Sx + P = 0')],
          ['Factorización', K(ft(a) + '(x - (' + ft(r1) + '))(x - (' + ft(r2) + '))'), K('a(x - x_1)(x - x_2)')]
        ]);

        var av = fv(pol[2]), bv = fv(b), cv = fv(c);
        var f = function (x) { return av * x * x + bv * x + cv; };
        var xv = -bv / (2 * av), yv = f(xv);
        var W = ventana([fv(r1), fv(r2), xv], f, { ys: [yv] });
        h += S.ejes({
          xmin: W.xmin, xmax: W.xmax, ymin: W.ymin, ymax: W.ymax, W: 1000, H: 540,
          curvas: [{ f: f, col: COL.azul, label: 'y = ' + T(pol), lx: 660, ly: 74 }],
          puntos: [
            { x: fv(r1), y: 0, col: COL.rojo, tex: 'x_1 = ' + ft(r1) },
            { x: fv(r2), y: 0, col: COL.rojo, tex: 'x_2 = ' + ft(r2) },
            { x: xv, y: yv, col: COL.verde, tex: 'V' }
          ],
          cap: 'La abscisa del vértice es la media de las dos raíces: ' + K('x_V = \\dfrac{x_1 + x_2}{2} = \\dfrac{S}{2}') +
            ', que es justo ' + K('-\\dfrac{b}{2a}') + '.'
        });

        h += nota('Estas relaciones sirven para dos cosas: <b>construir</b> una ecuación cuando te dan sus soluciones ' +
          '(problema clásico de examen) y <b>controlar</b> una resolución, porque si sumas y multiplicas las raíces que has ' +
          'obtenido deben salir exactamente ' + K('-b/a') + ' y ' + K('c/a') + '.');
        return h;
      }));
  };

  /* ==================================================================
     12 · bicuadrada
     ================================================================== */
  R.bicuadrada = function (node) {
    S.shell(node, 'Bicuadradas: el cambio x² = t paso a paso',
      'Escribe los coeficientes de <code>ax⁴ + bx² + c = 0</code>. El applet hace el cambio <code>x² = t</code>, resuelve la ' +
      'ecuación de segundo grado que aparece y después <b>deshace el cambio</b> analizando cada valor de <code>t</code> por ' +
      'separado: solo los valores positivos dan dos soluciones, el cero da una y los negativos ninguna.',
      [
        { id: 'a', label: 'a (coeficiente de x⁴)', type: 'text', value: '1', ancho: '6rem' },
        { id: 'b', label: 'b (coeficiente de x²)', type: 'text', value: '-13', ancho: '6rem' },
        { id: 'c', label: 'c (término independiente)', type: 'text', value: '36', ancho: '6rem' },
        escenarios([
          { txt: 'x⁴ − 13x² + 36 = 0', tit: 'cuatro soluciones', set: { a: '1', b: '-13', c: '36' } },
          { txt: 'x⁴ − 5x² + 4 = 0', set: { a: '1', b: '-5', c: '4' } },
          { txt: 'x⁴ − 5x² − 36 = 0', tit: 'solo dos soluciones', set: { a: '1', b: '-5', c: '-36' } },
          { txt: 'x⁴ + 5x² + 4 = 0', tit: 'sin soluciones reales', set: { a: '1', b: '5', c: '4' } },
          { txt: 'x⁴ − 8x² + 16 = 0', tit: 'raíz doble en t', set: { a: '1', b: '-8', c: '16' } },
          { txt: 'x⁴ − 4x² = 0', tit: 'con t = 0', set: { a: '1', b: '-4', c: '0' } },
          { txt: '4x⁴ − 17x² + 4 = 0', set: { a: '4', b: '-17', c: '4' } },
          { txt: 'x⁴ − 3x² + 1 = 0', tit: 'raíces irracionales', set: { a: '1', b: '-3', c: '1' } }
        ])
      ],
      guarda(function (v) {
        var a = fr(v.a, 'El coeficiente a'), b = fr(v.b, 'El coeficiente b'), c = fr(v.c, 'El coeficiente c');
        if (esCero(a)) throw Error('Con a = 0 la ecuación no es bicuadrada: se queda en una ecuación de segundo grado en x².');
        var cero = FR(0);
        var pol4 = S.pDe([c, cero, b, cero, a]);
        var polT = S.pDe([c, b, a]);
        var disc = b.por(b).menos(FR(4).por(a).por(c));

        var h = S.expr('Ecuación de partida', T(pol4) + ' = 0');
        h += cad([
          fila('Cambio de variable', 'x^{2} = t \\quad\\Longrightarrow\\quad x^{4} = \\left(x^{2}\\right)^{2} = t^{2}', 'eq-clave'),
          fila('Ecuación en t', T(polT) + ' = 0'),
          fila('Discriminante', '\\Delta = ' + ft(b) + '^{2} - 4\\cdot' + ft(a) + '\\cdot' + ft(c) + ' = ' + ft(disc))
        ]);

        var Q = S.solCuadratica(a, b, c);
        var estado = fv(disc) > 0 ? 'dos' : (fv(disc) === 0 ? 'doble' : 'ninguna');
        h += cajasDisc(estado);

        if (Q.tipo === 'ninguna') {
          h += S.expr('Valores de t', '\\varnothing');
          h += nota('Si la ecuación auxiliar en ' + K('t') + ' no tiene solución real, la bicuadrada tampoco puede tenerla: ' +
            'no hay ningún número real cuyo cuadrado sirva.');
          h += S.expr('Conjunto solución', '\\varnothing');
          return h;
        }

        h += S.expr('Valores de t', S.raicesTex(Q).replace(/x_/g, 't_'));

        /* deshacer el cambio, raíz de t a raíz de x */
        var filas = [], sols = [];
        Q.raices.forEach(function (t, i) {
          var tv = t.val(), nom = 't_' + (i + 1) + ' = ' + t.tex();
          if (tv > 1e-12) {
            var rt = raizNTex(t, 2);
            filas.push([K(nom), K('x^{2} = ' + t.tex()), K('x = \\pm ' + rt.tex),
              S.badge('dos soluciones', 'si')]);
            sols.push({ tex: rt.tex, val: rt.val });
            sols.push({ tex: '-' + rt.tex, val: -rt.val });
          } else if (Math.abs(tv) <= 1e-12) {
            filas.push([K(nom), K('x^{2} = 0'), K('x = 0'), S.badge('una solución', 'info')]);
            sols.push({ tex: '0', val: 0 });
          } else {
            filas.push([K(nom), K('x^{2} = ' + t.tex()), K('\\varnothing'),
              S.badge('ninguna solución real', 'no')]);
          }
        });
        h += S.tabla(['Valor de t', 'Se deshace el cambio', 'Soluciones en x', 'Cuántas'], filas);

        sols.sort(function (u, w) { return u.val - w.val; });
        h += S.expr('Conjunto solución',
          sols.length ? 'x \\in \\left\\{' + sols.map(function (s) { return s.tex; }).join(',\\; ') + '\\right\\}' : '\\varnothing');
        if (sols.length) {
          h += S.kvs(sols.map(function (s) { return K('x \\approx ' + nc(s.val, 4)); }));
        }
        h += S.badge('la ecuación tiene ' + sols.length + (sols.length === 1 ? ' solución real' : ' soluciones reales'),
          sols.length ? 'si' : 'no');

        var av = fv(a), bv = fv(b), cv = fv(c);
        var f = function (x) { return av * Math.pow(x, 4) + bv * x * x + cv; };
        var W = ventana(sols.map(function (s) { return s.val; }), f, { ys: [cv] });
        h += S.ejes({
          xmin: W.xmin, xmax: W.xmax, ymin: W.ymin, ymax: W.ymax, W: 1000, H: 540,
          curvas: [{ f: f, col: COL.morado, label: 'y = ' + T(pol4), lx: 640, ly: 74 }],
          puntos: sols.map(function (s) { return { x: s.val, y: 0, col: COL.rojo, tex: nc(s.val, 3) }; }),
          cap: 'La curva de una bicuadrada es simétrica respecto del eje OY, porque solo aparecen potencias pares de ' +
            K('x') + '. Por eso las soluciones van siempre por parejas ' + K('\\pm r') + ' (salvo la solución ' + K('x = 0') + ').'
        });

        h += nota('Recuento rápido: cada valor <b>positivo</b> de ' + K('t') + ' aporta dos soluciones, el valor ' +
          K('t = 0') + ' aporta una y cada valor <b>negativo</b> no aporta ninguna. Por eso una bicuadrada puede tener ' +
          '0, 1, 2, 3 o 4 soluciones reales, pero nunca más de cuatro.');
        return h;
      }));
  };

  /* ==================================================================
     13 · bipotencial
     ================================================================== */
  R.bipotencial = function (node) {
    S.shell(node, 'Ecuaciones bipotenciales ax²ⁿ + bxⁿ + c = 0',
      'La bicuadrada no es más que el caso <code>n = 2</code> de una familia mucho más amplia. Mueve el deslizador de ' +
      '<code>n</code> y observa la diferencia decisiva: cuando <code>n</code> es <b>par</b> cada valor positivo de ' +
      '<code>t</code> da dos soluciones y los negativos ninguna, mientras que cuando <code>n</code> es <b>impar</b> cada ' +
      'valor de <code>t</code> —positivo o negativo— da exactamente una.',
      [
        { id: 'a', label: 'a', type: 'text', value: '1', ancho: '5rem' },
        { id: 'b', label: 'b', type: 'text', value: '19', ancho: '5rem' },
        { id: 'c', label: 'c', type: 'text', value: '-216', ancho: '5rem' },
        { id: 'n', label: 'Exponente n', type: 'range', min: 2, max: 5, step: 1, value: 3 },
        escenarios([
          { txt: 'x⁶ + 19x³ − 216 = 0', tit: 'n = 3', set: { a: '1', b: '19', c: '-216', n: 3 } },
          { txt: 'x⁴ − 13x² + 36 = 0', tit: 'n = 2', set: { a: '1', b: '-13', c: '36', n: 2 } },
          { txt: 'x⁶ − 9x³ + 8 = 0', set: { a: '1', b: '-9', c: '8', n: 3 } },
          { txt: 'x⁸ − 17x⁴ + 16 = 0', tit: 'n = 4', set: { a: '1', b: '-17', c: '16', n: 4 } },
          { txt: 'x¹⁰ − 33x⁵ + 32 = 0', tit: 'n = 5', set: { a: '1', b: '-33', c: '32', n: 5 } },
          { txt: 'x⁶ + 7x³ − 8 = 0', tit: 'una t negativa', set: { a: '1', b: '7', c: '-8', n: 3 } },
          { txt: 'x⁸ + 5x⁴ + 4 = 0', tit: 'sin soluciones', set: { a: '1', b: '5', c: '4', n: 4 } }
        ])
      ],
      guarda(function (v) {
        var a = fr(v.a, 'El coeficiente a'), b = fr(v.b, 'El coeficiente b'), c = fr(v.c, 'El coeficiente c');
        var n = Math.round(Number(String(v.n).replace(',', '.')));
        if (!(n >= 2 && n <= 5)) n = 2;
        if (esCero(a)) throw Error('Con a = 0 desaparece el término de grado 2n y la ecuación deja de ser bipotencial.');

        var coef = [], i;
        for (i = 0; i <= 2 * n; i++) coef.push(FR(0));
        coef[0] = c; coef[n] = coef[n].mas(b); coef[2 * n] = coef[2 * n].mas(a);
        var polX = S.pDe(coef);
        var polT = S.pDe([c, b, a]);
        var disc = b.por(b).menos(FR(4).por(a).por(c));
        var par = (n % 2 === 0);

        var h = S.expr('Ecuación de partida', T(polX) + ' = 0');
        h += cad([
          fila('La clave', 'x^{' + (2 * n) + '} = \\left(x^{' + n + '}\\right)^{2}', 'eq-clave'),
          fila('Cambio de variable', 'x^{' + n + '} = t'),
          fila('Ecuación en t', T(polT) + ' = 0'),
          fila('Discriminante', '\\Delta = ' + ft(disc))
        ]);
        h += cajasDisc(fv(disc) > 0 ? 'dos' : (fv(disc) === 0 ? 'doble' : 'ninguna'));

        var Q = S.solCuadratica(a, b, c);
        if (Q.tipo === 'ninguna') {
          h += S.expr('Valores de t', '\\varnothing');
          h += S.expr('Conjunto solución', '\\varnothing');
          h += nota('Sin valores reales de ' + K('t') + ' no hay nada que deshacer: la ecuación original tampoco tiene soluciones reales.');
          return h;
        }
        h += S.expr('Valores de t', S.raicesTex(Q).replace(/x_/g, 't_'));

        var filas = [], sols = [];
        Q.raices.forEach(function (t, k) {
          var tv = t.val(), nom = 't_' + (k + 1) + ' = ' + t.tex();
          var ec = 'x^{' + n + '} = ' + t.tex();
          if (par) {
            if (tv > 1e-12) {
              var rp = raizNTex(t, n);
              filas.push([K(nom), K(ec), K('x = \\pm ' + rp.tex), S.badge('dos soluciones', 'si')]);
              sols.push({ tex: rp.tex, val: rp.val });
              sols.push({ tex: '-' + rp.tex, val: -rp.val });
            } else if (Math.abs(tv) <= 1e-12) {
              filas.push([K(nom), K('x^{' + n + '} = 0'), K('x = 0'), S.badge('una solución', 'info')]);
              sols.push({ tex: '0', val: 0 });
            } else {
              filas.push([K(nom), K(ec), K('\\varnothing'),
                S.badge('ninguna: n es par y una potencia par nunca es negativa', 'no')]);
            }
          } else {
            var ri = raizNTex(t, n);
            filas.push([K(nom), K(ec), K('x = ' + ri.tex), S.badge('una solución', 'si')]);
            sols.push({ tex: ri.tex, val: ri.val });
          }
        });
        h += S.tabla(['Valor de t', 'Se deshace el cambio', 'Soluciones en x', 'Cuántas'], filas);

        sols = sols.filter(function (s) { return isFinite(s.val); });
        sols.sort(function (u, w) { return u.val - w.val; });
        h += S.expr('Conjunto solución',
          sols.length ? 'x \\in \\left\\{' + sols.map(function (s) { return s.tex; }).join(',\\; ') + '\\right\\}' : '\\varnothing');
        if (sols.length) h += S.kvs(sols.map(function (s) { return K('x \\approx ' + nc(s.val, 4)); }));

        h += rejilla([
          tarjeta('Si n es par', 'Las potencias ' + K('x^{n}') + ' solo toman valores mayores o iguales que cero. ' +
            'Por eso hay que <b>descartar</b> los valores negativos de ' + K('t') + ', y los positivos dan la pareja ' +
            K('\\pm\\sqrt[n]{t}') + '. Como mucho salen cuatro soluciones.',
            par ? 'ap-card-ok' : ''),
          tarjeta('Si n es impar', 'La función ' + K('x^{n}') + ' recorre todos los números reales, así que ' +
            '<b>cualquier</b> valor de ' + K('t') + ' es aprovechable y da una única solución ' + K('x = \\sqrt[n]{t}') +
            '. Como mucho salen dos soluciones.',
            par ? '' : 'ap-card-ok')
        ]);

        var av = fv(a), bv = fv(b), cv = fv(c);
        var f = function (x) { return av * Math.pow(x, 2 * n) + bv * Math.pow(x, n) + cv; };
        var W = ventana(sols.map(function (s) { return s.val; }), f, { ys: [cv] });
        h += S.ejes({
          xmin: W.xmin, xmax: W.xmax, ymin: W.ymin, ymax: W.ymax, W: 1000, H: 540,
          curvas: [{ f: f, col: COL.morado, label: 'y = ' + T(polX), lx: 620, ly: 74 }],
          puntos: sols.map(function (s) { return { x: s.val, y: 0, col: COL.rojo, tex: nc(s.val, 3) }; }),
          cap: 'Los cortes con el eje OX son las soluciones reales. Con ' + K('n') + ' par la curva es simétrica respecto ' +
            'del eje OY; con ' + K('n') + ' impar esa simetría desaparece.'
        });
        return h;
      }));
  };

  /* ==================================================================
     14 · cambioAuxiliar
     ================================================================== */
  var TIPOS = [
    { value: 'pol', label: 'Cambio t = g(x), con g un polinomio' },
    { value: 'raiz', label: 'Cambio t = √x' },
    { value: 'exp', label: 'Cambio t = kˣ (exponencial)' }
  ];

  R.cambioAuxiliar = function (node) {
    S.shell(node, 'Otros cambios de variable',
      'El cambio de variable no es un truco exclusivo de las bicuadradas: siempre que una ecuación tenga la forma ' +
      '<code>a·[algo]² + b·[algo] + c = 0</code>, ese «algo» se puede llamar <code>t</code>. Elige el tipo de cambio, ' +
      'ajusta los coeficientes y comprueba cómo la ecuación complicada se convierte en una de segundo grado.',
      [
        { id: 'tipo', label: 'Tipo de cambio', type: 'select', options: TIPOS, value: 'pol' },
        { id: 'a', label: 'a', type: 'text', value: '1', ancho: '5rem' },
        { id: 'b', label: 'b', type: 'text', value: '-2', ancho: '5rem' },
        { id: 'c', label: 'c', type: 'text', value: '-8', ancho: '5rem' },
        { id: 'g', label: 'Expresión g(x) (solo para el primer tipo)', type: 'text', value: 'x^2-3x', ancho: '14rem' },
        { id: 'k', label: 'Base k (solo para el tipo exponencial)', type: 'text', value: '2', ancho: '6rem' },
        escenarios([
          { txt: '(x²−3x)² − 2(x²−3x) − 8 = 0', set: { tipo: 'pol', a: '1', b: '-2', c: '-8', g: 'x^2-3x' } },
          { txt: '(x²+x)² − 8(x²+x) + 12 = 0', set: { tipo: 'pol', a: '1', b: '-8', c: '12', g: 'x^2+x' } },
          { txt: '(x−1)² − 5(x−1) + 6 = 0', set: { tipo: 'pol', a: '1', b: '-5', c: '6', g: 'x-1' } },
          { txt: 'x − 5√x + 6 = 0', set: { tipo: 'raiz', a: '1', b: '-5', c: '6' } },
          { txt: 'x − √x − 6 = 0', tit: 'una raíz negativa se descarta', set: { tipo: 'raiz', a: '1', b: '-1', c: '-6' } },
          { txt: '2²ˣ − 5·2ˣ + 4 = 0', set: { tipo: 'exp', a: '1', b: '-5', c: '4', k: '2' } },
          { txt: '3²ˣ − 4·3ˣ + 3 = 0', set: { tipo: 'exp', a: '1', b: '-4', c: '3', k: '3' } },
          { txt: '2²ˣ + 2ˣ − 6 = 0', tit: 'con una t negativa', set: { tipo: 'exp', a: '1', b: '1', c: '-6', k: '2' } }
        ])
      ],
      guarda(function (v) {
        var a = fr(v.a, 'El coeficiente a'), b = fr(v.b, 'El coeficiente b'), c = fr(v.c, 'El coeficiente c');
        if (esCero(a)) throw Error('Con a = 0 no queda ninguna ecuación de segundo grado en t: el cambio de variable pierde su gracia.');
        var tipo = String(v.tipo || 'pol');
        var polT = S.pDe([c, b, a]);
        var Q = S.solCuadratica(a, b, c);
        var h = '';

        /* ---- enunciado y descripción del cambio ---- */
        var G = null, tex0 = '', texT = 't';
        if (tipo === 'pol') {
          G = S.parsePol(String(v.g || 'x'), 'x', 'La expresión g(x)');
          if (S.pGrado(G) < 1) throw Error('La expresión g(x) tiene que depender de x: prueba con x^2-3x o con x-1.');
          var gp = '\\left(' + T(G) + '\\right)';
          tex0 = ft(a) + gp + '^{2} + \\left(' + ft(b) + '\\right)' + gp + ' + \\left(' + ft(c) + '\\right) = 0';
          texT = 'g(x) = ' + T(G);
        } else if (tipo === 'raiz') {
          tex0 = ft(a) + 'x + \\left(' + ft(b) + '\\right)\\sqrt{x} + \\left(' + ft(c) + '\\right) = 0';
          texT = '\\sqrt{x}';
        } else {
          var kb = fr(v.k, 'La base k');
          if (!(fv(kb) > 0) || fv(kb) === 1) throw Error('La base de una exponencial tiene que ser un número positivo distinto de 1.');
          tex0 = ft(a) + ft(kb) + '^{2x} + \\left(' + ft(b) + '\\right)' + ft(kb) + '^{x} + \\left(' + ft(c) + '\\right) = 0';
          texT = ft(kb) + '^{x}';
        }

        h += S.expr('Ecuación de partida', tex0);
        h += cad([
          fila('Cambio de variable', 't = ' + texT, 'eq-clave'),
          fila('Ecuación auxiliar', T(polT) + ' = 0'),
          fila('Soluciones en t', Q.tipo === 'ninguna' ? '\\varnothing' : S.raicesTex(Q).replace(/x_/g, 't_'), 'eq-bien')
        ]);

        if (Q.tipo === 'ninguna') {
          h += S.expr('Conjunto solución', '\\varnothing');
          h += nota('La ecuación auxiliar no tiene soluciones reales, así que no hay ningún cambio que deshacer.');
          return h;
        }

        /* ---- deshacer el cambio ---- */
        var filas = [], sols = [], descartes = 0;
        Q.raices.forEach(function (t, i) {
          var nom = 't_' + (i + 1) + ' = ' + t.tex(), tv = t.val();
          if (tipo === 'pol') {
            if (!t.esRacional()) {
              filas.push([K(nom), K(T(G) + ' = ' + t.tex()),
                'Resuelve esta ecuación con la fórmula general: la raíz es irracional.', S.badge('caso irracional', 'info')]);
              return;
            }
            var ec = S.pResta(G, S.pDe([t.frac()]));
            var P = S.solPolinomica(ec);
            if (!P.raices.length) {
              filas.push([K(nom), K(T(G) + ' = ' + t.tex()), K('\\varnothing'), S.badge('ninguna solución', 'no')]);
              descartes++;
              return;
            }
            var lst = P.raices.map(function (r) {
              var tx = r.raiz ? r.raiz.tex(true) : r.irr.tex();
              var vl = r.raiz ? r.raiz.val() : r.irr.val();
              sols.push({ tex: tx, val: vl });
              return tx;
            });
            filas.push([K(nom), K(T(ec) + ' = 0'), K('x = ' + lst.join(',\\; ')),
              S.badge(lst.length === 1 ? 'una solución' : lst.length + ' soluciones', 'si')]);
          } else if (tipo === 'raiz') {
            if (tv < -1e-12) {
              filas.push([K(nom), K('\\sqrt{x} = ' + t.tex()),
                K('\\varnothing'), S.badge('se descarta: una raíz cuadrada nunca es negativa', 'no')]);
              descartes++;
              return;
            }
            var x2 = t.esRacional() ? t.frac().por(t.frac()) : null;
            var tx2 = x2 ? ft(x2) : nc(tv * tv, 4);
            sols.push({ tex: tx2, val: tv * tv });
            filas.push([K(nom), K('\\sqrt{x} = ' + t.tex()), K('x = \\left(' + t.tex() + '\\right)^{2} = ' + tx2),
              S.badge('una solución', 'si')]);
          } else {
            var base = fv(fr(v.k, 'La base k'));
            if (tv <= 1e-12) {
              filas.push([K(nom), K(texT + ' = ' + t.tex()), K('\\varnothing'),
                S.badge('se descarta: una exponencial siempre es positiva', 'no')]);
              descartes++;
              return;
            }
            var e = logExacto(tv, base);
            var xtex = (e !== null) ? String(e) : '\\log_{' + ft(fr(v.k, 'La base k')) + '}\\left(' + t.tex() + '\\right)';
            var xval = Math.log(tv) / Math.log(base);
            sols.push({ tex: xtex, val: xval });
            filas.push([K(nom), K(texT + ' = ' + t.tex()),
              K('x = ' + xtex) + (e !== null ? '' : ' ' + K('\\approx ' + nc(xval, 4))),
              S.badge('una solución', 'si')]);
          }
        });
        h += S.tabla(['Valor de t', 'Ecuación al deshacer el cambio', 'Soluciones en x', 'Resultado'], filas);

        sols = sols.filter(function (s) { return isFinite(s.val); });
        sols.sort(function (u, w) { return u.val - w.val; });
        h += S.expr('Conjunto solución',
          sols.length ? 'x \\in \\left\\{' + sols.map(function (s) { return s.tex; }).join(',\\; ') + '\\right\\}' : '\\varnothing');
        if (sols.length) h += S.kvs(sols.map(function (s) { return K('x \\approx ' + nc(s.val, 4)); }));
        if (descartes > 0) {
          h += S.badge('se han descartado ' + descartes + (descartes === 1 ? ' valor de t' : ' valores de t') + ' por no ser admisibles', 'info');
        }

        h += nota('La receta es siempre la misma en tres tiempos: <b>1)</b> reconocer la expresión que se repite elevada al ' +
          'cuadrado y bautizarla como ' + K('t') + '; <b>2)</b> resolver la ecuación de segundo grado en ' + K('t') + '; ' +
          '<b>3)</b> deshacer el cambio para cada valor obtenido, <b>comprobando antes si es admisible</b> ' +
          '(las raíces cuadradas no pueden ser negativas y las exponenciales tampoco).');
        return h;
      }));
  };

  S.extraA = true;
  if (S.monta) S.monta();
})();
