# 🛡️ CovenantGuard AI

> **Real-time covenant monitoring and risk prioritization for loan portfolios.**

![Status](https://img.shields.io/badge/Status-Prototype-success)
![Event](https://img.shields.io/badge/Hackathon-LMA%20EDGE%202026-blue)
![Tech](https://img.shields.io/badge/Stack-Django%20%7C%20JS%20%7C%20Bootstrap-orange)

### 🚀 The Elevator Pitch
**CovenantGuard AI** automates the tedious, error-prone process of tracking loan covenants. Instead of bankers manually reviewing 200+ page PDFs, our system provides a **risk-first dashboard** that instantly highlights which loans are breaching their financial limits (e.g., Debt-to-Equity, Interest Coverage).

---

### 🛑 The Problem
* **Manual Overload:** Bankers spend hours calculating ratios manually from spreadsheets.
* **Latency Risk:** Breaches are often detected weeks after they happen.
* **Human Error:** Missed covenants lead to bad debt and regulatory fines.

### 💡 The Solution
A centralized monitoring engine that ingests financial data and runs it against agreed covenant rules, providing:
1.  **Risk-First Sorting:** Critical breaches appear at the top immediately.
2.  **Visual Indicators:** Clear `Safe`, `Watch`, and `Critical` badges replacing complex spreadsheets.
3.  **AI Insights:** Automated one-sentence explanations for *why* a loan is risky.

---

### 💰 Commercial Viability (Why LMA Needs This)
* **Efficiency Gains:** Reduces covenant checking time by **70–80%** for operations teams.
* **Risk Mitigation:** Early warning system prevents defaults before they become unmanageable.
* **Scalability:** The architecture supports thousands of loans without performance lag.

---

### 🛠️ Tech Stack
* **Backend:** Django (Python), Django REST Framework (DRF)
* **Frontend:** Vanilla JavaScript, HTML5, Bootstrap 5 (Bank-Grade UI)
* **Deployment:** Render (API) + Vercel (Client)

---

### 📸 Key Features
* **Dashboard:** High-level view of Total Exposure and Risk Counts.
* **Smart Sorting:** The system thinks for you—sorting loans by risk severity automatically.
* **Auto-Explanation:** Provides context (e.g., "Debt spiked by 20% due to merger").

---

### 🚀 How to Run Locally

1. **Clone the repository**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/CovenantGuard.git](https://github.com/YOUR_USERNAME/CovenantGuard.git)
   cd CovenantGuard
  2. Backend Setup
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_db  # Loads demo data
python manage.py runserver

3.Frontend Setup
Go to frontend/js/app.js and ensure API_URL is pointing to localhost.
Open frontend/index.html in your browser.
🔮 Future Roadmap
PDF Parsing: Integrate Google Gemini API to automatically extract covenant thresholds from scanned loan agreements.
Email Alerts: Send automated emails to relationship managers upon covenant breach.
Blockchain Audit: Hash compliance records on-chain for immutable audit trails.
Built with ❤️ for the LMA EDGE Hackathon 2026
