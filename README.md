# Folio — Scanner & Create Studio

Free local-first document scanner and creation studio for pictures, PDF and Excel files. Browser documents stay on the user's device unless shared or exported. Google sign-in is optional and not configured yet; entering public Firebase Web App settings into firebase-config.js and enabling Google sign-in and the GitHub Pages authorized domain in Firebase Authentication is necessary to activate it.

## Public website

Repository: https://github.com/SHREY2402/FOLIO
Expected GitHub Pages address after Pages is enabled: https://shrey2402.github.io/FOLIO/

To publish, go to **Settings → Pages → Build and deployment → Source → GitHub Actions**. The included workflow publishes after a push to main.

## Pricing

Scanning, image creation, spreadsheets, PDFs and sharing are free. Planned premium packs: $0.50 for 5 credits and $1.00 for 12 credits. They are **not for sale yet**: paid features and production backend need to be implemented, reviewed and deployed before any payments can be taken.

## Privacy

Scans and locally created documents are stored in browser IndexedDB. Google sign-in doesn't automatically sync files. Storage may be deleted when browser data is cleared, so export important PDF backups.

## Developers

This repo contains the static app and Firebase integration scaffold. No payment secrets should be committed here. The premium payment backend will require secure server-side verification before launch.
