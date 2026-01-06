from django.db import models

class Loan(models.Model):
    borrower_name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.borrower_name


class Covenant(models.Model):
    RISK_CHOICES = [
        ("Safe", "Safe"),
        ("Watch", "Watch"),
        ("Critical", "Critical"),
    ]

    loan = models.ForeignKey(
        Loan,
        related_name="covenants",
        on_delete=models.CASCADE
    )
    name = models.CharField(max_length=255)
    threshold = models.FloatField()
    actual_value = models.FloatField()
    risk_status = models.CharField(max_length=10, choices=RISK_CHOICES)
    explanation = models.TextField()

    def __str__(self):
        return f"{self.loan.borrower_name} - {self.name}"
