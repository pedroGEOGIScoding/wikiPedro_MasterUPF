/* est1-applets.js · Estadística unidimensional · 2.º Batx
   Ruta: 2-Batx-estadistica/est-uni/assets/est1-applets.js
   Sin OJS, CDN ni auto-render. API pública: window.EST1 */
(function(){'use strict';
const R={},E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),K=t=>'<span data-tex="'+E(t)+'"></span>',KD=t=>'<span data-tex="'+E(t)+'" data-display="1"></span>';
function tex(root){if(!window.katex)return;root.querySelectorAll('[data-tex]').forEach(e=>{if(e.dataset.done)return;try{katex.render(e.dataset.tex,e,{throwOnError:false,displayMode:e.hasAttribute('data-display')});e.dataset.done=1}catch(x){e.textContent=e.dataset.tex}})}
function datos(s){let a=String(s).trim().split(/[\s,;]+/).filter(Boolean).map(Number);if(!a.length||a.some(x=>!Number.isFinite(x)))throw Error('Escribe datos numéricos separados por comas, espacios o saltos de línea. Ejemplo: 2, 0, 3, 4, 0, 1.');return a.sort((x,y)=>x-y)}
function calc(a){let n=a.length,m=a.reduce((s,x)=>s+x,0)/n,v=a.reduce((s,x)=>s+(x-m)**2,0)/n,med=n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2;let f={};a.forEach(x=>f[x]=(f[x]||0)+1);let mx=Math.max(...Object.values(f)),mo=Object.keys(f).filter(x=>f[x]===mx).map(Number);let q=p=>{let z=(n-1)*p,i=Math.floor(z);return a[i]+(z-i)*(a[Math.min(i+1,n-1)]-a[i])};return{n,m,v,sd:Math.sqrt(v),med,mo,q1:q(.25),q3:q(.75),ric:q(.75)-q(.25),min:a[0],max:a[n-1],f}}
function tabla(c){let h='<table class="ap-tbl"><thead><tr><th>xᵢ</th><th>fᵢ</th><th>hᵢ</th><th>Fᵢ</th><th>Hᵢ</th></tr></thead><tbody>',ac=0;Object.keys(c.f).map(Number).sort((a,b)=>a-b).forEach(x=>{let f=c.f[x];ac+=f;h+='<tr><td>'+x+'</td><td>'+f+'</td><td>'+K((f/c.n).toFixed(3))+'</td><td>'+ac+'</td><td>'+K((ac/c.n).toFixed(3))+'</td></tr>'});return h+'</tbody></table>'}
function resumen(c){return '<table class="ap-tbl"><tbody><tr><td>N</td><td>'+c.n+'</td></tr><tr><td>Media</td><td>'+K(c.m.toFixed(3))+'</td></tr><tr><td>Moda</td><td>'+c.mo.join(', ')+'</td></tr><tr><td>Mediana</td><td>'+K(c.med)+'</td></tr><tr><td>Q₁, Q₃</td><td>'+K(c.q1.toFixed(3))+', '+K(c.q3.toFixed(3))+'</td></tr><tr><td>RIC</td><td>'+K(c.ric.toFixed(3))+'</td></tr><tr><td>Recorrido</td><td>'+K(c.max-c.min)+'</td></tr><tr><td>Varianza</td><td>'+K(c.v.toFixed(3))+'</td></tr><tr><td>Desviación típica</td><td>'+K(c.sd.toFixed(3))+'</td></tr><tr><td>CV</td><td>'+K(c.m?((c.sd/c.m)*100).toFixed(2)+'\\%':'no definido')+'</td></tr></tbody></table>'}
function base(n,t,i,fn){n.classList.add('applet');n.innerHTML='<h4 class="mx-title">Applet · '+t+'</h4><div class="mx-instr">'+i+'</div><div class="mx-inputs"><label class="mx-field"><span>Datos</span><textarea class="mx-in" rows="3">2, 0, 3, 4, 0, 1, 2, 3, 0, 2, 4, 0</textarea></label></div><div class="mx-out ap-out"></div>';let input=n.querySelector('textarea'),out=n.querySelector('.mx-out');let run=()=>{try{out.innerHTML=fn(calc(datos(input.value)));tex(out)}catch(e){out.innerHTML='<div class="mx-bad ap-err">'+e.message+'</div>'}};input.addEventListener('input',run);run()}
R.clasificador=n=>{n.classList.add('applet');n.innerHTML='<h4 class="mx-title">Applet · Clasificador de variables</h4><div class="mx-instr">Elige una descripción y comprueba el tipo. La clasificación depende de cómo se registra el dato.</div><select class="mx-in"><option>Número de hermanos</option><option>Estatura medida en centímetros con decimales</option><option>Edad en años cumplidos</option><option>Color de ojos</option><option>Satisfacción: baja, media, alta</option></select><div class="mx-out ap-out"></div>';let s=n.querySelector('select'),o=n.querySelector('.mx-out'),go=()=>{let x=s.value;let r=x.includes('hermanos')||x.includes('cumplidos')?'cuantitativa discreta':x.includes('Estatura')?'cuantitativa continua':x.includes('Satisfacción')?'cualitativa ordinal':'cualitativa nominal';o.innerHTML='<div class="mx-ok"><b>'+r+'</b>. '+(r==='cuantitativa discreta'?'Procede de contar.':r==='cuantitativa continua'?'Entre dos medidas puede haber valores intermedios.':r==='cualitativa ordinal'?'Las categorías tienen orden natural.':'Las categorías no tienen orden natural.')+'</div>'};s.onchange=go;go()};
R.tabla=n=>base(n,'Tabla de frecuencias','Escribe valores individuales; el applet los ordena y completa frecuencias absolutas, relativas y acumuladas.',c=>tabla(c)+'<div class="mx-ok">Comprobación: Σfᵢ = '+c.n+' y Σhᵢ = 1.</div>');
R.centralizacion=n=>base(n,'Media, moda y mediana','Experimenta: cambia un dato extremo y compara cómo reaccionan media y mediana.',c=>resumen(c)+'<div class="mx-info">La media usa todos los datos; la mediana resiste mejor los valores extremos.</div>');
R.atipicos=n=>base(n,'Efecto de valores atípicos','Prueba añadir 100 a los datos. Observa el desplazamiento de media, mediana y dispersión.',c=>'<p>Media '+K(c.m.toFixed(2))+' · mediana '+K(c.med)+' · desviación típica '+K(c.sd.toFixed(2))+'</p><div class="mx-warn">Un extremo arrastra la media y aumenta la dispersión, aunque apenas cambie la mediana.</div>');
R.cuantiles=n=>base(n,'Cuartiles, deciles y percentiles','Escribe datos individuales. Los cuantiles se calculan tras ordenar.',c=>resumen(c)+'<div class="mx-info">Q₁=P₂₅, Q₂=Me=P₅₀ y Q₃=P₇₅. El RIC contiene el 50 % central.</div>');
R.dispersion=n=>base(n,'Laboratorio de dispersión','Compara el recorrido, el RIC, la varianza y la desviación típica.',c=>resumen(c)+'<div class="mx-info">El recorrido usa solo extremos; el RIC ignora la mitad exterior; σ usa todos los datos.</div>');
R.intervalo=n=>base(n,'Intervalo central','Se calcula [x̄−σ,x̄+σ] y cuántos datos caen dentro.',c=>{let lo=c.m-c.sd,hi=c.m+c.sd,k=Object.entries(c.f).reduce((s,[x,f])=>s+(+x>lo&&+x<hi?f:0),0);return resumen(c)+KD('['+lo.toFixed(2)+',\\;'+hi.toFixed(2)+']')+'<div class="mx-ok">Dentro del intervalo: '+k+' de '+c.n+' datos ('+(100*k/c.n).toFixed(1)+' %).</div>'});
R.tipificacion=n=>base(n,'Tipificador de puntuaciones','Escribe datos y selecciona uno de ellos para interpretar su puntuación z.',c=>resumen(c)+'<div class="mx-info">Para un valor x, z=(x−x̄)/σ indica cuántas desviaciones típicas lo separan de la media.</div>');
R.laboratorio=n=>base(n,'Laboratorio estadístico 1D','Una tabla y todos los parámetros calculados de una vez. Úsalo para comprobar el trabajo hecho en papel.',c=>tabla(c)+resumen(c));
['agrupador','interpolacion','graficas','boxplot','entrenador'].forEach(key=>R[key]=n=>base(n,key==='graficas'?'Gráficas estadísticas':key==='boxplot'?'Diagrama de caja y bigotes':key==='agrupador'?'Agrupar datos en intervalos':'Práctica estadística','Introduce datos. Este módulo inicial calcula los parámetros; las visualizaciones avanzadas se incorporan en est1-applets-extra.js.',c=>tabla(c)+resumen(c)));
window.EST1={registry:R,datos,calc,tabla,resumen,tex,log:[]};
function boot(){document.querySelectorAll('[data-applet-est1]').forEach(n=>{if(n.dataset.mounted)return;n.dataset.mounted=1;let f=R[n.dataset.appletEst1];if(!f){n.innerHTML='<div class="mx-bad ap-err">Clave inexistente: '+E(n.dataset.appletEst1)+'</div>';return}try{f(n)}catch(e){n.innerHTML='<div class="mx-bad ap-err">'+E(e.message)+'</div>';EST1.log.push(e)}})}
function startWhenReady(){
  var attempts=0;
  (function waitForExtra(){
    if(window.EST1 && window.EST1.extra===true){
      boot();
      return;
    }
    if(attempts++>=200){
      boot();
      return;
    }
    setTimeout(waitForExtra,10);
  })();
}
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',startWhenReady);
}else{
  startWhenReady();
}
})();