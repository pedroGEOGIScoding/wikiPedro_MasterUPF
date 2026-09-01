/* =====================================================================
   est2-applets-extra.js · Estadística bidimensional · 2.º Bachillerato
   Versión 1 · visualización y manipulación

   Depende de window.EST2 (est2-applets.js).

   Applets registrados aquí (18):
     presentacion · tabla2d · marginales · condicionadas · independencia
     cuadrantes · covarianza · covarianzaTabla · dispersion · correlacion
     determinacion · rectas · residuos · inverso · cuadratica
     estimacion · entrenador · diagnostico

   JavaScript plano, gráficos SVG propios, sin OJS, CDN ni dependencias
   externas. Los estilos de composición SVG se inyectan aquí para que no
   sea necesario modificar est2-applets.css.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.EST2;
  if (!S) return;
  var R = S.registry;
  var K = S.K, KD = S.KD, esc = S.esc, fmt = S.fmt, nc = S.nc, kf = S.kf;

  /* ------------------------------------------------------------------
     Paleta y estilos SVG mínimos
     ------------------------------------------------------------------ */
  var COL = {
    x: '#1976d2', y: '#c62828', punto: '#37474f', puntoBorde: '#1a3554',
    media: '#e07b00', centro: '#6a3d9a', recta: '#00695c', rectaXY: '#c2185b',
    residuo: '#8e24aa', banda: '#76b7b2', eje: '#455a64', guia: '#cfd8dc',
    texto: '#263238', posQ: '#2e7d32', negQ: '#c62828',
    parab: '#00838f'
  };

  (function injectCss() {
    if (document.getElementById('est2-extra-css')) return;
    var css =
      '.applet .ap-fig{margin:.5rem 0}' +
      '.applet .ap-fig svg{display:block;max-width:100%;height:auto;background:#fff;' +
        'border:1px solid #d9e0e4;border-radius:6px}' +
      '.applet .ap-figcap{font-size:.8rem;color:#546e7a;margin:.25rem 0 0;line-height:1.35}' +
      '.applet .ap-legend{list-style:none;padding:0;margin:.4rem 0 0;display:flex;' +
        'flex-wrap:wrap;gap:.35rem 1rem}' +
      '.applet .ap-legend li{display:flex;align-items:center;gap:.35rem;font-size:.82rem;color:#37474f}' +
      '.applet .ap-split{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);' +
        'gap:1rem;align-items:start;margin:.6rem 0}' +
      '.applet .ap-pane{min-width:0}' +
      '@media(max-width:900px){.applet .ap-split{grid-template-columns:1fr}}';
    var st = document.createElement('style');
    st.id = 'est2-extra-css';
    st.textContent = css;
    document.head.appendChild(st);
  })();

  /* ------------------------------------------------------------------
     Escenarios curados extraídos de los laboratorios previos
     ------------------------------------------------------------------ */
  var ESCEN = {
    ejemplo: {
      titulo: 'Ejemplo de clase',
      xLabel: 'X', yLabel: 'Y',
      nota: 'Cinco puntos guiados de los apuntes: da $\\bar{x}=3$, $\\bar{y}=4$, $\\sigma_{XY}=1{,}8$, $r=0{,}9$ y $r^2=0{,}81$.',
      pts: [[1,2],[2,3],[3,5],[4,4],[5,6]]
    },
    positiva: {
      titulo: 'Positiva fuerte',
      xLabel: 'Horas de estudio', yLabel: 'Nota',
      nota: 'A más horas de estudio, mejor nota. La nube se alarga hacia arriba y $r$ se acerca a $+1$.',
      pts: [[1,3.1],[2,2.6],[3,4.4],[4,4.1],[5,6.0],[6,5.4],[7,7.3],[8,7.0],[9,8.6],[10,8.2]]
    },
    negativa: {
      titulo: 'Negativa fuerte',
      xLabel: 'Horas de videojuegos', yLabel: 'Nota',
      nota: 'Relación inversa: cuando $X$ crece, $Y$ decrece. $\\sigma_{XY}$ y $r$ son negativos.',
      pts: [[0.5,9.1],[1,7.6],[1.5,8.3],[2,6.5],[2.5,7.2],[3,5.4],[3.5,5.9],[4,4.3],[5,3.9],[6,2.4]]
    },
    nula: {
      titulo: 'Correlación nula',
      xLabel: 'Número de calzado', yLabel: 'Nota',
      nota: 'Sin dirección clara: $r\\approx 0$. El número de calzado no aporta información sobre la nota.',
      pts: [[36,7.2],[37,4.1],[38,8.3],[38,5.0],[39,6.4],[40,3.2],[40,8.8],[41,5.6],[42,7.0],[42,4.4],[43,6.8],[44,5.2]]
    },
    nolineal: {
      titulo: 'No lineal (r ≈ 0)',
      xLabel: 'Dosis (g/m²)', yLabel: 'Cosecha (kg/m²)',
      nota: 'Los puntos siguen una parábola perfecta $y=8-0{,}3(x-5)^2$. Existe relación exacta, pero $r$ solo detecta relaciones lineales.',
      pts: [[1,3.2],[2,5.3],[3,6.8],[4,7.7],[5,8.0],[6,7.7],[7,6.8],[8,5.3],[9,3.2]]
    },
    espuria: {
      titulo: 'Correlación espuria',
      xLabel: 'Helados (cientos)', yLabel: 'Insolaciones',
      nota: '$r$ es muy alto, pero el helado no provoca insolaciones: una tercera variable, la temperatura, hace crecer las dos a la vez.',
      pts: [[1,3],[2,6],[2.5,6],[3,9],[4,10],[5,14],[6,16],[7,20],[8,22],[9,27]]
    },
    pintura: {
      titulo: 'Pintura (apuntes 2.7.2.1)',
      xLabel: 'Concentración (g/l)', yLabel: 'Tiempo de secado (min)',
      nota: 'Cuatro pares del ejemplo resuelto de la recta de regresión: $y=0{,}12x+15{,}63$; $x=8{,}5y-132{,}5$; $r\\approx 0{,}99$.',
      pts: [[5,16],[10,17],[20,18],[30,19]]
    },
    exacta: {
      titulo: 'Lineal exacta negativa',
      xLabel: 'X', yLabel: 'Y',
      nota: 'Todos los puntos están sobre $y=-2x+12$. Da $r=-1$.',
      pts: [[1,10],[2,8],[3,6],[4,4],[5,2]]
    }
  };

  /* Tablas de doble entrada (formato: xs, ys, n[i][j] con i=fila Y, j=col X) */
  var TABLAS = {
    estudio: {
      titulo: 'Horas de estudio × nota',
      xLab: 'Horas de estudio', yLab: 'Nota',
      xs: [2, 4, 6], ys: [4, 6, 8, 10],
      n: [[6,2,0],[5,6,3],[2,7,6],[1,3,9]]
    },
    bus: {
      titulo: 'Autobuses × minutos de viaje',
      xLab: 'Autobuses al día', yLab: 'Minutos de viaje',
      xs: [1, 2, 3], ys: [10, 20, 30, 40],
      n: [[8,3,1],[5,9,4],[2,6,8],[1,2,6]]
    },
    indep: {
      titulo: 'Casi independientes',
      xLab: 'Horas de estudio', yLab: 'Nota',
      xs: [2, 4, 6], ys: [4, 6, 8, 10],
      n: [[4,5,5],[5,6,7],[4,5,5],[3,4,4]]
    }
  };

  /* ------------------------------------------------------------------
     Utilidades SVG
     ------------------------------------------------------------------ */
  function svgWrap(body, W, H, label, cap) {
    return '<div class="ap-fig"><svg role="img" aria-label="' + esc(label) +
      '" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<title>' + esc(label) + '</title>' + body + '</svg>' +
      (cap ? '<p class="ap-figcap">' + cap + '</p>' : '') + '</div>';
  }
  function txt(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.anchor || 'middle') +
      '" font-size="' + (o.size || 12) + '" font-weight="' + (o.weight || 'normal') +
      '" fill="' + (o.fill || COL.texto) + '">' + s + '</text>';
  }
  function line(x1, y1, x2, y2, col, w, dash) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
      '" stroke="' + (col || COL.eje) + '" stroke-width="' + (w || 1) +
      (dash ? '" stroke-dasharray="' + dash : '') + '"/>';
  }
  function rect(x, y, w, h, fill, stroke, op) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" fill="' + (fill || 'none') + '" stroke="' + (stroke || 'none') +
      (op !== undefined ? '" opacity="' + op : '') + '"/>';
  }
  function circle(cx, cy, r, fill, stroke) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + (fill || COL.punto) +
      '" stroke="' + (stroke || '#fff') + '" stroke-width="1"/>';
  }
  function ticks(d0, d1, target) {
    var span = d1 - d0;
    if (!(span > 0)) return [d0];
    var raw = span / (target || 6);
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var norm = raw / mag, step;
    if (norm < 1.5) step = mag; else if (norm < 3) step = 2 * mag;
    else if (norm < 7) step = 5 * mag; else step = 10 * mag;
    var t = [], first = Math.ceil(d0 / step) * step;
    for (var x = first; x <= d1 + step * 1e-9; x += step) t.push(Math.round(x / step * 1e6) / 1e6);
    return t;
  }

  /* Diagrama de dispersión genérico. opts:
       pts: [{x,y}] | [[x,y]]
       showMedias, showCentro, rectaYX{a,b}, rectaXY{a,b}, showResiduos,
       manual{m,b0}, parab{a,b,c},
       xLabel, yLabel, title, caption, quadrants, extraPoints, xPred, yPred, height
     Renderiza un SVG de 640×420 (ancho responsivo).                     */
  function scatter(rawPts, opts) {
    opts = opts || {};
    var W = 660, H = opts.height || 400;
    var ml = 62, mr = 22, mt = 34, mb = 52;
    var pts = rawPts.map(function (p) { return Array.isArray(p) ? { x: p[0], y: p[1] } : p; });

    // dominios
    var xs = pts.map(function(p){return p.x;}), ys = pts.map(function(p){return p.y;});
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    if (opts.xPred !== undefined) { x0 = Math.min(x0, opts.xPred); x1 = Math.max(x1, opts.xPred); }
    if (opts.yPred !== undefined) { y0 = Math.min(y0, opts.yPred); y1 = Math.max(y1, opts.yPred); }
    var padX = (x1 - x0) * 0.10 || 1, padY = (y1 - y0) * 0.12 || 1;
    x0 -= padX; x1 += padX; y0 -= padY; y1 += padY;
    if (opts.xMin !== undefined) x0 = opts.xMin;
    if (opts.xMax !== undefined) x1 = opts.xMax;
    if (opts.yMin !== undefined) y0 = opts.yMin;
    if (opts.yMax !== undefined) y1 = opts.yMax;

    var PX = function(x){ return ml + (x - x0) / (x1 - x0) * (W - ml - mr); };
    var PY = function(y){ return H - mb - (y - y0) / (y1 - y0) * (H - mt - mb); };
    var body = '';

    // título
    if (opts.title) body += txt(W / 2, 18, esc(opts.title), { size: 13, weight: '700', fill: '#37474f' });

    // rejilla + ejes
    var tx = ticks(x0, x1, 6), ty = ticks(y0, y1, 6);
    tx.forEach(function(v){ var x = PX(v);
      body += line(x, mt, x, H - mb, COL.guia, 1);
      body += line(x, H - mb, x, H - mb + 5, COL.eje, 1.2);
      body += txt(x, H - mb + 17, String(nc(v, 2)), { size: 10.5, fill: '#546e7a' });
    });
    ty.forEach(function(v){ var y = PY(v);
      body += line(ml, y, W - mr, y, COL.guia, 1);
      body += line(ml - 5, y, ml, y, COL.eje, 1.2);
      body += txt(ml - 8, y + 4, String(nc(v, 2)), { size: 10.5, fill: '#546e7a', anchor: 'end' });
    });
    body += line(ml, H - mb, W - mr, H - mb, COL.eje, 1.5);
    body += line(ml, mt, ml, H - mb, COL.eje, 1.5);
    body += txt(W / 2, H - 10, esc(opts.xLabel || 'X'), { size: 12.5, weight: '600', fill: '#37474f' });
    body += '<text x="' + 18 + '" y="' + (H / 2) + '" text-anchor="middle" font-size="12.5" font-weight="600" fill="#37474f" transform="rotate(-90 18 ' + (H / 2) + ')">' + esc(opts.yLabel || 'Y') + '</text>';

    // cuadrantes por medias
    var mx = xs.reduce(function(a,b){return a+b;},0)/xs.length;
    var my = ys.reduce(function(a,b){return a+b;},0)/ys.length;

    if (opts.quadrants) {
      var xC = PX(mx), yC = PY(my);
      body += rect(ml, mt, xC - ml, yC - mt, COL.negQ, null, 0.06);
      body += rect(xC, mt, W - mr - xC, yC - mt, COL.posQ, null, 0.06);
      body += rect(ml, yC, xC - ml, H - mb - yC, COL.posQ, null, 0.06);
      body += rect(xC, yC, W - mr - xC, H - mb - yC, COL.negQ, null, 0.06);
      body += txt((xC + W - mr) / 2, mt + 16, '(+)(+) → +', { size: 11, fill: COL.posQ, weight: '700' });
      body += txt((ml + xC) / 2, mt + 16, '(−)(+) → −', { size: 11, fill: COL.negQ, weight: '700' });
      body += txt((ml + xC) / 2, H - mb - 8, '(−)(−) → +', { size: 11, fill: COL.posQ, weight: '700' });
      body += txt((xC + W - mr) / 2, H - mb - 8, '(+)(−) → −', { size: 11, fill: COL.negQ, weight: '700' });
    }

    // medias
    if (opts.showMedias || opts.showCentro) {
      body += line(PX(mx), mt, PX(mx), H - mb, COL.media, 1.2, '5 4');
      body += line(ml, PY(my), W - mr, PY(my), COL.media, 1.2, '5 4');
      body += txt(PX(mx) + 4, mt + 12, 'x̄ = ' + nc(mx, 2), { size: 10.5, fill: COL.media, weight: '700', anchor: 'start' });
      body += txt(W - mr - 4, PY(my) - 5, 'ȳ = ' + nc(my, 2), { size: 10.5, fill: COL.media, weight: '700', anchor: 'end' });
    }
    if (opts.showCentro) {
      body += circle(PX(mx), PY(my), 6, COL.centro, '#fff');
      body += txt(PX(mx) + 10, PY(my) - 8, '(x̄, ȳ)', { size: 11, fill: COL.centro, weight: '700', anchor: 'start' });
    }

    // banda de interpolación
    if (opts.zonaInterp) {
      var xL = PX(Math.min.apply(null, xs)), xR = PX(Math.max.apply(null, xs));
      body += rect(xL, mt, xR - xL, H - mt - mb, '#4caf50', null, 0.07);
      body += txt((xL + xR) / 2, H - mb - 8, 'zona de interpolación', { size: 10, fill: '#2e7d32', weight: '700' });
    }

    // recta Y|X
    function drawLine(a, b, col, dash, label) {
      var yA = a + b * x0, yB = a + b * x1;
      if (isNaN(yA) || isNaN(yB)) return '';
      var out = '<line x1="' + PX(x0) + '" y1="' + PY(yA) + '" x2="' + PX(x1) + '" y2="' + PY(yB) +
        '" stroke="' + col + '" stroke-width="2"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
      if (label) {
        out += txt(PX(x1) - 4, PY(yB) - 6, esc(label), { size: 11, fill: col, weight: '700', anchor: 'end' });
      }
      return out;
    }
    if (opts.rectaYX) body += drawLine(opts.rectaYX.a, opts.rectaYX.b, COL.recta, null, 'Y|X');
    if (opts.rectaXY) {
      // x = a + b*y  →  para dibujarla como función de x invertimos y = (x-a)/b
      var b = opts.rectaXY.b, a = opts.rectaXY.a;
      if (Math.abs(b) > 1e-9) body += drawLine(-a / b, 1 / b, COL.rectaXY, '4 4', 'X|Y');
      else {
        // recta vertical x = a
        body += '<line x1="' + PX(a) + '" y1="' + PY(y0) + '" x2="' + PX(a) + '" y2="' + PY(y1) + '" stroke="' + COL.rectaXY + '" stroke-width="2" stroke-dasharray="4 4"/>';
      }
    }
    if (opts.manual) body += drawLine(opts.manual.b0, opts.manual.m, '#546e7a', '2 4', 'tu recta');
    if (opts.parab) {
      var p = opts.parab, pol = [], step = (x1 - x0) / 60;
      for (var xv = x0; xv <= x1 + 1e-9; xv += step) {
        var yv = p.a + p.b * xv + p.c * xv * xv;
        pol.push(PX(xv) + ',' + PY(yv));
      }
      body += '<polyline points="' + pol.join(' ') + '" fill="none" stroke="' + COL.parab + '" stroke-width="2"/>';
      body += txt(W - mr - 4, PY(p.a + p.b * x1 + p.c * x1 * x1) - 6, 'y = a + bx + cx²', { size: 11, fill: COL.parab, weight: '700', anchor: 'end' });
    }

    // residuos (verticales al Y|X)
    if (opts.showResiduos && opts.rectaYX) {
      var A = opts.rectaYX.a, B = opts.rectaYX.b;
      pts.forEach(function (p) {
        var yh = A + B * p.x;
        body += line(PX(p.x), PY(p.y), PX(p.x), PY(yh), COL.residuo, 1.3);
      });
    }

    // predicción
    if (opts.xPred !== undefined && opts.rectaYX) {
      var yp = opts.rectaYX.a + opts.rectaYX.b * opts.xPred;
      body += line(PX(opts.xPred), H - mb, PX(opts.xPred), PY(yp), '#1976d2', 1.4, '3 3');
      body += line(ml, PY(yp), PX(opts.xPred), PY(yp), '#1976d2', 1.4, '3 3');
      body += circle(PX(opts.xPred), PY(yp), 6, '#1976d2', '#fff');
    }
    if (opts.yPred !== undefined && opts.rectaXY) {
      var xp = opts.rectaXY.a + opts.rectaXY.b * opts.yPred;
      body += line(PX(xp), H - mb, PX(xp), PY(opts.yPred), '#c2185b', 1.4, '3 3');
      body += line(ml, PY(opts.yPred), PX(xp), PY(opts.yPred), '#c2185b', 1.4, '3 3');
      body += circle(PX(xp), PY(opts.yPred), 6, '#c2185b', '#fff');
    }

    // puntos
    pts.forEach(function (p) {
      body += circle(PX(p.x), PY(p.y), 4.5, COL.punto, '#fff');
    });
    if (opts.extraPoints) {
      opts.extraPoints.forEach(function (p) {
        body += circle(PX(p.x), PY(p.y), 5.5, p.color || '#1976d2', '#fff');
      });
    }

    return svgWrap(body, W, H, opts.title || 'Diagrama de dispersión', opts.caption);
  }

  /* ------------------------------------------------------------------
     Armazón de applets con controles genéricos
     ------------------------------------------------------------------ */
  /* Convierte $...$ inline y $$...$$ display en spans data-tex, respetando
     que el resto del texto siga siendo HTML lícito. */
  function texifica(s) {
    if (typeof s !== 'string') return s;
    s = s.replace(/\$\$([\s\S]+?)\$\$/g, function (_, t) {
      return '<span data-tex="' + esc(t.trim()) + '" data-display="1"></span>';
    });
    s = s.replace(/\$([^\$\n]+?)\$/g, function (_, t) {
      return '<span data-tex="' + esc(t.trim()) + '"></span>';
    });
    return s;
  }

  function shell(node, title, instr, fields, compute) {
    node.classList.add('applet');
    node.innerHTML =
      '<h4 class="mx-title">Applet · ' + title + '</h4>' +
      '<div class="mx-instr">' + texifica(instr) + '</div>' +
      '<div class="mx-inputs"></div>' +
      '<div class="ap-chips"></div>' +
      '<div class="mx-out ap-out"></div>';
    S.tex(node);
    var inp = node.querySelector('.mx-inputs');
    var chips = node.querySelector('.ap-chips');
    var out = node.querySelector('.mx-out');
    var ctl = {};

    (fields || []).forEach(function (f) {
      if (f.type === 'presets') {
        f.list.forEach(function (p) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'ap-chip';
          b.textContent = p.label;
          b.addEventListener('click', function () {
            if (p.apply) p.apply(ctl);
            run();
          });
          chips.appendChild(b);
        });
        return;
      }
      var lab = document.createElement('label');
      lab.className = 'mx-field';
      var cap = document.createElement('span');
      cap.textContent = f.label;
      lab.appendChild(cap);
      var el;
      if (f.type === 'range') {
        el = document.createElement('input');
        el.type = 'range'; el.min = f.min; el.max = f.max; el.step = f.step || 1; el.value = f.value;
        var live = document.createElement('span');
        live.className = 'mx-mono'; live.style.fontSize = '.82rem';
        live.textContent = String(el.value).replace('.', ',');
        el.addEventListener('input', function(){ live.textContent = String(el.value).replace('.', ','); });
        el.className = 'mx-in';
        lab.appendChild(el); lab.appendChild(live);
      } else if (f.type === 'check') {
        el = document.createElement('input');
        el.type = 'checkbox'; el.checked = !!f.value;
        el.style.width = 'auto'; el.style.minWidth = '0';
        el.className = 'mx-in';
        lab.appendChild(el);
      } else if (f.type === 'select') {
        el = document.createElement('select'); el.className = 'mx-in';
        f.options.forEach(function (o) {
          var op = document.createElement('option');
          op.value = o.value !== undefined ? o.value : o;
          op.textContent = o.label !== undefined ? o.label : o;
          el.appendChild(op);
        });
        if (f.value !== undefined) el.value = f.value;
        lab.appendChild(el);
      } else if (f.type === 'text') {
        el = document.createElement('input'); el.type = 'text'; el.value = f.value || '';
        el.className = 'mx-in'; lab.appendChild(el);
      } else {
        el = document.createElement('textarea');
        el.rows = f.rows || 3; el.value = f.value || ''; el.spellcheck = false;
        el.className = 'mx-in';
        lab.appendChild(el);
      }
      ctl[f.id] = el;
      inp.appendChild(lab);
      el.addEventListener('input', run);
      el.addEventListener('change', run);
    });

    function values() {
      var v = {};
      Object.keys(ctl).forEach(function (k) {
        v[k] = ctl[k].type === 'checkbox' ? ctl[k].checked : ctl[k].value;
      });
      return v;
    }
    function run() {
      try {
        out.innerHTML = texifica(compute(values(), ctl));
        S.tex(out);
      } catch (e) {
        out.innerHTML = '<div class="mx-bad ap-err">' + esc(e.message) + '</div>';
        S.log.push({ applet: title, error: e.message });
      }
    }
    run();
    return { run: run, ctl: ctl };
  }

  /* Chips útil para pares (X, Y) */
  function chipsEsc(keys) {
    keys = keys || ['ejemplo','positiva','negativa','nula','nolineal','espuria','pintura'];
    return {
      type: 'presets',
      list: keys.map(function (k) {
        var e = ESCEN[k];
        return {
          label: e.titulo,
          apply: function (ctl) {
            ctl.datosX.value = e.pts.map(function(p){return p[0];}).join(' ');
            ctl.datosY.value = e.pts.map(function(p){return p[1];}).join(' ');
            if (ctl.escenario) ctl.escenario.value = k;
          }
        };
      })
    };
  }

  /* Kv card (para KPIs) */
  function kvs(items) {
    var h = '<div class="ap-kvs">';
    items.forEach(function (it) {
      h += '<div class="ap-kv"><b>' + it.k + '</b><span>' + it.v + '</span></div>';
    });
    return h + '</div>';
  }

  /* Convierte pares actuales del control en {x:[],y:[]} */
  function parseXY(ctl) {
    return S.datosXY(ctl.datosX.value, ctl.datosY.value);
  }

  /* ==================================================================
     1) presentacion — introducción visual a la estadística bidimensional
     ================================================================== */
  R.presentacion = function (n) {
    shell(n,
      'Estadística bidimensional en un vistazo',
      'Elige uno de los escenarios de clase. Verás la nube y los cinco escalones (tabla, dispersión, covarianza, correlación, regresión) resumidos.',
      [ chipsEsc(['ejemplo','positiva','negativa','nula','espuria','pintura']),
        { id: 'datosX', label: 'X', value: '1 2 3 4 5', rows: 2 },
        { id: 'datosY', label: 'Y', value: '2 3 5 4 6', rows: 2 }
      ],
      function (v, ctl) {
        var p = parseXY(ctl);
        var c = S.calc2d(p);
        var titol = 'Nube de puntos';
        var sig = c.cov > 0 ? 'positiva' : (c.cov < 0 ? 'negativa' : 'nula');
        var badge = '<span class="ap-badge ' + (c.cov > 0 ? 'pos' : c.cov < 0 ? 'neg' : 'zero') + '">σXY = ' + nc(c.cov, 3) + '</span> ' +
                    '<span class="ap-badge ' + (c.r > 0 ? 'pos' : c.r < 0 ? 'neg' : 'zero') + '">r = ' + nc(c.r, 3) + '</span> ' +
                    '<span class="ap-badge zero">r² = ' + nc(c.r2, 3) + '</span>';
        return scatter(p.x.map(function(x,i){return [x,p.y[i]];}), {
          title: titol, xLabel: 'X', yLabel: 'Y', showCentro: true
        }) + badge + '<div class="mx-info">Dependencia lineal ' + sig + '. Los 5 escalones son: tabla → dispersión → covarianza → correlación → regresión.</div>';
      });
  };

  /* ==================================================================
     2) tabla2d — tabla de doble entrada + totales marginales
     ================================================================== */
  function tabla2dHTML(T, opts) {
    opts = opts || {};
    var xs = T.xs, ys = T.ys, n = T.n;
    var col = xs.map(function(_,j){ var s=0; for (var i=0;i<ys.length;i++) s+=n[i][j]; return s; });
    var fil = ys.map(function(_,i){ return n[i].reduce(function(a,b){return a+b;},0); });
    var N = col.reduce(function(a,b){return a+b;},0);
    var h = '<table class="ap-tbl ap-2d"><thead><tr><th>' + esc(T.yLab) + ' \\ ' + esc(T.xLab) + '</th>';
    xs.forEach(function(x){ h += '<th>' + esc(T.xLab) + ' = ' + x + '</th>'; });
    h += '<th class="ap-total">Total</th></tr></thead><tbody>';
    ys.forEach(function(y, i) {
      h += '<tr><th>' + esc(T.yLab) + ' = ' + y + '</th>';
      xs.forEach(function(_, j) {
        var cls = (opts.sel && opts.sel[0] === i && opts.sel[1] === j) ? ' class="ap-sel"' : '';
        h += '<td' + cls + '>' + n[i][j] + '</td>';
      });
      h += '<td class="ap-mg">' + fil[i] + '</td></tr>';
    });
    h += '<tr><th class="ap-total">Total</th>';
    xs.forEach(function(_, j) { h += '<td class="ap-mg">' + col[j] + '</td>'; });
    h += '<td class="ap-total">' + N + '</td></tr></tbody></table>';
    return { html: h, col: col, fil: fil, N: N };
  }

  R.tabla2d = function (n) {
    shell(n,
      'Tabla de doble entrada',
      'Elige un ejemplo de clase. Verás la tabla con los totales marginales de fila y de columna y la comprobación de $N$.',
      [ { type: 'presets', list: Object.keys(TABLAS).map(function (k) {
            return { label: TABLAS[k].titulo, apply: function (ctl) { ctl.tabla.value = k; } };
          })
        },
        { id: 'tabla', label: 'Tabla', type: 'select',
          options: Object.keys(TABLAS).map(function(k){ return {value:k,label:TABLAS[k].titulo}; }),
          value: 'estudio' }
      ],
      function (v) {
        var T = TABLAS[v.tabla];
        var r = tabla2dHTML(T);
        // frecuencia relativa conjunta ejemplo
        var maxI = 0, maxJ = 0, maxN = 0;
        for (var i = 0; i < T.ys.length; i++) for (var j = 0; j < T.xs.length; j++) {
          if (T.n[i][j] > maxN) { maxN = T.n[i][j]; maxI = i; maxJ = j; }
        }
        var hij = maxN / r.N;
        return r.html +
          '<div class="mx-info">Comprobación: Σ totales de fila = ' + r.fil.reduce(function(a,b){return a+b;},0) +
          ' y Σ totales de columna = ' + r.col.reduce(function(a,b){return a+b;},0) + '. Deben coincidir con $N = ' + r.N + '$.</div>' +
          '<div class="mx-info">La casilla más frecuente (' + T.xLab + '=' + T.xs[maxJ] + ', ' + T.yLab + '=' + T.ys[maxI] + ') vale ' +
          K('n_{' + (maxI+1) + (maxJ+1) + '} = ' + maxN) + '; su frecuencia relativa conjunta es ' +
          K('h_{' + (maxI+1) + (maxJ+1) + '} = \\dfrac{' + maxN + '}{' + r.N + '} = ' + kf(hij, 3)) + '.</div>';
      });
  };

  /* ==================================================================
     3) marginales — dos gráficos de barras + medias marginales
     ================================================================== */
  function barChart(vals, labels, opts) {
    opts = opts || {};
    var W = 340, H = 220, ml = 40, mr = 12, mt = 26, mb = 42;
    var m = Math.max.apply(null, vals) || 1;
    var body = txt(W/2, 16, esc(opts.title||''), {size: 12.5, weight:'700', fill:'#37474f'});
    var bw = (W - ml - mr) / vals.length;
    vals.forEach(function (v, i) {
      var h = (v / m) * (H - mt - mb);
      var x = ml + i * bw + 4, y = H - mb - h;
      body += rect(x, y, bw - 8, h, opts.color || '#1976d2', null, 0.85);
      body += txt(x + (bw - 8) / 2, y - 4, String(v), { size: 11, weight: '700', fill: '#1a3554' });
      body += txt(x + (bw - 8) / 2, H - mb + 15, String(labels[i]), { size: 11, fill: '#37474f' });
    });
    body += line(ml, H - mb, W - mr, H - mb, COL.eje, 1.4);
    body += txt(W/2, H-6, esc(opts.xLabel||''), { size: 11, weight: '600', fill: '#37474f' });
    return svgWrap(body, W, H, opts.title || 'Distribución marginal');
  }

  R.marginales = function (n) {
    shell(n,
      'Distribuciones marginales de X e Y',
      'Muestra las dos distribuciones marginales que salen de los totales de columna y de fila, y calcula sus medias marginales.',
      [ { id: 'tabla', label: 'Tabla', type: 'select',
          options: Object.keys(TABLAS).map(function(k){ return {value:k,label:TABLAS[k].titulo}; }),
          value: 'estudio' } ],
      function (v) {
        var T = TABLAS[v.tabla], r = tabla2dHTML(T);
        var xs = T.xs, ys = T.ys;
        var mx = xs.reduce(function(s,x,j){return s + x * r.col[j];},0) / r.N;
        var my = ys.reduce(function(s,y,i){return s + y * r.fil[i];},0) / r.N;
        return '<div class="ap-split"><div class="ap-pane">' +
                 barChart(r.col, xs, {title:'Marginal de X ('+T.xLab+')', color:'#1976d2', xLabel: T.xLab}) +
                 '<div class="mx-info">' + K('\\bar{x} = \\dfrac{\\sum f_{i\\bullet}\\, x_i}{N} = ' + kf(mx, 3)) + '</div>' +
               '</div><div class="ap-pane">' +
                 barChart(r.fil, ys, {title:'Marginal de Y ('+T.yLab+')', color:'#c62828', xLabel: T.yLab}) +
                 '<div class="mx-info">' + K('\\bar{y} = \\dfrac{\\sum f_{\\bullet j}\\, y_j}{N} = ' + kf(my, 3)) + '</div>' +
               '</div></div>' +
               '<div class="mx-info">Los márgenes describen cada variable por separado; el interior de la tabla es lo que relaciona ambas.</div>';
      });
  };

  /* ==================================================================
     4) condicionadas — perfiles de Y condicionados a cada X
     ================================================================== */
  R.condicionadas = function (n) {
    shell(n,
      'Distribuciones de Y condicionadas a X',
      'Selecciona un valor de X. La columna se convierte en una distribución porcentual y calculamos la media condicionada.',
      [ { id: 'tabla', label: 'Tabla', type: 'select',
          options: Object.keys(TABLAS).map(function(k){ return {value:k,label:TABLAS[k].titulo}; }),
          value: 'estudio' },
        { id: 'jSel', label: 'Columna X', type: 'select', options: [
          { value: '0', label: 'Primera' },
          { value: '1', label: 'Segunda' },
          { value: '2', label: 'Tercera' }
        ], value: '0' }
      ],
      function (v) {
        var T = TABLAS[v.tabla];
        var j = Math.min(Number(v.jSel), T.xs.length - 1);
        var r = tabla2dHTML(T);
        var xVal = T.xs[j];
        var col = T.n.map(function(r){return r[j];});
        var tot = col.reduce(function(a,b){return a+b;},0);
        var hji = col.map(function(f){ return tot > 0 ? f / tot : 0; });
        var mcond = tot > 0 ? T.ys.reduce(function(s,y,i){return s + y * col[i];},0) / tot : 0;
        var h = '<table class="ap-tbl ap-2d"><thead><tr><th>' + esc(T.yLab) + '</th>';
        T.ys.forEach(function(y){ h += '<th>' + y + '</th>'; });
        h += '<th>Total</th></tr></thead><tbody>';
        h += '<tr><th>Frecuencia</th>';
        col.forEach(function(f){ h += '<td>' + f + '</td>'; });
        h += '<td class="ap-mg">' + tot + '</td></tr>';
        h += '<tr><th>Rel. condicionada</th>';
        hji.forEach(function(f){ h += '<td>' + nc(f, 3) + '</td>'; });
        h += '<td class="ap-mg">1</td></tr></tbody></table>';
        return '<div>Fijamos ' + K(T.xLab + ' = ' + xVal) + ' y miramos solo esa columna:</div>' + h +
               '<div class="mx-info">Media condicionada ' + K('\\bar{y}\\mid_{X=' + xVal + '} = ' + kf(mcond, 3)) + '. Comparando las tres columnas de todos los valores de X se ve claramente si la media de Y depende o no de X.</div>';
      });
  };

  /* ==================================================================
     5) independencia — observado vs esperado, con «mezclar hacia»
     ================================================================== */
  function tablaExpectHTML(T) {
    var xs = T.xs, ys = T.ys, n = T.n;
    var col = xs.map(function(_,j){ var s=0; for (var i=0;i<ys.length;i++) s+=n[i][j]; return s; });
    var fil = ys.map(function(_,i){ return n[i].reduce(function(a,b){return a+b;},0); });
    var N = col.reduce(function(a,b){return a+b;},0);
    var e = ys.map(function(_,i){ return xs.map(function(_,j){ return fil[i]*col[j]/N; }); });
    return { col: col, fil: fil, N: N, e: e };
  }

  R.independencia = function (n) {
    shell(n,
      'Independencia estadística: observado vs esperado',
      'Compara las frecuencias observadas con las que habría bajo independencia. Con el deslizador puedes «mezclar hacia» la independencia y ver cómo desaparecen las diferencias.',
      [ { id: 'tabla', label: 'Tabla', type: 'select',
          options: Object.keys(TABLAS).map(function(k){ return {value:k,label:TABLAS[k].titulo}; }),
          value: 'estudio' },
        { id: 'mezcla', label: 'Mezclar hacia independencia (0 a 100 %)', type: 'range', min: 0, max: 100, step: 1, value: 0 }
      ],
      function (v) {
        var T = TABLAS[v.tabla];
        var er = tablaExpectHTML(T);
        var t = Number(v.mezcla) / 100;
        // matriz mezclada
        var n = T.ys.map(function(_,i){ return T.xs.map(function(_,j){ return (1-t)*T.n[i][j] + t*er.e[i][j]; }); });
        // renderizar
        var xs = T.xs, ys = T.ys;
        var h = '<table class="ap-tbl ap-2d"><thead><tr><th>' + esc(T.yLab) + ' \\ ' + esc(T.xLab) + '</th>';
        xs.forEach(function(x){ h += '<th>' + x + '</th>'; });
        h += '<th class="ap-total">Total</th></tr></thead><tbody>';
        ys.forEach(function(y, i) {
          h += '<tr><th>' + y + '</th>';
          xs.forEach(function(_, j) {
            var obs = T.n[i][j], exp = er.e[i][j], mez = n[i][j];
            var diff = obs - exp;
            var col = diff > 0.5 ? '#e8f5e9' : diff < -0.5 ? '#ffebee' : '#f5f5f5';
            h += '<td style="background:' + col + '">' +
                 '<div><b>' + fmt(mez, 1) + '</b></div>' +
                 '<div style="font-size:.72rem;color:#546e7a">obs ' + obs + ' · esp ' + fmt(exp, 1) + '</div></td>';
          });
          h += '<td class="ap-mg">' + er.fil[i] + '</td></tr>';
        });
        h += '<tr><th class="ap-total">Total</th>';
        xs.forEach(function(_, j) { h += '<td class="ap-mg">' + er.col[j] + '</td>'; });
        h += '<td class="ap-total">' + er.N + '</td></tr></tbody></table>';
        // suma de |obs-exp|
        var dtot = 0;
        for (var i = 0; i < ys.length; i++) for (var j = 0; j < xs.length; j++) dtot += Math.abs(T.n[i][j] - er.e[i][j]);
        var msg = dtot / er.N < 0.15 ?
          '<div class="mx-ok">La tabla observada se parece mucho a la esperada: es compatible con independencia estadística.</div>' :
          '<div class="mx-warn">Hay diferencias claras entre observado y esperado: las variables NO son independientes.</div>';
        return '<div class="mx-info">Fórmula: ' + KD('n_{ij}^{\\text{esperada}} = \\dfrac{f_{i\\bullet}\\cdot f_{\\bullet j}}{N}') + '</div>' +
               h + msg;
      });
  };

  /* ==================================================================
     6) cuadrantes — los signos de (xi−x̄)(yi−ȳ)
     ================================================================== */
  R.cuadrantes = function (n) {
    shell(n,
      'Los signos de la covarianza',
      'Las líneas discontinuas naranjas son las medias. Los productos $(x_i-\\bar{x})(y_i-\\bar{y})$ son positivos en el par de cuadrantes verdes y negativos en los rojos.',
      [ chipsEsc(['ejemplo','positiva','negativa','nula']),
        { id: 'datosX', label: 'X', value: '1 2 3 4 5', rows: 2 },
        { id: 'datosY', label: 'Y', value: '2 3 5 4 6', rows: 2 }
      ],
      function (v, ctl) {
        var p = parseXY(ctl);
        var c = S.calc2d(p);
        return scatter(p.x.map(function(x,i){return [x,p.y[i]];}), {
          title: 'Cuadrantes definidos por las medias', xLabel: 'X', yLabel: 'Y',
          showMedias: true, showCentro: true, quadrants: true
        }) +
        '<div class="mx-info">Suma de productos: ' + K('\\sum(x_i-\\bar{x})(y_i-\\bar{y}) = ' + kf(c.cov * c.N, 3)) +
        '; covarianza ' + K('\\sigma_{XY} = ' + kf(c.cov, 3)) + '.</div>';
      });
  };

  /* ==================================================================
     7) covarianza — cálculo paso a paso a partir de datos individuales
     ================================================================== */
  R.covarianza = function (n) {
    shell(n,
      'Covarianza paso a paso',
      'Introduce dos series X e Y del mismo tamaño. El applet muestra la tabla de desviaciones y aplica la fórmula conceptual y la operativa.',
      [ chipsEsc(['ejemplo','positiva','negativa','pintura','exacta']),
        { id: 'datosX', label: 'X', value: '1 2 3 4 5', rows: 2 },
        { id: 'datosY', label: 'Y', value: '2 3 5 4 6', rows: 2 }
      ],
      function (v, ctl) {
        var p = parseXY(ctl);
        var c = S.calc2d(p);
        var h = '<table class="ap-tbl ap-2d"><thead><tr>' +
                '<th>i</th><th>x<sub>i</sub></th><th>y<sub>i</sub></th>' +
                '<th>x<sub>i</sub>−x̄</th><th>y<sub>i</sub>−ȳ</th>' +
                '<th>(x<sub>i</sub>−x̄)(y<sub>i</sub>−ȳ)</th><th>x<sub>i</sub>y<sub>i</sub></th></tr></thead><tbody>';
        var sumD = 0, sumXY = 0;
        for (var i = 0; i < c.N; i++) {
          var dx = p.x[i] - c.mx, dy = p.y[i] - c.my, pr = dx * dy, xy = p.x[i] * p.y[i];
          sumD += pr; sumXY += xy;
          h += '<tr><td>' + (i+1) + '</td><td>' + nc(p.x[i],2) + '</td><td>' + nc(p.y[i],2) +
               '</td><td>' + nc(dx,3) + '</td><td>' + nc(dy,3) + '</td>' +
               '<td>' + nc(pr,3) + '</td><td>' + nc(xy,3) + '</td></tr>';
        }
        h += '<tr><th colspan="5" class="ap-total">Sumas</th>' +
             '<td class="ap-mg">' + nc(sumD,3) + '</td><td class="ap-mg">' + nc(sumXY,3) + '</td></tr></tbody></table>';
        var badge = '<span class="ap-badge ' + (c.cov > 0 ? 'pos' : c.cov < 0 ? 'neg' : 'zero') + '">σXY = ' + nc(c.cov, 3) + '</span>';
        return h +
          '<div class="mx-info">Fórmula conceptual: ' +
          KD('\\sigma_{XY} = \\dfrac{1}{N}\\sum(x_i-\\bar{x})(y_i-\\bar{y}) = \\dfrac{' + kf(sumD,3) + '}{' + c.N + '} = ' + kf(c.cov,3)) +
          'Fórmula operativa: ' +
          KD('\\sigma_{XY} = \\dfrac{\\sum x_i y_i}{N} - \\bar{x}\\bar{y} = \\dfrac{' + kf(sumXY,3) + '}{' + c.N + '} - ' + kf(c.mx,3) + '\\cdot ' + kf(c.my,3) + ' = ' + kf(c.cov,3)) +
          '</div>' + badge;
      });
  };

  /* ==================================================================
     8) covarianzaTabla — covarianza con tabla de doble entrada
     ================================================================== */
  R.covarianzaTabla = function (n) {
    shell(n,
      'Covarianza con tabla de doble entrada',
      'Aplica la fórmula ' + KD('\\sigma_{XY} = \\dfrac{\\sum\\sum n_{ij}x_i y_j}{N} - \\bar{x}\\bar{y}') + ' sobre las tablas de los apuntes.',
      [ { id: 'tabla', label: 'Tabla', type: 'select',
          options: [{value:'estudio',label:'Horas de estudio × nota'},{value:'bus',label:'Autobuses × minutos de viaje'}],
          value: 'estudio' } ],
      function (v) {
        var T = TABLAS[v.tabla];
        var r = tabla2dHTML(T);
        var mx = T.xs.reduce(function(s,x,j){return s + x * r.col[j];},0) / r.N;
        var my = T.ys.reduce(function(s,y,i){return s + y * r.fil[i];},0) / r.N;
        var sumn = 0;
        for (var i = 0; i < T.ys.length; i++) for (var j = 0; j < T.xs.length; j++) {
          sumn += T.n[i][j] * T.xs[j] * T.ys[i];
        }
        var cov = sumn / r.N - mx * my;
        // detalle por columnas
        var det = '<table class="ap-tbl ap-2d"><thead><tr><th>Col X</th><th>Cálculo</th><th>Suma</th></tr></thead><tbody>';
        T.xs.forEach(function(x, j){
          var partes = [], suma = 0;
          for (var i = 0; i < T.ys.length; i++) {
            var nij = T.n[i][j];
            if (nij === 0) continue;
            partes.push(nij + '·' + T.ys[i]);
            suma += nij * T.ys[i];
          }
          det += '<tr><td>x = ' + x + '</td><td>' + x + '·(' + partes.join(' + ') + ') = ' + x + '·' + suma + '</td><td>' + (x * suma) + '</td></tr>';
        });
        det += '</tbody></table>';
        return r.html + det +
          '<div class="mx-info">' +
          KD('\\sigma_{XY} = \\dfrac{' + kf(sumn,2) + '}{' + r.N + '} - ' + kf(mx,3) + '\\cdot ' + kf(my,3) + ' = ' + kf(cov,3)) +
          '</div>' +
          '<span class="ap-badge ' + (cov > 0 ? 'pos' : cov < 0 ? 'neg' : 'zero') + '">σXY = ' + nc(cov, 3) + '</span>';
      });
  };

  /* ==================================================================
     9) dispersion — diagrama con opciones (medias, centro, valores atípicos)
     ================================================================== */
  R.dispersion = function (n) {
    shell(n,
      'Diagrama de dispersión',
      'Cambia entre escenarios y activa/desactiva las guías. Fíjate en la dirección, la forma y la anchura de la nube.',
      [ chipsEsc(['ejemplo','positiva','negativa','nula','nolineal','espuria','pintura','exacta']),
        { id: 'datosX', label: 'X', value: '1 2 3 4 5', rows: 2 },
        { id: 'datosY', label: 'Y', value: '2 3 5 4 6', rows: 2 },
        { id: 'medias', label: 'Mostrar medias', type: 'check', value: true },
        { id: 'centro', label: 'Mostrar centro de gravedad (x̄, ȳ)', type: 'check', value: true }
      ],
      function (v, ctl) {
        var p = parseXY(ctl);
        var c = S.calc2d(p);
        var forma = c.r > 0.75 ? 'lineal positiva fuerte' :
                    c.r > 0.35 ? 'lineal positiva moderada' :
                    c.r > -0.35 ? 'sin dependencia lineal clara' :
                    c.r > -0.75 ? 'lineal negativa moderada' : 'lineal negativa fuerte';
        return scatter(p.x.map(function(x,i){return [x,p.y[i]];}), {
          title: 'Diagrama de dispersión (nube de puntos)',
          xLabel: 'X', yLabel: 'Y',
          showMedias: !!v.medias, showCentro: !!v.centro
        }) +
        '<div class="mx-info">Aspecto: <b>' + forma + '</b>. Recuerda mirar la nube antes de calcular $r$: la parábola perfecta también da $r\\approx 0$.</div>';
      });
  };

  /* ==================================================================
     10) correlacion — coeficiente r manipulable
     ================================================================== */
  R.correlacion = function (n) {
    shell(n,
      'Coeficiente de correlación de Pearson',
      'Elige un escenario o pega tus propios pares. El applet calcula $r$ y lo clasifica en la escala de intensidad.',
      [ chipsEsc(['ejemplo','positiva','negativa','nula','nolineal','espuria','pintura','exacta']),
        { id: 'datosX', label: 'X', value: '1 2 3 4 5', rows: 2 },
        { id: 'datosY', label: 'Y', value: '2 3 5 4 6', rows: 2 }
      ],
      function (v, ctl) {
        var p = parseXY(ctl);
        var c = S.calc2d(p);
        var ar = Math.abs(c.r);
        var etq = ar >= 0.95 ? 'muy fuerte' : ar >= 0.75 ? 'fuerte' : ar >= 0.45 ? 'moderada' : ar >= 0.2 ? 'débil' : 'muy débil o inexistente';
        var col = c.r > 0 ? 'pos' : c.r < 0 ? 'neg' : 'zero';
        // Barra de r
        var barW = 420, barH = 26;
        var pos = (c.r + 1) / 2 * barW;
        var barra = svgWrap(
          rect(0, 8, barW, 10, '#eee', '#cfd8dc') +
          rect(barW/2 - 1, 4, 2, 18, '#455a64') +
          '<circle cx="' + pos + '" cy="13" r="8" fill="' + (c.r > 0 ? '#1b5e20' : c.r < 0 ? '#b71c1c' : '#455a64') + '" stroke="#fff" stroke-width="2"/>' +
          txt(0, 42, '-1', {size:11, anchor:'start'}) +
          txt(barW/2, 42, '0', {size:11}) +
          txt(barW, 42, '+1', {size:11, anchor:'end'}),
          barW, 50, 'Escala de r');
        return scatter(p.x.map(function(x,i){return [x,p.y[i]];}), {
          title: 'Nube y coeficiente r', xLabel: 'X', yLabel: 'Y',
          showCentro: true
        }) + barra +
        '<div class="ap-kvs">' +
          '<div class="ap-kv"><b>σXY</b><span>' + nc(c.cov, 3) + '</span></div>' +
          '<div class="ap-kv"><b>σX · σY</b><span>' + nc(c.sdx * c.sdy, 3) + '</span></div>' +
          '<div class="ap-kv"><b>r</b><span>' + nc(c.r, 4) + '</span></div>' +
          '<div class="ap-kv"><b>Intensidad</b><span>' + etq + '</span></div>' +
        '</div>' +
        '<div class="mx-info">' + KD('r = \\dfrac{\\sigma_{XY}}{\\sigma_X\\,\\sigma_Y} = \\dfrac{' + kf(c.cov,3) + '}{' + kf(c.sdx,3) + '\\cdot ' + kf(c.sdy,3) + '} = ' + kf(c.r,4)) + '</div>' +
        '<span class="ap-badge ' + col + '">r = ' + nc(c.r, 4) + '</span>';
      });
  };

  /* ==================================================================
     11) determinacion — coeficiente de determinación r² como porcentaje
     ================================================================== */
  R.determinacion = function (n) {
    shell(n,
      'Coeficiente de determinación r²',
      'El cuadrado del coeficiente de correlación mide la proporción de la variabilidad de Y explicada linealmente por X.',
      [ chipsEsc(['ejemplo','positiva','negativa','pintura','nula','nolineal']),
        { id: 'datosX', label: 'X', value: '1 2 3 4 5', rows: 2 },
        { id: 'datosY', label: 'Y', value: '2 3 5 4 6', rows: 2 }
      ],
      function (v, ctl) {
        var p = parseXY(ctl);
        var c = S.calc2d(p);
        var pct = c.r2 * 100;
        // Donut simple
        var R0 = 60, cx = 90, cy = 90;
        var ang = 2 * Math.PI * c.r2;
        var lx = cx + R0 * Math.sin(ang), ly = cy - R0 * Math.cos(ang);
        var largeArc = ang > Math.PI ? 1 : 0;
        var arc = 'M ' + cx + ' ' + (cy - R0) + ' A ' + R0 + ' ' + R0 + ' 0 ' + largeArc + ' 1 ' + lx + ' ' + ly;
        var donut = svgWrap(
          '<circle cx="' + cx + '" cy="' + cy + '" r="' + R0 + '" fill="none" stroke="#eceff1" stroke-width="20"/>' +
          '<path d="' + arc + '" fill="none" stroke="#00695c" stroke-width="20" stroke-linecap="round"/>' +
          txt(cx, cy - 4, nc(pct, 1) + ' %', {size: 22, weight:'800', fill:'#00695c'}) +
          txt(cx, cy + 18, 'r² = ' + nc(c.r2, 3), {size: 12, fill:'#37474f'}),
          180, 180, 'Donut r²');
        return '<div class="ap-split"><div class="ap-pane">' + donut + '</div><div class="ap-pane">' +
          '<div class="mx-info">' + KD('r^2 = \\dfrac{\\sigma_{XY}^2}{\\sigma_X^2\\,\\sigma_Y^2} = ' + kf(c.r2, 4)) + '</div>' +
          '<div class="mx-info">Aproximadamente el <b>' + nc(pct, 1) + '&nbsp;%</b> de la variabilidad de $Y$ queda asociada linealmente a $X$.</div>' +
          '<div class="mx-info">El resto se debe a otros factores no lineales o no capturados: recuerda que $r^2$ NO demuestra causalidad.</div>' +
          '</div></div>';
      });
  };

  /* ==================================================================
     12) rectas — las dos rectas de regresión sobre la nube
     ================================================================== */
  R.rectas = function (n) {
    shell(n,
      'Las dos rectas de regresión',
      'La recta $Y|X$ minimiza distancias verticales; la recta $X|Y$ minimiza distancias horizontales. Se cortan siempre en $(\\bar{x},\\bar{y})$.',
      [ chipsEsc(['ejemplo','positiva','negativa','pintura','exacta']),
        { id: 'datosX', label: 'X', value: '1 2 3 4 5', rows: 2 },
        { id: 'datosY', label: 'Y', value: '2 3 5 4 6', rows: 2 },
        { id: 'yx', label: 'Recta Y|X', type: 'check', value: true },
        { id: 'xy', label: 'Recta X|Y', type: 'check', value: true }
      ],
      function (v, ctl) {
        var p = parseXY(ctl);
        var c = S.calc2d(p);
        var opts = { title: 'Rectas de regresión sobre la nube', xLabel: 'X', yLabel: 'Y', showCentro: true };
        if (v.yx) opts.rectaYX = { a: c.aYX, b: c.bYX };
        if (v.xy) opts.rectaXY = { a: c.aXY, b: c.bXY };
        var eq =
          '<div class="mx-info">Ecuaciones:<br>' +
          K('Y|X:\\ y - \\bar{y} = \\dfrac{\\sigma_{XY}}{\\sigma_X^2}(x - \\bar{x})') + ' &rarr; ' +
          K('y = ' + kf(c.bYX, 3) + 'x ' + (c.aYX >= 0 ? '+ ' : '- ') + kf(Math.abs(c.aYX), 3)) + '<br>' +
          K('X|Y:\\ x - \\bar{x} = \\dfrac{\\sigma_{XY}}{\\sigma_Y^2}(y - \\bar{y})') + ' &rarr; ' +
          K('x = ' + kf(c.bXY, 3) + 'y ' + (c.aXY >= 0 ? '+ ' : '- ') + kf(Math.abs(c.aXY), 3)) +
          '</div>';
        var prod = c.bYX * c.bXY;
        return scatter(p.x.map(function(x,i){return [x,p.y[i]];}), opts) + eq +
               '<div class="mx-info">Comprobación del producto de pendientes: ' +
               K('b_{YX}\\cdot b_{XY} = ' + kf(c.bYX,3) + '\\cdot ' + kf(c.bXY,3) + ' = ' + kf(prod,4) + ' = r^2') + '.</div>';
      });
  };

  /* ==================================================================
     13) residuos — segmentos verticales al Y|X y suma de cuadrados
     ================================================================== */
  R.residuos = function (n) {
    shell(n,
      'Residuos de la recta Y|X',
      'Los segmentos morados verticales son los residuos $e_i = y_i - \\hat{y}_i$. La recta de mínimos cuadrados hace mínima la suma de sus cuadrados.',
      [ chipsEsc(['ejemplo','positiva','negativa','pintura']),
        { id: 'datosX', label: 'X', value: '1 2 3 4 5', rows: 2 },
        { id: 'datosY', label: 'Y', value: '2 3 5 4 6', rows: 2 }
      ],
      function (v, ctl) {
        var p = parseXY(ctl);
        var c = S.calc2d(p);
        var sce = 0, iMax = -1, eMax = 0;
        var filas = '<table class="ap-tbl ap-2d"><thead><tr><th>i</th><th>x<sub>i</sub></th><th>y<sub>i</sub></th><th>ŷ<sub>i</sub></th><th>e<sub>i</sub>=y<sub>i</sub>−ŷ<sub>i</sub></th><th>e<sub>i</sub>²</th></tr></thead><tbody>';
        for (var i = 0; i < c.N; i++) {
          var yh = c.aYX + c.bYX * p.x[i], ei = p.y[i] - yh;
          sce += ei * ei;
          if (Math.abs(ei) > Math.abs(eMax)) { eMax = ei; iMax = i; }
          filas += '<tr><td>' + (i+1) + '</td><td>' + nc(p.x[i],2) + '</td><td>' + nc(p.y[i],2) +
                   '</td><td>' + nc(yh,3) + '</td><td>' + nc(ei,3) + '</td><td>' + nc(ei*ei,3) + '</td></tr>';
        }
        filas += '<tr><th colspan="5" class="ap-total">Σ e²</th><td class="ap-mg">' + nc(sce,3) + '</td></tr></tbody></table>';
        return scatter(p.x.map(function(x,i){return [x,p.y[i]];}), {
          title: 'Residuos verticales', xLabel: 'X', yLabel: 'Y',
          rectaYX: { a: c.aYX, b: c.bYX }, showResiduos: true, showCentro: true
        }) + filas +
        '<div class="mx-info">Individuo con mayor residuo positivo/negativo: <b>i = ' + (iMax+1) + '</b>, e = ' + nc(eMax, 3) + '. Los residuos positivos son «por encima de lo esperado» y los negativos «por debajo».</div>';
      });
  };

  /* ==================================================================
     14) inverso — problema inverso: dadas las rectas, halla x̄, ȳ, r
     ================================================================== */
  R.inverso = function (n) {
    shell(n,
      'Problema inverso',
      'Se dan las dos rectas de regresión y hay que hallar el centro de gravedad y el coeficiente de correlación. Modifica los cuatro coeficientes y observa la resolución.',
      [ { id: 'byx', label: 'b (recta Y|X, pendiente)', type: 'text', value: '0.6' },
        { id: 'ayx', label: 'a (recta Y|X, ordenada)', type: 'text', value: '2' },
        { id: 'bxy', label: 'b (recta X|Y, pendiente)', type: 'text', value: '1.2' },
        { id: 'axy', label: 'a (recta X|Y, ordenada)', type: 'text', value: '-1' }
      ],
      function (v) {
        var byx = Number(String(v.byx).replace(',','.')),
            ayx = Number(String(v.ayx).replace(',','.')),
            bxy = Number(String(v.bxy).replace(',','.')),
            axy = Number(String(v.axy).replace(',','.'));
        if (!Number.isFinite(byx*ayx*bxy*axy)) throw Error('Introduce cuatro números válidos.');
        // Resuelve  y = byx*x + ayx  y  x = bxy*y + axy
        // Sustituyendo: x = bxy*(byx*x + ayx) + axy → x(1 - bxy*byx) = bxy*ayx + axy
        var denom = 1 - bxy * byx;
        if (Math.abs(denom) < 1e-9) throw Error('Sistema incompatible: las dos rectas son paralelas.');
        var xb = (bxy * ayx + axy) / denom;
        var yb = byx * xb + ayx;
        var r2 = byx * bxy;
        if (r2 < 0) return '<div class="mx-bad ap-err">Producto de pendientes = ' + nc(r2, 4) + ' &lt; 0. Imposible: las dos rectas siempre tienen el mismo signo. Revisa los datos.</div>';
        if (r2 > 1) return '<div class="mx-bad ap-err">Producto de pendientes = ' + nc(r2, 4) + ' &gt; 1. Imposible: siempre $|r|\\le 1$. Revisa los datos.</div>';
        var r = Math.sign(byx) * Math.sqrt(r2);
        return '<div class="mx-info">Sistema:' +
          KD('\\left\\{\\begin{array}{l} y = ' + kf(byx,3) + 'x ' + (ayx>=0?'+ ':'- ') + kf(Math.abs(ayx),3) + ' \\\\ x = ' + kf(bxy,3) + 'y ' + (axy>=0?'+ ':'- ') + kf(Math.abs(axy),3) + '\\end{array}\\right.') +
          'Sustituyendo la primera en la segunda: ' +
          KD('x = ' + kf(bxy,3) + '(' + kf(byx,3) + 'x ' + (ayx>=0?'+ ':'- ') + kf(Math.abs(ayx),3) + ') ' + (axy>=0?'+ ':'- ') + kf(Math.abs(axy),3)) +
          '</div>' +
          '<div class="ap-kvs">' +
          '<div class="ap-kv"><b>x̄</b><span>' + nc(xb, 3) + '</span></div>' +
          '<div class="ap-kv"><b>ȳ</b><span>' + nc(yb, 3) + '</span></div>' +
          '<div class="ap-kv"><b>r² = bYX·bXY</b><span>' + nc(r2, 4) + '</span></div>' +
          '<div class="ap-kv"><b>r</b><span>' + nc(r, 4) + '</span></div>' +
          '</div>' +
          scatter([[xb,yb]], {
            title: 'Las dos rectas se cortan en (x̄, ȳ)', xLabel: 'X', yLabel: 'Y',
            xMin: xb - 5, xMax: xb + 5, yMin: yb - 5, yMax: yb + 5,
            rectaYX: {a: ayx, b: byx}, rectaXY: {a: axy, b: bxy}, showCentro: true
          });
      });
  };

  /* ==================================================================
     15) cuadratica — ajuste cuadrático y = a + bx + cx²
     ================================================================== */
  function resolve3x3(A, b) {
    // Elimina Gauss con pivote parcial
    var M = [[A[0][0],A[0][1],A[0][2],b[0]],
             [A[1][0],A[1][1],A[1][2],b[1]],
             [A[2][0],A[2][1],A[2][2],b[2]]];
    for (var i = 0; i < 3; i++) {
      var mx = i;
      for (var k = i + 1; k < 3; k++) if (Math.abs(M[k][i]) > Math.abs(M[mx][i])) mx = k;
      var tmp = M[i]; M[i] = M[mx]; M[mx] = tmp;
      if (Math.abs(M[i][i]) < 1e-12) throw Error('Sistema mal condicionado para el ajuste cuadrático.');
      for (var j = i + 1; j < 3; j++) {
        var f = M[j][i] / M[i][i];
        for (var l = i; l < 4; l++) M[j][l] -= f * M[i][l];
      }
    }
    var x = [0,0,0];
    for (var i2 = 2; i2 >= 0; i2--) {
      var s = M[i2][3];
      for (var j2 = i2 + 1; j2 < 3; j2++) s -= M[i2][j2] * x[j2];
      x[i2] = s / M[i2][i2];
    }
    return x;
  }

  R.cuadratica = function (n) {
    shell(n,
      'Regresión cuadrática y = a + bx + cx²',
      'Cuando la nube presenta un mínimo o un máximo, la recta no basta. El applet resuelve el sistema $3\\times 3$ de mínimos cuadrados y superpone la parábola.',
      [ chipsEsc(['nolineal','ejemplo','positiva']),
        { id: 'datosX', label: 'X', value: '1 2 3 4', rows: 2 },
        { id: 'datosY', label: 'Y', value: '3.7 0.9 0.2 1.2', rows: 2 }
      ],
      function (v, ctl) {
        var p = parseXY(ctl);
        if (p.x.length < 3) throw Error('El ajuste cuadrático necesita al menos 3 pares.');
        var N = p.x.length;
        var sx=0, sx2=0, sx3=0, sx4=0, sy=0, sxy=0, sx2y=0;
        for (var i = 0; i < N; i++) {
          var x=p.x[i], y=p.y[i];
          sx += x; sx2 += x*x; sx3 += x*x*x; sx4 += x*x*x*x;
          sy += y; sxy += x*y; sx2y += x*x*y;
        }
        var abc = resolve3x3([[N,sx,sx2],[sx,sx2,sx3],[sx2,sx3,sx4]], [sy,sxy,sx2y]);
        var a = abc[0], b = abc[1], c2 = abc[2];
        return scatter(p.x.map(function(x,i){return [x,p.y[i]];}), {
          title: 'Nube y parábola de regresión', xLabel: 'X', yLabel: 'Y',
          parab: { a: a, b: b, c: c2 }, showCentro: true
        }) +
        '<div class="mx-info">Sistema resuelto:' +
          KD('\\left\\{\\begin{array}{l} aN + b\\sum x_i + c\\sum x_i^2 = \\sum y_i \\\\ a\\sum x_i + b\\sum x_i^2 + c\\sum x_i^3 = \\sum x_i y_i \\\\ a\\sum x_i^2 + b\\sum x_i^3 + c\\sum x_i^4 = \\sum x_i^2 y_i \\end{array}\\right.') +
          'Solución: ' + K('a = ' + kf(a,3) + ',\\ b = ' + kf(b,3) + ',\\ c = ' + kf(c2,3)) + '. Parábola: ' +
          K('y = ' + kf(a,3) + (b>=0?' + ':' - ') + kf(Math.abs(b),3) + 'x ' + (c2>=0?'+ ':'- ') + kf(Math.abs(c2),3) + 'x^2') +
          '</div>';
      });
  };

  /* ==================================================================
     16) estimacion — interpolación vs extrapolación con predicción visual
     ================================================================== */
  R.estimacion = function (n) {
    shell(n,
      'Estimación · interpolación y extrapolación',
      'Elige un valor conocido de $X$ (o de $Y$) y el applet devuelve la estimación con la recta adecuada, y avisa si el punto queda fuera del intervalo observado.',
      [ chipsEsc(['pintura','ejemplo','positiva','negativa']),
        { id: 'datosX', label: 'X', value: '5 10 20 30', rows: 2 },
        { id: 'datosY', label: 'Y', value: '16 17 18 19', rows: 2 },
        { id: 'dir', label: 'Quiero estimar', type: 'select', options: [
          {value:'y', label:'y a partir de x (Y|X)'},
          {value:'x', label:'x a partir de y (X|Y)'}
        ], value: 'y' },
        { id: 'val', label: 'Valor conocido', type: 'text', value: '16' }
      ],
      function (v, ctl) {
        var p = parseXY(ctl);
        var c = S.calc2d(p);
        var val = Number(String(v.val).replace(',','.'));
        if (!Number.isFinite(val)) throw Error('Introduce un valor numérico.');
        var opt = { title: 'Estimación sobre las rectas de regresión', xLabel: 'X', yLabel: 'Y',
                    zonaInterp: true, showCentro: true };
        var mensaje = '';
        if (v.dir === 'y') {
          opt.rectaYX = { a: c.aYX, b: c.bYX };
          opt.xPred = val;
          var yp = c.aYX + c.bYX * val;
          var fuera = val < c.minX || val > c.maxX;
          mensaje = 'Para ' + K('x = ' + kf(val,3)) + ', la recta Y|X predice ' + K('\\hat{y} = ' + kf(yp,3)) + '. ' +
                    (fuera ? '<b>Extrapolación</b>: el valor queda fuera del intervalo observado ['+nc(c.minX,2)+', '+nc(c.maxX,2)+']. La estimación es arriesgada.'
                           : '<b>Interpolación</b>: el valor está dentro del intervalo observado ['+nc(c.minX,2)+', '+nc(c.maxX,2)+']. Con $|r| = ' + nc(Math.abs(c.r),3) + '$ la fiabilidad es ' + (Math.abs(c.r) >= 0.9 ? 'muy alta.' : Math.abs(c.r) >= 0.7 ? 'alta.' : 'moderada o baja.'));
        } else {
          opt.rectaXY = { a: c.aXY, b: c.bXY };
          opt.yPred = val;
          var xp = c.aXY + c.bXY * val;
          var fueraY = val < c.minY || val > c.maxY;
          mensaje = 'Para ' + K('y = ' + kf(val,3)) + ', la recta X|Y predice ' + K('\\hat{x} = ' + kf(xp,3)) + '. ' +
                    (fueraY ? '<b>Extrapolación</b>: el valor de $y$ queda fuera del intervalo observado.' : '<b>Interpolación</b>: el valor está dentro del intervalo observado.');
        }
        return scatter(p.x.map(function(x,i){return [x,p.y[i]];}), opt) +
               '<div class="mx-info">' + mensaje + '</div>' +
               '<div class="mx-warn">Regla de oro: para estimar $y$ dado $x$, usa Y|X; para estimar $x$ dado $y$, usa X|Y. NO despejes.</div>';
      });
  };

  /* ==================================================================
     17) interpolacion — visor del intervalo válido y comparación con extrapolación
     ================================================================== */
  R.interpolacion = function (n) {
    shell(n,
      'Interpolación vs. extrapolación',
      'La banda verde marca el rango de $X$ observado. Mueve el deslizador para ver cómo cambia la fiabilidad de la predicción cuando el nuevo $x$ entra o sale de esa banda.',
      [ chipsEsc(['pintura','ejemplo','positiva','negativa','nolineal']),
        { id: 'datosX', label: 'X', value: '5 10 20 30', rows: 2 },
        { id: 'datosY', label: 'Y', value: '16 17 18 19', rows: 2 },
        { id: 'xEst', label: 'Nuevo valor de X (mueve el deslizador)', type: 'range', min: -20, max: 60, step: 0.5, value: 15 }
      ],
      function (v, ctl) {
        var p = parseXY(ctl);
        var c = S.calc2d(p);
        var xE = Number(v.xEst);
        var yp = c.aYX + c.bYX * xE;
        var dentro = xE >= c.minX && xE <= c.maxX;
        var margen = dentro ? 0 : Math.min(Math.abs(xE - c.minX), Math.abs(xE - c.maxX));
        var etiqueta = dentro ?
          '<span class="ap-badge pos">Interpolación segura</span>' :
          (margen < (c.maxX - c.minX) * 0.25 ?
           '<span class="ap-badge zero">Extrapolación cercana</span>' :
           '<span class="ap-badge neg">Extrapolación arriesgada</span>');
        return scatter(p.x.map(function(x,i){return [x,p.y[i]];}), {
          title: 'Interpolación vs. extrapolación', xLabel: 'X', yLabel: 'Y',
          rectaYX: { a: c.aYX, b: c.bYX }, xPred: xE, zonaInterp: true, showCentro: true
        }) +
        '<div class="ap-kvs">' +
          '<div class="ap-kv"><b>Intervalo observado</b><span>[' + nc(c.minX,2) + ', ' + nc(c.maxX,2) + ']</span></div>' +
          '<div class="ap-kv"><b>Nuevo x</b><span>' + nc(xE,2) + '</span></div>' +
          '<div class="ap-kv"><b>Predicción ŷ</b><span>' + nc(yp,3) + '</span></div>' +
          '<div class="ap-kv"><b>Situación</b><span>' + etiqueta + '</span></div>' +
        '</div>' +
        '<div class="mx-info">A mayor $|r|$ y mayor cercanía al intervalo observado, mayor fiabilidad. Aquí $|r|=' + nc(Math.abs(c.r),3) + '$.</div>';
      });
  };

  /* ==================================================================
     18) entrenador — ejercicios paso a paso con corrección automática
     ================================================================== */
  R.entrenador = function (n) {
    var ejercicios = [
      {
        titulo: 'Ejemplo guiado de los apuntes',
        x: [1,2,3,4,5], y: [2,3,5,4,6],
        preguntas: [
          { q: 'x̄',   ans: 3,   tol: 0.05 },
          { q: 'ȳ',   ans: 4,   tol: 0.05 },
          { q: 'σXY', ans: 1.8, tol: 0.05 },
          { q: 'r',   ans: 0.9, tol: 0.02 },
          { q: 'r²',  ans: 0.81, tol: 0.02 }
        ]
      },
      {
        titulo: 'Pintura (apuntes 2.7.2.1)',
        x: [5,10,20,30], y: [16,17,18,19],
        preguntas: [
          { q: 'x̄',   ans: 16.25, tol: 0.1 },
          { q: 'ȳ',   ans: 17.5,  tol: 0.05 },
          { q: 'σXY', ans: 10.63, tol: 0.1 },
          { q: 'r',   ans: 0.99,  tol: 0.02 }
        ]
      },
      {
        titulo: 'Horas de videojuegos',
        x: [0.5,1,1.5,2,2.5,3,3.5,4,5,6],
        y: [9.1,7.6,8.3,6.5,7.2,5.4,5.9,4.3,3.9,2.4],
        preguntas: [
          { q: 'σXY (signo)', ans: -1, tol: 0.5, esSigno: true },
          { q: 'r (aprox 2 dec)', ans: -0.95, tol: 0.05 }
        ]
      }
    ];
    shell(n,
      'Entrenador bidimensional',
      'Elige un ejercicio, calcula a mano y comprueba. El applet acepta hasta la tolerancia indicada.',
      [ { id: 'ej', label: 'Ejercicio', type: 'select',
          options: ejercicios.map(function(e,i){ return {value:String(i), label:e.titulo}; }),
          value: '0' } ],
      function (v) {
        var e = ejercicios[Number(v.ej)];
        var c = S.calc2d({x:e.x, y:e.y});
        var respuestas = { 'x̄': c.mx, 'ȳ': c.my, 'σXY': c.cov, 'r': c.r, 'r²': c.r2,
                           'σXY (signo)': Math.sign(c.cov), 'r (aprox 2 dec)': c.r };
        var h = '<table class="ap-tbl ap-2d"><thead><tr><th>Pregunta</th><th>Escribe tu respuesta</th><th>Corrección</th></tr></thead><tbody>';
        e.preguntas.forEach(function (pr, idx) {
          h += '<tr><td>' + pr.q + '</td>' +
               '<td><input class="ap-cell" data-ej="' + idx + '" style="width:5rem"></td>' +
               '<td data-out="' + idx + '">—</td></tr>';
        });
        h += '</tbody></table>' +
             '<div><button type="button" class="mx-btn" data-comp>Comprobar</button> ' +
             '<button type="button" class="mx-sec" data-resol>Ver solución</button></div>';
        setTimeout(function () {
          var node = document.querySelector('[data-applet-est2="entrenador"]');
          if (!node) return;
          node.querySelectorAll('[data-comp]').forEach(function (b) {
            b.onclick = function () {
              e.preguntas.forEach(function (pr, idx) {
                var inp = node.querySelector('[data-ej="' + idx + '"]');
                var out = node.querySelector('[data-out="' + idx + '"]');
                var val = Number(String(inp.value || '').replace(',','.'));
                var truth = respuestas[pr.q];
                if (!Number.isFinite(val)) { out.innerHTML = '<span class="mx-warn">?</span>'; return; }
                var ok = pr.esSigno ? Math.sign(val) === truth
                                    : Math.abs(val - truth) <= pr.tol;
                out.innerHTML = ok ? '<span class="ap-badge pos">correcto</span>' :
                                     '<span class="ap-badge neg">revisa</span>';
              });
            };
          });
          node.querySelectorAll('[data-resol]').forEach(function (b) {
            b.onclick = function () {
              e.preguntas.forEach(function (pr, idx) {
                var out = node.querySelector('[data-out="' + idx + '"]');
                var truth = respuestas[pr.q];
                out.innerHTML = '<span class="ap-badge zero">' + (pr.esSigno ? (truth > 0 ? '> 0' : truth < 0 ? '< 0' : '= 0') : nc(truth, 3)) + '</span>';
              });
            };
          });
        }, 30);
        return h + '<div class="mx-info">Escribe cada respuesta con coma o punto decimal. La tolerancia por defecto es de $\\pm 0{,}05$.</div>';
      });
  };

  /* ==================================================================
     19) diagnostico — verifica que todo está montado
     ================================================================== */
  R.diagnostico = function (n) {
    n.classList.add('applet');
    n.innerHTML = '<h4 class="mx-title">Applet · Diagnóstico</h4>' +
      '<div class="mx-instr">Comprueba que el módulo principal y el módulo extra se han cargado y que todos los applets de esta página están montados.</div>' +
      '<div class="ap-out mx-out" data-est-count></div>';
    setTimeout(function () {
      var a = document.querySelectorAll('[data-applet-est2]').length;
      var b = document.querySelectorAll('[data-applet-est2][data-mounted]').length;
      var g = document.querySelectorAll('.ap-fig svg').length;
      var extra = window.EST2 && window.EST2.extra === true;
      var keys = window.EST2 ? Object.keys(window.EST2.registry).length : 0;
      var el = n.querySelector('[data-est-count]');
      el.innerHTML =
        'window.EST2 disponible: ' + (window.EST2 ? '✓' : '✗') + '<br>' +
        'window.EST2.extra = true: ' + (extra ? '✓' : '✗') + '<br>' +
        'Applets en el registry: ' + keys + '<br>' +
        'Applets en la página: ' + a + ', montados: ' + b + (a === b ? ' ✓' : ' ✗') + '<br>' +
        'Gráficos SVG dibujados: ' + g + '<br>' +
        'Errores registrados: ' + (window.EST2 ? window.EST2.log.length : '—');
      el.style.color = (extra && a === b) ? '#1b5e20' : '#b71c1c';
      el.style.fontWeight = '600';
    }, 180);
  };

  S.extra = true;
})();
