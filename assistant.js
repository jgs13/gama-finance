const API="https://gama-finance-documentos.gamafinance.workers.dev";
const $=id=>document.getElementById(id);
const panel=$("assistantPanel"),fab=$("assistantFab"),messages=$("assistantMessages"),input=$("assistantInput"),status=$("assistantStatus"),send=$("assistantSend");
let history=[],busy=false,sharedLocation=null;
const escapeHtml=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function formatAssistantText(value){return String(value??"").split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g).map(part=>{const m=part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);return m?'<a href="'+escapeHtml(m[2])+'" target="_blank" rel="noopener noreferrer">'+escapeHtml(m[1])+'</a>':escapeHtml(part)}).join("").replace(/\n/g,"<br>")}
function open(){if(!window.GamaAuth?.user){status.textContent="Entre na sua conta para conversar com a IA.";return}panel.hidden=false;fab.hidden=true;input.focus()}
function close(){panel.hidden=true;fab.hidden=false}
function addMessage(role,text){const node=document.createElement("article");node.className="assistant-message "+(role==="user"?"from-user":"from-ai");node.innerHTML='<div class="assistant-bubble">'+(role==="user"?escapeHtml(text).replace(/\n/g,"<br>"):formatAssistantText(text))+'</div>';messages.append(node);messages.scrollTop=messages.scrollHeight}
function setBusy(value){busy=value;send.disabled=value;input.disabled=value;micButton.disabled=value;if(value)stopVoice();status.textContent=value?"Pensando...":""}
async function ask(text){const question=String(text||"").trim();if(!question||busy)return;const welcome=messages.querySelector(".assistant-welcome");welcome?.remove();addMessage("user",question);history.push({role:"user",content:question});input.value="";setBusy(true);try{const user=window.GamaAuth?.user;if(!user)throw Error("Sua sessão expirou. Entre novamente.");const idToken=await user.getIdToken();const context=window.GamaFinance?.getAssistantContext?.()||{};const response=await fetch(API+"/chat",{method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+idToken},body:JSON.stringify({messages:history.slice(-12),context,location:sharedLocation})});let data={};try{data=await response.json()}catch{}if(!response.ok)throw Error(data.error||"Não foi possível obter uma resposta.");const answer=String(data.reply||"Não consegui formular uma resposta.");history.push({role:"assistant",content:answer});addMessage("assistant",answer)}catch(e){history.pop();addMessage("assistant","Não consegui responder agora: "+(e.message||"falha de conexão"));}finally{setBusy(false);input.focus()}}
fab.addEventListener("click",open);$("assistantClose").addEventListener("click",close);
$("assistantForm").addEventListener("submit",e=>{e.preventDefault();ask(input.value)});
messages.addEventListener("click",e=>{const b=e.target.closest("[data-prompt]");if(b)ask(b.dataset.prompt)});
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("assistantForm").requestSubmit()}});
window.addEventListener("gama-authenticated",()=>{fab.hidden=false});
window.addEventListener("gama-offline-ready",()=>{status.textContent="A conversa com IA precisa de internet."});

/* Ditado por voz no assistente — usa o reconhecimento de fala do Android/Chrome */
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
const micButton=document.createElement("button");
micButton.type="button";micButton.id="assistantMic";micButton.className="assistant-mic";
micButton.textContent="🎙";micButton.setAttribute("aria-label","Gravar mensagem por voz");
micButton.title="Falar com a IA";
$("assistantForm").insertBefore(micButton,send);
let recognition=null,listening=false,voiceFinal="";
function stopVoice(){if(recognition&&listening){try{recognition.stop()}catch{}}}
function voiceState(active){listening=active;micButton.classList.toggle("recording",active);micButton.textContent=active?"■":"🎙";micButton.setAttribute("aria-label",active?"Parar gravação":"Gravar mensagem por voz");}
if(SpeechRecognition){
  recognition=new SpeechRecognition();recognition.lang="pt-BR";recognition.continuous=true;recognition.interimResults=true;
  recognition.onstart=()=>{voiceFinal="";voiceState(true);status.textContent="Ouvindo... fale sua mensagem."};
  recognition.onresult=e=>{let interim="";for(let i=e.resultIndex;i<e.results.length;i++){const part=e.results[i][0]?.transcript||"";if(e.results[i].isFinal)voiceFinal+=part+" ";else interim+=part}input.value=(input.value.replace(/\s+$/,"")+(input.value.trim()&&voiceFinal?" ":"")+voiceFinal+interim).trimStart();status.textContent=interim?"Ouvindo: "+interim:"Voz convertida em texto. Você pode revisar e enviar.";};
  recognition.onerror=e=>{voiceState(false);status.textContent=e.error==="not-allowed"?"Permita o acesso ao microfone nas configurações do navegador.":e.error==="no-speech"?"Não detectei fala. Toque no microfone e tente novamente.":"Não foi possível usar o microfone neste aparelho.";};
  recognition.onend=()=>{voiceState(false);if(!busy&&voiceFinal)status.textContent="Texto transcrito. Revise e toque em enviar.";};
  micButton.addEventListener("click",()=>{if(busy)return;if(listening){stopVoice();return}try{recognition.start()}catch{status.textContent="A gravação já está sendo iniciada. Aguarde."}});
}else{
  micButton.addEventListener("click",()=>{status.textContent="O ditado por voz não está disponível nesta versão do navegador. Atualize o Chrome e tente novamente.";});
}

const locationButton=document.createElement("button");locationButton.type="button";locationButton.className="assistant-location";locationButton.textContent="Compartilhar localização";locationButton.addEventListener("click",()=>{if(!navigator.geolocation){status.textContent="Este aparelho não oferece localização pelo navegador.";return}status.textContent="Aguardando sua permissão de localização...";navigator.geolocation.getCurrentPosition(pos=>{sharedLocation={latitude:pos.coords.latitude,longitude:pos.coords.longitude};locationButton.textContent="Localização compartilhada";status.textContent="Localização disponível para as próximas perguntas.";},err=>{status.textContent=err.code===1?"Permissão de localização negada.":"Não foi possível obter sua localização.";},{enableHighAccuracy:false,timeout:10000,maximumAge:300000})});
$("assistantForm").before(locationButton);
