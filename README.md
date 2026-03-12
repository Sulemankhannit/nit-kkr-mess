# NIT KKR Mess Management System

A comprehensive, modern MERN stack application designed to digitize and streamline the mess management operations at NIT Kurukshetra. This system provides robust features for both students and administrators to handle billing, attendance, daily menus, feedback, and interactive crowd monitoring.

## 🚀 Features

### For Students
- **Interactive Dashboard:** View live crowd meters, daily menus, and active polls.
- **Smart Billing & Rebates:** Seamlessly apply for rebates, view total rebated days, and track monthly expenses.
- **QR Code Integration:** Generate personal QR codes for daily attendance logging.
- **Guest Passes:** Generate specific QR guest passes directly from the base account balance.
- **Reward System:** Earn "skips" for missed meals and redeem accumulated skips for special rewards via unique QR codes.
- **Engagement:** Vote in UI-driven polls and provide feedback/ratings for specific meals.

### For Administrators
- **QR Scanning Hub:** A unified scanner that intelligently differentiates between Student Attendance, Guest Passes, and Reward Claims using prefixed payloads (e.g., `QR_REWARD_`, `QR_GUEST_`).
- **Billing & Ledger Management:** Generate comprehensive monthly Master Ledgers (PDFs) and instantly email individual invoices to all students with one click (via Nodemailer).
- **Rebate Approvals:** Instantly approve or reject student rebate requests with responsive UI updates.
- **Menu Management:** Update daily breakfast, lunch, and dinner menus seamlessly.
- **Analytics:** Access detailed cook-sheets and analytics on student attendance and voting patterns.

---

## 🏗️ Architecture: The Hackathon Hybrid Deployment

To bypass strict cloud restrictions and eliminate the need for credit card verifications on platforms like Render, this project utilizes a **Hybrid Deployment Architecture**:

1. **Frontend (Vercel):** The React/Vite UI is hosted globally and permanently on Vercel.
2. **Backend (Local/Edge):** The express Node.js server connects locally to a MongoDB Atlas cluster.
3. **The Bridge (Cloudflare Tunnels):** A secure, permanent `cloudflared` tunnel safely exposes the local backend to the internet without browser warnings, allowing the Vercel frontend to fetch database queries instantly.

---

## 💻 Tech Stack

- **Frontend:** React, Vite, CSS (Vanilla Custom UI), Axios, html5-qrcode, qrcode.react
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas, Mongoose
- **Authentication:** JWT (JSON Web Tokens), bcryptjs
- **Utilities:** Nodemailer (Emailing), PDFKit (Ledger Generation), CORS, Dotenv

---

## 🛠️ Local Development Setup

To run this project locally, you will need Node.js and MongoDB installed.

### 1. Clone the repository
```bash
git clone https://github.com/Sulemankhannit/nit-kkr-mess.git
cd nit-kkr-mess
```

### 2. Environment Variables
Create a `.env` file in the root directory (`/nit-kkr-mess`) and add the following:
```env
PORT=5001
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
```

### 3. Install Dependencies
Install dependencies for both the backend and frontend simultaneously:
```bash
npm install
cd frontend
npm install
cd ..
```

### 4. Run the Application
Start both the backend server and the frontend Vite development server:
```bash
# Terminal 1: Start Backend (Root Directory)
npm run dev

# Terminal 2: Start Frontend (Inside frontend folder)
cd frontend
npm run dev
```

### 5. Connecting the Frontend to the Tunnel (Production Vercel Testing)
If testing the deployed Vercel frontend against your local machine, run your Cloudflare tunnel:
```bash
.\cloudflared.exe tunnel --url http://localhost:5001
```
Then update the `VITE_API_URL` environment variable in your Vercel Dashboard with the generated `.trycloudflare.com/api` link and hit **Redeploy**.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

Made with ❤️ by Suleman Khan for NIT KKR.
