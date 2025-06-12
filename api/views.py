from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import CompanySerializer
from .models import Company

# def register_Company(request):
#     serializer = CompanySerializer(data=request.data)
#     if serializer.is_valid():
#         serializer.save()
#         return Response({'status': 'Company Registered'})
#     return Response(serializer.errors)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import CompanySerializer
from .models import Company


class RegisterCompany(APIView): 

    def get(self, request):
        companies = Company.objects.all()
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CompanySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Company registered successfully!",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

