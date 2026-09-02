/* =====================================================================
   est4-applets.js · Tema 4 Probabilidad (parte 1) · 2.º Bachillerato
   Ruta: 2-Batx-estadistica/probabilidad/assets/est4-applets.js

   API pública: window.EST4
     .registry            mapa clave -> función montadora
     .shell(...)          armazón estándar de applet (título, instrucciones,
                          controles, escenarios y salida autorrecalculada)
     .tex(node) .K .KD    renderizado KaTeX local sobre nodos data-tex
     .texifica(s)         convierte $...$ y $$...$$ en nodos data-tex
     .conjunto .lista     parseo de elementos escritos por el alumno
     .U .I .D .SD .Co     unión, intersección, diferencia, diferencia
                          simétrica y complementario de conjuntos
     .subset .igual       inclusión e igualdad de conjuntos
     .partes(E)           espacio de sucesos (todos los subconjuntos)
     .setTxt .setTex      escritura de un conjunto, con ∅ cuando es vacío
     .frac .fracTex       fracciones exactas simplificadas
     .fact .V .VR .C .CR  combinatoria exacta con BigInt
     .venn(spec)          diagrama de Venn de 2 o 3 sucesos, por regiones
     .arbol(raiz, opts)   árbol ponderado con productos por rama
     .regiones(expr, n)   traduce una expresión de sucesos a regiones
     .contingencia(spec)  tabla de doble entrada con marginales
     .barrasBayes(spec)   aportación de cada causa y probabilidad a posteriori
     .barras(spec)        barras horizontales de frecuencias o probabilidades
     .pictograma(spec)    cuadrícula de casillas: la tasa base a la vista
     .log                 pila de errores por applet
     .extraA … .extraD    true cuando cada módulo ha registrado sus applets

   Todo el cálculo de probabilidades se hace con fracciones exactas de
   enteros (numerador y denominador), no con coma flotante: así 1/3 sale
   como 1/3 y las sumas por ramas de un árbol dan exactamente 1.

   Sin OJS, sin CDN, sin auto-render y sin dependencias externas.
   ===================================================================== */
