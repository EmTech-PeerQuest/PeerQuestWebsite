from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Guild, GuildMembership, GuildJoinRequest, GuildWarning
from .serializers import (
    GuildListSerializer, GuildDetailSerializer, GuildCreateUpdateSerializer,
    GuildMembershipSerializer, GuildJoinRequestSerializer, GuildWarningSerializer
)

User = get_user_model()


class GuildListView(generics.ListAPIView):
    """
    API view to list all public guilds (Guild Hall)
    Supports filtering and searching
    """
    serializer_class = GuildListSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Guild.objects.filter(
            privacy='public',
            allow_discovery=True,
            show_on_home_page=True
        ).prefetch_related('tags', 'owner')
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(tags__tag__icontains=search)
            ).distinct()
        
        # Filter by specialization
        specialization = self.request.query_params.get('specialization', None)
        if specialization:
            queryset = queryset.filter(specialization=specialization)
        
        # Filter by minimum level
        max_level = self.request.query_params.get('max_level', None)
        if max_level:
            try:
                queryset = queryset.filter(minimum_level__lte=int(max_level))
            except ValueError:
                pass
        
        return queryset


class GuildDetailView(generics.RetrieveAPIView):
    """
    API view to get detailed information about a specific guild
    """
    serializer_class = GuildDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'guild_id'
    
    def get_queryset(self):
        return Guild.objects.prefetch_related(
            'tags', 'social_links', 'memberships__user', 'owner'
        )


class GuildCreateView(generics.CreateAPIView):
    """
    API view to create a new guild
    """
    serializer_class = GuildCreateUpdateSerializer
    permission_classes = [permissions.AllowAny]  # Temporarily allow any for frontend testing
    
    def perform_create(self, serializer):
        # Use the authenticated user, or fallback to a test user for development
        user = None
        if self.request.user.is_authenticated:
            user = self.request.user
        else:
            User = get_user_model()
            user = User.objects.first()
            if not user:
                user = User.objects.create_user(
                    username='frontend_test',
                    email='frontend@test.com',
                    first_name='Frontend',
                    password='testpass123'
                )

        from django.db import transaction
        from rest_framework.exceptions import ValidationError
        GUILD_CREATION_COST = 100



        with transaction.atomic():
            # Lock user row for update to prevent race conditions
            user_refresh = user.__class__.objects.select_for_update().get(pk=user.pk)
            from rest_framework.exceptions import ValidationError
            gold_transaction = None
            # --- GOLD DEDUCTION SYSTEM: Always use UserBalance ---
            # Try to get or create the user's UserBalance row
            userbalance_obj = None
            try:
                from transactions.models import UserBalance
                userbalance_obj, created = UserBalance.objects.select_for_update().get_or_create(user=user_refresh)
            except Exception as e:
                raise ValidationError({'error': f'UserBalance model error: {str(e)}'})

            # Check and deduct gold from UserBalance.balance
            if not hasattr(userbalance_obj, 'gold_balance'):
                raise ValidationError({'error': 'Your account is missing a gold balance. Please contact support.'})
            from decimal import Decimal
            try:
                gold_available = float(userbalance_obj.gold_balance)
            except Exception:
                raise ValidationError({'error': 'Your gold balance could not be read. Please contact support.'})
            if gold_available < GUILD_CREATION_COST:
                raise ValidationError({'error': f'You need at least {GUILD_CREATION_COST} gold to create a guild. (You have: {gold_available})'})
            userbalance_obj.gold_balance = Decimal(userbalance_obj.gold_balance) - Decimal(GUILD_CREATION_COST)
            userbalance_obj.save(update_fields=["gold_balance"])

            # Create a gold transaction record if available
            try:
                from transactions.models import GoldTransaction
                gold_transaction = GoldTransaction.objects.create(
                    user=user_refresh,
                    amount=-GUILD_CREATION_COST,
                    reason='Guild creation',
                    related_object_type='guild',
                    # related_object_id will be set after guild is created
                )
            except Exception:
                gold_transaction = None

            # Save the guild
            guild = serializer.save(owner=user_refresh)
            # If transaction exists, link to guild
            if gold_transaction:
                gold_transaction.related_object_id = guild.id
                gold_transaction.save()
            # Attach gold_transaction to serializer for response if needed
            serializer._gold_transaction = gold_transaction


class GuildUpdateView(generics.UpdateAPIView):
    """
    API view to update a guild (only by owner or admins)
    """
    serializer_class = GuildCreateUpdateSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'guild_id'
    
    def get_queryset(self):
        return Guild.objects.all()
    
    def get_object(self):
        guild = super().get_object()
        # Only owner can update guild settings
        if guild.owner != self.request.user:
            self.permission_denied(
                self.request,
                message="Only the guild owner can update guild settings."
            )
        return guild


