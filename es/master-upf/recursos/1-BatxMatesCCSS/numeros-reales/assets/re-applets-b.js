/* =====================================================================
   re-applets-b.js · Tema 1 Números reales · 1.º Bachillerato Mates CCSS
   Ruta: 1-BatxMatesCCSS/numeros-reales/assets/re-applets-b.js

   MÓDULO B · apartados 5, 6 y 7:
     5 · Notación científica y sus operaciones
     6 · Aproximaciones y errores
     7 · Limitación de errores

   Claves registradas:
     notacion · operaNotacion · ordenMagnitud
     aproxima · errores · cifrasSignificativas
     cotas · propagacion

   Se carga DESPUÉS de re-applets.js y usa su API pública window.RE.
   Sin dependencias externas, ES5 conservador.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.RE;
  if (!S) { console.error('[reales] re-applets.js no cargado'); return; }
  var R = S.registry;
  var K = S.K, KD = S.KD, nc = S.nc, kf = S.kf, COL = S.COL;

  /* ==================================================================
     0 · utilidades locales del módulo
     ================================================================== */

  /* Repite un carácter n veces (los ceros de relleno de un desarrollo). */
  function rep(c, n) {
    var s = '';
    for (var i = 0; i < n; i++) s += c;
    return s;
  }

  /* Número con d decimales fijos, en texto español (coma decimal). */
  function nFix(v, d) { return Number(v).toFixed(d).replace('.', ','); }

  /* Lo mismo, pero listo para KaTeX (la coma se escribe {,}). */
  function tFix(v, d) { return Number(v).toFixed(d).replace('.', '{,}'); }

  /* Notación científica en LaTeX con la mantisa a dec decimales. */
  function ncTex(x, dec) {
    if (x === 0) return '0';
    var n = S.notCient(x, dec);
    return kf(n.m, dec === undefined ? 6 : dec) + ' \\cdot 10^{' + n.e + '}';
  }

  /* Desarrollo decimal completo de x, sin depender del formato flotante:
     se toman las cifras de la mantisa y se coloca la coma en su sitio.
     Devuelve null si el número tiene tantas cifras que no cabe. */
  function expande(x) {
    if (x === 0) return '0';
    var neg = x < 0;
    x = Math.abs(x);
    var e = Math.floor(Math.log10(x));
    var m = x / Math.pow(10, e);
    if (m >= 10) { m /= 10; e++; }
    if (m < 1) { m *= 10; e--; }
    var pr = m.toPrecision(12);
    if (Number(pr) >= 10) { m /= 10; e++; pr = m.toPrecision(12); }
    if (e > 24 || e < -24) return null;
    var s = pr.replace('.', '').replace(/0+$/, '');
    if (!s) s = '0';
    var ent, dec;
    if (e >= 0) {
      if (s.length <= e + 1) { ent = s + rep('0', e + 1 - s.length); dec = ''; }
      else { ent = s.slice(0, e + 1); dec = s.slice(e + 1); }
    } else {
      ent = '0';
      dec = rep('0', -e - 1) + s;
    }
    return (neg ? '-' : '') + S.mil(ent) + (dec ? ',' + dec : '');
  }

  /* Lectura de un número en cualquiera de los formatos admitidos:
     3,45e8   3,45*10^8   384400000   0,00072
     Se analiza aquí, con una expresión regular propia, para admitir sin
     ambigüedad mantisas que contienen las cifras 1 y 0 seguidas.        */
  function leeNC(txt, nombre) {
    var t = String(txt === undefined || txt === null ? '' : txt).trim();
    var aviso = (nombre || 'El número') + ' se escribe así: 3,45e8 (mantisa, la letra e y el exponente), ' +
      '3,45*10^8 o bien en decimal corriente, 0,00072.';
    if (!t) throw Error((nombre || 'El número') + ' no puede quedar vacío. ' + aviso);
    var s = t.toLowerCase().replace(/[\s\u202F·×]/g, '').replace(/,/g, '.');
    var m = s.match(/^([+-]?\d*\.?\d+)(?:(?:e|\*?x?10\^?)([+-]?\d+))?$/);
    if (!m) throw Error('No entiendo «' + t + '». ' + aviso);
    var mant = Number(m[1]);
    var exp = m[2] ? Number(m[2]) : 0;
    if (!Number.isFinite(mant) || Math.abs(exp) > 300) throw Error('No entiendo «' + t + '». ' + aviso);
    var x = mant * Math.pow(10, exp);
    if (!Number.isFinite(x)) throw Error((nombre || 'El número') + ' es demasiado grande para el applet.');
    return { x: x, mant: mant, exp: exp, nc: S.notCient(x) };
  }

  /* Número de decimales adecuado para rotular una recta cuyo paso es p. */
  function decSegun(p) {
    if (!Number.isFinite(p) || p <= 0) return 2;
    return Math.max(0, Math.min(8, 1 - Math.floor(Math.log10(p))));
  }

  /* Lista de números, uno por línea, con etiqueta opcional:
     «Población mundial = 8,1e9»                                        */
  function leeLista(txt, max) {
    var brutas = String(txt || '').split(/[\n;]+/);
    var lineas = [];
    brutas.forEach(function (l) { if (String(l).trim()) lineas.push(String(l).trim()); });
    if (lineas.length < 2) {
      throw Error('Escribe al menos dos números, uno por línea. Formato: ' +
        'etiqueta = valor, por ejemplo  Población mundial = 8,1e9');
    }
    if (max && lineas.length > max) throw Error('Como máximo ' + max + ' números, para que la figura se lea bien.');
    return lineas.map(function (L) {
      var et = '', v = L, i = L.indexOf('=');
      if (i >= 0) { et = L.slice(0, i).trim(); v = L.slice(i + 1).trim(); }
      var n = leeNC(v, 'El valor «' + v + '»');
      if (n.x === 0) throw Error('El 0 no tiene orden de magnitud: quítalo de la lista.');
      return { et: et, txt: v, x: n.x, nc: S.notCient(n.x, 4), e: S.notCient(n.x).e };
    });
  }

  /* Cifras significativas de una expresión decimal escrita a mano.
     Reglas del apartado 6:
       · toda cifra distinta de 0 es significativa;
       · los ceros intermedios son significativos;
       · los ceros a la izquierda nunca lo son;
       · los ceros finales son significativos si hay parte decimal
         (indican precisión) y ambiguos en un entero como 30 000.
     Devuelve {cifras, marcas:[{c,clase}], ambiguo}                    */
  function analizaSig(txtBruto) {
    var t = String(txtBruto || '').trim().replace(/\s|\u202F/g, '').replace('.', ',');
    if (t.charAt(0) === '+' || t.charAt(0) === '-') t = t.slice(1);
    if (!/^\d*(,\d*)?$/.test(t) || !/\d/.test(t)) {
      throw Error('Escribe un número decimal con coma y sin signos raros. Ejemplos: 0,004070 · 65,00 · 30000 · 7,42');
    }
    var hayComa = t.indexOf(',') >= 0;
    var i, ch;
    var primera = -1;                      /* primera cifra distinta de 0 */
    for (i = 0; i < t.length; i++) { if (/[1-9]/.test(t.charAt(i))) { primera = i; break; } }
    if (primera < 0) {                     /* el número es 0 o 0,000     */
      return { cifras: 1, ambiguo: false, marcas: t.split('').map(function (c) {
        return { c: c, clase: c === ',' ? 'ap-cif-sep' : 'ap-cif-mudo' };
      }) };
    }
    var ultima = t.length - 1;             /* última cifra significativa  */
    var ambiguo = false;
    if (!hayComa) {
      while (ultima > primera && t.charAt(ultima) === '0') { ultima--; ambiguo = true; }
    }
    var marcas = [], cuenta = 0;
    for (i = 0; i < t.length; i++) {
      ch = t.charAt(i);
      if (ch === ',') { marcas.push({ c: ch, clase: 'ap-cif-sep' }); continue; }
      if (i >= primera && i <= ultima) { marcas.push({ c: ch, clase: 'ap-cif-sig' }); cuenta++; }
      else marcas.push({ c: ch, clase: 'ap-cif-mudo' });
    }
    return { cifras: cuenta, ambiguo: ambiguo, marcas: marcas };
  }

  function pintaCifras(an) {
    var h = '<div class="ap-cifras">';
    an.marcas.forEach(function (m) {
      h += '<span class="ap-cif ' + m.clase + '">' + S.esc(m.c) + '</span>';
    });
    return h + '</div>';
  }

  /* ==================================================================
     1 · APARTADO 5 · notación científica
     ================================================================== */

  /* ---------- 1.1 · paso de decimal a notación científica ---------- */
  R.notacion = function (node) {
    return S.shell(node, 'De la escritura decimal a la notación científica',
      'Escribe un número en cualquiera de estos formatos: decimal corriente (<code>384400000</code> o ' +
      '<code>0,00072</code>) o ya en notación científica con la letra e (<code>6,022e23</code>) o con ' +
      'potencia (<code>6,022*10^23</code>). El applet localiza la mantisa y el exponente, cuenta ' +
      'los lugares que se desplaza la coma y devuelve el desarrollo decimal completo. ' +
      'Ejemplo de entrada: <code>0,000000091</code>.',
      [ { id: 'x', label: 'Número', type: 'text', value: '384400000', place: '384400000 · 0,00072 · 6,022e23', ancho: '260px' },
        { id: 'dec', label: 'Decimales de la mantisa', type: 'number', value: 4, min: 0, max: 8 },
        { type: 'presets', list: [
          { label: 'Distancia a la Luna (m)', title: '384 400 000 m', apply: function (c) { c.x.value = '384400000'; } },
          { label: 'Población mundial', title: '8 100 000 000 personas', apply: function (c) { c.x.value = '8100000000'; } },
          { label: 'PIB de España (€)', title: '1 460 000 000 000 €', apply: function (c) { c.x.value = '1460000000000'; } },
          { label: 'Masa del electrón (kg)', title: '0,000…9109 kg', apply: function (c) { c.x.value = '9,109e-31'; } },
          { label: 'Tamaño de un átomo (m)', title: '0,0000000001 m', apply: function (c) { c.x.value = '0,0000000001'; } },
          { label: 'Número de Avogadro', title: '6,022·10^23', apply: function (c) { c.x.value = '6,022e23'; } }
        ] } ],
      function (v) {
        var dec = S.entero(v.dec, 0, 8, 'El número de decimales de la mantisa');
        var r = leeNC(v.x, 'El número');
        var x = r.x;
        if (x === 0) throw Error('El 0 no se escribe en notación científica: no tiene mantisa ni exponente.');
        var n = S.notCient(x, dec);
        var grande = n.e >= 0;

        var h = S.resultado(K(ncTex(x, dec)), 'notación científica de <span class="mx-mono">' + S.esc(String(v.x).trim()) + '</span>');

        h += S.kvs([
          'Mantisa: <b>' + nc(n.m, dec) + '</b>',
          'Exponente: <b>' + n.e + '</b>',
          'Orden de magnitud: ' + K('10^{' + n.e + '}'),
          S.badge(grande ? 'número grande' : 'número pequeño', grande ? 'info' : 'avi')
        ]);

        /* La coma se desplaza tantos lugares como indica el exponente. */
        var lugares = Math.abs(n.e);
        h += S.paso(1, 'Se busca la <b>primera cifra distinta de cero</b> y se coloca la coma justo detrás: ' +
          'la mantisa debe cumplir ' + K('1 \\le |m| < 10') + '. Aquí la mantisa es ' + K(tFix(n.m, dec)) + '.');
        h += S.paso(2, 'Se cuenta cuántos lugares se ha movido la coma: <b>' + lugares + '</b> ' +
          (lugares === 1 ? 'lugar' : 'lugares') + ' hacia la <b>' + (grande ? 'izquierda' : 'derecha') + '</b>. ' +
          'Ese número es el exponente, ' + (grande ? 'positivo' : 'negativo') + ': ' + K('10^{' + n.e + '}') + '.');
        h += S.paso(3, 'Se escribe el producto de la mantisa por la potencia de diez: ' + KD(ncTex(x, dec)));

        var des = expande(x);
        h += '<div class="mx-info">Desarrollo decimal: ' +
          (des ? '<b class="mx-mono">' + S.esc(des) + '</b>' : 'tiene ' + (Math.abs(n.e) + 1) +
            ' cifras, demasiadas para escribirlo aquí') +
          '. Comprobación de la vuelta atrás: se multiplica la mantisa por ' + K('10^{' + n.e + '}') +
          ', es decir, se desplaza la coma ' + lugares + ' ' + (lugares === 1 ? 'lugar' : 'lugares') +
          ' hacia la ' + (grande ? 'derecha' : 'izquierda') + '.</div>';

        /* Tabla con órdenes vecinos, para ver la escala. */
        var filas = [];
        [-2, -1, 0, 1, 2].forEach(function (k) {
          var e2 = n.e + k;
          filas.push({
            celdas: [K('10^{' + e2 + '}'), K(tFix(n.m, dec) + ' \\cdot 10^{' + e2 + '}'),
              (k === 0 ? '<b>tu número</b>' : (k < 0 ? Math.pow(10, -k) + ' veces menor' : Math.pow(10, k) + ' veces mayor'))],
            clase: k === 0 ? 'ap-hi' : ''
          });
        });
        h += S.tabla(['Orden', 'Número', 'Comparación'], filas, { thPrimera: true });
        return h;
      });
  };

  /* ---------- 1.2 · operaciones en notación científica ---------- */
  R.operaNotacion = function (node) {
    return S.shell(node, 'Operaciones en notación científica',
      'Escribe los dos números con la letra e: mantisa, <code>e</code>, exponente. ' +
      'Por ejemplo <code>5,24e6</code> significa ' + K('5{,}24 \\cdot 10^{6}') + '. ' +
      'También se admite <code>6,3*10^8</code> o la escritura decimal <code>0,00072</code>. ' +
      'Elige la operación y observa los pasos: en el producto y el cociente se opera con mantisas y exponentes ' +
      'por separado; en la suma y la resta hay que <b>igualar primero los exponentes</b>.',
      [ { id: 'a', label: 'Primer número', type: 'text', value: '5,24e6', place: '5,24e6', ancho: '170px' },
        { id: 'op', label: 'Operación', type: 'select', value: '*', options: [
          { value: '+', label: '+  suma' }, { value: '-', label: '−  resta' },
          { value: '*', label: '·  producto' }, { value: '/', label: ':  cociente' } ] },
        { id: 'b', label: 'Segundo número', type: 'text', value: '6,3e8', place: '6,3e8', ancho: '170px' },
        { id: 'dec', label: 'Decimales del resultado', type: 'number', value: 4, min: 0, max: 8 },
        { type: 'presets', list: [
          { label: '(5,24·10⁶)·(6,3·10⁸)', apply: function (c) { c.a.value = '5,24e6'; c.b.value = '6,3e8'; c.op.value = '*'; } },
          { label: '(5,24·10⁶):(6,3·10⁻⁸)', apply: function (c) { c.a.value = '5,24e6'; c.b.value = '6,3e-8'; c.op.value = '/'; } },
          { label: '5,83·10⁹ + 6,932·10¹²', apply: function (c) { c.a.value = '5,83e9'; c.b.value = '6,932e12'; c.op.value = '+'; } },
          { label: 'Deuda : población', title: 'deuda pública entre habitantes', apply: function (c) { c.a.value = '1,57e12'; c.b.value = '4,85e7'; c.op.value = '/'; } },
          { label: 'Átomos: 3,2·10⁻¹⁰ − 8·10⁻¹¹', apply: function (c) { c.a.value = '3,2e-10'; c.b.value = '8e-11'; c.op.value = '-'; } }
        ] } ],
      function (v) {
        var dec = S.entero(v.dec, 0, 8, 'El número de decimales del resultado');
        var A = leeNC(v.a, 'El primer número').x;
        var B = leeNC(v.b, 'El segundo número').x;
        var op = String(v.op);
        if (op === '/' && B === 0) throw Error('No se puede dividir entre 0: cambia el segundo número.');

        var na = S.notCient(A, dec), nb = S.notCient(B, dec);
        var r = S.opNC(A, B, op, dec);
        var simb = op === '*' ? '\\cdot' : (op === '/' ? ':' : op);

        var h = S.resultado(K(r.res.tex), 'resultado en notación científica');
        h += '<div class="mx-info">Planteamiento: ' +
          KD('(' + kf(na.m, dec) + ' \\cdot 10^{' + na.e + '}) \\;' + simb + '\\; (' +
             kf(nb.m, dec) + ' \\cdot 10^{' + nb.e + '})') + '</div>';

        r.pasos.forEach(function (p, i) { h += S.paso(i + 1, p); });

        h += S.kvs([
          'Mantisa del resultado: <b>' + nc(r.res.m, dec) + '</b>',
          'Exponente: <b>' + r.res.e + '</b>',
          'Valor aproximado: <b>' + nc(r.x, Math.max(0, dec - r.res.e > 12 ? 12 : Math.max(0, dec - r.res.e))) + '</b>'
        ]);

        var aviso = (op === '+' || op === '-')
          ? 'Al sumar o restar, el término de exponente más pequeño casi desaparece si la diferencia de exponentes es grande: ' +
            'compara ' + K(kf(na.m, dec) + ' \\cdot 10^{' + na.e + '}') + ' con ' +
            K(kf(nb.m, dec) + ' \\cdot 10^{' + nb.e + '}') + ' y fíjate en cuánto pesa cada uno.'
          : 'En el producto y el cociente el exponente final se obtiene sumando o restando exponentes; ' +
            'si la mantisa se sale del intervalo ' + K('[1,10)') + ' hay que reajustarla moviendo una unidad el exponente.';
        h += '<div class="mx-info">' + aviso + '</div>';
        return h;
      });
  };

  /* ---------- 1.3 · orden de magnitud y comparación ---------- */
  R.ordenMagnitud = function (node) {
    return S.shell(node, 'Orden de magnitud y comparación de cantidades',
      'Escribe un número por línea, con etiqueta opcional delante de un signo igual. ' +
      'Formato: <code>Población mundial = 8,1e9</code>. También vale escribir solo el número, ' +
      'como <code>9,109e-31</code> o <code>0,00072</code>. Máximo 8 líneas. ' +
      'El applet ordena las cantidades, calcula su orden de magnitud y las coloca en una escala ' +
      'logarítmica, donde cada paso equivale a multiplicar por 10.',
      [ { id: 'lista', label: 'Cantidades', type: 'textarea', rows: 6, ancho: '100%',
          value: 'Población de España = 4,85e7\nPoblación mundial = 8,1e9\nPIB de España (€) = 1,46e12\nDeuda pública mundial (€) = 8,7e13\nMasa del electrón (kg) = 9,109e-31\nTamaño de un átomo (m) = 1e-10',
          place: 'Etiqueta = valor, un número por línea' },
        { type: 'presets', list: [
          { label: 'Economía', apply: function (c) { c.lista.value =
            'Salario medio anual (€) = 2,7e4\nPresupuesto de un ayuntamiento (€) = 3,5e8\nPIB de España (€) = 1,46e12\nPIB mundial (€) = 9,8e13'; } },
          { label: 'Astronomía', apply: function (c) { c.lista.value =
            'Radio de la Tierra (m) = 6,37e6\nDistancia a la Luna (m) = 3,844e8\nDistancia al Sol (m) = 1,496e11\nAño luz (m) = 9,46e15'; } },
          { label: 'Lo muy pequeño', apply: function (c) { c.lista.value =
            'Tamaño de un átomo (m) = 1e-10\nMolécula de agua (m) = 2,8e-10\nCromosoma (m) = 4e-6\nMasa del electrón (kg) = 9,109e-31'; } }
        ] } ],
      function (v) {
        var L = leeLista(v.lista, 8);
        var orden = L.slice().sort(function (p, q) { return Math.abs(p.x) - Math.abs(q.x); });
        var menor = orden[0], mayor = orden[orden.length - 1];
        var razon = Math.abs(mayor.x) / Math.abs(menor.x);

        var filas = orden.map(function (p) {
          var cif = p.e >= 0 ? String(p.e + 1) : '—';
          return [ S.esc(p.et || p.txt), K(ncTex(p.x, 3)), K('10^{' + p.e + '}'), cif ];
        });
        var h = S.tabla(['Cantidad', 'Notación científica', 'Orden de magnitud', 'Cifras enteras'], filas, { thPrimera: true });

        h += S.resultado(K(ncTex(razon, 2)),
          'veces mayor es «' + S.esc(mayor.et || mayor.txt) + '» que «' + S.esc(menor.et || menor.txt) + '»');

        /* Escala logarítmica: cada unidad de la recta es un factor 10. */
        var exps = orden.map(function (p) { return Math.log10(Math.abs(p.x)); });
        var mn = Math.floor(Math.min.apply(null, exps)) - 1;
        var mx = Math.ceil(Math.max.apply(null, exps)) + 1;
        var paso = Math.max(1, Math.ceil((mx - mn) / 12));
        var puntos = orden.map(function (p, i) {
          return { x: Math.log10(Math.abs(p.x)), tex: '10^{' + p.e + '}',
            col: i % 2 ? COL.morado : COL.rojo, arriba: i % 2 === 0 };
        });
        h += S.rectaReal({
          min: mn, max: mx, W: 1050, H: 300, paso: paso, dec: 0, puntos: puntos,
          titulo: 'Escala logarítmica: el eje marca el exponente de 10',
          label: 'Escala de órdenes de magnitud',
          cap: 'Avanzar una unidad hacia la derecha significa multiplicar por 10. Por eso caben en un mismo dibujo ' +
               'el tamaño de un átomo y el PIB mundial: lo que se representa no es la cantidad, sino su exponente.'
        });

        h += '<div class="mx-info">Comparar órdenes de magnitud es más útil que comparar cifra a cifra: ' +
          'dos cantidades del mismo orden son comparables, y una diferencia de tres órdenes significa que una es ' +
          'unas mil veces mayor que la otra. Diferencia de órdenes entre los extremos de tu lista: <b>' +
          (mayor.e - menor.e) + '</b>.</div>';
        return h;
      });
  };

  /* ==================================================================
     2 · APARTADO 6 · aproximaciones y errores
     ================================================================== */

  /* ---------- 2.1 · redondeo y truncamiento ---------- */
  R.aproxima = function (node) {
    return S.shell(node, 'Redondeo y truncamiento',
      'Escribe el número que quieres aproximar: admite decimales con coma (<code>3,14159265</code>), ' +
      'fracciones (<code>7/3</code>), la constante <code>pi</code> y raíces como <code>sqrt2</code> o ' +
      '<code>raiz(3)</code>. Elige después cuántos decimales quieres conservar. ' +
      'Verás en paralelo el redondeo y el truncamiento, con sus errores. Ejemplo: escribe <code>pi</code> con 4 decimales.',
      [ { id: 'x', label: 'Número', type: 'text', value: 'pi', place: 'pi · 3,14159265 · 7/3 · sqrt2', ancho: '190px' },
        { id: 'd', label: 'Decimales', type: 'range', value: 2, min: 0, max: 6, step: 1 },
        { type: 'presets', list: [
          { label: 'π con 4 decimales', apply: function (c) { c.x.value = 'pi'; c.d.value = 4; } },
          { label: '√2 con 2 decimales', apply: function (c) { c.x.value = 'sqrt2'; c.d.value = 2; } },
          { label: '1/3 con 3 decimales', apply: function (c) { c.x.value = '1/3'; c.d.value = 3; } },
          { label: 'Nota 5,5555… con 1 decimal', apply: function (c) { c.x.value = '5,5555555'; c.d.value = 1; } },
          { label: 'Precio 1,399 € con 2 decimales', apply: function (c) { c.x.value = '1,399'; c.d.value = 2; } }
        ] } ],
      function (v) {
        var d = S.entero(v.d, 0, 6, 'El número de decimales');
        var sv = S.valorSimbolico(String(v.x).trim());
        var x = sv.v;
        if (!Number.isFinite(x)) throw Error('No entiendo ese número. Escribe por ejemplo 3,14159265, 7/3, pi o sqrt2.');
        if (Math.abs(x) > 1e9) throw Error('Usa un número menor que mil millones para que la figura se lea.');

        var u = Math.pow(10, -d);
        var xr = Math.round(x * Math.pow(10, d)) / Math.pow(10, d);
        var xt = Math.trunc(x * Math.pow(10, d)) / Math.pow(10, d);
        var eaR = Math.abs(x - xr), eaT = Math.abs(x - xt);
        var erR = x !== 0 ? eaR / Math.abs(x) : 0, erT = x !== 0 ? eaT / Math.abs(x) : 0;

        var h = S.resultado(K(tFix(xr, d)), 'redondeo de ' + K(sv.tex) + ' a ' + d + ' ' + (d === 1 ? 'decimal' : 'decimales'));

        h += S.tabla(
          ['Aproximación', 'Valor', 'Error absoluto', 'Error relativo', 'Cota del error'],
          [ { celdas: ['Redondeo', K(tFix(xr, d)), nc(eaR, d + 4), nc(erR * 100, 4) + ' %', K('\\le ' + tFix(u / 2, d + 1)) ], clase: 'ap-ok-row' },
            ['Truncamiento', K(tFix(xt, d)), nc(eaT, d + 4), nc(erT * 100, 4) + ' %', K('\\le ' + tFix(u, d))] ],
          { thPrimera: true });

        h += S.paso(1, 'El número exacto vale ' + K(sv.tex + ' = ' + kf(x, Math.min(10, d + 6)) + '\\ldots') + '.');
        h += S.paso(2, '<b>Truncar</b> es cortar: se borran todas las cifras a partir del decimal ' + d + '.º, ' +
          'sin mirar nada más. Se obtiene ' + K(tFix(xt, d)) + ', que siempre queda por debajo del valor exacto ' +
          '(en los números positivos).');
        h += S.paso(3, '<b>Redondear</b> es elegir el vecino más próximo: se mira <b>solo</b> la cifra siguiente; ' +
          'si es menor que 5 se deja igual, y si es 5 o mayor se suma una unidad a la última cifra conservada. ' +
          'Aquí sale ' + K(tFix(xr, d)) + '.', eaR <= eaT ? 'ap-paso-clave' : '');
        h += S.paso(4, 'Por eso el redondeo nunca es peor que el truncamiento: su error no pasa de <b>media unidad</b> ' +
          'del último orden conservado, mientras que el del truncamiento puede llegar a <b>una unidad entera</b>.');

        /* Recta ampliada entre los dos vecinos de la malla de paso u. */
        var lo = Math.floor(x / u) * u, hi = lo + u;
        var med = (lo + hi) / 2;
        var mn = lo - u * 0.55, mx2 = hi + u * 0.55;
        h += S.rectaReal({
          min: mn, max: mx2, W: 1050, H: 320, paso: u / 2, dec: d + 1,
          tramos: [{ a: lo, b: med, col: 'rgba(46,125,50,.20)', alto: 22 },
                   { a: med, b: hi, col: 'rgba(224,123,0,.20)', alto: 22 }],
          puntos: [
            { x: x, tex: sv.tex, col: COL.rojo, arriba: true },
            { x: xt, tex: 'truncamiento', col: COL.naranja, arriba: false },
            { x: xr, tex: 'redondeo', col: COL.verde, arriba: false }
          ],
          titulo: 'Zoom entre los dos valores vecinos con ' + d + ' ' + (d === 1 ? 'decimal' : 'decimales'),
          label: 'Recta ampliada con el redondeo y el truncamiento',
          cap: 'El truncamiento siempre cae en el extremo izquierdo de la casilla; el redondeo salta al extremo más cercano. ' +
               'La mitad de la casilla (la zona verde o la naranja) decide hacia dónde.'
        });
        return h;
      });
  };

  /* ---------- 2.2 · error absoluto y error relativo ---------- */
  R.errores = function (node) {
    return S.shell(node, 'Error absoluto y error relativo',
      'Escribe el valor exacto (admite <code>pi</code>, <code>sqrt2</code>, <code>raiz(3)</code>, fracciones como ' +
      '<code>7/3</code> y decimales con coma) y una o dos aproximaciones. ' +
      'Ejemplo: valor exacto <code>raiz(3)</code>, aproximación <code>1,73</code>. ' +
      'Deja la segunda casilla vacía si solo quieres estudiar una aproximación.',
      [ { id: 'ex', label: 'Valor exacto', type: 'text', value: 'raiz(3)', place: 'raiz(3) · pi · 7/3', ancho: '160px' },
        { id: 'ap', label: 'Aproximación 1', type: 'text', value: '1,73', place: '1,73', ancho: '150px' },
        { id: 'ap2', label: 'Aproximación 2 (opcional)', type: 'text', value: '1,7', place: '1,7', ancho: '150px' },
        { type: 'presets', list: [
          { label: 'π ≈ 3,1416', apply: function (c) { c.ex.value = 'pi'; c.ap.value = '3,1416'; c.ap2.value = '3,14'; } },
          { label: '√3 ≈ 1,73', apply: function (c) { c.ex.value = 'raiz(3)'; c.ap.value = '1,73'; c.ap2.value = '1,7'; } },
          { label: '1/3 ≈ 0,33', apply: function (c) { c.ex.value = '1/3'; c.ap.value = '0,33'; c.ap2.value = '0,333'; } },
          { label: 'Paro: 2 785 400 ≈ 2 800 000', apply: function (c) { c.ex.value = '2785400'; c.ap.value = '2800000'; c.ap2.value = '2790000'; } },
          { label: 'Población: 47 615 034 ≈ 47,6 mill.', apply: function (c) { c.ex.value = '47615034'; c.ap.value = '47600000'; c.ap2.value = '48000000'; } }
        ] } ],
      function (v) {
        var sx = S.valorSimbolico(String(v.ex).trim());
        var X = sx.v;
        if (X === 0) throw Error('El error relativo no está definido si el valor exacto es 0: elige otro valor.');
        var lista = [];
        [v.ap, v.ap2].forEach(function (t, i) {
          if (String(t || '').trim() === '') return;
          var s = S.valorSimbolico(String(t).trim());
          lista.push({ n: i + 1, tex: s.tex, val: s.v });
        });
        if (!lista.length) throw Error('Escribe al menos una aproximación, por ejemplo 1,73.');

        lista.forEach(function (p) {
          p.ea = S.errAbs(X, p.val);
          p.er = S.errRel(X, p.val);
          p.pct = p.er * 100;
          p.porDefecto = p.val < X;
        });
        var mejor = lista.slice().sort(function (a, b) { return a.ea - b.ea; })[0];

        var dprec = Math.max(4, 8 - Math.max(0, S.notCient(X).e));
        var h = S.resultado(nc(lista[0].ea, dprec), 'error absoluto de la aproximación 1') +
          S.resultado(nc(lista[0].pct, 4) + ' %', 'error relativo de la aproximación 1');

        h += S.tabla(
          ['Aproximación', 'Valor', 'Error absoluto', 'Error relativo', 'En %', 'Sentido'],
          lista.map(function (p) {
            return { celdas: [ 'Aproximación ' + p.n, K(kf(p.val, 8)), nc(p.ea, dprec),
              nc(p.er, dprec + 2), nc(p.pct, 4) + ' %',
              S.badge(p.porDefecto ? 'por defecto' : 'por exceso', p.porDefecto ? 'info' : 'avi') ],
              clase: p === mejor && lista.length > 1 ? 'ap-ok-row' : '' };
          }), { thPrimera: true });

        h += S.paso(1, 'Definición del <b>error absoluto</b>: ' +
          KD('E_a = |\\text{valor exacto} - \\text{valor aproximado}| = |' + kf(X, 8) + ' - ' +
             kf(lista[0].val, 8) + '| = ' + kf(lista[0].ea, dprec)) +
          'Se mide en las mismas unidades que el número: dice <b>cuánto</b> nos hemos desviado.');
        h += S.paso(2, 'Definición del <b>error relativo</b>: ' +
          KD('E_r = \\dfrac{E_a}{|\\text{valor exacto}|} = \\dfrac{' + kf(lista[0].ea, dprec) + '}{' +
             kf(Math.abs(X), 8) + '} = ' + kf(lista[0].er, dprec + 2) + ' = ' + kf(lista[0].pct, 4) + '\\,\\%') +
          'No tiene unidades: dice <b>qué proporción</b> del número representa el fallo, así que sirve para comparar ' +
          'errores de magnitudes muy distintas.');
        if (lista.length > 1) {
          h += S.paso(3, 'Comparación: la <b>aproximación ' + mejor.n + '</b> es mejor, porque su error absoluto ' +
            'es menor (' + nc(mejor.ea, dprec) + ' frente a ' +
            nc(lista.filter(function (p) { return p !== mejor; })[0].ea, dprec) + ').', 'ap-paso-clave');
        }

        var mn = Math.min(X, lista[0].val), mx2 = Math.max(X, lista[0].val);
        lista.forEach(function (p) { mn = Math.min(mn, p.val); mx2 = Math.max(mx2, p.val); });
        var margen = Math.max((mx2 - mn) * 1.6, Math.abs(X) * 0.02, 1e-9);
        var paso = margen / 4;
        var puntos = [{ x: X, tex: sx.tex, col: COL.azulOsc, arriba: true }];
        lista.forEach(function (p, i) {
          puntos.push({ x: p.val, tex: 'a_' + p.n, col: i ? COL.morado : COL.rojo, arriba: false });
        });
        h += S.rectaReal({
          min: mn - margen, max: mx2 + margen, W: 1050, H: 300,
          paso: paso, dec: decSegun(paso), puntos: puntos,
          titulo: 'Distancia entre el valor exacto y las aproximaciones',
          label: 'Recta con el valor exacto y sus aproximaciones',
          cap: 'El error absoluto es literalmente la distancia en la recta real entre el punto exacto y el aproximado.'
        });

        h += '<div class="mx-info">Idea clave: equivocarse en 1 metro al medir un campo de fútbol y equivocarse en ' +
          '1 metro al medir la distancia Madrid-Barcelona son el mismo error absoluto, pero errores relativos ' +
          'completamente distintos. Por eso, para decidir si una medida es buena, se mira el error relativo.</div>';
        return h;
      });
  };

  /* ---------- 2.3 · cifras significativas ---------- */
  R.cifrasSignificativas = function (node) {
    return S.shell(node, 'Cifras significativas',
      'Escribe el número tal y como aparece escrito, con coma decimal y sin separador de millares: ' +
      '<code>0,004070</code>, <code>65,00</code>, <code>30000</code> o <code>7,42</code>. ' +
      'El applet marca en color las cifras significativas y redondea al número de cifras significativas que elijas.',
      [ { id: 'n', label: 'Número escrito', type: 'text', value: '0,004070', place: '0,004070', ancho: '190px' },
        { id: 'k', label: 'Redondear a … cifras significativas', type: 'number', value: 2, min: 1, max: 8 },
        { type: 'presets', list: [
          { label: '7,42', apply: function (c) { c.n.value = '7,42'; c.k.value = 2; } },
          { label: '89,053', apply: function (c) { c.n.value = '89,053'; c.k.value = 3; } },
          { label: '65,00', apply: function (c) { c.n.value = '65,00'; c.k.value = 3; } },
          { label: '2004', apply: function (c) { c.n.value = '2004'; c.k.value = 3; } },
          { label: '30000 (ambiguo)', apply: function (c) { c.n.value = '30000'; c.k.value = 2; } },
          { label: '0,0002', apply: function (c) { c.n.value = '0,0002'; c.k.value = 1; } }
        ] } ],
      function (v) {
        var k = S.entero(v.k, 1, 8, 'El número de cifras significativas');
        var an = analizaSig(v.n);
        var x = Number(String(v.n).trim().replace(/\s|\u202F/g, '').replace(',', '.'));
        if (!Number.isFinite(x)) throw Error('Ese número no se puede leer. Escríbelo así: 0,004070');

        var h = S.resultado('<b>' + an.cifras + '</b>', 'cifras significativas de ' + S.esc(String(v.n).trim()));
        h += pintaCifras(an);
        h += '<div class="mx-info">En verde, las cifras significativas; en gris, los ceros que solo sitúan la coma.</div>';

        h += S.paso(1, 'Las cifras <b>distintas de cero</b> siempre son significativas.');
        h += S.paso(2, 'Los <b>ceros intermedios</b> también lo son: en ' + K('2004') + ' hay 4 cifras significativas.');
        h += S.paso(3, 'Los <b>ceros de la izquierda nunca</b> son significativos: solo indican dónde va la coma. ' +
          'Por eso ' + K('0{,}0002') + ' tiene una sola cifra significativa.');
        h += S.paso(4, 'Los <b>ceros finales tras la coma sí</b> son significativos, porque informan de la precisión ' +
          'de la medida: ' + K('65{,}00') + ' tiene 4 cifras significativas y no es lo mismo que ' + K('65') + '.');
        if (an.ambiguo) {
          h += S.paso(5, 'Cuidado: en un número entero acabado en ceros, como el tuyo, <b>no se sabe</b> cuántas ' +
            'cifras son significativas. La notación científica resuelve la ambigüedad: ' +
            K(ncTex(x, 0)) + ' tiene 1 cifra significativa, ' + K(ncTex(x, 1)) + ' tiene 2, y así sucesivamente.',
            'ap-paso-avi');
        }

        if (x !== 0) {
          var red = Number(x.toPrecision(k));
          var nk = S.notCient(red, k - 1);
          h += S.tabla(['Cifras significativas', 'Redondeo', 'En notación científica'],
            [1, 2, 3, 4].filter(function (j) { return j <= 8; }).map(function (j) {
              var y = Number(x.toPrecision(j));
              return { celdas: [String(j), nc(y, 10), K(ncTex(y, j - 1))], clase: j === k ? 'ap-hi' : '' };
            }), { thPrimera: true });
          h += S.resultado(K(ncTex(red, k - 1)), 'tu número redondeado a ' + k + ' ' +
            (k === 1 ? 'cifra significativa' : 'cifras significativas'));
          h += '<div class="mx-info">La precisión de una aproximación se mide mejor con el número de cifras ' +
            'significativas que con el número de decimales: ' + K('0{,}0002') + ' tiene cuatro decimales pero una ' +
            'sola cifra significativa, así que se conoce con muy poca precisión. Mantisa del resultado: ' +
            nc(nk.m, k - 1) + '; exponente: ' + nk.e + '.</div>';
        }
        return h;
      });
  };

  /* ==================================================================
     3 · APARTADO 7 · limitación de errores
     ================================================================== */

  /* ---------- 3.1 · cotas de error ---------- */
  R.cotas = function (node) {
    return S.shell(node, 'Cota del error absoluto y del error relativo',
      'Escribe la aproximación tal y como te la han dado (por ejemplo <code>3,14</code> o <code>300</code>), ' +
      'indica en qué orden se ha aproximado y si se ha redondeado o truncado. ' +
      'Puedes añadir el valor exacto (<code>pi</code>, <code>sqrt2</code>, <code>raiz(3)</code>, un decimal…) ' +
      'para comprobar que el error real cabe dentro de la cota. Ejemplo: aproximación <code>3,14</code>, ' +
      'orden «centésimas», valor exacto <code>pi</code>.',
      [ { id: 'a', label: 'Aproximación', type: 'text', value: '3,14', place: '3,14', ancho: '140px' },
        { id: 'd', label: 'Orden de aproximación', type: 'select', value: '2', options: [
          { value: '-3', label: 'millares' }, { value: '-2', label: 'centenas' }, { value: '-1', label: 'decenas' },
          { value: '0', label: 'unidades' }, { value: '1', label: 'décimas' }, { value: '2', label: 'centésimas' },
          { value: '3', label: 'milésimas' }, { value: '4', label: 'diezmilésimas' }, { value: '5', label: 'cienmilésimas' } ] },
        { id: 'modo', label: 'Método', type: 'select', value: 'redondea', options: [
          { value: 'redondea', label: 'redondeo' }, { value: 'trunca', label: 'truncamiento' } ] },
        { id: 'ex', label: 'Valor exacto (opcional)', type: 'text', value: 'pi', place: 'pi · sqrt2 · 2,718', ancho: '150px' },
        { type: 'presets', list: [
          { label: 'π ≈ 3,14', apply: function (c) { c.a.value = '3,14'; c.d.value = '2'; c.ex.value = 'pi'; c.modo.value = 'redondea'; } },
          { label: 'π ≈ 3,1416', apply: function (c) { c.a.value = '3,1416'; c.d.value = '4'; c.ex.value = 'pi'; c.modo.value = 'redondea'; } },
          { label: '√2 ≈ 1,41', apply: function (c) { c.a.value = '1,41'; c.d.value = '2'; c.ex.value = 'sqrt2'; c.modo.value = 'trunca'; } },
          { label: 'N ≈ 300 (centenas)', apply: function (c) { c.a.value = '300'; c.d.value = '-2'; c.ex.value = ''; c.modo.value = 'redondea'; } },
          { label: 'A = 7,4 con cota 0,05', apply: function (c) { c.a.value = '7,4'; c.d.value = '1'; c.ex.value = ''; c.modo.value = 'redondea'; } }
        ] } ],
      function (v) {
        var d = S.entero(v.d, -3, 5, 'El orden de aproximación');
        var modo = String(v.modo) === 'trunca' ? 'trunca' : 'redondea';
        var a = S.real(String(v.a).trim(), -1e9, 1e9, 'La aproximación');
        if (a === 0) throw Error('Usa una aproximación distinta de 0 para poder calcular el error relativo.');
        var c = S.cotaErr(d, modo);
        var dl = Math.max(0, d);
        var crel = c / Math.abs(a);

        var izq = modo === 'trunca' ? a : a - c;
        var der = modo === 'trunca' ? a + c : a + c;

        var h = S.resultado(K('E_a \\le ' + tFix(c, Math.max(0, d + 1))), 'cota del error absoluto') +
          S.resultado(K('E_r \\le ' + kf(crel * 100, 3) + '\\,\\%'), 'cota del error relativo');

        h += S.paso(1, modo === 'redondea'
          ? 'Al <b>redondear</b> en el orden elegido, el valor exacto no puede estar a más de <b>media unidad</b> ' +
            'de ese orden: ' + KD('E_a \\le \\dfrac{10^{-' + d + '}}{2} = ' + tFix(c, Math.max(0, d + 1)))
          : 'Al <b>truncar</b> se pierde todo lo que venía detrás, así que el error puede llegar a <b>una unidad</b> ' +
            'entera de ese orden: ' + KD('E_a \\le 10^{-' + d + '} = ' + tFix(c, Math.max(0, d))));
        h += S.paso(2, 'La cota del error relativo se obtiene dividiendo por el valor: ' +
          KD('E_r \\le \\dfrac{' + tFix(c, Math.max(0, d + 1)) + '}{' + tFix(Math.abs(a), dl) + '} = ' +
             kf(crel, 6) + ' = ' + kf(crel * 100, 3) + '\\,\\%'));
        h += S.paso(3, 'Por tanto el valor exacto está garantizado dentro del intervalo ' +
          KD(modo === 'trunca'
            ? '\\left[' + tFix(izq, dl) + ',\\; ' + tFix(der, Math.max(0, d + 1)) + '\\right)'
            : '\\left[' + tFix(izq, Math.max(0, d + 1)) + ',\\; ' + tFix(der, Math.max(0, d + 1)) + '\\right]') +
          'y se escribe de forma abreviada ' + K(tFix(a, dl) + ' \\pm ' + tFix(c, Math.max(0, d + 1))) + '.',
          'ap-paso-clave');

        /* ¿El error real cabe dentro de la cota? */
        var texto = String(v.ex || '').trim();
        if (texto) {
          var sx = S.valorSimbolico(texto);
          var ea = Math.abs(sx.v - a);
          var dentro = ea <= c + 1e-12;
          h += S.kvs([
            'Valor exacto: ' + K(sx.tex + ' = ' + kf(sx.v, Math.max(6, d + 4))),
            'Error real: <b>' + nc(ea, Math.max(6, d + 4)) + '</b>',
            'Cota: <b>' + nc(c, Math.max(0, d + 1)) + '</b>',
            S.badge(dentro ? 'el error real cumple la cota' : 'la cota no se cumple: revisa el orden',
              dentro ? 'si' : 'no')
          ]);
        }

        /* Intervalo de incertidumbre dibujado en la recta real. */
        var pasoR = c / 2;
        var puntos = [{ x: a, tex: tFix(a, dl), col: COL.rojo, arriba: true }];
        if (texto) {
          var sx2 = S.valorSimbolico(texto);
          if (Math.abs(sx2.v - a) < 3 * c) puntos.push({ x: sx2.v, tex: sx2.tex, col: COL.azulOsc, arriba: false });
        }
        h += S.rectaReal({
          min: a - 2.2 * c, max: a + 2.2 * c, W: 1050, H: 320, paso: pasoR, dec: decSegun(pasoR),
          tramos: [{ a: izq, b: der, col: 'rgba(25,118,210,.22)', alto: 26, borde: COL.azul }],
          puntos: puntos,
          titulo: 'Intervalo donde está garantizado el valor exacto',
          label: 'Cota de error sobre la recta real',
          cap: 'La banda azul tiene amplitud ' + (modo === 'trunca' ? 'una unidad' : 'dos medias unidades') +
               ' del último orden conservado. Cuantos más decimales se conservan, más estrecha es la banda: ' +
               'cada decimal más divide la cota entre 10.'
        });

        /* Relación entre número de decimales y cota. */
        h += S.tabla(['Decimales conservados', 'Cota con redondeo', 'Cota con truncamiento'],
          [0, 1, 2, 3, 4, 5].map(function (j) {
            return { celdas: [String(j), K(tFix(S.cotaErr(j, 'redondea'), j + 1)),
              K(tFix(S.cotaErr(j, 'trunca'), j))], clase: j === d ? 'ap-hi' : '' };
          }), { thPrimera: true });
        return h;
      });
  };

  /* ---------- 3.2 · propagación de errores ---------- */
  R.propagacion = function (node) {
    return S.shell(node, 'Propagación de errores al operar',
      'Escribe dos cantidades aproximadas con su cota de error, en decimales con coma. ' +
      'Ejemplo: <code>7,4</code> con cota <code>0,05</code> y <code>970</code> con cota <code>5</code>. ' +
      'Elige la operación y observa cómo se propaga el error: en la suma y la resta se suman las cotas ' +
      'absolutas; en el producto y el cociente se suman los errores relativos.',
      [ { id: 'a', label: 'Valor a', type: 'text', value: '7,4', place: '7,4', ancho: '110px' },
        { id: 'ea', label: 'Cota de a', type: 'text', value: '0,05', place: '0,05', ancho: '110px' },
        { id: 'op', label: 'Operación', type: 'select', value: '*', options: [
          { value: '+', label: '+  suma' }, { value: '-', label: '−  resta' },
          { value: '*', label: '·  producto' }, { value: '/', label: ':  cociente' } ] },
        { id: 'b', label: 'Valor b', type: 'text', value: '970', place: '970', ancho: '110px' },
        { id: 'eb', label: 'Cota de b', type: 'text', value: '5', place: '5', ancho: '110px' },
        { type: 'presets', list: [
          { label: 'Radio 7,0 ± 0,05 (cm)', apply: function (c) { c.a.value = '7'; c.ea.value = '0,05'; c.b.value = '7'; c.eb.value = '0,05'; c.op.value = '*'; } },
          { label: 'Suma de 5 paquetes', title: 'medio kilo con balanza de 50 g', apply: function (c) { c.a.value = '2'; c.ea.value = '0,2'; c.b.value = '0,5'; c.eb.value = '0,05'; c.op.value = '+'; } },
          { label: 'Resta de poblaciones', apply: function (c) { c.a.value = '47600000'; c.ea.value = '50000'; c.b.value = '46700000'; c.eb.value = '50000'; c.op.value = '-'; } },
          { label: 'PIB por habitante', apply: function (c) { c.a.value = '1460000'; c.ea.value = '5000'; c.b.value = '47,6'; c.eb.value = '0,05'; c.op.value = '/'; } }
        ] } ],
      function (v) {
        var a = S.real(v.a, -1e12, 1e12, 'El valor de a');
        var b = S.real(v.b, -1e12, 1e12, 'El valor de b');
        var ea = S.real(v.ea, 0, 1e12, 'La cota de error de a');
        var eb = S.real(v.eb, 0, 1e12, 'La cota de error de b');
        var op = String(v.op);
        if (op === '/' && Math.abs(b) <= eb) throw Error('Con esa cota el divisor podría ser 0: reduce la cota de error de b o cambia b.');
        if (op === '/' && b === 0) throw Error('No se puede dividir entre 0.');

        var p = S.propaga(a, ea, b, eb, op);
        var simb = op === '*' ? '\\cdot' : (op === '/' ? ':' : op);
        var dprec = Math.max(2, decSegun(p.cota));
        var era = Math.abs(a) > 0 ? ea / Math.abs(a) : Infinity;
        var erb = Math.abs(b) > 0 ? eb / Math.abs(b) : Infinity;
        var err = Math.abs(p.val) > 0 ? p.cota / Math.abs(p.val) : Infinity;

        var h = S.resultado(K(kf(p.val, dprec) + ' \\pm ' + kf(p.cota, dprec)), 'resultado con su cota de error');

        h += S.paso(1, 'Datos de partida: ' +
          KD(tFix(a, decSegun(ea)) + ' \\pm ' + kf(ea, decSegun(ea)) + ' \\qquad ' +
             tFix(b, decSegun(eb)) + ' \\pm ' + kf(eb, decSegun(eb))) +
          'Es decir, ' + K('a \\in [' + kf(a - ea, decSegun(ea)) + ',\\, ' + kf(a + ea, decSegun(ea)) + ']') + ' y ' +
          K('b \\in [' + kf(b - eb, decSegun(eb)) + ',\\, ' + kf(b + eb, decSegun(eb)) + ']') + '.');
        h += S.paso(2, p.regla);
        h += S.paso(3, 'Operación y cota: ' +
          KD(kf(a, 6) + ' \\;' + simb + '\\; ' + kf(b, 6) + ' = ' + kf(p.val, dprec) +
             ' \\qquad E_a \\le ' + kf(p.cota, dprec)), 'ap-paso-clave');
        h += S.paso(4, 'El resultado se escribe con la precisión que la cota permite: no tiene sentido dar más cifras ' +
          'de las que la cota garantiza. Aquí basta con ' +
          K(kf(p.val, dprec) + ' \\pm ' + kf(p.cota, dprec)) + '.');

        h += S.tabla(['Magnitud', 'Valor', 'Cota absoluta', 'Cota relativa'],
          [ ['a', nc(a, 6), nc(ea, 8), nc(era * 100, 3) + ' %'],
            ['b', nc(b, 6), nc(eb, 8), nc(erb * 100, 3) + ' %'],
            { celdas: ['resultado', nc(p.val, dprec), nc(p.cota, dprec), nc(err * 100, 3) + ' %'],
              clase: err > Math.max(era, erb) ? 'ap-paso-avi' : 'ap-ok-row' } ],
          { thPrimera: true });

        h += '<div class="mx-info">' +
          (err > Math.max(era, erb)
            ? 'Fíjate: la cota relativa del resultado (' + nc(err * 100, 3) + ' %) es <b>mayor</b> que la de los datos. ' +
              'Al operar se ha <b>perdido precisión</b>, y encadenar muchas operaciones puede hacer el error intolerable.'
            : 'En este caso la cota relativa del resultado no supera la de los datos, pero en general operar ' +
              'siempre puede empeorar la precisión, sobre todo al restar cantidades parecidas.') +
          '</div>';

        var pasoR = p.cota / 2 || 1;
        h += S.rectaReal({
          min: p.val - 2.2 * p.cota - (p.cota ? 0 : 1), max: p.val + 2.2 * p.cota + (p.cota ? 0 : 1),
          W: 1050, H: 320, paso: pasoR, dec: decSegun(pasoR),
          tramos: [{ a: p.val - p.cota, b: p.val + p.cota, col: 'rgba(106,61,154,.20)', alto: 26, borde: COL.morado }],
          puntos: [{ x: p.val, tex: kf(p.val, dprec), col: COL.morado, arriba: true }],
          titulo: 'Intervalo de incertidumbre del resultado',
          label: 'Propagación del error sobre la recta real',
          cap: 'Todo punto de la banda morada es un resultado posible compatible con los datos. ' +
               'La anchura de la banda es el doble de la cota de error absoluto.'
        });
        return h;
      });
  };

  S.extraB = true;
})();
