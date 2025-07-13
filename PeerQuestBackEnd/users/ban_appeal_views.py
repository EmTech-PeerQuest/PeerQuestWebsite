from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.utils import timezone
from .models import BanAppeal
from .ban_appeal_serializers import BanAppealSerializer

class BanAppealSubmitView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Accept email for unauthenticated ban appeals
        email = request.data.get('email', '').strip().lower()
        message = request.data.get('message', '')
        files = request.FILES.getlist('files')
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not message:
            return Response({'detail': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        from .models import User, BanAppealFile
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'No user found with that email.'}, status=status.HTTP_404_NOT_FOUND)
        if not user.is_banned:
            return Response({'detail': 'This user is not currently banned.'}, status=status.HTTP_400_BAD_REQUEST)

        appeal = BanAppeal.objects.create(user=user, message=message)
        for f in files:
            BanAppealFile.objects.create(appeal=appeal, file=f)

        return Response({'detail': 'Appeal submitted.'}, status=status.HTTP_201_CREATED)

class BanAppealListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check if we should filter by status
        status_filter = request.query_params.get('status', 'pending')
        
        if status_filter == 'all':
            appeals = BanAppeal.objects.all().order_by('-created_at')
        elif status_filter == 'resolved':
            appeals = BanAppeal.objects.filter(reviewed=True).order_by('-created_at')
        else:  # default to pending
            appeals = BanAppeal.objects.filter(reviewed=False).order_by('-created_at')
            
        serializer = BanAppealSerializer(appeals, many=True)
        return Response(serializer.data)

class BanAppealReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, appeal_id):
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        try:
            appeal = BanAppeal.objects.get(pk=appeal_id)
        except BanAppeal.DoesNotExist:
            return Response({'detail': 'Appeal not found.'}, status=status.HTTP_404_NOT_FOUND)
        decision = request.data.get('decision')
        comment = request.data.get('comment', '')
        if decision not in ['dismissed', 'lifted']:
            return Response({'detail': 'Invalid decision.'}, status=status.HTTP_400_BAD_REQUEST)
        appeal.reviewed = True
        appeal.reviewed_by = request.user
        appeal.review_decision = decision
        appeal.review_comment = comment
        appeal.reviewed_at = timezone.now()
        appeal.save()

        # Log the action
        from .models import ActionLog
        action = 'ban_lifted' if decision == 'lifted' else 'ban_dismissed'
        ActionLog.objects.create(
            action=action,
            admin=request.user,
            target_user=appeal.user,
            details=f"Appeal ID: {appeal.id}, Comment: {comment}"
        )

        # If ban is lifted, unban the user
        if decision == 'lifted':
            user = appeal.user
            user.is_banned = False
            user.ban_reason = None
            user.ban_expires_at = None
            user.save()
        return Response({'detail': 'Appeal reviewed.'})
