from django.core.management.base import BaseCommand
from loans.models import Loan, Covenant

class Command(BaseCommand):
    help = "Populate database with demo loan & covenant data"

    def handle(self, *args, **kwargs):
        Covenant.objects.all().delete()
        Loan.objects.all().delete()

        # Critical loan
        l1 = Loan.objects.create(
            borrower_name="Apex Global Logistics",
            amount=5000000
        )
        Covenant.objects.create(
            loan=l1,
            name="Debt to Equity",
            threshold=2.0,
            actual_value=2.45,
            risk_status="Critical",
            explanation="Debt spiked by 20% post-merger."
        )

        # Watch loan
        l2 = Loan.objects.create(
            borrower_name="GreenLeaf Energy",
            amount=1200000
        )
        Covenant.objects.create(
            loan=l2,
            name="Interest Coverage Ratio",
            threshold=3.0,
            actual_value=3.1,
            risk_status="Watch",
            explanation="Operating income dropped slightly."
        )

        # Safe loan
        l3 = Loan.objects.create(
            borrower_name="MediCare Systems",
            amount=3500000
        )
        Covenant.objects.create(
            loan=l3,
            name="Current Ratio",
            threshold=1.5,
            actual_value=1.8,
            risk_status="Safe",
            explanation="Liquidity position is strong."
        )

        self.stdout.write(self.style.SUCCESS("Demo data loaded successfully!"))
