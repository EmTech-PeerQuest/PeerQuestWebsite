from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first
    response = drf_exception_handler(exc, context)

    if response is not None:
        # If DRF provided a response, but it's empty, add a generic error message
        if not response.data:
            response.data = {'detail': 'An unknown error occurred. Please contact support.'}
        # Optionally, always include the status code
        response.data['status_code'] = response.status_code
        return response

    # If DRF did not handle the exception, log it and return a generic error
    logger.error('Unhandled exception: %s', exc, exc_info=True)
    return Response(
        {
            'detail': 'A server error occurred. Please try again later or contact support.',
            'error': str(exc),
            'status_code': status.HTTP_500_INTERNAL_SERVER_ERROR
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
