```markdown
# 🍽️ MessMate 


A comprehensive, modern MERN stack application designed to digitize and streamline hostel mess operations. MessMate provides robust features for both students and administrators to handle billing, attendance, daily menus, feedback, and interactive crowd monitoring.

## 🚀 Key Features

### For Students
* **Interactive Dashboard:** View real-time crowd meters, daily meal menus, and active community polls.
* **Smart Billing & Rebates:** Seamlessly apply for meal rebates, view total rebated days, and track monthly expenses.
* **Dynamic QR Code Integration:** Generate a personal, time-sensitive QR code for daily attendance logging.
* **Guest Pass System:** Generate specific QR guest passes directly from the base account balance.
* **Reward Ecosystem:** Earn "skips" for officially missed meals and redeem accumulated skips for special rewards via unique payload QR codes.
* **Community Engagement:** Vote in UI-driven polls and provide specific feedback/ratings for daily meals.

### For Administrators
* **Smart QR Scanning Hub:** A unified, intelligent scanner that automatically differentiates between Student Attendance, Guest Passes, and Reward Claims using prefixed payloads (e.g., `QR_REWARD_`, `QR_GUEST_`).
* **Automated Billing & Ledger Management:** Dynamically generate comprehensive monthly Master Ledgers (PDFs via `PDFKit`) and instantly dispatch individual invoices to all students via email in a single click (via `Nodemailer`).
* **Rebate Approvals:** Instantly approve or reject student rebate requests with real-time UI and database updates.
* **Menu & Poll Management:** Update daily breakfast, lunch, and dinner menus seamlessly, and deploy polls to gauge student preferences.
* **Analytics Dashboard:** Access detailed cook-sheets and analytics on student attendance, peak hours, and voting patterns.

---

## 🏗️ Architecture: The Hybrid Deployment Model

To bypass strict cloud restrictions and limitations on long-running backend processes, this project utilizes a **Hybrid Deployment Architecture**:

1.  **Frontend (Vercel):** The React/Vite UI is hosted globally and permanently on Vercel for fast, edge-cached delivery.
2.  **Backend (Local/Edge):** The computationally heavy Express Node.js server (handling PDF generation and bulk emails) runs locally and connects to a MongoDB Atlas cluster.
3.  **The Bridge (Cloudflare Tunnels):** A secure, permanent `cloudflared` tunnel safely exposes the local backend to the internet via an HTTPS URL. This allows the deployed Vercel frontend to seamlessly communicate with the backend without mixed-content browser warnings.

---

## 💻 Tech Stack

* **Frontend:** React, Vite, CSS (Vanilla Custom UI), Axios, `html5-qrcode`, `qrcode.react`
* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas, Mongoose
* **Authentication:** JWT (JSON Web Tokens), `bcryptjs`
* **Utilities:** Nodemailer (Email Dispatch), PDFKit (Ledger Generation), CORS, Dotenv

---

## 🛠️ Local Development Setup

To run this project entirely locally on your machine, you will need Node.js and MongoDB installed.

### 1. Clone the repository
```bash
git clone [https://github.com/Sulemankhannit/nit-kkr-mess.git](https://github.com/Sulemankhannit/nit-kkr-mess.git)
cd nit-kkr-mess
```

### 2. Environment Variables Configuration
Create a `.env` file in the root directory (`/nit-kkr-mess`) and populate it with your specific configuration values:

```env
PORT=5001
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
```

### 3. Install Dependencies
Install the required packages for both the backend and frontend:
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 4. Run the Application Locally
Start both the backend server and the frontend Vite development server. Open two separate terminal windows:

**Terminal 1 (Backend):**
```bash
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
*The application will now be accessible at `http://localhost:5173`.*

---

### 5. Connecting to the Live Frontend via Cloudflare Tunnel (Optional)
*Note: This step is only required if you are attempting to bridge your local backend to the live Vercel deployment. It is not needed for purely local testing.*

**Prerequisite: Install `cloudflared`**
You must have the Cloudflare Tunnel daemon installed on your machine.
* **Windows:** Download the executable from the [Cloudflare Downloads page](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).
* **macOS (via Homebrew):** Run `brew install cloudflare/cloudflare/cloudflared`
* **Linux:** Download the appropriate package from the Cloudflare website.

**Run the Tunnel:**
Once installed, run the tunnel pointing to your local backend port:
```bash
# On Windows
.\cloudflared.exe tunnel --url http://localhost:5001

# On macOS/Linux
cloudflared tunnel --url http://localhost:5001
```
Finally, update the `VITE_API_URL` environment variable in your Vercel Dashboard with the generated `.trycloudflare.com\api` link and redeploy the frontend.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

Made with ❤️ by Suleman Khan.
```
