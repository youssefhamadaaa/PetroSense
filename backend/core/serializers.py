from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Alert, SensorReading, User, Well

# ---------------------------------------------------------------------------
# Serializers output camelCase JSON to match the frontend contract exactly,
# via explicit source= aliases (no extra renderer dependency).
# ---------------------------------------------------------------------------


# ---- Auth / users ---------------------------------------------------------


class UserSerializer(serializers.ModelSerializer):
    """Compact user shape returned by auth endpoints: {id, name, email, role}."""

    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "name", "email", "role"]

    def get_name(self, obj) -> str:
        return obj.get_full_name() or obj.username


class LoginSerializer(serializers.Serializer):
    """
    Email + password login. Returns {access, refresh, user:{id,name,email,role}}.
    Authenticates by email (the frontend logs in with email, not username).
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        user = User.objects.filter(email__iexact=attrs["email"]).first()
        if user is None or not user.check_password(attrs["password"]):
            raise AuthenticationFailed("Invalid email or password.")
        if not user.is_active:
            raise AuthenticationFailed("This account is inactive.")

        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        }


class AdminUserSerializer(serializers.ModelSerializer):
    """
    Admin user management (list / create / update).
      - `name`      maps to first_name
      - `password`  write-only, hashed via set_password
      - `createdAt` maps to date_joined
    On create, username is set to the email so email-login works.
    """

    name = serializers.CharField(source="first_name", required=False, allow_blank=True)
    password = serializers.CharField(
        write_only=True, required=False, style={"input_type": "password"}
    )
    createdAt = serializers.DateTimeField(source="date_joined", read_only=True)

    class Meta:
        model = User
        fields = ["id", "name", "email", "role", "password", "createdAt"]

    def validate(self, attrs):
        # Password is required when creating (no instance yet).
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError(
                {"password": "This field is required."}
            )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        email = validated_data.get("email", "")
        # username mirrors email so the user can log in by email.
        validated_data["username"] = email or f"user{User.objects.count() + 1}"
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        new_email = validated_data.get("email")
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if new_email:
            instance.username = new_email  # keep login-by-email consistent
        if password:
            instance.set_password(password)
        instance.save()
        return instance


# ---- ML predict input -----------------------------------------------------


class PredictInputSerializer(serializers.Serializer):
    """Validates the four raw sensor inputs for POST /api/predict/."""

    flow_rate = serializers.FloatField()
    pressure = serializers.FloatField()
    temperature = serializers.FloatField()
    vibration = serializers.FloatField()


# ---- Domain (wells / readings / alerts) -----------------------------------


class WellSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    # Derived, not stored — keeps the frontend Well shape (health 0..100).
    health = serializers.IntegerField(read_only=True)

    class Meta:
        model = Well
        fields = ["id", "name", "location", "status", "health", "createdAt"]


class SensorReadingSerializer(serializers.ModelSerializer):
    wellId = serializers.IntegerField(source="well_id", read_only=True)
    flowRate = serializers.FloatField(source="flow_rate", read_only=True)
    isAnomaly = serializers.BooleanField(source="is_anomaly", read_only=True)

    class Meta:
        model = SensorReading
        fields = [
            "id",
            "wellId",
            "timestamp",
            "pressure",
            "temperature",
            "vibration",
            "flowRate",
            "isAnomaly",
        ]


class AlertSerializer(serializers.ModelSerializer):
    wellId = serializers.IntegerField(source="well_id", read_only=True)
    wellName = serializers.CharField(source="well.name", read_only=True)
    readingId = serializers.IntegerField(source="reading_id", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Alert
        fields = [
            "id",
            "wellId",
            "wellName",
            "readingId",
            "severity",
            "reason",
            "acknowledged",
            "createdAt",
        ]
