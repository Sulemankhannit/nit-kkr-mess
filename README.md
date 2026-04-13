# 🍽️ NIT KKR Mess Management System

<div align="center">

**A comprehensive, full-stack MERN application to digitize and streamline mess management operations at NIT Kurukshetra.**

[![Live Frontend](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://vercel.com)
[![Backend](https://img.shields.io/badge/Backend-Cloudflare%20Tunnel-orange?logo=cloudflare)](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-green?logo=mongodb)](https://www.mongodb.com/atlas)
[![License](https://img.shields.io/badge/License-ISC-blue)](LICENSE)

</div>

---

## 📖 Table of Contents

- [About the Project](#-about-the-project)
- [Architecture: Hybrid Deployment](#️-architecture-hybrid-deployment)
- [Tech Stack](#-tech-stack)
- [Feature Breakdown](#-feature-breakdown)
  - [Authentication System](#1-authentication-system)
  - [Student Dashboard & RSVP](#2-student-dashboard--rsvp)
  - [Billing & Ledger System](#3-billing--ledger-system)
  - [Rebate Management](#4-rebate-management)
  - [Guest Pass System](#5-guest-pass-system)
  - [Reward & Skip System](#6-reward--skip-system)
  - [QR Code Ecosystem](#7-qr-code-ecosystem)
  - [Daily Menu Management](#8-daily-menu-management)
  - [Live Crowd Meter](#9-live-crowd-meter)
  - [Polls & Engagement](#10-polls--engagement)
  - [Feedback & Ratings](#11-feedback--ratings)
  - [Admin: Cook Sheet](#12-admin-cook-sheet)
  - [Admin: Analytics Dashboard](#13-admin-analytics-dashboard)
  - [Admin: QR Scanner Hub](#14-admin-qr-scanner-hub)
  - [Admin: Billing & Master Ledger](#15-admin-billing--master-ledger)
  - [Admin: Student Search](#16-admin-student-search)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Local Development Setup](#-local-development-setup)
- [Deployment Guide](#-deployment-guide)
- [Background Jobs](#-background-jobs)
- [Environment Variables](#-environment-variables)

---

## 🎯 About the Project

The **NIT KKR Mess Management System** replaces manual, paper-based mess operations with a modern, real-time digital platform. It serves two distinct user roles: **students** who interact with the mess daily, and **administrators** who manage billing, attendance, and operations.

**Key highlights:**
- Email-verified registration using OTP (via Nodemailer/Gmail)
- Role-based access control with **student**, **admin**, and **contractor** roles
- All NIT KKR institutional emails (`@nitkkr.ac.in`) are enforced at the database model level
- A gamification layer (skip-to-reward system) that incentivizes honest RSVP behaviour
- Full PDF generation and bulk email invoicing for end-of-month billing
- Live attendance tracking with entry timestamps for crowd monitoring

---

## 🏗️ Architecture: Hybrid Deployment

This project uses a **Hybrid Deployment Architecture** — a deliberate engineering decision to work within student constraints (no credit card for cloud platforms, no always-free Node.js hosting) while delivering a production-quality system.

```
┌─────────────────────────────────────────────────────────────┐
│                     USER / BROWSER                          │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────┐
│            VERCEL (Global CDN)                              │
│         React / Vite Frontend                               │
│   (Permanent, zero-cost, always online)                     │
└───────────────────────┬─────────────────────────────────────┘
                        │ Axios API Calls → VITE_API_URL
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         CLOUDFLARE TUNNEL (.trycloudflare.com)              │
│  Secure HTTPS bridge — no port forwarding, no certificates  │
│         (Encrypted, zero-config, no credit card)            │
└───────────────────────┬─────────────────────────────────────┘
                        │ localhost:5001
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         LOCAL MACHINE — Express.js Backend                  │
│   Heavy operations: PDF generation, bulk email, OTP         │
│     QR processing, background skip jobs, etc.               │
└───────────────────────┬─────────────────────────────────────┘
                        │ Mongoose ORM (TLS)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              MONGODB ATLAS (Cloud)                          │
│      Persistent data — always online, always synced         │
└─────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

| Reason | Detail |
|--------|--------|
| 🚫 No Free Render Tier | Render discontinued free always-on web services. Cold starts are 50+ seconds — unusable for live demos. |
| 💳 Card Verification | Railway, Fly.io, AWS, GCP all require international credit/debit cards even for free access. |
| ⚙️ Heavy Backend | `PDFKit` ledger generation, `Nodemailer` bulk email dispatch, and background skip-processing jobs far exceed serverless function limits (10s timeout). |
| ✅ Cloudflare Tunnels | Production-grade, free, encrypted, zero-config. The same technology used by professional developers for staging environments. |

---

## 💻 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Vanilla CSS |
| **State / Data** | React Context API, Axios |
| **Backend** | Node.js, Express.js 5 |
| **Database** | MongoDB Atlas, Mongoose 9 |
| **Authentication** | JWT (`jsonwebtoken`), `bcryptjs` |
| **Email** | Nodemailer (Gmail SMTP with App Password) |
| **PDF Generation** | PDFKit |
| **QR Codes** | `qrcode.react` (display), `html5-qrcode` (scanning) |
| **Tunneling** | Cloudflare Tunnel (`cloudflared`) |
| **Hosting** | Vercel (frontend), Local (backend) |

---

## 🚀 Feature Breakdown

### 1. Authentication System

**Files:** `controllers/authController.js`, `routes/authRoutes.js`, `models/User.js`

A full, secure registration flow with email verification:

- **Register:** User submits name, email, and password. A **6-digit OTP** is generated and emailed via Nodemailer. The user is stored in the database as `isVerified: false`.
- **Resend OTP:** A new OTP is generated and sent if the first one expires.
- **Verify OTP:** On correct OTP entry (within 10-minute window), the user's account is set to `isVerified: true` and OTP fields are cleared.
- **Login:** Only verified users can log in. Password is checked with `bcrypt.compare()`. A **JWT token** (30-day expiry) is issued on success, embedding `{ id, role }`.
- **Get Profile:** A protected route that returns user data (excluding password and OTP fields).
- **Email enforcement:** The `User` schema enforces `@nitkkr.ac.in` email format at the database level via regex validation.

**Roles:** `student`, `admin`, `contractor`

---

### 2. Student Dashboard & RSVP

**Files:** `pages/Dashboard.jsx`, `controllers/rsvpController.js`, `routes/rsvpRoutes.js`, `models/Meal.js`

The central hub for students shows:

- Live crowd meters for the current meal
- Today's and tomorrow's menus
- Active polls for quick voting
- Personal billing summary stats

**RSVP System:**
- Students can mark each meal as **"Attending"** or **"Skipping"** in advance via the `Meal` model's `attendingStudents` and `skippedStudents` arrays.
- RSVP feeds the cook-sheet headcount, enabling admins to plan food quantities accurately and reduce waste.

---

### 3. Billing & Ledger System

**Files:** `controllers/billingController.js`, `routes/billingRoutes.js`, `pages/Billing.jsx`

A precise, real-time financial ledger for each student:

**Billing Logic:**
- Each student starts with a **₹4,000 prepaid advance** per month.
- The daily mess rate is **₹130/day**.
- Charges are computed only for **unique calendar days** a student was physically scanned as present — preventing double-counting of breakfast/lunch/dinner on the same day.
- **Approved rebates** are subtracted: if a student was scanned during an approved rebate period, those days are excluded from billing.
- **Guest dues** (from guest pass purchases) are added as a surcharge.

**Ledger Response:**
```
Current Balance = 4000 - (billedDays × 130) - guestDues
Month-End Payable = Total Expenses (to restore the 4000 advance)
```

Students can see: `baseFee`, `billedDays`, `rebatedDays`, `totalFiledRebateDays`, `guestDues`, `currentBalance`, `totalBill`, `skippedMeals`, and available rewards.

---

### 4. Rebate Management

**Files:** `controllers/billingController.js` (rebate section), `models/Rebate.js`, `pages/Rebates.jsx`, `pages/admin/AdminBilling.jsx`

Students can file rebate requests for periods when they will be away from the campus mess:

- **Rules enforced:**
  - Rebate start date must be **at least 1 day in the future** (no retroactive filings)
  - Maximum of **10 rebate days per month** (sum of all pending + approved rebates)
  - End date cannot precede start date
- Status flow: `pending` → `approved` / `rejected` (admin action)
- **Admin override:** If an admin approves a rebate but the student is scanned present during that period, they are charged ₹130 as a "guest" for that meal.

---

### 5. Guest Pass System

**Files:** `controllers/billingController.js` (`buyGuestPass`), `pages/Billing.jsx`

- A student can purchase a **guest pass** for ₹100.
- This immediately adds ₹100 to their `guestDues` field (deducted from their prepaid balance).
- A unique QR code with the prefix `QR_GUEST_` is generated and returned for the admin to scan at the mess entry.

---

### 6. Reward & Skip System

**Files:** `controllers/billingController.js` (`claimReward`), `controllers/adminController.js` (`verifyRewardQR`), `models/User.js`

A gamification layer that rewards honest RSVP behaviour:

- When a student RSVPs "skip" and does **not** attend (verified after meal time ends in the background job), they earn **1 skip credit**.
- Every **2 skips** = **1 redeemable reward** (ice cream or equivalent).
- Students generate a **Reward QR Code** (`QR_REWARD_<userId>`) from the billing page.
- The admin scans it — the system verifies the student has ≥ 2 skips and deducts exactly 2 upon successful scan.
- Skips are **never pre-deducted**: deduction only happens at the moment of admin scanning, preventing fraud.

---

### 7. QR Code Ecosystem

**Files:** `pages/MyQr.jsx`, `pages/admin/QRScanner.jsx`, `controllers/adminController.js`

The project uses a **prefixed payload convention** to allow a single admin scanner to handle all QR types:

| QR Type | Payload Format | Action |
|---------|----------------|--------|
| **Student Attendance** | `<mongoObjectId>` (24-char hex) | Marks attendance on current meal, validates meal time window |
| **Guest Pass** | `QR_GUEST_<randomId>` | Logs guest entry (dues already charged at purchase) |
| **Reward Claim** | `QR_REWARD_<userId>` | Deducts 2 skips, awards reward to student |

The admin QR hub auto-detects the type from the payload prefix and routes to the correct backend handler.

---

### 8. Daily Menu Management

**Files:** `controllers/menuController.js`, `routes/menuRoutes.js`, `pages/Menu.jsx`, `pages/admin/MenuManagement.jsx`

- Admins upload a **weekly menu template** (Mon–Sun, 3 meals/day) once via `POST /api/menu/weekly`.
- The system **auto-repeats the template** for every week of the month until month end — generating all meal documents in a single call.
- Duplicate uploads are blocked: the controller checks for existing meals in the date range before inserting.
- Students and admins view menus using `GET /api/menu/today` which uses IST (UTC+5:30) timezone offset correction to always return the correct day's meals.

---

### 9. Live Crowd Meter

**Files:** `controllers/engagementController.js` (`getLiveCrowd`), `components/CrowdMeter.jsx`, `pages/Crowd.jsx`

- Based on the **actual attendee entry timestamps** stored in `meal.actualAttendees[].entryTime`.
- Returns a count of students who were scanned **within the last 20 minutes** as the "live crowd".
- This gives a real-time visual indicator of current mess congestion on the student dashboard.

---

### 10. Polls & Engagement

**Files:** `controllers/engagementController.js` (poll section), `models/Poll.js`, `pages/Polls.jsx`, `pages/admin/PollManagement.jsx`

- Admins create time-limited polls with a question and 2+ options (configurable duration in minutes).
- Students vote in active (non-expired) polls — **one vote per user per poll** enforced at the database level via `votedUsers` array.
- Admins can view all polls (active and expired) with vote counts and delete them.
- Poll results drive food preference analytics.

---

### 11. Feedback & Ratings

**Files:** `controllers/engagementController.js` (feedback section), `models/Feedback.js`, `pages/Feedback.jsx`, `pages/admin/AdminFeedback.jsx`

- Students rate individual meals (1–5 stars) and optionally leave comments.
- **One rating per user per meal** is enforced.
- Feedback is linked to both the `User` and the `Meal` document.
- Admins see a full table of all feedback, including who rated what meal and when.

---

### 12. Admin: Cook Sheet

**Files:** `controllers/adminController.js` (`getCookSheet`), `pages/admin/AdminDashboard.jsx`

The cook sheet is the admin's operational planning tool:

- Shows **today's and tomorrow's meals** with:
  - Menu items
  - RSVP headcount (total students − skipping students)
  - Actual RSVP attending count
  - Actual RSVP skipping count
- Uses IST-corrected date boundaries to ensure correctness regardless of server timezone.

---

### 13. Admin: Analytics Dashboard

**Files:** `controllers/adminController.js` (`getAnalytics`), `pages/admin/AdminAnalytics.jsx`

A multi-panel analytics view for mess operations:

| Panel | Data |
|-------|------|
| **Food Saved Trend** | Bar chart — estimated kilograms of food saved over 7 days based on skip RSVP data |
| **Money Saved Trend** | Line chart — financial equivalent of food saved (₹50/kg) |
| **Overall Avg Rating** | Aggregate star rating from all feedback |
| **Daily Ratings Trend** | Line chart of average meal ratings over 7 days |
| **Top 3 Meals** | Hall of fame: highest rated meals |
| **Bottom 3 Meals** | Grievance table: lowest rated meals |
| **AI Predictor Alerts** | Rule-based alerts (e.g., "Weekend approaching — expect 30% drop in dinner attendance") |
| **Student Eco-Footprint** | Per-student kg of food saved via accurate skip RSVPs, 30-day attendance heatmap |

---

### 14. Admin: QR Scanner Hub

**Files:** `pages/admin/QRScanner.jsx`, `controllers/adminController.js`

A unified scanning interface using `html5-qrcode`:

- **Continuous scan mode** — auto-restarts after each successful scan
- Detects QR type from payload prefix and dispatches to the correct endpoint:
  - Plain 24-char ID → `POST /api/admin/attendance`
  - `QR_GUEST_*` → Guest logged (guest dues pre-charged)
  - `QR_REWARD_*` → `POST /api/admin/verify-reward`
- Returns a clear success/error message for each scan with remarks (e.g., skip cancellation, rebate override)

---

### 15. Admin: Billing & Master Ledger

**Files:** `controllers/billingController.js` (`generateInvoices`), `pages/admin/AdminBilling.jsx`

The most computationally intensive feature — a single button that:

1. **Fetches all students** and computes individualized billing (billed days, rebated days, guest dues, balance) for each one
2. **Generates individual PDF invoices** using `PDFKit`, streamed into memory buffers
3. **Emails each invoice** as an attachment to the student's registered email via Nodemailer
4. **Generates a Master Ledger PDF** with all students' summaries and total expected revenue
5. **Returns the Master Ledger** as a downloadable PDF response to the admin browser

This operation legitimately cannot run on serverless — it requires a persistent, long-lived server connection.

---

### 16. Admin: Student Search

**Files:** `controllers/adminController.js` (`searchStudent`, `deleteStudent`), `pages/admin/StudentSearch.jsx`

- Search any student by **roll number** (maps to `<rollNumber>@nitkkr.ac.in`)
- Returns: name, email, skip count, guest dues, number of approved rebates, and live prepaid balance
- Admin can **delete a student account** (removes user + all associated rebates)

---

## 🗄️ Database Schema

### `User`
| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Full name |
| `email` | String | Must match `@nitkkr.ac.in` — unique |
| `password` | String | Bcrypt-hashed |
| `role` | String | `student` \| `admin` \| `contractor` |
| `isVerified` | Boolean | False until OTP verified |
| `otp` | String | Temporary 6-digit OTP |
| `otpExpires` | Date | OTP validity window (10 min) |
| `skippedMeals` | Number | Lifetime skip credits earned |
| `rewardsAvailable` | Number | Active (unscanned) rewards |
| `guestDues` | Number | Total guest pass dues (₹) |

### `Meal`
| Field | Type | Description |
|-------|------|-------------|
| `date` | Date | Meal date (UTC-stored, IST-adjusted on query) |
| `type` | String | `Breakfast` \| `Lunch` \| `Dinner` |
| `menuItems` | [String] | Dish names for this meal |
| `attendingStudents` | [ObjectId] | RSVP attending list |
| `skippedStudents` | [ObjectId] | RSVP skip list |
| `isRsvpLocked` | Boolean | Locks RSVP before meal time |
| `isSkipsProcessed` | Boolean | Prevents double-processing in background job |
| `actualAttendees` | [{student, entryTime}] | Physically scanned attendees with timestamps |

### `Rebate`
| Field | Type | Description |
|-------|------|-------------|
| `user` | ObjectId | Student reference |
| `startDate` / `endDate` | Date | Rebate window |
| `phone` | String | Contact number |
| `reason` | String | Reason for leave |
| `status` | String | `pending` \| `approved` \| `rejected` |

### `Feedback`
| Field | Type | Description |
|-------|------|-------------|
| `user` | ObjectId | Who rated |
| `meal` | ObjectId | Which meal was rated |
| `rating` | Number | 1–5 stars |
| `comments` | String | Optional text |

### `Poll`
| Field | Type | Description |
|-------|------|-------------|
| `question` | String | Poll question |
| `options` | [{name, votes}] | Options with vote tallies |
| `expiresAt` | Date | Auto-calculated from `durationMins` |
| `votedUsers` | [ObjectId] | Prevents double voting |

---

## 📡 API Reference

### Auth Routes — `/api/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register & send OTP |
| POST | `/verify-otp` | ❌ | Verify OTP & activate account |
| POST | `/resend-otp` | ❌ | Resend OTP |
| POST | `/login` | ❌ | Login & get JWT token |
| GET | `/me` | ✅ JWT | Get current user profile |

### Menu Routes — `/api/menu`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/weekly` | ✅ Admin | Upload weekly menu template |
| GET | `/today` | ✅ JWT | Get today's and tomorrow's meals |

### Billing Routes — `/api/billing`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/ledger` | ✅ Student | Get personal billing ledger |
| POST | `/rebate` | ✅ Student | Apply for rebate |
| GET | `/rebates` | ✅ Student | Get my rebate history |
| POST | `/guest-pass` | ✅ Student | Purchase guest pass + get QR |
| POST | `/claim-reward` | ✅ Student | Generate reward QR code |
| GET | `/pending-rebates` | ✅ Admin | Get all rebate requests |
| PATCH | `/rebate/:rebateId` | ✅ Admin | Approve or reject rebate |
| POST | `/generate-invoices` | ✅ Admin | Generate PDFs + email all students |

### Engagement Routes — `/api/engagement`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/polls` | ✅ JWT | Get active polls |
| POST | `/polls/:pollId/vote` | ✅ Student | Vote on poll |
| POST | `/feedback/:mealId` | ✅ Student | Submit meal feedback |
| GET | `/crowd` | ✅ JWT | Get live crowd count |
| GET | `/my-analytics` | ✅ Student | Eco-footprint + 30-day heatmap |

### Admin Routes — `/api/admin`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/cook-sheet` | ✅ Admin | Today & tomorrow meal headcounts |
| GET | `/analytics` | ✅ Admin | Full analytics dashboard data |
| POST | `/attendance` | ✅ Admin | Scan student QR for attendance |
| POST | `/verify-reward` | ✅ Admin | Scan reward QR — deduct 2 skips |
| GET | `/search-student` | ✅ Admin | Search student by roll number |
| DELETE | `/student/:id` | ✅ Admin | Delete student account |
| GET | `/feedback` | ✅ Admin | View all feedback |
| GET | `/polls` | ✅ Admin | View all polls (active + expired) |
| POST | `/polls` | ✅ Admin | Create a new poll |
| DELETE | `/polls/:pollId` | ✅ Admin | Delete a poll |

### RSVP Routes — `/api/rsvp`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/:mealId/attend` | ✅ Student | RSVP attending |
| POST | `/:mealId/skip` | ✅ Student | RSVP skipping |

---

## 📁 Project Structure

```
nit-kkr-mess/
├── server.js                   # Express app entry point + background skip-processing job
├── package.json
├── .env                        # Environment secrets (not committed)
├── cloudflared.exe             # Cloudflare tunnel binary (Windows)
├── start-tunnel.ps1            # PowerShell script to start tunnel + display Vercel update instructions
│
├── config/
│   └── db.js                   # MongoDB Atlas connection via Mongoose
│
├── middleware/
│   └── authMiddleware.js       # JWT verification + role guards (protect, adminOnly)
│
├── models/
│   ├── User.js                 # User schema (students, admins, contractors)
│   ├── Meal.js                 # Meal schema (menu, RSVP lists, actual attendees)
│   ├── Rebate.js               # Rebate request schema
│   ├── Billing.js              # (Reserved billing records)
│   ├── Feedback.js             # Meal feedback / ratings
│   ├── Menu.js                 # (Weekly menu template)
│   └── Poll.js                 # Poll schema with vote tracking
│
├── controllers/
│   ├── authController.js       # Register, OTP, login, profile
│   ├── menuController.js       # Weekly upload, today's meals (IST-corrected)
│   ├── billingController.js    # Ledger, rebates, guest pass, rewards, PDF + email invoicing
│   ├── adminController.js      # Cook sheet, analytics, attendance scanning, student search
│   ├── engagementController.js # Polls, feedback, crowd meter, student analytics
│   └── rsvpController.js       # Meal RSVP (attend/skip)
│
├── routes/
│   ├── authRoutes.js
│   ├── menuRoutes.js
│   ├── billingRoutes.js
│   ├── adminRoutes.js
│   ├── engagementRoutes.js
│   └── rsvpRoutes.js
│
└── frontend/                   # Vite + React application
    ├── vercel.json             # Vercel SPA routing config
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx             # Router setup (React Router v6)
        ├── App.css / index.css # Global styles (Vanilla CSS custom UI)
        ├── context/            # Auth context (JWT storage, user state)
        ├── services/
        │   └── api.js          # Axios instance with base URL + JWT interceptor
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Sidebar.jsx           # Student sidebar navigation
        │   ├── AdminSidebar.jsx      # Admin sidebar navigation
        │   ├── CrowdMeter.jsx        # Live crowd indicator widget
        │   ├── MealCard.jsx          # Individual meal display card
        │   ├── PollCard.jsx          # Poll voting UI
        │   ├── Leaderboard.jsx
        │   ├── StatCard.jsx
        │   ├── ProtectedRoute.jsx    # JWT + role-based route guard
        │   ├── DashboardLayout.jsx
        │   └── AdminLayout.jsx
        └── pages/
            ├── LandingPage.jsx
            ├── Login.jsx
            ├── Register.jsx
            ├── VerifyOTP.jsx
            ├── Dashboard.jsx         # Student home (crowd, menu, polls, stats)
            ├── Menu.jsx              # Today's menu display
            ├── Billing.jsx           # Personal ledger + rebate + guest pass + reward
            ├── Rebates.jsx           # Rebate application form + history
            ├── MyQr.jsx              # Personal student QR for attendance
            ├── Feedback.jsx          # Meal rating form
            ├── Polls.jsx             # Active polls for students
            ├── Profile.jsx           # Personal profile view
            ├── Crowd.jsx             # Live crowd meter page
            ├── Analytics.jsx         # Student eco-footprint + heatmap
            ├── Scanner.jsx
            └── admin/
                ├── AdminDashboard.jsx    # Cook sheet + today's operations
                ├── AdminBilling.jsx      # Rebate approvals + invoice generation
                ├── AdminAnalytics.jsx    # Full analytics dashboard
                ├── AdminFeedback.jsx     # View all student feedback
                ├── MenuManagement.jsx    # Weekly menu upload form
                ├── PollManagement.jsx    # Create / manage polls
                ├── QRScanner.jsx         # Unified QR scanner hub
                └── StudentSearch.jsx     # Search & manage student accounts
```

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js** v18 or higher
- **npm** v9 or higher
- A **MongoDB Atlas** account (free tier is sufficient)
- A **Gmail account** with an [App Password](https://support.google.com/accounts/answer/185833) enabled

### 1. Clone the Repository

```bash
git clone https://github.com/Sulemankhannit/nit-kkr-mess.git
cd nit-kkr-mess
```

### 2. Environment Variables

Create a `.env` file in the **root** directory (`/nit-kkr-mess/.env`):

```env
PORT=5001
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_16_char_gmail_app_password
```

> **Note on EMAIL_PASS:** This must be a Gmail **App Password**, not your regular Gmail password. Go to Google Account → Security → 2-Step Verification → App Passwords.

> **Note on OTP fallback:** If email fails (wrong credentials), the OTP is always printed to the server console for testing purposes. Look for `[TESTING] OTP generated for <email>: <otp>`.

### 3. Install Dependencies

**Backend:**
```bash
npm install
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

### 4. Run the Application

Open **two terminal windows** simultaneously:

**Terminal 1 — Backend (from root):**
```bash
npm run dev
```
Server starts at `http://localhost:5001`

**Terminal 2 — Frontend (from `/frontend`):**
```bash
cd frontend
npm run dev
```
Frontend starts at `http://localhost:5173`

The frontend is pre-configured to proxy API calls to `localhost:5001` during local development.

---

## 🚀 Deployment Guide

### Step 1: Deploy Frontend to Vercel

1. Push the repository to GitHub
2. Import the project on [vercel.com](https://vercel.com)
3. Set the **Root Directory** to `frontend`
4. Add **Environment Variable:** `VITE_API_URL` = *(leave blank for now, update after tunnel is started)*
5. Deploy

### Step 2: Start the Backend + Cloudflare Tunnel

Use the provided PowerShell helper script from the project root:

```powershell
.\start-tunnel.ps1
```

This script:
- Starts `cloudflared.exe tunnel --url http://localhost:5001`
- Waits for the tunnel URL to appear
- Prints the generated `.trycloudflare.com` API URL
- **Automatically copies the API URL to your clipboard**
- Displays step-by-step instructions to update Vercel

### Step 3: Update Vercel Environment Variable

1. Go to [vercel.com](https://vercel.com) → your project → **Settings** → **Environment Variables**
2. Set `VITE_API_URL` = `https://<generated-id>.trycloudflare.com/api`
3. Click **Save** and then **Redeploy**

> **Important:** The Cloudflare tunnel URL changes every time you restart it. You must update `VITE_API_URL` in Vercel each session. The `start-tunnel.ps1` script copies it to clipboard automatically.

---

## ⚙️ Background Jobs

The server runs a **background interval job** (every 60 seconds) defined directly in `server.js`:

**Skip Processing Job:**
- Queries all `Meal` documents where `isSkipsProcessed: false`
- For each meal, checks if the meal time has ended:
  - **Breakfast:** after 9:05 AM
  - **Lunch:** after 2:05 PM
  - **Dinner:** after 9:05 PM
  - Past meals (any date before today) are always eligible
- For each student in `skippedStudents` who is **not** in `actualAttendees`, increments their `user.skippedMeals` by 1
- Sets `meal.isSkipsProcessed = true` to prevent reprocessing

This deferred validation ensures that a student only earns a skip if they:
1. Told the system they'd skip (RSVP), **and**
2. Actually did not show up (not scanned by admin)

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | ✅ | Backend server port (default: `5001`) |
| `MONGO_URI` | ✅ | Full MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Secret key for signing JWT tokens |
| `EMAIL_USER` | ✅ | Gmail address for sending OTPs and invoices |
| `EMAIL_PASS` | ✅ | Gmail App Password (16 characters, no spaces) |

---

## 📝 Notes for Evaluators

- The **live Vercel link** serves the React frontend only.
- To see the **full system working** (API calls, database, PDF generation, etc.), the backend must be running locally with the Cloudflare tunnel active.
- Refer to [Local Development Setup](#-local-development-setup) and [Deployment Guide](#-deployment-guide) above.
- Registration requires a **valid `@nitkkr.ac.in` email** (enforced at DB level). For testing, use a placeholder like `test123@nitkkr.ac.in`.
- OTPs are always printed to the server console as a fallback even if email delivery fails.

---

<div align="center">

Made with ❤️ by **Suleman Khan** for NIT KKR

</div>
