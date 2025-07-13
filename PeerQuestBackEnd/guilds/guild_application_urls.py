from rest_framework.routers import DefaultRouter
from .guild_application_views import GuildApplicationViewSet

router = DefaultRouter()
router.register(r'applications', GuildApplicationViewSet, basename='guild-applications')

urlpatterns = router.urls
