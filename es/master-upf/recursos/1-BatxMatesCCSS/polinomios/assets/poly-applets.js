/* =====================================================================
   poly-applets.js
   Motor algebraico exacto + applets manipulables para el tema
   "Polinomios y fracciones algebraicas" — 1r Batx · Mat. CCSS I
   ---------------------------------------------------------------------
   NOTAS TECNICAS (importantes):
   - JavaScript puro (vanilla). NO se usa OJS ni Observable: los applets
     no dependen del runtime de Quarto, solo del DOM.
   - Toda la aritmetica es EXACTA con numeros racionales (sin errores de
     coma flotante). Los floats solo se usan para dibujar graficas.
   - Las formulas se devuelven como LaTeX dentro de \( \) y se tipografian
     llamando a MathJax.typesetPromise sobre el nodo actualizado.
   - Cada applet se construye desde JS a partir de <div data-applet="clave">
     para que los .qmd queden limpios y sin HTML propenso a errores.
   ===================================================================== */
(function () {
  'use strict';

  /* =============== 0. Utilidades DOM y MathJax =============== */

  function mj(el) {
    (function go(tries) {
      if (window.MathJax && window.MathJax.typesetPromise) {
        if (window.MathJax.typesetClear) {
          try { window.MathJax.typesetClear([el]); } catch (e) { /* sin efecto en v3 antiguas */ }
        }
        window.MathJax.typesetPromise([el]).catch(function (e) { console.warn('MathJax:', e); });
      } else if (tries < 30) {
        setTimeout(function () { go(tries + 1); }, 300);
      }
    })(0);
  }

  function head(title, bullets) {
    var li = bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('');
    return '<div class="ap-head"><h4 class="ap-title">' + title + '</h4>' +
      '<details class="ap-help" open><summary>Instrucciones de uso y sintaxis</summary><ul>' +
      li + '</ul></details></div>';
  }

  function errBox(msg) {
    return '<div class="ap-err"><b>Revisa la entrada:</b> ' + msg + '</div>';
  }

  /* =============== 1. Numeros racionales exactos =============== */

  function gcdI(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function lcmI(a, b) { if (a === 0 || b === 0) return 0; return Math.abs(a * b) / gcdI(a, b); }

  function R(n, d) {
    if (d === undefined) d = 1;
    if (d === 0) throw new Error('denominador cero');
    if (d < 0) { n = -n; d = -d; }
    var g = gcdI(n, d) || 1;
    return { n: n / g, d: d / g };
  }
  function rAdd(a, b) { return R(a.n * b.d + b.n * a.d, a.d * b.d); }
  function rSub(a, b) { return R(a.n * b.d - b.n * a.d, a.d * b.d); }
  function rMul(a, b) { return R(a.n * b.n, a.d * b.d); }
  function rDiv(a, b) { if (b.n === 0) throw new Error('division entre cero'); return R(a.n * b.d, a.d * b.n); }
  function rNeg(a) { return R(-a.n, a.d); }
  function rIsZero(a) { return a.n === 0; }
  function rEq(a, b) { return a.n === b.n && a.d === b.d; }
  function rNum(a) { return a.n / a.d; }
  function rTex(a) {
    if (a.d === 1) return String(a.n);
    return (a.n < 0 ? '-' : '') + '\\tfrac{' + Math.abs(a.n) + '}{' + a.d + '}';
  }
  function rStr(a) { return a.d === 1 ? String(a.n) : a.n + '/' + a.d; }

  function numToR(s) {
    if (s.indexOf('.') >= 0) {
      var p = s.split('.'), dec = p[1] || '';
      var neg = p[0].charAt(0) === '-';
      var whole = p[0].replace('-', '') || '0';
      var v = R(parseInt(whole + dec, 10), Math.pow(10, dec.length));
      return neg ? rNeg(v) : v;
    }
    return R(parseInt(s, 10), 1);
  }

  function parseR(s) {
    s = String(s == null ? '' : s).trim().replace(/\u2212/g, '-').replace(/,/g, '.');
    var m = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
    if (m) return rDiv(numToR(m[1]), numToR(m[2]));
    if (/^-?\d+(\.\d+)?$/.test(s)) return numToR(s);
    throw new Error('"' + s + '" no es un numero valido. Escribe por ejemplo <code>3</code>, <code>-2</code>, <code>5/2</code> o <code>0.5</code>.');
  }

  /* =============== 2. Polinomios (array de racionales, indice = grado) =============== */

  function pTrim(p) { var q = p.slice(); while (q.length > 1 && rIsZero(q[q.length - 1])) q.pop(); return q; }
  function pZero() { return [R(0)]; }
  function pOne() { return [R(1)]; }
  function pIsZero(p) { p = pTrim(p); return p.length === 1 && rIsZero(p[0]); }
  function pDeg(p) { p = pTrim(p); return pIsZero(p) ? -1 : p.length - 1; }
  function pLead(p) { p = pTrim(p); return p[p.length - 1]; }
  function pCopy(p) { return p.map(function (c) { return R(c.n, c.d); }); }

  function pAdd(a, b) {
    var n = Math.max(a.length, b.length), r = [];
    for (var i = 0; i < n; i++) r.push(rAdd(a[i] || R(0), b[i] || R(0)));
    return pTrim(r);
  }
  function pSub(a, b) {
    var n = Math.max(a.length, b.length), r = [];
    for (var i = 0; i < n; i++) r.push(rSub(a[i] || R(0), b[i] || R(0)));
    return pTrim(r);
  }
  function pMul(a, b) {
    if (pIsZero(a) || pIsZero(b)) return pZero();
    var r = [], i, j;
    for (i = 0; i < a.length + b.length - 1; i++) r.push(R(0));
    for (i = 0; i < a.length; i++) for (j = 0; j < b.length; j++) r[i + j] = rAdd(r[i + j], rMul(a[i], b[j]));
    return pTrim(r);
  }
  function pScale(a, k) { return pTrim(a.map(function (c) { return rMul(c, k); })); }
  function pPow(a, n) { var r = pOne(); for (var i = 0; i < n; i++) r = pMul(r, a); return r; }
  function pShift(a, k) { var r = []; for (var i = 0; i < k; i++) r.push(R(0)); return pTrim(r.concat(a)); }
  function pEq(a, b) { return pIsZero(pSub(a, b)); }

  function pDivMod(a, b) {
    b = pTrim(b);
    if (pIsZero(b)) throw new Error('no se puede dividir entre el polinomio nulo');
    var rem = pTrim(a), db = pDeg(b), lb = pLead(b), steps = [];
    if (pDeg(rem) < db) return { q: pZero(), r: rem, steps: steps };
    var qq = [], i;
    for (i = 0; i <= pDeg(rem) - db; i++) qq.push(R(0));
    var guard = 0;
    while (!pIsZero(rem) && pDeg(rem) >= db && guard++ < 200) {
      var dr = pDeg(rem), k = dr - db, c = rDiv(rem[dr], lb);
      qq[k] = c;
      var mono = pShift([c], k), prod = pMul(mono, b);
      steps.push({ term: mono, prod: prod, before: pCopy(rem) });
      rem = pSub(rem, prod);
    }
    return { q: pTrim(qq), r: rem, steps: steps };
  }

  function pEval(p, r) {           // Horner exacto
    var acc = R(0);
    for (var i = p.length - 1; i >= 0; i--) acc = rAdd(rMul(acc, r), p[i]);
    return acc;
  }
  function pEvalNum(p, x) {
    var acc = 0;
    for (var i = p.length - 1; i >= 0; i--) acc = acc * x + rNum(p[i]);
    return acc;
  }

  function pTex(p, v) {
    v = v || 'x';
    p = pTrim(p);
    if (pIsZero(p)) return '0';
    var out = '';
    for (var i = p.length - 1; i >= 0; i--) {
      var c = p[i];
      if (rIsZero(c)) continue;
      var neg = c.n < 0, abs = R(Math.abs(c.n), c.d);
      out += out === '' ? (neg ? '-' : '') : (neg ? ' - ' : ' + ');
      var showCoef = !(rEq(abs, R(1)) && i > 0);
      if (showCoef) out += rTex(abs);
      if (i === 1) out += v;
      else if (i > 1) out += v + '^{' + i + '}';
    }
    return out;
  }

  /* ---- Parser: acepta sumas, productos implicitos, potencias y parentesis ---- */

  function tokenize(s) {
    s = String(s).replace(/\u00b2/g, '^2').replace(/\u00b3/g, '^3').replace(/\u2074/g, '^4')
      .replace(/\u2212/g, '-').replace(/\u00b7/g, '*').replace(/\s+/g, '');
    var t = [], i = 0;
    while (i < s.length) {
      var c = s[i];
      if (/[0-9.]/.test(c)) { var j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; t.push({ t: 'num', v: s.slice(i, j) }); i = j; }
      else if (/[xX]/.test(c)) { t.push({ t: 'x' }); i++; }
      else if ('+-*/^()'.indexOf(c) >= 0) { t.push({ t: c }); i++; }
      else throw new Error('el caracter <code>' + c + '</code> no es valido. Usa solo cifras, <code>x</code> y los signos <code>+ - * / ^ ( )</code>.');
    }
    return t;
  }

  function parsePoly(str) {
    if (str == null || String(str).trim() === '') throw new Error('la casilla esta vacia. Escribe por ejemplo <code>2x^3-5x+1</code>.');
    var t = tokenize(str), pos = 0;
    function peek() { return t[pos]; }
    function eat(k) { if (t[pos] && t[pos].t === k) { pos++; return true; } return false; }
    function startsBase() { var p = peek(); return p && (p.t === 'num' || p.t === 'x' || p.t === '('); }

    function E() {
      var sign = 1;
      if (eat('-')) sign = -1; else eat('+');
      var v = T();
      if (sign < 0) v = pScale(v, R(-1));
      while (pos < t.length && (peek().t === '+' || peek().t === '-')) {
        var op = t[pos++].t, w = T();
        v = (op === '+') ? pAdd(v, w) : pSub(v, w);
      }
      return v;
    }
    function T() {
      var v = F();
      for (;;) {
        if (eat('*')) { v = pMul(v, F()); }
        else if (eat('/')) {
          var d = F();
          if (pDeg(d) > 0) throw new Error('solo se puede dividir entre un numero. Escribe <code>(1/2)x^2</code> en lugar de <code>1/2x^2</code>.');
          v = pScale(v, rDiv(R(1), d[0]));
        }
        else if (startsBase()) { v = pMul(v, F()); }
        else break;
      }
      return v;
    }
    function F() {
      var b = B();
      if (eat('^')) {
        var e = peek();
        if (!e || e.t !== 'num') throw new Error('despues de <code>^</code> debe ir un entero, por ejemplo <code>x^3</code>.');
        pos++;
        var n = parseFloat(e.v);
        if (n !== Math.floor(n) || n < 0 || n > 24) throw new Error('el exponente debe ser un entero entre 0 y 24.');
        return pPow(b, n);
      }
      return b;
    }
    function B() {
      if (eat('(')) { var v = E(); if (!eat(')')) throw new Error('falta un parentesis de cierre <code>)</code>.'); return v; }
      if (peek() && peek().t === 'num') { return [numToR(t[pos++].v)]; }
      if (eat('x')) return [R(0), R(1)];
      if (eat('-')) return pScale(B(), R(-1));
      throw new Error('la expresion queda incompleta. Comprueba operadores y parentesis.');
    }
    var res = E();
    if (pos < t.length) throw new Error('no entiendo el final de la expresion. Comprueba los operadores y los parentesis.');
    return res;
  }

  /* =============== 3. Contenido, candidatos y factorizacion =============== */

  function pContent(p) {                     // P = k * prim , prim entero primitivo, lider > 0
    p = pTrim(p);
    if (pIsZero(p)) return { k: R(1), prim: pZero() };
    var L = 1, i;
    for (i = 0; i < p.length; i++) L = lcmI(L, p[i].d);
    var ints = p.map(function (c) { return c.n * (L / c.d); });
    var g = 0;
    for (i = 0; i < ints.length; i++) g = gcdI(g, ints[i]);
    if (g === 0) g = 1;
    var sgn = ints[ints.length - 1] < 0 ? -1 : 1;
    var prim = ints.map(function (v) { return R(sgn * v / g); });
    return { k: R(sgn * g, L), prim: pTrim(prim) };
  }

  function divisors(n) {
    n = Math.abs(n); var d = [];
    for (var i = 1; i <= n; i++) if (n % i === 0) d.push(i);
    return d;
  }

  function ratCandidates(p) {                 // p con coeficientes enteros y p[0] != 0
    var a0 = p[0].n, an = pLead(p).n, out = [], seen = {};
    var D0 = divisors(a0), Dn = divisors(an);
    D0.forEach(function (num) {
      Dn.forEach(function (den) {
        [1, -1].forEach(function (s) {
          var r = R(s * num, den), key = rStr(r);
          if (!seen[key]) { seen[key] = 1; out.push(r); }
        });
      });
    });
    out.sort(function (a, b) { return rNum(a) - rNum(b); });
    return out;
  }

  function quadInfo(q) {                      // q de grado 2
    var a = q[2], b = q[1], c = q[0];
    var disc = rSub(rMul(b, b), rMul(R(4), rMul(a, c)));
    var dn = rNum(disc), info = { poly: q, disc: disc, discNum: dn, roots: [] };
    if (dn > 0) {
      var s = Math.sqrt(dn), an = rNum(a), bn = rNum(b);
      info.roots = [(-bn - s) / (2 * an), (-bn + s) / (2 * an)];
      info.type = 'irracional';
    } else if (dn === 0) { info.roots = [-rNum(b) / (2 * rNum(a))]; info.type = 'doble'; }
    else { info.type = 'sin raices reales'; }
    return info;
  }

  function quarticSplit(p) {                  // x^4+px^3+qx^2+rx+s = (x^2+ax+b)(x^2+cx+d), enteros
    if (pDeg(p) !== 4) return null;
    if (!rEq(pLead(p), R(1))) return null;
    var i, ok = true;
    for (i = 0; i < p.length; i++) if (p[i].d !== 1) ok = false;
    if (!ok) return null;
    var P = p[3].n, Q = p[2].n, Rr = p[1].n, S = p[0].n;
    if (S === 0) return null;
    var ds = divisors(S), cand = [];
    ds.forEach(function (v) { cand.push(v); cand.push(-v); });
    for (var bi = 0; bi < cand.length; bi++) {
      var b = cand[bi];
      if (S % b !== 0) continue;
      var d = S / b;
      for (var a = -30; a <= 30; a++) {
        var c = P - a;
        if (b + d + a * c !== Q) continue;
        if (a * d + b * c !== Rr) continue;
        return [[R(b), R(a), R(1)], [R(d), R(c), R(1)]];
      }
    }
    return null;
  }

  function factorize(P) {
    P = pTrim(P);
    var res = { zero: false, k: R(1), xmult: 0, linear: [], quads: [], leftover: null, original: pCopy(P) };
    if (pIsZero(P)) { res.zero = true; return res; }
    var c = pContent(P);
    res.k = c.k;
    var p = c.prim;
    while (p.length > 1 && rIsZero(p[0])) { p = p.slice(1); res.xmult++; }
    var guard = 0;
    while (pDeg(p) > 0 && guard++ < 40) {
      var cands = ratCandidates(p), found = null;
      for (var i = 0; i < cands.length; i++) if (rIsZero(pEval(p, cands[i]))) { found = cands[i]; break; }
      if (!found) break;
      var m = 0;
      while (pDeg(p) > 0 && rIsZero(pEval(p, found))) { p = pDivMod(p, [rNeg(found), R(1)]).q; m++; }
      res.linear.push({ root: found, mult: m });
      var cc = pContent(p);
      res.k = rMul(res.k, cc.k);
      p = cc.prim;
    }
    if (pDeg(p) === 2) { res.quads.push(quadInfo(p)); p = pOne(); }
    else if (pDeg(p) === 4) {
      var sp = quarticSplit(p);
      if (sp) { res.quads.push(quadInfo(sp[0])); res.quads.push(quadInfo(sp[1])); p = pOne(); }
    }
    if (pDeg(p) > 0) res.leftover = p;
    else res.k = rMul(res.k, p[0]);
    res.linear.sort(function (a, b) { return rNum(a.root) - rNum(b.root); });
    return res;
  }

  function powTex(base, m) { return m === 1 ? base : base + '^{' + m + '}'; }

  function factorTex(f, mode) {              // mode: 'monic' | 'entero'
    if (f.zero) return '0';
    var k = R(f.k.n, f.k.d), parts = [];
    if (f.xmult > 0) parts.push(powTex('x', f.xmult));
    f.linear.forEach(function (L) {
      var r = L.root;
      if (mode === 'entero' && r.d !== 1) {
        for (var i = 0; i < L.mult; i++) k = rDiv(k, R(r.d));
        var s = r.n < 0 ? ' + ' + Math.abs(r.n) : ' - ' + r.n;
        parts.push(powTex('(' + r.d + 'x' + s + ')', L.mult));
      } else {
        var t = rIsZero(r) ? 'x' : '(x ' + (r.n < 0 ? '+ ' + rTex(rNeg(r)) : '- ' + rTex(r)) + ')';
        parts.push(powTex(t, L.mult));
      }
    });
    f.quads.forEach(function (q) { parts.push('(' + pTex(q.poly) + ')'); });
    if (f.leftover) parts.push('(' + pTex(f.leftover) + ')');
    var body = parts.join('\\,');
    if (parts.length === 0) return rTex(k);
    if (rEq(k, R(1))) return body;
    if (rEq(k, R(-1))) return '-' + body;
    return rTex(k) + '\\,' + body;
  }

  function factorRebuild(f) {                // para verificar la identidad
    var p = [R(f.k.n, f.k.d)];
    if (f.xmult) p = pMul(p, pPow([R(0), R(1)], f.xmult));
    f.linear.forEach(function (L) { p = pMul(p, pPow([rNeg(L.root), R(1)], L.mult)); });
    f.quads.forEach(function (q) { p = pMul(p, q.poly); });
    if (f.leftover) p = pMul(p, f.leftover);
    return p;
  }

  function realRootsOf(f) {
    var rs = [];
    if (f.xmult > 0) rs.push(0);
    f.linear.forEach(function (L) { rs.push(rNum(L.root)); });
    f.quads.forEach(function (q) { q.roots.forEach(function (v) { rs.push(v); }); });
    rs = rs.filter(function (v) { return isFinite(v); });
    rs.sort(function (a, b) { return a - b; });
    return rs.filter(function (v, i, arr) { return i === 0 || Math.abs(v - arr[i - 1]) > 1e-9; });
  }

  function pGcd(a, b) {
    a = pTrim(a); b = pTrim(b);
    var guard = 0;
    while (!pIsZero(b) && guard++ < 60) { var r = pDivMod(a, b).r; a = b; b = r; }
    if (pIsZero(a)) return pOne();
    return pScale(a, rDiv(R(1), pLead(a)));
  }
  function pLcm(a, b) {
    var g = pGcd(a, b), m = pDivMod(pMul(a, b), g).q;
    var c = pContent(m);
    return c.prim;
  }

  function fracNormalize(num, den) {          // quita denominadores y contenido comun
    var cn = pContent(num), cd = pContent(den);
    var k = rDiv(cn.k, cd.k);
    var g = gcdI(k.n, k.d) || 1;
    return { num: pScale(cn.prim, R(k.n / g)), den: pScale(cd.prim, R(k.d / g)) };
  }

  function fracSimplify(num, den) {
    if (pIsZero(den)) throw new Error('el denominador no puede ser el polinomio nulo.');
    var g = pGcd(num, den);
    var n2 = pDivMod(num, g).q, d2 = pDivMod(den, g).q;
    var nn = fracNormalize(n2, d2);
    if (rNum(pLead(nn.den)) < 0) { nn.num = pScale(nn.num, R(-1)); nn.den = pScale(nn.den, R(-1)); }
    return { num: nn.num, den: nn.den, gcd: g };
  }

  /* =============== 4. Grafica en canvas =============== */

  function plotPoly(cv, series, marks) {
    var ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    var xmin = -5, xmax = 5, i;
    if (marks && marks.length) {
      var mn = Math.min.apply(null, marks), mx = Math.max.apply(null, marks);
      var pad = Math.max(1.2, (mx - mn) * 0.4);
      xmin = Math.min(xmin, mn - pad); xmax = Math.max(xmax, mx + pad);
    }
    var N = 900, ys = [];
    for (i = 0; i <= N; i++) {
      var xx = xmin + (xmax - xmin) * i / N;
      series.forEach(function (s) { var v = pEvalNum(s.p, xx); if (isFinite(v)) ys.push(v); });
    }
    ys.sort(function (a, b) { return a - b; });
    var lo = ys[Math.floor(ys.length * 0.04)], hi = ys[Math.floor(ys.length * 0.96)];
    var m = Math.max(Math.abs(lo || 0), Math.abs(hi || 0), 2);
    var ymin = -m * 1.15, ymax = m * 1.15;
    function X(x) { return (x - xmin) / (xmax - xmin) * W; }
    function Y(y) { return H - (y - ymin) / (ymax - ymin) * H; }

    ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 1;
    for (i = Math.ceil(xmin); i <= Math.floor(xmax); i++) { ctx.beginPath(); ctx.moveTo(X(i), 0); ctx.lineTo(X(i), H); ctx.stroke(); }
    var stepY = Math.max(1, Math.round(m / 5));
    for (i = Math.ceil(ymin / stepY) * stepY; i <= ymax; i += stepY) { ctx.beginPath(); ctx.moveTo(0, Y(i)); ctx.lineTo(W, Y(i)); ctx.stroke(); }
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H); ctx.stroke();
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif';
    for (i = Math.ceil(xmin); i <= Math.floor(xmax); i++) if (i !== 0) ctx.fillText(String(i), X(i) + 2, Y(0) + 12);

    series.forEach(function (s) {
      ctx.strokeStyle = s.color || '#2a76dd'; ctx.lineWidth = 2.2; ctx.beginPath();
      var first = true;
      for (i = 0; i <= N; i++) {
        var x = xmin + (xmax - xmin) * i / N, y = pEvalNum(s.p, x);
        if (!isFinite(y)) { first = true; continue; }
        var py = Y(y);
        if (py < -3000 || py > H + 3000) { first = true; continue; }
        if (first) { ctx.moveTo(X(x), py); first = false; } else ctx.lineTo(X(x), py);
      }
      ctx.stroke();
    });

    if (marks) marks.forEach(function (r) {
      ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.arc(X(r), Y(0), 5, 0, 2 * Math.PI); ctx.fill();
    });
  }

  /* =============== 5. Constructores de applets =============== */

  var B = {};

  function wire(root, run) {
    var go = root.querySelector('.btn-go'), out = root.querySelector('.out');
    function exec() {
      try { run(root, out); }
      catch (e) { out.innerHTML = errBox(e.message || String(e)); }
      mj(out);
    }
    if (go) go.addEventListener('click', exec);
    root.querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') exec(); });
    });
    root.querySelectorAll('select').forEach(function (s) { s.addEventListener('change', exec); });
    exec();
  }

  function inputRow(fields, btn) {
    var h = '<div class="ap-row">';
    fields.forEach(function (f) {
      h += '<label>' + f.label + '</label>';
      if (f.options) {
        h += '<select class="' + f.cls + '">' + f.options.map(function (o) {
          return '<option value="' + o[0] + '">' + o[1] + '</option>';
        }).join('') + '</select>';
      } else {
        h += '<input class="' + f.cls + '" value="' + f.value + '" size="' + (f.size || 24) + '">';
      }
    });
    h += '<button class="ap-btn btn-go">' + (btn || 'Calcular') + '</button></div>';
    return h;
  }

  function val(root, cls) { return root.querySelector('.' + cls).value; }

  /* ---------- A1. Anatomia de un polinomio ---------- */
  B.anatomia = function (root) {
    root.innerHTML = head('Applet 1 · Anatomia de un polinomio', [
      'Escribe el polinomio en <b>P(x)</b>. Sintaxis: <code>4x^3-2x^2-2x+1</code>, <code>6x^5+8x^4-7x^3+4x+1</code>, <code>(x+1)(x-2)^2</code>, <code>(1/2)x^2-3/4</code>. Se aceptan <code>x^2</code> y <code>x&#178;</code>.',
      'En <b>x =</b> escribe el valor donde quieres calcular el valor numerico: <code>-3</code>, <code>0</code>, <code>5/2</code>, <code>0.5</code>.',
      'Observa: grado, coeficiente principal, termino independiente, si es monico, completo u ordenado, la tabla de valores y la grafica.',
      'Experimenta: teclea el mismo polinomio desordenado (<code>1-7x^3+4x+8x^4</code>). El applet lo reescribe ordenado: comprueba que es el mismo objeto.'
    ]) + inputRow([
      { label: 'P(x) =', cls: 'inp-p', value: '4x^3-2x^2-2x+1', size: 30 },
      { label: 'x =', cls: 'inp-a', value: '-3', size: 6 }
    ], 'Analizar') + '<div class="out"></div><canvas class="ap-canvas cv" width="660" height="300"></canvas>';

    wire(root, function (r, out) {
      var p = parsePoly(val(r, 'inp-p')), a = parseR(val(r, 'inp-a'));
      var n = pDeg(p), i;
      var coefs = '<table class="ap-tbl"><tr><th>Grado k</th>';
      for (i = n; i >= 0; i--) coefs += '<th>' + i + '</th>';
      coefs += '</tr><tr><td>Coeficiente</td>';
      for (i = n; i >= 0; i--) coefs += '<td>\\(' + rTex(p[i] || R(0)) + '\\)</td>';
      coefs += '</tr></table>';
      var completo = true;
      for (i = 0; i <= n; i++) if (rIsZero(p[i] || R(0))) completo = false;
      var vals = '<table class="ap-tbl"><tr><th>x</th>';
      var xs = [-3, -2, -1, 0, 1, 2, 3];
      xs.forEach(function (v) { vals += '<th>' + v + '</th>'; });
      vals += '</tr><tr><td>P(x)</td>';
      xs.forEach(function (v) { vals += '<td>\\(' + rTex(pEval(p, R(v))) + '\\)</td>'; });
      vals += '</tr></table>';
      out.innerHTML =
        '<div class="ap-formula">\\(P(x) = ' + pTex(p) + '\\)</div>' +
        '<ul class="ap-list">' +
        '<li>Grado: <b>' + (n < 0 ? 'polinomio nulo' : n) + '</b>' + (n >= 0 ? ' — hay ' + (n + 1) + ' coeficientes, de \\(a_{' + n + '}\\) a \\(a_0\\)' : '') + '</li>' +
        '<li>Coeficiente principal \\(a_{' + n + '} = ' + rTex(pLead(p)) + '\\) ' + (rEq(pLead(p), R(1)) ? '(el polinomio es <b>monico</b>)' : '(no es monico)') + '</li>' +
        '<li>Termino independiente \\(a_0 = ' + rTex(p[0]) + '\\)' + (rIsZero(p[0]) ? ' — al ser 0, <b>x = 0 es raiz</b> y se puede sacar factor comun x' : '') + '</li>' +
        '<li>Numero de terminos no nulos: <b>' + p.filter(function (c) { return !rIsZero(c); }).length + '</b> ' +
        '(' + ['', 'monomio', 'binomio', 'trinomio', 'cuatrinomio'][Math.min(4, p.filter(function (c) { return !rIsZero(c); }).length)] + ')</li>' +
        '<li>' + (completo ? 'Es <b>completo</b>: aparecen todas las potencias' : 'Es <b>incompleto</b>: falta alguna potencia intermedia (su coeficiente es 0)') + '</li>' +
        '<li>Valor numerico: \\(P(' + rTex(a) + ') = ' + rTex(pEval(p, a)) + '\\)' + (rIsZero(pEval(p, a)) ? ' &rarr; <b>es una raiz</b>' : '') + '</li>' +
        '</ul>' + coefs + vals;
      plotPoly(r.querySelector('.cv'), [{ p: p, color: '#2a76dd' }], realRootsOf(factorize(p)));
    });
  };

  /* ---------- A2. Suma, resta, producto, potencia ---------- */
  B.operaciones = function (root) {
    root.innerHTML = head('Applet 2 · Suma, resta, producto y potencia', [
      'Escribe dos polinomios. Ejemplos: <code>x^8-x^7-x^6-2x^3+5x^2-1</code> y <code>8x^4-6x^3-2x+1</code>.',
      'Elige la operacion. Con <b>potencia</b> se calcula \\(P(x)^n\\) usando el exponente de la casilla <b>n</b> (entero de 0 a 8).',
      'Comprueba la <b>regla de los grados</b>: en el producto los grados se suman; en la suma el grado es el mayor de los dos... salvo que los coeficientes principales se cancelen.',
      'Reto: encuentra dos polinomios de grado 3 cuya suma tenga grado 2. ¿Puedes conseguir que la suma tenga grado 4? Piensa por que no.'
    ]) + inputRow([
      { label: 'P(x) =', cls: 'inp-p', value: '3x^3+4x^2-1', size: 24 },
      { label: 'Q(x) =', cls: 'inp-q', value: '-3x^3+5x-3', size: 24 },
      { label: 'Operacion', cls: 'inp-op', options: [['s', 'P + Q'], ['r', 'P - Q'], ['m', 'P · Q'], ['p', 'P elevado a n']] },
      { label: 'n =', cls: 'inp-n', value: '2', size: 3 }
    ], 'Operar') + '<div class="out"></div>';

    wire(root, function (r, out) {
      var p = parsePoly(val(r, 'inp-p')), q = parsePoly(val(r, 'inp-q')), op = val(r, 'inp-op');
      var n = parseInt(val(r, 'inp-n'), 10);
      var res, expr;
      if (op === 's') { res = pAdd(p, q); expr = '\\left(' + pTex(p) + '\\right) + \\left(' + pTex(q) + '\\right)'; }
      else if (op === 'r') { res = pSub(p, q); expr = '\\left(' + pTex(p) + '\\right) - \\left(' + pTex(q) + '\\right)'; }
      else if (op === 'm') { res = pMul(p, q); expr = '\\left(' + pTex(p) + '\\right)\\cdot\\left(' + pTex(q) + '\\right)'; }
      else {
        if (!(n >= 0 && n <= 8)) throw new Error('el exponente n debe ser un entero entre 0 y 8.');
        res = pPow(p, n); expr = '\\left(' + pTex(p) + '\\right)^{' + n + '}';
      }
      var gr = '';
      if (op === 'm') gr = 'grado(P·Q) = ' + pDeg(p) + ' + ' + pDeg(q) + ' = <b>' + pDeg(res) + '</b>';
      else if (op === 'p') gr = 'grado(P<sup>n</sup>) = ' + pDeg(p) + ' · ' + n + ' = <b>' + pDeg(res) + '</b>';
      else gr = 'grado(P) = ' + pDeg(p) + ', grado(Q) = ' + pDeg(q) + ' &rarr; grado del resultado = <b>' + pDeg(res) + '</b>' +
        (pDeg(res) < Math.max(pDeg(p), pDeg(q)) ? ' — ¡se ha perdido grado! Los coeficientes principales se han cancelado.' : '');
      out.innerHTML = '<div class="ap-formula">\\(' + expr + ' = ' + pTex(res) + '\\)</div>' +
        '<p class="ap-note">' + gr + '</p>' +
        '<p class="ap-note">Comprobacion numerica en \\(x=2\\): valor del resultado \\(= ' + rTex(pEval(res, R(2))) + '\\).</p>';
    });
  };

  /* ---------- A5. Division larga ---------- */
  B.division = function (root) {
    root.innerHTML = head('Applet 5 · Division entera de polinomios, paso a paso', [
      'Escribe dividendo y divisor. Ejemplo del libro: <code>x^6-2x^4+3x^3-2x+6</code> entre <code>x-1</code>.',
      'Prueba tambien divisores de grado mayor que 1: <code>x^4-3x^2+2</code> entre <code>x^2-1</code>.',
      'Cada fila muestra el monomio del cociente, el producto que se resta y el nuevo resto parcial. El proceso para cuando grado(resto) &lt; grado(divisor).',
      'Al final se comprueba la <b>identidad de la division</b>: \\(D = d\\cdot c + r\\). Si no se cumpliera, habria un error de calculo.'
    ]) + inputRow([
      { label: 'Dividendo D(x) =', cls: 'inp-p', value: 'x^6-2x^4+3x^3-2x+6', size: 26 },
      { label: 'Divisor d(x) =', cls: 'inp-q', value: 'x-1', size: 14 }
    ], 'Dividir') + '<div class="out"></div>';

    wire(root, function (r, out) {
      var D = parsePoly(val(r, 'inp-p')), d = parsePoly(val(r, 'inp-q'));
      if (pIsZero(d)) throw new Error('el divisor no puede ser 0.');
      var res = pDivMod(D, d);
      var rows = res.steps.map(function (s, i) {
        return '<tr><td>' + (i + 1) + '</td><td>\\(' + pTex(s.before) + '\\)</td><td>\\(' + pTex(s.term) + '\\)</td>' +
          '<td>\\(' + pTex(s.prod) + '\\)</td><td>\\(' + pTex(pSub(s.before, s.prod)) + '\\)</td></tr>';
      }).join('');
      var check = pAdd(pMul(d, res.q), res.r);
      out.innerHTML =
        '<div class="ap-formula">\\(' + pTex(D) + ' \\;=\\; \\left(' + pTex(d) + '\\right)\\cdot\\left(' + pTex(res.q) + '\\right) + \\left(' + pTex(res.r) + '\\right)\\)</div>' +
        '<table class="ap-tbl"><tr><th>Paso</th><th>Resto parcial</th><th>Termino del cociente</th><th>Producto a restar</th><th>Nuevo resto</th></tr>' + rows + '</table>' +
        '<ul class="ap-list"><li>Cociente: \\(c(x) = ' + pTex(res.q) + '\\) (grado ' + pDeg(res.q) + ' = ' + pDeg(D) + ' - ' + pDeg(d) + ')</li>' +
        '<li>Resto: \\(r(x) = ' + pTex(res.r) + '\\) — grado ' + (pIsZero(res.r) ? 'ninguno' : pDeg(res.r)) + ', siempre menor que ' + pDeg(d) + '</li>' +
        '<li>' + (pIsZero(res.r) ? 'La division es <b>exacta</b>: el divisor es un <b>factor</b> del dividendo.' : 'La division <b>no</b> es exacta.') + '</li>' +
        '<li>Verificacion \\(d\\cdot c + r = ' + pTex(check) + '\\) ' + (pEq(check, pTrim(D)) ? '<span class="ap-tick">coincide con D(x)</span>' : '<span class="ap-cross">no coincide</span>') + '</li></ul>';
    });
  };

  /* ---------- A7. Ruffini ---------- */
  B.ruffini = function (root) {
    root.innerHTML = head('Applet 7 · Regla de Ruffini (incluidos los casos dificiles)', [
      'Escribe el polinomio y el numero <b>&alpha;</b> por el que divides. Divides entre <b>x &minus; &alpha;</b>: si quieres dividir entre <b>x + 2</b>, escribe &alpha; = <code>-2</code>.',
      'Ejemplos: <code>x^3-4x^2+5x-2</code> con &alpha; = 1; <code>2x^3-3x^2-11x+6</code> con &alpha; = 1/2; <code>x^4-10x^2+9</code> con &alpha; = 3.',
      'Caso dificil (divisor <b>ax &minus; b</b>): elige el modo no monico. Para dividir <code>2x^3-3x^2-11x+6</code> entre <code>2x-1</code>, usa &alpha; = 1/2 y el applet te muestra como corregir el cociente dividiendo entre 2.',
      'Fijate en la ultima casilla: <b>es el resto</b>, y coincide con <b>P(&alpha;)</b>. Ahi esta el teorema del resto en accion.'
    ]) + inputRow([
      { label: 'P(x) =', cls: 'inp-p', value: '2x^3-3x^2-11x+6', size: 26 },
      { label: '\u03b1 =', cls: 'inp-a', value: '1/2', size: 6 },
      { label: 'Divisor', cls: 'inp-mode', options: [['m', 'x - \u03b1 (monico)'], ['g', 'a x - b (no monico)']] },
      { label: 'a =', cls: 'inp-k', value: '2', size: 4 }
    ], 'Aplicar Ruffini') + '<div class="out"></div>';

    wire(root, function (r, out) {
      var p = parsePoly(val(r, 'inp-p')), a = parseR(val(r, 'inp-a'));
      var mode = val(r, 'inp-mode'), k = parseR(val(r, 'inp-k'));
      var n = pDeg(p);
      if (n < 1) throw new Error('escribe un polinomio de grado 1 o mas.');
      var desc = [], i;
      for (i = n; i >= 0; i--) desc.push(p[i] || R(0));
      var carry = [desc[0]], prods = [null];
      for (i = 1; i < desc.length; i++) {
        var pr = rMul(carry[i - 1], a);
        prods.push(pr);
        carry.push(rAdd(desc[i], pr));
      }
      var rest = carry[carry.length - 1];
      var quo = carry.slice(0, carry.length - 1).reverse();
      var t1 = '<tr><th></th>', t2 = '<tr><th>\\(\\alpha = ' + rTex(a) + '\\)</th>', t3 = '<tr><th></th>';
      for (i = 0; i < desc.length; i++) t1 += '<td>\\(' + rTex(desc[i]) + '\\)</td>';
      for (i = 0; i < desc.length; i++) t2 += '<td>' + (prods[i] ? '\\(' + rTex(prods[i]) + '\\)' : '') + '</td>';
      for (i = 0; i < carry.length; i++) t3 += '<td' + (i === carry.length - 1 ? ' class="ap-hl"' : '') + '>\\(' + rTex(carry[i]) + '\\)</td>';
      var extra = '';
      if (mode === 'g') {
        var quo2 = pScale(quo, rDiv(R(1), k));
        extra = '<div class="ap-warn"><b>Correccion del caso no monico.</b> Al dividir entre \\(' + rTex(k) + 'x - ' + rTex(rMul(k, a)) + '\\) primero se divide entre \\(x-' + rTex(a) + '\\) (Ruffini de arriba) y despues se divide el cociente entre \\(' + rTex(k) + '\\):' +
          '<div class="ap-formula">\\(' + pTex(p) + ' = \\left(' + rTex(k) + 'x - ' + rTex(rMul(k, a)) + '\\right)\\left(' + pTex(quo2) + '\\right) + ' + rTex(rest) + '\\)</div>' +
          'Motivo: \\(ax-b = a\\left(x-\\frac{b}{a}\\right)\\), asi que el factor \\(a\\) hay que compensarlo en el cociente. <b>El resto no cambia.</b></div>';
      }
      out.innerHTML =
        '<table class="ap-tbl ap-ruffini">' + t1 + '</tr>' + t2 + '</tr>' + t3 + '</tr></table>' +
        '<ul class="ap-list">' +
        '<li>Cociente: \\(c(x) = ' + pTex(quo) + '\\)</li>' +
        '<li>Resto: \\(r = ' + rTex(rest) + '\\) y ademas \\(P(' + rTex(a) + ') = ' + rTex(pEval(p, a)) + '\\) &rarr; <b>coinciden</b> (teorema del resto)</li>' +
        '<li>' + (rIsZero(rest)
          ? '\\(\\alpha = ' + rTex(a) + '\\) <b>es raiz</b>, luego \\(' + pTex(p) + ' = \\left(x - ' + rTex(a) + '\\right)\\left(' + pTex(quo) + '\\right)\\)'
          : '\\(\\alpha = ' + rTex(a) + '\\) <b>no es raiz</b>: la division no es exacta y \\((x-' + rTex(a) + ')\\) no es factor.') + '</li></ul>' + extra;
    });
  };

  /* ---------- A6. Teorema del resto y del factor ---------- */
  B.resto = function (root) {
    root.innerHTML = head('Applet 6 · Teorema del resto y teorema del factor', [
      'Escribe \\(P(x)\\) y varios valores de \\(\\alpha\\) separados por comas: <code>-2, -1, 0, 1/2, 3</code>.',
      'Para cada \\(\\alpha\\) el applet calcula \\(P(\\alpha)\\) por sustitucion y el resto de dividir entre \\(x-\\alpha\\) por Ruffini, y los compara.',
      'La columna final indica si \\((x-\\alpha)\\) es factor del polinomio. Ese es el <b>teorema del factor</b>: divisible por \\(x-\\alpha\\) &hArr; \\(\\alpha\\) es raiz.'
    ]) + inputRow([
      { label: 'P(x) =', cls: 'inp-p', value: '2x^3-3x^2-11x+6', size: 26 },
      { label: 'valores de \u03b1:', cls: 'inp-a', value: '-3, -2, -1, 0, 1/2, 1, 3', size: 24 }
    ], 'Comparar') + '<div class="out"></div>';

    wire(root, function (r, out) {
      var p = parsePoly(val(r, 'inp-p'));
      var list = val(r, 'inp-a').split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s !== ''; });
      var rows = list.map(function (s) {
        var a = parseR(s), v = pEval(p, a), dm = pDivMod(p, [rNeg(a), R(1)]);
        return '<tr><td>\\(' + rTex(a) + '\\)</td><td>\\(' + rTex(v) + '\\)</td><td>\\(' + rTex(dm.r[0]) + '\\)</td>' +
          '<td>' + (rIsZero(v) ? '<span class="ap-tick">si, es raiz</span>' : '<span class="ap-cross">no</span>') + '</td>' +
          '<td>' + (rIsZero(v) ? '\\((x-' + rTex(a) + ')\\) es factor' : '—') + '</td></tr>';
      }).join('');
      out.innerHTML = '<div class="ap-formula">\\(P(x) = ' + pTex(p) + '\\)</div>' +
        '<table class="ap-tbl"><tr><th>\\(\\alpha\\)</th><th>\\(P(\\alpha)\\) por sustitucion</th><th>Resto por Ruffini</th><th>¿Raiz?</th><th>Teorema del factor</th></tr>' + rows + '</table>' +
        '<p class="ap-note">Las dos columnas centrales <b>siempre</b> coinciden: eso es exactamente lo que afirma el teorema del resto.</p>';
    });
  };

  /* ---------- A9. Candidatos a raiz ---------- */
  B.raices = function (root) {
    root.innerHTML = head('Applet 9 · Cazador de raices: candidatos racionales', [
      'Escribe un polinomio con coeficientes enteros o fraccionarios: <code>2x^3-3x^2-11x+6</code>, <code>6x^3+7x^2-9x+2</code>, <code>x^3-4x^2+5x-2</code>, <code>x^4-5x^2+6</code>.',
      'El applet calcula los divisores del termino independiente y del coeficiente principal y construye <b>todos</b> los candidatos \\(\\pm p/q\\). Despues prueba uno a uno.',
      'Lee el resultado con ojo critico: la lista de candidatos es una <b>criba</b>, no una garantia. Puede que ninguno sea raiz (por ejemplo en \\(x^2-2\\)).',
      'La grafica marca en rojo los cortes con el eje X. Compara: numero de cortes vs. grado del polinomio.'
    ]) + inputRow([
      { label: 'P(x) =', cls: 'inp-p', value: '2x^3-3x^2-11x+6', size: 28 }
    ], 'Buscar raices') + '<div class="out"></div><canvas class="ap-canvas cv" width="660" height="300"></canvas>';

    wire(root, function (r, out) {
      var p0 = parsePoly(val(r, 'inp-p'));
      if (pDeg(p0) < 1) throw new Error('escribe un polinomio de grado 1 o mas.');
      var c = pContent(p0), p = c.prim, x0 = 0;
      while (p.length > 1 && rIsZero(p[0])) { p = p.slice(1); x0++; }
      var cands = pDeg(p) > 0 ? ratCandidates(p) : [];
      var rows = cands.map(function (a) {
        var v = pEval(p, a);
        return '<tr><td>\\(' + rTex(a) + '\\)</td><td>\\(' + rTex(v) + '\\)</td><td>' +
          (rIsZero(v) ? '<span class="ap-tick">RAIZ</span>' : '<span class="ap-cross">no</span>') + '</td></tr>';
      }).join('');
      var f = factorize(p0), rr = realRootsOf(f);
      var extra = '';
      if (x0 > 0) extra += '<p class="ap-note">El termino independiente era 0: se ha sacado factor comun \\(x^{' + x0 + '}\\), luego <b>x = 0 es raiz</b> con multiplicidad ' + x0 + '.</p>';
      out.innerHTML =
        '<div class="ap-formula">\\(P(x) = ' + pTex(p0) + ' \\;=\\; ' + rTex(c.k) + (x0 ? '\\,x^{' + x0 + '}' : '') + '\\left(' + pTex(p) + '\\right)\\)</div>' + extra +
        '<ul class="ap-list"><li>Termino independiente: \\(a_0 = ' + rTex(p[0]) + '\\) &rarr; divisores: ' + divisors(p[0].n).join(', ') + '</li>' +
        '<li>Coeficiente principal: \\(a_n = ' + rTex(pLead(p)) + '\\) &rarr; divisores: ' + divisors(pLead(p).n).join(', ') + '</li>' +
        '<li>Candidatos: <b>' + cands.length + '</b> valores de la forma \\(\\pm\\frac{p}{q}\\)</li>' +
        '<li>Raices reales localizadas: ' + (rr.length ? rr.map(function (v) { return Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(4); }).join(', ') : 'ninguna') + '</li></ul>' +
        '<table class="ap-tbl"><tr><th>Candidato \\(\\alpha\\)</th><th>\\(P(\\alpha)\\)</th><th>Veredicto</th></tr>' + rows + '</table>';
      plotPoly(r.querySelector('.cv'), [{ p: p0, color: '#2a76dd' }], rr);
    });
  };

  /* ---------- A8. Explorador grafico de raices ---------- */
  B.explorador = function (root) {
    root.innerHTML = head('Applet 8 · Explorador: de las raices a los coeficientes', [
      'Mueve los tres deslizadores: construyes \\(P(x)=a\\,(x-r_1)(x-r_2)(x-r_3)\\) eligiendo tu mismo las raices.',
      'Observa como cambia la forma desarrollada. Comprueba las <b>relaciones de Cardano</b>: la suma de las raices y su producto aparecen en los coeficientes.',
      'Pon dos raices iguales: veras que la grafica <b>toca</b> el eje sin atravesarlo (raiz doble). Con tres iguales vuelve a atravesarlo (raiz triple).',
      'Cambia el signo de \\(a\\): la grafica se refleja, pero las raices no se mueven.'
    ]) +
      '<div class="ap-row"><label>a</label><input type="range" class="sl-a" min="-3" max="3" step="1" value="1">' +
      '<label>r&#8321;</label><input type="range" class="sl-1" min="-4" max="4" step="1" value="-2">' +
      '<label>r&#8322;</label><input type="range" class="sl-2" min="-4" max="4" step="1" value="1">' +
      '<label>r&#8323;</label><input type="range" class="sl-3" min="-4" max="4" step="1" value="3">' +
      '<button class="ap-btn btn-go">Actualizar</button></div>' +
      '<div class="out"></div><canvas class="ap-canvas cv" width="660" height="320"></canvas>';

    var run = function (r, out) {
      var a = parseInt(r.querySelector('.sl-a').value, 10) || 1;
      var r1 = parseInt(r.querySelector('.sl-1').value, 10);
      var r2 = parseInt(r.querySelector('.sl-2').value, 10);
      var r3 = parseInt(r.querySelector('.sl-3').value, 10);
      var p = pScale(pMul(pMul([R(-r1), R(1)], [R(-r2), R(1)]), [R(-r3), R(1)]), R(a));
      var suma = r1 + r2 + r3, prod = r1 * r2 * r3;
      out.innerHTML = '<div class="ap-formula">\\(P(x) = ' + a + '(x-(' + r1 + '))(x-(' + r2 + '))(x-(' + r3 + ')) = ' + pTex(p) + '\\)</div>' +
        '<ul class="ap-list"><li>Suma de raices \\(= ' + suma + '\\) y \\(-a_2/a_3 = ' + (-rNum(p[2] || R(0)) / rNum(pLead(p))).toFixed(4).replace(/\.?0+$/, '') + '\\)</li>' +
        '<li>Producto de raices \\(= ' + prod + '\\) y \\(-a_0/a_3 = ' + (-rNum(p[0]) / rNum(pLead(p))) + '\\) (con signo \\((-1)^3\\))</li>' +
        '<li>Raices distintas: ' + [r1, r2, r3].filter(function (v, i, arr) { return arr.indexOf(v) === i; }).length + ' de 3 &rarr; ' +
        ([r1, r2, r3].filter(function (v, i, arr) { return arr.indexOf(v) === i; }).length < 3 ? 'hay <b>multiplicidad</b>' : 'todas simples') + '</li></ul>';
      plotPoly(r.querySelector('.cv'), [{ p: p, color: '#2a9d8f' }], [r1, r2, r3]);
    };
    root.querySelectorAll('input[type=range]').forEach(function (s) {
      s.addEventListener('input', function () { var out = root.querySelector('.out'); run(root, out); mj(out); });
    });
    wire(root, run);
  };

  /* ---------- A10. Factorizacion completa ---------- */
  B.factoriza = function (root) {
    root.innerHTML = head('Applet 10 · Factorizacion completa con estrategia', [
      'Escribe el polinomio: <code>x^3+5x^2-x-5</code>, <code>x^3-4x^2+5x-2</code>, <code>2x^3-3x^2-11x+6</code>, <code>x^4-2x^3-8x^2+18x-9</code>, <code>x^4-5x^2+6</code>, <code>3x^4-3x^2</code>.',
      'El applet aplica la estrategia del tema: factor comun &rarr; identidades &rarr; Ruffini con candidatos racionales &rarr; grado 2 con la formula.',
      'Se muestran dos escrituras: con factores <b>monicos</b> \\((x-\\frac{1}{2})\\) y con factores <b>enteros</b> \\((2x-1)\\). Ambas son correctas; la segunda es la habitual en los libros.',
      'Si aparece un factor de grado 2 irreducible, lee el discriminante: si es negativo no hay raices reales; si es positivo pero no cuadrado perfecto, las raices son irracionales.'
    ]) + inputRow([
      { label: 'P(x) =', cls: 'inp-p', value: 'x^4-2x^3-8x^2+18x-9', size: 30 }
    ], 'Factorizar') + '<div class="out"></div><canvas class="ap-canvas cv" width="660" height="300"></canvas>';

    wire(root, function (r, out) {
      var p = parsePoly(val(r, 'inp-p'));
      if (pIsZero(p)) throw new Error('el polinomio nulo no se factoriza.');
      var f = factorize(p), rebuilt = factorRebuild(f);
      var det = '';
      if (f.xmult) det += '<li>Factor comun: \\(x^{' + f.xmult + '}\\) &rarr; raiz \\(x=0\\) con multiplicidad ' + f.xmult + '</li>';
      f.linear.forEach(function (L) {
        det += '<li>Raiz \\(x = ' + rTex(L.root) + '\\), multiplicidad <b>' + L.mult + '</b> &rarr; factor \\(' + powTex('(x - ' + rTex(L.root) + ')', L.mult) + '\\)' +
          (L.mult % 2 === 0 ? ' — la grafica <b>toca</b> el eje y rebota' : ' — la grafica <b>atraviesa</b> el eje') + '</li>';
      });
      f.quads.forEach(function (q) {
        det += '<li>Factor de grado 2: \\(' + pTex(q.poly) + '\\), discriminante \\(\\Delta = ' + rTex(q.disc) + '\\) &rarr; ' +
          (q.discNum < 0 ? '<b>irreducible</b> en los numeros reales (no corta el eje X)'
            : 'dos raices <b>irracionales</b>: \\(x \\approx ' + q.roots.map(function (v) { return v.toFixed(4); }).join('\\) y \\(x \\approx ') + '\\)') + '</li>';
      });
      if (f.leftover) det += '<li><b>Queda sin factorizar</b>: \\(' + pTex(f.leftover) + '\\). No tiene raices racionales y su grado supera las herramientas del curso.</li>';
      var suma = f.linear.reduce(function (ac, L) { return ac + rNum(L.root) * L.mult; }, 0) + 0;
      out.innerHTML =
        '<div class="ap-formula">\\(' + pTex(p) + ' = ' + factorTex(f, 'entero') + '\\)</div>' +
        '<p class="ap-note">Con factores monicos: \\(' + pTex(p) + ' = ' + factorTex(f, 'monic') + '\\)</p>' +
        '<ul class="ap-list">' + det +
        '<li>Grado ' + pDeg(p) + ' &rarr; como maximo ' + pDeg(p) + ' raices reales; localizadas (contando multiplicidad): ' +
        (f.xmult + f.linear.reduce(function (a, L) { return a + L.mult; }, 0) + f.quads.reduce(function (a, q) { return a + q.roots.length; }, 0)) + '</li>' +
        '<li>Verificacion: al multiplicar los factores se obtiene \\(' + pTex(rebuilt) + '\\) ' +
        (pEq(rebuilt, pTrim(p)) ? '<span class="ap-tick">identico al original</span>' : '<span class="ap-cross">revisar</span>') + '</li></ul>';
      plotPoly(r.querySelector('.cv'), [{ p: p, color: '#8e44ad' }], realRootsOf(f));
    });
  };

  /* ---------- A11. MCD y mcm ---------- */
  B.mcdmcm = function (root) {
    root.innerHTML = head('Applet 11 · Maximo comun divisor y minimo comun multiplo de polinomios', [
      'Escribe dos polinomios: <code>x^3-x</code> y <code>x^2-2x+1</code>; o <code>x^2-4</code> y <code>x^2+4x+4</code>.',
      'El applet factoriza cada uno, toma los factores <b>comunes</b> (mcd) y <b>todos</b> con el mayor exponente (mcm), como con los numeros.',
      'El mcm es la clave para sumar fracciones algebraicas: es el <b>minimo comun denominador</b>.',
      'Pensamiento critico: el mcd y el mcm de polinomios estan definidos salvo un factor numerico. Aqui se muestran monicos o con coeficientes enteros minimos.'
    ]) + inputRow([
      { label: 'A(x) =', cls: 'inp-p', value: 'x^3-x', size: 20 },
      { label: 'B(x) =', cls: 'inp-q', value: 'x^2-2x+1', size: 20 }
    ], 'Calcular mcd y mcm') + '<div class="out"></div>';

    wire(root, function (r, out) {
      var A = parsePoly(val(r, 'inp-p')), Bp = parsePoly(val(r, 'inp-q'));
      if (pIsZero(A) || pIsZero(Bp)) throw new Error('ninguno de los dos puede ser el polinomio nulo.');
      var g = pGcd(A, Bp), l = pLcm(A, Bp);
      var fa = factorize(A), fb = factorize(Bp), fg = factorize(g), fl = factorize(l);
      out.innerHTML =
        '<ul class="ap-list">' +
        '<li>\\(A(x) = ' + pTex(A) + ' = ' + factorTex(fa, 'entero') + '\\)</li>' +
        '<li>\\(B(x) = ' + pTex(Bp) + ' = ' + factorTex(fb, 'entero') + '\\)</li></ul>' +
        '<div class="ap-formula">\\(\\text{mcd}(A,B) = ' + pTex(g) + ' = ' + factorTex(fg, 'entero') + '\\)</div>' +
        '<div class="ap-formula">\\(\\text{mcm}(A,B) = ' + pTex(l) + ' = ' + factorTex(fl, 'entero') + '\\)</div>' +
        '<p class="ap-note">Comprobacion de la propiedad \\(A\\cdot B = \\text{mcd}\\cdot\\text{mcm}\\) (salvo constante): \\(A\\cdot B = ' + pTex(pMul(A, Bp)) + '\\), \\(\\;\\text{mcd}\\cdot\\text{mcm} = ' + pTex(pMul(g, l)) + '\\).</p>';
    });
  };

  /* ---------- A14. Simplificar fracciones algebraicas ---------- */
  B.fracsimplifica = function (root) {
    root.innerHTML = head('Applet 14 · Laboratorio de simplificacion de fracciones algebraicas', [
      'Escribe numerador y denominador. Ejemplos: <code>x^3-3x^2+2x</code> y <code>x^3-x</code>; <code>x^2-4</code> y <code>x^2-4x+4</code>; <code>x^2+2x+1</code> y <code>x+1</code>.',
      'El applet factoriza los dos, cancela los factores comunes y, muy importante, muestra los <b>valores prohibidos</b> del denominador ORIGINAL.',
      'Compara los valores de la fraccion inicial y de la simplificada en la tabla: coinciden en todos los puntos... menos en los valores prohibidos, donde la inicial no existe.',
      'Aviso: solo se cancelan <b>factores</b>, nunca sumandos. Prueba <code>x+2</code> entre <code>x</code> y comprueba que no se puede tachar la x.'
    ]) + inputRow([
      { label: 'P(x) =', cls: 'inp-p', value: 'x^3-3x^2+2x', size: 22 },
      { label: 'Q(x) =', cls: 'inp-q', value: 'x^3-x', size: 22 }
    ], 'Simplificar') + '<div class="out"></div>';

    wire(root, function (r, out) {
      var P = parsePoly(val(r, 'inp-p')), Q = parsePoly(val(r, 'inp-q'));
      if (pIsZero(Q)) throw new Error('el denominador no puede ser 0.');
      var s = fracSimplify(P, Q);
      var fP = factorize(P), fQ = factorize(Q), fN = factorize(s.num), fD = factorize(s.den);
      var forb = realRootsOf(fQ);
      var xs = [-2, -1, 0, 1, 2, 3], rows = '';
      xs.forEach(function (v) {
        var vq = pEval(Q, R(v)), vd = pEval(s.den, R(v));
        rows += '<tr><td>' + v + '</td>' +
          '<td>' + (rIsZero(vq) ? '<span class="ap-cross">no existe</span>' : '\\(' + rTex(rDiv(pEval(P, R(v)), vq)) + '\\)') + '</td>' +
          '<td>' + (rIsZero(vd) ? '<span class="ap-cross">no existe</span>' : '\\(' + rTex(rDiv(pEval(s.num, R(v)), vd)) + '\\)') + '</td></tr>';
      });
      out.innerHTML =
        '<div class="ap-formula">\\(\\dfrac{' + pTex(P) + '}{' + pTex(Q) + '} = \\dfrac{' + factorTex(fP, 'entero') + '}{' + factorTex(fQ, 'entero') + '} = \\dfrac{' + factorTex(fN, 'entero') + '}{' + factorTex(fD, 'entero') + '} = \\dfrac{' + pTex(s.num) + '}{' + pTex(s.den) + '}\\)</div>' +
        '<ul class="ap-list">' +
        '<li>Factor cancelado (mcd): \\(' + pTex(s.gcd) + '\\)' + (pDeg(s.gcd) === 0 ? ' &rarr; <b>la fraccion ya era irreducible</b>' : '') + '</li>' +
        '<li>Valores prohibidos del denominador original: ' + (forb.length ? '\\(x = ' + forb.map(function (v) { return Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(4); }).join('\\), \\(x = ') + '\\)' : 'ninguno real') + '</li>' +
        '<li>Dominio: todos los reales excepto esos valores. La expresion simplificada es equivalente <b>solo</b> en el dominio comun.</li></ul>' +
        '<table class="ap-tbl"><tr><th>x</th><th>Fraccion original</th><th>Fraccion simplificada</th></tr>' + rows + '</table>';
    });
  };

  /* ---------- A15. Operar con fracciones algebraicas ---------- */
  B.fracopera = function (root) {
    root.innerHTML = head('Applet 15 · Suma, resta, producto y cociente de fracciones algebraicas', [
      'Escribe las dos fracciones por separado (numeradores y denominadores) y elige la operacion.',
      'Ejemplos preparados: \\(\\frac{2}{x^2-4}+\\frac{1}{x+2}\\) da \\(\\frac{x}{(x-2)(x+2)}\\); \\(\\frac{x^2-1}{x^2+2x}\\cdot\\frac{x+2}{x-1}\\) da \\(\\frac{x+1}{x}\\).',
      'El applet muestra el <b>minimo comun denominador</b>, la operacion sin simplificar y el resultado simplificado con su dominio.',
      'En el cociente recuerda: se multiplica por la inversa, y aparecen restricciones nuevas porque el numerador de la segunda fraccion pasa al denominador.'
    ]) + inputRow([
      { label: 'P&#8321; =', cls: 'inp-p1', value: '2', size: 12 },
      { label: 'Q&#8321; =', cls: 'inp-q1', value: 'x^2-4', size: 14 },
      { label: 'op', cls: 'inp-op', options: [['s', '+'], ['r', '-'], ['m', '\u00d7'], ['d', '\u00f7']] },
      { label: 'P&#8322; =', cls: 'inp-p2', value: '1', size: 12 },
      { label: 'Q&#8322; =', cls: 'inp-q2', value: 'x+2', size: 14 }
    ], 'Operar') + '<div class="out"></div>';

    wire(root, function (r, out) {
      var P1 = parsePoly(val(r, 'inp-p1')), Q1 = parsePoly(val(r, 'inp-q1'));
      var P2 = parsePoly(val(r, 'inp-p2')), Q2 = parsePoly(val(r, 'inp-q2'));
      var op = val(r, 'inp-op');
      if (pIsZero(Q1) || pIsZero(Q2)) throw new Error('los denominadores no pueden ser 0.');
      var num, den, pasos = '';
      if (op === 's' || op === 'r') {
        var L = pLcm(Q1, Q2);
        var f1 = pDivMod(L, Q1).q, f2 = pDivMod(L, Q2).q;
        num = op === 's' ? pAdd(pMul(P1, f1), pMul(P2, f2)) : pSub(pMul(P1, f1), pMul(P2, f2));
        den = L;
        pasos = '<li>Minimo comun denominador: \\(' + pTex(L) + ' = ' + factorTex(factorize(L), 'entero') + '\\)</li>' +
          '<li>Se multiplica la 1&#170; fraccion por \\(' + pTex(f1) + '\\) y la 2&#170; por \\(' + pTex(f2) + '\\)</li>' +
          '<li>Numerador sin simplificar: \\(' + pTex(num) + '\\)</li>';
      } else if (op === 'm') {
        num = pMul(P1, P2); den = pMul(Q1, Q2);
        pasos = '<li>Producto directo: numerador por numerador, denominador por denominador.</li>';
      } else {
        if (pIsZero(P2)) throw new Error('no se puede dividir entre una fraccion cuyo numerador es 0.');
        num = pMul(P1, Q2); den = pMul(Q1, P2);
        pasos = '<li>Cociente = producto por la inversa: \\(\\frac{P_1}{Q_1}\\cdot\\frac{Q_2}{P_2}\\). Ahora \\(P_2\\) esta en el denominador, asi que sus raices tambien quedan excluidas.</li>';
      }
      var s = fracSimplify(num, den);
      var forb = realRootsOf(factorize(den));
      var simb = { s: '+', r: '-', m: '\\cdot', d: ':' }[op];
      out.innerHTML =
        '<div class="ap-formula">\\(\\dfrac{' + pTex(P1) + '}{' + pTex(Q1) + '} ' + simb + ' \\dfrac{' + pTex(P2) + '}{' + pTex(Q2) + '} = \\dfrac{' + pTex(num) + '}{' + pTex(den) + '} = \\dfrac{' + pTex(s.num) + '}{' + pTex(s.den) + '}\\)</div>' +
        '<p class="ap-note">Resultado con el denominador factorizado: \\(\\dfrac{' + factorTex(factorize(s.num), 'entero') + '}{' + factorTex(factorize(s.den), 'entero') + '}\\)</p>' +
        '<ul class="ap-list">' + pasos +
        '<li>Valores excluidos durante todo el proceso: ' + (forb.length ? '\\(x = ' + forb.map(function (v) { return Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(4); }).join('\\), \\(x = ') + '\\)' : 'ninguno real') + '</li>' +
        '<li>Control numerico en \\(x = 5\\): resultado \\(= ' + (function () {
          try { return rTex(rDiv(pEval(s.num, R(5)), pEval(s.den, R(5)))); } catch (e) { return '\\text{no definido}'; }
        })() + '\\)</li></ul>';
    });
  };

  /* ---------- A13. Tabla de signos ---------- */
  B.signo = function (root) {
    root.innerHTML = head('Applet 13 · Tabla de signos: de la factorizacion a la inecuacion', [
      'Escribe una expresion factorizable en el numerador y, si quieres, un denominador. Ejemplos: numerador <code>x^2-x-6</code> con denominador <code>1</code>; numerador <code>x^3-4x</code> con denominador <code>x-1</code>.',
      'El applet localiza los ceros del numerador (donde la expresion vale 0) y los del denominador (donde <b>no existe</b>), ordena todos esos puntos y estudia el signo en cada intervalo.',
      'Usalo para resolver inecuaciones: la solucion de \\(>0\\) son los intervalos con signo +, y la de \\(<0\\) los de signo -. Ojo con incluir o no los extremos.',
      'Error clasico que aqui se ve muy bien: en una inecuacion racional <b>no</b> se pueden "quitar denominadores" multiplicando, porque el signo del denominador puede cambiar la desigualdad.'
    ]) + inputRow([
      { label: 'Numerador:', cls: 'inp-p', value: 'x^3-4x', size: 20 },
      { label: 'Denominador:', cls: 'inp-q', value: 'x-1', size: 16 }
    ], 'Estudiar el signo') + '<div class="out"></div><canvas class="ap-canvas cv" width="660" height="300"></canvas>';

    wire(root, function (r, out) {
      var P = parsePoly(val(r, 'inp-p')), Q = parsePoly(val(r, 'inp-q'));
      if (pIsZero(Q)) throw new Error('el denominador no puede ser 0.');
      var zN = realRootsOf(factorize(P)), zD = realRootsOf(factorize(Q));
      var pts = zN.concat(zD).sort(function (a, b) { return a - b; })
        .filter(function (v, i, a) { return i === 0 || Math.abs(v - a[i - 1]) > 1e-9; });
      var bounds = [-Infinity].concat(pts, [Infinity]), cells = '', headr = '';
      for (var i = 0; i < bounds.length - 1; i++) {
        var lo = bounds[i], hi = bounds[i + 1];
        var mid = (lo === -Infinity) ? hi - 1 : (hi === Infinity ? lo + 1 : (lo + hi) / 2);
        var vn = pEvalNum(P, mid), vd = pEvalNum(Q, mid), v = vn / vd;
        var lab = '(' + (lo === -Infinity ? '-\\infty' : (Math.abs(lo - Math.round(lo)) < 1e-9 ? Math.round(lo) : lo.toFixed(3))) + ', ' +
          (hi === Infinity ? '+\\infty' : (Math.abs(hi - Math.round(hi)) < 1e-9 ? Math.round(hi) : hi.toFixed(3))) + ')';
        headr += '<th>\\(' + lab + '\\)</th>';
        cells += '<td class="' + (v > 0 ? 'ap-pos' : 'ap-neg') + '">' + (v > 0 ? '+' : '-') + '</td>';
      }
      function fmt(v) { return Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(4); }
      out.innerHTML =
        '<div class="ap-formula">\\(f(x) = \\dfrac{' + factorTex(factorize(P), 'entero') + '}{' + factorTex(factorize(Q), 'entero') + '}\\)</div>' +
        '<table class="ap-tbl"><tr><th>Intervalo</th>' + headr + '</tr><tr><td>Signo de f</td>' + cells + '</tr></table>' +
        '<ul class="ap-list">' +
        '<li>Ceros (f = 0): ' + (zN.length ? zN.map(fmt).join(', ') : 'ninguno') + '</li>' +
        '<li>Puntos donde f no existe: ' + (zD.length ? zD.map(fmt).join(', ') : 'ninguno') + '</li>' +
        '<li>Solucion de \\(f(x) > 0\\): union de los intervalos marcados con +. Para \\(f(x) \\geq 0\\) se añaden los ceros del numerador, <b>nunca</b> los del denominador.</li></ul>';
      plotPoly(r.querySelector('.cv'), [{ p: P, color: '#2a76dd' }, { p: Q, color: '#f4a261' }], pts);
    });
  };

  /* ---------- A16. Detector de errores ---------- */
  B.errores = function (root) {
    var items = [
      { q: 'Al desarrollar: \\((x+3)^2 = x^2+9\\)', bad: true, why: 'Falta el doble producto: \\((x+3)^2=x^2+6x+9\\). Comprueba con \\(x=1\\): \\(16 \\neq 10\\).' },
      { q: 'Si \\(P(2)=0\\), entonces \\((x-2)\\) divide a \\(P(x)\\)', bad: false, why: 'Correcto: es el teorema del factor, consecuencia directa del teorema del resto.' },
      { q: 'Simplificacion: \\(\\dfrac{x+2}{x}= 2\\) tachando las x', bad: true, why: 'Solo se cancelan factores, no sumandos. \\(x+2\\) no tiene a x como factor. Con \\(x=1\\): \\(3 \\neq 2\\).' },
      { q: 'El polinomio \\(x^2+1\\) es irreducible en los numeros reales', bad: false, why: 'Correcto: su discriminante es \\(-4 < 0\\), no tiene raices reales y no se puede descomponer en factores reales de grado 1.' },
      { q: 'Al sumar dos polinomios de grado 3 el resultado tiene siempre grado 3', bad: true, why: 'Puede bajar si los coeficientes principales son opuestos: \\((3x^3+4x^2-1)+(-3x^3+5x-3)=4x^2+5x-4\\), de grado 2. Lo que nunca puede es subir.' },
      { q: 'Las raices enteras de \\(2x^3-3x^2-11x+6\\) hay que buscarlas entre los divisores de 6', bad: false, why: 'Correcto: las raices enteras dividen al termino independiente. Y las racionales son \\(\\pm p/q\\) con p divisor de 6 y q divisor de 2, lo que explica la raiz \\(1/2\\).' },
      { q: 'De \\(\\dfrac{1}{x-1} > 0\\) se deduce, multiplicando por \\(x-1\\), que \\(1>0\\), asi que vale cualquier x', bad: true, why: 'Al multiplicar por \\(x-1\\) no sabemos su signo, y si es negativo la desigualdad cambia de sentido. La solucion real es \\(x>1\\).' },
      { q: 'Un polinomio de grado 5 tiene como maximo 5 raices reales', bad: false, why: 'Correcto: por el teorema fundamental del algebra tiene 5 raices complejas; las no reales van por parejas conjugadas, asi que las reales son a lo sumo 5.' },
      { q: '\\(\\sqrt{x^2-9} = x-3\\)', bad: true, why: 'No hay ninguna identidad que permita eso: \\(x^2-9=(x-3)(x+3)\\) y la raiz no se reparte en sumas. Con \\(x=5\\): \\(4 \\neq 2\\).' },
      { q: 'La fraccion \\(\\dfrac{x^2-1}{x-1}\\) es igual a \\(x+1\\) para todo x distinto de 1', bad: false, why: 'Correcto, y la precision "distinto de 1" es imprescindible: en \\(x=1\\) la fraccion no existe aunque \\(x+1\\) si.' }
    ];
    var html = head('Applet 16 · Detector de errores (pensamiento critico)', [
      'Para cada afirmacion decide si es <b>correcta</b> o contiene un <b>error</b>, pulsando el boton correspondiente.',
      'Tras responder aparece la justificacion. Cuando puedas, comprueba el error <b>evaluando en un numero</b>: es la tecnica mas rapida para desmontar una identidad falsa.',
      'Objetivo: aprender a dudar de las manipulaciones automaticas y validar siempre con un contraejemplo.'
    ]) + '<div class="ap-quiz">';
    items.forEach(function (it, i) {
      html += '<div class="ap-qitem" data-bad="' + it.bad + '" data-i="' + i + '">' +
        '<div class="ap-qtext">' + (i + 1) + '. ' + it.q + '</div>' +
        '<button class="ap-btn ap-small" data-ans="ok">Es correcta</button> ' +
        '<button class="ap-btn ap-small" data-ans="bad">Hay un error</button>' +
        '<div class="ap-qfb"></div></div>';
    });
    html += '</div><div class="out"></div>';
    root.innerHTML = html;
    root.querySelectorAll('.ap-qitem').forEach(function (node) {
      var i = parseInt(node.getAttribute('data-i'), 10);
      var bad = node.getAttribute('data-bad') === 'true';
      node.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          var said = b.getAttribute('data-ans') === 'bad';
          var fb = node.querySelector('.ap-qfb');
          fb.className = 'ap-qfb ' + (said === bad ? 'ap-ok' : 'ap-err');
          fb.innerHTML = (said === bad ? '<b>Bien razonado.</b> ' : '<b>No es asi.</b> ') + items[i].why;
          mj(fb);
        });
      });
    });
    mj(root);
  };

  /* =============== 6. Arranque =============== */
  function boot() {
    var nodes = document.querySelectorAll('[data-applet]');
    Array.prototype.forEach.call(nodes, function (node) {
      var key = node.getAttribute('data-applet');
      node.classList.add('applet');
      if (B[key]) {
        try { B[key](node); mj(node); }
        catch (e) { node.innerHTML = errBox('fallo al construir el applet "' + key + '": ' + e.message); }
      } else {
        node.innerHTML = errBox('no existe ningun applet con la clave "' + key + '".');
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* API publica para consola y para tests rapidos en clase */
  window.POLY = {
    parse: parsePoly, tex: pTex, add: pAdd, sub: pSub, mul: pMul, divmod: pDivMod,
    eval: pEval, factorize: factorize, factorTex: factorTex, gcd: pGcd, lcm: pLcm,
    simplifyFraction: fracSimplify, R: R
  };
})();
