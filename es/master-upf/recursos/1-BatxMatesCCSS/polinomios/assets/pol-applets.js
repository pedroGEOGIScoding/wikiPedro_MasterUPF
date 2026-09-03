/* =====================================================================
   pol-applets.js · Tema 3 Polinomios y fracciones algebraicas
   1.º de Bachillerato · Matemáticas Aplicadas a las Ciencias Sociales
   Ruta: 1-BatxMatesCCSS/polinomios/assets/pol-applets.js

   NÚCLEO del tema. Misma arquitectura que el motor de Números reales
   (re-applets.js) y que el de Estadística de 2.º: un núcleo con las
   utilidades comunes y tres módulos que registran los applets.

   API pública: window.POL
     .registry             mapa clave -> función montadora
     .shell(...)           armazón estándar de applet (título, ayuda,
                           controles, escenarios y salida reactiva)
     .tex .K .KD .texifica       KaTeX local sobre nodos data-tex
     .esc .fmt .nc .etq .kf .mil .milTex .sig   formato de números
     .entero .real .fraccionTxt  validación de entradas numéricas
     .Frac                 fracciones exactas con BigInt
     .mcd .mcm .factoriza .factorizaTex .divisores

     ÁLGEBRA DE POLINOMIOS (coeficientes Frac, índice = grado)
     .parsePol(txt)        lee 3x^2-5x+2, 2x(x-1)^2, x³, -x/2+3 …
     .pDe .pMono .pRecorta .pCopia .pEsCero .pGrado .pLider .pIndep
     .pSuma .pResta .pOpuesto .pEscala .pMult .pPot .pIgual
     .pDiv(A,B)            cociente, resto y TODOS los pasos
     .pEval(p,x)           valor numérico exacto por Horner, con acumulados
     .pEvalNum .pDeriva .pTex .pTexPar .pEntero
     .ruffini(p,r)         filas de la regla de Ruffini
     .candidatosRaiz .raicesRacionales
     .factorizaPol .factorizaTexPol .factorRehacer .factoresLista
     .mcdPol .mcmPol
     .Frax .fraxSimplifica .fraxSuma .fraxMult .fraxDiv
     .notable(tipo,A,B)    identidades notables desarrolladas

     SALIDA
     .expr .terminosHTML .ruffiniHTML .divisionLargaHTML
     .svgWrap .txt .line .rect .circle .path .poly .leyenda .COL
     .rectaReal .ejes       figuras SVG reutilizables
     .resultado .badge .kvs .tabla .paso
     .log                   pila de errores por applet
     .extraA .extraB .extraC   true cuando cada módulo se ha cargado

   Toda la aritmética usa fracciones con BigInt: los coeficientes que
   aparecen al dividir, al aplicar Ruffini o al sumar fracciones
   algebraicas son exactos, sin errores de coma flotante.

   Sin OJS, sin CDN, sin auto-render, sin dependencias externas.
   ===================================================================== */
