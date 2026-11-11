import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, collection, getDocs,
  addDoc, updateDoc, serverTimestamp, Timestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import firebaseConfig from "./firebase-config.js";

const configured = Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
const gate = document.getElementById("authGate");
const status = document.getElementById("authStatus");
const form = document.getElementById("authForm");
const familyBox = document.getElementById("authFamily");
const inviteBox = document.getElementById("authInvite");
const memberList = document.getElementById("authMembers");
const inviteLink = document.getElementById("authInviteLink");
const inviteEmail = document.getElementById("authInviteEmail");
const inviteIdFromUrl = new URLSearchParams(location.search).get("convite");

let auth = null, db = null, currentUser = null, currentFamilyId = null;
const setStatus = (message, error = false) => {
  if (!status) return;
  status.textContent = message;
  status.dataset.error = error ? "true" : "false";
};
const show = (id, yes) => { const el=document.getElementById(id); if(el) el.hidden=!yes; };
const cleanEmail = value => String(value || "").trim().toLowerCase();
const familyRef = id => doc(db, "families", id);
const userRef = uid => doc(db, "users", uid);

async function loadFamily() {
  const userDoc = await getDoc(userRef(currentUser.uid));
  currentFamilyId = userDoc.exists() ? userDoc.data().familyId || null : null;
  show("authFamily", true);
  show("authCreateFamily", !currentFamilyId);
  show("authInvite", Boolean(currentFamilyId));
  if (!currentFamilyId) {
    setStatus("Conta conectada. Crie sua família para gerar um convite.");
    return;
  }
  const members = await getDocs(collection(db, "families", currentFamilyId, "members"));
  memberList.innerHTML = "";
  members.forEach(item => {
    const data=item.data();
    const li=document.createElement("li");
    li.textContent = (data.displayName || data.email || "Membro") + (data.uid===currentUser.uid ? " (você)" : "");
    memberList.appendChild(li);
  });
  setStatus("Conta conectada à família. Convide a outra pessoa pelo e-mail.");
}

async function createFamily() {
  const name=(document.getElementById("authFamilyName").value || "Minha família").trim();
  const familyId=crypto.randomUUID();
  const batch=writeBatch(db);
  batch.set(familyRef(familyId), {ownerId:currentUser.uid,name,createdAt:serverTimestamp()});
  batch.set(doc(db,"families",familyId,"members",currentUser.uid), {
    uid:currentUser.uid,email:currentUser.email,displayName:currentUser.displayName || "Administrador",
    role:"owner",joinedAt:serverTimestamp()
  });
  batch.set(userRef(currentUser.uid), {
    email:currentUser.email,displayName:currentUser.displayName || "",
    familyId,updatedAt:serverTimestamp()
  });
  await batch.commit();
  await loadFamily();
}

async function sendInvite() {
  const email=cleanEmail(inviteEmail.value);
  if (!email || !email.includes("@")) throw new Error("Digite um e-mail válido.");
  if (email===cleanEmail(currentUser.email)) throw new Error("Você não pode convidar o próprio e-mail.");
  const expiresAt=Timestamp.fromDate(new Date(Date.now()+7*24*60*60*1000));
  const invitation=await addDoc(collection(db,"invitations"), {
    familyId:currentFamilyId,inviteeEmail:email,inviterUid:currentUser.uid,
    inviterEmail:currentUser.email,status:"pending",createdAt:serverTimestamp(),expiresAt
  });
  const url=new URL(location.href);
  url.searchParams.set("convite",invitation.id);
  inviteLink.value=url.toString();
  show("authInviteResult",true);
  setStatus("Convite criado. Envie o link para a outra pessoa.");
}

