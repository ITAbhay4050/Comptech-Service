from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import CompanySerializer , DealerSerializer
from .models import Company,Dealer
from django.core.mail import send_mail


class RegisterCompany(APIView):

    def get(self, request):
        companies = Company.objects.all()
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CompanySerializer(data=request.data)
        if serializer.is_valid():
            company = serializer.save()

            # ✅ Send beautiful welcome email after successful registration
            subject = "🎉 Welcome to Comptech Equipment LIMITED!"
            message = f"""
Dear {company.contact_person},

Welcome aboard! 🎉

We are thrilled to welcome you and your company **{company.name}** to the Comptech Equipment LIMITED family.

Your registration has been successfully completed and your company profile is now active in our system. We are committed to delivering reliable service, technical excellence, and complete support throughout your journey with us.

✨ What you can expect:
- Access to advanced tools and resources
- Technical support at every step
- Timely updates and special offers

If you have any questions or need assistance, feel free to contact us anytime.

Once again, thank you for choosing us. We look forward to a great partnership!

Warm regards,  
Team Comptech Equipment LIMITED  
📧 it02comptech@gmail.com  
🌐 www.comptechequipment.com  
📞 +91-XXXXXXXXXX
"""

            from_email = "it02comptech@gmail.com"
            recipient_list = [company.contact_email]

            try:
                send_mail(subject, message, from_email, recipient_list, fail_silently=False)
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
class RegisterDealer(APIView):
    def get(self, request):
        dealers = Dealer.objects.all()
        serializer = DealerSerializer(dealers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = DealerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)