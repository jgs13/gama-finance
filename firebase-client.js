import { initializeApp } from "firebase/app";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import {
  getFirestore, doc, getDoc, setDoc, collection, getDocs, onSnapshot,
  addDoc, serverTimestamp, Timestamp, writeBatch
} from "firebase/firestore";
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
const RECORD_ARRAYS = ["entries", "sources", "cards", "bills", "benefits", "goals"];
const RECORD_LABELS = {
  entries: "Lançamento", sources: "Fonte de renda", cards: "Cartão",
  bills: "Conta", benefits: "Benefício", goals: "Meta"
};

let auth = null, db = null, currentUser = null, currentFamilyId = null, unsubscribeProfiles = null;
const setStatus = (message, error = false) => {
  if (!status) return;
  status.textContent = message;
  status.dataset.error = error ? "true" : "false";
};
const show = (id, yes) => { const el=document.getElementById(id); if(el) el.hidden=!yes; };
const cleanEmail = value => String(value || "").trim().toLowerCase();
const familyRef = id => doc(db, "families", id);
const userRef = uid => doc(db, "users", uid);
const stable = value => JSON.stringify(value ?? null);

async function persistProfiles(profiles) {
  if (!currentUser || !currentFamilyId || !profiles?.length) return;
  for (const profile of profiles) {
    if (!profile.uid) continue;
    const profileRef = doc(db, "families", currentFamilyId, "profiles", profile.uid);
    const previousSnap = await getDoc(profileRef);
    const previous = previousSnap.exists() ? (previousSnap.data().data || {}) : {};
    const next = profile.data || {};
    const auditEvents = [];
    for (const key of RECORD_ARRAYS) {
      const before = new Map((Array.isArray(previous[key]) ? previous[key] : []).map(item => [String(item.id ?? stable(item)), item]));
      const after = new Map((Array.isArray(next[key]) ? next[key] : []).map(item => [String(item.id ?? stable(item)), item]));
      for (const [id, item] of after) {
        const oldItem = before.get(id);
        if (!oldItem) auditEvents.push({action:"record_created", profileUid:profile.uid, recordId:id, summary:RECORD_LABELS[key] + " criado"});
        else if (stable(oldItem) !== stable(item)) auditEvents.push({action:"record_updated", profileUid:profile.uid, recordId:id, summary:RECORD_LABELS[key] + " editado"});
      }
      for (const [id] of before) {
        if (!after.has(id)) auditEvents.push({action:"record_deleted", profileUid:profile.uid, recordId:id, summary:RECORD_LABELS[key] + " excluído"});
      }
    }

    // Firestore batches are limited to 500 writes; keep a margin for safe commits.
    const writes = [];
    writes.push(batch => batch.set(profileRef, {
      uid:profile.uid, email:profile.email || "", displayName:profile.name || "",
      data:next, updatedBy:currentUser.uid, updatedAt:serverTimestamp()
    }, {merge:true}));
    for (const event of auditEvents) {
      const auditRef = doc(collection(db, "families", currentFamilyId, "audit"));
      writes.push(batch => batch.set(auditRef, {
        actorUid:currentUser.uid, actorEmail:currentUser.email || "",
        action:event.action, profileUid:event.profileUid, recordId:event.recordId,
        createdAt:serverTimestamp(), summary:event.summary
      }));
    }
    for (let offset=0; offset<writes.length; offset+=450) {
      const batch=writeBatch(db);
      for (const write of writes.slice(offset,offset+450)) write(batch);
      await batch.commit();
    }
  }
}

