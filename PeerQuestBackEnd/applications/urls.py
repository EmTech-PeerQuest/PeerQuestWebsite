from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ApplicationViewSet, test_my_applications, test_to_my_quests

router = DefaultRouter()
router.register(r'applications', ApplicationViewSet, basename='applications')

urlpatterns = [
    path('', include(router.urls)),
    # Temporary test URLs
    path('test-my-applications/', test_my_applications, name='test-my-applications'),
    path('test-to-my-quests/', test_to_my_quests, name='test-to-my-quests'),
]
