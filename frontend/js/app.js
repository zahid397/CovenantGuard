// ============================================
// 🛡️ CovenantGuard AI – Frontend Logic (GAME MODE FINAL)
// ============================================

const API_URL = "https://covenantguard.onrender.com/api/loans";
let LOANS_DATA = [];
let simulationInterval = null;
let isSimulating = false;

// ================= INITIALIZE =================
document.addEventListener("DOMContentLoaded", () => {
    fetchData();

    // Chat Enter Key
    const chatInput = document.getElementById("chat-input");
    if (chatInput) {
        chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") handleChat();
        });
    }
});

// ================= FETCH DATA (Auto-Retry) =================
async function fetchData(retry = 0) {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Server sleeping");

        const data = await res.json();
        
        // Save original amount for simulation reference
        LOANS_DATA = data.map(l => ({ 
            ...l, 
            original_amount: parseFloat(l.amount) 
        }));
        
        renderTable(LOANS_DATA);

    } catch (err) {
        if (retry < 2) {
            setTimeout(() => fetchData(retry + 1), 3000);
            return;
        }
        document.getElementById("loan-table").innerHTML = `
        <tr><td colspan="6" style="text-align:center; padding:40px; color:#b91c1c;">
            <div style="background:#fee2e2; padding:15px; border-radius:8px; display:inline-block;">
                <strong>⚠️ Backend Waking Up...</strong><br>
                <small>Render free server is sleeping. Please refresh in 30s.</small>
            </div>
        </td></tr>`;
    }
}

