from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import filters
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
import requests
from .models import NewUser, UserSkill, UserAchievement
from .serializers import (
    UserProfileSerializer, 
    UserSkillSerializer, 
    UserAchievementSerializer
)

from .serializers import GoogleAuthSerializer, UserProfileSerializer
from rest_framework_simplejwt.tokens import RefreshToken


class GoogleLoginView(APIView):
    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get access token from Google
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            'code': serializer.validated_data.get('code'),
            'client_id': settings.GOOGLE_OAUTH2_CLIENT_ID,
            'client_secret': settings.GOOGLE_OAUTH2_CLIENT_SECRET,
            'redirect_uri': settings.GOOGLE_OAUTH2_REDIRECT_URI,
            'grant_type': 'authorization_code'
        }
        
        try:
            token_response = requests.post(token_url, data=data)
            token_response.raise_for_status()
            token_data = token_response.json()
            
            # Get user info from Google
            user_info_url = "https://www.googleapis.com/oauth2/v3/userinfo"
            headers = {'Authorization': f"Bearer {token_data['access_token']}"}
            user_info_response = requests.get(user_info_url, headers=headers)
            user_info_response.raise_for_status()
            user_info = user_info_response.json()
            
            # Create or update user
            try:
                user = User.objects.get(google_id=user_info['sub'])
            except ObjectDoesNotExist:
                # Check if email exists but google_id is missing
                if 'email' in user_info:
                    try:
                        user = User.objects.get(email=user_info['email'])
                        user.google_id = user_info['sub']
                        user.save()
                    except ObjectDoesNotExist:
                        # Create new user
                        user = User.objects.create(
                            google_id=user_info['sub'],
                            email=user_info.get('email', ''),
                            username=user_info.get('email', '').split('@')[0],
                            first_name=user_info.get('given_name', ''),
                            last_name=user_info.get('family_name', ''),
                            avatar_url=user_info.get('picture', ''),
                            is_active=True
                        )
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserProfileSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
            
        except requests.exceptions.RequestException as e:
            return Response(
                {'error': 'Failed to authenticate with Google'},
                status=status.HTTP_400_BAD_REQUEST
            )
        

class ALLUserProfileView(generics.ListCreateAPIView):
    queryset = NewUser.objects.all()
    serializer_class = UserProfileSerializer

class UserProfileView(APIView):
    """
    Handle user profile operations
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, user_id=None):
        """Get user profile - own or others"""
        if user_id:
            user = get_object_or_404(User, id=user_id)
        else:
            user = request.user
            
        serializer= UserProfileSerializer(user, context={'request': request})
        return Response(serializer.data)
    
    def put(self, request):
        """Update own profile"""
        serializer = UserProfileSerializer(
            request.user, 
            data=request.data, 
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request):
        """Partial update own profile"""
        serializer = UserProfileSerializer(
            request.user, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserSkillViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for user skills
    """
    serializer_class = UserSkillSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['skill_category', 'proficiency_level']
    search_fields = ['skill_name', 'description']
    ordering_fields = ['created_at', 'proficiency_level']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return skills for the authenticated user"""
        return UserSkill.objects.filter(user=self.request.user).select_related('user')
    
    def perform_create(self, serializer):
        """Automatically assign skill to current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get available skill categories"""
        categories = UserSkill.objects.filter(
            user=request.user
        ).values_list('skill_category', flat=True).distinct()
        return Response({'categories': list(categories)})
    
    @action(detail=False, methods=['get'])
    def top_skills(self, request):
        """Get user's top skills by proficiency"""
        top_skills = self.get_queryset().filter(
            proficiency_level__gte=4
        ).order_by('-proficiency_level')[:5]
        serializer = self.get_serializer(top_skills, many=True)
        return Response(serializer.data)


class UserAchievementViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for user achievements
    """
    serializer_class = UserAchievementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['achievement_type', 'is_public']
    ordering_fields = ['earned_date', 'created_at']
    ordering = ['-earned_date']
    
    def get_queryset(self):
        """Return achievements for the authenticated user"""
        return UserAchievement.objects.filter(user=self.request.user).select_related('user')
    
    def perform_create(self, serializer):
        """Automatically assign achievement to current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent achievements (last 30 days)"""
        from datetime import datetime, timedelta
        recent_date = datetime.now() - timedelta(days=30)
        recent_achievements = self.get_queryset().filter(
            earned_date__gte=recent_date
        )
        serializer = self.get_serializer(recent_achievements, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def public(self, request):
        """Get public achievements for profile display"""
        public_achievements = self.get_queryset().filter(is_public=True)
        serializer = self.get_serializer(public_achievements, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get achievement statistics"""
        queryset = self.get_queryset()
        stats = {
            'total_achievements': queryset.count(),
            'public_achievements': queryset.filter(is_public=True).count(),
            'achievement_types': queryset.values('achievement_type').distinct().count(),
            'latest_achievement': queryset.first().title if queryset.exists() else None
        }
        return Response(stats)