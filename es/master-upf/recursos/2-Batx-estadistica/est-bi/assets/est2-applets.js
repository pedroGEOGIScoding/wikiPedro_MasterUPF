/* =====================================================================
   est2-applets.js · Estadística bidimensional · 2.º Batx
   Ruta: 2-Batx-estadistica/est-bi/assets/est2-applets.js

   API pública: window.EST2
     .registry            mapa de claves -> función montadora
     .datos2d(str)        parsea pares (x,y) o filas "x y"
     .calc2d(pairs)       estadísticos bidimensionales
     .tex(rootNode)       renderiza KaTeX en nodos data-tex
     .log                 pila de errores por applet
     .extra               true cuando el módulo -extra ha registrado sus applets

   Sin OJS, CDN, auto-render ni dependencias externas.
   ===================================================================== */
(function () {
  'use strict';

  var R = {};

  /* ------------------------------------------------------------------
     0 · utilidades comunes
     ------------------------------------------------------------------ */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function K(t)  { return '<span data-tex="' + esc(t) + '"></span>'; }
  function KD(t) { return '<span data-tex="' + esc(t) + '" data-display="1"></span>'; }

  function fmt(x, d) {
    d = d === undefined ? 3 : d;
    if (!Number.isFinite(x)) return '—';
    var p = Math.pow(10, d);
    var y = Math.round(x * p) / p;
    return String(Object.is(y, -0) ? 0 : y);
  }
  /* coma decimal en texto visible (español) */
  function nc(x, d) { return fmt(x, d).replace('.', ','); }
  /* coma decimal dentro de KaTeX: 1{,}5 evita separación tipográfica */
  function kf(x, d) { return fmt(x, d).replace('.', '{,}'); }

  function tex(root) {
    if (!window.katex) return;
    root.querySelectorAll('[data-tex]').forEach(function (e) {
      if (e.dataset.done) return;
      try {
        katex.render(e.dataset.tex, e, {
          throwOnError: false,
          displayMode: e.hasAttribute('data-display')
        });
        e.dataset.done = 1;
      } catch (x) { e.textContent = e.dataset.tex; }
    });
  }

  /* ------------------------------------------------------------------
     1 · parseo de datos bidimensionales
     Acepta:
       - Lista de pares: "(1,2), (2,3), (3,5)"
       - Dos columnas separadas por espacios o tabuladores: "1 2\n2 3\n3 5"
       - "x=..., y=..." en dos textareas (llamando por separado)
     Devuelve pares { x:[], y:[] } sin ordenar (el orden importa).
     ------------------------------------------------------------------ */
  function datos2d(txt) {
    var s = String(txt || '').trim();
    if (!s) throw Error('Escribe pares (x, y). Ejemplo: (1,2), (2,3), (3,5) o una fila por par.');
    var xs = [], ys = [];

    // 1) formato con paréntesis
    var m = s.match(/\(\s*-?\d[\d.,]*\s*[;,]\s*-?\d[\d.,]*\s*\)/g);
    if (m && m.length) {
      m.forEach(function (pair) {
        var mm = pair.match(/-?\d[\d.,]*/g);
        if (!mm || mm.length < 2) return;
        var xv = Number(String(mm[0]).replace(',', '.'));
        var yv = Number(String(mm[1]).replace(',', '.'));
        if (Number.isFinite(xv) && Number.isFinite(yv)) { xs.push(xv); ys.push(yv); }
      });
    } else {
      // 2) filas "x y" o "x;y" o "x,y"
      s.split(/\n|;;/).forEach(function (row) {
        var r = row.trim();
        if (!r) return;
        var mm = r.match(/-?\d[\d.,]*/g);
        if (!mm || mm.length < 2) return;
        var xv = Number(String(mm[0]).replace(',', '.'));
        var yv = Number(String(mm[1]).replace(',', '.'));
        if (Number.isFinite(xv) && Number.isFinite(yv)) { xs.push(xv); ys.push(yv); }
      });
    }
    if (xs.length < 2) throw Error('Necesito al menos 2 pares (x, y) numéricos.');
    return { x: xs, y: ys };
  }

  /* Parseo de dos series por separado, columna X y columna Y en textareas distintos. */
  function datosXY(sx, sy) {
    var parse = function (s) {
      return String(s || '').trim().split(/[\s,;]+/).filter(Boolean)
        .map(function (t) { return Number(String(t).replace(',', '.')); });
    };
    var xs = parse(sx), ys = parse(sy);
    if (xs.length !== ys.length) throw Error('X e Y deben tener el mismo número de datos.');
    if (xs.some(function (v) { return !Number.isFinite(v); }) ||
        ys.some(function (v) { return !Number.isFinite(v); }))
      throw Error('Introduce solo números en X e Y.');
    if (xs.length < 2) throw Error('Necesito al menos 2 valores.');
    return { x: xs, y: ys };
  }

  /* ------------------------------------------------------------------
     2 · cálculo bidimensional
     ------------------------------------------------------------------ */
  function calc2d(p) {
    var x = p.x, y = p.y, N = x.length;
    var sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
    for (var i = 0; i < N; i++) {
      sx  += x[i];
      sy  += y[i];
      sxx += x[i] * x[i];
      syy += y[i] * y[i];
      sxy += x[i] * y[i];
    }
    var mx = sx / N, my = sy / N;
    var vx = sxx / N - mx * mx;
    var vy = syy / N - my * my;
    var cov = sxy / N - mx * my;
    var sdx = Math.sqrt(Math.max(0, vx));
    var sdy = Math.sqrt(Math.max(0, vy));
    var r = (sdx > 0 && sdy > 0) ? cov / (sdx * sdy) : 0;
    var bYX = vx > 0 ? cov / vx : 0;   // pendiente Y|X
    var bXY = vy > 0 ? cov / vy : 0;   // pendiente X|Y (expresa x en función de y)
    var aYX = my - bYX * mx;
    var aXY = mx - bXY * my;
    var r2 = r * r;
    return {
      N: N, sumX: sx, sumY: sy, sumXX: sxx, sumYY: syy, sumXY: sxy,
      mx: mx, my: my, vx: vx, vy: vy, sdx: sdx, sdy: sdy,
      cov: cov, r: r, r2: r2, bYX: bYX, aYX: aYX, bXY: bXY, aXY: aXY,
      minX: Math.min.apply(null, x), maxX: Math.max.apply(null, x),
      minY: Math.min.apply(null, y), maxY: Math.max.apply(null, y)
    };
  }

  /* ------------------------------------------------------------------
     3 · tablas resumen
     ------------------------------------------------------------------ */
  function tablaResumen(c) {
    var rows = [
      ['$N$',           K(String(c.N))],
      ['$\\bar{x}$',    K(kf(c.mx, 3))],
      ['$\\bar{y}$',    K(kf(c.my, 3))],
      ['$\\sigma_X^2$', K(kf(c.vx, 3))],
      ['$\\sigma_Y^2$', K(kf(c.vy, 3))],
      ['$\\sigma_X$',   K(kf(c.sdx, 3))],
      ['$\\sigma_Y$',   K(kf(c.sdy, 3))],
      ['$\\sigma_{XY}$',K(kf(c.cov, 3))],
      ['$r$',           K(kf(c.r, 4))],
      ['$r^2$',         K(kf(c.r2, 4))]
    ];
    var h = '<table class="ap-tbl"><tbody>';
    rows.forEach(function (row) {
      h += '<tr><td>' + K(row[0].slice(1, -1)) + '</td><td>' + row[1] + '</td></tr>';
    });
    return h + '</tbody></table>';
  }

  /* ------------------------------------------------------------------
     4 · applets básicos (el resto vive en est2-applets-extra.js)
     ------------------------------------------------------------------ */

  /* base: dos textareas X e Y + salida */
  function baseXY(node, title, instr, dfx, dfy, compute) {
    node.classList.add('applet');
    node.innerHTML =
      '<h4 class="mx-title">Applet · ' + title + '</h4>' +
      '<div class="mx-instr">' + instr + '</div>' +
      '<div class="mx-inputs">' +
        '<label class="mx-field"><span>Valores de X</span>' +
          '<textarea class="mx-in" rows="2" spellcheck="false">' + dfx + '</textarea></label>' +
        '<label class="mx-field"><span>Valores de Y</span>' +
          '<textarea class="mx-in" rows="2" spellcheck="false">' + dfy + '</textarea></label>' +
      '</div><div class="mx-out ap-out"></div>';
    var ta = node.querySelectorAll('textarea'), out = node.querySelector('.mx-out');
    function run() {
      try {
        var p = datosXY(ta[0].value, ta[1].value);
        out.innerHTML = compute(calc2d(p), p);
        tex(out);
      } catch (e) {
        out.innerHTML = '<div class="mx-bad ap-err">' + esc(e.message) + '</div>';
      }
    }
    ta[0].addEventListener('input', run);
    ta[1].addEventListener('input', run);
    run();
  }

  /* Laboratorio bidimensional: todo de un vistazo. */
  R.laboratorio = function (n) {
    baseXY(n,
      'Laboratorio bidimensional',
      'Introduce dos series con el mismo número de datos. El applet calcula todos los estadísticos y comprueba las fórmulas del formulario.',
      '1 2 3 4 5',
      '2 3 5 4 6',
      function (c) {
        return tablaResumen(c) +
          '<div class="mx-info">Recuerda: $r$ tiene el mismo signo que $\\sigma_{XY}$ y siempre cumple $-1\\le r\\le 1$.</div>';
      });
  };

  /* Registrador provisional para los applets que redefine -extra.js.
     Si -extra no llega a cargar (por caché o red local), aparecerá un
     mensaje claro en lugar de un applet fantasma. */
  var PENDIENTES = [
    'presentacion', 'tabla2d', 'marginales', 'condicionadas', 'independencia',
    'cuadrantes', 'covarianza', 'covarianzaTabla', 'dispersion', 'correlacion',
    'determinacion', 'rectas', 'residuos', 'inverso', 'cuadratica',
    'estimacion', 'interpolacion', 'entrenador', 'diagnostico'
  ];
  PENDIENTES.forEach(function (k) {
    R[k] = function (n) {
      n.classList.add('applet');
      n.innerHTML =
        '<h4 class="mx-title">Applet · ' + k + '</h4>' +
        '<div class="mx-bad ap-err">Este applet requiere <code>est2-applets-extra.js</code>. ' +
        'Comprueba que se carga después de <code>est2-applets.js</code> en <code>_scripts.html</code>.</div>';
    };
  });

  /* ------------------------------------------------------------------
     5 · API pública, boot y espera del módulo extra
     ------------------------------------------------------------------ */

  window.EST2 = {
    registry: R,
    datos2d: datos2d, datosXY: datosXY, calc2d: calc2d,
    tablaResumen: tablaResumen,
    tex: tex, K: K, KD: KD, esc: esc, fmt: fmt, nc: nc, kf: kf,
    log: []
  };

  function boot() {
    document.querySelectorAll('[data-applet-est2]').forEach(function (n) {
      if (n.dataset.mounted) return;
      n.dataset.mounted = 1;
      var f = R[n.dataset.appletEst2];
      if (!f) {
        n.innerHTML = '<div class="mx-bad ap-err">Clave inexistente: ' + esc(n.dataset.appletEst2) + '</div>';
        return;
      }
      try { f(n); }
      catch (e) {
        n.innerHTML = '<div class="mx-bad ap-err">' + esc(e.message) + '</div>';
        window.EST2.log.push({ applet: n.dataset.appletEst2, error: e.message });
      }
    });
  }

  function startWhenReady() {
    var attempts = 0;
    (function waitForExtra() {
      if (window.EST2 && window.EST2.extra === true) { boot(); return; }
      if (attempts++ >= 200) { boot(); return; }
      setTimeout(waitForExtra, 10);
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWhenReady);
  } else {
    startWhenReady();
  }
})();