async function acceptInvite(inviteId) {
  const ref=doc(db,"invitations",inviteId);
  const snap=await getDoc(ref);
  if(!snap.exists()) throw new Error("Convite não encontrado.");
  const invite=snap.data();
  if(cleanEmail(invite.inviteeEmail)!==cleanEmail(currentUser.email)) throw new Error("Este convite foi enviado para outro e-mail.");
  if(invite.status!=="pending" || invite.expiresAt.toDate()<new Date()) throw new Error("Este convite expirou ou já foi utilizado.");
  const batch=writeBatch(db);
  batch.update(ref,{status:"accepted",acceptedBy:currentUser.uid,acceptedAt:serverTimestamp()});
  batch.set(doc(db,"families",invite.familyId,"members",currentUser.uid),{
    uid:currentUser.uid,email:currentUser.email,displayName:currentUser.displayName || "Membro",
    role:"member",joinedAt:serverTimestamp()
  });
  batch.set(userRef(currentUser.uid),{
    email:currentUser.email,displayName:currentUser.displayName || "",
    familyId:invite.familyId,updatedAt:serverTimestamp()
  });
  await batch.commit();
  currentFamilyId=invite.familyId;
  await loadFamily();
  const url=new URL(location.href);url.searchParams.delete("convite");history.replaceState({}, "", url);
  setStatus("Convite aceito. Sua conta agora faz parte da família.");
}

if (!configured) {
  show("authGate", false);
  window.GamaAuth = { configured:false, ready:Promise.resolve(false) };
  console.info("GAMA FINANCE: Firebase ainda não configurado; modo local preservado.");
} else {
  const app=initializeApp(firebaseConfig);
  auth=getAuth(app);db=getFirestore(app);
  show("authGate", true);
  window.GamaAuth = {
    configured:true,
    get user(){return currentUser;},
    get familyId(){return currentFamilyId;},
    signOut:()=>signOut(auth)
  };
  window.dispatchEvent(new CustomEvent("gama-auth-ready"));
  onAuthStateChanged(auth, async user => {
    currentUser=user;
    show("authGate", !user);
    show("authSignedIn", Boolean(user));
    if (!user) { currentFamilyId=null; return; }
    try {
      await loadFamily();
      if (inviteIdFromUrl && !currentFamilyId) {
        show("authAcceptInvite",true);
        document.getElementById("authAcceptInvite").onclick=async()=>{
          try { await acceptInvite(inviteIdFromUrl); show("authAcceptInvite",false); }
          catch(e){setStatus(e.message || "Não foi possível aceitar o convite.",true);}
        };
      }
      window.dispatchEvent(new CustomEvent("gama-authenticated",{detail:{uid:user.uid,email:user.email,familyId:currentFamilyId}}));
    } catch(e) { setStatus(e.message || "Falha ao carregar sua família.",true); }
  });

  document.getElementById("authModeLogin").onclick=()=>{document.getElementById("authSubmit").textContent="Entrar";document.getElementById("authNameField").hidden=true;};
  document.getElementById("authModeCreate").onclick=()=>{document.getElementById("authSubmit").textContent="Criar conta";document.getElementById("authNameField").hidden=false;};
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const email=cleanEmail(document.getElementById("authEmail").value);
    const password=document.getElementById("authPassword").value;
    try {
      if(document.getElementById("authSubmit").textContent==="Criar conta") {
        const credential=await createUserWithEmailAndPassword(auth,email,password);
        const name=document.getElementById("authName").value.trim();
        if(name) await updateProfile(credential.user,{displayName:name});
        await setDoc(userRef(credential.user.uid),{email,displayName:name,familyId:null,updatedAt:serverTimestamp()});
      } else await signInWithEmailAndPassword(auth,email,password);
      setStatus("Acesso realizado.");
    } catch(e) { setStatus(e.message || "Não foi possível autenticar.",true); }
  });
  document.getElementById("authForgot").onclick=async()=>{
    try { await sendPasswordResetEmail(auth,cleanEmail(document.getElementById("authEmail").value));setStatus("Enviamos um link de redefinição para seu e-mail."); }
    catch(e){setStatus(e.message || "Não foi possível enviar o e-mail.",true);}
  };
  document.getElementById("authCreateFamily").onclick=async()=>{
    try { await createFamily(); } catch(e){setStatus(e.message || "Não foi possível criar a família.",true);}
  };
  document.getElementById("authSendInvite").onclick=async()=>{
    try { await sendInvite(); } catch(e){setStatus(e.message || "Não foi possível gerar o convite.",true);}
  };
  document.getElementById("authCopyInvite").onclick=async()=>{
    try { await navigator.clipboard.writeText(inviteLink.value);setStatus("Link do convite copiado."); }
    catch { inviteLink.focus();inviteLink.select();setStatus("Copie o link exibido acima."); }
  };
  document.getElementById("authSignOut").onclick=()=>signOut(auth);
}
