/* =====================================================================
   sys-applets-a.js · Módulo A del Tema 4 «Sistemas de ecuaciones e
   inecuaciones»
   1.º de Bachillerato · Matemáticas Aplicadas a las Ciencias Sociales
   Ruta: 1-BatxMatesCCSS/sistemas-ecuaciones-inecuaciones/assets/sys-applets-a.js

   Applets de los apartados 4.1 a 4.6. Se carga DESPUÉS del núcleo
   sys-applets.js (window.SYS) y de la capa de álgebra lineal
   sys-applets-lin.js, de la que toma TODO el motor exacto: parseo de
   ecuaciones, matrices, discusión por rangos, métodos clásicos y la
   figura S.plano. Aquí no se calcula nada «a mano»: este módulo solo
   orquesta, explica y dibuja.

   ---------------------------------------------------------------------
   Applets registrados (claves fijas del catálogo del tema)
   ---------------------------------------------------------------------

   esSolucion      Comprobación de soluciones.
                   Sistema 2×2 editable y un punto (x0, y0). Sustituye el
                   punto en las dos ecuaciones, muestra la cuenta completa
                   con fracciones exactas, marca cuáles se cumplen y sitúa
                   el punto frente a las dos rectas. Deja claro que ser
                   solución del sistema es cumplir TODAS las ecuaciones a
                   la vez, no una sola.

   unaEcuacion     Una ecuación, infinitas soluciones.
                   Una única ecuación a x + b y = c: tabla de soluciones
                   (se elige x y se despeja y), paso a la forma explícita
                   y = m x + n, y la recta con los puntos de la tabla
                   dibujados encima. Caso b = 0 (recta vertical) tratado
                   aparte.

   sistemaLab      Laboratorio de sistemas 2×2.
                   Seis deslizadores a, b, c, a', b', c'. Clasificación
                   instantánea (SCD / SCI / SI), comparación de las razones
                   a/a', b/b', c/c' mediante productos cruzados (para no
                   dividir entre cero) y las dos rectas en el plano.

   equivalentes    Sistemas equivalentes.
                   Aplica una transformación elemental (multiplicar una
                   ecuación por k ≠ 0, sumar/restar ecuaciones, intercambiar)
                   y compara la solución antes y después. Incluye la
                   transformación PROHIBIDA (multiplicar por 0) para que se
                   vea cómo se pierde información y el sistema deja de ser
                   equivalente.

   sustitucion     Método de sustitución.
                   El alumno elige qué incógnita despeja y en qué ecuación.
                   Se muestran todos los pasos de S.sustitucion, la
                   comprobación y un comentario sobre si la elección era o
                   no la más cómoda (coeficientes ±1).

   igualacion      Método de igualación.
                   Ídem con S.igualacion: las dos expresiones despejadas
                   se ven una debajo de otra antes de igualarlas.

   reduccion       Método de reducción.
                   Elección de la incógnita que se elimina; el applet
                   calcula los multiplicadores con el m.c.m., enseña el
                   sistema ya multiplicado y la suma que hace desaparecer
                   una incógnita.

   comparaMetodos  Los tres métodos en paralelo.
                   Un mismo sistema resuelto por sustitución, igualación y
                   reducción en tres columnas, con el número de pasos de
                   cada uno y una recomendación razonada de cuál conviene
                   en ese sistema concreto.

   metodoGrafico   Método gráfico.
                   Forma explícita de cada recta, tabla de valores para
                   dibujarlas, punto de corte exacto y lectura gráfica de
                   la solución. Deslizadores para mover los coeficientes.

   tresCasos       Los tres casos gráficos.
                   Escenarios de rectas secantes, paralelas y coincidentes,
                   con el vínculo explícito entre la geometría (número de
                   puntos comunes) y la clasificación algebraica
                   (SCD / SI / SCI) a través de las razones de coeficientes.

   ---------------------------------------------------------------------
   Convenios internos
   ---------------------------------------------------------------------
   · Toda la aritmética es exacta (S.Frac con BigInt). La coma flotante
     solo aparece dentro de S.plano, para pasar a píxeles.
   · Cada compute va envuelto en guarda(): cualquier Error de la capa
     lineal (entrada mal escrita, sistema no 2×2, ecuación no lineal…)
     se muestra como un aviso amable en vez de romper el applet.
   · Los títulos NUNCA se numeran: el armazón escribe «Applet · …».
   · Las instrucciones dicen siempre, con ejemplos, cómo se escribe la
     entrada: enteros (3), negativos (-2), decimales con coma (0,5),
     fracciones (3/4) y ecuaciones del tipo 2x-3y=5.

   Sin OJS, sin CDN, sin dependencias externas. ES5 (var/function) salvo
   BigInt, que ya usa el núcleo.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.SYS;
  if (!S) {
    if (window.console && console.error) {
      console.error('[sistemas] sys-applets-a.js necesita sys-applets.js cargado antes.');
    }
    return;
  }
  if (!S.parseSistema || !S.plano) {
    if (window.console && console.error) {
      console.error('[sistemas] sys-applets-a.js necesita la capa sys-applets-lin.js cargada antes.');
    }
    return;
  }

  var R = S.registry, K = S.K, KD = S.KD, esc = S.esc, COL = S.COL;
  var F = S.fracDe;                       /* número/texto/Frac -> Frac    */
  var Frac = S.Frac;

  /* ==================================================================
     0 · utilidades locales
     ================================================================== */

  function esCero(f) { return f.n === 0n; }
  function negat(f) { return f.n < 0n; }
  function absF(f) { return negat(f) ? f.opuesto() : f; }
  function FT(f) { return f.tex(true); }              /* \frac  (en línea) */
  function FD(f) { return f.tex(false); }             /* \dfrac (display)  */
  function num(f) { return Number(f.n) / Number(f.d); }
  function igualF(a, b) { return a.cmp(b) === 0; }

  /* Mensaje amable en lugar de una excepción sin capturar. */
  function avisoHTML(e) {
    var m = (e && e.message) ? e.message : String(e);
    return '<div class="mx-bad ap-err">' + esc(m).replace(/\n/g, '<br>') + '</div>';
  }
  function guarda(f) {
    return function (v, ctl, out, api) {
      try {
        var h = f(v, ctl, out, api);
        if (h === undefined || h === null || h === '') {
          return '<div class="mx-info">Ajusta los datos para ver el desarrollo.</div>';
        }
        return h;
      } catch (e) { return avisoHTML(e); }
    };
  }

  /* Rellena los controles desde un botón de escenario. */
  function pon(ctl, obj) {
    Object.keys(obj).forEach(function (k) {
      var e = ctl[k];
      if (!e) return;
      if (e.type === 'checkbox') e.checked = !!obj[k];
      else e.value = String(obj[k]);
    });
  }
  function escenarios(lista, etiqueta) {
    return {
      type: 'presets',
      label: etiqueta || 'Escenarios',
      list: lista.map(function (c) {
        return {
          label: c.txt,
          title: c.tit || '',
          apply: function (ctl) { pon(ctl, c.set); }
        };
      })
    };
  }

  /* Piezas de maquetación reutilizadas del Tema 3. */
  function tarjeta(titulo, html, clase) {
    return '<div class="ap-card ' + (clase || '') + '">' +
      '<div class="ap-card-tit">' + esc(titulo) + '</div>' + html + '</div>';
  }
  function rejilla2(cartas) { return '<div class="ap-grid2">' + cartas.join('') + '</div>'; }
  function rejilla3(cartas) { return '<div class="ap-grid3">' + cartas.join('') + '</div>'; }
  function nota(html) { return '<p class="ap-note">' + html + '</p>'; }
  function enun(html) { return '<div class="ap-enun">' + html + '</div>'; }
  function fig(svg, pie) { return '<div class="sys-fig">' + svg + (pie ? '<p class="ap-note">' + pie + '</p>' : '') + '</div>'; }

  /* Texto compartido: cómo se escriben las ecuaciones. */
  var COMO_ECU =
    'Escribe cada ecuación con un signo <code>=</code> y las incógnitas <code>x</code> e <code>y</code>. ' +
    'Puedes colocar los términos en el orden que quieras y poner incógnitas en los dos miembros: ' +
    '<code>2x-3y=5</code>, <code>4y+2x=6</code>, <code>3x=2y-1</code>, <code>x=3</code>. ' +
    'Se admiten paréntesis (<code>2(x-1)+y=4</code>), coeficientes enteros (<code>-2</code>), ' +
    'decimales con coma (<code>0,5x+y=2</code>) y fracciones (<code>x/2+y/3=1</code>). ' +
    'No escribas <code>x^2</code> ni <code>xy</code>: en un sistema lineal las incógnitas van solas y de grado 1.';

  var COMO_NUM =
    'Los números se escriben como entero (<code>3</code>, <code>-2</code>), decimal con coma ' +
    '(<code>0,5</code>) o fracción (<code>3/4</code>).';

  /* Lee dos ecuaciones y devuelve el sistema 2×2 con vars fijas x, y. */
  function sis2(t1, t2) {
    var a = String(t1 === undefined ? '' : t1).trim();
    var b = String(t2 === undefined ? '' : t2).trim();
    if (a === '' || b === '') {
      throw Error('Faltan ecuaciones. Este applet necesita DOS ecuaciones, una en cada casilla, ' +
        'por ejemplo 2x+3y=12 y x-y=1.');
    }
    var s = S.parseSistema(a + '\n' + b, ['x', 'y']);
    if (s.m !== 2) {
      throw Error('Se han leído ' + s.m + ' ecuaciones y aquí hacen falta exactamente 2. ' +
        'Escribe una sola ecuación en cada casilla, por ejemplo 2x+3y=12 y x-y=1.');
    }
    var i;
    for (i = 0; i < 2; i++) {
      if (s.ecus[i].trivial) {
        throw Error('En la ecuación (' + (i + 1) + ') han desaparecido las dos incógnitas: al pasar todo ' +
          'a un miembro queda algo del tipo 0 = k. Escribe una ecuación con x o con y, por ejemplo 2x+3y=12.');
      }
    }
    return s;
  }

  /* Las dos rectas del sistema, listas para S.plano.
     Los rótulos se colocan en puntos distintos de cada recta (`pos`)
     para que no se pisen entre sí ni con el rótulo del punto de corte. */
  function rectasDe(s, et1, et2) {
    return [
      { a: s.A.a[0][0], b: s.A.a[0][1], c: s.b[0], color: COL.azul, etiqueta: et1 || '(1)', ancho: 3.4, pos: 0.78 },
      { a: s.A.a[1][0], b: s.A.a[1][1], c: s.b[1], color: COL.rojo, etiqueta: et2 || '(2)', ancho: 3.4, pos: 0.24 }
    ];
  }

  /* ¿Dos rectas a·x + b·y = c son la MISMA recta?  (coeficientes
     proporcionales, incluido el término independiente) */
  function mismaRecta(r1, r2) {
    var a1 = num(r1.a), b1 = num(r1.b), c1 = num(r1.c);
    var a2 = num(r2.a), b2 = num(r2.b), c2 = num(r2.c);
    var e = 1e-9;
    return Math.abs(a1 * b2 - a2 * b1) < e &&
      Math.abs(a1 * c2 - a2 * c1) < e &&
      Math.abs(b1 * c2 - b2 * c1) < e;
  }
  /* Cuando dos rectas coinciden, sus etiquetas caerían una encima de la
     otra: se funden en una sola «(1) = (1')» y se reparten las que
     quedan a lo largo de las rectas. */
  function fundeEtiquetas(rectas) {
    var i, j, usada = [];
    for (i = 0; i < rectas.length; i++) {
      if (usada[i] || !rectas[i].etiqueta) continue;
      for (j = i + 1; j < rectas.length; j++) {
        if (usada[j] || !rectas[j].etiqueta) continue;
        if (mismaRecta(rectas[i], rectas[j])) {
          rectas[i].etiqueta += ' = ' + rectas[j].etiqueta;
          rectas[j].etiqueta = '';
          usada[j] = true;
        }
      }
    }
    var vivas = 0;
    var reparto = [0.80, 0.22, 0.55, 0.38];
    for (i = 0; i < rectas.length; i++) {
      if (!rectas[i].etiqueta) continue;
      rectas[i].pos = reparto[vivas % reparto.length];
      vivas++;
    }
    return rectas;
  }
  function leyenda2(s) {
    return [
      { color: COL.azul, texto: 'ecuación (1)' },
      { color: COL.rojo, texto: 'ecuación (2)' }
    ];
  }

  function badgeTipo(t) {
    if (t === 'SCD') return S.badge('compatible determinado (SCD) · una única solución', 'si');
    if (t === 'SCI') return S.badge('compatible indeterminado (SCI) · infinitas soluciones', 'info');
    return S.badge('incompatible (SI) · ninguna solución', 'no');
  }
  function nombreGeom(t) {
    if (t === 'SCD') return 'rectas secantes (se cortan en un punto)';
    if (t === 'SCI') return 'rectas coincidentes (son la misma recta)';
    return 'rectas paralelas (no se cortan nunca)';
  }

  /* Un número entre paréntesis cuando lo necesita al sustituir. */
  function valTex(f) {
    return (negat(f) || f.d !== 1n) ? '\\left(' + FT(f) + '\\right)' : FT(f);
  }
  /* Sustitución literal de valores en a x + b y: «2·3 + 3·(-1)» */
  function sustTex(coef, vals) {
    var s = '', primero = true, i;
    for (i = 0; i < coef.length; i++) {
      var c = coef[i];
      if (esCero(c)) continue;
      var a = absF(c);
      var cuerpo = (a.n === 1n && a.d === 1n) ? valTex(vals[i]) : FT(a) + '\\cdot ' + valTex(vals[i]);
      if (primero) s += (negat(c) ? '-' : '') + cuerpo;
      else s += (negat(c) ? ' - ' : ' + ') + cuerpo;
      primero = false;
    }
    return primero ? '0' : s;
  }
  /* Valor exacto de a x + b y en un punto. */
  function evalFila(coef, vals) {
    var s = new Frac(0), i;
    for (i = 0; i < coef.length; i++) s = s.mas(coef[i].por(vals[i]));
    return s;
  }

  /* Tabla de comprobación de una solución en las dos ecuaciones. */
  function comprobacionHTML(s, sol) {
    var c = S.compruebaSol(s.A, s.b, sol);
    var filas = c.filas.map(function (r, i) {
      return {
        clase: r.ok ? 'ap-ok-row' : '',
        celdas: [
          '(' + r.ecuacion + ')',
          '$' + S.ecuTex(s.A.a[i], s.b[i], ['x', 'y']) + '$',
          '$' + sustTex(s.A.a[i], sol) + ' = ' + FT(r.valor) + '$',
          '$' + FT(r.esperado) + '$',
          r.ok ? S.badge('se cumple', 'si') : S.badge('no se cumple', 'no')
        ]
      };
    });
    return S.tabla(['Ecuación', 'Forma reducida', 'Sustituimos el punto', 'Debe salir', '¿Se cumple?'],
      filas, { thPrimera: false });
  }

  /* Pasos de un método clásico (S.sustitucion / igualacion / reduccion). */
  function pasosHTML(res, desde) {
    desde = desde || 0;
    return res.pasos.map(function (p, i) {
      return S.paso(desde + i + 1, p.desc + (p.tex ? KD(p.tex) : ''),
        i === res.pasos.length - 1 ? 'ap-paso-clave' : '');
    }).join('');
  }

  /* Resultado final de un método, en caja grande. */
  function finalHTML(res, s) {
    var h = '';
    if (res.tipo === 'SCD') {
      h += S.expr('Solución del sistema', S.puntoTex(res.sol[0], res.sol[1]));
      h += S.kvs([
        'x = ' + K(FT(res.sol[0])),
        'y = ' + K(FT(res.sol[1])),
        badgeTipo('SCD')
      ]);
      h += comprobacionHTML(s, res.sol);
    } else if (res.tipo === 'SCI') {
      h += S.expr('Infinitas soluciones', S.discute(s.A, s.b, ['x', 'y']).param.texParam);
      h += S.kvs([badgeTipo('SCI'), nombreGeom('SCI')]);
    } else {
      h += S.expr('Sin solución', '\\varnothing');
      h += S.kvs([badgeTipo('SI'), nombreGeom('SI')]);
    }
    return h;
  }

  /* Rótulo de una recta para dentro de la figura: TeX simplificado a
     texto plano legible, con las fracciones entre paréntesis. */
  function etiquetaRecta(r) {
    return S.explicitaTex(r)
      .replace(/\\d?frac\{(-?\d+)\}\{(\d+)\}/g, '($1/$2)')
      .replace(/\\cdot/g, '·')
      .replace(/-/g, '\u2212');
  }

  /* Tabla de valores de una recta a x + b y = c. */
  function tablaValores(r, xs) {
    var A = F(r.a), B = F(r.b), C = F(r.c);
    if (esCero(B)) {
      var x0 = C.entre(A);
      return {
        vertical: true, x0: x0,
        puntos: xs.map(function (k) { return { x: x0, y: new Frac(k) }; })
      };
    }
    return {
      vertical: false,
      puntos: xs.map(function (k) {
        var X = new Frac(k);
        return { x: X, y: C.menos(A.por(X)).entre(B) };
      })
    };
  }
  function tablaValoresHTML(tv, titulo) {
    var fx = ['$x$'], fy = ['$y$'];
    tv.puntos.forEach(function (p) {
      fx.push('$' + FT(p.x) + '$');
      fy.push('$' + FT(p.y) + '$');
    });
    return '<div class="sys-tv"><div class="sys-tv-tit">' + esc(titulo) + '</div>' +
      S.tabla([''].concat(tv.puntos.map(function (_, i) { return 'P' + (i + 1); })),
        [fx, fy], {}) + '</div>';
  }

  /* ==================================================================
     1 · esSolucion · Comprobación de soluciones
     ================================================================== */
  R.esSolucion = function (node) {
    S.shell(node, 'Comprobación de soluciones',
      COMO_ECU + '<br>' +
      'Después escribe las coordenadas del punto que quieres probar: ' + COMO_NUM +
      ' Por ejemplo <code>x0 = 3</code> e <code>y0 = 2</code>, o <code>x0 = 1/2</code> e <code>y0 = 0,5</code>. ' +
      'Un punto es solución del <b>sistema</b> solo si cumple <b>las dos</b> ecuaciones a la vez: ' +
      'observa qué ocurre cuando cumple una sola.',
      [
        { id: 'e1', label: 'Ecuación (1)', type: 'text', value: '2x+3y=12', ancho: '13rem' },
        { id: 'e2', label: 'Ecuación (2)', type: 'text', value: 'x-y=1', ancho: '13rem' },
        { id: 'px', label: 'x₀', type: 'text', value: '3', ancho: '6rem' },
        { id: 'py', label: 'y₀', type: 'text', value: '2', ancho: '6rem' },
        escenarios([
          { txt: 'sí es solución: (3, 2)', tit: 'Cumple las dos ecuaciones', set: { e1: '2x+3y=12', e2: 'x-y=1', px: '3', py: '2' } },
          { txt: 'solo cumple la (1)', tit: 'Punto de una recta pero no de la otra', set: { e1: '2x+3y=12', e2: 'x-y=1', px: '0', py: '4' } },
          { txt: 'no cumple ninguna', set: { e1: '2x+3y=12', e2: 'x-y=1', px: '1', py: '1' } },
          { txt: 'solución con fracciones', tit: 'La solución no siempre es entera', set: { e1: '2x+y=4', e2: '4x-y=1', px: '5/6', py: '7/3' } },
          { txt: 'decimales con coma', set: { e1: '0,5x+y=3', e2: 'x-2y=-2', px: '2', py: '2' } },
          { txt: 'rectas paralelas (SI)', tit: 'Ningún punto puede cumplir las dos', set: { e1: 'x+y=2', e2: 'x+y=5', px: '1', py: '1' } },
          { txt: 'rectas coincidentes (SCI)', tit: 'Infinitos puntos son solución', set: { e1: 'x+y=4', e2: '2x+2y=8', px: '1', py: '3' } }
        ])
      ],
      guarda(function (v) {
        var s = sis2(v.e1, v.e2);
        var P = [F(String(v.px).trim() === '' ? '0' : v.px), F(String(v.py).trim() === '' ? '0' : v.py)];
        var d = S.discute(s.A, s.b, ['x', 'y']);

        var h = enun('Sistema propuesto y punto que se quiere comprobar.');
        h += S.expr('Sistema', S.sisTex(s.A, s.b, ['x', 'y']));
        h += S.expr('Punto', 'P = ' + S.puntoTex(P[0], P[1]));

        var filas = [], cuantas = 0, i;
        for (i = 0; i < 2; i++) {
          var val = evalFila(s.A.a[i], P);
          var ok = igualF(val, F(s.b[i]));
          if (ok) cuantas++;
          filas.push({
            clase: ok ? 'ap-ok-row' : '',
            celdas: [
              '(' + (i + 1) + ')',
              '$' + S.ecuTex(s.A.a[i], s.b[i], ['x', 'y']) + '$',
              '$' + sustTex(s.A.a[i], P) + '$',
              '$' + FT(val) + '$',
              '$' + FT(F(s.b[i])) + '$',
              ok ? S.badge('se cumple', 'si') : S.badge('no se cumple', 'no')
            ]
          });
        }
        h += S.paso(1, 'Sustituimos $x = ' + FT(P[0]) + '$ e $y = ' + FT(P[1]) +
          '$ en cada ecuación y operamos con fracciones exactas.' +
          S.tabla(['Ecuación', 'Escrita en forma reducida', 'Sustitución', 'Valor obtenido', 'Valor exigido', '¿Se cumple?'],
            filas, { thPrimera: false }));

        var veredicto;
        if (cuantas === 2) {
          veredicto = S.badge('P SÍ es solución del sistema', 'si') +
            nota('El punto está en las dos rectas a la vez, así que pertenece a la intersección: es solución del sistema.');
        } else if (cuantas === 1) {
          veredicto = S.badge('P NO es solución del sistema', 'no') +
            nota('Cuidado: cumplir <b>una</b> ecuación no basta. El punto está sobre una de las rectas, ' +
              'pero no sobre la otra, y la solución del sistema es lo que tienen <b>en común</b>.');
        } else {
          veredicto = S.badge('P NO es solución del sistema', 'no') +
            nota('El punto no está sobre ninguna de las dos rectas.');
        }
        h += S.paso(2, 'Veredicto: hay ' + cuantas + ' de 2 ecuaciones satisfechas.<br>' + veredicto);

        var puntos = [{ x: P[0], y: P[1], etiqueta: 'P(' + S.etq(num(P[0]), 3) + ', ' + S.etq(num(P[1]), 3) + ')', color: cuantas === 2 ? COL.verde : COL.morado }];
        var leg = leyenda2(s).concat([{ color: cuantas === 2 ? COL.verde : COL.morado, texto: 'punto P' }]);
        if (d.tipo === 'SCD') {
          if (!(igualF(d.sol[0], P[0]) && igualF(d.sol[1], P[1]))) {
            puntos.push({ x: d.sol[0], y: d.sol[1], etiqueta: 'solución', color: COL.verde, dy: 22 });
            leg.push({ color: COL.verde, texto: 'solución del sistema' });
          }
          h += S.paso(3, 'La solución verdadera del sistema es $' + S.puntoTex(d.sol[0], d.sol[1]) +
            '$: el punto donde se cortan las dos rectas.' + S.kvs([badgeTipo('SCD')]));
        } else {
          h += S.paso(3, d.texto + S.kvs([badgeTipo(d.tipo), nombreGeom(d.tipo)]));
        }

        h += fig(S.plano({
          W: 820, H: 560,
          rectas: rectasDe(s),
          puntos: puntos,
          leyenda: leg,
          titulo: 'Las dos rectas y el punto P',
          label: 'Rectas del sistema y punto comprobado',
          cap: 'Ser solución del sistema significa estar sobre las dos rectas a la vez.'
        }));
        return h;
      }));
  };

  /* ==================================================================
     2 · unaEcuacion · Una ecuación, infinitas soluciones
     ================================================================== */
  R.unaEcuacion = function (node) {
    S.shell(node, 'Una ecuación, infinitas soluciones',
      'Escribe <b>una sola</b> ecuación lineal con dos incógnitas. ' + COMO_ECU + '<br>' +
      'Elige después desde qué valor entero de $x$ empieza la tabla y cuántos puntos quieres. ' +
      'Fíjate en que a cada valor de $x$ le corresponde un valor de $y$: por eso hay ' +
      '<b>infinitas</b> soluciones y todas juntas forman una recta.',
      [
        { id: 'ecu', label: 'Ecuación', type: 'text', value: '2x+3y=12', ancho: '15rem' },
        { id: 'x0', label: 'x inicial', type: 'number', value: -2, min: -20, max: 20, step: 1, ancho: '8rem' },
        { id: 'np', label: 'nº de puntos', type: 'number', value: 6, min: 2, max: 10, step: 1, ancho: '8rem' },
        escenarios([
          { txt: '2x+3y=12', set: { ecu: '2x+3y=12', x0: -2, np: 6 } },
          { txt: 'x-y=1', tit: 'Pendiente 1', set: { ecu: 'x-y=1', x0: -2, np: 6 } },
          { txt: '3x=2y-1 (orden libre)', set: { ecu: '3x=2y-1', x0: -2, np: 6 } },
          { txt: '0,5x+y=3 (decimales)', set: { ecu: '0,5x+y=3', x0: -2, np: 6 } },
          { txt: 'x/2+y/3=1 (fracciones)', set: { ecu: 'x/2+y/3=1', x0: -2, np: 6 } },
          { txt: 'y=4 (recta horizontal)', set: { ecu: 'y=4', x0: -2, np: 6 } },
          { txt: 'x=3 (recta vertical)', tit: 'Aquí no se puede despejar y', set: { ecu: 'x=3', x0: -2, np: 6 } }
        ])
      ],
      guarda(function (v) {
        var e = S.parseEcu(String(v.ecu || '').trim(), ['x', 'y']);
        if (e.trivial) {
          throw Error('En esa ecuación han desaparecido las dos incógnitas. Escribe una ecuación con x o con y, ' +
            'por ejemplo 2x+3y=12.');
        }
        var x0 = S.entero(v.x0, -20, 20, 'El valor inicial de x');
        var np = S.entero(v.np, 2, 10, 'El número de puntos');
        var r = S.rectaDe(e.coef[0], e.coef[1], e.b);

        var h = enun('Una ecuación lineal con dos incógnitas no tiene una solución: tiene infinitas parejas $(x, y)$.');
        h += S.expr('Ecuación (ya reducida)', S.ecuTex(e.coef, e.b, ['x', 'y']));

        var xs = [], i;
        for (i = 0; i < np; i++) xs.push(x0 + i);

        if (esCero(r.b)) {
          var xf = r.c.entre(r.a);
          h += S.paso(1, 'Aquí el coeficiente de $y$ es $0$: la ecuación no depende de $y$. ' +
            'Se despeja directamente $x$ y queda una <b>recta vertical</b>.' + KD('x = ' + FD(xf)));
          var tv0 = tablaValores(r, xs);
          h += S.paso(2, 'Cualquier valor de $y$ vale: la $x$ siempre es la misma.' +
            tablaValoresHTML(tv0, 'Algunas soluciones'));
          h += S.paso(3, 'Todas esas parejas están alineadas: forman la recta vertical $x = ' + FT(xf) + '$.');
          h += fig(S.plano({
            W: 820, H: 560,
            rectas: [{ a: r.a, b: r.b, c: r.c, color: COL.azul, etiqueta: 'x = ' + S.etq(num(xf), 3) }],
            puntos: tv0.puntos.map(function (p, k) { return { x: p.x, y: p.y, etiqueta: 'P' + (k + 1), color: COL.rojo }; }),
            titulo: 'La ecuación es una recta vertical',
            label: 'Recta vertical asociada a la ecuación',
            cap: 'Cada punto marcado es una de las infinitas soluciones.'
          }));
          return h;
        }

        var m = r.a.opuesto().entre(r.b), n = r.c.entre(r.b);
        h += S.paso(1, 'Despejamos $y$ para poder ir dando valores a $x$: pasamos el término en $x$ al otro miembro ' +
          'y dividimos entre el coeficiente de $y$.' +
          KD('y = \\dfrac{' + FT(r.c) + ' - ' + (esCero(r.a) ? '0' : (FT(r.a) + 'x')) + '}{' + FT(r.b) + '} \\quad\\Longrightarrow\\quad ' +
            S.explicitaTex(r)));
        h += S.kvs([
          'pendiente m = ' + K(FT(m)),
          'ordenada en el origen n = ' + K(FT(n)),
          S.badge('forma explícita y = m x + n', 'info')
        ]);

        var tv = tablaValores(r, xs);
        var filas = tv.puntos.map(function (p) {
          return [
            '$' + FT(p.x) + '$',
            '$y = ' + S.explicitaTex(r).replace('y = ', '').replace(/x/g, '(' + FT(p.x) + ')') + '$',
            '$' + FT(p.y) + '$',
            '$' + S.puntoTex(p.x, p.y) + '$'
          ];
        });
        h += S.paso(2, 'Damos valores enteros a $x$ y calculamos la $y$ correspondiente. ' +
          'Cada fila es una solución distinta de la ecuación.' +
          S.tabla(['x', 'Sustituimos', 'y', 'Solución (x, y)'], filas, { thPrimera: false }));

        h += S.paso(3, 'Al llevar esos puntos al plano se ve que están alineados: el conjunto de <b>todas</b> ' +
          'las soluciones de la ecuación es una recta. Por eso una sola ecuación no determina un punto, ' +
          'y hace falta una segunda ecuación para tener un sistema con solución única.',
          'ap-paso-clave');

        h += fig(S.plano({
          W: 820, H: 560,
          rectas: [{ a: r.a, b: r.b, c: r.c, color: COL.azul, etiqueta: etiquetaRecta(r) }],
          puntos: tv.puntos.map(function (p, k) {
            return { x: p.x, y: p.y, etiqueta: 'P' + (k + 1), color: COL.rojo };
          }),
          leyenda: [{ color: COL.azul, texto: 'soluciones de la ecuación' }],
          titulo: 'Las infinitas soluciones forman una recta',
          label: 'Recta de soluciones de la ecuación',
          cap: 'Los puntos de la tabla son solo siete de los infinitos puntos de la recta.'
        }));
        return h;
      }));
  };

  /* ==================================================================
     3 · sistemaLab · Laboratorio de sistemas 2×2
     ================================================================== */
  R.sistemaLab = function (node) {
    S.shell(node, 'Laboratorio de sistemas 2×2',
      'Mueve los deslizadores de los seis coeficientes del sistema ' +
      '$\\left\\{\\begin{array}{l} a x + b y = c \\\\ a\'x + b\'y = c\' \\end{array}\\right.$ ' +
      'y observa a la vez tres cosas: la clasificación del sistema, la comparación de las razones ' +
      '$a/a\'$, $b/b\'$ y $c/c\'$, y la posición de las dos rectas. ' +
      'Todos los coeficientes son enteros entre −6 y 6. ' +
      'Prueba a dejar iguales las razones de $x$ e $y$ pero distinta la de los términos independientes.',
      [
        { id: 'a1', label: 'a', type: 'range', value: 1, min: -6, max: 6, step: 1 },
        { id: 'b1', label: 'b', type: 'range', value: 1, min: -6, max: 6, step: 1 },
        { id: 'c1', label: 'c', type: 'range', value: 5, min: -12, max: 12, step: 1 },
        { id: 'a2', label: "a'", type: 'range', value: 1, min: -6, max: 6, step: 1 },
        { id: 'b2', label: "b'", type: 'range', value: -1, min: -6, max: 6, step: 1 },
        { id: 'c2', label: "c'", type: 'range', value: 1, min: -12, max: 12, step: 1 },
        escenarios([
          { txt: 'secantes (SCD)', tit: 'Razones de x e y distintas', set: { a1: 1, b1: 1, c1: 5, a2: 1, b2: -1, c2: 1 } },
          { txt: 'paralelas (SI)', tit: 'Mismas razones en x e y, distinta en c', set: { a1: 1, b1: 2, c1: 4, a2: 2, b2: 4, c2: 10 } },
          { txt: 'coincidentes (SCI)', tit: 'Las tres razones iguales', set: { a1: 1, b1: 2, c1: 4, a2: 2, b2: 4, c2: 8 } },
          { txt: 'una recta horizontal', set: { a1: 0, b1: 1, c1: 3, a2: 2, b2: -1, c2: 1 } },
          { txt: 'una recta vertical', set: { a1: 1, b1: 0, c1: 2, a2: 1, b2: 3, c2: 5 } },
          { txt: 'solución fraccionaria', set: { a1: 2, b1: 3, c1: 4, a2: 5, b2: -1, c2: 2 } },
          { txt: 'ambas por el origen', tit: 'Sistema homogéneo: siempre compatible', set: { a1: 1, b1: 2, c1: 0, a2: 3, b2: -1, c2: 0 } }
        ])
      ],
      guarda(function (v) {
        var a1 = S.entero(v.a1, -6, 6, 'El coeficiente a'), b1 = S.entero(v.b1, -6, 6, 'El coeficiente b');
        var c1 = S.entero(v.c1, -12, 12, 'El término independiente c');
        var a2 = S.entero(v.a2, -6, 6, "El coeficiente a'"), b2 = S.entero(v.b2, -6, 6, "El coeficiente b'");
        var c2 = S.entero(v.c2, -12, 12, "El término independiente c'");
        if (a1 === 0 && b1 === 0) {
          throw Error('En la primera ecuación, a y b no pueden ser 0 a la vez: 0x + 0y = c no es una recta. ' +
            'Mueve el deslizador de a o el de b.');
        }
        if (a2 === 0 && b2 === 0) {
          throw Error("En la segunda ecuación, a' y b' no pueden ser 0 a la vez: 0x + 0y = c' no es una recta. " +
            "Mueve el deslizador de a' o el de b'.");
        }
        var A = S.matDe([[a1, b1], [a2, b2]]), b = [F(c1), F(c2)];
        var d = S.discute(A, b, ['x', 'y']);
        var s = { A: A, b: b };

        var h = S.expr('Sistema', S.sisTex(A, b, ['x', 'y']));
        h += S.kvs([badgeTipo(d.tipo), nombreGeom(d.tipo),
          'rg(A) = ' + K(String(d.rA)), 'rg(A|B) = ' + K(String(d.rAb)), 'incógnitas n = ' + K('2')]);

        function razon(p, q) {
          if (q === 0) return p === 0 ? '<span class="ap-note">0/0 (indeterminada)</span>' : '<span class="ap-note">no se puede dividir entre 0</span>';
          return K(FT(new Frac(p, q)));
        }
        h += S.paso(1, 'Comparamos los coeficientes de las dos ecuaciones término a término.' +
          S.tabla(['Razón', 'Cociente', 'Valor'], [
            ['$a/a\'$', K(a1 + ' / ' + a2), razon(a1, a2)],
            ['$b/b\'$', K(b1 + ' / ' + b2), razon(b1, b2)],
            ['$c/c\'$', K(c1 + ' / ' + c2), razon(c1, c2)]
          ], { thPrimera: false }) +
          nota('Cuando algún denominador es 0 la razón no se puede escribir: por eso conviene comparar con ' +
            '<b>productos cruzados</b>, que siempre funcionan.'));

        var cx = a1 * b2 - a2 * b1;
        var cy = b1 * c2 - b2 * c1;
        var cz = a1 * c2 - a2 * c1;
        h += S.paso(2, 'Productos cruzados (equivalen a comparar las razones sin dividir):' +
          KD('a b\' - a\'b = ' + cx + ', \\qquad a c\' - a\'c = ' + cz + ', \\qquad b c\' - b\'c = ' + cy) +
          (cx !== 0
            ? 'Como $ab\' - a\'b \\neq 0$, las razones $a/a\'$ y $b/b\'$ son <b>distintas</b>: las rectas se cortan.'
            : (cy === 0 && cz === 0
              ? 'Los tres productos cruzados son $0$: las tres razones coinciden y las dos ecuaciones son la <b>misma recta</b>.'
              : 'Las razones de $x$ e $y$ coinciden pero la de los términos independientes no: rectas <b>paralelas</b> distintas.')));

        var conclusion;
        if (d.tipo === 'SCD') {
          conclusion = 'Como $\\dfrac{a}{a\'} \\neq \\dfrac{b}{b\'}$, el sistema es <b>compatible determinado</b>: ' +
            'una única solución, ' + K(S.puntoTex(d.sol[0], d.sol[1])) + '.';
        } else if (d.tipo === 'SCI') {
          conclusion = 'Como $\\dfrac{a}{a\'} = \\dfrac{b}{b\'} = \\dfrac{c}{c\'}$, la segunda ecuación es la primera ' +
            'multiplicada por un número: sobra información y el sistema es <b>compatible indeterminado</b>.';
        } else {
          conclusion = 'Como $\\dfrac{a}{a\'} = \\dfrac{b}{b\'} \\neq \\dfrac{c}{c\'}$, las dos ecuaciones se contradicen: ' +
            'el sistema es <b>incompatible</b>.';
        }
        h += S.paso(3, conclusion + '<br>' + d.texto, 'ap-paso-clave');
        if (d.tipo === 'SCD') h += S.expr('Solución', S.puntoTex(d.sol[0], d.sol[1]));
        if (d.tipo === 'SCI') h += S.expr('Soluciones (con un parámetro)', d.param.texParam);
        if (d.tipo === 'SI') h += S.expr('Conjunto de soluciones', '\\varnothing');

        var puntos = [];
        if (d.tipo === 'SCD') puntos.push({ x: d.sol[0], y: d.sol[1], etiqueta: S.puntoTex ? ('(' + S.etq(num(d.sol[0]), 3) + ', ' + S.etq(num(d.sol[1]), 3) + ')') : '', color: COL.verde });
        h += fig(S.plano({
          W: 820, H: 560,
          rectas: rectasDe(s),
          puntos: puntos,
          leyenda: leyenda2(s),
          titulo: nombreGeom(d.tipo),
          label: 'Las dos rectas del sistema',
          cap: 'Mueve los deslizadores y observa cómo cambia la posición relativa de las rectas.'
        }));
        return h;
      }));
  };

  /* ==================================================================
     4 · equivalentes · Sistemas equivalentes
     ================================================================== */
  var TRANS = [
    { value: 'mult1', label: 'Multiplicar la ecuación (1) por k' },
    { value: 'mult2', label: 'Multiplicar la ecuación (2) por k' },
    { value: 'suma', label: 'Sustituir (2) por (2) + k·(1)' },
    { value: 'resta', label: 'Sustituir (2) por (2) − k·(1)' },
    { value: 'inter', label: 'Intercambiar las dos ecuaciones' },
    { value: 'cero', label: '⚠ PROHIBIDA: multiplicar la ecuación (1) por 0' },
    { value: 'copia', label: '⚠ PROHIBIDA: sustituir (2) por una copia de (1)' }
  ];

  R.equivalentes = function (node) {
    S.shell(node, 'Sistemas equivalentes',
      'Dos sistemas son <b>equivalentes</b> cuando tienen exactamente las mismas soluciones. ' +
      COMO_ECU + '<br>' +
      'Elige una transformación y un número $k$ (' + COMO_NUM + ') y compara la solución antes y después. ' +
      'Las dos últimas transformaciones de la lista están marcadas como prohibidas: compruébalo tú mismo.',
      [
        { id: 'e1', label: 'Ecuación (1)', type: 'text', value: '2x+3y=12', ancho: '13rem' },
        { id: 'e2', label: 'Ecuación (2)', type: 'text', value: 'x-y=1', ancho: '13rem' },
        { id: 'op', label: 'Transformación', type: 'select', options: TRANS, value: 'mult1', ancho: '17rem' },
        { id: 'k', label: 'k', type: 'text', value: '3', ancho: '6rem' },
        escenarios([
          { txt: 'multiplicar (1) por 3', set: { e1: '2x+3y=12', e2: 'x-y=1', op: 'mult1', k: '3' } },
          { txt: 'multiplicar (2) por 1/2', set: { e1: '2x+3y=12', e2: 'x-y=1', op: 'mult2', k: '1/2' } },
          { txt: '(2) + 2·(1)', set: { e1: '2x+3y=12', e2: 'x-y=1', op: 'suma', k: '2' } },
          { txt: '(2) − 1·(1)', set: { e1: '2x+3y=12', e2: 'x-y=1', op: 'resta', k: '1' } },
          { txt: 'intercambiar ecuaciones', set: { e1: '2x+3y=12', e2: 'x-y=1', op: 'inter', k: '1' } },
          { txt: '⚠ multiplicar (1) por 0', tit: 'Se pierde una ecuación', set: { e1: '2x+3y=12', e2: 'x-y=1', op: 'cero', k: '0' } },
          { txt: '⚠ duplicar la ecuación (1)', tit: 'Se pierde información', set: { e1: '2x+3y=12', e2: 'x-y=1', op: 'copia', k: '1' } },
          { txt: 'sistema incompatible', set: { e1: 'x+y=2', e2: '2x+2y=7', op: 'mult1', k: '2' } }
        ])
      ],
      guarda(function (v) {
        var s = sis2(v.e1, v.e2);
        var op = String(v.op || 'mult1');
        var k = F(String(v.k || '1').trim() === '' ? '1' : v.k);
        var f1 = [s.A.a[0][0], s.A.a[0][1], F(s.b[0])];
        var f2 = [s.A.a[1][0], s.A.a[1][1], F(s.b[1])];
        var g1, g2, texto, prohibida = false;

        function esc1(fi, kk) { return [fi[0].por(kk), fi[1].por(kk), fi[2].por(kk)]; }
        function sum(fa, fb) { return [fa[0].mas(fb[0]), fa[1].mas(fb[1]), fa[2].mas(fb[2])]; }

        if (op === 'mult1') {
          if (esCero(k)) { prohibida = true; }
          g1 = esc1(f1, k); g2 = f2.slice();
          texto = 'Multiplicamos los <b>dos miembros</b> de la ecuación (1) por $k = ' + FT(k) + '$. ' +
            'Multiplicar una ecuación por un número distinto de cero no cambia sus soluciones, ' +
            'porque la operación se puede deshacer dividiendo entre $k$.';
        } else if (op === 'mult2') {
          if (esCero(k)) { prohibida = true; }
          g1 = f1.slice(); g2 = esc1(f2, k);
          texto = 'Multiplicamos los dos miembros de la ecuación (2) por $k = ' + FT(k) + '$.';
        } else if (op === 'suma') {
          g1 = f1.slice(); g2 = sum(f2, esc1(f1, k));
          texto = 'Sustituimos la ecuación (2) por $(2) + ' + FT(k) + '\\cdot(1)$. ' +
            'Si un punto cumple (1) y (2), también cumple esa suma; y se puede volver atrás restando, ' +
            'así que el sistema nuevo tiene las mismas soluciones.';
        } else if (op === 'resta') {
          g1 = f1.slice(); g2 = sum(f2, esc1(f1, k.opuesto()));
          texto = 'Sustituimos la ecuación (2) por $(2) - ' + FT(k) + '\\cdot(1)$. Es la misma idea que sumar, ' +
            'con el signo cambiado: sigue siendo reversible.';
        } else if (op === 'inter') {
          g1 = f2.slice(); g2 = f1.slice();
          texto = 'Intercambiamos el orden de las dos ecuaciones. El orden en que se escriben no influye ' +
            'en absoluto: el conjunto de soluciones es el mismo.';
        } else if (op === 'cero') {
          prohibida = true;
          g1 = esc1(f1, new Frac(0)); g2 = f2.slice();
          texto = 'Multiplicamos la ecuación (1) por $0$. La ecuación se convierte en $0 = 0$, ' +
            'que <b>no dice nada</b>: hemos borrado una condición. Esta transformación está prohibida.';
        } else {
          prohibida = true;
          g1 = f1.slice(); g2 = f1.slice();
          texto = 'Sustituimos la ecuación (2) por una copia de la (1). La información de la segunda ecuación ' +
            'desaparece: esta transformación tampoco es válida.';
        }

        var A2, b2, valido = true, dNuevo = null;
        try {
          A2 = S.matDe([[g1[0], g1[1]], [g2[0], g2[1]]]);
          b2 = [g1[2], g2[2]];
          dNuevo = S.discute(A2, b2, ['x', 'y']);
        } catch (err) { valido = false; }

        var dViejo = S.discute(s.A, s.b, ['x', 'y']);

        var h = enun('Comparamos el sistema de partida con el sistema transformado.');
        h += rejilla2([
          tarjeta('Sistema original', KD(S.sisTex(s.A, s.b, ['x', 'y'])) +
            S.kvs([badgeTipo(dViejo.tipo)]) +
            (dViejo.tipo === 'SCD' ? S.expr('Solución', S.puntoTex(dViejo.sol[0], dViejo.sol[1]))
              : (dViejo.tipo === 'SCI' ? S.expr('Soluciones', dViejo.param.texParam) : S.expr('Soluciones', '\\varnothing')))),
          tarjeta('Sistema transformado',
            (valido ? KD(S.sisTex(A2, b2, ['x', 'y'])) : '<p class="ap-note">El resultado ya no es un sistema legible.</p>') +
            (dNuevo ? S.kvs([badgeTipo(dNuevo.tipo)]) : '') +
            (dNuevo ? (dNuevo.tipo === 'SCD' ? S.expr('Solución', S.puntoTex(dNuevo.sol[0], dNuevo.sol[1]))
              : (dNuevo.tipo === 'SCI' ? S.expr('Soluciones', dNuevo.param.texParam) : S.expr('Soluciones', '\\varnothing'))) : ''),
            prohibida ? 'ap-card-ko' : 'ap-card-ok')
        ]);

        h += S.paso(1, texto);

        var mismas = false;
        if (dNuevo) {
          if (dViejo.tipo !== dNuevo.tipo) mismas = false;
          else if (dViejo.tipo === 'SCD') {
            mismas = igualF(dViejo.sol[0], dNuevo.sol[0]) && igualF(dViejo.sol[1], dNuevo.sol[1]);
          } else mismas = (dViejo.tipo === 'SI') ? true : (dViejo.param.texParam === dNuevo.param.texParam);
        }

        h += S.paso(2, mismas
          ? S.badge('los dos sistemas son EQUIVALENTES', 'si') +
          nota('El conjunto de soluciones no ha cambiado. Esta es la idea que sostiene todos los métodos ' +
            'de resolución: se va sustituyendo el sistema por otro equivalente más sencillo hasta que la ' +
            'solución se lee de un vistazo.')
          : S.badge('los dos sistemas NO son equivalentes', 'no') +
          nota('El conjunto de soluciones ha cambiado, así que la transformación no es válida. ' +
            'Al perder una ecuación el sistema se vuelve compatible indeterminado: admite soluciones ' +
            'que el original no tenía.'),
          mismas ? '' : 'ap-paso-avi');

        if (prohibida) {
          h += S.paso(3, 'Regla que hay que recordar: solo son transformaciones válidas ' +
            '<b>multiplicar una ecuación por un número distinto de 0</b>, ' +
            '<b>sumar a una ecuación un múltiplo de otra</b> e ' +
            '<b>intercambiar ecuaciones</b>. Todo lo demás puede perder o inventar soluciones.',
            'ap-paso-clave');
        }

        var rectas = rectasDe(s, '(1) original', '(2) original');
        if (valido) {
          try {
            if (!(esCero(g1[0]) && esCero(g1[1]))) {
              rectas.push({ a: g1[0], b: g1[1], c: g1[2], color: COL.verde, etiqueta: "(1')", dash: '8 6', ancho: 3 });
            }
            if (!(esCero(g2[0]) && esCero(g2[1]))) {
              rectas.push({ a: g2[0], b: g2[1], c: g2[2], color: COL.morado, etiqueta: "(2')", dash: '8 6', ancho: 3 });
            }
          } catch (err2) { /* recta degenerada: no se dibuja */ }
        }
        h += fig(S.plano({
          W: 820, H: 560,
          rectas: fundeEtiquetas(rectas),
          puntos: dViejo.tipo === 'SCD' ? [{ x: dViejo.sol[0], y: dViejo.sol[1], etiqueta: 'solución original', color: COL.verde }] : [],
          leyenda: [
            { color: COL.azul, texto: 'ecuación (1)' },
            { color: COL.rojo, texto: 'ecuación (2)' },
            { color: COL.verde, texto: "ecuación (1')", dash: '8 6' },
            { color: COL.morado, texto: "ecuación (2')", dash: '8 6' }
          ],
          titulo: 'Antes y después de la transformación',
          label: 'Rectas del sistema original y del transformado',
          cap: 'Si la transformación es válida, las rectas nuevas siguen pasando por el mismo punto de corte.'
        }));
        return h;
      }));
  };

  /* ==================================================================
     5 · sustitucion · Método de sustitución
     ================================================================== */
  function comentarioEleccion(s, iv, e0) {
    var c = s.A.a[e0][iv], vars = ['x', 'y'];
    if (esCero(c)) {
      return nota('En esa ecuación la incógnita elegida no aparece, así que el applet ha cambiado la elección por ti.');
    }
    if (c.d === 1n && (c.n === 1n || c.n === -1n)) {
      return nota('Buena elección: el coeficiente de $' + vars[iv] + '$ en la ecuación (' + (e0 + 1) +
        ') es $' + FT(c) + '$, así que al despejar <b>no aparecen fracciones</b>. Siempre que puedas, ' +
        'despeja una incógnita cuyo coeficiente sea $1$ o $-1$.');
    }
    /* ¿había alguna opción mejor? */
    var mejor = null, i, j;
    for (i = 0; i < 2; i++) {
      for (j = 0; j < 2; j++) {
        var q = s.A.a[i][j];
        if (!esCero(q) && q.d === 1n && (q.n === 1n || q.n === -1n)) { mejor = { ec: i, va: j }; }
      }
    }
    if (mejor) {
      return nota('Se puede hacer, pero al despejar $' + vars[iv] + '$ en la ecuación (' + (e0 + 1) +
        ') aparecen denominadores. Habría sido más cómodo despejar $' + vars[mejor.va] +
        '$ en la ecuación (' + (mejor.ec + 1) + '), cuyo coeficiente es $' + FT(s.A.a[mejor.ec][mejor.va]) + '$.');
    }
    return nota('En este sistema ningún coeficiente es $1$ ni $-1$: las fracciones son inevitables ' +
      'con la sustitución, y quizá convenga el método de reducción.');
  }

  R.sustitucion = function (node) {
    S.shell(node, 'Método de sustitución',
      COMO_ECU + '<br>' +
      'Elige qué incógnita quieres despejar y en cuál de las dos ecuaciones. ' +
      'El applet despeja, sustituye en la otra ecuación, resuelve la ecuación de una incógnita que ' +
      'resulta y vuelve atrás. Prueba las cuatro combinaciones: todas llevan a la misma solución, ' +
      'pero unas dan cuentas mucho más limpias que otras.',
      [
        { id: 'e1', label: 'Ecuación (1)', type: 'text', value: '2x+3y=12', ancho: '13rem' },
        { id: 'e2', label: 'Ecuación (2)', type: 'text', value: 'x-y=1', ancho: '13rem' },
        { id: 'des', label: 'Despejar', type: 'select', options: [{ value: 'x', label: 'la incógnita x' }, { value: 'y', label: 'la incógnita y' }], value: 'x', ancho: '11rem' },
        { id: 'ec', label: 'En la ecuación', type: 'select', options: [{ value: '1', label: '(1)' }, { value: '2', label: '(2)' }], value: '2', ancho: '8rem' },
        escenarios([
          { txt: 'elección cómoda: x en (2)', tit: 'Coeficiente 1', set: { e1: '2x+3y=12', e2: 'x-y=1', des: 'x', ec: '2' } },
          { txt: 'elección incómoda: x en (1)', tit: 'Aparecen fracciones', set: { e1: '2x+3y=12', e2: 'x-y=1', des: 'x', ec: '1' } },
          { txt: 'despejar y en (2)', set: { e1: '2x+3y=12', e2: 'x-y=1', des: 'y', ec: '2' } },
          { txt: 'coeficientes decimales', set: { e1: '0,5x+y=3', e2: 'x-2y=-2', des: 'y', ec: '1' } },
          { txt: 'con fracciones', set: { e1: 'x/2+y/3=1', e2: 'x-y=1', des: 'x', ec: '2' } },
          { txt: 'incompatible (SI)', set: { e1: 'x+y=2', e2: '2x+2y=7', des: 'x', ec: '1' } },
          { txt: 'indeterminado (SCI)', set: { e1: 'x+y=4', e2: '2x+2y=8', des: 'x', ec: '1' } },
          { txt: 'falta una incógnita', tit: 'El applet corrige la elección', set: { e1: 'y=4', e2: '2x-y=0', des: 'x', ec: '1' } }
        ])
      ],
      guarda(function (v) {
        var s = sis2(v.e1, v.e2);
        var des = (v.des === 'y') ? 'y' : 'x';
        var desde = (String(v.ec) === '2') ? 1 : 0;
        var res = S.sustitucion(s.A, s.b, { despejar: des, desde: desde, vars: ['x', 'y'] });

        var h = enun('Idea del método: <b>despejar una incógnita</b> en una ecuación y <b>llevar esa expresión</b> ' +
          'a la otra, para quedarnos con una sola incógnita.');
        h += S.kvs([
          'incógnita despejada: ' + K(res.despejada),
          'ecuación usada: ' + K('(' + (res.ecuacion || desde + 1) + ')'),
          badgeTipo(res.tipo)
        ]);
        if (res.aviso) h += '<div class="mx-info">' + res.aviso + '</div>';
        h += pasosHTML(res);
        h += finalHTML(res, s);
        h += comentarioEleccion(s, des === 'y' ? 1 : 0, (res.ecuacion ? res.ecuacion - 1 : desde));

        h += fig(S.plano({
          W: 820, H: 560,
          rectas: rectasDe(s),
          puntos: res.tipo === 'SCD' ? [{ x: res.sol[0], y: res.sol[1], etiqueta: '(' + S.etq(num(res.sol[0]), 3) + ', ' + S.etq(num(res.sol[1]), 3) + ')', color: COL.verde }] : [],
          leyenda: leyenda2(s),
          titulo: 'Comprobación gráfica',
          label: 'Rectas del sistema y solución obtenida por sustitución',
          cap: 'El punto obtenido con la cuenta es exactamente el corte de las dos rectas.'
        }));
        return h;
      }));
  };

  /* ==================================================================
     6 · igualacion · Método de igualación
     ================================================================== */
  R.igualacion = function (node) {
    S.shell(node, 'Método de igualación',
      COMO_ECU + '<br>' +
      'Elige la incógnita que se despeja <b>en las dos ecuaciones</b>. Como las dos expresiones valen ' +
      'lo mismo (esa incógnita), se pueden igualar entre sí y desaparece una incógnita. ' +
      'Este método es especialmente cómodo cuando el sistema ya viene con una incógnita despejada, ' +
      'como $y = 2x-1$ e $y = -x+5$.',
      [
        { id: 'e1', label: 'Ecuación (1)', type: 'text', value: '2x+3y=12', ancho: '13rem' },
        { id: 'e2', label: 'Ecuación (2)', type: 'text', value: 'x-y=1', ancho: '13rem' },
        { id: 'des', label: 'Despejar en ambas', type: 'select', options: [{ value: 'x', label: 'la incógnita x' }, { value: 'y', label: 'la incógnita y' }], value: 'y', ancho: '13rem' },
        escenarios([
          { txt: 'despejar y', set: { e1: '2x+3y=12', e2: 'x-y=1', des: 'y' } },
          { txt: 'despejar x', set: { e1: '2x+3y=12', e2: 'x-y=1', des: 'x' } },
          { txt: 'ya despejadas: y=2x-1, y=-x+5', tit: 'El caso ideal para igualar', set: { e1: 'y=2x-1', e2: 'y=-x+5', des: 'y' } },
          { txt: 'con fracciones', set: { e1: 'x/2+y/3=1', e2: '2x-y=4', des: 'y' } },
          { txt: 'decimales con coma', set: { e1: '0,5x+y=3', e2: 'x-2y=-2', des: 'y' } },
          { txt: 'incompatible (SI)', set: { e1: 'x+y=2', e2: '2x+2y=7', des: 'y' } },
          { txt: 'indeterminado (SCI)', set: { e1: 'x+y=4', e2: '2x+2y=8', des: 'y' } }
        ])
      ],
      guarda(function (v) {
        var s = sis2(v.e1, v.e2);
        var des = (v.des === 'x') ? 'x' : 'y';
        var res = S.igualacion(s.A, s.b, { despejar: des, vars: ['x', 'y'] });

        var h = enun('Idea del método: despejar <b>la misma incógnita</b> en las dos ecuaciones e igualar ' +
          'las dos expresiones obtenidas.');
        h += S.kvs(['incógnita despejada en las dos: ' + K(res.despejada), badgeTipo(res.tipo)]);
        if (res.aviso) h += '<div class="mx-info">' + res.aviso + '</div>';
        h += pasosHTML(res);
        h += finalHTML(res, s);
        h += nota('El paso clave es el segundo: como las dos expresiones son iguales a $' + res.despejada +
          '$, tienen que ser iguales entre sí. Ahí es donde desaparece una incógnita.');

        h += fig(S.plano({
          W: 820, H: 560,
          rectas: rectasDe(s),
          puntos: res.tipo === 'SCD' ? [{ x: res.sol[0], y: res.sol[1], etiqueta: '(' + S.etq(num(res.sol[0]), 3) + ', ' + S.etq(num(res.sol[1]), 3) + ')', color: COL.verde }] : [],
          leyenda: leyenda2(s),
          titulo: 'Comprobación gráfica',
          label: 'Rectas del sistema y solución obtenida por igualación',
          cap: 'Igualar las dos expresiones despejadas equivale a buscar la altura común de las dos rectas.'
        }));
        return h;
      }));
  };

  /* ==================================================================
     7 · reduccion · Método de reducción
     ================================================================== */
  R.reduccion = function (node) {
    S.shell(node, 'Método de reducción',
      COMO_ECU + '<br>' +
      'Elige qué incógnita quieres <b>hacer desaparecer</b>. El applet calcula el m.c.m. de sus dos ' +
      'coeficientes, multiplica cada ecuación por el número necesario para que queden opuestos y suma ' +
      'las dos ecuaciones. Es el método más rápido cuando los coeficientes de una incógnita ya son ' +
      'iguales u opuestos, como en $3x+2y=7$ y $3x-2y=1$.',
      [
        { id: 'e1', label: 'Ecuación (1)', type: 'text', value: '2x+3y=12', ancho: '13rem' },
        { id: 'e2', label: 'Ecuación (2)', type: 'text', value: '5x-2y=11', ancho: '13rem' },
        { id: 'eli', label: 'Eliminar', type: 'select', options: [{ value: 'x', label: 'la incógnita x' }, { value: 'y', label: 'la incógnita y' }], value: 'y', ancho: '11rem' },
        escenarios([
          { txt: 'eliminar y (m.c.m. de 3 y 2)', set: { e1: '2x+3y=12', e2: '5x-2y=11', eli: 'y' } },
          { txt: 'eliminar x (m.c.m. de 2 y 5)', set: { e1: '2x+3y=12', e2: '5x-2y=11', eli: 'x' } },
          { txt: 'coeficientes ya opuestos', tit: 'Basta con sumar', set: { e1: '3x+2y=7', e2: '3x-2y=1', eli: 'y' } },
          { txt: 'coeficientes iguales', tit: 'Basta con restar', set: { e1: 'x+4y=9', e2: 'x-2y=3', eli: 'x' } },
          { txt: 'con fracciones', set: { e1: 'x/2+y/3=1', e2: '2x-y=4', eli: 'y' } },
          { txt: 'decimales con coma', set: { e1: '0,5x+y=3', e2: 'x-2y=-2', eli: 'x' } },
          { txt: 'incompatible (SI)', set: { e1: 'x+y=2', e2: '2x+2y=7', eli: 'x' } },
          { txt: 'indeterminado (SCI)', set: { e1: 'x+y=4', e2: '2x+2y=8', eli: 'x' } }
        ])
      ],
      guarda(function (v) {
        var s = sis2(v.e1, v.e2);
        var eli = (v.eli === 'x') ? 'x' : 'y';
        var res = S.reduccion(s.A, s.b, { eliminar: eli, vars: ['x', 'y'] });

        var h = enun('Idea del método: multiplicar cada ecuación por un número para que los coeficientes de ' +
          'una incógnita queden <b>opuestos</b>; al sumar, esa incógnita se va.');
        h += S.kvs([
          'incógnita eliminada: ' + K(res.eliminada),
          'multiplicador de (1): ' + K(FT(res.m1)),
          'multiplicador de (2): ' + K(FT(res.m2)),
          badgeTipo(res.tipo)
        ]);
        if (res.aviso) h += '<div class="mx-info">' + res.aviso + '</div>';
        h += pasosHTML(res);
        h += finalHTML(res, s);
        h += nota('Multiplicar una ecuación entera por un número distinto de cero y sumar dos ecuaciones son ' +
          'transformaciones que dan un sistema <b>equivalente</b>: por eso el resultado es válido. ' +
          'Este mismo mecanismo, repetido de forma ordenada, es el método de Gauss.');

        h += fig(S.plano({
          W: 820, H: 560,
          rectas: rectasDe(s),
          /* el rótulo del corte se separa hacia abajo para no pisar al de la recta (2) */
          puntos: res.tipo === 'SCD' ? [{
            x: res.sol[0], y: res.sol[1],
            etiqueta: '(' + S.etq(num(res.sol[0]), 3) + ', ' + S.etq(num(res.sol[1]), 3) + ')',
            color: COL.verde, dx: 14, dy: 26
          }] : [],
          leyenda: leyenda2(s),
          titulo: 'Comprobación gráfica',
          label: 'Rectas del sistema y solución obtenida por reducción',
          cap: 'La ecuación que queda tras sumar corta a las dos rectas justo en su punto común.'
        }));
        return h;
      }));
  };

  /* ==================================================================
     8 · comparaMetodos · Los tres métodos en paralelo
     ================================================================== */
  function resumenMetodo(res, titulo, clase) {
    var cuerpo = '';
    /* El texto y la fórmula van en bloques distintos: si no, se leen
       pegados («Despejamos y.y=−5/(−5/2)=2»). */
    res.pasos.forEach(function (p, i) {
      cuerpo += '<div class="sys-min-paso"><span class="sys-min-n">' + (i + 1) + '</span>' +
        '<div class="sys-min-cuerpo">' +
        '<div class="sys-min-txt">' + p.desc + '</div>' +
        (p.tex ? '<div class="sys-min-tex">' + KD(p.tex) + '</div>' : '') +
        '</div></div>';
    });
    cuerpo += '<div class="sys-min-fin">' +
      '<div class="sys-min-txt">Solución del sistema</div>' +
      '<div class="sys-min-tex">' +
      (res.tipo === 'SCD'
        ? KD(S.puntoTex(res.sol[0], res.sol[1]))
        : (res.tipo === 'SCI' ? 'infinitas soluciones' : 'sin solución')) + '</div></div>';
    return tarjeta(titulo + ' · ' + res.pasos.length + ' pasos', cuerpo, clase);
  }

  R.comparaMetodos = function (node) {
    S.shell(node, 'Los tres métodos en paralelo',
      COMO_ECU + '<br>' +
      'El mismo sistema se resuelve a la vez por <b>sustitución</b>, <b>igualación</b> y <b>reducción</b>. ' +
      'Los tres dan siempre la misma solución (si la hay): lo que cambia es la comodidad de las cuentas. ' +
      'Al final el applet razona cuál conviene en ese sistema concreto.',
      [
        { id: 'e1', label: 'Ecuación (1)', type: 'text', value: '2x+3y=12', ancho: '13rem' },
        { id: 'e2', label: 'Ecuación (2)', type: 'text', value: 'x-y=1', ancho: '13rem' },
        escenarios([
          { txt: 'hay un coeficiente 1', tit: 'Gana la sustitución', set: { e1: '2x+3y=12', e2: 'x-y=1' } },
          { txt: 'coeficientes opuestos', tit: 'Gana la reducción', set: { e1: '3x+2y=7', e2: '5x-2y=1' } },
          { txt: 'ya despejadas', tit: 'Gana la igualación', set: { e1: 'y=2x-1', e2: 'y=-x+5' } },
          { txt: 'sin coeficientes cómodos', set: { e1: '2x+3y=4', e2: '5x-7y=1' } },
          { txt: 'con fracciones', set: { e1: 'x/2+y/3=1', e2: '2x-y=4' } },
          { txt: 'decimales con coma', set: { e1: '0,5x+y=3', e2: 'x-2y=-2' } },
          { txt: 'incompatible (SI)', set: { e1: 'x+y=2', e2: '2x+2y=7' } },
          { txt: 'indeterminado (SCI)', set: { e1: 'x+y=4', e2: '2x+2y=8' } }
        ])
      ],
      guarda(function (v) {
        var s = sis2(v.e1, v.e2);
        var d = S.discute(s.A, s.b, ['x', 'y']);
        var h = S.expr('Sistema', S.sisTex(s.A, s.b, ['x', 'y']));
        h += S.kvs([badgeTipo(d.tipo), nombreGeom(d.tipo)]);

        var cartas = [], resS = null, resI = null, resR = null;
        try { resS = S.sustitucion(s.A, s.b, { despejar: 'x', vars: ['x', 'y'] }); } catch (e1) { resS = null; }
        try { resI = S.igualacion(s.A, s.b, { despejar: 'y', vars: ['x', 'y'] }); } catch (e2) { resI = null; }
        try { resR = S.reduccion(s.A, s.b, { eliminar: 'y', vars: ['x', 'y'] }); } catch (e3) { resR = null; }

        cartas.push(resS ? resumenMetodo(resS, 'Sustitución', 'sys-col') :
          tarjeta('Sustitución', '<p class="ap-note">No se puede aplicar a este sistema.</p>', 'sys-col'));
        cartas.push(resI ? resumenMetodo(resI, 'Igualación', 'sys-col') :
          tarjeta('Igualación', '<p class="ap-note">No se puede aplicar: la incógnita no aparece en las dos ecuaciones.</p>', 'sys-col'));
        cartas.push(resR ? resumenMetodo(resR, 'Reducción', 'sys-col') :
          tarjeta('Reducción', '<p class="ap-note">No se puede aplicar a este sistema.</p>', 'sys-col'));
        h += rejilla3(cartas);

        var iguales = true, ref = null;
        [resS, resI, resR].forEach(function (r) {
          if (!r) return;
          if (!ref) { ref = r; return; }
          if (r.tipo !== ref.tipo) iguales = false;
          else if (r.tipo === 'SCD' && !(igualF(r.sol[0], ref.sol[0]) && igualF(r.sol[1], ref.sol[1]))) iguales = false;
        });
        h += S.paso(1, iguales
          ? S.badge('los tres métodos coinciden', 'si') +
          nota('No podía ser de otra forma: los tres se limitan a ir sustituyendo el sistema por otro ' +
            'equivalente, y los sistemas equivalentes tienen las mismas soluciones.')
          : S.badge('revisa los datos: los métodos no coinciden', 'no'));

        /* --- recomendación razonada --- */
        var unos = [], i, j, vars = ['x', 'y'];
        for (i = 0; i < 2; i++) for (j = 0; j < 2; j++) {
          var c = s.A.a[i][j];
          if (!esCero(c) && c.d === 1n && (c.n === 1n || c.n === -1n)) unos.push({ ec: i + 1, va: vars[j] });
        }
        var opuestosX = igualF(s.A.a[0][0], s.A.a[1][0].opuesto()) && !esCero(s.A.a[0][0]);
        var opuestosY = igualF(s.A.a[0][1], s.A.a[1][1].opuesto()) && !esCero(s.A.a[0][1]);
        var igualesX = igualF(s.A.a[0][0], s.A.a[1][0]) && !esCero(s.A.a[0][0]);
        var igualesY = igualF(s.A.a[0][1], s.A.a[1][1]) && !esCero(s.A.a[0][1]);
        var yaDespejadas = igualF(absF(s.A.a[0][1]), new Frac(1)) && igualF(absF(s.A.a[1][1]), new Frac(1));

        var reco, motivo;
        if (opuestosX || opuestosY || igualesX || igualesY) {
          reco = 'reducción';
          motivo = 'los coeficientes de $' + ((opuestosX || igualesX) ? 'x' : 'y') + '$ ya son ' +
            ((opuestosX || opuestosY) ? 'opuestos' : 'iguales') + ', así que basta con ' +
            ((opuestosX || opuestosY) ? 'sumar' : 'restar') + ' las dos ecuaciones y no hay que multiplicar por nada.';
        } else if (unos.length) {
          reco = 'sustitución';
          motivo = 'la incógnita $' + unos[0].va + '$ tiene coeficiente $\\pm 1$ en la ecuación (' + unos[0].ec +
            '), así que al despejarla no aparece ningún denominador.';
          if (yaDespejadas) {
            motivo += ' También sería muy cómoda la <b>igualación</b>, porque $y$ se despeja limpiamente en las dos ecuaciones.';
          }
        } else if (yaDespejadas) {
          reco = 'igualación';
          motivo = 'la incógnita $y$ se despeja sin fracciones en las dos ecuaciones, y basta con igualar las dos expresiones.';
        } else {
          reco = 'reducción';
          motivo = 'ningún coeficiente es $1$ ni $-1$: despejar produciría fracciones desde el primer paso, ' +
            'mientras que la reducción trabaja solo con productos y sumas de números enteros.';
        }
        h += S.paso(2, 'En este sistema conviene el método de <b>' + reco + '</b>, porque ' + motivo,
          'ap-paso-clave');
        h += nota('Regla práctica: si alguna incógnita tiene coeficiente $1$ o $-1$, sustitución; ' +
          'si los coeficientes de una incógnita son iguales u opuestos, reducción; ' +
          'si el sistema ya viene con la misma incógnita despejada en las dos ecuaciones, igualación.');

        h += fig(S.plano({
          W: 820, H: 560,
          rectas: rectasDe(s),
          puntos: d.tipo === 'SCD' ? [{ x: d.sol[0], y: d.sol[1], etiqueta: '(' + S.etq(num(d.sol[0]), 3) + ', ' + S.etq(num(d.sol[1]), 3) + ')', color: COL.verde }] : [],
          leyenda: leyenda2(s),
          titulo: 'La misma solución por los tres caminos',
          label: 'Rectas del sistema comparado por los tres métodos',
          cap: 'El resultado geométrico no depende del método elegido.'
        }));
        return h;
      }));
  };

  /* ==================================================================
     9 · metodoGrafico · Método gráfico
     ================================================================== */
  R.metodoGrafico = function (node) {
    S.shell(node, 'Método gráfico',
      COMO_ECU + '<br>' +
      'El applet despeja $y$ en cada ecuación, construye una tabla de valores, dibuja las dos rectas ' +
      'y lee la solución en el punto de corte. Usa la casilla para ver o esconder las tablas y el ' +
      'deslizador para ampliar o reducir la ventana del dibujo. ' +
      'Recuerda que el método gráfico da la solución <b>aproximada</b>: solo es exacta cuando el corte ' +
      'cae sobre un punto de coordenadas enteras.',
      [
        { id: 'e1', label: 'Ecuación (1)', type: 'text', value: 'x+y=5', ancho: '13rem' },
        { id: 'e2', label: 'Ecuación (2)', type: 'text', value: 'x-y=1', ancho: '13rem' },
        { id: 'zoom', label: 'ventana ±', type: 'range', value: 8, min: 4, max: 20, step: 1 },
        { id: 'tab', label: 'ver tablas de valores', type: 'check', value: true },
        escenarios([
          { txt: 'corte entero (3, 2)', set: { e1: 'x+y=5', e2: 'x-y=1', zoom: 8, tab: true } },
          { txt: 'corte fraccionario', tit: 'La lectura gráfica solo aproxima', set: { e1: '2x+3y=4', e2: '5x-7y=1', zoom: 8, tab: true } },
          { txt: 'una recta horizontal', set: { e1: 'y=3', e2: '2x-y=1', zoom: 8, tab: true } },
          { txt: 'una recta vertical', set: { e1: 'x=2', e2: 'x+2y=8', zoom: 8, tab: true } },
          { txt: 'paralelas (SI)', set: { e1: 'x+2y=4', e2: '2x+4y=10', zoom: 10, tab: true } },
          { txt: 'coincidentes (SCI)', set: { e1: 'x+2y=4', e2: '2x+4y=8', zoom: 10, tab: true } },
          { txt: 'decimales con coma', set: { e1: '0,5x+y=3', e2: 'x-2y=-2', zoom: 10, tab: true } }
        ])
      ],
      guarda(function (v) {
        var s = sis2(v.e1, v.e2);
        var z = S.entero(v.zoom, 4, 20, 'La ventana');
        var verTab = (v.tab === true || v.tab === 'true');
        var r1 = S.rectaDe(s.A.a[0][0], s.A.a[0][1], s.b[0]);
        var r2 = S.rectaDe(s.A.a[1][0], s.A.a[1][1], s.b[1]);
        var c = S.corte(r1, r2);
        var d = S.discute(s.A, s.b, ['x', 'y']);

        var h = S.expr('Sistema', S.sisTex(s.A, s.b, ['x', 'y']));

        h += S.paso(1, 'Escribimos cada ecuación en <b>forma explícita</b> $y = m x + n$ ' +
          '(si el coeficiente de $y$ es 0 la recta es vertical y se escribe $x = k$).' +
          KD('\\begin{aligned}(1)\\quad & ' + S.explicitaTex(r1) + ' \\\\ (2)\\quad & ' + S.explicitaTex(r2) + '\\end{aligned}'));

        var xs = [-2, -1, 0, 1, 2, 3];
        if (verTab) {
          var tv1 = tablaValores(r1, xs), tv2 = tablaValores(r2, xs);
          h += S.paso(2, 'Damos valores a $x$ y calculamos $y$: con dos puntos ya se puede trazar la recta, ' +
            'pero conviene calcular alguno más para comprobar que están alineados.' +
            rejilla2([
              tarjeta('Tabla de la ecuación (1)', tablaValoresHTML(tv1, esCero(r1.b) ? 'la x es constante: recta vertical' : 'valores de la recta (1)')),
              tarjeta('Tabla de la ecuación (2)', tablaValoresHTML(tv2, esCero(r2.b) ? 'la x es constante: recta vertical' : 'valores de la recta (2)'))
            ]));
        }

        var puntos = [];
        if (c.tipo === 'punto') {
          puntos.push({ x: c.x, y: c.y, etiqueta: '(' + S.etq(num(c.x), 3) + ', ' + S.etq(num(c.y), 3) + ')', color: COL.verde });
        }
        h += fig(S.plano({
          W: 880, H: 600,
          xmin: -z, xmax: z, ymin: -z, ymax: z,
          rectas: rectasDe(s),
          puntos: puntos,
          leyenda: leyenda2(s),
          titulo: 'Las dos rectas del sistema',
          label: 'Resolución gráfica del sistema',
          cap: 'La solución del sistema se lee en el punto donde se cortan las dos rectas.'
        }));

        if (c.tipo === 'punto') {
          h += S.paso(verTab ? 3 : 2, 'Las rectas se cortan en un punto. Sus coordenadas exactas se obtienen ' +
            'resolviendo el sistema; el dibujo sirve para <b>ver</b> y comprobar la solución.' +
            S.expr('Solución', S.puntoTex(c.x, c.y)) +
            S.kvs(['x = ' + K(FT(c.x)), 'y = ' + K(FT(c.y)), badgeTipo('SCD')]) +
            (c.x.d === 1n && c.y.d === 1n
              ? nota('Aquí las coordenadas son enteras, así que se leen bien en la gráfica.')
              : nota('Las coordenadas no son enteras: en la gráfica solo se pueden estimar ' +
                '($x \\approx ' + S.kf(num(c.x), 3) + '$, $y \\approx ' + S.kf(num(c.y), 3) + '$). ' +
                'Este es el punto débil del método gráfico.')),
            'ap-paso-clave');
          h += comprobacionHTML(s, [c.x, c.y]);
        } else if (c.tipo === 'paralelas') {
          h += S.paso(verTab ? 3 : 2, 'Las dos rectas tienen la misma pendiente y distinta ordenada en el origen: ' +
            'son <b>paralelas</b> y no se cortan. El sistema no tiene solución.' +
            S.kvs([badgeTipo('SI'), nombreGeom('SI')]), 'ap-paso-clave');
        } else {
          h += S.paso(verTab ? 3 : 2, 'Las dos ecuaciones dan <b>la misma recta</b>: todos sus puntos son solución. ' +
            'El sistema tiene infinitas soluciones.' +
            S.expr('Soluciones', d.tipo === 'SCI' ? d.param.texParam : S.explicitaTex(r1)) +
            S.kvs([badgeTipo('SCI'), nombreGeom('SCI')]), 'ap-paso-clave');
        }
        return h;
      }));
  };

  /* ==================================================================
     10 · tresCasos · Los tres casos gráficos
     ================================================================== */
  var CASOS = [
    ['SCD', 'Rectas secantes', 'Un único punto en común. El sistema es compatible determinado (SCD): ' +
      'tiene una sola solución. Las razones cumplen $\\dfrac{a}{a\'} \\neq \\dfrac{b}{b\'}$.'],
    ['SI', 'Rectas paralelas', 'Ningún punto en común. El sistema es incompatible (SI): no tiene solución. ' +
      'Las razones cumplen $\\dfrac{a}{a\'} = \\dfrac{b}{b\'} \\neq \\dfrac{c}{c\'}$.'],
    ['SCI', 'Rectas coincidentes', 'Infinitos puntos en común, todos los de la recta. El sistema es ' +
      'compatible indeterminado (SCI). Las razones cumplen $\\dfrac{a}{a\'} = \\dfrac{b}{b\'} = \\dfrac{c}{c\'}$.']
  ];
  function cajasCasos(activo) {
    return '<div class="sys-casos">' + CASOS.map(function (c) {
      return '<div class="sys-caso' + (c[0] === activo ? ' sys-on' : '') + '">' +
        '<div class="sys-caso-tit">' + esc(c[1]) + ' · ' + c[0] + '</div>' +
        '<div class="sys-caso-txt">' + c[2] + '</div></div>';
    }).join('') + '</div>';
  }

  R.tresCasos = function (node) {
    S.shell(node, 'Los tres casos gráficos',
      'Dos rectas del plano solo pueden estar de tres maneras: cortarse en un punto, ser paralelas o ' +
      'ser la misma recta. Esos tres casos corresponden exactamente a los tres tipos de sistema. ' +
      COMO_ECU + '<br>' +
      'Usa los botones de escenario para saltar de un caso a otro, o escribe tus propias ecuaciones y ' +
      'comprueba en qué caso caen.',
      [
        { id: 'e1', label: 'Ecuación (1)', type: 'text', value: 'x+y=5', ancho: '13rem' },
        { id: 'e2', label: 'Ecuación (2)', type: 'text', value: 'x-y=1', ancho: '13rem' },
        escenarios([
          { txt: 'secantes · SCD', tit: 'Una única solución', set: { e1: 'x+y=5', e2: 'x-y=1' } },
          { txt: 'paralelas · SI', tit: 'Ninguna solución', set: { e1: 'x+2y=4', e2: '2x+4y=10' } },
          { txt: 'coincidentes · SCI', tit: 'Infinitas soluciones', set: { e1: 'x+2y=4', e2: '2x+4y=8' } },
          { txt: 'secantes perpendiculares', set: { e1: 'y=2x-1', e2: 'x+2y=6' } },
          { txt: 'paralelas horizontales', set: { e1: 'y=2', e2: 'y=-3' } },
          { txt: 'paralelas verticales', set: { e1: 'x=1', e2: 'x=4' } },
          { txt: 'coincidentes con fracciones', set: { e1: 'x/2+y/2=2', e2: 'x+y=4' } },
          { txt: 'casi paralelas', tit: 'Se cortan muy lejos', set: { e1: '100x+201y=1', e2: '100x+200y=0' } }
        ])
      ],
      guarda(function (v) {
        var s = sis2(v.e1, v.e2);
        var d = S.discute(s.A, s.b, ['x', 'y']);
        var r1 = S.rectaDe(s.A.a[0][0], s.A.a[0][1], s.b[0]);
        var r2 = S.rectaDe(s.A.a[1][0], s.A.a[1][1], s.b[1]);
        var c = S.corte(r1, r2);

        var h = S.expr('Sistema', S.sisTex(s.A, s.b, ['x', 'y']));
        h += S.kvs([badgeTipo(d.tipo), nombreGeom(d.tipo),
          'puntos en común: ' + K(d.tipo === 'SCD' ? '1' : (d.tipo === 'SI' ? '0' : '\\infty'))]);
        h += cajasCasos(d.tipo);

        var A1 = s.A.a[0][0], B1 = s.A.a[0][1], C1 = F(s.b[0]);
        var A2 = s.A.a[1][0], B2 = s.A.a[1][1], C2 = F(s.b[1]);
        var pAB = A1.por(B2).menos(A2.por(B1));
        var pAC = A1.por(C2).menos(A2.por(C1));
        var pBC = B1.por(C2).menos(B2.por(C1));

        h += S.paso(1, 'Comparamos los coeficientes con productos cruzados, que valen aunque algún coeficiente sea 0.' +
          KD('a b\' - a\'b = ' + FT(pAB) + ', \\qquad a c\' - a\'c = ' + FT(pAC) + ', \\qquad b c\' - b\'c = ' + FT(pBC)) +
          (esCero(pAB)
            ? 'El primero es $0$: las dos rectas tienen la <b>misma dirección</b>.'
            : 'El primero no es $0$: las direcciones son <b>distintas</b> y por tanto las rectas se cortan.'));

        h += S.paso(2, 'Las pendientes (o la verticalidad) confirman lo anterior.' +
          KD('\\begin{aligned}(1)\\quad & ' + S.explicitaTex(r1) + ' \\\\ (2)\\quad & ' + S.explicitaTex(r2) + '\\end{aligned}') +
          (c.tipo === 'punto'
            ? 'Pendientes distintas: las rectas se cruzan una sola vez.'
            : (c.tipo === 'paralelas'
              ? 'Misma pendiente y distinta ordenada en el origen: nunca se encuentran.'
              : 'Misma pendiente y misma ordenada en el origen: es una única recta escrita de dos formas.')));

        var conclusion;
        if (d.tipo === 'SCD') {
          conclusion = 'Hay exactamente <b>un</b> punto que cumple las dos ecuaciones: ' +
            KD(S.puntoTex(d.sol[0], d.sol[1])) +
            'Geometría y álgebra dicen lo mismo: un punto de corte ⟺ una única solución.';
        } else if (d.tipo === 'SI') {
          conclusion = 'No hay <b>ningún</b> punto que cumpla las dos ecuaciones a la vez. ' +
            'Al resolver aparece un absurdo del tipo $0 = k$ con $k \\neq 0$: eso es, algebraicamente, ' +
            'el paralelismo de las rectas.';
        } else {
          conclusion = 'Todos los puntos de la recta cumplen las dos ecuaciones. ' +
            'Al resolver aparece la identidad $0 = 0$, señal de que la segunda ecuación no añade ' +
            'información nueva. Las soluciones se escriben con un parámetro: ' + KD(d.param.texParam);
        }
        h += S.paso(3, conclusion, 'ap-paso-clave');

        h += fig(S.plano({
          W: 880, H: 600,
          rectas: (d.tipo === 'SCI'
            ? [{ a: A1, b: B1, c: C1, color: COL.azul, etiqueta: '(1) = (2)', ancho: 5 },
            { a: A2, b: B2, c: C2, color: COL.rojo, etiqueta: '', dash: '10 8', ancho: 3 }]
            : rectasDe(s)),
          puntos: (c.tipo === 'punto'
            ? [{ x: c.x, y: c.y, etiqueta: '(' + S.etq(num(c.x), 3) + ', ' + S.etq(num(c.y), 3) + ')', color: COL.verde }]
            : []),
          leyenda: leyenda2(s),
          titulo: nombreGeom(d.tipo),
          label: 'Posición relativa de las dos rectas',
          cap: 'Secantes → SCD · paralelas → SI · coincidentes → SCI.'
        }));
        return h;
      }));
  };

  /* ==================================================================
     cierre del módulo
     ================================================================== */
  S.extraA = true;
  if (S.monta) S.monta();
})();
