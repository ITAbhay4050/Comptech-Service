from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterCompany,
    CompanyListView,
    DealerListView,
    DealerDetailView,
    DealerCountView,
    RegisterEmployee,
    EmployeeDetailView,
    SendOTPView,
    VerifyOTPView,
    LoginView,
    MachineInstallationListView,
    create_machine_installation,
    TaskViewSet,
    check_serial_unique,
    EmployeeLoginView,
    GetDealerDataByGST,
)
from . import views

router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="task")

urlpatterns = [
    # Auth / registration
    path("register/company/", RegisterCompany.as_view(), name="register_company"),
    path("companies/", CompanyListView.as_view(), name="company_list"),
    path("register/employee/", RegisterEmployee.as_view(), name="register_employee"),
    path("login/", LoginView.as_view(), name="login"),
    path("send-otp/", SendOTPView.as_view(), name="send_otp"),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify_otp"),

    # Dealer
    path("dealers/", DealerListView.as_view(), name="dealer_list"),
    path("dealers/<int:pk>/", DealerDetailView.as_view(), name="dealer_detail"),
    path("dealers/count/", DealerCountView.as_view(), name="dealer_count"),

    # Employee detail
    path("employees/<int:pk>/", EmployeeDetailView.as_view(), name="employee_detail"),
    path("api/employee/login/", EmployeeLoginView.as_view(), name="employee-login"),

    # Machine installations
    path("installations/", MachineInstallationListView.as_view(), name="installation_list"),
    path("installations/create/", create_machine_installation, name="create_installation"),
    path("machines/check-serial/", check_serial_unique, name="check_serial_unique"),

    # Dealer data by GST
      path("get-dealer-data-by-gst/", GetDealerDataByGST.as_view(), name="get_dealer_data_by_gst"),
    #path('get-dealer-data-by-gst/', views.get_dealer_data_by_gst, name='get_dealer_data_by_gst'),
    # Router (tasks/)
    path("", include(router.urls)),
]
