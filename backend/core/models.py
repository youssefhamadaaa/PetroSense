from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user for PetroSense.

    Extends Django's AbstractUser (keeps username/password/email/permissions)
    and adds a `role` that the whole platform's access control keys off:
      - 'admin'    : full control (manage users + wells, admin-only routes)
      - 'engineer' : standard user (default)

    AUTH_USER_MODEL is set to 'core.User' in settings so this replaces the
    default auth user everywhere.
    """

    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        ENGINEER = "engineer", "Engineer"

    # Email is the login identifier for PetroSense, so it must be unique.
    # (AbstractUser's default email field is not unique.)
    email = models.EmailField("email address", unique=True)

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ENGINEER,
    )

    @property
    def is_admin(self) -> bool:
        return self.role == self.Role.ADMIN

    def __str__(self) -> str:
        return f"{self.get_username()} ({self.role})"


class Well(models.Model):
    """A monitored oil well."""

    class Status(models.TextChoices):
        NORMAL = "normal", "Normal"
        WARNING = "warning", "Warning"
        CRITICAL = "critical", "Critical"

    name = models.CharField(max_length=120)
    location = models.CharField(max_length=255)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NORMAL,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    @property
    def health(self) -> int:
        """
        Derived health score 0..100 from the anomaly ratio of recent readings.
        Falls back to a status band when the well has no readings yet.
        Not stored — computed on read so it always reflects current data.
        """
        recent = list(self.readings.all()[:50])  # newest first (Meta ordering)
        if not recent:
            return {"normal": 95, "warning": 70, "critical": 40}[self.status]
        anomalies = sum(1 for r in recent if r.is_anomaly)
        ratio = anomalies / len(recent)
        return max(0, min(100, round(100 - ratio * 130)))

    def __str__(self) -> str:
        return f"{self.name} ({self.status})"


class SensorReading(models.Model):
    """
    A single point-in-time reading of a well's four sensors.

    Units (matching the frontend contract):
      flow_rate   -> m³/day
      pressure    -> bar
      temperature -> °C
      vibration   -> mm/s
    """

    well = models.ForeignKey(
        Well,
        on_delete=models.CASCADE,
        related_name="readings",
    )
    timestamp = models.DateTimeField()
    flow_rate = models.FloatField()
    pressure = models.FloatField()
    temperature = models.FloatField()
    vibration = models.FloatField()
    is_anomaly = models.BooleanField(default=False)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["well", "-timestamp"]),
        ]

    def __str__(self) -> str:
        return f"{self.well.name} @ {self.timestamp:%Y-%m-%d %H:%M}"


class Alert(models.Model):
    """
    An explainable alert derived from an anomalous reading. Each alert points
    back to the exact reading that caused it.
    """

    class Severity(models.TextChoices):
        NORMAL = "normal", "Normal"
        WARNING = "warning", "Warning"
        CRITICAL = "critical", "Critical"

    well = models.ForeignKey(
        Well,
        on_delete=models.CASCADE,
        related_name="alerts",
    )
    reading = models.ForeignKey(
        SensorReading,
        on_delete=models.CASCADE,
        related_name="alerts",
    )
    severity = models.CharField(
        max_length=20,
        choices=Severity.choices,
        default=Severity.WARNING,
    )
    reason = models.TextField()
    acknowledged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["severity"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.severity} · {self.well.name}"
