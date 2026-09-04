from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

# DRF router for the viewsets.
router = DefaultRouter()
router.register(r"wells", views.WellViewSet, basename="well")
router.register(r"alerts", views.AlertViewSet, basename="alert")
router.register(r"admin/users", views.AdminUserViewSet, basename="admin-user")

# App-level routes, mounted under /api/ by the project urls.
urlpatterns = [
    path("health/", views.health, name="health"),
    # Auth
    path("auth/login/", views.LoginView.as_view(), name="auth-login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("auth/me/", views.me, name="auth-me"),
    # Stats
    path("stats/summary/", views.stats_summary, name="stats-summary"),
    # ML anomaly prediction
    path("predict/", views.predict, name="predict"),
    # Routed viewsets (wells, alerts, admin/users)
    path("", include(router.urls)),
]
