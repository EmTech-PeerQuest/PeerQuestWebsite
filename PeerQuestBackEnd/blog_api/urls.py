from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PostViewSet,
    PostListDetailFilter,
    PostDetail,
    PostQueryRetrieveView,
    CreatePost, 
    EditPost, 
    AdminPostDetail, 
    DeletePost,
    user_info,
    GoogleAuthView,  # ✅ Add this
)
from .views import GoogleAuthView

app_name = 'blog_api'

router = DefaultRouter()
router.register('posts', PostViewSet, basename='post')

urlpatterns = [
    path('api/user-info/', user_info),
    path('auth/google/', GoogleAuthView.as_view(), name='google-login'),
    path('', include(router.urls)),  # Handles /posts/ (list, detail, create, update, delete)
    path('posts/by-slug/', PostDetail.as_view(), name='post-by-slug'),
    path('search/', PostListDetailFilter.as_view(), name='postsearch'),
    path('posts/query/', PostQueryRetrieveView.as_view(), name='postquery'),
    path('admin/create/', CreatePost.as_view(), name='createpost'),
    path('admin/edit/postdetail/<int:pk>/', AdminPostDetail.as_view(), name='admindetailpost'),
    path('admin/edit/<int:pk>/', EditPost.as_view(), name='editpost'),
    path('admin/delete/<int:pk>/', DeletePost.as_view(), name='deletepost'),

    # ✅ Add Google OAuth endpoint here
    path('auth/google/', GoogleAuthView.as_view(), name='google-login'),
]
