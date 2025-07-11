from django.urls import path
from .views import NotificationListView, NotificationClearAllView

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('clear_all/', NotificationClearAllView.as_view(), name='notification-clear-all'),
]
