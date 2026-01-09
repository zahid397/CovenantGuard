// ============================================
// 🛡️ CovenantGuard AI – Production Frontend
// ============================================

const API_URL = "https://covenantguard.onrender.com/api/loans";
let LOANS_DATA = [];
let simulationInterval = null;
let isSimulating = false;
let currentFilter = '';

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

    // Search functionality
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            currentFilter = e.target.value.toLowerCase();
            filterTable(currentFilter);
        });
    }
});

// ================= FETCH DATA (Auto-Retry) =================
async function fetchData(retry = 0) {
    try {
        showLoading(true);
        updateConnectionStatus('Connecting...', 'warning');
        
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Server sleeping");

        const data = await res.json();
        
        // Save original amount for simulation reference
        LOANS_DATA = data.map(l => ({ 
            ...l, 
            original_amount: parseFloat(l.amount),
            justUpdated: false
        }));
        
        renderTable(LOANS_DATA);
        updateConnectionStatus('Live', 'success');
        showToast(`Loaded ${data.length} loans`, 'success');

    } catch (err) {
        console.error("Fetch error:", err);
        
        if (retry < 2) {
            updateConnectionStatus('Retrying...', 'warning');
            setTimeout(() => fetchData(retry + 1), 3000);
            return;
        }
        
        // Show demo data if fetch fails
        showDemoData();
        updateConnectionStatus('Offline', 'error');
        showToast('Using demo data (backend offline)', 'warning');
    } finally {
        showLoading(false);
    }
}

