from django.urls import path
from .api import clear_notifications

urlpatterns = [
    path('clear/', clear_notifications, name='clear_notifications'),
]
