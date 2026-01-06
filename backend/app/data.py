# Demo Data for Hackathon
loans_db = [
    {
        "id": 1,
        "borrower_name": "Apex Logistics Ltd",
        "amount": 5000000.00,
        "covenants": [
            {
                "name": "Debt to Equity",
                "threshold": 2.0,
                "actual": 2.45,
                "status": "Critical",
                "insight": "Debt spiked by 20% post-merger, breaching 2.0 limit."
            }
        ]
    },
    {
        "id": 2,
        "borrower_name": "GreenLeaf Energy",
        "amount": 1200000.00,
        "covenants": [
            {
                "name": "Interest Coverage",
                "threshold": 3.0,
                "actual": 3.1,
                "status": "Watch",
                "insight": "Operating income dropped, coverage is thin but safe."
            }
        ]
    },
    {
        "id": 3,
        "borrower_name": "MediCare Systems",
        "amount": 3500000.00,
        "covenants": [
            {
                "name": "Current Ratio",
                "threshold": 1.5,
                "actual": 1.8,
                "status": "Safe",
                "insight": "Liquidity remains strong."
            }
        ]
    }
]