// ================= RENDER LOGIC =================
function renderTable(loans) {
    const tbody = document.getElementById("loan-table");
    
    // Safety check
    if (!loans || loans.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No loan data found.</td></tr>`;
        return;
    }

    // Sort: Critical (3) > Watch (2) > Safe (1)
    const priority = { "Critical": 3, "Watch": 2, "Safe": 1 };
    loans.sort((a, b) => {
        const aS = a.covenants[0]?.status || "Safe";
        const bS = b.covenants[0]?.status || "Safe";
        return priority[bS] - priority[aS];
    });

    let total = 0, c = 0, w = 0, s = 0;
    tbody.innerHTML = "";

    loans.forEach((loan, index) => {
        const amount = parseFloat(loan.amount) || 0;
        total += amount;
        
        // Handle multiple covenants if needed, currently picking [0] for demo
        const cov = loan.covenants[0];

        // Stats Counting
        if (cov.status === "Critical") c++;
        else if (cov.status === "Watch") w++;
        else s++;

        // Badge Logic
        const badge = cov.status === "Critical" ? "badge-risk" :
                      cov.status === "Watch" ? "badge-watch" : "badge-safe";

        // Animation Class (Flash on update)
        const animClass = loan.justUpdated ? (cov.status === "Critical" ? "flash-critical" : "flash-safe") : "";
        loan.justUpdated = false; 

        // Professional Format
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD', notation: "compact", maximumFractionDigits: 1
        }).format(amount);

        // ✅ FIX 1: Crash Guard for cov.actual
        // Using Number() ensures it doesn't crash if backend sends a string
        const safeActual = Number(cov.actual).toFixed(2);

        tbody.innerHTML += `
        <tr class="${animClass}" id="row-${index}">
            <td style="font-weight:600; color:#1f2937;">${loan.borrower_name}</td>
            <td>${formattedAmount}</td>
            <td>${cov.name}</td>
            <td>
                <div style="font-size:11px; color:#6b7280;">Limit: ${cov.threshold}</div>
                <strong>Actual: ${safeActual}</strong>
            </td>
            <td><span class="${badge}">${cov.status}</span></td>
            <td style="font-size:12px; color:#6b7280;">
                <i class="bi bi-robot"></i> ${cov.insight}
            </td>
        </tr>`;
    });

    // Update UI Cards
    const expEl = document.getElementById("total-exposure");
    if(expEl) expEl.innerText = new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', notation: "compact"
    }).format(total);

    document.getElementById("risk-count").innerText = c;
    document.getElementById("watch-count").innerText = w;

    animateCharts(c, w, s);
}

// ================= CHART ANIMATION =================
function animateCharts(c, w, s) {
    const total = c + w + s || 1;
    setBar("bar-critical", c, total);
    setBar("bar-watch", w, total);
    setBar("bar-safe", s, total);
}

function setBar(id, val, total) {
    const el = document.getElementById(id);
    if (!el) return;
    const pct = Math.round((val / total) * 100);
    el.style.width = val ? Math.max(pct, 10) + "%" : "0%";
    el.innerText = val ? pct + "%" : "";
}

// ================= 🎮 GAME ENGINE (AUTO PLAY) =================

function toggleSimulation() {
    isSimulating = !isSimulating;
    const btn = document.getElementById("sim-btn");
    const statusText = document.getElementById("sim-status-text");
    const dot = document.getElementById("sim-status-dot");

    if (isSimulating) {
        // START
        if(btn) {
            btn.innerHTML = `<i class="bi bi-pause-fill"></i> Pause Sim`;
            btn.style.background = "#dc2626";
        }
        if(statusText) {
            statusText.innerText = "Running Real-time Scenario...";
            statusText.style.color = "#10b981";
        }
        if(dot) dot.classList.add("sim-active");
        
        logGameEvent("🚀 Simulation Engine Started...");
        simulationInterval = setInterval(runGameTick, 2500);

    } else {
        // STOP
        clearInterval(simulationInterval);
        if(btn) {
            btn.innerHTML = `<i class="bi bi-play-fill"></i> Auto Play`;
            btn.style.background = "#3b82f6";
        }
        if(statusText) {
            statusText.innerText = "System Standby";
            statusText.style.color = "#94a3b8";
        }
        if(dot) dot.classList.remove("sim-active");
        logGameEvent("⏸️ Simulation Paused.");
    }
}

function runGameTick() {
    if (LOANS_DATA.length === 0) return;

    // Pick random loan
    const randomIndex = Math.floor(Math.random() * LOANS_DATA.length);
    const loan = LOANS_DATA[randomIndex];
    const cov = loan.covenants[0];

    // Events
    const events = [
        { type: "CRASH", text: "📉 Market Crash! Asset values dropping." },
        { type: "BOOM", text: "📈 Revenue Spike! Strong results." },
        { type: "DEBT", text: "⚠️ New Debt Acquired. Leverage increasing." },
        { type: "PAY", text: "✅ Loan Repayment Processed." }
    ];
    const event = events[Math.floor(Math.random() * events.length)];
    let changeMsg = "";

    // ✅ FIX 2: Prevent Debt Explosion
    // Instead of adding += 500k forever, we fluctuate around the original amount
    // Logic: Original Amount + Random Fluctuation (Max 1M)
    
    if (event.type === "CRASH" || event.type === "DEBT") {
        // Bad News: Risk UP
        cov.actual = Number(cov.actual) + (Math.random() * 0.4);
        
        // Fluctuate amount UP (but strictly bounded)
        loan.amount = (loan.original_amount || 5000000) + (Math.random() * 1000000);
        changeMsg = `${loan.borrower_name} risk increasing!`;
        
    } else {
        // Good News: Risk DOWN
        cov.actual = Math.max(0, Number(cov.actual) - (Math.random() * 0.4));
        
        // Fluctuate amount DOWN (bounded)
        loan.amount = Math.max(0, (loan.original_amount || 5000000) - (Math.random() * 500000));
        changeMsg = `${loan.borrower_name} financials improving.`;
    }

    // Logic: Update Status
    if (cov.actual > cov.threshold) {
        cov.status = "Critical";
        cov.insight = `Breach detected! Ratio ${Number(cov.actual).toFixed(2)} > ${cov.threshold}`;
    } else if (cov.actual > cov.threshold * 0.8) {
        cov.status = "Watch";
        cov.insight = "Warning: Approaching limit threshold.";
    } else {
        cov.status = "Safe";
        cov.insight = "Financials look healthy.";
    }

    // UI Update
    loan.justUpdated = true; 
    renderTable(LOANS_DATA); 
    logGameEvent(`> ${event.text} (${changeMsg})`);
}

function logGameEvent(msg) {
    const logEl = document.getElementById("game-log");
    if(!logEl) return;
    logEl.style.opacity = 0;
    setTimeout(() => {
        logEl.innerHTML = msg;
        logEl.style.opacity = 1;
    }, 200);
}

// ================= SMART CHAT BOT =================
function handleChat(customText = null) {
    const input = document.getElementById("chat-input");
    const box = document.getElementById("chat-box");
    const rawMsg = customText || input.value;
    const text = rawMsg.trim().toLowerCase();
    
    if (!text) return;

    box.innerHTML += `<div class="user-msg">${rawMsg}</div>`;
    input.value = "";
    box.scrollTop = box.scrollHeight;

    if (!LOANS_DATA || LOANS_DATA.length === 0) {
        return respond("⚠️ Data loading... please wait.");
    }

    let reply = "I can analyze portfolio risks. Try asking 'Which loans are critical?'";

    // 🔍 1. Specific Loan
    const specificLoan = LOANS_DATA.find(l => text.includes(l.borrower_name.toLowerCase()));
    
    if (specificLoan) {
        const cov = specificLoan.covenants[0];
        reply = `<strong>📊 ${specificLoan.borrower_name}:</strong><br>
        Status: <b>${cov.status}</b><br>
        Current Ratio: ${Number(cov.actual).toFixed(2)}<br>
        Insight: ${cov.insight}`;
    }
    // 🔍 2. Critical
    else if (text.includes("critical") || text.includes("risk")) {
        const list = LOANS_DATA.filter(l => l.covenants.some(c => c.status === "Critical"));
        reply = list.length
            ? `⚠️ <strong>Critical Loans:</strong> ${list.map(l => l.borrower_name).join(", ")}.`
            : "✅ No critical risks detected.";
    }
    // 🔍 3. Watch List
    else if (text.includes("watch")) {
        const list = LOANS_DATA.filter(l => l.covenants.some(c => c.status === "Watch"));
        reply = list.length
            ? `👀 <strong>Watch List:</strong> ${list.map(l => l.borrower_name).join(", ")}.`
            : "Watch list is empty.";
    }
    // ✅ FIX 3: Simulation Awareness
    else if (text.includes("simulation") || text.includes("sim") || text.includes("running")) {
        reply = isSimulating
          ? "🎮 <strong>Simulation Active:</strong> Processing real-time market events."
          : "⏸️ <strong>Simulation Paused:</strong> System is in standby mode.";
    }
    // 🔍 4. General Why
    else if (text.includes("why")) {
        const crit = LOANS_DATA.find(l => l.covenants.some(c => c.status === "Critical"));
        reply = crit 
            ? `💡 <strong>${crit.borrower_name}</strong> is critical because: ${crit.covenants[0].insight}`
            : "No active breaches to explain.";
    }

    respond(reply);

    function respond(msg) {
        setTimeout(() => {
            box.innerHTML += `<div class="bot-msg">${msg}</div>`;
            box.scrollTop = box.scrollHeight;
        }, 500);
    }
}
