# Folio — Razorpay merchant onboarding kit

**Status:** Preparation only. No Razorpay merchant account has been created or activated. No live money can be taken by Folio yet.

## Application information already known

| Field | Proposed entry |
| --- | --- |
| Brand / public product | Folio |
| Site | https://shrey2402.github.io/FOLIO/ |
| GitHub project | https://github.com/SHREY2402/FOLIO |
| Product category | Browser-based productivity tools / document scanning and creation software (choose Razorpay's closest available category) |
| Business description | Folio is a mobile-friendly web app that lets users scan and organise documents and create, download and share image, spreadsheet and PDF files. Core tools remain free. Optional one-time premium packs may be introduced after the premium benefits and payment verification service are ready. |
| Customer-facing currency for UPI | INR |
| Proposed Starter | ₹49 for 5 future premium credits — **disabled, not sold** |
| Proposed Plus | ₹99 for 12 future premium credits — **disabled, not sold** |
| Recurring subscription | None planned |
| Fulfilment | Digital access; the exact premium benefits and credit usage rules must be defined before sales are enabled |
| Refunds / cancellations | Owner must decide and publish a compliant policy before paid launch |
| Contact / support | Owner must provide an appropriate public support contact; none is published by this kit |

Do not substitute “Folio” for a legal personal/business name when the form specifically requests the legal entity name. Select the **actual** business type: individual/unregistered, sole proprietorship, partnership, LLP, company, etc. Eligibility for individual/unregistered businesses is subject to Razorpay verification.

## What requires the owner's own approval

Razorpay signup and verification: https://accounts.razorpay.com/auth/?auth_intent=signup&screen=sign_up

The form may require sign-in confirmation, mobile/email OTP, consent for CKYC and identification, PAN, bank account details/IFSC, and additional documents depending on the legal business structure. These are to be entered **only on Razorpay's official secure website**, not sent in ChatGPT or committed to GitHub. Account activation and banking approvals are controlled by Razorpay.

Owners should consult the current Razorpay checklist and portal before applying:
- https://razorpay.com/blog/minimum-documents-payment-gateway-onboarding-india/
- https://github.com/razorpay/markdown-docs/blob/master/payments/set-up.md
- https://github.com/razorpay/markdown-docs/blob/master/payments/faqs.md

## After the account is verified

1. Complete actual premium feature delivery, terms, support information, refunds/cancellations and other merchant review requirements. Keep free features free.
2. Configure Firebase Authentication (Google), Firestore security rules, and a billing-enabled Firebase project. Cloud Functions deployments require Firebase's Blaze plan.
3. Deploy the code in `functions/` to an owner-controlled Firebase project. Save the merchant's Razorpay key ID and secret plus webhook secret **only** in secure Firebase secret storage. Never upload secrets, PAN, bank details or OTPs to GitHub.
4. Enable payment capture, configure the signed `payment.captured` webhook, and test checkout in Razorpay Test Mode with simulated payments.
5. Verify idempotent credit grants and repeated webhooks, failed/uncaptured payments, refunds, and secure user access. Only then enable `payment-config.js` with publicly accessible function URLs.

**Important:** Merely signing up for Razorpay does not automatically enable payments on Folio. Merchant approval, Firebase deployment and product fulfillment are independent work items. GitHub Pages cannot store a Razorpay secret or verify payment by itself.

## Current technical status

The public app is deployed on GitHub Pages. The Razorpay checkout client is in `payment.js` and secure backend source is in `functions/index.js`. `payment-config.js` has `enabled:false` and empty URLs. `firebase-config.js` has placeholder Web App identifiers. **No live checkout, account creation, merchant verification, Firebase deployment or live payments are confirmed.**
