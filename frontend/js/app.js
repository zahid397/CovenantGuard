// ============================================
// 🛡️ CovenantGuard AI – Production Frontend
// ============================================

class CovenantGuard {
  constructor() {
    this.API_URL = "https://covenantguard.onrender.com/api/loans";
    this.BACKUP_DATA = this.getBackupData();
    this.LOANS_DATA = [];
    this.simulationInterval = null;
    this.isSimulating = false;
    this.debounceTimer = null;
    this.eventListeners = new Map();
    this.SIMULATION_SPEED = 2500; // ms
    this.retryAttempts = 0;
    this.maxRetries = 5;
    
    this.initialize();
  }

  // ================= INITIALIZATION =================
  initialize() {
    this.setupDOMReady();
    this.setupErrorHandling();
  }

  setupDOMReady() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.onDOMLoaded());
    } else {
      this.onDOMLoaded();
    }
  }

  setupErrorHandling() {
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.error);
    });

    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled promise rejection:', e.reason);
    });
  }

  onDOMLoaded() {
    this.bindElements();
    this.setupEventListeners();
    this.fetchData();
  }

  // ================= DOM BINDING =================
  bindElements() {
    this.elements = {
      loanTable: document.getElementById('loan-table'),
      totalExposure: document.getElementById('total-exposure'),
      riskCount: document.getElementById('risk-count'),
      watchCount: document.getElementById('watch-count'),
      simBtn: document.getElementById('sim-btn'),
      simStatusText: document.getElementById('sim-status-text'),
      simStatusDot: document.getElementById('sim-status-dot'),
      chatInput: document.getElementById('chat-input'),
      chatBox: document.getElementById('chat-box'),
      gameLog: document.getElementById('game-log')
    };
  }

  // ================= EVENT LISTENERS =================
  setupEventListeners() {
    // Chat input
    if (this.elements.chatInput) {
      this.addListener(this.elements.chatInput, 'keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleChat();
        }
      });
    }

    // Simulation button is handled by global function
    // We'll also add it here for consistency
    if (this.elements.simBtn) {
      this.addListener(this.elements.simBtn, 'click', () => this.toggleSimulation());
    }
  }

  addListener(element, event, handler) {
    element.addEventListener(event, handler);
    const key = `${event}-${element.id || element.tagName}`;
    this.eventListeners.set(key, { element, event, handler });
  }

  // ================= DATA FETCHING =================
  async fetchData() {
    try {
      // Show loading state in table
      if (this.elements.loanTable) {
        this.elements.loanTable.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 40px; color: #9ca3af;">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                <div class="spinner"></div>
                <div>Loading loan data...</div>
              </div>
            </td>
          </tr>
        `;
      }
      
      const response = await fetch(this.API_URL, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Validate and normalize data
      this.LOANS_DATA = this.normalizeLoanData(data);
      this.renderTable(this.LOANS_DATA);
      this.retryAttempts = 0; // Reset on success
      
    } catch (error) {
      console.error('Fetch error:', error);
      
      // Use backup data if available
      if (this.BACKUP_DATA.length > 0) {
        this.LOANS_DATA = this.BACKUP_DATA;
        this.renderTable(this.LOANS_DATA);
        this.updateGameLog('⚠️ Using demo data (backend offline)');
      } else if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++;
        setTimeout(() => this.fetchData(), 2000 * this.retryAttempts);
      } else {
        this.showErrorState();
      }
    }
  }

  normalizeLoanData(data) {
    if (!Array.isArray(data)) return [];
    
    return data.map(loan => ({
      id: loan.id || `loan-${Math.random().toString(36).substr(2, 9)}`,
      borrower_name: loan.borrower_name || 'Unknown Borrower',
      amount: parseFloat(loan.amount) || 0,
      original_amount: parseFloat(loan.amount) || 0,
      covenants: Array.isArray(loan.covenants) && loan.covenants.length > 0 
        ? loan.covenants.map(cov => ({
            name: cov.name || 'Unnamed Covenant',
            threshold: parseFloat(cov.threshold) || 1.0,
            actual: parseFloat(cov.actual) || 0,
            status: this.calculateStatus(parseFloat(cov.actual), parseFloat(cov.threshold)),
            insight: cov.insight || 'No insight available'
          }))
        : [{
            name: 'Default Covenant',
            threshold: 1.0,
            actual: 0.5,
            status: 'Safe',
            insight: 'No covenant data available'
          }],
      last_updated: new Date().toISOString()
    }));
  }

  calculateStatus(actual, threshold) {
    if (actual > threshold) return 'Critical';
    if (actual > threshold * 0.8) return 'Watch';
    return 'Safe';
  }

  // ================= RENDERING =================
  renderTable(loans) {
    if (!this.elements.loanTable) return;
    
    if (!loans || loans.length === 0) {
      this.elements.loanTable.innerHTML = this.getEmptyStateHTML();
      this.updateStats(0, 0, 0);
      return;
    }

    // Sort with priority
    const sortedLoans = this.sortLoans(loans);
    
    // Update stats
    const stats = this.calculateStats(sortedLoans);
    this.updateStats(stats.total, stats.critical, stats.watch);
    
    // Render rows
    this.elements.loanTable.innerHTML = sortedLoans.map((loan, index) => 
      this.getLoanRowHTML(loan, index)
    ).join('');
    
    // Apply animations
    this.animateRows();
  }

  sortLoans(loans) {
    const priority = { "Critical": 3, "Watch": 2, "Safe": 1 };
    return [...loans].sort((a, b) => {
      const aStatus = a.covenants[0]?.status || "Safe";
      const bStatus = b.covenants[0]?.status || "Safe";
      return priority[bStatus] - priority[aStatus];
    });
  }

  calculateStats(loans) {
    const stats = { total: 0, critical: 0, watch: 0, safe: 0 };
    
    loans.forEach(loan => {
      stats.total += loan.amount;
      const status = loan.covenants[0]?.status || 'Safe';
      if (status === 'Critical') stats.critical++;
      else if (status === 'Watch') stats.watch++;
      else stats.safe++;
    });
    
    return stats;
  }

  getLoanRowHTML(loan, index) {
    const covenant = loan.covenants[0];
    const formattedAmount = this.formatCurrency(loan.amount);
    const badgeClass = this.getBadgeClass(covenant.status);
    const animClass = loan.justUpdated ? this.getAnimationClass(covenant.status) : '';
    
    // Calculate ratio percentage for visual indicator
    const ratioPercent = Math.min((covenant.actual / covenant.threshold) * 100, 150);
    
    return `
      <tr class="${animClass}" id="row-${index}">
        <td>
          <strong>${this.escapeHTML(loan.borrower_name)}</strong>
          <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">ID: ${loan.id.substring(0, 8)}</div>
        </td>
        <td><strong>${formattedAmount}</strong></td>
        <td>${this.escapeHTML(covenant.name)}</td>
        <td>
          <div style="margin-bottom: 4px;">
            <span style="font-size: 12px; color: #6b7280;">Limit: ${covenant.threshold.toFixed(2)}</span>
            <br>
            <strong style="color: ${covenant.actual > covenant.threshold ? '#dc2626' : '#059669'}">
              Actual: ${covenant.actual.toFixed(2)}
            </strong>
          </div>
          <div style="background: #e5e7eb; height: 4px; border-radius: 2px; overflow: hidden;">
            <div style="width: ${ratioPercent}%; height: 100%; background: ${covenant.actual > covenant.threshold ? '#dc2626' : covenant.actual > covenant.threshold * 0.8 ? '#f59e0b' : '#10b981'};"></div>
          </div>
        </td>
        <td>
          <span class="${badgeClass}">${covenant.status}</span>
        </td>
        <td style="font-size: 12px; color: #6b7280;">
          <i class="bi bi-robot" style="margin-right: 4px;"></i>${this.escapeHTML(covenant.insight)}
        </td>
      </tr>
    `;
  }

  getEmptyStateHTML() {
    return `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: #9ca3af;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
            <i class="bi bi-database-x" style="font-size: 32px;"></i>
            <div>No loan data available</div>
            <button onclick="app.fetchData()" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
              <i class="bi bi-arrow-clockwise"></i> Refresh
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  // ================= SIMULATION ENGINE =================
  toggleSimulation() {
    this.isSimulating = !this.isSimulating;
    
    if (this.isSimulating) {
      this.startSimulation();
    } else {
      this.stopSimulation();
    }
    
    this.updateSimulationUI();
  }

  startSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
    
    this.simulationInterval = setInterval(() => {
      this.runGameTick();
    }, this.SIMULATION_SPEED);
    
    this.updateGameLog('🚀 Simulation Engine Started');
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.updateGameLog('⏸️ Simulation Paused');
  }

  runGameTick() {
    if (this.LOANS_DATA.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * this.LOANS_DATA.length);
    const loan = this.LOANS_DATA[randomIndex];
    
    if (!loan.covenants || loan.covenants.length === 0) return;
    
    const covenant = loan.covenants[0];
    const events = this.getSimulationEvents();
    const event = events[Math.floor(Math.random() * events.length)];
    
    // Apply event effects
    const changes = this.applyEventEffects(loan, covenant, event);
    
    // Update covenant status
    covenant.status = this.calculateStatus(covenant.actual, covenant.threshold);
    covenant.insight = this.generateInsight(covenant, event);
    
    // Mark for animation
    loan.justUpdated = true;
    
    // Re-render and log
    this.renderTable(this.LOANS_DATA);
    this.animateCharts();
    this.updateGameLog(`> ${event.text} ${changes}`);
  }

  applyEventEffects(loan, covenant, event) {
    const originalAmount = loan.original_amount || 5000000;
    let changeMsg = '';
    
    switch(event.type) {
      case 'CRASH':
      case 'DEBT':
        covenant.actual = Math.min(covenant.actual + (Math.random() * 0.4), 2.0);
        loan.amount = originalAmount + (Math.random() * 1000000);
        changeMsg = `📉 ${loan.borrower_name} risk increasing!`;
        break;
        
      case 'BOOM':
      case 'PAY':
        covenant.actual = Math.max(covenant.actual - (Math.random() * 0.3), 0);
        loan.amount = Math.max(originalAmount - (Math.random() * 500000), 0);
        changeMsg = `📈 ${loan.borrower_name} improving`;
        break;
        
      default:
        covenant.actual += (Math.random() - 0.5) * 0.2;
        loan.amount = originalAmount + (Math.random() - 0.5) * 500000;
        changeMsg = `⚡ ${loan.borrower_name} updated`;
    }
    
    // Clamp values
    covenant.actual = Math.max(0, Math.min(covenant.actual, 2.0));
    loan.amount = Math.max(0, loan.amount);
    
    return changeMsg;
  }

  // ================= CHAT BOT =================
  handleChat(customText = null) {
    const input = this.elements.chatInput;
    const box = this.elements.chatBox;
    const rawMsg = customText || input?.value || '';
    const text = rawMsg.trim();
    
    if (!text) return;
    
    // Add user message
    this.addChatMessage(text, 'user');
    
    // Clear input
    if (input) input.value = '';
    
    // Process after delay
    setTimeout(() => {
      const response = this.generateChatResponse(text);
      this.addChatMessage(response, 'bot');
    }, 600);
  }

  generateChatResponse(text) {
    const query = text.toLowerCase();
    
    // Check specific patterns
    if (query.includes('hello') || query.includes('hi')) {
      return '👋 Hello! I can help analyze loan risks and covenant breaches.';
    }
    
    if (query.includes('critical') || query.includes('risk')) {
      const criticalLoans = this.LOANS_DATA.filter(l => 
        l.covenants[0]?.status === 'Critical'
      );
      
      if (criticalLoans.length > 0) {
        const names = criticalLoans.map(l => l.borrower_name).join(', ');
        return `⚠️ <strong>${criticalLoans.length} Critical Loans:</strong><br>${names}`;
      }
      return '✅ No critical risks detected.';
    }
    
    if (query.includes('watch')) {
      const watchLoans = this.LOANS_DATA.filter(l => 
        l.covenants[0]?.status === 'Watch'
      );
      
      if (watchLoans.length > 0) {
        const names = watchLoans.map(l => l.borrower_name).join(', ');
        return `👀 <strong>Watch List (${watchLoans.length}):</strong><br>${names}`;
      }
      return 'No loans on watch list.';
    }
    
    if (query.includes('simulation') || query.includes('auto')) {
      return this.isSimulating 
        ? '🎮 <strong>Simulation Active:</strong> Real-time market events running.'
        : '⏸️ <strong>Simulation Paused:</strong> Click "Auto Play" to start.';
    }
    
    if (query.includes('total') || query.includes('exposure')) {
      const total = this.LOANS_DATA.reduce((sum, loan) => sum + loan.amount, 0);
      return `💰 <strong>Total Exposure:</strong> ${this.formatCurrency(total)}`;
    }
    
    // Search for specific borrower
    const matchedLoan = this.LOANS_DATA.find(loan => 
      loan.borrower_name.toLowerCase().includes(query)
    );
    
    if (matchedLoan) {
      const cov = matchedLoan.covenants[0];
      return `
        📊 <strong>${matchedLoan.borrower_name}</strong><br>
        Amount: ${this.formatCurrency(matchedLoan.amount)}<br>
        Status: <span class="${this.getBadgeClass(cov.status)}">${cov.status}</span><br>
        Ratio: ${cov.actual.toFixed(2)} / ${cov.threshold}<br>
        Insight: ${cov.insight}
      `;
    }
    
    // Default response
    return 'I can help with:<br>• Loan status checks<br>• Risk analysis<br>• Portfolio totals<br>• Simulation control<br><br>Try: "Show critical loans" or "What is our total exposure?"';
  }

  // ================= UTILITIES =================
  formatCurrency(amount) {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(0)}`;
  }

  getBadgeClass(status) {
    if (status === 'Critical') {
      return 'badge-risk';
    } else if (status === 'Watch') {
      return 'badge-watch';
    }
    return 'badge-safe';
  }

  getAnimationClass(status) {
    return status === 'Critical' ? 'flash-critical' : 'flash-safe';
  }

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  updateGameLog(message) {
    if (!this.elements.gameLog) return;
    
    this.elements.gameLog.textContent = message;
    this.elements.gameLog.style.opacity = '0';
    
    setTimeout(() => {
      this.elements.gameLog.style.transition = 'opacity 0.3s ease';
      this.elements.gameLog.style.opacity = '1';
    }, 200);
  }

  updateStats(total, critical, watch) {
    if (this.elements.totalExposure) {
      this.elements.totalExposure.textContent = this.formatCurrency(total);
    }
    if (this.elements.riskCount) {
      this.elements.riskCount.textContent = critical;
    }
    if (this.elements.watchCount) {
      this.elements.watchCount.textContent = watch;
    }
    
    // Update charts
    this.animateCharts(critical, watch);
  }

  animateCharts(critical = null, watch = null) {
    // Calculate stats if not provided
    if (critical === null || watch === null) {
      const stats = this.calculateStats(this.LOANS_DATA);
      critical = stats.critical;
      watch = stats.watch;
    }
    
    const safe = this.LOANS_DATA.length - critical - watch;
    const total = this.LOANS_DATA.length || 1;
    
    const bars = [
      { id: 'bar-critical', value: critical },
      { id: 'bar-watch', value: watch },
      { id: 'bar-safe', value: safe }
    ];
    
    bars.forEach(bar => {
      const element = document.getElementById(bar.id);
      if (element) {
        const percentage = Math.round((bar.value / total) * 100);
        element.style.width = bar.value ? `${Math.max(percentage, 10)}%` : '0%';
        element.textContent = bar.value ? `${percentage}%` : '';
      }
    });
  }

  updateSimulationUI() {
    if (!this.elements.simBtn || !this.elements.simStatusText || !this.elements.simStatusDot) return;
    
    if (this.isSimulating) {
      this.elements.simBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pause Sim';
      this.elements.simBtn.style.background = '#dc2626';
      this.elements.simStatusText.textContent = 'Running Real-time Scenario...';
      this.elements.simStatusText.style.color = '#10b981';
      this.elements.simStatusDot.style.background = '#10b981';
      this.elements.simStatusDot.style.boxShadow = '0 0 10px #10b981';
    } else {
      this.elements.simBtn.innerHTML = '<i class="bi bi-play-fill"></i> Auto Play';
      this.elements.simBtn.style.background = '#3b82f6';
      this.elements.simStatusText.textContent = 'System Standby';
      this.elements.simStatusText.style.color = '#94a3b8';
      this.elements.simStatusDot.style.background = '#64748b';
      this.elements.simStatusDot.style.boxShadow = 'none';
    }
  }

  animateRows() {
    const rows = document.querySelectorAll('.flash-critical, .flash-safe');
    rows.forEach(row => {
      setTimeout(() => {
        row.classList.remove('flash-critical', 'flash-safe');
      }, 1000);
    });
  }

  getSimulationEvents() {
    return [
      { type: 'CRASH', text: '📉 Market Crash! Asset values dropping.' },
      { type: 'BOOM', text: '📈 Revenue Spike! Strong results.' },
      { type: 'DEBT', text: '⚠️ New Debt Acquired. Leverage increasing.' },
      { type: 'PAY', text: '✅ Loan Repayment Processed.' },
      { type: 'MERGED', text: '🏛️ M&A Activity Reported' },
      { type: 'AUDIT', text: '🔍 Financial Audit Complete' }
    ];
  }

  generateInsight(covenant, event) {
    const insights = {
      'Critical': [
        `Immediate action required - ${event.text}`,
        `Breach imminent - ${event.text}`,
        `Emergency measures needed - ${event.text}`
      ],
      'Watch': [
        `Close monitoring advised - ${event.text}`,
        `Approaching limits - ${event.text}`,
        `Watch condition - ${event.text}`
      ],
      'Safe': [
        `Within acceptable ranges - ${event.text}`,
        `No immediate concerns - ${event.text}`,
        `Healthy metrics maintained - ${event.text}`
      ]
    };
    
    const list = insights[covenant.status] || insights.Safe;
    return list[Math.floor(Math.random() * list.length)];
  }

  getBackupData() {
    // Sample backup data for demo when backend is offline
    return [
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
  }

  showErrorState() {
    if (this.elements.loanTable) {
      this.elements.loanTable.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px; color: #dc2626;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
              <i class="bi bi-wifi-off" style="font-size: 32px;"></i>
              <div style="font-weight: 600;">Connection Failed</div>
              <div style="font-size: 14px;">Unable to reach the server. Please check your connection.</div>
              <button onclick="app.fetchData()" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">
                <i class="bi bi-arrow-clockwise"></i> Retry Connection
              </button>
            </div>
          </td>
        </tr>
      `;
    }
    
    this.updateGameLog('⚠️ Backend connection failed');
  }

  addChatMessage(message, sender) {
    if (!this.elements.chatBox) return;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `${sender === 'bot' ? 'bot-msg' : 'user-msg'}`;
    msgDiv.innerHTML = message;
    
    this.elements.chatBox.appendChild(msgDiv);
    this.elements.chatBox.scrollTop = this.elements.chatBox.scrollHeight;
  }
}

// ================= INSTANTIATE =================
const app = new CovenantGuard();

// ================= GLOBAL FUNCTIONS =================
// These are called from HTML onclick attributes
function toggleSimulation() {
  app.toggleSimulation();
}

function handleChat() {
  app.handleChat();
}

// Also allow pressing Enter in chat
document.addEventListener('DOMContentLoaded', function() {
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        handleChat();
      }
    });
  }
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  .spinner {
    width: 30px;
    height: 30px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .flash-critical {
    animation: flashCritical 1s ease;
  }
  
  .flash-safe {
    animation: flashSafe 1s ease;
  }
  
  @keyframes flashCritical {
    0%, 100% { background: transparent; }
    50% { background: rgba(220, 38, 38, 0.1); }
  }
  
  @keyframes flashSafe {
    0%, 100% { background: transparent; }
    50% { background: rgba(16, 185, 129, 0.1); }
  }
  
  .badge-risk, .badge-watch, .badge-safe {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .badge-risk {
    background: rgba(220, 38, 38, 0.1);
    color: #dc2626;
    border: 1px solid rgba(220, 38, 38, 0.3);
  }
  
  .badge-watch {
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }
  
  .badge-safe {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
`;
document.head.appendChild(style);
