🛡️ CovenantGuard AI
> Real-time covenant monitoring and risk prioritization for loan portfolios.
🚀 Elevator Pitch
CovenantGuard AI automates loan covenant monitoring for banks and lenders.
Instead of manually reviewing long financial documents and spreadsheets, the system provides a risk-first dashboard that instantly highlights covenant breaches such as Debt-to-Equity, Interest Coverage, and Liquidity ratios.


🛑 The Problem

⏱️ Manual Overload: Covenant checks are spreadsheet-heavy and time-consuming

🚨 Late Detection: Breaches are often identified weeks too late

❌ Human Error: Missed breaches increase default risk and regulatory exposure

💡 The Solution

A lightweight, API-driven monitoring engine that:

1. Evaluates financial ratios in real time


2. Automatically classifies risk (Safe / Watch / Critical)


3. Explains breaches in plain language


4. Visualizes portfolio risk instantly


💰 Commercial Value (Why LMA Cares)

⚡ 70–80% time reduction in covenant monitoring

🔔 Early-warning system for credit risk teams

📈 Scalable architecture for large loan portfolios

🧾 Audit-ready transparency for compliance teams

🛠️ Tech Stack

Backend

FastAPI (Python) – high-performance REST API

Pydantic – data validation & schema enforcement
Frontend

Vanilla JavaScript

HTML5 + CSS3

Bank-grade dashboard UI

Deployment

API: Render

Frontend: Vercel

✨ Key Features

📊 Portfolio Dashboard – exposure, risk counts, live status

🔴 Risk-First Sorting – critical loans always on top

🧠 Rule-Based AI Insights – instant explanation of breaches

🎮 Simulation Mode – stress-test portfolio under market events

💬 Interactive Chat Assistant – query portfolio in natural language


🚀 How to Run Locally

1️⃣ Clone Repository

git clone https://github.com/YOUR_USERNAME/CovenantGuard.git
cd CovenantGuard


2️⃣ Backend (FastAPI)

cd backend
pip install -r requirements.txt
uvicorn main:app --reload

API will run at:

http://127.0.0.1:8000


3️⃣ Frontend

1. Open frontend/js/app.js


2. Set:
const API_URL = "http://127.0.0.1:8000/api/loans";

3. Open frontend/index.html in browser


🔮 Future Roadmap

📄 PDF Covenant Extraction (LLM-assisted parsing)

🔔 Automated Alerts (email / Slack)

🧠 Offline Risk Engine (embedded ML / rule engine)

🔐 Immutable Audit Logs (hash-based compliance trail)


🏁 Hackathon Note

This prototype focuses on architecture, clarity, and risk prioritization rather than full LLM dependency.
The system is designed to work even without external AI APIs, making it reliable, fast, and deployable in regulated environments.

Built with ❤️ for LMA EDGE Hackathon 2026

