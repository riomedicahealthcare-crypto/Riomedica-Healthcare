# Project-Specific Rules - Riomedica Healthcare

## 1. Firebase-Only Database CRUD Architecture
- **Single Source of Truth**: Always use Firebase Realtime Database (`client/src/firebaseDb.js`) as the primary database for all client operations.
- **Client-Side CRUD Writes**: All product addition, modification, deletions, category creations, and bulk Excel imports must write directly to Firebase RTDB from the client.
- **Server Role**: The Render Express server (`server/server.js`) should remain lightweight, serving compiled static assets and proxying SMTP/Gemini APIs. Avoid routing database mutations through server endpoints to prevent out-of-memory (OOM) crashes.
- **Client Offline Fallbacks**: Ensure robust browser fallbacks:
  - If the server is offline, validate admin login credentials directly against the Firebase `/admin` node.
  - Fail-safe user password changes and mobile OTP dispatches must verify/write directly to Firebase.

## 2. SMTP Transport Configuration
- **IPv4 DNS Resolution**: When configuring Nodemailer transporters on the server, always explicitly set the connection option `family: 4`.
  - **Reason**: Render's containers lack IPv6 network connectivity, and defaulting to IPv6 causes connection timeouts (`connect ENETUNREACH`) when resolving SMTP hosts like `smtp.gmail.com`.

## 3. Server-Side Firebase OTP Listeners
- **Disabled active listeners**: Keep `startFirebaseOtpListener` disabled on the server.
  - **Reason**: Writing or updating state inside server-side Firebase listeners triggers Permission Denied exceptions for unauthenticated server clients, resulting in infinite optimistic update loops and high CPU usage.

## 4. Firebase Storage Size Optimization (Base64 Partitioning)
- **Separate Base64 Nodes**: To prevent Firebase Realtime Database size overflow and resulting connection/write timeouts, never store raw base64-encoded image files inside the primary `/products` metadata node.
- **Dedicated Image Paths**: All base64 image strings must be stored under their own dedicated nodes (e.g. `packshots/${id}` or `visualaids/${id}`) in Firebase.
- **Metadata URLs**: In the `/products` node, only store clean relative URL strings (e.g. `/uploads/packshot_[id].png`) generated using `getCleanUrl`.
- **Server db.json**: The local server database (`db.json`) must remain lightweight (under 50KB) and devoid of legacy base64 images under keys like `packshots` or `visualaids` to prevent memory usage limits and container restarts on host services like Render.