(function () {
  'use strict';

  var R = {};

  /* ------------------------------------------------------------------
     0 · utilidades de texto y de KaTeX
     ------------------------------------------------------------------ */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function K(t)  { return '<span data-tex="' + esc(t) + '"></span>'; }
  function KD(t) { return '<span data-tex="' + esc(t) + '" data-display="1"></span>'; }

  function fmt(x, d) {
    d = d === undefined ? 4 : d;
    if (!Number.isFinite(x)) return '—';
    var p = Math.pow(10, d);
    var y = Math.round(x * p) / p;
    return String(Object.is(y, -0) ? 0 : y);
  }
  /* coma decimal en texto visible (español) */
  function nc(x, d) { return fmt(x, d).replace('.', ','); }
  /* coma decimal dentro de KaTeX: 0{,}25 evita separación tipográfica */
  function kf(x, d) { return fmt(x, d).replace('.', '{,}'); }
  /* porcentaje legible */
  function pct(x, d) { return nc(100 * x, d === undefined ? 2 : d) + ' %'; }

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

  /* Convierte $...$ y $$...$$ del texto plano en nodos data-tex.
     Debe aplicarse a TODO texto insertado con innerHTML: si no, los
     dólares aparecerían crudos en pantalla. */
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

  /* Identificadores únicos: los diagramas de Venn usan clipPath y mask,
     y dos applets en la misma página no pueden compartir el mismo id. */
  var SEQ = 0;
  function uid(p) { return (p || 'e4') + '-' + (++SEQ); }

  /* ------------------------------------------------------------------
     1 · aritmética exacta: combinatoria con BigInt
     ------------------------------------------------------------------ */
  var FCACHE = [1n, 1n];

  function fact(n) {
    n = Number(n);
    if (!Number.isInteger(n) || n < 0) throw Error('El factorial solo está definido para números naturales (0, 1, 2, …).');
    if (n > 2000) throw Error('Límite del applet: usa n ≤ 2000.');
    for (var i = FCACHE.length; i <= n; i++) FCACHE[i] = FCACHE[i - 1] * BigInt(i);
    return FCACHE[n];
  }
  function V(n, m) {
    n = Number(n); m = Number(m);
    if (m > n) throw Error('En las variaciones sin repetición hace falta m ≤ n.');
    var r = 1n;
    for (var i = 0; i < m; i++) r *= BigInt(n - i);
    return r;
  }
  function VR(n, m) {
    n = Number(n); m = Number(m);
    if (m > 4000) throw Error('Límite del applet: usa m ≤ 4000.');
    return BigInt(n) ** BigInt(m);
  }
  function C(n, m) {
    n = Number(n); m = Number(m);
    if (m > n) throw Error('En las combinaciones hace falta m ≤ n.');
    if (m < 0 || n < 0) throw Error('n y m deben ser números naturales.');
    if (m > n - m) m = n - m;
    var num = 1n, den = 1n;
    for (var i = 0; i < m; i++) { num *= BigInt(n - i); den *= BigInt(i + 1); }
    return num / den;
  }
  function CR(n, m) { return C(Number(n) + Number(m) - 1, m); }

  /* Separador de millares con espacio fino (nunca con punto, para no
     confundirlo con la coma decimal española). */
  var FINO = '\u202F';
  function bigTxt(b) {
    var s = b.toString(), neg = s.charAt(0) === '-';
    if (neg) s = s.slice(1);
    var out = '', c = 0;
    for (var i = s.length - 1; i >= 0; i--) {
      out = s.charAt(i) + out;
      if (++c % 3 === 0 && i > 0) out = FINO + out;
    }
    return (neg ? '-' : '') + out;
  }
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

  /* ------------------------------------------------------------------
     2 · fracciones exactas
     Una probabilidad es un cociente de recuentos: se guarda como
     { n, d } con enteros y se simplifica siempre.
     ------------------------------------------------------------------ */
  function mcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }

  function frac(n, d) {
    n = Math.round(Number(n)); d = Math.round(Number(d));
    if (d === 0) throw Error('No se puede dividir entre 0: revisa el número de casos posibles.');
    if (d < 0) { n = -n; d = -d; }
    var g = mcd(n, d);
    return { n: n / g, d: d / g };
  }
  function fSuma(a, b) { return frac(a.n * b.d + b.n * a.d, a.d * b.d); }
  function fResta(a, b) { return frac(a.n * b.d - b.n * a.d, a.d * b.d); }
  function fProd(a, b) { return frac(a.n * b.n, a.d * b.d); }
  function fDiv(a, b) {
    if (b.n === 0) throw Error('No se puede dividir entre una probabilidad nula.');
    return frac(a.n * b.d, a.d * b.n);
  }
  function fVal(a) { return a.n / a.d; }
  function fIgual(a, b) { return a.n * b.d === b.n * a.d; }
  function fracTex(a) {
    if (a.d === 1) return String(a.n);
    return '\\dfrac{' + a.n + '}{' + a.d + '}';
  }
  function fracTxt(a) { return a.d === 1 ? String(a.n) : a.n + '/' + a.d; }
  /* Fracción + valor decimal + porcentaje, listo para incrustar en KaTeX */
  function fracFull(a) {
    return fracTex(a) + ' = ' + kf(fVal(a), 4) + ' = ' + kf(100 * fVal(a), 2) + '\\,\\%';
  }
  /* Lee una probabilidad escrita por el alumno: 0,25 · 1/4 · 25% */
  function leeProb(txt, nombre) {
    var s = String(txt == null ? '' : txt).trim().replace(/\s/g, '');
    if (!s) throw Error((nombre || 'La probabilidad') + ' está vacía. Escribe por ejemplo 0,25 o 1/4.');
    var porc = /%$/.test(s);
    if (porc) s = s.slice(0, -1);
    s = s.replace(',', '.');
    var m = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
    var f;
    if (m) {
      f = decFrac(Number(m[1]));
      var g = decFrac(Number(m[2]));
      f = fDiv(f, g);
    } else {
      if (!/^-?\d+(\.\d+)?$/.test(s)) throw Error((nombre || 'La probabilidad') + ' no se entiende. Formatos válidos: 0,25 · 1/4 · 25%');
      f = decFrac(Number(s));
    }
    if (porc) f = fProd(f, frac(1, 100));
    if (fVal(f) < 0 || fVal(f) > 1) throw Error((nombre || 'La probabilidad') + ' debe estar entre 0 y 1.');
    return f;
  }
  /* Decimal finito -> fracción exacta: 0,125 -> 1/8 */
  function decFrac(x) {
    if (Number.isInteger(x)) return frac(x, 1);
    var s = String(x), dec = (s.split('.')[1] || '').length;
    var p = Math.pow(10, dec);
    return frac(Math.round(x * p), p);
  }

  /* ------------------------------------------------------------------
     3 · parseo de entradas
     ------------------------------------------------------------------ */

  /* Lista de elementos separados por espacios, comas o punto y coma.
     Acepta llaves: "{1, 2, 3}" se lee igual que "1 2 3".               */
  function lista(txt, tope, nombre) {
    var s = String(txt == null ? '' : txt).trim().replace(/^\{|\}$/g, '').trim();
    if (!s) return [];
    var L = s.split(/[\s,;]+/).filter(Boolean);
    if (L.length > (tope || 64)) throw Error((nombre || 'La lista') + ' tiene demasiados elementos: usa como máximo ' + (tope || 64) + '.');
    return L;
  }

  /* Conjunto: lista sin repeticiones y en el orden en que se escribió. */
  function conjunto(txt, tope, nombre) {
    var out = [], vistos = {};
    lista(txt, tope, nombre).forEach(function (x) {
      if (!vistos[x]) { vistos[x] = 1; out.push(x); }
    });
    return out;
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
  function numero(v, min, max, nombre) {
    var x = Number(String(v).trim().replace(',', '.'));
    if (!Number.isFinite(x)) throw Error((nombre || 'El valor') + ' debe ser un número.');
    if (min !== undefined && x < min) throw Error((nombre || 'El valor') + ' debe ser al menos ' + String(min).replace('.', ',') + '.');
    if (max !== undefined && x > max) throw Error((nombre || 'El valor') + ' no puede pasar de ' + String(max).replace('.', ',') + '.');
    return x;
  }

  /* ------------------------------------------------------------------
     4 · álgebra de conjuntos (el álgebra de sucesos)
     ------------------------------------------------------------------ */
  function U(A, B) {
    var out = A.slice();
    B.forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); });
    return out;
  }
  function I(A, B) { return A.filter(function (x) { return B.indexOf(x) >= 0; }); }
  function D(A, B) { return A.filter(function (x) { return B.indexOf(x) < 0; }); }
  function SD(A, B) { return U(D(A, B), D(B, A)); }
  function Co(E, A) { return D(E, A); }
  function subset(A, B) { return A.every(function (x) { return B.indexOf(x) >= 0; }); }
  function igual(A, B) { return A.length === B.length && subset(A, B); }
  function vacio(A) { return A.length === 0; }
  function incompatibles(A, B) { return I(A, B).length === 0; }

  /* Ordena un conjunto respetando el orden del espacio muestral E, de
     modo que {5,1,3} salga siempre como {1,3,5} si E = {1,…,6}. */
  function ordena(A, E) {
    if (!E) return A.slice();
    return E.filter(function (x) { return A.indexOf(x) >= 0; });
  }

  function setTxt(A, E) {
    var L = ordena(A, E);
    return L.length ? '{' + L.join(', ') + '}' : '\u2205';
  }
  function setTex(A, E) {
    var L = ordena(A, E);
    if (!L.length) return '\\varnothing';
    return '\\{' + L.map(function (x) { return String(x).replace(/([#%&_])/g, '\\$1'); }).join(',\\, ') + '\\}';
  }

  /* Espacio de sucesos: todos los subconjuntos de E.
     Devuelve { lista, total, truncada }. Con |E| > 12 solo se cuenta. */
  function partes(E, tope) {
    tope = tope || 256;
    var n = E.length, total = Math.pow(2, n), out = [], truncada = false;
    if (n > 16) return { lista: [], total: total, truncada: true };
    for (var m = 0; m < total; m++) {
      if (out.length >= tope) { truncada = true; break; }
      var s = [];
      for (var i = 0; i < n; i++) if (m & (1 << i)) s.push(E[i]);
      out.push(s);
    }
    /* Orden pedagógico: primero por tamaño, luego por posición en E */
    out.sort(function (a, b) {
      if (a.length !== b.length) return a.length - b.length;
      for (var i = 0; i < a.length; i++) {
        var da = E.indexOf(a[i]), db = E.indexOf(b[i]);
        if (da !== db) return da - db;
      }
      return 0;
    });
    return { lista: out, total: total, truncada: truncada };
  }

  /* ------------------------------------------------------------------
     5 · evaluador de expresiones de sucesos
     Acepta:  A u B · A n B · A' · Ac · noA · A - B · A x B (simétrica)
              y también los símbolos ∪ ∩ \ Δ
     Se usa en los applets de operaciones y de De Morgan.
     ------------------------------------------------------------------ */
  function evalua(expr, sets, E) {
    var s = String(expr || '').trim();
    if (!s) throw Error('Escribe una expresión, por ejemplo A u B, A n B\' o (A u B)\'.');
    var i = 0;
    var src = s
      .replace(/\u222A/g, 'u').replace(/\u222B/g, 'n').replace(/\u2229/g, 'n')
      .replace(/\u2216/g, '-').replace(/\u0394/g, '^').replace(/\u2206/g, '^')
      .replace(/\bno\s*/gi, '')                     /* "no A" se marca abajo */
      .replace(/\s+/g, '');

    function peek() { return src.charAt(i); }
    function eat(c) { if (src.charAt(i) === c) { i++; return true; } return false; }

    function postfijos(v) {
      /* complementario escrito como A' o Ac o A^c */
      for (;;) {
        if (eat("'")) { v = Co(E, v); continue; }
        if (src.substr(i, 2) === '^c') { i += 2; v = Co(E, v); continue; }
        if (peek() === 'c' && !/[A-Za-z]/.test(src.charAt(i + 1) || '')) { i++; v = Co(E, v); continue; }
        return v;
      }
    }
    function atomo() {
      if (eat('(')) {
        var v = expresion();
        if (!eat(')')) throw Error('Falta un paréntesis de cierre en la expresión.');
        return postfijos(v);
      }
      var ch = peek();
      if (/[A-Za-z]/.test(ch)) {
        i++;
        var nom = ch.toUpperCase();
        if (nom === 'E') return postfijos(E.slice());
        if (!sets[nom]) throw Error('No sé qué es el suceso ' + nom + '. Define A, B (y C si lo usas).');
        return postfijos(sets[nom].slice());
      }
      throw Error('No entiendo el símbolo «' + ch + '». Usa A, B, C, u (unión), n (intersección), \u2032 (contrario), - (diferencia) y paréntesis.');
    }
    function expresion() {
      var v = atomo();
      for (;;) {
        if (eat('u') || eat('U') || eat('+')) { v = U(v, atomo()); continue; }
        if (eat('n') || eat('N') || eat('*')) { v = I(v, atomo()); continue; }
        if (eat('-')) { v = D(v, atomo()); continue; }
        if (eat('^')) { v = SD(v, atomo()); continue; }
        return v;
      }
    }
    var res = expresion();
    if (i < src.length) throw Error('Sobra algo al final de la expresión: «' + src.slice(i) + '».');
    return res;
  }

  /* ------------------------------------------------------------------
     6 · capa gráfica compartida
     ------------------------------------------------------------------ */
  var COL = {
    azul: '#1976d2', azulOsc: '#0d47a1', azulClaro: '#bbdefb',
    rojo: '#c62828', rojoClaro: '#ffcdd2',
    verde: '#2e7d32', verdeClaro: '#c8e6c9',
    naranja: '#e07b00', naranjaClaro: '#ffe0b2',
    morado: '#6a3d9a', moradoClaro: '#e1d3f0',
    teal: '#00695c', tealClaro: '#b2dfdb',
    eje: '#455a64', guia: '#cfd8dc', texto: '#263238', gris: '#78909c',
    fondo: '#ffffff', marco: '#90a4ae'
  };

  (function injectCss() {
    if (typeof document === 'undefined' || !document.head) return;
    if (document.getElementById('est4-svg-css')) return;
    var css =
      '.applet .ap-fig{margin:.5rem 0}' +
      '.applet .ap-fig svg{display:block;width:100%;max-width:100%;height:auto;background:#fff;' +
        'border:1px solid #d9e0e4;border-radius:6px}' +
      '.applet .ap-figcap{font-size:.86rem;color:#546e7a;margin:.3rem 0 0;line-height:1.45;text-align:center}' +
      '.applet .ap-legend{list-style:none;padding:0;margin:.4rem 0 0;display:flex;' +
        'flex-wrap:wrap;gap:.35rem 1rem;justify-content:center}' +
      '.applet .ap-legend li{display:flex;align-items:center;gap:.35rem;font-size:.88rem;color:#37474f}' +
      '.applet .ap-sw{width:.9rem;height:.9rem;border-radius:3px;display:inline-block;border:1px solid #90a4ae}';
    var st = document.createElement('style');
    st.id = 'est4-svg-css';
    st.textContent = css;
    document.head.appendChild(st);
  })();

  /* Las figuras se dibujan en un lienzo amplio y se escalan al 100 % del
     ancho disponible: con tipografías de 16-26 px se leen bien también
     proyectadas en clase. */
  function svgWrap(body, W, H, label, cap) {
    return '<div class="ap-fig"><svg role="img" aria-label="' + esc(label) +
      '" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">' +
      '<title>' + esc(label) + '</title>' + body + '</svg>' +
      (cap ? '<p class="ap-figcap">' + cap + '</p>' : '') + '</div>';
  }
  function txt(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.anchor || 'middle') +
      '" font-size="' + (o.size || 18) + '" font-weight="' + (o.weight || 'normal') +
      '" fill="' + (o.fill || COL.texto) + '"' +
      (o.family ? ' font-family="' + o.family + '"' : '') +
      (o.style ? ' font-style="' + o.style + '"' : '') + '>' + s + '</text>';
  }
  function line(x1, y1, x2, y2, col, w, dash) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
      '" stroke="' + (col || COL.eje) + '" stroke-width="' + (w || 1.6) +
      (dash ? '" stroke-dasharray="' + dash : '') + '" stroke-linecap="round"/>';
  }
  function rect(x, y, w, h, fill, stroke, o) {
    o = o || {};
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" rx="' + (o.r === undefined ? 8 : o.r) + '" fill="' + (fill || 'none') +
      '" stroke="' + (stroke || 'none') + '" stroke-width="' + (o.sw || 1.8) +
      (o.dash ? '" stroke-dasharray="' + o.dash : '') +
      (o.op !== undefined ? '" opacity="' + o.op : '') + '"/>';
  }
  function circle(cx, cy, r, fill, stroke, sw, op) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + (fill || 'none') +
      '" stroke="' + (stroke || COL.eje) + '" stroke-width="' + (sw === undefined ? 2 : sw) + '"' +
      (op !== undefined ? ' opacity="' + op + '"' : '') + '/>';
  }
  function path(d, col, w, fill, dash) {
    return '<path d="' + d + '" fill="' + (fill || 'none') + '" stroke="' + (col || COL.eje) +
      '" stroke-width="' + (w || 1.8) + (dash ? '" stroke-dasharray="' + dash : '') +
      '" stroke-linejoin="round" stroke-linecap="round"/>';
  }
  function leyenda(items) {
    var h = '<ul class="ap-legend">';
    items.forEach(function (it) {
      h += '<li><span class="ap-sw" style="background:' + it[0] + '"></span>' + it[1] + '</li>';
    });
    return h + '</ul>';
  }

  /* ------------------------------------------------------------------
     7 · diagramas de Venn por regiones
     Regiones atómicas con dos sucesos:  'a' 'b' 'ab' 'out'
     Con tres sucesos: 'a' 'b' 'c' 'ab' 'ac' 'bc' 'abc' 'out'
     spec = {
       n: 2|3,                       número de sucesos
       pinta: ['ab','out'],          regiones a colorear
       color: '#bbdefb',             color de relleno (o mapa región->color)
       A: [..], B: [..], C: [..],    elementos que se escriben dentro
       E: [..],                      espacio muestral (para el «resto»)
       nombres: ['A','B','C'],
       cap: 'texto al pie',
       label: 'descripción accesible'
     }
     ------------------------------------------------------------------ */
  function regiones(expr, n) {
    /* Traduce una expresión de sucesos a la lista de regiones atómicas,
       evaluándola sobre un espacio muestral artificial cuyos elementos
       son precisamente las regiones. */
    var mapa2 = { a: ['a'], b: ['b'], ab: ['ab'], out: ['out'] };
    var Es = n === 3 ? ['a', 'b', 'c', 'ab', 'ac', 'bc', 'abc', 'out']
                     : ['a', 'ab', 'b', 'out'];
    var sets = n === 3
      ? { A: ['a', 'ab', 'ac', 'abc'], B: ['b', 'ab', 'bc', 'abc'], C: ['c', 'ac', 'bc', 'abc'] }
      : { A: ['a', 'ab'], B: ['b', 'ab'] };
    void mapa2;
    return evalua(expr, sets, Es);
  }

  function venn(spec) {
    var n = spec.n || 2;
    var nom = spec.nombres || ['A', 'B', 'C'];
    var pinta = spec.pinta || [];
    var col = spec.color || COL.azulClaro;
    var colorDe = typeof col === 'string' ? function () { return col; } : function (r) { return col[r] || COL.azulClaro; };
    var id = uid('venn');
    var W = 760, H = n === 3 ? 520 : 400;

    /* geometría */
    var g;
    if (n === 2) {
      g = { A: { x: 300, y: 205, r: 150 }, B: { x: 460, y: 205, r: 150 } };
    } else {
      g = { A: { x: 300, y: 215, r: 155 }, B: { x: 460, y: 215, r: 155 }, C: { x: 380, y: 350, r: 155 } };
    }

    var defs = '<defs>';
    ['A', 'B', 'C'].slice(0, n).forEach(function (k) {
      defs += '<clipPath id="' + id + '-c' + k + '"><circle cx="' + g[k].x + '" cy="' + g[k].y +
              '" r="' + g[k].r + '"/></clipPath>';
    });
    /* Máscaras: blanco = se pinta, negro = se recorta */
    function mask(name, fuera) {
      var m = '<mask id="' + id + '-' + name + '">' +
              '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#fff"/>';
      fuera.forEach(function (k) {
        m += '<circle cx="' + g[k].x + '" cy="' + g[k].y + '" r="' + g[k].r + '" fill="#000"/>';
      });
      return m + '</mask>';
    }
    if (n === 2) {
      defs += mask('mNoB', ['B']) + mask('mNoA', ['A']) + mask('mNoAB', ['A', 'B']);
    } else {
      defs += mask('mNoBC', ['B', 'C']) + mask('mNoAC', ['A', 'C']) + mask('mNoAB', ['A', 'B']) +
              mask('mNoC', ['C']) + mask('mNoB', ['B']) + mask('mNoA', ['A']) +
              mask('mNoABC', ['A', 'B', 'C']);
    }
    defs += '</defs>';

    /* Cada región se pinta como un círculo (o el marco) recortado */
    function pintaRegion(r) {
      var f = colorDe(r);
      function disco(k, clips, maskName) {
        var s = '<circle cx="' + g[k].x + '" cy="' + g[k].y + '" r="' + g[k].r + '" fill="' + f + '"/>';
        (clips || []).forEach(function (c) { s = '<g clip-path="url(#' + id + '-c' + c + ')">' + s + '</g>'; });
        if (maskName) s = '<g mask="url(#' + id + '-' + maskName + ')">' + s + '</g>';
        return s;
      }
      if (r === 'out') {
        return '<g mask="url(#' + id + (n === 3 ? '-mNoABC' : '-mNoAB') + ')">' +
               rect(14, 14, W - 28, H - 28, f, 'none', { r: 12 }) + '</g>';
      }
      if (n === 2) {
        if (r === 'a')  return disco('A', null, 'mNoB');
        if (r === 'b')  return disco('B', null, 'mNoA');
        if (r === 'ab') return disco('B', ['A']);
      } else {
        if (r === 'a')   return disco('A', null, 'mNoBC');
        if (r === 'b')   return disco('B', null, 'mNoAC');
        if (r === 'c')   return disco('C', null, 'mNoAB');
        if (r === 'ab')  return '<g mask="url(#' + id + '-mNoC)">' + disco('B', ['A']) + '</g>';
        if (r === 'ac')  return '<g mask="url(#' + id + '-mNoB)">' + disco('C', ['A']) + '</g>';
        if (r === 'bc')  return '<g mask="url(#' + id + '-mNoA)">' + disco('C', ['B']) + '</g>';
        if (r === 'abc') return disco('C', ['A', 'B']);
      }
      return '';
    }

    var body = defs;
    /* marco del espacio muestral */
    body += rect(14, 14, W - 28, H - 28, COL.fondo, COL.marco, { r: 12, sw: 2.2 });
    pinta.forEach(function (r) { body += pintaRegion(r); });

    /* circunferencias por encima del relleno */
    ['A', 'B', 'C'].slice(0, n).forEach(function (k, idx) {
      var c = [COL.azulOsc, COL.rojo, COL.verde][idx];
      body += circle(g[k].x, g[k].y, g[k].r, 'none', c, 3);
    });

    /* Rótulos de los sucesos, fuera de las circunferencias.
       Un nombre que empieza por «~» se dibuja con barra encima
       (el suceso contrario), y si es largo se reduce el tamaño y se
       recoloca para que no se salga del marco ni pise los círculos. */
    function rotulo(x, y, nombre, color, size) {
      var s = String(nombre === undefined || nombre === null ? '' : nombre);
      if (!s) return '';
      var barra = s.charAt(0) === '~';
      if (barra) s = s.slice(1);
      var sz = size, maxw = 190;
      if (anchoTxt(s, sz) > maxw) sz = Math.max(17, Math.floor(maxw / (s.length * 0.58)));
      var mitad = anchoTxt(s, sz) / 2;
      var xx = Math.min(Math.max(x, 26 + mitad), W - 26 - mitad);
      var o = txt(xx, y, esc(s), { size: sz, weight: 700, fill: color });
      if (barra) o += line(xx - mitad, y - sz * 0.96, xx + mitad, y - sz * 0.96, color, Math.max(2, sz * 0.09));
      return o;
    }
    if (n === 2) {
      body += rotulo(g.A.x - g.A.r + 26, g.A.y - g.A.r + 40, nom[0], COL.azulOsc, 30);
      body += rotulo(g.B.x + g.B.r - 26, g.B.y - g.B.r + 40, nom[1], COL.rojo, 30);
    } else {
      body += rotulo(g.A.x - g.A.r + 26, g.A.y - g.A.r + 40, nom[0], COL.azulOsc, 28);
      body += rotulo(g.B.x + g.B.r - 26, g.B.y - g.B.r + 40, nom[1], COL.rojo, 28);
      body += rotulo(g.C.x, g.C.y + g.C.r - 14, nom[2], COL.verde, 28);
    }
    body += txt(34, 44, 'E', { size: 26, weight: 700, fill: COL.gris, anchor: 'start' });

    /* elementos escritos dentro de cada región */
    if (spec.E) {
      var A = spec.A || [], B = spec.B || [], Cc = spec.C || [];
      var centros = n === 2
        ? { a: [g.A.x - 78, g.A.y], b: [g.B.x + 78, g.B.y], ab: [(g.A.x + g.B.x) / 2, g.A.y], out: [W - 90, H - 46] }
        : { a: [g.A.x - 88, g.A.y - 40], b: [g.B.x + 88, g.B.y - 40], c: [g.C.x, g.C.y + 78],
            ab: [(g.A.x + g.B.x) / 2, g.A.y - 62], ac: [g.A.x - 22, g.C.y - 18], bc: [g.B.x + 22, g.C.y - 18],
            abc: [(g.A.x + g.B.x) / 2, g.C.y - 66], out: [W - 90, 52] };
      var enR = {};
      spec.E.forEach(function (x) {
        var inA = A.indexOf(x) >= 0, inB = B.indexOf(x) >= 0, inC = Cc.indexOf(x) >= 0;
        var r;
        if (n === 2) r = inA && inB ? 'ab' : inA ? 'a' : inB ? 'b' : 'out';
        else r = inA && inB && inC ? 'abc' : inA && inB ? 'ab' : inA && inC ? 'ac' : inB && inC ? 'bc'
               : inA ? 'a' : inB ? 'b' : inC ? 'c' : 'out';
        (enR[r] = enR[r] || []).push(x);
      });
      Object.keys(centros).forEach(function (r) {
        var L = enR[r] || [];
        if (!L.length) return;
        var porFila = L.length > 8 ? 4 : 3;
        for (var f = 0; f * porFila < L.length; f++) {
          var trozo = L.slice(f * porFila, (f + 1) * porFila).join('  ');
          body += txt(centros[r][0], centros[r][1] + f * 26 - (Math.ceil(L.length / porFila) - 1) * 13,
                      esc(trozo), { size: 20, weight: 600, fill: COL.texto });
        }
      });
    }

    return svgWrap(body, W, H, spec.label || 'Diagrama de Venn', spec.cap);
  }

  /* ------------------------------------------------------------------
     8 · árbol ponderado
     raiz = { hijos: [ { lab:'B', p:{n:3,d:5}, hijos:[ ... ] } ] }
     opts = { cap, label, ancho, hojaTex(nodoCamino) }
     Cada hoja muestra el producto de las probabilidades del camino.
     ------------------------------------------------------------------ */
  function hojas(nodo) {
    if (!nodo.hijos || !nodo.hijos.length) return 1;
    return nodo.hijos.reduce(function (a, h) { return a + hojas(h); }, 0);
  }
  function profundidad(nodo) {
    if (!nodo.hijos || !nodo.hijos.length) return 0;
    return 1 + Math.max.apply(null, nodo.hijos.map(profundidad));
  }

  /* oscurece un color hexadecimal si es demasiado claro, para que el texto
     de la etiqueta de rama mantenga contraste sobre fondo blanco */
  function oscureceSiClaro(hex) {
    var m = /^#([0-9a-f]{6})$/i.exec(String(hex || ''));
    if (!m) return hex;
    var v = parseInt(m[1], 16);
    var r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
    var lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    if (lum <= 0.52) return hex;
    var k = 0.45 / lum;
    if (k > 1) k = 1;
    function cc(x) { var y = Math.round(x * k); return (y < 16 ? '0' : '') + y.toString(16); }
    return '#' + cc(r) + cc(g) + cc(b);
  }
  /* Anchura aproximada de un rótulo en píxeles. La fuente del SVG es
     bold sans-serif: 0,58 · tamaño por carácter es una cota fiable. */
  function anchoTxt(s, size) {
    return String(s === undefined || s === null ? '' : s).length * size * 0.58;
  }

  /* Media anchura y media altura de la caja de un nodo. Los nodos son
     píldoras (rectángulos de esquinas redondas) en vez de círculos: así
     un rótulo largo ensancha la caja pero no la hace crecer a lo alto,
     que es lo que antes se salía del lienzo y se solapaba. */
  function cajaNodo(nodo, esHoja) {
    var lab = nodo.lab === undefined || nodo.lab === null ? '' : String(nodo.lab);
    if (!lab) return { hw: esHoja ? 15 : 17, hh: esHoja ? 15 : 17 };
    return { hw: Math.max(esHoja ? 19 : 21, anchoTxt(lab, 18) / 2 + 13), hh: esHoja ? 22 : 24 };
  }

  function arbol(raiz, opts) {
    opts = opts || {};
    var nh = hojas(raiz), prof = profundidad(raiz);
    var pasoY = Math.max(opts.pasoY || 62, 62);
    var body = '';
    var y = 0;

    /* 1) medir: caja de cada nodo, caja mayor por nivel y anchura que
          necesitan los rótulos de las hojas a su derecha. */
    var anchoNivel = [], altoNivel = [], anchoHojas = 0;
    function mide(nodo, nivel) {
      var esHoja = !nodo.hijos || !nodo.hijos.length;
      var c = cajaNodo(nodo, esHoja);
      nodo._hw = c.hw; nodo._hh = c.hh;
      if (!(anchoNivel[nivel] >= c.hw)) anchoNivel[nivel] = c.hw;
      if (!(altoNivel[nivel] >= c.hh)) altoNivel[nivel] = c.hh;
      if (esHoja) {
        var etq = nodo.camino !== undefined ? nodo.camino : '';
        var s = nodo.hojaTxt !== undefined ? nodo.hojaTxt : '';
        var a = Math.max(anchoTxt(etq, 17), anchoTxt(s, 17), anchoTxt('00/00', 17));
        if (a > anchoHojas) anchoHojas = a;
      }
      (nodo.hijos || []).forEach(function (h) { mide(h, nivel + 1); });
    }
    mide(raiz, 0);

    /* 2) posición horizontal de cada nivel: la caja mayor del nivel
          anterior, un hueco para la etiqueta de la rama y la caja de
          este nivel. Así nunca se pisan aunque los rótulos sean largos. */
    var hueco = opts.pasoX ? Math.max(110, opts.pasoX - 140) : 130;
    var xs = [24 + (anchoNivel[0] || 17)];
    for (var k = 1; k <= prof; k++) {
      xs[k] = xs[k - 1] + (anchoNivel[k - 1] || 17) + hueco + (anchoNivel[k] || 17);
    }

    function coloca(nodo, nivel, prod) {
      nodo._x = xs[nivel];
      if (!nodo.hijos || !nodo.hijos.length) {
        var yy = 45 + (y + 0.5) * pasoY; y++;
        nodo._y = yy;
        nodo._prod = prod;
        return yy;
      }
      var ys = nodo.hijos.map(function (h) {
        return coloca(h, nivel + 1, h.p ? fProd(prod, h.p) : prod);
      });
      nodo._y = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
      nodo._prod = prod;
      return nodo._y;
    }
    coloca(raiz, 0, frac(1, 1));

    /* 3) lienzo: lo que de verdad ocupa el dibujo, más el margen del
          rótulo de comprobación de la esquina. */
    var margenDer = opts.margenDer === undefined ? anchoHojas + 26 : opts.margenDer;
    var W = xs[prof] + (anchoNivel[prof] || 17) + margenDer;
    var conSuma = opts.comprueba !== false;
    if (conSuma) W = Math.max(W, 460);
    var H = Math.max(200, 45 + nh * pasoY + (conSuma ? 48 : 24));

    var suma = frac(0, 1);
    function pinta(nodo) {
      (nodo.hijos || []).forEach(function (h) {
        var col = h.color || COL.azul;
        body += line(nodo._x + nodo._hw, nodo._y, h._x - h._hw, h._y, col, 2.4);
        /* etiqueta de la probabilidad de la rama, sobre el segmento */
        var mx = (nodo._x + nodo._hw + h._x - h._hw) / 2, my = (nodo._y + h._y) / 2;
        var dy = h._y > nodo._y ? 20 : -12;
        if (h.p) {
          var et = String(h.pTxt || fracTxt(h.p));
          var aw = Math.max(80, anchoTxt(et, 18) + 22);
          body += rect(mx - aw / 2, my + dy - 19, aw, 26, '#ffffff', '#e0e6ea', { r: 6, sw: 1 });
          body += txt(mx, my + dy, esc(et), { size: 18, weight: 700, fill: oscureceSiClaro(col) });
        }
        pinta(h);
      });
      /* nodo: píldora ajustada al rótulo */
      var esHoja = !nodo.hijos || !nodo.hijos.length;
      body += rect(nodo._x - nodo._hw, nodo._y - nodo._hh, 2 * nodo._hw, 2 * nodo._hh,
                   esHoja ? '#ffffff' : COL.azulClaro, COL.azulOsc, { r: nodo._hh, sw: 2.4 });
      if (nodo.lab !== undefined && nodo.lab !== null && String(nodo.lab) !== '') {
        body += txt(nodo._x, nodo._y + 7, esc(nodo.lab), { size: 18, weight: 700, fill: COL.azulOsc });
      }
      if (esHoja) {
        /* El rótulo ya va dentro de la píldora: a la derecha solo se
           escribe el camino, si el applet lo pide, y el valor de la hoja. */
        var etq = nodo.camino !== undefined ? nodo.camino : '';
        var s = (nodo.hojaTxt !== undefined ? nodo.hojaTxt : fracTxt(nodo._prod));
        var xr = nodo._x + nodo._hw + 15;
        if (String(etq) !== '')
          body += txt(xr, nodo._y - 4, esc(String(etq)), { size: 17, weight: 700, anchor: 'start', fill: COL.texto });
        if (String(s) !== '')
          body += txt(xr, nodo._y + (String(etq) !== '' ? 20 : 6), esc(s), { size: 17, weight: 600, anchor: 'start', fill: COL.verde });
        suma = fSuma(suma, nodo._prod);
      }
    }
    pinta(raiz);

    if (conSuma) {
      var ok = fIgual(suma, frac(1, 1));
      body += txt(W - 20, H - 18,
        'Suma de todas las ramas: ' + esc(fracTxt(suma)) + (ok ? '  \u2713' : '  \u2717'),
        { size: 17, weight: 700, anchor: 'end', fill: ok ? COL.verde : COL.rojo });
    }
    return svgWrap(body, W, H, opts.label || 'Árbol de probabilidades', opts.cap);
  }

  /* ------------------------------------------------------------------
     9 · armazón estándar de applet
     shell(node, titulo, instrucciones, campos, calcula)
     campos: {id, label, type:'number'|'range'|'text'|'select'|'check'|
              'area'|'presets', ...}
     El rótulo de los botones se pone con textContent: nunca lleva $...$.
     ------------------------------------------------------------------ */
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
    var extra = {};

    (fields || []).forEach(function (f) {
      if (f.type === 'presets') {
        f.list.forEach(function (p) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'ap-chip';
          b.textContent = p.label;
          if (p.title) b.title = p.title;
          b.addEventListener('click', function () {
            if (p.apply) p.apply(ctl, extra);
            run();
          });
          chips.appendChild(b);
        });
        return;
      }
      if (f.type === 'boton') {
        var bb = document.createElement('button');
        bb.type = 'button';
        bb.className = 'ap-chip ap-chip-accion';
        bb.textContent = f.label;
        bb.addEventListener('click', function () {
          if (f.onClick) f.onClick(ctl, extra);
          run();
        });
        chips.appendChild(bb);
        ctl[f.id] = bb;
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
        if (f.placeholder) el.placeholder = f.placeholder;
        lab.appendChild(el);
      } else {
        el = document.createElement('textarea');
        el.rows = f.rows || 2; el.value = f.value || ''; el.spellcheck = false;
        el.className = 'mx-in';
        if (f.placeholder) el.placeholder = f.placeholder;
        lab.appendChild(el);
      }
      ctl[f.id] = el;
      inp.appendChild(lab);
      el.addEventListener('input', run);
      el.addEventListener('change', run);
    });
    if (!chips.children.length) chips.style.display = 'none';
    if (!inp.children.length) inp.style.display = 'none';

    function values() {
      var v = {};
      Object.keys(ctl).forEach(function (k) {
        var e = ctl[k];
        if (!e.tagName || e.tagName === 'BUTTON') return;
        v[k] = e.type === 'checkbox' ? e.checked : e.value;
      });
      return v;
    }
    function run() {
      try {
        var h = compute(values(), ctl, extra);
        out.innerHTML = texifica(h === undefined ? '' : h);
        tex(out);
      } catch (e) {
        out.innerHTML = '<div class="mx-bad ap-err">' + esc(e.message) + '</div>';
        window.EST4.log.push({ applet: title, error: e.message });
      }
    }
    run();
    return { run: run, ctl: ctl, out: out, extra: extra, node: node };
  }

  /* Ficha con el resultado destacado */
  function resultado(valor, etiqueta) {
    return '<div class="ap-res"><span class="ap-res-num">' + valor + '</span>' +
           '<span class="ap-res-lab">' + etiqueta + '</span></div>';
  }
  /* Tarjeta con título */
  function tarjeta(tit, cuerpo, clase) {
    return '<div class="ap-card ' + (clase || '') + '"><div class="ap-card-tit">' + tit + '</div>' +
           cuerpo + '</div>';
  }
  /* Aviso, nota y acierto/error */
  function nota(s)  { return '<div class="mx-info">' + s + '</div>'; }
  function aviso(s) { return '<div class="ap-warn">' + s + '</div>'; }
  function bien(s)  { return '<div class="ap-ok">' + s + '</div>'; }
  function mal(s)   { return '<div class="mx-bad">' + s + '</div>'; }
  function insignia(txtS, tipo) { return '<span class="ap-badge ' + (tipo || 'info') + '">' + txtS + '</span>'; }
  /* Fila de llaves-valor */
  function kvs(pares) {
    var h = '<div class="ap-kvs">';
    pares.forEach(function (p) { h += '<span class="ap-kv">' + p[0] + ': <b>' + p[1] + '</b></span>'; });
    return h + '</div>';
  }
  /* Tabla sencilla: cab = [..], filas = [[..], ..] */
  function tabla(cab, filas, clase) {
    var h = '<table class="ap-tbl ap-prob ' + (clase || '') + '"><thead><tr>';
    cab.forEach(function (c) { h += '<th>' + c + '</th>'; });
    h += '</tr></thead><tbody>';
    filas.forEach(function (f) {
      h += '<tr' + (f.clase ? ' class="' + f.clase + '"' : '') + '>';
      (f.celdas || f).forEach(function (c, i) {
        h += i === 0 ? '<th>' + c + '</th>' : '<td>' + c + '</td>';
      });
      h += '</tr>';
    });
    return h + '</tbody></table>';
  }
  /* Cajas con los elementos de un conjunto */
  function fichas(L, clase) {
    var h = '<div class="ap-tuplas">';
    (L || []).forEach(function (x) {
      var s = Array.isArray(x) ? x.join('') : x;
      h += '<span class="ap-tup ' + (clase || '') + '">' + esc(s) + '</span>';
    });
    if (!L || !L.length) h += '<span class="ap-tup ap-vacio">\u2205 (ningún elemento)</span>';
    return h + '</div>';
  }

  /* Azar reproducible: generador congruencial con semilla, para que un
     experimento simulado se pueda repetir exactamente en clase. */
  function rng(semilla) {
    var s = (semilla || 1) % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }

  /* ------------------------------------------------------------------
     9 bis · piezas de la parte 2 (4.6 a 4.10)
     ------------------------------------------------------------------ */

  /* --- tabla de contingencia con marginales -------------------------
     spec = {
       cols:  ['Ojos claros', 'Ojos oscuros'],
       filas: [ {lab:'Chicas', celdas:[8, 4]}, {lab:'Chicos', celdas:[3, 7]} ],
       capC:  'Color de ojos',        rótulo de la cabecera de columnas
       capF:  'Sexo',                 rótulo de la esquina
       totales: true,                 fila y columna de totales
       tex: false,                    si true, cada celda va en KaTeX
       resalta: [{f:0,c:1}] | {fila:0} | {col:1} | [{fila:0},{col:1}],
       cap: 'pie de la tabla'
     }
     Las celdas pueden ser números o cadenas ya formateadas.
     ------------------------------------------------------------------ */
  function contingencia(spec) {
    spec = spec || {};
    var cols = spec.cols || [], filas = spec.filas || [];
    var conTot = spec.totales !== false;
    var marca = spec.resalta === undefined ? [] :
                (spec.resalta instanceof Array ? spec.resalta : [spec.resalta]);

    function celdaMarcada(i, j) {
      for (var k = 0; k < marca.length; k++) {
        var m = marca[k];
        if (m.f === i && m.c === j) return 'ap-hl';
        if (m.fila === i && m.c === undefined && m.f === undefined) return 'ap-hlb';
        if (m.col === j && m.c === undefined && m.f === undefined) return 'ap-hlb';
      }
      return '';
    }
    /* Una celda puede ser: un número, una fracción {n,d}, una cadena de
       texto, o HTML ya construido (por ejemplo con K() o <b>). Si trae
       marcas HTML se inserta tal cual; si no, se escapa o se pasa por
       KaTeX según spec.tex. Así nunca se envuelve dos veces. */
    function pinta(v) {
      if (v === undefined || v === null) return '';
      if (typeof v === 'object' && v.n !== undefined && v.d !== undefined) return K(fracTex(v));
      var s = String(v);
      if (s.indexOf('<') >= 0) return s;
      if (!spec.tex) return texifica(esc(s));
      /* Con tex:true la cadena puede ser TeX suelto ('\\overline{B}') o
         texto normal ('Total'). Solo se pasa por KaTeX si trae marcas
         de TeX; el texto normal se escapa para que no salga en cursiva
         ni pierda los espacios. */
      return (/[\\^_{}]/.test(s) || /^[A-Za-z][0-9']?$/.test(s)) ? K(s) : texifica(esc(s));
    }
    function suma(vals) {
      var s = 0, hay = true;
      vals.forEach(function (v) {
        var x = (typeof v === 'object' && v !== null && v.n !== undefined) ? null : Number(v);
        if (x === null || !Number.isFinite(x)) hay = false; else s += x;
      });
      return hay ? s : '';
    }

    var h = '<div class="ap-tblwrap"><table class="ap-tbl ap-cont"><thead><tr>' +
      '<th class="ap-corner">' + texifica(esc(spec.capF || '')) + '</th>';
    cols.forEach(function (c) { h += '<th>' + pinta(c) + '</th>'; });
    if (conTot) h += '<th class="ap-tot">Total</th>';
    h += '</tr></thead><tbody>';

    var totCol = [], i, j;
    for (j = 0; j < cols.length; j++) totCol.push([]);
    filas.forEach(function (f, ii) {
      h += '<tr><th>' + pinta(f.lab) + '</th>';
      for (j = 0; j < cols.length; j++) {
        var cl = celdaMarcada(ii, j);
        h += '<td' + (cl ? ' class="' + cl + '"' : '') + '>' + pinta(f.celdas[j]) + '</td>';
        totCol[j].push(f.celdas[j]);
      }
      if (conTot) h += '<td class="ap-tot">' + pinta(f.total !== undefined ? f.total : suma(f.celdas)) + '</td>';
      h += '</tr>';
    });
    if (conTot) {
      h += '<tr class="ap-totrow"><th class="ap-tot">Total</th>';
      var granTotal = 0, hayGran = true;
      for (j = 0; j < cols.length; j++) {
        var s = suma(totCol[j]);
        h += '<td class="ap-tot">' + pinta(s) + '</td>';
        if (s === '') hayGran = false; else granTotal += s;
      }
      h += '<td class="ap-tot ap-gran">' + pinta(spec.gran !== undefined ? spec.gran : (hayGran ? granTotal : '')) + '</td></tr>';
    }
    h += '</tbody></table></div>';
    if (spec.capC) h = '<p class="ap-tblcap">' + (spec.capC.indexOf('<') >= 0 ? spec.capC : texifica(esc(spec.capC))) + '</p>' + h;
    if (spec.cap) h += '<p class="ap-figcap">' + spec.cap + '</p>';
    return h;
  }

  /* --- barras de aportación de cada causa (lectura de Bayes) ---------
     spec = { causas:[{lab, prior:{n,d}, cond:{n,d}, color}], efecto:'D', cap }
     Cada barra mide prior*cond; su etiqueta es la probabilidad a
     posteriori, es decir, la parte del total que le corresponde.
     ------------------------------------------------------------------ */
  function barrasBayes(spec) {
    spec = spec || {};
    var cs = spec.causas || [], efecto = spec.efecto || 'B';
    var apo = cs.map(function (c) { return fProd(c.prior, c.cond); });
    var total = apo.reduce(function (a, p) { return fSuma(a, p); }, frac(0, 1));
    var filaH = 92, H = 90 + cs.length * filaH + 66;
    var ancho = 560, x0 = 230;
    cs.forEach(function (c) { x0 = Math.max(x0, anchoTxt(c.lab, 21) + 30); });
    /* el lienzo se ensancha hasta que quepa la etiqueta más larga: así
       ningún texto queda cortado por el borde del SVG */
    var largo = 0;
    cs.forEach(function (c, i) {
      var post = fIgual(total, frac(0, 1)) ? frac(0, 1) : fDiv(apo[i], total);
      largo = Math.max(largo,
        fracTxt(apo[i]).length * 11,
        ('a posteriori ' + fracTxt(post) + ' = ' + pct(fVal(post), 1)).length * 9);
    });
    var W = Math.max(1000, x0 + ancho + 24 + largo + 16);
    var body = txt(x0 - 12, 44, 'Aportación de cada causa a ' + esc(efecto),
      { size: 20, weight: 700, anchor: 'start', fill: COL.texto });
    var paleta = [COL.azul, COL.naranja, COL.morado, COL.teal, COL.verde, COL.rojo];
    var maxV = 0;
    apo.forEach(function (p) { maxV = Math.max(maxV, fVal(p)); });
    if (maxV <= 0) maxV = 1;

    cs.forEach(function (c, i) {
      var y = 76 + i * filaH;
      var v = fVal(apo[i]);
      var w = Math.max(4, ancho * v / maxV);
      var col = c.color || paleta[i % paleta.length];
      body += txt(x0 - 18, y + 34, esc(c.lab), { size: 21, weight: 700, anchor: 'end', fill: COL.texto });
      body += rect(x0, y, w, 50, col, 'none', { r: 6, op: 0.9 });
      body += rect(x0, y, ancho, 50, 'none', COL.guia, { r: 6, sw: 1 });
      body += txt(x0 + w + 14, y + 22, fracTxt(apo[i]),
        { size: 19, weight: 700, anchor: 'start', fill: col });
      var post = fIgual(total, frac(0, 1)) ? frac(0, 1) : fDiv(apo[i], total);
      body += txt(x0 + w + 14, y + 44, 'a posteriori ' + fracTxt(post) + ' = ' + pct(fVal(post), 1),
        { size: 17, weight: 600, anchor: 'start', fill: COL.gris });
    });
    var yF = 76 + cs.length * filaH + 18;
    body += line(x0, yF - 8, x0 + ancho, yF - 8, COL.guia, 1.4);
    body += txt(x0 - 18, yF + 22, 'P(' + esc(efecto) + ')',
      { size: 21, weight: 700, anchor: 'end', fill: COL.verde });
    body += txt(x0, yF + 22, fracTxt(total) + '  =  ' + nc(fVal(total), 4) + '  =  ' + pct(fVal(total), 2),
      { size: 20, weight: 700, anchor: 'start', fill: COL.verde });
    return svgWrap(body, W, H, 'Aportación de cada causa', spec.cap);
  }

  /* --- barras horizontales genéricas --------------------------------
     spec = { items:[{lab, valor, color, nota}], max, unidad, cap, label }
     ------------------------------------------------------------------ */
  function barras(spec) {
    spec = spec || {};
    var it = spec.items || [];
    var filaH = 74, H = 46 + it.length * filaH + 26;
    var ancho = 600, x0 = 210;
    /* margen izquierdo a medida del rótulo más largo: con etiquetas de
       más de ~15 caracteres se salían por la izquierda del lienzo */
    it.forEach(function (o) { x0 = Math.max(x0, anchoTxt(o.lab, 21) + 30); });
    /* lienzo ancho a medida de la etiqueta más larga, para que las notas
       de la derecha no se corten */
    var largo = 0;
    it.forEach(function (o) {
      var etq = (o.txt !== undefined) ? String(o.txt) : (nc(Number(o.valor) || 0, 4) + (spec.unidad ? ' ' + spec.unidad : ''));
      largo = Math.max(largo, etq.length * 12, (o.nota ? String(o.nota).length * 9 : 0));
    });
    var W = Math.max(1000, x0 + ancho + 24 + largo + 16);
    var maxV = spec.max;
    if (maxV === undefined) {
      maxV = 0;
      it.forEach(function (o) { maxV = Math.max(maxV, Number(o.valor) || 0); });
    }
    if (!(maxV > 0)) maxV = 1;
    var paleta = [COL.azul, COL.naranja, COL.morado, COL.teal, COL.verde, COL.rojo];
    var body = '';
    it.forEach(function (o, i) {
      var y = 30 + i * filaH;
      var v = Number(o.valor) || 0;
      var w = Math.max(3, ancho * v / maxV);
      var col = o.color || paleta[i % paleta.length];
      body += txt(x0 - 18, y + 32, esc(o.lab), { size: 21, weight: 700, anchor: 'end', fill: COL.texto });
      body += rect(x0, y, ancho, 46, '#f4f7f9', COL.guia, { r: 6, sw: 1 });
      body += rect(x0, y, w, 46, col, 'none', { r: 6, op: 0.92 });
      var etq = (o.txt !== undefined) ? o.txt : nc(v, 4) + (spec.unidad ? ' ' + spec.unidad : '');
      body += txt(x0 + ancho + 16, y + 24, esc(etq),
        { size: 20, weight: 700, anchor: 'start', fill: col });
      if (o.nota) {
        body += txt(x0 + ancho + 16, y + 44, esc(o.nota),
          { size: 16, weight: 600, anchor: 'start', fill: COL.gris });
      }
    });
    return svgWrap(body, W, H, spec.label || 'Diagrama de barras', spec.cap);
  }

  /* --- pictograma de 100 (o n) casillas: la tasa base a la vista ----
     spec = { grupos:[{lab, n, color}], cols, cap, label }
     ------------------------------------------------------------------ */
  function pictograma(spec) {
    spec = spec || {};
    var g = spec.grupos || [];
    var totalN = g.reduce(function (a, o) { return a + (Number(o.n) || 0); }, 0);
    var cols = spec.cols || 20;
    var filas = Math.max(1, Math.ceil(totalN / cols));
    var lado = 34, hueco = 6;
    var W = 40 + cols * (lado + hueco), H = 34 + filas * (lado + hueco) + 26;
    var paleta = [COL.rojo, COL.azulClaro, COL.naranja, COL.teal, COL.morado];
    var body = '', k = 0;
    g.forEach(function (o, gi) {
      var col = o.color || paleta[gi % paleta.length];
      var n = Number(o.n) || 0;
      for (var i = 0; i < n; i++, k++) {
        var f = Math.floor(k / cols), c = k % cols;
        body += rect(20 + c * (lado + hueco), 22 + f * (lado + hueco), lado, lado,
          col, '#ffffff', { r: 5, sw: 1.4 });
      }
    });
    var leyendas = g.map(function (o, gi) {
      return [o.color || paleta[gi % paleta.length],
        esc(o.lab) + ': ' + nc(Number(o.n) || 0, 0) +
        (totalN ? ' de ' + nc(totalN, 0) : '')];
    });
    return svgWrap(body, W, H, spec.label || 'Pictograma de frecuencias', spec.cap) +
      leyenda(leyendas);
  }

  /* ------------------------------------------------------------------
     10 · registrador provisional
     Si un módulo -a o -b no llega a cargarse, en lugar de un applet
     fantasma aparece un aviso claro con la causa.
     ------------------------------------------------------------------ */
  var PENDIENTES = [
    /* módulo A · apartados 4.1, 4.2 y 4.3 */
    'deterministaAzar', 'clasificador', 'frecuencias', 'falacia',
    'espacioMuestral', 'arbolMuestral', 'tablaDoble', 'cuentaMuestral',
    'dalembert', 'tresMonedas', 'devolucion',
    'tiposSuceso', 'vennTipos', 'relaciones', 'partesE',
    'trampaElemental', 'traductor',
    /* módulo B · apartados 4.4 y 4.5 */
    'union', 'oExclusivo', 'interseccion', 'contrario', 'diferencia', 'simetrica',
    'vennLab', 'propiedades', 'morgan', 'morganDado', 'morganLoteria',
    'tablaMaestra',
    'arbolPonderado', 'reglasArbol', 'dosUrnas',
    'reemplazamiento', 'barajaFiguras', 'arbolNoUniforme',
    'fermatRoberval', 'entrenador',
    /* módulo C · apartados 4.6 y 4.7 */
    'equiprobable', 'laplace', 'urnaTresColores', 'barajaLaplace', 'ambiguedad',
    'quiniela', 'primitiva', 'dosEtapas', 'dadoCargado', 'quinielaAsimetrica',
    'frecuentista', 'razonInsuficiente',
    'rango', 'sumaElementales', 'alMenos', 'sumaIncompatibles', 'sumaGeneral',
    'cuatroRegiones', 'haciaAtras', 'consecuencias',
    /* módulo D · apartados 4.8, 4.9 y 4.10 */
    'condicional', 'clase22', 'condProb', 'contingenciaLab', 'hospital',
    'tecnologias', 'reglaProducto', 'biblioteca', 'independencia',
    'testIndependencia', 'incompatibleVsIndependiente', 'asimetria',
    'fiscal', 'sistemaCompleto', 'total', 'tresFactorias', 'urnasMoneda',
    'cincoPasos', 'bayes', 'bayesFactorias', 'testMedico', 'tasaBase',
    'montyHall', 'actualizaCreencias', 'mapaTema'
  ];
  PENDIENTES.forEach(function (k) {
    R[k] = function (n) {
      n.classList.add('applet');
      n.innerHTML =
        '<h4 class="mx-title">Applet · ' + esc(k) + '</h4>' +
        '<div class="mx-bad ap-err">Este applet vive en uno de los módulos ' +
        '<code>est4-applets-a.js</code>, <code>-b.js</code>, <code>-c.js</code> o ' +
        '<code>-d.js</code>. Comprueba que los cuatro se cargan después de ' +
        '<code>est4-applets.js</code> en <code>assets/_scripts.html</code>.</div>';
    };
  });

  /* ------------------------------------------------------------------
     11 · applet de diagnóstico (vive en el núcleo)
     ------------------------------------------------------------------ */
  R.diagnostico = function (node) {
    node.classList.add('applet');
    var claves = Object.keys(R).sort();
    var filas = [
      ['KaTeX local', !!window.katex],
      ['Núcleo est4-applets.js', true],
      ['Módulo est4-applets-a.js', window.EST4 && window.EST4.extraA === true],
      ['Módulo est4-applets-b.js', window.EST4 && window.EST4.extraB === true],
      ['Módulo est4-applets-c.js', window.EST4 && window.EST4.extraC === true],
      ['Módulo est4-applets-d.js', window.EST4 && window.EST4.extraD === true],
      ['Fracciones exactas (1/3 + 1/6 = 1/2)',
        (function () { var s = fSuma(frac(1, 3), frac(1, 6)); return s.n === 1 && s.d === 2; })()],
      ['Álgebra de sucesos (De Morgan)',
        (function () {
          var E = ['1', '2', '3', '4', '5', '6'], A = ['2', '4', '6'], B = ['1', '2', '3'];
          return igual(Co(E, U(A, B)), I(Co(E, A), Co(E, B)));
        })()],
      ['Combinatoria exacta (C(49,6) = 13 983 816)',
        (function () { try { return C(49, 6) === 13983816n; } catch (e) { return false; } })()]
    ];
    var h = '<h4 class="mx-title">Applet · Diagnóstico técnico</h4>' +
      '<div class="mx-instr">Comprueba que el tema ha cargado bien. Si alguna fila sale en rojo, revisa el orden de carga en <code>assets/_scripts.html</code>.</div>' +
      '<table class="ap-tbl ap-prob"><thead><tr><th>Comprobación</th><th>Estado</th></tr></thead><tbody>';
    filas.forEach(function (f) {
      h += '<tr><th>' + esc(f[0]) + '</th><td><span class="ap-badge ' +
           (f[1] ? 'si">correcto' : 'no">falla') + '</span></td></tr>';
    });
    h += '</tbody></table>' +
      kvs([['Applets registrados', claves.length],
           ['Errores capturados', (window.EST4 && window.EST4.log.length) || 0]]);
    node.innerHTML = h;
    tex(node);
  };

  /* ------------------------------------------------------------------
     12 · API pública, arranque y espera de los módulos
     ------------------------------------------------------------------ */
  window.EST4 = {
    registry: R,
    /* texto y KaTeX */
    esc: esc, K: K, KD: KD, tex: tex, texifica: texifica, uid: uid,
    fmt: fmt, nc: nc, kf: kf, pct: pct,
    /* combinatoria */
    fact: fact, V: V, VR: VR, C: C, CR: CR, bigTxt: bigTxt, bigTex: bigTex,
    /* fracciones */
    frac: frac, fSuma: fSuma, fResta: fResta, fProd: fProd, fDiv: fDiv,
    fVal: fVal, fIgual: fIgual, fracTex: fracTex, fracTxt: fracTxt,
    fracFull: fracFull, leeProb: leeProb, decFrac: decFrac, mcd: mcd,
    /* entradas */
    lista: lista, conjunto: conjunto, entero: entero, numero: numero,
    /* conjuntos */
    U: U, I: I, D: D, SD: SD, Co: Co, subset: subset, igual: igual,
    vacio: vacio, incompatibles: incompatibles, ordena: ordena,
    setTxt: setTxt, setTex: setTex, partes: partes, evalua: evalua, regiones: regiones,
    /* gráficos */
    COL: COL, svgWrap: svgWrap, txt: txt, line: line, rect: rect,
    circle: circle, path: path, leyenda: leyenda, venn: venn, arbol: arbol,
    barras: barras, barrasBayes: barrasBayes, pictograma: pictograma,
    contingencia: contingencia,
    /* interfaz */
    shell: shell, resultado: resultado, tarjeta: tarjeta, nota: nota,
    aviso: aviso, bien: bien, mal: mal, insignia: insignia, kvs: kvs,
    tabla: tabla, fichas: fichas, rng: rng,
    log: []
  };

  function boot() {
    document.querySelectorAll('[data-applet-est4]').forEach(function (n) {
      if (n.dataset.mounted) return;
      n.dataset.mounted = 1;
      var f = R[n.dataset.appletEst4];
      if (!f) {
        n.innerHTML = '<div class="mx-bad ap-err">Clave de applet inexistente: ' + esc(n.dataset.appletEst4) + '</div>';
        return;
      }
      try { f(n); }
      catch (e) {
        n.innerHTML = '<div class="mx-bad ap-err">' + esc(e.message) + '</div>';
        window.EST4.log.push({ applet: n.dataset.appletEst4, error: e.message });
      }
    });
  }

  function startWhenReady() {
    var attempts = 0;
    (function espera() {
      var S = window.EST4;
      if (S && S.extraA === true && S.extraB === true &&
          S.extraC === true && S.extraD === true) { boot(); return; }
      if (attempts++ >= 200) { boot(); return; }   /* ~2 s de margen */
      setTimeout(espera, 10);
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWhenReady);
  } else {
    startWhenReady();
  }
})();
