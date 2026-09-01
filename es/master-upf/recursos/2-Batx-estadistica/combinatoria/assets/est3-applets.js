/* =====================================================================
   est3-applets.js · Tema 3 Combinatoria · 2.º Bachillerato
   Ruta: 2-Batx-estadistica/combinatoria/assets/est3-applets.js

   API pública: window.EST3
     .registry        mapa clave -> función montadora
     .fact(n)         factorial exacto (BigInt)
     .V .VR .P .PC .C .CR .PR    fórmulas combinatorias exactas (BigInt)
     .bigTxt .bigTex  formato con separador de millares
     .tuplas(...)     enumeración de agrupaciones para listas pequeñas
     .tex(node)       renderiza KaTeX sobre nodos data-tex
     .log             pila de errores por applet
     .extraA .extraB  true cuando cada módulo ha registrado sus applets

   Toda la aritmética usa BigInt: 49! tiene 63 cifras y con números en
   coma flotante los resultados de la Primitiva o de la quiniela serían
   inexactos. Así C(49,6) = 13 983 816 sale exacto, no aproximado.

   Sin OJS, CDN, auto-render ni dependencias externas.
   ===================================================================== */
(function () {
  'use strict';

  var R = {};

  /* ------------------------------------------------------------------
     0 · utilidades de texto
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
     1 · aritmética exacta con BigInt
     ------------------------------------------------------------------ */
  var FCACHE = [1n, 1n];

  function fact(n) {
    n = Number(n);
    if (!Number.isInteger(n) || n < 0) throw Error('El factorial solo está definido para números naturales (0, 1, 2, …).');
    if (n > 2000) throw Error('Límite del applet: usa n ≤ 2000 para que el cálculo sea instantáneo.');
    for (var i = FCACHE.length; i <= n; i++) FCACHE[i] = FCACHE[i - 1] * BigInt(i);
    return FCACHE[n];
  }

  /* Producto de m factores decrecientes: n(n-1)...(n-m+1). Es V(n,m). */
  function descendente(n, m) {
    var r = 1n;
    for (var i = 0; i < m; i++) r *= BigInt(n - i);
    return r;
  }

  /* Variaciones sin repetición */
  function V(n, m) {
    n = Number(n); m = Number(m);
    if (!Number.isInteger(n) || !Number.isInteger(m) || n < 0 || m < 0)
      throw Error('n y m deben ser números naturales.');
    if (m > n) throw Error('En las variaciones sin repetición hace falta m ≤ n: no puedes elegir ' + m + ' elementos distintos de un conjunto de ' + n + '.');
    return descendente(n, m);
  }

  /* Variaciones con repetición: único caso donde m puede superar a n */
  function VR(n, m) {
    n = Number(n); m = Number(m);
    if (!Number.isInteger(n) || !Number.isInteger(m) || n < 0 || m < 0)
      throw Error('n y m deben ser números naturales.');
    if (m > 4000) throw Error('Límite del applet: usa m ≤ 4000.');
    return BigInt(n) ** BigInt(m);
  }

  /* Permutaciones */
  function P(n) { return fact(n); }

  /* Permutaciones circulares de n elementos */
  function PC(n) {
    n = Number(n);
    if (!Number.isInteger(n) || n < 1) throw Error('Hacen falta al menos 1 elemento.');
    return fact(n - 1);
  }

  /* Permutaciones con repetición: reps es un array de multiplicidades */
  function PR(reps) {
    var n = reps.reduce(function (a, b) { return a + Number(b); }, 0);
    var d = 1n;
    reps.forEach(function (a) { d *= fact(Number(a)); });
    return fact(n) / d;
  }

  /* Combinaciones sin repetición, calculadas sin desbordar */
  function C(n, m) {
    n = Number(n); m = Number(m);
    if (!Number.isInteger(n) || !Number.isInteger(m) || n < 0 || m < 0)
      throw Error('n y m deben ser números naturales.');
    if (m > n) throw Error('En las combinaciones hace falta m ≤ n: no puedes elegir ' + m + ' elementos distintos de un conjunto de ' + n + '.');
    if (m > n - m) m = n - m;                 // simetría, menos multiplicaciones
    var num = 1n, den = 1n;
    for (var i = 0; i < m; i++) {
      num *= BigInt(n - i);
      den *= BigInt(i + 1);
    }
    return num / den;
  }

  /* Combinaciones con repetición */
  function CR(n, m) {
    n = Number(n); m = Number(m);
    if (n < 1) throw Error('Hace falta n ≥ 1.');
    return C(n + m - 1, m);
  }

  /* ------------------------------------------------------------------
     2 · formato de números grandes
     Español: separador de millares con espacio fino, nunca con punto,
     para no confundirlo con la coma decimal.
     ------------------------------------------------------------------ */
  /* U+202F: espacio fino que NO permite salto de línea, para que un
     número como 13 983 816 nunca se parta al final de un renglón. */
  var FINO = '\u202F';

  function grupos(s) {
    var neg = s.charAt(0) === '-';
    if (neg) s = s.slice(1);
    var out = '', c = 0;
    for (var i = s.length - 1; i >= 0; i--) {
      out = s.charAt(i) + out;
      if (++c % 3 === 0 && i > 0) out = FINO + out;
    }
    return (neg ? '-' : '') + out;
  }
  function bigTxt(b) { return grupos(b.toString()); }
  /* Dentro de KaTeX el espacio fino se escribe \, */
  function bigTex(b) {
    var s = b.toString(), neg = s.charAt(0) === '-';
    if (neg) s = s.slice(1);
    var out = '', c = 0;
    for (var i = s.length - 1; i >= 0; i--) {
      out = s.charAt(i) + out;
      if (++c % 3 === 0 && i > 0) out = '\\,' + out;
    }
    return (neg ? '-' : '') + out;
  }

  /* Notación científica aproximada para números descomunales */
  function bigAprox(b) {
    var s = b.toString();
    if (s.length <= 12) return null;
    var mant = s.charAt(0) + '{,}' + s.slice(1, 4);
    return mant + ' \\cdot 10^{' + (s.length - 1) + '}';
  }

  /* Probabilidad 1/N como decimal legible */
  function unoEntre(b) {
    var v = Number(b);
    if (!Number.isFinite(v) || v === 0) return '—';
    var p = 1 / v;
    if (p >= 1e-4) return nc(p, 6);
    return p.toExponential(3).replace('.', ',').replace('e', ' \u00b7 10^');
  }

  /* ------------------------------------------------------------------
     3 · parseo de entradas
     ------------------------------------------------------------------ */

  /* Lista de elementos separados por espacios, comas o punto y coma.
     "A B C D"  ·  "1,2,3"  ·  "oro; plata; bronce"                     */
  function elementos(txt) {
    var s = String(txt || '').trim();
    if (!s) throw Error('Escribe los elementos separados por espacios o comas. Ejemplo: A B C D');
    var L = s.split(/[\s,;]+/).filter(Boolean);
    if (L.length < 1) throw Error('Necesito al menos un elemento.');
    if (L.length > 40) throw Error('Máximo 40 elementos para que la lista se pueda dibujar.');
    return L;
  }

  /* Letras de una palabra, en mayúsculas y sin espacios: "casa" -> [C,A,S,A] */
  function letras(txt) {
    var s = String(txt || '').replace(/[\s,;.\-_]/g, '').toUpperCase();
    if (!s) throw Error('Escribe una palabra. Ejemplo: CASA');
    if (s.length > 20) throw Error('Máximo 20 letras.');
    return s.split('');
  }

  /* Entero validado dentro de un rango */
  function entero(v, min, max, nombre) {
    var s = String(v).trim().replace(',', '.');
    var x = Number(s);
    if (!Number.isFinite(x) || !Number.isInteger(x))
      throw Error((nombre || 'El valor') + ' debe ser un número entero.');
    if (min !== undefined && x < min) throw Error((nombre || 'El valor') + ' debe ser al menos ' + min + '.');
    if (max !== undefined && x > max) throw Error((nombre || 'El valor') + ' no puede pasar de ' + max + ' en este applet.');
    return x;
  }

  /* ------------------------------------------------------------------
     4 · enumeración de agrupaciones (para listas pequeñas)
     modo: 'V' variaciones · 'VR' variaciones con repetición
           'C' combinaciones · 'CR' combinaciones con repetición
           'P' permutaciones (m = n)
     Devuelve { lista: [[...], ...], truncada: bool, total: BigInt }
     ------------------------------------------------------------------ */
  function tuplas(elems, m, modo, tope) {
    tope = tope || 300;
    var n = elems.length, out = [], truncada = false;
    var total;
    try {
      total = modo === 'V'  ? V(n, m)
            : modo === 'VR' ? VR(n, m)
            : modo === 'C'  ? C(n, m)
            : modo === 'CR' ? CR(n, m)
            : fact(n);
    } catch (e) { total = null; }

    function push(t) {
      if (out.length >= tope) { truncada = true; return false; }
      out.push(t.slice());
      return true;
    }

    function recV(actual, usados) {
      if (actual.length === m) return push(actual);
      for (var i = 0; i < n; i++) {
        if (usados[i]) continue;
        usados[i] = 1; actual.push(elems[i]);
        var ok = recV(actual, usados);
        actual.pop(); usados[i] = 0;
        if (!ok) return false;
      }
      return true;
    }
    function recVR(actual) {
      if (actual.length === m) return push(actual);
      for (var i = 0; i < n; i++) {
        actual.push(elems[i]);
        var ok = recVR(actual);
        actual.pop();
        if (!ok) return false;
      }
      return true;
    }
    function recC(actual, desde) {
      if (actual.length === m) return push(actual);
      for (var i = desde; i < n; i++) {
        actual.push(elems[i]);
        var ok = recC(actual, i + 1);
        actual.pop();
        if (!ok) return false;
      }
      return true;
    }
    function recCR(actual, desde) {
      if (actual.length === m) return push(actual);
      for (var i = desde; i < n; i++) {
        actual.push(elems[i]);
        var ok = recCR(actual, i);
        actual.pop();
        if (!ok) return false;
      }
      return true;
    }

    if (modo === 'V')       recV([], []);
    else if (modo === 'VR') recVR([]);
    else if (modo === 'C')  recC([], 0);
    else if (modo === 'CR') recCR([], 0);
    else { m = n; recV([], []); }

    return { lista: out, truncada: truncada, total: total };
  }

  /* Permutaciones distintas de una multiconjunto de letras (anagramas) */
  function anagramas(chars, tope) {
    tope = tope || 300;
    var out = [], truncada = false;
    var cuenta = {};
    chars.forEach(function (c) { cuenta[c] = (cuenta[c] || 0) + 1; });
    var claves = Object.keys(cuenta).sort();
    var n = chars.length;
    function rec(actual) {
      if (out.length >= tope) { truncada = true; return false; }
      if (actual.length === n) { out.push(actual.join('')); return true; }
      for (var i = 0; i < claves.length; i++) {
        var c = claves[i];
        if (cuenta[c] === 0) continue;
        cuenta[c]--; actual.push(c);
        var ok = rec(actual);
        actual.pop(); cuenta[c]++;
        if (!ok) return false;
      }
      return true;
    }
    rec([]);
    return { lista: out, truncada: truncada };
  }

  /* Recuento de multiplicidades de una palabra: {C:1, A:2, S:1} */
  function multiplicidades(chars) {
    var m = {};
    chars.forEach(function (c) { m[c] = (m[c] || 0) + 1; });
    return m;
  }

  /* ------------------------------------------------------------------
     4-bis · capa de interfaz compartida por los módulos A y B
     ------------------------------------------------------------------ */

  var COL = {
    azul: '#1976d2', azulOsc: '#0d47a1', rojo: '#c62828', verde: '#2e7d32',
    naranja: '#e07b00', morado: '#6a3d9a', teal: '#00695c',
    eje: '#455a64', guia: '#cfd8dc', texto: '#263238', gris: '#78909c'
  };

  /* Estilos de composición SVG, inyectados una sola vez. */
  (function injectCss() {
    if (typeof document === 'undefined' || !document.head) return;
    if (document.getElementById('est3-svg-css')) return;
    var css =
      '.applet .ap-fig{margin:.5rem 0}' +
      '.applet .ap-fig svg{display:block;width:100%;max-width:100%;height:auto;background:#fff;' +
        'border:1px solid #d9e0e4;border-radius:6px}' +
      '.applet .ap-figcap{font-size:.82rem;color:#546e7a;margin:.25rem 0 0;line-height:1.4}' +
      '.applet .ap-legend{list-style:none;padding:0;margin:.4rem 0 0;display:flex;' +
        'flex-wrap:wrap;gap:.35rem 1rem}' +
      '.applet .ap-legend li{display:flex;align-items:center;gap:.35rem;font-size:.84rem;color:#37474f}' +
      '.applet .ap-sw{width:.85rem;height:.85rem;border-radius:3px;display:inline-block}';
    var st = document.createElement('style');
    st.id = 'est3-svg-css';
    st.textContent = css;
    document.head.appendChild(st);
  })();

  /* Las figuras se dibujan grandes y con tipografía generosa: el SVG se
     escala al 100 % del ancho disponible, así que un lienzo amplio con
     textos de 14-20 px se lee cómodamente también proyectado en clase. */
  function svgWrap(body, W, H, label, cap) {
    return '<div class="ap-fig"><svg role="img" aria-label="' + esc(label) +
      '" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">' +
      '<title>' + esc(label) + '</title>' + body + '</svg>' +
      (cap ? '<p class="ap-figcap">' + cap + '</p>' : '') + '</div>';
  }
  function txt(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.anchor || 'middle') +
      '" font-size="' + (o.size || 15) + '" font-weight="' + (o.weight || 'normal') +
      '" fill="' + (o.fill || COL.texto) + '"' +
      (o.family ? ' font-family="' + o.family + '"' : '') + '>' + s + '</text>';
  }
  function line(x1, y1, x2, y2, col, w, dash) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
      '" stroke="' + (col || COL.eje) + '" stroke-width="' + (w || 1.4) +
      (dash ? '" stroke-dasharray="' + dash : '') + '" stroke-linecap="round"/>';
  }
  function rect(x, y, w, h, fill, stroke, o) {
    o = o || {};
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" rx="' + (o.r === undefined ? 6 : o.r) + '" fill="' + (fill || 'none') +
      '" stroke="' + (stroke || 'none') + '" stroke-width="' + (o.sw || 1.6) +
      (o.op !== undefined ? '" opacity="' + o.op : '') + '"/>';
  }
  function circle(cx, cy, r, fill, stroke, sw) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + (fill || COL.azul) +
      '" stroke="' + (stroke || '#fff') + '" stroke-width="' + (sw || 1.6) + '"/>';
  }
  function path(d, col, w, fill, dash) {
    return '<path d="' + d + '" fill="' + (fill || 'none') + '" stroke="' + (col || COL.eje) +
      '" stroke-width="' + (w || 1.6) + (dash ? '" stroke-dasharray="' + dash : '') +
      '" stroke-linejoin="round" stroke-linecap="round"/>';
  }
  function leyenda(items) {
    var h = '<ul class="ap-legend">';
    items.forEach(function (it) {
      h += '<li><span class="ap-sw" style="background:' + it[0] + '"></span>' + it[1] + '</li>';
    });
    return h + '</ul>';
  }

  /* Convierte $...$ y $$...$$ del texto plano en nodos data-tex.
     Debe aplicarse a TODO texto que se inserte con innerHTML: si no,
     los dólares aparecen crudos en pantalla. */
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

  /* Armazón estándar de applet: título, instrucciones, controles,
     botones de escenario y zona de salida que se recalcula sola.
     Los rótulos de los botones se ponen con textContent, así que nunca
     deben llevar $...$: se escriben en texto llano. */
  function shell(node, title, instr, fields, compute) {
    node.classList.add('applet');
    node.innerHTML =
      '<h4 class="mx-title">Applet · ' + esc(title) + '</h4>' +
      '<div class="mx-instr">' + texifica(instr) + '</div>' +
      '<div class="mx-inputs"></div>' +
      '<div class="ap-chips"></div>' +
      '<div class="mx-out ap-out"></div>';
    tex(node);
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
          if (p.title) b.title = p.title;
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
        el.type = 'range';
        el.min = f.min; el.max = f.max; el.step = f.step || 1; el.value = f.value;
        el.className = 'mx-in';
        var live = document.createElement('span');
        live.className = 'mx-mono';
        live.style.fontSize = '.85rem';
        live.style.fontWeight = '700';
        live.textContent = String(el.value).replace('.', ',');
        el.addEventListener('input', function () {
          live.textContent = String(el.value).replace('.', ',');
        });
        lab.appendChild(el); lab.appendChild(live);
      } else if (f.type === 'number') {
        el = document.createElement('input');
        el.type = 'number';
        if (f.min !== undefined) el.min = f.min;
        if (f.max !== undefined) el.max = f.max;
        el.step = f.step || 1; el.value = f.value;
        el.className = 'mx-in';
        lab.appendChild(el);
      } else if (f.type === 'check') {
        el = document.createElement('input');
        el.type = 'checkbox'; el.checked = !!f.value;
        el.style.width = 'auto'; el.style.minWidth = '0';
        el.className = 'mx-in';
        lab.appendChild(el);
      } else if (f.type === 'select') {
        el = document.createElement('select');
        el.className = 'mx-in';
        f.options.forEach(function (o) {
          var op = document.createElement('option');
          op.value = o.value !== undefined ? o.value : o;
          op.textContent = o.label !== undefined ? o.label : o;
          el.appendChild(op);
        });
        if (f.value !== undefined) el.value = f.value;
        lab.appendChild(el);
      } else if (f.type === 'text') {
        el = document.createElement('input');
        el.type = 'text'; el.value = f.value || '';
        el.className = 'mx-in';
        lab.appendChild(el);
      } else {
        el = document.createElement('textarea');
        el.rows = f.rows || 2; el.value = f.value || ''; el.spellcheck = false;
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
        out.innerHTML = texifica(compute(values(), ctl, out));
        tex(out);
      } catch (e) {
        out.innerHTML = '<div class="mx-bad ap-err">' + esc(e.message) + '</div>';
        window.EST3.log.push({ applet: title, error: e.message });
      }
    }
    run();
    return { run: run, ctl: ctl, out: out };
  }

  /* Ficha con el número grande del resultado */
  function resultado(valor, etiqueta) {
    return '<div class="ap-res"><span class="ap-res-num">' + valor + '</span>' +
           '<span class="ap-res-lab">' + etiqueta + '</span></div>';
  }

  /* Lista de agrupaciones en cajitas */
  function pintaTuplas(t, sep, clase) {
    sep = sep === undefined ? '' : sep;
    var h = '<div class="ap-tuplas">';
    t.lista.forEach(function (x) {
      var s = Array.isArray(x) ? x.join(sep) : x;
      h += '<span class="ap-tup ' + (clase || '') + '">' + esc(s) + '</span>';
    });
    h += '</div>';
    if (t.truncada) {
      h += '<div class="mx-info" style="font-size:.82rem">La lista se ha cortado en ' +
           t.lista.length + ' agrupaciones para que quepa en pantalla. ' +
           'El total sigue siendo <b>' + (t.total !== null ? bigTxt(t.total) : '—') + '</b>. ' +
           'Reduce $n$ o $m$ si quieres verlas todas.</div>';
    }
    return h;
  }

  /* ------------------------------------------------------------------
     5 · applets del núcleo
     ------------------------------------------------------------------ */

  /* Laboratorio: las cuatro fórmulas a la vez para unos n y m dados.
     Es el applet de referencia del tema: cambia n y m y observa cómo
     se ordenan siempre igual  VR ≥ V ≥ P·(caso m=n)  y  V = C · m!    */
  R.laboratorio = function (node) {
    node.classList.add('applet');
    node.innerHTML =
      '<h4 class="mx-title">Applet · Laboratorio de combinatoria</h4>' +
      '<div class="mx-instr">Escribe cuántos elementos hay disponibles (<span data-tex="n"></span>) ' +
      'y de cuántos en cuántos los agrupas (<span data-tex="m"></span>). ' +
      'El applet calcula de golpe las cuatro fórmulas y comprueba las relaciones entre ellas. ' +
      'Ejemplo para empezar: <b>n = 8</b> y <b>m = 3</b> (el podio de 8 atletas).</div>' +
      '<div class="mx-inputs">' +
        '<label class="mx-field"><span>n · elementos disponibles</span>' +
          '<input class="mx-in" type="number" min="0" max="200" step="1" value="8"></label>' +
        '<label class="mx-field"><span>m · tamaño del grupo</span>' +
          '<input class="mx-in" type="number" min="0" max="60" step="1" value="3"></label>' +
      '</div><div class="mx-out ap-out"></div>';
    tex(node);
    var ins = node.querySelectorAll('input'), out = node.querySelector('.mx-out');

    function run() {
      try {
        var n = entero(ins[0].value, 0, 200, 'n');
        var m = entero(ins[1].value, 0, 60, 'm');

        function celda(tit, texFormula, valor, nota) {
          var v;
          try { v = '<span class="ap-res-num">' + bigTxt(valor()) + '</span>'; }
          catch (e) { v = '<span class="ap-ko" style="font-size:.86rem">' + esc(e.message) + '</span>'; }
          return '<div class="ap-card"><div class="ap-card-tit">' + tit + '</div>' +
                 '<div style="text-align:center">' + K(texFormula) + '</div>' +
                 '<div class="ap-res" style="justify-content:center">' + v + '</div>' +
                 '<div class="mx-info" style="font-size:.8rem">' + nota + '</div></div>';
        }

        var h = '<div class="ap-lab2">' +
          celda('Variaciones sin repetición',
                'V_{' + n + ',' + m + '} = \\dfrac{' + n + '!}{(' + n + '-' + m + ')!}',
                function () { return V(n, m); },
                'Importa el orden y no se repite.') +
          celda('Variaciones con repetición',
                'VR_{' + n + ',' + m + '} = ' + n + '^{' + m + '}',
                function () { return VR(n, m); },
                'Importa el orden y sí se repite. Es la única que admite ' +
                '<span data-tex="m>n"></span>.') +
          celda('Permutaciones',
                'P_{' + n + '} = ' + n + '!',
                function () { return P(n); },
                'Todos los elementos, solo cambia el orden.') +
          celda('Combinaciones',
                'C_{' + n + ',' + m + '} = \\dbinom{' + n + '}{' + m + '}',
                function () { return C(n, m); },
                'No importa el orden y no se repite.') +
        '</div>';

        /* Comprobación de la relación V = C · m! */
        var comp = '';
        if (m <= n) {
          var vv = V(n, m), cc = C(n, m), pm = fact(m);
          var ok = (cc * pm) === vv;
          comp = '<div class="mx-info">Relación clave: ' +
            KD('V_{' + n + ',' + m + '} = C_{' + n + ',' + m + '}\\cdot P_{' + m + '} \\;\\Longrightarrow\\; ' +
               bigTex(vv) + ' = ' + bigTex(cc) + ' \\cdot ' + bigTex(pm)) +
            '<span class="ap-badge ' + (ok ? 'si">se cumple' : 'no">revisar') + '</span></div>';
        } else {
          comp = '<div class="mx-info">Con $m>n$ solo tiene sentido ' + K('VR_{n,m}') +
                 '. Las otras tres fórmulas piden ' + K('m \\le n') + '.</div>';
        }

        out.innerHTML = h + comp;
        tex(out);
      } catch (e) {
        out.innerHTML = '<div class="mx-bad ap-err">' + esc(e.message) + '</div>';
      }
    }
    ins[0].addEventListener('input', run);
    ins[1].addEventListener('input', run);
    run();
  };

  /* Diagnóstico técnico: para comprobar que todo ha cargado bien. */
  R.diagnostico = function (node) {
    node.classList.add('applet');
    var claves = Object.keys(R).sort();
    var filas = [
      ['KaTeX local', !!window.katex],
      ['Núcleo est3-applets.js', true],
      ['Módulo est3-applets-a.js', window.EST3 && window.EST3.extraA === true],
      ['Módulo est3-applets-b.js', window.EST3 && window.EST3.extraB === true],
      ['Aritmética BigInt', (function () { try { return fact(20) === 2432902008176640000n; } catch (e) { return false; } })()],
      ['C(49,6) exacto', (function () { try { return C(49, 6) === 13983816n; } catch (e) { return false; } })()]
    ];
    var h = '<h4 class="mx-title">Applet · Diagnóstico técnico</h4>' +
      '<div class="mx-instr">Comprueba que el tema ha cargado correctamente. Si alguna fila sale en rojo, revisa el orden de carga en <code>assets/_scripts.html</code>.</div>' +
      '<table class="ap-tbl ap-cmb"><thead><tr><th>Comprobación</th><th>Estado</th></tr></thead><tbody>';
    filas.forEach(function (f) {
      h += '<tr><th>' + esc(f[0]) + '</th><td><span class="ap-badge ' +
           (f[1] ? 'si">correcto' : 'no">falla') + '</span></td></tr>';
    });
    h += '</tbody></table>' +
      '<div class="ap-kvs"><span class="ap-kv">Applets registrados: <b>' + claves.length + '</b></span>' +
      '<span class="ap-kv">Errores registrados: <b>' + (window.EST3 ? window.EST3.log.length : '—') + '</b></span></div>' +
      '<div class="mx-info" style="font-size:.82rem">Claves: <code>' + esc(claves.join(', ')) + '</code></div>';
    node.innerHTML = h;
    tex(node);
  };

  /* Registrador provisional: si un módulo -a o -b no llega a cargarse,
     aparece un aviso claro en lugar de un applet fantasma. */
  var PENDIENTES = [
    /* módulo A */
    'arbol', 'multiplicacion', 'adicion', 'codigos',
    'factorial', 'simplifica', 'crecimiento',
    'nym', 'tresPreguntas', 'clasificador',
    'variaciones', 'variacionesRep', 'comparaVR', 'podio', 'quiniela', 'complementario',
    /* módulo B */
    'permutaciones', 'circulares', 'permutacionesRep', 'anagramas', 'bloques',
    'combinaciones', 'ordenNoOrden', 'dividirPorM', 'primitiva', 'dosCaminos', 'combinacionesRep',
    'pascal', 'propiedades', 'newton',
    'esquema', 'resumenTabla', 'errores',
    'entrenador'
  ];
  PENDIENTES.forEach(function (k) {
    R[k] = function (n) {
      n.classList.add('applet');
      n.innerHTML =
        '<h4 class="mx-title">Applet · ' + esc(k) + '</h4>' +
        '<div class="mx-bad ap-err">Este applet requiere <code>est3-applets-a.js</code> o ' +
        '<code>est3-applets-b.js</code>. Comprueba que ambos se cargan después de ' +
        '<code>est3-applets.js</code> en <code>_scripts.html</code>.</div>';
    };
  });

  /* ------------------------------------------------------------------
     6 · API pública, arranque y espera de los módulos
     ------------------------------------------------------------------ */
  window.EST3 = {
    registry: R,
    fact: fact, V: V, VR: VR, P: P, PC: PC, PR: PR, C: C, CR: CR,
    descendente: descendente,
    bigTxt: bigTxt, bigTex: bigTex, bigAprox: bigAprox, unoEntre: unoEntre,
    elementos: elementos, letras: letras, entero: entero,
    tuplas: tuplas, anagramas: anagramas, multiplicidades: multiplicidades,
    tex: tex, K: K, KD: KD, esc: esc, fmt: fmt, nc: nc, kf: kf,
    texifica: texifica, shell: shell, resultado: resultado, pintaTuplas: pintaTuplas,
    svgWrap: svgWrap, txt: txt, line: line, rect: rect, circle: circle,
    path: path, leyenda: leyenda, COL: COL,
    log: []
  };

  function boot() {
    document.querySelectorAll('[data-applet-est3]').forEach(function (n) {
      if (n.dataset.mounted) return;
      n.dataset.mounted = 1;
      var f = R[n.dataset.appletEst3];
      if (!f) {
        n.innerHTML = '<div class="mx-bad ap-err">Clave inexistente: ' + esc(n.dataset.appletEst3) + '</div>';
        return;
      }
      try { f(n); }
      catch (e) {
        n.innerHTML = '<div class="mx-bad ap-err">' + esc(e.message) + '</div>';
        window.EST3.log.push({ applet: n.dataset.appletEst3, error: e.message });
      }
    });
  }

  function startWhenReady() {
    var attempts = 0;
    (function wait() {
      var S = window.EST3;
      if (S && S.extraA === true && S.extraB === true) { boot(); return; }
      if (attempts++ >= 200) { boot(); return; }   /* ~2 s de margen */
      setTimeout(wait, 10);
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWhenReady);
  } else {
    startWhenReady();
  }
})();
