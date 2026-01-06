// ============================================
// 🛡️ CovenantGuard AI – Frontend Logic
// ============================================

// 🔗 LIVE Render API
const API_URL = "https://covenantguard.onrender.com/api/loans/";

// Global store (chat logic এর জন্য)
let LOANS_DATA = [];

// ============================================
// 📡 Fetch backend data
// ============================================
async function fetchData() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Server error");

    const loans = await res.json();
    LOANS_DATA = loans;

    renderTable(loans);
  } catch (err) {
    console.error(err);
    document.getElementById("loan-table").innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:40px; color:#dc2626;">
          <h4>⚠️ Connecting to CovenantGuard Core…</h4>
          <p>Render free server may be sleeping. Please wait a few seconds.</p>
        </td>
      </tr>
    `;
  }
}

// ============================================
// 📊 Render Table + Summary
// ============================================
function renderTable(loans) {
  const tbody = document.getElementById("loan-table");

  let totalExposure = 0;
  let criticalCount = 0;
  let watchCount = 0;
  let safeCount = 0;

  // Risk priority
  const priority = { Critical: 3, Watch: 2, Safe: 1 };

  loans.sort((a, b) => {
    const aStatus = a.covenants[0]?.risk_status || "Safe";
    const bStatus = b.covenants[0]?.risk_status || "Safe";
    return priority[bStatus] - priority[aStatus];
  });

  tbody.innerHTML = "";

  loans.forEach((loan) => {
    totalExposure += parseFloat(loan.amount);

    loan.covenants.forEach((cov) => {
      if (cov.risk_status === "Critical") criticalCount++;
      else if (cov.risk_status === "Watch") watchCount++;
      else safeCount++;

      const badgeClass =
        cov.risk_status === "Critical"
          ? "badge-risk"
          : cov.risk_status === "Watch"
          ? "badge-watch"
          : "badge-safe";

      tbody.innerHTML += `
        <tr>
          <td><strong>${loan.borrower_name}</strong></td>
          <td>$${(loan.amount / 1_000_000).toFixed(1)}M</td>
          <td>${cov.name}</td>
          <td>
            <small>Max: ${cov.threshold}</small><br>
            <strong>Now: ${cov.actual_value}</strong>
          </td>
          <td><span class="${badgeClass}">${cov.risk_status}</span></td>
          <td><small>${cov.explanation}</small></td>
        </tr>
      `;
    });
  });

  // Update summary cards
  document.getElementById("total-exposure").innerText =
    `$${(totalExposure / 1_000_000).toFixed(1)}M`;

  document.getElementById("risk-count").innerText = criticalCount;
  document.getElementById("watch-count").innerText = watchCount;

  // Animate charts
  animateCharts(criticalCount, watchCount, safeCount);
}

// ============================================
// 📊 Animated Bar Chart
// ============================================
function animateCharts(critical, watch, safe) {
  const total = critical + watch + safe || 1;

  document.getElementById("bar-critical").style.height =
    (critical / total) * 100 + "%";

  document.getElementById("bar-watch").style.height =
    (watch / total) * 100 + "%";

  document.getElementById("bar-safe").style.height =
    (safe / total) * 100 + "%";
}

// ============================================
// 🤖 Logic-based Chat (No AI API)
// ============================================
function handleChat() {
  const input = document.getElementById("chat-input");
  const chatBox = document.getElementById("chat-box");
  const question = input.value.trim().toLowerCase();

  if (!question) return;

  // User message
  chatBox.innerHTML += `<div class="user-msg">${input.value}</div>`;
  input.value = "";

  let reply = "Try asking about risky loans, safe loans, or reasons.";

  if (question.includes("risky") || question.includes("critical")) {
    const criticalLoans = LOANS_DATA.filter((l) =>
      l.covenants.some((c) => c.risk_status === "Critical")
    );

    if (criticalLoans.length > 0) {
      reply = `The most critical loan is <strong>${criticalLoans[0].borrower_name}</strong> due to covenant breach.`;
    } else {
      reply = "Currently, there are no critical loans.";
    }
  } 
  else if (question.includes("safe")) {
    const safeLoans = LOANS_DATA.filter((l) =>
      l.covenants.every((c) => c.risk_status === "Safe")
    );

    if (safeLoans.length > 0) {
      reply = `A safe loan example is <strong>${safeLoans[0].borrower_name}</strong> with strong financial health.`;
    } else {
      reply = "No fully safe loans at the moment.";
    }
  } 
  else if (question.includes("why") || question.includes("reason")) {
    const critical = LOANS_DATA.find((l) =>
      l.covenants.some((c) => c.risk_status === "Critical")
    );

    if (critical) {
      reply = critical.covenants.find(
        (c) => c.risk_status === "Critical"
      ).explanation;
    }
  }
  else if (question.includes("total")) {
    reply = `The portfolio currently has ${LOANS_DATA.length} loans under monitoring.`;
  }

  // Bot reply with delay
  setTimeout(() => {
    chatBox.innerHTML += `<div class="bot-msg">${reply}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 500);
}

// ============================================
// 🚀 Start app
// ============================================
fetchData();
