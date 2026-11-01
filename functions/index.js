'use strict';
// Secure Razorpay Standard Checkout backend for Folio (UPI, cards and supported methods).
// DO NOT deploy or enable checkout until paid features, refund policy, merchant account
// and authenticated entitlement handling have been reviewed.
const {onRequest}=require('firebase-functions/v2/https');
const {defineSecret}=require('firebase-functions/params');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');
const {initializeApp}=require('firebase-admin/app');
const crypto=require('node:crypto');
initializeApp();
const KEY_ID=defineSecret('RAZORPAY_KEY_ID');
const KEY_SECRET=defineSecret('RAZORPAY_KEY_SECRET');
const WEBHOOK_SECRET=defineSecret('RAZORPAY_WEBHOOK_SECRET');
const REGION='asia-south1';
const ORIGIN='https://shrey2402.github.io';
const plans=Object.freeze({
  starter:{amount:4900,currency:'INR',credits:5,name:'Folio Starter'},
  plus:{amount:9900,currency:'INR',credits:12,name:'Folio Plus'}
});
const frontend={region:REGION,cors:[ORIGIN],maxInstances:5,timeoutSeconds:40};
const formatError=(res,code,msg)=>res.status(code).json({error:msg});
const validId=(v,prefix)=>typeof v==='string'&&v.startsWith(prefix)&&v.length<=100;
const safeMatch=(a,b)=>{
  if(typeof a!=='string'||typeof b!=='string'||!/^([0-9a-f]{64})$/i.test(a)||!/^([0-9a-f]{64})$/i.test(b))return false;
  return crypto.timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
};
const hmac=(value,secret)=>crypto.createHmac('sha256',secret).update(value).digest('hex');
async function authorizedUser(req){
  const match=(req.headers.authorization||'').match(/^Bearer (\S+)$/);
  if(!match)throw Object.assign(new Error('Sign in required'),{statusCode:401});
  const decoded=await getAuth().verifyIdToken(match[1],true);
  return decoded.uid;
}
async function razorpay(path,options={}){
  const auth=Buffer.from(KEY_ID.value()+':'+KEY_SECRET.value()).toString('base64');
  const response=await fetch('https://api.razorpay.com/v1/'+path,{
    method:options.method||'GET',
    headers:{Authorization:'Basic '+auth,...(options.body?{'Content-Type':'application/json'}:{})},
    body:options.body?JSON.stringify(options.body):undefined,
    signal:AbortSignal.timeout(16000)
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error('Payment gateway request failed');
  return data;
}
async function creditOrder(orderId,paymentId){
  const db=getFirestore(),ref=db.collection('paymentOrders').doc(orderId);
  return db.runTransaction(async tx=>{
    const snapshot=await tx.get(ref);
    if(!snapshot.exists)throw Object.assign(new Error('Unknown order'),{statusCode:404});
    const order=snapshot.data();
    if(order.status==='credited')return{creditsAdded:0,alreadyCredited:true};
    if(order.status!=='created')throw Object.assign(new Error('Order unavailable'),{statusCode:409});
    const pack=plans[order.plan];
    if(!pack||order.amount!==pack.amount||order.credits!==pack.credits)
      throw Object.assign(new Error('Invalid order record'),{statusCode:409});
    const entitled=db.collection('entitlements').doc(order.uid);
    tx.set(entitled,{credits:FieldValue.increment(pack.credits),updatedAt:FieldValue.serverTimestamp()},{merge:true});
    tx.update(ref,{status:'credited',paymentId,creditedAt:FieldValue.serverTimestamp()});
    return{creditsAdded:pack.credits,alreadyCredited:false};
  });
}
async function confirmWithGateway(orderId,paymentId){
  const doc=await getFirestore().collection('paymentOrders').doc(orderId).get();
  if(!doc.exists)throw Object.assign(new Error('Order not found'),{statusCode:404});
  const record=doc.data(),payment=await razorpay('payments/'+encodeURIComponent(paymentId));
  if(payment.order_id!==orderId||payment.status!=='captured'||payment.amount!==record.amount||payment.currency!=='INR')
    throw Object.assign(new Error('Payment is not captured for this order'),{statusCode:409});
  return record;
}
exports.createOrder=onRequest({...frontend,secrets:[KEY_ID,KEY_SECRET]},async(req,res)=>{
  if(req.method!=='POST')return formatError(res,405,'Method not allowed');
  try{
    const uid=await authorizedUser(req);
    const plan=req.body?.plan;
    if(typeof plan!=='string'||!Object.hasOwn(plans,plan))return formatError(res,400,'Unknown plan');
    const item=plans[plan];
    const order=await razorpay('orders',{method:'POST',body:{
      amount:item.amount,currency:item.currency,
      receipt:'folio_'+crypto.randomBytes(10).toString('hex'),
      notes:{plan,uid}
    }});
    if(!validId(order.id,'order_')||order.amount!==item.amount||order.currency!==item.currency)
      throw new Error('Invalid order returned from gateway');
    await getFirestore().collection('paymentOrders').doc(order.id).create({
      uid,plan,amount:item.amount,credits:item.credits,currency:'INR',
      status:'created',createdAt:FieldValue.serverTimestamp()
    });
    res.json({id:order.id,amount:item.amount,currency:'INR',key:KEY_ID.value(),credits:item.credits});
  }catch(error){
    console.error('createOrder failed',error);
    formatError(res,error.statusCode||500,error.statusCode?error.message:'Unable to start checkout');
  }
});
exports.verifyPayment=onRequest({...frontend,secrets:[KEY_ID,KEY_SECRET]},async(req,res)=>{
  if(req.method!=='POST')return formatError(res,405,'Method not allowed');
  try{
    const uid=await authorizedUser(req);
    const {razorpay_order_id:orderId,razorpay_payment_id:paymentId,razorpay_signature:signature}=req.body||{};
    if(!validId(orderId,'order_')||!validId(paymentId,'pay_'))
      return formatError(res,400,'Invalid payment details');
    const record=await getFirestore().collection('paymentOrders').doc(orderId).get();
    if(!record.exists||record.data().uid!==uid)return formatError(res,403,'Order not owned by this account');
    const expected=hmac(orderId+'|'+paymentId,KEY_SECRET.value());
    if(!safeMatch(expected,signature))return formatError(res,403,'Invalid payment signature');
    await confirmWithGateway(orderId,paymentId);
    const credited=await creditOrder(orderId,paymentId);
    res.json({verified:true,...credited});
  }catch(error){
    console.error('verifyPayment failed',error);
    formatError(res,error.statusCode||500,error.statusCode?error.message:'Unable to verify payment');
  }
});
exports.paymentWebhook=onRequest({region:REGION,secrets:[WEBHOOK_SECRET,KEY_ID,KEY_SECRET],maxInstances:5},async(req,res)=>{
  if(req.method!=='POST')return res.status(405).send('Method not allowed');
  const signature=req.headers['x-razorpay-signature'],expected=hmac(req.rawBody,WEBHOOK_SECRET.value());
  if(!safeMatch(expected,signature))return res.status(401).send('Bad webhook signature');
  const event=req.body;
  if(event?.event!=='payment.captured')return res.status(200).send('Ignored');
  try{
    const payment=event.payload?.payment?.entity;
    if(!validId(payment?.order_id,'order_')||!validId(payment?.id,'pay_'))return res.status(400).send('Malformed event');
    await confirmWithGateway(payment.order_id,payment.id);
    await creditOrder(payment.order_id,payment.id);
    res.status(200).send('OK');
  }catch(error){
    console.error('Webhook processing failed',error);
    res.status(500).send('Retry');
  }
});
