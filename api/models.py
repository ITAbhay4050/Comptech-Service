"""Django models for Comptech Equipment Ltd. backend
Updated July 2, 2025 – reflects linting, security, and relational‑integrity fixes.
"""
from django.db import models
from django.contrib.auth.hashers import make_password, identify_hasher


class Company(models.Model):
    """Registered manufacturing/servicing companies."""

    gst_no = models.CharField(max_length=20)
    name = models.CharField(max_length=255)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    pin_code = models.CharField(max_length=20)
    phone = models.CharField(max_length=20)
    email = models.EmailField(unique=True)
    pan_no = models.CharField(max_length=20)
    # Store hashed password only
    password = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Companies"

    def save(self, *args, **kwargs):
        # Hash plain‑text passwords before saving; honour any algorithm Django supports.
        try:
            identify_hasher(self.password)
        except (ValueError, TypeError):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Dealer(models.Model):
    """Dealers associated with a Company (one‑to‑many)."""

    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="dealers"
    )
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    pin_code = models.CharField(max_length=20)
    gst_no = models.CharField(max_length=20, blank=True, null=True)
    pan_no = models.CharField(max_length=20, blank=True, null=True)
    password = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    otp = models.CharField(max_length=6, blank=True, null=True)
    is_verified = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        try:
            identify_hasher(self.password)
        except (ValueError, TypeError):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.company.name})"


class LoginRecord(models.Model):
    """Audit‑trail for login attempts (success/failure)."""

    USER_TYPE_CHOICES = [
        ("dealer", "Dealer"),
        ("company", "Company"),
    ]

    email = models.EmailField()
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)
    login_time = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField(default=False)

    class Meta:
        ordering = ["-login_time"]

    def __str__(self):
        status = "Success" if self.success else "Failed"
        return f"{self.email} – {self.user_type} – {status}"


class MachineInstallation(models.Model):
    """Physical machine installations done by dealers or companies."""

    # Linked parties (exactly one of these should be filled)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True)
    dealer = models.ForeignKey(Dealer, on_delete=models.CASCADE, null=True, blank=True)

    # Machine
    model_number = models.CharField(max_length=100)
    serial_number = models.CharField(max_length=100, unique=True, db_index=True)
    batch_number = models.CharField(max_length=100, blank=True, null=True)
    invoice_number = models.CharField(max_length=100, blank=True, null=True)

    # End‑client details (if company user fills the form)
    client_company_name = models.CharField(max_length=255, blank=True, null=True)
    client_gst_number = models.CharField(max_length=30, blank=True, null=True)
    client_contact_person = models.CharField(max_length=100, blank=True, null=True)
    client_contact_phone = models.CharField(max_length=20, blank=True, null=True)

    # Installation info
    installation_date = models.DateField()
    installed_by = models.CharField(max_length=100)
    location = models.TextField()
    notes = models.TextField(blank=True, null=True)

    # Metadata
    submitted_by_id = models.CharField(max_length=100)
    submitted_by_role = models.CharField(max_length=100)
    submitted_by_name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Machine Installation"

    def __str__(self):
        return f"Installation: {self.model_number} – {self.serial_number}"


class InstallationPhoto(models.Model):
    installation = models.ForeignKey(
        MachineInstallation,
        on_delete=models.CASCADE,
        related_name="photos",
    )
    photo = models.ImageField(upload_to="machine_install/")

    def __str__(self):
        return f"Photo for {self.installation.serial_number}"


class Task(models.Model):
    """General task/issue tracker."""

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("urgent", "Urgent"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in-progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    deadline = models.DateField()

    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="medium")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    assigner_id = models.CharField(max_length=100, default="user_1")
    assignee_id = models.CharField(max_length=100, default="user_1")
    machine_id = models.CharField(max_length=100, default="NA")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
