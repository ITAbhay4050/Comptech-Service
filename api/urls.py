from django.urls import path
from .views import (
    RegisterCompany,
    RegisterDealer,
    SendOTPView,
    VerifyOTPView,
    LoginView,  # ✅ Add login import
)

urlpatterns = [
    path('register/company/', RegisterCompany.as_view(), name='register_company'),
    path('register/dealer/', RegisterDealer.as_view(), name='register_dealer'),
    path('send-otp/', SendOTPView.as_view(), name='send_otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('login/', LoginView.as_view(), name='login'),  # ✅ Add login URL
]
