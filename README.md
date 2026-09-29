# ✨ Jay Real Estate — Dubai Luxury Property Portal & CRM

A luxury real estate platform and private CRM built for prime Dubai properties, ready sky penthouses, beachfront mansions, and off-plan developments.

---

## 🌟 Key Features

### 🏛️ Public Luxury Portal
- **Brand Aesthetic**: Calm, minimal, off-white, deep charcoal, and brushed gold luxury styling with *Cormorant Garamond*, *Cinzel*, and *Plus Jakarta Sans* typography.
- **Ready Residences Portfolio**: Filter by community (*Palm Jumeirah, Downtown Dubai, Dubai Marina, Dubai Hills Estate, Business Bay, JVC*), bedrooms, property type, and price range with instant currency conversion (AED, USD, EUR, GBP).
- **Off-Plan Landmark Developments**: Interactive showcase with handover schedules, construction progress, payment plans, and VIP brochure downloads.
- **Mortgage Calculator**: Dynamic AED payment estimator with down payment %, interest rate %, loan period, and Dubai Land Department fee breakdowns.
- **Instant Valuation ("Sell")**: Comprehensive multi-step property valuation submission.
- **Universal Lead Capture**: Every single form (*Hero search, Register Interest, Viewing booking, Property inquiry, Brochure download, Valuation, Mortgage pre-approval, Floating WhatsApp, Callback modal*) automatically captures the buyer with source attribution.
- **Smart Anti-Spam**: Honeypot protection paired with IP rate limiting.
- **Lead Response**: Displays *"Thank you. A Jay Real Estate advisor will contact you within 24 hours."* after every submission.

### 🛡️ Private Advisory CRM Vault
- **Lead Intelligence & AI Scoring (0 – 100)**: Evaluates buyer readiness (cash vs. mortgage, timeframe, budget, direct phone, attached property) and tags them as 🔥 **HOT**, ☀️ **WARM**, or ❄️ **COLD**.
- **Real-Time Notification Bell**: Automatically polls and updates unread lead badges every 60 seconds with an interactive inquiry drawer.
- **Executive Dashboard**: Daily leads, total deal pipeline, viewings this week, closed sales, and **2% commission calculations** with dynamic charts.
- **Kanban Drag-and-Drop Pipeline**: Manage stages seamlessly (*New ➔ Contacted ➔ Viewing ➔ Offer ➔ Won ➔ Lost*).
- **Deal Closing Automation**: Dragging or marking a lead as **"Won"** prompts for the final sale price, computes 2% commission, logs the closed deal, and marks the property as **"Sold"**.
- **Leads Directory & Excel Export**: Instant search, filters, and 1-click **Excel (.csv)** download.
- **Lead Profile & Quick Actions**: View full background, write timestamped notes, reassign agents, schedule viewings, and initiate direct **WhatsApp** or **Phone Calls**.
- **Performance & Stale Alerts**: Inactive leads alert (3+ days no action), Viewings calendar, and Agent Leaderboard against monthly targets.
- **Inventory Management**: Full CRUD to add, edit, or remove ready properties and off-plan projects.
- **Role-Based Privacy**: Agents only see their assigned leads; Admin views entire brokerage pipeline.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (included with Node.js)

### 2. Installation
Open your terminal in the project directory:
```bash
npm install
```

### 3. Running the Server
Start the local server:
```bash
node server.js
```
Open your browser and navigate to:
👉 **`http://localhost:8080`**

---

## 🔑 Login Credentials

Access the private vault at: **`http://localhost:8080/#admin-login`** (or click **"🔒 Admin Login"** in the top-right header).

| Role | Name | Username | Password | Monthly Target |
| :--- | :--- | :--- | :--- | :--- |
| **Principal / Admin** | Jayden Vance | `admin` | `jay2026!` | AED 80,000,000 |
| **Senior Broker** | Sophia Laurent | `slaurent` | `agent123` | AED 45,000,000 |
| **Investment Consultant** | Tariq Mansoor | `tariq` | `agent123` | AED 35,000,000 |

---

## 🗄️ Neon PostgreSQL Database Connection

The application is preloaded with an embedded in-memory database and auto-connects to PostgreSQL when configured:

1. Open the [`.env`](.env) file in the root folder.
2. Paste your Neon PostgreSQL connection string:
   ```env
   DATABASE_URL=postgresql://[user]:[password]@[neon-hostname].neon.tech/[dbname]?sslmode=require
   ```
3. Restart the server (`node server.js`). The server will automatically initialize tables from `db/schema.sql` and seed all developers, projects, properties, leads, viewings, and closed sales.

---

## 🔒 Security & Privacy Practices
- `.env` and all sensitive credentials are listed in `.gitignore` and will never be committed to Git or public repositories.
- The Admin CRM area is excluded from search engine indexation via `robots.txt` and dynamic `<meta name="robots" content="noindex, nofollow, noarchive">` tags.
- Rate-limiting prevents automated spam submissions on public inquiry forms.

---

## 📦 Pushing to GitHub

Follow these steps to save your project to your GitHub account:

```bash
# 1. Initialize git repository
git init

# 2. Add all files (secrets and node_modules are automatically ignored by .gitignore)
git add .

# 3. Commit the code
git commit -m "feat: Initial commit of Jay Real Estate luxury portal and private CRM"

# 4. Set main branch
git branch -M main

# 5. Link your GitHub repository (replace with your repository URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git

# 6. Push to GitHub
git push -u origin main
```