class GuildDeleteView(generics.DestroyAPIView):
    """
    API view to delete a guild (only by owner)
    """
    permission_classes = [IsAuthenticated]
    lookup_field = 'guild_id'
    
    def get_queryset(self):
        return Guild.objects.all()
    
    def get_object(self):
        guild = super().get_object()
        # Only owner can delete guild
        if guild.owner != self.request.user:
            self.permission_denied(
                self.request,
                message="Only the guild owner can delete the guild."
            )
        return guild


class MyGuildsView(generics.ListAPIView):
    """
    API view to list guilds where the user is a member
    """
    serializer_class = GuildListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Guild.objects.filter(
            memberships__user=self.request.user,
            memberships__is_active=True
        ).prefetch_related('tags', 'owner')


class GuildMembersView(generics.ListAPIView):
    """
    API view to list members of a specific guild
    """
    serializer_class = GuildMembershipSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        guild_id = self.kwargs['guild_id']
        guild = get_object_or_404(Guild, guild_id=guild_id)
        
        # Check if user is a member or if guild is public
        if not guild.is_member(self.request.user) and guild.privacy == 'private':
            return GuildMembership.objects.none()
        
        return GuildMembership.objects.filter(
            guild=guild,
            is_active=True
        ).select_related('user', 'approved_by')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_guild(request, guild_id):
    """
    API endpoint for users to join a guild
    """
    guild = get_object_or_404(Guild, guild_id=guild_id)
    user = request.user
    
    # Check if user is already a member
    if guild.is_member(user):
        return Response(
            {'error': 'You are already a member of this guild.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if user has pending request
    pending_request = GuildJoinRequest.objects.filter(guild=guild, user=user, is_approved=None).first()
    if pending_request:
        return Response(
            {'error': 'You already have a pending request for this guild.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # For declined requests, delete the old request to allow reapplication
    # This allows users to reapply after being declined
    declined_requests = GuildJoinRequest.objects.filter(guild=guild, user=user, is_approved=False)
    if declined_requests.exists():
        declined_requests.delete()
        # Log that we're allowing reapplication
        print(f"User {user.username} is reapplying to guild {guild.name} after previous decline")
    
    # Check minimum level requirement (assuming user has a level attribute)
    # You might need to adjust this based on your user model
    user_level = getattr(user, 'level', 1)  # Default to level 1 if no level attribute
    if user_level < guild.minimum_level:
        return Response(
            {'error': f'You need to be at least level {guild.minimum_level} to join this guild.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    message = request.data.get('message', '')
    
    if guild.require_approval:
        # Create join request
        join_request = GuildJoinRequest.objects.create(
            guild=guild,
            user=user,
            message=message
        )
        serializer = GuildJoinRequestSerializer(join_request)
        return Response(
            {
                'message': 'Join request submitted. Waiting for approval.',
                'join_request': serializer.data
            },
            status=status.HTTP_201_CREATED
        )
    else:
        # Auto-approve membership
        membership = GuildMembership.objects.create(
            guild=guild,
            user=user,
            role='member',
            status='approved',
            is_active=True
        )
        membership.approve(user)  # This updates the guild member count
        
        serializer = GuildMembershipSerializer(membership)
        return Response(
            {
                'message': 'Successfully joined the guild!',
                'membership': serializer.data
            },
            status=status.HTTP_201_CREATED
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_guild(request, guild_id):
    """
    API endpoint for users to leave a guild
    """
    guild = get_object_or_404(Guild, guild_id=guild_id)
    user = request.user
    
    # Check if user is the owner
    if guild.owner == user:
        return Response(
            {'error': 'Guild owner cannot leave the guild. Transfer ownership or delete the guild.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get membership
    try:
        membership = GuildMembership.objects.get(
            guild=guild,
            user=user,
            is_active=True
        )
    except GuildMembership.DoesNotExist:
        return Response(
            {'error': 'You are not a member of this guild.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    membership.leave()
    
    return Response(
        {'message': 'Successfully left the guild.'},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def guild_join_requests(request, guild_id):
    """
    API endpoint to get pending join requests for a guild (admins/owner only)
    """
    guild = get_object_or_404(Guild, guild_id=guild_id)
    
    # Check if user can manage join requests
    if not guild.is_admin(request.user):
        return Response(
            {'error': 'You do not have permission to view join requests.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get filter from query parameters
    request_type = request.GET.get('type', 'pending')  # 'pending', 'processed', or 'all'
    
    if request_type == 'pending':
        requests = GuildJoinRequest.objects.filter(
            guild=guild,
            is_approved=None
        ).select_related('user')
    elif request_type == 'processed':
        requests = GuildJoinRequest.objects.filter(
            guild=guild,
            is_approved__isnull=False
        ).select_related('user', 'processed_by').order_by('-processed_at')
    else:  # 'all'
        requests = GuildJoinRequest.objects.filter(
            guild=guild
        ).select_related('user', 'processed_by').order_by('-created_at')
    
    serializer = GuildJoinRequestSerializer(requests, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_join_request(request, guild_id, request_id):
    """
    API endpoint to approve or reject a join request (admins/owner only)
    """
    guild = get_object_or_404(Guild, guild_id=guild_id)
    join_request = get_object_or_404(GuildJoinRequest, id=request_id, guild=guild)
    
    # Check if user can manage join requests
    if not guild.is_admin(request.user):
        return Response(
            {'error': 'You do not have permission to process join requests.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    action = request.data.get('action')  # 'approve' or 'reject'
    
    if action not in ['approve', 'reject']:
        return Response(
            {'error': 'Action must be either "approve" or "reject".'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if action == 'approve':
        join_request.is_approved = True
        join_request.processed_by = request.user
        join_request.processed_at = timezone.now()
        join_request.save()
        # Create membership if not already a member
        membership, created = GuildMembership.objects.get_or_create(
            guild=guild,
            user=join_request.user,
            defaults={
                'role': 'member',
                'status': 'approved',
                'is_active': True,
                'approved_by': request.user,
                'approved_at': timezone.now(),
            }
        )
        message = f'Join request approved. {join_request.user.username} is now a member.'
    else:
        join_request.is_approved = False
        join_request.processed_by = request.user
        join_request.processed_at = timezone.now()
        join_request.save()
        message = f'Join request rejected for {join_request.user.username}.'
    
    return Response({'message': message}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def kick_member(request, guild_id, user_id):
    """
    API endpoint to kick a member from the guild (admins/owner only)
    """
    guild = get_object_or_404(Guild, guild_id=guild_id)
    
    # Check if user can kick members
    if not guild.is_admin(request.user):
        return Response(
            {'error': 'You do not have permission to kick members.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        membership = GuildMembership.objects.get(
            guild=guild,
            user_id=user_id,
            is_active=True
        )
    except GuildMembership.DoesNotExist:
        return Response(
            {'error': 'User is not a member of this guild.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Cannot kick the owner
    if membership.user == guild.owner:
        return Response(
            {'error': 'Cannot kick the guild owner.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Cannot kick another admin (unless you're the owner)
    if membership.role == 'admin' and request.user != guild.owner:
        return Response(
            {'error': 'Only the guild owner can kick admins.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    membership.kick(request.user)
    
    return Response(
        {'message': f'{membership.user.username} has been kicked from the guild.'},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_join_requests(request, guild_id):
    """
    API endpoint for users to check their own join request status for a specific guild
    """
    guild = get_object_or_404(Guild, guild_id=guild_id)
    user = request.user
    
    # Get the user's join requests for this guild
    join_requests = GuildJoinRequest.objects.filter(
        guild=guild,
        user=user
    ).order_by('-created_at')
    
    if join_requests.exists():
        # Return the most recent request
        latest_request = join_requests.first()
        serializer = GuildJoinRequestSerializer(latest_request)
        return Response(serializer.data)
    else:
        return Response({'message': 'No join requests found'}, status=status.HTTP_404_NOT_FOUND)

# --- Guild Chat Messages API ---
from .models import GuildChatMessage
from .serializers import GuildChatMessageSerializer

class GuildChatMessageListView(generics.ListAPIView):
    serializer_class = GuildChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        guild_id = self.kwargs['guild_id']
        return GuildChatMessage.objects.filter(
            guild__guild_id=guild_id
        ).order_by('created_at')


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_member_role(request, guild_id, user_id):
    """
    API endpoint for guild owners and admins to update a member's role
    """
    print(f"DEBUG: update_member_role called with guild_id={guild_id}, user_id={user_id}")
    print(f"DEBUG: request.user={request.user}, request.data={request.data}")
    
    guild = get_object_or_404(Guild, guild_id=guild_id)
    
    # Check if the requester has permission to update roles
    requester_membership = GuildMembership.objects.filter(
        guild=guild, user=request.user, is_active=True
    ).first()
    
    is_owner = request.user == guild.owner
    is_admin = requester_membership and requester_membership.role == 'admin'
    
    print(f"DEBUG: is_owner={is_owner}, is_admin={is_admin}")
    
    if not (is_owner or is_admin):
        return Response({'error': 'Only guild owners and admins can update member roles'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    # Get the member to update
    membership = get_object_or_404(GuildMembership, guild=guild, user__id=user_id, is_active=True)
    
    # Prevent updating the owner's role
    if membership.user == guild.owner:
        return Response({'error': 'Cannot update the guild owner\'s role'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Admins can only modify member roles, not other admin roles
    if is_admin and not is_owner and membership.role == 'admin':
        return Response({'error': 'Admins cannot modify other admins\' roles'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    new_role = request.data.get('role')
    if new_role not in ['member', 'admin']:
        return Response({'error': 'Invalid role. Must be "member" or "admin"'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Admins can only demote members, not promote them to admin
    if is_admin and not is_owner and new_role == 'admin':
        return Response({'error': 'Only guild owners can promote members to admin'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    # Update the role
    old_role = membership.role
    membership.role = new_role
    membership.save()
    
    # Return updated membership
    serializer = GuildMembershipSerializer(membership)
    
    return Response({
        'message': f'Member role updated from {old_role} to {new_role}',
        'membership': serializer.data
    })


# Admin-only Guild Moderation Views

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def warn_guild(request, guild_id):
    """
    Issue a warning to a guild (staff/superuser only)
    """
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {'error': 'Permission denied. Staff access required.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    guild = get_object_or_404(Guild, guild_id=guild_id)
    reason = request.data.get('reason', '')
    
    if not reason:
        return Response(
            {'error': 'Warning reason is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Add warning to guild
    warning = guild.add_warning(request.user, reason)
    
    return Response({
        'message': f'Warning issued to guild "{guild.name}"',
        'warning': GuildWarningSerializer(warning).data,
        'guild_disabled': guild.is_disabled,
        'total_warnings': guild.warning_count
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disable_guild(request, guild_id):
    """
    Manually disable a guild (staff/superuser only)
    """
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {'error': 'Permission denied. Staff access required.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    guild = get_object_or_404(Guild, guild_id=guild_id)
    reason = request.data.get('reason', 'Manually disabled by admin')
    
    guild.disable_guild(request.user, reason)
    
    return Response({
        'message': f'Guild "{guild.name}" has been disabled',
        'disabled_at': guild.disabled_at,
        'reason': guild.disable_reason
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enable_guild(request, guild_id):
    """
    Re-enable a disabled guild (staff/superuser only)
    """
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {'error': 'Permission denied. Staff access required.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    guild = get_object_or_404(Guild, guild_id=guild_id)
    
    if not guild.is_disabled:
        return Response(
            {'error': 'Guild is not currently disabled'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    guild.enable_guild()
    
    return Response({
        'message': f'Guild "{guild.name}" has been re-enabled'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dismiss_warning(request, guild_id, warning_id):
    """
    Dismiss a specific guild warning (guild owner only)
    """
    guild = get_object_or_404(Guild, guild_id=guild_id)
    warning = get_object_or_404(GuildWarning, id=warning_id, guild=guild)
    
    if not guild.is_owner(request.user):
        return Response(
            {'error': 'Only guild owners can dismiss warnings'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    if warning.is_dismissed():
        return Response(
            {'error': 'Warning has already been dismissed'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    warning.dismiss(request.user)
    
    return Response({
        'message': 'Warning dismissed successfully',
        'warning': GuildWarningSerializer(warning).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def guild_warnings(request, guild_id):
    """
    Get all warnings for a guild (guild owner/admin only)
    """
    guild = get_object_or_404(Guild, guild_id=guild_id)
    
    if not guild.is_admin(request.user):
        return Response(
            {'error': 'Permission denied. Guild admin access required.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get all warnings (not just active ones)
    warnings = GuildWarning.objects.filter(guild=guild).order_by('-issued_at')
    active_warnings = guild.get_active_warnings()
    
    return Response({
        'all_warnings': GuildWarningSerializer(warnings, many=True).data,
        'active_warnings': GuildWarningSerializer(active_warnings, many=True).data,
        'total_warnings': warnings.count(),
        'active_warnings_count': active_warnings.count(),
        'guild_disabled': guild.is_disabled
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_warnings(request, guild_id):
    """
    Reset all warnings for a guild (staff/superuser only)
    """
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {'error': 'Permission denied. Staff access required.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    guild = get_object_or_404(Guild, guild_id=guild_id)
    
    # Get count of warnings before reset
    active_warnings = guild.get_active_warnings()
    warning_count = active_warnings.count()
    
    if warning_count == 0:
        return Response(
            {'error': 'Guild has no active warnings to reset'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Reset warnings using the Guild model method
    guild.reset_warnings()
    
    return Response({
        'message': f'All warnings for guild "{guild.name}" have been reset',
        'warnings_reset': warning_count
    })
