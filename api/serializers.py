from rest_framework import serializers
from .models import *

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'

class DealerSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = Dealer
        fields = [
            'id', 'company', 'company_name', 'name', 'email', 'phone', 'address', 
            'city', 'state', 'country', 'pin_code', 'gst_no', 'pan_no', 
            'password', 'created_at'
        ]


