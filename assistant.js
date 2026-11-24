const API="https://gama-finance-documentos.gamafinance.workers.dev";
const $=id=>document.getElementById(id);
const panel=$("assistantPanel"),fab=$("assistantFab"),messages=$("assistantMessages"),input=$("assistantInput"),status=$("assistantStatus"),send=$("assistantSend");
let history=[],busy=false;
const escapeHtml=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function open(){if(!window.GamaAuth?.user){status.textContent="Entre na sua conta para conversar com a IA.";return}panel.hidden=false;fab.hidden=true;input.focus()}
function close(){panel.hidden=true;fab.hidden=false}
function addMessage(role,text){const node=document.createElement("article");node.className="assistant-message "+(role==="user"?"from-user":"from-ai");node.innerHTML='<div class="assistant-bubble">'+escapeHtml(text).replace(/\n/g,"<br>")+'</div>';messages.append(node);messages.scrollTop=messages.scrollHeight}
function setBusy(value){busy=value;send.disabled=value;input.disabled=value;status.textContent=value?"Pensando...":""}
async function ask(text){const question=String(text||"").trim();if(!question||busy)return;const welcome=messages.querySelector(".assistant-welcome");welcome?.remove();addMessage("user",question);history.push({role:"user",content:question});input.value="";setBusy(true);try{const user=window.GamaAuth?.user;if(!user)throw Error("Sua sessão expirou. Entre novamente.");const idToken=await user.getIdToken();const context=window.GamaFinance?.getAssistantContext?.()||{};const response=await fetch(API+"/chat",{method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+idToken},body:JSON.stringify({messages:history.slice(-12),context})});let data={};try{data=await response.json()}catch{}if(!response.ok)throw Error(data.error||"Não foi possível obter uma resposta.");const answer=String(data.reply||"Não consegui formular uma resposta.");history.push({role:"assistant",content:answer});addMessage("assistant",answer)}catch(e){history.pop();addMessage("assistant","Não consegui responder agora: "+(e.message||"falha de conexão"));}finally{setBusy(false);input.focus()}}
fab.addEventListener("click",open);$("assistantClose").addEventListener("click",close);
$("assistantForm").addEventListener("submit",e=>{e.preventDefault();ask(input.value)});
messages.addEventListener("click",e=>{const b=e.target.closest("[data-prompt]");if(b)ask(b.dataset.prompt)});
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("assistantForm").requestSubmit()}});
window.addEventListener("gama-authenticated",()=>{fab.hidden=false});
window.addEventListener("gama-offline-ready",()=>{status.textContent="A conversa com IA precisa de internet."});
