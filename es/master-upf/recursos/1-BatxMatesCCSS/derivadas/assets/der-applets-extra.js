/* =====================================================================
   der-applets-extra.js — DERIVADA DE UNA FUNCION · 1r Batx Mates CCSS
   MOTOR 2. Apartados 4 a 7: funcion derivada, derivadas elementales,
   producto y cociente, y regla de la cadena.

   UBICACION
     es/master-upf/recursos/1-BatxMatesCCSS/derivadas/assets/der-applets-extra.js

   DEPENDENCIA CRITICA
     Se carga DESPUES de der-applets.js y reutiliza su nucleo mediante
     window.DER.core. No duplica el analizador, ni el derivador simbolico,
     ni el generador de figuras: todo viene de ahi.

   ATRIBUTO DE INSERCION, el mismo del tema
     <div data-applet-der="clave"></div>

   CONVENIO DE COMPOSICION, heredado
     lineT() para rectas, en la forma canonica y=mx+n.
     tex()   para expresiones, conservando el orden de los terminos.
   ===================================================================== */

(function () {
  'use strict';

  if (!window.DER || !window.DER.core) {
    console.warn('[derivadas] der-applets-extra.js no encuentra window.DER.core. ' +
      'Revisa el orden de carga en assets/_scripts.html: der-applets.js va primero.');
    return;
  }

  var C = window.DER.core;
  var reg = window.DER.reg;

  /* atajos, para no escribir C. delante de todo */
  var T = C.T, TD = C.TD, qt = C.qt, nt = C.nt, num = C.num, par = C.par;
  var coefV = C.coefV, lineT = C.lineT, nz = C.nz;
  var parse = C.parse, D = C.D, simpN = C.simpN, tex = C.tex, ev = C.ev, subst = C.subst;
  var N = C.N, XV = C.XV, add = C.add, mul = C.mul, dv = C.dv, pw = C.pw, fnode = C.fnode;
  var readF = C.readF, fnOf = C.fnOf, dnum = C.dnum;
  var plot = C.plot, tbl = C.tbl;
  var shell = C.shell, live = C.live, readS = C.readS, readN = C.readN;
  var rowText = C.rowText, mini = C.mini, sel = C.sel, row = C.row, rng = C.rng;
  var step = C.step, warnStep = C.warnStep, errBox = C.errBox;
  var key = C.key, ok = C.ok, bad = C.bad, note = C.note, chip = C.chip;
  var SINTAXIS = C.SINTAXIS;

  /* Sustituye la variable por (x+h) SOLO para mostrarlo. El nucleo maneja
     una sola variable, y en la salida LaTeX la unica letra x que aparece
     es la variable, de modo que el reemplazo textual es seguro. */
  function conMasH(txt) {
    return String(txt).replace(/x/g, '\\left(x+h\\right)');
  }

  /* Compara la derivada que escribe el alumno con la verdadera, en varios
     puntos. Devuelve {bien, detalle}. Mucho mas robusto que comparar textos. */
  function comparaEn(astAlumno, dfReal, puntos) {
    var fA = fnOf(astAlumno), i, x, va, vr, filas = [], fallos = 0;
    for (i = 0; i < puntos.length; i++) {
      x = puntos[i];
      va = fA(x); vr = dfReal(x);
      if (!isFinite(va) || !isFinite(vr)) continue;
      var difiere = Math.abs(va - vr) > 1e-6 * (1 + Math.abs(vr));
      if (difiere) fallos++;
      filas.push([T('x=' + nt(x)), T(nt(va, 6)), T(nt(vr, 6)),
        difiere ? bad('no') : ok('si')]);
    }
    return { bien: fallos === 0 && filas.length > 0, filas: filas, fallos: fallos };
  }

  /* ===================================================================
     APARTADO 4 · FUNCION DERIVADA
     =================================================================== */

  /* ---------- Applet · De la derivada en un punto a la funcion derivada ---------- */

  reg('funcionderivada', function (node) {
    var out = shell(node, 'Applet \u00b7 De un punto a todos los puntos', [
      'Escribe una funci\u00f3n y el applet calcula su ' + key('funci\u00f3n derivada') +
      ', no solo el valor en un punto. Despu\u00e9s eval\u00faa ' + T("f'") + ' en varios puntos de golpe.',
      'Empieza con <code>2x^2</code>: sale ' + T("f'(x)=4x") + ', y por tanto ' + T("f'(1)=4") +
      ' y ' + T("f'(-4)=-16") + ' sin volver a tomar l\u00edmites.',
      'Prueba <code>1-3x^2</code>: sale ' + T("f'(x)=-6x") + '. Es el ejemplo 4 del libro.',
      'Prueba <code>sqrt(x)</code> y fíjate en el dominio: la funci\u00f3n existe en ' + T('x=0') +
      ' pero su derivada no. El dominio de ' + T("f'") + ' puede ser m\u00e1s peque\u00f1o que el de ' + T('f') + '.',
      'Cambia el paso de la tabla para explorar la zona que te interese.'
    ].concat(SINTAXIS),
      rowText('f', 'f(x) =', '2x^2') +
      row(mini('a', 'desde x =', -3, 0.5) + mini('p', 'paso', 1, 0.5) + mini('n', 'cu\u00e1ntos', 7, 1))
    );

    live(node, out, function () {
      var F = readF(node, 'f', '2x^2');
      var a = readN(node, 'a', -3), p = readN(node, 'p', 1);
      var n = Math.max(2, Math.min(20, Math.round(readN(node, 'n', 7))));
      if (Math.abs(p) < 1e-9) return errBox('el paso no puede ser cero.');

      var h = step('Funci\u00f3n: ' + TD('f(x)=' + F.tx));
      if (!F.dtx) return h + warnStep('No puedo derivar esta expresi\u00f3n con reglas: ' + (F.derr || ''));
      h += step(key('Funci\u00f3n derivada: ') + TD("f'(x)=" + F.dtx));
      h += step(note('La derivada conserva el orden de los t\u00e9rminos de ') + T('f') +
        note(': cada sumando de arriba tiene su derivada en la misma posici\u00f3n.'));

      var filas = [], i, x, fx, dx;
      for (i = 0; i < n; i++) {
        x = a + i * p;
        fx = F.f(x); dx = F.df(x);
        filas.push([T('x=' + nt(x)),
          isFinite(fx) ? T(nt(fx, 5)) : bad('no existe'),
          isFinite(dx) ? key(T(nt(dx, 5))) : bad('no existe'),
          !isFinite(dx) ? '\u2014' : (dx > 1e-9 ? ok('crece') : (dx < -1e-9 ? bad('decrece') : chip('tangente horizontal')))]);
      }
      h += tbl([T('Punto'), T('f(x)'), T("f'(x)"), 'Comportamiento'], filas);

      var huecos = filas.filter(function (r) { return r[2].indexOf('no existe') >= 0; }).length;
      if (huecos) {
        h += warnStep('Hay ' + huecos + ' punto(s) donde ' + T("f'") + ' no existe. ' +
          'Recuerda: ' + key('el dominio de la derivada puede ser m\u00e1s restrictivo') +
          ' que el de la funci\u00f3n. En ' + T('\\sqrt{x}') + ' la funci\u00f3n admite ' + T('x=0') +
          ' y la derivada exige ' + T('x>0') + '.');
      }

      var lo = a, hi = a + (n - 1) * p, sp = Math.abs(hi - lo) || 2;
      h += plot({
        h: 250, xmin: Math.min(lo, hi) - sp * 0.1, xmax: Math.max(lo, hi) + sp * 0.1,
        curves: [{ f: F.f, color: '#2563eb' }],
        caption: 'La funci\u00f3n ' + T('f') + ', en azul.'
      });
      h += plot({
        h: 250, xmin: Math.min(lo, hi) - sp * 0.1, xmax: Math.max(lo, hi) + sp * 0.1,
        curves: [{ f: F.df, color: '#059669' }],
        caption: 'Su funci\u00f3n derivada ' + T("f'") + ', en verde. Cada altura de aqu\u00ed es una pendiente de arriba.'
      });
      return h;
    });
  });

  /* ---------- Applet · La definicion con x generica ---------- */

  reg('defgeneral', function (node) {
    var out = shell(node, 'Applet \u00b7 La definici\u00f3n con ' + T('x') + ' gen\u00e9rica', [
      'Este applet monta el esquema de la definici\u00f3n sin fijar el punto. En lugar de ' +
      T('a') + ' deja la ' + T('x') + ' libre, que es lo que produce una ' + key('f\u00f3rmula') +
      ' en vez de un n\u00famero.',
      'Empieza con <code>x^2</code>: ver\u00e1s ' + T('f(x+h)=\\left(x+h\\right)^{2}') +
      ' y el resultado ' + T("f'(x)=2x") + '.',
      'Prueba <code>2x^3</code>, que es el ejemplo 6 del libro: sale ' + T("f'(x)=6x^{2}") + '.',
      'Prueba <code>sqrt(x)</code>: aqu\u00ed hay que multiplicar por el conjugado, y sale ' +
      T("f'(x)=\\dfrac{1}{2\\sqrt{x}}") + '.',
      'La tabla de comprobaci\u00f3n usa un ' + T('h') + ' muy peque\u00f1o en varios puntos, ' +
      'para que veas que la f\u00f3rmula funciona en todos a la vez y no solo en uno.'
    ].concat(SINTAXIS),
      rowText('f', 'f(x) =', 'x^2')
    );

    live(node, out, function () {
      var F = readF(node, 'f', 'x^2');
      var h = step(key('Paso 1. ') + 'La funci\u00f3n: ' + TD('f(x)=' + F.tx));
      h += step(key('Paso 2. ') + 'Sustituimos ' + T('x') + ' por ' + T('x+h') + ' en toda la expresi\u00f3n: ' +
        TD('f(x+h)=' + conMasH(F.tx)));
      h += step(key('Paso 3. ') + 'Restamos y dividimos entre ' + T('h') + ': ' +
        TD('\\dfrac{f(x+h)-f(x)}{h}=\\dfrac{' + conMasH(F.tx) + '-\\left(' + F.tx + '\\right)}{h}'));
      h += step(key('Paso 4. ') + 'Simplificamos hasta que desaparezca el ' + T('h') +
        ' del denominador y hacemos ' + T('h\\to 0') + '.');

      if (!F.dtx) return h + warnStep('No puedo completar el paso 4 con reglas para esta expresi\u00f3n: ' + (F.derr || ''));
      h += step(key('Resultado: ') + TD("f'(x)=" + F.dtx));

      var pts = [-2, -1, -0.5, 0.5, 1, 2, 3], filas = [], i, x, apr, exa;
      for (i = 0; i < pts.length; i++) {
        x = pts[i];
        apr = (F.f(x + 1e-6) - F.f(x - 1e-6)) / 2e-6;
        exa = F.df(x);
        if (!isFinite(apr) || !isFinite(exa)) {
          filas.push([T('x=' + nt(x)), bad('fuera del dominio'), bad('\u2014'), '\u2014']);
          continue;
        }
        filas.push([T('x=' + nt(x)), T(nt(apr, 6)), key(T(nt(exa, 6))),
          Math.abs(apr - exa) < 1e-4 * (1 + Math.abs(exa)) ? ok('coincide') : bad('difiere')]);
      }
      h += step('Comprobaci\u00f3n de la f\u00f3rmula en varios puntos a la vez:');
      h += tbl([T('Punto'), 'Cociente con ' + T('h=10^{-6}'), T("f'(x)") + ' con la f\u00f3rmula', ''], filas);
      h += step(note('Una sola f\u00f3rmula sirve para todos los puntos. Eso es lo que ahorra la funci\u00f3n derivada: ') +
        'nunca m\u00e1s hay que tomar l\u00edmites para esta funci\u00f3n.');
      return h;
    });
  });

  /* ---------- Applet · Derivadas sucesivas ---------- */

  reg('sucesivas', function (node) {
    var out = shell(node, 'Applet \u00b7 Derivadas sucesivas', [
      'Deriva una y otra vez. La segunda derivada mide c\u00f3mo cambia la pendiente; la tercera, c\u00f3mo cambia esa variaci\u00f3n.',
      'Empieza con <code>x^3</code>: sale ' + T('3x^{2}') + ', ' + T('6x') + ', ' + T('6') +
      ' y luego ' + T('0') + '. Un polinomio de grado ' + T('n') + ' se anula al derivar ' + T('n+1') + ' veces.',
      'Prueba <code>x^4</code>, <code>sqrt(x)</code> y <code>1/x</code>: en los dos \u00faltimos las derivadas ' +
      'no se acaban nunca, solo cambian de exponente.',
      'Prueba <code>exp(x)</code>: es la \u00fanica funci\u00f3n que se queda igual al derivar, ' +
      'por eso es tan importante en matem\u00e1ticas financieras.',
      'Prueba <code>sin(x)</code>: las derivadas se repiten con periodo cuatro.'
    ].concat(SINTAXIS),
      rowText('f', 'f(x) =', 'x^3') +
      row(mini('a', 'evaluar en x =', 2, 0.5) + mini('k', 'cu\u00e1ntas derivadas', 4, 1))
    );

    live(node, out, function () {
      var F = readF(node, 'f', 'x^3');
      var a = readN(node, 'a', 2);
      var k = Math.max(1, Math.min(6, Math.round(readN(node, 'k', 4))));

      var h = step('Funci\u00f3n de partida: ' + TD('f(x)=' + F.tx));
      var cur = F.ast, filas = [], i, nombres = ["f'", "f''", "f'''", "f^{(4)}", "f^{(5)}", "f^{(6)}"];
      var nula = 0;
      for (i = 0; i < k; i++) {
        try { cur = simpN(D(cur)); } catch (e) {
          filas.push([T(nombres[i] + '(x)'), bad('no derivable: ' + e.message), '\u2014']);
          break;
        }
        var txi = tex(cur), vi = ev(cur, a);
        if (Math.abs(vi) < 1e-12 && txi === '0' && !nula) nula = i + 1;
        filas.push([T(nombres[i] + '(x)'), TD(txi).replace(/\$\$/g, '$'),
          isFinite(vi) ? T(nt(vi, 5)) : bad('no existe')]);
      }
      h += tbl(['Derivada', 'Expresi\u00f3n', 'Valor en ' + T('x=' + qt(a))], filas);

      if (nula) {
        h += step(ok('La derivada de orden ' + nula + ' es id\u00e9nticamente cero.') +
          ' Eso identifica un polinomio de grado ' + (nula - 1) + ': cada derivada baja el grado en una unidad, ' +
          'y al llegar a la constante la siguiente se anula.');
      } else {
        h += step(note('Las derivadas no se agotan. ') +
          'En potencias negativas o fraccionarias, y en exponenciales, logaritmos y funciones trigonom\u00e9tricas, ' +
          'se puede derivar indefinidamente.');
      }

      h += step(key('Para qu\u00e9 sirve la segunda derivada. ') +
        'Si ' + T("f'") + ' dice si la funci\u00f3n sube o baja, ' + T("f''") +
        ' dice si esa subida se est\u00e1 acelerando o frenando. En el pr\u00f3ximo tema ser\u00e1 la herramienta ' +
        'para distinguir m\u00e1ximos de m\u00ednimos y para hablar de concavidad.');

      var sp = Math.max(2, Math.abs(a) * 1.5);
      var d1 = null, d2 = null;
      try { d1 = simpN(D(F.ast)); d2 = simpN(D(d1)); } catch (e) { }
      var curvas = [{ f: F.f, color: '#2563eb' }];
      if (d1) curvas.push({ f: fnOf(d1), color: '#059669' });
      if (d2) curvas.push({ f: fnOf(d2), color: '#b45309', dash: '5 4' });
      h += plot({
        xmin: a - sp, xmax: a + sp, curves: curvas,
        caption: 'Azul ' + T('f') + ', verde ' + T("f'") + ', naranja discontinuo ' + T("f''") + '.'
      });
      return h;
    });
  });

  /* ---------- Applet · Suma y producto por un numero ---------- */

  reg('reglassuma', function (node) {
    var out = shell(node, 'Applet \u00b7 Suma de funciones y producto por un n\u00famero', [
      'Las dos primeras reglas, y las m\u00e1s f\u00e1ciles: la derivada de una suma es la suma de las derivadas, ' +
      'y una constante que multiplica se queda tal cual.',
      'Empieza con ' + T('k_{1}=1') + ', <code>x^2</code>, ' + T('k_{2}=1') + ', <code>x</code>: ' +
      'es el ejemplo 5 del libro y sale ' + T("h'(x)=2x+1") + '.',
      'Prueba ' + T('k_{1}=2') + ' con <code>x^3</code> y ' + T('k_{2}=0') + ': sale ' + T('6x^{2}') + '.',
      'Prueba ' + T('k_{1}=3') + ' con <code>x^4</code> y ' + T('k_{2}=-5') + ' con <code>x^2</code>, ' +
      'y comprueba que puedes derivar cada trozo por separado.',
      'Pregunta importante: ¿funciona lo mismo con un producto? Es decir, ¿es ' +
      T("(f\\cdot g)'=f'\\cdot g'") + '? Lo veremos en el apartado 6, y la respuesta es que no.'
    ].concat(SINTAXIS),
      row(mini('k1', 'k\u2081', 1, 1)) + rowText('f1', 'primera funci\u00f3n', 'x^2') +
      row(mini('k2', 'k\u2082', 1, 1)) + rowText('f2', 'segunda funci\u00f3n', 'x') +
      row(mini('a', 'evaluar en x =', 2, 0.5))
    );

    live(node, out, function () {
      var k1 = readN(node, 'k1', 1), k2 = readN(node, 'k2', 1), a = readN(node, 'a', 2);
      var A = readF(node, 'f1', 'x^2'), B = readF(node, 'f2', 'x');
      if (!A.dast || !B.dast) return errBox('alguna de las dos funciones no se puede derivar con reglas.');

      var H = simpN(add(mul(N(k1), A.ast), mul(N(k2), B.ast)));
      var DH = simpN(D(H));
      var hf = fnOf(H), dhf = fnOf(DH);

      var h = step('Funci\u00f3n compuesta por suma: ' + TD('h(x)=' + tex(H)));
      h += step(key('Paso 1. ') + 'Derivamos cada sumando por separado: ' +
        TD("\\left(" + A.tx + "\\right)'=" + A.dtx) +
        TD("\\left(" + B.tx + "\\right)'=" + B.dtx));
      h += step(key('Paso 2. ') + 'Los n\u00fameros que multiplican se conservan: ' +
        TD("h'(x)=" + par(k1) + '\\cdot\\left(' + A.dtx + '\\right)' +
        (k2 < 0 ? '' : '+') + par(k2) + '\\cdot\\left(' + B.dtx + '\\right)'));
      h += step(key('Resultado simplificado: ') + TD("h'(x)=" + tex(DH)));
      h += step('Valores en ' + T('x=' + qt(a)) + ': ' + T('h(' + par(a) + ')=' + nt(hf(a), 5)) +
        ' y ' + T("h'(" + par(a) + ')=' + nt(dhf(a), 5)) + '.');

      h += step(note('Las dos reglas en símbolos: ') +
        TD("\\left[f(x)+g(x)\\right]'=f'(x)+g'(x)\\qquad\\left[k\\cdot f(x)\\right]'=k\\cdot f'(x)"));
      h += step(note('De la segunda se deduce la de la resta, porque restar es sumar multiplicado por ') +
        T('-1') + note('.'));
      return h;
    });
  });

  /* ===================================================================
     APARTADO 5 · DERIVADAS DE FUNCIONES ELEMENTALES
     =================================================================== */

  var TABLA = [
    { n: 'Constante', f: 'k', d: '0', ej: 'f(x)=-2\\ \\Rightarrow\\ f\'(x)=0', pr: 'La gr\u00e1fica es horizontal: su pendiente es cero en todos los puntos.' },
    { n: 'Identidad', f: 'x', d: '1', ej: 'f(x)=x\\ \\Rightarrow\\ f\'(x)=1', pr: 'La recta ' + T('y=x') + ' tiene pendiente 1 en todos los puntos.' },
    { n: 'Potencial', f: 'x^{n}', d: 'n\\,x^{n-1}', ej: 'f(x)=x^{5}\\ \\Rightarrow\\ f\'(x)=5x^{4}', pr: 'El exponente baja a multiplicar y se reduce en una unidad. Vale para ' + T('n') + ' entero, negativo o fraccionario.' },
    { n: 'Ra\u00edz cuadrada', f: '\\sqrt{x}', d: '\\dfrac{1}{2\\sqrt{x}}', ej: 'f(9)\'=\\dfrac{1}{6}', pr: 'Es el caso ' + T('n=\\tfrac{1}{2}') + ' de la potencial. Ojo: exige ' + T('x>0') + '.' },
    { n: 'Rec\u00edproca', f: '\\dfrac{1}{x}', d: '-\\dfrac{1}{x^{2}}', ej: 'f(2)\'=-\\dfrac{1}{4}', pr: 'Es el caso ' + T('n=-1') + '. Siempre negativa: la funci\u00f3n decrece en cada rama.' },
    { n: 'Exponencial de base a', f: 'a^{x}', d: 'a^{x}\\ln a', ej: 'f(x)=5^{x}\\ \\Rightarrow\\ f\'(x)=5^{x}\\ln 5', pr: 'Aparece un ' + T('\\ln a') + ' que muchos alumnos olvidan.' },
    { n: 'Exponencial natural', f: 'e^{x}', d: 'e^{x}', ej: 'f\'(0)=1', pr: 'La \u00fanica que no cambia al derivar, porque ' + '\\ln e=1' + '.' },
    { n: 'Logaritmo de base a', f: '\\log_{a}x', d: '\\dfrac{1}{x\\ln a}', ej: 'f(x)=\\log_{8}x\\ \\Rightarrow\\ f\'(x)=\\dfrac{1}{x\\ln 8}', pr: 'El ' + T('\\ln a') + ' est\u00e1 en el denominador, no multiplicando.' },
    { n: 'Logaritmo neperiano', f: '\\ln x', d: '\\dfrac{1}{x}', ej: 'f\'(1)=1', pr: 'Caso ' + T('a=e') + '. La derivada m\u00e1s sencilla de todas las logar\u00edtmicas.' },
    { n: 'Seno', f: '\\sin x', d: '\\cos x', ej: 'f\'(0)=1', pr: 'Derivar desplaza la gr\u00e1fica un cuarto de periodo.' },
    { n: 'Coseno', f: '\\cos x', d: '-\\sin x', ej: 'f\'(0)=0', pr: 'Aqu\u00ed aparece el signo menos. Es el error m\u00e1s repetido de las trigonom\u00e9tricas.' },
    { n: 'Tangente', f: '\\tan x', d: '\\dfrac{1}{\\cos^{2}x}=1+\\tan^{2}x', ej: 'f\'(0)=1', pr: 'Las dos formas son equivalentes; usa la que te convenga.' },
    { n: 'Arco seno', f: '\\arcsin x', d: '\\dfrac{1}{\\sqrt{1-x^{2}}}', ej: 'f\'(0)=1', pr: 'Solo definida para ' + T('-1<x<1') + '.' },
    { n: 'Arco coseno', f: '\\arccos x', d: '-\\dfrac{1}{\\sqrt{1-x^{2}}}', ej: 'f\'(0)=-1', pr: 'La opuesta de la anterior.' },
    { n: 'Arco tangente', f: '\\arctan x', d: '\\dfrac{1}{1+x^{2}}', ej: 'f\'(0)=1', pr: 'Definida en todo ' + '\\mathbb{R}' + ', y siempre positiva.' }
  ];

  /* ---------- Applet · Tabla de derivadas elementales ---------- */

  reg('tabla', function (node) {
    var opciones = TABLA.map(function (r, i) { return [String(i), r.n]; });
    var out = shell(node, 'Applet \u00b7 Tabla de derivadas elementales', [
      'La tabla completa, siempre visible. Elige una familia en el desplegable y abajo aparece su explicaci\u00f3n y su comprobaci\u00f3n num\u00e9rica.',
      'No hay atajo: estas quince reglas hay que sab\u00e9rselas. Pero s\u00ed hay orden, ' +
      'porque la ra\u00edz y la rec\u00edproca son casos particulares de la potencial.',
      'La fila elegida aparece resaltada. Cambia el punto de comprobaci\u00f3n para ver ' +
      'd\u00f3nde cada regla se rompe por dominio.',
      'Empieza por la ' + key('Potencial') + ': es la que m\u00e1s se usa y de la que salen otras dos.'
    ],
      row(sel('k', 'familia', opciones, '2') + mini('x', 'comprobar en x =', 2, 0.5))
    );

    live(node, out, function () {
      var k = Math.max(0, Math.min(TABLA.length - 1, Math.round(readN(node, 'k', 2))));
      var x = readN(node, 'x', 2);

      var filas = TABLA.map(function (r, i) {
        return { mark: i === k, c: [r.n, T(r.f), T(r.d)] };
      });
      var h = tbl(['Familia', T('f(x)'), T("f'(x)")], filas);

      var R = TABLA[k];
      h += step(key('Familia elegida: ') + R.n + '. ' + TD('f(x)=' + R.f + '\\qquad f\'(x)=' + R.d));
      h += step(note(R.pr));
      h += step('Ejemplo: ' + TD(R.ej));

      /* comprobacion numerica cuando la familia se puede escribir en el parser */
      var src = { 0: '5', 1: 'x', 2: 'x^5', 3: 'sqrt(x)', 4: '1/x', 5: '5^x', 6: 'exp(x)',
        7: 'log(x)', 8: 'ln(x)', 9: 'sin(x)', 10: 'cos(x)', 11: 'tan(x)',
        12: 'asin(x)', 13: 'acos(x)', 14: 'atan(x)' }[k];
      if (src) {
        try {
          var A = simpN(parse(src)), DA = simpN(D(A));
          var exa = ev(DA, x), apr = (ev(A, x + 1e-6) - ev(A, x - 1e-6)) / 2e-6;
          if (!isFinite(exa) || !isFinite(apr)) {
            h += warnStep('En ' + T('x=' + qt(x)) + ' esta funci\u00f3n o su derivada no est\u00e1n definidas. ' +
              'Cambia el punto de comprobaci\u00f3n: no todas las familias admiten cualquier valor.');
          } else {
            h += step('Comprobaci\u00f3n con <code>' + src + '</code> en ' + T('x=' + qt(x)) + ': ' +
              'la regla da ' + key(T(nt(exa, 6))) + ' y el c\u00e1lculo num\u00e9rico ' + T(nt(apr, 6)) + '. ' +
              (Math.abs(exa - apr) < 1e-4 * (1 + Math.abs(exa)) ? ok('Coinciden.') : bad('No coinciden.')));
            h += plot({
              h: 240, xmin: x - 3, xmax: x + 3,
              curves: [{ f: fnOf(A), color: '#2563eb' }, { f: fnOf(DA), color: '#059669' }],
              pts: [{ x: x, y: ev(A, x), color: '#dc2626' }],
              caption: 'Azul la funci\u00f3n, verde su derivada, punto rojo el valor comprobado.'
            });
          }
        } catch (e) {
          h += warnStep('El parser no admite esta familia directamente: ' + e.message);
        }
      }
      return h;
    });
  });

  /* ---------- Applet · Regla de la potencia ---------- */

  reg('potencial', function (node) {
    var out = shell(node, 'Applet \u00b7 Regla de la potencia', [
      'La regla ' + T("\\left(x^{n}\\right)'=n\\,x^{n-1}") + ' vale para cualquier exponente: ' +
      'entero, negativo o fraccionario. Este applet lo demuestra caso por caso.',
      'Pon ' + T('n=2') + ': sale ' + T('2x') + '. Pon ' + T('n=5') + ': sale ' + T('5x^{4}') + '.',
      'Pon ' + T('n=-2') + ', que es ' + T('\\dfrac{1}{x^{2}}') + ': sale ' + T('-2x^{-3}=-\\dfrac{2}{x^{3}}') +
      '. Ese es el ejemplo 8b del libro.',
      'Pon ' + T('n=0{,}5') + ', que es ' + T('\\sqrt{x}') + ': sale ' + T('\\dfrac{1}{2\\sqrt{x}}') + '.',
      'Pon ' + T('n=0') + ': la funci\u00f3n es la constante ' + T('1') + ' y la derivada, cero. ' +
      'La regla lo predice sola.',
      'El truco de examen es siempre el mismo: ' + key('reescribir la funci\u00f3n como potencia') +
      ' antes de derivar. Ni las ra\u00edces ni las fracciones necesitan regla propia.'
    ],
      row(mini('n', 'exponente n', 2, 0.5) + mini('x', 'evaluar en x =', 3, 0.5))
    );

    live(node, out, function () {
      var n = readN(node, 'n', 2), x = readN(node, 'x', 3);
      var f = function (t) { return Math.pow(t, n); };
      var df = function (t) { return n * Math.pow(t, n - 1); };

      var h = step('Funci\u00f3n: ' + TD('f(x)=x^{' + qt(n) + '}'));
      var reesc = '';
      if (n === 0.5) reesc = 'x^{1/2}=\\sqrt{x}';
      else if (n === -1) reesc = 'x^{-1}=\\dfrac{1}{x}';
      else if (n < 0 && Number.isInteger(n)) reesc = 'x^{' + qt(n) + '}=\\dfrac{1}{x^{' + qt(-n) + '}}';
      else if (n === 1 / 3) reesc = 'x^{1/3}=\\sqrt[3]{x}';
      if (reesc) h += step(note('Escrita de otra forma: ') + T(reesc));

      h += step(key('Aplicamos la regla. ') + 'El exponente baja a multiplicar y se reduce en una unidad: ' +
        TD("f'(x)=" + qt(n) + 'x^{' + qt(n) + '-1}=' + (nz(n) === 0 ? '0' : coefV(n, 'x^{' + qt(n - 1) + '}'))));

      var fx = f(x), dx = df(x);
      h += step('En ' + T('x=' + qt(x)) + ': ' + T('f(' + par(x) + ')=' + nt(fx, 6)) + ' y ' +
        T("f'(" + par(x) + ')=' + nt(dx, 6)) + '.');

      if (!isFinite(fx) || !isFinite(dx)) {
        h += warnStep('En ' + T('x=' + qt(x)) + ' no hay valor. Con exponente negativo la funci\u00f3n ' +
          'no admite ' + T('x=0') + '; con exponente fraccionario de denominador par, no admite ' + T('x<0') + '.');
      }

      var filas = [-2, -1, -0.5, 0.5, 1, 2, 3, 4].map(function (m) {
        return { mark: Math.abs(m - n) < 1e-9,
          c: [T('x^{' + qt(m) + '}'), T(m === 0 ? '0' : coefV(m, 'x^{' + qt(m - 1) + '}')),
            T(nt(m * Math.pow(x, m - 1), 5))] };
      });
      h += step('La misma regla para varios exponentes, evaluada en ' + T('x=' + qt(x)) + ':');
      h += tbl([T('f(x)'), T("f'(x)"), T("f'(" + qt(x) + ')')], filas);

      var lo = n < 0 || n % 1 !== 0 ? 0.2 : -3;
      h += plot({
        xmin: lo, xmax: Math.max(4, x + 1),
        curves: [{ f: f, color: '#2563eb' }, { f: df, color: '#059669' }],
        pts: [{ x: x, y: fx, color: '#dc2626' }],
        caption: 'Azul ' + T('x^{' + qt(n) + '}') + ', verde su derivada.'
      });
      return h;
    });
  });

  /* ---------- Applet · Exponenciales y logaritmos ---------- */

  reg('exponlog', function (node) {
    var out = shell(node, 'Applet \u00b7 Exponenciales y logaritmos', [
      'Las dos reglas que m\u00e1s se olvidan, porque llevan un ' + T('\\ln a') +
      ' que no aparece en ninguna otra parte.',
      TD("\\left(a^{x}\\right)'=a^{x}\\ln a\\qquad\\left(\\log_{a}x\\right)'=\\dfrac{1}{x\\ln a}"),
      'Pon ' + T('a=5') + ': la derivada de ' + T('5^{x}') + ' es ' + T('5^{x}\\ln 5') + '.',
      'Pon ' + T('a=8') + ' y mira la fila del logaritmo: sale ' + T('\\dfrac{1}{x\\ln 8}') + '.',
      'Pon ' + T('a=2{,}71828') + ', pr\u00e1cticamente el n\u00famero ' + T('e') + ': el ' + T('\\ln a') +
      ' vale casi ' + T('1') + ' y las dos reglas se simplifican. Esa es toda la magia de ' + T('e') + '.',
      'Fíjate en d\u00f3nde va el ' + T('\\ln a') + ': ' + key('multiplicando') + ' en la exponencial, ' +
      key('dividiendo') + ' en el logaritmo.'
    ],
      row(mini('a', 'base a', 5, 0.5) + mini('x', 'evaluar en x =', 2, 0.5))
    );

    live(node, out, function () {
      var a = readN(node, 'a', 5), x = readN(node, 'x', 2);
      if (a <= 0) return errBox('la base de una exponencial o de un logaritmo debe ser positiva.');
      if (Math.abs(a - 1) < 1e-9) return errBox('la base no puede ser 1: el logaritmo no existir\u00eda y la exponencial ser\u00eda constante.');

      var lna = Math.log(a);
      var h = step('Base elegida: ' + T('a=' + nt(a)) + ', con ' + T('\\ln a=' + nt(lna, 6)) + '.');

      h += step(key('Exponencial. ') + TD("f(x)=" + nt(a) + "^{x}\\ \\Rightarrow\\ f'(x)=" +
        nt(a) + "^{x}\\cdot\\ln " + nt(a)));
      h += step('En ' + T('x=' + qt(x)) + ': ' + T(nt(a) + '^{' + qt(x) + '}=' + nt(Math.pow(a, x), 5)) +
        ' y la derivada vale ' + key(T(nt(Math.pow(a, x) * lna, 5))) + '.');

      h += step(key('Logar\u00edtmica. ') + TD("g(x)=\\log_{" + nt(a) + "}x\\ \\Rightarrow\\ g'(x)=" +
        "\\dfrac{1}{x\\ln " + nt(a) + "}"));
      if (x > 0) {
        h += step('En ' + T('x=' + qt(x)) + ': la derivada vale ' + key(T(nt(1 / (x * lna), 6))) + '.');
      } else {
        h += warnStep('El logaritmo solo existe para ' + T('x>0') + '. Cambia el punto de evaluaci\u00f3n.');
      }

      if (Math.abs(lna - 1) < 0.01) {
        h += step(ok('Con esta base, ') + T('\\ln a\\approx 1') + ok(', y las dos f\u00f3rmulas se quedan limpias: ') +
          T("\\left(e^{x}\\right)'=e^{x}") + ' y ' + T("\\left(\\ln x\\right)'=\\dfrac{1}{x}") +
          '. Por eso ' + T('e') + ' es la base natural.');
      }

      var filas = [2, 3, 10, Math.E].map(function (b) {
        return { mark: Math.abs(b - a) < 0.01,
          c: [T(nt(b, 4)), T(nt(b, 4) + '^{x}\\ln ' + nt(b, 4)), T('\\dfrac{1}{x\\ln ' + nt(b, 4) + '}'),
            T(nt(Math.log(b), 5))] };
      });
      h += tbl(['Base', 'Derivada de ' + T('a^{x}'), 'Derivada de ' + T('\\log_{a}x'), T('\\ln a')], filas);

      h += step(note('Truco previo muy \u00fatil: antes de derivar un logaritmo, aplica sus propiedades. ') +
        T('\\ln x^{2}=2\\ln x') + note(', y derivar eso es much\u00edsimo m\u00e1s f\u00e1cil: sale ') +
        T('\\dfrac{2}{x}') + note('.'));

      h += plot({
        xmin: -2, xmax: 3,
        curves: [{ f: function (t) { return Math.pow(a, t); }, color: '#2563eb' },
        { f: function (t) { return Math.pow(a, t) * lna; }, color: '#059669', dash: '5 4' }],
        caption: 'Azul ' + T('a^{x}') + ', verde discontinuo su derivada. Son proporcionales: ese es el factor ' + T('\\ln a') + '.'
      });
      return h;
    });
  });

  /* ---------- Applet · Trigonometricas ---------- */

  reg('trigo', function (node) {
    var out = shell(node, 'Applet \u00b7 Derivadas trigonom\u00e9tricas', [
      'Las tres b\u00e1sicas, con el signo menos del coseno bien visible, que es donde se pierden m\u00e1s puntos.',
      TD("\\left(\\sin x\\right)'=\\cos x\\qquad\\left(\\cos x\\right)'=-\\sin x\\qquad\\left(\\tan x\\right)'=\\dfrac{1}{\\cos^{2}x}"),
      'Mueve el deslizador y observa la gr\u00e1fica: la derivada del seno ' + key('es el seno desplazado') +
      ' un cuarto de vuelta. Derivar equivale a adelantar la onda.',
      'Ponte en ' + T('x=0') + ': el seno vale ' + T('0') + ' y su derivada ' + T('1') +
      '. Ah\u00ed la curva sube con pendiente m\u00e1xima.',
      'Ponte en ' + T('x\\approx 1{,}5708') + ', o sea ' + T('\\tfrac{\\pi}{2}') + ': el seno vale ' + T('1') +
      ' y su derivada ' + T('0') + '. Es la cresta, con tangente horizontal.',
      'El \u00e1ngulo se mide siempre en ' + key('radianes') + '. Las f\u00f3rmulas no valen en grados.'
    ],
      rng('x', 'x (radianes)', -6.28, 6.28, 0.01, 0)
    );

    live(node, out, function () {
      var x = readN(node, 'x', 0);
      var s = Math.sin(x), c = Math.cos(x), t = Math.tan(x);

      var h = step('Punto: ' + T('x=' + nt(x, 4)) + ' radianes, que son ' + num(x * 180 / Math.PI, 2) + ' grados.');
      h += tbl(['Funci\u00f3n', 'Su valor', 'Su derivada', 'Valor de la derivada'], [
        [T('\\sin x'), T(nt(s, 5)), T('\\cos x'), key(T(nt(c, 5)))],
        [T('\\cos x'), T(nt(c, 5)), T('-\\sin x'), key(T(nt(-s, 5)))],
        [T('\\tan x'), Math.abs(c) < 1e-6 ? bad('no existe') : T(nt(t, 5)),
          T('\\dfrac{1}{\\cos^{2}x}'), Math.abs(c) < 1e-6 ? bad('no existe') : key(T(nt(1 / (c * c), 5)))]
      ]);

      if (Math.abs(c) < 0.02) {
        h += warnStep('Aqu\u00ed ' + T('\\cos x\\approx 0') + ', y la tangente tiene una as\u00edntota vertical. ' +
          'Ni ' + T('\\tan x') + ' ni su derivada existen en esos puntos.');
      }
      if (Math.abs(s) < 0.02) {
        h += step(ok('En este punto el seno se anula y su derivada vale ') + T(nt(c, 3)) +
          ok(', en valor absoluto la m\u00e1xima posible.') + ' El seno cruza el eje con la mayor inclinaci\u00f3n.');
      }
      if (Math.abs(Math.abs(s) - 1) < 0.02) {
        h += step(ok('Estamos en una cresta o en un valle: ') + T('\\cos x\\approx 0') +
          ok(', tangente horizontal.') + ' Ahí el seno alcanza un extremo.');
      }

      h += plot({
        xmin: -6.5, xmax: 6.5, ymin: -1.6, ymax: 1.6,
        curves: [{ f: Math.sin, color: '#2563eb' }, { f: Math.cos, color: '#059669', dash: '5 4' }],
        pts: [{ x: x, y: s, color: '#dc2626' }, { x: x, y: c, color: '#b45309' }],
        segs: [{ x1: x - 1, y1: s - c, x2: x + 1, y2: s + c, color: '#dc2626', width: 1.8 }],
        caption: 'Azul ' + T('\\sin x') + ', verde discontinuo ' + T('\\cos x') +
          '. La recta roja es la tangente al seno: su inclinaci\u00f3n es la altura verde.'
      });
      return h;
    });
  });

  /* ---------- Applet · Entrenador de derivadas ---------- */

  var BANCO = [
    'x^7', '4x^3', 'x^2-5x+2', 'sqrt(x)', '1/x', '3/x^2', 'x^5-x', '2x^4+3x^2-7',
    'exp(x)', '5^x', 'ln(x)', 'log(x)', 'sin(x)', 'cos(x)', 'tan(x)',
    '3sin(x)', 'x+cos(x)', '2exp(x)-x^2', 'sqrt(x)+1/x', 'x^3-3x+ln(x)'
  ];

  reg('entrenador', function (node) {
    var estado = { i: 0 };
    var out = shell(node, 'Applet \u00b7 Entrenador de derivadas', [
      'Aqu\u00ed derivas t\u00fa. El applet propone una funci\u00f3n, escribes su derivada y comprueba si es correcta.',
      'La comprobaci\u00f3n es ' + key('num\u00e9rica') + ': eval\u00faa tu respuesta y la verdadera en varios puntos. ' +
      'As\u00ed acepta cualquier forma equivalente, no solo la que yo escribir\u00eda.',
      'Ejemplo: si la funci\u00f3n es <code>x^2-5x+2</code>, escribe <code>2x-5</code> y pulsa Comprobar.',
      'Formas equivalentes valen. Para <code>sqrt(x)</code> se aceptan <code>1/(2sqrt(x))</code> ' +
      'y tambi\u00e9n <code>0.5x^(-0.5)</code>.',
      'Pulsa ' + key('Otra funci\u00f3n') + ' para cambiar de ejercicio. No mires la soluci\u00f3n antes de intentarlo.'
    ],
      rowText('r', 'tu derivada:', '') +
      row('<button class="ap-btn" data-role="comp">Comprobar</button>' +
        '<button class="ap-btn ap-alt" data-role="nueva">Otra funci\u00f3n</button>' +
        '<button class="ap-btn ap-alt" data-role="ver">Ver la soluci\u00f3n</button>')
    );

    var btnNueva = node.querySelector('[data-role="nueva"]');
    var btnVer = node.querySelector('[data-role="ver"]');
    var campo = node.querySelector('[data-role="r"]');
    if (btnNueva) {
      btnNueva.addEventListener('click', function () {
        estado.i = Math.floor(Math.random() * BANCO.length);
        estado.ver = false;
        if (campo) campo.value = '';
      });
    }
    if (btnVer) {
      btnVer.addEventListener('click', function () { estado.ver = true; });
    }
    estado.i = Math.floor(Math.random() * BANCO.length);

    live(node, out, function () {
      var src = BANCO[estado.i];
      var A = simpN(parse(src)), DA = simpN(D(A));
      var h = step(key('Deriva esta funci\u00f3n: ') + TD('f(x)=' + tex(A)));
      h += step(note('Escrita en sintaxis de teclado: ') + '<code>' + src + '</code>');

      var resp = readS(node, 'r', '').replace(/\s/g, '');
      if (!resp) {
        h += step('Escribe tu respuesta en el campo y pulsa ' + key('Comprobar') + '.');
      } else {
        var AA;
        try { AA = simpN(parse(resp)); } catch (e) {
          h += warnStep('No entiendo tu respuesta: ' + e.message);
          return h;
        }
        h += step('Tu respuesta, interpretada: ' + TD("f'(x)=" + tex(AA)));
        var puntos = [0.7, 1.3, 2.1, 3.4, -0.6, -1.8, 4.2];
        var r = comparaEn(AA, fnOf(DA), puntos);
        if (r.filas.length === 0) {
          h += warnStep('No he podido comparar en ning\u00fan punto: revisa el dominio de tu expresi\u00f3n.');
        } else if (r.bien) {
          h += step(ok('\u00a1Correcto! ') + 'Tu derivada coincide con la verdadera en todos los puntos probados.');
        } else {
          h += warnStep(bad('Todav\u00eda no. ') + 'Difiere en ' + r.fallos + ' de los ' + r.filas.length +
            ' puntos probados. Mira la tabla para localizar el error, y revisa si has olvidado ' +
            'un signo, un coeficiente o el ' + T('\\ln a') + ' de una exponencial.');
        }
        h += tbl(['Punto', 'Tu derivada', 'La verdadera', '¿Coincide?'], r.filas);
      }

      if (estado.ver) {
        h += step(key('Soluci\u00f3n: ') + TD("f'(x)=" + tex(DA)));
        h += step(note('Cualquier forma equivalente es igual de v\u00e1lida. Lo que importa es el valor, no la escritura.'));
      }
      return h;
    });
  });

  /* ===================================================================
     APARTADO 6 · PRODUCTO Y COCIENTE
     =================================================================== */

  /* ---------- Applet · Regla del producto ---------- */

  reg('producto', function (node) {
    var out = shell(node, 'Applet \u00b7 Regla del producto', [
      'Escribe los dos factores por separado y el applet aplica la regla paso a paso, ' +
      'sin saltarse ninguna sustituci\u00f3n.',
      TD("\\left[f(x)\\cdot g(x)\\right]'=f'(x)\\cdot g(x)+f(x)\\cdot g'(x)"),
      'Se recita as\u00ed: ' + key('la derivada de la primera por la segunda sin derivar, m\u00e1s la primera sin derivar por la derivada de la segunda') + '.',
      'Empieza con <code>x</code> y <code>cos(x)</code>: sale ' + T('\\cos x-x\\sin x') +
      '. Es el ejemplo resuelto 12a del libro.',
      'Prueba <code>x^2+1</code> y <code>ln(x)</code>: sale ' + T('2x\\ln x+x+\\dfrac{1}{x}') + '.',
      'Prueba <code>exp(x)</code> y <code>sin(x)</code>, y luego <code>sin(x)</code> y <code>cos(x)</code>.'
    ].concat(SINTAXIS),
      rowText('f', 'primer factor f(x) =', 'x') +
      rowText('g', 'segundo factor g(x) =', 'cos(x)') +
      row(mini('a', 'evaluar en x =', 1, 0.25))
    );

    live(node, out, function () {
      var A = readF(node, 'f', 'x'), B = readF(node, 'g', 'cos(x)');
      var a = readN(node, 'a', 1);
      if (!A.dast || !B.dast) return errBox('alguno de los factores no se puede derivar con reglas.');

      var H = simpN(mul(A.ast, B.ast)), DH = simpN(D(H));
      var h = step('Producto: ' + TD('h(x)=\\left(' + A.tx + '\\right)\\cdot\\left(' + B.tx + '\\right)'));
      h += step(key('Paso 1. ') + 'Identificamos los dos factores: ' +
        TD('f(x)=' + A.tx + '\\qquad g(x)=' + B.tx));
      h += step(key('Paso 2. ') + 'Derivamos cada uno por separado: ' +
        TD("f'(x)=" + A.dtx + "\\qquad g'(x)=" + B.dtx));
      h += step(key('Paso 3. ') + 'Sustituimos en la f\u00f3rmula: ' +
        TD("h'(x)=\\underbrace{\\left(" + A.dtx + "\\right)\\cdot\\left(" + B.tx + "\\right)}_{f'\\cdot g}" +
        "+\\underbrace{\\left(" + A.tx + "\\right)\\cdot\\left(" + B.dtx + "\\right)}_{f\\cdot g'}"));
      h += step(key('Resultado: ') + TD("h'(x)=" + tex(DH)));

      var hv = ev(H, a), dv2 = ev(DH, a);
      h += step('En ' + T('x=' + qt(a)) + ': ' + T('h(' + par(a) + ')=' + nt(hv, 5)) +
        ' y ' + T("h'(" + par(a) + ')=' + nt(dv2, 5)) + '.');

      var apr = (ev(H, a + 1e-6) - ev(H, a - 1e-6)) / 2e-6;
      h += step(note('Comprobaci\u00f3n num\u00e9rica independiente: ') + T(nt(apr, 6)) + '. ' +
        (isFinite(apr) && Math.abs(apr - dv2) < 1e-4 * (1 + Math.abs(dv2)) ? ok('Coincide.') : bad('No coincide.')));

      var sp = Math.max(2, Math.abs(a) * 1.5);
      h += plot({
        xmin: a - sp, xmax: a + sp,
        curves: [{ f: fnOf(H), color: '#2563eb' }, { f: fnOf(DH), color: '#059669', dash: '5 4' }],
        pts: [{ x: a, y: hv, color: '#dc2626' }],
        caption: 'Azul el producto, verde discontinuo su derivada.'
      });
      return h;
    });
  });

  /* ---------- Applet · Regla del cociente ---------- */

  reg('cocienteregla', function (node) {
    var out = shell(node, 'Applet \u00b7 Regla del cociente', [
      'La m\u00e1s temida, sobre todo por el orden de la resta, que no se puede cambiar.',
      TD("\\left[\\dfrac{f(x)}{g(x)}\\right]'=\\dfrac{f'(x)\\cdot g(x)-f(x)\\cdot g'(x)}{\\left[g(x)\\right]^{2}}"),
      'Se recita as\u00ed: ' + key('derivada del numerador por el denominador sin derivar, menos el numerador sin derivar por la derivada del denominador, todo entre el denominador al cuadrado') + '.',
      'Empieza con <code>exp(x)</code> entre <code>x^2+1</code>: es el ejemplo 13a del libro.',
      'Prueba <code>x^2+x-3</code> entre <code>x+1</code>, y <code>sqrt(x)</code> entre <code>3x+4</code>.',
      'Prueba <code>x</code> entre <code>x^2+1</code> y busca d\u00f3nde la derivada se anula: ' +
      'saldr\u00e1 en ' + T('x=\\pm 1') + ', que es el ejercicio de tangentes horizontales del apartado 3.',
      key('El orden de la resta importa') + '. Si lo inviertes, el resultado cambia de signo y el ejercicio est\u00e1 mal.'
    ].concat(SINTAXIS),
      rowText('f', 'numerador f(x) =', 'exp(x)') +
      rowText('g', 'denominador g(x) =', 'x^2+1') +
      row(mini('a', 'evaluar en x =', 1, 0.25))
    );

    live(node, out, function () {
      var A = readF(node, 'f', 'exp(x)'), B = readF(node, 'g', 'x^2+1');
      var a = readN(node, 'a', 1);
      if (!A.dast || !B.dast) return errBox('el numerador o el denominador no se pueden derivar con reglas.');
      if (Math.abs(B.f(a)) < 1e-12) {
        return errBox('el denominador se anula en ' + T('x=' + qt(a)) +
          '. Ah\u00ed la funci\u00f3n no existe y no se puede derivar. Cambia el punto.');
      }

      var H = simpN(dv(A.ast, B.ast)), DH = simpN(D(H));
      var h = step('Cociente: ' + TD('h(x)=\\dfrac{' + A.tx + '}{' + B.tx + '}'));
      h += step(key('Paso 1. ') + 'Numerador y denominador: ' +
        TD('f(x)=' + A.tx + '\\qquad g(x)=' + B.tx));
      h += step(key('Paso 2. ') + 'Sus derivadas: ' +
        TD("f'(x)=" + A.dtx + "\\qquad g'(x)=" + B.dtx));
      h += step(key('Paso 3. ') + 'Sustituimos, cuidando el orden de la resta: ' +
        TD("h'(x)=\\dfrac{\\left(" + A.dtx + "\\right)\\left(" + B.tx + "\\right)-\\left(" +
        A.tx + "\\right)\\left(" + B.dtx + "\\right)}{\\left(" + B.tx + "\\right)^{2}}"));
      h += step(key('Resultado: ') + TD("h'(x)=" + tex(DH)));

      var dv2 = ev(DH, a);
      h += step('En ' + T('x=' + qt(a)) + ': ' + T('h(' + par(a) + ')=' + nt(ev(H, a), 5)) +
        ' y ' + T("h'(" + par(a) + ')=' + nt(dv2, 5)) + '.');

      var apr = (ev(H, a + 1e-6) - ev(H, a - 1e-6)) / 2e-6;
      h += step(note('Comprobaci\u00f3n num\u00e9rica: ') + T(nt(apr, 6)) + '. ' +
        (isFinite(apr) && Math.abs(apr - dv2) < 1e-4 * (1 + Math.abs(dv2)) ? ok('Coincide.') : bad('No coincide.')));

      h += warnStep('Si hubieras escrito la resta al rev\u00e9s, obtendr\u00edas ' + T(nt(-dv2, 5)) +
        ' en lugar de ' + T(nt(dv2, 5)) + '. Es el error m\u00e1s frecuente, y cambia por completo ' +
        'las conclusiones sobre crecimiento.');

      h += step(note('Atajo que conviene conocer: si el denominador es un n\u00famero, no hace falta esta regla. ') +
        T("\\left[\\dfrac{f(x)}{5}\\right]'=\\dfrac{f'(x)}{5}") + note(', porque dividir entre 5 es multiplicar por ') +
        T('\\tfrac{1}{5}') + note('.'));

      var sp = Math.max(2, Math.abs(a) * 1.5);
      h += plot({
        xmin: a - sp, xmax: a + sp,
        curves: [{ f: fnOf(H), color: '#2563eb' }, { f: fnOf(DH), color: '#059669', dash: '5 4' }],
        pts: [{ x: a, y: ev(H, a), color: '#dc2626' }],
        caption: 'Azul el cociente, verde discontinuo su derivada.'
      });
      return h;
    });
  });

  /* ---------- Applet · El error de derivar factor a factor ---------- */

  reg('errorcomun', function (node) {
    var out = shell(node, 'Applet \u00b7 Por qu\u00e9 no se deriva factor a factor', [
      'La suma s\u00ed se deriva trozo a trozo. El producto y el cociente ' + key('no') +
      '. Este applet lo demuestra con n\u00fameros, que es la \u00fanica forma de que se quede grabado.',
      'Empieza con <code>x^2</code> y <code>x^3</code>: el producto es ' + T('x^{5}') +
      ', cuya derivada es ' + T('5x^{4}') + '. Pero ' + T("f'\\cdot g'=2x\\cdot 3x^{2}=6x^{3}") +
      ', que no se parece en nada.',
      'Prueba <code>x</code> y <code>x</code>: el producto es ' + T('x^{2}') + ' y su derivada ' + T('2x') +
      ', mientras que ' + T("f'\\cdot g'=1") + '. Con ' + T('x=5') + ' eso son ' + T('10') + ' frente a ' + T('1') + '.',
      'Prueba tambi\u00e9n el cociente y compara con ' + T("\\dfrac{f'}{g'}") + '.',
      'Cambia el punto de evaluaci\u00f3n: no hay ning\u00fan punto en el que las dos columnas coincidan, ' +
      'salvo coincidencias aisladas sin ning\u00fan valor general.'
    ].concat(SINTAXIS),
      rowText('f', 'f(x) =', 'x^2') +
      rowText('g', 'g(x) =', 'x^3') +
      row(mini('a', 'evaluar en x =', 2, 0.5))
    );

    live(node, out, function () {
      var A = readF(node, 'f', 'x^2'), B = readF(node, 'g', 'x^3');
      var a = readN(node, 'a', 2);
      if (!A.dast || !B.dast) return errBox('alguna funci\u00f3n no se puede derivar con reglas.');

      var P = simpN(mul(A.ast, B.ast)), DP = simpN(D(P));
      var Q = simpN(dv(A.ast, B.ast)), DQ = simpN(D(Q));
      var malP = simpN(mul(A.dast, B.dast));
      var malQ = simpN(dv(A.dast, B.dast));
      var S = simpN(add(A.ast, B.ast)), DS = simpN(D(S));
      var bienS = simpN(add(A.dast, B.dast));

      var h = step('Funciones: ' + TD('f(x)=' + A.tx + '\\qquad g(x)=' + B.tx) +
        'con ' + T("f'(x)=" + A.dtx) + ' y ' + T("g'(x)=" + B.dtx) + '.');

      h += tbl(['Operaci\u00f3n', 'Derivada correcta', 'Lo que muchos escriben', 'En ' + T('x=' + qt(a))], [
        ['Suma ' + T('f+g'), T(tex(DS)), T(tex(bienS)), ok('coinciden: ' + num(ev(DS, a), 4))],
        ['Producto ' + T('f\\cdot g'), T(tex(DP)), T(tex(malP)),
          bad(num(ev(DP, a), 4) + ' frente a ' + num(ev(malP, a), 4))],
        ['Cociente ' + T('f/g'), T(tex(DQ)), T(tex(malQ)),
          bad(num(ev(DQ, a), 4) + ' frente a ' + num(ev(malQ, a), 4))]
      ]);

      h += step(ok('La suma s\u00ed. ') + 'La derivada de una suma es la suma de las derivadas, y eso se demuestra ' +
        'directamente con la definici\u00f3n, porque el l\u00edmite de una suma es la suma de los l\u00edmites.');
      h += warnStep(bad('El producto no. ') + 'Hay que usar ' + T("f'g+fg'") +
        '. Y el cociente exige ' + T("\\dfrac{f'g-fg'}{g^{2}}") + '. No hay atajo.');

      h += step(key('Una forma de recordar por qu\u00e9. ') +
        'Piensa en el \u00e1rea de un rect\u00e1ngulo de lados ' + T('f') + ' y ' + T('g') +
        '. Si los dos lados crecen, el \u00e1rea crece por ' + key('dos franjas') +
        ': una de altura ' + T('g') + ' y otra de anchura ' + T('f') +
        '. De ahí los dos sumandos de la regla del producto.');

      var sp = Math.max(1.5, Math.abs(a));
      h += plot({
        xmin: a - sp, xmax: a + sp,
        curves: [{ f: fnOf(DP), color: '#059669' }, { f: fnOf(malP), color: '#dc2626', dash: '5 4' }],
        pts: [{ x: a, y: ev(DP, a), color: '#059669' }, { x: a, y: ev(malP, a), color: '#dc2626' }],
        caption: 'Verde la derivada correcta del producto, rojo discontinuo el error ' + T("f'\\cdot g'") +
          '. Son curvas distintas.'
      });
      return h;
    });
  });

  /* ===================================================================
     APARTADO 7 · REGLA DE LA CADENA
     =================================================================== */

  /* ---------- Applet · Composicion y regla de la cadena ---------- */

  reg('cadena', function (node) {
    var out = shell(node, 'Applet \u00b7 Regla de la cadena, capa por capa', [
      'Escribe la funci\u00f3n ' + key('externa') + ' y la ' + key('interna') +
      '. En la externa usa ' + T('x') + ' como si fuera ' + T('u') + ': el applet har\u00e1 la sustituci\u00f3n.',
      TD("\\left[g\\left(f(x)\\right)\\right]'=g'\\left(f(x)\\right)\\cdot f'(x)"),
      'Empieza con externa <code>cos(x)</code> e interna <code>x^4</code>: la composici\u00f3n es ' +
      T('\\cos x^{4}') + ' y la derivada ' + T('-4x^{3}\\sin x^{4}') + '. Es el ejemplo del libro.',
      'Prueba externa <code>sqrt(x)</code> e interna <code>3x+1</code>: sale ' +
      T('\\dfrac{3}{2\\sqrt{3x+1}}') + '. Compara con lo que sale sin la cadena y ver\u00e1s que falta el ' + T('3') + '.',
      'Prueba externa <code>exp(x)</code> e interna <code>7x-4</code>: sale ' + T('7e^{7x-4}') + '.',
      'Prueba externa <code>ln(x)</code> e interna <code>2x^3-5</code>: sale ' + T('\\dfrac{6x^{2}}{2x^{3}-5}') + '.',
      'La \u00faltima fila compara la derivada obtenida con la cadena y la obtenida derivando la composici\u00f3n directamente. Deben coincidir siempre.'
    ].concat(SINTAXIS),
      rowText('g', 'externa g(u), escrita con x:', 'cos(x)') +
      rowText('f', 'interna f(x) =', 'x^4') +
      row(mini('a', 'evaluar en x =', 1, 0.25))
    );

    live(node, out, function () {
      var G = readF(node, 'g', 'cos(x)'), F = readF(node, 'f', 'x^4');
      var a = readN(node, 'a', 1);
      if (!G.dast || !F.dast) return errBox('alguna de las dos capas no se puede derivar con reglas.');

      var COMP = simpN(subst(G.ast, F.ast));
      var DCOMP = simpN(D(COMP));
      var GPfx = simpN(subst(G.dast, F.ast));
      var CADENA = simpN(mul(GPfx, F.dast));

      var h = step(key('Paso 1. ') + 'Las dos capas: ' +
        TD('g(u)=' + G.tx.replace(/x/g, 'u') + '\\qquad f(x)=' + F.tx));
      h += step(key('Paso 2. ') + 'La composici\u00f3n, sustituyendo ' + T('u') + ' por ' + T('f(x)') + ': ' +
        TD('g\\left(f(x)\\right)=' + tex(COMP)));
      h += step(key('Paso 3. ') + 'Derivamos cada capa por separado: ' +
        TD("g'(u)=" + G.dtx.replace(/x/g, 'u') + "\\qquad f'(x)=" + F.dtx));
      h += step(key('Paso 4. ') + 'En ' + T("g'") + ' cambiamos ' + T('u') + ' por ' + T('f(x)') + ': ' +
        TD("g'\\left(f(x)\\right)=" + tex(GPfx)));
      h += step(key('Paso 5. ') + 'Multiplicamos por la derivada de la interna: ' +
        TD("\\left[g\\left(f(x)\\right)\\right]'=\\left(" + tex(GPfx) + "\\right)\\cdot\\left(" + F.dtx + "\\right)"));
      h += step(key('Resultado: ') + TD(tex(CADENA)));

      var v1 = ev(CADENA, a), v2 = ev(DCOMP, a);
      h += tbl(['V\u00eda de c\u00e1lculo', 'Expresi\u00f3n', 'Valor en ' + T('x=' + qt(a))], [
        ['Regla de la cadena', T(tex(CADENA)), key(T(nt(v1, 6)))],
        ['Derivando la composici\u00f3n directamente', T(tex(DCOMP)), key(T(nt(v2, 6)))],
        ['¿Coinciden?', '', isFinite(v1) && isFinite(v2) && Math.abs(v1 - v2) < 1e-6 * (1 + Math.abs(v2)) ? ok('s\u00ed') : bad('no')]
      ]);

      var sinCadena = ev(GPfx, a);
      h += warnStep('El error t\u00edpico es olvidar el factor ' + T("f'(x)") + '. Si te quedaras en ' +
        T(tex(GPfx)) + ', en ' + T('x=' + qt(a)) + ' obtendr\u00edas ' + T(nt(sinCadena, 5)) +
        ' en lugar de ' + T(nt(v1, 5)) + '. ' + key('La cadena no es opcional') + '.');

      var sp = Math.max(1.5, Math.abs(a) * 1.5);
      h += plot({
        xmin: a - sp, xmax: a + sp,
        curves: [{ f: fnOf(COMP), color: '#2563eb' }, { f: fnOf(CADENA), color: '#059669', dash: '5 4' }],
        pts: [{ x: a, y: ev(COMP, a), color: '#dc2626' }],
        caption: 'Azul la composici\u00f3n, verde discontinuo su derivada.'
      });
      return h;
    });
  });

  /* ---------- Applet · Identificar las capas de una funcion ---------- */

  function capas(ast) {
    var lista = [], cur = ast, g = 0;
    while (g++ < 12) {
      if (cur.k === 'f') {
        lista.push({ d: 'funci\u00f3n ' + cur.n, nodo: cur });
        cur = cur.a;
      } else if (cur.k === '^' && cur.b.k === 'n') {
        lista.push({ d: 'potencia de exponente ' + qt(cur.b.v), nodo: cur });
        cur = cur.a;
      } else if (cur.k === '^' && cur.a.k === 'n') {
        lista.push({ d: 'exponencial de base ' + qt(cur.a.v), nodo: cur });
        cur = cur.b;
      } else break;
    }
    return { lista: lista, nucleo: cur };
  }

  reg('cadenacapas', function (node) {
    var out = shell(node, 'Applet \u00b7 ¿Cu\u00e1ntas capas tiene esta funci\u00f3n?', [
      'Antes de derivar hay que ' + key('leer') + ' la funci\u00f3n: saber cu\u00e1l es la principal y cu\u00e1l su argumento. ' +
      'Este applet la desmonta por ti.',
      'Empieza con <code>cos(x^2)</code>: dos capas, coseno por fuera y cuadrado por dentro.',
      'Prueba <code>sqrt(sin(x))</code>: ra\u00edz por fuera, seno por dentro.',
      'Prueba <code>ln(sin(x)^2)</code>: ' + key('tres') + ' capas. Es el ejemplo 6.16 de los apuntes de teor\u00eda.',
      'Prueba <code>(x^3-2x)^4</code>: la capa externa es una potencia, no una funci\u00f3n con nombre.',
      'Ojo con la diferencia: <code>cos(x)*ln(x)</code> es un ' + key('producto') +
      ', y <code>cos(ln(x))</code> es una ' + key('composici\u00f3n') + '. No se derivan igual.'
    ].concat(SINTAXIS),
      rowText('f', 'f(x) =', 'ln(sin(x)^2)') +
      row(mini('a', 'evaluar en x =', 1, 0.25))
    );

    live(node, out, function () {
      var F = readF(node, 'f', 'ln(sin(x)^2)');
      var a = readN(node, 'a', 1);
      var K = capas(F.ast);

      var h = step('Funci\u00f3n: ' + TD('f(x)=' + F.tx));

      if (K.lista.length === 0) {
        h += step(note('Esta funci\u00f3n no es una composici\u00f3n: es elemental, o una suma, un producto o un cociente. ') +
          'Aqu\u00ed no hace falta la regla de la cadena, sino las del apartado 6.');
      } else {
        h += step('Tiene ' + key(K.lista.length + (K.lista.length === 1 ? ' capa' : ' capas')) +
          ' de composici\u00f3n, de fuera hacia dentro:');
        var filas = K.lista.map(function (c, i) {
          return [String(i + 1) + '\u00ba', c.d, T(tex(c.nodo))];
        });
        filas.push([String(K.lista.length + 1) + '\u00ba', 'n\u00facleo', T(tex(K.nucleo))]);
        h += tbl(['Orden', 'Qu\u00e9 es', 'Expresi\u00f3n en ese nivel'], filas);
        h += step(note('Se deriva de fuera hacia dentro, y se van multiplicando todas las derivadas. ') +
          'Cada capa a\u00f1ade un factor al producto final.');
      }

      if (F.dtx) {
        h += step(key('Derivada completa: ') + TD("f'(x)=" + F.dtx));
        var dv3 = F.df(a);
        h += step('En ' + T('x=' + qt(a)) + ' vale ' + T(nt(dv3, 6)) + '. ' +
          note('Comprobaci\u00f3n num\u00e9rica: ') + T(nt((F.f(a + 1e-6) - F.f(a - 1e-6)) / 2e-6, 6)) + '.');
      } else {
        h += warnStep('No puedo derivar esta expresi\u00f3n con reglas: ' + (F.derr || ''));
      }

      h += step(key('Consejo de lectura. ') + 'Preg\u00fantate siempre: si tuviera que evaluar esta funci\u00f3n ' +
        'en ' + T('x=2') + ' con una calculadora, ' + key('¿qu\u00e9 tecla pulsar\u00eda la \u00faltima?') +
        ' Esa es la capa externa, y por ella se empieza a derivar.');
      return h;
    });
  });

  /* ---------- Applet · Derivacion logaritmica ---------- */

  reg('logaritmica', function (node) {
    var out = shell(node, 'Applet \u00b7 Derivaci\u00f3n logar\u00edtmica', [
      'Para funciones del tipo ' + T('y=u(x)^{v(x)}') + ', con variable en la base ' + key('y') +
      ' en el exponente. No hay regla directa que merezca memorizarse: se toman logaritmos.',
      'El procedimiento tiene cinco pasos, y el applet los muestra todos con tus funciones.',
      'Empieza con base <code>2x</code> y exponente <code>x+5</code>: es el ejemplo 6.18 de los apuntes.',
      'Prueba base <code>sin(x)</code> y exponente <code>x^3-2</code>, el ejemplo 6.19.',
      'Prueba base <code>x</code> y exponente <code>x</code>: la famosa ' + T('x^{x}') +
      ', cuya derivada es ' + T('x^{x}\\left(\\ln x+1\\right)') + '.',
      'La ventaja no es la f\u00f3rmula: es que convierte una potencia complicada en un ' + key('producto') +
      ', que ya sabes derivar.'
    ].concat(SINTAXIS),
      rowText('u', 'base u(x) =', '2x') +
      rowText('v', 'exponente v(x) =', 'x+5') +
      row(mini('a', 'evaluar en x =', 1, 0.25))
    );

    live(node, out, function () {
      var U = readF(node, 'u', '2x'), V = readF(node, 'v', 'x+5');
      var a = readN(node, 'a', 1);
      if (!U.dast || !V.dast) return errBox('la base o el exponente no se pueden derivar con reglas.');

      var Y = simpN(pw(U.ast, V.ast));
      var DY = simpN(D(Y));
      var corchete = simpN(add(mul(V.dast, fnode('ln', U.ast)), dv(mul(V.ast, U.dast), U.ast)));

      var h = step('Funci\u00f3n: ' + TD('y=\\left(' + U.tx + '\\right)^{' + V.tx + '}'));
      h += step(key('Paso 1. ') + 'Tomamos logaritmos en los dos miembros: ' +
        TD('\\ln y=\\ln\\left(' + U.tx + '\\right)^{' + V.tx + '}'));
      h += step(key('Paso 2. ') + 'Bajamos el exponente con la propiedad ' + T('\\ln u^{v}=v\\ln u') + ': ' +
        TD('\\ln y=\\left(' + V.tx + '\\right)\\cdot\\ln\\left(' + U.tx + '\\right)'));
      h += step(key('Paso 3. ') + 'Derivamos los dos miembros. A la izquierda act\u00faa la regla de la cadena; ' +
        'a la derecha, la del producto: ' +
        TD("\\dfrac{y'}{y}=\\left(" + V.dtx + "\\right)\\ln\\left(" + U.tx + "\\right)+\\left(" +
        V.tx + "\\right)\\cdot\\dfrac{" + U.dtx + "}{" + U.tx + "}"));
      h += step(key('Paso 4. ') + 'Despejamos ' + T("y'") + ' multiplicando por ' + T('y') + ': ' +
        TD("y'=\\left[" + tex(corchete) + "\\right]\\cdot\\left(" + U.tx + "\\right)^{" + V.tx + "}"));
      h += step(key('Paso 5. ') + 'Y ya est\u00e1. Resultado ordenado: ' + TD("y'=" + tex(DY)));

      var v1 = ev(DY, a), v2 = ev(corchete, a) * ev(Y, a);
      var apr = (ev(Y, a + 1e-6) - ev(Y, a - 1e-6)) / 2e-6;
      h += tbl(['V\u00eda', 'Valor en ' + T('x=' + qt(a))], [
        ['Derivaci\u00f3n logar\u00edtmica', key(T(nt(v2, 6)))],
        ['Derivada simb\u00f3lica directa', key(T(nt(v1, 6)))],
        ['C\u00e1lculo num\u00e9rico', T(nt(apr, 6))],
        ['¿Coinciden las tres?', isFinite(v1) && isFinite(v2) && isFinite(apr) &&
          Math.abs(v1 - v2) < 1e-5 * (1 + Math.abs(v1)) &&
          Math.abs(v1 - apr) < 1e-3 * (1 + Math.abs(v1)) ? ok('s\u00ed') : bad('revisa el dominio en ese punto')]
      ]);

      if (U.f(a) <= 0) {
        h += warnStep('En ' + T('x=' + qt(a)) + ' la base vale ' + T(nt(U.f(a), 4)) +
          ', que no es positiva. El logaritmo no existe ah\u00ed, y por tanto tampoco este procedimiento. ' +
          'Cambia el punto de evaluaci\u00f3n.');
      }

      h += step(note('Cu\u00e1ndo hace falta este m\u00e9todo. ') + 'Solo si hay ' + key('variable en el exponente y en la base') +
        ' a la vez. Si el exponente es un n\u00famero, usa la regla de la potencia; si la base es un n\u00famero, ' +
        'la de la exponencial. Este m\u00e9todo es para el caso mixto.');
      return h;
    });
  });

  /* ---------- Applet · Producto frente a composicion ---------- */

  reg('productovscadena', function (node) {
    var out = shell(node, 'Applet \u00b7 Producto o composici\u00f3n: no es lo mismo', [
      'Con las mismas dos funciones se pueden formar cosas muy distintas. Este applet las pone lado a lado.',
      'Empieza con <code>cos(x)</code> y <code>ln(x)</code>. El producto es ' + T('\\cos x\\cdot\\ln x') +
      '; la composici\u00f3n es ' + T('\\cos\\left(\\ln x\\right)') + '. Ni las funciones ni las derivadas se parecen.',
      'Prueba <code>x^2</code> y <code>sin(x)</code>: producto ' + T('x^{2}\\sin x') +
      ', composici\u00f3n ' + T('\\sin^{2}x') + ' en un orden y ' + T('\\sin x^{2}') + ' en el otro. Tres cosas distintas.',
      'Fíjate en la fila de valores num\u00e9ricos: es la prueba m\u00e1s dif\u00edcil de discutir.',
      'La confusi\u00f3n entre producto y composici\u00f3n es, con diferencia, el error m\u00e1s caro de este tema, ' +
      'porque lleva a aplicar la regla equivocada desde el primer paso.'
    ].concat(SINTAXIS),
      rowText('f', 'f(x) =', 'cos(x)') +
      rowText('g', 'g(x) =', 'ln(x)') +
      row(mini('a', 'evaluar en x =', 2, 0.25))
    );

    live(node, out, function () {
      var A = readF(node, 'f', 'cos(x)'), B = readF(node, 'g', 'ln(x)');
      var a = readN(node, 'a', 2);
      if (!A.dast || !B.dast) return errBox('alguna funci\u00f3n no se puede derivar con reglas.');

      var P = simpN(mul(A.ast, B.ast));
      var C1 = simpN(subst(A.ast, B.ast));
      var C2 = simpN(subst(B.ast, A.ast));
      var DP = simpN(D(P)), DC1 = simpN(D(C1)), DC2 = simpN(D(C2));

      function fila(nombre, E, DE) {
        var ve = ev(E, a), vd = ev(DE, a);
        return [nombre, T(tex(E)), T(tex(DE)),
          isFinite(ve) ? T(nt(ve, 4)) : bad('\u2014'),
          isFinite(vd) ? key(T(nt(vd, 4))) : bad('\u2014')];
      }

      var h = step('Funciones de partida: ' + TD('f(x)=' + A.tx + '\\qquad g(x)=' + B.tx));
      h += tbl(['Qu\u00e9 construimos', 'Expresi\u00f3n', 'Su derivada',
        'Valor en ' + T('x=' + qt(a)), 'Derivada en ' + T('x=' + qt(a))], [
        fila('Producto ' + T('f\\cdot g'), P, DP),
        fila('Composici\u00f3n ' + T('f\\circ g'), C1, DC1),
        fila('Composici\u00f3n ' + T('g\\circ f'), C2, DC2)
      ]);

      h += step(key('Regla que se aplica en cada caso. ') +
        'Producto: ' + T("f'g+fg'") + '. Composici\u00f3n: ' + T("g'(f(x))\\cdot f'(x)") +
        '. Elegir mal la regla en el primer paso arruina todo el ejercicio.');
      h += warnStep('Observa tambi\u00e9n que ' + T('f\\circ g') + ' y ' + T('g\\circ f') +
        ' son distintas entre s\u00ed. ' + key('La composici\u00f3n no es conmutativa') +
        ', al contrario que el producto.');

      var sp = 2;
      h += plot({
        xmin: Math.max(0.05, a - sp), xmax: a + sp,
        curves: [{ f: fnOf(P), color: '#2563eb' }, { f: fnOf(C1), color: '#059669' },
        { f: fnOf(C2), color: '#b45309', dash: '5 4' }],
        caption: 'Azul el producto, verde ' + T('f\\circ g') + ', naranja discontinuo ' + T('g\\circ f') + '.'
      });
      return h;
    });
  });

  console.info('[derivadas] der-applets-extra.js cargado: 16 applets registrados.');
})();

(function () {
  function remontar() {
    var n = 0;
    document.querySelectorAll('[data-applet-der]').forEach(function (nodo) {
      if (nodo.querySelector('.ap-err')) {
        nodo.removeAttribute('data-der-listo');
        nodo.innerHTML = '';
        n++;
      }
    });
    if (n && window.DER && window.DER.boot) window.DER.boot();
    console.info('[derivadas] remontados: ' + n);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', remontar);
  } else {
    remontar();
  }
})();
