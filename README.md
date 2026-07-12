# Heckaton

A small web application for asset maintenance management.

This project includes:

- A login and sign-up interface powered by Firebase Authentication.
- A dashboard for managing assets, reporting issues, and tracking maintenance.
- Firestore data storage for per-user assets and issue records.
- Google sign-in and a polished, responsive UI.

Key files:

- `index.html` + `script.js`: authentication and onboarding.
- `Dashboard.html` + `Dash.js`: asset dashboard, issue tracking, maintenance logging, notifications, and QR code support.
- `config/firebase.js`: Firebase initialization and exports for authentication and Firestore.

The app is intended as a user-specific asset tracking system where each signed-in user can create assets, report and manage issues, and view maintenance history.
