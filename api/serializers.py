"""
serializers.py — DRF serializers for Comptech Equipment Ltd.
Updated 22 July 2025: added update() methods for Employee & Dealer, minor clean‑ups.
"""
from datetime import timedelta
from datetime import timedelta
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from rest_framework import serializers

from django.contrib.auth.hashers import make_password
from django.utils import timezone
from rest_framework import serializers
_SENTINEL = object()

from .models import (
    Company,
    Dealer,
    MachineInstallation,
    InstallationPhoto,
    Task,Department,
    Employee,TicketCategory,ticket,
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
    assignee_name = serializers.ReadOnlyField(source='assignee.name')
    assigner_name = serializers.ReadOnlyField(source='assigner.name')
    
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
            'id', 'title', 'description', 'created_at', 'deadline',
            'priority', 'status', 'assigner', 'assignee',
            'assigner_name', 'assignee_name'
        ]
        read_only_fields = ['id', 'created_at', 'assigner_name', 'assignee_name']

    def validate_deadline(self, value):
        today = timezone.now().date()
        if value < today:
            raise serializers.ValidationError("Deadline cannot be in the past.")
        if value > today + timedelta(days=365):
            raise serializers.ValidationError("Deadline cannot be more than a year away.")
        return value

    def validate(self, data):
        assignee = data.get('assignee')
        assigner = data.get('assigner')
        if assignee and assigner:
            if assignee.role != "COMPANY_EMPLOYEE":
                raise serializers.ValidationError({
                    "assignee": "Tasks can only be assigned to a Company Employee."
                })
            if assignee.company != assigner:
                raise serializers.ValidationError({
                    "assignee": "This employee does not belong to the assigning company."
                })
        return data# Employee
# ────────────────────────────────────────────────────────────────
class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "department_name"]

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
class GenericRelatedField(serializers.Field):
    def to_representation(self, obj):
        if obj is None:
            return None
        return {
            "content_type": obj._meta.model_name,
            "object_id": obj.pk,
            "display_name": str(obj),
        }

    def to_internal_value(self, data):
        if data is None:                     # allow explicit null
            return None
        if not isinstance(data, dict):
            raise serializers.ValidationError("Expected dict with content_type + object_id.")
        model = data.get("content_type")
        obj_id = data.get("object_id")
        if not model or obj_id is None:
            raise serializers.ValidationError("Both content_type and object_id are required.")

        try:
            content_type = ContentType.objects.get(model=model)
        except ContentType.DoesNotExist:
            raise serializers.ValidationError(f"Invalid content_type: {model}")

        allowed = ['dealer', 'company', 'employee']
        if model not in allowed:
            raise serializers.ValidationError(
                f"content_type '{model}' is not allowed. Choose one of: {', '.join(allowed)}"
            )

        model_cls = content_type.model_class()
        if not model_cls:
            raise serializers.ValidationError("Invalid content_type resolution.")
        try:
            model_cls.objects.get(pk=obj_id)
        except model_cls.DoesNotExist:
            raise serializers.ValidationError(f"Object {obj_id} not found in {model}.")

        return {"content_type": content_type, "object_id": obj_id}


# ============================== TICKET CATEGORY ==============================
class TicketCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketCategory
        fields = '__all__'

