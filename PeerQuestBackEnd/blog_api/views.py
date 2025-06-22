from rest_framework import generics, viewsets, filters, permissions, status
from rest_framework.permissions import SAFE_METHODS, BasePermission, AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.generics import ListAPIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta

from blog.models import Post
from .serializers import PostSerializer

# For Google Auth
from django.contrib.auth import get_user_model

User = get_user_model()

from google.oauth2 import id_token
from google.auth.transport import requests
from oauth2_provider.models import Application, AccessToken, RefreshToken
from oauth2_provider.settings import oauth2_settings
from oauthlib.common import generate_token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_info(request):
    user = request.user
    return Response({
        'email': user.email,
        'user_name': user.user_name,
        'first_name': user.first_name,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser
    })


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            idinfo = id_token.verify_oauth2_token(token, requests.Request())

            email = idinfo.get('email')
            name = idinfo.get('name', '')
            first_name = name.split()[0] if name else ''
            # Note: no 'last_name' or 'username' fields on your custom user model

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'user_name': email.split('@')[0],  # username is your user_name field
                    'first_name': first_name,
                }
            )

            # Replace with your actual OAuth2 client ID from Application in admin
            application = Application.objects.get(client_id='HzUMg62DjoHgrtPSnMqKy2qs8hPBneywrmApogvu')

            access_token = AccessToken.objects.create(
                user=user,
                token=generate_token(),
                application=application,
                expires=timezone.now() + timedelta(seconds=oauth2_settings.ACCESS_TOKEN_EXPIRE_SECONDS),
                scope='read write'
            )

            refresh_token = RefreshToken.objects.create(
                user=user,
                token=generate_token(),
                application=application,
                access_token=access_token
            )

            return Response({
                'access_token': access_token.token,
                'refresh_token': refresh_token.token,
                'expires_in': oauth2_settings.ACCESS_TOKEN_EXPIRE_SECONDS,
                'token_type': 'Bearer'
            })

        except ValueError:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print('Unexpected error:', e)
            return Response({'error': 'Server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ✅ Custom permission: only authors can write
class PostUserWritePermission(BasePermission):
    message = 'Editing posts is restricted to the author only.'

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.author == request.user


# ✅ List or create post
class PostList(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Post.postobjects.all()
    serializer_class = PostSerializer


# ✅ Full CRUD viewset by slug
class PostViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Post.postobjects.all()
    serializer_class = PostSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), PostUserWritePermission()]
        return [AllowAny()]


# ✅ Search by slug/title
class PostListDetailFilter(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['$title', 'slug']


# ✅ Regex-based slug search
class PostSearch(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['^slug']


# ✅ Get single post by query param (?slug= or ?title=)
class PostQueryRetrieveView(generics.RetrieveAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        slug = self.request.query_params.get('slug')
        title = self.request.query_params.get('title')
        if slug:
            return get_object_or_404(Post, slug=slug)
        elif title:
            return get_object_or_404(Post, title=title)
        raise ValueError("Please provide 'slug' or 'title' as query parameter.")


# ✅ Read/update/delete (author only)
class PostDetail(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, PostUserWritePermission]
    queryset = Post.objects.all()
    serializer_class = PostSerializer


# ✅ Admin single post
class AdminPostDetail(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Post.objects.all()
    serializer_class = PostSerializer


# ✅ Create post (supports images/files)
class CreatePost(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, format=None):
        print(request.data)
        serializer = PostSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ✅ Edit post
class EditPost(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Post.objects.all()
    serializer_class = PostSerializer


# ✅ Delete post
class DeletePost(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Post.objects.all()
    serializer_class = PostSerializer


# ✅ Admin post list
class AdminPostListView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Post.objects.all()
    serializer_class = PostSerializer

# 📝 Your original ViewSet draft (kept for reference)

# class PostList(viewsets.ViewSet):
#     permission_classes = [IsAuthenticated]
#     queryset = Post.postobjects.all()

#     def list(self, request):
#         serializer_class = PostSerializer(self.queryset, many=True)
#         return Response(serializer_class.data)

#     def retrieve(self, request, pk=None):
#         post = get_object_or_404(self.queryset, pk=pk)
#         serializer_class = PostSerializer(post)
#         return Response(serializer_class.data)

    # def list(self, request): pass
    # def create(self, request): pass
    # def retrieve(self, request, pk=None): pass
    # def update(self, request, pk=None): pass
    # def partial_update(self, request, pk=None): pass
    # def destroy(self, request, pk=None): pass

    # class PostList(viewsets.ModelViewSet):
    #     permission_classes = [IsAuthenticated]
    #     queryset = Post.postobjects.all()
    #     serializer_class = PostSerializer

""" Concrete View Classes
#CreateAPIView
Used for create-only endpoints.
#ListAPIView
Used for read-only endpoints to represent a collection of model instances.
#RetrieveAPIView
Used for read-only endpoints to represent a single model instance.
#DestroyAPIView
Used for delete-only endpoints for a single model instance.
#UpdateAPIView
Used for update-only endpoints for a single model instance.
##ListCreateAPIView
Used for read-write endpoints to represent a collection of model instances.
RetrieveUpdateAPIView
Used for read or update endpoints to represent a single model instance.
#RetrieveDestroyAPIView
Used for read or delete endpoints to represent a single model instance.
#RetrieveUpdateDestroyAPIView
Used for read-write-delete endpoints to represent a single model instance.
"""