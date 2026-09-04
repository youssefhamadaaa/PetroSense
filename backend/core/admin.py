from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Alert, SensorReading, User, Well


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    """User admin with the custom `role` field surfaced."""

    list_display = ("username", "email", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")

    # Add `role` to the default fieldsets.
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("PetroSense", {"fields": ("role",)}),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ("PetroSense", {"fields": ("role",)}),
    )


@admin.register(Well)
class WellAdmin(admin.ModelAdmin):
    list_display = ("name", "location", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("name", "location")


@admin.register(SensorReading)
class SensorReadingAdmin(admin.ModelAdmin):
    list_display = ("well", "timestamp", "pressure", "temperature", "vibration", "flow_rate", "is_anomaly")
    list_filter = ("is_anomaly", "well")
    date_hierarchy = "timestamp"


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ("well", "severity", "acknowledged", "created_at")
    list_filter = ("severity", "acknowledged", "well")
    search_fields = ("reason",)
