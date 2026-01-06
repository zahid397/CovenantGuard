// ============================================
// 🛡️ CovenantGuard AI – Frontend Logic (ROBUST)
// ============================================

// ⚠️ UPDATE THIS URL WITH YOUR RENDER URL
const API_URL = "https://covenantguard.onrender.com/api/loans";

let LOANS_DATA = [];

document.addEventListener("DOMContentLoaded", () => {
    fetchData(); // Start fetch with retry logic
    
    // Enter key for chat
    const chatInput = document.getElementById("chat-input");
    if(chatInput) {
        chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") handleChat();
        });
    }
});

// ✅ Feature 1: Auto-Retry Logic for Sleeping Backend
async function fetchData(retryCount = 0) {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Server Offline");

        const data = await res.json();
        LOANS_DATA = data;
        
        // Render only if valid data comes back
        renderTable(data);

    } catch (err) {
        console.error(`Fetch Attempt ${retryCount + 1} Failed:`, err);

        // Retry 2 times before giving up
        if (retryCount < 2) {
            console.log("Retrying in 3 seconds...");
            setTimeout(() => fetchData(retryCount + 1), 3000);
            return;
        }

        // Final Error Message after retries
        document.getElementById("loan-table").innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <div style="background: #fee2e2; color: #b91c1c; padding: 15px; border-radius: 8px; display: inline-block;">
                        <strong>⚠️ Connecting to CovenantGuard Core...</strong><br>
                        <small>Server is waking up. Please refresh in 30 seconds.</small>
                    </div>
                </td>
            </tr>
        `;
    }
}

function renderTable(loans) {
    const tbody = document.getElementById("loan-table");
    
    // ✅ Feature 2: Empty Data Guard
    if (!Array.isArray(loans) || loans.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align:center;padding:30px;color:#6b7280;">
              No loan data available at the moment.
            </td>
          </tr>`;
        return;
    }

    let totalExposure = 0;
    let criticalCount = 0;
    let watchCount = 0;
    let safeCount = 0;

    // Sort Priority: Critical (3) -> Watch (2) -> Safe (1)
    const priority = { "Critical": 3, "Watch": 2, "Safe": 1 };

    loans.sort((a, b) => {
        const aStatus = a.covenants[0]?.status || "Safe";
        const bStatus = b.covenants[0]?.status || "Safe";
        return priority[bStatus] - priority[aStatus];
    });

    tbody.innerHTML = "";

    loans.forEach(loan => {
        const amount = parseFloat(loan.amount) || 0;
        totalExposure += amount;
        
        loan.covenants.forEach(cov => {
            if (cov.status === "Critical") criticalCount++;
            else if (cov.status === "Watch") watchCount++;
            else safeCount++;

            let badgeClass = "badge-safe";
            if (cov.status === "Critical") badgeClass = "badge-risk";
            if (cov.status === "Watch") badgeClass = "badge-watch";

            // Professional Format
            const formattedAmount = new Intl.NumberFormat('en-US', {
                style: 'currency', currency: 'USD', notation: "compact"
            }).format(amount);

            const row = `
                <tr>
                    <td style="font-weight: 600; color: #1f2937;">${loan.borrower_name}</td>
                    <td>${formattedAmount}</td>
                    <td>${cov.name}</td>
                    <td>
                        <div style="font-size: 11px; color: #6b7280;">Limit: ${cov.threshold}</div>
                        <strong>Actual: ${cov.actual}</strong>
                    </td>
                    <td><span class="${badgeClass}">${cov.status}</span></td>
                    <td style="font-size: 13px; color: #4b5563;">
                        <i class="bi bi-robot"></i> ${cov.insight}
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    });

    // Update Summary
    const expEl = document.getElementById("total-exposure");
    if(expEl) expEl.innerText = new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', notation: "compact"
    }).format(totalExposure);
    
    document.getElementById("risk-count").innerText = criticalCount;
    document.getElementById("watch-count").innerText = watchCount;

    animateCharts(criticalCount, watchCount, safeCount);
}

function animateCharts(c, w, s) {
    const total = c + w + s || 1;
    setBar("bar-critical", c, total);
    setBar("bar-watch", w, total);
    setBar("bar-safe", s, total);
}

function setBar(id, value, total) {
    const el = document.getElementById(id);
    if (el) {
        const pct = Math.round((value / total) * 100);
        // ✅ Feature 4: UX Polish - Hide text if 0, dim if 0
        el.style.width = value > 0 ? `${Math.max(pct, 5)}%` : "0%";
        el.innerText = value > 0 ? `${pct}%` : "";
        el.style.opacity = value > 0 ? "1" : "0.5";
    }
}

function handleChat() {
    const input = document.getElementById("chat-input");
    const box = document.getElementById("chat-box");
    const text = input.value.trim().toLowerCase();

    if (!text) return;

    box.innerHTML += `<div class="user-msg">${input.value}</div>`;
    input.value = "";
    box.scrollTop = box.scrollHeight;

    let reply = "I can analyze portfolio risks.";

    // ✅ Feature 3: Chat Safety Guard
    if (LOANS_DATA.length === 0) {
        reply = "⚠️ Data not loaded yet. Please wait for the backend to wake up.";
    } 
    else if (text.includes("risk") || text.includes("critical")) {
        const risky = LOANS_DATA.filter(l => l.covenants.some(c => c.status === "Critical"));
        if (risky.length > 0) {
            const names = risky.map(l => l.borrower_name).join(", ");
            reply = `⚠️ <strong>Critical Alert:</strong> ${names} have breached covenants.`;
        } else {
            reply = "✅ No critical risks detected.";
        }
    } else if (text.includes("safe")) {
        const safeCount = LOANS_DATA.filter(l => l.covenants.every(c => c.status === "Safe")).length;
        reply = `✅ <strong>${safeCount} loans</strong> are fully compliant.`;
    } else if (text.includes("why")) {
         const crit = LOANS_DATA.find(l => l.covenants.some(c => c.status === "Critical"));
         reply = crit ? `💡 <strong>${crit.borrower_name}:</strong> ${crit.covenants[0].insight}` : "No breaches to explain.";
    }

    setTimeout(() => {
        box.innerHTML += `<div class="bot-msg">${reply}</div>`;
        box.scrollTop = box.scrollHeight;
    }, 500);
}
