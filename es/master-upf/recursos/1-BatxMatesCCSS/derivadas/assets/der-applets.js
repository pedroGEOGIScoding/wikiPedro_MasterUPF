/* =====================================================================
   der-applets.js — DERIVADA DE UNA FUNCION · 1r Batx Mates CCSS
   Notación LaTeX compuesta por KaTeX. Sin OJS, sin MathJax.

   UBICACION
     es/master-upf/recursos/1-BatxMatesCCSS/derivadas/assets/der-applets.js

   DEPENDENCIAS (via assets/_scripts.html)
     ../assets/applets.css
     ../assets/katex/katex.min.css
     ../assets/katex/katex.min.js
     ../assets/katex/contrib/auto-render.min.js

   ATRIBUTO DE INSERCION, propio del tema
     <div data-applet-der="clave"></div>

   API PUBLICA
     window.DER.reg(clave, fn)   registra un applet nuevo
     window.DER.boot()           vuelve a barrer el documento
     window.DER.core             nucleo reutilizable por der-applets-extra.js

   CONVENIOS DE FORMATO, heredados de los temas anteriores
     nt()    sintaxis KaTeX, con la coma entre llaves. SOLO dentro de T().
     num()   texto plano, para HTML normal y para etiquetas de SVG.
     plain() limpia notación KaTeX en las etiquetas de las figuras.
     qt()    fraccion exacta cuando el decimal es racional sencillo.
     par()   envuelve los negativos en paréntesis al sustituir en formulas.
     coefV() omite el coeficiente 1 y compone -x en lugar de -1x.
     binT()  compone c+kx ordenado, sin +- ni terminos con coeficiente 1.
   ===================================================================== */

