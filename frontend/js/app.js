// ============================================
// ✅ CovenantGuard AI – LIVE Render API
// ============================================

// 🔗 Render Production API
const API_URL = 'https://covenantguard.onrender.com/api/loans/';

async function fetchData() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Server Error");

        const loans = await res.json();
        renderTable(loans);

    } catch (err) {
        console.error(err);
        document.getElementById('loan-table').innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:40px; color:#c0392b;">
                    <h4>⚠️ Connecting to CovenantGuard Core…</h4>
                    <p>Render free server may be sleeping. Please wait a few seconds.</p>
                </td>
            </tr>
        `;
    }
}

function renderTable(loans) {
    const tbody = document.getElementById('loan-table');
    let totalExp = 0, risk = 0, watch = 0;

    // Priority: Critical > Watch > Safe
    const priority = { 'Critical': 3, 'Watch': 2, 'Safe': 1 };

    loans.sort((a, b) => {
        const aStatus = a.covenants[0]?.risk_status || 'Safe';
        const bStatus = b.covenants[0]?.risk_status || 'Safe';
        return priority[bStatus] - priority[aStatus];
    });

    tbody.innerHTML = '';

    loans.forEach(loan => {
        totalExp += parseFloat(loan.amount);

        loan.covenants.forEach(cov => {
            if (cov.risk_status === 'Critical') risk++;
            if (cov.risk_status === 'Watch') watch++;

            let badgeClass =
                cov.risk_status === 'Critical' ? 'badge-risk' :
                cov.risk_status === 'Watch' ? 'badge-watch' :
                'badge-safe';

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

    document.getElementById('total-exposure').innerText =
        `$${(totalExp / 1_000_000).toFixed(1)}M`;

    document.getElementById('risk-count').innerText = risk;
    document.getElementById('watch-count').innerText = watch;
}

// 🚀 Fire on load
fetchData();
