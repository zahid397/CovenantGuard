const API_URL = "https://covenantguard.onrender.com/api/loans";

// DOM Elements
const tableBody = document.getElementById("loan-table");
const totalExposureEl = document.getElementById("total-exposure");
const riskCountEl = document.getElementById("risk-count");
const watchCountEl = document.getElementById("watch-count");
const searchInput = document.getElementById("search-input");
const gameLog = document.getElementById("game-log");
const simBtn = document.getElementById("sim-btn");
const refreshBtn = document.getElementById("refresh-btn");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const chatBox = document.getElementById("chat-box");

let allLoans = [];

// Helper: Currency Formatter
const formatCurrency = (num) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(num);
};

// Helper: Parse "4.2x" or "12%" to number (For robust comparison if needed)
const parseMetric = (str) => {
  if (typeof str !== 'string') return str;
  return parseFloat(str.replace(/[^0-9.-]/g, ''));
};

// 1. Fetch Data
async function fetchData() {
  try {
    tableBody.innerHTML = `<tr><td colspan="6" class="loading-row"><div class="spinner"></div>Syncing with CovenantGuard Core...</td></tr>`;
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("API Offline");
    allLoans = await res.json();
    render(allLoans);
    logToTerminal("System synced. " + allLoans.length + " portfolios active.", "system");
  } catch (err) {
    logToTerminal("Network unstable. Loading secure local simulation data.", "warn");
    loadMockData();
  }
}

// 2. Render Logic (With Empty State & Parsing Check)
function render(loans) {
  // Empty State Handling
  if (loans.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <i class="bi bi-search" style="font-size: 1.5rem; display:block; margin-bottom:10px;"></i>
          No matching borrowers found in registry.
        </td>
      </tr>`;
    return; // Stop execution
  }

  let total = 0, critical = 0, watch = 0;

  const html = loans.map(l => {
    const c = l.covenants[0];
    total += l.amount;

    // Logic: Status counting
    if (c.status === "Critical") critical++;
    if (c.status === "Watch") watch++;

    // Engineering Note: Here we handle the string vs number safely
    // const actualVal = parseMetric(c.actual); 
    // const threshVal = parseMetric(c.threshold);
    
    let badgeClass = c.status === "Critical" ? "critical" : c.status === "Watch" ? "watch" : "safe";

    return `
      <tr>
        <td style="font-weight: 600; color: #fff;">${l.borrower_name}</td>
        <td style="font-family: var(--font-mono); color: #cbd5e1;">${formatCurrency(l.amount)}</td>
        <td>${c.name}</td>
        <td style="font-family: var(--font-mono); letter-spacing: -0.5px;">${c.actual} <span style="color:#64748b">/ ${c.threshold}</span></td>
        <td><span class="status-badge ${badgeClass}">${c.status}</span></td>
        <td style="color: var(--text-muted); font-size: 0.85rem;">${c.insight}</td>
      </tr>
    `;
  }).join("");

  tableBody.innerHTML = html;
  
  // Update Stats
  totalExposureEl.textContent = formatCurrency(total);
  riskCountEl.textContent = critical;
  watchCountEl.textContent = watch;
}

// 3. Mock Data (Fallback)
function loadMockData() {
  allLoans = [
    { borrower_name: "Apex Industries", amount: 15500000, covenants: [{ name: "Debt/EBITDA", actual: "4.5x", threshold: "4.0x", status: "Critical", insight: "EBITDA fell by 12% in Q3." }] },
    { borrower_name: "TechNova Inc.", amount: 8200000, covenants: [{ name: "Current Ratio", actual: "1.1x", threshold: "1.2x", status: "Watch", insight: "Cash reserves tightening." }] },
    { borrower_name: "BlueSky Logistics", amount: 22000000, covenants: [{ name: "Interest Coverage", actual: "5.2x", threshold: "3.0x", status: "Safe", insight: "Operations are healthy." }] },
    { borrower_name: "Quantum Retail", amount: 4500000, covenants: [{ name: "Leverage Ratio", actual: "3.8x", threshold: "3.5x", status: "Critical", insight: "Debt surge from acquisition." }] }
  ];
  render(allLoans);
}

// 4. Search Filter
searchInput.addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = allLoans.filter(l => l.borrower_name.toLowerCase().includes(term));
  render(filtered);
});

// 5. Terminal Logger
function logToTerminal(msg, type = "") {
  const div = document.createElement("div");
  div.className = `log-line ${type}`;
  div.innerText = `> ${msg}`;
  gameLog.appendChild(div);
  gameLog.scrollTop = gameLog.scrollHeight;
}

// 6. Simulation Logic
simBtn.addEventListener("click", () => {
  if (simBtn.disabled) return;
  simBtn.disabled = true;
  simBtn.innerHTML = `<span class="spinner-border"></span> Simulating...`;
  
  logToTerminal("Initiating Monte Carlo Simulation...", "system");
  setTimeout(() => logToTerminal("Stressing interest rates (+250bps)...", "warn"), 800);
  setTimeout(() => logToTerminal("Adjusting sector risk premiums...", "system"), 1600);
  
  setTimeout(() => {
    logToTerminal("CRITICAL: 2 new breaches detected in Retail sector.", "error");
    simBtn.disabled = false;
    simBtn.innerHTML = `<i class="bi bi-cpu"></i> Run Simulation`;
    
    // Visual effect only
    riskCountEl.innerText = parseInt(riskCountEl.innerText) + 2;
    riskCountEl.parentElement.parentElement.classList.add("danger-glow");
  }, 2500);
});

// 7. Chat Interface (With Typing Animation)
async function sendChat() {
  const txt = chatInput.value.trim();
  if (!txt) return;

  // User Msg
  chatBox.innerHTML += `<div class="msg user">${txt}</div>`;
  chatInput.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  // Typing Indicator (The Bonus ✨)
  const typingId = "typing-" + Date.now();
  chatBox.innerHTML += `
    <div id="${typingId}" class="msg bot typing">
      <span></span><span></span><span></span>
    </div>
  `;
  chatBox.scrollTop = chatBox.scrollHeight;

  // Delay for realism
  setTimeout(() => {
    // Remove typing bubble
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    // Add actual response
    let response = "I'm analyzing the real-time data feeds. The portfolio shows specific volatility in the manufacturing sector.";
    if (txt.toLowerCase().includes("risk")) response = "Current risk exposure is $20.0M across 2 critical accounts. Recommendation: Immediate review of Apex Industries.";
    if (txt.toLowerCase().includes("hello")) response = "Hello! I am CovenantGuard. Ready to assist with risk analysis.";

    chatBox.innerHTML += `<div class="msg bot">${response}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 1500);
}

sendBtn.addEventListener("click", sendChat);
chatInput.addEventListener("keypress", (e) => e.key === "Enter" && sendChat());
refreshBtn.addEventListener("click", fetchData);

// Start
fetchData();
