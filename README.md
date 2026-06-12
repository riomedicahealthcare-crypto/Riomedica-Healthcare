# Riomedica Healthcare Detailing & Admin Suite

A high-fidelity pharmaceutical detailing mobile application for medical representatives to present medicines to practitioners, featuring a web-based Admin Portal for real-time catalog management.

---

## 🌟 Key Features

*   **Mobile Detailing Client:** Secure PIN login, product searches, category filtering, detailed product pages (Packshot, LBL Literature sheets, video links).
*   **Fullscreen Detailing Slideshow:** Swipeable presentation mode with a built-in transparent annotation drawing overlay (supporting pen colors, sizes, erasers, and clear canvas).
*   **Custom Presentations:** Create specific presentations (e.g. customized list for a particular doctor) and present them sequentially.
*   **Admin Dashboard:** Monitor stats, add/edit/delete product compositions, upload packshot carton packaging and multiple visual aids, and add categories.
*   **Offline Cache Fallback:** Automatically switches to browser LocalStorage if the backend server is offline, meaning the entire system can be tested immediately in-browser without starting the server!

---

## ⚙️ Installation & Running

Ensure you have **Node.js** (v18 or higher recommended) installed.

### 1. Install Dependencies
At the root directory, run:
```bash
npm run install-all
```
This script automatically installs package dependencies for the root orchestrator, the Express server, and the Vite client.

### 2. Start both Server & Client
Run:
```bash
npm run dev
```
This starts:
*   The Express API server on `http://localhost:5000` (serving database and files)
*   The Vite React dev server on `http://localhost:5173`

Open `http://localhost:5173` in your browser.

---

## 🛡️ PIN Code
Access the mobile representative app using the security code:
*   **PIN:** `1234` or `riomedica`

---

## 📂 Folder Structure

*   `/server`: Express.js backend. Serves uploaded images in `/server/public/uploads` and updates product records in `/server/data/db.json`.
*   `/client`: React + Vite frontend. Features custom styling with vanilla CSS, Android device frames, custom sliders, and pen drawing canvas controllers.
