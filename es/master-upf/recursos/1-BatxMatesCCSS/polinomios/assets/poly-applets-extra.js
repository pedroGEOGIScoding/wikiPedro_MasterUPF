/* =====================================================================
   poly-applets-extra.js — MODULO DE AMPLIACION
   Se carga DESPUES de poly-applets.js y usa su API publica window.POLY.
   Sus applets se marcan en el .qmd con  data-applet-x="clave"
   (atributo distinto, para que los dos modulos no se pisen nunca).
   Claves disponibles:  notables  ·  ecuacion  ·  newton
   ===================================================================== */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function mj(el) {
    (function go(tries) {
      if (window.MathJax && window.MathJax.typesetPromise) {
        if (window.MathJax.typesetClear) {
          try { window.MathJax.typesetClear([el]); } catch (e) { /* sin efecto en v3 antiguas */ }
        }
        window.MathJax.typesetPromise([el]).catch(function (e) { console.warn('MathJax:', e); });
      } else if (tries < 30) {
        setTimeout(function () { go(tries + 1); }, 300);
      }
    })(0);
  }

  function head(title, bullets) {
    return '<div class="ap-head"><h4 class="ap-title">' + title + '</h4>' +
      '<details class="ap-help" open><summary>Instrucciones de uso y sintaxis</summary><ul>' +
      bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul></details></div>';
  }

  function row(fields, btn) {
    var h = '<div class="ap-row">';
    fields.forEach(function (f) {
      h += '<label>' + f.label + '</label>';
      if (f.options) h += '<select class="' + f.cls + '">' + f.options.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') + '</select>';
      else h += '<input class="' + f.cls + '" value="' + f.value + '" size="' + (f.size || 20) + '">';
    });
    return h + '<button class="ap-btn btn-go">' + (btn || 'Calcular') + '</button></div>';
  }

  function val(root, cls) { return root.querySelector('.' + cls).value; }

  function wire(root, run) {
    var out = root.querySelector('.out');
    function exec() {
      try { run(root, out); } catch (e) { out.innerHTML = '<div class="ap-err"><b>Revisa la entrada:</b> ' + (e.message || e) + '</div>'; }
      mj(out);
    }
    var b = root.querySelector('.btn-go');
    if (b) b.addEventListener('click', exec);
    root.querySelectorAll('input').forEach(function (i) { i.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') exec(); }); });
    root.querySelectorAll('select').forEach(function (s) { s.addEventListener('change', exec); });
    exec();
  }

  /* --- helpers sobre la API de POLY (arrays de racionales, indice = grado) --- */
  var P = window.POLY;
  function deg(p) { var i = p.length - 1; while (i > 0 && p[i].n === 0) i--; return p[i].n === 0 ? -1 : i; }
  function rt(a) { return a.d === 1 ? String(a.n) : (a.n < 0 ? '-' : '') + '\\tfrac{' + Math.abs(a.n) + '}{' + a.d + '}'; }
  function num(a) { return a.n / a.d; }
  function isSq(x) { var r = Math.round(Math.sqrt(Math.abs(x))); return r * r === Math.abs(x) ? r : null; }
  function binom(n, k) { var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); }

  var X = {};

  /* ---------- 3b. Identidades notables + binomio de Newton ---------- */
  X.notables = function (root) {
    root.innerHTML = head('Applet 3 · Identidades notables y binomio de Newton', [
      'Escribe una expresion con parentesis y potencias y pulsa <b>Desarrollar</b>. Ejemplos: <code>(2x-3)^2</code>, <code>(x+5)^3</code>, <code>(x+4)(x-4)</code>, <code>(x-1)^5</code>, <code>(3x+2)(3x-2)</code>.',
      'El applet desarrolla el producto, lo factoriza de nuevo y, si el resultado responde a una identidad notable de cuadrados, lo <b>reconoce y lo dice</b>.',
      'La ultima seccion despliega \\((a+b)^n\\) con los numeros combinatorios: es el binomio de Newton, y los coeficientes son una fila del triangulo de Pascal.',
      'Comprobacion critica: evalua en la casilla <b>x =</b> y compara. Un desarrollo falso casi nunca sobrevive a una sustitucion numerica.'
    ]) + row([
      { label: 'Expresion:', cls: 'inp-p', value: '(2x-3)^2', size: 24 },
      { label: 'x =', cls: 'inp-a', value: '3', size: 5 },
      { label: 'n de \\((a+b)^n\\):', cls: 'inp-n', value: '5', size: 3 }
    ], 'Desarrollar') + '<div class="out"></div>';

    wire(root, function (r, out) {
      var p = P.parse(val(r, 'inp-p'));
      var a = P.parse(val(r, 'inp-a'));
      if (deg(a) > 0) throw new Error('en la casilla <b>x =</b> escribe un numero, no una expresion con x.');
      var n = parseInt(val(r, 'inp-n'), 10);
      if (!(n >= 0 && n <= 10)) throw new Error('el exponente n del binomio debe estar entre 0 y 10.');

      var rec = '';
      if (deg(p) === 2) {
        var A = p[2], Bq = p[1], C = p[0];
        var sa = (A.d === 1) ? isSq(A.n) : null;
        var sc = (C.d === 1) ? isSq(C.n) : null;
        if (sa && sc && A.n > 0 && C.n > 0 && Math.abs(2 * sa * sc) === Math.abs(Bq.n) && Bq.d === 1) {
          var signo = Bq.n > 0 ? '+' : '-';
          var texto = Bq.n > 0 ? 'cuadrado de una suma' : 'cuadrado de una diferencia';
          rec = '<div class="ap-ok"><b>Identidad reconocida:</b> ' + texto +
            '<div class="ap-formula">\\(' + P.tex(p) + ' = \\left(' + (sa === 1 ? '' : sa) + 'x ' + signo + ' ' + sc + '\\right)^{2}\\)</div>' +
            'Patron: \\((u \\pm v)^2 = u^2 \\pm 2uv + v^2\\); el termino central es el <b>doble producto</b>, la pieza que se olvida siempre.</div>';
        } else if (Bq.n === 0 && C.n < 0 && sa && isSq(C.n)) {
          var sb = isSq(C.n);
          rec = '<div class="ap-ok"><b>Identidad reconocida:</b> suma por diferencia' +
            '<div class="ap-formula">\\(' + P.tex(p) + ' = \\left(' + (sa === 1 ? '' : sa) + 'x + ' + sb + '\\right)\\left(' + (sa === 1 ? '' : sa) + 'x - ' + sb + '\\right)\\)</div>' +
            'Patron: \\(u^2-v^2=(u+v)(u-v)\\). Es la identidad mas rentable de todo el curso.</div>';
        } else if (deg(p) === 2) {
          rec = '<p class="ap-note">No responde a un cuadrado perfecto ni a una diferencia de cuadrados; para factorizarlo usa la formula de segundo grado.</p>';
        }
      }

      var f = P.factorize(p);
      var filas = '', k;
      for (k = 0; k <= n; k++) {
        filas += '<tr><td>\\(\\binom{' + n + '}{' + k + '}\\)</td><td>' + binom(n, k) + '</td>' +
          '<td>\\(' + (k === n ? '' : 'a^{' + (n - k) + '}') + (k === 0 ? '' : 'b^{' + k + '}') + (n === 0 ? '1' : '') + '\\)</td></tr>';
      }
      var pascal = '';
      for (var i = 0; i <= n; i++) {
        var fila = [];
        for (k = 0; k <= i; k++) fila.push(binom(i, k));
        pascal += '<div class="ap-pascal' + (i === n ? ' ap-hl' : '') + '">' + fila.join(' &nbsp; ') + '</div>';
      }

      out.innerHTML =
        '<div class="ap-formula">\\(' + val(r, 'inp-p').replace(/\^(\d+)/g, '^{$1}') + ' = ' + P.tex(p) + '\\)</div>' +
        rec +
        '<p class="ap-note">Factorizada de nuevo: \\(' + P.tex(p) + ' = ' + P.factorTex(f, 'entero') + '\\). ' +
        'Control numerico en \\(x = ' + rt(a[0]) + '\\): el desarrollo vale \\(' + rt(P.eval(p, a[0])) + '\\).</p>' +
        '<h5 class="ap-sub">Binomio de Newton para \\((a+b)^{' + n + '}\\)</h5>' +
        '<table class="ap-tbl"><tr><th>Combinatorio</th><th>Valor</th><th>Parte literal</th></tr>' + filas + '</table>' +
        '<div class="ap-pascal-wrap">' + pascal + '</div>' +
        '<p class="ap-note">La fila resaltada del triangulo de Pascal contiene exactamente los coeficientes del desarrollo. Con \\(n=2\\) y \\(n=3\\) reaparecen las identidades notables: no son formulas independientes, son casos particulares.</p>';
    });
  };

  /* ---------- 15. De la factorizacion a la ecuacion ---------- */
  X.ecuacion = function (root) {
    root.innerHTML = head('Applet 15 · De la factorizacion a la ecuacion polinomica', [
      'Escribe la ecuacion en la forma <b>P(x) = 0</b>, tecleando solo P(x). Ejemplos: <code>x^3-4x^2+5x-2</code>, <code>2x^3-3x^2-11x+6</code>, <code>x^4-10x^2+9</code>, <code>x^4-5x^2+6</code>.',
      'El applet factoriza y aplica la <b>ley del producto nulo</b>: un producto es cero si y solo si alguno de sus factores es cero. Cada factor genera una ecuacion sencilla.',
      'Prueba una <b>bicuadrada</b> como <code>x^4-10x^2+9</code> y compara: el cambio \\(t=x^2\\) y la factorizacion llevan al mismo sitio.',
      'Comprueba siempre las soluciones sustituyendo: la ultima columna lo hace por ti.'
    ]) + row([{ label: 'P(x) = 0 con P(x) =', cls: 'inp-p', value: 'x^4-10x^2+9', size: 26 }], 'Resolver') + '<div class="out"></div>';

    wire(root, function (r, out) {
      var p = P.parse(val(r, 'inp-p'));
      if (deg(p) < 1) throw new Error('escribe un polinomio de grado 1 o mas.');
      var f = P.factorize(p), pasos = '', sols = [];
      if (f.xmult) { pasos += '<li>Factor \\(x^{' + f.xmult + '} = 0 \\Rightarrow x = 0\\) (solucion ' + (f.xmult > 1 ? 'multiple, orden ' + f.xmult : 'simple') + ')</li>'; sols.push({ tex: '0', v: P.R(0) }); }
      f.linear.forEach(function (L) {
        pasos += '<li>Factor \\(\\left(x - ' + rt(L.root) + '\\right)^{' + L.mult + '} = 0 \\Rightarrow x = ' + rt(L.root) + '\\)' +
          (L.mult > 1 ? ' (solucion de multiplicidad ' + L.mult + ')' : '') + '</li>';
        sols.push({ tex: rt(L.root), v: L.root });
      });
      f.quads.forEach(function (q) {
        if (q.discNum < 0) pasos += '<li>Factor \\(' + P.tex(q.poly) + ' = 0\\): discriminante \\(' + rt(q.disc) + ' < 0\\) &rarr; <b>no aporta soluciones reales</b></li>';
        else pasos += '<li>Factor \\(' + P.tex(q.poly) + ' = 0\\) &rarr; soluciones irracionales \\(x \\approx ' + q.roots.map(function (v) { return v.toFixed(5); }).join('\\) y \\(x \\approx ') + '\\)</li>';
      });
      if (f.leftover) pasos += '<li>Queda el factor \\(' + P.tex(f.leftover) + '\\), que no se resuelve con las herramientas del curso.</li>';
      var comp = sols.map(function (s) {
        return '<tr><td>\\(x = ' + s.tex + '\\)</td><td>\\(P(' + s.tex + ') = ' + rt(P.eval(p, s.v)) + '\\)</td><td>' +
          (P.eval(p, s.v).n === 0 ? '<span class="ap-tick">valida</span>' : '<span class="ap-cross">revisar</span>') + '</td></tr>';
      }).join('');
      out.innerHTML =
        '<div class="ap-formula">\\(' + P.tex(p) + ' = 0 \\iff ' + P.factorTex(f, 'entero') + ' = 0\\)</div>' +
        '<ul class="ap-list">' + pasos + '</ul>' +
        (comp ? '<table class="ap-tbl"><tr><th>Solucion racional</th><th>Sustitucion</th><th>Comprobacion</th></tr>' + comp + '</table>' : '') +
        '<p class="ap-note">Grado ' + deg(p) + ' &rarr; a lo sumo ' + deg(p) + ' soluciones reales. Las que faltan, si faltan, son irracionales o complejas.</p>';
    });
  };

  /* ---------- 16. Triangulo de Pascal interactivo ---------- */
  X.newton = function (root) {
    root.innerHTML = head('Applet 16 · Triangulo de Pascal y potencias de un binomio', [
      'Mueve el deslizador para elegir el exponente n y ver la fila correspondiente del triangulo de Pascal junto al desarrollo de \\((x+a)^n\\).',
      'Cambia el valor de <b>a</b> (puede ser negativo: escribe <code>-3</code>) y observa como se alternan los signos.',
      'Relacion con el tema: estas potencias aparecen cuando un polinomio tiene una raiz multiple, porque entonces contiene un factor \\((x-r)^m\\).'
    ]) +
      '<div class="ap-row"><label>n</label><input type="range" class="sl-n" min="0" max="8" step="1" value="4">' +
      '<label>a =</label><input class="inp-a" value="-3" size="5"><button class="ap-btn btn-go">Actualizar</button></div><div class="out"></div>';

    function run(r, out) {
      var n = parseInt(r.querySelector('.sl-n').value, 10);
      var a = P.parse(val(r, 'inp-a'));
      if (deg(a) > 0) throw new Error('en <b>a</b> escribe un numero, por ejemplo <code>2</code> o <code>-3</code>.');
      var poly = P.parse('(x+(' + val(r, 'inp-a') + '))^' + n);
      var fila = [], k;
      for (k = 0; k <= n; k++) fila.push(binom(n, k));
      out.innerHTML =
        '<div class="ap-formula">\\(\\left(x + (' + rt(a[0]) + ')\\right)^{' + n + '} = ' + P.tex(poly) + '\\)</div>' +
        '<p class="ap-note">Fila ' + n + ' del triangulo de Pascal: <b>' + fila.join(' &nbsp; ') + '</b></p>' +
        '<p class="ap-note">Suma de los coeficientes de la fila \\(= 2^{' + n + '} = ' + Math.pow(2, n) + '\\). ' +
        'Y el valor del desarrollo en \\(x=1\\) es \\(' + rt(P.eval(poly, P.R(1))) + '\\), que es \\((1' + (num(a[0]) < 0 ? '' : '+') + rt(a[0]) + ')^{' + n + '}\\).</p>';
    }
    root.querySelectorAll('input[type=range]').forEach(function (s) {
      s.addEventListener('input', function () { var out = root.querySelector('.out'); try { run(root, out); } catch (e) { out.innerHTML = '<div class="ap-err">' + e.message + '</div>'; } mj(out); });
    });
    wire(root, run);
  };

  ready(function () {
    if (!window.POLY) { console.error('poly-applets-extra.js necesita poly-applets.js cargado antes.'); return; }
    Array.prototype.forEach.call(document.querySelectorAll('[data-applet-x]'), function (node) {
      var k = node.getAttribute('data-applet-x');
      node.classList.add('applet');
      if (X[k]) { try { X[k](node); mj(node); } catch (e) { node.innerHTML = '<div class="ap-err">Error al construir el applet "' + k + '": ' + e.message + '</div>'; } }
      else node.innerHTML = '<div class="ap-err">No existe el applet de ampliacion "' + k + '".</div>';
    });
  });
})();
