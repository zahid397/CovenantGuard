from rest_framework import serializers
from .models import Loan, Covenant

class CovenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Covenant
        fields = "__all__"


class LoanSerializer(serializers.ModelSerializer):
    covenants = CovenantSerializer(many=True, read_only=True)

    class Meta:
        model = Loan
        fields = "__all__"