(function () {
  'use strict';

  var R = {};
  /* ==================================================================
     0 · texto y KaTeX
     ================================================================== */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function K(t) { return '<span data-tex="' + esc(t) + '"></span>'; }
  function KD(t) { return '<span data-tex="' + esc(t) + '" data-display="1"></span>'; }

  function tex(root) {
    if (!window.katex || !root) return;
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
    ajustaAncho(root);
  }

  /* Reduce el cuerpo de letra de las cajas de fórmula que no caben a lo
     ancho, para que nunca aparezca barra de desplazamiento horizontal. */
  function ajustaAncho(root) {
    root.querySelectorAll('.pol-expr').forEach(function (d) {
      var k = d.querySelector('.katex');
      if (!k) return;
      d.style.fontSize = '';
      var f = 1;
      for (var i = 0; i < 12 && d.scrollWidth > d.clientWidth + 1 && f > 0.55; i++) {
        f -= 0.06;
        d.style.fontSize = (f * 100).toFixed(0) + '%';
      }
    });
  }

  /* Convierte $...$ y $$...$$ de un texto plano en nodos data-tex.
     Hay que aplicarlo a TODO lo que se inserte con innerHTML. */
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

  /* ==================================================================
     1 · formato de números (convención española: coma decimal)
     ================================================================== */
  var FINO = '\u202F';                 /* espacio fino sin salto de línea */

  function fmt(x, d) {
    d = d === undefined ? 4 : d;
    if (!Number.isFinite(x)) return '—';
    var y = Number(x.toFixed(d));
    var s = String(Object.is(y, -0) ? 0 : y);
    if (s.indexOf('e') >= 0) return x.toExponential(Math.min(d, 12));
    return s;
  }
  function nc(x, d) { return fmt(x, d).replace('.', ','); }          /* texto  */
  /* Rótulos de figuras: signo menos tipográfico (U+2212) en vez del guion. */
  function etq(x, d) { return nc(x, d).replace('-', '−'); }
  function kf(x, d) { return fmt(x, d).replace('.', '{,}'); }        /* KaTeX  */

  function grupos(s, sep) {
    var neg = s.charAt(0) === '-';
    if (neg) s = s.slice(1);
    var e = s.split('.'), ent = e[0], dec = e[1];
    var out = '', c = 0;
    for (var i = ent.length - 1; i >= 0; i--) {
      out = ent.charAt(i) + out;
      if (++c % 3 === 0 && i > 0) out = sep + out;
    }
    return (neg ? '-' : '') + out + (dec ? ',' + dec : '');
  }
  function mil(x) { return grupos(String(x), FINO); }
  function milTex(x) {
    var s = String(x), p = s.split('.');
    var ent = grupos(p[0], '\\,');
    return ent + (p[1] ? '{,}' + p[1] : '');
  }
  /* Ajusta a entero los resultados que solo se desvían por el redondeo
     de la coma flotante: log(1000) en base 10 debe salir 3, no 2,999… */
  function casi(x, tol) {
    var r = Math.round(x);
    return Math.abs(x - r) < (tol || 1e-10) ? r : x;
  }

  /* Notación con n cifras significativas, en texto español */
  function sig(x, n) {
    if (!Number.isFinite(x) || x === 0) return nc(x, 0);
    return String(Number(x.toPrecision(n))).replace('.', ',');
  }

  /* ==================================================================
     2 · validación de entradas
     ================================================================== */
  function entero(v, min, max, nombre) {
    var s = String(v).trim().replace(',', '.');
    var x = Number(s);
    if (s === '' || !Number.isFinite(x) || !Number.isInteger(x))
      throw Error((nombre || 'El valor') + ' debe ser un número entero. Ejemplo: 12');
    if (min !== undefined && x < min) throw Error((nombre || 'El valor') + ' debe ser al menos ' + min + '.');
    if (max !== undefined && x > max) throw Error((nombre || 'El valor') + ' no puede pasar de ' + max + ' en este applet.');
    return x;
  }
  function real(v, min, max, nombre) {
    var s = String(v).trim().replace(/\s/g, '').replace(',', '.');
    var x = Number(s);
    if (s === '' || !Number.isFinite(x))
      throw Error((nombre || 'El valor') + ' debe ser un número. Escribe la parte decimal con coma o con punto: 3,75 o 3.75');
    if (min !== undefined && x < min) throw Error((nombre || 'El valor') + ' debe ser mayor o igual que ' + String(min).replace('.', ',') + '.');
    if (max !== undefined && x > max) throw Error((nombre || 'El valor') + ' debe ser menor o igual que ' + String(max).replace('.', ',') + '.');
    return x;
  }
  /* "7/12", "-3/4", "5"  ->  Frac */
  function fraccionTxt(v, nombre) {
    var s = String(v).trim().replace(/\s/g, '');
    if (!/^[+-]?\d+(\/\d+)?$/.test(s))
      throw Error((nombre || 'La fracción') + ' se escribe con la barra inclinada, numerador y denominador enteros. Ejemplos: 7/12, -3/4, 5');
    var p = s.split('/');
    var b = p.length > 1 ? Number(p[1]) : 1;
    if (b === 0) throw Error('El denominador no puede ser 0: la división entre cero no está definida.');
    return new Frac(Number(p[0]), b);
  }
  function listaReales(txt, nombre, max) {
    var s = String(txt || '').trim();
    if (!s) throw Error('Escribe los números separados por espacios, comas o punto y coma. Ejemplo: 2 3,5 -1/2 pi');
    var L = s.split(/[\s;]+|,(?=\s|-?\d*\/)/).filter(Boolean);
    var out = L.map(function (t) { return valorSimbolico(t); });
    if (max && out.length > max) throw Error('Máximo ' + max + ' números para que la figura se lea bien.');
    return out;
  }

  /* Acepta números, fracciones y unas cuantas constantes y raíces:
     3   -2,5   7/4   pi   e   phi   sqrt2   raiz(3)   -sqrt(5)/2      */
  function valorSimbolico(t) {
    var s = String(t).trim().toLowerCase().replace(/\s/g, '');
    var neg = 1;
    if (s.charAt(0) === '-') { neg = -1; s = s.slice(1); }
    else if (s.charAt(0) === '+') { s = s.slice(1); }

    /* fracción puramente numérica: 7/4 */
    var mf = s.match(/^(\d+(?:[.,]\d+)?)\/(\d+)$/);
    if (mf) {
      var nn = Number(mf[1].replace(',', '.')), dd = Number(mf[2]);
      if (dd === 0) throw Error('El denominador no puede ser 0.');
      return { v: neg * nn / dd, tex: (neg < 0 ? '-' : '') + '\\dfrac{' + mf[1].replace(',', '{,}') + '}{' + mf[2] + '}', txt: String(t).trim() };
    }

    var div = 1, m = s.match(/^(.*)\/(\d+)$/);
    if (m) { s = m[1]; div = Number(m[2]); }

    var v = null, tx = null;
    if (s === 'pi' || s === 'π') { v = Math.PI; tx = '\\pi'; }
    else if (s === 'e') { v = Math.E; tx = 'e'; }
    else if (s === 'phi' || s === 'aureo' || s === 'φ') { v = (1 + Math.sqrt(5)) / 2; tx = '\\varphi'; }
    else if ((m = s.match(/^(?:sqrt|raiz|raíz|r)\(?(\d+(?:[.,]\d+)?)\)?$/))) {
      var a = Number(m[1].replace(',', '.'));
      v = Math.sqrt(a); tx = '\\sqrt{' + m[1].replace(',', '{,}') + '}';
    } else {
      var x = Number(s.replace(',', '.'));
      if (!Number.isFinite(x)) throw Error('No entiendo «' + t + '». Admito enteros, decimales (3,5), fracciones (7/4), pi, e, phi y raíces como sqrt2 o raiz(3).');
      v = x; tx = String(m ? s : s).replace(',', '{,}');
    }
    if (div !== 1) { v = v / div; tx = '\\dfrac{' + tx + '}{' + div + '}'; }
    if (neg < 0) { v = -v; tx = '-' + tx; }
    return { v: v, tex: tx, txt: String(t).trim() };
  }

  /* ==================================================================
     3 · aritmética exacta: fracciones con BigInt
     ================================================================== */
  function babs(b) { return b < 0n ? -b : b; }
  function bmcd(a, b) {
    a = babs(a); b = babs(b);
    while (b) { var t = a % b; a = b; b = t; }
    return a;
  }
  function mcd() {
    var L = Array.prototype.slice.call(arguments).map(function (x) { return BigInt(x); });
    return Number(L.reduce(function (a, b) { return bmcd(a, b); }, 0n));
  }
  function mcm() {
    var L = Array.prototype.slice.call(arguments).map(function (x) { return BigInt(x); });
    return Number(L.reduce(function (a, b) {
      if (a === 0n || b === 0n) return 0n;
      return babs(a * b) / bmcd(a, b);
    }, 1n));
  }

  function Frac(n, d) {
    if (d === undefined) d = 1;
    n = BigInt(n); d = BigInt(d);
    if (d === 0n) throw Error('El denominador no puede ser 0.');
    if (d < 0n) { n = -n; d = -d; }
    var g = bmcd(n, d) || 1n;
    this.n = n / g;
    this.d = d / g;
  }
  Frac.prototype.val = function () { return Number(this.n) / Number(this.d); };
  Frac.prototype.esEntero = function () { return this.d === 1n; };
  Frac.prototype.txt = function () { return this.d === 1n ? String(this.n) : this.n + '/' + this.d; };
  Frac.prototype.tex = function (inline) {
    if (this.d === 1n) return String(this.n);
    var s = this.n < 0n ? '-' : '';
    var f = (inline ? '\\frac' : '\\dfrac') + '{' + babs(this.n) + '}{' + this.d + '}';
    return s + f;
  };
  Frac.prototype.mas = function (o) { return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); };
  Frac.prototype.menos = function (o) { return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); };
  Frac.prototype.por = function (o) { return new Frac(this.n * o.n, this.d * o.d); };
  Frac.prototype.entre = function (o) {
    if (o.n === 0n) throw Error('No se puede dividir entre 0.');
    return new Frac(this.n * o.d, this.d * o.n);
  };
  Frac.prototype.opuesto = function () { return new Frac(-this.n, this.d); };
  Frac.prototype.cmp = function (o) {
    var a = this.n * o.d, b = o.n * this.d;
    return a < b ? -1 : (a > b ? 1 : 0);
  };

  function factoriza(n) {
    n = Math.abs(Math.trunc(n));
    var f = [], p = 2;
    if (n < 2) return f;
    while (p * p <= n) {
      var e = 0;
      while (n % p === 0) { n /= p; e++; }
      if (e) f.push([p, e]);
      p += (p === 2 ? 1 : 2);
    }
    if (n > 1) f.push([n, 1]);
    return f;
  }
  function factorizaTex(n) {
    var f = factoriza(n);
    if (!f.length) return String(n);
    return f.map(function (p) { return p[1] === 1 ? String(p[0]) : p[0] + '^{' + p[1] + '}'; }).join(' \\cdot ');
  }
  function esCuadradoPerfecto(n) {
    if (n < 0) return false;
    var r = Math.round(Math.sqrt(n));
    return r * r === n;
  }


  /* ==================================================================
     9 · figuras SVG
     ================================================================== */
  var COL = {
    azul: '#1976d2', azulOsc: '#0d47a1', rojo: '#c62828', verde: '#2e7d32',
    naranja: '#e07b00', morado: '#6a3d9a', teal: '#00695c', rosa: '#ad1457',
    eje: '#455a64', guia: '#cfd8dc', texto: '#263238', gris: '#78909c',
    suave: '#f2f7fd'
  };

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
    return '<rect x="' + x + '" y="' + y + '" width="' + Math.max(0, w) + '" height="' + Math.max(0, h) +
      '" rx="' + (o.r === undefined ? 6 : o.r) + '" fill="' + (fill || 'none') +
      '" stroke="' + (stroke || 'none') + '" stroke-width="' + (o.sw || 1.6) +
      (o.op !== undefined ? '" opacity="' + o.op : '') + '"/>';
  }
  function circle(cx, cy, r, fill, stroke, sw) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + (fill || COL.azul) +
      '" stroke="' + (stroke || '#fff') + '" stroke-width="' + (sw === undefined ? 2 : sw) + '"/>';
  }
  function path(d, col, w, fill, dash) {
    return '<path d="' + d + '" fill="' + (fill || 'none') + '" stroke="' + (col || COL.eje) +
      '" stroke-width="' + (w || 2) + (dash ? '" stroke-dasharray="' + dash : '') +
      '" stroke-linejoin="round" stroke-linecap="round"/>';
  }
  function poly(pts, fill, stroke, w) {
    return '<polygon points="' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' ') +
      '" fill="' + (fill || 'none') + '" stroke="' + (stroke || 'none') + '" stroke-width="' + (w || 1.6) + '"/>';
  }
  function leyenda(items) {
    var h = '<ul class="ap-legend">';
    items.forEach(function (it) {
      h += '<li><span class="ap-sw" style="background:' + it[0] + '"></span>' + it[1] + '</li>';
    });
    return h + '</ul>';
  }

  /* ------------------------------------------------------------------
     Recta real reutilizable.
     opts = { min, max, W, H, y, paso, etiquetas, puntos:[{x,tex,col,arriba}],
              tramos:[{a,b,col,abierto:[bool,bool],alto}], titulo }
     Devuelve el HTML completo de la figura.
     ------------------------------------------------------------------ */
  function rectaReal(opts) {
    var min = opts.min, max = opts.max;
    var W = opts.W || 1000, H = opts.H || (opts.alto || 220);
    var mx = opts.mx === undefined ? 70 : opts.mx;
    var yy = opts.y || Math.round(H * 0.62);
    if (max <= min) throw Error('El extremo derecho de la recta debe ser mayor que el izquierdo.');
    function X(v) { return mx + (v - min) / (max - min) * (W - 2 * mx); }
    var b = '';

    /* tramos (intervalos) por debajo o sobre el eje */
    (opts.tramos || []).forEach(function (t) {
      var x1 = X(Math.max(t.a, min)), x2 = X(Math.min(t.b, max));
      var alto = t.alto === undefined ? 16 : t.alto;
      b += rect(Math.min(x1, x2), yy - alto / 2, Math.abs(x2 - x1), alto, t.col || 'rgba(25,118,210,.22)', t.borde || 'none', { r: alto / 2 });
    });

    /* eje con flechas */
    b += line(mx - 40, yy, W - mx + 40, yy, COL.eje, 2.6);
    b += poly([[W - mx + 40, yy], [W - mx + 24, yy - 8], [W - mx + 24, yy + 8]], COL.eje, COL.eje);
    b += poly([[mx - 40, yy], [mx - 24, yy - 8], [mx - 24, yy + 8]], COL.eje, COL.eje);

    /* marcas */
    var paso = opts.paso || (max - min) / 10;
    var ini = Math.ceil(min / paso) * paso;
    for (var v = ini; v <= max + 1e-9; v += paso) {
      var x = X(v);
      var mayor = Math.abs(v / paso - Math.round(v / paso)) < 1e-9;
      b += line(x, yy - (mayor ? 9 : 5), x, yy + (mayor ? 9 : 5), COL.gris, 1.6);
      if (opts.etiquetas !== false) {
        var et = Math.abs(v) < 1e-9 ? '0' : etq(v, opts.dec === undefined ? 2 : opts.dec);
        b += txt(x, yy + 32, et, { size: opts.sizeEt || 17, fill: COL.gris });
      }
    }

    /* puntos destacados */
    (opts.puntos || []).forEach(function (p) {
      var x = X(p.x);
      var arriba = p.arriba !== false;
      var col = p.col || COL.rojo;
      b += line(x, yy - (arriba ? 46 : -46), x, yy, col, 1.6, '5 4');
      if (p.hueco) b += circle(x, yy, 8, '#fff', col, 3);
      else b += circle(x, yy, 8, col, '#fff', 2.4);
      if (p.tex) {
        b += '<foreignObject x="' + (x - 90) + '" y="' + (arriba ? yy - 84 : yy + 44) + '" width="180" height="40">' +
          '<div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-size:19px;color:' + col + '">' +
          '<span data-tex="' + esc(p.tex) + '"></span></div></foreignObject>';
      }
    });
    if (opts.titulo) b = txt(W / 2, 30, esc(opts.titulo), { size: 20, weight: '700', fill: COL.azulOsc }) + b;
    return svgWrap(b, W, H, opts.label || 'Recta real', opts.cap);
  }

  /* ------------------------------------------------------------------
     Ejes cartesianos con una o varias curvas.
     opts = { xmin,xmax,ymin,ymax, W,H, curvas:[{f,col,dash,label}],
              puntos:[{x,y,col,tex}], rectas:[{y}|{x}], cap }
     ------------------------------------------------------------------ */
  function ejes(opts) {
    var W = opts.W || 940, H = opts.H || 560, m = opts.m || 58;
    var xmin = opts.xmin, xmax = opts.xmax, ymin = opts.ymin, ymax = opts.ymax;
    function X(v) { return m + (v - xmin) / (xmax - xmin) * (W - 2 * m); }
    function Y(v) { return H - m - (v - ymin) / (ymax - ymin) * (H - 2 * m); }
    var b = rect(m, m, W - 2 * m, H - 2 * m, '#fff', '#e3e9ef', { r: 4 });

    var px = opts.paso || Math.max(1, Math.round((xmax - xmin) / 10));
    var py = opts.pasoY || Math.max(1, Math.round((ymax - ymin) / 8));
    for (var v = Math.ceil(xmin / px) * px; v <= xmax; v += px) {
      b += line(X(v), m, X(v), H - m, COL.guia, 1);
      b += txt(X(v), H - m + 26, etq(v, 0), { size: 16, fill: COL.gris });
    }
    for (var w = Math.ceil(ymin / py) * py; w <= ymax; w += py) {
      b += line(m, Y(w), W - m, Y(w), COL.guia, 1);
      b += txt(m - 12, Y(w) + 6, etq(w, 0), { size: 16, fill: COL.gris, anchor: 'end' });
    }
    if (ymin <= 0 && ymax >= 0) b += line(m, Y(0), W - m, Y(0), COL.eje, 2.2);
    if (xmin <= 0 && xmax >= 0) b += line(X(0), m, X(0), H - m, COL.eje, 2.2);

    (opts.curvas || []).forEach(function (c) {
      var d = '', dentro = false;
      for (var i = 0; i <= 600; i++) {
        var x = xmin + (xmax - xmin) * i / 600, y;
        try { y = c.f(x); } catch (e) { y = NaN; }
        if (!Number.isFinite(y) || y < ymin - (ymax - ymin) || y > ymax + (ymax - ymin)) { dentro = false; continue; }
        d += (dentro ? ' L ' : ' M ') + X(x).toFixed(1) + ' ' + Y(y).toFixed(1);
        dentro = true;
      }
      b += path(d, c.col || COL.azul, c.w || 3, 'none', c.dash);
      if (c.label) b += '<foreignObject x="' + (c.lx || W - 250) + '" y="' + (c.ly || 70) + '" width="200" height="40">' +
        '<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:19px;color:' + (c.col || COL.azul) + '">' +
        '<span data-tex="' + esc(c.label) + '"></span></div></foreignObject>';
    });
    (opts.puntos || []).forEach(function (p) {
      b += circle(X(p.x), Y(p.y), 7, p.col || COL.rojo, '#fff', 2);
      if (p.tex) b += '<foreignObject x="' + (X(p.x) - 80) + '" y="' + (Y(p.y) - 62) + '" width="160" height="40">' +
        '<div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-size:18px;color:' + (p.col || COL.rojo) + '">' +
        '<span data-tex="' + esc(p.tex) + '"></span></div></foreignObject>';
    });
    return svgWrap(b, W, H, opts.label || 'Gráfica', opts.cap);
  }

  /* ==================================================================
     10 · piezas de salida
     ================================================================== */
  function resultado(valor, etiqueta) {
    return '<div class="ap-res"><span class="ap-res-num">' + valor + '</span>' +
      '<span class="ap-res-lab">' + etiqueta + '</span></div>';
  }
  function badge(t, clase) { return '<span class="ap-badge ' + (clase || 'info') + '">' + t + '</span>'; }
  function kvs(items) {
    return '<div class="ap-kvs">' + items.map(function (i) {
      return '<span class="ap-kv">' + i + '</span>';
    }).join('') + '</div>';
  }
  /* tabla(cab, filas, opts) · filas: array de arrays; primera celda th */
  function tabla(cab, filas, opts) {
    opts = opts || {};
    var h = '<table class="ap-tbl ap-pol"><thead><tr>';
    cab.forEach(function (c) { h += '<th>' + c + '</th>'; });
    h += '</tr></thead><tbody>';
    filas.forEach(function (f) {
      var cl = f.clase ? ' class="' + f.clase + '"' : '';
      var cel = f.celdas || f;
      h += '<tr' + cl + '>';
      cel.forEach(function (c, i) {
        h += (i === 0 && opts.thPrimera !== false ? '<th>' + c + '</th>' : '<td>' + c + '</td>');
      });
      h += '</tr>';
    });
    return h + '</tbody></table>';
  }
  function paso(n, txtHtml, clase) {
    return '<div class="ap-paso ' + (clase || '') + '"><span class="ap-paso-n">' + n + '</span>' +
      '<div class="ap-paso-c">' + txtHtml + '</div></div>';
  }

  /* ==================================================================
     11 · armazón estándar de applet
     ================================================================== */
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
    var ctl = {}, api = {};

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
      if (f.type === 'button') {
        var bb = document.createElement('button');
        bb.type = 'button';
        bb.className = 'ap-chip ap-chip-act';
        bb.textContent = f.label;
        bb.addEventListener('click', function () {
          if (f.click) f.click(ctl, api);
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
        el.addEventListener('input', function () { live.textContent = String(el.value).replace('.', ','); });
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
        (f.options || []).forEach(function (o) {
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
        if (f.place) el.placeholder = f.place;
        el.className = 'mx-in';
        el.spellcheck = false;
        lab.appendChild(el);
      } else {
        el = document.createElement('textarea');
        el.rows = f.rows || 2; el.value = f.value || ''; el.spellcheck = false;
        if (f.place) el.placeholder = f.place;
        el.className = 'mx-in';
        lab.appendChild(el);
      }
      if (f.ancho) lab.style.flex = '1 1 ' + f.ancho;
      ctl[f.id] = el;
      inp.appendChild(lab);
      el.addEventListener('input', run);
      el.addEventListener('change', run);
    });

    function values() {
      var v = {};
      Object.keys(ctl).forEach(function (k) {
        var e = ctl[k];
        if (!e || e.tagName === 'BUTTON') return;
        v[k] = e.type === 'checkbox' ? e.checked : e.value;
      });
      return v;
    }
    function run() {
      try {
        var html = compute(values(), ctl, out, api);
        if (html !== undefined && html !== null) {
          out.innerHTML = texifica(html);
          tex(out);
        }
      } catch (e) {
        out.innerHTML = '<div class="mx-bad ap-err">' + esc(e.message) + '</div>';
        tex(out);
        window.POL.log.push({ applet: title, error: e.message });
      }
    }
    api.run = run;
    api.ctl = ctl;
    api.out = out;
    api.node = node;
    run();
    return api;
  }

  /* ==================================================================
     4 · álgebra de polinomios: representación y operaciones exactas

     Un polinomio es un array de Frac: el índice es el grado.
        [Frac(2), Frac(0), Frac(3)]   ->   3x^2 + 2
     El array siempre va «recortado»: el último coeficiente no es 0,
     salvo en el polinomio nulo, que es [Frac(0)].
     Toda la aritmética pasa por Frac (BigInt), así que 1/3, 7/12 o los
     coeficientes que salen al dividir son exactos.
     ================================================================== */
  var CERO = function () { return [new Frac(0)]; };
  var UNO = function () { return [new Frac(1)]; };

  function pRecorta(p) {
    var q = p.slice();
    while (q.length > 1 && q[q.length - 1].n === 0n) q.pop();
    return q;
  }
  function pEsCero(p) { p = pRecorta(p); return p.length === 1 && p[0].n === 0n; }
  function pGrado(p) { p = pRecorta(p); return pEsCero(p) ? -Infinity : p.length - 1; }
  function pGradoTxt(p) { return pEsCero(p) ? 'sin grado (polinomio nulo)' : String(pGrado(p)); }
  function pLider(p) { p = pRecorta(p); return p[p.length - 1]; }
  function pIndep(p) { return p[0]; }
  function pCopia(p) { return p.map(function (c) { return new Frac(c.n, c.d); }); }

  function pDe(lista) {                       /* de números o fracciones */
    return pRecorta(lista.map(function (c) {
      return (c instanceof Frac) ? c : new Frac(c);
    }));
  }
  function pMono(coef, grado) {               /* coef · x^grado */
    var a = [];
    for (var i = 0; i < grado; i++) a.push(new Frac(0));
    a.push(coef instanceof Frac ? coef : new Frac(coef));
    return pRecorta(a);
  }

  function pSuma(a, b) {
    var n = Math.max(a.length, b.length), r = [];
    for (var i = 0; i < n; i++) {
      var x = a[i] || new Frac(0), y = b[i] || new Frac(0);
      r.push(x.mas(y));
    }
    return pRecorta(r);
  }
  function pResta(a, b) { return pSuma(a, pOpuesto(b)); }
  function pOpuesto(a) { return a.map(function (c) { return c.opuesto(); }); }
  function pEscala(a, k) {
    k = (k instanceof Frac) ? k : new Frac(k);
    return pRecorta(a.map(function (c) { return c.por(k); }));
  }
  function pMult(a, b) {
    if (pEsCero(a) || pEsCero(b)) return CERO();
    var r = [];
    for (var i = 0; i < a.length + b.length - 1; i++) r.push(new Frac(0));
    for (var i2 = 0; i2 < a.length; i2++) {
      for (var j = 0; j < b.length; j++) {
        r[i2 + j] = r[i2 + j].mas(a[i2].por(b[j]));
      }
    }
    return pRecorta(r);
  }
  function pPot(a, n) {
    var r = UNO();
    for (var i = 0; i < n; i++) r = pMult(r, a);
    return r;
  }
  function pIgual(a, b) { return pEsCero(pResta(a, b)); }

  /* División entera con resto, guardando cada paso para el applet.
     Devuelve { q, r, pasos:[{mono, monoTex, producto, resto}] }        */
  function pDiv(A, B) {
    if (pEsCero(B)) throw Error('No se puede dividir entre el polinomio nulo.');
    var q = CERO(), r = pRecorta(pCopia(A)), pasos = [];
    var gB = pGrado(B), lB = pLider(B), guarda = 0;
    while (!pEsCero(r) && pGrado(r) >= gB) {
      if (++guarda > 60) throw Error('La división es demasiado larga para este applet.');
      var g = pGrado(r) - gB;
      var c = pLider(r).entre(lB);
      var m = pMono(c, g);
      var prod = pMult(m, B);
      var nuevo = pResta(r, prod);
      pasos.push({
        mono: m, monoTex: pTex(m), coef: c, grado: g,
        productoTex: pTex(prod), restoTex: pTex(nuevo),
        producto: prod, resto: nuevo, dividendoTex: pTex(r)
      });
      q = pSuma(q, m);
      r = nuevo;
    }
    return { q: q, r: r, pasos: pasos };
  }

  /* Valor numérico por Horner, con la lista de acumulados. */
  function pEval(p, x) {
    x = (x instanceof Frac) ? x : new Frac(x);
    var acum = new Frac(0), lista = [];
    for (var i = p.length - 1; i >= 0; i--) {
      acum = acum.por(x).mas(p[i]);
      lista.push(new Frac(acum.n, acum.d));
    }
    return { valor: acum, pasos: lista };
  }
  function pEvalNum(p, x) {                    /* evaluación en coma flotante */
    var y = 0;
    for (var i = p.length - 1; i >= 0; i--) y = y * x + p[i].val();
    return y;
  }
  function pDeriva(p) {
    if (pGrado(p) <= 0) return CERO();
    var r = [];
    for (var i = 1; i < p.length; i++) r.push(p[i].por(new Frac(i)));
    return pRecorta(r);
  }

  /* ---------- escritura en LaTeX ---------- */
  function coefTex(c, primero, grado) {
    var neg = c.n < 0n;
    var abs = new Frac(neg ? -c.n : c.n, c.d);
    var signo = primero ? (neg ? '-' : '') : (neg ? ' - ' : ' + ');
    var cuerpo;
    if (grado > 0 && abs.n === 1n && abs.d === 1n) cuerpo = '';
    else cuerpo = abs.tex(true);
    return signo + cuerpo;
  }
  function pTex(p, v) {
    v = v || 'x';
    p = pRecorta(p);
    if (pEsCero(p)) return '0';
    var s = '', primero = true;
    for (var i = p.length - 1; i >= 0; i--) {
      var c = p[i];
      if (c.n === 0n) continue;
      s += coefTex(c, primero, i);
      if (i === 1) s += v;
      else if (i > 1) s += v + '^{' + i + '}';
      primero = false;
    }
    return s;
  }
  function pTexPar(p, v) {                     /* entre paréntesis si hace falta */
    var t = pTex(p, v);
    return (pGrado(p) <= 0 && p[0].d === 1n && p[0].n >= 0n) ? t : '\\left(' + t + '\\right)';
  }

  /* ---------- lectura de una expresión escrita por el alumno ----------
     Admite:  3x^2-5x+2 · x³ (con superíndices) · 2x(x-1)^2 · -x/2+3
              7 · (x+1)(x-1) · 3/4x^2 · espacios libres · coma decimal
     Solo se admite dividir entre un número (no entre otro polinomio).   */
  function normalizaEntrada(s, v) {
    v = v || 'x';
    var t = String(s || '').trim().toLowerCase();
    t = t.replace(/\s+/g, '');
    t = t.replace(/[·×*]/g, '*');
    t = t.replace(/[−–—]/g, '-');
    t = t.replace(/[\[{]/g, '(').replace(/[\]}]/g, ')');
    t = t.replace(/⁰/g, '^0').replace(/¹/g, '^1').replace(/²/g, '^2').replace(/³/g, '^3')
      .replace(/⁴/g, '^4').replace(/⁵/g, '^5').replace(/⁶/g, '^6').replace(/⁷/g, '^7')
      .replace(/⁸/g, '^8').replace(/⁹/g, '^9');
    t = t.replace(/(\d),(\d)/g, '$1.$2');
    return t;
  }

  function parsePol(str, v, nombre) {
    v = (v || 'x').toLowerCase();
    var s = normalizaEntrada(str, v);
    var etiqueta = nombre || 'el polinomio';
    if (s === '') throw Error('Escribe ' + etiqueta + '. Ejemplo: 3x^2-5x+2');
    var permitido = new RegExp('^[0-9' + v + '\\+\\-\\*\\^\\(\\)\\./]*$');
    if (!permitido.test(s)) {
      var malo = s.split('').filter(function (c) { return !permitido.test(c); })[0];
      throw Error('No entiendo el símbolo «' + malo + '». Usa solo números, la letra ' + v +
        ', los signos + - * ^ ( ) y la barra / para dividir entre un número. Ejemplo: 2x^3-x/2+5');
    }
    var i = 0;
    function fin() { return i >= s.length; }
    function ver() { return s.charAt(i); }
    function come(c) { if (ver() === c) { i++; return true; } return false; }

    function numero() {
      var j = i;
      while (!fin() && /[0-9.]/.test(ver())) i++;
      var txt = s.slice(j, i);
      if (!/^\d+(\.\d+)?$/.test(txt)) throw Error('Número mal escrito cerca de «' + txt + '». Ejemplos válidos: 3, 2.5, 7/2');
      if (txt.indexOf('.') >= 0) {                    /* decimal exacto -> fracción */
        var pd = txt.split('.');
        var den = Math.pow(10, pd[1].length);
        return new Frac(Number(pd[0]) * den + Number(pd[1]), den);
      }
      return new Frac(Number(txt));
    }
    function entPos() {
      var j = i;
      while (!fin() && /[0-9]/.test(ver())) i++;
      var t = s.slice(j, i);
      if (!/^\d+$/.test(t)) throw Error('Después de ^ tiene que ir un exponente natural. Ejemplo: x^3');
      var n = Number(t);
      if (n > 12) throw Error('En este applet los exponentes llegan hasta 12.');
      return n;
    }

    function expresion() {
      var signo = 1;
      if (come('+')) signo = 1; else if (come('-')) signo = -1;
      var acc = pEscala(termino(), new Frac(signo));
      while (!fin() && (ver() === '+' || ver() === '-')) {
        var neg = come('-'); if (!neg) come('+');
        var t = termino();
        acc = neg ? pResta(acc, t) : pSuma(acc, t);
      }
      return acc;
    }
    function termino() {
      var acc = factor();
      for (;;) {
        if (come('*')) { acc = pMult(acc, factor()); continue; }
        if (come('/')) {
          var d = factor();
          if (pGrado(d) > 0) throw Error('En esta casilla solo se puede dividir entre un número. Para una fracción algebraica usa las dos casillas, numerador y denominador.');
          if (pEsCero(d)) throw Error('No se puede dividir entre 0.');
          acc = pEscala(acc, new Frac(d[0].d, d[0].n));
          continue;
        }
        if (!fin() && (/[0-9(]/.test(ver()) || ver() === v)) { acc = pMult(acc, factor()); continue; }
        break;
      }
      return acc;
    }
    function factor() {
      var b = base();
      if (come('^')) {
        var e = entPos();
        b = pPot(b, e);
      }
      return b;
    }
    function base() {
      if (come('(')) {
        var e = expresion();
        if (!come(')')) throw Error('Falta cerrar un paréntesis. Revisa la expresión.');
        return e;
      }
      if (ver() === v) { i++; return pMono(new Frac(1), 1); }
      if (/[0-9.]/.test(ver())) return [numero()];
      if (ver() === '-') { i++; return pEscala(base(), new Frac(-1)); }
      throw Error('No entiendo la expresión a partir de «' + s.slice(i) + '». Ejemplo correcto: 2x^3-5x+1');
    }

    var res = expresion();
    if (!fin()) throw Error('Sobra algo al final: «' + s.slice(i) + '». Ejemplo correcto: 2x^3-5x+1');
    if (pGrado(res) > 12) throw Error('En este applet el grado máximo es 12.');
    return pRecorta(res);
  }

  /* ==================================================================
     5 · Ruffini, teorema del resto y raíces
     ================================================================== */
  function ruffini(p, r) {
    p = pRecorta(p);
    r = (r instanceof Frac) ? r : new Frac(r);
    var arriba = [], baja = [], sube = [];
    for (var i = p.length - 1; i >= 0; i--) arriba.push(p[i]);
    var acc = arriba[0];
    baja.push(acc); sube.push(null);
    for (var j = 1; j < arriba.length; j++) {
      var s = acc.por(r);
      sube.push(s);
      acc = arriba[j].mas(s);
      baja.push(acc);
    }
    /* baja[] va de mayor a menor grado; el último valor es el resto y los
       anteriores son los coeficientes del cociente, que hay que invertir. */
    return {
      arriba: arriba, sube: sube, baja: baja,
      cociente: pRecorta(baja.slice(0, baja.length - 1).reverse()),
      resto: baja[baja.length - 1], r: r
    };
  }

  /* Divisores enteros de un entero (positivos y negativos) */
  function divisores(n) {
    n = Math.abs(Math.trunc(n));
    var d = [];
    if (n === 0) return [1];
    for (var i = 1; i * i <= n; i++) {
      if (n % i === 0) { d.push(i); if (i !== n / i) d.push(n / i); }
    }
    d.sort(function (a, b) { return a - b; });
    return d;
  }

  /* Multiplica por el mcm de los denominadores: P = (1/k)·Pent, Pent entero */
  function pEntero(p) {
    var den = 1;
    p.forEach(function (c) { den = mcm(den, Number(c.d)); });
    var ent = p.map(function (c) { return new Frac(c.n * BigInt(den) / c.d, 1); });
    var g = 0;
    ent.forEach(function (c) { g = mcd(g, Number(c.n)); });
    if (!g) g = 1;
    return { p: pRecorta(ent), factor: new Frac(den, 1), contenido: g };
  }

  /* Candidatos a raíz racional: ±divisor(a0)/divisor(an) */
  function candidatosRaiz(p) {
    var E = pEntero(p).p;
    if (pEsCero(E)) return [];
    var k = 0;
    while (k < E.length && E[k].n === 0n) k++;         /* x^k factor común */
    var a0 = Number(E[k].n), an = Number(pLider(E).n);
    var D0 = divisores(a0), Dn = divisores(an);
    var vistos = {}, out = [];
    if (k > 0) { vistos['0/1'] = 1; out.push(new Frac(0)); }
    D0.forEach(function (a) {
      Dn.forEach(function (b) {
        [1, -1].forEach(function (s) {
          var f = new Frac(s * a, b);
          var key = f.txt();
          if (!vistos[key]) { vistos[key] = 1; out.push(f); }
        });
      });
    });
    out.sort(function (a, b) { return a.val() - b.val(); });
    return out;
  }

  function raicesRacionales(p) {
    var res = [], q = pRecorta(pCopia(p));
    var cand = candidatosRaiz(p);
    cand.forEach(function (c) {
      var m = 0;
      for (;;) {
        var rf = ruffini(q, c);
        if (rf.resto.n !== 0n) break;
        q = rf.cociente;
        m++;
        if (pGrado(q) <= 0) break;
      }
      if (m) res.push({ raiz: c, mult: m });
    });
    return { raices: res, resto: q };
  }

  /* ==================================================================
     6 · factorización completa sobre los racionales
     Devuelve { k, lineales:[{raiz,mult}], cuads:[{poly,mult}], xk, tex }
     ================================================================== */
  function factorizaPol(P) {
    P = pRecorta(P);
    if (pEsCero(P)) return { nulo: true, lineales: [], cuads: [], k: new Frac(0), tex: '0' };
    if (pGrado(P) === 0) return { lineales: [], cuads: [], k: P[0], tex: P[0].tex(true), constante: true };

    var k = new Frac(1), q = pCopia(P);

    /* 1 · sacar denominadores y contenido: P = k · Q, con Q entero primitivo */
    var e = pEntero(q);
    k = new Frac(e.contenido, 1).entre(e.factor);
    q = pEscala(e.p, new Frac(1, e.contenido));
    if (pLider(q).n < 0n) { q = pOpuesto(q); k = k.opuesto(); }

    /* 2 · factor x^m */
    var m = 0;
    while (q.length > 1 && q[0].n === 0n) { q = q.slice(1); m++; }

    /* 3 · raíces racionales por Ruffini repetido */
    var lin = [];
    var seguir = true;
    while (seguir && pGrado(q) > 0) {
      seguir = false;
      var cand = candidatosRaiz(q);
      for (var i = 0; i < cand.length; i++) {
        var rf = ruffini(q, cand[i]);
        if (rf.resto.n === 0n) {
          var yaEsta = null;
          lin.forEach(function (L) { if (L.raiz.cmp(cand[i]) === 0) yaEsta = L; });
          if (yaEsta) yaEsta.mult++;
          else lin.push({ raiz: cand[i], mult: 1 });
          q = rf.cociente;
          seguir = true;
          break;
        }
      }
    }

    /* 4 · lo que queda: grado 2 irreducible, o grado >= 3 sin raíces racionales */
    var cuads = [];
    if (pGrado(q) >= 2) {
      var l = pLider(q);
      if (!(l.n === 1n && l.d === 1n)) { k = k.por(l); q = pEscala(q, new Frac(l.d, l.n)); }
      cuads.push({ poly: q, mult: 1 });
      q = UNO();
    } else if (pGrado(q) === 0) {
      k = k.por(q[0]);
    }

    lin.sort(function (a, b) { return a.raiz.val() - b.raiz.val(); });
    return { k: k, xk: m, lineales: lin, cuads: cuads };
  }

  function factorLinTex(raiz, v) {
    v = v || 'x';
    if (raiz.n === 0n) return v;
    if (raiz.d === 1n) {
      return raiz.n > 0n ? '(' + v + ' - ' + raiz.n + ')' : '(' + v + ' + ' + (-raiz.n) + ')';
    }
    var s = raiz.n > 0n ? '-' : '+';
    var abs = raiz.n < 0n ? -raiz.n : raiz.n;
    return '\\left(' + v + ' ' + s + ' \\frac{' + abs + '}{' + raiz.d + '}\\right)';
  }
  function potTex(base, m) { return m === 1 ? base : base + '^{' + m + '}'; }

  function factorizaTexPol(F, v, modo) {
    v = v || 'x';
    if (F.nulo) return '0';
    if (F.constante) return F.k.tex(true);
    var partes = [];
    var k = F.k;
    if (modo === 'entera') {
      /* factores enteros: (qx - p) en vez de q(x - p/q) */
      var kk = k;
      if (F.xk) partes.push(potTex(v, F.xk));
      F.lineales.forEach(function (L) {
        if (L.raiz.d === 1n) {
          partes.push(potTex(factorLinTex(L.raiz, v), L.mult));
        } else {
          var num = L.raiz.n, den = L.raiz.d;
          var t = '(' + den + v + (num > 0n ? ' - ' + num : ' + ' + (-num)) + ')';
          partes.push(potTex(t, L.mult));
          kk = kk.entre(new Frac(den, 1));
        }
      });
      F.cuads.forEach(function (C) { partes.push(potTex('(' + pTex(C.poly, v) + ')', C.mult)); });
      var pre = (kk.n === 1n && kk.d === 1n) ? '' : (kk.n === -1n && kk.d === 1n ? '-' : kk.tex(true) + '\\,');
      return pre + (partes.join('') || '1');
    }
    if (F.xk) partes.push(potTex(v, F.xk));
    F.lineales.forEach(function (L) { partes.push(potTex(factorLinTex(L.raiz, v), L.mult)); });
    F.cuads.forEach(function (C) { partes.push(potTex('(' + pTex(C.poly, v) + ')', C.mult)); });
    var pref = (k.n === 1n && k.d === 1n) ? '' : (k.n === -1n && k.d === 1n ? '-' : k.tex(true) + '\\,');
    return pref + (partes.join('') || '1');
  }

  /* Reconstruye el producto para comprobar la identidad */
  function factorRehacer(F) {
    if (F.nulo) return CERO();
    var p = [F.k];
    for (var i = 0; i < (F.xk || 0); i++) p = pMult(p, pMono(new Frac(1), 1));
    F.lineales.forEach(function (L) {
      p = pMult(p, pPot(pDe([L.raiz.opuesto(), new Frac(1)]), L.mult));
    });
    F.cuads.forEach(function (C) { p = pMult(p, pPot(C.poly, C.mult)); });
    return p;
  }

  /* Lista plana de factores irreducibles con su multiplicidad, para el
     mcd y el mcm de polinomios y para simplificar fracciones. */
  function factoresLista(P) {
    var F = factorizaPol(P), L = [];
    if (F.xk) L.push({ clave: 'x', poly: pMono(new Frac(1), 1), mult: F.xk });
    F.lineales.forEach(function (l) {
      L.push({ clave: 'L' + l.raiz.txt(), poly: pDe([l.raiz.opuesto(), new Frac(1)]), mult: l.mult });
    });
    F.cuads.forEach(function (c) {
      L.push({ clave: 'Q' + pTex(c.poly), poly: c.poly, mult: c.mult });
    });
    return { k: F.k, factores: L };
  }

  function mcdPol(A, B) {
    var a = factoresLista(A), b = factoresLista(B), out = UNO();
    a.factores.forEach(function (fa) {
      b.factores.forEach(function (fb) {
        if (fa.clave === fb.clave) out = pMult(out, pPot(fa.poly, Math.min(fa.mult, fb.mult)));
      });
    });
    return out;
  }
  function mcmPol(A, B) {
    var a = factoresLista(A), b = factoresLista(B), out = UNO(), usados = {};
    a.factores.forEach(function (fa) {
      var m = fa.mult;
      b.factores.forEach(function (fb) { if (fb.clave === fa.clave) m = Math.max(m, fb.mult); });
      usados[fa.clave] = 1;
      out = pMult(out, pPot(fa.poly, m));
    });
    b.factores.forEach(function (fb) {
      if (!usados[fb.clave]) out = pMult(out, pPot(fb.poly, fb.mult));
    });
    return out;
  }

  /* ==================================================================
     7 · fracciones algebraicas
     ================================================================== */
  function Frax(num, den) {
    if (pEsCero(den)) throw Error('El denominador de una fracción algebraica no puede ser el polinomio nulo.');
    this.n = pRecorta(num);
    this.d = pRecorta(den);
  }
  Frax.prototype.tex = function (v) {
    return '\\dfrac{' + pTex(this.n, v) + '}{' + pTex(this.d, v) + '}';
  };
  Frax.prototype.esPolinomio = function () { return pGrado(this.d) === 0; };

  /* Simplifica dividiendo entre el mcd y arrastrando la constante. */
  function fraxSimplifica(F) {
    if (pEsCero(F.n)) return { frax: new Frax(CERO(), UNO()), comun: UNO(), restricciones: raicesDe(F.d) };
    var g = mcdPol(F.n, F.d);
    var n2 = pDiv(F.n, g).q, d2 = pDiv(F.d, g).q;
    /* dejar el denominador con coeficiente principal positivo y sin fracciones */
    var l = pLider(d2);
    if (l.n < 0n) { n2 = pOpuesto(n2); d2 = pOpuesto(d2); }
    var den = 1;
    n2.concat(d2).forEach(function (c) { den = mcm(den, Number(c.d)); });
    if (den !== 1) { n2 = pEscala(n2, new Frac(den)); d2 = pEscala(d2, new Frac(den)); }
    return {
      frax: new Frax(n2, d2), comun: g,
      restricciones: raicesDe(F.d),
      simplificable: pGrado(g) > 0
    };
  }
  function raicesDe(P) {
    var R2 = raicesRacionales(P);
    return R2.raices.map(function (r) { return r.raiz; });
  }

  function fraxSuma(A, B, signo) {
    signo = signo === undefined ? 1 : signo;
    var comun = mcmPol(A.d, B.d);
    var fa = pDiv(comun, A.d).q, fb = pDiv(comun, B.d).q;
    var na = pMult(A.n, fa), nb = pMult(B.n, fb);
    var num = signo > 0 ? pSuma(na, nb) : pResta(na, nb);
    return { bruto: new Frax(num, comun), comun: comun, fa: fa, fb: fb, na: na, nb: nb };
  }
  function fraxMult(A, B) { return new Frax(pMult(A.n, B.n), pMult(A.d, B.d)); }
  function fraxDiv(A, B) {
    if (pEsCero(B.n)) throw Error('No se puede dividir entre una fracción con numerador nulo.');
    return new Frax(pMult(A.n, B.d), pMult(A.d, B.n));
  }

  /* ==================================================================
     8 · identidades notables y piezas de salida propias del tema
     ================================================================== */
  function notable(tipo, A, B) {
    /* A y B son polinomios (normalmente monomios) */
    var izq, der, nombre;
    if (tipo === 'suma2') {
      nombre = 'Cuadrado de una suma';
      izq = '\\left(' + pTex(A) + ' + ' + pTex(B) + '\\right)^{2}';
      der = pMult(pSuma(A, B), pSuma(A, B));
    } else if (tipo === 'resta2') {
      nombre = 'Cuadrado de una diferencia';
      izq = '\\left(' + pTex(A) + ' - ' + pTex(B) + '\\right)^{2}';
      der = pMult(pResta(A, B), pResta(A, B));
    } else if (tipo === 'sumapordif') {
      nombre = 'Suma por diferencia';
      izq = '\\left(' + pTex(A) + ' + ' + pTex(B) + '\\right)\\left(' + pTex(A) + ' - ' + pTex(B) + '\\right)';
      der = pMult(pSuma(A, B), pResta(A, B));
    } else if (tipo === 'suma3') {
      nombre = 'Cubo de una suma';
      izq = '\\left(' + pTex(A) + ' + ' + pTex(B) + '\\right)^{3}';
      der = pPot(pSuma(A, B), 3);
    } else {
      nombre = 'Cubo de una diferencia';
      izq = '\\left(' + pTex(A) + ' - ' + pTex(B) + '\\right)^{3}';
      der = pPot(pResta(A, B), 3);
    }
    return { nombre: nombre, izq: izq, der: der, derTex: pTex(der) };
  }

  /* Caja grande con una expresión algebraica */
  function expr(label, tex, display) {
    /* Las expresiones muy largas (desarrollos de binomios de grado alto,
       factorizaciones con muchos factores) se reducen un poco para que
       quepan sin barra de desplazamiento. */
    var largo = String(tex).length;
    var cls = 'pol-expr' + (largo > 320 ? ' pol-expr-xs' : largo > 200 ? ' pol-expr-sm' : '');
    return '<div class="' + cls + '">' +
      (label ? '<span class="pol-expr-lab">' + esc(label) + '</span>' : '') +
      (display === false ? K(tex) : KD(tex)) + '</div>';
  }

  /* Fichas de los términos de un polinomio */
  function terminosHTML(p, v) {
    v = v || 'x';
    p = pRecorta(p);
    var h = '<div class="pol-terms">';
    var hay = false;
    for (var i = p.length - 1; i >= 0; i--) {
      if (p[i].n === 0n) continue;
      hay = true;
      var cl = 'pol-term' + (i === pGrado(p) ? ' pol-term-hi' : '') + (i === 0 ? ' pol-term-ind' : '');
      var t = (i === 0) ? p[i].tex(true) :
        (p[i].n === 1n && p[i].d === 1n ? '' : (p[i].n === -1n && p[i].d === 1n ? '-' : p[i].tex(true))) +
        v + (i > 1 ? '^{' + i + '}' : '');
      h += '<span class="' + cl + '"><span class="pol-term-x">' + K(t) + '</span>' +
        '<span class="pol-term-g">' + (i === 0 ? 'independiente' : 'grado ' + i) + '</span></span>';
    }
    if (!hay) h += '<span class="pol-term"><span class="pol-term-x">' + K('0') + '</span>' +
      '<span class="pol-term-g">nulo</span></span>';
    return h + '</div>';
  }

  /* Tabla de Ruffini dibujada */
  function ruffiniHTML(p, r, opts) {
    opts = opts || {};
    var R2 = ruffini(p, r);
    var n = R2.arriba.length;
    var h = '<table class="pol-ruf"><tbody>';
    h += '<tr class="pol-ruf-r1"><td></td>';
    R2.arriba.forEach(function (c) { h += '<td>' + K(c.tex(true)) + '</td>'; });
    h += '</tr>';
    h += '<tr class="pol-ruf-r2"><td class="pol-ruf-div">' + K(R2.r.tex(true)) + '</td><td></td>';
    for (var i = 1; i < n; i++) h += '<td>' + K(R2.sube[i].tex(true)) + '</td>';
    h += '</tr>';
    h += '<tr class="pol-ruf-r3"><td class="pol-ruf-div"></td>';
    R2.baja.forEach(function (c, i) {
      var ultimo = i === n - 1;
      h += '<td class="' + (ultimo ? (c.n === 0n ? 'pol-ruf-rest pol-ruf-rest0' : 'pol-ruf-rest') : '') + '">' +
        K(c.tex(true)) + '</td>';
    });
    h += '</tr></tbody></table>';
    var cap = opts.cap === undefined
      ? 'Fila 1: coeficientes ordenados de mayor a menor grado, con los ceros de los términos que faltan. Fila 2: cada valor se multiplica por ' +
        K(R2.r.tex(true)) + '. Fila 3: suma de las dos anteriores. La última casilla es el resto.'
      : opts.cap;
    return h + (cap ? '<p class="pol-ruf-cap">' + cap + '</p>' : '');
  }

  /* División larga en formato monoespaciado clásico */
  function divisionLargaHTML(A, B, v) {
    v = v || 'x';
    function pl(p) {                                  /* texto plano de un polinomio */
      p = pRecorta(p);
      if (pEsCero(p)) return '0';
      var s = '', primero = true;
      for (var i = p.length - 1; i >= 0; i--) {
        var c = p[i];
        if (c.n === 0n) continue;
        var neg = c.n < 0n;
        var abs = new Frac(neg ? -c.n : c.n, c.d);
        s += primero ? (neg ? '-' : '') : (neg ? ' - ' : ' + ');
        if (!(i > 0 && abs.n === 1n && abs.d === 1n)) s += abs.txt();
        if (i === 1) s += v; else if (i > 1) s += v + '^' + i;
        primero = false;
      }
      return s;
    }
    var D = pDiv(A, B);
    var lineas = [];
    var cab = pl(A);
    var anchoIzq = Math.max(cab.length, 20) + 2;
    lineas.push(pad(cab, anchoIzq) + '| ' + pl(B));
    lineas.push(pad('', anchoIzq) + '| ' + pl(D.q));
    lineas.push(rep('-', anchoIzq) + '+' + rep('-', Math.max(pl(B).length, pl(D.q).length) + 2));
    D.pasos.forEach(function (s) {
      lineas.push(pad('-(' + pl(s.producto) + ')', anchoIzq));
      lineas.push(pad(pl(s.resto), anchoIzq));
    });
    return '<div class="pol-mono">' + esc(lineas.join('\n')) + '</div>';
  }
  function pad(s, n) { while (s.length < n) s += ' '; return s; }
  function rep(c, n) { var s = ''; for (var i = 0; i < n; i++) s += c; return s; }

  /* ==================================================================
     9 · applet de diagnóstico (siempre en el núcleo)
     ================================================================== */
  R.diagnostico = function (node) {
    node.classList.add('applet');
    function ok(f) { try { return !!f(); } catch (e) { return false; } }
    var filas = [
      ['KaTeX local', !!window.katex],
      ['Núcleo pol-applets.js', true],
      ['Módulo pol-applets-a.js', window.POL && window.POL.extraA === true],
      ['Módulo pol-applets-b.js', window.POL && window.POL.extraB === true],
      ['Módulo pol-applets-c.js', window.POL && window.POL.extraC === true],
      ['Lectura de expresiones', ok(function () { return pTex(parsePol('2x(x-1)^2')) === '2x^{3} - 4x^{2} + 2x'; })],
      ['Producto exacto', ok(function () { return pTex(pMult(parsePol('x+1'), parsePol('x-1'))) === 'x^{2} - 1'; })],
      ['División con resto', ok(function () { var d = pDiv(parsePol('x^3-2x+1'), parsePol('x-1')); return pEsCero(d.r); })],
      ['Regla de Ruffini', ok(function () { return ruffini(parsePol('x^3-4x^2+5x-2'), new Frac(2)).resto.n === 0n; })],
      ['Factorización completa', ok(function () {
        var F = factorizaPol(parsePol('x^3-4x^2+5x-2'));
        return pIgual(factorRehacer(F), parsePol('x^3-4x^2+5x-2'));
      })],
      ['Fracciones algebraicas', ok(function () {
        var S = fraxSimplifica(new Frax(parsePol('x^2-1'), parsePol('x^2+2x+1')));
        return pTex(S.frax.n) === 'x - 1' && pTex(S.frax.d) === 'x + 1';
      })]
    ];
    var h = '<h4 class="mx-title">Applet · Diagnóstico técnico</h4>' +
      '<div class="mx-instr">Comprueba que el tema ha cargado bien. Si alguna fila sale en rojo, revisa el orden de carga en <code>assets/_scripts.html</code>.</div>' +
      '<table class="ap-tbl ap-pol"><thead><tr><th>Comprobación</th><th>Estado</th></tr></thead><tbody>';
    filas.forEach(function (f) {
      h += '<tr><th>' + f[0] + '</th><td>' + badge(f[1] ? 'correcto' : 'falla', f[1] ? 'si' : 'no') + '</td></tr>';
    });
    h += '</tbody></table>';
    var errs = window.POL && window.POL.log.length
      ? '<p class="ap-warn">Se han registrado ' + window.POL.log.length + ' avisos: ' +
        esc(window.POL.log.map(function (e) { return e.applet + ' — ' + e.error; }).join(' · ')) + '</p>'
      : '<p class="ap-note">Ningún applet ha registrado errores en esta página.</p>';
    node.innerHTML = h + errs;
    tex(node);
  };

  /* ==================================================================
     10 · API pública, arranque y espera de módulos
     ================================================================== */
  window.POL = {
    registry: R,
    /* texto y fórmulas */
    tex: tex, K: K, KD: KD, texifica: texifica, esc: esc,
    /* formato */
    fmt: fmt, nc: nc, etq: etq, kf: kf, mil: mil, milTex: milTex, sig: sig, casi: casi,
    /* entradas */
    entero: entero, real: real, fraccionTxt: fraccionTxt,
    /* aritmética entera y fraccionaria */
    Frac: Frac, mcd: mcd, mcm: mcm, factoriza: factoriza, factorizaTex: factorizaTex,
    esCuadradoPerfecto: esCuadradoPerfecto, divisores: divisores,
    /* polinomios */
    parsePol: parsePol, normalizaEntrada: normalizaEntrada,
    pDe: pDe, pMono: pMono, pRecorta: pRecorta, pCopia: pCopia, pEsCero: pEsCero,
    pGrado: pGrado, pGradoTxt: pGradoTxt, pLider: pLider, pIndep: pIndep,
    pSuma: pSuma, pResta: pResta, pOpuesto: pOpuesto, pEscala: pEscala,
    pMult: pMult, pPot: pPot, pIgual: pIgual, pDiv: pDiv,
    pEval: pEval, pEvalNum: pEvalNum, pDeriva: pDeriva,
    pTex: pTex, pTexPar: pTexPar, pEntero: pEntero, CERO: CERO, UNO: UNO,
    /* raíces y factorización */
    ruffini: ruffini, candidatosRaiz: candidatosRaiz, raicesRacionales: raicesRacionales,
    factorizaPol: factorizaPol, factorizaTexPol: factorizaTexPol,
    factorRehacer: factorRehacer, factoresLista: factoresLista,
    factorLinTex: factorLinTex, potTex: potTex,
    mcdPol: mcdPol, mcmPol: mcmPol,
    /* fracciones algebraicas */
    Frax: Frax, fraxSimplifica: fraxSimplifica, fraxSuma: fraxSuma,
    fraxMult: fraxMult, fraxDiv: fraxDiv, raicesDe: raicesDe,
    /* identidades notables */
    notable: notable,
    /* figuras */
    svgWrap: svgWrap, txt: txt, line: line, rect: rect, circle: circle,
    path: path, poly: poly, leyenda: leyenda, COL: COL,
    rectaReal: rectaReal, ejes: ejes,
    /* salidas y armazón */
    expr: expr, terminosHTML: terminosHTML, ruffiniHTML: ruffiniHTML,
    divisionLargaHTML: divisionLargaHTML,
    resultado: resultado, badge: badge, kvs: kvs, tabla: tabla, paso: paso,
    shell: shell,
    log: []
  };

  function boot() {
    document.querySelectorAll('[data-applet-pol]').forEach(function (n) {
      if (n.dataset.mounted) return;
      n.dataset.mounted = 1;
      var f = R[n.dataset.appletPol];
      if (!f) {
        n.innerHTML = '<div class="mx-bad ap-err">Clave inexistente: ' + esc(n.dataset.appletPol) + '</div>';
        return;
      }
      try { f(n); }
      catch (e) {
        n.innerHTML = '<div class="mx-bad ap-err">' + esc(e.message) + '</div>';
        window.POL.log.push({ applet: n.dataset.appletPol, error: e.message });
      }
    });
  }

  /* Espera a que KaTeX y los tres módulos estén cargados; si alguno no
     llega, monta igualmente para no dejar la página en blanco. */
  function startWhenReady() {
    var intentos = 0;
    (function espera() {
      var listo = window.katex &&
        window.POL.extraA === true && window.POL.extraB === true && window.POL.extraC === true;
      if (listo || intentos > 60) { boot(); return; }
      intentos++;
      setTimeout(espera, 60);
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWhenReady);
  } else {
    startWhenReady();
  }
  window.POL.boot = boot;
})();
