/* =====================================================================
   re-applets.js — NÚMEROS REALES · 1r Batx Mates CCSS
   Módulo 1: conjuntos numéricos, recta real, intervalos,
             notación científica, aproximaciones y errores.

   VERSIÓN 2 · correcciones respecto de la v1
     1) num()  devuelve el decimal en TEXTO PLANO ("2,667"), para usar
        en HTML y SVG. nt() sigue devolviendo sintaxis KaTeX ("2{,}667")
        y solo debe usarse DENTRO de T() o TD().
     2) plain() limpia cualquier resto de notación KaTeX en las
        etiquetas de las figuras SVG, donde KaTeX no interviene.
     3) lineSVG() reparte las etiquetas en varios niveles verticales
        para que nunca se solapen, y calcula la altura necesaria.
     4) El arranque espera a DOMContentLoaded, de modo que el módulo
        de ampliación ya esté cargado cuando se pinta el diagnóstico.

   INSERCIÓN EN EL .qmd
     <div data-applet-re="clave"></div>

   CLAVES DE ESTE MÓDULO
     clasifica · fraccion · periodico · rectareal · densidad
     intervalos · unionint · absoluto
     cientifica · opercientifica · magnitud
     aproxima · errores · cotas · significativas · diagnostico

   Publica su API en window.REAL para re-applets-extra.js.
   ===================================================================== */

