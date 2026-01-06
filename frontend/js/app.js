// ============================================
// ⚠️ FINAL STEP: UPDATE THIS URL AFTER RENDER DEPLOY
// ============================================

// Local Testing URL:
// const API_URL = 'http://127.0.0.1:8000/api/loans/';

// Render URL (Replace this!):
const API_URL = 'https://YOUR-APP-NAME.onrender.com/api/loans/'; 

async function fetchData() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Server Error");
        const loans = await res.json();
        renderTable(loans);
    } catch (err) {
        console.error(err);
        document.getElementById('loan-table').innerHTML = `
            <tr><td colspan="6" class="text-center py-5 text-danger">
                <h5>⚠️ Connecting to CovenantGuard Core...</h5>
                <p>If this takes long, please wake up the Render server.</p>
            </td></tr>`;
    }
}

function renderTable(loans) {
    const tbody = document.getElementById('loan-table');
    let totalExp = 0, risk = 0, watch = 0;
    
    // Sort logic: Critical > Watch > Safe
    const priority = { 'Critical': 3, 'Watch': 2, 'Safe': 1 };
    
    loans.sort((a, b) => {
        let statA = a.covenants[0]?.risk_status || 'Safe';
        let statB = b.covenants[0]?.risk_status || 'Safe';
        return priority[statB] - priority[statA];
    });

    tbody.innerHTML = '';

    loans.forEach(loan => {
        totalExp += parseFloat(loan.amount);
        
        loan.covenants.forEach(cov => {
            if(cov.risk_status === 'Critical') risk++;
            if(cov.risk_status === 'Watch') watch++;

            let badgeClass = cov.risk_status === 'Critical' ? 'badge-risk' : 
                             cov.risk_status === 'Watch' ? 'badge-watch' : 'badge-safe';

            let row = `
                <tr>
                    <td class="ps-4 fw-bold text-dark">${loan.borrower_name}</td>
                    <td>$${(parseFloat(loan.amount)/1000000).toFixed(1)}M</td>
                    <td>${cov.name}</td>
                    <td>
                        <span class="text-muted">Max: ${cov.threshold}</span> <br>
                        <strong>Now: ${cov.actual_value}</strong>
                    </td>
                    <td><span class="${badgeClass}">${cov.risk_status.toUpperCase()}</span></td>
                    <td class="text-muted small"><i class="bi bi-robot me-1"></i> ${cov.explanation}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    });

    document.getElementById('total-exposure').innerText = `$${(totalExp/1000000).toFixed(1)}M`;
    document.getElementById('risk-count').innerText = risk;
    document.getElementById('watch-count').innerText = watch;
}

fetchData();
