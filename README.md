
🛡️ CovenantGuard AI — Hackathon Prototype

> Real-time covenant monitoring and risk prioritization for loan portfolio

🚀 Elevator Pitch

CovenantGuard AI automates loan covenant monitoring for banks and lenders.

Instead of manually reviewing long financial documents and spreadsheet-based covenant checks, the system provides a risk-first dashboard that instantly highlights covenant breaches such as:

Debt-to-Equity

Interest Coverage

Liquidity ratios


The goal is early risk visibility, not after-the-fact reporting.


🛑 The Problem

Loan covenant monitoring today is still largely manual and reactive.

⏱️ Manual Overload
Covenant checks are spreadsheet-heavy, repetitive, and time-consuming

🚨 Late Detection
Breaches are often identified weeks too late

❌ Human Error
Missed breaches increase default risk and regulatory exposure


💡 The Solution

A lightweight, API-driven monitoring engine that:

1. Evaluates financial ratios in real time


2. Automatically classifies risk (Safe / Watch / Critical)


3. Explains covenant breaches in plain language


4. Visualizes portfolio risk instantly




💰 Commercial Value (Why LMA Cares)

⚡ 70–80% time reduction in covenant monitoring

🔔 Early-warning system for credit risk teams

📈 Scalable architecture for large loan portfolios

🧾 Audit-ready transparency foh7r compliance teams




🛠️ Tech Stack

Backend

FastAPI (Python) – High-performance REST API

Pydantic – Data validation & schema enforcement

Rule Engine – Deterministic, explainable risk classification logic


Frontend

Vanilla JavaScript – Lightweight, framework-free UI

HTML5 + CSS3 – Clean, responsive dashboard

Risk-first UI – Critical loans surfaced immediately


Deployment

API: Render

Frontend: Vercel



---

✨ Key Features

📊 Portfolio Dashboard
Exposure overview, risk counts, live loan status

🔴 Risk-First Sorting
Critical loans always pinned to the top

🧠 Explainable Risk Insights
Plain-language explanations for covenant breaches

🎮 Simulation Mode
Stress-test portfolio under hypothetical market events

💬 Interactive Chat Assistant
Query portfolio data using natural language



---

🚀 How to Run Locally

1️⃣ Clone Repository

git clone https://github.com/YOUR_USERNAME/CovenantGuard.git
cd CovenantGuard

2️⃣ Backend (FastAPI)

cd backend
pip install -r requirements.txt
uvicorn main:app --reload

API will run at:
👉 http://127.0.0.1:8000


---

3️⃣ Frontend

1. Open frontend/js/app.js


2. Set:



const API_URL = "http://127.0.0.1:8000/api/loans";

3. Open frontend/index.html in your browser




---

🔮 Future Roadmap

📄 PDF Covenant Extraction (LLM-assisted parsing)

🔔 Automated Alerts (Email / Slack)

🧠 Offline Risk Engine (Embedded ML / rule engine)

🔐 Immutable Audit Logs (Hash-based compliance trail)



---

🏁 Hackathon Note

This prototype focuses on architecture clarity, explainability, and risk prioritization rather than full LLM dependency.

Some features (e.g. PDF parsing, authentication) were intentionally deferred to keep the system:

Fast

Auditable

Deployable in regulated environments


The system is designed to function even without external AI APIs, reducing operational risk.

Built with ❤️ for LMA EDGE Hackathon 2026


---

🙌 Why This Project

During hackathons and real-world finance discussions, I noticed that loan covenant monitoring is still heavily manual and spreadsheet-driven.

As a solo builder, I wanted to explore whether a lightweight system could surface risk signals earlier without relying entirely on black-box AI.


---

⚖️ Tradeoffs & Limitations

Due to hackathon time constraints:

PDF covenant extraction is planned but not implemented

No authentication layer is included

Risk classification is rule-based, not ML-trained


These are conscious design choices to prioritize:

Explainability

Speed

Auditability



---

📌 Status

Hackathon Prototype
Focused on problem-solving, clarity, and deployable architecture.

