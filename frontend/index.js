// ============================================
// 🛡️ CovenantGuard AI – Production Frontend
// ============================================

class CovenantGuard {
  constructor() {
    this.API_URL = "https://covenantguard.onrender.com/api/loans";
    this.BACKUP_DATA = this.getBackupData();
    this.LOANS_DATA = [];
    this.filteredLoans = [];
    this.simulationInterval = null;
    this.isSimulating = false;
    this.debounceTimer = null;
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
      this.showToast('An unexpected error occurred', 'error');
    });

    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled promise rejection:', e.reason);
      this.showToast('Network issue detected', 'warning');
    });
  }

  onDOMLoaded() {
    this.bindElements();
    this.setupEventListeners();
    this.fetchData();
    this.startHealthCheck();
  }

  // ================= DOM BINDING =================
  bindElements() {
    this.elements = {
      loanTable: document.getElementById('loan-table'),
      totalExposure: document.getElementById('total-exposure'),
      riskCount: document.getElementById('risk-count'),
      watchCount: document.getElementById('watch-count'),
      totalLoans: document.getElementById('total-loans'),
      simBtn: document.getElementById('sim-btn'),
      simStatusText: document.getElementById('sim-status-text'),
      simStatusDot: document.getElementById('sim-status-dot'),
      chatInput: document.getElementById('chat-input'),
      chatBox: document.getElementById('chat-box'),
      gameLog: document.getElementById('game-log'),
      searchInput: document.getElementById('search-input'),
      connectionStatus: document.getElementById('connection-status')
    };
  }

  // ================= EVENT LISTENERS =================
  setupEventListeners() {
    // Chat input
    if (this.elements.chatInput) {
      this.elements.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleChat();
        }
      });
    }

    // Simulation button
    if (this.elements.simBtn) {
      this.elements.simBtn.addEventListener('click', () => this.toggleSimulation());
    }

    // Search input with debounce
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', (e) => {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.filterLoans(e.target.value);
        }, 300);
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        this.elements.searchInput?.focus();
      }
      if (e.key === 'Escape' && this.isSimulating) {
        this.toggleSimulation();
      }
    });
  }

  // ================= DATA FETCHING =================
  async fetchData() {
    try {
      this.showLoading(true);
      this.updateConnectionStatus('Connecting...', 'warning');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(this.API_URL, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Validate and normalize data
      this.LOANS_DATA = this.normalizeLoanData(data);
      this.filteredLoans = [...this.LOANS_DATA];
      this.renderTable(this.filteredLoans);
      this.retryAttempts = 0;
      
      this.updateConnectionStatus('Live', 'success');
      this.showToast(`Loaded ${data.length} loans`, 'success');
      
    } catch (error) {
      console.error('Fetch error:', error);
      this.updateConnectionStatus('Offline', 'error');
      
      if (error.name === 'AbortError') {
        this.showToast('Request timeout - server may be sleeping', 'warning');
      }
      
      // Use backup data if available
      if (this.BACKUP_DATA.length > 0) {
        this.LOANS_DATA = this.BACKUP_DATA;
        this.filteredLoans = [...this.LOANS_DATA];
        this.renderTable(this.filteredLoans);
        this.showToast('Using demo data', 'warning');
      } else if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++;
        setTimeout(() => this.fetchData(), 2000 * this.retryAttempts);
        this.showToast(`Retrying... (${this.retryAttempts}/${this.maxRetries})`, 'info');
      } else {
        this.showErrorState();
      }
    } finally {
      this.showLoading(false);
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
      last_updated: new Date().toISOString(),
      justUpdated: false
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
    
    // Update total loans count
    if (this.elements.totalLoans) {
      this.elements.totalLoans.textContent = `${sortedLoans.length} loan${sortedLoans.length !== 1 ? 's' : ''}`;
    }
    
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
    const ratioColor = covenant.actual > covenant.threshold ? '#dc2626' : 
                      covenant.actual > covenant.threshold * 0.8 ? '#f59e0b' : '#10b981';
    
    return `
      <tr class="loan-row ${animClass}" data-id="${loan.id}" data-status="${covenant.status}">
        <td class="borrower-cell">
          <div class="borrower-name">${this.escapeHTML(loan.borrower_name)}</div>
          <div class="loan-id">ID: ${loan.id.substring(0, 8)}</div>
        </td>
        <td class="amount-cell"><strong>${formattedAmount}</strong></td>
        <td class="covenant-cell">${this.escapeHTML(covenant.name)}</td>
        <td class="ratio-cell">
          <div class="ratio-info">
            <span class="ratio-label">Limit: ${covenant.threshold.toFixed(2)}</span>
            <br>
            <strong class="ratio-value" style="color: ${ratioColor}">
              Actual: ${covenant.actual.toFixed(2)}
            </strong>
          </div>
          <div class="ratio-bar">
            <div class="ratio-fill" style="width: ${ratioPercent}%; background: ${ratioColor};"></div>
          </div>
        </td>
        <td class="status-cell">
          <span class="status-badge ${badgeClass}">${covenant.status}</span>
        </td>
        <td class="insight-cell">
          <i class="bi bi-robot"></i> ${this.escapeHTML(covenant.insight)}
        </td>
      </tr>
    `;
  }

  getEmptyStateHTML() {
    return `
      <tr>
        <td colspan="6" class="empty-state">
          <div class="empty-content">
            <i class="bi bi-database-x"></i>
            <h4>No loan data available</h4>
            <p>Try refreshing or check your connection</p>
            <button class="btn-refresh" onclick="app.fetchData()">
              <i class="bi bi-arrow-clockwise"></i> Refresh Data
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
    this.filterLoans(this.elements.searchInput?.value || '');
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
    if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
      return '👋 Hello! I can help analyze loan risks and covenant breaches.';
    }
    
    if (query.includes('help')) {
      return 'I can help with:<br>• Loan status checks<br>• Risk analysis<br>• Portfolio totals<br>• Simulation control<br><br>Try: "Show critical loans" or "What is our total exposure?"';
    }
    
    if (query.includes('critical') || query.includes('risk')) {
      const criticalLoans = this.filteredLoans.filter(l => 
        l.covenants[0]?.status === 'Critical'
      );
      
      if (criticalLoans.length > 0) {
        const names = criticalLoans.map(l => l.borrower_name).join(', ');
        return `⚠️ <strong>${criticalLoans.length} Critical Loans:</strong><br>${names}`;
      }
      return '✅ No critical risks detected.';
    }
    
    if (query.includes('watch')) {
      const watchLoans = this.filteredLoans.filter(l => 
        l.covenants[0]?.status === 'Watch'
      );
      
      if (watchLoans.length > 0) {
        const names = watchLoans.map(l => l.borrower_name).join(', ');
        return `👀 <strong>Watch List (${watchLoans.length}):</strong><br>${names}`;
      }
      return 'No loans on watch list.';
    }
    
    if (query.includes('simulation') || query.includes('auto') || query.includes('running')) {
      return this.isSimulating 
        ? '🎮 <strong>Simulation Active:</strong> Real-time market events running.'
        : '⏸️ <strong>Simulation Paused:</strong> Click "Auto Play" to start.';
    }
    
    if (query.includes('total') || query.includes('exposure')) {
      const total = this.filteredLoans.reduce((sum, loan) => sum + loan.amount, 0);
      return `💰 <strong>Total Exposure:</strong> ${this.formatCurrency(total)}`;
    }
    
    if (query.includes('status') || query.includes('health')) {
      const stats = this.calculateStats(this.filteredLoans);
      return `
        📊 <strong>Portfolio Health:</strong><br>
        • Total Loans: ${this.filteredLoans.length}<br>
        • Critical: ${stats.critical}<br>
        • Watch: ${stats.watch}<br>
        • Safe: ${stats.safe}<br>
        • Total Exposure: ${this.formatCurrency(stats.total)}
      `;
    }
    
    // Search for specific borrower
    const matchedLoan = this.filteredLoans.find(loan => 
      loan.borrower_name.toLowerCase().includes(query)
    );
    
    if (matchedLoan) {
      const cov = matchedLoan.covenants[0];
      return `
        📊 <strong>${matchedLoan.borrower_name}</strong><br>
        Amount: ${this.formatCurrency(matchedLoan.amount)}<br>
        Status: <span class="status-badge ${this.getBadgeClass(cov.status)}">${cov.status}</span><br>
        Ratio: ${cov.actual.toFixed(2)} / ${cov.threshold}<br>
        Insight: ${cov.insight}
      `;
    }
    
    // Default response
    return "I'm not sure I understand. Try asking about:<br>• Loan status<br>• Portfolio risks<br>• Total exposure<br>• Simulation status";
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
    const classes = {
      'Critical': 'badge-risk',
      'Watch': 'badge-watch',
      'Safe': 'badge-safe'
    };
    return classes[status] || 'badge-safe';
  }

  getAnimationClass(status) {
    return status === 'Critical' ? 'flash-critical' : 'flash-update';
  }

  escapeHTML(str) {
    if (!str) return '';
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
      const stats = this.calculateStats(this.filteredLoans);
      critical = stats.critical;
      watch = stats.watch;
    }
    
    const safe = this.filteredLoans.length - critical - watch;
    const total = this.filteredLoans.length || 1;
    
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
      this.elements.simBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pause Simulation';
      this.elements.simBtn.classList.add('simulating');
      this.elements.simStatusText.textContent = 'Live Simulation Running';
      this.elements.simStatusText.classList.add('active');
      this.elements.simStatusDot.classList.add('active');
    } else {
      this.elements.simBtn.innerHTML = '<i class="bi bi-play-fill"></i> Auto Play';
      this.elements.simBtn.classList.remove('simulating');
      this.elements.simStatusText.textContent = 'System Standby';
      this.elements.simStatusText.classList.remove('active');
      this.elements.simStatusDot.classList.remove('active');
    }
  }

  updateConnectionStatus(text, type = 'info') {
    if (!this.elements.connectionStatus) return;
    
    this.elements.connectionStatus.textContent = text;
    this.elements.connectionStatus.style.color = 
      type === 'success' ? '#10b981' : 
      type === 'warning' ? '#f59e0b' : 
      type === 'error' ? '#dc2626' : '#64748b';
    
    const dot = document.querySelector('.live-dot');
    if (dot) {
      dot.style.background = 
        type === 'success' ? '#10b981' : 
        type === 'warning' ? '#f59e0b' : 
        type === 'error' ? '#dc2626' : '#64748b';
      dot.style.animation = type === 'success' ? 'pulse 2s infinite' : 'none';
    }
  }

  showLoading(show) {
    const loader = document.querySelector('.loading-state');
    if (loader) {
      loader.style.display = show ? 'table-cell' : 'none';
    }
  }

  showToast(message, type = 'info') {
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
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  animateRows() {
    const rows = document.querySelectorAll('.loan-row');
    rows.forEach((row, index) => {
      row.style.animationDelay = `${index * 0.05}s`;
      if (row.classList.contains('flash-critical') || row.classList.contains('flash-update')) {
        setTimeout(() => {
          row.classList.remove('flash-critical', 'flash-update');
        }, 1000);
      }
    });
  }

  filterLoans(searchTerm) {
    if (!searchTerm) {
      this.filteredLoans = [...this.LOANS_DATA];
    } else {
      this.filteredLoans = this.LOANS_DATA.filter(loan => 
        loan.borrower_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.covenants.some(cov => 
          cov.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cov.insight.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    this.renderTable(this.filteredLoans);
  }

  startHealthCheck() {
    // Periodic health check every 30 seconds
    setInterval(async () => {
      try {
        await fetch(this.API_URL, { method: 'HEAD', cache: 'no-cache' });
      } catch (error) {
        console.warn('Health check failed:', error);
      }
    }, 30000);
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
          insight: 'Exceeds covenant
