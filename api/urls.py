from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    # auth & registration
    RegisterCompany,
    RegisterDealer,
    RegisterEmployee,
    LoginView,             # dealer / company login
    EmployeeLoginView,     # employee login
    SendOTPView,
    VerifyOTPView,
    # dealer & employee
    DealerListView,
    DealerDetailView,
    DealerCountView,
    EmployeeDetailView,
    # machine installation
    MachineInstallationListView,
    create_machine_installation,
    # tasks
    TaskViewSet,
)

# ────────────────────────────────────────────────────────────────
# DRF router  ( /tasks/ , /tasks/<pk>/ )
# ────────────────────────────────────────────────────────────────
router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="task")

# ────────────────────────────────────────────────────────────────
# URL patterns
# ────────────────────────────────────────────────────────────────
urlpatterns = [
    # ── Auth & registration ─────────────────────────────────────
    path("register/company/",  RegisterCompany.as_view(),  name="register_company"),
    path("register/dealer/",   RegisterDealer.as_view(),   name="register_dealer"),
    path("register/employee/", RegisterEmployee.as_view(), name="register_employee"),

    path("login/",           LoginView.as_view(),         name="login"),           # dealer / company
    path("employee-login/",  EmployeeLoginView.as_view(), name="employee_login"),

    path("send-otp/",        SendOTPView.as_view(),       name="send_otp"),
    path("verify-otp/",      VerifyOTPView.as_view(),     name="verify_otp"),

    # ── Dealer endpoints ───────────────────────────────────────
    path("dealers/",         DealerListView.as_view(),    name="dealer_list"),
    path("dealers/count/",   DealerCountView.as_view(),   name="dealer_count"),
    path("dealers/<str:pk>/",DealerDetailView.as_view(),  name="dealer_detail"),

    # ── Employee detail (R / U / D) ────────────────────────────
    path("employees/<int:pk>/", EmployeeDetailView.as_view(), name="employee_detail"),

    # ── Machine installations ─────────────────────────────────
    path("installations/create/", create_machine_installation,           name="create_installation"),
    path("installations/",        MachineInstallationListView.as_view(), name="installation_list"),

    # ── Task router endpoints ( /tasks/ … ) ────────────────────
    path("", include(router.urls)),
]
