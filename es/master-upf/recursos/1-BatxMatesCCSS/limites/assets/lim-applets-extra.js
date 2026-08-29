/* =====================================================================
   lim-applets-extra.js — LÍMITES · MÓDULO DE AMPLIACIÓN
   1r Batx Mates CCSS

   Se carga DESPUÉS de lim-applets.js y usa su API pública window.LIM.
   Sus applets se marcan en el .qmd con  data-applet-limx="clave"

   CLAVES DISPONIBLES
     definicion · epsilondelta
     liminf · limpunto · laterales · trozos
     asvertical · ashorizontal · asoblicua · ramas
     continuidad · discontinuidad · trozoscont · bolzano
     resumen
   ===================================================================== */

(function () {
  'use strict';

  var P = window.LIM;
  if (!P) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-applet-limx]'), function (n) {
      n.className = 'applet';
      n.innerHTML = '<div class="ap-err">Aviso: falta lim-applets.js. C\u00e1rgalo antes de este m\u00f3dulo.</div>';
    });
    return;
  }

  var LX = {};
  var T = P.T, TD = P.TD, INF = P.INF, LIMT = P.LIMT,
      step = P.step, warnStep = P.warnStep, key = P.key,
      ok = P.ok, bad = P.bad, note = P.note, chip = P.chip, tbl = P.tbl,
      nt = P.nt, num = P.num, fracTex = P.fracTex,
      polParse = P.polParse, polDeg = P.polDeg, polLead = P.polLead, polEval = P.polEval,
      polTex = P.polTex, polDiv = P.polDiv, polRoots = P.polRoots,
      parse = P.parse, texify = P.texify, limitAt = P.limitAt, limitInf = P.limitInf,
      plotSVG = P.plotSVG,
      rowText = P.rowText, mini = P.mini, sel = P.sel, val = P.val, nv = P.nv, iv = P.iv,
      live = P.live, shell = P.shell;

  /* =================================================================
     1. CONCEPTO DE LÍMITE
     ================================================================= */

  LX.definicion = function (root) {
    var out = shell(root, 'Applet \u00b7 Idea intuitiva de l\u00edmite', [
      'Un l\u00edmite es aquel lugar al que, si no llegamos, seremos capaces de acercarnos todo lo que queramos.',
      'El applet construye las dos tablas del libro: acerc\u00e1ndose al punto por la <b>derecha</b> y por la <b>izquierda</b>.',
      'Escribe la funci\u00f3n con <code>x</code>. Ejemplos: <code>x^2-3</code> en $x=2$; <code>(x^2-1)/(x-1)</code> en $x=1$; <code>sin(x)/x</code> en $x=0$.',
      'Fundamental: el l\u00edmite habla de los <b>alrededores</b> del punto. La funci\u00f3n puede no existir ah\u00ed y tener l\u00edmite perfectamente.'
    ],
      rowText('f', 'f(x)', '(x^2-1)/(x-1)') +
      '<div class="ap-row">' + mini('a', 'punto a', 1, 0.5) + '</div>');

    live(root, out, function () {
      var src = val(root, 'f'), a = nv(root, 'a'), f = parse(src);
      var hs = [1, 0.5, 0.1, 0.01, 0.001, 0.0001];
      var h = step(key('Funci\u00f3n: ') + T('f(x)=' + texify(src)) + ' \u00b7 punto ' + T('x=' + nt(a)));
      h += step(key('Acerc\u00e1ndonos por la derecha, con valores mayores que ') + T(nt(a)) + ':');
      h += tbl(['x', 'f(x)'], hs.map(function (d) {
        return { cells: [num(a + d, 6), T(nt(f(a + d), 8))], mark: d === 0.0001 };
      }));
      h += step(key('Acerc\u00e1ndonos por la izquierda, con valores menores que ') + T(nt(a)) + ':');
      h += tbl(['x', 'f(x)'], hs.map(function (d) {
        return { cells: [num(a - d, 6), T(nt(f(a - d), 8))], mark: d === 0.0001 };
      }));
      var Ld = limitAt(f, a, '+'), Li = limitAt(f, a, '-');
      var fa = f(a);
      h += step(key('L\u00edmite por la derecha: ') + chip(num(Ld.v, 6)) + ' \u00b7 ' +
        key('por la izquierda: ') + chip(num(Li.v, 6)));
      var coincide = Ld.kind === 'fin' && Li.kind === 'fin' && Math.abs(Ld.v - Li.v) < 1e-4;
      h += step(coincide
        ? ok('Los dos coinciden') + ', luego existe el l\u00edmite y vale ' + chip(num((Ld.v + Li.v) / 2, 6)) +
          ': ' + T(LIMT('x', nt(a), 'f(x)') + '=' + nt((Ld.v + Li.v) / 2, 6))
        : bad('Los dos no coinciden') + ', luego ' + key('no existe') + ' el l\u00edmite en ese punto.');
      h += step(key('Valor de la funci\u00f3n en el punto: ') +
        (isFinite(fa) ? T('f(' + nt(a) + ')=' + nt(fa, 6)) : bad('la funci\u00f3n no est\u00e1 definida en ' + num(a))) +
        '. ' + note('El l\u00edmite y el valor son cosas distintas: comp\u00e1ralos.'));
      var span = Math.max(2, Math.abs(a) + 2);
      h += plotSVG({
        x0: a - span / 2, x1: a + span / 2,
        y0: (coincide ? Ld.v : 0) - span, y1: (coincide ? Ld.v : 0) + span,
        curves: [{ f: f }],
        points: coincide ? [{ x: a, y: Ld.v, open: !isFinite(fa), lbl: isFinite(fa) ? 'f(' + num(a) + ')' : 'hueco' }] : []
      });
      return h;
    });
  };

  LX.epsilondelta = function (root) {
    var out = shell(root, 'Applet \u00b7 La definici\u00f3n rigurosa', [
      'La definici\u00f3n formal dice: $\\lim_{x \\to a}f(x)=L$ si para todo $\\varepsilon>0$ existe un $\\delta>0$ tal que, si $0<\\left|x-a\\right|<\\delta$, entonces $\\left|f(x)-L\\right|<\\varepsilon$.',
      'En lenguaje llano: por estrecha que sea la banda horizontal de altura $\\varepsilon$ alrededor de $L$, siempre puedo encontrar una banda vertical de anchura $\\delta$ alrededor de $a$ donde la funci\u00f3n no se escapa.',
      'Mueve $\\varepsilon$ y observa cu\u00e1nto hay que estrechar $\\delta$. El applet calcula el mayor $\\delta$ que sirve.',
      'Ejemplo del libro: para $\\lim_{x \\to 1}(2x+3)=5$ basta tomar $\\delta<\\dfrac{\\varepsilon}{2}$.'
    ],
      rowText('f', 'f(x)', '2*x+3') +
      '<div class="ap-row">' + mini('a', 'punto a', 1, 0.5) + mini('eps', 'epsilon', 0.4, 0.05) + '</div>');

    live(root, out, function () {
      var src = val(root, 'f'), a = nv(root, 'a'), eps = nv(root, 'eps'), f = parse(src);
      if (!(eps > 0)) throw new Error('epsilon debe ser un n\u00famero positivo.');
      var L = limitAt(f, a, '+').v;
      if (!isFinite(L)) throw new Error('en ese punto el l\u00edmite no es finito, y la definici\u00f3n que estamos usando exige que lo sea.');
      /* mayor delta por barrido */
      var d = 0, dmax = 3, sT = dmax / 2000, x, bad2 = false;
      for (d = sT; d <= dmax; d += sT) {
        bad2 = false;
        for (var j = 1; j <= 40; j++) {
          x = a - d + 2 * d * j / 41;
          if (Math.abs(x - a) < 1e-12) continue;
          var v = f(x);
          if (!isFinite(v) || Math.abs(v - L) >= eps) { bad2 = true; break; }
        }
        if (bad2) break;
      }
      var delta = Math.max(sT, d - sT);
      var h = step(key('L\u00edmite: ') + TD(LIMT('x', nt(a), texify(src)) + '=' + nt(L, 6)));
      h += step(key('Banda horizontal: ') + T('\\left|f(x)-' + nt(L, 4) + '\\right|<' + nt(eps) +
        '\\ \\Longleftrightarrow\\ f(x)\\in\\left(' + nt(L - eps, 4) + ',\\ ' + nt(L + eps, 4) + '\\right)'));
      h += step(key('Mayor banda vertical que sirve: ') + chip('\u03B4 \u2248 ' + num(delta, 4)) + ', es decir ' +
        T('x\\in\\left(' + nt(a - delta, 4) + ',\\ ' + nt(a + delta, 4) + '\\right)') + ' quitando el propio punto.');
      h += step(key('Interpretaci\u00f3n: ') + 'como esto se puede hacer para ' + key('cualquier') + ' epsilon, por peque\u00f1o que sea, queda demostrado que el l\u00edmite es ' + T(nt(L, 6)) + '.');
      h += step('Prueba a dividir epsilon entre diez y observa qu\u00e9 le ocurre a delta. ' +
        note('Esa dependencia es el coraz\u00f3n de la definici\u00f3n.'));
      var span = Math.max(delta * 3, 1);
      h += plotSVG({
        x0: a - span, x1: a + span, y0: L - eps * 4, y1: L + eps * 4,
        hasym: [L - eps, L + eps], vasym: [],
        curves: [{ f: f }],
        points: [{ x: a, y: L, lbl: 'L = ' + num(L, 4) }]
      });
      h += step(note('Las dos rectas verdes marcan la banda de altura epsilon. La funci\u00f3n no se sale de ella en el tramo calculado.'));
      return h;
    });
  };

  /* =================================================================
     2. LÍMITE EN EL INFINITO Y EN UN PUNTO
     ================================================================= */

  LX.liminf = function (root) {
    var out = shell(root, 'Applet \u00b7 L\u00edmite de una funci\u00f3n en el infinito', [
      'Si consideramos la expresi\u00f3n de $f(x)$ como el t\u00e9rmino general de una sucesi\u00f3n, el l\u00edmite de la funci\u00f3n cuando $x$ tiende a infinito coincide con el l\u00edmite de la sucesi\u00f3n.',
      'Por eso todo lo aprendido con sucesiones se reutiliza aqu\u00ed, con una novedad: ahora tambi\u00e9n podemos ir hacia $-\\infty$.',
      'Ejemplos del libro: <code>2/x</code> tiende a $0$ por los dos lados; <code>(4*x^3+2*x)/(x^3-7)</code> tiende a $4$ por los dos lados.',
      'Prueba tambi\u00e9n <code>x^3</code>, donde los dos l\u00edmites son distintos, y <code>exp(x)</code>, muy asim\u00e9trica.'
    ], rowText('f', 'f(x)', '(4*x^3+2*x)/(x^3-7)'));

    live(root, out, function () {
      var src = val(root, 'f'), f = parse(src);
      var Lp = limitInf(f, 1), Lm = limitInf(f, -1);
      var h = step(key('Funci\u00f3n: ') + T('f(x)=' + texify(src)));
      h += tbl(['x', 'f(x)'], [-100000, -1000, -10, 10, 1000, 100000].map(function (x) {
        return { cells: [num(x), T(nt(f(x), 8))], mark: Math.abs(x) === 100000 };
      }));
      h += step(key('Hacia m\u00e1s infinito: ') + T(LIMT('x', '+' + INF, 'f(x)') + '=' + nt(Lp.v, 6)) +
        ' ' + chip(num(Lp.v, 6)));
      h += step(key('Hacia menos infinito: ') + T(LIMT('x', '-' + INF, 'f(x)') + '=' + nt(Lm.v, 6)) +
        ' ' + chip(num(Lm.v, 6)));
      h += step(Lp.kind === 'fin' && Lm.kind === 'fin' && Math.abs(Lp.v - Lm.v) < 1e-4
        ? ok('Los dos l\u00edmites coinciden') + ', luego hay una sola as\u00edntota horizontal, ' +
          T('y=' + nt(Lp.v, 6)) + '.'
        : note('Los dos l\u00edmites son distintos o no son finitos: estudia con cuidado cada lado por separado.'));
      h += step(key('Truco pr\u00e1ctico: ') + 'con cocientes de polinomios no hace falta sustituir. Basta comparar los grados, exactamente como con las sucesiones.');
      var lo = isFinite(Lp.v) && isFinite(Lm.v) ? Math.min(Lp.v, Lm.v) - 5 : -8;
      var hi = isFinite(Lp.v) && isFinite(Lm.v) ? Math.max(Lp.v, Lm.v) + 5 : 8;
      h += plotSVG({
        x0: -12, x1: 12, y0: lo, y1: hi,
        hasym: [isFinite(Lp.v) ? Lp.v : null, isFinite(Lm.v) ? Lm.v : null].filter(function (v) { return v !== null; }),
        curves: [{ f: f }]
      });
      return h;
    });
  };

  LX.limpunto = function (root) {
    var out = shell(root, 'Applet \u00b7 L\u00edmite de una funci\u00f3n en un punto', [
      'El procedimiento del libro tiene dos pasos. Primero se <b>sustituye</b> el punto en la funci\u00f3n. Si sale un n\u00famero, ese es el l\u00edmite.',
      'Si sale infinito, hay que calcular los <b>l\u00edmites laterales</b> para saber el signo de cada lado. Y si sale cero partido cero, hay que factorizar.',
      'Ejemplo del libro: $f(x)=\\dfrac{x+2}{x-2}$ da $-\\tfrac{1}{3}$ en $x=-1$, pero en $x=2$ hay que estudiar los laterales.',
      'Prueba <code>(x+2)/(x-2)</code> en $x=-1$ y en $x=2$, y <code>(3*x-1)/(x^2-2*x+3)</code> en $x=1$.'
    ],
      rowText('f', 'f(x)', '(x+2)/(x-2)') +
      '<div class="ap-row">' + mini('a', 'punto a', 2, 0.5) + '</div>');

    live(root, out, function () {
      var src = val(root, 'f'), a = nv(root, 'a'), f = parse(src);
      var fa = f(a);
      var h = step(key('L\u00edmite: ') + TD(LIMT('x', nt(a), texify(src))));
      h += step(key('Paso 1. ') + 'Sustituimos ' + T('x=' + nt(a)) + ': ' +
        (isFinite(fa) ? T('f(' + nt(a) + ')=' + nt(fa, 6)) : bad('sale una expresi\u00f3n sin sentido, del tipo cero partido cero o algo partido cero')));
      var Ld = limitAt(f, a, '+'), Li = limitAt(f, a, '-');
      if (isFinite(fa)) {
        h += step(ok('El l\u00edmite es directamente ') + chip(num(fa, 6)) + ' ' +
          note('porque la funci\u00f3n es continua en ese punto'));
      } else {
        h += step(key('Paso 2. ') + 'Calculamos los l\u00edmites laterales, dando valores muy pr\u00f3ximos al punto.');
        h += tbl(['x', 'f(x)'], [a - 0.1, a - 0.01, a - 0.001, a + 0.001, a + 0.01, a + 0.1].map(function (x) {
          return { cells: [num(x, 5), T(nt(f(x), 8))], mark: Math.abs(x - a) < 0.002 };
        }));
        h += step(key('Por la izquierda: ') + chip(num(Li.v, 6)) + ' \u00b7 ' +
          key('por la derecha: ') + chip(num(Ld.v, 6)));
        var iguales = Li.kind === Ld.kind &&
          ((Li.kind === 'fin' && Math.abs(Li.v - Ld.v) < 1e-4) ||
           (Li.kind === 'inf' && (Li.v > 0) === (Ld.v > 0)));
        h += step(iguales
          ? ok('Los laterales coinciden') + ', luego ' + T(LIMT('x', nt(a), 'f(x)') + '=' + nt(Ld.v, 6))
          : bad('Los laterales son distintos') + ', luego ' + key('no existe') + ' el l\u00edmite en ' + T('x=' + nt(a)) +
            '. ' + note('Aun as\u00ed sabemos perfectamente qu\u00e9 hace la funci\u00f3n a cada lado.'));
        h += step(key('C\u00f3mo decidir el signo a mano: ') + 'se sustituye un valor muy pr\u00f3ximo al punto y se mira el signo del numerador y del denominador. Con ' +
          T('x=' + nt(a - 0.01, 4)) + ' se obtiene ' + T(nt(f(a - 0.01), 4)) + ', luego por la izquierda la funci\u00f3n va hacia ' +
          (f(a - 0.01) < 0 ? T('-' + INF) : T('+' + INF)) + '.');
      }
      h += plotSVG({
        x0: a - 5, x1: a + 5, y0: -10, y1: 10,
        vasym: isFinite(fa) ? [] : [a],
        curves: [{ f: f }],
        points: isFinite(fa) ? [{ x: a, y: fa, lbl: 'f(' + num(a) + ') = ' + num(fa, 3) }] : []
      });
      return h;
    });
  };

  LX.laterales = function (root) {
    var out = shell(root, 'Applet \u00b7 L\u00edmites laterales', [
      'Para que exista el l\u00edmite en un punto es <b>necesario y suficiente</b> que existan los dos laterales y que coincidan.',
      'Se escriben $\\lim_{x \\to a^{-}}f(x)$ para la izquierda y $\\lim_{x \\to a^{+}}f(x)$ para la derecha.',
      'Ejemplo del libro: en $f(x)=\\dfrac{3}{x+1}$ los laterales en $x=-1$ son $-\\infty$ y $+\\infty$.',
      'Prueba <code>3/(x+1)</code> en $x=-1$; <code>abs(x)/x</code> en $x=0$; <code>1/x^2</code> en $x=0$, donde s\u00ed coinciden.'
    ],
      rowText('f', 'f(x)', 'abs(x)/x') +
      '<div class="ap-row">' + mini('a', 'punto a', 0, 0.5) + '</div>');

    live(root, out, function () {
      var src = val(root, 'f'), a = nv(root, 'a'), f = parse(src);
      var Li = limitAt(f, a, '-'), Ld = limitAt(f, a, '+');
      var h = step(key('Funci\u00f3n: ') + T('f(x)=' + texify(src)) + ' \u00b7 punto ' + T('x=' + nt(a)));
      h += tbl(['x por la izquierda', 'f(x)', 'x por la derecha', 'f(x)'],
        [0.1, 0.01, 0.001, 0.0001].map(function (d) {
          return {
            cells: [num(a - d, 6), T(nt(f(a - d), 6)), num(a + d, 6), T(nt(f(a + d), 6))],
            mark: d === 0.0001
          };
        }));
      h += step(T(LIMT('x', nt(a) + '^{-}', 'f(x)') + '=' + nt(Li.v, 6)) + ' ' + chip(num(Li.v, 6)));
      h += step(T(LIMT('x', nt(a) + '^{+}', 'f(x)') + '=' + nt(Ld.v, 6)) + ' ' + chip(num(Ld.v, 6)));
      var iguales = Li.kind === Ld.kind &&
        ((Li.kind === 'fin' && Math.abs(Li.v - Ld.v) < 1e-4) ||
         (Li.kind === 'inf' && (Li.v > 0) === (Ld.v > 0)));
      h += step(iguales
        ? ok('Existe el l\u00edmite') + ' y vale ' + T(nt(Ld.v, 6)) + '.'
        : bad('No existe el l\u00edmite') + ' en ese punto, porque los laterales no coinciden.');
      if (Li.kind === 'fin' && Ld.kind === 'fin' && !iguales) {
        h += step(key('Salto: ') + 'la diferencia entre los dos laterales es ' + chip(num(Math.abs(Ld.v - Li.v), 6)) +
          '. ' + note('Es una discontinuidad de salto finito, que veremos en el apartado de continuidad.'));
      }
      h += plotSVG({
        x0: a - 4, x1: a + 4, y0: -6, y1: 6,
        vasym: Li.kind === 'inf' || Ld.kind === 'inf' ? [a] : [],
        curves: [{ f: f }],
        points: Li.kind === 'fin' && Ld.kind === 'fin' && !iguales
          ? [{ x: a, y: Li.v, open: true, color: '#2a76dd', lbl: 'izquierda' },
             { x: a, y: Ld.v, open: true, color: '#e63946', lbl: 'derecha' }]
          : []
      });
      return h;
    });
  };

  LX.trozos = function (root) {
    var out = shell(root, 'Applet \u00b7 Funciones definidas a trozos', [
      'En una funci\u00f3n a trozos hay que preguntarse siempre lo mismo: \u00bfen este punto <b>cambia</b> la expresi\u00f3n algebraica?',
      'Si cambia, se calculan los dos laterales usando cada rama. Si no cambia, basta sustituir.',
      'Escribe las dos ramas y el punto de corte. Ejemplo del libro: <code>x^3-2*x+3</code> si $x<1$ y <code>3*x-2</code> si $x\\geq1$, donde los laterales son $2$ y $1$.',
      'Prueba tambi\u00e9n <code>x^3</code> con <code>3*x-2</code> en $x=1$, donde s\u00ed coinciden aunque la funci\u00f3n no est\u00e9 definida ah\u00ed.'
    ],
      rowText('f1', 'rama izquierda, para x < c', 'x^3-2*x+3') +
      rowText('f2', 'rama derecha, para x \u2265 c', '3*x-2') +
      '<div class="ap-row">' + mini('c', 'punto de corte c', 1, 0.5) +
      mini('q', 'otro punto a consultar', 0, 0.5) + '</div>');

    live(root, out, function () {
      var f1 = parse(val(root, 'f1')), f2 = parse(val(root, 'f2'));
      var c = nv(root, 'c'), q = nv(root, 'q');
      var F = function (x) { return x < c ? f1(x) : f2(x); };
      var Li = f1(c - 1e-7), Ld = f2(c + 1e-7);
      var h = step(key('Funci\u00f3n: ') + TD('f(x)=\\begin{cases}' + texify(val(root, 'f1')) + ' & \\text{si } x<' + nt(c) +
        '\\\\ ' + texify(val(root, 'f2')) + ' & \\text{si } x\\geq ' + nt(c) + '\\end{cases}'));
      h += step(key('En el punto de corte ') + T('x=' + nt(c)) + ' la expresi\u00f3n ' + key('s\u00ed cambia') +
        ', luego hay que calcular los dos laterales con la rama que corresponde a cada lado.');
      h += step(T(LIMT('x', nt(c) + '^{-}', 'f(x)') + '=' + nt(Li, 6)) + ' ' + note('usando la rama izquierda') +
        ' \u00b7 ' + T(LIMT('x', nt(c) + '^{+}', 'f(x)') + '=' + nt(Ld, 6)) + ' ' + note('usando la rama derecha'));
      var ig = Math.abs(Li - Ld) < 1e-5;
      h += step(ig
        ? ok('Coinciden') + ', luego existe el l\u00edmite y vale ' + chip(num(Ld, 6)) + '.'
        : bad('No coinciden') + ', luego no existe el l\u00edmite en ' + T('x=' + nt(c)) +
          '. El salto mide ' + chip(num(Math.abs(Ld - Li), 6)) + '.');
      h += step(key('Valor de la funci\u00f3n en el corte: ') + T('f(' + nt(c) + ')=' + nt(f2(c), 6)) +
        ' ' + note('se toma la rama que incluye el igual'));
      h += step(ig && Math.abs(f2(c) - Ld) < 1e-6
        ? ok('La funci\u00f3n es continua en ') + T('x=' + nt(c))
        : bad('La funci\u00f3n no es continua en ') + T('x=' + nt(c)));
      if (Math.abs(q - c) > 1e-9) {
        h += step(key('En el otro punto ') + T('x=' + nt(q)) + ' la expresi\u00f3n ' + key('no cambia') +
          ', luego basta sustituir: ' + T('f(' + nt(q) + ')=' + nt(F(q), 6)) + '.');
      }
      h += tbl(['x', 'f(x)'], [c - 0.1, c - 0.01, c - 0.001, c + 0.001, c + 0.01, c + 0.1].map(function (x) {
        return { cells: [num(x, 5), T(nt(F(x), 6))], mark: Math.abs(x - c) < 0.002 };
      }));
      var lo = Math.min(Li, Ld) - 4, hi = Math.max(Li, Ld) + 4;
      h += plotSVG({
        x0: c - 4, x1: c + 4, y0: lo, y1: hi,
        curves: [
          { f: function (x) { return x < c ? f1(x) : NaN; }, color: '#2a76dd' },
          { f: function (x) { return x >= c ? f2(x) : NaN; }, color: '#e63946' }
        ],
        points: [{ x: c, y: Li, open: true, color: '#2a76dd' }, { x: c, y: Ld, color: '#e63946' }]
      });
      h += step(note('Azul la rama izquierda, roja la derecha. Punto hueco significa que ese valor no se alcanza; punto relleno, que s\u00ed.'));
      return h;
    });
  };

  /* =================================================================
     3. ASÍNTOTAS
     ================================================================= */

  function racional(root) {
    var P1 = polParse(val(root, 'P')), Q1 = polParse(val(root, 'Q'));
    if (Math.abs(polLead(Q1)) < 1e-12) throw new Error('el denominador no puede ser nulo.');
    var f = function (x) { return polEval(P1, x) / polEval(Q1, x); };
    return { P: P1, Q: Q1, f: f };
  }

  LX.asvertical = function (root) {
    var out = shell(root, 'Applet \u00b7 As\u00edntotas verticales', [
      'Una funci\u00f3n tiene una as\u00edntota vertical en $x=c$ si $\\lim_{x \\to c}f(x)=\\pm\\infty$.',
      'En una funci\u00f3n racional se buscan las <b>ra\u00edces del denominador</b> que no anulen tambi\u00e9n el numerador.',
      'Escribe los coeficientes en orden descendente. Ejemplo del libro: $\\dfrac{1-x}{x-2}$ tiene as\u00edntota vertical en $x=2$.',
      'Prueba <code>1,-9</code> entre <code>1,0,-1</code>, que tiene dos as\u00edntotas verticales, y observa los signos a cada lado.'
    ],
      rowText('P', 'numerador', '-1,1') + rowText('Q', 'denominador', '1,-2'));

    live(root, out, function () {
      var R = racional(root), f = R.f;
      var roots = polRoots(R.Q);
      var h = step(key('Funci\u00f3n: ') + TD('f(x)=\\dfrac{' + polTex(R.P) + '}{' + polTex(R.Q) + '}'));
      h += step(key('Paso 1. ') + 'Buscamos las ra\u00edces del denominador: ' +
        (roots.length ? roots.map(function (r) { return chip(num(r, 4)); }).join('') : bad('no tiene ra\u00edces reales')));
      if (!roots.length) {
        h += step(ok('No hay as\u00edntotas verticales') + ', porque el denominador nunca se anula.');
        h += plotSVG({ x0: -8, x1: 8, y0: -8, y1: 8, curves: [{ f: f }] });
        return h;
      }
      var vas = [];
      roots.forEach(function (c) {
        var pn = polEval(R.P, c);
        if (Math.abs(pn) < 1e-7) {
          h += step(T('x=' + nt(c, 4)) + ': el numerador ' + key('tambi\u00e9n') + ' se anula, luego hay que simplificar. ' +
            note('Puede no haber as\u00edntota, sino un hueco: es una discontinuidad evitable.'));
        } else {
          vas.push(c);
          var li = f(c - 1e-4), ld = f(c + 1e-4);
          h += step(T('x=' + nt(c, 4)) + ': as\u00edntota vertical. ' +
            T(LIMT('x', nt(c, 4) + '^{-}', 'f(x)') + '=' + (li < 0 ? '-' : '+') + INF) + ' y ' +
            T(LIMT('x', nt(c, 4) + '^{+}', 'f(x)') + '=' + (ld < 0 ? '-' : '+') + INF));
        }
      });
      h += step(key('C\u00f3mo se decide el signo: ') + 'se sustituye un valor muy cercano a la ra\u00edz y se mira el signo del cociente. No hace falta calcular nada m\u00e1s.');
      h += step(note('Una funci\u00f3n puede tener muchas as\u00edntotas verticales, tantas como ra\u00edces tenga el denominador. En cambio, como veremos, solo puede tener dos horizontales.'));
      var lo = Math.min.apply(null, vas.concat([0])) - 5, hi = Math.max.apply(null, vas.concat([0])) + 5;
      h += plotSVG({ x0: lo, x1: hi, y0: -10, y1: 10, vasym: vas, curves: [{ f: f }] });
      return h;
    });
  };

  LX.ashorizontal = function (root) {
    var out = shell(root, 'Applet \u00b7 As\u00edntotas horizontales', [
      'Una funci\u00f3n tiene una as\u00edntota horizontal en $y=k$ si $\\lim_{x \\to \\infty}f(x)=k$, con $k$ finito.',
      'Para saber si la curva queda <b>por encima o por debajo</b> se estudia el signo de $f(x)-k$ con valores muy grandes, positivos y negativos.',
      'Ejemplo del libro: $\\dfrac{2x^{2}+1}{x^{2}-3x}$ tiene as\u00edntota en $y=2$, por encima cuando $x \\to +\\infty$ y por debajo cuando $x \\to -\\infty$.',
      'Escribe <code>2,0,1</code> entre <code>1,-3,0</code> para reproducirlo.'
    ],
      rowText('P', 'numerador', '2,0,1') + rowText('Q', 'denominador', '1,-3,0'));

    live(root, out, function () {
      var R = racional(root), f = R.f;
      var m = polDeg(R.P), k = polDeg(R.Q);
      var h = step(key('Funci\u00f3n: ') + TD('f(x)=\\dfrac{' + polTex(R.P) + '}{' + polTex(R.Q) + '}'));
      h += step('Grados: numerador ' + key(String(m)) + ' y denominador ' + key(String(k)) + '.');
      if (m > k) {
        h += step(bad('No hay as\u00edntota horizontal') + ', porque el l\u00edmite en el infinito es infinito. ' +
          note(m === k + 1 ? 'Habr\u00e1 que buscar una as\u00edntota oblicua.' : 'Hay una rama parab\u00f3lica.'));
        h += plotSVG({ x0: -10, x1: 10, y0: -20, y1: 20, vasym: polRoots(R.Q), curves: [{ f: f }] });
        return h;
      }
      var kk = m === k ? polLead(R.P) / polLead(R.Q) : 0;
      h += step(key('As\u00edntota horizontal: ') + chip(T('y=' + nt(kk, 6))) + ' ' +
        note(m === k ? 'cociente de los coeficientes principales' : 'porque el denominador tiene mayor grado'));
      var d1 = f(1000) - kk, d2 = f(-1000) - kk;
      h += tbl(['x', 'f(x)', 'f(x) \u2212 k', 'posici\u00f3n'], [1000, -1000].map(function (x) {
        var d = f(x) - kk;
        return {
          cells: [num(x), T(nt(f(x), 8)), T(nt(d, 8)), d > 0 ? 'por encima' : 'por debajo'],
          mark: true
        };
      }));
      h += step(key('Posici\u00f3n de las ramas: ') + 'hacia ' + T('+' + INF) + ' la curva queda ' +
        (d1 > 0 ? ok('por encima') : ok('por debajo')) + ' y hacia ' + T('-' + INF) + ' queda ' +
        (d2 > 0 ? ok('por encima') : ok('por debajo')) + ' de la as\u00edntota.');
      h += step(key('Pregunta del libro: ') + '\u00bfpuede una funci\u00f3n tener dos as\u00edntotas horizontales distintas? ' +
        ok('S\u00ed') + ', una hacia cada infinito. \u00bfY tres? ' + bad('No') +
        ', porque solo hay dos infinitos a los que tender.');
      h += plotSVG({
        x0: -12, x1: 12, y0: kk - 8, y1: kk + 8,
        hasym: [kk], vasym: polRoots(R.Q), curves: [{ f: f }]
      });
      return h;
    });
  };

  LX.asoblicua = function (root) {
    var out = shell(root, 'Applet \u00b7 As\u00edntotas oblicuas', [
      'Una funci\u00f3n tiene as\u00edntota oblicua $y=mx+n$ si $\\lim_{x \\to \\infty}\\dfrac{f(x)}{x}=m\\neq 0$ y $\\lim_{x \\to \\infty}\\left[f(x)-mx\\right]=n$.',
      'En una funci\u00f3n racional aparece exactamente cuando el grado del numerador es <b>una unidad mayor</b> que el del denominador.',
      'Ejemplo del libro: $\\dfrac{2x^{2}-1}{x+1}$ tiene as\u00edntota oblicua $y=2x-2$.',
      'Escribe <code>2,0,-1</code> entre <code>1,1</code> para reproducirlo. Prueba tambi\u00e9n <code>3,0,2,0</code> entre <code>1,0,-9</code>.'
    ],
      rowText('P', 'numerador', '2,0,-1') + rowText('Q', 'denominador', '1,1'));

    live(root, out, function () {
      var R = racional(root), f = R.f;
      var m = polDeg(R.P), k = polDeg(R.Q);
      var h = step(key('Funci\u00f3n: ') + TD('f(x)=\\dfrac{' + polTex(R.P) + '}{' + polTex(R.Q) + '}'));
      h += step('Grados: numerador ' + key(String(m)) + ' y denominador ' + key(String(k)) + '.');
      if (m !== k + 1) {
        h += step(bad('No hay as\u00edntota oblicua') + '. ' + note(m <= k
          ? 'Con el grado del numerador menor o igual hay as\u00edntota horizontal, no oblicua.'
          : 'Con una diferencia de grados mayor que uno aparece una rama parab\u00f3lica.'));
        h += plotSVG({ x0: -10, x1: 10, y0: -20, y1: 20, vasym: polRoots(R.Q), curves: [{ f: f }] });
        return h;
      }
      var mm = f(1e6) / 1e6;
      var mExact = polLead(R.P) / polLead(R.Q);
      var nn = f(1e6) - mExact * 1e6;
      var dv = polDiv(R.P, R.Q);
      h += step(key('Paso 1. ') + T(LIMT('x', INF, '\\dfrac{f(x)}{x}') + '=' + nt(mExact, 6)) + ', luego ' +
        chip(T('m=' + nt(mExact, 6))) + ' ' + note('distinto de cero, as\u00ed que s\u00ed existe la as\u00edntota'));
      h += step(key('Paso 2. ') + T(LIMT('x', INF, '\\left[f(x)-mx\\right]') + '=' + nt(nn, 4)) + ', luego ' +
        chip(T('n=' + nt(nn, 4))));
      h += step(key('As\u00edntota oblicua: ') + chip(T('y=' + polTex(dv.q))) + ' ' +
        note('coincide con el cociente de la divisi\u00f3n de polinomios, y esa es la forma m\u00e1s r\u00e1pida de hallarla'));
      h += step(key('V\u00eda alternativa muy \u00fatil: ') + 'al dividir, ' +
        T('f(x)=' + polTex(dv.q) + '+\\dfrac{' + polTex(dv.r) + '}{' + polTex(R.Q) + '}') +
        '. El resto tiende a cero, luego la funci\u00f3n se parece cada vez m\u00e1s al cociente.');
      var d1 = f(1000) - (mExact * 1000 + nn), d2 = f(-1000) - (mExact * -1000 + nn);
      h += step(key('Posici\u00f3n: ') + 'hacia ' + T('+' + INF) + ' la curva queda ' + (d1 > 0 ? 'por encima' : 'por debajo') +
        ' y hacia ' + T('-' + INF) + ' queda ' + (d2 > 0 ? 'por encima' : 'por debajo') + '.');
      h += plotSVG({
        x0: -12, x1: 12, y0: -25, y1: 25,
        vasym: polRoots(R.Q), oasym: [{ m: mExact, n: nn }],
        curves: [{ f: f }]
      });
      h += step(note('La recta morada es la as\u00edntota oblicua y las rojas las verticales.'));
      return h;
    });
  };

  LX.ramas = function (root) {
    var out = shell(root, 'Applet \u00b7 Ramas infinitas y clasificaci\u00f3n', [
      'En la gr\u00e1fica de una funci\u00f3n pueden existir tramos en los que la funci\u00f3n se aleja indefinidamente: son las <b>ramas infinitas</b>.',
      'Si una rama infinita se acerca indefinidamente a una recta, esa recta es una <b>as\u00edntota</b> y la rama es <b>asint\u00f3tica</b>. Si no se acerca a ninguna recta, es una <b>rama parab\u00f3lica</b>.',
      'El applet analiza una funci\u00f3n racional y clasifica todas sus as\u00edntotas de una vez.',
      'Casos para probar: <code>1,0</code> entre <code>1,-1</code>; <code>2,0,-1</code> entre <code>1,1</code>; <code>1,0,0,0</code> entre <code>1,1</code>.'
    ],
      rowText('P', 'numerador', '1,0,0,0') + rowText('Q', 'denominador', '1,1'));

    live(root, out, function () {
      var R = racional(root), f = R.f;
      var m = polDeg(R.P), k = polDeg(R.Q), roots = polRoots(R.Q);
      var h = step(key('Funci\u00f3n: ') + TD('f(x)=\\dfrac{' + polTex(R.P) + '}{' + polTex(R.Q) + '}'));
      var rows = [];
      var vas = roots.filter(function (c) { return Math.abs(polEval(R.P, c)) > 1e-7; });
      rows.push(['Verticales', vas.length ? vas.map(function (c) { return 'x = ' + num(c, 4); }).join(' \u00b7 ') : 'ninguna']);
      var oas = null;
      if (m < k) rows.push(['Horizontal', 'y = 0']);
      else if (m === k) rows.push(['Horizontal', 'y = ' + num(polLead(R.P) / polLead(R.Q), 6)]);
      else rows.push(['Horizontal', 'ninguna']);
      if (m === k + 1) {
        var dv = polDiv(R.P, R.Q);
        oas = { m: polLead(R.P) / polLead(R.Q), n: f(1e6) - (polLead(R.P) / polLead(R.Q)) * 1e6 };
        rows.push(['Oblicua', 'y = ' + P.plain(polTex(dv.q))]);
      } else rows.push(['Oblicua', 'ninguna']);
      rows.push(['Rama parab\u00f3lica', m > k + 1 ? 'S\u00ed, porque la diferencia de grados es ' + (m - k) : 'no']);
      h += tbl(['Tipo', 'Resultado'], rows.map(function (r) { return { cells: r }; }));
      h += step(key('Regla de oro: ') + 'una funci\u00f3n racional ' + key('no') +
        ' puede tener a la vez as\u00edntota horizontal y oblicua, porque las dos describen el mismo comportamiento en el infinito y solo puede haber uno.');
      h += step(note('Cuando la diferencia de grados es dos o m\u00e1s, la funci\u00f3n crece m\u00e1s deprisa que cualquier recta: la rama no se pega a ninguna, y por eso se llama parab\u00f3lica.'));
      h += plotSVG({
        x0: -12, x1: 12, y0: -30, y1: 30,
        vasym: vas,
        hasym: m <= k ? [m === k ? polLead(R.P) / polLead(R.Q) : 0] : [],
        oasym: oas ? [oas] : [],
        curves: [{ f: f }], H: 320
      });
      return h;
    });
  };

  /* =================================================================
     4. CONTINUIDAD
     ================================================================= */

  LX.continuidad = function (root) {
    var out = shell(root, 'Applet \u00b7 Las tres condiciones de continuidad', [
      'Una funci\u00f3n es continua en $x=a$ si se cumplen <b>las tres</b> condiciones: existe $f(a)$, existe $\\lim_{x \\to a}f(x)$, y adem\u00e1s coinciden.',
      'El applet comprueba las tres por separado, para que veas exactamente cu\u00e1l falla.',
      'Prueba <code>x^2</code> en $x=2$, continua; <code>(x^2-1)/(x-1)</code> en $x=1$, sin valor; <code>1/x</code> en $x=0$, con as\u00edntota.',
      'Idea intuitiva: una funci\u00f3n es continua en un punto si se puede dibujar ah\u00ed sin levantar el l\u00e1piz del papel.'
    ],
      rowText('f', 'f(x)', '(x^2-1)/(x-1)') +
      '<div class="ap-row">' + mini('a', 'punto a', 1, 0.5) + '</div>');

    live(root, out, function () {
      var src = val(root, 'f'), a = nv(root, 'a'), f = parse(src);
      var fa = f(a), Li = limitAt(f, a, '-'), Ld = limitAt(f, a, '+');
      var existeF = isFinite(fa);
      var existeL = Li.kind === 'fin' && Ld.kind === 'fin' && Math.abs(Li.v - Ld.v) < 1e-4;
      var L = existeL ? (Li.v + Ld.v) / 2 : null;
      var coincide = existeF && existeL && Math.abs(fa - L) < 1e-5;
      var h = step(key('Funci\u00f3n: ') + T('f(x)=' + texify(src)) + ' \u00b7 punto ' + T('x=' + nt(a)));
      h += tbl(['Condici\u00f3n', 'Resultado'], [
        { cells: ['Existe f(a)', existeF ? ok('S\u00ed, vale ' + num(fa, 6)) : bad('No, la funci\u00f3n no est\u00e1 definida ah\u00ed')] },
        { cells: ['Existe el l\u00edmite', existeL ? ok('S\u00ed, vale ' + num(L, 6))
            : bad('No' + (Li.kind === 'inf' || Ld.kind === 'inf' ? ', porque alg\u00fan lateral es infinito' : ', porque los laterales no coinciden'))] },
        { cells: ['Coinciden', coincide ? ok('S\u00ed') : bad('No')], mark: true }
      ]);
      h += step(coincide
        ? key('Conclusi\u00f3n: ') + ok('la funci\u00f3n es continua en ') + T('x=' + nt(a))
        : key('Conclusi\u00f3n: ') + bad('la funci\u00f3n es discontinua en ') + T('x=' + nt(a)));
      if (!coincide) {
        var tipo = (Li.kind === 'inf' || Ld.kind === 'inf') ? 'salto infinito'
          : existeL ? 'evitable' : 'salto finito';
        h += step(key('Tipo de discontinuidad: ') + chip(tipo) + '. ' +
          (tipo === 'evitable' ? note('Se llama evitable porque bastar\u00eda redefinir f(' + num(a) + ') = ' + num(L, 6) + ' para arreglarla.')
            : tipo === 'salto finito' ? note('El salto mide ' + num(Math.abs(Ld.v - Li.v), 6) + ' unidades.')
            : note('Hay una as\u00edntota vertical en ese punto.')));
      }
      h += step(note('Que un l\u00edmite exista no garantiza continuidad. Hacen falta las tres condiciones, y la tercera es la que las une.'));
      h += plotSVG({
        x0: a - 4, x1: a + 4,
        y0: (existeL ? L : 0) - 6, y1: (existeL ? L : 0) + 6,
        vasym: (Li.kind === 'inf' || Ld.kind === 'inf') ? [a] : [],
        curves: [{ f: f }],
        points: existeL ? [{ x: a, y: L, open: !coincide, lbl: coincide ? 'continua' : 'hueco' }] : []
      });
      return h;
    });
  };

  LX.discontinuidad = function (root) {
    var out = shell(root, 'Applet \u00b7 Tipos de discontinuidad', [
      'Hay tres tipos. <b>Evitable</b>: existe el l\u00edmite, pero no coincide con $f(a)$ o la funci\u00f3n no est\u00e1 definida ah\u00ed.',
      '<b>Salto finito</b>: existen los dos laterales, son finitos, pero distintos. <b>Salto infinito</b>: alg\u00fan lateral es infinito, es decir, hay as\u00edntota vertical.',
      'Elige el tipo y el applet construye un ejemplo, lo dibuja y explica por qu\u00e9 pertenece a esa categor\u00eda.',
      'Reto: en la evitable, di qu\u00e9 valor habr\u00eda que asignar para arreglarla. Es la pregunta t\u00edpica de examen.'
    ],
      '<div class="ap-row">' + sel('t', 'tipo', [['ev', 'evitable'], ['sf', 'salto finito'], ['si', 'salto infinito']], 'ev') +
      mini('a', 'punto a', 1, 0.5) + '</div>');

    live(root, out, function () {
      var t = val(root, 't'), a = nv(root, 'a');
      var h = '', f, L, pts = [], vas = [];
      if (t === 'ev') {
        f = function (x) { return Math.abs(x - a) < 1e-12 ? NaN : (x * x - a * a) / (x - a); };
        L = 2 * a;
        h += step(key('Ejemplo: ') + TD('f(x)=\\dfrac{x^{2}-' + nt(a * a) + '}{x-' + nt(a) + '}'));
        h += step('Al sustituir sale ' + T('\\dfrac{0}{0}') + '. Factorizando, ' +
          T('\\dfrac{\\left(x-' + nt(a) + '\\right)\\left(x+' + nt(a) + '\\right)}{x-' + nt(a) + '}=x+' + nt(a)) + '.');
        h += step(key('El l\u00edmite existe') + ' y vale ' + chip(num(L, 4)) + ', pero la funci\u00f3n ' + bad('no est\u00e1 definida') +
          ' en ' + T('x=' + nt(a)) + '.');
        h += step(key('Se evita ') + 'definiendo ' + T('f(' + nt(a) + ')=' + nt(L, 4)) +
          '. ' + note('De ahí el nombre: la discontinuidad desaparece con un solo retoque.'));
        pts = [{ x: a, y: L, open: true, lbl: 'hueco en ' + num(L, 3) }];
      } else if (t === 'sf') {
        f = function (x) { return x < a ? x * x - 1 : -x + 4; };
        var Li = a * a - 1, Ld = -a + 4;
        h += step(key('Ejemplo: ') + TD('f(x)=\\begin{cases}x^{2}-1 & \\text{si } x<' + nt(a) +
          '\\\\ -x+4 & \\text{si } x\\geq ' + nt(a) + '\\end{cases}'));
        h += step(T(LIMT('x', nt(a) + '^{-}', 'f(x)') + '=' + nt(Li, 4)) + ' y ' +
          T(LIMT('x', nt(a) + '^{+}', 'f(x)') + '=' + nt(Ld, 4)));
        h += step(key('Los dos laterales existen y son finitos, pero ') + bad('distintos') +
          ', luego no existe el l\u00edmite. El salto mide ' + chip(num(Math.abs(Ld - Li), 4)) + ' unidades.');
        h += step(note('Este tipo no se puede arreglar tocando un solo valor: el hueco no es un punto, es un escal\u00f3n.'));
        pts = [{ x: a, y: Li, open: true, color: '#2a76dd' }, { x: a, y: Ld, color: '#e63946' }];
      } else {
        f = function (x) { return 1 / (x - a); };
        h += step(key('Ejemplo: ') + TD('f(x)=\\dfrac{1}{x-' + nt(a) + '}'));
        h += step(T(LIMT('x', nt(a) + '^{-}', 'f(x)') + '=-' + INF) + ' y ' +
          T(LIMT('x', nt(a) + '^{+}', 'f(x)') + '=+' + INF));
        h += step(key('Al menos un lateral es infinito') + ', luego hay una ' + chip('as\u00edntota vertical') +
          ' en ' + T('x=' + nt(a)) + '.');
        h += step(note('Aqu\u00ed la funci\u00f3n no da un salto: se escapa. Es la discontinuidad m\u00e1s violenta de las tres.'));
        vas = [a];
      }
      h += plotSVG({
        x0: a - 4, x1: a + 4, y0: -8, y1: 8,
        vasym: vas, curves: [{ f: f }], points: pts
      });
      h += step(key('Resumen para el examen: ') + 'primero mira si los laterales son infinitos, y si lo son, es salto infinito. Si son finitos y distintos, salto finito. Si son finitos e iguales pero no coinciden con el valor, evitable.');
      return h;
    });
  };

  LX.trozoscont = function (root) {
    var out = shell(root, 'Applet \u00b7 Continuidad de funciones elementales', [
      'Cada familia de funciones tiene su regla. Las <b>polin\u00f3micas</b> son continuas en todo $\\mathbb{R}$. Las <b>racionales</b> fallan donde se anula el denominador.',
      'Las <b>ra\u00edces de \u00edndice par</b> no existen donde el radicando es negativo. Las <b>exponenciales</b> son continuas en todo $\\mathbb{R}$.',
      'Las <b>logar\u00edtmicas</b> fallan donde el argumento es cero o negativo. De las trigonom\u00e9tricas, solo la tangente es discontinua.',
      'Elige la familia y el applet determina el dominio de continuidad, con la figura correspondiente.'
    ],
      '<div class="ap-row">' + sel('t', 'familia', [
        ['pol', 'polin\u00f3mica'], ['rac', 'racional'], ['raiz', 'ra\u00edz cuadrada'],
        ['exp', 'exponencial'], ['log', 'logar\u00edtmica']
      ], 'rac') + '</div>' +
      rowText('f', 'funci\u00f3n', '(1-x)/(x-2)'));

    live(root, out, function () {
      var t = val(root, 't'), src = val(root, 'f'), f = parse(src);
      var h = step(key('Funci\u00f3n: ') + T('f(x)=' + texify(src)));
      var msg = {
        pol: ['Las funciones polin\u00f3micas son continuas en ' + T('\\mathbb{R}') + '.',
              'No hay ning\u00fan punto problem\u00e1tico: sumas y productos de continuas siguen siendo continuas.'],
        rac: ['Las racionales no son continuas donde se anula el denominador.',
              'Iguala el denominador a cero y resuelve: esos puntos quedan fuera del dominio.'],
        raiz: ['Con \u00edndice par, la funci\u00f3n no existe donde el radicando es negativo.',
               'Resuelve la inecuaci\u00f3n radicando mayor o igual que cero. Con \u00edndice impar no hay restricci\u00f3n.'],
        exp: ['Las exponenciales son continuas en ' + T('\\mathbb{R}') + '.',
              'Por grande o peque\u00f1o que sea el exponente, la potencia siempre existe.'],
        log: ['Las logar\u00edtmicas no son continuas donde el argumento es cero o negativo.',
              'Resuelve la inecuaci\u00f3n argumento mayor que cero, con desigualdad estricta.']
      }[t];
      h += step(key('Regla de la familia: ') + msg[0]);
      h += step(key('C\u00f3mo se aplica: ') + msg[1]);
      /* dominio numérico aproximado */
      var malos = [], x;
      for (x = -10; x <= 10; x += 0.02) { if (!isFinite(f(x))) malos.push(Math.round(x * 100) / 100); }
      var tramos = [];
      malos.forEach(function (v) {
        if (!tramos.length || v - tramos[tramos.length - 1][1] > 0.05) tramos.push([v, v]);
        else tramos[tramos.length - 1][1] = v;
      });
      h += step(key('Puntos donde la funci\u00f3n no existe, entre \u221210 y 10: ') +
        (tramos.length
          ? tramos.map(function (tr) {
              return chip(Math.abs(tr[1] - tr[0]) < 0.05 ? num(tr[0], 3) : num(tr[0], 3) + ' a ' + num(tr[1], 3));
            }).join('')
          : ok('ninguno')));
      h += step(key('Ejemplos del libro: ') + T('\\dfrac{1-x}{x-2}') + ' es continua en ' +
        T('\\mathbb{R}-\\left\\{2\\right\\}') + '; ' + T('\\sqrt{x+1}') + ' en ' + T('\\left[-1,+' + INF + '\\right)') +
        '; ' + T('\\log(x+3)') + ' en ' + T('\\left(-3,+' + INF + '\\right)') + '.');
      h += plotSVG({ x0: -10, x1: 10, y0: -8, y1: 8, vasym: t === 'rac' ? tramos.map(function (tr) { return (tr[0] + tr[1]) / 2; }) : [], curves: [{ f: f }] });
      return h;
    });
  };

  LX.bolzano = function (root) {
    var out = shell(root, 'Applet \u00b7 Propiedades de las funciones continuas', [
      'Si $f$ es continua en un intervalo cerrado $[a,b]$ y toma <b>signos distintos</b> en los extremos, entonces existe al menos un punto interior donde vale cero.',
      'Es el <b>teorema de Bolzano</b>, y su utilidad pr\u00e1ctica es enorme: permite localizar soluciones de ecuaciones que no se saben resolver.',
      'Escribe la funci\u00f3n y el intervalo. Ejemplos: <code>x^3-x-1</code> en $[1,2]$; <code>x^2-2</code> en $[1,2]$; <code>exp(x)-3</code> en $[0,2]$.',
      'El applet aplica el m\u00e9todo de bisecci\u00f3n, que es la demostraci\u00f3n del teorema convertida en algoritmo.'
    ],
      rowText('f', 'f(x)', 'x^3-x-1') +
      '<div class="ap-row">' + mini('a', 'extremo a', 1, 0.5) + mini('b', 'extremo b', 2, 0.5) +
      mini('k', 'pasos de bisecci\u00f3n', 8) + '</div>');

    live(root, out, function () {
      var src = val(root, 'f'), a = nv(root, 'a'), b = nv(root, 'b');
      var kk = Math.max(1, Math.min(20, iv(root, 'k'))), f = parse(src);
      if (!(a < b)) throw new Error('el extremo a debe ser menor que b.');
      var fa = f(a), fb = f(b);
      var h = step(key('Funci\u00f3n: ') + T('f(x)=' + texify(src)) + ' en ' + T('\\left[' + nt(a) + ',' + nt(b) + '\\right]'));
      h += step(T('f(' + nt(a) + ')=' + nt(fa, 6)) + ' y ' + T('f(' + nt(b) + ')=' + nt(fb, 6)));
      if (!(fa * fb < 0)) {
        h += step(bad('No se cumple la hip\u00f3tesis') + ': los dos valores tienen el mismo signo, luego el teorema ' +
          key('no dice nada') + '. ' + note('Cuidado: eso no significa que no haya soluci\u00f3n, solo que este teorema no la garantiza.'));
        h += plotSVG({ x0: a - 1, x1: b + 1, y0: -10, y1: 10, curves: [{ f: f }], hasym: [0] });
        return h;
      }
      h += step(ok('Los signos son distintos') + ', luego existe al menos un punto ' + T('c\\in\\left(' + nt(a) + ',' + nt(b) + '\\right)') +
        ' con ' + T('f(c)=0') + '.');
      var lo = a, hi = b, rows = [], i;
      for (i = 1; i <= kk; i++) {
        var m = (lo + hi) / 2, fm = f(m);
        rows.push({ cells: [String(i), num(lo, 6), num(hi, 6), num(m, 6), num(fm, 6)], mark: i === kk });
        if (f(lo) * fm <= 0) hi = m; else lo = m;
      }
      h += tbl(['Paso', 'a', 'b', 'punto medio', 'f del punto medio'], rows);
      h += step(key('Soluci\u00f3n aproximada: ') + chip(num((lo + hi) / 2, 8)) + ' con un error menor que ' +
        chip(num((hi - lo) / 2, 8)));
      h += step(note('Cada paso divide el intervalo por dos, luego el error se reduce a la mitad. Con veinte pasos el intervalo inicial se ha dividido por m\u00e1s de un mill\u00f3n.'));
      h += step(key('Aqu\u00ed se juntan dos temas: ') + 'la cota de error del tema de n\u00fameros reales y la continuidad de este. La bisecci\u00f3n no da el valor exacto, da un valor con ' + key('error acotado') + '.');
      h += plotSVG({
        x0: a - 0.5, x1: b + 0.5, y0: Math.min(fa, fb) - 2, y1: Math.max(fa, fb) + 2,
        hasym: [0], curves: [{ f: f }],
        points: [{ x: (lo + hi) / 2, y: 0, lbl: 'c \u2248 ' + num((lo + hi) / 2, 5) }]
      });
      return h;
    });
  };

  LX.resumen = function (root) {
    var out = shell(root, 'Applet \u00b7 Estudio completo de una funci\u00f3n racional', [
      'Applet de s\u00edntesis: re\u00fane todo el tema en un solo an\u00e1lisis. Dominio, l\u00edmites en el infinito, l\u00edmites en los puntos problem\u00e1ticos, as\u00edntotas y continuidad.',
      'Escribe los coeficientes del numerador y del denominador en orden descendente.',
      'Casos recomendados: <code>2,0,1</code> entre <code>1,-3,0</code>; <code>1,0,-9</code> entre <code>1,0,-1</code>; <code>2,0,-1</code> entre <code>1,1</code>.',
      'Es exactamente el guion que se pide en un examen. \u00daselo para autocorregirse despu\u00e9s de hacerlo a mano.'
    ],
      rowText('P', 'numerador', '1,0,-9') + rowText('Q', 'denominador', '1,0,-1'));

    live(root, out, function () {
      var R = racional(root), f = R.f;
      var m = polDeg(R.P), k = polDeg(R.Q), roots = polRoots(R.Q);
      var h = step(key('Funci\u00f3n: ') + TD('f(x)=\\dfrac{' + polTex(R.P) + '}{' + polTex(R.Q) + '}'));

      var evit = roots.filter(function (c) { return Math.abs(polEval(R.P, c)) < 1e-7; });
      var vas = roots.filter(function (c) { return Math.abs(polEval(R.P, c)) > 1e-7; });

      h += step(key('1. Dominio: ') + T('\\mathbb{R}' + (roots.length
        ? '-\\left\\{' + roots.map(function (c) { return nt(c, 4); }).join(',') + '\\right\\}'
        : '')));
      var Lp = limitInf(f, 1), Lm = limitInf(f, -1);
      h += step(key('2. L\u00edmites en el infinito: ') + T(LIMT('x', '+' + INF, 'f(x)') + '=' + nt(Lp.v, 6)) + ' y ' +
        T(LIMT('x', '-' + INF, 'f(x)') + '=' + nt(Lm.v, 6)));
      h += step(key('3. As\u00edntotas verticales: ') + (vas.length
        ? vas.map(function (c) {
            var li = f(c - 1e-4), ld = f(c + 1e-4);
            return chip('x = ' + num(c, 4) + ' (' + (li < 0 ? '\u2212\u221E' : '+\u221E') + ' | ' +
              (ld < 0 ? '\u2212\u221E' : '+\u221E') + ')');
          }).join('')
        : ok('ninguna')));
      var hor = m < k ? 0 : (m === k ? polLead(R.P) / polLead(R.Q) : null);
      h += step(key('4. As\u00edntota horizontal: ') + (hor !== null ? chip(T('y=' + nt(hor, 6))) : ok('ninguna')));
      var oas = null;
      if (m === k + 1) {
        var dv = polDiv(R.P, R.Q);
        oas = { m: polLead(R.P) / polLead(R.Q), n: f(1e6) - (polLead(R.P) / polLead(R.Q)) * 1e6 };
        h += step(key('5. As\u00edntota oblicua: ') + chip(T('y=' + polTex(dv.q))));
      } else {
        h += step(key('5. As\u00edntota oblicua: ') + (m > k + 1
          ? note('ninguna, pero hay rama parab\u00f3lica porque la diferencia de grados es ' + (m - k))
          : ok('ninguna')));
      }
      h += step(key('6. Continuidad: ') + 'continua en todo su dominio, ' +
        (roots.length ? T('\\mathbb{R}-\\left\\{' + roots.map(function (c) { return nt(c, 4); }).join(',') + '\\right\\}')
          : T('\\mathbb{R}')) + '.');
      h += step(key('7. Discontinuidades: ') +
        (vas.length ? vas.map(function (c) { return chip('salto infinito en x = ' + num(c, 4)); }).join('') : '') +
        (evit.length ? evit.map(function (c) { return chip('evitable en x = ' + num(c, 4)); }).join('') : '') +
        (!vas.length && !evit.length ? ok('ninguna') : ''));
      var span = 12;
      h += plotSVG({
        x0: -span, x1: span, y0: -20, y1: 20, H: 330,
        vasym: vas, hasym: hor !== null ? [hor] : [], oasym: oas ? [oas] : [],
        curves: [{ f: f }]
      });
      h += step(note('Rojo, as\u00edntotas verticales. Verde, horizontal. Morado, oblicua. Compara siempre la gr\u00e1fica con tus c\u00e1lculos: si no encajan, uno de los dos est\u00e1 mal.'));
      return h;
    });
  };

  /* =================================================================
     5. ARRANQUE
     ================================================================= */

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-applet-limx]'), function (node) {
      var k = node.getAttribute('data-applet-limx');
      if (typeof LX[k] === 'function') {
        try { LX[k](node); }
        catch (e) {
          node.classList.add('applet');
          node.innerHTML = P.errBox('el applet \u00ab' + k + '\u00bb no ha podido iniciarse: ' +
            (e && e.message ? e.message : e));
        }
      } else {
        node.classList.add('applet');
        node.innerHTML = P.errBox('no existe ning\u00fan applet con la clave \u00ab' + k +
          '\u00bb en el m\u00f3dulo de ampliaci\u00f3n.');
      }
    });
  }
  if (document.readyState === 'complete') boot();
  else document.addEventListener('DOMContentLoaded', boot);

  window.LIMX = { applets: LX };
})();
