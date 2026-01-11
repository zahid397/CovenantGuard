🛡️ CovenantGuard AI
Real-time covenant monitoring and risk prioritization for loan portfolios.
🚀 The Elevator Pitch
CovenantGuard AI stops loan defaults before they happen.
Instead of burying credit analysts in 50-page loan agreements and manual Excel sheets, our system provides a risk-first dashboard. It instantly flags critical breaches like Debt-to-Equity or Liquidity Ratios in real-time.
We built this to move compliance from "reactive reporting" to "proactive risk management."
🛑 The Problem
Talking to finance professionals, I realized something alarming: Loan Covenant Monitoring is still stuck in the spreadsheet era.
It's too slow: Analysts spend hours manually updating cells.
It's reactive: By the time a breach is found in a quarterly report, the damage is often already done.
It's error-prone: One wrong formula in Excel can hide a multimillion-dollar risk.
💡 The Solution
We built a lightweight, deterministic monitoring engine that cuts through the noise.
Real-Time Evaluation: Feeds financial data directly into a logic engine.
Risk Prioritization: Automatically tags loans as Safe, Watch, or Critical.
Plain English Explanations: Doesn't just say "Error 404"—it tells you why a covenant failed (e.g., "EBITDA dropped below required threshold").
Visual Clarity: A clean dashboard that puts the most dangerous loans at the top.
🛠️ Tech Stack
We chose stability and speed over complexity.
Backend: FastAPI (Python) – For high-performance, async REST endpoints.
Validation: Pydantic – To ensure data integrity remains strict (crucial for Fintech).
Logic: Custom Rule Engine – Deterministic code (no hallucinations) for risk classification.
Frontend: Vanilla JS + HTML/CSS – Kept it lightweight and dependency-free for instant loading.
Deployment: API on Render, Frontend on Vercel.
✨ Key Features
📊 Risk-First Dashboard: Instantly see which loans need attention. No digging required.
🧠 Explainable Insights: We prioritize "Explainability." Every red flag comes with a clear reason.
🎮 Simulation Mode: "What if interest rates go up?" – Stress test the portfolio instantly.
💬 Analyst Assistant: A simple chat interface to query specific loan details without SQL.
🚀 How to Run Locally
1️⃣ Clone the Repo
git clone https://github.com/YOUR_USERNAME/CovenantGuard.git
cd CovenantGuard
2️⃣ Backend (FastAPI)
requirements.txt
API runs at: http://127.0.0.1:8000
3️⃣ Frontend
1. Open frontend/js/app.js

2. Ensure the API URL is set:
   const API_URL = "http://127.0.0.1:8000/api/loans";

   3.Open frontend/index.html in your browser.
   🙌 Why This Project?
During the hackathon, I kept thinking about the "human cost" of manual banking. Analysts are burnt out, and banks are losing money due to slow reactions.
As a solo builder, I wanted to prove that you don't need a massive enterprise ERP to solve this. A smart, well-architected API can solve 80% of the headache with 10% of the cost. It's about smart architecture, not just AI hype.
⚖️ Tradeoffs & Limitations (Hackathon Edition)
To ship a working prototype within the time limit, I made some conscious choices:
No PDF Parsing (Yet): Currently, data is ingested via JSON/Forms. Automated PDF extraction via LLMs is in the roadmap.
Rule-Based over Black-Box: I intentionally used a logic engine instead of an LLM for the risk calculation to ensure 100% accuracy (Banks don't like hallucinations).
Auth: Skipped complex authentication to focus on the core logic engine.
🔮 Future Roadmap
LLM-Powered PDF Extraction: Drag-and-drop a loan contract to auto-fill covenants.
Notification Webhooks: Slack/Email alerts immediately when a covenant is breached.
Audit Trail: Immutable logs for compliance teams.
🏁 Final Note for Judges
This isn't just a concept—it's a functional prototype designed to be auditable, fast, and deployable. We focused on solving the business problem first.
Built with ❤️ for LMA EDGE Hackathon 2026
   
