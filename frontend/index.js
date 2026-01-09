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
let lastLogTime = 0; // ✅ For throttling simulation logs

const formatCurrency = (num) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(num);
};

// 1. Fetch Data
async function fetchData() {
  try {
    tableBody.innerHTML = `<tr><td colspan="6" class="loading-row"><div class="spinner"></div>Syncing with CovenantGuard Core...</td></tr>`;
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("API Offline");
    allLoans = await res.json();
    render(allLoans);
    
    // ✅ Updated: Use Template Literal
    logToTerminal(`System synced. ${allLoans.length} portfolios active.`, "system");
  } catch (err) {
    logToTerminal("Network unstable. Loading secure local simulation data.", "warn");
    loadMockData();
  }
}

// 2. Render
function render(loans) {
  if (loans.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="bi bi-search" style="font-size: 1.5rem; display:block; margin-bottom:10px;"></i>No matching borrowers found.</td></tr>`;
    return;
  }

  let total = 0, critical = 0, watch = 0;

  const html = loans.map(l => {
    const c = l.covenants[0];
    total += l.amount;
    if (c.status === "Critical") critical++;
    if (c.status === "Watch") watch++;
    
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
  totalExposureEl.textContent = formatCurrency(total);
  riskCountEl.textContent = critical;
  watchCountEl.textContent = watch;
}

// 3. Mock Data
function loadMockData() {
  allLoans = [
    { borrower_name: "Apex Industries", amount: 15500000, covenants: [{ name: "Debt/EBITDA", actual: "4.5x", threshold: "4.0x", status: "Critical", insight: "EBITDA fell by 12% in Q3." }] },
    { borrower_name: "TechNova Inc.", amount: 8200000, covenants: [{ name: "Current Ratio", actual: "1.1x", threshold: "1.2x", status: "Watch", insight: "Cash reserves tightening." }] },
    { borrower_name: "BlueSky Logistics", amount: 22000000, covenants: [{ name: "Interest Coverage", actual: "5.2x", threshold: "3.0x", status: "Safe", insight: "Operations are healthy." }] }
  ];
  render(allLoans);
}

searchInput.addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  render(allLoans.filter(l => l.borrower_name.toLowerCase().includes(term)));
});

// 4. Smart Logging (Prevents Spam)
function logToTerminal(msg, type = "") {
  // ✅ Logic: Prevent duplicate simulation logs within 3 seconds
  const now = Date.now();
  if (type === "sim" && now - lastLogTime < 3000) return; 
  if (type === "sim") lastLogTime = now;

  const div = document.createElement("div");
  div.className = `log-line ${type === 'sim' ? 'system' : type}`;
  div.innerText = `> ${msg}`;
  gameLog.appendChild(div);
  gameLog.scrollTop = gameLog.scrollHeight;
}

// 5. Simulation Logic
simBtn.addEventListener("click", () => {
  if (simBtn.disabled) return;
  simBtn.disabled = true;
  simBtn.innerHTML = `<span class="spinner"></span> Simulating...`;
  
  logToTerminal("Initiating Monte Carlo Simulation...", "system");
  
  // Randomize scenarios to make it look alive
  const scenarios = [
    "Stressing interest rates (+250bps)...",
    "Analyzing supply chain volatility...",
    "Simulating GDP contraction of 2%..."
  ];
  const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];

  setTimeout(() => logToTerminal(randomScenario, "warn"), 800);
  
  setTimeout(() => {
    logToTerminal("CRITICAL: New breach detected in Retail sector.", "error");
    simBtn.disabled = false;
    simBtn.innerHTML = `<i class="bi bi-cpu"></i> Run Simulation`;
    
    riskCountEl.innerText = parseInt(riskCountEl.innerText) + 1;
    riskCountEl.parentElement.parentElement.classList.add("danger-glow");
  }, 2500);
});

// 6. Chat with Typing Indicator (The Killer Polish ✨)
async function sendChat() {
  const txt = chatInput.value.trim();
  if (!txt) return;

  chatBox.innerHTML += `<div class="msg user">${txt}</div>`;
  chatInput.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  // ✅ Step 1: Add Typing Bubble
  const typingBubble = document.createElement("div");
  typingBubble.className = "msg bot typing";
  typingBubble.innerHTML = `<span></span><span></span><span></span>`;
  chatBox.appendChild(typingBubble);
  chatBox.scrollTop = chatBox.scrollHeight;

  // ✅ Step 2: Wait & Replace
  setTimeout(() => {
    chatBox.removeChild(typingBubble); // Remove typing indicator

    let response = "I'm monitoring the live data feed. No immediate anomalies detected in the last 5 minutes.";
    if (txt.toLowerCase().includes("risk")) response = `Current exposure is ${totalExposureEl.textContent} with ${riskCountEl.textContent} critical accounts requiring attention.`;
    if (txt.toLowerCase().includes("hello")) response = "Hello! I am CovenantGuard AI. Ready to assist with portfolio analysis.";

    chatBox.innerHTML += `<div class="msg bot">${response}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 1500); // 1.5s delay for realism
}

sendBtn.addEventListener("click", sendChat);
chatInput.addEventListener("keypress", (e) => e.key === "Enter" && sendChat());
refreshBtn.addEventListener("click", fetchData);

fetchData();