// ================= RENDER LOGIC =================
function renderTable(loans) {
    const tbody = document.getElementById("loan-table");
    const totalLoansEl = document.getElementById("total-loans");
    
    // Update total loans count
    if (totalLoansEl) {
        totalLoansEl.textContent = `${loans.length} loan${loans.length !== 1 ? 's' : ''}`;
    }
    
    // Safety check
    if (!loans || loans.length === 0) {
        tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center; padding:40px; color:#64748b;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                    <i class="bi bi-database" style="font-size: 32px;"></i>
                    <div>No loan data found</div>
                </div>
            </td>
        </tr>`;
        
        updateStats(0, 0, 0);
        return;
    }

    // Sort: Critical (3) > Watch (2) > Safe (1)
    const priority = { "Critical": 3, "Watch": 2, "Safe": 1 };
    const sortedLoans = [...loans].sort((a, b) => {
        const aS = a.covenants[0]?.status || "Safe";
        const bS = b.covenants[0]?.status || "Safe";
        return priority[bS] - priority[aS];
    });

    let total = 0, c = 0, w = 0, s = 0;
    let tableHTML = '';

    sortedLoans.forEach((loan, index) => {
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
        const formattedAmount = formatCurrency(amount);

        // Calculate ratio percentage
        const ratioPercent = Math.min((cov.actual / cov.threshold) * 100, 150);
        const ratioColor = cov.actual > cov.threshold ? '#dc2626' : 
                          cov.actual > cov.threshold * 0.8 ? '#f59e0b' : '#10b981';

        tableHTML += `
        <tr class="${animClass}" id="row-${index}" data-status="${cov.status}">
            <td style="font-weight:600; color:#1f2937;">
                ${loan.borrower_name}
                <div style="font-size:11px; color:#6b7280; margin-top:2px;">
                    ID: ${loan.id?.substring(0, 8) || 'N/A'}
                </div>
            </td>
            <td><strong>${formattedAmount}</strong></td>
            <td>${cov.name}</td>
            <td>
                <div style="margin-bottom: 4px;">
                    <span style="font-size:12px; color:#6b7280;">Limit: ${cov.threshold}</span><br>
                    <strong style="color:${ratioColor}">Actual: ${Number(cov.actual).toFixed(2)}</strong>
                </div>
                <div style="background:#e5e7eb; height:4px; border-radius:2px; overflow:hidden;">
                    <div style="width:${ratioPercent}%; height:100%; background:${ratioColor};"></div>
                </div>
            </td>
            <td><span class="${badge}">${cov.status}</span></td>
            <td style="font-size:12px; color:#6b7280;">
                <i class="bi bi-robot" style="margin-right:4px;"></i> ${cov.insight}
            </td>
        </tr>`;
    });

    tbody.innerHTML = tableHTML;
    
    // Update UI Cards
    updateStats(total, c, w, s);
    
    // Remove animation classes after animation completes
    setTimeout(() => {
        document.querySelectorAll('.flash-critical, .flash-safe').forEach(el => {
            el.classList.remove('flash-critical', 'flash-safe');
        });
    }, 1000);
}

// ================= FILTER TABLE =================
function filterTable(searchTerm) {
    if (!searchTerm) {
        renderTable(LOANS_DATA);
        return;
    }
    
    const filtered = LOANS_DATA.filter(loan => 
        loan.borrower_name.toLowerCase().includes(searchTerm) ||
        loan.covenants.some(cov => 
            cov.name.toLowerCase().includes(searchTerm) ||
            cov.insight.toLowerCase().includes(searchTerm)
        )
    );
    
    renderTable(filtered);
}

// ================= UPDATE STATS =================
function updateStats(total, critical, watch, safe = null) {
    const expEl = document.getElementById("total-exposure");
    if(expEl) expEl.innerText = formatCurrency(total);

    document.getElementById("risk-count").innerText = critical;
    document.getElementById("watch-count").innerText = watch;
    
    // Calculate safe if not provided
    if (safe === null) {
        safe = LOANS_DATA.length - critical - watch;
    }
    
    animateCharts(critical, watch, safe);
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
            btn.classList.add('simulating');
        }
        if(statusText) {
            statusText.innerText = "Running Real-time Scenario...";
            statusText.style.color = "#10b981";
        }
        if(dot) {
            dot.style.background = "#10b981";
            dot.style.boxShadow = "0 0 10px #10b981";
        }
        
        logGameEvent("🚀 Simulation Engine Started...");
        simulationInterval = setInterval(runGameTick, 2500);

    } else {
        // STOP
        clearInterval(simulationInterval);
        if(btn) {
            btn.innerHTML = `<i class="bi bi-play-fill"></i> Auto Play`;
            btn.style.background = "#3b82f6";
            btn.classList.remove('simulating');
        }
        if(statusText) {
            statusText.innerText = "System Standby";
            statusText.style.color = "#94a3b8";
        }
        if(dot) {
            dot.style.background = "#64748b";
            dot.style.boxShadow = "none";
        }
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

    // Apply event effects
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

    // Clamp values
    cov.actual = Math.max(0, Math.min(cov.actual, 2.0));
    
    // Update Status
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
    filterTable(currentFilter); // Re-render with current filter
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

    // Add user message
    box.innerHTML += `<div class="user-msg">
        <div class="message-content">
            <i class="bi bi-person"></i>
            <div class="message-text">${rawMsg}</div>
        </div>
        <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    </div>`;
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
        Status: <span class="${cov.status === 'Critical' ? 'badge-risk' : cov.status === 'Watch' ? 'badge-watch' : 'badge-safe'}">${cov.status}</span><br>
        Amount: ${formatCurrency(specificLoan.amount)}<br>
        Current Ratio: ${Number(cov.actual).toFixed(2)} (Limit: ${cov.threshold})<br>
        Insight: ${cov.insight}`;
    }
    // 🔍 2. Critical
    else if (text.includes("critical") || text.includes("risk")) {
        const list = LOANS_DATA.filter(l => l.covenants.some(c => c.status === "Critical"));
        reply = list.length
            ? `⚠️ <strong>Critical Loans (${list.length}):</strong> ${list.map(l => l.borrower_name).join(", ")}.`
            : "✅ No critical risks detected.";
    }
    // 🔍 3. Watch List
    else if (text.includes("watch")) {
        const list = LOANS_DATA.filter(l => l.covenants.some(c => c.status === "Watch"));
        reply = list.length
            ? `👀 <strong>Watch List (${list.length}):</strong> ${list.map(l => l.borrower_name).join(", ")}.`
            : "Watch list is empty.";
    }
    // 🔍 4. Simulation Awareness
    else if (text.includes("simulation") || text.includes("sim") || text.includes("running")) {
        reply = isSimulating
          ? "🎮 <strong>Simulation Active:</strong> Processing real-time market events."
          : "⏸️ <strong>Simulation Paused:</strong> System is in standby mode.";
    }
    // 🔍 5. Total Exposure
    else if (text.includes("total") || text.includes("exposure")) {
        const total = LOANS_DATA.reduce((sum, loan) => sum + parseFloat(loan.amount), 0);
        reply = `💰 <strong>Total Exposure:</strong> ${formatCurrency(total)}`;
    }
    // 🔍 6. Portfolio Summary
    else if (text.includes("summary") || text.includes("overview") || text.includes("status")) {
        const stats = calculateStats(LOANS_DATA);
        reply = `📊 <strong>Portfolio Summary:</strong><br>
        • Total Loans: ${LOANS_DATA.length}<br>
        • Critical: ${stats.critical}<br>
        • Watch: ${stats.watch}<br>
        • Safe: ${stats.safe}<br>
        • Total Exposure: ${formatCurrency(stats.total)}`;
    }
    // 🔍 7. Help
    else if (text.includes("help")) {
        reply = `I can help you with:<br>
        • Checking loan status<br>
        • Finding critical risks<br>
        • Viewing watch list<br>
        • Portfolio summary<br>
        • Simulation status<br><br>
        Try: "Show critical loans", "What's our total exposure?", or "Give me a summary"`;
    }

    respond(reply);

    function respond(msg) {
        setTimeout(() => {
            box.innerHTML += `<div class="bot-msg">
                <div class="message-content">
                    <i class="bi bi-robot"></i>
                    <div class="message-text">${msg}</div>
                </div>
                <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>`;
            box.scrollTop = box.scrollHeight;
        }, 500);
    }
}

