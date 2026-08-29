/* =====================================================================
   re-applets-extra.js — NÚMEROS REALES · MÓDULO DE AMPLIACIÓN
   1r Batx Mates CCSS

   VERSIÓN 2 · correcciones respecto de la v1
     1) Usa num() de window.REAL para todos los decimales que se
        escriben en HTML normal. nt() queda reservado a T() y TD().
     2) Arranque en DOMContentLoaded, coherente con el módulo principal.

   Se carga DESPUÉS de re-applets.js y usa su API pública window.REAL.
   Sus applets se marcan en el .qmd con  data-applet-rex="clave"

   CLAVES DISPONIBLES
     potencias · valorradical · equivalentes · extraer · operarad
     sumarad · racionaliza
     deflog · proplog · cambiobase · neperiano · escalalog
   ===================================================================== */

(function () {
  'use strict';

  var P = window.REAL;
  if (!P) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-applet-rex]'), function (n) {
      n.className = 'applet';
      n.innerHTML = '<div class="ap-err">Aviso: falta re-applets.js. C\u00e1rgalo antes de este m\u00f3dulo.</div>';
    });
    return;
  }

  var RX = {};
  var T = P.T, TD = P.TD, step = P.step, warnStep = P.warnStep, key = P.key,
      ok = P.ok, bad = P.bad, note = P.note, chip = P.chip,
      nt = P.nt, num = P.num,
      gcd = P.gcd, lcm = P.lcm, factorize = P.factorize, factorTex = P.factorTex,
      rowText = P.rowText, mini = P.mini, sel = P.sel, get = P.get, val = P.val,
      nv = P.nv, iv = P.iv, live = P.live, shell = P.shell;

  /* =================================================================
     0. UTILIDADES DE RADICALES
     ================================================================= */

  /* Extrae factores de la raíz n-ésima de N: devuelve {out, in}. */
  function extract(N, k) {
    var neg = N < 0, f = factorize(N), out = 1, inn = 1;
    Object.keys(f).map(Number).forEach(function (p) {
      out *= Math.pow(p, Math.floor(f[p] / k));
      inn *= Math.pow(p, f[p] % k);
    });
    return { out: (neg && k % 2 === 1) ? -out : out, in: inn };
  }

  /* Simplifica además el índice. */
  function simplify(N, k) {
    var e = extract(N, k);
    if (e.in === 1) return { out: e.out, in: 1, idx: 1 };
    var f = factorize(e.in), g = k;
    Object.keys(f).forEach(function (p) { g = gcd(g, f[p]); });
    var inn = 1;
    Object.keys(f).map(Number).forEach(function (p) { inn *= Math.pow(p, f[p] / g); });
    return { out: e.out, in: inn, idx: k / g };
  }

  function radTex(k, inner, coef) {
    var r = (k === 2 ? '\\sqrt{' : '\\sqrt[' + k + ']{') + inner + '}';
    if (coef === undefined || coef === 1) return r;
    if (coef === -1) return '-' + r;
    return nt(coef) + r;
  }

  /* =================================================================
     1. POTENCIAS Y EXPONENTE RACIONAL
     ================================================================= */

  RX.potencias = function (root) {
    var out = shell(root, 'Applet \u00b7 Potencias y exponente racional', [
      'Todo radical es una potencia disfrazada: $\\sqrt[n]{a^{m}}=a^{m/n}$ y $\\dfrac{1}{\\sqrt[n]{a^{m}}}=a^{-m/n}$.',
      'Ese puente permite reutilizar las propiedades de las potencias y evita aprender reglas nuevas para los radicales.',
      'Ejemplos: $\\sqrt[3]{7^{2}}=7^{2/3}$, $\\sqrt{12}=12^{1/2}$, $\\sqrt[5]{9^{4}}=9^{4/5}$.',
      'Mueve el exponente por valores negativos y observa que la potencia pasa al denominador.'
    ],
      '<div class="ap-row">' + mini('a', 'base a', 8) + mini('m', 'exponente m', 2) +
      mini('n', '\u00edndice n', 3) + '</div>');

    live(root, out, function () {
      var a = nv(root, 'a'), m = iv(root, 'm'), n = iv(root, 'n');
      if (!(n >= 2)) throw new Error('el \u00edndice debe ser 2 o mayor.');
      if (a < 0 && n % 2 === 0) throw new Error('con base negativa e \u00edndice par la ra\u00edz no existe en los reales.');
      if (a === 0 && m < 0) throw new Error('no se puede elevar el cero a un exponente negativo.');
      var g = gcd(Math.abs(m), n) || 1;
      var h = step(key('Las dos escrituras: ') +
        T(radTex(n, nt(a) + '^{' + m + '}') + '=' + nt(a) + '^{' + m + '/' + n + '}'));
      if (g > 1) {
        h += step('La fracci\u00f3n del exponente se puede simplificar: ' +
          T('\\dfrac{' + m + '}{' + n + '}=\\dfrac{' + (m / g) + '}{' + (n / g) + '}') +
          ', luego el radical equivalente m\u00e1s simple es ' +
          T(radTex(n / g, nt(a) + '^{' + (m / g) + '}')) + '.');
      }
      var v = Math.pow(Math.abs(a), m / n) * (a < 0 && n % 2 === 1 ? -1 : 1);
      h += step('Valor aproximado: ' + T(nt(v, 6)));
      h += step(m < 0
        ? key('Exponente negativo: ') +
          T(nt(a) + '^{' + m + '/' + n + '}=\\dfrac{1}{' + radTex(n, nt(a) + '^{' + Math.abs(m) + '}') + '}')
        : note('Con exponente positivo el radical queda en el numerador. Prueba con $m$ negativo.'));
      h += step(key('Las siete propiedades siguen valiendo: ') +
        T('a^{p}\\cdot a^{q}=a^{p+q}') + ', ' + T('\\dfrac{a^{p}}{a^{q}}=a^{p-q}') + ', ' +
        T('\\left(a^{p}\\right)^{q}=a^{pq}') + '.');
      h += warnStep('El error m\u00e1s caro del tema: ' + T('\\left(-2\\right)^{4}=16') + ' pero ' +
        T('-2^{4}=-16') + '. Sin par\u00e9ntesis, el signo no entra en la base.');
      return h;
    });
  };

  RX.valorradical = function (root) {
    var out = shell(root, 'Applet \u00b7 Cu\u00e1ntas ra\u00edces reales hay', [
      'Por definici\u00f3n, $\\sqrt[n]{a}=b$ significa $b^{n}=a$. El n\u00famero de ra\u00edces reales depende del <b>signo del radicando</b> y de la <b>paridad del \u00edndice</b>.',
      'Prueba las cinco combinaciones: radicando positivo con \u00edndice par y con impar, radicando cero, y radicando negativo con \u00edndice par y con impar.',
      'Ejemplos: $\\sqrt{16}$ tiene dos ra\u00edces, $4$ y $-4$; $\\sqrt[3]{-64}=-4$ tiene una; $\\sqrt{-64}$ no existe en los reales.',
      'Recuerda que la calculadora, con \u00edndice par, solo devuelve la ra\u00edz positiva. La negativa la escribes t\u00fa.'
    ], '<div class="ap-row">' + mini('a', 'radicando', 16) + mini('n', '\u00edndice', 2) + '</div>');

    live(root, out, function () {
      var a = nv(root, 'a'), n = iv(root, 'n');
      if (!(n >= 2 && n <= 9)) throw new Error('elige un \u00edndice entre 2 y 9.');
      if (!isFinite(a)) throw new Error('escribe un radicando num\u00e9rico.');
      var par = n % 2 === 0;
      var h = step('Radical: ' + T(radTex(n, nt(a))) + ' \u00b7 \u00edndice ' + key(par ? 'par' : 'impar') +
        ' \u00b7 radicando ' + key(a > 0 ? 'positivo' : a < 0 ? 'negativo' : 'cero'));
      if (a === 0) {
        h += step(ok('1 ra\u00edz') + ': ' + T('\\sqrt[' + n + ']{0}=0'));
      } else if (a > 0 && !par) {
        h += step(ok('1 ra\u00edz positiva') + ': ' + chip(num(Math.pow(a, 1 / n), 6)));
      } else if (a > 0 && par) {
        var b = Math.pow(a, 1 / n);
        h += step(ok('2 ra\u00edces opuestas') + ': ' + chip(num(b, 6)) + chip('\u2212' + num(b, 6)));
        h += step('Las dos cumplen la definici\u00f3n, porque ' +
          T('\\left(\\pm' + nt(b, 4) + '\\right)^{' + n + '}=' + nt(a)) + ' al ser el exponente par.');
        h += step(note('La ra\u00edz aritm\u00e9tica, la que devuelve la calculadora, es la positiva.'));
      } else if (a < 0 && !par) {
        var c = -Math.pow(-a, 1 / n);
        h += step(ok('1 ra\u00edz negativa') + ': ' + chip(num(c, 6)));
        h += step('Con \u00edndice impar el signo se conserva: ' +
          T('\\left(' + nt(c, 4) + '\\right)^{' + n + '}=' + nt(a)) + '.');
      } else {
        h += step(bad('Ninguna ra\u00edz real') +
          '. Ning\u00fan n\u00famero real elevado a un exponente par da un resultado negativo.');
        h += step(note('En el conjunto de los complejos s\u00ed existir\u00eda, pero ese conjunto queda fuera de este curso.'));
      }
      h += step(key('Cuidado con el signo de delante: ') + T('-\\sqrt{64}=-8') + ' existe, pero ' +
        T('\\sqrt{-64}') + ' no. El signo dentro y fuera del radical no son lo mismo.');
      return h;
    });
  };

  RX.equivalentes = function (root) {
    var out = shell(root, 'Applet \u00b7 Radicales equivalentes y simplificaci\u00f3n', [
      'Propiedad fundamental: $\\sqrt[n]{a^{m}}=\\sqrt[n\\cdot p]{a^{m\\cdot p}}$, porque las fracciones $\\dfrac{m}{n}$ y $\\dfrac{mp}{np}$ son equivalentes.',
      'Simplificar un radical significa escribirlo con el \u00edndice m\u00e1s peque\u00f1o posible, es decir, con la fracci\u00f3n irreducible.',
      'Ejemplos del libro: $\\sqrt[4]{2^{6}}$ equivale a $\\sqrt{2^{3}}$, pues $\\tfrac{6}{4}=\\tfrac{3}{2}$; y $\\sqrt[6]{27}=\\sqrt{3}$.',
      'Mueve el factor de amplificaci\u00f3n y comprueba que el valor num\u00e9rico no cambia nunca.'
    ],
      '<div class="ap-row">' + mini('a', 'base a', 3) + mini('m', 'exponente m', 3) +
      mini('n', '\u00edndice n', 6) + '</div>' +
      '<div class="ap-row">' + mini('p', 'amplificar por p', 1) + '</div>');

    live(root, out, function () {
      var a = nv(root, 'a'), m = iv(root, 'm'), n = iv(root, 'n'), p = Math.max(1, iv(root, 'p'));
      if (!(n >= 2)) throw new Error('el \u00edndice debe ser 2 o mayor.');
      if (!(a > 0)) throw new Error('usa una base positiva en este applet.');
      if (!(m >= 1)) throw new Error('usa un exponente mayor o igual que 1.');
      var g = gcd(m, n) || 1;
      var h = step('Radical de partida: ' + T(radTex(n, nt(a) + '^{' + m + '}')) + ' \u00b7 como potencia ' +
        T(nt(a) + '^{' + m + '/' + n + '}'));
      h += step(key('Amplificado por ' + p + ': ') + T(radTex(n * p, nt(a) + '^{' + (m * p) + '}')) +
        ' ' + note('mismo valor, distinto aspecto'));
      h += step(key('Simplificado: ') + (g > 1
        ? T(radTex(n / g, nt(a) + '^{' + (m / g) + '}')) + ' ' +
          note('(dividiendo \u00edndice y exponente entre ' + g + ')')
        : T(radTex(n, nt(a) + '^{' + m + '}')) + ' ' + note('(ya estaba en su forma m\u00e1s simple)')));
      var v = Math.pow(a, m / n);
      h += step('Valor num\u00e9rico en las tres escrituras: ' + chip(num(v, 8)) + ' ' + ok('id\u00e9ntico'));
      if (m > n) {
        var q = Math.floor(m / n), r = m % n;
        h += step(key('Fracci\u00f3n impropia: ') +
          T('\\dfrac{' + m + '}{' + n + '}=' + q + '+\\dfrac{' + r + '}{' + n + '}') + ', luego ' +
          T(radTex(n, nt(a) + '^{' + m + '}') + '=' + nt(a) + '^{' + q + '}' +
            (r ? radTex(n, nt(a) + (r > 1 ? '^{' + r + '}' : '')) : '')));
      }
      h += warnStep('Detalle conceptual: al amplificar el \u00edndice puede cambiar el <b>n\u00famero de ra\u00edces</b>. ' +
        T('\\sqrt[3]{-1}=-1') + ' existe, pero ' + T('\\sqrt[6]{\\left(-1\\right)^{2}}=1') +
        '. Equivalencia formal no es equivalencia de soluciones.');
      return h;
    });
  };

  RX.extraer = function (root) {
    var out = shell(root, 'Applet \u00b7 Extraer e introducir factores', [
      'Extraer: $\\sqrt[n]{a^{\\,nq+r}}=a^{q}\\sqrt[n]{a^{\\,r}}$. Se divide cada exponente entre el \u00edndice: el <b>cociente</b> sale fuera y el <b>resto</b> se queda dentro.',
      'Introducir: $c\\sqrt[n]{b}=\\sqrt[n]{c^{n}b}$. Sirve para <b>comparar</b> radicales.',
      'Ejemplos: $\\sqrt{72}=6\\sqrt{2}$; $\\sqrt[3]{24}=2\\sqrt[3]{3}$; $\\sqrt[3]{1080}=6\\sqrt[3]{5}$.',
      'Reto de comparaci\u00f3n: \u00bfqu\u00e9 es mayor, $3\\sqrt{2}$ o $2\\sqrt{5}$? Introduce los factores y compara los radicandos.'
    ],
      '<div class="ap-row">' + mini('ea', 'radicando', 72) + mini('en', '\u00edndice', 2) + '</div>' +
      '<div class="ap-row">' + mini('ic', 'coeficiente c', 3) + mini('ib', 'radicando b', 2) +
      mini('inx', '\u00edndice', 2) + '</div>');

    live(root, out, function () {
      var ea = iv(root, 'ea'), en = iv(root, 'en');
      var ic = iv(root, 'ic'), ib = iv(root, 'ib'), inx = iv(root, 'inx');
      if (!(en >= 2) || !(inx >= 2)) throw new Error('los \u00edndices deben ser 2 o mayores.');
      if (!(ea > 0) || !(ib > 0)) throw new Error('usa radicandos positivos en este applet.');
      if (ea > 1e7) throw new Error('usa un radicando menor para que la descomposici\u00f3n sea legible.');

      var e = extract(ea, en), s = simplify(ea, en);
      var h = step(key('EXTRAER. ') + 'Radical de partida ' + T(radTex(en, String(ea))));
      h += step('Descomposici\u00f3n en factores primos: ' + T(String(ea) + '=' + factorTex(ea)));
      var f = factorize(ea), det = [];
      Object.keys(f).map(Number).sort(function (x, y) { return x - y; }).forEach(function (pr) {
        det.push(pr + '^{' + f[pr] + '}\\rightarrow ' + Math.floor(f[pr] / en) +
          '\\text{ fuera},\\ ' + (f[pr] % en) + '\\text{ dentro}');
      });
      h += step('Dividiendo cada exponente entre ' + en + ': ' + T(det.join(';\\quad ')));
      h += step(key('Resultado: ') +
        T(radTex(en, String(ea)) + '=' + (e.in === 1 ? nt(e.out) : radTex(en, String(e.in), e.out))));
      if (s.idx !== en && s.in !== 1) {
        h += step('Adem\u00e1s se puede reducir el \u00edndice: ' + T(radTex(s.idx, String(s.in), s.out)));
      }
      h += step('Comprobaci\u00f3n num\u00e9rica: ' + chip(num(Math.pow(ea, 1 / en), 6)) + ' y ' +
        chip(num(e.out * Math.pow(e.in, 1 / en), 6)) + ' ' + ok('coinciden'));

      h += step(key('INTRODUCIR. ') +
        T(nt(ic) + radTex(inx, String(ib)) + '=' +
          radTex(inx, String(Math.pow(ic, inx)) + '\\cdot ' + ib) + '=' +
          radTex(inx, String(Math.pow(ic, inx) * ib))));
      if (ic < 0 && inx % 2 === 0) {
        h += warnStep('Cuidado con el signo: con \u00edndice par, un coeficiente negativo ' + bad('no') +
          ' puede entrar sin m\u00e1s, porque el radical resultante ser\u00eda positivo.');
      }
      h += step(key('Comparaci\u00f3n: ') + T('3\\sqrt{2}=\\sqrt{18}') + ' frente a ' + T('2\\sqrt{5}=\\sqrt{20}') +
        ', luego gana ' + chip(T('2\\sqrt{5}')) + '. ' +
        note('Introducir factores convierte una comparaci\u00f3n dif\u00edcil en una f\u00e1cil.'));
      return h;
    });
  };

  RX.operarad = function (root) {
    var out = shell(root, 'Applet \u00b7 Producto, cociente y radical de radical', [
      'Con el <b>mismo \u00edndice</b>: $\\sqrt[n]{a}\\cdot\\sqrt[n]{b}=\\sqrt[n]{ab}$ y $\\dfrac{\\sqrt[n]{a}}{\\sqrt[n]{b}}=\\sqrt[n]{\\dfrac{a}{b}}$.',
      'Con <b>\u00edndices distintos</b> hay que igualarlos primero usando radicales equivalentes, con el m\u00ednimo com\u00fan m\u00faltiplo.',
      'Radical de un radical: $\\sqrt[m]{\\sqrt[n]{a}}=\\sqrt[m\\cdot n]{a}$. Los \u00edndices se <b>multiplican</b>, nunca se suman.',
      'Ejemplos: $\\sqrt{2}\\cdot\\sqrt{18}=6$; $\\dfrac{\\sqrt[3]{54}}{\\sqrt[3]{2}}=3$; $\\sqrt{3}\\cdot\\sqrt[4]{3}=\\sqrt[4]{27}$.'
    ],
      '<div class="ap-row">' + mini('a', 'radicando a', 2) + mini('na', '\u00edndice', 2) +
      sel('op', '', [['*', '\u00d7'], ['/', '\u00f7'], ['r', 'radical de radical']], '*') +
      mini('b', 'radicando b', 18) + mini('nb', '\u00edndice', 2) + '</div>');

    live(root, out, function () {
      var a = iv(root, 'a'), na = iv(root, 'na'), b = iv(root, 'b'), nb = iv(root, 'nb'), op = val(root, 'op');
      if (!(na >= 2 && nb >= 2)) throw new Error('los \u00edndices deben ser 2 o mayores.');
      if (!(a > 0) || !(b > 0)) throw new Error('usa radicandos positivos en este applet.');
      var h = '';
      if (op === 'r') {
        h += step('Radical de radical: ' + T(radTex(na, radTex(nb, String(a))) + '=' + radTex(na * nb, String(a))));
        h += step('Con exponentes fraccionarios se ve de inmediato: ' +
          T('\\left(a^{1/' + nb + '}\\right)^{1/' + na + '}=a^{1/' + (na * nb) + '}'));
        h += step('Valor: ' + chip(num(Math.pow(a, 1 / (na * nb)), 8)));
        h += step(note('El segundo radicando y su \u00edndice no intervienen en este modo: el \u00edndice exterior es el primero.'));
        return h;
      }
      h += step('Operaci\u00f3n: ' + T(radTex(na, String(a)) + (op === '*' ? '\\cdot' : ':') + radTex(nb, String(b))));
      var n = na;
      if (na !== nb) {
        n = lcm(na, nb);
        h += step(key('\u00cdndices distintos: ') + 'el m\u00ednimo com\u00fan m\u00faltiplo de ' + na + ' y ' + nb +
          ' es ' + key(String(n)) + '. Convertimos los dos: ' +
          T(radTex(n, String(a) + '^{' + (n / na) + '}') + (op === '*' ? '\\cdot' : ':') +
            radTex(n, String(b) + '^{' + (n / nb) + '}')));
      }
      var A = Math.pow(a, n / na), B = Math.pow(b, n / nb);
      var inner = op === '*' ? A * B : A / B;
      h += step(key('Mismo \u00edndice: ') + 'se opera dentro de un solo radical: ' + T(radTex(n, nt(inner))));
      if (Number.isInteger(inner) && inner > 0) {
        var s = simplify(inner, n);
        h += step(key('Simplificado: ') + T(s.in === 1 ? nt(s.out) : radTex(s.idx, String(s.in), s.out)));
      }
      h += step('Valor aproximado: ' + chip(num(Math.pow(inner, 1 / n), 8)));
      h += warnStep('Lo que ' + bad('no') + ' existe: ' + T('\\sqrt{a+b}\\neq\\sqrt{a}+\\sqrt{b}') +
        '. Contraejemplo: ' + T('\\sqrt{9+16}=5') + ' pero ' + T('\\sqrt{9}+\\sqrt{16}=7') + '.');
      return h;
    });
  };

  RX.sumarad = function (root) {
    var out = shell(root, 'Applet \u00b7 Suma de radicales semejantes', [
      'Solo se pueden sumar o restar radicales <b>semejantes</b>, es decir, con el mismo \u00edndice y el mismo radicando: $p\\sqrt[n]{a}+q\\sqrt[n]{a}=(p+q)\\sqrt[n]{a}$.',
      'Truco de examen: si a primera vista no son semejantes, <b>extrae factores</b> y vuelve a mirar. Casi siempre esconden el mismo radicando.',
      'Ejemplo del libro: $\\sqrt{50}+\\sqrt{18}-\\sqrt{8}=5\\sqrt{2}+3\\sqrt{2}-2\\sqrt{2}=6\\sqrt{2}$.',
      'Prueba tambi\u00e9n $\\sqrt{12}+\\sqrt{27}$ y $\\sqrt{45}-\\sqrt{20}$.'
    ],
      '<div class="ap-row">' + mini('n', '\u00edndice', 2) + '</div>' +
      '<div class="ap-row">' + mini('a', 'radicando 1', 50) + mini('b', 'radicando 2', 18) +
      mini('c', 'radicando 3', 8) + '</div>' +
      '<div class="ap-row">' + sel('s1', 'signo 2', [['1', '+'], ['-1', '\u2212']], '1') +
      sel('s2', 'signo 3', [['-1', '\u2212'], ['1', '+']], '-1') + '</div>');

    live(root, out, function () {
      var n = iv(root, 'n'), a = iv(root, 'a'), b = iv(root, 'b'), c = iv(root, 'c');
      var s1 = parseInt(val(root, 's1'), 10), s2 = parseInt(val(root, 's2'), 10);
      if (!(n >= 2)) throw new Error('el \u00edndice debe ser 2 o mayor.');
      [a, b, c].forEach(function (x) { if (!(x > 0)) throw new Error('usa radicandos positivos.'); });
      var vals = [a, b, c], sg = [1, s1, s2];
      var ex = vals.map(function (x) { return extract(x, n); });
      var h = step('Expresi\u00f3n: ' + T(radTex(n, String(a)) + (s1 > 0 ? '+' : '-') + radTex(n, String(b)) +
        (s2 > 0 ? '+' : '-') + radTex(n, String(c))));
      h += step(key('Paso 1. ') + 'Extraemos factores de cada radical: ' +
        ex.map(function (e, i) {
          return T(radTex(n, String(vals[i])) + '=' +
            (e.in === 1 ? nt(e.out) : radTex(n, String(e.in), e.out)));
        }).join(' \u00b7 '));
      var groups = {};
      ex.forEach(function (e, i) { groups[e.in] = (groups[e.in] || 0) + sg[i] * e.out; });
      var keys = Object.keys(groups).map(Number).sort(function (x, y) { return x - y; });
      h += step(key('Paso 2. ') + (keys.length === 1
        ? 'Los tres radicales son ' + ok('semejantes') + ': mismo \u00edndice y mismo radicando ' +
          T(String(keys[0])) + '.'
        : 'Hay ' + keys.length + ' radicandos distintos, luego ' + bad('no') +
          ' todos son semejantes: solo se agrupan los que coinciden.'));
      var partes = keys.map(function (r) {
        var co = groups[r];
        if (co === 0) return '0';
        return r === 1 ? nt(co) : radTex(n, String(r), co);
      }).filter(function (t) { return t !== '0'; });
      if (!partes.length) partes = ['0'];
      h += step(key('Resultado: ') + chip(T(partes.join('+').replace(/\+-/g, '-'))));
      var tot = ex.reduce(function (acc, e, i) {
        return acc + sg[i] * e.out * Math.pow(e.in, 1 / n);
      }, 0);
      h += step('Comprobaci\u00f3n num\u00e9rica: ' + chip(num(tot, 6)) + ' ' + ok('coincide con el resultado'));
      h += step(note('Sumar radicales es exactamente como sumar monomios semejantes: $3x+5x=8x$. Si el radicando cambia, es como si cambiara la letra.'));
      return h;
    });
  };

  RX.racionaliza = function (root) {
    var out = shell(root, 'Applet \u00b7 Racionalizaci\u00f3n', [
      'Racionalizar es escribir una fracci\u00f3n <b>sin radicales en el denominador</b>, multiplicando numerador y denominador por lo mismo.',
      'Caso monomio con \u00edndice 2: se multiplica por el propio radical. Caso monomio con \u00edndice $n$: se multiplica por $\\sqrt[n]{a^{\\,n-m}}$ para completar el exponente.',
      'Caso binomio: se multiplica por el <b>conjugado</b>, y funciona porque $(a+b)(a-b)=a^{2}-b^{2}$ elimina las ra\u00edces.',
      'Ejemplos: $\\dfrac{1}{\\sqrt{5}}$; $\\dfrac{5}{\\sqrt[3]{2}}$; $\\dfrac{2}{\\sqrt{5}-\\sqrt{3}}$.'
    ],
      '<div class="ap-row">' + sel('t', 'caso', [['mono', 'monomio'], ['bino', 'binomio con conjugado']], 'mono') + '</div>' +
      '<div class="ap-row">' + mini('numr', 'numerador', 1) + mini('a', 'radicando a', 5) +
      mini('n', '\u00edndice', 2) + mini('m', 'exponente m', 1) + '</div>' +
      '<div class="ap-row">' + mini('b', 'segundo radicando', 3) +
      sel('sg', 'signo', [['-1', '\u2212'], ['1', '+']], '-1') + '</div>');

    live(root, out, function () {
      var t = val(root, 't'), nr = nv(root, 'numr'), a = iv(root, 'a'), n = iv(root, 'n'), m = iv(root, 'm');
      var b = iv(root, 'b'), sg = parseInt(val(root, 'sg'), 10);
      if (!(a > 0) || !(b > 0)) throw new Error('usa radicandos positivos.');
      if (!isFinite(nr)) throw new Error('escribe un numerador num\u00e9rico.');
      var h;
      if (t === 'mono') {
        if (!(n >= 2) || !(m >= 1 && m < n)) {
          throw new Error('hace falta \u00edndice mayor o igual que 2 y exponente entre 1 y el \u00edndice menos uno.');
        }
        var comp = n - m;
        h = step('Fracci\u00f3n: ' +
          T('\\dfrac{' + nt(nr) + '}{' + radTex(n, String(a) + (m > 1 ? '^{' + m + '}' : '')) + '}'));
        h += step(key('Estrategia: ') + 'al radicando le falta el exponente ' + key(String(comp)) +
          ' para completar el \u00edndice, as\u00ed que multiplicamos arriba y abajo por ' +
          T(radTex(n, String(a) + '^{' + comp + '}')) + '.');
        h += step(T('\\dfrac{' + nt(nr) + '}{' + radTex(n, String(a) + (m > 1 ? '^{' + m + '}' : '')) +
          '}\\cdot\\dfrac{' + radTex(n, String(a) + '^{' + comp + '}') + '}{' +
          radTex(n, String(a) + '^{' + comp + '}') + '}=\\dfrac{' + nt(nr) +
          radTex(n, String(a) + (comp > 1 ? '^{' + comp + '}' : '')) + '}{' + a + '}'));
        h += step(key('Resultado: ') +
          chip(T('\\dfrac{' + nt(nr) + radTex(n, String(Math.pow(a, comp))) + '}{' + a + '}')));
        h += step('Comprobaci\u00f3n num\u00e9rica: ' + chip(num(nr / Math.pow(a, m / n), 8)) + ' y ' +
          chip(num(nr * Math.pow(a, comp / n) / a, 8)) + ' ' + ok('coinciden'));
      } else {
        if (a === b) throw new Error('con los dos radicandos iguales el denominador se anular\u00eda.');
        var den = Math.sqrt(a) + sg * Math.sqrt(b);
        h = step('Fracci\u00f3n: ' + T('\\dfrac{' + nt(nr) + '}{\\sqrt{' + a + '}' +
          (sg > 0 ? '+' : '-') + '\\sqrt{' + b + '}}'));
        h += step(key('Conjugado: ') + T('\\sqrt{' + a + '}' + (sg > 0 ? '-' : '+') + '\\sqrt{' + b + '}') +
          '. Se multiplica arriba y abajo por \u00e9l.');
        h += step('El denominador se convierte en una suma por diferencia: ' +
          T('\\left(\\sqrt{' + a + '}\\right)^{2}-\\left(\\sqrt{' + b + '}\\right)^{2}=' +
            a + '-' + b + '=' + (a - b)));
        h += step(key('Resultado: ') +
          chip(T('\\dfrac{' + nt(nr) + '\\left(\\sqrt{' + a + '}' + (sg > 0 ? '-' : '+') +
            '\\sqrt{' + b + '}\\right)}{' + (a - b) + '}')));
        h += step('Comprobaci\u00f3n num\u00e9rica: ' + chip(num(nr / den, 8)) + ' y ' +
          chip(num(nr * (Math.sqrt(a) - sg * Math.sqrt(b)) / (a - b), 8)) + ' ' + ok('coinciden'));
        if (a - b < 0) {
          h += step(note('El denominador ha quedado negativo. Es correcto, pero conviene reordenar los signos al presentar el resultado.'));
        }
      }
      h += step(note('Racionalizar no cambia el valor de la fracci\u00f3n: solo su aspecto. Se hace para comparar, sumar y estimar con m\u00e1s comodidad.'));
      return h;
    });
  };

  /* =================================================================
     2. LOGARITMOS
     ================================================================= */

  RX.deflog = function (root) {
    var out = shell(root, 'Applet \u00b7 Definici\u00f3n de logaritmo', [
      'Dados $a>0$ con $a\\neq1$ y $b>0$, el logaritmo en base $a$ de $b$ es el exponente al que hay que elevar $a$ para obtener $b$: $\\log_{a}b=c\\iff a^{c}=b$.',
      'En base 10 se llaman <b>decimales</b> y la base no se escribe. En base $e\\approx2{,}71828$ se llaman <b>neperianos</b> y se escriben $\\ln$.',
      'Ejemplos del libro: $\\log_{2}16=4$; $\\log 0{,}001=-3$; $\\ln e^{3}=3$; $\\log_{5}0{,}0016=-4$.',
      'Pon un argumento negativo o cero y lee el aviso: el logaritmo no existe.'
    ],
      '<div class="ap-row">' + mini('a', 'base a', 2, 0.1) + mini('b', 'argumento b', 16, 0.1) + '</div>');

    live(root, out, function () {
      var a = nv(root, 'a'), b = nv(root, 'b');
      if (!(a > 0) || Math.abs(a - 1) < 1e-9) throw new Error('la base debe cumplir $a>0$ y $a\\neq1$.');
      if (!(b > 0)) {
        return step(bad('El logaritmo no existe') + ': el argumento debe ser ' + key('estrictamente positivo') +
          '. Por muy grande o peque\u00f1o que sea el exponente, ' + T('a^{c}') +
          ' nunca es cero ni negativo cuando ' + T('a>0') + '.');
      }
      var c = Math.log(b) / Math.log(a);
      var h = step('Pregunta: ' + T('\\log_{' + nt(a) + '}' + nt(b) + '=c') +
        ' significa \u00bfa qu\u00e9 exponente hay que elevar ' + T(nt(a)) + ' para obtener ' + T(nt(b)) + '?');
      h += step(key('Respuesta: ') + chip(num(c, 6)));
      h += step('Comprobaci\u00f3n: ' + T(nt(a) + '^{' + nt(c, 6) + '}=' + nt(Math.pow(a, c), 6)));
      if (Number.isInteger(Math.round(c * 1e6) / 1e6)) {
        h += step(ok('El resultado es exacto') + ', porque ' + T(nt(b)) +
          ' es una potencia entera de ' + T(nt(a)) + '.');
      } else {
        h += step(note('El resultado no es entero. En ese caso se deja indicado o se aproxima con la calculadora.'));
      }
      h += step(key('Los dos casos que hay que memorizar: ') + T('\\log_{a}a=1') + ' y ' + T('\\log_{a}1=0') + '.');
      h += step('Y una lectura potente: si ' + T('\\log_{a}b<0') + ', entonces ' + T('b<1') +
        ' cuando la base es mayor que uno. ' +
        note('Mira el signo del resultado y saca conclusiones antes de calcular.'));
      return h;
    });
  };

  RX.proplog = function (root) {
    var out = shell(root, 'Applet \u00b7 Propiedades de los logaritmos', [
      'Producto: $\\log_{a}(xy)=\\log_{a}x+\\log_{a}y$. Cociente: $\\log_{a}\\dfrac{x}{y}=\\log_{a}x-\\log_{a}y$. Potencia: $\\log_{a}x^{n}=n\\log_{a}x$.',
      'De la potencia sale la de la ra\u00edz: $\\log_{a}\\sqrt[n]{x}=\\dfrac{\\log_{a}x}{n}$.',
      'Ejemplo del libro: $\\log 2{,}5+\\log 40=\\log 100=2$. Y $\\log(72)=3\\log 2+2\\log 3$.',
      'Elige la propiedad y los datos, y comprueba que las dos formas de calcular coinciden.'
    ],
      '<div class="ap-row">' + sel('p', 'propiedad', [['prod', 'producto'], ['coc', 'cociente'], ['pot', 'potencia'], ['raiz', 'ra\u00edz']], 'prod') +
      mini('a', 'base', 10) + '</div>' +
      '<div class="ap-row">' + mini('x', 'x', 2.5, 0.1) + mini('y', 'y', 40, 0.1) + mini('n', 'n', 3) + '</div>');

    live(root, out, function () {
      var p = val(root, 'p'), a = nv(root, 'a'), x = nv(root, 'x'), y = nv(root, 'y'), n = iv(root, 'n');
      if (!(a > 0) || Math.abs(a - 1) < 1e-9) throw new Error('la base debe cumplir $a>0$ y $a\\neq1$.');
      if (!(x > 0)) throw new Error('$x$ debe ser positivo.');
      function L(v) { return Math.log(v) / Math.log(a); }
      var base = Math.abs(a - 10) < 1e-9 ? '\\log' : '\\log_{' + nt(a) + '}';
      var h = '', izq, der, txt;
      if (p === 'prod') {
        if (!(y > 0)) throw new Error('$y$ debe ser positivo.');
        txt = base + '\\left(' + nt(x) + '\\cdot' + nt(y) + '\\right)=' + base + nt(x) + '+' + base + nt(y);
        izq = L(x * y); der = L(x) + L(y);
      } else if (p === 'coc') {
        if (!(y > 0)) throw new Error('$y$ debe ser positivo.');
        txt = base + '\\dfrac{' + nt(x) + '}{' + nt(y) + '}=' + base + nt(x) + '-' + base + nt(y);
        izq = L(x / y); der = L(x) - L(y);
      } else if (p === 'pot') {
        txt = base + nt(x) + '^{' + n + '}=' + n + base + nt(x);
        izq = L(Math.pow(x, n)); der = n * L(x);
      } else {
        if (!(n >= 2)) throw new Error('el \u00edndice de la ra\u00edz debe ser 2 o mayor.');
        txt = base + '\\sqrt[' + n + ']{' + nt(x) + '}=\\dfrac{' + base + nt(x) + '}{' + n + '}';
        izq = L(Math.pow(x, 1 / n)); der = L(x) / n;
      }
      h += step(key('Propiedad: ') + TD(txt));
      h += step('Miembro izquierdo: ' + chip(num(izq, 8)) + ' \u00b7 miembro derecho: ' + chip(num(der, 8)) + ' ' +
        (Math.abs(izq - der) < 1e-8 ? ok('coinciden') : bad('revisa los datos')));
      h += step(key('Por qu\u00e9 importa: ') + 'estas propiedades transforman ' + key('productos en sumas') +
        ' y ' + key('potencias en multiplicaciones') +
        '. Por eso se inventaron los logaritmos, para simplificar c\u00e1lculos antes de que existieran las calculadoras.');
      h += warnStep('Lo que ' + bad('no') + ' existe: ' + T('\\log(x+y)\\neq\\log x+\\log y') +
        '. La propiedad act\u00faa sobre el producto, no sobre la suma.');
      h += step(key('Ejercicio cl\u00e1sico: ') + 'sabiendo que ' + T('\\log 2=0{,}3010') + ', ' +
        T('\\log 3=0{,}4771') + ' y ' + T('\\log 7=0{,}8451') +
        ', calcula los logaritmos decimales de los diez primeros naturales. ' +
        note('Se obtienen todos salvo el de 1, que es cero, combinando estas tres propiedades.'));
      return h;
    });
  };

  RX.cambiobase = function (root) {
    var out = shell(root, 'Applet \u00b7 Cambio de base', [
      'La calculadora solo trae $\\log$ y $\\ln$. Para cualquier otra base se usa $\\log_{a}b=\\dfrac{\\log_{c}b}{\\log_{c}a}$.',
      'Ejemplo del libro: $\\log_{3}100=\\dfrac{\\log 100}{\\log 3}=\\dfrac{2}{\\log 3}$.',
      'Comprueba el resultado elevando la base al valor obtenido: debe devolverte el argumento.',
      'Curiosidad para el aula: $\\log_{a}b\\cdot\\log_{b}a=1$. Compru\u00e9balo intercambiando base y argumento.'
    ],
      '<div class="ap-row">' + mini('a', 'base a', 3, 0.1) + mini('b', 'argumento b', 100, 0.1) +
      sel('c', 'base auxiliar', [['10', 'decimal, log'], ['e', 'neperiana, ln']], '10') + '</div>');

    live(root, out, function () {
      var a = nv(root, 'a'), b = nv(root, 'b'), c = val(root, 'c');
      if (!(a > 0) || Math.abs(a - 1) < 1e-9) throw new Error('la base debe cumplir $a>0$ y $a\\neq1$.');
      if (!(b > 0)) throw new Error('el argumento debe ser positivo.');
      var f = c === '10' ? Math.log10 : Math.log, nom = c === '10' ? '\\log' : '\\ln';
      var res = f(b) / f(a);
      var h = step(key('F\u00f3rmula: ') +
        TD('\\log_{' + nt(a) + '}' + nt(b) + '=\\dfrac{' + nom + nt(b) + '}{' + nom + nt(a) + '}'));
      h += step('Sustituyendo: ' + T('\\dfrac{' + nt(f(b), 6) + '}{' + nt(f(a), 6) + '}=' + nt(res, 6)));
      h += step(key('Comprobaci\u00f3n: ') + T(nt(a) + '^{' + nt(res, 4) + '}=' + nt(Math.pow(a, res), 5)) +
        ' ' + ok('(vuelve al argumento)'));
      var inv = f(a) / f(b);
      h += step(key('Curiosidad: ') + T('\\log_{' + nt(a) + '}' + nt(b) + '\\cdot\\log_{' + nt(b) + '}' + nt(a) +
        '=' + nt(res, 4) + '\\cdot' + nt(inv, 4) + '=' + nt(res * inv, 6)) + ' ' + ok('(vale 1)'));
      h += step(note('El resultado no depende de la base auxiliar elegida: prueba a cambiar de decimal a neperiana y compara.'));
      return h;
    });
  };

  RX.neperiano = function (root) {
    var out = shell(root, 'Applet \u00b7 Logaritmo neperiano y el n\u00famero e', [
      'El logaritmo neperiano o natural es el de base $e\\approx2{,}718281828$, y se escribe $\\ln$. Cumple exactamente las mismas propiedades que el decimal.',
      'Propiedades clave: $\\ln e=1$, $\\ln 1=0$ y $\\ln e^{n}=n$, porque $\\ln$ y $e^{x}$ son funciones inversas.',
      'Relaci\u00f3n con el decimal: $\\ln x=\\log x\\cdot\\ln 10\\approx\\log x\\cdot 2{,}3026$.',
      'El n\u00famero $e$ aparece en el crecimiento continuo: poblaciones, inter\u00e9s compuesto continuo, desintegraci\u00f3n radiactiva.'
    ],
      '<div class="ap-row">' + mini('x', 'x', 7, 0.1) + '</div>' +
      '<div class="ap-row">' + mini('p0', 'poblaci\u00f3n inicial', 1000) + mini('r', 'tasa continua', 0.03, 0.01) +
      mini('t', 'tiempo', 10) + '</div>');

    live(root, out, function () {
      var x = nv(root, 'x'), p0 = nv(root, 'p0'), r = nv(root, 'r'), t = nv(root, 't');
      if (!(x > 0)) throw new Error('el argumento debe ser positivo.');
      var h = step(key('Valores: ') + T('\\ln ' + nt(x) + '=' + nt(Math.log(x), 6)) + ' \u00b7 ' +
        T('\\log ' + nt(x) + '=' + nt(Math.log10(x), 6)));
      h += step('Relaci\u00f3n entre los dos: ' +
        T('\\ln ' + nt(x) + '=\\log ' + nt(x) + '\\cdot\\ln 10=' + nt(Math.log10(x), 5) + '\\cdot' +
          nt(Math.LN10, 5) + '=' + nt(Math.log10(x) * Math.LN10, 6)) + ' ' + ok('(coincide)'));
      h += step(key('Casos inmediatos: ') + T('\\ln e=1') + ', ' + T('\\ln 1=0') + ', ' +
        T('\\ln e^{3}=3') + ', ' + T('\\ln\\sqrt{e}=\\tfrac{1}{2}') + '.');
      var P2 = p0 * Math.exp(r * t);
      h += step(key('Modelo de crecimiento continuo: ') +
        T('P=P_{0}e^{rt}=' + nt(p0) + 'e^{' + nt(r) + '\\cdot' + nt(t) + '}=' + nt(P2, 2)));
      if (r !== 0) {
        h += step('Tiempo de duplicaci\u00f3n: ' + T('t=\\dfrac{\\ln 2}{r}=' + nt(Math.log(2) / r, 4)) +
          ' ' + note('el logaritmo es la herramienta que baja el tiempo del exponente'));
      } else {
        h += step(note('Con tasa cero no hay crecimiento, luego no existe tiempo de duplicaci\u00f3n.'));
      }
      h += step(key('Truco para n\u00fameros gigantes: ') + T('26^{378}') +
        ' desborda la calculadora, pero tomando logaritmos ' + T('\\log x=378\\log 26\\approx 534{,}86') +
        ', luego ' + T('26^{378}\\approx 7{,}24\\cdot10^{534}') + '.');
      return h;
    });
  };

  RX.escalalog = function (root) {
    var out = shell(root, 'Applet \u00b7 Escalas logar\u00edtmicas', [
      'Muchas magnitudes reales se miden con logaritmos, porque abarcan rangos enormes: acidez, terremotos y sonido.',
      'pH: $\\text{pH}=-\\log[\\text{H}^{+}]$. Richter: $M=\\log\\dfrac{A}{A_{0}}$. Decibelios: $\\text{dB}=10\\log\\dfrac{I}{I_{0}}$.',
      'La idea clave: <b>una unidad m\u00e1s significa diez veces m\u00e1s</b>. Un terremoto de magnitud 6 tiene una amplitud diez veces mayor que uno de 5.',
      'Mueve el valor y observa cu\u00e1nto cambia la magnitud f\u00edsica. Es la mejor manera de entender por qu\u00e9 la escala no es lineal.'
    ],
      '<div class="ap-row">' + sel('t', 'escala', [['ph', 'pH'], ['ric', 'Richter'], ['db', 'decibelios']], 'ric') +
      mini('v', 'valor de la escala', 6, 0.1) + mini('w', 'segundo valor', 5, 0.1) + '</div>');

    live(root, out, function () {
      var t = val(root, 't'), v = nv(root, 'v'), w = nv(root, 'w');
      if (!isFinite(v) || !isFinite(w)) throw new Error('escribe dos valores num\u00e9ricos.');
      var h = '', d = Math.abs(v - w);
      if (t === 'ph') {
        h += step(key('pH: ') + T('\\text{pH}=-\\log\\left[\\text{H}^{+}\\right]') + ', luego ' +
          T('\\left[\\text{H}^{+}\\right]=10^{-\\text{pH}}'));
        var c1 = P.toSci(String(Math.pow(10, -v))), c2 = P.toSci(String(Math.pow(10, -w)));
        h += step('Con pH ' + num(v) + ': concentraci\u00f3n ' + T(P.sciTex(c1.m, c1.e, 3) + '\\ \\text{mol/L}'));
        h += step('Con pH ' + num(w) + ': concentraci\u00f3n ' + T(P.sciTex(c2.m, c2.e, 3) + '\\ \\text{mol/L}'));
        h += step(key('Comparaci\u00f3n: ') + 'la disoluci\u00f3n de pH ' + num(Math.min(v, w)) + ' es ' +
          chip(num(Math.pow(10, d), 3) + ' veces') + ' m\u00e1s \u00e1cida.');
      } else if (t === 'ric') {
        h += step(key('Richter: ') + T('M=\\log\\dfrac{A}{A_{0}}') + ', luego ' + T('\\dfrac{A}{A_{0}}=10^{M}'));
        h += step('Magnitud ' + num(v) + ': amplitud relativa ' + chip(num(Math.pow(10, v), 0)));
        h += step('Magnitud ' + num(w) + ': amplitud relativa ' + chip(num(Math.pow(10, w), 0)));
        h += step(key('Comparaci\u00f3n: ') + 'el de magnitud ' + num(Math.max(v, w)) + ' tiene una amplitud ' +
          chip(num(Math.pow(10, d), 3) + ' veces') + ' mayor.');
        h += step(note('En energ\u00eda la diferencia es a\u00fan mayor: cada unidad de magnitud multiplica la energ\u00eda liberada por unas 32 veces.'));
      } else {
        h += step(key('Decibelios: ') + T('\\text{dB}=10\\log\\dfrac{I}{I_{0}}') + ', luego ' +
          T('\\dfrac{I}{I_{0}}=10^{\\text{dB}/10}'));
        h += step(num(v) + ' dB: intensidad relativa ' + chip(num(Math.pow(10, v / 10), 2)));
        h += step(num(w) + ' dB: intensidad relativa ' + chip(num(Math.pow(10, w / 10), 2)));
        h += step(key('Comparaci\u00f3n: ') + 'la diferencia de ' + num(d) +
          ' dB equivale a multiplicar la intensidad por ' + chip(num(Math.pow(10, d / 10), 3)) + '. ' +
          note('Diez decibelios m\u00e1s es diez veces m\u00e1s intensidad.'));
      }
      h += step(key('Por qu\u00e9 se usan logaritmos: ') +
        'porque comprimen escalas enormes en n\u00fameros manejables. Comparar ' + T('10^{-14}') + ' con ' +
        T('10^{-1}') + ' es inc\u00f3modo; comparar pH 14 con pH 1 es inmediato.');
      return h;
    });
  };

  /* =================================================================
     3. ARRANQUE
     ================================================================= */

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-applet-rex]'), function (node) {
      var k = node.getAttribute('data-applet-rex');
      if (typeof RX[k] === 'function') {
        try { RX[k](node); }
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

  window.REALX = { applets: RX, extract: extract, simplify: simplify, radTex: radTex };
})();
