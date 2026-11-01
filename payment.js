// Folio UPI/card payments through Razorpay Standard Checkout.
// All order creation and credit allocation happen on a verified server.
const settings=window.FOLIO_PAYMENT_CONFIG||{};
const ready=!!(settings.enabled&&/^https:\/\//.test(settings.createOrderUrl||'')&&/^https:\/\//.test(settings.verifyPaymentUrl||''));
window.FOLIO_PAYMENTS_ENABLED=ready;
function friendly(message){alert(message);console.info('Folio payments:',message);}
function importCheckout(){
  if(window.Razorpay)return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='https://checkout.razorpay.com/v1/checkout.js';
    script.async=true;
    script.onload=()=>window.Razorpay?resolve():reject(new Error('Payment gateway unavailable'));
    script.onerror=()=>reject(new Error('Could not load secure payment checkout'));
    document.head.appendChild(script);
  });
}
async function jsonCall(url,token,body){
  const response=await fetch(url,{method:'POST',headers:{
    'Authorization':'Bearer '+token,'Content-Type':'application/json'
  },body:JSON.stringify(body)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||'Payment request failed');
  return data;
}
async function purchase(plan){
  if(!ready)return friendly('Payments are not active yet. Folio remains free to use.');
  if(!['starter','plus'].includes(plan))return friendly('Unknown premium pack.');
  const acc=window.FolioAccount;
  if(!acc?.user||typeof acc.getIdToken!=='function'){
    friendly('Please sign in using Google before purchasing a premium pack.');
    return;
  }
  try{
    const token=await acc.getIdToken();
    if(!token)throw new Error('Google session expired. Please sign in again.');
    const data=await jsonCall(settings.createOrderUrl,token,{plan});
    if(!data?.id||!data?.key||data.currency!=='INR'||!Number.isInteger(data.amount))
      throw new Error('The payment server returned an invalid order.');
    await importCheckout();
    const opts={
      key:data.key,order_id:data.id,amount:data.amount,currency:'INR',
      name:'Folio',description:plan==='plus'?'12 premium credits':'5 premium credits',
      theme:{color:'#0f9db0'},prefill:{email:acc.user.email||''},
      handler:async(payment)=>{
        try{
          const fresh=await acc.getIdToken();
          const result=await jsonCall(settings.verifyPaymentUrl,fresh,payment);
          if(!result.verified)throw new Error('Payment has not yet been verified.');
          friendly('Payment verified! Your premium credit balance will update shortly.');
          if(typeof window.render==='function')window.render();
        }catch(error){
          friendly('Payment submitted but credit verification is pending. Do not pay again. Please contact support with your Razorpay payment ID: '+payment.razorpay_payment_id);
        }
      },
      modal:{ondismiss:()=>console.info('Folio checkout closed')}
    };
    const checkout=new window.Razorpay(opts);
    checkout.on('payment.failed',evt=>friendly(evt.error?.description||'Payment was not completed. No credits were added.'));
    checkout.open();
  }catch(error){friendly(error.message||'Checkout unavailable')}
}
function connect(){
  if(window.FolioAccount){
    window.FolioAccount.checkout=purchase;
    if(typeof window.render==='function')window.render();
  }else setTimeout(connect,100);
}
connect();
