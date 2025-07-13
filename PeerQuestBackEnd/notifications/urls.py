from django.urls import path
from .views import NotificationListView, NotificationClearAllView, NotificationReadView, unread_count

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('clear_all/', NotificationClearAllView.as_view(), name='notification-clear-all'),
    path('<int:pk>/mark-read/', NotificationReadView.as_view(), name='notification-read'),
    path('unread-count/', unread_count, name='notification-unread-count'),
]
