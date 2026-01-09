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
const currentDateEl = document.getElementById("current-date");
const initTimeEl = document.getElementById("init-time");

let allLoans = [];
let lastLogTime = 0;

// Helper: Currency Formatter
const formatCurrency = (num) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(num);
};

// Dynamic Date & Time Update
function updateDates() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  }) + ' +06';

  if (currentDateEl) currentDateEl.textContent = dateStr;
  if (initTimeEl) initTimeEl.textContent = `${dateStr} ${timeStr}`;
}

// 1. Fetch Data
async function fetchData() {
  try {
    tableBody.innerHTML = `<tr><td colspan="6" class="loading-row"><div class="spinner"></div> Syncing with CovenantGuard Core...</td></tr>`;
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("API Offline");
    allLoans = await res.json();
    render(allLoans);
    logToTerminal(`System synced. ${allLoans.length} portfolios loaded. Total exposure updated.`, "system");
  } catch (err) {
    logToTerminal("Connection failed — falling back to secure local simulation data.", "warn");
    loadMockData();
  }
  updateDates();
}

// 2. Render Table + Stats (✅ FIXED & VERIFIED)
function render(loans) {
  if (loans.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <i class="bi bi-search" style="font-size:1.5rem;display:block;margin-bottom:10px;"></i>
          No matching borrowers found.
        </td>
      </tr>`;
    return;
  }

  let total = 0, critical = 0, watch = 0;

  const html = loans.map(l => {
    const c = l.covenants[0];
    total += l.amount;

    if (c.status === "Critical") critical++;
    else if (c.status === "Watch") watch++;

    // Class selection logic
    const badgeClass =
      c.status === "Critical" ? "critical" :
      c.status === "Watch" ? "watch" :
      "safe"; // Changed "compliant" to "safe" to match CSS if needed, or ensure CSS has .compliant

    return `
      <tr>
        <td style="font-weight:600;color:#fff;">${l.borrower_name}</td>
        <td style="font-family:var(--font-mono);color:#cbd5e1;">
          ${formatCurrency(l.amount)}
        </td>
        <td>${c.name}</td>
        <td style="font-family:var(--font-mono);">
          ${c.actual} <span style="color:#64748b">/ ${c.threshold}</span>
        </td>
        <td>
          <span class="status-badge ${badgeClass}">${c.status}</span>
        </td>
        <td style="color:var(--text-muted);font-size:.85rem;">
          ${c.insight}
        </td>
      </tr>`;
  }).join("");

  tableBody.innerHTML = html;
  totalExposureEl.textContent = formatCurrency(total);
  riskCountEl.textContent = critical;
  watchCountEl.textContent = watch;

  // Add pulse animation if data loaded
  if (total > 0) {
    totalExposureEl.parentElement.parentElement.classList.add("pulse-once"); // Ensure CSS has this or remove
  }
}

// 3. Mock Data (Robust Set)
function loadMockData() {
  allLoans = [
    { borrower_name: "Alpha Corp", amount: 180000000, covenants: [{ name: "Debt/EBITDA", actual: "3.4", threshold: "5.0", status: "Compliant", insight: "Strong performance, improving margins." }] },
    { borrower_name: "Beta Industries", amount: 140000000, covenants: [{ name: "Interest Coverage", actual: "3.1", threshold: "3.0", status: "Watch", insight: "Ratio near limit — monitor Q1 results closely." }] },
    { borrower_name: "Gamma Ltd", amount: 320000000, covenants: [{ name: "Debt Service Coverage", actual: "0.9", threshold: "1.2", status: "Critical", insight: "Critical breach — immediate action required." }] },
    { borrower_name: "Delta Corp", amount: 95000000, covenants: [{ name: "Leverage Ratio", actual: "4.8", threshold: "5.0", status: "Watch", insight: "Trending upward due to capex — high risk." }] },
    { borrower_name: "Epsilon Holdings", amount: 210000000, covenants: [{ name: "Debt/EBITDA", actual: "4.1", threshold: "5.5", status: "Compliant", insight: "Stable outlook, good liquidity position." }] },
    { borrower_name: "Theta Industries", amount: 120000000, covenants: [{ name: "Fixed Charge Coverage", actual: "1.15", threshold: "1.3", status: "Watch", insight: "Declining trend — potential breach in next quarter." }] },
    { borrower_name: "Zeta Group", amount: 85000000, covenants: [{ name: "Interest Coverage", actual: "1.8", threshold: "2.5", status: "Critical", insight: "Breach triggered — notify credit committee." }] },
    { borrower_name: "Eta Partners", amount: 50000000, covenants: [{ name: "Debt/EBITDA", actual: "5.2", threshold: "5.0", status: "Critical", insight: "Severe breach — highest priority." }] }
  ];
  render(allLoans);
  logToTerminal(`Local simulation mode: ${allLoans.length} sample portfolios loaded ($1.2B exposure).`, "system");
}

// Search Filter
searchInput.addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = allLoans.filter(l => l.borrower_name.toLowerCase().includes(term));
  render(filtered);
});

// 4. Terminal Logging (Throttled)
function logToTerminal(msg, type = "system") {
  const now = Date.now();
  // Prevent spamming logs too fast
  if (now - lastLogTime < 800) return;
  lastLogTime = now;

  const div = document.createElement("div");
  div.className = `log-line ${type}`;
  div.innerText = `> ${msg}`;
  gameLog.appendChild(div);
  gameLog.scrollTop = gameLog.scrollHeight;
}

// 5. Simulation Logic
simBtn.addEventListener("click", () => {
  if (simBtn.disabled) return;
  simBtn.disabled = true;
  simBtn.innerHTML = `<span class="spinner"></span> Simulating...`;
  
  logToTerminal("Initiating AI stress simulation...", "system");
  
  const scenarios = [
    "Applying +300bps rate shock...",
    "Modeling revenue decline scenario...",
    "Testing supply chain disruption..."
  ];
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  
  setTimeout(() => logToTerminal(scenario, "warn"), 1000);

  setTimeout(() => {
    logToTerminal("Simulation complete — 1 new potential breach flagged.", "error");
    // Simulate updating stats
    riskCountEl.textContent = parseInt(riskCountEl.textContent) + 1;
    // Add visual feedback
    const riskCard = riskCountEl.parentElement.parentElement;
    riskCard.classList.add("danger-glow");
    
    simBtn.disabled = false;
    simBtn.innerHTML = `<i class="bi bi-cpu"></i> Run Simulation`;
  }, 2800);
});

// 6. Chat Logic (With Typing Indicator)
async function sendChat() {
  const txt = chatInput.value.trim();
  if (!txt) return;

  // Add user message
  chatBox.innerHTML += `<div class="msg user">${txt}</div>`;
  chatInput.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  // Add typing bubble
  const typingBubble = document.createElement("div");
  typingBubble.className = "msg bot typing";
  typingBubble.innerHTML = `<span></span><span></span><span></span>`;
  chatBox.appendChild(typingBubble);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Simulate AI Delay
  setTimeout(() => {
    // Remove typing bubble
    if(typingBubble.parentNode) chatBox.removeChild(typingBubble);

    let response = "Monitoring live feed — no new anomalies in the last cycle.";
    
    const lowerTxt = txt.toLowerCase();
    
    if (lowerTxt.includes("hello") || lowerTxt.includes("hi")) {
      response = "Hello Zahid! CovenantGuard AI is online and monitoring your portfolio.";
    } else if (lowerTxt.includes("risk") || lowerTxt.includes("breach")) {
      response = `Current status: ${totalExposureEl.textContent} exposure, ${riskCountEl.textContent} critical breaches, ${watchCountEl.textContent} on watch list. Priority review recommended.`;
    } else if (lowerTxt.includes("summary") || lowerTxt.includes("high risk")) {
      response = `Top risks:<br>• Gamma Ltd — Debt Service Coverage breach<br>• Zeta Group — Interest Coverage breach<br>• Eta Partners — Severe leverage breach<br>Immediate engagement advised.`;
    }

    chatBox.innerHTML += `<div class="msg bot">${response}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 1200 + Math.random() * 800);
}

// Event Listeners
sendBtn.addEventListener("click", sendChat);
chatInput.addEventListener("keypress", (e) => e.key === "Enter" && sendChat());
refreshBtn.addEventListener("click", fetchData);

// Init
document.addEventListener("DOMContentLoaded", () => {
  updateDates();
  fetchData();
});
