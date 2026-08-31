/* =====================================================================
   sis-applets-extra.js — TEMA 3 SISTEMAS · 2.º Batx Mates CCSS
   Ubicación: 2-BatxMatesCCSS/sistemas/assets/sis-applets-extra.js

   Segundo módulo del motor. Reutiliza todo el núcleo de sis-applets.js
   a través de window.SIS.

   CLAVES DE ESTE ARCHIVO (partes 4 a 9)
     rouche · rouchegrado · anadir
     cramer · cramercheck · cramergen
     homogeneo · homobase
     paramrouche · paramtabla
     problema · datos · entrenador · diagnostico

   El diagnóstico cuenta los applets montados de forma DIFERIDA y
   verifica la lista completa de claves esperadas, no un número fijo.
   ===================================================================== */

(function () {
  'use strict';

  var S = window.SIS;
  if (!S) {
    var aviso = document.querySelectorAll('[data-applet-sis]');
    for (var z = 0; z < aviso.length; z++) {
      aviso[z].innerHTML = '<div class="mx-bad ap-err">No se ha cargado ' +
        '<code>sis-applets.js</code>. Revisa el orden de los scripts en <code>assets/_scripts.html</code>.</div>';
    }
    return;
  }

  var F = S.F, R = S.R, k = S.k, kd = S.kd;
  var view = S.view, viewDet = S.viewDet, viewAmp = S.viewAmp;
  var ok = S.ok, info = S.info, warn = S.warn, err = S.err;
  var build = S.build, need = S.need, nombre = S.nombre;
  var FORMATO = S.FORMATO;

  /* ==================================================================
     PARTE 4 · TEOREMA DE ROUCHÉ-FROBENIUS
     ================================================================== */

  S.reg('rouche', function (node) {
    build(node, 'Applet \u00b7 Teorema de Rouch\u00e9-Frobenius',
      'El teorema compara dos rangos: el de la matriz de coeficientes ' + k('A') + ' y el de la ampliada ' +
      k('A^{*}') + '. ' + FORMATO + '<br>Ejemplos del libro: ' +
      '<code>1 -3 1 2<br>-2 0 2 0<br>1 -4 -3 -2</code> (determinado) \u00b7 ' +
      '<code>1 -3 1 2<br>-2 0 2 0<br>-1 -3 3 2</code> (indeterminado) \u00b7 ' +
      '<code>1 -3 1 2<br>-2 0 2 0<br>-1 -3 3 8</code> (incompatible).',
      [{ id: 'S', label: 'Sistema', rows: 5, value: '1 -3 1 2\n-2 0 2 0\n1 -4 -3 -2' }],
      function (v) {
        var p = need(v.S);
        if (p.err) return err(p.err);
        var n = p.n, res = S.analiza(p.A, p.b);
        var h = '<div class="mx-flex">' + kd(S.texSistema(p.A, p.b)) + '</div>';
        h += '<div class="mx-grid">' + view(p.A, { name: 'A' }) + viewAmp(p.amp, n, { name: 'A^{*}' }) + '</div>';
        h += '<table class="ap-tbl"><tbody>';
        h += '<tr><td>' + k('\\operatorname{rg}(A)') + '</td><td><b>' + res.rA + '</b></td></tr>';
        h += '<tr><td>' + k('\\operatorname{rg}(A^{*})') + '</td><td><b>' + res.rAmp + '</b></td></tr>';
        h += '<tr><td>N\u00famero de inc\u00f3gnitas</td><td><b>' + n + '</b></td></tr>';
        h += '</tbody></table>';
        if (res.rA !== res.rAmp) {
          h += err('Los rangos <b>no</b> coinciden: ' + k('\\operatorname{rg}(A) \\neq \\operatorname{rg}(A^{*})') +
            '. Por el teorema, el sistema es <b>incompatible</b>.');
          h += info('Interpretaci\u00f3n: la columna de t\u00e9rminos independientes aporta informaci\u00f3n nueva que ' +
            'no est\u00e1 en los coeficientes, y esa informaci\u00f3n contradice al resto.');
        } else if (res.rA === n) {
          h += ok('Los rangos coinciden y valen ' + res.rA + ', igual que el n\u00famero de inc\u00f3gnitas: ' +
            '<b>compatible determinado</b>, con soluci\u00f3n \u00fanica.');
          h += kd(S.texSolucion(res));
        } else {
          h += ok('Los rangos coinciden y valen ' + res.rA + ', <b>menor</b> que el n\u00famero de inc\u00f3gnitas: ' +
            '<b>compatible indeterminado</b>, con infinitas soluciones y ' + res.libertad +
            ' grado' + (res.libertad === 1 ? '' : 's') + ' de libertad.');
          h += kd(S.texSolucion(res));
        }
        h += kd('\\operatorname{rg}(A) = \\operatorname{rg}(A^{*}) = r \\;\\begin{cases} r = n & \\text{SCD} \\\\ r < n & \\text{SCI}\\end{cases} \\qquad \\operatorname{rg}(A) \\neq \\operatorname{rg}(A^{*}) \\Rightarrow \\text{SI}');
        h += info('Un detalle que conviene entender: el rango de ' + k('A^{*}') + ' solo puede ser igual al de ' +
          k('A') + ' o <b>uno m\u00e1s</b>, porque la ampliada tiene exactamente una columna adicional. ' +
          'No hay m\u00e1s casos posibles.');
        return h;
      });
  });

  S.reg('rouchegrado', function (node) {
    build(node, 'Applet \u00b7 Grados de libertad',
      'Cuando un sistema es compatible indeterminado, el n\u00famero de par\u00e1metros de los que depende la ' +
      'soluci\u00f3n es ' + k('n - r') + ': inc\u00f3gnitas menos rango. ' + FORMATO +
      '<br>Prueba con sistemas de rango bajo: <code>1 1 1 3<br>2 2 2 6</code> (rango 1, dos par\u00e1metros) \u00b7 ' +
      '<code>1 1 1 3<br>1 -1 0 1</code> (rango 2, un par\u00e1metro).',
      [{ id: 'S', label: 'Sistema', rows: 4, value: '1 1 1 3\n2 2 2 6' }],
      function (v) {
        var p = need(v.S);
        if (p.err) return err(p.err);
        var n = p.n, res = S.analiza(p.A, p.b);
        var h = '<div class="mx-flex">' + kd(S.texSistema(p.A, p.b)) + '</div>';
        h += '<p>' + S.etiqueta(res.tipo) + '</p>';
        if (res.tipo === 'SI') {
          return h + err('El sistema es incompatible, as\u00ed que no tiene sentido hablar de grados de libertad: ' +
            'no hay ninguna soluci\u00f3n de la que hablar.');
        }
        h += kd('n - r = ' + n + ' - ' + res.rA + ' = ' + (n - res.rA));
        if (res.libertad === 0) {
          h += ok('Cero grados de libertad: la soluci\u00f3n es <b>\u00fanica</b>, sin ning\u00fan par\u00e1metro.');
        } else {
          h += ok('Hay <b>' + res.libertad + '</b> grado' + (res.libertad === 1 ? '' : 's') + ' de libertad, ' +
            'as\u00ed que la soluci\u00f3n depende de ' + res.libertad + ' par\u00e1metro' +
            (res.libertad === 1 ? '' : 's') + ' independiente' + (res.libertad === 1 ? '' : 's') + '.');
          h += '<p>Inc\u00f3gnitas que quedan libres: ' +
            res.libres.map(function (c) { return k(nombre(c, n)); }).join(', ') + '.</p>';
        }
        h += kd(S.texSolucion(res));
        h += info('Y de aqu\u00ed sale una consecuencia \u00fatil: el n\u00famero de <b>ecuaciones que de verdad ' +
          'aportan informaci\u00f3n</b> es el rango, no el n\u00famero de ecuaciones escritas. En el primer ejemplo ' +
          'de las instrucciones hay dos ecuaciones pero solo una es \u00fatil, porque la segunda es el doble de la primera.');
        h += warn('Y una precisi\u00f3n sobre la elecci\u00f3n de par\u00e1metros: se puede elegir <b>cu\u00e1l</b> ' +
          'inc\u00f3gnita hace de par\u00e1metro, y por eso dos alumnos pueden dar respuestas con aspecto distinto ' +
          'y ambas correctas. Lo que no cambia es <b>cu\u00e1ntos</b> par\u00e1metros hacen falta.');
        return h;
      });
  });

  S.reg('anadir', function (node) {
    build(node, 'Applet \u00b7 A\u00f1adir una ecuaci\u00f3n',
      'Ejercicio cl\u00e1sico: dado un sistema, a\u00f1adir una ecuaci\u00f3n para que resulte de un tipo concreto. ' +
      'Escribe el sistema de partida y la ecuaci\u00f3n que quieres a\u00f1adir, y el applet te dice qu\u00e9 has conseguido. ' +
      'Sistema del libro: <code>2 2 -1 1<br>-1 -1 1 3</code>. Prueba a a\u00f1adir <code>1 0 0 0</code>, ' +
      'luego <code>1 1 0 4</code>, y luego <code>4 4 -2 0</code>.',
      [
        { id: 'S', label: 'Sistema de partida', rows: 3, value: '2 2 -1 1\n-1 -1 1 3' },
        { id: 'E', label: 'Ecuaci\u00f3n que se a\u00f1ade', rows: 2, value: '1 0 0 0' }
      ],
      function (v) {
        var p = need(v.S);
        if (p.err) return err(p.err);
        var q = need(v.E);
        if (q.err) return err(q.err);
        if (q.m !== 1) return err('A\u00f1ade <b>una sola</b> ecuaci\u00f3n. Has escrito ' + q.m + '.');
        if (q.n !== p.n) return err('La ecuaci\u00f3n nueva tiene ' + q.n + ' inc\u00f3gnitas y el sistema ' + p.n +
          '. Deben coincidir: pon ceros donde una inc\u00f3gnita no aparezca.');
        var n = p.n;
        var antes = S.analiza(p.A, p.b);
        var A2 = p.A.concat(q.A), b2 = p.b.concat(q.b);
        var despues = S.analiza(A2, b2);
        var h = '<p><b>Antes:</b> ' + S.etiqueta(antes.tipo) + ', con rangos ' + antes.rA + ' y ' + antes.rAmp + '.</p>';
        h += '<div class="mx-flex">' + kd(S.texSistema(p.A, p.b)) + '</div>';
        h += '<p><b>Ecuaci\u00f3n a\u00f1adida:</b></p>';
        h += '<div class="mx-flex">' + kd(S.texSistema(q.A, q.b)) + '</div>';
        h += '<p><b>Despu\u00e9s:</b> ' + S.etiqueta(despues.tipo) + ', con rangos ' + despues.rA + ' y ' + despues.rAmp + '.</p>';
        h += '<div class="mx-flex">' + kd(S.texSistema(A2, b2)) + '</div>';
        if (despues.tipo === 'SCD') {
          h += ok('Has conseguido un sistema <b>compatible determinado</b>. La ecuaci\u00f3n nueva ha aportado ' +
            'informaci\u00f3n independiente, subiendo el rango hasta igualar el n\u00famero de inc\u00f3gnitas.');
          h += kd(S.texSolucion(despues));
        } else if (despues.tipo === 'SCI') {
          h += ok('Sigue siendo <b>compatible indeterminado</b>. La ecuaci\u00f3n a\u00f1adida es <b>combinaci\u00f3n ' +
            'lineal</b> de las anteriores: no aporta nada nuevo, aunque parezca distinta.');
          h += kd(S.texSolucion(despues));
        } else {
          h += err('Has hecho el sistema <b>incompatible</b>. La ecuaci\u00f3n nueva contradice a las anteriores: ' +
            'sus coeficientes son compatibles con ellas, pero su t\u00e9rmino independiente no.');
        }
        h += info('La receta para cada objetivo. Para <b>SCD</b>: una ecuaci\u00f3n con coeficientes que no ' +
          'sean combinaci\u00f3n de los anteriores. Para <b>SCI</b>: una combinaci\u00f3n lineal exacta de las ' +
          'que ya hay, t\u00e9rmino independiente incluido. Para <b>SI</b>: copiar los coeficientes de una ' +
          'combinaci\u00f3n lineal pero <b>cambiar</b> el t\u00e9rmino independiente.');
        return h;
      });
  });

  /* ==================================================================
     PARTE 5 · REGLA DE CRAMER
     ================================================================== */

  S.reg('cramercheck', function (node) {
    build(node, 'Applet \u00b7 \u00bfSe puede aplicar Cramer?',
      'Antes de calcular nada hay que comprobar dos condiciones: <b>tantas ecuaciones como inc\u00f3gnitas</b> y ' +
      '<b>determinante distinto de cero</b>. ' + FORMATO + '<br>Prueba: ' +
      '<code>2 1 2<br>-3 -2 -1</code> (s\u00ed) \u00b7 <code>1 1 1 2<br>1 -1 0 0</code> (no, faltan ecuaciones) \u00b7 ' +
      '<code>1 1 2<br>2 2 4</code> (no, determinante cero).',
      [{ id: 'S', label: 'Sistema', rows: 4, value: '2 1 2\n-3 -2 -1' }],
      function (v) {
        var p = need(v.S);
        if (p.err) return err(p.err);
        var n = p.n;
        var h = '<div class="mx-flex">' + kd(S.texSistema(p.A, p.b)) + '</div>';
        var c1 = (p.m === n);
        h += '<table class="ap-tbl"><thead><tr><th>Condici\u00f3n</th><th>Tu sistema</th><th>\u00bfSe cumple?</th></tr></thead><tbody>';
        h += '<tr><td>Tantas ecuaciones como inc\u00f3gnitas</td><td>' + p.m + ' y ' + n +
          '</td><td>' + (c1 ? '\u2714 s\u00ed' : '\u2717 no') + '</td></tr>';
        if (c1) {
          var d = S.det(p.A);
          var c2 = !F.isZero(d);
          h += '<tr><td>' + k('|A| \\neq 0') + '</td><td>' + k('|A| = ' + F.tex(d)) +
            '</td><td>' + (c2 ? '\u2714 s\u00ed' : '\u2717 no') + '</td></tr>';
          h += '</tbody></table>';
          h += c2
            ? ok('Se puede aplicar Cramer. Y adem\u00e1s sabemos ya, sin m\u00e1s cuentas, que el sistema es ' +
              '<b>compatible determinado</b>: como ' + k('|A| \\neq 0') + ', los dos rangos valen ' + n +
              ' y por Rouch\u00e9-Frobenius la soluci\u00f3n es \u00fanica.')
            : err('No se puede aplicar Cramer en su forma directa, porque ' + k('|A| = 0') +
              '. El sistema puede ser incompatible o compatible indeterminado; averígualo con Rouch\u00e9-Frobenius ' +
              'y, si es compatible, usa la <b>generalizaci\u00f3n</b> de Cramer de la parte 6.');
        } else {
          h += '</tbody></table>';
          h += err('Cramer en su forma directa exige una matriz de coeficientes <b>cuadrada</b>. ' +
            'Con ' + p.m + ' ecuaciones y ' + n + ' inc\u00f3gnitas no lo es, as\u00ed que no hay determinante ' +
            'que calcular. Usa la generalizaci\u00f3n de la parte 6.');
        }
        var res = S.analiza(p.A, p.b);
        h += info('Para tu informaci\u00f3n, el sistema es ' + S.etiqueta(res.tipo) + '.');
        return h;
      });
  });

  S.reg('cramer', function (node) {
    build(node, 'Applet \u00b7 Regla de Cramer',
      'Cada inc\u00f3gnita se obtiene como un cociente de determinantes: en el numerador se <b>sustituye</b> su ' +
      'columna por la de t\u00e9rminos independientes. ' + FORMATO + '<br>Ejemplo del libro: ' +
      '<code>2 -3 1 -2<br>-2 0 -2 0<br>3 -2 -3 4</code>, que da ' + k('x=1, y=1, z=-1') + '.',
      [{ id: 'S', label: 'Sistema', rows: 5, value: '2 -3 1 -2\n-2 0 -2 0\n3 -2 -3 4' }],
      function (v) {
        var p = need(v.S);
        if (p.err) return err(p.err);
        var n = p.n;
        var h = '<div class="mx-flex">' + kd(S.texSistema(p.A, p.b)) + '</div>';
        var cr = S.cramer(p.A, p.b);
        if (cr.err) {
          h += err(cr.err);
          var res0 = S.analiza(p.A, p.b);
          h += info('El sistema es ' + S.etiqueta(res0.tipo) + '. Si es compatible, la parte 6 explica c\u00f3mo ' +
            'usar Cramer de todos modos.');
          return h;
        }
        h += '<div class="mx-flex">' + viewDet(p.A, { name: '|A|' }) + k('= ' + F.tex(cr.det)) + '</div>';
        h += ok('Como ' + k('|A| \\neq 0') + ', el sistema es compatible determinado y Cramer es aplicable.');
        cr.dets.forEach(function (dj, j) {
          h += '<div class="mx-step"><span class="mx-step-lab">Sustituimos la columna de ' +
            k(nombre(j, n)) + '</span>' + viewDet(dj.M, { hiCol: j }) + k('= ' + F.tex(dj.val)) + '</div>';
        });
        h += '<p><b>Soluci\u00f3n:</b></p>';
        var lineas = cr.sol.map(function (s, j) {
          return nombre(j, n) + ' = \\frac{' + F.tex(cr.dets[j].val) + '}{' + F.tex(cr.det) + '} = ' + F.tex(s);
        });
        h += kd('\\begin{aligned}' + lineas.join(' \\\\ ') + '\\end{aligned}');
        /* Comprobación */
        var X = cr.sol.map(function (x) { return [x]; });
        var comp = S.mulM(p.A, X);
        var B = p.b.map(function (x) { return [x]; });
        h += '<div class="mx-flex"><span>Comprobaci\u00f3n:</span>' + view(comp) + '<span>debe ser</span>' + view(B) + '</div>';
        h += S.eqM(comp, B)
          ? ok('Coincide. Sustituir la soluci\u00f3n en el sistema original detecta al instante cualquier error ' +
            'de signo en los determinantes.')
          : err('No coincide: revisa los datos.');
        h += warn('El descuido t\u00edpico: sustituir la columna equivocada. Para ' + k('y') +
          ' se cambia la <b>segunda</b> columna, no la primera. Y el denominador es siempre el mismo, ' +
          k('|A|') + ', para todas las inc\u00f3gnitas.');
        return h;
      });
  });

  S.reg('cramergen', function (node) {
    build(node, 'Applet \u00b7 Cramer generalizado',
      'Cramer sirve tambi\u00e9n para sistemas <b>compatibles indeterminados</b>, y para sistemas con distinto ' +
      'n\u00famero de ecuaciones que de inc\u00f3gnitas. La idea: quedarse con tantas ecuaciones como el rango, ' +
      'y pasar al segundo miembro las inc\u00f3gnitas que sobran, convirti\u00e9ndolas en par\u00e1metros. ' +
      FORMATO + '<br>Ejemplo del libro: <code>3 1 -1 2<br>-2 1 -1 1<br>1 2 -2 3</code>, ' +
      'que es de rango 2 con tres inc\u00f3gnitas.',
      [{ id: 'S', label: 'Sistema', rows: 5, value: '3 1 -1 2\n-2 1 -1 1\n1 2 -2 3' }],
      function (v) {
        var p = need(v.S);
        if (p.err) return err(p.err);
        var n = p.n, res = S.analiza(p.A, p.b);
        var h = '<div class="mx-flex">' + kd(S.texSistema(p.A, p.b)) + '</div>';
        h += '<p>Rangos: ' + k('\\operatorname{rg}(A) = ' + res.rA) + ' y ' +
          k('\\operatorname{rg}(A^{*}) = ' + res.rAmp) + ', con ' + n + ' inc\u00f3gnitas.</p>';
        h += '<p>' + S.etiqueta(res.tipo) + '</p>';
        if (res.tipo === 'SI') {
          return h + err('El sistema es incompatible: no hay nada que resolver, ni con Cramer ni con ning\u00fan ' +
            'otro m\u00e9todo.');
        }
        if (res.tipo === 'SCD' && p.m === n) {
          h += info('Este sistema es cuadrado y compatible determinado, as\u00ed que se puede aplicar Cramer ' +
            'directamente, sin generalizar. Usa el applet anterior.');
        }
        var r = res.rA;
        h += '<p><b>Paso 1.</b> El rango es ' + r + ', luego solo ' + r + ' ecuaci\u00f3n' + (r === 1 ? '' : 'es') +
          ' aporta' + (r === 1 ? '' : 'n') + ' informaci\u00f3n. Nos quedamos con ' + r + ' y descartamos el resto.</p>';
        h += '<p><b>Paso 2.</b> Elegimos ' + r + ' inc\u00f3gnita' + (r === 1 ? '' : 's') +
          ' como principales, las de los pivotes: ' +
          res.rref.piv.map(function (c) { return k(nombre(c, n)); }).join(', ') +
          '. Las dem\u00e1s pasan al segundo miembro como par\u00e1metros: ' +
          (res.libres.length ? res.libres.map(function (c) { return k(nombre(c, n)); }).join(', ') : 'ninguna') + '.</p>';
        h += '<p><b>Paso 3.</b> Aplicamos Cramer al sistema reducido, de ' + r + '\u00d7' + r + '. Resultado:</p>';
        h += kd(S.texSolucion(res));
        h += info('Fíjate en lo que se ha conseguido: un sistema que <b>no</b> era cuadrado se ha convertido ' +
          'en uno que s\u00ed lo es, a cambio de arrastrar par\u00e1metros. Y Cramer vuelve a funcionar.');
        h += warn('Al elegir qu\u00e9 inc\u00f3gnitas pasan al segundo miembro hay una condici\u00f3n: el menor ' +
          'que forman las inc\u00f3gnitas que se quedan debe ser <b>distinto de cero</b>. Si eliges mal, el ' +
          'sistema reducido no tiene soluci\u00f3n \u00fanica y el m\u00e9todo se atasca.');
        return h;
      });
  });

  /* ==================================================================
     PARTE 7 · SISTEMAS HOMOGÉNEOS
     ================================================================== */

  S.reg('homogeneo', function (node) {
    build(node, 'Applet \u00b7 Sistemas homog\u00e9neos',
      'Un sistema es <b>homog\u00e9neo</b> cuando todos los t\u00e9rminos independientes son cero. ' +
      'Escribe solo los coeficientes, sin la columna de ceros: el applet la a\u00f1ade. ' +
      'Ejemplos del libro: <code>2 -3 1<br>-2 0 -2<br>0 -3 -1</code> \u00b7 ' +
      '<code>5 -1 2<br>-2 1 -1<br>-1 -1 -1</code> \u00b7 <code>1 1 1<br>2 2 2<br>3 3 3</code>.',
      [{ id: 'A', label: 'Coeficientes (sin t\u00e9rminos independientes)', rows: 4, value: '2 -3 1\n-2 0 -2\n0 -3 -1' }],
      function (v) {
        /* Añadimos la columna de ceros */
        var lineas = String(v.A).trim().split(/[\n;]+/).map(function (r) { return r.trim(); }).filter(function (r) { return r.length; });
        if (!lineas.length) return err('Escribe los coeficientes del sistema.');
        var p = need(lineas.map(function (l) { return l + ' 0'; }).join('\n'));
        if (p.err) return err(p.err);
        var n = p.n, res = S.analiza(p.A, p.b);
        var h = '<div class="mx-flex">' + kd(S.texSistema(p.A, p.b)) + '</div>';
        h += ok('Todo sistema homog\u00e9neo es <b>compatible</b>, sin excepci\u00f3n. El motivo es inmediato: ' +
          'la columna de t\u00e9rminos independientes es de ceros, as\u00ed que no puede aportar rango, y por tanto ' +
          k('\\operatorname{rg}(A) = \\operatorname{rg}(A^{*})') + ' siempre.');
        h += '<p>Rango: <b>' + res.rA + '</b>. Inc\u00f3gnitas: <b>' + n + '</b>.</p>';
        if (res.rA === n) {
          h += ok('Como el rango <b>iguala</b> el n\u00famero de inc\u00f3gnitas, el sistema es compatible ' +
            'determinado y su \u00fanica soluci\u00f3n es la <b>trivial</b>: ' +
            k(res.sol.map(function (t) { return nombre(t.col, n) + ' = 0'; }).join(',\\; ')) + '.');
          if (p.m === n) {
            var d = S.det(p.A);
            h += info('Coherente con el determinante: ' + k('|A| = ' + F.tex(d)) + ' es distinto de cero.');
          }
        } else {
          h += ok('Como el rango es <b>menor</b> que el n\u00famero de inc\u00f3gnitas, hay <b>infinitas</b> ' +
            'soluciones adem\u00e1s de la trivial, con ' + res.libertad + ' par\u00e1metro' +
            (res.libertad === 1 ? '' : 's') + ':');
          h += kd(S.texSolucion(res));
          if (p.m === n) {
            var d2 = S.det(p.A);
            h += info('Coherente con el determinante: ' + k('|A| = ' + F.tex(d2)) + ' se anula, y por eso el ' +
              'rango no es m\u00e1ximo.');
          }
        }
        h += info('Resumen del apartado: un homog\u00e9neo <b>nunca</b> es incompatible. La \u00fanica pregunta ' +
          'es si tiene solo la soluci\u00f3n trivial o infinitas, y eso lo decide el rango frente al n\u00famero ' +
          'de inc\u00f3gnitas. Para sistemas cuadrados, basta mirar si ' + k('|A| = 0') + '.');
        h += warn('La soluci\u00f3n trivial siempre est\u00e1 ahí, pero en general <b>no tiene inter\u00e9s</b>. ' +
          'Cuando un ejercicio pide resolver un homog\u00e9neo, casi siempre lo que busca es la familia ' +
          'param\u00e9trica de soluciones no triviales.');
        return h;
      });
  });

  S.reg('homobase', function (node) {
    build(node, 'Applet \u00b7 Soluciones de un homog\u00e9neo',
      'Las soluciones de un sistema homog\u00e9neo forman una familia con estructura: se generan a partir de ' +
      'unas pocas soluciones b\u00e1sicas. Escribe los coeficientes y el applet muestra los generadores. ' +
      'Prueba: <code>1 1 1</code> (un plano, dos generadores) \u00b7 <code>1 1 1<br>1 -1 0</code> \u00b7 ' +
      '<code>2 1 -1<br>4 2 -2</code>.',
      [{ id: 'A', label: 'Coeficientes', rows: 4, value: '1 1 1\n1 -1 0' }],
      function (v) {
        var lineas = String(v.A).trim().split(/[\n;]+/).map(function (r) { return r.trim(); }).filter(function (r) { return r.length; });
        if (!lineas.length) return err('Escribe los coeficientes.');
        var p = need(lineas.map(function (l) { return l + ' 0'; }).join('\n'));
        if (p.err) return err(p.err);
        var n = p.n, res = S.analiza(p.A, p.b);
        var h = '<div class="mx-flex">' + kd(S.texSistema(p.A, p.b)) + '</div>';
        h += '<p>Rango <b>' + res.rA + '</b> con <b>' + n + '</b> inc\u00f3gnitas, luego hay <b>' +
          res.libertad + '</b> par\u00e1metro' + (res.libertad === 1 ? '' : 's') + ' libre' +
          (res.libertad === 1 ? '' : 's') + '.</p>';
        if (res.libertad === 0) {
          return h + ok('Solo existe la soluci\u00f3n trivial, as\u00ed que no hay generadores que mostrar.');
        }
        h += kd(S.texSolucion(res));
        h += '<p><b>Soluciones generadoras</b>, tomando cada par\u00e1metro igual a 1 y los dem\u00e1s igual a 0:</p>';
        var gens = [];
        res.libres.forEach(function (lc, idx) {
          var vec = [];
          for (var j = 0; j < n; j++) vec.push(R(0));
          vec[lc] = R(1);
          res.sol.forEach(function (t) {
            var c = t.coef[idx];
            vec[t.col] = c ? c.val : R(0);
          });
          gens.push(vec);
        });
        h += '<div class="mx-grid">' + gens.map(function (g, i) {
          return view(g.map(function (x) { return [x]; }), { name: 'v_' + (i + 1) });
        }).join('') + '</div>';
        h += ok('Cualquier soluci\u00f3n del sistema se obtiene combinando estos ' + gens.length +
          ' vectores, y cualquier combinaci\u00f3n de ellos es soluci\u00f3n. Compru\u00e9balo: suma dos de ellos, ' +
          'o multiplica uno por 5, y sustituye en el sistema.');
        h += info('Esa propiedad es exclusiva de los homog\u00e9neos y no la tienen los dem\u00e1s sistemas. ' +
          'Si sumas dos soluciones de un sistema <b>no</b> homog\u00e9neo, lo que obtienes ya no es soluci\u00f3n, ' +
          'porque los t\u00e9rminos independientes se duplicar\u00edan.');
        return h;
      });
  });

  /* ==================================================================
     PARTE 8 · SISTEMAS CON PARÁMETROS
     ================================================================== */

  function evalK(s, kv) {
    s = String(s).trim().replace(/\s+/g, '');
    if (!/^[-+0-9km.\/]+$/.test(s)) return null;
    s = s.replace(/m/g, 'k');
    var a = s.match(/^([+-]?)(\d*(?:\.\d+)?)k([+-]\d+(?:\.\d+)?)?$/);
    if (a) {
      var co = a[2] === '' ? 1 : parseFloat(a[2]);
      if (a[1] === '-') co = -co;
      return co * kv + (a[3] ? parseFloat(a[3]) : 0);
    }
    var b = s.match(/^([+-]?\d+(?:\.\d+)?)([+-])k$/);
    if (b) return parseFloat(b[1]) + (b[2] === '-' ? -kv : kv);
    var num = parseFloat(s);
    return isNaN(num) ? null : num;
  }

  function gridK(txt, kv) {
    var rows = String(txt).trim().split(/[\n;]+/).map(function (r) { return r.trim(); }).filter(function (r) { return r.length; });
    var G = [], c = null;
    for (var i = 0; i < rows.length; i++) {
      var cells = rows[i].split(/[\s,]+/).filter(function (s) { return s.length; });
      var row = [];
      for (var j = 0; j < cells.length; j++) {
        var x = evalK(cells[j], kv);
        if (x === null) return { err: 'No entiendo \u00ab' + cells[j] + '\u00bb. Usa n\u00fameros o expresiones con k o m.' };
        row.push(x);
      }
      if (c === null) c = row.length; else if (row.length !== c) return { err: 'Todas las ecuaciones deben tener el mismo n\u00famero de n\u00fameros.' };
      G.push(row);
    }
    if (!G.length) return { err: 'Escribe un sistema.' };
    return { M: G, m: G.length, n: c - 1 };
  }

  function rankNum(A0) {
    var A = A0.map(function (r) { return r.slice(); });
    var m = A.length, n = A[0].length, r = 0;
    for (var c = 0; c < n && r < m; c++) {
      var p = -1, best = 1e-9;
      for (var i = r; i < m; i++) if (Math.abs(A[i][c]) > best) { best = Math.abs(A[i][c]); p = i; }
      if (p < 0) continue;
      var t = A[r]; A[r] = A[p]; A[p] = t;
      for (var i2 = r + 1; i2 < m; i2++) {
        var f = A[i2][c] / A[r][c];
        for (var kk = c; kk < n; kk++) A[i2][kk] -= f * A[r][kk];
      }
      r++;
    }
    return r;
  }

  function tipoNum(G, n) {
    var A = G.map(function (r) { return r.slice(0, n); });
    var rA = rankNum(A), rAmp = rankNum(G);
    if (rA !== rAmp) return 'SI';
    return (rA === n) ? 'SCD' : 'SCI';
  }

  S.reg('paramrouche', function (node) {
    build(node, 'Applet \u00b7 Discusi\u00f3n con par\u00e1metro',
      'El ejercicio estrella de la prueba de acceso. Usa <code>k</code> o <code>m</code> en los coeficientes ' +
      'o en los t\u00e9rminos independientes: <code>k</code>, <code>-k</code>, <code>2k</code>, <code>k+1</code>, ' +
      '<code>k-1</code>, <code>3k-2</code>. Mueve el deslizador y observa los rangos. ' +
      'Ejemplo del libro: <code>1 1 -1 k<br>1 2 -1 3k<br>2 k -1 6</code>, cr\u00edtico en ' +
      k('k=0') + ' y ' + k('k=2') + '.',
      [
        { id: 'S', label: 'Sistema con par\u00e1metro', rows: 5, value: '1 1 -1 k\n1 2 -1 3k\n2 k -1 6' },
        { id: 'k', label: 'Valor de k', type: 'range', min: -6, max: 6, step: 0.5, value: 1 }
      ],
      function (v) {
        var kv = parseFloat(v.k);
        var g = gridK(v.S, kv);
        if (g.err) return err(g.err);
        var n = g.n, fmt = function (x) { return String(Math.round(x * 10000) / 10000); };
        var Q = g.M.map(function (r) { return r.map(function (x) { return S.parseEntry(fmt(x)) || R(0); }); });
        var A = Q.map(function (r) { return r.slice(0, n); });
        var b = Q.map(function (r) { return r[n]; });
        var res = S.analiza(A, b);
        var h = '<div class="mx-flex"><span>Para ' + k('k = ' + fmt(kv)) + '</span></div>';
        h += '<div class="mx-flex">' + kd(S.texSistema(A, b)) + '</div>';
        h += '<div class="mx-grid">' + view(A, { name: 'A' }) + viewAmp(Q, n, { name: 'A^{*}' }) + '</div>';
        h += '<table class="ap-tbl"><tbody><tr><td>' + k('\\operatorname{rg}(A)') + '</td><td><b>' + res.rA +
          '</b></td></tr><tr><td>' + k('\\operatorname{rg}(A^{*})') + '</td><td><b>' + res.rAmp +
          '</b></td></tr><tr><td>Inc\u00f3gnitas</td><td><b>' + n + '</b></td></tr></tbody></table>';
        h += '<p>' + S.etiqueta(res.tipo) + '</p>';
        if (res.tipo !== 'SI') h += kd(S.texSolucion(res));
        /* Barrido para detectar cambios de tipo */
        var previo = null, cambios = [];
        for (var x = -6; x <= 6.0001; x += 0.5) {
          var gx = gridK(v.S, x);
          if (gx.err) break;
          var t = tipoNum(gx.M, n);
          if (previo !== null && t !== previo) cambios.push({ k: x, de: previo, a: t });
          previo = t;
        }
        if (cambios.length) {
          h += '<p><b>Cambios de clasificaci\u00f3n detectados:</b></p>';
          h += '<table class="ap-tbl"><thead><tr><th>Cerca de</th><th>De</th><th>A</th></tr></thead><tbody>';
          cambios.forEach(function (c) {
            h += '<tr><td>' + k('k \\approx ' + fmt(c.k)) + '</td><td>' + c.de + '</td><td>' + c.a + '</td></tr>';
          });
          h += '</tbody></table>';
          h += ok('Esos son los valores cr\u00edticos que hay que estudiar aparte. Loc\u00e1lizalos con exactitud ' +
            'resolviendo ' + k('|A| = 0') + ' si el sistema es cuadrado, o anulando los menores si no lo es.');
        } else {
          h += info('En el intervalo explorado no cambia la clasificaci\u00f3n. Prueba el ejemplo de las ' +
            'instrucciones, que tiene dos valores cr\u00edticos.');
        }
        h += info('<b>Estrategia de examen.</b> Primero calcula ' + k('|A|') + ' en funci\u00f3n del par\u00e1metro ' +
          'y resuelve ' + k('|A| = 0') + ': esos son los sospechosos. Para el resto de valores, rango m\u00e1ximo y ' +
          'sistema compatible determinado. Y despu\u00e9s, <b>cada valor cr\u00edtico por separado</b>, ' +
          'sustituyendo el n\u00famero y comparando los dos rangos.');
        return h;
      });
  });

  S.reg('paramtabla', function (node) {
    build(node, 'Applet \u00b7 Tabla de casos',
      'Aqu\u00ed se ve la discusi\u00f3n completa de un golpe: el applet recorre valores del par\u00e1metro y ' +
      'agrupa los resultados, que es exactamente la forma en que hay que <b>redactar</b> la respuesta. ' +
      'Usa <code>k</code> o <code>m</code>. Ejemplos: <code>1 1 -1 k<br>1 2 -1 3k<br>2 k -1 6</code> \u00b7 ' +
      '<code>k 1 1 k<br>1 k 1 k<br>1 1 k k</code>.',
      [{ id: 'S', label: 'Sistema con par\u00e1metro', rows: 5, value: '1 1 -1 k\n1 2 -1 3k\n2 k -1 6' }],
      function (v) {
        var g0 = gridK(v.S, 0);
        if (g0.err) return err(g0.err);
        var n = g0.n;
        var fmt = function (x) { return String(Math.round(x * 10000) / 10000); };
        var tramos = [], actual = null;
        for (var x = -6; x <= 6.0001; x += 0.25) {
          var gx = gridK(v.S, x);
          if (gx.err) break;
          var t = tipoNum(gx.M, n);
          if (!actual || actual.tipo !== t) {
            actual = { tipo: t, desde: x, hasta: x, valores: [x] };
            tramos.push(actual);
          } else { actual.hasta = x; actual.valores.push(x); }
        }
        var h = '<p>Recorrido del par\u00e1metro entre \u22126 y 6, de cuarto en cuarto:</p>';
        h += '<table class="ap-tbl"><thead><tr><th>Valores del par\u00e1metro</th><th>Clasificaci\u00f3n</th></tr></thead><tbody>';
        tramos.forEach(function (tr) {
          var etq = (tr.valores.length === 1)
            ? k('k = ' + fmt(tr.desde))
            : k(fmt(tr.desde) + ' \\leq k \\leq ' + fmt(tr.hasta));
          h += '<tr' + (tr.valores.length === 1 ? ' class="mx-pivot"' : '') + '><td>' + etq +
            '</td><td>' + tr.tipo + '</td></tr>';
        });
        h += '</tbody></table>';
        var puntuales = tramos.filter(function (t) { return t.valores.length <= 2; });
        if (puntuales.length) {
          h += ok('Las filas marcadas son los <b>valores cr\u00edticos</b>: tramos de un solo punto donde la ' +
            'clasificaci\u00f3n es distinta de la de su entorno. Son ' +
            puntuales.map(function (t) { return k('k = ' + fmt(t.desde)); }).join(', ') + '.');
          h += '<p><b>As\u00ed se redacta la respuesta:</b></p><ul>';
          tramos.forEach(function (tr) {
            if (tr.valores.length <= 2) {
              h += '<li>Si ' + k('k = ' + fmt(tr.desde)) + ', el sistema es <b>' + tr.tipo + '</b>.</li>';
            }
          });
          var general = tramos.filter(function (t) { return t.valores.length > 2; });
          if (general.length) {
            h += '<li>Para cualquier otro valor de ' + k('k') + ', el sistema es <b>' + general[0].tipo + '</b>.</li>';
          }
          h += '</ul>';
        } else {
          h += info('No se detectan valores cr\u00edticos en el intervalo explorado: la clasificaci\u00f3n es la ' +
            'misma para todos los valores probados.');
        }
        h += warn('El barrido va de cuarto en cuarto, as\u00ed que <b>no encontrar\u00eda</b> un valor cr\u00edtico ' +
          'como ' + k('k = 1/3') + ' ni ' + k('k = \\sqrt{2}') + '. Esta tabla sirve para <b>ver la forma</b> de la ' +
          'discusi\u00f3n y para comprobar tu resultado, nunca para sustituir el c\u00e1lculo algebraico.');
        return h;
      });
  });

  /* ==================================================================
     PARTE 9 · PROBLEMAS
     ================================================================== */

  S.reg('datos', function (node) {
    build(node, 'Applet \u00b7 El consumo de datos del m\u00f3vil',
      'El problema con el que abre la unidad el libro de texto. En 20 d\u00edas has gastado 1292 MB usando ' +
      '5 horas YouTube, 20 horas Twitter y 6 horas Instagram. Adem\u00e1s, YouTube consume 18 MB por hora m\u00e1s ' +
      'que Instagram, y Twitter consume el 15 % de lo que consume YouTube. ' +
      'Cambia los datos y observa c\u00f3mo var\u00eda la soluci\u00f3n.',
      [
        { id: 'mb', label: 'MB gastados', type: 'text', value: '1292' },
        { id: 'hy', label: 'Horas de YouTube', type: 'range', min: 1, max: 20, value: 5 },
        { id: 'ht', label: 'Horas de Twitter', type: 'range', min: 1, max: 40, value: 20 },
        { id: 'hi', label: 'Horas de Instagram', type: 'range', min: 1, max: 20, value: 6 }
      ],
      function (v) {
        var mb = S.parseEntry(v.mb);
        if (!mb) return err('Escribe un n\u00famero de MB v\u00e1lido.');
        var hy = R(parseInt(v.hy, 10)), ht = R(parseInt(v.ht, 10)), hi = R(parseInt(v.hi, 10));
        /* Incógnitas: Y, T, I (MB por hora) */
        var A = [
          [hy, ht, hi],
          [R(1), R(0), R(-1)],
          [R(-3, 20), R(1), R(0)]
        ];
        var b = [mb, R(18), R(0)];
        var h = '<p><b>Planteamiento.</b> Llamamos ' + k('Y') + ', ' + k('T') + ' e ' + k('I') +
          ' a los MB que consume cada aplicaci\u00f3n por hora. Las tres condiciones del enunciado dan:</p>';
        h += kd('\\left\\{\\begin{aligned}' +
          F.tex(hy) + 'Y + ' + F.tex(ht) + 'T + ' + F.tex(hi) + 'I &= ' + F.tex(mb) + ' \\\\ ' +
          'Y - I &= 18 \\\\ ' +
          'T &= 0{,}15\\,Y' +
          '\\end{aligned}\\right.');
        var res = S.analiza(A, b);
        h += '<p>' + S.etiqueta(res.tipo) + '</p>';
        if (res.tipo !== 'SCD') {
          return h + warn('Con estos datos el sistema no tiene soluci\u00f3n \u00fanica. Vuelve a los valores ' +
            'originales del libro: 1292 MB con 5, 20 y 6 horas.');
        }
        var vals = [];
        res.sol.forEach(function (t) { vals[t.col] = t.cte; });
        h += ok('Soluci\u00f3n: YouTube consume ' + k(F.tex(vals[0]) + '\\text{ MB/h}') +
          ', Twitter ' + k(F.tex(vals[1]) + '\\text{ MB/h}') +
          ' e Instagram ' + k(F.tex(vals[2]) + '\\text{ MB/h}') + '.');
        h += info('Con los datos del libro salen exactamente 100, 15 y 82 MB por hora. Y ahora la pregunta ' +
          'que de verdad importa: si tu tarifa te da 2024 MB al mes y sigues este ritmo de consumo, ' +
          '\u00bfte llegan los datos?');
        h += '<hr class="mx-sep">' + warn('Lo interesante del problema es que con <b>una sola</b> ecuaci\u00f3n, ' +
          'la de los 1292 MB, hay infinitas soluciones: tres inc\u00f3gnitas y rango 1. Hacen falta ' +
          '<b>dos ecuaciones m\u00e1s independientes</b> para que la soluci\u00f3n sea \u00fanica. ' +
          'Es Rouch\u00e9-Frobenius aplicado a la factura del m\u00f3vil.');
        return h;
      });
  });

  S.reg('problema', function (node) {
    build(node, 'Applet \u00b7 De enunciado a sistema',
      'La parte m\u00e1s dif\u00edcil de un problema no es resolver el sistema, es <b>plantearlo</b>. ' +
      'Elige uno de los problemas de las fuentes, l\u00e9elo, plantea t\u00fa el sistema en papel y despu\u00e9s ' +
      'escr\u00edbelo aqu\u00ed para comprobar si tu planteamiento da la soluci\u00f3n que dice el enunciado.',
      [
        { id: 'cual', label: 'Problema', type: 'select', value: 'Billetes del cajero',
          options: ['Billetes del cajero', 'Examen de 60 preguntas', 'Comida para gatos', 'Edades de la familia', 'Tres tipos de caf\u00e9'] },
        { id: 'S', label: 'Tu sistema', rows: 5, value: '1 1 1 225\n50 20 10 7000\n1 -2 1 0' }
      ],
      function (v) {
        var textos = {
          'Billetes del cajero': {
            enun: 'El cajero solo admite billetes de 50, 20 y 10 euros. Los viernes depositan 225 billetes ' +
              'por un importe total de 7000 \u20ac. La suma del n\u00famero de billetes de 50 y de 10 es el doble ' +
              'que el n\u00famero de billetes de 20. Averigua cu\u00e1ntos billetes hay de cada valor.',
            sol: 'x = 100 billetes de 50, y = 75 de 20, z = 50 de 10',
            pista: 'Las tres condiciones son: total de billetes, total de euros y la relaci\u00f3n entre cantidades.'
          },
          'Examen de 60 preguntas': {
            enun: 'Un test de 60 preguntas. Cada acierto da 5 puntos, cada fallo quita 2 y cada pregunta ' +
              'no contestada quita 1. Hay que obtener 150 puntos, y adem\u00e1s el n\u00famero de fallos m\u00e1s el ' +
              'qu\u00edntuple de las no contestadas debe igualar al n\u00famero de aciertos.',
            sol: '38 aciertos, 18 fallos y 4 sin contestar',
            pista: 'Tres condiciones: total de preguntas, total de puntos y la relaci\u00f3n del enunciado.'
          },
          'Comida para gatos': {
            enun: 'Tres alimentos por kilo: Migato lleva 600 g de carne, 300 de pescado y 100 de verdura; ' +
              'Catomeal lleva 300, 400 y 300; Comecat lleva 200, 600 y 200. Queremos ofrecer 470 g de carne, ' +
              '370 de pescado y 160 de verdura por kilo de mezcla. \u00bfQu\u00e9 porcentaje de cada uno?',
            sol: '62 % de Migato, 22 % de Catomeal y 16 % de Comecat',
            pista: 'Una ecuaci\u00f3n por cada ingrediente: carne, pescado y verdura.'
          },
          'Edades de la familia': {
            enun: 'Padre, madre e hija suman 70 a\u00f1os. Hace cuatro a\u00f1os la edad del padre era siete veces ' +
              'la de la hija. Dentro de quince a\u00f1os la edad de la hija ser\u00e1 la cuarta parte de la suma de ' +
              'las edades del padre y de la madre.',
            sol: 'padre 32, madre 30, hija 8',
            pista: 'Cuidado con los desplazamientos temporales: hace cuatro a\u00f1os todos ten\u00edan cuatro menos.'
          },
          'Tres tipos de caf\u00e9': {
            enun: 'Caf\u00e9 A a 6 \u20ac/kg, B a 8 \u20ac/kg y C a 10 \u20ac/kg. Se quiere una mezcla de 80 kg ' +
              'para vender a 7 \u20ac/kg, y del primer tipo debe entrar el doble del segundo m\u00e1s el tercero.',
            sol: '60 kg de A, 0 kg de B y 20 kg de C',
            pista: 'Tres condiciones: kilos totales, precio total de la mezcla y la relaci\u00f3n entre cantidades.'
          }
        };
        var t = textos[v.cual];
        var h = '<div class="mx-info"><b>Enunciado.</b> ' + t.enun + '</div>';
        h += '<p><b>Pista para plantear:</b> ' + t.pista + '</p>';
        var p = need(v.S);
        if (p.err) return h + err(p.err);
        h += '<p><b>Tu sistema:</b></p><div class="mx-flex">' + kd(S.texSistema(p.A, p.b)) + '</div>';
        var res = S.analiza(p.A, p.b);
        h += '<p>' + S.etiqueta(res.tipo) + '</p>';
        if (res.tipo === 'SI') {
          h += err('Tu sistema es incompatible, as\u00ed que hay un error en el planteamiento: dos de tus ' +
            'condiciones se contradicen. Revisa los signos.');
        } else if (res.tipo === 'SCI') {
          h += warn('Tu sistema tiene infinitas soluciones, lo que suele significar que te falta una ' +
            'condici\u00f3n del enunciado, o que has escrito dos veces la misma con otro aspecto.');
          h += kd(S.texSolucion(res));
        } else {
          h += ok('Sistema compatible determinado. Tu soluci\u00f3n es:');
          h += kd(S.texSolucion(res));
          h += '<p>Y la respuesta del enunciado es: <b>' + t.sol + '</b>.</p>';
          h += info('Si coincide, tu planteamiento era correcto. Si no, el error est\u00e1 en alguna ecuaci\u00f3n, ' +
            'no en el c\u00e1lculo: comp\u00e1ralas una a una con las condiciones del texto.');
        }
        h += warn('Consejo de m\u00e9todo que vale para todos los problemas: <b>empieza escribiendo qu\u00e9 ' +
          'significa cada inc\u00f3gnita</b>, con sus unidades. Parece una p\u00e9rdida de tiempo y es justo lo ' +
          'contrario: la mitad de los errores de planteamiento vienen de no tenerlo claro.');
        return h;
      });
  });

  /* ==================================================================
     ENTRENADOR
     ================================================================== */

  S.reg('entrenador', function (node) {
    node.classList.add('applet');
    node.innerHTML = '<h4 class="mx-title">Applet \u00b7 Entrenador de sistemas</h4>' +
      '<div class="mx-instr">Aqu\u00ed resuelves t\u00fa. El applet propone un sistema, lo trabajas <b>en papel</b> ' +
      'y escribes la respuesta. Para clasificar escribe <code>SCD</code>, <code>SCI</code> o <code>SI</code>. ' +
      'Para resolver, escribe los valores separados por espacios, admitiendo fracciones como <code>3/4</code>. ' +
      'Pulsa <i>Comprobar</i> y luego <i>Otro ejercicio</i>.</div>' +
      '<div class="mx-inputs"></div><div class="mx-out ap-out"></div>';
    var box = node.querySelector('.mx-inputs'), out = node.querySelector('.mx-out');

    var sel = document.createElement('select');
    sel.className = 'mx-in';
    ['Clasificar', 'Resolver 2\u00d72', 'Resolver 3\u00d73', 'Cramer 2\u00d72', 'Homog\u00e9neo'].forEach(function (o) {
      var op = document.createElement('option'); op.value = o; op.textContent = o; sel.appendChild(op);
    });
    var l1 = document.createElement('label');
    l1.className = 'mx-field'; l1.innerHTML = '<span>Tipo de ejercicio</span>'; l1.appendChild(sel);

    var resp = document.createElement('input');
    resp.type = 'text'; resp.className = 'mx-in';
    var l2 = document.createElement('label');
    l2.className = 'mx-field'; l2.innerHTML = '<span>Tu respuesta</span>'; l2.appendChild(resp);

    var bC = document.createElement('button');
    bC.className = 'mx-btn'; bC.type = 'button'; bC.textContent = 'Comprobar';
    var bS = document.createElement('button');
    bS.className = 'mx-btn mx-sec'; bS.type = 'button'; bS.textContent = 'Ver soluci\u00f3n';
    var bN = document.createElement('button');
    bN.className = 'mx-btn mx-sec'; bN.type = 'button'; bN.textContent = 'Otro ejercicio';
    var w = document.createElement('div');
    w.className = 'mx-field'; w.innerHTML = '<span>&nbsp;</span>';
    var row = document.createElement('div');
    row.className = 'mx-flex';
    row.appendChild(bC); row.appendChild(bS); row.appendChild(bN);
    w.appendChild(row);

    box.appendChild(l1); box.appendChild(l2); box.appendChild(w);

    var est = { enun: '', tipo: '', esperado: null, res: null, n: 0 };
    var aciertos = 0, intentos = 0;

    function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

    function nuevo() {
      est.tipo = sel.value;
      var n, A, b, h;
      if (est.tipo === 'Clasificar') {
        n = 3;
        A = []; b = [];
        for (var i = 0; i < 3; i++) {
          A.push([R(rnd(-3, 4)), R(rnd(-3, 4)), R(rnd(-3, 4))]);
          b.push(R(rnd(-5, 6)));
        }
        var dado = rnd(1, 3);
        if (dado === 2) {
          A[2] = A[0].map(function (x, j) { return F.add(x, A[1][j]); });
          b[2] = F.add(b[0], b[1]);
        } else if (dado === 3) {
          A[2] = A[0].map(function (x, j) { return F.add(x, A[1][j]); });
          b[2] = F.add(F.add(b[0], b[1]), R(1));
        }
        est.res = S.analiza(A, b);
        est.esperado = est.res.tipo;
        h = '<p><b>Clasifica</b> este sistema, escribiendo SCD, SCI o SI:</p>';
      } else if (est.tipo === 'Homog\u00e9neo') {
        n = 3;
        A = [];
        for (var i2 = 0; i2 < 3; i2++) A.push([R(rnd(-3, 4)), R(rnd(-3, 4)), R(rnd(-3, 4))]);
        if (rnd(1, 2) === 1) A[2] = A[0].map(function (x, j) { return F.add(x, A[1][j]); });
        b = [R(0), R(0), R(0)];
        est.res = S.analiza(A, b);
        est.esperado = est.res.tipo;
        h = '<p><b>Clasifica</b> este sistema homog\u00e9neo. \u00bfSolo tiene la trivial (SCD) o infinitas (SCI)?</p>';
      } else {
        n = (est.tipo === 'Resolver 3\u00d73') ? 3 : 2;
        var intentos2 = 0;
        do {
          A = []; b = [];
          for (var i3 = 0; i3 < n; i3++) {
            var fila = [];
            for (var j3 = 0; j3 < n; j3++) fila.push(R(rnd(-3, 4)));
            A.push(fila);
          }
          var sols = [];
          for (var q = 0; q < n; q++) sols.push(R(rnd(-3, 4)));
          b = A.map(function (fila) {
            var s = R(0);
            for (var j4 = 0; j4 < n; j4++) s = F.add(s, F.mul(fila[j4], sols[j4]));
            return s;
          });
          intentos2++;
        } while (F.isZero(S.det(A)) && intentos2 < 60);
        est.res = S.analiza(A, b);
        est.esperado = est.res.sol.map(function (t) { return t.cte; });
        h = '<p><b>Resuelve</b> el sistema' + (est.tipo.indexOf('Cramer') === 0 ? ' aplicando la regla de Cramer' : '') +
          ' y escribe los valores separados por espacios:</p>';
      }
      est.n = n;
      h += '<div class="mx-flex">' + kd(S.texSistema(A, b)) + '</div>';
      est.enun = h;
      resp.value = '';
      out.innerHTML = h + info('Trabaja en papel, escribe la respuesta y pulsa <i>Comprobar</i>. ' +
        'Marcador: ' + aciertos + ' de ' + intentos + '.');
      S.renderTex(out);
    }

    function comprobar() {
      intentos++;
      var h = est.enun;
      var txt = String(resp.value).trim();
      if (typeof est.esperado === 'string') {
        var mio = txt.toUpperCase().replace(/[^A-Z]/g, '');
        if (mio === est.esperado) { aciertos++; h += ok('\u00a1Correcto! Es ' + S.etiqueta(est.esperado) + '.'); }
        else {
          h += err('No. La respuesta correcta es <b>' + est.esperado + '</b>, y t\u00fa has escrito <b>' +
            (mio || '(nada)') + '</b>.');
          h += info('Compara los dos rangos: ' + k('\\operatorname{rg}(A) = ' + est.res.rA) + ' y ' +
            k('\\operatorname{rg}(A^{*}) = ' + est.res.rAmp) + ', con ' + est.res.n + ' inc\u00f3gnitas.');
        }
      } else {
        var partes = txt.split(/[\s,]+/).filter(function (s) { return s.length; });
        if (partes.length !== est.n) {
          out.innerHTML = h + err('Escribe ' + est.n + ' valores separados por espacios.');
          S.renderTex(out); return;
        }
        var mios = [], malo = false;
        partes.forEach(function (s) {
          var q = S.parseEntry(s);
          if (!q) malo = true; else mios.push(q);
        });
        if (malo) { out.innerHTML = h + err('Alg\u00fan valor no se entiende. Usa enteros, decimales con punto o fracciones como 3/4.'); S.renderTex(out); return; }
        var bien = mios.every(function (q, j) { return F.eq(q, est.esperado[j]); });
        if (bien) { aciertos++; h += ok('\u00a1Correcto!'); }
        else {
          h += err('No coincide. Lo correcto es ' +
            est.esperado.map(function (q, j) { return k(nombre(j, est.n) + ' = ' + F.tex(q)); }).join(', ') + '.');
          h += info('Sustituye tus valores en la primera ecuaci\u00f3n y ver\u00e1s enseguida si el fallo est\u00e1 ' +
            'ahí o en una de las otras.');
        }
      }
      h += '<p class="mx-mono">Marcador: ' + aciertos + ' de ' + intentos + '.</p>';
      out.innerHTML = h;
      S.renderTex(out);
    }

    function solucion() {
      var h = est.enun;
      if (typeof est.esperado === 'string') h += info('Soluci\u00f3n: es ' + S.etiqueta(est.esperado) + '.');
      else h += info('Soluci\u00f3n: ' + est.esperado.map(function (q, j) {
        return k(nombre(j, est.n) + ' = ' + F.tex(q));
      }).join(', '));
      h += warn('Mirar la soluci\u00f3n antes de intentarlo produce la sensaci\u00f3n de haber aprendido ' +
        'sin haber aprendido. Ese autoenga\u00f1o se paga el d\u00eda del examen.');
      out.innerHTML = h;
      S.renderTex(out);
    }

    bC.addEventListener('click', comprobar);
    bS.addEventListener('click', solucion);
    bN.addEventListener('click', nuevo);
    sel.addEventListener('change', nuevo);
    nuevo();
  });

  /* ==================================================================
     DIAGNÓSTICO
     ================================================================== */

  S.reg('diagnostico', function (node) {
    node.classList.add('applet');

    function fila(nombre2, valor, bien) {
      return '<tr><td>' + nombre2 + '</td><td style="color:' + (bien ? '#1b5e20' : '#b71c1c') +
        ';font-weight:600">' + valor + (bien ? ' \u2714' : ' \u2717') + '</td></tr>';
    }

    var esperadas = ['anadir', 'clasifica', 'cramer', 'cramercheck', 'cramergen', 'datos',
      'diagnostico', 'ecuacionlineal', 'entrenador', 'escalonado', 'gauss', 'gaussdisc',
      'gaussparam', 'grafico2', 'homobase', 'homogeneo', 'inversamat', 'matricial',
      'paramrouche', 'paramtabla', 'problema', 'rouche', 'rouchegrado'];
    var faltan = esperadas.filter(function (c) { return !S.registry[c]; });
    var nReg = Object.keys(S.registry).length;

    var tA = F.eq(F.add(R(1, 3), R(1, 6)), R(1, 2));
    var A1 = [[R(1), R(1)], [R(1), R(-1)]];
    var b1 = [R(3), R(1)];
    var r1 = S.analiza(A1, b1);
    var tSCD = (r1.tipo === 'SCD' && F.eq(r1.sol[0].cte, R(2)) && F.eq(r1.sol[1].cte, R(1)));
    var A2 = [[R(1), R(1)], [R(2), R(2)]];
    var tSI = (S.analiza(A2, [R(3), R(7)]).tipo === 'SI');
    var tSCI = (S.analiza(A2, [R(3), R(6)]).tipo === 'SCI');
    var cr = S.cramer(A1, b1);
    var tCr = (!cr.err && F.eq(cr.sol[0], R(2)));
    var tHom = (S.analiza([[R(1), R(1), R(1)]], [R(0)]).libertad === 2);
    var cssOk = getComputedStyle(node).paddingTop !== '0px';

    var h = '<h4 class="mx-title">Applet \u00b7 Diagn\u00f3stico del motor</h4><table class="ap-tbl"><tbody>';
    h += fila('N\u00facleo <code>window.SIS</code>', window.SIS ? 'activo' : 'ausente', !!window.SIS);
    h += fila('KaTeX local <code>window.katex</code>', window.katex ? 'cargado' : 'AUSENTE', !!window.katex);
    h += fila('Hoja <code>applets.css</code>', cssOk ? 'aplicada' : 'no aplicada', cssOk);
    h += fila('Applets registrados', String(nReg) + (faltan.length ? ' (faltan: ' + faltan.join(', ') + ')' : ''), faltan.length === 0);
    h += fila('Aritm\u00e9tica exacta', '1/3 + 1/6 = 1/2', tA);
    h += fila('Sistema determinado', 'x = 2, y = 1', tSCD);
    h += fila('Sistema incompatible', 'detectado', tSI);
    h += fila('Sistema indeterminado', 'detectado', tSCI);
    h += fila('Regla de Cramer', 'x = 2', tCr);
    h += fila('Grados de libertad', '2 con un plano', tHom);
    h += '</tbody></table>';
    h += '<p class="mx-mono" data-sis-count="1">contando applets\u2026</p>';
    h += '<p class="mx-mono">claves: ' + Object.keys(S.registry).sort().join(' \u00b7 ') + '</p>';
    node.innerHTML = h;
    S.renderTex(node);

    setTimeout(function () {
      var todos = document.querySelectorAll('[data-applet-sis]');
      var mont = document.querySelectorAll('[data-applet-sis][data-mounted="1"]');
      var sin = [];
      for (var i = 0; i < todos.length; i++) {
        if (todos[i].getAttribute('data-mounted') !== '1') sin.push(todos[i].getAttribute('data-applet-sis'));
      }
      var dest = node.querySelector('[data-sis-count="1"]');
      if (!dest) return;
      var bien = (mont.length === todos.length);
      dest.innerHTML = 'applets en la pagina: ' + todos.length + ', montados: ' + mont.length + (bien ? ' \u2714' : ' \u2717');
      dest.style.color = bien ? '#1b5e20' : '#b71c1c';
      dest.style.fontWeight = '600';
      if (!bien) {
        var av = document.createElement('div');
        av.className = 'mx-bad';
        av.innerHTML = 'Sin montar: <code>' + sin.join('</code>, <code>') + '</code>.';
        node.appendChild(av);
      }
      if (S.log.length) {
        var e2 = document.createElement('div');
        e2.className = 'mx-warn';
        e2.innerHTML = 'Incidencias en <code>window.SIS.log</code>: ' + S.log.length +
          '. Consulta la consola con <code>SIS.log</code>.';
        node.appendChild(e2);
      }
    }, 120);
  });

  /* ------------------------------------------------------------------
     MONTAJE DE LOS NODOS PENDIENTES
     ------------------------------------------------------------------ */

  function mount() {
    var nodes = document.querySelectorAll('[data-applet-sis]');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.getAttribute('data-mounted') === '1') continue;
      var key = node.getAttribute('data-applet-sis');
      var fn = S.registry[key];
      node.setAttribute('data-mounted', '1');
      if (!fn) {
        node.classList.add('applet');
        node.innerHTML = '<div class="mx-bad ap-err">No existe ning\u00fan applet con la clave <code>' +
          S.esc(key) + '</code>. Claves disponibles: <code>' +
          Object.keys(S.registry).sort().join('</code>, <code>') + '</code>.</div>';
        S.log.push({ clave: key, error: 'clave inexistente' });
        continue;
      }
      try { fn(node); }
      catch (e) {
        node.classList.add('applet');
        node.innerHTML = '<div class="mx-bad ap-err">El applet <code>' + S.esc(key) +
          '</code> no ha podido montarse: ' + S.esc(e.message) + '</div>';
        S.log.push({ clave: key, error: e.message, stack: e.stack });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(mount, 0); });
  } else {
    setTimeout(mount, 0);
  }
})();
