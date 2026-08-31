/* =====================================================================
   est1-applets-extra.js · Estadística unidimensional · 2.º Bachillerato
   Versión 2 · visualización y manipulación

   Sustituye el módulo anterior. Depende de window.EST1 (est1-applets.js).

   Applets registrados aquí (16):
     clasificador · tabla · agrupador · centralizacion · atipicos
     cuantiles · interpolacion · dispersion · intervalo · empirica
     tipificacion · graficas · boxplot · laboratorio · entrenador
     diagnostico

   JavaScript plano, gráficos SVG propios, sin OJS, CDN ni dependencias
   de red. Los estilos de composición se inyectan desde este archivo,
   por lo que no es necesario modificar est1-applets.css.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.EST1;
  if (!S) return;

  var R = S.registry;

  /* ---------------------------------------------------------------
     0 · utilidades básicas
     --------------------------------------------------------------- */

  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var K = function (t) { return '<span data-tex="' + esc(t) + '"></span>'; };
  var KD = function (t) { return '<span data-tex="' + esc(t) + '" data-display="1"></span>'; };

  /* redondeo con punto decimal (uso interno y KaTeX) */
  var fmt = function (x, d) {
    d = d === undefined ? 3 : d;
    if (!Number.isFinite(x)) return '—';
    var y = Math.round(x * Math.pow(10, d)) / Math.pow(10, d);
    return String(Object.is(y, -0) ? 0 : y);
  };
  /* coma decimal para todo el texto visible en español */
  var nc = function (x, d) { return fmt(x, d).replace('.', ','); };
  /* coma decimal dentro de KaTeX */
  var kf = function (x, d) { return fmt(x, d).replace('.', '{,}'); };

  var ok = function (m) { return '<div class="mx-ok">' + m + '</div>'; };
  var info = function (m) { return '<div class="mx-info">' + m + '</div>'; };
  var warn = function (m) { return '<div class="mx-warn">' + m + '</div>'; };
  var bad = function (m) { return '<div class="mx-bad ap-err">' + m + '</div>'; };

  var COL = {
    dato: '#4e79a7',
    datoBorde: '#2f4f6f',
    media: '#e07b00',
    mediana: '#c62828',
    moda: '#6a3d9a',
    banda: '#76b7b2',
    pk: '#d81b60',
    eje: '#455a64',
    guia: '#cfd8dc',
    texto: '#263238'
  };

  /* ---------------------------------------------------------------
     1 · estilos de composición (inyectados una sola vez)
     --------------------------------------------------------------- */

  (function injectCss() {
    if (document.getElementById('est1-extra-css')) return;
    var css =
      '.ap-split{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);' +
      'gap:1rem;align-items:start;margin:.6rem 0}' +
      '.ap-pane{min-width:0}.ap-pane .ap-tbl{width:100%;margin-top:0}' +
      '.ap-fig{margin:.5rem 0}.ap-fig svg{display:block;max-width:100%;height:auto}' +
      '.ap-figcap{font-size:.78rem;color:#546e7a;margin:.25rem 0 0;line-height:1.35}' +
      '.ap-legend{list-style:none;padding:0;margin:.4rem 0 0;display:flex;' +
      'flex-wrap:wrap;gap:.35rem .95rem}' +
      '.ap-legend li{display:flex;align-items:center;gap:.35rem;font-size:.8rem;color:#37474f}' +
      '.ap-legend svg{display:block}' +
      '.mx-field.ap-off{opacity:.5}' +
      '.mx-in:disabled{background:#eceff1;cursor:not-allowed}' +
      '.ap-tbl td.ap-hl,.ap-tbl th.ap-hl{background:#eef3fa;font-weight:700}' +
      '.ap-chips{display:flex;flex-wrap:wrap;gap:.35rem;margin:.5rem 0}' +
      '.ap-chip{font-size:.78rem;border:1px solid #cfd8dc;background:#f6f8fa;' +
      'border-radius:999px;padding:.15rem .6rem;cursor:pointer;color:#37474f}' +
      '.ap-chip:hover{background:#e3ecf5;border-color:#90a4ae}' +
      '.ap-score{font-size:.8rem;font-weight:700;color:#37474f;align-self:flex-end}' +
      '@media(max-width:860px){.ap-split{grid-template-columns:1fr}}';
    var st = document.createElement('style');
    st.id = 'est1-extra-css';
    st.textContent = css;
    document.head.appendChild(st);
  })();

  /* ---------------------------------------------------------------
     2 · armazón de applets con controles
     --------------------------------------------------------------- */

  function shell(node, title, instructions, fields, compute) {
    node.classList.add('applet');
    node.innerHTML = '<h4 class="mx-title">Applet · ' + title + '</h4>' +
      '<div class="mx-instr">' + instructions + '</div>' +
      '<div class="mx-inputs"></div><div class="mx-out ap-out"></div>';
    var inputs = node.querySelector('.mx-inputs');
    var out = node.querySelector('.mx-out');
    var ctl = {}, labs = {}, defs = {};

    fields.forEach(function (f) {
      defs[f.id] = f;
      var lab = document.createElement('label');
      lab.className = 'mx-field';
      var cap = document.createElement('span');
      cap.textContent = f.label;
      lab.appendChild(cap);
      var el;

      if (f.type === 'select') {
        el = document.createElement('select');
        f.options.forEach(function (o) {
          var op = document.createElement('option');
          op.value = o; op.textContent = o; el.appendChild(op);
        });
        el.value = f.value || f.options[0];
        el.className = 'mx-in';
        lab.appendChild(el);
      } else if (f.type === 'range') {
        el = document.createElement('input');
        el.type = 'range';
        el.min = f.min; el.max = f.max; el.step = f.step || 1; el.value = f.value;
        var live = document.createElement('span');
        live.className = 'mx-mono';
        live.style.fontSize = '.8rem';
        live.textContent = String(el.value).replace('.', ',');
        el.addEventListener('input', function () {
          live.textContent = String(el.value).replace('.', ',');
        });
        el.className = 'mx-in';
        lab.appendChild(el); lab.appendChild(live);
      } else if (f.type === 'check') {
        el = document.createElement('input');
        el.type = 'checkbox';
        el.checked = !!f.value;
        el.style.width = 'auto';
        el.style.minWidth = '0';
        el.className = 'mx-in';
        lab.appendChild(el);
      } else if (f.type === 'text') {
        el = document.createElement('input');
        el.type = 'text'; el.value = f.value || '';
        el.className = 'mx-in';
        lab.appendChild(el);
      } else {
        el = document.createElement('textarea');
        el.rows = f.rows || 3; el.value = f.value || ''; el.spellcheck = false;
        el.className = 'mx-in';
        lab.appendChild(el);
      }

      inputs.appendChild(lab);
      ctl[f.id] = el; labs[f.id] = lab;
      el.addEventListener('input', run);
      el.addEventListener('change', run);
    });

    /* atajos para cargar conjuntos de ejemplo */
    if (fields.length && fields[0].presets) {
      var chips = document.createElement('div');
      chips.className = 'ap-chips';
      fields[0].presets.forEach(function (p) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'ap-chip';
        b.textContent = p.label;
        b.addEventListener('click', function () {
          ctl[fields[0].id].value = p.data;
          run();
        });
        chips.appendChild(b);
      });
      node.insertBefore(chips, out);
    }

    function values() {
      var v = {};
      Object.keys(ctl).forEach(function (x) {
        v[x] = ctl[x].type === 'checkbox' ? ctl[x].checked : ctl[x].value;
      });
      return v;
    }

    function run() {
      var v = values();
      /* activación condicional de controles */
      Object.keys(defs).forEach(function (id) {
        var f = defs[id];
        if (typeof f.enabledWhen !== 'function') return;
        var on = false;
        try { on = !!f.enabledWhen(v); } catch (e) { on = true; }
        ctl[id].disabled = !on;
        labs[id].classList.toggle('ap-off', !on);
        labs[id].title = on ? '' : (f.offNote || 'Este control no interviene con la opción elegida.');
      });
      try {
        out.innerHTML = compute(v);
        S.tex(out);
      } catch (e) {
        out.innerHTML = bad(e.message);
        S.log.push({ applet: title, error: e.message });
      }
    }
    run();
  }

  /* ---------------------------------------------------------------
     3 · biblioteca gráfica SVG
     --------------------------------------------------------------- */

  function fig(body, W, H, label, caption) {
    return '<div class="ap-fig"><svg role="img" aria-label="' + esc(label) +
      '" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H +
      '" style="background:#fff;border:1px solid #d9e0e4;border-radius:6px">' +
      '<title>' + esc(label) + '</title>' + body + '</svg>' +
      (caption ? '<p class="ap-figcap">' + caption + '</p>' : '') + '</div>';
  }

  function txt(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.anchor || 'middle') +
      '" font-size="' + (o.size || 11) + '" font-weight="' + (o.weight || 'normal') +
      '" fill="' + (o.fill || COL.texto) + '">' + s + '</text>';
  }

  /* título interior del gráfico */
  function head(W, s) {
    return txt(W / 2, 18, esc(s), { size: 12.5, weight: '700', fill: '#37474f' });
  }

  /* marcas de eje legibles y no duplicadas */
  function ticks(d0, d1, target) {
    var span = d1 - d0;
    if (!(span > 0)) return [d0];
    var raw = span / (target || 6);
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var norm = raw / mag, step;
    if (norm < 1.5) step = mag; else if (norm < 3) step = 2 * mag;
    else if (norm < 7) step = 5 * mag; else step = 10 * mag;
    var t = [], first = Math.ceil(d0 / step) * step;
    for (var x = first; x <= d1 + step * 1e-9; x += step) t.push(Math.round(x / step) * step);
    return t;
  }

  /* símbolos de las medidas: distinguibles sin depender del color */
  function glyph(kind, x, y, color) {
    if (kind === 'tri') {
      return '<path d="M ' + x + ' ' + (y - 7) + ' L ' + (x + 6.5) + ' ' + (y + 5) +
        ' L ' + (x - 6.5) + ' ' + (y + 5) + ' Z" fill="' + color + '" stroke="#fff" stroke-width="1"/>';
    }
    if (kind === 'sq') {
      return '<rect x="' + (x - 5.5) + '" y="' + (y - 5.5) + '" width="11" height="11" fill="' +
        color + '" stroke="#fff" stroke-width="1"/>';
    }
    if (kind === 'dia') {
      return '<path d="M ' + x + ' ' + (y - 7) + ' L ' + (x + 7) + ' ' + y + ' L ' + x + ' ' +
        (y + 7) + ' L ' + (x - 7) + ' ' + y + ' Z" fill="' + color + '" stroke="#fff" stroke-width="1"/>';
    }
    return '<circle cx="' + x + '" cy="' + y + '" r="5" fill="' + color + '" stroke="#fff"/>';
  }

  function legend(items) {
    if (!items.length) return '';
    return '<ul class="ap-legend">' + items.map(function (it) {
      return '<li><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">' +
        (it.kind === 'bar'
          ? '<rect x="2" y="3" width="14" height="12" fill="' + it.color + '" opacity=".8"/>'
          : it.kind === 'band'
            ? '<rect x="1" y="4" width="16" height="10" fill="' + it.color + '" opacity=".3" stroke="' + it.color + '"/>'
            : glyph(it.kind, 9, 9, it.color)) +
        '</svg><span>' + it.text + '</span></li>';
    }).join('') + '</ul>';
  }

  /* etiqueta de la media con barra superior real, sin depender de KaTeX.
     Se ancla a la izquierda para que la barra caiga exactamente sobre la x. */
  function meanLabel(x, y, value, color) {
    return '<g><line x1="' + (x + 0.5) + '" y1="' + (y - 9.5) + '" x2="' + (x + 6.5) + '" y2="' +
      (y - 9.5) + '" stroke="' + color + '" stroke-width="1.3"/>' +
      txt(x, y, 'x = ' + value, { size: 10.5, weight: '700', fill: color, anchor: 'start' }) + '</g>';
  }

  /* ---- diagrama de puntos sobre recta numérica -------------------- */
  /* opts: marks[{value,kind,color,text}], bands[{from,to,color,text}],
           height, title, caption, extra                              */
  function dotPlot(a, opts) {
    opts = opts || {};
    var W = 560, H = opts.height || 190;
    var ml = 26, mr = 26, axisY = H - 46;
    var marks = opts.marks || [], bands = opts.bands || [];
    var lo = Math.min.apply(null, a), hi = Math.max.apply(null, a);
    marks.forEach(function (m) { lo = Math.min(lo, m.value); hi = Math.max(hi, m.value); });
    bands.forEach(function (b) { lo = Math.min(lo, b.from); hi = Math.max(hi, b.to); });
    var span = (hi - lo) || Math.max(1, Math.abs(hi) || 1);
    var d0 = lo - span * 0.08, d1 = hi + span * 0.08;
    var sc = function (x) { return ml + (x - d0) / (d1 - d0) * (W - ml - mr); };

    var body = head(W, opts.title || 'Distribución de los datos');
    var bandIdx = 0;

    /* bandas de fondo */
    bands.forEach(function (b) {
      var x1 = sc(b.from), x2 = sc(b.to);
      body += '<rect x="' + x1 + '" y="34" width="' + Math.max(1, x2 - x1) + '" height="' +
        (axisY - 34) + '" fill="' + b.color + '" opacity=".16"/>' +
        '<line x1="' + x1 + '" y1="34" x2="' + x1 + '" y2="' + axisY + '" stroke="' + b.color +
        '" stroke-dasharray="3 3"/><line x1="' + x2 + '" y1="34" x2="' + x2 + '" y2="' + axisY +
        '" stroke="' + b.color + '" stroke-dasharray="3 3"/>';
      if (b.text) {
        body += txt(Math.min(W - 4, x2 - 4), 34 + (bandIdx++) * 13, esc(b.text),
          { size: 10, fill: '#00695c', anchor: 'end', weight: '600' });
      }
    });

    /* eje */
    var tk = ticks(d0, d1, 7);
    body += '<line x1="' + ml + '" y1="' + axisY + '" x2="' + (W - mr / 2) + '" y2="' + axisY +
      '" stroke="' + COL.eje + '" stroke-width="1.4"/>';
    tk.forEach(function (t) {
      var x = sc(t);
      body += '<line x1="' + x + '" y1="' + axisY + '" x2="' + x + '" y2="' + (axisY + 5) +
        '" stroke="' + COL.eje + '"/>' + txt(x, axisY + 17, nc(t, 2), { size: 10, fill: '#546e7a' });
    });

    /* puntos apilados */
    var f = {};
    a.forEach(function (x) { f[x] = (f[x] || 0) + 1; });
    var maxF = Math.max.apply(null, Object.keys(f).map(function (k) { return f[k]; }));
    var room = axisY - 56;
    var step = Math.min(14, Math.max(5, room / Math.max(maxF, 1)));
    var r = Math.min(5.5, step * 0.42);
    Object.keys(f).map(Number).sort(function (p, q) { return p - q; }).forEach(function (x) {
      for (var i = 0; i < f[x]; i++) {
        body += '<circle cx="' + sc(x) + '" cy="' + (axisY - 8 - i * step - r) + '" r="' + r +
          '" fill="' + COL.dato + '" opacity=".85" stroke="' + COL.datoBorde + '" stroke-width=".8"/>';
      }
    });

    /* medidas: solo línea y símbolo, escalonados; los valores van en la leyenda */
    var sorted = marks.slice().sort(function (p, q) { return p.value - q.value; });
    var lastX = -1e9, level = 0;
    sorted.forEach(function (m) {
      var x = sc(m.value);
      if (x - lastX < 18) level = (level + 1) % 3; else level = 0;
      lastX = x;
      var ly = 50 + level * 20;
      body += '<line x1="' + x + '" y1="' + (ly + 8) + '" x2="' + x + '" y2="' + axisY +
        '" stroke="' + m.color + '" stroke-width="1.6" stroke-dasharray="5 3"/>';
      body += glyph(m.kind, x, ly, m.color);
    });

    body += (opts.extra || '');
    return fig(body, W, H, opts.title || 'Diagrama de puntos', opts.caption) +
      legend([{ kind: 'dot', color: COL.dato, text: 'cada dato observado' }].concat(
        marks.map(function (m) { return { kind: m.kind, color: m.color, text: m.legend || m.text }; }),
        bands.map(function (b) { return { kind: 'band', color: b.color, text: b.legend || b.text || 'intervalo' }; })
      ));
  }

  /* ---- diagrama de barras con etiquetas -------------------------- */
  function barChart(cats, vals, opts) {
    opts = opts || {};
    var W = 540, H = 290, ml = 46, mb = 46, mt = 32;
    var ymax = Math.max.apply(null, vals) || 1;
    var iw = W - ml - 18, ih = H - mb - mt;
    var bw = iw / cats.length;
    var body = head(W, opts.title || 'Diagrama de barras');
    /* rejilla */
    ticks(0, ymax, 4).forEach(function (t) {
      var y = H - mb - t / ymax * ih;
      body += '<line x1="' + ml + '" y1="' + y + '" x2="' + (W - 14) + '" y2="' + y +
        '" stroke="#eceff1"/>' + txt(ml - 6, y + 4, nc(t, 2), { size: 10, anchor: 'end', fill: '#546e7a' });
    });
    body += '<line x1="' + ml + '" y1="' + mt + '" x2="' + ml + '" y2="' + (H - mb) +
      '" stroke="' + COL.eje + '"/><line x1="' + ml + '" y1="' + (H - mb) + '" x2="' + (W - 14) +
      '" y2="' + (H - mb) + '" stroke="' + COL.eje + '"/>';
    cats.forEach(function (cat, i) {
      var ht = vals[i] / ymax * ih;
      var x = ml + i * bw + bw * (opts.touching ? 0 : 0.15);
      var w = bw * (opts.touching ? 1 : 0.7);
      body += '<rect x="' + x + '" y="' + (H - mb - ht) + '" width="' + w + '" height="' + ht +
        '" fill="' + (opts.color || COL.dato) + '" opacity=".82"' +
        (opts.touching ? ' stroke="#fff"' : '') + '/>';
      if (vals[i] > 0) {
        body += txt(x + w / 2, H - mb - ht - 5, nc(vals[i], 3), { size: 10, weight: '600', fill: '#37474f' });
      }
      body += txt(ml + (i + 0.5) * bw, H - mb + 16, esc(String(cat)), { size: 10.5 });
    });
    body += txt(ml + iw / 2, H - 8, esc(opts.xlab || 'valores de la variable'), { size: 10.5, fill: '#546e7a' });
    body += txt(14, mt + ih / 2, esc(opts.ylab || 'frecuencia'), {
      size: 10.5, fill: '#546e7a'
    }).replace('<text', '<text transform="rotate(-90 14 ' + (mt + ih / 2) + ')"');
    return fig(body, W, H, opts.title || 'Diagrama de barras', opts.caption);
  }

  /* ---- histograma (y polígono) ----------------------------------- */
  function histogram(g, polygon, opts) {
    opts = opts || {};
    var W = 560, H = 300, ml = 48, mb = 48, mt = 32;
    var dens = g.bins.map(function (b) { return b.f / (b.hi - b.lo); });
    var maxD = Math.max.apply(null, dens) || 1;
    var xmin = g.bins[0].lo, xmax = g.bins[g.bins.length - 1].hi;
    var iw = W - ml - 18, ih = H - mb - mt;
    var sc = function (x) { return ml + (x - xmin) / (xmax - xmin) * iw; };
    var body = head(W, opts.title || (polygon ? 'Histograma y polígono de frecuencias' : 'Histograma'));
    ticks(0, maxD, 4).forEach(function (t) {
      var y = H - mb - t / maxD * ih;
      body += '<line x1="' + ml + '" y1="' + y + '" x2="' + (W - 14) + '" y2="' + y +
        '" stroke="#eceff1"/>' + txt(ml - 6, y + 4, nc(t, 2), { size: 10, anchor: 'end', fill: '#546e7a' });
    });
    body += '<line x1="' + ml + '" y1="' + mt + '" x2="' + ml + '" y2="' + (H - mb) +
      '" stroke="' + COL.eje + '"/><line x1="' + ml + '" y1="' + (H - mb) + '" x2="' + (W - 14) +
      '" y2="' + (H - mb) + '" stroke="' + COL.eje + '"/>';
    var pts = [];
    g.bins.forEach(function (b, i) {
      var x = sc(b.lo), w = sc(b.hi) - sc(b.lo), ht = dens[i] / maxD * ih;
      body += '<rect x="' + x + '" y="' + (H - mb - ht) + '" width="' + w + '" height="' + ht +
        '" fill="' + COL.dato + '" opacity=".7" stroke="#fff"/>';
      if (b.f > 0) body += txt(x + w / 2, H - mb - ht - 5, String(b.f), { size: 10, weight: '600', fill: '#37474f' });
      pts.push((x + w / 2) + ',' + (H - mb - ht));
    });
    /* una sola escala de eje: los límites de clase */
    g.bins.forEach(function (b, i) {
      var x = sc(b.lo);
      body += '<line x1="' + x + '" y1="' + (H - mb) + '" x2="' + x + '" y2="' + (H - mb + 5) +
        '" stroke="' + COL.eje + '"/>';
      if (i % (g.bins.length > 7 ? 2 : 1) === 0) {
        body += txt(x, H - mb + 17, nc(b.lo, 1), { size: 9.5, fill: '#546e7a' });
      }
    });
    body += '<line x1="' + sc(xmax) + '" y1="' + (H - mb) + '" x2="' + sc(xmax) + '" y2="' +
      (H - mb + 5) + '" stroke="' + COL.eje + '"/>' +
      txt(sc(xmax), H - mb + 17, nc(xmax, 1), { size: 9.5, fill: '#546e7a' });
    if (polygon) {
      body += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + COL.mediana +
        '" stroke-width="2.4"/>';
      pts.forEach(function (p) {
        var c = p.split(',');
        body += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="3.2" fill="' + COL.mediana + '"/>';
      });
    }
    body += txt(ml + iw / 2, H - 8, 'límites de clase', { size: 10.5, fill: '#546e7a' });
    body += txt(15, mt + ih / 2, 'densidad de frecuencia', { size: 10.5, fill: '#546e7a' })
      .replace('<text', '<text transform="rotate(-90 15 ' + (mt + ih / 2) + ')"');
    return fig(body, W, H, opts.title || 'Histograma', opts.caption) +
      legend([{ kind: 'bar', color: COL.dato, text: 'densidad de cada clase' }].concat(
        polygon ? [{ kind: 'dot', color: COL.mediana, text: 'polígono sobre las marcas de clase' }] : []));
  }

  /* ---- diagrama de sectores -------------------------------------- */
  function pie(cats, vals, opts) {
    opts = opts || {};
    var total = vals.reduce(function (s, x) { return s + x; }, 0) || 1;
    var colors = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'];
    var W = 520, H = 300, cx = 165, cy = 165, r = 108, ang = -Math.PI / 2;
    var body = head(W, opts.title || 'Diagrama de sectores');
    cats.forEach(function (cat, i) {
      var da = 2 * Math.PI * vals[i] / total, a2 = ang + da, large = da > Math.PI ? 1 : 0;
      var col = colors[i % colors.length];
      if (da > 0) {
        if (da >= 2 * Math.PI - 1e-9) {
          body += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + col + '"/>';
        } else {
          body += '<path d="M ' + cx + ' ' + cy + ' L ' + (cx + r * Math.cos(ang)) + ' ' +
            (cy + r * Math.sin(ang)) + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' +
            (cx + r * Math.cos(a2)) + ' ' + (cy + r * Math.sin(a2)) + ' Z" fill="' + col +
            '" stroke="#fff" stroke-width="1.2"/>';
        }
        var pc = 100 * vals[i] / total;
        if (pc >= 6) {
          var am = ang + da / 2;
          body += txt(cx + 0.62 * r * Math.cos(am), cy + 0.62 * r * Math.sin(am) + 4,
            nc(pc, 1) + ' %', { size: 11, weight: '700', fill: '#fff' });
        }
      }
      body += '<rect x="330" y="' + (44 + i * 21) + '" width="13" height="13" fill="' + col + '"/>' +
        txt(350, 55 + i * 21, esc(String(cat)) + ' · ' + nc(100 * vals[i] / total, 1) + ' %',
          { size: 10.5, anchor: 'start' });
      ang = a2;
    });
    return fig(body, W, H, opts.title || 'Diagrama de sectores', opts.caption);
  }

  /* ---- diagrama de caja con nube de puntos ----------------------- */
  function boxSvg(c, opts) {
    opts = opts || {};
    var W = 560, H = opts.dots ? 240 : 175, ml = 34, mr = 30;
    var yBox = 62, axisY = H - 40;
    var f1 = c.q1 - 1.5 * c.ric, f2 = c.q3 + 1.5 * c.ric;
    var raw = [];
    Object.keys(c.f).forEach(function (x) { for (var i = 0; i < c.f[x]; i++) raw.push(+x); });
    var inside = raw.filter(function (x) { return x >= f1 && x <= f2; });
    var lo = Math.min.apply(null, inside), hi = Math.max.apply(null, inside);
    var d0 = Math.min(c.min, lo), d1 = Math.max(c.max, hi);
    var span = (d1 - d0) || 1;
    d0 -= span * 0.06; d1 += span * 0.06;
    var sc = function (x) { return ml + (x - d0) / (d1 - d0) * (W - ml - mr); };
    var body = head(W, opts.title || 'Diagrama de caja y bigotes');

    body += '<line x1="' + sc(lo) + '" y1="' + yBox + '" x2="' + sc(hi) + '" y2="' + yBox +
      '" stroke="' + COL.eje + '" stroke-width="1.6"/>' +
      '<line x1="' + sc(lo) + '" y1="' + (yBox - 14) + '" x2="' + sc(lo) + '" y2="' + (yBox + 14) +
      '" stroke="' + COL.eje + '" stroke-width="1.6"/>' +
      '<line x1="' + sc(hi) + '" y1="' + (yBox - 14) + '" x2="' + sc(hi) + '" y2="' + (yBox + 14) +
      '" stroke="' + COL.eje + '" stroke-width="1.6"/>' +
      '<rect x="' + sc(c.q1) + '" y="' + (yBox - 22) + '" width="' + Math.max(1, sc(c.q3) - sc(c.q1)) +
      '" height="44" fill="' + COL.banda + '" opacity=".45" stroke="#00695c"/>' +
      '<line x1="' + sc(c.med) + '" y1="' + (yBox - 22) + '" x2="' + sc(c.med) + '" y2="' + (yBox + 22) +
      '" stroke="' + COL.mediana + '" stroke-width="3"/>';
    /* media como triángulo naranja */
    body += glyph('tri', sc(c.m), yBox, COL.media);
    /* atípicos */
    raw.filter(function (x) { return x < f1 || x > f2; }).forEach(function (x) {
      body += '<circle cx="' + sc(x) + '" cy="' + yBox + '" r="4.5" fill="#fff" stroke="' +
        COL.mediana + '" stroke-width="2"/>';
    });
    /* etiquetas de los cinco números, en dos niveles alternos */
    var five = [
      { v: lo, t: 'mín' }, { v: c.q1, t: 'Q1' }, { v: c.med, t: 'Me' },
      { v: c.q3, t: 'Q3' }, { v: hi, t: 'máx' }
    ];
    var last = -1e9, lvl = 0;
    five.forEach(function (p) {
      var x = sc(p.v);
      if (x - last < 62) lvl = 1 - lvl; else lvl = 0;
      last = x;
      var y = 104 + lvl * 15;
      var anchor = x < 40 ? 'start' : x > W - 40 ? 'end' : 'middle';
      body += txt(x, y, p.t + ' = ' + nc(p.v, 2), { size: 10, weight: '600', anchor: anchor, fill: '#37474f' });
    });
    /* nube de puntos alineada bajo la caja */
    if (opts.dots) {
      var cnt = {};
      body += '<line x1="' + ml + '" y1="' + axisY + '" x2="' + (W - mr / 2) + '" y2="' + axisY +
        '" stroke="' + COL.eje + '"/>';
      ticks(d0, d1, 7).forEach(function (t) {
        var x = sc(t);
        body += '<line x1="' + x + '" y1="' + axisY + '" x2="' + x + '" y2="' + (axisY + 5) +
          '" stroke="' + COL.eje + '"/>' + txt(x, axisY + 17, nc(t, 2), { size: 10, fill: '#546e7a' });
      });
      raw.forEach(function (x) {
        cnt[x] = (cnt[x] || 0) + 1;
        var k = Math.min(cnt[x] - 1, 5);
        body += '<circle cx="' + sc(x) + '" cy="' + (axisY - 8 - k * 8) + '" r="3.4" fill="' +
          COL.dato + '" opacity=".8"/>';
      });
    }
    return fig(body, W, H, 'Diagrama de caja y bigotes', opts.caption) +
      legend([
        { kind: 'band', color: '#00695c', text: 'caja: 50 % central (RIC)' },
        { kind: 'sq', color: COL.mediana, text: 'mediana' },
        { kind: 'tri', color: COL.media, text: 'media' },
        { kind: 'dot', color: COL.dato, text: 'datos individuales' }
      ]);
  }

  /* ---- curva acumulada (ojiva) ----------------------------------- */
  /* pts: [{x, F}] con F en porcentaje. mark opcional {x, pct, label} */
  function ogive(pts, opts) {
    opts = opts || {};
    var W = 560, H = 300, ml = 48, mb = 46, mt = 32;
    var xs = pts.map(function (p) { return p.x; });
    var d0 = Math.min.apply(null, xs), d1 = Math.max.apply(null, xs);
    if (opts.mark) { d0 = Math.min(d0, opts.mark.x); d1 = Math.max(d1, opts.mark.x); }
    var span = (d1 - d0) || 1;
    var iw = W - ml - 18, ih = H - mb - mt;
    var sx = function (x) { return ml + (x - d0) / span * iw; };
    var sy = function (p) { return H - mb - p / 100 * ih; };
    var body = head(W, opts.title || 'Curva de frecuencias acumuladas');
    [0, 25, 50, 75, 100].forEach(function (p) {
      body += '<line x1="' + ml + '" y1="' + sy(p) + '" x2="' + (W - 14) + '" y2="' + sy(p) +
        '" stroke="#eceff1"/>' + txt(ml - 6, sy(p) + 4, p + ' %', { size: 10, anchor: 'end', fill: '#546e7a' });
    });
    body += '<line x1="' + ml + '" y1="' + mt + '" x2="' + ml + '" y2="' + (H - mb) + '" stroke="' +
      COL.eje + '"/><line x1="' + ml + '" y1="' + (H - mb) + '" x2="' + (W - 14) + '" y2="' +
      (H - mb) + '" stroke="' + COL.eje + '"/>';
    ticks(d0, d1, 6).forEach(function (t) {
      body += '<line x1="' + sx(t) + '" y1="' + (H - mb) + '" x2="' + sx(t) + '" y2="' + (H - mb + 5) +
        '" stroke="' + COL.eje + '"/>' + txt(sx(t), H - mb + 17, nc(t, 2), { size: 10, fill: '#546e7a' });
    });
    body += '<polyline points="' + pts.map(function (p) { return sx(p.x) + ',' + sy(p.F); }).join(' ') +
      '" fill="none" stroke="' + COL.dato + '" stroke-width="2.4"/>';
    pts.forEach(function (p) {
      body += '<circle cx="' + sx(p.x) + '" cy="' + sy(p.F) + '" r="3.4" fill="' + COL.dato + '"/>';
    });
    if (opts.mark) {
      var mx = sx(opts.mark.x), my = sy(opts.mark.pct);
      body += '<line x1="' + ml + '" y1="' + my + '" x2="' + mx + '" y2="' + my + '" stroke="' +
        COL.media + '" stroke-width="1.8" stroke-dasharray="5 3"/>' +
        '<line x1="' + mx + '" y1="' + my + '" x2="' + mx + '" y2="' + (H - mb) + '" stroke="' +
        COL.media + '" stroke-width="1.8" stroke-dasharray="5 3"/>' +
        glyph('dia', mx, my, COL.media) +
        txt(Math.min(mx, W - 60), my - 12, esc(opts.mark.label), { size: 10.5, weight: '700', fill: COL.media });
    }
    body += txt(ml + iw / 2, H - 8, esc(opts.xlab || 'valor de la variable'), { size: 10.5, fill: '#546e7a' });
    body += txt(15, mt + ih / 2, 'frecuencia acumulada', { size: 10.5, fill: '#546e7a' })
      .replace('<text', '<text transform="rotate(-90 15 ' + (mt + ih / 2) + ')"');
    return fig(body, W, H, 'Curva de frecuencias acumuladas', opts.caption);
  }

  /* ---- doble escala: valores y puntuaciones z -------------------- */
  function zScale(c, x) {
    var W = 560, H = 210, ml = 34, mr = 30, yTop = 78, yBot = 138;
    var lo = Math.min(c.min, c.m - 3 * c.sd, x), hi = Math.max(c.max, c.m + 3 * c.sd, x);
    var span = (hi - lo) || 1;
    var d0 = lo - span * 0.05, d1 = hi + span * 0.05;
    var sc = function (v) { return ml + (v - d0) / (d1 - d0) * (W - ml - mr); };
    var body = head(W, 'Escala original y escala tipificada');
    /* bandas de una, dos y tres desviaciones típicas */
    [3, 2, 1].forEach(function (j, idx) {
      var op = [0.1, 0.16, 0.24][idx];
      body += '<rect x="' + sc(c.m - j * c.sd) + '" y="42" width="' +
        Math.max(1, sc(c.m + j * c.sd) - sc(c.m - j * c.sd)) + '" height="' + (yBot - 42) +
        '" fill="' + COL.banda + '" opacity="' + op + '"/>';
    });
    /* eje superior: valores */
    body += '<line x1="' + ml + '" y1="' + yTop + '" x2="' + (W - mr / 2) + '" y2="' + yTop +
      '" stroke="' + COL.eje + '" stroke-width="1.4"/>';
    ticks(d0, d1, 6).forEach(function (t) {
      body += '<line x1="' + sc(t) + '" y1="' + yTop + '" x2="' + sc(t) + '" y2="' + (yTop - 5) +
        '" stroke="' + COL.eje + '"/>' + txt(sc(t), yTop - 10, nc(t, 2), { size: 10, fill: '#546e7a' });
    });
    body += txt(ml, 38, 'escala original x', { size: 10.5, anchor: 'start', weight: '600', fill: '#37474f' });
    /* eje inferior: z */
    body += '<line x1="' + ml + '" y1="' + yBot + '" x2="' + (W - mr / 2) + '" y2="' + yBot +
      '" stroke="' + COL.eje + '" stroke-width="1.4"/>';
    [-3, -2, -1, 0, 1, 2, 3].forEach(function (z) {
      var v = c.m + z * c.sd;
      if (v < d0 || v > d1) return;
      body += '<line x1="' + sc(v) + '" y1="' + yBot + '" x2="' + sc(v) + '" y2="' + (yBot + 5) +
        '" stroke="' + COL.eje + '"/>' +
        txt(sc(v), yBot + 18, 'z = ' + nc(z, 0), { size: 10, fill: '#546e7a' });
    });
    /* media y valor tipificado */
    body += '<line x1="' + sc(c.m) + '" y1="42" x2="' + sc(c.m) + '" y2="' + yBot +
      '" stroke="' + COL.media + '" stroke-width="1.6" stroke-dasharray="5 3"/>' +
      meanLabel(Math.min(sc(c.m) + 4, W - 70), 34, nc(c.m, 2), COL.media);
    body += '<line x1="' + sc(x) + '" y1="' + (yTop - 20) + '" x2="' + sc(x) + '" y2="' + (yBot + 6) +
      '" stroke="' + COL.moda + '" stroke-width="2"/>' + glyph('dia', sc(x), yTop, COL.moda) +
      txt(Math.max(60, Math.min(sc(x), W - 60)), 176,
        'valor x = ' + nc(x, 2) + '   →   z = ' + nc((x - c.m) / c.sd, 2),
        { size: 11, weight: '700', fill: COL.moda });
    return fig(body, W, H, 'Escala original y escala tipificada') +
      legend([
        { kind: 'band', color: COL.banda, text: 'franjas de una, dos y tres desviaciones típicas' },
        { kind: 'dia', color: COL.moda, text: 'valor tipificado' },
        { kind: 'bar', color: COL.media, text: 'media ' + K('\\bar x = ' + kf(c.m, 3)) }
      ]);
  }

  /* ---- desviaciones respecto de la media ------------------------- */
  function deviationPlot(a, c) {
    var W = 560, H = 280, ml = 40, mr = 24, mt = 34, mb = 46;
    var lo = Math.min(c.min, c.m - c.sd), hi = Math.max(c.max, c.m + c.sd);
    var span = (hi - lo) || 1;
    var d0 = lo - span * 0.06, d1 = hi + span * 0.06;
    var sc = function (v) { return ml + (v - d0) / (d1 - d0) * (W - ml - mr); };
    var rows = a.length, ih = H - mt - mb;
    var step = Math.max(4, Math.min(16, ih / rows));
    var body = head(W, 'Desviaciones de cada dato respecto de la media');
    body += '<rect x="' + sc(c.m - c.sd) + '" y="' + mt + '" width="' +
      Math.max(1, sc(c.m + c.sd) - sc(c.m - c.sd)) + '" height="' + ih +
      '" fill="' + COL.banda + '" opacity=".18"/>';
    body += '<line x1="' + sc(c.m) + '" y1="' + (mt - 4) + '" x2="' + sc(c.m) + '" y2="' +
      (mt + ih + 4) + '" stroke="' + COL.media + '" stroke-width="2"/>';
    a.forEach(function (x, i) {
      var y = mt + (i + 0.5) * step;
      body += '<line x1="' + sc(c.m) + '" y1="' + y + '" x2="' + sc(x) + '" y2="' + y +
        '" stroke="' + (x < c.m ? '#7b1fa2' : '#00695c') + '" stroke-width="1.6" opacity=".75"/>' +
        '<circle cx="' + sc(x) + '" cy="' + y + '" r="' + Math.min(3.6, step * 0.32) + '" fill="' +
        COL.dato + '"/>';
    });
    var axisY = H - mb + 12;
    body += '<line x1="' + ml + '" y1="' + axisY + '" x2="' + (W - mr / 2) + '" y2="' + axisY +
      '" stroke="' + COL.eje + '"/>';
    ticks(d0, d1, 6).forEach(function (t) {
      body += '<line x1="' + sc(t) + '" y1="' + axisY + '" x2="' + sc(t) + '" y2="' + (axisY + 5) +
        '" stroke="' + COL.eje + '"/>' + txt(sc(t), axisY + 17, nc(t, 2), { size: 10, fill: '#546e7a' });
    });
    return fig(body, W, H, 'Desviaciones respecto de la media') +
      legend([
        { kind: 'dot', color: COL.dato, text: 'cada dato' },
        { kind: 'tri', color: COL.media, text: 'media ' + K('\\bar x = ' + kf(c.m, 3)) },
        { kind: 'bar', color: '#7b1fa2', text: 'desviación negativa' },
        { kind: 'bar', color: '#00695c', text: 'desviación positiva' },
        { kind: 'band', color: COL.banda, text: 'franja de una desviación típica' }
      ]);
  }

  /* ---- barras comparativas horizontales -------------------------- */
  function compareBars(items, opts) {
    opts = opts || {};
    var W = 440, H = 38 + items.length * 30, ml = 152, mr = 62;
    var max = Math.max.apply(null, items.map(function (i) { return Math.abs(i.value); }));
    if (!(max > 0)) max = 1;
    var body = head(W, opts.title || 'Comparación');
    items.forEach(function (it, i) {
      var y = 32 + i * 30;
      var w = Math.abs(it.value) / max * (W - ml - mr);
      body += txt(ml - 8, y + 13, esc(it.label), { size: 10.5, anchor: 'end', weight: '600' }) +
        '<rect x="' + ml + '" y="' + y + '" width="' + Math.max(2, w) + '" height="17" fill="' +
        (it.color || COL.dato) + '" opacity=".82" rx="2"/>' +
        txt(ml + Math.max(2, w) + 6, y + 13, nc(it.value, 2) + (opts.unit || ''),
          { size: 10.5, anchor: 'start', fill: '#37474f', weight: '600' });
    });
    return fig(body, W, H, opts.title || 'Comparación', opts.caption);
  }

  /* ---------------------------------------------------------------
     4 · agrupación de datos
     --------------------------------------------------------------- */

  function grouped(a, classes) {
    var min = Math.min.apply(null, a), max = Math.max.apply(null, a);
    if (max === min) {
      return { min: min, max: max, width: 1, bins: [{ lo: min - 0.5, hi: min + 0.5, mark: min, f: a.length }] };
    }
    var width = (max - min) / classes, bins = [];
    for (var i = 0; i < classes; i++) {
      bins.push({ lo: min + i * width, hi: min + (i + 1) * width, mark: min + (i + 0.5) * width, f: 0 });
    }
    a.forEach(function (x) {
      var j = Math.min(classes - 1, Math.floor((x - min) / width));
      bins[j].f++;
    });
    return { min: min, max: max, width: width, bins: bins };
  }

  function groupedTable(g, hl) {
    if (hl == null) hl = -1;
    var N = g.bins.reduce(function (s, b) { return s + b.f; }, 0), ac = 0;
    var h = '<table class="ap-tbl"><thead><tr><th>Clase</th><th>Marca ' + SUB('x') +
      '</th><th>' + SUB('f') + '</th><th>' + SUB('h') + '</th><th>' + SUB('F') + '</th></tr></thead><tbody>';
    g.bins.forEach(function (b, i) {
      ac += b.f;
      h += '<tr' + (i === hl ? ' class="ap-hl"' : '') + '><td>[' + nc(b.lo, 2) + ', ' + nc(b.hi, 2) + (i === g.bins.length - 1 ? ']' : ')') +
        '</td><td>' + nc(b.mark, 2) + '</td><td>' + b.f + '</td><td>' + nc(b.f / N, 3) +
        '</td><td>' + ac + '</td></tr>';
    });
    return h + '</tbody></table>';
  }

  function parseGrouped(s) {
    var rows = String(s).trim().split(/\n+/).map(function (r) { return r.trim(); }).filter(Boolean);
    var bins = [];
    rows.forEach(function (r, i) {
      var p = r.split(/[\s,;:]+/).filter(Boolean).map(Number);
      if (p.length !== 3 || p.some(function (x) { return !Number.isFinite(x); })) {
        throw Error('Cada línea debe contener límite inferior, límite superior y frecuencia. Ejemplo: 0 10 40. Error en la línea ' + (i + 1) + '.');
      }
      if (p[1] <= p[0] || p[2] < 0) throw Error('Intervalo o frecuencia no válido en la línea ' + (i + 1) + '.');
      bins.push({ lo: p[0], hi: p[1], mark: (p[0] + p[1]) / 2, f: p[2] });
    });
    if (!bins.length) throw Error('Escribe al menos una clase.');
    return { bins: bins, width: null };
  }

  function quantileGrouped(g, pct) {
    var N = g.bins.reduce(function (s, b) { return s + b.f; }, 0), pos = pct * N / 100, ac = 0;
    for (var i = 0; i < g.bins.length; i++) {
      var prev = ac; ac += g.bins[i].f;
      if (ac >= pos) {
        var b = g.bins[i];
        return { value: b.lo + ((pos - prev) / b.f) * (b.hi - b.lo), bin: b, prev: prev, pos: pos, N: N, index: i };
      }
    }
    return null;
  }

  /* ---------------------------------------------------------------
     5 · piezas reutilizables de salida
     --------------------------------------------------------------- */

  var DEMO = '2, 0, 3, 4, 0, 1, 2, 3, 0, 2, 4, 0';
  var PRESETS = [
    { label: 'Hermanos (discreta)', data: '2, 0, 3, 4, 0, 1, 2, 3, 0, 2, 4, 0, 1, 1, 2' },
    { label: 'Notas de clase', data: '3, 4, 4, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 8, 8, 9, 10, 2' },
    { label: 'Con valor extremo', data: '4, 5, 5, 6, 6, 6, 7, 7, 8, 42' },
    { label: 'Estaturas (continua)', data: '158, 161, 163, 165, 166, 168, 168, 170, 171, 173, 175, 176, 178, 181, 184' }
  ];

  function dataField(id, label, value, rows) {
    return {
      id: id || 'd', label: label || 'Datos', rows: rows || 3,
      value: value || DEMO, presets: PRESETS
    };
  }

  /* subíndice i en HTML: siempre legible, no depende de KaTeX */
  function SUB(letra) { return '<i>' + letra + '</i><sub>i</sub>'; }

  /* resumen numérico propio, con coma decimal y notación cuidada */
  function resumenTabla(c) {
    var cv = c.m ? nc(100 * c.sd / c.m, 2) + ' %' : 'no definido';
    return '<table class="ap-tbl"><tbody>' +
      '<tr><td>' + K('N') + '</td><td>' + c.n + '</td></tr>' +
      '<tr><td>media ' + K('\\bar x') + '</td><td>' + nc(c.m, 3) + '</td></tr>' +
      '<tr><td>mediana (Me)</td><td>' + nc(c.med, 3) + '</td></tr>' +
      '<tr><td>moda (Mo)</td><td>' +
        (c.mo.length ? c.mo.map(function (x) { return nc(x, 3); }).join('; ') : '—') + '</td></tr>' +
      '<tr><td>' + K('Q_1') + ' y ' + K('Q_3') + '</td><td>' + nc(c.q1, 3) + ' y ' + nc(c.q3, 3) + '</td></tr>' +
      '<tr><td>' + K('RIC = Q_3 - Q_1') + '</td><td>' + nc(c.ric, 3) + '</td></tr>' +
      '<tr><td>recorrido</td><td>' + nc(c.max - c.min, 3) + '</td></tr>' +
      '<tr><td>varianza ' + K('\\sigma^2') + '</td><td>' + nc(c.v, 3) + '</td></tr>' +
      '<tr><td>desviación típica ' + K('\\sigma') + '</td><td>' + nc(c.sd, 3) + '</td></tr>' +
      '<tr><td>' + K('CV = \\sigma / \\bar x') + '</td><td>' + cv + '</td></tr>' +
      '</tbody></table>';
  }

  /* tabla de frecuencias propia: notación con subíndices y coma decimal.
     idx: columna resaltada (0=fi, 1=hi, 2=Fi, 3=Hi); -1 para ninguna.   */
  function freqTable(c, idx) {
    if (idx == null) idx = -1;
    var xs = Object.keys(c.f).map(Number).sort(function (p, q) { return p - q; });
    var ac = 0, fi = [], hi = [], Fi = [], Hi = [];
    xs.forEach(function (x) {
      ac += c.f[x];
      fi.push(c.f[x]); hi.push(c.f[x] / c.n); Fi.push(ac); Hi.push(ac / c.n);
    });
    var hd = ['<th>' + SUB('x') + '</th>', '<th>' + SUB('f') + '</th>', '<th>' + SUB('h') +
      '</th>', '<th>' + SUB('F') + '</th>', '<th>' + SUB('H') + '</th>'];
    if (idx >= 0) hd[idx + 1] = hd[idx + 1].replace('<th>', '<th class="ap-hl">');
    var h = '<table class="ap-tbl"><thead><tr>' + hd.join('') + '</tr></thead><tbody>';
    xs.forEach(function (x, i) {
      var cells = [nc(x, 3), String(fi[i]), nc(hi[i], 3), String(Fi[i]), nc(Hi[i], 3)];
      h += '<tr>' + cells.map(function (t, j) {
        return '<td' + (j === idx + 1 ? ' class="ap-hl"' : '') + '>' + t + '</td>';
      }).join('') + '</tr>';
    });
    h += '<tr><td><b>Σ</b></td><td><b>' + c.n + '</b></td><td><b>1</b></td><td>—</td><td>—</td></tr>';
    return h + '</tbody></table>';
  }

  function freqParts(c) {
    var xs = Object.keys(c.f).map(Number).sort(function (p, q) { return p - q; });
    var ac = 0, fi = [], hi = [], Fi = [], Hi = [];
    xs.forEach(function (x) {
      ac += c.f[x];
      fi.push(c.f[x]); hi.push(c.f[x] / c.n); Fi.push(ac); Hi.push(ac / c.n);
    });
    return { xs: xs, fi: fi, hi: hi, Fi: Fi, Hi: Hi };
  }

  function marksFor(c) {
    var m = [
      {
        value: c.m, kind: 'tri', color: COL.media, mean: true,
        legend: 'media ' + K('\\bar x = ' + kf(c.m, 2))
      },
      {
        value: c.med, kind: 'sq', color: COL.mediana,
        legend: 'mediana Me = ' + nc(c.med, 2)
      }
    ];
    if (c.mo.length <= 2) {
      c.mo.forEach(function (mo) {
        m.push({
          value: mo, kind: 'dia', color: COL.moda,
          legend: 'moda Mo = ' + nc(mo, 2)
        });
      });
    }
    return m;
  }

  function split(left, right) {
    return '<div class="ap-split"><div class="ap-pane">' + left + '</div><div class="ap-pane">' +
      right + '</div></div>';
  }

  function ogivePoints(c) {
    var xs = Object.keys(c.f).map(Number).sort(function (a, b) { return a - b; });
    var ac = 0;
    var pts = [{ x: xs[0], F: 0 }];
    xs.forEach(function (x) { ac += c.f[x]; pts.push({ x: x, F: 100 * ac / c.n }); });
    return pts;
  }

  /* ---------------------------------------------------------------
     6 · applets
     --------------------------------------------------------------- */

  /* 6.1 clasificador de variables ---------------------------------- */
  var EJEMPLOS = [
    { t: 'Número de hermanos', k: 'discreta' },
    { t: 'Estatura en centímetros con decimales', k: 'continua' },
    { t: 'Edad en años cumplidos', k: 'discreta' },
    { t: 'Tiempo en segundos de una carrera', k: 'continua' },
    { t: 'Color de ojos', k: 'nominal' },
    { t: 'Comunidad autónoma de nacimiento', k: 'nominal' },
    { t: 'Satisfacción: baja, media, alta', k: 'ordinal' },
    { t: 'Nivel de idioma: A1, A2, B1, B2, C1', k: 'ordinal' },
    { t: 'Número de mensajes recibidos en un día', k: 'discreta' },
    { t: 'Peso de una mochila en kilogramos', k: 'continua' }
  ];
  var TIPOS = {
    nominal: {
      nombre: 'cualitativa nominal',
      porque: 'Las categorías nombran cualidades y no admiten un orden natural.',
      graficos: 'sectores o barras de categorías',
      medidas: 'solo la moda'
    },
    ordinal: {
      nombre: 'cualitativa ordinal',
      porque: 'Las categorías se pueden ordenar, pero las distancias entre ellas no son medibles.',
      graficos: 'barras ordenadas',
      medidas: 'moda y mediana'
    },
    discreta: {
      nombre: 'cuantitativa discreta',
      porque: 'Procede de contar: entre dos valores consecutivos no hay valores intermedios posibles.',
      graficos: 'diagrama de barras',
      medidas: 'todas: media, mediana, moda y dispersión'
    },
    continua: {
      nombre: 'cuantitativa continua',
      porque: 'Procede de medir: entre dos medidas siempre puede haber valores intermedios.',
      graficos: 'histograma y polígono de frecuencias',
      medidas: 'todas, normalmente con datos agrupados en intervalos'
    }
  };

  function tipoDiagram(activa) {
    var W = 560, H = 250;
    var celdas = [
      { k: 'nominal', x: 40, y: 128, w: 220, h: 46, t: 'Nominal', s: 'color de ojos' },
      { k: 'ordinal', x: 40, y: 184, w: 220, h: 46, t: 'Ordinal', s: 'baja · media · alta' },
      { k: 'discreta', x: 300, y: 128, w: 220, h: 46, t: 'Discreta', s: 'se cuenta' },
      { k: 'continua', x: 300, y: 184, w: 220, h: 46, t: 'Continua', s: 'se mide' }
    ];
    var body = head(W, 'Clasificación de la variable');
    var cuali = activa === 'nominal' || activa === 'ordinal';
    var cuanti = activa === 'discreta' || activa === 'continua';
    /* raíz y ramas: se resalta el camino completo hasta el tipo elegido */
    body += '<rect x="230" y="30" width="100" height="24" rx="4" fill="#eceff1" stroke="#90a4ae"/>' +
      txt(280, 46, 'variable', { size: 10.5, weight: '700', fill: '#37474f' }) +
      '<path d="M280 54 V62 H150 V72" fill="none" stroke="' + (cuali ? '#2e7d32' : '#b0bec5') +
      '" stroke-width="' + (cuali ? 2 : 1) + '"/>' +
      '<path d="M280 54 V62 H410 V72" fill="none" stroke="' + (cuanti ? '#2e7d32' : '#b0bec5') +
      '" stroke-width="' + (cuanti ? 2 : 1) + '"/>' +
      '<path d="M150 106 V118" fill="none" stroke="#b0bec5"/>' +
      '<path d="M410 106 V118" fill="none" stroke="#b0bec5"/>';
    body += '<rect x="40" y="72" width="220" height="34" rx="4" fill="' +
      (cuali ? '#e8f5e9' : '#eceff1') + '" stroke="' + (cuali ? '#2e7d32' : '#90a4ae') +
      '" stroke-width="' + (cuali ? 2 : 1) + '"/>' +
      txt(150, 94, 'Cualitativa', { size: 11.5, weight: '700', fill: cuali ? '#1b5e20' : '#37474f' }) +
      '<rect x="300" y="72" width="220" height="34" rx="4" fill="' +
      (cuanti ? '#e8f5e9' : '#eceff1') + '" stroke="' + (cuanti ? '#2e7d32' : '#90a4ae') +
      '" stroke-width="' + (cuanti ? 2 : 1) + '"/>' +
      txt(410, 94, 'Cuantitativa', { size: 11.5, weight: '700', fill: cuanti ? '#1b5e20' : '#37474f' });
    celdas.forEach(function (c) {
      var on = c.k === activa;
      body += '<rect x="' + c.x + '" y="' + c.y + '" width="' + c.w + '" height="' + c.h +
        '" rx="4" fill="' + (on ? '#dcefe0' : '#fafafa') + '" stroke="' + (on ? '#2e7d32' : '#cfd8dc') +
        '" stroke-width="' + (on ? 2.4 : 1) + '"/>' +
        txt(c.x + c.w / 2, c.y + 20, c.t + (on ? '  ✓' : ''), {
          size: 11.5, weight: on ? '700' : '600', fill: on ? '#1b5e20' : '#546e7a'
        }) +
        txt(c.x + c.w / 2, c.y + 36, c.s, { size: 9.5, fill: on ? '#2e7d32' : '#90a4ae' });
    });
    return fig(body, W, H, 'Esquema de clasificación de variables');
  }

  R.clasificador = function (node) {
    shell(node, 'Clasificador de variables',
      'Elige una descripción, decide primero tú el tipo y después compáralo con el esquema. Fíjate en la palabra clave: <b>contar</b> lleva a discreta y <b>medir</b> lleva a continua.',
      [{ id: 'e', label: 'Variable', type: 'select', options: EJEMPLOS.map(function (x) { return x.t; }) }],
      function (v) {
        var e = EJEMPLOS.filter(function (x) { return x.t === v.e; })[0];
        var t = TIPOS[e.k];
        return tipoDiagram(e.k) +
          ok('<b>' + t.nombre + '</b>. ' + t.porque) +
          '<table class="ap-tbl"><tbody>' +
          '<tr><td>Gráfico adecuado</td><td>' + t.graficos + '</td></tr>' +
          '<tr><td>Medidas que tienen sentido</td><td>' + t.medidas + '</td></tr>' +
          '</tbody></table>' +
          info('La clasificación depende de cómo se registra el dato, no del concepto. La edad es continua si se mide con decimales y discreta si se anota en años cumplidos.');
      });
  };

  /* 6.2 tabla de frecuencias --------------------------------------- */
  R.tabla = function (node) {
    shell(node, 'Tabla de frecuencias',
      'Escribe valores individuales. Elige qué columna quieres representar y observa la diferencia entre frecuencias simples y acumuladas.',
      [dataField('d', 'Datos', '2, 0, 3, 4, 0, 1, 2, 3, 0, 2, 4, 0, 1, 2, 2, 3', 3),
       { id: 'col', label: 'Columna representada', type: 'select', options: ['fᵢ absoluta', 'hᵢ relativa', 'Fᵢ acumulada', 'Hᵢ acumulada relativa'] }],
      function (v) {
        var a = S.datos(v.d), c = S.calc(a);
        var P = freqParts(c), xs = P.xs;
        var idx = ['fᵢ absoluta', 'hᵢ relativa', 'Fᵢ acumulada', 'Hᵢ acumulada relativa'].indexOf(v.col);
        var series = [P.fi, P.hi, P.Fi, P.Hi][idx];
        var acum = idx >= 2;
        var Hi = P.Hi;
        var h = freqTable(c, idx);

        var graf = acum
          ? ogive(xs.map(function (x, i) { return { x: x, F: 100 * Hi[i] }; }),
              { title: 'Frecuencias acumuladas', xlab: 'valores ' + 'xi' })
          : barChart(xs, series, {
              title: v.col, ylab: idx === 0 ? 'frecuencia absoluta' : 'frecuencia relativa',
              xlab: 'valores de la variable'
            });

        return graf + h +
          ok('Comprobación: ' + K('\\sum f_i = ' + c.n) + ' y ' + K('\\sum h_i = 1') + '.') +
          info(acum
            ? 'La curva acumulada nunca baja: cada punto indica cuántos datos son menores o iguales que ese valor. Sirve para leer cuantiles directamente.'
            : 'Las frecuencias relativas tienen la misma forma que las absolutas: solo cambia la escala del eje vertical.');
      });
  };

  /* 6.3 agrupar en intervalos -------------------------------------- */
  R.agrupador = function (node) {
    shell(node, 'Agrupar datos en intervalos',
      'Elige el número de clases y observa cómo cambia la forma de la distribución. Con muchas clases se ve el detalle; con pocas, la tendencia.',
      [dataField('d', 'Datos', '23,14,6,7,25,6,17,34,26,18,39,11,31,6,2,19,33,5,6,22,18,8,31,28,3,26,12,8,15,7', 4),
       { id: 'k', label: 'Número de clases', type: 'range', min: 2, max: 12, value: 6 },
       { id: 'pol', label: 'Añadir polígono', type: 'check', value: true }],
      function (v) {
        var a = S.datos(v.d), g = grouped(a, +v.k);
        return histogram(g, !!v.pol) + groupedTable(g) +
          info('Amplitud de clase: ' + K(kf(g.width, 3)) + '. Al agrupar, cada dato se sustituye por su marca de clase ' +
            K('x_i') + ', así que el resumen resulta aproximado.') +
          warn('No existe un único agrupamiento correcto. Prueba 2 clases y luego 12: con muy pocas se esconde la forma y con demasiadas ya no se resume nada.');
      });
  };

  /* 6.4 media, moda y mediana -------------------------------------- */
  R.centralizacion = function (node) {
    shell(node, 'Media, moda y mediana',
      'Cada punto azul es un dato. Activa el dato extra y muévelo: comprobarás que la media lo persigue y la mediana apenas se mueve.',
      [dataField('d', 'Datos', '4, 5, 5, 6, 6, 6, 7, 7, 8, 9', 3),
       { id: 'on', label: 'Añadir un dato extra', type: 'check', value: false },
       { id: 'x', label: 'Valor del dato extra', type: 'range', min: 0, max: 60, value: 40,
         enabledWhen: function (v) { return !!v.on; },
         offNote: 'Activa primero la casilla del dato extra.' }],
      function (v) {
        var a = S.datos(v.d);
        var base = S.calc(a);
        var a2 = v.on ? S.datos(v.d + ',' + v.x) : a;
        var c = S.calc(a2);
        /* con la casilla desactivada la segunda columna queda vacía: así se
           distingue el estado inicial del contraste real */
        var vc = function (t) { return v.on ? t : '—'; };
        var tabla = '<table class="ap-tbl"><thead><tr><th>Medida</th><th>Sin dato extra</th><th>Con dato extra</th></tr></thead><tbody>' +
          '<tr><td>media ' + K('\\bar x') + '</td><td>' + nc(base.m, 3) + '</td><td>' + vc(nc(c.m, 3)) + '</td></tr>' +
          '<tr><td>mediana (Me)</td><td>' + nc(base.med, 3) + '</td><td>' + vc(nc(c.med, 3)) + '</td></tr>' +
          '<tr><td>moda (Mo)</td><td>' + base.mo.map(function (x) { return nc(x, 2); }).join('; ') +
          '</td><td>' + vc(c.mo.map(function (x) { return nc(x, 2); }).join('; ')) + '</td></tr>' +
          '<tr><td>' + K('\\sigma') + '</td><td>' + nc(base.sd, 3) + '</td><td>' + vc(nc(c.sd, 3)) + '</td></tr>' +
          '<tr><td>' + K('N') + '</td><td>' + base.n + '</td><td>' + vc(String(c.n)) + '</td></tr>' +
          '</tbody></table>';
        var dm = Math.abs(c.m - base.m), dme = Math.abs(c.med - base.med);
        return dotPlot(a2, {
          marks: marksFor(c),
          title: 'Distribución y medidas de centralización',
          caption: 'Las líneas discontinuas señalan cada medida sobre la recta numérica.'
        }) +
          split(tabla, compareBars([
            { label: 'Media', value: dm, color: COL.media },
            { label: 'Mediana', value: dme, color: COL.mediana }
          ], { title: 'Efecto del dato extra' })) +
          (v.on
            ? ok('Con el dato extra la media se ha movido ' + K(kf(dm, 3)) + ' unidades y la mediana solo ' + K(kf(dme, 3)) + '.')
            : info('Activa la casilla del dato extra para ver el contraste entre media y mediana.')) +
          info('La media usa todos los datos, por eso es sensible a los extremos. La mediana solo depende de la posición central, por eso es resistente.');
      });
  };

  /* 6.5 valores atípicos ------------------------------------------- */
  R.atipicos = function (node) {
    shell(node, 'Efecto de valores atípicos',
      'El deslizador desplaza el dato mayor del conjunto. Observa a la vez el diagrama de puntos, la caja y las medidas.',
      [dataField('d', 'Datos', '4, 5, 5, 6, 6, 6, 7, 7, 8, 9', 3),
       { id: 'des', label: 'Desplazamiento del dato mayor', type: 'range', min: 0, max: 60, value: 0 }],
      function (v) {
        var a = S.datos(v.d), base = S.calc(a), d = +v.des;
        var a2 = a.slice();
        a2[a2.length - 1] = a2[a2.length - 1] + d;
        a2.sort(function (p, q) { return p - q; });
        var c = S.calc(a2);
        var f1 = c.q1 - 1.5 * c.ric, f2 = c.q3 + 1.5 * c.ric;
        var atip = a2.filter(function (x) { return x < f1 || x > f2; });
        var tabla = '<table class="ap-tbl"><thead><tr><th>Medida</th><th>Original</th><th>Modificado</th><th>Variación</th></tr></thead><tbody>' +
          [['\\bar x', base.m, c.m], ['Me', base.med, c.med], ['\\sigma', base.sd, c.sd],
           ['RIC', base.ric, c.ric], ['\\text{recorrido}', base.max - base.min, c.max - c.min]]
            .map(function (r) {
              return '<tr><td>' + K(r[0]) + '</td><td>' + nc(r[1], 2) + '</td><td>' + nc(r[2], 2) +
                '</td><td>' + (r[2] - r[1] >= 0 ? '+' : '') + nc(r[2] - r[1], 2) + '</td></tr>';
            }).join('') + '</tbody></table>';
        return dotPlot(a2, {
          marks: marksFor(c),
          title: 'Datos con el mayor valor desplazado ' + nc(d, 0) + ' unidades'
        }) +
          split(tabla, compareBars([
            { label: 'Media', value: c.m - base.m, color: COL.media },
            { label: 'Mediana', value: c.med - base.med, color: COL.mediana },
            { label: 'σ', value: c.sd - base.sd, color: '#00695c' },
            { label: 'RIC', value: c.ric - base.ric, color: COL.banda }
          ], { title: 'Sensibilidad de cada medida' })) +
          boxSvg(c, { dots: true }) +
          (atip.length
            ? warn('Con este desplazamiento hay ' + atip.length + ' posible valor atípico: ' +
                atip.map(function (x) { return nc(x, 2); }).join(', ') + '. El criterio usado es ' +
                K('Q_1-1{,}5\\,RIC') + ' y ' + K('Q_3+1{,}5\\,RIC') + '.')
            : info('Todavía no hay valores atípicos según el criterio de 1,5·RIC. Sigue subiendo el deslizador.')) +
          info('Media, desviación típica y recorrido se disparan; mediana y RIC se mantienen. Por eso se llaman medidas robustas.');
      });
  };

  /* 6.6 cuantiles -------------------------------------------------- */
  R.cuantiles = function (node) {
    shell(node, 'Cuartiles, deciles y percentiles',
      'Mueve el percentil y sigue su posición en la recta numérica, en la curva acumulada y en el diagrama de caja.',
      [dataField('d', 'Datos', '3, 4, 4, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 8, 8, 9, 10, 2', 3),
       { id: 'p', label: 'Percentil Pk', type: 'range', min: 1, max: 99, value: 25 }],
      function (v) {
        var a = S.datos(v.d), c = S.calc(a), p = +v.p;
        var pos = (c.n - 1) * p / 100, i = Math.floor(pos);
        var val = a[i] + (pos - i) * (a[Math.min(i + 1, c.n - 1)] - a[i]);
        var dentro = a.filter(function (x) { return x <= val; }).length;
        var tabla = '<table class="ap-tbl"><tbody>' +
          '<tr><td>' + K('P_{' + p + '}') + '</td><td><b>' + nc(val, 3) + '</b></td></tr>' +
          '<tr><td>' + K('Q_1 = P_{25}') + '</td><td>' + nc(c.q1, 3) + '</td></tr>' +
          '<tr><td>' + K('Q_2 = Me = P_{50}') + '</td><td>' + nc(c.med, 3) + '</td></tr>' +
          '<tr><td>' + K('Q_3 = P_{75}') + '</td><td>' + nc(c.q3, 3) + '</td></tr>' +
          '<tr><td>' + K('RIC = Q_3 - Q_1') + '</td><td>' + nc(c.ric, 3) + '</td></tr>' +
          '<tr><td>Datos no superiores a ' + K('P_{' + p + '}') + '</td><td>' + dentro + ' de ' + c.n + '</td></tr>' +
          '</tbody></table>';
        return dotPlot(a, {
          marks: [{ value: val, kind: 'dia', color: COL.pk, legend: 'percentil elegido ' + K('P_{' + p + '} = ' + kf(val, 2)) }]
            .concat(marksFor(c)),
          bands: [{ from: c.q1, to: c.q3, color: COL.banda, text: 'RIC', legend: '50 % central (de Q1 a Q3)' }],
          title: 'Posición del percentil ' + p + ' sobre los datos'
        }) +
          ogive(ogivePoints(c), {
            mark: { x: val, pct: p, label: 'P' + p },
            title: 'Lectura gráfica del percentil'
          }) +
          split(tabla, compareBars([
            { label: 'P' + p, value: val, color: COL.pk },
            { label: 'Q₁', value: c.q1, color: COL.banda },
            { label: 'Me = Q₂', value: c.med, color: COL.mediana },
            { label: 'Q₃', value: c.q3, color: COL.banda },
            { label: 'RIC', value: c.ric, color: '#90a4ae' }
          ], { title: 'Valores de posición' })) +
          boxSvg(c, { dots: false }) +
          info('En la curva acumulada se entra por el eje vertical con el porcentaje y se sale por el eje horizontal con el valor. El RIC contiene el 50 % central de los datos.');
      });
  };

  /* 6.7 interpolación --------------------------------------------- */
  R.interpolacion = function (node) {
    shell(node, 'Interpolación lineal de percentiles',
      'Escribe una clase por línea: límite inferior, límite superior y frecuencia. Ejemplo: <code>0 10 40</code>. Mueve el percentil y observa la construcción gráfica.',
      [{ id: 'g', label: 'Clases y frecuencias', rows: 7, value: '0 10 40\n10 20 60\n20 30 75\n30 40 90\n40 50 105\n50 60 85' },
       { id: 'p', label: 'Percentil Pk', type: 'range', min: 1, max: 99, value: 73 }],
      function (v) {
        var g = parseGrouped(v.g), q = quantileGrouped(g, +v.p);
        if (!q || q.bin.f === 0) throw Error('No se puede interpolar dentro de una clase de frecuencia cero.');
        var pts = [{ x: g.bins[0].lo, F: 0 }], ac = 0;
        g.bins.forEach(function (b) { ac += b.f; pts.push({ x: b.hi, F: 100 * ac / q.N }); });
        return ogive(pts, {
          mark: { x: q.value, pct: +v.p, label: 'P' + v.p + ' = ' + nc(q.value, 2) },
          title: 'Interpolación sobre la curva acumulada',
          xlab: 'límites de clase'
        }) + groupedTable(g, g.bins.indexOf(q.bin)) +
          '<p>Posición buscada: ' + K('\\dfrac{' + v.p + 'N}{100}=' + kf(q.pos, 3)) +
          '. La primera frecuencia acumulada que la alcanza corresponde a la clase <b>[' +
          nc(q.bin.lo, 2) + ', ' + nc(q.bin.hi, 2) + ')</b>.</p>' +
          KD('P_{' + v.p + '}=' + kf(q.bin.lo, 3) + '+\\frac{' + kf(q.pos, 3) + '-' + kf(q.prev, 3) +
            '}{' + q.bin.f + '}\\cdot' + kf(q.bin.hi - q.bin.lo, 3) + '=' + kf(q.value, 3)) +
          info('La interpolación equivale a recorrer en línea recta el tramo de la curva acumulada dentro de esa clase: supone que los datos se reparten uniformemente. El resultado es una estimación.');
      });
  };

  /* 6.8 dispersión ------------------------------------------------- */
  R.dispersion = function (node) {
    shell(node, 'Laboratorio de dispersión',
      'Cada segmento mide la distancia de un dato a la media. Cambia los datos y compara recorrido, RIC y desviación típica.',
      [dataField('d', 'Datos', '4, 5, 5, 6, 6, 6, 7, 7, 8, 9', 3),
       { id: 'vista', label: 'Vista', type: 'select', options: ['Desviaciones', 'Puntos y franjas', 'Comparar medidas'] }],
      function (v) {
        var a = S.datos(v.d), c = S.calc(a);
        var graf;
        if (v.vista === 'Desviaciones') graf = deviationPlot(a, c);
        else if (v.vista === 'Puntos y franjas') {
          graf = dotPlot(a, {
            marks: marksFor(c),
            bands: [
              { from: c.min, to: c.max, color: '#90a4ae', text: 'recorrido', legend: 'recorrido total' },
              { from: c.q1, to: c.q3, color: COL.banda, text: 'RIC', legend: '50 % central' },
              { from: c.m - c.sd, to: c.m + c.sd, color: COL.media, text: 'media ± σ', legend: 'una desviación típica' }
            ],
            title: 'Tres formas de medir la dispersión'
          });
        } else {
          graf = compareBars([
            { label: 'Recorrido', value: c.max - c.min, color: '#90a4ae' },
            { label: 'RIC', value: c.ric, color: COL.banda },
            { label: 'σ', value: c.sd, color: COL.media },
            { label: 'σ²', value: c.v, color: '#7b1fa2' }
          ], { title: 'Magnitud de cada medida de dispersión' });
        }
        var tabla = '<table class="ap-tbl"><tbody>' +
          '<tr><td>Recorrido</td><td>' + nc(c.max - c.min, 3) + '</td></tr>' +
          '<tr><td>' + K('RIC') + '</td><td>' + nc(c.ric, 3) + '</td></tr>' +
          '<tr><td>' + K('\\sigma^2') + '</td><td>' + nc(c.v, 3) + '</td></tr>' +
          '<tr><td>' + K('\\sigma') + '</td><td>' + nc(c.sd, 3) + '</td></tr>' +
          '<tr><td>' + K('CV') + '</td><td>' + (c.m ? nc(100 * c.sd / c.m, 2) + ' %' : 'no definido') + '</td></tr>' +
          '</tbody></table>';
        return graf +
          (v.vista === 'Comparar medidas' ? tabla : split(tabla, compareBars([
            { label: 'Recorrido', value: c.max - c.min, color: '#90a4ae' },
            { label: 'RIC', value: c.ric, color: COL.banda },
            { label: 'σ', value: c.sd, color: COL.media },
            { label: 'σ²', value: c.v, color: '#7b1fa2' }
          ], { title: 'Magnitud de cada medida' }))) +
          info('El recorrido solo usa los extremos; el RIC ignora la mitad exterior; la varianza y la desviación típica usan todos los datos, pesando más los alejados porque las desviaciones se elevan al cuadrado.');
      });
  };

  /* 6.9 intervalo central ------------------------------------------ */
  R.intervalo = function (node) {
    shell(node, 'Intervalo central',
      'Mueve el número de desviaciones típicas y cuenta cuántos datos quedan dentro del intervalo.',
      [dataField('d', 'Datos', '43,47,48,49,50,50,51,52,52,53,54,55,55,56,57', 3),
       { id: 'k', label: 'Desviaciones típicas k', type: 'range', min: 0.5, max: 3, step: 0.5, value: 1 }],
      function (v) {
        var a = S.datos(v.d), c = S.calc(a), k = +v.k;
        if (c.sd === 0) throw Error('La desviación típica es cero: todos los datos son iguales.');
        var lo = c.m - k * c.sd, hi = c.m + k * c.sd;
        var dentro = a.filter(function (x) { return x >= lo && x <= hi; }).length;
        var ref = { '1': 68, '2': 95, '3': 99.7 }[String(k)];
        return dotPlot(a, {
          marks: marksFor(c),
          bands: [{ from: lo, to: hi, color: COL.banda, text: 'media ± ' + nc(k, 1) + 'σ', legend: 'intervalo central' }],
          title: 'Datos dentro del intervalo central'
        }) +
          KD('[\\bar x-' + kf(k, 1) + '\\sigma,\\;\\bar x+' + kf(k, 1) + '\\sigma]=[' + kf(lo, 2) + ',\\;' + kf(hi, 2) + ']') +
          ok('Dentro del intervalo: ' + dentro + ' de ' + c.n + ' datos (' + nc(100 * dentro / c.n, 1) + ' %).') +
          compareBars([
            { label: 'Real', value: 100 * dentro / c.n, color: COL.dato },
            { label: 'Normal', value: ref !== undefined ? ref : 100 * (1 - Math.exp(-k)), color: COL.media }
          ], { title: 'Comparación con la distribución normal', unit: ' %' }) +
          info(ref !== undefined
            ? 'En una distribución aproximadamente normal se espera un ' + nc(ref, 1) + ' % dentro de ' + K('\\bar x\\pm' + kf(k, 1) + '\\sigma') + '.'
            : 'Los valores de referencia 68 %, 95 % y 99,7 % corresponden a k = 1, 2 y 3.');
      });
  };

  /* 6.10 regla empírica -------------------------------------------- */
  R.empirica = function (node) {
    shell(node, 'Regla empírica 68–95–99,7',
      'Compara el porcentaje real de tus datos dentro de una, dos y tres desviaciones típicas con el de una distribución aproximadamente normal.',
      [dataField('d', 'Datos', '43,47,48,49,50,50,51,52,52,53,54,55,55,56,57', 4)],
      function (v) {
        var a = S.datos(v.d), c = S.calc(a);
        if (c.sd === 0) throw Error('La desviación típica es cero: todos los datos son iguales.');
        var teor = [68, 95, 99.7], reales = [];
        var h = '<table class="ap-tbl"><thead><tr><th>Intervalo</th><th>Datos dentro</th><th>Real</th><th>Normal</th></tr></thead><tbody>';
        [1, 2, 3].forEach(function (j) {
          var lo = c.m - j * c.sd, hi = c.m + j * c.sd;
          var num = a.filter(function (x) { return x >= lo && x <= hi; }).length;
          reales.push(100 * num / c.n);
          h += '<tr><td>' + K('[\\bar x-' + j + '\\sigma,\\;\\bar x+' + j + '\\sigma]') + '</td><td>' +
            num + ' de ' + c.n + '</td><td>' + nc(100 * num / c.n, 1) + ' %</td><td>' +
            nc(teor[j - 1], 1) + ' %</td></tr>';
        });
        h += '</tbody></table>';
        var bandas = [3, 2, 1].map(function (j) {
          return {
            from: c.m - j * c.sd, to: c.m + j * c.sd, color: COL.banda,
            text: j + 'σ', legend: 'franja de ' + j + ' desviación' + (j > 1 ? 'es' : '') + ' típica' + (j > 1 ? 's' : '')
          };
        });
        return dotPlot(a, {
          marks: [{ value: c.m, kind: 'tri', color: COL.media, mean: true, legend: 'media ' + K('\\bar x = ' + kf(c.m, 3)) }],
          bands: bandas,
          title: 'Franjas de una, dos y tres desviaciones típicas'
        }) +
          split(h, compareBars([
            { label: '±1σ real', value: reales[0], color: COL.dato },
            { label: '±1σ normal', value: 68, color: COL.media },
            { label: '±2σ real', value: reales[1], color: COL.dato },
            { label: '±2σ normal', value: 95, color: COL.media },
            { label: '±3σ real', value: reales[2], color: COL.dato },
            { label: '±3σ normal', value: 99.7, color: COL.media }
          ], { title: 'Real frente a normal', unit: ' %' })) +
          warn('Las diferencias no implican error de cálculo. La regla 68–95–99,7 solo es esperable en distribuciones aproximadamente normales y con suficiente número de datos.');
      });
  };

  /* 6.11 tipificación --------------------------------------------- */
  R.tipificacion = function (node) {
    shell(node, 'Tipificador de puntuaciones',
      'Introduce datos y un valor. El applet coloca ese valor a la vez en la escala original y en la escala tipificada.',
      [dataField('d', 'Datos', '58,62,65,67,70,70,71,73,75,78,82', 3),
       { id: 'x', label: 'Valor que se tipifica', type: 'text', value: '82' }],
      function (v) {
        var a = S.datos(v.d), c = S.calc(a), x = Number(String(v.x).replace(',', '.'));
        if (!Number.isFinite(x)) throw Error('Escribe un valor numérico en el campo del valor tipificado.');
        if (c.sd === 0) throw Error('La desviación típica es cero: todos los datos son iguales y no se puede tipificar.');
        var z = (x - c.m) / c.sd;
        var zs = a.map(function (q) { return (q - c.m) / c.sd; });
        var cz = S.calc(zs.slice().sort(function (p, q) { return p - q; }));
        var por = a.filter(function (q) { return q <= x; }).length;
        return zScale(c, x) +
          KD('z=\\frac{x-\\bar x}{\\sigma}=\\frac{' + kf(x, 3) + '-' + kf(c.m, 3) + '}{' + kf(c.sd, 3) + '}=' + kf(z, 3)) +
          ok('El valor está ' + K(kf(Math.abs(z), 3)) + ' desviaciones típicas <b>' +
            (z > 0 ? 'por encima' : z < 0 ? 'por debajo' : 'exactamente en') + '</b> de la media. ' +
            'Supera o iguala a ' + por + ' de los ' + c.n + ' datos.') +
          dotPlot(zs.slice().sort(function (p, q) { return p - q; }), {
            marks: [{ value: z, kind: 'dia', color: COL.moda, legend: 'valor tipificado ' + K('z = ' + kf(z, 2)) }],
            title: 'Distribución tipificada', height: 170
          }) +
          ('<table class="ap-tbl"><tbody>' +
            '<tr><td>' + K('\\bar x') + '</td><td>' + nc(c.m, 3) + '</td></tr>' +
            '<tr><td>' + K('\\sigma') + '</td><td>' + nc(c.sd, 3) + '</td></tr>' +
            '<tr><td>' + K('x') + '</td><td>' + nc(x, 3) + '</td></tr>' +
            '<tr><td>' + K('z') + '</td><td><b>' + nc(z, 3) + '</b></td></tr>' +
            '<tr><td>Media de los z</td><td>' + nc(cz.m, 6) + '</td></tr>' +
            '<tr><td>Desviación típica de los z</td><td>' + nc(cz.sd, 6) + '</td></tr>' +
            '</tbody></table>') +
          info('Tipificar traslada y reescala: la distribución conserva su forma, pero su media pasa a ser 0 y su desviación típica a ser 1. Así se pueden comparar valores de variables distintas.');
      });
  };

  /* 6.12 galería de gráficos --------------------------------------- */
  R.graficas = function (node) {
    shell(node, 'Galería de gráficos',
      'Cambia el tipo de gráfico para los mismos datos. Barras y sectores usan los valores tal cual; histograma y polígono los agrupan en clases, y solo entonces interviene el deslizador.',
      [dataField('d', 'Datos', '0,2,8,5,3,9,1,4,0,2,0,6,2,5,4,0,1,2,3,2,3,4,2,3,2,7,2,1,2,0', 4),
       { id: 'tipo', label: 'Gráfico', type: 'select', value: 'Barras',
         options: ['Barras', 'Sectores', 'Histograma', 'Histograma y polígono', 'Caja y bigotes', 'Puntos'] },
       { id: 'k', label: 'Clases (solo histograma)', type: 'range', min: 2, max: 12, value: 6,
         enabledWhen: function (v) { return v.tipo.indexOf('Histograma') === 0; },
         offNote: 'El número de clases solo interviene en los histogramas.' }],
      function (v) {
        var a = S.datos(v.d), c = S.calc(a);
        var xs = Object.keys(c.f).map(Number).sort(function (p, q) { return p - q; });
        var vals = xs.map(function (x) { return c.f[x]; });
        var graf, nota;
        if (v.tipo === 'Barras') {
          graf = barChart(xs, vals, { title: 'Diagrama de barras', ylab: 'frecuencia absoluta' });
          nota = 'En un diagrama de barras las columnas quedan separadas porque cada valor es aislado.';
        } else if (v.tipo === 'Sectores') {
          graf = pie(xs, vals, { title: 'Diagrama de sectores' });
          nota = 'Los sectores muestran el reparto porcentual. Con muchas categorías dejan de ser legibles.';
        } else if (v.tipo === 'Caja y bigotes') {
          graf = boxSvg(c, { dots: true });
          nota = 'El diagrama de caja resume posición y dispersión, y señala posibles valores atípicos.';
        } else if (v.tipo === 'Puntos') {
          graf = dotPlot(a, { marks: marksFor(c), title: 'Diagrama de puntos' });
          nota = 'El diagrama de puntos conserva todos los datos: útil con pocos valores.';
        } else {
          graf = histogram(grouped(a, +v.k), v.tipo.indexOf('polígono') >= 0);
          nota = 'La altura representa densidad de frecuencia: si las amplitudes fueran distintas, serían las áreas —y no las alturas— las proporcionales a las frecuencias.';
        }
        return graf + info(nota) +
          split(freqTable(c, -1), '<table class="ap-tbl"><tbody>' +
            '<tr><td>N</td><td>' + c.n + '</td></tr>' +
            '<tr><td>' + K('\\bar x') + '</td><td>' + nc(c.m, 3) + '</td></tr>' +
            '<tr><td>Me</td><td>' + nc(c.med, 3) + '</td></tr>' +
            '<tr><td>' + K('\\sigma') + '</td><td>' + nc(c.sd, 3) + '</td></tr>' +
            '</tbody></table>');
      });
  };

  /* 6.13 diagrama de caja ------------------------------------------ */
  R.boxplot = function (node) {
    shell(node, 'Diagrama de caja y bigotes',
      'La caja contiene el 50 % central, la línea roja es la mediana y el triángulo naranja la media. Activa la nube de puntos para ver de dónde sale cada pieza.',
      [dataField('d', 'Datos', '37,38,38,39,39,39,39,40,40,40,40,40,40,41,41,41,41,41,41,41,41,41,42,42,42,42,42,42,43,43,43,43,44,44', 4),
       { id: 'dots', label: 'Mostrar los datos', type: 'check', value: true }],
      function (v) {
        var c = S.calc(S.datos(v.d));
        var f1 = c.q1 - 1.5 * c.ric, f2 = c.q3 + 1.5 * c.ric;
        var tabla = '<table class="ap-tbl"><tbody>' +
          '<tr><td>Mínimo</td><td>' + nc(c.min, 2) + '</td></tr>' +
          '<tr><td>' + K('Q_1') + '</td><td>' + nc(c.q1, 2) + '</td></tr>' +
          '<tr><td>' + K('Me = Q_2') + '</td><td>' + nc(c.med, 2) + '</td></tr>' +
          '<tr><td>' + K('Q_3') + '</td><td>' + nc(c.q3, 2) + '</td></tr>' +
          '<tr><td>Máximo</td><td>' + nc(c.max, 2) + '</td></tr>' +
          '<tr><td>' + K('RIC') + '</td><td>' + nc(c.ric, 2) + '</td></tr>' +
          '<tr><td>' + K('\\bar x') + '</td><td>' + nc(c.m, 2) + '</td></tr>' +
          '</tbody></table>';
        return boxSvg(c, { dots: !!v.dots }) +
          split(tabla, compareBars([
            { label: 'Recorrido', value: c.max - c.min, color: '#90a4ae' },
            { label: 'RIC', value: c.ric, color: COL.banda },
            { label: 'σ', value: c.sd, color: COL.media }
          ], { title: 'Dispersión' })) +
          info('Criterio de atípicos: menor que ' + K('Q_1-1{,}5\\,RIC=' + kf(f1, 2)) +
            ' o mayor que ' + K('Q_3+1{,}5\\,RIC=' + kf(f2, 2)) + '.') +
          warn('«Posible valor atípico» no significa dato falso. Puede ser un error, un caso excepcional o la observación más interesante del estudio. Hay que investigarlo, no borrarlo.');
      });
  };

  /* 6.14 laboratorio ---------------------------------------------- */
  R.laboratorio = function (node) {
    shell(node, 'Laboratorio estadístico 1D',
      'Todos los parámetros de una vez, con la representación que elijas. Úsalo para comprobar el trabajo hecho en papel.',
      [dataField('d', 'Datos', '2, 0, 3, 4, 0, 1, 2, 3, 0, 2, 4, 0', 4),
       { id: 'vista', label: 'Representación', type: 'select',
         options: ['Puntos', 'Barras', 'Caja y bigotes', 'Acumulada', 'Histograma'] },
       { id: 'k', label: 'Clases (solo histograma)', type: 'range', min: 2, max: 12, value: 5,
         enabledWhen: function (v) { return v.vista === 'Histograma'; },
         offNote: 'El número de clases solo interviene en el histograma.' }],
      function (v) {
        var a = S.datos(v.d), c = S.calc(a);
        var xs = Object.keys(c.f).map(Number).sort(function (p, q) { return p - q; });
        var graf;
        if (v.vista === 'Puntos') graf = dotPlot(a, { marks: marksFor(c), title: 'Diagrama de puntos' });
        else if (v.vista === 'Barras') graf = barChart(xs, xs.map(function (x) { return c.f[x]; }),
          { title: 'Frecuencias absolutas', ylab: 'frecuencia' });
        else if (v.vista === 'Caja y bigotes') graf = boxSvg(c, { dots: true });
        else if (v.vista === 'Acumulada') graf = ogive(ogivePoints(c), { title: 'Frecuencias acumuladas' });
        else graf = histogram(grouped(a, +v.k), true);
        return graf + split(freqTable(c, -1), resumenTabla(c)) +
          info('Cambia la representación con el mismo conjunto de datos: cada gráfico responde a una pregunta distinta sobre la misma distribución.');
      });
  };

  /* 6.15 entrenador ----------------------------------------------- */
  R.entrenador = function (node) {
    node.classList.add('applet');
    node.innerHTML = '<h4 class="mx-title">Applet · Entrenador de estadística</h4>' +
      '<div class="mx-instr">Calcula en papel la medida pedida y escribe el resultado. Se admite un error de redondeo de 0,01. Al comprobar aparece la representación con la solución.</div>' +
      '<div class="mx-inputs">' +
      '<label class="mx-field"><span>Medida</span><select class="mx-in">' +
      '<option>Media</option><option>Mediana</option><option>Moda</option>' +
      '<option>Desviación típica</option><option>RIC</option><option>Recorrido</option></select></label>' +
      '<label class="mx-field"><span>Tamaño del conjunto</span>' +
      '<select class="mx-in" data-n><option>7</option><option>9</option><option>12</option></select></label>' +
      '<label class="mx-field"><span>Respuesta</span><input class="mx-in" type="text" inputmode="decimal"></label>' +
      '<button class="mx-btn" type="button">Comprobar</button>' +
      '<button class="mx-btn mx-sec" type="button">Otro ejercicio</button>' +
      '<span class="ap-score" data-score>Aciertos: 0 de 0</span>' +
      '</div><div class="mx-out ap-out"></div>';

    var sel = node.querySelector('select');
    var selN = node.querySelector('[data-n]');
    var inp = node.querySelector('input');
    var btn = node.querySelectorAll('button');
    var out = node.querySelector('.mx-out');
    var score = node.querySelector('[data-score]');
    var actual, bien = 0, total = 0;

    function objetivo(c) {
      return sel.value === 'Media' ? c.m
        : sel.value === 'Mediana' ? c.med
        : sel.value === 'Moda' ? c.mo[0]
        : sel.value === 'RIC' ? c.ric
        : sel.value === 'Recorrido' ? c.max - c.min
        : c.sd;
    }

    function nuevo() {
      var n = +selN.value, a = [];
      for (var i = 0; i < n; i++) a.push(Math.floor(Math.random() * 11));
      a.sort(function (x, y) { return x - y; });
      actual = { a: a, c: S.calc(a) };
      inp.value = '';
      out.innerHTML = '<p><b>Datos:</b> <span class="mx-mono">' + a.join(', ') + '</span></p>' +
        info('Calcula ' + sel.value.toLowerCase() + ' y escribe el resultado. Se admite un error de 0,01.');
      S.tex(out);
    }

    function comprobar() {
      if (!actual) return;
      var x = Number(String(inp.value).replace(',', '.'));
      var target = objetivo(actual.c);
      total++;
      var acierto = Number.isFinite(x) && Math.abs(x - target) <= 0.01;
      if (acierto) bien++;
      score.textContent = 'Aciertos: ' + bien + ' de ' + total;
      var c = actual.c;
      out.innerHTML = '<p><b>Datos:</b> <span class="mx-mono">' + actual.a.join(', ') + '</span></p>' +
        (!Number.isFinite(x)
          ? bad('Escribe un número. El valor correcto era ' + nc(target, 3) + '.')
          : acierto
            ? ok('Correcto: ' + sel.value.toLowerCase() + ' = ' + nc(target, 3) + '.')
            : bad('No coincide. Tu respuesta: ' + nc(x, 3) + '. El valor correcto es ' + nc(target, 3) + '.')) +
        dotPlot(actual.a, {
          marks: marksFor(c).concat(
            sel.value === 'RIC' || sel.value === 'Recorrido' ? [] : []),
          bands: sel.value === 'RIC'
            ? [{ from: c.q1, to: c.q3, color: COL.banda, text: 'RIC', legend: 'de Q1 a Q3' }]
            : sel.value === 'Recorrido'
              ? [{ from: c.min, to: c.max, color: '#90a4ae', text: 'recorrido', legend: 'del mínimo al máximo' }]
              : sel.value === 'Desviación típica'
                ? [{ from: c.m - c.sd, to: c.m + c.sd, color: COL.media, text: 'media ± σ', legend: 'una desviación típica' }]
                : [],
          title: 'Solución representada'
        }) +
        '<table class="ap-tbl"><tbody>' +
        '<tr><td>' + K('\\bar x') + '</td><td>' + nc(c.m, 3) + '</td></tr>' +
        '<tr><td>Me</td><td>' + nc(c.med, 3) + '</td></tr>' +
        '<tr><td>Mo</td><td>' + c.mo.map(function (z) { return nc(z, 2); }).join('; ') + '</td></tr>' +
        '<tr><td>' + K('\\sigma') + '</td><td>' + nc(c.sd, 3) + '</td></tr>' +
        '<tr><td>' + K('RIC') + '</td><td>' + nc(c.ric, 3) + '</td></tr>' +
        '<tr><td>Recorrido</td><td>' + nc(c.max - c.min, 3) + '</td></tr>' +
        '</tbody></table>';
      S.tex(out);
    }

    btn[0].onclick = comprobar;
    btn[1].onclick = nuevo;
    sel.onchange = nuevo;
    selN.onchange = nuevo;
    inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); comprobar(); } });
    nuevo();
  };

  /* 6.16 diagnóstico ---------------------------------------------- */
  R.diagnostico = function (node) {
    node.classList.add('applet');
    var expected = ['clasificador', 'tabla', 'agrupador', 'centralizacion', 'atipicos', 'cuantiles',
      'interpolacion', 'dispersion', 'intervalo', 'empirica', 'tipificacion', 'graficas',
      'boxplot', 'laboratorio', 'entrenador', 'diagnostico'];
    var missing = expected.filter(function (x) { return !R[x]; });
    var c = S.calc([0, 1, 2, 3]);
    function row(a, b, good) {
      return '<tr><td>' + a + '</td><td style="color:' + (good ? '#1b5e20' : '#b71c1c') +
        ';font-weight:600">' + b + (good ? ' ✓' : ' ✗') + '</td></tr>';
    }
    node.innerHTML = '<h4 class="mx-title">Applet · Diagnóstico del motor</h4><table class="ap-tbl"><tbody>' +
      row('Núcleo <code>window.EST1</code>', 'activo', !!window.EST1) +
      row('Módulo de visualización', S.extra ? 'cargado' : 'ausente', !!S.extra) +
      row('KaTeX local', window.katex ? 'cargado' : 'ausente', !!window.katex) +
      row('Applets registrados', Object.keys(R).length + (missing.length ? ' · faltan: ' + missing.join(', ') : ''), !missing.length) +
      row('Media de 0, 1, 2, 3', nc(c.m, 1), Math.abs(c.m - 1.5) < 1e-12) +
      row('Desviación típica', nc(c.sd, 6), Math.abs(c.sd - Math.sqrt(1.25)) < 1e-9) +
      row('Cuartiles', 'Q1 = ' + nc(c.q1, 2) + ', Q3 = ' + nc(c.q3, 2), Number.isFinite(c.q1) && Number.isFinite(c.q3)) +
      '</tbody></table><p class="mx-mono" data-est-count>contando applets…</p>';
    setTimeout(function () {
      var a = document.querySelectorAll('[data-applet-est1]').length;
      var b = document.querySelectorAll('[data-applet-est1][data-mounted="1"]').length;
      var g = document.querySelectorAll('.ap-fig svg').length;
      var e = node.querySelector('[data-est-count]');
      if (!e) return;
      e.textContent = 'applets en la página: ' + a + ', montados: ' + b + (a === b ? ' ✓' : ' ✗') +
        ' · gráficos dibujados: ' + g;
      e.style.color = a === b ? '#1b5e20' : '#b71c1c';
      e.style.fontWeight = '600';
    }, 160);
  };

  S.extra = true;
})();
