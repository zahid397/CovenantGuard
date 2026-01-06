from django.db import models

class Loan(models.Model):
    borrower_name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    
    def __str__(self):
        return self.borrower_name

class Covenant(models.Model):
    loan = models.ForeignKey(Loan, related_name='covenants', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    threshold = models.FloatField()
    actual_value = models.FloatField()
    risk_status = models.CharField(max_length=50) 
    explanation = models.TextField()

    def __str__(self):
        return f"{self.name} - {self.risk_status}"
      