class TicketSerializer(serializers.ModelSerializer):
    created_by = GenericRelatedField()
    assigned_to = GenericRelatedField(allow_null=True)

    category_name = serializers.CharField(source='category.name', read_only=True)
    machine_installation_display = serializers.CharField(
        source='machine_installation.__str__', read_only=True
    )

    class Meta:
        model = ticket
        fields = [
            'id', 'title', 'description', 'category', 'category_name',
            'status', 'urgency', 'batch_number', 'item_name', 'item_code',
            'invoice_number', 'purchase_date', 'remarks',
            'created_by', 'assigned_to',
            'machine_installation', 'machine_installation_display',
            'created_at', 'started_at', 'resolved_at', 'feedback_notes', 'rating',
        ]
        read_only_fields = ['id', 'created_at', 'started_at']

    # ============================== VALIDATION ==============================
    def validate(self, data):

        # ---------- Basic validations ----------
        if data.get('resolved_at') and data['resolved_at'] > timezone.now():
            raise serializers.ValidationError({
                'resolved_at': "Date cannot be in the future."
            })

        if data.get('status') == 'resolved' and not data.get('resolved_at'):
            raise serializers.ValidationError({
                'status': "Resolved tickets must have a resolved_at date."
            })

        if data.get('rating') is not None and not (1 <= data['rating'] <= 5):
            raise serializers.ValidationError({
                'rating': "Rating must be between 1 and 5 stars."
            })

        # ---------- Assigned To Validation ----------
        assigned_to = data.get('assigned_to')

        if assigned_to is not None:
            content_type = assigned_to.get('content_type')   # ContentType object
            object_id = assigned_to.get('object_id')

            # ✅ IMPORTANT FIX
            if content_type.model != 'employee':
                raise serializers.ValidationError({
                    'assigned_to': "Tickets can only be assigned to company employees."
                })

            try:
                employee = Employee.objects.get(pk=object_id)
            except Employee.DoesNotExist:
                raise serializers.ValidationError({
                    'assigned_to': f"Employee with id {object_id} does not exist."
                })

            if employee.company is None:
                raise serializers.ValidationError({
                    'assigned_to': "The selected employee is not a company employee."
                })

        return data

    # ============================== GFK HANDLER ==============================
    def _assign_gfk(self, instance, field, gfk_data):
        if gfk_data:
            setattr(instance, f"{field}_content_type", gfk_data["content_type"])
            setattr(instance, f"{field}_object_id", gfk_data["object_id"])
        else:
            setattr(instance, f"{field}_content_type", None)
            setattr(instance, f"{field}_object_id", None)

    # ============================== CREATE ==============================
    def create(self, validated_data):
        created_by = validated_data.pop('created_by', None)
        assigned_to = validated_data.pop('assigned_to', None)

        ticket_obj = ticket(**validated_data)

        self._assign_gfk(ticket_obj, 'created_by', created_by)
        self._assign_gfk(ticket_obj, 'assigned_to', assigned_to)

        if ticket_obj.status == 'in_progress' and not ticket_obj.started_at:
            ticket_obj.started_at = timezone.now()

        ticket_obj.save()
        return ticket_obj

    # ============================== UPDATE ==============================
    def update(self, instance, validated_data):
        created_by = validated_data.pop('created_by', None)
        assigned_to = validated_data.pop('assigned_to', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if instance.status == 'in_progress' and not instance.started_at:
            instance.started_at = timezone.now()

        if created_by is not None:
            self._assign_gfk(instance, 'created_by', created_by)

        if assigned_to is not None:
            self._assign_gfk(instance, 'assigned_to', assigned_to)

        instance.save()
        return instance


# ============================== USER ROLE SERIALIZER ==============================
class UserRoleSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    email = serializers.EmailField()
    role = serializers.SerializerMethodField()
    companyId = serializers.SerializerMethodField()
    dealerId = serializers.SerializerMethodField()

    def get_id(self, obj):
        return obj.id

    def get_name(self, obj):
        return obj.name

    def get_role(self, obj):
        if isinstance(obj, Employee):
            return obj.role
        elif isinstance(obj, Dealer):
            return "DEALER_ADMIN"
        elif isinstance(obj, Company):
            return "COMPANY_ADMIN"
        return "UNKNOWN_ROLE"

    def get_companyId(self, obj):
        if hasattr(obj, 'company_id'):
            return obj.company_id
        elif isinstance(obj, Company):
            return obj.id
        return None

    def get_dealerId(self, obj):
        if hasattr(obj, 'dealer_id'):
            return obj.dealer_id
        elif isinstance(obj, Dealer):
            return obj.id
        return None