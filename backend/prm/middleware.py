from django.utils.deprecation import MiddlewareMixin


class CSPMiddleware(MiddlewareMixin):
    """Add Content-Security-Policy headers to all responses."""

    def process_response(self, request, response):
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.hs-scripts.com https://js.hsforms.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: blob: https:; "
            "media-src 'self' data: blob:; "
            "connect-src 'self' https:; "
            "frame-src 'self' https:; "
            "object-src 'none'"
        )
        response["Content-Security-Policy"] = csp
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "DENY"
        response["X-XSS-Protection"] = "1; mode=block"
        return response
