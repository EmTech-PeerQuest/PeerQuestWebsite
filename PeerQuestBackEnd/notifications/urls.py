from django.urls import path
from .api import clear_notifications, list_notifications
from .utils import debug_list_notifications

urlpatterns = [
    path('', list_notifications, name='list_notifications'),
    path('clear/', clear_notifications, name='clear_notifications'),
    path('debug-list/', debug_list_notifications, name='debug_list_notifications'),
]
