from django.contrib import admin
from .models import Company

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'city', 'state', 'country', 'gst_no', 'created_at')
    search_fields = ('name', 'gst_no', 'contact_email')
