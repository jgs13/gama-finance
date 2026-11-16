const PROJECT_ID="gama-finance-teste";
const MAX_BYTES=8*1024*1024;
const ALLOWED=new Set(["application/pdf","image/jpeg","image/png","image/webp"]);
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,DELETE,OPTIONS","access-control-allow-headers":"authorization,content-type"}});
const b64url=v=>{const r=atob(v.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(v.length/4)*4,"="));return Uint8Array.from(r,c=>c.charCodeAt(0))};
let jwks=null,expires=0;
async function verify(request){
 const h=request.headers.get("authorization")||"",token=h.startsWith("Bearer ")?h.slice(7):"";
 if(!token)throw Error("Faça login para continuar.");
 const p=token.split(".");if(p.length!==3)throw Error("Token inválido.");
 const head=JSON.parse(new TextDecoder().decode(b64url(p[0]))),c=JSON.parse(new TextDecoder().decode(b64url(p[1]))),now=Math.floor(Date.now()/1000);
 if(head.alg!=="RS256"||!head.kid||c.aud!==PROJECT_ID||c.iss!=="https://securetoken.google.com/"+PROJECT_ID||!c.sub||c.exp<=now||c.iat>now+60||c.auth_time>now+60)throw Error("Sessão inválida ou expirada.");
 if(!jwks||Date.now()>expires){const r=await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com");if(!r.ok)throw Error("Falha ao validar sessão.");jwks=await r.json();expires=Date.now()+1800000}
 const j=jwks.keys.find(k=>k.kid===head.kid);if(!j)throw Error("Chave de sessão não reconhecida.");
 const key=await crypto.subtle.importKey("jwk",j,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
 if(!await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,b64url(p[2]),new TextEncoder().encode(p[0]+"."+p[1])))throw Error("Sessão não autenticada.");
 return c;
}
const safe=s=>String(s||"documento").normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,100);
function parseJson(t){const s=String(t||"").trim();try{return JSON.parse(s)}catch{}const m=s.match(/\{[\s\S]*\}/);if(m)try{return JSON.parse(m[0])}catch{}throw Error("Não foi possível organizar os dados extraídos.");}
export default{async fetch(req,env){
 const u=new URL(req.url);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,DELETE,OPTIONS","access-control-allow-headers":"authorization,content-type","access-control-max-age":"86400"}});
 if(u.pathname==="/health")return json({ok:true,service:"gama-finance-documents"});
 let user;try{user=await verify(req)}catch(e){return json({error:e.message},401)}
 const prefix="users/"+user.sub+"/";
 try{
  if(u.pathname==="/upload"&&req.method==="POST"){
   const f=await req.formData(),file=f.get("file");
   if(!(file instanceof File))return json({error:"Selecione um arquivo."},400);
   if(file.size<1||file.size>MAX_BYTES)return json({error:"O arquivo deve ter até 8 MB."},413);
   if(!ALLOWED.has(file.type))return json({error:"Use PDF, JPG, PNG ou WEBP."},415);
   const id=crypto.randomUUID(),key=prefix+id+"/"+safe(file.name);
   await env.DOCUMENTS.put(key,file.stream(),{httpMetadata:{contentType:file.type},customMetadata:{userId:user.sub,originalName:safe(file.name)}});
   return json({id,name:safe(file.name),type:file.type,size:file.size},201);
  }
  if(u.pathname==="/documents"&&req.method==="GET"){
   const l=await env.DOCUMENTS.list({prefix,limit:100});
   return json({documents:l.objects.map(o=>({id:o.key.slice(prefix.length).split("/")[0],name:o.customMetadata?.originalName||o.key.split("/").pop(),size:o.size,uploadedAt:o.uploaded}))});
  }
  const a=u.pathname.match(/^\/documents\/([a-f0-9-]+)\/analyze$/);
  if(a&&req.method==="POST"){
   const id=a[1],l=await env.DOCUMENTS.list({prefix:prefix+id+"/",limit:10}),o=l.objects[0];
   if(!o)return json({error:"Documento não encontrado."},404);
   const file=await env.DOCUMENTS.get(o.key);if(!file)return json({error:"Arquivo não encontrado."},404);
   const converted=await env.AI.toMarkdown({name:o.customMetadata?.originalName||"documento",blob:new Blob([await file.arrayBuffer()],{type:file.httpMetadata?.contentType||"application/octet-stream"})});
   const content=Array.isArray(converted)?converted.map(x=>x.data||"").join("\n"):(converted?.data||"");
   if(!content.trim())return json({error:"Não foi possível ler o arquivo. Tente uma imagem mais nítida."},422);
   const prompt='Extraia dados de documento financeiro brasileiro (holerite, conta de água, energia, internet). Responda SOMENTE JSON válido: {"documentType":"payslip|utility_bill|other","description":"texto curto","category":"Salário|Água|Energia elétrica|Internet|Moradia|Outros","type":"income|expense|unknown","amount":null,"netSalary":null,"grossSalary":null,"dueDate":null,"paymentDate":null,"referenceMonth":null,"company":null,"confidence":"high|medium|low","notes":[]}. Valores numéricos em reais sem símbolo; datas YYYY-MM-DD. Holerite: amount e netSalary devem ser o líquido efetivo a receber, nunca bruto. Conta: amount é total a pagar e dueDate é vencimento. Nunca invente; use null quando ausente. Documento:\n'+content.slice(0,24000);
   const result=await env.AI.run("@cf/meta/llama-3.1-8b-instruct",{messages:[{role:"system",content:"Extraia com rigor. Não invente números. Responda apenas JSON."},{role:"user",content:prompt}],max_tokens:900,temperature:0.1});
   return json({id,extraction:parseJson(result.response||result.result||""),sourceTextLength:content.length});
  }
  const d=u.pathname.match(/^\/documents\/([a-f0-9-]+)$/);
  if(d&&req.method==="DELETE"){const l=await env.DOCUMENTS.list({prefix:prefix+d[1]+"/",limit:20});for(const o of l.objects)await env.DOCUMENTS.delete(o.key);return json({deleted:true})}
  return json({error:"Rota não encontrada."},404);
 }catch(e){return json({error:e.message||"Falha ao processar documento."},500)}
}};