from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import CompanySerializer, DealerSerializer
from .models import Company, Dealer, LoginRecord
from django.core.mail import send_mail
from django.contrib.auth.hashers import check_password
from .utils import generate_otp, send_otp_email
from django.core.cache import cache


# ✅ Company Registration
class RegisterCompany(APIView):
    def get(self, request):
        companies = Company.objects.all()
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CompanySerializer(data=request.data)
        if serializer.is_valid():
            company = serializer.save()

            # ✅ Send welcome email
            subject = "🎉 Welcome to Comptech Equipment LIMITED!"
            message = f"""
Dear {company.contact_person},

Welcome aboard! 🎉

We are thrilled to welcome you and your company **{company.name}** to the Comptech Equipment LIMITED family.

Your registration has been successfully completed and your company profile is now active in our system.

✨ What you can expect:
- Access to advanced tools and resources
- Technical support at every step
- Timely updates and special offers

If you have any questions, feel free to contact us.

Warm regards,  
Team Comptech Equipment LIMITED  
📧 it02comptech@gmail.com  
🌐 www.comptechequipment.com  
📞 +91-XXXXXXXXXX
"""
            try:
                send_mail(
                    subject,
                    message,
                    "it02comptech@gmail.com",  # from_email
                    [company.contact_email],   # recipient
                    fail_silently=False
                )
            except Exception as e:
                return Response({
                    "message": "Company registered, but email sending failed.",
                    "error": str(e),
                    "data": serializer.data
                }, status=status.HTTP_201_CREATED)

            return Response({
                "message": "Company registered successfully and welcome email sent!",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ✅ Dealer Registration (after OTP verification)
class RegisterDealer(APIView):
    def get(self, request):
        dealers = Dealer.objects.all()
        serializer = DealerSerializer(dealers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        print("🔔 Incoming Dealer Registration Data:", request.data)  # 👈 Log full input
        serializer = DealerSerializer(data=request.data)
        
        if serializer.is_valid():
            email = serializer.validated_data.get('email')

            # ✅ Check OTP verification
            verified = cache.get(f"verified_otp_{email}")
            if not verified:
                return Response(
                    {"message": "Please verify OTP before registration."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer.save()
            cache.delete(f"verified_otp_{email}")  # clear verification status
            return Response(
                {"message": "Dealer registered successfully."},
                status=status.HTTP_201_CREATED
            )

        # ❌ Print serializer errors to console
        print("❌ Serializer errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ✅ Send OTP to Email
class SendOTPView(APIView):
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"message": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        otp = generate_otp()
        send_otp_email(email, otp)

        cache.set(f"otp_{email}", otp, timeout=300)  # 5 minutes validity
        return Response({"message": f"OTP sent to {email}."}, status=status.HTTP_200_OK)


# ✅ Verify OTP
class VerifyOTPView(APIView):
    def post(self, request):
        email = request.data.get('email')
        otp_input = request.data.get('otp')

        if not email or not otp_input:
            return Response({"message": "Email and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)

        real_otp = cache.get(f"otp_{email}")
        if not real_otp:
            return Response({"message": "OTP expired or not found."}, status=status.HTTP_400_BAD_REQUEST)

        if otp_input == real_otp:
            cache.set(f"verified_otp_{email}", True, timeout=600)  # valid for 10 minutes
            cache.delete(f"otp_{email}")
            return Response({"message": "OTP verified successfully."}, status=status.HTTP_200_OK)

        return Response({"message": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        # Try Dealer login
        try:
            dealer = Dealer.objects.get(email=email)
            if check_password(password, dealer.password):
                LoginRecord.objects.create(email=email, user_type='dealer', success=True)
                return Response({"message": "Login successful", "user_type": "dealer"}, status=status.HTTP_200_OK)
            else:
                LoginRecord.objects.create(email=email, user_type='dealer', success=False)
                return Response({"message": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)
        except Dealer.DoesNotExist:
            pass

        # Try Company login
        try:
            company = Company.objects.get(email=email)
            if check_password(password, company.password):
                LoginRecord.objects.create(email=email, user_type='company', success=True)
                return Response({"message": "Login successful", "user_type": "company"}, status=status.HTTP_200_OK)
            else:
                LoginRecord.objects.create(email=email, user_type='company', success=False)
                return Response({"message": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)
        except Company.DoesNotExist:
            return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)