from django.db import models

class Company(models.Model):
    name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    pin_code = models.CharField(max_length=20)
    contact_phone = models.CharField(max_length=20)
    contact_email = models.EmailField()
    gst_no = models.CharField(max_length=20)
    pan_no = models.CharField(max_length=20)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    

