from django.shortcuts import render
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import Message
from .serializers import MessageSerializer  # Remove ConversationSerializer import
from django.contrib.auth import get_user_model
from django.db.models import Q
import uuid
import logging

logger = logging.getLogger("django")
User = get_user_model()

# PeerQuestBackEnd/messaging/views.py
# This file contains views for handling messaging functionality, including listing conversations and messages.
class ConversationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        print(f"[DEBUG] Fetching conversations for user: {user.id} ({user.username})")
        
        # Get all users this user has messaged with
        sent_to = Message.objects.filter(sender=user).values_list('recipient', flat=True)
        received_from = Message.objects.filter(recipient=user).values_list('sender', flat=True)
        participant_ids = set(list(sent_to) + list(received_from))
        participant_ids.discard(user.id)
        
        print(f"[DEBUG] Found participant IDs: {participant_ids}")
        
        conversations = []
        for pid in participant_ids:
            try:
                other_user = User.objects.get(id=pid)
                last_msg = Message.objects.filter(
                    Q(sender=user, recipient_id=pid) | Q(sender_id=pid, recipient=user)
                ).order_by('-timestamp').first()
                
                if last_msg:
                    participants = [
                        {
                            'id': str(user.id),  # Convert to string for consistency
                            'username': user.username,
                            'email': user.email,
                            'level': getattr(user, 'level', None)
                        },
                        {
                            'id': str(other_user.id),  # Convert to string for consistency
                            'username': other_user.username,
                            'email': other_user.email,
                            'level': getattr(other_user, 'level', None)
                        }
                    ]
                    conversations.append({
                        'id': str(pid),  # Use the other user's ID as conversation ID (as string)
                        'participants': participants,
                        'last_message': last_msg.content,
                        'last_message_date': last_msg.timestamp,
                        'unread_count': Message.objects.filter(sender=other_user, recipient=user, is_read=False).count(),
                    })
            except User.DoesNotExist:
                print(f"[DEBUG] User with ID {pid} not found")
                continue
        
        print(f"[DEBUG] Returning {len(conversations)} conversations")
        return Response(conversations)


class MessageListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, conversation_id):
        try:
            user = request.user
            other_user_id = conversation_id  # This is actually the other user's ID
            logger.info(f"[DEBUG] Fetching messages between {user.id} and {other_user_id}")
            
            # Handle both UUID strings and UUID objects
            try:
                if isinstance(other_user_id, str):
                    # Try to parse as UUID if it's a string
                    try:
                        other_user_uuid = uuid.UUID(other_user_id)
                        logger.info(f"[DEBUG] Parsed UUID: {other_user_uuid}")
                    except ValueError as e:
                        logger.error(f"[DEBUG] Invalid UUID format: {other_user_id}, error: {e}")
                        return Response({'error': 'Invalid user ID format'}, status=400)
                else:
                    other_user_uuid = other_user_id
                    
                # Verify the other user exists
                try:
                    other_user = User.objects.get(id=other_user_uuid)
                    logger.info(f"[DEBUG] Found other user: {other_user.username}")
                except User.DoesNotExist:
                    logger.error(f"[DEBUG] User with ID {other_user_uuid} not found")
                    return Response({'error': 'User not found'}, status=404)
                    
                messages = Message.objects.filter(
                    Q(sender=user, recipient=other_user) | Q(sender=other_user, recipient=user)
                ).order_by('timestamp')
                
                logger.info(f"[DEBUG] Found {messages.count()} messages")
                
                # Serialize the messages
                serializer = MessageSerializer(messages, many=True)
                return Response(serializer.data)
                
            except Exception as e:
                logger.error(f"[DEBUG] Error in message query: {e}")
                return Response({'error': 'Database error'}, status=500)
                
        except Exception as e:
            logger.error(f"[DEBUG] General error in MessageListView: {e}")
            return Response({'error': str(e)}, status=500)

