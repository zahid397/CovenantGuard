// ============================================
// 🛡️ CovenantGuard AI – Frontend Logic (UPDATED)
// ============================================

// ⚠️ IMPORTANT: Render Deploy করার পর তোমার URL এখানে বসাবে
const API_URL = "https://guard.onrender.com/api/loans"; 

// Global Store
let LOANS_DATA = [];

// ============================================
// 🚀 Initialize App
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    fetchData();
    
    // Enable "Enter" key for chat
    document.getElementById("chat-input").addEventListener("keypress", function (e) {
        if (e.key === "Enter") handleChat();
    });
});

// ============================================
// 📡 Fetch Backend Data
// ============================================
async function fetchData() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Server Offline");

        const loans = await res.json();
        LOANS_DATA = loans;

        renderTable(loans);
    } catch (err) {
        console.error("Fetch Error:", err);
        document.getElementById("loan-table").innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5 text-danger">
                    <div style="padding: 20px; background: #fee2e2; border-radius: 10px;">
                        <h5>⚠️ Backend is Sleeping...</h5>
                        <p class="mb-0">Render free servers sleep when inactive. Please wait 30s and refresh.</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

// ============================================
// 📊 Render Table & Summary
// ============================================
function renderTable(loans) {
    const tbody = document.getElementById("loan-table");
    let totalExposure = 0;
    let criticalCount = 0;
    let watchCount = 0;
    let safeCount = 0;

    // Sort Priority: Critical (3) > Watch (2) > Safe (1)
    const priority = { "Critical": 3, "Watch": 2, "Safe": 1 };

    loans.sort((a, b) => {
        const aStatus = a.covenants[0]?.status || "Safe";
        const bStatus = b.covenants[0]?.status || "Safe";
        return priority[bStatus] - priority[aStatus];
    });

    tbody.innerHTML = "";

    loans.forEach(loan => {
        totalExposure += parseFloat(loan.amount);
        
        loan.covenants.forEach(cov => {
            // Count Stats
            if (cov.status === "Critical") criticalCount++;
            else if (cov.status === "Watch") watchCount++;
            else safeCount++;

            // Badge Logic
            let badgeClass = "badge-safe";
            if (cov.status === "Critical") badgeClass = "badge-risk";
            if (cov.status === "Watch") badgeClass = "badge-watch";

            // Row HTML
            const row = `
                <tr>
                    <td class="fw-bold">${loan.borrower_name}</td>
                    <td>$${(loan.amount / 1000000).toFixed(1)}M</td>
                    <td>${cov.name}</td>
                    <td>
                        <div style="font-size: 12px; color: #6b7280;">Limit: ${cov.threshold}</div>
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

    // Update Top Cards
    document.getElementById("total-exposure").innerText = `$${(totalExposure / 1000000).toFixed(1)}M`;
    document.getElementById("risk-count").innerText = criticalCount;
    document.getElementById("watch-count").innerText = watchCount;

    // Trigger Chart Animation
    updateCharts(criticalCount, watchCount, safeCount);
}

// ============================================
// 📈 Chart Animation
// ============================================
function updateCharts(critical, watch, safe) {
    const total = critical + watch + safe || 1; // Avoid division by zero

    // Calculate Percentages
    const criticalPct = Math.round((critical / total) * 100);
    const watchPct = Math.round((watch / total) * 100);
    const safePct = Math.round((safe / total) * 100);

    // Update CSS Height
    setBarHeight("bar-critical", criticalPct);
    setBarHeight("bar-watch", watchPct);
    setBarHeight("bar-safe", safePct);
}

function setBarHeight(id, percent) {
    const el = document.getElementById(id);
    if (el) {
        el.style.height = `${Math.max(percent, 10)}%`; // Min height 10% for visibility
        el.innerText = `${percent}%`;
    }
}

// ============================================
// 🤖 Logic-Based Chat (Offline AI)
// ============================================
function handleChat() {
    const input = document.getElementById("chat-input");
    const chatBox = document.getElementById("chat-box");
    const text = input.value.trim().toLowerCase();

    if (!text) return;

    // 1. User Message
    chatBox.innerHTML += `<div class="user-msg">${input.value}</div>`;
    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    // 2. Generate Reply
    let reply = "I can analyze portfolio risks. Try asking 'Which loans are risky?'";

    // Logic: Critical Loans
    if (text.includes("risk") || text.includes("critical") || text.includes("danger")) {
        const risky = LOANS_DATA.filter(l => l.covenants.some(c => c.status === "Critical"));
        
        if (risky.length > 0) {
            const names = risky.map(l => l.borrower_name).join(", ");
            reply = `⚠️ <strong>Critical Alert:</strong> The following borrowers have breached covenants: <strong>${names}</strong>. Immediate review required.`;
        } else {
            reply = "✅ Good news! No critical risks detected in the current portfolio.";
        }
    }
    // Logic: Watch List
    else if (text.includes("watch")) {
        const watch = LOANS_DATA.filter(l => l.covenants.some(c => c.status === "Watch"));
        if (watch.length > 0) {
            const names = watch.map(l => l.borrower_name).join(", ");
            reply = `👀 <strong>Watch List:</strong> Keep an eye on: <strong>${names}</strong>. They are close to breaching thresholds.`;
        } else {
            reply = "No loans are currently on the watch list.";
        }
    }
    // Logic: Safe Loans
    else if (text.includes("safe") || text.includes("good")) {
        const safe = LOANS_DATA.filter(l => l.covenants.every(c => c.status === "Safe"));
        reply = `✅ <strong>${safe.length} loans</strong> are fully compliant and healthy.`;
    }
    // Logic: Exposure
    else if (text.includes("amount") || text.includes("exposure") || text.includes("money")) {
        const total = document.getElementById("total-exposure").innerText;
        reply = `💰 The total active portfolio exposure is <strong>${total}</strong>.`;
    }
    // Greetings
    else if (text.includes("hi") || text.includes("hello")) {
        reply = "👋 Hello! I am CovenantGuard. Ask me about portfolio health or specific risks.";
    }

    // 3. Bot Reply (Delayed)
    setTimeout(() => {
        chatBox.innerHTML += `<div class="bot-msg">${reply}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 600);
}
  
