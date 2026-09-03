/* =====================================================================
   re-applets-c.js · Tema 1 Números reales · 1.º Bachillerato Mates CCSS
   Ruta: 1-BatxMatesCCSS/numeros-reales/assets/re-applets-c.js

   MÓDULO C · apartados 8 y 9 (radicales y logaritmos) y práctica final.

   Claves registradas
     potenciaFraccionaria · simplificaRad · operaRad · sumaRad ·
     racionalizar · comparaRad · logaritmo · propLog · cambioBase ·
     expLog · neperiano · ecuacionesLog · entrenaReales

   Depende del núcleo window.RE (re-applets.js). Sin librerías externas,
   sin módulos, estilo ES5 conservador como el resto del tema.
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

  /* Potencia con BigInt: los radicandos a índice común crecen deprisa
     (por ejemplo 8^3 · 7^2 al pasar a índice 6) y así no se pierde
     ni una cifra por el camino. */
  function bpow(base, exp) {
    var b = BigInt(base), r = 1n;
    for (var i = 0; i < exp; i++) r *= b;
    return r;
  }

  /* Exponentes de la factorización en forma de objeto {primo: exponente} */
  function mapaFact(n) {
    var m = {};
    S.factoriza(n).forEach(function (p) { m[p[0]] = p[1]; });
    return m;
  }

  /* Escribe una potencia en KaTeX omitiendo el exponente 1 */
  function potTex(p, e) { return e === 1 ? String(p) : p + '^{' + e + '}'; }

  /* Radical con coeficiente racional (Frac) delante */
  function radFracTex(fr, idx, dentroTxt) {
    var raiz = (idx === 2 ? '\\sqrt{' + dentroTxt + '}' : '\\sqrt[' + idx + ']{' + dentroTxt + '}');
    if (dentroTxt === '1') return fr.tex();
    if (fr.d === 1n) {
      if (fr.n === 1n) return raiz;
      if (fr.n === -1n) return '-' + raiz;
      return fr.n + raiz;
    }
    var signo = fr.n < 0n ? '-' : '';
    var num = fr.n < 0n ? -fr.n : fr.n;
    return signo + '\\dfrac{' + (num === 1n ? '' : String(num)) + raiz + '}{' + fr.d + '}';
  }

  /* Valor numérico de raíz de índice idx de un BigInt, con logaritmos
     para que no desborde aunque el radicando tenga muchas cifras. */
  function valRaiz(big, idx) {
    var x = Number(big);
    if (!Number.isFinite(x) || x <= 0) return x === 0 ? 0 : NaN;
    return S.casi(Math.exp(Math.log(x) / idx));
  }

  /* Comparación tolerante para las comprobaciones numéricas */
  function casiIgual(a, b, tol) {
    tol = tol || 1e-9;
    return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
  }

  /* Etiqueta «coincide / no coincide» para las tablas de propiedades */
  function coincide(a, b) {
    return casiIgual(a, b, 1e-9) ? S.badge('coincide', 'si') : S.badge('no coincide', 'no');
  }

  /* Lista de enteros escrita por el alumno: "3 2 50; -2 2 8" */
  function bloques(txt, porBloque, nombre, ejemplo) {
    var bruto = String(txt || '').split(/[;\n]+/).map(function (t) { return t.trim(); })
      .filter(function (t) { return t.length; });
    if (!bruto.length) throw Error('Escribe al menos un bloque. ' + ejemplo);
    return bruto.map(function (t) {
      var p = t.split(/[\s,]+/).filter(Boolean);
      if (p.length !== porBloque)
        throw Error('Cada bloque de ' + nombre + ' necesita ' + porBloque + ' números enteros separados por espacios. ' + ejemplo);
      return p.map(function (q, i) { return S.entero(q, -9999, 9999, 'El número ' + (i + 1) + ' del bloque «' + t + '»'); });
    });
  }

  /* ==================================================================
     1 · POTENCIAS DE EXPONENTE FRACCIONARIO  (clave potenciaFraccionaria)
     ================================================================== */
  R.potenciaFraccionaria = function (node) {
    S.shell(node, 'Potencias de exponente fraccionario',
      'Un exponente fraccionario no es más que un radical escrito de otra manera: $a^{m/n} = \\sqrt[n]{a^{m}}$. ' +
      'Escribe la base y las dos partes del exponente con números enteros. Ejemplo: base <code>8</code>, ' +
      'numerador <code>2</code> y denominador <code>3</code> para estudiar $8^{2/3} = \\sqrt[3]{8^{2}}$.',
      [ {id:'a', label:'Base a', type:'number', value:8, min:-999, max:999},
        {id:'m', label:'Numerador m del exponente', type:'number', value:2, min:-30, max:30},
        {id:'n', label:'Denominador n (índice)', type:'number', value:3, min:2, max:12},
        {type:'presets', list:[
          {label:'8^(2/3)', title:'Raíz cúbica exacta', apply:function(c){ c.a.value=8; c.m.value=2; c.n.value=3; }},
          {label:'16^(3/4)', title:'El exponente se puede simplificar', apply:function(c){ c.a.value=16; c.m.value=3; c.n.value=4; }},
          {label:'5^(-1/2)', title:'Exponente negativo: pasa al denominador', apply:function(c){ c.a.value=5; c.m.value=-1; c.n.value=2; }},
          {label:'32^(4/10)', title:'Fracción reducible en el exponente', apply:function(c){ c.a.value=32; c.m.value=4; c.n.value=10; }},
          {label:'-27^(1/3)', title:'Índice impar: sí existe', apply:function(c){ c.a.value=-27; c.m.value=1; c.n.value=3; }}
        ]} ],
      function (v) {
        var a = S.entero(v.a, -999, 999, 'La base');
        var m = S.entero(v.m, -30, 30, 'El numerador del exponente');
        var n = S.entero(v.n, 2, 12, 'El denominador del exponente (el índice)');
        if (a === 0 && m <= 0) throw Error('La base 0 solo admite exponentes positivos: $0^{-1/2}$ no existe.');
        if (a < 0 && n % 2 === 0)
          throw Error('Con base negativa y denominador par la potencia no existe en los reales: $\\sqrt[' + n + ']{' + a + '^{' + m + '}}$ solo tiene sentido si el radicando queda positivo. Cambia el signo de la base o usa un índice impar.');

        var fr = new S.Frac(m, n);              /* exponente reducido */
        var mR = Number(fr.n), nR = Number(fr.d);
        var reducido = (nR !== n || mR !== m);

        /* valor numérico, respetando el signo con índices impares */
        var val;
        if (a < 0) val = (m % 2 === 0 ? 1 : -1) * Math.pow(-a, m / n);
        else val = Math.pow(a, m / n);
        val = S.casi(val);

        var h = '';
        h += KD('a^{m/n} = \\sqrt[n]{a^{m}} = \\left(\\sqrt[n]{a}\\right)^{m}');
        h += '<p class="mx-info">Las dos lecturas dan el mismo número: puedes elevar primero y extraer la raíz después, o extraer la raíz y elevar luego. Suele salir más fácil la segunda.</p>';

        var expTex = (m < 0 ? '-\\dfrac{' + (-m) + '}{' + n + '}' : '\\dfrac{' + m + '}{' + n + '}');
        var pasos = '';
        pasos += S.paso(1, 'Escritura con exponente fraccionario: $' + a + '^{' + expTex + '}$.');
        pasos += S.paso(2, 'Paso a radical: $' + a + '^{' + expTex + '} = ' +
          (m < 0 ? '\\dfrac{1}{\\sqrt[' + n + ']{' + a + '^{' + (-m) + '}}}' : '\\sqrt[' + n + ']{' + a + '^{' + m + '}}') + '$.');
        if (reducido) {
          pasos += S.paso(3, 'La fracción del exponente se puede simplificar: $\\dfrac{' + m + '}{' + n + '} = ' + fr.tex() +
            '$, luego el índice del radical baja de $' + n + '$ a $' + Math.abs(nR) + '$.', 'ap-paso-clave');
        } else {
          pasos += S.paso(3, 'La fracción $\\dfrac{' + m + '}{' + n + '}$ ya es irreducible: el índice no se puede rebajar.');
        }
        var esEntera = Number.isInteger(val);
        pasos += S.paso(4, 'Valor: $' + a + '^{' + expTex + '} = ' + (esEntera ? String(val) : kf(val, 6) + '\\ldots') + '$ ' +
          (esEntera ? '(radical exacto)' : '(número irracional, se escribe aproximado)'), 'ap-paso-clave');
        h += pasos;

        h += S.resultado(K((esEntera ? String(val) : kf(val, 6))),
          'valor de $' + a + '^{' + expTex + '}$');

        /* Tabla de propiedades reutilizadas */
        var f2 = new S.Frac(m, n), f3 = new S.Frac(1, n);
        h += S.tabla(['Propiedad de las potencias', 'Traducida a radicales', 'En este caso'], [
          ['$a^{p}\\cdot a^{q} = a^{p+q}$', '$\\sqrt[n]{a^{m}}\\cdot\\sqrt[n]{a} = \\sqrt[n]{a^{m+1}}$',
            '$' + a + '^{' + expTex + '}\\cdot ' + a + '^{' + f3.tex() + '} = ' + a + '^{' + f2.mas(f3).tex() + '}$'],
          ['$(a^{p})^{q} = a^{pq}$', '$\\sqrt[n]{\\sqrt[k]{a}} = \\sqrt[nk]{a}$',
            '$\\left(' + a + '^{' + expTex + '}\\right)^{' + n + '} = ' + a + '^{' + m + '}$'],
          ['$a^{-p} = \\dfrac{1}{a^{p}}$', '$a^{-m/n} = \\dfrac{1}{\\sqrt[n]{a^{m}}}$',
            '$' + a + '^{-' + (m < 0 ? (-m) + '/' + n : m + '/' + n) + '} = \\dfrac{1}{' + a + '^{' + (m < 0 ? (-m) + '/' + n : m + '/' + n) + '}}$'],
          ['$a^{0} = 1$', '$\\sqrt[n]{a^{0}} = 1$', '$' + a + '^{0} = 1$']
        ], {thPrimera:false});

        h += '<div class="mx-info">Condición de existencia: si el índice $n$ es <b>par</b>, el radicando debe ser mayor o igual que cero; si es <b>impar</b>, vale cualquier número real. ' +
          'Aquí el índice es $' + n + '$ (' + (n % 2 === 0 ? 'par' : 'impar') + ') y el radicando $' + a + '^{' + m + '}$ es ' +
          ((a < 0 && m % 2 !== 0) ? 'negativo' : 'positivo') + '.</div>';
        return h;
      });
  };

  /* ==================================================================
     2 · SIMPLIFICAR, EXTRAER E INTRODUCIR FACTORES  (clave simplificaRad)
     ================================================================== */
  R.simplificaRad = function (node) {
    S.shell(node, 'Simplificación de radicales: extraer e introducir factores',
      'Escribe el coeficiente, el índice y el radicando con números enteros. Ejemplo: coeficiente <code>3</code>, ' +
      'índice <code>2</code> y radicando <code>72</code> para simplificar $3\\sqrt{72}$. ' +
      'El applet factoriza el radicando, saca todo lo que se puede y también hace el camino inverso (introducir factores).',
      [ {id:'k', label:'Coeficiente delante', type:'number', value:3, min:-99, max:99},
        {id:'idx', label:'Índice n', type:'number', value:2, min:2, max:9},
        {id:'n', label:'Radicando', type:'number', value:72, min:-99999, max:99999},
        {type:'presets', list:[
          {label:'√72', apply:function(c){ c.k.value=1; c.idx.value=2; c.n.value=72; }},
          {label:'√108', apply:function(c){ c.k.value=1; c.idx.value=2; c.n.value=108; }},
          {label:'∛54', apply:function(c){ c.k.value=1; c.idx.value=3; c.n.value=54; }},
          {label:'5·⁴√(1250)', apply:function(c){ c.k.value=5; c.idx.value=4; c.n.value=1250; }},
          {label:'∛(-40)', apply:function(c){ c.k.value=1; c.idx.value=3; c.n.value=-40; }}
        ]} ],
      function (v) {
        var k = S.entero(v.k, -99, 99, 'El coeficiente');
        var idx = S.entero(v.idx, 2, 9, 'El índice');
        var n = S.entero(v.n, -99999, 99999, 'El radicando');
        if (k === 0) throw Error('Con coeficiente 0 toda la expresión vale 0: prueba con otro coeficiente, por ejemplo 3.');
        if (n === 0) throw Error('Con radicando 0 la raíz vale 0: prueba con un radicando distinto, por ejemplo 72.');
        var s = S.simplificaRadical(n, idx, k);

        var h = '';
        h += '<p class="mx-instr">Regla: se factoriza el radicando y, para cada primo, se divide su exponente entre el índice. ' +
          'El <b>cociente</b> dice cuántos factores salen fuera y el <b>resto</b> los que se quedan dentro.</p>';
        h += KD('\\sqrt[n]{a^{\\,qn+r}} = a^{q}\\sqrt[n]{a^{\\,r}}');

        h += S.paso(1, 'Factorización del radicando: $' + Math.abs(n) + ' = ' + s.factTex + '$' +
          (n < 0 ? ', con el signo menos delante (el índice es impar, así que la raíz existe)' : '') + '.');

        var filas = s.detalle.map(function (d) {
          return [K(String(d.p)), String(d.e),
            String(d.sale) + (d.sale ? ' (sale $' + potTex(d.p, d.sale) + '$ fuera)' : ' (no sale nada)'),
            String(d.queda) + (d.queda ? ' (queda $' + potTex(d.p, d.queda) + '$ dentro)' : ' (nada dentro)')];
        });
        h += S.tabla(['Primo', 'Exponente', 'Cociente entre el índice ' + idx, 'Resto'], filas, {thPrimera:false});

        var texIni = (k === 1 ? '' : (k === -1 ? '-' : String(k))) + (idx === 2 ? '\\sqrt{' + n + '}' : '\\sqrt[' + idx + ']{' + n + '}');
        var texFin = S.radTex(s.fuera, idx, s.dentro);
        h += S.paso(2, 'Sale fuera $' + (s.fuera / (k || 1)) + '$ y dentro queda $' + s.dentro + '$; el coeficiente $' + k + '$ multiplica a lo que ha salido.', 'ap-paso-clave');
        h += S.paso(3, 'Resultado simplificado: $' + texIni + ' = ' + texFin + '$.', 'ap-paso-clave');

        h += S.resultado(K(texFin), 'forma simplificada de $' + texIni + '$');

        /* Camino inverso: introducir factores dentro del radical */
        var dentroTodo = Math.pow(Math.abs(s.fuera), idx) * s.dentro;
        var signoFuera = s.fuera < 0 ? '-' : '';
        h += '<h5 class="mx-title">Camino inverso: introducir factores</h5>';
        h += '<p class="mx-info">Para meter un factor dentro de una raíz de índice $' + idx + '$ hay que elevarlo a $' + idx + '$: ' +
          '$' + texFin + ' = ' + signoFuera + (idx === 2 ? '\\sqrt{' : '\\sqrt[' + idx + ']{') + Math.abs(s.fuera) + '^{' + idx + '}\\cdot ' + s.dentro + '} = ' +
          signoFuera + (idx === 2 ? '\\sqrt{' : '\\sqrt[' + idx + ']{') + dentroTodo + '}$.</p>';

        h += S.kvs([
          'Valor aproximado: <b>' + nc(k * (n < 0 && idx % 2 === 1 ? -1 : 1) * Math.pow(Math.abs(n), 1 / idx), 6) + '</b>',
          'Raíz exacta: ' + (s.exacta ? S.badge('sí, es un número racional', 'si') : S.badge('no, es irracional', 'avi')),
          'Condición de existencia: ' + (idx % 2 === 0 ? 'índice par, radicando $\\ge 0$' : 'índice impar, cualquier radicando')
        ]);
        return h;
      });
  };

  /* ==================================================================
     3 · PRODUCTO Y COCIENTE CON DISTINTO ÍNDICE  (clave operaRad)
     ================================================================== */
  R.operaRad = function (node) {
    S.shell(node, 'Producto y cociente de radicales de distinto índice',
      'Para multiplicar o dividir radicales hay que reducirlos primero a <b>índice común</b>: el índice común es el m.c.m. de los índices. ' +
      'Escribe los dos radicandos y los dos índices con números enteros. Ejemplo: <code>8</code> con índice <code>2</code> ' +
      'por <code>7</code> con índice <code>3</code>, es decir $\\sqrt{8}\\cdot\\sqrt[3]{7}$.',
      [ {id:'a', label:'Primer radicando', type:'number', value:8, min:1, max:999},
        {id:'i1', label:'Índice del primero', type:'number', value:2, min:2, max:6},
        {id:'op', label:'Operación', type:'select', value:'*',
          options:[{value:'*', label:'producto ·'}, {value:'/', label:'cociente :'}]},
        {id:'b', label:'Segundo radicando', type:'number', value:7, min:1, max:999},
        {id:'i2', label:'Índice del segundo', type:'number', value:3, min:2, max:6},
        {type:'presets', list:[
          {label:'√8 · ∛7', apply:function(c){ c.a.value=8; c.i1.value=2; c.b.value=7; c.i2.value=3; c.op.value='*'; }},
          {label:'∛5 · √3', apply:function(c){ c.a.value=5; c.i1.value=3; c.b.value=3; c.i2.value=2; c.op.value='*'; }},
          {label:'√12 : ∛2', apply:function(c){ c.a.value=12; c.i1.value=2; c.b.value=2; c.i2.value=3; c.op.value='/'; }},
          {label:'⁴√9 · √3', apply:function(c){ c.a.value=9; c.i1.value=4; c.b.value=3; c.i2.value=2; c.op.value='*'; }},
          {label:'√18 : √2', apply:function(c){ c.a.value=18; c.i1.value=2; c.b.value=2; c.i2.value=2; c.op.value='/'; }}
        ]} ],
      function (v) {
        var a = S.entero(v.a, 1, 999, 'El primer radicando');
        var b = S.entero(v.b, 1, 999, 'El segundo radicando');
        var i1 = S.entero(v.i1, 2, 6, 'El primer índice');
        var i2 = S.entero(v.i2, 2, 6, 'El segundo índice');
        var op = String(v.op) === '/' ? '/' : '*';

        var c = S.mcm(i1, i2);
        var p1 = c / i1, p2 = c / i2;

        /* exponentes primo a primo: así el radicando puede crecer todo lo
           que quiera sin perder exactitud ni desbordar. */
        var ex = {};
        var fa = mapaFact(a), fb = mapaFact(b);
        Object.keys(fa).forEach(function (p) { ex[p] = (ex[p] || 0) + fa[p] * p1; });
        Object.keys(fb).forEach(function (p) { ex[p] = (ex[p] || 0) + (op === '*' ? 1 : -1) * fb[p] * p2; });

        var fuera = new S.Frac(1, 1), dentro = 1n, dentroTex = [], primos = Object.keys(ex).map(Number).sort(function (x, y) { return x - y; });
        primos.forEach(function (p) {
          var e = ex[p], q = Math.floor(e / c), r = e - q * c;
          if (q > 0) fuera = fuera.por(new S.Frac(bpow(p, q), 1));
          if (q < 0) fuera = fuera.por(new S.Frac(1, bpow(p, -q)));
          if (r > 0) { dentro *= bpow(p, r); dentroTex.push(potTex(p, r)); }
        });

        var dentroTxt = dentro === 1n ? '1' : String(dentro);
        var finTex = radFracTex(fuera, c, dentroTxt);

        var valA = Math.pow(a, 1 / i1), valB = Math.pow(b, 1 / i2);
        var valor = S.casi(op === '*' ? valA * valB : valA / valB);

        var opTex = op === '*' ? '\\cdot' : ':';
        /* Escribe la raíz sin el índice 2 y sin el exponente 1: así el paso a
           paso se lee igual que en la pizarra cuando los índices coinciden. */
        function rad(idx, cont) { return idx === 2 ? '\\sqrt{' + cont + '}' : '\\sqrt[' + idx + ']{' + cont + '}'; }
        function pot(base, e) { return e === 1 ? String(base) : base + '^{' + e + '}'; }
        var iniTex = rad(i1, a) + ' ' + opTex + ' ' + rad(i2, b);

        var h = '';
        h += KD('\\sqrt[n]{x}\\cdot\\sqrt[n]{y} = \\sqrt[n]{x\\,y}\\qquad\\dfrac{\\sqrt[n]{x}}{\\sqrt[n]{y}} = \\sqrt[n]{\\dfrac{x}{y}}');
        h += S.paso(1, 'Los índices son $' + i1 + '$ y $' + i2 + '$. El índice común es su m.c.m.: $\\text{m.c.m.}(' + i1 + ',' + i2 + ') = ' + c + '$.');
        h += S.paso(2, i1 === i2
          ? 'Los dos índices ya son iguales, así que no hay que reducir nada: se puede operar directamente con índice $' + c + '$.'
          : 'Se divide el índice común entre cada índice y se eleva el radicando a ese cociente: ' +
            '$' + rad(i1, a) + ' = ' + rad(c, pot(a, p1)) + '$ y ' +
            '$' + rad(i2, b) + ' = ' + rad(c, pot(b, p2)) + '$.');
        h += S.paso(3, 'Ya con el mismo índice se ' + (op === '*' ? 'multiplican' : 'dividen') + ' los radicandos: ' +
          '$' + rad(c, pot(a, p1)) + (op === '*' ? '\\cdot' : ':') + rad(c, pot(b, p2)) + ' = ' +
          rad(c, (op === '*' ? pot(a, p1) + '\\cdot ' + pot(b, p2) : '\\dfrac{' + pot(a, p1) + '}{' + pot(b, p2) + '}')) + '$.');
        h += S.paso(4, 'Se factoriza y se simplifica lo que se pueda: ' +
          '$' + iniTex + ' = ' + finTex + '$.', 'ap-paso-clave');
        h += S.resultado(K(finTex), 'resultado de $' + iniTex + '$');

        h += S.tabla(['Paso', 'Expresión'], [
          ['Enunciado', K(iniTex)],
          ['Índice común ' + c, K(rad(c, pot(a, p1)) + (op === '*' ? '\\cdot' : ':') + rad(c, pot(b, p2)))],
          ['Factorizado', dentroTex.length
            ? K(fuera.tex(true) + '\\,' + rad(c, dentroTex.join('\\cdot ')))
            : K(fuera.tex(true)) + ' <span class="ap-key">ya no queda radical</span>'],
          ['Simplificado', K(finTex)],
          ['Valor aproximado', K(kf(valor, 6))]
        ], {thPrimera:true});

        if (fuera.d !== 1n)
          h += '<div class="mx-info">El resultado tiene denominador entero: si además quisieras quitar la raíz del denominador, tendrías que <b>racionalizar</b> (apartado siguiente).</div>';
        h += '<div class="mx-info">Comprobación numérica: $' + kf(valA, 6) + (op === '*' ? '\\cdot' : ':') + kf(valB, 6) + ' = ' + kf(valor, 6) + '$, y la expresión simplificada vale ' +
          nc(fuera.val() * valRaiz(dentro, c), 6) + '.</div>';
        return h;
      });
  };

  /* ==================================================================
     4 · SUMA Y RESTA DE RADICALES SEMEJANTES  (clave sumaRad)
     ================================================================== */
  R.sumaRad = function (node) {
    S.shell(node, 'Suma y resta de radicales semejantes',
      'Dos radicales son <b>semejantes</b> cuando, ya simplificados, tienen el mismo índice y el mismo radicando; solo entonces se pueden sumar. ' +
      'Escribe cada sumando con tres números enteros —coeficiente, índice y radicando— y separa los sumandos con punto y coma. ' +
      'Ejemplo: <code>3 2 50; -2 2 8; 1 3 54</code> significa $3\\sqrt{50} - 2\\sqrt{8} + \\sqrt[3]{54}$.',
      [ {id:'t', label:'Sumandos', type:'text', value:'3 2 50; -2 2 8; 1 3 54', ancho:'320px',
          place:'coef índice radicando; coef índice radicando'},
        {type:'presets', list:[
          {label:'√18+√50+√8', apply:function(c){ c.t.value='1 2 18; 1 2 50; 1 2 8'; }},
          {label:'7√5+15√5-√5', apply:function(c){ c.t.value='7 2 5; 15 2 5; -1 2 5'; }},
          {label:'√4+√9', title:'Cuidado: no se suman los radicandos', apply:function(c){ c.t.value='1 2 4; 1 2 9'; }},
          {label:'3√12-√27', apply:function(c){ c.t.value='3 2 12; -1 2 27'; }},
          {label:'∛54+∛16', apply:function(c){ c.t.value='1 3 54; 1 3 16'; }}
        ]} ],
      function (v) {
        var L = bloques(v.t, 3, 'la suma', 'Ejemplo: 3 2 50; -2 2 8; 1 3 54');
        if (L.length > 6) throw Error('Como máximo 6 sumandos para que la tabla se lea bien.');
        var terms = L.map(function (p) {
          if (p[1] < 2 || p[1] > 9) throw Error('Cada índice debe estar entre 2 y 9. Has escrito ' + p[1] + '.');
          if (p[2] === 0) throw Error('Ningún radicando puede ser 0 en este applet.');
          return { k: p[0], idx: p[1], n: p[2] };
        });
        var res = S.sumaRadicales(terms);

        var h = '';
        h += '<p class="mx-instr">Primero se simplifica cada radical; después se agrupan los que han quedado idénticos sumando solo los coeficientes, como con los monomios semejantes.</p>';
        h += KD('p\\sqrt[n]{a} + q\\sqrt[n]{a} = (p+q)\\sqrt[n]{a}');

        var filas = terms.map(function (t) {
          var s = S.simplificaRadical(t.n, t.idx, t.k);
          return [K(S.radTex(t.k, t.idx, t.n)), K(S.radTex(s.fuera, s.idx, s.dentro)),
            'índice ' + s.idx + ', radicando ' + s.dentro, nc(s.fuera * Math.pow(s.dentro, 1 / s.idx), 5)];
        });
        h += S.tabla(['Sumando', 'Simplificado', 'Clase de semejanza', 'Valor'], filas, {thPrimera:false});

        var grupos = res.grupos.map(function (g) {
          return [K((g.idx === 2 ? '\\sqrt{' : '\\sqrt[' + g.idx + ']{') + g.dentro + '}'),
            String(g.partes.length) + (g.partes.length > 1 ? ' sumandos' : ' sumando'),
            K(String(g.k)), K(S.radTex(g.k, g.idx, g.dentro))];
        });
        h += S.tabla(['Radical común', 'Cuántos', 'Coeficiente total', 'Aportación'], grupos, {thPrimera:false});

        h += S.resultado(K(res.tex), 'suma simplificada');
        h += S.kvs([
          'Valor aproximado: <b>' + nc(res.val, 6) + '</b>',
          'Grupos de semejanza: <b>' + res.grupos.length + '</b>',
          res.grupos.length === 1 ? S.badge('todos semejantes: la suma se reduce a un solo radical', 'si')
            : S.badge('hay ' + res.grupos.length + ' clases distintas: no se pueden juntar más', 'avi')
        ]);
        h += '<div class="mx-info"><b>Error clásico:</b> $\\sqrt{4}+\\sqrt{9} = 2+3 = 5$, mientras que $\\sqrt{4+9} = \\sqrt{13} \\approx 3{,}61$. ' +
          'La raíz <b>no</b> se reparte sobre la suma.</div>';
        return h;
      });
  };

  /* ==================================================================
     5 · RACIONALIZACIÓN  (clave racionalizar)
     ================================================================== */
  R.racionalizar = function (node) {
    S.shell(node, 'Racionalización de denominadores',
      'Racionalizar es escribir una fracción equivalente <b>sin radicales en el denominador</b>. ' +
      'Elige el tipo de denominador y escribe los enteros que lo describen. Ejemplo por defecto: tipo «monomio», numerador <code>6</code>, ' +
      'coeficiente <code>1</code>, índice <code>4</code> y radicando <code>8</code>, es decir $\\dfrac{6}{\\sqrt[4]{8}}$. ' +
      'Con el tipo «binomio» se usa $\\dfrac{N}{a\\sqrt{r_a} + b\\sqrt{r_b}}$ y su conjugado.',
      [ {id:'tipo', label:'Tipo de denominador', type:'select', value:'mono',
          options:[{value:'mono', label:'monomio: raíz de índice n'}, {value:'bino', label:'binomio con raíces cuadradas'}]},
        {id:'N', label:'Numerador N', type:'number', value:6, min:-99, max:99},
        {id:'k', label:'Coef. del monomio', type:'number', value:1, min:1, max:20},
        {id:'idx', label:'Índice n (monomio)', type:'number', value:4, min:2, max:6},
        {id:'n', label:'Radicando (monomio)', type:'number', value:8, min:2, max:200},
        {id:'a', label:'a (binomio)', type:'number', value:1, min:-20, max:20},
        {id:'ra', label:'radicando de a', type:'number', value:3, min:1, max:200},
        {id:'b', label:'b (binomio)', type:'number', value:1, min:-20, max:20},
        {id:'rb', label:'radicando de b', type:'number', value:5, min:1, max:200},
        {type:'presets', list:[
          {label:'6/⁴√8', apply:function(c){ c.tipo.value='mono'; c.N.value=6; c.k.value=1; c.idx.value=4; c.n.value=8; }},
          {label:'1/√2', apply:function(c){ c.tipo.value='mono'; c.N.value=1; c.k.value=1; c.idx.value=2; c.n.value=2; }},
          {label:'5/(2∛3)', apply:function(c){ c.tipo.value='mono'; c.N.value=5; c.k.value=2; c.idx.value=3; c.n.value=3; }},
          {label:'2√3/(3+√5)', apply:function(c){ c.tipo.value='bino'; c.N.value=6; c.a.value=3; c.ra.value=1; c.b.value=1; c.rb.value=5; }},
          {label:'1/(√7-√3)', apply:function(c){ c.tipo.value='bino'; c.N.value=1; c.a.value=1; c.ra.value=7; c.b.value=-1; c.rb.value=3; }}
        ]} ],
      function (v) {
        var tipo = String(v.tipo) === 'bino' ? 'bino' : 'mono';
        var N = S.entero(v.N, -99, 99, 'El numerador');
        if (N === 0) throw Error('Con numerador 0 la fracción vale 0: escribe otro numerador, por ejemplo 6.');
        var res, iniTex, valIni;

        if (tipo === 'mono') {
          var k = S.entero(v.k, 1, 20, 'El coeficiente del denominador');
          var idx = S.entero(v.idx, 2, 6, 'El índice');
          var n = S.entero(v.n, 2, 200, 'El radicando');
          res = S.racionaliza(N, { tipo:'mono', k:k, idx:idx, n:n });
          iniTex = '\\dfrac{' + N + '}{' + (k === 1 ? '' : k) + (idx === 2 ? '\\sqrt{' + n + '}' : '\\sqrt[' + idx + ']{' + n + '}') + '}';
          valIni = N / (k * Math.pow(n, 1 / idx));
        } else {
          var a = S.entero(v.a, -20, 20, 'El coeficiente a');
          var b = S.entero(v.b, -20, 20, 'El coeficiente b');
          var ra = S.entero(v.ra, 1, 200, 'El radicando de a');
          var rb = S.entero(v.rb, 1, 200, 'El radicando de b');
          if (a === 0 || b === 0) throw Error('Para que el denominador sea un binomio, ni $a$ ni $b$ pueden ser 0.');
          var denVal = a * Math.sqrt(ra) + b * Math.sqrt(rb);
          if (Math.abs(denVal) < 1e-9) throw Error('Ese denominador vale 0: cambia los coeficientes.');
          res = S.racionaliza(N, { tipo:'bino', a:a, b:b, ra:ra, rb:rb });
          iniTex = '\\dfrac{' + N + '}{' + S.radTex(a, 2, ra) + (b < 0 ? ' - ' + S.radTex(-b, 2, rb) : ' + ' + S.radTex(b, 2, rb)) + '}';
          valIni = N / denVal;
        }

        var h = '';
        h += '<p class="mx-instr">La idea es siempre la misma: multiplicar arriba y abajo por la expresión que <b>completa una potencia exacta</b> en el denominador. ' +
          'Con un solo radical se completa el exponente hasta el índice; con un binomio se usa el <b>conjugado</b> y la identidad $(x+y)(x-y) = x^2-y^2$.</p>';
        h += KD('\\dfrac{1}{\\sqrt[n]{a^{m}}} = \\dfrac{\\sqrt[n]{a^{\\,n-m}}}{a}\\qquad \\dfrac{1}{\\sqrt{p}+\\sqrt{q}} = \\dfrac{\\sqrt{p}-\\sqrt{q}}{p-q}');

        res.pasos.forEach(function (p, i) { h += S.paso(i + 1, p.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')); });
        h += S.paso(res.pasos.length + 1, 'Resultado racionalizado: $' + iniTex + ' = ' + res.tex + '$.', 'ap-paso-clave');

        h += S.resultado(K(res.tex), 'expresión sin radicales en el denominador');
        h += S.kvs([
          'Valor de la expresión inicial: <b>' + nc(valIni, 8) + '</b>',
          'Valor de la expresión racionalizada: <b>' + nc(res.val, 8) + '</b>',
          casiIgual(valIni, res.val, 1e-8) ? S.badge('las dos expresiones son equivalentes', 'si')
            : S.badge('revisa los datos', 'no')
        ]);
        h += '<div class="mx-info">Racionalizar no cambia el valor de la fracción, solo su aspecto: es una fracción <b>equivalente</b>. ' +
          'Sirve para comparar expresiones, para sumar fracciones con radicales y para calcular a mano sin dividir entre un decimal infinito.</div>';
        return h;
      });
  };

  /* ==================================================================
     6 · COMPARAR RADICALES CON ÍNDICE COMÚN  (clave comparaRad)
     ================================================================== */
  R.comparaRad = function (node) {
    S.shell(node, 'Comparar radicales reduciendo a índice común',
      'Para ordenar radicales de distinto índice se reducen todos al <b>índice común</b> (el m.c.m. de los índices) y se comparan los radicandos. ' +
      'Escribe cada radical con dos números —índice y radicando— separando los radicales con punto y coma. ' +
      'Ejemplo: <code>2 5; 3 11; 4 30</code> compara $\\sqrt{5}$, $\\sqrt[3]{11}$ y $\\sqrt[4]{30}$.',
      [ {id:'t', label:'Radicales', type:'text', value:'2 5; 3 11; 4 30', ancho:'300px', place:'índice radicando; índice radicando'},
        {type:'presets', list:[
          {label:'√5, ∛11, ⁴√30', apply:function(c){ c.t.value='2 5; 3 11; 4 30'; }},
          {label:'√2, ∛3', apply:function(c){ c.t.value='2 2; 3 3'; }},
          {label:'∛2, ⁶√5', apply:function(c){ c.t.value='3 2; 6 5'; }},
          {label:'√3, ⁴√9', title:'Son iguales: radicales equivalentes', apply:function(c){ c.t.value='2 3; 4 9'; }},
          {label:'√7, ∛20, ⁵√100', apply:function(c){ c.t.value='2 7; 3 20; 5 100'; }}
        ]} ],
      function (v) {
        var L = bloques(v.t, 2, 'la comparación', 'Ejemplo: 2 5; 3 11; 4 30');
        if (L.length < 2) throw Error('Escribe al menos dos radicales separados por punto y coma. Ejemplo: 2 5; 3 11');
        if (L.length > 5) throw Error('Como máximo 5 radicales para que la recta real se lea bien.');
        var datos = L.map(function (p) {
          if (p[0] < 2 || p[0] > 6) throw Error('Los índices deben estar entre 2 y 6. Has escrito ' + p[0] + '.');
          if (p[1] < 1 || p[1] > 999) throw Error('Los radicandos deben estar entre 1 y 999 en este applet.');
          return { idx: p[0], n: p[1], val: S.casi(Math.pow(p[1], 1 / p[0])) };
        });
        var c = S.mcm.apply(null, datos.map(function (d) { return d.idx; }));

        datos.forEach(function (d) {
          d.p = c / d.idx;
          d.grande = bpow(d.n, d.p);
          d.tex = S.radTex(1, d.idx, d.n);
        });

        var h = '';
        h += KD('\\sqrt[n]{a} = \\sqrt[np]{a^{p}}\\quad\\text{(radicales equivalentes)}');
        h += S.paso(1, 'Índice común: $\\text{m.c.m.}(' + datos.map(function (d) { return d.idx; }).join(',') + ') = ' + c + '$.');
        h += S.paso(2, 'Cada radical se transforma en uno equivalente de índice $' + c + '$ elevando el radicando al cociente $' + c + ' : n$.');

        var filas = datos.map(function (d) {
          return [K(d.tex), String(d.idx), String(d.p),
            K('\\sqrt[' + c + ']{' + d.grande + '}'), nc(d.val, 8)];
        });
        h += S.tabla(['Radical', 'Índice', 'Exponente nuevo', 'Con índice ' + c, 'Valor'], filas, {thPrimera:false});

        var orden = datos.slice().sort(function (x, y) { return x.val - y.val; });
        var cadena = orden.map(function (d) { return d.tex; }).join(' < ');
        /* si hay empates (radicales equivalentes) se escribe el signo igual */
        cadena = '';
        for (var i = 0; i < orden.length; i++) {
          if (i) cadena += casiIgual(orden[i].val, orden[i - 1].val, 1e-12) ? ' = ' : ' < ';
          cadena += orden[i].tex;
        }
        h += S.paso(3, 'Ya con el mismo índice, manda el radicando: ordenando de menor a mayor queda $' + cadena + '$.', 'ap-paso-clave');
        h += S.resultado(K(cadena), 'orden de menor a mayor');

        var vals = datos.map(function (d) { return d.val; });
        var mn = Math.floor(Math.min.apply(null, vals) * 2) / 2 - 0.5;
        var mx = Math.ceil(Math.max.apply(null, vals) * 2) / 2 + 0.5;
        h += S.rectaReal({
          min: mn, max: mx, W: 1020, H: 240, paso: 0.5, dec: 1,
          puntos: datos.map(function (d, j) {
            return { x: d.val, tex: d.tex, col: [COL.azul, COL.rojo, COL.verde, COL.morado, COL.naranja][j % 5], arriba: j % 2 === 0 };
          }),
          titulo: 'Los radicales sobre la recta real',
          cap: 'Cada punto es un número irracional (salvo que la raíz sea exacta). La recta muestra de un golpe el orden que la tabla justifica.'
        });
        return h;
      });
  };

  /* ==================================================================
     7 · DEFINICIÓN DE LOGARITMO  (clave logaritmo)
     ================================================================== */
  R.logaritmo = function (node) {
    S.shell(node, 'Definición de logaritmo',
      'El logaritmo es un <b>exponente</b>: $\\log_a x = z$ significa exactamente $a^{z} = x$. ' +
      'Escribe la base y el argumento con números (la parte decimal, con coma o con punto). ' +
      'Ejemplo: base <code>2</code> y argumento <code>32</code> para calcular $\\log_2 32$.',
      [ {id:'b', label:'Base a', type:'number', value:2, min:0.02, max:1000, step:0.01},
        {id:'x', label:'Argumento x', type:'number', value:32, min:0.0001, max:1000000, step:0.0001},
        {type:'presets', list:[
          {label:'log₂32', apply:function(c){ c.b.value=2; c.x.value=32; }},
          {label:'log₃81', apply:function(c){ c.b.value=3; c.x.value=81; }},
          {label:'log 1000', apply:function(c){ c.b.value=10; c.x.value=1000; }},
          {label:'log 0,001', apply:function(c){ c.b.value=10; c.x.value=0.001; }},
          {label:'log₅1', apply:function(c){ c.b.value=5; c.x.value=1; }},
          {label:'log₂10', title:'No es entero: el logaritmo es irracional', apply:function(c){ c.b.value=2; c.x.value=10; }}
        ]} ],
      function (v) {
        var b = S.real(v.b, 0.0001, 100000, 'La base');
        var x = S.real(v.x, -1e12, 1e12, 'El argumento');
        if (x <= 0) throw Error('No existe el logaritmo de un número negativo ni de 0: el argumento debe ser mayor que 0, porque una potencia de base positiva nunca da 0 ni un negativo.');
        if (b <= 0 || Math.abs(b - 1) < 1e-12) throw Error('La base debe ser positiva y distinta de 1: con base 1 todas las potencias valen 1 y el logaritmo no estaría definido.');
        var z = S.logb(x, b);
        var exacto = Number.isInteger(z);

        var h = '';
        h += KD('\\log_{a} x = z \\iff a^{z} = x\\qquad (a>0,\\; a\\neq 1,\\; x>0)');
        h += S.paso(1, 'Pregunta que hay que responder: ¿a qué exponente hay que elevar $' + kf(b) + '$ para obtener $' + kf(x) + '$?');
        h += S.paso(2, 'Respuesta: $\\log_{' + kf(b) + '} ' + kf(x) + ' = ' + (exacto ? String(z) : kf(z, 6) + '\\ldots') + '$.', 'ap-paso-clave');
        h += S.paso(3, 'Comprobación con la exponencial: $' + kf(b) + '^{' + kf(z, 6) + '} = ' + kf(Math.pow(b, z), 6) + '$.');
        h += S.resultado(K((exacto ? String(z) : kf(z, 6))), 'valor de $\\log_{' + kf(b) + '} ' + kf(x) + '$');

        /* entre qué potencias enteras de la base está el argumento */
        var pi = Math.floor(z), ps = pi + 1;
        h += S.tabla(['Comprobación', 'Cálculo', 'Resultado'], [
          ['Potencia inferior', K(kf(b) + '^{' + pi + '}'), K(kf(Math.pow(b, pi), 6))],
          ['Argumento', K('x'), K(kf(x, 6))],
          ['Potencia superior', K(kf(b) + '^{' + ps + '}'), K(kf(Math.pow(b, ps), 6))]
        ], {thPrimera:true});
        h += '<div class="mx-info">Por eso el logaritmo está entre $' + pi + '$ y $' + ps + '$: la función exponencial de base mayor que 1 es creciente, así que si $x$ está entre dos potencias consecutivas, su logaritmo está entre los dos exponentes.</div>';

        h += S.kvs([
          '$\\log_{' + kf(b) + '} 1 = 0$ (porque $' + kf(b) + '^{0} = 1$)',
          '$\\log_{' + kf(b) + '} ' + kf(b) + ' = 1$ (porque $' + kf(b) + '^{1} = ' + kf(b) + '$)',
          exacto ? S.badge('logaritmo exacto: es un número entero', 'si') : S.badge('logaritmo aproximado: hace falta la calculadora', 'info'),
          'Dominio: solo los $x>0$ tienen logaritmo'
        ]);
        return h;
      });
  };

  /* ==================================================================
     8 · PROPIEDADES DE LOS LOGARITMOS  (clave propLog)
     ================================================================== */
  R.propLog = function (node) {
    S.shell(node, 'Propiedades de los logaritmos',
      'Las cuatro propiedades convierten productos en sumas, cocientes en restas y potencias en productos. ' +
      'Escribe la base, dos números positivos y un exponente entero. Ejemplo: base <code>2</code>, $x=8$, $y=4$, exponente <code>3</code>.',
      [ {id:'b', label:'Base a', type:'number', value:2, min:0.02, max:1000, step:0.01},
        {id:'x', label:'x', type:'number', value:8, min:0.0001, max:1000000, step:0.0001},
        {id:'y', label:'y', type:'number', value:4, min:0.0001, max:1000000, step:0.0001},
        {id:'p', label:'Exponente / índice p', type:'number', value:3, min:-10, max:10},
        {type:'presets', list:[
          {label:'base 2 · 8 y 4', apply:function(c){ c.b.value=2; c.x.value=8; c.y.value=4; c.p.value=3; }},
          {label:'base 10 · 100 y 5', apply:function(c){ c.b.value=10; c.x.value=100; c.y.value=5; c.p.value=2; }},
          {label:'base 3 · 81 y 27', apply:function(c){ c.b.value=3; c.x.value=81; c.y.value=27; c.p.value=4; }},
          {label:'base e · 20 y 4', apply:function(c){ c.b.value=2.718282; c.x.value=20; c.y.value=4; c.p.value=2; }}
        ]} ],
      function (v) {
        var b = S.real(v.b, 0.0001, 100000, 'La base');
        var x = S.real(v.x, -1e12, 1e12, 'El número x');
        var y = S.real(v.y, -1e12, 1e12, 'El número y');
        var p = S.entero(v.p, -10, 10, 'El exponente');
        if (x <= 0 || y <= 0) throw Error('Los dos números deben ser positivos: solo los números mayores que 0 tienen logaritmo.');
        if (b <= 0 || Math.abs(b - 1) < 1e-12) throw Error('La base debe ser positiva y distinta de 1.');
        if (p === 0) throw Error('Usa un exponente distinto de 0 para que las propiedades de la potencia y de la raíz se vean.');
        var P = S.logProp(b, x, y);
        var pot = P.potencia(p);
        var idxR = Math.abs(p);
        var raizIzq = S.logb(Math.pow(x, 1 / idxR), b), raizDer = P.lx / idxR;

        var h = '';
        h += S.tabla(['Propiedad', 'Enunciado', 'Lado izquierdo', 'Lado derecho', ''], [
          ['Producto', K('\\log_a(xy) = \\log_a x + \\log_a y'), K(kf(P.producto.izq, 6)), K(kf(P.producto.der, 6)), coincide(P.producto.izq, P.producto.der)],
          ['Cociente', K('\\log_a\\dfrac{x}{y} = \\log_a x - \\log_a y'), K(kf(P.cociente.izq, 6)), K(kf(P.cociente.der, 6)), coincide(P.cociente.izq, P.cociente.der)],
          ['Potencia', K('\\log_a x^{p} = p\\log_a x'), K(kf(pot.izq, 6)), K(kf(pot.der, 6)), coincide(pot.izq, pot.der)],
          ['Raíz', K('\\log_a\\sqrt[p]{x} = \\dfrac{1}{p}\\log_a x'), K(kf(raizIzq, 6)), K(kf(raizDer, 6)), coincide(raizIzq, raizDer)]
        ], {thPrimera:true});

        h += '<h5 class="mx-title">Demostración de la propiedad del producto</h5>';
        h += S.paso(1, 'Se llama $A = \\log_a x$ y $B = \\log_a y$. Por definición, $a^{A} = x$ y $a^{B} = y$.');
        h += S.paso(2, 'Se multiplican las dos igualdades: $x\\,y = a^{A}\\cdot a^{B} = a^{A+B}$, usando que al multiplicar potencias de la misma base se suman los exponentes.');
        h += S.paso(3, 'Volviendo a la definición de logaritmo: $\\log_a(x\\,y) = A + B = \\log_a x + \\log_a y$.', 'ap-paso-clave');
        h += '<div class="mx-info">Con la división en el paso 2 sale la propiedad del cociente; elevando a $p$ sale la de la potencia, y como una raíz es una potencia de exponente $1/p$, la de la raíz es un caso particular de la anterior.</div>';

        h += S.kvs([
          '$\\log_{' + kf(b) + '} ' + kf(x) + ' = ' + kf(P.lx, 6) + '$',
          '$\\log_{' + kf(b) + '} ' + kf(y) + ' = ' + kf(P.ly, 6) + '$',
          '$\\log_{' + kf(b) + '}(' + kf(x) + '\\cdot ' + kf(y) + ') = ' + kf(P.producto.izq, 6) + '$'
        ]);
        h += '<div class="mx-info"><b>Cuidado:</b> no existe ninguna propiedad para el logaritmo de una suma. ' +
          '$\\log_a(x+y)$ <b>no</b> es $\\log_a x + \\log_a y$: aquí valdrían $' + kf(S.logb(x + y, b), 6) + '$ y $' + kf(P.lx + P.ly, 6) + '$, que son distintos.</div>';
        return h;
      });
  };

  /* ==================================================================
     9 · CAMBIO DE BASE  (clave cambioBase)
     ================================================================== */
  R.cambioBase = function (node) {
    S.shell(node, 'Cambio de base',
      'La calculadora solo trae $\\log$ (base 10) y $\\ln$ (base $e$). Para cualquier otra base se usa ' +
      '$\\log_a x = \\dfrac{\\log_c x}{\\log_c a}$. Escribe la base original, el argumento y la base intermedia. ' +
      'Ejemplo: base <code>2</code>, argumento <code>11</code> y base intermedia <code>10</code>.',
      [ {id:'a', label:'Base original a', type:'number', value:2, min:0.02, max:1000, step:0.01},
        {id:'x', label:'Argumento x', type:'number', value:11, min:0.0001, max:1000000, step:0.0001},
        {id:'c', label:'Base intermedia c', type:'number', value:10, min:0.02, max:1000, step:0.01},
        {type:'presets', list:[
          {label:'log₂11 con log', apply:function(c){ c.a.value=2; c.x.value=11; c.c.value=10; }},
          {label:'log₂11 con ln', apply:function(c){ c.a.value=2; c.x.value=11; c.c.value=2.718282; }},
          {label:'log₅200', apply:function(c){ c.a.value=5; c.x.value=200; c.c.value=10; }},
          {label:'log₇343', title:'Sale exacto', apply:function(c){ c.a.value=7; c.x.value=343; c.c.value=10; }}
        ]} ],
      function (v) {
        var a = S.real(v.a, 0.0001, 100000, 'La base original');
        var x = S.real(v.x, -1e12, 1e12, 'El argumento');
        var c = S.real(v.c, 0.0001, 100000, 'La base intermedia');
        if (x <= 0) throw Error('El argumento debe ser mayor que 0.');
        if (a <= 0 || Math.abs(a - 1) < 1e-12) throw Error('La base original debe ser positiva y distinta de 1.');
        if (c <= 0 || Math.abs(c - 1) < 1e-12) throw Error('La base intermedia debe ser positiva y distinta de 1.');

        var res = S.logb(x, a);
        var lcx = S.logb(x, c), lca = S.logb(a, c);
        var nombre = Math.abs(c - 10) < 1e-9 ? '\\log' : (Math.abs(c - Math.E) < 1e-4 ? '\\ln' : '\\log_{' + kf(c) + '}');

        var h = '';
        h += KD('\\log_{a} x = \\dfrac{\\log_{c} x}{\\log_{c} a}');
        h += '<h5 class="mx-title">De dónde sale la fórmula</h5>';
        h += S.paso(1, 'Se llama $z = \\log_a x$, que por definición significa $a^{z} = x$.');
        h += S.paso(2, 'Se toman logaritmos en base $c$ en los dos lados: $\\log_c(a^{z}) = \\log_c x$.');
        h += S.paso(3, 'Por la propiedad de la potencia, $z\\,\\log_c a = \\log_c x$, y despejando $z = \\dfrac{\\log_c x}{\\log_c a}$.', 'ap-paso-clave');

        h += S.paso(4, 'En este caso: $\\log_{' + kf(a) + '} ' + kf(x) + ' = \\dfrac{' + nombre + ' ' + kf(x) + '}{' + nombre + ' ' + kf(a) + '} = ' +
          '\\dfrac{' + kf(lcx, 6) + '}{' + kf(lca, 6) + '} = ' + kf(res, 6) + '$.', 'ap-paso-clave');
        h += S.resultado(K(kf(res, 6)), 'valor de $\\log_{' + kf(a) + '} ' + kf(x) + '$');

        h += S.tabla(['Base intermedia', 'Numerador', 'Denominador', 'Cociente'], [
          ['decimal (10)', K(kf(Math.log10(x), 6)), K(kf(Math.log10(a), 6)), K(kf(Math.log10(x) / Math.log10(a), 6))],
          ['neperiana ($e$)', K(kf(Math.log(x), 6)), K(kf(Math.log(a), 6)), K(kf(Math.log(x) / Math.log(a), 6))],
          ['la que has elegido (' + nc(c, 4) + ')', K(kf(lcx, 6)), K(kf(lca, 6)), K(kf(lcx / lca, 6))]
        ], {thPrimera:true});
        h += '<div class="mx-info">Da igual la base intermedia que elijas: el cociente siempre sale el mismo. Esa es la gracia de la fórmula. ' +
          'Comprobación con la exponencial: $' + kf(a) + '^{' + kf(res, 6) + '} = ' + kf(Math.pow(a, res), 6) + '$.</div>';
        return h;
      });
  };

  /* ==================================================================
     10 · ECUACIONES EXPONENCIALES  (clave expLog)
     ================================================================== */
  R.expLog = function (node) {
    S.shell(node, 'Ecuaciones exponenciales resueltas con logaritmos',
      'Cuando la incógnita está en el exponente hay que «bajarla» tomando logaritmos. Se resuelve $A\\cdot b^{x} = C$. ' +
      'Escribe los tres números con la coma decimal si hace falta. Ejemplo: $A=1$, $b=2$ y $C=50$, es decir $2^{x} = 50$.',
      [ {id:'A', label:'Coeficiente A', type:'number', value:1, min:0.01, max:100000, step:0.01},
        {id:'b', label:'Base b', type:'number', value:2, min:0.02, max:100, step:0.01},
        {id:'C', label:'Resultado C', type:'number', value:50, min:0.0001, max:1000000, step:0.01},
        {type:'presets', list:[
          {label:'2^x = 50', apply:function(c){ c.A.value=1; c.b.value=2; c.C.value=50; }},
          {label:'3^x = 81', title:'Sale exacto', apply:function(c){ c.A.value=1; c.b.value=3; c.C.value=81; }},
          {label:'1000·1,02^x = 1500', title:'Interés compuesto', apply:function(c){ c.A.value=1000; c.b.value=1.02; c.C.value=1500; }},
          {label:'5·2^x = 320', apply:function(c){ c.A.value=5; c.b.value=2; c.C.value=320; }},
          {label:'0,5^x = 0,125', apply:function(c){ c.A.value=1; c.b.value=0.5; c.C.value=0.125; }}
        ]} ],
      function (v) {
        var A = S.real(v.A, -1e9, 1e9, 'El coeficiente A');
        var b = S.real(v.b, 0.0001, 1000, 'La base');
        var C = S.real(v.C, -1e12, 1e12, 'El resultado C');
        if (A === 0) throw Error('Con $A = 0$ el miembro izquierdo vale siempre 0: la ecuación no tiene incógnita.');
        if (b <= 0 || Math.abs(b - 1) < 1e-12) throw Error('La base debe ser positiva y distinta de 1.');
        if (C / A <= 0) throw Error('Una potencia de base positiva es siempre positiva, así que $C/A$ debe ser mayor que 0. Con estos datos la ecuación no tiene solución real.');

        var razon = C / A;
        var x0 = S.logb(razon, b);
        var exacto = Number.isInteger(S.casi(x0));

        var h = '';
        h += S.paso(1, 'Se aísla la potencia: $' + kf(A) + '\\cdot ' + kf(b) + '^{x} = ' + kf(C) + ' \\Rightarrow ' + kf(b) + '^{x} = \\dfrac{' + kf(C) + '}{' + kf(A) + '} = ' + kf(razon, 6) + '$.');
        h += S.paso(2, 'Se toman logaritmos en los dos miembros (vale cualquier base; se suele usar la decimal): $\\log\\left(' + kf(b) + '^{x}\\right) = \\log ' + kf(razon, 6) + '$.');
        h += S.paso(3, 'La propiedad de la potencia baja la incógnita: $x\\,\\log ' + kf(b) + ' = \\log ' + kf(razon, 6) + '$.');
        h += S.paso(4, 'Se despeja: $x = \\dfrac{\\log ' + kf(razon, 6) + '}{\\log ' + kf(b) + '} = \\log_{' + kf(b) + '} ' + kf(razon, 6) + ' = ' + kf(x0, 6) + '$.', 'ap-paso-clave');
        h += S.paso(5, 'Comprobación: $' + kf(A) + '\\cdot ' + kf(b) + '^{' + kf(x0, 6) + '} = ' + kf(A * Math.pow(b, x0), 6) + '$, que es $C$.');

        h += S.resultado(K((exacto ? String(S.casi(x0)) : kf(x0, 6))), 'solución de $' + kf(A) + '\\cdot ' + kf(b) + '^{x} = ' + kf(C) + '$');

        /* Gráfica: la exponencial cortando a la recta horizontal y = C */
        var xr = Math.max(2, Math.abs(x0));
        var xmin = Math.floor(Math.min(-1, x0 - xr * 0.6));
        var xmax = Math.ceil(Math.max(1, x0 + xr * 0.6));
        var ymax = Math.max(C * 1.6, A * Math.pow(b, xmax));
        if (!Number.isFinite(ymax) || ymax > 1e7) ymax = C * 2;
        h += S.ejes({
          xmin: xmin, xmax: xmax, ymin: 0, ymax: ymax, W: 1000, H: 560,
          paso: Math.max(1, Math.round((xmax - xmin) / 10)),
          pasoY: Math.max(1, Math.round(ymax / 8)),
          curvas: [
            { f: function (t) { return A * Math.pow(b, t); }, col: COL.azul, label: 'y = ' + kf(A) + '\\cdot ' + kf(b) + '^{x}', lx: 90, ly: 80 },
            { f: function () { return C; }, col: COL.rojo, dash: '8 6', label: 'y = ' + kf(C), lx: 90, ly: 130 }
          ],
          puntos: [{ x: x0, y: C, tex: 'x = ' + kf(x0, 4), col: COL.verde }],
          cap: 'Resolver la ecuación exponencial es buscar la abscisa del punto en el que la curva alcanza la altura $C$. La curva es creciente si la base es mayor que 1 y decreciente si está entre 0 y 1, así que la solución es única.'
        });

        h += '<div class="mx-info"><b>Aplicación.</b> Con $A$ igual al capital inicial, $b = 1+r$ y $C$ el montante, la misma cuenta responde a ' +
          '«¿cuántos años tarda un capital en llegar a cierta cantidad al $r$ por uno de interés compuesto?»: $t = \\dfrac{\\log(C/A)}{\\log(1+r)}$.</div>';
        return h;
      });
  };

  /* ==================================================================
     11 · LOGARITMOS NEPERIANOS Y CRECIMIENTO  (clave neperiano)
     ================================================================== */
  R.neperiano = function (node) {
    S.shell(node, 'Logaritmos neperianos y el número e',
      'El número $e = 2{,}718281828\\ldots$ es irracional y es la base de los logaritmos neperianos, que se escriben $\\ln$. ' +
      'Escribe un número positivo para calcular su logaritmo neperiano y los datos de un crecimiento continuo $P = P_0e^{rt}$. ' +
      'Ejemplo: $x = 20$, población inicial <code>30</code> millones, tasa <code>2</code> % y <code>20</code> años.',
      [ {id:'x', label:'Número x', type:'number', value:20, min:0.0001, max:1000000, step:0.0001},
        {id:'P0', label:'Valor inicial P₀', type:'number', value:30, min:0.01, max:1000000, step:0.01},
        {id:'r', label:'Tasa anual r (%)', type:'number', value:2, min:-50, max:200, step:0.1},
        {id:'t', label:'Tiempo t (años)', type:'number', value:20, min:0, max:500, step:0.5},
        {type:'presets', list:[
          {label:'ln 20', apply:function(c){ c.x.value=20; }},
          {label:'ln e', apply:function(c){ c.x.value=2.718282; }},
          {label:'ln 1', apply:function(c){ c.x.value=1; }},
          {label:'población 2 %', apply:function(c){ c.P0.value=30; c.r.value=2; c.t.value=20; }},
          {label:'bacterias 35 %', apply:function(c){ c.P0.value=1; c.r.value=35; c.t.value=10; }}
        ]} ],
      function (v) {
        var x = S.real(v.x, -1e12, 1e12, 'El número x');
        var P0 = S.real(v.P0, 0.0001, 1e9, 'El valor inicial');
        var r = S.real(v.r, -99, 500, 'La tasa') / 100;
        var t = S.real(v.t, 0, 1000, 'El tiempo');
        if (x <= 0) throw Error('El logaritmo neperiano solo existe para números mayores que 0.');

        var ln = S.casi(Math.log(x)), ex = Math.exp(x > 30 ? 30 : x);
        var P = P0 * Math.exp(r * t);
        var dobla = r > 0 ? Math.log(2) / r : NaN;

        var h = '';
        h += KD('\\ln x = \\log_{e} x \\iff e^{\\ln x} = x, \\qquad e = 2{,}718281828\\ldots');
        h += S.kvs([
          '$\\ln ' + kf(x) + ' = ' + kf(ln, 6) + '$',
          '$\\log ' + kf(x) + ' = ' + kf(Math.log10(x), 6) + '$',
          '$\\dfrac{\\ln ' + kf(x) + '}{\\ln 10} = ' + kf(Math.log(x) / Math.log(10), 6) + '$ (cambio de base)',
          '$e^{' + kf(Math.min(x, 30)) + '} = ' + kf(ex, 4) + '$'
        ]);

        h += S.ejes({
          xmin: -2, xmax: 6, ymin: -3, ymax: 6, W: 1000, H: 600, paso: 1, pasoY: 1,
          curvas: [
            { f: function (u) { return Math.exp(u); }, col: COL.azul, label: 'y = e^{x}', lx: 620, ly: 90 },
            { f: function (u) { return u > 0 ? Math.log(u) : NaN; }, col: COL.rojo, label: 'y = \\ln x', lx: 700, ly: 330 },
            { f: function (u) { return u; }, col: COL.gris, dash: '6 6', label: 'y = x', lx: 500, ly: 150 }
          ],
          puntos: [{ x: 1, y: 0, tex: '(1,0)', col: COL.rojo }, { x: 0, y: 1, tex: '(0,1)', col: COL.azul }],
          cap: 'La exponencial y el logaritmo neperiano son funciones inversas: sus gráficas son simétricas respecto de la recta $y = x$. La exponencial pasa por $(0,1)$ y el logaritmo por $(1,0)$; el logaritmo solo existe para $x>0$ y baja hacia $-\\infty$ cuando $x$ se acerca a 0.'
        });

        h += '<h5 class="mx-title">Crecimiento continuo</h5>';
        h += KD('P = P_{0}\\,e^{r t}\\qquad\\Longrightarrow\\qquad t = \\dfrac{1}{r}\\ln\\dfrac{P}{P_{0}}');
        h += S.paso(1, 'Con $P_0 = ' + kf(P0) + '$, $r = ' + kf(r, 4) + '$ y $t = ' + kf(t) + '$ años: $P = ' + kf(P0) + '\\cdot e^{' + kf(r, 4) + '\\cdot ' + kf(t) + '} = ' + kf(P, 4) + '$.', 'ap-paso-clave');
        h += S.paso(2, 'Para saber cuánto tarda en duplicarse se despeja el tiempo: $t = \\dfrac{\\ln 2}{r}' +
          (r > 0 ? ' = \\dfrac{0{,}6931}{' + kf(r, 4) + '} = ' + kf(dobla, 3) + '$ años' : '$, que solo tiene sentido si la tasa es positiva') + '.');
        h += S.resultado(K(kf(P, 4)), 'valor al cabo de $' + kf(t) + '$ años');
        h += '<div class="mx-info">Este modelo describe poblaciones sin límites de alimento o espacio, la reproducción de bacterias por fisión binaria o un capital con capitalización continua. ' +
          'En cuanto aparecen limitaciones el crecimiento deja de ser exponencial y se estabiliza.</div>';
        return h;
      });
  };

  /* ==================================================================
     12 · ECUACIONES LOGARÍTMICAS  (clave ecuacionesLog)
     ================================================================== */
  R.ecuacionesLog = function (node) {
    S.shell(node, 'Ecuaciones logarítmicas',
      'Se resuelven dos tipos. Tipo A: $\\log_b(ax+c) = m$, que se pasa a forma exponencial. ' +
      'Tipo B: $\\log_b x + \\log_b(x+k) = m$, donde primero se junta la suma en un solo logaritmo. ' +
      'Escribe los datos con enteros. Ejemplo del tipo A: base <code>2</code>, $a=1$, $c=6$, $m=3$, es decir $\\log_2(x+6) = 3$.',
      [ {id:'tipo', label:'Tipo de ecuación', type:'select', value:'A',
          options:[{value:'A', label:'A · log_b(ax+c) = m'}, {value:'B', label:'B · log_b x + log_b(x+k) = m'}]},
        {id:'b', label:'Base b', type:'number', value:2, min:2, max:100},
        {id:'a', label:'a (tipo A)', type:'number', value:1, min:-50, max:50},
        {id:'c', label:'c (tipo A)', type:'number', value:6, min:-500, max:500},
        {id:'k', label:'k (tipo B)', type:'number', value:6, min:-500, max:500},
        {id:'m', label:'m (valor del logaritmo)', type:'number', value:3, min:-10, max:10},
        {type:'presets', list:[
          {label:'log₂(x+6)=3', apply:function(c){ c.tipo.value='A'; c.b.value=2; c.a.value=1; c.c.value=6; c.m.value=3; }},
          {label:'log(2x-1)=2', apply:function(c){ c.tipo.value='A'; c.b.value=10; c.a.value=2; c.c.value=-1; c.m.value=2; }},
          {label:'log₂x+log₂(x+6)=4', apply:function(c){ c.tipo.value='B'; c.b.value=2; c.k.value=6; c.m.value=4; }},
          {label:'log x+log(x+3)=1', apply:function(c){ c.tipo.value='B'; c.b.value=10; c.k.value=3; c.m.value=1; }}
        ]} ],
      function (v) {
        var tipo = String(v.tipo) === 'B' ? 'B' : 'A';
        var b = S.entero(v.b, 2, 100, 'La base');
        var m = S.entero(v.m, -10, 10, 'El valor m del logaritmo');
        var pot = Math.pow(b, m);
        var h = '';
        h += '<p class="mx-instr">Regla de oro: toda ecuación logarítmica se resuelve pasando a <b>un solo logaritmo</b> en cada miembro y aplicando después la definición. ' +
          'Y al final hay que <b>comprobar el dominio</b>: los argumentos deben quedar positivos.</p>';

        if (tipo === 'A') {
          var a = S.entero(v.a, -50, 50, 'El coeficiente a');
          var c = S.entero(v.c, -500, 500, 'El término c');
          if (a === 0) throw Error('Con $a = 0$ desaparece la incógnita: escribe otro coeficiente, por ejemplo 1.');
          var x = (pot - c) / a;
          var arg = a * x + c;
          h += S.paso(1, 'Ecuación: $\\log_{' + b + '}(' + (a === 1 ? '' : a) + 'x' + (c < 0 ? ' - ' + (-c) : ' + ' + c) + ') = ' + m + '$.');
          h += S.paso(2, 'Se aplica la definición de logaritmo: $' + (a === 1 ? '' : a) + 'x' + (c < 0 ? ' - ' + (-c) : ' + ' + c) + ' = ' + b + '^{' + m + '} = ' + kf(pot, 6) + '$.');
          h += S.paso(3, 'Se despeja la incógnita: $x = \\dfrac{' + kf(pot, 6) + (c < 0 ? ' + ' + (-c) : ' - ' + c) + '}{' + a + '} = ' + kf(x, 6) + '$.', 'ap-paso-clave');
          h += S.paso(4, 'Comprobación del dominio: el argumento vale $' + kf(arg, 6) + '$, que es ' +
            (arg > 0 ? 'positivo, luego la solución es válida' : 'nulo o negativo, luego la solución hay que rechazarla') + '.',
            arg > 0 ? 'ap-paso-clave' : 'ap-paso-avi');
          h += S.resultado(arg > 0 ? K('x = ' + kf(x, 6)) : K('\\text{sin solución}'), 'solución de la ecuación');
          h += S.kvs([
            'Argumento en la solución: $' + kf(arg, 6) + '$',
            arg > 0 ? S.badge('solución válida', 'si') : S.badge('solución rechazada por el dominio', 'no'),
            'Verificación: $\\log_{' + b + '} ' + kf(arg, 6) + ' = ' + (arg > 0 ? kf(S.logb(arg, b), 6) : '\\text{no existe}') + '$'
          ]);
        } else {
          var k = S.entero(v.k, -500, 500, 'El desplazamiento k');
          h += S.paso(1, 'Ecuación: $\\log_{' + b + '} x + \\log_{' + b + '}(x' + (k < 0 ? ' - ' + (-k) : ' + ' + k) + ') = ' + m + '$.');
          h += S.paso(2, 'La suma de logaritmos es el logaritmo del producto: $\\log_{' + b + '}\\left[x\\,(x' + (k < 0 ? ' - ' + (-k) : ' + ' + k) + ')\\right] = ' + m + '$.');
          h += S.paso(3, 'Definición de logaritmo: $x^{2} ' + (k < 0 ? '- ' + (-k) : '+ ' + k) + 'x = ' + b + '^{' + m + '} = ' + kf(pot, 6) + '$, es decir la ecuación de segundo grado $x^{2} ' +
            (k < 0 ? '- ' + (-k) : '+ ' + k) + 'x - ' + kf(pot, 6) + ' = 0$.');
          var disc = k * k + 4 * pot;
          if (disc < 0) throw Error('El discriminante es negativo: con esos datos la ecuación no tiene soluciones reales.');
          var r1 = (-k + Math.sqrt(disc)) / 2, r2 = (-k - Math.sqrt(disc)) / 2;
          h += S.paso(4, 'Fórmula de la ecuación de segundo grado: $x = \\dfrac{' + (-k) + ' \\pm \\sqrt{' + kf(disc, 6) + '}}{2}$, que da $x_1 = ' + kf(r1, 6) + '$ y $x_2 = ' + kf(r2, 6) + '$.');
          function valida(x) { return x > 0 && x + k > 0; }
          var buenas = [r1, r2].filter(valida);
          h += S.paso(5, 'Comprobación del dominio: hacen falta $x>0$ y $x' + (k < 0 ? ' - ' + (-k) : ' + ' + k) + '>0$. ' +
            (buenas.length === 1 ? 'Solo una de las dos raíces lo cumple: la otra es una <b>solución falsa</b> que hay que rechazar.'
              : (buenas.length ? 'Las dos raíces son válidas.' : 'Ninguna raíz cumple el dominio: la ecuación no tiene solución.')),
            buenas.length ? 'ap-paso-clave' : 'ap-paso-avi');
          h += S.tabla(['Raíz', 'Vale $x$', 'Vale $x' + (k < 0 ? '-' + (-k) : '+' + k) + '$', 'Dominio'], [
            [K('x_1'), K(kf(r1, 6)), K(kf(r1 + k, 6)), valida(r1) ? S.badge('válida', 'si') : S.badge('rechazada', 'no')],
            [K('x_2'), K(kf(r2, 6)), K(kf(r2 + k, 6)), valida(r2) ? S.badge('válida', 'si') : S.badge('rechazada', 'no')]
          ], {thPrimera:false});
          h += S.resultado(buenas.length ? K(buenas.map(function (x) { return 'x = ' + kf(x, 6); }).join(',\\; ')) : K('\\text{sin solución}'),
            'solución de la ecuación');
          if (buenas.length) {
            var xb = buenas[0];
            h += '<div class="mx-info">Verificación con la solución válida: $\\log_{' + b + '} ' + kf(xb, 6) + ' + \\log_{' + b + '} ' + kf(xb + k, 6) + ' = ' +
              kf(S.logb(xb, b) + S.logb(xb + k, b), 6) + '$, que es $m = ' + m + '$.</div>';
          }
        }
        h += '<div class="mx-info"><b>Error frecuente:</b> dar por buena una raíz negativa. En una ecuación logarítmica la comprobación no es opcional: forma parte de la resolución, porque al juntar logaritmos se amplía el dominio.</div>';
        return h;
      });
  };

  /* ==================================================================
     13 · ENTRENADOR DE LA PRÁCTICA FINAL  (clave entrenaReales)
     ================================================================== */
  R.entrenaReales = function (node) {
    var est = { ej: null, bloque: null };

    function ale(n) { return Math.floor(Math.random() * n); }
    function elige(L) { return L[ale(L.length)]; }

    function nuevo(bloque) {
      var e = { bloque: bloque };
      if (bloque === 'racionales') {
        var a = 1 + ale(9), b = 2 + ale(9), c = 1 + ale(9), d = 2 + ale(9);
        var f = new S.Frac(a, b).mas(new S.Frac(c, d));
        e.enun = 'Calcula y simplifica $\\dfrac{' + a + '}{' + b + '} + \\dfrac{' + c + '}{' + d + '}$.';
        e.pista = 'Reduce a común denominador con el m.c.m. de ' + b + ' y ' + d + ', suma los numeradores y simplifica.';
        e.solTex = f.tex();
        e.val = f.val();
        e.formato = 'Escribe la fracción con barra, por ejemplo <code>7/12</code>, o su valor decimal.';
      } else if (bloque === 'notacion') {
        var m1 = 1 + ale(9), e1 = 3 + ale(9), m2 = 1 + ale(9), e2 = 2 + ale(7);
        var x = (m1 * m2) * Math.pow(10, e1 + e2);
        var nc1 = S.notCient(x, 4);
        e.enun = 'Escribe en notación científica el resultado de $(' + m1 + '\\cdot 10^{' + e1 + '}) \\cdot (' + m2 + '\\cdot 10^{' + e2 + '})$.';
        e.pista = 'Multiplica las mantisas, suma los exponentes y ajusta la mantisa al intervalo $[1,10)$.';
        e.solTex = nc1.tex;
        e.val = x;
        e.formato = 'Escribe el número con la letra e para el exponente, por ejemplo <code>3,5e8</code>.';
      } else if (bloque === 'radicales') {
        var p = elige([2, 3, 5, 7]), q = 2 + ale(4), idx = elige([2, 2, 3]);
        var N = Math.pow(q, idx) * p;
        var s = S.simplificaRadical(N, idx, 1);
        e.enun = 'Simplifica $' + (idx === 2 ? '\\sqrt{' + N + '}' : '\\sqrt[' + idx + ']{' + N + '}') + '$ extrayendo todos los factores posibles.';
        e.pista = 'Factoriza ' + N + ' y divide cada exponente entre el índice ' + idx + '.';
        e.solTex = S.radTex(s.fuera, idx, s.dentro);
        e.val = Math.pow(N, 1 / idx);
        e.formato = 'Escribe el valor decimal con cuatro cifras, por ejemplo <code>8,4853</code>; también se admite <code>raiz(2)</code> multiplicado a mano.';
      } else if (bloque === 'logaritmos') {
        var bb = elige([2, 3, 5, 10]), kk = 1 + ale(5);
        var arg = Math.pow(bb, kk);
        e.enun = 'Calcula $\\log_{' + bb + '} ' + arg + '$ usando la definición de logaritmo.';
        e.pista = 'Pregúntate a qué exponente hay que elevar ' + bb + ' para obtener ' + arg + '.';
        e.solTex = String(kk);
        e.val = kk;
        e.formato = 'Escribe un número entero, por ejemplo <code>4</code>.';
      } else {
        var z = (1 + ale(900)) / 1000 + ale(9);          /* número con 4 decimales */
        var red = S.redondea(z, 2);
        e.enun = 'El valor exacto es $' + kf(z, 4) + '$. Se aproxima redondeando a dos decimales. ¿Cuál es el error absoluto cometido?';
        e.pista = 'Redondea primero (' + nc(red, 2) + ') y después calcula la diferencia en valor absoluto.';
        e.solTex = kf(S.errAbs(z, red), 6);
        e.val = S.errAbs(z, red);
        e.formato = 'Escribe el error con coma decimal, por ejemplo <code>0,0023</code>.';
      }
      return e;
    }

    S.shell(node, 'Entrenador de números reales',
      'Elige un bloque, resuelve el ejercicio que aparece y escribe tu resultado para que el applet lo corrija. ' +
      'El botón «Otro ejercicio» genera uno nuevo. Las respuestas se admiten como número decimal con coma o como fracción con barra: ' +
      '<code>0,75</code> o <code>3/4</code>.',
      [ {id:'bloque', label:'Bloque', type:'select', value:'radicales',
          options:[
            {value:'racionales', label:'racionales y fracciones'},
            {value:'notacion', label:'notación científica'},
            {value:'radicales', label:'radicales'},
            {value:'logaritmos', label:'logaritmos'},
            {value:'errores', label:'aproximaciones y errores'}
          ]},
        {id:'resp', label:'Tu respuesta', type:'text', value:'', ancho:'200px', place:'por ejemplo 3/4 o 0,75'},
        {id:'ver', label:'Ver la solución', type:'check', value:false},
        {type:'button', id:'otro', label:'Otro ejercicio', click:function (ctl) {
          est.ej = null;
          if (ctl.resp) ctl.resp.value = '';
          if (ctl.ver) ctl.ver.checked = false;
        }} ],
      function (v, ctl) {
        var bloque = String(v.bloque);
        if (!est.ej || est.bloque !== bloque) { est.ej = nuevo(bloque); est.bloque = bloque; }
        var e = est.ej;

        var h = '<div class="ap-enun">' + e.enun + '</div>';
        h += '<div class="mx-info">Formato de la respuesta: ' + e.formato + '</div>';

        var txt = String(v.resp || '').trim();
        if (txt) {
          var dado = null, msg = '';
          try { dado = S.valorSimbolico(txt).v; }
          catch (x) { msg = x.message; }
          if (dado === null) h += '<div class="ap-ko">No entiendo la respuesta: ' + S.esc(msg) + '</div>';
          else if (casiIgual(dado, e.val, 1e-3)) h += '<div class="ap-ok">' + S.badge('correcto', 'si') + ' Tu respuesta coincide con el resultado esperado.</div>';
          else h += '<div class="ap-ko">' + S.badge('todavía no', 'no') + ' Revisa el cálculo. Pista: ' + e.pista + '</div>';
        } else {
          h += '<div class="mx-info">Pista disponible: ' + e.pista + '</div>';
        }

        if (v.ver === true || v.ver === 'true') {
          h += S.resultado(K(e.solTex), 'solución del ejercicio');
        } else {
          h += '<div class="mx-info">Marca «Ver la solución» solo después de intentarlo: el aprendizaje está en el intento, no en la respuesta.</div>';
        }
        return h;
      });
  };

  S.extraC = true;
})();
