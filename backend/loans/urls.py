from django.urls import path
from .views import LoanListAPIView

urlpatterns = [
    path("loans/", LoanListAPIView.as_view(), name="loan-list"),
]
