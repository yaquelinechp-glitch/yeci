from pathlib import Path

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.http import HttpResponse, JsonResponse, FileResponse

# Función para servir el frontend SPA (React) desde el build compilado
def spa_serve(request, *args, **kwargs):
    dist = settings.FRONTEND_DIST
    if not dist.exists():
        return JsonResponse({"detail": "Frontend not built"}, status=503)
    index_file = dist / "index.html"
    content = index_file.read_bytes()
    return HttpResponse(content, content_type="text/html; charset=utf-8")


def spa_assets(request, path, *args, **kwargs):
    dist = settings.FRONTEND_DIST
    file = (dist / path).resolve()
    if not str(file).startswith(str(dist.resolve())) or not file.is_file():
        return JsonResponse({"detail": "Not found"}, status=404)
    return FileResponse(open(file, "rb"))

# Sirve archivos subidos (videos, materiales) tambien con DEBUG=False.
# django.conf.urls.static.static() solo funciona en desarrollo.
def media_serve(request, path, *args, **kwargs):
    root = Path(settings.MEDIA_ROOT).resolve()
    file = (root / path).resolve()
    if not file.is_relative_to(root) or not file.is_file():
        return JsonResponse({"detail": "Not found"}, status=404)
    return FileResponse(open(file, "rb"))

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("prm.urls")),
    re_path(r"^assets/(?P<path>.*)$", spa_assets, name="spa-assets"),
    re_path(r"^favicon\.svg$", spa_assets, {"path": "favicon.svg"}, name="favicon"),
    re_path(r"^uploads/(?P<path>.*)$", media_serve, name="media"),
]

urlpatterns += [
    re_path(r"^(?!api/|admin/|static/|uploads/|assets/).*$", spa_serve, name="spa"),
]
