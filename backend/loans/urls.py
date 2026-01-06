from django.urls import path
from .views import loan_list

urlpatterns = [
    path("loans/", loan_list, name="loan-list"),
]
