/* =====================================================================
   est1-applets-extra.js · Estadística unidimensional · 2.º Bachillerato
   Sustituye el módulo provisional. Depende de window.EST1.

   Applets avanzados:
     agrupador · interpolacion · graficas · boxplot · tipificacion
     empirica · entrenador · diagnostico

   JavaScript plano, gráficos SVG propios, sin OJS ni dependencias de red.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.EST1;
  if (!S) return;

  var R = S.registry;
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var K = function (t) { return '<span data-tex="' + esc(t) + '"></span>'; };
  var KD = function (t) { return '<span data-tex="' + esc(t) + '" data-display="1"></span>'; };
  var fmt = function (x, d) {
    d = d === undefined ? 3 : d;
    if (!Number.isFinite(x)) return '—';
    var y = Math.round(x * Math.pow(10, d)) / Math.pow(10, d);
    return String(Object.is(y, -0) ? 0 : y);
  };
  var ok = function (m) { return '<div class="mx-ok">' + m + '</div>'; };
  var info = function (m) { return '<div class="mx-info">' + m + '</div>'; };
  var warn = function (m) { return '<div class="mx-warn">' + m + '</div>'; };
  var bad = function (m) { return '<div class="mx-bad ap-err">' + m + '</div>'; };

  function shell(node, title, instructions, fields, compute) {
    node.classList.add('applet');
    node.innerHTML = '<h4 class="mx-title">Applet · ' + title + '</h4>' +
      '<div class="mx-instr">' + instructions + '</div>' +
      '<div class="mx-inputs"></div><div class="mx-out ap-out"></div>';
    var inputs = node.querySelector('.mx-inputs');
    var out = node.querySelector('.mx-out');
    var ctl = {};
    fields.forEach(function (f) {
      var lab = document.createElement('label');
      lab.className = 'mx-field';
      var cap = document.createElement('span');
      cap.textContent = f.label;
      lab.appendChild(cap);
      var el;
      if (f.type === 'select') {
        el = document.createElement('select');
        f.options.forEach(function (o) {
          var op = document.createElement('option'); op.value = o; op.textContent = o; el.appendChild(op);
        });
        el.value = f.value || f.options[0];
      } else if (f.type === 'range') {
        el = document.createElement('input'); el.type = 'range';
        el.min = f.min; el.max = f.max; el.step = f.step || 1; el.value = f.value;
        var live = document.createElement('span'); live.className = 'mx-mono'; live.textContent = el.value;
        el.addEventListener('input', function () { live.textContent = el.value; });
        lab.appendChild(el); lab.appendChild(live); el.className = 'mx-in';
        inputs.appendChild(lab); ctl[f.id] = el; el.addEventListener('input', run); return;
      } else if (f.type === 'text') {
        el = document.createElement('input'); el.type = 'text'; el.value = f.value || '';
      } else {
        el = document.createElement('textarea'); el.rows = f.rows || 3; el.value = f.value || ''; el.spellcheck = false;
      }
      el.className = 'mx-in'; lab.appendChild(el); inputs.appendChild(lab); ctl[f.id] = el;
      el.addEventListener('input', run); el.addEventListener('change', run);
    });
    function run() {
      var v = {}; Object.keys(ctl).forEach(function (x) { v[x] = ctl[x].value; });
      try { out.innerHTML = compute(v); S.tex(out); }
      catch (e) { out.innerHTML = bad(e.message); S.log.push({ applet: title, error: e.message }); }
    }
    run();
  }

  function svgWrap(body, W, H, label) {
    return '<div style="overflow-x:auto"><svg role="img" aria-label="' + esc(label || 'Gráfico estadístico') +
      '" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H +
      '" style="max-width:100%;height:auto;background:#fff;border:1px solid #d9e0e4;border-radius:6px">' +
      body + '</svg></div>';
  }

  function axes(W, H, ml, mb, ymax, labels) {
    var h = '<line x1="' + ml + '" y1="10" x2="' + ml + '" y2="' + (H - mb) + '" stroke="#455a64"/>' +
      '<line x1="' + ml + '" y1="' + (H - mb) + '" x2="' + (W - 10) + '" y2="' + (H - mb) + '" stroke="#455a64"/>';
    for (var i = 0; i <= 4; i++) {
      var y = H - mb - i * (H - mb - 20) / 4;
      h += '<line x1="' + ml + '" y1="' + y + '" x2="' + (W - 10) + '" y2="' + y +
        '" stroke="#eceff1"/><text x="' + (ml - 5) + '" y="' + (y + 4) +
        '" text-anchor="end" font-size="10" fill="#546e7a">' + fmt(ymax * i / 4, 1) + '</text>';
    }
    return h;
  }

  function grouped(a, classes) {
    var min = Math.min.apply(null, a), max = Math.max.apply(null, a);
    if (max === min) return { min: min, max: max, width: 1, bins: [{ lo: min - .5, hi: min + .5, mark: min, f: a.length }] };
    var width = (max - min) / classes, bins = [];
    for (var i = 0; i < classes; i++) bins.push({ lo: min + i * width, hi: min + (i + 1) * width, mark: min + (i + .5) * width, f: 0 });
    a.forEach(function (x) {
      var j = Math.min(classes - 1, Math.floor((x - min) / width)); bins[j].f++;
    });
    return { min: min, max: max, width: width, bins: bins };
  }

  function groupedTable(g) {
    var N = g.bins.reduce(function (s, b) { return s + b.f; }, 0), ac = 0;
    var h = '<table class="ap-tbl"><thead><tr><th>Clase</th><th>Marca</th><th>fᵢ</th><th>hᵢ</th><th>Fᵢ</th></tr></thead><tbody>';
    g.bins.forEach(function (b, i) {
      ac += b.f;
      h += '<tr><td>[' + fmt(b.lo, 2) + ', ' + fmt(b.hi, 2) + (i === g.bins.length - 1 ? ']' : ')') +
        '</td><td>' + fmt(b.mark, 2) + '</td><td>' + b.f + '</td><td>' + fmt(b.f / N, 3) +
        '</td><td>' + ac + '</td></tr>';
    });
    return h + '</tbody></table>';
  }

  function parseGrouped(s) {
    var rows = String(s).trim().split(/\n+/).map(function (r) { return r.trim(); }).filter(Boolean), bins = [];
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

  function bars(c, hist) {
    var xs = Object.keys(c.f).map(Number).sort(function (a, b) { return a - b; });
    var vals = xs.map(function (x) { return c.f[x]; }), W = 520, H = 280, ml = 42, mb = 38, ymax = Math.max.apply(null, vals) || 1;
    var iw = W - ml - 15, bw = iw / xs.length, body = axes(W, H, ml, mb, ymax);
    xs.forEach(function (x, i) {
      var ht = vals[i] / ymax * (H - mb - 25), xx = ml + i * bw + (hist ? 0 : bw * .13), ww = hist ? bw : bw * .74;
      body += '<rect x="' + xx + '" y="' + (H - mb - ht) + '" width="' + ww + '" height="' + ht +
        '" fill="#4e79a7" opacity=".82"/><text x="' + (ml + (i + .5) * bw) + '" y="' + (H - 18) +
        '" text-anchor="middle" font-size="10">' + x + '</text>';
    });
    return svgWrap(body, W, H, hist ? 'Histograma' : 'Diagrama de barras');
  }

  function histogram(g, polygon) {
    var W = 540, H = 290, ml = 42, mb = 42, maxD = Math.max.apply(null, g.bins.map(function (b) { return b.f / (b.hi - b.lo); })) || 1;
    var xmin = g.bins[0].lo, xmax = g.bins[g.bins.length - 1].hi, iw = W - ml - 15, body = axes(W, H, ml, mb, maxD), pts = [];
    g.bins.forEach(function (b) {
      var x = ml + (b.lo - xmin) / (xmax - xmin) * iw, w = (b.hi - b.lo) / (xmax - xmin) * iw;
      var d = b.f / (b.hi - b.lo), ht = d / maxD * (H - mb - 25);
      body += '<rect x="' + x + '" y="' + (H - mb - ht) + '" width="' + w + '" height="' + ht +
        '" fill="#4e79a7" opacity=".68" stroke="#fff"/><text x="' + x + '" y="' + (H - 19) + '" font-size="9">' + fmt(b.lo, 1) + '</text>';
      pts.push((x + w / 2) + ',' + (H - mb - ht));
    });
    body += '<text x="' + (W - 22) + '" y="' + (H - 19) + '" font-size="9">' + fmt(xmax, 1) + '</text>';
    if (polygon) body += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#c62828" stroke-width="2.5"/>';
    return svgWrap(body, W, H, polygon ? 'Histograma y polígono de frecuencias' : 'Histograma');
  }

  function pie(c) {
    var xs = Object.keys(c.f).map(Number).sort(function (a, b) { return a - b; }), colors = ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc949','#af7aa1','#ff9da7'];
    var cx = 150, cy = 145, r = 105, ang = -Math.PI / 2, body = '';
    xs.forEach(function (x, i) {
      var da = 2 * Math.PI * c.f[x] / c.n, a2 = ang + da, large = da > Math.PI ? 1 : 0;
      var x1 = cx + r * Math.cos(ang), y1 = cy + r * Math.sin(ang), x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      body += '<path d="M ' + cx + ' ' + cy + ' L ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2 + ' ' + y2 + ' Z" fill="' + colors[i % colors.length] + '"/>';
      var am = ang + da / 2;
      body += '<text x="' + (cx + 65 * Math.cos(am)) + '" y="' + (cy + 65 * Math.sin(am)) + '" text-anchor="middle" font-size="11" fill="#fff">' + fmt(100 * c.f[x] / c.n, 1) + '%</text>';
      body += '<rect x="285" y="' + (25 + i * 22) + '" width="13" height="13" fill="' + colors[i % colors.length] + '"/><text x="305" y="' + (36 + i * 22) + '" font-size="11">' + x + '</text>';
      ang = a2;
    });
    return svgWrap(body, 390, 290, 'Diagrama de sectores');
  }

  function boxSvg(c) {
    var W = 560, H = 150, ml = 40, mr = 25, y = 65, scale = function (x) { return ml + (x - c.min) / Math.max(1e-9, c.max - c.min) * (W - ml - mr); };
    var iqr = c.ric, lowFence = c.q1 - 1.5 * iqr, highFence = c.q3 + 1.5 * iqr;
    var raw = []; Object.keys(c.f).forEach(function (x) { for (var i = 0; i < c.f[x]; i++) raw.push(+x); });
    var clean = raw.filter(function (x) { return x >= lowFence && x <= highFence; }), lo = Math.min.apply(null, clean), hi = Math.max.apply(null, clean);
    var body = '<line x1="' + scale(lo) + '" y1="' + y + '" x2="' + scale(hi) + '" y2="' + y + '" stroke="#455a64" stroke-width="2"/>' +
      '<line x1="' + scale(lo) + '" y1="45" x2="' + scale(lo) + '" y2="85" stroke="#455a64"/>' +
      '<line x1="' + scale(hi) + '" y1="45" x2="' + scale(hi) + '" y2="85" stroke="#455a64"/>' +
      '<rect x="' + scale(c.q1) + '" y="35" width="' + (scale(c.q3)-scale(c.q1)) + '" height="60" fill="#76b7b2" opacity=".55" stroke="#00695c"/>' +
      '<line x1="' + scale(c.med) + '" y1="35" x2="' + scale(c.med) + '" y2="95" stroke="#c62828" stroke-width="3"/>';
    raw.filter(function (x) { return x < lowFence || x > highFence; }).forEach(function (x) {
      body += '<circle cx="' + scale(x) + '" cy="' + y + '" r="4" fill="#fff" stroke="#c62828" stroke-width="2"/>';
    });
    [c.min,c.q1,c.med,c.q3,c.max].forEach(function (x) { body += '<text x="' + scale(x) + '" y="120" text-anchor="middle" font-size="10">' + fmt(x,2) + '</text>'; });
    return svgWrap(body, W, H, 'Diagrama de caja y bigotes');
  }

  R.agrupador = function (node) {
    shell(node, 'Agrupar datos en intervalos',
      'Escribe datos continuos y elige el número de clases. El applet calcula límites, amplitud, marca de clase y frecuencias. Cambia el número de clases y observa cómo cambia el resumen.',
      [{ id:'d', label:'Datos', rows:4, value:'23,14,6,7,25,6,17,34,26,18,39,11,31,6,2,19,33,5,6,22,18,8,31,28,3,26,12,8,15,7' },
       { id:'k', label:'Número de clases', type:'range', min:3, max:10, value:6 }],
      function (v) {
        var a = S.datos(v.d), g = grouped(a, +v.k);
        return groupedTable(g) + histogram(g, true) +
          info('Amplitud de clase: ' + K(fmt(g.width,3)) + '. Al agrupar, cada dato se sustituye por su marca de clase para los cálculos: el resumen es aproximado.') +
          warn('No existe un único agrupamiento correcto. Demasiadas clases no resumen; demasiado pocas esconden la forma de los datos.');
      });
  };

  R.interpolacion = function (node) {
    shell(node, 'Interpolación lineal de percentiles',
      'Escribe una clase por línea: límite inferior, límite superior y frecuencia. Ejemplo: <code>0 10 40</code>. Elige el percentil y sigue la sustitución en la fórmula.',
      [{ id:'g', label:'Clases y frecuencias', rows:7, value:'0 10 40\n10 20 60\n20 30 75\n30 40 90\n40 50 105\n50 60 85' },
       { id:'p', label:'Percentil Pk', type:'range', min:1, max:99, value:73 }],
      function (v) {
        var g = parseGrouped(v.g), q = quantileGrouped(g, +v.p);
        if (!q || q.bin.f === 0) throw Error('No se puede interpolar dentro de una clase de frecuencia cero.');
        return groupedTable(g) +
          '<p>Posición buscada: ' + K(v.p + 'N/100=' + fmt(q.pos,3)) +
          '. La primera frecuencia acumulada que la alcanza corresponde a la clase <b>[' + fmt(q.bin.lo,2) + ', ' + fmt(q.bin.hi,2) + ')</b>.</p>' +
          KD('P_{' + v.p + '}=' + fmt(q.bin.lo,3) + '+\\frac{' + fmt(q.pos,3) + '-' + fmt(q.prev,3) + '}{' + q.bin.f + '}\\cdot' + fmt(q.bin.hi-q.bin.lo,3) + '=' + fmt(q.value,3)) +
          info('La interpolación supone que los datos están repartidos uniformemente dentro de la clase. El resultado es una estimación, no un valor observado necesariamente.');
      });
  };

  R.graficas = function (node) {
    shell(node, 'Galería de gráficos',
      'Introduce datos individuales y cambia el tipo de gráfico. Barras para datos discretos; sectores para pocas categorías; histograma y polígono para datos agrupados.',
      [{ id:'d', label:'Datos', rows:4, value:'0,2,8,5,3,9,1,4,0,2,0,6,2,5,4,0,1,2,3,2,3,4,2,3,2,7,2,1,2,0' },
       { id:'tipo', label:'Gráfico', type:'select', value:'Barras', options:['Barras','Sectores','Histograma','Histograma y polígono'] },
       { id:'k', label:'Clases del histograma', type:'range', min:3, max:9, value:6 }],
      function (v) {
        var a = S.datos(v.d), c = S.calc(a), graph;
        if (v.tipo === 'Barras') graph = bars(c, false);
        else if (v.tipo === 'Sectores') graph = pie(c);
        else graph = histogram(grouped(a,+v.k), v.tipo.indexOf('polígono') >= 0);
        return graph + (v.tipo === 'Histograma' || v.tipo.indexOf('polígono') >= 0
          ? info('La altura representa densidad de frecuencia. Así, si las amplitudes fueran distintas, las áreas —no las alturas— serían proporcionales a las frecuencias.')
          : info('En un diagrama de barras las columnas quedan separadas. En un histograma se tocan porque representan intervalos continuos.'));
      });
  };

  R.boxplot = function (node) {
    shell(node, 'Diagrama de caja y bigotes',
      'Introduce datos. La caja contiene el 50 % central; la línea roja es la mediana; los puntos fuera de 1,5·RIC se marcan como posibles valores atípicos.',
      [{ id:'d', label:'Datos', rows:4, value:'37,38,38,39,39,39,39,40,40,40,40,40,40,41,41,41,41,41,41,41,41,41,42,42,42,42,42,42,43,43,43,43,44,44' }],
      function (v) {
        var c = S.calc(S.datos(v.d));
        return boxSvg(c) + S.resumen(c) +
          info('Criterio de atípicos: menor que ' + K('Q_1-1{,}5\\,RIC=' + fmt(c.q1-1.5*c.ric,2)) +
            ' o mayor que ' + K('Q_3+1{,}5\\,RIC=' + fmt(c.q3+1.5*c.ric,2)) + '.') +
          warn('«Posible valor atípico» no significa dato falso. Puede ser un error, un caso excepcional o la observación más interesante del estudio. Hay que investigarlo, no borrarlo automáticamente.');
      });
  };

  R.tipificacion = function (node) {
    shell(node, 'Tipificador de puntuaciones',
      'Introduce un conjunto de datos y un valor x. El applet calcula z, lo interpreta y tipifica toda la distribución.',
      [{ id:'d', label:'Datos', rows:3, value:'58,62,65,67,70,70,71,73,75,78,82' },
       { id:'x', label:'Valor que se tipifica', type:'text', value:'82' }],
      function (v) {
        var a = S.datos(v.d), c = S.calc(a), x = Number(v.x);
        if (!Number.isFinite(x)) throw Error('Escribe un valor x numérico.');
        if (c.sd === 0) throw Error('La desviación típica es cero: todos los datos son iguales y no se puede tipificar.');
        var z = (x-c.m)/c.sd, zs = a.map(function (q) { return (q-c.m)/c.sd; }), cz = S.calc(zs);
        return KD('z=\\frac{x-\\bar x}{\\sigma}=\\frac{' + fmt(x,3) + '-' + fmt(c.m,3) + '}{' + fmt(c.sd,3) + '}=' + fmt(z,3)) +
          ok('El valor está ' + K(fmt(Math.abs(z),3)) + ' desviaciones típicas <b>' + (z>0?'por encima':z<0?'por debajo':'exactamente en') + '</b> de la media.') +
          '<p>Datos tipificados:</p><p class="mx-mono">' + zs.map(function (q) { return fmt(q,2); }).join(', ') + '</p>' +
          info('Comprobación: la media tipificada es ' + K(fmt(cz.m,6)) + ' y la desviación típica es ' + K(fmt(cz.sd,6)) + '.');
      });
  };

  R.empirica = function (node) {
    shell(node, 'Regla empírica 68–95–99,7',
      'Compara el porcentaje real de tus datos dentro de una, dos y tres desviaciones típicas con la regla empírica de una distribución aproximadamente normal.',
      [{ id:'d', label:'Datos', rows:4, value:'43,47,48,49,50,50,51,52,52,53,54,55,55,56,57' }],
      function (v) {
        var a = S.datos(v.d), c = S.calc(a), h = S.resumen(c);
        h += '<table class="ap-tbl"><thead><tr><th>Intervalo</th><th>Datos dentro</th><th>Porcentaje real</th><th>Referencia normal</th></tr></thead><tbody>';
        [1,2,3].forEach(function (j) {
          var lo=c.m-j*c.sd, hi=c.m+j*c.sd, num=a.filter(function(x){return x>=lo&&x<=hi}).length;
          h += '<tr><td>' + K('[\\bar x-' + j + '\\sigma,\\bar x+' + j + '\\sigma]') + '</td><td>' + num + ' de ' + a.length +
            '</td><td>' + fmt(100*num/a.length,1) + ' %</td><td>' + [68,95,99.7][j-1] + ' %</td></tr>';
        });
        return h + warn('Las diferencias no implican que el cálculo esté mal. La regla 68–95–99,7 solo es esperable en distribuciones aproximadamente normales y con suficiente número de datos.');
      });
  };

  R.entrenador = function (node) {
    node.classList.add('applet');
    node.innerHTML = '<h4 class="mx-title">Applet · Entrenador de estadística</h4>' +
      '<div class="mx-instr">Calcula en papel la media, mediana o desviación típica del conjunto propuesto. Escribe la respuesta con punto decimal y comprueba.</div>' +
      '<div class="mx-inputs"><label class="mx-field"><span>Tipo</span><select class="mx-in"><option>Media</option><option>Mediana</option><option>Desviación típica</option><option>RIC</option></select></label>' +
      '<label class="mx-field"><span>Respuesta</span><input class="mx-in" type="text"></label>' +
      '<button class="mx-btn" type="button">Comprobar</button><button class="mx-btn mx-sec" type="button">Otro ejercicio</button></div><div class="mx-out ap-out"></div>';
    var sel=node.querySelector('select'), inp=node.querySelector('input'), btn=node.querySelectorAll('button'), out=node.querySelector('.mx-out'), actual;
    function nuevo(){var a=[];for(var i=0;i<9;i++)a.push(Math.floor(Math.random()*11));actual={a:a,c:S.calc(a.slice().sort(function(x,y){return x-y}))};inp.value='';out.innerHTML='<p><b>Datos:</b> '+a.join(', ')+'</p>'+info('Calcula '+sel.value+' y escribe el resultado. Se admite un error de redondeo de 0,01.');}
    function comprobar(){var x=Number(inp.value), target=sel.value==='Media'?actual.c.m:sel.value==='Mediana'?actual.c.med:sel.value==='RIC'?actual.c.ric:actual.c.sd;if(!Number.isFinite(x)){out.innerHTML+=bad('Escribe un número.');return}out.innerHTML='<p><b>Datos:</b> '+actual.a.join(', ')+'</p>'+(Math.abs(x-target)<=.01?ok('Correcto: '+fmt(target,3)+'.'):bad('No coincide. El valor correcto es '+fmt(target,3)+'. Revisa el procedimiento.'));}
    btn[0].onclick=comprobar;btn[1].onclick=nuevo;sel.onchange=nuevo;nuevo();
  };

  R.diagnostico = function (node) {
    node.classList.add('applet');
    var expected=['clasificador','tabla','agrupador','centralizacion','atipicos','cuantiles','interpolacion','dispersion','intervalo','empirica','tipificacion','graficas','boxplot','laboratorio','entrenador','diagnostico'];
    var missing=expected.filter(function(x){return !R[x]}), c=S.calc([0,1,2,3].sort(function(a,b){return a-b}));
    function row(a,b,good){return '<tr><td>'+a+'</td><td style="color:'+(good?'#1b5e20':'#b71c1c')+';font-weight:600">'+b+(good?' ✓':' ✗')+'</td></tr>'}
    node.innerHTML='<h4 class="mx-title">Applet · Diagnóstico del motor</h4><table class="ap-tbl"><tbody>'+
      row('Núcleo <code>window.EST1</code>','activo',!!window.EST1)+
      row('KaTeX local',window.katex?'cargado':'ausente',!!window.katex)+
      row('Applets registrados',Object.keys(R).length+(missing.length?' · faltan: '+missing.join(', '):''),!missing.length)+
      row('Media de 0,1,2,3',fmt(c.m,1),Math.abs(c.m-1.5)<1e-12)+
      row('Desviación típica',''+fmt(c.sd,6),Math.abs(c.sd-Math.sqrt(1.25))<1e-9)+
      row('Cuartiles','Q1='+fmt(c.q1,2)+', Q3='+fmt(c.q3,2),Number.isFinite(c.q1)&&Number.isFinite(c.q3))+
      '</tbody></table><p class="mx-mono" data-est-count>contando applets…</p>';
    setTimeout(function(){var a=document.querySelectorAll('[data-applet-est1]').length,b=document.querySelectorAll('[data-applet-est1][data-mounted="1"]').length,e=node.querySelector('[data-est-count]');if(e){e.textContent='applets en la página: '+a+', montados: '+b+(a===b?' ✓':' ✗');e.style.color=a===b?'#1b5e20':'#b71c1c';e.style.fontWeight='600'}},120);
  };

  S.extra = true;
})();