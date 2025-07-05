class DebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    def __call__(self, request):
        print("[DEBUG] Incoming request path:", request.path)
        return self.get_response(request)