(function () {
  'use strict';

  var RE = {};

  /* =================================================================
     0. KATEX Y PRESENTACIÓN
     ================================================================= */

  var KOPT = {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false }
    ],
    throwOnError: false,
    errorColor: '#e63946',
    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option']
  };
  function kt(node) {
    if (window.renderMathInElement) {
      try { window.renderMathInElement(node, KOPT); } catch (e) { }
    }
  }
  function T(t) { return '$' + t + '$'; }
  function TD(t) { return '$$' + t + '$$'; }

  function head(title, bullets) {
    return '<div class="ap-head"><h4 class="ap-title">' + title + '</h4><ul class="ap-help">' +
      bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul></div>';
  }
  function errBox(m) { return '<div class="ap-err">Aviso: ' + m + '</div>'; }
  function step(h) { return '<div class="ap-step">' + h + '</div>'; }
  function warnStep(h) { return '<div class="ap-step ap-warn">' + h + '</div>'; }
  function key(t) { return '<span class="ap-key">' + t + '</span>'; }
  function ok(t) { return '<span class="ap-ok">' + t + '</span>'; }
  function bad(t) { return '<span class="ap-bad">' + t + '</span>'; }
  function note(t) { return '<span class="ap-note">' + t + '</span>'; }
  function chip(t, b) { return '<span class="ap-chip' + (b ? ' ap-chip-bad' : '') + '">' + t + '</span>'; }

  /* =================================================================
     1. ARITMÉTICA Y FORMATO NUMÉRICO
     ================================================================= */

  function nz(x) { return Math.abs(x) < 1e-12 ? 0 : x; }

  /* Formato KaTeX: la coma va entre llaves. SOLO dentro de T() o TD(). */
  function nt(x, d) {
    if (x === null || x === undefined || !isFinite(x)) return '\\text{no definido}';
    var k = (d === undefined ? 6 : d);
    var r = Math.round(nz(x) * Math.pow(10, k)) / Math.pow(10, k);
    return Number.isInteger(r) ? String(r) : String(r).replace('.', '{,}');
  }

  /* Decimal en texto plano, con signo menos tipográfico. */
  function num(x, d) {
    if (x === null || x === undefined || !isFinite(x)) return 'no definido';
    return nt(x, d).replace(/\{,\}/g, ',').replace(/^-/, '\u2212');
  }

  /* Elimina cualquier resto de notación KaTeX de una cadena. */
  function plain(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/\{,\}/g, ',')
      .replace(/\\overline\{([^}]*)\}/g, '$1')
      .replace(/\\text\{([^}]*)\}/g, '$1')
      .replace(/\\sqrt/g, '\u221A')
      .replace(/\\pi/g, '\u03C0')
      .replace(/\\infty/g, '\u221E')
      .replace(/[{}$\\]/g, '');
  }

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a; }
  function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }

  function reduce(n, d) {
    if (d === 0) throw new Error('el denominador no puede ser cero.');
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d) || 1;
    return [n / g, d / g];
  }
  function fracTex(n, d) {
    var r = reduce(n, d);
    if (r[1] === 1) return String(r[0]);
    return (r[0] < 0 ? '-' : '') + '\\dfrac{' + Math.abs(r[0]) + '}{' + r[1] + '}';
  }

  function factorize(n) {
    n = Math.abs(n);
    var f = {};
    for (var p = 2; p * p <= n; p++) { while (n % p === 0) { f[p] = (f[p] || 0) + 1; n /= p; } }
    if (n > 1) f[n] = (f[n] || 0) + 1;
    return f;
  }
  function factorTex(n) {
    if (n === 0) return '0';
    if (Math.abs(n) === 1) return String(n);
    var f = factorize(n), parts = [];
    Object.keys(f).map(Number).sort(function (a, b) { return a - b; }).forEach(function (p) {
      parts.push(f[p] === 1 ? String(p) : p + '^{' + f[p] + '}');
    });
    return (n < 0 ? '-' : '') + parts.join('\\cdot ');
  }

  function decimalType(n, d) {
    var r = reduce(n, d), den = r[1], f = factorize(den);
    var solo25 = Object.keys(f).every(function (p) { return p === '2' || p === '5'; });
    if (den === 1) return 'entero';
    return solo25 ? 'decimal exacto' : 'decimal periódico';
  }

  function decimalString(n, d, maxLen) {
    maxLen = maxLen || 24;
    var r = reduce(n, d), sgn = r[0] < 0 ? '-' : '', N = Math.abs(r[0]), D = r[1];
    var ent = Math.floor(N / D), rest = N % D, out = String(ent), seen = {}, digits = [], idx = 0, start = -1;
    while (rest !== 0 && idx < maxLen) {
      if (seen[rest] !== undefined) { start = seen[rest]; break; }
      seen[rest] = idx;
      rest *= 10;
      digits.push(Math.floor(rest / D));
      rest = rest % D;
      idx++;
    }
    if (!digits.length) return { tex: sgn + out, tipo: 'entero' };
    if (start >= 0) {
      var pre = digits.slice(0, start).join(''), per = digits.slice(start).join('');
      return {
        tex: sgn + out + '{,}' + pre + '\\overline{' + per + '}',
        tipo: 'periódico', pre: pre, per: per
      };
    }
    return { tex: sgn + out + '{,}' + digits.join(''), tipo: 'exacto' };
  }

  function periodicToFrac(ent, pre, per) {
    var a = String(ent).replace('-', ''), sgn = String(ent).trim()[0] === '-' ? -1 : 1;
    pre = String(pre || ''); per = String(per || '');
    var todo = a + pre + per, sinPer = a + pre;
    var n2 = parseInt(todo || '0', 10) - parseInt(sinPer || '0', 10);
    var den = parseInt('9'.repeat(per.length) + '0'.repeat(pre.length), 10);
    if (den === 0) { n2 = parseInt(a + pre, 10); den = Math.pow(10, pre.length); }
    return reduce(sgn * n2, den);
  }

  function sumOfSquares(n) {
    var out = [], rest = n;
    while (rest > 0) {
      var k = Math.floor(Math.sqrt(rest));
      if (k < 1) break;
      out.push(k);
      rest -= k * k;
    }
    return out;
  }

  function toSci(str) {
    var s = String(str).replace(/\s/g, '').replace(',', '.');
    var v = parseFloat(s);
    if (!isFinite(v)) throw new Error('escribe un número válido, por ejemplo <code>0,00000154</code>.');
    if (v === 0) return { m: 0, e: 0, val: 0 };
    var e = Math.floor(Math.log10(Math.abs(v)));
    var m = v / Math.pow(10, e);
    if (Math.abs(m) >= 10) { m /= 10; e++; }
    if (Math.abs(m) < 1) { m *= 10; e--; }
    return { m: m, e: e, val: v };
  }
  function sciTex(m, e, d) { return nt(m, d === undefined ? 6 : d) + '\\cdot 10^{' + e + '}'; }

  /* =================================================================
     2. FIGURAS
     ================================================================= */

  /* Recta real. Las etiquetas se reparten en niveles para no solaparse:
     los puntos se rotulan por encima del eje y las marcas por debajo. */
  function lineSVG(opts) {
    var W = 520, pad = 40, lo = opts.lo, hi = opts.hi;
    if (!(hi > lo)) { hi = lo + 1; }
    function sx(v) { return pad + (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * (W - 2 * pad); }

    /* --- niveles de las etiquetas de los puntos --- */
    var pts = (opts.points || []).map(function (p) {
      var o = { v: p.v, lbl: p.lbl, color: p.color, open: p.open };
      o.txt = o.lbl === undefined || o.lbl === null ? '' : plain(o.lbl);
      o.x = sx(o.v);
      o.w = o.txt ? o.txt.length * 6.6 + 10 : 0;
      o.lvl = 0;
      return o;
    });
    var sorted = pts.slice().sort(function (a, b) { return a.x - b.x; });
    var placed = [];
    sorted.forEach(function (p) {
      if (!p.txt) return;
      var lvl = 0, clash = true, guard = 0;
      while (clash && guard < 12) {
        clash = false; guard++;
        for (var i = 0; i < placed.length; i++) {
          var q = placed[i];
          if (q.lvl === lvl && Math.abs(q.x - p.x) < (q.w + p.w) / 2) { clash = true; lvl++; break; }
        }
      }
      p.lvl = lvl;
      placed.push(p);
    });
    var maxLvl = 0;
    pts.forEach(function (p) { if (p.txt && p.lvl > maxLvl) maxLvl = p.lvl; });

    /* --- niveles de las etiquetas de las marcas --- */
    var tks = (opts.ticks || []).map(function (t) {
      var o = { v: t.v };
      o.txt = plain(t.lbl !== undefined && t.lbl !== null ? t.lbl : num(t.v, 6));
      o.x = sx(o.v);
      o.w = o.txt.length * 6.4 + 8;
      o.lvl = 0;
      return o;
    });
    var tsorted = tks.slice().sort(function (a, b) { return a.x - b.x; });
    var tplaced = [];
    tsorted.forEach(function (t) {
      var lvl = 0, clash = true, guard = 0;
      while (clash && guard < 12) {
        clash = false; guard++;
        for (var i = 0; i < tplaced.length; i++) {
          var q = tplaced[i];
          if (q.lvl === lvl && Math.abs(q.x - t.x) < (q.w + t.w) / 2) { clash = true; lvl++; break; }
        }
      }
      t.lvl = lvl;
      tplaced.push(t);
    });
    var maxT = 0;
    tks.forEach(function (t) { if (t.lvl > maxT) maxT = t.lvl; });

    var y = 26 + maxLvl * 17;
    var H = y + 26 + (maxT + 1) * 16;

    var g = '';
    g += '<line x1="' + pad + '" y1="' + y + '" x2="' + (W - pad) + '" y2="' + y +
      '" stroke="#94a3b8" stroke-width="2"/>';
    g += '<polygon points="' + (W - pad) + ',' + y + ' ' + (W - pad - 9) + ',' + (y - 5) + ' ' +
      (W - pad - 9) + ',' + (y + 5) + '" fill="#94a3b8"/>';

    (opts.segments || []).forEach(function (s) {
      g += '<line x1="' + sx(s.a).toFixed(1) + '" y1="' + y + '" x2="' + sx(s.b).toFixed(1) +
        '" y2="' + y + '" stroke="' + (s.color || '#2a9d8f') + '" stroke-width="9" opacity="0.8"/>';
    });

    tks.forEach(function (t) {
      var ty = y + 20 + t.lvl * 16;
      g += '<line x1="' + t.x.toFixed(1) + '" y1="' + (y - 6) + '" x2="' + t.x.toFixed(1) +
        '" y2="' + (y + 6) + '" stroke="#64748b"/>';
      if (t.lvl > 0) {
        g += '<line x1="' + t.x.toFixed(1) + '" y1="' + (y + 6) + '" x2="' + t.x.toFixed(1) +
          '" y2="' + (ty - 9) + '" stroke="#cbd5e1" stroke-dasharray="2 3"/>';
      }
      g += '<text x="' + t.x.toFixed(1) + '" y="' + ty + '" font-size="11.5" text-anchor="middle" fill="#475569">' +
        t.txt + '</text>';
    });

    pts.forEach(function (p) {
      g += '<circle cx="' + p.x.toFixed(1) + '" cy="' + y + '" r="6" fill="' +
        (p.open ? '#ffffff' : (p.color || '#e63946')) + '" stroke="' + (p.color || '#e63946') +
        '" stroke-width="2.5"/>';
      if (p.txt) {
        var ly = y - 14 - p.lvl * 17;
        if (p.lvl > 0) {
          g += '<line x1="' + p.x.toFixed(1) + '" y1="' + (y - 9) + '" x2="' + p.x.toFixed(1) +
            '" y2="' + (ly + 4) + '" stroke="#cbd5e1" stroke-dasharray="2 3"/>';
        }
        g += '<text x="' + p.x.toFixed(1) + '" y="' + ly + '" font-size="12" text-anchor="middle" fill="#334155">' +
          p.txt + '</text>';
      }
    });

    return '<svg class="ap-fig" viewBox="0 0 ' + W + ' ' + H.toFixed(0) +
      '" role="img" aria-label="recta real">' + g + '</svg>';
  }

  /* Cadena de triángulos rectángulos para construir la raíz de n. */
  function pitagorasSVG(n) {
    var sq = sumOfSquares(n);
    if (!sq.length) return '';
    var W = 520, H = 300, ox = 40, oy = 240, u = Math.min(34, (W - 100) / Math.max(4, sq[0] + 2));
    var g = '';
    g += '<line x1="20" y1="' + oy + '" x2="' + (W - 20) + '" y2="' + oy + '" stroke="#28a745" stroke-width="2.5"/>';

    var a = sq[0], b = sq.length > 1 ? sq[1] : 0;
    g += '<line x1="' + ox + '" y1="' + oy + '" x2="' + (ox + a * u) + '" y2="' + oy +
      '" stroke="#1f9ad6" stroke-width="3"/>';
    if (b) {
      g += '<line x1="' + (ox + a * u) + '" y1="' + oy + '" x2="' + (ox + a * u) + '" y2="' + (oy - b * u) +
        '" stroke="#1f9ad6" stroke-width="3"/>';
      g += '<line x1="' + ox + '" y1="' + oy + '" x2="' + (ox + a * u) + '" y2="' + (oy - b * u) +
        '" stroke="#1a1a1a" stroke-width="2.5"/>';
    }
    var vx = a, vy = b, acc = a * a + b * b;
    for (var i = 2; i < sq.length; i++) {
      var L = Math.sqrt(acc), c = sq[i];
      var ux = -vy / L, uy = vx / L;
      var nx = vx + ux * c, ny = vy + uy * c;
      g += '<line x1="' + (ox + vx * u).toFixed(1) + '" y1="' + (oy - vy * u).toFixed(1) +
        '" x2="' + (ox + nx * u).toFixed(1) + '" y2="' + (oy - ny * u).toFixed(1) +
        '" stroke="#1f9ad6" stroke-width="3"/>';
      g += '<line x1="' + ox + '" y1="' + oy + '" x2="' + (ox + nx * u).toFixed(1) +
        '" y2="' + (oy - ny * u).toFixed(1) + '" stroke="#1a1a1a" stroke-width="2.5"/>';
      vx = nx; vy = ny; acc += c * c;
    }
    var R = Math.sqrt(acc) * u;
    g += '<path d="M ' + (ox + R).toFixed(1) + ' ' + oy + ' A ' + R.toFixed(1) + ' ' + R.toFixed(1) +
      ' 0 0 0 ' + (ox + vx * u).toFixed(1) + ' ' + (oy - vy * u).toFixed(1) +
      '" fill="none" stroke="#e03131" stroke-width="1.8" stroke-dasharray="5 4"/>';
    g += '<circle cx="' + (ox + R).toFixed(1) + '" cy="' + oy + '" r="6" fill="#e03131"/>';
    g += '<text x="' + (ox + R).toFixed(1) + '" y="' + (oy + 22) +
      '" font-size="12.5" text-anchor="middle" fill="#334155">\u221A' + n + '</text>';
    g += '<circle cx="' + ox + '" cy="' + oy + '" r="4" fill="#28a745"/>' +
      '<text x="' + ox + '" y="' + (oy + 22) + '" font-size="12" text-anchor="middle" fill="#475569">0</text>';
    return '<svg class="ap-fig" viewBox="0 0 ' + W + ' ' + H +
      '" role="img" aria-label="construcci\u00f3n de la ra\u00edz">' + g + '</svg>';
  }

  /* =================================================================
     3. INTERFAZ
     ================================================================= */

  function rowText(role, label, value) {
    return '<div class="ap-row"><label class="ap-lab">' + label + '</label>' +
      '<input class="ap-in" type="text" data-role="' + role + '" value="' + value + '"></div>';
  }
  function mini(role, label, value, stp) {
    return '<label class="ap-lab">' + label + '</label>' +
      '<input class="ap-in ap-mini" type="number" data-role="' + role + '" value="' + value +
      '" step="' + (stp || 1) + '">';
  }
  function sel(role, label, opts, value) {
    return '<label class="ap-lab">' + label + '</label><select class="ap-sel" data-role="' + role + '">' +
      opts.map(function (o) {
        return '<option value="' + o[0] + '"' + (String(o[0]) === String(value) ? ' selected' : '') +
          '>' + o[1] + '</option>';
      }).join('') + '</select>';
  }
  function get(r, k) { return r.querySelector('[data-role="' + k + '"]'); }
  function val(r, k) { return get(r, k).value; }
  function nv(r, k) { return parseFloat(get(r, k).value); }
  function iv(r, k) { return parseInt(get(r, k).value, 10); }

  function live(root, out, fn) {
    function run() {
      try { out.innerHTML = fn(); }
      catch (e) { out.innerHTML = errBox(e && e.message ? e.message : String(e)); }
      kt(out);
    }
    Array.prototype.forEach.call(root.querySelectorAll('input,select'), function (el) {
      el.addEventListener('input', run); el.addEventListener('change', run);
    });
    run();
  }
  function shell(root, title, bullets, controls) {
    root.classList.add('applet');
    root.innerHTML = head(title, bullets) + controls + '<div class="ap-out" data-role="out"></div>';
    kt(root);
    return get(root, 'out');
  }

  /* =================================================================
     4. APPLETS · CONJUNTOS NUMÉRICOS
     ================================================================= */

  RE.clasifica = function (root) {
    var out = shell(root, 'Applet \u00b7 Clasificador de n\u00fameros', [
      'Escribe un n\u00famero y el applet decide el conjunto num\u00e9rico <b>m\u00e1s peque\u00f1o</b> al que pertenece.',
      'Formatos admitidos: entero <code>-2</code>; fracci\u00f3n <code>8/3</code>; ra\u00edz <code>sqrt(16)</code> o <code>sqrt(7)</code>; decimal <code>0,432</code>; constantes <code>pi</code> y <code>e</code>.',
      'Prueba la bater\u00eda del libro: <code>4</code>, <code>-2</code>, <code>0</code>, <code>15/5</code>, <code>8/3</code>, <code>sqrt(16)</code>, <code>sqrt(7)</code>, <code>pi</code>.',
      'Recuerda la cadena de inclusiones: los naturales est\u00e1n en los enteros, los enteros en los racionales, y los racionales junto con los irracionales forman los reales.'
    ], rowText('x', 'n\u00famero', '8/3'));

    live(root, out, function () {
      var s = val(root, 'x').trim().replace(/\s/g, '');
      var h = '', tipo = '', valor = null, exacto = '';

      var mf = /^(-?\d+)\/(-?\d+)$/.exec(s);
      var mr = /^sqrt\((-?\d+(?:\/\d+)?)\)$/.exec(s);

      if (s === 'pi' || s === 'e') {
        valor = s === 'pi' ? Math.PI : Math.E;
        tipo = 'irracional'; exacto = s === 'pi' ? '\\pi' : 'e';
        h += step('Es una de las constantes irracionales m\u00e1s importantes. Su expresi\u00f3n decimal tiene infinitas cifras no peri\u00f3dicas.');
      } else if (mf) {
        var n = parseInt(mf[1], 10), d = parseInt(mf[2], 10);
        var r = reduce(n, d);
        valor = r[0] / r[1]; exacto = fracTex(n, d);
        var dec = decimalString(n, d);
        tipo = r[1] === 1 ? (r[0] >= 0 ? 'natural o cero' : 'entero') : 'racional';
        h += step('Representante can\u00f3nico: ' + T(exacto) + ' ' + note('(fracci\u00f3n irreducible con denominador positivo)'));
        h += step('Expresi\u00f3n decimal: ' + T(dec.tex) + ' \u00b7 ' + key(decimalType(n, d)));
        h += step('Descomposici\u00f3n del denominador: ' + T(factorTex(r[1])) +
          '. ' + note('Si solo contiene factores 2 y 5, el decimal es exacto; en otro caso, peri\u00f3dico.'));
      } else if (mr) {
        var inner = mr[1], rv;
        if (inner.indexOf('/') >= 0) {
          var pq = inner.split('/'); rv = parseInt(pq[0], 10) / parseInt(pq[1], 10);
        } else rv = parseInt(inner, 10);
        if (rv < 0) throw new Error('no existe la ra\u00edz cuadrada de un n\u00famero negativo en los reales.');
        valor = Math.sqrt(rv); exacto = '\\sqrt{' + inner + '}';
        var perfect = Number.isInteger(valor);
        tipo = perfect ? 'entero' : 'irracional';
        h += step(perfect
          ? 'El radicando es un cuadrado perfecto, luego la ra\u00edz es ' + key('exacta') + ': ' + T(exacto + '=' + valor)
          : 'El radicando ' + key('no') + ' es un cuadrado perfecto, luego la ra\u00edz es ' + key('irracional') + '.');
        if (!perfect) {
          h += step(note('Regla general: si $n$ es natural y no es cuadrado perfecto, entonces $\\sqrt{n}$ es irracional.'));
        }
      } else {
        var v = parseFloat(s.replace(',', '.'));
        if (!isFinite(v)) throw new Error('no reconozco ese formato. Usa por ejemplo <code>8/3</code>, <code>sqrt(7)</code> o <code>0,432</code>.');
        valor = v; exacto = nt(v);
        tipo = Number.isInteger(v) ? (v >= 0 ? 'natural o cero' : 'entero') : 'racional';
        h += step('Como es un decimal ' + key('finito') + ' escrito, se puede expresar como fracci\u00f3n, luego es racional.');
        h += step(note('Cuidado: un decimal con infinitas cifras no peri\u00f3dicas, como 0,1234567891011..., es irracional aunque se escriba con una regla de formaci\u00f3n.'));
      }

      var badge = tipo === 'irracional' ? bad(tipo) : ok(tipo);
      h = step(key('N\u00famero: ') + T(exacto) + ' \u00b7 valor aproximado ' + T(nt(valor, 6))) +
          step(key('Conjunto m\u00e1s peque\u00f1o: ') + badge) + h;
      h += step('Cadena de inclusiones: ' + T('\\mathbb{N}\\subset\\mathbb{Z}\\subset\\mathbb{Q}\\subset\\mathbb{R}') +
        ', y los irracionales son ' + T('\\mathbb{I}=\\mathbb{R}-\\mathbb{Q}') + '.');
      h += lineSVG({
        lo: Math.min(-1, valor - 2), hi: Math.max(1, valor + 2),
        ticks: [{ v: 0, lbl: '0' }],
        points: [{ v: valor, lbl: num(valor, 3) }]
      });
      return h;
    });
  };

  RE.fraccion = function (root) {
    var out = shell(root, 'Applet \u00b7 Fracci\u00f3n y decimal', [
      'Toda fracci\u00f3n de enteros da un entero, un decimal exacto o un decimal peri\u00f3dico. Nunca otra cosa: eso es lo que caracteriza a los racionales.',
      'El applet reduce la fracci\u00f3n, descompone el denominador y predice el tipo de decimal antes de dividir.',
      'Ejemplos para comparar: <code>3/4</code> exacto; <code>1/3</code> peri\u00f3dico puro; <code>7/6</code> peri\u00f3dico mixto; <code>15/5</code> entero.',
      'Busca t\u00fa la regla: mira qu\u00e9 factores primos tiene el denominador reducido en cada caso.'
    ], '<div class="ap-row">' + mini('n', 'numerador', 7) + mini('d', 'denominador', 6) + '</div>');

    live(root, out, function () {
      var n = iv(root, 'n'), d = iv(root, 'd');
      if (!isFinite(n) || !isFinite(d)) throw new Error('escribe dos n\u00fameros enteros.');
      var r = reduce(n, d), dec = decimalString(n, d);
      var h = step('Fracci\u00f3n dada: ' + T(fracTex(n, d)) + (Math.abs(gcd(n, d)) !== 1
        ? ' \u00b7 ' + note('se ha simplificado dividiendo entre ' + Math.abs(gcd(n, d))) : ''));
      h += step(key('Representante can\u00f3nico: ') + T(fracTex(r[0], r[1])));
      h += step('Denominador reducido: ' + T(r[1] + '=' + factorTex(r[1])));
      h += step(key('Predicci\u00f3n: ') + (r[1] === 1
        ? 'es un ' + ok('entero')
        : (decimalType(n, d) === 'decimal exacto'
          ? ok('decimal exacto') + ', porque el denominador solo tiene factores 2 y 5'
          : ok('decimal peri\u00f3dico') + ', porque el denominador tiene alg\u00fan factor distinto de 2 y de 5')));
      h += step(key('Expresi\u00f3n decimal: ') + T(dec.tex));
      if (dec.tipo === 'peri\u00f3dico') {
        h += step('Anteperiodo: ' + T(dec.pre || '\\text{ninguno}') + ' \u00b7 periodo: ' +
          T('\\overline{' + dec.per + '}') + ' de longitud ' + dec.per.length + '.');
      }
      h += step(note('Fracciones equivalentes representan el mismo n\u00famero racional. El representante can\u00f3nico es la irreducible con denominador positivo.'));
      return h;
    });
  };

  RE.periodico = function (root) {
    var out = shell(root, 'Applet \u00b7 Decimal peri\u00f3dico a fracci\u00f3n', [
      'Todo decimal peri\u00f3dico es racional. El applet aplica la regla cl\u00e1sica y muestra el razonamiento paso a paso.',
      'Introduce las tres piezas: parte entera, anteperiodo (las cifras que no se repiten) y periodo (las que se repiten).',
      'Ejemplos: $2{,}\\overline{4}$ con entera 2, anteperiodo vac\u00edo y periodo 4; $6{,}1\\overline{3}$ con anteperiodo 1 y periodo 3; $10{,}\\overline{3}$.',
      'Comprueba el resultado con el applet de fracci\u00f3n y decimal: debe devolverte el mismo n\u00famero.'
    ], '<div class="ap-row">' + mini('e', 'parte entera', 6) + '</div>' +
       rowText('pre', 'anteperiodo', '1') + rowText('per', 'periodo', '3'));

    live(root, out, function () {
      var e = val(root, 'e'), pre = val(root, 'pre').replace(/\D/g, ''), per = val(root, 'per').replace(/\D/g, '');
      if (!per) throw new Error('escribe al menos una cifra en el periodo.');
      var fr = periodicToFrac(e, pre, per);
      var todo = e + pre + per, sinPer = e + pre;
      var h = step('N\u00famero: ' + T(e + '{,}' + pre + '\\overline{' + per + '}'));
      h += step(key('Regla: ') + 'en el numerador, el n\u00famero completo sin coma menos el n\u00famero sin el periodo. En el denominador, tantos nueves como cifras tenga el periodo seguidos de tantos ceros como tenga el anteperiodo.');
      h += step(T('\\dfrac{' + todo + '-' + sinPer + '}{' +
        ('9'.repeat(per.length) + '0'.repeat(pre.length)) + '}=' + fracTex(fr[0], fr[1])));
      h += step(key('Comprobaci\u00f3n: ') + T(fracTex(fr[0], fr[1]) + '=' + decimalString(fr[0], fr[1]).tex));
      h += step(note('Que exista esta regla demuestra algo importante: los decimales peri\u00f3dicos no son n\u00fameros nuevos, son racionales disfrazados.'));
      return h;
    });
  };

  RE.rectareal = function (root) {
    var out = shell(root, 'Applet \u00b7 Construcci\u00f3n de la ra\u00edz con Pit\u00e1goras', [
      'Para situar $\\sqrt{n}$ en la recta real con exactitud se descompone $n$ como suma de cuadrados perfectos y se encadenan tri\u00e1ngulos rect\u00e1ngulos.',
      'Ejemplo del libro: $12=3^{2}+1^{2}+1^{2}+1^{2}$, as\u00ed que se construyen tres tri\u00e1ngulos y con el comp\u00e1s se lleva la \u00faltima hipotenusa a la recta.',
      'Prueba con 2, 5, 10, 12, 13 y 101. Todo entero es suma de, como m\u00e1ximo, cuatro cuadrados.',
      'Para trabajar la construcci\u00f3n paso a paso, con animaci\u00f3n y preguntas guiadas, usa la herramienta completa enlazada en la p\u00e1gina.'
    ], '<div class="ap-row">' + mini('n', 'radicando n', 12) + '</div>');

    live(root, out, function () {
      var n = iv(root, 'n');
      if (!(n > 0) || n > 400) throw new Error('elige un entero entre 1 y 400 para que la figura sea legible.');
      var sq = sumOfSquares(n);
      var h = step(key('Descomposici\u00f3n: ') + T(n + '=' + sq.map(function (k) { return k + '^{2}'; }).join('+')));
      h += step('Con esos ' + key(sq.length + ' catetos') + ' se forman ' + key(Math.max(1, sq.length - 1)) +
        ' tri\u00e1ngulo' + (sq.length - 1 === 1 ? '' : 's') + ' rect\u00e1ngulo' + (sq.length - 1 === 1 ? '' : 's') +
        ' encadenados: cada hipotenusa pasa a ser cateto del siguiente.');
      var acc = 0, lines = '';
      sq.forEach(function (k, i) {
        acc += k * k;
        if (i > 0) lines += step('Tri\u00e1ngulo ' + i + ': hipotenusa ' + T('\\sqrt{' + acc + '}') +
          ' \u00b7 valor aproximado ' + T(nt(Math.sqrt(acc), 4)));
      });
      h += lines;
      h += step(key('\u00daltimo paso: ') + 'con el comp\u00e1s centrado en el ' + T('0') +
        ' y radio la \u00faltima hipotenusa, se traza un arco. Donde corta la recta est\u00e1 ' +
        T('\\sqrt{' + n + '}\\approx ' + nt(Math.sqrt(n), 5)) + '.');
      h += step('Est\u00e1 entre los enteros ' + chip(String(Math.floor(Math.sqrt(n)))) + ' y ' +
        chip(String(Math.ceil(Math.sqrt(n)))) + ' ' + note('(comparando con los cuadrados perfectos vecinos)'));
      h += pitagorasSVG(n);
      h += step(note('Verde, la recta real. Azul, los catetos nuevos. Negro, las hipotenusas. Rojo, el arco y el punto buscado.'));
      return h;
    });
  };

  RE.densidad = function (root) {
    var out = shell(root, 'Applet \u00b7 Densidad de los n\u00fameros', [
      'Entre dos n\u00fameros reales distintos siempre hay infinitos n\u00fameros reales. La media es el ejemplo m\u00e1s r\u00e1pido: si $a<b$, entonces $a<\\dfrac{a+b}{2}<b$.',
      'Y como el proceso se puede repetir indefinidamente, nunca se agotan. Lo curioso es que tambi\u00e9n los racionales y los irracionales son densos.',
      'Prueba con 2 y 2,5; con 1,41 y 1,42; con 3,14 y $\\pi$.',
      'Reto: encuentra un irracional entre $-\\sqrt{2}$ y $\\sqrt{2}$ sin usar decimales.'
    ], '<div class="ap-row">' + mini('a', 'a', 2, 0.01) + mini('b', 'b', 2.5, 0.01) +
       mini('k', 'pasos', 4) + '</div>');

    live(root, out, function () {
      var a = nv(root, 'a'), b = nv(root, 'b'), k = Math.max(1, Math.min(8, iv(root, 'k')));
      if (!(a < b)) throw new Error('hace falta que $a$ sea menor que $b$.');
      var h = step('Intervalo de partida: ' + T('\\left(' + nt(a) + ',\\ ' + nt(b) + '\\right)'));
      var lo = a, hi = b, pts = [], i;
      for (i = 0; i < k; i++) {
        var m = (lo + hi) / 2;
        pts.push(m);
        h += step('Paso ' + (i + 1) + ': ' + T('\\dfrac{' + nt(lo, 6) + '+' + nt(hi, 6) + '}{2}=' + nt(m, 8)) +
          ' ' + note('sigue estando entre los dos'));
        hi = m;
      }
      h += step(key('Conclusi\u00f3n: ') + 'el proceso no termina nunca, luego entre dos reales cualesquiera hay ' +
        ok('infinitos') + ' n\u00fameros reales.');
      h += step(note('Este argumento tan simple es la base de la idea de que los reales llenan la recta por completo, sin dejar huecos.'));
      h += lineSVG({
        lo: a - (b - a) * 0.3, hi: b + (b - a) * 0.3,
        ticks: [{ v: a, lbl: num(a, 4) }, { v: b, lbl: num(b, 4) }],
        segments: [{ a: a, b: b, color: '#cbd5e1' }],
        points: pts.map(function (v, j) {
          return { v: v, color: j === pts.length - 1 ? '#e63946' : '#2a76dd' };
        })
      });
      return h;
    });
  };

  /* =================================================================
     5. APPLETS · INTERVALOS
     ================================================================= */

  RE.intervalos = function (root) {
    var out = shell(root, 'Applet \u00b7 Intervalos y semirrectas', [
      'Un intervalo es un conjunto de n\u00fameros reales que se corresponde con los puntos de un segmento o de una semirrecta de la recta real.',
      'Elige el tipo, los extremos y si entran o no. El applet muestra las tres escrituras: conjunto, intervalo y dibujo.',
      'Ejemplos del libro: n\u00fameros menores que 3; $\\left\\{x:-2\\leq x<4\\right\\}$; n\u00fameros mayores que 3 y menores o iguales que 7.',
      'Recuerda que los extremos infinitos siempre van con par\u00e9ntesis, porque el infinito no es un n\u00famero real.'
    ],
      '<div class="ap-row">' + sel('t', 'tipo', [['seg', 'segmento'], ['izq', 'semirrecta hacia la izquierda'], ['der', 'semirrecta hacia la derecha']], 'seg') + '</div>' +
      '<div class="ap-row">' + mini('a', 'extremo a', -2, 0.5) + sel('ea', 'a', [['1', 'cerrado'], ['0', 'abierto']], '1') + '</div>' +
      '<div class="ap-row">' + mini('b', 'extremo b', 4, 0.5) + sel('eb', 'b', [['0', 'abierto'], ['1', 'cerrado']], '0') + '</div>');

    live(root, out, function () {
      var t = val(root, 't'), a = nv(root, 'a'), b = nv(root, 'b');
      var ca = val(root, 'ea') === '1', cb = val(root, 'eb') === '1';
      var h = '', conj = '', ivx = '', segs = [], pts = [], lo, hi;

      if (t === 'seg') {
        if (!(a < b)) throw new Error('en un segmento hace falta que $a$ sea menor que $b$.');
        conj = '\\left\\{x\\in\\mathbb{R}:' + nt(a) + (ca ? '\\leq' : '<') + 'x' + (cb ? '\\leq' : '<') + nt(b) + '\\right\\}';
        ivx = (ca ? '\\left[' : '\\left(') + nt(a) + ',\\ ' + nt(b) + (cb ? '\\right]' : '\\right)');
        segs = [{ a: a, b: b }];
        pts = [{ v: a, open: !ca, lbl: num(a, 3) }, { v: b, open: !cb, lbl: num(b, 3) }];
        lo = a - (b - a) * 0.5; hi = b + (b - a) * 0.5;
        h += step('Tipo: ' + key(ca && cb ? 'intervalo cerrado' : (!ca && !cb ? 'intervalo abierto' : 'intervalo semiabierto')));
        h += step('Longitud del intervalo: ' + T(nt(b - a)) + ' ' + note('(siempre $b-a$, sea del tipo que sea)'));
      } else if (t === 'izq') {
        conj = '\\left\\{x\\in\\mathbb{R}:x' + (cb ? '\\leq' : '<') + nt(b) + '\\right\\}';
        ivx = '\\left(-\\infty,\\ ' + nt(b) + (cb ? '\\right]' : '\\right)');
        lo = b - 6; hi = b + 3;
        segs = [{ a: lo, b: b }];
        pts = [{ v: b, open: !cb, lbl: num(b, 3) }];
        h += step('Tipo: ' + key('semirrecta') + ', de longitud infinita.');
      } else {
        conj = '\\left\\{x\\in\\mathbb{R}:x' + (ca ? '\\geq' : '>') + nt(a) + '\\right\\}';
        ivx = (ca ? '\\left[' : '\\left(') + nt(a) + ',\\ +\\infty\\right)';
        lo = a - 3; hi = a + 6;
        segs = [{ a: a, b: hi }];
        pts = [{ v: a, open: !ca, lbl: num(a, 3) }];
        h += step('Tipo: ' + key('semirrecta') + ', de longitud infinita.');
      }

      h = step(key('En forma de conjunto: ') + T(conj)) +
          step(key('En forma de intervalo: ') + T(ivx)) + h;
      h += lineSVG({ lo: lo, hi: hi, segments: segs, points: pts, ticks: [{ v: 0, lbl: '0' }] });
      h += step(note('Punto relleno significa que el extremo entra; hueco, que no entra.'));
      return h;
    });
  };

  RE.unionint = function (root) {
    var out = shell(root, 'Applet \u00b7 Uni\u00f3n e intersecci\u00f3n de intervalos', [
      'Dibuja los dos intervalos en la misma recta y decide qu\u00e9 zona cumple <b>alguna</b> condici\u00f3n, la uni\u00f3n, o <b>las dos</b> a la vez, la intersecci\u00f3n.',
      'Ejemplos del libro: $[-1,5)\\cup(2,7)=[-1,7)$; en cambio $[-1,2]\\cup(5,7)$ no se puede escribir como un solo intervalo.',
      'Para intersecciones: $[-4,2]\\cap(-2,4)=(-2,2]$, y $[1,5]\\cap(7,9)=\\varnothing$.',
      'Fija la atenci\u00f3n en los extremos: pertenecen al resultado solo si pertenec\u00edan donde hace falta.'
    ],
      '<div class="ap-row">' + mini('a1', 'a\u2081', -1, 0.5) + sel('c1', '', [['1', '['], ['0', '(']], '1') +
      mini('b1', 'b\u2081', 5, 0.5) + sel('d1', '', [['0', ')'], ['1', ']']], '0') + '</div>' +
      '<div class="ap-row">' + mini('a2', 'a\u2082', 2, 0.5) + sel('c2', '', [['0', '('], ['1', '[']], '0') +
      mini('b2', 'b\u2082', 7, 0.5) + sel('d2', '', [['0', ')'], ['1', ']']], '0') + '</div>' +
      '<div class="ap-row">' + sel('op', 'operaci\u00f3n', [['u', 'uni\u00f3n'], ['i', 'intersecci\u00f3n']], 'u') + '</div>');

    live(root, out, function () {
      var A = { a: nv(root, 'a1'), b: nv(root, 'b1'), ca: val(root, 'c1') === '1', cb: val(root, 'd1') === '1' };
      var B = { a: nv(root, 'a2'), b: nv(root, 'b2'), ca: val(root, 'c2') === '1', cb: val(root, 'd2') === '1' };
      if (!(A.a < A.b) || !(B.a < B.b)) throw new Error('cada intervalo necesita el extremo izquierdo menor que el derecho.');
      var op = val(root, 'op');
      function tex(I) {
        return (I.ca ? '\\left[' : '\\left(') + nt(I.a) + ',\\ ' + nt(I.b) + (I.cb ? '\\right]' : '\\right)');
      }
      var h = step('Intervalos: ' + T(tex(A)) + ' y ' + T(tex(B)));
      var res = null, txt;
      if (op === 'i') {
        var la = Math.max(A.a, B.a), lb = Math.min(A.b, B.b);
        var cla = A.a > B.a ? A.ca : (B.a > A.a ? B.ca : (A.ca && B.ca));
        var clb = A.b < B.b ? A.cb : (B.b < A.b ? B.cb : (A.cb && B.cb));
        if (la > lb || (la === lb && !(cla && clb))) { txt = '\\varnothing'; res = null; }
        else { res = { a: la, b: lb, ca: cla, cb: clb }; txt = tex(res); }
        h += step(key('Intersecci\u00f3n: ') + T(txt) + (res ? '' : ' ' + note('(no hay ning\u00fan punto com\u00fan)')));
      } else {
        var solapan = (A.b > B.a || (A.b === B.a && (A.cb || B.ca))) &&
                      (B.b > A.a || (B.b === A.a && (B.cb || A.ca)));
        if (solapan) {
          var ua = Math.min(A.a, B.a), ub = Math.max(A.b, B.b);
          var cua = A.a < B.a ? A.ca : (B.a < A.a ? B.ca : (A.ca || B.ca));
          var cub = A.b > B.b ? A.cb : (B.b > A.b ? B.cb : (A.cb || B.cb));
          res = { a: ua, b: ub, ca: cua, cb: cub };
          h += step(key('Uni\u00f3n: ') + T(tex(res)) + ' ' + note('(se solapan, as\u00ed que resulta un solo intervalo)'));
        } else {
          h += step(key('Uni\u00f3n: ') + T(tex(A) + '\\cup ' + tex(B)));
          h += warnStep('Los dos intervalos ' + bad('no') + ' se solapan: la uni\u00f3n queda indicada y no se puede escribir como un solo intervalo.');
        }
      }
      var lo = Math.min(A.a, B.a) - 2, hi = Math.max(A.b, B.b) + 2;
      h += lineSVG({
        lo: lo, hi: hi,
        segments: [{ a: A.a, b: A.b, color: '#2a76dd' }, { a: B.a, b: B.b, color: '#e63946' }]
          .concat(res ? [{ a: res.a, b: res.b, color: '#2a9d8f' }] : []),
        ticks: [{ v: 0, lbl: '0' }],
        points: [
          { v: A.a, open: !A.ca, color: '#2a76dd', lbl: num(A.a, 3) },
          { v: A.b, open: !A.cb, color: '#2a76dd', lbl: num(A.b, 3) },
          { v: B.a, open: !B.ca, color: '#e63946', lbl: num(B.a, 3) },
          { v: B.b, open: !B.cb, color: '#e63946', lbl: num(B.b, 3) }
        ]
      });
      h += step(note('Azul el primer intervalo, rojo el segundo, verde el resultado.'));
      return h;
    });
  };

  RE.absoluto = function (root) {
    var out = shell(root, 'Applet \u00b7 Valor absoluto y entornos', [
      'El valor absoluto mide la <b>distancia al cero</b>: $\\left|a\\right|=a$ si $a\\geq0$ y $\\left|a\\right|=-a$ si $a<0$.',
      'M\u00e1s \u00fatil todav\u00eda: $\\left|x-c\\right|$ es la distancia de $x$ al punto $c$. Por eso $\\left|x-c\\right|\\leq r$ describe un intervalo centrado en $c$ de radio $r$.',
      'Ejemplos del libro: $\\left|x\\right|\\leq 3$ equivale a $[-3,3]$; $\\left|x-3\\right|\\leq 1$ equivale a $[2,4]$.',
      'Cambia el signo de la desigualdad y observa que la soluci\u00f3n pasa a ser la uni\u00f3n de dos semirrectas.'
    ],
      '<div class="ap-row">' + mini('c', 'centro c', 3, 0.5) + mini('r', 'radio r', 1, 0.5) +
      sel('op', 'signo', [['le', '\u2264'], ['ge', '\u2265']], 'le') + '</div>');

    live(root, out, function () {
      var c = nv(root, 'c'), r = nv(root, 'r'), op = val(root, 'op');
      if (!(r >= 0)) throw new Error('el radio debe ser mayor o igual que cero.');
      var h = step('Condici\u00f3n: ' + T('\\left|x-' + nt(c) + '\\right|' + (op === 'le' ? '\\leq' : '\\geq') + nt(r)));
      h += step(key('Lectura geom\u00e9trica: ') + 'los puntos cuya distancia a ' + T(nt(c)) +
        (op === 'le' ? ' es como m\u00e1ximo ' : ' es como m\u00ednimo ') + T(nt(r)) + '.');
      var lo = c - r - 3, hi = c + r + 3, segs, txt;
      if (op === 'le') {
        txt = '\\left[' + nt(c - r) + ',\\ ' + nt(c + r) + '\\right]';
        segs = [{ a: c - r, b: c + r }];
        h += step('Se traduce en la doble desigualdad ' + T(nt(c - r) + '\\leq x\\leq ' + nt(c + r)) +
          ', es decir el intervalo ' + T(txt) + '.');
      } else {
        txt = '\\left(-\\infty,\\ ' + nt(c - r) + '\\right]\\cup\\left[' + nt(c + r) + ',\\ +\\infty\\right)';
        segs = [{ a: lo, b: c - r }, { a: c + r, b: hi }];
        h += step('Se rompe en dos condiciones: ' + T('x\\leq ' + nt(c - r)) + ' o ' + T('x\\geq ' + nt(c + r)) +
          ', es decir ' + T(txt) + '.');
      }
      h += step(key('Soluci\u00f3n: ') + T(txt));
      h += lineSVG({
        lo: lo, hi: hi, segments: segs,
        ticks: [{ v: 0, lbl: '0' }],
        points: [
          { v: c - r, lbl: num(c - r, 3) },
          { v: c + r, lbl: num(c + r, 3) },
          { v: c, color: '#8e44ad', lbl: 'centro ' + num(c, 3) }
        ]
      });
      h += step(note('El punto morado es el centro. Con $\\leq$ la soluci\u00f3n es un entorno; con $\\geq$, su complementario.'));
      return h;
    });
  };

  /* =================================================================
     6. APPLETS · NOTACIÓN CIENTÍFICA
     ================================================================= */

  RE.cientifica = function (root) {
    var out = shell(root, 'Applet \u00b7 Notaci\u00f3n cient\u00edfica', [
      'Un n\u00famero est\u00e1 en notaci\u00f3n cient\u00edfica cuando se escribe $a\\cdot 10^{b}$ con $\\left|a\\right|\\in[1,10)$ y $b$ entero. El n\u00famero $a$ es la <b>mantisa</b> y $b$ el <b>orden de magnitud</b>.',
      'Escribe el n\u00famero con coma decimal, por ejemplo <code>-2365000</code> o <code>0,00000154</code>.',
      'Regla: cuenta las cifras desde la primera distinta de cero hasta las unidades. Coma a la izquierda, exponente positivo; coma a la derecha, exponente negativo.',
      'Para practicar con contextos reales y correcci\u00f3n autom\u00e1tica, usa el Entrenador de Notaci\u00f3n Cient\u00edfica enlazado en la p\u00e1gina.'
    ], rowText('x', 'n\u00famero', '0,00000154'));

    live(root, out, function () {
      var s = toSci(val(root, 'x'));
      var h = step('N\u00famero: ' + T(String(s.val).replace('.', '{,}')));
      h += step(key('Notaci\u00f3n cient\u00edfica: ') + T(sciTex(s.m, s.e)));
      h += step(key('Mantisa: ') + T(nt(s.m)) + ' \u00b7 ' + key('Orden de magnitud: ') + T(String(s.e)));
      h += step('La coma se ha desplazado ' + key(Math.abs(s.e) + (Math.abs(s.e) === 1 ? ' posici\u00f3n' : ' posiciones')) +
        ' hacia la ' + (s.e >= 0 ? 'izquierda' : 'derecha') + ', y por eso el exponente es ' +
        (s.e >= 0 ? 'positivo' : 'negativo') + '.');
      h += step(note('Un exponente negativo no significa n\u00famero negativo: significa n\u00famero peque\u00f1o, entre cero y uno.'));
      var comp = [
        ['masa del electr\u00f3n', 9.1, -31, '\\text{kg}'],
        ['radio del \u00e1tomo de hidr\u00f3geno', 5.3, -11, '\\text{m}'],
        ['tama\u00f1o de una bacteria', 2, -6, '\\text{m}'],
        ['velocidad de la luz', 3, 8, '\\text{m/s}'],
        ['poblaci\u00f3n mundial', 8.1, 9, ''],
        ['masa de la Tierra', 5.97, 24, '\\text{kg}']
      ];
      h += '<table class="ap-tbl"><tr><th>Magnitud</th><th>Valor</th><th>Orden</th></tr>' +
        comp.map(function (c) {
          var mark = c[2] === s.e ? ' class="ap-sel-row"' : '';
          return '<tr' + mark + '><td>' + c[0] + '</td><td>' + T(sciTex(c[1], c[2]) + (c[3] ? '\\ ' + c[3] : '')) +
            '</td><td>' + c[2] + '</td></tr>';
        }).join('') + '</table>';
      h += step(note('Comparar \u00f3rdenes de magnitud permite situar cualquier cantidad en la escala del universo de un vistazo.'));
      return h;
    });
  };

  RE.opercientifica = function (root) {
    var out = shell(root, 'Applet \u00b7 Operaciones en notaci\u00f3n cient\u00edfica', [
      'Para <b>sumar o restar</b> hay que igualar primero el orden de magnitud. Para <b>multiplicar o dividir</b>, se operan las mantisas entre s\u00ed y las potencias entre s\u00ed.',
      'Ejemplo del libro: $9{,}76\\cdot10^{3}+2{,}43\\cdot10^{2}=1{,}0003\\cdot10^{4}$.',
      'Otro: $\\left(2{,}1\\cdot10^{-2}\\cdot3{,}2\\cdot10^{5}\\right):\\left(8\\cdot10^{4}\\right)=8{,}4\\cdot10^{-2}$.',
      'Fija la atenci\u00f3n en el \u00faltimo paso: el resultado intermedio a menudo <b>no</b> est\u00e1 en notaci\u00f3n cient\u00edfica y hay que normalizarlo.'
    ],
      '<div class="ap-row">' + mini('m1', 'mantisa', 9.76, 0.01) + mini('e1', 'exponente', 3) +
      sel('op', '', [['+', '+'], ['-', '\u2212'], ['*', '\u00d7'], ['/', '\u00f7']], '+') +
      mini('m2', 'mantisa', 2.43, 0.01) + mini('e2', 'exponente', 2) + '</div>');

    live(root, out, function () {
      var m1 = nv(root, 'm1'), e1 = iv(root, 'e1'), m2 = nv(root, 'm2'), e2 = iv(root, 'e2'), op = val(root, 'op');
      var h = step('Operaci\u00f3n: ' + T(sciTex(m1, e1) + '\\;' +
        (op === '*' ? '\\cdot' : op === '/' ? ':' : op) + '\\;' + sciTex(m2, e2)));
      var v;
      if (op === '+' || op === '-') {
        var E = Math.max(e1, e2);
        var a1 = m1 * Math.pow(10, e1 - E), a2 = m2 * Math.pow(10, e2 - E);
        h += step(key('Paso 1. ') + 'Igualamos el orden de magnitud al mayor, ' + T('10^{' + E + '}') + ': ' +
          T(sciTex(a1, E) + '\\;' + (op === '+' ? '+' : '-') + '\\;' + sciTex(a2, E)));
        var sm = op === '+' ? a1 + a2 : a1 - a2;
        h += step(key('Paso 2. ') + 'Operamos solo las mantisas: ' +
          T(nt(a1) + (op === '+' ? '+' : '-') + nt(a2) + '=' + nt(sm)));
        v = sm * Math.pow(10, E);
        h += step(key('Paso 3. ') + 'Resultado intermedio ' + T(sciTex(sm, E)));
        if (Math.abs(sm) >= 10 || Math.abs(sm) < 1) {
          h += warnStep('Ese resultado intermedio ' + bad('no') + ' est\u00e1 normalizado: la mantisa debe cumplir ' +
            T('1\\leq\\left|a\\right|<10') + '.');
        }
      } else {
        var mm = op === '*' ? m1 * m2 : m1 / m2;
        var ee = op === '*' ? e1 + e2 : e1 - e2;
        h += step(key('Paso 1. ') + 'Mantisas: ' + T(nt(m1) + (op === '*' ? '\\cdot' : ':') + nt(m2) + '=' + nt(mm)));
        h += step(key('Paso 2. ') + 'Potencias: ' +
          T('10^{' + e1 + '}' + (op === '*' ? '\\cdot' : ':') + '10^{' + e2 + '}=10^{' + ee + '}') +
          ' ' + note('(los exponentes se suman o se restan, nunca se multiplican)'));
        v = mm * Math.pow(10, ee);
        h += step('Resultado intermedio: ' + T(sciTex(mm, ee)));
      }
      var f = toSci(String(v));
      h += step(key('Resultado normalizado: ') + chip(T(sciTex(f.m, f.e, 5))));
      h += step(note('Normalizar significa dejar la mantisa entre 1 y 10. Es el paso que m\u00e1s se olvida en los ex\u00e1menes.'));
      return h;
    });
  };

  RE.magnitud = function (root) {
    var out = shell(root, 'Applet \u00b7 Cambiar el orden de magnitud', [
      'El mismo n\u00famero se puede escribir con distintos exponentes. Si el exponente <b>sube</b> $k$ unidades, la coma de la mantisa se mueve $k$ posiciones a la <b>izquierda</b>, y al contrario.',
      'Es la regla del balanc\u00edn: lo que sube el exponente, lo baja la mantisa. El valor no cambia.',
      'Ejemplo: $2{,}43\\cdot10^{2}=0{,}243\\cdot10^{3}$. Las dos valen $243$, aunque la segunda no est\u00e9 normalizada.',
      'Esta destreza es imprescindible para sumar y restar en notaci\u00f3n cient\u00edfica.'
    ],
      '<div class="ap-row">' + mini('m', 'mantisa', 2.43, 0.01) + mini('e', 'exponente', 2) +
      mini('t', 'nuevo exponente', 3) + '</div>');

    live(root, out, function () {
      var m = nv(root, 'm'), e = iv(root, 'e'), t = iv(root, 't');
      var k = t - e, m2 = m * Math.pow(10, -k);
      var h = step('Partimos de ' + T(sciTex(m, e)) + ', cuyo valor es ' + T(nt(m * Math.pow(10, e), 8)) + '.');
      h += step('El exponente ' + (k === 0 ? 'no cambia' : (k > 0 ? 'sube ' + k + (k === 1 ? ' unidad' : ' unidades')
        : 'baja ' + (-k) + (-k === 1 ? ' unidad' : ' unidades'))) +
        (k === 0 ? '.' : ', luego la coma se mueve ' + Math.abs(k) +
          (Math.abs(k) === 1 ? ' posici\u00f3n' : ' posiciones') +
          ' hacia la ' + (k > 0 ? 'izquierda' : 'derecha') + '.'));
      h += step(key('Resultado: ') + T(sciTex(m, e) + '=' + sciTex(m2, t, 8)));
      h += step('Comprobaci\u00f3n del valor: ' + T(nt(m2 * Math.pow(10, t), 8)) + ' ' + ok('(coincide)'));
      h += step(Math.abs(m2) >= 1 && Math.abs(m2) < 10
        ? ok('La nueva escritura s\u00ed est\u00e1 normalizada.')
        : bad('La nueva escritura no est\u00e1 normalizada') + ', porque la mantisa no cumple ' +
          T('1\\leq\\left|a\\right|<10') + '. ' +
          note('Es v\u00e1lida como paso intermedio, no como resultado final.'));
      return h;
    });
  };

  /* =================================================================
     7. APPLETS · APROXIMACIONES Y ERRORES
     ================================================================= */

  function orderName(k) {
    var names = {
      0: 'unidades', 1: 'd\u00e9cimas', 2: 'cent\u00e9simas', 3: 'mil\u00e9simas',
      4: 'diezmil\u00e9simas', 5: 'cienmil\u00e9simas'
    };
    return names[k] || ('orden ' + k);
  }
  function parseSpecial(s) {
    s = String(s).trim();
    if (s === 'pi') return Math.PI;
    if (s === 'e') return Math.E;
    var mr = /^sqrt\((\d+(?:[.,]\d+)?)\)$/.exec(s);
    if (mr) return Math.sqrt(parseFloat(mr[1].replace(',', '.')));
    return parseFloat(s.replace(',', '.'));
  }

  RE.aproxima = function (root) {
    var out = shell(root, 'Applet \u00b7 Redondeo y truncamiento', [
      'Aproximar por <b>defecto</b> o truncar consiste en eliminar las cifras a partir del orden considerado. Aproximar por <b>exceso</b> a\u00f1ade una unidad a la \u00faltima cifra que queda.',
      'El <b>redondeo</b> elige la mejor de las dos aproximaciones anteriores.',
      'Ejemplos del libro: aproxima $4{,}635$, $3{,}57$ y $\\sqrt{3}$ a las cent\u00e9simas.',
      'Prueba con <code>pi</code>, <code>sqrt(2)</code>, <code>sqrt(3)</code> o cualquier decimal, y cambia el orden.'
    ],
      rowText('x', 'n\u00famero', 'pi') +
      '<div class="ap-row">' + sel('k', 'orden', [['0', 'unidades'], ['1', 'd\u00e9cimas'], ['2', 'cent\u00e9simas'], ['3', 'mil\u00e9simas'], ['4', 'diezmil\u00e9simas']], '2') + '</div>');

    live(root, out, function () {
      var k = iv(root, 'k'), v = parseSpecial(val(root, 'x'));
      if (!isFinite(v)) throw new Error('escribe un n\u00famero, <code>pi</code>, <code>e</code> o <code>sqrt(n)</code>.');
      var p = Math.pow(10, k);
      var trunc = Math.floor(v * p) / p, exc = Math.ceil(v * p) / p, red = Math.round(v * p) / p;
      var h = step('N\u00famero: ' + T(nt(v, 10)) + ' \u00b7 aproximaci\u00f3n a las ' + key(orderName(k)));
      h += '<table class="ap-tbl"><tr><th>Tipo</th><th>Valor</th><th>Error absoluto</th></tr>' +
        [['Truncamiento, por defecto', trunc], ['Por exceso', exc], ['Redondeo', red]].map(function (r) {
          var mark = Math.abs(r[1] - red) < 1e-12 ? ' class="ap-sel-row"' : '';
          return '<tr' + mark + '><td>' + r[0] + '</td><td>' + T(nt(r[1], k + 2)) + '</td><td>' +
            T(nt(Math.abs(v - r[1]), 8)) + '</td></tr>';
        }).join('') + '</table>';
      h += step(key('El redondeo es la mejor aproximaci\u00f3n: ') +
        'es la que produce el menor error absoluto de las dos.');
      var sig = num(red, k + 2).replace(/[^0-9]/g, '').replace(/^0+/, '').length;
      h += step('Cifras significativas del redondeo: ' + key(String(sig)) + ' ' +
        note('(se cuentan desde la primera cifra distinta de cero)'));
      h += lineSVG({
        lo: v - 3 / p, hi: v + 3 / p,
        ticks: [
          { v: trunc, lbl: 'defecto ' + num(trunc, k + 1) },
          { v: exc, lbl: 'exceso ' + num(exc, k + 1) }
        ],
        points: [
          { v: v, color: '#8e44ad', lbl: 'valor real ' + num(v, k + 3) },
          { v: red, color: '#2a9d8f', lbl: 'redondeo ' + num(red, k + 1) }
        ]
      });
      h += step(note('Morado, el valor real. Verde, el redondeo. Debajo del eje, las dos aproximaciones por defecto y por exceso.'));
      return h;
    });
  };

  RE.errores = function (root) {
    var out = shell(root, 'Applet \u00b7 Error absoluto y relativo', [
      'El <b>error absoluto</b> es $E_{a}=\\left|V_{\\text{real}}-V_{\\text{aprox}}\\right|$, y lleva las mismas unidades que la medida.',
      'El <b>error relativo</b> es $E_{r}=\\dfrac{E_{a}}{\\left|V_{\\text{real}}\\right|}$, no tiene unidades y se suele dar en tanto por ciento.',
      'Ejemplo del libro: al redondear $2{,}387$ a las cent\u00e9simas se obtiene $2{,}39$, con $E_{a}=0{,}003$ y $E_{r}\\approx 0{,}0013$.',
      'Reto conceptual: busca dos medidas con el <b>mismo</b> error absoluto y errores relativos muy distintos.'
    ],
      '<div class="ap-row">' + mini('r', 'valor real', 2.387, 0.001) + mini('a', 'aproximaci\u00f3n', 2.39, 0.001) + '</div>' +
      '<div class="ap-row">' + mini('r2', 'segunda medida real', 1000, 1) + mini('a2', 'su aproximaci\u00f3n', 1000.003, 0.001) + '</div>');

    live(root, out, function () {
      var r = nv(root, 'r'), a = nv(root, 'a'), r2 = nv(root, 'r2'), a2 = nv(root, 'a2');
      if (r === 0) throw new Error('el valor real no puede ser cero para calcular el error relativo.');
      var ea = Math.abs(r - a), er = ea / Math.abs(r);
      var ea2 = Math.abs(r2 - a2), er2 = r2 === 0 ? NaN : ea2 / Math.abs(r2);
      var h = step(key('Primera medida. ') + T('E_{a}=\\left|' + nt(r) + '-' + nt(a) + '\\right|=' + nt(ea, 8)));
      h += step(T('E_{r}=\\dfrac{' + nt(ea, 8) + '}{' + nt(Math.abs(r)) + '}=' + nt(er, 8)) +
        ', es decir ' + chip(num(er * 100, 4) + ' %'));
      h += step(key('Segunda medida. ') + T('E_{a}=' + nt(ea2, 8)) + ' y ' + T('E_{r}=' + nt(er2, 8)) +
        ', es decir ' + chip(num(er2 * 100, 4) + ' %'));
      h += '<table class="ap-tbl"><tr><th></th><th>Error absoluto</th><th>Error relativo</th></tr>' +
        '<tr><td>Medida 1</td><td>' + T(nt(ea, 8)) + '</td><td>' + num(er * 100, 4) + ' %</td></tr>' +
        '<tr><td>Medida 2</td><td>' + T(nt(ea2, 8)) + '</td><td>' + num(er2 * 100, 4) + ' %</td></tr></table>';
      h += step(Math.abs(ea - ea2) < 1e-9
        ? key('Observa: ') + 'los dos errores absolutos son ' + ok('iguales') +
          ' y, sin embargo, los relativos son muy distintos. Equivocarse en tres mil\u00e9simas al medir algo que vale 2 es mucho m\u00e1s grave que al medir algo que vale 1000.'
        : note('Ajusta los valores para conseguir el mismo error absoluto con errores relativos distintos: as\u00ed se ve por qu\u00e9 el error relativo es el que informa de verdad de la calidad de una medida.'));
      return h;
    });
  };

  RE.cotas = function (root) {
    var out = shell(root, 'Applet \u00b7 Cotas de error', [
      'Una <b>cota</b> es un valor que limita una cantidad desconocida. No necesitamos saber el error exacto: basta acotarlo.',
      'Al redondear hasta un orden $n$ se cumple $E_{a}<\\dfrac{1}{2}\\cdot10^{-n}$, es decir, media unidad del orden al que se aproxima.',
      'Y si $E$ es una cota del error absoluto, entonces $E_{r}<\\dfrac{E}{\\left|V_{\\text{aprox}}\\right|-E}$.',
      'Ejemplo del libro: redondeando $\\pi$ a las cent\u00e9simas, $E_{a}<0{,}005$ y $E_{r}<0{,}0016$, es decir un $0{,}16\\%$.'
    ],
      rowText('x', 'n\u00famero', 'pi') +
      '<div class="ap-row">' + sel('k', 'orden', [['1', 'd\u00e9cimas'], ['2', 'cent\u00e9simas'], ['3', 'mil\u00e9simas'], ['4', 'diezmil\u00e9simas']], '2') +
      sel('m', 'm\u00e9todo', [['red', 'redondeo'], ['tru', 'truncamiento']], 'red') + '</div>');

    live(root, out, function () {
      var k = iv(root, 'k'), m = val(root, 'm'), v = parseSpecial(val(root, 'x'));
      if (!isFinite(v)) throw new Error('escribe un n\u00famero, <code>pi</code>, <code>e</code> o <code>sqrt(n)</code>.');
      var p = Math.pow(10, k);
      var ap = m === 'red' ? Math.round(v * p) / p : Math.floor(v * p) / p;
      var cotaA = m === 'red' ? 0.5 / p : 1 / p;
      var den = Math.abs(ap) - cotaA;
      if (!(den > 0)) throw new Error('con ese orden la cota supera al propio valor: elige m\u00e1s cifras.');
      var cotaR = cotaA / den;
      var h = step('N\u00famero ' + T(nt(v, 10)) + ' aproximado a las ' + key(orderName(k)) + ' por ' +
        key(m === 'red' ? 'redondeo' : 'truncamiento') + ': ' + T(nt(ap, k + 1)));
      h += step(key('Cota del error absoluto: ') +
        T('E_{a}<' + (m === 'red' ? '\\dfrac{1}{2}\\cdot' : '') + '10^{-' + k + '}=' + nt(cotaA, 8)));
      h += step('Error absoluto real cometido: ' + T(nt(Math.abs(v - ap), 10)) + ' ' +
        (Math.abs(v - ap) < cotaA ? ok('(menor que la cota, como debe ser)') : bad('(revisa los datos)')));
      h += step(key('Cota del error relativo: ') +
        T('E_{r}<\\dfrac{' + nt(cotaA, 8) + '}{' + nt(Math.abs(ap), k + 1) + '-' + nt(cotaA, 8) + '}=' + nt(cotaR, 8)) +
        ', es decir ' + chip(num(cotaR * 100, 3) + ' %'));
      h += step(note('El truncamiento tiene una cota el doble de grande que el redondeo: por eso el redondeo es preferible siempre que se pueda.'));
      h += step(key('Pregunta para pensar: ') +
        'si la poblaci\u00f3n de un pueblo, redondeada a las decenas, es de 310 habitantes, \u00bfpuedes dar el error exacto? \u00bfY una cota? ' +
        note('La respuesta distingue medir de estimar.'));
      return h;
    });
  };

  RE.significativas = function (root) {
    var out = shell(root, 'Applet \u00b7 Cifras significativas', [
      'Una aproximaci\u00f3n tiene $n$ cifras significativas si hay $n$ d\u00edgitos desde el primero distinto de cero hasta la \u00faltima cifra que se conserva.',
      'Ejemplos del libro: $2{,}6$ tiene 2 cifras significativas; $7{,}460$ tiene 4; $0{,}015$ tiene 2.',
      'Los ceros a la izquierda nunca cuentan. Los ceros finales <b>s\u00ed</b> cuentan si se han escrito a prop\u00f3sito, porque informan de la precisi\u00f3n.',
      'Escribe cantidades con y sin ceros finales y observa la diferencia.'
    ], rowText('x', 'cantidad escrita', '7,460'));

    live(root, out, function () {
      var s = val(root, 'x').trim().replace(/\s/g, '').replace('.', ',');
      if (!/^-?\d*(,\d*)?$/.test(s) || !/\d/.test(s)) {
        throw new Error('escribe una cantidad como <code>7,460</code>, <code>0,015</code> o <code>250</code>.');
      }
      var digits = s.replace('-', '').replace(',', '');
      var sinCeros = digits.replace(/^0+/, '');
      var n = sinCeros.length;
      var v = parseFloat(s.replace(',', '.'));
      var h = step('Cantidad: ' + T(s.replace(',', '{,}')));
      h += step(key('Cifras significativas: ') + chip(String(n)));
      h += step('Se cuentan desde la primera cifra distinta de cero, que es ' + T(sinCeros[0] || '0') +
        ', hasta la \u00faltima escrita.');
      if (/^0+/.test(digits)) {
        h += step(note('Los ' + digits.match(/^0+/)[0].length +
          ' ceros iniciales no son significativos: solo sit\u00faan la coma.'));
      }
      if (/0$/.test(digits) && s.indexOf(',') >= 0) {
        h += step(key('Atenci\u00f3n: ') + 'los ceros finales tras la coma ' + ok('s\u00ed') +
          ' son significativos. Escribir ' + T('7{,}460') + ' no es lo mismo que escribir ' + T('7{,}46') +
          ': el primero afirma que se ha medido hasta las mil\u00e9simas.');
      }
      if (isFinite(v) && v !== 0) {
        var sc = toSci(String(v));
        h += step('En notaci\u00f3n cient\u00edfica: ' + T(sciTex(sc.m, sc.e, 8)) + ' ' +
          note('(esta escritura hace visibles las cifras significativas sin ambig\u00fcedad)'));
      }
      return h;
    });
  };

  /* =================================================================
     8. DIAGNÓSTICO Y ARRANQUE
     ================================================================= */

  RE.diagnostico = function (root) {
    var out = shell(root, 'Applet \u00b7 Diagn\u00f3stico del m\u00f3dulo', [
      'Applet de servicio: comprueba KaTeX, la aritm\u00e9tica exacta, el formato de los decimales y el dibujo de la recta real.',
      'Si todas las l\u00edneas salen en verde, el tema est\u00e1 listo para el aula.'
    ], '<div class="ap-row">' + mini('n', 'numerador', 7) + mini('d', 'denominador', 6) + '</div>');

    live(root, out, function () {
      var n = iv(root, 'n'), d = iv(root, 'd');
      var h = step('KaTeX: ' + (window.katex ? ok('cargado') : bad('no cargado')) + ' \u00b7 autorenderizado: ' +
        (window.renderMathInElement ? ok('disponible') : bad('no disponible')));
      h += step('M\u00f3dulo de ampliaci\u00f3n: ' + (window.REALX ? ok('cargado') : note('no cargado en esta p\u00e1gina')));
      h += step('Fracci\u00f3n y decimal: ' + T(fracTex(n, d) + '=' + decimalString(n, d).tex) + ' ' + ok('correcto'));
      h += step('Texto plano, sin llaves: ' + chip(num(8 / 3, 3)) + chip(num(-2.5, 2)) + chip(num(0.16, 2) + ' %') +
        ' ' + ok('correcto'));
      h += step('Factorizaci\u00f3n: ' + T('360=' + factorTex(360)) + ' \u00b7 suma de cuadrados de 12: ' +
        T(sumOfSquares(12).map(function (k) { return k + '^{2}'; }).join('+')));
      h += step('Prueba de notaci\u00f3n: ' + T('\\left(-\\infty,3\\right]\\cup\\left[7,+\\infty\\right)') + ', ' +
        T('1{,}54\\cdot10^{-6}') + ', ' + T('\\sqrt[3]{2^{16}}') + ', ' + T('\\log_{2}32=5'));
      h += step('Etiquetas sin solape, tres puntos muy juntos:');
      h += lineSVG({
        lo: 3.10, hi: 3.20,
        ticks: [{ v: 3.14, lbl: 'defecto 3,14' }, { v: 3.15, lbl: 'exceso 3,15' }],
        points: [
          { v: 3.14159, color: '#8e44ad', lbl: 'valor real 3,1416' },
          { v: 3.14, color: '#2a9d8f', lbl: 'redondeo 3,14' }
        ]
      });
      return h;
    });
  };

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-applet-re]'), function (node) {
      var k = node.getAttribute('data-applet-re');
      if (typeof RE[k] === 'function') {
        try { RE[k](node); }
        catch (e) {
          node.classList.add('applet');
          node.innerHTML = errBox('el applet \u00ab' + k + '\u00bb no ha podido iniciarse: ' +
            (e && e.message ? e.message : e));
        }
      } else {
        node.classList.add('applet');
        node.innerHTML = errBox('no existe ning\u00fan applet con la clave \u00ab' + k + '\u00bb en este m\u00f3dulo.');
      }
    });
  }
  /* Espera a DOMContentLoaded, que se dispara DESPUÉS de todos los
     scripts con defer. Así el módulo de ampliación ya está presente. */
  if (document.readyState === 'complete') boot();
  else document.addEventListener('DOMContentLoaded', boot);

  /* API pública para el módulo de ampliación. */
  window.REAL = {
    kt: kt, T: T, TD: TD, head: head, errBox: errBox, step: step, warnStep: warnStep,
    key: key, ok: ok, bad: bad, note: note, chip: chip,
    nt: nt, num: num, plain: plain, gcd: gcd, lcm: lcm, reduce: reduce, fracTex: fracTex,
    factorize: factorize, factorTex: factorTex, decimalString: decimalString,
    toSci: toSci, sciTex: sciTex, lineSVG: lineSVG,
    rowText: rowText, mini: mini, sel: sel, get: get, val: val, nv: nv, iv: iv,
    live: live, shell: shell, applets: RE
  };
})();