(function () {
  'use strict';

  /* ===================================================================
     1. KATEX
     =================================================================== */

  var KATEX_OPTS = {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false }
    ],
    throwOnError: false,
    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option']
  };

  function kt(node) {
    if (window.renderMathInElement) {
      try { window.renderMathInElement(node, KATEX_OPTS); } catch (e) { }
    }
  }

  function T(t) { return '$' + t + '$'; }
  function TD(t) { return '$$' + t + '$$'; }

  /* ===================================================================
     2. NUMEROS Y COMPOSICION ALGEBRAICA
     =================================================================== */

  function nz(x) { return Math.abs(x) < 1e-12 ? 0 : x; }

  function rd(x, d) {
    var p = Math.pow(10, d === undefined ? 4 : d);
    return Math.round(x * p) / p;
  }

  /* Texto plano, con coma decimal. Para HTML y para SVG. */
  function num(x, d) {
    if (x === undefined || x === null || (typeof x === 'number' && isNaN(x))) return 'no definido';
    if (!isFinite(x)) return x > 0 ? 'infinito' : '-infinito';
    return String(nz(rd(x, d))).replace('.', ',');
  }

  /* Sintaxis KaTeX, con la coma entre llaves. Solo dentro de T() o TD(). */
  function nt(x, d) {
    if (x === undefined || x === null || (typeof x === 'number' && isNaN(x))) return '\\text{no definido}';
    if (!isFinite(x)) return x > 0 ? '+\\infty' : '-\\infty';
    return String(nz(rd(x, d))).replace('.', '{,}');
  }

  /* Fraccion exacta si el decimal es racional de denominador pequeno. */
  function qt(x) {
    var y = nz(x);
    if (!isFinite(y)) return nt(y);
    if (Number.isInteger(y)) return String(y);
    for (var d = 2; d <= 48; d++) {
      var p = y * d;
      if (Math.abs(p - Math.round(p)) < 1e-9) {
        p = Math.round(p);
        return (p < 0 ? '-' : '') + '\\dfrac{' + Math.abs(p) + '}{' + d + '}';
      }
    }
    return nt(y);
  }

  /* Envuelve los negativos en paréntesis, para sustituir en formulas. */
  function par(x) { return x < 0 ? '\\left(' + qt(x) + '\\right)' : qt(x); }

  function sgnT(x) { return x < 0 ? '-' : '+'; }

  /* Coeficiente por variable: omite el 1 y compone -x, no -1x. */
  function coefV(k, v) {
    k = nz(k);
    if (k === 0) return '0';
    if (k === 1) return v;
    if (k === -1) return '-' + v;
    return qt(k) + v;
  }

  /* Expresion c + k*v ordenada para que el primer termino sea positivo. */
  function binT(c, k, v) {
    v = v || 'x';
    c = nz(c); k = nz(k);
    if (k === 0) return qt(c);
    if (c === 0) return coefV(k, v);
    if (c < 0 && k > 0) return coefV(k, v) + '-' + qt(-c);
    return qt(c) + (k > 0 ? '+' : '-') + coefV(Math.abs(k), v);
  }

  /* Limpia notación KaTeX en las etiquetas de los SVG. */
  /* Recta y=mx+n con el termino en x DELANTE, como en la teoria del tema. */
  function lineT(m, n) {
    m = nz(m); n = nz(n);
    if (m === 0) return qt(n);
    if (n === 0) return coefV(m, 'x');
    return coefV(m, 'x') + (n > 0 ? '+' : '-') + qt(Math.abs(n));
  }

  function plain(s) {
    return String(s)
      .replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2')
      .replace(/\\left|\\right/g, '')
      .replace(/\{,\}/g, ',')
      .replace(/\\cdot/g, '.')
      .replace(/\\[a-zA-Z]+/g, '')
      .replace(/[{}$^_]/g, '');
  }

  /* ===================================================================
     3. ARBOL DE EXPRESIONES
     Nodos: {k:'n',v} {k:'x'} {k:'neg',a} {k:'+',a,b} {k:'-',a,b}
            {k:'*',a,b} {k:'/',a,b} {k:'^',a,b} {k:'f',n,a}
     =================================================================== */

  function N(v) { return { k: 'n', v: v }; }
  function XV() { return { k: 'x' }; }
  function isN(a, v) {
    return a && a.k === 'n' && (v === undefined || Math.abs(a.v - v) < 1e-12);
  }

  function neg(a) {
    if (a.k === 'n') return N(-a.v);
    if (a.k === 'neg') return a.a;
    return { k: 'neg', a: a };
  }
  function add(a, b) {
    if (isN(a, 0)) return b;
    if (isN(b, 0)) return a;
    if (a.k === 'n' && b.k === 'n') return N(a.v + b.v);
    if (b.k === 'neg') return sub(a, b.a);
    return { k: '+', a: a, b: b };
  }
  function sub(a, b) {
    if (isN(b, 0)) return a;
    if (a.k === 'n' && b.k === 'n') return N(a.v - b.v);
    if (isN(a, 0)) return neg(b);
    if (b.k === 'neg') return add(a, b.a);
    return { k: '-', a: a, b: b };
  }
  function mul(a, b) {
    if (isN(a, 0) || isN(b, 0)) return N(0);
    if (isN(a, 1)) return b;
    if (isN(b, 1)) return a;
    if (a.k === 'n' && b.k === 'n') return N(a.v * b.v);
    if (isN(a, -1)) return neg(b);
    if (isN(b, -1)) return neg(a);
    if (b.k === 'n' && a.k !== 'n') return { k: '*', a: b, b: a };
    return { k: '*', a: a, b: b };
  }
  function dv(a, b) {
    if (isN(a, 0)) return N(0);
    if (isN(b, 1)) return a;
    if (a.k === 'n' && b.k === 'n' && Math.abs(b.v) > 1e-12) return N(a.v / b.v);
    return { k: '/', a: a, b: b };
  }
  function pw(a, b) {
    if (isN(b, 0)) return N(1);
    if (isN(b, 1)) return a;
    if (a.k === 'n' && b.k === 'n') return N(Math.pow(a.v, b.v));
    return { k: '^', a: a, b: b };
  }
  function fnode(n, a) { return { k: 'f', n: n, a: a }; }

  /* ---------- funciones elementales admitidas ---------- */

  var FUNCS = {
    sqrt: 1, raiz: 1, ln: 1, log: 1, log10: 1, exp: 1,
    sin: 1, sen: 1, cos: 1, tan: 1, tg: 1,
    asin: 1, acos: 1, atan: 1, arctg: 1, abs: 1
  };

  var FTEX = {
    sqrt: '\\sqrt', raiz: '\\sqrt', ln: '\\ln', log: '\\log', log10: '\\log',
    exp: 'e^', sin: '\\sin', sen: '\\sin', cos: '\\cos', tan: '\\tan', tg: '\\tan',
    asin: '\\arcsin', acos: '\\arccos', atan: '\\arctan', arctg: '\\arctan', abs: '\\operatorname{abs}'
  };

  function applyF(n, v) {
    switch (n) {
      case 'sqrt': case 'raiz': return Math.sqrt(v);
      case 'ln': return Math.log(v);
      case 'log': case 'log10': return Math.log(v) / Math.LN10;
      case 'exp': return Math.exp(v);
      case 'sin': case 'sen': return Math.sin(v);
      case 'cos': return Math.cos(v);
      case 'tan': case 'tg': return Math.tan(v);
      case 'asin': return Math.asin(v);
      case 'acos': return Math.acos(v);
      case 'atan': case 'arctg': return Math.atan(v);
      case 'abs': return Math.abs(v);
    }
    return NaN;
  }

  /* ---------- analizador lexico ---------- */

  function tokenize(src) {
    var s = String(src).replace(/\s+/g, '');
    /* La coma decimal se admite, pero solo entre digitos. */
    s = s.replace(/(\d),(\d)/g, '$1.$2');
    var toks = [], i = 0, c, j;
    while (i < s.length) {
      c = s.charAt(i);
      if (c >= '0' && c <= '9' || c === '.') {
        j = i;
        while (j < s.length && (s.charAt(j) >= '0' && s.charAt(j) <= '9' || s.charAt(j) === '.')) j++;
        toks.push({ t: 'num', v: parseFloat(s.slice(i, j)) });
        i = j;
      } else if (/[a-zA-Z]/.test(c)) {
        j = i;
        while (j < s.length && /[a-zA-Z0-9]/.test(s.charAt(j))) j++;
        toks.push({ t: 'id', v: s.slice(i, j).toLowerCase() });
        i = j;
      } else if ('+-*/^()'.indexOf(c) >= 0) {
        toks.push({ t: c });
        i++;
      } else {
        throw new Error('el caracter "' + c + '" no se admite. Usa solo cifras, x, + - * / ^ ( ) y nombres de función.');
      }
    }
    return toks;
  }

  /* ---------- analizador sintactico descendente ---------- */

  function parse(src) {
    var toks = tokenize(src), p = 0;

    function peek() { return toks[p]; }
    function eat(t) {
      if (toks[p] && toks[p].t === t) { p++; return true; }
      return false;
    }
    function need(t) {
      if (!eat(t)) throw new Error('falta "' + t + '" en la expresión.');
    }
    function startsAtom() {
      var q = peek();
      return !!q && (q.t === 'num' || q.t === 'id' || q.t === '(');
    }

    function expr() {
      var a = term();
      for (;;) {
        if (eat('+')) a = add(a, term());
        else if (eat('-')) a = sub(a, term());
        else return a;
      }
    }
    function term() {
      var a = unary();
      for (;;) {
        if (eat('*')) a = mul(a, unary());
        else if (eat('/')) a = dv(a, unary());
        else if (startsAtom()) a = mul(a, unary());   /* producto implicito: 2x, 3(x+1) */
        else return a;
      }
    }
    function unary() {
      if (eat('-')) return neg(unary());
      if (eat('+')) return unary();
      return power();
    }
    function power() {
      var a = atom();
      if (eat('^')) return pw(a, unary());
      return a;
    }
    function atom() {
      var q = peek();
      if (!q) throw new Error('la expresión acaba antes de tiempo.');
      if (eat('(')) { var e = expr(); need(')'); return e; }
      if (q.t === 'num') { p++; return N(q.v); }
      if (q.t === 'id') {
        p++;
        if (q.v === 'x') return XV();
        if (q.v === 'pi') return N(Math.PI);
        if (q.v === 'e') return N(Math.E);
        if (FUNCS[q.v]) {
          need('(');
          var arg = expr();
          need(')');
          return fnode(q.v, arg);
        }
        throw new Error('no reconozco "' + q.v + '". Escribe la variable como x y usa * para multiplicar, por ejemplo x*sin(x).');
      }
      throw new Error('no esperaba "' + q.t + '" aqui.');
    }

    var out = expr();
    if (p < toks.length) throw new Error('sobra algo al final de la expresión.');
    return out;
  }

  /* ---------- evaluacion ---------- */

  function ev(a, x) {
    switch (a.k) {
      case 'n': return a.v;
      case 'x': return x;
      case 'neg': return -ev(a.a, x);
      case '+': return ev(a.a, x) + ev(a.b, x);
      case '-': return ev(a.a, x) - ev(a.b, x);
      case '*': return ev(a.a, x) * ev(a.b, x);
      case '/': return ev(a.a, x) / ev(a.b, x);
      case '^': return Math.pow(ev(a.a, x), ev(a.b, x));
      case 'f': return applyF(a.n, ev(a.a, x));
    }
    return NaN;
  }

  /* ---------- sustitución de x por otro arbol ---------- */

  function subst(a, r) {
    switch (a.k) {
      case 'n': return a;
      case 'x': return r;
      case 'neg': return neg(subst(a.a, r));
      case '+': return add(subst(a.a, r), subst(a.b, r));
      case '-': return sub(subst(a.a, r), subst(a.b, r));
      case '*': return mul(subst(a.a, r), subst(a.b, r));
      case '/': return dv(subst(a.a, r), subst(a.b, r));
      case '^': return pw(subst(a.a, r), subst(a.b, r));
      case 'f': return fnode(a.n, subst(a.a, r));
    }
    return a;
  }

  /* ---------- derivada simbolica ---------- */

  function dfun(n, u) {
    switch (n) {
      case 'sqrt': case 'raiz': return dv(N(1), mul(N(2), fnode('sqrt', u)));
      case 'ln': return dv(N(1), u);
      case 'log': case 'log10': return dv(N(1), mul(u, fnode('ln', N(10))));
      case 'exp': return fnode('exp', u);
      case 'sin': case 'sen': return fnode('cos', u);
      case 'cos': return neg(fnode('sin', u));
      case 'tan': case 'tg': return dv(N(1), pw(fnode('cos', u), N(2)));
      case 'asin': return dv(N(1), fnode('sqrt', sub(N(1), pw(u, N(2)))));
      case 'acos': return neg(dv(N(1), fnode('sqrt', sub(N(1), pw(u, N(2))))));
      case 'atan': case 'arctg': return dv(N(1), add(N(1), pw(u, N(2))));
      case 'abs':
        throw new Error('el valor absoluto no es derivable en el punto donde cambia de signo. Este applet no lo deriva.');
    }
    throw new Error('no se sabe derivar "' + n + '".');
  }

  function D(a) {
    switch (a.k) {
      case 'n': return N(0);
      case 'x': return N(1);
      case 'neg': return neg(D(a.a));
      case '+': return add(D(a.a), D(a.b));
      case '-': return sub(D(a.a), D(a.b));
      case '*': return add(mul(D(a.a), a.b), mul(a.a, D(a.b)));
      case '/': return dv(sub(mul(D(a.a), a.b), mul(a.a, D(a.b))), pw(a.b, N(2)));
      case 'f': return mul(dfun(a.n, a.a), D(a.a));
      case '^':
        if (a.b.k === 'n') {
          /* potencial: n * u^(n-1) * u' */
          return mul(mul(N(a.b.v), pw(a.a, N(a.b.v - 1))), D(a.a));
        }
        if (a.a.k === 'n') {
          /* exponencial: a^u * ln a * u' */
          return mul(mul(pw(a.a, a.b), fnode('ln', N(a.a.v))), D(a.b));
        }
        /* general: u^v * (v' ln u + v u'/u) */
        return mul(pw(a.a, a.b),
          add(mul(D(a.b), fnode('ln', a.a)), dv(mul(a.b, D(a.a)), a.a)));
    }
    throw new Error('expresión no derivable.');
  }

  /* ---------- simplificacion por reconstruccion ---------- */

  function simp(a) {
    var r;
    switch (a.k) {
      case '+': r = add(simp(a.a), simp(a.b)); break;
      case '-': r = sub(simp(a.a), simp(a.b)); break;
      case '*': r = mul(simp(a.a), simp(a.b)); break;
      case '/': r = dv(simp(a.a), simp(a.b)); break;
      case '^': r = pw(simp(a.a), simp(a.b)); break;
      case 'neg': r = neg(simp(a.a)); break;
      case 'f': r = fnode(a.n, simp(a.a)); break;
      default: return a;
    }
    return r;
  }

  function simpN(a, veces) {
    var n = veces || 3;
    for (var i = 0; i < n; i++) a = simp(a);
    return a;
  }

  /* ---------- salida en LaTeX ---------- */

  function pr(a) {
    if (a.k === '+' || a.k === '-' || a.k === 'neg') return 1;
    if (a.k === '*') return 2;
    if (a.k === '/') return 3;
    if (a.k === '^') return 4;
    return 5;
  }

  function wrap(a, p) {
    var s = tex(a);
    return pr(a) < p ? '\\left(' + s + '\\right)' : s;
  }

  function baseTex(a) {
    if (a.k === 'x') return 'x';
    if (a.k === 'n' && a.v >= 0) return qt(a.v);
    if (a.k === 'f' && (a.n === 'sqrt' || a.n === 'raiz')) return tex(a);
    return '\\left(' + tex(a) + '\\right)';
  }

  function mulTex(a) {
    var L = a.a, R = a.b;
    if (L.k === 'n' && R.k !== 'n') {
      if (R.k === 'x') return coefV(L.v, 'x');
      return qt(L.v) + wrap(R, 2);
    }
    return wrap(L, 2) + '\\cdot ' + wrap(R, 2);
  }

  function fTex(a) {
    var n = a.n, inner = tex(a.a);
    if (n === 'sqrt' || n === 'raiz') return '\\sqrt{' + inner + '}';
    if (n === 'exp') return 'e^{' + inner + '}';
    return FTEX[n] + '\\left(' + inner + '\\right)';
  }

  function tex(a) {
    switch (a.k) {
      case 'n': return qt(a.v);
      case 'x': return 'x';
      case 'neg': return '-' + wrap(a.a, 2);
      case '+': return tex(a.a) + '+' + wrap(a.b, 1);
      case '-': return tex(a.a) + '-' + wrap(a.b, 2);
      case '*': return mulTex(a);
      case '/': return '\\dfrac{' + tex(a.a) + '}{' + tex(a.b) + '}';
      case '^': return baseTex(a.a) + '^{' + tex(a.b) + '}';
      case 'f': return fTex(a);
    }
    return '?';
  }

  /* ---------- utilidades de analisis numerico ---------- */

  function dnum(f, x, h) {
    h = h || 1e-6;
    return (f(x + h) - f(x - h)) / (2 * h);
  }

  function fnOf(ast) { return function (x) { return ev(ast, x); }; }

  /* Lee una función del campo y devuelve {ast, f, tx, dast, df, dtx}. */
  function readF(root, role, def) {
    var src = readS(root, role, def);
    if (!String(src).replace(/\s/g, '')) throw new Error('escribe una función en el campo.');
    var ast = simpN(parse(src));
    var out = { src: src, ast: ast, f: fnOf(ast), tx: tex(ast) };
    try {
      out.dast = simpN(D(ast));
      out.df = fnOf(out.dast);
      out.dtx = tex(out.dast);
    } catch (e) {
      out.dast = null;
      out.df = function (x) { return dnum(out.f, x); };
      out.dtx = null;
      out.derr = e.message;
    }
    return out;
  }

  /* ===================================================================
     4. FIGURAS SVG
     =================================================================== */

  function nice(span) {
    var raw = span / 8, mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var n = raw / mag;
    if (n < 1.5) n = 1; else if (n < 3) n = 2; else if (n < 7) n = 5; else n = 10;
    return n * mag;
  }

  /* plot({w,h,xmin,xmax,ymin,ymax,curves,segs,pts,vlines,areas,caption}) */
  function plot(o) {
    var w = o.w || 470, h = o.h || 310, m = 34;
    var xmin = o.xmin, xmax = o.xmax;
    var curves = o.curves || [], segs = o.segs || [], pts = o.pts || [];
    var ymin = o.ymin, ymax = o.ymax, i, c, t, v;

    if (ymin === undefined || ymax === undefined) {
      var lo = Infinity, hi = -Infinity;
      for (i = 0; i <= 240; i++) {
        t = xmin + (xmax - xmin) * i / 240;
        for (c = 0; c < curves.length; c++) {
          v = curves[c].f(t);
          if (isFinite(v) && Math.abs(v) < 1e6) { if (v < lo) lo = v; if (v > hi) hi = v; }
        }
      }
      pts.forEach(function (p) {
        if (isFinite(p.y)) { if (p.y < lo) lo = p.y; if (p.y > hi) hi = p.y; }
      });
      if (!isFinite(lo) || !isFinite(hi)) { lo = -1; hi = 1; }
      if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
      var pad = (hi - lo) * 0.18;
      ymin = lo - pad; ymax = hi + pad;
    }

    function X(x) { return m + (x - xmin) / (xmax - xmin) * (w - 2 * m); }
    function Y(y) { return h - m - (y - ymin) / (ymax - ymin) * (h - 2 * m); }

    var s = '<svg class="ap-fig" viewBox="0 0 ' + w + ' ' + h + '" width="100%" ' +
      'role="img" aria-label="' + plain(o.caption || 'figura del applet') + '">';
    s += '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="#ffffff"/>';

    /* rejilla y ticks */
    var dx = nice(xmax - xmin), dy = nice(ymax - ymin), k;
    for (k = Math.ceil(xmin / dx) * dx; k <= xmax + 1e-9; k += dx) {
      s += '<line x1="' + X(k).toFixed(1) + '" y1="' + m + '" x2="' + X(k).toFixed(1) +
        '" y2="' + (h - m) + '" stroke="#eef1f5" stroke-width="1"/>';
      s += '<text x="' + X(k).toFixed(1) + '" y="' + (h - m + 14) +
        '" font-size="10" fill="#6b7280" text-anchor="middle">' + num(k, 2) + '</text>';
    }
    for (k = Math.ceil(ymin / dy) * dy; k <= ymax + 1e-9; k += dy) {
      s += '<line x1="' + m + '" y1="' + Y(k).toFixed(1) + '" x2="' + (w - m) +
        '" y2="' + Y(k).toFixed(1) + '" stroke="#eef1f5" stroke-width="1"/>';
      s += '<text x="' + (m - 5) + '" y="' + (Y(k) + 3).toFixed(1) +
        '" font-size="10" fill="#6b7280" text-anchor="end">' + num(k, 2) + '</text>';
    }

    /* ejes */
    var y0 = (ymin <= 0 && ymax >= 0) ? Y(0) : (h - m);
    var x0 = (xmin <= 0 && xmax >= 0) ? X(0) : m;
    s += '<line x1="' + m + '" y1="' + y0.toFixed(1) + '" x2="' + (w - m) + '" y2="' + y0.toFixed(1) +
      '" stroke="#374151" stroke-width="1.4"/>';
    s += '<line x1="' + x0.toFixed(1) + '" y1="' + m + '" x2="' + x0.toFixed(1) + '" y2="' + (h - m) +
      '" stroke="#374151" stroke-width="1.4"/>';

    /* curvas */
    curves.forEach(function (cu) {
      var d = '', on = false, prev = null, xx, yy;
      var Nn = cu.n || 460;
      for (i = 0; i <= Nn; i++) {
        xx = xmin + (xmax - xmin) * i / Nn;
        yy = cu.f(xx);
        if (!isFinite(yy) || yy > ymax + (ymax - ymin) * 3 || yy < ymin - (ymax - ymin) * 3) {
          on = false; prev = null; continue;
        }
        if (prev !== null && Math.abs(yy - prev) > (ymax - ymin) * 0.9) { on = false; }
        d += (on ? 'L' : 'M') + X(xx).toFixed(1) + ' ' + Y(yy).toFixed(1) + ' ';
        on = true; prev = yy;
      }
      s += '<path d="' + d + '" fill="none" stroke="' + (cu.color || '#2563eb') +
        '" stroke-width="' + (cu.width || 2) + '"' +
        (cu.dash ? ' stroke-dasharray="' + cu.dash + '"' : '') + '/>';
    });

    /* segmentos */
    segs.forEach(function (g) {
      s += '<line x1="' + X(g.x1).toFixed(1) + '" y1="' + Y(g.y1).toFixed(1) +
        '" x2="' + X(g.x2).toFixed(1) + '" y2="' + Y(g.y2).toFixed(1) +
        '" stroke="' + (g.color || '#6b7280') + '" stroke-width="' + (g.width || 1.4) + '"' +
        (g.dash ? ' stroke-dasharray="' + g.dash + '"' : '') + '/>';
    });

    /* puntos */
    pts.forEach(function (p) {
      if (!isFinite(p.x) || !isFinite(p.y)) return;
      s += '<circle cx="' + X(p.x).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) +
        '" r="' + (p.r || 4) + '" fill="' + (p.color || '#dc2626') + '"/>';
      if (p.label) {
        s += '<text x="' + (X(p.x) + 7).toFixed(1) + '" y="' + (Y(p.y) - 7).toFixed(1) +
          '" font-size="11" fill="#111827">' + plain(p.label) + '</text>';
      }
    });

    s += '</svg>';
    if (o.caption) {
      s += '<p class="ap-note" style="text-align:center;">' + o.caption + '</p>';
    }
    return s;
  }

  /* ===================================================================
     5. ESQUELETO DE APPLET
     =================================================================== */

  function head(title, bullets) {
    var li = bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('');
    return '<div class="ap-head"><h4 class="ap-title">' + title + '</h4>' +
      '<ul class="ap-help">' + li + '</ul></div>';
  }
  function errBox(m) { return '<div class="ap-err">Aviso: ' + m + '</div>'; }
  function step(h) { return '<div class="ap-step">' + h + '</div>'; }
  function warnStep(h) { return '<div class="ap-step ap-warn">' + h + '</div>'; }
  function key(t) { return '<span class="ap-key">' + t + '</span>'; }
  function ok(t) { return '<span class="ap-ok">' + t + '</span>'; }
  function bad(t) { return '<span class="ap-bad">' + t + '</span>'; }
  function note(t) { return '<span class="ap-note">' + t + '</span>'; }
  function chip(t) { return '<span class="ap-chip">' + t + '</span>'; }

  function rowText(role, label, value) {
    return '<div class="ap-row"><label class="ap-lab">' + label + '</label>' +
      '<input class="ap-in" type="text" data-role="' + role + '" value="' + value + '"></div>';
  }
  function mini(role, label, value, stp) {
    return '<label class="ap-lab">' + label + '</label>' +
      '<input class="ap-in ap-mini" type="number" data-role="' + role + '" value="' + value +
      '" step="' + (stp === undefined ? 1 : stp) + '">';
  }
  function rng(role, label, min, max, stp, value) {
    return '<div class="ap-row"><label class="ap-lab">' + label + '</label>' +
      '<input type="range" data-role="' + role + '" min="' + min + '" max="' + max +
      '" step="' + stp + '" value="' + value + '"></div>';
  }
  function sel(role, label, opts, def) {
    var o = opts.map(function (p) {
      return '<option value="' + p[0] + '"' + (p[0] === def ? ' selected' : '') + '>' + p[1] + '</option>';
    }).join('');
    return (label ? '<label class="ap-lab">' + label + '</label>' : '') +
      '<select class="ap-sel" data-role="' + role + '">' + o + '</select>';
  }
  function row(inner) { return '<div class="ap-row">' + inner + '</div>'; }

  function shell(node, title, bullets, controls) {
    node.className = (node.className ? node.className + ' ' : '') + 'applet';
    node.innerHTML = head(title, bullets) + (controls || '') + '<div class="ap-out"></div>';
    /* La cabecera y las etiquetas de los controles se componen UNA vez, aqui.
       El cuerpo lo compone live() en cada actualizacion. Sin esta llamada,
       la notacion del titulo y de las vinetas se veria como texto con dolares. */
    kt(node);
    return node.querySelector('.ap-out');
  }

  function live(root, out, render) {
    function run() {
      try {
        out.innerHTML = render();
      } catch (e) {
        out.innerHTML = errBox(e.message || 'revisa los datos introducidos.');
      }
      kt(out);
    }
    Array.prototype.forEach.call(root.querySelectorAll('input,select'), function (el) {
      el.addEventListener('input', run);
      el.addEventListener('change', run);
    });
    Array.prototype.forEach.call(root.querySelectorAll('button'), function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); run(); });
    });
    run();
  }

  function readS(root, role, def) {
    var el = root.querySelector('[data-role="' + role + '"]');
    return el ? String(el.value) : def;
  }
  function readN(root, role, def) {
    var el = root.querySelector('[data-role="' + role + '"]');
    if (!el) return def;
    var v = parseFloat(String(el.value).replace(',', '.'));
    return isFinite(v) ? v : def;
  }
  function readList(root, role, def) {
    var s = readS(root, role, def);
    return s.split(/[;\s]*[,;]\s*|\s+/).map(function (t) {
      return parseFloat(String(t).replace(',', '.'));
    }).filter(function (v) { return isFinite(v); });
  }

  function tbl(headers, rows) {
    var s = '<table class="ap-tbl"><thead><tr>';
    headers.forEach(function (x) { s += '<th>' + x + '</th>'; });
    s += '</tr></thead><tbody>';
    rows.forEach(function (r) {
      s += '<tr' + (r.mark ? ' class="ap-sel-row"' : '') + '>';
      (r.c || r).forEach(function (x) { s += '<td>' + x + '</td>'; });
      s += '</tr>';
    });
    return s + '</tbody></table>';
  }

  /* ===================================================================
     6. REGISTRO Y ARRANQUE
     =================================================================== */

  var REG = {};
  function reg(k, fn) { REG[k] = fn; }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-applet-der]'), function (node) {
      if (node.getAttribute('data-der-listo') === '1') return;
      var k = node.getAttribute('data-applet-der');
      node.setAttribute('data-der-listo', '1');
      if (!REG[k]) { node.innerHTML = errBox('no existe el applet "' + k + '".'); return; }
      try { REG[k](node); } catch (e) {
        node.innerHTML = errBox('no se pudo montar "' + k + '": ' + (e.message || e));
      }
    });
  }

  /* ===================================================================
     7. APARTADO 1 · TASA DE VARIACION MEDIA
     =================================================================== */

  var SINTAXIS = [
    'Escribe la función con la variable ' + T('x') + '. El producto se puede omitir: ' +
    '<code>2x</code> y <code>3(x+1)</code> se entienden bien.',
    'Potencias con <code>^</code>: <code>x^2</code>, <code>x^3-2x</code>. ' +
    'Raices con <code>sqrt(x)</code>. Cocientes con <code>/</code>: <code>1/x</code>, <code>(x+1)/(x-2)</code>.',
    'Tambien admite <code>ln(x)</code>, <code>log(x)</code>, <code>exp(x)</code>, ' +
    '<code>sin(x)</code>, <code>cos(x)</code>, <code>tan(x)</code>, y las constantes <code>pi</code> y <code>e</code>.',
    'Si mezclas una letra con una función, pon el asterisco: <code>x*sin(x)</code>, no <code>xsin(x)</code>.'
  ];

  /* ---------- Applet · Tasa de variación media ---------- */

  reg('tvm', function (node) {
    var out = shell(node, 'Applet \u00b7 Tasa de variaci\u00f3n media', [
      'Escribe una función y un intervalo ' + T('[a,b]') + '. El applet calcula ' +
      T('\\mathrm{TVM}([a,b])') + ' y dibuja la recta secante.',
      'Prueba primero ' + T('f(x)=3x^{2}-2') + ' en ' + T('[-1,2]') +
      ': debe salir ' + T('3') + '. Escribe <code>3x^2-2</code>, <code>a = -1</code>, <code>b = 2</code>.',
      'Prueba luego ' + T('f(x)=x^{2}+3x') + ' en ' + T('[1,3]') + ': sale ' + T('7') +
      ', y la secante es ' + T('y=7x-3') + '.',
      'Con una recta como <code>3x-4</code> la TVM sale igual en todos los intervalos. ' +
      'Compruebalo: es la propiedad que distingue a las funciones de primer grado.'
    ].concat(SINTAXIS),
      rowText('f', 'f(x) =', '3x^2-2') +
      row(mini('a', 'a', -1, 0.5) + mini('b', 'b', 2, 0.5))
    );

    live(node, out, function () {
      var F = readF(node, 'f', '3x^2-2');
      var a = readN(node, 'a', -1), b = readN(node, 'b', 2);
      if (Math.abs(b - a) < 1e-12) return errBox('el intervalo no puede ser un solo punto: pon ' + T('a\\neq b') + '.');

      var fa = F.f(a), fb = F.f(b);
      if (!isFinite(fa) || !isFinite(fb)) {
        return errBox('la función no está definida en un extremo del intervalo. Cambia ' + T('a') + ' o ' + T('b') + '.');
      }
      var tvm = (fb - fa) / (b - a);

      var h = step('Función: ' + TD('f(x)=' + F.tx));
      h += step('Imagenes de los extremos: ' + T('f(' + par(a) + ')=' + nt(fa)) +
        ' y ' + T('f(' + par(b) + ')=' + nt(fb)));
      h += step('Variacion total, o tasa de variación: ' +
        TD('\\mathrm{TV}(' + qt(a) + ',' + qt(b) + ')=f(' + par(b) + ')-f(' + par(a) + ')=' +
        nt(fb) + '-' + par(fa) + '=' + nt(fb - fa)));
      h += step('Tasa de variación media: ' +
        TD('\\mathrm{TVM}([' + qt(a) + ',' + qt(b) + '])=\\dfrac{f(' + par(b) + ')-f(' + par(a) + ')}{' +
        qt(b) + '-' + par(a) + '}=\\dfrac{' + nt(fb - fa) + '}{' + nt(b - a) + '}=' + nt(tvm)));

      var n0 = fa - tvm * a;
      h += step(key('Recta secante: ') + T('y=' + lineT(tvm, n0)) +
        '. Su pendiente es exactamente la TVM.');
      h += step(note('Lectura: entre ' + T('x=' + qt(a)) + ' y ' + T('x=' + qt(b)) +
        ' la función varia, en promedio, ' + num(tvm) + ' unidades de ' + T('y') +
        ' por cada unidad de ' + T('x') + '.'));

      var lo = Math.min(a, b), hi = Math.max(a, b), sp = (hi - lo) || 1;
      h += plot({
        xmin: lo - sp * 0.6, xmax: hi + sp * 0.6,
        curves: [{ f: F.f, color: '#2563eb' }],
        segs: [{ x1: a, y1: fa, x2: b, y2: fb, color: '#dc2626', width: 2 },
        { x1: a, y1: fa, x2: b, y2: fa, color: '#059669', dash: '4 3' },
        { x1: b, y1: fa, x2: b, y2: fb, color: '#059669', dash: '4 3' }],
        pts: [{ x: a, y: fa, label: 'A' }, { x: b, y: fb, label: 'B' }],
        caption: 'En azul la función; en rojo la secante por ' + T('A') + ' y ' + T('B') +
          '; en verde el avance horizontal ' + T(nt(b - a)) + ' y el ascenso vertical ' + T(nt(fb - fa)) + '.'
      });
      return h;
    });
  });

  /* ---------- Applet · La TVM no es constante ---------- */

  reg('tvmtramos', function (node) {
    var out = shell(node, 'Applet \u00b7 La TVM tramo a tramo', [
      'Parte el intervalo ' + T('[a,b]') + ' en ' + T('n') + ' tramos iguales y compara la TVM de cada tramo.',
      'Con una recta, <code>3x-4</code>, todas las filas dan el mismo valor. ' +
      'Con <code>x^2-1</code> cada tramo da un valor distinto: la TVM depende del tramo.',
      'Valores de partida sugeridos: <code>x^2-1</code>, <code>a = -3</code>, <code>b = 2</code>, <code>n = 5</code>.',
      'Fijate en la última columna: cuando los tramos son estrechos, la TVM se parece cada vez mas a la pendiente de la tangente en el centro del tramo.'
    ].concat(SINTAXIS),
      rowText('f', 'f(x) =', 'x^2-1') +
      row(mini('a', 'a', -3, 0.5) + mini('b', 'b', 2, 0.5) + mini('n', 'tramos n', 5, 1))
    );

    live(node, out, function () {
      var F = readF(node, 'f', 'x^2-1');
      var a = readN(node, 'a', -3), b = readN(node, 'b', 2);
      var n = Math.max(1, Math.min(24, Math.round(readN(node, 'n', 5))));
      if (Math.abs(b - a) < 1e-12) return errBox('el intervalo no puede ser un solo punto.');

      var dxv = (b - a) / n, rows = [], vals = [], i, x1, x2, y1, y2, t;
      for (i = 0; i < n; i++) {
        x1 = a + i * dxv; x2 = x1 + dxv;
        y1 = F.f(x1); y2 = F.f(x2);
        t = (y2 - y1) / dxv;
        vals.push(t);
        rows.push([T('[' + nt(x1) + ',' + nt(x2) + ']'), T(nt(y1)), T(nt(y2)),
          key(T(nt(t))), T(nt(F.df((x1 + x2) / 2)))]);
      }

      var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
      var h = step('Función: ' + TD('f(x)=' + F.tx));
      h += step('Cada tramo mide ' + T('h=' + nt(dxv)) + '.');
      h += tbl(['Tramo', T('f') + ' al empezar', T('f') + ' al acabar',
        T('\\mathrm{TVM}'), T("f'") + ' en el centro'], rows);

      if (mx - mn < 1e-9) {
        h += step(ok('Todas las TVM coinciden: ' + T(nt(mn)) + '.') +
          ' Eso ocurre exactamente cuando la función es de primer grado, porque su gráfica es una recta y su pendiente no cambia.');
      } else {
        h += warnStep('Las TVM van de ' + T(nt(mn)) + ' a ' + T(nt(mx)) +
          '. No son constantes, asi que un solo numero no describe bien como varia la función en todo el intervalo. ' +
          'Esa es la limitacion que obliga a inventar la derivada.');
      }

      var sp = Math.abs(b - a) || 1;
      var segs = [];
      for (i = 0; i < n; i++) {
        x1 = a + i * dxv; x2 = x1 + dxv;
        segs.push({ x1: x1, y1: F.f(x1), x2: x2, y2: F.f(x2), color: '#dc2626', width: 1.8 });
      }
      h += plot({
        xmin: Math.min(a, b) - sp * 0.15, xmax: Math.max(a, b) + sp * 0.15,
        curves: [{ f: F.f, color: '#2563eb' }],
        segs: segs,
        caption: 'La poligonal roja es la cadena de secantes. Cuanto mas tramos, mas se pega a la curva azul.'
      });
      return h;
    });
  });

  /* ---------- Applet · Velocidad media con datos de tabla ---------- */

  reg('velocidad', function (node) {
    var out = shell(node, 'Applet \u00b7 Velocidad media a partir de una tabla', [
      'Aqui no hay formula: solo una tabla de medidas, como las que toma un radar o una caja negra.',
      'Escribe los tiempos y las distancias separados por comas, con el mismo numero de datos en las dos filas.',
      'Datos de partida: el aterrizaje de un avion, con el tiempo en segundos y la distancia recorrida en metros.',
      'Cambia los extremos ' + T('t_{1}') + ' y ' + T('t_{2}') +
      ' para ver la velocidad media en cada tramo. Deben ser valores que aparezcan en la fila de tiempos.',
      'Pregunta guiada: la velocidad media entre ' + T('0') + ' y ' + T('14') +
      ' segundos, ¿coincide con la velocidad media entre ' + T('0') + ' y ' + T('6') + '? ¿Por que no?'
    ],
      rowText('t', 'tiempos', '0, 2, 4, 6, 8, 10, 12, 14') +
      rowText('d', 'distancias', '0, 100, 175, 230, 270, 300, 325, 340') +
      row(mini('t1', 't\u2081', 0, 1) + mini('t2', 't\u2082', 14, 1) +
        sel('u', 'unidades', [['m/s', 'metros y segundos'], ['km/min', 'kilometros y minutos']], 'm/s'))
    );

    live(node, out, function () {
      var ts = readList(node, 't', '0'), ds = readList(node, 'd', '0');
      if (ts.length < 2) return errBox('hacen falta al menos dos tiempos.');
      if (ts.length !== ds.length) {
        return errBox('hay ' + ts.length + ' tiempos y ' + ds.length +
          ' distancias. Las dos filas deben tener el mismo numero de datos.');
      }
      var u = readS(node, 'u', 'm/s');
      var un = u === 'm/s' ? 'm/s' : 'km/min';
      var t1 = readN(node, 't1', ts[0]), t2 = readN(node, 't2', ts[ts.length - 1]);

      function idx(t) {
        var best = -1, bd = Infinity;
        for (var i = 0; i < ts.length; i++) {
          if (Math.abs(ts[i] - t) < bd) { bd = Math.abs(ts[i] - t); best = i; }
        }
        return best;
      }
      var i1 = idx(t1), i2 = idx(t2);
      if (i1 === i2) return errBox('los dos extremos caen en el mismo dato. Separalos.');
      if (i1 > i2) { var tmp = i1; i1 = i2; i2 = tmp; }

      var hrow = ['Tiempo'], drow = ['Distancia'], i;
      for (i = 0; i < ts.length; i++) {
        hrow.push((i >= i1 && i <= i2) ? key(T(nt(ts[i]))) : T(nt(ts[i])));
        drow.push((i >= i1 && i <= i2) ? key(T(nt(ds[i]))) : T(nt(ds[i])));
      }

      var dt = ts[i2] - ts[i1], dd = ds[i2] - ds[i1], vm = dd / dt;
      var h = tbl(hrow, [drow]);
      h += step('Tramo elegido: de ' + T('t=' + nt(ts[i1])) + ' a ' + T('t=' + nt(ts[i2])) + '.');
      h += step('Velocidad media: ' +
        TD('v_{m}=\\dfrac{d(' + nt(ts[i2]) + ')-d(' + nt(ts[i1]) + ')}{' + nt(ts[i2]) + '-' + par(ts[i1]) +
        '}=\\dfrac{' + nt(dd) + '}{' + nt(dt) + '}=' + nt(vm) + '\\ \\mathrm{' + un + '}'));

      var tramos = [], j;
      for (j = 0; j + 1 < ts.length; j++) {
        tramos.push([T('[' + nt(ts[j]) + ',' + nt(ts[j + 1]) + ']'),
        T(nt(ds[j + 1] - ds[j])), key(T(nt((ds[j + 1] - ds[j]) / (ts[j + 1] - ts[j]))))]);
      }
      h += step('Velocidad media en cada tramo consecutivo:');
      h += tbl(['Tramo', 'Distancia recorrida', 'Velocidad media (' + un + ')'], tramos);

      var vs = tramos.map(function (r) { return parseFloat(plain(r[2]).replace(',', '.')); });
      var vmin = Math.min.apply(null, vs), vmax = Math.max.apply(null, vs);
      h += warnStep('La velocidad media de los tramos va de ' + num(vmin) + ' a ' + num(vmax) + ' ' + un +
        '. Una sola velocidad media esconde toda esa variación: por eso la ' + key('TVM') +
        ' informa del promedio, pero no de lo que pasa en un instante concreto.');

      var pts = [], segs = [];
      for (i = 0; i < ts.length; i++) {
        pts.push({ x: ts[i], y: ds[i], color: '#2563eb', r: 3.5 });
        if (i + 1 < ts.length) {
          segs.push({ x1: ts[i], y1: ds[i], x2: ts[i + 1], y2: ds[i + 1], color: '#93c5fd', width: 1.6 });
        }
      }
      segs.push({ x1: ts[i1], y1: ds[i1], x2: ts[i2], y2: ds[i2], color: '#dc2626', width: 2.2 });
      var spx = ts[ts.length - 1] - ts[0];
      h += plot({
        xmin: ts[0] - spx * 0.08, xmax: ts[ts.length - 1] + spx * 0.08,
        curves: [], segs: segs, pts: pts,
        caption: 'Los puntos azules son las medidas. La recta roja une los dos extremos del tramo elegido: su pendiente es la velocidad media.'
      });
      return h;
    });
  });

  /* ===================================================================
     8. APARTADO 2 · DERIVADA EN UN PUNTO
     =================================================================== */

  /* ---------- Applet · Cociente incremental ---------- */

  reg('cociente', function (node) {
    var out = shell(node, 'Applet \u00b7 El cociente incremental cuando ' + T('h\\to 0'), [
      'Este applet calcula ' + T('\\dfrac{f(a+h)-f(a)}{h}') + ' para valores de ' + T('h') +
      ' cada vez mas pequenos, por los dos lados.',
      'Empieza con ' + T('f(x)=0{,}1x^{2}+118x-143{,}3') + ' en ' + T('a=4') +
      ', el coche multado de los apuntes. Escribe <code>0.1x^2+118x-143.3</code> y <code>a = 4</code>. ' +
      'Los valores se acercan a ' + T('118{,}8') + '.',
      'Prueba también <code>x^2</code> en <code>a = 3</code>: el cociente tiende a ' + T('6') + '.',
      'Y prueba <code>abs(x)</code>... no lo admite. Piensa por que: en ' + T('x=0') +
      ' esa función tiene un pico y los dos lados no se ponen de acuerdo.',
      'Los decimales se escriben con punto: <code>0.1</code>. La coma también vale entre cifras.'
    ].concat(SINTAXIS),
      rowText('f', 'f(x) =', '0.1x^2+118x-143.3') +
      row(mini('a', 'a', 4, 0.5))
    );

    live(node, out, function () {
      var F = readF(node, 'f', '0.1x^2+118x-143.3');
      var a = readN(node, 'a', 4);
      var fa = F.f(a);
      if (!isFinite(fa)) return errBox('la función no está definida en ' + T('x=' + qt(a)) + '.');

      var hs = [1, 0.5, 0.1, 0.01, 0.001, 0.0001];
      var rows = [], i, hv, dpos, dneg;
      for (i = 0; i < hs.length; i++) {
        hv = hs[i];
        dpos = (F.f(a + hv) - fa) / hv;
        dneg = (F.f(a - hv) - fa) / (-hv);
        rows.push([T(nt(hv, 6)),
          T(nt(dneg, 6)),
          T(nt(dpos, 6))]);
      }

      var h = step('Función: ' + TD('f(x)=' + F.tx) + ' y punto ' + T('a=' + qt(a)) +
        ', con ' + T('f(' + par(a) + ')=' + nt(fa)) + '.');
      h += step('Cociente incremental: ' +
        TD('\\dfrac{f(' + par(a) + '+h)-f(' + par(a) + ')}{h}'));
      h += tbl([T('h'), 'por la izquierda (' + T('-h') + ')', 'por la derecha (' + T('+h') + ')'], rows);

      if (F.dast) {
        var m = F.df(a);
        h += step(key('Limite exacto: ') + TD("f'(" + par(a) + ')=' + nt(m)) +
          ' calculado con las reglas de derivación, no con la tabla.');
        h += step(note('La tabla se acerca a ese numero, pero nunca lo alcanza. La derivada no es un valor de la tabla: es el limite al que la tabla apunta.'));
      } else {
        h += warnStep('No puedo derivar está función con reglas: ' + (F.derr || 'expresión no admitida') +
          ' Fijate igualmente en la tabla, que es la que decide.');
      }

      var izq = (F.f(a - 1e-6) - fa) / (-1e-6), der = (F.f(a + 1e-6) - fa) / 1e-6;
      if (isFinite(izq) && isFinite(der) && Math.abs(izq - der) > 1e-3 * (1 + Math.abs(der))) {
        h += warnStep(bad('Los dos lados no coinciden') + ': por la izquierda tiende a ' + num(izq, 3) +
          ' y por la derecha a ' + num(der, 3) + '. Entonces el limite no existe y ' +
          T('f') + ' no es derivable en ' + T('x=' + qt(a)) + '. Graficamente, ahi hay un pico.');
      }

      var sp = Math.max(1, Math.abs(a) * 0.5);
      var segs = [];
      [1, 0.5, 0.1].forEach(function (hv2, kk) {
        var yb = F.f(a + hv2 * sp);
        if (isFinite(yb)) segs.push({ x1: a, y1: fa, x2: a + hv2 * sp, y2: yb, color: ['#fca5a5', '#f87171', '#dc2626'][kk], width: 1.6 });
      });
      h += plot({
        xmin: a - sp * 1.3, xmax: a + sp * 1.6,
        curves: [{ f: F.f, color: '#2563eb' }],
        segs: segs,
        pts: [{ x: a, y: fa, label: 'P' }],
        caption: 'Tres secantes desde ' + T('P') + ' con ' + T('h') +
          ' cada vez menor. Se van girando hasta apoyarse en la curva.'
      });
      return h;
    });
  });

  /* ---------- Applet · Derivada por definicion, paso a paso ---------- */

  reg('definicion', function (node) {
    var out = shell(node, 'Applet \u00b7 Derivada por definici\u00f3n, paso a paso', [
      'Sigue el esquema de cuatro pasos de los apuntes: ' + T('f(a+h)') + ', el incremento, el cociente y el limite.',
      'Empieza con <code>x^2+x</code> en <code>a = 3</code>: sale ' + T("f'(3)=7") + '.',
      'Prueba <code>sqrt(x)</code> en <code>a = 4</code>: sale ' + T('\\tfrac{1}{4}') +
      '. Ese es el caso que se resuelve multiplicando por el conjugado.',
      'Prueba <code>2/(x-1)</code> en <code>a = -1</code> y en <code>a = 0</code>, los dos ejemplos del libro de texto.',
      'El paso 4 muestra el resultado exacto obtenido con reglas, para que compruebes que tu limite a mano coincide.'
    ].concat(SINTAXIS),
      rowText('f', 'f(x) =', 'x^2+x') +
      row(mini('a', 'a', 3, 0.5))
    );

    live(node, out, function () {
      var F = readF(node, 'f', 'x^2+x');
      var a = readN(node, 'a', 3);
      var fa = F.f(a);
      if (!isFinite(fa)) {
        return errBox('la función no está definida en ' + T('x=' + qt(a)) +
          ', asi que no se puede hablar de su derivada ahi. Antes de derivar hay que comprobar la continuidad.');
      }

      /* f(a+h) se compone sustituyendo x por (a+h) en el arbol. */
      var H = { k: 'x' };                     /* reusamos el nodo x como si fuese h */
      var ahead = simpN(subst(F.ast, add(N(a), H)));
      var texAH = tex(ahead).replace(/x/g, 'h');

      var h = step(key('Paso 0. ') + 'Comprobamos que la función existe en el punto: ' +
        T('f(' + par(a) + ')=' + nt(fa)) + '. ' +
        note('Sin continuidad en el punto no hay derivada.'));
      h += step(key('Paso 1. ') + 'Sustituimos ' + T('x') + ' por ' + T(par(a) + '+h') + ': ' +
        TD('f(' + par(a) + '+h)=' + texAH));
      h += step(key('Paso 2. ') + 'Restamos el valor en el punto: ' +
        TD('f(' + par(a) + '+h)-f(' + par(a) + ')=' + texAH + '-' + par(fa)));
      h += step(key('Paso 3. ') + 'Dividimos entre ' + T('h') + ': ' +
        TD('\\dfrac{f(' + par(a) + '+h)-f(' + par(a) + ')}{h}'));

      var hs = [0.1, 0.01, 0.001, 0.0001, 0.00001], rows = [], i, hv;
      for (i = 0; i < hs.length; i++) {
        hv = hs[i];
        rows.push([T(nt(hv, 7)), T(nt((F.f(a + hv) - fa) / hv, 7)), T(nt((F.f(a - hv) - fa) / (-hv), 7))]);
      }
      h += step(key('Paso 4. ') + 'Hacemos ' + T('h\\to 0') + '. Aparece la indeterminacion ' +
        T('\\tfrac{0}{0}') + ', que hay que resolver simplificando. Numericamente:');
      h += tbl([T('h'), 'cociente con ' + T('+h'), 'cociente con ' + T('-h')], rows);

      if (F.dast) {
        h += step('Con reglas de derivación: ' + TD("f'(x)=" + F.dtx) +
          ' y por tanto ' + TD("f'(" + par(a) + ')=' + nt(F.df(a))));
        h += step(ok('Los dos caminos coinciden.') + ' El limite de la definicion y la sustitución en ' +
          T("f'(x)") + ' dan el mismo numero, como tenia que ser.');
      }

      h += step(note('Truco de calculo segun el tipo de función: si es polinómica, saca ' + T('h') +
        ' factor comun; si es una fraccion, haz denominador comun; si hay una raiz, multiplica arriba y abajo por el conjugado.'));

      var sp = Math.max(1, Math.abs(a) * 0.6);
      h += plot({
        xmin: a - sp * 1.5, xmax: a + sp * 1.5,
        curves: [{ f: F.f, color: '#2563eb' },
        { f: function (x) { return fa + F.df(a) * (x - a); }, color: '#dc2626', dash: '6 4' }],
        pts: [{ x: a, y: fa, label: 'P' }],
        caption: 'En rojo discontinuo, la recta cuya pendiente es el limite calculado.'
      });
      return h;
    });
  });

  /* ---------- Applet · Continuidad y derivabilidad a trozos ---------- */

  reg('derivabilidad', function (node) {
    var out = shell(node, 'Applet \u00b7 ¿Continua? ¿Derivable?', [
      'Una función definida a trozos. El applet comprueba primero la continuidad en el punto de cambio y despues las dos derivadas laterales.',
      'Valores de partida: ' + T('f(x)=4x-4') + ' si ' + T('x<2') + ' y ' + T('f(x)=x^{2}') +
      ' si ' + T('x\\ge 2') + '. Es continua y derivable: el caso ' + T('a=-4') + ', ' + T('b=1') + ' del libro.',
      'Cambia el trozo izquierdo a <code>4x</code>: sigue teniendo la misma pendiente lateral, pero ya no es continua. Sin continuidad no hay derivada.',
      'Cambia el trozo izquierdo a <code>x^2-4x+8</code>: es continua en ' + T('x=2') +
      ' pero las pendientes laterales no coinciden. Ahi hay un ' + key('pico') + '.',
      'Prueba también <code>x^2</code> y <code>sqrt(x)</code> con <code>c = 1</code>, o cualquier pareja que se te ocurra.'
    ].concat(SINTAXIS),
      rowText('f1', 'si x < c, f(x) =', '4x-4') +
      rowText('f2', 'si x \u2265 c, f(x) =', 'x^2') +
      row(mini('c', 'punto de cambio c', 2, 0.5))
    );

    live(node, out, function () {
      var A = readF(node, 'f1', '4x-4'), B = readF(node, 'f2', 'x^2');
      var c = readN(node, 'c', 2);

      var li = A.f(c - 1e-7), ld = B.f(c + 1e-7), fc = B.f(c);
      var h = step('Función a trozos: ' +
        TD('f(x)=\\left\\{\\begin{array}{ll}' + A.tx + ' & \\text{si } x<' + qt(c) +
        ' \\\\ ' + B.tx + ' & \\text{si } x\\ge ' + qt(c) + '\\end{array}\\right.'));

      h += step(key('Primero, la continuidad. ') +
        'Limite por la izquierda ' + T(nt(li, 5)) + ', limite por la derecha ' + T(nt(ld, 5)) +
        ', valor en el punto ' + T('f(' + par(c) + ')=' + nt(fc, 5)) + '.');

      var cont = isFinite(li) && isFinite(ld) && Math.abs(li - ld) < 1e-4 && Math.abs(ld - fc) < 1e-4;
      if (!cont) {
        h += warnStep(bad('No es continua en ') + T('x=' + qt(c)) +
          ', asi que ' + bad('no es derivable') + ' ahi. Y no hace falta mirar las pendientes: ' +
          'la continuidad es condicion necesaria. Un salto no admite recta tangente.');
      } else {
        h += step(ok('Es continua en ') + T('x=' + qt(c)) + '. Podemos seguir.');
        var mi = A.df(c - 1e-6), md = B.df(c + 1e-6);
        h += step(key('Ahora, las derivadas laterales. ') +
          (A.dtx ? T("f'(x)=" + A.dtx) + ' a la izquierda' : 'a la izquierda, numéricamente') +
          ' da ' + T(nt(mi, 5)) + '; ' +
          (B.dtx ? T("f'(x)=" + B.dtx) + ' a la derecha' : 'a la derecha, numéricamente') +
          ' da ' + T(nt(md, 5)) + '.');
        if (Math.abs(mi - md) < 1e-3 * (1 + Math.abs(md))) {
          h += step(ok('Las dos pendientes coinciden') + ': ' + T("f'(" + par(c) + ')=' + nt(md, 4)) +
            '. La función es ' + ok('derivable') + ' en ' + T('x=' + qt(c)) +
            ' y la gráfica pasa por ahi sin pico.');
        } else {
          h += warnStep('Es continua pero ' + bad('no derivable') + ': la pendiente por la izquierda es ' +
            num(mi, 4) + ' y por la derecha ' + num(md, 4) + '. Hay un ' + key('pico') +
            ', y en un pico caben infinitas rectas: ninguna es la tangente.');
        }
      }

      var sp = Math.max(1.5, Math.abs(c));
      h += plot({
        xmin: c - sp, xmax: c + sp,
        curves: [{ f: function (x) { return x < c ? A.f(x) : NaN; }, color: '#2563eb' },
        { f: function (x) { return x >= c ? B.f(x) : NaN; }, color: '#059669' }],
        segs: [],
        pts: [{ x: c, y: fc, label: 'x=' + num(c) }],
        caption: 'En azul el trozo izquierdo, en verde el derecho. Mira si se juntan y si lo hacen con la misma inclinación.'
      });
      return h;
    });
  });

  /* ===================================================================
     9. APARTADO 3 · INTERPRETACION GEOMETRICA
     =================================================================== */

  /* ---------- Applet · De las secantes a la tangente ---------- */

  reg('secantes', function (node) {
    var out = shell(node, 'Applet \u00b7 De las secantes a la tangente', [
      'Mueve el deslizador de ' + T('h') + ' y observa como la secante gira hasta apoyarse en la curva.',
      'Empieza con <code>x^2</code> en <code>a = 1</code>. Con ' + T('h=1') + ' la secante tiene pendiente ' +
      T('3') + '; al reducir ' + T('h') + ' se acerca a ' + T('2') + ', que es ' + T("f'(1)") + '.',
      'Prueba con <code>sin(x)</code> en <code>a = 0</code>: la pendiente tiende a ' + T('1') + '. Sorprendente y cierto.',
      'Ponle ' + T('h') + ' negativo: la secante llega desde el otro lado y acaba en la misma recta. Eso es que el limite existe.',
      'Pregunta: ¿puede la tangente cortar la curva en otro punto lejano? Prueba <code>x^3-3x</code> en <code>a = 1</code> y mira la gráfica completa.'
    ].concat(SINTAXIS),
      rowText('f', 'f(x) =', 'x^2') +
      row(mini('a', 'a', 1, 0.25)) +
      rng('h', 'h', -2, 2, 0.01, 1)
    );

    live(node, out, function () {
      var F = readF(node, 'f', 'x^2');
      var a = readN(node, 'a', 1), hv = readN(node, 'h', 1);
      var fa = F.f(a);
      if (!isFinite(fa)) return errBox('la función no está definida en ' + T('x=' + qt(a)) + '.');
      if (Math.abs(hv) < 1e-9) hv = 0.01;

      var fb = F.f(a + hv), msec = (fb - fa) / hv, mtan = F.df(a);
      var h = step('Punto fijo ' + T('P(' + qt(a) + ',' + nt(fa) + ')') +
        ' y punto movil ' + T('Q(' + nt(a + hv) + ',' + nt(fb) + ')') + ', con ' + T('h=' + nt(hv)) + '.');
      h += step('Pendiente de la secante ' + T('PQ') + ': ' +
        TD('m_{\\text{sec}}=\\dfrac{f(' + par(a) + '+h)-f(' + par(a) + ')}{h}=\\dfrac{' +
        nt(fb - fa) + '}{' + nt(hv) + '}=' + nt(msec)));
      h += step(key('Pendiente de la tangente: ') + T("f'(" + par(a) + ')=' + nt(mtan)) +
        '. Diferencia actual: ' + T(nt(Math.abs(msec - mtan), 5)) + '.');
      if (Math.abs(msec - mtan) < 0.01) {
        h += step(ok('Con este ') + T('h') + ok(' la secante y la tangente ya casi no se distinguen.') +
          ' Pero ojo: ' + T('h') + ' no vale cero. Si ' + T('h=0') + ', ' + T('Q') + ' y ' + T('P') +
          ' son el mismo punto y por un solo punto pasan infinitas rectas.');
      }
      h += step(note('Ecuación de la tangente: ') + T('y=' + lineT(mtan, fa - mtan * a)) +
        ', o en la forma punto-pendiente ' + T('y-' + par(fa) + '=' + par(mtan) + '(x-' + par(a) + ')') + '.');

      var sp = Math.max(2, Math.abs(hv) * 1.8, Math.abs(a) * 0.8);
      h += plot({
        xmin: a - sp, xmax: a + sp,
        curves: [{ f: F.f, color: '#2563eb' },
        { f: function (x) { return fa + mtan * (x - a); }, color: '#059669', width: 2 },
        { f: function (x) { return fa + msec * (x - a); }, color: '#dc2626', dash: '6 4' }],
        pts: [{ x: a, y: fa, label: 'P' }, { x: a + hv, y: fb, label: 'Q', color: '#b45309' }],
        caption: 'Azul: la función. Verde: la tangente en ' + T('P') + '. Rojo discontinuo: la secante ' + T('PQ') + '.'
      });
      return h;
    });
  });

  /* ---------- Applet · Recta tangente y recta normal ---------- */

  reg('tangente', function (node) {
    var out = shell(node, 'Applet \u00b7 Recta tangente y recta normal', [
      'Escribe la función y la abscisa ' + T('a') + '. El applet deriva, calcula la pendiente y compone las dos rectas.',
      'Empieza con <code>x-x^2</code> en <code>a = 2</code>, el ejercicio del libro: sale ' + T('y=-3x+4') + '.',
      'Prueba <code>4/(x-2)</code> en <code>a = 3</code>: sale ' + T('y=-4x+16') + '.',
      'Prueba <code>x^2/(x^2+1)</code> y busca donde la tangente es horizontal. ' +
      'Pista: pon ' + T('a=0') + ' y mira el valor de ' + T("f'(a)") + '.',
      'El error mas repetido es confundir ' + T('f(a)') + ' con ' + T("f'(a)") +
      '. El primero es la altura del punto; el segundo, la inclinación. Aqui los ves separados.'
    ].concat(SINTAXIS),
      rowText('f', 'f(x) =', 'x-x^2') +
      row(mini('a', 'a', 2, 0.5) + sel('n', 'dibujar', [['t', 'solo la tangente'], ['tn', 'tangente y normal']], 't'))
    );

    live(node, out, function () {
      var F = readF(node, 'f', 'x-x^2');
      var a = readN(node, 'a', 2), quiere = readS(node, 'n', 't');
      var fa = F.f(a);
      if (!isFinite(fa)) return errBox('la función no está definida en ' + T('x=' + qt(a)) + '. Elige otra abscisa.');
      var m = F.df(a);
      if (!isFinite(m)) return errBox('la derivada no existe en ' + T('x=' + qt(a)) + '.');

      var h = step('Función: ' + TD('f(x)=' + F.tx));
      if (F.dtx) h += step('Función derivada: ' + TD("f'(x)=" + F.dtx) +
        note('La derivada conserva el orden de los términos de ') + T('f') +
        note(': cada sumando de arriba tiene su derivada en la misma posición. ') +
        'La recta tangente, en cambio, se escribe en la forma canónica ' + T('y=mx+n') +
        ', con la pendiente delante.');
      else h += warnStep('No puedo derivar con reglas está expresión; uso una aproximación numerica de ' + T("f'(a)") + '.');

      h += step('Punto de tangencia: ' + T('a=' + qt(a)) + ', ' +
        key(T('f(' + par(a) + ')=' + nt(fa))) + '. Es la ' + key('altura') + '.');
      h += step('Pendiente: ' + key(T("f'(" + par(a) + ')=' + nt(m))) + '. Es la ' + key('inclinación') + '.');
      h += step('Forma punto-pendiente: ' +
        TD('y-' + par(fa) + '=' + par(m) + '\\left(x-' + par(a) + '\\right)'));
      h += step(key('Recta tangente: ') + TD('y=' + lineT(m, fa - m * a)));

      var comp = fa - m * a + m * a;
      h += step(note('Comprobación: sustituye ' + T('x=' + qt(a)) + ' en la tangente y debe salir ' +
        T(nt(comp)) + ', que es ' + T('f(' + par(a) + ')') + '. Si no sale, hay un error de signo.'));

      if (Math.abs(m) < 1e-9) {
        h += step(ok('La pendiente es cero') + ', asi que la tangente es la recta horizontal ' +
          T('y=' + qt(fa)) + ', paralela al eje ' + T('x') + '. Esos puntos son los candidatos a maximo o minimo.');
      }

      var curves = [{ f: F.f, color: '#2563eb' },
      { f: function (x) { return fa + m * (x - a); }, color: '#dc2626', width: 2 }];
      if (quiere === 'tn') {
        if (Math.abs(m) < 1e-9) {
          h += step('Recta normal: es vertical, ' + T('x=' + qt(a)) +
            ', porque es perpendicular a una tangente horizontal.');
        } else {
          var mn = -1 / m;
          h += step(key('Recta normal: ') + TD('y=' + lineT(mn, fa - mn * a)) +
            ' con pendiente ' + T('-\\dfrac{1}{f\'(' + par(a) + ')}=' + nt(mn)) + '.');
          curves.push({ f: function (x) { return fa + mn * (x - a); }, color: '#7c3aed', dash: '5 4' });
        }
      }

      var sp = Math.max(2.5, Math.abs(a) * 1.2);
      h += plot({
        xmin: a - sp, xmax: a + sp, curves: curves,
        pts: [{ x: a, y: fa, label: 'P(' + num(a) + ', ' + num(fa) + ')' }],
        caption: 'Azul: la función. Rojo: la tangente' + (quiere === 'tn' ? '. Violeta: la normal' : '') + '.'
      });
      return h;
    });
  });

  /* ---------- Applet · Signo de la derivada y crecimiento ---------- */

  reg('signo', function (node) {
    var out = shell(node, 'Applet \u00b7 El signo de ' + T("f'") + ' y el crecimiento', [
      'Dos graficas alineadas: arriba ' + T('f') + ', abajo ' + T("f'") +
      '. Compara donde ' + T("f'") + ' está por encima del eje y donde ' + T('f') + ' sube.',
      'Empieza con <code>x^3-3x</code> en ' + T('[-3,3]') + '. La derivada se anula en ' +
      T('x=-1') + ' y ' + T('x=1') + ', justo donde ' + T('f') + ' cambia de sentido.',
      'Prueba <code>x^2-4x+3</code>: la derivada es una recta y solo cambia de signo una vez.',
      'Prueba <code>1/x</code> en ' + T('[-3,3]') + ': la derivada es siempre negativa, y sin embargo la función no es decreciente en todo el conjunto. ' +
      'Piensa por que: el intervalo se rompe en ' + T('x=0') + '.',
      'Las raices de ' + T("f'") + ' se buscan numéricamente, asi que pueden salir con decimales aunque sean exactas.'
    ].concat(SINTAXIS),
      rowText('f', 'f(x) =', 'x^3-3x') +
      row(mini('a', 'desde', -3, 0.5) + mini('b', 'hasta', 3, 0.5))
    );

    live(node, out, function () {
      var F = readF(node, 'f', 'x^3-3x');
      var a = readN(node, 'a', -3), b = readN(node, 'b', 3);
      if (b - a < 1e-9) return errBox('el extremo derecho debe ser mayor que el izquierdo.');

      var h = step('Función: ' + TD('f(x)=' + F.tx));
      if (F.dtx) h += step('Derivada: ' + TD("f'(x)=" + F.dtx));

      /* raices de f' por cambio de signo, con biseccion */
      var Nn = 800, raices = [], i, x1, x2, y1, y2, lo, hi, mid;
      for (i = 0; i < Nn; i++) {
        x1 = a + (b - a) * i / Nn; x2 = a + (b - a) * (i + 1) / Nn;
        y1 = F.df(x1); y2 = F.df(x2);
        if (!isFinite(y1) || !isFinite(y2)) continue;
        if (y1 === 0) { raices.push(x1); continue; }
        if (y1 * y2 < 0 && Math.abs(y1) < 1e6 && Math.abs(y2) < 1e6) {
          lo = x1; hi = x2;
          for (var j = 0; j < 60; j++) {
            mid = (lo + hi) / 2;
            if (F.df(lo) * F.df(mid) <= 0) hi = mid; else lo = mid;
          }
          raices.push((lo + hi) / 2);
        }
      }
      raices = raices.filter(function (r, k) { return k === 0 || Math.abs(r - raices[k - 1]) > 1e-4; });

      var cortes = [a].concat(raices).concat([b]), rows = [];
      for (i = 0; i + 1 < cortes.length; i++) {
        var xm = (cortes[i] + cortes[i + 1]) / 2, s = F.df(xm);
        if (!isFinite(s)) {
          rows.push([T('(' + nt(cortes[i]) + ',' + nt(cortes[i + 1]) + ')'), 'no definida', 'no se puede decidir']);
          continue;
        }
        rows.push([T('(' + nt(cortes[i]) + ',' + nt(cortes[i + 1]) + ')'),
          s > 0 ? ok('positiva') : bad('negativa'),
          s > 0 ? ok('f crece') : bad('f decrece')]);
      }

      if (raices.length) {
        h += step('La derivada se anula en: ' + raices.map(function (r) { return T('x=' + nt(r, 4)); }).join(', ') +
          '. ' + note('Esos son los puntos donde la tangente es horizontal.'));
      } else {
        h += step('La derivada no se anula en este intervalo, asi que no cambia de signo por esa via.');
      }
      h += tbl(['Intervalo', 'Signo de ' + T("f'"), 'Comportamiento de ' + T('f')], rows);

      h += step(note('Regla: el signo de ') + T("f'") + note(' no dice si la función es grande o pequena, sino si sube o baja. ') +
        'Una función puede tomar valores enormes y estar decreciendo.');

      h += plot({
        h: 250, xmin: a, xmax: b,
        curves: [{ f: F.f, color: '#2563eb' }],
        pts: raices.map(function (r) { return { x: r, y: F.f(r), color: '#dc2626' }; }),
        caption: 'Arriba, ' + T('f') + '. Los puntos rojos son los de tangente horizontal.'
      });
      h += plot({
        h: 250, xmin: a, xmax: b,
        curves: [{ f: F.df, color: '#059669' }],
        pts: raices.map(function (r) { return { x: r, y: 0, color: '#dc2626' }; }),
        caption: 'Abajo, ' + T("f'") + '. Donde está por encima del eje, la de arriba sube.'
      });
      return h;
    });
  });

  /* ---------- Applet · Aproximación lineal ---------- */

  reg('aproxima', function (node) {
    var out = shell(node, 'Applet \u00b7 La tangente como aproximaci\u00f3n', [
      'La tangente sirve para estimar valores de la función cerca del punto. Aqui se mide el error de esa estimación.',
      'Empieza con <code>sqrt(x)</code>, <code>a = 4</code> y <code>x = 4.2</code>: la tangente da ' +
      T('2{,}05') + ' y el valor real es casi el mismo.',
      'Aleja ' + T('x') + ' del punto, por ejemplo <code>x = 9</code>, y mira como el error crece. ' +
      'La aproximación solo es buena ' + key('cerca') + '.',
      'Prueba con <code>exp(x)</code> en <code>a = 0</code>: la tangente es ' + T('y=1+x') +
      ', la aproximación mas usada en economia para intereses pequenos.',
      'Pensamiento critico: si tu modelo de ventas es lineal porque has usado una tangente, ¿hasta donde puedes extrapolar sin decir tonterias?'
    ].concat(SINTAXIS),
      rowText('f', 'f(x) =', 'sqrt(x)') +
      row(mini('a', 'punto a', 4, 0.5) + mini('x', 'estimar en x', 4.2, 0.1))
    );

    live(node, out, function () {
      var F = readF(node, 'f', 'sqrt(x)');
      var a = readN(node, 'a', 4), x = readN(node, 'x', 4.2);
      var fa = F.f(a), m = F.df(a);
      if (!isFinite(fa)) return errBox('la función no está definida en ' + T('x=' + qt(a)) + '.');

      var apr = fa + m * (x - a), real = F.f(x);
      var err = real - apr;
      var rel = Math.abs(real) > 1e-12 ? Math.abs(err / real) * 100 : NaN;

      var h = step('Tangente en ' + T('a=' + qt(a)) + ': ' + TD('y=' + lineT(m, fa - m * a)));
      h += step('Estimacion en ' + T('x=' + nt(x)) + ': ' +
        TD('y=' + nt(fa) + par(m) + '\\cdot\\left(' + nt(x) + '-' + par(a) + '\\right)=' + nt(apr, 6)));
      h += step('Valor verdadero: ' + T('f(' + par(x) + ')=' + nt(real, 6)) +
        '. Error absoluto ' + key(T(nt(Math.abs(err), 6))) +
        (isFinite(rel) ? ', error relativo ' + key(num(rel, 3) + ' %') : '') + '.');

      if (Math.abs(err) < 1e-3 * (1 + Math.abs(real))) {
        h += step(ok('La aproximación es excelente.') + ' Estas muy cerca del punto de tangencia.');
      } else if (isFinite(rel) && rel > 10) {
        h += warnStep(bad('Error superior al 10 %.') + ' Te has alejado demasiado de ' +
          T('x=' + qt(a)) + '. La tangente es una recta y la función no lo es: la distancia entre las dos crece.');
      }

      h += tbl(['Distancia ' + T('x-a'), 'Aproximación', 'Valor real', 'Error'],
        [0.1, 0.5, 1, 2, 5].map(function (d) {
          var xx = a + d, ap = fa + m * d, rr = F.f(xx);
          return [T(nt(d)), T(nt(ap, 5)), T(nt(rr, 5)), T(nt(rr - ap, 5))];
        }));

      var sp = Math.max(Math.abs(x - a) * 2, 2);
      h += plot({
        xmin: Math.min(a, x) - sp * 0.5, xmax: Math.max(a, x) + sp * 0.5,
        curves: [{ f: F.f, color: '#2563eb' },
        { f: function (t) { return fa + m * (t - a); }, color: '#dc2626', dash: '6 4' }],
        segs: [{ x1: x, y1: apr, x2: x, y2: real, color: '#b45309', width: 2 }],
        pts: [{ x: a, y: fa, label: 'P' }, { x: x, y: real, color: '#2563eb' },
        { x: x, y: apr, color: '#dc2626' }],
        caption: 'El segmento naranja es el error: la distancia vertical entre la curva y la tangente.'
      });
      return h;
    });
  });

  /* ---------- Applet de diagnostico ---------- */

  reg('diagnostico', function (node) {
    var out = shell(node, 'Applet \u00b7 Diagn\u00f3stico t\u00e9cnico', [
      'Este applet no enseña matemáticas: comprueba que la página ha cargado bien lo que necesitan los demás.',
      'Si algo sale en rojo, revisa las rutas de <code>assets/_scripts.html</code> antes de seguir.'
    ], '');

    var rows = [
      ['KaTeX (<code>window.katex</code>)', window.katex ? ok('cargado') : bad('no cargado')],
      ['auto-render (<code>renderMathInElement</code>)', window.renderMathInElement ? ok('disponible') : bad('ausente')],
      ['Motor del tema (<code>window.DER</code>)', window.DER ? ok('activo') : bad('ausente')],
      ['Hoja <code>applets.css</code>', getComputedStyle(node).paddingTop !== '0px' ? ok('aplicada') : bad('no aplicada')]
    ];
    var pruebas = [
      ['x^2+x', 3, 7], ['sqrt(x)', 4, 0.25], ['1/x', 2, -0.25],
      ['sin(x)', 0, 1], ['exp(x)', 0, 1], ['ln(x)', 1, 1], ['x^3-3x', 2, 9]
    ];
    pruebas.forEach(function (p) {
      var txt, bien = false;
      try {
        var A = simpN(parse(p[0]));
        var v = ev(simpN(D(A)), p[1]);
        bien = Math.abs(v - p[2]) < 1e-6;
        txt = (bien ? ok('correcto') : bad('da ' + num(v, 6))) + ', esperado ' + num(p[2], 6);
      } catch (e) { txt = bad('error: ' + e.message); }
      rows.push(['Derivada de <code>' + p[0] + '</code> en ' + T('x=' + p[1]), txt]);
    });

    out.innerHTML = tbl(['Comprobación', 'Resultado'], rows) +
      step(note('Notación de prueba: ') + TD('\\dfrac{d}{dx}\\left(x^{2}+x\\right)=2x+1'));
    kt(out);
  });

  /* ===================================================================
     10. PUBLICACION
     =================================================================== */

  window.DER = {
    reg: reg,
    boot: boot,
    core: {
      kt: kt, T: T, TD: TD,
      nz: nz, rd: rd, num: num, nt: nt, qt: qt, par: par, sgnT: sgnT,
      coefV: coefV, binT: binT, lineT: lineT, plain: plain,
      parse: parse, ev: ev, D: D, simp: simp, simpN: simpN, tex: tex, subst: subst,
      N: N, XV: XV, add: add, sub: sub, mul: mul, dv: dv, pw: pw, neg: neg, fnode: fnode,
      dnum: dnum, fnOf: fnOf, readF: readF,
      plot: plot, tbl: tbl,
      head: head, errBox: errBox, step: step, warnStep: warnStep,
      key: key, ok: ok, bad: bad, note: note, chip: chip,
      rowText: rowText, mini: mini, rng: rng, sel: sel, row: row,
      shell: shell, live: live, readS: readS, readN: readN, readList: readList,
      SINTAXIS: SINTAXIS
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
