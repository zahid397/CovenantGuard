// ============================================
// 🛡️ CovenantGuard AI – Frontend Logic (FINAL FIX)
// ============================================

// ⚠️ IMPORTANT: Render Deploy করার পর তোমার URL এখানে বসাবে
// Render URL Example: "https://your-service-name.onrender.com/api/loans"
const API_URL = "https://guard.onrender.com/api/loans"; 

// Global Store
let LOANS_DATA = [];

// ============================================
// 🚀 Initialize App
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    fetchData();
    
    // Enable "Enter" key for chat
    const chatInput = document.getElementById("chat-input");
    if(chatInput){
        chatInput.addEventListener("keypress", function (e) {
            if (e.key === "Enter") handleChat();
        });
    }
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

        // ✅ Data loaded successfully
        renderTable(loans);
    } catch (err) {
        console.error("Fetch Error:", err);
        // Fallback UI for Render Sleep Mode
        document.getElementById("loan-table").innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5">
                    <div style="padding: 20px; background: #fee2e2; border-radius: 10px; color: #b91c1c;">
                        <h5>⚠️ Connecting to CovenantGuard Core...</h5>
                        <p class="mb-0">Render server might be sleeping. Please wait 30s and refresh.</p>
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
        // 🔧 FIX: Using 'status' instead of 'risk_status'
        const aStatus = a.covenants[0]?.status || "Safe";
        const bStatus = b.covenants[0]?.status || "Safe";
        return priority[bStatus] - priority[aStatus];
    });

    tbody.innerHTML = "";

    loans.forEach(loan => {
        totalExposure += parseFloat(loan.amount);
        
        loan.covenants.forEach(cov => {
            // 🔧 FIX: Counting based on 'status'
            if (cov.status === "Critical") criticalCount++;
            else if (cov.status === "Watch") watchCount++;
            else safeCount++;

            // Badge Logic
            let badgeClass = "badge-safe";
            if (cov.status === "Critical") badgeClass = "badge-risk";
            if (cov.status === "Watch") badgeClass = "badge-watch";

            // 🔧 FIX: Rendering 'actual', 'status', 'insight'
            const row = `
                <tr>
                    <td style="font-weight: 600; color: #1f2937;">${loan.borrower_name}</td>
                    <td>$${(loan.amount / 1000000).toFixed(1)}M</td>
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

    // Update Top Cards
    const exposureElem = document.getElementById("total-exposure");
    if(exposureElem) exposureElem.innerText = `$${(totalExposure / 1000000).toFixed(1)}M`;
    
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
        // Min height 10% for visibility if count > 0
        const displayHeight = percent === 0 ? 0 : Math.max(percent, 10);
        el.style.height = `${displayHeight}%`; 
        el.innerText = percent > 0 ? `${percent}%` : "";
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
    // 🔧 FIX: Checking 'status' instead of 'risk_status'
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
    // Logic: Why / Reason
    // 🔧 FIX: accessing 'insight'
    else if (text.includes("why") || text.includes("reason")) {
         const critical = LOANS_DATA.find(l => l.covenants.some(c => c.status === "Critical"));
         if (critical) {
             const insight = critical.covenants.find(c => c.status === "Critical").insight;
             reply = `💡 <strong>Analysis for ${critical.borrower_name}:</strong> ${insight}`;
         } else {
             reply = "All loans are currently compliant, so there are no breach reasons to report.";
         }
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
