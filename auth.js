const cfg=window.FOLIO_FIREBASE_CONFIG||{};
const good=['apiKey','authDomain','projectId','appId'].every(k=>typeof cfg[k]==='string'&&cfg[k].trim());
const account=window.FolioAccount={configured:good,user:null,credits:0,signIn:()=>alert('Google sign-in needs your Firebase project settings.'),signOut:()=>{},checkout:()=>alert('Payments are coming soon.')};
function refresh(){try{window.render?.()}catch(e){console.warn(e)}}
if(good){
try{
 const [{initializeApp},{getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,signOut,onAuthStateChanged},{getFirestore,doc,onSnapshot}]=await Promise.all([
 import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js')]);
 const app=initializeApp(cfg),auth=getAuth(app),db=getFirestore(app),provider=new GoogleAuthProvider();let unsub=()=>{};
 account.signIn=async()=>{try{await signInWithPopup(auth,provider)}catch(e){if(e.code==='auth/popup-blocked')await signInWithRedirect(auth,provider);else alert('Sign in failed: '+(e.message||'unknown error'))}};
 account.signOut=()=>signOut(auth);
 onAuthStateChanged(auth,user=>{unsub();account.user=user?{uid:user.uid,email:user.email,displayName:user.displayName,photoURL:user.photoURL}:null;account.credits=0;refresh();if(user){unsub=onSnapshot(doc(db,'entitlements',user.uid),snap=>{account.credits=Number(snap.data()?.credits||0);refresh()},()=>{})}});
}catch(e){account.configured=false;console.error(e);refresh()}
}
