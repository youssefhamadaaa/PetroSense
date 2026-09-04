from django.db.models import Count
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from . import ml_service
from .models import Alert, SensorReading, User, Well
from .permissions import IsAdmin, IsAdminOrReadOnly
from .serializers import (
    AdminUserSerializer,
    AlertSerializer,
    LoginSerializer,
    PredictInputSerializer,
    SensorReadingSerializer,
    UserSerializer,
    WellSerializer,
)


@api_view(["GET"])
@permission_classes([AllowAny])  # public — overrides the global IsAuthenticated
def health(request):
    """Liveness probe. Public, no auth required."""
    return Response({"status": "ok"})


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


class LoginView(APIView):
    """POST /api/auth/login/ -> {access, refresh, user:{id,name,email,role}}."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


@api_view(["GET"])
def me(request):
    """GET /api/auth/me/ -> the current authenticated user."""
    return Response(UserSerializer(request.user).data)


# ---------------------------------------------------------------------------
# ML anomaly prediction
# ---------------------------------------------------------------------------


@api_view(["POST"])
def predict(request):
    """
    POST /api/predict/  (authenticated)
    Body: {flow_rate, pressure, temperature, vibration}
    Ratios are computed server-side. Returns the model prediction plus a
    human-readable reason.
    """
    serializer = PredictInputSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    result = ml_service.predict(serializer.validated_data)
    return Response(result)


# ---------------------------------------------------------------------------
# Admin — user management (admin only)
# ---------------------------------------------------------------------------


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Admin-only user CRUD.
      GET    /api/admin/users/        list
      POST   /api/admin/users/        create (name, email, role, password)
      PATCH  /api/admin/users/{id}/   update role / details
      DELETE /api/admin/users/{id}/   delete
    """

    queryset = User.objects.all().order_by("date_joined")
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]


# ---------------------------------------------------------------------------
# Domain read APIs (+ admin writes on wells)
# ---------------------------------------------------------------------------


class WellViewSet(viewsets.ModelViewSet):
    """
    GET    /api/wells/                        list  (any authenticated user)
    GET    /api/wells/{id}/                   retrieve
    GET    /api/wells/{id}/readings/?limit=N  recent readings (chronological)
    POST   /api/wells/                        create (name, location)  [admin]
    DELETE /api/wells/{id}/                   delete                   [admin]
    """

    queryset = Well.objects.all()
    serializer_class = WellSerializer
    permission_classes = [IsAdminOrReadOnly]
    # No PUT/PATCH exposed — only list/retrieve/create/delete (+ readings).
    http_method_names = ["get", "post", "delete", "head", "options"]

    @action(detail=True, methods=["get"])
    def readings(self, request, pk=None):
        well = self.get_object()
        try:
            limit = int(request.query_params.get("limit", 100))
        except (TypeError, ValueError):
            limit = 100
        limit = max(1, min(limit, 1000))

        # Most recent `limit` readings (model orders newest-first), returned in
        # chronological (oldest -> newest) order for charting.
        recent = list(well.readings.all()[:limit])
        recent.reverse()
        data = SensorReadingSerializer(recent, many=True).data
        return Response(data)


class AlertViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/alerts/   list alerts (newest first), with well + reading joined.
    """

    queryset = Alert.objects.select_related("well", "reading").all()
    serializer_class = AlertSerializer


@api_view(["GET"])
def stats_summary(request):
    """
    GET /api/stats/summary/ — counts by well status + open (unacknowledged)
    alerts, plus KPI-shaped fields the Overview dashboard consumes.
    """
    by_status = {"normal": 0, "warning": 0, "critical": 0}
    for row in Well.objects.values("status").annotate(n=Count("id")):
        by_status[row["status"]] = row["n"]
    total = sum(by_status.values())

    open_alerts = Alert.objects.filter(acknowledged=False).count()

    today = timezone.now().date()
    anomalies_today = SensorReading.objects.filter(
        is_anomaly=True, timestamp__date=today
    ).count()

    wells = list(Well.objects.all())
    avg_health = round(sum(w.health for w in wells) / total) if total else 0

    return Response(
        {
            # counts by status + open alerts (the brief's core requirement)
            "wells": {"total": total, **by_status},
            "openAlerts": open_alerts,
            # KPI-shaped fields matching the frontend Kpi contract
            "wellsOnline": total,
            "activeAlerts": open_alerts,
            "avgHealth": avg_health,
            "anomaliesToday": anomalies_today,
        }
    )
