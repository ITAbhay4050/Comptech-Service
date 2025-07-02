"""api/urls.py
URL configuration for Comptech Equipment LIMITED REST API.
Every endpoint ends with a trailing slash; the React front‑end relies on this.
Updated 2 July 2025.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

app_name = "api"  # allows {% url 'api:login' %} in templates

# ---------------------------------------------------------------------------
# DRF ViewSet router (automatically generates list/create/detail routes)
# ---------------------------------------------------------------------------
router = DefaultRouter()
router.register(r"tasks", views.TaskViewSet, basename="task")  # /api/tasks/

# If you later convert dealers or installations to ViewSets, add here:
# router.register(r"dealers", views.DealerViewSet, basename="dealer")
# router.register(r"installations", views.MachineInstallationViewSet,
#                 basename="installation")

urlpatterns: list = [
    # ---------------------------------------------------------------------
    # Registration & authentication
    # ---------------------------------------------------------------------
    path("register/company/", views.RegisterCompany.as_view(), name="register_company"),
    path("register/dealer/", views.RegisterDealer.as_view(), name="register_dealer"),
    path("login/", views.LoginView.as_view(), name="login"),

    # ---------------------------------------------------------------------
    # OTP flow
    # ---------------------------------------------------------------------
    path("send-otp/", views.SendOTPView.as_view(), name="send_otp"),
    path("verify-otp/", views.VerifyOTPView.as_view(), name="verify_otp"),

    # ---------------------------------------------------------------------
    # Dealer standalone endpoints (class‑based views)
    # ---------------------------------------------------------------------
    path("dealers/", views.DealerListView.as_view(), name="dealer_list"),
    path("dealers/<str:pk>/", views.DealerDetailView.as_view(), name="dealer_detail"),
    path("dealers/count/", views.DealerCountView.as_view(), name="dealer_count"),

    # ---------------------------------------------------------------------
    # Machine installation (function‑based view)
    # ---------------------------------------------------------------------
    path("installations/create/", views.create_machine_installation, name="create_installation"),

    # ---------------------------------------------------------------------
    # ViewSet‑generated routes
    # ---------------------------------------------------------------------
    path("", include(router.urls)),  # → /api/tasks/ , /api/tasks/<id>/
]