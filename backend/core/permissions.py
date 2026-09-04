from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    """Allow only authenticated users whose role == 'admin'."""

    message = "Admin role required."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.role == "admin")


class IsAdminOrReadOnly(BasePermission):
    """
    Read (GET/HEAD/OPTIONS) for any authenticated user; writes (POST/DELETE/…)
    for admins only. Used on the wells viewset so listing stays open but
    create/delete are admin-gated.
    """

    message = "Admin role required to modify wells."

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return user.role == "admin"