async function loadFamily() {
  const userDoc = await getDoc(userRef(currentUser.uid));
  currentFamilyId = userDoc.exists() ? userDoc.data().familyId || null : null;
  show("authGate", !currentFamilyId);
  show("authClose", Boolean(currentFamilyId));
  show("authFamily", true);
  show("authCreateFamilyPanel", !currentFamilyId);
  show("authInvite", Boolean(currentFamilyId));
  if (!currentFamilyId) {
    setStatus("Conta conectada. Crie sua família para gerar um convite.");
    return;
  }
  const members = await getDocs(collection(db, "families", currentFamilyId, "members"));
  memberList.innerHTML = "";
  const memberData=[];
  members.forEach(item => {
    const data={...item.data(),uid:item.id};memberData.push(data);
    const li=document.createElement("li");
    li.textContent = (data.displayName || data.email || "Membro") + (data.uid===currentUser.uid ? " (você)" : "");
    memberList.appendChild(li);
  });
  show("authInvite",memberData.length<2);
  const profileDocs=await getDocs(collection(db,"families",currentFamilyId,"profiles"));
  const cloudProfiles={};profileDocs.forEach(item=>cloudProfiles[item.id]=item.data());
  const missing=window.GamaFinance?.applyCloudMembers(currentUser.uid,memberData,cloudProfiles)||[];
  if(missing.length)await persistProfiles(missing);
  if(unsubscribeProfiles)unsubscribeProfiles();
  unsubscribeProfiles=onSnapshot(collection(db,"families",currentFamilyId,"profiles"),snapshot=>{
    const latest={};snapshot.forEach(item=>latest[item.id]=item.data());
    // Cloud snapshots are authoritative: this propagates deletions as well as additions/edits.
    window.GamaFinance?.applyCloudProfiles(latest);
  },error=>setStatus(error.message||"Falha ao acompanhar sincronização.",true));
  setStatus("Conta conectada à família. Os perfis estão sincronizados pela nuvem.");
}

async function createFamily() {
  const name=(document.getElementById("authFamilyName").value || "Minha família").trim();
  const familyId=crypto.randomUUID();
  const batch=writeBatch(db);
  batch.set(familyRef(familyId), {ownerId:currentUser.uid,name,memberCount:1,createdAt:serverTimestamp()});
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
  if(currentFamilyId)window.dispatchEvent(new CustomEvent("gama-authenticated",{detail:{uid:currentUser.uid,email:currentUser.email,familyId:currentFamilyId}}));
}

async function sendInvite() {
  const familySnap=await getDoc(familyRef(currentFamilyId));
  if(!familySnap.exists() || Number(familySnap.data().memberCount||1)>=2)throw new Error("Esta família já tem duas contas vinculadas.");
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
  batch.update(familyRef(invite.familyId),{memberCount:2,lastAcceptedInviteId:inviteId,updatedAt:serverTimestamp()});
  batch.set(doc(db,"families",invite.familyId,"members",currentUser.uid),{
    uid:currentUser.uid,email:currentUser.email,displayName:currentUser.displayName || "Membro",
    role:"member",invitationId:inviteId,joinedAt:serverTimestamp()
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
    signOut:()=>signOut(auth),
    saveProfiles:profiles=>persistProfiles(profiles)
  };
  window.dispatchEvent(new CustomEvent("gama-auth-ready"));
  onAuthStateChanged(auth, async user => {
    currentUser=user;
    show("authLogin", !user);
    show("authSignedIn", Boolean(user));
    show("authAccountBtn", Boolean(user));
    if (!user) {
      currentFamilyId=null;
      if(unsubscribeProfiles)unsubscribeProfiles();
      unsubscribeProfiles=null;
      show("authGate",true);
      return;
    }
    const emailLabel=document.getElementById("authSignedEmail");
    if(emailLabel)emailLabel.textContent=user.email || "";
    try {
      await loadFamily();
      show("authGate", !currentFamilyId);
      show("authClose", Boolean(currentFamilyId));
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
  document.getElementById("authAccountBtn").onclick=()=>{show("authGate",true);show("authClose",true);};
  document.getElementById("authClose").onclick=()=>{if(currentFamilyId)show("authGate",false);};
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const email=cleanEmail(document.getElementById("authEmail").value);
    const password=document.getElementById("authPassword").value;
    try {
      if(document.getElementById("authSubmit").textContent==="Criar conta") {
        const name=document.getElementById("authName").value.trim();
        const credential=await createUserWithEmailAndPassword(auth,email,password);
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
