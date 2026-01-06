from django.core.management.base import BaseCommand
from loans.models import Loan, Covenant

class Command(BaseCommand):
    help = 'Populates DB with Bank-Grade Demo Data'

    def handle(self, *args, **kwargs):
        Loan.objects.all().delete()
        
        # 1. Critical Risk
        l1 = Loan.objects.create(borrower_name="Apex Global Logistics", amount=5000000)
        Covenant.objects.create(
            loan=l1, name="Debt to Equity", threshold=2.0, actual_value=2.45, 
            risk_status="Critical", explanation="Debt spiked by 20% post-merger, breaching 2.0 limit.")
            
        # 2. Watch List
        l2 = Loan.objects.create(borrower_name="GreenLeaf Energy", amount=1200000)
        Covenant.objects.create(
            loan=l2, name="Interest Coverage Ratio", threshold=3.0, actual_value=3.1, 
            risk_status="Watch", explanation="Operating income dropped, coverage is thin but safe.")

        # 3. Safe Loan
        l3 = Loan.objects.create(borrower_name="MediCare Systems", amount=3500000)
        Covenant.objects.create(
            loan=l3, name="Current Ratio", threshold=1.5, actual_value=1.8, 
            risk_status="Safe", explanation="Liquidity is strong.")

        self.stdout.write(self.style.SUCCESS('Data Loaded Successfully!'))
      
