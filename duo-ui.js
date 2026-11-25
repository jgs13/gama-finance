// Duo — widgets visuais. Só lê os dados salvos pelo app.js; não altera lógica financeira.
const KEY="gama-finance-family-v2",$=id=>document.getElementById(id),PAL=["#f5a524","#fb7a1e","#6366f1","#22d3a0","#ec4899","#38bdf8","#a3a3a3"];
const brl=n=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const pad=n=>String(n).padStart(2,"0"),now=new Date(),MONTH=()=>{const d=new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)};
function read(){try{const f=JSON.parse(localStorage.getItem(KEY)||"null");if(!f)return null;const p=(f.profiles||[]).find(x=>x.id===f.scope);return p?{f,p}:{f,p:null}}catch{return null}}
function donut(p){const r=40,c=2*Math.PI*r,v=Math.min(p,100)/100*c,col=p>100?"#ef4444":p>80?"#f5a524":"#d4ff1f";return `<svg viewBox="0 0 100 100" style="width:104px;height:104px;margin-bottom:auto"><circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--card2)" stroke-width="14"/><circle cx="50" cy="50" r="${r}" fill="none" stroke="${col}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${v} ${c}" transform="rotate(-90 50 50)"/></svg>`}
function spark(exp){const days=new Date().getDate(),a=Array(days).fill(0);exp.forEach(x=>{const d=Math.min(Math.max(+String(x.date).slice(8,10)-1,0),days-1);a[d]+=Number(x.amount||0)});let c=0;const cum=a.map(v=>c+=v),mx=Math.max(1,c),W=170,H=64,pts=cum.map((v,i)=>[i/Math.max(1,days-1)*W,H-v/mx*H*.9-4]),l=pts.map(p=>p.join(",")).join(" "),e=pts[pts.length-1];return `<svg viewBox="0 0 ${W+8} ${H}" style="width:100%;height:64px;margin-bottom:14px"><polygon points="0,${H} ${l} ${W},${H}" fill="rgba(212,255,31,.15)"/><polyline points="${l}" fill="none" stroke="#d4ff1f" stroke-width="2.5" stroke-linejoin="round"/><circle cx="${e[0]}" cy="${e[1]}" r="5" fill="#d4ff1f"/></svg>`}
function update(){
  const s=read(),h=new Date().getHours(),hi=h<12?"Bom dia":h<18?"Boa tarde":"Boa noite";
  const name=($("workspaceName")?.textContent||"").trim().split(" ")[0]||"";
  if($("duoGreet"))$("duoGreet").textContent=hi+(name?", "+name:"");
  if($("assistantHello"))$("assistantHello").textContent=name||"você";
  if(!s||!s.p)return;
  const d=s.p.data||{},m=MONTH(),ent=(d.entries||[]).filter(e=>(e.date||"").startsWith(m)&&e.status==="paid");
  const exp=ent.filter(e=>e.type==="expense"),inc=ent.filter(e=>e.type==="income"),sum=a=>a.reduce((n,e)=>n+Number(e.amount||0),0),E=sum(exp),I=sum(inc);
  const cats={};exp.forEach(e=>{const c=e.category||"Outros";cats[c]=(cats[c]||0)+Number(e.amount||0)});
  const list=Object.entries(cats).sort((a,b)=>b[1]-a[1]),tot=list.reduce((n,x)=>n+x[1],0)||1;
  const bud=d.budgets||{},bt=Object.values(bud).reduce((n,v)=>n+Number(v||0),0),bs=list.filter(([c])=>Number(bud[c])>0).reduce((n,x)=>n+x[1],0),bp=bt?bs/bt*100:0;
  const pair=(s.f.profiles||[]).slice(0,2).map(p=>p.name).join(" + ");if($("duoPair"))$("duoPair").textContent=pair||"Casal";
  $("barOut").style.width=(I?Math.min(100,E/I*100):(E?100:0))+"%";
  $("wDonut").innerHTML=donut(bp);$("wBudgetPct").textContent=bp.toFixed(0)+"%";$("wBudgetOf").textContent=bt?"de "+brl(bt):"Defina limites abaixo";
  $("wSpark").innerHTML=spark(exp);$("wSpent").textContent=brl(E);
  $("wCats").innerHTML=list.slice(0,4).map(([c,v],i)=>`<i style="flex:${v/tot};background:${PAL[i]}"></i>`).join("");
  $("wCatCount").textContent=list.length;$("wCatTop").textContent=list[0]?list[0][0]+" lidera":"—";
  const sv=I?(I-E)/I*100:0;$("wSave").textContent=sv.toFixed(1)+"%";$("wSave").className=sv>=0?"positive":"negative";
}
try{if(localStorage.getItem("duo-hide")==="1")document.body.classList.add("hide-values")}catch{}
$("duoEye")?.addEventListener("click",()=>{const on=document.body.classList.toggle("hide-values");try{localStorage.setItem("duo-hide",on?"1":"0")}catch{}});
$("duoInsight")?.addEventListener("click",()=>{$("assistantFab").click();const i=$("assistantInput");if(i&&!$("assistantPanel").hidden){i.value="Gere uma análise do meu mês: 1 ponto forte, 2 riscos (cite categorias estouradas) e 1 ação prática.";$("assistantForm").requestSubmit()}});
["heroBalance","workspaceName","totalExpense","budgetOverview"].forEach(id=>{const el=$(id);if(el)new MutationObserver(update).observe(el,{childList:true,characterData:true,subtree:true})});
window.addEventListener("gama-finance-state-updated",update);window.addEventListener("gama-authenticated",()=>setTimeout(update,300));
update();
