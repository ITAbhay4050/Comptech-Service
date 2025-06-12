# api/urls.py
from django.urls import path
from .views import RegisterCompany

urlpatterns = [
    path('register/', RegisterCompany.as_view(), name='register_company'),  # <-- ADD .as_view()
]
