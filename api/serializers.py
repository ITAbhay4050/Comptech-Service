"""
serializers.py — DRF serializers for Comptech Equipment Ltd.
Updated 22 July 2025: added update() methods for Employee & Dealer, minor clean‑ups.
"""
from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.utils import timezone
from rest_framework import serializers

from .models import (
    Company,
    Dealer,
    MachineInstallation,
    InstallationPhoto,
    Task,
    Employee,
    AccountMaster, # <--- Import AccountMaster
)

# ────────────────────────────────────────────────────────────────
# Company & Dealer
# ────────────────────────────────────────────────────────────────

class CompanySerializer(serializers.ModelSerializer):
    """CRUD for a *Company* (manufacturer/servicing firm)."""

    # Never reveal the hashed password; only allow it on writes.
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Company
        fields = "__all__"
        extra_kwargs = {
            'password': {'write_only': True}
        }

class DealerSerializer(serializers.ModelSerializer):
    """CRUD + extra validation for *Dealer* (linked to a Company)."""

    company_name = serializers.CharField(source="company.name", read_only=True)
    # Helper flag coming from your React UI (won’t be stored in DB)
    isDirect = serializers.BooleanField(write_only=True, required=False)
    # Write‑only password; ensure it is always hashed before save.
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Dealer
        fields = [
            "id",
            "company",
            "company_name",
            "name",
            "email",
            "phone",
            "address",
            "city",
            "state",
            "country",
            "pin_code",
            "gst_no",
            "pan_no",
            "password",
            "created_at",
            "isDirect",
            "otp",            # Added missing OTP fields from model
            "otp_created_at", # Added missing OTP fields from model
            "is_verified",    # Added missing OTP fields from model
        ]
        read_only_fields = ["id", "created_at", "company_name", "otp", "otp_created_at", "is_verified"]

    # --- extra validation -------------------------------------------------
    def validate_phone(self, value: str) -> str:
        """Very lightweight phone check; use *phonenumbers* lib in prod."""
        digits = "".join(filter(str.isdigit, value))
        if len(digits) < 9 or len(digits) > 15:
            raise serializers.ValidationError("Enter a valid phone number.")
        return value

    # --- life‑cycle overrides --------------------------------------------
    def create(self, validated_data):
        # 1️⃣ discard helper flag
        validated_data.pop("isDirect", None)
        # 2️⃣ always call super; the model’s save() hashes the password if needed
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Ensure password is hashed when updating."""
        password = validated_data.get("password")
        if password:
            validated_data["password"] = make_password(password)
        # drop helper flag if present
        validated_data.pop("isDirect", None)
        return super().update(instance, validated_data)


# NEW: Serializer for AccountMaster (external DB) - Read-only
class AccountMasterSerializer(serializers.ModelSerializer):
    # Mapping external DB column names to more generic names if desired
    # These 'source' attributes map to the *model field names* (not db_column names directly)
    # The model field names themselves might be mapped to db_column names.
    name = serializers.CharField(source='accountname', read_only=True)
    gst_no = serializers.CharField(source='gstno', read_only=True)
    # Removed source='pan_no' as it's redundant (field name is 'pan_no' and so is the source)
    pan_no = serializers.CharField(read_only=True)

    class Meta:
        model = AccountMaster
        # Corrected fields: Only include fields present in the AccountMaster model.
        # Removed 'address' and 'phone' as they are not defined in your AccountMaster model.
        fields = ['accountmasterid', 'name', 'email', 'pan_no', 'gst_no']
        read_only_fields = fields # All fields are read-only as it's from an external managed=False DB



# ────────────────────────────────────────────────────────────────
# Machine Installation & photos
# ────────────────────────────────────────────────────────────────

class InstallationPhotoSerializer(serializers.ModelSerializer):
    """Read‑only representation of stored installation photos."""

    class Meta:
        model = InstallationPhoto
        fields = ["id", "photo"]  # returns URL/path only
        read_only_fields = fields

class MachineInstallationSerializer(serializers.ModelSerializer):
    """Full serializer for machine installations with inline photo upload."""

    # Nested, read‑only list of already‑saved photos
    photos = InstallationPhotoSerializer(many=True, read_only=True)

    # Incoming files – not stored directly on the model
    photo_files = serializers.ListField(
        child=serializers.ImageField(
            max_length=5_000_000,   # 5 MB each
            allow_empty_file=False,
            use_url=False,
        ),
        write_only=True,
        required=False,
        help_text="JPEG/PNG ≤ 5 MB each; maximum 3 files",
    )

    class Meta:
        model = MachineInstallation
        fields = [
            "id",
            "company",
            "dealer",
            "item_name",
            "item_code",
            "batch_number",
            "invoice_number",
            "purchase_date",
            "client_company_name",
            "client_gst_number",
            "client_contact_person",
            "client_contact_phone",
            "installation_date",
            "installed_by",
            "location",
            "notes",
            "submitted_by", # Changed from submitted_by_id to submitted_by for ForeignKey
            "submitted_by_role",
            "submitted_by_name",
            "created_at",
            # virtual fields
            "photo_files",
            "photos",
        ]
        read_only_fields = ["id", "created_at", "photos"]
        # Allow submitted_by to be written as ID if sent by frontend
        extra_kwargs = {
            'submitted_by': {'write_only': True}
        }


    # --- extra validation -------------------------------------------------
    def validate_photo_files(self, value):
        if len(value) > 3:
            raise serializers.ValidationError("You can upload a maximum of 3 photos.")
        return value

    # --- life‑cycle overrides --------------------------------------------
    def create(self, validated_data):
        files = validated_data.pop("photo_files", [])
        installation = super().create(validated_data)  # will run .clean()
        for img in files:
            InstallationPhoto.objects.create(installation=installation, photo=img)
        return installation

# ────────────────────────────────────────────────────────────────
# Task
# ────────────────────────────────────────────────────────────────

class TaskSerializer(serializers.ModelSerializer):
    # These fields allow the frontend to display the names of people 
    # involved without making extra API calls.
    assignee_name = serializers.ReadOnlyField(source='assignee.name')
    assigner_name = serializers.ReadOnlyField(source='assigner.name')
    
    # We explicitly define these to ensure the frontend can send just the ID 
    # but the GET request returns the full name representation.
    assignee = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(), 
        required=False, 
        allow_null=True
    )
    assigner = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(), 
        required=False, 
        allow_null=True
    )

    class Meta:
        model = Task
        fields = [
            'id', 
            'title', 
            'description', 
            'created_at', 
            'deadline', 
            'priority', 
            'status', 
            'assigner', 
            'assignee', 
            'assigner_name', 
            'assignee_name'
        ]
        read_only_fields = ['id', 'created_at', 'assigner_name', 'assignee_name']

    def validate_deadline(self, value):
        """
        Check that the deadline is not in the past and not too far in the future.
        """
        today = timezone.now().date()
        if value < today:
            raise serializers.ValidationError("Deadline cannot be in the past.")
        if value > today + timedelta(days=365):
            raise serializers.ValidationError("Deadline cannot be more than a year away.")
        return value

    def validate(self, data):
        """
        Object-level validation to mirror the model's clean() method logic.
        """
        assignee = data.get('assignee')
        assigner = data.get('assigner')

        if assignee and assigner:
            # Check Role
            if assignee.role != "COMPANY_EMPLOYEE":
                raise serializers.ValidationError({
                    "assignee": "Tasks can only be assigned to a Company Employee."
                })
            
            # Check Company Belonging
            if assignee.company != assigner:
                raise serializers.ValidationError({
                    "assignee": "This employee does not belong to the assigning company."
                })
                
        return data# ────────────────────────────────────────────────────────────────
# Employee
# ────────────────────────────────────────────────────────────────

class EmployeeSerializer(serializers.ModelSerializer):
    """Serializer for *Employee* accounts with secure password handling."""

    password = serializers.CharField(write_only=True)

    class Meta:
        model = Employee
        fields = "__all__"  # list explicit fields in production
        extra_kwargs = {"password": {"write_only": True}}

    # --- life‑cycle overrides --------------------------------------------
    def create(self, validated_data):
        validated_data["password"] = make_password(validated_data["password"])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        password = validated_data.get("password")
        if password:
            validated_data["password"] = make_password(password)
        return super().update(instance, validated_data)