/* =====================================================================
   sys-applets-b.js · Módulo B del Tema 4 «Sistemas de ecuaciones e
   inecuaciones» · 1.º de Bachillerato · Matemáticas Aplicadas a las CCSS
   Ruta: 1-BatxMatesCCSS/sistemas-ecuaciones-inecuaciones/assets/sys-applets-b.js

   Cubre los apartados 4.7 a 4.11 del tema:

     4.7  Discusión de un sistema de ecuaciones (razones, determinante)
     4.8  Sistemas lineales con tres incógnitas (ternas, tres planos)
     4.9  Resolución por el método de Gauss (automático y manual)
     4.10 Discusión mediante Gauss, expresión matricial y rangos
     4.11 Problemas de ecuaciones lineales (del enunciado al sistema)

   Claves registradas (10):

     discusion2      Discusión de un sistema 2×2 comparando las razones
                     a/a', b/b', c/c' y el determinante; clasifica en
                     SCD / SCI / SI y dibuja las dos rectas.
     parametro       Sistema 2×2 cuyos coeficientes dependen de un
                     parámetro k: deslizador de k, cálculo EXACTO de los
                     valores críticos (raíces del determinante) y tabla
                     de discusión caso por caso.
     ternaSolucion   Comprueba si una terna (x0, y0, z0) es solución de
                     un sistema 3×3, ecuación por ecuación, y la compara
                     con la solución verdadera.
     planos3         Esquema SVG de las seis posiciones relativas de tres
                     planos, ligado al tipo de sistema y a los rangos.
     gauss           Matriz ampliada 3×4 editable, con modo automático
                     (todos los pasos en notación F_i -> F_i - k F_j) y
                     modo manual, en el que el alumno elige la operación
                     elemental y ve su efecto inmediato.
     escalonada      Forma escalonada, pivotes marcados, rango, filas
                     nulas y filas incompatibles.
     matricial       Paso del sistema a A·X = B y a la matriz ampliada,
                     y vuelta desde las matrices al sistema.
     rangoDiscusion  Compara rg(A) con rg(A|B) y con el número de
                     incógnitas: teorema de Rouché-Frobenius aplicado.
     discuteGauss    Gauss con un parámetro k en la matriz ampliada 3×4:
                     valores que anulan un pivote y estudio de cada caso.
     problemas       Banco de diez enunciados contextualizados: el alumno
                     declara las incógnitas, escribe las ecuaciones y el
                     applet corrige, resuelve y comenta.

   ---------------------------------------------------------------------
   Dependencias
   ---------------------------------------------------------------------
   Necesita el núcleo `sys-applets.js` (window.SYS) y la capa de álgebra
   lineal `sys-applets-lin.js`, que se cargan antes. De la capa lineal se
   usan literalmente: parseSistema, parseEcu, sisTex, ecuTex, Mat, matDe,
   matTex, matAmpliada, matPorVector, gauss, rango, det, detPasos,
   discute, resuelve, compruebaSol, plano, corte, puntoTex, fracDe y
   fracTex. Del núcleo: shell, registry, K, KD, esc, expr, paso, tabla,
   badge, kvs, resultado, svgWrap, txt, line, poly, COL, Frac y parsePol.

   ---------------------------------------------------------------------
   Criterios didácticos
   ---------------------------------------------------------------------
   1. Aritmética EXACTA con S.Frac (BigInt) en todo el módulo. La coma
      flotante solo aparece al convertir coordenadas en píxeles.
   2. Cada applet explica en su cabecera CÓMO se escriben las entradas,
      con ejemplos concretos: enteros (3, -2), decimales con coma (0,5),
      fracciones (3/4) y ecuaciones completas (2x-3y+z=5).
   3. Todo applet ofrece botones de escenario con, al menos, un caso SCD,
      uno SCI y uno SI, para que la clasificación se vea de golpe.
   4. Los errores del alumno nunca rompen el applet: se capturan y se
      muestran como un aviso amable que dice qué corregir.
   5. Las figuras son grandes (720×520 o más) y con tipografía grande,
      pensadas para proyectarse en clase.

   Clases CSS propias: todas con el prefijo `sysb-` (añadidas al final de
   sys-applets.css) para no chocar con los módulos A y C.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.SYS;
  if (!S) {
    if (window.console && console.error) {
      console.error('[sistemas] sys-applets-b.js necesita sys-applets.js cargado antes.');
    }
    return;
  }

  var R = S.registry;
  var K = S.K, KD = S.KD, COL = S.COL;
  var Frac = S.Frac;

  /* ==================================================================
     0 · utilidades locales del módulo
     ================================================================== */

  /* Acceso perezoso a la capa lineal: si falta, el mensaje es claro. */
  function lin() {
    if (!S.parseSistema || !S.gauss || !S.discute) {
      throw Error('No se ha cargado la capa de álgebra lineal (sys-applets-lin.js). ' +
        'Recarga la página; si el aviso persiste, avisa al profesor.');
    }
    return S;
  }

  function FR(v) { return lin().fracDe(v); }
  function FT(f, inline) { return lin().fracTex(f, inline === undefined ? true : inline); }
  function cero(f) { return f.n === 0n; }
  function negF(f) { return f.n < 0n; }
  function absF(f) { return negF(f) ? f.opuesto() : new Frac(f.n, f.d); }
  function igF(a, b) { return a.cmp(b) === 0; }
  function numF(f) { return Number(f.n) / Number(f.d); }
  function F0() { return new Frac(0); }
  function F1() { return new Frac(1); }

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
              if (typeof el._sincroniza === 'function') el._sincroniza();
            });
            if (p.extra) p.extra(ctl);
          }
        };
      })
    };
  }

  /* Envoltorio: cualquier error se convierte en un aviso amable. */
  function safe(fn) {
    return function (v, ctl, out, api) {
      try {
        var h = fn(v, ctl, out, api);
        return (h === undefined || h === null || h === '')
          ? '<div class="mx-bad">No hay nada que mostrar todavía: revisa los datos que has escrito.</div>'
          : h;
      } catch (e) {
        var m = (e && e.message) ? e.message : 'No he podido calcular con estos datos.';
        return '<div class="mx-bad sysb-err">' + S.esc(m) + '</div>';
      }
    };
  }

  /* Insignia del tipo de sistema, siempre con el mismo color. */
  function insignia(tipo) {
    if (tipo === 'SCD') return S.badge('SCD · compatible determinado', 'si');
    if (tipo === 'SCI') return S.badge('SCI · compatible indeterminado', 'info');
    return S.badge('SI · incompatible', 'no');
  }
  function nombreTipo(tipo) {
    if (tipo === 'SCD') return 'sistema compatible determinado (solución única)';
    if (tipo === 'SCI') return 'sistema compatible indeterminado (infinitas soluciones)';
    return 'sistema incompatible (ninguna solución)';
  }

  /* Caja con rótulo y matriz/expresión en display. */
  function caja(label, tex) { return S.expr(label, tex); }

  /* Texto de una solución, con unidades opcionales. */
  function solTexto(vars, sol) {
    return vars.map(function (v, i) { return v + ' = ' + FT(sol[i]); }).join(', \\quad ');
  }

  /* ------------------------------------------------------------------
     Lectura de una matriz escrita por filas: una fila por línea,
     números separados por espacios. Admite enteros, decimales con coma
     y fracciones.  Ejemplo:  "1 1 1 6 / 2 -1 1 3 / 1 2 -1 4"
     ------------------------------------------------------------------ */
  function leeMatriz(txt, filas, cols, etiqueta) {
    etiqueta = etiqueta || 'la matriz';
    var lineas = String(txt === undefined || txt === null ? '' : txt)
      .split(/[\n;]+/)
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l !== ''; });
    if (!lineas.length) {
      throw Error('Escribe ' + etiqueta + ': una fila por línea y los números separados por espacios. ' +
        'Ejemplo de matriz ampliada 3×4:\n1 1 1 6\n2 -1 1 3\n1 2 -1 4');
    }
    if (filas && lineas.length !== filas) {
      throw Error(etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1) + ' debe tener ' + filas +
        ' filas, una por línea, y has escrito ' + lineas.length + '. ' +
        'Si una ecuación no lleva alguna incógnita, escribe un 0 en su lugar.');
    }
    var a = lineas.map(function (l, i) {
      var trozos = l.split(/\s+/).filter(function (t) { return t !== ''; });
      if (cols && trozos.length !== cols) {
        throw Error('La fila ' + (i + 1) + ' tiene ' + trozos.length + ' números y debería tener ' + cols +
          '. Separa los números con espacios y escribe un 0 donde falte un coeficiente. ' +
          'Los números pueden ser enteros (3, -2), decimales con coma (0,5) o fracciones (3/4).');
      }
      return trozos.map(function (t) { return FR(t); });
    });
    return lin().Mat(a);
  }

  /* Separa una matriz ampliada M en A (primeras c-1 columnas) y b. */
  function parte(M) {
    var A = [], b = [], i, j;
    for (i = 0; i < M.f; i++) {
      var fila = [];
      for (j = 0; j < M.c - 1; j++) fila.push(M.a[i][j]);
      A.push(fila);
      b.push(M.a[i][M.c - 1]);
    }
    return { A: lin().Mat(A), b: b };
  }

  /* Lee un sistema escrito con ecuaciones, con comprobaciones amables. */
  function leeSistema(txt, vars, minEc, maxEc) {
    var s = lin().parseSistema(txt, vars);
    if (minEc && s.m < minEc) {
      throw Error('Este applet necesita al menos ' + minEc + ' ecuaciones y solo has escrito ' + s.m +
        '. Escribe una ecuación por línea, por ejemplo:\n2x-3y+z=5\nx+y-z=0\n3x+2y=7');
    }
    if (maxEc && s.m > maxEc) {
      throw Error('Este applet admite como mucho ' + maxEc + ' ecuaciones y has escrito ' + s.m + '.');
    }
    return s;
  }

  /* Lista de pasos de Gauss ya formateada. */
  function pasosGauss(G, aug, desde) {
    var h = '';
    G.pasos.forEach(function (p, i) {
      if (desde && i < desde) return;
      var cuerpo = (p.op ? KD(p.op) : '') + KD(lin().matTex(p.M, { aug: aug }));
      h += S.paso(i === 0 ? 'inicio' : String(i), '<p>' + p.desc + '</p>' + cuerpo,
        i === 0 ? 'sysb-paso0' : '');
    });
    return h;
  }

  /* Diagnóstico de filas de una matriz ampliada ya escalonada. */
  function diagnosticoFilas(M) {
    var nulas = [], incomp = [], i, j;
    for (i = 0; i < M.f; i++) {
      var coefNulos = true, tiNulo = cero(M.a[i][M.c - 1]);
      for (j = 0; j < M.c - 1; j++) if (!cero(M.a[i][j])) coefNulos = false;
      if (coefNulos && tiNulo) nulas.push(i + 1);
      if (coefNulos && !tiNulo) incomp.push({ fila: i + 1, valor: M.a[i][M.c - 1] });
    }
    return { nulas: nulas, incompatibles: incomp };
  }

  /* Fracción exacta en TEXTO LLANO, para rótulos dentro de un <svg>:
     «8/5», «−3/5», «2». Dentro del SVG no hay KaTeX, así que nunca se
     puede escribir TeX ahí; la fórmula bonita va fuera, con S.K. */
  function fracTxt(f) {
    var n = String(f.n), d = String(f.d), neg = n.charAt(0) === '-';
    if (neg) n = n.slice(1);
    if (d.charAt(0) === '-') { d = d.slice(1); neg = !neg; }
    return (neg ? '\u2212' : '') + n + (d === '1' ? '' : '/' + d);
  }
  /* «P(8/5, 3/5)» en texto llano, listo para una etiqueta de figura. */
  function puntoTxt(x, y, nombre) {
    return (nombre === undefined ? 'P' : nombre) + '(' + fracTxt(x) + ', ' + fracTxt(y) + ')';
  }

  /* Rectas de un sistema 2×2 dibujadas con S.plano.
     Todas las etiquetas van en texto llano (r1, r2, P(8/5, 3/5)); la
     versión con TeX se añade DEBAJO de la figura, fuera del SVG. */
  function figura2x2(A, b, opts) {
    opts = opts || {};
    var rectas = [], i;
    var colores = [COL.azul, COL.rojo, COL.verde];
    var posiciones = [0.72, 0.34, 0.52];
    for (i = 0; i < A.f; i++) {
      if (cero(A.a[i][0]) && cero(A.a[i][1])) continue;
      rectas.push({
        a: A.a[i][0], b: A.a[i][1], c: b[i],
        color: colores[i % 3],
        pos: posiciones[rectas.length % 3],
        etiqueta: 'r' + (i + 1)
      });
    }
    if (!rectas.length) return '';
    var puntos = [];
    if (opts.punto) {
      puntos.push({
        x: numF(opts.punto[0]), y: numF(opts.punto[1]),
        etiqueta: puntoTxt(opts.punto[0], opts.punto[1]),
        color: COL.morado
      });
    }
    var cap = opts.cap || 'Cada ecuación es una recta. La posición relativa de las rectas es exactamente la clasificación del sistema.';
    if (opts.punto) {
      cap += ' Punto de corte: ' + K(lin().puntoTex(opts.punto[0], opts.punto[1])) + '.';
    }
    return lin().plano({
      W: 760, H: 560, rejilla: true, ejes: true,
      rectas: rectas, puntos: puntos,
      titulo: opts.titulo || 'Las ecuaciones como rectas del plano',
      cap: cap,
      label: opts.titulo || 'Rectas del sistema'
    });
  }

  /* ------------------------------------------------------------------
     Polinomios en el parámetro k (para `parametro` y `discuteGauss`).
     Se usan los polinomios del núcleo: array de Frac, índice = grado.
     ------------------------------------------------------------------ */
  function polK(txt, etiqueta) {
    var s = String(txt === undefined || txt === null ? '' : txt).trim();
    if (s === '') {
      throw Error('Falta ' + (etiqueta || 'un coeficiente') + '. Escribe un número (3, -2, 0,5, 3/4) ' +
        'o una expresión con el parámetro (k, k-1, 2k+3).');
    }
    return S.parsePol(s, 'k', etiqueta || 'el coeficiente');
  }
  function evalK(p, k) { return S.pEval(p, k).valor; }
  function polTex(p) { return S.pTex(p, 'k'); }
  function esConstante(p) { return S.pGrado(p) <= 0; }

  /* Valores críticos racionales de un polinomio en k. */
  function criticos(p) {
    if (S.pEsCero(p)) return { siempre: true, lista: [], otros: [] };
    var r = lin().solUni(p);
    var lista = [], otros = [];
    (r.raices || []).forEach(function (n) {
      if (n.frac) {
        /* Una raíz doble como (k-1)^2 aparece repetida: como valor crítico
           interesa una sola vez. */
        var repe = lista.some(function (f) { return igF(f, n.frac); });
        if (!repe) lista.push(n.frac);
      } else {
        otros.push(n);
      }
    });
    lista.sort(function (a, b) { return a.cmp(b); });
    return { siempre: false, lista: lista, otros: otros, grado: S.pGrado(p) };
  }
  function listaKTex(lista) {
    return lista.map(function (f) { return 'k = ' + FT(f); }).join(', \\quad ');
  }

  /* Matriz de polinomios evaluada en un valor de k. */
  function evalMat(P, k) {
    return lin().Mat(P.map(function (fila) {
      return fila.map(function (p) { return evalK(p, k); });
    }));
  }
  function matPolTex(P, aug) {
    var colspec = '', j;
    for (j = 0; j < P[0].length; j++) {
      if (aug && j === P[0].length - aug) colspec += '|';
      colspec += 'c';
    }
    var filas = P.map(function (fila) {
      return fila.map(function (p) { return polTex(p); }).join(' & ');
    });
    return '\\left(\\begin{array}{' + colspec + '}' + filas.join(' \\\\ ') + '\\end{array}\\right)';
  }

  /* Determinante 2×2 y 3×3 de una matriz de polinomios en k. */
  function detPol(P) {
    var n = P.length;
    if (n === 2) return S.pResta(S.pMult(P[0][0], P[1][1]), S.pMult(P[0][1], P[1][0]));
    var t1 = S.pMult(S.pMult(P[0][0], P[1][1]), P[2][2]);
    var t2 = S.pMult(S.pMult(P[0][1], P[1][2]), P[2][0]);
    var t3 = S.pMult(S.pMult(P[0][2], P[1][0]), P[2][1]);
    var t4 = S.pMult(S.pMult(P[0][2], P[1][1]), P[2][0]);
    var t5 = S.pMult(S.pMult(P[0][0], P[1][2]), P[2][1]);
    var t6 = S.pMult(S.pMult(P[0][1], P[1][0]), P[2][2]);
    return S.pResta(S.pSuma(S.pSuma(t1, t2), t3), S.pSuma(S.pSuma(t4, t5), t6));
  }

  /* Texto explicativo de la discusión, común a varios applets. */
  function bloqueDiscusion(D) {
    var h = S.kvs([
      'rg(A) = <b>' + D.rA + '</b>',
      'rg(A|B) = <b>' + D.rAb + '</b>',
      'incógnitas: <b>' + D.n + '</b>',
      'tipo: <b>' + D.tipo + '</b>'
    ]);
    h += '<p class="sysb-txt">' + S.texifica(D.texto) + '</p>';
    return h;
  }

  /* Solución (única o paramétrica) presentada con cariño. */
  function bloqueSolucion(D) {
    if (D.tipo === 'SI') {
      return '<p class="ap-warn">Al escalonar aparece una fila del tipo ' + K('0 = k') + ' con ' +
        K('k \\neq 0') + ', que es un absurdo: <b>el sistema no tiene solución</b>.</p>';
    }
    if (D.tipo === 'SCD') {
      return S.resultado(K(solTexto(D.vars, D.sol)), 'solución única del sistema');
    }
    return caja('Solución general (infinitas soluciones)', D.param.texParam) +
      '<p class="sysb-txt">' + D.param.descripcion + '</p>';
  }

  /* ==================================================================
     1 · Tema 4.7 · discusión de un sistema 2×2
     ================================================================== */
  R.discusion2 = function (node) {
    S.shell(node, 'Discusión de un sistema de dos ecuaciones con dos incógnitas',
      'Escribe <b>una ecuación en cada línea</b>, con las incógnitas ' + K('x') + ' e ' + K('y') + '. ' +
      'Se admiten: enteros (<code>2x-3y=5</code>), decimales con coma (<code>0,5x+y=1,5</code>), ' +
      'fracciones (<code>3/4x-y=2</code>), incógnitas en los dos miembros (<code>3x=2y-1</code>) ' +
      'y paréntesis (<code>2(x-1)+y=4</code>). El orden de los términos es libre. ' +
      'El applet compara las razones ' + K('\\frac{a}{a\'}, \\frac{b}{b\'}, \\frac{c}{c\'}') +
      ', calcula el determinante y decide si el sistema es SCD, SCI o SI.',
      [
        {
          id: 'sis', label: 'Sistema (una ecuación por línea)', type: 'textarea', rows: 3,
          value: '2x+3y=5\nx-y=1', ancho: '22rem',
          place: '2x+3y=5\nx-y=1'
        },
        chips([
          { txt: 'SCD · rectas secantes', tip: 'solución única', set: { sis: '2x+3y=5\nx-y=1' } },
          { txt: 'SCI · misma recta', tip: 'infinitas soluciones', set: { sis: 'x+2y=4\n3x+6y=12' } },
          { txt: 'SI · rectas paralelas', tip: 'sin solución', set: { sis: 'x+2y=4\n2x+4y=1' } },
          { txt: 'Con fracciones', tip: 'coeficientes 3/4 y 1/2', set: { sis: '3/4x-y=2\nx+1/2y=3' } },
          { txt: 'Con decimales', tip: 'coma decimal', set: { sis: '0,5x+y=1,5\nx-0,25y=2' } },
          { txt: 'Incógnitas a los dos lados', tip: 'orden libre', set: { sis: '3x=2y-1\n4y+2x=6' } }
        ])
      ],
      safe(function (v) {
        var sis = leeSistema(v.sis, ['x', 'y'], 2, 2);
        if (sis.m !== 2) throw Error('Escribe exactamente dos ecuaciones, una en cada línea.');
        var A = sis.A, b = sis.b;
        var D = lin().discute(A, b, ['x', 'y']);

        var h = caja('Sistema tal y como lo ha leído el applet', lin().sisTex(A, b, ['x', 'y']));
        h += '<div class="sysb-tipo">' + insignia(D.tipo) + '</div>';

        /* --- razones de los coeficientes --- */
        var a1 = A.a[0][0], b1 = A.a[0][1], c1 = b[0];
        var a2 = A.a[1][0], b2 = A.a[1][1], c2 = b[1];
        function razon(p, q) {
          if (cero(q)) return { tex: '\\text{no se puede formar}', frac: null };
          return { tex: FT(p.entre(q)), frac: p.entre(q) };
        }
        var ra = razon(a1, a2), rb = razon(b1, b2), rc = razon(c1, c2);
        h += '<h5>Paso 1 · comparación de las razones de los coeficientes</h5>';
        h += S.tabla(['Razón', 'Valor exacto', 'Qué mide'], [
          [K('\\dfrac{a}{a\'} = \\dfrac{' + FT(a1) + '}{' + FT(a2) + '}'), K(ra.tex), 'coeficientes de ' + K('x')],
          [K('\\dfrac{b}{b\'} = \\dfrac{' + FT(b1) + '}{' + FT(b2) + '}'), K(rb.tex), 'coeficientes de ' + K('y')],
          [K('\\dfrac{c}{c\'} = \\dfrac{' + FT(c1) + '}{' + FT(c2) + '}'), K(rc.tex), 'términos independientes']
        ]);
        var mismasAB = (ra.frac && rb.frac) ? igF(ra.frac, rb.frac)
          : (cero(a1.por(b2).menos(a2.por(b1))));
        var mismasABC = mismasAB && ((ra.frac && rc.frac) ? igF(ra.frac, rc.frac)
          : cero(a1.por(c2).menos(a2.por(c1))) && cero(b1.por(c2).menos(b2.por(c1))));
        var reglaTxt;
        if (!mismasAB) {
          reglaTxt = 'Las razones de los coeficientes de ' + K('x') + ' y de ' + K('y') +
            ' son <b>distintas</b>: las rectas tienen pendientes distintas, se cortan en un punto y el sistema es <b>compatible determinado</b>.';
        } else if (mismasABC) {
          reglaTxt = 'Las tres razones <b>coinciden</b>: la segunda ecuación es la primera multiplicada por un número, ' +
            'las dos rectas son la misma y el sistema es <b>compatible indeterminado</b>.';
        } else {
          reglaTxt = 'Las razones de los coeficientes coinciden pero la de los términos independientes <b>no</b>: ' +
            'las rectas son paralelas y distintas, así que el sistema es <b>incompatible</b>.';
        }
        h += '<p class="sysb-txt">' + reglaTxt + '</p>';

        /* --- determinante --- */
        h += '<h5>Paso 2 · el determinante de la matriz de coeficientes</h5>';
        var dp = lin().detPasos(A);
        h += caja('Regla del producto en cruz', dp.tex);
        h += '<p class="sysb-txt">' + (cero(dp.valor)
          ? 'El determinante vale ' + K('0') + ': las dos ecuaciones son proporcionales en sus coeficientes, ' +
          'así que el sistema no puede ser compatible determinado. Hay que mirar los términos independientes para separar SCI de SI.'
          : 'El determinante es distinto de cero (' + K('|A| = ' + FT(dp.valor)) + '), y eso basta para asegurar que el sistema es ' +
          '<b>compatible determinado</b>: tiene una única solución.') + '</p>';

        /* --- rangos y conclusión --- */
        h += '<h5>Paso 3 · rangos y conclusión</h5>';
        h += bloqueDiscusion(D);
        h += bloqueSolucion(D);

        /* --- posición relativa y figura --- */
        var cr = lin().corte(
          { a: a1, b: b1, c: c1 },
          { a: a2, b: b2, c: c2 }
        );
        h += '<p class="sysb-txt"><b>Geometría:</b> ' + cr.texto + '</p>';
        h += figura2x2(A, b, {
          punto: D.tipo === 'SCD' ? D.sol : null,
          titulo: 'Las dos ecuaciones, vistas como rectas',
          cap: 'Rectas secantes → SCD · rectas coincidentes → SCI · rectas paralelas distintas → SI.'
        });
        return h;
      }));
  };

  /* ==================================================================
     2 · Tema 4.7 · sistemas con un parámetro
     ================================================================== */
  R.parametro = function (node) {
    S.shell(node, 'Sistemas con un parámetro',
      'Los seis coeficientes del sistema ' +
      K('\\left\\{\\begin{array}{l} a x + b y = c \\\\ a\'x + b\'y = c\' \\end{array}\\right.') +
      ' pueden ser números o expresiones con el parámetro ' + K('k') + '. ' +
      'Escribe enteros (<code>3</code>, <code>-2</code>), decimales con coma (<code>0,5</code>), ' +
      'fracciones (<code>3/4</code>) o expresiones en <code>k</code> (<code>k</code>, <code>k-1</code>, ' +
      '<code>2k+3</code>, <code>k^2</code>). Mueve el deslizador para ver qué le pasa a las rectas; ' +
      'la tabla de discusión calcula los <b>valores críticos exactos</b> de ' + K('k') + '.',
      [
        { id: 'a1', label: 'a', type: 'text', value: 'k', ancho: '7rem' },
        { id: 'b1', label: 'b', type: 'text', value: '1', ancho: '7rem' },
        { id: 'c1', label: 'c', type: 'text', value: '3', ancho: '7rem' },
        { id: 'a2', label: "a'", type: 'text', value: '4', ancho: '7rem' },
        { id: 'b2', label: "b'", type: 'text', value: 'k', ancho: '7rem' },
        { id: 'c2', label: "c'", type: 'text', value: '6', ancho: '7rem' },
        { id: 'k', label: 'Valor de k', type: 'range', min: -6, max: 6, step: 0.5, value: 2 },
        chips([
          { txt: 'kx+y=3 · 4x+ky=6', tip: 'valores críticos k = 2 y k = −2', set: { a1: 'k', b1: '1', c1: '3', a2: '4', b2: 'k', c2: '6', k: 2 } },
          { txt: 'SCD para casi todo k', tip: 'un único valor crítico', set: { a1: '1', b1: '2', c1: '3', a2: 'k', b2: '4', c2: '6', k: 1 } },
          { txt: 'SCI en el valor crítico', tip: 'las dos rectas se funden', set: { a1: '1', b1: '2', c1: '3', a2: '2', b2: '4', c2: 'k', k: 6 } },
          { txt: 'SI en el valor crítico', tip: 'rectas paralelas', set: { a1: '1', b1: '2', c1: '3', a2: '2', b2: '4', c2: '5', k: 1 } },
          { txt: 'Sin valores críticos', tip: 'siempre SCD', set: { a1: '1', b1: '0', c1: 'k', a2: '0', b2: '1', c2: '2', k: 3 } },
          { txt: 'Parámetro cuadrático', tip: 'k² − 1 = 0', set: { a1: 'k', b1: '1', c1: '1', a2: '1', b2: 'k', c2: '1', k: 1 } }
        ])
      ],
      safe(function (v) {
        var P = [
          [polK(v.a1, 'el coeficiente a'), polK(v.b1, 'el coeficiente b')],
          [polK(v.a2, "el coeficiente a'"), polK(v.b2, "el coeficiente b'")]
        ];
        var Q = [polK(v.c1, 'el término independiente c'), polK(v.c2, "el término independiente c'")];
        var kVal = FR(String(v.k));

        var h = caja('Sistema con parámetro',
          '\\left\\{\\begin{array}{rcrcl}' +
          polTex(P[0][0]) + ' \\cdot x & + & ' + polTex(P[0][1]) + ' \\cdot y & = & ' + polTex(Q[0]) + ' \\\\ ' +
          polTex(P[1][0]) + ' \\cdot x & + & ' + polTex(P[1][1]) + ' \\cdot y & = & ' + polTex(Q[1]) +
          '\\end{array}\\right.');

        /* --- determinante como polinomio en k --- */
        var Dk = detPol(P);
        h += '<h5>Paso 1 · el determinante en función de ' + K('k') + '</h5>';
        h += caja('Determinante', '|A(k)| = ' + polTex(P[0][0]) + ' \\cdot ' + polTex(P[1][1]) +
          ' - ' + polTex(P[0][1]) + ' \\cdot ' + polTex(P[1][0]) + ' = ' + polTex(Dk));

        var cr = criticos(Dk);
        var texCrit;
        if (cr.siempre) {
          texCrit = 'El determinante es idénticamente ' + K('0') + ': <b>para cualquier valor de </b>' + K('k') +
            ' las dos ecuaciones tienen coeficientes proporcionales, así que el sistema nunca es compatible determinado.';
        } else if (!cr.lista.length && !cr.otros.length) {
          texCrit = 'El determinante no se anula para ningún valor de ' + K('k') +
            ': el sistema es <b>compatible determinado para todo</b> ' + K('k') + ', sin casos especiales.';
        } else {
          texCrit = 'Los <b>valores críticos</b> son los que anulan el determinante: ' +
            K(listaKTex(cr.lista) || '\\text{ninguno racional}') +
            (cr.otros.length ? ' (y además ' + K(cr.otros.map(function (n) { return 'k = ' + n.tex; }).join(', ')) + ')' : '') +
            '. Para cualquier otro valor de ' + K('k') + ' el determinante no es cero y el sistema es SCD.';
        }
        h += '<p class="sysb-txt">' + texCrit + '</p>';

        /* --- tabla de discusión por casos --- */
        h += '<h5>Paso 2 · tabla de discusión</h5>';
        var filas = [];
        if (!cr.siempre) {
          var excep = cr.lista.length
            ? 'k \\neq ' + cr.lista.map(function (f) { return FT(f); }).join(', \\; k \\neq ')
            : '\\text{cualquier } k';
          filas.push([K(excep), K('|A| \\neq 0'), 'rg(A) = rg(A|B) = 2 = n', insignia('SCD')]);
        }
        cr.lista.forEach(function (k0) {
          var Ak = evalMat(P, k0);
          var bk = Q.map(function (p) { return evalK(p, k0); });
          var Dk0 = lin().discute(Ak, bk, ['x', 'y']);
          filas.push([
            K('k = ' + FT(k0)),
            K(lin().sisTex(Ak, bk, ['x', 'y'])),
            'rg(A) = ' + Dk0.rA + ' · rg(A|B) = ' + Dk0.rAb,
            insignia(Dk0.tipo)
          ]);
        });
        if (cr.siempre) {
          var Ag = evalMat(P, kVal), bg = Q.map(function (p) { return evalK(p, kVal); });
          var Dg = lin().discute(Ag, bg, ['x', 'y']);
          filas.push([K('k = ' + FT(kVal)), K(lin().sisTex(Ag, bg, ['x', 'y'])),
            'rg(A) = ' + Dg.rA + ' · rg(A|B) = ' + Dg.rAb, insignia(Dg.tipo)]);
        }
        h += S.tabla(['Caso', 'Situación', 'Rangos', 'Tipo'], filas);

        /* --- el valor del deslizador --- */
        h += '<h5>Paso 3 · qué ocurre con ' + K('k = ' + FT(kVal)) + '</h5>';
        var A2 = evalMat(P, kVal);
        var b2 = Q.map(function (p) { return evalK(p, kVal); });
        var D2 = lin().discute(A2, b2, ['x', 'y']);
        h += caja('Sistema para ese valor de k', lin().sisTex(A2, b2, ['x', 'y']));
        h += '<div class="sysb-tipo">' + insignia(D2.tipo) + '</div>';
        h += S.kvs([
          '|A| = <b>' + K(FT(evalK(Dk, kVal))) + '</b>',
          'rg(A) = <b>' + D2.rA + '</b>',
          'rg(A|B) = <b>' + D2.rAb + '</b>'
        ]);
        h += bloqueSolucion(D2);
        h += figura2x2(A2, b2, {
          punto: D2.tipo === 'SCD' ? D2.sol : null,
          titulo: 'Las dos rectas para k = ' + numF(kVal).toString().replace('.', ','),
          cap: 'Mueve el deslizador: al pasar por un valor crítico las rectas se vuelven paralelas o se funden en una sola.'
        });
        return h;
      }));
  };

  /* ==================================================================
     3 · Tema 4.8 · ¿es esta terna solución del sistema?
     ================================================================== */
  R.ternaSolucion = function (node) {
    S.shell(node, 'Soluciones de un sistema de tres incógnitas',
      'Una terna ' + K('(x_0, y_0, z_0)') + ' es solución del sistema solo si cumple <b>todas</b> las ecuaciones ' +
      'a la vez. Escribe el sistema con una ecuación por línea (<code>2x-3y+z=5</code>, <code>x+y-z=0</code>) ' +
      'y después los tres valores de la terna: enteros (<code>2</code>, <code>-1</code>), ' +
      'decimales con coma (<code>1,5</code>) o fracciones (<code>3/4</code>).',
      [
        {
          id: 'sis', label: 'Sistema (una ecuación por línea)', type: 'textarea', rows: 3,
          value: 'x+y+z=6\n2x-y+z=3\nx+2y-z=2', ancho: '22rem'
        },
        { id: 'x0', label: 'x₀', type: 'text', value: '1', ancho: '7rem' },
        { id: 'y0', label: 'y₀', type: 'text', value: '2', ancho: '7rem' },
        { id: 'z0', label: 'z₀', type: 'text', value: '3', ancho: '7rem' },
        chips([
          { txt: 'SCD · terna correcta', tip: '(1, 2, 3) cumple las tres', set: { sis: 'x+y+z=6\n2x-y+z=3\nx+2y-z=2', x0: '1', y0: '2', z0: '3' } },
          { txt: 'SCD · terna incorrecta', tip: 'falla en dos ecuaciones', set: { sis: 'x+y+z=6\n2x-y+z=3\nx+2y-z=2', x0: '2', y0: '2', z0: '2' } },
          { txt: 'SCI · infinitas ternas', tip: 'una ecuación repetida', set: { sis: 'x+y+z=6\n2x+2y+2z=12\nx-y=0', x0: '3', y0: '3', z0: '0' } },
          { txt: 'SI · ninguna terna sirve', tip: 'sistema incompatible', set: { sis: 'x+y+z=1\nx+y+z=2\nx-y=0', x0: '0', y0: '0', z0: '1' } },
          { txt: 'Terna con fracciones', tip: 'valores 1/2 y 3/2', set: { sis: '2x+2y=4\nx-y=-1\nz=3', x0: '1/2', y0: '3/2', z0: '3' } }
        ])
      ],
      safe(function (v) {
        var sis = leeSistema(v.sis, ['x', 'y', 'z'], 2, 4);
        var A = sis.A, b = sis.b, vars = ['x', 'y', 'z'];
        var x0 = FR(String(v.x0).trim()), y0 = FR(String(v.y0).trim()), z0 = FR(String(v.z0).trim());
        var terna = [x0, y0, z0];

        var h = caja('Sistema', lin().sisTex(A, b, vars));
        h += caja('Terna que vamos a comprobar', '(x_0, y_0, z_0) = ' +
          '\\left(' + FT(x0) + ',\\; ' + FT(y0) + ',\\; ' + FT(z0) + '\\right)');

        /* --- comprobación ecuación por ecuación --- */
        var filas = [], todas = true, i, j;
        for (i = 0; i < A.f; i++) {
          var partes = [], suma = F0();
          for (j = 0; j < A.c; j++) {
            var c = A.a[i][j];
            if (cero(c)) continue;
            partes.push((partes.length ? (negF(c) ? ' - ' : ' + ') : (negF(c) ? '-' : '')) +
              (igF(absF(c), F1()) ? '' : FT(absF(c)) + ' \\cdot ') +
              '\\left(' + FT(terna[j]) + '\\right)');
            suma = suma.mas(c.por(terna[j]));
          }
          if (!partes.length) partes.push('0');
          var ok = igF(suma, b[i]);
          if (!ok) todas = false;
          filas.push({
            celdas: [
              K('E_' + (i + 1) + ':\\; ' + lin().ecuTex(A.a[i], b[i], vars)),
              K(partes.join('') + ' = ' + FT(suma)),
              K(FT(b[i])),
              ok ? S.badge('se cumple', 'si') : S.badge('no se cumple', 'no')
            ],
            clase: ok ? 'sysb-ok' : 'sysb-ko'
          });
        }
        h += '<h5>Sustitución ecuación por ecuación</h5>';
        h += S.tabla(['Ecuación', 'Valor del primer miembro', 'Debería valer', '¿Se cumple?'], filas);

        h += todas
          ? '<p class="ap-ok">La terna cumple <b>todas</b> las ecuaciones: es una solución del sistema.</p>'
          : '<p class="ap-warn">Basta con que falle <b>una sola</b> ecuación para que la terna no sea solución del sistema. ' +
          'Cumplir algunas ecuaciones no es suficiente.</p>';

        /* --- la solución verdadera --- */
        var D = lin().resuelve(A, b, vars);
        h += '<h5>¿Y cuáles son las soluciones verdaderas?</h5>';
        h += '<div class="sysb-tipo">' + insignia(D.tipo) + '</div>';
        h += bloqueDiscusion(D);
        h += bloqueSolucion(D);
        if (D.tipo === 'SCD') {
          h += '<p class="sysb-txt">Como el sistema es ' + nombreTipo('SCD') + ', solo hay una terna que lo cumple: ' +
            K('\\left(' + D.sol.map(function (f) { return FT(f); }).join(',\\; ') + '\\right)') + '.</p>';
        }
        h += caja('Matriz ampliada del sistema', lin().matTex(D.Ab, { aug: 1 }));
        return h;
      }));
  };

  /* ==================================================================
     4 · Tema 4.8 · posiciones relativas de tres planos
     ================================================================== */

  /* Paralelogramo estilizado que representa un plano. */
  function planoSVG(x, y, w, h, sk, col, alfa, ancho) {
    var pts = [[x, y], [x + w, y], [x + w - sk, y + h], [x - sk, y + h]];
    return '<polygon points="' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' ') +
      '" fill="' + col + '" fill-opacity="' + (alfa === undefined ? 0.22 : alfa) +
      '" stroke="' + col + '" stroke-width="' + (ancho || 3) + '" stroke-linejoin="round"/>';
  }
  function rot(cx, cy, w, h, ang, col, alfa) {
    return '<g transform="rotate(' + ang + ' ' + cx + ' ' + cy + ')">' +
      planoSVG(cx - w / 2, cy - h / 2, w, h, 42, col, alfa) + '</g>';
  }

  var ESCENAS = {
    punto: function () {
      var b = '';
      b += rot(380, 300, 460, 210, -16, COL.azul, 0.18);
      b += rot(380, 300, 460, 210, 18, COL.rojo, 0.16);
      b += rot(380, 300, 440, 220, 78, COL.verde, 0.14);
      b += S.circle(380, 300, 11, COL.morado, '#fff', 3);
      b += S.txt(398, 282, 'solución única', { anchor: 'start', size: 20, weight: 'bold', fill: COL.morado });
      b += S.txt(96, 176, 'π₁', { size: 24, weight: 'bold', fill: COL.azul });
      b += S.txt(668, 196, 'π₂', { size: 24, weight: 'bold', fill: COL.rojo });
      b += S.txt(378, 112, 'π₃', { size: 24, weight: 'bold', fill: COL.verde });
      return b;
    },
    recta: function () {
      var b = '';
      b += rot(380, 300, 460, 200, -22, COL.azul, 0.18);
      b += rot(380, 300, 460, 200, 22, COL.rojo, 0.16);
      b += rot(380, 300, 460, 200, 66, COL.verde, 0.14);
      b += S.line(140, 386, 620, 214, COL.morado, 7);
      b += S.txt(626, 200, 'recta común', { anchor: 'start', size: 20, weight: 'bold', fill: COL.morado });
      b += S.txt(96, 200, 'π₁', { size: 24, weight: 'bold', fill: COL.azul });
      b += S.txt(96, 430, 'π₂', { size: 24, weight: 'bold', fill: COL.rojo });
      b += S.txt(660, 430, 'π₃', { size: 24, weight: 'bold', fill: COL.verde });
      return b;
    },
    plano: function () {
      var b = '';
      b += planoSVG(120, 200, 470, 190, 60, COL.azul, 0.18);
      b += planoSVG(132, 212, 470, 190, 60, COL.rojo, 0.14);
      b += planoSVG(144, 224, 470, 190, 60, COL.verde, 0.12);
      b += S.txt(380, 452, 'los tres planos son el mismo', { size: 22, weight: 'bold', fill: COL.morado });
      b += S.txt(614, 214, 'π₁ = π₂ = π₃', { anchor: 'start', size: 22, weight: 'bold', fill: COL.azulOsc });
      return b;
    },
    paralelos: function () {
      var b = '';
      b += planoSVG(150, 150, 440, 130, 55, COL.azul, 0.18);
      b += planoSVG(150, 290, 440, 130, 55, COL.rojo, 0.16);
      b += planoSVG(150, 430, 440, 130, 55, COL.verde, 0.14);
      b += S.txt(612, 176, 'π₁', { anchor: 'start', size: 24, weight: 'bold', fill: COL.azul });
      b += S.txt(612, 316, 'π₂', { anchor: 'start', size: 24, weight: 'bold', fill: COL.rojo });
      b += S.txt(612, 456, 'π₃', { anchor: 'start', size: 24, weight: 'bold', fill: COL.verde });
      b += S.txt(360, 122, 'planos paralelos: ningún punto común', { size: 21, weight: 'bold', fill: COL.texto });
      return b;
    },
    dosParalelos: function () {
      var b = '';
      b += planoSVG(140, 170, 430, 130, 55, COL.azul, 0.18);
      b += planoSVG(140, 330, 430, 130, 55, COL.rojo, 0.16);
      b += rot(360, 320, 420, 250, 74, COL.verde, 0.14);
      b += S.line(196, 300, 596, 232, COL.morado, 6);
      b += S.line(196, 460, 596, 392, COL.morado, 6);
      b += S.txt(600, 196, 'π₁', { anchor: 'start', size: 24, weight: 'bold', fill: COL.azul });
      b += S.txt(600, 356, 'π₂', { anchor: 'start', size: 24, weight: 'bold', fill: COL.rojo });
      b += S.txt(330, 108, 'π₃', { size: 24, weight: 'bold', fill: COL.verde });
      b += S.txt(360, 526, 'dos rectas de corte paralelas: no hay punto común a los tres', { size: 19, weight: 'bold', fill: COL.texto });
      return b;
    },
    prisma: function () {
      var b = '';
      b += rot(380, 300, 430, 220, -30, COL.azul, 0.16);
      b += rot(380, 300, 430, 220, 30, COL.rojo, 0.16);
      b += planoSVG(150, 380, 460, 140, 50, COL.verde, 0.14);
      b += S.line(250, 200, 250, 470, COL.morado, 6);
      b += S.line(510, 200, 510, 470, COL.morado, 6);
      b += S.line(380, 150, 380, 430, COL.morado, 6);
      b += S.txt(120, 250, 'π₁', { size: 24, weight: 'bold', fill: COL.azul });
      b += S.txt(650, 250, 'π₂', { size: 24, weight: 'bold', fill: COL.rojo });
      b += S.txt(120, 470, 'π₃', { size: 24, weight: 'bold', fill: COL.verde });
      b += S.txt(380, 534, 'tres rectas de corte paralelas: forman un prisma, sin punto común', { size: 19, weight: 'bold', fill: COL.texto });
      return b;
    }
  };

  var DESC_ESCENA = {
    punto: {
      titulo: 'Los tres planos se cortan en un punto',
      rangos: 'rg(A) = rg(A|B) = 3 = n',
      tipo: 'SCD',
      texto: 'Cada ecuación es un plano del espacio. Cuando los tres se cortan en un único punto, ese punto es la ' +
        'única terna que cumple las tres ecuaciones: el sistema es compatible determinado.'
    },
    recta: {
      titulo: 'Los tres planos comparten una recta',
      rangos: 'rg(A) = rg(A|B) = 2 < 3 = n',
      tipo: 'SCI',
      texto: 'Los planos se cortan dos a dos en la misma recta (forman un haz). Todos los puntos de esa recta son ' +
        'soluciones: hay infinitas, descritas con un parámetro (un grado de libertad).'
    },
    plano: {
      titulo: 'Los tres planos son el mismo',
      rangos: 'rg(A) = rg(A|B) = 1 < 3 = n',
      tipo: 'SCI',
      texto: 'Las tres ecuaciones son proporcionales: dicen lo mismo. Cualquier punto del plano es solución, así que ' +
        'las soluciones dependen de dos parámetros (dos grados de libertad).'
    },
    paralelos: {
      titulo: 'Planos paralelos distintos',
      rangos: 'rg(A) = 1 < rg(A|B) = 2',
      tipo: 'SI',
      texto: 'Los coeficientes de las incógnitas son proporcionales, pero los términos independientes no siguen esa ' +
        'proporción: los planos son paralelos y no tienen ningún punto en común. El sistema es incompatible.'
    },
    dosParalelos: {
      titulo: 'Dos planos paralelos cortados por un tercero',
      rangos: 'rg(A) = 2 < rg(A|B) = 3',
      tipo: 'SI',
      texto: 'El tercer plano corta a los otros dos en dos rectas paralelas. No existe ningún punto que esté en los ' +
        'tres planos a la vez: el sistema es incompatible.'
    },
    prisma: {
      titulo: 'Los planos se cortan dos a dos (prisma)',
      rangos: 'rg(A) = 2 < rg(A|B) = 3',
      tipo: 'SI',
      texto: 'Cada pareja de planos se corta en una recta, pero las tres rectas son paralelas y forman la superficie ' +
        'de un prisma triangular. No hay ningún punto común a los tres: el sistema es incompatible.'
    }
  };

  /* ¿Son proporcionales dos filas de coeficientes? */
  function proporcionales(u, w) {
    var i, j;
    for (i = 0; i < u.length; i++) {
      for (j = 0; j < u.length; j++) {
        if (!cero(u[i].por(w[j]).menos(u[j].por(w[i])))) return false;
      }
    }
    var todoCeroU = u.every(cero), todoCeroW = w.every(cero);
    return !todoCeroU && !todoCeroW;
  }

  /* Escena que corresponde a un sistema 3×3 concreto. */
  function escenaDe(A, b) {
    var D = lin().discute(A, b, ['x', 'y', 'z']);
    var clave;
    if (D.tipo === 'SCD') clave = 'punto';
    else if (D.tipo === 'SCI') clave = (D.rA === 1 ? 'plano' : 'recta');
    else if (D.rA === 1) clave = 'paralelos';
    else {
      /* rg(A) = 2: ¿hay dos planos paralelos o es un prisma? */
      var hayPar = false, i, j;
      for (i = 0; i < A.f; i++) {
        for (j = i + 1; j < A.f; j++) {
          if (proporcionales(A.a[i], A.a[j])) hayPar = true;
        }
      }
      clave = hayPar ? 'dosParalelos' : 'prisma';
    }
    return { clave: clave, disc: D };
  }

  R.planos3 = function (node) {
    S.shell(node, 'Posiciones relativas de tres planos',
      'Cada ecuación con tres incógnitas es un <b>plano</b> del espacio, y resolver el sistema es buscar los puntos ' +
      'comunes a los tres. Escribe el sistema con una ecuación por línea (<code>x+y+z=6</code>, ' +
      '<code>2x-3y+z=5</code>); admite decimales con coma (<code>0,5</code>) y fracciones (<code>3/4</code>). ' +
      'También puedes elegir directamente una posición en el desplegable para ver su esquema.',
      [
        {
          id: 'sis', label: 'Sistema (una ecuación por línea)', type: 'textarea', rows: 3,
          value: 'x+y+z=6\n2x-y+z=3\nx+2y-z=2', ancho: '22rem'
        },
        {
          id: 'modo', label: 'Qué dibujo', type: 'select', value: 'sistema', ancho: '13rem',
          options: [
            { value: 'sistema', label: 'la posición de mi sistema' },
            { value: 'punto', label: 'esquema: corte en un punto' },
            { value: 'recta', label: 'esquema: recta común' },
            { value: 'plano', label: 'esquema: planos coincidentes' },
            { value: 'paralelos', label: 'esquema: planos paralelos' },
            { value: 'dosParalelos', label: 'esquema: dos paralelos y uno secante' },
            { value: 'prisma', label: 'esquema: prisma (cortes dos a dos)' }
          ]
        },
        chips([
          { txt: 'SCD · punto', tip: 'los tres planos se cortan en un punto', set: { modo: 'sistema', sis: 'x+y+z=6\n2x-y+z=3\nx+2y-z=2' } },
          { txt: 'SCI · recta', tip: 'un haz de planos', set: { modo: 'sistema', sis: 'x+y+z=3\n2x+y-z=2\n3x+2y=5' } },
          { txt: 'SCI · plano', tip: 'las tres ecuaciones son la misma', set: { modo: 'sistema', sis: 'x+y+z=3\n2x+2y+2z=6\n3x+3y+3z=9' } },
          { txt: 'SI · paralelos', tip: 'mismos coeficientes, distinto término', set: { modo: 'sistema', sis: 'x+y+z=1\nx+y+z=2\nx+y+z=3' } },
          { txt: 'SI · prisma', tip: 'cortes dos a dos', set: { modo: 'sistema', sis: 'x+y+z=1\nx-y+2z=2\n2x+4z=5' } },
          { txt: 'SI · dos paralelos', tip: 'dos planos paralelos y uno que los corta', set: { modo: 'sistema', sis: 'x+y+z=1\n2x+2y+2z=5\nx-y=0' } }
        ])
      ],
      safe(function (v) {
        var h = '';
        var clave, D = null, A = null, b = null;
        if (v.modo === 'sistema') {
          var sis = leeSistema(v.sis, ['x', 'y', 'z'], 3, 3);
          A = sis.A; b = sis.b;
          var e = escenaDe(A, b);
          clave = e.clave; D = e.disc;
          h += caja('Sistema leído', lin().sisTex(A, b, ['x', 'y', 'z']));
        } else {
          clave = v.modo;
        }
        if (!DESC_ESCENA[clave]) {
          throw Error('Elige una de las opciones del desplegable «Qué dibujo»: la posición de tu sistema ' +
            'o uno de los seis esquemas.');
        }
        var info = DESC_ESCENA[clave];
        h += '<div class="sysb-tipo">' + insignia(info.tipo) + '</div>';
        h += S.svgWrap(ESCENAS[clave](), 760, 560,
          'Esquema de tres planos: ' + info.titulo,
          info.titulo + '. Es un esquema, no una figura a escala: sirve para reconocer la posición relativa.');
        h += S.kvs(['posición: <b>' + info.titulo + '</b>', 'rangos típicos: <b>' + info.rangos + '</b>',
          'tipo: <b>' + info.tipo + '</b>']);
        h += '<p class="sysb-txt">' + info.texto + '</p>';

        if (D) {
          h += '<h5>Los rangos de tu sistema</h5>';
          h += bloqueDiscusion(D);
          h += bloqueSolucion(D);
          h += caja('Matriz ampliada', lin().matTex(lin().matAmpliada(A, b), { aug: 1 }));
        } else {
          h += '<p class="sysb-txt">Elige «la posición de mi sistema» en el desplegable para que el applet calcule los ' +
            'rangos de las ecuaciones que has escrito y decida en cuál de los seis casos estás.</p>';
        }

        h += '<h5>Las seis posiciones de un vistazo</h5>';
        var filas = ['punto', 'recta', 'plano', 'paralelos', 'dosParalelos', 'prisma'].map(function (c) {
          var d = DESC_ESCENA[c];
          return {
            celdas: [d.titulo, K('\\operatorname{rg}(A)') + ' y ' + K('\\operatorname{rg}(A|B)') + ': ' + d.rangos,
              insignia(d.tipo)],
            clase: c === clave ? 'sysb-ok' : ''
          };
        });
        h += S.tabla(['Posición relativa', 'Rangos', 'Tipo de sistema'], filas);
        return h;
      }));
  };

  /* ==================================================================
     5 · Tema 4.9 · método de Gauss, automático y manual
     ================================================================== */

  /* Aplica una operación elemental a una matriz (devuelve copia). */
  function aplicaOp(M, op) {
    var N = M.copia(), c;
    if (op.tipo === 'inter') {
      var t = N.a[op.i]; N.a[op.i] = N.a[op.j]; N.a[op.j] = t;
      return N;
    }
    if (op.tipo === 'escala') {
      for (c = 0; c < N.c; c++) N.a[op.i][c] = N.a[op.i][c].por(op.k);
      return N;
    }
    for (c = 0; c < N.c; c++) N.a[op.i][c] = N.a[op.i][c].menos(op.k.por(N.a[op.j][c]));
    return N;
  }
  function opTexto(op) {
    if (op.tipo === 'inter') return 'F_{' + (op.i + 1) + '} \\leftrightarrow F_{' + (op.j + 1) + '}';
    if (op.tipo === 'escala') return 'F_{' + (op.i + 1) + '} \\to ' + FT(op.k) + ' F_{' + (op.i + 1) + '}';
    var sg = negF(op.k) ? ' + ' : ' - ';
    var cuerpo = igF(absF(op.k), F1()) ? '' : FT(absF(op.k));
    return 'F_{' + (op.i + 1) + '} \\to F_{' + (op.i + 1) + '}' + sg + cuerpo + 'F_{' + (op.j + 1) + '}';
  }

  /* Sugerencia del siguiente movimiento en el modo manual. */
  function sugerencia(M) {
    var r = 0, j, i;
    for (j = 0; j < M.c - 1 && r < M.f; j++) {
      var piv = -1;
      for (i = r; i < M.f; i++) if (!cero(M.a[i][j])) { piv = i; break; }
      if (piv < 0) continue;
      if (piv !== r) {
        return 'Intercambia las filas ' + (r + 1) + ' y ' + (piv + 1) +
          ' para colocar un pivote no nulo en la columna ' + (j + 1) + '.';
      }
      for (i = r + 1; i < M.f; i++) {
        if (cero(M.a[i][j])) continue;
        var k = M.a[i][j].entre(M.a[r][j]);
        return 'Haz cero el elemento de la fila ' + (i + 1) + ', columna ' + (j + 1) +
          ' con la operación ' + K('F_{' + (i + 1) + '} \\to F_{' + (i + 1) + '} - ' + FT(k) +
            'F_{' + (r + 1) + '}') + ', es decir: fila destino ' + (i + 1) + ', fila origen ' + (r + 1) +
          ' y multiplicador ' + K(FT(k)) + '.';
      }
      r++;
    }
    return null;
  }

  R.gauss = function (node) {
    var hist = [];
    S.shell(node, 'Método de Gauss paso a paso',
      'Escribe la <b>matriz ampliada</b> ' + K('(A|B)') + ' del sistema: <b>una fila por línea</b> y ' +
      '<b>cuatro números separados por espacios</b> en cada fila (los tres coeficientes y el término ' +
      'independiente). Admite enteros (<code>1 -2 3 5</code>), decimales con coma (<code>0,5</code>) y ' +
      'fracciones (<code>3/4</code>); escribe <code>0</code> donde falte una incógnita. ' +
      'En el <b>modo automático</b> verás todos los pasos en la notación ' +
      K('F_i \\to F_i - k\\,F_j') + '; en el <b>modo manual</b> eliges tú la operación (fila origen, ' +
      'fila destino y multiplicador) y el applet aplica el efecto y te dice si vas bien.',
      [
        {
          id: 'M', label: 'Matriz ampliada 3×4', type: 'textarea', rows: 3,
          value: '1 1 1 6\n2 -1 1 3\n1 2 -1 2', ancho: '18rem'
        },
        {
          id: 'modo', label: 'Modo', type: 'select', value: 'auto', ancho: '12rem',
          options: [{ value: 'auto', label: 'automático' }, { value: 'manual', label: 'manual' }]
        },
        {
          id: 'tipo', label: 'Operación', type: 'select', value: 'resta', ancho: '17rem',
          options: [
            { value: 'resta', label: 'Fd → Fd − k·Fo' },
            { value: 'inter', label: 'intercambiar Fd ↔ Fo' },
            { value: 'escala', label: 'Fd → k·Fd' }
          ]
        },
        { id: 'dest', label: 'Fila destino Fd', type: 'select', value: '2', ancho: '8rem', options: [{ value: '1', label: 'F₁' }, { value: '2', label: 'F₂' }, { value: '3', label: 'F₃' }] },
        { id: 'orig', label: 'Fila origen Fo', type: 'select', value: '1', ancho: '8rem', options: [{ value: '1', label: 'F₁' }, { value: '2', label: 'F₂' }, { value: '3', label: 'F₃' }] },
        { id: 'k', label: 'Multiplicador k', type: 'text', value: '2', ancho: '8rem' },
        {
          id: 'aplicar', label: 'Aplicar operación', type: 'button',
          click: function (ctl) {
            try {
              var i = Number(ctl.dest.value) - 1, j = Number(ctl.orig.value) - 1;
              var t = ctl.tipo.value;
              var k = (t === 'inter') ? F1() : FR(String(ctl.k.value));
              if (t !== 'escala' && i === j) throw Error('La fila destino y la fila origen deben ser distintas.');
              if (t === 'escala' && cero(k)) throw Error('No se puede multiplicar una fila por 0.');
              hist.push({ tipo: t, i: i, j: j, k: k });
            } catch (e) {
              hist.push({ error: (e && e.message) || 'Operación no válida.' });
            }
          }
        },
        {
          id: 'deshacer', label: 'Deshacer', type: 'button',
          click: function () { hist.pop(); }
        },
        {
          id: 'reiniciar', label: 'Reiniciar', type: 'button',
          click: function () { hist.length = 0; }
        },
        chips([
          { txt: 'SCD · solución única', tip: '(1, 2, 3)', set: { M: '1 1 1 6\n2 -1 1 3\n1 2 -1 2', modo: 'auto' }, extra: function () { hist.length = 0; } },
          { txt: 'SCI · fila nula', tip: 'aparece 0 0 0 | 0', set: { M: '1 1 1 3\n2 1 -1 2\n3 2 0 5', modo: 'auto' }, extra: function () { hist.length = 0; } },
          { txt: 'SI · fila imposible', tip: 'aparece 0 0 0 | k', set: { M: '1 1 1 1\n2 2 2 5\n1 -1 0 0', modo: 'auto' }, extra: function () { hist.length = 0; } },
          { txt: 'Con fracciones', tip: 'coeficientes 1/2 y 3/4', set: { M: '1/2 1 -1 2\n3/4 -1 2 1\n1 1 1 4', modo: 'auto' }, extra: function () { hist.length = 0; } },
          { txt: 'Hace falta intercambiar', tip: 'el primer pivote es 0', set: { M: '0 2 1 5\n1 1 1 6\n2 -1 1 3', modo: 'auto' }, extra: function () { hist.length = 0; } },
          { txt: 'Practicar en manual', tip: 'empieza tú el escalonado', set: { M: '1 1 1 6\n2 -1 1 3\n1 2 -1 2', modo: 'manual', tipo: 'resta', dest: '2', orig: '1', k: '2' }, extra: function () { hist.length = 0; } }
        ])
      ],
      safe(function (v) {
        var M = leeMatriz(v.M, 3, 4, 'la matriz ampliada');
        var pa = parte(M);
        var vars = ['x', 'y', 'z'];
        var D = lin().discute(pa.A, pa.b, vars);

        var h = caja('Sistema que representa esa matriz', lin().sisTex(pa.A, pa.b, vars));
        h += caja('Matriz ampliada de partida', lin().matTex(M, { aug: 1 }));

        if (v.modo === 'auto') {
          var G = lin().gauss(M, { aug: 1 });
          h += '<h5>Escalonado automático</h5>';
          h += '<p class="sysb-txt">Cada paso usa una operación elemental: sumar a una fila un múltiplo de otra ' +
            '(' + K('F_i \\to F_i - k F_j') + ') o intercambiar dos filas. Estas operaciones no cambian las ' +
            'soluciones del sistema: el sistema que sale es <b>equivalente</b> al de partida.</p>';
          h += pasosGauss(G, 1, 0);
          h += caja('Matriz escalonada, con los pivotes marcados',
            lin().matTex(G.fin, { aug: 1, marca: G.pivotes }));
          var dg = diagnosticoFilas(G.fin);
          if (dg.incompatibles.length) {
            h += '<p class="ap-warn">La fila ' + dg.incompatibles[0].fila + ' ha quedado ' +
              K('0x + 0y + 0z = ' + FT(dg.incompatibles[0].valor)) + ', que es imposible. ' +
              'En cuanto aparece una fila así se puede parar: el sistema es <b>incompatible</b>.</p>';
          }
          if (dg.nulas.length) {
            h += '<p class="sysb-txt">Han quedado ' + dg.nulas.length + ' fila(s) completamente nulas (' +
              K('0 = 0') + '): esas ecuaciones no aportaban información nueva, eran combinación de las demás.</p>';
          }
          h += '<h5>Conclusión</h5>';
          h += '<div class="sysb-tipo">' + insignia(D.tipo) + '</div>';
          h += bloqueDiscusion(D);
          h += bloqueSolucion(D);
          if (D.tipo === 'SCD') {
            h += '<p class="sysb-txt">Desde la última fila hacia arriba se despeja cada incógnita (sustitución ' +
              'hacia atrás) y se obtiene la solución.</p>';
            var comp = lin().compruebaSol(pa.A, pa.b, D.sol);
            h += S.tabla(['Ecuación', 'Primer miembro', 'Término independiente', '¿Cuadra?'],
              comp.filas.map(function (f) {
                return [K('E_' + f.ecuacion), K(FT(f.valor)), K(FT(f.esperado)),
                  f.ok ? S.badge('sí', 'si') : S.badge('no', 'no')];
              }));
          }
          return h;
        }

        /* ---------------- modo manual ---------------- */
        h += '<h5>Modo manual: tú eliges la operación</h5>';
        h += '<p class="sysb-txt">Elige el tipo de operación, la fila destino, la fila origen y el multiplicador; ' +
          'después pulsa <b>Aplicar operación</b>. Puedes <b>Deshacer</b> el último movimiento o <b>Reiniciar</b> ' +
          'y empezar de nuevo. Recuerda: el multiplicador puede ser entero (<code>2</code>), decimal con coma ' +
          '(<code>0,5</code>) o fracción (<code>3/4</code>), y también negativo (<code>-3</code>).</p>';

        var actual = M.copia(), errores = [];
        var lista = '';
        hist.forEach(function (op, idx) {
          if (op.error) { errores.push(op.error); return; }
          actual = aplicaOp(actual, op);
          lista += S.paso(String(idx + 1),
            '<p>Operación elegida: ' + K(opTexto(op)) + '</p>' +
            KD(lin().matTex(actual, { aug: 1 })));
        });
        if (errores.length) {
          h += '<div class="mx-bad sysb-err">' + S.esc(errores[errores.length - 1]) + '</div>';
        }
        h += lista || '<p class="sysb-txt">Todavía no has aplicado ninguna operación: la matriz es la de partida.</p>';
        h += caja('Matriz actual', lin().matTex(actual, { aug: 1 }));

        var dgm = diagnosticoFilas(actual);
        var avisos = [];
        if (dgm.nulas.length) {
          avisos.push('Fila(s) nula(s): ' + dgm.nulas.join(', ') + '. Una fila ' + K('0 = 0') +
            ' significa que esa ecuación era combinación de las otras.');
        }
        if (dgm.incompatibles.length) {
          avisos.push('¡Atención! La fila ' + dgm.incompatibles[0].fila + ' dice ' +
            K('0 = ' + FT(dgm.incompatibles[0].valor)) + ', que es imposible: el sistema es incompatible.');
        }
        if (avisos.length) h += '<ul class="sysb-avisos"><li>' + avisos.join('</li><li>') + '</li></ul>';

        var sug = sugerencia(actual);
        h += sug
          ? '<p class="sysb-pista"><b>Pista:</b> ' + sug + '</p>'
          : '<p class="ap-ok">La matriz ya está <b>escalonada</b>: debajo de cada pivote solo hay ceros. ' +
          'Ahora se despeja de abajo arriba.</p>';

        var pam = parte(actual);
        h += S.kvs([
          'rg(A) actual = <b>' + lin().rango(pam.A) + '</b>',
          'rg(A|B) actual = <b>' + lin().rango(actual) + '</b>',
          'operaciones aplicadas: <b>' + hist.filter(function (o) { return !o.error; }).length + '</b>'
        ]);
        h += '<p class="sysb-txt">Las operaciones elementales no cambian los rangos ni las soluciones: el sistema de ' +
          'la matriz actual es equivalente al de partida. Por eso la clasificación no varía por muchas operaciones ' +
          'que hagas.</p>';
        h += '<div class="sysb-tipo">' + insignia(D.tipo) + '</div>';
        h += bloqueSolucion(D);
        return h;
      }));
  };

  /* ==================================================================
     6 · Tema 4.9 · forma escalonada y pivotes
     ================================================================== */
  R.escalonada = function (node) {
    S.shell(node, 'Forma escalonada, pivotes y rango',
      'Escribe la matriz ampliada del sistema: <b>una fila por línea</b> y los números separados por espacios ' +
      '(por ejemplo <code>1 1 1 6</code>). Valen enteros (<code>-2</code>), decimales con coma (<code>0,5</code>) ' +
      'y fracciones (<code>3/4</code>). El applet escalona, <b>marca los pivotes</b>, cuenta el rango y localiza ' +
      'las filas nulas (' + K('0 = 0') + ') y las filas imposibles (' + K('0 = k') + ' con ' + K('k \\neq 0') + ').',
      [
        {
          id: 'M', label: 'Matriz ampliada', type: 'textarea', rows: 3,
          value: '1 1 1 6\n2 -1 1 3\n1 2 -1 2', ancho: '18rem'
        },
        {
          id: 'jordan', label: 'Seguir hasta Gauss-Jordan (ceros también arriba)', type: 'check', value: false
        },
        chips([
          { txt: 'SCD · tres pivotes', tip: 'rango 3', set: { M: '1 1 1 6\n2 -1 1 3\n1 2 -1 2', jordan: false } },
          { txt: 'SCI · una fila nula', tip: 'rango 2 con 3 incógnitas', set: { M: '1 1 1 3\n2 1 -1 2\n3 2 0 5', jordan: false } },
          { txt: 'SI · fila imposible', tip: '0 0 0 | 3', set: { M: '1 1 1 1\n2 2 2 5\n1 -1 0 0', jordan: false } },
          { txt: 'Dos filas nulas', tip: 'rango 1', set: { M: '1 2 3 4\n2 4 6 8\n3 6 9 12', jordan: false } },
          { txt: 'Sistema 2×3', tip: 'menos ecuaciones que incógnitas', set: { M: '1 1 1 6\n1 -1 2 3', jordan: false } },
          { txt: 'Gauss-Jordan', tip: 'matriz identidad a la izquierda', set: { M: '1 1 1 6\n2 -1 1 3\n1 2 -1 2', jordan: true } }
        ])
      ],
      safe(function (v) {
        var M = leeMatriz(v.M, 0, 0, 'la matriz ampliada');
        if (M.c < 2) throw Error('Cada fila necesita al menos dos números: los coeficientes y el término independiente.');
        var pa = parte(M);
        var vars = ['x', 'y', 'z', 't'].slice(0, M.c - 1);
        var G = lin().gauss(M, { aug: 1, jordan: !!v.jordan });

        var h = caja('Sistema asociado', lin().sisTex(pa.A, pa.b, vars));
        h += caja('Matriz ampliada de partida', lin().matTex(M, { aug: 1 }));
        h += '<h5>Escalonado</h5>';
        h += pasosGauss(G, 1, 1) || '<p class="sysb-txt">La matriz ya estaba escalonada: no ha hecho falta ninguna operación.</p>';
        h += caja(v.jordan ? 'Forma reducida de Gauss-Jordan (pivotes marcados)' : 'Forma escalonada (pivotes marcados)',
          lin().matTex(G.fin, { aug: 1, marca: G.pivotes }));

        var filas = G.pivotes.map(function (p) {
          return [K('a_{' + (p[0] + 1) + (p[1] + 1) + '} = ' + FT(G.fin.a[p[0]][p[1]])),
            'fila ' + (p[0] + 1), 'columna ' + (p[1] + 1) + ' (incógnita ' + vars[p[1]] + ')'];
        });
        h += '<h5>Los pivotes</h5>';
        h += filas.length
          ? S.tabla(['Pivote', 'Fila', 'Columna'], filas)
          : '<p class="sysb-txt">No hay ningún pivote: todos los coeficientes son nulos.</p>';
        h += '<p class="sysb-txt">Un <b>pivote</b> es el primer elemento no nulo de una fila escalonada. ' +
          'El número de pivotes de la parte de coeficientes es el <b>rango</b> de ' + K('A') + '.</p>';

        var dg = diagnosticoFilas(G.fin);
        var rA = lin().rango(pa.A), rAb = lin().rango(M);
        h += S.kvs([
          'rg(A) = <b>' + rA + '</b>',
          'rg(A|B) = <b>' + rAb + '</b>',
          'incógnitas = <b>' + (M.c - 1) + '</b>',
          'filas nulas = <b>' + dg.nulas.length + '</b>',
          'filas imposibles = <b>' + dg.incompatibles.length + '</b>'
        ]);
        if (dg.nulas.length) {
          h += '<p class="sysb-txt">Filas nulas (' + K('0 = 0') + '): ' + dg.nulas.join(', ') +
            '. Corresponden a ecuaciones que eran combinación de las otras; se pueden tachar sin perder nada.</p>';
        }
        if (dg.incompatibles.length) {
          h += '<p class="ap-warn">Fila imposible: la número ' + dg.incompatibles[0].fila + ' ha quedado ' +
            K('0 = ' + FT(dg.incompatibles[0].valor)) + '. Ninguna terna de números puede cumplirla, ' +
            'así que el sistema no tiene solución.</p>';
        }

        var D = lin().discute(pa.A, pa.b, vars);
        h += '<h5>Conclusión</h5>';
        h += '<div class="sysb-tipo">' + insignia(D.tipo) + '</div>';
        h += bloqueDiscusion(D);
        h += bloqueSolucion(D);
        return h;
      }));
  };

  /* ==================================================================
     7 · Tema 4.10 · expresión matricial de un sistema
     ================================================================== */
  R.matricial = function (node) {
    S.shell(node, 'Expresión matricial de un sistema',
      'Todo sistema lineal se puede escribir como ' + K('A \\cdot X = B') + ', donde ' + K('A') +
      ' es la matriz de coeficientes, ' + K('X') + ' la columna de incógnitas y ' + K('B') +
      ' la de términos independientes. En el modo <b>sistema → matrices</b> escribe una ecuación por línea ' +
      '(<code>2x-3y+z=5</code>, <code>x+y=2</code>, con decimales <code>0,5</code> o fracciones <code>3/4</code>). ' +
      'En el modo <b>matrices → sistema</b> escribe la matriz ampliada con los números separados por espacios ' +
      '(<code>2 -3 1 5</code>) y el applet reconstruye las ecuaciones.',
      [
        {
          id: 'modo', label: 'Dirección', type: 'select', value: 'sm', ancho: '16rem',
          options: [
            { value: 'sm', label: 'sistema → matrices' },
            { value: 'ms', label: 'matrices → sistema' }
          ]
        },
        {
          id: 'sis', label: 'Sistema (una ecuación por línea)', type: 'textarea', rows: 3,
          value: '2x-3y+z=5\nx+y-z=0\n3x+2y=7', ancho: '20rem'
        },
        {
          id: 'M', label: 'Matriz ampliada (una fila por línea)', type: 'textarea', rows: 3,
          value: '2 -3 1 5\n1 1 -1 0\n3 2 0 7', ancho: '16rem'
        },
        chips([
          { txt: 'SCD · 3×3', tip: 'solución única', set: { modo: 'sm', sis: 'x+y+z=6\n2x-y+z=3\nx+2y-z=2', M: '1 1 1 6\n2 -1 1 3\n1 2 -1 2' } },
          { txt: 'SCI · ecuación repetida', tip: 'infinitas soluciones', set: { modo: 'sm', sis: 'x+y+z=3\n2x+2y+2z=6\nx-y=0', M: '1 1 1 3\n2 2 2 6\n1 -1 0 0' } },
          { txt: 'SI · contradicción', tip: 'sin solución', set: { modo: 'sm', sis: 'x+y=1\nx+y=2\nx-y=0', M: '1 1 1\n1 1 2\n1 -1 0' } },
          { txt: 'Sistema 2×2', tip: 'matrices pequeñas', set: { modo: 'sm', sis: '2x+3y=5\nx-y=1', M: '2 3 5\n1 -1 1' } },
          { txt: 'De matrices a sistema', tip: 'camino de vuelta', set: { modo: 'ms', M: '1 0 -2 4\n0 1 3 -1\n2 1 0 5', sis: 'x-2z=4\ny+3z=-1\n2x+y=5' } },
          { txt: 'Con fracciones', tip: 'coeficientes 1/2', set: { modo: 'sm', sis: '1/2x+y=3\nx-1/3y=1', M: '1/2 1 3\n1 -1/3 1' } }
        ])
      ],
      safe(function (v) {
        var A, b, vars, h = '';
        if (v.modo === 'sm') {
          var sis = leeSistema(v.sis, null, 1, 4);
          A = sis.A; b = sis.b; vars = sis.vars;
          h += caja('Sistema de partida', lin().sisTex(A, b, vars));
        } else {
          var M = leeMatriz(v.M, 0, 0, 'la matriz ampliada');
          if (M.c < 2) throw Error('Cada fila necesita al menos dos números: coeficientes y término independiente.');
          var pa = parte(M);
          A = pa.A; b = pa.b;
          vars = ['x', 'y', 'z', 't'].slice(0, A.c);
          h += caja('Matriz ampliada de partida', lin().matTex(M, { aug: 1 }));
          h += caja('Sistema que representa', lin().sisTex(A, b, vars));
          h += '<p class="sysb-txt">Cada fila es una ecuación: la primera columna multiplica a ' + K(vars[0]) +
            ', la segunda a ' + K(vars[1] || 'y') + ', y la columna de la derecha (después de la raya) recoge ' +
            'los términos independientes.</p>';
        }

        var Xtex = '\\left(\\begin{array}{c}' + vars.join(' \\\\ ') + '\\end{array}\\right)';
        var Btex = '\\left(\\begin{array}{c}' +
          b.map(function (f) { return FT(f); }).join(' \\\\ ') + '\\end{array}\\right)';
        h += '<h5>Las tres matrices</h5>';
        h += caja('Matriz de coeficientes A (' + A.f + '×' + A.c + ')', lin().matTex(A));
        h += caja('Matriz de incógnitas X (' + A.c + '×1)', Xtex);
        h += caja('Matriz de términos independientes B (' + A.f + '×1)', Btex);
        h += caja('Expresión matricial del sistema',
          lin().matTex(A) + ' \\cdot ' + Xtex + ' = ' + Btex);
        h += '<p class="sysb-txt">El producto ' + K('A \\cdot X') + ' se hace fila por columna: la fila ' +
          K('i') + ' de ' + K('A') + ' multiplicada por la columna ' + K('X') +
          ' reproduce exactamente el primer miembro de la ecuación ' + K('i') + '.</p>';
        var prodFilas = [];
        var i, j;
        for (i = 0; i < A.f; i++) {
          var trozos = [];
          for (j = 0; j < A.c; j++) trozos.push(FT(A.a[i][j]) + ' \\cdot ' + vars[j]);
          prodFilas.push([K('\\text{fila } ' + (i + 1)), K(trozos.join(' + ')), K(FT(b[i]))]);
        }
        h += S.tabla(['Fila de A', 'Producto fila × X', 'Término independiente'], prodFilas);

        h += '<h5>Matriz ampliada</h5>';
        var Ab = lin().matAmpliada(A, b);
        h += caja('Matriz ampliada (A|B)', lin().matTex(Ab, { aug: 1 }));
        h += '<p class="sysb-txt">La matriz ampliada guarda toda la información del sistema en una sola tabla: ' +
          'a la izquierda de la raya, los coeficientes; a la derecha, los términos independientes. Es la matriz ' +
          'con la que se trabaja en el método de Gauss.</p>';

        var D = lin().discute(A, b, vars);
        h += '<div class="sysb-tipo">' + insignia(D.tipo) + '</div>';
        h += bloqueDiscusion(D);
        h += bloqueSolucion(D);
        if (D.tipo === 'SCD') {
          var comprobado = lin().matPorVector(A, D.sol);
          h += caja('Comprobación del producto A · X',
            lin().matTex(A) + ' \\cdot \\left(\\begin{array}{c}' +
            D.sol.map(function (f) { return FT(f); }).join(' \\\\ ') +
            '\\end{array}\\right) = \\left(\\begin{array}{c}' +
            comprobado.map(function (f) { return FT(f); }).join(' \\\\ ') +
            '\\end{array}\\right)');
          h += '<p class="ap-ok">El resultado coincide con ' + K('B') + ': la solución encontrada es correcta.</p>';
        }
        return h;
      }));
  };

  /* ==================================================================
     8 · Tema 4.10 · rango y discusión (Rouché-Frobenius)
     ================================================================== */
  R.rangoDiscusion = function (node) {
    S.shell(node, 'Rango y discusión de un sistema',
      'El teorema de Rouché-Frobenius compara ' + K('\\operatorname{rg}(A)') + ' con ' +
      K('\\operatorname{rg}(A|B)') + ' y con el número de incógnitas ' + K('n') + '. ' +
      'Escribe el sistema con una ecuación por línea: <code>2x-3y+z=5</code>, <code>x+y-z=0</code>. ' +
      'Puedes usar enteros, decimales con coma (<code>0,5x+y=1</code>) y fracciones (<code>3/4x-y=2</code>), ' +
      'y poner incógnitas en los dos miembros (<code>3x=2y-1</code>). Puedes escribir de 2 a 4 ecuaciones.',
      [
        {
          id: 'sis', label: 'Sistema (una ecuación por línea)', type: 'textarea', rows: 4,
          value: 'x+y+z=6\n2x-y+z=3\nx+2y-z=2', ancho: '22rem'
        },
        chips([
          { txt: 'SCD · rg = rg = n', tip: 'solución única', set: { sis: 'x+y+z=6\n2x-y+z=3\nx+2y-z=2' } },
          { txt: 'SCI · rg = rg < n', tip: 'un parámetro', set: { sis: 'x+y+z=3\n2x+y-z=2\n3x+2y=5' } },
          { txt: 'SCI · dos parámetros', tip: 'rango 1', set: { sis: 'x+y+z=3\n2x+2y+2z=6' } },
          { txt: 'SI · rg(A) < rg(A|B)', tip: 'sin solución', set: { sis: 'x+y+z=1\n2x+2y+2z=5\nx-y=0' } },
          { txt: 'Más ecuaciones que incógnitas', tip: '4 ecuaciones, 3 incógnitas', set: { sis: 'x+y+z=6\n2x-y+z=3\nx+2y-z=2\n4x+2y+z=11' } },
          { txt: 'Sistema 2×2 sencillo', tip: 'para empezar', set: { sis: '2x+3y=5\nx-y=1' } }
        ])
      ],
      safe(function (v) {
        var sis = leeSistema(v.sis, null, 1, 5);
        var A = sis.A, b = sis.b, vars = sis.vars;
        var D = lin().resuelve(A, b, vars);
        var Ab = D.Ab;

        var h = caja('Sistema', lin().sisTex(A, b, vars));
        h += caja('Matriz de coeficientes y matriz ampliada',
          'A = ' + lin().matTex(A) + ' \\qquad (A|B) = ' + lin().matTex(Ab, { aug: 1 }));

        h += '<h5>Paso 1 · calcular los dos rangos</h5>';
        var GA = lin().gauss(A, { aug: 0 });
        var GAb = lin().gauss(Ab, { aug: 1 });
        h += caja('Escalonando A, hay ' + D.rA + ' pivote(s)',
          lin().matTex(GA.fin, { marca: GA.pivotes }));
        h += caja('Escalonando (A|B), hay ' + D.rAb + ' pivote(s)',
          lin().matTex(GAb.fin, { aug: 1, marca: GAb.pivotes }));

        h += '<h5>Paso 2 · aplicar el teorema</h5>';
        var comparacion;
        if (D.rA < D.rAb) comparacion = '\\operatorname{rg}(A) = ' + D.rA + ' < \\operatorname{rg}(A|B) = ' + D.rAb;
        else if (D.rA === D.n) comparacion = '\\operatorname{rg}(A) = \\operatorname{rg}(A|B) = ' + D.rA + ' = n';
        else comparacion = '\\operatorname{rg}(A) = \\operatorname{rg}(A|B) = ' + D.rA + ' < n = ' + D.n;
        h += caja('Comparación', comparacion);
        h += S.tabla(['Situación', 'Tipo de sistema', '¿Es la nuestra?'], [
          {
            celdas: [K('\\operatorname{rg}(A) < \\operatorname{rg}(A|B)'), 'incompatible: no hay solución',
              D.tipo === 'SI' ? S.badge('sí', 'si') : ''],
            clase: D.tipo === 'SI' ? 'sysb-ok' : ''
          },
          {
            celdas: [K('\\operatorname{rg}(A) = \\operatorname{rg}(A|B) = n'), 'compatible determinado: una solución',
              D.tipo === 'SCD' ? S.badge('sí', 'si') : ''],
            clase: D.tipo === 'SCD' ? 'sysb-ok' : ''
          },
          {
            celdas: [K('\\operatorname{rg}(A) = \\operatorname{rg}(A|B) < n'), 'compatible indeterminado: infinitas soluciones',
              D.tipo === 'SCI' ? S.badge('sí', 'si') : ''],
            clase: D.tipo === 'SCI' ? 'sysb-ok' : ''
          }
        ]);
        h += '<div class="sysb-tipo">' + insignia(D.tipo) + '</div>';
        h += bloqueDiscusion(D);
        if (D.tipo === 'SCI') {
          h += '<p class="sysb-txt">Los <b>grados de libertad</b> son ' + K('n - \\operatorname{rg}(A) = ' +
            D.n + ' - ' + D.rA + ' = ' + (D.n - D.rA)) + ': ese es el número de parámetros que hacen falta ' +
            'para describir todas las soluciones.</p>';
        }
        h += bloqueSolucion(D);

        h += '<h5>Paso 3 · comprobación</h5>';
        if (D.tipo === 'SCD') {
          var comp = lin().compruebaSol(A, b, D.sol);
          h += S.tabla(['Ecuación', 'Primer miembro', 'Debe valer', '¿Cuadra?'],
            comp.filas.map(function (f) {
              return [K('E_' + f.ecuacion), K(FT(f.valor)), K(FT(f.esperado)),
                f.ok ? S.badge('sí', 'si') : S.badge('no', 'no')];
            }));
        } else if (D.tipo === 'SCI') {
          var ej = D.param.expr.map(function (e) { return e.cte; });
          var compi = lin().compruebaSol(A, b, ej);
          h += '<p class="sysb-txt">Dando el valor ' + K('0') + ' a todos los parámetros se obtiene una solución ' +
            'concreta, ' + K('\\left(' + ej.map(function (f) { return FT(f); }).join(',\\; ') + '\\right)') +
            ', que sirve para comprobar que la fórmula general es correcta:</p>';
          h += S.tabla(['Ecuación', 'Primer miembro', 'Debe valer', '¿Cuadra?'],
            compi.filas.map(function (f) {
              return [K('E_' + f.ecuacion), K(FT(f.valor)), K(FT(f.esperado)),
                f.ok ? S.badge('sí', 'si') : S.badge('no', 'no')];
            }));
        } else {
          h += '<p class="sysb-txt">No hay nada que comprobar: al escalonar aparece una igualdad imposible, ' +
            'así que ninguna lista de valores puede cumplir todas las ecuaciones a la vez.</p>';
        }
        return h;
      }));
  };

  /* ==================================================================
     9 · Tema 4.10 · discusión con parámetro por Gauss
     ================================================================== */
  R.discuteGauss = function (node) {
    S.shell(node, 'Discusión con parámetro por el método de Gauss',
      'Escribe la matriz ampliada 3×4 con <b>una fila por línea</b> y cuatro elementos separados por espacios. ' +
      'Cada elemento puede ser un número entero (<code>2</code>, <code>-1</code>), un decimal con coma ' +
      '(<code>0,5</code>), una fracción (<code>3/4</code>) o una expresión con el parámetro ' + K('k') +
      ' (<code>k</code>, <code>k-1</code>, <code>2k+3</code>). Por ejemplo: <code>k 1 1 3</code> / ' +
      '<code>1 k 1 3</code> / <code>1 1 k 3</code>. El applet calcula los <b>valores críticos exactos</b> ' +
      'de ' + K('k') + ' (los que anulan un pivote) y discute cada caso.',
      [
        {
          id: 'M', label: 'Matriz ampliada con parámetro k', type: 'textarea', rows: 3,
          value: 'k 1 1 3\n1 k 1 3\n1 1 k 3', ancho: '18rem'
        },
        { id: 'k', label: 'Valor de k', type: 'range', min: -5, max: 5, step: 0.5, value: 2 },
        chips([
          { txt: 'Críticos k = 1 y k = −2', tip: 'el clásico |A| = (k−1)²(k+2)', set: { M: 'k 1 1 3\n1 k 1 3\n1 1 k 3', k: 2 } },
          { txt: 'SCD salvo un valor', tip: 'un único valor crítico', set: { M: '1 1 1 6\n2 -1 1 3\n1 2 k 2', k: 0 } },
          { txt: 'SCI en el valor crítico', tip: 'aparece una fila nula', set: { M: '1 1 1 3\n2 2 2 6\n1 -1 k 1', k: 1 } },
          { txt: 'SI en el valor crítico', tip: 'aparece 0 = k', set: { M: '1 1 1 1\n2 2 2 k\n1 -1 0 0', k: 3 } },
          { txt: 'Parámetro en el término independiente', tip: 'solo cambia B', set: { M: '1 1 1 k\n2 -1 1 3\n1 2 -1 2', k: 6 } },
          { txt: 'Sin valores críticos', tip: 'SCD para todo k', set: { M: '1 0 0 k\n0 1 0 2\n0 0 1 3', k: 1 } }
        ])
      ],
      safe(function (v) {
        var lineas = String(v.M || '').split(/[\n;]+/)
          .map(function (l) { return l.trim(); })
          .filter(function (l) { return l !== ''; });
        if (lineas.length !== 3) {
          throw Error('Escribe exactamente 3 filas, una por línea. Ejemplo:\nk 1 1 3\n1 k 1 3\n1 1 k 3');
        }
        var P = lineas.map(function (l, i) {
          var t = l.split(/\s+/).filter(function (x) { return x !== ''; });
          if (t.length !== 4) {
            throw Error('La fila ' + (i + 1) + ' tiene ' + t.length + ' elementos y debería tener 4 ' +
              '(tres coeficientes y el término independiente). Sepáralos con espacios.');
          }
          return t.map(function (x, j) {
            return polK(x, 'el elemento de la fila ' + (i + 1) + ', columna ' + (j + 1));
          });
        });
        var kVal = FR(String(v.k));
        var vars = ['x', 'y', 'z'];

        var h = caja('Matriz ampliada con parámetro', matPolTex(P, 1));

        /* --- determinante en función de k --- */
        var Pc = P.map(function (f) { return f.slice(0, 3); });
        var Dk = detPol(Pc);
        h += '<h5>Paso 1 · el determinante de A en función de ' + K('k') + '</h5>';
        h += caja('Determinante desarrollado', '|A(k)| = ' + polTex(Dk));
        var cr = criticos(Dk);
        if (cr.siempre) {
          h += '<p class="sysb-txt">El determinante es idénticamente nulo: el rango de ' + K('A') +
            ' es menor que 3 para <b>cualquier</b> valor de ' + K('k') + ', así que el sistema nunca es ' +
            'compatible determinado.</p>';
        } else if (!cr.lista.length && !cr.otros.length) {
          h += '<p class="sysb-txt">El determinante no se anula nunca: el sistema es <b>compatible determinado ' +
            'para todo</b> ' + K('k') + '.</p>';
        } else {
          h += '<p class="sysb-txt">Los <b>valores críticos</b> son las soluciones de ' + K('|A(k)| = 0') + ': ' +
            K(listaKTex(cr.lista) || '\\text{ninguno racional}') +
            (cr.otros.length ? ' (además de ' + K(cr.otros.map(function (n) { return 'k = ' + n.tex; }).join(', ')) + ')' : '') +
            '. Para el resto de valores el determinante no es cero y el sistema es SCD.</p>';
        }

        /* --- tabla de casos --- */
        h += '<h5>Paso 2 · discusión por casos</h5>';
        var filas = [];
        if (!cr.siempre) {
          var etq = cr.lista.length
            ? 'k \\neq ' + cr.lista.map(function (f) { return FT(f); }).join(', \\; k \\neq ')
            : '\\text{cualquier } k';
          filas.push([K(etq), K('|A| \\neq 0'), 'rg(A) = rg(A|B) = 3 = n', insignia('SCD')]);
        }
        cr.lista.forEach(function (k0) {
          var Mk = evalMat(P, k0);
          var pk = parte(Mk);
          var Dk0 = lin().discute(pk.A, pk.b, vars);
          filas.push([
            K('k = ' + FT(k0)),
            K(lin().matTex(Mk, { aug: 1 })),
            'rg(A) = ' + Dk0.rA + ' · rg(A|B) = ' + Dk0.rAb,
            insignia(Dk0.tipo)
          ]);
        });
        if (cr.siempre) {
          var Mg = evalMat(P, kVal), pg = parte(Mg);
          var Dg = lin().discute(pg.A, pg.b, vars);
          filas.push([K('k = ' + FT(kVal)), K(lin().matTex(Mg, { aug: 1 })),
            'rg(A) = ' + Dg.rA + ' · rg(A|B) = ' + Dg.rAb, insignia(Dg.tipo)]);
        }
        h += S.tabla(['Caso', 'Matriz ampliada', 'Rangos', 'Tipo'], filas);
        h += '<p class="sysb-txt">Un valor de ' + K('k') + ' es crítico cuando al escalonar <b>desaparece un ' +
          'pivote</b>: entonces hay que mirar la última columna para saber si la fila queda ' + K('0 = 0') +
          ' (compatible indeterminado) o ' + K('0 = k') + ' con ' + K('k \\neq 0') + ' (incompatible).</p>';

        /* --- Gauss para el valor del deslizador --- */
        h += '<h5>Paso 3 · Gauss para ' + K('k = ' + FT(kVal)) + '</h5>';
        var M2 = evalMat(P, kVal), p2 = parte(M2);
        var D2 = lin().discute(p2.A, p2.b, vars);
        h += caja('Matriz ampliada con ese valor', lin().matTex(M2, { aug: 1 }));
        var G2 = lin().gauss(M2, { aug: 1 });
        h += pasosGauss(G2, 1, 1) || '<p class="sysb-txt">Con ese valor la matriz ya está escalonada.</p>';
        h += caja('Forma escalonada', lin().matTex(G2.fin, { aug: 1, marca: G2.pivotes }));
        var dg2 = diagnosticoFilas(G2.fin);
        if (dg2.incompatibles.length) {
          h += '<p class="ap-warn">La fila ' + dg2.incompatibles[0].fila + ' queda ' +
            K('0 = ' + FT(dg2.incompatibles[0].valor)) + ': imposible. Ese valor de ' + K('k') +
            ' hace el sistema incompatible.</p>';
        }
        if (dg2.nulas.length) {
          h += '<p class="sysb-txt">Con ese valor de ' + K('k') + ' se anula(n) ' + dg2.nulas.length +
            ' fila(s): sobra información y aparecen infinitas soluciones.</p>';
        }
        h += '<div class="sysb-tipo">' + insignia(D2.tipo) + '</div>';
        h += bloqueDiscusion(D2);
        h += bloqueSolucion(D2);
        return h;
      }));
  };

  /* ==================================================================
     10 · Tema 4.11 · del enunciado al sistema
     ================================================================== */
  var BANCO = [
    {
      id: 'cine',
      titulo: 'Entradas de cine',
      texto: 'En una sesión de cine se han vendido 90 entradas y se han recaudado 615 €. La entrada de adulto ' +
        'cuesta 8 € y la de niño 5 €. ¿Cuántas entradas de cada clase se han vendido?',
      pista: 'Llama x al número de entradas de adulto e y al de entradas de niño.',
      vars: ['x', 'y'],
      incognitas: 'x = entradas de adulto, y = entradas de niño',
      ecus: ['x+y=90', '8x+5y=615'],
      unidades: ['entradas de adulto', 'entradas de niño'],
      comentario: 'La primera ecuación cuenta entradas y la segunda cuenta euros. Mezclar unidades en una misma ' +
        'ecuación es el error más frecuente en este tipo de problemas.'
    },
    {
      id: 'numeros',
      titulo: 'Dos números',
      texto: 'La suma de dos números es 45 y su diferencia es 11. ¿Cuáles son esos números?',
      pista: 'Llama x al número mayor e y al menor.',
      vars: ['x', 'y'],
      incognitas: 'x = número mayor, y = número menor',
      ecus: ['x+y=45', 'x-y=11'],
      unidades: ['(número mayor)', '(número menor)'],
      comentario: 'Sumando las dos ecuaciones desaparece la y: es el caso ideal para el método de reducción.'
    },
    {
      id: 'granja',
      titulo: 'Gallinas y conejos',
      texto: 'En un corral hay gallinas y conejos. Se cuentan 30 cabezas y 84 patas. ¿Cuántos animales hay ' +
        'de cada clase?',
      pista: 'Cada animal tiene una cabeza; las gallinas tienen 2 patas y los conejos 4.',
      vars: ['x', 'y'],
      incognitas: 'x = gallinas, y = conejos',
      ecus: ['x+y=30', '2x+4y=84'],
      unidades: ['gallinas', 'conejos'],
      comentario: 'La ecuación de las patas se simplifica dividiendo entre 2: x + 2y = 42. Simplificar antes de ' +
        'resolver ahorra cuentas.'
    },
    {
      id: 'edades',
      titulo: 'Edades de madre e hijo',
      texto: 'Una madre tiene 30 años más que su hijo. Dentro de 10 años la edad de la madre será el triple ' +
        'de la del hijo. ¿Qué edad tiene cada uno ahora?',
      pista: 'Llama x a la edad de la madre e y a la del hijo, hoy.',
      vars: ['x', 'y'],
      incognitas: 'x = edad de la madre hoy, y = edad del hijo hoy',
      ecus: ['x-y=30', 'x+10=3(y+10)'],
      unidades: ['años (madre)', 'años (hijo)'],
      comentario: 'En los problemas de edades conviene escribir siempre a qué momento se refiere cada ecuación: ' +
        'hoy, dentro de 10 años, hace 5 años…'
    },
    {
      id: 'cafe',
      titulo: 'Mezcla de café',
      texto: 'Se quieren preparar 20 kg de mezcla de café que cueste 6,50 €/kg mezclando un café de 5 €/kg con ' +
        'otro de 8 €/kg. ¿Cuántos kilos hay que poner de cada uno?',
      pista: 'Llama x a los kilos del café de 5 €/kg e y a los del café de 8 €/kg.',
      vars: ['x', 'y'],
      incognitas: 'x = kg de café de 5 €/kg, y = kg de café de 8 €/kg',
      ecus: ['x+y=20', '5x+8y=130'],
      unidades: ['kg del café barato', 'kg del café caro'],
      comentario: 'El coste total de la mezcla es 20 · 6,50 = 130 €. Los problemas de mezclas siempre llevan una ' +
        'ecuación de cantidades y otra de valor.'
    },
    {
      id: 'cursos',
      titulo: 'Tres cursos',
      texto: 'En un centro hay 100 alumnos repartidos en tres cursos A, B y C. El curso A tiene 10 alumnos más ' +
        'que el B, y el C tiene la mitad de alumnos que el A. ¿Cuántos alumnos hay en cada curso?',
      pista: 'Llama x, y, z al número de alumnos de A, B y C.',
      vars: ['x', 'y', 'z'],
      incognitas: 'x = alumnos de A, y = alumnos de B, z = alumnos de C',
      ecus: ['x+y+z=100', 'x-y=10', 'x-2z=0'],
      unidades: ['alumnos en A', 'alumnos en B', 'alumnos en C'],
      comentario: '«La mitad de A» se traduce como z = x/2, es decir, x − 2z = 0. Conviene quitar los ' +
        'denominadores en cuanto aparecen.'
    },
    {
      id: 'fondos',
      titulo: 'Tres fondos de inversión',
      texto: 'Una persona invierte 12 000 € en tres fondos que dan el 3 %, el 5 % y el 4 % anual. Al cabo de un ' +
        'año recibe 500 € de intereses y sabe que lo invertido en el tercer fondo es igual a la suma de lo ' +
        'invertido en los otros dos. ¿Cuánto puso en cada fondo?',
      pista: 'Llama x, y, z a las cantidades invertidas en cada fondo, en euros.',
      vars: ['x', 'y', 'z'],
      incognitas: 'x = € al 3 %, y = € al 5 %, z = € al 4 %',
      ecus: ['x+y+z=12000', '3x+5y+4z=50000', 'x+y-z=0'],
      unidades: ['€ al 3 %', '€ al 5 %', '€ al 4 %'],
      comentario: 'La ecuación de los intereses, 0,03x + 0,05y + 0,04z = 500, se ha multiplicado por 100 para ' +
        'trabajar con números enteros: 3x + 5y + 4z = 50 000.'
    },
    {
      id: 'monedas',
      titulo: 'Monedas de 1, 2 y 5 euros',
      texto: 'En una hucha hay 30 monedas de 1 €, 2 € y 5 €, que suman 87 €. Además, el número de monedas de ' +
        '1 € es igual a la suma de las de 2 € y las de 5 €. ¿Cuántas monedas hay de cada valor?',
      pista: 'Llama x, y, z al número de monedas de 1 €, 2 € y 5 €.',
      vars: ['x', 'y', 'z'],
      incognitas: 'x = monedas de 1 €, y = monedas de 2 €, z = monedas de 5 €',
      ecus: ['x+y+z=30', 'x+2y+5z=87', 'x-y-z=0'],
      unidades: ['monedas de 1 €', 'monedas de 2 €', 'monedas de 5 €'],
      comentario: 'Una ecuación cuenta monedas y otra cuenta euros: son magnitudes distintas y no se pueden ' +
        'sumar entre sí.'
    },
    {
      id: 'perimetro',
      titulo: 'Un rectángulo mal descrito (caso SCI)',
      texto: 'El perímetro de un rectángulo es 20 m y la suma de la base y la altura es 10 m. ¿Cuánto miden la ' +
        'base y la altura?',
      pista: 'Llama x a la base e y a la altura.',
      vars: ['x', 'y'],
      incognitas: 'x = base, y = altura',
      ecus: ['2x+2y=20', 'x+y=10'],
      unidades: ['m de base', 'm de altura'],
      esperadoTipo: 'SCI',
      comentario: 'Las dos ecuaciones dicen lo mismo: la segunda es la primera dividida entre 2. El sistema es ' +
        'compatible indeterminado y el problema, tal como está enunciado, no tiene solución única. Hacen falta ' +
        'más datos.'
    },
    {
      id: 'fruta',
      titulo: 'Una factura imposible (caso SI)',
      texto: 'Una frutería vende 3 kg de peras y 2 kg de manzanas por 11 € y, con los mismos precios, 6 kg de ' +
        'peras y 4 kg de manzanas por 20 €. ¿Cuánto cuesta el kilo de cada fruta?',
      pista: 'Llama x al precio del kilo de peras e y al del kilo de manzanas.',
      vars: ['x', 'y'],
      incognitas: 'x = €/kg de peras, y = €/kg de manzanas',
      ecus: ['3x+2y=11', '6x+4y=20'],
      unidades: ['€/kg de peras', '€/kg de manzanas'],
      esperadoTipo: 'SI',
      comentario: 'La segunda compra es exactamente el doble de la primera, así que debería costar 22 € y no 20 €. ' +
        'Los datos se contradicen: el sistema es incompatible y el enunciado está mal.'
    }
  ];

  function problemaPorId(id) {
    for (var i = 0; i < BANCO.length; i++) if (BANCO[i].id === id) return BANCO[i];
    return BANCO[0];
  }
  function sistemaEsperado(P) {
    return lin().parseSistema(P.ecus.join('\n'), P.vars);
  }

  R.problemas = function (node) {
    S.shell(node, 'Del enunciado al sistema',
      'Elige un problema, <b>declara qué representa cada incógnita</b> y escribe las ecuaciones, una en cada ' +
      'casilla. Escribe las ecuaciones completas con el signo igual: <code>x+y=90</code>, ' +
      '<code>8x+5y=615</code>, <code>2x-3y+z=5</code>. Se admiten decimales con coma (<code>0,5x+y=3</code>), ' +
      'fracciones (<code>3/4x-y=2</code>), paréntesis (<code>x+10=3(y+10)</code>) e incógnitas en los dos ' +
      'miembros. Si el problema solo tiene dos incógnitas, deja vacía la tercera casilla. El applet resuelve ' +
      '<b>tu</b> sistema, lo compara con el correcto y después lo resuelve por Gauss.',
      [
        {
          id: 'prob', label: 'Problema', type: 'select', value: 'cine', ancho: '18rem',
          options: BANCO.map(function (p) { return { value: p.id, label: p.titulo }; })
        },
        { id: 'inc', label: 'Mis incógnitas', type: 'text', value: '', place: 'x = entradas de adulto, y = entradas de niño', ancho: '20rem' },
        { id: 'e1', label: 'Ecuación 1', type: 'text', value: '', place: 'x+y=90', ancho: '13rem' },
        { id: 'e2', label: 'Ecuación 2', type: 'text', value: '', place: '8x+5y=615', ancho: '13rem' },
        { id: 'e3', label: 'Ecuación 3 (si hace falta)', type: 'text', value: '', place: 'x-2z=0', ancho: '13rem' },
        {
          id: 'ver', label: 'Ver la solución oficial', type: 'check', value: false
        },
        chips([
          {
            txt: 'SCD · entradas de cine', tip: 'solución única',
            set: { prob: 'cine', inc: 'x = entradas de adulto, y = entradas de niño', e1: 'x+y=90', e2: '8x+5y=615', e3: '' }
          },
          {
            txt: 'SCD · tres incógnitas', tip: 'sistema 3×3',
            set: { prob: 'cursos', inc: 'x = alumnos de A, y = alumnos de B, z = alumnos de C', e1: 'x+y+z=100', e2: 'x-y=10', e3: 'x-2z=0' }
          },
          {
            txt: 'SCI · rectángulo', tip: 'faltan datos',
            set: { prob: 'perimetro', inc: 'x = base, y = altura', e1: '2x+2y=20', e2: 'x+y=10', e3: '' }
          },
          {
            txt: 'SI · factura imposible', tip: 'datos contradictorios',
            set: { prob: 'fruta', inc: 'x = €/kg de peras, y = €/kg de manzanas', e1: '3x+2y=11', e2: '6x+4y=20', e3: '' }
          },
          {
            txt: 'Planteamiento erróneo', tip: 'para ver la corrección',
            set: { prob: 'granja', inc: 'x = gallinas, y = conejos', e1: 'x+y=30', e2: '2x+2y=84', e3: '' }
          },
          {
            txt: 'Empezar de cero', tip: 'borra las casillas',
            set: { prob: 'cine', inc: '', e1: '', e2: '', e3: '' }
          }
        ])
      ],
      safe(function (v) {
        var P = problemaPorId(v.prob);
        var esp = sistemaEsperado(P);
        var Desp = lin().discute(esp.A, esp.b, P.vars);

        var h = '<div class="sysb-enunciado"><b>' + S.esc(P.titulo) + '.</b> ' + S.esc(P.texto) +
          '<br><span class="sysb-pista">' + S.esc(P.pista) + '</span></div>';

        /* --- lo que ha escrito el alumno --- */
        var mias = [v.e1, v.e2, v.e3].map(function (t) { return String(t || '').trim(); })
          .filter(function (t) { return t !== ''; });
        var decl = String(v.inc || '').trim();

        if (decl) {
          h += '<p class="sysb-txt"><b>Tus incógnitas:</b> ' + S.esc(decl) + '</p>';
        } else {
          h += '<p class="ap-warn">Antes de escribir ninguna ecuación, escribe en la casilla ' +
            '«Mis incógnitas» qué representa cada letra, con sus unidades. Por ejemplo: ' +
            '<code>' + S.esc(P.incognitas) + '</code>. Sin esa frase, un sistema no significa nada.</p>';
        }

        if (!mias.length) {
          h += '<p class="sysb-txt">Escribe ahora tus ecuaciones en las casillas de arriba, una en cada casilla. ' +
            'Recuerda: cada ecuación traduce una frase del enunciado, y ambos miembros deben medir lo mismo ' +
            '(euros con euros, kilos con kilos, personas con personas).</p>';
          if (v.ver) h += solucionOficial(P, esp, Desp);
          return h;
        }

        /* --- se lee el sistema del alumno --- */
        var mio;
        try {
          mio = lin().parseSistema(mias.join('\n'), P.vars);
        } catch (e) {
          h += '<div class="mx-bad sysb-err">' + S.esc(e.message) + '</div>';
          h += '<p class="sysb-txt">Escribe cada ecuación completa, con el signo igual y las incógnitas ' +
            P.vars.map(function (q) { return '<code>' + q + '</code>'; }).join(', ') +
            '. Ejemplos válidos: <code>x+y=90</code>, <code>0,5x-y=3</code>, <code>3/4x+2y=1</code>, ' +
            '<code>x+10=3(y+10)</code>.</p>';
          if (v.ver) h += solucionOficial(P, esp, Desp);
          return h;
        }

        h += caja('El sistema que has planteado', lin().sisTex(mio.A, mio.b, P.vars));
        var Dmio = lin().discute(mio.A, mio.b, P.vars);
        h += S.kvs([
          'ecuaciones escritas: <b>' + mio.m + '</b>',
          'incógnitas: <b>' + P.vars.join(', ') + '</b>',
          'tu sistema es: ' + insignia(Dmio.tipo)
        ]);

        /* --- corrección: ¿mismo conjunto de soluciones? --- */
        var equivale = mismasSoluciones(mio, esp, P.vars);
        var mismoTipo = (Dmio.tipo === Desp.tipo);

        if (equivale) {
          h += '<p class="ap-ok"><b>¡Correcto!</b> Tu sistema y el sistema oficial tienen exactamente ' +
            'las mismas soluciones: son <b>sistemas equivalentes</b>. Puede que tus ecuaciones estén ' +
            'escritas de otra forma (multiplicadas por un número, con los términos en otro orden o ' +
            'sumadas entre sí), pero dicen lo mismo.</p>';
        } else if (mismoTipo && Dmio.tipo === 'SCD') {
          h += '<p class="ap-warn"><b>Todavía no.</b> Tu sistema tiene solución única, pero no es la que ' +
            'pide el problema: sale ' + K(solTexto(P.vars, Dmio.sol)) + ' y debería salir ' +
            K(solTexto(P.vars, Desp.sol)) + '. Revisa qué frase del enunciado has traducido mal.</p>';
        } else {
          h += '<p class="ap-warn"><b>Todavía no.</b> Tu sistema es un ' + nombreTipo(Dmio.tipo) +
            ', mientras que el planteamiento correcto da un ' + nombreTipo(Desp.tipo) + '. ' +
            (Dmio.tipo === 'SCI'
              ? 'Que salga indeterminado suele significar que has escrito dos veces la misma información, o que falta una ecuación.'
              : (Dmio.tipo === 'SI'
                ? 'Que salga incompatible suele significar que dos de tus ecuaciones se contradicen: revisa los números del enunciado.'
                : 'Compara tus ecuaciones con las oficiales, una a una.')) + '</p>';
        }

        /* --- comprobación ecuación por ecuación con la solución oficial --- */
        if (Desp.tipo === 'SCD') {
          var filasC = [];
          mio.ecus.forEach(function (ec, i) {
            var val = F0(), j;
            for (j = 0; j < P.vars.length; j++) val = val.mas(ec.coef[j].por(Desp.sol[j]));
            var bien = igF(val, ec.b);
            filasC.push({
              celdas: [
                'Tu ecuación ' + (i + 1),
                K(ec.tex),
                K(FT(val) + (bien ? ' = ' : ' \\neq ') + FT(ec.b)),
                bien ? S.badge('la cumple la solución del problema', 'si')
                  : S.badge('no la cumple: está mal traducida', 'no')
              ],
              clase: bien ? 'ap-ok-row' : ''
            });
          });
          h += '<h5>¿Cumple la solución del problema cada una de tus ecuaciones?</h5>';
          h += S.tabla(['Ecuación', 'Escrita en limpio', 'Sustituyendo', 'Veredicto'], filasC);
        }

        /* --- resolución oficial --- */
        if (v.ver || equivale) {
          h += solucionOficial(P, esp, Desp);
        } else {
          h += '<p class="sysb-txt">Cuando quieras ver el planteamiento oficial y su resolución completa, ' +
            'marca la casilla <b>«Ver la solución oficial»</b>.</p>';
        }
        return h;
      }));
  };

  /* ¿Los dos sistemas tienen exactamente el mismo conjunto de soluciones? */
  function mismasSoluciones(s1, s2, vars) {
    var D1 = lin().discute(s1.A, s1.b, vars);
    var D2 = lin().discute(s2.A, s2.b, vars);
    if (D1.tipo !== D2.tipo) return false;
    if (D1.tipo === 'SI') return true;           /* los dos, sin solución */
    /* Sistemas compatibles: el conjunto de soluciones coincide si las
       filas de una matriz ampliada son combinación de las de la otra,
       es decir, si apilarlas no aumenta el rango. */
    var filas = [], i;
    var Ab1 = lin().matAmpliada(s1.A, s1.b), Ab2 = lin().matAmpliada(s2.A, s2.b);
    for (i = 0; i < Ab1.f; i++) filas.push(Ab1.a[i]);
    for (i = 0; i < Ab2.f; i++) filas.push(Ab2.a[i]);
    var pila = lin().Mat(filas);
    var pA = [], pB = [];
    for (i = 0; i < pila.f; i++) {
      pA.push(pila.a[i].slice(0, pila.c - 1));
      pB.push(pila.a[i][pila.c - 1]);
    }
    var rPilaAb = lin().rango(pila);
    var rPilaA = lin().rango(lin().Mat(pA));
    return rPilaAb === D1.rAb && rPilaAb === D2.rAb &&
      rPilaA === D1.rA && rPilaA === D2.rA;
  }

  /* Planteamiento oficial + resolución por Gauss + comentario. */
  function solucionOficial(P, esp, D) {
    var h = '<h5>Planteamiento oficial</h5>';
    h += '<p class="sysb-txt"><b>Incógnitas:</b> ' + S.esc(P.incognitas) + '.</p>';
    h += caja('Sistema del problema', lin().sisTex(esp.A, esp.b, P.vars));
    h += S.tabla(['Nº', 'Ecuación oficial escrita en limpio'],
      P.ecus.map(function (t, i) {
        return ['Ecuación ' + (i + 1), K(esp.ecus[i].tex)];
      }));

    var Rr = lin().resuelve(esp.A, esp.b, P.vars);
    h += '<h5>Resolución por el método de Gauss</h5>';
    h += caja('Matriz ampliada', lin().matTex(Rr.Ab, { aug: 1 }));
    h += pasosGauss(Rr.gaussEscalonado, 1, 1);
    h += caja('Forma escalonada', lin().matTex(Rr.escalonada, { aug: 1, marca: Rr.gaussEscalonado.pivotes }));
    h += bloqueDiscusion(D);
    h += bloqueSolucion(D);

    if (D.tipo === 'SCD') {
      h += '<h5>Respuesta con sus unidades</h5>';
      h += S.tabla(['Incógnita', 'Valor', 'Significado'],
        P.vars.map(function (q, i) {
          return [K(q), K(FT(D.sol[i])), S.esc(P.unidades[i])];
        }));
      var C = lin().compruebaSol(esp.A, esp.b, D.sol);
      h += '<p class="' + (C.ok ? 'ap-ok' : 'ap-warn') + '">' +
        (C.ok ? 'Comprobado: la solución cumple todas las ecuaciones del enunciado.'
          : 'Atención: la solución no cumple alguna ecuación; revisa los datos.') + '</p>';
    }

    if (P.vars.length === 2) {
      h += figura2x2(esp.A, esp.b, {
        punto: D.tipo === 'SCD' ? [D.sol[0], D.sol[1]] : null,
        titulo: 'El problema visto como dos rectas',
        cap: 'Cada condición del enunciado es una recta. La solución del problema es el punto donde se cortan.'
      });
    }
    h += '<p class="sysb-coment"><b>Comentario.</b> ' + S.esc(P.comentario) + '</p>';
    return h;
  }

  /* ==================================================================
     11 · cierre del módulo
     ================================================================== */
  S.extraB = true;
  if (S.monta) S.monta();
})();