# ADD THIS VIEW FOR SENDING MESSAGES:
class SendMessageView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            receiver_id = request.data.get('receiver_id')
            content = request.data.get('content', '')
            
            if not receiver_id:
                return Response({'error': 'receiver_id is required'}, status=400)
            
            if not content.strip():
                return Response({'error': 'Message content cannot be empty'}, status=400)
            
            try:
                # Handle UUID conversion
                if isinstance(receiver_id, str):
                    try:
                        receiver_uuid = uuid.UUID(receiver_id)
                    except ValueError:
                        receiver_uuid = receiver_id
                else:
                    receiver_uuid = receiver_id
                    
                receiver = User.objects.get(id=receiver_uuid)
            except User.DoesNotExist:
                return Response({'error': 'Receiver not found'}, status=404)
            
            # Create the message
            message = Message.objects.create(
                sender=request.user,
                recipient=receiver,
                content=content,
                is_read=False
            )
            
            # Serialize the message for response
            message_data = {
                'id': message.id,
                'sender': {
                    'id': str(message.sender.id),
                    'username': message.sender.username,
                    'email': message.sender.email,
                },
                'receiver': {
                    'id': str(message.recipient.id),
                    'username': message.recipient.username,
                    'email': message.recipient.email,
                },
                'content': message.content,
                'created_at': message.timestamp.isoformat(),
                'read': message.is_read
            }
            
            return Response(message_data, status=201)
            
        except Exception as e:
            logger.error(f"[DEBUG] Error in SendMessageView: {e}")
            return Response({'error': str(e)}, status=500)
        
# ADD THIS VIEW FOR USER SEARCH:
class UserSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        query = request.GET.get('q', '')
        if len(query) < 2:
            return Response([])
       
        users = User.objects.filter(
            Q(username__icontains=query) | Q(email__icontains=query)
        ).exclude(id=request.user.id)[:10]
       
        user_data = [{
            'id': str(user.id),  # Convert to string for consistency
            'username': user.username,
            'email': user.email,
        } for user in users]
       
        logger.info(f"User search query: {query}, found {len(user_data)} users")
        return Response(user_data)

# ADD THIS VIEW FOR STARTING CONVERSATIONS:
class StartConversationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        participant_id = request.data.get('participant_id')
        
        if not participant_id:
            return Response({'error': 'participant_id is required'}, status=400)
        
        try:
            # Handle UUID conversion
            if isinstance(participant_id, str):
                try:
                    participant_uuid = uuid.UUID(participant_id)
                except ValueError:
                    participant_uuid = participant_id
            else:
                participant_uuid = participant_id
                
            other_user = User.objects.get(id=participant_uuid)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        
        # Check if conversation already exists
        existing_messages = Message.objects.filter(
            Q(sender=request.user, recipient=other_user) | 
            Q(sender=other_user, recipient=request.user)
        ).first()
        
        participants = [
            {
                'id': str(request.user.id),
                'username': request.user.username,
                'email': request.user.email,
                'level': getattr(request.user, 'level', None)
            },
            {
                'id': str(other_user.id),
                'username': other_user.username,
                'email': other_user.email,
                'level': getattr(other_user, 'level', None)
            }
        ]
        
        if existing_messages:
            # Return existing conversation info
            last_message = Message.objects.filter(
                Q(sender=request.user, recipient=other_user) | 
                Q(sender=other_user, recipient=request.user)
            ).order_by('-timestamp').first()
            
            return Response({
                'id': str(other_user.id),  # Use other user's ID as conversation ID
                'participants': participants,
                'last_message': last_message.content if last_message else '',
                'last_message_date': last_message.timestamp if last_message else None,
                'unread_count': Message.objects.filter(sender=other_user, recipient=request.user, is_read=False).count(),
            })
        
        # Create new conversation by returning empty conversation info
        return Response({
            'id': str(other_user.id),  # Use other user's ID as conversation ID
            'participants': participants,
            'last_message': '',
            'last_message_date': None,
            'unread_count': 0,
        })
