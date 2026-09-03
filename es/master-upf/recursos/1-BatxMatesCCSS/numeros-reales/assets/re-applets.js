/* =====================================================================
   re-applets.js · Tema 1 Números reales · 1.º Bachillerato Mates CCSS
   Ruta: 1-BatxMatesCCSS/numeros-reales/assets/re-applets.js

   NÚCLEO del tema. Misma arquitectura que el motor de Estadística
   (est3-applets.js de Combinatoria): un núcleo con utilidades y tres
   módulos que registran los applets.

   API pública: window.RE
     .registry            mapa clave -> función montadora
     .shell(...)          armazón estándar de applet (título, ayuda,
                          controles, escenarios y salida reactiva)
     .tex .K .KD .texifica          KaTeX local sobre nodos data-tex
     .esc .fmt .nc .kf .mil .milTex .sig  formato de números
     .entero .real .fraccionTxt .listaReales   validación de entradas
     .Frac                 fracciones exactas con BigInt
     .mcd .mcm .factoriza .esCuadradoPerfecto
     .decimalDeFraccion    división larga con detección de periodo
     .fraccionDeDecimal    paso de decimal exacto o periódico a fracción
     .raizContinua         aproximaciones racionales de una raíz
     .notCient .normalizaNC .opNC        notación científica
     .redondea .trunca .errAbs .errRel .cotaErr .cifrasSig
     .simplificaRadical .radTex .sumaRadicales .racionaliza
     .logb .logProp
     .svgWrap .txt .line .rect .circle .path .poly .leyenda .COL
     .rectaReal .ejes                    figuras SVG reutilizables
     .resultado .badge .kvs .tabla
     .log                  pila de errores por applet
     .extraA .extraB .extraC   true cuando cada módulo se ha cargado

   Toda la aritmética con fracciones usa BigInt: así 1/7, 355/113 o
   los denominadores que salen al pasar un periódico a fracción son
   exactos, sin errores de coma flotante.

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
     4 · decimal <-> fracción, con periodo exacto
     ================================================================== */
  /* División larga de a/b con detección de anteperiodo y periodo.
     Devuelve { signo, ent, antip, per, pasos, tipo } donde tipo es
     'entero', 'exacto', 'puro' o 'mixto'.                            */
  function decimalDeFraccion(a, b, tope) {
    tope = tope || 40;
    var signo = (a < 0) !== (b < 0) ? -1 : 1;
    a = Math.abs(a); b = Math.abs(b);
    if (b === 0) throw Error('El denominador no puede ser 0.');
    var ent = Math.floor(a / b), r = a % b;
    var cifras = [], pasos = [], vistos = {}, inicio = -1, k = 0;
    while (r !== 0 && k < tope) {
      if (vistos[r] !== undefined) { inicio = vistos[r]; break; }
      vistos[r] = k;
      var num = r * 10, c = Math.floor(num / b);
      pasos.push({ resto: r, num: num, cifra: c, nuevo: num - c * b });
      cifras.push(c);
      r = num - c * b;
      k++;
    }
    var antip = '', per = '', tipo;
    if (r === 0 && inicio < 0) {
      antip = cifras.join('');
      tipo = antip ? 'exacto' : 'entero';
    } else if (inicio === 0) {
      per = cifras.join(''); tipo = 'puro';
    } else if (inicio > 0) {
      antip = cifras.slice(0, inicio).join('');
      per = cifras.slice(inicio).join('');
      tipo = 'mixto';
    } else {
      antip = cifras.join(''); tipo = 'truncado';
    }
    return { signo: signo, ent: ent, antip: antip, per: per, pasos: pasos, tipo: tipo };
  }
  /* Cadena legible:  3,4\overline{27}  */
  function decimalTex(d) {
    var s = (d.signo < 0 ? '-' : '') + d.ent;
    if (d.antip || d.per) s += '{,}' + d.antip + (d.per ? '\\overline{' + d.per + '}' : '');
    if (d.tipo === 'truncado') s += '\\ldots';
    return s;
  }
  function decimalTxt(d, rep) {
    rep = rep || 2;
    var s = (d.signo < 0 ? '-' : '') + d.ent;
    if (d.antip || d.per) {
      s += ',' + d.antip;
      if (d.per) { for (var i = 0; i < rep; i++) s += d.per; s += '…'; }
    }
    return s;
  }

  /* Decimal exacto o periódico -> fracción irreducible.
     ent: parte entera (número), antip y per: cadenas de cifras.
     Fórmula del generatriz:  (ent·antip·per − ent·antip) / (9…9 0…0)  */
  function fraccionDeDecimal(signo, ent, antip, per) {
    antip = String(antip || '').replace(/\D/g, '');
    per = String(per || '').replace(/\D/g, '');
    var todo = String(ent) + antip + per;
    var sin = String(ent) + antip;
    var num = BigInt(todo) - BigInt(sin);
    var den = BigInt('9'.repeat(per.length) + '0'.repeat(antip.length) || '1');
    if (den === 0n) den = 1n;
    var f = new Frac((signo < 0 ? -1n : 1n) * num, den);
    return { frac: f, num: num, den: den, todo: todo, sin: sin };
  }

  /* Aproximaciones racionales por fracción continua: útil para ver que
     los irracionales se «aprietan» entre racionales cada vez mejores. */
  function raizContinua(x, pasos) {
    pasos = pasos || 6;
    var h1 = 1, h0 = 0, k1 = 0, k0 = 1, y = x, out = [];
    for (var i = 0; i < pasos; i++) {
      var a = Math.floor(y);
      var h = a * h1 + h0, k = a * k1 + k0;
      h0 = h1; h1 = h; k0 = k1; k1 = k;
      out.push({ a: a, p: h, q: k, val: h / k, err: Math.abs(h / k - x) });
      var f = y - a;
      if (f < 1e-12) break;
      y = 1 / f;
    }
    return out;
  }

  /* ==================================================================
     5 · notación científica
     ================================================================== */
  /* Descompone x en mantisa (1 <= |m| < 10) y exponente entero. */
  function notCient(x, dec) {
    if (x === 0) return { m: 0, e: 0, tex: '0' };
    var e = Math.floor(Math.log10(Math.abs(x)));
    var m = x / Math.pow(10, e);
    if (Math.abs(m) >= 10) { m /= 10; e++; }
    if (Math.abs(m) < 1) { m *= 10; e--; }
    if (dec !== undefined) m = Number(m.toFixed(dec));
    return { m: m, e: e, tex: kf(m, dec === undefined ? 6 : dec) + ' \\cdot 10^{' + e + '}' };
  }
  /* Acepta "3,4e5", "3,4·10^5", "3.4 x 10^5", "0,00072" y normaliza. */
  function normalizaNC(txt) {
    var s = String(txt || '').trim().toLowerCase().replace(/\s|·|×|x/g, '').replace(',', '.');
    if (!s) throw Error('Escribe un número. Formatos válidos: 3,45e8 · 3,45*10^8 · 0,00072');
    /* Solo se traduce la parte «·10^n» del final, nunca un 10 que forme
       parte de la mantisa (9,109e-31 debe quedarse como está). */
    if (s.indexOf('e') < 0 && (s.indexOf('^') >= 0 || s.indexOf('*') >= 0)) {
      s = s.replace(/^(.*?)\*?10\^?([+-]?\d+)$/, function (_, mant, ex) {
        return (mant === '' || mant === '+' || mant === '-' ? mant + '1' : mant) + 'e' + ex;
      });
    }
    var m = s.match(/^([+-]?\d*\.?\d+)(?:e([+-]?\d+))?$/);
    if (!m) throw Error('No entiendo «' + txt + '». Escríbelo así: 3,45e8 (mantisa, la letra e y el exponente) o 0,00072');
    var x = Number(m[1]) * Math.pow(10, m[2] ? Number(m[2]) : 0);
    if (!Number.isFinite(x)) throw Error('El número es demasiado grande para el applet.');
    return { x: x, mant: Number(m[1]), exp: m[2] ? Number(m[2]) : 0, nc: notCient(x) };
  }
  /* Operación con dos números en notación científica, con los pasos. */
  function opNC(A, B, op, dec) {
    dec = dec === undefined ? 4 : dec;
    var a = notCient(A), b = notCient(B), pasos = [], x;
    if (op === '*') {
      x = A * B;
      pasos.push('Se multiplican las mantisas y se suman los exponentes: $(' +
        kf(a.m, dec) + ' \\cdot ' + kf(b.m, dec) + ') \\cdot 10^{' + a.e + '+' + b.e + '} = ' +
        kf(a.m * b.m, dec) + ' \\cdot 10^{' + (a.e + b.e) + '}$');
    } else if (op === '/') {
      if (B === 0) throw Error('No se puede dividir entre 0.');
      x = A / B;
      pasos.push('Se dividen las mantisas y se restan los exponentes: $(' +
        kf(a.m, dec) + ' : ' + kf(b.m, dec) + ') \\cdot 10^{' + a.e + '-(' + b.e + ')} = ' +
        kf(a.m / b.m, dec) + ' \\cdot 10^{' + (a.e - b.e) + '}$');
    } else {
      var E = Math.max(a.e, b.e);
      var ma = A / Math.pow(10, E), mb = B / Math.pow(10, E);
      x = op === '+' ? A + B : A - B;
      pasos.push('Antes de sumar o restar hay que igualar exponentes. Se toma el mayor, $10^{' + E + '}$:');
      pasos.push('$' + kf(ma, dec + 2) + ' \\cdot 10^{' + E + '} ' + (op === '+' ? '+' : '-') + ' ' +
        kf(mb, dec + 2) + ' \\cdot 10^{' + E + '} = ' + kf(op === '+' ? ma + mb : ma - mb, dec + 2) +
        ' \\cdot 10^{' + E + '}$');
    }
    var fin = notCient(x, dec);
    if (Math.abs(fin.m) !== 0 && (Math.abs(fin.m) < 1 || Math.abs(fin.m) >= 10)) fin = notCient(x, dec);
    pasos.push('Se ajusta la mantisa al intervalo $[1,10)$: $' + fin.tex + '$');
    return { x: x, res: fin, pasos: pasos };
  }

  /* ==================================================================
     6 · aproximaciones, errores y cotas
     ================================================================== */
  function redondea(x, dec) { var p = Math.pow(10, dec); return Math.round(Math.abs(x) * p) / p * Math.sign(x || 1); }
  function trunca(x, dec) { var p = Math.pow(10, dec); return Math.trunc(x * p) / p; }
  function errAbs(exacto, aprox) { return Math.abs(exacto - aprox); }
  function errRel(exacto, aprox) {
    if (exacto === 0) return Infinity;
    return Math.abs(exacto - aprox) / Math.abs(exacto);
  }
  /* Cota de error de una aproximación con d decimales:
     redondeo -> media unidad del último orden; truncamiento -> una unidad */
  function cotaErr(dec, modo) {
    var u = Math.pow(10, -dec);
    return modo === 'trunca' ? u : u / 2;
  }
  /* Número de cifras significativas de una representación decimal */
  function cifrasSig(txt) {
    var s = String(txt).replace(/\s/g, '').replace('.', ',').replace('-', '');
    var p = s.split(',');
    var ent = p[0].replace(/^0+/, ''), dec = p[1] || '';
    if (ent) return (ent + dec).replace(/0+$/, dec ? '' : '').length || 1;
    return dec.replace(/^0+/, '').length || 1;
  }
  /* Propagación de cotas en suma, resta, producto y cociente */
  function propaga(a, ea, b, eb, op) {
    if (op === '+' || op === '-') {
      return { val: op === '+' ? a + b : a - b, cota: ea + eb,
        regla: 'En la suma y en la resta las cotas de error absoluto se suman: $\\varepsilon \\le \\varepsilon_a + \\varepsilon_b$.' };
    }
    if (op === '*') {
      return { val: a * b, cota: Math.abs(a) * eb + Math.abs(b) * ea + ea * eb,
        regla: 'En el producto se suman los errores relativos: $\\varepsilon_r \\le \\varepsilon_{ra} + \\varepsilon_{rb}$, de donde $\\varepsilon \\le |a|\\varepsilon_b + |b|\\varepsilon_a + \\varepsilon_a\\varepsilon_b$.' };
    }
    if (Math.abs(b) - eb <= 0) throw Error('Con esa cota el divisor podría ser 0: reduce la cota de error de b.');
    return { val: a / b, cota: (Math.abs(a) * eb + Math.abs(b) * ea) / (Math.abs(b) * (Math.abs(b) - eb)),
      regla: 'En el cociente también se suman los errores relativos: $\\varepsilon_r \\le \\varepsilon_{ra} + \\varepsilon_{rb}$.' };
  }

  /* ==================================================================
     7 · radicales
     ================================================================== */
  /* Simplifica k·raiz(idx, n): extrae factores e informa de los pasos. */
  function simplificaRadical(n, idx, k) {
    idx = idx || 2; k = k === undefined ? 1 : k;
    if (!Number.isInteger(n)) throw Error('El radicando debe ser entero en este applet.');
    if (idx < 2 || idx > 12) throw Error('El índice debe estar entre 2 y 12.');
    var neg = n < 0;
    if (neg && idx % 2 === 0) throw Error('Una raíz de índice par de un número negativo no existe en los números reales: $\\sqrt[' + idx + ']{' + n + '}$ no es un número real.');
    var f = factoriza(n), fuera = 1, dentro = 1, detalle = [];
    f.forEach(function (p) {
      var q = Math.floor(p[1] / idx), r = p[1] % idx;
      if (q) fuera *= Math.pow(p[0], q);
      if (r) dentro *= Math.pow(p[0], r);
      detalle.push({ p: p[0], e: p[1], sale: q, queda: r });
    });
    if (neg) fuera = -fuera;
    return {
      k: k, idx: idx, n: n, fuera: k * fuera, dentro: dentro, detalle: detalle,
      factTex: factorizaTex(Math.abs(n)),
      exacta: dentro === 1,
      val: (neg ? -1 : 1) * Math.abs(k) * Math.pow(Math.abs(n), 1 / idx) * Math.sign(k || 1)
    };
  }
  /* Escribe k·raiz(idx, n) en KaTeX, simplificando el aspecto */
  function radTex(k, idx, n) {
    if (n === 1) return String(k);
    var r = (idx === 2 ? '\\sqrt{' + n + '}' : '\\sqrt[' + idx + ']{' + n + '}');
    if (k === 1) return r;
    if (k === -1) return '-' + r;
    if (k === 0) return '0';
    return k + r;
  }
  /* Suma de radicales: agrupa los semejantes tras simplificar.
     terms: [{k, idx, n}]  ->  {grupos, tex, val, sobran}            */
  function sumaRadicales(terms) {
    var mapa = {}, orden = [], val = 0;
    terms.forEach(function (t) {
      var s = simplificaRadical(t.n, t.idx, t.k);
      var clave = s.idx + '|' + s.dentro;
      if (!mapa[clave]) { mapa[clave] = { idx: s.idx, dentro: s.dentro, k: 0, partes: [] }; orden.push(clave); }
      mapa[clave].k += s.fuera;
      mapa[clave].partes.push(s);
      val += s.fuera * Math.pow(s.dentro, 1 / s.idx);
    });
    var g = orden.map(function (c) { return mapa[c]; });
    var piezas = g.filter(function (x) { return x.k !== 0; }).map(function (x) {
      return radTex(x.k, x.idx, x.dentro);
    });
    var txt = piezas.length ? piezas.join(' + ').replace(/\+ -/g, '- ') : '0';
    return { grupos: g, tex: txt, val: val };
  }
  /* Racionaliza 1 tipo de denominador. den describe el denominador:
     {tipo:'mono', k, idx, n}  ·  {tipo:'bino', a, b, ra, rb, signo}   */
  function racionaliza(numK, den) {
    var pasos = [];
    if (den.tipo === 'mono') {
      var idx = den.idx, n = den.n, k = den.k === undefined ? 1 : den.k;
      var falta = idx - 1;
      pasos.push('El denominador es una raíz de índice $' + idx + '$. Hay que multiplicar arriba y abajo por $\\sqrt[' + idx + ']{' + n + '^{' + falta + '}}$, porque así el denominador se convierte en $\\sqrt[' + idx + ']{' + n + '^{' + idx + '}} = ' + n + '$.');
      var dentroFin = Math.pow(n, falta);
      pasos.push('$\\dfrac{' + numK + '}{' + (k === 1 ? '' : k) + '\\sqrt[' + idx + ']{' + n + '}} = \\dfrac{' + numK + '\\sqrt[' + idx + ']{' + dentroFin + '}}{' + (k === 1 ? '' : k + ' \\cdot ') + n + '}$');
      var s = simplificaRadical(dentroFin, idx, numK);
      var denFin = k * n;
      var g = mcd(Math.round(s.fuera), Math.round(denFin));
      var kFin = s.fuera / (g || 1), dFin = denFin / (g || 1);
      var tex = dFin === 1 ? radTex(kFin, idx, s.dentro)
        : '\\dfrac{' + radTex(kFin, idx, s.dentro) + '}{' + dFin + '}';
      if (g > 1) pasos.push('Se simplifica el factor común $' + g + '$ entre numerador y denominador.');
      return { pasos: pasos, tex: tex, val: numK / (k * Math.pow(n, 1 / idx)) };
    }
    /* binomio: a·raiz(ra) + b·raiz(rb), con ra o rb posiblemente 1 */
    var a = den.a, b = den.b, ra = den.ra || 1, rb = den.rb || 1;
    var conjA = a, conjB = -b;
    pasos.push('El denominador es un binomio con raíces. Se multiplica por su **conjugado**, que es el mismo binomio con el signo central cambiado, para aplicar $(x+y)(x-y) = x^2 - y^2$ y hacer desaparecer las raíces.');
    var dEnt = a * a * ra - b * b * rb;
    if (dEnt === 0) throw Error('Ese conjugado anula el denominador: elige otros coeficientes.');
    pasos.push('$(' + radTex(a, 2, ra) + (b < 0 ? ' - ' + radTex(-b, 2, rb) : ' + ' + radTex(b, 2, rb)) + ')\\cdot(' +
      radTex(conjA, 2, ra) + (conjB < 0 ? ' - ' + radTex(-conjB, 2, rb) : ' + ' + radTex(conjB, 2, rb)) + ') = ' +
      (a * a === 1 ? '' : a * a) + (ra === 1 ? '1' : ra) + ' - ' + (b * b === 1 ? '' : b * b) + (rb === 1 ? '1' : rb) + ' = ' + dEnt + '$');
    /* Si el numerador y el denominador comparten factor, se simplifica */
    var gk = mcd(Math.round(numK), Math.round(dEnt)) || 1;
    var kNum = numK / gk, kDen = dEnt / gk;
    if (gk > 1) pasos.push('Numerador y denominador comparten el factor $' + gk + '$, así que se simplifica.');
    var interior = radTex(conjA, 2, ra) + (conjB < 0 ? ' - ' + radTex(-conjB, 2, rb) : ' + ' + radTex(conjB, 2, rb));
    var numTex = (kNum === 1 ? '' : (kNum === -1 ? '-' : kNum)) +
      (kNum === 1 ? interior : '\\left(' + interior + '\\right)');
    if (kDen === 1) {
      return { pasos: pasos, tex: numTex, val: numK / (a * Math.sqrt(ra) + b * Math.sqrt(rb)) };
    }
    return {
      pasos: pasos,
      tex: '\\dfrac{' + numTex + '}{' + kDen + '}',
      val: numK / (a * Math.sqrt(ra) + b * Math.sqrt(rb))
    };
  }

  /* ==================================================================
     8 · logaritmos
     ================================================================== */
  function logb(x, b) {
    if (x <= 0) throw Error('No existe el logaritmo de un número negativo ni de 0: el argumento debe ser mayor que 0.');
    if (b <= 0 || b === 1) throw Error('La base de un logaritmo debe ser positiva y distinta de 1.');
    return casi(Math.log(x) / Math.log(b));
  }
  /* Comprueba las tres propiedades con dos números, para el applet */
  function logProp(b, x, y) {
    var lx = logb(x, b), ly = logb(y, b);
    return {
      lx: lx, ly: ly,
      producto: { izq: logb(x * y, b), der: lx + ly },
      cociente: { izq: logb(x / y, b), der: lx - ly },
      potencia: function (p) { return { izq: logb(Math.pow(x, p), b), der: p * lx }; },
      cambio: function (c) { return { izq: logb(x, c), der: logb(x, b) / logb(c, b) }; }
    };
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
    var h = '<table class="ap-tbl ap-re"><thead><tr>';
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
        window.RE.log.push({ applet: title, error: e.message });
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
     12 · applet de diagnóstico (siempre en el núcleo)
     ================================================================== */
  R.diagnostico = function (node) {
    node.classList.add('applet');
    var claves = Object.keys(R).sort();
    function ok(f) { try { return !!f(); } catch (e) { return false; } }
    var filas = [
      ['KaTeX local', !!window.katex],
      ['Núcleo re-applets.js', true],
      ['Módulo re-applets-a.js', window.RE && window.RE.extraA === true],
      ['Módulo re-applets-b.js', window.RE && window.RE.extraB === true],
      ['Módulo re-applets-c.js', window.RE && window.RE.extraC === true],
      ['Fracciones exactas (BigInt)', ok(function () { return new Frac(6, 8).txt() === '3/4'; })],
      ['Periodo de 1/7', ok(function () { return decimalDeFraccion(1, 7).per === '142857'; })],
      ['Generatriz de 0,1&#772;6&#772;', ok(function () { return fraccionDeDecimal(1, 0, '', '16').frac.txt() === '16/99'; })],
      ['Simplificación de radicales', ok(function () { var s = simplificaRadical(72, 2); return s.fuera === 6 && s.dentro === 2; })],
      ['Logaritmos', ok(function () { return Math.abs(logb(1000, 10) - 3) < 1e-12; })]
    ];
    var h = '<h4 class="mx-title">Applet · Diagnóstico técnico</h4>' +
      '<div class="mx-instr">Comprueba que el tema ha cargado bien. Si alguna fila sale en rojo, revisa el orden de carga en <code>assets/_scripts.html</code>.</div>' +
      '<table class="ap-tbl ap-re"><thead><tr><th>Comprobación</th><th>Estado</th></tr></thead><tbody>';
    filas.forEach(function (f) {
      h += '<tr><th>' + f[0] + '</th><td>' + badge(f[1] ? 'correcto' : 'falla', f[1] ? 'si' : 'no') + '</td></tr>';
    });
    h += '</tbody></table>' +
      kvs(['Applets registrados: <b>' + claves.length + '</b>',
        'Errores registrados: <b>' + (window.RE ? window.RE.log.length : '—') + '</b>']) +
      '<div class="mx-info" style="font-size:.82rem">Claves: <code>' + esc(claves.join(', ')) + '</code></div>';
    node.innerHTML = h;
    tex(node);
  };

  /* Marcadores provisionales: si un módulo no llega a cargarse, el
     alumno ve un aviso claro en lugar de un panel vacío. */
  var PENDIENTES = [
    /* módulo A · racionales, irracionales, reales, intervalos */
    'clasifica', 'fracDecimal', 'generatriz', 'densidad', 'irracionales',
    'raizDos', 'aureo', 'rectaZoom', 'valorAbsoluto', 'intervalos', 'operaIntervalos', 'entornos',
    /* módulo B · notación científica, aproximaciones, errores */
    'notacion', 'operaNotacion', 'ordenMagnitud', 'aproxima', 'errores',
    'cifrasSignificativas', 'cotas', 'propagacion',
    /* módulo C · radicales y logaritmos */
    'potenciaFraccionaria', 'simplificaRad', 'operaRad', 'sumaRad',
    'racionalizar', 'comparaRad', 'logaritmo', 'propLog', 'cambioBase',
    'expLog', 'neperiano', 'ecuacionesLog'
  ];
  PENDIENTES.forEach(function (k) {
    R[k] = function (n) {
      n.classList.add('applet');
      n.innerHTML =
        '<h4 class="mx-title">Applet · ' + esc(k) + '</h4>' +
        '<div class="mx-bad ap-err">Este applet vive en <code>re-applets-a.js</code>, ' +
        '<code>re-applets-b.js</code> o <code>re-applets-c.js</code>. Comprueba que los tres se cargan ' +
        'después de <code>re-applets.js</code> en <code>_scripts.html</code>.</div>';
    };
  });

  /* ==================================================================
     13 · API pública, arranque y espera de módulos
     ================================================================== */
  window.RE = {
    registry: R,
    /* texto y fórmulas */
    tex: tex, K: K, KD: KD, texifica: texifica, esc: esc,
    /* formato */
    fmt: fmt, nc: nc, etq: etq, kf: kf, mil: mil, milTex: milTex, sig: sig, casi: casi,
    /* entradas */
    entero: entero, real: real, fraccionTxt: fraccionTxt,
    listaReales: listaReales, valorSimbolico: valorSimbolico,
    /* aritmética */
    Frac: Frac, mcd: mcd, mcm: mcm, factoriza: factoriza, factorizaTex: factorizaTex,
    esCuadradoPerfecto: esCuadradoPerfecto,
    decimalDeFraccion: decimalDeFraccion, decimalTex: decimalTex, decimalTxt: decimalTxt,
    fraccionDeDecimal: fraccionDeDecimal, raizContinua: raizContinua,
    /* notación científica y errores */
    notCient: notCient, normalizaNC: normalizaNC, opNC: opNC,
    redondea: redondea, trunca: trunca, errAbs: errAbs, errRel: errRel,
    cotaErr: cotaErr, cifrasSig: cifrasSig, propaga: propaga,
    /* radicales y logaritmos */
    simplificaRadical: simplificaRadical, radTex: radTex,
    sumaRadicales: sumaRadicales, racionaliza: racionaliza,
    logb: logb, logProp: logProp,
    /* figuras */
    svgWrap: svgWrap, txt: txt, line: line, rect: rect, circle: circle,
    path: path, poly: poly, leyenda: leyenda, COL: COL,
    rectaReal: rectaReal, ejes: ejes,
    /* salidas y armazón */
    resultado: resultado, badge: badge, kvs: kvs, tabla: tabla, paso: paso,
    shell: shell,
    log: []
  };

  function boot() {
    document.querySelectorAll('[data-applet-re]').forEach(function (n) {
      if (n.dataset.mounted) return;
      n.dataset.mounted = 1;
      var f = R[n.dataset.appletRe];
      if (!f) {
        n.innerHTML = '<div class="mx-bad ap-err">Clave inexistente: ' + esc(n.dataset.appletRe) + '</div>';
        return;
      }
      try { f(n); }
      catch (e) {
        n.innerHTML = '<div class="mx-bad ap-err">' + esc(e.message) + '</div>';
        window.RE.log.push({ applet: n.dataset.appletRe, error: e.message });
      }
    });
  }

  function startWhenReady() {
    var intentos = 0;
    (function espera() {
      var S = window.RE;
      if (S && S.extraA === true && S.extraB === true && S.extraC === true) { boot(); return; }
      if (intentos++ >= 200) { boot(); return; }      /* ~2 s de margen */
      setTimeout(espera, 10);
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWhenReady);
  } else {
    startWhenReady();
  }
})();
