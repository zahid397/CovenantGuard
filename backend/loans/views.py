from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Loan
from .serializers import LoanSerializer

@api_view(["GET"])
def loan_list(request):
    loans = Loan.objects.all().order_by("borrower_name")
    serializer = LoanSerializer(loans, many=True)
    return Response(serializer.data)
