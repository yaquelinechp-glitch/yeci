from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
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
    if not str(file).startswith(str(dist.resolve())) or not file.exists():
        return JsonResponse({"detail": "Not found"}, status=404)
    return FileResponse(open(file, "rb"))

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("prm.urls")),
    re_path(r"^assets/(?P<path>.*)$", spa_assets, name="spa-assets"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [
    re_path(r"^(?!api/|admin/|static/|uploads/|assets/).*$", spa_serve, name="spa"),
]
