# Folio payment setup — UPI, cards and net banking
Status: **integration committed, payments intentionally disabled**.

## What is ready
The website has Razorpay Standard Checkout client code (`payment.js`) for Android/mobile UPI apps and other payment methods offered by an activated Razorpay merchant account. A Firebase Functions backend (`functions/index.js`) creates orders, checks Firebase user ID tokens, verifies Razorpay payment signatures, confirms the captured amount with Razorpay, receives signed webhooks and credits only once per order. `firestore.rules` restricts credit writes to the server.

**Free scanning, images, spreadsheets, and PDFs remain completely free.** No paid premium feature is yet available, so checkout is disabled to prevent taking money for an unfinished service.

## Planned pricing for UPI
UPI settlement uses Indian rupees, not US dollars. The proposed Indian payment amounts are **₹49 for 5 premium credits** and **₹99 for 12 premium credits**, loosely corresponding to the earlier $0.50 and $1 price *ideas*. These are not live FX rates or automatically converted USD prices. Confirm prices and taxes with the business before accepting payments.

## Activation requires owner-authorized services
A verified Razorpay merchant account, KYC, approved UPI payment methods and a linked settlement bank account are needed. Merchant account signup: https://razorpay.com/ . Do not share account passwords or merchant key secrets in chat or a GitHub repository.

In an authorized Firebase project with Authentication and Firestore enabled, deploy `firestore.rules` and `functions` from the Firebase CLI. Use Firebase Secret Manager values `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` using the CLI in a trusted developer environment. Functions use Node.js 22 and region `asia-south1`. A billing-enabled Firebase plan may be required.

Razorpay must be configured to automatically capture authorized payments; enable the signed `payment.captured` webhook on the deployed HTTPS `paymentWebhook` function and use the same webhook secret. Do not activate client checkout until live payments and verification have been tested with the merchant.

The Firebase public Web App config must be added to `firebase-config.js`, with the `shrey2402.github.io` domain allowed in Firebase Authentication and Google provider enabled.

After the secure `createOrder` and `verifyPayment` functions are deployed and the premium service is actually available, enter the two public HTTPS endpoints in `payment-config.js` and explicitly set `enabled:true`. Never embed merchant secrets in `payment-config.js` or any public frontend.

## Safety checklist before live charges
Review Indian pricing, GST/tax obligations, refund/cancellation policy, business identification and contact details. Add functioning premium benefits and customer support, and test actual sandbox Razorpay orders followed by server verification, webhook retries, duplicate delivery and refunds. Verify UPI intent works on Android. Confirm account credit balances cannot be changed from the browser console or Firestore client SDK.

**Neither a button on GitHub Pages nor a bare UPI payment deep-link is sufficient to verify payment.** The server must confirm the captured transaction before granting paid benefits.
