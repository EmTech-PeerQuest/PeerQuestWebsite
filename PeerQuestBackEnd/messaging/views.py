from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.views import APIView # Keep if you still use other APIViews
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from .models import Message, Conversation, MessageAttachment, UserPresence
from .serializers import MessageSerializer, ConversationSerializer, MessageAttachmentSerializer
from django.contrib.auth import get_user_model
from django.db.models import Q, Prefetch
import uuid
import logging
from PIL import Image
import os
from django.conf import settings

logger = logging.getLogger("django")
User = get_user_model()

# --- NEW/MODIFIED VIEW ---
class ConversationListCreateView(generics.ListCreateAPIView): # <--- Changed base class to ListCreateAPIView
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ConversationSerializer # We'll use this for POST, and potentially for GET if it suits

    def get_queryset(self):
        user = self.request.user
        logger.info(f"[DEBUG] Fetching conversations for user: {user.id} ({user.username})")
        # Ensure only conversations the user is a participant in are returned
        return Conversation.objects.filter(
            participants=user
        ).prefetch_related(
            'participants',
            Prefetch('messages', queryset=Message.objects.order_by('-timestamp'))
        ).order_by('-updated_at').distinct() # .distinct() to avoid duplicates if user is participant multiple times

    # Custom get_serializer_context for additional data needed in serializer
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request # Essential for serializer to access request.user
        return context

    def list(self, request, *args, **kwargs):
        # Override `list` method to return the custom formatted data for GET request
        queryset = self.get_queryset()
        conversation_data = []
        for conversation in queryset:
            last_message = conversation.get_last_message()
            # other_participant is primarily for 1-on-1 display logic, not strictly needed for group list
            # For 1-on-1, ConversationSerializer should handle participants correctly.
            # No need to iterate participants and get presence here; serializer can handle this.

            # The serializer should ideally handle the representation.
            # If your existing ConversationSerializer is good enough for GET, just use it:
            # return super().list(request, *args, **kwargs) # Uncomment this and remove custom loop if serializer handles all needed fields

            # If you still need this custom formatting for GET, keep it, but it duplicates serializer's job
            participants_data = []
            for participant in conversation.participants.all():
                is_online = False
                try:
                    presence = participant.presence
                    is_online = presence.is_online
                except UserPresence.DoesNotExist:
                    pass # User has no presence record yet

                participants_data.append({
                    'id': str(participant.id),
                    'username': participant.username,
                    'email': participant.email,
                    'avatar': getattr(participant, 'avatar', None),
                    'level': getattr(participant, 'level', 1),
                    'is_online': is_online, # Use the determined online status
                })

            conversation_data.append({
                'id': str(conversation.id),
                'participants': participants_data, # Use the collected participants data
                'last_message': last_message.content if last_message else '',
                'last_message_date': last_message.timestamp if last_message else conversation.created_at,
                'unread_count': Message.objects.filter(
                    conversation=conversation,
                    recipient=request.user, # Only unread for the current user
                    is_read=False
                ).count(),
                'is_group': conversation.is_group,
                'name': conversation.name, # Use actual conversation name if it exists
                'created_at': conversation.created_at.isoformat(), # Add created_at
                'updated_at': conversation.updated_at.isoformat() # Add updated_at
            })
        logger.info(f"[DEBUG] Returning {len(conversation_data)} conversations")
        return Response(conversation_data)

    def create(self, request, *args, **kwargs):
        # This method handles the POST request for creating a new conversation
        # The `participants` list is expected in the request.data, e.g., {'participants': ['uuid1', 'uuid2']}
        # Ensure the current authenticated user is always included in the participants for a new conversation.

        # The frontend sends `participants` which is a list of User IDs (strings)
        participant_ids_from_request = request.data.get('participants', [])
        if not isinstance(participant_ids_from_request, list):
            return Response({'error': 'Participants must be a list of user IDs.'}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure current user is always among participants and convert to UUID objects if necessary for get_or_create_conversation
        all_participant_ids = list(set([str(request.user.id)] + participant_ids_from_request))

        # Frontend might send only one participant for 1-on-1, or multiple for group.
        # The `get_or_create_conversation` method needs to handle this.
        # Assuming `get_or_create_conversation` can take a list of user objects or IDs.
        
        try:
            # Fetch User objects for the given IDs
            participants_users = list(User.objects.filter(id__in=all_participant_ids))
            if len(participants_users) != len(all_participant_ids):
                # This means some provided participant IDs were not found
                return Response({'error': 'One or more participant IDs are invalid.'}, status=status.HTTP_400_BAD_REQUEST)

            # Ensure all users are unique and current user is included
            # Your `Conversation.get_or_create_conversation` method needs to be robust for this.
            # Example (assuming it takes multiple user objects or a list of user objects):
            if len(participants_users) == 2:
                # For 1-on-1, use the existing helper
                conversation = Conversation.get_or_create_conversation(participants_users[0], participants_users[1])
            elif len(participants_users) > 2:
                # For group chat, create new if not exists
                # You might need a specific method like `Conversation.create_group_conversation`
                # For now, let's assume `get_or_create_conversation` can handle multiple.
                # If not, you need to implement group chat creation logic here.
                # For simplicity, assuming your Conversation.get_or_create_conversation
                # can handle a list of participants for group chats.
                conversation, created = Conversation.objects.get_or_create_group_conversation(
                    participants=participants_users,
                    name=request.data.get('name', None) # Allow name for group chats
                )
                # If get_or_create_group_conversation doesn't exist, you'd create it directly:
                # conversation = Conversation.objects.create(is_group=True, name=request.data.get('name', None))
                # conversation.participants.set(participants_users)
            else:
                return Response({'error': 'At least two participants are required to start a conversation.'}, status=status.HTTP_400_BAD_REQUEST)

            # Serialize and return the newly created/found conversation
            serializer = self.get_serializer(conversation)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except User.DoesNotExist:
            return Response({'error': 'One or more participants not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"[DEBUG] Error creating conversation: {e}", exc_info=True)
            return Response({'error': 'Could not create conversation: ' + str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MessageListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, conversation_id):
        try:
            user = request.user
            logger.info(f"[DEBUG] Fetching messages for conversation {conversation_id}")
            
            # Get conversation by UUID
            try:
                conversation = Conversation.objects.get(id=conversation_id, participants=user)
            except Conversation.DoesNotExist:
                return Response({'error': 'Conversation not found'}, status=404)
            
            # Get messages for this conversation
            messages = Message.objects.filter(
                conversation=conversation
            ).select_related('sender', 'recipient').prefetch_related('attachments').order_by('timestamp')
            
            # Mark messages as read - Fixed: Use timezone.now()
            Message.objects.filter(
                conversation=conversation,
                recipient=user,
                is_read=False
            ).update(is_read=True, read_at=timezone.now())
            
            logger.info(f"[DEBUG] Found {messages.count()} messages")
            
            # Serialize the messages
            serializer = MessageSerializer(messages, many=True)
            return Response(serializer.data)
                
        except Exception as e:
            logger.error(f"[DEBUG] Error in MessageListView: {e}")
            return Response({'error': str(e)}, status=500)


class SendMessageView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        try:
            conversation_id = request.data.get('conversation_id')
            recipient_id = request.data.get('recipient_id')
            content = request.data.get('content', '').strip()
            files = request.FILES.getlist('files')
            
            if not conversation_id and not recipient_id:
                return Response({'error': 'conversation_id or recipient_id is required'}, status=400)
            
            if not content and not files:
                return Response({'error': 'Message content or files are required'}, status=400)
            
            # Get or create conversation
            if conversation_id:
                try:
                    conversation = Conversation.objects.get(id=conversation_id, participants=request.user)
                    recipient = conversation.get_other_participant(request.user)
                except Conversation.DoesNotExist:
                    return Response({'error': 'Conversation not found'}, status=404)
            else:
                try:
                    recipient = User.objects.get(id=recipient_id)
                    conversation = Conversation.get_or_create_conversation(request.user, recipient)
                except User.DoesNotExist:
                    return Response({'error': 'Recipient not found'}, status=404)
            
            # Determine message type
            message_type = 'text'
            if files:
                # Check if files are images
                image_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
                if any(f.content_type in image_types for f in files):
                    message_type = 'image'
                else:
                    message_type = 'file'
            
            # Create the message
            message = Message.objects.create(
                conversation=conversation,
                sender=request.user,
                recipient=recipient,
                content=content or f"Sent {len(files)} file(s)",
                message_type=message_type,
                is_read=False
            )
            
            # Handle file attachments
            attachments_data = []
            for file in files:
                # Create attachment
                attachment = MessageAttachment.objects.create(
                    message=message,
                    file=file,
                    filename=file.name,
                    file_size=file.size,
                    content_type=file.content_type
                )
                
                # Create thumbnail for images
                if attachment.is_image:
                    try:
                        self.create_thumbnail(attachment)
                    except Exception as e:
                        logger.warning(f"Failed to create thumbnail: {e}")
                
                attachments_data.append({
                    'id': str(attachment.id),
                    'filename': attachment.filename,
                    'file_size': attachment.file_size_human,
                    'content_type': attachment.content_type,
                    'file_url': attachment.file.url,
                    'thumbnail_url': attachment.thumbnail.url if attachment.thumbnail else None,
                    'is_image': attachment.is_image,
                })
            
            # Serialize the message for response
            message_data = {
                'id': str(message.id),
                'conversation_id': str(conversation.id),
                'sender': {
                    'id': str(message.sender.id),
                    'username': message.sender.username,
                    'email': message.sender.email,
                    'avatar': getattr(message.sender, 'avatar', None),
                },
                'recipient': {
                    'id': str(message.recipient.id),
                    'username': message.recipient.username,
                    'email': message.recipient.email,
                    'avatar': getattr(message.recipient, 'avatar', None),
                },
                'content': message.content,
                'message_type': message.message_type,
                'attachments': attachments_data,
                'created_at': message.timestamp.isoformat(),
                'read': message.is_read
            }
            
            return Response(message_data, status=201)
            
        except Exception as e:
            logger.error(f"[DEBUG] Error in SendMessageView: {e}")
            return Response({'error': str(e)}, status=500)
    
    def create_thumbnail(self, attachment):
        """Create thumbnail for image attachments"""
        if not attachment.is_image:
            return
        
        try:
            image = Image.open(attachment.file.path)
            image.thumbnail((200, 200), Image.Resampling.LANCZOS)
            
            # Save thumbnail
            thumb_name = f"thumb_{attachment.filename}"
            thumb_path = os.path.join(settings.MEDIA_ROOT, 'message_thumbnails', thumb_name)
            os.makedirs(os.path.dirname(thumb_path), exist_ok=True)
            
            image.save(thumb_path)
            attachment.thumbnail = f'message_thumbnails/{thumb_name}'
            attachment.save()
            
        except Exception as e:
            logger.error(f"Error creating thumbnail: {e}")


class UserSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        query = request.GET.get('q', '')
        if len(query) < 2:
            return Response([])
       
        users = User.objects.filter(
            Q(username__icontains=query) | Q(email__icontains=query)
        ).exclude(id=request.user.id)[:10]
       
        user_data = []
        for user in users:
            try:
                presence = user.presence
                is_online = presence.is_online
                last_seen = presence.last_seen
            except:
                is_online = False
                last_seen = None
                
            user_data.append({
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'avatar': getattr(user, 'avatar', None),
                'level': getattr(user, 'level', 1),
                'is_online': is_online,
                'last_seen': last_seen,
            })
       
        logger.info(f"User search query: {query}, found {len(user_data)} users")
        return Response(user_data)


class StartConversationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        participant_id = request.data.get('participant_id')
        
        if not participant_id:
            return Response({'error': 'participant_id is required'}, status=400)
        
        try:
            other_user = User.objects.get(id=participant_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        
        # Get or create conversation
        conversation = Conversation.get_or_create_conversation(request.user, other_user)
        
        # Get presence info
        try:
            presence = other_user.presence
            is_online = presence.is_online
        except:
            is_online = False
        
        participants = [
            {
                'id': str(request.user.id),
                'username': request.user.username,
                'email': request.user.email,
                'avatar': getattr(request.user, 'avatar', None),
                'level': getattr(request.user, 'level', 1),
                'is_online': True,  # Current user is online
            },
            {
                'id': str(other_user.id),
                'username': other_user.username,
                'email': other_user.email,
                'avatar': getattr(other_user, 'avatar', None),
                'level': getattr(other_user, 'level', 1),
                'is_online': is_online,
            }
        ]
        
        last_message = conversation.get_last_message()
        
        return Response({
            'id': str(conversation.id),
            'participants': participants,
            'last_message': last_message.content if last_message else '',
            'last_message_date': last_message.timestamp if last_message else conversation.created_at,
            'unread_count': Message.objects.filter(
                conversation=conversation, 
                recipient=request.user, 
                is_read=False
            ).count(),
            'is_group': conversation.is_group,
            'name': conversation.name,
        })


class UserPresenceView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Update user presence status"""
        action = request.data.get('action')  # 'online' or 'offline'
        
        if action == 'online':
            UserPresence.set_user_online(request.user)
        elif action == 'offline':
            UserPresence.set_user_offline(request.user)
        
        return Response({'status': 'success'})
