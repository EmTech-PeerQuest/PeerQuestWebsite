from django.urls import path
from .views import CustomUserCreate,CurrentUserView

app_name = 'users'

urlpatterns = [
    path('register/', CustomUserCreate.as_view(), name="create_user"),
    path('me/', CurrentUserView.as_view(), name='current-user'),
]
