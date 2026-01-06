// ============================================
// 🛡️ CovenantGuard AI – Frontend Logic (PRO)
// ============================================

// ⚠️ Ensure this matches your Render URL perfectly
const API_URL = "https://covenantguard.onrender.com/api/loans";

// Global State
let LOANS_DATA = [];

// ============================================
// 🚀 Initialize App
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    fetchData();
    
    // Enable "Enter" key for chat input
    const chatInput = document.getElementById("chat-input");
    if(chatInput) {
        chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") handleChat();
        });
    }
});

// ============================================
// 📡 Fetch Backend Data with Retry Logic
// ============================================
async function fetchData() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Server Offline");

        const data = await res.json();
        LOANS_DATA = data;
        
        // Render data immediately
        renderTable(data);

    } catch (err) {
        console.error("Fetch Error:", err);
        // Graceful Error UI for Render Free Tier
        document.getElementById("loan-table").innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <div style="background: #fee2e2; color: #b91c1c; padding: 15px; border-radius: 8px; display: inline-block;">
                        <strong>⚠️ Connecting to CovenantGuard Core...</strong><br>
                        <small>Render server is waking up. Please wait 30s and refresh.</small>
                    </div>
                </td>
            </tr>
        `;
    }
}

// ============================================
// 📊 Render Table & Summary (Risk Sorted)
// ============================================
function renderTable(loans) {
    const tbody = document.getElementById("loan-table");
    let totalExposure = 0;
    let criticalCount = 0;
    let watchCount = 0;
    let safeCount = 0;

    // 1️⃣ Priority Logic: Critical (3) > Watch (2) > Safe (1)
    const priority = { "Critical": 3, "Watch": 2, "Safe": 1 };

    loans.sort((a, b) => {
        const aStatus = a.covenants[0]?.status || "Safe";
        const bStatus = b.covenants[0]?.status || "Safe";
        return priority[bStatus] - priority[aStatus];
    });

    tbody.innerHTML = "";

    // 2️⃣ Loop & Render
    loans.forEach(loan => {
        const amount = parseFloat(loan.amount) || 0;
        totalExposure += amount;
        
        // Loop through covenants (handling multiple covenants per loan support)
        loan.covenants.forEach(cov => {
            // Stats Counting
            if (cov.status === "Critical") criticalCount++;
            else if (cov.status === "Watch") watchCount++;
            else safeCount++;

            // Badge Styling
            let badgeClass = "badge-safe";
            if (cov.status === "Critical") badgeClass = "badge-risk";
            if (cov.status === "Watch") badgeClass = "badge-watch";

            // Professional Currency Format
            const formattedAmount = new Intl.NumberFormat('en-US', {
                style: 'currency', currency: 'USD', maximumFractionDigits: 1, notation: "compact"
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

    // 3️⃣ Update Summary Cards
    const exposureEl = document.getElementById("total-exposure");
    if(exposureEl) {
        exposureEl.innerText = new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD', maximumFractionDigits: 1, notation: "compact"
        }).format(totalExposure);
    }
    
    document.getElementById("risk-count").innerText = criticalCount;
    document.getElementById("watch-count").innerText = watchCount;

    // 4️⃣ Animate Charts
    animateCharts(criticalCount, watchCount, safeCount);
}

// ============================================
// 📈 Smooth Chart Animation
// ============================================
function animateCharts(c, w, s) {
    const total = c + w + s || 1; // Prevent division by zero

    setBar("bar-critical", c, total);
    setBar("bar-watch", w, total);
    setBar("bar-safe", s, total);
}

function setBar(id, value, total) {
    const el = document.getElementById(id);
    if (el) {
        const pct = Math.round((value / total) * 100);
        // Ensure minimal visibility (10%) if value > 0
        el.style.width = value > 0 ? `${Math.max(pct, 10)}%` : "0%";
        el.innerText = value > 0 ? `${pct}%` : "";
    }
}

// ============================================
// 🤖 Smart Logic-Based Chat (Advanced)
// ============================================
function handleChat() {
    const input = document.getElementById("chat-input");
    const box = document.getElementById("chat-box");
    const text = input.value.trim().toLowerCase();

    if (!text) return;

    // User Message
    box.innerHTML += `<div class="user-msg">${input.value}</div>`;
    input.value = "";
    box.scrollTop = box.scrollHeight;

    let reply = "I can analyze portfolio risks. Try asking 'Which loans are critical?'";

    // 🔍 Logic 1: Find Critical Loans (List ALL of them)
    if (text.includes("critical") || text.includes("risk") || text.includes("danger")) {
        const riskyLoans = LOANS_DATA.filter(l => 
            l.covenants.some(c => c.status === "Critical")
        );

        if (riskyLoans.length > 0) {
            const names = riskyLoans.map(l => l.borrower_name).join(", ");
            reply = `⚠️ <strong>Critical Alert:</strong> The following borrowers have breached covenants: <strong>${names}</strong>. Review immediately.`;
        } else {
            reply = "✅ Great news! No critical risks detected in the portfolio.";
        }
    }
    
    // 🔍 Logic 2: Watch List
    else if (text.includes("watch")) {
        const watchLoans = LOANS_DATA.filter(l => 
            l.covenants.some(c => c.status === "Watch")
        );
        if (watchLoans.length > 0) {
            const names = watchLoans.map(l => l.borrower_name).join(", ");
            reply = `👀 <strong>Watch List:</strong> Keep an eye on: <strong>${names}</strong>. They are approaching limits.`;
        } else {
            reply = "Watch list is currently empty.";
        }
    }

    // 🔍 Logic 3: Safe Loans
    else if (text.includes("safe") || text.includes("healthy")) {
        const safeCount = LOANS_DATA.filter(l => 
            l.covenants.every(c => c.status === "Safe")
        ).length;
        reply = `✅ <strong>${safeCount} loans</strong> are fully compliant and financially healthy.`;
    }

    // 🔍 Logic 4: Explanation (Why?)
    else if (text.includes("why") || text.includes("reason")) {
        const critical = LOANS_DATA.find(l => l.covenants.some(c => c.status === "Critical"));
        if (critical) {
            const insight = critical.covenants.find(c => c.status === "Critical").insight;
            reply = `💡 <strong>Insight for ${critical.borrower_name}:</strong> ${insight}`;
        } else {
            reply = "Since there are no critical breaches, no specific explanations are needed.";
        }
    }

    // 🔍 Logic 5: Total Money
    else if (text.includes("total") || text.includes("money") || text.includes("exposure")) {
        const total = document.getElementById("total-exposure").innerText;
        reply = `💰 Total Portfolio Exposure is currently <strong>${total}</strong>.`;
    }

    // Greetings
    else if (text.includes("hi") || text.includes("hello")) {
        reply = "👋 Hello! I am CovenantGuard AI. Ask me about portfolio health or specific breaches.";
    }

    // Bot Reply with delay
    setTimeout(() => {
        box.innerHTML += `<div class="bot-msg">${reply}</div>`;
        box.scrollTop = box.scrollHeight;
    }, 500);
}
