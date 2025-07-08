from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        # If DRF handled it, just return as is
        return response

    # For unhandled exceptions, return a standard error structure
    return Response(
        {"detail": "An unexpected server error occurred. Please try again later."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