// ================= UTILITY FUNCTIONS =================
function formatCurrency(amount) {
    if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(0)}`;
}

function calculateStats(loans) {
    const stats = { total: 0, critical: 0, watch: 0, safe: 0 };
    
    loans.forEach(loan => {
        stats.total += parseFloat(loan.amount);
        const status = loan.covenants[0]?.status || 'Safe';
        if (status === 'Critical') stats.critical++;
        else if (status === 'Watch') stats.watch++;
        else stats.safe++;
    });
    
    return stats;
}

function updateConnectionStatus(text, type) {
    const statusEl = document.getElementById("connection-status");
    const dot = document.querySelector(".live-dot");
    
    if (statusEl) {
        statusEl.textContent = text;
        statusEl.style.color = 
            type === 'success' ? '#10b981' : 
            type === 'warning' ? '#f59e0b' : 
            type === 'error' ? '#dc2626' : '#64748b';
    }
    
    if (dot) {
        dot.style.background = 
            type === 'success' ? '#10b981' : 
            type === 'warning' ? '#f59e0b' : 
            type === 'error' ? '#dc2626' : '#64748b';
        dot.style.animation = type === 'success' ? 'pulse 2s infinite' : 'none';
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="bi ${type === 'success' ? 'bi-check-circle' : type === 'error' ? 'bi-exclamation-circle' : 'bi-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showLoading(show) {
    // You can implement a loading spinner here if needed
    if (show) {
        // Show loading state
    } else {
        // Hide loading state
    }
}

function showDemoData() {
    LOANS_DATA = [
        {
            id: 'demo-1',
            borrower_name: 'TechCorp Inc.',
            amount: 7500000,
            original_amount: 7500000,
            covenants: [{
                name: 'Debt/EBITDA',
                threshold: 3.5,
                actual: 4.2,
                status: 'Critical',
                insight: 'Exceeds covenant limit by 20%'
            }]
        },
        {
            id: 'demo-2',
            borrower_name: 'Manufacturing Co.',
            amount: 5200000,
            original_amount: 5200000,
            covenants: [{
                name: 'Interest Coverage',
                threshold: 2.0,
                actual: 1.8,
                status: 'Watch',
                insight: 'Approaching covenant limit'
            }]
        },
        {
            id: 'demo-3',
            borrower_name: 'Retail Group Ltd',
            amount: 3200000,
            original_amount: 3200000,
            covenants: [{
                name: 'Current Ratio',
                threshold: 1.5,
                actual: 1.2,
                status: 'Safe',
                insight: 'Within acceptable range'
            }]
        },
        {
            id: 'demo-4',
            borrower_name: 'Energy Solutions',
            amount: 9500000,
            original_amount: 9500000,
            covenants: [{
                name: 'Leverage Ratio',
                threshold: 4.0,
                actual: 4.5,
                status: 'Critical',
                insight: 'Breach detected - immediate review needed'
            }]
        }
    ];
    
    renderTable(LOANS_DATA);
}

// ================= EXPORT FOR GLOBAL USE =================
// Export functions for use in HTML onclick attributes
window.toggleSimulation = toggleSimulation;
window.handleChat = handleChat;

// Make app functions available globally
window.app = {
    fetchData,
    resetSimulation: () => {
        if (isSimulating) toggleSimulation();
        fetchData();
    },
    showDemoMode: () => {
        showDemoData();
        showToast('Demo mode activated', 'info');
    },
    exportData: () => {
        const dataStr = JSON.stringify(LOANS_DATA, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'covenantguard-data.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showToast('Data exported successfully', 'success');
    }
};
