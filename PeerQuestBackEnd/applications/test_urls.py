from django.urls import path
from . import views

# Simple test URLs to debug the issue
urlpatterns = [
    path('test-my-applications/', views.test_my_applications, name='test-my-applications'),
    path('test-to-my-quests/', views.test_to_my_quests, name='test-to-my-quests'),
]
