// Folio Google sign-in. Only public Firebase Web App settings go in firebase-config.js.
// Documents stay in the browser's local IndexedDB; authentication does not sync them.
const config = window.FOLIO_FIREBASE_CONFIG || {};
const required = ['apiKey','authDomain','projectId','appId'];
const configured = required.every(key => typeof config[key] === 'string' && config[key].trim() !== '');
const account = window.FolioAccount = {
  configured, user:null, credits:0, loading:false, error:"",
  signIn:()=>alert("Google sign-in is not yet enabled for this Folio website."),
  signOut:()=>{}, checkout:()=>alert("Premium purchases are coming soon.")
};
const refresh = () => { try { if(typeof window.render === 'function') window.render(); } catch(error) { console.warn(error); } };
const friendlyError = (error) => ({
 'auth/unauthorized-domain':'This website must be added to Firebase Authentication → Authorized domains.',
 'auth/operation-not-allowed':'Google login must be enabled under Firebase Authentication → Sign-in method.',
 'auth/popup-closed-by-user':'Sign-in was cancelled.',
 'auth/popup-blocked':'Your browser blocked the Google sign-in popup.',
 'auth/network-request-failed':'Network unavailable. Please check your connection and try again.'
}[error?.code] || error?.message || 'Google sign-in could not be completed.');
if (configured) {
  try {
    const [{initializeApp},{getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,signOut,onAuthStateChanged,setPersistence,browserLocalPersistence}]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js')
    ]);
    const app=initializeApp(config);
    const auth=getAuth(app);
    account.getIdToken=async()=>auth.currentUser?.getIdToken(true)||null;
    const provider=new GoogleAuthProvider();
    provider.setCustomParameters({prompt:'select_account'});
    account.signIn=async()=>{
      if(account.loading)return;
      account.loading=true; account.error=''; refresh();
      try {
        await setPersistence(auth,browserLocalPersistence);
        await signInWithPopup(auth,provider);
      } catch(error) {
        if(error?.code==='auth/popup-blocked') {
          try { await signInWithRedirect(auth,provider); }
          catch(redirectError) { account.error=friendlyError(redirectError); }
        } else if(error?.code!=='auth/popup-closed-by-user') {
          account.error=friendlyError(error);
        }
        if(account.error) alert(account.error);
      } finally { account.loading=false; refresh(); }
    };
    account.signOut=async()=>{
      account.error='';
      try { await signOut(auth); }
      catch(error){account.error=friendlyError(error);alert(account.error);}
    };
    account.checkout=()=>alert('Purchases are not active yet. Basic scanning, PDF, Excel and image tools remain free.');
    let unsubscribeEntitlements=()=>{};
    onAuthStateChanged(auth,async user=>{
      unsubscribeEntitlements();unsubscribeEntitlements=()=>{};
      account.user=user?{uid:user.uid,email:user.email,displayName:user.displayName,photoURL:user.photoURL}:null;
      account.credits=0;account.loading=false;refresh();
      // Entitlements are optional until the secure premium backend is deployed.
      if(user){
        try{
          const {getFirestore,doc,onSnapshot}=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');
          const ref=doc(getFirestore(app),'entitlements',user.uid);
          unsubscribeEntitlements=onSnapshot(ref,snapshot=>{
            if(account.user?.uid===user.uid){account.credits=Math.max(0,Number(snapshot.data()?.credits||0)||0);refresh();}
          },()=>{ /* No entitlement database yet; free account stays available. */ });
        }catch(error){ console.info('Optional premium entitlements unavailable.'); }
      }
    },error=>{account.error=friendlyError(error);account.loading=false;refresh();});
    getRedirectResult(auth).catch(error=>{
      account.error=friendlyError(error);refresh();console.warn('Sign-in redirect failed:',account.error);
    });
  } catch(error){
    account.configured=false;
    account.error='Could not load Google sign-in. Check Firebase app settings and network access.';
    console.error(error);refresh();
  }
}
