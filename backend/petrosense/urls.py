from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    # All API routes live under /api/. (Auth, wells, alerts, etc. added later.)
    path("api/", include("core.urls")),
]
