/* =====================================================================
   sys-applets.js · Tema 4 Sistemas de ecuaciones e inecuaciones
   1.º de Bachillerato · Matemáticas Aplicadas a las Ciencias Sociales
   Ruta: 1-BatxMatesCCSS/sistemas-ecuaciones-inecuaciones/assets/sys-applets.js

   NÚCLEO del tema (heredado del motor del Tema 3, misma arquitectura). Misma arquitectura que el motor de Números reales
   (re-applets.js) y que el de Estadística de 2.º: un núcleo con las
   utilidades comunes y tres módulos que registran los applets.

   API pública: window.SYS
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
      if (p.tex) b += '<foreignObject x="' + (X(p.x) - 80) + '" y="' + (Y(p.y) - 52) + '" width="160" height="40">' +
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
    var h = '<table class="ap-tbl ap-eq"><thead><tr>';
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
        el._sincroniza = function () { live.textContent = String(el.value).replace('.', ','); };
        el.addEventListener('input', el._sincroniza);
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
      /* Los escenarios asignan .value directamente y eso no dispara 'input':
         hay que refrescar a mano el rótulo en vivo de los deslizadores. */
      Object.keys(ctl).forEach(function (k) {
        if (ctl[k] && typeof ctl[k]._sincroniza === 'function') ctl[k]._sincroniza();
      });
      try {
        var html = compute(values(), ctl, out, api);
        if (html !== undefined && html !== null) {
          out.innerHTML = texifica(html);
          tex(out);
        }
      } catch (e) {
        out.innerHTML = '<div class="mx-bad ap-err">' + esc(e.message) + '</div>';
        tex(out);
        (window.SYS && window.SYS.log ? window.SYS.log : []).push({ applet: title, error: e.message });
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
    return '<div class="eq-expr">' +
      (label ? '<span class="eq-expr-lab">' + esc(label) + '</span>' : '') +
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
     E1 · radicales exactos:  √n = fuera·√dentro
     ================================================================== */
  function simplRaiz(n) {                      /* n entero >= 0 */
    n = Number(n);
    if (n < 0) return null;
    if (n === 0) return { fuera: 0, dentro: 1 };
    var fuera = 1, dentro = n, p = 2;
    while (p * p <= dentro) {
      while (dentro % (p * p) === 0) { dentro /= p * p; fuera *= p; }
      p++;
    }
    return { fuera: fuera, dentro: dentro };
  }
  function raizTex(n) {
    var s = simplRaiz(n);
    if (!s) return '\\sqrt{' + n + '}';
    if (s.dentro === 1) return String(s.fuera);
    return (s.fuera === 1 ? '' : s.fuera) + '\\sqrt{' + s.dentro + '}';
  }

  /* Número de la forma  (p ± q√r)/s  con enteros, ya reducido.
     Sirve para escribir las raíces irracionales de una cuadrática de
     forma exacta, sin decimales. */
  function Irr(p, q, r, s) {
    this.p = p; this.q = q; this.r = r; this.s = s;   /* (p + q√r)/s */
    var sr = simplRaiz(r);
    if (sr && sr.dentro === 1) { this.p = p + q * sr.fuera; this.q = 0; this.r = 1; }
    else if (sr) { this.q = q * sr.fuera; this.r = sr.dentro; }
    if (this.s < 0) { this.p = -this.p; this.q = -this.q; this.s = -this.s; }
    var g = Math.abs(mcdN(mcdN(this.p, this.q), this.s)) || 1;
    this.p /= g; this.q /= g; this.s /= g;
  }
  function mcdN(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  Irr.prototype.val = function () { return (this.p + this.q * Math.sqrt(this.r)) / this.s; };
  Irr.prototype.esRacional = function () { return this.q === 0 || this.r === 1; };
  Irr.prototype.frac = function () { return new Frac(BigInt(this.p), BigInt(this.s)); };
  Irr.prototype.tex = function () {
    if (this.esRacional()) return this.frac().tex(true);
    var num = (this.p === 0 ? '' : this.p) +
      (this.q < 0 ? (this.p === 0 ? '-' : ' - ') : (this.p === 0 ? '' : ' + ')) +
      (Math.abs(this.q) === 1 ? '' : Math.abs(this.q)) + '\\sqrt{' + this.r + '}';
    return this.s === 1 ? num : '\\dfrac{' + num + '}{' + this.s + '}';
  };
  Irr.prototype.txt = function () { return this.esRacional() ? this.frac().txt() : nc(this.val(), 4); };
  Irr.prototype.aprox = function (d) { return kf(this.val(), d == null ? 3 : d); };

  /* ==================================================================
     E2 · conjuntos de números reales como unión de intervalos
     Un trozo es {a, b, ai, bi}: extremos (±Infinity permitido) y si
     cada uno está incluido. Un punto aislado es un trozo degenerado.
     ================================================================== */
  function Conj(trozos) { this.t = (trozos || []).slice(); this.normaliza(); }
  Conj.vacio = function () { return new Conj([]); };
  Conj.todo = function () { return new Conj([{ a: -Infinity, b: Infinity, ai: false, bi: false }]); };
  Conj.punto = function (x) { return new Conj([{ a: x, b: x, ai: true, bi: true }]); };
  Conj.puntos = function (xs) { return new Conj(xs.map(function (x) { return { a: x, b: x, ai: true, bi: true }; })); };
  Conj.intervalo = function (a, b, ai, bi) { return new Conj([{ a: a, b: b, ai: !!ai, bi: !!bi }]); };
  Conj.prototype.normaliza = function () {
    var t = this.t.filter(function (i) { return i.a < i.b || (i.a === i.b && i.ai && i.bi); });
    t.sort(function (u, v) { return u.a - v.a || (v.ai ? 1 : 0) - (u.ai ? 1 : 0); });
    var out = [];
    t.forEach(function (i) {
      var L = out[out.length - 1];
      if (L && (i.a < L.b || (i.a === L.b && (i.ai || L.bi)))) {
        if (i.b > L.b) { L.b = i.b; L.bi = i.bi; }
        else if (i.b === L.b) { L.bi = L.bi || i.bi; }
      } else out.push({ a: i.a, b: i.b, ai: i.ai, bi: i.bi });
    });
    this.t = out;
  };
  Conj.prototype.esVacio = function () { return this.t.length === 0; };
  Conj.prototype.esTodo = function () { return this.t.length === 1 && this.t[0].a === -Infinity && this.t[0].b === Infinity; };
  Conj.prototype.contiene = function (x) {
    return this.t.some(function (i) {
      return (x > i.a || (x === i.a && i.ai)) && (x < i.b || (x === i.b && i.bi));
    });
  };
  Conj.prototype.union = function (o) { return new Conj(this.t.concat(o.t)); };
  Conj.prototype.comp = function () {                 /* complementario en R */
    var out = [], cur = -Infinity, curIn = false;
    this.t.forEach(function (i) {
      out.push({ a: cur, b: i.a, ai: curIn, bi: !i.ai });
      cur = i.b; curIn = !i.bi;
    });
    out.push({ a: cur, b: Infinity, ai: curIn, bi: false });
    return new Conj(out.filter(function (i) { return i.a < i.b || (i.a === i.b && i.ai && i.bi); }));
  };
  Conj.prototype.inter = function (o) { return this.comp().union(o.comp()).comp(); };
  Conj.prototype.quita = function (xs) {             /* quita puntos sueltos */
    var C = this;
    (Array.isArray(xs) ? xs : [xs]).forEach(function (x) { C = C.inter(Conj.punto(x).comp()); });
    return C;
  };
  function numTex(x) {
    if (x === Infinity) return '+\\infty';
    if (x === -Infinity) return '-\\infty';
    if (x instanceof Frac) return x.tex(true);
    if (x instanceof Irr) return x.tex();
    return kf(x, 4);
  }
  Conj.prototype.tex = function (etqs) {
    if (this.esVacio()) return '\\varnothing';
    if (this.esTodo()) return '\\mathbb{R}';
    var E = etqs || {};
    function nom(x) { return E[x] != null ? E[x] : numTex(x); }
    return this.t.map(function (i) {
      if (i.a === i.b) return '\\{' + nom(i.a) + '\\}';
      return '\\left' + (i.ai ? '[' : '(') + nom(i.a) + ',\\; ' + nom(i.b) + '\\right' + (i.bi ? ']' : ')');
    }).join(' \\cup ');
  };
  Conj.prototype.desig = function (v) {              /* con desigualdades */
    v = v || 'x';
    if (this.esVacio()) return '\\text{sin solución}';
    if (this.esTodo()) return v + ' \\in \\mathbb{R}';
    return this.t.map(function (i) {
      if (i.a === i.b) return v + ' = ' + numTex(i.a);
      if (i.a === -Infinity) return v + (i.bi ? ' \\leq ' : ' < ') + numTex(i.b);
      if (i.b === Infinity) return v + (i.ai ? ' \\geq ' : ' > ') + numTex(i.a);
      return numTex(i.a) + (i.ai ? ' \\leq ' : ' < ') + v + (i.bi ? ' \\leq ' : ' < ') + numTex(i.b);
    }).join(' \\quad\\text{o}\\quad ');
  };

  /* Recta real con el conjunto sombreado, a tamaño grande. */
  function rectaConj(C, opts) {
    opts = opts || {};
    var marcas = (opts.marcas || []).map(Number).filter(function (v) { return isFinite(v); });
    C.t.forEach(function (i) { [i.a, i.b].forEach(function (v) { if (isFinite(v)) marcas.push(v); }); });
    var vals = marcas.length ? marcas : [0];
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (max - min < 1) { var c = (min + max) / 2; min = c - 2; max = c + 2; }
    var pad = (max - min) * 0.35 + 0.5;
    min = Math.floor(min - pad); max = Math.ceil(max + pad);
    var W = opts.W || 1000, H = opts.H || 210, mx = 62, yy = Math.round(H * 0.56);
    function X(v) { return mx + (v - min) / (max - min) * (W - 2 * mx); }
    var b = '';
    /* zona sombreada */
    C.t.forEach(function (i) {
      var x1 = X(Math.max(i.a, min - 1)), x2 = X(Math.min(i.b, max + 1));
      if (i.a === i.b) return;
      b += rect(x1, yy - 15, Math.max(x2 - x1, 1), 30, 'rgba(37,99,235,.20)', 'none');
      b += line(x1, yy, x2, yy, COL.azul, 8);
    });
    /* eje */
    b += line(mx - 26, yy, W - mx + 26, yy, '#334155', 2.6);
    b += path('M ' + (W - mx + 26) + ' ' + yy + ' l -13 -7 l 0 14 z', '#334155', 1, '#334155');
    b += path('M ' + (mx - 26) + ' ' + yy + ' l 13 -7 l 0 14 z', '#334155', 1, '#334155');
    /* enteros */
    var pasoE = Math.max(1, Math.round((max - min) / 12));
    for (var k = Math.ceil(min); k <= max; k += pasoE) {
      b += line(X(k), yy - 8, X(k), yy + 8, '#94a3b8', 1.6);
      b += txt(X(k), yy + 34, etq(k), { s: 19, a: 'middle', c: '#475569' });
    }
    /* extremos */
    C.t.forEach(function (i) {
      [[i.a, i.ai], [i.b, i.bi]].forEach(function (par) {
        var v = par[0];
        if (!isFinite(v)) return;
        b += par[1] ? circle(X(v), yy, 11, COL.azul, '#fff', 3)
          : circle(X(v), yy, 11, '#fff', COL.azul, 3.4);
        b += '<foreignObject x="' + (X(v) - 80) + '" y="' + (yy - 66) + '" width="160" height="42">' +
          '<div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-size:21px;color:#1d4ed8">' +
          '<span data-tex="' + esc(numTex(v)) + '"></span></div></foreignObject>';
      });
    });
    if (C.esVacio()) b += txt(W / 2, yy - 42, 'El conjunto solución está vacío', { s: 22, a: 'middle', c: COL.rojo, w: 700 });
    return svgWrap(b, W, H, opts.label || 'Conjunto solución sobre la recta real', opts.cap);
  }

  /* ==================================================================
     E3 · ecuaciones de primer grado
     ================================================================== */
  function solLineal(a, b) {                  /* a·x + b = 0, a y b Frac */
    if (a.n === 0n) {
      return b.n === 0n
        ? { tipo: 'identidad', conj: Conj.todo(), tex: 'x \\in \\mathbb{R}' }
        : { tipo: 'incompatible', conj: Conj.vacio(), tex: '\\varnothing' };
    }
    var x = b.opuesto().entre(a);
    return { tipo: 'unica', x: x, conj: Conj.punto(x.val()), tex: 'x = ' + x.tex(true) };
  }

  /* Resuelve  izq = der  cuando ambos miembros son polinomios,
     devolviendo los pasos didácticos habituales. */
  function resuelveLinealPaso(izqTxt, derTxt) {
    var A = parsePol(izqTxt), B = parsePol(derTxt);
    var D = pResta(A, B);
    var pasos = [];
    pasos.push({ t: 'Paso todo al primer miembro', tex: pTex(D) + ' = 0' });
    var den = 1n;
    D.forEach(function (c) { den = den * c.d / bmcd(den, c.d); });
    if (den !== 1n) {
      D = D.map(function (c) { return c.por(new Frac(den)); });
      pasos.push({ t: 'Multiplico por el m.c.m. de los denominadores, ' + den, tex: pTex(D) + ' = 0' });
    }
    var g = pGrado(D);
    if (g === 1) {
      var a = D[1], b = D[0];
      pasos.push({ t: 'Agrupo la incógnita y los números', tex: a.tex(true) + 'x = ' + b.opuesto().tex(true) });
      var S = solLineal(a, b);
      pasos.push({ t: 'Despejo', tex: S.tex });
      return { grado: 1, pasos: pasos, sol: S, poli: D };
    }
    return { grado: g, pasos: pasos, poli: D };
  }

  /* ==================================================================
     E4 · ecuaciones de segundo grado
     ================================================================== */
  function solCuadratica(a, b, c) {           /* Frac */
    /* paso a coeficientes enteros para trabajar con el discriminante */
    var den = 1n;
    [a, b, c].forEach(function (f) { den = den * f.d / bmcd(den, f.d); });
    var A = Number(a.por(new Frac(den)).n), B = Number(b.por(new Frac(den)).n), C = Number(c.por(new Frac(den)).n);
    var g = mcdN(mcdN(A, B), C) || 1;
    if (A < 0) g = -g;
    A /= g; B /= g; C /= g;
    var disc = B * B - 4 * A * C;
    var R = { a: A, b: B, c: C, disc: disc, enteriza: den !== 1n || g !== 1, simplificada: [A, B, C] };
    if (A === 0) {
      var L = solLineal(new Frac(BigInt(B)), new Frac(BigInt(C)));
      R.tipo = 'lineal'; R.sol = L; R.conj = L.conj; R.raices = L.x ? [new Irr(Number(L.x.n), 0, 1, Number(L.x.d))] : [];
      return R;
    }
    R.completa = (B !== 0 && C !== 0);
    R.incompletaTipo = B === 0 && C === 0 ? 'doble-cero' : (C === 0 ? 'sin-c' : (B === 0 ? 'sin-b' : null));
    if (disc > 0) {
      R.tipo = 'dos';
      R.raices = [new Irr(-B, 1, disc, 2 * A), new Irr(-B, -1, disc, 2 * A)];
      R.raices.sort(function (u, v) { return u.val() - v.val(); });
      R.conj = Conj.puntos(R.raices.map(function (r) { return r.val(); }));
    } else if (disc === 0) {
      R.tipo = 'doble';
      R.raices = [new Irr(-B, 0, 1, 2 * A)];
      R.conj = Conj.puntos([R.raices[0].val()]);
    } else {
      R.tipo = 'ninguna'; R.raices = []; R.conj = Conj.vacio();
    }
    R.exacta = disc >= 0 && (simplRaiz(disc) || {}).dentro === 1;
    R.suma = new Frac(BigInt(-B), BigInt(A));
    R.producto = new Frac(BigInt(C), BigInt(A));
    R.vertice = { x: -B / (2 * A), y: (4 * A * C - B * B) / (4 * A) };
    return R;
  }
  function cuadTex(a, b, c, v) {
    v = v || 'x';
    return pTex(pDe([c, b, a]).map(function (f) { return f; })).replace(/x/g, v) + ' = 0';
  }
  function raicesTex(R) {
    if (R.tipo === 'ninguna') return '\\varnothing';
    return R.raices.map(function (r, i) { return v0(R, i) + ' = ' + r.tex(); }).join(', \\quad ');
  }
  function v0(R, i) { return R.tipo === 'doble' ? 'x_1 = x_2' : 'x_' + (i + 1); }

  /* ==================================================================
     E5 · bicuadradas y bipotenciales  a·x^(2n) + b·x^n + c = 0
     ================================================================== */
  function solBipotencial(a, b, c, n) {
    n = n || 2;
    var T = solCuadratica(a, b, c);
    var salida = { cuad: T, n: n, ramas: [], conj: Conj.vacio() };
    T.raices.forEach(function (t) {
      var tv = t.val();
      var rama = { t: t, valores: [] };
      if (n % 2 === 0) {
        if (tv > 0) {
          var raiz = Math.sqrt(tv);
          rama.valores = [-raiz, raiz];
          rama.motivo = 'dos soluciones';
          if (t.esRacional() && t.frac().esCuadrado && t.frac().esCuadrado()) rama.exacta = true;
        } else if (tv === 0) { rama.valores = [0]; rama.motivo = 'una solución'; }
        else { rama.valores = []; rama.motivo = 'ninguna: un valor par de una potencia par no puede ser negativo'; }
      } else {
        rama.valores = [Math.cbrt(tv)];
        rama.motivo = 'una solución';
      }
      salida.ramas.push(rama);
      salida.conj = salida.conj.union(Conj.puntos(rama.valores));
    });
    return salida;
  }

  /* ==================================================================
     E6 · ecuaciones polinómicas por factorización
     ================================================================== */
  function solPolinomica(p) {
    p = pRecorta(p);
    var F = factorizaPol(p);
    var raices = [], vistos = {};
    if (F.xk) { vistos['0'] = 1; raices.push({ raiz: new Frac(0n), mult: F.xk, tipo: 'racional', deFactorX: true }); }
    F.lineales.forEach(function (L) {
      var v = L.raiz.val(), k = L.raiz.txt();
      if (!vistos[k]) { vistos[k] = 1; raices.push({ raiz: L.raiz, mult: L.mult, tipo: 'racional' }); }
    });
    var extra = [];
    var irreducibles = [];
    (F.cuads || []).forEach(function (q) {
      if (pGrado(q.poly) !== 2) { irreducibles.push(q); return; }
      var Q = solCuadratica(q.poly[2], q.poly[1], q.poly[0]);
      extra.push({ p: q.poly, mult: q.mult, cuad: Q });
      Q.raices.forEach(function (r) { raices.push({ irr: r, mult: q.mult, tipo: 'irracional' }); });
    });
    raices.sort(function (u, v) { return (u.raiz ? u.raiz.val() : u.irr.val()) - (v.raiz ? v.raiz.val() : v.irr.val()); });
    return {
      factor: F, raices: raices, cuadraticos: extra, irreducibles: irreducibles,
      conj: Conj.puntos(raices.map(function (r) { return r.raiz ? r.raiz.val() : r.irr.val(); })),
      grado: pGrado(p)
    };
  }

  /* ==================================================================
     E7 · ecuaciones racionales  N(x)/D(x) = M(x)/E(x)
     ================================================================== */
  function solRacional(n1, d1, n2, d2) {
    /* cruzo en multiplicación: n1·d2 − n2·d1 = 0, con D≠0 */
    var izq = pMult(n1, d2), der = pMult(n2, d1);
    var P = pResta(izq, der);
    var prohibidos = [];
    [d1, d2].forEach(function (d) {
      if (pGrado(d) <= 0) return;
      raicesDe(d).forEach(function (r) {
        if (!prohibidos.some(function (q) { return q.cmp(r) === 0; })) prohibidos.push(r);
      });
    });
    var S = solPolinomica(P);
    var validas = [], descartadas = [];
    S.raices.forEach(function (r) {
      var v = r.raiz ? r.raiz.val() : r.irr.val();
      var anula = prohibidos.some(function (q) { return Math.abs(q.val() - v) < 1e-12; });
      (anula ? descartadas : validas).push(r);
    });
    return {
      cruzada: P, prohibidos: prohibidos, todas: S.raices,
      validas: validas, descartadas: descartadas,
      conj: Conj.puntos(validas.map(function (r) { return r.raiz ? r.raiz.val() : r.irr.val(); })),
      dominio: Conj.todo().quita(prohibidos.map(function (q) { return q.val(); }))
    };
  }

  /* ==================================================================
     E8 · ecuaciones radicales   √(A(x)) = B(x)   ó   √A ± √C = B
     ================================================================== */
  function solRadical(A, B) {                 /* √(A) = B, A y B polinomios */
    var P = pResta(pPot(B, 2), A);            /* B² − A = 0 */
    var S = solPolinomica(P);
    var validas = [], falsas = [];
    S.raices.forEach(function (r) {
      var v = r.raiz ? r.raiz.val() : r.irr.val();
      var a = pEvalNum(A, v), b = pEvalNum(B, v);
      var ok = a >= -1e-9 && b >= -1e-9 && Math.abs(Math.sqrt(Math.max(a, 0)) - b) < 1e-7;
      (ok ? validas : falsas).push({ r: r, v: v, radicando: a, miembro: b, ok: ok });
    });
    return {
      elevada: P, todas: S.raices, comprob: validas.concat(falsas),
      validas: validas, falsas: falsas,
      conj: Conj.puntos(validas.map(function (c) { return c.v; })),
      dominioTex: pTex(A) + ' \\geq 0'
    };
  }

  /* ==================================================================
     E9 · exponenciales y logarítmicas
     ================================================================== */
  function esPotencia(n, b) {                 /* n = b^k con k entero ? */
    if (n <= 0 || b <= 1) return null;
    var k = Math.round(Math.log(n) / Math.log(b));
    for (var j = Math.max(0, k - 2); j <= k + 2; j++) if (Math.abs(Math.pow(b, j) - n) < 1e-9) return j;
    return null;
  }
  function solExponencial(base, expIzq, valor) {
    /* base^(expIzq(x)) = valor  ->  expIzq(x) = log_base(valor) */
    var k = esPotencia(valor, base);
    var res = { base: base, valor: valor, exacto: k != null, k: k };
    var objetivo = k != null ? new Frac(BigInt(k)) : null;
    if (k != null) {
      var D = pResta(expIzq, pDe([objetivo]));
      res.igualdad = pTex(expIzq) + ' = ' + k;
      var S = pGrado(D) === 1 ? { tipo: 'lineal', s: solLineal(D[1], D[0]) } : { tipo: 'poli', s: solPolinomica(D) };
      res.reducida = D; res.sol = S;
      res.conj = S.tipo === 'lineal' ? S.s.conj : S.s.conj;
    } else {
      res.logTex = '\\log_{' + base + '} ' + valor + ' = \\dfrac{\\ln ' + valor + '}{\\ln ' + base + '} \\approx ' +
        kf(Math.log(valor) / Math.log(base), 4);
      res.conj = Conj.vacio();
    }
    return res;
  }
  function solLogaritmica(base, arg, valor) {
    /* log_base(arg(x)) = valor  ->  arg(x) = base^valor, con arg > 0 */
    var objetivo = Math.pow(base, valor);
    var D = pResta(arg, pDe([new Frac(BigInt(Math.round(objetivo)))]));
    var S = solPolinomica(D);
    var validas = [], descartadas = [];
    S.raices.forEach(function (r) {
      var v = r.raiz ? r.raiz.val() : r.irr.val();
      (pEvalNum(arg, v) > 1e-9 ? validas : descartadas).push({ r: r, v: v, arg: pEvalNum(arg, v) });
    });
    return {
      base: base, valor: valor, objetivo: objetivo, reducida: D,
      validas: validas, descartadas: descartadas,
      conj: Conj.puntos(validas.map(function (c) { return c.v; })),
      condicionTex: pTex(arg) + ' > 0'
    };
  }

  /* ==================================================================
     E10 · ecuaciones trigonométricas elementales
     ================================================================== */
  var TRIG_NOT = {
    sen: { tex: '\\operatorname{sen}', f: Math.sin, per: 2 },
    cos: { tex: '\\cos', f: Math.cos, per: 2 },
    tg: { tex: '\\operatorname{tg}', f: Math.tan, per: 1 }
  };
  /* ángulos notables: valor -> {tex, rad} */
  var NOTABLES = [
    { v: 0, tex: '0', rad: 0 },
    { v: 1 / 6, tex: '\\dfrac{\\pi}{6}', rad: Math.PI / 6 },
    { v: 1 / 4, tex: '\\dfrac{\\pi}{4}', rad: Math.PI / 4 },
    { v: 1 / 3, tex: '\\dfrac{\\pi}{3}', rad: Math.PI / 3 },
    { v: 1 / 2, tex: '\\dfrac{\\pi}{2}', rad: Math.PI / 2 },
    { v: 2 / 3, tex: '\\dfrac{2\\pi}{3}', rad: 2 * Math.PI / 3 },
    { v: 3 / 4, tex: '\\dfrac{3\\pi}{4}', rad: 3 * Math.PI / 4 },
    { v: 5 / 6, tex: '\\dfrac{5\\pi}{6}', rad: 5 * Math.PI / 6 },
    { v: 1, tex: '\\pi', rad: Math.PI },
    { v: 7 / 6, tex: '\\dfrac{7\\pi}{6}', rad: 7 * Math.PI / 6 },
    { v: 5 / 4, tex: '\\dfrac{5\\pi}{4}', rad: 5 * Math.PI / 4 },
    { v: 4 / 3, tex: '\\dfrac{4\\pi}{3}', rad: 4 * Math.PI / 3 },
    { v: 3 / 2, tex: '\\dfrac{3\\pi}{2}', rad: 3 * Math.PI / 2 },
    { v: 5 / 3, tex: '\\dfrac{5\\pi}{3}', rad: 5 * Math.PI / 3 },
    { v: 7 / 4, tex: '\\dfrac{7\\pi}{4}', rad: 7 * Math.PI / 4 },
    { v: 11 / 6, tex: '\\dfrac{11\\pi}{6}', rad: 11 * Math.PI / 6 }
  ];
  function anguloTex(rad) {
    var r = ((rad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    for (var i = 0; i < NOTABLES.length; i++) if (Math.abs(NOTABLES[i].rad - r) < 1e-9) return NOTABLES[i].tex;
    return kf(r * 180 / Math.PI, 2) + '^{\\circ}';
  }
  function gradTex(rad) {
    var g = ((rad * 180 / Math.PI) % 360 + 360) % 360;
    return (Math.abs(g - Math.round(g)) < 1e-7 ? String(Math.round(g)) : kf(g, 2)) + '^{\\circ}';
  }
  function solTrig(fn, k) {                   /* fn ∈ {sen,cos,tg}, valor k */
    var T = TRIG_NOT[fn];
    var R = { fn: fn, tex: T.tex, k: k, base: [], familia: [], enRango: [] };
    if (fn === 'tg') {
      var a = Math.atan(k);
      R.base = [a];
      R.familia = [{ tex: anguloTex(a) + ' + k\\pi', ang: a, per: Math.PI }];
    } else if (Math.abs(k) > 1) {
      R.imposible = true;
      return R;
    } else if (fn === 'sen') {
      var s = Math.asin(k);
      R.base = [s, Math.PI - s];
      R.familia = [
        { tex: anguloTex(s) + ' + 2k\\pi', ang: s, per: 2 * Math.PI },
        { tex: anguloTex(Math.PI - s) + ' + 2k\\pi', ang: Math.PI - s, per: 2 * Math.PI }
      ];
    } else {
      var c = Math.acos(k);
      R.base = [c, 2 * Math.PI - c];
      R.familia = [
        { tex: anguloTex(c) + ' + 2k\\pi', ang: c, per: 2 * Math.PI },
        { tex: anguloTex(2 * Math.PI - c) + ' + 2k\\pi', ang: 2 * Math.PI - c, per: 2 * Math.PI }
      ];
    }
    /* soluciones dentro de [0, 2π) */
    var vistas = {};
    R.familia.forEach(function (f) {
      for (var j = -2; j <= 3; j++) {
        var x = f.ang + j * f.per;
        if (x >= -1e-9 && x < 2 * Math.PI - 1e-9) {
          var key = x.toFixed(9);
          if (!vistas[key]) { vistas[key] = 1; R.enRango.push(x); }
        }
      }
    });
    R.enRango.sort(function (u, v) { return u - v; });
    return R;
  }

  /* ==================================================================
     E11 · inecuaciones: tabla de signos y conjunto solución
     ================================================================== */
  var RELS = {
    '>': { tex: '>', ok: function (s) { return s > 0; }, cerrada: false },
    '<': { tex: '<', ok: function (s) { return s < 0; }, cerrada: false },
    '>=': { tex: '\\geq', ok: function (s) { return s > 0; }, cerrada: true },
    '<=': { tex: '\\leq', ok: function (s) { return s < 0; }, cerrada: true }
  };
  function inecLineal(a, b, rel) {            /* a·x + b  rel  0 */
    var Rl = RELS[rel];
    if (a.n === 0n) {
      var s = b.val();
      var vale = Rl.ok(s) || (Rl.cerrada && Math.abs(s) < 1e-12);
      return { grado: 0, giro: false, conj: vale ? Conj.todo() : Conj.vacio(), rel: rel, trivial: true };
    }
    var x = b.opuesto().entre(a);
    var negativo = a.val() < 0;
    var relFinal = negativo ? { '>': '<', '<': '>', '>=': '<=', '<=': '>=' }[rel] : rel;
    var xv = x.val();
    var mayor = relFinal === '>' || relFinal === '>=';
    var cerr = RELS[relFinal].cerrada;
    var conj = mayor ? Conj.intervalo(xv, Infinity, cerr, false) : Conj.intervalo(-Infinity, xv, false, cerr);
    return { grado: 1, x: x, giro: negativo, rel: rel, relFinal: relFinal, conj: conj, frontera: xv };
  }
  /* signo de un polinomio factorizado en cada trozo determinado por sus raíces */
  function tablaSignos(p, rel, opts) {
    opts = opts || {};
    var Rl = RELS[rel];
    p = pRecorta(p);
    var ceros = [];
    raicesDe(p).forEach(function (r) { ceros.push({ v: r.val(), tex: r.tex(true), tipo: 'cero' }); });
    var g = pGrado(p);
    if (g === 2) {                              /* añade raíces irracionales */
      var Q = solCuadratica(p[2], p[1], p[0]);
      if (Q.tipo !== 'ninguna' && !ceros.length) {
        Q.raices.forEach(function (r) { ceros.push({ v: r.val(), tex: r.tex(), tipo: 'cero' }); });
      }
    }
    (opts.polos || []).forEach(function (q) { ceros.push({ v: q.v, tex: q.tex, tipo: 'polo' }); });
    ceros = ceros.filter(function (c, i, A) {
      return A.findIndex(function (d) { return Math.abs(d.v - c.v) < 1e-12; }) === i;
    }).sort(function (u, v) { return u.v - v.v; });
    var f = opts.f || function (x) { return pEvalNum(p, x); };
    var trozos = [], conj = Conj.vacio();
    for (var i = 0; i <= ceros.length; i++) {
      var a = i === 0 ? -Infinity : ceros[i - 1].v;
      var b = i === ceros.length ? Infinity : ceros[i].v;
      var m = !isFinite(a) && !isFinite(b) ? 0 : (!isFinite(a) ? b - 1 : (!isFinite(b) ? a + 1 : (a + b) / 2));
      var s = f(m);
      var pos = s > 0;
      trozos.push({ a: a, b: b, muestra: m, valor: s, signo: pos ? '+' : '−', cumple: Rl.ok(s) });
      if (Rl.ok(s)) conj = conj.union(Conj.intervalo(a, b, false, false));
    }
    if (Rl.cerrada) {
      ceros.forEach(function (c) { if (c.tipo === 'cero') conj = conj.union(Conj.punto(c.v)); });
    }
    conj = conj.quita(ceros.filter(function (c) { return c.tipo === 'polo'; }).map(function (c) { return c.v; }));
    return { ceros: ceros, trozos: trozos, conj: conj, rel: rel, grado: g };
  }
  function inecRacional(n, d, rel) {
    var polos = raicesDe(d).map(function (r) { return { v: r.val(), tex: r.tex(true) }; });
    return tablaSignos(n, rel, {
      polos: polos,
      f: function (x) { var dv = pEvalNum(d, x); return dv === 0 ? NaN : pEvalNum(n, x) / dv; }
    });
  }
  /* HTML de la tabla de signos, grande y legible */
  function tablaSignosHTML(T, etiqueta) {
    var cab = ['Intervalo'], fila1 = [], fila2 = [];
    T.trozos.forEach(function (t) {
      cab.push(K(intervTex(t)));
      fila1.push('<span class="eq-sg ' + (t.signo === '+' ? 'eq-sg-p' : 'eq-sg-n') + '">' + t.signo + '</span>');
      fila2.push(t.cumple ? badge('sí', 'si') : badge('no', 'no'));
    });
    var h = '<table class="ap-tbl ap-eq eq-signos"><thead><tr>';
    cab.forEach(function (c, i) { h += (i ? '<th>' : '<th class="eq-th-lab">') + c + '</th>'; });
    h += '</tr></thead><tbody><tr><th>Signo de ' + K(etiqueta || 'f(x)') + '</th>';
    fila1.forEach(function (c) { h += '<td>' + c + '</td>'; });
    h += '</tr><tr><th>¿Cumple ' + K(RELS[T.rel].tex + ' 0') + '?</th>';
    fila2.forEach(function (c) { h += '<td>' + c + '</td>'; });
    return h + '</tr></tbody></table>';
  }
  function intervTex(t) {
    var a = t.a === -Infinity ? '-\\infty' : numTex(t.a);
    var b = t.b === Infinity ? '+\\infty' : numTex(t.b);
    return '\\left(' + a + ',\\, ' + b + '\\right)';
  }

  /* ==================================================================
     E12 · comprobación de una solución, para el hábito de verificar
     ================================================================== */
  function comprueba(izq, der, x) {
    var a = pEvalNum(izq, x), b = pEvalNum(der, x);
    return { izq: a, der: b, ok: Math.abs(a - b) < 1e-9, dif: a - b };
  }

  /* ==================================================================
     E13 · applet de diagnóstico (siempre en el núcleo)
     ================================================================== */
  R.diagnostico = function (node) {
    node.classList.add('applet');
    function ok(f) { try { return !!f(); } catch (e) { return false; } }
    var filas = [
      ['KaTeX local', !!window.katex],
      ['Núcleo sys-applets.js', true],
      ['Módulo sys-applets-a.js (ecuaciones polinómicas)', window.SYS && window.SYS.extraA === true],
      ['Módulo sys-applets-b.js (racionales, radicales, exponenciales)', window.SYS && window.SYS.extraB === true],
      ['Módulo sys-applets-c.js (trigonométricas e inecuaciones)', window.SYS && window.SYS.extraC === true],
      ['Lectura de expresiones', ok(function () { return pTex(parsePol('2x(x-1)^2')) === '2x^{3} - 4x^{2} + 2x'; })],
      ['Ecuación de primer grado', ok(function () {
        var S = solLineal(new Frac(3n), new Frac(-12n));
        return S.tipo === 'unica' && S.x.val() === 4;
      })],
      ['Fórmula de segundo grado', ok(function () {
        var Q = solCuadratica(new Frac(1n), new Frac(-5n), new Frac(6n));
        return Q.disc === 1 && Q.raices.length === 2 && Q.raices[0].val() === 2 && Q.raices[1].val() === 3;
      })],
      ['Raíces irracionales exactas', ok(function () {
        var Q = solCuadratica(new Frac(1n), new Frac(-2n), new Frac(-1n));
        return Q.raices[1].tex() === '1 + \\sqrt{2}';
      })],
      ['Cambio de variable (bicuadradas)', ok(function () {
        var B = solBipotencial(new Frac(1n), new Frac(-5n), new Frac(4n), 2);
        return B.conj.t.length === 4;
      })],
      ['Soluciones falsas en radicales', ok(function () {
        var S = solRadical(parsePol('x+7'), parsePol('x+1'));
        return S.validas.length === 1 && S.falsas.length === 1;
      })],
      ['Restricciones en ecuaciones racionales', ok(function () {
        var S = solRacional(parsePol('1'), parsePol('x-2'), parsePol('1'), parsePol('x^2-4'));
        return S.prohibidos.length === 2;
      })],
      ['Tabla de signos e intervalos', ok(function () {
        var T = tablaSignos(parsePol('x^2-x-6'), '>');
        return T.conj.t.length === 2 && T.conj.tex().indexOf('\\cup') > 0;
      })],
      ['Ecuaciones trigonométricas', ok(function () {
        var S = solTrig('sen', 0.5);
        return S.enRango.length === 2 && S.familia[0].tex.indexOf('\\pi}{6}') > 0;
      })]
    ];
    var h = '<h4 class="mx-title">Applet · Diagnóstico técnico</h4>' +
      '<div class="mx-instr">Comprueba que el tema ha cargado bien. Si alguna fila sale en rojo, revisa el orden de carga en <code>assets/_scripts.html</code>.</div>' +
      '<table class="ap-tbl ap-eq"><thead><tr><th>Comprobación</th><th>Estado</th></tr></thead><tbody>';
    filas.forEach(function (f) {
      h += '<tr><th>' + f[0] + '</th><td>' + badge(f[1] ? 'correcto' : 'falla', f[1] ? 'si' : 'no') + '</td></tr>';
    });
    h += '</tbody></table>';
    var errs = window.SYS && window.SYS.log.length
      ? '<p class="ap-warn">Se han registrado ' + window.SYS.log.length + ' avisos: ' +
        esc(window.SYS.log.map(function (e) { return e.applet + ' — ' + e.error; }).join(' · ')) + '</p>'
      : '<p class="ap-note">Ningún applet ha registrado errores en esta página.</p>';
    node.innerHTML = h + errs;
    tex(node);
  };

  /* ==================================================================
     E14 · API pública, arranque y espera de módulos
     ================================================================== */
  window.SYS = {
    registry: R,
    /* texto y fórmulas */
    tex: tex, K: K, KD: KD, texifica: texifica, esc: esc,
    /* formato */
    fmt: fmt, nc: nc, etq: etq, kf: kf, mil: mil, milTex: milTex, sig: sig, casi: casi,
    /* entradas */
    entero: entero, real: real, fraccionTxt: fraccionTxt, listaReales: listaReales,
    valorSimbolico: valorSimbolico,
    /* aritmética exacta */
    Frac: Frac, mcd: mcd, mcm: mcm, factoriza: factoriza, factorizaTex: factorizaTex,
    esCuadradoPerfecto: esCuadradoPerfecto, divisores: divisores,
    /* polinomios (heredado del motor de Polinomios) */
    parsePol: parsePol, normalizaEntrada: normalizaEntrada,
    pDe: pDe, pMono: pMono, pRecorta: pRecorta, pCopia: pCopia, pEsCero: pEsCero,
    pGrado: pGrado, pGradoTxt: pGradoTxt, pLider: pLider, pIndep: pIndep,
    pSuma: pSuma, pResta: pResta, pOpuesto: pOpuesto, pEscala: pEscala,
    pMult: pMult, pPot: pPot, pIgual: pIgual, pDiv: pDiv,
    pEval: pEval, pEvalNum: pEvalNum, pDeriva: pDeriva,
    pTex: pTex, pTexPar: pTexPar, pEntero: pEntero, CERO: CERO, UNO: UNO,
    ruffini: ruffini, candidatosRaiz: candidatosRaiz, raicesRacionales: raicesRacionales,
    factorizaPol: factorizaPol, factorizaTexPol: factorizaTexPol,
    factorRehacer: factorRehacer, factoresLista: factoresLista,
    factorLinTex: factorLinTex, potTex: potTex, mcdPol: mcdPol, mcmPol: mcmPol,
    Frax: Frax, fraxSimplifica: fraxSimplifica, fraxSuma: fraxSuma,
    fraxMult: fraxMult, fraxDiv: fraxDiv, raicesDe: raicesDe, notable: notable,

    /* --- capa propia del tema: ecuaciones e inecuaciones --- */
    simplRaiz: simplRaiz, raizTex: raizTex, Irr: Irr, numTex: numTex,
    Conj: Conj, rectaConj: rectaConj,
    solLineal: solLineal, resuelveLinealPaso: resuelveLinealPaso,
    solCuadratica: solCuadratica, cuadTex: cuadTex, raicesTex: raicesTex,
    solBipotencial: solBipotencial, solPolinomica: solPolinomica,
    solRacional: solRacional, solRadical: solRadical,
    esPotencia: esPotencia, solExponencial: solExponencial, solLogaritmica: solLogaritmica,
    solTrig: solTrig, anguloTex: anguloTex, gradTex: gradTex, NOTABLES: NOTABLES, TRIG: TRIG_NOT,
    RELS: RELS, inecLineal: inecLineal, tablaSignos: tablaSignos, inecRacional: inecRacional,
    tablaSignosHTML: tablaSignosHTML, intervTex: intervTex, comprueba: comprueba,

    /* figuras y salida */
    svgWrap: svgWrap, txt: txt, line: line, rect: rect, circle: circle,
    path: path, poly: poly, leyenda: leyenda, COL: COL,
    rectaReal: rectaReal, ejes: ejes,
    expr: expr, terminosHTML: terminosHTML, ruffiniHTML: ruffiniHTML,
    divisionLargaHTML: divisionLargaHTML,
    resultado: resultado, badge: badge, kvs: kvs, tabla: tabla, paso: paso,
    shell: shell, log: [],
    monta: monta
  };

  /* Monta todos los paneles data-applet-sys presentes en la página.
     Se llama al cargar y también cada vez que un módulo termina de
     registrarse, de modo que el orden de los <script> no importe. */
  function monta() {
    var nodos = document.querySelectorAll('[data-applet-sys]');
    Array.prototype.forEach.call(nodos, function (nd) {
      var clave = nd.getAttribute('data-applet-sys');
      /* El diagnóstico informa de qué módulos han cargado, así que no
         puede dibujarse hasta que la página esté completa: los <script>
         defer de los módulos se ejecutan después de DOMContentLoaded. */
      if (clave === 'diagnostico' && document.readyState !== 'complete') return;
      if (nd.getAttribute('data-montado') === '1') return;
      var f = R[clave];
      if (!f) return;                      /* quizá su módulo aún no ha cargado */
      nd.setAttribute('data-montado', '1');
      try {
        f(nd);
      } catch (e) {
        window.SYS.log.push({ applet: clave, error: String(e && e.message || e) });
        nd.innerHTML = '<p class="ap-warn">Este applet no ha podido montarse (' +
          esc(String(e && e.message || e)) + ').</p>';
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monta);
  else monta();
  window.addEventListener('load', monta);
})();
