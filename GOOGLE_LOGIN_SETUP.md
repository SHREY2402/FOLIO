# Google sign-in activation for Folio

The client-side Google sign-in code is already installed in `auth.js`. It **will not work until a Firebase project and Web App are configured**.

## Firebase project connection (project owner)

Open https://console.firebase.google.com/ and create or select a project. Open **Project settings → General → Your apps → Add app → Web** (if there is no existing web app). Name the app Folio and copy the Web App configuration object containing `apiKey`, `authDomain`, `projectId`, and `appId`. These identifiers are intended for browser clients; **do not include service-account JSON, Stripe secrets, or private keys**. Restrict Firebase API keys to Firebase-related APIs.

In the Firebase console open **Build → Authentication → Sign-in method → Google**, enable it, select a support email, and save. Then open **Authentication → Settings → Authorized domains → Add domain** and authorize exactly `shrey2402.github.io` (not the path `/FOLIO`).

Paste the four public Web App configuration fields into `firebase-config.js`, preserving the original Firebase-supplied values. Leave `window.FOLIO_PAYMENTS_ENABLED=false`. Commit the update to the `main` branch.

## GitHub Pages activation (repository owner)

Open https://github.com/SHREY2402/FOLIO/settings/pages. Under **Build and deployment → Source**, select **GitHub Actions**. The workflow file `.github/workflows/pages.yml` is already present. GitHub Actions will deploy the static website after the setting is enabled and a new push to `main` occurs.

## Test

Visit https://shrey2402.github.io/FOLIO/ after the Pages deploy succeeds. Open **Account** and select **Continue with Google**. Check that the Google account name appears, sign out, and sign back in. Firebase Auth account sessions persist in the browser, but your scans remain local.

## Security

- Never enable payments without a deployed server-side payment backend and signed webhook verification.
- Keep Firestore/Storage access rules secure; Google sign-in alone is not database authorization.
- On GitHub Pages, use the popup-based Google sign-in flow. Redirect login can fail in some browsers due to cross-origin storage restrictions.

GitHub and Firebase project settings must be changed by an account with the appropriate administrative permissions; repository file access alone cannot make those changes.
